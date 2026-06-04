import { isAuthorized, unauthorized, type AuthEnv } from '../_lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
}

const FIELDS = [
  'solicitud_id', 'nombre_gato', 'sexo', 'descripcion', 'fecha_ingreso',
  'fecha_nacimiento_estimada', 'fecha_desparasitacion', 'test_sida_leucemia',
  'fecha_esterilizacion_estimada', 'fecha_esterilizacion_real', 'fecha_adopcion',
  'adoptante', 'adoptante_telefono', 'rescatista', 'donacion_monto',
  'estado', 'notas_seguimiento',
] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthorized(request, env))) return unauthorized();
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM adopciones ORDER BY COALESCE(fecha_adopcion, created_at) DESC'
    ).all();
    return json({ ok: true, adopciones: results ?? [] });
  } catch (err) {
    return json({ ok: false, error: 'db_error', detail: String(err) }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await isAuthorized(request, env))) return unauthorized();
  let body: any;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }

  const norm = (k: string) => {
    let v = body[k];
    if (v === '' || v === undefined) v = null;
    if (k === 'donacion_monto' || k === 'solicitud_id') v = v == null ? null : Number(v);
    return v;
  };

  try {
    if (body.id) {
      const setSql = FIELDS.map(f => `${f} = ?`).join(', ') + ', updated_at = CURRENT_TIMESTAMP';
      const values = FIELDS.map(norm);
      const r = await env.DB.prepare(`UPDATE adopciones SET ${setSql} WHERE id = ?`).bind(...values, body.id).run();
      const changes = (r as { meta?: { changes?: number } }).meta?.changes ?? 0;
      if (changes === 0) return json({ ok: false, error: 'not_found' }, 404);
      return json({ ok: true, id: body.id });
    } else {
      const cols = [...FIELDS];
      const placeholders = cols.map(() => '?').join(', ');
      const values = cols.map(norm);
      const r = await env.DB.prepare(
        `INSERT INTO adopciones (${cols.join(', ')}) VALUES (${placeholders})`
      ).bind(...values).run();
      const newId = (r as { meta?: { last_row_id?: number } }).meta?.last_row_id ?? null;
      // Si viene de una solicitud, márcala como entregada/completada.
      if (body.solicitud_id) {
        await env.DB.prepare(`UPDATE solicitudes SET estado = 'aprobada', etapa = 'completada' WHERE id = ?`).bind(Number(body.solicitud_id)).run();
      }
      return json({ ok: true, id: newId });
    }
  } catch (err) {
    return json({ ok: false, error: 'db_error', detail: String(err) }, 500);
  }
};
