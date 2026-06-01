-- Evaluación IA de solicitudes pendientes · 2026-06-01
-- recomendacion: avanzar | revisar | descartar

UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 70,
  recomendacion = 'revisar',
  senales_buenas = '["Casa propia (estabilidad de vivienda)","Todo el hogar de acuerdo con la adopcion","Buen enfoque conductual: acude a veterinaria o busca orientacion","Acepta los cinco compromisos de adopcion responsable","Cuidador de confianza definido para viajes"]',
  senales_alerta = '["Indico que la vivienda NO tiene mallas de seguridad, pese a aceptar el compromiso de mantener espacio seguro (contradiccion a aclarar)","Solicitante muy joven (19 anios), estudiante: confirmar estabilidad economica real","Respuestas a planes de adversidad muy breves o genericas"]',
  preguntas_followup = '["Tiene previsto instalar mallas o protecciones en ventanas antes de la entrega?","Como cubriria los gastos veterinarios siendo estudiante? Cuenta con apoyo familiar estable?","Quien asume el cuidado durante sus jornadas de estudio y docencia?"]',
  notas_ia = 'Perfil afectuoso y con vivienda propia, pero hay una contradiccion clave: acepto mantener al gato en espacio seguro con mallas pero declara no tenerlas. Por ser casa (no altura) el riesgo es medio. Avanzar solo tras aclarar mallas y estabilidad economica.'
WHERE id = 2;

UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 88,
  recomendacion = 'avanzar',
  senales_buenas = '["Tuvo un gato durante 15 anios: compromiso de por vida demostrado","Casa propia CON mallas de seguridad","Hijo involucrado en gastos y cuidado (red de apoyo solida)","Respuestas maduras y empaticas: trata al gato como miembro de la familia","Cuidador definido para viajes","Plan de enfermedad responsable priorizando lo urgente"]',
  senales_alerta = '["Edad 69: conviene confirmar plan de contingencia de largo plazo para el gato (el hijo ya esta involucrado, lo cual mitiga)","Duelo reciente por su gato anterior: validar que la decision no sea impulsiva"]',
  preguntas_followup = '["Quien se haria cargo del gato a largo plazo si usted no pudiera? (su hijo ya aparece como apoyo)","Como se siente respecto al duelo? Esta lista para vincularse con un nuevo gato?"]',
  notas_ia = 'Candidata fuerte. Experiencia comprobada de tenencia responsable (15 anios), vivienda propia con mallas, red de apoyo familiar y respuestas empaticas. Las alertas son menores y facilmente abordables en entrevista.'
WHERE id = 3;

UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 66,
  recomendacion = 'revisar',
  senales_buenas = '["Trabaja desde casa: mucho tiempo de acompaniamiento al gato","Responsable unico de los gastos y cuidador principal","Todo el hogar de acuerdo","Motivacion reflexiva, entiende las personalidades felinas","Plan de viajes con referencia y companiero de vivienda"]',
  senales_alerta = '["Apartamento SIN mallas de seguridad: riesgo alto de caida, agravado por querer un gatito de 2 meses","Vivienda arrendada: confirmar permiso de mascotas y estabilidad","Acepto el compromiso de espacio seguro pero no tiene mallas instaladas"]',
  preguntas_followup = '["Esta dispuesto a instalar mallas en ventanas y balcon ANTES de la entrega? (condicion para apartamento en altura)","El contrato de arriendo permite mascotas?","Considera adoptar un gato algo mayor en lugar de uno de 2 meses, mas vulnerable a caidas?"]',
  notas_ia = 'Buen perfil de dedicacion y motivacion, pero el principal bloqueante es la seguridad fisica: apartamento sin mallas + interes en un gatito muy pequenio. Viable solo si se condiciona la entrega a la instalacion de mallas y se confirma el permiso de arriendo.'
WHERE id = 4;

UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 78,
  recomendacion = 'avanzar',
  senales_buenas = '["Ya tiene 2 gatos ESTERILIZADOS: tenencia responsable comprobada","Vivienda con mallas de seguridad","Experiencia previa; el gato que fallecio fue por causa genetica, no negligencia","Motivacion empatica y orientada al bienestar","Responsable unica de gastos y cuidado"]',
  senales_alerta = '["Manejo conductual por regano/castigo: contraproducente en gatos, requiere orientacion","Vivienda familiar (no propia): confirmar acuerdo del responsable del hogar","No registro datos de familiar ni referencia de contacto"]',
  preguntas_followup = '["Conoce el manejo conductual positivo en gatos? (el regano no funciona y genera estres)","El resto de la familia o el responsable de la casa esta de acuerdo con un tercer gato?","Puede compartir un contacto familiar y una referencia personal?"]',
  notas_ia = 'Buena candidata por tenencia responsable demostrada (gatos esterilizados, mallas, experiencia). La unica alerta educable es el manejo conductual por regano, abordable con orientacion del refugio. Completar datos de contacto faltantes.'
WHERE id = 5;
