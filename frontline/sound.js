// FRONTLINE OPS — synthesized audio (no files): gunfire per weapon, suppressed shots, footsteps, reloads, explosions, UI, ambience.
import {boot,master,noiseBuf,reverb,bed,panTo,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.lastStep=0;}
 init(){boot(this,ac=>{this.out=master(ac,this.vol,-14,6);this.noise=noiseBuf(ac);
  // short reverb tail (synthetic impulse)
  this.verbIn=reverb(ac,1.6,3.2,.22,this.out);
  // ambience bed: wind + (night) crickets
  this.wind=bed(ac,this.noise,'lowpass',380,null,this.out).g;
  this.drone=null;this.heart=0;});}
 setVol(v){this.vol=v;if(this.out)this.out.gain.value=v;}
 ambience(kind,on){if(!this.ac)return;this.wind.gain.setTargetAtTime(on?(kind==='snow'?.12:kind==='town'?.04:.07):0,this.ac.currentTime,.5);this.amb=on?kind:null;}
 tick(dt){if(!this.ac||!this.amb)return;if(this.amb==='town'&&Math.random()<dt*1.4)this._cricket();if(this.amb==='harbor'&&Math.random()<dt*.35)this._gull();if(this.amb==='harbor'&&Math.random()<dt*.6)this._n(1.6,500,200,.5,.03,'lowpass',0,Math.random()*2-1);if(Math.random()<dt*.06)this._distant();}
 _gull(){const p=Math.random()*2-1,f=1400+Math.random()*500;for(let k=0;k<2+Math.random()*3;k++)this._o('sine',f,f*.7,.22,.025,k*.26,p);}
 _cricket(){const ac=this.ac,t=ac.currentTime,f=4200+Math.random()*900,pan=Math.random()*2-1;for(let k=0;k<3+Math.random()*3;k++){this._o('sine',f,f,.035,.012,k*.07,pan);}}
 _distant(){const pan=Math.random()*2-1,d=Math.random()*.5;this._n(.8,600,80,.7,.06,'lowpass',d,pan,true);this._o('sine',60,30,.6,.05,d,pan);}
 _pan(p){return panTo(this.ac,p,this.out);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0,rev=false){const g=hiss(this.ac,this.noise,this._pan(pan),this.ac.currentTime+delay,dur,f0,f1,q,vol,type);if(rev)g.connect(this.verbIn);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0,rev=false){const g=tone(this.ac,this._pan(pan),this.ac.currentTime+delay,type,f0,f1,dur,vol,.005);if(rev)g.connect(this.verbIn);}
 // gunshot. s: weapon snd profile; dist meters; pan -1..1
 shot(s,supp,dist=0,pan=0,mine=true){if(!this.ac)return;const now=this.ac.currentTime;if(!mine){if(dist>110||now-(this._ls||0)<.035)return;this._ls=now;}try{const far=Math.min(1,dist/60),v=(mine?1:.75)*(1-far*.75);
   if(!mine&&dist>30){this._n(s.len*1.3,s.f*.5,90,.7,(supp?.08:.32)*v,'lowpass',dist/340,pan);return;}
   if(supp){this._n(.09,2600,600,1.2,.22*v,'bandpass',0,pan);this._o('sine',s.b*1.4,s.b*.7,.06,.12*v,0,pan);this._n(.05,6000,3000,1,.05*v,'highpass',0,pan);return;}
   const cut=s.f*(1-far*.7);this._n(s.len,cut*2.2,cut*.3,.8,.55*v,'lowpass',0,pan,true);this._n(.05,6000,2000,.6,.25*v*(1-far),'highpass',0,pan);this._o('sine',s.b*1.6,s.b*.5,s.len*.9,.5*v,0,pan);if(mine)this._o('triangle',s.b*3,s.b,.05,.15,0,pan);
   if(dist>25)this._n(.6,500,90,.6,.08*v,'lowpass',.05+dist/340,pan,true);}catch(e){}}
 play(k,a=1,pan=0){if(!this.ac)return;try{switch(k){
  case'step':this._n(.07,a>1?900:600,150,1.2,.05*a,'lowpass',0,pan);break;
  case'land':this._n(.14,700,90,.8,.14,'lowpass');this._o('sine',90,40,.12,.1);break;
  case'slide':this._n(.5,1400,300,.6,.07,'bandpass');break;
  case'magout':this._o('square',1300,900,.03,.03);this._n(.05,3000,1500,2,.06,'bandpass',.01);break;
  case'magin':this._o('square',900,600,.04,.05);this._n(.06,2500,900,2,.09,'bandpass');this._o('square',1500,1500,.02,.03,.06);break;
  case'bolt':this._n(.06,2200,1200,3,.08,'bandpass');this._n(.07,1600,900,3,.08,'bandpass',.12);this._o('square',700,500,.02,.03,.13);break;
  case'pump':this._n(.08,1200,500,2,.12,'bandpass');this._n(.08,1500,700,2,.12,'bandpass',.14);break;
  case'shell':this._o('square',1800,1600,.025,.03);this._n(.04,3000,1200,3,.05,'bandpass',.01);break;
  case'dry':this._o('square',2200,1800,.02,.05);break;
  case'swap':this._n(.12,1800,800,1,.05,'bandpass');this._o('square',600,500,.02,.03,.08);break;
  case'hit':this._o('square',2400,2400,.035,.06);break;
  case'head':this._o('sine',2800,2600,.09,.12);this._o('square',1600,1500,.05,.04);break;
  case'kill':this._o('sine',1900,1900,.06,.1);this._o('sine',2850,2850,.12,.08,.05);break;
  case'hurt':this._n(.18,500,120,.8,.2);this._o('sine',120,60,.2,.15);break;
  case'whiz':this._n(.12,4000,1200,4,.08,'bandpass',0,pan);break;
  case'knife':this._n(.18,800,4000,2,.12,'bandpass');break;
  case'stab':this._n(.1,600,200,1,.2);this._o('sine',160,70,.12,.16);break;
  case'pin':this._o('square',3200,3000,.02,.04);this._o('square',2600,2500,.03,.03,.05);break;
  case'throw':this._n(.25,600,2400,1.5,.08,'bandpass');break;
  case'clink':this._o('triangle',2400*a,1800*a,.06,.05,0,pan);break;
  case'boom':{const v=Math.min(1,a);this._n(1.6,1800*v+200,40,.6,.9*v,'lowpass',0,pan,true);this._o('sine',70,24,1.1,.8*v,0,pan);this._n(.3,5000,800,.5,.25*v,'lowpass',0,pan);break;}
  case'smoke':this._n(1.4,2400,1200,.5,.06,'bandpass',0,pan);break;
  case'beep':this._o('square',a?1320:880,a?1320:880,a?.35:.12,.06);break;
  case'ui':this._o('square',1100,1100,.03,.03);break;
  case'radio':this._n(.06,3000,2000,4,.05,'bandpass');this._o('square',1450,1450,.05,.025,.02);break;
  case'uav':[880,1175,1480].forEach((f,i)=>this._o('sine',f,f,.18,.06,i*.12));break;
  case'ping':this._o('sine',1600,1500,.5,.05);break;
  case'jet':this._n(3.2,300,3200,.7,.35,'bandpass',0,pan,true);this._n(3.5,120,500,.5,.3,'lowpass');break;
  case'streak':[660,880,1320].forEach((f,i)=>this._o('triangle',f,f,.22,.07,i*.09));break;
  case'rank':[523,659,784,1047].forEach((f,i)=>this._o('triangle',f,f,.35,.07,i*.11));break;
  case'win':[392,523,659,784].forEach((f,i)=>{this._o('sawtooth',f,f*1.005,1.6,.035,i*.18,0,true);this._o('triangle',f/2,f/2,1.8,.04,i*.18);});break;
  case'lose':[392,330,262,196].forEach((f,i)=>this._o('sawtooth',f,f,.9,.035,i*.28,0,true));break;
  case'obj':[784,988].forEach((f,i)=>this._o('triangle',f,f,.3,.08,i*.12));break;
  case'heli':this._n(.7,200,150,1,.16*a,'lowpass');this._o('sawtooth',22,20,.6,.05*a);break;
  case'capture':[523,784,1047].forEach((f,i)=>this._o('triangle',f,f,.25,.08,i*.08));break;
  case'lost':[784,587,440].forEach((f,i)=>this._o('triangle',f,f,.25,.07,i*.1));break;
  case'killc':this._o('sine',1800,1800,.05,.12);this._o('sine',2700,2700,.14,.1,.04);this._n(.08,3000,1500,2,.06,'bandpass');break;
  case'laser':this._o('sine',2400,2400,.12,.03);break;
  case'bombs':this._n(.6,4000,600,1,.08,'bandpass',0,pan);break;
  case'drone':this._o('sawtooth',180,190,1.2,.03);this._o('sawtooth',184,192,1.2,.03);break;
  }}catch(e){}}
}
