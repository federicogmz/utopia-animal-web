# Handoff · Backend de solicitudes de adopción Elim

Esta guía cubre el setup operacional del backend (Cloudflare Pages + D1 + Pages
Functions) y la página pública `/refugio/adoptar`. Sigue los pasos en orden la
primera vez. Después de eso, solo necesitas los pasos de redeploy.

Todos los comandos se corren desde la raíz del repo:
`/Users/federicogmz/Documents/Utopia Animal/utopia-animal-web`.

## 1. Login en Cloudflare

```bash
npx wrangler login
```

Esto abre el navegador y te pide autorizar a Wrangler en tu cuenta de Cloudflare.

## 2. Crear la base de datos D1

```bash
npx wrangler d1 create elim-solicitudes
```

Wrangler imprime algo así:

```
[[d1_databases]]
binding = "DB"
database_name = "elim-solicitudes"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copia el `database_id` y reemplaza el placeholder `REEMPLAZAR-DESPUES-DE-D1-CREATE`
dentro de `wrangler.toml`.

## 3. Aplicar el schema en remoto

```bash
npx wrangler d1 execute elim-solicitudes --remote --file=./schema.sql
```

## 4. Aplicar el schema en local (para `wrangler pages dev`)

```bash
npx wrangler d1 execute elim-solicitudes --local --file=./schema.sql
```

## 5. Build y primer deploy

```bash
npm run build
npx wrangler pages deploy dist --project-name utopia-animal-web
```

Si es la primera vez, Wrangler te pregunta si quieres crear el proyecto Pages.
Acepta y selecciona la rama de producción (`main` o la que uses).

## 6. Conectar el binding D1 al proyecto Pages

En el dashboard de Cloudflare:

1. Workers & Pages → `utopia-animal-web` → Settings → Functions.
2. Sección **D1 database bindings** → Add binding.
3. Variable name: `DB`. D1 database: `elim-solicitudes`. Guarda.
4. Repite para el entorno **Preview** si quieres probar antes de promover.

Sin este paso las Functions devuelven errores 500 al insertar.

## 7. Generar y configurar el `ADMIN_TOKEN`

```bash
openssl rand -hex 32
```

Copia el valor. Después:

```bash
npx wrangler pages secret put ADMIN_TOKEN --project-name utopia-animal-web
```

Wrangler te pide pegarlo. Guarda el token también en tu gestor de contraseñas;
lo vas a necesitar para el comando `/evaluar-solicitudes` y para llamar a
`/api/pendientes` y `/api/evaluar/:id` manualmente.

## 8. Configurar WhatsApp Cloud API (flujo de webhook · gratuito)

**Cómo funciona el flujo:**

1. El postulante envía el formulario en `utopianimal.org/refugio/adoptar`.
2. La pantalla de gracias abre WhatsApp automáticamente con un mensaje pre-cargado
   ("Hola, envié mi solicitud #N y quiero confirmar la recepción").
3. El postulante presiona Enviar (1 tap). El mensaje llega al WhatsApp del refugio.
4. Meta dispara un webhook a `/api/whatsapp-webhook` en este sitio.
5. El webhook identifica la solicitud (por ID en el mensaje o por número de teléfono),
   confirma que no se ha respondido aún y envía un mensaje de texto libre de vuelta.
6. Como el postulante inició la conversación, el reply cae dentro de la **ventana
   de servicio de 24h** y es **gratis**. Meta da 1.000 conversaciones de servicio
   gratuitas por mes — más que suficiente.

**Mientras este setup esté incompleto, el form sigue funcionando**: la solicitud
se guarda en D1 y se abre WhatsApp para que el postulante envíe su mensaje. Lo
único que no pasa hasta completar el setup es la respuesta automática del refugio.

### 8.1 Setup en Meta Business

1. Crea cuenta en [business.facebook.com](https://business.facebook.com) si no tienes una.
2. **WhatsApp Business Account (WABA):** Meta Business Suite → Settings → Business
   Assets → WhatsApp accounts → Add → conecta el número del refugio
   (`+57 310 360 3232`). Verifica con OTP.
3. **App de desarrolladores:** [developers.facebook.com/apps](https://developers.facebook.com/apps)
   → Create App → tipo **Business** → asocia con la business account. En la app:
   Add product → WhatsApp → Set up.
4. **Credenciales:** WhatsApp → API setup. Copia:
   - **Phone number ID** → tu `WHATSAPP_PHONE_ID`.
   - **Temporary access token** (24h, sirve para probar).

   Para producción, genera un **System User Access Token permanente**:
   Meta Business → Settings → Users → System users → Add (tipo Admin) → asigna
   como asset la WhatsApp Business Account con permiso
   `whatsapp_business_messaging` → Generate token → marca "no expira". Este es
   tu `WHATSAPP_ACCESS_TOKEN`.

### 8.2 Configurar el webhook

1. **Genera un verify token aleatorio** (Meta lo usa para verificar tu endpoint):

   ```bash
   openssl rand -hex 24
   ```

   Copia el resultado.

2. **Guarda los 3 secrets en Cloudflare:**

   ```bash
   npx wrangler pages secret put WHATSAPP_ACCESS_TOKEN --project-name utopia-animal-web
   npx wrangler pages secret put WHATSAPP_PHONE_ID --project-name utopia-animal-web
   npx wrangler pages secret put WHATSAPP_WEBHOOK_VERIFY_TOKEN --project-name utopia-animal-web
   ```

3. **En el dashboard de Meta** (la app de developers que creaste) → WhatsApp →
   Configuration → Webhooks → Edit:

   - **Callback URL:** `https://utopianimal.org/api/whatsapp-webhook`
   - **Verify token:** el hex que generaste con `openssl` en el paso 1.
   - Click **Verify and Save**. Meta hace una llamada GET con un challenge — si
     el verify token coincide, queda verificado.

