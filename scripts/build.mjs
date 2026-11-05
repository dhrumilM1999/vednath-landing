// Builds an optimised, deployable copy of the site into dist/.
//
//  1. Copies the site (source-only folders excluded).
//  2. Per HTML page:
//     - replaces the <link rel="stylesheet"> tags with ONE inlined, minified <style>
//       (no render-blocking CSS requests: fastest first paint on 4G)
//     - adds JSON-LD: BreadcrumbList (from the visible breadcrumb) and BlogPosting
//       (for /blog/<slug>/ pages), so source pages don't have to repeat it
//  3. Minifies our own JS modules with esbuild (vendor files are already minified).
//  4. With BASE set (GitHub Pages project sites live at /<repo>/), prefixes every
//     root-relative URL so the site works from a sub-path.
//
// Usage: node scripts/build.mjs                       → dist/ for a root domain
//        BASE=/vednath-landing/ node scripts/build.mjs  → dist/ for GitHub Pages
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform as cssTransform } from 'lightningcss';
import { transform as jsTransform } from 'esbuild';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = join(ROOT, 'dist');
const BASE = (process.env.BASE || '/').replace(/\/?$/, '/');
const SITE = 'https://www.vednathayurved.com';

const EXCLUDE = new Set([
  'node_modules', 'scripts', 'docs', 'partials', 'dist', '.git', '.github', '.claude',
  'package.json', 'package-lock.json', 'README.md', 'TODO-CLIENT.md',
  '.gitignore', '.gitattributes',
]);
const REWRITE = new Set(['.html', '.css', '.js', '.webmanifest', '.xml', '.txt']);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const entry of await readdir(ROOT, { withFileTypes: true })) {
  if (EXCLUDE.has(entry.name) || entry.name.endsWith('.zip')) continue;
  await cp(join(ROOT, entry.name), join(OUT, entry.name), { recursive: true });
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

// ---------- CSS: concatenate + minify once per unique set of stylesheets ----------
const cssCache = new Map();
async function inlineCss(hrefs) {
  const key = hrefs.join('|');
  if (!cssCache.has(key)) {
    const src = (await Promise.all(hrefs.map((h) => readFile(join(ROOT, h), 'utf8')))).join('\n');
    const { code } = cssTransform({ filename: 'site.css', code: Buffer.from(src), minify: true });
    cssCache.set(key, code.toString());
  }
  return cssCache.get(key);
}

// ---------- JSON-LD helpers ----------
const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function breadcrumbLd(html, pageUrl) {
  const nav = html.match(/<nav class="breadcrumb"[\s\S]*?<\/nav>/);
  if (!nav) return null;
  const items = [...nav[0].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m, i) => {
    const a = m[1].match(/href="([^"]+)"/);
    return {
      '@type': 'ListItem',
      position: i + 1,
      name: decode(strip(m[1])),
      item: a ? SITE + a[1] : pageUrl,
    };
  });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

function articleLd(html, pageUrl, lang) {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const desc = html.match(/<meta name="description" content="([^"]+)"/);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: decode(strip(h1 ? h1[1] : '')),
    description: desc ? decode(desc[1]) : undefined,
    inLanguage: lang,
    mainEntityOfPage: pageUrl,
    image: `${SITE}/assets/img/og-default.jpg`,
    datePublished: '2026-11-05',
    dateModified: '2026-11-05',
    author: { '@type': 'Organization', name: 'Vednath Ayurved', url: `${SITE}/` },
    publisher: { '@type': 'Organization', name: 'Vednath Ayurved', logo: { '@type': 'ImageObject', url: `${SITE}/assets/img/logo.png` } },
  };
}

// ---------- Base-path prefixing ----------
function prefix(text) {
  if (BASE === '/') return text;
  const b = BASE.slice(0, -1);
  return text
    .replace(/(["'])\/(?!\/)/g, `$1${b}/`)        // "/x"  '/x'
    .replace(/url\(\/(?!\/)/g, `url(${b}/`)        // url(/x)
    .replace(/,\s+\/(?!\/)/g, (m) => m.replace('/', `${b}/`)); // srcset lists
}

let pages = 0, jsFiles = 0;
for await (const file of walk(OUT)) {
  const ext = extname(file);
  const rel = relative(OUT, file).split(sep).join('/');

  if (ext === '.html') {
    let html = await readFile(file, 'utf8');
    const url = rel === 'index.html' ? '/' : rel.endsWith('/index.html') ? '/' + rel.slice(0, -10) : '/' + rel;
    const pageUrl = SITE + url;
    const lang = (html.match(/<html lang="([^"]+)"/) || [])[1] || 'en';

    // 1. Inline + minify CSS
    const hrefs = [...html.matchAll(/<link rel="stylesheet" href="(\/assets\/css\/[^"]+)">\s*/g)].map((m) => m[1]);
    if (hrefs.length) {
      const css = await inlineCss(hrefs);
      let done = false;
      html = html.replace(/<link rel="stylesheet" href="\/assets\/css\/[^"]+">\s*/g, () => {
        if (done) return '';
        done = true;
        return `<style>${css}</style>\n`;
      });
    }

    // 2. Structured data
    const ld = [];
    const bc = breadcrumbLd(html, pageUrl);
    if (bc) ld.push(bc);
    if (/^\/(gu\/)?blog\/[^/]+\/$/.test(url)) ld.push(articleLd(html, pageUrl, lang));
    if (ld.length) {
      const tags = ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n');
      html = html.replace('</head>', `${tags}\n</head>`);
    }

    await writeFile(file, prefix(html));
    pages++;
    continue;
  }

  if (ext === '.js' && rel.startsWith('assets/js/')) {
    const src = await readFile(file, 'utf8');
    const { code } = await jsTransform(src, { minify: true, format: 'esm', target: 'es2022' });
    await writeFile(file, prefix(code));
    jsFiles++;
    continue;
  }

  if (REWRITE.has(ext) && !rel.startsWith('assets/vendor/')) {
    const src = await readFile(file, 'utf8');
    const out = prefix(src);
    if (out !== src) await writeFile(file, out);
  }
}

// Source CSS is inlined into every page; the standalone files aren't needed in dist.
await rm(join(OUT, 'assets', 'css'), { recursive: true, force: true });
await writeFile(join(OUT, '.nojekyll'), '');
console.log(`Built dist/ (base ${BASE}): ${pages} pages, ${jsFiles} JS modules minified, CSS inlined (${[...cssCache.values()].map((c) => (c.length / 1024).toFixed(1) + ' KB').join(', ')}).`);
