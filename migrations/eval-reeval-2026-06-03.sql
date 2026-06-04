-- Re-evaluación IA de solicitudes · 2026-06-03
-- Actualiza #2-#6 incorporando notas humanas, video y estado de mallas.
-- Evalúa por primera vez #8-#12 (nuevas).
-- recomendacion: avanzar | revisar | descartar · trato en TÚ.

-- ===== #2 Sofía: no responde WhatsApp, sin video ni mallas -> proceso detenido (-2) =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 66,
  recomendacion = 'revisar',
  senales_buenas = '["Casa propia (estabilidad de vivienda)","Todo el hogar de acuerdo con la adopción","Buen enfoque conductual: acude a veterinaria o busca orientación","Acepta los cinco compromisos de adopción responsable","Cuidador de confianza definido para viajes"]',
  senales_alerta = '["No responde WhatsApp: proceso detenido, aún sin video ni confirmación de mallas","Indicó que la vivienda NO tiene mallas de seguridad, pese a aceptar el compromiso de mantener un espacio seguro (contradicción a aclarar)","Solicitante muy joven (19 años), estudiante: confirmar estabilidad económica real","Respuestas a los planes de adversidad muy breves o genéricas","Marcó No por ahora en la donación: confirmar disposición a apoyar (en especie o a futuro)"]',
  preguntas_followup = '["Reintentar contacto por otro canal (llamada o correo); de seguir sin respuesta, pausar la solicitud","¿Tienes previsto instalar mallas o protecciones en las ventanas antes de la entrega?","¿Cómo cubrirías los gastos veterinarios siendo estudiante? ¿Cuentas con apoyo familiar estable?","¿Estarías dispuesta a apoyar al refugio, aunque sea en especie o más adelante?"]',
  notas_ia = 'Perfil afectuoso y con vivienda propia, pero el proceso está detenido: no responde WhatsApp, no ha enviado video y no ha confirmado las mallas. Reintentar contacto por otro canal; de seguir sin respuesta, pausar. Pendiente aclarar mallas y estabilidad económica.'
WHERE id = 2;

-- ===== #3 Tamara: mallas confirmadas + video viable -> sube a 90 =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 90,
  recomendacion = 'avanzar',
  senales_buenas = '["Tuvo un gato durante 15 años: compromiso de por vida demostrado","Casa propia CON mallas de seguridad confirmadas","Video de la vivienda recibido y viable","Hijo involucrado en gastos y cuidado (red de apoyo sólida)","Respuestas maduras y empáticas: trata al gato como miembro de la familia","Cuidador definido para viajes","Dispuesta a aportar en especie: compromiso con el sostenimiento del refugio"]',
  senales_alerta = '["Edad 69: conviene confirmar un plan de contingencia a largo plazo para el gato (el hijo ya está involucrado, lo cual mitiga)","Duelo reciente por su gato anterior: validar que la decisión no sea impulsiva","Desea un gatito bebé: recordar los cuidados extra de un cachorro (cuenta con mallas y experiencia, riesgo bajo)"]',
  preguntas_followup = '["¿Quién se haría cargo del gato a largo plazo si tú no pudieras? (tu hijo ya aparece como apoyo)","¿Cómo te sientes respecto al duelo? ¿Estás lista para vincularte con un nuevo gato?"]',
  notas_ia = 'Candidata muy fuerte. Experiencia de 15 años, casa propia con mallas confirmadas, video viable y red de apoyo familiar (hijo). Las alertas son menores. Lista para avanzar; solo acompañar en los cuidados propios de un gatito bebé.'
WHERE id = 3;

