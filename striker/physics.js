// STRIKER 11 — pitch dimensions + ball flight (gravity, drag, Magnus curl, bounce, roll), goal frame and net box.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
export const R=.11,G=9.81;
// L half-length (goal lines at z=±L), W half-width (touchlines at x=±W), GW half goal width, GH bar height, GD net depth,
// BD/BW penalty box depth/half-width, SD/SW six-yard box, SPOT penalty spot distance, CR centre circle radius
export const P={};
const FULL={L:52.5,W:34,GW:3.66,GH:2.44,GD:2.1,BD:16.5,BW:20.16,SD:5.5,SW:9.16,SPOT:11,CR:9.15,size:11};
const SMALL={L:30,W:19,GW:2.6,GH:2.15,GD:1.6,BD:9,BW:10.5,SD:3.5,SW:5.4,SPOT:7.5,CR:5.5,size:5};
export function setPitch(size){Object.assign(P,size===5?SMALL:FULL);}
setPitch(11);
const PR=.065,CD=.0125,MAG=.0042,ROLL=1.9,SUB=1/240;
export class Ball{constructor(){this.p=new V(0,R,0);this.v=new V();this.w=new V();this.q=new THREE.Quaternion();this.owner=null;this.held=null;this.last=null;this.inNet=0;this.prev=new V();this.rot=new V();}
 reset(x=0,z=0){this.p.set(x,R,z);this.v.set(0,0,0);this.w.set(0,0,0);this.owner=null;this.held=null;this.inNet=0;this.prev.copy(this.p);}
 get ground(){return this.p.y<R+.02&&Math.abs(this.v.y)<.6;}}
const t1=new V(),t2=new V(),t3=new V(),dq=new THREE.Quaternion();
function seg(b,ax,ay,az,bx,by,bz,cb){// sphere vs capsule segment (post or bar)
 t1.set(bx-ax,by-ay,bz-az);t2.set(b.p.x-ax,b.p.y-ay,b.p.z-az);const t=Math.max(0,Math.min(1,t2.dot(t1)/t1.lengthSq()));t3.set(ax+t1.x*t,ay+t1.y*t,az+t1.z*t);t2.subVectors(b.p,t3);const d=t2.length();
 if(d<R+PR&&d>1e-6){t2.divideScalar(d);b.p.copy(t3).addScaledVector(t2,R+PR);const vn=b.v.dot(t2);if(vn<0){b.v.addScaledVector(t2,-1.72*vn);b.w.multiplyScalar(.5);cb&&cb('post',-vn,b.p);}}}
export function stepBall(b,dt,cb){
 if(b.owner||b.held){spinVis(b,dt);return;}
 const n=Math.max(1,Math.ceil(dt/SUB)),h=dt/n;
 for(let i=0;i<n;i++){b.prev.copy(b.p);const air=b.p.y>R+.004||b.v.y>.25;
  if(air){const sp=b.v.length();t1.crossVectors(b.w,b.v);b.v.x+=(-CD*sp*b.v.x+MAG*t1.x)*h;b.v.y+=(-G-CD*sp*b.v.y+MAG*t1.y)*h;b.v.z+=(-CD*sp*b.v.z+MAG*t1.z)*h;b.w.multiplyScalar(Math.exp(-.35*h));}
  else{b.p.y=R;if(b.v.y<0)b.v.y=0;const s=Math.hypot(b.v.x,b.v.z);if(s>1e-4){t1.crossVectors(b.w,b.v);const ns=Math.max(0,s-(ROLL+.012*s*s)*h)/s;b.v.x=b.v.x*ns+MAG*.35*t1.x*h;b.v.z=b.v.z*ns+MAG*.35*t1.z*h;}b.w.multiplyScalar(Math.exp(-2.5*h));}
  b.p.addScaledVector(b.v,h);
  if(b.p.y<R){b.p.y=R;if(b.v.y<-1.1){cb&&cb('bounce',-b.v.y,b.p);b.v.y=-b.v.y*.52;b.v.x*=.86;b.v.z*=.86;b.w.multiplyScalar(.6);}else b.v.y=0;}
  if(Math.abs(Math.abs(b.p.z)-P.L)<1.2&&Math.abs(b.p.x)<P.GW+1)for(const s of[-1,1]){const z=s*P.L;if(Math.abs(b.p.z-z)>1.2)continue;
   seg(b,-P.GW,0,z,-P.GW,P.GH,z,cb);seg(b,P.GW,0,z,P.GW,P.GH,z,cb);seg(b,-P.GW,P.GH,z,P.GW,P.GH,z,cb);}
  net(b,cb);}
 spinVis(b,dt);}
