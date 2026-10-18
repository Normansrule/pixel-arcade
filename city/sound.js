// NEON BAY — WebAudio synthesis only: engine, tyres, wind, rain, sirens, horn, sfx, and a 3-station radio sequencer.
import {rng,cl} from './util.js';
import {boot,master,gain,noiseBuf,reverb,bed,tone as osc,hiss} from '../js/kit3d/audio.js';
const mtof=m=>440*Math.pow(2,(m-69)/12);
export const STATIONS=[{name:'BAYWAVE 88.1',tag:'SYNTHWAVE',bpm:100},{name:'PALM FM 96.4',tag:'BOOGIE · DISCO',bpm:116},{name:'KICKBACK 104.7',tag:'LO-FI BEATS',bpm:84},{name:'RADIO OFF',tag:'',bpm:0}];
export class Sound{
 constructor(){this.ac=null;this.on=true;this.station=0;this.radioVol=0;this.R=rng(3);}
 init(){boot(this,ac=>{this.master=master(ac,.8,-14,4);this.sfx=gain(ac,1,this.master);const b=this.noise=noiseBuf(ac);
  // radio bus: music -> tone -> gain (with reverb + delay sends)
  this.radio=gain(ac,0,this.master);const tone=ac.createBiquadFilter();tone.type='lowpass';tone.frequency.value=9000;tone.connect(this.radio);this.music=gain(ac,.55,tone);
  this.verbIn=reverb(ac,2.2,2.6,.5,this.music);
  this.dly=ac.createDelay(1);this.dly.delayTime.value=.45;const df=ac.createBiquadFilter();df.type='lowpass';df.frequency.value=2500;this.dly.connect(df);df.connect(gain(ac,.32,this.dly));df.connect(this.music);this.dlyIn=gain(ac,.4,this.dly);
  // continuous layers
  const loop=(f,type,q,g0)=>bed(ac,b,type,f,q,this.sfx,g0,Math.random());
  this.tire=loop(1700,'bandpass',4,0);this.wind=loop(500,'lowpass',.7,0);this.rainL=loop(3200,'highpass',.4,0);this.amb=loop(220,'lowpass',.5,.02);this.splashL=loop(900,'bandpass',.6,0);
  const eo=ac.createOscillator();eo.type='sawtooth';const eo2=ac.createOscillator();eo2.type='square';const ef=ac.createBiquadFilter();ef.type='lowpass';ef.frequency.value=600;ef.Q.value=2;const eg=gain(ac,0,this.sfx);eo.connect(ef);eo2.connect(ef);ef.connect(eg);eo.start();eo2.start();
  const er=loop(900,'bandpass',1.5,0);this.eng={o:eo,o2:eo2,f:ef,g:eg,r:er};
  const so=ac.createOscillator();so.type='square';const sf=ac.createBiquadFilter();sf.type='lowpass';sf.frequency.value=2200;const sg=gain(ac,0,this.sfx);so.connect(sf);sf.connect(sg);so.start();this.sir={o:so,g:sg};
  const ho=[ac.createOscillator(),ac.createOscillator()];const hg=gain(ac,0,this.sfx);const hf=ac.createBiquadFilter();hf.type='lowpass';hf.frequency.value=1800;ho.forEach((o,i)=>{o.type='square';o.frequency.value=i?415:349;o.connect(hf);o.start();});hf.connect(hg);this.horn={g:hg,o:ho};
  this.seq={next:0,step:0,bar:0,song:0};});}
 // ---- continuous layers ----
 drive(v,on){if(!this.ac)return;const t=this.ac.currentTime;const E=this.eng;if(!on||!v){E.g.gain.setTargetAtTime(0,t,.1);E.r.g.gain.setTargetAtTime(0,t,.1);this.tire.g.gain.setTargetAtTime(0,t,.08);this.wind.g.gain.setTargetAtTime(0,t,.2);return;}
  const sp=Math.abs(v.vf),top=v.spec.max;const gears=[.16,.3,.46,.64,.84,1.1].map(k=>k*top);let lo=0,g=0;for(;g<gears.length-1&&sp>gears[g];g++)lo=gears[g];const rpm=cl((sp-lo)/(gears[g]-lo),0,1)*.75+.18+(v.onG?0:.15);const load=Math.abs(v.ctrl.thr);
  const base=v.bike?82:v.id==='bruiser'?40:v.id==='zephyr'?62:v.id==='parcel'||v.id==='hauler'?44:52;const f=base*(1+rpm*2.4)*(v.wrecked?.5:1);
  E.o.frequency.setTargetAtTime(f,t,.04);E.o2.frequency.setTargetAtTime(f*.5,t,.04);E.f.frequency.setTargetAtTime(300+rpm*1600*(.4+load*.6),t,.05);E.g.gain.setTargetAtTime(v.wrecked?.01:.05+load*.05+rpm*.03,t,.06);E.r.f.frequency.setTargetAtTime(700+rpm*1800,t,.05);E.r.g.gain.setTargetAtTime(.02+load*.05,t,.06);
  this.tire.g.gain.setTargetAtTime(v.onG&&sp>3&&v.surf==='road'?v.slip*.16:0,t,.05);this.tire.f.frequency.setTargetAtTime(v.surf==='road'?1700:500,t,.1);this.wind.g.gain.setTargetAtTime(Math.min(.16,sp*sp*.00006),t,.2);this.wind.f.frequency.setTargetAtTime(300+sp*18,t,.2);}
 env(rain,siren,sirenPh,inCar,amb){if(!this.ac)return;const t=this.ac.currentTime;this.rainL.g.gain.setTargetAtTime(rain*(inCar?.05:.11),t,.3);this.amb.g.gain.setTargetAtTime(.012+amb*.03,t,.4);
  this.sir.g.gain.setTargetAtTime(siren*.05,t,.1);this.sir.o.frequency.setTargetAtTime(siren>0?(sirenPh%2<1?650+Math.sin(sirenPh*Math.PI)*0:0)+(Math.sin(sirenPh*3)*.5+.5)*600+600:600,t,.05);}
 chopper(v){if(!this.ac)return;const ac=this.ac,t=ac.currentTime;if(!this.chop){if(v<=0)return;const s=ac.createBufferSource();s.buffer=this.noise;s.loop=true;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const am=ac.createGain();am.gain.value=.5;const lfo=ac.createOscillator();lfo.type='sawtooth';lfo.frequency.value=13;const lg=ac.createGain();lg.gain.value=.5;lfo.connect(lg);lg.connect(am.gain);const g=gain(ac,0,this.sfx);s.connect(f);f.connect(am);am.connect(g);s.start();lfo.start();this.chop={g,lfo};}
  this.chop.g.gain.setTargetAtTime(Math.min(1,v)*v*.22,t,.3);this.chop.lfo.frequency.setTargetAtTime(12+v*3,t,.5);}
 hornOn(on){if(!this.ac)return;this.horn.g.gain.setTargetAtTime(on?.09:0,this.ac.currentTime,.02);}
 // ---- one-shots ----
 _n(dur,f0,f1,q,vol,type='lowpass',dest,delay=0){return hiss(this.ac,this.noise,dest||this.sfx,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,0,20);}
 _o(type,f0,f1,dur,vol,delay=0,dest){osc(this.ac,dest||this.sfx,this.ac.currentTime+delay,type,f0,f1,dur,vol,.008);}
 play(k,a=1){if(!this.ac||!this.on)return;try{switch(k){
  case'crash':{const v=Math.min(.6,.1+a*.02);this._n(.5,3000,200,.8,v);this._o('sine',120,40,.35,v*.8);this._n(.25,6000,2500,1,v*.4,'highpass');if(a>14)this._n(.9,1400,90,.5,v*.6);break;}
  case'scrape':this._n(.25,2400,1800,3,.06,'bandpass');break;
  case'land':this._o('sine',90,38,.25,Math.min(.4,a*.02));this._n(.15,800,200,1,Math.min(.2,a*.01));break;
  case'jump':this._n(.12,500,1500,1,.04,'bandpass');break;
  case'step':this._n(.05,1200+Math.random()*600,500,2,.025,'bandpass');break;
  case'splash':this._n(1.2,2500,200,.5,.35);this._n(.5,900,300,1,.2,'bandpass');break;
  case'door':this._o('square',140,90,.08,.05);this._n(.08,1500,400,1,.08);break;
  case'cash':[0,.07,.14].forEach((d,i)=>this._o('triangle',[1319,1568,2093][i],[1319,1568,2093][i],.22,.07,d));break;
  case'cp':this._o('sine',880,880,.12,.1);this._o('sine',1320,1320,.2,.08,.06);break;
  case'beep':this._o('square',a?1046:523,a?1046:523,a?.5:.16,.06);break;
  case'pass':[523,659,784,1046,784,1046].forEach((f,i)=>this._o('square',f,f,.24,.05,i*.11));this._o('sawtooth',131,131,1.1,.05,.1);break;
  case'fail':[392,311,262].forEach((f,i)=>this._o('sawtooth',f,f*.97,.38,.06,i*.22));break;
  case'busted':[466,440,415,392].forEach((f,i)=>this._o('square',f,f*.98,.3,.06,i*.2));this._n(.7,1800,300,1,.12,'bandpass',null,.8);break;
  case'pop':this._n(.18,3500,600,1,.35);this._n(.6,900,200,2,.08,'bandpass');break;
  case'star':this._o('square',740,740,.09,.05);this._o('square',988,988,.12,.05,.1);break;
  case'lost':[659,784,988].forEach((f,i)=>this._o('triangle',f,f,.25,.07,i*.1));break;
  case'shutter':this._n(.06,6000,3000,1,.25,'highpass');this._n(.09,3000,1200,1,.18,'bandpass',null,.07);break;
  case'stunt':[523,698,880,1046].forEach((f,i)=>this._o('sawtooth',f,f,.3,.04,i*.08));this._n(.8,400,4000,.7,.08,'bandpass');break;
  case'honk':{const g=Math.min(.06,a*.06);[330,392].forEach(f=>this._o('square',f,f,.32,g));break;}
  case'tune':this._n(.35,4000,800,.8,.06,'bandpass',this.music);break;
  case'buy':[392,523,659,784].forEach((f,i)=>this._o('triangle',f,f,.3,.07,i*.07));break;
  case'whoosh':this._n(.5,300,2600,.8,.1,'bandpass');break;
  case'yelp':this._o('triangle',600+Math.random()*300,900,.14,.03);break;
  case'phone':this._o('sine',1200,1200,.05,.05);break;
  case'spray':this._n(1.4,5000,3000,.6,.1,'highpass');break;}}catch(e){}}

