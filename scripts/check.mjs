import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const publicRoot = new URL('../public/', import.meta.url);
const html = await readFile(new URL('index.html', publicRoot), 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
let count = 0;

async function localAsset(specifier, source) {
  if (/^(?:#|[a-z][a-z\d+.-]*:|\/\/)/i.test(specifier)) return;
  assert(!specifier.startsWith('/'), `${source}: absoluter Assetpfad ${specifier} funktioniert nicht unter GitHub Pages.`);
  const target = new URL(specifier, new URL(source, publicRoot));
  assert(target.href.startsWith(publicRoot.href), `Asset außerhalb von public/: ${specifier}`);
  assert((await stat(target)).isFile(), `Asset fehlt: ${specifier}`);
}

for (const [, asset] of html.matchAll(/(?:src|href)="([^"]+)"/g)) await localAsset(asset, 'index.html');

async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = new URL(entry.name, directory);
    if (entry.isDirectory()) { await checkDirectory(new URL(entry.name + '/', directory)); continue; }
    if (!/\.(?:m?js)$/.test(entry.name)) continue;
    const result = spawnSync(process.execPath, ['--check', fileURLToPath(file)], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || `Syntaxprüfung fehlgeschlagen: ${file.pathname}`);
    count++;
    if (!file.href.startsWith(publicRoot.href)) continue;
    const source = await readFile(file, 'utf8');
    for (const [, specifier] of source.matchAll(/(?:from|import)\s*['"]([^'"]+)['"]/g)) {
      assert(specifier.startsWith('.'), `Externe Modulabhängigkeit: ${specifier}`);
      await localAsset(specifier, file.href);
    }
    for (const [, id] of source.matchAll(/(?:\$|getElementById)\(['"]([^'"]+)['"]\)/g)) {
      assert(ids.has(id), `${entry.name}: HTML-Element #${id} fehlt.`);
    }
  }
}

for (const directory of ['public', 'scripts', 'tests']) await checkDirectory(new URL(`../${directory}/`, import.meta.url));
const css = await readFile(new URL('style.css', publicRoot), 'utf8');
for (const [, asset] of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) await localAsset(asset, 'style.css');
console.log(`${count} JavaScript-Dateien, HTML-Verweise, CSS-Assets und Modulimporte geprüft.`);
