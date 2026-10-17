// CRITTER KART — WebAudio synth: per-player engines with drift screech, pickups, tiered turbos, tricks, hazards,
// countdown, fanfares and a light procedural race music loop (M toggles music).
const THEME_KEYS={shores:[0,4,7,9],frost:[0,3,7,10],jungle:[0,3,5,7],star:[0,4,7,11],hub:[0,4,7,9]};
export class Sound{
 constructor(){this.ctx=null;this.eng=[];this.on=true;this.music=true;try{this.music=localStorage.getItem('pxd_critterkart_music')!=='0';}catch(e){}this.mus=null;}
 init(){if(this.ctx)return;try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.35;this.master.connect(this.ctx.destination);
  this.mbus=this.ctx.createGain();this.mbus.gain.value=this.music?.16:0;this.mbus.connect(this.master);
  const len=this.ctx.sampleRate*1,b=this.ctx.createBuffer(1,len,this.ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<len;i++)a[i]=Math.random()*2-1;this.nbuf=b;}catch(e){this.ctx=null;}}
 engines(n){if(!this.ctx)return;while(this.eng.length<n){const o=this.ctx.createOscillator(),o2=this.ctx.createOscillator(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();o.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=900;g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g);g.connect(this.master);o.start();o2.start();
   const ns=this.ctx.createBufferSource();ns.buffer=this.nbuf;ns.loop=true;const nf=this.ctx.createBiquadFilter();nf.type='bandpass';nf.frequency.value=2400;nf.Q.value=3;const ng=this.ctx.createGain();ng.gain.value=0;ns.connect(nf);nf.connect(ng);ng.connect(this.master);ns.start();
   this.eng.push({o,o2,g,f,ng,nf});}
  this.eng.forEach((e,i)=>{if(i>=n){e.g.gain.value=0;e.ng.gain.value=0;}});}
 engine(i,speed,type,on,drift=0,boost=false){const e=this.eng[i];if(!e||!this.ctx)return;const t=this.ctx.currentTime,base=type==='plane'?70:type==='hover'?95:55,f=base+speed*4.2*(boost?1.15:1);e.o.frequency.setTargetAtTime(f,t,.06);e.o2.frequency.setTargetAtTime(f*.501,t,.06);e.f.frequency.setTargetAtTime(boost?1800:900,t,.1);
  e.g.gain.setTargetAtTime(on?.05+Math.min(.07,speed*.002):0,t,.1);e.ng.gain.setTargetAtTime(on&&drift?.035+drift*.012:0,t,.05);e.nf.frequency.setTargetAtTime(1800+drift*600,t,.1);}
 stop(){this.eng.forEach(e=>{e.g.gain.value=0;e.ng.gain.value=0;});this.stopMusic();}
 blip(f,d=.1,type='square',v=.15,slide=0,at=0,dest){if(!this.ctx||!this.on)return;const t=this.ctx.currentTime+at,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(dest||this.master);o.start(t);o.stop(t+d+.02);}
 noise(d=.3,v=.2,f=800,type='lowpass'){if(!this.ctx||!this.on)return;const t=this.ctx.currentTime,s=this.ctx.createBufferSource(),fl=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=this.nbuf;fl.type=type;fl.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl);fl.connect(g);g.connect(this.master);s.start(t);s.stop(t+d+.05);}
 play(k){switch(k){case'beep':this.blip(440,.18,'square',.12);break;case'go':this.blip(880,.45,'square',.14);this.blip(1320,.45,'triangle',.08);break;case'pod':this.blip(660,.08,'triangle',.12,500);this.blip(990,.1,'triangle',.1,0,.07);break;
  case'berry':this.blip(1200,.06,'sine',.12,400);break;case'coin':this.blip(1500,.08,'triangle',.12);this.blip(2000,.12,'triangle',.1,0,.06);break;case'zip':this.blip(200,.4,'sawtooth',.1,900);this.noise(.35,.12,3000,'highpass');break;
  case'mt1':this.blip(500,.25,'sawtooth',.08,700);break;case'mt2':this.blip(420,.32,'sawtooth',.1,1000);break;case'mt3':this.blip(360,.42,'sawtooth',.11,1400);this.blip(720,.42,'square',.05,1400);break;
  case'lv':this.blip(1400,.05,'square',.06);break;case'trick':this.blip(880,.1,'triangle',.1);this.blip(1320,.12,'triangle',.1,0,.08);break;case'pad':this.blip(300,.3,'sawtooth',.09,600);this.noise(.3,.1,2500,'highpass');break;
  case'draft':this.noise(.5,.12,1200,'bandpass');this.blip(400,.3,'sine',.06,500);break;case'hop':this.blip(260,.06,'square',.05,120);break;
  case'fire':this.noise(.25,.18,1800);this.blip(300,.2,'sawtooth',.06,-200);break;case'hit':this.noise(.4,.3,600);this.blip(180,.35,'square',.1,-120);break;case'pop':this.blip(900,.12,'sine',.15,-600);break;
  case'lap':[523,659,784].forEach((f,i)=>this.blip(f,.12,'triangle',.12,0,i*.09));break;case'final':[784,988,1175,1568].forEach((f,i)=>this.blip(f,.14,'square',.08,0,i*.08));break;
  case'win':[523,659,784,1047,784,1047].forEach((f,i)=>this.blip(f,.18,'triangle',.14,0,i*.12));break;case'cup':[523,523,659,784,659,784,1047].forEach((f,i)=>this.blip(f,.22,'triangle',.14,0,i*.16));break;
  case'lose':[392,330,262].forEach((f,i)=>this.blip(f,.25,'triangle',.12,0,i*.18));break;case'ring':this.blip(1046,.1,'sine',.12,600);break;case'splash':this.noise(.5,.25,1200);break;case'door':this.blip(330,.3,'triangle',.1,330);break;
  case'bolt':this.noise(.6,.35,3000);break;case'drop':this.blip(240,.15,'square',.1,-120);break;case'balloon':[784,988,1175,1568].forEach((f,i)=>this.blip(f,.15,'triangle',.13,0,i*.1));break;
  case'bumper':this.blip(520,.18,'sine',.16,-200);this.blip(780,.12,'square',.05);break;case'boom':this.noise(.8,.35,400);this.blip(90,.5,'sine',.2,-50);break;case'geyser':this.noise(.9,.2,900,'bandpass');break;
  case'frenzy':[523,659,784,988,784,988,1175].forEach((f,i)=>this.blip(f,.1,'square',.07,0,i*.07));break;case'storm':this.noise(1,.4,2500);this.blip(120,.8,'sawtooth',.12,-60);break;case'fall':this.blip(600,.7,'sine',.12,-500);break;}}
 // ---- procedural race music: bass + arpeggio + hats, key per theme ----
 startMusic(theme='hub',tempo=132){if(!this.ctx)return;this.stopMusic();const keys=THEME_KEYS[theme]||THEME_KEYS.hub,root={shores:220,frost:196,jungle:207.65,star:233.08,hub:220}[theme]||220;
  const beat=60/tempo/2;let step=0,next=this.ctx.currentTime+.1;const prog=[0,5,3,4];
  const tick=()=>{if(!this.ctx||!this.mus)return;while(next<this.ctx.currentTime+.25){const bar=(step>>4)%4,deg=prog[bar],s=step%16;const semi=n=>root*Math.pow(2,n/12);
    const chord=[keys[0],keys[1],keys[2]].map(k=>k+[0,5,-3,7][bar]);
    if(s%4===0)this.blip(semi(chord[0]-24),beat*1.8,'triangle',.5,0,next-this.ctx.currentTime,this.mbus);
    if(s%4===2)this.blip(semi(chord[0]-12),beat*.9,'triangle',.3,0,next-this.ctx.currentTime,this.mbus);
    if(s%2===0||s%3===0)this.blip(semi(chord[(s>>1)%3]+(s>8?12:0)),beat*.8,'square',.09,0,next-this.ctx.currentTime,this.mbus);
    if(s%8===4){const t=next,src=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=this.nbuf;f.type='highpass';f.frequency.value=6000;g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.08);src.connect(f);f.connect(g);g.connect(this.mbus);src.start(t);src.stop(t+.1);}
    step++;next+=beat;}};
  this.mus=setInterval(tick,90);tick();}
 stopMusic(){if(this.mus){clearInterval(this.mus);this.mus=null;}}
 toggleMusic(){this.music=!this.music;try{localStorage.setItem('pxd_critterkart_music',this.music?'1':'0');}catch(e){}if(this.mbus)this.mbus.gain.value=this.music?.16:0;return this.music;}}
