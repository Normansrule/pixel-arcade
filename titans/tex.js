// HARDFALL — procedural PBR texture sets (albedo + normal + roughness) drawn on canvas; no image files.
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

/* ===== HARDFALL: city + frontier sets ===== */
// building facade: 1024px = 16 m (4x4 bays of 4 m: floor line + window); emissive map lights random windows
export function facadeSet(base='#8a8378',seed=7,o={}){const n=1024,r=rng(seed),A=canvas(n),Hc=canvas(n),Rc=canvas(n),Ec=canvas(n),a=A.getContext('2d'),h=Hc.getContext('2d'),ro=Rc.getContext('2d'),e=Ec.getContext('2d');
 const st=o.style||'conc',bay=n/4;a.fillStyle=base;a.fillRect(0,0,n,n);h.fillStyle='#909090';h.fillRect(0,0,n,n);ro.fillStyle='#c8c8c8';ro.fillRect(0,0,n,n);e.fillStyle='#000';e.fillRect(0,0,n,n);
 const nz=fbm(128,seed,5,4);const id=a.getImageData(0,0,n,n);for(let i=0;i<n*n;i++){const k=nz[((i/n|0)>>3)*128+((i%n)>>3)]*.32+.84;id.data[i*4]*=k;id.data[i*4+1]*=k;id.data[i*4+2]*=k;}a.putImageData(id,0,0);
 for(let i=0;i<9000;i++){a.fillStyle=`rgba(${r()<.6?'0,0,0':'255,255,255'},${r()*.06})`;a.fillRect(r()*n,r()*n,1+r()*3,1+r()*3);}
 const lit=o.lit??.3,warm=['#ffcf8a','#ffe2b0','#bfe4ff','#ffb870','#fff0d0'];
 for(let fy=0;fy<4;fy++)for(let bx=0;bx<4;bx++){const x0=bx*bay,y0=fy*bay;
  // floor band
  a.fillStyle='rgba(0,0,0,.18)';a.fillRect(x0,y0+bay-14,bay,14);a.fillStyle='rgba(255,255,255,.07)';a.fillRect(x0,y0+bay-16,bay,2);h.fillStyle='#a8a8a8';h.fillRect(x0,y0+bay-14,bay,14);
  if(st==='glass'){const wx=x0+6,wy=y0+6,ww=bay-12,wh=bay-26;const g=a.createLinearGradient(0,wy,0,wy+wh);g.addColorStop(0,o.sky||'#8fb0c8');g.addColorStop(.5,o.glass||'#33475a');g.addColorStop(1,'#1a2430');a.fillStyle=g;a.fillRect(wx,wy,ww,wh);
   a.fillStyle='rgba(255,255,255,.12)';a.beginPath();a.moveTo(wx+ww*.1,wy);a.lineTo(wx+ww*.45,wy);a.lineTo(wx+ww*.05,wy+wh);a.lineTo(wx,wy+wh);a.fill();
   ro.fillStyle='#141414';ro.fillRect(wx,wy,ww,wh);a.fillStyle='#2a2e34';a.fillRect(x0+bay/2-3,wy,6,wh);h.fillStyle='#b0b0b0';h.fillRect(x0+bay/2-3,wy,6,wh);h.fillStyle='#606060';h.fillRect(wx,wy,ww/2-4,wh);h.fillRect(x0+bay/2+4,wy,ww/2-4,wh);
   if(r()<lit){e.fillStyle=warm[r()*warm.length|0];e.globalAlpha=.35+r()*.5;e.fillRect(wx+(r()<.5?0:ww/2+4),wy,ww/2-4,wh);e.globalAlpha=1;}continue;}
  const ww=st==='slot'?bay*.78:bay*.5,wh=st==='slot'?bay*.28:bay*.52,wx=x0+(bay-ww)/2,wy=y0+(st==='slot'?bay*.3:bay*.2);
  // recess + frame + glass
  h.fillStyle='#404040';h.fillRect(wx-6,wy-6,ww+12,wh+12);a.fillStyle='rgba(0,0,0,.35)';a.fillRect(wx-6,wy-6,ww+12,wh+12);
  const g=a.createLinearGradient(0,wy,0,wy+wh);g.addColorStop(0,'#5a6a78');g.addColorStop(.6,'#232c36');g.addColorStop(1,'#141a20');a.fillStyle=g;a.fillRect(wx,wy,ww,wh);
  a.fillStyle='rgba(255,255,255,.1)';a.beginPath();a.moveTo(wx+ww*.15,wy);a.lineTo(wx+ww*.5,wy);a.lineTo(wx+ww*.15,wy+wh);a.lineTo(wx,wy+wh);a.lineTo(wx,wy+wh*.6);a.fill();
  a.fillStyle=o.frame||'#3b3d40';a.fillRect(wx+ww/2-3,wy,6,wh);a.fillRect(wx,wy+wh*.35,ww,5);a.fillStyle='rgba(255,255,255,.18)';a.fillRect(wx-8,wy+wh+6,ww+16,6);h.fillStyle='#c8c8c8';h.fillRect(wx-8,wy+wh+6,ww+16,8);
  ro.fillStyle='#181818';ro.fillRect(wx,wy,ww,wh);
  // streaks below the sill
  for(let k=0;k<5;k++){const sx=wx+r()*ww,sl=20+r()*60;const sg=a.createLinearGradient(0,wy+wh+10,0,wy+wh+10+sl);sg.addColorStop(0,'rgba(20,14,8,.28)');sg.addColorStop(1,'rgba(20,14,8,0)');a.fillStyle=sg;a.fillRect(sx,wy+wh+10,2+r()*4,sl);}
  if(r()<lit){e.fillStyle=warm[r()*warm.length|0];e.globalAlpha=.4+r()*.5;e.fillRect(wx,wy,ww,wh);e.globalAlpha=1;e.fillStyle='rgba(0,0,0,.5)';e.fillRect(wx+ww/2-3,wy,6,wh);e.fillRect(wx,wy+wh*.35,ww,5);}
  if(o.ac&&r()<.18){a.fillStyle='#9a9a94';a.fillRect(wx+ww*.55,wy+wh+16,ww*.4,40);a.fillStyle='#55575a';for(let k=0;k<6;k++)a.fillRect(wx+ww*.57,wy+wh+20+k*6,ww*.36,2);h.fillStyle='#d0d0d0';h.fillRect(wx+ww*.55,wy+wh+16,ww*.4,40);}}
 if(o.stripe){a.fillStyle=o.stripe;for(let fy=0;fy<4;fy++)a.fillRect(0,fy*bay+bay-24,n,8);}
 return{map:tex(A),normalMap:normalFrom(Hc,2.2),roughnessMap:tex(Rc,false),emissiveMap:tex(Ec)};}

