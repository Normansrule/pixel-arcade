// STARFALL VANGUARD — procedural PBR texture sets (albedo + normal + roughness) drawn on canvas; no image files.
import * as THREE from '../vendor/three.module.min.js';
import {rng} from './util.js';

function canvas(n){const c=document.createElement('canvas');c.width=c.height=n;return c;}
function tex(c,srgb=true,rep=true){const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
// height canvas -> tangent-space normal map
function normalFrom(hc,strength=2){const n=hc.width,src=hc.getContext('2d').getImageData(0,0,n,n).data,c=canvas(n),x=c.getContext('2d'),img=x.createImageData(n,n),d=img.data;
 const H=(i,j)=>src[(((j+n)%n)*n+((i+n)%n))*4]/255;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const dx=(H(i+1,j)-H(i-1,j))*strength,dy=(H(i,j+1)-H(i,j-1))*strength;const l=Math.hypot(dx,dy,1),k=(j*n+i)*4;d[k]=(-dx/l*.5+.5)*255;d[k+1]=(dy/l*.5+.5)*255;d[k+2]=(1/l*.5+.5)*255;d[k+3]=255;}
 x.putImageData(img,0,0);return tex(c,false);}
// tileable value noise
function noiseField(n,cells,seed){const r=rng(seed),g=new Float32Array(cells*cells).map(()=>r());const f=new Float32Array(n*n);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const u=i/n*cells,v=j/n*cells,i0=Math.floor(u),j0=Math.floor(v),fu=u-i0,fv=v-j0,s=t=>t*t*(3-2*t);
  const a=g[(j0%cells)*cells+i0%cells],b=g[(j0%cells)*cells+(i0+1)%cells],c=g[((j0+1)%cells)*cells+i0%cells],d=g[((j0+1)%cells)*cells+(i0+1)%cells];
  f[j*n+i]=a+(b-a)*s(fu)+(c-a)*s(fv)+(a-b-c+d)*s(fu)*s(fv);}return f;}
function fbm(n,seed,oct=5,base=4){const out=new Float32Array(n*n);let amp=1,tot=0;for(let o=0;o<oct;o++){const f=noiseField(n,base<<o,seed+o*31);for(let i=0;i<n*n;i++)out[i]+=f[i]*amp;tot+=amp;amp*=.5;}for(let i=0;i<n*n;i++)out[i]/=tot;return out;}
function fieldCanvas(n,f,map){const c=canvas(n),x=c.getContext('2d'),img=x.createImageData(n,n),d=img.data;for(let i=0;i<n*n;i++){const[r,g,b]=map(f[i],i);d[i*4]=r;d[i*4+1]=g;d[i*4+2]=b;d[i*4+3]=255;}x.putImageData(img,0,0);return c;}

