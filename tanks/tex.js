// IRONCLAD — procedural textures (no image files): ground, walls, houses, tracks, wheels, camo.
import * as THREE from '../vendor/three.module.min.js';
import {canvas,texFrom,normalFrom,mulberry,noise} from './util.js';
const cache={};
const once=(k,f)=>cache[k]||(cache[k]=f());
// wrap-around blob painter for tileable textures
function blot(x,w,h,cx,cy,r,fill){x.fillStyle=fill;for(const ox of[-w,0,w])for(const oy of[-h,0,h]){x.beginPath();x.arc(cx+ox,cy+oy,r,0,7);x.fill();}}
function grain(x,w,h,n,a,rnd,dark=true){for(let i=0;i<n;i++){x.fillStyle=dark?`rgba(0,0,0,${rnd()*a})`:`rgba(255,255,255,${rnd()*a})`;x.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2);}}

/* ---------------- ground ---------------- */
export function groundTex(theme){return once('g'+theme,()=>{const r=mulberry(11),S=512;
 const tile=(x,y,P,z)=>{const u=x/P,v=y/P;return noise(x,y,z)*(1-u)*(1-v)+noise(x-P,y,z)*u*(1-v)+noise(x,y-P,z)*(1-u)*v+noise(x-P,y-P,z)*u*v;};
 const tn=(u,t,z)=>{let a=0,amp=1,n=0,f=1;for(let o=0;o<4;o++){a+=tile(u*f,t*f,8*f,z+o*3.1)*amp;n+=amp;amp*=.5;f*=2;}return a/n;};
 const hc=canvas(256,256,(x,w,h)=>{const id=x.createImageData(w,h),d=id.data;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){let v;const u=i/w*8,t=j/h*8;
   if(theme==='sand'){v=.5+Math.sin((t*4+tn(u,t,1)*2.6)*3.14159*2)*.07+tn(u,t,3)*.4;}
   else if(theme==='snow'){v=.5+tn(u,t,2)*.5;}
   else{v=.55+tn(u,t,4)*.3;}
   const k=(j*w+i)*4;d[k]=d[k+1]=d[k+2]=Math.max(0,Math.min(255,v*255));d[k+3]=255;}
  x.putImageData(id,0,0);
  if(theme==='concrete'){x.strokeStyle='rgba(0,0,0,.55)';x.lineWidth=3;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(i*w/4,0);x.lineTo(i*w/4,h);x.stroke();x.beginPath();x.moveTo(0,i*h/4);x.lineTo(w,i*h/4);x.stroke();}
   x.lineWidth=1.2;for(let c=0;c<14;c++){let px=r()*w,py=r()*h;x.beginPath();x.moveTo(px,py);for(let s=0;s<8;s++){px+=(r()-.5)*40;py+=(r()-.5)*40;x.lineTo(px,py);}x.stroke();}}
  grain(x,w,h,9000,.15,r);});
 const nrm=normalFrom(hc,theme==='sand'?2:theme==='snow'?1.4:2.2);
 const cc=canvas(S,S,(x,w,h)=>{const pal={sand:['#d9b88a','#c9a573','#e6c99c','#b48f62'],snow:['#f2f6fb','#e3ebf5','#ffffff','#cfdbe8'],concrete:['#8d8f8f','#7b7d7e','#a1a2a0','#6a6b6a']}[theme];
  x.fillStyle=pal[0];x.fillRect(0,0,w,h);for(let i=0;i<120;i++)blot(x,w,h,r()*w,r()*h,8+r()*40,pal[1+(r()*3|0)]+'55');
  x.globalAlpha=.55;x.drawImage(hc,0,0,w,h);x.globalAlpha=1;
  if(theme==='concrete'){for(let i=0;i<40;i++)blot(x,w,h,r()*w,r()*h,6+r()*30,`rgba(30,26,20,${.05+r()*.12})`);for(let i=0;i<6;i++){x.fillStyle='rgba(230,200,60,.75)';x.fillRect(r()*w,r()*h,4,40+r()*60);}}
  if(theme==='sand'){for(let i=0;i<500;i++){x.fillStyle=`rgba(90,60,30,${r()*.4})`;x.beginPath();x.arc(r()*w,r()*h,1+r()*2.5,0,7);x.fill();}}
  if(theme==='snow'){for(let i=0;i<1500;i++){x.fillStyle=`rgba(255,255,255,${r()})`;x.fillRect(r()*w,r()*h,1,1);}}});
 const map=texFrom(cc);return{map,normal:nrm};});}