-- ===== #4 Julian: acepta instalar mallas + video viable -> resuelve bloqueante, sube a 76 y avanza =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 76,
  recomendacion = 'avanzar',
  senales_buenas = '["Trabaja desde casa: mucho tiempo de acompañamiento al gato","Acepta instalar mallas de seguridad antes de la entrega","Video de la vivienda recibido y viable","Responsable único de los gastos y cuidador principal","Todo el hogar de acuerdo","Motivación reflexiva, entiende las personalidades felinas","Plan de viajes con referencia y compañero de vivienda","Dispuesto a aportar en especie: compromiso con el sostenimiento del refugio"]',
  senales_alerta = '["Vivienda arrendada: confirmar permiso de mascotas","Desea dos gatitos hermanos de 2 meses: doble responsabilidad para una primera tenencia (los hermanos se acompañan, pero requieren más recursos y vigilancia)","Primera tenencia de gato: ofrecer orientación inicial"]',
  preguntas_followup = '["¿El contrato de arriendo permite mascotas?","¿Te sientes preparado para los gastos y el cuidado de DOS gatitos a la vez? Si prefieres empezar con uno, podemos orientarte","¿Cuándo podrías tener listas las mallas? La entrega queda condicionada a su instalación"]',
  notas_ia = 'Buen perfil de dedicación (trabaja desde casa) y motivación reflexiva. El bloqueante de seguridad se resuelve: acepta instalar mallas y el video es viable. Avanzar condicionando la entrega a las mallas, confirmando el arriendo y evaluando la carga de dos gatitos para una primera tenencia.'
WHERE id = 4;

-- ===== #5 Valeria: no responde WhatsApp, sin video -> mantiene 76 con alerta de proceso =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 76,
  recomendacion = 'avanzar',
  senales_buenas = '["Ya tiene 2 gatos esterilizados: tenencia responsable comprobada","Vivienda con mallas de seguridad","Experiencia previa; el gato que falleció fue por causa genética, no por negligencia","Motivación empática y orientada al bienestar","Responsable única de gastos y cuidado"]',
  senales_alerta = '["No responde WhatsApp: proceso detenido, aún sin video","Manejo conductual por regaño o castigo: contraproducente en gatos, requiere orientación","Vivienda familiar (no propia): confirmar el acuerdo del responsable del hogar","No registró datos de familiar ni de referencia de contacto","Marcó No por ahora en la donación: confirmar disposición a apoyar (en especie o a futuro)"]',
  preguntas_followup = '["Reintentar contacto por otro canal (llamada o correo) e insistir en el video de la vivienda","¿Conoces el manejo conductual positivo en gatos? (el regaño no funciona y genera estrés)","¿El responsable del hogar está de acuerdo con un tercer gato? ¿Puedes compartir un contacto familiar y una referencia?","¿Estarías dispuesta a apoyar al refugio, aunque sea en especie o más adelante?"]',
  notas_ia = 'Buena candidata por su tenencia responsable demostrada (gatos esterilizados, mallas, experiencia), pero el proceso está detenido: no responde WhatsApp ni ha enviado video. Reintentar contacto; al retomar, orientar sobre manejo conductual positivo y completar los datos de contacto faltantes.'
WHERE id = 5;

-- ===== #6 Yulisa: mallas no aplica (bloqueante resuelto) + video viable -> sube a 78 y avanza =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 78,
  recomendacion = 'avanzar',
  senales_buenas = '["Mallas no aplican en su vivienda (casa, sin riesgo de altura): bloqueante de seguridad resuelto","Video de la vivienda recibido y viable","Responsable de gastos y cuidadora principal","Todo el hogar de acuerdo","Buen plan ante enfermedad: hacer lo posible y cubrir los gastos","Manejo conductual razonable: educar y buscar ayuda especializada","Cuidadora de confianza para viajes (su hermana)","Auxiliar de enfermería: sensibilidad al cuidado"]',
  senales_alerta = '["Casa arrendada: confirmar permiso de mascotas","Motivación muy breve (Compañía): conviene profundizar","Dato extraño: declaró 0 adultos en casa, verificar quién convive","Marcó No por ahora en la donación: confirmar disposición a apoyar (en especie o a futuro)"]',
  preguntas_followup = '["¿El arriendo permite tener mascotas?","Cuéntanos un poco más: ¿qué te motiva a adoptar y cómo te imaginas el día a día con el gato?","Declaraste 0 adultos en casa: ¿vives sola o quién más convive contigo?","¿Estarías dispuesta a apoyar al refugio, aunque sea en especie o más adelante?"]',
  notas_ia = 'Perfil con buena disposición al cuidado (área de salud, planes responsables). El principal bloqueante (mallas) queda resuelto: no aplican en su vivienda y el video es viable. Avanzar tras profundizar la motivación, verificar quién convive con ella y confirmar el permiso de arriendo.'
