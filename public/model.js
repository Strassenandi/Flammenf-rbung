import {byId} from './data.js';

export const clamp = (x, a=0, b=1) => Math.max(a,Math.min(b,x));
const linear = x => (x/255 <= .04045 ? x/3294.6 : ((x/255+.055)/1.055)**2.4);
const gamma = x => 255*(x<=.0031308 ? 12.92*x : 1.055*x**(1/2.4)-.055);
export function lightMix(parts) {
  const total=parts.reduce((n,p)=>n+p.weight,0);
  if(total<=0) return [80,157,245];
  return [0,1,2].map(k=>Math.round(clamp(gamma(parts.reduce((n,p)=>n+linear(p.color[k])*p.weight,0)/total),0,255)));
}
export const cssColor = rgb => 'rgb('+rgb.map(Math.round).join(',')+')';
// Qualitative pass fractions, NOT measured glass transmission. The filter only
// attenuates existing light; it does not add a blue/violet emission or energy.
const filterTransmission={li:.35,na:.018,k:.8,ca:.25,sr:.28,ba:.25,cu:.45};
const dimLight = (rgb, transmission) => rgb.map(x=>Math.round(gamma(linear(x)*clamp(transmission))));

export class FlameModel {
  constructor(){this.on=true;this.air=85;this.amount=2;this.cobalt=false;this.sodium=false;this.residue=new Map();this.current=null;this.elapsed=0;this.duration=12;this.paused=false;}
  heat(ids){
    if(!ids.length || !this.on) return false;
    const residue=[...this.residue].map(([id,quantity])=>({id,quantity,residual:true}));
    const dose={1:.55,2:1,3:1.6}[this.amount];this.loadedAmount=this.amount;
    this.current=[...ids.map(id=>({id,quantity:dose/ids.length,residual:false})),...residue];
    this.elapsed=0;this.duration=7+this.amount*3.5;
    for(const id of ids) this.residue.set(id,id==='na'?.16:.025);
    return true;
  }
  withdraw(){this.current=null;this.elapsed=0;}
  clean(){this.withdraw();this.residue.clear();}
  tick(dt){if(!this.paused&&this.on&&this.current)this.elapsed+=clamp(dt,0,.1);}
  get active(){return !!this.current&&this.on&&this.elapsed<this.duration;}
  get dirty(){return this.residue.size>0;}
  view(){
    const air=this.air/100;
    const yellow=clamp((.65-air)/.65);
    const blueWeight=1-yellow,sootWeight=yellow*2.5;
    const baseParts=[{color:[52,145,248],weight:blueWeight},{color:[255,183,37],weight:sootWeight}];
    const filteredBase=baseParts.map((p,i)=>({...p,weight:p.weight*(this.cobalt?(i===0?.45:.018):1)}));
    const baseTransmission=filteredBase.reduce((n,p)=>n+p.weight,0)/(blueWeight+sootWeight);
    const base=lightMix(filteredBase);
    const envelope=this.active ? clamp(this.elapsed/.32)*(this.elapsed<2?1:Math.exp(-3*(this.elapsed-2)/Math.max(1,this.duration-2))) : 0;
    const raw=(this.current||[]).map(c=>({...c,weight:c.quantity*byId(c.id).strength}));
    if(this.current&&this.sodium)raw.push({id:'na',quantity:.16,weight:1.92,residual:true});
    const merged=new Map();
    for(const p of raw){const previous=merged.get(p.id);merged.set(p.id,{id:p.id,weight:(previous?.weight||0)+p.weight,residual:p.residual&&(previous?.residual??true)});}
    const unfilteredComponents=[...merged.values()].map(c=>({...c,color:byId(c.id).flame}));
    const components=unfilteredComponents.map(c=>({...c,weight:c.weight*(this.cobalt?filterTransmission[c.id]:1)}));
    const unfilteredTotal=unfilteredComponents.reduce((n,c)=>n+c.weight,0);
    const total=components.reduce((n,c)=>n+c.weight,0);
    const na=(components.find(c=>c.id==='na')?.weight||0)/Math.max(.001,total);
    const unfilteredNa=(unfilteredComponents.find(c=>c.id==='na')?.weight||0)/Math.max(.001,unfilteredTotal);
    const signalTransmission=unfilteredTotal>0?total/unfilteredTotal:1;
    const signal=lightMix(components.map(c=>({color:c.color,weight:c.weight})));
    const excitation=.22+.78*air;
    const unfilteredSignalWeight=envelope*excitation*(.3+Math.log1p(unfilteredTotal))*1.5;
    const signalWeight=unfilteredSignalWeight*signalTransmission;
    const unfilteredBaseWeight=1+yellow*3.8;
    const baseWeight=unfilteredBaseWeight*baseTransmission;
    const totalTransmission=(baseWeight+signalWeight)/(unfilteredBaseWeight+unfilteredSignalWeight);
    const observedHue=lightMix([{color:base,weight:baseWeight},{color:signal,weight:signalWeight}]);
    const observed=dimLight(observedHue,totalTransmission);
    return {on:this.on,active:this.active,dirty:this.dirty,base,signal,observed,observedHue,yellow,envelope,components,unfilteredComponents,na,unfilteredNa,signalWeight,baseWeight,unfilteredSignalWeight,unfilteredBaseWeight,signalTransmission,baseTransmission,totalTransmission,progress:clamp(this.elapsed/this.duration),wire:!!this.current&&this.active,brightness:this.on?clamp(.15+unfilteredSignalWeight*.5)*totalTransmission:0,cobalt:this.cobalt};
  }
}
