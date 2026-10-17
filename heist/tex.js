// HALCYON HEIST — procedural canvas textures with derived normal maps (no image files).
import * as THREE from '../vendor/three.module.min.js';

let seed=7;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
export const cnv=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function speckle(x,w,h,n,a,sz=2){for(let i=0;i<n;i++){const v=R();x.fillStyle=v<.5?`rgba(0,0,0,${a*R()})`:`rgba(255,255,255,${a*R()*.7})`;const s=1+R()*sz;x.fillRect(R()*w,R()*h,s,s);}}
function blotch(x,w,h,n,col,r0,r1){const col0=col.replace(/,[\d.]+\)$/,',0)');for(let i=0;i<n;i++){const r=r0+R()*(r1-r0),cx=R()*w,cy=R()*h;for(const ox of[-w,0,w])for(const oy of[-h,0,h]){const g=x.createRadialGradient(cx+ox,cy+oy,0,cx+ox,cy+oy,r);g.addColorStop(0,col);g.addColorStop(1,col0);x.fillStyle=g;x.fillRect(cx+ox-r,cy+oy-r,r*2,r*2);}}}
function normalFrom(src,str=2){const w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data,c=cnv(w,h),x=c.getContext('2d'),o=x.createImageData(w,h);
 const L=new Float32Array(w*h);for(let i=0;i<w*h;i++)L[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/765;
 // high-pass: subtract a wide box blur so soft blotches don't turn into ring-shaped bumps
 {const r=Math.max(3,w>>7),B=new Float32Array(w*h),C=new Float32Array(w*h),k=1/(2*r+1);
  for(let j=0;j<h;j++){let s=0;for(let i=-r;i<=r;i++)s+=L[j*w+((i+w)%w)];for(let i=0;i<w;i++){B[j*w+i]=s*k;s+=L[j*w+(i+r+1)%w]-L[j*w+(i-r+w)%w];}}
  for(let i=0;i<w;i++){let s=0;for(let j=-r;j<=r;j++)s+=B[((j+h)%h)*w+i];for(let j=0;j<h;j++){C[j*w+i]=s*k;s+=B[((j+r+1)%h)*w+i]-B[((j-r+h)%h)*w+i];}}
  for(let i=0;i<w*h;i++)L[i]=L[i]-C[i];}
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(L[j*w+(i+1)%w]-L[j*w+(i-1+w)%w])*str,dy=(L[((j+1)%h)*w+i]-L[((j-1+h)%h)*w+i])*str,l=Math.hypot(dx,dy,1),k=(j*w+i)*4;o.data[k]=(-dx/l*.5+.5)*255;o.data[k+1]=(dy/l*.5+.5)*255;o.data[k+2]=(1/l*.5+.5)*255;o.data[k+3]=255;}
 x.putImageData(o,0,0);return c;}
