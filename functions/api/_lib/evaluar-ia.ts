// Evaluación automática de solicitudes de adopción con Workers AI.
// Se ejecuta al recibir cada solicitud (desde /api/solicitud vía waitUntil) y
// también puede dispararse manualmente para reintentar (/api/evaluar/[id]).
//
// Modelo: @cf/meta/llama-3.3-70b-instruct-fp8-fast con JSON Mode (response_format
// json_schema), el de mayor calidad en Workers AI con salida estructurada.
// Free tier: 10.000 neurons/día (~60 evaluaciones); el volumen real es muy menor.
//
// NUNCA cambia la etapa: la solicitud se queda en 'recepcion' para que el panel
// muestre el WhatsApp de primer contacto. La IA solo aporta el dictamen.

export interface EvalEnv {
  AI: Ai;
  DB: D1Database;
}

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export interface Evaluacion {
  score: number;
  senales_buenas: string[];
  senales_alerta: string[];
  preguntas_followup: string[];
  recomendacion: 'avanzar' | 'revisar' | 'descartar';
  notas_ia: string;
}

// Esquema de salida estructurada (JSON Mode de Workers AI).
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'number' },
    senales_buenas: { type: 'array', items: { type: 'string' } },
    senales_alerta: { type: 'array', items: { type: 'string' } },
    preguntas_followup: { type: 'array', items: { type: 'string' } },
    recomendacion: { type: 'string', enum: ['avanzar', 'revisar', 'descartar'] },
    notas_ia: { type: 'string' },
  },
  required: ['score', 'senales_buenas', 'senales_alerta', 'preguntas_followup', 'recomendacion', 'notas_ia'],
} as const;

// Criterios de evaluación de Elim — codifican el juicio aplicado históricamente.
const SYSTEM_PROMPT = `Eres el asistente de evaluación de solicitudes de adopción de gatos del Refugio Animal Elim (Medellín, Colombia). Tu trabajo es analizar cada solicitud y emitir un dictamen objetivo que ayude al equipo humano a decidir. NUNCA decides la adopción: solo orientas. Responde SIEMPRE en español de Colombia.

Evalúa con estos criterios (rubric):

SEÑALES POSITIVAS (suman):
- Mallas de seguridad ya instaladas, o disposición clara a instalarlas (crítico en apartamentos).
- Vivienda propia o estable; casa/finca con espacio seguro.
- Experiencia previa real con mascotas, especialmente gatos esterilizados.
- Plan ante dificultad económica que prioriza mantener al gato (ahorros, apoyo familiar, ajustar gastos).
- Respuestas reflexivas y detalladas que demuestran comprensión del compromiso a largo plazo.
- El solicitante es responsable directo de los gastos y el cuidado (autonomía).
- Aceptó los 5 compromisos de adopción.
- Motivación centrada en el bienestar del gato.
- Donación ofrecida (positivo, no determinante).
- Redes sociales verificables.

SEÑALES DE ALERTA (restan, requieren aclaración):
- Apartamento arrendado sin mallas de seguridad.
- Plan ante dificultad económica que contempla "dar el gato en adopción" o entregarlo: contradice el compromiso de no abandono (alerta grave).
- Solicitante menor de edad, o que depende económicamente de terceros que no participan en la solicitud.
- Motivación centrada únicamente en un niño pequeño, no en el animal.
- Gatito muy joven (1-2 meses) conviviendo con niños muy pequeños sin plan de supervisión.
- Inconsistencias en el hogar (adultos declarados vs. cuidador principal mencionado distinto).
- Información crítica faltante (tipo de vivienda, mallas, planes sin responder).
- No aceptó todos los compromisos (especialmente el de mallas/protección).
- Referencias o redes claramente falsas o inventadas.
- Barrio en zona de alto abandono del Valle de Aburrá (Comuna 4 Aranjuez, Comuna 7 Robledo, Comuna 3 Manrique, Comuna 1 Popular, San Antonio de Prado, Comuna 10 La Candelaria): exige verificación domiciliaria estricta.

SCORE (0-100) y RECOMENDACIÓN:
- "avanzar" (score 75-100): perfil sólido, sin alertas graves; listo para primer contacto.
- "revisar" (score 30-74): perfil viable pero con alertas que requieren aclarar antes de avanzar.
- "descartar" (score 0-29): no viable (menor sin intención real, solicitud de broma, contradicciones graves, datos falsos).

Sé concreto y conciso. Las preguntas de seguimiento deben ser accionables para el contacto por WhatsApp. Las señales deben ser frases cortas. Las notas_ia: 2-4 frases que resuman el dictamen y lo más importante a verificar.`;