WHERE id = 6;

-- ===== #8 Antonio (NUEVA): adopta para su hija en duelo; capacidad económica a confirmar =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 56,
  recomendacion = 'revisar',
  senales_buenas = '["Casa con mallas de seguridad","Fuerte vínculo afectivo: llevaría al gato consigo en los viajes","Motivación emotiva y genuina (acompañar a su hija tras la pérdida de su gato)","Todo el hogar de acuerdo"]',
  senales_alerta = '["Adopta principalmente para su hija (en duelo): confirmar quién será el cuidador real día a día y que ella acompañe la decisión","Capacidad económica a confirmar: pensionado y respuesta confusa en el plan ante dificultad económica","En responsable de gastos respondió una marca de alimento (Purina), no quién asume los costos: aclarar","Vivienda arrendada: confirmar permiso de mascotas","Marcó que por ahora no puede aportar: confirmar disposición a apoyar (en especie o a futuro)"]',
  preguntas_followup = '["¿Quién se hará cargo del gato en el día a día: tú o tu hija? ¿Ella está de acuerdo y lista para asumirlo?","Siendo pensionado, ¿cómo cubrirías los gastos veterinarios y de alimentación de forma sostenida?","¿El arriendo permite tener mascotas?","Adoptar para acompañar un duelo es valioso; queremos asegurar un cuidado estable: ¿cómo lo organizarían en casa?"]',
  notas_ia = 'Solicitud emotiva: busca acompañar a su hija tras la muerte de su gato. La casa tiene mallas y hay vínculo afectivo, pero hay que aclarar puntos clave: quién será el cuidador real (él o la hija), la capacidad económica como pensionado y el permiso de arriendo. Revisar en entrevista antes de avanzar.'
WHERE id = 8;

-- ===== #9 Sara (NUEVA): apartamento con mallas; joven con dependencia económica =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 62,
  recomendacion = 'revisar',
  senales_buenas = '["Apartamento CON mallas de seguridad: riesgo de altura cubierto","Responsable de gastos y cuidadora principal","Todo el hogar de acuerdo","Cuenta con apoyo económico de su madre"]',
  senales_alerta = '["Solicitante joven (20 años) con dependencia económica de su madre: confirmar estabilidad","Respuestas a los planes de adversidad muy breves o genéricas","No registró datos de familiar ni de referencia de contacto","Vivienda arrendada: confirmar permiso de mascotas","Marcó que por ahora no puede aportar: confirmar disposición a apoyar (en especie o a futuro)"]',
  preguntas_followup = '["¿Cómo cubrirías los gastos del gato de forma estable? ¿El apoyo de tu mamá es constante?","¿Puedes compartir un contacto familiar y una referencia personal?","¿El contrato de arriendo permite mascotas?","¿Estarías dispuesta a apoyar al refugio, aunque sea en especie o más adelante?"]',
  notas_ia = 'Apartamento con mallas (riesgo de altura cubierto) y entusiasmo genuino, pero el perfil es joven y económicamente dependiente de su madre, con respuestas breves y sin datos de contacto. Revisar estabilidad económica, completar contactos y confirmar el arriendo.'
WHERE id = 9;

