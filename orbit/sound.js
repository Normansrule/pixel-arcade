// ORBIT LAB — synthesized sound: engine roar (air vs vacuum), wind, staging bangs, chute, alarms, fanfare.
import {boot,master,gain,bed,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.on=true;}
 init(){if(this.ac)return;boot(this,ac=>{this.out=master(ac,.65,-24,12);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;l=(l+.02*w)/1.02;d[i]=w*.6+l*3;}this.noise=b;
  const mk=(type,f,q)=>{const r=bed(ac,b,type,f,q,this.out,0,Math.random());return{fl:r.f,g:r.g};};
  this.roar=mk('lowpass',300,.7);this.crackle=mk('bandpass',1800,.9);this.wind=mk('bandpass',600,.5);this.plasma=mk('bandpass',260,1.2);
  const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=38;const of=ac.createBiquadFilter();of.type='lowpass';of.frequency.value=120;this.rumble=gain(ac,0,this.out);o.connect(of);of.connect(this.rumble);o.start();});}
 set(thr,pr,q,heat,warp){if(!this.ac)return;const t=this.ac.currentTime,k=this.on&&warp<=4?1:0;const air=.15+.85*pr;
  this.roar.g.gain.setTargetAtTime(k*thr*(.25+.35*air),t,.06);this.roar.fl.frequency.setTargetAtTime(160+500*air+thr*300,t,.1);
  this.crackle.g.gain.setTargetAtTime(k*thr*.06*air,t,.05);this.rumble.gain.setTargetAtTime(k*thr*.1*air,t,.08);
  const w=Math.min(1,q/30000);this.wind.g.gain.setTargetAtTime(k*w*.22,t,.15);this.wind.fl.frequency.setTargetAtTime(400+w*1400,t,.2);
  this.plasma.g.gain.setTargetAtTime(k*Math.min(1,heat)*.3,t,.15);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){hiss(this.ac,this.noise,this.out,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,0,20);}
 _o(type,f0,f1,dur,vol,delay=0){tone(this.ac,this.out,this.ac.currentTime+delay,type,f0,f1,dur,vol,.01);}
 play(k){if(!this.ac||!this.on)return;try{switch(k){
  case'click':this._o('square',1400,1100,.04,.03);break;case'place':this._o('sine',520,700,.08,.08);this._n(.08,3000,800,1,.05);break;case'remove':this._o('sine',500,260,.12,.07);break;
  case'ignite':this._n(1.4,180,60,.7,.6);this._o('sine',70,30,1.2,.3);break;
  case'sep':this._n(.5,2600,200,.8,.45);this._o('square',140,50,.25,.12);break;
  case'chute':this._n(.7,900,3000,.7,.18,'bandpass');this._n(.3,300,90,1,.25,'lowpass',.35);break;
  case'legs':this._o('square',300,180,.18,.05);this._o('square',200,140,.12,.04,.15);break;
  case'boom':this._n(2.2,2400,40,.6,.8);this._o('sine',90,22,1.8,.5);break;
  case'touch':this._n(.4,500,80,1,.25);break;case'splash':this._n(1.2,2500,300,.5,.35,'bandpass');break;
  case'warn':this._o('square',880,880,.12,.05);this._o('square',880,880,.12,.05,.2);break;
  case'beep':this._o('sine',1200,1200,.08,.05);break;
  case'win':[523,659,784,1046].forEach((f,i)=>this._o('triangle',f,f,.5,.09,i*.12));this._o('sine',1046,1046,1.2,.06,.5);break;
  case'fail':[392,330,262].forEach((f,i)=>this._o('sawtooth',f,f*.98,.4,.05,i*.18));break;}}catch(e){}}}
