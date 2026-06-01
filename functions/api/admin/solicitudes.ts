interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
}

async function verifySession(request: Request, secret: string) {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return false;
  
  const sessionRow = cookie.split(';').map(c => c.trim()).find(row => row.startsWith('session='));
  if (!sessionRow) return false;
  const session = sessionRow.substring('session='.length);
  if (!session) return false;

  const [dataB64, signatureHex] = session.split('.');
  if (!dataB64 || !signatureHex) return false;

  try {
    const data = atob(dataB64);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = new Uint8Array(signatureHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
    
    if (!isValid) return false;

    const [user, timestamp] = data.split(':');
    if (Date.now() - parseInt(timestamp) > 2592000000) return false; // 30 days expiry

    return true;
  } catch {
    return false;
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const secret = env.SESSION_SECRET || 'utopia-animal-secret-2026';
  if (!(await verifySession(request, secret))) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 });
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM solicitudes ORDER BY fecha_envio DESC'
    ).all();
    return new Response(JSON.stringify({ ok: true, solicitudes: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error', detail: String(err) }), { status: 500 });
  }
};