 /* ---------------- radio ---------------- */
 setStation(i){this.station=i;if(this.ac){this.play('tune');this.seq.bar=0;this.seq.step=0;this.seq.next=this.ac.currentTime+.1;this.seq.song=(this.R()*3)|0;}}
 radioLevel(v){if(!this.ac)return;this.radio.gain.setTargetAtTime(v,this.ac.currentTime,.4);this.radioVol=v;}
 tick(){if(!this.ac||this.station>=3||this.radioVol<.005)return;const S=STATIONS[this.station],q=this.seq,ac=this.ac,sp=60/S.bpm/4;if(q.next<ac.currentTime-.3)q.next=ac.currentTime+.05;
  while(q.next<ac.currentTime+.18){let t=q.next;if(this.station===2&&q.step%2===1)t+=sp*.32;this.note(this.station,q.step,q.bar,t,sp);q.next+=sp;q.step++;if(q.step>=16){q.step=0;q.bar++;if(q.bar%8===0)q.song=(q.song+1+(this.R()*2|0))%3;}}}
 // instruments (scheduled at time t, into the music bus)
 kick(t,v=.9){const ac=this.ac,o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g);g.connect(this.music);o.start(t);o.stop(t+.4);}
 snare(t,v=.4,verb=.4){const ac=this.ac,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1900;f.Q.value=.7;const g=ac.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);s.connect(f);f.connect(g);g.connect(this.music);if(verb){const sg=ac.createGain();sg.gain.value=verb;g.connect(sg);sg.connect(this.verbIn);}s.start(t,Math.random());s.stop(t+.3);
  const o=ac.createOscillator();o.type='triangle';o.frequency.setValueAtTime(200,t);o.frequency.exponentialRampToValueAtTime(140,t+.08);const og=ac.createGain();og.gain.setValueAtTime(v*.5,t);og.gain.exponentialRampToValueAtTime(.001,t+.1);o.connect(og);og.connect(this.music);o.start(t);o.stop(t+.12);}
 hat(t,v=.08,open=false){const ac=this.ac,s=ac.createBufferSource();s.buffer=this.noise;const f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=7500;const g=ac.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+(open?.28:.045));s.connect(f);f.connect(g);g.connect(this.music);s.start(t,Math.random());s.stop(t+.3);}
 tone(t,type,f,dur,v,o={}){const ac=this.ac,os=ac.createOscillator();os.type=type;os.frequency.setValueAtTime(f,t);if(o.detune)os.detune.value=o.detune;const fl=ac.createBiquadFilter();fl.type='lowpass';fl.Q.value=o.q??1;fl.frequency.setValueAtTime(o.cut??3000,t);if(o.env)fl.frequency.exponentialRampToValueAtTime(Math.max(80,o.env),t+dur);
  const g=ac.createGain();const at=o.at??.005;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+at);g.gain.setTargetAtTime(0,t+Math.max(at,dur*(o.hold??.6)),dur*(o.rel??.3)+.01);os.connect(fl);fl.connect(g);g.connect(this.music);if(o.verb){const sg=this.ac.createGain();sg.gain.value=o.verb;g.connect(sg);sg.connect(this.verbIn);}if(o.delay){const dg=this.ac.createGain();dg.gain.value=o.delay;g.connect(dg);dg.connect(this.dlyIn);}os.start(t);os.stop(t+dur*1.8+.3);}
 note(st,s,bar,t,sp){const bt=bar%4;
  if(st===0){// synthwave in A minor
   const P=[[[0,'m'],[-4,'M'],[3,'M'],[-2,'M']],[[0,'m'],[-2,'M'],[-4,'M'],[-5,'M']],[[-4,'M'],[-2,'M'],[-5,'m'],[0,'m']]][this.seq.song];const[r,qq]=P[bt],root=57+r,ch=qq==='m'?[0,3,7]:[0,4,7];
   if(s===0||s===8||(s===10&&bar%2))this.kick(t,.85);if(s===4||s===12)this.snare(t,.32,.9);if(s%2===0)this.hat(t,s%4===2?.07:.04);
   if(s%2===0)this.tone(t,'sawtooth',mtof(root-24+(s%4===2?12:0)),sp*1.6,.13,{cut:900,env:200,q:4});
   const arp=[0,1,2,1,0,2,1,2];this.tone(t,'square',mtof(root+12+ch[arp[s%8]]+(s>=8?12:0)),sp*.9,.035,{cut:2600,env:700,delay:.5});
   if(s===0){for(const c of ch)this.tone(t,'sawtooth',mtof(root+c),sp*16,.028,{cut:1400,at:.5,hold:.85,rel:.4,detune:(c%2?7:-7),verb:.3});}
   if(bar%8>=4&&(s===0||s===6||s===10)){const mel=[12,15,19,17,15,12,10,7];this.tone(t,'sawtooth',mtof(root+12+mel[(bar*3+s)%8]),sp*3,.04,{cut:3200,delay:.6,verb:.3});}}
  else if(st===1){// boogie / disco in D dorian
   const P=[[[0,'m7'],[0,'m7'],[5,'7'],[5,'7']],[[3,'M7'],[2,'m7'],[0,'m7'],[-2,'M7']],[[0,'m7'],[5,'7'],[3,'M7'],[5,'7']]][this.seq.song];const[r,qq]=P[bt],root=50+r,ch=qq==='m7'?[0,3,7,10]:qq==='7'?[0,4,7,10]:[0,4,7,11];
   if(s%4===0)this.kick(t,.8);if(s===4||s===12){this.snare(t,.22,.15);this.hat(t,.06,true);}this.hat(t,s%4===2?.07:.03,s%4===2);
   const bl=[0,null,12,null,0,7,12,null,0,null,12,10,0,null,7,12][s];if(bl!==null)this.tone(t,'square',mtof(root-24+bl),sp*.9,.12,{cut:700,env:250,q:6});
   if(s%4===2)for(const c of ch)this.tone(t,'square',mtof(root+12+c),sp*.6,.018,{cut:3500,env:1500,q:3});
   if(s===0&&bar%2===0)for(const c of ch)this.tone(t,'sawtooth',mtof(root+24+c),sp*28,.012,{cut:2400,at:.3,hold:.9,verb:.4,detune:c%2?6:-6});
   if(bar%4>=2&&[0,3,6,8,11].includes(s)){const mel=[0,3,5,7,10,12,10,7];this.tone(t,'triangle',mtof(root+24+mel[(s+bar)%8]),sp*1.4,.05,{cut:4000,delay:.3});}}
  else{// lo-fi in C minor
   const P=[[[0,[0,3,7,10,14]],[5,[0,3,7,10,14]],[-4,[0,4,7,11]],[-5,[0,4,7,10,13]]],[[0,[0,3,7,10,14]],[-2,[0,4,7,11]],[-4,[0,4,7,11]],[-5,[0,4,7,10]]],[[5,[0,3,7,10]],[-2,[0,4,7,10]],[0,[0,3,7,10,14]],[0,[0,3,7,10,14]]]][this.seq.song];const[r,ch]=P[bt],root=48+r;
   if(s===0||s===7||(s===10&&bar%2===0))this.kick(t,.7);if(s===4||s===12)this.snare(t,.2,.25);if(s%2===0)this.hat(t,.03+(s%4===2?.02:0));
   if(s===0||s===10)this.tone(t,'sine',mtof(root-12),sp*(s?5:9),.22,{cut:500});
   if(s===0||(s===11&&bar%2))for(const c of ch)this.tone(t+Math.random()*.02,'triangle',mtof(root+12+c),sp*12,.03,{cut:1800,env:700,at:.01,hold:.25,rel:.7,verb:.35});
   if(s===14&&bar%2===1){const mel=[7,10,14,15,12];this.tone(t,'sine',mtof(root+24+mel[bar%5]),sp*4,.05,{cut:3000,delay:.4,verb:.3});}
   if(s===0)this._n(sp*16,4000,3800,.5,.006,'highpass',this.music);}}}
