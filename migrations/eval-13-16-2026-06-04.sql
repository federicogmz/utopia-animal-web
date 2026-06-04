-- Evaluación IA · solicitudes #13-#16 · 2026-06-04
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 68,
  recomendacion = 'revisar',
  senales_buenas = '["Casa propia con mallas de seguridad: vivienda estable y segura", "Motivación afectuosa: dar un lugar seguro y con amor", "Buen enfoque conductual: dispuesta a buscar asesoría especializada", "Plan de viajes responsable (guardería si es necesario)", "Todo el hogar de acuerdo", "Dispuesta a aportar en especie"]',
  senales_alerta = '["Solicitante joven (21 años) y estudiante: el ingreso depende de su pareja y de conseguir trabajo pronto; confirmar estabilidad económica", "El familiar y la referencia son la misma persona (mismo número): falta una referencia independiente", "Planes ante enfermedad algo genéricos: conviene profundizar", "Sin experiencia previa con gatos"]',
  preguntas_followup = '["¿Cómo cubrirían los gastos del gato hoy, mientras consigues trabajo? ¿La pareja tiene ingreso estable?", "¿Puedes darnos una segunda referencia personal distinta de tu familiar?", "Si el gatito enfermara y el tratamiento fuera costoso, ¿cómo lo asumirían?"]',
  notas_ia = 'Perfil afectuoso, con casa propia y mallas, y disposición a aportar en especie. La principal duda es la estabilidad económica: es estudiante y el ingreso depende de la pareja y de un trabajo por conseguir. Falta además una referencia independiente. Revisar economía y completar referencia antes de avanzar.',
  etapa = 'evaluada_ia'
WHERE id = 13 AND etapa = 'recepcion';
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (13, 'ia', 'etapa', 'etapa', 'recepcion', 'evaluada_ia');
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (13, 'ia', 'nota', NULL, NULL, 'Evaluación IA: 68/100 · revisar');
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 74,
  recomendacion = 'avanzar',
  senales_buenas = '["Ya tiene una gata adulta esterilizada: tenencia responsable comprobada", "Apartamento CON mallas de seguridad: riesgo de altura cubierto", "Motivación coherente: busca una compañera para su gata", "Buen plan ante enfermedad (asumir el tratamiento sin problema)", "Contactos de familiar y referencia completos", "Todo el hogar de acuerdo"]',
  senales_alerta = '["Vivienda arrendada: confirmar permiso de mascotas", "Plan ante dificultad económica depende de ayuda de un familiar", "No respondió la sección de donación: confirmar disposición a apoyar (en especie o a futuro)", "Conviene planificar la introducción entre la gata actual y el nuevo gatito"]',
  preguntas_followup = '["¿El contrato de arriendo permite tener mascotas?", "¿Cómo planeas presentar el nuevo gatito a tu gata para que se acepten bien?", "¿Estarías dispuesta a apoyar al refugio, aunque sea en especie o más adelante?"]',
  notas_ia = 'Buena candidata: tenencia responsable demostrada (gata esterilizada), apartamento con mallas y motivación coherente de buscar compañía para su gata. Las alertas son menores y abordables: permiso de arriendo, plan económico y planificar la introducción entre gatas. Avanzar con esos chequeos.',
  etapa = 'evaluada_ia'
WHERE id = 14 AND etapa = 'recepcion';
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (14, 'ia', 'etapa', 'etapa', 'recepcion', 'evaluada_ia');
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (14, 'ia', 'nota', NULL, NULL, 'Evaluación IA: 74/100 · avanzar');
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 82,
  recomendacion = 'avanzar',
  senales_buenas = '["Casa propia con mallas de seguridad: vivienda estable y segura", "Experiencia previa con gatos (tuvieron uno por 4 años)", "Red de apoyo sólida: esposa como cuidadora principal", "Responsables de gastos en pareja, con buen plan ante enfermedad (asumir el costo)", "Se compromete a donar (Barriga llena, $50.000)", "Motivación genuina, vínculo afectivo con los gatos", "Contactos completos"]',
  senales_alerta = '["Su gato anterior falleció de leucemia felina: confirmar cuánto tiempo pasó y la desinfección del hogar antes de recibir un gatito nuevo (precaución sanitaria; al no tener gatos actuales el riesgo es bajo)", "Respuestas a los planes algo breves: profundizar manejo conductual"]',
  preguntas_followup = '["¿Hace cuánto falleció su gato por leucemia y qué desinfección han hecho en casa? (es una precaución sanitaria antes de recibir un gatito)", "¿Cómo manejarían un problema de comportamiento del gato?"]',
  notas_ia = 'Candidato fuerte: casa propia con mallas, experiencia previa, red de apoyo (esposa) y compromiso de donación de $50.000. Motivación genuina tras el duelo de su gato anterior. La única precaución relevante es sanitaria: su gato murió de leucemia, así que conviene confirmar tiempo transcurrido y desinfección del hogar. Avanzar.',
  etapa = 'evaluada_ia'
WHERE id = 15 AND etapa = 'recepcion';
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (15, 'ia', 'etapa', 'etapa', 'recepcion', 'evaluada_ia');
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (15, 'ia', 'nota', NULL, NULL, 'Evaluación IA: 82/100 · avanzar');
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 58,
  recomendacion = 'revisar',
  senales_buenas = '["Ya tiene un gato esterilizado: experiencia y tenencia responsable", "Apartamento con mallas de seguridad: riesgo de altura cubierto", "Motivación de dar compañía a su gato actual", "Todo el hogar de acuerdo"]',
  senales_alerta = '["Responsable de gastos es ''la familia'', no él mismo, y ante dificultad económica buscaría ayuda: confirmar quién asume realmente los costos del gato", "Vivienda familiar (no propia): confirmar el acuerdo del responsable del hogar", "Respuestas muy breves y poco claras (en el plan de comportamiento respondió ''los limpio'', sin relación con la pregunta)", "La referencia personal parece ser él mismo (mismo nombre): falta una referencia independiente", "Marcó que por ahora no puede aportar: confirmar disposición a apoyar (en especie o a futuro)"]',
  preguntas_followup = '["¿Quién asume directamente los gastos de alimentación y veterinaria del gato: tú o tu familia?", "Si el gato tuviera un problema de comportamiento (por ejemplo, no usar el arenero o arañar), ¿cómo lo manejarías?", "¿Puedes darnos una referencia personal independiente (alguien distinto a ti)?", "¿El responsable del hogar está de acuerdo con un segundo gato?"]',
  notas_ia = 'Tiene a favor un gato esterilizado (experiencia) y mallas, pero hay varias dudas: los gastos los asume ''la familia'' y no él, la vivienda es familiar, las respuestas son muy breves y poco claras (el plan de comportamiento no responde la pregunta), la referencia parece ser él mismo y no puede aportar por ahora. Revisar a fondo en el primer contacto.',
  etapa = 'evaluada_ia'
WHERE id = 16 AND etapa = 'recepcion';
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (16, 'ia', 'etapa', 'etapa', 'recepcion', 'evaluada_ia');
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo) VALUES (16, 'ia', 'nota', NULL, NULL, 'Evaluación IA: 58/100 · revisar');
