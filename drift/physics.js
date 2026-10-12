// SIDEWAYS — rear-wheel-drive car physics.
// Planar 4-wheel model at 480 Hz: combined-slip tyre curves (slip angle + slip ratio on a friction ellipse),
// load sensitivity, filtered longitudinal/lateral weight transfer, locked rear differential, slipping clutch
// (so a clutch kick dumps the flywheel into the rear tyres), turbo spool, gearbox with auto/manual shifting,
// handbrake, counter-steer assist, slope gravity, rigid-body wall impulses.
import {frame} from './trackdata.js';

export const G=9.81,SUB=4,TICK=1/120,DTS=TICK/SUB;
const cl=(v,a,b)=>v<a?a:v>b?b:v,sgn=v=>v<0?-1:1,TAU=Math.PI*2;
// normalised combined-slip curve: peaks at s=1 with 1.0, slides at ~.8
function MF(s){return Math.sin(1.5*Math.atan(1.73*s));}

// spec (data.js car) + owned state (upgrades / tune) -> physical parameters
export function buildParams(spec,own){const u=own.up,t=own.tune;
 const p={mass:spec.mass-u.weight*45,wb:spec.wb,fr:spec.fr,tw:spec.tw,h:spec.h,R:.32};
 p.a=p.wb*(1-p.fr);p.b=p.wb*p.fr;// a = CG->front axle, b = CG->rear axle (fr = front weight share)
 p.Iz=p.mass*(p.a*p.a+p.b*p.b)*.62;
 p.T=spec.torque*(1+u.engine*.13);p.boostMax=spec.boost+u.turbo*.16;p.peak=spec.peak;p.red=spec.red;p.idle=900;
 p.gears=spec.gears;p.final=t.final;p.Ie=.2;p.IwR=2.4;p.IwF=1.7;
 p.maxSteer=t.steer*Math.PI/180;
 const comp=1+u.tires*.05;
 p.muF=spec.mu*comp*(1-(t.psiF-30)*.008)*(1+t.camF*.012);
 p.muR=spec.mu*comp*(1-(t.psiR-30)*.011)*(1-t.camR*.014);
 p.apF=.15*(1-(t.psiF-30)*.012);p.apR=.14*(1-(t.psiR-30)*.014);p.sp=.11;
 p.stiff=cl(t.stiff*(1+u.susp*.05),0,1.2);p.latK=8+p.stiff*16;p.rollFront=.5+(t.stiff-.5)*.08;
 p.brake=3800;p.hb=4200;p.drag=.38;
 return p;}

export class Car{
 constructor(p){this.p=p;this.reset(0,0,0,0);this.ctrl={thr:0,brk:0,steer:0,hb:0,clutch:0,up:0,dn:0};this.auto=true;this.assist=.6;}
 reset(x,z,yaw,y=0){Object.assign(this,{x,z,y,yaw,vx:0,vz:0,r:0,wF:0,wR:0,we:this.p.idle*TAU/60,gear:1,shiftT:0,boost:0,ax:0,ay:0,steerA:0,
  slipR:0,slipF:0,beta:0,speed:0,u:0,w:0,i:-1,limT:0,revT:0,lift:0,pitch:0,roll:0,hit:null,bovT:0,events:[],wheel:[0,0,0,0],load:[0,0,0,0],rpm:900,pgx:0,pgz:0,clutchE:1,thrLast:0});}
 get kmh(){return this.speed*3.6;}
 ratio(){const g=this.gear;return g<0?-3.3*this.p.final:g===0?0:this.p.gears[g-1]*this.p.final;}
 engTorque(rpm,thr){const p=this.p;let f;if(rpm<p.peak)f=.55+.45*Math.sin(Math.PI/2*cl((rpm-1000)/(p.peak-1000),0,1));else f=1-.24*((rpm-p.peak)/(p.red-p.peak))**2;
  const drive=thr*f*p.T*(1+this.boost),eb=(1-thr)*p.T*(.05+.13*rpm/p.red);return drive-eb;}
}

