# Vednath Ayurved: website

A static website for **Vednath Ayurved – Ayurveda & Panchakarma Hospital, Adajan, Surat**.
It is hand-written HTML, modern CSS and vanilla JS (ES modules), with GSAP for scroll motion. There is no framework and no build output: **the repository folder is the deployable site.**

> Clinic facts come only from [`docs/Master.md`](docs/Master.md). Missing information is shown as `{{TODO: …}}` and tracked in [`TODO-CLIENT.md`](TODO-CLIENT.md).

## Run locally

```bash
npm install          # dev tools only: gsap, fonts, sharp
npm run vendor       # copy GSAP + fonts from node_modules into /assets
npm run dev          # http://localhost:5173/
```

Use `npm run dev`, not XAMPP's `/vednath-ayurved/` sub-folder. The site uses root-relative links (`/services/panchakarma/`), so it needs to be served from `/`, as it will be in production.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Zero-dependency static server with clean URLs and a 404 fallback (`scripts/serve.mjs`) |
| `npm run partials` | Copies `partials/*.html` (header, footer, mobile bar) into every page, between `<!-- @name -->` markers, and marks the current nav link |
| `npm run vendor` | Copies GSAP and the self-hosted fonts into `/assets` |
| `node scripts/art.mjs` | Regenerates the hero sun mandala SVG, its AVIF/WebP posters and the OG image |
| `node scripts/logo-from-pamphlet.mjs` | Regenerates the stopgap logo and favicons from the pamphlet. Replace these once the vector logo arrives |
| `node scripts/check-contrast.mjs` | Verifies every text colour pair meets WCAG AA (4.5:1) |

## Folder structure

```
index.html, <page>/index.html   pages (each is complete HTML)
partials/                       shared header, footer, mobile action bar (synced by script)
assets/css/tokens.css           design tokens: colour, type scale, spacing, motion
assets/css/base.css             reset, typography, layout primitives, utilities
assets/css/components.css       buttons, header, cards, bento, marquee, carousel, CTA, footer, forms
assets/css/home.css             page-specific styles
assets/js/core.js               first-paint JS (~3 KB gz): nav, reveals, marquee, ripple, map facade, lazy loader
assets/js/motion.js             GSAP scenes (lazy, motion allowed only)
assets/js/pointer.js            magnetic buttons, tilt, cursor (lazy, fine pointer only)
assets/js/carousel.js           review carousel enhancement (lazy)
assets/js/shader.js             WebGL hero light (lazy, capable devices only)
assets/vendor/gsap/             self-hosted GSAP 3.15 (+ ScrollTrigger, SplitText, DrawSVG)
assets/fonts/                   Fraunces + Manrope, Latin subset, variable
assets/img, assets/svg          images and illustrations
docs/                           Master.md, PROMPT.md, source images (not deployed)
scripts/                        dev and asset scripts (not deployed)
styleguide/                     living design-system page (noindex)
```

## Editing content

- **Text:** edit the page's HTML directly. Every page is plain HTML.
- **Header, footer or mobile bar:** edit the file in `partials/`, then run `npm run partials`. Never edit those sections inside a page, because the next sync overwrites them.
- **Phone, WhatsApp, address:** these appear in partials and pages. Search the project for `9925604218` and `Devi Plaza` to update every copy.
- **Placeholders:** search for `{{TODO` to find every missing item.

## How performance is protected

- The only first-paint JS is `core.js`. GSAP (~40 KB gz), pointer effects, the shader and the carousel load after `load`, on idle or when needed.
- The hero's largest element is a pre-rendered AVIF poster (~44 KB at 820 px) with `fetchpriority="high"`. The headline reveal is pure CSS, so it never waits for JS.
- `prefers-reduced-motion`: GSAP, the shader, parallax and the marquee are turned off, and static versions are shown.
- Low-end devices (Save-Data, fewer than 6 cores, under 4 GB RAM) skip WebGL.
- With JS disabled, all content and navigation still work.

## Deploy

The folder is static, but don't deploy `node_modules/`, `scripts/`, `docs/` or `partials/`. Netlify/Vercel config with headers will be added in the SEO and performance step.
