// WILD QUEST — static/dynamic colliders (axis-aligned boxes + vertical cylinders) over the terrain heightfield.
import {heightAt,HALF} from './terrain.js';
const CS=16;
export class Phys{
 constructor(){this.grid=new Map();this.dyn=[];this.all=[];this.seen=0;}
 _cells(x0,z0,x1,z1,f){for(let i=Math.floor(x0/CS);i<=Math.floor(x1/CS);i++)for(let j=Math.floor(z0/CS);j<=Math.floor(z1/CS);j++)f(i*8192+j);}
 _put(o){this._cells(o.x0,o.z0,o.x1,o.z1,k=>{let a=this.grid.get(k);if(!a)this.grid.set(k,a=[]);a.push(o);});}
 // box: x0..x1, y0..y1, z0..z1 ; opts: climb, tag, dyn
 box(x0,y0,z0,x1,y1,z1,o={}){const b={t:'b',x0:Math.min(x0,x1),y0:Math.min(y0,y1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),y1:Math.max(y0,y1),z1:Math.max(z0,z1),climb:o.climb??true,tag:o.tag,on:true,...o};this.all.push(b);if(o.dyn)this.dyn.push(b);else this._put(b);return b;}
 cbox(cx,y0,cz,w,h,d,o){return this.box(cx-w/2,y0,cz-d/2,cx+w/2,y0+h,cz+d/2,o);}
 cyl(x,z,r,y0,y1,o={}){const c={t:'c',x,z,r,y0,y1,x0:x-r,x1:x+r,z0:z-r,z1:z+r,climb:o.climb??false,on:true,...o};this.all.push(c);if(o.dyn)this.dyn.push(c);else this._put(c);return c;}
 move(b,dx,dy,dz){b.x0+=dx;b.x1+=dx;b.y0+=dy;b.y1+=dy;b.z0+=dz;b.z1+=dz;if(b.t==='c'){b.x+=dx;b.z+=dz;}}
 near(x,z,r,out=[]){out.length=0;this.seen++;const s=this.seen;this._cells(x-r,z-r,x+r,z+r,k=>{const a=this.grid.get(k);if(a)for(const o of a){if(o._s===s||!o.on)continue;o._s=s;out.push(o);}});for(const o of this.dyn)if(o.on)out.push(o);return out;}
 terrainOn(x,z){return Math.abs(x)<HALF*3&&Math.abs(z)<HALF*3;}
 // highest support under (x,y,z) reachable with a step of `step`
 ground(x,y,z,r,step=.55,res={h:-1e9,o:null}){res.h=this.terrainOn(x,z)?heightAt(x,z):-1e9;res.o=null;const L=this.near(x,z,r+.5,this._tmp||(this._tmp=[]));
  for(const o of L){if(o.y1>y+step||o.noStand)continue;let inside;if(o.t==='b'){const m=r*.55;inside=x>o.x0-m&&x<o.x1+m&&z>o.z0-m&&z<o.z1+m;}else inside=Math.hypot(x-o.x,z-o.z)<o.r+r*.55;if(inside&&o.y1>res.h){res.h=o.y1;res.o=o;}}return res;}
 ceiling(x,y,z,r,top){let c=1e9;const L=this.near(x,z,r,this._tmp);for(const o of L){if(o.y0<y+.4||o.y0>top+.5)continue;let inside;if(o.t==='b')inside=x>o.x0-r*.3&&x<o.x1+r*.3&&z>o.z0-r*.3&&z<o.z1+r*.3;else inside=Math.hypot(x-o.x,z-o.z)<o.r;if(inside)c=Math.min(c,o.y0);}return c;}
 // push a vertical capsule (feet at p.y, height h) out of colliders; returns last contact {nx,nz,o}
 push(p,r,h,step=.55,hit={o:null,nx:0,nz:0}){hit.o=null;const L=this.near(p.x,p.z,r+.5,this._tmp2||(this._tmp2=[]));
  for(const o of L){if(o.y1<=p.y+step||o.y0>=p.y+h)continue;
   if(o.t==='b'){const cx=Math.max(o.x0,Math.min(p.x,o.x1)),cz=Math.max(o.z0,Math.min(p.z,o.z1));let dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);
    if(d<1e-6){const a=p.x-o.x0,b=o.x1-p.x,c=p.z-o.z0,e=o.z1-p.z,m=Math.min(a,b,c,e);if(m===a){p.x=o.x0-r;dx=-1;dz=0;}else if(m===b){p.x=o.x1+r;dx=1;dz=0;}else if(m===c){p.z=o.z0-r;dx=0;dz=-1;}else{p.z=o.z1+r;dx=0;dz=1;}hit.o=o;hit.nx=dx;hit.nz=dz;continue;}
    if(d<r){p.x=cx+dx/d*r;p.z=cz+dz/d*r;hit.o=o;hit.nx=dx/d;hit.nz=dz/d;}}
   else{const dx=p.x-o.x,dz=p.z-o.z,d=Math.hypot(dx,dz),m=o.r+r;if(d<m&&d>1e-6){p.x=o.x+dx/d*m;p.z=o.z+dz/d*m;hit.o=o;hit.nx=dx/d;hit.nz=dz/d;}}}
  return hit;}
 // ray vs colliders (slab test) -> distance or Infinity
 ray(ox,oy,oz,dx,dy,dz,max,filter){let best=Infinity,bo=null;const mx=ox+dx*max,mz=oz+dz*max;this.seen++;const s=this.seen;
  this._cells(Math.min(ox,mx)-1,Math.min(oz,mz)-1,Math.max(ox,mx)+1,Math.max(oz,mz)+1,k=>{const a=this.grid.get(k);if(a)for(const o of a){if(o._s===s||!o.on)continue;o._s=s;const t=this._rt(o,ox,oy,oz,dx,dy,dz,max);if(t<best&&(!filter||filter(o))){best=t;bo=o;}}});
  for(const o of this.dyn){if(!o.on)continue;const t=this._rt(o,ox,oy,oz,dx,dy,dz,max);if(t<best&&(!filter||filter(o))){best=t;bo=o;}}this.lastHit=bo;return best;}
 _rt(o,ox,oy,oz,dx,dy,dz,max){if(o.t==='b'){let t0=0,t1=max;for(const[a,d,lo,hi]of[[ox,dx,o.x0,o.x1],[oy,dy,o.y0,o.y1],[oz,dz,o.z0,o.z1]]){if(Math.abs(d)<1e-9){if(a<lo||a>hi)return Infinity;continue;}let u=(lo-a)/d,v=(hi-a)/d;if(u>v){const w=u;u=v;v=w;}t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return Infinity;}return t0;}
  // cylinder: 2D circle intersection then y check
  const fx=ox-o.x,fz=oz-o.z,A=dx*dx+dz*dz,B=2*(fx*dx+fz*dz),C=fx*fx+fz*fz-o.r*o.r;if(A<1e-9)return Infinity;const D=B*B-4*A*C;if(D<0)return Infinity;const t=(-B-Math.sqrt(D))/(2*A);if(t<0||t>max)return Infinity;const y=oy+dy*t;return y>=o.y0&&y<=o.y1?t:Infinity;}
 terrainRay(ox,oy,oz,dx,dy,dz,max,stepLen=.5){if(!this.terrainOn(ox,oz))return Infinity;let prev=0;for(let t=stepLen;t<=max;t+=stepLen){const x=ox+dx*t,y=oy+dy*t,z=oz+dz*t;if(y<heightAt(x,z)){let a=prev,b=t;for(let i=0;i<6;i++){const m=(a+b)/2;if(oy+dy*m<heightAt(ox+dx*m,oz+dz*m))b=m;else a=m;}return a;}prev=t;}return Infinity;}
}
