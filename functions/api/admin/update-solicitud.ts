import { getActor, unauthorized, type AuthEnv } from '../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

const ESTADOS_VALIDOS = new Set(['pendiente', 'proceso', 'aprobada', 'rechazada', 'cerrada']);
// Flujo consolidado: recepcion (incluye validar video y mi concepto) -> aprobado | rechazado ;
//                    aprobado -> adoptado ; cerrada (cierre sin rechazo)
const ETAPAS_VALIDAS = new Set(['recepcion', 'aprobado', 'rechazado', 'adoptado', 'cerrada']);
const MALLAS_VALIDOS = new Set(['sin_definir', 'acepta_instalar', 'ya_instaladas', 'no_acepta']);
const VIDEO_VIABLE_VALIDOS = new Set(['sin_revisar', 'si', 'no']);

// Estado heredado derivado de la etapa, para mantener compatibilidad.
function estadoDeEtapa(etapa: string): string {
  switch (etapa) {
    case 'recepcion': return 'pendiente';
    case 'aprobado':
    case 'adoptado': return 'aprobada';
    case 'rechazado': return 'rechazada';
    case 'cerrada': return 'cerrada';
    default: return 'pendiente';
  }
}

// Campos editables y cómo se normalizan desde el body.
const CAMPOS: Record<string, (v: unknown) => unknown> = {
  etapa: v => v,
  contacto_at: v => v,
  notas_humanas: v => v,
  asignado_a: v => v,
  mallas_estado: v => v,
  video_recibido: v => (v ? 1 : 0),
  video_viable: v => v,
  video_notas: v => v,
  observaciones_contacto: v => v,
  entrevista_notas: v => v,
  rescatista_asignado: v => v,
  motivo_rechazo: v => v,
  motivo_cierre: v => v,
  zona_riesgo_manual: v => (v ? 1 : 0),
};

function bad(error: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error }), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const actor = await getActor(request, env);
  if (!actor) return unauthorized();

  const body = await request.json() as Record<string, any>;
  const id = Number(body.id);
  if (!id) return bad('missing_id');

  // Validaciones de dominio
  if (body.etapa != null && !ETAPAS_VALIDAS.has(body.etapa)) return bad('invalid_etapa');
  if (body.estado != null && !ESTADOS_VALIDOS.has(body.estado)) return bad('invalid_estado');
  if (body.mallas_estado != null && !MALLAS_VALIDOS.has(body.mallas_estado)) return bad('invalid_mallas');
  if (body.video_viable != null && !VIDEO_VIABLE_VALIDOS.has(body.video_viable)) return bad('invalid_video_viable');

  // Estado actual (para diff de auditoría y para sincronizar estado/etapa).
  const actual = await env.DB.prepare('SELECT * FROM solicitudes WHERE id = ?').bind(id).first<Record<string, any>>();
  if (!actual) return bad('not_found', 404);

  // Construye el set de cambios solo con los campos presentes.
  const updates: Record<string, unknown> = {};
  for (const [campo, norm] of Object.entries(CAMPOS)) {
    if (body[campo] !== undefined) updates[campo] = norm(body[campo]);
  }
  // Si cambia la etapa, sincroniza el estado heredado.
  if (updates.etapa !== undefined) {
    updates.estado = estadoDeEtapa(String(updates.etapa));
  } else if (body.estado !== undefined) {
    updates.estado = body.estado;
  }

  const cols = Object.keys(updates);
  if (cols.length === 0 && !body.nota_historial) return bad('no_fields');

  // Diff para el historial (solo campos que realmente cambian de valor).
  const norm = (v: unknown) => (v === undefined || v === null ? '' : String(v));
  const historial: { campo: string; antes: string; despues: string; accion: string }[] = [];
  for (const c of cols) {
    const antes = norm(actual[c]);
    const despues = norm(updates[c]);
    if (antes !== despues) {
      historial.push({ campo: c, antes, despues, accion: c === 'etapa' ? 'etapa' : 'campo' });
    }
  }

  const stmts: D1PreparedStatement[] = [];

  if (cols.length > 0) {
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    stmts.push(env.DB.prepare(`UPDATE solicitudes SET ${setSql} WHERE id = ?`).bind(...values, id));
  }

  const histInsert = env.DB.prepare(
    'INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const h of historial) {
    stmts.push(histInsert.bind(id, actor, h.accion, h.campo, h.antes, h.despues));
  }
  // Nota libre opcional al historial (sin cambio de campo).
  if (typeof body.nota_historial === 'string' && body.nota_historial.trim()) {
    stmts.push(histInsert.bind(id, actor, 'nota', null, null, body.nota_historial.trim()));
  }

  try {
    if (stmts.length > 0) await env.DB.batch(stmts);
    return Response.json({ ok: true, cambios: historial.length });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error', detail: String(err) }), { status: 500 });
  }
};
