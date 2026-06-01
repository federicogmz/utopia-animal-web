import { isAuthorized, unauthorized, type AuthEnv } from '../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

const ESTADOS_VALIDOS = new Set(['pendiente', 'proceso', 'aprobada', 'rechazada']);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthorized(request, env))) return unauthorized();

  const { id, estado, notas_humanas, asignado_a } = await request.json() as any;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'missing_id' }), { status: 400 });
  if (estado !== undefined && estado !== null && !ESTADOS_VALIDOS.has(estado)) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_estado' }), { status: 400 });
  }

  try {
    await env.DB.prepare(
      'UPDATE solicitudes SET estado = ?, notas_humanas = ?, asignado_a = ? WHERE id = ?'
    ).bind(estado, notas_humanas ?? null, asignado_a ?? null, id).run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error', detail: String(err) }), { status: 500 });
  }
};
