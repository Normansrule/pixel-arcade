// FAIRWAY LEGENDS — synthesized audio (no files): sea-breeze bed with gusts, rain hiss, surf swell, gull cries, swing whoosh,
// club strikes (driver ping, iron click, putter tock), landings, cup rattle, splashes and gallery applause.
import {boot,master,gain,noiseBuf,bed,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.on=true;this.gT=0;this.seaV=0;}
 init(){boot(this,ac=>{this.out=master(ac,.8,-18,6);this.noise=noiseBuf(ac,3);
  this.wind=bed(ac,this.noise,'bandpass',420,.6,this.out,.03);this.surf=bed(ac,this.noise,'lowpass',260,null,this.out,0,1.1);
  this.amb=gain(ac,1,this.out);this.rainB=bed(ac,this.noise,'highpass',1800,.4,this.out,0,.6);if(this.rainV)this.setRain(this.rainV);});}
 setRain(v){this.rainV=v;if(!this.ac||!this.rainB)return;this.rainB.g.gain.setTargetAtTime(v*.05,this.ac.currentTime,.8);}
 setWind(mph){if(!this.ac)return;const t=this.ac.currentTime;this.wind.g.gain.setTargetAtTime(.012+mph*.0028,t,.6);this.wind.f.frequency.setTargetAtTime(300+mph*18,t,.6);}
 setSea(v){this.seaV=v;}
 tick(dt){if(!this.ac||!this.on)return;const t=this.ac.currentTime;this.gT-=dt;
  // surf swell
  const sw=.5+.5*Math.sin(t*.55)*Math.sin(t*.21+1);this.surf.g.gain.setTargetAtTime(this.seaV*(.02+sw*.07),t,.3);this.surf.f.frequency.setTargetAtTime(180+sw*380,t,.3);
  if(this.gT<=0){this.gT=5+Math.random()*9;if(Math.random()<.7)this.gull();}}
 gull(){const ac=this.ac,t=ac.currentTime,n=1+Math.random()*3|0,f=1500+Math.random()*700;for(let i=0;i<n;i++){const s=t+i*.22;tone(ac,this.amb,s,'sawtooth',f*1.1,f*.62,.2,.012,.02);tone(ac,this.amb,s,'sine',f*1.12,f*.6,.2,.02,.02);}}
 _n(dur,f0,f1,q,vol,type='bandpass',delay=0,att=0){hiss(this.ac,this.noise,this.out,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,att,20);}
 _o(type,f0,f1,dur,vol,delay=0,att=.003){tone(this.ac,this.out,this.ac.currentTime+delay,type,f0,f1,dur,vol,att);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'whoosh':this._n(.32,300,2400,.9,.09*a,'bandpass',0,.2);break;
  case'driver':this._o('sine',2600,2300,.25,.16);this._o('triangle',1250,1100,.18,.12);this._n(.06,6000,2500,.8,.3,'highpass');break;
  case'iron':this._o('sine',1700,1300,.09,.14);this._n(.05,4500,2000,1,.32,'bandpass');this._n(.18,900,300,.7,.08,'lowpass',.01);break;
  case'wedge':this._o('sine',1400,1100,.07,.1);this._n(.05,4000,1800,1,.26,'bandpass');this._n(.25,700,200,.6,.1,'lowpass',.01);break;
  case'putt':this._o('sine',900,800,.06,.12);this._o('sine',1800,1700,.04,.05);break;
  case'sandshot':this._n(.45,1600,400,.6,.3,'lowpass');break;
  case'land':this._o('sine',120,60,.12,.18*a);this._n(.08,800,200,.8,.12*a,'lowpass');break;
  case'landsand':this._n(.25,1400,300,.6,.16*a,'lowpass');break;
  case'roll':break;
  case'cup':this._o('sine',520,480,.06,.14);this._o('sine',380,360,.08,.12,.07);this._o('sine',300,280,.12,.12,.14);break;
  case'lip':this._o('sine',700,620,.08,.12);break;
  case'pin':this._o('sine',2100,2050,.5,.07);this._o('sine',3150,3100,.4,.04);break;
  case'tree':this._n(.5,3000,900,.5,.14,'bandpass',0,.03);break;
  case'splash':this._n(.7,1800,300,.5,.3,'lowpass',0,.01);this._o('sine',300,90,.25,.12);break;
  case'clap':for(let i=0;i<16;i++)this._n(.06,2400,1500,.8,.04+Math.random()*.03,'bandpass',i*.07+Math.random()*.05);break;
  case'cheer':this._n(2.4,900,700,.6,.12*a,'bandpass',0,.25);this._n(2.2,2200,1600,.7,.05*a,'bandpass',.05,.3);for(let i=0;i<30;i++)this._n(.05,2500,1600,.8,.04,'bandpass',.1+i*.06+Math.random()*.05);break;
  case'groan':this._n(1.2,600,300,1.2,.08,'bandpass',0,.15);break;
  case'tick':this._o('square',1200,1200,.03,.03);break;
  case'set':this._o('sine',880,880,.05,.07);break;
  case'ui':this._o('sine',a?990:660,a?990:660,.07,.06);break;
  case'replay':this._n(.6,400,3000,.7,.06,'bandpass',0,.3);this._o('sine',440,880,.4,.04);break;
  case'divot':this._n(.12,1200,300,.8,.12,'lowpass');break;
  case'bell':[660,990,1320].forEach((f,i)=>this._o('sine',f,f,1.2,.06/(i+1),i*.01,.005));break;}}catch(e){}}}
