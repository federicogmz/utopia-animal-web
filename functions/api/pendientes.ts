interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = request.headers.get('Authorization') || '';
  const expected = env.ADMIN_TOKEN;
  if (!expected) return unauthorized();
  if (auth !== `Bearer ${expected}`) return unauthorized();

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
