# Build Prompt — Vednath Ayurved Website

You are a senior front-end engineer and an award-level (Awwwards / CSS Design Awards) web designer, working with me on a real client project. I want to grow as a developer, so explain key decisions briefly and challenge me if I suggest something worse.

## 1. Inputs (attached)
- `Master.md`: the **only source of truth** for clinic facts. Read it fully first.
- `assets/pamphlet.png`: the official pamphlet (logo, brand colours, treatments list).
- `assets/treatment-board.png`: the treatment board inside the clinic.
- The Git repo for this project. Commit your work there.

## 2. Goal
A world-class website for **Vednath Ayurved – Ayurveda & Panchakarma Hospital, Adajan, Surat**. Within 3 seconds the visitor should think "OMG, this is premium, and I trust this doctor." The site must still load fast on a mid-range Android phone on 4G.

**Art direction: "Modern Ayurvedic Luxury."** Calm, earthy, cinematic, as if a high-end wellness brand had redesigned a traditional vaidya's practice. It must **not** look like a template: no Bootstrap look, no stock "smiling doctor with stethoscope", no purple AI gradients, no neon.

## 3. Design inspiration (motion-first landing pages, as seen on motionsites.ai, land-book.com, recent.design and landdding.com)
Adapt these patterns to an Ayurveda brand. Take the techniques, not the looks:
1. **Cinematic motion hero:** a full-viewport hero with a slow, living background: an animated sun-ray/mandala from the logo drawn in SVG, or a subtle WebGL/canvas "herbal smoke" or flowing-oil shader. A large editorial headline revealed word by word. Use a static poster image as the LCP element, and start the motion only after load.
2. **Huge editorial typography:** oversized serif display headings mixed with a clean sans. Gujarati and English headlines should feel like magazine covers.
3. **Stats/trust row immediately under the hero:** Google 5.0★ · 69 reviews · BAMS (GAU) · Nadi Pariksha. Count up when visible. Use only real numbers from Master.md.
4. **Bento-grid services:** asymmetric cards of different sizes for Panchakarma, Garbh Sanskar, Suvarnaprashan, Consultation and Diet. On hover, a slight 3D tilt, a spotlight/glow that follows the cursor, and an image zoom.
5. **Scroll storytelling:** a pinned section where scroll drives a "Panchakarma Journey" (Purvakarma → Pradhan Karma → Paschat Karma) with a progress line and crossfading illustrations.
6. **Infinite marquee:** a slow ribbon of conditions treated (skin, joints, migraine, PCOS, thyroid…) in Gujarati and English, which pauses on hover.
7. **Tactile textures:** paper grain/noise overlay, botanical SVG line art that draws itself on scroll (stroke-dashoffset), and soft shadows like handmade paper.
8. **Liquid / magnetic micro-interactions:** magnetic primary buttons, liquid fill on hover, smooth custom cursor on desktop only, ripple feedback on tap.
9. **Testimonial carousel** with drag/swipe and a "Read on Google" link to the live profile.
10. **Bold closing CTA band** with a benefit-led headline ("Begin your healing journey") and two actions: WhatsApp (primary) and Call (secondary).
11. **Smooth page transitions** using the View Transitions API (with a graceful fallback).
12. A **light/dark theme toggle** where dark mode feels like a candle-lit therapy room (deep green-black, warm gold accents).

**Signature interactive feature:** a **"Know your Prakriti" quiz** (8–10 questions on Vata/Pitta/Kapha, client-side only). It ends with an animated dosha result card, a "Book a Nadi Pariksha" CTA, and a clear note that the quiz is not a diagnosis.

## 4. Hard rules (non-negotiable)
1. **Facts only from Master.md.** Never invent doctor details, fees, timings, stats, awards, years or reviews. Where data is missing, use a visible `{{TODO: …}}` placeholder and list every one in `TODO-CLIENT.md`.
2. **Medical compliance (Master.md §16):** no "cure" or "100% cured"; cancer only as "supportive care"; **leave mucormycosis out**; COVID only as "post-COVID recovery support"; a footer medical disclaimer; testimonials only as Master.md allows.
3. **Stack:** plain **HTML5 + modern CSS + vanilla JS (ES modules)**. No React/Vue/jQuery/Bootstrap/Tailwind. GSAP + ScrollTrigger is allowed **only** if native CSS scroll-driven animations and IntersectionObserver can't do the job. Justify it, and load it lazily. A small build step (Vite or a Node script) is OK for minification, image optimisation and HTML partials. The output must be a static site deployable to Netlify, Vercel or GitHub Pages.
4. **Bilingual:** Gujarati (default, `/`) and English (`/en/`) as real static pages, with `hreflang`, a language switcher that stays on the same page, and correct Gujarati typography.
5. **No AI-generated "fake clinic" photos presented as real.** Use illustrations, abstract botanical imagery or clearly marked placeholders until the clinic sends real photos.

