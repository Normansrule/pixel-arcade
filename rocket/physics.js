// ROCKET ARENA — physics: arena distance field, car handling, ball, collisions.
// Units are "arena metres". The car is ~4.2 long; +Z of a car is its nose, +Y its roof, +X its left side.
// Cars are solid boxes: 18 body points are kept outside every arena surface each step, and four wheel
// rays read the surface under the car, so cars ride smoothly up ramps and walls and never sink into them.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,Q=THREE.Quaternion;

/* ================= arena dimensions ================= */
export const W=62,L=86,H=40;          // half width (x), half length (z), ceiling height
export const RC=18,RF=8;              // vertical corner radius, floor/ceiling quarter-pipe radius
export const GW=20,GH=15,GD=14;       // goal half-width, height, depth
export const PR=.55;                  // post radius
export const RB=2.35,G=21;            // ball radius, gravity
// body box half sizes (hx,hy,hz) around a centre oy below the car origin; ride = origin height above the ground
export const CAR={hx:1.2,hy:.53,hz:2.08,oy:-.04,ride:.86,mass:5,r:1.2,len:.95};
export const SP={throttle:38,reverse:24,max:62,super:55,boostAcc:34,boostUse:33.3,brake:95,coast:12,jump:10.5,hold:30,jump2:10.5,dodge:15};
const cl=(v,a,b)=>v<a?a:v>b?b:v;

/* ================= arena distance field =================
   query(p,out): out.d = distance from p to the nearest arena surface (positive inside),
   out.n = unit normal pointing back into the play space.
   The play space is the union of the rounded arena shell and the two goal boxes (max of the two
   interior distances), with the posts and crossbar as round bars on top. */
const RR={s:0,ox:0,oz:0};
function rrect(x,z){const ax=Math.abs(x),az=Math.abs(z),sx=x<0?-1:1,sz=z<0?-1:1,qx=ax-(W-RC),qz=az-(L-RC);
 if(qx>0&&qz>0){const d=Math.hypot(qx,qz)||1e-6;RR.s=d-RC;RR.ox=qx/d*sx;RR.oz=qz/d*sz;}
 else if(qx>qz){RR.s=ax-W;RR.ox=sx;RR.oz=0;}else{RR.s=az-L;RR.ox=0;RR.oz=sz;}}
function shell(x,y,z,o){rrect(x,z);const s=RR.s;
 if(s>-RF&&y<RF){const a=s+RF,b=y-RF,l=Math.hypot(a,b)||1e-6;o.d=RF-l;o.n.set(-a/l*RR.ox,-b/l,-a/l*RR.oz);return;}
 if(s>-RF&&y>H-RF){const a=s+RF,b=y-(H-RF),l=Math.hypot(a,b)||1e-6;o.d=RF-l;o.n.set(-a/l*RR.ox,-b/l,-a/l*RR.oz);return;}
 let d=-s,nx=-RR.ox,ny=0,nz=-RR.oz;if(y<d){d=y;nx=0;ny=1;nz=0;}if(H-y<d){d=H-y;nx=0;ny=-1;nz=0;}o.d=d;o.n.set(nx,ny,nz);}
// height of the floor quarter-pipe surface at wall offset s (s<0 inside)
export const rampY=s=>s<=-RF?0:RF-Math.sqrt(Math.max(0,RF*RF-(s+RF)*(s+RF)));
const GZ0=L-RF-6;// goal boxes start inside the pitch (where the floor is flat anyway) so the mouth floor is level
function goalBox(x,y,z,o){const ax=Math.abs(x),az=Math.abs(z),sz=z<0?-1:1;let d=GW-ax,nx=x<0?1:-1,ny=0,nz=0;
 if(y<d){d=y;nx=0;ny=1;}if(GH-y<d){d=GH-y;nx=0;ny=-1;nz=0;}
 if(L+GD-az<d){d=L+GD-az;nx=0;ny=0;nz=-sz;}if(az-GZ0<d){d=az-GZ0;nx=0;ny=0;nz=sz;}o.d=d;o.n.set(nx,ny,nz);}
