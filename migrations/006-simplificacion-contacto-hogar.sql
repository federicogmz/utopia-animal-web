-- Migración 006 · 2026-06-16
-- 1) Simplificación de etapas  2) fecha de contacto (alerta 4 días)  3) hogares temporales

-- ── 1. Fecha de contacto ──────────────────────────────────────────────────
-- Se marca cuando se escribe al postulante por el botón WhatsApp (pedir video).
-- Inicia la etapa "mi concepto" y es la base de la alerta de seguimiento (>4 días).
ALTER TABLE solicitudes ADD COLUMN contacto_at TEXT;

-- ── 2. Simplificación de etapas ───────────────────────────────────────────
-- Nuevo flujo:  recepcion → (contacto WhatsApp) concepto → aprobado | rechazado ;
--               aprobado → adoptado ;  cerrada (cierre sin rechazo)
UPDATE solicitudes SET etapa = 'recepcion' WHERE etapa IN ('filtro', 'evaluada_ia');
UPDATE solicitudes SET etapa = 'aprobado'  WHERE etapa IN ('entrevista', 'entrega');
UPDATE solicitudes SET etapa = 'adoptado'  WHERE etapa = 'completada';
UPDATE solicitudes SET etapa = 'rechazado' WHERE etapa = 'rechazada';
-- 'recepcion', 'concepto', 'cerrada' se conservan igual.

-- Backfill de contacto_at para las que ya superaron el concepto (usa fecha_envio
-- como aproximación, para que la lógica de la alerta no arranque vacía).
UPDATE solicitudes SET contacto_at = fecha_envio
  WHERE contacto_at IS NULL AND etapa IN ('concepto', 'aprobado', 'adoptado');

-- ── 3. Hogares temporales ─────────────────────────────────────────────────
-- Tabla espejo de solicitudes (adopción) con evaluación igual de rigurosa,
-- más campos propios de hogar temporal. Mismo motor de etapas y trazabilidad.
CREATE TABLE IF NOT EXISTS solicitudes_hogar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_envio TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT,

  nombre_completo TEXT NOT NULL,
  cedula TEXT,
  edad INTEGER,
  ocupacion TEXT,
  telefono TEXT NOT NULL,
  direccion TEXT,
  correo TEXT,
  ciudad TEXT,
  barrio TEXT,
  estrato INTEGER,

  tipo_vivienda TEXT,
  situacion_habitacional TEXT,
  mallas_seguridad INTEGER,

  instagram TEXT,
  facebook TEXT,
  como_nos_conociste TEXT,

  familiar_nombre TEXT,
  familiar_telefono TEXT,
  referencia_nombre TEXT,
  referencia_telefono TEXT,

  -- Específicos de hogar temporal
  por_que_hogar_temporal TEXT,
  cuantos_puede_acoger INTEGER,
  tiempo_disponible TEXT,             -- cuánto tiempo puede tener al gato en acogida
  experiencia_acogida TEXT,
  espacio_aislamiento INTEGER,        -- ¿puede aislar/cuarentena para casos médicos?
  disponibilidad_transporte_vet INTEGER,
  acepta_visitas_seguimiento INTEGER,
  cuidador_principal TEXT,
  responsable_gastos TEXT,            -- quién cubre alimento/arena durante la acogida

  plan_dificultad_economica TEXT,
  plan_comportamiento TEXT,
  plan_enfermedad TEXT,
  plan_vacaciones TEXT,

  tiene_otras_mascotas INTEGER,
  otras_mascotas_tipo TEXT,
  otras_esterilizadas INTEGER,
  otras_alimento TEXT,
  otras_anteriores TEXT,

  adultos_casa INTEGER,
  ninos_edades TEXT,
  todos_de_acuerdo INTEGER,
  quien_no_de_acuerdo TEXT,
  planes_mudanza INTEGER,
  cuando_mudanza TEXT,
  alguien_alergico INTEGER,
  quien_alergico TEXT,

  compromisos_aceptados TEXT,
  declaracion_final INTEGER,

  raw_json TEXT,

  evaluado_at TEXT,
  score REAL,
  senales_buenas TEXT,
  senales_alerta TEXT,
  preguntas_followup TEXT,
  recomendacion TEXT,
  notas_ia TEXT,

  estado TEXT DEFAULT 'pendiente',
  notas_humanas TEXT,
  asignado_a TEXT,
  whatsapp_confirmacion_enviada INTEGER DEFAULT 0,

  mallas_estado TEXT DEFAULT 'sin_definir',
  video_recibido INTEGER DEFAULT 0,
  video_viable TEXT DEFAULT 'sin_revisar',
  video_notas TEXT,

  etapa TEXT DEFAULT 'recepcion',
  contacto_at TEXT,
  observaciones_contacto TEXT,
  entrevista_notas TEXT,
  rescatista_asignado TEXT,
  motivo_rechazo TEXT,
  motivo_cierre TEXT
);
CREATE INDEX IF NOT EXISTS idx_hogar_etapa ON solicitudes_hogar(etapa);
CREATE INDEX IF NOT EXISTS idx_hogar_fecha ON solicitudes_hogar(fecha_envio);

-- Historial/trazabilidad para hogar temporal (mismo patrón que solicitud_historial)
CREATE TABLE IF NOT EXISTS hogar_historial (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id INTEGER NOT NULL,
  usuario TEXT NOT NULL,
  accion TEXT NOT NULL,
  campo TEXT,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes_hogar(id)
);
CREATE INDEX IF NOT EXISTS idx_hogarhist_solicitud ON hogar_historial(solicitud_id);
