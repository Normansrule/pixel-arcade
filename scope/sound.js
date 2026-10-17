// LONG SHOT — WebAudio synthesis (no audio files): rifle reports with valley echo, suppressed shots, bolt work,
// impacts, explosions, incoming fire, heartbeat on a held breath, alarm siren, slow-motion filter and ambient beds.
import {boot,master,gain,noiseBuf,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.on=true;this.amb=[];this.slow=0;}
 init(){if(this.ac)return;boot(this,ac=>{this.lp=ac.createBiquadFilter();this.lp.type='lowpass';this.lp.frequency.value=20000;this.out=master(ac,.8,-14,12,this.lp);
  const n=ac.sampleRate*2;this.noise=noiseBuf(ac);
  // brown noise for wind / surf beds
  const bb=ac.createBuffer(1,n,ac.sampleRate),bd=bb.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=(l+.02*(Math.random()*2-1))/1.02;bd[i]=l*3.5;}this.brown=bb;
  this.ambG=gain(ac,0,this.out);});}
 resume(){if(this.ac&&this.ac.state==='suspended')this.ac.resume();}
 _src(buf,loop){const s=this.ac.createBufferSource();s.buffer=buf;s.loop=!!loop;return s;}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,dest){hiss(this.ac,this.noise,dest||this.out,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,.004,20);}
 _o(type,f0,f1,dur,vol,delay=0){tone(this.ac,this.out,this.ac.currentTime+delay,type,f0,f1,dur,vol,.008);}
 play(k,a=1,b=0){if(!this.ac||!this.on)return;try{switch(k){
  case'shot':{this._n(.09,9000,1800,.6,.75*a);this._o('sine',140,38,.45,.7*a);this._n(.5,1600,120,.7,.5*a);for(let i=1;i<=5;i++)this._n(.7,900/i+200,90,.6,.22*a/i,'lowpass',.22*i+Math.random()*.1);break;}
  case'shotS':this._n(.08,2400,300,.8,.5);this._o('sine',120,50,.12,.35);this._n(.05,6000,4000,4,.12,'bandpass',.02);break;
  case'bolt':this._n(.04,3500,2500,6,.25,'bandpass',.05);this._n(.05,2200,1800,6,.25,'bandpass',.22);this._n(.04,4200,3000,6,.28,'bandpass',.42*a);this._n(.05,2600,2000,8,.3,'bandpass',.58*a);break;
  case'semi':this._n(.04,4200,3000,6,.2,'bandpass',.02);break;
  case'reload':this._n(.06,1800,1200,5,.3,'bandpass',.1);this._n(.08,1200,900,5,.35,'bandpass',.9);this._n(.05,3000,2600,6,.3,'bandpass',1.4);break;
  case'dry':this._n(.03,5000,4000,8,.25,'bandpass');break;
  case'zoom':this._n(.03,7000,6500,10,.05,'bandpass');break;
  case'ui':this._o('square',880,880,.05,.04);break;
  case'tag':this._o('sine',1320,1760,.12,.07);this._o('sine',1760,1760,.1,.05,.08);break;
  case'hit':this._o('sine',90,40,.18,.35*a);this._n(.1,800,200,1,.25*a,'lowpass',b);break;
  case'kill':this._o('sine',660,660,.08,.05);this._o('sine',990,990,.12,.05,.07);break;
  case'impact':{const m=b;if(m==='metal'){this._o('triangle',2400+Math.random()*800,1400,.25,.12*a);this._n(.06,6000,3000,3,.15*a,'bandpass');}else if(m==='water'){this._n(.35,2500,300,.7,.2*a);}else if(m==='glass'){for(let i=0;i<5;i++)this._o('sine',3000+Math.random()*3000,2500,.2,.04*a,i*.03);}else{this._n(.12,1200,200,.8,.22*a);this._o('sine',70,40,.1,.15*a);}break;}
  case'explode':{this._n(1.8,2400,40,.6,.9*a);this._o('sine',80,22,1.6,.8*a);this._n(2.6,500,60,.5,.4*a,'lowpass',.15);for(let i=1;i<4;i++)this._n(1.2,400/i,60,.5,.2*a/i,'lowpass',.4*i);break;}
  case'whiz':this._n(.16,9000,2200,2,.28*a,'bandpass');this._n(.05,4000,1500,1,.25*a,'highpass',.02);break;
  case'distshot':this._n(.18,1400,300,.7,.12*a,'lowpass',b);this._o('sine',110,50,.25,.08*a,b);break;
  case'scream':{const ac=this.ac,t=ac.currentTime+b;const o=ac.createOscillator();o.type='sawtooth';const f0=520+Math.random()*260;o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f0*1.25,t+.15);o.frequency.exponentialRampToValueAtTime(f0*.7,t+.7);
   const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1400;bp.Q.value=2;const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.025*a,t+.05);g.gain.exponentialRampToValueAtTime(.0008,t+.75);o.connect(bp);bp.connect(g);g.connect(this.out);o.start(t);o.stop(t+.8);break;}
  case'alarm':{const ac=this.ac,t=ac.currentTime;const o=ac.createOscillator();o.type='square';for(let i=0;i<8;i++){o.frequency.setValueAtTime(i%2?660:880,t+i*.45);}const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1600;const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.1);g.gain.setValueAtTime(.05,t+3.4);g.gain.linearRampToValueAtTime(0,t+3.6);o.connect(lp);lp.connect(g);g.connect(this.out);o.start(t);o.stop(t+3.7);break;}
  case'heart':this._o('sine',58,40,.14,.22);this._o('sine',52,38,.12,.16,.2);break;
  case'inhale':this._n(.7,500,1400,1,.06,'bandpass');break;
  case'exhale':this._n(.9,1300,400,1,.07,'bandpass');break;
  case'gasp':this._n(.5,600,1800,1,.12,'bandpass');this._n(.6,1500,400,1,.1,'bandpass',.5);break;
  case'slowmo':this._o('sawtooth',220,40,1.4,.05);this._n(1.2,3000,200,.8,.12,'lowpass');break;
  case'snap':this._o('triangle',1800,200,.3,.15);this._n(.2,5000,800,1,.25);break;
  case'rumble':this._n(4,300,40,.4,.7);this._o('sine',45,25,4,.5);break;
  case'crash':this._n(.9,1600,80,.6,.7);this._o('sine',70,30,.6,.5);break;
  case'star':this._o('sine',[523,659,784][a|0]||784,([523,659,784][a|0]||784)*1.002,.5,.08);this._o('sine',([523,659,784][a|0]||784)*2,([523,659,784][a|0]||784)*2,.3,.03);break;
  case'win':[523,659,784,1046].forEach((f,i)=>this._o('triangle',f,f,.6,.06,i*.12));break;
  case'fail':[392,330,262].forEach((f,i)=>this._o('triangle',f,f*.98,.7,.06,i*.18));break;
 }}catch(e){}}
 // ambient bed: kinds = sea | wind | rain | party | city | birds
 ambient(kinds){if(!this.ac)return;for(const a of this.amb){try{a.s.stop();}catch(e){}}this.amb=[];const ac=this.ac;
  for(const k of kinds){if(k==='party'){this.partyOn=true;continue;}const s=this._src(k==='rain'?this.noise:this.brown,true);const f=ac.createBiquadFilter();const g=ac.createGain();
   if(k==='sea'){f.type='lowpass';f.frequency.value=700;g.gain.value=.22;}else if(k==='wind'){f.type='bandpass';f.frequency.value=500;f.Q.value=.5;g.gain.value=.12;}else if(k==='rain'){f.type='highpass';f.frequency.value=2500;g.gain.value=.06;}else if(k==='city'){f.type='lowpass';f.frequency.value=260;g.gain.value=.25;}
   s.connect(f);f.connect(g);g.connect(this.ambG);s.start(0,Math.random()*1.5);this.amb.push({k,s,f,g});}
  this.ambG.gain.setTargetAtTime(.9,ac.currentTime,.8);}
 stopAmbient(){if(!this.ac)return;this.ambG.gain.setTargetAtTime(0,this.ac.currentTime,.3);this.partyOn=false;}
 update(dt,o){if(!this.ac)return;const t=this.ac.currentTime;
  for(const a of this.amb){if(a.k==='wind'){a.g.gain.setTargetAtTime(.04+o.wind*.018,t,.3);a.f.frequency.setTargetAtTime(300+o.wind*40,t,.3);}if(a.k==='sea')a.g.gain.setTargetAtTime(.14+Math.sin(t*.35)*.08,t,.4);}
  this.lp.frequency.setTargetAtTime(o.slow?600:o.muffle?900:20000,t,.08);
  // party music: muffled four-on-the-floor + pad, heard across the bay
  if(this.partyOn&&o.music!==false){this.pt=(this.pt||0)+dt;const beat=.5;if(this.pt>=beat){this.pt-=beat;this.pb=((this.pb||0)+1)%16;const v=o.musicVol??.5;
   this._o('sine',110,45,.18,.09*v);if(this.pb%4===2)this._n(.08,2400,1200,2,.025*v,'bandpass');if(this.pb%8===0){const ch=[[220,277,330],[196,247,294],[174,220,262],[196,247,294]][(this.pb/8|0)%4];for(const f of ch)this._o('triangle',f,f,1.9,.012*v);}}}
  if(o.birds&&Math.random()<dt*.25){const f=2400+Math.random()*1800;for(let i=0;i<3;i++)this._o('sine',f,f*1.3,.08,.012,i*.1);}}
}
