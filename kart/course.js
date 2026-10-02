// CRITTER KART — course maths (no rendering): track generation, sampling, queries, heightfield terrain.
// Conventions: y up, yaw 0 faces +z, forward=(sin yaw, cos yaw); lateral u>0 is the LEFT side of the road.
import * as THREE from '../vendor/three.module.min.js';
import {cl,lerp,sstep,fbm,ridge,rng} from './util.js';
export const STEP=2,SEA=0;

function trackFn(t){const{sx,sz,h}=t,R=t.R*(t.hub?1:1.18);const r=th=>{let k=1;for(const[n,a,p]of h)k+=a*Math.sin(n*th+p);return R*k;};
 const y=th=>{let v=t.y[0];for(const[n,a,p]of t.y[1])v+=a*Math.sin(n*th+p);return v;};return{r,y};}

export function buildCourse(t){
 const F=trackFn(t),N=72,pts=[];
 const wet=f=>{if(!t.water)return 0;let m=0;for(const[a,b]of t.water){const e=.03;m=Math.max(m,sstep(a,a+e,f)*(1-sstep(b-e,b,f)));}return m;};
 for(let i=0;i<N;i++){const f=i/N,th=f*Math.PI*2,r=F.r(th);let y=F.y(th);const wv=wet(f);y=lerp(y,-1.4,wv);pts.push(new THREE.Vector3(Math.cos(th)*r*t.sx,y,Math.sin(th)*r*t.sz));}
 const curve=new THREE.CatmullRomCurve3(pts,true,'centripetal');
 const M=N*40,dense=[];let L=0,prev=null;for(let i=0;i<=M;i++){const p=curve.getPoint(i/M);if(prev)L+=Math.hypot(p.x-prev.x,p.z-prev.z,(p.y-prev.y)*(t.veh==='plane'?1:0));dense.push({p,l:L});prev=p;}
 const n=Math.round(L/STEP),st=L/n;
 const B={n,len:L,step:st,def:t,x:new Float32Array(n),y:new Float32Array(n),z:new Float32Array(n),w:new Float32Array(n),tx:new Float32Array(n),tz:new Float32Array(n),ty:new Float32Array(n),nx:new Float32Array(n),nz:new Float32Array(n),
  s:new Float32Array(n),curv:new Float32Array(n),line:new Float32Array(n),wet:new Uint8Array(n),ice:new Uint8Array(n),ramp:new Float32Array(n),boost:new Uint8Array(n)};
 let j=0;for(let i=0;i<n;i++){const l=i*st;while(j<dense.length-2&&dense[j+1].l<l)j++;const a=dense[j],b=dense[j+1],f=b.l>a.l?(l-a.l)/(b.l-a.l):0;
  B.x[i]=lerp(a.p.x,b.p.x,f);B.y[i]=lerp(a.p.y,b.p.y,f);B.z[i]=lerp(a.p.z,b.p.z,f);B.s[i]=l;B.w[i]=t.wd;}
 for(let i=0;i<n;i++){const a=(i-1+n)%n,b=(i+1)%n;let dx=B.x[b]-B.x[a],dz=B.z[b]-B.z[a],dy=B.y[b]-B.y[a];const d=Math.hypot(dx,dz)||1;B.tx[i]=dx/d;B.tz[i]=dz/d;B.ty[i]=dy/d;B.nx[i]=dz/d;B.nz[i]=-dx/d;B.wet[i]=B.y[i]<SEA-.3?1:0;}
 for(let i=0;i<n;i++){const a=(i-3+n)%n,b=(i+3)%n;let da=Math.atan2(B.tx[b],B.tz[b])-Math.atan2(B.tx[a],B.tz[a]);while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;B.curv[i]=da/(6*st);}
 // racing line: lean to the inside of upcoming corners
 const raw=new Float32Array(n);for(let i=0;i<n;i++){let c=0;for(let k=-10;k<=14;k++)c+=B.curv[(i+k+n)%n]*(1-Math.abs(k-2)/16);raw[i]=c/9;}
 for(let i=0;i<n;i++)B.line[i]=cl(raw[i]*60,-.6,.6)*B.w[i];
 for(let p=0;p<3;p++){const tt=B.line.slice();for(let i=0;i<n;i++){let s=0;for(let k=-6;k<=6;k++)s+=tt[(i+k+n)%n];B.line[i]=s/13;}}
 // features
 const idx=f=>((Math.round(f*n)%n)+n)%n;
 for(const f of t.ramps||[]){const i0=idx(f),len=Math.round(12/st);for(let k=0;k<len;k++)B.ramp[(i0+k)%n]=(k+1)/len;}
 for(const[a,b]of t.ice||[])for(let i=idx(a);i!==idx(b);i=(i+1)%n)B.ice[i]=1;
 const C={def:t,B,fn:F,len:L,boosts:[],pods:[],berries:[],coins:[],rings:[],ramps:(t.ramps||[]).map(f=>idx(f))};
 const r=rng(t.seed||1),plane=t.veh==='plane';
 for(const f of t.boosts||[]){const i=idx(f);if(B.wet[i]&&t.veh!=='hover')continue;C.boosts.push({i,u:(r()-.5)*B.w[i]*.9,len:7});}
 for(const f of t.pods||[]){const i=idx(f);for(const k of[-1,0,1])C.pods.push({i,u:k*B.w[i]*.55,dy:plane?k*0:0,t:0});}
 // berries: lines of 4 along the racing line
 const nb=plane?5:6;for(let k=0;k<nb;k++){const f=(k+.55)/nb+(r()-.5)*.04,i0=idx(f),off=(r()-.5)*B.w[i0]*1.1;for(let q=0;q<4;q++){const i=(i0+q*3)%n;C.berries.push({i,u:off,dy:plane?(r()-.5)*4:0,t:0});}}
 // silver coins: 8 tricky spots
 for(let k=0;k<8;k++){const i=idx((k+.3)/8+r()*.05),side=k%2?1:-1;C.coins.push({i,u:side*B.w[i]*(.7+r()*.25),dy:plane?(r()<.5?6:-5):0,got:0});}
 if(plane){const gap=Math.round(44/st);for(let i=Math.round(20/st),k=0;i<n-6;i+=gap,k++)C.rings.push({i,gold:k%3===2,r:k%3===2?5.5:7.5,flash:0});}
 return C;}