/* sci-fi wall / hull panels */
export function panelSet(base='#5a6170',seed=3,o={}){const n=512,r=rng(seed);const A=canvas(n),Hc=canvas(n),Rc=canvas(n),a=A.getContext('2d'),h=Hc.getContext('2d'),ro=Rc.getContext('2d');
 a.fillStyle=base;a.fillRect(0,0,n,n);h.fillStyle='#808080';h.fillRect(0,0,n,n);ro.fillStyle=o.rough||'#8a8a8a';ro.fillRect(0,0,n,n);
 const nz=fbm(128,seed,4,4);for(let i=0;i<2600;i++){const x=r()*n,y=r()*n;a.fillStyle=`rgba(${r()<.5?'0,0,0':'255,255,255'},${r()*.05})`;a.fillRect(x,y,2+r()*6,2+r()*6);}
 const panel=(x,y,w,hh,depth)=>{h.fillStyle=`rgb(${128+depth},${128+depth},${128+depth})`;h.fillRect(x+3,y+3,w-6,hh-6);h.strokeStyle='#202020';h.lineWidth=3;h.strokeRect(x+1.5,y+1.5,w-3,hh-3);
  a.strokeStyle='rgba(0,0,0,.55)';a.lineWidth=2.5;a.strokeRect(x+1.5,y+1.5,w-3,hh-3);a.strokeStyle='rgba(255,255,255,.08)';a.lineWidth=1;a.strokeRect(x+4,y+4,w-8,hh-8);
  const sh=r()*.12-.05;a.fillStyle=sh>0?`rgba(255,255,255,${sh})`:`rgba(0,0,0,${-sh})`;a.fillRect(x+3,y+3,w-6,hh-6);
  ro.fillStyle=`rgb(${110+r()*70|0},${110+r()*70|0},${110+r()*70|0})`;ro.fillRect(x+3,y+3,w-6,hh-6);
  for(const[cx,cy]of[[x+9,y+9],[x+w-9,y+9],[x+9,y+hh-9],[x+w-9,y+hh-9]]){a.fillStyle='rgba(0,0,0,.5)';a.beginPath();a.arc(cx,cy,3,0,7);a.fill();a.fillStyle='rgba(255,255,255,.25)';a.beginPath();a.arc(cx-.8,cy-.8,1.6,0,7);a.fill();h.fillStyle='#c0c0c0';h.beginPath();h.arc(cx,cy,3,0,7);h.fill();}};
 // split recursively into panels
 const split=(x,y,w,hh,d)=>{if(d>2||w<90||hh<90||r()<.18*d){panel(x,y,w,hh,(r()*30-12)|0);
   if(r()<.25&&w>110&&hh>60){a.fillStyle='rgba(0,0,0,.45)';h.fillStyle='#505050';for(let k=0;k<5;k++){a.fillRect(x+20,y+18+k*9,w-40,4);h.fillRect(x+20,y+18+k*9,w-40,4);}}
   if(o.stripes&&r()<.18){a.save();a.beginPath();a.rect(x+6,y+hh-22,w-12,14);a.clip();for(let k=-2;k<w/14+2;k++){a.fillStyle=k%2?'#1a1a1a':o.stripes;a.beginPath();a.moveTo(x+k*14,y+hh-8);a.lineTo(x+k*14+14,y+hh-8);a.lineTo(x+k*14+28,y+hh-22);a.lineTo(x+k*14+14,y+hh-22);a.fill();}a.restore();}return;}
  if(w>hh){const s=(.3+r()*.4)*w|0;split(x,y,s,hh,d+1);split(x+s,y,w-s,hh,d+1);}else{const s=(.3+r()*.4)*hh|0;split(x,y,w,s,d+1);split(x,y+s,w,hh-s,d+1);}};
 split(0,0,n/2,n/2,0);split(n/2,0,n/2,n/2,0);split(0,n/2,n/2,n/2,0);split(n/2,n/2,n/2,n/2,0);
 const id=a.getImageData(0,0,n,n);for(let i=0;i<n*n;i++){const k=nz[((i/n|0)>>2)*128+((i%n)>>2)]*.18+.91;id.data[i*4]*=k;id.data[i*4+1]*=k;id.data[i*4+2]*=k;}a.putImageData(id,0,0);
 return{map:tex(A),normalMap:normalFrom(Hc,3),roughnessMap:tex(Rc,false)};}

/* polished floor tiles */
export function floorSet(base='#2a2f3a',line='#0b0d12',seed=5,o={}){const n=512,r=rng(seed);const A=canvas(n),Hc=canvas(n),Rc=canvas(n),a=A.getContext('2d'),h=Hc.getContext('2d'),ro=Rc.getContext('2d');
 a.fillStyle=base;a.fillRect(0,0,n,n);h.fillStyle='#909090';h.fillRect(0,0,n,n);ro.fillStyle='#3a3a3a';ro.fillRect(0,0,n,n);const t=n/2;
 for(let i=0;i<2;i++)for(let j=0;j<2;j++){const x=i*t,y=j*t,v=r()*.08-.04;a.fillStyle=v>0?`rgba(255,255,255,${v})`:`rgba(0,0,0,${-v})`;a.fillRect(x,y,t,t);
  a.strokeStyle=line;a.lineWidth=5;a.strokeRect(x+2.5,y+2.5,t-5,t-5);h.strokeStyle='#303030';h.lineWidth=5;h.strokeRect(x+2.5,y+2.5,t-5,t-5);
  if(o.inlay){a.strokeStyle=o.inlay;a.lineWidth=2;a.strokeRect(x+22,y+22,t-44,t-44);h.strokeStyle='#707070';h.lineWidth=2;h.strokeRect(x+22,y+22,t-44,t-44);}
  ro.fillStyle=`rgb(${40+r()*40|0},${40+r()*40|0},${40+r()*40|0})`;ro.fillRect(x+5,y+5,t-10,t-10);}
 for(let i=0;i<500;i++){ro.fillStyle=`rgba(${r()<.5?0:255},${r()<.5?0:255},${r()<.5?0:255},${r()*.25})`;const s=4+r()*30;ro.beginPath();ro.arc(r()*n,r()*n,s,0,7);ro.fill();}
 for(let i=0;i<1400;i++){a.fillStyle=`rgba(255,255,255,${r()*.03})`;a.fillRect(r()*n,r()*n,1+r()*3,1);}
 return{map:tex(A),normalMap:normalFrom(Hc,2),roughnessMap:tex(Rc,false)};}

