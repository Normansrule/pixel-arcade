// COURT KINGS — court geometry (regulation metres), ball flight with rim / backboard / net / floor contact, shot solver.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
// L/W half length/width · RH rim height · RR rim radius · BR ball radius · HIN rim centre from baseline · BIN board face from baseline
// BBW/BBH board size · BBY board bottom · TR three radius · TC corner three offset · KW key width · FTX free-throw line from baseline
export const C={L:14.33,W:7.62,RH:3.05,RR:.2286,BR:.121,HIN:1.6,BIN:1.22,BBW:1.83,BBH:1.07,BBY:2.9,TR:7.24,TC:6.71,KW:4.88,FTX:5.79,G:9.81,CR:1.83};
export const CT={half:false,hoops:[],xmin:-C.L,xmax:C.L};
export function setCourt(half){CT.half=half;const h=s=>({x:s*(C.L-C.HIN),s,y:C.RH,bx:s*(C.L-C.BIN),flex:0,swish:0});CT.hoops=half?[h(1)]:[h(1),h(-1)];CT.xmin=half?0:-C.L;CT.xmax=C.L;}
setCourt(false);
// team 0 attacks +x, team 1 attacks -x; on the half court both attack the one hoop
export const hoopOf=t=>CT.half?CT.hoops[0]:CT.hoops[t];
export const inBounds=(x,z,m=0)=>x>CT.xmin+m&&x<CT.xmax-m&&Math.abs(z)<C.W-m;
// is (x,z) behind the three-point line for hoop h
export const isThree=(h,x,z)=>Math.abs(z)>=C.TC||Math.hypot(x-h.x,z)>=C.TR;
export class Ball{constructor(){this.p=new V(0,1,0);this.v=new V();this.q=new THREE.Quaternion();this.owner=null;this.shot=null;this.pass=null;this.hp=new V(0,1,0);this.last=null;this.lastTeam=-1;this.rimmed=false;this.air=0;this.floorT=0;}
 reset(){this.p.set(0,1,0);this.v.set(0,0,0);this.owner=null;this.shot=null;this.pass=null;this.last=null;this.rimmed=false;}}
const tq=new THREE.Quaternion(),ax=new V();
// advance a free ball; ev(kind, a, b) reports 'floor' speed, 'rim' speed+hoop, 'board' speed+hoop, 'score' hoop
export function stepBall(b,dt,ev,ghost=false){if(b.owner)return;const n=Math.max(1,Math.ceil(dt/(1/240))),h=dt/n,R=C.BR;
 for(let s=0;s<n;s++){const p=b.p,v=b.v,py=p.y;v.y-=C.G*h;p.x+=v.x*h;p.y+=v.y*h;p.z+=v.z*h;
  for(const H of CT.hoops){const dx=p.x-H.x,dz=p.z,hd=Math.hypot(dx,dz);
   if(Math.abs(p.y-C.RH)<.5&&hd<C.RR+.4){
    // rim: thin torus at RH
    const ux=hd>1e-4?dx/hd:1,uz=hd>1e-4?dz/hd:0,qx=H.x+ux*C.RR,qz=uz*C.RR,ex=p.x-qx,ey=p.y-C.RH,ez=p.z-qz,d=Math.hypot(ex,ey,ez),rr=R+.011;
    if(d<rr){const nx=ex/d,ny=ey/d,nz=ez/d;p.x+=nx*(rr-d);p.y+=ny*(rr-d);p.z+=nz*(rr-d);const vn=v.x*nx+v.y*ny+v.z*nz;
     if(vn<0){const sp=-vn;v.x-=(1.55)*vn*nx;v.y-=(1.55)*vn*ny;v.z-=(1.55)*vn*nz;v.multiplyScalar(.86);b.rimmed=true;if(!ghost)H.flex=Math.min(1,H.flex+sp*.12);ev('rim',sp,H);}}
    // net drag: the ball slows and centres while inside the cords
    if(hd<C.RR+.03&&p.y<C.RH&&p.y>C.RH-.48){const f=Math.min(1,h*7);v.x-=v.x*f;v.z-=v.z*f;v.x+=(H.x-p.x)*h*30;v.z+=-p.z*h*30;if(v.y<-1)v.y*=1-h*1.4;if(!ghost)H.swish=1;}
    // basket: centre crosses the rim plane downward inside the ring
    if(py>C.RH&&p.y<=C.RH&&hd<C.RR-.02)ev('score',H);}
   // backboard box
   const x0=H.s>0?H.bx:H.bx-.05,x1=H.s>0?H.bx+.05:H.bx;
   const cx=Math.max(x0,Math.min(x1,p.x)),cy=Math.max(C.BBY,Math.min(C.BBY+C.BBH,p.y)),cz=Math.max(-C.BBW/2,Math.min(C.BBW/2,p.z));
   const ex=p.x-cx,ey=p.y-cy,ez=p.z-cz,d2=ex*ex+ey*ey+ez*ez;if(d2<R*R){const d=Math.sqrt(d2)||1e-4,nx=d2>1e-8?ex/d:-H.s,ny=d2>1e-8?ey/d:0,nz=d2>1e-8?ez/d:0;p.x+=nx*(R-d);p.y+=ny*(R-d);p.z+=nz*(R-d);
    const vn=v.x*nx+v.y*ny+v.z*nz;if(vn<0){v.x-=1.6*vn*nx;v.y-=1.6*vn*ny;v.z-=1.6*vn*nz;v.multiplyScalar(.9);ev('board',-vn,H);}}}
  if(p.y<R){p.y=R;if(v.y<-.6){const sp=-v.y;v.y=sp*.76;v.x*=.9;v.z*=.9;ev('floor',sp);}else{v.y=0;const f=Math.max(0,1-h*.9);v.x*=f;v.z*=f;b.floorT+=h;}}}
 // spin for the visual: roll on the floor, backspin in the air
 const sp=Math.hypot(b.v.x,b.v.z);if(sp>.05){ax.set(b.v.z,0,-b.v.x).normalize();if(b.p.y>R+.05)ax.negate();tq.setFromAxisAngle(ax,sp/R*dt*(b.p.y>R+.05?.6:1));b.q.premultiply(tq);}}
// launch velocity from p0 to land on t at elevation angle ang (rad); raises the angle if the target is too steep
export function solve(p0,t,ang,out=new V()){const dx=t.x-p0.x,dz=t.z-p0.z,d=Math.hypot(dx,dz)||1e-3,dy=t.y-p0.y;let a=ang;
 for(let i=0;i<20;i++){const lift=d*Math.tan(a)-dy,den=2*Math.cos(a)**2*lift;if(lift>.3+d*.04){const v=Math.sqrt(C.G*d*d/den);return out.set(dx/d*v*Math.cos(a),v*Math.sin(a),dz/d*v*Math.cos(a));}a+=.05;}
 return out.set(dx*1.5,6,dz*1.5);}
// flight time of a solved throw to the horizontal distance
export const flightT=(v,d)=>d/Math.max(.1,Math.hypot(v.x,v.z));
// simulated future positions of a free ball (no players), every `every` seconds for `secs`
const ghost=new Ball();
export function predict(b,secs=2.4,every=.05,out=[]){ghost.p.copy(b.p);ghost.v.copy(b.v);ghost.owner=null;out.length=0;const n=secs/every|0;
 for(let i=0;i<n;i++){stepBall(ghost,every,()=>{},true);out.push({x:ghost.p.x,y:ghost.p.y,z:ghost.p.z,t:(i+1)*every});}return out;}
