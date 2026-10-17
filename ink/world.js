// GLOSS RIOT — collision world (adapted from NOVA ARENA): axis-aligned solids + ramps, body movement (step-up, ramps, ground snap),
// ray casts, zones (low gravity, jump pads, teleporters) and an auto-generated navigation graph with A*.
import * as THREE from '../vendor/three.module.min.js';
import {V,Heap,cl} from './util.js';

export const PHY={g:22,walk:6.4,swim:10.8,enemy:2.4,roll:5.6,charge:2.8,accel:12,swimAccel:16,airAccel:2.6,airMax:.95,jump:7.6,swimJump:8.6,r:.38,h:1.62,hSwim:.62,eye:1.42,step:.55};
const CS=4,EPS=1e-4;
const key=(i,j)=>(i+512)*1024+(j+512);
// xz overlap of a body (half-size r) with a solid: boxes test the AABB, cylinders the circle
const ovXZ=(b,x,z,r)=>b.c?(x-b.cx)**2+(z-b.cz)**2<(b.R+r)**2:x-r<b.b[0]&&x+r>b.a[0]&&z-r<b.b[2]&&z+r>b.a[2];

export class World{
 constructor(){this.boxes=[];this.ramps=[];this.grid=new Map();this.stamp=0;this.low=[];this.pads=[];this.teles=[];this.killY=-40;this.links=[];this.bounds=[-50,50,-50,50];this.nodes=[];}
 box(ax,ay,az,bx,by,bz,o={}){const b={a:[ax,ay,az],b:[bx,by,bz],o,s:0,i:this.boxes.length};this.boxes.push(b);
  this._ins(b);return b;}
 cyl(cx,y0,cz,R,y1,o={}){const b={a:[cx-R,y0,cz-R],b:[cx+R,y1,cz+R],c:true,cx,cz,R,o,s:0,i:this.boxes.length};this.boxes.push(b);this._ins(b);return b;}
 _ins(b){for(let i=Math.floor(b.a[0]/CS);i<=Math.floor(b.b[0]/CS);i++)for(let j=Math.floor(b.a[2]/CS);j<=Math.floor(b.b[2]/CS);j++){const k=key(i,j);let l=this.grid.get(k);if(!l)this.grid.set(k,l=[]);l.push(b);}}
 // ramp footprint [x0,x1]x[z0,z1]; rises along axis ('x'|'z') in direction dir (+1/-1) from y0 to y1
 ramp(x0,z0,x1,z1,axis,dir,y0,y1){const r={x0,z0,x1,z1,axis,dir,y0,y1};this.ramps.push(r);return r;}
 rampH(r,x,z){let t=r.axis==='x'?(x-r.x0)/(r.x1-r.x0):(z-r.z0)/(r.z1-r.z0);if(r.dir<0)t=1-t;return r.y0+cl(t,0,1)*(r.y1-r.y0);}
 inRamp(r,x,z,m=0){return x>r.x0-m&&x<r.x1+m&&z>r.z0-m&&z<r.z1+m;}
 // iterate boxes touching an xz rectangle
 query(ax,az,bx,bz,fn){const st=++this.stamp;for(let i=Math.floor(ax/CS);i<=Math.floor(bx/CS);i++)for(let j=Math.floor(az/CS);j<=Math.floor(bz/CS);j++){const l=this.grid.get(key(i,j));if(!l)continue;for(const b of l){if(b.s===st)continue;b.s=st;if(fn(b)===false)return;}}}
 free(x,y,z,r,h){let ok=true;this.query(x-r,z-r,x+r,z+r,b=>{if(y<b.b[1]&&y+h>b.a[1]&&ovXZ(b,x,z,r)){ok=false;return false;}});
  if(ok)for(const rp of this.ramps){if(this.inRamp(rp,x,z,-.05)){const s=this.rampH(rp,x,z);if(y<s-.3&&y+h>Math.min(rp.y0,rp.y1)){ok=false;break;}}}return ok;}
 groundBelow(x,y,z,r=0){let g=-Infinity;this.query(x-r,z-r,x+r,z+r,b=>{if(b.b[1]<=y+.01&&b.b[1]>g&&ovXZ(b,x,z,r))g=b.b[1];});
  for(const rp of this.ramps)if(this.inRamp(rp,x,z)){const s=this.rampH(rp,x,z);if(s<=y+.01&&s>g)g=s;}return g;}

