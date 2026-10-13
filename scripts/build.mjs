import { cp, rm, writeFile } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await cp(new URL('../public/', import.meta.url), output, { recursive: true });
await writeFile(new URL('.nojekyll', output), '');
console.log('Flammenlabor bereit in dist/ (statische Dateien, keine Laufzeit-Abhängigkeiten).');
