// ZENITH PROTOCOL — procedural PBR texture sets (albedo + normal + roughness) painted on canvas; no image files.
// Stylized: plaster, terracotta roof tiles, cobbles, wet asphalt, planks, corrugated metal, concrete, sci-fi panels.
import * as THREE from '../vendor/three.module.min.js';
import {rng} from './util.js';

function canvas(n,m=n){const c=document.createElement('canvas');c.width=n;c.height=m;return c;}
function tex(c,srgb=true,rep=true){const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
// height canvas -> tangent-space normal map
function normalFrom(hc,strength=2){const n=hc.width,m=hc.height,src=hc.getContext('2d').getImageData(0,0,n,m).data,c=canvas(n,m),x=c.getContext('2d'),img=x.createImageData(n,m),d=img.data;
 const H=(i,j)=>src[(((j+m)%m)*n+((i+n)%n))*4]/255;
 for(let j=0;j<m;j++)for(let i=0;i<n;i++){const dx=(H(i+1,j)-H(i-1,j))*strength,dy=(H(i,j+1)-H(i,j-1))*strength;const l=Math.hypot(dx,dy,1),k=(j*n+i)*4;d[k]=(-dx/l*.5+.5)*255;d[k+1]=(dy/l*.5+.5)*255;d[k+2]=(1/l*.5+.5)*255;d[k+3]=255;}
 x.putImageData(img,0,0);return tex(c,false);}
function noiseField(n,cells,seed){const r=rng(seed),g=new Float32Array(cells*cells).map(()=>r());const f=new Float32Array(n*n);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const u=i/n*cells,v=j/n*cells,i0=Math.floor(u),j0=Math.floor(v),fu=u-i0,fv=v-j0,s=t=>t*t*(3-2*t);
  const a=g[(j0%cells)*cells+i0%cells],b=g[(j0%cells)*cells+(i0+1)%cells],c=g[((j0+1)%cells)*cells+i0%cells],d=g[((j0+1)%cells)*cells+(i0+1)%cells];
  f[j*n+i]=a+(b-a)*s(fu)+(c-a)*s(fv)+(a-b-c+d)*s(fu)*s(fv);}return f;}
export function fbm(n,seed,oct=5,base=4){const out=new Float32Array(n*n);let amp=1,tot=0;for(let o=0;o<oct;o++){const f=noiseField(n,base<<o,seed+o*31);for(let i=0;i<n*n;i++)out[i]+=f[i]*amp;tot+=amp;amp*=.5;}for(let i=0;i<n*n;i++)out[i]/=tot;return out;}
function fieldCanvas(n,f,map){const c=canvas(n),x=c.getContext('2d'),img=x.createImageData(n,n),d=img.data;for(let i=0;i<n*n;i++){const[r,g,b]=map(f[i],i);d[i*4]=r;d[i*4+1]=g;d[i*4+2]=b;d[i*4+3]=255;}x.putImageData(img,0,0);return c;}
const hexRGB=h=>{const v=parseInt(h.slice(1),16);return[v>>16&255,v>>8&255,v&255];};

/* soft plaster / stucco: near-white so vertex colours tint it per building */
export function stuccoSet(seed=3){const n=256,f=fbm(n,seed,5,4),g=fbm(n,seed+50,3,16);
 const A=fieldCanvas(n,f,(v,i)=>{const k=200+v*40+g[i]*18;return[k,k*.985,k*.96];});const a=A.getContext('2d'),r=rng(seed);
 for(let i=0;i<40;i++){a.strokeStyle=`rgba(90,80,70,${.05+r()*.08})`;a.lineWidth=.6+r();a.beginPath();let x=r()*n,y=r()*n;a.moveTo(x,y);for(let k=0;k<6;k++){x+=(r()-.5)*22;y+=r()*16;a.lineTo(x,y);}a.stroke();}
 // grime at the bottom of the tile (walls get it near the ground through UV v)
 const gr=a.createLinearGradient(0,n*.78,0,n);gr.addColorStop(0,'rgba(60,50,40,0)');gr.addColorStop(1,'rgba(60,50,40,.18)');a.fillStyle=gr;a.fillRect(0,0,n,n);
 const Hc=fieldCanvas(n,f,(v,i)=>{const q=(v*.6+g[i]*.4)*255;return[q,q,q];});const Rc=fieldCanvas(n,g,v=>{const q=200+v*50;return[q,q,q];});
 return{map:tex(A),normalMap:normalFrom(Hc,2.2),roughnessMap:tex(Rc,false)};}