 /* ---------- body movement ---------- */
 move(body,dt){const p=body.pos,v=body.vel,r=body.r,h=body.h;const n=Math.max(1,Math.ceil(Math.hypot(v.x,v.y,v.z)*dt/.28));const sdt=dt/n;
  const was=body.onGround;body.onGround=false;body.hitWall=false;body.ceil=false;
  for(let s=0;s<n;s++){const px=p.x,pz=p.z;
   p.x+=v.x*sdt;this._h(body,'x',0,was);p.z+=v.z*sdt;this._h(body,'z',2,was);
   const py=p.y;p.y+=v.y*sdt;this._v(body,py);this._ramps(body,px,pz);}
  if(!body.onGround&&was&&v.y<=.5){const g=this.groundBelow(p.x,p.y+.05,p.z,r*.7);if(p.y-g<.5&&p.y-g>=-.05){p.y=g;body.onGround=true;if(v.y<0)v.y=0;}}}
 _h(body,ax,ai,was){const p=body.pos,v=body.vel,r=body.r,h=body.h;
  this.query(p.x-r,p.z-r,p.x+r,p.z+r,b=>{if(!(p.y<b.b[1]&&p.y+h>b.a[1]&&ovXZ(b,p.x,p.z,r)))return;
   const top=b.b[1];if(top-p.y<=PHY.step&&top-p.y>-EPS&&(was||body.onGround||v.y<=0)&&this.free(p.x,top+.002,p.z,r,h)){p.y=top+.001;body.onGround=true;if(v.y<0)v.y=0;body.stepped=(body.stepped||0)+1;return;}
   if(b.c){let dx=p.x-b.cx,dz=p.z-b.cz;const d=Math.hypot(dx,dz)||1e-3;dx/=d;dz/=d;p.x=b.cx+dx*(b.R+r+EPS);p.z=b.cz+dz*(b.R+r+EPS);const vn=v.x*dx+v.z*dz;if(vn<0){v.x-=vn*dx;v.z-=vn*dz;}body.hitWall=true;return;}
   const c=(b.a[ai]+b.b[ai])*.5,vv=v[ax];if(vv>0||(vv===0&&p[ax]<c))p[ax]=b.a[ai]-r-EPS;else p[ax]=b.b[ai]+r+EPS;body.hitWall=true;body.wallN=ai;v[ax]=0;});}
 _v(body,py){const p=body.pos,v=body.vel,r=body.r,h=body.h;
  this.query(p.x-r,p.z-r,p.x+r,p.z+r,b=>{if(!(p.y<b.b[1]&&p.y+h>b.a[1]&&ovXZ(b,p.x,p.z,r)))return;
   if(py>=b.b[1]-.05||v.y<=0&&p.y>(b.a[1]+b.b[1])*.5){p.y=b.b[1];if(v.y<0){body.landV=-v.y;v.y=0;}body.onGround=true;body.ground=b;}else{p.y=b.a[1]-h-EPS;if(v.y>0)v.y=0;body.ceil=true;}});}
 _ramps(body,px,pz){const p=body.pos,v=body.vel;for(const rp of this.ramps){if(!this.inRamp(rp,p.x,p.z))continue;const s=this.rampH(rp,p.x,p.z);
   if(p.y<s+.02&&p.y>s-1.1){if(v.y<=.5||p.y<s){if(v.y<0){body.landV=-v.y;v.y=0;}p.y=Math.max(p.y,s);body.onGround=true;}}
   else if(p.y<=s-1.1&&p.y+body.h>Math.min(rp.y0,rp.y1)){p.x=px;p.z=pz;body.hitWall=true;}}}

