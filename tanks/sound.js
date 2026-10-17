// IRONCLAD — synthesized audio (no files): diesel engine + track clatter, turret servo, cannons, coilgun, impacts, ricochets, explosions, UI.
import {boot,master,gain,noiseBuf,bed,panTo,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.on=true;}
 init(){if(this.ac)return;boot(this,ac=>{this.out=master(ac,.8,-16,5);const b=this.noise=noiseBuf(ac);
  // engine: two detuned saws through a lowpass, plus a rumble noise bed
  const o1=ac.createOscillator(),o2=ac.createOscillator();o1.type='sawtooth';o2.type='square';const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;lp.Q.value=2;
  const eg=gain(ac,0,this.out);o1.connect(lp);o2.connect(lp);lp.connect(eg);o1.start();o2.start();
  const{f:rf,g:rg}=bed(ac,b,'lowpass',160,null,this.out);
  // track clatter: noise bursts through a bandpass, gated by an LFO-ish square
  const cg=gain(ac,0,this.out),gate=gain(ac,.5,cg),{f:cf}=bed(ac,b,'bandpass',1400,1.4,gate,1);const lfo=ac.createOscillator();lfo.type='square';lfo.frequency.value=8;
  lfo.connect(gain(ac,.5,gate.gain));lfo.start();
  // turret servo whine
  const so=ac.createOscillator();so.type='triangle';so.frequency.value=420;const sg=gain(ac,0,this.out);so.connect(sg);so.start();
  // wind bed
  const wg=bed(ac,b,'bandpass',500,.4,this.out,.012,.7).g;
  this.eng={o1,o2,lp,eg,rf,rg,cf,cg,lfo,so,sg,wg};});}
 engine(speed,max,thr,trav,on){if(!this.live)return;const e=this.eng,t=this.ac.currentTime,s=Math.min(1,Math.abs(speed)/Math.max(1,max)),load=Math.min(1,Math.abs(thr));
  e.o1.frequency.setTargetAtTime(38+s*42+load*14,t,.12);e.o2.frequency.setTargetAtTime(19+s*21+load*7,t,.12);e.lp.frequency.setTargetAtTime(160+s*380+load*260,t,.1);
  e.eg.gain.setTargetAtTime(on?.05+load*.05+s*.03:0,t,.15);e.rg.gain.setTargetAtTime(on?.12+s*.18:0,t,.15);
  e.cg.gain.setTargetAtTime(on?s*.09:0,t,.08);e.lfo.frequency.setTargetAtTime(4+s*16,t,.1);e.cf.frequency.setTargetAtTime(900+s*900,t,.1);
  const tv=Math.min(1,Math.abs(trav)/1.5);e.sg.gain.setTargetAtTime(on?tv*.025:0,t,.05);e.so.frequency.setTargetAtTime(300+tv*260,t,.05);}
 mute(){if(this.live)this.engine(0,1,0,0,false);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0){hiss(this.ac,this.noise,panTo(this.ac,pan,this.out),this.ac.currentTime+delay,dur,f0,f1,q,vol,type,0,20);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0){tone(this.ac,panTo(this.ac,pan,this.out),this.ac.currentTime+delay,type,f0,f1,dur,vol,.008);}
 // a = distance attenuation 0..1, pan -1..1
 get live(){return this.ac&&this.ac.state==='running';}
 resume(){if(this.ac&&this.ac.state==='suspended')try{this.ac.resume();}catch(e){}}
 play(k,a=1,pan=0){if(!this.live||!this.on||a<.02)return;try{switch(k){
  case'talon':this._n(.16,3200,300,.8,.32*a,'lowpass',0,pan);this._o('square',180,60,.09,.12*a,0,pan);break;
  case'maul':this._n(.9,1800,60,.6,.75*a,'lowpass',0,pan);this._o('sine',90,26,.8,.6*a,0,pan);this._n(.3,6000,800,.5,.25*a,'highpass',0,pan);break;
  case'charge':this._o('sawtooth',120,1400,.7,.06*a,0,pan);this._o('sine',240,2600,.7,.05*a,0,pan);break;
  case'lance':this._n(.5,9000,500,.7,.45*a,'bandpass',0,pan);this._o('sawtooth',2400,80,.45,.18*a,0,pan);this._o('sine',60,30,.5,.4*a,0,pan);break;
  case'hit':this._o('square',320+Math.random()*80,90,.18,.18*a,0,pan);this._n(.25,4200,600,1.2,.35*a,'bandpass',0,pan);this._o('sine',110,50,.3,.3*a,0,pan);break;
  case'crit':this._o('sawtooth',880,220,.35,.12*a);this._o('square',660,165,.35,.08*a,.05);break;
  case'ric':this._o('sine',1800+Math.random()*900,600,.42,.16*a,0,pan);this._n(.12,7000,2000,2,.15*a,'bandpass',0,pan);break;
  case'boom':this._n(1.6,1400,40,.6,.9*a,'lowpass',0,pan);this._o('sine',70,22,1.3,.7*a,0,pan);this._n(.5,5000,300,.5,.3*a,'highpass',.04,pan);break;
  case'small':this._n(.5,2200,90,.6,.45*a,'lowpass',0,pan);this._o('sine',110,40,.35,.3*a,0,pan);break;
  case'wood':this._n(.35,1800,300,1.5,.4*a,'bandpass',0,pan);this._o('triangle',260,90,.2,.12*a,0,pan);break;
  case'crash':this._n(1.1,900,60,.7,.6*a,'lowpass',0,pan);this._n(.6,3000,300,1,.25*a,'bandpass',.1,pan);break;
  case'dirt':this._n(.35,900,120,.7,.35*a,'lowpass',0,pan);break;
  case'pickup':[523,659,784,1047].forEach((f,i)=>this._o('triangle',f,f,.18,.07,i*.06));break;
  case'drop':this._o('sine',300,900,.6,.06);this._o('sine',450,1350,.6,.04,.1);break;
  case'flag':[392,523,659].forEach((f,i)=>this._o('square',f,f*1.01,.35,.05,i*.09));break;
  case'cap':[523,659,784,1047,1319].forEach((f,i)=>this._o('sawtooth',f,f,.5,.05,i*.08));break;
  case'lost':[400,300,200].forEach((f,i)=>this._o('square',f,f,.3,.05,i*.12));break;
  case'beep':this._o('square',a>1?1100:720,a>1?1100:720,a>1?.5:.15,.06);break;
  case'reload':this._n(.06,3000,2000,3,.12,'bandpass');this._n(.08,1800,1200,3,.1,'bandpass',.09);break;
  case'kill':this._o('square',660,660,.08,.06);this._o('square',990,990,.14,.06,.08);break;
  case'hurt':this._o('sine',140,50,.35,.35);this._n(.3,1500,200,1,.3);break;
  case'click':this._o('square',1400,1400,.03,.04);break;
  case'horn':[196,247,294].forEach(f=>this._o('sawtooth',f,f,1.4,.05));break;
  case'win':[523,659,784,1047].forEach((f,i)=>this._o('triangle',f,f,.7,.07,i*.15));break;
  case'lose':[392,330,262,196].forEach((f,i)=>this._o('triangle',f,f,.7,.07,i*.18));break;}}catch(e){}}}