/* terracotta barrel tiles: rows along v, tile humps along u */
export function roofSet(base='#c4643a',seed=7){const n=256,r=rng(seed),A=canvas(n),Hc=canvas(n),a=A.getContext('2d'),h=Hc.getContext('2d');const[R,G,B]=hexRGB(base);
 const rows=8,cols=8,rh=n/rows,cw=n/cols;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=i*cw+(j%2?cw/2:0),y=j*rh,k=.82+r()*.3;
  for(const ox of[0,-n]){const g=a.createLinearGradient(x+ox,0,x+ox+cw,0);g.addColorStop(0,`rgb(${R*k*.6|0},${G*k*.6|0},${B*k*.6|0})`);g.addColorStop(.45,`rgb(${Math.min(255,R*k*1.12)|0},${Math.min(255,G*k*1.1)|0},${Math.min(255,B*k*1.05)|0})`);g.addColorStop(1,`rgb(${R*k*.55|0},${G*k*.55|0},${B*k*.55|0})`);
   a.fillStyle=g;a.fillRect(x+ox,y,cw,rh);const gh=h.createLinearGradient(x+ox,0,x+ox+cw,0);gh.addColorStop(0,'#303030');gh.addColorStop(.5,'#e0e0e0');gh.addColorStop(1,'#303030');h.fillStyle=gh;h.fillRect(x+ox,y,cw,rh);}
  a.fillStyle='rgba(0,0,0,.35)';a.fillRect(x,y+rh-3,cw,3);h.fillStyle='#202020';h.fillRect(x,y+rh-3,cw,3);}
 for(let i=0;i<500;i++){a.fillStyle=`rgba(${r()<.5?'40,30,20':'255,230,200'},${r()*.08})`;a.fillRect(r()*n,r()*n,1+r()*4,1+r()*3);}
 for(let i=0;i<14;i++){a.fillStyle=`rgba(70,90,50,${.08+r()*.1})`;a.beginPath();a.arc(r()*n,r()*n,4+r()*12,0,7);a.fill();}
 return{map:tex(A),normalMap:normalFrom(Hc,2.6)};}

/* cobblestone paving (tileable Worley cells) */
export function cobbleSet(c1='#b9a78e',c2='#8d7c68',seed=11,cells=9){const n=512,r=rng(seed),pts=[];for(let j=0;j<cells;j++)for(let i=0;i<cells;i++)pts.push([(i+.15+r()*.7)/cells*n,(j+.15+r()*.7)/cells*n,r()]);
 const A=canvas(n),Hc=canvas(n),Rc=canvas(n),ai=A.getContext('2d').createImageData(n,n),hi=Hc.getContext('2d').createImageData(n,n),ri=Rc.getContext('2d').createImageData(n,n);const[ar,ag,ab]=hexRGB(c1),[br,bg,bb]=hexRGB(c2);const nz=fbm(128,seed+3,4,4);
 const cs=n/cells;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const ci=Math.floor(x/cs),cj=Math.floor(y/cs);let d1=1e9,d2=1e9,id=0;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=(ci+di+cells)%cells,jj=(cj+dj+cells)%cells,p=pts[jj*cells+ii];const px=p[0]+(ci+di-ii)*cs*(1)-(0),py=p[1]+(cj+dj-jj)*cs;const ddx=x-px,ddy=y-py,d=ddx*ddx+ddy*ddy;if(d<d1){d2=d1;d1=d;id=jj*cells+ii;}else if(d<d2)d2=d;}
  const e=Math.sqrt(d2)-Math.sqrt(d1),k=(y*n+x)*4,t=pts[id][2],w=nz[((y>>2)%128)*128+((x>>2)%128)];const edge=Math.min(1,e/7);const bump=Math.min(1,e/22);
  const s=(.55+.45*edge)*(.86+w*.3);ai.data[k]=(ar+(br-ar)*t)*s;ai.data[k+1]=(ag+(bg-ag)*t)*s;ai.data[k+2]=(ab+(bb-ab)*t)*s;ai.data[k+3]=255;
  const hh=edge<1?edge*120:120+bump*110+w*25;hi.data[k]=hi.data[k+1]=hi.data[k+2]=hh;hi.data[k+3]=255;const rr=edge<1?250:150+t*60+w*40;ri.data[k]=ri.data[k+1]=ri.data[k+2]=rr;ri.data[k+3]=255;}
 A.getContext('2d').putImageData(ai,0,0);Hc.getContext('2d').putImageData(hi,0,0);Rc.getContext('2d').putImageData(ri,0,0);
 return{map:tex(A),normalMap:normalFrom(Hc,3.5),roughnessMap:tex(Rc,false)};}

