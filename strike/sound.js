// STRIKE ZONE — synthesized audio (WebAudio only): layered gun reports with distance filtering and panning, reload foley,
// footsteps, hit / headshot / kill confirms, explosions, movement, pickups, announcer stingers and a driving procedural score.
import {boot,master,gain,noiseBuf,reverb,panTo,tone,hiss} from '../js/kit3d/audio.js';
const R=Math.random;
const RIFFS=[{g:'x.xxx.xx3-1-x.x6',k:'x.xxx.xxx.x.x.xx',s:'....x.......x...'},{g:'x.xxx.xxx.xx5-6-',k:'xxxxxxxxxxxxxxxx',s:'....x.......x...'},{g:'0---x.x.3---x.x.',k:'x...x.x.x...x.x.',s:'....x.......x...'},
 {g:'5---x.x.6-5-3-1-',k:'x...x.x.x.x.x.x.',s:'....x.......x..x'},{g:'x..xx..xx.x.a-8-',k:'x..xx..xx.x.x.x.',s:'........x.......'},{g:'x..xx..x3-1-0---',k:'x..xx..xx...x...',s:'........x.......'}];
const SONG=[0,0,1,1,2,3,2,3,0,1,4,5,4,5],HOT=[4,5,4,5,1,1,3,3];
// gun recipes: crack (bandpass noise), body (lowpass noise), thump (sine sweep), tail (reverb), mech (click)
const GUN={rifle:{c:[3600,1500,.08,.55],b:[1900,240,.2,.75],t:[150,48,.13,.65],rev:true},smg:{c:[4200,2000,.05,.42],b:[2400,380,.12,.5],t:[180,70,.08,.42],rev:true},
 lmg:{c:[3000,1300,.09,.6],b:[1600,200,.24,.82],t:[130,42,.16,.75],rev:true},pistol:{c:[3900,1800,.06,.48],b:[2100,320,.14,.55],t:[190,60,.1,.5],rev:true},
 revolver:{c:[3000,1100,.1,.7],b:[1500,150,.32,.95],t:[110,36,.22,.9],rev:true},shotgun:{c:[2600,900,.1,.65],b:[1300,90,.45,1.1],t:[95,30,.3,1],rev:true},
 sniper:{c:[4800,1400,.12,.8],b:[1400,110,.55,1.05],t:[90,28,.38,1],rev:true},rl:{c:[1400,500,.15,.5],b:[900,140,.6,.8],t:[70,30,.4,.7],rev:true}};
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.musVol=.35;this.intensity=0;this.s16=0;this.bar=0;this.nextT=0;this.cam={x:0,y:0,z:0,yaw:0};this.lastStep=0;}
 init(){boot(this,ac=>{this.master=master(ac,this.vol,-12,4);this.sfx=gain(ac,1,this.master);this.mus=gain(ac,this.musVol,this.master);
  this.noise=noiseBuf(ac);this.verbIn=reverb(ac,1.6,2.8,.28,this.sfx);
  const curve=new Float32Array(2048);for(let i=0;i<2048;i++){const x=i/1024-1;curve[i]=Math.tanh(x*26)*.9;}this.amp=[0,1].map(k=>{const ws=ac.createWaveShaper();ws.curve=curve;ws.oversample='2x';const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=90;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3400;const pan=ac.createStereoPanner();pan.pan.value=k?.6:-.6;const g=ac.createGain();g.gain.value=.14;ws.connect(hp);hp.connect(lp);lp.connect(g);g.connect(pan);pan.connect(this.mus);return{ws,lp};});
  this.drone=ac.createGain();this.drone.gain.value=0;this.drone.connect(this.mus);const df=ac.createBiquadFilter();df.type='lowpass';df.frequency.value=300;df.connect(this.drone);for(const f of[41.2,41.7,61.7]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(df);o.start();}
  this.timer=setInterval(()=>this.schedule(),30);});}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 setMusic(v){this.musVol=v;if(this.mus)this.mus.gain.setTargetAtTime(v,this.ac.currentTime,.2);}
 music(level){if(this.intensity===level)return;const was=this.intensity;this.intensity=level;if(!this.ac)return;const t=this.ac.currentTime;this.drone.gain.setTargetAtTime(level===1?.45:level===0?.2:.1,t,.8);if(level>=2&&was<2){this.bar=0;this.s16=0;this.nextT=t+.05;this.crash(this.nextT,.45);}}
 listener(x,y,z,yaw){this.cam.x=x;this.cam.y=y;this.cam.z=z;this.cam.yaw=yaw;}
 at(p){if(!p)return[0,0];const c=this.cam;const dx=p.x-c.x,dz=p.z-c.z,dy=(p.y||0)-c.y;const d=Math.hypot(dx,dy,dz)||1;const rx=Math.cos(c.yaw),rz=-Math.sin(c.yaw);return[d,(dx*rx+dz*rz)/d];}
 att(d,ref=10){return 1/(1+Math.max(0,d-2)/ref);}
 _out(pan,bus){return panTo(this.ac,pan,bus||this.sfx);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0,rev=false,bus,at){if(vol<.003)return;const g=hiss(this.ac,this.noise,this._out(pan,bus),(at??this.ac.currentTime)+delay,dur,f0,f1,q,vol,type);if(rev)g.connect(this.verbIn);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0,rev=false,bus,at,atk=.003){if(vol<.003)return;const g=tone(this.ac,this._out(pan,bus),(at??this.ac.currentTime)+delay,type,f0,f1,dur,vol,atk);if(rev)g.connect(this.verbIn);}
 /* ---------- music ---------- */
 schedule(){if(!this.ac||this.intensity<2)return;const ac=this.ac;const bpm=this.intensity>=3?178:164,s16=60/bpm/4;if(this.nextT<ac.currentTime)this.nextT=ac.currentTime+.02;
  while(this.nextT<ac.currentTime+.14){const song=this.intensity>=3?HOT:SONG;const rf=RIFFS[song[this.bar%song.length]];this.playStep(rf,this.s16,this.nextT,s16);this.nextT+=s16;this.s16++;if(this.s16>=16){this.s16=0;this.bar++;if(this.bar%4===0)this.crash(this.nextT,.3);}}}
 playStep(rf,i,t,s16){const ch=rf.g[i];const E=82.41;if(ch==='x'){this.guitar(E,t,s16*.9,true);this.bass(E/2,t,s16*.9);}else if(ch!=='-'&&ch!=='.'){const n=parseInt(ch,16);let len=1;while(rf.g[i+len]==='-'&&i+len<16)len++;const f=E*Math.pow(2,n/12);this.guitar(f,t,s16*len*.98,false);this.bass(f/2,t,s16*len*.95);}
  if(rf.k[i]==='x')this.kick(t);if(rf.s[i]==='x')this.snare(t);if(i%2===0)this.hat(t,i%4===0?.04:.025);}
 guitar(f,t,dur,mute){const ac=this.ac;for(let k=0;k<2;k++){const amp=this.amp[k];const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(mute?.5:.38,t+.004);g.gain.setTargetAtTime(mute?0:.28,t+.01,mute?.05:dur*.8);g.gain.setTargetAtTime(0,t+dur,.03);
   for(const m of mute?[1,2]:[1,1.498,2]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f*m*(1+(k?.003:-.003));o.connect(g);o.start(t);o.stop(t+dur+.12);}g.connect(amp.ws);amp.lp.frequency.setValueAtTime(mute?1500:3400,t);}}
 bass(f,t,dur){const ac=this.ac,o=ac.createOscillator(),lp=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=f;lp.type='lowpass';lp.frequency.value=380;g.gain.setValueAtTime(.2,t);g.gain.setTargetAtTime(0,t+dur*.8,.04);o.connect(lp);lp.connect(g);g.connect(this.mus);o.start(t);o.stop(t+dur+.1);}
 kick(t){this._o('sine',140,42,.16,.7,0,0,false,this.mus,t,.002);this._n(.012,3000,1500,1,.1,'bandpass',0,0,false,this.mus,t);}
 snare(t){this._n(.16,2400,900,.7,.28,'bandpass',0,0,false,this.mus,t);this._o('triangle',220,160,.08,.16,0,0,false,this.mus,t);}
 hat(t,v){this._n(.035,9000,7000,1,v,'highpass',0,.25,false,this.mus,t);}
 crash(t,v){this._n(1.4,7000,4000,.5,v*.5,'highpass',0,-.2,false,this.mus,t);this._n(1.2,6000,3500,.5,v*.4,'highpass',0,.3,false,this.mus,t);}
 /* ---------- weapons ---------- */
 shot(cls,p,me){if(!this.ac)return;const r=GUN[cls];if(!r){this.knife(false,p,me);return;}let a=1,pan=0,far=1;if(!me){const[d,pn]=this.at(p);a=this.att(d,14)*.85;pan=pn;far=Math.max(.18,1-d/90);if(a<.03)return;}
  const v=(R()*.1+.95);this._n(r.c[2],r.c[0]*far*v,r.c[1]*far,1.1,r.c[3]*a*(me?1:.8),'bandpass',0,pan);this._n(r.b[2]*(me?1:1.25),r.b[0]*far,r.b[1],.7,r.b[3]*a,'lowpass',0,pan,r.rev);this._o('sine',r.t[0]*v,r.t[1],r.t[2],r.t[3]*a*(me?1:.6),0,pan);
  if(me&&cls!=='rl')this._n(.035,7000,4500,2,.1,'bandpass',.015);if(!me&&a<.3)this._n(.6,700,200,.6,.12*a*4,'lowpass',.05,pan,true);if(cls==='rl')this._n(.7,500,2400,1.4,.25*a,'bandpass',.04,pan,true);}
 dry(){if(this.ac)this._o('square',1300,1100,.025,.08);}
 reload(k){if(!this.ac)return;if(k==='magout'){this._n(.05,3000,1800,2.5,.22,'bandpass');this._n(.08,900,500,2,.12,'bandpass',.05);}else if(k==='magin'){this._n(.04,2400,1500,2.5,.28,'bandpass');this._o('square',260,200,.03,.07,.01);}
  else if(k==='bolt'){this._n(.06,2600,1400,3,.22,'bandpass');this._n(.06,1800,1000,3,.2,'bandpass',.14);}else if(k==='pump'){this._n(.08,1400,700,2,.3,'bandpass');this._n(.07,2000,900,2,.3,'bandpass',.16);}
  else if(k==='shell'){this._n(.04,3000,2000,3,.18,'bandpass');this._o('triangle',900,700,.03,.05,.01);}else if(k==='cyl'){this._n(.05,3200,2400,4,.18,'bandpass');}else if(k==='rocket'){this._n(.18,600,300,1.5,.25,'bandpass');this._o('square',150,110,.06,.06,.12);}
  else if(k==='draw'){this._n(.07,2600,1300,3,.12,'bandpass');this._n(.05,1600,900,3,.1,'bandpass',.08);}}
 knife(hit,p,me=true){if(!this.ac)return;const[d,pan]=me?[0,0]:this.at(p);const a=me?1:this.att(d,6);this._n(.12,1800,5000,1.5,.18*a,'bandpass',0,pan);if(hit){this._n(.1,900,200,1,.4*a,'lowpass',.04,pan);this._o('sine',160,60,.1,.3*a,.04,pan);}}
 whiz(pan){if(this.ac){this._n(.12,4500,1800,4,.12,'bandpass',0,pan);}}
 boom(p,big=1){if(!this.ac)return;const[d,pan]=this.at(p);const a=this.att(d,16)*big;this._n(1.4,1800,40,.6,.95*a,'lowpass',0,pan,true);this._o('sine',75,24,1.1,.85*a,0,pan);this._n(.25,5000,700,.6,.35*a,'lowpass',0,pan);}
 impact(p,metal){if(!this.ac)return;const[d,pan]=this.at(p);if(d>30)return;const a=this.att(d,5);if(metal){this._o('triangle',2400+R()*1800,1600,.06,.05*a,0,pan);this._n(.04,5000,3000,4,.06*a,'bandpass',0,pan);}else this._n(.05,1800,500,1.5,.09*a,'bandpass',0,pan);}
 bounce(p){if(!this.ac)return;const[d,pan]=this.at(p);const a=this.att(d,6);this._o('triangle',1400,900,.06,.12*a,0,pan);}
 throwIt(){if(this.ac){this._n(.2,700,2400,1,.15,'bandpass');}}
 /* ---------- feedback ---------- */
 hit(kind){if(!this.ac)return;if(kind==='head'){this._o('triangle',2800,2600,.12,.18);this._o('sine',4200,4000,.08,.08,.01);}else if(kind==='kill'){this._o('square',880,880,.06,.1);this._o('square',1320,1320,.12,.1,.06);this._n(.15,1200,200,.8,.2,'lowpass');}else this._o('triangle',1500,1300,.04,.1);}
 hurt(v){if(this.ac){this._n(.22,500,90,.7,.45*v,'lowpass');this._o('sawtooth',140,70,.16,.12*v);}}
 death(){if(!this.ac)return;this._o('sawtooth',220,40,1.2,.25,0,0,true);this._n(1.2,1200,60,.5,.35,'lowpass',0,0,true);}
 step(p,me,surf){if(!this.ac)return;let a=.16,pan=0;if(!me){const[d,pn]=this.at(p);if(d>26)return;a=.26*this.att(d,4);pan=pn;}const metal=surf==='metal';this._n(.06,metal?2400:1200,metal?1400:300,metal?3:1.2,a,'bandpass',0,pan);if(metal)this._o('triangle',700+R()*300,500,.05,a*.3,0,pan);}
 jump(){if(this.ac)this._n(.1,900,400,1,.09,'bandpass');}
 land(v){if(this.ac){this._n(.14,700,120,.8,.22*v,'lowpass');}}
 slide(){if(this.ac){this._n(.5,1600,500,.7,.2,'bandpass');}}
 pad(){if(this.ac){this._o('sine',220,880,.45,.22,0,0,true);this._n(.3,600,3000,1,.18,'bandpass');}}
 pickup(k){if(!this.ac)return;if(k==='hp'){this._o('sine',660,990,.12,.14);this._o('sine',990,1320,.1,.1,.06);}else if(k==='rl'){[0,.08,.16].forEach((dd,i)=>this._o('sawtooth',220*Math.pow(1.26,i),220*Math.pow(1.26,i),.25,.1,dd,0,true));}else{this._n(.06,2600,1800,3,.15,'bandpass');this._o('square',600,600,.04,.05,.05);}}
 spawn(){if(this.ac){this._o('sine',300,900,.35,.12,0,0,true);this._n(.4,6000,900,.6,.12,'highpass',0,0,true);}}
 beep(hi){if(this.ac)this._o('square',hi?1320:880,hi?1320:880,hi?.3:.12,.1);}
 click(){if(this.ac)this._o('triangle',1800,1600,.03,.06);}
 streak(n){if(!this.ac)return;const base=[0,330,392,440,494,523,587][Math.min(6,n)]||587;[0,.09,.18].forEach((d,i)=>this._o('sawtooth',base*Math.pow(1.335,i),base*Math.pow(1.335,i),.22,.08,d,0,true));}
 sting(win){if(!this.ac)return;const seq=win?[262,330,392,523]:[392,330,262,196];seq.forEach((f,i)=>this._o('sawtooth',f,f,.5,.11,i*.14,0,true));}}