 /* ---------- rays ---------- */
 // returns distance to first solid hit (or maxT), normal written into out.n
 ray(o,d,maxT,out){let best=maxT,bn=-1,bs=0,cylN=null,bb=null,brp=null;const ix=1/(d.x||1e-9),iy=1/(d.y||1e-9),iz=1/(d.z||1e-9);
  const ex=o.x+d.x*maxT,ez=o.z+d.z*maxT;const qa=Math.min(o.x,ex),qb=Math.max(o.x,ex),qc=Math.min(o.z,ez),qd=Math.max(o.z,ez);
  const test=b=>{if(b.c){const ox=o.x-b.cx,oz=o.z-b.cz,A=d.x*d.x+d.z*d.z,B=ox*d.x+oz*d.z,C=ox*ox+oz*oz-b.R*b.R;
    if(C<0&&o.y>b.a[1]&&o.y<b.b[1])return;
    if(A>1e-9){const D=B*B-A*C;if(D>=0){const t=(-B-Math.sqrt(D))/A;if(t>=0&&t<best){const y=o.y+d.y*t;if(y>=b.a[1]&&y<=b.b[1]){best=t;bn=4;bb=b;cylN=[(ox+d.x*t)/b.R,0,(oz+d.z*t)/b.R];}}}}
    for(const[py,sg]of[[b.b[1],1],[b.a[1],-1]]){if(Math.abs(d.y)<1e-9)break;const t=(py-o.y)/d.y;if(t>=0&&t<best){const hx=ox+d.x*t,hz=oz+d.z*t;if(hx*hx+hz*hz<=b.R*b.R){best=t;bn=1;bs=sg;bb=b;}}}return;}
   let t1=(b.a[0]-o.x)*ix,t2=(b.b[0]-o.x)*ix;let tmin=Math.min(t1,t2),tmax=Math.max(t1,t2),ax=0,sg=t1<t2?-1:1;
   t1=(b.a[1]-o.y)*iy;t2=(b.b[1]-o.y)*iy;let a=Math.min(t1,t2);if(a>tmin){tmin=a;ax=1;sg=t1<t2?-1:1;}tmax=Math.min(tmax,Math.max(t1,t2));
   t1=(b.a[2]-o.z)*iz;t2=(b.b[2]-o.z)*iz;a=Math.min(t1,t2);if(a>tmin){tmin=a;ax=2;sg=t1<t2?-1:1;}tmax=Math.min(tmax,Math.max(t1,t2));
   if(tmax>=Math.max(tmin,0)&&tmin<best&&tmin>=0){best=tmin;bn=ax;bs=sg;bb=b;}};
  if(qb-qa+qd-qc<60)this.query(qa,qc,qb,qd,test);else for(const b of this.boxes)test(b);
  let rampN=null;for(const rp of this.ramps){// ramp top plane: y = y0 + k*(coord-c0)
   const L=rp.axis==='x'?rp.x1-rp.x0:rp.z1-rp.z0,k=(rp.y1-rp.y0)/L*(rp.dir),c0=rp.dir>0?(rp.axis==='x'?rp.x0:rp.z0):(rp.axis==='x'?rp.x1:rp.z1);
   const dc=rp.axis==='x'?d.x:d.z,oc=rp.axis==='x'?o.x:o.z;const den=d.y-k*dc;if(Math.abs(den)<1e-6)continue;const t=(rp.y0+k*(oc-c0)-o.y)/den;
   if(t>0&&t<best){const hx=o.x+d.x*t,hz=o.z+d.z*t;if(this.inRamp(rp,hx,hz)){best=t;bn=3;brp=rp;rampN=new V(rp.axis==='x'?-k:0,1,rp.axis==='z'?-k:0).normalize();}}}
  if(out){out.hit=bn>=0;out.b=bn===3?null:bb;out.rp=bn===3?brp:null;if(bn===4)out.n.set(cylN[0],0,cylN[2]);else if(bn===3)out.n.copy(rampN);else if(bn>=0){out.n.set(0,0,0);out.n.setComponent(bn,bs);}}return best;}
 los(a,b){const d=new V().subVectors(b,a),L=d.length();if(L<1e-3)return true;d.divideScalar(L);return this.ray(a,d,L)>=L-.05;}

 /* ---------- zones ---------- */
 gravAt(p){for(const z of this.low)if(p.x>z.a[0]&&p.x<z.b[0]&&p.y>z.a[1]&&p.y<z.b[1]&&p.z>z.a[2]&&p.z<z.b[2])return z.k;return 1;}