/* wet asphalt with puddles (roughness carries the puddles, so the floor mirror shines through them) */
export function asphaltSet(seed=5){const n=512,f=fbm(n,seed,6,4),p=fbm(n,seed+9,4,3);
 const A=fieldCanvas(n,f,(v,i)=>{const k=34+v*26+(p[i]>.58?-8:0);return[k,k+1,k+5];});const a=A.getContext('2d'),r=rng(seed);
 for(let i=0;i<4000;i++){a.fillStyle=`rgba(${r()<.5?'0,0,0':'200,200,210'},${r()*.12})`;a.fillRect(r()*n,r()*n,1+r()*2,1+r()*2);}
 for(let i=0;i<18;i++){a.strokeStyle='rgba(0,0,0,.35)';a.lineWidth=1+r()*1.5;a.beginPath();let x=r()*n,y=r()*n;a.moveTo(x,y);for(let k=0;k<8;k++){x+=(r()-.5)*40;y+=(r()-.5)*40;a.lineTo(x,y);}a.stroke();}
 const Hc=fieldCanvas(n,f,v=>{const q=v*255;return[q,q,q];});const Rc=fieldCanvas(n,p,v=>{const q=v>.58?40:v>.52?120:215;return[q,q,q];});
 return{map:tex(A),normalMap:normalFrom(Hc,1.6),roughnessMap:tex(Rc,false)};}

/* wooden planks (decks, balconies, stalls) */
export function woodSet(base='#8a5a36',seed=4){const n=256,r=rng(seed),A=canvas(n),Hc=canvas(n),a=A.getContext('2d'),h=Hc.getContext('2d');const[R,G,B]=hexRGB(base);h.fillStyle='#808080';h.fillRect(0,0,n,n);
 const pw=n/6;for(let i=0;i<6;i++){const k=.8+r()*.35;a.fillStyle=`rgb(${R*k|0},${G*k|0},${B*k|0})`;a.fillRect(0,i*pw,n,pw);
  for(let s=0;s<30;s++){a.strokeStyle=`rgba(${r()<.5?'40,20,10':'255,220,180'},${.06+r()*.08})`;a.lineWidth=1;const y=i*pw+r()*pw;a.beginPath();a.moveTo(0,y);a.bezierCurveTo(n*.3,y+(r()-.5)*6,n*.6,y+(r()-.5)*6,n,y);a.stroke();}
  a.fillStyle='rgba(20,10,5,.7)';a.fillRect(0,i*pw,n,2);h.fillStyle='#202020';h.fillRect(0,i*pw,n,2);const cut=r()*n;a.fillRect(cut,i*pw,2,pw);h.fillRect(cut,i*pw,2,pw);
  for(const nx of[cut+8,cut-8]){a.fillStyle='rgba(30,30,30,.8)';a.fillRect(nx,i*pw+6,2,2);a.fillRect(nx,i*pw+pw-8,2,2);}}
 return{map:tex(A),normalMap:normalFrom(Hc,2)};}

