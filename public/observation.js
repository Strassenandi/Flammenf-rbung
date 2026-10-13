import {byId} from './data.js';

// Keep observations consistent across single samples, mixtures and blind tests.
export function describeObservation(v,{tested,mode='single',air=85}){
  const hasNa=tested.includes('na'),hasK=tested.includes('k');
  if(air<30)return {label:'Luftzufuhr zu gering',text:v.cobalt?'Kobaltglas schwächt auch das gelbe Rußleuchten. Für eine brauchbare Flammenprobe brauchst du trotzdem eine heiße, nichtleuchtende Grundflamme. Öffne die Luftzufuhr.':'Bei wenig Luft leuchten Rußteilchen gelb und verdecken die Probenfarbe. Öffne die Luftzufuhr und vergleiche in der blauen, nichtleuchtenden Grundflamme.'};
  if(v.cobalt){
    if(mode==='unknown')return {label:'Gedämpfte Filteransicht',text:'Kobaltglas schwächt Natriumgelb besonders stark und macht die Ansicht dunkler. Eine verbleibende Färbung ist ein Hinweis, aber keine eindeutige Identifikation. Vergleiche mit und ohne Glas.'};
    const dominant=[...v.components].sort((a,b)=>b.weight-a.weight)[0];
    if(hasK&&tested.every(id=>id==='k'||id==='na')&&dominant?.id==='k'&&v.na<.5){
      return {label:v.unfilteredNa>.62?'Kalium trotz Natrium erkennbar':'Violettes Kaliumsignal',text:v.unfilteredNa>.62?'Ohne Glas überstrahlt Natriumgelb die Kaliumfärbung. Durch Kobaltglas ist der violette Kaliumanteil besser zu erkennen, obwohl auch er schwächer wird. Das Glas filtert Licht zwischen Flamme und Auge; die Probe bleibt unverändert.':'Bei sauberem Kalium ist die zart violette Färbung schon ohne Glas sichtbar. Kobaltglas verstärkt sie nicht: Es dämpft auch Kalium, unterdrückt Natriumgelb aber viel stärker. Vergleiche die dunklere Ansicht mit und ohne Glas.'};
    }
    if(hasNa&&tested.length===1)return {label:'Natriumgelb stark gedämpft',text:'Das Glas schwächt die gelbe Natriumemission stark. Das verbleibende blaue Licht gehört zur Brennerflamme und ist kein Kaliumsignal. Kobaltglas erzeugt keine neue Flammenfarbe.'};
    if(v.na>.62)return {label:'Restliches Natriumgelb',text:'Kobaltglas schwächt Natriumgelb stark, entfernt es aber nicht vollständig. Bei einem sehr starken Natriumanteil kann die andere Färbung weiter verdeckt bleiben. Vergleiche mit einer sauberen Einzelprobe.'};
    return {label:tested.length>1?'Gedämpfte Mischfarbe':'Gedämpfte Flammenfarbe',text:'Kobaltglas dämpft auch andere Farbanteile und verdunkelt die Ansicht. Eine Färbung hinter dem Glas beweist allein kein Kalium. Vergleiche zusätzlich die ungefilterte Flamme.'};
  }
  if(v.na>.62&&(!hasNa||tested.length>1))return {label:hasK&&mode!=='unknown'?'Natriumgelb überlagert Kalium':'Natriumgelb überlagert',text:'Das starke Natriumsignal überstrahlt die schwächere Probenfarbe. Vergleiche mit Kobaltglas. Rückstände entfernst du mit „Draht reinigen“; die zusätzlich eingeschaltete Natriumspur bleibt dabei aktiv.'};
  if(mode==='mix'&&tested.length>1)return {label:'Überlagerte Flammenfarben',text:'Die Lichtanteile der Proben überlagern sich. Eine Mischfarbe ist kein eindeutiger Nachweis ihrer Bestandteile; prüfe die Proben auch einzeln.'};
  const probe=byId(tested[0]);
  const dominant=[...v.components].sort((a,b)=>b.weight-a.weight)[0];
  const label=mode==='unknown'?'Färbung von Probe X':dominant&&dominant.id!==probe.id?'Überlagerte Farbsignale':probe.label;
  let text=mode==='unknown'?'Vergleiche mit dem Farbatlas. Bei verdecktem Signal helfen ein sauberer Draht, eine blaue Grundflamme und der Vergleich durch Kobaltglas.':probe.note;
  if(v.na>.18&&!hasNa)text+=' Ein gelber Natriumanteil stört die Beobachtung.';
  if(air<65)text+=' Mehr Luft verbessert den Kontrast zur Grundflamme.';
  return {label,text};
}