/* ---------------- building facades (one tile = 4m x 3.2m) ---------------- */
export function facadeTex(kind){return once('f'+kind,()=>{const r=mulberry(kind.length*31),W=256,H=205;
 const c=canvas(W,H,(x,w,h)=>{
  if(kind==='adobe'){x.fillStyle='#d6b58a';x.fillRect(0,0,w,h);for(let i=0;i<80;i++)blot(x,w,h,r()*w,r()*h,4+r()*26,`rgba(${150+r()*60|0},${110+r()*50|0},${70+r()*30|0},.25)`);
   grain(x,w,h,4000,.18,r);x.fillStyle='rgba(60,40,20,.25)';x.fillRect(0,h-14,w,14);
   x.fillStyle='#2a1e14';x.fillRect(96,58,64,70);x.fillStyle='#120c08';x.fillRect(102,64,52,58);x.fillStyle='#7a5a38';x.fillRect(90,126,76,8);x.fillRect(92,52,72,7);
   x.strokeStyle='rgba(80,50,25,.6)';x.lineWidth=1.3;for(let k=0;k<4;k++){let px=r()*w,py=r()*h;x.beginPath();x.moveTo(px,py);for(let s=0;s<6;s++){px+=(r()-.5)*24;py+=r()*18;x.lineTo(px,py);}x.stroke();}
   for(let i=0;i<5;i++){x.fillStyle='rgba(30,20,10,.35)';x.beginPath();x.arc(r()*w,r()*h,2+r()*4,0,7);x.fill();}}
  else if(kind==='wood'){for(let j=0;j<h;j+=12){const v=200+r()*40|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(0,j,w,12);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,j+11,w,1.5);}
   grain(x,w,h,3000,.12,r);x.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<w;i+=64)x.fillRect(i,0,3,h);
   x.fillStyle='#f4f1ea';x.fillRect(90,52,76,82);x.fillStyle='#1a2230';x.fillRect(97,59,62,68);x.fillStyle='#f4f1ea';x.fillRect(126,59,4,68);x.fillRect(97,90,62,4);
   x.fillStyle='rgba(255,210,120,.18)';x.fillRect(97,59,62,68);x.fillStyle='#3b4a5a';x.fillRect(70,52,18,82);x.fillRect(168,52,18,82);
   x.fillStyle='rgba(255,255,255,.9)';x.fillRect(88,130,80,6);}
  else if(kind==='metal'){for(let i=0;i<w;i+=8){x.fillStyle=i%16?'#9aa0a6':'#868c92';x.fillRect(i,0,8,h);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(i+1,0,1.5,h);}
   for(let i=0;i<26;i++){const px=r()*w;const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(120,60,20,.0)');g.addColorStop(.3,`rgba(130,64,24,${.2+r()*.3})`);g.addColorStop(1,'rgba(90,40,10,0)');x.fillStyle=g;x.fillRect(px,r()*h*.4,3+r()*8,h);}
   x.fillStyle='rgba(20,26,30,.85)';x.fillRect(0,14,w,26);x.fillStyle='rgba(140,180,200,.25)';for(let i=0;i<w;i+=32)x.fillRect(i+3,17,26,20);
   x.fillStyle='rgba(0,0,0,.4)';x.fillRect(0,h-10,w,10);grain(x,w,h,3000,.15,r);}
  else if(kind==='stone'){x.fillStyle='#8f8676';x.fillRect(0,0,w,h);let y=0;while(y<h){const bh=22+r()*16;let px=-r()*40;while(px<w){const bw=34+r()*40;const v=120+r()*50|0;x.fillStyle=`rgb(${v+8},${v},${v-12})`;x.fillRect(px+2,y+2,bw-4,bh-4);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(px+2,y+bh-6,bw-4,4);px+=bw;}y+=bh;}grain(x,w,h,5000,.2,r);}
  else if(kind==='brick'){x.fillStyle='#6a5a52';x.fillRect(0,0,w,h);for(let j=0,row=0;j<h;j+=14,row++)for(let i=(row%2)*-16;i<w;i+=32){const v=r();x.fillStyle=`rgb(${140+v*40|0},${62+v*20|0},${46+v*14|0})`;x.fillRect(i+1,j+1,30,12);}grain(x,w,h,3000,.2,r);}
  else if(kind==='concrete'){x.fillStyle='#b9b6ae';x.fillRect(0,0,w,h);grain(x,w,h,6000,.12,r);x.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<6;i++)x.fillRect(0,r()*h,w,1);
   for(let i=0;i<w;i+=40){x.fillStyle='#e8c33a';x.fillRect(i,h-40,20,40);x.fillStyle='#222';x.fillRect(i+20,h-40,20,40);}}
 });return texFrom(c);});}

