// SWELL GUARD — surfer physics (player and CPU share it). States:
//  foot   on the sand / in the shallows, board under the arm
//  paddle prone on the board: stroke, turn, duck-dive under whitewater, sit up, catch a wave as its face lifts you
//  ride   standing: a skate-on-a-ramp model in the wave's moving frame (the face is static there, so gravity down the face,
//         fin grip and rail drag give carving, bottom turns and speed), with barrel, floater, whitewater and lip checks
//  air    ballistic off the lip: spin, flip and grab, land with the board pointing along your line or wipe out
//  wipe   held under; mash to surface, combo lost
// The combo: every move adds points and +1 multiplier; repeats score less; it banks when you kick out or finish the wave.
import {C,TLIP,sandY} from './ocean.js';
import {groundY} from './world.js';
const cl=(v,a,b)=>v<a?a:v>b?b:v,wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
export const G=9.8;
export class Combo{
 constructor(){this.list=[];this.base=0;this.active=false;this.counts={};}
 add(name,pts){const n=(this.counts[name]||0);this.counts[name]=n+1;const p=Math.round(pts*Math.pow(.6,n)/10)*10;this.list.push({name,pts:p});this.base+=p;this.active=true;return p;}
 trickle(p){if(this.active)this.base+=p;}
 get mult(){return Math.max(1,Math.min(12,this.list.length));}
 get total(){return Math.round(this.base*this.mult);}
 bank(){const t=this.total,names=this.list.map(e=>e.name);this.reset();return{t,names};}
 fail(){const t=this.total;this.reset();return t;}
 reset(){this.list.length=0;this.base=0;this.active=false;this.counts={};}}

