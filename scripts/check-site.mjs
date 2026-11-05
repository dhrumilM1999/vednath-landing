// Static checks across every page: broken internal links/assets, unsynced partials,
// duplicate IDs, missing <title>/description/h1, and a count of TODO placeholders.
// Usage: node scripts/check-site.mjs   (exits 1 on any error)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKIP = new Set(['node_modules', 'dist', '.git', 'docs', 'partials', 'scripts', '.github', '.claude']);
const files = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith('.html')) files.push(p);
  }
})('.');

const exists = (u) => {
  u = u.split('#')[0].split('?')[0];
  if (u === '/' || u === '') return existsSync('index.html');
  const p = '.' + decodeURI(u);
  return existsSync(p) && (statSync(p).isFile() || existsSync(join(p, 'index.html')));
};

let errors = 0, todos = 0;
const err = (...a) => { errors++; console.log('ERROR', ...a); };

for (const f of files) {
  const s = readFileSync(f, 'utf8');
  todos += (s.match(/\{\{TODO/g) || []).length;
  for (const m of s.matchAll(/<!-- @([\w-]+) -->\s*<!-- \/@\1 -->/g)) err(f, 'empty partial', m[1]);
  for (const m of s.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    if (!m[1].startsWith('//') && !exists(m[1])) err(f, 'broken link', m[1]);
  }
  for (const m of s.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u.startsWith('/') && !exists(u)) err(f, 'broken srcset', u);
    }
  }
  const ids = [...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = [...new Set(ids.filter((x, i) => ids.indexOf(x) !== i))];
  if (dup.length) err(f, 'duplicate ids', dup.join(', '));
  if (!/<title>[^<]+<\/title>/.test(s)) err(f, 'missing <title>');
  if (!/<meta name="description" content="[^"]+"/.test(s)) err(f, 'missing meta description');
  if ((s.match(/<h1[\s>]/g) || []).length !== 1) err(f, 'should have exactly one <h1>');
}
console.log(`${files.length} pages · ${errors} error(s) · ${todos} TODO placeholder(s)`);
process.exit(errors ? 1 : 0);