export function roofTex(kind){return once('r'+kind,()=>{const r=mulberry(7);const c=canvas(128,128,(x,w,h)=>{
 if(kind==='snow'){x.fillStyle='#f3f6fa';x.fillRect(0,0,w,h);for(let i=0;i<400;i++){x.fillStyle=`rgba(180,200,225,${r()*.25})`;x.fillRect(r()*w,r()*h,2+r()*6,1+r()*3);}}
 else if(kind==='tile'){for(let j=0;j<h;j+=10)for(let i=(j/10%2)*8;i<w;i+=16){x.fillStyle=`rgb(${150+r()*30|0},${70+r()*20|0},${50})`;x.fillRect(i,j,15,9);}}
 else{x.fillStyle='#7d8288';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=8){x.fillStyle='rgba(255,255,255,.1)';x.fillRect(i,0,2,h);}grain(x,w,h,1500,.2,r);}});return texFrom(c);});}

/* ---------------- tank parts ---------------- */
export function treadTex(){return once('tread',()=>{const c=canvas(64,64,(x,w,h)=>{x.fillStyle='#2b2a28';x.fillRect(0,0,w,h);
 for(let i=0;i<4;i++){const y=i*16;x.fillStyle='#4a4844';x.fillRect(2,y+2,w-4,12);x.fillStyle='#5d5a54';x.fillRect(6,y+4,w-12,3);x.fillStyle='#1a1918';x.fillRect(0,y+14,w,2);x.fillStyle='#36342f';x.fillRect(w/2-6,y+6,12,6);}
 grain(x,w,h,400,.3,mulberry(3));});const t=texFrom(c);t.repeat.set(1,1);return t;});}
export function wheelTex(){return once('wheel',()=>{const c=canvas(128,128,(x,w,h)=>{x.fillStyle='#2e2d2a';x.fillRect(0,0,w,h);
 x.fillStyle='#55534d';x.beginPath();x.arc(64,64,60,0,7);x.fill();x.fillStyle='#3c3a36';x.beginPath();x.arc(64,64,48,0,7);x.fill();
 x.strokeStyle='#5f5c55';x.lineWidth=9;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;x.beginPath();x.moveTo(64+Math.cos(a)*14,64+Math.sin(a)*14);x.lineTo(64+Math.cos(a)*46,64+Math.sin(a)*46);x.stroke();}
 x.fillStyle='#6b6860';x.beginPath();x.arc(64,64,16,0,7);x.fill();x.fillStyle='#2a2926';for(let i=0;i<8;i++){const a=i/8*Math.PI*2;x.beginPath();x.arc(64+Math.cos(a)*10,64+Math.sin(a)*10,2.4,0,7);x.fill();}
 x.fillStyle='#d8d4c8';x.fillRect(60,6,8,10);});const t=texFrom(c);t.center.set(.5,.5);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;});}
export const PAINTS=[
 {id:'olive',n:'OLIVE',c:['#5b6236','#454b28','#6f7547','#3a3d24']},
 {id:'sand',n:'SAND',c:['#b39466','#8f7246','#cfb284','#6e5634']},
 {id:'arctic',n:'ARCTIC',c:['#d8dde2','#a9b2bb','#eef1f4','#7b8590']},
 {id:'urban',n:'URBAN',c:['#6c7178','#4b4f55','#8c9198','#33363a']},
 {id:'tiger',n:'EMBER',c:['#a8561e','#2a2118','#c87634','#5a2c10']},
 {id:'navy',n:'STEEL',c:['#3c4a5a','#283340','#566678','#1c232c']}];
