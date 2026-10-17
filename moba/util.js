// AEONFALL — small shared helpers: seeded random, clamps, angles, geometry.
export const cl=(v,a,b)=>v<a?a:v>b?b:v;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const d2=(ax,az,bx,bz)=>{const x=ax-bx,z=az-bz;return x*x+z*z;};
export const dist=(ax,az,bx,bz)=>Math.hypot(ax-bx,az-bz);
export const angTo=(ax,az,bx,bz)=>Math.atan2(bx-ax,bz-az);
export const wrapA=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
export const turn=(a,b,k)=>a+wrapA(b-a)*k;
export function rng(seed){let s=seed>>>0||1;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
export const pick=(a,r=Math.random)=>a[Math.floor(r()*a.length)];
// distance from point p to segment ab (2D, x/z)
export function segDist(px,pz,ax,az,bx,bz){const vx=bx-ax,vz=bz-az,l=vx*vx+vz*vz;let t=l?((px-ax)*vx+(pz-az)*vz)/l:0;t=t<0?0:t>1?1:t;return Math.hypot(px-ax-vx*t,pz-az-vz*t);}
export function polyDist(px,pz,pts){let m=1e9;for(let i=0;i<pts.length-1;i++){const d=segDist(px,pz,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]);if(d<m)m=d;}return m;}
// point at arc length s along polyline; also returns segment index and direction
export function polyAt(pts,s){for(let i=0;i<pts.length-1;i++){const[ax,az]=pts[i],[bx,bz]=pts[i+1],l=Math.hypot(bx-ax,bz-az);if(s<=l||i===pts.length-2){const t=cl(s/l,0,1);return{x:ax+(bx-ax)*t,z:az+(bz-az)*t,i,dx:(bx-ax)/l,dz:(bz-az)/l};}s-=l;}}
export function polyLen(pts){let s=0;for(let i=0;i<pts.length-1;i++)s+=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);return s;}
// arc-length projection of a point onto a polyline
export function polyProj(px,pz,pts){let best=1e9,bs=0,acc=0;for(let i=0;i<pts.length-1;i++){const[ax,az]=pts[i],[bx,bz]=pts[i+1],vx=bx-ax,vz=bz-az,l2=vx*vx+vz*vz,l=Math.sqrt(l2);let t=((px-ax)*vx+(pz-az)*vz)/l2;t=cl(t,0,1);const d=Math.hypot(px-ax-vx*t,pz-az-vz*t);if(d<best){best=d;bs=acc+t*l;}acc+=l;}return{s:bs,d:best};}
export const fmtT=s=>{s=Math.max(0,Math.floor(s));return(s/60|0)+':'+String(s%60).padStart(2,'0');};
