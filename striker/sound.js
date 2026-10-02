// STRIKER 11 — synthesized audio (no files): crowd bed + roars, referee whistle, ball strikes, post, net, chants.
export class Sound{
 constructor(){this.ac=null;this.on=true;this.hypeV=0;}
 init(){if(this.ac)return;try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);this.out=ac.createGain();this.out.gain.value=.75;this.out.connect(comp);
  const n=ac.sampleRate*3,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let p=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;p=p*.97+w*.03;d[i]=w*.6+p*3;}this.noise=b;
  // crowd bed: two band-passed noise layers with slow swells
  const bed=(f,q,g)=>{const s=ac.createBufferSource();s.buffer=b;s.loop=true;s.playbackRate.value=.7+Math.random()*.2;const bf=ac.createBiquadFilter();bf.type='bandpass';bf.frequency.value=f;bf.Q.value=q;const gg=ac.createGain();gg.gain.value=g;s.connect(bf);bf.connect(gg);gg.connect(this.out);s.start();return{gg,bf};};
  this.bedA=bed(520,.7,.05);this.bedB=bed(1400,.9,.025);
  const lfo=ac.createOscillator();lfo.frequency.value=.13;const lg=ac.createGain();lg.gain.value=.018;lfo.connect(lg);lg.connect(this.bedA.gg.gain);lfo.start();}catch(e){this.ac=null;}}
 hype(v){if(!this.ac)return;const t=this.ac.currentTime;this.bedA.gg.gain.setTargetAtTime(.05+v*.3,t,.3);this.bedB.gg.gain.setTargetAtTime(.025+v*.16,t,.3);this.bedA.bf.frequency.setTargetAtTime(520+v*260,t,.4);}
 _n(dur,f0,f1,q,vol,type='bandpass',delay=0,att=.01){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random()*2);s.stop(t+dur+.05);}
 _o(type,f0,f1,dur,vol,delay=0,att=.008){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.03);}
 whistle(len=.35,delay=0){const ac=this.ac,t=ac.currentTime+delay;const o=ac.createOscillator(),o2=ac.createOscillator(),lfo=ac.createOscillator(),lg=ac.createGain(),g=ac.createGain();o.frequency.value=2850;o2.frequency.value=2930;lfo.frequency.value=38;lg.gain.value=180;
  lfo.connect(lg);lg.connect(o.frequency);lg.connect(o2.frequency);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.02);g.gain.setValueAtTime(.07,t+len);g.gain.exponentialRampToValueAtTime(.001,t+len+.08);
  o.connect(g);o2.connect(g);g.connect(this.out);[o,o2,lfo].forEach(x=>{x.start(t);x.stop(t+len+.1);});}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'kick':this._o('sine',150+a*2,55,.12,Math.min(.45,.12+a*.012));this._n(.05,3000,900,1.2,Math.min(.25,a*.01),'bandpass');break;
  case'touch':this._o('sine',120,60,.07,.08);break;
  case'bounce':this._o('sine',95,45,.1,Math.min(.18,a*.025));break;
  case'post':[880,1320,1990,2650].forEach((f,i)=>this._o('sine',f,f*.98,.9-i*.15,.07/(i+1)));this._o('sine',220,180,.3,.12);break;
  case'net':this._n(.35,5200,1800,.6,Math.min(.22,.05+a*.01),'highpass');break;
  case'tackle':this._n(.12,700,200,1,.18,'lowpass');this._o('sine',110,50,.12,.12);break;
  case'whistle':this.whistle(a===2?.85:a===3?.18:.32);if(a===3){this.whistle(.18,.28);this.whistle(.8,.56);}break;
  case'roar':this._n(3.2,700,500,.5,.38,'bandpass',0,.25);this._n(3,1900,1200,.7,.16,'bandpass',.05,.3);break;
  case'ooh':this._n(1.5,500,900,1.6,.2,'bandpass',0,.25);this._n(1.4,1100,700,2,.08,'bandpass',.1,.3);break;
  case'groan':this._n(1.3,600,300,1.2,.16,'bandpass',0,.15);break;
  case'clap':for(let i=0;i<3;i++)this._n(.09,2200,1500,.8,.12,'bandpass',i*.33);break;
  case'card':this._o('square',520,520,.12,.04);break;
  case'ui':this._o('sine',a?990:660,a?990:660,.08,.06);break;}}catch(e){}}}
