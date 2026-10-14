// HALCYON HEIST — synthesized audio (no files): guns (incl. suppressed), footsteps, glass, drill, alarm bell, sirens, pagers,
// shouts, cash and bag foley, suspicion ticks, assault stingers and a small sequenced heist score (stealth pulse / loud drive).
const SHOT={pistol:{f0:1500,f1:220,d:.16,v:.5,b:120,bd:.12,c:2600},silenced:{f0:900,f1:300,d:.07,v:.22,b:90,bd:.05,c:1800},smg:{f0:1900,f1:300,d:.11,v:.42,b:150,bd:.08,c:3000},
 rifle:{f0:1500,f1:180,d:.2,v:.6,b:100,bd:.15,c:2400},shotgun:{f0:900,f1:90,d:.34,v:.85,b:65,bd:.25,c:1500},heavy:{f0:1100,f1:120,d:.28,v:.75,b:85,bd:.2,c:1900}};
import {boot,master,gain,noiseBuf,reverb,bed,panTo,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.music=.6;this.mode=null;this.beat=0;this.nextT=0;}
 init(){boot(this,ac=>{this.master=master(ac,this.vol,-16,5);this.duck=gain(ac,1,this.master);this.out=this.duck;this.mus=gain(ac,this.music*.5,this.master);
  const b=this.noise=noiseBuf(ac);this.verbIn=reverb(ac,1.6,3,.3,this.out);
  const a=bed(ac,b,'lowpass',380,null,this.master);this.ambF=a.f;this.amb=a.g;this.rainG=bed(ac,b,'highpass',2600,null,this.master,0,.7).g;
  // alarm bell + siren oscillators (gated)
  this.bell=ac.createOscillator();this.bell.type='square';this.bell.frequency.value=1650;this.bellAM=ac.createGain();this.bellAM.gain.value=0;const bf=ac.createBiquadFilter();bf.type='bandpass';bf.frequency.value=1700;bf.Q.value=3;this.bell.connect(bf);bf.connect(this.bellAM);this.bellAM.connect(this.master);this.bell.start();
  this.siren=ac.createOscillator();this.siren.type='sawtooth';this.siren.frequency.value=700;this.sirenG=ac.createGain();this.sirenG.gain.value=0;const sf=ac.createBiquadFilter();sf.type='lowpass';sf.frequency.value=1400;this.siren.connect(sf);sf.connect(this.sirenG);this.sirenG.connect(this.master);this.siren.start();
  this.drillO=ac.createOscillator();this.drillO.type='sawtooth';this.drillO.frequency.value=180;this.drillG=ac.createGain();this.drillG.gain.value=0;const df=ac.createBiquadFilter();df.type='bandpass';df.frequency.value=900;df.Q.value=1.2;this.drillO.connect(df);df.connect(this.drillG);this.drillG.connect(this.out);this.drillO.start();this.drillPan=null;
  });}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 ambience(mood,on){if(!this.ac)return;const t=this.ac.currentTime;this.mood=mood;this.amb.gain.setTargetAtTime(on?.05:0,t,.6);this.rainG.gain.setTargetAtTime(on&&mood==='night'?.04:0,t,.6);}
 _pan(p){return panTo(this.ac,p,this.out);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0,rev=false,dest){if(vol<.0015)return;const g=hiss(this.ac,this.noise,dest||this._pan(pan),this.ac.currentTime+delay,dur,f0,f1,q,vol,type);if(rev)g.connect(this.verbIn);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0,rev=false,dest,at=.005){if(vol<.0015)return;const g=tone(this.ac,dest||this._pan(pan),this.ac.currentTime+delay,type,f0,f1,dur,vol,at);if(rev)g.connect(this.verbIn);}
 att(d,ref=8){return 1/(1+Math.max(0,d-2)/ref);}
 shot(kind,d=0,pan=0,mine=false){if(!this.ac)return;const s=SHOT[kind]||SHOT.rifle;const now=this.ac.currentTime;if(!mine){if(d>120||now-(this._ls||0)<.025)return;this._ls=now;}
  const a=mine?1:this.att(d,10)*.9,far=Math.min(1,d/60);const v=s.v*a;
  this._n(s.d*(1+far*.6),s.f0*(1-far*.6),s.f1,.8,v*.9,'lowpass',0,pan,kind!=='silenced');this._n(.03,s.c,s.c*.6,1.4,v*.5*(1-far),'bandpass',0,pan);this._o('sine',s.b*1.6,s.b*.6,s.bd,v*.7,0,pan);
  if(kind==='silenced')this._n(.04,4000,2500,2,v*.5,'bandpass',0,pan);if(far>.3)this._n(.5,600,120,.5,v*.25,'lowpass',.05+far*.2,pan,true);}
 dry(){if(!this.ac)return;this._o('square',1800,1600,.02,.05);this._n(.02,4000,3000,2,.06,'bandpass');}
 step(vol=1,pan=0,surf='stone'){if(!this.ac)return;const f=surf==='metal'?1600:surf==='carpet'?500:surf==='wood'?800:1100;this._n(.07,f,f*.4,1.2,.09*vol*(surf==='carpet'?.5:1),'bandpass',0,pan);this._o('sine',90,60,.05,.04*vol,0,pan);if(this.mood==='night'&&surf==='wet')this._n(.06,2400,1200,1,.04*vol,'bandpass',.01,pan);}
 land(v=1){if(!this.ac)return;this._n(.12,700,150,.8,.18*v,'lowpass');}
 reload(part){if(!this.ac)return;if(part==='out'){this._n(.05,2200,1400,3,.12,'bandpass');this._o('square',300,200,.03,.03);}else if(part==='in'){this._n(.04,1800,900,3,.16,'bandpass');this._o('square',500,300,.025,.05,.0);this._n(.03,3000,2000,4,.1,'bandpass',.06);}
  else if(part==='shell'){this._n(.05,1600,1000,3,.13,'bandpass');}else if(part==='pump'){this._n(.07,900,500,2,.2,'bandpass');this._n(.06,1300,800,2,.18,'bandpass',.11);}else if(part==='draw'){this._n(.08,2400,1200,2,.08,'bandpass');}}
 hit(kind){if(!this.ac)return;if(kind==='hs'){this._o('triangle',2900,2700,.14,.16);this._o('sine',5200,5000,.08,.08);}else if(kind==='armor'){this._o('triangle',1500,1300,.06,.08);this._n(.04,3000,2000,3,.06,'bandpass');}else if(kind==='kill'){this._o('sine',880,880,.08,.1);this._o('sine',1320,1320,.12,.1,.07);}else if(kind==='shield'){this._o('triangle',2200,1800,.08,.1);this._n(.05,4000,2500,3,.1,'bandpass');}else this._n(.05,500,200,1,.18,'lowpass');}
 hurt(v=1){if(!this.ac)return;this._n(.18,400,90,.7,.35*v,'lowpass');this._o('sine',120,60,.15,.12*v);}
 armorBreak(){if(!this.ac)return;this._n(.25,3000,600,1,.2,'bandpass');this._o('sawtooth',300,120,.25,.08);}
 throwIt(){if(!this.ac)return;this._n(.18,800,300,.6,.1,'bandpass');}
 boom(d=0,pan=0,big=1){if(!this.ac)return;const a=this.att(d,14);this._n(1.4*big,1600,40,.6,.9*a*big,'lowpass',0,pan,true);this._o('sine',70,24,1.2*big,.7*a,0,pan);this._n(.2,4000,800,.6,.3*a,'lowpass',0,pan);}
 glass(d=0,pan=0,big=1){if(!this.ac)return;const a=this.att(d,10)*big;this._n(.35,7000,2500,.8,.35*a,'highpass',0,pan,true);for(let i=0;i<6;i++)this._o('triangle',3000+Math.random()*4000,2000+Math.random()*2000,.12+Math.random()*.2,.05*a,.02+i*.04+Math.random()*.05,pan);this._n(.12,1200,400,1,.2*a,'lowpass',0,pan);}
 door(open){if(!this.ac)return;this._n(.18,open?600:400,open?300:200,1.5,.12,'bandpass');if(!open)this._n(.06,300,100,1,.2,'lowpass',.15);}
 pick(i){if(!this.ac)return;this._n(.025,5000+(i%3)*700,3000,6,.07,'bandpass');}
 card(ok){if(!this.ac)return;if(ok){this._o('square',1800,1800,.06,.05);this._o('square',2400,2400,.08,.05,.07);}else this._o('square',300,260,.2,.06);}
 cash(){if(!this.ac)return;this._n(.08,5000,3000,2,.08,'bandpass');[0,.06].forEach((d,i)=>this._o('triangle',1760+i*880,1760+i*880,.18,.07,d+.05));}
 bag(){if(!this.ac)return;this._n(.3,1500,500,1.2,.14,'bandpass');this._n(.12,3000,2000,3,.06,'bandpass',.18);}
 thud(d=0,pan=0){if(!this.ac)return;const a=this.att(d,6);this._n(.15,500,90,.8,.28*a,'lowpass',0,pan);}
 secured(){if(!this.ac)return;[0,.1,.2].forEach((d,i)=>this._o('triangle',660*(1+i*.25),660*(1+i*.25),.3,.09,d));}
 mask(){if(!this.ac)return;this._n(.4,500,2400,1,.12,'bandpass');this._o('sine',110,220,.45,.06);}
 shout(){if(!this.ac)return;const f=150+Math.random()*30;for(const[h,v]of[[1,.18],[2,.1],[3,.06]])this._o('sawtooth',f*h*1.1,f*h*.85,.32,v*.4,0,0,true,null,.02);this._n(.3,900,500,3,.12,'bandpass');}
 scream(d=0,pan=0){if(!this.ac)return;const a=this.att(d,8);const f=520+Math.random()*200;this._o('sawtooth',f,f*1.3,.5,.05*a,0,pan,true,null,.04);this._o('sine',f*2,f*2.4,.5,.04*a,0,pan);}
 suspicion(k){if(!this.ac)return;this._o('sine',600+k*900,600+k*900,.05,.035+k*.03);}
 detected(){if(!this.ac)return;[0,.12].forEach(d=>this._o('square',1400,1400,.09,.07,d));}
 pager(on){if(!this.ac)return;if(on)[0,.15,.3].forEach(d=>this._o('square',2600,2600,.08,.06,d));}
 phone(){if(!this.ac)return;for(let i=0;i<8;i++)this._o('sine',i%2?480:440,i%2?480:440,.05,.04,i*.05);}
 radio(){if(!this.ac)return;this._n(.3,2500,1800,2,.06,'bandpass');this._o('square',900,700,.05,.03,.25);}
 tie(){if(!this.ac)return;for(let i=0;i<5;i++)this._n(.025,4000,3000,5,.08,'bandpass',i*.05);}
 click(){if(!this.ac)return;this._o('square',2000,1800,.03,.04);}
 beep(){if(!this.ac)return;this._o('square',1200,1200,.06,.05);}
 deny(){if(!this.ac)return;this._o('square',220,180,.15,.06);}
 drillJam(){if(!this.ac)return;this._o('sawtooth',300,60,.5,.12);this._n(.3,800,200,1,.2,'lowpass');[0,.2,.4].forEach(d=>this._o('square',880,880,.1,.05,d+.5));}
 drillDone(){if(!this.ac)return;this._n(.6,600,80,1,.3,'lowpass',0,0,true);[0,.12,.24].forEach((d,i)=>this._o('triangle',523*(1+i*.26),523*(1+i*.26),.35,.1,d+.3));}
 vault(){if(!this.ac)return;this._n(2.2,300,40,.7,.5,'lowpass',0,0,true);this._o('sine',50,30,2,.3);for(let i=0;i<5;i++)this._n(.08,2000,800,3,.12,'bandpass',.2+i*.12);}
 // continuous drill whine: rate 0 = off; d/pan from listener
 drill(on,d=0,pan=0){if(!this.ac)return;const t=this.ac.currentTime;const a=on?this.att(d,7)*.08:0;this.drillG.gain.setTargetAtTime(a,t,.1);if(on)this.drillO.frequency.setTargetAtTime(170+Math.sin(t*7)*12,t,.05);}
 alarm(on){if(!this.ac)return;const t=this.ac.currentTime;this.alarmOn=on;if(!on){this.bellAM.gain.setTargetAtTime(0,t,.1);this.sirenG.gain.setTargetAtTime(0,t,.5);}}
 assault(){if(!this.ac)return;[0,.4,.8].forEach(d=>{this._o('sawtooth',220,220,.35,.07,d);this._o('sawtooth',330,330,.35,.05,d);});this._n(1.2,200,60,.6,.25,'lowpass',1.1,0,true);}
 sting(win){if(!this.ac)return;const n=win?[523,659,784,1046]:[440,392,330,262];n.forEach((f,i)=>{this._o('triangle',f,f,.35,.09,i*.14);this._o('sine',f/2,f/2,.4,.06,i*.14);});}
 setMusic(mode){this.mode=mode;}
 tick(dt,G){if(!this.ac)return;const t=this.ac.currentTime;
  if(this.alarmOn){const ph=(t*8)%1;this.bellAM.gain.setValueAtTime(ph<.5?.035:0,t);this.sirenG.gain.setTargetAtTime(G&&G.policeNear?.03:.012,t,.4);this.siren.frequency.setValueAtTime(650+Math.sin(t*2.2)*230,t);}
  if(this.mood==='night'&&Math.random()<dt*.02){this._n(2.6,300,40,.6,.08,'lowpass',0,Math.random()*2-1,true);}
  // sequenced score: 16th-note grid scheduled ahead of time
  if(!this.mode){this.nextT=0;return;}const bpm=this.mode==='loud'?128:this.mode==='assault'?136:92,sx=60/bpm/4;if(this.nextT<t)this.nextT=t+.05;
  while(this.nextT<t+.12){const b=this.beat++%64,at=this.nextT-t;const m=this.mode;const root=[55,55,49,52][(b>>4)%4];
   if(m==='stealth'){if(b%8===0)this._o('sine',root,root*.98,.5,.09,at,0,false,this.mus,.02);if(b%4===2)this._n(.03,8000,6000,4,.012,'highpass',at,0,false,this.mus);if(b%16===10)this._o('triangle',root*4,root*4,.6,.022,at,0,true,this.mus,.1);}
   else{if(b%4===0)this._o('sine',120,45,.18,.22,at,0,false,this.mus);if(b%8===4)this._n(.12,3000,900,.8,.11,'bandpass',at,0,true,this.mus);if(b%2===0)this._n(.025,9000,7000,3,.02,'highpass',at,0,false,this.mus);
    this._o('sawtooth',root*(b%3===0?2:1),root*(b%3===0?2:1),.1,.04,at,0,false,this.mus,.004);if(m==='assault'&&b%16===12)this._o('sawtooth',root*6,root*5.6,.3,.03,at,0,true,this.mus);}
   this.nextT+=sx;}}}
