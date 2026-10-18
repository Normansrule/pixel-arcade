// NEON BAY — procedural canvas textures: asphalt + markings, pavers, wood, concrete, noise, neon/billboard atlas, sprites.
import {THREE,ctex,rng} from './util.js';
const R=rng(77);
function grain(x,w,h,n,a,dark=.5){for(let i=0;i<n;i++){const v=R();x.fillStyle=v<dark?`rgba(0,0,0,${R()*a})`:`rgba(255,255,255,${R()*a*.6})`;x.fillRect(R()*w,R()*h,1+R()*2,1+R()*2);}}
function asphalt(x,w,h){x.fillStyle='#2c2e33';x.fillRect(0,0,w,h);grain(x,w,h,w*h/6,.22);
 for(let i=0;i<14;i++){x.strokeStyle=`rgba(10,10,12,${.25+R()*.3})`;x.lineWidth=.6+R();x.beginPath();let px=R()*w,py=R()*h;x.moveTo(px,py);for(let k=0;k<6;k++){px+=(R()-.5)*30;py+=R()*24;x.lineTo(px,py);}x.stroke();}
 for(let i=0;i<10;i++){x.fillStyle=`rgba(0,0,0,${.08+R()*.1})`;x.beginPath();x.ellipse(R()*w,R()*h,8+R()*20,6+R()*30,R()*3,0,7);x.fill();}}
const paint=(x,c,a=.92)=>{x.fillStyle=c;x.globalAlpha=a;};
// street: 14 m across (256 px), 32 m along (512 px). centre double yellow, white edge lines
export function streetTex(){return ctex(256,512,(x,w,h)=>{asphalt(x,w,h);const m=w/14;paint(x,'#e8c440');x.fillRect(w/2-.32*m,0,.13*m,h);x.fillRect(w/2+.19*m,0,.13*m,h);paint(x,'#e8e8e8',.85);x.fillRect(.45*m,0,.14*m,h);x.fillRect(w-.59*m,0,.14*m,h);x.globalAlpha=1;grain(x,w,h,1600,.25);});}
// freeway: 22 m across, dashed lane dividers at +-5.5 m
export function fwyTex(){return ctex(256,512,(x,w,h)=>{asphalt(x,w,h);const m=w/22;paint(x,'#e8c440');x.fillRect(w/2-.3*m,0,.12*m,h);x.fillRect(w/2+.18*m,0,.12*m,h);paint(x,'#eee',.85);x.fillRect(.5*m,0,.16*m,h);x.fillRect(w-.66*m,0,.16*m,h);
 for(const u of[w/2-5.5*m,w/2+5.5*m])for(let v=0;v<h;v+=h/2)x.fillRect(u-.08*m,v,.16*m,h/4.5);x.globalAlpha=1;grain(x,w,h,1600,.25);});}
// intersection: 14x14 m, zebra crossings on each side
export function interTex(){return ctex(256,256,(x,w,h)=>{asphalt(x,w,h);const m=w/14;paint(x,'#e8e8e8',.8);for(let k=0;k<7;k++){const o=(k*2+.6)*m*.95;x.fillRect(o,.25*m,.9*m,2.1*m);x.fillRect(o,h-2.35*m,.9*m,2.1*m);x.fillRect(.25*m,o,2.1*m,.9*m);x.fillRect(w-2.35*m,o,2.1*m,.9*m);}x.globalAlpha=1;grain(x,w,h,900,.3);});}
// sidewalk pavers (4 m tile)
export function paverTex(){return ctex(256,256,(x,w,h)=>{x.fillStyle='#8a8680';x.fillRect(0,0,w,h);const n=4;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const v=150+R()*26|0;x.fillStyle=`rgb(${v},${v-4},${v-12})`;x.fillRect(i*w/n+2,j*h/n+2,w/n-4,h/n-4);}grain(x,w,h,3000,.18);
 for(let i=0;i<5;i++){x.fillStyle=`rgba(60,50,40,${R()*.12})`;x.beginPath();x.arc(R()*w,R()*h,6+R()*14,0,7);x.fill();}});}
