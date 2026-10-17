// SILENT CONTRACT — procedural canvas textures with derived normal maps (no image files): stucco, marble, parquet, terracotta,
// roof tiles, travertine, cliff rock, lawn, gravel, deck planks, kitchen tile, carpet, wood panelling, cellar brick, books, screens.
import * as THREE from '../vendor/three.module.min.js';

let seed=7;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
export const cnv=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function speckle(x,w,h,n,a,sz=2){for(let i=0;i<n;i++){const v=R();x.fillStyle=v<.5?`rgba(0,0,0,${a*R()})`:`rgba(255,255,255,${a*R()*.7})`;const s=1+R()*sz;x.fillRect(R()*w,R()*h,s,s);}}
function blotch(x,w,h,n,col,r0,r1){const col0=col.replace(/,[\d.]+\)$/,',0)');for(let i=0;i<n;i++){const r=r0+R()*(r1-r0),cx=R()*w,cy=R()*h;for(const ox of[-w,0,w])for(const oy of[-h,0,h]){const g=x.createRadialGradient(cx+ox,cy+oy,0,cx+ox,cy+oy,r);g.addColorStop(0,col);g.addColorStop(1,col0);x.fillStyle=g;x.fillRect(cx+ox-r,cy+oy-r,r*2,r*2);}}}
function normalFrom(src,str=2){const w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data,c=cnv(w,h),x=c.getContext('2d'),o=x.createImageData(w,h);
 const L=new Float32Array(w*h);for(let i=0;i<w*h;i++)L[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/765;
 {const r=Math.max(3,w>>7),B=new Float32Array(w*h),C=new Float32Array(w*h),k=1/(2*r+1);
  for(let j=0;j<h;j++){let s=0;for(let i=-r;i<=r;i++)s+=L[j*w+((i+w)%w)];for(let i=0;i<w;i++){B[j*w+i]=s*k;s+=L[j*w+(i+r+1)%w]-L[j*w+(i-r+w)%w];}}
  for(let i=0;i<w;i++){let s=0;for(let j=-r;j<=r;j++)s+=B[((j+h)%h)*w+i];for(let j=0;j<h;j++){C[j*w+i]=s*k;s+=B[((j+r+1)%h)*w+i]-B[((j-r+h)%h)*w+i];}}
  for(let i=0;i<w*h;i++)L[i]=L[i]-C[i];}
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(L[j*w+(i+1)%w]-L[j*w+(i-1+w)%w])*str,dy=(L[((j+1)%h)*w+i]-L[((j-1+h)%h)*w+i])*str,l=Math.hypot(dx,dy,1),k=(j*w+i)*4;o.data[k]=(-dx/l*.5+.5)*255;o.data[k+1]=(dy/l*.5+.5)*255;o.data[k+2]=(1/l*.5+.5)*255;o.data[k+3]=255;}
 x.putImageData(o,0,0);return c;}
