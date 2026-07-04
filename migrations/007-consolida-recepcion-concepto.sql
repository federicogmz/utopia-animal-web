-- Migración 007 · 2026-07-01
-- Consolida las etapas "recepcion" y "concepto" de solicitudes de adopción en una
-- sola fase, ya que el video del hogar ahora llega directo desde la página de
-- confirmación del formulario (no requiere que el equipo lo pida por WhatsApp
-- para "abrir" la etapa de concepto). Desde recepción se revisa el video y se
-- decide: aprobar o rechazar.

UPDATE solicitudes SET etapa = 'recepcion' WHERE etapa = 'concepto';