const fw={x:0,z:0},le={x:0,z:0},Fr={};
// one fixed 1/120 s tick (SUB substeps). world: {B (ribbon track) | lot}
export function stepCar(c,world,dt=TICK){const p=c.p,k=c.ctrl;c.events.length=0;c.hit=null;
 // ---- gearbox (once per tick) ----
 const rpm0=c.we*60/TAU;
 if(c.shiftT>0)c.shiftT-=dt;
 if(c.auto){
  if(c.gear>0&&c.u<1.2&&k.brk>.5&&k.thr<.1&&c.speed<1.2){c.revT+=dt;if(c.revT>.35){c.gear=-1;c.revT=0;}}else if(c.gear<0&&k.brk>.5&&k.thr<.1){/* reverse throttle */}else c.revT=0;
  if(c.gear<0&&k.thr>.3&&c.u>-1.2){c.gear=1;}
  if(c.gear>0&&c.shiftT<=0){const road=g=>c.speed/p.R*p.gears[g-1]*p.final*60/TAU,sliding=Math.abs(c.beta)>.22;
   if(rpm0>p.red*.965)c.limT+=dt;else c.limT=0;
   if(c.gear<p.gears.length&&rpm0>p.red*.955&&road(c.gear)>p.red*(sliding?.9:.8))shift(c,1);
   else if(c.gear>1&&road(c.gear)<p.red*.4&&road(c.gear-1)<p.red*.8&&((k.thr>.2&&!sliding)||k.brk>.2))shift(c,-1);}
 }else{if(k.up){k.up=0;if(c.gear<p.gears.length)shift(c,c.gear<0?1:1);}if(k.dn){k.dn=0;if(c.gear>1)shift(c,-1);else if(c.gear===1&&c.speed<2)c.gear=-1;}}
 // in reverse the pedals swap (brake = go backwards)
 let thr=k.thr,brk=k.brk;if(c.gear<0){thr=k.brk;brk=k.thr;}
 if(c.shiftT>0)thr=0;
 // lift-off pops + blow-off valve
 if(c.thrLast>.6&&thr<.15){if(rpm0>4300)c.events.push(['pop',rpm0/p.red]);if(c.boost>.15)c.events.push(['bov',c.boost/p.boostMax]);}
 c.thrLast=thr;
 // turbo spool (lags, needs revs)
 const bt=p.boostMax*thr*cl((rpm0-2400)/2800,0,1);c.boost+=(bt-c.boost)*Math.min(1,dt*(bt>c.boost?1.6:5));
 // steering: player input + counter-steer assist, speed-sensitive when gripping
 const v=Math.hypot(c.vx,c.vz),slide=cl((Math.abs(c.beta)-.06)/.2,0,1),sens=1/(1+(v*v/900)*(1-slide)*1.3);
 const want=cl(k.steer*p.maxSteer*sens+(v>2.5?c.assist*cl(c.beta,-p.maxSteer,p.maxSteer)*.92:0),-p.maxSteer,p.maxSteer);
 c.steerA+=cl(want-c.steerA,-dt*6.5,dt*6.5);
 const clutchIn=k.clutch>.5||k.hb>.5||c.shiftT>0||c.gear===0;
 for(let s=0;s<SUB;s++)sub(c,world,DTS,thr,brk,clutchIn);
 // limiter bounce + pops
 c.rpm=c.we*60/TAU;if(c.rpm>p.red*1.005&&Math.random()<.08)c.events.push(['pop',.6]);
 collide(c,world);
 // visual body pitch/roll from weight transfer
 c.pitch+=(cl(-c.ax*.006,-.06,.06)-c.pitch)*Math.min(1,dt*8);c.roll+=(cl(c.ay*.007*(1.2-p.stiff*.5),-.08,.08)-c.roll)*Math.min(1,dt*8);}

function shift(c,d){c.gear+=d;c.shiftT=d>0?.13:.16;if(d>0&&c.rpm>c.p.red*.8)c.events.push(['pop',1]);c.events.push(['shift',d]);}

function tyre(mu,Fz,ap,sp,sx,sy,out){// sx = slip ratio, sy = tan(slip angle); returns forces along wheel x (long) / y (lat)
 const nx=sx/sp,ny=sy/Math.tan(ap),s=Math.hypot(nx,ny);if(s<1e-6){out.x=0;out.y=0;return;}const F=mu*Fz*MF(s)/s;out.x=F*nx;out.y=-F*ny;}

