import {SAMPLES,SOURCES,byId} from './data.js';
import {FlameModel,cssColor} from './model.js';
import {FlameRenderer} from './render.js';
import {Journal} from './journal.js';
import {describeObservation} from './observation.js';

const $=id=>document.getElementById(id),model=new FlameModel();
let mode='single',selected=['cu'],unknownId=null,unknownSolved=false,observed=false,lastRecord=null,toastTimer,burstTimer;
const unknownOptions=['na','k','ca','ba','cu'];
const amountNames={1:'Wenig',2:'Mittel',3:'Viel'};
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3300);}
function announce(text){$('live-announcement').textContent=text;}
const journal=new Journal(toast);
const renderer=new FlameRenderer($('flame-canvas'),model);

for(const s of SAMPLES){
  const button=document.createElement('button');button.className='sample-button';button.dataset.id=s.id;button.style.setProperty('--sample',s.color);button.draggable=true;button.setAttribute('aria-pressed','false');button.setAttribute('aria-label',s.name+', '+s.salt+', auswählen');
  button.innerHTML='<span class="element-symbol"><small>'+s.number+'</small>'+s.symbol+'</span><span class="sample-name">'+s.name+'<small>'+s.formula+'</small></span><span class="sample-dot" aria-hidden="true"></span>';
  button.addEventListener('click',()=>chooseSample(s.id));button.addEventListener('dragstart',e=>{if(mode==='unknown'){e.preventDefault();return;}e.dataTransfer.setData('application/x-flammenlabor',s.id);e.dataTransfer.setData('text/plain',s.id);e.dataTransfer.effectAllowed='copy';});
  $('samples').append(button);
  const atlas=document.createElement('button');atlas.className='atlas-card';atlas.style.setProperty('--sample',s.color);atlas.setAttribute('aria-label',s.name+': '+s.label+'. Im Labor testen.');atlas.innerHTML='<div class="atlas-art" data-symbol="'+s.symbol+'"><span class="atlas-flame" aria-hidden="true"></span></div><div class="atlas-info"><h3>'+s.name+'</h3><p>'+s.label+'</p><span class="atlas-action">Im Labor testen <svg><use href="#i-arrow"/></svg></span></div>';
  atlas.addEventListener('click',()=>{setMode('single');chooseSample(s.id);$('experiment').scrollIntoView({behavior:renderer.reduceMotion?'instant':'smooth'});$('heat').focus({preventScroll:true});});$('atlas-cards').append(atlas);
}
for(const id of unknownOptions){const option=document.createElement('option');option.value=id;option.textContent=byId(id).name;$('guess').append(option);}
for(const source of SOURCES){const li=document.createElement('li'),a=document.createElement('a'),small=document.createElement('small');a.textContent=source.title;a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';small.textContent=source.detail;li.append(a,small);$('sources').append(li);}

function ids(){return mode==='unknown'?[unknownId]:selected;}
function title(){if(mode==='unknown')return unknownSolved?'Probe X · '+byId(unknownId).name:'Probe X';return selected.map(id=>byId(id).name).join(' + ');}
function resetObservation(){observed=false;lastRecord=null;$('save').disabled=true;$('identify').disabled=true;$('observation-title').textContent=mode==='unknown'?'Was verrät die unbekannte Probe?':'Alles bereit für '+(selected.length?title()+'.':'eine neue Probe.');$('observation-text').textContent=mode==='unknown'?'Erhitze Probe X. Vergleiche dann die Flammenfarbe mit den Referenzen.':'Wähle die Bedingungen und halte die Probe virtuell in die Flamme.';$('observation-swatch').style.background='#e2e5d5';$('drop-hint').hidden=false;$('stage-burst').classList.remove('show');}
function updateSelection(){
  document.querySelectorAll('.sample-button').forEach(b=>{const active=selected.includes(b.dataset.id);b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active?'true':'false');});
  $('selection-count').textContent=mode==='unknown'?'? / 05':String(selected.length).padStart(2,'0')+' / 07';
  $('selected-symbol').textContent=mode==='unknown'?'?':selected.length===1?byId(selected[0]).symbol:selected.length===2?'+':'—';
  $('selected-name').textContent=selected.length||mode==='unknown'?title():'Keine Probe gewählt';
  $('selected-formula').textContent=mode==='unknown'?(unknownSolved?byId(unknownId).salt:'Unbekanntes Metallsalz'):selected.length===1?byId(selected[0]).formula+' · '+byId(selected[0]).salt:selected.length?selected.map(id=>byId(id).formula).join(' + '):'Wähle bis zu zwei Elemente.';
  const accent=mode==='unknown'?'#c1b1ee':selected.length?byId(selected[0]).color:'#cbed63';document.documentElement.style.setProperty('--accent',accent);$('selected-symbol').style.background=accent;
  $('heat').disabled=mode!=='unknown'&&!selected.length;
}
function chooseSample(id){
  if(mode==='unknown')return;
  if(mode==='mix'){if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<2)selected.push(id);else{toast('Für eine Mischung wählst du höchstens zwei Elemente.');return;}}
  else selected=[id];
  model.withdraw();resetObservation();updateSelection();updateStatus();announce(title()+' ausgewählt.');
}
function newUnknown(){const choices=unknownOptions.filter(id=>id!==unknownId);const r=new Uint32Array(1);crypto.getRandomValues(r);unknownId=choices[r[0]%choices.length];unknownSolved=false;model.clean();$('guess').value='';$('challenge-feedback').textContent='';resetObservation();updateSelection();updateStatus();}
function setMode(next){
  if(next===mode)return;
  mode=next;model.withdraw();document.querySelectorAll('.mode-tab').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('samples').hidden=mode==='unknown';$('unknown-card').hidden=mode!=='unknown';$('challenge').hidden=mode!=='unknown';$('sample-instruction').textContent=mode==='mix'?'Wähle bis zu zwei Elemente.':mode==='unknown'?'Untersuche eine unbekannte Salzprobe.':'Wähle ein Element zum Testen.';
  if(mode==='unknown')newUnknown();else{selected=selected.length?[selected[0]]:['cu'];resetObservation();updateSelection();updateStatus();}announce(mode==='mix'?'Mischmodus. Wähle bis zu zwei Proben.':mode==='unknown'?'Unbekannte Probe bereit.':'Entdeckermodus.');
}
document.querySelectorAll('.mode-tab').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('new-unknown').addEventListener('click',()=>{newUnknown();toast('Eine neue, saubere Probe X ist bereit.');});

