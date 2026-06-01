// Auth compartido para todos los endpoints protegidos del panel/intranet.
// Acepta dos credenciales equivalentes:
//   - Cookie de sesión HMAC (navegador, login de la intranet)
//   - Authorization: Bearer <ADMIN_TOKEN> (procesos máquina: batch de evaluación)
// Falla cerrado: si el secret correspondiente no está configurado, esa vía
// simplemente no autoriza. Nunca hay secret por defecto.

export interface AuthEnv {
  SESSION_SECRET?: string;
  ADMIN_TOKEN?: string;
}

const SESSION_MAX_AGE_MS = 2592000000; // 30 días

async function verifySessionCookie(request: Request, secret: string): Promise<boolean> {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return false;

  const sessionRow = cookie.split(';').map(c => c.trim()).find(row => row.startsWith('session='));
  if (!sessionRow) return false;
  const session = sessionRow.substring('session='.length);
  if (!session) return false;

  const [dataB64, signatureHex] = session.split('.');
  if (!dataB64 || !signatureHex || !/^[0-9a-f]+$/i.test(signatureHex) || signatureHex.length % 2 !== 0) {
    return false;
  }

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

    const sigBytes = new Uint8Array(signatureHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(data));
    if (!isValid) return false;

    const [, timestamp] = data.split(':');
    if (!timestamp || Date.now() - parseInt(timestamp, 10) > SESSION_MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

function checkBearer(request: Request, adminToken: string): boolean {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const provided = auth.slice('Bearer '.length);
  // Comparación de longitud constante para evitar timing attacks.
  if (provided.length !== adminToken.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ adminToken.charCodeAt(i);
  return diff === 0;
}

export async function isAuthorized(request: Request, env: AuthEnv): Promise<boolean> {
  if (env.ADMIN_TOKEN && checkBearer(request, env.ADMIN_TOKEN)) return true;
  if (env.SESSION_SECRET && await verifySessionCookie(request, env.SESSION_SECRET)) return true;
  return false;
}

export function unauthorized(): Response {
  return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
