-- 008 · Migración de "hogar temporal" a "voluntariado"
-- La página /refugio/voluntariado engloba varias formas de ayudar.
-- Hogar temporal pasa a ser una de las áreas (la que exige evaluación completa).
-- Se agregan columnas para el filtro de áreas y para la ruta corta de voluntariado.

ALTER TABLE solicitudes_hogar ADD COLUMN areas_interes TEXT;              -- JSON: ["hogar_temporal","rescate",...]
ALTER TABLE solicitudes_hogar ADD COLUMN por_que_voluntario TEXT;
ALTER TABLE solicitudes_hogar ADD COLUMN disponibilidad_voluntario TEXT;
ALTER TABLE solicitudes_hogar ADD COLUMN experiencia_voluntario TEXT;
