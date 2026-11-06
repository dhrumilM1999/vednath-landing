// Copies shared partials into every page, between markers:
//   <!-- @header --> ... <!-- /@header -->
// The page files stay complete, deployable HTML (works with JS off, fully crawlable).
//
// Bilingual: pages under /gu/ use partials/gu/<name>.html when it exists.
// Tokens replaced per page:
//   {{SITE}}     production origin
//   {{EN_PATH}}  English URL of this page      {{GU_PATH}}  Gujarati URL of this page
//   {{ALT_PATH}} URL of this page in the other language (language switcher)
// Lines containing hreflang tokens are dropped when the other-language page doesn't exist.
// Also marks the current nav link with aria-current="page".
// Usage: node scripts/sync-partials.mjs
import { existsSync, readdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PARTIALS = join(ROOT, 'partials');
const SITE = 'https://www.vednathayurved.com';
const SKIP = new Set(['node_modules', 'partials', 'scripts', 'docs', '.git', 'dist', '.github', '.claude']);

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith('.html')) yield full;
  }
}

const urlFor = (file) => {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
};
const fileFor = (url) => join(ROOT, url.replace(/^\//, ''), url.endsWith('/') ? 'index.html' : '');

const load = async (dir) => {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name.endsWith('.html')) out[name.slice(0, -5)] = (await readFile(join(dir, name), 'utf8')).trim();
  }
  return out;
};
const partials = { en: await load(PARTIALS), gu: await load(join(PARTIALS, 'gu')) };

let changed = 0;
for (const file of htmlFiles(ROOT)) {
  const url = urlFor(file);
  // 404.html: bilingual text, English chrome; its language switch points at /gu/
  const lang = url.startsWith('/gu/') ? 'gu' : 'en';
  const enPath = lang === 'gu' ? url.replace(/^\/gu\//, '/') : url;
  const guPath = lang === 'gu' ? url : `/gu${url}`;
  const altPath = lang === 'gu' ? enPath : guPath;
  const altExists = existsSync(fileFor(altPath));

  const src = await readFile(file, 'utf8');
  let out = src;
  const names = new Set([...Object.keys(partials.en), ...Object.keys(partials.gu)]);
  for (const name of names) {
    const html = (lang === 'gu' && partials.gu[name]) || partials.en[name];
    if (!html) continue;
    const re = new RegExp(`(<!-- @${name} -->)[\\s\\S]*?(<!-- /@${name} -->)`, 'g');
    out = out.replace(re, (_, open, close) => {
      let body = html;
      if (!altExists) body = body.split('\n').filter((l) => !/hreflang=/.test(l) || !/\{\{(GU|EN)_PATH\}\}/.test(l)).join('\n');
      body = body
        .replaceAll('{{SITE}}', SITE)
        .replaceAll('{{EN_PATH}}', enPath)
        .replaceAll('{{GU_PATH}}', guPath)
        .replaceAll('{{ALT_PATH}}', altExists ? altPath : lang === 'gu' ? '/' : '/gu/');
      body = body.replace(/<a ([^>]*?)data-nav="([^"]+)"([^>]*)>/g, (m, a, nav, b) => {
        const home = nav === '/' || nav === '/gu/';
        const active = home ? nav === url : url.startsWith(nav);
        return `<a ${a}data-nav="${nav}"${b}${active ? ' aria-current="page"' : ''}>`;
      });
      return `${open}\n${body}\n${close}`;
    });
  }
  if (out !== src) {
    await writeFile(file, out);
    changed++;
  }
}
console.log(`Done. ${changed} file(s) updated.`);