const T1={},T2={};
function sub(c,world,dt,thr,brk,clutchIn){const p=c.p,k=c.ctrl;
 const sy=Math.sin(c.yaw),cy=Math.cos(c.yaw);fw.x=sy;fw.z=cy;le.x=cy;le.z=-sy;
 const u=c.vx*fw.x+c.vz*fw.z,w=c.vx*le.x+c.vz*le.z;c.u=u;c.w=w;c.speed=Math.hypot(u,w);
 c.beta=c.speed>3?Math.atan2(w,Math.abs(u)):c.beta*.98;
 // loads (weight transfer filtered by suspension stiffness)
 const m=p.mass,L=p.wb,gF=m*G*p.b/L,gR=m*G*p.a/L,lon=m*c.ax*p.h/L,lat=m*c.ay*p.h/p.tw;
 const fA=gF-lon,rA=gR+lon,fs=p.rollFront;
 const Fz=c.load;Fz[0]=Math.max(80,fA/2-lat*fs);Fz[1]=Math.max(80,fA/2+lat*fs);Fz[2]=Math.max(80,rA/2-lat*(1-fs));Fz[3]=Math.max(80,rA/2+lat*(1-fs));
 const Fz0=m*G/4;
 // wheels: 0 FL,1 FR,2 RL,3 RR ; positions (forward, left)
 const d=c.steerA,cd=Math.cos(d),sd=Math.sin(d);let FX=0,FY=0,MZ=0;
 // engine / clutch
 const ratio=c.ratio(),R=p.R;
 // axle slip derivative (implicit wheel integration): evaluate tyre force at w and w+eps
 for(let ax=0;ax<2;ax++){const front=ax===0,px=front?p.a:-p.b,mu=front?p.muF:p.muR,ap=front?p.apF:p.apR,I=front?p.IwF:p.IwR;
  let wv=front?c.wF:c.wR;
  // wheel-frame velocities for both wheels of the axle
  const vl=[];for(let side=0;side<2;side++){const py=side===0?p.tw/2:-p.tw/2;const ux=u-c.r*py,uy=w+c.r*px;
   const wx=front?ux*cd+uy*sd:ux,wy=front?-ux*sd+uy*cd:uy;vl.push([wx,wy,py]);}
  const forces=(om,o)=>{let fx=0;for(let side=0;side<2;side++){const[wx,wy]=vl[side],den=Math.max(Math.abs(wx),2.5),idx=ax*2+side;const fz=Fz[idx],mul=mu*(1-.09*(fz/Fz0-1));
   tyre(mul,fz,ap,p.sp,(om*R-wx)/den,wy/den,o[side]||(o[side]={}));fx+=o[side].x;}return fx;};
  const o0=[{},{}],o1=[{},{}];const f0=forces(wv,o0),eps=.05,f1=forces(wv+eps,o1),kk=Math.max(0,(f1-f0)/eps);
  // torques on the axle (except brakes)
  let Td=0;
  if(!front){if(!clutchIn&&ratio!==0){const Ieff=I+dt*kk*R*R/1;// effective axle inertia incl. tyre stiffness
    const slow=Math.abs(wv*ratio)*60/TAU<1300,cap=slow?p.T*(.08+thr*1.4):p.T*2.6*(1+p.boostMax);
    const Tl=(c.we-wv*ratio)/(dt*(1/p.Ie+ratio*ratio/Ieff));const Tc=cl(Tl,-cap,cap);c.clutchE=Math.abs(Tl)<=cap?1:.5;
    Td=Tc*ratio*.92;c.we-=Tc/p.Ie*dt;}else c.clutchE=0;}
  const rpm=c.we*60/TAU;let Te=c.engTorque(rpm,thr);if(rpm>p.red*1.01)Te=-p.T*.4;
  if(!front){c.we+=Te/p.Ie*dt;if(c.we<p.idle*TAU/60)c.we+=(p.idle*TAU/60-c.we)*Math.min(1,dt*30);if(c.we>p.red*1.04*TAU/60)c.we=p.red*1.04*TAU/60;}
  const Ieff=I+dt*kk*R*R;let wn=wv+dt*(Td-f0*R)/Ieff;
  // brakes (rolling resistance + foot brake + handbrake) as a clamp-to-zero friction torque
  let Tb=.013*(Fz[ax*2]+Fz[ax*2+1])*R+brk*p.brake*(front?.64:.36);if(!front&&k.hb>.5)Tb+=p.hb;
  const imp=Tb*dt/Ieff;wn=Math.abs(wn)<=imp?0:wn-sgn(wn)*imp;
  const fx=f0+kk*(wn-wv);// linearised force consistent with the implicit wheel update
  // lateral forces at the new state (use o0 lateral; scale long to fx)
  const sc=f0!==0?fx/f0:1;
  for(let side=0;side<2;side++){const[wx,wy,py]=vl[side],o=o0[side];let lx=Math.abs(f0)>1?o.x*sc:fx/2,ly=o.y;
   // friction-ellipse guard after the linearisation
   const lim=mu*Fz[ax*2+side]*1.05,mag=Math.hypot(lx,ly);if(mag>lim){lx*=lim/mag;ly*=lim/mag;}
   let cx,cy2;if(front){cx=lx*cd-ly*sd;cy2=lx*sd+ly*cd;}else{cx=lx;cy2=ly;}
   FX+=cx;FY+=cy2;MZ+=px*cy2-py*cx;
   c.wheel[ax*2+side]=Math.hypot(o.x,o.y)/(mu*Fz[ax*2+side]+1);}
  if(front){c.wF=wn;c.slipF=Math.atan2(vl[0][1],Math.max(2.5,Math.abs(vl[0][0])));}else{c.wR=wn;c.slipR=(wn*R-u)/Math.max(Math.abs(u),2.5);}}
 // aero drag + body
 const v=c.speed;FX-=p.drag*u*v;FY-=p.drag*w*v*2;
 const axL=FX/m,ayL=FY/m;
 c.ax+=(axL-c.ax)*Math.min(1,dt*p.latK);c.ay+=(ayL-c.ay)*Math.min(1,dt*p.latK);
 c.vx+=(fw.x*FX+le.x*FY)/m*dt-G*c.pgx*dt;c.vz+=(fw.z*FX+le.z*FY)/m*dt-G*c.pgz*dt;
 // arcade drift help, scaled by the assist slider: a restoring yaw moment past ~55 degrees and a little
 // drive along the velocity while sliding on throttle so long drifts do not bleed all their speed
 const ab=Math.abs(c.beta),hs=.4+c.assist;if(c.speed>4){if(ab>.82)MZ+=(sgn(c.beta)*(ab-.82)*p.Iz*10-c.r*p.Iz*1.2*(ab-.82))*hs;
  if(k.hb>.5&&Math.abs(k.steer)>.25&&c.speed>8&&ab<.7)MZ+=k.steer*p.Iz*1.6*Math.min(1,c.speed/20);}
 if(c.assist>0&&c.speed>4){
  const sl=cl((ab-.15)/.3,0,1)*thr*c.assist;if(sl>0){const vx=c.vx/c.speed,vz=c.vz/c.speed;c.vx+=vx*2.2*sl*dt;c.vz+=vz*2.2*sl*dt;}}
 c.r+=MZ/p.Iz*dt;c.r*=1-dt*.15;
 c.yaw+=c.r*dt;c.x+=c.vx*dt;c.z+=c.vz*dt;
 if(c.speed<.25&&thr<.05&&Math.abs(c.r)<.05){c.vx*=.9;c.vz*=.9;c.r*=.9;}}

