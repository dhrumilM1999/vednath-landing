// Zero-dependency local static server.
// Mirrors production hosting: clean URLs (/about/ -> /about/index.html), 404.html fallback.
// Usage: node scripts/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Optional 2nd argument: a folder to serve instead of the source (e.g. `dist` to test the build).
const PROJECT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ROOT = process.argv[3] ? resolve(PROJECT, process.argv[3]) : PROJECT;
const PORT = Number(process.argv[2] || process.env.PORT || 5173);
const BLOCKED = ['/node_modules', '/scripts', '/partials', '/docs/source', '/.git'];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath)).replace(/\\/g, '/');
  if (clean.includes('..') || BLOCKED.some((b) => clean.startsWith(b))) return null;
  let file = join(ROOT, clean);
  try {
    const s = await stat(file);
    if (s.isDirectory()) file = join(file, 'index.html');
    await stat(file);
    return file;
  } catch {
    // /about -> /about/index.html
    try {
      const alt = join(ROOT, clean, 'index.html');
      await stat(alt);
      return alt;
    } catch {
      return null;
    }
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  // Redirect /about -> /about/ like Netlify "pretty URLs"
  if (!extname(pathname) && !pathname.endsWith('/')) {
    const dirIndex = await resolveFile(pathname + '/');
    if (dirIndex) {
      res.writeHead(301, { Location: pathname + '/' });
      return res.end();
    }
  }
  const file = await resolveFile(pathname);
  if (!file) {
    const body = await readFile(join(ROOT, '404.html')).catch(() => 'Not found');
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    return res.end(body);
  }
  const body = await readFile(file);
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  res.end(body);
}).listen(PORT, () => {
  console.log(`Vednath dev server → http://localhost:${PORT}/`);
});
