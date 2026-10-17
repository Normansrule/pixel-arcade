// CRITTER KART — course maths (no rendering): track generation (island polar loops + hand-built spline circuits),
// shortcut branches, jump gaps, sampling, ground queries, heightfield terrain.
// Conventions: y up, yaw 0 faces +z, forward=(sin yaw, cos yaw); lateral u>0 is the LEFT side of the road.
import * as THREE from '../vendor/three.module.min.js';
import {cl,lerp,sstep,fbm,ridge,rng} from './util.js';
export const STEP=2,SEA=0;

function trackFn(t){const{sx,sz,h}=t,R=t.R*(t.hub?1:1.18);const r=th=>{let k=1;for(const[n,a,p]of h)k+=a*Math.sin(n*th+p);return R*k;};
 const y=th=>{let v=t.y[0];for(const[n,a,p]of t.y[1])v+=a*Math.sin(n*th+p);return v;};return{r,y};}

// arc-length resample of a dense list [{p,w,l}]
function resample(dense,L,closed){const n=closed?Math.max(8,Math.round(L/STEP)):Math.max(2,Math.round(L/STEP)+1),st=closed?L/n:L/(n-1);
 const B={n,len:L,step:st,closed,x:new Float32Array(n),y:new Float32Array(n),z:new Float32Array(n),w:new Float32Array(n),tx:new Float32Array(n),tz:new Float32Array(n),ty:new Float32Array(n),nx:new Float32Array(n),nz:new Float32Array(n),
  s:new Float32Array(n),curv:new Float32Array(n),line:new Float32Array(n),wet:new Uint8Array(n),ice:new Uint8Array(n),ramp:new Float32Array(n),gap:new Uint8Array(n)};
 let j=0;for(let i=0;i<n;i++){const l=i*st;while(j<dense.length-2&&dense[j+1].l<l)j++;const a=dense[j],b=dense[j+1],f=b.l>a.l?(l-a.l)/(b.l-a.l):0;
  B.x[i]=lerp(a.p.x,b.p.x,f);B.y[i]=lerp(a.p.y,b.p.y,f);B.z[i]=lerp(a.p.z,b.p.z,f);B.w[i]=lerp(a.w,b.w,f);B.s[i]=l;}
 const md=i=>closed?((i%n)+n)%n:cl(i,0,n-1);
 for(let i=0;i<n;i++){const a=md(i-1),b=md(i+1);let dx=B.x[b]-B.x[a],dz=B.z[b]-B.z[a],dy=B.y[b]-B.y[a];const d=Math.hypot(dx,dz)||1;B.tx[i]=dx/d;B.tz[i]=dz/d;B.ty[i]=dy/d;B.nx[i]=dz/d;B.nz[i]=-dx/d;}
 for(let i=0;i<n;i++){const a=md(i-3),b=md(i+3);let da=Math.atan2(B.tx[b],B.tz[b])-Math.atan2(B.tx[a],B.tz[a]);while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;B.curv[i]=da/(Math.max(1,(b-a))*st);}
 return B;}
function denseOf(curve,wf,M,flat3){const dense=[];let L=0,prev=null;for(let i=0;i<=M;i++){const t=i/M,p=curve.getPoint(t);if(prev)L+=Math.hypot(p.x-prev.x,p.z-prev.z,flat3?(p.y-prev.y):0);dense.push({p,w:wf(t),l:L});prev=p;}return{dense,L};}