// corrugated shipping container (512 = 4 m)
export function containerSet(col='#8a2f22',seed=3,label=''){const n=512,r=rng(seed),A=canvas(n),Hc=canvas(n),a=A.getContext('2d'),h=Hc.getContext('2d');a.fillStyle=col;a.fillRect(0,0,n,n);
 for(let x=0;x<n;x+=32){const g=a.createLinearGradient(x,0,x+32,0);g.addColorStop(0,'rgba(0,0,0,.28)');g.addColorStop(.3,'rgba(255,255,255,.1)');g.addColorStop(.6,'rgba(0,0,0,.05)');g.addColorStop(1,'rgba(0,0,0,.28)');a.fillStyle=g;a.fillRect(x,0,32,n);
  const hg=h.createLinearGradient(x,0,x+32,0);hg.addColorStop(0,'#404040');hg.addColorStop(.5,'#d0d0d0');hg.addColorStop(1,'#404040');h.fillStyle=hg;h.fillRect(x,0,32,n);}
 for(let i=0;i<40;i++){const x=r()*n,y=r()*n,l=30+r()*140;const g=a.createLinearGradient(0,y,0,y+l);g.addColorStop(0,'rgba(90,40,10,.45)');g.addColorStop(1,'rgba(90,40,10,0)');a.fillStyle=g;a.fillRect(x,y,2+r()*5,l);}
 for(let i=0;i<3000;i++){a.fillStyle=`rgba(${r()<.5?'0,0,0':'255,240,220'},${r()*.08})`;a.fillRect(r()*n,r()*n,1+r()*3,1+r()*2);}
 if(label){a.save();a.font='bold 54px Anton, Impact, sans-serif';a.fillStyle='rgba(240,236,228,.75)';a.textAlign='center';a.fillText(label,n/2,n*.42);a.font='bold 20px "JetBrains Mono",monospace';a.fillText('HFX '+(100000+r()*800000|0),n/2,n*.42+34);a.restore();}
 return{map:tex(A),normalMap:normalFrom(Hc,1.6)};}

