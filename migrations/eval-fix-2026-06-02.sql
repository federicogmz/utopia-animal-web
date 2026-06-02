-- Reescritura de evaluaciones IA: ortografía correcta (tildes/ñ) + trato en TÚ.
-- #2-#5: solo se corrigen los textos (no se toca evaluado_at).
-- #6-#7: evaluación nueva.

UPDATE solicitudes SET
  senales_buenas = '["Casa propia (estabilidad de vivienda)","Todo el hogar de acuerdo con la adopción","Buen enfoque conductual: acude a veterinaria o busca orientación","Acepta los cinco compromisos de adopción responsable","Cuidador de confianza definido para viajes"]',
  senales_alerta = '["Indicó que la vivienda NO tiene mallas de seguridad, pese a aceptar el compromiso de mantener un espacio seguro (contradicción a aclarar)","Solicitante muy joven (19 años), estudiante: confirmar estabilidad económica real","Respuestas a los planes de adversidad muy breves o genéricas"]',
  preguntas_followup = '["¿Tienes previsto instalar mallas o protecciones en las ventanas antes de la entrega?","¿Cómo cubrirías los gastos veterinarios siendo estudiante? ¿Cuentas con apoyo familiar estable?","¿Quién asume el cuidado durante tus jornadas de estudio y docencia?"]',
  notas_ia = 'Perfil afectuoso y con vivienda propia, pero hay una contradicción clave: aceptó mantener al gato en un espacio seguro con mallas, pero declara no tenerlas. Al ser casa (no altura) el riesgo es medio. Avanzar solo tras aclarar las mallas y la estabilidad económica.'
WHERE id = 2;

UPDATE solicitudes SET
  senales_buenas = '["Tuvo un gato durante 15 años: compromiso de por vida demostrado","Casa propia CON mallas de seguridad","Hijo involucrado en gastos y cuidado (red de apoyo sólida)","Respuestas maduras y empáticas: trata al gato como miembro de la familia","Cuidador definido para viajes","Plan de enfermedad responsable, priorizando lo urgente"]',
  senales_alerta = '["Edad 69: conviene confirmar un plan de contingencia a largo plazo para el gato (el hijo ya está involucrado, lo cual mitiga)","Duelo reciente por su gato anterior: validar que la decisión no sea impulsiva"]',
  preguntas_followup = '["¿Quién se haría cargo del gato a largo plazo si tú no pudieras? (tu hijo ya aparece como apoyo)","¿Cómo te sientes respecto al duelo? ¿Estás lista para vincularte con un nuevo gato?"]',
  notas_ia = 'Candidata fuerte. Experiencia comprobada de tenencia responsable (15 años), vivienda propia con mallas, red de apoyo familiar y respuestas empáticas. Las alertas son menores y fáciles de abordar en entrevista.'
WHERE id = 3;

UPDATE solicitudes SET
  senales_buenas = '["Trabaja desde casa: mucho tiempo de acompañamiento al gato","Responsable único de los gastos y cuidador principal","Todo el hogar de acuerdo","Motivación reflexiva, entiende las personalidades felinas","Plan de viajes con referencia y compañero de vivienda"]',
  senales_alerta = '["Apartamento SIN mallas de seguridad: riesgo alto de caída, agravado por querer un gatito de 2 meses","Vivienda arrendada: confirmar permiso de mascotas y estabilidad","Aceptó el compromiso de espacio seguro, pero no tiene mallas instaladas"]',
  preguntas_followup = '["¿Estás dispuesto a instalar mallas en las ventanas y el balcón ANTES de la entrega? (condición para apartamento en altura)","¿El contrato de arriendo permite mascotas?","¿Considerarías adoptar un gato algo mayor en lugar de uno de 2 meses, más vulnerable a caídas?"]',
  notas_ia = 'Buen perfil de dedicación y motivación, pero el principal bloqueante es la seguridad física: apartamento sin mallas e interés en un gatito muy pequeño. Viable solo si se condiciona la entrega a la instalación de mallas y se confirma el permiso de arriendo.'
