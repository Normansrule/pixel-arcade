// DROPZONE (adapted from EXFIL) — WebAudio synthesis: layered gunshots with distance filtering + echo, footsteps by surface, foley, UI, and a coastal ambience bed.
const R=Math.random;
const GUN={p9:{f:900,b:150,len:.11,v:.8},vx9:{f:1100,b:140,len:.09,v:.75},ark:{f:1500,b:110,len:.13,v:1},hrn:{f:1300,b:80,len:.2,v:1.15},stk:{f:700,b:70,len:.22,v:1.2}};
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.cam={x:0,y:0,z:0,yaw:0};this.amb=null;}
 init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return;}try{const ac=this.ac=new (window.AudioContext||window.webkitAudioContext)();
  const comp=ac.createDynamicsCompressor();comp.threshold.value=-12;comp.ratio.value=5;comp.connect(ac.destination);this.master=ac.createGain();this.master.gain.value=this.vol;this.master.connect(comp);
  this.sfx=ac.createGain();this.sfx.connect(this.master);this.ui=ac.createGain();this.ui.gain.value=.7;this.ui.connect(this.master);this.ambG=ac.createGain();this.ambG.gain.value=0;this.ambG.connect(this.master);
  const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=R()*2-1;this.noise=b;
  const br=ac.createBuffer(1,n,ac.sampleRate),bd=br.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=(l+.02*(R()*2-1))/1.02;bd[i]=l*3.5;}this.brown=br;
  const il=ac.sampleRate*2.6,ib=ac.createBuffer(2,il,ac.sampleRate);for(let c=0;c<2;c++){const x=ib.getChannelData(c);for(let i=0;i<il;i++)x[i]=(R()*2-1)*Math.pow(1-i/il,3.2)*(i<ac.sampleRate*.02?.2:1);}
  this.verb=ac.createConvolver();this.verb.buffer=ib;this.verbIn=ac.createGain();this.verbIn.gain.value=.45;this.verbIn.connect(this.verb);this.verb.connect(this.sfx);this.startAmb();}catch(e){this.ac=null;}}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 listener(x,y,z,yaw){this.cam.x=x;this.cam.y=y;this.cam.z=z;this.cam.yaw=yaw;}
 at(p){if(!p)return[0,0];const c=this.cam;const dx=p.x-c.x,dz=p.z-c.z,dy=(p.y||0)-c.y;const d=Math.hypot(dx,dy,dz)||1;const rx=Math.cos(c.yaw),rz=-Math.sin(c.yaw);return[d,(dx*rx+dz*rz)/d];}
 chain(pan,lp,bus){const ac=this.ac;let out=bus||this.sfx;if(pan){const s=ac.createStereoPanner();s.pan.value=Math.max(-1,Math.min(1,pan));s.connect(out);out=s;}if(lp&&lp<18000){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=lp;f.connect(out);out=f;}return out;}
 _n(dur,f0,f1,q,vol,type='lowpass',o={}){if(!this.ac||vol<.002)return;const ac=this.ac,t=ac.currentTime+(o.delay||0),s=ac.createBufferSource();s.buffer=o.brown?this.brown:this.noise;const f=ac.createBiquadFilter();f.type=type;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);
  const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(o.atk||.003));g.gain.exponentialRampToValueAtTime(.0005,t+dur);s.connect(f);f.connect(g);g.connect(this.chain(o.pan,o.lp,o.bus));if(o.rev)g.connect(this.verbIn);s.start(t,R()*1.5);s.stop(t+dur+.05);}
 _o(type,f0,f1,dur,vol,o={}){if(!this.ac||vol<.002)return;const ac=this.ac,t=ac.currentTime+(o.delay||0),os=ac.createOscillator();os.type=type;os.frequency.setValueAtTime(f0,t);os.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(o.atk||.004));g.gain.exponentialRampToValueAtTime(.0005,t+dur);os.connect(g);g.connect(this.chain(o.pan,o.lp,o.bus));if(o.rev)g.connect(this.verbIn);os.start(t);os.stop(t+dur+.05);}
 /* ---------- weapons ---------- */
 shot(wid,pos,sup){if(!this.ac)return;const G=GUN[wid]||GUN.ark;const[d,pan]=this.at(pos);const near=!pos;const att=near?1:Math.min(1,18/(d+6));const lp=near?16000:Math.max(500,9000/(1+d/35));const v=G.v*(sup?.28:1);
  if(sup){this._n(.09,2200,600,1.2,.5*att,'bandpass',{pan,lp});this._n(.05,5000,2000,.8,.25*att,'highpass',{pan});this._o('sine',160,60,.07,.25*att,{pan});return;}
  this._n(G.len,G.f*3,G.f*.4,.7,.9*v*att,'lowpass',{pan,lp,rev:true});this._o('sine',G.b*1.6,G.b*.4,.16,.9*v*att,{pan,lp});this._n(.03,7000,3000,.6,.5*v*att*(near?1:.6),'highpass',{pan});
  this._n(.5+Math.min(1,d/60),G.f*.8,200,.5,.22*v*Math.min(1,att*2.2),'lowpass',{pan,lp:lp*.6,delay:near?.02:Math.min(.4,d/340)*.2,rev:true,brown:true});}
 crack(pos){if(!this.ac)return;const[d,pan]=this.at(pos);this._n(.04,6000,2500,.7,.35*Math.min(1,10/(d+3)),'highpass',{pan});}
 dry(){this._o('square',1800,1500,.02,.15,{});this._n(.03,3000,1500,2,.2,'bandpass');}
 magOut(){this._n(.06,1800,900,3,.35,'bandpass');this._o('square',300,200,.03,.08,{delay:.02});}
 magIn(){this._n(.05,2600,1200,4,.45,'bandpass');this._o('square',500,300,.04,.12);}
 rack(){this._n(.05,3000,1500,3,.4,'bandpass');this._n(.06,2000,800,3,.4,'bandpass',{delay:.09});}
 pump(){this._n(.06,1500,700,2,.45,'bandpass');this._n(.07,2200,900,2,.45,'bandpass',{delay:.14});}
 shellIn(){this._n(.04,2400,1400,4,.35,'bandpass');this._o('triangle',900,700,.03,.1);}
 swap(){this._n(.08,1200,500,1.5,.25,'bandpass');this._n(.05,2600,1400,3,.2,'bandpass',{delay:.12});}
 /* ---------- impacts + damage ---------- */
 impact(surf,pos){if(!this.ac)return;const[d,pan]=this.at(pos);const a=Math.min(1,6/(d+2));if(a<.02)return;
  if(surf===1){this._o('triangle',2400+R()*1200,1500,.12,.18*a,{pan});this._n(.05,5000,2000,4,.2*a,'bandpass',{pan});}else if(surf===2)this._n(.07,900,400,2,.35*a,'bandpass',{pan});else if(surf===4)this._n(.15,1500,400,1,.3*a,'lowpass',{pan});else this._n(.06,2400,700,1.5,.3*a,'bandpass',{pan});
  if(R()<.18&&surf<2)this._o('sine',2600+R()*1800,900,.25,.07*a,{pan,delay:.02});}
 hitmark(kind){if(kind==='head'){this._o('triangle',2200,2100,.12,.22,{bus:this.ui});this._o('sine',3300,3200,.18,.12,{bus:this.ui});}else if(kind==='kill'){this._o('triangle',1200,1150,.08,.2,{bus:this.ui});this._o('triangle',1600,1550,.12,.2,{bus:this.ui,delay:.07});}else this._o('triangle',1600,1500,.04,.12,{bus:this.ui});}
 hurt(armor,head){this._o('sine',110,45,.25,.6);this._n(.12,900,200,1,.45,'lowpass');if(armor)this._o('triangle',1400,900,.15,.22);if(head){this._o('sine',3800,3700,1.6,.06,{atk:.05});}}
 thud(pos){const[d,pan]=this.at(pos);this._n(.14,500,120,1,.5*Math.min(1,8/(d+3)),'lowpass',{pan});}
 bodyHit(pos,armor){const[d,pan]=this.at(pos);const a=Math.min(1,10/(d+4));this._n(.06,armor?3200:900,armor?1800:300,armor?5:1,.35*a,armor?'bandpass':'lowpass',{pan});}
 /* ---------- movement + foley ---------- */
 step(surf,pos,vol=1){if(!this.ac)return;const[d,pan]=this.at(pos);const a=vol*Math.min(1,4/(d+1.5));if(a<.01)return;const lp=pos?Math.max(400,6000/(1+d/12)):12000;
  if(surf===1){this._n(.07,1800,700,3,.22*a,'bandpass',{pan,lp});this._o('triangle',300+R()*80,200,.05,.05*a,{pan});}else if(surf===2){this._n(.08,700,250,2,.3*a,'bandpass',{pan,lp});}else if(surf===3){this._n(.1,1400,300,.8,.22*a,'lowpass',{pan,lp});}else if(surf===4){this._n(.18,1600,500,1,.25*a,'bandpass',{pan,lp});}
  else{this._n(.06,1600,500,1.2,.24*a,'bandpass',{pan,lp});}}
 land(v){this._n(.12,700,150,1,.4*v,'lowpass');}
 door(open){this._o('sawtooth',open?220:180,open?160:260,.35,.05,{lp:900});this._n(.18,500,200,1,.18,'lowpass',{delay:open?.25:0});}
 locked(){for(let i=0;i<3;i++)this._n(.04,2400,1600,4,.25,'bandpass',{delay:i*.07});}
 unlock(){this._n(.04,3000,2000,5,.35,'bandpass');this._o('square',800,600,.03,.08,{delay:.06});}
 rummage(){this._n(.08+R()*.08,1200+R()*1500,400,1.2,.12+R()*.08,'bandpass');}
 zip(){this._n(.25,800,4000,2,.18,'bandpass');}
 pick(){this._n(.07,1800,700,1.4,.22,'bandpass');}
 heal(){this._n(.35,2400,1200,1,.14,'highpass');this._n(.1,600,300,1,.2,'lowpass',{delay:.3});}
 flare(){this._n(.08,800,200,1,.6,'lowpass');this._n(1.6,3000,900,.6,.25,'bandpass',{delay:.05,atk:.05});this._o('sine',300,1200,.6,.1,{delay:.05});}
 radio(pos){const[d,pan]=this.at(pos);const a=Math.min(1,8/(d+3));if(a<.03)return;this._n(.12,2800,2600,8,.2*a,'bandpass',{pan});this._o('square',1400,1400,.06,.04*a,{pan,delay:.12});this._n(.25,2400,2200,6,.1*a,'bandpass',{pan,delay:.2});}
 voice(pos,kind){const[d,pan]=this.at(pos);const a=Math.min(1,9/(d+3));if(a<.03)return;const f=kind==='patrol'?140:120;for(let i=0;i<3+R()*3;i++){this._o('sawtooth',f*(1+R()*.6),f*(.8+R()*.4),.09,.06*a,{pan,lp:1100,delay:i*.11});}}
 /* ---------- UI ---------- */
 click(){this._o('triangle',1400,1300,.03,.1,{bus:this.ui});}
 err(){this._o('square',220,200,.12,.08,{bus:this.ui});}
 buy(){this._o('triangle',1200,1200,.06,.12,{bus:this.ui});this._o('triangle',1800,1800,.1,.12,{bus:this.ui,delay:.07});this._n(.08,3000,1500,2,.1,'bandpass',{bus:this.ui,delay:.05});}
 quest(){[523,659,784,1046].forEach((f,i)=>this._o('triangle',f,f,.25,.12,{bus:this.ui,delay:i*.08}));}
 beep(hi){this._o('sine',hi?1320:880,hi?1320:880,.1,.15,{bus:this.ui});}
 extracted(){[392,523,659,784].forEach((f,i)=>this._o('triangle',f,f*1.002,.8,.12,{bus:this.ui,delay:i*.12}));}
 death(){this._o('sine',220,50,1.6,.4);this._n(1.2,600,80,1,.3,'lowpass',{atk:.02});this._o('sine',3600,3500,3,.05,{atk:.1});}
 heart(v){this._o('sine',60,45,.12,.5*v);this._o('sine',58,42,.12,.4*v,{delay:.18});}
 breath(v){this._n(.5,1200,700,.8,.06*v,'bandpass',{atk:.15});}
 horn(){this._o('sawtooth',98,97,2.2,.18,{lp:500,atk:.3,rev:true});this._o('sawtooth',146,145,2.2,.12,{lp:500,atk:.3});}
 /* ---------- battle royale extras ---------- */
 cash(){this._o('triangle',1760,1760,.06,.12,{bus:this.ui});this._o('triangle',2350,2350,.12,.12,{bus:this.ui,delay:.06});this._n(.06,6000,3000,2,.08,'highpass',{bus:this.ui});}
 plate(){this._n(.12,1600,500,2,.35,'bandpass');this._o('square',220,140,.08,.08,{delay:.1});this._n(.05,3000,1500,4,.3,'bandpass',{delay:.22});}
 plateBreak(){this._o('triangle',2600,900,.25,.22,{bus:this.ui});this._n(.2,5000,1200,2,.25,'bandpass',{bus:this.ui});}
 chute(){this._n(.5,600,2400,1,.4,'bandpass',{atk:.02});this._n(.25,300,120,1,.5,'lowpass',{delay:.3});}
 jump(){this._n(.4,1500,300,1,.3,'lowpass');}
 gulag(){[196,196,262].forEach((f,i)=>this._o('sawtooth',f,f,.5,.12,{bus:this.ui,delay:i*.35,lp:1400}));}
 win(){[392,523,659,784,1046].forEach((f,i)=>this._o('triangle',f,f*1.002,.9,.12,{bus:this.ui,delay:i*.12}));}
 alarm(){for(let i=0;i<3;i++)this._o('square',880,880,.12,.06,{bus:this.ui,delay:i*.22});}
 flyby(){this._n(1.6,400,2200,.6,.25,'bandpass',{atk:.6});}
 engine(rpm,v){if(!this.ac)return;if(!this.eng){const ac=this.ac,o=ac.createOscillator(),o2=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain();o.type='sawtooth';o2.type='square';f.type='lowpass';f.frequency.value=600;g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g);g.connect(this.sfx);o.start();o2.start();this.eng={o,o2,f,g};}
  const t=this.ac.currentTime;this.eng.o.frequency.setTargetAtTime(40+rpm*90,t,.08);this.eng.o2.frequency.setTargetAtTime(20+rpm*45,t,.08);this.eng.g.gain.setTargetAtTime(v,t,.1);}
 loops(o){if(!this.ac||!this.wind)return;const t=this.ac.currentTime;if(!this.lp){const mk=(type,f,q)=>{const s=this.ac.createBufferSource();s.buffer=this.brown;s.loop=true;const fl=this.ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=this.ac.createGain();g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(this.sfx);s.start();return{fl,g};};
   this.lp={plane:mk('lowpass',180,1),fall:mk('bandpass',900,.4),gas:mk('highpass',1800,.3)};}
  this.lp.plane.g.gain.setTargetAtTime(o.plane||0,t,.3);this.lp.fall.g.gain.setTargetAtTime(o.fall||0,t,.2);this.lp.fall.fl.frequency.setTargetAtTime(500+(o.fall||0)*2500,t,.2);this.lp.gas.g.gain.setTargetAtTime(o.gas||0,t,.4);}
 /* ---------- ambience ---------- */
 startAmb(){const ac=this.ac;const mk=(buf,type,f,q,g)=>{const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const fl=ac.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const gn=ac.createGain();gn.gain.value=g;s.connect(fl);fl.connect(gn);gn.connect(this.ambG);s.start();return{fl,gn};};
  this.wind=mk(this.brown,'bandpass',420,.5,.5);this.sea=mk(this.noise,'lowpass',500,.4,.0);this.rain=mk(this.noise,'highpass',2500,.3,0);this.ambT=0;this.gullT=8;this.hornT=40;this.farT=25;}
 ambient(dt,o){if(!this.ac||!this.wind)return;const t=this.ac.currentTime;this.ambG.gain.setTargetAtTime(o.on?1:0,t,.8);if(!o.on)return;this.ambT+=dt;
  this.wind.gn.gain.setTargetAtTime(.25+.2*Math.sin(this.ambT*.21)+.15*Math.sin(this.ambT*.53)+(o.high||0)*.3,t,.5);this.wind.fl.frequency.setTargetAtTime(350+150*Math.sin(this.ambT*.17),t,.5);
  const sea=Math.max(0,1-o.seaD/90);this.sea.gn.gain.setTargetAtTime(sea*(.25+.18*Math.max(0,Math.sin(this.ambT*.7))),t,.3);this.rain.gn.gain.setTargetAtTime(o.rain?(o.indoor?.05:.16):0,t,.5);
  if((this.gullT-=dt)<=0){this.gullT=10+R()*22;if(sea>.2){const pan=R()*2-1;for(let i=0;i<2+R()*3;i++){const f=1400+R()*600;this._o('sine',f,f*.6,.25,.04*sea,{pan,delay:i*.3,lp:4000,bus:this.ambG});}}}
  if((this.hornT-=dt)<=0){this.hornT=70+R()*60;this._o('sawtooth',82,81,3.4,.07,{atk:.6,lp:300,rev:true,bus:this.ambG});}
  if((this.farT-=dt)<=0){this.farT=20+R()*40;const n=1+R()*5|0;for(let i=0;i<n;i++)this._n(.6,600,120,.5,.05,'lowpass',{delay:i*(.1+R()*.15),pan:R()*2-1,bus:this.ambG,brown:true,rev:true});}}
}
