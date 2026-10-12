// LONG SHOT — procedural canvas textures + derived normal maps. No image files.
import * as THREE from '../vendor/three.module.min.js';
let seed=11;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
const cnv=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function speckle(x,w,h,n,a,sz=2){for(let i=0;i<n;i++){const v=R();x.fillStyle=v<.5?`rgba(0,0,0,${a*R()})`:`rgba(255,255,255,${a*R()*.7})`;const s=1+R()*sz;x.fillRect(R()*w,R()*h,s,s);}}
function blotch(x,w,h,n,col,r0,r1){for(let i=0;i<n;i++){const r=r0+R()*(r1-r0),cx=R()*w,cy=R()*h;for(const ox of[-w,0,w])for(const oy of[-h,0,h]){const g=x.createRadialGradient(cx+ox,cy+oy,0,cx+ox,cy+oy,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx+ox-r,cy+oy-r,r*2,r*2);}}}
export function normalFrom(src,str=2){const w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data,c=cnv(w,h),x=c.getContext('2d'),o=x.createImageData(w,h);
 const L=new Float32Array(w*h);for(let i=0;i<w*h;i++)L[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/765;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(L[j*w+(i+1)%w]-L[j*w+(i-1+w)%w])*str,dy=(L[((j+1)%h)*w+i]-L[((j-1+h)%h)*w+i])*str,l=Math.hypot(dx,dy,1),k=(j*w+i)*4;o.data[k]=(-dx/l*.5+.5)*255;o.data[k+1]=(dy/l*.5+.5)*255;o.data[k+2]=(1/l*.5+.5)*255;o.data[k+3]=255;}
 x.putImageData(o,0,0);return c;}
function T(c,srgb=true){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
function pair(size,draw,hdraw,str,rdraw){const c=cnv(size),x=c.getContext('2d');draw(x,size,size);let hc=c;if(hdraw){hc=cnv(size);hdraw(hc.getContext('2d'),size,size);}const o={map:T(c),normalMap:T(normalFrom(hc,str),false)};
 if(rdraw){const rc=cnv(size>>1);rdraw(rc.getContext('2d'),size>>1,size>>1);o.roughnessMap=T(rc,false);}return o;}
function blocks(x,w,h,bw,bh,vary,mortar,gap=3,stag=true){x.fillStyle=mortar;x.fillRect(0,0,w,h);for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const ox=stag?(r%2)*bw/2:0;x.fillStyle=vary(R());x.fillRect(c*bw+ox+gap/2,r*bh+gap/2,bw-gap,bh-gap);}}
const gray=(x,w,h,v)=>{x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(0,0,w,h);};

