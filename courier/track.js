// TIDEWAY COURIER — course maths (no rendering): the one hand-built harbor loop, arc-length samples, edge rules
// (quay walls, open beaches, bridge rails, the shallow recovery shoal), checkpoints, parcel pads, island heightfield.
// Conventions: y up, yaw 0 faces +z, forward=(sin yaw, cos yaw); lateral u>0 is the LEFT side of the road.
// No three.js here, so tests can import it in Node.
import {cl,lerp,sstep,fbm} from './util.js';
export const STEP=2,SEA=0,ROADY=1.0,LAND=.85,DEEP=-.8,SHOAL=-.38;

// edge presets: wall distance beyond the road edge (0 = open), land extent from the centre line, ground kind
// kinds: 0 grass, 1 town paving, 2 shoal (shallow sand under water)
const PRE={
 q:{wall:[1.2,1.2],land:[12,44],kind:[1,1]},   // town quay: harbor on the left, houses on the right
 h:{wall:[1.2,1.2],land:[9,9],kind:[1,1]},     // breakwater: narrow paved mole with rails
 b:{wall:[0,0],land:[16,15],kind:[0,0]},       // open beach road: run wide and you meet the sea
 p:{wall:[0,0],land:[30,13],kind:[0,0]},       // lighthouse point: the big rock is on the inside
 B:{wall:[.35,.35],land:[0,0],kind:[0,0],bridge:1}, // Tide Bridge: rails, sea under
 P:{wall:[.35,.35],land:[0,0],kind:[0,0],bridge:2}, // plank bridge
 s:{wall:[0,0],land:[18,9],kind:[0,2],shoal:1},     // North Island sweep: the Shallows recovery zone on the outside
 t:{wall:[1.2,1.2],land:[10,46],kind:[1,1]},   // Post House town
};
// [x, z, preset, half width]
export const PTS=[
 [0,0,'q',7],[46,0,'q',7],[92,3,'q',7],[126,-2,'b',7],[154,-14,'p',7.5],[170,-36,'p',7.5],[163,-58,'p',7.5],[140,-67,'h',7],
 [108,-63,'h',7],[80,-66,'h',6.5],[56,-73,'B',5.6],[24,-85,'B',5.6],[-8,-97,'b',7],[-36,-108,'s',7.5],[-72,-114,'s',7.5],[-106,-101,'s',7.5],
 [-126,-74,'s',7.5],[-130,-44,'P',5.2],[-127,-18,'t',7],[-118,10,'t',7],[-100,30,'t',8.5],[-70,34,'t',8.5],[-40,22,'q',7],[-17,6,'q',7]];
export const NAMES={c1:'LIGHTHOUSE HAIRPIN',c2:'SHALLOWS SWEEP',c3:'POST HOUSE TURN',bridge:'TIDE BRIDGE'};
// extra islands: [x, z, radius, height]
export const ISLES=[[60,-32,13,1.4],[-60,-40,20,2.2],[-30,-62,9,1],[120,-108,15,2],[205,-70,11,1.8],[-170,-110,16,2],[-175,20,14,1.6],[30,70,18,1.4],[150,45,12,1.2],[-10,-150,12,1.6],[96,-88,6,.9]];

function cr(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3);}