 /* ---------- navigation graph ---------- */
 buildNav(cell=1.6){const[x0,x1,z0,z1]=this.bounds,W=Math.ceil((x1-x0)/cell),H=Math.ceil((z1-z0)/cell);const nodes=[],byCell=new Map();this.navCell=cell;this.navW=W;this.navH=H;
  const deadly=(x,y,z)=>this.low.length&&false;
  for(let i=0;i<W;i++)for(let j=0;j<H;j++){const x=x0+(i+.5)*cell,z=z0+(j+.5)*cell;const ys=[];
   this.query(x,z,x,z,b=>{if(b.o.nowalk)return;if(b.c?(x-b.cx)**2+(z-b.cz)**2<(b.R-.15)**2:x>b.a[0]&&x<b.b[0]&&z>b.a[2]&&z<b.b[2])ys.push(b.b[1]);});
   for(const rp of this.ramps)if(this.inRamp(rp,x,z,-.1))ys.push(this.rampH(rp,x,z));
   for(const y of ys){if(y<this.killY+2||!this.free(x,y+.03,z,.32,1.7))continue;if(deadly(x,y,z))continue;
    // edge nodes (any corner without ground) cost more
    let edge=0;for(const[dx,dz]of[[.5,0],[-.5,0],[0,.5],[0,-.5]])if(y-this.groundBelow(x+dx*cell,y+.1,z+dz*cell)>.7)edge++;
    const n={x,y,z,i,j,e:[],edge,id:nodes.length};nodes.push(n);const k=i*H+j;let l=byCell.get(k);if(!l)byCell.set(k,l=[]);l.push(n);}}
  const link=(a,b,c,t)=>a.e.push({n:b.id,c,t});
  for(const n of nodes){for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){if(!di&&!dj)continue;const l=byCell.get((n.i+di)*H+n.j+dj);if(!l||n.i+di<0||n.i+di>=W)continue;
    for(const m of l){const dy=m.y-n.y,hd=Math.hypot(m.x-n.x,m.z-n.z);const mx=(n.x+m.x)/2,mz=(n.z+m.z)/2;
     if(Math.abs(dy)<=.6){if(this.free(mx,Math.max(n.y,m.y)+.05,mz,.3,1.7)&&(di===0||dj===0||this.free(n.x+di*cell,Math.max(n.y,m.y)+.05,n.z,.3,1.7)&&this.free(n.x,Math.max(n.y,m.y)+.05,n.z+dj*cell,.3,1.7)))link(n,m,hd*(1+m.edge*.6),0);}
     else if(dy<-.6&&dy>-16){if(this.free(m.x,n.y+.05,m.z,.3,1.7)&&this.free(mx,n.y+.05,mz,.3,1.7))link(n,m,hd+1,1);}
     else if(dy>.6&&dy<=1.1){if(this.free(n.x,m.y+.05,n.z,.3,1.7)&&this.free(mx,m.y+.05,mz,.3,1.7))link(n,m,hd+2,2);}
     else if(false){if(this.free(n.x,n.y+.05,n.z,.3,dy+1.8)&&this.free(mx,m.y+.05,mz,.3,1.7))link(n,m,hd+dy*1.5+4,3);}}}}
  this.nodes=nodes;this.byCell=byCell;
  // jump pads + teleporters: simulate the flight and link to where it lands
  for(const pd of this.pads){const a=this.nearest(new V(pd.x,pd.y,pd.z));if(!a)continue;const body={pos:new V(pd.x,pd.y+.1,pd.z),vel:new V(pd.vx,pd.vy,pd.vz),r:.38,h:1.8,onGround:false};
   for(let t=0;t<6;t+=1/30){body.vel.y-=PHY.g*this.gravAt(body.pos)/30;this.move(body,1/30);if(body.onGround&&t>.2)break;}const b=this.nearest(body.pos);if(b&&b!==a){link(a,b,6,4);pd.land=body.pos.clone();}}
  for(const[p,q]of this.links){const a=this.nearest(p),b=this.nearest(q,3);if(a&&b)link(a,b,8,3);}
  for(const tp of this.teles){const a=this.nearest(new V(tp.x,tp.y,tp.z)),b=this.nearest(new V(tp.tx,tp.ty,tp.tz));if(a&&b)link(a,b,4,5);}
  // keep only the largest connected island reachable for roaming targets
  const comp=new Int32Array(nodes.length).fill(-1);let best=-1,bestN=0;for(const s of nodes){if(comp[s.id]>=0)continue;const st=[s.id];comp[s.id]=s.id;let c=0;while(st.length){const k=st.pop();c++;for(const e of nodes[k].e)if(comp[e.n]<0){comp[e.n]=s.id;st.push(e.n);}}if(c>bestN){bestN=c;best=s.id;}}
  this.reach=nodes.filter(n=>comp[n.id]===best);this.roam=this.reach.filter(n=>!n.edge);return nodes.length;}
 nearest(p,maxUp=1.2){if(!this.nodes.length)return null;const c=this.navCell,i0=Math.floor((p.x-this.bounds[0])/c),j0=Math.floor((p.z-this.bounds[2])/c);let best=null,bd=1e9;
  for(let r=0;r<=3&&!best;r++)for(let di=-r;di<=r;di++)for(let dj=-r;dj<=r;dj++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const l=this.byCell.get((i0+di)*this.navH+j0+dj);if(!l||i0+di<0||i0+di>=this.navW)continue;
   for(const n of l){const dy=p.y-n.y;if(dy<-maxUp)continue;const d=Math.hypot(n.x-p.x,n.z-p.z)+Math.abs(dy)*2.5;if(d<bd){bd=d;best=n;}}}return best;}
 path(from,to,maxExp=5000){const a=this.nearest(from),b=to.id!==undefined?to:this.nearest(to,3);if(!a||!b)return null;if(a===b)return[{n:b,t:0}];const N=this.nodes,g=new Map(),prev=new Map(),h=new Heap();
  g.set(a.id,0);h.push(0,a.id);let exp=0;const hd=n=>Math.hypot(n.x-b.x,n.z-b.z)+Math.abs(n.y-b.y)*.5;
  while(h.size&&exp++<maxExp){const k=h.pop();if(k===b.id)break;const n=N[k],gk=g.get(k);for(const e of n.e){const ng=gk+e.c;if(ng<(g.get(e.n)??1e9)){g.set(e.n,ng);prev.set(e.n,{k,t:e.t});h.push(ng+hd(N[e.n]),e.n);}}}
  if(!prev.has(b.id))return null;const out=[];let k=b.id;while(k!==a.id){const pv=prev.get(k);out.push({n:N[k],t:pv.t});k=pv.k;}out.reverse();return out;}
}