// the goal's net box: soft, absorbing walls from inside; side/roof netting also stops balls from outside
function net(b,cb){const s=Math.sign(b.p.z),az=Math.abs(b.p.z),L=P.L;
 if(!b.inNet&&Math.abs(b.prev.z)<=L&&az>L&&Math.abs(b.p.x)<P.GW&&b.p.y<P.GH)b.inNet=s;
 if(b.inNet){const S=b.inNet,lim=P.GW-R,top=P.GH-R-.02,back=L+P.GD-R;let hit=0;
  if(Math.abs(b.p.x)>lim){b.p.x=Math.sign(b.p.x)*lim;hit=Math.max(hit,Math.abs(b.v.x));b.v.x*=-.12;b.v.z*=.6;b.v.y*=.7;}
  if(b.p.y>top){b.p.y=top;hit=Math.max(hit,Math.abs(b.v.y));b.v.y=-Math.abs(b.v.y)*.1;b.v.x*=.6;b.v.z*=.6;}
  if(S*b.p.z>back){b.p.z=S*back;hit=Math.max(hit,Math.abs(b.v.z));b.v.z=-S*Math.abs(b.v.z)*.14;b.v.x*=.55;b.v.y*=.55;b.w.multiplyScalar(.3);}
  if(S*b.p.z<L-R&&b.v.z*S<0){/* bounced back out across the line: let it leave */b.inNet=0;}
  if(hit>1.5&&cb)cb('net',hit,b.p);return;}
 if(az>L&&az<L+P.GD+R&&b.p.y<P.GH+R&&Math.abs(b.p.x)<P.GW+R){const pa=Math.abs(b.prev.x),pz=Math.abs(b.prev.z);
  if(b.prev.y>=P.GH+R-.01){b.p.y=P.GH+R;b.v.y=Math.abs(b.v.y)*.15;b.v.x*=.7;b.v.z*=.7;cb&&cb('net',2,b.p);}
  else if(pa>=P.GW+R-.01){b.p.x=Math.sign(b.p.x)*(P.GW+R);b.v.x*=-.15;b.v.z*=.6;cb&&cb('net',Math.abs(b.v.z)+1,b.p);}
  else if(pz>=L+P.GD){b.p.z=s*(L+P.GD+R);b.v.z*=-.15;cb&&cb('net',2,b.p);}}}
function spinVis(b,dt){// rolling: angular velocity from ground speed; airborne: the actual spin + carried roll
 if(b.ground||b.owner){b.rot.set(b.v.z,0,-b.v.x).divideScalar(R);}else b.rot.lerp(b.w,1-Math.exp(-dt*1.5));
 const a=b.rot.length()*dt;if(a>1e-5){dq.setFromAxisAngle(t3.copy(b.rot).normalize(),a);b.q.premultiply(dq);}}
// trajectory prediction (no players, no frame): fills out[] with {x,y,z,t} every `every` seconds
export function predict(b,T,every,out){out.length=0;const p=b.p.clone(),v=b.v.clone(),w=b.w.clone();let t=0,acc=0;const h=1/60;out.push({x:p.x,y:p.y,z:p.z,t:0,vx:v.x,vz:v.z});
 while(t<T){const air=p.y>R+.004||v.y>.25;if(air){const sp=v.length();t1.crossVectors(w,v);v.x+=(-CD*sp*v.x+MAG*t1.x)*h;v.y+=(-G-CD*sp*v.y+MAG*t1.y)*h;v.z+=(-CD*sp*v.z+MAG*t1.z)*h;}
  else{p.y=R;if(v.y<0)v.y=0;const s=Math.hypot(v.x,v.z);if(s>1e-4){const ns=Math.max(0,s-(ROLL+.012*s*s)*h)/s;v.x*=ns;v.z*=ns;}}
  p.addScaledVector(v,h);if(p.y<R){p.y=R;if(v.y<-1.1){v.y=-v.y*.52;v.x*=.86;v.z*=.86;}else v.y=0;}
  t+=h;acc+=h;if(acc>=every-1e-6){acc=0;out.push({x:p.x,y:p.y,z:p.z,t,vx:v.x,vz:v.z});}}return out;}
// where (if) the ball crosses the goal plane z=s*L within T seconds: {x,y,t} or null
export function crossing(b,s,T=2.2,z0=s*P.L){const p=b.p.clone(),v=b.v.clone(),w=b.w.clone();const h=1/120;let t=0;
 if((p.z-z0)*s>0)return null;
 while(t<T){const air=p.y>R+.004||v.y>.25;if(air){const sp=v.length();t1.crossVectors(w,v);v.x+=(-CD*sp*v.x+MAG*t1.x)*h;v.y+=(-G-CD*sp*v.y+MAG*t1.y)*h;v.z+=(-CD*sp*v.z+MAG*t1.z)*h;}
  else{const s2=Math.hypot(v.x,v.z);if(s2>1e-4){const ns=Math.max(0,s2-(ROLL+.012*s2*s2)*h)/s2;v.x*=ns;v.z*=ns;}if(s2<.5)return null;}
  p.addScaledVector(v,h);if(p.y<R){p.y=R;if(v.y<-1.1){v.y=-v.y*.52;v.x*=.86;v.z*=.86;}else v.y=0;}t+=h;
  if((p.z-z0)*s>=0)return{x:p.x,y:p.y,t,speed:v.length()};}return null;}
// ground pass speed so the ball arrives at distance d with speed `end`
export function passSpeed(d,end=5){const k=.012;return Math.sqrt(((ROLL+k*end*end)*Math.exp(2*k*d)-ROLL)/k)*1.02;}
// launch velocity for a lofted ball that lands at horizontal distance d after time T (drag-compensated)
export function loftVel(dx,dz,T,h0=R,h1=R){const d=Math.hypot(dx,dz),k=1+CD*d/T*.55;return new V(dx/T*k,(h1-h0)/T+G*T/2*(1+CD*d/T*.25),dz/T*k);}
