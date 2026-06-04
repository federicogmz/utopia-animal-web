-- Migración 005 · Flujo: pendiente IA -> filtro inicial -> mi concepto -> entrevista (Laura)
ALTER TABLE solicitudes ADD COLUMN motivo_rechazo TEXT;

-- Las que estaban en 'contacto' (post-IA, sin contactar) pasan a 'filtro inicial'
UPDATE solicitudes SET etapa = 'filtro' WHERE etapa = 'contacto';

-- Federico es dueño del filtro inicial + concepto inicial
UPDATE usuarios SET etapa_responsable = 'filtro' WHERE username = 'federico';