export function woodTex(){return ctex(256,256,(x,w,h)=>{for(let i=0;i<8;i++){const v=R();x.fillStyle=`rgb(${150+v*40|0},${105+v*30|0},${70+v*20|0})`;x.fillRect(0,i*h/8,w,h/8-2);x.fillStyle='rgba(40,25,15,.6)';x.fillRect(0,i*h/8+h/8-2,w,2);
  for(let k=0;k<30;k++){x.fillStyle=`rgba(60,40,20,${R()*.25})`;x.fillRect(R()*w,i*h/8+R()*h/8,20+R()*60,1);}const cut=R()*w;x.fillStyle='rgba(30,20,10,.7)';x.fillRect(cut,i*h/8,2,h/8);}});}
export function concreteTex(){return ctex(256,256,(x,w,h)=>{x.fillStyle='#a9a69f';x.fillRect(0,0,w,h);grain(x,w,h,9000,.16);for(let i=0;i<20;i++){x.fillStyle=`rgba(70,65,60,${R()*.1})`;x.beginPath();x.arc(R()*w,R()*h,4+R()*30,0,7);x.fill();}x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,0,w,2);x.fillRect(0,0,2,h);});}
export function noiseTex(){return ctex(256,256,(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);for(let i=0;i<500;i++){const v=R()*255|0;x.fillStyle=`rgba(${v},${v},${v},.08)`;x.beginPath();x.arc(R()*w,R()*h,3+R()*24,0,7);x.fill();}grain(x,w,h,12000,.2);},{srgb:false});}
export function sandTex(){return noiseTex();}
// soft radial sprite (light pools, beams)
export function glowTex(){return ctex(128,128,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true,srgb:false});}
export function beamTex(){return ctex(64,128,(x,w,h)=>{const g=x.createLinearGradient(0,h,0,0);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);const s=x.createLinearGradient(0,0,w,0);s.addColorStop(0,'rgba(0,0,0,1)');s.addColorStop(.5,'rgba(0,0,0,0)');s.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=s;x.fillRect(0,0,w,h);},{clamp:true,srgb:false});}
// skid mark strip
export function skidTex(){return ctex(32,64,(x,w,h)=>{x.clearRect(0,0,w,h);for(let i=0;i<w;i++){const a=.5+R()*.5;x.fillStyle=`rgba(255,255,255,${a})`;x.fillRect(i,0,1,h);}},{clamp:true,srgb:false});}