const segA=new V(),segB=new V(),tv=new V(),tv2=new V(),GQ={d:0,n:new V()};
function segDist(p,a,b,o){// distance from p to segment ab minus post radius
 tv.subVectors(b,a);const t=cl(tv2.subVectors(p,a).dot(tv)/tv.lengthSq(),0,1);tv.multiplyScalar(t).add(a);tv2.subVectors(p,tv);const l=tv2.length()||1e-6;
 const d=l-PR;if(d<o.d){o.d=d;o.n.copy(tv2).divideScalar(l);}}
export function query(p,o){const x=p.x,y=p.y,z=p.z,az=Math.abs(z),sz=z<0?-1:1;shell(x,y,z,o);
 if(az>GZ0&&Math.abs(x)<GW+RF+3&&y<GH+RF){goalBox(x,y,z,GQ);if(GQ.d>o.d){o.d=GQ.d;o.n.copy(GQ.n);}}
 if(az>L-12&&az<L+12&&y<GH+12){// posts + crossbar
  segA.set(-GW,0,sz*L);segB.set(-GW,GH,sz*L);segDist(p,segA,segB,o);
  segA.set(GW,0,sz*L);segB.set(GW,GH,sz*L);segDist(p,segA,segB,o);
  segA.set(-GW,GH,sz*L);segB.set(GW,GH,sz*L);segDist(p,segA,segB,o);}
 return o;}
export const mkQ=()=>({d:0,n:new V()});
const C=mkQ();
// sphere-trace a ray through the arena: true + out.t/out.n when it meets a surface within maxT
const RP=new V(),RQ=mkQ();
export function ray(o,dir,maxT,out){let t=0;for(let i=0;i<24;i++){RP.copy(o).addScaledVector(dir,t);query(RP,RQ);if(RQ.d<.03){out.t=t;out.n.copy(RQ.n);return true;}t+=RQ.d;if(t>maxT)return false;}return false;}

/* ================= ball ================= */
export class Ball{constructor(){this.p=new V(0,RB,0);this.v=new V();this.w=new V();this.q=new Q();this.touch=null;this.touchT=-9;this.prevTouch=null;this.charge=0;this.cteam=-1;}
 reset(){this.p.set(0,RB+.02,0);this.v.set(0,0,0);this.w.set(0,0,0);this.touch=null;this.prevTouch=null;this.charge=0;this.cteam=-1;}
 copy(b){this.p.copy(b.p);this.v.copy(b.v);this.w.copy(b.w);return this;}}
const bq=new Q(),bn=new V(),bs=new V(),br=new V(),bj=new V();
export function stepBall(b,dt,onBounce){
 b.v.y-=G*dt;b.v.multiplyScalar(1-.03*dt);const sp=b.v.length();if(sp>130)b.v.multiplyScalar(130/sp);const wl=b.w.length();if(wl>6)b.w.multiplyScalar(6/wl);
 b.p.addScaledVector(b.v,dt);
 for(let it=0;it<3;it++){query(b.p,C);if(C.d>=RB)break;bn.copy(C.n);b.p.addScaledVector(bn,RB-C.d);const vn=b.v.dot(bn);if(vn>=0)continue;
  const e=vn<-3.5?.6:0;b.v.addScaledVector(bn,-vn*(1+e));
  // friction couples spin and slide (solid sphere)
  bs.copy(b.v).addScaledVector(bn,-b.v.dot(bn));br.copy(bn).multiplyScalar(-RB);bj.crossVectors(b.w,br);bs.add(bj);const sl=bs.length();
  if(sl>1e-4){const J=Math.min(sl*2/7,.32*((1+e)*-vn+G*dt*Math.max(0,bn.y)));bs.multiplyScalar(-J/sl);b.v.add(bs);bj.crossVectors(br,bs).multiplyScalar(5/(2*RB*RB));b.w.add(bj);}
  if(bn.y>.7&&-vn<4)b.v.multiplyScalar(1-.1*dt);
  if(onBounce&&-vn>7)onBounce(-vn,bn,b.p);}
 if(wl>1e-4){bq.setFromAxisAngle(bj.copy(b.w).divideScalar(b.w.length()||1),b.w.length()*dt);b.q.premultiply(bq);}}
