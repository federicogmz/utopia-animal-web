import { isAuthorized, unauthorized, type AuthEnv } from '../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

interface EvalPayload {
  score?: number;
  senales_buenas?: unknown;
  senales_alerta?: unknown;
  preguntas_followup?: unknown;
  recomendacion?: string;
  notas_ia?: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stringifyMaybeArray(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'string') return JSON.stringify([v]);
  return JSON.stringify(v);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, params }) => {
  if (!(await isAuthorized(request, env))) return unauthorized();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonResponse({ ok: false, error: 'invalid_id' }, 400);
  }

  let body: EvalPayload;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
  }

  const score = typeof body.score === 'number' ? body.score : null;
  const senales_buenas = stringifyMaybeArray(body.senales_buenas);
  const senales_alerta = stringifyMaybeArray(body.senales_alerta);
  const preguntas_followup = stringifyMaybeArray(body.preguntas_followup);
  const recomendacion = typeof body.recomendacion === 'string' ? body.recomendacion : null;
  const notas_ia = typeof body.notas_ia === 'string' ? body.notas_ia : null;

  let changes = 0;
  try {
    // Al calificar, la solicitud pasa de inmediato a 'contacto' (queda pendiente
    // de primer contacto en la gestión de Federico). Solo se mueve si seguía en
    // 'recepcion', para no retroceder etapas humanas ya avanzadas.
    const result = await env.DB.prepare(
      `UPDATE solicitudes
       SET evaluado_at = CURRENT_TIMESTAMP,
           score = ?,
           senales_buenas = ?,
           senales_alerta = ?,
           preguntas_followup = ?,
           recomendacion = ?,
           notas_ia = ?,
           etapa = CASE WHEN etapa = 'recepcion' THEN 'contacto' ELSE etapa END,
           estado = CASE WHEN etapa = 'recepcion' THEN 'proceso' ELSE estado END
       WHERE id = ?`
    ).bind(score, senales_buenas, senales_alerta, preguntas_followup, recomendacion, notas_ia, id).run();
    changes = (result as { meta?: { changes?: number } }).meta?.changes ?? 0;
  } catch (err) {
    return jsonResponse({ ok: false, error: 'db_error', detail: String(err) }, 500);
  }

  if (changes === 0) return jsonResponse({ ok: false, error: 'not_found' }, 404);

  return jsonResponse({ ok: true });
};
