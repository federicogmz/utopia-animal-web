interface Env {
  DB: D1Database;
  SESSION_SECRET?: string;
}

async function verifySession(request: Request, secret: string) {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return false;
  const session = cookie.split('; ').find(row => row.startsWith('session='))?.split('=')[1];
  if (!session) return false;
  const [dataB64, signatureHex] = session.split('.');
  if (!dataB64 || !signatureHex) return false;
  try {
    const data = atob(dataB64);
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = new Uint8Array(signatureHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
    if (!isValid) return false;
    const [, timestamp] = data.split(':');
    if (Date.now() - parseInt(timestamp) > 2592000000) return false;
    return true;
  } catch { return false; }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = env.SESSION_SECRET || 'utopia-animal-secret-2026';
  if (!(await verifySession(request, secret))) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 });
  }

  const { id, estado, notas_humanas } = await request.json() as any;
  if (!id) return new Response(JSON.stringify({ ok: false, error: 'missing_id' }), { status: 400 });

  try {
    await env.DB.prepare(
      'UPDATE solicitudes SET estado = ?, notas_humanas = ? WHERE id = ?'
    ).bind(estado, notas_humanas, id).run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error', detail: String(err) }), { status: 500 });
  }
};