// which goal (if any) the ball is in: +1 = ball in +z goal (blue scores), -1 = -z goal (orange scores)
export const goalSide=p=>Math.abs(p.x)<GW+1&&p.y<GH+1&&Math.abs(p.z)>L+RB?(p.z>0?1:-1):0;
const pb=new Ball();
// predict the ball path with no cars: fills out[] with {x,y,z,t}; returns {side,t} if it would go in
export function predict(b,dur,dt,out){pb.copy(b);let goal=null,i=0;const n=Math.ceil(dur/dt);for(;i<n;i++){stepBall(pb,dt);const o=out&&(out[i]||(out[i]={x:0,y:0,z:0,vx:0,vy:0,vz:0,t:0}));if(o){o.x=pb.p.x;o.y=pb.p.y;o.z=pb.p.z;o.vx=pb.v.x;o.vy=pb.v.y;o.vz=pb.v.z;o.t=(i+1)*dt;}const s=goalSide(pb.p);if(s){goal={side:s,t:(i+1)*dt};i++;break;}}if(out)out.n=i;return goal;}

/* ================= cars ================= */
export const blankCtrl=()=>({thr:0,steer:0,jump:false,boost:false,hb:false,roll:0});
let CID=0;
export class Car{constructor(team){this.id=CID++;this.team=team;this.p=new V();this.v=new V();this.q=new Q();this.wl=new V();this.n=new V(0,1,0);this.cn=new V(0,1,0);
  this.ground=true;this.boost=33;this.airT=0;this.jumpT=9;this.dbl=false;this.dodgeT=0;this.dodging=0;this.holdT=0;this.demoT=0;this.hitCD=0;this.ctrl=blankCtrl();this.prevJump=false;
  this.super=false;this.boosting=false;this.body=false;this.roofT=0;this.steerVis=0;this.st=0;this.land=0;this.inf=false;this.wheelRot=0;this.assist=false;this.drift=0;}
 fwd(o){return o.set(0,0,1).applyQuaternion(this.q);} up(o){return o.set(0,1,0).applyQuaternion(this.q);} left(o){return o.set(1,0,0).applyQuaternion(this.q);}
 place(x,z,yaw){this.p.set(x,CAR.ride,z);this.v.set(0,0,0);this.wl.set(0,0,0);this.q.setFromAxisAngle(new V(0,1,0),yaw);this.n.set(0,1,0);this.ground=true;this.dbl=false;this.dodgeT=0;this.dodging=0;this.holdT=0;this.jumpT=9;this.airT=0;this.super=false;this.boosting=false;this.body=false;this.roofT=0;this.prevJump=false;this.st=0;}}
const cf=new V(),cu=new V(),clf=new V(),cq=new Q(),cg=new V(),UP=new V(0,1,0),cdir=new V(),cw=new V();
// turn rate (rad/s) by speed: nimble at low and mid speed, wider arcs at full boost
const turnRate=sp=>Math.min(1,sp/4)*(3.5-1.85*Math.min(1,sp/SP.max));
const thrAcc=fv=>Math.max(7,48-fv*1.05);
const aq=new Q();
function alignUp(c,n,rate){c.up(cu);cq.setFromUnitVectors(cu,n);if(rate<1){aq.identity().slerp(cq,rate);cq.copy(aq);}c.q.premultiply(cq).normalize();}

/* ---- wheel rays: where is the surface under the car? ---- */
const WH=[[1.0,1.22],[-1.0,1.22],[1.0,-1.18],[-1.0,-1.18]],wa=new V(),wd=new V(),WQ={t:0,n:new V()};
const PROBE={hits:0,n:new V(),t:0};
function probe(c,maxT){c.up(cu);wd.copy(cu).negate();let h=0,ts=0;PROBE.n.set(0,0,0);
 for(const w of WH){wa.set(w[0],0,w[1]).applyQuaternion(c.q).add(c.p);if(ray(wa,wd,maxT,WQ)){h++;ts+=WQ.t;PROBE.n.add(WQ.n);}}
 PROBE.hits=h;if(h){PROBE.t=ts/h;PROBE.n.normalize();}return PROBE;}