export function T(c,srgb=true){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
function pair(size,draw,hdraw,str,rdraw){const c=cnv(size),x=c.getContext('2d');draw(x,size,size);let hc=c;if(hdraw){hc=cnv(size);hdraw(hc.getContext('2d'),size,size);}const o={map:T(c),normalMap:T(normalFrom(hc,str),false)};
 if(rdraw){const rc=cnv(size>>1);rdraw(rc.getContext('2d'),size>>1,size>>1);o.roughnessMap=T(rc,false);}return o;}
function vein(x,w,h,col,wid,len){let px=R()*w,py=R()*h,a=R()*6.28;x.strokeStyle=col;x.lineCap='round';for(let k=0;k<len;k++){const nx=px+Math.cos(a)*6,ny=py+Math.sin(a)*6;x.lineWidth=wid*(.4+R()*.9);
  for(const ox of[-w,0,w])for(const oy of[-h,0,h]){x.beginPath();x.moveTo(px+ox,py+oy);x.lineTo(nx+ox,ny+oy);x.stroke();}a+=(R()-.5)*.7;px=nx;py=ny;}}
function grid(x,w,h,n,col,lw){x.strokeStyle=col;x.lineWidth=lw;for(let i=0;i<=n;i++){const p=i*w/n;x.beginPath();x.moveTo(p,0);x.lineTo(p,h);x.stroke();x.beginPath();x.moveTo(0,p);x.lineTo(w,p);x.stroke();}}
function blocks(x,w,h,bw,bh,vary,mortar,gap=3,stag=.5){x.fillStyle=mortar;x.fillRect(0,0,w,h);for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const ox=(r%2)*bw*stag,v=R();x.fillStyle=vary(v);x.fillRect(c*bw+ox+gap/2,r*bh+gap/2,bw-gap,bh-gap);}}
function blocksH(x,w,h,bw,bh,gap=3,stag=.5){x.fillStyle='#202020';x.fillRect(0,0,w,h);for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const ox=(r%2)*bw*stag;x.fillStyle=`rgb(${170+R()*40|0},${170+R()*40|0},${170+R()*40|0})`;x.fillRect(c*bw+ox+gap/2+1,r*bh+gap/2+1,bw-gap-2,bh-gap-2);}speckle(x,w,h,6000,.35,2);}

