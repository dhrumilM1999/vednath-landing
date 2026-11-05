// Builds a deployable copy of the site into dist/.
// With BASE set (e.g. BASE=/vednath-landing/ for GitHub Pages project sites), every
// root-relative URL ("/assets/…", "/about/") is prefixed so the site works from a sub-path.
// With no BASE (custom domain, Netlify, Vercel) the files are copied unchanged.
// Usage: node scripts/build.mjs            → dist/ for a root domain
//        BASE=/vednath-landing/ node scripts/build.mjs
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OUT = join(ROOT, 'dist');
const BASE = (process.env.BASE || '/').replace(/\/?$/, '/');

// Source-only files and folders that must not be published.
const EXCLUDE = new Set([
  'node_modules', 'scripts', 'docs', 'partials', 'dist', '.git', '.github', '.claude',
  'package.json', 'package-lock.json', 'README.md', 'TODO-CLIENT.md',
  '.gitignore', '.gitattributes', 'vednath-handoff.zip',
]);
const REWRITE = new Set(['.html', '.css', '.js', '.webmanifest', '.xml', '.txt']);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const entry of await readdir(ROOT, { withFileTypes: true })) {
  if (EXCLUDE.has(entry.name) || entry.name.endsWith('.zip')) continue;
  await cp(join(ROOT, entry.name), join(OUT, entry.name), { recursive: true });
}

function prefix(text) {
  if (BASE === '/') return text;
  const b = BASE.slice(0, -1); // "/vednath-landing"
  return text
    // attribute / string values: "/x"  '/x'  but not "//cdn" protocol-relative
    .replace(/(["'])\/(?!\/)/g, `$1${b}/`)
    // CSS url(/x) without quotes
    .replace(/url\(\/(?!\/)/g, `url(${b}/`)
    // srcset / imagesrcset lists: ", /x"
    .replace(/,\s+\/(?!\/)/g, (m) => m.replace('/', `${b}/`));
}

let count = 0;
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { await walk(full); continue; }
    const ext = extname(entry.name);
    if (!REWRITE.has(ext) || full.includes(join('assets', 'vendor'))) continue;
    const src = await readFile(full, 'utf8');
    const out = prefix(src);
    if (out !== src) { await writeFile(full, out); count++; }
  }
}
await walk(OUT);
await writeFile(join(OUT, '.nojekyll'), '');
console.log(`Built dist/ (base ${BASE}); rewrote URLs in ${count} file(s).`);
