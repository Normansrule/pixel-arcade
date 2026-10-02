// PENGUIN PLAZA — synthesized audio: sfx + a tiny step sequencer with original procedural tunes (no audio files).
const mtof=m=>440*Math.pow(2,(m-69)/12);
// chord progressions (root midi + chord tones) used by the procedural tracks
const PROG={
 island:[[60,[0,4,7,11]],[57,[0,3,7,10]],[53,[0,4,7,11]],[55,[0,4,7,9]]],
 cozy:[[62,[0,3,7,10]],[55,[0,4,7,10]],[60,[0,4,7,11]],[57,[0,3,7,10]]],
 club:[[57,[0,3,7]],[53,[0,4,7]],[60,[0,4,7]],[55,[0,4,7]]],
 game:[[60,[0,4,7]],[57,[0,3,7]],[65,[0,4,7]],[67,[0,4,7]]],
 race:[[62,[0,3,7]],[58,[0,4,7]],[60,[0,4,7]],[57,[0,4,7]]],
};
export const TRACKS={
 island:{bpm:84,bars:8,swing:.08,gen(s,bar,r){const[root,ch]=PROG.island[(bar>>1)%4],ev=[],b=s%16;
   if(b===0)ev.push(['pad',root-12,3.6,.05],['pad',root-12+ch[1],3.6,.04],['pad',root-12+ch[2],3.6,.04]);
   if(b%2===0){const arp=[0,2,1,3,2,1,3,2],n=ch[arp[(b/2)%8]%ch.length]+12;if(r()<.82)ev.push(['bell',root+n,.9,.08]);}
   if(b===0||b===10)ev.push(['bass',root-24,1,.09]);if(b%4===2&&r()<.5)ev.push(['shk',0,.05,.02]);return ev;}},
 night:{bpm:70,bars:8,swing:0,gen(s,bar,r){const[root,ch]=PROG.island[(bar>>1)%4],ev=[],b=s%16;
   if(b===0)ev.push(['pad',root-12,4.5,.05],['pad',root-5,4.5,.035],['pad',root-12+ch[3],4.5,.03]);
   if(b%4===0&&r()<.7)ev.push(['bell',root+12+ch[(r()*4)|0],1.6,.06]);return ev;}},
 cozy:{bpm:96,bars:8,swing:.18,gen(s,bar,r){const[root,ch]=PROG.cozy[(bar>>1)%4],ev=[],b=s%16;
   if(b===0||b===6&&r()<.6)ch.forEach(c=>ev.push(['keys',root+c,1.6,.045]));if(b%4===0)ev.push(['bass',root-24+[0,7,12,7][b/4],.5,.1]);
   if(b%4===2)ev.push(['brush',0,.08,.03]);if(b%8===4)ev.push(['brush',1,.12,.05]);if(b%2===1&&r()<.25)ev.push(['bell',root+12+ch[(r()*4)|0],.6,.04]);return ev;}},
 club:{bpm:124,bars:8,swing:0,gen(s,bar,r){const[root,ch]=PROG.club[(bar>>1)%4],ev=[],b=s%16;
   if(b%4===0)ev.push(['kick',0,.3,.5]);if(b===4||b===12)ev.push(['clap',0,.2,.16]);if(b%4===2)ev.push(['hat',1,.08,.07]);else if(r()<.5)ev.push(['hat',0,.03,.03]);
   if(b%4===2||b%4===3&&r()<.3)ev.push(['bass',root-24,.18,.14]);if(b%3===0&&b<15)ev.push(['pluck',root+ch[(b/3)%ch.length]+12,.2,.05]);if(b===0)ch.forEach(c=>ev.push(['pad',root+c,3.8,.025]));return ev;}},
 game:{bpm:116,bars:8,swing:.05,gen(s,bar,r){const[root,ch]=PROG.game[(bar>>1)%4],ev=[],b=s%16;
   if(b%8===0)ev.push(['kick',0,.25,.35]);if(b%8===4)ev.push(['clap',0,.15,.1]);if(b%2===1)ev.push(['hat',0,.03,.04]);
   if(b%4===0||b===14)ev.push(['bass',root-24+(b===14?7:0),.22,.12]);if(b%2===0&&r()<.7)ev.push(['pluck',root+ch[(b/2+bar)%ch.length]+12,.15,.045]);return ev;}},
 race:{bpm:140,bars:8,swing:0,gen(s,bar,r){const[root,ch]=PROG.race[(bar>>1)%4],ev=[],b=s%16;
   if(b%4===0)ev.push(['kick',0,.25,.4]);if(b%8===4)ev.push(['clap',0,.15,.12]);ev.push(['hat',b%2,.03,.035]);
   if(b%2===0)ev.push(['bass',root-24+(b%8===6?12:0),.15,.13]);if(b%4!==1&&r()<.6)ev.push(['lead',root+12+ch[(b+bar*3)%ch.length],.13,.03]);return ev;}},
};

