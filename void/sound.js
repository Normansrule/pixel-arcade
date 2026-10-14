// VOIDWING — synthesized audio: engine hum + boost roar, laser zaps, missiles, lock tones, alarms, shield crackle, explosions.
export class Sound{
 constructor(){this.ac=null;this.on=true;}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.connect(ac.destination);
  this.out=ac.createGain();this.out.gain.value=.7;this.out.connect(comp);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  const bb=ac.createBuffer(1,n,ac.sampleRate),db=bb.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=(l+.02*(Math.random()*2-1))/1.02;db[i]=l*3.5;}this.brown=bb;
  const loop=(buf,type,f,q)=>{const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(this.out);s.start(0,Math.random()*1.5);return{s,f:fl,g};};
  // engine: two detuned saws through a lowpass + noise rumble
  const o1=ac.createOscillator(),o2=ac.createOscillator();o1.type='sawtooth';o2.type='sawtooth';o2.detune.value=14;const ef=ac.createBiquadFilter();ef.type='lowpass';ef.frequency.value=300;ef.Q.value=4;const eg=ac.createGain();eg.gain.value=0;o1.connect(ef);o2.connect(ef);ef.connect(eg);eg.connect(this.out);o1.start();o2.start();this.eng={o1,o2,f:ef,g:eg};
  this.hum=loop(this.brown,'lowpass',180,.8);this.boost=loop(b,'bandpass',700,.6);this.drift=loop(b,'highpass',3000,.5);
  const lt=ac.createOscillator();lt.type='square';lt.frequency.value=900;const lf=ac.createBiquadFilter();lf.type='lowpass';lf.frequency.value=2500;const lg=ac.createGain();lg.gain.value=0;lt.connect(lf);lf.connect(lg);lg.connect(this.out);lt.start();this.lock={o:lt,g:lg};
  const wt=ac.createOscillator();wt.type='sawtooth';wt.frequency.value=700;const wg=ac.createGain();wg.gain.value=0;const wl=ac.createBiquadFilter();wl.type='lowpass';wl.frequency.value=2200;wt.connect(wl);wl.connect(wg);wg.connect(this.out);wt.start();this.warn={o:wt,g:wg};
 }catch(e){this.ac=null;}}
 suspend(on){if(this.ac){if(on)this.ac.suspend();else this.ac.resume();}}
 engine(st){if(!this.ac)return;const t=this.ac.currentTime,k=.08,on=st.on&&this.on?1:0;const sp=Math.min(1,st.speed/300);
  this.eng.o1.frequency.setTargetAtTime(42+sp*60+st.thr*20,t,k);this.eng.o2.frequency.setTargetAtTime(84+sp*120,t,k);this.eng.f.frequency.setTargetAtTime(200+st.thr*500+(st.boost?900:0),t,k);this.eng.g.gain.setTargetAtTime(on*(.03+st.thr*.035),t,k);
  this.hum.g.gain.setTargetAtTime(on*.12,t,k);this.boost.f.frequency.setTargetAtTime(st.boost?1400:600,t,.2);this.boost.g.gain.setTargetAtTime(on*(st.boost?.22:0),t,.12);this.drift.g.gain.setTargetAtTime(on*(st.drift?.05:0),t,.1);
  const L=st.lock;this.lock.g.gain.setTargetAtTime(on&&L?.03:0,t,.02);if(L){this.lock.o.frequency.setTargetAtTime(L===2?1500:L===3?600:760+Math.floor(t*12)%2*120,t,.01);}
  const w=st.warn&&(Math.floor(t*(st.warn>1?10:4))%2===0);this.warn.g.gain.setTargetAtTime(on&&w?.04:0,t,.01);if(st.warn)this.warn.o.frequency.setTargetAtTime(st.warn>1?950:700,t,.01);}
 off(){if(!this.ac)return;const t=this.ac.currentTime;for(const g of[this.eng.g,this.hum.g,this.boost.g,this.drift.g,this.lock.g,this.warn.g])g.gain.setTargetAtTime(0,t,.05);}
 _n(dur,f0,f1,q,vol,type='lowpass',buf,delay=0){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=buf||this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur+.05);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'laser0':this._o('square',1400,180,.13,.05);this._o('sawtooth',900,120,.1,.03);this._n(.05,4000,800,1,.03,'bandpass');break;
  case'laser1':this._o('sawtooth',700,90,.16,.05);this._o('square',520,70,.12,.03);this._n(.06,2500,400,1,.04,'bandpass');break;
  case'heavy':this._o('square',600,60,.2,.07);this._o('sine',160,40,.2,.12);this._n(.08,2000,300,1,.05,'bandpass');break;
  case'enemyLaser':this._o('square',1100*(.9+Math.random()*.2),200,.08,.018*a);break;
  case'turret':this._o('sawtooth',300,50,.25,.03*a);this._n(.15,1200,200,.8,.03*a);break;
  case'hit':this._o('sine',2400,1800,.05,.05);this._o('triangle',3600,2800,.04,.025,.02);break;
  case'shieldHit':this._n(.2,6000,1500,2,.07,'bandpass');this._o('sine',900,500,.12,.03);break;
  case'hullHit':this._n(.22,900,120,1.2,.25,'lowpass',this.brown);this._o('square',180,60,.12,.06);break;
  case'kill':this._o('sine',880,880,.12,.08);this._o('sine',1320,1320,.2,.08,.1);break;
  case'sub':this._o('triangle',660,660,.12,.08);this._o('triangle',990,990,.18,.08,.1);this._o('triangle',1320,1320,.25,.07,.2);break;
  case'msl':this._n(.9,300,3200,.7,.22,'bandpass');this._n(1.2,200,60,.6,.2,'lowpass',this.brown);break;
  case'torp':this._n(1.4,180,1600,.8,.28,'bandpass');this._o('sine',90,40,.8,.2);break;
  case'cm':this._n(.4,7000,2500,1,.12,'highpass');for(let i=0;i<5;i++)this._n(.05,6000,4000,3,.05,'bandpass',null,i*.05);break;
  case'boom':{const v=Math.min(1,a);this._n(1.6,1400,40,.5,.6*v,'lowpass',this.brown);this._n(.5,4000,300,.8,.22*v);this._o('sine',60,22,1,.4*v);break;}
  case'bigboom':this._n(4,800,25,.5,.9,'lowpass',this.brown);this._n(1.5,3000,100,.6,.4);this._o('sine',45,18,3,.6);break;
  case'boostOn':this._n(.5,300,2400,.8,.12,'bandpass');break;
  case'ui':this._o('sine',880,1320,.08,.06);break;
  case'pip':this._o('triangle',520+a*160,520+a*160,.07,.06);break;
  case'win':[523,659,784,1046].forEach((f,i)=>this._o('triangle',f,f,.5,.07,i*.12));break;
  case'lose':[392,330,262].forEach((f,i)=>this._o('triangle',f,f*.98,.6,.07,i*.18));break;
  case'banner':this._o('sine',660,990,.25,.06);this._o('sine',990,990,.3,.05,.12);break;
  case'warp':this._n(1.2,200,4000,.8,.15,'bandpass');this._o('sine',80,400,1,.08);break;}}catch(e){}}}
