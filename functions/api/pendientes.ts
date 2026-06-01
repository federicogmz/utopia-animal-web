import { isAuthorized, unauthorized, type AuthEnv } from './_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthorized(request, env))) return unauthorized();

  const { results } = await env.DB.prepare(
    `SELECT * FROM solicitudes
     WHERE evaluado_at IS NULL AND estado = 'pendiente'
     ORDER BY fecha_envio ASC
     LIMIT 50`
  ).all();

  return new Response(JSON.stringify({ ok: true, solicitudes: results ?? [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
