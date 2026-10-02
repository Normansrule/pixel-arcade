// SKATE CITY — level collision. The ground is a heightfield made of primitives (boxes, wedges, quarter pipes,
// sunken bowls, round plinths, stairs); rails are polylines (rails, ledges and ramp copings) that can be ground.
export const TM=86*Math.PI/180,CT=Math.cos(TM),ST=Math.sin(TM);
const NO=-1e9,WALL=60;

function prep(p){p.r=p.r||0;p.c=Math.cos(p.r);p.s=Math.sin(p.r);p.y0=p.y0||0;
 if(p.t==='box'||p.t==='cyl'){p.h=p.y0+p.h;}
 if(p.t==='wedge'||p.t==='stairs'){p.h0=p.y0+(p.h0||0);p.h1=p.y0+p.h1;}
 if(p.t==='qp'){p.H=p.R*(1-CT);p.ul=p.R*(1-ST);p.deck=p.deck??0;}
 if(p.t==='bowl'){p.R=p.D/(1-CT);p.ext=p.R*ST;p.rc=Math.min(p.rc,p.hw,p.hd);}
 return p;}
// local <-> world (rotation r about +Y, like Object3D.rotation.y)
export function toWorld(p,lx,lz){return[p.x+lx*p.c+lz*p.s,p.z-lx*p.s+lz*p.c];}
function extent(p){if(p.t==='cyl')return[-p.rad,p.rad,-p.rad,p.rad];if(p.t==='qp')return[-p.len/2,p.len/2,-p.deck,p.R];if(p.t==='bowl')return[-p.hw-p.ext,p.hw+p.ext,-p.hd-p.ext,p.hd+p.ext];return[-p.hw,p.hw,-p.hd,p.hd];}
export function aabb(p){const[a,b,c,d]=extent(p);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const[lx,lz]of[[a,c],[b,c],[a,d],[b,d]]){const[x,z]=toWorld(p,lx,lz);x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}return[x0,x1,z0,z1];}

const T={gx:0,gz:0};
function top(p,x,z,o){const dx=x-p.x,dz=z-p.z,lx=dx*p.c-dz*p.s,lz=dx*p.s+dz*p.c;let h,gx=0,gz=0;
 switch(p.t){
  case'box':if(lx<-p.hw||lx>p.hw||lz<-p.hd||lz>p.hd)return NO;h=p.h;break;
  case'wedge':case'stairs':{if(lx<-p.hw||lx>p.hw||lz<-p.hd||lz>p.hd)return NO;const k=(lz+p.hd)/(2*p.hd);h=p.h0+(p.h1-p.h0)*k;gz=(p.h1-p.h0)/(2*p.hd);break;}
  case'cyl':if(dx*dx+dz*dz>p.rad*p.rad)return NO;o.gx=o.gz=0;return p.h;
  case'qp':{if(lx<-p.len/2||lx>p.len/2||lz<-p.deck||lz>p.R)return NO;if(lz<=p.ul)h=p.y0+p.H;else{const a=p.R-lz,s=Math.sqrt(Math.max(1e-6,p.R*p.R-a*a));h=p.y0+p.R-s;gz=-a/s;}break;}
  case'bowl':{const qx=Math.abs(lx)-(p.hw-p.rc),qz=Math.abs(lz)-(p.hd-p.rc);let d,nx=0,nz=0;
   if(qx>0&&qz>0){const l=Math.hypot(qx,qz);d=l-p.rc;nx=qx/l;nz=qz/l;}else if(qx>qz){d=qx-p.rc;nx=1;}else{d=qz-p.rc;nz=1;}
   if(d>p.ext)return NO;nx*=lx<0?-1:1;nz*=lz<0?-1:1;if(d<=0)h=p.y0-p.D;else{const s=Math.sqrt(Math.max(1e-6,p.R*p.R-d*d));h=p.y0-p.D+p.R-s;const g=d/s;gx=g*nx;gz=g*nz;}break;}
  default:return NO;}
 o.gx=gx*p.c+gz*p.s;o.gz=-gx*p.s+gz*p.c;return h;}

