import { verifyPassword } from '../_lib/password';

interface Env {
  DB: D1Database;
  ADMIN_USER?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
}

interface UsuarioRow {
  username: string;
  password_hash: string | null;
  activo: number;
}

async function signSession(user: string, sessionSecret: string): Promise<string> {
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
  return btoa(data) + '.' + signatureHex;
}

function sessionResponse(token: string): Response {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`,
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { user, password } = await request.json() as { user?: string; password?: string };
  const sessionSecret = env.SESSION_SECRET;

  // Falla cerrado: sin secret de sesión no se puede firmar ninguna sesión.
  if (!sessionSecret) {
    return new Response(JSON.stringify({ ok: false, error: 'auth_not_configured' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!user || !password) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_credentials' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const username = user.trim().toLowerCase();

  // 1) Usuario de la tabla `usuarios` (multiusuario: Federico, Laura, …)
  try {
    const row = await env.DB.prepare(
      'SELECT username, password_hash, activo FROM usuarios WHERE username = ?'
    ).bind(username).first<UsuarioRow>();
    if (row && row.activo === 1 && await verifyPassword(row.password_hash, password)) {
      return sessionResponse(await signSession(row.username, sessionSecret));
    }
  } catch {
    // Si la tabla aún no existe, caemos al admin por secret.
  }

  // 2) Superadmin por secret (compatibilidad con el login original)
  if (env.ADMIN_USER && env.ADMIN_PASSWORD &&
      user === env.ADMIN_USER && password === env.ADMIN_PASSWORD) {
    return sessionResponse(await signSession(env.ADMIN_USER, sessionSecret));
  }

  return new Response(JSON.stringify({ ok: false, error: 'invalid_credentials' }), {
    status: 401, headers: { 'Content-Type': 'application/json' },
  });
};
