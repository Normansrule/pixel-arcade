// ASHEN VIGIL — synthesized audio: steel, flesh, bells and embers placed around the listener; a cathedral drone that swells into
// a choir-and-drums boss theme. Built on the shared kit (../js/kit3d/audio.js); no audio files.
import {SpatialSound,boot,gain,reverb,bed,tone} from '../js/kit3d/audio.js';
export class Sound extends SpatialSound{
 constructor(){super();this.range=70;this.mode='calm';this.beat=0;this.chordT=0;this.ci=0;this.voices=[];this.bossK=0;}
 init(){boot(this,ac=>{this.bus(ac);this.room(ac);this.hall=reverb(ac,3.2,2.4,.5,this.master);this.musHall=reverb(ac,4,2,.6,this.musG);
  const w=bed(ac,this.noise,'bandpass',380,.5,this.master,0);this.wind=w;const f=bed(ac,this.noise,'bandpass',1200,.9,this.master,0);this.fire=f;
  // drone pad voices (retuned per chord)
  for(let i=0;i<4;i++){const o=ac.createOscillator();o.type='sawtooth';const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=420;const g=gain(ac,0,this.musG);o.connect(lp);lp.connect(g);lp.connect(this.musHall);o.detune.value=(i-1.5)*7;o.start();this.voices.push({o,lp,g});}
  // choir: formant-filtered saws
  this.choir=[];for(let i=0;i<3;i++){const o=ac.createOscillator();o.type='sawtooth';const g=gain(ac,0,this.musG);const fs=[[700,8],[1150,10],[2800,14]].map(([fr,q])=>{const b=ac.createBiquadFilter();b.type='bandpass';b.frequency.value=fr;b.Q.value=q;o.connect(b);b.connect(g);return b;});g.connect(this.musHall);o.start();this.choir.push({o,g});}});}
 play(k,pos,vol=1){if(!this.ac)return;try{const ac=this.ac;let d;const D=(v,r)=>this._dst(pos,v,r);
  switch(k){
   case'step':if(!(d=D(.25*vol,25)))return;this._n(d,.07,900,250,1,.5);this._o(d,'sine',90,50,.06,.25);break;
   case'roll':if(!(d=D(.5,30)))return;this._n(d,.35,500,160,.8,.5);this._n(d,.2,2400,600,1,.15,'bandpass',.05);this._o(d,'sine',80,45,.15,.3,.25);break;
   case'swing':if(!(d=D(.5*vol,30)))return;this._n(d,.2*vol+.05,700,3400,1.4,.55,'bandpass');break;
   case'swingHeavy':if(!(d=D(.6,30)))return;this._n(d,.45,300,2200,1.2,.6,'bandpass',.15);this._o(d,'sine',120,60,.3,.15,.15);break;
   case'whoosh':if(!(d=D(.3*vol,20)))return;this._n(d,.18,1800,500,1.2,.3,'bandpass');break;
   case'wind':if(!(d=D(.45*vol,40)))return;this._n(d,.5,300,1400,2,.35,'bandpass');this._o(d,'triangle',220,330,.4,.03);break;
   case'bossWind':if(!(d=D(.7*vol,80)))return;this._n(d,.7,200,1000,2,.4,'bandpass');this._o(d,'sawtooth',70,90,.7,.08);this._o(d,'sawtooth',105,135,.7,.05);break;
   case'hit':if(!(d=D(.8*vol,50)))return;this._o(d,'sine',170,45,.22,.6);this._n(d,.16,2600,300,.9,.6);this._n(d,.08,6000,2000,1,.2,'highpass');break;
   case'hitArmor':if(!(d=D(.8*vol,50)))return;this._o(d,'triangle',520,470,.3,.18);this._o(d,'sine',1310,1250,.25,.08);this._n(d,.12,5000,900,1,.45);this._o(d,'sine',150,50,.2,.4);break;
   case'crit':if(!(d=D(1,60)))return;this._o(d,'sine',220,40,.6,.9);this._n(d,.5,3000,120,.7,.9);this._o(d,'sawtooth',90,40,.5,.2);this._n(d,.3,7000,3000,1,.3,'highpass',.04);break;
   case'critStart':if(!(d=D(.6,40)))return;this._n(d,.4,400,2400,2,.4,'bandpass');this._o(d,'sine',880,1760,.25,.05);break;
   case'clang':if(!(d=D(.9*vol,60)))return;[640,1020,1530,2210].forEach((f,i)=>this._o(d,'triangle',f,f*.985,.55,.22/(i+1)));this._n(d,.12,6000,1500,1.5,.5);this._o(d,'sine',110,60,.15,.3);break;
   case'parry':if(!(d=D(1.2,80)))return;[988,1480,1976,2960,3950].forEach((f,i)=>this._o(d,'sine',f,f,1.1,.18/(1+i*.4),i*.012));this._n(d,.2,9000,3000,1,.5,'highpass');this._o(d,'sine',140,50,.3,.5);break;
   case'parrySwing':if(!(d=D(.4,20)))return;this._n(d,.15,1200,4000,2,.3,'bandpass');break;
   case'guardbreak':if(!(d=D(1,60)))return;this._o(d,'square',300,80,.4,.15);this._n(d,.45,3000,200,.8,.7);[540,810].forEach(f=>this._o(d,'triangle',f,f*.9,.6,.12));break;
   case'slam':if(!(d=D(1.1*vol,90)))return;this._o(d,'sine',62,24,1.0,.9);this._n(d,.9,1100,50,.7,.9);this._n(d,.25,4000,500,1,.25);break;
   case'blast':if(!(d=D(.9*vol,70)))return;this._o(d,'sine',90,30,.6,.6);this._n(d,.6,2400,200,.8,.6);break;
   case'nova':if(!(d=D(1.6,120)))return;this._o(d,'sine',55,20,2,1);this._n(d,2,1600,40,.6,1);this._o(d,'sawtooth',110,30,1.4,.25);break;
   case'bell':if(!(d=D(1.4*vol,140)))return;[110,220,264,330,440,587,880].forEach((f,i)=>this._o(d,i%2?'sine':'triangle',f,f*.998,4.5-i*.4,[.5,.4,.22,.18,.16,.1,.08][i]));this._n(d,.2,3000,600,1,.4);break;
   case'howl':if(!(d=D(1.2*vol,100)))return;for(let i=0;i<2;i++){this._o(d,'sawtooth',300+i*7,520+i*9,1.6,.08,i*.05,.3);this._o(d,'sine',600,980,1.6,.1,i*.05,.3);}this._n(d,1.6,800,1600,4,.25,'bandpass',0);break;
   case'growl':if(!(d=D(.6,40)))return;this._o(d,'sawtooth',80,60,.6,.2);this._n(d,.6,500,250,3,.25,'bandpass');break;
   case'alert':if(!(d=D(.6,40)))return;this._o(d,'sawtooth',110,90,.5,.12);this._n(d,.4,300,900,3,.2,'bandpass');break;
   case'roar':if(!(d=D(1.6,140)))return;this._o(d,'sawtooth',70,45,2,.3);this._o(d,'sawtooth',73,47,2,.25);this._n(d,2,700,180,2,.5,'bandpass');this._o(d,'sine',45,30,2,.6);break;
   case'bow':if(!(d=D(.6,50)))return;this._o(d,'triangle',160,90,.15,.3);this._n(d,.2,3000,800,1,.25);break;
   case'blade':if(!(d=D(.6*vol,60)))return;this._o(d,'sine',1800,2600,.3,.08);this._n(d,.35,6000,2000,2,.2,'bandpass');break;
   case'beam':if(!(d=D(1,80)))return;this._o(d,'sawtooth',220,180,1.1,.12);this._o(d,'sine',880,660,1.1,.12);this._n(d,1.1,4000,2000,1,.3,'bandpass');break;
   case'breath':if(!(d=D(.9,60)))return;this._n(d,1.4,600,2000,.8,.6,'bandpass');this._o(d,'sawtooth',60,50,1.4,.1);break;
   case'drinkStart':if(!(d=D(.4,20)))return;this._n(d,.3,500,1200,3,.2,'bandpass');break;
   case'heal':if(!(d=D(.6,30)))return;[392,523,659,784].forEach((f,i)=>this._o(d,'sine',f,f*1.01,1.2,.08,i*.06));this._n(d,.8,3000,8000,2,.06,'bandpass');break;
   case'hurt':if(!(d=D(.8,30)))return;this._o(d,'sawtooth',180,90,.25,.12);this._n(d,.25,1500,300,1,.4);break;
   case'death':if(!(d=D(1.2,40)))return;[220,196,165,147,110].forEach((f,i)=>this._o(d,'sawtooth',f,f*.97,1.6,.05,i*.32,.3));this._o(d,'sine',55,30,4,.5);break;
   case'shrine':if(!(d=D(1,40)))return;this._n(d,1.4,200,3000,.7,.6,'lowpass');[196,294,392,587,784].forEach((f,i)=>this._o(d,'sine',f,f,3.5,.12,.3+i*.15,.2));break;
   case'lever':if(!(d=D(.8,40)))return;this._o(d,'square',160,80,.15,.1);this._n(d,.3,900,300,2,.4,'bandpass');this._o(d,'triangle',420,410,.4,.1,.15);break;
   case'gate':if(!(d=D(1,60)))return;this._n(d,2.2,400,200,3,.35,'bandpass');for(let i=0;i<10;i++)this._o(d,'square',90+Math.random()*40,70,.06,.07,i*.2);this._o(d,'sine',60,40,.5,.4,2.1);break;
   case'fog':if(!(d=D(.8,30)))return;this._n(d,1.2,300,2500,1.2,.35,'bandpass');this._o(d,'sine',220,440,1,.06);break;
   case'item':if(!(d=D(.8,30)))return;[523,784,1047,1568].forEach((f,i)=>this._o(d,'sine',f,f,.9,.1,i*.07));break;
   case'dissolve':if(!(d=D(.8*vol,60)))return;this._n(d,1.5,300,6000,1.5,.3,'bandpass');this._o(d,'sine',400,1200,1.4,.04);break;
   case'felled':[130.8,196,261.6,311.1,392,523.3].forEach((f,i)=>{const g=this._dst(null,1,1);this._o(g,'sawtooth',f,f,4.5,.05,i*.05,.6);this._o(g,'sine',f*2,f*2,4.5,.05,.2+i*.1,.6);});break;
   case'phase':if(!(d=D(1,120)))return;this._o(d,'sawtooth',55,40,2.4,.25);this._n(d,2.4,200,1200,1,.4,'bandpass');[110,165,220].forEach((f,i)=>this._o(d,'sawtooth',f,f*1.02,2.4,.05,i*.1,.5));break;
   case'ui':{const g=this._dst(null,.5,1);this._o(g,'triangle',880,660,.12,.12);break;}
  }}catch(e){}}
 // music: 'calm' cathedral drone, 'boss' choir + drums (intensity rises with phase), 'none'
 music(dt,mode,phase=1){if(!this.ac)return;const ac=this.ac,t=ac.currentTime;this.bossK+=((mode==='boss'?1:0)-this.bossK)*Math.min(1,dt*.8);
  const chords=mode==='boss'?[[55,82.4,110,130.8],[51.9,77.8,103.8,123.5],[49,73.4,98,116.5],[46.2,69.3,92.5,110]]:[[55,82.4,110,164.8],[49,73.4,98,146.8],[43.7,65.4,87.3,130.8],[51.9,77.8,103.8,155.6]];
  this.chordT-=dt;if(this.chordT<=0){this.chordT=mode==='boss'?4:8;this.ci=(this.ci+1)%4;const c=chords[this.ci];this.voices.forEach((v,i)=>v.o.frequency.setTargetAtTime(c[i],t,.8));this.choir.forEach((v,i)=>v.o.frequency.setTargetAtTime(c[i+1]*2,t,.6));}
  const base=mode==='none'?0:mode==='boss'?.05:.035;this.voices.forEach(v=>{v.g.gain.setTargetAtTime(base,t,.6);v.lp.frequency.setTargetAtTime(mode==='boss'?700+phase*200:380,t,1);});
  this.choir.forEach(v=>v.g.gain.setTargetAtTime(mode==='boss'?.018+phase*.006:0,t,1));
  if(this.bossK>.2){this.beat-=dt;if(this.beat<=0){const bpm=[0,92,104,116][Math.min(3,phase)];this.beat=60/bpm/2;this.step=(this.step||0)+1;const s=this.step%16;const g=this._dst(null,this.bossK,1);if(!g)return;const k=this.bossK*this.musVol;
    if(s%8===0||s===11){this._o(g,'sine',75,32,.5,.5*k);this._n(g,.3,500,60,1,.25*k);}if(s%8===4){this._n(g,.18,3000,800,1,.15*k);this._o(g,'triangle',180,120,.12,.08*k);}if(phase>=2&&s%2===1)this._n(g,.05,8000,5000,1,.04*k,'highpass');
    if(s===0&&phase>=3)this._o(g,'sawtooth',110,108,1.8,.05*k,0,.4);}}}
 beds(o){if(!this.ac)return;const t=this.ac.currentTime;this.wind.g.gain.setTargetAtTime(o.wind*.06,t,.6);this.wind.f.frequency.setTargetAtTime(260+o.wind*500,t,.8);this.fire.g.gain.setTargetAtTime(o.fire*.035,t,.3);}}
