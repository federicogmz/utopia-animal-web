import { isAuthorized, unauthorized, type AuthEnv } from '../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

// Trazabilidad de una solicitud: GET /api/admin/historial?id=N
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthorized(request, env))) return unauthorized();

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'missing_id' }), { status: 400 });

  try {
    const { results } = await env.DB.prepare(
      `SELECT h.id, h.usuario, h.accion, h.campo, h.valor_anterior, h.valor_nuevo, h.created_at,
              COALESCE(u.nombre, h.usuario) AS usuario_nombre
       FROM solicitud_historial h
       LEFT JOIN usuarios u ON u.username = h.usuario
       WHERE h.solicitud_id = ?
       ORDER BY h.id DESC`
    ).bind(id).all();
    return Response.json({ ok: true, historial: results ?? [] });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error', detail: String(err) }), { status: 500 });
  }
};
