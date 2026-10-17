// SILENT CONTRACT — synthesized audio (no files): sea swell and wind, party murmur, a string quartet waltz drifting from the ballroom,
// a tinny radio tune, suppressed and guard pistol shots, footsteps by surface, coins, body thuds, struggles, screams, glass and crash
// for the chandelier, splash, fuse pops, suspicion ticks, spotted/combat stingers and a low tension pulse.
import {boot,master,gain,noiseBuf,reverb,bed,tone,hiss,panTo} from '../js/kit3d/audio.js';
export class Sound{
 constructor(){this.ac=null;this.vol=.8;this.beat=0;this.nextT=0;this.qBeat=0;this.qNext=0;this.radios=[];this.lp={x:0,z:0,yaw:0};this.tension=0;}
 init(){boot(this,ac=>{this.master=master(ac,this.vol,-16,4);this.out=gain(ac,1,this.master);this.mus=gain(ac,.5,this.master);this.noise=noiseBuf(ac);this.verbIn=reverb(ac,1.8,3,.25,this.out);
  this.sea=bed(ac,this.noise,'lowpass',420,null,this.master);this.wind=bed(ac,this.noise,'bandpass',900,.5,this.master,0,.6);this.crowd=bed(ac,this.noise,'bandpass',700,2.2,this.master,0,1.1);
  this.quartet=gain(ac,0,this.master);this.radioG=gain(ac,0,this.master);const rf=ac.createBiquadFilter();rf.type='bandpass';rf.frequency.value=1600;rf.Q.value=.8;this.radioBus=gain(ac,1,rf);rf.connect(this.radioG);});}
 setVol(v){this.vol=v;if(this.master)this.master.gain.value=v;}
 listener(x,z,yaw){this.lp.x=x;this.lp.z=z;this.lp.yaw=yaw;}
 at(p,ref=8){if(!p)return[1,0];const dx=p.x-this.lp.x,dz=p.z-this.lp.z,d=Math.hypot(dx,dz);const a=1/(1+Math.max(0,d-2)/ref);const rx=Math.cos(this.lp.yaw),rz=-Math.sin(this.lp.yaw);const pan=d>.5?Math.max(-.8,Math.min(.8,-(dx*rx+dz*rz)/d)):0;return[a,pan,d];}
 _pan(p){return panTo(this.ac,p,this.out);}
 _n(dur,f0,f1,q,vol,type='lowpass',delay=0,pan=0,rev=false,dest,atk=0){if(vol<.0015)return;const g=hiss(this.ac,this.noise,dest||this._pan(pan),this.ac.currentTime+delay,dur,f0,f1,q,vol,type,atk);if(rev)g.connect(this.verbIn);}
 _o(type,f0,f1,dur,vol,delay=0,pan=0,rev=false,dest,at=.005){if(vol<.0015)return;const g=tone(this.ac,dest||this._pan(pan),this.ac.currentTime+delay,type,f0,f1,dur,vol,at);if(rev)g.connect(this.verbIn);}
 play(kind,p,o={}){if(!this.ac)return;const[a,pan]=this.at(p,o.ref||8);const v=a*(o.v??1);
  switch(kind){
   case 'silenced':this._n(.06,2400,500,1.2,.28*v,'lowpass',0,pan);this._n(.03,5000,3000,2,.12*v,'bandpass',0,pan);this._o('sine',160,70,.06,.12*v,0,pan);this._n(.04,1800,900,3,.08*v,'bandpass',.04,pan);break;
   case 'pistol':this._n(.18,1600,200,.8,.55*v,'lowpass',0,pan,true);this._n(.03,2800,1800,1.4,.3*v,'bandpass',0,pan);this._o('sine',190,60,.12,.35*v,0,pan);break;
   case 'step':{const f=o.surf==='wood'?700:o.surf==='grass'?420:o.surf==='gravel'?2400:1100;this._n(o.surf==='gravel'?.09:.06,f,f*.5,1.1,.05*v,'bandpass',0,pan);if(o.surf!=='grass')this._o('sine',85,60,.04,.025*v,0,pan);break;}
   case 'coin':for(let i=0;i<3;i++)this._o('triangle',3200+i*600,3000+i*500,.12,.05*v*(1-i*.25),i*.09+Math.random()*.03,pan);break;
   case 'throw':this._n(.15,900,400,.8,.05,'bandpass');break;
   case 'thud':this._n(.22,400,80,.8,.3*v,'lowpass',0,pan);this._o('sine',90,45,.18,.18*v,0,pan);break;
   case 'struggle':for(let i=0;i<5;i++)this._n(.09,700+Math.random()*500,300,1.2,.1*v,'bandpass',i*.16,pan);this._o('sawtooth',140,110,.4,.03*v,.1,pan,false,null,.05);break;
   case 'wire':this._n(.5,5000,3000,6,.05*v,'bandpass',0,pan);this._o('sine',2600,2200,.4,.02*v,0,pan);break;
   case 'scream':{const f=480+Math.random()*220;this._o('sawtooth',f,f*1.35,.6,.06*v,0,pan,true,null,.05);this._o('sine',f*2,f*2.5,.6,.05*v,0,pan);break;}
   case 'shout':{const f=140+Math.random()*40;for(const[h,vv]of[[1,.16],[2,.08],[3,.05]])this._o('sawtooth',f*h*1.1,f*h*.85,.35,vv*.45*v,0,pan,true,null,.02);break;}
   case 'crash':this._n(2.2,2400,60,.5,.9*v,'lowpass',0,pan,true);this._o('sine',60,24,1.4,.6*v,0,pan);for(let i=0;i<22;i++)this._o('triangle',2500+Math.random()*5000,1500+Math.random()*2000,.15+Math.random()*.4,.05*v,.03+i*.035+Math.random()*.08,pan,true);this._n(.6,9000,3000,.7,.3*v,'highpass',0,pan,true);break;
   case 'splash':this._n(1.1,2600,200,.6,.5*v,'lowpass',0,pan,true);this._n(.4,6000,1500,.6,.2*v,'highpass',.05,pan);break;
   case 'creak':this._o('sawtooth',90,60,.8,.06*v,0,pan,true,null,.2);this._n(.5,900,300,4,.08*v,'bandpass',.2,pan);this._o('square',120,40,.3,.08*v,.7,pan);break;
   case 'zap':this._n(.25,6000,800,1,.25*v,'bandpass',0,pan);for(let i=0;i<4;i++)this._o('square',120,100,.04,.06*v,i*.05,pan);this._o('sine',50,40,.4,.1*v,.2,pan);break;
   case 'pour':this._n(.9,1200,2200,4,.06*v,'bandpass',0,pan,false,null,.1);break;
   case 'gulp':this._o('sine',200,120,.12,.06*v,0,pan);this._o('sine',190,110,.12,.06*v,.3,pan);break;
   case 'pick':this._o('triangle',1200,1800,.08,.07);this._o('triangle',1800,2400,.1,.05,.06);break;
   case 'cloth':this._n(.5,1400,600,.9,.12,'bandpass');this._n(.4,2200,900,.9,.08,'bandpass',.45);break;
   case 'radioOn':this._n(.15,3000,2000,1,.06*v,'bandpass',0,pan);break;
   case 'reload':this._n(.05,2200,1400,3,.1,'bandpass');this._o('square',500,300,.025,.04,.25);this._n(.04,3000,2000,4,.08,'bandpass',.3);break;
   case 'dry':this._o('square',1800,1600,.02,.04);break;
   case 'hit':this._n(.05,600,200,1,.18*v,'lowpass',0,pan);break;
   case 'hurt':this._n(.16,500,100,.7,.3,'lowpass');this._o('sine',120,60,.14,.12);break;
   case 'ricochet':this._o('triangle',3000,1200,.15,.04*v,0,pan);break;
   case 'sus':this._o('sine',700+(o.k||0)*700,700+(o.k||0)*700,.05,.03);break;
   case 'spotted':[0,.1].forEach(d=>this._o('square',1300,1300,.08,.05,d));this._o('sawtooth',220,180,.5,.05,.05,0,true);break;
   case 'combat':[0,.25,.5].forEach(d=>{this._o('sawtooth',196,196,.3,.06,d);this._o('sawtooth',277,277,.3,.04,d);});break;
   case 'body':this._o('triangle',330,320,.6,.07,0,0,true);this._o('triangle',311,300,.8,.06,.2,0,true);break;
   case 'opp':[0,.12,.24].forEach((d,i)=>this._o('triangle',523*(1+i*.25),523*(1+i*.25),.4,.06,d,0,true));break;
   case 'target':[392,494,587,784].forEach((f,i)=>{this._o('triangle',f,f,.6,.07,i*.13,0,true);this._o('sine',f/2,f/2,.7,.05,i*.13);});break;
   case 'fail':[440,392,330,262].forEach((f,i)=>this._o('triangle',f,f,.5,.07,i*.16,0,true));break;
   case 'win':[523,659,784,1046,1318].forEach((f,i)=>{this._o('triangle',f,f,.6,.07,i*.12,0,true);this._o('sine',f/2,f/2,.6,.05,i*.12);});break;
   case 'click':this._o('square',1800,1600,.03,.035);break;}}
 // continuous layers: sea by distance to the cliff, crowd near guests, quartet near the ballroom, radios, tension pulse
 tick(dt,G){if(!this.ac)return;const t=this.ac.currentTime,P=G.player.pos;const k=.6;
  const seaV=.05+.08*Math.max(0,Math.min(1,(P.z+10)/40))+Math.sin(t*.35)*.025;this.sea.g.gain.setTargetAtTime(seaV,t,k);this.sea.f.frequency.setTargetAtTime(380+Math.sin(t*.35)*160,t,k);
  const ins=G.L.indoor(P.x,P.z);this.wind.g.gain.setTargetAtTime(ins?.004:.018,t,k);this.crowd.g.gain.setTargetAtTime(Math.min(.06,G.crowdNear*.006)*(G.panic?.3:1),t,k);this.crowd.f.frequency.setTargetAtTime(600+Math.sin(t*3.3)*120,t,.2);
  const qd=Math.hypot(P.x+11.5,P.z+19),qv=G.quartetOn?Math.max(0,1-qd/45)*(ins&&G.L.roomAt(P.x,P.z)===G.L.roomAt(-10,-15)?1:.45):0;this.quartet.gain.setTargetAtTime(qv*.55,t,.5);
  let rv=0;for(const u of G.L.uses)if(u.id==='radio'&&u.on){const d=Math.hypot(P.x-u.x,P.z-u.z);rv=Math.max(rv,1/(1+d/4));}this.radioG.gain.setTargetAtTime(rv*.35,t,.2);
  this.tension+=((G.combatNow?1:G.searching?.5:0)-this.tension)*Math.min(1,dt*.8);
  // quartet waltz: 3/4, i–iv–V–i style progression in D minor/F major, bowed pads + pizzicato bass
  if(this.qNext<t)this.qNext=t+.05;const qb=60/96;
  while(this.qNext<t+.15){const b=this.qBeat++,bar=(b/3|0)%8,beat=b%3,at=this.qNext-t;const prog=[[146.8,174.6,220],[116.5,146.8,174.6],[130.8,164.8,196],[110,138.6,164.8],[146.8,174.6,220],[98,123.5,146.8],[110,138.6,164.8],[146.8,174.6,220]][bar];
   if(beat===0){this._o('triangle',prog[0]/2,prog[0]/2,.5,.12,at,0,false,this.quartet,.01);for(const f of prog.slice(1))this._o('sawtooth',f,f,qb*2.6,.012,at,0,false,this.quartet,.25);}
   else{for(const f of prog.slice(1))this._o('triangle',f*2,f*2,.22,.03,at,0,false,this.quartet,.01);}
   const mel=[587,523,440,523,466,440,392,440,523,494,440,415,440,349,330,294][(b>>1)%16];if(b%2===0)this._o('sawtooth',mel,mel*1.003,qb*1.8,.02,at,0,true,this.quartet,.15);
   this.qNext+=qb;}
  // radio jingle (bright, tinny) + tension pulse
  if(this.nextT<t)this.nextT=t+.05;while(this.nextT<t+.12){const b=this.beat++,at=this.nextT-t;
   if(rv>.01){const n=[659,784,880,784,659,587,523,587][(b>>1)%8];if(b%2===0)this._o('square',n,n,.12,.05,at,0,false,this.radioBus);if(b%4===0)this._o('square',n/4,n/4,.15,.06,at,0,false,this.radioBus);if(b%4===2)this._n(.04,6000,4000,2,.05,'highpass',at,0,false,this.radioBus);}
   if(this.tension>.05){if(b%4===0)this._o('sine',55,48,.4,.18*this.tension,at,0,false,this.mus);if(b%8===4)this._o('sawtooth',110,108,.25,.03*this.tension,at,0,false,this.mus,.05);if(b%2===1)this._n(.03,8000,6000,4,.012*this.tension,'highpass',at,0,false,this.mus);}
   this.nextT+=60/116/2;}}}