export function buildCourse(t){
 let B,F=null;const plane=t.veh==='plane';
 if(t.pts){// hand-built circuit
  const sc=t.sc||1,P=t.pts.map(p=>new THREE.Vector3(p[0]*sc,p[2]||0,p[1]*sc));const curve=new THREE.CatmullRomCurve3(P,true,'centripetal');
  const wc=new THREE.CatmullRomCurve3(t.pts.map(p=>new THREE.Vector3(p[3]||t.wd,0,0)),true,'catmullrom',.5);
  const{dense,L}=denseOf(curve,f=>wc.getPoint(f).x,t.pts.length*60,false);B=resample(dense,L,true);}
 else{F=trackFn(t);const N=72,pts=[];
  const wet=f=>{if(!t.water)return 0;let m=0;for(const[a,b]of t.water){const e=.03;m=Math.max(m,sstep(a,a+e,f)*(1-sstep(b-e,b,f)));}return m;};
  for(let i=0;i<N;i++){const f=i/N,th=f*Math.PI*2,r=F.r(th);let y=F.y(th);const wv=wet(f);y=lerp(y,-1.4,wv);pts.push(new THREE.Vector3(Math.cos(th)*r*t.sx,y,Math.sin(th)*r*t.sz));}
  const curve=new THREE.CatmullRomCurve3(pts,true,'centripetal');const{dense,L}=denseOf(curve,()=>t.wd,N*40,plane);B=resample(dense,L,true);}
 const n=B.n,L=B.len,st=B.step;B.def=t;
 for(let i=0;i<n;i++)B.wet[i]=B.y[i]<SEA-.3?1:0;
 // racing line: lean to the inside of upcoming corners
 const raw=new Float32Array(n);for(let i=0;i<n;i++){let c=0;for(let k=-10;k<=14;k++)c+=B.curv[(i+k+n)%n]*(1-Math.abs(k-2)/16);raw[i]=c/9;}
 for(let i=0;i<n;i++)B.line[i]=cl(raw[i]*60,-.6,.6)*B.w[i];
 for(let p=0;p<3;p++){const tt=B.line.slice();for(let i=0;i<n;i++){let s=0;for(let k=-6;k<=6;k++)s+=tt[(i+k+n)%n];B.line[i]=s/13;}}
 // features
 const idx=f=>((Math.round(f*n)%n)+n)%n;
 for(const f of t.ramps||[]){const i0=idx(f),len=Math.round(12/st);for(let k=0;k<len;k++)B.ramp[(i0+k)%n]=(k+1)/len;}
 for(const[a,b]of t.ice||[])for(let i=idx(a);i!==idx(b);i=(i+1)%n)B.ice[i]=1;
 const gaps=[];for(const[f,len]of t.gaps||[]){const i0=idx(f),k=Math.round(len/st);for(let j=0;j<k;j++)B.gap[(i0+j)%n]=1;const im=(i0+(k>>1))%n;gaps.push({i0,i1:(i0+k)%n,k,im,len,x:B.x[im],z:B.z[im],y:B.y[im],tx:B.tx[im],tz:B.tz[im]});}
 const C={def:t,B,fn:F,len:L,boosts:[],pods:[],berries:[],coins:[],rings:[],ramps:(t.ramps||[]).map(f=>idx(f)),cuts:[],gaps,haz:[]};
 // shortcut branches
 for(const cd of t.cuts||[]){const ia=idx(cd.a),ib=idx(cd.b),back=5,w=cd.w||5;
  const MP=(i,o)=>{const k=((i+o)%n+n)%n;return new THREE.Vector3(B.x[k],B.y[k],B.z[k]);};
  const A=MP(ia,0),Bp=MP(ib,0),dx=Bp.x-A.x,dz=Bp.z-A.z,dl=Math.hypot(dx,dz)||1,mid=[];
  for(let k=1;k<=3;k++){const tt=k/4,bb=Math.sin(tt*Math.PI)*(cd.bend||0);mid.push(new THREE.Vector3(A.x+dx*tt+dz/dl*bb,lerp(A.y,Bp.y,sstep(0,1,tt)),A.z+dz*tt-dx/dl*bb));}
  const pts=[MP(ia,-back),A,...mid,Bp,MP(ib,back)];const curve=new THREE.CatmullRomCurve3(pts,false,'centripetal');
  const{dense,L:cl_}=denseOf(curve,f=>{const e=Math.min(f,1-f);return lerp(B.w[ia],w,sstep(.06,.16,e));},400,false);
  const K=resample(dense,cl_,false);K.ia=(ia-back+n)%n;K.span=((ib-ia+n)%n)+2*back;K.surf=cd.surf||'off';K.def=cd;K.id=C.cuts.length;
  K.off=new Uint8Array(K.n);for(let i=0;i<K.n;i++){const e=Math.min(i,K.n-1-i)*K.step;K.off[i]=e>back*st+6?(K.surf==='off'?1:K.surf==='rough'?2:0):0;if(K.surf==='ice'&&e>back*st+4)K.ice[i]=1;}
  C.cuts.push(K);}
 const r=rng(t.seed||1);
 for(const f of t.boosts||[]){const i=idx(f);if(B.wet[i]&&t.veh!=='hover')continue;if(B.gap[i])continue;C.boosts.push({i,u:(r()-.5)*B.w[i]*.9,len:7});}
 for(const K of C.cuts)if(K.surf!=='off'){C.boosts.push({cut:K,i:Math.round(K.n*.42),u:0,len:7});}
 for(const f of t.pods||[]){const i=idx(f);for(const k of[-1,0,1])C.pods.push({i,u:k*B.w[i]*.55,dy:0,t:0});}
 // berries: lines of 4 along the racing line
 const nb=plane?5:6;for(let k=0;k<nb;k++){const f=(k+.55)/nb+(r()-.5)*.04,i0=idx(f),off=(r()-.5)*B.w[i0]*1.1;for(let q=0;q<4;q++){const i=(i0+q*3)%n;if(B.gap[i])continue;C.berries.push({i,u:off,dy:plane?(r()-.5)*4:0,t:0});}}
 // berries on the shortcuts reward the risk
 for(const K of C.cuts){for(let q=0;q<3;q++){const ci=Math.round(K.n*(.35+q*.12));C.berries.push({cut:K,i:ci,u:0,dy:0,t:0});}}
 // silver coins: 8 tricky spots
 for(let k=0;k<8;k++){let i=idx((k+.3)/8+r()*.05);while(B.gap[i])i=(i+3)%n;const side=k%2?1:-1;C.coins.push({i,u:side*B.w[i]*(.7+r()*.25),dy:plane?(r()<.5?6:-5):0,got:0});}
 if(plane){const gap=Math.round(44/st);for(let i=Math.round(20/st),k=0;i<n-6;i+=gap,k++)C.rings.push({i,gold:k%3===2,r:k%3===2?5.5:7.5,flash:0});}
 // hazards (logic + meshes live in hazards.js)
 for(const h of t.haz||[])C.haz.push({...h,i:idx(h.f)});
 return C;}