-- ===== #10 María Alejandra (NUEVA): experiencia y donación, pero apto sin mallas + 18 años + mudanza =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 60,
  recomendacion = 'revisar',
  senales_buenas = '["Ya tiene un gato esterilizado: tenencia previa","Manejo conductual positivo (premios, paciencia, no maltrato)","Cuenta con ahorros destinados a urgencias veterinarias","Motivación coherente: busca compañía para su gato actual","Se compromete a donar (arenero al día)"]',
  senales_alerta = '["Apartamento SIN mallas de seguridad: riesgo alto de caída en altura","Solicitante muy joven (18 años): confirmar estabilidad","Tiene planes de mudanza sin fecha definida: confirmar estabilidad y que el nuevo lugar admita mascotas","Bebé de 3 meses en casa: evaluar el manejo simultáneo de un bebé y dos gatos","Vivienda arrendada: confirmar permiso de mascotas"]',
  preguntas_followup = '["¿Puedes instalar mallas en ventanas y balcón ANTES de la entrega? Es condición para un apartamento en altura","¿Cuándo planeas mudarte y el nuevo lugar permite mascotas?","¿Cómo organizarías el cuidado de un bebé de pocos meses junto con dos gatos?","¿El arriendo actual permite mascotas?"]',
  notas_ia = 'Tiene experiencia (gato esterilizado), buen manejo conductual, ahorros y compromiso de donación. El bloqueante es la seguridad física: apartamento sin mallas. Suma la corta edad, los planes de mudanza sin fecha y un bebé de pocos meses en casa. Viable solo condicionando a mallas y aclarando la mudanza y la logística del hogar.'
WHERE id = 10;

-- ===== #11 Norelkys (NUEVA): casa con mallas, pero planes muy superficiales y sin experiencia =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 60,
  recomendacion = 'revisar',
  senales_buenas = '["Casa con mallas de seguridad","Datos de familiar y referencia completos","Plan de viajes razonable (llevarlo o dejarlo con su madre)","Todo el hogar de acuerdo"]',
  senales_alerta = '["Respuestas a los planes de adversidad muy breves y superficiales (económico, enfermedad, comportamiento)","Sin experiencia previa con gatos: ofrecer orientación inicial","Vivienda arrendada: confirmar permiso de mascotas","No respondió la sección de donación: confirmar disposición a apoyar (en especie o a futuro)"]',
  preguntas_followup = '["¿Cómo cubrirías los gastos veterinarios y de alimentación del gato?","¿Qué harías si el gato presenta una enfermedad costosa o un problema de comportamiento? Cuéntanos con más detalle","¿El arriendo permite tener mascotas?","¿Estarías dispuesta a apoyar al refugio, aunque sea en especie o más adelante?"]',
  notas_ia = 'Vivienda con mallas y contactos completos, pero las respuestas a los planes de adversidad son muy breves y superficiales, y no tiene experiencia previa. Revisar en entrevista profundizando el plan económico y de salud, confirmar el arriendo y la disposición a apoyar.'
WHERE id = 11;

-- ===== #12 Maria Clara (NUEVA): perfil reflexivo, apto propio; bloqueante = sin mallas + alergia leve propia =====
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 72,
  recomendacion = 'revisar',
  senales_buenas = '["Experiencia previa con gatos a lo largo de su vida","Apartamento propio (estabilidad de vivienda)","Respuestas reflexivas y maduras: ahorro quincenal para el veterinario, manejo conductual positivo, plan de viajes con guacal","Responsable única de gastos y cuidado","Se compromete a donar (arenero al día)","Declaró con transparencia su alergia leve, autogestionada con medicación"]',
  senales_alerta = '["Apartamento SIN mallas de seguridad: riesgo de caída en altura, agravado por querer un cachorro","Ella misma es alérgica (leve): confirmar que el manejo sea sostenible a largo plazo"]',
  preguntas_followup = '["¿Puedes instalar mallas en ventanas y balcón ANTES de la entrega? Es condición para un apartamento en altura","Sobre tu alergia leve: ¿la has manejado antes conviviendo con gatos? ¿Tu médico la considera controlable a largo plazo?","¿Cómo distribuirías el ahorro mensual entre alimento, arena y veterinario?"]',
  notas_ia = 'Buen perfil: experiencia previa, apartamento propio, respuestas reflexivas, compromiso de donación y transparencia sobre su alergia leve autogestionada. El único bloqueante real es la falta de mallas en un apartamento en altura con interés en un cachorro. Avanzar condicionando la entrega a la instalación de mallas.'
WHERE id = 12;
