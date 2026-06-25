import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://utopianimal.org',
  integrations: [
    tailwind(),
    sitemap({
      // Excluir del sitemap páginas internas (intranet), de "gracias" y redirecciones de WhatsApp:
      // no aportan SEO y las de intranet no deben indexarse.
      filter: (page) =>
        !page.includes('/intranet') &&
        !page.includes('/solicitud-enviada') &&
        !page.includes('/solicitud-hogar-enviada') &&
        !page.includes('/wa-elim') &&
        !page.includes('/wa-vet'),
    }),
  ],
  output: 'static',
});