/* ---------- sign atlas: 4 cols x 6 rows of 512x256 cells ---------- */
export const ATLAS={cols:4,rows:6};
const NEON=[['MOTEL','#ff3fa4','#36f0ff'],['BAR','#36f0ff','#ff3fa4'],['TACOS','#ffd23f','#ff5a1f'],['24/7','#7dff6a','#36f0ff'],['DINER','#ff5a5a','#ffe9a0'],['ARCADE','#b06bff','#36f0ff'],['SURF','#36f0ff','#ffd23f'],['HOTEL','#ff8a3d','#ff3fa4']];
const ADS=[['SUNBURST','COLA','#ff5a1f','#ffd23f','#2a0a04'],['PALMS','RESORT & SPA','#1fd1c4','#fff4d6','#06302e'],['MANGO','MOBILE','#ffb31a','#ffffff','#3a1a00'],['BYTE','BURGER','#ff3b5c','#ffe9a0','#2a0610'],['TURBO','TIRES','#e8e8e8','#ff4d00','#101216'],['NIGHT OWL','RADIO 88.1','#b06bff','#36f0ff','#0c0620'],['BAY','BANK','#3d8bff','#ffffff','#061230'],['SURF & SAND','RENTALS','#36f0ff','#ffd23f','#04202a']];
const POI=[['TAXI','#ffd23f','#ff9a1f'],['MOTORS','#36f0ff','#3d8bff'],["SPRAY",'#ff3fa4','#ffd23f'],['POLICE','#3d8bff','#ffffff'],['COURIER','#7dff6a','#ffffff'],['LOOKOUT','#ffe9a0','#ff8a3d'],['NEON BAY','#ff3fa4','#36f0ff'],['OPEN','#ff5a5a','#ffffff']];
export function signAtlas(){const CW=512,CH=256;return ctex(CW*4,CH*6,(x)=>{x.textBaseline='middle';x.textAlign='center';
 const cell=(i,f)=>{const cx=(i%4)*CW,cy=(i/4|0)*CH;x.save();x.beginPath();x.rect(cx,cy,CW,CH);x.clip();x.translate(cx,cy);f();x.restore();};
 const neon=(t,c1,c2,size)=>{x.fillStyle='#0b0b10';x.fillRect(0,0,CW,CH);x.strokeStyle='#1d1d26';x.lineWidth=10;x.strokeRect(5,5,CW-10,CH-10);x.font=`${size}px Anton, Impact, sans-serif`;
  x.shadowColor=c1;x.shadowBlur=28;x.fillStyle=c1;x.fillText(t,CW/2,CH/2+6);x.shadowBlur=8;x.fillStyle='#fff';x.globalAlpha=.75;x.fillText(t,CW/2,CH/2+6);x.globalAlpha=1;x.shadowBlur=18;x.shadowColor=c2;x.strokeStyle=c2;x.lineWidth=6;x.strokeRect(22,22,CW-44,CH-44);x.shadowBlur=0;};
 NEON.forEach(([t,a,b],i)=>cell(i,()=>neon(t,a,b,t.length>5?120:150)));
 ADS.forEach(([t,s,a,b,bg],i)=>cell(8+i,()=>{const g=x.createLinearGradient(0,0,CW,CH);g.addColorStop(0,bg);g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,CW,CH);
  x.fillStyle=a;x.globalAlpha=.25;for(let k=0;k<6;k++){x.beginPath();x.arc(CW*.82,CH*.5,30+k*26,0,7);x.lineWidth=8;x.strokeStyle=a;x.stroke();}x.globalAlpha=1;
  x.textAlign='left';x.font=`${t.length>8?96:120}px Anton, Impact, sans-serif`;x.fillStyle=a;x.fillText(t,28,CH*.4);x.font='bold 38px "JetBrains Mono", monospace';x.fillStyle=b;x.fillText(s,32,CH*.78);x.textAlign='center';
  x.fillStyle=a;x.fillRect(0,CH-14,CW,14);}));
 POI.forEach(([t,a,b],i)=>cell(16+i,()=>neon(t,a,b,t.length>6?100:130)));});}
