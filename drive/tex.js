// NIGHT DRIVE — procedural textures: facades (albedo + lit-window emissive), asphalt (+ puddle roughness), sidewalk, grass, neon sign atlas, misc.
import * as THREE from '../vendor/three.module.min.js';
import {rng} from './city.js';
const R=rng(99);
function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=o.aniso??8;return t;}
function grain(x,w,h,a,n,s=2){for(let i=0;i<n;i++){const v=(R()-.5)*a;x.fillStyle=v>0?`rgba(255,255,255,${v})`:`rgba(0,0,0,${-v})`;x.fillRect(R()*w,R()*h,s,s);}}
const LIT=['#ffd9a0','#ffe8c0','#fff2dc','#bfe0ff','#ffc890','#ffb0d8','#a0ffe8'];
// facade: a 16 m x 16 m tile = 4 floors x cols windows
function facade(kind){const cols=kind==='glass'?8:kind==='brick'?5:kind==='ind'?4:6;const W=512,H=512,fh=H/4,cw=W/cols;const win=[];
 const base=ctex(W,H,(x)=>{
  if(kind==='glass'){const g=x.createLinearGradient(0,0,W,H);g.addColorStop(0,'#2a3a52');g.addColorStop(1,'#1a2436');x.fillStyle=g;x.fillRect(0,0,W,H);for(let r=0;r<4;r++)for(let c=0;c<cols;c++){x.fillStyle=`rgba(${60+R()*40},${80+R()*40},${110+R()*40},${.25+R()*.2})`;x.fillRect(c*cw+3,r*fh+4,cw-6,fh-10);}
   x.fillStyle='#4a5468';for(let c=0;c<=cols;c++)x.fillRect(c*cw-2,0,4,H);for(let r=0;r<=4;r++)x.fillRect(0,r*fh-3,W,6);}
  else if(kind==='office'){x.fillStyle='#8a8478';x.fillRect(0,0,W,H);grain(x,W,H,.14,9000);for(let r=0;r<4;r++){x.fillStyle='#5a564e';x.fillRect(0,r*fh+fh*.78,W,fh*.22);for(let c=0;c<cols;c++){x.fillStyle='#1a1c22';x.fillRect(c*cw+8,r*fh+14,cw-16,fh*.55);x.fillStyle='rgba(255,255,255,.08)';x.fillRect(c*cw+8,r*fh+14,cw-16,4);}}}
  else if(kind==='brick'){x.fillStyle='#6a2e24';x.fillRect(0,0,W,H);for(let y=0;y<H;y+=8)for(let xx=(y/8)%2*10;xx<W;xx+=20){x.fillStyle=`hsl(${8+R()*10},${40+R()*15}%,${22+R()*12}%)`;x.fillRect(xx,y,18,6);}
   for(let r=0;r<4;r++)for(let c=0;c<cols;c++){x.fillStyle='#e0d6c4';x.fillRect(c*cw+18,r*fh+18,cw-36,fh*.62+4);x.fillStyle='#16181e';x.fillRect(c*cw+22,r*fh+22,cw-44,fh*.62-4);x.beginPath();x.arc(c*cw+cw/2,r*fh+24,(cw-44)/2,Math.PI,0);x.fill();}}
  else if(kind==='ind'){x.fillStyle='#5a6266';x.fillRect(0,0,W,H);for(let i=0;i<W;i+=8){x.fillStyle=i%16?'rgba(0,0,0,.18)':'rgba(255,255,255,.08)';x.fillRect(i,0,4,H);}grain(x,W,H,.18,8000);x.fillStyle='rgba(120,60,30,.25)';for(let i=0;i<30;i++)x.fillRect(R()*W,R()*H,3,20+R()*60);
   for(let c=0;c<cols;c++){x.fillStyle='#1a1e22';x.fillRect(c*cw+20,fh*.3,cw-40,fh*.35);}}
  else if(kind==='house'){x.fillStyle='#d8d0c0';x.fillRect(0,0,W,H);for(let y=0;y<H;y+=12){x.fillStyle='rgba(0,0,0,.12)';x.fillRect(0,y,W,2);}for(let r=0;r<4;r++)for(let c=0;c<cols;c++){x.fillStyle='#ffffff';x.fillRect(c*cw+16,r*fh+22,cw-32,fh*.5+6);x.fillStyle='#22262e';x.fillRect(c*cw+20,r*fh+26,cw-40,fh*.5-2);}}
 });
 const em=ctex(W,H,(x)=>{x.fillStyle='#000';x.fillRect(0,0,W,H);const p=kind==='glass'?.42:kind==='office'?.38:kind==='brick'?.34:kind==='house'?.35:.18;
  for(let r=0;r<4;r++)for(let c=0;c<cols;c++){if(R()>p)continue;const col=LIT[(R()*LIT.length)|0];const lvl=.55+R()*.45;x.fillStyle=col;x.globalAlpha=lvl;
   if(kind==='glass'){x.fillRect(c*cw+3,r*fh+4,cw-6,fh-10);x.globalAlpha=lvl*.4;x.fillStyle='#000';x.fillRect(c*cw+3+R()*(cw-10),r*fh+4,4,fh-10);}
   else if(kind==='office')x.fillRect(c*cw+8,r*fh+14,cw-16,fh*.55);else if(kind==='brick'){x.fillRect(c*cw+22,r*fh+22,cw-44,fh*.62-4);}else if(kind==='house')x.fillRect(c*cw+20,r*fh+26,cw-40,fh*.5-2);else x.fillRect(c*cw+20,fh*.3,cw-40,fh*.35);x.globalAlpha=1;}});
 return{map:base,em};}

