// BLOCK BEASTS — synthesized sound effects and a tiny generative soundtrack (no audio files).
export class Sound{
 constructor(){this.ac=null;this.on=true;this.music=null;this.mode='';this.nextT=0;this.step=0;}
 init(){if(this.ac)return;try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);this.out=ac.createGain();this.out.gain.value=.6;this.out.connect(comp);
  this.mus=ac.createGain();this.mus.gain.value=.0;this.mus.connect(this.out);const n=ac.sampleRate,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  const dl=ac.createDelay(1);dl.delayTime.value=.33;const fb=ac.createGain();fb.gain.value=.32;dl.connect(fb);fb.connect(dl);this.echo=ac.createGain();this.echo.gain.value=.5;this.echo.connect(dl);dl.connect(this.mus);if(this.mode)this.setMusic(this.mode);}catch(e){this.ac=null;}}
 toggle(){this.on=!this.on;if(this.out)this.out.gain.value=this.on?.6:0;return this.on;}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random()*.5);s.stop(t+dur);}
 _o(type,f0,f1,dur,vol,delay=0,dest){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(dest||this.out);o.start(t);o.stop(t+dur+.02);}
 notes(seq,type='square',vol=.06,gap=.09){seq.forEach((f,i)=>f&&this._o(type,f,f,gap*1.6,vol,i*gap));}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'blip':this._o('square',880,880,.05,.04);break;
  case'ok':this._o('square',660,990,.08,.05);break;
  case'back':this._o('square',500,300,.08,.04);break;
  case'step':this._n(.05,700,300,1,.04);break;
  case'throw':this._n(.25,600,2400,1.2,.12,'bandpass');break;
  case'pop':this._o('sine',300,900,.15,.15);this._n(.2,3000,800,1,.12);break;
  case'hit':this._o('sine',180,50,.2,.35);this._n(.14,3000,400,1,.25);break;
  case'super':this._o('sine',220,40,.35,.4);this._n(.3,5000,300,1,.32);this._o('square',880,440,.15,.06,.05);break;
  case'weak':this._o('sine',140,60,.18,.2);this._n(.1,1200,300,1,.12);break;
  case'miss':this._n(.3,800,3000,1,.08,'bandpass');break;
  case'faint':this._o('square',500,60,.7,.08);this._o('sine',240,40,.8,.2);break;
  case'status':this._o('triangle',300,700,.2,.1);this._o('triangle',700,300,.2,.1,.15);break;
  case'stat':[0,1,2,3].forEach(i=>this._o('triangle',400+i*120,520+i*120,.12,.07,i*.06));break;
  case'shake':this._o('square',220,180,.08,.08);this._n(.08,2000,500,1,.1);break;
  case'catch':this.notes([523,659,784,1047,0,1047],'square',.06,.1);break;
  case'break':this._n(.4,4000,300,.8,.25);this._o('square',600,200,.25,.06);break;
  case'level':this.notes([523,659,784,1047],'square',.06,.08);break;
  case'evolve':[262,330,392,523,659,784,1047].forEach((f,i)=>this._o('triangle',f,f,.5,.07,i*.16));break;
  case'heal':this.notes([784,988,1175,1568],'sine',.08,.11);break;
  case'coin':this._o('square',988,988,.06,.05);this._o('square',1319,1319,.12,.05,.06);break;
  case'mine':this._n(.12,1600,400,1,.18);break;
  case'break2':this._n(.25,900,200,1,.3);break;
  case'alert':this._o('square',1200,1600,.12,.07);this._o('square',1200,1600,.12,.07,.14);break;
  case'badge':this.notes([523,0,523,659,784,0,659,784,1047],'square',.07,.12);break;
  case'roar':this._n(.6,500,120,2,.25,'bandpass');this._o('sawtooth',a*120+80,a*60+40,.5,.06);break;
  case'whoosh':this._n(.5,300,2500,.9,.12,'bandpass');break;
  case'ember':this._n(.5,2000,300,.7,.2);break;
  case'tide':this._n(.5,500,1500,2,.18,'bandpass');break;
  case'spark':for(let i=0;i<4;i++)this._n(.06,6000,2000,1,.18,'highpass',i*.05);break;
  case'frost':this._o('sine',2000,3000,.4,.05);this._n(.4,6000,3000,4,.1,'bandpass');break;
 }}catch(e){}}
 // music: 'field' | 'battle' | 'night' | '' — a small pentatonic arpeggio + bass, scheduled ahead
 setMusic(m){this.mode=m;if(!this.ac)return;this.mus.gain.setTargetAtTime(m?(m==='battle'?.5:.32):0,this.ac.currentTime,.6);}
 tick(){if(!this.ac||!this.mode||!this.on)return;const ac=this.ac;if(this.nextT<ac.currentTime)this.nextT=ac.currentTime+.05;
  const bt=this.mode==='battle'?.16:.3;while(this.nextT<ac.currentTime+.4){const s=this.step++;const t=this.nextT-ac.currentTime;
   if(this.mode==='battle'){const prog=[[220,262,330],[196,247,294],[175,220,262],[196,247,330]][(s>>4)%4];const n=prog[[0,1,2,1,0,2,1,2][s%8]];this._o('square',n*2,n*2,bt*.9,.025,t,this.mus);if(s%4===0)this._o('triangle',prog[0]/2,prog[0]/2,bt*3,.09,t,this.mus);if(s%2===0)this._o('sine',90,40,.08,.08,t,this.mus);}
   else{const sc=this.mode==='night'?[220,262,294,330,392,440]:[262,294,330,392,440,523];const r=Math.sin(s*12.9898)*43758.5;const pick=Math.floor((r-Math.floor(r))*6);if(s%2===0||pick>3){const f=sc[pick]*(s%16<8?1:1.5)/(this.mode==='night'?2:1);this._o('triangle',f,f,bt*2.5,.035,t,this.echo);}if(s%8===0)this._o('sine',sc[0]/2,sc[0]/2,bt*7,.05,t,this.mus);}
   this.nextT+=bt;}}
}
