interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
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
  const auth = request.headers.get('Authorization') || '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
  }

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

  try {
    await env.DB.prepare(
      `UPDATE solicitudes
       SET evaluado_at = CURRENT_TIMESTAMP,
           score = ?,
           senales_buenas = ?,
           senales_alerta = ?,
           preguntas_followup = ?,
           recomendacion = ?,
           notas_ia = ?
       WHERE id = ?`
    ).bind(score, senales_buenas, senales_alerta, preguntas_followup, recomendacion, notas_ia, id).run();
  } catch (err) {
    return jsonResponse({ ok: false, error: 'db_error', detail: String(err) }, 500);
  }

  return jsonResponse({ ok: true });
};
