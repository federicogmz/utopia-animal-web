-- Migración 003 · Flujo de adopción en etapas + usuarios + trazabilidad
-- 2026-06-04

-- 1. Usuarios de la intranet (login multiusuario + roles)
CREATE TABLE IF NOT EXISTS usuarios (
  username TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'admin',          -- 'admin' | 'contacto' | 'entrevista'
  etapa_responsable TEXT,                       -- etapa cuya cola "le pertenece" (contacto/entrevista)
  password_hash TEXT,                           -- pbkdf2$<iter>$<saltHex>$<hashHex>
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trazabilidad: historial de modificaciones por usuario
CREATE TABLE IF NOT EXISTS solicitud_historial (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  solicitud_id INTEGER NOT NULL,
  usuario TEXT NOT NULL,                         -- username que ejecutó la acción ('ia' para el batch)
  accion TEXT NOT NULL,                          -- 'campo' | 'etapa' | 'nota'
  campo TEXT,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (solicitud_id) REFERENCES solicitudes(id)
);
CREATE INDEX IF NOT EXISTS idx_hist_solicitud ON solicitud_historial(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_hist_fecha ON solicitud_historial(created_at);

-- 3. Etapa del flujo en solicitudes
--    recepcion -> evaluada_ia -> contacto -> entrevista -> entrega -> completada ; rechazada
ALTER TABLE solicitudes ADD COLUMN etapa TEXT DEFAULT 'recepcion';
CREATE INDEX IF NOT EXISTS idx_etapa ON solicitudes(etapa);

-- 4. Backfill de etapa para las solicitudes existentes
UPDATE solicitudes SET etapa = 'rechazada'   WHERE estado = 'rechazada';
UPDATE solicitudes SET etapa = 'entrega'     WHERE estado = 'aprobada';
UPDATE solicitudes SET etapa = 'recepcion'   WHERE evaluado_at IS NULL AND etapa NOT IN ('rechazada','entrega');
UPDATE solicitudes SET etapa = 'evaluada_ia' WHERE evaluado_at IS NOT NULL AND etapa NOT IN ('rechazada','entrega');
