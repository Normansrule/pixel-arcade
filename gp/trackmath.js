// KART GRAND PRIX — course geometry maths (no rendering): spline sampling, branches, ground queries.
// Conventions: y is up, a racer's yaw 0 faces +z, forward = (sin yaw, cos yaw); u > 0 is the LEFT side of the road.
import * as THREE from '../vendor/three.module.min.js';
export const STEP=2;
const V=THREE.Vector3;
export const SURF={road:0,off:1,mud:2,ice:3,sand:4,boost:5,lava:6,oil:7};

// Sample a Catmull-Rom spline through pts [[x,z,y,w],...] at constant arc-length spacing.
export function sampleSpline(pts,closed){
 const c=new THREE.CatmullRomCurve3(pts.map(p=>new V(p[0],p[2]||0,p[1])),closed,'centripetal');
 const cw=new THREE.CatmullRomCurve3(pts.map(p=>new V(p[3]||10,0,0)),closed,'catmullrom',.5);
 const M=pts.length*80,dense=[];let L=0,prev=null;
 for(let i=0;i<=M;i++){const t=i/M,p=c.getPoint(t),w=cw.getPoint(t).x;if(prev)L+=Math.hypot(p.x-prev.x,p.z-prev.z);dense.push({x:p.x,y:p.y,z:p.z,w,l:L});prev=p;}
 const n=closed?Math.max(8,Math.round(L/STEP)):Math.max(2,Math.round(L/STEP)+1),st=closed?L/n:L/(n-1);
 const B={n,len:L,step:st,closed,x:new Float32Array(n),y:new Float32Array(n),z:new Float32Array(n),w:new Float32Array(n),tx:new Float32Array(n),tz:new Float32Array(n),nx:new Float32Array(n),nz:new Float32Array(n),
  s:new Float32Array(n),slope:new Float32Array(n),curv:new Float32Array(n),flag:new Uint8Array(n),surf:new Uint8Array(n),line:new Float32Array(n),sh:new Float32Array(n),edge:new Uint8Array(n)};
 let j=0;for(let i=0;i<n;i++){const l=i*st;while(j<dense.length-2&&dense[j+1].l<l)j++;const a=dense[j],b=dense[j+1],f=b.l>a.l?(l-a.l)/(b.l-a.l):0;
  B.x[i]=a.x+(b.x-a.x)*f;B.y[i]=a.y+(b.y-a.y)*f;B.z[i]=a.z+(b.z-a.z)*f;B.w[i]=a.w+(b.w-a.w)*f;B.s[i]=l;}
 for(let i=0;i<n;i++){const a=closed?(i-1+n)%n:Math.max(0,i-1),b=closed?(i+1)%n:Math.min(n-1,i+1);let dx=B.x[b]-B.x[a],dz=B.z[b]-B.z[a];const d=Math.hypot(dx,dz)||1;dx/=d;dz/=d;B.tx[i]=dx;B.tz[i]=dz;B.nx[i]=dz;B.nz[i]=-dx;B.slope[i]=(B.y[b]-B.y[a])/d;}
 for(let i=0;i<n;i++){const a=closed?(i-3+n)%n:Math.max(0,i-3),b=closed?(i+3)%n:Math.min(n-1,i+3);let da=Math.atan2(B.tx[b],B.tz[b])-Math.atan2(B.tx[a],B.tz[a]);while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;B.curv[i]=da/(6*st);}
 return B;}

// flags
export const F={gap:1,water:2,glide:4,noWall:8,start:16,rail:32};

