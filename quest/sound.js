// WILD QUEST — synthesized audio: sparse pentatonic ambience, combat pulse, wind/rain beds and effects.
export class Sound{
 constructor(){this.ac=null;this.on=true;this.nextNote=0;this.combat=0;this.beat=0;}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);this.out=ac.createGain();this.out.gain.value=.75;this.out.connect(comp);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  // reverb for the piano
  const ir=ac.createBuffer(2,ac.sampleRate*2.5,ac.sampleRate);for(let c=0;c<2;c++){const x=ir.getChannelData(c);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/x.length,3);}this.verb=ac.createConvolver();this.verb.buffer=ir;const vg=ac.createGain();vg.gain.value=.5;this.verb.connect(vg);vg.connect(this.out);
  const bed=(f,q,type='bandpass')=>{const s=ac.createBufferSource();s.buffer=b;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(this.out);s.start();return{g,fl};};
  this.wind=bed(500,.6);this.rain=bed(3000,.3,'highpass');this.fire=bed(900,.8);this.water=bed(350,.8,'lowpass');}catch(e){this.ac=null;}}
 beds(o){if(!this.ac)return;const t=this.ac.currentTime;this.wind.g.gain.setTargetAtTime(o.wind,t,.3);this.wind.fl.frequency.setTargetAtTime(300+o.wind*1400,t,.3);this.rain.g.gain.setTargetAtTime(o.rain*.16,t,.5);this.fire.g.gain.setTargetAtTime(o.fire*.05,t,.3);this.water.g.gain.setTargetAtTime(o.water*.08,t,.4);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur);}
 _o(type,f0,f1,dur,vol,delay=0,dest){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(dest||this.out);if(dest)g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
 note(f,vol=.05,delay=0,dur=2.4){this._o('sine',f,f,dur,vol,delay,this.verb);this._o('triangle',f*2,f*2,dur*.4,vol*.25,delay,this.verb);}
 // ambient score: sparse pentatonic piano by day, low pads in combat
 music(dt,o){if(!this.ac||!this.on)return;this.nextNote-=dt;const P=[0,2,4,7,9];const base=o.night?196:261.6;
  if(this.nextNote<=0&&o.combat<.3){const k=P[Math.random()*5|0]+12*(Math.random()*2|0),f=base*Math.pow(2,k/12);this.note(f,.035);if(Math.random()<.4)this.note(f*1.5,.025,.25);this.nextNote=1.6+Math.random()*(o.night?5:3.5);}
  this.combat+=((o.combat>0?1:0)-this.combat)*Math.min(1,dt*1.5);if(this.combat>.2){this.beat-=dt;if(this.beat<=0){this.beat=.42;this.step=(this.step||0)+1;const s=this.step%8;this._o('sine',s%4===0?65:55,40,.25,.12*this.combat);if(s%2===1)this._n(.08,5000,2000,1,.03*this.combat,'highpass');
   if(s===0||s===5){const f=[146.8,174.6,196,220][Math.random()*4|0];this._o('sawtooth',f,f*.99,.36,.022*this.combat);}}}}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'step':this._n(.07,a>1?600:1200,300,1,.035*Math.min(1,a));break;
  case'swing':this._n(.22,700,3200,1.6,.09,'bandpass');break;
  case'hit':this._o('sine',190,50,.22,.28);this._n(.14,3000,400,1,.2);break;
  case'crit':this._o('sine',260,60,.3,.32);this._n(.2,5000,500,1,.25);this._o('triangle',1200,900,.2,.06);break;
  case'block':[620,930,1480].forEach((f,i)=>this._o('triangle',f,f*.98,.35,.08/(i+1)));this._n(.1,4000,1500,2,.12);break;
  case'parry':[880,1320,1760,2640].forEach((f,i)=>this._o('sine',f,f,.6,.07/(1+i*.3),i*.03));break;
  case'draw':this._n(.45,300,900,4,.04,'bandpass');break;
  case'shoot':this._n(.18,2500,600,1,.12);this._o('triangle',180,90,.12,.08);break;
  case'arrowhit':this._n(.08,2000,500,1,.12);this._o('square',220,110,.06,.04);break;
  case'jump':this._n(.15,600,1600,1.3,.05,'bandpass');break;
  case'land':this._o('sine',110,40,.14,.12*Math.min(1.5,a));this._n(.1,800,200,1,.08*Math.min(1.5,a));break;
  case'glide':this._n(.35,300,1200,1,.12,'bandpass');this._o('sine',300,500,.15,.03);break;
  case'hurt':this._o('square',220,90,.22,.07);this._n(.2,1500,300,1,.15);break;
  case'grunt':this._o('sawtooth',120+Math.random()*40,70,.3,.06);this._n(.2,700,300,3,.05,'bandpass');break;
  case'alert':this._o('square',520,780,.12,.05);this._o('square',780,1040,.12,.05,.13);break;
  case'pickup':[784,988,1175].forEach((f,i)=>this._o('sine',f,f,.25,.06,i*.06));break;
  case'seed':[1047,1319,1568,2093,2637].forEach((f,i)=>this._o('triangle',f,f,.3,.06,i*.07));this._n(.5,6000,9000,2,.03,'bandpass');break;
  case'cook':[523,659,784,1047,784,1047,1319].forEach((f,i)=>this._o('triangle',f,f,.22,.05,i*.11));break;
  case'eat':this._n(.12,900,500,2,.08,'bandpass',0);this._n(.12,900,500,2,.08,'bandpass',.16);this._o('sine',700,900,.2,.04,.3);break;
  case'chest':[392,523,659,784,1047].forEach((f,i)=>this._o('sine',f,f,.5,.06,i*.09));break;
  case'shrine':[262,330,392,523,659,784,1047].forEach((f,i)=>this.note(f,.06,i*.12,3));break;
  case'blessing':[523,659,784,1047,1319,1568].forEach((f,i)=>this.note(f,.07,i*.08,3));break;
  case'door':this._o('sine',70,45,1.2,.18);this._n(1.2,400,120,1,.12);[392,523].forEach((f,i)=>this.note(f,.05,.3+i*.15));break;
  case'crystal':[1568,2093].forEach((f,i)=>this._o('sine',f,f,.5,.06,i*.05));break;
  case'clang':this._o('triangle',420,380,.4,.1);this._o('sine',1200,1100,.3,.05);break;
  case'thud':this._o('sine',90,40,.2,.15);break;
  case'pop':this._o('sine',500,1200,.12,.06);break;
  case'kill':this._n(.6,1200,100,1,.15);this._o('sine',300,80,.5,.08);break;
  case'slam':this._o('sine',70,25,.9,.4);this._n(.8,1200,60,.7,.4);break;
  case'roar':this._o('sawtooth',90,50,1.4,.12);this._o('sawtooth',93,52,1.4,.1);this._n(1.4,600,200,2,.15,'bandpass');break;
  case'fire':this._n(.5,800,3000,1,.12,'bandpass');this._o('sine',160,60,.4,.1);break;
  case'flurry':this._o('sine',200,1600,.4,.08);this._n(.6,8000,1000,1,.08,'highpass');break;
  case'thunder':this._n(2.6,400,40,.5,.5);this._o('sine',50,30,2,.2);break;
  case'moon':[110,131,165].forEach(f=>this._o('sawtooth',f,f*.97,2.5,.05));break;
  case'victory':[523,659,784,1047,784,1047,1319,1568].forEach((f,i)=>this.note(f,.08,i*.16,3));break;
  case'death':[392,349,311,262].forEach((f,i)=>this.note(f,.07,i*.3,3));break;
  case'warp':this._o('sine',300,1800,.8,.08);this._n(.8,800,6000,1,.06,'bandpass');break;}}catch(e){}}}
