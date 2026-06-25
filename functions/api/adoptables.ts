// Gatos en adopción, leídos del Instagram de Elim (@refugioanimalelim).
// Devuelve solo las publicaciones cuyo caption incluye el hashtag #AdoptaNoCompres,
// para que el equipo controle qué aparece simplemente etiquetando en IG.
// Token y IG id viven como variables de entorno en Cloudflare (nunca en el cliente).
// Falla en silencio (items: []) para no romper la página si IG no responde.

interface Env {
  IG_ACCESS_TOKEN?: string;            // token de Graph API (preferido)
  META_ACCESS_TOKEN?: string;          // fallback
  IG_USER_ID?: string;                 // IG user id de Elim (preferido)
  META_INSTAGRAM_ACCOUNT_ID?: string;  // fallback
}

const GRAPH = 'https://graph.facebook.com/v21.0';
const TAG = '#adoptanocompres';
const MAX = 12;

function json(body: unknown, cacheSeconds = 0): Response {
  const headers: Record<string, string> = { 'content-type': 'application/json; charset=utf-8' };
  if (cacheSeconds > 0) headers['cache-control'] = `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`;
  return new Response(JSON.stringify(body), { headers });
}

// Primera línea legible del caption, sin el bloque de hashtags.
function cleanCaption(caption: string): string {
  const firstLine = caption.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#')) || '';
  return firstLine.replace(/#[\p{L}\d_]+/gu, '').replace(/\s+/g, ' ').trim().slice(0, 90);
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const token = env.IG_ACCESS_TOKEN || env.META_ACCESS_TOKEN;
  const igId = env.IG_USER_ID || env.META_INSTAGRAM_ACCOUNT_ID;
  if (!token || !igId) return json({ items: [] });

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(new URL('/api/adoptables', request.url).toString());
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  try {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const url = `${GRAPH}/${igId}/media?fields=${fields}&limit=50&access_token=${token}`;
    const data: any = await (await fetch(url)).json();
    const media: any[] = Array.isArray(data?.data) ? data.data : [];
    const items = media
      .filter((m) => typeof m.caption === 'string' && m.caption.toLowerCase().includes(TAG))
      .map((m) => ({
        id: m.id,
        image: m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url,
        caption: cleanCaption(m.caption || ''),
        permalink: m.permalink,
      }))
      .filter((m) => m.image)
      .slice(0, MAX);

    const res = json({ items }, 1800); // cache 30 min en el edge
    await cache.put(cacheKey, res.clone());
    return res;
  } catch {
    return json({ items: [] });
  }
};
