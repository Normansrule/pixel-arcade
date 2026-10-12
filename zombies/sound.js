// NIGHTFALL — all audio synthesized with WebAudio: guns, reloads, groans, boards, the crate's music box, perks, power, round bells, wind and crickets.
const R=Math.random;
// original motifs (semitone offsets from A2)
const ROUND_START=[0,3,7,6,3,0,-2,0],ROUND_END=[12,10,7,3,5,0],BOX_TUNE=[12,15,19,15,22,19,15,14,12,15,19,24,22,19,15,17],DAWN=[0,4,7,12,16,19,24];
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.cam={x:0,y:0,z:0,yaw:0};this.boxNode=null;}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-12;comp.ratio.value=5;comp.connect(ac.destination);this.duck=ac.createBiquadFilter();this.duck.type='lowpass';this.duck.frequency.value=20000;this.duck.connect(comp);
  this.master=ac.createGain();this.master.gain.value=this.vol;this.master.connect(this.duck);this.sfx=ac.createGain();this.sfx.connect(this.master);this.mus=ac.createGain();this.mus.gain.value=.6;this.mus.connect(this.master);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=R()*2-1;this.noise=b;
  const il=ac.sampleRate*2.4,ib=ac.createBuffer(2,il,ac.sampleRate);for(let c=0;c<2;c++){const x=ib.getChannelData(c);for(let i=0;i<il;i++)x[i]=(R()*2-1)*Math.pow(1-i/il,3);}this.verb=ac.createConvolver();this.verb.buffer=ib;this.verbIn=ac.createGain();this.verbIn.gain.value=.35;this.verbIn.connect(this.verb);this.verb.connect(this.master);
  const curve=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/512-1;curve[i]=Math.tanh(x*4);}this.curve=curve;
  // ambience: wind + crickets + drone
  this.amb=ac.createGain();this.amb.gain.value=.0;this.amb.connect(this.master);const ws=ac.createBufferSource();ws.buffer=b;ws.loop=true;const wf=ac.createBiquadFilter();wf.type='bandpass';wf.frequency.value=420;wf.Q.value=.7;const wg=ac.createGain();wg.gain.value=.22;ws.connect(wf);wf.connect(wg);wg.connect(this.amb);ws.start();
  const lfo=ac.createOscillator();lfo.frequency.value=.07;const lg=ac.createGain();lg.gain.value=260;lfo.connect(lg);lg.connect(wf.frequency);lfo.start();const lfo2=ac.createOscillator();lfo2.frequency.value=.11;const lg2=ac.createGain();lg2.gain.value=.12;lfo2.connect(lg2);lg2.connect(wg.gain);lfo2.start();
  this.drone=ac.createGain();this.drone.gain.value=0;this.drone.connect(this.mus);const df=ac.createBiquadFilter();df.type='lowpass';df.frequency.value=260;df.Q.value=2;df.connect(this.drone);this.droneF=df;for(const f of[55,55.4,82.4,110.3]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;const g=ac.createGain();g.gain.value=.12;o.connect(g);g.connect(df);o.start();}
  this.timer=setInterval(()=>this.tick(),120);}catch(e){this.ac=null;}}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 ambience(on,tension=0,dawn=0){if(!this.ac)return;const t=this.ac.currentTime;this.amb.gain.setTargetAtTime(on?.5:0,t,.8);this.drone.gain.setTargetAtTime(on?.05+tension*.22:0,t,1.2);this.droneF.frequency.setTargetAtTime(180+tension*500,t,1);this.dawn=dawn;this.ambOn=on;}
 muffle(on){if(!this.ac)return;this.duck.frequency.setTargetAtTime(on?650:20000,this.ac.currentTime,.25);}
 listener(x,y,z,yaw){this.cam.x=x;this.cam.y=y;this.cam.z=z;this.cam.yaw=yaw;}
 at(p){if(!p)return[1,0];const c=this.cam;const dx=p.x-c.x,dz=p.z-c.z;const d=Math.hypot(dx,dz)||1;const rx=Math.cos(c.yaw),rz=-Math.sin(c.yaw);return[1/(1+Math.max(0,d-2)/7),(dx*rx+dz*rz)/d];}
 tick(){if(!this.ac||!this.ambOn)return;// crickets, owl, distant howls
  if(R()<.35*(1-this.dawn))this.cricket();if(R()<.008)this.owl();if(this.dawn>.3&&R()<.25*this.dawn)this.bird();}
 /* ---------- primitives ---------- */
 _out(pan,bus){bus=bus||this.sfx;if(!pan)return bus;const s=this.ac.createStereoPanner();s.pan.value=Math.max(-1,Math.min(1,pan));s.connect(bus);return s;}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0,rev=0,bus){if(!this.ac||vol<.002)return;const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(g);g.connect(this._out(pan,bus));if(rev){const r=ac.createGain();r.gain.value=rev;g.connect(r);r.connect(this.verbIn);}s.start(t,R()*1.5);s.stop(t+dur+.02);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0,rev=0,bus,atk=.004){if(!this.ac||vol<.002)return;const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+atk);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  o.connect(g);g.connect(this._out(pan,bus));if(rev){const r=ac.createGain();r.gain.value=rev;g.connect(r);r.connect(this.verbIn);}o.start(t);o.stop(t+dur+.03);}
 note(semi,dur,vol,delay=0,type='triangle',base=110,bus){const f=base*Math.pow(2,semi/12);this._o(type,f,f*.998,dur,vol,delay,0,.5,bus||this.mus,.01);}
 /* ---------- weapons ---------- */
 shot(kind,up){if(!this.ac)return;const u=up?1.15:1;
  const P={pistol:[.16,.5,2400,.32,140],smg:[.11,.42,2800,.25,170],shotgun:[.42,.8,1800,.5,90],rifle:[.18,.55,2600,.34,120],lmg:[.2,.62,2200,.36,100],revolver:[.5,.85,1600,.55,80],double:[.5,.9,1500,.6,75],launcher:[.3,.5,700,.3,70],volt:[.4,.4,5000,.2,300]}[kind]||[.15,.5,2400,.3,140];
  const[dur,vol,f,body,thump]=P;if(kind==='volt'){this._n(.35,6000,1200,2,.45*u,'bandpass',0,0,.6);this._o('sawtooth',880,110,.3,.18,0,0,.4);this._o('square',1760,220,.12,.1);return;}
  this._n(dur,f,180,.7,vol*u,'lowpass',0,0,.55);this._n(.05,6000,2000,.5,vol*.6,'highpass');this._o('sine',thump,35,dur*.8,body*u);if(kind==='launcher')this._o('sine',220,60,.2,.4);}
 allyShot(p){const[a,pan]=this.at(p);this._n(.15,2200,200,.7,.32*a,'lowpass',0,pan,.5);this._o('sine',120,40,.12,.18*a,0,pan);}
 dry(){this._o('square',1800,1500,.03,.08);}
 reload(stage){if(stage===0){this._o('square',600,300,.05,.07);this._n(.06,3000,1000,3,.12,'bandpass');}else if(stage===1){this._o('square',900,500,.05,.1);this._n(.05,4000,1500,3,.15,'bandpass',.03);}else if(stage===2){this._n(.08,2500,600,2,.18,'bandpass');this._o('square',1200,800,.04,.08,.05);}else{this._n(.06,1800,700,4,.12,'bandpass');}}
 swap(){this._n(.12,2200,800,2,.1,'bandpass');}
 knife(hit){this._n(.16,5000,1500,1.5,.18,'bandpass');if(hit){this._o('sine',160,60,.12,.35);this._n(.1,800,200,1,.3);}}
 hitmark(kind){if(kind==='head'){this._o('triangle',1700,1650,.09,.16);this._o('sine',3400,3300,.05,.06);}else if(kind==='kill'){this._o('sine',220,70,.14,.3);this._n(.08,1200,300,1,.18);}else if(kind==='armor'){this._o('square',2600,2200,.06,.08);this._o('triangle',1300,1250,.15,.1);}else this._o('triangle',1100,1000,.04,.07);}
 clang(p){const[a,pan]=this.at(p);this._o('triangle',1400,1350,.5,.22*a,0,pan,.4);this._o('square',2900,2800,.2,.05*a,0,pan);}
 explode(p,s=1){const[a,pan]=this.at(p);this._n(1.4,1400,60,.6,.9*a*s,'lowpass',0,pan,.8);this._o('sine',90,25,.9,.8*a*s,0,pan);this._n(.2,5000,800,.5,.3*a,'highpass',0,pan);}
 pin(){this._o('square',2400,2200,.03,.06);this._o('square',1800,1700,.04,.05,.06);}
 throw(){this._n(.2,1200,300,1,.15,'bandpass');}
 zap(p){const[a,pan]=this.at(p);this._n(.2,7000,2000,3,.25*a,'bandpass',0,pan);this._o('sawtooth',1200,300,.15,.08*a,0,pan);}
 /* ---------- undead ---------- */
 groan(p,type,gait){if(!this.ac)return;const[a,pan]=this.at(p);if(a<.08)return;const ac=this.ac,t=ac.currentTime,dur=type==='boss'?1.8:gait===2?.6+R()*.3:.9+R()*.8;const base=type==='boss'?55:type==='brute'?75:gait===2?150+R()*60:95+R()*45;
  const o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(base,t);o.frequency.linearRampToValueAtTime(base*(gait===2?1.5:.75),t+dur);const vib=ac.createOscillator();vib.frequency.value=5+R()*4;const vg=ac.createGain();vg.gain.value=base*.06;vib.connect(vg);vg.connect(o.frequency);
  const f1=ac.createBiquadFilter();f1.type='bandpass';f1.Q.value=6;f1.frequency.setValueAtTime(500+R()*200,t);f1.frequency.linearRampToValueAtTime(350+R()*500,t+dur);const f2=ac.createBiquadFilter();f2.type='bandpass';f2.Q.value=5;f2.frequency.value=1100+R()*500;
  const g=ac.createGain();const v=(type==='boss'?.55:.28)*a;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.12);g.gain.setValueAtTime(v,t+dur*.6);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  const ws=ac.createWaveShaper();ws.curve=this.curve;o.connect(ws);ws.connect(f1);ws.connect(f2);f1.connect(g);const g2=ac.createGain();g2.gain.value=.5;f2.connect(g2);g2.connect(g);g.connect(this._out(pan));const rv=ac.createGain();rv.gain.value=.3;g.connect(rv);rv.connect(this.verbIn);
  o.start(t);vib.start(t);o.stop(t+dur+.05);vib.stop(t+dur+.05);this._n(dur*.8,900,400,1.5,.05*a,'bandpass',0,pan);}
 bossRoar(p){const[a,pan]=this.at(p);this.groan(p,'boss',0);this._n(1.4,600,80,1,.5*a,'lowpass',0,pan,.6);this._o('sawtooth',70,40,1.4,.25*a,0,pan,.5);}
 whiff(p){const[a,pan]=this.at(p);this._n(.18,2500,600,1.2,.12*a,'bandpass',0,pan);}
 swipe(){this._n(.15,1800,300,1,.4);this._o('sine',110,45,.25,.5);}
 hurt(k){this._o('sine',150,60,.25,.4*k);this._n(.25,800,150,1,.3*k);}
 tear(p){const[a,pan]=this.at(p);this._n(.25,1400,300,2.5,.45*a,'bandpass',0,pan,.3);this._o('square',180,90,.08,.1*a,0,pan);this._n(.08,4000,1500,4,.2*a,'bandpass',.02,pan);}
 board(p){const[a,pan]=this.at(p);this._o('sine',240,120,.08,.35*a,0,pan);this._n(.06,2400,900,3,.25*a,'bandpass',0,pan);this._o('sine',260,130,.06,.25*a,.12,pan);}
 thud(p){const[a,pan]=this.at(p);this._o('sine',90,40,.2,.3*a,0,pan);this._n(.15,500,120,1,.2*a,'lowpass',0,pan);}
 slam(p){const[a,pan]=this.at(p);this._n(1,900,50,.7,.9*a,'lowpass',0,pan,.7);this._o('sine',60,22,.8,.9*a,0,pan);}
 /* ---------- economy + world ---------- */
 buy(){this.note(19,.18,.16,0,'triangle',220,this.sfx);this.note(24,.3,.16,.08,'triangle',220,this.sfx);this._n(.05,6000,3000,3,.1,'bandpass');}
 deny(){this._o('square',140,130,.18,.1);this._o('square',120,110,.18,.08,.05);}
 points(){this._o('triangle',2200,2200,.03,.03);}
 door(){this._n(.9,500,90,1,.5,'lowpass',0,0,.5);for(let k=0;k<5;k++)this._n(.1,2000+R()*1500,600,4,.18,'bandpass',k*.09+R()*.04);this._o('sine',70,40,.6,.3);}
 power(){this._o('sine',50,48,.6,.6);this._n(.5,300,60,1,.6,'lowpass',0,0,.6);const ac=this.ac;if(!ac)return;const t=ac.currentTime;const o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(30,t+.2);o.frequency.exponentialRampToValueAtTime(120,t+2.2);const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=400;const g=ac.createGain();g.gain.setValueAtTime(0,t+.2);g.gain.linearRampToValueAtTime(.15,t+1.4);g.gain.exponentialRampToValueAtTime(.001,t+3.2);o.connect(f);f.connect(g);g.connect(this.sfx);o.start(t+.2);o.stop(t+3.3);
  [0,7,12,16].forEach((s,i)=>this.note(s,1.6,.08,1+i*.15,'sawtooth',110));}
 perk(id){const m={hide:[0,4,7,12,7,12,16],hand:[12,14,16,19,21,24],wind:[7,11,14,19,14,19,23],fang:[0,7,3,10,7,15]}[id]||[0,4,7];m.forEach((s,i)=>this.note(s,.22,.13,i*.09,'square',220,this.sfx));this._n(.4,800,200,2,.15,'bandpass',.7);}
 gulp(){for(let k=0;k<3;k++)this._o('sine',300,160,.09,.2,k*.16);}
 crateOpen(){this._n(.4,600,200,2,.25,'bandpass');this._o('triangle',220,200,.6,.12,0,0,.4);}
 boxTune(){BOX_TUNE.forEach((s,i)=>{this.note(s+12,.35,.07,i*.2,'sine',220);this.note(s+24,.12,.025,i*.2,'sine',220);});}
 crateBye(){[0,-1,-5,-12].forEach((s,i)=>this.note(s,1.2,.18,i*.35,'sawtooth',110));this.owl();}
 forge(){for(let k=0;k<5;k++){this._o('triangle',1500+R()*300,1400,.35,.2,k*.42,0,.4);this._n(.1,4000,1200,2,.2,'bandpass',k*.42);}this._n(1.2,3000,400,1,.25,'highpass',2.1);}
 powerup(){[0,5,9,12,17].forEach((s,i)=>this.note(s+12,.25,.09,i*.06,'triangle',220,this.sfx));}
 pickup(kind){const m={ammo:[0,4,7,12,16],double:[0,12,0,12,24],insta:[0,-1,0,-1,12,11],nuke:[0,7,12,19,24],board:[0,5,7,12]}[kind]||[0,4,7];m.forEach((s,i)=>this.note(s,.3,.14,i*.08,'sawtooth',165,this.sfx));if(kind==='nuke'){this.explode(this.cam,1.4);}}
 roundStart(n){ROUND_START.forEach((s,i)=>this.note(s,.9,.12,i*.28,'sawtooth',110));[0,-12].forEach((s,i)=>this.bell(s,i*1.1));if(n%5===0)this._n(3,200,40,.5,.3,'lowpass',.5,0,.8);}
 roundEnd(){ROUND_END.forEach((s,i)=>this.note(s,.6,.1,i*.22,'triangle',110));}
 bell(semi,delay=0){const f=110*Math.pow(2,semi/12);for(const[m,v]of[[1,.25],[2.76,.08],[5.4,.04],[.5,.12]])this._o('sine',f*m,f*m*.995,3.5,v,delay,0,.8,this.mus,.002);}
 heartbeat(){this._o('sine',60,40,.12,.35);this._o('sine',55,38,.12,.25,.18);}
 down(){this._o('sawtooth',220,55,1.4,.25,0,0,.6);this._n(1,500,80,1,.3,'lowpass');}
 revive(){[0,4,7,12].forEach((s,i)=>this.note(s+12,.25,.12,i*.07,'triangle',220,this.sfx));}
 dawnRise(){DAWN.forEach((s,i)=>this.note(s,2.5,.09,i*.3,'triangle',110));}
 lose(){[0,-2,-5,-9,-12].forEach((s,i)=>this.note(s,1.4,.14,i*.4,'sawtooth',110));this.bell(-12,0);}
 cricket(){const[a,pan]=[.5,R()*2-1];const f=4200+R()*800;for(let k=0;k<3+(R()*3|0);k++)this._o('sine',f,f*.98,.03,.012*a,k*.06,pan,0,this.amb);}
 owl(){const p=R()*2-1;this._o('sine',420,380,.35,.04,0,p,.5,this.amb);this._o('sine',400,360,.6,.04,.45,p,.5,this.amb);}
 bird(){const p=R()*2-1,f=2400+R()*1500;for(let k=0;k<3;k++)this._o('sine',f,f*1.3,.07,.03,k*.1,p,.2,this.amb);}
}
