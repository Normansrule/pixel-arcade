// KART GRAND PRIX — synthesized audio: engines, drift squeal, item sounds, countdown, and a small per-course music sequencer.
const SC={maj:[0,2,4,5,7,9,11],min:[0,2,3,5,7,8,10],dor:[0,2,3,5,7,9,10],phr:[0,1,3,5,7,8,10],lyd:[0,2,4,6,7,9,11]};
export class Sound{
 constructor(){this.ac=null;this.engines=[];this.music=true;this.vol=.7;this.seq=null;}
 init(){if(this.ac)return;try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);this.out=ac.createGain();this.out.gain.value=this.vol;this.out.connect(comp);
  this.mus=ac.createGain();this.mus.gain.value=.22;this.mus.connect(this.out);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  for(let i=0;i<2;i++){const o=ac.createOscillator();o.type='sawtooth';const o2=ac.createOscillator();o2.type='triangle';const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=500;const g=ac.createGain();g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g);g.connect(this.out);o.start();o2.start();
   const ns=ac.createBufferSource();ns.buffer=b;ns.loop=true;const nf=ac.createBiquadFilter();nf.type='bandpass';nf.frequency.value=2600;nf.Q.value=4;const ng=ac.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(this.out);ns.start();
   this.engines.push({o,o2,f,g,ng,nf});}}catch(e){this.ac=null;}}
 engine(i,spd,max,on,drift,boost){const e=this.engines[i];if(!e)return;const t=this.ac.currentTime,s=Math.min(1.3,Math.abs(spd)/max);const gear=s<.35?s/.35:s<.7?(s-.35)/.35:(s-.7)/.6;const f=70+gear*90+s*120;
  e.o.frequency.setTargetAtTime(f,t,.04);e.o2.frequency.setTargetAtTime(f*.5,t,.04);e.f.frequency.setTargetAtTime(400+s*1600+(boost?900:0),t,.05);e.g.gain.setTargetAtTime(on?.03+s*.035+(boost?.02:0):0,t,.08);
  e.ng.gain.setTargetAtTime(on&&drift?.05:0,t,.05);e.nf.frequency.setTargetAtTime(drift?2200+drift*500:2600,t,.05);}
 silence(){if(!this.ac)return;this.engines.forEach((e,i)=>this.engine(i,0,1,false,0,false));}
 _n(dur,f0,f1,q,vol,type='lowpass',dl=0){const ac=this.ac,t=ac.currentTime+dl,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur);}
 _o(type,f0,f1,dur,vol,delay=0,dest=null){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(dest||this.out);o.start(t);o.stop(t+dur+.02);}
 play(k,a=1){if(!this.ac)return;try{switch(k){
  case'beep':this._o('square',a?1046:523,a?1046:523,a?.6:.22,.08);break;
  case'box':[0,.05,.1].forEach((d,i)=>this._o('triangle',660*(1+i*.26),700*(1+i*.26),.12,.06,d));break;
  case'roll':this._o('square',900+Math.random()*600,900,.03,.025);break;
  case'got':this._o('triangle',880,1320,.2,.08);this._o('triangle',1320,1760,.25,.06,.08);break;
  case'coin':this._o('square',988,988,.06,.05);this._o('square',1319,1319,.25,.05,.06);break;
  case'mt':{const f=[0,600,800,1000][a];this._n(.35,1500,4000,1,.12,'bandpass');this._o('sawtooth',f*.5,f,.3,.05);break;}
  case'lv':this._o('sine',[0,700,900,1200][a],[0,900,1150,1500][a],.12,.06);break;
  case'hop':this._o('sine',300,520,.1,.06);break;
  case'trick':this._o('triangle',600,1200,.18,.06);break;
  case'boost':this._n(.6,500,3500,.8,.14,'bandpass');this._o('sawtooth',120,360,.5,.05);break;
  case'pad':this._n(.4,800,4000,1,.1,'bandpass');this._o('square',440,880,.25,.04);break;
  case'spring':this._o('sine',200,800,.3,.12);break;
  case'land':this._o('sine',110,45,.15,Math.min(.25,a*.015));break;
  case'wall':this._n(.18,2500,300,1,Math.min(.25,a*.012));this._o('square',90,40,.15,.05);break;
  case'bump':this._n(.2,1800,200,1,.18);this._o('sine',140,50,.18,.12);break;
  case'throw':this._n(.2,600,2400,1,.08,'bandpass');break;
  case'hit':this._n(.5,3000,150,.7,.3);this._o('square',400,90,.4,.08);break;
  case'boom':this._n(1.2,2200,40,.6,.55);this._o('sine',100,25,1,.4);break;
  case'pop':this._n(.12,4000,1000,1,.14);break;
  case'balloon':this._o('sine',900,200,.2,.12);this._n(.1,5000,2000,1,.15);break;
  case'bolt':this._n(.9,6000,200,.5,.35);this._o('sawtooth',1600,100,.8,.08);break;
  case'aura':[0,.08,.16,.24].forEach((d,i)=>this._o('triangle',523*(1+i*.25),523*(1+i*.25),.3,.05,d));break;
  case'shrink':this._o('sine',800,200,.5,.1);break;
  case'fall':this._o('sine',700,120,.9,.1);break;
  case'drone':this._o('sawtooth',300,320,.6,.03);break;
  case'lap':[0,.1,.2].forEach((d,i)=>this._o('square',[784,988,1175][i],[784,988,1175][i],.15,.05,d));break;
  case'final':[0,.12,.24,.36].forEach((d,i)=>this._o('square',[659,784,988,1319][i],[659,784,988,1319][i],.2,.06,d));break;
  case'finish':[0,.14,.28,.42,.6].forEach((d,i)=>this._o('square',[523,659,784,1046,1319][i],[523,659,784,1046,1319][i],.3,.07,d));break;
  case'rocket':this._n(.8,400,5000,.8,.2,'bandpass');this._o('sawtooth',200,600,.6,.06);break;
  case'stall':this._o('square',120,60,.6,.08);this._n(.5,600,100,1,.1);break;
  case'whoosh':this._n(.6,300,2500,.7,.1,'bandpass');break;
  case'ui':this._o('triangle',740,740,.06,.05);break;
  case'uigo':this._o('triangle',740,1110,.15,.06);break;}}catch(e){}}
 // ---------- music ----------
 startMusic(m,fast=false){this.stopMusic();if(!this.ac||!this.music||!m)return;const sc=SC[m.mode]||SC.maj,root=m.root,bpm=m.bpm*(fast?1.12:1),step=60/bpm/4;let n=0,next=this.ac.currentTime+.1;
  const rs=(s)=>{let r=s*1103515245+12345;return()=>{r=(r*1103515245+12345)&0x7fffffff;return r/0x7fffffff;};};const R=rs(root*7+m.bpm);
  const prog=[0,5,3,4].map(d=>d%7),mel=[];for(let i=0;i<64;i++)mel.push(R()<.55?Math.floor(R()*8):-1);
  const note=(deg,oct)=>{const o=Math.floor(deg/7);return 440*Math.pow(2,(root+sc[((deg%7)+7)%7]+12*(o+oct)-69)/12);};
  const tick=()=>{if(!this.ac)return;while(next<this.ac.currentTime+.25){const bar=Math.floor(n/16)%4,s=n%16,ch=prog[bar];
    if(s%4===0)this._o('triangle',note(ch,-2),note(ch,-2),step*3.5,.22,next-this.ac.currentTime,this.mus);
    if(s%2===1)this._o('square',note(ch+2,-1),note(ch+2,-1),step*.8,.05,next-this.ac.currentTime,this.mus);
    const md=mel[n%64];if(md>=0)this._o('square',note(ch+md,0),note(ch+md,0),step*1.6,.07,next-this.ac.currentTime,this.mus);
    if(s%4===0)this._kick(next);if(s%8===4)this._snare(next);if(s%2===0)this._hat(next);
    n++;next+=step;}};
  tick();this.seq=setInterval(tick,80);}
 stopMusic(){if(this.seq){clearInterval(this.seq);this.seq=null;}}
 _kick(t){const ac=this.ac,o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(40,t+.12);g.gain.setValueAtTime(.35,t);g.gain.exponentialRampToValueAtTime(.001,t+.15);o.connect(g);g.connect(this.mus);o.start(t);o.stop(t+.16);}
 _snare(t){const ac=this.ac,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=1200;const g=ac.createGain();g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);s.connect(f);f.connect(g);g.connect(this.mus);s.start(t,Math.random());s.stop(t+.13);}
 _hat(t){const ac=this.ac,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=7000;const g=ac.createGain();g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.001,t+.04);s.connect(f);f.connect(g);g.connect(this.mus);s.start(t,Math.random());s.stop(t+.05);}}
