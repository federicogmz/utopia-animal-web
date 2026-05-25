# Utopía Animal — Web oficial

Sitio web de la **Fundación Utopía Animal**, que integra:

- **Utopía Animal Vet** — veterinaria humanizada en Medellín (Av Guayabal)
- **Elim Refugio Animal** — rescate, rehabilitación y adopción felina
- **Blog de Bienestar Animal** — educación para tutores

Construido con [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com).

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:4321](http://localhost:4321).

## Build para producción

```bash
npm run build
npm run preview   # opcional, para revisar el build localmente
```

El output estático se genera en `dist/`.

---

## Deploy — Cloudflare Pages

Este proyecto está configurado para deploy automático en **Cloudflare Pages**.

| Ajuste | Valor |
|--------|-------|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | `18` o superior |

### Pasos iniciales
1. Haz push a GitHub (rama `main`).
2. En Cloudflare Pages, conecta el repositorio.
3. Usa la configuración de la tabla anterior.
4. Deploy automático en cada `git push` a `main`.

---

## Estructura del proyecto

```
src/
  components/   # Header, Footer, SEO, etc.
  layouts/      # Layout.astro base
  pages/        # Rutas del sitio
    index.astro           # Home — Fundación Utopía Animal
    veterinaria/          # Utopía Animal Vet
    refugio/              # Elim Refugio Animal
    blog/                 # Blog de Bienestar Animal
    nosotros.astro
    comunidad.astro
    apoya.astro
    privacidad.astro
  content/
    blog/                 # Posts en Markdown
public/
  logo-utopia.png
  logo-elim.png
  robots.txt
```

---

## Redes sociales

- Instagram Vet: [@utopianimalvet](https://www.instagram.com/utopianimalvet/)
- Instagram Refugio: [@refugioanimalelim](https://www.instagram.com/refugioanimalelim/)