4. **Suscribir al evento `messages`:** en la misma página de Webhooks, sección
   "Webhook fields", click **Manage** → activa el toggle de `messages`. Save.

### 8.3 (Opcional) Aplicar migración de schema

Si tu base ya tenía la tabla antes de este cambio, añade la columna que el
webhook usa para no repetir respuestas:

```bash
npx wrangler d1 execute elim-solicitudes --remote --file=./migrations/0001_whatsapp_confirmacion.sql
npx wrangler d1 execute elim-solicitudes --local --file=./migrations/0001_whatsapp_confirmacion.sql
```

Si recreas la base con `schema.sql` desde cero, la columna ya viene incluida.

### 8.4 Probar el flujo

1. Abre `https://utopianimal.org/refugio/adoptar` en incógnito en tu celular.
2. Llena el form con tu número real. Submite.
3. Cuando la pantalla de gracias auto-abra WhatsApp, presiona **Enviar**.
4. Deberías recibir un mensaje de respuesta del refugio en ~2-5 segundos.
5. Revisa logs en Cloudflare → Workers & Pages → utopia-animal-web → Functions
   si algo falla. Busca `whatsapp_inbound_*` o `whatsapp_send_error`.

## 9. Conectar el dominio custom

En el dashboard Cloudflare → Workers & Pages → `utopia-animal-web` → Custom
domains → Set up a custom domain. Añade `utopianimal.org` y `www.utopianimal.org`
según ya estén configurados. Cloudflare se encarga del SSL automáticamente.

## 10. Prueba end-to-end

1. Abre `https://utopianimal.org/refugio/adoptar` en una ventana de incógnito.
2. Llena el formulario completo con un correo y un teléfono reales (los tuyos).
3. Envía. Deberías ver la pantalla de "¡Gracias!" en la misma página.
4. Verifica que llegue el mensaje de WhatsApp al número que ingresaste (solo
   si ya completaste el setup del paso 8 y el template está aprobado).
5. Verifica que la fila esté en la base:
   ```bash
   npx wrangler d1 execute elim-solicitudes --remote \
     --command "SELECT id, nombre_completo, telefono, fecha_envio FROM solicitudes ORDER BY id DESC LIMIT 5"
   ```

## Redeploys

Para los cambios siguientes, solo necesitas:

```bash
npm run build
npx wrangler pages deploy dist --project-name utopia-animal-web
```

Si modificas el schema (`schema.sql`), corre los pasos 3 y 4 de nuevo. D1 no
ejecuta migraciones automáticas — usa `ALTER TABLE` manual o recrea la tabla
si todavía no hay datos importantes.

## Endpoints del backend

- `POST /api/solicitud` — público. Recibe el JSON del formulario, valida, hashea
  la IP, inserta en D1. Devuelve `{ ok, id }` para que la pantalla de gracias
  pueda armar el link `wa.me` con el ID embebido. Honeypot: `_website`.
- `GET /api/whatsapp-webhook` — handshake de Meta. Devuelve el `hub.challenge`
  si el `hub.verify_token` coincide con `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
- `POST /api/whatsapp-webhook` — recibe mensajes entrantes de WhatsApp. Si el
  mensaje viene de un número con solicitud pendiente y no ha sido confirmada,
  envía respuesta de texto libre (gratis, ventana de 24h) y marca
  `whatsapp_confirmacion_enviada = 1`.
- `GET /api/pendientes` — protegido con `Authorization: Bearer <ADMIN_TOKEN>`.
  Devuelve hasta 50 solicitudes con `evaluado_at IS NULL AND estado = 'pendiente'`.
- `POST /api/evaluar/:id` — protegido con bearer token. Marca la solicitud
  como evaluada y guarda `score`, `senales_buenas`, `senales_alerta`,
  `preguntas_followup`, `recomendacion`, `notas_ia`.

## Próximos pasos (no incluidos en este handoff)

- **Comando `/evaluar-solicitudes` de Claude Code:** tarea separada. Va a
  consumir `/api/pendientes`, pedirte revisar cada solicitud con ayuda del
  modelo, y mandar el resultado a `/api/evaluar/:id`. Es una tarea aparte.
- **Notificaciones WhatsApp al refugio:** actualmente solo se notifica al
  postulante. Si más adelante quieres que el refugio reciba alerta por
  WhatsApp en cada solicitud, se añade en `functions/api/solicitud.ts`
  después del insert (otro template + send).
- **Segundo mensaje al postulante apto:** cuando el flujo de evaluación
  esté validado, se puede crear un segundo template (`solicitud_aprobada`
  con campo para link de carga de video) que `/api/evaluar/:id` dispare
  cuando `recomendacion = 'avanzar'`.
