// SKY LANCERS — synthesized audio: prop/jet engines, wind, guns, missile lock + warning tones, explosions.
export class Sound{
 constructor(){this.ac=null;this.on=true;this.gunT=0;}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.connect(ac.destination);
  this.out=ac.createGain();this.out.gain.value=.75;this.out.connect(comp);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){d[i]=Math.random()*2-1;}this.noise=b;
  const bb=ac.createBuffer(1,n,ac.sampleRate),db=bb.getChannelData(0);for(let i=0;i<n;i++){l=(l+.02*(Math.random()*2-1))/1.02;db[i]=l*3.5;}this.brown=bb;
  const loop=(buf,type,f,q)=>{const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(this.out);s.start(0,Math.random()*1.5);return{s,f:fl,g};};
  // prop engine: two detuned saws + chop LFO
  const o1=ac.createOscillator(),o2=ac.createOscillator();o1.type='sawtooth';o2.type='square';const pf=ac.createBiquadFilter();pf.type='lowpass';pf.frequency.value=600;const chop=ac.createGain();chop.gain.value=.6;
  const lfo=ac.createOscillator();lfo.frequency.value=30;const lg=ac.createGain();lg.gain.value=.4;lfo.connect(lg);lg.connect(chop.gain);const pg=ac.createGain();pg.gain.value=0;o1.connect(pf);o2.connect(pf);pf.connect(chop);chop.connect(pg);pg.connect(this.out);o1.start();o2.start();lfo.start();
  this.prop={o1,o2,pf,lfo,g:pg};
  this.jet=loop(b,'bandpass',900,.7);this.whine=(()=>{const o=ac.createOscillator();o.type='sine';o.frequency.value=2400;const g=ac.createGain();g.gain.value=0;o.connect(g);g.connect(this.out);o.start();return{o,g};})();
  this.burner=loop(this.brown,'lowpass',260,.8);this.wind=loop(b,'lowpass',500,.5);this.rumble=loop(this.brown,'lowpass',120,.7);
  // lock + warning tones
  const lt=ac.createOscillator();lt.type='square';lt.frequency.value=900;const lf=ac.createBiquadFilter();lf.type='lowpass';lf.frequency.value=2500;const lgn=ac.createGain();lgn.gain.value=0;const am=ac.createOscillator();am.frequency.value=18;const amg=ac.createGain();amg.gain.value=0;am.connect(amg);amg.connect(lt.frequency);lt.connect(lf);lf.connect(lgn);lgn.connect(this.out);lt.start();am.start();this.lock={o:lt,g:lgn,am:amg};
  const wt=ac.createOscillator();wt.type='square';wt.frequency.value=1250;const wg=ac.createGain();wg.gain.value=0;const wl=ac.createBiquadFilter();wl.type='lowpass';wl.frequency.value=3000;wt.connect(wl);wl.connect(wg);wg.connect(this.out);wt.start();this.warn={o:wt,g:wg};
 }catch(e){this.ac=null;}}
 suspend(on){if(this.ac){if(on)this.ac.suspend();else this.ac.resume();}}
 // per-frame player audio
 engine(st){if(!this.ac)return;const t=this.ac.currentTime,k=.08;const on=st.on?1:0;
  const sp=Math.min(1,st.speed/350),thr=st.thr;
  if(st.kind==='prop'){const r=48+thr*55+sp*20;this.prop.o1.frequency.setTargetAtTime(r,t,k);this.prop.o2.frequency.setTargetAtTime(r*.502,t,k);this.prop.lfo.frequency.setTargetAtTime(r*.55,t,k);this.prop.pf.frequency.setTargetAtTime(380+thr*900,t,k);
   this.prop.g.gain.setTargetAtTime(on*(.05+thr*.07)*(st.boost?1.3:1),t,k);this.jet.g.gain.setTargetAtTime(0,t,k);this.whine.g.gain.setTargetAtTime(0,t,k);}
  else{this.prop.g.gain.setTargetAtTime(0,t,k);this.jet.f.frequency.setTargetAtTime(500+thr*1300,t,k);this.jet.g.gain.setTargetAtTime(on*(.05+thr*.12),t,k);this.whine.o.frequency.setTargetAtTime(1800+thr*1600,t,k);this.whine.g.gain.setTargetAtTime(on*thr*.006,t,k);}
  this.burner.g.gain.setTargetAtTime(on*(st.boost?(st.kind==='prop'?.05:.42):0),t,.15);this.wind.f.frequency.setTargetAtTime(300+sp*2200,t,k);this.wind.g.gain.setTargetAtTime(on*(.02+sp*sp*.16+(st.g>4?.05:0)),t,k);
  this.rumble.g.gain.setTargetAtTime(on*Math.min(.6,st.shake*.6),t,.05);
  // missile lock: growl while seeking, steady tone when locked
  const L=st.lock;this.lock.g.gain.setTargetAtTime(on&&L?.035:0,t,.03);if(L){this.lock.o.frequency.setTargetAtTime(L===2?1650:780,t,.02);this.lock.am.gain.setTargetAtTime(L===2?0:140,t,.02);}
  const w=st.warn&&(Math.floor(this.ac.currentTime*(st.warn>1?9:4))%2===0);this.warn.g.gain.setTargetAtTime(on&&w?.045:0,t,.01);}
 off(){if(!this.ac)return;const t=this.ac.currentTime;for(const g of[this.prop.g,this.jet.g,this.whine.g,this.burner.g,this.wind.g,this.rumble.g,this.lock.g,this.warn.g])g.gain.setTargetAtTime(0,t,.05);}
 _n(dur,f0,f1,q,vol,type='lowpass',buf){const ac=this.ac,t=ac.currentTime,s=ac.createBufferSource();s.buffer=buf||this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur+.05);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'mg':this._n(.06,3200,500,.8,.09,'bandpass');this._o('square',140,60,.05,.04);break;
  case'cannon':this._n(.09,2400,200,.7,.16,'bandpass');this._o('sine',120,40,.1,.14);break;
  case'heavy':this._n(.14,1800,120,.6,.24,'bandpass');this._o('sine',80,30,.16,.25);break;
  case'enemyGun':this._n(.05,2200,700,1,.025*a,'bandpass');break;
  case'hit':this._o('sine',2400,1800,.06,.06);this._o('triangle',3600,2800,.04,.03,.02);break;
  case'kill':this._o('sine',880,880,.12,.08);this._o('sine',1320,1320,.2,.08,.1);break;
  case'hurt':this._n(.18,1400,200,1.4,.25,'bandpass');this._o('square',220,80,.12,.06);break;
  case'msl':this._n(1.1,400,3000,.7,.24,'bandpass');this._n(1.4,200,60,.6,.2,'lowpass',this.brown);break;
  case'flare':this._n(.12,5000,2000,1,.08,'highpass');this._n(.12,5000,2000,1,.08,'highpass');break;
  case'bomb':this._o('sine',600,180,.5,.05);break;
  case'boom':{const v=Math.min(1,a);this._n(1.8,1600,50,.5,.55*v,'lowpass',this.brown);this._n(.5,4000,300,.8,.25*v);this._o('sine',70,25,1,.4*v);break;}
  case'flak':{const v=Math.min(1,a);this._n(.5,2200,100,.6,.3*v);this._o('sine',90,40,.3,.2*v);break;}
  case'splash':this._n(1,1500,200,.4,.2*Math.min(1,a));break;
  case'land':this._o('sine',90,40,.3,.35);this._n(.4,900,100,.7,.3);break;
  case'trap':this._n(1.4,2600,400,3,.12,'bandpass');this._o('sawtooth',300,120,1.2,.04);break;
  case'eject':this._n(.5,600,4000,.8,.3,'bandpass');this._o('sine',200,60,.4,.25);break;
  case'stall':this._o('square',420,420,.18,.05);break;
  case'ui':this._o('sine',880,1320,.08,.06);break;
  case'win':[523,659,784,1046].forEach((f,i)=>this._o('triangle',f,f,.5,.07,i*.12));break;
  case'lose':[392,330,262].forEach((f,i)=>this._o('triangle',f,f*.98,.6,.07,i*.18));break;
  case'banner':this._o('sine',660,990,.25,.06);this._o('sine',990,990,.3,.05,.12);break;}}catch(e){}}}
