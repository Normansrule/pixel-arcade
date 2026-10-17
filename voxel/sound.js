// VOXEL FRONTIER — synthesized audio: material-aware digging, steps and placing; pickups, crafting, combat,
// creature voices, explosions; day birdsong / night crickets and a slow generative piano-and-pad score.
import {boot,master,gain,noiseBuf,reverb,bed,panTo,tone,hiss} from '../js/kit3d/audio.js';
const R=Math.random;
const MAT={grass:[900,.5,.09],dirt:[700,.5,.09],sand:[1400,.4,.08],stone:[2200,1.4,.07],wood:[600,2.2,.08],leaf:[3000,.4,.06],glass:[4200,3,.05],snow:[1800,.3,.09],water:[500,.6,.12],cloth:[1000,.3,.06]};
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.mus=.5;this.cam={x:0,y:0,z:0,yaw:0};this.nextNote=0;this.amb=0;this.nightAmt=0;}
 init(){boot(this,ac=>{this.master=master(ac,this.vol,-14,3);this.sfx=gain(ac,1,this.master);this.mbus=gain(ac,this.mus*.5,this.master);
  this.noise=noiseBuf(ac);this.verbIn=reverb(ac,2.4,3,.5,this.mbus);
  // ambient bed: wind noise
  this.wind=bed(ac,this.noise,'lowpass',420,null,this.sfx).g;
  this.timer=setInterval(()=>this.tick(),120);});}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 setMusic(v){this.mus=v;if(this.mbus)this.mbus.gain.setTargetAtTime(v*.5,this.ac.currentTime,.3);}
 listener(x,y,z,yaw){Object.assign(this.cam,{x,y,z,yaw});}
 at(p){if(!p)return[1,0];const c=this.cam,dx=p.x-c.x,dy=(p.y||0)-c.y,dz=p.z-c.z,d=Math.hypot(dx,dy,dz)||1;const rx=Math.cos(c.yaw),rz=-Math.sin(c.yaw);return[1/(1+Math.max(0,d-2)/7),(dx*rx+dz*rz)/d];}
 _bus(pan){return panTo(this.ac,pan,this.sfx);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0){if(!this.ac||vol<.003)return;hiss(this.ac,this.noise,this._bus(pan),this.ac.currentTime+delay,dur,f0,f1,q,vol,type);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0,atk=.004,bus){if(!this.ac||vol<.003)return;tone(this.ac,bus||this._bus(pan),this.ac.currentTime+delay,type,f0,f1,dur,vol,atk);}
 dig(mat){const m=MAT[mat]||MAT.stone;const v=.85+R()*.3;this._n(m[2],m[0]*v,m[0]*.6*v,m[1],.22,'bandpass');if(mat==='stone')this._o('square',180*v,120,.03,.03);}
 brk(mat){const m=MAT[mat]||MAT.stone;this._n(.22,m[0]*1.1,m[0]*.4,m[1]*.8,.4,'bandpass');this._n(.12,m[0]*.5,200,.7,.25,'lowpass',.02);if(mat==='glass'){for(let i=0;i<5;i++)this._o('triangle',2400+R()*2400,1800,.12,.06,i*.02);}if(mat==='wood')this._o('triangle',160,90,.12,.18);}
 place(mat){const m=MAT[mat]||MAT.stone;this._n(.07,m[0]*.8,m[0]*.5,m[1],.28,'bandpass');this._o('sine',140,80,.08,.18);}
 step(mat){const m=MAT[mat]||MAT.grass;this._n(.06,m[0]*(.8+R()*.4),m[0]*.5,m[1],.08,'bandpass');}
 pop(k=0){this._o('sine',620+k*70,1100+k*90,.08,.13);this._o('triangle',1240+k*140,1700,.05,.04,.03);}
 craft(){this._n(.08,1200,600,2,.2,'bandpass');this._o('triangle',520,780,.1,.1,.06);this._o('triangle',780,1040,.12,.08,.12);}
 eat(){for(let i=0;i<3;i++)this._n(.07,900,500,1.5,.18,'bandpass',i*.12);}
 swing(){this._n(.1,700,2400,1.2,.06,'bandpass');}
 hit(crit){this._n(.07,1400,500,1.2,.32,'bandpass');this._o('sine',190,70,.1,.3);if(crit){this._o('square',1400,2200,.08,.06,.02);this._n(.1,6000,3000,2,.12,'highpass',.01);}}
 hurt(){this._o('sawtooth',230,110,.18,.14);this._n(.12,900,300,1,.3);}
 kill(){this._o('triangle',300,90,.25,.18);this._n(.3,1600,200,1,.18,'bandpass',.04);}
 boom(p,big=1){const[a,pan]=this.at(p);this._n(1.6,1800,40,.6,.95*a*big,'lowpass',0,pan);this._o('sine',72,22,1.2,.8*a*big,0,pan);this._n(.3,5000,600,.6,.3*a,'lowpass',0,pan);}
 fuse(p){const[a,pan]=this.at(p);this._n(.5,4800,6000,2,.12*a,'highpass',0,pan);}
 splash(){this._n(.4,1600,300,.6,.3,'lowpass');}
 goal(){const N=[523,659,784,1047];N.forEach((f,i)=>this._o('triangle',f,f,.35,.12,i*.09,0,.01));}
 night(){[196,233,294].forEach((f,i)=>this._o('sine',f,f*.98,1.6,.1,i*.25,0,.2));}
 win(){[523,659,784,1047,1319].forEach((f,i)=>{this._o('triangle',f,f,.6,.14,i*.12,0,.01);this._o('sine',f/2,f/2,.8,.08,i*.12);});}
 mob(kind,p){const[a,pan]=this.at(p);if(a<.06)return;const v=.8+R()*.4;
  if(kind==='shambler'){this._o('sawtooth',95*v,70*v,.7,.08*a,0,pan,.15);this._n(.6,500,250,2,.05*a,'bandpass',0,pan);}
  else if(kind==='bonewalker'){for(let i=0;i<4;i++)this._n(.04,2800,1800,6,.09*a,'bandpass',i*.06,pan);}
  else if(kind==='crawler'){for(let i=0;i<5;i++)this._o('square',900*v,700,.03,.04*a,i*.045,pan);}
  else if(kind==='sheep'){this._o('sawtooth',300*v,280*v,.45,.06*a,0,pan,.05);this._o('sawtooth',306*v,290*v,.45,.04*a,0,pan,.05);}
  else if(kind==='pig'){this._o('sawtooth',160*v,110*v,.18,.08*a,0,pan);this._n(.15,600,300,3,.06*a,'bandpass',0,pan);}
  else if(kind==='hen'){this._o('square',900*v,1300*v,.06,.04*a,0,pan);this._o('square',1000*v,1200*v,.05,.03*a,.08,pan);}
  else if(kind==='hiss')this.fuse(p);else if(kind==='bow'){this._o('triangle',420,180,.14,.1*a,0,pan);this._n(.08,2400,900,2,.08*a,'bandpass',0,pan);}
  else if(kind==='thunk'){this._n(.05,1200,500,2,.1*a,'bandpass',0,pan);}}
 // ambience + music scheduler
 tick(){if(!this.ac)return;const t=this.ac.currentTime;this.wind.gain.setTargetAtTime(this.amb*(.025+.02*Math.sin(t*.3)),t,.8);
  if(this.amb>0&&R()<.08){if(this.nightAmt>.5){for(let i=0;i<3;i++)this._o('sine',4200+R()*300,4100,.04,.012*this.amb,i*.07);}else if(R()<.5){const f=2400+R()*1600;this._o('sine',f,f*1.25,.08,.016*this.amb);this._o('sine',f*1.2,f*.9,.1,.012*this.amb,.11);}}
  if(this.mus<=0||!this.playing)return;if(t<this.nextNote)return;
  const scale=this.nightAmt>.5?[220,261.6,293.7,329.6,392,440,523.3]:[261.6,293.7,329.6,392,440,523.3,587.3];const k=R()*scale.length|0;const f=scale[k];
  const pn=(f,d,v,del)=>{const ac=this.ac,o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain();o.type='triangle';o2.type='sine';o.frequency.value=f;o2.frequency.value=f*2.003;const s=ac.currentTime+del;g.gain.setValueAtTime(0,s);g.gain.linearRampToValueAtTime(v,s+.01);g.gain.exponentialRampToValueAtTime(.0005,s+d);o.connect(g);o2.connect(g);g.connect(this.mbus);g.connect(this.verbIn);o.start(s);o2.start(s);o.stop(s+d);o2.stop(s+d);};
  pn(f,2.6,.05,0);if(R()<.5)pn(scale[(k+2)%scale.length],2.4,.035,.45);if(R()<.3)pn(f/2,3.2,.04,.9);if(R()<.25){pn(scale[(k+4)%scale.length]/2,4,.03,0);}
  this.nextNote=t+1.4+R()*3.2+(R()<.12?8:0);}}
