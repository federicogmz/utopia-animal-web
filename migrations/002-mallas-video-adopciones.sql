-- Migración 002 · 2026-06-02
-- Seguimiento de mallas/video en solicitudes + tabla de adopciones concretadas.

ALTER TABLE solicitudes ADD COLUMN mallas_estado TEXT DEFAULT 'sin_definir';
ALTER TABLE solicitudes ADD COLUMN video_recibido INTEGER DEFAULT 0;
ALTER TABLE solicitudes ADD COLUMN video_viable TEXT DEFAULT 'sin_revisar';
ALTER TABLE solicitudes ADD COLUMN video_notas TEXT;

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
