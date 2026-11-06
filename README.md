# Vednath Ayurved: website

**Design v2, "The Vaidya's Almanac"** (live). Colours from the official logo, Anek condensed + Hind / Hind Vadodara, printed-matter components. The first design (v1) is kept at the `v1` git tag/branch and deployed at `/v1/` for comparison.

Styles: `assets/v2/v2.css` (tokens, base, header/footer), `home.css` (home sections), `pages.css` (inner pages; also maps the old v1 class and variable names), `gu.css` (Gujarati pages). Partials: `partials/v2-*.html` and `partials/gu/v2-*.html`. Fonts: `node scripts/fonts.mjs`. Logo + icons: `node scripts/brand.mjs` (reads the client logo folder, which is not committed).

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

## Languages

- English at `/`, Gujarati at `/gu/` with the same slugs (`/services/panchakarma/` ↔ `/gu/services/panchakarma/`).
- The header language switch and `hreflang` tags are filled in automatically by `npm run partials`.
- Gujarati pages use `partials/gu/*.html` and `assets/css/gu.css` (Hind Vadodara, Gujarati typography rules).
- JS strings (form errors, quiz results) live in each module, keyed `{ en, gu }` (see `assets/js/i18n.js`).
- When you add or change an English page, update its `/gu/` twin too.

## Build, preview, verify

```bash
npm run build      # dist/: CSS inlined + minified, JS minified, breadcrumb/BlogPosting JSON-LD added
npm run preview    # build, then serve dist/ at http://localhost:5180/
npm run check      # links, duplicate IDs, one <h1>, titles/descriptions, colour contrast
```

To run the full verification (screenshots, link crawl, reduced motion, keyboard, Lighthouse), install the test-only tools first:

```bash
npm i --no-save playwright@1.56.1 lighthouse@12.8.2
```

```bash
npx playwright install chromium
```

```bash
npm run build && npm run verify
```

Reports go to `docs/lighthouse/` and screenshots to `docs/screenshots/`.

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

Every push to `main` runs `.github/workflows/pages.yml`, which builds with `BASE=/vednath-landing/` and publishes to GitHub Pages: https://dhrumilm1999.github.io/vednath-landing/

For the real domain (Netlify, Vercel or GitHub Pages with a custom domain), run `npm run build` with no `BASE` and publish `dist/`.
