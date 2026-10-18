// HARBOR PALS — synthesized audio only: waves + gull ambience, footsteps, pal voices (one timbre per species), dig, bridge creak,
// zap, splash, winch, jingles and a soft marimba loop. Nothing plays before the first click (boot() runs from a user gesture).
import {boot,master,gain,noiseBuf,reverb,bed,tone,hiss} from '../js/kit3d/audio.js';
const N=n=>440*Math.pow(2,(n-69)/12),R=Math.random;
const SCALE=[0,2,4,7,9,12,14,16,19,21];
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.mus=.5;this.on=false;this.step=0;this.nextT=0;this.urg=0;}
 init(){boot(this,ac=>{this.master=master(ac,this.vol,-14,4);this.sfx=gain(ac,1,this.master);this.musG=gain(ac,this.mus*.4,this.master);this.noise=noiseBuf(ac);this.verb=reverb(ac,1.6,3,.22,this.master);
  this.waves=bed(ac,this.noise,'lowpass',420,.6,this.master,0);this.wash=bed(ac,this.noise,'bandpass',900,.4,this.master,0,.7);
  this.timer=setInterval(()=>this.tick(),40);});}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 setMusic(v){this.mus=v;if(this.musG)this.musG.gain.value=v*.4;}
 run(on){this.on=on;if(!this.ac)return;const t=this.ac.currentTime;this.waves.g.gain.setTargetAtTime(on?.16:0,t,.6);this.wash.g.gain.setTargetAtTime(on?.03:0,t,.6);}
 tick(){if(!this.ac||!this.on)return;const ac=this.ac,t=ac.currentTime;
  // wave swell
  const sw=.12+.08*Math.sin(t*.7)+.05*Math.sin(t*1.9);this.waves.g.gain.setTargetAtTime(sw,t,.3);this.waves.f.frequency.setTargetAtTime(300+sw*900,t,.3);
  if(R()<.004)this.gull();
  // marimba loop: 8th notes, pentatonic, I-vi-IV-V shape; the tide urgency adds a ticking pulse
  if(this.nextT<t)this.nextT=t+.05;const spb=60/(96+this.urg*24)/2;
  while(this.nextT<t+.15){const st=this.step++,bar=(st>>3)%4,root=[60,57,53,55][bar];const q=this.nextT;
   if(st%2===0||R()<.35){const deg=SCALE[(st*3+bar*2+(st>>4))%7];this.mar(N(root+12+deg),q,.07);}
   if(st%8===0){this.mar(N(root-12),q,.12,true);this.mar(N(root),q,.05);}
   if(st%8===4)this.mar(N(root-5),q,.08,true);
   if(this.urg>.6&&st%2===0)tone(ac,this.sfx,q,'square',2400,2000,.02,.012*this.urg);
   this.nextT+=spb;}}
 mar(f,t,v,low){const ac=this.ac;tone(ac,this.musG,t,'sine',f,f,low?.5:.32,v,.003);tone(ac,this.musG,t,'sine',f*4,f*4,.08,v*.25,.002);}
 gull(){const ac=this.ac,t=ac.currentTime;for(let i=0;i<2+R()*2|0;i++){const f=1400+R()*500;tone(ac,this.sfx,t+i*.18,'triangle',f,f*.7,.16,.025).connect(this.verb);}}
 play(k,a=1){if(!this.ac)return;const ac=this.ac,t=ac.currentTime,s=this.sfx;try{switch(k){
  case'step':hiss(ac,this.noise,s,t,.06,1800,700,1,.05*a,'bandpass');break;
  case'stepw':hiss(ac,this.noise,s,t,.07,600,300,2,.06*a,'bandpass');tone(ac,s,t,'sine',140,90,.06,.02*a);break;
  case'click':tone(ac,s,t,'triangle',900,700,.06,.06);break;
  case'mollo':for(let i=0;i<3;i++)tone(ac,s,t+i*.07,'square',900+i*160+R()*80,1300+i*120,.06,.04).connect(this.verb);break;
  case'stilt':tone(ac,s,t,'triangle',300,240,.28,.12).connect(this.verb);tone(ac,s,t+.22,'triangle',360,300,.3,.1).connect(this.verb);break;
  case'fizz':for(let i=0;i<5;i++)tone(ac,s,t+i*.05,'sine',N(84+SCALE[i]),N(84+SCALE[i])*1.01,.25,.05).connect(this.verb);break;
  case'whistle':tone(ac,s,t,'sine',1200,1800,.12,.06);tone(ac,s,t+.14,'sine',1500,2100,.14,.06);break;
  case'dig':for(let i=0;i<7;i++)hiss(ac,this.noise,s,t+i*.14,.1,2200,600,1.2,.09,'bandpass');break;
  case'find':[72,76,79,84].forEach((n,i)=>tone(ac,s,t+i*.08,'triangle',N(n),N(n),.3,.09).connect(this.verb));break;
  case'junk':tone(ac,s,t,'triangle',300,180,.3,.08);tone(ac,s,t+.12,'triangle',240,140,.3,.07);break;
  case'creak':tone(ac,s,t,'sawtooth',110,80,.6,.03);hiss(ac,this.noise,s,t,.5,500,300,4,.05,'bandpass');break;
  case'bridge':tone(ac,s,t,'triangle',220,330,.25,.1);tone(ac,s,t+.18,'triangle',330,440,.3,.1).connect(this.verb);hiss(ac,this.noise,s,t+.1,.3,800,300,2,.06,'bandpass');break;
  case'zap':for(let i=0;i<6;i++){tone(ac,s,t+i*.05,'sawtooth',2000+R()*2000,300,.06,.05);hiss(ac,this.noise,s,t+i*.05,.05,6000,3000,1,.06,'highpass');}break;
  case'power':tone(ac,s,t,'sawtooth',80,220,.9,.08);tone(ac,s,t+.6,'square',440,440,.12,.04);tone(ac,s,t+.75,'square',660,660,.18,.04);break;
  case'winch':tone(ac,s,t,'square',90+R()*10,80,.09,.025);hiss(ac,this.noise,s,t,.08,1200,900,3,.025,'bandpass');break;
  case'splash':hiss(ac,this.noise,s,t,.7,3000,300,.8,.3);tone(ac,s,t,'sine',300,80,.4,.12);break;
  case'poof':hiss(ac,this.noise,s,t,.25,4000,800,1,.08,'bandpass');tone(ac,s,t,'sine',900,1800,.12,.04);break;
  case'pick':tone(ac,s,t,'triangle',660,990,.12,.08);tone(ac,s,t+.08,'triangle',990,1320,.15,.07);break;
  case'hook':tone(ac,s,t,'square',220,220,.05,.06);hiss(ac,this.noise,s,t,.12,3000,1500,2,.08,'bandpass');tone(ac,s,t+.1,'triangle',880,880,.2,.07);break;
  case'no':tone(ac,s,t,'triangle',330,220,.18,.08);tone(ac,s,t+.16,'triangle',260,180,.2,.07);break;
  case'warn':tone(ac,s,t,'triangle',880,880,.15,.08);tone(ac,s,t+.2,'triangle',660,660,.2,.08);break;
  case'win':[60,64,67,72,76,79,84].forEach((n,i)=>{tone(ac,s,t+i*.1,'triangle',N(n),N(n),.5,.1).connect(this.verb);tone(ac,s,t+i*.1,'sine',N(n+12),N(n+12),.3,.04);});break;
  case'lose':[67,63,60,55].forEach((n,i)=>tone(ac,s,t+i*.22,'triangle',N(n),N(n)*.98,.5,.1).connect(this.verb));hiss(ac,this.noise,s,t,1.6,900,200,.6,.12);break;
  case'horn':tone(ac,s,t,'sawtooth',146,146,1.1,.06,.08).connect(this.verb);tone(ac,s,t,'sawtooth',220,220,1.1,.04,.08);break;
 }}catch(e){}}}