// main-loop index a branch sample maps to (for progress, racing line, ranks)
export function cutMain(C,K,ci){return Math.round(K.ia+K.span*(ci/(K.n-1)))%C.B.n;}

function nearestOn(K,x,z){let best=1e18,bi=0;for(let i=0;i<K.n;i++){const d=(K.x[i]-x)**2+(K.z[i]-z)**2;if(d<best){best=d;bi=i;}}return bi;}
// project (x,z) onto sample segment of branch/loop K around index bi
function project(K,bi,x,z,out){const n=K.n,closed=K.closed;let i=bi,j=closed?(i+1)%n:Math.min(n-1,i+1);let dx=K.x[j]-K.x[i],dz=K.z[j]-K.z[i],ll=dx*dx+dz*dz||1,f=((x-K.x[i])*dx+(z-K.z[i])*dz)/ll;
 if(f<0&&(closed||i>0)){j=i;i=closed?(i-1+n)%n:i-1;dx=K.x[j]-K.x[i];dz=K.z[j]-K.z[i];ll=dx*dx+dz*dz||1;f=((x-K.x[i])*dx+(z-K.z[i])*dz)/ll;}
 f=cl(f,0,1);const px=K.x[i]+dx*f,pz=K.z[i]+dz*f,nx=lerp(K.nx[i],K.nx[j],f),nz=lerp(K.nz[i],K.nz[j],f);
 out.i0=i;out.j0=j;out.f=f;out.u=(x-px)*nx+(z-pz)*nz;out.nx=nx;out.nz=nz;out.ii=f<.5?i:j;return out;}
