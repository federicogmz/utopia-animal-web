-- Evaluación IA de solicitudes pendientes · 2026-06-24
-- Modelo balanceado (zona = visita domiciliaria, no rechazo automático)

-- ============================================================
-- ID 45 · Ana María Betancur · 34a · Medellín (Santa Ines)
-- ============================================================
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 74,
  recomendacion = 'revisar',
  senales_buenas = '["Ya tiene 3 gatos esterilizados y 1 perro: tenencia responsable comprobada", "Casa CON mallas de seguridad", "Todo el hogar de acuerdo con la adopción", "Experiencia previa con gatos; los atendió hasta el final en enfermedad", "Cuidadora principal definida con red de apoyo familiar", "Respuestas reflexivas y detalladas ante todos los escenarios", "Contactos de familiar y referencia independientes", "Se compromete a donar (Arenero al día, $20.000)"]',
  senales_alerta = '["Zona de alto abandono (Santa Ines · Comuna 3 · Manrique): requiere VISITA DOMICILIARIA obligatoria", "Vivienda familiar (no propia): confirmar acuerdo del responsable del hogar", "Ya tiene 4 animales (3 gatos + 1 perro): un gatito más eleva la carga de cuidado", "Dos pérdidas recientes de gatos por enfermedad: validar que la decisión sea reflexiva, no reactiva al duelo"]',
  preguntas_followup = '["¿Cómo planeas la introducción del nuevo gatito con tus 3 gatos y tu perro actuales para una buena convivencia?", "Con 4 animales en casa, ¿cómo manejarías los costos veterinarios si se presentara una emergencia con varios a la vez?", "¿El responsable de la vivienda familiar está de acuerdo con sumar un cuarto gato?"]',
  notas_ia = 'Perfil sólido con tenencia responsable comprobada (3 gatos esterilizados, todos al día), casa con mallas, experiencia y buena red de apoyo. Las alertas son la zona de alto abandono (Santa Ines - requiere visita domiciliaria), la vivienda familiar (confirmar acuerdo) y la carga actual de 4 animales. Revisar con prioridad: el perfil es bueno, pero se necesita verificación domiciliaria.',
  etapa = 'filtro',
  estado = 'proceso'
WHERE id = 45 AND etapa = 'recepcion';
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo)
  VALUES (45, 'ia', 'etapa', 'etapa', 'recepcion', 'filtro');
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo)
  VALUES (45, 'ia', 'nota', NULL, NULL, 'Evaluación IA (balanceado): 74/100 - revisar');

-- ============================================================
-- ID 46 · Efraín Parra Blanco · 73a · Medellín (San Javier)
-- ============================================================
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 50,
  recomendacion = 'revisar',
  senales_buenas = '["Apartamento PROPIO: estabilidad de vivienda garantizada", "CON mallas de seguridad", "Responsable único de gastos y cuidado: no depende de terceros", "Sin niños en el hogar", "Se compromete a donar (Arenero al día, $20.000)"]',
  senales_alerta = '["Edad 73 sin plan de contingencia a largo plazo: quién asumiría al gato si él no puede", "Respuestas a los planes de 2-3 palabras: no demuestran preparación ni reflexión sobre la tenencia", "Sin experiencia previa con gatos", "Vive solo: sin cuidador alternativo definido para viajes o enfermedad", "El nombre de la referencia (''Bell'') coincide con el apellido del familiar: podría no ser una referencia independiente"]',
  preguntas_followup = '["¿Quién se haría cargo del gato si usted no pudiera por razones de salud o edad? ¿Tiene hijos o familiares que puedan asumir ese compromiso?", "¿Podría darnos una referencia personal independiente (alguien que no sea de su familia directa)?", "Comparta un poco más sobre cómo manejaría un problema de comportamiento o una enfermedad: ¿tiene un veterinario de confianza?"]',
  notas_ia = 'Apartamento propio con mallas: fortaleza importante. Sin embargo, el perfil acumula alertas: edad 73 sin plan de contingencia, respuestas extremadamente breves que no muestran preparación, sin experiencia felina y vive solo. La referencia además parece no ser independiente. Revisar a fondo en el contacto: el candidato podría ser viable si hay una red de apoyo familiar dispuesta a asumir el compromiso de largo plazo.',
  etapa = 'filtro',
  estado = 'proceso'
WHERE id = 46 AND etapa = 'recepcion';
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo)
  VALUES (46, 'ia', 'etapa', 'etapa', 'recepcion', 'filtro');
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo)
  VALUES (46, 'ia', 'nota', NULL, NULL, 'Evaluación IA (balanceado): 50/100 - revisar');

-- ============================================================
-- ID 47 · Laura Stefania Triana Mattos · 19a · Sabaneta (Entreamigos)
-- ============================================================
UPDATE solicitudes SET
  evaluado_at = CURRENT_TIMESTAMP,
  score = 62,
  recomendacion = 'revisar',
  senales_buenas = '["Apartamento CON mallas de seguridad: riesgo de altura cubierto", "Motivación reflexiva, sincera y bien articulada", "Planes de contingencia detallados (familia de apoyo, contacto al refugio, experiencia familiar con perro)", "Todo el hogar de acuerdo", "Cuidadora principal definida", "Flexible con la edad del gato (indiferente): abierta a recomendar un adulto", "Familiar y referencia independientes con nombres completos", "Disposición a aprender y a contactar al refugio ante dudas de comportamiento", "Donación"]',
  senales_alerta = '["Joven (19) estudiante sin ingreso propio: estabilidad económica no comprobada, depende de 3 personas", "Vivienda arrendada: confirmar permiso de mascotas en el contrato", "Sin experiencia previa como cuidadora principal de gatos", "En transición de vida: mudanza a nueva ciudad para estudiar (inestabilidad temporal)"]',
  preguntas_followup = '["¿El apartamento tiene permiso de mascotas en el contrato de arriendo?", "¿Quiénes son las 3 personas que compartirían los gastos? ¿Están todas comprometidas con la tenencia responsable a largo plazo?", "Al ser tu primera experiencia con gatos en un momento de transición: ¿considerarías empezar con un gato adulto o joven (6+ meses) que sea más tranquilo y requiera menos supervisión que un cachorro?"]',
  notas_ia = 'Perfil prometedor: motivación genuina, mallas instaladas, planes coherentes y buena disposición. Las alertas son típicas de una edad joven en transición (estabilidad económica por confirmar, vivienda arrendada, primera tenencia). Viabilidad condicionada a confirmar permiso de mascotas, la red de apoyo económica y considerar un gato adulto/joven para reducir riesgos.',
  etapa = 'filtro',
  estado = 'proceso'
WHERE id = 47 AND etapa = 'recepcion';
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo)
  VALUES (47, 'ia', 'etapa', 'etapa', 'recepcion', 'filtro');
INSERT INTO solicitud_historial (solicitud_id, usuario, accion, campo, valor_anterior, valor_nuevo)
  VALUES (47, 'ia', 'nota', NULL, NULL, 'Evaluación IA (balanceado): 62/100 - revisar');