export function camoTex(pid){return once('camo'+pid,()=>{const P=PAINTS.find(p=>p.id===pid)||PAINTS[0],r=mulberry(pid.length*97+3),S=512;
 const c=canvas(S,S,(x,w,h)=>{x.fillStyle=P.c[0];x.fillRect(0,0,w,h);
  for(let k=1;k<4;k++)for(let i=0;i<(pid==='tiger'?0:14);i++){const cx=r()*w,cy=r()*h;for(let j=0;j<6;j++)blot(x,w,h,cx+(r()-.5)*70,cy+(r()-.5)*50,14+r()*26,P.c[k]);}
  if(pid==='tiger'){x.strokeStyle=P.c[1];x.lineCap='round';for(let i=0;i<26;i++){x.lineWidth=6+r()*10;const y=r()*h;x.beginPath();x.moveTo(-10,y);for(let s=0;s<6;s++)x.lineTo(s*w/5,y+(r()-.5)*40);x.stroke();}}
  for(let i=0;i<30;i++)blot(x,w,h,r()*w,r()*h,10+r()*40,'rgba(40,30,20,.08)');
  grain(x,w,h,18000,.12,r);grain(x,w,h,3000,.1,r,false);
  // panel seams and rivets
  x.strokeStyle='rgba(0,0,0,.28)';x.lineWidth=2;for(let i=0;i<5;i++){x.beginPath();x.moveTo(r()*w,0);x.lineTo(r()*w,h);x.stroke();}
  x.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<180;i++){x.beginPath();x.arc(r()*w,r()*h,1.6,0,7);x.fill();}
  // grime streaks
  for(let i=0;i<40;i++){const g=x.createLinearGradient(0,0,0,80);g.addColorStop(0,'rgba(30,22,14,.25)');g.addColorStop(1,'rgba(30,22,14,0)');x.fillStyle=g;x.save();x.translate(r()*w,r()*h);x.fillRect(0,0,3+r()*5,60+r()*50);x.restore();}});
 return texFrom(c);});}
export function rustTex(){return once('rust',()=>texFrom(canvas(256,256,(x,w,h)=>{const r=mulberry(5);x.fillStyle='#262321';x.fillRect(0,0,w,h);for(let i=0;i<200;i++)blot(x,w,h,r()*w,r()*h,3+r()*16,`rgba(${60+r()*50|0},${30+r()*20|0},${16},.5)`);grain(x,w,h,6000,.4,r);})));}
export function leafTex(){return once('leaf',()=>texFrom(canvas(128,128,(x,w,h)=>{const r=mulberry(9);x.fillStyle='#fff';x.fillRect(0,0,w,h);for(let i=0;i<700;i++){const v=150+r()*105|0;x.fillStyle=`rgb(${v},${v},${v})`;x.beginPath();x.ellipse(r()*w,r()*h,2+r()*4,1+r()*2,r()*3,0,7);x.fill();}})));}
export function rockTex(){return once('rock',()=>{const c=canvas(256,256,(x,w,h)=>{const r=mulberry(13);x.fillStyle='#8a847a';x.fillRect(0,0,w,h);for(let i=0;i<300;i++)blot(x,w,h,r()*w,r()*h,3+r()*22,`rgba(${90+r()*80|0},${86+r()*70|0},${76+r()*60|0},.35)`);
 x.strokeStyle='rgba(30,26,20,.5)';for(let k=0;k<20;k++){let px=r()*w,py=r()*h;x.lineWidth=.5+r()*1.5;x.beginPath();x.moveTo(px,py);for(let s=0;s<5;s++){px+=(r()-.5)*40;py+=(r()-.5)*40;x.lineTo(px,py);}x.stroke();}grain(x,w,h,8000,.2,r);});return{map:texFrom(c),normal:normalFrom(c,2.5)};});}
export function crateTex(kind){return once('crate'+kind,()=>texFrom(canvas(128,128,(x,w,h)=>{const C={repair:'#2fbf5a',dmg:'#ff4d00',speed:'#ffcf3f',armor:'#3d8bff'}[kind];
 x.fillStyle='#2a2c30';x.fillRect(0,0,w,h);x.fillStyle=C;x.fillRect(8,8,w-16,h-16);x.fillStyle='#1b1c1f';x.fillRect(16,16,w-32,h-32);x.fillStyle=C;x.font='bold 64px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';
 x.fillText({repair:'+',dmg:'×2',speed:'»',armor:'◆'}[kind],w/2,h/2+3);x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=2;x.strokeRect(4,4,w-8,h-8);})));}
