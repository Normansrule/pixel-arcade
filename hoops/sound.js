// COURT KINGS — synthesized audio (no files): crowd bed + roars, dribbles, sneaker squeaks, swish, rim clank, glass,
// slam, whistle, horn, buzzer and a little arena organ.
import {boot,master,gain,tone,hiss,reverb} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.on=true;this.street=false;}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}boot(this,ac=>{this.out=master(ac,.8,-22,10);this.wet=reverb(ac,1.8,3,.22,this.out);
  const n=ac.sampleRate*3,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let p=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;p=p*.97+w*.03;d[i]=w*.6+p*3;}this.noise=b;
  const bed=(f,q,g)=>{const s=ac.createBufferSource();s.buffer=b;s.loop=true;s.playbackRate.value=.7+Math.random()*.2;const bf=ac.createBiquadFilter();bf.type='bandpass';bf.frequency.value=f;bf.Q.value=q;const gg=gain(ac,g,this.out);s.connect(bf);bf.connect(gg);s.start();return{gg,bf};};
  this.bedA=bed(480,.7,.04);this.bedB=bed(1300,.9,.02);const lfo=ac.createOscillator();lfo.frequency.value=.11;const lg=gain(ac,.015,this.bedA.gg.gain);lfo.connect(lg);lfo.start();});}
 setVenue(street){this.street=street;}
 hype(v){if(!this.ac)return;const t=this.ac.currentTime,k=this.street?.45:1;this.bedA.gg.gain.setTargetAtTime((.04+v*.28)*k,t,.3);this.bedB.gg.gain.setTargetAtTime((.02+v*.14)*k,t,.3);this.bedA.bf.frequency.setTargetAtTime(480+v*280,t,.4);}
 _n(dur,f0,f1,q,vol,type='bandpass',delay=0,att=.01,wet=0){const g=hiss(this.ac,this.noise,this.out,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,att,20);if(wet&&!this.street)g.connect(this.wet);}
 _o(type,f0,f1,dur,vol,delay=0,att=.006,wet=0){const g=tone(this.ac,this.out,this.ac.currentTime+delay,type,f0,f1,dur,vol,att);if(wet&&!this.street)g.connect(this.wet);}
 whistle(len=.35,delay=0){const ac=this.ac,t=ac.currentTime+delay;const o=ac.createOscillator(),o2=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),g=ac.createGain();o.frequency.value=2850;o2.frequency.value=2930;lfo.frequency.value=38;lg.gain.value=180;
  lfo.connect(lg);lg.connect(o.frequency);lg.connect(o2.frequency);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+.02);g.gain.setValueAtTime(.06,t+len);g.gain.exponentialRampToValueAtTime(.001,t+len+.08);
  o.connect(g);o2.connect(g);g.connect(this.out);if(!this.street)g.connect(this.wet);[o,o2,lfo].forEach(x=>{x.start(t);x.stop(t+len+.1);});}
 buzzer(len=1.1){const ac=this.ac,t=ac.currentTime;for(const f of[196,201,392]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.045,t+.02);g.gain.setValueAtTime(.045,t+len);g.gain.exponentialRampToValueAtTime(.001,t+len+.1);
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1800;o.connect(lp);lp.connect(g);g.connect(this.out);g.connect(this.wet);o.start(t);o.stop(t+len+.15);}}
 organ(seq){const ac=this.ac;let t=0;for(const[f,d]of seq){for(const m of[1,2,3]){this._o('sine',f*m,f*m,d*.95,.05/m,t,.01,1);}t+=d;}}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'dribble':this._o('sine',95+a*10,48,.09,Math.min(.22,.08+a*.03));this._n(.03,1800,600,1,.04*a,'bandpass');break;
  case'floor':this._o('sine',90,45,.1,Math.min(.2,a*.03));break;
  case'squeak':{const f=2200+Math.random()*900;const ac=this.ac,t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain(),l=ac.createOscillator(),lg=ac.createGain();o.frequency.setValueAtTime(f,t);o.frequency.linearRampToValueAtTime(f*1.18,t+.08);l.frequency.value=70;lg.gain.value=120;l.connect(lg);lg.connect(o.frequency);
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.022*a,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.11);o.connect(g);g.connect(this.out);if(!this.street)g.connect(this.wet);o.start(t);l.start(t);o.stop(t+.13);l.stop(t+.13);break;}
  case'swish':this._n(.32,5200,2400,.7,.16,'highpass',0,.02);this._n(.2,3000,1500,1.2,.07,'bandpass',.04);break;
  case'chain':for(let i=0;i<7;i++)this._o('triangle',2400+Math.random()*2400,2000,.12,.03,i*.025);break;
  case'rim':{const v=Math.min(1,a/6);[523,1187,1840,2710,3420].forEach((f,i)=>this._o('sine',f,f*.995,.5-i*.06,(.09*v+.02)/(i+1),0,.002,1));this._o('square',180,120,.07,.05*v);break;}
  case'board':this._o('sine',160,90,.14,.16);this._n(.12,1200,400,1,.1,'lowpass',0,.002,1);break;
  case'slam':this._o('sine',120,40,.35,.35,0,.004,1);this._n(.25,900,200,.8,.25,'lowpass',0,.003,1);[700,1300,2100].forEach((f,i)=>this._o('sine',f,f*.98,.6,.05/(i+1),.01,.002,1));break;
  case'catch':this._n(.05,1500,500,1,.08,'bandpass');break;
  case'pass':this._n(.06,900,400,1,.04,'bandpass');break;
  case'block':this._o('sine',140,60,.15,.25);this._n(.1,1500,400,1,.15,'bandpass');break;
  case'whistle':this.whistle(a===2?.7:.32);if(a===3){this.whistle(.18,.3);this.whistle(.7,.56);}break;
  case'buzzer':this.buzzer(a);break;
  case'horn':this.buzzer(.45);break;
  case'roar':this._n(3,700,500,.5,.34,'bandpass',0,.2);this._n(2.8,1900,1200,.7,.14,'bandpass',.05,.25);break;
  case'ooh':this._n(1.4,500,900,1.6,.18,'bandpass',0,.22);this._n(1.3,1100,700,2,.07,'bandpass',.1,.3);break;
  case'groan':this._n(1.2,600,300,1.2,.14,'bandpass',0,.15);break;
  case'cheer':this._n(1.6,900,700,.6,.2,'bandpass',0,.08);break;
  case'charge':if(!this.street)this.organ([[392,.14],[523,.14],[659,.14],[784,.28],[659,.14],[784,.5]]);break;
  case'defense':if(!this.street){for(let i=0;i<4;i++)this._n(.09,2200,1500,.8,.12,'bandpass',i*.33+(i>1?.12:0));}break;
  case'ui':this._o('sine',a?990:660,a?990:660,.08,.06);break;
  case'green':this._o('sine',880,1760,.18,.08);this._o('sine',1320,1320,.25,.05,.06);break;}}catch(e){}}}
