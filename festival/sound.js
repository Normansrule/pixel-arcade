// LANTERN STREET — synthesized audio (instrument + step-sequencer core adapted from plaza/sound.js): original procedural tunes for the
// dark street, the battle and the festival, plus effects. No audio files; nothing plays until the first click or key (init()).
import {boot,master,gain,noiseBuf,reverb,bed,tone,hiss} from '../js/kit3d/audio.js';
const mtof=m=>440*Math.pow(2,(m-69)/12);
const PENTA=[0,2,4,7,9,12,14,16];
const PROG={night:[[57,[0,3,7,10]],[53,[0,4,7,11]],[55,[0,4,7,9]],[52,[0,3,7,10]]],fest:[[60,[0,4,7]],[57,[0,3,7]],[62,[0,3,7]],[55,[0,4,7]]],fight:[[57,[0,3,7]],[53,[0,4,7]],[55,[0,4,7]],[52,[0,4,7]]]};
export const TRACKS={
 night:{bpm:72,bars:8,swing:.1,gen(s,bar,r){const[root,ch]=PROG.night[(bar>>1)%4],ev=[],b=s%16;
   if(b===0)ev.push(['pad',root-12,4.6,.045],['pad',root-12+ch[1],4.6,.035],['pad',root-12+ch[3],4.6,.03]);
   if(b%4===0&&r()<.6)ev.push(['pluck',root+12+PENTA[(r()*6)|0],.5,.035]);if(b===8&&r()<.5)ev.push(['bell',root+24+ch[(r()*3)|0],1.4,.03]);if(b===0||b===10)ev.push(['bass',root-24,1.2,.06]);return ev;}},
 fight:{bpm:126,bars:8,swing:0,gen(s,bar,r){const[root,ch]=PROG.fight[(bar>>1)%4],ev=[],b=s%16;
   if(b%4===0)ev.push(['kick',0,.25,.36]);if(b===4||b===12)ev.push(['clap',0,.15,.11]);if(b%2===1)ev.push(['hat',0,.03,.04]);
   if(b%2===0)ev.push(['bass',root-24+(b%8===6?12:0),.18,.11]);if(b%4!==1&&r()<.7)ev.push(['lead',root+12+PENTA[(b+bar*3)%7],.13,.026]);if(b===0)ch.forEach(c=>ev.push(['pad',root+c,3.6,.02]));return ev;}},
 fest:{bpm:108,bars:8,swing:.12,gen(s,bar,r){const[root,ch]=PROG.fest[(bar>>1)%4],ev=[],b=s%16;
   if(b%8===0)ev.push(['kick',0,.25,.28]);if(b%8===4)ev.push(['clap',0,.15,.08]);if(b%2===1)ev.push(['shk',0,.05,.025]);
   if(b%4===0||b===14)ev.push(['bass',root-24+(b===14?7:0),.25,.1]);if(b%2===0&&r()<.8)ev.push(['bell',root+12+PENTA[(b/2+bar*2)%8],.5,.05]);
   if(b===0)ch.forEach(c=>ev.push(['keys',root+c,1.8,.035]));if(b%4===2&&r()<.5)ev.push(['pluck',root+24+ch[(r()*3)|0],.2,.03]);return ev;}},
};