export class World{
 constructor(L){this.L=L;this.b=L.bounds;this.base=L.base||0;this.prims=[];this.rails=[];this.cs=4;
  this.nx=Math.ceil((this.b[1]-this.b[0])/this.cs)+1;this.nz=Math.ceil((this.b[3]-this.b[2])/this.cs)+1;this.cells=[];for(let i=0;i<this.nx*this.nz;i++)this.cells.push({cuts:[],solids:[]});
  for(const d of L.prims)this.add(d);
  let rid=0;for(const r of L.rails||[])this.addRail({...r,id:r.id||'r'+rid++});
  this.hazards=L.hazards||[];}
 add(d){const p=prep({...d});this.prims.push(p);const[x0,x1,z0,z1]=aabb(p);p.box=[x0,x1,z0,z1];
  for(let i=this.ci(x0);i<=this.ci(x1);i++)for(let j=this.cj(z0);j<=this.cj(z1);j++){const c=this.cells[i*this.nz+j];if(c)(p.t==='bowl'?c.cuts:c.solids).push(p);}
  // copings and grindable ledges become rails
  if(p.t==='qp'&&p.coping!==false){const a=toWorld(p,-p.len/2+.15,p.ul),b=toWorld(p,p.len/2-.15,p.ul),y=p.y0+p.H;this.addRail({id:p.id?p.id+'_cop':undefined,kind:'coping',pts:[[a[0],y,a[1]],[b[0],y,b[1]]],f:[p.s,p.c],prim:p});}
  if(p.t==='bowl'){const pts=[],fs=[],N=12;const rr=p.rc+p.ext;const cx=p.hw-p.rc,cz=p.hd-p.rc;
   const corner=(sx,sz,a0)=>{for(let i=0;i<N;i++){const a=a0+i/N*Math.PI/2,ox=Math.cos(a),oz=Math.sin(a);const w=toWorld(p,sx*cx+ox*rr,sz*cz+oz*rr);pts.push([w[0],p.y0,w[1]]);}};
   corner(1,1,0);corner(-1,1,Math.PI/2);corner(-1,-1,Math.PI);corner(1,-1,Math.PI*1.5);
   this.addRail({id:p.id?p.id+'_cop':'bowl',kind:'coping',pts,closed:true,bowl:p});}
  if((p.t==='box'||p.t==='cyl')&&p.ledge){const y=p.h;if(p.t==='cyl'){const pts=[],N=28;for(let i=0;i<N;i++){const a=i/N*Math.PI*2;pts.push([p.x+Math.cos(a)*(p.rad-.06),y,p.z+Math.sin(a)*(p.rad-.06)]);}this.addRail({id:p.id?p.id+'_rim':undefined,kind:'ledge',pts,closed:true});}
   else{const e=p.ledge===true?'nesw':p.ledge,i=.05;const C=(lx,lz)=>{const w=toWorld(p,lx,lz);return[w[0],y,w[1]];};const hw=p.hw-i,hd=p.hd-i;
    if(e.includes('n'))this.addRail({kind:'ledge',id:p.id?p.id+'_n':undefined,pts:[C(-hw,-hd),C(hw,-hd)]});if(e.includes('s'))this.addRail({kind:'ledge',id:p.id?p.id+'_s':undefined,pts:[C(-hw,hd),C(hw,hd)]});
    if(e.includes('w'))this.addRail({kind:'ledge',id:p.id?p.id+'_w':undefined,pts:[C(-hw,-hd),C(-hw,hd)]});if(e.includes('e'))this.addRail({kind:'ledge',id:p.id?p.id+'_e':undefined,pts:[C(hw,-hd),C(hw,hd)]});}}
  if(p.t==='wedge'&&p.ledge){const i=.05;const C=(lx,lz)=>{const w=toWorld(p,lx,lz);return[w[0],p.h0+(p.h1-p.h0)*(lz+p.hd)/(2*p.hd),w[1]];};
   for(const s of[-1,1])if(p.ledge===true||p.ledge.includes(s<0?'w':'e'))this.addRail({kind:'ledge',id:p.id?p.id+(s<0?'_w':'_e'):undefined,pts:[C(s*(p.hw-i),-p.hd+.02),C(s*(p.hw-i),p.hd-.02)]});}
  return p;}
 addRail(r){r.id=r.id||'r'+this.rails.length;const P=r.pts.map(a=>({x:a[0],y:a[1],z:a[2]}));if(r.closed)P.push(P[0]);r.segs=[];let L=0;
  for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,len=Math.hypot(dx,dy,dz);if(len<1e-3)continue;
   let f=r.f;if(r.bowl){const p=r.bowl,mx=(a.x+b.x)/2-p.x,mz=(a.z+b.z)/2-p.z,l=Math.hypot(mx,mz)||1;// outward normal of the ring, toward the bowl centre for riders
    const ox=dz/len,oz=-dx/len;f=(ox*mx+oz*mz)>0?[-ox,-oz]:[ox,oz];}
   r.segs.push({a,b,d:{x:dx/len,y:dy/len,z:dz/len},len,s0:L,f});L+=len;}
  r.len=L;this.rails.push(r);return r;}
 ci(x){return Math.max(0,Math.min(this.nx-1,Math.floor((x-this.b[0])/this.cs)));}
 cj(z){return Math.max(0,Math.min(this.nz-1,Math.floor((z-this.b[2])/this.cs)));}
 // height of the ground at (x,z); o receives the gradient (dh/dx, dh/dz)
 H(x,z,o=T){const b=this.b;if(x<b[0]||x>b[1]||z<b[2]||z>b[3]){o.gx=o.gz=0;o.wall=true;o.p=null;return o.h=WALL;}
  const c=this.cells[this.ci(x)*this.nz+this.cj(z)];let h=this.base,gx=0,gz=0,pr=null;
  for(const p of c.cuts){const t=top(p,x,z,T);if(t>NO){h=t;gx=T.gx;gz=T.gz;pr=p;}}
  for(const p of c.solids){const t=top(p,x,z,T);if(t>h){h=t;gx=T.gx;gz=T.gz;pr=p;}}
  o.h=h;o.gx=gx;o.gz=gz;o.wall=false;o.p=pr;return h;}
 normal(x,z,n){this.H(x,z,T);const l=Math.hypot(T.gx,1,T.gz);n.set(-T.gx/l,1/l,-T.gz/l);return n;}
 // nearest rail point to p within horizontal radius r and a vertical window [lo,hi] relative to p.y
 rail(p,r,lo,hi,skip){let best=null,bd=r*r;
  for(const R of this.rails){if(R===skip)continue;for(let i=0;i<R.segs.length;i++){const s=R.segs[i],a=s.a;const hx=s.b.x-a.x,hz=s.b.z-a.z,hl=hx*hx+hz*hz;
   let t=hl>1e-6?((p.x-a.x)*hx+(p.z-a.z)*hz)/hl:0;t=t<0?0:t>1?1:t;const x=a.x+hx*t,z=a.z+hz*t,y=a.y+(s.b.y-a.y)*t;const dy=y-p.y;if(dy<lo||dy>hi)continue;
   const d=(x-p.x)**2+(z-p.z)**2;if(d<bd){bd=d;best={rail:R,seg:i,t,x,y,z,d:Math.sqrt(d)};}}}
  return best;}
 hazard(x,z){for(const h of this.hazards){if((x-h.x)**2+(z-h.z)**2<h.r*h.r)return h;}return null;}
}