/* corrugated metal (containers, sheds): grey so vertex colour tints it */
export function corrugatedSet(seed=8){const n=256,r=rng(seed),A=canvas(n),Hc=canvas(n),Rc=canvas(n),a=A.getContext('2d'),h=Hc.getContext('2d'),ro=Rc.getContext('2d');
 for(let x=0;x<n;x++){const s=Math.sin(x/n*Math.PI*2*16),k=200+s*30;a.fillStyle=`rgb(${k},${k},${k})`;a.fillRect(x,0,1,n);const q=128+s*100;h.fillStyle=`rgb(${q},${q},${q})`;h.fillRect(x,0,1,n);}
 ro.fillStyle='#909090';ro.fillRect(0,0,n,n);
 for(let i=0;i<60;i++){const x=r()*n,y=r()*n,w=4+r()*30,l=10+r()*60;const g=a.createLinearGradient(0,y,0,y+l);g.addColorStop(0,'rgba(120,60,20,.25)');g.addColorStop(1,'rgba(120,60,20,0)');a.fillStyle=g;a.fillRect(x,y,w,l);ro.fillStyle='rgba(255,255,255,.3)';ro.fillRect(x,y,w,l);}
 a.fillStyle='rgba(0,0,0,.3)';a.fillRect(0,0,n,6);a.fillRect(0,n-6,n,6);
 return{map:tex(A),normalMap:normalFrom(Hc,3),roughnessMap:tex(Rc,false)};}

/* cast concrete with form lines and tie holes */
export function concreteSet(seed=12){const n=256,f=fbm(n,seed,5,4),g=fbm(n,seed+7,3,12);const A=fieldCanvas(n,f,(v,i)=>{const k=128+v*50+g[i]*20;return[k,k,k*1.02];});const a=A.getContext('2d'),r=rng(seed);
 const Hc=fieldCanvas(n,f,v=>{const q=110+v*40;return[q,q,q];});const h=Hc.getContext('2d');
 for(const y of[0,n/2]){a.fillStyle='rgba(0,0,0,.28)';a.fillRect(0,y,n,2);h.fillStyle='#303030';h.fillRect(0,y,n,2);}a.fillRect(n/2,0,2,n);h.fillRect(n/2,0,2,n);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++){const x=i*n/4+n/8,y=j*n/4+n/8;a.fillStyle='rgba(20,20,20,.6)';a.beginPath();a.arc(x,y,3,0,7);a.fill();h.fillStyle='#202020';h.beginPath();h.arc(x,y,3,0,7);h.fill();}
 for(let i=0;i<30;i++){const x=r()*n,y=r()*n;const gr=a.createLinearGradient(0,y,0,y+40+r()*60);gr.addColorStop(0,'rgba(30,30,30,.18)');gr.addColorStop(1,'rgba(30,30,30,0)');a.fillStyle=gr;a.fillRect(x,y,2+r()*5,100);}
 const Rc=fieldCanvas(n,g,v=>{const q=190+v*60;return[q,q,q];});return{map:tex(A),normalMap:normalFrom(Hc,2),roughnessMap:tex(Rc,false)};}

/* sci-fi wall / hull panels (from NOVA ARENA) */
export function panelSet(base='#5a6170',seed=3,o={}){const n=512,r=rng(seed);const A=canvas(n),Hc=canvas(n),Rc=canvas(n),a=A.getContext('2d'),h=Hc.getContext('2d'),ro=Rc.getContext('2d');
 a.fillStyle=base;a.fillRect(0,0,n,n);h.fillStyle='#808080';h.fillRect(0,0,n,n);ro.fillStyle=o.rough||'#8a8a8a';ro.fillRect(0,0,n,n);
 for(let i=0;i<2600;i++){const x=r()*n,y=r()*n;a.fillStyle=`rgba(${r()<.5?'0,0,0':'255,255,255'},${r()*.05})`;a.fillRect(x,y,2+r()*6,2+r()*6);}
 const panel=(x,y,w,hh,depth)=>{h.fillStyle=`rgb(${128+depth},${128+depth},${128+depth})`;h.fillRect(x+3,y+3,w-6,hh-6);h.strokeStyle='#202020';h.lineWidth=3;h.strokeRect(x+1.5,y+1.5,w-3,hh-3);
  a.strokeStyle='rgba(0,0,0,.55)';a.lineWidth=2.5;a.strokeRect(x+1.5,y+1.5,w-3,hh-3);a.strokeStyle='rgba(255,255,255,.08)';a.lineWidth=1;a.strokeRect(x+4,y+4,w-8,hh-8);
  const sh=r()*.12-.05;a.fillStyle=sh>0?`rgba(255,255,255,${sh})`:`rgba(0,0,0,${-sh})`;a.fillRect(x+3,y+3,w-6,hh-6);
  ro.fillStyle=`rgb(${110+r()*70|0},${110+r()*70|0},${110+r()*70|0})`;ro.fillRect(x+3,y+3,w-6,hh-6);
  for(const[cx,cy]of[[x+9,y+9],[x+w-9,y+9],[x+9,y+hh-9],[x+w-9,y+hh-9]]){a.fillStyle='rgba(0,0,0,.5)';a.beginPath();a.arc(cx,cy,3,0,7);a.fill();h.fillStyle='#c0c0c0';h.beginPath();h.arc(cx,cy,3,0,7);h.fill();}};
 const split=(x,y,w,hh,d)=>{if(d>2||w<90||hh<90||r()<.18*d){panel(x,y,w,hh,(r()*30-12)|0);
   if(o.stripes&&r()<.18){a.save();a.beginPath();a.rect(x+6,y+hh-22,w-12,14);a.clip();for(let k=-2;k<w/14+2;k++){a.fillStyle=k%2?'#1a1a1a':o.stripes;a.beginPath();a.moveTo(x+k*14,y+hh-8);a.lineTo(x+k*14+14,y+hh-8);a.lineTo(x+k*14+28,y+hh-22);a.lineTo(x+k*14+14,y+hh-22);a.fill();}a.restore();}return;}
  if(w>hh){const s=(.3+r()*.4)*w|0;split(x,y,s,hh,d+1);split(x+s,y,w-s,hh,d+1);}else{const s=(.3+r()*.4)*hh|0;split(x,y,w,s,d+1);split(x,y+s,w,hh-s,d+1);}};
 split(0,0,n/2,n/2,0);split(n/2,0,n/2,n/2,0);split(0,n/2,n/2,n/2,0);split(n/2,n/2,n/2,n/2,0);
 return{map:tex(A),normalMap:normalFrom(Hc,3),roughnessMap:tex(Rc,false)};}

