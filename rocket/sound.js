// ROCKET ARENA — synthesized sound (no audio files): engines, boost, hits, crowd, horn.
import {boot,master,gain,noiseBuf,bed,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.on=true;this.engines=[];}
 init(){if(this.ac)return;boot(this,ac=>{this.out=master(ac,.7,-24,12);const b=this.noise=noiseBuf(ac);
  // crowd bed
  this.crowd=bed(ac,b,'bandpass',700,.6,this.out,.03).g;
  for(let i=0;i<2;i++){const o=ac.createOscillator();o.type='sawtooth';const o2=ac.createOscillator();o2.type='square';const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=400;const g=gain(ac,0,this.out);o.connect(f);o2.connect(f);f.connect(g);o.start();o2.start();
   const{f:bf,g:bg}=bed(ac,b,'bandpass',1800,.8,this.out);
   this.engines.push({o,o2,f,g,bf,bg});}});}
 engine(i,speed,boost,on){const e=this.engines[i];if(!e)return;const t=this.ac.currentTime,s=Math.min(1,speed/62);e.o.frequency.setTargetAtTime(48+s*150,t,.05);e.o2.frequency.setTargetAtTime(24+s*75,t,.05);e.f.frequency.setTargetAtTime(300+s*1400,t,.05);
  e.g.gain.setTargetAtTime(on?.035+s*.04:0,t,.08);e.bg.gain.setTargetAtTime(on&&boost?.09:0,t,.04);e.bf.frequency.setTargetAtTime(1200+s*1500,t,.05);}
 hype(v){if(this.crowd)this.crowd.gain.setTargetAtTime(.03+v*.22,this.ac.currentTime,.25);}
 _n(dur,f0,f1,q,vol,type='lowpass'){hiss(this.ac,this.noise,this.out,this.ac.currentTime,dur,f0,f1,q,vol,type,0,20);}
 _o(type,f0,f1,dur,vol,delay=0){tone(this.ac,this.out,this.ac.currentTime+delay,type,f0,f1,dur,vol,.01);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'hit':this._o('sine',160,45,.25,Math.min(.5,.12+a*.006));this._n(.12,4000,600,1,Math.min(.35,a*.006));break;
  case'bounce':this._o('sine',110,50,.18,Math.min(.25,a*.005));break;
  case'jump':this._n(.18,900,2500,1.5,.06,'bandpass');break;
  case'land':this._o('sine',90,40,.12,Math.min(.2,a*.01));break;
  case'pad':this._o('sine',a>1?660:880,a>1?1760:1320,a>1?.35:.12,.08);if(a>1)this._o('sine',990,1980,.3,.06,.06);break;
  case'bump':this._n(.25,1500,200,1,.25);this._o('square',120,50,.2,.08);break;
  case'demo':this._n(.9,2500,60,.7,.5);this._o('sine',120,30,.7,.35);break;
  case'beep':this._o('square',a?990:660,a?990:660,a?.5:.18,.07);break;
  case'goal':this._n(1.4,3000,80,.6,.5);this._o('sine',90,28,1.2,.4);[0,.18,.36].forEach((d,i)=>{this._o('sawtooth',[220,277,330][i],[220,277,330][i]*1.01,1.6,.05,d);});break;
  case'horn':[196,247,294].forEach(f=>this._o('sawtooth',f,f,1.4,.05));break;
  case'whoosh':this._n(.6,400,3000,.8,.12,'bandpass');break;}}catch(e){}}}