// asphalt / sand / concrete slabs (512 = 4 m)
export function groundSet(kind='asphalt',seed=13,o={}){const n=512,r=rng(seed),f=fbm(256,seed,6,4),g2=fbm(256,seed+9,3,16);
 const pal={asphalt:[[52,52,54],[30,30,33]],sand:[[176,146,108],[128,100,72]],conc:[[150,146,140],[108,104,100]],dirt:[[112,92,70],[66,54,44]]}[kind];
 const A=fieldCanvas(256,f,(v,i)=>{const m=g2[i];const k=v*.75+m*.25;return pal[1].map((c,j)=>c+(pal[0][j]-c)*k);});
 const a=A.getContext('2d');for(let i=0;i<2600;i++){a.fillStyle=`rgba(${r()<.5?'0,0,0':'255,255,255'},${r()*.09})`;a.fillRect(r()*256,r()*256,1,1);}
 if(kind==='conc'){a.strokeStyle='rgba(30,28,26,.55)';a.lineWidth=1.5;for(let i=0;i<=2;i++){a.beginPath();a.moveTo(i*128,0);a.lineTo(i*128,256);a.stroke();a.beginPath();a.moveTo(0,i*128);a.lineTo(256,i*128);a.stroke();}}
 if(kind==='asphalt'){a.strokeStyle='rgba(10,10,10,.6)';a.lineWidth=1;for(let i=0;i<7;i++){let x=r()*256,y=r()*256;a.beginPath();a.moveTo(x,y);for(let k=0;k<8;k++){x+=(r()-.5)*24;y+=(r()-.5)*24;a.lineTo(x,y);}a.stroke();}
  for(let i=0;i<5;i++){a.fillStyle=`rgba(0,0,0,${.08+r()*.1})`;a.beginPath();a.ellipse(r()*256,r()*256,10+r()*30,6+r()*20,r()*3,0,7);a.fill();}}
 const Hc=fieldCanvas(256,f,(v,i)=>{const q=(v*.6+g2[i]*.4)*255;return[q,q,q];});const Rc=fieldCanvas(256,g2,v=>{const q=(kind==='asphalt'?150:200)+v*55;return[q,q,q];});
 return{map:tex(A),normalMap:normalFrom(Hc,kind==='sand'?4:2.5),roughnessMap:tex(Rc,false)};}

// flat roof: tar + gravel + seams
export function roofSet(seed=21){const n=512,r=rng(seed),A=canvas(n),a=A.getContext('2d');a.fillStyle='#5e5b56';a.fillRect(0,0,n,n);
 for(let i=0;i<30000;i++){const v=r();a.fillStyle=`rgba(${v<.5?'20,18,16':'210,205,195'},${r()*.22})`;a.fillRect(r()*n,r()*n,1+r()*2,1+r()*2);}
 a.strokeStyle='rgba(15,14,12,.5)';a.lineWidth=4;for(let i=0;i<=4;i++){a.beginPath();a.moveTo(i*128,0);a.lineTo(i*128,n);a.stroke();}
 for(let i=0;i<8;i++){a.fillStyle=`rgba(10,10,10,${.12+r()*.15})`;a.beginPath();a.ellipse(r()*n,r()*n,20+r()*60,12+r()*40,r()*3,0,7);a.fill();}
 const Hc=canvas(n),h=Hc.getContext('2d');h.drawImage(A,0,0);return{map:tex(A),normalMap:normalFrom(Hc,1.5)};}

// hazard stripes + metal for barriers / mech decks
export function hazardSet(){const n=256,A=canvas(n),a=A.getContext('2d');a.fillStyle='#e0b020';a.fillRect(0,0,n,n);a.fillStyle='#1a1a1a';for(let k=-4;k<8;k++){a.beginPath();a.moveTo(k*64,0);a.lineTo(k*64+32,0);a.lineTo(k*64+32+n,n);a.lineTo(k*64+n,n);a.fill();}
 for(let i=0;i<2000;i++){a.fillStyle=`rgba(0,0,0,${Math.random()*.2})`;a.fillRect(Math.random()*n,Math.random()*n,2,2);}return{map:tex(A)};}