/* striped awning fabric */
export function awningTex(c1,c2){const c=canvas(128,64),x=c.getContext('2d');for(let i=0;i<8;i++){x.fillStyle=i%2?c2:c1;x.fillRect(i*16,0,16,64);}const g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(0,0,0,.25)');x.fillStyle=g;x.fillRect(0,0,128,64);
 x.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<8;i++){x.beginPath();x.arc(i*16+8,64,8,Math.PI,0);x.fill();}return tex(c);}
/* hexagon line pattern (barriers, domes, holograms) */
export function hexTex(){const n=256,c=canvas(n),x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,n,n);x.strokeStyle='#fff';x.lineWidth=3;const R=n/8,w=R*Math.sqrt(3);
 for(let j=-1;j<6;j++)for(let i=-1;i<6;i++){const cx=i*w+(j%2?w/2:0),cy=j*R*1.5;x.beginPath();for(let k=0;k<7;k++){const a=k/6*Math.PI*2+Math.PI/6;x.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);}x.stroke();}
 return tex(c,false);}
export function glowTex(){const n=128,c=canvas(n),x=c.getContext('2d'),g=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,n,n);return tex(c,false,false);}
export function decalTex(){const n=128,c=canvas(n),x=c.getContext('2d'),r=rng(4);const g=x.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'rgba(0,0,0,.9)');g.addColorStop(.35,'rgba(10,8,8,.65)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,n,n);
 for(let i=0;i<14;i++){const a=r()*7,l=20+r()*40;x.strokeStyle='rgba(0,0,0,.45)';x.lineWidth=2+r()*3;x.beginPath();x.moveTo(n/2,n/2);x.lineTo(n/2+Math.cos(a)*l,n/2+Math.sin(a)*l);x.stroke();}return tex(c,true,false);}
// soft ring (ground markers: objective, heal zones, impact warnings)
export function ringTex(){const n=256,c=canvas(n),x=c.getContext('2d');const g=x.createRadialGradient(n/2,n/2,n*.3,n/2,n/2,n/2);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.75,'rgba(255,255,255,.25)');g.addColorStop(.93,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,n,n);
 x.strokeStyle='rgba(255,255,255,.5)';x.lineWidth=3;for(let i=0;i<24;i++){const a=i/24*Math.PI*2;x.beginPath();x.moveTo(n/2+Math.cos(a)*n*.36,n/2+Math.sin(a)*n*.36);x.lineTo(n/2+Math.cos(a)*n*.41,n/2+Math.sin(a)*n*.41);x.stroke();}return tex(c,false,false);}
