import {cssColor,clamp} from './model.js';

export class FlameRenderer{
  constructor(canvas,model){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.model=model;this.motion=0;this.last=0;this.reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;this.frame=0;this.running=true;this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.resize();this.animate=this.animate.bind(this);this.frame=requestAnimationFrame(this.animate);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.frame);this.running=false;}else if(!this.running){this.running=true;this.last=0;this.frame=requestAnimationFrame(this.animate);}});}
  resize(){const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;const d=Math.min(window.devicePixelRatio||1,2);this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);this.ctx.setTransform(d,0,0,d,0,0);this.draw();}
  animate(now){const dt=this.last?Math.min((now-this.last)/1000,.1):0;this.last=now;if(!this.model.paused){this.model.tick(dt);if(!this.reduceMotion)this.motion+=dt;}this.draw();this.frame=requestAnimationFrame(this.animate);}
  plume(cx,bottom,height,width,t){
    const c=this.ctx,w=width,h=height;
    const sway=Math.sin(t*2.4)*w*.10+Math.sin(t*4.1)*w*.06;
    c.beginPath();c.moveTo(cx-w*.65,bottom);
    c.bezierCurveTo(cx-w*1.17,bottom-h*.27,cx-w*.56+sway,bottom-h*.56,cx+w*.12+sway,bottom-h);
    c.bezierCurveTo(cx+w*.27+sway,bottom-h*.81,cx+w*.20,bottom-h*.58,cx+w*.48,bottom-h*.42);
    c.bezierCurveTo(cx+w*1.15,bottom-h*.20,cx+w*.94,bottom-h*.07,cx+w*.64,bottom);
    c.quadraticCurveTo(cx,bottom+7,cx-w*.65,bottom);c.closePath();
  }
  rounded(x,y,w,h,r,fill,stroke='#151b16',line=2){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.lineWidth=line;c.strokeStyle=stroke;c.stroke();}}
  draw(){
    const c=this.ctx,w=this.width,h=this.height;if(!w||!h)return;
    c.clearRect(0,0,w,h);const v=this.model.view(),cx=w*.48,scale=Math.min(w/470,h/430),top=h-155*scale,t=this.motion;
    const height=Math.min(203*scale,top-66),width=44*scale;
    c.save();
    // Flat ink hatching and the burner are drawn separately from the light.
    if(v.on){
      const glow=c.createRadialGradient(cx,top-height*.4,5,cx,top-height*.4,height*.9);
      glow.addColorStop(0,cssColor(v.observed).replace('rgb(','rgba(').replace(')',','+(v.cobalt?.06:.14)+')'));glow.addColorStop(1,'rgba(30,50,35,0)');
      c.fillStyle=glow;c.fillRect(cx-height,top-height*1.3,height*2,height*1.6);
      const layers=[{height:height,width:width,color:v.base,alpha:.12},{height:height*.95,width:width*.83,color:v.base,alpha:.38}];
      if(v.active)layers.push({height:height*(.93+Math.sin(t*3)*.03),width:width*.9,color:v.signal,alpha:clamp(v.signalWeight/(v.signalWeight+v.baseWeight),0,.85)*.85});
      for(const [i,l] of layers.entries()){c.globalAlpha=v.cobalt?l.alpha*.7:l.alpha;const grad=c.createLinearGradient(cx,top-l.height,cx,top);grad.addColorStop(0,cssColor(l.color));grad.addColorStop(.45,cssColor(l.color));grad.addColorStop(1,cssColor(v.base));c.fillStyle=grad;this.plume(cx,top,l.height,l.width,t+i*.47);c.fill();}
      c.globalAlpha=.46;this.plume(cx,top,height*.65,width*.50,t+.8);c.fillStyle=cssColor(v.observed);c.fill();
      c.globalAlpha=.75;this.plume(cx,top,height*.38,width*.34,t*.8);const core=c.createLinearGradient(0,top-height*.4,0,top);core.addColorStop(0,'#80c8ff');core.addColorStop(.6,'#3f83ca');core.addColorStop(1,'#356998');c.fillStyle=core;c.fill();
      c.globalAlpha=.8;c.beginPath();c.moveTo(cx-9*scale,top);c.quadraticCurveTo(cx-5*scale,top-height*.22,cx+2*scale,top-height*.34);c.quadraticCurveTo(cx+10*scale,top-height*.16,cx+8*scale,top);c.fillStyle='#192925';c.fill();
      c.globalAlpha=1;
    }
    // Rubber gas hose, metal column and cast base.
    c.beginPath();c.moveTo(cx+19*scale,h-106*scale);c.bezierCurveTo(cx+84*scale,h-122*scale,cx+89*scale,h-57*scale,w+18,h-84*scale);c.lineWidth=14*scale;c.strokeStyle='#151b16';c.stroke();c.lineWidth=9*scale;c.strokeStyle='#d19b58';c.stroke();
    c.beginPath();c.ellipse(cx+3*scale,h-67*scale,59*scale,12*scale,0,0,Math.PI*2);c.fillStyle='#192019';c.fill();
    this.rounded(cx-52*scale,h-83*scale,104*scale,15*scale,5*scale,'#909f94','#101710',2*scale);
    c.beginPath();c.moveTo(cx-40*scale,h-85*scale);c.lineTo(cx-25*scale,h-95*scale);c.lineTo(cx+26*scale,h-95*scale);c.lineTo(cx+40*scale,h-85*scale);c.closePath();c.fillStyle='#b3bdb0';c.fill();c.strokeStyle='#121a12';c.lineWidth=2*scale;c.stroke();
    const metal=c.createLinearGradient(cx-15*scale,0,cx+15*scale,0);metal.addColorStop(0,'#66776f');metal.addColorStop(.25,'#a3b5aa');metal.addColorStop(.55,'#bec8bc');metal.addColorStop(1,'#697f73');
    this.rounded(cx-12*scale,top,24*scale,h-92*scale-top,2*scale,metal,'#142018',2*scale);
    c.strokeStyle='#dfe8d05c';c.lineWidth=1;for(let i=0;i<4;i++){c.beginPath();c.moveTo(cx-8*scale+i*5*scale,top+7*scale);c.lineTo(cx-8*scale+i*5*scale,h-118*scale);c.stroke();}
    this.rounded(cx-18*scale,h-121*scale,36*scale,22*scale,4*scale,'#8b9f91','#142018',2*scale);
    this.rounded(cx-8*scale,h-116*scale,16*scale,6*scale,3*scale,'#283d2c','#142018',1*scale);
    c.beginPath();c.ellipse(cx,top,13*scale,4*scale,0,0,Math.PI*2);c.fillStyle='#15241b';c.fill();c.strokeStyle='#bacab6';c.lineWidth=1.5*scale;c.stroke();
    // The wire enters the upper edge of the flame with a restrained insertion animation.
    if(v.wire){
      const insertion=clamp(this.model.elapsed/.45),ease=1-(1-insertion)**3,tipx=cx+10*scale+(1-ease)*w*.6,tipy=top-height*.47;
      c.beginPath();c.moveTo(tipx+12*scale,tipy);c.lineTo(w+12,tipy+22*scale);c.strokeStyle='#131913';c.lineWidth=5*scale;c.stroke();c.strokeStyle='#b8c5b7';c.lineWidth=2*scale;c.stroke();
      c.beginPath();c.ellipse(tipx,tipy,10*scale,5*scale,-.15,0,Math.PI*2);c.lineWidth=2*scale;c.strokeStyle=v.active?'#f2cfb1':'#aeb9a7';c.stroke();
      this.rounded(w-57*scale,tipy+13*scale,95*scale,16*scale,5*scale,'#b6a5d8','#181d19',2*scale);
    }
    c.restore();
  }
}