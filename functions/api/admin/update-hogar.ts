import { getActor, unauthorized, type AuthEnv } from '../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

const ESTADOS_VALIDOS = new Set(['pendiente', 'proceso', 'aprobada', 'rechazada', 'cerrada']);
// recepcion (incluye validar video/mallas y decidir) -> aprobado | rechazado ; aprobado -> adoptado ; cerrada
const ETAPAS_VALIDAS = new Set(['recepcion', 'aprobado', 'rechazado', 'adoptado', 'cerrada']);
const MALLAS_VALIDOS = new Set(['sin_definir', 'acepta_instalar', 'ya_instaladas', 'no_acepta']);
const VIDEO_VIABLE_VALIDOS = new Set(['sin_revisar', 'si', 'no']);

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

const CAMPOS: Record<string, (v: unknown) => unknown> = {
  etapa: v => v,
  contacto_at: v => v,
  notas_humanas: v => v,
  mallas_estado: v => v,
  video_recibido: v => (v ? 1 : 0),
  video_viable: v => v,
  video_notas: v => v,
  rescatista_asignado: v => v,
  motivo_rechazo: v => v,
  motivo_cierre: v => v,
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

  if (body.etapa != null && !ETAPAS_VALIDAS.has(body.etapa)) return bad('invalid_etapa');
  if (body.estado != null && !ESTADOS_VALIDOS.has(body.estado)) return bad('invalid_estado');
  if (body.mallas_estado != null && !MALLAS_VALIDOS.has(body.mallas_estado)) return bad('invalid_mallas');
  if (body.video_viable != null && !VIDEO_VIABLE_VALIDOS.has(body.video_viable)) return bad('invalid_video_viable');

  const actual = await env.DB.prepare('SELECT * FROM solicitudes_hogar WHERE id = ?').bind(id).first<Record<string, any>>();
  if (!actual) return bad('not_found', 404);

  const updates: Record<string, unknown> = {};
  for (const [campo, norm] of Object.entries(CAMPOS)) {
    if (body[campo] !== undefined) updates[campo] = norm(body[campo]);
  }
  if (updates.etapa !== undefined) {
    updates.estado = estadoDeEtapa(String(updates.etapa));
    if (updates.etapa === 'concepto' && !actual.contacto_at && updates.contacto_at === undefined) {
      updates.contacto_at = new Date().toISOString();
    }
  } else if (body.estado !== undefined) {
    updates.estado = body.estado;
  }

  const cols = Object.keys(updates);
  if (cols.length === 0 && !body.nota_historial) return bad('no_fields');

  const norm = (v: unknown) => (v === undefined || v === null ? '' : String(v));
  const historial: { campo: string; antes: string; despues: string; accion: string }[] = [];
  for (const c of cols) {
    const antes = norm(actual[c]);
    const despues = norm(updates[c]);
    if (antes !== despues) historial.push({ campo: c, antes, despues, accion: c === 'etapa' ? 'etapa' : 'campo' });
  }

  const stmts: D1PreparedStatement[] = [];
  if (cols.length > 0) {
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const values = cols.map(c => updates[c]);
    stmts.push(env.DB.prepare(`UPDATE solicitudes_hogar SET ${setSql} WHERE id = ?`).bind(...values, id));
  }
  const histInsert = env.DB.prepare(
    'INSERT INTO hogar_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const h of historial) stmts.push(histInsert.bind(id, actor, h.accion, h.campo, h.antes, h.despues));
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
