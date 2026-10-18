// BASTION LINE — WebAudio synthesis (no audio files): tower shots and impacts per look, deaths, leaks, coins, upgrades,
// wave horns, boss roars, hero abilities, UI clicks and a medieval march whose drums follow the danger on the road.
import {boot,SpatialSound} from '../js/kit3d/audio.js';
export class Sound extends SpatialSound{
 constructor(){super();this.range=120;this.last={};}
 init(){boot(this,ac=>{this.bus(ac);this.room(ac);this.beds(ac,500);this.amb([700,.02,0,0]);});}
 ok(k,gap){const t=this.ac.currentTime;if(this.last[k]&&t-this.last[k]<gap)return false;this.last[k]=t;return true;}
 play(k,pos=null,vol=1){if(!this.ac)return;try{const r=1+(Math.random()-.5)*.14;let d;const D=(v,range)=>(d=this._dst(pos,v*vol,range));
  switch(k){
  case'arrow':if(!this.ok(k,.05)||!D(.22))return;this._n(d,.08,5200*r,1600,2,.3,'bandpass');this._o(d,'triangle',700*r,300,.06,.06);break;
  case'ball':if(!this.ok(k,.08)||!D(.5))return;this._n(d,.25,1400,120,.7,.55);this._o(d,'sine',120*r,50,.22,.5);break;
  case'shell':if(!this.ok(k,.1)||!D(.55))return;this._o(d,'sine',90*r,40,.35,.6);this._n(d,.4,700,90,.6,.5);this._n(d,.6,3000,1200,3,.12,'bandpass',.15);break;
  case'rifle':if(!this.ok(k,.06)||!D(.45))return;this._n(d,.18,6000*r,900,.8,.55);this._o(d,'square',300*r,80,.1,.18);this._n(d,.5,1200,400,1,.12,'lowpass',.05);break;
  case'arc':if(!this.ok(k,.07)||!D(.35))return;this._o(d,'sawtooth',90*r,70,.22,.16);this._n(d,.22,9000,2600,3,.32,'bandpass');this._o(d,'square',1600*r,600,.08,.05);break;
  case'pulse':if(!this.ok(k,.12)||!D(.3))return;[1568,2093,2637].forEach((f,i)=>this._o(d,'sine',f*r,f*.9,.3,.05,i*.02));this._n(d,.35,8000,3000,1.5,.18,'highpass');break;
  case'bolt':if(!this.ok(k,.06)||!D(.3))return;this._o(d,'sine',900*r,1800,.12,.12);this._n(d,.15,6000,2000,2,.15,'bandpass');break;
  case'lance':if(!this.ok(k,.06)||!D(.35))return;this._n(d,.12,1000*r,2600,1.4,.35,'bandpass');this._o(d,'sine',180*r,70,.12,.3);break;
  case'boom':if(!this.ok(k,.06)||!D(.7))return;this._n(d,.7,1600,60,.5,.8);this._o(d,'sine',80*r,28,.6,.65);break;
  case'pop':if(!this.ok(k,.04)||!D(.18))return;this._n(d,.07,2000*r,500,1,.25);break;
  case'die':if(!this.ok(k,.05)||!D(.28))return;this._o(d,'sawtooth',300*r,80,.25,.08);this._n(d,.2,1600,300,.9,.22);break;
  case'squish':if(!this.ok(k,.06)||!D(.35))return;this._n(d,.3,900*r,150,1.5,.4,'bandpass');this._o(d,'sine',220*r,60,.3,.25);break;
  case'clang':if(!this.ok(k,.05)||!D(.3))return;[1200,1810,2500].forEach((f,i)=>this._o(d,'triangle',f*r,f*.98,.25,.07,i*.005));break;
  case'shield':if(!D(.45))return;[2400,1800,1200,800].forEach((f,i)=>this._o(d,'triangle',f*r,f*.6,.25,.08,i*.03));this._n(d,.4,9000,2000,1,.3,'highpass');break;
  case'coin':if(!this.ok(k,.05))return;D(.14);this._o(d,'square',1568*r,1568,.05,.06);this._o(d,'square',2093*r,2093,.12,.06,.05);break;
  case'leak':D(.6);this._o(d,'sawtooth',220,110,.5,.18);this._o(d,'square',110,90,.6,.1,.1);break;
  case'build':D(.5);this._n(d,.25,1200,300,1,.4);[262,392,523].forEach((f,i)=>this._o(d,'triangle',f,f,.25,.15,.05+i*.07));break;
  case'upgrade':D(.5);[523,659,784,1046].forEach((f,i)=>this._o(d,'triangle',f,f,.3,.14,i*.06));this._n(d,.4,9000,3000,2,.12,'highpass',.15);break;
  case'sell':D(.45);[1046,784,523].forEach((f,i)=>this._o(d,'square',f,f,.1,.06,i*.06));break;
  case'click':D(.18);this._o(d,'square',1200,1100,.03,.06);break;
  case'deny':if(!this.ok(k,.2))return;D(.25);this._o(d,'square',220,200,.12,.1);this._o(d,'square',180,170,.12,.08,.1);break;
  case'horn':D(.6);[196,247,294].forEach(f=>this._o(d,'sawtooth',f,f,1.4,.05,0,.08));this._o(d,'sawtooth',392,392,.9,.04,.5,.05);break;
  case'roar':D(1);this._o(d,'sawtooth',90,40,1.6,.3,0,.1);this._n(d,1.6,600,90,.8,.6,'lowpass',.05);this._o(d,'square',60,30,1.4,.2);break;
  case'stomp':D(.9);this._o(d,'sine',60,24,.8,.9);this._n(d,.8,500,50,.6,.7);break;
  case'level':D(.5);[784,988,1175,1568].forEach((f,i)=>this._o(d,'triangle',f,f,.35,.13,i*.08));break;
  case'warcry':D(.7);[196,262,330,392].forEach((f,i)=>this._o(d,'sawtooth',f,f,.7,.07,i*.05,.05));break;
  case'nova':D(.8);this._n(d,1,9000,1500,1.2,.4,'highpass');[2093,2637,3136,4186].forEach((f,i)=>this._o(d,'sine',f,f*.8,.8,.06,i*.04));break;
  case'thunder':if(!this.ok(k,.08)||!D(.8))return;this._n(d,.9,3000,80,.5,.85);this._o(d,'sawtooth',160*r,40,.4,.2);break;
  case'skyfall':D(1);this._o(d,'sine',1800,200,.5,.15);this._n(d,1,2000,60,.5,.9,'lowpass',.45);this._o(d,'sine',70,25,.9,.8,.45);break;
  case'wave':D(.5);[392,523,659].forEach((f,i)=>this._o(d,'triangle',f,f,.25,.13,i*.09));break;
  case'win':D(.6);[523,659,784,1046,784,1046,1318].forEach((f,i)=>this._o(d,'triangle',f,f,.4,.16,i*.13));break;
  case'lose':D(.6);[392,370,330,294,262].forEach((f,i)=>this._o(d,'sawtooth',f,f*.99,.5,.06,i*.18));break;
  }}catch(e){}}
 // lute-like plucks over a drone, drums that grow with the danger (0..1)
 music(on,intensity=0){if(!this.ac)return;this.musI=intensity;if(on&&!this.mus){const st={step:0,next:this.ac.currentTime+.1};this.mus=st;const tick=()=>{if(this.mus!==st)return;const ac=this.ac,spb=60/104/4;
   while(st.next<ac.currentTime+.3){const s=st.step%128,bar=(st.step/16|0)%8,t=st.next;const roots=[50,50,53,48,50,55,53,52],root=roots[bar];const hz=m=>440*Math.pow(2,(m-69)/12);const g=this.musG;
    if(s%16===0){for(const iv of[0,7,12]){const o=ac.createOscillator(),gg=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=hz(root+iv-12);o.detune.value=(Math.random()-.5)*12;f.type='lowpass';f.frequency.value=500;gg.gain.setValueAtTime(0,t);gg.gain.linearRampToValueAtTime(.02,t+.6);gg.gain.linearRampToValueAtTime(0,t+spb*16+.3);o.connect(f);f.connect(gg);gg.connect(g);o.start(t);o.stop(t+spb*16+.4);}}
    const mel=[0,3,7,10,12,10,7,5,3,5,7,3,2,3,0,-2];if(s%2===0&&(bar%2===0||s%4===0)){const o=ac.createOscillator(),gg=ac.createGain(),f=ac.createBiquadFilter();o.type='triangle';o.frequency.value=hz(root+12+mel[(s/2)%16]);f.type='lowpass';f.frequency.value=2400;gg.gain.setValueAtTime(.04,t);gg.gain.exponentialRampToValueAtTime(.001,t+.32);o.connect(f);f.connect(gg);gg.connect(g);o.start(t);o.stop(t+.35);}
    if(this.musI>.15&&(s%8===0||(s%8===6&&this.musI>.5)||(s%4===2&&this.musI>.8))){const o=ac.createOscillator(),gg=ac.createGain();o.type='sine';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.25);gg.gain.setValueAtTime(.35*this.musI,t);gg.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.32);}
    if(this.musI>.4&&s%4===2){const b=ac.createBufferSource();b.buffer=this.noise;const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=5000;const gg=ac.createGain();gg.gain.setValueAtTime(.05*this.musI,t);gg.gain.exponentialRampToValueAtTime(.001,t+.06);b.connect(f);f.connect(gg);gg.connect(g);b.start(t,Math.random());b.stop(t+.07);}
    st.step++;st.next+=spb;}setTimeout(tick,80);};tick();}
  else if(!on&&this.mus){this.mus=null;}}}