// small icon sprites for map markers (letters on rounded squares)
export function iconTex(letter,bg,fg='#000'){return ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle=bg;x.beginPath();x.roundRect(8,8,w-16,h-16,26);x.fill();x.fillStyle=fg;x.font='bold 70px "JetBrains Mono", monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(letter,w/2,h/2+4);},{clamp:true});}
export {THREE};

/* ================= realism pass: paired albedo + normal maps baked once at load ================= */
const R2=rng(4711);
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function toTex(c,o={}){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
// tangent-space normal map from a grayscale height canvas (wraps at the edges)
export function normalFromHeight(hc,k=2){const w=hc.width,h=hc.height,src=hc.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data,out=canvas(w,h),x=out.getContext('2d',{willReadFrequently:true}),img=x.createImageData(w,h),d=img.data;
 const H=(i,j)=>src[(((j+h)%h)*w+((i+w)%w))*4]/255;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(H(i+1,j)-H(i-1,j))*k,dy=(H(i,j+1)-H(i,j-1))*k;const l=Math.hypot(dx,dy,1);const o=(j*w+i)*4;d[o]=(-dx/l*.5+.5)*255;d[o+1]=(dy/l*.5+.5)*255;d[o+2]=(1/l*.5+.5)*255;d[o+3]=255;}
 x.putImageData(img,0,0);return toTex(out,{srgb:false});}
// per-pixel speckle on both canvases (aggregate stones)
function speckle(A,H,amtA,amtH,dens=1){const w=A.width,h=A.height,a=A.getContext('2d',{willReadFrequently:true}),hh=H.getContext('2d',{willReadFrequently:true});const ia=a.getImageData(0,0,w,h),ih=hh.getImageData(0,0,w,h),da=ia.data,dh=ih.data;
 for(let i=0;i<w*h;i++){if(R2()>dens)continue;const n=R2()-.5,s=R2()<.06?(R2()-.3)*2.4:0;const o=i*4;const va=(n*amtA+s*amtA*.8);da[o]=cl8(da[o]+va);da[o+1]=cl8(da[o+1]+va);da[o+2]=cl8(da[o+2]+va*1.05);dh[o]=dh[o+1]=dh[o+2]=cl8(dh[o]+(n+s)*amtH);}
 a.putImageData(ia,0,0);hh.putImageData(ih,0,0);}
const cl8=v=>v<0?0:v>255?255:v;
function blobs(x,w,h,n,col,r0,r1,a0,a1,o={}){for(let i=0;i<n;i++){const cx=o.x?o.x():R2()*w,cy=o.y?o.y():R2()*h,r=r0+R2()*(r1-r0);const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,col(a0+R2()*(a1-a0)));g.addColorStop(1,col(0));x.fillStyle=g;x.save();x.translate(cx,cy);x.scale(1,o.sy||1);x.translate(-cx,-cy);x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.restore();}}
function crack(a,hh,w,h,x0,y0,len,step=10){let px=x0,py=y0;const pts=[[px,py]];for(let k=0;k<len;k++){px+=(R2()-.5)*step*1.6;py+=(R2()-.2)*step;pts.push([px,py]);}
 for(const [c,lw,col] of [[a,1.6,'rgba(12,12,14,.75)'],[hh,2.2,'rgb(70,70,70)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 // tar sealant over some cracks
 if(R2()<.5){a.strokeStyle='rgba(8,8,9,.55)';a.lineWidth=7;a.beginPath();pts.forEach(([x,y],i)=>i?a.lineTo(x,y):a.moveTo(x,y));a.stroke();}}
// painted line with worn, broken edges
function wornRect(a,hh,x,y,w,h,col){a.fillStyle=col;a.globalAlpha=.9;a.fillRect(x,y,w,h);a.globalAlpha=1;hh.fillStyle='rgba(255,255,255,.12)';hh.fillRect(x,y,w,h);
 const n=(w*h)/26|0;a.globalCompositeOperation='destination-out';for(let i=0;i<n;i++){a.fillStyle=`rgba(0,0,0,${.25+R2()*.5})`;a.fillRect(x+R2()*w,y+R2()*h,1+R2()*3,1+R2()*4);}a.globalCompositeOperation='source-over';}
function asphaltBase(w,h,mPerPx,lanesPx){const A=canvas(w,h),H=canvas(w,h),a=A.getContext('2d',{willReadFrequently:true}),hh=H.getContext('2d',{willReadFrequently:true});a.fillStyle='#38393c';a.fillRect(0,0,w,h);hh.fillStyle='rgb(128,128,128)';hh.fillRect(0,0,w,h);
 // large-scale tone variation
 blobs(a,w,h,26,al=>`rgba(18,18,20,${al})`,20,90,.12,.3);blobs(a,w,h,14,al=>`rgba(120,118,112,${al})`,20,80,.05,.12);
 // polished, darker wheel paths along each lane
 for(const u of lanesPx||[]){const g=a.createLinearGradient(u-26,0,u+26,0);g.addColorStop(0,'rgba(10,10,12,0)');g.addColorStop(.5,'rgba(10,10,12,.28)');g.addColorStop(1,'rgba(10,10,12,0)');a.fillStyle=g;a.fillRect(u-26,0,52,h);}
 // patch repairs
 for(let i=0;i<4;i++){const pw=40+R2()*90,ph=40+R2()*120,px=R2()*(w-pw),py=20+R2()*(h-ph-40);a.fillStyle=`rgba(${R2()<.5?'20,20,22':'70,70,72'},.35)`;a.fillRect(px,py,pw,ph);a.strokeStyle='rgba(8,8,9,.6)';a.lineWidth=3;a.strokeRect(px,py,pw,ph);hh.fillStyle='rgba(150,150,150,.4)';hh.fillRect(px,py,pw,ph);hh.strokeStyle='rgb(90,90,90)';hh.lineWidth=2;hh.strokeRect(px,py,pw,ph);}
 for(let i=0;i<9;i++)crack(a,hh,w,h,R2()*w,20+R2()*(h-140),8+R2()*10,8+R2()*6);
 // oil drips down the lane centres
 for(const u of lanesPx||[])blobs(a,w,h,10,al=>`rgba(4,4,6,${al})`,4,16,.25,.5,{x:()=>u+(R2()-.5)*30,sy:1.6});
 speckle(A,H,46,70,.85);return{A,H,a,hh};}
// street: 14 m across x 32 m along; centre double yellow, white edges, lane wheel paths, a manhole
export function streetSet(){const w=512,h=1024,m=w/14;const{A,H,a,hh}=asphaltBase(w,h,1/m,[w/2-3.5*m-.85*m,w/2-3.5*m+.85*m,w/2+3.5*m-.85*m,w/2+3.5*m+.85*m]);
 wornRect(a,hh,w/2-.32*m,0,.12*m,h,'#e2b93a');wornRect(a,hh,w/2+.2*m,0,.12*m,h,'#e2b93a');wornRect(a,hh,.5*m,0,.14*m,h,'#e6e6e2');wornRect(a,hh,w-.64*m,0,.14*m,h,'#e6e6e2');
 // gutter grime along both curbs
 for(const [x0,x1] of [[0,.5*m],[w-.5*m,w]]){const g=a.createLinearGradient(x0,0,x1,0);const L=x0===0;g.addColorStop(0,`rgba(20,18,16,${L?.55:0})`);g.addColorStop(1,`rgba(20,18,16,${L?0:.55})`);a.fillStyle=g;a.fillRect(x0,0,x1-x0,h);}
 // manhole + storm drains
 const mx=w/2+3.5*m,my=h*.62,mr=.38*m;a.fillStyle='#2a2a2c';a.beginPath();a.arc(mx,my,mr,0,7);a.fill();a.strokeStyle='#18181a';a.lineWidth=3;a.stroke();for(let k=-3;k<=3;k++){a.fillStyle='#202022';a.fillRect(mx-mr*.7,my+k*mr*.22-1,mr*1.4,2);}
 hh.strokeStyle='rgb(60,60,60)';hh.lineWidth=3;hh.beginPath();hh.arc(mx,my,mr,0,7);hh.stroke();
 for(const gx of [.15*m,w-.75*m]){const gy=h*.3;a.fillStyle='#141416';a.fillRect(gx,gy,.6*m,1*m);hh.fillStyle='rgb(70,70,70)';hh.fillRect(gx,gy,.6*m,1*m);for(let k=0;k<6;k++){a.fillStyle='#3a3a3c';a.fillRect(gx+2,gy+k*m/6+3,.6*m-4,3);hh.fillStyle='rgb(150,150,150)';hh.fillRect(gx+2,gy+k*m/6+3,.6*m-4,3);}}
 return{map:toTex(A),nmap:normalFromHeight(H,3)};}
export function fwySet(){const w=512,h=1024,m=w/22;const L=[w/2-8*m,w/2-3*m,w/2+3*m,w/2+8*m].flatMap(u=>[u-.85*m,u+.85*m]);const{A,H,a,hh}=asphaltBase(w,h,1/m,L);
 wornRect(a,hh,w/2-.3*m,0,.12*m,h,'#e2b93a');wornRect(a,hh,w/2+.18*m,0,.12*m,h,'#e2b93a');wornRect(a,hh,.5*m,0,.16*m,h,'#e6e6e2');wornRect(a,hh,w-.66*m,0,.16*m,h,'#e6e6e2');
 for(const u of[w/2-5.5*m,w/2+5.5*m])for(let v=0;v<h;v+=h/2)wornRect(a,hh,u-.08*m,v+20,.16*m,h/4.5,'#e6e6e2');return{map:toTex(A),nmap:normalFromHeight(H,3)};}
export function interSet(){const w=512,h=512,m=w/14;const{A,H,a,hh}=asphaltBase(w,h,1/m,[]);for(let k=0;k<7;k++){const o=(k*2+.6)*m*.95;wornRect(a,hh,o,.25*m,.9*m,2.1*m,'#e6e6e2');wornRect(a,hh,o,h-2.35*m,.9*m,2.1*m,'#e6e6e2');wornRect(a,hh,.25*m,o,2.1*m,.9*m,'#e6e6e2');wornRect(a,hh,w-2.35*m,o,2.1*m,.9*m,'#e6e6e2');}
 blobs(a,w,h,12,al=>`rgba(6,6,8,${al})`,6,30,.15,.35,{x:()=>w*(.3+R2()*.4),y:()=>h*(.3+R2()*.4)});return{map:toTex(A),nmap:normalFromHeight(H,3)};}
// sidewalk: poured concrete squares with expansion joints, gum spots and stains (4 m tile)
export function walkSet(){const w=512,h=512,A=canvas(w,h),H=canvas(w,h),a=A.getContext('2d',{willReadFrequently:true}),hh=H.getContext('2d',{willReadFrequently:true});a.fillStyle='#8f8a82';a.fillRect(0,0,w,h);hh.fillStyle='rgb(140,140,140)';hh.fillRect(0,0,w,h);
 const n=3,s=w/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const v=R2()*18-9|0;a.fillStyle=`rgba(${v>0?'255,255,250':'40,36,30'},${Math.abs(v)/120})`;a.fillRect(i*s,j*s,s,s);blobs(a,0,0,2,al=>`rgba(60,52,40,${al})`,8,40,.05,.14,{x:()=>i*s+R2()*s,y:()=>j*s+R2()*s});}
 a.fillStyle='rgba(40,36,32,.55)';hh.fillStyle='rgb(40,40,40)';for(let i=0;i<=n;i++){a.fillRect(i*s-1.5,0,3,h);a.fillRect(0,i*s-1.5,w,3);hh.fillRect(i*s-2,0,4,h);hh.fillRect(0,i*s-2,w,4);}
 for(let i=0;i<40;i++){a.fillStyle=`rgba(30,28,26,${.2+R2()*.3})`;a.beginPath();a.arc(R2()*w,R2()*h,1.5+R2()*2.5,0,7);a.fill();}
 for(let i=0;i<3;i++)crack(a,hh,w,h,R2()*w,R2()*h,4+R2()*5,7);speckle(A,H,22,40,.9);return{map:toTex(A),nmap:normalFromHeight(H,2.2)};}
// tiling grime / weathering mask for facades (R: streaks, G: blotches), linear
export function grimeTex(){const w=512,h=512,c=canvas(w,h),x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='rgb(128,128,0)';x.fillRect(0,0,w,h);
 for(let i=0;i<260;i++){const px=R2()*w,len=30+R2()*220,wd=1+R2()*5,py=R2()*h;const g=x.createLinearGradient(0,py,0,py+len);const v=R2()<.8?'0,0,0':'255,0,0';g.addColorStop(0,`rgba(${v},${.25+R2()*.3})`);g.addColorStop(1,`rgba(${v},0)`);x.fillStyle=g;x.fillRect(px,py,wd,len);if(py+len>h){x.fillRect(px,py-h,wd,len);}}
 x.globalCompositeOperation='lighter';for(let i=0;i<60;i++){const cx=R2()*w,cy=R2()*h,r=10+R2()*60;const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,`rgba(0,${R2()*70|0},0,1)`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2);}
 x.globalCompositeOperation='source-over';return toTex(c,{srgb:false});}
