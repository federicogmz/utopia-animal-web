interface Env {
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { user, password } = await request.json() as any;

  const adminUser = env.ADMIN_USER || 'utopianimal';
  const adminPass = env.ADMIN_PASSWORD || 'Utopia2026Secure!'; // Default secure password if not set
  const sessionSecret = env.SESSION_SECRET || 'utopia-animal-secret-2026';

  if (user === adminUser && password === adminPass) {
    // In a real app, we'd use a JWT. For now, a simple signed session or just a token.
    // We'll use a simple token: b64(user):timestamp:hash(user:timestamp:secret)
    const timestamp = Date.now();
    const data = `${user}:${timestamp}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(sessionSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const token = btoa(data) + '.' + signatureHex;

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`, // 30 days
      },
    });
  }

  return new Response(JSON.stringify({ ok: false, error: 'invalid_credentials' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
};
