// TUMBLE ROYALE — synthesized sound (no audio files): boings, bonks, crowd, fanfares and a bouncy show tune.
export class Sound{
 constructor(){this.ac=null;this.on=true;this.music=true;this.mT=0;this.step=0;this.timer=0;}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);
  this.out=ac.createGain();this.out.gain.value=.75;this.out.connect(comp);this.mus=ac.createGain();this.mus.gain.value=.0;this.mus.connect(this.out);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  const cs=ac.createBufferSource();cs.buffer=b;cs.loop=true;const cf=ac.createBiquadFilter();cf.type='bandpass';cf.frequency.value=900;cf.Q.value=.5;this.crowd=ac.createGain();this.crowd.gain.value=.02;cs.connect(cf);cf.connect(this.crowd);this.crowd.connect(this.out);cs.start();
  this.mT=ac.currentTime+.1;this.timer=setInterval(()=>this.sched(),40);}catch(e){this.ac=null;}}
 setMusic(on,vol=.11){this.music=on;if(this.mus)this.mus.gain.setTargetAtTime(on?vol:0,this.ac.currentTime,.3);}
 hype(v){if(this.crowd)this.crowd.gain.setTargetAtTime(.02+v*.16,this.ac.currentTime,.3);}
 sched(){const ac=this.ac;if(!ac)return;const spb=60/126/2;while(this.mT<ac.currentTime+.2){const s=this.step++%64,t=this.mT;this.mT+=spb;if(!this.music)continue;
  const bar=(s/16|0)%4,roots=[0,5,7,3],root=110*Math.pow(2,roots[bar]/12);
  if(s%4===0||s%16===10)this._t('triangle',root,t,.22,.5,this.mus);if(s%4===2)this._t('triangle',root*2,t,.12,.25,this.mus);
  if(s%8===4){[1,1.26,1.5].forEach(m=>this._t('square',root*2*m,t,.09,.06,this.mus));}
  const mel=[12,0,15,0,19,17,15,0,12,0,10,12,0,7,0,0];const nn=mel[s%16];if(nn&&bar%2===1)this._t('square',root*Math.pow(2,nn/12),t,.11,.07,this.mus);
  if(s%2===1)this._nz(t,.03,7000,.05,this.mus);if(s%8===4)this._nz(t,.12,1800,.18,this.mus);}}
 _t(type,f,t,dur,vol,dest){const ac=this.ac,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(dest||this.out);o.start(t);o.stop(t+dur+.02);}
 _nz(t,dur,f,vol,dest){const ac=this.ac,s=ac.createBufferSource();s.buffer=this.noise;const fl=ac.createBiquadFilter();fl.type='highpass';fl.frequency.value=f;const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl);fl.connect(g);g.connect(dest||this.out);s.start(t,Math.random());s.stop(t+dur+.02);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'jump':this._o('sine',260,620,.16,.13);break;
  case'land':this._o('sine',140,60,.12,Math.min(.22,a*.012));break;
  case'dive':this._n(.28,600,2400,1.2,.12,'bandpass');this._o('sine',420,220,.2,.06);break;
  case'bump':this._o('sine',190,90,.14,Math.min(.2,.05+a*.012));break;
  case'knock':this._o('square',520,90,.22,.08);this._n(.18,2000,300,1,.18);this._o('sine',1400,300,.55,.06,.08);break;
  case'boing':this._o('sine',180,700,.25,.16);this._o('sine',360,1400,.2,.05,.03);break;
  case'door':this._n(.45,3000,200,.6,.32);this._o('square',160,50,.3,.1);break;
  case'fake':this._o('sine',110,70,.18,.25);this._n(.08,800,300,2,.15);break;
  case'tile':this._o('triangle',900+a*200,700,.06,.05);break;
  case'splash':this._n(.6,1500,150,.8,.25);this._o('sine',300,80,.4,.12);break;
  case'grab':this._o('triangle',500,700,.08,.08);break;
  case'steal':[0,.07,.14].forEach((d,i)=>this._o('triangle',[880,1175,1568][i],[880,1175,1568][i],.18,.09,d));break;
  case'beep':this._o('square',a?1046:660,a?1046:660,a?.45:.16,.07);break;
  case'whistle':this._o('sine',2100,2300,.5,.12);this._o('sine',2200,2050,.4,.06,.1);break;
  case'qualify':[523,659,784,1046].forEach((f,i)=>this._o('square',f,f,.25,.06,i*.09));this._n(1.2,3000,800,.5,.08,'bandpass',.3);break;
  case'elim':[392,370,349,294].forEach((f,i)=>this._o('sawtooth',f,f*.97,i===3?.7:.3,.07,i*.26));break;
  case'crown':[523,659,784,1046,784,1046,1318].forEach((f,i)=>this._o('square',f,f,.3,.07,i*.12));[262,330,392].forEach(f=>this._o('sawtooth',f,f,1.8,.04,.85));this._n(2,3500,700,.4,.12,'bandpass',.8);break;
  case'goal':this._n(1.2,3000,100,.6,.35);[262,330,392,523].forEach((f,i)=>this._o('square',f,f,.5,.06,i*.06));break;
  case'pop':this._o('sine',700,1800,.08,.09);break;
  case'whoosh':this._n(.5,300,2500,.7,.1,'bandpass');break;}}catch(e){}}}
