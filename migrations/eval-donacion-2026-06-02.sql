-- Re-evaluación con peso de donación (matiz: en especie / a futuro NO penaliza;
-- solo es red flag la falta total de voluntad de apoyar).

-- #3 Tamara: dispuesta en especie -> señal buena (mantiene 88)
UPDATE solicitudes SET
  senales_buenas = '["Tuvo un gato durante 15 años: compromiso de por vida demostrado","Casa propia CON mallas de seguridad","Hijo involucrado en gastos y cuidado (red de apoyo sólida)","Respuestas maduras y empáticas: trata al gato como miembro de la familia","Cuidador definido para viajes","Plan de enfermedad responsable, priorizando lo urgente","Dispuesta a aportar en especie: compromiso con el sostenimiento del refugio"]'
WHERE id = 3;

-- #4 Julián: dispuesto en especie -> señal buena (mantiene 66)
UPDATE solicitudes SET
  senales_buenas = '["Trabaja desde casa: mucho tiempo de acompañamiento al gato","Responsable único de los gastos y cuidador principal","Todo el hogar de acuerdo","Motivación reflexiva, entiende las personalidades felinas","Plan de viajes con referencia y compañero de vivienda","Dispuesto a aportar en especie: compromiso con el sostenimiento del refugio"]'
WHERE id = 4;

-- #2 Sofía: "No por ahora" -> aclarar disposición (-2)
UPDATE solicitudes SET
  score = 68,
  senales_alerta = '["Indicó que la vivienda NO tiene mallas de seguridad, pese a aceptar el compromiso de mantener un espacio seguro (contradicción a aclarar)","Solicitante muy joven (19 años), estudiante: confirmar estabilidad económica real","Respuestas a los planes de adversidad muy breves o genéricas","Marcó No por ahora en la donación: confirmar disposición a apoyar el sostenimiento (en especie o a futuro)"]',
  preguntas_followup = '["¿Tienes previsto instalar mallas o protecciones en las ventanas antes de la entrega?","¿Cómo cubrirías los gastos veterinarios siendo estudiante? ¿Cuentas con apoyo familiar estable?","¿Quién asume el cuidado durante tus jornadas de estudio y docencia?","¿Estarías dispuesta a apoyar al refugio, aunque sea en especie o más adelante?"]'
WHERE id = 2;

-- #5 Valeria: "No por ahora" -> aclarar disposición (-2)
UPDATE solicitudes SET
  score = 76,
  senales_alerta = '["Manejo conductual por regaño o castigo: contraproducente en gatos, requiere orientación","Vivienda familiar (no propia): confirmar el acuerdo del responsable del hogar","No registró datos de familiar ni de referencia de contacto","Marcó No por ahora en la donación: confirmar disposición a apoyar (en especie o a futuro)"]',
  preguntas_followup = '["¿Conoces el manejo conductual positivo en gatos? (el regaño no funciona y genera estrés)","¿El resto de la familia o el responsable de la casa está de acuerdo con un tercer gato?","¿Puedes compartir un contacto familiar y una referencia personal?","¿Estarías dispuesta a apoyar al refugio, aunque sea en especie o más adelante?"]'
WHERE id = 5;

-- #6 Yulisa: "No por ahora" -> aclarar disposición (-2)
UPDATE solicitudes SET
  score = 66,
  senales_alerta = '["La vivienda NO tiene mallas de seguridad y desea un cachorro (más vulnerable a caídas)","Casa arrendada: confirmar permiso de mascotas","Motivación muy breve (Compañía): conviene profundizar","Dato extraño: declaró 0 adultos en casa, verificar quién convive","Marcó No por ahora en la donación: confirmar disposición a apoyar (en especie o a futuro)"]',
  preguntas_followup = '["¿Puedes instalar mallas o protecciones en ventanas y balcones antes de la entrega?","¿El arriendo permite tener mascotas?","¿Quién más vive contigo y está de acuerdo con la adopción?","¿Estarías dispuesta a apoyar al refugio, aunque sea en especie o más adelante?"]'
WHERE id = 6;
