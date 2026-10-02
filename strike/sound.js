// STRIKE ZONE — synthesized audio: weapons, monsters, movement, UI stingers and a procedural heavy-metal score (distorted twin guitars, bass, double-kick drums).
const R=Math.random;
// riffs: 16th-note steps. x = palm-muted low E, 0-9/a-c = open power chord (semitones above E), - = hold, . = rest
const RIFFS=[
 {g:'x.xxx.xx3-1-x.x6',k:'x.xxx.xxx.x.x.xx',s:'....x.......x...'},
 {g:'x.xxx.xxx.xx5-6-',k:'xxxxxxxxxxxxxxxx',s:'....x.......x...'},
 {g:'0---x.x.3---x.x.',k:'x...x.x.x...x.x.',s:'....x.......x...'},
 {g:'5---x.x.6-5-3-1-',k:'x...x.x.x.x.x.x.',s:'....x.......x..x'},
 {g:'x..xx..xx.x.a-8-',k:'x..xx..xx.x.x.x.',s:'........x.......'},
 {g:'x..xx..x3-1-0---',k:'x..xx..xx...x...',s:'........x.......'}];
const SONG=[0,0,1,1,2,3,2,3,0,1,4,5,4,5];
const BOSS=[4,5,4,5,1,1,3,3];
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.musVol=.55;this.intensity=0;this.step=0;this.bar=0;this.nextT=0;this.timer=null;this.cam={x:0,y:0,z:0,yaw:0};}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(ac.destination);this.master=ac.createGain();this.master.gain.value=this.vol;this.master.connect(comp);
  this.sfx=ac.createGain();this.sfx.connect(this.master);this.mus=ac.createGain();this.mus.gain.value=this.musVol;this.mus.connect(this.master);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=R()*2-1;this.noise=b;
  const il=ac.sampleRate*1.8,ib=ac.createBuffer(2,il,ac.sampleRate);for(let c=0;c<2;c++){const x=ib.getChannelData(c);for(let i=0;i<il;i++)x[i]=(R()*2-1)*Math.pow(1-i/il,2.6);}this.verb=ac.createConvolver();this.verb.buffer=ib;this.verbIn=ac.createGain();this.verbIn.gain.value=.3;this.verbIn.connect(this.verb);this.verb.connect(this.sfx);
  // guitar amp: waveshaper -> cab filter
  const curve=new Float32Array(2048);for(let i=0;i<2048;i++){const x=i/1024-1;curve[i]=Math.tanh(x*28)*.9;}this.amp=[0,1].map(k=>{const ws=ac.createWaveShaper();ws.curve=curve;ws.oversample='2x';const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=90;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3400;lp.Q.value=.8;const pk=ac.createBiquadFilter();pk.type='peaking';pk.frequency.value=1400;pk.gain.value=-5;const pan=ac.createStereoPanner();pan.pan.value=k?.6:-.6;const g=ac.createGain();g.gain.value=.16;ws.connect(hp);hp.connect(pk);pk.connect(lp);lp.connect(g);g.connect(pan);pan.connect(this.mus);return{ws,lp};});
  // ambient drone bed
  this.drone=ac.createGain();this.drone.gain.value=0;this.drone.connect(this.mus);const df=ac.createBiquadFilter();df.type='lowpass';df.frequency.value=320;df.connect(this.drone);for(const f of[41.2,41.6,61.7]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(df);o.start();}
  const ns=ac.createBufferSource();ns.buffer=b;ns.loop=true;const nf=ac.createBiquadFilter();nf.type='bandpass';nf.frequency.value=180;nf.Q.value=.6;const ng=ac.createGain();ng.gain.value=.25;ns.connect(nf);nf.connect(ng);ng.connect(this.drone);ns.start();
  this.timer=setInterval(()=>this.schedule(),30);}catch(e){this.ac=null;}}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 setMusic(v){this.musVol=v;if(this.mus)this.mus.gain.setTargetAtTime(v,this.ac.currentTime,.2);}
 music(level){if(this.intensity===level)return;const was=this.intensity;this.intensity=level;if(!this.ac)return;const t=this.ac.currentTime;this.drone.gain.setTargetAtTime(level===1?.5:level===0?.25:.12,t,.8);if(level>=2&&was<2){this.bar=0;this.step=0;this.nextT=t+.05;this.crash(this.nextT,.5);}}
 listener(x,y,z,yaw){this.cam.x=x;this.cam.y=y;this.cam.z=z;this.cam.yaw=yaw;}
 at(p){if(!p)return[0,0];const c=this.cam;const dx=p.x-c.x,dz=p.z-c.z,dy=(p.y||0)-c.y;const d=Math.hypot(dx,dy,dz)||1;const rx=Math.cos(c.yaw),rz=-Math.sin(c.yaw);return[d,(dx*rx+dz*rz)/d];}
 att(d,ref=10){return 1/(1+Math.max(0,d-2)/ref);}
 /* ---------- primitives ---------- */
 _out(pan,bus){bus=bus||this.sfx;if(!pan)return bus;const s=this.ac.createStereoPanner();s.pan.value=Math.max(-1,Math.min(1,pan));s.connect(bus);return s;}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0,rev=false,bus,at){if(vol<.002)return;const ac=this.ac,t=(at??ac.currentTime)+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(g);g.connect(this._out(pan,bus));if(rev)g.connect(this.verbIn);s.start(t,R()*1.5);s.stop(t+dur+.02);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0,rev=false,bus,at,atk=.004){if(vol<.002)return;const ac=this.ac,t=(at??ac.currentTime)+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+atk);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  o.connect(g);g.connect(this._out(pan,bus));if(rev)g.connect(this.verbIn);o.start(t);o.stop(t+dur+.03);}
 /* ---------- music ---------- */
 schedule(){if(!this.ac||this.intensity<2)return;const ac=this.ac;const bpm=this.intensity>=3?176:164,s16=60/bpm/4;if(this.nextT<ac.currentTime)this.nextT=ac.currentTime+.02;
  while(this.nextT<ac.currentTime+.14){const song=this.intensity>=3?BOSS:SONG;const rf=RIFFS[song[this.bar%song.length]];const i=this.step;this.playStep(rf,i,this.nextT,s16);this.nextT+=s16;this.step++;if(this.step>=16){this.step=0;this.bar++;if(this.bar%4===0)this.crash(this.nextT,.35);}}}
 playStep(rf,i,t,s16){const ch=rf.g[i];const E=82.41;
  if(ch==='x'){this.guitar(E,t,s16*.9,true);this.bass(E/2,t,s16*.9);}
  else if(ch!=='-'&&ch!=='.'){const n=parseInt(ch,16);let len=1;while(rf.g[i+len]==='-'&&i+len<16)len++;const f=E*Math.pow(2,n/12);this.guitar(f,t,s16*len*.98,false);this.bass(f/2,t,s16*len*.95);}
  if(rf.k[i]==='x')this.kick(t);if(rf.s[i]==='x')this.snare(t);if(i%2===0)this.hat(t,i%4===0?.05:.03);}
 guitar(f,t,dur,mute){const ac=this.ac;for(let k=0;k<2;k++){const amp=this.amp[k];const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(mute?.55:.42,t+.004);g.gain.setTargetAtTime(mute?.0:.3,t+.01,mute?.05:dur*.8);g.gain.setTargetAtTime(0,t+dur,.03);
   for(const m of mute?[1,2]:[1,1.498,2]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f*m*(1+(k?.003:-.003));o.connect(g);o.start(t);o.stop(t+dur+.12);}g.connect(amp.ws);amp.lp.frequency.setValueAtTime(mute?1500:3400,t);}}
 bass(f,t,dur){const ac=this.ac,o=ac.createOscillator(),lp=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=f;lp.type='lowpass';lp.frequency.value=380;g.gain.setValueAtTime(.22,t);g.gain.setTargetAtTime(0,t+dur*.8,.04);o.connect(lp);lp.connect(g);g.connect(this.mus);o.start(t);o.stop(t+dur+.1);}
 kick(t){this._o('sine',140,42,.16,.75,0,0,false,this.mus,t,.002);this._n(.012,3000,1500,1,.12,'bandpass',0,0,false,this.mus,t);}
 snare(t){this._n(.16,2400,900,.7,.32,'bandpass',0,0,false,this.mus,t);this._o('triangle',220,160,.08,.18,0,0,false,this.mus,t);}
 hat(t,v){this._n(.035,9000,7000,1,v,'highpass',0,.25,false,this.mus,t);}
 crash(t,v){this._n(1.4,7000,4000,.5,v*.5,'highpass',0,-.2,false,this.mus,t);this._n(1.2,6000,3500,.5,v*.4,'highpass',0,.3,false,this.mus,t);}
 /* ---------- weapons ---------- */
 shot(id){if(!this.ac)return;
  if(id==='sg'){this._n(.32,2600,180,.7,.9,'lowpass',0,0,true);this._o('sine',110,45,.2,.7);this._n(.05,5000,2000,1.2,.35,'bandpass');}
  else if(id==='ssg'){this._n(.5,2200,90,.6,1.1,'lowpass',0,0,true);this._o('sine',90,32,.32,.95);this._n(.07,4200,1500,1,.45,'bandpass');this._n(.12,900,300,1,.4,'bandpass',.42);this._n(.06,2400,1800,3,.25,'bandpass',.7);}
  else if(id==='cg'){this._n(.08,3200,600,.9,.38,'lowpass');this._o('square',160,90,.04,.12);}
  else if(id==='pg'){this._o('sawtooth',1800,400,.09,.12);this._o('sine',900,2200,.06,.1);this._n(.05,6000,3000,2,.08,'bandpass');}
  else if(id==='rl'){this._n(.55,1400,120,.6,.6,'lowpass',0,0,true);this._n(.4,600,2400,1.5,.2,'bandpass',.03);this._o('sine',80,40,.25,.5);}
  else if(id==='rg'){this._o('sawtooth',2400,200,.5,.25,0,0,true);this._o('sine',120,40,.4,.7);this._n(.6,9000,1200,.7,.4,'highpass',0,0,true);}}
 dry(){if(this.ac){this._o('square',900,700,.04,.08);}}
 spin(on){if(!this.ac)return;this._o('sawtooth',on?120:300,on?300:90,.3,.05);}
 swap(){if(this.ac){this._n(.06,2400,1200,3,.12,'bandpass');this._n(.05,1600,900,3,.1,'bandpass',.07);}}
 boom(p,big=1){if(!this.ac)return;const[d,pan]=this.at(p);const a=this.att(d,14)*big;this._n(1.3,1800,40,.6,.95*a,'lowpass',0,pan,true);this._o('sine',75,24,1.1,.8*a,0,pan);this._n(.2,5000,800,.6,.35*a,'lowpass',0,pan);}
 impact(p,soft){if(!this.ac)return;const[d,pan]=this.at(p);if(d>40)return;const a=this.att(d,6);this._n(.06,soft?800:2400,400,1.5,.12*a,'bandpass',0,pan);}
 /* ---------- player ---------- */
 jump(dbl){if(this.ac){this._n(.1,dbl?1800:900,dbl?3000:500,1,.08,'bandpass');if(dbl)this._o('sine',500,900,.12,.06);}}
 land(v){if(this.ac)this._n(.14,700,120,.8,.22*v,'lowpass');}
 dash(){if(this.ac){this._n(.28,400,4000,.8,.28,'bandpass',0,0,true);this._o('sine',200,600,.2,.1);}}
 pad(){if(this.ac){this._o('sine',220,880,.45,.22,0,0,true);this._n(.3,600,3000,1,.18,'bandpass');}}
 tele(){if(this.ac){this._o('sawtooth',1600,120,.6,.12,0,0,true);this._o('sine',300,1800,.4,.15,0,0,true);this._n(.5,8000,600,.5,.2,'highpass',0,0,true);}}
 hurt(v){if(this.ac){this._n(.2,500,90,.7,.4*v,'lowpass');this._o('sawtooth',140,70,.16,.12*v);}}
 lava(){if(this.ac)this._n(.3,1200,300,.6,.2,'bandpass');}
 pickup(k){if(!this.ac)return;if(k==='hp'||k==='orb'){this._o('sine',660,990,.12,.12);this._o('sine',990,1320,.1,.08,.06);}else if(k==='armor'||k==='shard'){this._o('triangle',440,880,.15,.14);this._n(.08,5000,3000,2,.08,'bandpass');}
  else if(k==='weapon'){this._n(.1,2000,900,2,.25,'bandpass');this._o('square',220,220,.1,.08,.08);this._o('square',330,330,.18,.08,.16);}else if(k==='quad'||k==='mega'||k==='megaarmor'){[0,.08,.16,.24].forEach((dd,i)=>this._o('sawtooth',220*Math.pow(1.26,i),220*Math.pow(1.26,i),.3,.1,dd,0,true));}else{this._n(.06,2600,1800,3,.15,'bandpass');this._o('square',600,600,.04,.05,.05);}}
 hit(k){if(!this.ac)return;if(k==='crit'){this._o('triangle',2400,2200,.08,.12);}else if(k==='kill'){this._o('square',180,90,.12,.1);this._n(.15,1200,200,.8,.2,'lowpass');}else this._o('triangle',1200,1000,.04,.07);}
 glory(){if(!this.ac)return;this._n(.35,1200,60,.6,.9,'lowpass',0,0,true);this._o('sine',90,30,.4,.8);this._o('sawtooth',300,60,.3,.2);this._n(.1,6000,2000,1,.4,'bandpass');}
 stagger(){if(this.ac){this._o('triangle',1320,1320,.18,.08);this._o('triangle',1760,1760,.22,.06,.05);}}
 quadShot(){if(this.ac)this._o('sawtooth',110,55,.25,.12);}
 secret(){if(!this.ac)return;[0,.12,.24,.36].forEach((d,i)=>this._o('triangle',[523,659,784,1046][i],[523,659,784,1046][i],.35,.12,d,0,true));}
 wave(){if(!this.ac)return;this._o('sawtooth',55,55,1.2,.25,0,0,true);this._o('sawtooth',82,82,1.2,.2,0,0,true);this._n(1.5,300,60,.5,.3,'lowpass',0,0,true);}
 clear(){if(!this.ac)return;[0,.15,.3].forEach((d,i)=>{this._o('sawtooth',[165,196,247][i],[165,196,247][i],.6,.12,d,0,true);});}
 death(){if(!this.ac)return;this._o('sawtooth',220,30,1.6,.3,0,0,true);this._n(1.4,1200,60,.5,.4,'lowpass',0,0,true);}
 /* ---------- monsters ---------- */
 monster(k,p){if(!this.ac)return;const[d,pan]=this.at(p);const a=this.att(d,12);if(a<.05)return;
  if(k==='throw'){this._n(.35,500,1600,.8,.25*a,'bandpass',0,pan);this._o('sawtooth',300,150,.2,.06*a,0,pan);}
  else if(k==='roar'){this._o('sawtooth',90,60,.8,.22*a,0,pan,true);this._o('sawtooth',137,88,.8,.15*a,0,pan,true);this._n(.8,700,200,1,.25*a,'bandpass',0,pan);}
  else if(k==='bossroar'){this._o('sawtooth',55,38,1.6,.35*a,0,pan,true);this._o('sawtooth',82,57,1.6,.25*a,0,pan,true);this._n(1.5,500,90,.7,.4*a,'lowpass',0,pan,true);}
  else if(k==='cannon'){this._n(.4,900,90,.7,.4*a,'lowpass',0,pan,true);this._o('sine',70,35,.3,.4*a,0,pan);}
  else if(k==='thud'){this._n(.3,500,60,.7,.6*a,'lowpass',0,pan,true);this._o('sine',60,30,.3,.6*a,0,pan);}
  else if(k==='bolt'){this._o('sine',1400,500,.12,.07*a,0,pan);}
  else if(k==='spawn'){this._n(.6,200,2400,1,.18*a,'bandpass',0,pan,true);this._o('sawtooth',80,160,.5,.06*a,0,pan);}
  else if(k==='die'){this._o('sawtooth',260,60,.5,.12*a,0,pan);this._n(.4,1500,200,.8,.25*a,'bandpass',0,pan);}
  else if(k==='gib'){this._n(.3,900,120,.6,.5*a,'lowpass',0,pan,true);this._n(.2,3000,600,1,.2*a,'bandpass',.03,pan);}
  else if(k==='slam'){this._n(.9,600,40,.6,.8*a,'lowpass',0,pan,true);this._o('sine',50,25,.8,.7*a,0,pan);}}}