// Build every branch of a course definition. def.pts main loop; def.cuts [{a,b,pts,w,surf}] shortcuts (a,b fractions along main).
export function buildCourse(def,theme={}){
 const sc=def.sc||1,pts=def.pts.map(p=>[p[0]*sc,p[1]*sc,p[2]||0,p[3]||def.w||11]);
 const main=sampleSpline(pts,true);main.id=0;main.kind='main';main.a=0;main.b=1;
 const branches=[main];const sh=def.shoulder??4;main.sh.fill(sh);
 const at=(B,f)=>{const i=((Math.round(f*B.n)%B.n)+B.n)%B.n;return i;};
 for(const cdef of def.cuts||[]){const ia=at(main,cdef.a),ib=at(main,cdef.b),back=6;
  const P=(i,o)=>{const k=((i+o)%main.n+main.n)%main.n;return[main.x[k],main.z[k],main.y[k],cdef.w||7];};
  let mid;if(cdef.pts)mid=cdef.pts.map(p=>[p[0]*sc,p[1]*sc,p[2]!==undefined?p[2]:null,p[3]||cdef.w||7]);
  else{const A=P(ia,0),Bp=P(ib,0),dx=Bp[0]-A[0],dz=Bp[1]-A[1],dl=Math.hypot(dx,dz)||1,bend=cdef.bend||0;mid=[];for(let k=1;k<=3;k++){const t=k/4,bb=Math.sin(t*Math.PI)*bend;mid.push([A[0]+dx*t+dz/dl*bb,A[1]+dz*t-dx/dl*bb,null,cdef.w||7]);}}
  const ya=main.y[ia],yb=main.y[ib];mid.forEach((p,k)=>{if(p[2]===null)p[2]=ya+(yb-ya)*(k+1)/(mid.length+1);});
  const B=sampleSpline([P(ia,-back),P(ia,0),...mid,P(ib,0),P(ib,back)],false);B.kind='cut';B.id=branches.length;
  const span=((cdef.b-cdef.a)%1+1)%1;B.a=cdef.a-back/main.n;B.b=B.a+span+2*back/main.n;B.sh.fill(cdef.sh??2.5);
  if(cdef.surf)for(let i=0;i<B.n;i++){const e=Math.min(i,B.n-1-i)*B.step;if(e>back*STEP*.9)B.surf[i]=SURF[cdef.surf];}
  B.def=cdef;branches.push(B);}
 const C={def,branches,main,len:main.len,ramps:[],pads:[],grid:new Map(),cell:16,bbox:[1e9,1e9,-1e9,-1e9]};
 // features applied to samples
 const idx=f=>at(main,f),span=(f,len)=>{const i0=idx(f),n=Math.max(1,Math.round(len/main.step));return[i0,n];};
 for(const ft of def.feats||[]){
  const B=ft.cut!==undefined?branches[ft.cut+1]:main,i0=Math.round(((ft.s%1)+1)%1*(B.closed?B.n:B.n-1));
  if(ft.t==='gap'||ft.t==='water'||ft.t==='noWall'||ft.t==='rail'){const n=Math.round(ft.len/B.step);for(let k=0;k<n;k++){const i=(i0+k)%B.n;B.flag[i]|=F[ft.t];}}
  if(ft.t==='patch'){C.pads.push({kind:'patch',surf:SURF[ft.surf],B,i:i0,len:ft.len,u:ft.u||0,hw:ft.hw||4});}
  if(ft.t==='ramp'){C.ramps.push({B,i:i0,len:ft.len||12,h:ft.h||2.6,u0:(ft.u||0)-(ft.hw||99),u1:(ft.u||0)+(ft.hw||99),trick:ft.trick!==false,boost:!!ft.boost});}
  if(ft.t==='boost'||ft.t==='jump'||ft.t==='glide'){C.pads.push({kind:ft.t,B,i:i0,len:ft.len||(ft.t==='boost'?8:5),u:ft.u||0,hw:ft.hw||(ft.t==='glide'?99:3)});}
  if(ft.t==='surf'){const n=Math.round(ft.len/B.step);for(let k=0;k<n;k++){B.surf[(i0+k)%B.n]=SURF[ft.surf];}}
  if(ft.t==='sh'){const n=Math.round(ft.len/B.step);for(let k=0;k<n;k++){B.sh[(i0+k)%B.n]=ft.v;}}}
 for(const r of C.ramps)r.hw=Math.min(r.u1-r.u0,2*r.B.w[r.i])/2;
 // water flags from sea level
 const seaY=def.seaY??theme.seaY;C.seaY=seaY;if(seaY!==undefined)for(const B of branches)for(let i=0;i<B.n;i++)if(B.y[i]<seaY-.4)B.flag[i]|=F.water;
 // gaps also remove walls around them
 // spatial grid
 for(const B of branches)for(let i=0;i<B.n;i++){const k=key(B.x[i],B.z[i],C.cell);let a=C.grid.get(k);if(!a)C.grid.set(k,a=[]);a.push(B.id,i);
  C.bbox[0]=Math.min(C.bbox[0],B.x[i]-B.w[i]);C.bbox[1]=Math.min(C.bbox[1],B.z[i]-B.w[i]);C.bbox[2]=Math.max(C.bbox[2],B.x[i]+B.w[i]);C.bbox[3]=Math.max(C.bbox[3],B.z[i]+B.w[i]);}
 for(const B of branches)B.padAt=new Array(B.n).fill(null);
 for(const p of C.pads){const B=p.B,n=Math.max(1,Math.round(p.len/B.step));for(let k=0;k<=n;k++){const i=B.closed?(p.i+k)%B.n:Math.min(B.n-1,p.i+k);(B.padAt[i]||(B.padAt[i]=[])).push(p);}}
 racingLine(main);for(const B of branches)if(B!==main)B.line.fill(0);
 return C;}
const key=(x,z,c)=>(Math.floor(x/c)+512)*4096+(Math.floor(z/c)+512);

// Racing line: offset toward the inside of corners (smoothed curvature), clamped to the road.
function racingLine(B){const n=B.n,raw=new Float32Array(n);
 for(let i=0;i<n;i++){let c=0;for(let k=-12;k<=12;k++)c+=B.curv[(i+k+n)%n]*(1-Math.abs(k)/13);raw[i]=c/7;}
 for(let i=0;i<n;i++){B.line[i]=Math.max(-.62,Math.min(.62,raw[i]*55))*B.w[i];}
 for(let pass=0;pass<3;pass++){const t=B.line.slice();for(let i=0;i<n;i++){let s=0;for(let k=-6;k<=6;k++)s+=t[(i+k+n)%n];B.line[i]=s/13;}}}