/* ---- body: 18 points on the box are pushed out of every surface ---- */
const PTS=[];for(const x of[-1,1])for(const y of[-1,1])for(const z of[-1,0,1])PTS.push(new V(x*CAR.hx*(z>0?.88:1),y*CAR.hy+CAR.oy,z*CAR.hz*(y>0&&z!==0?.8:1)));
PTS.push(new V(0,-CAR.hy+CAR.oy,0),new V(0,CAR.hy+CAR.oy,0),new V(0,CAR.oy,CAR.hz),new V(0,CAR.oy,-CAR.hz),new V(0,CAR.hy+CAR.oy,CAR.hz*.5),new V(0,CAR.hy+CAR.oy,-CAR.hz*.5));
// inverse inertia (local axes) of the body box, made heavier than a real box so knocks don't spin cars wildly
const box=(a,b)=>CAR.mass/12*((2*a)**2+(2*b)**2)*2.4;
const NB=PTS.length;for(const w of WH)PTS.push(new V(w[0]*1.1,-CAR.ride+.06,w[1]));
const IINV=new V(1/box(CAR.hy,CAR.hz),1/box(CAR.hx,CAR.hz),1/box(CAR.hx,CAR.hy));
const pw=new V(),bp=new V(),kn=new V(),rr=new V(),rl=new V(),nl=new V(),kk=new V(),ww=new V(),vp=new V(),vt=new V(),iq0=new Q(),BQ=mkQ();
function collide(c,air){c.body=false;
 for(let it=0;it<4;it++){let worst=-.002,hit=false;
  for(let i=0,n=air?PTS.length:NB;i<n;i++){pw.copy(PTS[i]).applyQuaternion(c.q).add(c.p);query(pw,BQ);if(BQ.d<worst){worst=BQ.d;hit=true;kn.copy(BQ.n);bp.copy(pw);}}
  if(!hit)break;
  c.p.addScaledVector(kn,-worst);c.body=true;c.cn.copy(kn);
  if(!air){const vn=c.v.dot(kn);if(vn<0)c.v.addScaledVector(kn,-vn);continue;}
  rr.subVectors(bp,c.p);ww.copy(c.wl).applyQuaternion(c.q);vp.crossVectors(ww,rr).add(c.v);const vn=vp.dot(kn);if(vn>=0)continue;
  iq0.copy(c.q).invert();rl.copy(rr).applyQuaternion(iq0);nl.copy(kn).applyQuaternion(iq0);
  kk.crossVectors(rl,nl).multiply(IINV);const denom=1/CAR.mass+nl.dot(vt.crossVectors(kk,rl));
  const J=-(1.2)*vn/denom;c.v.addScaledVector(kn,J/CAR.mass);c.wl.addScaledVector(kk,J);
  // friction along the surface
  vt.copy(vp).addScaledVector(kn,-vn);const sl=vt.length();if(sl>1e-3){const Jt=Math.min(.35*J,sl/(1/CAR.mass+.4));c.v.addScaledVector(vt,-Jt/sl/CAR.mass);}
  const wl=c.wl.length();if(wl>9)c.wl.multiplyScalar(9/wl);}}

