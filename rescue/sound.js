// BEACON RESCUE — every sound is synthesized: rain on the roof, wind and surf, distant thunder, WICK's servo whirr, plugs,
// clunks, the charger's rising tone, gate chains, the generator hum, a soft music-box loop and the beacon's swell.
import {boot,master,gain,noiseBuf,reverb,bed,tone,hiss} from '../js/kit3d/audio.js';
const R=Math.random;
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.on=false;this.nextNote=0;this.step=0;this.urgent=0;}
 init(){boot(this,ac=>{this.master=master(ac,this.vol,-14,5);this.sfx=gain(ac,1,this.master);this.mus=gain(ac,.0,this.master);this.noise=noiseBuf(ac,3);this.verb=reverb(ac,2.4,2.8,.35,this.master);
  this.amb=gain(ac,0,this.master);bed(ac,this.noise,'highpass',2600,.4,this.amb,.06);const w=bed(ac,this.noise,'bandpass',420,.8,this.amb,.18,.6);
  const lfo=ac.createOscillator();lfo.frequency.value=.07;lfo.connect(gain(ac,220,w.f.frequency));lfo.start();bed(ac,this.noise,'lowpass',160,1,this.amb,.4,1.2);
  // WICK's motor: a filtered saw whose pitch follows speed
  this.mo=ac.createOscillator();this.mo.type='sawtooth';this.mo.frequency.value=90;const mf=ac.createBiquadFilter();mf.type='lowpass';mf.frequency.value=700;this.mg=gain(ac,0,this.sfx);this.mo.connect(mf);mf.connect(this.mg);this.mo.start();
  // generator / live-power hum
  this.hum=ac.createOscillator();this.hum.type='triangle';this.hum.frequency.value=58;this.hg=gain(ac,0,this.sfx);this.hum.connect(this.hg);this.hum.start();
  this.timer=setInterval(()=>this.tick(),60);});}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 ambience(on){if(!this.ac)return;this.on=on;const t=this.ac.currentTime;this.amb.gain.setTargetAtTime(on?1:.35,t,.6);this.mus.gain.setTargetAtTime(on?.5:.25,t,.8);if(!on){this.mg.gain.setTargetAtTime(0,t,.05);this.hg.gain.setTargetAtTime(0,t,.1);}}
 motor(speed,carry){if(!this.ac||!this.on)return;const t=this.ac.currentTime;this.mo.frequency.setTargetAtTime(70+speed*28-(carry==='weight'?20:0),t,.05);this.mg.gain.setTargetAtTime(Math.min(.05,speed*.016),t,.08);}
 power(n){if(!this.ac||!this.on)return;this.hg.gain.setTargetAtTime(Math.min(.05,n*.018),this.ac.currentTime,.3);}
 tick(){if(!this.ac)return;const t=this.ac.currentTime;
  if(t>=this.nextNote){const sc=[0,3,7,10,12,15,19,14],n=sc[(this.step*5+((this.step>>3)&3))%8],f=220*Math.pow(2,n/12);this.step++;const dt=this.urgent?.22:.42;this.nextNote=t+dt;
   tone(this.ac,this.mus,t,'triangle',f,f,.9,.035);if(this.step%4===0)tone(this.ac,this.mus,t,'sine',f/2,f/2,1.6,.04,.02);}
  if(this.on&&R()<.004)this.thunder(.35+R()*.3);}
 _o(type,f0,f1,dur,vol,d=0,atk){return tone(this.ac,this.sfx,this.ac.currentTime+d,type,f0,f1,dur,vol,atk);}
 _n(dur,f0,f1,q,vol,type='lowpass',d=0,atk=0){return hiss(this.ac,this.noise,this.sfx,this.ac.currentTime+d,dur,f0,f1,q,vol,type,atk);}
 thunder(v=.6){if(!this.ac)return;const g=hiss(this.ac,this.noise,this.master,this.ac.currentTime+.2+R()*.5,2.8,500,60,.7,v*.5,'lowpass',.08);g.connect(this.verb);}
 play(k){if(!this.ac)return;switch(k){
  case'pick':this._o('triangle',380,620,.09,.12);this._n(.06,3000,1500,2,.06,'bandpass');break;
  case'drop':this._o('sine',160,70,.14,.22);this._n(.1,900,200,1,.15);break;
  case'heavy':this._o('sine',90,40,.3,.4);this._n(.25,600,80,1,.35);this._o('square',70,50,.08,.05);break;
  case'plug':this._o('square',220,880,.05,.08);this._n(.07,6000,2000,4,.12,'bandpass');this._o('sine',880,880,.15,.05,.05);break;
  case'unplug':this._o('square',600,180,.06,.06);this._n(.05,3000,1200,3,.08,'bandpass');break;
  case'zap':this._n(.25,5000,1800,6,.12,'bandpass');this._o('sawtooth',120,240,.3,.05);break;
  case'charged':[0,4,7].forEach((n,i)=>this._o('triangle',660*Math.pow(2,n/12),660*Math.pow(2,n/12),.3,.08,i*.07));break;
  case'charge':this._o('sine',300,520,.12,.03);break;
  case'open':this._n(.9,300,120,1,.25,'lowpass',0,.05);this._o('sawtooth',55,80,.8,.05,0,.1);for(let i=0;i<5;i++)this._n(.04,2400,1800,6,.07,'bandpass',.1+i*.12);break;
  case'close':this._o('sine',90,45,.35,.35);this._n(.3,700,100,1,.3);break;
  case'pan':this._o('triangle',200,140,.2,.12);this._n(.12,1500,400,2,.1,'bandpass');break;
  case'strain':this._o('sawtooth',140,110,.12,.04);break;
  case'recover':this._o('sine',300,900,.35,.1);this._n(.4,800,3000,1,.06,'bandpass');break;
  case'reset':[7,4,0].forEach((n,i)=>this._o('triangle',440*Math.pow(2,n/12),440*Math.pow(2,n/12),.18,.08,i*.08));break;
  case'hint':this._o('sine',990,990,.12,.06);this._o('sine',1320,1320,.2,.05,.08);break;
  case'room':[0,5,9,12].forEach((n,i)=>this._o('triangle',392*Math.pow(2,n/12),392*Math.pow(2,n/12),.5,.08,i*.09));break;
  case'tick':this._o('square',1200,1100,.03,.04);break;
  case'deny':this._o('square',180,140,.12,.06);break;
  case'lamp':{const t=this.ac.currentTime;for(const[n,d]of[[0,0],[7,.15],[12,.3],[16,.45],[19,.6]]){const g=tone(this.ac,this.sfx,t+d,'triangle',262*Math.pow(2,n/12),262*Math.pow(2,n/12),3.2,.09,.25);g.connect(this.verb);}this._n(2.5,200,4000,.6,.08,'bandpass',0,1);break;}
  case'lose':[0,-3,-7,-12].forEach((n,i)=>this._o('triangle',330*Math.pow(2,n/12),300*Math.pow(2,n/12),.7,.08,i*.25));this.thunder(.9);break;}}
}