export function makeTextures(){const T={};
 for(const k of['glass','office','brick','ind','house'])T[k]=facade(k);
 T.roof=ctex(256,256,(x,w,h)=>{x.fillStyle='#3a3a3e';x.fillRect(0,0,w,h);grain(x,w,h,.2,6000);x.strokeStyle='rgba(0,0,0,.4)';for(let i=0;i<w;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}});
 // asphalt: dark, grainy, with cracks and patches; roughness map has puddles
 T.asphalt=ctex(512,512,(x,w,h)=>{x.fillStyle='#24252a';x.fillRect(0,0,w,h);for(let i=0;i<26000;i++){const v=R()*40|0;x.fillStyle=`rgba(${v+34},${v+34},${v+40},.55)`;x.fillRect(R()*w,R()*h,1.5,1.5);}
  for(let i=0;i<10;i++){x.fillStyle=`rgba(${R()<.5?0:60},${R()<.5?0:60},${R()<.5?0:66},.12)`;x.fillRect(R()*w,R()*h,40+R()*120,20+R()*80);}x.strokeStyle='rgba(0,0,0,.45)';for(let i=0;i<14;i++){x.lineWidth=1+R();x.beginPath();let a=R()*w,b=R()*h;x.moveTo(a,b);for(let k=0;k<5;k++){a+=(R()-.5)*60;b+=(R()-.5)*60;x.lineTo(a,b);}x.stroke();}});
 T.asphaltR=ctex(512,512,(x,w,h)=>{x.fillStyle='#f0f0f0';x.fillRect(0,0,w,h);for(let i=0;i<22;i++){const g=x.createRadialGradient(0,0,0,0,0,1);const px=R()*w,py=R()*h,rr=20+R()*70;x.save();x.translate(px,py);x.scale(rr*(1+R()),rr);g.addColorStop(0,'rgba(120,120,120,1)');g.addColorStop(.7,'rgba(150,150,150,.8)');g.addColorStop(1,'rgba(216,216,216,0)');x.fillStyle=g;x.fillRect(-1,-1,2,2);x.restore();}grain(x,w,h,.2,8000);},{srgb:false});
 T.walk=ctex(256,256,(x,w,h)=>{x.fillStyle='#7a7876';x.fillRect(0,0,w,h);grain(x,w,h,.16,5000);x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;for(let i=0;i<=w;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}});
 T.grass=ctex(256,256,(x,w,h)=>{x.fillStyle='#1e3a1e';x.fillRect(0,0,w,h);for(let i=0;i<5000;i++){x.fillStyle=`rgba(${40+R()*50},${80+R()*70},${30+R()*30},.45)`;x.fillRect(R()*w,R()*h,1,2+R()*3);}});
 T.dirt=ctex(256,256,(x,w,h)=>{x.fillStyle='#3a342c';x.fillRect(0,0,w,h);grain(x,w,h,.25,7000);});
 T.planks=ctex(256,256,(x,w,h)=>{x.fillStyle='#4a3a2a';x.fillRect(0,0,w,h);for(let y=0;y<h;y+=32){x.fillStyle=`hsl(28,${25+R()*10}%,${18+R()*8}%)`;x.fillRect(0,y+1,w,30);}grain(x,w,h,.2,4000);});
 T.chevron=ctex(256,128,(x,w,h)=>{x.fillStyle='#111';x.fillRect(0,0,w,h);x.fillStyle='#ff6a00';for(let i=-1;i<5;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64+32,h/2);x.lineTo(i*64,h);x.lineTo(i*64+24,h);x.lineTo(i*64+56,h/2);x.lineTo(i*64+24,0);x.fill();}});
 T.concrete=ctex(256,256,(x,w,h)=>{x.fillStyle='#6a6a6e';x.fillRect(0,0,w,h);grain(x,w,h,.2,7000);x.fillStyle='rgba(0,0,0,.2)';for(let i=0;i<h;i+=64)x.fillRect(0,i,w,3);});
 T.rock=ctex(256,256,(x,w,h)=>{x.fillStyle='#2e3a2a';x.fillRect(0,0,w,h);for(let i=0;i<4000;i++){x.fillStyle=`rgba(${50+R()*60},${70+R()*60},${40+R()*30},.5)`;x.fillRect(R()*w,R()*h,2,2);}for(let i=0;i<30;i++){x.fillStyle=`rgba(90,88,80,${.3+R()*.3})`;x.beginPath();x.arc(R()*w,R()*h,3+R()*10,0,7);x.fill();}});
 // neon sign atlas: 4 x 8 cells of 256 x 128
 const WORDS=[['NOODLE 24','#ff3fa0'],['ARCADE','#30e0ff'],['HOTEL','#ff4040'],['KARAOKE','#ffd040'],['BURGERS','#ff8020'],['LUCKY 7','#40ff80'],['CLUB VOLT','#a050ff'],['PIZZA','#ff5030'],['BAR','#30a0ff'],['OPEN','#ff2a6a'],['TACOS','#ffb020'],['RAMEN','#ff3fa0'],['DINER','#40e0ff'],['MOTEL','#ff4060'],['GARAGE','#ffd040'],['CAFE','#ff80c0'],['24/7','#50ff90'],['DISCO','#c070ff'],['SUSHI','#40ffd0'],['VIDEO','#ff6020'],['BOWL','#30c0ff'],['JAZZ','#ffb040'],['DOJO','#ff3030'],['PAWN','#80ff40'],['TATTOO','#ff40c0'],['CINEMA','#ffe060'],['LAUNDRY','#60d0ff'],['NEON','#ff4dff'],['BOOKS','#ffa040'],['GYM','#40ff60'],['FISH','#40c0ff'],['BEER','#ffc020']];
 T.signs=ctex(1024,1024,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);WORDS.forEach(([word,col],k)=>{const cx=(k%4)*256+128,cy=((k/4)|0)*128+64;x.save();x.font=`bold ${word.length>7?34:44}px "Arial Black",Impact,sans-serif`;x.textAlign='center';x.textBaseline='middle';
   x.strokeStyle=col;x.lineWidth=4;x.shadowColor=col;x.shadowBlur=18;x.strokeRect(cx-118,cy-56,236,112);x.shadowBlur=22;x.fillStyle=col;x.fillText(word,cx,cy+2);x.shadowBlur=0;x.fillStyle='rgba(255,255,255,.85)';x.font=`bold ${word.length>7?30:40}px "Arial Black",Impact,sans-serif`;x.fillText(word,cx,cy+2);x.restore();});},{aniso:4});
 T.signCount=WORDS.length;T.signCols=WORDS.map(w=>w[1]);
 T.shop=ctex(512,128,(x,w,h)=>{x.fillStyle='#0a0a0c';x.fillRect(0,0,w,h);x.font='bold 54px "Arial Black",Impact,sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#ff8a20';x.shadowBlur=20;x.fillStyle='#ffb050';x.fillText('PATCH & PAINT',w/2,h/2);});
 T.puff=ctex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,2,32,32,31);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
 T.streak=ctex(64,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.25,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);const g2=x.createLinearGradient(0,0,w,0);g2.addColorStop(0,'rgba(0,0,0,1)');g2.addColorStop(.5,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=g2;x.fillRect(0,0,w,h);},{srgb:false});
 T.ring=ctex(128,128,(x,w,h)=>{x.strokeStyle='#fff';x.lineWidth=8;x.beginPath();x.arc(64,64,54,0,7);x.stroke();x.lineWidth=3;x.beginPath();x.arc(64,64,40,0,7);x.stroke();});
 T.arrow=ctex(64,128,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.fillStyle='#fff';for(let k=0;k<2;k++){const y=k*64+10;x.beginPath();x.moveTo(8,y+30);x.lineTo(32,y+6);x.lineTo(56,y+30);x.lineTo(48,y+38);x.lineTo(32,y+22);x.lineTo(16,y+38);x.fill();}},{srgb:false});
 return T;}
