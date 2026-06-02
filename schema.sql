CREATE TABLE IF NOT EXISTS solicitudes (
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

  por_que_adoptar TEXT,
  genero_preferido TEXT,
  edad_estimada_gatito TEXT,
  responsable_gastos TEXT,
  cuidador_principal TEXT,

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

  donacion_tipo TEXT,
  donacion_monto INTEGER,

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
  video_notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_estado ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_evaluado ON solicitudes(evaluado_at);
CREATE INDEX IF NOT EXISTS idx_fecha ON solicitudes(fecha_envio);

CREATE TABLE IF NOT EXISTS adopciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id INTEGER,
  nombre_gato TEXT,
  sexo TEXT,
  descripcion TEXT,
  fecha_ingreso TEXT,
  fecha_nacimiento_estimada TEXT,
  fecha_desparasitacion TEXT,
  test_sida_leucemia TEXT,
  fecha_esterilizacion_estimada TEXT,
  fecha_esterilizacion_real TEXT,
  fecha_adopcion TEXT,
  adoptante TEXT,
  adoptante_telefono TEXT,
  rescatista TEXT,
  donacion_monto INTEGER,
  estado TEXT DEFAULT 'adoptado',
  notas_seguimiento TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id)
);

CREATE INDEX IF NOT EXISTS idx_adop_solicitud ON adopciones(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_adop_esterilizacion ON adopciones(fecha_esterilizacion_estimada);
CREATE INDEX IF NOT EXISTS idx_adop_estado ON adopciones(estado);
