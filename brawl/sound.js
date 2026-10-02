// PLATFORM BRAWL — synthesized audio (no files): impacts scaled by knockback, whooshes, shields, KO blasts, crowd and an announcer voice.
export class Sound{
 constructor(){this.ac=null;this.on=true;this.voice=true;}
 init(){if(this.ac)return;try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);this.out=ac.createGain();this.out.gain.value=.65;this.out.connect(comp);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  const cs=ac.createBufferSource();cs.buffer=b;cs.loop=true;const cf=ac.createBiquadFilter();cf.type='bandpass';cf.frequency.value=900;cf.Q.value=.5;this.crowd=ac.createGain();this.crowd.gain.value=0;cs.connect(cf);cf.connect(this.crowd);this.crowd.connect(this.out);cs.start();}catch(e){this.ac=null;}}
 hype(v){if(this.ac)this.crowd.gain.setTargetAtTime(Math.min(.3,.02+v*.26),this.ac.currentTime,.3);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
 play(k,a=1,fx){if(!this.ac||!this.on)return;try{switch(k){
  case'hit':{const s=Math.min(1,a/160);this._o('sine',190-s*90,40,.18+s*.4,.18+s*.35);this._n(.08+s*.35,5000,300,.8,.12+s*.4);if(s>.5)this._o('square',90,30,.5,.12);
   if(fx==='elec')this._o('sawtooth',1400,300,.18,.06);if(fx==='fire')this._n(.35,2500,600,.6,.15,'bandpass');if(fx==='water')this._n(.3,1200,4000,2,.12,'bandpass');if(fx==='dark')this._o('triangle',600,120,.25,.08);break;}
  case'light':this._o('sine',320,120,.08,.12);this._n(.05,6000,1500,.8,.08);break;
  case'swing':this._n(.16+a*.12,500,2400+a*800,1.2,.05+a*.04,'bandpass');break;
  case'jump':this._n(.12,700,2200,1.6,.05,'bandpass');break;
  case'djump':this._n(.16,900,3000,1.6,.06,'bandpass');this._o('sine',300,600,.12,.04);break;
  case'land':this._o('sine',110,45,.1,Math.min(.18,.05+a*.3));break;
  case'shield':this._o('triangle',880,620,.12,.08);this._n(.08,8000,3000,2,.05,'highpass');break;
  case'break':this._o('sawtooth',600,80,.9,.2);this._n(.6,6000,300,.6,.25);[0,.1,.2].forEach(d=>this._o('square',1200,900,.08,.06,d));break;
  case'grab':this._n(.1,1800,600,1,.1);break;
  case'throw':this._n(.25,400,1800,1,.12,'bandpass');break;
  case'proj':this._o(a===1?'sawtooth':'triangle',900,300,.18,.06);this._n(.1,3000,1200,1.5,.05,'bandpass');break;
  case'boom':this._n(1.1,1800,60,.7,.55);this._o('sine',110,28,.9,.45);break;
  case'ko':this._n(1.6,3500,50,.5,.6);this._o('sine',80,24,1.4,.5);this._o('sawtooth',220,55,.8,.08);this._n(1.2,800,3000,.5,.15,'bandpass',.25);break;
  case'star':this._o('sine',880,1760,.5,.07);this._o('sine',1320,2640,.4,.05,.1);break;
  case'heal':[523,659,784,1046].forEach((f,i)=>this._o('sine',f,f,.25,.07,i*.07));break;
  case'power':[392,523,659].forEach((f,i)=>this._o('square',f,f*1.01,.2,.04,i*.06));break;
  case'beep':this._o('square',a?1046:784,a?1046:784,a?.5:.16,.07);break;
  case'tick':this._o('square',1500,1500,.05,.04);break;
  case'counter':this._o('triangle',1200,2400,.18,.1);this._n(.2,6000,2000,2,.1,'highpass');break;
  case'reflect':this._o('sine',1600,2600,.15,.08);break;
  case'warn':this._o('square',660,660,.12,.05);this._o('square',880,880,.12,.05,.14);break;
  case'cheer':this._n(2.2,700,1400,.4,.18,'bandpass');this._n(1.6,2000,900,.5,.1,'bandpass',.2);break;
  case'charge':this._o('sawtooth',200+a*600,220+a*600,.05,.02);break;
 }}catch(e){}}
 say(txt,rate=.95,pitch=.7){if(!this.voice||!this.on||!window.speechSynthesis)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.rate=rate;u.pitch=pitch;u.volume=.9;speechSynthesis.speak(u);}catch(e){}}
}