// Nearest sample of one branch to (x,z) using the spatial grid; returns projected s/u.
const Q0={};
export function query(C,x,z,y=null,out={}){
 const c=C.cell,cx=Math.floor(x/c),cz=Math.floor(z/c);let best=null;
 const cand=[];// best per branch
 for(let r=1;r<=4&&!cand.length;r+=(r===1?1:2)){for(let a=-r;a<=r;a++)for(let b=-r;b<=r;b++){const L=C.grid.get((cx+a+512)*4096+(cz+b+512));if(!L)continue;
   for(let k=0;k<L.length;k+=2){const B=C.branches[L[k]],i=L[k+1],d=(B.x[i]-x)**2+(B.z[i]-z)**2;const e=cand[B.id];if(!e||d<e.d)cand[B.id]={B,i,d};}}}
 out.ok=false;out.inside=false;
 let pick=null,pickScore=1e18;
 for(const e of cand){if(!e)continue;const B=e.B,n=B.n;let i=e.i;
  // project onto segment i..i+1 or i-1..i
  let j=B.closed?(i+1)%n:Math.min(n-1,i+1),f=projF(B,i,j,x,z);if(f<0){const h=B.closed?(i-1+n)%n:Math.max(0,i-1);if(h!==i){j=i;i=h;f=projF(B,i,j,x,z);}}
  f=Math.max(0,Math.min(1,f));
  const px=B.x[i]+(B.x[j]-B.x[i])*f,pz=B.z[i]+(B.z[j]-B.z[i])*f,nx=B.nx[i]+(B.nx[j]-B.nx[i])*f,nz=B.nz[i]+(B.nz[j]-B.nz[i])*f,nl=Math.hypot(nx,nz)||1;
  const u=((x-px)*nx+(z-pz)*nz)/nl,w=B.w[i]+(B.w[j]-B.w[i])*f,sh=B.sh[i],by=B.y[i]+(B.y[j]-B.y[i])*f;
  const lim=w+sh,outBy=Math.abs(u)-lim;
  // prefer branches we're inside of; among them the closest in height
  let score=outBy>0?1e6+outBy:0;if(y!==null)score+=Math.abs(y-by)*(outBy>0?1:4);else score+=Math.abs(u)*.01;
  if(B.kind==='cut'&&outBy<=0){const e2=Math.min(i,B.n-1-i)*B.step;if(e2<6)score+=1;}
  if(score<pickScore){pickScore=score;pick={B,i,j,f,u,w,sh,by,nx:nx/nl,nz:nz/nl,lim};}}
 if(!pick)return out;
 const {B,i,j,f,u,w,sh,by}=pick;out.ok=true;out.B=B;out.i=f<.5?i:j;out.i0=i;out.f=f;out.u=u;out.w=w;out.lim=pick.lim;out.nx=pick.nx;out.nz=pick.nz;
 out.tx=B.tx[out.i];out.tz=B.tz[out.i];out.inside=Math.abs(u)<=pick.lim;out.onRoad=Math.abs(u)<=w;
 out.s=B.s[i]+(B.s[j]-B.s[i]+(j<i?B.len:0))*f;
 out.flag=B.flag[out.i];out.surf=out.onRoad?B.surf[out.i]:(B.surf[out.i]===SURF.road||B.surf[out.i]===SURF.boost?SURF.off:B.surf[out.i]);
 out.slope=B.slope[out.i];
 let yy=by;for(const r of C.ramps){if(r.B!==B)continue;let di=(out.i-r.i);if(B.closed){if(di<-B.n/2)di+=B.n;if(di>B.n/2)di-=B.n;}const d=(di+f)*B.step;if(d<0||d>r.len)continue;if(u<r.u0||u>r.u1)continue;yy+=r.h*Math.pow(d/r.len,1.3);out.ramp=r;}
 if(!out.ramp)out.ramp=null;
 out.y=yy;out.baseY=by;
 out.gap=!!(out.flag&F.gap);
 // global progress (fraction of main lap)
 out.prog=B.kind==='main'?out.s/B.len:B.a+(B.b-B.a)*(out.s/B.len);
 return out;}
function projF(B,i,j,x,z){const dx=B.x[j]-B.x[i],dz=B.z[j]-B.z[i],l=dx*dx+dz*dz||1;return((x-B.x[i])*dx+(z-B.z[i])*dz)/l;}

// world position at fraction f along the main loop with lateral offset u
export function at(B,f,u=0,o=new V()){const n=B.n;let t=(((f%1)+1)%1)*(B.closed?n:n-1);const i=Math.floor(t)%n,j=B.closed?(i+1)%n:Math.min(n-1,i+1),k=t-Math.floor(t);
 o.set(B.x[i]+(B.x[j]-B.x[i])*k+(B.nx[i])*u,B.y[i]+(B.y[j]-B.y[i])*k,B.z[i]+(B.z[j]-B.z[i])*k+(B.nz[i])*u);return o;}
export function yawAt(B,i){return Math.atan2(B.tx[i],B.tz[i]);}
