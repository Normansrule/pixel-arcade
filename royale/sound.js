// STORM ROYALE — synthesized audio (no files): guns, pickaxe, building, storm, glider, UI stingers. Distance-attenuated.
export class Sound{
 constructor(){this.ac=null;this.on=true;this.listener=null;}
 init(){if(this.ac)return;try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.connect(ac.destination);this.out=ac.createGain();this.out.gain.value=.6;this.out.connect(comp);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  const loop=(f,q,type='lowpass')=>{const s=ac.createBufferSource();s.buffer=b;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(this.out);s.start();return{g,fl};};
  this.wind=loop(600,.7,'bandpass');this.storm=loop(180,.8);this.engine=(()=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=52;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=260;const g=ac.createGain();g.gain.value=0;o.connect(f);f.connect(g);g.connect(this.out);o.start();return{g,o};})();}catch(e){this.ac=null;}}
 set(k,v,f){if(!this.ac)return;const t=this.ac.currentTime,L=this[k];if(!L)return;L.g.gain.setTargetAtTime(this.on?v:0,t,.15);if(f&&L.fl)L.fl.frequency.setTargetAtTime(f,t,.2);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur+.05);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
 // a = volume scale (0..1) from distance
 play(k,a=1,x){if(!this.ac||!this.on||a<.02)return;try{switch(k){
  case'ar':this._n(.16,5000,600,.7,.32*a);this._o('square',180,60,.08,.1*a);break;
  case'smg':this._n(.09,6000,1200,.7,.22*a);this._o('square',240,90,.05,.07*a);break;
  case'sg':this._n(.42,2600,120,.6,.55*a);this._o('sine',110,40,.3,.35*a);if(a>.5)this._n(.08,1500,900,4,.12*a,'bandpass',.35);break;
  case'sn':this._n(.7,7000,200,.5,.5*a);this._o('sine',90,35,.5,.4*a);this._n(.1,3000,2000,6,.08*a,'bandpass',.5);break;
  case'rl':this._n(.6,900,150,.7,.35*a);this._o('sawtooth',220,70,.4,.12*a);break;
  case'boom':this._n(1.4,1800,40,.6,.8*a);this._o('sine',70,22,1.1,.6*a);break;
  case'reload':this._o('square',800,600,.04,.05);this._o('square',500,400,.05,.05,.18);this._n(.05,3000,2000,3,.08,'bandpass',.32);break;
  case'empty':this._o('square',1400,1300,.03,.04);break;
  case'wood':this._o('triangle',260,140,.12,.3*a);this._n(.08,1600,400,2,.15*a,'bandpass');break;
  case'stone':this._o('square',520,300,.06,.12*a);this._n(.12,4000,1500,1.5,.2*a,'bandpass');break;
  case'metal':this._o('triangle',1250,1180,.35,.14*a);this._o('triangle',1870,1800,.3,.08*a);this._n(.06,6000,3000,2,.1*a,'highpass');break;
  case'swing':this._n(.14,500,1800,1.2,.06,'bandpass');break;
  case'build':this._o('sine',300,520,.1,.14*a);this._n(.08,2500,800,1.2,.1*a,'bandpass');break;
  case'break':this._n(.5,1200,80,.6,.35*a);this._o('sine',120,40,.3,.2*a);break;
  case'hit':this._o('sine',1600,1500,.05,.12);break;
  case'head':this._o('sine',2200,2100,.08,.14);this._o('sine',3300,3200,.06,.08,.03);break;
  case'shieldhit':this._o('triangle',1100,700,.09,.12);break;
  case'hurt':this._o('sine',180,90,.18,.22);this._n(.1,800,300,1,.15);break;
  case'shieldbreak':this._n(.35,6000,800,1,.25);this._o('triangle',1400,500,.3,.12);break;
  case'elim':[523,659,784,1046].forEach((f,i)=>this._o('triangle',f,f,.22,.08,i*.06));break;
  case'pickup':this._o('sine',660,990,.12,.1);break;
  case'chest':[880,1108,1318,1760].forEach((f,i)=>this._o('sine',f,f*1.01,.5,.07,i*.07));this._n(.4,3000,8000,1,.06,'highpass');break;
  case'heal':this._o('sine',440,880,.5,.08);this._o('sine',660,1320,.5,.05,.1);break;
  case'shield':this._o('sine',520,1560,.6,.08);this._o('triangle',780,2340,.5,.04,.12);break;
  case'jump':this._n(.12,600,1600,1.2,.04,'bandpass');break;
  case'land':this._o('sine',90,40,.1,.14);this._n(.08,800,200,1,.06);break;
  case'step':this._n(.04,1400+Math.random()*600,500,1.5,.025*a,'bandpass');break;
  case'glider':this._n(.6,300,1500,.8,.12,'bandpass');this._o('triangle',400,800,.3,.05);break;
  case'drop':this._n(.8,2000,200,.8,.18);break;
  case'storm':[196,185,175].forEach((f,i)=>this._o('sawtooth',f,f*.98,1.2,.05,i*.25));break;
  case'beep':this._o('square',a>1?990:660,a>1?990:660,.15,.06);break;
  case'win':[392,523,659,784,1046,1318].forEach((f,i)=>{this._o('triangle',f,f,.9,.07,i*.12);this._o('sine',f*2,f*2,.7,.03,i*.12+.02);});break;
  case'lose':[392,330,262,196].forEach((f,i)=>this._o('triangle',f,f*.98,.6,.07,i*.18));break;
  case'click':this._o('square',1200,1100,.02,.04);break;
  case'emote':[523,659,784].forEach((f,i)=>this._o('square',f,f,.12,.035,i*.1));break;}}catch(e){}}}
