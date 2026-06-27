// Service worker mínimo para la PWA de la intranet (seguimiento de adopciones).
// Estrategia segura para datos en vivo:
//   • Estáticos (css/js/img/fuentes) → stale-while-revalidate (carga instantánea).
//   • Navegaciones y /api/ → SIEMPRE red directa (datos de adopciones frescos).
const CACHE = 'utopia-static-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStatic = /\.(css|js|mjs|woff2?|png|svg|jpe?g|webp|ico|json|webmanifest)$/.test(url.pathname);
  if (!isStatic || url.pathname.startsWith('/api/')) return; // dinámico → red directa

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => { if (res && res.ok) cache.put(request, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});
