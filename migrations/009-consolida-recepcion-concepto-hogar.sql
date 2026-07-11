-- Migración 009 · 2026-07-11
-- Igual que la 007 pero para solicitudes_hogar (voluntariado): consolida
-- "recepcion" y "concepto" en una sola fase de revisión. El panel ya no
-- separa un paso de "mi concepto", es la misma persona quien revisa y decide.

UPDATE solicitudes_hogar SET etapa = 'recepcion' WHERE etapa = 'concepto';
