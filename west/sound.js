// DUSTWATER — WebAudio synthesis (no audio files): positional six-gun / rifle cracks with a canyon echo, ricochets, hooves, horse calls,
// lasso, the locomotive (chug + three-chime whistle), campfire, wind, cicadas at dusk, Dead Eye heartbeat, duel stingers, and an
// ambient synth western score: Andalusian-cadence pad, Karplus-Strong guitar, whistled melody, anvil and combat drums.
import {boot,gain,reverb,bed,SpatialSound} from '../js/kit3d/audio.js';

const A4=440,NOTE=n=>A4*Math.pow(2,(n-69)/12);
// chords (midi roots + tones) for Am - G - F - E
const PROG=[[57,[57,60,64]],[55,[55,59,62]],[53,[53,57,60]],[52,[52,56,59]]];
const MEL=[[76,74,72,71,69,0,0,0,72,71,69,68,69,0,0,0],[64,0,69,0,72,71,69,0,67,0,65,64,0,0,62,64],[69,72,76,0,74,72,0,71,72,71,69,0,68,0,69,0]];
export class Sound extends SpatialSound{
 constructor(){super();this.range=110;this.int=0;this.intT=0;this.mode='explore';this.nextT=0;this.beat=0;this.musOn=false;this.dusk=0;}
 init(){boot(this,ac=>{this.bus(ac);this.room(ac);this.echo=reverb(ac,2.6,2.2,.0,this.sfx);this.echoIn=this.echo;
  const dl=ac.createDelay(1);dl.delayTime.value=.38;const fb=gain(ac,.32,dl),lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1800;dl.connect(lp);lp.connect(fb);lp.connect(this.sfx);this.canyon=gain(ac,.0,dl);
  this.wind=bed(ac,this.noise,'bandpass',420,.6,this.master,0);this.river=bed(ac,this.noise,'lowpass',700,null,this.master,0,.7);this.fire=bed(ac,this.noise,'bandpass',2400,1.2,this.master,0,1.1);
  const ci=ac.createOscillator();ci.type='sine';ci.frequency.value=4600;const am=ac.createGain();am.gain.value=0;const lfo=ac.createOscillator();lfo.frequency.value=31;const lg=gain(ac,.5,am.gain);lfo.connect(lg);ci.connect(am);this.cic=gain(ac,0,this.master);am.connect(this.cic);ci.start();lfo.start();
  // music buses: guitar echo + a soft pad filter
  const md=ac.createDelay(1);md.delayTime.value=60/76*.75;const mfb=gain(ac,.38,md),mlp=ac.createBiquadFilter();mlp.type='lowpass';mlp.frequency.value=2600;md.connect(mlp);mlp.connect(mfb);mlp.connect(this.musG);this.gEcho=gain(ac,.35,md);
  this.mverb=reverb(ac,3.2,2.6,.3,this.musG);this.padF=ac.createBiquadFilter();this.padF.type='lowpass';this.padF.frequency.value=700;this.padG=gain(ac,0,this.musG);this.padF.connect(this.padG);this.padG.connect(this.mverb);
  this.musLP=ac.createBiquadFilter();this.musLP.type='lowpass';this.musLP.frequency.value=20000;
  // Karplus-Strong guitar plucks pre-rendered per midi note
  this.ks={};const kson=(m,bright=.5)=>{const sr=ac.sampleRate,f=NOTE(m),n=Math.floor(sr*2.2),P=Math.max(2,Math.round(sr/f)),b=ac.createBuffer(1,n,sr),d=b.getChannelData(0),buf=new Float32Array(P);for(let i=0;i<P;i++)buf[i]=Math.random()*2-1;let lp=0;
   for(let i=0;i<n;i++){const j=i%P,nx=buf[(i+1)%P];const v=buf[j];d[i]=v*(i<200?i/200:1);lp=(v+nx)*.5*.996;buf[j]=lp*(1-bright*.02)+v*bright*.02*.996;}return b;};
  for(let m=40;m<=84;m++)this.ks[m]=kson(m,m>64?.6:.3);});}
 // ambience: wind/river/fire/cicada levels 0..1
 amb(w,rv,fr,cic){if(!this.ac)return;const t=this.ac.currentTime;this.wind.g.gain.setTargetAtTime(.05+w*.12,t,.6);this.wind.f.frequency.setTargetAtTime(300+w*400+Math.sin(t*.3)*120,t,.8);this.river.g.gain.setTargetAtTime(rv*.12,t,.4);this.fire.g.gain.setTargetAtTime(fr*.06,t,.3);this.cic.gain.setTargetAtTime(cic*.012,t,1);}
 setLP(f){if(this.musLP&&this.ac)this.master.gain.setTargetAtTime(this.vol*(f<3000?.8:1),this.ac.currentTime,.1);}
 play(k,pos=null,vol=1,a=0){if(!this.ac)return;try{const r=1+(Math.random()-.5)*.08;let d;const D=(v,range)=>(d=this._dst(pos,v*vol,range));const now=this.ac.currentTime;
  switch(k){
  case'revolver':if(!D(.9,260))return;this._n(d,.14,9000,900,.6,.75,'highpass');this._n(d,.3,2600*r,160,.7,.7);this._o(d,'sine',150*r,38,.28,.7);this._o(d,'square',2200,1800,.012,.12);if(this._v>.25){const e=this.ac.createGain();e.gain.value=this._v*.55;e.connect(this.canyon);this._n(e,.5,2200,300,.6,.6);}break;
  case'rifle':if(!D(1,320))return;this._n(d,.12,11000,1200,.6,.8,'highpass');this._n(d,.45,2000*r,120,.6,.85);this._o(d,'sine',120*r,30,.4,.8);if(this._v>.2){const e=this.ac.createGain();e.gain.value=this._v*.7;e.connect(this.canyon);this._n(e,.7,1800,200,.6,.7);}break;
  case'lever':if(!D(.4,30))return;this._n(d,.04,3200,2000,3,.5,'bandpass',.22);this._o(d,'square',900,700,.02,.12,.24);this._n(d,.05,2600,1600,3,.5,'bandpass',.36);this._o(d,'square',1300,1100,.02,.14,.4);break;
  case'cock':D(.35);this._o(d,'square',1600,1400,.015,.14);this._n(d,.03,4000,3000,3,.3,'bandpass',.05);break;
  case'shell':D(.3);this._n(d,.03,4500,3500,4,.35,'bandpass');this._o(d,'triangle',2600*r,2500,.05,.06,.02);break;
  case'spin':D(.3);for(let i=0;i<5;i++)this._o(d,'square',1800,1700,.01,.06,i*.045);break;
  case'empty':D(.35);this._o(d,'square',1500,1400,.02,.18);break;
  case'ric':if(!D(.45,60))return;this._o(d,'sine',3200*r,1500,.32,.18);this._n(d,.06,7000,4000,2,.3,'bandpass');break;
  case'hitDirt':if(!D(.3,40))return;this._n(d,.12,1200,300,1,.4);break;
  case'hitWood':if(!D(.35,40))return;this._o(d,'triangle',420*r,220,.09,.3);this._n(d,.07,2200,800,2,.25,'bandpass');break;
  case'hitBody':if(!D(.55,60))return;this._o(d,'sine',200*r,60,.12,.5);this._n(d,.08,900,200,1,.4);break;
  case'whiz':D(.35);this._n(d,.22,2500*r,5500,6,.4,'bandpass');break;
  case'hurt':D(.5);this._o(d,'sine',190,110,.2,.35);this._n(d,.12,700,250,1,.3);break;
  case'grunt':if(!D(.35,40))return;this._o(d,'sawtooth',150*r,95,.18,.12);this._n(d,.14,600,300,2,.2,'bandpass');break;
  case'hoof':if(!D(.3*a+.08,60))return;this._o(d,'sine',95*r,52,.09,.55);this._n(d,.06,500,180,1,.5);break;
  case'clop':if(!D(.3,50))return;this._o(d,'triangle',330*r,260,.05,.35);this._n(d,.04,1800,900,3,.35,'bandpass');break;
  case'step':if(!D(.12,20))return;this._n(d,.06,1100*r,400,1.2,.3,'bandpass');break;
  case'board':if(!D(.15,20))return;this._o(d,'triangle',180*r,120,.06,.3);this._n(d,.04,900,500,2,.2,'bandpass');break;
  case'whinny':{if(!D(.45,90))return;const o=this.ac.createOscillator(),g=this.ac.createGain(),f=this.ac.createBiquadFilter(),lfo=this.ac.createOscillator(),lg=this.ac.createGain();o.type='sawtooth';f.type='bandpass';f.frequency.value=1400;f.Q.value=2;
   o.frequency.setValueAtTime(620,now);o.frequency.linearRampToValueAtTime(1150,now+.25);o.frequency.linearRampToValueAtTime(900,now+.7);o.frequency.linearRampToValueAtTime(480,now+1.1);lfo.frequency.value=14;lg.gain.value=60;lfo.connect(lg);lg.connect(o.frequency);
   g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.16*this._v,now+.08);g.gain.linearRampToValueAtTime(.1*this._v,now+.8);g.gain.exponentialRampToValueAtTime(.001,now+1.2);o.connect(f);f.connect(g);g.connect(d);o.start(now);lfo.start(now);o.stop(now+1.25);lfo.stop(now+1.25);
   this._n(d,.25,900,500,2,.2,'bandpass',1.05);break;}
  case'snort':if(!D(.3,40))return;this._n(d,.3,1100,600,1.5,.5,'bandpass');this._n(d,.2,900,500,1.5,.3,'bandpass',.32);break;
  case'whistle':D(.45);this._o(d,'sine',1700,2400,.22,.22,0,.03);this._o(d,'sine',2400,1500,.4,.2,.25,.03);break;
  case'trainWhistle':{if(!D(.75,700))return;for(const[f,v]of[[311,.13],[392,.11],[466,.1]]){const o=this.ac.createOscillator(),g=this.ac.createGain(),bp=this.ac.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(f*.96,now);o.frequency.linearRampToValueAtTime(f,now+.2);o.frequency.setValueAtTime(f,now+1.5);o.frequency.linearRampToValueAtTime(f*.97,now+2.1);
   bp.type='bandpass';bp.frequency.value=f*3;bp.Q.value=1.4;g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(v*this._v,now+.15);g.gain.setValueAtTime(v*this._v,now+1.7);g.gain.exponentialRampToValueAtTime(.001,now+2.3);o.connect(bp);bp.connect(g);g.connect(d);o.start(now);o.stop(now+2.4);}
   this._n(d,2.2,3000,2500,.8,.08,'bandpass');break;}
  case'chug':if(!D(.4,260))return;this._n(d,.22,700,180,.8,.6);this._n(d,.16,5000,2500,1,.25,'bandpass',.05);break;
  case'clack':if(!D(.25,120))return;this._o(d,'triangle',260*r,200,.05,.3);this._o(d,'triangle',250,190,.05,.3,.09);break;
  case'bell':if(!D(.5,200))return;[1,2.76,5.4].forEach((m,i)=>this._o(d,'sine',740*m,740*m,1.6-i*.4,.14/(i+1)));break;
  case'lassoThrow':D(.4);this._n(d,.45,400,2600,2,.45,'bandpass');break;
  case'lassoSpin':D(.15);this._n(d,.25,700,1400,3,.4,'bandpass');break;
  case'rope':if(!D(.45,40))return;this._o(d,'sawtooth',110,85,.35,.12);this._n(d,.3,1500,600,4,.25,'bandpass');break;
  case'tie':D(.35);for(let i=0;i<4;i++)this._n(d,.08,1200,800,3,.3,'bandpass',i*.14);break;
  case'pickup':D(.35);this._o(d,'triangle',880,880,.08,.15);this._o(d,'triangle',1320,1320,.12,.15,.06);break;
  case'money':D(.6);[1568,2093,2637,3136].forEach((f,i)=>this._o(d,'triangle',f,f,.5,.12,i*.05));this._n(d,.3,7000,9000,1,.15,'highpass',.05);break;
  case'heart':D(.6);this._o(d,'sine',62,42,.14,.7);this._o(d,'sine',58,40,.16,.55,.2);break;
  case'deIn':D(.6);this._n(d,.7,300,3500,1.5,.4,'bandpass');this._o(d,'sine',90,35,.8,.6,.2);this._o(d,'sawtooth',220,110,.5,.06);break;
  case'deOut':D(.5);this._n(d,.4,3500,300,1.5,.35,'bandpass');break;
  case'mark':D(.35);this._o(d,'square',2200,2000,.03,.12);this._o(d,'sine',3300,3200,.06,.08,.02);break;
  case'anvil':D(.6);[1,2.41,3.9,5.3].forEach((m,i)=>this._o(d,'triangle',820*m,815*m,1.4-i*.2,.2/(i+1)));break;
  case'draw':D(.8);this._n(d,.12,9000,2000,.8,.6,'highpass');[1,2.41,3.9].forEach((m,i)=>this._o(d,'triangle',740*m,735*m,1.8,.24/(i+1)));this._o(d,'sine',70,40,1,.6);break;
  case'strum':{D(.5);const ch=a?[52,56,59,64,68,71]:[45,52,57,60,64,69];ch.forEach((m,i)=>this.pluck(m,now+i*.03,.25,d));break;}
  case'fail':{D(.5);[45,48,52,57].forEach((m,i)=>this.pluck(m-1,now+i*.12,.25,d));break;}
  case'click':D(.35);this._o(d,'square',1300,1200,.02,.12);break;
  case'pop':if(!D(.25,30))return;this._n(d,.03,3000,1500,2,.4,'bandpass');break;
  case'boom':if(!D(1.3,600))return;this._n(d,1.6,1400*r,50,.7,1);this._o(d,'sine',68,24,1.3,1);this._n(d,.2,6000,1500,.5,.5,'highpass');if(this._v>.15){const e=this.ac.createGain();e.gain.value=this._v*.9;e.connect(this.canyon);this._n(e,1.4,900,120,.6,.8);}break;
  case'fuse':if(!D(.22,30))return;this._n(d,.5,7000,6000,2,.3,'bandpass');break;
  case'pat':D(.45);this._n(d,.07,700,400,2,.5,'bandpass');this._n(d,.07,700,400,2,.42,'bandpass',.2);break;
  case'splash':if(!D(.3,40))return;this._n(d,.25,1500,400,1,.4);break;}}catch(e){}}
 pluck(m,t,v,dst){const b=this.ks&&this.ks[Math.max(40,Math.min(84,m|0))];if(!b)return;const s=this.ac.createBufferSource();s.buffer=b;const g=this.ac.createGain();g.gain.value=v;s.connect(g);g.connect(dst||this.musG);if(!dst)g.connect(this.gEcho);s.start(t);s.stop(t+2.2);}
 // ---------------- music ----------------
 music(on){this.musOn=on;if(!this.ac)return;const t=this.ac.currentTime;this.padG.gain.setTargetAtTime(on?.05:0,t,1.2);if(on&&this.nextT<t)this.nextT=t+.1;}
 setMode(m){this.mode=m;}
 tick(){if(!this.ac||!this.musOn)return;const ac=this.ac,now=ac.currentTime;const target=this.mode==='combat'?1:this.mode==='duel'?.6:0;this.int+=(target-this.int)*.02;
  const spb=60/(76+this.int*20),eighth=spb/2;if(this.nextT<now-.5)this.nextT=now+.05;
  while(this.nextT<now+.25){const t=this.nextT,b=this.beat,bar=Math.floor(b/8),pos=b%8,ch=PROG[Math.floor(bar/2)%4],root=ch[0],tones=ch[1];
   if(pos===0&&bar%2===0)this.pad(tones,t,spb*8);
   const duel=this.mode==='duel';
   if(duel){if(pos%4===0)this.pluck(root-12+12,t,.12);if(pos===0)this.drum('heart',t);if(pos===0&&bar%4===0)this.anvil(t,.06);}
   else{
    if(pos===0||pos===4&&Math.random()<.5)this.pluck(root-12,t,.22);
    const arp=[0,1,2,1,2,1,0,2];if(this.int<.5){if(bar%4!==3&&(pos%2===0||Math.random()<.25))this.pluck(tones[arp[pos]]+12,t,.08+Math.random()*.04);}
    else{this.pluck(tones[arp[pos]]+12,t,.1);this.pluck(root+24,t+eighth/2,.05);}
    const mel=MEL[Math.floor(bar/8)%MEL.length];if(bar%8>=4&&bar%8<6&&this.int<.5){const n=mel[(bar%2)*8+pos];if(n)this.whistle(n,t,eighth*1.8);}
    if(bar%16===15&&pos===0)this.anvil(t,.05);
    if(this.int>.2){const v=this.int;if(pos===0||pos===3||pos===6)this.drum('tom',t,v);if(pos===4)this.drum('snare',t,v);this.drum('shaker',t,v*.6);this.drum('shaker',t+eighth/2,v*.35);}}
   this.beat++;this.nextT+=eighth;}}
 pad(tones,t,dur){const ac=this.ac;for(const m of tones)for(const det of[-6,6]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=NOTE(m-12);o.detune.value=det;const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+dur*.3);g.gain.linearRampToValueAtTime(0,t+dur*1.05);o.connect(g);g.connect(this.padF);o.start(t);o.stop(t+dur*1.1);}}
 whistle(m,t,dur){const ac=this.ac,o=ac.createOscillator(),g=ac.createGain(),l=ac.createOscillator(),lg=ac.createGain();o.type='sine';o.frequency.setValueAtTime(NOTE(m+12)*.97,t);o.frequency.linearRampToValueAtTime(NOTE(m+12),t+.06);l.frequency.value=5.5;lg.gain.value=9;l.connect(lg);lg.connect(o.frequency);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.035,t+.07);g.gain.setValueAtTime(.035,t+dur*.7);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(g);g.connect(this.mverb);g.connect(this.musG);o.start(t);l.start(t);o.stop(t+dur+.05);l.stop(t+dur+.05);}
 anvil(t,v){const ac=this.ac;[1,2.41,3.9].forEach((m,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=900*m;g.gain.setValueAtTime(v/(i+1),t);g.gain.exponentialRampToValueAtTime(.0005,t+1.2);o.connect(g);g.connect(this.mverb);o.start(t);o.stop(t+1.3);});}
 drum(k,t,v=1){const ac=this.ac,g=ac.createGain();g.connect(this.musG);
  if(k==='tom'||k==='heart'){const o=ac.createOscillator();o.type='sine';o.frequency.setValueAtTime(k==='heart'?70:110,t);o.frequency.exponentialRampToValueAtTime(45,t+.25);g.gain.setValueAtTime(.22*v,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);o.start(t);o.stop(t+.32);}
  else{const s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=k==='shaker'?'highpass':'bandpass';f.frequency.value=k==='shaker'?7000:1800;f.Q.value=.8;const d=k==='shaker'?.05:.16;g.gain.setValueAtTime((k==='shaker'?.05:.1)*v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f);f.connect(g);s.start(t,Math.random());s.stop(t+d+.02);}}}
