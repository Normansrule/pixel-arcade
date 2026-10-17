// STARFALL VANGUARD — collision world: a terrain heightfield plus axis-aligned boxes / cylinders, body movement
// (step-up, cliff blocking, ground snap), ray casts against both, and a walkable grid with A* for squad + alien AI.
import {V,Heap,cl} from './util.js';

export const PHY={g:22,walk:6.6,sprint:9.6,accel:12,airAccel:2.2,airMax:.9,jump:7.6,r:.38,h:1.8,hC:1.15,eye:1.64,eyeC:1.05,step:.6};
const CS=4,EPS=1e-4;
const key=(i,j)=>(i+1024)*2048+(j+1024);
const ovXZ=(b,x,z,r)=>b.c?(x-b.cx)**2+(z-b.cz)**2<(b.R+r)**2:x-r<b.b[0]&&x+r>b.a[0]&&z-r<b.b[2]&&z+r>b.a[2];

export class World{
 constructor(){this.boxes=[];this.grid=new Map();this.stamp=0;this.killY=-80;this.bounds=[-100,100,-100,100];this.hf=null;this.nav=null;}
 /* ---------- terrain ---------- */
 setTerrain(x0,z0,cs,nx,nz,fn){const h=new Float32Array(nx*nz);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++)h[j*nx+i]=fn(x0+i*cs,z0+j*cs);this.hf={x0,z0,cs,nx,nz,h};}
 H(x,z){const f=this.hf;if(!f)return-1e9;let u=(x-f.x0)/f.cs,v=(z-f.z0)/f.cs;u=cl(u,0,f.nx-1.001);v=cl(v,0,f.nz-1.001);const i=u|0,j=v|0,fu=u-i,fv=v-j,h=f.h,n=f.nx;
  const a=h[j*n+i],b=h[j*n+i+1],c=h[(j+1)*n+i],d=h[(j+1)*n+i+1];return a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv;}
 normal(x,z,o=new V()){const e=.6;return o.set(this.H(x-e,z)-this.H(x+e,z),2*e,this.H(x,z-e)-this.H(x,z+e)).normalize();}
 /* ---------- solids ---------- */
 box(ax,ay,az,bx,by,bz,o={}){const b={a:[ax,ay,az],b:[bx,by,bz],o,s:0,i:this.boxes.length};this.boxes.push(b);this._ins(b);return b;}
 cyl(cx,y0,cz,R,y1,o={}){const b={a:[cx-R,y0,cz-R],b:[cx+R,y1,cz+R],c:true,cx,cz,R,o,s:0,i:this.boxes.length};this.boxes.push(b);this._ins(b);return b;}
 _ins(b){for(let i=Math.floor(b.a[0]/CS);i<=Math.floor(b.b[0]/CS);i++)for(let j=Math.floor(b.a[2]/CS);j<=Math.floor(b.b[2]/CS);j++){const k=key(i,j);let l=this.grid.get(k);if(!l)this.grid.set(k,l=[]);l.push(b);}}
 remove(b){b.dead=true;for(const l of this.grid.values()){const i=l.indexOf(b);if(i>=0)l.splice(i,1);}}
 query(ax,az,bx,bz,fn){const st=++this.stamp;for(let i=Math.floor(ax/CS);i<=Math.floor(bx/CS);i++)for(let j=Math.floor(az/CS);j<=Math.floor(bz/CS);j++){const l=this.grid.get(key(i,j));if(!l)continue;for(const b of l){if(b.s===st)continue;b.s=st;if(fn(b)===false)return;}}}
 free(x,y,z,r,h){let ok=true;this.query(x-r,z-r,x+r,z+r,b=>{if(y<b.b[1]&&y+h>b.a[1]&&ovXZ(b,x,z,r)){ok=false;return false;}});return ok;}
 groundBelow(x,y,z,r=0){let g=this.H(x,z);if(g>y+.01)g=-Infinity;this.query(x-r,z-r,x+r,z+r,b=>{if(b.b[1]<=y+.01&&b.b[1]>g&&ovXZ(b,x,z,r))g=b.b[1];});return g;}
 /* ---------- body movement ---------- */
 move(body,dt){const p=body.pos,v=body.vel;const n=Math.max(1,Math.ceil(Math.hypot(v.x,v.y,v.z)*dt/.3));const sdt=dt/n;const was=body.onGround;body.onGround=false;body.hitWall=false;
  for(let s=0;s<n;s++){const px=p.x,pz=p.z,h0=this.H(px,pz);
   p.x+=v.x*sdt;this._h(body,'x',0,was);p.z+=v.z*sdt;this._h(body,'z',2,was);
   // terrain cliffs: refuse steep climbs
   const h1=this.H(p.x,p.z),dd=Math.hypot(p.x-px,p.z-pz);if(dd>1e-4&&h1>p.y+.25&&(h1-h0)/dd>1.25){p.x=px;p.z=pz;const nn=this.normal(px,pz);const vn=v.x*nn.x+v.z*nn.z;if(vn<0){v.x-=vn*nn.x*1.1;v.z-=vn*nn.z*1.1;}body.hitWall=true;}
   const py=p.y;p.y+=v.y*sdt;this._v(body,py);const th=this.H(p.x,p.z);if(p.y<th){p.y=th;if(v.y<0){body.landV=-v.y;v.y=0;}body.onGround=true;body.ground=null;}}
  if(p.x<this.bounds[0]+1)p.x=this.bounds[0]+1;if(p.x>this.bounds[1]-1)p.x=this.bounds[1]-1;if(p.z<this.bounds[2]+1)p.z=this.bounds[2]+1;if(p.z>this.bounds[3]-1)p.z=this.bounds[3]-1;
  if(!body.onGround&&was&&v.y<=.5){const g=this.groundBelow(p.x,p.y+.05,p.z,body.r*.7);if(p.y-g<.65&&p.y-g>=-.05){p.y=g;body.onGround=true;if(v.y<0)v.y=0;}}}
 _h(body,ax,ai,was){const p=body.pos,v=body.vel,r=body.r,h=body.h;
  this.query(p.x-r,p.z-r,p.x+r,p.z+r,b=>{if(!(p.y<b.b[1]&&p.y+h>b.a[1]&&ovXZ(b,p.x,p.z,r)))return;
   const top=b.b[1];if(top-p.y<=PHY.step&&top-p.y>-EPS&&(was||body.onGround||v.y<=0)&&this.free(p.x,top+.002,p.z,r,h)){p.y=top+.001;body.onGround=true;if(v.y<0)v.y=0;return;}
   if(b.c){let dx=p.x-b.cx,dz=p.z-b.cz;const d=Math.hypot(dx,dz)||1e-3;dx/=d;dz/=d;p.x=b.cx+dx*(b.R+r+EPS);p.z=b.cz+dz*(b.R+r+EPS);const vn=v.x*dx+v.z*dz;if(vn<0){v.x-=vn*dx;v.z-=vn*dz;}body.hitWall=true;return;}
   const c=(b.a[ai]+b.b[ai])*.5,vv=v[ax];if(vv>0||(vv===0&&p[ax]<c))p[ax]=b.a[ai]-r-EPS;else p[ax]=b.b[ai]+r+EPS;body.hitWall=true;v[ax]=0;});}
 _v(body,py){const p=body.pos,v=body.vel,r=body.r,h=body.h;
  this.query(p.x-r,p.z-r,p.x+r,p.z+r,b=>{if(!(p.y<b.b[1]&&p.y+h>b.a[1]&&ovXZ(b,p.x,p.z,r)))return;
   if(py>=b.b[1]-.05||v.y<=0&&p.y>(b.a[1]+b.b[1])*.5){p.y=b.b[1];if(v.y<0){body.landV=-v.y;v.y=0;}body.onGround=true;body.ground=b;}else{p.y=b.a[1]-h-EPS;if(v.y>0)v.y=0;}});}
 // circle push-out for vehicles (xz only, ignores boxes below y0)
 pushOut(p,r,y0,y1){let hit=null;this.query(p.x-r,p.z-r,p.x+r,p.z+r,b=>{if(b.b[1]<y0+.7||b.a[1]>y1||!ovXZ(b,p.x,p.z,r))return;
   if(b.c){let dx=p.x-b.cx,dz=p.z-b.cz;const d=Math.hypot(dx,dz)||1e-3;dx/=d;dz/=d;p.x=b.cx+dx*(b.R+r);p.z=b.cz+dz*(b.R+r);hit={x:dx,z:dz};return;}
   const ox=Math.min(p.x+r-b.a[0],b.b[0]-(p.x-r)),oz=Math.min(p.z+r-b.a[2],b.b[2]-(p.z-r));
   if(ox<oz){const s=p.x<(b.a[0]+b.b[0])/2?-1:1;p.x+=s*ox;hit={x:s,z:0};}else{const s=p.z<(b.a[2]+b.b[2])/2?-1:1;p.z+=s*oz;hit={x:0,z:s};}});return hit;}
 /* ---------- rays ---------- */
 ray(o,d,maxT,out){let best=maxT,bn=-1,bs=0,cylN=null;const ix=1/(d.x||1e-9),iy=1/(d.y||1e-9),iz=1/(d.z||1e-9);
  const ex=o.x+d.x*maxT,ez=o.z+d.z*maxT;const qa=Math.min(o.x,ex),qb=Math.max(o.x,ex),qc=Math.min(o.z,ez),qd=Math.max(o.z,ez);
  const test=b=>{if(b.o.noray)return;if(b.c){const ox=o.x-b.cx,oz=o.z-b.cz,A=d.x*d.x+d.z*d.z,B=ox*d.x+oz*d.z,C=ox*ox+oz*oz-b.R*b.R;
    if(C<0&&o.y>b.a[1]&&o.y<b.b[1])return;
    if(A>1e-9){const D=B*B-A*C;if(D>=0){const t=(-B-Math.sqrt(D))/A;if(t>=0&&t<best){const y=o.y+d.y*t;if(y>=b.a[1]&&y<=b.b[1]){best=t;bn=4;cylN=[(ox+d.x*t)/b.R,0,(oz+d.z*t)/b.R];}}}}
    for(const[py,sg]of[[b.b[1],1],[b.a[1],-1]]){if(Math.abs(d.y)<1e-9)break;const t=(py-o.y)/d.y;if(t>=0&&t<best){const hx=ox+d.x*t,hz=oz+d.z*t;if(hx*hx+hz*hz<=b.R*b.R){best=t;bn=1;bs=sg;}}}return;}
   let t1=(b.a[0]-o.x)*ix,t2=(b.b[0]-o.x)*ix;let tmin=Math.min(t1,t2),tmax=Math.max(t1,t2),ax=0,sg=t1<t2?-1:1;
   t1=(b.a[1]-o.y)*iy;t2=(b.b[1]-o.y)*iy;let a=Math.min(t1,t2);if(a>tmin){tmin=a;ax=1;sg=t1<t2?-1:1;}tmax=Math.min(tmax,Math.max(t1,t2));
   t1=(b.a[2]-o.z)*iz;t2=(b.b[2]-o.z)*iz;a=Math.min(t1,t2);if(a>tmin){tmin=a;ax=2;sg=t1<t2?-1:1;}tmax=Math.min(tmax,Math.max(t1,t2));
   if(tmax>=Math.max(tmin,0)&&tmin<best&&tmin>=0){best=tmin;bn=ax;bs=sg;}};
  if(qb-qa+qd-qc<90)this.query(qa,qc,qb,qd,test);else for(const b of this.boxes)if(!b.dead)test(b);
  // terrain: march then bisect
  let tn=false;if(this.hf){const st=Math.max(.7,Math.min(2.5,best/40));let t0=0,above=o.y-this.H(o.x,o.z);if(above>=-.05){for(let t=st;t<=best+st;t+=st){const tt=Math.min(t,best);const y=o.y+d.y*tt-this.H(o.x+d.x*tt,o.z+d.z*tt);if(y<0){let lo=t0,hi=tt;for(let k=0;k<8;k++){const m=(lo+hi)/2;if(o.y+d.y*m-this.H(o.x+d.x*m,o.z+d.z*m)<0)hi=m;else lo=m;}if(lo<best){best=lo;tn=true;}break;}t0=tt;if(tt>=best)break;}}}
  if(out){out.hit=bn>=0||tn;out.terrain=tn;if(tn)this.normal(o.x+d.x*best,o.z+d.z*best,out.n);else if(bn===4)out.n.set(cylN[0],0,cylN[2]);else if(bn>=0){out.n.set(0,0,0);out.n.setComponent(bn,bs);}}return best;}
 los(a,b){const d=new V().subVectors(b,a),L=d.length();if(L<1e-3)return true;d.divideScalar(L);return this.ray(a,d,L)>=L-.05;}
 /* ---------- walkable grid + A* ---------- */
 buildNav(cell=2,seed=null){const[x0,x1,z0,z1]=this.bounds,W=Math.ceil((x1-x0)/cell),Hn=Math.ceil((z1-z0)/cell);const y=new Float32Array(W*Hn),ok=new Uint8Array(W*Hn);
  for(let j=0;j<Hn;j++)for(let i=0;i<W;i++){const x=x0+(i+.5)*cell,z=z0+(j+.5)*cell;let g=this.H(x,z);
   // a walkable box top close above terrain (floors, decks) wins
   this.query(x,z,x,z,b=>{if(b.o.floor&&!b.c&&x>b.a[0]&&x<b.b[0]&&z>b.a[2]&&z<b.b[2]&&b.b[1]>g)g=b.b[1];});
   y[j*W+i]=g;const n=this.normal(x,z);ok[j*W+i]=(n.y>.72||g>this.H(x,z)+.1)&&this.free(x,g+.45,z,.55,1.3)&&x>x0+2&&x<x1-2&&z>z0+2&&z<z1-2?1:0;}
  this.nav={cell,W,H:Hn,y,ok,x0,z0};let c=0;for(const v of ok)c+=v;
  // largest connected region only
  const comp=new Int32Array(W*Hn).fill(-1);let best=-1,bn=0;for(let s=0;s<W*Hn;s++){if(!ok[s]||comp[s]>=0)continue;const st=[s];comp[s]=s;let n=0;while(st.length){const k=st.pop();n++;const i=k%W,j=k/W|0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=W||jj>=Hn)continue;const q=jj*W+ii;if(ok[q]&&comp[q]<0&&this._lk(k,q)){comp[q]=s;st.push(q);}}}if(n>bn){bn=n;best=s;}}
  if(seed){const sk=Math.min(W-1,Math.max(0,Math.floor((seed.x-x0)/cell)))+Math.min(Hn-1,Math.max(0,Math.floor((seed.z-z0)/cell)))*W;let found=-1;for(let r=0;r<6&&found<0;r++)for(let dj=-r;dj<=r&&found<0;dj++)for(let di=-r;di<=r;di++){const q=sk+dj*W+di;if(q>=0&&q<W*Hn&&ok[q]){found=comp[q];break;}}if(found>=0)best=found;}
  this.nav.comp=comp;this.nav.main=best;return c;}
 _lk(a,b){const N=this.nav;return Math.abs(N.y[a]-N.y[b])<N.cell*.9;}
 cellOf(p){const N=this.nav;const i=cl(Math.floor((p.x-N.x0)/N.cell),0,N.W-1),j=cl(Math.floor((p.z-N.z0)/N.cell),0,N.H-1);return j*N.W+i;}
 cpos(k,o=new V()){const N=this.nav;return o.set(N.x0+(k%N.W+.5)*N.cell,N.y[k],N.z0+((k/N.W|0)+.5)*N.cell);}
 nearest(p){const N=this.nav;const k0=this.cellOf(p);if(N.ok[k0]&&N.comp[k0]===N.main)return k0;const i0=k0%N.W,j0=k0/N.W|0;
  for(let r=1;r<10;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=i0+di,j=j0+dj;if(i<0||j<0||i>=N.W||j>=N.H)continue;const k=j*N.W+i;if(N.ok[k]&&N.comp[k]===N.main)return k;}return-1;}
 path(from,to,maxExp=4000){const N=this.nav;if(!N)return null;const a=this.nearest(from),b=this.nearest(to);if(a<0||b<0)return null;if(a===b)return[b];
  const g=new Map(),prev=new Map(),h=new Heap();g.set(a,0);h.push(0,a);let exp=0;const bi=b%N.W,bj=b/N.W|0;const hd=k=>Math.hypot(k%N.W-bi,(k/N.W|0)-bj);let bestK=a,bestH=hd(a);
  while(h.size&&exp++<maxExp){const k=h.pop();if(k===b){bestK=b;break;}const i=k%N.W,j=k/N.W|0,gk=g.get(k);const hk=hd(k);if(hk<bestH){bestH=hk;bestK=k;}
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=N.W||jj>=N.H)continue;const q=jj*N.W+ii;if(!N.ok[q]||!this._lk(k,q))continue;
    if(di&&dj&&(!N.ok[j*N.W+ii]||!N.ok[jj*N.W+i]))continue;const ng=gk+(di&&dj?1.414:1);if(ng<(g.get(q)??1e9)){g.set(q,ng);prev.set(q,k);h.push(ng+hd(q),q);}}}
  const out=[];let k=bestK;while(k!==a&&k!==undefined){out.push(k);k=prev.get(k);}out.reverse();
  // string-pull: drop cells while the straight line stays walkable
  const sm=[];let cur=a;for(let i=0;i<out.length;i++){const nx=out[i+1];if(nx!==undefined&&this._clear(cur,nx))continue;sm.push(out[i]);cur=out[i];}return sm.length?sm:null;}
 _clear(a,b){const N=this.nav;const ai=a%N.W,aj=a/N.W|0,bi=b%N.W,bj=b/N.W|0;const n=Math.max(Math.abs(bi-ai),Math.abs(bj-aj))*2;let py=N.y[a];
  for(let s=1;s<=n;s++){const t=s/n,i=Math.round(ai+(bi-ai)*t),j=Math.round(aj+(bj-aj)*t);const k=j*N.W+i;if(!N.ok[k]||Math.abs(N.y[k]-py)>N.cell*.9)return false;py=N.y[k];}return true;}
 randomNear(p,r,o=new V()){const N=this.nav;for(let t=0;t<12;t++){const q=new V(p.x+(Math.random()*2-1)*r,0,p.z+(Math.random()*2-1)*r);const k=this.cellOf(q);if(N.ok[k]&&N.comp[k]===N.main)return this.cpos(k,o);}return o.copy(p);}
}
