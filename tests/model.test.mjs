import assert from 'node:assert/strict';
import test from 'node:test';
import { SAMPLES } from '../public/data.js';
import { FlameModel, lightMix } from '../public/model.js';

function peak(model) { model.elapsed = 0.6; return model.view(); }

test('Jede der sieben Salzproben liefert ein endliches Farbsignal', () => {
  assert.equal(SAMPLES.length, 7);
  for (const sample of SAMPLES) {
    const model = new FlameModel();
    assert.equal(model.heat([sample.id]), true);
    const view = peak(model);
    assert.equal(view.active, true);
    assert(view.signalWeight > 0);
    for (const value of view.observed) assert(Number.isFinite(value) && value >= 0 && value <= 255);
  }
});

test('Leere Probe und ausgeschalteter Brenner starten keinen Versuch', () => {
  const model = new FlameModel();
  assert.equal(model.heat([]), false);
  model.on = false;
  assert.equal(model.heat(['cu']), false);
  assert.equal(model.active, false);
});

test('Luftzufuhr verändert das gelbe Grundsignal und den Probenkontrast', () => {
  const model = new FlameModel();
  model.heat(['cu']);
  model.air = 0;
  const closed = peak(model);
  model.air = 100;
  const open = peak(model);
  assert(closed.yellow > open.yellow);
  assert(closed.baseWeight > open.baseWeight);
  assert(open.signalWeight > closed.signalWeight);
});

test('Natrium überstrahlt Kalium; Kobaltglas schwächt den Natriumanteil', () => {
  const model = new FlameModel();
  model.sodium = true;
  model.heat(['k']);
  const unfiltered = peak(model);
  model.cobalt = true;
  const filtered = peak(model);
  assert(unfiltered.na > 0.62);
  assert(filtered.na < 0.1);
  assert.notDeepEqual(unfiltered.observed, filtered.observed);
});

test('Natriumrückstand bleibt am Draht, bis er gereinigt wird', () => {
  const model = new FlameModel();
  model.heat(['na']);
  model.withdraw();
  model.heat(['k']);
  assert(peak(model).na > 0.62);
  model.clean();
  assert.equal(model.dirty, false);
  assert.equal(model.active, false);
  model.heat(['k']);
  assert.equal(peak(model).na, 0);
});

test('Größere Proben halten länger; die Färbung klingt ab', () => {
  const little = new FlameModel();
  little.amount = 1;
  little.heat(['cu']);
  const much = new FlameModel();
  much.amount = 3;
  much.heat(['cu']);
  assert(much.duration > little.duration);
  const start = peak(much);
  much.elapsed = much.duration - 0.1;
  assert(much.view().signalWeight < start.signalWeight);
  much.elapsed = much.duration;
  assert.equal(much.active, false);
  assert.equal(much.view().signalWeight, 0);
});

test('Pause friert den Versuch ein, Fortsetzen bewegt ihn weiter', () => {
  const model = new FlameModel();
  model.heat(['cu']);
  model.paused = true;
  model.tick(0.1);
  assert.equal(model.elapsed, 0);
  model.paused = false;
  model.tick(0.1);
  assert(model.elapsed > 0);
});

test('Mischungen überlagern Licht unabhängig von der Auswahlreihenfolge', () => {
  const first = new FlameModel();
  first.heat(['cu', 'na']);
  const second = new FlameModel();
  second.heat(['na', 'cu']);
  assert.deepEqual(peak(first).observed, peak(second).observed);
  assert.equal(first.view().components.length, 2);
  assert.deepEqual(lightMix([{ color: [100, 150, 200], weight: 1 }]), [100, 150, 200]);
});

test('Kobaltglas verringert Lichtleistung jeder Probe, ohne einen Bestandteil zu verstärken', () => {
  for (const sample of SAMPLES) {
    const model = new FlameModel();
    model.heat([sample.id]);
    const direct = peak(model);
    model.cobalt = true;
    const glass = peak(model);
    assert(glass.signalWeight < direct.signalWeight, sample.id);
    assert(glass.brightness < direct.brightness, sample.id);
    assert(glass.totalTransmission > 0 && glass.totalTransmission < 1);
    for (const part of glass.components) {
      assert(part.weight < direct.components.find(p => p.id === part.id).weight);
    }
  }
});

test('Reines Natrium erhält hinter Kobaltglas kein künstliches violettes Probensignal', () => {
  const model = new FlameModel();
  model.heat(['na']);
  const direct = peak(model);
  model.cobalt = true;
  const glass = peak(model);
  assert.deepEqual(glass.components.map(p => p.id), ['na']);
  assert.deepEqual(glass.signal, direct.signal);
  assert(glass.signalWeight < direct.signalWeight / 20);
});

test('Im Na/K-Gemisch wird Kalium relativ deutlicher und absolut schwächer', () => {
  const model = new FlameModel();
  model.heat(['na', 'k']);
  const direct = peak(model);
  model.cobalt = true;
  const glass = peak(model);
  const directK = direct.components.find(p => p.id === 'k');
  const filteredK = glass.components.find(p => p.id === 'k');
  assert(direct.na > 0.9);
  assert(glass.na < 0.5);
  assert(filteredK.weight < directK.weight);
  assert(filteredK.weight > glass.components.find(p => p.id === 'na').weight);
});

test('Filterwechsel verändert weder Probe noch Rückstände, Zeitpunkt oder Leuchtdauer', () => {
  const model = new FlameModel();
  model.sodium = true;
  model.heat(['k']);
  const direct = peak(model);
  const state = { current: structuredClone(model.current), residue: [...model.residue], elapsed: model.elapsed, duration: model.duration };
  model.cobalt = true;
  model.view();
  model.cobalt = false;
  assert.deepEqual(model.view(), direct);
  assert.deepEqual({ current: model.current, residue: [...model.residue], elapsed: model.elapsed, duration: model.duration }, state);
});

test('Auch gelbes Rußleuchten wird durch das Glas gedämpft; eine Leerprobe bleibt leer', () => {
  const model = new FlameModel();
  model.air = 0;
  const direct = model.view();
  model.cobalt = true;
  const glass = model.view();
  assert(glass.baseWeight < direct.baseWeight / 20);
  assert.equal(glass.signalWeight, 0);
  assert.equal(glass.components.length, 0);
  assert.equal(glass.active, false);
  assert(glass.observed.every((channel, index) => channel < direct.observed[index]));
});

test('Reinigung entfernt Drahtreste, die zusätzlich eingeschaltete Natriumspur bleibt wirksam', () => {
  const model = new FlameModel();
  model.heat(['na']);
  model.sodium = true;
  model.clean();
  model.heat(['k']);
  assert(peak(model).na > 0.62);
  model.clean();
  model.sodium = false;
  model.heat(['k']);
  assert.equal(peak(model).na, 0);
});

test('Gefilterte Mischungen bleiben unabhängig von Auswahlreihenfolge und nach Abklingen dunkel', () => {
  const first = new FlameModel();
  const second = new FlameModel();
  first.cobalt = second.cobalt = true;
  first.heat(['na', 'k']);
  second.heat(['k', 'na']);
  assert.deepEqual(peak(first).observed, peak(second).observed);
  first.elapsed = first.duration;
  assert.equal(first.view().signalWeight, 0);
  first.on = false;
  assert.equal(first.view().brightness, 0);
});
