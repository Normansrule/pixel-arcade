// ABYSS DIVER — synthesized audio: underwater ambience, breathing, UI, sonar, the leviathan.
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.depth=0;}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const A=window.AudioContext||window.webkitAudioContext;this.ac=new A();}catch(e){return;}const ac=this.ac;
  this.master=ac.createGain();this.master.gain.value=this.vol;this.master.connect(ac.destination);
  this.lp=ac.createBiquadFilter();this.lp.type='lowpass';this.lp.frequency.value=900;this.lp.connect(this.master);
  // echo send for the wet underwater feel
  this.dl=ac.createDelay(1);this.dl.delayTime.value=.32;this.fb=ac.createGain();this.fb.gain.value=.38;this.dl.connect(this.fb);this.fb.connect(this.dl);this.wet=ac.createGain();this.wet.gain.value=.35;this.dl.connect(this.wet);this.wet.connect(this.lp);
  // ambience: brown noise rumble + slow swell
  const b=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){l=l*.996+(Math.random()*2-1)*.03;d[i]=l;}
  const src=ac.createBufferSource();src.buffer=b;src.loop=true;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=320;this.amb=ac.createGain();this.amb.gain.value=.55;src.connect(f);f.connect(this.amb);this.amb.connect(this.master);src.start();
  const lfo=ac.createOscillator();lfo.frequency.value=.07;const lg=ac.createGain();lg.gain.value=.25;lfo.connect(lg);lg.connect(this.amb.gain);lfo.start();
  // drone pad that darkens with depth
  this.pad=ac.createGain();this.pad.gain.value=0;this.padF=ac.createBiquadFilter();this.padF.type='lowpass';this.padF.frequency.value=500;this.padF.connect(this.pad);this.pad.connect(this.lp);this.pad.connect(this.dl);
  for(const fr of[55,82.4,110.2,164.8]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=fr;o.detune.value=(Math.random()-.5)*14;const g=ac.createGain();g.gain.value=.05;o.connect(g);g.connect(this.padF);o.start();}
  this.noteT=0;}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 tone(f,dur,{type='sine',vol=.1,slide=1,delay=0,wet=.3,attack=.005}={}){const ac=this.ac;if(!ac)return;const t=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide!==1)o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+attack);g.gain.exponentialRampToValueAtTime(.0005,t+dur);o.connect(g);g.connect(this.lp);if(wet){const w=this.ac.createGain();w.gain.value=wet;g.connect(w);w.connect(this.dl);}o.start(t);o.stop(t+dur+.05);}
 noise(dur,{freq=800,q=1,vol=.2,type='bandpass',delay=0,slide=1}={}){const ac=this.ac;if(!ac)return;const t=ac.currentTime+delay;const n=ac.createBufferSource();const b=ac.createBuffer(1,Math.max(1,ac.sampleRate*dur|0),ac.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;n.buffer=b;
  const f=ac.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t);if(slide!==1)f.frequency.exponentialRampToValueAtTime(freq*slide,t+dur);f.Q.value=q;const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0005,t+dur);n.connect(f);f.connect(g);g.connect(this.lp);n.start(t);}
 bubbles(n=5,vol=.06){for(let i=0;i<n;i++)this.tone(300+Math.random()*700,.07+Math.random()*.05,{vol,slide:1.9,delay:i*.06+Math.random()*.05,wet:.2});}
 breath(){this.noise(.9,{freq:500,q:.8,vol:.05,slide:1.6});this.bubbles(6,.035);}
 pick(){this.tone(660,.12,{vol:.09});this.tone(990,.18,{vol:.07,delay:.07});}
 scanTick(){this.tone(1400,.05,{vol:.03,wet:0});}
 scanDone(){[880,1175,1568].forEach((f,i)=>this.tone(f,.35,{vol:.08,delay:i*.08}));}
 craft(){[523,659,784,1046].forEach((f,i)=>this.tone(f,.3,{type:'triangle',vol:.08,delay:i*.07}));this.noise(.4,{freq:2000,vol:.04,slide:.5});}
 deny(){this.tone(180,.18,{type:'square',vol:.05,wet:0});}
 ping(){this.tone(1320,1.6,{vol:.11,wet:.8});this.tone(1318,1.6,{vol:.05,delay:.9,wet:.6});}
 hurt(){this.tone(140,.35,{type:'sawtooth',vol:.14,slide:.45});this.noise(.3,{freq:300,vol:.2});}
 bite(){this.noise(.6,{freq:180,q:.5,vol:.5,type:'lowpass'});this.tone(70,.8,{type:'sawtooth',vol:.25,slide:.5});}
 swipe(){this.noise(.18,{freq:1800,q:2,vol:.1,slide:.4});}
 eat(){this.noise(.25,{freq:900,vol:.08});this.tone(400,.15,{vol:.05,delay:.15});}
 flare(){this.noise(1.2,{freq:3000,q:.6,vol:.12,slide:.5});this.tone(220,.6,{type:'square',vol:.05,slide:1.5});}
 pulse(){this.tone(90,1.2,{type:'sawtooth',vol:.2,slide:3});this.noise(.8,{freq:600,q:3,vol:.2,slide:4});}
 warn(){this.tone(880,.2,{type:'square',vol:.05,wet:0});this.tone(660,.2,{type:'square',vol:.05,delay:.24,wet:0});}
 heart(){this.tone(55,.18,{vol:.25,wet:0});this.tone(50,.2,{vol:.2,delay:.22,wet:0});}
 roar(close=0){const ac=this.ac;if(!ac)return;const t=ac.currentTime;const o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();o.type='sawtooth';o2.type='square';o.frequency.setValueAtTime(70,t);o.frequency.linearRampToValueAtTime(120,t+.6);o.frequency.exponentialRampToValueAtTime(38,t+2.6);o2.frequency.setValueAtTime(52,t);o2.frequency.exponentialRampToValueAtTime(30,t+2.6);
  f.type='bandpass';f.frequency.setValueAtTime(300,t);f.frequency.linearRampToValueAtTime(900,t+.7);f.frequency.exponentialRampToValueAtTime(200,t+2.6);f.Q.value=2;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(close?.5:.28,t+.3);g.gain.exponentialRampToValueAtTime(.001,t+2.8);
  o.connect(f);o2.connect(f);f.connect(g);g.connect(this.lp);g.connect(this.dl);o.start(t);o2.start(t);o.stop(t+3);o2.stop(t+3);this.noise(2.4,{freq:220,q:.6,vol:close?.35:.2,type:'lowpass'});}
 jet(on){const ac=this.ac;if(!ac)return;if(!this.jetG){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=95;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=420;this.jetG=ac.createGain();this.jetG.gain.value=0;o.connect(f);f.connect(this.jetG);this.jetG.connect(this.lp);o.start();this.jetO=o;}
  this.jetG.gain.setTargetAtTime(on?.05:0,ac.currentTime,.12);if(this.jetO)this.jetO.frequency.setTargetAtTime(on===2?140:95,ac.currentTime,.3);}
 update(dt,depth,under,playing){const ac=this.ac;if(!ac)return;this.lp.frequency.setTargetAtTime(under?Math.max(380,1600-depth*4):6000,ac.currentTime,.2);this.pad.gain.setTargetAtTime(playing?Math.min(.5,.08+depth/400):.12,ac.currentTime,1);this.padF.frequency.setTargetAtTime(Math.max(160,620-depth*1.2),ac.currentTime,1);
  this.noteT-=dt;if(this.noteT<=0){this.noteT=2.5+Math.random()*4;const sc=depth>200?[110,123.5,146.8,164.8,220]:[261.6,293.7,329.6,392,440,523.3];const f=sc[Math.random()*sc.length|0]*(Math.random()<.3?2:1);this.tone(f,3.5,{type:'sine',vol:.035,attack:.6,wet:.9});}}
}
