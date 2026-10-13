import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.woff2': 'font/woff2'
};

export function createStaticServer({ directory = 'public', basePath = '/' } = {}) {
  const root = resolve(projectRoot, directory);
  const prefix = '/' + basePath.split('/').filter(Boolean).join('/') + '/';
  const base = prefix === '//' ? '/' : prefix;

  return createServer(async (req, res) => {
    const reply = (status, text) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(req.method === 'HEAD' ? undefined : text);
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      reply(405, 'Method not allowed');
      return;
    }

    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (base !== '/' && pathname === base.slice(0, -1)) {
        res.writeHead(308, { Location: base });
        res.end();
        return;
      }
      if (!pathname.startsWith(base)) { reply(404, 'Not found'); return; }
      const relative = pathname.slice(base.length);
      if (relative.includes('\0') || relative.includes('\\') || relative.split('/').some(part => part.startsWith('.'))) {
        reply(404, 'Not found');
        return;
      }

      let file = resolve(root, relative);
      if (file !== root && !file.startsWith(root + sep)) { reply(404, 'Not found'); return; }
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      const content = await readFile(file);
      res.writeHead(200, {
        'Content-Type': types[extname(file)] || 'application/octet-stream',
        'Content-Length': content.length,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error instanceof URIError) reply(400, 'Invalid URL');
      else if (['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) reply(404, 'Not found');
      else { reply(500, 'Unable to serve file'); console.error(error.message); }
    }
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const args = process.argv.slice(2);
  const options = { directory: 'public', basePath: '/', port: 4173 };
  for (let i = 0; i < args.length; i += 2) {
    const key = { '--directory': 'directory', '--base-path': 'basePath', '--port': 'port' }[args[i]];
    if (!key || args[i + 1] === undefined) throw new Error('Erlaubt: --directory, --base-path, --port (jeweils mit Wert).');
    options[key] = args[i + 1];
  }
  const port = Number(options.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Der Port muss zwischen 1 und 65535 liegen.');
  await stat(resolve(projectRoot, options.directory));
  const server = createStaticServer(options);
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    const base = '/' + options.basePath.split('/').filter(Boolean).join('/');
    console.log(`Flammenlabor: http://127.0.0.1:${port}${base === '/' ? '/' : base + '/'}`);
  });
}
