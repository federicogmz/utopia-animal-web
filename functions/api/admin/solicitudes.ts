import { isAuthorized, unauthorized, type AuthEnv } from '../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthorized(request, env))) return unauthorized();

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM solicitudes ORDER BY fecha_envio DESC'
    ).all();
    return new Response(JSON.stringify({ ok: true, solicitudes: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error', detail: String(err) }), { status: 500 });
  }
};