export function makeTextures(q){seed=11;const S={};const big=q>=2?1024:512,mid=q>=1?512:256;
 // warm lime-wash stucco
 S.stucco=pair(mid,(x,w,h)=>{x.fillStyle='#ece0c8';x.fillRect(0,0,w,h);blotch(x,w,h,50,'rgba(214,190,150,.35)',30,140);blotch(x,w,h,40,'rgba(255,250,236,.4)',20,100);speckle(x,w,h,26000,.07,1.6);
  for(let i=0;i<8;i++){const sx=R()*w;const g=x.createLinearGradient(0,h*.6,0,h);g.addColorStop(0,'rgba(120,100,70,0)');g.addColorStop(1,'rgba(120,100,70,.18)');x.fillStyle=g;x.fillRect(sx,h*.6,8+R()*30,h*.4);}},null,1.4);
 // cream marble, 1 m slabs over 2 m
 S.marble=pair(big,(x,w,h)=>{x.fillStyle='#f0e8da';x.fillRect(0,0,w,h);blotch(x,w,h,40,'rgba(222,208,186,.5)',40,160);blotch(x,w,h,30,'rgba(255,255,255,.5)',30,120);
  for(let i=0;i<14;i++)vein(x,w,h,`rgba(${150+R()*40|0},${130+R()*30|0},${110+R()*30|0},${.14+R()*.22})`,1.4+R()*2,40+R()*60|0);for(let i=0;i<4;i++)vein(x,w,h,'rgba(190,150,80,.3)',1.1,50);
  speckle(x,w,h,6000,.05,1);grid(x,w,h,2,'rgba(150,130,100,.5)',2.5);},(x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);grid(x,w,h,2,'#3a3a3a',4);},1.2,
  (x,w,h)=>{x.fillStyle='#262626';x.fillRect(0,0,w,h);blotch(x,w,h,12,'rgba(80,80,80,.5)',20,60);grid(x,w,h,2,'#8a8a8a',3);});
 // herringbone parquet
 S.parquet=pair(mid,(x,w,h)=>{x.fillStyle='#3a2416';x.fillRect(0,0,w,h);const pw=w/16,pl=w/4;for(let j=-pl;j<h+pl;j+=pw)for(let i=-pl;i<w+pl;i+=pl){const v=R();for(const flip of[0,1]){x.save();x.translate(i+(flip?pw*2:0)+((j/pw)%2)*pw,j);x.rotate(flip?-Math.PI/4:Math.PI/4);
   x.fillStyle=`rgb(${120+v*40|0},${74+v*26|0},${40+v*16|0})`;x.fillRect(0,0,pl*.7,pw*.7-2);x.strokeStyle='rgba(40,20,8,.35)';for(let k=0;k<4;k++){x.beginPath();x.moveTo(0,2+R()*(pw*.7-4));x.lineTo(pl*.7,2+R()*(pw*.7-4));x.stroke();}x.restore();}}speckle(x,w,h,6000,.06);},null,1.5,
  (x,w,h)=>{x.fillStyle='#3a3a3a';x.fillRect(0,0,w,h);blotch(x,w,h,20,'rgba(10,10,10,.4)',10,40);});
 // terracotta floor tiles (terrace, kitchen yard)
 S.terracotta=pair(mid,(x,w,h)=>{blocks(x,w,h,w/4,w/4,v=>`rgb(${176+v*30|0},${92+v*22|0},${58+v*14|0})`,'#8c7a68',5,0);blotch(x,w,h,30,'rgba(90,40,20,.18)',10,50);blotch(x,w,h,20,'rgba(255,220,180,.12)',10,40);speckle(x,w,h,16000,.12,1.5);},(x,w,h)=>blocksH(x,w,h,w/4,w/4,8,0),2);
 // clay roof tiles (rows of barrel tiles)
 S.roof=pair(mid,(x,w,h)=>{x.fillStyle='#6a2c18';x.fillRect(0,0,w,h);const cw=w/8,rh=h/8;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const v=R();const g=x.createLinearGradient(c*cw,0,c*cw+cw,0);const base=[176+v*40,84+v*26,52+v*14];
   g.addColorStop(0,`rgb(${base[0]*.55|0},${base[1]*.5|0},${base[2]*.5|0})`);g.addColorStop(.5,`rgb(${base[0]|0},${base[1]|0},${base[2]|0})`);g.addColorStop(1,`rgb(${base[0]*.6|0},${base[1]*.55|0},${base[2]*.55|0})`);x.fillStyle=g;x.fillRect(c*cw+1,r*rh,cw-2,rh-2);
   x.fillStyle='rgba(0,0,0,.35)';x.fillRect(c*cw,r*rh+rh-4,cw,4);}blotch(x,w,h,16,'rgba(60,70,40,.18)',10,40);speckle(x,w,h,8000,.12);},
  (x,w,h)=>{const cw=w/8,rh=h/8;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const g=x.createLinearGradient(c*cw,0,c*cw+cw,0);g.addColorStop(0,'#202020');g.addColorStop(.5,'#e0e0e0');g.addColorStop(1,'#202020');x.fillStyle=g;x.fillRect(c*cw,r*rh,cw,rh);x.fillStyle='#000';x.fillRect(c*cw,r*rh+rh-4,cw,4);}},3);
 // travertine paving
 S.travertine=pair(mid,(x,w,h)=>{blocks(x,w,h,w/2,w/4,v=>`rgb(${214+v*20|0},${200+v*18|0},${174+v*16|0})`,'#a89880',4);for(let i=0;i<90;i++){x.fillStyle=`rgba(150,120,80,${.15+R()*.2})`;x.fillRect(R()*w,R()*h,4+R()*26,1+R()*2);}speckle(x,w,h,14000,.08,1.4);blotch(x,w,h,20,'rgba(120,90,60,.12)',10,60);},(x,w,h)=>blocksH(x,w,h,w/2,w/4,6),1.8);
 // cliff rock
 S.rock=pair(mid,(x,w,h)=>{x.fillStyle='#8a7a64';x.fillRect(0,0,w,h);blotch(x,w,h,60,'rgba(60,50,40,.35)',10,70);blotch(x,w,h,50,'rgba(200,180,150,.3)',10,60);speckle(x,w,h,30000,.2,2.4);
  x.strokeStyle='rgba(30,24,18,.55)';for(let i=0;i<30;i++){x.lineWidth=1+R()*2;let px=R()*w,py=R()*h;x.beginPath();x.moveTo(px,py);for(let k=0;k<6;k++){px+=(R()-.5)*50;py+=R()*20;x.lineTo(px,py);}x.stroke();}},null,3.2);
 // lawn
 S.grass=pair(mid,(x,w,h)=>{x.fillStyle='#4e6a2a';x.fillRect(0,0,w,h);blotch(x,w,h,40,'rgba(90,120,40,.45)',20,90);blotch(x,w,h,30,'rgba(40,60,20,.4)',20,80);
  for(let i=0;i<9000;i++){const v=R();x.strokeStyle=`rgba(${60+v*80|0},${90+v*80|0},${30+v*30|0},.55)`;x.lineWidth=1;const px=R()*w,py=R()*h;x.beginPath();x.moveTo(px,py);x.lineTo(px+(R()-.5)*3,py-3-R()*5);x.stroke();}},null,1.2);
 S.gravel=pair(mid,(x,w,h)=>{x.fillStyle='#b8a68a';x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=R();x.fillStyle=`rgb(${150+v*80|0},${136+v*72|0},${110+v*60|0})`;x.beginPath();x.arc(R()*w,R()*h,1+R()*2.6,0,7);x.fill();}
  for(let i=0;i<3000;i++){x.fillStyle='rgba(40,30,20,.35)';x.fillRect(R()*w,R()*h,2,2);}},null,2.6);
 // deck / pier planks
 S.planks=pair(mid,(x,w,h)=>{x.fillStyle='#2a1c12';x.fillRect(0,0,w,h);const n=8,ph=h/n;for(let i=0;i<n;i++){const v=R();x.fillStyle=`rgb(${120+v*40|0},${84+v*26|0},${56+v*16|0})`;x.fillRect(0,i*ph+2,w,ph-4);
   for(let k=0;k<30;k++){x.fillStyle=`rgba(${60+R()*40|0},${40+R()*20|0},20,.25)`;x.fillRect(0,i*ph+2+R()*(ph-4),w,1);}const cut=R()*w;x.fillStyle='#1a1008';x.fillRect(cut,i*ph,3,ph);x.fillStyle='rgba(30,30,30,.8)';x.fillRect(cut-8,i*ph+ph*.3,3,3);x.fillRect(cut+8,i*ph+ph*.3,3,3);}
  blotch(x,w,h,20,'rgba(200,200,190,.12)',10,60);},null,1.8);
 S.kitchen=pair(256,(x,w,h)=>{blocks(x,w,h,32,32,v=>`rgb(${228+v*14|0},${230+v*14|0},${228+v*12|0})`,'#9aa0a0',2,0);speckle(x,w,h,3000,.05);},(x,w,h)=>blocksH(x,w,h,32,32,4,0),1.6);
 S.carpet=pair(mid,(x,w,h)=>{x.fillStyle='#5a1418';x.fillRect(0,0,w,h);const s=w/8;for(let j=0;j<h;j+=s)for(let i=0;i<w;i+=s){x.strokeStyle='rgba(210,160,80,.35)';x.lineWidth=2;x.beginPath();x.moveTo(i+s/2,j+6);x.lineTo(i+s-6,j+s/2);x.lineTo(i+s/2,j+s-6);x.lineTo(i+6,j+s/2);x.closePath();x.stroke();
   x.fillStyle='rgba(220,170,90,.35)';x.beginPath();x.arc(i+s/2,j+s/2,3,0,7);x.fill();}speckle(x,w,h,30000,.16,1.4);blotch(x,w,h,20,'rgba(0,0,0,.12)',30,90);},null,1.2);
 S.panel=pair(mid,(x,w,h)=>{x.fillStyle='#3c2212';x.fillRect(0,0,w,h);for(let i=0;i<h;i+=3){x.fillStyle=`rgba(${80+R()*40|0},${44+R()*20|0},${22+R()*10|0},.5)`;x.fillRect(0,i,w,2);}
  for(let i=0;i<2;i++){const px=i*w/2;x.fillStyle='rgba(0,0,0,.45)';x.fillRect(px+18,30,w/2-36,h-60);x.fillStyle='rgba(255,210,150,.12)';x.fillRect(px+22,34,w/2-44,h-68);x.fillStyle='#4a2a16';x.fillRect(px+28,40,w/2-56,h-80);
   for(let k=40;k<h-40;k+=3){x.fillStyle=`rgba(${90+R()*30|0},${52+R()*20|0},${28+R()*10|0},.35)`;x.fillRect(px+28,k,w/2-56,2);}}x.fillStyle='rgba(210,170,90,.5)';x.fillRect(0,0,w,5);},null,2.2);
 S.brick=pair(mid,(x,w,h)=>{blocks(x,w,h,w/8,w/21,v=>`rgb(${120+v*50|0},${70+v*26|0},${46+v*16|0})`,'#4a3e34',3);speckle(x,w,h,12000,.25,1.6);blotch(x,w,h,24,'rgba(20,15,10,.35)',20,90);blotch(x,w,h,16,'rgba(220,210,190,.12)',20,60);},(x,w,h)=>blocksH(x,w,h,w/8,w/21,3),3);
 S.metal=pair(256,(x,w,h)=>{x.fillStyle='#c4c8cc';x.fillRect(0,0,w,h);for(let i=0;i<h;i++){x.fillStyle=`rgba(255,255,255,${R()*.08})`;x.fillRect(0,i,w,1);}speckle(x,w,h,3000,.1);},null,.8);
 S.cloth=pair(256,(x,w,h)=>{x.fillStyle='#f4f0e8';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=2){x.fillStyle=`rgba(0,0,0,${R()*.04})`;x.fillRect(i,0,1,h);x.fillRect(0,i,w,1);}blotch(x,w,h,10,'rgba(200,190,170,.25)',20,60);},null,.6);
 S.coffer=pair(mid,(x,w,h)=>{x.fillStyle='#e8dcc4';x.fillRect(0,0,w,h);const b=w*.11;x.fillStyle='#d4c6a8';x.fillRect(b,b,w-b*2,h-b*2);x.fillStyle='#c4b292';x.fillRect(b+w*.04,b+w*.04,w-b*2-w*.08,h-b*2-w*.08);x.fillStyle='#efe6d2';x.fillRect(b+w*.07,b+w*.07,w-b*2-w*.14,h-b*2-w*.14);
  x.strokeStyle='rgba(200,150,70,.8)';x.lineWidth=w/100;x.strokeRect(b+w*.02,b+w*.02,w-b*2-w*.04,h-b*2-w*.04);speckle(x,w,h,6000,.05);},(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);const b=w*.11;x.fillStyle='#bbb';x.fillRect(b,b,w-b*2,h-b*2);x.fillStyle='#777';x.fillRect(b+w*.04,b+w*.04,w-b*2-w*.08,h-b*2-w*.08);x.fillStyle='#444';x.fillRect(b+w*.07,b+w*.07,w-b*2-w*.14,h-b*2-w*.14);},2);
 // book spines (for shelves)
 S.books=(()=>{const c=cnv(512,256),x=c.getContext('2d');x.fillStyle='#1a0e08';x.fillRect(0,0,512,256);const P=['#6a1a1a','#1a3a5a','#2a4a2a','#5a4a2a','#3a1a3a','#8a6a3a','#2a2a2a','#7a3a1a','#c8b890'];
  for(let row=0;row<4;row++){let px=2;const y0=row*64;while(px<510){const bw=6+R()*12,bh=40+R()*20;x.fillStyle=P[R()*P.length|0];x.fillRect(px,y0+62-bh,bw-1,bh);x.fillStyle='rgba(220,180,90,.6)';x.fillRect(px+1,y0+62-bh+6,bw-3,2);x.fillRect(px+1,y0+60-8,bw-3,2);
   x.fillStyle='rgba(255,255,255,.08)';x.fillRect(px,y0+62-bh,2,bh);px+=bw;if(R()<.04)px+=10;}x.fillStyle='#2a1a10';x.fillRect(0,y0+60,512,4);}return T(c);})();
 // CCTV-like monitor wall for the security room
 S.screens=(()=>{const c=cnv(512,256),x=c.getContext('2d');x.fillStyle='#05080a';x.fillRect(0,0,512,256);for(let j=0;j<2;j++)for(let i=0;i<4;i++){const px=i*128+6,py=j*128+6;const g=x.createLinearGradient(px,py,px,py+116);g.addColorStop(0,'#1d3a44');g.addColorStop(1,'#0b1a1e');x.fillStyle=g;x.fillRect(px,py,116,116);
   x.strokeStyle='rgba(140,220,230,.35)';x.lineWidth=1;for(let k=0;k<5;k++){x.beginPath();x.moveTo(px+R()*116,py+40+R()*76);x.lineTo(px+R()*116,py+40+R()*76);x.stroke();}x.fillStyle='rgba(200,240,255,.5)';x.fillRect(px+30+R()*50,py+50+R()*40,6,14);
   x.fillStyle='rgba(255,255,255,.75)';x.font='bold 10px monospace';x.fillText('CAM '+(j*4+i+1),px+6,py+14);x.fillStyle='#e33';x.fillRect(px+104,py+6,6,6);for(let y=py;y<py+116;y+=3){x.fillStyle='rgba(0,0,0,.18)';x.fillRect(px,y,116,1);}}return T(c);})();
 // portrait / painting canvases for the gallery walls
 S.paint=[0,1,2,3].map(k=>{const c=cnv(256,320),x=c.getContext('2d');const pal=[['#2a3a5a','#c89a5a','#e8d8b8'],['#3a2a1a','#a8642a','#e8c890'],['#1a3a2a','#6a9a5a','#e0d8a0'],['#4a1a1a','#c84a2a','#f0c890']][k];
  const g=x.createLinearGradient(0,0,0,320);g.addColorStop(0,pal[0]);g.addColorStop(.6,pal[1]);g.addColorStop(1,pal[0]);x.fillStyle=g;x.fillRect(0,0,256,320);
  if(k%2){x.fillStyle=pal[2];x.beginPath();x.arc(128,140,46,0,7);x.fill();x.fillStyle=pal[0];x.beginPath();x.ellipse(128,290,90,90,0,Math.PI,0);x.fill();}
  else{x.fillStyle=pal[2];x.globalAlpha=.6;x.beginPath();x.arc(180,90,30,0,7);x.fill();x.globalAlpha=1;x.fillStyle=pal[0];x.beginPath();x.moveTo(0,240);for(let i=0;i<=256;i+=16)x.lineTo(i,210-Math.sin(i*.03+k)*30-R()*10);x.lineTo(256,320);x.lineTo(0,320);x.fill();}
  for(let i=0;i<1600;i++){x.fillStyle=`rgba(${R()*255|0},${R()*200|0},${R()*120|0},.06)`;x.fillRect(R()*256,R()*320,3,3);}return T(c);});
 S.label=labelTex;return S;}

// small text label on a transparent canvas (signage)
export function labelTex(text,o={}){const w=o.w||512,h=o.h||128,c=cnv(w,h),x=c.getContext('2d');if(o.bg){x.fillStyle=o.bg;x.fillRect(0,0,w,h);}x.fillStyle=o.col||'#e8d4a0';x.font=`${o.weight||600} ${o.size||64}px ${o.font||'Georgia,serif'}`;x.textAlign='center';x.textBaseline='middle';
 if(o.spacing)x.letterSpacing=o.spacing+'px';x.fillText(text,w/2,h/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
