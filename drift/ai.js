// SIDEWAYS — CPU drivers.
// Lead: the tandem lead car. A kinematic "pro" that follows the track at a curvature-derived speed profile with
// a scripted drift angle (entry flick, held angle through the corner, straighten on exit) and rubber-bands to the player.
// Bot: an autopilot that drives the real physics car (attract mode / tests).
import {sdiff,frame,nearest} from './trackdata.js';
const cl=(v,a,b)=>v<a?a:v>b?b:v;

export class Lead{
 constructor(B,diff){this.B=B;this.diff=diff;this.kinematic=true;const n=B.n,st=B.step;
  // look-ahead curvature -> target speed + angle
  const vt=new Float32Array(n),ang=new Float32Array(n),lat=new Float32Array(n);const aLat=7.2*diff.pace,vmax=34*diff.pace;
  for(let i=0;i<n;i++){let k=0;for(let j=-4;j<=10;j++)k=Math.max(k,Math.abs(B.curv[(i+j+n)%n]));vt[i]=Math.min(vmax,Math.sqrt(aLat/Math.max(k,1e-4)));}
  for(let p=0;p<2;p++)for(let i=n-1;i>=0;i--){const nx=vt[(i+1)%n];vt[i]=Math.min(vt[i],Math.sqrt(nx*nx+2*5.5*st));}
  for(let i=0;i<n;i++){let c=0,w=0;for(let j=-6;j<=22;j++){const f=1-Math.abs(j-8)/16;c+=B.curv[(i+j+n)%n]*f;w+=f;}c/=w;const a=cl(Math.abs(c)*1600,0,46)*diff.angle;ang[i]=Math.abs(c)>.006?Math.sign(c)*Math.max(18,a):0;
   let c2=0;for(let j=6;j<=26;j++)c2+=B.curv[(i+j)%n];lat[i]=cl(-c2/20*900,-1,1)*B.hw[i]*.42;}
  for(let p=0;p<3;p++){const a=ang.slice(),l=lat.slice();for(let i=0;i<n;i++){ang[i]=(a[(i-2+n)%n]+a[(i-1+n)%n]+a[i]+a[(i+1)%n]+a[(i+2)%n])/5;lat[i]=(l[(i-3+n)%n]+l[i]+l[(i+3)%n])/3;}}
  this.vt=vt;this.ang=ang;this.lat=lat;this.reset(0);}
 reset(s){this.s=s;this.v=0;this.l=0;this.a=0;this.yaw=0;this.x=0;this.z=0;this.y=0;this.vx=0;this.vz=0;this.beta=0;this.wait=true;this.wheelRot=0;this.steer=0;this.pose(0);}
 idx(){return Math.floor(this.s/this.B.step)%this.B.n;}
 pose(dt){const B=this.B,n=B.n,f=this.s/B.step,i=Math.floor(f)%n,j=(i+1)%n,t=f-Math.floor(f);
  const cx=B.x[i]+(B.x[j]-B.x[i])*t,cz=B.z[i]+(B.z[j]-B.z[i])*t,nx=B.nx[i],nz=B.nz[i],tx=B.tx[i],tz=B.tz[i];
  const x=cx+nx*this.l,z=cz+nz*this.l;if(dt>0){this.vx=(x-this.x)/dt;this.vz=(z-this.z)/dt;}this.x=x;this.z=z;this.y=B.y[i]+(B.y[j]-B.y[i])*t;
  const head=Math.atan2(tx,tz);this.yaw=head+this.a*Math.PI/180;this.beta=-this.a*Math.PI/180;this.i=i;}
 // playerS: player's track progress; returns nothing. Rubber band keeps a sensible gap.
 update(dt,playerS,go,pv=99){const B=this.B,i=this.idx();if(!go){this.v=0;this.pose(0);return;}
  const gap=playerS==null?this.diff.gap:sdiff(B,this.s,playerS);let tv=this.vt[i];
  if(this.wait&&gap>this.diff.gap*1.6)tv=0;else this.wait=false;
  if(gap>this.diff.gap*3.2)tv=Math.min(tv,Math.max(5,pv*.8));else if(gap>this.diff.gap*2)tv=Math.min(tv*.85,Math.max(8,pv*1.05));else if(gap<this.diff.gap*.5)tv*=1.12;
  this.v+=cl(tv-this.v,-7*dt,5*dt);this.s=(this.s+this.v*dt)%B.len;
  const ta=this.v>8?this.ang[i]:0;this.a+=cl(ta-this.a,-70*dt,70*dt);this.l+=cl(this.lat[i]-this.l,-3*dt,3*dt);
  this.steer=cl(-this.a/40,-1,1);this.wheelRot+=this.v*dt/.32;this.pose(dt);}
 // track another car at a fixed distance behind it (showcase / autopilot tandem)
 follow(dt,s,v){const B=this.B;let d=s-this.s;while(d>B.len/2)d-=B.len;while(d<-B.len/2)d+=B.len;this.v=Math.max(0,v+d*.8);this.s=(this.s+this.v*dt+B.len)%B.len;const i=this.idx();
  const ta=this.v>8?this.ang[i]:0;this.a+=cl(ta-this.a,-70*dt,70*dt);this.l+=cl(this.lat[i]-this.l,-3*dt,3*dt);this.steer=cl(-this.a/40,-1,1);this.wheelRot+=this.v*dt/.32;this.pose(dt);}
}

// Autopilot for the physics car: pure-pursuit with throttle-steered drift through corners
export class Bot{constructor(B){this.B=B;this.hbT=0;}
 drive(c,dt){const B=this.B,n=B.n,i=c.i<0?nearest(B,c.x,c.z):c.i,v=c.speed;
  const look=Math.round((9+v*.55)/B.step),k=(i+look)%n;const tx=B.x[k]-c.x,tz=B.z[k]-c.z;
  const fwdx=Math.sin(c.yaw),fwdz=Math.cos(c.yaw);const vh=Math.atan2(c.vx,c.vz);// velocity heading
  const want=Math.atan2(tx,tz);let err=want-(v>4?vh:c.yaw);while(err>Math.PI)err-=2*Math.PI;while(err<-Math.PI)err+=2*Math.PI;
  let curv=0;for(let j=4;j<40;j++)curv+=B.curv[(i+j)%n];curv/=36;
  const vt=Math.min(30,Math.sqrt(8.5/Math.max(Math.abs(curv),1e-3)));
  const k2=c.ctrl;k2.steer=cl(err*2.2,-1,1);k2.hb=0;k2.clutch=0;
  // drift: aim for a body angle into the corner by modulating throttle
  const tb=Math.abs(curv)>.008?cl(Math.abs(curv)*1500,15,40)*Math.PI/180:0,ab=Math.abs(c.beta);
  if(tb>0){k2.thr=cl(.55+(tb-ab)*3,0,1);k2.brk=v>vt+6?.4:0;if(ab<.1&&v>12&&this.hbT<=0){this.hbT=.25;}}
  else{k2.thr=v<vt?1:.3;k2.brk=v>vt+5?.6:0;}
  if(this.hbT>0){this.hbT-=dt;k2.hb=1;k2.thr=.3;}
  // counter-steer when the tail is out
  if(ab>.15&&v>6)k2.steer=cl(k2.steer*.5+c.beta*.9,-1,1);
  c.ctrl.steer=k2.steer;}}
