// SKATE CITY — synthesized audio (no files): urethane roll, metal grind scrape, pops, landings, pickups and a lo-fi beat.
export class Sound{
 constructor(){this.ac=null;this.on=true;this.music=true;this.nextBeat=0;this.step=0;}
 init(){if(this.ac)return;try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);
  this.out=ac.createGain();this.out.gain.value=.75;this.out.connect(comp);this.mus=ac.createGain();this.mus.gain.value=.22;this.mus.connect(this.out);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=w*.6+last*3;}this.noise=b;
  const loop=(type,f,q)=>{const s=ac.createBufferSource();s.buffer=b;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(this.out);s.start();return{fl,g};};
  this.roll=loop('bandpass',500,.7);this.rumble=loop('lowpass',120,.5);this.grind=loop('bandpass',3200,5);
  const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=1900;const og=ac.createGain();og.gain.value=0;const of=ac.createBiquadFilter();of.type='highpass';of.frequency.value=1500;o.connect(of);of.connect(og);og.connect(this.out);o.start();this.squeal={o,g:og};
  this.wind=loop('bandpass',900,.4);}catch(e){this.ac=null;}}
 update(dt,sk){if(!this.ac)return;const t=this.ac.currentTime,sp=sk?Math.min(1,sk.speed/15):0,mode=sk?sk.mode:'';const gr=mode==='ground',gd=mode==='grind';
  const T=(p,v,k=.06)=>p.setTargetAtTime(this.on?v:0,t,k);
  T(this.roll.g.gain,gr?.05+sp*.16:0);this.roll.fl.frequency.setTargetAtTime(300+sp*900,t,.08);T(this.rumble.g.gain,gr?.08+sp*.25:0);
  T(this.grind.g.gain,gd?.12+sp*.1:0,.03);this.grind.fl.frequency.setTargetAtTime(2600+Math.random()*900,t,.02);T(this.squeal.g.gain,gd?.012:0,.03);this.squeal.o.frequency.setTargetAtTime(1700+Math.random()*500,t,.02);
  T(this.wind.g.gain,mode==='air'?.02+sp*.08:0,.15);
  this.beat();}
 // lo-fi boom-bap loop scheduled ahead of time
 beat(){const ac=this.ac,bpm=88,st=60/bpm/4;if(!this.music||!this.on){this.nextBeat=0;return;}if(!this.nextBeat||this.nextBeat<ac.currentTime-.2)this.nextBeat=ac.currentTime+.05;
  const bass=[38,0,0,38,0,0,41,0,43,0,0,43,0,41,0,36];const ch=[[50,53,57],[48,52,55],[46,50,53],[45,48,52]];
  while(this.nextBeat<ac.currentTime+.15){const s=this.step%16,bar=(this.step>>4)%4,t=this.nextBeat;
   if(s===0||s===10||(s===7&&bar%2))this.kick(t);if(s===4||s===12)this.snare(t);if(s%2===0)this.hat(t,s%4===2?.05:.025);
   const b=bass[s];if(b)this.tone(t,'triangle',440*Math.pow(2,(b-69-12+(bar===2?-2:bar===3?-4:0))/12),st*2.6,.14,this.mus);
   if(s===0)ch[bar].forEach(m=>this.tone(t,'sine',440*Math.pow(2,(m-69)/12),st*14,.035,this.mus,.4));
   this.step++;this.nextBeat+=st;}}
 kick(t){const ac=this.ac,o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(40,t+.18);g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(this.mus);o.start(t);o.stop(t+.32);}
 snare(t){this._n(.18,2200,900,.8,.3,'bandpass',t,this.mus);this.tone(t,'triangle',190,.1,.12,this.mus);}
 hat(t,v){this._n(.04,9000,7000,1,v,'highpass',t,this.mus);}
 tone(t,type,f,dur,vol,dest,att=.005){const ac=this.ac,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+att);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(dest||this.out);o.start(t);o.stop(t+dur+.05);}
 _n(dur,f0,f1,q,vol,type='lowpass',t,dest){const ac=this.ac;t=t??ac.currentTime;const s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(dest||this.out);s.start(t,Math.random());s.stop(t+dur);}
 _o(type,f0,f1,dur,vol,delay=0){const ac=this.ac,t=ac.currentTime+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(this.out);o.start(t);o.stop(t+dur+.02);}
 play(k,a=1){if(!this.ac||!this.on)return;try{const ac=this.ac;switch(k){
  case'pop':this._n(.05,3500,1500,1.2,.35,'bandpass');this._o('sine',140,60,.12,.25);break;
  case'land':this._o('sine',110,45,.18,Math.min(.5,.15+a*.03));this._n(.12,1200,200,.8,Math.min(.4,.1+a*.03));break;
  case'bump':this._o('square',90,40,.15,.12);this._n(.15,800,120,1,.25);break;
  case'bail':this._o('sine',90,30,.5,.55);this._n(.45,1600,80,.7,.5);this._n(.3,600,100,.6,.3,'lowpass');break;
  case'splash':this._n(.9,2500,200,.4,.5,'bandpass');this._n(.6,600,100,.5,.4);break;
  case'grind':this._n(.08,5000,2500,2,.25,'bandpass');this._o('square',1400,900,.08,.05);break;
  case'trick':this._n(.2,600,2600,1.2,.08,'bandpass');break;
  case'letter':[0,4,7,12].forEach((s,i)=>this._o('triangle',660*Math.pow(2,s/12),660*Math.pow(2,s/12),.25,.12,i*.06));break;
  case'tape':[0,7,12,16,19,24].forEach((s,i)=>this._o('square',523*Math.pow(2,s/12),523*Math.pow(2,s/12),.3,.07,i*.07));break;
  case'gap':this._o('triangle',880,880,.16,.12);this._o('triangle',1320,1320,.22,.12,.09);break;
  case'bank':this._o('sine',1568,1568,.35,.12);this._o('sine',2093,2093,.45,.1,.07);this._n(.08,8000,6000,1,.06,'highpass');break;
  case'special':this._o('sawtooth',220,880,.6,.08);this._o('sawtooth',330,1320,.6,.06,.05);break;
  case'goal':[0,4,7,12,7,12,16].forEach((s,i)=>this._o('square',523*Math.pow(2,s/12),523*Math.pow(2,s/12),.22,.07,i*.09));break;
  case'beep':this._o('square',a?990:660,a?990:660,a?.45:.15,.07);break;
  case'horn':[196,247,294].forEach(f=>this._o('sawtooth',f,f,1.2,.06));break;
  case'click':this._o('square',1200,1200,.04,.04);break;}}catch(e){}}
 setOn(v){this.on=v;}
}
