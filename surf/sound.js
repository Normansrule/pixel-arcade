// SWELL GUARD — synthesized audio: surf roar bed that swells with nearby breaking waves, crashes, rail hiss on carves,
// paddle splashes, the pea-whistle trill, alarm horn, gulls, crowd cheers, underwater muffle, and a laid-back surf groove.
import {boot,master,gain,noiseBuf,reverb,bed,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.music=true;this.vol=.85;this.step=0;this.nextBeat=0;this.roar=0;}
 init(){boot(this,ac=>{const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=20000;this.lp=lp;this.master=master(ac,this.vol,-12,4,lp);this.noise=noiseBuf(ac,3);
  this.sfx=gain(ac,1,this.master);this.verb=reverb(ac,2.2,3,.25,this.master);this.mus=gain(ac,.0,this.master);
  this.surf=bed(ac,this.noise,'lowpass',380,.4,this.master,.0);this.surf2=bed(ac,this.noise,'bandpass',1400,.5,this.master,0,1.1);this.wind=bed(ac,this.noise,'highpass',3000,.3,this.master,0,2);
  this.rail=bed(ac,this.noise,'bandpass',2600,1.2,this.sfx,0,.5);});}
 get t(){return this.ac?this.ac.currentTime:0;}
 // per frame: roar from breaking waves near the listener, rail hiss from carving, music clock
 update(dt,o){if(!this.ac)return;const t=this.t,s=(p,v,k=.08)=>p.setTargetAtTime(v,t,k);
  s(this.surf.g.gain,.16+o.roar*.38);s(this.surf.f.frequency,300+o.roar*700,.3);s(this.surf2.g.gain,.03+o.roar*.09);s(this.wind.g.gain,.012+o.speed*.004);
  s(this.rail.g.gain,o.carve*.22,.03);s(this.rail.f.frequency,1800+o.speed*140,.05);s(this.lp.frequency,o.under?420:20000,.06);
  s(this.mus.gain,this.music&&!o.paused?.18:0,.4);if(this.music)this.groove();
  if(Math.random()<dt*.05)this.gull(Math.random()*.5);}
 crash(vol){if(!this.ac)return;const t=this.t;hiss(this.ac,this.noise,this.sfx,t,2.4,1400,180,.6,Math.min(.55,vol),'lowpass',.05);hiss(this.ac,this.noise,this.verb,t,1.6,3000,600,.5,Math.min(.25,vol*.5),'bandpass',.02);}
 play(k,v=1){if(!this.ac)return;const ac=this.ac,t=this.t,d=this.sfx,n=this.noise;
  switch(k){
   case'whistle':{for(const f of[2650,2790]){const o=ac.createOscillator(),g=ac.createGain(),lfo=ac.createOscillator(),lg=ac.createGain();o.frequency.value=f;lfo.frequency.value=34;lg.gain.value=.5;lfo.connect(lg);lg.connect(g.gain);
     g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.09,t+.02);g.gain.setValueAtTime(.09,t+.55);g.gain.linearRampToValueAtTime(0,t+.7);o.connect(g);g.connect(d);g.connect(this.verb);o.start(t);lfo.start(t);o.stop(t+.75);lfo.stop(t+.75);}break;}
   case'horn':for(const[i,f]of[[0,440],[1,554],[2,440]].entries())tone(ac,d,t+i*.32,'sawtooth',f[1],f[1],.3,.07);break;
   case'alarm':tone(ac,d,t,'square',880,880,.12,.06);tone(ac,d,t+.16,'square',660,660,.12,.06);tone(ac,d,t+.32,'square',880,880,.16,.06);break;
   case'pop':hiss(ac,n,d,t,.35,2400,600,.8,.18,'bandpass');tone(ac,d,t,'sine',180,90,.18,.15);break;
   case'splash':hiss(ac,n,d,t,.7*v,2600,300,.6,.35*v,'lowpass');hiss(ac,n,this.verb,t,.5,4000,800,.5,.12*v,'bandpass');break;
   case'paddle':hiss(ac,n,d,t,.16,3200,900,.9,.06,'bandpass');break;
   case'duck':hiss(ac,n,d,t,.5,1200,300,.7,.18,'lowpass');tone(ac,d,t,'sine',120,60,.4,.12);break;
   case'trick':tone(ac,d,t,'triangle',660,990,.12,.08);tone(ac,d,t+.07,'triangle',990,1320,.14,.06);break;
   case'land':tone(ac,d,t,'sine',110,55,.25,.25);hiss(ac,n,d,t,.4,2000,300,.6,.2,'lowpass');break;
   case'bank':[523,659,784,1047].forEach((f,i)=>tone(ac,d,t+i*.07,'triangle',f,f,.35,.07));break;
   case'wipe':hiss(ac,n,d,t,1.4,1800,140,.5,.45,'lowpass');tone(ac,d,t,'sine',90,40,.8,.25);break;
   case'cheer':{const g=hiss(ac,n,d,t,2.2,1100,1500,.5,.0001,'bandpass',.3);g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16*v,t+.35);g.gain.exponentialRampToValueAtTime(.001,t+2.2);
    for(let i=0;i<5;i++)tone(ac,d,t+Math.random()*.8,'sine',1800+Math.random()*900,2400+Math.random()*900,.12,.02);break;}
   case'rescue':[392,494,587,784,988].forEach((f,i)=>tone(ac,d,t+i*.09,'triangle',f,f,.45,.08));this.play('cheer',.8);break;
   case'miss':tone(ac,d,t,'sawtooth',330,220,.5,.08);tone(ac,d,t+.25,'sawtooth',247,165,.6,.08);break;
   case'grab':tone(ac,d,t,'sine',520,780,.15,.12);hiss(ac,n,d,t,.3,2000,700,.7,.1,'bandpass');break;
   case'beep':tone(ac,d,t,'square',v?1320:880,v?1320:880,.1,.05);break;
   case'help':for(let i=0;i<2;i++)tone(ac,d,t+i*.28,'sine',900,1400,.2,.05);break;
   case'sting':tone(ac,d,t,'square',1200,500,.18,.06);break;
   case'bump':tone(ac,d,t,'sine',70,40,.4,.35);hiss(ac,n,d,t,.4,900,200,.6,.25,'lowpass');break;
   case'gull':this.gull(.9);break;
   case'event':tone(ac,d,t,'triangle',784,784,.18,.08);tone(ac,d,t+.2,'triangle',988,988,.25,.08);break;}}
 gull(v){if(!this.ac)return;const ac=this.ac,t=this.t;for(let i=0;i<2+Math.random()*3;i++){const s=t+i*.22;tone(ac,this.sfx,s,'sawtooth',1500+Math.random()*300,900,.18,.012*v+.004);tone(ac,this.verb,s,'sine',2600,1500,.16,.01*v);}}
 // 96 bpm: soft kick + shaker, walking bass, clean pluck arpeggio over I–vi–IV–V in E
 groove(){const ac=this.ac,spb=60/96/2;if(this.nextBeat<ac.currentTime)this.nextBeat=ac.currentTime+.05;
  while(this.nextBeat<ac.currentTime+.25){const s=this.step++,t=this.nextBeat,bar=(s>>4)%4,ch=[[40,44,47,52],[37,40,44,49],[45,49,52,57],[47,51,54,59]][bar];const f=m=>440*Math.pow(2,(m-69)/12);
   if(s%8===0)tone(ac,this.mus,t,'sine',110,45,.3,.5);if(s%2===1)hiss(ac,this.noise,this.mus,t,.05,9000,7000,.7,.05,'highpass');if(s%8===4)hiss(ac,this.noise,this.mus,t,.18,2400,900,.6,.12,'bandpass');
   if(s%4===0||s%16===14)tone(ac,this.mus,t,'triangle',f(ch[0]-12),f(ch[0]-12),.4,.22);
   if([0,3,6,8,10,13].includes(s%16)){const m=ch[[0,1,2,3,2,1][[0,3,6,8,10,13].indexOf(s%16)]]+12;const g=tone(ac,this.mus,t,'triangle',f(m),f(m),.45,.07);g.connect(this.verb);}
   this.nextBeat+=spb;}}
}
