import { evaluarYGuardar, type EvalEnv } from './_lib/evaluar-ia';

interface Env {
  DB: D1Database;
  AI: Ai;
}

type Payload = Record<string, unknown>;

const REQUIRED_FIELDS = [
  "nombre_completo",
  "telefono",
  "correo",
  "direccion",
  "declaracion_final",
] as const;

const FIELD_KEYS = [
  "nombre_completo",
  "cedula",
  "edad",
  "ocupacion",
  "telefono",
  "direccion",
  "correo",
  "ciudad",
  "barrio",
  "estrato",
  "tipo_vivienda",
  "situacion_habitacional",
  "mallas_seguridad",
  "instagram",
  "facebook",
  "como_nos_conociste",
  "familiar_nombre",
  "familiar_telefono",
  "referencia_nombre",
  "referencia_telefono",
  "por_que_adoptar",
  "genero_preferido",
  "edad_estimada_gatito",
  "responsable_gastos",
  "cuidador_principal",
  "plan_dificultad_economica",
  "plan_comportamiento",
  "plan_enfermedad",
  "plan_vacaciones",
  "tiene_otras_mascotas",
  "otras_mascotas_tipo",
  "otras_esterilizadas",
  "otras_alimento",
  "otras_anteriores",
  "adultos_casa",
  "ninos_edades",
  "todos_de_acuerdo",
  "quien_no_de_acuerdo",
  "planes_mudanza",
  "cuando_mudanza",
  "alguien_alergico",
  "quien_alergico",
  "donacion_tipo",
  "donacion_monto",
  "compromisos_aceptados",
  "declaracion_final",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "fbclid",
  "gclid",
  "landing_page",
  "referrer",
] as const;

const INT_FIELDS = new Set([
  "edad",
  "estrato",
  "mallas_seguridad",
  "tiene_otras_mascotas",
  "otras_esterilizadas",
  "adultos_casa",
  "todos_de_acuerdo",
  "planes_mudanza",
  "alguien_alergico",
  "donacion_monto",
  "declaracion_final",
]);

const TEXT_AS_JSON = new Set(["compromisos_aceptados"]);

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toIntFlag(v: unknown): number | null {
  if (
    v === true ||
    v === "true" ||
    v === 1 ||
    v === "1" ||
    v === "si" ||
    v === "sí"
  )
    return 1;
  if (v === false || v === "false" || v === 0 || v === "0" || v === "no")
    return 0;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
    return Math.trunc(Number(v));
  return null;
}

function normalize(field: string, value: unknown): unknown {
  if (value === undefined || value === null || value === "") return null;
  if (TEXT_AS_JSON.has(field)) {
    return Array.isArray(value)
      ? JSON.stringify(value)
      : JSON.stringify([value]);
  }
  if (INT_FIELDS.has(field)) return toIntFlag(value);
  return typeof value === "string" ? value.trim() : String(value);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let data: Payload;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400);
  }

  if (typeof data?._website === "string" && data._website.trim() !== "") {
    return jsonResponse({ ok: true, id: null });
  }

  for (const field of REQUIRED_FIELDS) {
    const v = data[field];
    if (
      v === undefined ||
      v === null ||
      v === "" ||
      v === false ||
      v === 0 ||
      v === "0"
    ) {
      return jsonResponse({ ok: false, error: `missing_${field}` }, 400);
    }
  }

  const correo = String(data.correo ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return jsonResponse({ ok: false, error: "invalid_correo" }, 400);
  }

  const telefono = String(data.telefono ?? "").replace(/\D/g, "");
  if (telefono.length < 7) {
    return jsonResponse({ ok: false, error: "invalid_telefono" }, 400);
  }

  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for") ||
    "";
  const ipHash = ip ? (await sha256Hex(ip)).slice(0, 16) : null;

  const values: Record<string, unknown> = {};
  for (const k of FIELD_KEYS) values[k] = normalize(k, data[k]);

  const columns = ["ip_hash", ...FIELD_KEYS, "raw_json"];
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT INTO solicitudes (${columns.join(", ")}) VALUES (${placeholders})`;
  const bindings = [
    ipHash,
    ...FIELD_KEYS.map((k) => values[k]),
    JSON.stringify(data),
  ];

  let insertedId: number | null = null;
  try {
    const result = await env.DB.prepare(sql)
      .bind(...bindings)
      .run();
    insertedId =
      (result as { meta?: { last_row_id?: number } }).meta?.last_row_id ?? null;
  } catch (err) {
    return jsonResponse(
      { ok: false, error: "db_error", detail: String(err) },
      500,
    );
  }

  // Califica la solicitud con Workers AI y guarda el dictamen en la misma fila.
  // Si la IA falla, no rompe la recepción: la solicitud queda sin evaluar y se
  // puede reintentar manualmente desde /api/evaluar/[id].
  if (insertedId !== null) {
    try {
      await evaluarYGuardar(env as EvalEnv, insertedId);
    } catch (err) {
      console.error("evaluación IA falló para solicitud", insertedId, String(err));
    }
  }

  return jsonResponse({ ok: true, id: insertedId });
};