/* ---------- collisions ---------- */
const CPTS=[[2.1,.86],[2.1,-.86],[-2.1,.86],[-2.1,-.86],[0,.92],[0,-.92],[1.1,.9],[1.1,-.9],[-1.1,.9],[-1.1,-.9]];
const fr={};
function contactImpulse(c,px,pz,nx,nz,pen,out){// px,pz world contact point; n points away from the obstacle
 c.x+=nx*pen;c.z+=nz*pen;const rx=px-c.x,rz=pz-c.z;const p=c.p;
 const vcx=c.vx+c.r*rz,vcz=c.vz-c.r*rx,vn=vcx*nx+vcz*nz;if(vn>=0)return;
 const rn=rz*nx-rx*nz,e=.18,j=-(1+e)*vn/(1/p.mass+rn*rn/p.Iz);
 c.vx+=j*nx/p.mass;c.vz+=j*nz/p.mass;c.r+=j*rn/p.Iz;
 const tx=-nz,tz=nx,vt=vcx*tx+vcz*tz,rt=rz*tx-rx*tz;let jt=-vt/(1/p.mass+rt*rt/p.Iz);const mx=.35*j;jt=cl(jt,-mx,mx);
 c.vx+=jt*tx/p.mass;c.vz+=jt*tz/p.mass;c.r+=jt*rt/p.Iz;
 if(!out.hit||-vn>out.hit.vn)out.hit={vn:-vn,vt:Math.abs(vt),x:px,z:pz,nx,nz};}
