// IRON VANGUARD (adapted from FRONTLINE OPS) — procedural textures (canvas + value noise) with derived normal maps. No image files.
import * as THREE from '../vendor/three.module.min.js';

const PI2=Math.PI*2;let seed=1337;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
const cnv=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d',{willReadFrequently:true});return c;};
// tileable value noise
function vnoise(n){const g=new Float32Array(n*n);for(let i=0;i<g.length;i++)g[i]=R();return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,a=(xi%n+n)%n,b=(yi%n+n)%n,a1=(a+1)%n,b1=(b+1)%n;
 const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return(g[b*n+a]*(1-u)+g[b*n+a1]*u)*(1-v)+(g[b1*n+a]*(1-u)+g[b1*n+a1]*u)*v;};}
// fbm over a size x size tile, base period p cells
function fbm(size,p=8,oct=4){const ns=[];for(let o=0;o<oct;o++)ns.push(vnoise(p<<o));const out=new Float32Array(size*size);for(let j=0;j<size;j++)for(let i=0;i<size;i++){let v=0,a=.5,t=0;for(let o=0;o<oct;o++){const s=(p<<o)/size;v+=ns[o](i*s,j*s)*a;t+=a;a*=.5;}out[j*size+i]=v/t;}return out;}
function speckle(x,w,h,n,a,sz=2){for(let i=0;i<n;i++){const v=R();x.fillStyle=v<.5?`rgba(0,0,0,${a*R()})`:`rgba(255,255,255,${a*R()*.7})`;const s=1+R()*sz;x.fillRect(R()*w,R()*h,s,s);}}
// paint noise-modulated colour: col(t)->[r,g,b]
function paintNoise(x,w,h,N,col,alpha=1){const im=x.getImageData(0,0,w,h),d=im.data;for(let k=0;k<w*h;k++){const c=col(N[k],k%w,k/w|0);d[k*4]=d[k*4]*(1-alpha)+c[0]*alpha;d[k*4+1]=d[k*4+1]*(1-alpha)+c[1]*alpha;d[k*4+2]=d[k*4+2]*(1-alpha)+c[2]*alpha;}x.putImageData(im,0,0);}
function normalFrom(src,str=2){const w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data,c=cnv(w,h),x=c.getContext('2d'),o=x.createImageData(w,h);
 const L=(i,j)=>{i=(i+w)%w;j=(j+h)%h;const k=(j*w+i)*4;return(d[k]+d[k+1]+d[k+2])/765;};
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(L(i+1,j)-L(i-1,j))*str,dy=(L(i,j+1)-L(i,j-1))*str,l=Math.hypot(dx,dy,1),k=(j*w+i)*4;o.data[k]=(-dx/l*.5+.5)*255;o.data[k+1]=(dy/l*.5+.5)*255;o.data[k+2]=(1/l*.5+.5)*255;o.data[k+3]=255;}
 x.putImageData(o,0,0);return c;}