/* ---- one fixed step for one car ---- */
export function stepCar(c,dt,ev){
 if(c.demoT>0)return;const k=c.ctrl;let press=k.jump&&!c.prevJump;c.prevJump=k.jump;
 c.boosting=!!k.boost&&(c.boost>0||c.inf);c.hitCD-=dt;
 // steering eases in (keyboard taps no longer jerk the car) and springs back quicker
 c.st+=(k.steer-c.st)*Math.min(1,dt*(Math.abs(k.steer)>Math.abs(c.st)?11:18));
 if(c.ground){
  const n=c.n;
  if(press){c.up(cu);c.v.addScaledVector(cu,SP.jump);c.ground=false;c.jumpT=0;c.airT=0;c.holdT=.2;c.dbl=false;c.body=false;press=false;c.p.addScaledVector(cu,.05);ev&&ev('jump',c);}
  else{
   c.fwd(cf);cf.addScaledVector(n,-cf.dot(n)).normalize();
   let fv=c.v.dot(cf);const sp=Math.abs(fv);
   const yaw=c.st*turnRate(sp)*(fv<-.5?-1:1)*(k.hb?1.55:1);cq.setFromAxisAngle(n,yaw*dt);c.q.premultiply(cq);cf.applyQuaternion(cq);clf.crossVectors(n,cf);
   fv=c.v.dot(cf);let lv=c.v.dot(clf);const t=k.thr;
   if(t>0){if(fv<0)fv=Math.min(0,fv+SP.brake*dt);else if(fv<SP.throttle)fv=Math.min(SP.throttle,fv+thrAcc(fv)*t*dt);}
   else if(t<0){if(fv>0)fv=Math.max(0,fv-SP.brake*-t*dt);else if(fv>-SP.reverse)fv=Math.max(-SP.reverse,fv+t*thrAcc(-fv)*dt);}
   else fv-=Math.sign(fv)*Math.min(Math.abs(fv),SP.coast*dt);
   if(fv>SP.throttle&&!c.boosting)fv=Math.max(SP.throttle,fv-SP.coast*.4*dt);
   if(c.boosting)fv=Math.min(SP.max,fv+SP.boostAcc*dt);
   // grip: tyres kill sideways slide fast; powerslide lets the tail swing
   lv*=Math.exp(-(k.hb?1.5:14)*dt);c.drift=Math.abs(lv);
   c.v.copy(cf).multiplyScalar(fv).addScaledVector(clf,lv);
   cg.set(0,-G,0);cg.addScaledVector(n,-cg.dot(n));c.v.addScaledVector(cg,dt);
   c.p.addScaledVector(c.v,dt);
   const pr=probe(c,CAR.ride+.8),spd=c.v.length();
   if(pr.hits<2||(pr.n.y<.3&&spd<8&&pr.n.y>-.5)||(pr.n.y<=-.5&&spd<14)){// drove off an edge, or too slow to hold a wall / the ceiling
    c.ground=false;c.airT=0;c.jumpT=9;c.dbl=false;if(pr.hits&&pr.n.y<.3)c.v.addScaledVector(pr.n,2.5);}
   else{c.up(cu);c.p.addScaledVector(cu,CAR.ride-pr.t);n.lerp(pr.n,Math.min(1,dt*60)).normalize();alignUp(c,n,Math.min(1,dt*40));
    // follow the curve: turn the velocity onto the surface without losing speed (concave ramps), shed it on bumps
    const vn=c.v.dot(n);if(vn<0){const s0=c.v.length();c.v.addScaledVector(n,-vn);const s1=c.v.length();if(s1>1e-3)c.v.multiplyScalar(Math.min(s0,s1+(s0-s1)*.97)/s1);}else c.v.addScaledVector(n,-vn);
    // a wall/ceiling grip: a little stick so a car at speed doesn't peel off
    if(n.y<.7)c.v.addScaledVector(n,-1.5*dt);}
   collide(c,false);
   c.wl.set(0,yaw,0);
   c.steerVis+=(c.st-c.steerVis)*Math.min(1,dt*10);c.wheelRot+=fv*dt/.45;
  }
 }
 if(!c.ground){
  c.airT+=dt;c.jumpT+=dt;c.up(cu);c.fwd(cf);
  if(c.holdT>0){if(k.jump)c.v.addScaledVector(cu,SP.hold*dt);else c.holdT=0;c.holdT-=dt;}
  if(press&&c.body){c.v.addScaledVector(c.cn,8);c.wl.set(0,0,0);c.roofT=Math.max(c.roofT,.6);ev&&ev('jump',c);}
  else if(press&&!c.dbl&&c.airT<1.45&&c.dodgeT<=0){c.dbl=true;const dx=k.steer,dy=k.thr;
   if(Math.abs(dx)+Math.abs(dy)>.5){// dodge / flip
    cdir.set(cf.x,0,cf.z);if(cdir.lengthSq()<.01)cdir.set(c.v.x,0,c.v.z);if(cdir.lengthSq()<.01)cdir.set(0,0,1);cdir.normalize();clf.crossVectors(UP,cdir);
    cw.copy(cdir).multiplyScalar(dy).addScaledVector(clf,dx).normalize();
    c.v.y=Math.max(0,c.v.y)*.25;c.v.addScaledVector(cw,SP.dodge);const sp=c.v.length();if(sp>SP.max+4)c.v.multiplyScalar((SP.max+4)/sp);
    c.wl.set(dy,0,-dx).normalize().multiplyScalar(Math.PI*2/.62);c.dodgeT=.62;c.dodging=.75;ev&&ev('dodge',c);}
   else{c.v.addScaledVector(cu,SP.jump2);ev&&ev('jump',c);}}
  if(c.dodgeT>0){c.dodgeT-=dt;if(c.dodgeT<=0)c.wl.multiplyScalar(.15);}
  else{let tx=k.thr*5.2,ty=k.steer*(k.hb?0:4.3),tz=(k.roll||(k.hb?-k.steer:0))*5.6;
   // landing assist: axes the player isn't using turn the wheels toward the surface the car is falling onto
   // and just before touchdown, held throttle no longer tips the nose into the ground
   if(c.assist&&(c.airT>.3||c.roofT>0)&&!c.body){query(c.p,C);if(C.d<14){const near=C.d<4.5&&c.v.dot(C.n)<2;if(near)tx=0;c.up(cu);const iq=aq.copy(c.q).invert();cw.crossVectors(cu,C.n).applyQuaternion(iq);const s=cu.dot(C.n)<0?2.4:3.2;
     if(!tx)tx+=cl(cw.x*s,-3.5,3.5);if(!k.roll&&!k.hb||near)tz=cl(cw.z*s,-3.5,3.5)+(near?0:tz);}}
   const r=Math.min(1,dt*9);c.wl.x+=(tx-c.wl.x)*r;c.wl.y+=(ty-c.wl.y)*r;c.wl.z+=(tz-c.wl.z)*r;}
  const wl=c.wl.length();if(wl>1e-4){cq.setFromAxisAngle(cw.copy(c.wl).divideScalar(wl),wl*dt);c.q.multiply(cq).normalize();}
  if(c.boosting)c.v.addScaledVector(c.fwd(cf),SP.boostAcc*dt);
  c.v.y-=G*dt;const sp=c.v.length();if(sp>SP.max+4)c.v.multiplyScalar((SP.max+4)/sp);
  c.p.addScaledVector(c.v,dt);
  const pr=probe(c,CAR.ride+.35);c.up(cu);
  if(pr.hits>=(c.roofT>0?2:3)&&c.jumpT>.12&&cu.dot(pr.n)>.55&&c.v.dot(pr.n)<3&&!(pr.n.y<=-.5&&c.v.length()<14)){// land on the wheels
   const vn=c.v.dot(pr.n);c.land=Math.min(1,Math.max(c.land,-vn/25));c.ground=true;c.n.copy(pr.n);c.p.addScaledVector(cu,CAR.ride-pr.t);c.v.addScaledVector(pr.n,-vn);
   alignUp(c,pr.n,.6);c.wl.set(0,0,0);c.dodgeT=0;c.dbl=false;c.holdT=0;c.roofT=0;c.body=false;collide(c,false);ev&&vn<-6&&ev('land',c,-vn);}
  else{collide(c,true);
   // stuck on the roof or side: after a beat the car rights itself (or press jump to pop up straight away)
   c.bodyT=c.body?0:(c.bodyT||0)+dt;c.up(cu);const lying=c.bodyT<.15&&c.cn.y>-.2&&c.v.length()<10&&cu.dot(c.cn)<.75;
   if(lying){c.roofT+=dt;c.v.multiplyScalar(1-2.5*dt);}else if(c.bodyT>.3&&c.roofT<.6)c.roofT=0;
   if(c.roofT>.45){if(cu.dot(c.cn)<.5)c.p.addScaledVector(c.cn,dt*1.2);alignUp(c,c.cn.y>.5?c.cn:UP,Math.min(1,dt*7));c.wl.multiplyScalar(.8);const cn0=c.cn.clone();collide(c,false);c.cn.copy(cn0);c.up(cu);if(cu.dot(c.cn)>.97||c.roofT>2.2)c.roofT=0;}}
 }
 if(c.boosting&&!c.inf)c.boost=Math.max(0,c.boost-SP.boostUse*dt);if(c.inf)c.boost=100;
 if(c.dodging>0){c.dodging-=dt;if(c.ground)c.dodging=0;}
 const s=c.v.length();c.super=c.super?s>SP.super-5:s>=SP.super;
 c.land=Math.max(0,c.land-dt*3);}