WHERE id = 4;

UPDATE solicitudes SET
  senales_buenas = '["Ya tiene 2 gatos esterilizados: tenencia responsable comprobada","Vivienda con mallas de seguridad","Experiencia previa; el gato que falleció fue por causa genética, no por negligencia","Motivación empática y orientada al bienestar","Responsable única de gastos y cuidado"]',
  senales_alerta = '["Manejo conductual por regaño o castigo: contraproducente en gatos, requiere orientación","Vivienda familiar (no propia): confirmar el acuerdo del responsable del hogar","No registró datos de familiar ni de referencia de contacto"]',
  preguntas_followup = '["¿Conoces el manejo conductual positivo en gatos? (el regaño no funciona y genera estrés)","¿El resto de la familia o el responsable de la casa está de acuerdo con un tercer gato?","¿Puedes compartir un contacto familiar y una referencia personal?"]',
  notas_ia = 'Buena candidata por su tenencia responsable demostrada (gatos esterilizados, mallas, experiencia). La única alerta educable es el manejo conductual por regaño, abordable con orientación del refugio. Faltan datos de contacto por completar.'
WHERE id = 5;

UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 68,
  recomendacion = 'revisar',
  senales_buenas = '["Responsable de gastos y cuidadora principal","Todo el hogar de acuerdo","Buen plan ante enfermedad: hacer lo posible y cubrir los gastos","Manejo conductual razonable: educar y buscar ayuda especializada","Cuidadora de confianza para viajes (su hermana)","Auxiliar de enfermería: sensibilidad al cuidado"]',
  senales_alerta = '["La vivienda NO tiene mallas de seguridad y desea un cachorro (más vulnerable a caídas)","Casa arrendada: confirmar permiso de mascotas","Motivación muy breve (Compañía): conviene profundizar","Dato extraño: declaró 0 adultos en casa, verificar quién convive"]',
  preguntas_followup = '["¿Puedes instalar mallas o protecciones en ventanas y balcones antes de la entrega?","¿El arriendo permite tener mascotas?","¿Quién más vive contigo y está de acuerdo con la adopción?"]',
  notas_ia = 'Perfil con buena disposición al cuidado (área de salud, planes responsables), pero falta seguridad física: sin mallas y con interés en un cachorro. Al ser casa el riesgo baja un poco. Revisar mallas, permiso de arriendo y ampliar la motivación.'
WHERE id = 6;

UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 85,
  recomendacion = 'avanzar',
  senales_buenas = '["Ya tiene 4 gatos esterilizados: tenencia responsable comprobada","Vivienda CON mallas de seguridad","Manejo conductual positivo: educación, paciencia y amor","Responsable de gastos y con apoyo (su mamá) para viajes","Flexible en edad y género: ayuda a ubicar gatos difíciles","Dispuesto a donar y con estabilidad económica (estrato 4)"]',
  senales_alerta = '["Apartamento arrendado: confirmar permiso de mascotas","Ya conviven 4 gatos: validar espacio y recursos para un quinto (evitar sobrepoblación)","Vive solo: confirmar red de apoyo ante imprevistos"]',
  preguntas_followup = '["¿El contrato de arriendo permite mascotas?","¿Cómo es el espacio y la dinámica con tus 4 gatos actuales? ¿Hay lugar y recursos para uno más?","¿Cuentas con apoyo además de tu mamá ante una emergencia?"]',
  notas_ia = 'Candidato fuerte por tenencia responsable demostrada (4 gatos esterilizados, mallas, manejo positivo) y flexibilidad para adoptar. Validar que un quinto gato no implique sobrepoblación y el permiso de arriendo. Nota: el nombre coincide con el titular de la cuenta; verificar si es una solicitud real o de prueba.'
WHERE id = 7;