/* layered canyon / asteroid rock */
export function rockSet(c1=[120,52,48],c2=[60,22,30],seed=9){const n=256,f=fbm(n,seed,5,4),g=fbm(n,seed+100,3,8);
 const A=fieldCanvas(n,f,(v,i)=>{const y=(i/n|0)/n,s=.5+.5*Math.sin((y*6+v*3)*Math.PI*2);const k=v*.7+s*.3,m=g[i];return[c2[0]+(c1[0]-c2[0])*k*(.8+m*.4),c2[1]+(c1[1]-c2[1])*k*(.8+m*.4),c2[2]+(c1[2]-c2[2])*k*(.8+m*.4)];});
 const Hc=fieldCanvas(n,f,(v,i)=>{const q=(v*.75+g[i]*.25)*255;return[q,q,q];});const Rc=fieldCanvas(n,g,v=>{const q=170+v*70;return[q,q,q];});
 return{map:tex(A),normalMap:normalFrom(Hc,6),roughnessMap:tex(Rc,false)};}

/* glowing reactor grate (emissive) */
export function grateSet(col='#3fd8ff'){const n=256,A=canvas(n),E=canvas(n),a=A.getContext('2d'),e=E.getContext('2d');a.fillStyle='#14181f';a.fillRect(0,0,n,n);e.fillStyle='#000';e.fillRect(0,0,n,n);
 for(let i=0;i<8;i++)for(let j=0;j<8;j++){const x=i*32,y=j*32;a.fillStyle='#05070a';a.fillRect(x+5,y+5,22,22);const g=e.createRadialGradient(x+16,y+16,2,x+16,y+16,14);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');e.fillStyle=g;e.fillRect(x+5,y+5,22,22);}
 return{map:tex(A),emissiveMap:tex(E)};}

/* crate faces */
export function crateSet(base='#3a3f4a',acc='#ff4d00',seed=2){const n=256,r=rng(seed),A=canvas(n),Hc=canvas(n),a=A.getContext('2d'),h=Hc.getContext('2d');
 a.fillStyle=base;a.fillRect(0,0,n,n);h.fillStyle='#808080';h.fillRect(0,0,n,n);
 a.strokeStyle='#15171c';a.lineWidth=14;a.strokeRect(7,7,n-14,n-14);h.strokeStyle='#d0d0d0';h.lineWidth=14;h.strokeRect(7,7,n-14,n-14);
 a.fillStyle='rgba(0,0,0,.25)';a.fillRect(30,30,n-60,n-60);h.fillStyle='#606060';h.fillRect(30,30,n-60,n-60);
 a.fillStyle=acc;a.fillRect(30,n-62,n-60,10);a.font='bold 34px "JetBrains Mono",monospace';a.fillStyle='rgba(255,255,255,.55)';a.textAlign='center';a.fillText('N-'+(100+r()*800|0),n/2,n/2+12);
 for(let i=0;i<900;i++){a.fillStyle=`rgba(0,0,0,${r()*.12})`;a.fillRect(r()*n,r()*n,2+r()*4,1+r()*2);}
 return{map:tex(A),normalMap:normalFrom(Hc,2.5)};}

/* hexagon line pattern (shields, glass, holograms) */
export function hexTex(){const n=256,c=canvas(n),x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,n,n);x.strokeStyle='#fff';x.lineWidth=3;const R=n/8,w=R*Math.sqrt(3);
 for(let j=-1;j<6;j++)for(let i=-1;i<6;i++){const cx=i*w+(j%2?w/2:0),cy=j*R*1.5;x.beginPath();for(let k=0;k<7;k++){const a=k/6*Math.PI*2+Math.PI/6;x.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);}x.stroke();}
 return tex(c,false);}