/* ================= car vs ball ================= */
const lb=new V(),cp=new V(),hn=new V(),vr=new V(),iq=new Q(),hd=new V(),cpos=new V();
const hitScale=dv=>dv<13.5?.65:dv<62?.65-.1*(dv-13.5)/48.5:Math.max(.3,.55-.25*(dv-62)/62);
export function carBall(c,b,ev){
 if(c.demoT>0)return false;c.up(cu);cpos.copy(c.p).addScaledVector(cu,CAR.oy);
 iq.copy(c.q).invert();lb.subVectors(b.p,cpos).applyQuaternion(iq);
 if(Math.abs(lb.x)>CAR.hx+RB||Math.abs(lb.y)>CAR.hy+RB||Math.abs(lb.z)>CAR.hz+RB)return false;
 cp.set(cl(lb.x,-CAR.hx,CAR.hx),cl(lb.y,-CAR.hy,CAR.hy),cl(lb.z,-CAR.hz,CAR.hz));hn.subVectors(lb,cp);let dist=hn.length();
 if(dist>=RB)return false;
 if(dist<1e-4){hn.subVectors(b.p,c.p).applyQuaternion(iq);dist=0;}
 hn.normalize().applyQuaternion(c.q);cp.applyQuaternion(c.q).add(cpos);
 b.p.addScaledVector(hn,(RB-dist)*.92);c.p.addScaledVector(hn,-(RB-dist)*.08);
 // relative velocity at the contact (includes the spin of a flipping car)
 cw.set(c.wl.x,c.wl.y,c.wl.z).applyQuaternion(c.q);vr.subVectors(cp,c.p);hd.crossVectors(cw,vr).add(c.v);vr.subVectors(b.v,hd);
 const vn=vr.dot(hn);if(vn>=0)return false;
 const j=-(1.1)*vn/(1+1/CAR.mass);
 // flips strike lower and harder: flatten the push direction while dodging
 if(c.dodging>0&&hn.y>0){hd.copy(hn);hd.y*=.4;hd.normalize();b.v.addScaledVector(hd,j);}else b.v.addScaledVector(hn,j);c.v.addScaledVector(hn,-j/CAR.mass);
 let power=0;
 if(c.hitCD<=0){// extra "shot" impulse, aimed from the car's centre through the ball (flattened), so contact point steers the shot
  const dv=Math.min(124,hd.subVectors(c.v,b.v).length());c.fwd(cf);hd.subVectors(b.p,c.p);hd.y*=.35;hd.addScaledVector(cf,-.35*hd.dot(cf)).normalize();
  power=dv*hitScale(dv)*(c.dodging>0?1.3:1)*(b.charge&&b.cteam===c.team?1.3:1);b.v.addScaledVector(hd,power);c.hitCD=.1;
  b.w.addScaledVector(cw.crossVectors(hn,vr).multiplyScalar(-.05),1);}
 const sp=b.v.length();if(sp>130)b.v.multiplyScalar(130/sp);
 ev&&ev('hit',c,-vn,cp,hn,power);return true;}