export function T(c,srgb=true){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
function pair(size,draw,hdraw,str,rdraw){const c=cnv(size),x=c.getContext('2d');draw(x,size,size);let hc=c;if(hdraw){hc=cnv(size);hdraw(hc.getContext('2d'),size,size);}const o={map:T(c),normalMap:T(normalFrom(hc,str),false)};
 if(rdraw){const rc=cnv(size>>1);rdraw(rc.getContext('2d'),size>>1,size>>1);o.roughnessMap=T(rc,false);}return o;}
// meandering vein (marble)
function vein(x,w,h,col,wid,len){let px=R()*w,py=R()*h,a=R()*6.28;x.strokeStyle=col;x.lineCap='round';for(let k=0;k<len;k++){const nx=px+Math.cos(a)*6,ny=py+Math.sin(a)*6;x.lineWidth=wid*(.4+R()*.9);x.beginPath();x.moveTo(px,py);x.lineTo(nx,ny);x.stroke();
  for(const ox of[-w,w])for(const oy of[-h,h,0]){x.beginPath();x.moveTo(px+ox,py+oy);x.lineTo(nx+ox,ny+oy);x.stroke();}x.beginPath();x.moveTo(px,py+h);x.lineTo(nx,ny+h);x.stroke();x.beginPath();x.moveTo(px,py-h);x.lineTo(nx,ny-h);x.stroke();
  a+=(R()-.5)*.7;px=nx;py=ny;if(R()<.04){const b=a+(R()<.5?.8:-.8);let qx=px,qy=py;for(let j=0;j<20;j++){const ax=qx+Math.cos(b+(R()-.5))*5,ay=qy+Math.sin(b+(R()-.5))*5;x.lineWidth=wid*.4;x.beginPath();x.moveTo(qx,qy);x.lineTo(ax,ay);x.stroke();qx=ax;qy=ay;}}}}
function grid(x,w,h,n,col,lw){x.strokeStyle=col;x.lineWidth=lw;for(let i=0;i<=n;i++){const p=i*w/n;x.beginPath();x.moveTo(p,0);x.lineTo(p,h);x.stroke();x.beginPath();x.moveTo(0,p);x.lineTo(w,p);x.stroke();}}
function blocks(x,w,h,bw,bh,vary,mortar,gap=3){x.fillStyle=mortar;x.fillRect(0,0,w,h);for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const ox=(r%2)*bw/2,v=R();x.fillStyle=vary(v);x.fillRect(c*bw+ox+gap/2,r*bh+gap/2,bw-gap,bh-gap);}}
function blocksH(x,w,h,bw,bh,gap=3){x.fillStyle='#202020';x.fillRect(0,0,w,h);for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const ox=(r%2)*bw/2;x.fillStyle=`rgb(${170+R()*40|0},${170+R()*40|0},${170+R()*40|0})`;x.fillRect(c*bw+ox+gap/2+1,r*bh+gap/2+1,bw-gap-2,bh-gap-2);}speckle(x,w,h,6000,.35,2);}

