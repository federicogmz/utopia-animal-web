import { isAuthorized, unauthorized, type AuthEnv } from '../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

const ESTADOS_VALIDOS = new Set(['pendiente', 'proceso', 'aprobada', 'rechazada']);
const MALLAS_VALIDOS = new Set(['sin_definir', 'acepta_instalar', 'ya_instaladas', 'no_acepta']);
const VIDEO_VIABLE_VALIDOS = new Set(['sin_revisar', 'si', 'no']);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthorized(request, env))) return unauthorized();

  const body = await request.json() as any;
  const { id } = body;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'missing_id' }), { status: 400 });

  if (body.estado != null && !ESTADOS_VALIDOS.has(body.estado))
    return new Response(JSON.stringify({ ok: false, error: 'invalid_estado' }), { status: 400 });
  if (body.mallas_estado != null && !MALLAS_VALIDOS.has(body.mallas_estado))
    return new Response(JSON.stringify({ ok: false, error: 'invalid_mallas' }), { status: 400 });
  if (body.video_viable != null && !VIDEO_VIABLE_VALIDOS.has(body.video_viable))
    return new Response(JSON.stringify({ ok: false, error: 'invalid_video_viable' }), { status: 400 });

  // Solo se actualizan los campos presentes en el body.
  const editable: Record<string, unknown> = {
    estado: body.estado,
    notas_humanas: body.notas_humanas,
    asignado_a: body.asignado_a,
    mallas_estado: body.mallas_estado,
    video_recibido: body.video_recibido != null ? (body.video_recibido ? 1 : 0) : undefined,
    video_viable: body.video_viable,
    video_notas: body.video_notas,
  };
  const cols = Object.keys(editable).filter(k => editable[k] !== undefined);
  if (cols.length === 0) return new Response(JSON.stringify({ ok: false, error: 'no_fields' }), { status: 400 });

  const setSql = cols.map(c => `${c} = ?`).join(', ');
  const values = cols.map(c => editable[c]);

  try {
    await env.DB.prepare(`UPDATE solicitudes SET ${setSql} WHERE id = ?`).bind(...values, id).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error', detail: String(err) }), { status: 500 });
  }
};