export class Sound{
 constructor(){this.ac=null;this.on=true;this.musicOn=true;this.cur=null;this.loops={};}
 init(){boot(this,ac=>{this.master=master(ac,.8,-14,3);this.sfx=gain(ac,.9,this.master);this.mus=gain(ac,this.musicOn?.55:0,this.master);
  // small room reverb (this.rev is its input)
  this.rev=reverb(ac,1.6,3,.22,this.master);
  const b=this.noise=noiseBuf(ac);
  // wind bed (outdoor ambience)
  this.wind=bed(ac,b,'lowpass',380,null,this.sfx).g;this.hum=bed(ac,b,'bandpass',900,2,this.sfx).g;});}
 setMusic(on){this.musicOn=on;if(this.mus)this.mus.gain.setTargetAtTime(on?.55:0,this.ac.currentTime,.2);}
 ambience(w){if(this.wind)this.wind.gain.setTargetAtTime(w*.05,this.ac.currentTime,.6);}
 // ---- instruments: schedule one note at absolute audio time t ----
 note(inst,m,t,len=.2,vel=.1,dest){const ac=this.ac;if(!ac)return;const out=dest||this.mus;try{
  const env=(g,a,d,v)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0005,t+a+d);};
  const osc=(type,f,g)=>{const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.connect(g);o.start(t);o.stop(t+len+1.2);return o;};
  const nz=(dur,type,f,q,v)=>{const s=ac.createBufferSource();s.buffer=this.noise;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();env(g,.002,dur,v);s.connect(fl);fl.connect(g);g.connect(out);s.start(t,Math.random());s.stop(t+dur+.05);};
  switch(inst){
   case'kick':{const g=ac.createGain();env(g,.003,.32,vel);g.connect(out);const o=osc('sine',150,g);o.frequency.exponentialRampToValueAtTime(42,t+.12);break;}
   case'clap':nz(.16,'bandpass',1500,.9,vel);nz(.06,'highpass',4000,.5,vel*.5);break;
   case'hat':nz(m?.09:.035,'highpass',m?7000:9000,.6,vel);break;
   case'shk':nz(.06,'highpass',6000,.8,vel);break;
   case'brush':nz(m?.16:.07,'bandpass',m?2600:5000,.6,vel);break;
   case'bass':{const g=ac.createGain();env(g,.01,len+.12,vel);const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(160,t+len+.1);f.connect(g);g.connect(out);osc('triangle',mtof(m),f);osc('sawtooth',mtof(m),f).detune.value=6;break;}
   case'bell':{const g=ac.createGain();env(g,.004,len+.6,vel);g.connect(out);g.connect(this.rev);osc('sine',mtof(m),g);const g2=ac.createGain();env(g2,.002,.25,vel*.35);g2.connect(out);osc('sine',mtof(m)*2.76,g2);break;}
   case'pluck':{const g=ac.createGain();env(g,.005,len+.15,vel);const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(3200,t);f.frequency.exponentialRampToValueAtTime(500,t+.2);f.connect(g);g.connect(out);g.connect(this.rev);osc('square',mtof(m),f);break;}
   case'lead':{const g=ac.createGain();env(g,.01,len+.1,vel);const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=2400;f.connect(g);g.connect(out);g.connect(this.rev);const o=osc('square',mtof(m),f);const l=ac.createOscillator();l.frequency.value=6;const lg=ac.createGain();lg.gain.value=4;l.connect(lg);lg.connect(o.detune);l.start(t);l.stop(t+len+.5);break;}
   case'keys':{const g=ac.createGain();env(g,.01,len+.4,vel);g.connect(out);g.connect(this.rev);osc('sine',mtof(m),g);const g2=ac.createGain();env(g2,.005,.3,vel*.4);g2.connect(out);osc('triangle',mtof(m)*2,g2);break;}
   case'pad':{const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+len*.35);g.gain.linearRampToValueAtTime(0,t+len);const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=1100;f.connect(g);g.connect(out);g.connect(this.rev);osc('sawtooth',mtof(m),f).detune.value=-8;osc('sawtooth',mtof(m),f).detune.value=8;break;}
  }}catch(e){}}
 // ---- looping procedural music ----
 music(name){if(!this.ac)return;if(this.cur&&this.cur.name===name)return;this.cur=name&&TRACKS[name]?{name,def:TRACKS[name],step:0,next:this.ac.currentTime+.08,seed:1}:null;}
 tick(){if(!this.ac||!this.cur)return;const c=this.cur,d=c.def,sd=60/d.bpm/4,ahead=this.ac.currentTime+.25;let n=0;
  while(c.next<ahead&&n++<32){const bar=(c.step/16|0)%d.bars;c.seed=(c.seed*16807)%2147483647;const s0=c.seed;const r=()=>(c.seed=(c.seed*16807)%2147483647)/2147483647;
   const t=c.next+(c.step%2?d.swing*sd*2:0);for(const[i,m,l,v]of d.gen(c.step,bar,r))this.note(i,m,t,l,v);c.step++;c.next+=sd;void s0;}}
 // ---- sound effects ----
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){hiss(this.ac,this.noise,this.sfx,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,0,20);}
 _o(type,f0,f1,dur,vol,delay=0){tone(this.ac,this.sfx,this.ac.currentTime+delay,type,f0,f1,dur,vol,.008);}
 beam(on){if(this.hum)this.hum.gain.setTargetAtTime(on?.05:0,this.ac.currentTime,.08);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'step':this._n(.06,1400+Math.random()*700,400,1.2,.025*a,'bandpass');break;
  case'ui':this._o('sine',660,880,.06,.05);break;
  case'talk':this._o('triangle',300+a*60+Math.random()*60,300+a*60,.05,.03);break;
  case'pickup':[784,988,1175,1568].forEach((f,i)=>this._o('square',f,f,.12,.035,i*.06));this._n(.4,3000,8000,.6,.04,'highpass',.1);break;
  case'whoosh':this._n(.5,400,2600,.7,.1,'bandpass');break;
  case'tape':for(let i=0;i<4;i++)this._n(.12,2500,1200,2,.06,'bandpass',i*.16);break;
  case'assemble':[523,659,784,1047,1319].forEach((f,i)=>this._o('triangle',f,f,.3,.05,i*.09));this._n(1,300,4000,.6,.08,'bandpass');break;
  case'knot':this._o('sawtooth',90,60,.3,.03);break;
  case'untie':this._n(1.2,3000,200,.6,.14);[392,523,659,784,1047].forEach((f,i)=>this._o('sine',f,f*1.01,.5,.05,i*.08));break;
  case'block':this._o('square',220,110,.08,.05);this._n(.12,4000,2000,1,.05,'highpass');break;
  case'deny':this._o('triangle',200,150,.18,.06);break;
  case'ring':this._o('sine',1200,1600,.05,.025);break;
  case'great':[1319,1760,2093].forEach((f,i)=>this._o('sine',f,f,.25,.05,i*.05));break;
  case'good':this._o('sine',988,1319,.14,.05);break;
  case'miss':this._o('triangle',220,140,.18,.06);break;
  case'hit':this._n(.18,2000,300,.8,.16);this._o('sine',180+a*40,70,.14,.1);break;
  case'hurt':this._n(.3,800,200,.6,.12);this._o('sawtooth',160,80,.25,.05);break;
  case'puff':this._n(.5,1200,300,.5,.12,'bandpass');break;
  case'inhale':this._n(1,200,1400,.6,.1,'bandpass');break;
  case'heal':[523,659,784,1047].forEach((f,i)=>this._o('sine',f,f,.3,.04,i*.07));break;
  case'transform':this._n(1.2,200,5000,.5,.12,'bandpass');[262,330,392,523,659,784].forEach((f,i)=>this._o('square',f,f,.2,.03,i*.07));break;
  case'faint':this._o('sine',900,200,.6,.06);this._n(.6,2000,400,.6,.06);break;
  case'win':[523,659,784,1047].forEach((f,i)=>this._o('square',f,f,.22,.05,i*.11));this._o('square',1319,1319,.6,.05,.46);break;
  case'lose':[392,349,311,262].forEach((f,i)=>this._o('triangle',f,f*.98,.3,.07,i*.16));break;
  case'relight':this._o('sine',1200+a*100,1500+a*100,.25,.025);break;
  case'bell':[[392,2.4],[784,1.6],[1176,1],[1568,.6]].forEach(([f,d],i)=>{const g=tone(this.ac,this.sfx,this.ac.currentTime,'sine',f,f*.998,d,.09/(i+1),.004);try{g.connect(this.rev);}catch(e){}});break;
  case'cheer':this._n(1.2,1200,800,.5,.08,'bandpass');for(let i=0;i<6;i++)this._o('sine',700+Math.random()*900,900+Math.random()*900,.15,.02,Math.random()*.6);break;
  case'tick':this._o('square',1800,1800,.02,.02);break;
 }}catch(e){}}}
