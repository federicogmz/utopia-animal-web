// Disparador manual de evaluación con Workers AI para una solicitud puntual.
// Útil para reintentar si la evaluación automática (al recibir la solicitud)
// falló. Requiere sesión/admin. Re-evalúa aunque ya tenga dictamen (force).
import { isAuthorized, unauthorized, type AuthEnv } from '../_lib/auth';
import { evaluarYGuardar, type EvalEnv } from '../_lib/evaluar-ia';

interface Env extends AuthEnv {
  DB: D1Database;
  AI: Ai;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await isAuthorized(request, env))) return unauthorized();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonResponse({ ok: false, error: 'invalid_id' }, 400);
  }

  const ok = await evaluarYGuardar(env as EvalEnv, id, true);
  if (!ok) return jsonResponse({ ok: false, error: 'eval_failed' }, 502);
  return jsonResponse({ ok: true });
};