export function glowTex(){const n=128,c=canvas(n),x=c.getContext('2d'),g=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,n,n);return tex(c,false,false);}
export function decalTex(){const n=128,c=canvas(n),x=c.getContext('2d'),r=rng(4);const g=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'rgba(0,0,0,.95)');g.addColorStop(.35,'rgba(10,8,8,.75)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,n,n);
 for(let i=0;i<14;i++){const a=r()*7,l=20+r()*40;x.strokeStyle='rgba(0,0,0,.5)';x.lineWidth=2+r()*3;x.beginPath();x.moveTo(n/2,n/2);x.lineTo(n/2+Math.cos(a)*l,n/2+Math.sin(a)*l);x.stroke();}return tex(c,true,false);}

/* terrain albedo: mottled ground (sand / moss / grass) — tileable */
export function groundTex(c1,c2,c3,seed=3,blades=0){const n=512,f=fbm(n,seed,5,4),g=fbm(n,seed+50,4,16),r=rng(seed);
 const c=fieldCanvas(n,f,(v,i)=>{const m=g[i],k=Math.min(1,Math.max(0,(v-.42)*3.2));const a=[c1[0]+(c2[0]-c1[0])*k,c1[1]+(c2[1]-c1[1])*k,c1[2]+(c2[2]-c1[2])*k];const q=.78+m*.44;
  const s=Math.max(0,(m-.62)*4);return[(a[0]*(1-s)+c3[0]*s)*q,(a[1]*(1-s)+c3[1]*s)*q,(a[2]*(1-s)+c3[2]*s)*q];});
 const x=c.getContext('2d');for(let i=0;i<(blades?5000:1600);i++){const px=r()*n,py=r()*n,l=blades?2+r()*5:1+r()*2;x.strokeStyle=`rgba(${r()<.5?'255,255,230':'0,0,0'},${.05+r()*.1})`;x.lineWidth=1;x.beginPath();x.moveTo(px,py);x.lineTo(px+(r()-.5)*2,py-l);x.stroke();}
 for(let i=0;i<260;i++){x.fillStyle=`rgba(0,0,0,${r()*.15})`;x.beginPath();x.arc(r()*n,r()*n,1+r()*3,0,7);x.fill();}
 return tex(c);}
/* stratified cliff rock albedo + normal */
export function cliffSet(c1,c2,seed=9){const n=512,f=fbm(n,seed,5,4),g=fbm(n,seed+100,4,8),h=fbm(n,seed+200,4,16),N=6;
 const st=new Float32Array(n*n),fr=new Float32Array(n*n),bd=new Float32Array(n*n),ck=new Float32Array(n*n);
 for(let i=0;i<n*n;i++){const y=(i/n|0)/n,w=y*N+(f[i]-.5)*2.2+(g[i]-.5)*.5;const b=Math.floor(w),q=w-b;const bm=((b%N)+N)%N;const hs=Math.sin(bm*12.9898+seed*7.1)*43758.5453;bd[i]=hs-Math.floor(hs);fr[i]=q;const r=1-Math.abs(g[i]*2-1);ck[i]=Math.pow(r,9);st[i]=Math.min(1,q/.12);}
 const A=fieldCanvas(n,f,(v,i)=>{const k=cl01(bd[i]*.55+h[i]*.45+(v-.5)*.3);const m=(.62+.38*st[i])*(1-ck[i]*.55)*(.82+h[i]*.36);return[(c2[0]+(c1[0]-c2[0])*k)*m,(c2[1]+(c1[1]-c2[1])*k)*m,(c2[2]+(c1[2]-c2[2])*k)*m];});
 const Hc=fieldCanvas(n,f,(v,i)=>{const q=cl01(fr[i]*.45+h[i]*.35+bd[i]*.2-ck[i]*.5)*255;return[q,q,q];});
 return{map:tex(A),normalMap:normalFrom(Hc,6)};}
function cl01(x){return x<0?0:x>1?1:x;}
