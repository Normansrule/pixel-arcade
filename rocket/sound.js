// ROCKET ARENA — synthesized sound (no audio files): engines, boost, hits, crowd, horn.
export class Sound{
 constructor(){this.ac=null;this.on=true;this.engines=[];}
 init(){if(this.ac)return;try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);this.out=ac.createGain();this.out.gain.value=.7;this.out.connect(comp);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  // crowd bed
  const cs=ac.createBufferSource();cs.buffer=b;cs.loop=true;const cf=ac.createBiquadFilter();cf.type='bandpass';cf.frequency.value=700;cf.Q.value=.6;this.crowd=ac.createGain();this.crowd.gain.value=.03;cs.connect(cf);cf.connect(this.crowd);this.crowd.connect(this.out);cs.start();
  for(let i=0;i<2;i++){const o=ac.createOscillator();o.type='sawtooth';const o2=ac.createOscillator();o2.type='square';const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=400;const g=ac.createGain();g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g);g.connect(this.out);o.start();o2.start();
   const bs=ac.createBufferSource();bs.buffer=b;bs.loop=true;const bf=ac.createBiquadFilter();bf.type='bandpass';bf.frequency.value=1800;bf.Q.value=.8;const bg=ac.createGain();bg.gain.value=0;bs.connect(bf);bf.connect(bg);bg.connect(this.out);bs.start();
   this.engines.push({o,o2,f,g,bf,bg});}}catch(e){this.ac=null;}}
 engine(i,speed,boost,on){const e=this.engines[i];if(!e)return;const t=this.ac.currentTime,s=Math.min(1,speed/62);e.o.frequency.setTargetAtTime(48+s*150,t,.05);e.o2.frequency.setTargetAtTime(24+s*75,t,.05);e.f.frequency.setTargetAtTime(300+s*1400,t,.05);
  e.g.gain.setTargetAtTime(on?.035+s*.04:0,t,.08);e.bg.gain.setTargetAtTime(on&&boost?.09:0,t,.04);e.bf.frequency.setTargetAtTime(1200+s*1500,t,.05);}
 hype(v){if(this.crowd)this.crowd.gain.setTargetAtTime(.03+v*.22,this.ac.currentTime,.25);}
 _n(dur,f0,f1,q,vol,type='lowpass'){const ac=this.ac,t=ac.currentTime,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
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
