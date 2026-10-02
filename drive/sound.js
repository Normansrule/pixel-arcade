// NIGHT DRIVE — synthesized audio: engine (rpm + gears), tyre screech, wind, rain, crashes, horn, siren, UI blips,
// plus three procedural radio stations (synthwave, techno, lo-fi) on a look-ahead scheduler.
const R=Math.random;
export const STATIONS=[{id:'neon',name:'NEON 88.1',tag:'SYNTHWAVE · NIGHT CRUISING',bpm:100},{id:'pulse',name:'PULSE 104.7',tag:'TECHNO · 4/4 ALL NIGHT',bpm:124},{id:'tide',name:'LOW TIDE 92.3',tag:'LO-FI · RAIN ON GLASS',bpm:78},{id:'off',name:'RADIO OFF',tag:'JUST THE ENGINE'}];
const mtof=m=>440*Math.pow(2,(m-69)/12);
// chord progressions (MIDI roots) per station
const PROG={neon:[[57,60,64],[53,57,60],[60,64,67],[55,59,62]],pulse:[[45,48,52],[45,48,52],[43,47,50],[41,45,48]],tide:[[62,65,69,72],[60,64,67,71],[57,60,64,67],[59,62,65,69]]};
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.radioVol=.5;this.station=0;this.nextT=0;this.step=0;this.bar=0;this.cam={x:0,z:0,a:0};}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;comp.connect(ac.destination);
  this.master=ac.createGain();this.master.gain.value=this.vol;this.master.connect(comp);this.sfx=ac.createGain();this.sfx.connect(this.master);this.radio=ac.createGain();this.radio.gain.value=this.radioVol;const rlp=ac.createBiquadFilter();rlp.type='lowpass';rlp.frequency.value=9000;this.radio.connect(rlp);rlp.connect(this.master);this.rlp=rlp;
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=R()*2-1;this.noise=b;
  const il=ac.sampleRate*2.2,ib=ac.createBuffer(2,il,ac.sampleRate);for(let c=0;c<2;c++){const x=ib.getChannelData(c);for(let i=0;i<il;i++)x[i]=(R()*2-1)*Math.pow(1-i/il,2.4);}this.verb=ac.createConvolver();this.verb.buffer=ib;this.verbIn=ac.createGain();this.verbIn.gain.value=.35;this.verbIn.connect(this.verb);this.verb.connect(this.radio);
  // engine: two oscillators through a lowpass, plus a noise rumble
  this.eng=ac.createGain();this.eng.gain.value=0;const elp=ac.createBiquadFilter();elp.type='lowpass';elp.frequency.value=900;elp.Q.value=2;this.elp=elp;elp.connect(this.eng);this.eng.connect(this.sfx);
  this.o1=ac.createOscillator();this.o1.type='sawtooth';this.o2=ac.createOscillator();this.o2.type='square';const g2=ac.createGain();g2.gain.value=.5;this.o1.connect(elp);this.o2.connect(g2);g2.connect(elp);this.o1.start();this.o2.start();
  const loop=(f,type,q)=>{const s=ac.createBufferSource();s.buffer=b;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(this.sfx);s.start(0,R());return{g,fl};};
  this.skid=loop(2200,'bandpass',2.5);this.wind=loop(700,'lowpass',.5);this.rain=loop(3000,'highpass',.4);this.rumble=loop(120,'lowpass',.7);
  this.siren=ac.createOscillator();this.siren.type='triangle';this.sirenG=ac.createGain();this.sirenG.gain.value=0;this.siren.connect(this.sirenG);this.sirenG.connect(this.sfx);this.siren.start();
  this.timer=setInterval(()=>this.schedule(),30);}catch(e){this.ac=null;}}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 setRadioVol(v){this.radioVol=v;if(this.radio)this.radio.gain.setTargetAtTime(v,this.ac.currentTime,.1);}
 tune(i){this.station=i;this.bar=0;this.step=0;if(this.ac)this.nextT=this.ac.currentTime+.08;this.blip(900);}
 _out(pan,bus){bus=bus||this.sfx;if(!pan)return bus;const s=this.ac.createStereoPanner();s.pan.value=Math.max(-1,Math.min(1,pan));s.connect(bus);return s;}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0,bus,at,rev){if(vol<.002)return;const ac=this.ac,t=(at??ac.currentTime)+delay,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);s.connect(f);f.connect(g);g.connect(this._out(pan,bus));if(rev)g.connect(this.verbIn);s.start(t,R()*1.5);s.stop(t+dur+.02);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0,bus,at,atk=.005,rev){if(vol<.002)return;const ac=this.ac,t=(at??ac.currentTime)+delay,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=ac.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+atk);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  o.connect(g);g.connect(this._out(pan,bus));if(rev)g.connect(this.verbIn);o.start(t);o.stop(t+dur+.03);}
 /* ---------- continuous car sounds ---------- */
 car(o){if(!this.ac)return;const t=this.ac.currentTime;const sp=o.speed;const gears=[0,9,17,26,36,48,80];let g=1;while(g<6&&sp>gears[g])g++;const lo=gears[g-1],hi=gears[g];const rpm=o.on?(.18+.82*Math.min(1,(sp-lo)/(hi-lo)))*(o.thr>0?1:.85):0;
  const f=38+rpm*150+(o.thr>0?8:0);this.o1.frequency.setTargetAtTime(f,t,.04);this.o2.frequency.setTargetAtTime(f*.5,t,.04);this.elp.frequency.setTargetAtTime(500+rpm*1600+o.thr*500,t,.05);this.eng.gain.setTargetAtTime(o.on?.05+o.thr*.06+rpm*.03:0,t,.08);
  this.skid.g.gain.setTargetAtTime(o.on?Math.min(.22,Math.max(0,o.slip-3)*.025)*(o.ground?1:0):0,t,.05);this.wind.g.gain.setTargetAtTime(o.on?Math.min(.12,sp*.0022):0,t,.2);this.rumble.g.gain.setTargetAtTime(o.on?Math.min(.12,sp*.003)*(o.ground?1:.2):0,t,.1);
  this.rain.g.gain.setTargetAtTime(o.rain*.05,t,.5);this.rlp.frequency.setTargetAtTime(o.tunnel?1400:9000,t,.3);
  // siren: wail pitch, gain by nearest cop distance
  const sg=o.siren>0?Math.min(.06,.06*(1-o.sirenD/180)):0;this.sirenG.gain.setTargetAtTime(Math.max(0,sg),t,.15);this.siren.frequency.setTargetAtTime(700+Math.sin(t*3.2)*250,t,.02);}
 /* ---------- one-shots ---------- */
 crash(v){if(!this.ac)return;const a=Math.min(1,v/25);this._n(.5,1600,90,.6,.6*a,'lowpass');this._n(.25,4200,1800,1.5,.3*a,'bandpass',.02);this._o('sine',90,40,.3,.5*a);if(a>.5)for(let k=0;k<4;k++)this._o('triangle',1800+R()*2000,900,.12,.04*a,.03+k*.05);}
 land(v){if(this.ac)this._n(.25,500,80,.7,Math.min(.5,v*.05),'lowpass');}
 horn(){if(!this.ac)return;this._o('sawtooth',392,392,.45,.09,0,0,null,null,.01);this._o('sawtooth',494,494,.45,.07,0,0,null,null,.01);}
 honkAt(d,pan){if(!this.ac||d>70)return;const a=1/(1+d/12);this._o('square',330,330,.3,.05*a,0,pan);this._o('square',415,415,.3,.04*a,0,pan);}
 blip(f=1200){if(this.ac){this._o('triangle',f,f,.08,.08);}}
 beep(){if(this.ac)this._o('square',880,880,.15,.08);}
 go(){if(this.ac){this._o('square',1320,1320,.35,.09);}}
 cp(){if(this.ac){this._o('triangle',990,1320,.15,.1);this._o('triangle',1320,1760,.15,.08,.08);}}
 cash(){if(!this.ac)return;[0,.07,.14].forEach((d,i)=>this._o('triangle',[1320,1660,1980][i],[1320,1660,1980][i],.18,.09,d));this._n(.2,6000,4000,2,.05,'bandpass',.05);}
 door(){if(this.ac){this._n(.12,900,300,1,.2,'lowpass');this._n(.08,1400,700,2,.15,'bandpass',.18);}}
 fail(){if(this.ac){this._o('sawtooth',300,120,.5,.08);}}
 nitro(){if(this.ac){this._n(.8,300,3000,.8,.18,'bandpass');}}
 splash(){if(this.ac){this._n(.8,1200,200,.5,.4,'lowpass');}}
 thump(){if(this.ac){this._n(.2,400,100,.8,.4,'lowpass');this._o('sine',120,60,.15,.2);}}
 busted(){if(!this.ac)return;[0,.25,.5].forEach(d=>this._o('square',700,700,.18,.08,d));}
 /* ---------- radio ---------- */
 schedule(){if(!this.ac)return;const st=STATIONS[this.station];if(!st||st.id==='off')return;const ac=this.ac,s16=60/st.bpm/4;if(this.nextT<ac.currentTime)this.nextT=ac.currentTime+.03;
  while(this.nextT<ac.currentTime+.16){this.play(st.id,this.step,this.bar,this.nextT,s16);const swing=st.id==='tide'&&this.step%2===0?s16*.18:st.id==='tide'?-s16*.18:0;this.nextT+=s16+swing;this.step++;if(this.step>=16){this.step=0;this.bar++;}}}
 play(id,i,bar,t,s16){const B=this.radio;const ch=PROG[id][bar%4];
  if(id==='neon'){if(i%4===0)this.kick(t,.6);if(i===4||i===12)this.snare(t,.5,true);if(i%2===0)this.hat(t,.025);
   const arp=[0,1,2,1,0,2,1,2];const n=ch[arp[i%8]]+12+(i>=8&&bar%2?12:0);this.pluck(mtof(n),t,s16*.9,.05,'square',2400);if(i===0){this.pad(ch.map(m=>mtof(m)),t,s16*16,.04);this.bass(mtof(ch[0]-24),t,s16*16,.12);}
   if(i%2===1)this.bass(mtof(ch[0]-12),t,s16*.8,.06);}
  else if(id==='pulse'){if(i%4===0)this.kick(t,.75);if(i%4===2)this.hat(t,.05,true);if(i===4||i===12)this.clap(t);const acid=[0,0,12,0,3,0,7,0,0,12,0,10,0,7,3,5];const cut=600+1600*(.5+.5*Math.sin(bar*.7+i*.2));this.acid(mtof(ch[0]-12+acid[i]),t,s16*.85,cut);
   if(i===0&&bar%2===0)this.stab(ch.map(m=>mtof(m+12)),t);}
  else if(id==='tide'){if(i===0||i===10)this.kick(t,.45);if(i===4||i===12)this.snare(t,.25,false);if(i%2===0)this.hat(t,.018);if(i===0)this.keys(ch.map(m=>mtof(m)),t,s16*15);if(i===0||i===7||i===10)this.bass(mtof(ch[0]-24),t,s16*3,.12);
   if(i%4===0)this._n(.05,6000,4000,1,.012*R(),'bandpass',0,0,B,t);}}
 kick(t,v){this._o('sine',150,45,.18,v*.55,0,0,this.radio,t,.002);}
 snare(t,v,big){this._n(big?.35:.14,2600,900,.7,v*.35,'bandpass',0,0,this.radio,t,big);this._o('triangle',200,150,.08,v*.15,0,0,this.radio,t);}
 clap(t){for(let k=0;k<3;k++)this._n(.09,1800,1200,1.2,.12,'bandpass',k*.012,0,this.radio,t,true);}
 hat(t,v,open){this._n(open?.12:.03,9000,7000,1,v,'highpass',0,.3,this.radio,t);}
 pluck(f,t,d,v,type,cut){const ac=this.ac,o=ac.createOscillator(),lp=ac.createBiquadFilter(),g=ac.createGain();o.type=type;o.frequency.value=f;lp.type='lowpass';lp.frequency.setValueAtTime(cut,t);lp.frequency.exponentialRampToValueAtTime(400,t+d);lp.Q.value=4;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(lp);lp.connect(g);g.connect(this.radio);g.connect(this.verbIn);o.start(t);o.stop(t+d+.05);}
 pad(fs,t,d,v){const ac=this.ac;const g=ac.createGain(),lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1400;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.6);g.gain.setValueAtTime(v,t+d-.5);g.gain.linearRampToValueAtTime(0,t+d);lp.connect(g);g.connect(this.radio);g.connect(this.verbIn);
  for(const f of fs)for(const det of[-6,6]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=det;o.connect(lp);o.start(t);o.stop(t+d+.05);}}
 bass(f,t,d,v){const ac=this.ac,o=ac.createOscillator(),lp=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=f;lp.type='lowpass';lp.frequency.value=320;g.gain.setValueAtTime(v,t);g.gain.setTargetAtTime(0,t+d*.85,.05);o.connect(lp);lp.connect(g);g.connect(this.radio);o.start(t);o.stop(t+d+.2);}
 acid(f,t,d,cut){const ac=this.ac,o=ac.createOscillator(),lp=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o.frequency.value=f;lp.type='lowpass';lp.Q.value=12;lp.frequency.setValueAtTime(cut,t);lp.frequency.exponentialRampToValueAtTime(220,t+d);g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(lp);lp.connect(g);g.connect(this.radio);o.start(t);o.stop(t+d+.05);}
 stab(fs,t){for(const f of fs)this.pluck(f,t,.25,.03,'sawtooth',3000);}
 keys(fs,t,d){const ac=this.ac;for(const f of fs){const o=ac.createOscillator(),g=ac.createGain(),trem=ac.createOscillator(),tg=ac.createGain();o.type='sine';o.frequency.value=f;trem.frequency.value=4.5;tg.gain.value=.012;trem.connect(tg);tg.connect(g.gain);g.gain.setValueAtTime(.035,t);g.gain.setTargetAtTime(.012,t+.1,d*.4);g.gain.setTargetAtTime(0,t+d,.2);o.connect(g);g.connect(this.radio);g.connect(this.verbIn);o.start(t);trem.start(t);o.stop(t+d+.6);trem.stop(t+d+.6);}}}