export class Sound{
 constructor(){this.ac=null;this.on=true;this.musicOn=true;this.cur=null;this.loops={};}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=3;comp.connect(ac.destination);
  this.master=ac.createGain();this.master.gain.value=.8;this.master.connect(comp);this.sfx=ac.createGain();this.sfx.gain.value=.9;this.sfx.connect(this.master);
  this.mus=ac.createGain();this.mus.gain.value=this.musicOn?.55:0;this.mus.connect(this.master);
  // small room reverb
  const len=ac.sampleRate*1.6,ir=ac.createBuffer(2,len,ac.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);}
  this.rev=ac.createConvolver();this.rev.buffer=ir;this.revG=ac.createGain();this.revG.gain.value=.22;this.rev.connect(this.revG);this.revG.connect(this.master);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  // wind bed (outdoor ambience)
  const ws=ac.createBufferSource();ws.buffer=b;ws.loop=true;const wf=ac.createBiquadFilter();wf.type='lowpass';wf.frequency.value=380;this.wind=ac.createGain();this.wind.gain.value=0;ws.connect(wf);wf.connect(this.wind);this.wind.connect(this.sfx);ws.start();
 }catch(e){this.ac=null;}}
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
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.sfx);s.start(t,Math.random());s.stop(t+dur);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.sfx);o.start(t);o.stop(t+dur+.02);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'step':this._n(.07,1800+Math.random()*900,500,1.2,.035*a,'bandpass');break;
  case'coin':this._o('square',988,988,.08,.05);this._o('square',1319,1319,.25,.05,.07);break;
  case'coins':for(let i=0;i<Math.min(6,a);i++){this._o('square',988+i*60,988+i*60,.07,.035,i*.07);this._o('square',1319+i*60,1319+i*60,.12,.035,i*.07+.04);}break;
  case'ui':this._o('sine',660,880,.06,.05);break;
  case'pop':this._o('sine',420+a*120,900+a*200,.09,.07);break;
  case'bubble':this._o('sine',520,1040,.08,.05);this._o('sine',780,1300,.06,.04,.06);break;
  case'throw':this._n(.18,600,2400,1.2,.09,'bandpass');break;
  case'splat':this._n(.22,2200,300,.8,.18);this._o('sine',180,70,.12,.08);break;
  case'door':this._n(.45,300,1400,.7,.08,'bandpass');this._o('sine',520,780,.2,.03,.1);break;
  case'whoosh':this._n(.5,400,2600,.7,.1,'bandpass');break;
  case'jump':this._o('square',300,760,.16,.05);break;
  case'land':this._n(.12,900,200,1,.1);break;
  case'crash':this._n(.6,1800,90,.6,.3);this._o('sawtooth',140,40,.4,.08);break;
  case'bite':this._o('sine',300,900,.1,.08);this._o('sine',900,500,.1,.06,.1);break;
  case'splash':this._n(.5,3000,300,.6,.16);this._n(.3,800,200,.8,.1,'lowpass',.08);break;
  case'reel':this._o('square',1400+a*80,1400+a*80,.025,.02);break;
  case'ding':this._o('sine',1320,1320,.5,.08);this._o('sine',1980,1980,.4,.04,.01);break;
  case'buzz':this._o('sawtooth',150,120,.3,.07);this._o('square',155,120,.3,.04);break;
  case'sizzle':this._n(.6,5000,3000,.4,.05,'highpass');break;
  case'chop':this._n(.05,2000,800,1,.08);this._o('sine',240+Math.random()*80,140,.05,.05);break;
  case'squeak':this._o('sine',900+a*200,1600+a*300,.12,.06);this._o('sine',1600+a*300,1100,.08,.04,.1);break;
  case'whistle':this._o('sine',1800,2400,.25,.06);this._o('sine',2400,1700,.25,.05,.22);break;
  case'hit':this._o('sine',600+a*90,600+a*90,.08,.05);this._o('sine',900+a*90,1200+a*90,.1,.04,.03);break;
  case'miss':this._o('triangle',220,140,.18,.06);break;
  case'cheer':this._n(1.2,1200,800,.5,.08,'bandpass');for(let i=0;i<5;i++)this._o('sine',700+Math.random()*900,900+Math.random()*900,.15,.02,Math.random()*.6);break;
  case'win':[523,659,784,1047].forEach((f,i)=>this._o('square',f,f,.22,.05,i*.11));this._o('square',1319,1319,.6,.05,.46);break;
  case'lose':[392,349,311,262].forEach((f,i)=>this._o('triangle',f,f*.98,.3,.07,i*.16));break;
  case'beep':this._o('square',a?990:660,a?990:660,a?.45:.15,.06);break;
  case'chime':[1047,1319,1568].forEach((f,i)=>this._o('sine',f,f,.5,.05,i*.07));break;
  case'buy':this._o('square',784,784,.08,.05);this._o('square',1047,1047,.08,.05,.08);this._o('square',1568,1568,.3,.05,.16);break;
  case'rail':this._n(.08,4000,3000,2,.03,'bandpass');break;
  case'boost':this._n(.6,600,3600,.6,.12,'bandpass');this._o('sawtooth',200,600,.4,.04);break;
  case'oven':this._o('sine',1568,1568,.18,.06);this._o('sine',2093,2093,.35,.05,.18);break;
 }}catch(e){}}}
