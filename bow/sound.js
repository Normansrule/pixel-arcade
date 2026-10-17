// LONGBOW KEEP — WebAudio synthesis (no audio files): bow creak + twang, arrow thunks, steel, bombs, horns, fanfares, wind.
import {boot,master,gain,noiseBuf,bed,tone,hiss} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.lx=0;this.ly=0;this.lz=0;this.lyaw=0;}
 init(){boot(this,ac=>{this.out=master(ac,this.vol,-14,12);const b=this.noise=noiseBuf(ac);
  // wind bed
  const w=bed(ac,b,'bandpass',420,.5,this.out,.025);this.wind=w.g;this.windF=w.f;
  // bow-draw creak voice
  const dr=bed(ac,b,'bandpass',300,6,this.out,0);this.drawG=dr.g;this.drawF=dr.f;
  const dO=ac.createOscillator();dO.type='sawtooth';dO.frequency.value=38;const dlp=ac.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=260;dO.connect(dlp);dlp.connect(this.creak=gain(ac,0,this.out));dO.start();this.creakO=dO;});}
 setVol(v){this.vol=v;if(this.out)this.out.gain.value=v;}
 listener(x,y,z,yaw){this.lx=x;this.ly=y;this.lz=z;this.lyaw=yaw;}
 setDraw(d,on){if(!this.ac)return;const t=this.ac.currentTime;this.drawG.gain.setTargetAtTime(on?.05+d*.05:0,t,.04);this.drawF.frequency.setTargetAtTime(240+d*520,t,.05);this.creak.gain.setTargetAtTime(on&&d<.98?.035:0,t,.05);this.creakO.frequency.setTargetAtTime(30+d*26+Math.random()*6,t,.03);}
 ambience(w){if(this.wind)this.wind.gain.setTargetAtTime(.02+w*.04,this.ac.currentTime,.5);}
 // spatial helper: returns [gain, pan] or null when inaudible
 sp(p,range=60){if(!p)return[1,0];const dx=p.x-this.lx,dy=p.y-this.ly,dz=p.z-this.lz,d=Math.hypot(dx,dy,dz);if(d>range*3)return null;const g=1/(1+d*d/(range*range)*4);
  const rx=Math.cos(this.lyaw),rz=-Math.sin(this.lyaw);const pan=d>.5?Math.max(-1,Math.min(1,(dx*rx+dz*rz)/d)):0;return[g,pan*.8];}
 _bus(g,pan){const ac=this.ac;const G=ac.createGain();G.gain.value=g;if(ac.createStereoPanner){const P=ac.createStereoPanner();P.pan.value=pan;G.connect(P);P.connect(this.out);}else G.connect(this.out);return G;}
 _n(out,dur,f0,f1,q,vol,type='lowpass',delay=0){hiss(this.ac,this.noise,out,this.ac.currentTime+delay,dur,f0,f1,q,vol,type,0,20);}
 _o(out,type,f0,f1,dur,vol,delay=0,att=.004){tone(this.ac,out,this.ac.currentTime+delay,type,f0,f1,dur,vol,att);}
 play(k,pos,a=1){if(!this.ac)return;try{const s=this.sp(pos,k==='boom'?120:k==='horn'||k==='fanfare'||k==='return'||k==='lost'?1e9:45);if(!s)return;const o=this._bus(s[0],s[1]);
  switch(k){
   case'twang':this._o(o,'triangle',a>1?190:150,a>1?110:80,.22,.32);this._o(o,'sine',a>1?95:72,40,.16,.4);this._n(o,.12,2400,500,1.2,.22,'bandpass');this._n(o,.25,1200,3500,.7,.08,'bandpass',.02);break;
   case'xbow':this._n(o,.06,5000,1500,1,.4,'highpass');this._o(o,'square',320,90,.08,.12);this._o(o,'sine',120,45,.18,.4);this._n(o,.3,900,3000,.6,.08,'bandpass',.03);break;
   case'whoosh':this._n(o,.28,600,2600,1.4,.16*a,'bandpass');break;
   case'thunkW':this._o(o,'sine',190,70,.12,.45);this._n(o,.09,1800,300,1,.3);this._o(o,'triangle',520,300,.05,.08);break;
   case'thunkS':this._n(o,.07,5200,1500,1.4,.3,'bandpass');this._o(o,'sine',140,60,.08,.2);this._o(o,'sine',2400,2100,.06,.05);break;
   case'thunkG':this._n(o,.12,900,120,.8,.35);this._o(o,'sine',100,40,.12,.25);break;
   case'splash':this._n(o,.35,2500,500,.6,.25,'bandpass');this._n(o,.6,900,200,.5,.12,'lowpass',.05);break;
   case'flesh':this._o(o,'sine',110,45,.18,.55);this._n(o,.14,1200,200,.9,.4);break;
   case'head':this._o(o,'sine',1760,1740,.5,.18);this._o(o,'sine',2640,2600,.35,.12);this._o(o,'sine',110,45,.18,.5);break;
   case'hitmark':this._o(o,'square',1400,1300,.05,.05);this._o(o,'sine',900,880,.07,.08);break;
   case'kill':this._o(o,'sine',660,660,.12,.1);this._o(o,'sine',990,990,.22,.1,.08);break;
   case'swing':this._n(o,.22,500,2400,1.6,.22,'bandpass');break;
   case'clang':[1180,1630,2390,3120].forEach((f,i)=>this._o(o,'sine',f,f*.98,.5-i*.08,.12-i*.02));this._n(o,.08,6000,2000,1,.25,'highpass');break;
   case'shield':this._o(o,'sine',160,70,.18,.5);this._n(o,.12,1500,250,1,.35);this._o(o,'square',420,300,.04,.06);break;
   case'cut':this._o(o,'sine',140,50,.2,.5);this._n(o,.16,2600,500,1,.35,'bandpass');break;
   case'throw':this._n(o,.3,300,1400,1.2,.16,'bandpass');break;
   case'pot':this._n(o,.15,3800,900,1.4,.32,'bandpass');this._o(o,'triangle',900,500,.06,.08);break;
   case'boom':this._n(o,1.3,1800,40,.7,.7);this._o(o,'sine',90,24,1,.75);this._n(o,.5,5000,800,.6,.2,'bandpass');this._n(o,1.8,400,60,.4,.18,'lowpass',.15);break;
   case'fuse':this._n(o,.25,5000,3000,2,.06,'highpass');break;
   case'step':this._n(o,.06,a>1?600:900,200,.8,.05*Math.max(.3,a));break;
   case'jump':this._n(o,.12,500,1400,1.2,.06,'bandpass');break;
   case'land':this._o(o,'sine',90,40,.12,Math.min(.3,.06*a));this._n(o,.1,800,150,.8,Math.min(.2,.04*a));break;
   case'hammer':for(let i=0;i<3;i++){this._o(o,'triangle',480,260,.07,.18,i*.11);this._n(o,.05,2200,600,1.4,.16,'bandpass',i*.11);}break;
   case'crank':for(let i=0;i<6;i++)this._n(o,.03,4000,2500,3,.09,'bandpass',i*.12);this._o(o,'square',200,180,.05,.03,.7);break;
   case'click':this._o(o,'square',1200,900,.03,.05);break;
   case'pickup':this._o(o,'triangle',700,1100,.09,.08);break;
   case'supply':[523,659,784].forEach((f,i)=>this._o(o,'triangle',f,f,.18,.07,i*.06));break;
   case'build':this._o(o,'triangle',420,240,.08,.2);this._n(o,.08,1800,500,1.2,.2,'bandpass');this._o(o,'triangle',360,220,.08,.16,.12);break;
   case'break':this._n(o,.5,2600,200,.7,.4);for(let i=0;i<4;i++)this._o(o,'triangle',300-i*40,120,.1,.12,i*.05);break;
   case'beep':this._o(o,'square',a?880:520,a?880:520,a?.5:.16,.07);break;
   case'horn':[147,185,220].forEach((f,i)=>{this._o(o,'sawtooth',f,f*1.005,1.1,.05,0,.08);this._o(o,'sawtooth',f*2,f*2.01,.9,.015,.05,.08);});break;
   case'lost':[196,185,147].forEach((f,i)=>this._o(o,'sawtooth',f,f*.97,.5,.06,i*.22,.04));break;
   case'return':[523,784,1047].forEach((f,i)=>this._o(o,'sine',f,f,.5,.09,i*.09));break;
   case'fanfare':[[262,0],[330,.14],[392,.28],[523,.42],[392,.62],[523,.76]].forEach(([f,t],i)=>{this._o(o,'sawtooth',f,f,i===5?1.2:.3,.06,t,.02);this._o(o,'square',f/2,f/2,i===5?1.1:.25,.025,t,.02);});this._n(o,1.6,3000,200,.5,.12,'lowpass',.76);break;
   case'death':this._o(o,'sine',220,70,.6,.18);this._n(o,.4,700,150,.7,.15);break;
   case'spawn':[392,523,659].forEach((f,i)=>this._o(o,'sine',f,f,.3,.06,i*.07));break;
   case'win':[[392,0],[523,.2],[659,.4],[784,.6],[1047,.85]].forEach(([f,t])=>{this._o(o,'sawtooth',f,f,.6,.05,t,.03);this._o(o,'sine',f,f,.8,.08,t);});break;
  }}catch(e){}}}