function T(c,srgb=true){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
function clampT(t){t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;}
function pair(size,draw,hdraw,str){const c=cnv(size),x=c.getContext('2d');draw(x,size,size);let hc=c;if(hdraw){hc=cnv(size);hdraw(hc.getContext('2d'),size,size);}return{map:T(c),normalMap:T(normalFrom(hc,str),false)};}
const grey=(x,w,h,v)=>{x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(0,0,w,h);};

export function makeTextures(){seed=1337;const S={};
 // ---------- walls (near-white bases, tinted per building by vertex colour) ----------
 S.plaster=pair(512,(x,w,h)=>{grey(x,w,h,236);const N=fbm(w,6,5),N2=fbm(w,24,3);paintNoise(x,w,h,N,(n,i,j)=>{const v=208+n*48-(N2[j*w+i]>.62?14:0);return[v+6,v,v-10];});
  speckle(x,w,h,6000,.12);x.strokeStyle='rgba(90,70,50,.25)';x.lineWidth=1;for(let i=0;i<7;i++){let px=R()*w,py=R()*h;x.beginPath();x.moveTo(px,py);for(let k=0;k<7;k++){px+=R()*14-7;py+=R()*12;x.lineTo(px,py);}x.stroke();}
  const g=x.createLinearGradient(0,h*.82,0,h);g.addColorStop(0,'rgba(80,60,40,0)');g.addColorStop(1,'rgba(80,60,40,.28)');x.fillStyle=g;x.fillRect(0,0,w,h);},
  (x,w,h)=>{grey(x,w,h,128);const N=fbm(w,32,3);paintNoise(x,w,h,N,n=>{const v=100+n*60;return[v,v,v];});speckle(x,w,h,9000,.25,1.5);},2.2);
 S.stone=pair(512,(x,w,h)=>{grey(x,w,h,180);seed=99;const bh=64;for(let r=0;r<h/bh;r++){let c=-(r%2)*40;while(c<w){const bw=70+R()*70,v=196+R()*36;x.fillStyle=`rgb(${v+8|0},${v|0},${v-14|0})`;x.fillRect(c+2,r*bh+2,bw-4,bh-4);c+=bw;}}
  const N=fbm(w,8,4);paintNoise(x,w,h,N,(n)=>[n*255,n*240,n*215],.18);speckle(x,w,h,9000,.18);},
  (x,w,h)=>{grey(x,w,h,40);const bh=64;seed=99;for(let r=0;r<h/bh;r++){let c=-(r%2)*40;while(c<w){const bw=70+R()*70;R();x.fillStyle='#b8b8b8';x.fillRect(c+4,r*bh+4,bw-8,bh-8);c+=bw;}}speckle(x,w,h,12000,.3,2);},3);
 S.concrete=pair(512,(x,w,h)=>{grey(x,w,h,200);const N=fbm(w,6,5);paintNoise(x,w,h,N,n=>{const v=170+n*60;return[v,v-2,v-6];});speckle(x,w,h,9000,.18);
  x.strokeStyle='rgba(40,38,36,.45)';x.lineWidth=2;for(let i=0;i<=w;i+=256){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}x.beginPath();x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();
  for(let i=0;i<8;i++){x.fillStyle='rgba(40,36,32,.5)';x.beginPath();x.arc(64+(i%4)*128,64+(i>>2)*256,4,0,7);x.fill();}
  for(let i=0;i<6;i++){const sx=R()*w,g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(60,55,50,.28)');g.addColorStop(1,'rgba(60,55,50,0)');x.fillStyle=g;x.fillRect(sx,0,6+R()*16,h*.5);}},
  (x,w,h)=>{grey(x,w,h,128);speckle(x,w,h,16000,.35,2);x.strokeStyle='#303030';x.lineWidth=3;for(let i=0;i<=w;i+=256){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}x.beginPath();x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();},2.4);
 // corrugated cladding: vertical ribs (containers, sheds); u along wall
 S.metal=pair(512,(x,w,h)=>{grey(x,w,h,215);for(let i=0;i<w;i+=32){const g=x.createLinearGradient(i,0,i+32,0);g.addColorStop(0,'rgba(0,0,0,.22)');g.addColorStop(.35,'rgba(255,255,255,.16)');g.addColorStop(.7,'rgba(0,0,0,.05)');g.addColorStop(1,'rgba(0,0,0,.22)');x.fillStyle=g;x.fillRect(i,0,32,h);}
  const N=fbm(w,8,5);paintNoise(x,w,h,N,(n)=>n>.6?[120,70,40]:[220,220,220],.0);
  const im=x.getImageData(0,0,w,h),d=im.data;for(let k=0;k<w*h;k++){const n=N[k];if(n>.58){const a=Math.min(1,(n-.58)*4)*.55;d[k*4]=d[k*4]*(1-a)+120*a;d[k*4+1]=d[k*4+1]*(1-a)+66*a;d[k*4+2]=d[k*4+2]*(1-a)+38*a;}}x.putImageData(im,0,0);
  for(let i=0;i<14;i++){const sx=R()*w,g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(110,60,30,.35)');g.addColorStop(1,'rgba(110,60,30,0)');x.fillStyle=g;x.fillRect(sx,R()*h*.5,3+R()*4,h*.4);}
  speckle(x,w,h,5000,.18);},(x,w,h)=>{for(let i=0;i<w;i+=32){const g=x.createLinearGradient(i,0,i+32,0);g.addColorStop(0,'#1a1a1a');g.addColorStop(.5,'#e8e8e8');g.addColorStop(1,'#1a1a1a');x.fillStyle=g;x.fillRect(i,0,32,h);}speckle(x,w,h,3000,.2);},3);
 S.wood=pair(256,(x,w,h)=>{x.fillStyle='#b08a5a';x.fillRect(0,0,w,h);for(let i=0;i<h;i+=32){const v=R();x.fillStyle=`rgb(${168+v*40|0},${128+v*30|0},${84+v*20|0})`;x.fillRect(0,i+1,w,30);for(let k=0;k<26;k++){x.strokeStyle=`rgba(80,52,26,${.08+R()*.18})`;x.beginPath();const yy=i+R()*30;x.moveTo(0,yy);x.bezierCurveTo(w*.3,yy+R()*4-2,w*.6,yy+R()*4-2,w,yy);x.stroke();}}
  x.fillStyle='rgba(40,28,14,.6)';for(let i=0;i<h;i+=32)x.fillRect(0,i,w,2);},null,2);
 S.crate=pair(256,(x,w,h)=>{x.fillStyle='#a88654';x.fillRect(0,0,w,h);for(let i=0;i<h;i+=32){const v=R();x.fillStyle=`rgb(${160+v*40|0},${124+v*30|0},${80+v*20|0})`;x.fillRect(0,i+1,w,30);for(let k=0;k<20;k++){x.strokeStyle=`rgba(80,52,26,${.08+R()*.15})`;x.beginPath();const yy=i+R()*30;x.moveTo(0,yy);x.lineTo(w,yy+R()*3);x.stroke();}}
  x.strokeStyle='#6a4a26';x.lineWidth=18;x.strokeRect(9,9,w-18,h-18);x.lineWidth=14;x.beginPath();x.moveTo(14,14);x.lineTo(w-14,h-14);x.stroke();x.fillStyle='rgba(30,30,30,.7)';x.font='bold 20px monospace';x.fillText('FRAGILE',w*.5,h*.28);},null,2);
 // terracotta roof tiles (rows across v)
 S.tiles=pair(256,(x,w,h)=>{x.fillStyle='#7a3a22';x.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const v=R()*30,ox=(r%2)*16;const g=x.createLinearGradient(0,r*32,0,r*32+32);g.addColorStop(0,`rgb(${150+v|0},${70+v*.5|0},${44|0})`);g.addColorStop(1,`rgb(${196+v|0},${100+v|0},${62+v*.5|0})`);x.fillStyle=g;x.beginPath();x.ellipse(c*32+ox+16,r*32+18,15,17,0,0,Math.PI);x.fill();x.fillRect(c*32+ox+1,r*32,30,18);}speckle(x,w,h,4000,.2);},
  (x,w,h)=>{grey(x,w,h,30);for(let r=0;r<8;r++)for(let c=0;c<9;c++){const ox=(r%2)*16;const g=x.createLinearGradient(c*32+ox,0,c*32+ox+32,0);g.addColorStop(0,'#404040');g.addColorStop(.5,'#e0e0e0');g.addColorStop(1,'#404040');x.fillStyle=g;x.fillRect(c*32+ox-16,r*32+2,30,28);}},3);
 // ---------- ground ----------
 const ground=(base,alt,p=6,spk=.25,pebbles=0,hstr=2)=>pair(512,(x,w,h)=>{grey(x,w,h,128);const N=fbm(w,p,5),N2=fbm(w,p*4,3);paintNoise(x,w,h,N,(n,i,j)=>{const m=Math.min(1,Math.max(0,(N2[j*w+i]-.42)*3));return[base[0]*(1-m)+alt[0]*m+(n-.5)*60,base[1]*(1-m)+alt[1]*m+(n-.5)*56,base[2]*(1-m)+alt[2]*m+(n-.5)*48];});
  speckle(x,w,h,26000,spk,2);for(let i=0;i<pebbles;i++){const v=R()*70+90;x.fillStyle=`rgb(${v|0},${v*.94|0},${v*.85|0})`;x.beginPath();x.ellipse(R()*w,R()*h,1+R()*3,1+R()*2,R()*3,0,7);x.fill();}},null,hstr);
 S.dirt=ground([150,132,104],[118,104,80],6,.25,900,2.2);
 S.grass=ground([108,122,70],[136,138,84],7,.22,200,2);

 S.sandbag=pair(256,(x,w,h)=>{x.fillStyle='#6d6247';x.fillRect(0,0,w,h);const bh=32,bw=64;for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const ox=(r%2)*bw/2,cx=c*bw+ox+bw/2,cy=r*bh+bh/2,g=x.createRadialGradient(cx,cy-4,4,cx,cy,bw*.55);const v=R()*20;g.addColorStop(0,`rgb(${196+v|0},${178+v|0},${136+v|0})`);g.addColorStop(1,'rgb(96,84,60)');x.fillStyle=g;x.beginPath();x.ellipse(cx,cy,bw*.49,bh*.48,0,0,7);x.fill();}speckle(x,w,h,5000,.18);},null,3.2);
 // ---------- soldiers: kit atlas (left half camo, right half neutral cloth) ----------
 // ---------- sprites ----------
 {const c=cnv(64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,30);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.16,'rgba(10,8,6,.95)');g.addColorStop(.28,'rgba(40,36,30,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  x.strokeStyle='rgba(20,18,15,.6)';for(let i=0;i<7;i++){const a=R()*6.28;x.beginPath();x.moveTo(32,32);x.lineTo(32+Math.cos(a)*(10+R()*14),32+Math.sin(a)*(10+R()*14));x.stroke();}S.hole=clampT(T(c));}
 {const c=cnv(128),x=c.getContext('2d');x.translate(64,64);for(let i=0;i<7;i++){x.rotate(Math.PI*2/7);const g=x.createLinearGradient(0,0,0,62);g.addColorStop(0,'rgba(255,245,215,1)');g.addColorStop(.35,'rgba(255,180,70,.85)');g.addColorStop(1,'rgba(255,100,20,0)');x.fillStyle=g;x.beginPath();x.moveTo(-8,0);x.lineTo(0,34+R()*28);x.lineTo(8,0);x.fill();}
  const g=x.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,'rgba(255,255,245,1)');g.addColorStop(.5,'rgba(255,200,110,.7)');g.addColorStop(1,'rgba(255,140,50,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,30,0,7);x.fill();S.flash=clampT(T(c));}
 // side-on muzzle flame (for the viewmodel side plane)
 {const c=cnv(128,64),x=c.getContext('2d');const g=x.createRadialGradient(10,32,0,10,32,110);g.addColorStop(0,'rgba(255,250,230,1)');g.addColorStop(.25,'rgba(255,190,90,.85)');g.addColorStop(1,'rgba(255,110,30,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,32);x.quadraticCurveTo(50,4,128,30);x.lineTo(128,34);x.quadraticCurveTo(50,60,0,32);x.fill();S.flashSide=clampT(T(c));}
 {const c=cnv(64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);S.glow=clampT(T(c));}
 {const c=cnv(256),x=c.getContext('2d');x.fillStyle='#5a5c5e';x.fillRect(0,0,256,256);speckle(x,256,256,9000,.3);x.strokeStyle='#f0e8d8';x.lineWidth=10;x.beginPath();x.arc(128,128,108,0,7);x.stroke();x.fillStyle='#f0e8d8';x.fillRect(78,64,22,128);x.fillRect(156,64,22,128);x.fillRect(78,117,100,22);S.pad=T(c);}
 // foliage cards
 // windows: 4 variants in a 2x2 atlas (glass panes with frame + interior hint + optional shutters)
 {const c=cnv(256),x=c.getContext('2d');const cell=(ox,oy,shutter,col)=>{x.fillStyle='#e8e4dc';x.fillRect(ox,oy,128,128);x.fillStyle='#2a2e34';x.fillRect(ox+14,oy+10,100,108);
   const g=x.createLinearGradient(ox,oy,ox+128,oy+128);g.addColorStop(0,'#9ab0c4');g.addColorStop(.5,'#3c4a58');g.addColorStop(1,'#1e262e');x.fillStyle=g;x.fillRect(ox+20,oy+16,40,96);x.fillRect(ox+68,oy+16,40,96);
   x.fillStyle='rgba(255,255,255,.25)';x.beginPath();x.moveTo(ox+20,oy+16);x.lineTo(ox+44,oy+16);x.lineTo(ox+20,oy+60);x.fill();x.beginPath();x.moveTo(ox+68,oy+16);x.lineTo(ox+92,oy+16);x.lineTo(ox+68,oy+60);x.fill();
   x.fillStyle='#e8e4dc';x.fillRect(ox+60,oy+16,8,96);x.fillRect(ox+20,oy+60,88,6);x.fillStyle='#cfc8bc';x.fillRect(ox+8,oy+116,112,10);
   if(shutter){x.fillStyle=col;x.fillRect(ox+14,oy+10,28,108);x.fillRect(ox+86,oy+10,28,108);x.fillStyle='rgba(0,0,0,.25)';for(let k=oy+14;k<oy+114;k+=7){x.fillRect(ox+16,k,24,2);x.fillRect(ox+88,k,24,2);}}};
  cell(0,0,false);cell(128,0,true,'#2f6f86');cell(0,128,true,'#3d6b45');cell(128,128,false);
  // variant 4: lit (warm) interior
  const g=x.createLinearGradient(128,128,256,256);g.addColorStop(0,'#ffe2a8');g.addColorStop(1,'#d88a40');x.fillStyle=g;x.fillRect(148,144,40,96);x.fillRect(196,144,40,96);x.fillStyle='#e8e4dc';x.fillRect(188,144,8,96);x.fillRect(148,188,88,6);
  S.win=clampT(T(c));}
 // cloth (awnings / tarps)
 {const c=cnv(128),x=c.getContext('2d');grey(x,128,128,235);for(let i=0;i<128;i+=16){x.fillStyle='rgba(0,0,0,.06)';x.fillRect(i,0,8,128);}speckle(x,128,128,2000,.1);S.cloth=T(c);}
 // signs with original names
 S.sign=(text,bg,fg,w=512,h=128)=>{const c=cnv(w,h),x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=fg;x.font=`bold ${h*.55|0}px Impact, 'Arial Narrow', sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2+2);speckle(x,w,h,1500,.15);const t=T(c);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;};
 // water normal (tileable ripples)
 {const s=256,c=cnv(s),x=c.getContext('2d');grey(x,s,s,128);const N=fbm(s,8,4);paintNoise(x,s,s,N,n=>[n*255,n*255,n*255]);S.waterN=T(normalFrom(c,3),false);}
 // ---------- valley ground, rock, vehicles ----------
 {const c=cnv(128),x=c.getContext('2d');x.fillStyle='#2e2d2a';x.fillRect(0,0,128,128);x.fillStyle='#55534d';x.beginPath();x.arc(64,64,60,0,7);x.fill();x.fillStyle='#3c3a36';x.beginPath();x.arc(64,64,48,0,7);x.fill();x.strokeStyle='#5f5c55';x.lineWidth=9;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;x.beginPath();x.moveTo(64+Math.cos(a)*14,64+Math.sin(a)*14);x.lineTo(64+Math.cos(a)*46,64+Math.sin(a)*46);x.stroke();}
  x.fillStyle='#6b6860';x.beginPath();x.arc(64,64,16,0,7);x.fill();S.wheel=clampT(T(c));S.wheel.center.set(.5,.5);}
 // pine needle card + broadleaf canopy (alpha)
 // ===================== realism pass: ground, foliage, vehicles, steel, kit, smoke =====================
 const W2=(w,px,py,m,fn)=>{for(const ox of[0,-w,w])for(const oy of[0,-w,w]){const X=px+ox,Y=py+oy;if(X>-m&&X<w+m&&Y>-m&&Y<w+m)fn(X,Y);}};
 const img=(w,h,fn)=>{const c=cnv(w,h),x=c.getContext('2d'),im=x.createImageData(w,h),d=im.data;for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(j*w+i)*4,o=fn(i,j,j*w+i);d[k]=o[0];d[k+1]=o[1];d[k+2]=o[2];d[k+3]=o[3]??255;}x.putImageData(im,0,0);return c;};
 // meadow: dry / lush grass patches over soil, thousands of blade strokes; height = blades
 S.meadow=(()=>{const w=512,N=fbm(w,4,5),N2=fbm(w,16,4),N3=fbm(w,40,3);const dryOf=k=>Math.min(1,Math.max(0,(N[k]-.5)*3.2));
  const c=img(w,w,(i,j,k)=>{const dry=dryOf(k),soil=Math.max(0,(N3[k]-.64)*3.5)*(1-dry*.4),v=.8+N2[k]*.4;let r=70+dry*74,g=92+dry*46,b=40+dry*22;r=r*(1-soil)+92*soil;g=g*(1-soil)+76*soil;b=b*(1-soil)+52*soil;return[r*v,g*v,b*v];});
  const x=c.getContext('2d'),hc=img(w,w,(i,j,k)=>{const v=50+N3[k]*30;return[v,v,v];}),hx=hc.getContext('2d');
  for(let i=0;i<30000;i++){const px=R()*w,py=R()*w,a=-PI2/4+(R()-.5)*1.2,l=3+R()*8,k=((py|0)%w)*w+((px|0)%w),dry=dryOf(k),t=R(),dx=Math.cos(a)*l,dy=Math.sin(a)*l;
   const col=`rgba(${(52+t*70+dry*86)|0},${(78+t*70+dry*44)|0},${(26+t*34+dry*22)|0},${(.5+R()*.45).toFixed(2)})`,lw=.7+R()*1.3,hv=`rgba(255,255,255,${(.25+R()*.5).toFixed(2)})`;
   W2(w,px,py,12,(X,Y)=>{x.strokeStyle=col;x.lineWidth=lw;x.beginPath();x.moveTo(X,Y);x.lineTo(X+dx,Y+dy);x.stroke();hx.strokeStyle=hv;hx.lineWidth=lw;hx.beginPath();hx.moveTo(X,Y);hx.lineTo(X+dx,Y+dy);hx.stroke();});}
  speckle(x,w,w,5000,.16,1.5);return{map:T(c),normalMap:T(normalFrom(hc,1.4),false)};})();
 // lush variant used as the second grass layer
 S.grass=(()=>{const w=512,N=fbm(w,6,4),N2=fbm(w,20,3);const c=img(w,w,(i,j,k)=>{const v=.78+N2[k]*.44,m=N[k];return[(64+m*40)*v,(96+m*36)*v,(38+m*18)*v];}),x=c.getContext('2d');
  for(let i=0;i<22000;i++){const px=R()*w,py=R()*w,a=-PI2/4+(R()-.5)*.9,l=4+R()*9,t=R(),dx=Math.cos(a)*l,dy=Math.sin(a)*l,col=`rgba(${(46+t*60)|0},${(84+t*76)|0},${(24+t*30)|0},${(.55+R()*.4).toFixed(2)})`,lw=.8+R()*1.2;
   W2(w,px,py,12,(X,Y)=>{x.strokeStyle=col;x.lineWidth=lw;x.beginPath();x.moveTo(X,Y);x.lineTo(X+dx,Y+dy);x.stroke();});}
  speckle(x,w,w,4000,.15,1.5);return{map:T(c)};})();
 // wet churned mud: lumps, standing water, tread imprints; height in the normal map
 S.mud=(()=>{const w=512,N=fbm(w,5,5),N2=fbm(w,24,4),N3=fbm(w,64,2);const wetOf=k=>Math.min(1,Math.max(0,(N[k]-.6)*5));
  const c=img(w,w,(i,j,k)=>{const wet=wetOf(k),v=.72+N2[k]*.5+N3[k]*.12;return[(96-wet*46)*v,(80-wet*38)*v,(60-wet*28)*v];}),x=c.getContext('2d');
  const hc=img(w,w,(i,j,k)=>{const wet=wetOf(k),h=(1-wet)*(60+N2[k]*150+N3[k]*40)+wet*70;return[h,h,h];}),hx=hc.getContext('2d');
  for(let i=0;i<5;i++){let px=R()*w,py=R()*w;const a=R()*PI2,ca=Math.cos(a),sa=Math.sin(a);for(let s=0;s<40;s++){const qx=px+ca*s*9,qy=py+sa*s*9;for(const off of[-1,1])W2(w,qx-sa*off*16,qy+ca*off*16,20,(X,Y)=>{x.save();x.translate(X,Y);x.rotate(a);x.fillStyle='rgba(40,30,22,.22)';x.fillRect(-2,-7,4,14);x.restore();hx.save();hx.translate(X,Y);hx.rotate(a);hx.fillStyle='rgba(0,0,0,.32)';hx.fillRect(-2,-7,4,14);hx.restore();});}}
  for(let i=0;i<700;i++){const px=R()*w,py=R()*w,v=60+R()*70,rr=1+R()*3;W2(w,px,py,6,(X,Y)=>{x.fillStyle=`rgb(${v|0},${v*.9|0},${v*.78|0})`;x.beginPath();x.ellipse(X,Y,rr,rr*.7,0,0,7);x.fill();hx.fillStyle='#fff';hx.beginPath();hx.ellipse(X,Y,rr,rr*.7,0,0,7);hx.fill();});}
  return{map:T(c),normalMap:T(normalFrom(hc,2.6),false)};})();
 // weathered rock: strata, cracks, lichen
 S.rock=(()=>{const w=512,N=fbm(w,6,5),N2=fbm(w,24,4),Ns=fbm(w,3,4);const c=img(w,w,(i,j,k)=>{const st=Math.sin(j*.09+Ns[k]*14)*.5+.5,v=.62+N[k]*.42+st*.1+N2[k]*.12,li=Math.max(0,(N2[k]-.68)*4);let r=136*v,g=130*v,b=120*v;r=r*(1-li)+150*li;g=g*(1-li)+146*li;b=b*(1-li)+92*li;return[r,g,b];});
  const x=c.getContext('2d'),hc=img(w,w,(i,j,k)=>{const st=Math.sin(j*.09+Ns[k]*14)*.5+.5,h=N[k]*170+st*50+N2[k]*35;return[h,h,h];}),hx=hc.getContext('2d');
  for(let i=0;i<22;i++){let px=R()*w,py=R()*w;const pts=[[px,py]];for(let k=0;k<9;k++){px+=R()*36-18;py+=R()*30-6;pts.push([px,py]);}for(const[cx,cy]of[[x,'rgba(30,28,26,.6)'],[hx,'rgba(0,0,0,.9)']]){cx.strokeStyle=cy;cx.lineWidth=1+R()*1.5;cx.beginPath();pts.forEach(([a,b],k)=>k?cx.lineTo(a,b):cx.moveTo(a,b));cx.stroke();}}
  speckle(x,w,w,9000,.22,2);return{map:T(c),normalMap:T(normalFrom(hc,3.4),false)};})();
 // bark: vertical furrows (u around, v up)
 {const w=256,N=fbm(w,8,4);const furrow=(i,j,k)=>{const f=Math.abs(Math.sin(i*.16+N[k]*7+Math.sin(j*.05)*1.4));return Math.pow(f,.6);};
  const c=img(w,w,(i,j,k)=>{const f=furrow(i,j,k),v=.45+f*.6+N[k]*.2;return[112*v,92*v,72*v];}),h=img(w,w,(i,j,k)=>{const v=furrow(i,j,k)*230;return[v,v,v];});
  S.bark=T(c);S.barkN=T(normalFrom(h,3),false);}
 // pine branch card (alpha): twig from base (bottom) to tip (top), needle sprays on both sides
 {const w=256,c=cnv(w),x=c.getContext('2d');const twig=(x0,y0,x1,y1,wd,n,side)=>{x.strokeStyle='#3a2c1e';x.lineWidth=wd;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();
   for(let k=0;k<n;k++){const t=k/n,px=x0+(x1-x0)*t,py=y0+(y1-y0)*t,len=(1-t*.6)*side*(.7+R()*.5),a0=Math.atan2(y1-y0,x1-x0);for(const s of[-1,1]){const a=a0+s*(.9+R()*.4),v=R(),g=t;x.strokeStyle=`rgb(${(30+v*28+g*30)|0},${(58+v*36+g*40)|0},${(26+v*16+g*10)|0})`;x.lineWidth=1.4+R();x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*len,py+Math.sin(a)*len);x.stroke();}}};
  for(let b=0;b<9;b++){const t=.12+b/9*.8,py=w-t*w,s=b%2?1:-1,len=(1-t)*90+18;twig(w/2,py,w/2+s*len*.85,py-len*.55,2,16,16*(1-t*.4));}
  twig(w/2,w,w/2,6,4,48,20);S.needle=clampT(T(c));}
 // broadleaf cluster card (alpha)
 {const w=256,c=cnv(w),x=c.getContext('2d');for(let i=0;i<420;i++){const a=R()*PI2,r=Math.pow(R(),.6)*112,px=128+Math.cos(a)*r,py=128+Math.sin(a)*r*.9,s=5+R()*7,v=R(),edge=r/112;
   x.save();x.translate(px,py);x.rotate(R()*PI2);x.fillStyle=`rgb(${(46+v*50+edge*20)|0},${(70+v*60+edge*20)|0},${(26+v*24)|0})`;x.beginPath();x.moveTo(-s,0);x.quadraticCurveTo(0,-s*.55,s,0);x.quadraticCurveTo(0,s*.55,-s,0);x.fill();
   x.strokeStyle='rgba(20,30,10,.35)';x.lineWidth=.6;x.beginPath();x.moveTo(-s,0);x.lineTo(s,0);x.stroke();x.restore();}
  x.strokeStyle='#3a2c1e';x.lineWidth=2.5;for(let i=0;i<5;i++){const a=R()*PI2;x.beginPath();x.moveTo(128,128);x.lineTo(128+Math.cos(a)*70,128+Math.sin(a)*60);x.stroke();}S.foliage=clampT(T(c));}
 // grass card (alpha): dense tuft, dark roots, sunlit tips
 {const c=cnv(128),x=c.getContext('2d');for(let i=0;i<46;i++){const bx=8+R()*112,top=8+R()*60,g=x.createLinearGradient(0,128,0,top);const v=R()*40,dry=R()<.25?40:0;g.addColorStop(0,`rgb(${30+v*.5|0},${42+v*.5|0},${18|0})`);g.addColorStop(1,`rgb(${120+v+dry|0},${140+v|0},${64+v*.5|0})`);
  x.strokeStyle=g;x.lineWidth=1.5+R()*2.2;x.beginPath();x.moveTo(bx,128);x.quadraticCurveTo(bx+R()*14-7,(128+top)/2,bx+R()*30-15,top);x.stroke();}S.grassCard=clampT(T(c));}
 // vehicle camo: soft-edged woodland blots, chipped paint, grime streaks, dust
 const vcamo=(cols)=>{const w=512,c=cnv(w),x=c.getContext('2d');x.fillStyle=cols[0];x.fillRect(0,0,w,w);
  for(let k=1;k<4;k++)for(let i=0;i<12;i++){const cx=R()*w,cy=R()*w;for(let j=0;j<7;j++){const r=14+R()*30;W2(w,cx+(R()-.5)*80,cy+(R()-.5)*56,r+4,(X,Y)=>{x.fillStyle=cols[k];x.beginPath();x.ellipse(X,Y,r*1.2,r*.8,R()*3,0,7);x.fill();});}}
  {const t=cnv(w);t.getContext('2d').drawImage(c,0,0);x.filter='blur(2px)';x.drawImage(t,0,0);}// one soft-edge pass instead of blurring every blot
  x.filter='none';const N=fbm(w,8,4),N2=fbm(w,32,3);paintNoise(x,w,w,N,(n,i,j)=>{const k=n*.25+N2[j*w+i]*.1;return[150*k+40,140*k+38,110*k+30];},.22);
  for(let i=0;i<70;i++){const sx=R()*w,sy=R()*w,g=x.createLinearGradient(0,sy,0,sy+60+R()*80);g.addColorStop(0,'rgba(34,28,20,.3)');g.addColorStop(1,'rgba(34,28,20,0)');x.fillStyle=g;x.fillRect(sx,sy,2+R()*4,140);}
  for(let i=0;i<900;i++){const px=R()*w,py=R()*w,s=.6+R()*2.2,v=R()<.6;x.fillStyle=v?'rgba(70,70,64,.85)':'rgba(150,146,130,.6)';x.beginPath();x.ellipse(px,py,s*1.4,s,R()*3,0,7);x.fill();}
  speckle(x,w,w,14000,.1,1.4);return T(c);};
 S.camoA=vcamo(['#58603a','#3f4626','#717a4a','#2f3220']);S.camoB=vcamo(['#6a6f6e','#4a4e4f','#8a8e8a','#2e3132']);
 // cast/rolled armour normal + grime roughness (shared by every vehicle paint)
 {const w=256,N=fbm(w,16,4),N2=fbm(w,4,3);const h=img(w,w,(i,j,k)=>{const v=N[k]*140+N2[k]*60;return[v,v,v];});const hx=h.getContext('2d');for(let i=0;i<300;i++){hx.fillStyle='rgba(0,0,0,.6)';hx.beginPath();hx.arc(R()*w,R()*w,.8+R()*1.6,0,7);hx.fill();}
  S.vehN=T(normalFrom(h,1.6),false);S.vehR=T(img(w,w,(i,j,k)=>{const v=150+N2[k]*90+N[k]*20;return[v,v,v];}),false);}
 // track links: steel shoes with grousers, centre guide horns, rubber pads; map + normal (v = arc length, one tile per metre)
 {const w=128,c=cnv(w),x=c.getContext('2d'),hc=cnv(w),hx=hc.getContext('2d');x.fillStyle='#1c1b19';x.fillRect(0,0,w,w);hx.fillStyle='#000';hx.fillRect(0,0,w,w);
  for(let i=0;i<4;i++){const y=i*32;const g=x.createLinearGradient(0,y,0,y+30);g.addColorStop(0,'#5d5a54');g.addColorStop(.5,'#45433e');g.addColorStop(1,'#2e2c29');x.fillStyle=g;x.fillRect(3,y+2,w-6,27);
   x.fillStyle='#6e6a62';x.fillRect(6,y+11,w-12,5);x.fillStyle='#232220';x.fillRect(w/2-9,y+5,18,20);x.fillStyle='#7a766c';x.fillRect(w/2-6,y+8,12,14);x.fillStyle='#2a2826';x.fillRect(20,y+19,22,7);x.fillRect(w-42,y+19,22,7);
   hx.fillStyle='#808080';hx.fillRect(3,y+2,w-6,27);hx.fillStyle='#ffffff';hx.fillRect(6,y+11,w-12,5);hx.fillRect(w/2-6,y+8,12,14);}
  speckle(x,w,w,2500,.25,1.5);const N=fbm(w,8,3);paintNoise(x,w,w,N,(n)=>[90+n*40,78+n*30,58+n*20],.18);S.tread=T(c);S.treadN=T(normalFrom(hc,3),false);}
 // rusted painted steel (bridge truss): rivet rows, rust blooms, run-off streaks; map + normal + roughness
 {const w=512,N=fbm(w,6,5),N2=fbm(w,24,4),N3=fbm(w,64,2);const rustOf=(k)=>Math.min(1,Math.max(0,(N[k]*.75+N2[k]*.35-.6)*3.4));
  const c=img(w,w,(i,j,k)=>{const r=rustOf(k),v=.8+N3[k]*.3;const pr=[72,82,74],ru=[118+N2[k]*50,62+N2[k]*22,34];return[(pr[0]*(1-r)+ru[0]*r)*v,(pr[1]*(1-r)+ru[1]*r)*v,(pr[2]*(1-r)+ru[2]*r)*v];}),x=c.getContext('2d');
  for(let i=0;i<60;i++){const sx=R()*w,sy=R()*w,g=x.createLinearGradient(0,sy,0,sy+90+R()*120);g.addColorStop(0,'rgba(120,58,26,.45)');g.addColorStop(1,'rgba(120,58,26,0)');x.fillStyle=g;x.fillRect(sx,sy,1.5+R()*3.5,220);}
  const hc=img(w,w,(i,j,k)=>{const r=rustOf(k),v=120+r*(N3[k]*120-40)+N2[k]*20;return[v,v,v];}),hx=hc.getContext('2d');
  for(let row=32;row<w;row+=128)for(let i=8;i<w;i+=22){for(const[cx,f]of[[x,'rgba(40,44,40,.9)'],[hx,'#fff']]){cx.fillStyle=f;cx.beginPath();cx.arc(i,row,4,0,7);cx.fill();}x.fillStyle='rgba(200,200,190,.35)';x.beginPath();x.arc(i-1,row-1.5,1.6,0,7);x.fill();}
  speckle(x,w,w,9000,.14,1.5);S.steel={map:T(c),normalMap:T(normalFrom(hc,2.2),false),roughnessMap:T(img(w,w,(i,j,k)=>{const v=120+rustOf(k)*125;return[v,v,v];}),false)};}
 // soldier kit atlas: left half multi-scale camo, right half neutral cloth (tinted per part); fabric normal map
 const kit=(base,cols,neutral)=>{const c=cnv(512),x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,256,512);
  for(let k=0;k<cols.length;k++)for(let i=0;i<26;i++){const px=R()*256,py=R()*512;x.fillStyle=cols[k];x.beginPath();let a=0;const n=9,r0=8+R()*18;for(let s=0;s<=n;s++){a=s/n*PI2;const r=r0*(.6+R()*.7);const qx=px+Math.cos(a)*r*1.4,qy=py+Math.sin(a)*r;s?x.lineTo(qx,qy):x.moveTo(qx,qy);}x.fill();}
  for(let i=0;i<1600;i++){x.fillStyle=cols[i%cols.length];x.fillRect(R()*256,R()*512,2+R()*3,2+R()*3);}
  x.fillStyle=neutral;x.fillRect(256,0,256,512);x.globalAlpha=.1;for(let i=0;i<512;i+=2){x.fillStyle=i%4?'#000':'#fff';x.fillRect(0,i,512,1);x.fillRect(i,0,1,512);}x.globalAlpha=1;
  const N=fbm(512,8,3);paintNoise(x,512,512,N,n=>[60+n*80,56+n*72,44+n*60],.12);speckle(x,512,512,6000,.1,1);return T(c);};
 S.kitA=kit('#7d7556',['#5d5a3e','#a0946c','#4b5034','#3a3a2a']);S.kitB=kit('#62655e',['#4a4d48','#82857c','#575a52','#33352f']);
 {const w=256,c=cnv(w),x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,w,w);for(let i=0;i<w;i+=3){x.fillStyle='rgba(255,255,255,.35)';x.fillRect(0,i,w,1);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(i,0,1,w);}
  const N=fbm(w,4,3);paintNoise(x,w,w,N,n=>[n*255,n*255,n*255],.35);for(let i=0;i<10;i++){x.strokeStyle='rgba(0,0,0,.5)';x.lineWidth=1.5;const y=R()*w;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(w*.3,y+R()*20-10,w*.6,y+R()*20-10,w,y);x.stroke();}S.kitN=T(normalFrom(c,1.2),false);}
 // smoke puff atlas 2x2: RGB = view-space normal of a billowing cauliflower blob, A = density (lit in the particle shader)
 {const w=512,h=256,c=cnv(w),x=c.getContext('2d'),im=x.createImageData(w,w),d=im.data,Nn=fbm(h,6,4);
  for(let q=0;q<4;q++){const ox=(q&1)*h,oy=(q>>1)*h,bl=[];for(let i=0;i<9+q*2;i++){const a=R()*PI2,r=R()*.42;bl.push([.5+Math.cos(a)*r*.75,.52+Math.sin(a)*r*.62,.17+R()*.15]);}bl.push([.5,.55,.3]);
   const D=new Float32Array(h*h);for(let j=0;j<h;j++)for(let i=0;i<h;i++){const u=i/h,v=j/h;let s=0;for(const[bx,by,br]of bl){const dd=((u-bx)**2+(v-by)**2)/(br*br);s+=Math.exp(-dd*2.2);}const e=Math.min(1,Math.hypot(u-.5,v-.5)*2);D[j*h+i]=s*(1-e*e)*(.7+Nn[((j+q*37)%h)*h+((i+q*61)%h)]*.6);}
   for(let j=0;j<h;j++)for(let i=0;i<h;i++){const g=(a,b)=>D[Math.min(h-1,Math.max(0,b))*h+Math.min(h-1,Math.max(0,a))];const dx=(g(i+2,j)-g(i-2,j))*3,dy=(g(i,j+2)-g(i,j-2))*3,l=Math.hypot(dx,dy,1),k=((oy+j)*w+ox+i)*4,a=Math.max(0,Math.min(1,(D[j*h+i]-.18)*1.35));
    d[k]=(-dx/l*.5+.5)*255;d[k+1]=(dy/l*.5+.5)*255;d[k+2]=(1/l*.5+.5)*255;d[k+3]=a*255;}}
  x.putImageData(im,0,0);S.puff=clampT(T(c,false));}
 // flame blob (additive fire)
 {const w=128,N=fbm(w,4,4);const c=img(w,w,(i,j,k)=>{const u=i/w-.5,v=j/w-.5,r=Math.hypot(u*1.25,v+Math.max(0,-v)*.25)*2,n=N[k];const a=Math.max(0,1-r*(1.1-n*.5));const core=Math.pow(a,1.6);return[255,180+core*75,80+core*150,Math.min(255,a*a*330)];});S.flame=clampT(T(c));}
 // shell crater decal: dark scorched centre, ejected soil rays, clods
 {const w=256,c=cnv(w),x=c.getContext('2d');const N=fbm(w,6,4);const im=x.createImageData(w,w);for(let j=0;j<w;j++)for(let i=0;i<w;i++){const u=i/w-.5,v=j/w-.5,r=Math.hypot(u,v)*2,a=Math.atan2(v,u),n=N[j*w+i],ray=Math.pow(Math.abs(Math.sin(a*7+n*4)),3);
   const core=Math.max(0,1-r*1.6),ring=Math.max(0,1-Math.abs(r-.62)*5)*.6,ej=Math.max(0,1-r)*ray*.7;const al=Math.min(1,core*1.4+ring+ej)*(.75+n*.4)*(r<1?1:0),k=(j*w+i)*4;
   const dark=core>.2?1:0;im.data[k]=dark?22:58+n*30;im.data[k+1]=dark?19:48+n*24;im.data[k+2]=dark?16:36+n*18;im.data[k+3]=Math.min(255,al*235);}
  x.putImageData(im,0,0);for(let i=0;i<70;i++){const a=R()*PI2,r=40+R()*80;x.fillStyle=`rgba(${50+R()*30|0},${40+R()*24|0},${30+R()*16|0},.85)`;x.beginPath();x.ellipse(128+Math.cos(a)*r,128+Math.sin(a)*r,1.5+R()*3,1+R()*2,a,0,7);x.fill();}S.scorch=clampT(T(c));}
 // tree atlas (one material for trunks + crowns + impostors): A bark x0-128 | B pine branch card x128-320,y0-256 | C leaf cluster x320-512,y0-192
 // D dense needles (opaque) x320-512,y192-256 | E pine impostor x128-256,y256-512 | F oak impostor x256-512,y256-512
 {const w=512,c=cnv(w),x=c.getContext('2d');x.drawImage(S.bark.image,0,0,128,512);x.drawImage(S.needle.image,128,0,192,256);x.drawImage(S.foliage.image,320,0,192,192);
  x.fillStyle='#22361c';x.fillRect(320,192,192,64);for(let i=0;i<900;i++){const v=R();x.strokeStyle=`rgb(${(26+v*30)|0},${(46+v*40)|0},${(22+v*14)|0})`;x.lineWidth=1.5;const px=320+R()*192,py=192+R()*64,a=R()*PI2;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*5,py+Math.sin(a)*5);x.stroke();}
  // E: pine silhouette in 7 drooping tiers
  x.save();x.beginPath();x.rect(128,256,128,256);x.clip();x.strokeStyle='#3a2a1c';x.lineWidth=4;x.beginPath();x.moveTo(192,512);x.lineTo(192,262);x.stroke();
  for(let i=0;i<5200;i++){const t=Math.pow(R(),.85),tier=(t*7)%1,hw=((1-t)*54+5)*(.62+.38*tier),px=192+(R()*2-1)*hw,py=500-t*236+tier*10,v=R(),lit=(1-t)*.2+(px<192?.15:0);
   x.strokeStyle=`rgb(${(24+v*26+lit*40)|0},${(44+v*36+lit*50)|0},${(20+v*14+lit*20)|0})`;x.lineWidth=1.6;const a=PI2/4+(px-192)/60+(R()-.5)*.8;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*4,py+Math.sin(a)*5);x.stroke();}x.restore();
  // F: broadleaf silhouette: trunk, limbs, lumpy crown
  x.save();x.beginPath();x.rect(256,256,256,256);x.clip();x.strokeStyle='#3e2e20';x.lineCap='round';for(const[a,l,wd]of[[0,150,9],[-.5,70,5],[.6,64,5],[-.15,90,4]]){x.lineWidth=wd;x.beginPath();x.moveTo(384,512);x.lineTo(384+Math.sin(a)*l,512-90-Math.cos(a)*l*.6);x.stroke();}
  const bl=[];for(let i=0;i<13;i++){const a=R()*PI2,r=R()*70;bl.push([384+Math.cos(a)*r*1.1,372+Math.sin(a)*r*.7,30+R()*26]);}
  for(let i=0;i<5200;i++){const b=bl[i%bl.length],a=R()*PI2,r=Math.sqrt(R())*b[2],px=b[0]+Math.cos(a)*r,py=b[1]+Math.sin(a)*r,v=R(),lit=Math.max(0,(380-py)/120)+(px<384?.1:0),s=2.5+R()*3;
   x.fillStyle=`rgb(${(34+v*34+lit*50)|0},${(56+v*44+lit*56)|0},${(22+v*18+lit*14)|0})`;x.beginPath();x.ellipse(px,py,s,s*.6,R()*3,0,7);x.fill();}x.restore();
  const t=T(c);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;S.trees=t;}
 return S;}