export function buildTrack(){const N=PTS.length,dense=[];let L=0,px=0,pz=0;
 for(let k=0;k<N;k++)for(let s=0;s<40;s++){const t=s/40,P=j=>PTS[(k+j+N)%N];const x=cr(P(-1)[0],P(0)[0],P(1)[0],P(2)[0],t),z=cr(P(-1)[1],P(0)[1],P(1)[1],P(2)[1],t);
  if(dense.length)L+=Math.hypot(x-px,z-pz);dense.push({x,z,l:L,k,t,w:lerp(P(0)[3],P(1)[3],sstep(0,1,t))});px=x;pz=z;}
 L+=Math.hypot(dense[0].x-px,dense[0].z-pz);
 const n=Math.round(L/STEP),st=L/n,F=()=>new Float32Array(n),U=()=>new Uint8Array(n);
 const B={n,len:L,step:st,x:F(),z:F(),y:F(),w:F(),tx:F(),tz:F(),nx:F(),nz:F(),s:F(),curv:F(),line:F(),seg:U(),bridge:U(),shoal:U(),wallL:F(),wallR:F(),landL:F(),landR:F(),kindL:U(),kindR:U(),vmax:F()};
 let j=0;for(let i=0;i<n;i++){const l=i*st;while(j<dense.length-2&&dense[j+1].l<l)j++;const a=dense[j],b=dense[j+1],f=b.l>a.l?cl((l-a.l)/(b.l-a.l),0,1):0;
  B.x[i]=lerp(a.x,b.x,f);B.z[i]=lerp(a.z,b.z,f);B.w[i]=lerp(a.w,b.w,f);B.s[i]=l;B.seg[i]=a.k;}
 const md=i=>((i%n)+n)%n;
 for(let i=0;i<n;i++){const a=md(i-1),b=md(i+1),dx=B.x[b]-B.x[a],dz=B.z[b]-B.z[a],d=Math.hypot(dx,dz)||1;B.tx[i]=dx/d;B.tz[i]=dz/d;B.nx[i]=dz/d;B.nz[i]=-dx/d;}
 for(let i=0;i<n;i++){const a=md(i-3),b=md(i+3);let da=Math.atan2(B.tx[b],B.tz[b])-Math.atan2(B.tx[a],B.tz[a]);while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;B.curv[i]=da/(6*st);}
 // edges from presets (blended a few samples so walls do not step)
 for(let i=0;i<n;i++){const p=PRE[PTS[B.seg[i]][2]];B.wallL[i]=p.wall[0];B.wallR[i]=p.wall[1];B.landL[i]=p.land[0];B.landR[i]=p.land[1];B.kindL[i]=p.kind[0];B.kindR[i]=p.kind[1];B.bridge[i]=p.bridge||0;B.shoal[i]=p.shoal||0;}
 // bridge decks arch over the water
 for(let i=0;i<n;i++)B.y[i]=ROADY;
 for(const r of runs(n,i=>B.bridge[i])){const len=r[1]-r[0]+1,kind=B.bridge[md(r[0])],H=kind===1?3.4:.9;for(let k=0;k<len;k++){const i=md(r[0]+k);B.y[i]=ROADY+H*Math.sin(Math.PI*k/(len-1));}
  // ramps onto the deck
  for(let k=1;k<=5;k++){B.y[md(r[0]-k)]=ROADY;B.y[md(r[1]+k)]=ROADY;}}
 // racing line: lean to the inside of upcoming corners
 const raw=F();for(let i=0;i<n;i++){let c=0;for(let k=-8;k<=12;k++)c+=B.curv[md(i+k)]*(1-Math.abs(k-2)/14);raw[i]=c/8;}
 for(let i=0;i<n;i++)B.line[i]=cl(raw[i]*70,-.55,.55)*B.w[i];
 for(let p=0;p<3;p++){const tt=B.line.slice();for(let i=0;i<n;i++){let s=0;for(let k=-5;k<=5;k++)s+=tt[md(i+k)];B.line[i]=s/11;}}
 for(let i=0;i<n;i++)B.line[i]=cl(B.line[i],-(B.w[i]-2.2),B.w[i]-2.2);
 // corner speed for the CPU: lateral grip budget over the next few samples
 for(let i=0;i<n;i++){let c=0;for(let k=0;k<14;k++)c=Math.max(c,Math.abs(B.curv[md(i+k)])*(1-k/22));B.vmax[i]=Math.min(40,Math.sqrt(26/Math.max(c,1e-3)));}
 const idx=f=>md(Math.round(f*n));
 // features (fractions of the lap, measured from the start line at PTS[0])
 const nearPt=k=>{let best=1e9,bi=0;for(let i=0;i<n;i++){const d=(B.x[i]-PTS[k][0])**2+(B.z[i]-PTS[k][1])**2;if(d<best){best=d;bi=i;}}return bi;};
 const T={B,n,len:L,idx,md};
 // ordered checkpoints: 0 is the start/finish line; you must cross 1..5 in order before the line counts
 T.cps=[0,nearPt(5),nearPt(9),nearPt(14),nearPt(17)+3,nearPt(20)].map((i,k)=>({k,i,s:B.s[i]}));
 // parcel pads: pick up at Breakwater Depot (right side), drop at the Post House bay (right side, after the turn)
 const pi=nearPt(8),di=md(nearPt(20)+15);
 T.pick={i:pi,len:6,side:-1,u0:1.2,u1:99,name:'BREAKWATER DEPOT'};
 T.drop={i:di,len:7,side:-1,u0:1.6,u1:99,name:'POST HOUSE BAY'};
 T.corners=[{n:NAMES.c1,i:nearPt(5)},{n:NAMES.c2,i:nearPt(15)},{n:NAMES.c3,i:nearPt(20)}];
 T.bridgeI=nearPt(11);T.shoalI=nearPt(15);T.light={x:150,z:-38};T.post={i:nearPt(20)};
 buildHeight(T);return T;}