/* ================= car vs car (capsules along each car's length) ================= */
const dd=new V(),a0=new V(),a1=new V(),b0=new V(),b1=new V(),qa=new V(),qb=new V(),d1=new V(),d2=new V(),r0=new V();
function closest(p1,q1,p2,q2){d1.subVectors(q1,p1);d2.subVectors(q2,p2);r0.subVectors(p1,p2);const a=d1.dot(d1),e=d2.dot(d2),f=d2.dot(r0),c=d1.dot(r0),b=d1.dot(d2),den=a*e-b*b;
 let s=den>1e-6?cl((b*f-c*e)/den,0,1):0,t=(b*s+f)/e;if(t<0){t=0;s=cl(-c/a,0,1);}else if(t>1){t=1;s=cl((b-c)/a,0,1);}
 qa.copy(p1).addScaledVector(d1,s);qb.copy(p2).addScaledVector(d2,t);}
export function carCar(a,b,ev){
 if(a.demoT>0||b.demoT>0)return;if(a.p.distanceToSquared(b.p)>36)return;
 a.fwd(cf);a0.copy(a.p).addScaledVector(cf,-CAR.len);a1.copy(a.p).addScaledVector(cf,CAR.len);b.fwd(cf);b0.copy(b.p).addScaledVector(cf,-CAR.len);b1.copy(b.p).addScaledVector(cf,CAR.len);
 closest(a0,a1,b0,b1);dd.subVectors(qb,qa);const dist=dd.length(),R2=CAR.r*2;if(dist>=R2)return;if(dist<1e-5)dd.subVectors(b.p,a.p).normalize();else dd.divideScalar(dist);
 const ov=R2-dist;a.p.addScaledVector(dd,-ov/2);b.p.addScaledVector(dd,ov/2);
 const va=a.v.dot(dd),vb=b.v.dot(dd),rel=va-vb;if(rel<=0)return;
 if(a.team!==b.team){
  if(a.super&&va>18&&a.fwd(cf).dot(dd)>.45){ev&&ev('demo',a,b);return;}
  if(b.super&&-vb>18&&b.fwd(cf).dot(dd)<-.45){ev&&ev('demo',b,a);return;}}
 const j=1.3*rel/2;a.v.addScaledVector(dd,-j);b.v.addScaledVector(dd,j);
 if(rel>16){const att=va>-vb?a:b,vic=att===a?b:a,sgn=att===a?1:-1;vic.v.addScaledVector(dd,sgn*rel*.35);vic.v.y+=rel*.18;vic.ground=false;vic.jumpT=0;vic.airT=2;ev&&ev('bump',att,vic,rel);}}