let CACHE=null;
export function textures(){if(CACHE)return CACHE;seed=31;const S={};
 // ground detail (neutral, multiplied with terrain vertex colours)
 S.detail=pair(256,(x,w,h)=>{gray(x,w,h,200);blotch(x,w,h,40,'rgba(0,0,0,.10)',8,40);blotch(x,w,h,30,'rgba(255,255,255,.10)',8,30);speckle(x,w,h,14000,.22,2);},null,2.4);
 S.rockd=pair(256,(x,w,h)=>{gray(x,w,h,180);for(let i=0;i<70;i++){x.strokeStyle=`rgba(0,0,0,${.12+R()*.2})`;x.lineWidth=1+R()*2;x.beginPath();let px=R()*w,py=R()*h;x.moveTo(px,py);for(let k=0;k<5;k++){px+=R()*30-15;py+=R()*20-4;x.lineTo(px,py);}x.stroke();}blotch(x,w,h,30,'rgba(0,0,0,.18)',10,50);speckle(x,w,h,9000,.25,2);},null,3);
 S.stucco=pair(256,(x,w,h)=>{x.fillStyle='#ebe4d6';x.fillRect(0,0,w,h);blotch(x,w,h,30,'rgba(150,120,90,.07)',10,60);speckle(x,w,h,9000,.07,1.5);},null,1.4);
 S.terracotta=pair(256,(x,w,h)=>{x.fillStyle='#5a2a18';x.fillRect(0,0,w,h);const n=8,s=w/n;for(let r=0;r<n;r++)for(let c=0;c<n;c++){const v=R();const g=x.createLinearGradient(0,r*s,0,r*s+s);g.addColorStop(0,`rgb(${160+v*40|0},${70+v*25|0},${40+v*12|0})`);g.addColorStop(1,`rgb(${110+v*30|0},${46+v*16|0},${26+v*10|0})`);x.fillStyle=g;x.beginPath();x.ellipse(c*s+s/2+(r%2)*s/2,r*s+s*.55,s*.48,s*.6,0,0,7);x.fill();}speckle(x,w,h,4000,.15);},
  (x,w,h)=>{gray(x,w,h,40);const n=8,s=w/n;for(let r=0;r<n;r++)for(let c=0;c<n;c++){const g=x.createLinearGradient(c*s+(r%2)*s/2,0,c*s+s+(r%2)*s/2,0);g.addColorStop(0,'#555');g.addColorStop(.5,'#eee');g.addColorStop(1,'#555');x.fillStyle=g;x.fillRect(c*s+(r%2)*s/2,r*s,s,s*.92);}},2.2);
 S.paving=pair(256,(x,w,h)=>{blocks(x,w,h,64,64,v=>`rgb(${196+v*30|0},${184+v*26|0},${160+v*22|0})`,'#8a7f6c',4);speckle(x,w,h,6000,.12);},(x,w,h)=>{blocks(x,w,h,64,64,v=>`rgb(${200+v*40|0},${200+v*40|0},${200+v*40|0})`,'#202020',5);},2);
 S.wood=pair(256,(x,w,h)=>{const n=8,ph=h/n;for(let i=0;i<n;i++){const v=R();x.fillStyle=`rgb(${130+v*40|0},${88+v*26|0},${52+v*16|0})`;x.fillRect(0,i*ph,w,ph);for(let k=0;k<14;k++){x.strokeStyle=`rgba(40,24,10,${.06+R()*.16})`;x.beginPath();const y=i*ph+2+R()*(ph-4);x.moveTo(0,y);x.bezierCurveTo(w*.3,y+R()*4-2,w*.6,y+R()*4-2,w,y);x.stroke();}x.fillStyle='rgba(25,14,6,.75)';x.fillRect(0,i*ph,w,2);x.fillRect(R()*w,i*ph,2,ph);}speckle(x,w,h,3000,.08);},null,1.8);
 S.concrete=pair(256,(x,w,h)=>{x.fillStyle='#9a9a96';x.fillRect(0,0,w,h);blotch(x,w,h,30,'rgba(40,40,40,.14)',10,50);blotch(x,w,h,12,'rgba(80,60,40,.10)',20,60);speckle(x,w,h,9000,.18,2);x.fillStyle='rgba(0,0,0,.22)';x.fillRect(0,h-2,w,2);x.fillRect(w-2,0,2,h);},null,1.5);
 S.asphalt=pair(256,(x,w,h)=>{x.fillStyle='#38393b';x.fillRect(0,0,w,h);speckle(x,w,h,16000,.25,1.5);blotch(x,w,h,10,'rgba(0,0,0,.35)',20,70);},null,1.6,(x,w,h)=>{gray(x,w,h,170);blotch(x,w,h,14,'rgba(0,0,0,.9)',20,70);});
 S.metal=pair(256,(x,w,h)=>{x.fillStyle='#7c8288';x.fillRect(0,0,w,h);blotch(x,w,h,14,'rgba(110,70,40,.25)',6,30);speckle(x,w,h,5000,.15);for(let i=0;i<w;i+=16){x.fillStyle='rgba(0,0,0,.12)';x.fillRect(i,0,3,h);x.fillStyle='rgba(255,255,255,.08)';x.fillRect(i+3,0,2,h);}},null,2,(x,w,h)=>{gray(x,w,h,110);blotch(x,w,h,12,'rgba(255,255,255,.3)',8,40);});
 S.sand=pair(256,(x,w,h)=>{gray(x,w,h,215);for(let i=0;i<60;i++){x.strokeStyle=`rgba(0,0,0,${.03+R()*.05})`;x.lineWidth=2+R()*3;x.beginPath();const y=R()*h;x.moveTo(0,y);x.bezierCurveTo(w*.3,y+R()*16-8,w*.7,y+R()*16-8,w,y);x.stroke();}speckle(x,w,h,16000,.2,1.2);},null,2.2);
 S.fabric=pair(128,(x,w,h)=>{gray(x,w,h,215);for(let i=0;i<h;i+=2){x.fillStyle=`rgba(0,0,0,${.04+R()*.05})`;x.fillRect(0,i,w,1);}speckle(x,w,h,2000,.1);},null,1.2);
 S.bark=pair(128,(x,w,h)=>{x.fillStyle='#6b5a48';x.fillRect(0,0,w,h);for(let i=0;i<60;i++){x.fillStyle=`rgba(15,10,6,${.3+R()*.4})`;x.fillRect(R()*w,0,1+R()*3,h);}speckle(x,w,h,2000,.2);},null,3);
 // building facades: 4x4 bays per tile so the lit-window pattern does not visibly repeat
 S.facade={};for(const st of['stucco','office','brick','concrete','cinder','hotel'])S.facade[st]=facade(st);
 S.water=(()=>{const c=cnv(256),x=c.getContext('2d');gray(x,256,256,128);for(let i=0;i<220;i++){const r=6+R()*26,cx=R()*256,cy=R()*256;for(const ox of[-256,0,256])for(const oy of[-256,0,256]){const g=x.createRadialGradient(cx+ox,cy+oy,0,cx+ox,cy+oy,r);const v=R()<.5?0:255;g.addColorStop(0,`rgba(${v},${v},${v},.22)`);g.addColorStop(1,`rgba(${v},${v},${v},0)`);x.fillStyle=g;x.fillRect(cx+ox-r,cy+oy-r,r*2,r*2);}}
  const t=T(normalFrom(c,5),false);return t;})();
 S.puff=(()=>{const c=cnv(128),x=c.getContext('2d');for(let i=0;i<26;i++){const r=14+R()*30,cx=64+(R()-.5)*50,cy=64+(R()-.5)*50,g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.34)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);}
  const m=x.getImageData(0,0,128,128);for(let j=0;j<128;j++)for(let i=0;i<128;i++){const d=Math.hypot(i-64,j-64)/64;m.data[(j*128+i)*4+3]*=Math.max(0,1-d*d);}x.putImageData(m,0,0);return new THREE.CanvasTexture(c);})();
 S.glow=(()=>{const c=cnv(64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
 S.ring=(()=>{const c=cnv(128),x=c.getContext('2d');const g=x.createRadialGradient(64,64,40,64,64,62);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,255,255,.8)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);})();
 S.flare=(()=>{const c=cnv(128),x=c.getContext('2d');x.translate(64,64);for(let i=0;i<6;i++){x.rotate(Math.PI/3+R()*.2);const g=x.createLinearGradient(0,0,60,0);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(1,'rgba(255,140,40,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,-6);x.lineTo(58,0);x.lineTo(0,6);x.fill();}
  const g=x.createRadialGradient(0,0,0,0,0,28);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,180,80,0)');x.fillStyle=g;x.fillRect(-64,-64,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 CACHE=S;return S;}

function facade(st){const n=4,B=128,w=B*n,c=cnv(w),x=c.getContext('2d'),e=cnv(w),y=e.getContext('2d'),hc=cnv(w),hx=hc.getContext('2d');y.fillStyle='#000';y.fillRect(0,0,w,w);
 const base={stucco:'#e9dfcc',office:'#4a5560',brick:'#8a4a36',concrete:'#9a978f',cinder:'#c8b28e',hotel:'#d8cfc0'}[st];x.fillStyle=base;x.fillRect(0,0,w,w);hx.fillStyle='#888';hx.fillRect(0,0,w,w);
 if(st==='brick'){blocks(x,w,w,24,10,v=>`rgb(${118+v*40|0},${58+v*20|0},${42+v*14|0})`,'#6a625a',2);}
 else if(st==='concrete'||st==='cinder'){blotch(x,w,w,40,'rgba(0,0,0,.08)',10,60);for(let i=0;i<w;i+=B/2){x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,i,w,2);}}
 else blotch(x,w,w,30,'rgba(120,100,80,.06)',10,60);
 speckle(x,w,w,12000,.08,1.5);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const X=i*B,Y=j*B;
  if(st==='office'){const lit=R()<.45,tint=R()<.5?[255,226,170]:[190,220,255];x.fillStyle='#1b2530';x.fillRect(X+4,Y+10,B-8,B-22);const g=x.createLinearGradient(X,Y,X+B,Y+B);g.addColorStop(0,'rgba(140,170,200,.55)');g.addColorStop(1,'rgba(20,30,40,.2)');x.fillStyle=g;x.fillRect(X+4,Y+10,B-8,B-22);
   x.fillStyle='#2a3038';x.fillRect(X+B/2-2,Y+10,4,B-22);x.fillStyle='#6a737c';x.fillRect(X,Y+B-12,B,12);hx.fillStyle='#333';hx.fillRect(X+4,Y+10,B-8,B-22);
   if(lit){y.fillStyle=`rgba(${tint[0]},${tint[1]},${tint[2]},${.5+R()*.5})`;y.fillRect(X+6,Y+12,B-12,B-26);y.fillStyle='rgba(0,0,0,.5)';y.fillRect(X+B/2-2,Y+12,4,B-26);if(R()<.4){y.fillStyle='rgba(0,0,0,.6)';y.fillRect(X+12+R()*60,Y+40,18,B-60);}}}
  else{const ww=st==='cinder'?B*.32:B*.42,wh=st==='cinder'?B*.36:B*.56,wx=X+(B-ww)/2,wy=Y+B*.2;const lit=R()<(st==='hotel'?.6:.35),warm=R()<.7;
   x.fillStyle='rgba(0,0,0,.25)';x.fillRect(wx-3,wy-3,ww+6,wh+8);x.fillStyle='#202830';x.fillRect(wx,wy,ww,wh);const g=x.createLinearGradient(wx,wy,wx+ww,wy+wh);g.addColorStop(0,'rgba(170,190,210,.5)');g.addColorStop(1,'rgba(20,25,30,.1)');x.fillStyle=g;x.fillRect(wx,wy,ww,wh);
   x.fillStyle=st==='brick'?'#ddd6c8':'#f4f0e6';x.fillRect(wx-4,wy+wh,ww+8,5);x.fillStyle='#ccc';x.fillRect(wx+ww/2-1,wy,2,wh);x.fillRect(wx,wy+wh*.45,ww,2);hx.fillStyle='#222';hx.fillRect(wx,wy,ww,wh);hx.fillStyle='#fff';hx.fillRect(wx-4,wy+wh,ww+8,5);
   if(st==='stucco'&&R()<.6){x.fillStyle=R()<.5?'#3d6b5a':'#5a7a9a';x.fillRect(wx-ww*.42,wy,ww*.38,wh);x.fillRect(wx+ww*1.04,wy,ww*.38,wh);x.fillStyle='rgba(0,0,0,.25)';for(let k=0;k<wh;k+=6){x.fillRect(wx-ww*.42,wy+k,ww*.38,2);x.fillRect(wx+ww*1.04,wy+k,ww*.38,2);}}
   if(lit){y.fillStyle=warm?`rgba(255,${200+R()*30|0},${130+R()*40|0},${.55+R()*.45})`:`rgba(180,210,255,${.5+R()*.4})`;y.fillRect(wx+2,wy+2,ww-4,wh-4);y.fillStyle='rgba(0,0,0,.6)';y.fillRect(wx+ww/2-1,wy,2,wh);y.fillRect(wx,wy+wh*.45,ww,2);if(R()<.4){y.fillStyle='rgba(30,20,10,.6)';y.fillRect(wx+2,wy+2,ww*.4,wh-4);}}}}
 const o={map:T(c),normalMap:T(normalFrom(hc,1.6),false),emissiveMap:T(e)};return o;}

// painted sign / label texture (neon signs, boat names, dossier)
export function labelTex(txt,o={}){const c=cnv(o.w||256,o.h||64),x=c.getContext('2d');x.fillStyle=o.bg||'#101418';x.fillRect(0,0,c.width,c.height);
 if(o.glow){x.shadowColor=o.fg;x.shadowBlur=12;}x.fillStyle=o.fg||'#e8e2d0';x.font=`${o.weight||700} ${o.size||30}px ${o.font||'Anton, Impact, sans-serif'}`;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,c.width/2,c.height/2+2);
 if(o.glow)x.fillText(txt,c.width/2,c.height/2+2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
