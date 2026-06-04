// Verificación de contraseñas con PBKDF2 (Web Crypto, disponible en Workers).
// Formato almacenado: pbkdf2$<iteraciones>$<saltHex>$<hashHex>

function hexToBytes(hex: string): Uint8Array {
  const m = hex.match(/.{1,2}/g);
  return new Uint8Array(m ? m.map(b => parseInt(b, 16)) : []);
}
function bytesToHex(b: Uint8Array): string {
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(stored: string | null | undefined, password: string): Promise<boolean> {
  if (!stored || !password) return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[1], 10);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const salt = hexToBytes(parts[2]);
  const expectedHex = parts[3];

  try {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    const computedHex = bytesToHex(new Uint8Array(bits));
    // Comparación de tiempo constante.
    if (computedHex.length !== expectedHex.length) return false;
    let diff = 0;
    for (let i = 0; i < computedHex.length; i++) diff |= computedHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    return diff === 0;
  } catch {
    return false;
  }
}
