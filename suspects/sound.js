// STARSHIP SUSPECTS — synthesized sound (no audio files): ship hum, footsteps, task blips, kills, alarms, meetings.
export class Sound{
 constructor(){this.ac=null;this.on=true;this.alarmG=null;}
 init(){if(this.ac)return;try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);this.out=ac.createGain();this.out.gain.value=.65;this.out.connect(comp);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;this.noise=b;
  // ship hum: two detuned low oscillators + rumbling filtered noise
  this.hum=ac.createGain();this.hum.gain.value=.05;this.hum.connect(this.out);
  for(const f of[46,46.7,92.3]){const o=ac.createOscillator();o.type=f>90?'triangle':'sawtooth';o.frequency.value=f;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=180;const g=ac.createGain();g.gain.value=f>90?.25:.5;o.connect(lp);lp.connect(g);g.connect(this.hum);o.start();}
  const ns=ac.createBufferSource();ns.buffer=b;ns.loop=true;const nf=ac.createBiquadFilter();nf.type='lowpass';nf.frequency.value=260;const ng=ac.createGain();ng.gain.value=.6;ns.connect(nf);nf.connect(ng);ng.connect(this.hum);ns.start();
  // alarm klaxon (gated)
  this.alarmG=ac.createGain();this.alarmG.gain.value=0;this.alarmG.connect(this.out);const ao=ac.createOscillator();ao.type='square';ao.frequency.value=440;const lfo=ac.createOscillator();lfo.frequency.value=1.4;const lg=ac.createGain();lg.gain.value=180;lfo.connect(lg);lg.connect(ao.frequency);const af=ac.createBiquadFilter();af.type='lowpass';af.frequency.value=1400;ao.connect(af);af.connect(this.alarmG);ao.start();lfo.start();
 }catch(e){this.ac=null;}}
 alarm(on){if(!this.ac)return;this.alarmG.gain.setTargetAtTime(on&&this.on?.05:0,this.ac.currentTime,.1);}
 humLevel(v){if(this.ac)this.hum.gain.setTargetAtTime(v,this.ac.currentTime,.4);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0){const ac=this.ac,t=ac.currentTime+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(this.out);s.start(t,Math.random());s.stop(t+dur);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'step':this._n(.06,900+Math.random()*300,300,1.2,.035*a,'bandpass');break;
  case'click':this._o('square',1400,1200,.04,.04);break;
  case'blip':this._o('sine',880,990,.08,.06);break;
  case'chat':this._o('triangle',640+Math.random()*120,700,.07,.04);break;
  case'wire':this._o('sine',520*a,780*a,.12,.07);break;
  case'done':[0,.09,.18].forEach((d,i)=>this._o('sine',[660,880,1320][i],[660,880,1320][i],.22,.07,d));break;
  case'fail':this._o('square',220,140,.25,.06);break;
  case'shoot':this._n(.12,3000,400,1,.12);this._o('square',900,200,.1,.04);break;
  case'boom':this._n(.4,1800,80,.7,.2);this._o('sine',120,40,.3,.15);break;
  case'kill':this._n(.18,4000,300,.8,.35);this._o('sawtooth',180,40,.35,.18);this._o('sine',90,30,.5,.3,.05);break;
  case'body':[0,.25,.5].forEach(d=>{this._o('sawtooth',740,560,.22,.08,d);});break;
  case'meeting':this._o('sawtooth',196,196,1.2,.06);this._o('sawtooth',294,294,1.2,.05);this._o('sawtooth',392,390,1.2,.04);this._n(.6,600,3000,.8,.1,'bandpass');break;
  case'vote':this._o('square',300,600,.08,.06);this._n(.08,2000,800,1,.06);break;
  case'eject':this._n(2.4,200,4000,.6,.18,'bandpass');this._o('sine',80,30,2,.2);break;
  case'vent':this._n(.25,500,120,1.5,.25);this._o('square',110,70,.18,.08);this._n(.4,3000,800,.5,.06,'highpass',.05);break;
  case'door':this._o('square',90,60,.25,.12);this._n(.2,1500,200,1,.2);break;
  case'lights':this._o('sawtooth',300,40,.9,.1);this._n(.5,800,60,1,.12);break;
  case'fixed':[0,.1].forEach((d,i)=>this._o('sine',[523,784][i],[523,784][i],.3,.07,d));break;
  case'win':[0,.15,.3,.45].forEach((d,i)=>this._o('triangle',[392,494,587,784][i],[392,494,587,784][i],.8,.07,d));break;
  case'lose':[0,.25,.5].forEach((d,i)=>this._o('sawtooth',[330,262,196][i],[320,250,180][i],.7,.06,d));break;
  case'role':this._o('sine',110,55,1.6,.25);this._n(1.4,300,3000,.7,.08,'bandpass');break;}}catch(e){}}}
