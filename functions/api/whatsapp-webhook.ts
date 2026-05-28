interface Env {
  DB: D1Database;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_PHONE_ID?: string;
  WHATSAPP_WEBHOOK_VERIFY_TOKEN?: string;
}

interface WhatsAppMessage {
  from: string;
  id: string;
  type: string;
  text?: { body?: string };
}

interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: WhatsAppMessage[];
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
      };
    }>;
  }>;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  return new Response('Forbidden', { status: 403 });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: WhatsAppWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const messages: { msg: WhatsAppMessage; name: string }[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;
      for (const msg of value.messages) {
        if (msg.type !== 'text') continue;
        const contact = value.contacts?.find(c => c.wa_id === msg.from);
        const name = contact?.profile?.name?.trim() || '';
        messages.push({ msg, name });
      }
    }
  }

  if (!messages.length || !env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_ID) {
    return new Response('OK', { status: 200 });
  }

  for (const { msg, name } of messages) {
    try {
      await handleInboundMessage(env, msg, name);
    } catch (err) {
      console.error('whatsapp_inbound_error', err);
    }
  }

  return new Response('OK', { status: 200 });
};

async function handleInboundMessage(env: Env, msg: WhatsAppMessage, contactName: string): Promise<void> {
  const body = msg.text?.body ?? '';
  const idMatch = body.match(/#(\d+)/);

  let solicitud: { id: number; nombre_completo: string; telefono: string; whatsapp_confirmacion_enviada: number } | null = null;

  if (idMatch) {
    const id = Number(idMatch[1]);
    const r = await env.DB.prepare(
      'SELECT id, nombre_completo, telefono, whatsapp_confirmacion_enviada FROM solicitudes WHERE id = ? LIMIT 1'
    ).bind(id).first();
    if (r) solicitud = r as typeof solicitud;
  }

  if (!solicitud) {
    const phoneLast10 = msg.from.replace(/\D/g, '').slice(-10);
    const r = await env.DB.prepare(
      `SELECT id, nombre_completo, telefono, whatsapp_confirmacion_enviada
       FROM solicitudes
       WHERE substr(replace(replace(replace(telefono, ' ', ''), '-', ''), '+', ''), -10) = ?
         AND (whatsapp_confirmacion_enviada IS NULL OR whatsapp_confirmacion_enviada = 0)
       ORDER BY id DESC LIMIT 1`
    ).bind(phoneLast10).first();
    if (r) solicitud = r as typeof solicitud;
  }

  if (!solicitud) {
    console.log('whatsapp_inbound_no_match', { from: msg.from, body: body.slice(0, 100) });
    return;
  }

  if (solicitud.whatsapp_confirmacion_enviada) {
    console.log('whatsapp_already_confirmed', { id: solicitud.id });
    return;
  }

  const firstName = (contactName || solicitud.nombre_completo || '').trim().split(/\s+/)[0] || 'Hola';
  const replyText = `Hola ${firstName}, recibimos tu solicitud de adopción y la estamos evaluando con cuidado.

En los próximos días te informaremos si tu postulación continúa el proceso o no. Por el momento no necesitas hacer nada más.

Equipo Elim · Utopía Animal`;

  await sendWhatsAppText(env.WHATSAPP_ACCESS_TOKEN!, env.WHATSAPP_PHONE_ID!, msg.from, replyText);

  await env.DB.prepare(
    'UPDATE solicitudes SET whatsapp_confirmacion_enviada = 1 WHERE id = ?'
  ).bind(solicitud.id).run();
}

async function sendWhatsAppText(accessToken: string, phoneNumberId: string, to: string, body: string): Promise<void> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body, preview_url: false },
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`WhatsApp send error ${res.status}: ${errBody}`);
  }
}