/* ================= boost pads, kickoff + respawn spots ================= */
const SMALL=[[0,-4240],[-1792,-4184],[1792,-4184],[-940,-3308],[940,-3308],[0,-2816],[-3584,-2484],[3584,-2484],[-1788,-2300],[1788,-2300],[-2048,-1036],[0,-1024],[2048,-1036],[-1024,0],[1024,0],[-2048,1036],[0,1024],[2048,1036],[-1788,2300],[1788,2300],[-3584,2484],[3584,2484],[0,2816],[-940,3310],[940,3308],[-1792,4184],[1792,4184],[0,4240]];
const BIG=[[-3072,-4096],[3072,-4096],[-3584,0],[3584,0],[-3072,4096],[3072,4096]];
const sx=(W-4)/4096,sz=(L-4)/5120;
export const makePads=()=>[...BIG.map(p=>({x:p[0]*sx,z:p[1]*sz,big:true,t:0})),...SMALL.map(p=>({x:p[0]*(W-6)/4096,z:p[1]*(L-6)/5120,big:false,t:0}))];
export function padPickup(pads,c,dt,ev){for(const p of pads){if(p.t>0)continue;const dx=c.p.x-p.x,dz=c.p.z-p.z,r=p.big?3.4:2.5;if(dx*dx+dz*dz<r*r&&c.p.y<4.5&&c.boost<100&&c.demoT<=0){c.boost=Math.min(100,c.boost+(p.big?100:12));p.t=p.big?10:4;ev&&ev('pad',c,p);}}}
// kickoff spots (for the team defending -z); the other team is mirrored through the centre
export const KICK=[[-W*.5,-L*.5],[W*.5,-L*.5],[-W*.07,-L*.75],[W*.07,-L*.75],[0,-L*.9]];
export const RESPAWN=[[-W*.38,-L*.92],[W*.38,-L*.92],[-W*.2,-L*.93],[W*.2,-L*.93]];
