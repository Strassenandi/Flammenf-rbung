import assert from 'node:assert/strict';
import test from 'node:test';
import { Journal } from '../public/journal.js';

const KEY = 'flammenlabor-journal-v1';
const record = { title: 'Kupfer', label: 'Blaugrün', settings: 'Luft: 85 %', color: 'rgb(36,219,167)' };

function node() {
  return {
    children: [], textContent: '', disabled: false, style: { setProperty() {} },
    classList: { toggle() {} }, setAttribute() {}, addEventListener() {},
    append(...children) { this.children.push(...children); },
    replaceChildren() { this.children = []; }, click() {}
  };
}

function environment(t, stored = '[]') {
  const elements = new Map();
  const document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, node()); return elements.get(id); },
    querySelector(selector) { return this.getElementById(selector); },
    createElement() { return node(); }
  };
  let data = stored;
  t.mock.method(globalThis, 'setTimeout', callback => { callback(); return 0; });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem(key) { assert.equal(key, KEY); return data; },
    setItem(key, value) { assert.equal(key, KEY); data = value; }
  } });
  t.after(() => { delete globalThis.document; delete globalThis.localStorage; });
  return { document, elements, stored: () => data };
}

test('Beobachtungen bleiben nach erneutem Laden erhalten und lassen sich löschen', t => {
  const env = environment(t);
  const journal = new Journal(() => {});
  journal.add(record);
  const reloaded = new Journal(() => {});
  assert.equal(reloaded.entries.length, 1);
  assert.equal(reloaded.entries[0].title, 'Kupfer');
  assert.equal(env.document.getElementById('export').disabled, false);
  reloaded.remove(reloaded.entries[0].id);
  assert.deepEqual(JSON.parse(env.stored()), []);
});

test('Das Laborbuch begrenzt die Sammlung auf zwölf aktuelle Beobachtungen', t => {
  environment(t);
  const journal = new Journal(() => {});
  for (let i = 0; i < 15; i++) journal.add({ ...record, title: `Versuch ${i}` });
  assert.equal(journal.entries.length, 12);
  assert.equal(journal.entries[0].title, 'Versuch 14');
  journal.clear();
  assert.equal(journal.entries.length, 0);
});

test('Ungültige gespeicherte Einträge werden beim Laden ignoriert', t => {
  environment(t, JSON.stringify([{ ...record, id: 'test', date: new Date().toISOString() }, { title: 'unvollständig' }, null]));
  const journal = new Journal(() => {});
  assert.equal(journal.entries.length, 1);
});

test('Ohne Speicherzugriff bleibt das Laborbuch für diese Sitzung nutzbar', t => {
  const env = environment(t);
  globalThis.localStorage.getItem = () => { throw new Error('Blocked'); };
  globalThis.localStorage.setItem = () => { throw new Error('Blocked'); };
  const journal = new Journal(() => {});
  journal.add(record);
  assert.equal(journal.available, false);
  assert.equal(journal.entries.length, 1);
  assert.match(env.document.querySelector('.local-note').textContent, /Sitzung/);
});

test('CSV enthält Unicode, maskierte Anführungszeichen und geschützte Formelfelder', async t => {
  environment(t);
  let exported;
  t.mock.method(URL, 'createObjectURL', blob => { exported = blob; return 'blob:test'; });
  t.mock.method(URL, 'revokeObjectURL', () => {});
  const journal = new Journal(() => {});
  journal.add({ ...record, title: '=1+1', label: 'Blaugrün; "hell"' });
  journal.export();
  const bytes = new Uint8Array(await exported.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  const csv = await exported.text();
  assert.match(csv, /"'=1\+1"/);
  assert(csv.includes('"Blaugrün; ""hell"""'));
  assert(csv.includes('\r\n'));
});