function peakView(){const time=model.elapsed;model.elapsed=.6;const view=model.view();model.elapsed=time;return view;}
function describe(v){
  return describeObservation(v,{tested:ids(),mode,air:model.air});
}
function refreshObservation(){
  if(!observed||!model.current)return;
  const view=peakView(),description=describe(view),color=cssColor(view.observed);
  $('observation-title').textContent=description.label;$('observation-text').textContent=description.text;$('observation-swatch').style.background=color;
  const settings='Anfangsbeobachtung · Menge: '+amountNames[model.loadedAmount]+' · Luft: '+model.air+' % · '+(model.dirtyBefore?'Draht mit Rückstand':'Draht sauber')+' · Natriumspur: '+(model.sodium?'an':'aus')+' · Kobaltglas: '+(model.cobalt?'an':'aus');
  lastRecord={title:title(),label:description.label,color,settings};$('save').disabled=false;
  $('flame-canvas').setAttribute('aria-label',title()+': '+description.label+'. '+description.text);
}
function heat(){
  if(!ids().length)return;
  if(!model.on)model.on=true;
  model.paused=false;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','Simulation pausieren');
  model.dirtyBefore=model.dirty;if(!model.heat(ids()))return;
  observed=true;refreshObservation();$('drop-hint').hidden=true;$('stage-burst').textContent=mode==='unknown'?'AHA?':mode==='mix'?'MIX!':'AHA!';$('stage-burst').classList.add('show');clearTimeout(burstTimer);burstTimer=setTimeout(()=>$('stage-burst').classList.remove('show'),1700);
  if(mode==='unknown')$('identify').disabled=false;
  updateStatus();announce('Probe erhitzt. '+$('observation-title').textContent+'.');
  if(window.innerWidth<680)$('stage').scrollIntoView({behavior:renderer.reduceMotion?'instant':'smooth',block:'start'});
}
$('heat').addEventListener('click',heat);
$('clean').addEventListener('click',()=>{model.clean();resetObservation();updateStatus();toast('Draht gereinigt. Alle Probenrückstände entfernt.');});
$('amount').addEventListener('input',()=>{model.amount=Number($('amount').value);$('amount-value').textContent=amountNames[model.amount];});
$('air').addEventListener('input',()=>{model.air=Number($('air').value);$('air-value').textContent=model.air<30?'Geschlossen':model.air<65?'Teilweise offen':'Offen';$('air-note').textContent=model.air<30?'Gelbes Rußleuchten kann die Probenfarbe verdecken.':model.air<65?'Die Grundflamme wird blauer. Mehr Luft verbessert den Kontrast.':'Die blaue Grundflamme macht Farben gut sichtbar.';if(model.active)refreshObservation();updateStatus();});
$('cobalt').addEventListener('change',()=>{model.cobalt=$('cobalt').checked;$('filter-frame').hidden=!model.cobalt;if(model.active)refreshObservation();toast(model.cobalt?'Blick durch Kobaltglas: weniger Natriumgelb, weniger Licht.':'Blick ohne Kobaltglas.');});
$('sodium').addEventListener('change',()=>{model.sodium=$('sodium').checked;if(model.active)refreshObservation();toast(model.sodium?'Natriumspur eingeschaltet. Sie wirkt beim Erhitzen.':'Zusätzliche Natriumspur ausgeschaltet.');});
$('burner').addEventListener('click',()=>{model.on=!model.on;if(!model.on)model.withdraw();updateStatus();announce(model.on?'Brenner eingeschaltet.':'Brenner ausgeschaltet.');});
$('pause').addEventListener('click',()=>{model.paused=!model.paused;$('pause').textContent=model.paused?'▶':'Ⅱ';$('pause').setAttribute('aria-label',model.paused?'Simulation fortsetzen':'Simulation pausieren');$('pause').title=model.paused?'Simulation fortsetzen':'Simulation pausieren';updateStatus();});