// nearest sample search near a hint index (racers keep their last index)
export function query(C,x,z,hint=-1,out={},y=null){const B=C.B,n=B.n;let best=1e18,bi=0;
 if(hint<0){for(let i=0;i<n;i+=2){const d=(B.x[i]-x)**2+(B.z[i]-z)**2+(y!==null?(B.y[i]-y)**2*.5:0);if(d<best){best=d;bi=i;}}hint=bi;best=1e18;}
 for(let k=-24;k<=24;k++){const i=(hint+k+n)%n,d=(B.x[i]-x)**2+(B.z[i]-z)**2+(y!==null?(B.y[i]-y)**2*.5:0);if(d<best){best=d;bi=i;}}
 // project onto segment
 let i=bi,j=(i+1)%n;let dx=B.x[j]-B.x[i],dz=B.z[j]-B.z[i],ll=dx*dx+dz*dz||1,f=((x-B.x[i])*dx+(z-B.z[i])*dz)/ll;
 if(f<0){j=i;i=(i-1+n)%n;dx=B.x[j]-B.x[i];dz=B.z[j]-B.z[i];ll=dx*dx+dz*dz||1;f=((x-B.x[i])*dx+(z-B.z[i])*dz)/ll;}
 f=cl(f,0,1);const px=B.x[i]+dx*f,pz=B.z[i]+dz*f,nx=lerp(B.nx[i],B.nx[j],f),nz=lerp(B.nz[i],B.nz[j],f);
 out.i=f<.5?i:j;out.i0=i;out.f=f;out.u=(x-px)*nx+(z-pz)*nz;out.w=B.w[out.i];out.s=B.s[i]+f*B.step;out.prog=out.s/B.len;
 out.roadY=lerp(B.y[i],B.y[j],f);const rp=B.ramp[out.i];out.rampH=rp>0&&Math.abs(out.u)<out.w?Math.pow(rp,1.4)*2.6:0;out.rampTop=rp>.92;
 out.tx=B.tx[out.i];out.tz=B.tz[out.i];out.nx=nx;out.nz=nz;out.wet=B.wet[out.i];out.ice=B.ice[out.i];return out;}
export function at(C,i,u=0,o=new THREE.Vector3()){const B=C.B,n=B.n;i=((i%n)+n)%n;const a=Math.floor(i),b=(a+1)%n,f=i-a;o.set(lerp(B.x[a],B.x[b],f)+B.nx[a]*u,lerp(B.y[a],B.y[b],f),lerp(B.z[a],B.z[b],f)+B.nz[a]*u);return o;}
export const yawAt=(C,i)=>{const B=C.B;i=((Math.round(i)%B.n)+B.n)%B.n;return Math.atan2(B.tx[i],B.tz[i]);};