export function runs(n,ok){const out=[];let cur=null;for(let i=0;i<n;i++){if(ok(i)){if(!cur){cur=[i,i];out.push(cur);}else cur[1]=i;}else cur=null;}
 if(out.length>1&&out[0][0]===0&&out[out.length-1][1]===n-1){const l=out.pop();out[0]=[l[0],out[0][1]+n];}return out;}

/* ---------- island heightfield ---------- */
function buildHeight(T){const B=T.B;let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<B.n;i++){x0=Math.min(x0,B.x[i]);x1=Math.max(x1,B.x[i]);z0=Math.min(z0,B.z[i]);z1=Math.max(z1,B.z[i]);}
 const pad=110,cs=2;x0-=pad;z0-=pad;x1+=pad;z1+=pad;const nx=Math.ceil((x1-x0)/cs)+1,nz=Math.ceil((z1-z0)/cs)+1;
 const H=new Float32Array(nx*nz),K=new Uint8Array(nx*nz);
 for(let a=0;a<nz;a++)for(let b=0;b<nx;b++){const x=x0+b*cs,z=z0+a*cs;H[a*nx+b]=-4.2+fbm(x*.015,z*.015,3)*1.6;}
 const put=(k,v,kind)=>{if(v>H[k]){H[k]=v;K[k]=kind;}};
 // land beside the road: flat top, a sand beach, then a shelf into deep water
 const prof=(d,ext)=>d<ext-4?LAND:d<ext?lerp(LAND,.25,(d-(ext-4))/4):d<ext+2.5?lerp(.25,-.6,(d-ext)/2.5):lerp(-.6,-4,sstep(0,1,(d-ext-2.5)/8));
 for(let i=0;i<B.n;i++){if(B.bridge[i])continue;const cx=B.x[i],cz=B.z[i],ext=Math.max(B.landL[i],B.landR[i]),R=ext+12,rr=Math.ceil(R/cs);
  const bx=Math.round((cx-x0)/cs),bz=Math.round((cz-z0)/cs);
  for(let a=Math.max(0,bz-rr);a<=Math.min(nz-1,bz+rr);a++)for(let b=Math.max(0,bx-rr);b<=Math.min(nx-1,bx+rr);b++){const x=x0+b*cs,z=z0+a*cs,dx=x-cx,dz=z-cz,d=Math.hypot(dx,dz);if(d>R)continue;
   const u=dx*B.nx[i]+dz*B.nz[i],left=u>=0,e=left?B.landL[i]:B.landR[i],kind=left?B.kindL[i]:B.kindR[i],k=a*nx+b;
   if(kind===2){// shoal: road shoulder, then the shallow flat, then the drop-off
    const sv=d<B.w[i]+2.5?LAND:d<B.w[i]+5?lerp(LAND,SHOAL,(d-B.w[i]-2.5)/2.5):d<B.w[i]+26?SHOAL+fbm(x*.2,z*.2,2)*.06:lerp(SHOAL,-4,sstep(0,1,(d-B.w[i]-26)/8));put(k,sv,sv<0?2:0);}
   else put(k,prof(d,e),kind);}}
 for(const[cx,cz,r,h]of ISLES){const rr=Math.ceil((r+12)/cs),bx=Math.round((cx-x0)/cs),bz=Math.round((cz-z0)/cs);
  for(let a=Math.max(0,bz-rr);a<=Math.min(nz-1,bz+rr);a++)for(let b=Math.max(0,bx-rr);b<=Math.min(nx-1,bx+rr);b++){const x=x0+b*cs,z=z0+a*cs,d=Math.hypot(x-cx,z-cz)*(1+fbm(x*.08,z*.08,2)*.25);
   const v=d<r-4?h+fbm(x*.1,z*.1,2)*.5*(1-d/r):d<r?lerp(h,.25,(d-r+4)/4):lerp(.25,-4,sstep(0,1,(d-r)/9));put(a*nx+b,v,0);}}
 // keep the water under the bridges clear
 for(let i=0;i<B.n;i++){if(!B.bridge[i])continue;let deep=true;for(let k=-3;k<=3;k++)if(!B.bridge[(i+k+B.n)%B.n])deep=false;if(!deep)continue;const rr=Math.ceil(8/cs),bx=Math.round((B.x[i]-x0)/cs),bz=Math.round((B.z[i]-z0)/cs);
  for(let a=Math.max(0,bz-rr);a<=Math.min(nz-1,bz+rr);a++)for(let b=Math.max(0,bx-rr);b<=Math.min(nx-1,bx+rr);b++){const k=a*nx+b;if(H[k]>-1.5)H[k]=-1.5;}}
 T.H={x0,z0,nx,nz,cs,H,K,h(x,z){const fx=cl((x-x0)/cs,0,nx-1.001),fz=cl((z-z0)/cs,0,nz-1.001),b=Math.floor(fx),a=Math.floor(fz),u=fx-b,v=fz-a,k=a*nx+b;
   return lerp(lerp(H[k],H[k+1],u),lerp(H[k+nx],H[k+nx+1],u),v);},kind(x,z){const b=Math.round(cl((x-x0)/cs,0,nx-1)),a=Math.round(cl((z-z0)/cs,0,nz-1));return K[a*nx+b];}};}

