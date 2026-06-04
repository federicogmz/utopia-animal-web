// Webhook de WhatsApp Cloud API (número de Elim).
//   GET  → verificación del webhook (hub.challenge) que hace Meta al guardar la URL.
//   POST → mensajes entrantes; si el postulante confirma su solicitud, responde
//          automáticamente dentro de la ventana de 24h y marca la confirmación.
// Falla cerrado: sin WHATSAPP_VERIFY_TOKEN no verifica; sin token/phone no envía.

interface Env {
  DB: D1Database;
  WHATSAPP_VERIFY_TOKEN?: string;   // token que pegas en Meta (debe coincidir)
  WHATSAPP_ACCESS_TOKEN?: string;   // System User token permanente (para responder)
  WHATSAPP_PHONE_ID?: string;       // Phone Number ID del número de Elim
}

const GRAPH = 'https://graph.facebook.com/v21.0';

// "3052759146" (BD) y "573052759146" (wa_id) → forma comparable de 10 dígitos.
function last10(phone: string): string {
  const d = String(phone || '').replace(/\D/g, '');
  return d.slice(-10);
}

// ── Verificación del webhook ──
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && env.WHATSAPP_VERIFY_TOKEN && token === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge || '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new Response('Forbidden', { status: 403 });
};

async function enviarTexto(env: Env, to: string, body: string): Promise<void> {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_ID) return; // aún sin credenciales de envío
  await fetch(`${GRAPH}/${env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  });
}

// ── Mensajes entrantes ──
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: any;
  try { payload = await request.json(); } catch { return new Response('ok', { status: 200 }); }

  try {
    const changes = payload?.entry?.flatMap((e: any) => e?.changes || []) || [];
    for (const ch of changes) {
      const value = ch?.value;
      const messages = value?.messages || [];
      for (const msg of messages) {
        if (msg.type !== 'text') continue;
        const from: string = msg.from || '';                 // wa_id, ej. 573052759146
        const text: string = msg.text?.body || '';

        // 1) Buscar la solicitud por "#N" en el texto; si no, por teléfono.
        let solicitud: any = null;
        const m = text.match(/#\s*(\d+)/);
        if (m) {
          solicitud = await env.DB.prepare(
            'SELECT id, nombre_completo, telefono, whatsapp_confirmacion_enviada FROM solicitudes WHERE id = ?'
          ).bind(Number(m[1])).first();
        }
        if (!solicitud) {
          solicitud = await env.DB.prepare(
            "SELECT id, nombre_completo, telefono, whatsapp_confirmacion_enviada FROM solicitudes WHERE substr(replace(telefono,' ',''), -10) = ? ORDER BY id DESC LIMIT 1"
          ).bind(last10(from)).first();
        }
        if (!solicitud) continue;
        if (solicitud.whatsapp_confirmacion_enviada) continue; // ya confirmada, no duplicar

        // 2) Responder confirmación dentro de la ventana de 24h (gratis, sin plantilla).
        const nombre = String(solicitud.nombre_completo || '').trim().split(/\s+/)[0] || '';
        const reply = `¡Hola ${nombre}! 🐱 Recibimos tu solicitud de adopción #${solicitud.id} en Elim Refugio Animal. ` +
          `Nuestro equipo la está revisando con cariño y te contactaremos por aquí para los siguientes pasos. ` +
          `¡Gracias por querer adoptar de forma responsable! 💛`;
        await enviarTexto(env, from, reply);

        // 3) Marcar como confirmada.
        await env.DB.prepare('UPDATE solicitudes SET whatsapp_confirmacion_enviada = 1 WHERE id = ?')
          .bind(solicitud.id).run();
      }
    }
  } catch (e) {
    // Nunca devolver error a Meta: reintentaría el webhook. Solo registramos.
    console.error('whatsapp-webhook error', String(e));
  }

  // Meta exige 200 rápido para considerar el webhook entregado.
  return new Response('ok', { status: 200 });
};
