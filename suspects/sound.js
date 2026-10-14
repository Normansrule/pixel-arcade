// STARSHIP SUSPECTS — synthesized sound (no audio files): ship hum, footsteps, task blips, kills, alarms, meetings.
import {boot,master,gain,noiseBuf,bed,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.on=true;this.alarmG=null;}
 init(){if(this.ac)return;boot(this,ac=>{this.out=master(ac,.65,-24,12);const b=this.noise=noiseBuf(ac);
  // ship hum: two detuned low oscillators + rumbling filtered noise
  this.hum=gain(ac,.05,this.out);
  for(const f of[46,46.7,92.3]){const o=ac.createOscillator();o.type=f>90?'triangle':'sawtooth';o.frequency.value=f;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=180;o.connect(lp);lp.connect(gain(ac,f>90?.25:.5,this.hum));o.start();}
  bed(ac,b,'lowpass',260,null,this.hum,.6);
  // alarm klaxon (gated)
  this.alarmG=gain(ac,0,this.out);const ao=ac.createOscillator();ao.type='square';ao.frequency.value=440;const lfo=ac.createOscillator();lfo.frequency.value=1.4;lfo.connect(gain(ac,180,ao.frequency));const af=ac.createBiquadFilter();af.type='lowpass';af.frequency.value=1400;ao.connect(af);af.connect(this.alarmG);ao.start();lfo.start();
 });}
 alarm(on){if(!this.ac)return;this.alarmG.gain.setTargetAtTime(on&&this.on?.05:0,this.ac.currentTime,.1);}
 humLevel(v){if(this.ac)this.hum.gain.setTargetAtTime(v,this.ac.currentTime,.4);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){hiss(this.ac,this.noise,this.out,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,0,20);}
 _o(type,f0,f1,dur,vol,delay=0){tone(this.ac,this.out,this.ac.currentTime+delay,type,f0,f1,dur,vol,.008);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'step':this._o('sine',180+Math.random()*40,90,.07,.05*a);this._n(.05,1200+Math.random()*300,400,1.2,.02*a,'bandpass');break;
  case'click':this._o('square',1400,1200,.04,.04);break;
  case'blip':this._o('sine',880,990,.08,.06);break;
  case'chat':this._o('triangle',640+Math.random()*120,700,.07,.04);break;
  case'wire':this._o('sine',520*a,780*a,.12,.07);break;
  case'done':[0,.09,.18].forEach((d,i)=>this._o('sine',[660,880,1320][i],[660,880,1320][i],.22,.07,d));break;
  case'fail':this._o('square',220,140,.25,.06);break;
  case'shoot':this._n(.12,3000,400,1,.12);this._o('square',900,200,.1,.04);break;
  case'boom':this._n(.4,1800,80,.7,.2);this._o('sine',120,40,.3,.15);break;
  case'kill':this._o('square',520,90,.14,.12);this._o('sine',160,40,.45,.3,.03);this._n(.35,3000,200,.7,.25,'lowpass',.05);[0,.08,.16].forEach((d,i)=>this._o('sine',1400+i*300,1600+i*300,.06,.04,.25+d));break;
  case'body':[0,.25,.5].forEach(d=>{this._o('sawtooth',740,560,.22,.08,d);});break;
  case'meeting':[0,.18,.36].forEach(d=>{this._o('sine',988,980,.9,.09,d);this._o('sine',1976,1960,.5,.03,d);});this._o('triangle',196,196,1,.06);break;
  case'vote':this._o('square',300,600,.08,.06);this._n(.08,2000,800,1,.06);break;
  case'eject':this._n(2.4,200,4000,.6,.18,'bandpass');this._o('sine',80,30,2,.2);break;
  case'vent':this._n(.25,500,120,1.5,.25);this._o('square',110,70,.18,.08);this._n(.4,3000,800,.5,.06,'highpass',.05);break;
  case'door':this._o('square',90,60,.25,.12);this._n(.2,1500,200,1,.2);break;
  case'lights':this._o('sawtooth',300,40,.9,.1);this._n(.5,800,60,1,.12);break;
  case'fixed':[0,.1].forEach((d,i)=>this._o('sine',[523,784][i],[523,784][i],.3,.07,d));break;
  case'win':[0,.15,.3,.45].forEach((d,i)=>this._o('triangle',[392,494,587,784][i],[392,494,587,784][i],.8,.07,d));break;
  case'lose':[0,.25,.5].forEach((d,i)=>this._o('sawtooth',[330,262,196][i],[320,250,180][i],.7,.06,d));break;
  case'pop':this._o('sine',600*a,1200*a,.08,.07);break;
  case'role':this._o('sine',110,55,1.6,.25);this._n(1.4,300,3000,.7,.08,'bandpass');break;}}catch(e){}}}
