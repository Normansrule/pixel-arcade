// RUNLINE — synthesized audio: footsteps, wind, slides, wall-runs, grapple, pickups and a procedural electronic score per district.
import {boot,master,gain,noiseBuf,reverb,bed,tone,hiss} from '../js/kit3d/audio.js';
const R=Math.random;
const N=n=>440*Math.pow(2,(n-69)/12);
// district songs: chords (midi roots + intervals), bass pattern, tempo
const SONGS=[
 {bpm:124,ch:[[57,[0,3,7,10]],[53,[0,4,7,11]],[48,[0,4,7,9]],[55,[0,4,7,10]]],arp:[0,2,1,3,2,1,3,2],bass:'x.x.x.xxx.x.x.x.',hat:'.x.x.x.x.x.x.x.x',snare:'....x.......x...'},
 {bpm:128,ch:[[50,[0,3,7,10]],[46,[0,4,7,11]],[43,[0,3,7,10]],[45,[0,4,7,10]]],arp:[0,1,2,3,0,2,1,3],bass:'xx.xx.x.xx.xx.x.',hat:'xxxxxxxxxxxxxxxx',snare:'....x.......x..x'},
 {bpm:116,ch:[[53,[0,4,7,11]],[57,[0,3,7,10]],[50,[0,3,7,10]],[48,[0,4,7,14]]],arp:[0,2,3,1,2,3,1,0],bass:'x...x.x.x...x.x.',hat:'..x...x...x...x.',snare:'....x.......x...'}];
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.musVol=.5;this.song=0;this.playing=false;this.step=0;this.bar=0;this.nextT=0;this.timer=null;this.speed=0;}
 init(){boot(this,ac=>{this.master=master(ac,this.vol,-12,4);this.sfx=gain(ac,1,this.master);this.mus=gain(ac,this.musVol,this.master);
  this.musF=ac.createBiquadFilter();this.musF.type='lowpass';this.musF.frequency.value=1800;this.musF.Q.value=.7;this.musF.connect(this.mus);
  const b=this.noise=noiseBuf(ac);
  this.verbIn=reverb(ac,1.4,3,.25,this.master);
  // loops: wind, slide scrape, wall patter
  const loop=(type,f,q,g0=0)=>bed(ac,b,type,f,q,this.sfx,g0,R()*1.5);
  this.wind=loop('bandpass',500,.5);this.scrape=loop('bandpass',1400,1.2);this.whine=loop('highpass',3000,.5);
  this.timer=setInterval(()=>this.schedule(),25);});}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 setMusic(v){this.musVol=v;if(this.mus)this.mus.gain.setTargetAtTime(v,this.ac.currentTime,.2);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,rev=false){if(!this.ac||vol<.002)return;const g=hiss(this.ac,this.noise,this.sfx,this.ac.currentTime+delay,dur,f0,f1,q,vol,type);if(rev)g.connect(this.verbIn);}
 _o(type,f0,f1,dur,vol,delay=0,rev=false,bus,at,atk=.005){if(!this.ac||vol<.002)return;const g=tone(this.ac,bus||this.sfx,(at??this.ac.currentTime)+delay,type,f0,f1,dur,vol,atk);if(rev)g.connect(this.verbIn);}
 // continuous movement layers
 move(speed,slide,wall,air,on){if(!this.ac)return;const t=this.ac.currentTime,s=Math.min(1,speed/26);this.speed=speed;
  this.wind.g.gain.setTargetAtTime(on?.015+s*s*.32:0,t,.12);this.wind.f.frequency.setTargetAtTime(300+s*1600,t,.1);
  this.scrape.g.gain.setTargetAtTime(on&&slide?.08+s*.12:0,t,.05);this.scrape.f.frequency.setTargetAtTime(900+s*1400,t,.05);
  this.whine.g.gain.setTargetAtTime(on&&speed>16?(speed-16)*.004:0,t,.2);
  if(this.musF)this.musF.frequency.setTargetAtTime(on?900+s*5000:1400,t,.3);}
 play(k,a=1){if(!this.ac)return;try{switch(k){
  case'step':this._n(.06,1400,400,1.2,.07+a*.05,'bandpass');this._o('sine',120,60,.06,.08+a*.04);break;
  case'wstep':this._n(.05,2200,900,1.5,.07,'bandpass');this._o('sine',160,90,.05,.06);break;
  case'jump':this._n(.16,600,1800,1.2,.09,'bandpass');this._o('sine',180,120,.08,.06);break;
  case'land':{const v=Math.min(1,Math.abs(a)/16);this._o('sine',110,40,.16,.12+v*.35);this._n(.12,1800,300,.8,.08+v*.18);break;}
  case'hard':this._o('sine',90,30,.35,.6);this._n(.3,1200,120,.7,.4,'lowpass',0,true);this._o('square',60,40,.15,.08);break;
  case'roll':this._n(.45,500,1800,.7,.18,'bandpass');this._o('sine',100,50,.2,.25);break;
  case'slide':this._n(.25,2400,900,1,.12,'bandpass');break;
  case'wallrun':this._n(.3,700,2400,1,.12,'bandpass');break;
  case'walljump':this._n(.2,900,2600,1.3,.13,'bandpass');this._o('sine',220,330,.1,.07);break;
  case'climb':this._n(.12,1600,700,1.5,.1,'bandpass');break;
  case'mantle':this._n(.22,1200,300,1,.14);this._o('sine',140,70,.15,.12);break;
  case'vault':this._n(.16,1500,500,1.2,.12,'bandpass');break;
  case'dash':this._n(.32,300,4200,.8,.22,'bandpass');this._o('sawtooth',90,220,.18,.06);break;
  case'grap':this._o('square',1400,300,.08,.06);this._n(.35,4000,900,2,.14,'bandpass');this._o('sawtooth',220,880,.4,.05);break;
  case'grapRel':this._n(.18,3000,600,1.5,.1,'bandpass');break;
  case'orb':[0,4,7,12].forEach((n,i)=>this._o('sine',N(76+n),N(76+n),.35,.09,i*.045,true));break;
  case'cp':this._o('triangle',N(72),N(72),.18,.14,0,true);this._o('triangle',N(79),N(79),.4,.14,.1,true);this._o('sine',N(84),N(84),.5,.06,.2,true);break;
  case'finish':[0,4,7,12,16,19].forEach((n,i)=>this._o('sawtooth',N(60+n),N(60+n),.9-i*.08,.06,i*.07,true));this._n(1.2,6000,2000,.5,.1,'highpass',.3,true);break;
  case'medal':[0,7,12,16,19,24].forEach((n,i)=>this._o('triangle',N(67+n),N(67+n),.6,.08,i*.06,true));break;
  case'fail':[0,-3,-7,-12].forEach((n,i)=>this._o('sawtooth',N(64+n),N(63+n),.5,.07,i*.14,true));break;
  case'zap':this._o('sawtooth',1800,80,.35,.18);this._n(.4,6000,400,.8,.25,'highpass');break;
  case'knock':this._o('sine',160,50,.3,.4);this._n(.3,2000,200,.8,.25);this._o('square',380,220,.25,.05);break;
  case'crack':this._n(.35,3500,400,.9,.25);this._o('square',90,50,.12,.06);break;
  case'respawn':this._o('sine',N(60),N(72),.3,.1);this._n(.3,800,4000,1,.06,'bandpass');break;
  case'beep':this._o('square',a?990:660,a?990:660,a?.35:.12,.06);break;
  case'click':this._o('square',1200,900,.04,.03);break;
  case'tick':this._o('square',1500,1500,.05,.05);break;}}catch(e){}}
 /* ---------- music ---------- */
 music(song,on){this.song=song;if(on&&!this.playing&&this.ac){this.playing=true;this.step=0;this.bar=0;this.nextT=this.ac.currentTime+.08;}if(!on)this.playing=false;}
 schedule(){if(!this.ac||!this.playing)return;const ac=this.ac,S=SONGS[this.song],s16=60/S.bpm/4;if(this.nextT<ac.currentTime)this.nextT=ac.currentTime+.02;
  while(this.nextT<ac.currentTime+.12){this.playStep(S,this.step,this.nextT,s16);this.nextT+=s16;this.step++;if(this.step>=16){this.step=0;this.bar++;}}}
 playStep(S,i,t,s16){const ch=S.ch[(this.bar>>1)%S.ch.length],root=ch[0],iv=ch[1],B=this.musF;
  if(i%4===0)this.kick(t);if(S.snare[i]==='x')this.snare(t);if(S.hat[i]==='x')this.hat(t,i%4===2?.05:.025);
  if(S.bass[i]==='x')this.bass(N(root-24+(i>=8&&S.bass[i-1]==='x'?7:0)),t,s16*.9);
  if(i%2===0){const n=root+12+iv[S.arp[(i/2)%8]%iv.length];this.pluck(N(n),t,s16*1.8);}
  if(i===0&&this.bar%2===0){for(const k of iv)this.pad(N(root+k),t,s16*31);}}
 kick(t){this._o('sine',150,45,.22,.55,0,false,this.mus,t,.002);}
 snare(t){const ac=this.ac,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1800;f.Q.value=.6;const g=ac.createGain();g.gain.setValueAtTime(.16,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);s.connect(f);f.connect(g);g.connect(this.musF);g.connect(this.verbIn);s.start(t,R());s.stop(t+.2);}
 hat(t,v){const ac=this.ac,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=8000;const g=ac.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.04);s.connect(f);f.connect(g);g.connect(this.musF);s.start(t,R());s.stop(t+.06);}
 bass(f,t,d){const ac=this.ac,o=ac.createOscillator(),lp=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=f;lp.type='lowpass';lp.frequency.setValueAtTime(900,t);lp.frequency.exponentialRampToValueAtTime(160,t+d);g.gain.setValueAtTime(.2,t);g.gain.setTargetAtTime(0,t+d*.7,.03);o.connect(lp);lp.connect(g);g.connect(this.mus);o.start(t);o.stop(t+d+.1);}
 pluck(f,t,d){const ac=this.ac,o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.005);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(this.musF);g.connect(this.verbIn);o.start(t);o.stop(t+d+.05);}
 pad(f,t,d){const ac=this.ac;for(const det of[-6,6]){const o=ac.createOscillator(),g=ac.createGain();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.014,t+.6);g.gain.setTargetAtTime(0,t+d-.4,.3);o.connect(g);g.connect(this.musF);o.start(t);o.stop(t+d+1);}}
}