export function makeTextures(mood){seed=mood==='dusk'?11:23;const S={};const wet=mood==='night';
 // polished marble: 2x2 m of 1 m slabs, grey veins with a faint gold thread, thin grout
 S.marble=pair(1024,(x,w,h)=>{x.fillStyle='#ece8e1';x.fillRect(0,0,w,h);blotch(x,w,h,40,'rgba(205,200,192,.5)',40,160);blotch(x,w,h,30,'rgba(255,255,255,.5)',30,120);
  for(let i=0;i<14;i++)vein(x,w,h,`rgba(${110+R()*40|0},${110+R()*40|0},${118+R()*40|0},${.18+R()*.25})`,1.6+R()*2.2,40+R()*60|0);for(let i=0;i<4;i++)vein(x,w,h,'rgba(176,140,70,.32)',1.2,50);
  speckle(x,w,h,6000,.06,1);x.strokeStyle='rgba(120,110,100,.55)';x.lineWidth=2;grid(x,w,h,2,'rgba(120,110,100,.5)',2.5);},
  (x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);grid(x,w,h,2,'#3a3a3a',4);},1.2,(x,w,h)=>{x.fillStyle='#1e1e1e';x.fillRect(0,0,w,h);blotch(x,w,h,12,'rgba(70,70,70,.5)',20,60);grid(x,w,h,2,'#7a7a7a',3);});
 S.marbleDark=pair(512,(x,w,h)=>{x.fillStyle='#1c1d20';x.fillRect(0,0,w,h);blotch(x,w,h,20,'rgba(40,42,48,.6)',30,100);for(let i=0;i<10;i++)vein(x,w,h,`rgba(220,215,205,${.12+R()*.25})`,1+R()*1.6,30+R()*50|0);for(let i=0;i<3;i++)vein(x,w,h,'rgba(200,160,80,.35)',1,40);},null,.8);
 S.carpet=pair(512,(x,w,h)=>{x.fillStyle='#2c3546';x.fillRect(0,0,w,h);for(let j=0;j<h;j+=64)for(let i=0;i<w;i+=64){x.strokeStyle='rgba(150,130,90,.22)';x.lineWidth=2;x.beginPath();x.moveTo(i+32,j+8);x.lineTo(i+56,j+32);x.lineTo(i+32,j+56);x.lineTo(i+8,j+32);x.closePath();x.stroke();x.fillStyle='rgba(150,130,90,.25)';x.fillRect(i+30,j+30,4,4);}
  speckle(x,w,h,40000,.18,1.5);blotch(x,w,h,20,'rgba(0,0,0,.15)',30,90);},null,1.6);
 S.tile=pair(512,(x,w,h)=>{blocks(x,w,h,85.3,85.3,v=>`rgb(${200+v*16|0},${200+v*16|0},${196+v*14|0})`,'#8a8a86',4);blotch(x,w,h,16,'rgba(120,110,90,.12)',20,60);speckle(x,w,h,8000,.08,1);},(x,w,h)=>blocksH(x,w,h,85.3,85.3,6),1.8);
 S.concrete=pair(512,(x,w,h)=>{x.fillStyle='#8e8e8a';x.fillRect(0,0,w,h);blotch(x,w,h,50,'rgba(60,60,60,.18)',20,100);blotch(x,w,h,30,'rgba(220,220,210,.12)',20,80);speckle(x,w,h,30000,.18,1.6);x.strokeStyle='rgba(40,40,40,.35)';x.lineWidth=2;x.beginPath();x.moveTo(0,h/2);x.lineTo(w,h/2);x.moveTo(w/2,0);x.lineTo(w/2,h);x.stroke();},null,2);
 S.steel=pair(256,(x,w,h)=>{x.fillStyle='#8a8d92';x.fillRect(0,0,w,h);for(let j=0;j<h;j+=16)for(let i=0;i<w;i+=16){x.save();x.translate(i+8,j+8);x.rotate(((i+j)/16)%2?.6:-.6);x.fillStyle='rgba(230,235,240,.55)';x.fillRect(-5,-1.5,10,3);x.fillStyle='rgba(20,20,25,.5)';x.fillRect(-5,1.5,10,1.2);x.restore();}
  speckle(x,w,h,4000,.15);blotch(x,w,h,10,'rgba(60,50,40,.18)',10,40);},null,2.4);
 S.parquet=pair(512,(x,w,h)=>{x.fillStyle='#3a2416';x.fillRect(0,0,w,h);const pw=32,pl=128;for(let j=-pl;j<h+pl;j+=pw)for(let i=-pl;i<w+pl;i+=pl){const v=R();for(const flip of[0,1]){x.save();x.translate(i+(flip?pw*2:0)+((j/pw)%2)*pw,j);x.rotate(flip?-Math.PI/4:Math.PI/4);x.fillStyle=`rgb(${92+v*40|0},${58+v*24|0},${34+v*14|0})`;x.fillRect(0,0,pl*.7,pw*.7-2);
   x.strokeStyle='rgba(30,16,8,.35)';for(let k=0;k<5;k++){x.beginPath();x.moveTo(0,2+R()*(pw*.7-4));x.lineTo(pl*.7,2+R()*(pw*.7-4));x.stroke();}x.restore();}}speckle(x,w,h,6000,.08);},null,1.6,(x,w,h)=>{x.fillStyle='#4a4a4a';x.fillRect(0,0,w,h);blotch(x,w,h,20,'rgba(20,20,20,.4)',10,40);});
 S.sidewalk=pair(512,(x,w,h)=>{blocks(x,w,h,128,128,v=>`rgb(${150+v*24|0},${148+v*22|0},${142+v*20|0})`,'#5a5854',5);blotch(x,w,h,30,'rgba(40,40,40,.22)',10,60);speckle(x,w,h,26000,.2,2);
  for(let i=0;i<14;i++){x.fillStyle='rgba(30,30,30,.35)';x.beginPath();x.arc(R()*w,R()*h,2+R()*6,0,7);x.fill();}},(x,w,h)=>blocksH(x,w,h,128,128,8),2.4,wet?(x,w,h)=>{x.fillStyle='#909090';x.fillRect(0,0,w,h);blotch(x,w,h,22,'rgba(10,10,10,.9)',14,60);}:null);
 S.asphalt=pair(512,(x,w,h)=>{x.fillStyle=wet?'#1c1d20':'#2c2d30';x.fillRect(0,0,w,h);speckle(x,w,h,60000,.28,2);blotch(x,w,h,30,'rgba(0,0,0,.25)',20,90);blotch(x,w,h,10,'rgba(120,120,120,.08)',20,60);
  x.strokeStyle='rgba(10,10,10,.6)';for(let i=0;i<6;i++){let px=R()*w,py=R()*h;x.lineWidth=1+R();x.beginPath();x.moveTo(px,py);for(let k=0;k<12;k++){px+=R()*16-8;py+=R()*16-8;x.lineTo(px,py);}x.stroke();}},null,2,
  (x,w,h)=>{x.fillStyle=wet?'#5a5a5a':'#c8c8c8';x.fillRect(0,0,w,h);blotch(x,w,h,wet?40:10,'rgba(0,0,0,.95)',16,70);speckle(x,w,h,5000,.3,2);});
 S.plaster=pair(512,(x,w,h)=>{x.fillStyle='#e4e0d6';x.fillRect(0,0,w,h);blotch(x,w,h,40,'rgba(200,185,160,.2)',30,120);speckle(x,w,h,20000,.05,1.5);},null,.9);
 S.paint=pair(256,(x,w,h)=>{x.fillStyle='#c9ccc8';x.fillRect(0,0,w,h);blotch(x,w,h,20,'rgba(160,160,150,.2)',20,80);speckle(x,w,h,8000,.06,1.5);},null,.8);
 S.wainscot=pair(512,(x,w,h)=>{x.fillStyle='#3b2416';x.fillRect(0,0,w,h);for(let i=0;i<h;i+=3){x.fillStyle=`rgba(${70+R()*30|0},${42+R()*20|0},${24+R()*10|0},.5)`;x.fillRect(0,i,w,2);}
  for(let i=0;i<2;i++){const px=i*w/2;x.fillStyle='rgba(0,0,0,.45)';x.fillRect(px+20,40,w/2-40,h-80);x.fillStyle='rgba(255,220,170,.12)';x.fillRect(px+24,44,w/2-48,h-88);x.fillStyle='#4a2e1c';x.fillRect(px+30,50,w/2-60,h-100);for(let k=50;k<h-50;k+=3){x.fillStyle=`rgba(${80+R()*30|0},${50+R()*20|0},${30+R()*10|0},.35)`;x.fillRect(px+30,k,w/2-60,2);}}
  x.fillStyle='rgba(210,170,90,.55)';x.fillRect(0,0,w,6);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,h-14,w,14);},null,2.4,(x,w,h)=>{x.fillStyle='#606060';x.fillRect(0,0,w,h);});
 S.facade=pair(512,(x,w,h)=>{blocks(x,w,h,170,64,v=>`rgb(${196+v*26|0},${182+v*22|0},${158+v*18|0})`,'#7d705e',4);blotch(x,w,h,40,'rgba(90,80,60,.18)',20,80);speckle(x,w,h,20000,.15,1.6);
  const g=x.createLinearGradient(0,h*.85,0,h);g.addColorStop(0,'rgba(40,30,20,0)');g.addColorStop(1,'rgba(40,30,20,.3)');x.fillStyle=g;x.fillRect(0,0,w,h);},(x,w,h)=>blocksH(x,w,h,170,64,5),2.6);
 S.brick=pair(512,(x,w,h)=>{blocks(x,w,h,64,24,v=>`rgb(${110+v*50|0},${46+v*22|0},${34+v*14|0})`,'#3a332e',3);speckle(x,w,h,12000,.25,1.6);blotch(x,w,h,20,'rgba(20,15,10,.3)',20,90);blotch(x,w,h,12,'rgba(200,200,190,.1)',20,60);
  for(let i=0;i<10;i++){const sx=R()*w;const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(20,20,20,.35)');g.addColorStop(1,'rgba(20,20,20,0)');x.fillStyle=g;x.fillRect(sx,0,3+R()*6,h*(.3+R()*.5));}},(x,w,h)=>blocksH(x,w,h,64,24,3),3);
 S.ceiling=pair(256,(x,w,h)=>{x.fillStyle='#e6e3dc';x.fillRect(0,0,w,h);speckle(x,w,h,9000,.12,1.2);x.fillStyle='rgba(120,115,105,.65)';x.fillRect(0,0,w,4);x.fillRect(0,0,4,h);x.fillStyle='rgba(255,255,255,.4)';x.fillRect(4,4,w,2);},null,1.6);
 S.coffer=pair(512,(x,w,h)=>{x.fillStyle='#ded6c6';x.fillRect(0,0,w,h);const b=56;x.fillStyle='#c9bfac';x.fillRect(b,b,w-b*2,h-b*2);x.fillStyle='#b7ab95';x.fillRect(b+20,b+20,w-b*2-40,h-b*2-40);x.fillStyle='#e9e2d4';x.fillRect(b+34,b+34,w-b*2-68,h-b*2-68);
  x.strokeStyle='rgba(190,150,80,.7)';x.lineWidth=4;x.strokeRect(b+10,b+10,w-b*2-20,h-b*2-20);speckle(x,w,h,6000,.06);},(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);const b=56;x.fillStyle='#bbb';x.fillRect(b,b,w-b*2,h-b*2);x.fillStyle='#777';x.fillRect(b+20,b+20,w-b*2-40,h-b*2-40);x.fillStyle='#444';x.fillRect(b+34,b+34,w-b*2-68,h-b*2-68);},2.2);
 S.wood=pair(256,(x,w,h)=>{x.fillStyle='#5a3620';x.fillRect(0,0,w,h);for(let i=0;i<h;i+=2){x.fillStyle=`rgba(${100+R()*50|0},${60+R()*30|0},${30+R()*16|0},.35)`;x.fillRect(0,i,w,1+R()*2);}blotch(x,w,h,8,'rgba(30,15,5,.3)',10,40);},null,1.4);
 S.metal=pair(256,(x,w,h)=>{x.fillStyle='#8a8d90';x.fillRect(0,0,w,h);for(let i=0;i<h;i++){x.fillStyle=`rgba(255,255,255,${R()*.06})`;x.fillRect(0,i,w,1);}speckle(x,w,h,3000,.12);},null,1);
 S.vaultDoor=pair(512,(x,w,h)=>{const g=x.createRadialGradient(w/2,h/2,10,w/2,h/2,w/2);g.addColorStop(0,'#b9bcc0');g.addColorStop(.6,'#9a9ea4');g.addColorStop(1,'#6a6e74');x.fillStyle=g;x.fillRect(0,0,w,h);
  for(let r=40;r<w/2;r+=18){x.strokeStyle=`rgba(${r%36?255:0},${r%36?255:0},${r%36?255:0},.12)`;x.lineWidth=6;x.beginPath();x.arc(w/2,h/2,r,0,7);x.stroke();}x.strokeStyle='rgba(30,30,30,.6)';x.lineWidth=5;x.beginPath();x.arc(w/2,h/2,w*.44,0,7);x.stroke();x.beginPath();x.arc(w/2,h/2,w*.2,0,7);x.stroke();
  for(let i=0;i<16;i++){const a=i/16*6.28;x.fillStyle='#4a4d52';x.beginPath();x.arc(w/2+Math.cos(a)*w*.4,h/2+Math.sin(a)*w*.4,9,0,7);x.fill();x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.arc(w/2+Math.cos(a)*w*.4-2,h/2+Math.sin(a)*w*.4-2,4,0,7);x.fill();}speckle(x,w,h,4000,.12);},null,2.2);
 S.cash=(()=>{const c=cnv(256,128),x=c.getContext('2d');for(let j=0;j<128;j+=4){x.fillStyle=`rgb(${120+R()*30|0},${150+R()*30|0},${110+R()*20|0})`;x.fillRect(0,j,256,3);x.fillStyle='rgba(30,50,30,.5)';x.fillRect(0,j+3,256,1);}
  for(let i=0;i<4;i++){x.fillStyle='#e8e0c8';x.fillRect(30+i*60,0,14,128);x.fillStyle='rgba(160,120,40,.8)';x.fillRect(32+i*60,0,10,128);}x.fillStyle='rgba(15,25,15,.85)';x.fillRect(0,120,256,8);x.fillStyle='rgba(255,255,230,.18)';x.fillRect(0,0,256,3);return T(c);})();
 S.cashTop=(()=>{const c=cnv(256,128),x=c.getContext('2d');x.fillStyle='#9fb58c';x.fillRect(0,0,256,128);x.strokeStyle='#4f6a44';x.lineWidth=3;x.strokeRect(10,10,236,108);x.fillStyle='#5f7c52';x.beginPath();x.arc(128,64,30,0,7);x.fill();x.fillStyle='#cfdcbf';x.font='bold 30px Anton, Impact, sans-serif';x.textAlign='center';x.fillText('100',60,76);x.fillText('100',196,76);
  x.fillStyle='#e8e0c8';x.fillRect(110,0,36,128);x.fillStyle='rgba(160,120,40,.9)';x.fillRect(114,0,28,128);return T(c);})();
 S.puff=(()=>{const c=cnv(128),x=c.getContext('2d');for(let i=0;i<26;i++){const r=14+R()*30,cx=64+(R()-.5)*50,cy=64+(R()-.5)*50,g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.34)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);}
  const m=x.getImageData(0,0,128,128);for(let j=0;j<128;j++)for(let i=0;i<128;i++){const d=Math.hypot(i-64,j-64)/64;m.data[(j*128+i)*4+3]*=Math.max(0,1-d*d);}x.putImageData(m,0,0);return new THREE.CanvasTexture(c);})();
 S.decal=(()=>{const c=cnv(64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(5,5,5,1)');g.addColorStop(.18,'rgba(15,12,10,.95)');g.addColorStop(.32,'rgba(60,50,40,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  x.strokeStyle='rgba(20,16,12,.6)';for(let i=0;i<7;i++){const a=R()*6.28;x.beginPath();x.moveTo(32,32);x.lineTo(32+Math.cos(a)*(12+R()*12),32+Math.sin(a)*(12+R()*12));x.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 S.blood=(()=>{const c=cnv(128),x=c.getContext('2d');for(let i=0;i<30;i++){const r=4+R()*22,cx=64+(R()-.5)*60*(r<10?1.4:.7),cy=64+(R()-.5)*60*(r<10?1.4:.7);x.fillStyle=`rgba(${70+R()*40|0},4,4,${.5+R()*.4})`;x.beginPath();x.ellipse(cx,cy,r,r*(.6+R()*.4),R()*3,0,7);x.fill();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 S.flash=(()=>{const c=cnv(128),x=c.getContext('2d');x.translate(64,64);for(let i=0;i<7;i++){x.rotate(Math.PI*2/7+R()*.3);const g=x.createLinearGradient(0,0,58,0);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(1,'rgba(255,140,40,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,-7);x.lineTo(56+R()*6,0);x.lineTo(0,7);x.fill();}
  const g=x.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,180,80,0)');x.fillStyle=g;x.fillRect(-64,-64,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 S.cone=(()=>{const c=cnv(64,256),x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.6,'rgba(255,255,255,.3)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,256);for(let j=0;j<256;j+=8){x.fillStyle='rgba(255,255,255,.12)';x.fillRect(0,j,64,1);}return new THREE.CanvasTexture(c);})();
 // night skyline windows (emissive)
 S.city=(()=>{const c=cnv(512),x=c.getContext('2d'),e=cnv(512),y=e.getContext('2d');x.fillStyle=mood==='dusk'?'#4a4038':'#24262c';x.fillRect(0,0,512,512);y.fillStyle='#000';y.fillRect(0,0,512,512);
  for(let j=0;j<512;j+=32)for(let i=0;i<512;i+=26){const lit=R()<(mood==='dusk'?.38:.3);x.fillStyle=lit?'#3a3430':'#15171c';x.fillRect(i+5,j+7,16,20);if(lit){const k=R();y.fillStyle=k<.6?`rgb(255,${190+R()*40|0},${120+R()*40|0})`:k<.85?'rgb(200,220,255)':'rgb(255,240,200)';y.globalAlpha=.4+R()*.6;y.fillRect(i+5,j+7,16,20);y.globalAlpha=1;}}
  speckle(x,512,512,8000,.15,1.5);return{map:T(c),emissiveMap:T(e)};})();
 S.paintings=[0,1,2,3].map(k=>{const c=cnv(256,192),x=c.getContext('2d');const pal=[['#1d3557','#e63946','#f1faee','#a8dadc'],['#2b2d42','#ffb703','#fb8500','#8ecae6'],['#283618','#606c38','#dda15e','#fefae0'],['#3d405b','#e07a5f','#81b29a','#f2cc8f']][k];
  x.fillStyle=pal[0];x.fillRect(0,0,256,192);for(let i=0;i<14;i++){x.fillStyle=pal[1+i%3];x.globalAlpha=.55+R()*.4;if(k%2){x.beginPath();x.arc(R()*256,R()*192,10+R()*50,0,7);x.fill();}else{x.save();x.translate(R()*256,R()*192);x.rotate(R()*3);x.fillRect(-40*R()-10,-30*R()-6,40+R()*60,10+R()*40);x.restore();}}x.globalAlpha=1;
  for(let i=0;i<1600;i++){x.fillStyle=`rgba(0,0,0,${R()*.08})`;x.fillRect(R()*256,R()*192,2,2);}return T(c);});
 return S;}

// wall lettering (bank name plaque, store sign), drawn on a transparent canvas
export function labelTex(lines,o={}){const w=o.w||1024,h=o.h||256,c=cnv(w,h),x=c.getContext('2d');if(o.bg){x.fillStyle=o.bg;x.fillRect(0,0,w,h);}x.textAlign='center';x.textBaseline='middle';
 lines.forEach((l,i)=>{x.font=l.f;x.fillStyle=l.c;if(l.glow){x.shadowColor=l.glow;x.shadowBlur=l.blur||24;}else x.shadowBlur=0;if(l.ls)x.letterSpacing=l.ls;const mw=x.measureText(l.t).width;if(mw>w*.94){x.save();x.translate(w/2,l.y*h);x.scale(w*.94/mw,1);x.fillText(l.t,0,0);x.restore();}else x.fillText(l.t,w/2,l.y*h);});const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
// security monitor wall (green CCTV tiles)
export function monitorTex(){const c=cnv(256,128),x=c.getContext('2d');x.fillStyle='#050807';x.fillRect(0,0,256,128);for(let j=0;j<2;j++)for(let i=0;i<4;i++){const ox=i*64+3,oy=j*64+3;const g=x.createLinearGradient(ox,oy,ox,oy+58);g.addColorStop(0,'#2c4a3c');g.addColorStop(1,'#14261d');x.fillStyle=g;x.fillRect(ox,oy,58,58);
  x.fillStyle='rgba(160,255,200,.25)';x.fillRect(ox+8,oy+30+R()*10,20+R()*20,10);x.fillRect(ox+30,oy+12,10,30);for(let k=0;k<58;k+=2){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(ox,oy+k,58,1);}x.fillStyle='#ff4040';x.fillRect(ox+4,oy+4,4,4);x.fillStyle='#a0ffc0';x.font='8px monospace';x.fillText('CAM '+(j*4+i+1),ox+10,oy+10);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
