-- Migración 004 · Campos diferenciados por etapa
ALTER TABLE solicitudes ADD COLUMN observaciones_contacto TEXT;  -- Federico (etapa contacto)
ALTER TABLE solicitudes ADD COLUMN entrevista_notas TEXT;        -- Laura (etapa entrevista)
ALTER TABLE solicitudes ADD COLUMN rescatista_asignado TEXT;     -- Laura escala a rescatista (etapa entrega)