const _p={};
// nearest sample search near a hint index (racers keep their last index); checks shortcut branches near their mouths
export function query(C,x,z,hint=-1,out={},y=null){const B=C.B,n=B.n;let best=1e18,bi=0;
 if(hint<0){for(let i=0;i<n;i+=2){const d=(B.x[i]-x)**2+(B.z[i]-z)**2+(y!==null?(B.y[i]-y)**2*.5:0);if(d<best){best=d;bi=i;}}hint=bi;best=1e18;}
 for(let k=-24;k<=24;k++){const i=(hint+k+n)%n,d=(B.x[i]-x)**2+(B.z[i]-z)**2+(y!==null?(B.y[i]-y)**2*.5:0);if(d<best){best=d;bi=i;}}
 project(B,bi,x,z,_p);const i=_p.i0,j=_p.j0,f=_p.f;
 out.cut=null;out.ci=-1;out.i=_p.ii;out.i0=i;out.f=f;out.u=_p.u;out.w=B.w[out.i];out.s=B.s[i]+f*B.step;out.prog=out.s/B.len;
 out.roadY=lerp(B.y[i],B.y[j],f);const rp=B.ramp[out.i];out.rampH=rp>0&&Math.abs(out.u)<out.w?Math.pow(rp,1.4)*2.6:0;out.rampTop=rp>.92;
 out.tx=B.tx[out.i];out.tz=B.tz[out.i];out.nx=_p.nx;out.nz=_p.nz;out.wet=B.wet[out.i];out.ice=B.ice[out.i];out.offSurf=0;out.gap=B.gap[out.i]&&Math.abs(out.u)<out.w+.6?1:0;
 // gap zone: the pit runs well beyond the road edges
 out.gapZone=0;for(const g of C.gaps){let d=out.i-g.im;if(d>n/2)d-=n;if(d<-n/2)d+=n;if(Math.abs(d)<=(g.k>>1)+1&&Math.abs(out.u)<out.w+60){out.gapZone=1;break;}}
 if(C.cuts.length){const outM=Math.abs(out.u)-out.w;
  for(const K of C.cuts){let d=(out.i-K.ia+n)%n;if(d>K.span+14&&d<n-14)continue;const ci=nearestOn(K,x,z);const p=project(K,ci,x,z,{});const w=lerp(K.w[p.i0],K.w[p.j0],p.f),oc=Math.abs(p.u)-w;
   if(oc<outM-.5&&oc<6){const ii=p.ii;out.cut=K;out.ci=ii;out.u=p.u;out.w=w;out.nx=p.nx;out.nz=p.nz;out.tx=K.tx[ii];out.tz=K.tz[ii];out.roadY=lerp(K.y[p.i0],K.y[p.j0],p.f);out.rampH=0;out.rampTop=false;
    out.i=cutMain(C,K,ii);out.s=(K.ia*B.step+K.span*B.step*(K.s[p.i0]+p.f*K.step)/K.len)%B.len;out.prog=out.s/B.len;out.wet=0;out.ice=K.ice[ii];out.offSurf=K.off[ii];out.gap=0;out.gapZone=0;break;}}}
 return out;}
export function at(C,i,u=0,o=new THREE.Vector3()){const B=C.B,n=B.n;i=((i%n)+n)%n;const a=Math.floor(i),b=(a+1)%n,f=i-a;o.set(lerp(B.x[a],B.x[b],f)+B.nx[a]*u,lerp(B.y[a],B.y[b],f),lerp(B.z[a],B.z[b],f)+B.nz[a]*u);return o;}
export function atK(K,i,u=0,o=new THREE.Vector3()){i=cl(Math.round(i),0,K.n-1);o.set(K.x[i]+K.nx[i]*u,K.y[i],K.z[i]+K.nz[i]*u);return o;}
export const yawAt=(C,i)=>{const B=C.B;i=((Math.round(i)%B.n)+B.n)%B.n;return Math.atan2(B.tx[i],B.tz[i]);};