/* ---------- queries ---------- */
// nearest centre-line sample near a hint index (racers keep their last index), projected onto the segment
export function query(T,x,z,hint=-1,out={}){const B=T.B,n=B.n;let best=1e18,bi=0;
 if(hint<0){for(let i=0;i<n;i++){const d=(B.x[i]-x)**2+(B.z[i]-z)**2;if(d<best){best=d;bi=i;}}}
 else for(let k=-16;k<=16;k++){const i=(hint+k+n)%n,d=(B.x[i]-x)**2+(B.z[i]-z)**2;if(d<best){best=d;bi=i;}}
 let i=bi,j=(i+1)%n,dx=B.x[j]-B.x[i],dz=B.z[j]-B.z[i],ll=dx*dx+dz*dz||1,f=((x-B.x[i])*dx+(z-B.z[i])*dz)/ll;
 if(f<0){j=i;i=(i-1+n)%n;dx=B.x[j]-B.x[i];dz=B.z[j]-B.z[i];ll=dx*dx+dz*dz||1;f=((x-B.x[i])*dx+(z-B.z[i])*dz)/ll;}
 f=cl(f,0,1);const px=B.x[i]+dx*f,pz=B.z[i]+dz*f,nx_=lerp(B.nx[i],B.nx[j],f),nz_=lerp(B.nz[i],B.nz[j],f);
 out.i=f<.5?i:j;out.i0=i;out.f=f;out.u=(x-px)*nx_+(z-pz)*nz_;out.nx=nx_;out.nz=nz_;out.tx=B.tx[out.i];out.tz=B.tz[out.i];out.w=lerp(B.w[i],B.w[j],f);
 out.s=B.s[i]+f*B.step;if(j===0&&i===n-1)out.s=B.s[i]+f*B.step;out.prog=out.s/B.len;out.roadY=lerp(B.y[i],B.y[j],f);out.bridge=B.bridge[out.i];
 const left=out.u>=0;out.wall=left?B.wallL[out.i]:B.wallR[out.i];out.shoal=B.shoal[out.i]&&!left;return out;}
export function at(T,i,u=0,o={x:0,y:0,z:0}){const B=T.B,n=B.n;i=((i%n)+n)%n;const a=Math.floor(i),b=(a+1)%n,f=i-a;o.x=lerp(B.x[a],B.x[b],f)+B.nx[a]*u;o.y=lerp(B.y[a],B.y[b],f);o.z=lerp(B.z[a],B.z[b],f)+B.nz[a]*u;return o;}
export const yawAt=(T,i)=>{const B=T.B;i=((Math.round(i)%B.n)+B.n)%B.n;return Math.atan2(B.tx[i],B.tz[i]);};
// signed distance along the lap from s0 to s1 (shortest way round)
export function ds(T,s0,s1){let d=s1-s0;const L=T.B.len;if(d>L/2)d-=L;if(d<-L/2)d+=L;return d;}
// is the racer inside a parcel pad?
export function onPad(T,pad,q){const n=T.B.n;let d=(q.i-pad.i+n)%n;if(d>n/2)d-=n;if(d<-1||d>pad.len)return false;const u=q.u*pad.side;return u>=pad.u0&&u<=pad.u1;}
