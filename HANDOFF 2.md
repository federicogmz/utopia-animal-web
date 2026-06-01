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

## 8. Configurar WhatsApp Cloud API (mensaje al postulante)

El form envía automáticamente un mensaje de WhatsApp al postulante confirmando
que su solicitud está siendo evaluada. Usa WhatsApp Cloud API de Meta (gratis
hasta 1.000 conversaciones de servicio/mes — más que suficiente para Elim).

**Mientras configuras esto, el form sigue operando**: las solicitudes se
guardan en D1, solo no se envía el mensaje (queda un log en Cloudflare).
Cuando los secrets estén configurados, empieza a mandar sin necesidad de
redeploy.

### 8.1 Setup en Meta Business

1. Crea cuenta en [business.facebook.com](https://business.facebook.com) si
   no tienes una.
2. **WhatsApp Business Account (WABA):**
   Meta Business Suite → Settings → Business Assets → WhatsApp accounts → Add
   → conecta el número del refugio (`+57 310 360 3232`). Meta lo verifica
   con OTP.
3. **App de desarrolladores:**
   [developers.facebook.com/apps](https://developers.facebook.com/apps) →
   Create App → tipo Business → asocia a la business account. En la app:
   Add product → WhatsApp → Set up.
4. **Credenciales:**
   - WhatsApp → API setup. Copia:
     - **Phone number ID** → es tu `WHATSAPP_PHONE_ID`.
     - **Temporary access token** (válido 24h). Sirve para probar.
   - Para producción genera un **System User Access Token permanente**:
     Meta Business → Settings → Users → System users → Add → asigna como
     asset la WhatsApp Business Account con permiso `whatsapp_business_messaging`
     → Generate token (no expira). Este es tu `WHATSAPP_ACCESS_TOKEN`.

### 8.2 Crear y aprobar el template

WhatsApp Manager → Templates → Create template.

- **Name:** `confirmacion_solicitud` (exactamente este nombre, minúsculas).
- **Category:** **Utility** (no Marketing — Utility es para confirmaciones
  transaccionales y se aprueba más rápido).
- **Language:** Spanish.
- **Header:** ninguno.
- **Body:**

  ```
  Hola {{1}}, recibimos tu solicitud de adopción a Refugio Animal Elim y la estamos evaluando con cuidado.

  En los próximos días te informaremos si tu postulación continúa el proceso o no. Por el momento no necesitas hacer nada más.

  Equipo Elim · Utopía Animal
  ```

- **Sample value** para `{{1}}`: `María`.
- **Footer:** opcional (ej. "Refugio Animal Elim").
- Submit. Meta tarda entre minutos y 24h en aprobar.

Si quieres usar un nombre distinto para el template, configúralo en
`WHATSAPP_TEMPLATE_NAME` (paso 8.3). El default es `confirmacion_solicitud`.

### 8.3 Guardar credenciales como secrets

```bash
npx wrangler pages secret put WHATSAPP_ACCESS_TOKEN --project-name utopia-animal-web
npx wrangler pages secret put WHATSAPP_PHONE_ID --project-name utopia-animal-web
```

Opcional, solo si usaste un nombre distinto al default:

```bash
npx wrangler pages secret put WHATSAPP_TEMPLATE_NAME --project-name utopia-animal-web
```

### 8.4 Probar

Submite el form con tu propio número. Deberías recibir el mensaje en pocos
segundos. Si no llega, revisa logs en Cloudflare → Workers & Pages →
utopia-animal-web → Functions → Logs y busca `whatsapp_send_failed`.

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
  la IP, inserta en D1, dispara el mensaje de WhatsApp al postulante.
  Honeypot: `_website`.
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
