import assert from 'node:assert/strict';
import test from 'node:test';
import {FlameModel} from '../public/model.js';
import {describeObservation} from '../public/observation.js';

function observe(tested, {cobalt=false,sodium=false,air=85,mode='single'}={}) {
  const model=new FlameModel();
  Object.assign(model,{cobalt,sodium,air});
  model.heat(tested);
  model.elapsed=.6;
  return describeObservation(model.view(),{tested,mode,air});
}

test('Kalium mit Natriumspur erklärt Überdeckung und den Vergleich durch Kobaltglas', () => {
  const direct=observe(['k'],{sodium:true});
  const glass=observe(['k'],{sodium:true,cobalt:true});
  assert.match(direct.label,/Natriumgelb.*Kalium/);
  assert.match(glass.label,/Kalium.*Natrium.*erkennbar/);
  assert.match(glass.text,/auch er schwächer/);
});

test('Der Mischmodus erklärt denselben Na/K-Effekt wie die verunreinigte Einzelprobe', () => {
  const direct=observe(['na','k'],{mode:'mix'});
  const glass=observe(['na','k'],{mode:'mix',cobalt:true});
  assert.match(direct.label,/Natriumgelb/);
  assert.match(glass.label,/Kalium.*erkennbar/);
});

test('Reines Natrium wird nicht als Kalium oder neue blaue Probensorte beschrieben', () => {
  const glass=observe(['na'],{cobalt:true});
  assert.equal(glass.label,'Natriumgelb stark gedämpft');
  assert.match(glass.text,/kein Kaliumsignal/);
  assert.match(glass.text,/Brennerflamme/);
});

test('Sauberes Kalium wird durch Kobaltglas nicht als verstärkt beschrieben', () => {
  const glass=observe(['k'],{cobalt:true});
  assert.match(glass.text,/verstärkt sie nicht/);
  assert.match(glass.text,/dämpft auch Kalium/);
});

test('Eine Kalium/Kupfer-Mischung wird nicht als saubere Kaliumprobe ausgewiesen', () => {
  const glass=observe(['k','cu'],{cobalt:true,mode:'mix'});
  assert.equal(glass.label,'Gedämpfte Mischfarbe');
  assert.doesNotMatch(glass.text,/sauberem Kalium/);
});

test('Probe X verrät unabhängig vom Filter kein Element im Beobachtungstitel', () => {
  for(const id of ['na','k','ca','ba','cu'])for(const cobalt of [false,true]){
    const observation=observe([id],{mode:'unknown',cobalt});
    assert.doesNotMatch(observation.label,/Natrium|Kalium|Calcium|Barium|Kupfer|gelb|lila|grün/i);
    assert.doesNotMatch(observation.text,/enthält|besteht aus/);
  }
});

test('Kobaltglas ersetzt keine geeignete Brennerflamme', () => {
  const glass=observe(['k'],{cobalt:true,air:0});
  assert.match(glass.label,/Luftzufuhr/);
  assert.match(glass.text,/schwächt.*Rußleuchten/);
  assert.match(glass.text,/nichtleuchtende Grundflamme/);
});
