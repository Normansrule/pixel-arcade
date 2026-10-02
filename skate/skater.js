// SKATE CITY — skater physics + trick state machine. Shared by the player and the CPU rival.
// Modes: ground (rolling / manual), air, grind, lip, bail. Fixed-step (1/120 s) friendly.
import * as THREE from '../vendor/three.module.min.js';
import {dirOf,FLIPS,GRABS,GRINDS,SLIDES,LIPS,MANUALS} from './tricks.js';
const V=THREE.Vector3,Q=THREE.Quaternion,UP=new V(0,1,0),cl=(v,a,b)=>v<a?a:v>b?b:v,ss=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const G=20;
const _m=new THREE.Matrix4(),_a=new V(),_b=new V(),_c=new V(),_q=new Q(),O={h:0,gx:0,gz:0},O2={h:0,gx:0,gz:0};
const inR=(r,x,z)=>x>=r[0]&&x<=r[1]&&z>=r[2]&&z<=r[3];
const _ba=new V(),_bb=new V(),_bu=new V();
function basis(q,up,fwd){_bu.copy(up);_ba.copy(fwd).addScaledVector(_bu,-fwd.dot(_bu));if(_ba.lengthSq()<1e-8)return q;_ba.normalize();_bb.crossVectors(_bu,_ba);_m.makeBasis(_bb,_bu,_ba);return q.setFromRotationMatrix(_m);}
function nrm(o,n){const l=Math.hypot(o.gx,1,o.gz);return n.set(-o.gx/l,1/l,-o.gz/l);}