let previousStatus='';
function updateStatus(){
  const status=!model.on?'Brenner ausgeschaltet':model.paused?'Simulation pausiert':model.active?'Probe in der Flamme':observed?'Färbung abgeklungen':'Brenner bereit';
  if(status!==previousStatus){$('stage-status').textContent=status;previousStatus=status;}
  $('burner').innerHTML=(model.on?'Brenner aus':'Brenner an')+' <span>⏻</span>';$('burner').setAttribute('aria-pressed',String(model.on));
  $('wire-status').innerHTML=model.dirty?'<span class="status-dot"></span> Draht mit Rückstand':'<span class="status-dot clean"></span> Draht sauber';
  $('stage-caption').textContent=!model.on?'Brenner ausgeschaltet. Erhitzen zündet ihn wieder.':model.paused?'Pausiert. Mit ▶ geht der Versuch weiter.':model.active&&lastRecord?lastRecord.label+' · Farbsignal klingt ab.':observed?'Nochmal erhitzen oder die Beobachtung merken.':mode==='mix'?'Zwei Proben wählen. Ihre Lichtanteile vergleichen.':mode==='unknown'?'Erhitze Probe X und stelle eine Vermutung auf.':'Probe wählen. Erhitzen. Farbe entdecken.';
}
// This local display timer makes no network requests; animation itself uses requestAnimationFrame.
setInterval(()=>{if(!document.hidden)updateStatus();},500);
$('stage').addEventListener('keydown',e=>{if(e.target===$('stage')&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();heat();}});
$('stage').addEventListener('dragover',e=>{if(mode==='unknown')return;e.preventDefault();e.dataTransfer.dropEffect='copy';$('stage').classList.add('drag-over');});
$('stage').addEventListener('dragleave',e=>{if(!$('stage').contains(e.relatedTarget))$('stage').classList.remove('drag-over');});
$('stage').addEventListener('drop',e=>{e.preventDefault();$('stage').classList.remove('drag-over');if(mode==='unknown')return;const id=e.dataTransfer.getData('application/x-flammenlabor')||e.dataTransfer.getData('text/plain');if(!byId(id))return;if(mode==='mix'){if(!selected.includes(id)&&selected.length<2)chooseSample(id);else if(!selected.includes(id)){toast('Wähle höchstens zwei Elemente für deine Mischung.');return;}}else chooseSample(id);heat();});

$('save').addEventListener('click',()=>{if(!lastRecord)return;journal.add(lastRecord);$('save').disabled=true;});
$('export').addEventListener('click',()=>journal.export());$('clear-notebook').addEventListener('click',()=>journal.clear());
$('identify').addEventListener('click',()=>{if(!observed)return;const guess=$('guess').value;if(!guess){toast('Wähle zuerst ein Element für deinen Verdacht.');$('guess').focus();return;}if(guess===unknownId){unknownSolved=true;$('challenge-feedback').textContent='Aha, richtig im Modell! Probe X enthält '+byId(unknownId).salt+'. Eine echte Probe würde man bei Bedarf durch weitere Analysen bestätigen.';updateSelection();refreshObservation();announce('Richtig. Probe X enthält '+byId(unknownId).salt+'.');}else{$('challenge-feedback').textContent='Diese Vermutung passt noch nicht. Nutze eine saubere, blaue Flamme ohne Natriumspur und vergleiche erneut mit dem Farbatlas.';announce('Die Vermutung passt noch nicht. Vergleiche die Flammenfarben erneut.');}});
updateSelection();updateStatus();