// Construye el bloque de datos de la solicitud para el prompt.
function describirSolicitud(s: Record<string, unknown>, duplicados: string | null): string {
  const v = (x: unknown) => (x === null || x === undefined || x === '' ? '—' : String(x));
  const sino = (x: unknown) => (x === 1 || x === '1' ? 'Sí' : x === 0 || x === '0' ? 'No' : '—');
  let compromisos = '—';
  try {
    const arr = JSON.parse(String(s.compromisos_aceptados || '[]'));
    if (Array.isArray(arr)) compromisos = `${arr.length}/5 aceptados${arr.length < 5 ? ' (faltan algunos)' : ''}`;
  } catch { /* noop */ }

  const lineas = [
    `Nombre: ${v(s.nombre_completo)} | Edad: ${v(s.edad)} | Ocupación: ${v(s.ocupacion)}`,
    `Ciudad/Barrio: ${v(s.ciudad)} / ${v(s.barrio)} | Estrato: ${v(s.estrato)}`,
    `Vivienda: ${v(s.tipo_vivienda)} | Situación: ${v(s.situacion_habitacional)} | Mallas de seguridad: ${sino(s.mallas_seguridad)}`,
    `Adultos en casa: ${v(s.adultos_casa)} | Niños (edades): ${v(s.ninos_edades)} | Todos de acuerdo: ${sino(s.todos_de_acuerdo)}`,
    `Alguien alérgico: ${sino(s.alguien_alergico)} | Planes de mudanza: ${sino(s.planes_mudanza)}`,
    `Responsable de gastos: ${v(s.responsable_gastos)} | Cuidador principal: ${v(s.cuidador_principal)}`,
    `Otras mascotas: ${sino(s.tiene_otras_mascotas)} (${v(s.otras_mascotas_tipo)}, esterilizadas: ${sino(s.otras_esterilizadas)})`,
    `Mascotas anteriores: ${v(s.otras_anteriores)}`,
    `Género preferido: ${v(s.genero_preferido)} | Edad del gato deseada: ${v(s.edad_estimada_gatito)}`,
    `¿Por qué adoptar?: ${v(s.por_que_adoptar)}`,
    `Plan ante dificultad económica: ${v(s.plan_dificultad_economica)}`,
    `Plan ante comportamiento: ${v(s.plan_comportamiento)}`,
    `Plan ante enfermedad: ${v(s.plan_enfermedad)}`,
    `Plan en vacaciones: ${v(s.plan_vacaciones)}`,
    `Donación: ${v(s.donacion_tipo)} ${s.donacion_monto ? `($${v(s.donacion_monto)})` : ''}`,
    `Compromisos de adopción: ${compromisos}`,
    `Instagram: ${v(s.instagram)} | Facebook: ${v(s.facebook)} | Cómo nos conoció: ${v(s.como_nos_conociste)}`,
    `Referencia: ${v(s.referencia_nombre)} (${v(s.referencia_telefono)}) | Familiar: ${v(s.familiar_nombre)} (${v(s.familiar_telefono)})`,
  ];
  if (duplicados) lineas.push(`⚠️ POSIBLE DUPLICADO: ${duplicados}`);
  return lineas.join('\n');
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x));
  if (typeof v === 'string' && v.trim()) return [v];
  return [];
}

// Llama al modelo y devuelve la evaluación parseada, o null si falla.
export async function evaluarSolicitud(
  env: EvalEnv,
  solicitud: Record<string, unknown>,
  duplicados: string | null,
): Promise<Evaluacion | null> {
  const userPrompt = `Evalúa esta solicitud de adopción:\n\n${describirSolicitud(solicitud, duplicados)}`;

  let raw: unknown;
  try {
    const res = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
      max_tokens: 1200,
    } as Record<string, unknown>);
    // En JSON Mode, la respuesta viene en .response (objeto o string JSON).
    raw = (res as { response?: unknown }).response ?? res;
  } catch (err) {
    console.error('evaluarSolicitud AI error', String(err));
    return null;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
  } catch (err) {
    console.error('evaluarSolicitud parse error', String(err), String(raw).slice(0, 300));
    return null;
  }

  const rec = String(parsed.recomendacion || '').toLowerCase();
  const recomendacion = (['avanzar', 'revisar', 'descartar'].includes(rec) ? rec : 'revisar') as Evaluacion['recomendacion'];
  let score = Number(parsed.score);
  if (!Number.isFinite(score)) score = 0;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    senales_buenas: asArray(parsed.senales_buenas),
    senales_alerta: asArray(parsed.senales_alerta),
    preguntas_followup: asArray(parsed.preguntas_followup),
    recomendacion,
    notas_ia: String(parsed.notas_ia || ''),
  };
}

// Carga la solicitud, detecta duplicados, evalúa y guarda el resultado.
// No toca la etapa. Devuelve true si guardó. Idempotente: por defecto omite las
// ya evaluadas (salvo force=true para reintentos manuales).
export async function evaluarYGuardar(env: EvalEnv, id: number, force = false): Promise<boolean> {
  const s = await env.DB.prepare('SELECT * FROM solicitudes WHERE id = ?').bind(id).first<Record<string, unknown>>();
  if (!s) return false;
  if (!force && s.evaluado_at) return false; // ya evaluada

  // Duplicados: misma persona por correo o por IP (evita reenvíos del mismo hogar).
  let duplicados: string | null = null;
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, nombre_completo FROM solicitudes WHERE id != ? AND (correo = ? OR ip_hash = ?) LIMIT 5'
    ).bind(id, s.correo ?? '', s.ip_hash ?? '').all<{ id: number; nombre_completo: string }>();
    if (results && results.length) {
      duplicados = results.map(r => `#${r.id} ${r.nombre_completo}`).join(', ') + ' (mismo correo o IP)';
    }
  } catch { /* noop */ }

  const evalResult = await evaluarSolicitud(env, s, duplicados);
  if (!evalResult) return false;

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
    ).bind(
      evalResult.score,
      JSON.stringify(evalResult.senales_buenas),
      JSON.stringify(evalResult.senales_alerta),
      JSON.stringify(evalResult.preguntas_followup),
      evalResult.recomendacion,
      evalResult.notas_ia,
      id,
    ).run();
    return true;
  } catch (err) {
    console.error('evaluarYGuardar DB error', String(err));
    return false;
  }
}