export class Skater{
 constructor(world,o){this.world=world;this.combo=o.combo;this.ev=o.ev||(()=>{});this.stats=o.stats||{air:3,speed:3,spin:3,balance:3,flip:3};this.name=o.name||'';
  this.p=new V();this.v=new V();this.q=new Q();this.visQ=new Q();this.n=new V(0,1,0);
  this.ctl={x:0,y:0,ollie:false,flip:false,grab:false,grind:false,revert:false,special:false,manual:false,nose:false};this.prev={};
  this.special=0;this.airId=0;this.time=0;this.gaps=new Set();this.reset(0,0,0);}
 get ollieV(){return 6.5+.22*this.stats.air;}get maxS(){return 10.4+.45*this.stats.speed;}get spinR(){return 6.6+.5*this.stats.spin;}
 get balK(){return 1.25-.07*this.stats.balance;}get flipT(){return .5-.018*this.stats.flip;}
 reset(x,z,yaw){const W=this.world;this.p.set(x,W.H(x,z),z);this.v.set(0,0,0);W.normal(x,z,this.n);basis(this.q,this.n,new V(Math.sin(yaw),0,Math.cos(yaw)));this.visQ.copy(this.q);
  this.mode='ground';this.trick=null;this.man=null;this.grind=null;this.lip=null;this.air=null;this.crouch=0;this.hold=0;this.landWin=0;this.cool=0;this.manBuf=null;this.fakie=false;this.bailT=0;this.revT=0;this.pushing=false;this.speed=0;this.steep=false;}
 fwd(o=new V()){return o.set(0,0,1).applyQuaternion(this.q);}
 up(o=new V()){return o.set(0,1,0).applyQuaternion(this.q);}
 step(dt){const c=this.ctl,p=this.prev;this.E={flip:c.flip&&!p.flip,grab:c.grab&&!p.grab,grind:c.grind&&!p.grind,revert:c.revert&&!p.revert,odown:c.ollie&&!p.ollie,oup:!c.ollie&&p.ollie,manual:c.manual?'man':c.nose?'nose':null};
  this.time+=dt;this.cool=Math.max(0,this.cool-dt);this.revT=Math.max(0,this.revT-dt);
  if(this.E.manual&&this.mode==='air')this.manBuf={k:this.E.manual,t:this.time};
  switch(this.mode){case'ground':this.ground(dt);break;case'air':this.airStep(dt);break;case'grind':this.grindStep(dt);break;case'lip':this.lipStep(dt);break;case'bail':this.bailT+=dt;break;}
  if(this.combo.active||this.mode==='bail')this.idleT=0;else{this.idleT=(this.idleT||0)+dt;if(this.idleT>6)this.special=Math.max(0,this.special-dt*.02);}
  this.speed=this.v.length();Object.assign(p,c);c.manual=c.nose=false;
  this.visQ.slerp(this.q,1-Math.exp(-dt*(this.mode==='air'?30:16)));}
 // ---------------- ground ----------------
 ground(dt){const W=this.world,c=this.ctl,E=this.E,p=this.p,v=this.v;W.H(p.x,p.z,O);const n=nrm(O,this.n);
  if(O.h-p.y>.5){p.y=O.h;}
  // gravity along the surface; climbing transitions costs less than dropping in gives (arcade pump)
  _c.set(0,-G,0).addScaledVector(n,G*n.y);if(v.dot(_c)<0&&n.y<.92)_c.multiplyScalar(.5);v.addScaledVector(_c,dt);
  let sp=v.length();const man=this.man;
  {const rate=(sp<1?2.6:2.5-Math.min(1.1,sp*.055))*(this.crouch>.3?1.2:1)*(man?.6:1);const a=-c.x*rate*dt;if(sp>.4)v.applyAxisAngle(n,a);else{_q.setFromAxisAngle(n,a);this.q.premultiply(_q);}}
  const dir=sp>.05?_a.copy(v).divideScalar(sp):this.fwd(_a).multiplyScalar(this.fakie?-1:1).addScaledVector(n,0);
  const flat=n.y>.93;this.pushing=false;
  if(!man){if(c.y>.5&&flat&&sp<this.maxS){sp=Math.min(this.maxS,sp+6.5*dt);this.pushing=this.crouch<.2;}
   else if(c.y<-.5&&sp>0){sp=Math.max(0,sp-9*dt);}
}
  sp=Math.max(0,sp-(.22+sp*.012)*dt);sp=Math.min(sp,this.maxS*1.45+(this.special>=1?1.5:0));
  if(sp>.05&&dir.lengthSq()<.5)this.fwd(dir).multiplyScalar(this.fakie?-1:1);
  v.copy(dir).multiplyScalar(sp);
  // move + collide
  let nx=p.x+v.x*dt,nz=p.z+v.z*dt,ny=p.y+v.y*dt;let h=W.H(nx,nz,O2);
  if(h-ny>.18||O2.wall){const bx=W.H(p.x+v.x*dt,p.z)-(ny)>.18,bz=W.H(p.x,p.z+v.z*dt)-(ny)>.18;const imp=Math.hypot(bx?v.x:0,bz?v.z:0)||sp;
   if(bx)v.x*=-.25;if(bz)v.z*=-.25;if(!bx&&!bz){v.x*=-.25;v.z*=-.25;}nx=p.x+(bx?0:v.x*dt);nz=p.z+(bz?0:v.z*dt);h=W.H(nx,nz,O2);if(h-ny>.18){nx=p.x;nz=p.z;h=W.H(nx,nz,O2);}
   if(imp>3)this.ev('bump',this,imp);if(man&&imp>5)return this.doBail('wall');sp=v.length();}
  if(ny-h>.07&&!(this.man&&ny-h<.12)){p.set(nx,ny,nz);this.toAir(n.y<.42&&v.y>0,n);return;}
  const nOld=_b.copy(n),n2=nrm(O2,this.n);if(v.dot(n2)>.8&&nOld.dot(n2)<.97){p.set(nx,Math.max(ny,h),nz);this.toAir(nOld.y<.42&&v.y>0,nOld);return;}
  p.set(nx,h,nz);const vn=v.dot(n2);v.addScaledVector(n2,-vn);const l=v.length();if(l>1e-4)v.multiplyScalar(sp/l);
  // orientation follows travel (forward or fakie)
  const f=this.fwd(_b);if(sp>.4){_c.copy(v).divideScalar(sp);if(f.dot(_c)<0){this.fakie=true;_c.negate();}else this.fakie=false;basis(this.q,n2,_c);}else basis(this.q,n2,f);
  this.steep=n2.y<.5;
  if(W.hazard(p.x,p.z))return this.doBail('splash');
  // manual balance
  if(man){man.T+=dt;this.balance(man,c.y,dt,.9);if(Math.abs(man.bal)>=1)return this.doBail('manual');this.combo.tick(man.entry,man.def.rate*(1+.03*this.stats.balance)*dt);this.charge(man.def.rate*dt);
   if(sp<1.2||E.manual){this.man=null;this.bank();}}
  // landing grace window: manual / revert keep the combo alive, otherwise it banks
  if(this.landWin>0&&!man){if(E.revert&&this.landSteep){this.revert();}else if(E.manual&&sp>1.5){this.startManual(E.manual);}else{this.landWin-=dt;if(this.landWin<=0)this.bank();}}
  else if(E.manual&&!man&&sp>1.5)this.startManual(E.manual);
  // ollie: hold to crouch, release to pop (instant pop out of a manual)
  if(c.ollie){this.crouch=Math.min(1,this.crouch+dt*6);this.hold+=dt;}else this.crouch=Math.max(0,this.crouch-dt*5);
  if((E.oup&&this.hold>0)||(man&&E.odown)){this.ollie(n2);this.hold=0;return;}if(!c.ollie)this.hold=0;
  // grind / lip from the ground (auto-hop onto rails)
  if((E.grind||(c.grind&&this.cool<=0))&&sp>1.2){const r=W.rail(p,1.25,-.25,1.55);if(r){if(r.rail.kind==='coping'&&n2.y<.5&&v.y>0)this.startLip(r);else if(!(r.rail.kind==='coping'&&n2.y<.5)){if(r.y-p.y<.32)this.startGrind(r,true);else{this.grindBuf=.7;this.hold=.25;this.ollie(n2);}}}}}
 balance(o,input,dt,k){o.dr+=((Math.random()-.5)*3-o.dr*.9)*dt;o.bal+=(o.dr*.7+o.bal*this.balK*(1+o.T*.18)*k+input*2.1)*dt;}
 charge(pts){const was=this.special>=1;this.special=Math.min(1,this.special+pts*.0009);if(!was&&this.special>=1)this.ev('specialReady',this);}
 bank(){this.landWin=0;if(!this.combo.active)return;const pts=this.combo.bank();this.ev('bank',this,pts);}
 revert(){this.landSteep=false;_q.setFromAxisAngle(this.n,Math.PI);this.q.premultiply(_q);this.revT=.25;this.revDir=Math.random()<.5?1:-1;const e=this.combo.add('Revert',100,{kind:'revert'});this.charge(100);this.landWin=.45;this.ev('trick',this,'Revert');}
 startManual(k){const sp=this.special>=1&&this.ctl.special;const def=sp?MANUALS.SP:MANUALS[k];this.man={def,bal:(Math.random()-.5)*.25,dr:0,T:0,entry:this.combo.add(def.name,def.base,{kind:'manual'})};this.landWin=0;this.charge(def.base);this.ev('trick',this,def.name,sp);}
 ollie(n){const pop=this.ollieV*(.8+.2*Math.min(1,this.hold/.25)),d=n.y>.7?_c.copy(UP).multiplyScalar(.75).addScaledVector(n,.25).normalize():UP;const wasMan=!!this.man;this.man=null;this.v.addScaledVector(d,pop);this.toAir(n.y<.42,n);this.ev('ollie',this,wasMan);}
 // ---------------- air ----------------
 toAir(vert,n){const fw=this.fwd(_a),up=this.up(_b);let fh=new V(fw.x,0,fw.z);if(fh.length()<.35){fh.set(up.x,0,up.z).multiplyScalar(fw.y>0?-1:1);}if(fh.lengthSq()<1e-6)fh.set(0,0,1);fh.normalize();
  const vf=n?new V(n.x,0,n.z):new V();if(vf.lengthSq()>1e-6)vf.normalize();
  this.air={vert:!!vert&&vf.lengthSq()>.5,f:vf,psi:Math.atan2(fh.x,fh.z),spin:0,spinV:0,k:1,tilt:this.up(new V()),t:0,id:++this.airId,x:this.p.x,z:this.p.z,y:this.p.y,over:new Set()};
  if(this.landWin>0)this.bank();this.mode='air';this.man=null;this.landWin=0;}
 airStep(dt){const W=this.world,c=this.ctl,E=this.E,p=this.p,v=this.v,A=this.air;A.t+=dt;v.y-=G*dt;
  if(A.vert){const s=v.x*A.f.x+v.z*A.f.z,t=.12;v.x+=A.f.x*(t-s);v.z+=A.f.z*(t-s);}
  // spin
  const sT=-c.x*this.spinR;if(Math.abs(c.x)>.3)A.spinV+=(sT-A.spinV)*Math.min(1,dt*14);else A.spinV*=Math.exp(-dt*12);
  // lip transfer: revert at the lip airs out onto the deck instead of back into the ramp
  if(A.vert&&this.E.revert&&A.t<.45){A.vert=false;v.x-=A.f.x*2.6;v.z-=A.f.z*2.6;this.ev('trick',this,'Transfer');this.combo.add('Transfer',150,{air:A.id,kind:'transfer'});}A.psi+=A.spinV*dt;A.spin+=A.spinV*dt;
  // tilt: straighten after takeoff, then match the surface we are about to land on
  const hb=W.H(p.x,p.z,O),nb=nrm(O,_c),gap=p.y-hb;let kT=0;
  if(v.y<0&&(A.vert||nb.y<.9)){kT=ss(2.4,.35,gap);if(A.k<.05||kT>A.k)A.tilt.lerp(nb,Math.min(1,dt*10)).normalize();}
  A.k+=(kT-A.k)*Math.min(1,dt*(kT>A.k?16:6.5));
  const upT=_a.copy(UP).lerp(A.tilt,A.k).normalize();_q.setFromUnitVectors(UP,upT);const fwd=_b.set(Math.sin(A.psi),0,Math.cos(A.psi)).applyQuaternion(_q);basis(this.q,upT,fwd);
  // tricks
  const tr=this.trick,spc=c.special&&this.special>=1;
  if(!tr){if(E.flip)this.startFlip(spc);else if(E.grab)this.startGrab(spc);}
  else if(tr.kind==='flip'&&E.flip&&!tr.def.special&&tr.n<3&&tr.t<tr.dur*.7){tr.n++;tr.dur+=this.flipT*.7;tr.entry.name=(tr.n===2?'Double ':'Triple ')+tr.def.name;tr.entry.base+=tr.def.base*.9*tr.entry.f;this.charge(tr.def.base);this.ev('trick',this,tr.entry.name);}
  if(this.trick){const t=this.trick;t.t+=dt;if(t.kind==='flip'){if(t.t>=t.dur)this.trick=null;}
   else{if(t.held){if(!c.grab){t.held=false;}else if(t.t>.3){this.combo.tick(t.entry,(t.def.special?260:110)*dt);this.charge(110*dt);}}else{t.rel+=dt;if(t.rel>=.15)this.trick=null;}}}
  // gaps flown over
  for(const g of W.L.gaps)if(g.kind==='over'&&p.y>=g.y&&inR(g.a,p.x,p.z))A.over.add(g);
  // catch a rail / coping
  this.grindBuf=Math.max(0,(this.grindBuf||0)-dt);
  if((c.grind||this.grindBuf>0)&&this.cool<=0&&!(this.trick&&this.trick.kind==='flip'&&this.trick.t<this.trick.dur*.7)){const r=W.rail(p,.95,-.85,.45);if(r){const s=r.rail.segs[r.seg];const along=Math.abs(v.x*s.d.x+v.z*s.d.z);
    if(r.rail.kind==='coping'&&A.vert&&along<2.6){if(r.y-p.y>-.7){this.startLip(r);return;}}else{this.grindBuf=0;this.startGrind(r,false);return;}}}
  // move
  const nx=p.x+v.x*dt,ny=p.y+v.y*dt,nz=p.z+v.z*dt;const h=W.H(nx,nz,O);
  if(ny<=h){if(h-p.y>.4||O.wall){const bx=W.H(p.x+v.x*dt,p.z)>p.y+.4,bz=W.H(p.x,p.z+v.z*dt)>p.y+.4;if(bx||!bz)v.x*=-.3;if(bz||!bx)v.z*=-.3;p.y=ny;if(p.y<W.H(p.x,p.z))p.y=W.H(p.x,p.z);this.ev('bump',this,4);return;}
   return this.land(nx,h,nz);}
  p.set(nx,ny,nz);}
 land(x,h,z){const W=this.world,v=this.v,A=this.air;this.p.set(x,h,z);const n=W.normal(x,z,this.n);const vn=v.dot(n);_c.copy(v).addScaledVector(n,-vn);
  let bail=null;const tr=this.trick;if(tr){if(tr.kind==='flip'&&tr.t<tr.dur*.78)bail='flip';else if(tr.kind==='grab'&&(tr.held||tr.rel<.06))bail='grab';}
  const up=this.up(_a);if(!A.vert&&up.dot(n)<.5)bail=bail||'over';
  const fw=this.fwd(_b);fw.addScaledVector(n,-fw.dot(n));let td;if(_c.length()>.7)td=_c.clone().normalize();else{td=new V(0,-G,0).addScaledVector(n,G*n.y);if(td.lengthSq()<.01)td.copy(fw);td.normalize();}
  const cs=fw.lengthSq()>1e-6?fw.normalize().dot(td):1,tol=A.vert?.36:.56;if(Math.abs(cs)<tol)bail=bail||'spin';
  if(bail)return this.doBail(bail);
  v.copy(_c);this.fakie=cs<0;basis(this.q,n,td.clone().multiplyScalar(cs<0?-1:1));
  this.mode='ground';this.trick=null;this.finishAir(x,z);
  this.landSteep=n.y<.85||A.vert;this.landWin=this.combo.active?.32:0;this.ev('land',this,Math.max(0,-vn),A.t);
  if(this.manBuf&&this.time-this.manBuf.t<.45&&this.combo.active){this.startManual(this.manBuf.k);}this.manBuf=null;}
 finishAir(x,z){const A=this.air;if(!A)return;const half=Math.floor((Math.abs(A.spin)+.55)/Math.PI);
  if(half>=1){const lab=(A.spin>0?'BS ':'FS ')+half*180;this.combo.spin(A.id,half,lab);this.charge(60*half);}
  for(const g of this.world.L.gaps){if(g.kind==='air'&&((inR(g.a,A.x,A.z)&&inR(g.b,x,z))||(g.both&&inR(g.b,A.x,A.z)&&inR(g.a,x,z))))this.gap(g);}
  for(const g of A.over)this.gap(g);this.air=null;}
 gap(g){this.combo.add(g.name,g.pts,{gap:true});this.gaps.add(g.name);this.charge(g.pts);this.ev('gap',this,g);}
 startFlip(sp){const def=sp?FLIPS.SP:FLIPS[dirOf(this.ctl.x,this.ctl.y)];const dur=def.dur||this.flipT;this.trick={kind:'flip',def,t:0,dur,n:1,entry:this.combo.add(def.name,def.base,{air:this.air.id,kind:'flip'})};this.charge(def.base);this.ev('trick',this,def.name,sp);}
 startGrab(sp){const def=sp?GRABS.SP:GRABS[dirOf(this.ctl.x,this.ctl.y)];this.trick={kind:'grab',def,t:0,held:true,rel:0,entry:this.combo.add(def.name,def.base,{air:this.air.id,kind:'grab'})};this.charge(def.base);this.ev('trick',this,def.name,sp);}
 // ---------------- grind ----------------
 startGrind(r,fromGround){const s=r.rail.segs[r.seg],d=s.d,v=this.v;const along=v.x*d.x+v.y*d.y+v.z*d.z;const fw=this.fwd(_a);
  let dir=Math.abs(along)>.8?Math.sign(along):(fw.x*d.x+fw.z*d.z>=0?1:-1);const spd=Math.max(4.2,Math.abs(along)*.85+Math.hypot(v.x,v.z)*.15);
  const fh=Math.hypot(fw.x,fw.z)||1,al=Math.abs((fw.x*d.x+fw.z*d.z)/fh);const slide=al<.62;const spc=this.ctl.special&&this.special>=1,k=dirOf(this.ctl.x,this.ctl.y);
  const def=spc?GRINDS.SP:slide?SLIDES[k]:GRINDS[k];
  const tx=d.x*dir,tz=d.z*dir;const sign=(fw.x*tx+fw.z*tz)>=0?1:-1,psign=(fw.x*tz-fw.z*tx)>=0?1:-1;
  if(this.mode==='air'){this.finishAir(r.x,r.z);}
  this.trick=null;this.man=null;this.landWin=0;
  this.grind={rail:r.rail,seg:r.seg,t:r.t,dir,s:spd,def,slide:slide||!!def.slide,sign,psign,bal:(Math.random()-.5)*.3,dr:0,T:0,dist:0,entry:this.combo.add(def.name,def.base,{kind:'grind'})};
  this.p.set(r.x,r.y,r.z);this.mode='grind';this.charge(def.base);this.ev('grind',this,def.name,spc,fromGround);}
 grindStep(dt){const g=this.grind,c=this.ctl,E=this.E;let s=g.rail.segs[g.seg];g.T+=dt;
  g.s+=-G*.75*s.d.y*g.dir*dt;g.s-=(.35+g.s*.008)*dt;
  if(g.s<1.1)return this.leaveRail(1.2);
  g.t+=g.dir*g.s*dt/s.len;g.dist+=g.s*dt;
  while(g.t>1||g.t<0){const R=g.rail,over=(g.t>1?g.t-1:-g.t)*s.len;let ni=g.seg+g.dir;if(R.closed)ni=(ni+R.segs.length)%R.segs.length;const nsg=R.segs[ni];
   if(!nsg||s.d.x*nsg.d.x+s.d.y*nsg.d.y+s.d.z*nsg.d.z<.45){g.t=cl(g.t,0,1);this.p.copy(s.a).lerp(s.b,g.t);return this.leaveRail(1.4);}
   g.seg=ni;s=nsg;g.t=g.dir>0?over/s.len:1-over/s.len;}
  this.p.copy(s.a).lerp(s.b,g.t);this.v.set(s.d.x,s.d.y,s.d.z).multiplyScalar(g.dir*g.s);
  const tx=s.d.x*g.dir,tz=s.d.z*g.dir;_a.set(tx,0,tz).normalize();if(g.slide)_a.set(tz*g.psign,0,-tx*g.psign);else _a.multiplyScalar(g.sign);basis(this.q,UP,_a);
  this.fakie=g.sign<0;
  this.balance(g,c.x,dt,1);if(Math.abs(g.bal)>=1)return this.doBail('grind');
  const rate=(g.def.rate||75)*(1+.04*this.stats.balance);this.combo.tick(g.entry,rate*dt);this.charge(rate*dt);
  this.ev('spark',this,g);
  if(E.odown){this.leaveRail(this.ollieV*.95,true);this.ev('ollie',this,true);}}
 leaveRail(up,ollie){const g=this.grind,R=g.rail,s=R.segs[g.seg];this.railGap(g);
  this.v.set(s.d.x,s.d.y,s.d.z).multiplyScalar(g.dir*g.s);this.v.y=Math.max(this.v.y,0)+up;const cop=R.kind==='coping'&&s.f;
  if(cop){this.v.x+=s.f[0]*1.1;this.v.z+=s.f[1]*1.1;}
  this.grind=null;this.cool=.3;this.p.y+=.02;this.toAir(false,null);this.air.psi=Math.atan2(s.d.x*g.dir*g.sign,s.d.z*g.dir*g.sign);if(cop){this.air.vert=true;this.air.f.set(s.f[0],0,s.f[1]);}}
 railGap(g){for(const G of this.world.L.gaps){if(G.kind!=='rail'||!G.rail.some(id=>g.rail.id===id))continue;if(G.dist?g.dist>=G.dist:g.dist>=G.min*g.rail.len)this.gap(G);}}
 // ---------------- lip tricks ----------------
 startLip(r){const s=r.rail.segs[r.seg];const f=s.f?new V(s.f[0],0,s.f[1]):this.up(new V()).setY(0).normalize();const spc=false,def=LIPS[dirOf(this.ctl.x,this.ctl.y)];
  if(this.mode==='air')this.finishAir(r.x,r.z);this.trick=null;this.man=null;this.landWin=0;
  this.lip={x:r.x,y:r.y,z:r.z,f,def,bal:(Math.random()-.5)*.2,dr:0,T:0,entry:this.combo.add(def.name,def.base,{kind:'lip'})};this.mode='lip';this.p.set(r.x,r.y,r.z);this.v.set(0,0,0);
  basis(this.q,UP,f.clone().negate());this.charge(def.base);this.ev('lip',this,def.name);}
 lipStep(dt){const L=this.lip,c=this.ctl;L.T+=dt;this.balance(L,c.y,dt,.8);if(Math.abs(L.bal)>=1)return this.doBail('lip');
  this.combo.tick(L.entry,60*dt);this.charge(60*dt);
  if((!c.grind&&L.T>.35)||this.E.odown||L.T>6){// drop back in, riding fakie down the face
   const W=this.world,x=L.x+L.f.x*.035,z=L.z+L.f.z*.035;const h=W.H(x,z,O);this.p.set(x,h,z);const n=nrm(O,this.n);
   const down=new V(0,-1,0).addScaledVector(n,n.y).normalize();this.v.copy(down).multiplyScalar(2.5);basis(this.q,n,down.clone().negate());this.fakie=true;this.lip=null;this.mode='ground';this.landSteep=true;this.landWin=.4;this.ev('land',this,2,0);}}
 // ---------------- bail ----------------
 doBail(why){const lost=this.combo.fail();this.mode='bail';this.bailT=0;this.trick=null;this.man=null;this.grind=null;this.lip=null;this.air=null;this.special=0;this.landWin=0;this.ev('bail',this,why,lost);}
 respawn(x,z){const W=this.world;// slide down off steep ramps to somewhere flat
  for(let i=0;i<60;i++){W.H(x,z,O);const s=Math.hypot(O.gx,O.gz);if(s<.15&&!W.hazard(x,z))break;if(s>=.15){x-=O.gx/s*.35;z-=O.gz/s*.35;}else{x+=.4;}}
  const f=this.fwd(new V());const yaw=Math.atan2(f.x,f.z);this.reset(x,z,isFinite(yaw)?yaw:0);}
}