export class Surfer{
 constructor(sim,o={}){this.sim=sim;this.name=o.name||'YOU';this.isAI=!!o.isAI;this.ev=o.ev||(()=>{});this.skill=o.skill??1;this.combo=new Combo();this.ctl=freshCtl();this.current=o.current||null;
  this.reset(0,-4,Math.PI*0,'foot');}
 reset(x,z,yaw,state='paddle'){this.x=x;this.z=z;this.y=state==='foot'?groundY(x,z):this.sim.height(x,z);this.yaw=yaw;this.vx=0;this.vz=0;this.vy=0;this.state=state;this.w=null;this.t=0;
  this.turnAcc=0;this.turnT=0;this.turnStart=null;this.calm=0;this.spin=0;this.flip=0;this.grab=null;this.grabT=0;this.lastGrab=-9;this.airT=0;this.roll=0;this.pitch=0;this.lean=0;this.crouch=0;
  this.duck=0;this.duckCd=0;this.catchT=0;this.canPop=false;this.wipeT=0;this.wipeDur=0;this.barrelT=0;this.floatT=0;this.wwT=0;this.stroke=0;this.waveScore=0;this.rideT=0;this.yawRate=0;this.stung=0;this.tow=null;this.sit=false;
  this.combo.reset();this.speedRef=0;this.inBarrel=false;this.dir=1;this.maxAirH=0;this.landed=null;this.knock=0;}
 get speed(){return Math.hypot(this.vx,this.vz);}
 get worldVz(){return this.state==='ride'||this.state==='air'?this.vz-C:this.vz;}
 // heading unit vector
 hx(){return Math.sin(this.yaw);}hz(){return Math.cos(this.yaw);}
 step(dt){this.t+=dt;this.duckCd=Math.max(0,this.duckCd-dt);this.stung=Math.max(0,this.stung-dt);this.knock=Math.max(0,this.knock-dt);
  switch(this.state){case'foot':this.stepFoot(dt);break;case'paddle':this.stepPaddle(dt);break;case'ride':this.stepRide(dt);break;case'air':this.stepAir(dt);break;case'wipe':this.stepWipe(dt);break;}}
 // ---------- foot ----------
 stepFoot(dt){const c=this.ctl,m=Math.hypot(c.mx,c.mz);const depth=this.sim.height(this.x,this.z)-groundY(this.x,this.z);const sp=(depth>.15?3.2:5.6)*(this.tow?.75:1)*Math.min(1,m);
  if(m>.1){const ty=Math.atan2(c.mx,c.mz);this.yaw+=wrap(ty-this.yaw)*Math.min(1,dt*10);}
  const tvx=m>.1?Math.sin(this.yaw)*sp:0,tvz=m>.1?Math.cos(this.yaw)*sp:0;this.vx+=(tvx-this.vx)*Math.min(1,dt*8);this.vz+=(tvz-this.vz)*Math.min(1,dt*8);
  this.x+=this.vx*dt;this.z+=this.vz*dt;this.x=cl(this.x,-230,230);this.z=Math.max(this.z,-46);this.y=Math.max(groundY(this.x,this.z),this.sim.height(this.x,this.z)-.9);
  if(depth>.55&&this.z>0){this.state='paddle';this.vx*=.4;this.vz*=.4;this.ev('enterWater',this);}}
 // ---------- paddle ----------
 stepPaddle(dt){const c=this.ctl,s=this.sim.sample(this.x,this.z,this._s||(this._s={}));const tow=this.tow?.68:1,slow=this.stung>0?.55:1;
  this.yaw+=c.x*-1.9*dt*(this.sit?1.3:1);this.sit=c.y<-.3&&!c.paddle;
  if(c.duck&&this.duckCd<=0&&!this.sit){this.duck=.85;this.duckCd=1.3;this.ev('duck',this);}
  this.duck=Math.max(0,this.duck-dt);
  const paddling=(c.paddle||c.y>.3)&&this.duck<=0&&!this.sit;
  if(paddling){this.stroke+=dt;const th=3.4*tow*slow;this.vx+=this.hx()*th*dt;this.vz+=this.hz()*th*dt;}else this.stroke=0;
  const maxs=3.5*tow*slow,sp=this.speed;if(sp>maxs){this.vx*=maxs/sp;this.vz*=maxs/sp;}
  const dr=Math.exp(-(this.sit?1.6:.7)*dt);this.vx*=dr;this.vz*=dr;
  // swell lifts and nudges you (gravity on the slope), currents carry you
  const [gx,gz]=this.sim.grad(this.x,this.z,.3);this.vx-=gx*2.2*dt;this.vz-=gz*2.2*dt;
  if(this.current){const[cx,cz]=this.current(this.x,this.z);this.x+=cx*dt;this.z+=cz*dt;}
  // whitewater: duck under it or get shoved toward the beach
  const ww=s.w&&s.br>.55&&s.u>-s.wf*1.25&&s.u<.6&&s.a>.5;
  if(ww&&this.duck<=0){this.vz=Math.min(this.vz,-C*(.55+s.a*.12));if(!this.wwHit){this.wwHit=true;this.ev('whitewater',this,s);}}else if(!ww)this.wwHit=false;
  // catching: on the face, pointed at the beach, paddling — the wave picks you up
  const face=s.w&&s.u<-.15&&s.u>-s.wf*1.15&&s.a>.7&&s.br<.5;const toShore=-this.hz();
  if(face&&toShore>.45&&(paddling||this.catchT>0)&&!this.sit){this.catchT+=dt*(paddling?1:.5);this.vz-=C*.5*dt;}else this.catchT=Math.max(0,this.catchT-dt*2);
  this.canPop=this.catchT>.35&&!this.tow;
  if(this.canPop&&(c.pop||this.catchT>(c.autoPop?.5:1.6))){if(c.pop||c.autoPop)this.popUp(s);else this.catchT=0;}
  else if(this.tow&&this.catchT>.6){// towing a swimmer: ride the face in prone instead of standing up
   this.vz=Math.min(this.vz,-C*.95);}
  this.x+=this.vx*dt;this.z+=this.vz*dt;this.x=cl(this.x,-240,240);this.z=Math.min(this.z,260);
  const h=this.sim.height(this.x,this.z);this.y=h-(this.duck>0?.55*Math.sin(Math.min(1,this.duck/.85)*Math.PI):0);
  const gy=groundY(this.x,this.z);if(h-gy<.35&&this.z<6){this.state='foot';this.y=gy;this.vx=this.vz=0;this.ev('beach',this);}
  this.roll+=((-c.x*.25)-this.roll)*Math.min(1,dt*4);this.pitch=Math.atan(gz)*.8;}
 popUp(s){this.state='ride';this.w=s.w;this.rideT=0;this.waveScore=0;this.catchT=0;this.canPop=false;this.turnAcc=0;this.calm=0;this.barrelT=0;this.floatT=0;this.wwT=0;
  // wave-frame velocity: aim down the line toward the open face
  const d=this.chooseDir(s.w);this.dir=d;this.yaw=Math.atan2(d*.85,-.55);const sp=7;this.vx=Math.sin(this.yaw)*sp;this.vz=Math.cos(this.yaw)*sp+C*0;
  this.vz=Math.cos(this.yaw)*sp;s.w.riders++;this.ev('pop',this,s.w);}
 chooseDir(w){if(w.tb>0){// ride away from the curl
   const dl=this.x-w.x0;return dl===0?(w.mode||1):Math.sign(dl);}return w.mode||(this.x>=w.x0?1:-1);}
 // ---------- ride ----------
 stepRide(dt){const c=this.ctl;if(!this.w||!this.sim.waves.includes(this.w)){this.finishRide('faded');return;}const s=this.sim.sampleWave(this.w,this.x,this.z,this._s||(this._s={}));
  if(s.a<.42){this.finishRide('faded');return;}
  if(s.u>s.wb*.55){this.finishRide('kick');return;}
  const [gx,gz,h]=this.sim.grad(this.x,this.z,.15);const k=1/(1+gx*gx+gz*gz);
  // gravity down the face (wave frame: the surface is static, water at the face moves with it)
  this.vx+=-G*gx*k*dt;this.vz+=-G*gz*k*dt;
  // steering toward the wanted direction (screen-relative stick, or AI target)
  this.crouch+=((c.crouch?1:0)-this.crouch)*Math.min(1,dt*6);
  let want=null;if(c.has){want=Math.atan2(c.dx,c.dz);}
  const prevYaw=this.yaw;const rate=(3.1+this.crouch*.8+(this.speed<6?.6:0))*dt;
  if(want!==null){const d=wrap(want-this.yaw);this.yaw+=cl(d,-rate,rate);}
  // fins: kill sideways slip (relative to the local water, which the face carries along), rail and skin drag
  const carry=cl(s.hw/Math.max(s.a,.01),0,1)*.92,wz=C*(1-carry);this.vz-=wz;
  const hx=this.hx(),hz=this.hz();let fwd=this.vx*hx+this.vz*hz,lat=this.vx*hz-this.vz*hx;
  const grip=Math.exp(-(7+this.crouch*2)*dt);const lost=lat*(1-grip);lat*=grip;fwd+=Math.abs(lost)*.45;
  fwd-=(.15+.02*Math.abs(fwd)+(c.stall?.55:0))*fwd*dt*(1-this.crouch*.3);
  // the wave's push keeps you planing on an open face
  const onFace=s.u<0&&s.u>-s.wf*1.4&&s.br<.6;if(onFace&&fwd<5.5)fwd+=(5.5-fwd)*dt*1.6;
  if(fwd<.5)fwd=.5;this.vx=hx*fwd+hz*lat;this.vz=hz*fwd-hx*lat+wz;
  this.yawRate=wrap(this.yaw-prevYaw)/dt;
  const sp=this.speed;
  this.x+=this.vx*dt;this.z+=(this.vz-C)*dt;const nh=this.sim.height(this.x,this.z);
  const vyS=(nh-h)/dt+0;this.y=nh;this.rideT+=dt;
  // stance visuals
  this.lean+=((cl(this.yawRate*sp*.045,-1,1))-this.lean)*Math.min(1,dt*8);this.roll=-this.lean*.6;this.pitch=Math.atan2(gx*hx+gz*hz,1)*-1;
  this.detect(dt,s,sp);
  // launch off the lip: fast up the face near the top, or Space while climbing
  const climbing=vyS>2.2+C*0;const nearTop=s.u>-s.wf*.42;
  if((climbing&&nearTop&&(c.jump||vyS>6.5&&sp>8))||(c.jump&&climbing&&sp>6)){this.launch(vyS,s);return;}
  // hazards
  const q=cl(s.ab/TLIP,0,1);
  if(s.ab>TLIP-.12&&s.ab<TLIP+.6&&s.u<-.25&&s.u>-s.a*1.55){this.wipe('lip');return;}
  if(s.br>.7&&s.u>-s.wf*1.3){this.wwT+=dt;if(this.wwT>(1.1+this.skill*.2)){this.wipe('whitewater');return;}const f=Math.exp(-2.2*dt);this.vx*=f;this.vz*=f;}else this.wwT=Math.max(0,this.wwT-dt);
  // barrel: under the throwing lip
  const inB=s.ab>.12*TLIP&&s.ab<TLIP-.05&&s.u<-.3&&s.u>-s.a*1.25*Math.pow(q,.6);
  if(inB){this.barrelT+=dt;if(!this.inBarrel){this.inBarrel=true;this.ev('barrelIn',this);}this.combo.trickle(dt*(260+this.crouch*220));}
  else if(this.inBarrel){this.inBarrel=false;if(this.barrelT>.5){const p=this.combo.add(this.barrelT>2?'DEEP BARREL':'BARREL',this.barrelT*900+(this.crouch>.5?300:0));this.ev('trick',this,{name:this.barrelT>2?'DEEP BARREL':'BARREL',pts:p,big:true});this.ev('barrelOut',this,this.barrelT);}this.barrelT=0;}
  // floater over a breaking section
  if(s.u>-s.wf*.2&&s.ab>.25&&s.ab<TLIP+1.5){this.floatT+=dt;if(this.floatT>.55&&!this.floated){this.floated=true;const p=this.combo.add('FLOATER',500);this.ev('trick',this,{name:'FLOATER',pts:p});}}else{this.floatT=0;this.floated=false;}
  // in the pocket: trickle points
  const px=this.sim.peelX(this.w,this.dir);const dPocket=(this.x-px)*this.dir;if(this.w.tb>0&&dPocket>0&&dPocket<9&&onFace)this.combo.trickle(dt*60);
  // kick out over the back
  if(s.u>s.wb*.18&&this.vz>1.5){this.finishRide('kick');return;}
  if(this.z<3){this.finishRide('shore');return;}}
 detect(dt,s,sp){// turns: accumulate while the board is swinging, classify when it settles
  const yr=this.yawRate;if(Math.abs(yr)>.9&&sp>4){if(!this.turnStart)this.turnStart={u:s.u/s.wf,t:this.t,yaw:this.yaw,dirx:this.hx()*this.dir,hz:this.hz()};this.turnAcc+=yr*dt;this.calm=0;}
  else if(this.turnStart){this.calm+=dt;if(this.calm>.14){this.classify(s,sp);this.turnStart=null;this.turnAcc=0;}}}
 classify(s,sp){const a=Math.abs(this.turnAcc),st=this.turnStart,dur=this.t-st.t;if(a<1.0)return;
  const nowDirx=this.hx()*this.dir,up=this.hz(),pos=st.u;let name=null,pts=0;
  if(st.dirx>.15&&nowDirx<-.25&&a>2.2){name=a>3.9?'ROUNDHOUSE CUTBACK':'CUTBACK';pts=a>3.9?900:600;}
  else if(pos<-.75&&up>.35){name='BOTTOM TURN';pts=250+a*60;}
  else if(pos>-.55&&up<-.25){const curl=Math.abs(this.x-this.sim.peelX(this.w,this.dir))<5;name=curl?'RE-ENTRY':dur<.5?'SNAP':'TOP TURN';pts=curl?850:dur<.5?650:400;}
  else if(a>1.4){name='CARVE';pts=300;}
  if(name){pts*=1+Math.min(.6,(sp-6)*.05);const p=this.combo.add(name,pts);this.ev('trick',this,{name,pts:p,spray:true});}}
 launch(vyS,s){this.state='air';this.vy=Math.max(3.5,vyS*.62+(this.ctl.jump?2.2:0))*(1+this.skill*.05);this.spin=0;this.flip=0;this.grab=null;this.grabT=0;this.lastGrab=-9;this.airT=0;this.maxAirH=0;this.airBase=this.y;this.inBarrel=false;
  this.launchYaw=this.yaw;this.ev('launch',this);}
 // ---------- air ----------
 stepAir(dt){const c=this.ctl;this.airT+=dt;this.vy-=G*dt;
  if(Math.abs(c.x)>.3){const r=-c.x*7.2*dt;this.yaw+=r;this.spin+=r;}
  if(Math.abs(c.y)>.5&&this.airT>.08){const r=Math.sign(c.y)*6.3*dt;this.flip+=r;}
  if(c.grab){if(!this.grab){this.grab=c.grab;}this.grabT+=dt;this.lastGrab=this.airT;}else if(this.grab&&!c.grab){this.grabHeld=this.grab;this.grab=null;}
  this.x+=this.vx*dt;this.z+=(this.vz-C)*dt;this.y+=this.vy*dt;this.maxAirH=Math.max(this.maxAirH,this.y-this.airBase);
  const h=this.sim.height(this.x,this.z);if(this.y<=h&&this.vy<0){this.y=h;this.land();}
  this.pitch=this.flip;this.roll*=.9;}
 land(){const vyaw=Math.atan2(this.vx,this.vz),d=Math.abs(wrap(this.yaw-vyaw)),fl=Math.abs(wrap(this.flip)),half=Math.round(Math.abs(this.spin)/Math.PI);
  const holding=!!this.grab||(this.airT-this.lastGrab)<.1;let rev=false;
  if(holding){this.wipe('grab');return;}
  if(fl>.75){this.wipe('flip');return;}
  if(d>.85){if(Math.abs(d-Math.PI)<.7){rev=true;}else{this.wipe('land');return;}}
  // name the trick
  const fr=Math.round(Math.abs(this.flip)/(Math.PI*2));let nm='',pts=350+this.maxAirH*140+this.airT*200;
  const deg=half*180;if(fr>0){nm=half>=1?'RODEO FLIP':'FLIP';pts+=1300*fr;}
  if(half>=1&&!fr){nm=deg===180?'AIR REVERSE':deg===360?'FULL ROTATION':deg+'';pts+=half*330;}else if(half>1&&fr)nm+=' '+deg;
  if(rev&&half<1)nm='AIR REVERSE';const g=this.grabHeld;if(g){const gn={rail:'RAIL GRAB',tail:'TAIL GRAB',superman:'SUPERMAN'}[g];nm=nm?gn+' '+nm:gn;pts+=this.grabT*(g==='superman'?1100:650)+(g==='superman'?600:200);}
  if(!nm)nm='AIR';this.grabHeld=null;
  if(rev)this.yaw=Math.atan2(this.vx,this.vz);
  const p=this.combo.add(nm,pts);this.ev('trick',this,{name:nm,pts:p,big:true,air:true});this.ev('land',this,this.maxAirH);
  const s=this.sim.sample(this.x,this.z,this._s||(this._s={}));
  if(s.w&&s.u<s.wb*.1&&s.a>.5){this.state='ride';this.w=s.w;const sp=Math.max(6,this.speed*.85);const hx=this.hx(),hz=this.hz();this.vx=hx*sp;this.vz=hz*sp;this.turnStart=null;this.turnAcc=0;}
  else{this.finishRide('flyout');}}
 // ---------- wipeout ----------
 wipe(why){const lost=this.combo.fail();this.state='wipe';this.wipeT=0;const a=this.w?this.w.A:1.5;this.wipeDur=1.1+a*.45;this.why=why;this.inBarrel=false;this.barrelT=0;
  if(this.w)this.w.riders=Math.max(0,this.w.riders-1);this.w=null;this.vx=0;this.vz=-C*.6;this.ev('wipe',this,{why,lost});}
 stepWipe(dt){this.wipeT+=dt;if(this.ctl.mash)this.wipeT+=.16;this.ctl.mash=false;this.vz+=(0-this.vz)*dt*.8;this.z+=this.vz*dt;this.x+=this.vx*dt;
  this.y=this.sim.height(this.x,this.z)-1.2*Math.sin(Math.min(1,this.wipeT/this.wipeDur)*Math.PI);
  if(this.wipeT>=this.wipeDur){const gy=groundY(this.x,this.z);this.state=this.sim.height(this.x,this.z)-gy<.4?'foot':'paddle';this.yaw=Math.PI;this.vx=this.vz=0;this.duck=0;this.ev('surface',this);}}
 finishRide(why){if(this.w)this.w.riders=Math.max(0,this.w.riders-1);const b=this.combo.active?this.combo.bank():null;if(b)this.waveScore+=b.t;
  this.ev('rideEnd',this,{why,bank:b,wave:this.waveScore,dur:this.rideT});this.w=null;this.state='paddle';this.inBarrel=false;
  // keep moving, now in the world frame
  this.vz=this.vz-C;const sp=this.speed;if(sp>3){this.vx*=3/sp;this.vz*=3/sp;}this.yaw=Math.atan2(this.vx,this.vz);this.waveScore=0;}
}
export function freshCtl(){return{x:0,y:0,mx:0,mz:0,dx:0,dz:0,has:false,paddle:false,pop:false,autoPop:false,jump:false,crouch:false,stall:false,duck:false,grab:null,mash:false};}