/* ---------- heightfield terrain ---------- */
export function buildTerrain(C,theme){const B=C.B,t=C.def,plane=t.veh==='plane',hover=t.veh==='hover',hub=!!t.hub,circ=!!t.pts;
 let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<B.n;i++){x0=Math.min(x0,B.x[i]);x1=Math.max(x1,B.x[i]);z0=Math.min(z0,B.z[i]);z1=Math.max(z1,B.z[i]);}
 const pad=plane?320:circ?280:260,cs=plane?4:3;x0-=pad;z0-=pad;x1+=pad;z1+=pad;const nx=Math.ceil((x1-x0)/cs)+1,nz=Math.ceil((z1-z0)/cs)+1;
 const RAD=circ?190:130,D=new Float32Array(nx*nz).fill(1e4),TY=new Float32Array(nx*nz),H=new Float32Array(nx*nz),RW=new Float32Array(nx*nz).fill(t.wd),NI=new Int32Array(nx*nz).fill(-1);
 let ym=0;for(let i=0;i<B.n;i++)ym+=B.y[i];ym/=B.n;
 const stamp=(K,i)=>{const cx=(K.x[i]-x0)/cs,cz=(K.z[i]-z0)/cs,rr=Math.ceil(RAD/cs);for(let a=Math.max(0,Math.floor(cz-rr));a<=Math.min(nz-1,Math.ceil(cz+rr));a++)for(let b=Math.max(0,Math.floor(cx-rr));b<=Math.min(nx-1,Math.ceil(cx+rr));b++){
   const k=a*nx+b,px=x0+b*cs,pz=z0+a*cs,d=Math.hypot(px-K.x[i],pz-K.z[i]);if(d<D[k]){D[k]=d;TY[k]=K.y[i];RW[k]=K.w[i];NI[k]=K===B?i:-1;}}};
 for(let i=0;i<B.n;i+=2)stamp(B,i);for(const K of C.cuts)for(let i=0;i<K.n;i+=2)stamp(K,i);
 // inside test for circuits: scanline fill of the main loop polygon
 let IN=null;if(circ){IN=new Uint8Array(nx*nz);for(let a=0;a<nz;a++){const pz=z0+a*cs,xs=[];for(let i=0;i<B.n;i++){const j=(i+1)%B.n,za=B.z[i],zb=B.z[j];if((za<=pz)!==(zb<=pz)){xs.push(B.x[i]+(pz-za)/(zb-za)*(B.x[j]-B.x[i]));}}
  xs.sort((p,q)=>p-q);for(let k=0;k+1<xs.length;k+=2){const b0=Math.max(0,Math.ceil((xs[k]-x0)/cs)),b1=Math.min(nx-1,Math.floor((xs[k+1]-x0)/cs));for(let b=b0;b<=b1;b++)IN[a*nx+b]=1;}}}
 // smoothed road height for the far terrain (avoids creases where the nearest road switches)
 let TS=TY;if(circ){TS=new Float32Array(nx*nz);for(let k=0;k<TY.length;k++)TS[k]=D[k]<1e4?lerp(TY[k],ym,sstep(RAD*.45,RAD,D[k])):ym;const tmp=new Float32Array(nx*nz),R=6;
  for(let pass=0;pass<2;pass++){for(let a=0;a<nz;a++){let acc=0,cnt=0;for(let b=-R;b<nx+R;b++){if(b+R<nx){acc+=TS[a*nx+b+R];cnt++;}if(b-R-1>=0){acc-=TS[a*nx+b-R-1];cnt--;}if(b>=0&&b<nx)tmp[a*nx+b]=acc/cnt;}}
   for(let b=0;b<nx;b++){let acc=0,cnt=0;for(let a=-R;a<nz+R;a++){if(a+R<nz){acc+=tmp[(a+R)*nx+b];cnt++;}if(a-R-1>=0){acc-=tmp[(a-R-1)*nx+b];cnt--;}if(a>=0&&a<nz)TS[a*nx+b]=acc/cnt;}}}}
 const F=C.fn,peakH=t.peak?95:t.peak===0?40:0,HL=theme.hills||10,CO=theme.coast||60;
 for(let a=0;a<nz;a++)for(let b=0;b<nx;b++){const k=a*nx+b,px=x0+b*cs,pz=z0+a*cs,d=D[k],ty=d<1e4?TY[k]:circ?ym:0,ts=circ?TS[k]:ty,w=d<1e4?RW[k]:t.wd;
  const n1=fbm(px*.012,pz*.012,4),n2=ridge(px*.006+3,pz*.006-2);let far;
  if(circ){const inside=IN[k];const hills=(n1*.5+.5)*HL*.55+n2*HL*.8*sstep(30,110,d);
   if(inside)far=ts-.4+hills*sstep(w+6,w+70,d)+(theme.snow?n2*14*sstep(60,140,d):0);
   else{const e=d;let land=ts-.4+hills*sstep(w+8,w+80,e)*1.2+(theme.snow?n2*46*sstep(90,190,e):theme.night?n2*18*sstep(90,190,e):n2*22*sstep(110,200,e));
    if(CO<40)land=lerp(land,-12,sstep(CO,CO+60,e));far=land;}}
  else{const qx=px/t.sx,qz=pz/t.sz,th=Math.atan2(qz,qx),rr=Math.hypot(qx,qz),rt=F.r(th<0?th+Math.PI*2:th),inside=rr<rt;
   if(inside){const c=1-rr/rt;far=4+n1*HL*.5+(hub?0:n2*HL*sstep(.12,.45,c))+peakH*Math.pow(sstep(.2,1,c),1.4)+(hub?sstep(.45,1,c)*28:0);}
   else{const e=Math.min(d,(rr-rt)*1.1);const land=(3+n1*HL*.4+n2*HL*sstep(14,60,e)*(plane?1.3:1))*(1-sstep(CO,CO+55,e));far=land-12*sstep(CO+8,CO+90,e)+(theme.snow?n2*34*sstep(130,220,e)*(1-sstep(240,300,e)):0);}}
  let h;
  if(plane){h=far;const cap=ty-14+sstep(26,90,d)*400;h=Math.min(h,cap);if(d<1e4&&d<30)h=Math.min(h,ty-16);}
  else if(hover&&ty<SEA){const near=-2.6;h=lerp(near,Math.max(far,1.2),sstep(w+4,w+34,d));if(d<w+4)h=near;}
  else{const near=ty-.3;h=lerp(near,far,sstep(w+3,w+46,d));const bank=sstep(w+2,w+10,d)*(1-sstep(w+16,w+46,d))*1.4;h+=bank;if(d<w+3)h=near;}
  H[k]=h;}
 // carve the jump gaps: a trench across the road and well beyond its edges
 for(const g of C.gaps){const gx=g.x,gz=g.z,tx=g.tx,tz=g.tz,half=g.len/2,wide=t.wd+64;
  const r=Math.ceil((wide+half+10)/cs),cx=Math.round((gx-x0)/cs),cz=Math.round((gz-z0)/cs);
  for(let a=Math.max(0,cz-r);a<=Math.min(nz-1,cz+r);a++)for(let b=Math.max(0,cx-r);b<=Math.min(nx-1,cx+r);b++){const px=x0+b*cs-gx,pz=z0+a*cs-gz,al=px*tx+pz*tz,lat=Math.abs(px*tz-pz*tx);
   const k=a*nx+b;if(D[k]<1e4){const ni=NI[k];if(ni<0)continue;let di=ni-g.im;if(di>B.n/2)di-=B.n;if(di<-B.n/2)di+=B.n;if(Math.abs(di)>(g.k>>1)+14)continue;}
   const m=(1-sstep(half-1,half+5,Math.abs(al)))*(1-sstep(wide-14,wide,lat));if(m<=0)continue;const floor=g.y-10;H[k]=lerp(H[k],Math.min(H[k],floor),m);}}
 const T={x0,z0,cs,nx,nz,H,D,
  h(x,z){const fx=cl((x-x0)/cs,0,nx-1.001),fz=cl((z-z0)/cs,0,nz-1.001),b=Math.floor(fx),a=Math.floor(fz),u=fx-b,v=fz-a,k=a*nx+b;return lerp(lerp(H[k],H[k+1],u),lerp(H[k+nx],H[k+nx+1],u),v);},
  d(x,z){const b=cl(Math.round((x-x0)/cs),0,nx-1),a=cl(Math.round((z-z0)/cs),0,nz-1);return D[a*nx+b];}};
 return T;}
