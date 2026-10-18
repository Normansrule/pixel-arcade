// BASTION LINE — small shared helpers: clamps, angles, seeded random, time format.
export const cl=(v,a,b)=>v<a?a:v>b?b:v;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const dist=(ax,az,bx,bz)=>Math.hypot(ax-bx,az-bz);
export const angTo=(ax,az,bx,bz)=>Math.atan2(bx-ax,bz-az);
export const wrapA=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
export function rng(seed){let s=seed>>>0||1;return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
export const pick=(a,r=Math.random)=>a[Math.floor(r()*a.length)];
export const fmtT=s=>{s=Math.max(0,Math.floor(s));return(s/60|0)+':'+String(s%60).padStart(2,'0');};