## 5. Performance budget ("OMG" is not allowed to slow the site down)
- Lighthouse mobile: **Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100**
- LCP < 2.0 s · CLS < 0.05 · INP < 200 ms
- JS for the first paint ≤ 40 KB gzipped. Heavy effects (WebGL, GSAP, quiz) load lazily, after interaction or on idle.
- Animate only `transform`, `opacity` and `filter`. Use `will-change` sparingly. Pause offscreen animations.
- **`prefers-reduced-motion`:** turn off parallax, the shader and the marquee, and show static versions.
- Low-end devices (`navigator.hardwareConcurrency`, `saveData`): skip WebGL and use the CSS fallback.
- Images: AVIF/WebP, `srcset`, explicit width and height, lazy-loading below the fold, hero < 150 KB.
- Fonts: at most 2 families, self-hosted and subset (for example, a Gujarati family such as Hind Vadodara or Noto Serif Gujarati, plus one elegant display serif), with `font-display: swap`.
- Critical CSS inlined; Google Maps behind a click-to-load facade; no render-blocking third-party scripts.
- The site must still work with JS disabled (progressive enhancement).

## 6. Pages (Master.md §18)
Home · About · Doctor (Dr. Grishm Shingala) · Services (Consultation: in-person and online · Panchakarma · Garbh Sanskar · Suvarnaprashan · Diet & Lifestyle) · Conditions (filterable grid) · Prakriti Quiz · Reviews · Blog (3 starter articles drawn from Master.md §14 Instagram topics) · Gallery · Contact · Privacy · Disclaimer · a styled 404 page

## 7. Conversion
- A sticky mobile action bar: **Call** (+91 99256 04218) · **WhatsApp** · **Directions**
- A booking form (name, phone, preferred date, in-person or online, short concern) that **opens WhatsApp with a pre-filled message**. No backend and no stored health data. Validate the inputs and keep the form accessible.
- A click-to-load map using the Master.md coordinates

## 8. SEO
JSON-LD `MedicalClinic` + `Physician` + `LocalBusiness` (address, geo, phone, hours as a TODO, sameAs links to Instagram, Facebook and Google). Unique titles and meta descriptions in both languages, OG/Twitter cards, `sitemap.xml`, `robots.txt`, canonical URLs, a web manifest and a favicon set made from the logo. Local keywords: "Ayurvedic doctor in Adajan Surat", "Panchakarma Surat", "Garbh Sanskar Surat", plus the Gujarati equivalents.

## 9. Accessibility (WCAG 2.2 AA)
Semantic landmarks, a skip link, visible focus styles, contrast ≥ 4.5:1, full keyboard support (including the quiz and carousel), correct `lang` attributes, alt text, form errors announced to screen readers, and no information conveyed by motion alone.

## 10. Workflow (follow in order)
1. **Read and plan:** Read Master.md and the images. Then propose the folder structure, design tokens (colours, type scale, spacing, motion durations and easing), how header and footer are reused without a framework, which effects use CSS vs JS vs WebGL and why, the performance strategy, risks and the placeholder list. **Wait for my OK.**
2. **Design system:** `tokens.css`, typography, buttons, cards and motion utilities, shown on a `/styleguide` page.
3. **Home page** (Gujarati + English), with all the signature effects. **Stop for my review.**
4. Remaining pages → quiz → SEO → accessibility → performance pass.
5. **Verify:** Lighthouse on mobile and desktop (show the scores); Playwright screenshots at 360, 768 and 1440 px; check for horizontal scroll, broken links and console errors; test reduced-motion mode. Fix everything before saying it's done.
6. Small, meaningful commits.

After each major step, tell me briefly: what changed, why this approach, what I should learn, what to test, and any technical debt.

## 11. Deliverables
The source in the repo + `README.md` (run, build, deploy, folder structure, how to edit content and translations) + `TODO-CLIENT.md` + the Lighthouse report and screenshots.

Start with step 1. **Do not write code until I approve the plan.**
