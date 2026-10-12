// SIDEWAYS — synthesized audio (no files): rev-matched engine (firing-frequency oscillators through a waveshaper),
// turbo whine + blow-off flutter, backfire pops, tyre squeal, wall scrape, impacts, wind, rain, UI cues.
export class Sound{
 constructor(){this.ac=null;this.vol=.8;}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(ac.destination);this.out=ac.createGain();this.out.gain.value=this.vol;this.out.connect(comp);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  const loop=(type,f,q,g0=0)=>{const s=ac.createBufferSource();s.buffer=b;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=g0;s.connect(fl);fl.connect(g);g.connect(this.out);s.start(0,Math.random());return{f:fl,g};};
  this.squeal=loop('bandpass',1150,7);this.squeal2=loop('bandpass',1750,9);this.scrape=loop('highpass',2400,.8);this.wind=loop('lowpass',600,.5);this.rain=loop('highpass',2600,.4);this.gravel=loop('lowpass',380,.8);
  this.eng=[this.mkEngine(1),this.mkEngine(.35)];}catch(e){this.ac=null;}}
 mkEngine(level){const ac=this.ac,shp=ac.createWaveShaper(),c=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/512-1;c[i]=Math.tanh(x*2.6);}shp.curve=c;
  const lp=ac.createBiquadFilter();lp.type='lowpass';lp.Q.value=2.2;const g=ac.createGain();g.gain.value=0;const pre=ac.createGain();pre.gain.value=.6;
  const o1=ac.createOscillator(),o2=ac.createOscillator(),o3=ac.createOscillator();o1.type='sawtooth';o2.type='square';o3.type='sawtooth';const g1=ac.createGain(),g2=ac.createGain(),g3=ac.createGain();g1.gain.value=.5;g2.gain.value=.35;g3.gain.value=.16;
  o1.connect(g1);o2.connect(g2);o3.connect(g3);g1.connect(pre);g2.connect(pre);g3.connect(pre);pre.connect(shp);shp.connect(lp);lp.connect(g);g.connect(this.out);o1.start();o2.start();o3.start();
  // rasp: noise amplitude-modulated near the firing frequency
  const ns=ac.createBufferSource();ns.buffer=this.noise;ns.loop=true;const nf=ac.createBiquadFilter();nf.type='bandpass';nf.Q.value=1.4;const ng=ac.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(this.out);ns.start();
  const tw=ac.createOscillator();tw.type='sine';const tg=ac.createGain();tg.gain.value=0;tw.connect(tg);tg.connect(this.out);tw.start();
  return{o1,o2,o3,lp,g,ng,nf,tw,tg,pre,level};}
 // per frame: rpm, throttle, boost (0..1), cylinders, on
 engine(i,rpm,thr,boost,cyl,on,limiter){const e=this.eng&&this.eng[i];if(!e)return;const t=this.ac.currentTime,f=Math.max(20,rpm/60*cyl/2),L=e.level;
  e.o1.frequency.setTargetAtTime(f,t,.012);e.o2.frequency.setTargetAtTime(f*.5,t,.012);e.o3.frequency.setTargetAtTime(f*2.01,t,.012);
  e.lp.frequency.setTargetAtTime(260+thr*1700+rpm*.32,t,.03);e.pre.gain.setTargetAtTime(.35+thr*.9,t,.03);
  const g=on?L*(.05+thr*.07+rpm/9000*.05)*(limiter?(.6+Math.random()*.4):1):0;e.g.gain.setTargetAtTime(g,t,.04);
  e.nf.frequency.setTargetAtTime(f*3,t,.03);e.ng.gain.setTargetAtTime(on?L*(.01+thr*.035):0,t,.05);
  e.tw.frequency.setTargetAtTime(1600+boost*4200+rpm*.15,t,.08);e.tg.gain.setTargetAtTime(on?L*boost*.022:0,t,.1);}
 tyres(slip,scrape,speed,gravel,rain){if(!this.ac)return;const t=this.ac.currentTime;const s=Math.min(1,slip);
  this.squeal.g.gain.setTargetAtTime(s*.16,t,.05);this.squeal2.g.gain.setTargetAtTime(s*s*.07,t,.05);this.squeal.f.frequency.setTargetAtTime(1000+s*260+Math.sin(t*9)*40,t,.05);
  this.scrape.g.gain.setTargetAtTime(Math.min(.3,scrape*.05),t,.03);this.wind.g.gain.setTargetAtTime(Math.min(.12,speed*speed*.000025),t,.2);this.wind.f.frequency.setTargetAtTime(300+speed*12,t,.2);
  this.gravel.g.gain.setTargetAtTime(gravel?Math.min(.2,speed*.006):0,t,.08);this.rain.g.gain.setTargetAtTime(rain?.05:0,t,.5);}
 mute(){if(!this.ac)return;const t=this.ac.currentTime;this.eng.forEach(e=>{e.g.gain.setTargetAtTime(0,t,.05);e.ng.gain.setTargetAtTime(0,t,.05);e.tg.gain.setTargetAtTime(0,t,.05);});[this.squeal,this.squeal2,this.scrape,this.wind,this.gravel].forEach(x=>x.g.gain.setTargetAtTime(0,t,.05));}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur+.02);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
 flutter(a){const ac=this.ac,t=ac.currentTime,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=2300;f.Q.value=1.2;const g=ac.createGain();g.gain.value=0;
  const lfo=ac.createOscillator();lfo.type='square';lfo.frequency.setValueAtTime(22,t);lfo.frequency.linearRampToValueAtTime(12,t+.6);const lg=ac.createGain();lg.gain.setValueAtTime(.09*a,t);lg.gain.exponentialRampToValueAtTime(.001,t+.7);
  lfo.connect(lg);lg.connect(g.gain);s.connect(f);f.connect(g);g.connect(this.out);s.start(t);lfo.start(t);s.stop(t+.75);lfo.stop(t+.75);this._n(.18,4000,1800,.8,.08*a,'bandpass');}
 play(k,a=1){if(!this.ac)return;try{switch(k){
  case'pop':{const n=1+(Math.random()*3|0);for(let i=0;i<n;i++){const d=i*(.05+Math.random()*.06);this._n(.09,1200,200,.7,.22*a,'lowpass',d);this._o('square',90,40,.06,.12*a,d);}break;}
  case'bov':this.flutter(a);break;
  case'shift':this._o('sine',180,90,.05,.05);break;
  case'hit':this._o('sine',140,40,.3,Math.min(.6,.15+a*.02));this._n(.25,2600,300,1,Math.min(.45,a*.03));break;
  case'cone':this._o('triangle',520,260,.12,.08);break;
  case'beep':this._o('square',a?1040:620,a?1040:620,a?.45:.16,.07);break;
  case'bank':[660,880,1320].forEach((f,i)=>this._o('triangle',f,f,.25,.07,i*.06));break;
  case'lost':this._o('sawtooth',300,90,.5,.08);this._o('square',150,60,.5,.05);break;
  case'clip':this._o('sine',1320,1980,.14,.07);break;
  case'tick':this._o('sine',1800,1800,.03,.03);break;
  case'cash':[1200,1600,2400].forEach((f,i)=>this._o('triangle',f,f*1.01,.18,.06,i*.05));break;
  case'click':this._o('sine',900,700,.04,.05);break;
  case'medal':[523,659,784,1046].forEach((f,i)=>this._o('triangle',f,f,.5,.07,i*.11));break;
  case'end':[392,330,262].forEach((f,i)=>this._o('sawtooth',f,f,.6,.05,i*.18));break;}}catch(e){}}}
