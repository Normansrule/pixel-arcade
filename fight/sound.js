// TEMPEST FIST — synthesized audio (no files): punches and kicks layered by weight, guard clacks, whiffs, grabs and slams,
// super charge-ups, a crowd bed that swells with the action, a pulse of drums under the fight and an announcer voice.
import {boot,master,gain,noiseBuf,bed,tone,hiss,reverb} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.on=true;this.voice=true;this.musOn=true;this.beat=0;this.next=0;this.bpm=126;this.mode=0;}
 init(){if(this.ac){boot(this);return;}boot(this,ac=>{this.out=master(ac,.7,-20,8);this.fx=gain(ac,1,this.out);this.verb=reverb(ac,1.6,3,.18,this.out);this.noise=noiseBuf(ac);
  this.crowd=bed(ac,this.noise,'bandpass',800,.45,this.out,0).g;this.mus=gain(ac,.0,this.out);});}
 setOn(v){this.on=v;if(this.out)this.out.gain.value=v?.7:0;if(!v&&window.speechSynthesis)speechSynthesis.cancel();}
 hype(v){if(this.ac)this.crowd.gain.setTargetAtTime(Math.min(.32,.02+v*.3),this.ac.currentTime,.25);}
 music(on,mode=0){this.mode=mode;if(!this.ac)return;this.mus.gain.setTargetAtTime(on&&this.musOn?.32:0,this.ac.currentTime,.4);}
 // simple step sequencer: kick / snare / hat + a bass riff in a minor key; scheduled ahead on the audio clock
 tick(){if(!this.ac||!this.on)return;const ac=this.ac,spb=60/this.bpm/2;if(this.next<ac.currentTime)this.next=ac.currentTime+.05;
  while(this.next<ac.currentTime+.2){const s=this.beat%16,t=this.next,m=this.mus,boss=this.mode===2;
   if(s%4===0)tone(ac,m,t,'sine',150,42,.22,.9);if(s%8===4)hiss(ac,this.noise,m,t,.16,4000,1500,.7,.45,'bandpass');if(s%2===1)hiss(ac,this.noise,m,t,.04,9000,7000,.8,.12,'highpass');
   const R=boss?[41,41,44,41,46,44,39,41]:[45,45,48,45,50,48,43,45],n=R[(this.beat>>1)%8];if(s%2===0)tone(ac,m,t,boss?'sawtooth':'square',440*Math.pow(2,(n-69)/12),440*Math.pow(2,(n-69)/12),spb*.9,.06);
   if(s===0&&(this.beat>>4)%2)tone(ac,m,t,'triangle',440*Math.pow(2,(n+19-69)/12),440*Math.pow(2,(n+19-69)/12),spb*6,.035,.05);
   this.beat++;this.next+=spb;}}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,v=false){const g=hiss(this.ac,this.noise,this.fx,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,0,20);if(v)g.connect(this.verb);}
 _o(type,f0,f1,dur,vol,delay=0,v=false){const g=tone(this.ac,this.fx,this.ac.currentTime+delay,type,f0,f1,dur,vol,.004);if(v)g.connect(this.verb);}
 play(k,a=1,b){if(!this.ac||!this.on)return;try{switch(k){
  case 'hit':{const s=Math.min(1,a);this._o('sine',170-s*80,38,.1+s*.25,.3+s*.35,0,s>.6);this._n(.05+s*.12,6000,400,.7,.25+s*.3);this._n(.03,9000,3000,1,.18);if(s>.6)this._o('square',80,30,.3,.15);if(b==='fire')this._n(.4,2600,500,.6,.18,'bandpass');break;}
  case 'kick':{const s=Math.min(1,a);this._o('sine',130-s*50,34,.14+s*.25,.38+s*.3,0,s>.6);this._n(.08+s*.1,2500,200,.6,.3+s*.2);break;}
  case 'block':this._o('triangle',520,380,.08,.12);this._n(.06,7000,2500,1.5,.16,'bandpass');this._o('sine',200,120,.06,.12);break;
  case 'whiff':this._n(.12+a*.1,700,2600+a*900,1.4,.06+a*.04,'bandpass');break;
  case 'grab':this._n(.1,1500,500,1,.18);this._o('sine',140,90,.1,.18);break;
  case 'break':this._o('triangle',900,1400,.15,.12);this._n(.15,8000,3000,1.5,.14,'highpass');break;
  case 'slam':this._n(.5,1800,60,.6,.5,'lowpass',0,true);this._o('sine',90,26,.6,.6);break;
  case 'land':this._o('sine',100,40,.12,Math.min(.3,.08+a*.4));this._n(.1,800,200,.6,.08);break;
  case 'super':this._o('sawtooth',110,880,.6,.12);this._o('sine',220,1760,.7,.1,.05);this._n(.8,400,6000,.8,.2,'bandpass',0,true);break;
  case 'superHit':this._n(.9,3000,60,.5,.5,'lowpass',0,true);this._o('sine',70,24,1,.6);break;
  case 'parry':this._o('sine',1600,2400,.2,.14);this._o('triangle',2400,3200,.25,.08,.04,true);break;
  case 'proj':this._o(a?'sawtooth':'triangle',a?400:700,a?200:300,.25,.08);this._n(.2,3000,900,1.4,.1,'bandpass');break;
  case 'clash':this._o('square',1200,600,.15,.08);this._n(.2,6000,1500,1,.12);break;
  case 'ko':this._n(1.6,3500,50,.5,.6,'lowpass',0,true);this._o('sine',70,22,1.4,.6);break;
  case 'wall':this._n(.3,1200,80,.6,.4);this._o('sine',110,40,.3,.4);break;
  case 'beep':this._o('square',a?988:740,a?988:740,a?.4:.12,.08);break;
  case 'tick':this._o('square',1500,1500,.04,.04);break;
  case 'select':this._o('triangle',660,990,.08,.08);break;
  case 'confirm':[523,659,784].forEach((f,i)=>this._o('square',f,f,.12,.05,i*.05));break;
  case 'cheer':this._n(2.4,600,1400,.4,.22,'bandpass');this._n(1.8,2000,900,.5,.12,'bandpass',.2);break;
  case 'dash':this._n(.12,500,1600,1.2,.06,'bandpass');break;
  case 'quake':this._n(.8,600,40,.5,.5);this._o('sine',60,26,.8,.5);break;
 }}catch(e){}}
 say(txt,rate=.92,pitch=.55){if(!this.voice||!this.on||!window.speechSynthesis)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.rate=rate;u.pitch=pitch;u.volume=.95;speechSynthesis.speak(u);}catch(e){}}
}
