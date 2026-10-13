import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { createStaticServer } from '../scripts/serve.mjs';

async function start(t, basePath = '/') {
  const server = createStaticServer({ basePath });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}

for (const basePath of ['/', '/Flammenf-rbung/']) {
  test(`HTML und alle Module laden unter ${basePath}`, async t => {
    const origin = await start(t, basePath);
    const url = origin + basePath;
    const response = await fetch(url);
    assert.equal(response.status, 200);
    const html = await response.text();
    const files = new Set(['data.js', 'model.js', 'render.js', 'journal.js']);
    for (const [, asset] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (asset.startsWith('#')) continue;
      assert(asset.startsWith('./'));
      files.add(asset);
    }
    for (const file of files) {
      const asset = await fetch(new URL(file, url));
      assert.equal(asset.status, 200, file);
      const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'image/svg+xml';
      assert(asset.headers.get('content-type').startsWith(type), file);
    }
  });
}

test('Die Projektadresse bekommt den für relative Assets nötigen abschließenden Slash', async t => {
  const origin = await start(t, '/Flammenf-rbung/');
  const response = await fetch(origin + '/Flammenf-rbung', { redirect: 'manual' });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), '/Flammenf-rbung/');
});

test('Nur öffentliche Dateien werden geliefert; unbekannte Assets ergeben 404', async t => {
  const origin = await start(t);
  for (const path of ['/README.md', '/package.json', '/.git/config', '/..%2fREADME.md', '/missing.js']) {
    assert.equal((await fetch(origin + path)).status, 404, path);
  }
  assert.equal((await fetch(origin + '/%ZZ')).status, 400);
});

test('HEAD hat keinen Body; Schreibmethoden werden abgelehnt', async t => {
  const origin = await start(t);
  const head = await fetch(origin + '/app.js', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(origin + '/', { method: 'POST' })).status, 405);
});
