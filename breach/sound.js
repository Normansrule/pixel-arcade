// BREACH POINT — synthesized audio (no files): weapons, footsteps, reloads, bomb, grenades, UI stingers, ambience beds.
import {boot,master,gain,noiseBuf,reverb,bed,panTo,tone,hiss} from '../js/kit3d/audio.js';
const SHOT={pistol:{f0:1500,f1:220,d:.16,v:.5,b:120,bd:.12,c:2600},heavy:{f0:1100,f1:120,d:.28,v:.75,b:85,bd:.2,c:1900},smg:{f0:1900,f1:300,d:.11,v:.42,b:150,bd:.08,c:3000},
 rifle:{f0:1500,f1:180,d:.2,v:.6,b:100,bd:.15,c:2400},rifle2:{f0:1150,f1:140,d:.24,v:.66,b:82,bd:.18,c:2000},shotgun:{f0:900,f1:90,d:.34,v:.85,b:65,bd:.25,c:1500},sniper:{f0:1300,f1:70,d:.55,v:.95,b:58,bd:.35,c:2200}};
export class Sound{
 constructor(){this.ac=null;this.vol=.8;}
 init(){boot(this,ac=>{this.master=master(ac,this.vol,-16,5);this.duck=gain(ac,1,this.master);this.out=this.duck;
  const b=this.noise=noiseBuf(ac);this.verbIn=reverb(ac,1.4,3,.25,this.out);
  // ambience bed (filtered noise): wind or rain
  ({f:this.ambF,g:this.amb}=bed(ac,b,'lowpass',400,null,this.master));({f:this.ringF,g:this.rainG}=bed(ac,b,'highpass',2500,null,this.master,0,.7));
  this.ring=ac.createOscillator();this.ring.frequency.value=3600;this.ringG=gain(ac,0,this.master);this.ring.connect(this.ringG);this.ring.start();});}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 ambience(mood,on){if(!this.ac)return;const t=this.ac.currentTime;this.mood=mood;this.amb.gain.setTargetAtTime(on?(mood==='noon'?.05:.07):0,t,.6);this.ambF.frequency.value=mood==='noon'?320:700;this.rainG.gain.setTargetAtTime(on&&mood==='dusk'?.035:0,t,.6);}
 tick(dt){if(!this.ac||!this.mood)return;if(this.mood==='noon'&&Math.random()<dt*.12)this._bird();if(this.mood==='dusk'&&Math.random()<dt*.025)this._thunder();if(this.mood==='dusk'&&Math.random()<dt*.008)this._horn();}
 _bird(){const p=Math.random()*2-1,f=2200+Math.random()*1400;for(let k=0;k<2+Math.random()*3;k++)this._o('sine',f,f*1.25,.07,.012,k*.11,p);}
 _thunder(){const p=Math.random()*2-1;this._n(2.6,300,40,.6,.12,'lowpass',0,p,true);this._o('sine',45,28,2,.06,.1,p);}
 _horn(){const p=Math.random()*1.6-.8;this._o('sawtooth',98,96,2.4,.025,0,p,true);this._o('sawtooth',123,121,2.4,.02,0,p,true);}
 _pan(p){return panTo(this.ac,p,this.out);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0,rev=false){if(vol<.0015)return;const g=hiss(this.ac,this.noise,this._pan(pan),this.ac.currentTime+delay,dur,f0,f1,q,vol,type);if(rev)g.connect(this.verbIn);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0,rev=false){if(vol<.0015)return;const g=tone(this.ac,this._pan(pan),this.ac.currentTime+delay,type,f0,f1,dur,vol,.005);if(rev)g.connect(this.verbIn);}
 // attenuation from distance (m); returns 0..1
 att(d,ref=8){return 1/(1+Math.max(0,d-2)/ref);}
 shot(kind,d=0,pan=0,mine=false){if(!this.ac)return;const s=SHOT[kind]||SHOT.rifle;const now=this.ac.currentTime;if(!mine){if(d>120||now-(this._ls||0)<.03)return;this._ls=now;}
  const a=mine?1:this.att(d,10)*.9,far=Math.min(1,d/60);const v=s.v*a;
  this._n(s.d*(1+far*.6),s.f0*(1-far*.6),s.f1,.8,v*.9,'lowpass',0,pan,true);this._n(.03,s.c,s.c*.6,1.4,v*.5*(1-far),'bandpass',0,pan);this._o('sine',s.b*1.6,s.b*.6,s.bd,v*.7,0,pan);
  if(far>.3)this._n(.5,600,120,.5,v*.25,'lowpass',.05+far*.2,pan,true);}
 dry(){if(!this.ac)return;this._o('square',1800,1600,.02,.05);this._n(.02,4000,3000,2,.06,'bandpass');}
 knife(hit){if(!this.ac)return;this._n(.12,3000,900,1.2,.12,'bandpass');if(hit)this._n(.08,600,200,.8,.3,'lowpass',.02);}
 step(vol=1,pan=0,surf='stone'){if(!this.ac)return;const f=surf==='metal'?1600:surf==='wood'?700:1000;this._n(.07,f,f*.4,1.2,.09*vol,'bandpass',0,pan);this._o('sine',90,60,.05,.04*vol,0,pan);if(this.mood==='dusk')this._n(.06,2400,1200,1,.035*vol,'bandpass',.01,pan);}
 land(v=1){if(!this.ac)return;this._n(.12,700,150,.8,.18*v,'lowpass');}
 reload(part){if(!this.ac)return;if(part==='out'){this._n(.05,2200,1400,3,.12,'bandpass');this._o('square',300,200,.03,.03);}else if(part==='in'){this._n(.04,1800,900,3,.16,'bandpass');this._o('square',500,300,.025,.05,.0);this._n(.03,3000,2000,4,.1,'bandpass',.06);}
  else if(part==='bolt'){this._n(.06,1400,700,3,.15,'bandpass');this._n(.05,2600,1600,4,.12,'bandpass',.12);}else if(part==='shell'){this._n(.05,1600,1000,3,.13,'bandpass');}else if(part==='pump'){this._n(.07,900,500,2,.2,'bandpass');this._n(.06,1300,800,2,.18,'bandpass',.11);}else if(part==='draw'){this._n(.08,2400,1200,2,.08,'bandpass');}}
 hit(kind){if(!this.ac)return;if(kind==='hs'){this._o('triangle',2900,2700,.14,.16);this._o('sine',5200,5000,.08,.08);}else if(kind==='armor'){this._o('triangle',1500,1300,.06,.08);this._n(.04,3000,2000,3,.06,'bandpass');}else if(kind==='kill'){this._o('sine',880,880,.08,.1);this._o('sine',1320,1320,.12,.1,.07);}else this._n(.05,500,200,1,.18,'lowpass');}
 hurt(v=1){if(!this.ac)return;this._n(.18,400,90,.7,.35*v,'lowpass');this._o('sine',120,60,.15,.12*v);}
 bounce(d=0,pan=0){if(!this.ac)return;const a=this.att(d,6);this._o('triangle',1400+Math.random()*600,900,.05,.08*a,0,pan);}
 pin(){if(!this.ac)return;this._n(.03,5000,4000,4,.08,'bandpass');this._o('square',2400,2200,.02,.03,.04);}
 throwIt(){if(!this.ac)return;this._n(.18,800,300,.6,.1,'bandpass');}
 boom(d=0,pan=0,big=1){if(!this.ac)return;const a=this.att(d,14);this._n(1.4*big,1600,40,.6,.9*a*big,'lowpass',0,pan,true);this._o('sine',70,24,1.2*big,.7*a,0,pan);this._n(.2,4000,800,.6,.3*a,'lowpass',0,pan);}
 smoke(d=0,pan=0){if(!this.ac)return;const a=this.att(d,8);this._n(2.2,3500,1200,.5,.12*a,'highpass',0,pan);this._n(.15,800,300,.8,.15*a,'lowpass',0,pan);}
 bang(d=0,pan=0){if(!this.ac)return;const a=this.att(d,10);this._n(.25,6000,1200,.4,.8*a,'lowpass',0,pan,true);this._o('square',2200,600,.1,.15*a,0,pan);}
 tinnitus(k){if(!this.ac)return;const t=this.ac.currentTime;this.ringG.gain.cancelScheduledValues(t);this.ringG.gain.setValueAtTime(.05*k,t);this.ringG.gain.exponentialRampToValueAtTime(.0005,t+.5+k*3.5);this.duck.gain.cancelScheduledValues(t);this.duck.gain.setValueAtTime(Math.max(.15,1-k*.85),t);this.duck.gain.linearRampToValueAtTime(1,t+.5+k*3);}
 fire(d=0,pan=0){if(!this.ac)return;const a=this.att(d,6);this._n(.35,1800,600,.8,.06*a,'bandpass',0,pan);}
 ignite(d=0,pan=0){if(!this.ac)return;const a=this.att(d,8);this._n(.6,1200,300,.6,.35*a,'lowpass',0,pan,true);this._n(.3,3000,1500,1,.12*a,'bandpass',.05,pan);}
 beep(urgent){if(!this.ac)return;this._o('square',urgent?2100:1800,urgent?2100:1800,.07,.07);}
 bombBeep(d=0,pan=0,f=1){if(!this.ac)return;const a=this.att(d,12);this._o('square',1900*f,1900*f,.09,.09*a,0,pan);this._o('sine',3800*f,3800*f,.06,.03*a,0,pan);}
 keypad(i){if(!this.ac)return;this._o('square',900+(i%4)*220,900+(i%4)*220,.06,.05);}
 planted(){if(!this.ac)return;[0,.12,.24].forEach((d,i)=>this._o('square',1200+i*200,1200+i*200,.1,.06,d));this._o('sawtooth',220,220,.6,.05,.4);}
 defuseTick(){if(!this.ac)return;this._n(.03,3500,2500,4,.06,'bandpass');}
 defused(){if(!this.ac)return;[0,.1,.2].forEach((d,i)=>this._o('sine',880*(1+i*.25),880*(1+i*.25),.25,.1,d));}
 buy(ok=true){if(!this.ac)return;if(ok){this._o('triangle',1500,1500,.05,.08);this._o('triangle',2200,2200,.08,.06,.05);}else this._o('square',220,180,.15,.06);}
 roundStart(){if(!this.ac)return;[0,.18,.36].forEach((d,i)=>this._o('triangle',i<2?660:990,i<2?660:990,.16,.08,d));}
 sting(win){if(!this.ac)return;const n=win?[523,659,784,1046]:[440,392,330,262];n.forEach((f,i)=>{this._o('triangle',f,f,.35,.09,i*.14);this._o('sine',f/2,f/2,.4,.06,i*.14);});}
}
