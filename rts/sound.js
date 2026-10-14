// SHARDWAR — WebAudio synthesis (no audio files): positional weapon fire and impacts by projectile look, deaths for flesh,
// metal and crystal, construction and production chimes, alerts, UI clicks and a strategy music bed whose drum layer
// follows how much fighting is on screen.
import {boot,SpatialSound} from '../js/kit3d/audio.js';
export class Sound extends SpatialSound{
 constructor(){super();this.range=70;this.last={};}
 init(){boot(this,ac=>{this.bus(ac);this.room(ac);this.beds(ac,600);this.amb([500,.03,0,0]);});}
 // rate-limit very frequent sounds so a 60-unit battle does not clip
 ok(k,gap){const t=this.ac.currentTime;if(this.last[k]&&t-this.last[k]<gap)return false;this.last[k]=t;return true;}
 play(k,pos=null,vol=1){if(!this.ac)return;try{const r=1+(Math.random()-.5)*.12;let d;const D=(v,range)=>(d=this._dst(pos,v*vol,range));
  switch(k){
  case'bullet':if(!this.ok(k,.035)||!D(.28))return;this._n(d,.07,3200*r,700,.9,.35,'bandpass');this._o(d,'square',520*r,140,.05,.1);break;
  case'rail':if(!this.ok(k,.06)||!D(.35))return;this._o(d,'sawtooth',1800*r,300,.18,.18);this._n(d,.2,7000,2000,1.5,.25,'bandpass');this._o(d,'sine',2600,2400,.25,.06,.02);break;
  case'shell':if(!this.ok(k,.08)||!D(.55,90))return;this._n(d,.35,900,80,.7,.6);this._o(d,'sine',95*r,40,.3,.6);break;
  case'geode':if(!this.ok(k,.08)||!D(.45,80))return;this._n(d,.3,500,120,1.2,.4,'bandpass');this._o(d,'triangle',220*r,90,.25,.2);break;
  case'spine':if(!this.ok(k,.04)||!D(.25))return;this._n(d,.09,5000*r,1800,2,.3,'bandpass');this._o(d,'triangle',900*r,500,.07,.08);break;
  case'arc':if(!this.ok(k,.06)||!D(.35))return;this._o(d,'sawtooth',120*r,120,.2,.14);this._n(d,.2,8000,2500,3,.3,'bandpass');break;
  case'melee':if(!this.ok(k,.05)||!D(.3,45))return;this._n(d,.12,900*r,2400,1.4,.35,'bandpass');this._o(d,'sine',160*r,60,.1,.25);break;
  case'claw':if(!this.ok(k,.04)||!D(.28,45))return;this._n(d,.08,4000*r,1600,2.5,.3,'bandpass');this._o(d,'triangle',1400*r,600,.05,.06);break;
  case'hit':if(!this.ok(k,.03)||!D(.18,40))return;this._n(d,.06,1600*r,400,1,.25);break;
  case'boom':if(!this.ok(k,.06)||!D(.8,100))return;this._n(d,.8,1800,60,.5,.85);this._o(d,'sine',80,26,.7,.7);break;
  case'crystal':if(!this.ok(k,.06)||!D(.5,80))return;[2093,2637,3136].forEach((f,i)=>this._o(d,'sine',f*r,f*r*.97,.5,.08,i*.03));this._n(d,.5,9000,2000,1.5,.35,'highpass');break;
  case'nova':if(!D(.8,100))return;this._o(d,'sine',200,1600,.9,.12,0,.8);this._n(d,1,600,4000,1.2,.3,'bandpass',0);break;
  case'blast':if(!D(1,110))return;this._n(d,1.2,4000,100,.6,.9);this._o(d,'sine',120,30,1,.7);[1568,2093,2637].forEach((f,i)=>this._o(d,'sine',f,f*.9,.8,.1,i*.05));break;
  case'heal':if(!this.ok(k,.25)||!D(.15,40))return;this._o(d,'sine',880*r,1320,.2,.08);break;
  case'die':if(!this.ok(k,.05)||!D(.4,60))return;this._o(d,'sawtooth',260*r,70,.4,.12);this._n(d,.3,1400,200,.8,.3);break;
  case'shatter':if(!this.ok(k,.05)||!D(.45,60))return;[1800,2400,3100].forEach((f,i)=>this._o(d,'triangle',f*r,f*.5,.25,.07,i*.02));this._n(d,.35,8000,1500,1.2,.35,'highpass');break;
  case'mechdie':if(!D(.7,80))return;this._n(d,.9,1500,80,.6,.8);this._o(d,'sine',70,25,.8,.6);this._o(d,'sawtooth',300,60,.5,.1,.1);break;
  case'collapse':if(!D(1,120))return;this._n(d,2,1200,40,.5,1);this._o(d,'sine',60,20,1.8,.9);this._n(d,1.5,4000,300,1,.4,'bandpass',.3);break;
  case'place':D(.4);this._o(d,'triangle',300,600,.12,.2);this._n(d,.15,3000,800,1.5,.15,'bandpass');break;
  case'built':D(.45);[523,659,784].forEach((f,i)=>this._o(d,'triangle',f,f,.3,.14,i*.08));break;
  case'trained':if(!this.ok(k,.2))return;D(.3);this._o(d,'square',660,660,.06,.08);this._o(d,'square',990,990,.1,.08,.07);break;
  case'research':D(.5);[392,523,659,784,1046].forEach((f,i)=>this._o(d,'triangle',f,f,.35,.13,i*.07));break;
  case'deposit':if(!this.ok(k,.15)||!D(.08,30))return;this._o(d,'sine',1400,1500,.05,.06);break;
  case'click':D(.2);this._o(d,'square',1200,1100,.03,.07);break;
  case'select':if(!this.ok(k,.06))return;D(.22);this._o(d,'sine',740,880,.06,.1);break;
  case'order':if(!this.ok(k,.06))return;D(.22);this._o(d,'triangle',520,680,.06,.12);break;
  case'attackorder':if(!this.ok(k,.06))return;D(.25);this._o(d,'square',300,220,.08,.08);this._o(d,'triangle',440,360,.08,.1,.04);break;
  case'deny':if(!this.ok(k,.2))return;D(.25);this._o(d,'square',220,200,.12,.1);this._o(d,'square',180,170,.12,.08,.1);break;
  case'alarm':D(.6);[880,660,880,660].forEach((f,i)=>this._o(d,'square',f,f,.1,.08,i*.12));break;
  case'horn':D(.55);[196,247,294,392].forEach(f=>this._o(d,'sawtooth',f,f,1.8,.05,0,.06));break;
  case'win':D(.6);[523,659,784,1046,784,1046,1318].forEach((f,i)=>this._o(d,'triangle',f,f,.4,.16,i*.13));break;
  case'lose':D(.6);[392,370,330,294,262].forEach((f,i)=>this._o(d,'sawtooth',f,f*.99,.5,.06,i*.18));break;
  }}catch(e){}}
 // slow modal pads, a plucked ostinato and war drums driven by battle intensity (0..1)
 music(on,intensity=0){if(!this.ac)return;this.musI=intensity;if(on&&!this.mus){const st={step:0,next:this.ac.currentTime+.1};this.mus=st;const tick=()=>{if(this.mus!==st)return;const ac=this.ac,spb=60/90/4;
   while(st.next<ac.currentTime+.3){const s=st.step%128,bar=(st.step/16|0)%8,t=st.next;const roots=[45,45,41,43,45,48,43,40],root=roots[bar];const hz=m=>440*Math.pow(2,(m-69)/12);const g=this.musG;
    if(s%16===0){for(const iv of[0,7,12,15]){const o=ac.createOscillator(),gg=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=hz(root+iv-12);o.detune.value=(Math.random()-.5)*14;f.type='lowpass';f.frequency.value=600;gg.gain.setValueAtTime(0,t);gg.gain.linearRampToValueAtTime(.022,t+.9);gg.gain.linearRampToValueAtTime(0,t+spb*16+.4);o.connect(f);f.connect(gg);gg.connect(g);o.start(t);o.stop(t+spb*16+.5);}}
    const arp=[0,12,7,15,12,19,15,7];if(s%2===0&&(bar%4!==3||s<8)){const o=ac.createOscillator(),gg=ac.createGain();o.type='triangle';o.frequency.value=hz(root+12+arp[(s/2)%8]);gg.gain.setValueAtTime(.035,t);gg.gain.exponentialRampToValueAtTime(.001,t+.4);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.45);}
    if(this.musI>.2&&(s%8===0||(s%8===5&&this.musI>.55)||(s%16===14&&this.musI>.8))){const o=ac.createOscillator(),gg=ac.createGain();o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(40,t+.3);gg.gain.setValueAtTime(.4*this.musI,t);gg.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(gg);gg.connect(g);o.start(t);o.stop(t+.4);}
    st.step++;st.next+=spb;}setTimeout(tick,80);};tick();}
  else if(!on&&this.mus){this.mus=null;}}}
