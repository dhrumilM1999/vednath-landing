// Copies shared partials into every page, between markers:
//   <!-- @header --> ... <!-- /@header -->
// The page files stay complete, deployable HTML (works with JS off, fully crawlable).
// It also marks the current nav link with aria-current="page" based on the file's URL.
// Usage: node scripts/sync-partials.mjs
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PARTIALS = join(ROOT, 'partials');
const SKIP = new Set(['node_modules', 'partials', 'scripts', 'docs', '.git']);

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

function urlFor(file) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

const partials = {};
for (const name of await readdir(PARTIALS)) {
  if (name.endsWith('.html')) {
    partials[name.slice(0, -5)] = (await readFile(join(PARTIALS, name), 'utf8')).trim();
  }
}

let changed = 0;
for await (const file of htmlFiles(ROOT)) {
  const url = urlFor(file);
  const src = await readFile(file, 'utf8');
  let out = src;
  for (const [name, html] of Object.entries(partials)) {
    const re = new RegExp(`(<!-- @${name} -->)[\\s\\S]*?(<!-- /@${name} -->)`, 'g');
    out = out.replace(re, (_, open, close) => {
      // Mark the active nav item: exact match, or section match for nested pages.
      const marked = html.replace(/<a ([^>]*?)data-nav="([^"]+)"([^>]*)>/g, (m, a, nav, b) => {
        const active = nav === url || (nav !== '/' && url.startsWith(nav));
        return `<a ${a}data-nav="${nav}"${b}${active ? ' aria-current="page"' : ''}>`;
      });
      return `${open}\n${marked}\n${close}`;
    });
  }
  if (out !== src) {
    await writeFile(file, out);
    changed++;
    console.log('updated', url);
  }
}
console.log(`Done. ${changed} file(s) updated.`);