/* ---------- heightfield terrain ---------- */
export function buildTerrain(C,theme){const B=C.B,t=C.def,plane=t.veh==='plane',hover=t.veh==='hover',hub=!!t.hub;
 let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<B.n;i++){x0=Math.min(x0,B.x[i]);x1=Math.max(x1,B.x[i]);z0=Math.min(z0,B.z[i]);z1=Math.max(z1,B.z[i]);}
 const pad=plane?320:260,cs=plane?4:3;x0-=pad;z0-=pad;x1+=pad;z1+=pad;const nx=Math.ceil((x1-x0)/cs)+1,nz=Math.ceil((z1-z0)/cs)+1;
 const D=new Float32Array(nx*nz).fill(1e4),TY=new Float32Array(nx*nz),H=new Float32Array(nx*nz),RAD=130;
 for(let i=0;i<B.n;i+=2){const cx=(B.x[i]-x0)/cs,cz=(B.z[i]-z0)/cs,rr=Math.ceil(RAD/cs);for(let a=Math.max(0,Math.floor(cz-rr));a<=Math.min(nz-1,Math.ceil(cz+rr));a++)for(let b=Math.max(0,Math.floor(cx-rr));b<=Math.min(nx-1,Math.ceil(cx+rr));b++){
   const k=a*nx+b,px=x0+b*cs,pz=z0+a*cs,d=Math.hypot(px-B.x[i],pz-B.z[i]);if(d<D[k]){D[k]=d;TY[k]=B.y[i];}}}
 const F=C.fn,hil=theme.snow?1.6:theme.night?1.1:1,peakH=t.peak?95:t.peak===0?40:0;
 for(let a=0;a<nz;a++)for(let b=0;b<nx;b++){const k=a*nx+b,px=x0+b*cs,pz=z0+a*cs,d=D[k],ty=d<1e4?TY[k]:0;
  const qx=px/t.sx,qz=pz/t.sz,th=Math.atan2(qz,qx),rr=Math.hypot(qx,qz),rt=F.r(th<0?th+Math.PI*2:th),inside=rr<rt;
  const n1=fbm(px*.012,pz*.012,4),n2=ridge(px*.006+3,pz*.006-2);
  const HL=theme.hills||10,CO=theme.coast||60;let far;
  if(inside){const c=1-rr/rt;far=4+n1*HL*.5+(hub?0:n2*HL*sstep(.12,.45,c))+peakH*Math.pow(sstep(.2,1,c),1.4)+(hub?sstep(.45,1,c)*28:0);}
  else{const e=Math.min(d,(rr-rt)*1.1);const land=(3+n1*HL*.4+n2*HL*sstep(14,60,e)*(plane?1.3:1))*(1-sstep(CO,CO+55,e));far=land-12*sstep(CO+8,CO+90,e)+(theme.snow?n2*34*sstep(130,220,e)*(1-sstep(240,300,e)):0);}
  let h;const w=t.wd;
  if(plane){h=far;const cap=ty-14+sstep(26,90,d)*400;h=Math.min(h,cap);if(d<1e4&&d<30)h=Math.min(h,ty-16);}
  else if(hover&&ty<SEA){const near=-2.6;h=lerp(near,Math.max(far,1.2),sstep(w+4,w+34,d));if(d<w+4)h=near;}
  else{const near=ty-.3;h=lerp(near,far,sstep(w+3,w+46,d));const bank=sstep(w+2,w+10,d)*(1-sstep(w+16,w+46,d))*1.4;h+=bank;if(d<w+3)h=near;}
  H[k]=h;}
 const T={x0,z0,cs,nx,nz,H,D,
  h(x,z){const fx=cl((x-x0)/cs,0,nx-1.001),fz=cl((z-z0)/cs,0,nz-1.001),b=Math.floor(fx),a=Math.floor(fz),u=fx-b,v=fz-a,k=a*nx+b;return lerp(lerp(H[k],H[k+1],u),lerp(H[k+nx],H[k+nx+1],u),v);},
  d(x,z){const b=cl(Math.round((x-x0)/cs),0,nx-1),a=cl(Math.round((z-z0)/cs),0,nz-1);return D[a*nx+b];}};
 return T;}