export function collide(c,world){const sy=Math.sin(c.yaw),cy=Math.cos(c.yaw),res={hit:null};
 if(world.B){const B=world.B;frame(B,c.x,c.z,c.i,fr);c.i=fr.i;c.y=fr.y;c.pgx=fr.gx;c.pgz=fr.gz;c.s=fr.s;c.d=fr.d;
  for(const[a,b]of CPTS){const px=c.x+sy*a+cy*b,pz=c.z+cy*a-sy*b;const f=frame(B,px,pz,c.i,{});const i=f.i;
   if(f.d>B.wl[i]){const pen=f.d-B.wl[i];contactImpulse(c,px,pz,-B.nx[i],-B.nz[i],pen,res);}
   else if(f.d<-B.wr[i]){const pen=-B.wr[i]-f.d;contactImpulse(c,px,pz,B.nx[i],B.nz[i],pen,res);}}
  c.wallL=B.wl[c.i]-c.d;c.wallR=B.wr[c.i]+c.d;}
 else if(world.lot){const lot=world.lot;c.y=0;c.pgx=c.pgz=0;
  for(const[a,b]of CPTS){const px=c.x+sy*a+cy*b,pz=c.z+cy*a-sy*b;
   if(px>lot.W)contactImpulse(c,px,pz,-1,0,px-lot.W,res);if(px<-lot.W)contactImpulse(c,px,pz,1,0,-lot.W-px,res);
   if(pz>lot.L)contactImpulse(c,px,pz,0,-1,pz-lot.L,res);if(pz<-lot.L)contactImpulse(c,px,pz,0,1,-lot.L-pz,res);
   for(const o of lot.circles){const dx=px-o.x,dz=pz-o.z,d=Math.hypot(dx,dz);if(d<o.r&&d>1e-4)contactImpulse(c,px,pz,dx/d,dz/d,o.r-d,res);}}
  // circle obstacles vs the car's body box (so poles inside the outline still collide)
  for(const o of lot.circles){const dx=o.x-c.x,dz=o.z-c.z,lx=dx*sy+dz*cy,ly=dx*cy-dz*sy;if(Math.abs(lx)<2.15+o.r&&Math.abs(ly)<.92+o.r){
    const qx=cl(lx,-2.15,2.15),qy=cl(ly,-.92,.92);const ex=lx-qx,ey=ly-qy,dd=Math.hypot(ex,ey);if(dd<o.r){let nx,nz,pen;
     if(dd>1e-4){const wx=(ex*sy+ey*cy)/dd,wz=(ex*cy-ey*sy)/dd;nx=-wx;nz=-wz;pen=o.r-dd;}else{const ox=2.15-Math.abs(lx),oy=.92-Math.abs(ly);if(ox<oy){const s=sgn(lx);nx=-sy*s;nz=-cy*s;pen=ox+o.r;}else{const s=sgn(ly);nx=-cy*s;nz=sy*s;pen=oy+o.r;}}
     contactImpulse(c,o.x+nx*o.r,o.z+nz*o.r,nx,nz,pen,res);}}}
  c.wallL=c.wallR=99;let md=99;for(const[a,b]of[[2.1,.9],[-2.1,.9],[2.1,-.9],[-2.1,-.9]]){const px=c.x+sy*a+cy*b,pz=c.z+cy*a-sy*b;md=Math.min(md,lot.W-Math.abs(px),lot.L-Math.abs(pz));for(const o of lot.circles)md=Math.min(md,Math.hypot(px-o.x,pz-o.z)-o.r);}c.wallL=md;}
 c.hit=res.hit;}

// two cars pushing apart (two circles each); returns impact speed
export function carCar(a,b){let best=0;const R=1.05;
 for(const sa of[1.25,-1.25])for(const sb of[1.25,-1.25]){const ax=a.x+Math.sin(a.yaw)*sa,az=a.z+Math.cos(a.yaw)*sa,bx=b.x+Math.sin(b.yaw)*sb,bz=b.z+Math.cos(b.yaw)*sb;
  const dx=ax-bx,dz=az-bz,d=Math.hypot(dx,dz);if(d<2*R&&d>1e-4){const nx=dx/d,nz=dz/d,pen=2*R-d;const rv=(a.vx-(b.vx||0))*nx+(a.vz-(b.vz||0))*nz;
   const wa=b.kinematic?1:.5;a.x+=nx*pen*wa;a.z+=nz*pen*wa;if(!b.kinematic){b.x-=nx*pen*.5;b.z-=nz*pen*.5;}
   if(rv<0){const j=-(1.2)*rv;a.vx+=nx*j*wa;a.vz+=nz*j*wa;if(!b.kinematic){b.vx-=nx*j*.5;b.vz-=nz*j*.5;}best=Math.max(best,-rv);}}}
 return best;}
