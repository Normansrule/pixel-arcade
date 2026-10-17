// EXFIL — procedural textures (albedo + normal maps from height fields) and painted inventory icons.
import * as THREE from '../vendor/three.module.min.js';
import {ITEMS,WPN} from './data.js';

/* ---------- tileable value noise ---------- */
function hash(x,y,s){let h=(x*374761393+y*668265263+s*982451653)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;}
function vnoise(x,y,p,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const m=a=>((a%p)+p)%p;
 const a=hash(m(xi),m(yi),s),b=hash(m(xi+1),m(yi),s),c=hash(m(xi),m(yi+1),s),d=hash(m(xi+1),m(yi+1),s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,p,oct,s){let f=0,a=.5,t=0;for(let o=0;o<oct;o++){f+=vnoise(x*(1<<o),y*(1<<o),p*(1<<o),s+o)*a;t+=a;a*=.5;}return f/t;}

function build(N,fn,opt={}){const cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d');const img=x.createImageData(N,N),d=img.data,H=new Float32Array(N*N);const c=[0,0,0];
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const h=fn(i/N,j/N,c);H[j*N+i]=h;const k=(j*N+i)*4;d[k]=c[0];d[k+1]=c[1];d[k+2]=c[2];d[k+3]=255;}x.putImageData(img,0,0);
 const map=new THREE.CanvasTexture(cv);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
 // normal map from height
 const nc=document.createElement('canvas');nc.width=nc.height=N;const nx=nc.getContext('2d'),ni=nx.createImageData(N,N),nd=ni.data,st=opt.bump??3;
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const l=H[j*N+((i-1+N)%N)],r=H[j*N+((i+1)%N)],u=H[((j-1+N)%N)*N+i],dn=H[((j+1)%N)*N+i];let ax=(l-r)*st,ay=(u-dn)*st,az=1;const L=Math.hypot(ax,ay,az);const k=(j*N+i)*4;nd[k]=(ax/L*.5+.5)*255;nd[k+1]=(ay/L*.5+.5)*255;nd[k+2]=(az/L*.5+.5)*255;nd[k+3]=255;}
 nx.putImageData(ni,0,0);const normalMap=new THREE.CanvasTexture(nc);normalMap.wrapS=normalMap.wrapT=THREE.RepeatWrapping;normalMap.anisotropy=8;return{map,normalMap};}
const mix=(a,b,t)=>a+(b-a)*t,cl=(v,a=0,b=1)=>v<a?a:v>b?b:v,sm=(a,b,v)=>{const t=cl((v-a)/(b-a));return t*t*(3-2*t);};
const set=(c,r,g,b)=>{c[0]=cl(r,0,255);c[1]=cl(g,0,255);c[2]=cl(b,0,255);};

export function makeTextures(){const T={},N=256;
 T.conc=build(N,(u,v,c)=>{const n=fbm(u*8,v*8,8,5,1),st=fbm(u*3,v*3,3,3,2),pit=hash((u*N)|0,(v*N)|0,3)>.985?-.25:0;const line=Math.abs(((v*3)%1)-.5)>.493?-.12:0;let l=150+n*60-sm(.55,.8,st)*40+pit*90+line*80;set(c,l*.98,l*.97,l*.93);return n*.6+pit+line;},{bump:4});
 T.plaster=build(N,(u,v,c)=>{const n=fbm(u*6,v*6,6,5,4),cr=Math.abs(fbm(u*4,v*4,4,4,5)-.5)<.004?-.12:0,dirt=sm(.5,.85,fbm(u*2,v*2,2,3,6))*(1-v*.3);const l=225+n*25-dirt*45+cr*120;set(c,l,l*.985,l*.96);return n*.3+cr;},{bump:3});
 T.brick=build(N,(u,v,c)=>{const rows=8,cols=4;const ry=v*rows,row=Math.floor(ry),off=row%2?.5:0,cx=u*cols+off,col=Math.floor(cx);const fy=ry-row,fx=cx-col;const mort=fy<.09||fx<.04;
  const b=hash(((col%cols)+cols)%cols,row,7),n=fbm(u*16,v*16,16,3,8);if(mort){const l=150+n*30;set(c,l,l*.97,l*.92);return -.4+n*.1;}const r=150+b*50+n*30,g=72+b*20+n*14,bl=52+b*14+n*10;set(c,r,g,bl);return .2+n*.3;},{bump:5});
 T.metal=build(N,(u,v,c)=>{const rib=Math.sin(u*Math.PI*2*12),n=fbm(u*8,v*8,8,4,9),streak=sm(.55,.9,fbm(u*40,v*2,40,3,10))*sm(.2,1,v),rs=sm(.62,.82,fbm(u*5,v*5,5,4,11));
  let l=205+n*30;set(c,mix(l,150,rs)-streak*45,mix(l,95,rs)-streak*55,mix(l,60,rs)-streak*60);return rib*.5*(rib>0?1:.6)+n*.15;},{bump:2.5});
 T.wood=build(N,(u,v,c)=>{const pl=6,py=v*pl,row=Math.floor(py),f=py-row,gap=f<.05;const g=fbm(u*3+row*7.3,v*pl*6,3,4,12+row),gr=Math.sin((u*30+g*6+row)*3)*.5+.5,b=hash(row,1,13);
  if(gap){set(c,40,32,24);return -.5;}const l=150+b*55+gr*25+g*20;set(c,l,l*.78,l*.56);return gr*.25+g*.2;},{bump:4});
 T.floor=build(N,(u,v,c)=>{const t=4,fx=(u*t)%1,fy=(v*t)%1,gr=fx<.03||fy<.03,ch=(Math.floor(u*t)+Math.floor(v*t))%2,n=fbm(u*10,v*10,10,4,14),dirt=sm(.45,.9,fbm(u*3,v*3,3,3,15));
  if(gr){set(c,70,68,64);return -.3;}const l=(ch?190:168)+n*20-dirt*50;set(c,l,l*.98,l*.93);return n*.15;},{bump:3});
 T.asph=build(N,(u,v,c)=>{const n=fbm(u*16,v*16,16,4,16),sp=hash((u*N)|0,(v*N)|0,17),cr=Math.abs(fbm(u*3,v*3,3,5,18)-.5)<.01;const l=68+n*26+(sp>.93?30:sp<.05?-14:0)-(cr?30:0);set(c,l,l,l*1.02);return n*.4+(sp>.93?.3:0)-(cr?.6:0);},{bump:4});
 T.roof=build(N,(u,v,c)=>{const n=fbm(u*12,v*12,12,4,19),seam=((v*6)%1)<.04;const l=62+n*30-(seam?18:0);set(c,l,l*.98,l*.96);return n*.4-(seam?.4:0);},{bump:3});
 T.steel=build(N,(u,v,c)=>{const n=fbm(u*6,v*6,6,4,20),scr=Math.abs(fbm(u*30,v*3,30,2,21)-.5)<.01?20:0,rs=sm(.66,.86,fbm(u*4,v*4,4,4,22));const l=210+n*24+scr;set(c,mix(l,140,rs),mix(l,90,rs),mix(l,60,rs));return n*.15+rs*.2;},{bump:2});
 T.rust=build(N,(u,v,c)=>{const n=fbm(u*8,v*8,8,5,23),m=fbm(u*20,v*20,20,3,24);set(c,110+n*70+m*20,58+n*35,32+n*18);return n*.6+m*.3;},{bump:5});
 T.fabric=build(N,(u,v,c)=>{const w=(Math.sin(u*Math.PI*2*48)*Math.sin(v*Math.PI*2*48))*.5+.5,n=fbm(u*6,v*6,6,3,25);const l=190+w*30+n*30;set(c,l,l,l);return w*.4;},{bump:2});
 T.ground=build(N,(u,v,c)=>{const n=fbm(u*8,v*8,8,5,26),m=fbm(u*32,v*32,32,3,27),st=hash((u*N)|0,(v*N)|0,28)>.97;const l=170+n*60+m*25+(st?25:0);set(c,l,l,l);return n*.5+m*.3+(st?.4:0);},{bump:4});
 T.water=build(N,(u,v,c)=>{const n=fbm(u*6,v*6,6,5,29);set(c,128,128,255);return n;},{bump:6});
 return T;}

// small helper canvas textures: soft round puff, flash star, bullet hole, rain streak
export function makeSprites(){const mk=(N,fn)=>{const cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d');fn(x,N);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return t;};
 return{
  puff:mk(64,(x,N)=>{const g=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,N,N);}),
  flash:mk(128,(x,N)=>{x.translate(N/2,N/2);for(let i=0;i<7;i++){x.rotate(Math.PI*2/7+.3*Math.random());const g=x.createLinearGradient(0,0,N/2,0);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(1,'rgba(255,160,60,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,-5);x.lineTo(N/2*(.6+Math.random()*.4),0);x.lineTo(0,5);x.fill();}
   const g=x.createRadialGradient(0,0,0,0,0,N/4);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,N/4,0,7);x.fill();}),
  hole:mk(64,(x,N)=>{const g=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.22,'rgba(10,10,10,.95)');g.addColorStop(.32,'rgba(60,55,50,.6)');g.addColorStop(1,'rgba(60,55,50,0)');x.fillStyle=g;x.fillRect(0,0,N,N);}),
  glow:mk(64,(x,N)=>{const g=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.2,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,N,N);}),
 };}

/* ================= inventory icons ================= */
const CELL=64,ICON={};
const C={gun:'#3b3f45',gun2:'#23262a',poly:'#2c2f33',wood:'#7a4b2a',tan:'#9c8462',olive:'#55603e',brass:'#c9a24a',cu:'#c07a45',steel:'#9aa1a8',white:'#e8e6df',red:'#c43a2a',green:'#4f9a55',gold:'#e8b840',blue:'#3d7fd6',glass:'#6aa8c8'};
function rr(x,X,Y,W,H,R,f,s){x.beginPath();x.roundRect(X,Y,W,H,R);if(f){x.fillStyle=f;x.fill();}if(s){x.strokeStyle=s;x.lineWidth=2;x.stroke();}}
function circ(x,X,Y,R,f,s,lw=2){x.beginPath();x.arc(X,Y,R,0,7);if(f){x.fillStyle=f;x.fill();}if(s){x.strokeStyle=s;x.lineWidth=lw;x.stroke();}}
function poly(x,pts,f){x.beginPath();x.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)x.lineTo(pts[i],pts[i+1]);x.closePath();x.fillStyle=f;x.fill();}
function shade(x,W,H){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(255,255,255,.16)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.22)');x.globalCompositeOperation='source-atop';x.fillStyle=g;x.fillRect(0,0,W,H);x.globalCompositeOperation='source-over';}
function gunIcon(x,W,H,wid,mods){const cy=H*.42;
 if(wid==='p9'){rr(x,W*.12,cy-12,W*.74,18,3,C.gun);rr(x,W*.1,cy-14,W*.6,8,2,C.gun2);poly(x,[W*.18,cy+4,W*.36,cy+4,W*.3,H*.92,W*.12,H*.9],C.poly);rr(x,W*.36,cy+5,12,9,4,null,C.gun2);}
 else if(wid==='vx9'){rr(x,W*.24,cy-12,W*.5,22,3,C.gun);rr(x,W*.72,cy-6,W*.2,9,2,C.gun2);poly(x,[W*.02,cy-8,W*.24,cy-10,W*.24,cy+8,W*.06,cy+14],C.poly);poly(x,[W*.32,cy+10,W*.42,cy+10,W*.38,H*.8,W*.27,H*.78],C.poly);rr(x,W*.48,cy+10,W*.09,H*.4,2,C.gun2);}
 else if(wid==='ark'){poly(x,[W*.02,cy-6,W*.2,cy-10,W*.22,cy+8,W*.04,cy+20],C.poly);rr(x,W*.2,cy-12,W*.36,24,3,C.gun);rr(x,W*.55,cy-10,W*.24,18,3,C.olive);rr(x,W*.78,cy-3,W*.2,6,2,C.gun2);rr(x,W*.22,cy-18,W*.32,6,1,C.gun2);poly(x,[W*.27,cy+12,W*.33,cy+12,W*.31,H*.86,W*.24,H*.84],C.poly);poly(x,[W*.4,cy+12,W*.48,cy+12,W*.5,H*.9,W*.42,H*.92],C.gun2);}
 else if(wid==='hrn'){poly(x,[W*.01,cy-8,W*.22,cy-10,W*.24,cy+10,W*.02,cy+22],C.wood);rr(x,W*.22,cy-11,W*.34,22,3,C.gun);rr(x,W*.55,cy-9,W*.24,17,3,C.wood);rr(x,W*.78,cy-3,W*.21,6,2,C.gun2);poly(x,[W*.26,cy+10,W*.31,cy+10,W*.29,H*.84,W*.22,H*.82],C.wood);rr(x,W*.38,cy+10,W*.07,H*.28,2,C.gun2);}
 else if(wid==='stk'){poly(x,[W*.02,cy-6,W*.2,cy-8,W*.22,cy+8,W*.03,cy+16],C.wood);rr(x,W*.2,cy-9,W*.22,18,3,C.gun);rr(x,W*.42,cy-7,W*.55,7,2,C.gun2);rr(x,W*.42,cy+1,W*.45,7,2,C.gun2);rr(x,W*.5,cy-1,W*.18,13,4,C.wood);}
 if(mods){const o=mods.optic&&mods.optic.id,m=mods.muzzle&&mods.muzzle.id,g=mods.grip&&mods.grip.id,mg=mods.mag&&mods.mag.id;
  if(o==='dot'){rr(x,W*.36,cy-24,18,12,3,C.gun2);circ(x,W*.36+9,cy-18,3,'#ff3a2a');}
  if(o==='x4'){rr(x,W*.3,cy-26,W*.26,11,5,C.gun2);rr(x,W*.28,cy-28,8,15,3,C.gun2);rr(x,W*.54,cy-28,8,15,3,C.gun2);}
  if(m&&m.startsWith('sup')){rr(x,W*.86,cy-7,W*.13,14,3,'#4a4e54');}else if(m==='comp'){rr(x,W*.9,cy-5,W*.08,10,2,'#55595f');}
  if(g==='grip'){rr(x,W*.6,cy+8,8,16,2,C.gun2);}
  if(mg==='ark60'||mg==='vx50'){rr(x,W*.4,cy+10,W*.12,H*.42,4,C.gun2);}}
 shade(x,W,H);}
function draw(x,W,H,d,it){const id=d.id,c=d.c;x.lineCap='round';x.lineJoin='round';
 if(c==='weapon'){gunIcon(x,W,H,d.wid,it&&it.mods);return;}
 if(c==='ammo'){const tip=id.endsWith('ap')?'#222':id==='12s'?'#4a7a3a':id==='12b'?C.red:C.cu,shell=id.startsWith('12');for(let k=0;k<3;k++){const X=14+k*13,Y=12+(k%2)*4;if(shell){rr(x,X,Y,11,36,2,tip);rr(x,X,Y+28,11,10,1,C.brass);}else{rr(x,X,Y+10,10,30,1,C.brass);x.beginPath();x.moveTo(X,Y+11);x.quadraticCurveTo(X+5,Y-4,X+10,Y+11);x.fillStyle=tip;x.fill();}}shade(x,W,H);return;}
 if(c==='armor'){const col=['#6a6e5a','#4e5640','#3a3d36','#2a2c2e','#1c1d20'][d.cls-2];poly(x,[W*.22,H*.1,W*.38,H*.1,W*.42,H*.22,W*.58,H*.22,W*.62,H*.1,W*.78,H*.1,W*.86,H*.4,W*.84,H*.9,W*.16,H*.9,W*.14,H*.4],col);for(let k=0;k<3;k++)rr(x,W*(.24+k*.18),H*.56,W*.15,H*.22,4,'rgba(0,0,0,.25)');rr(x,W*.3,H*.3,W*.4,H*.18,4,'rgba(255,255,255,.08)');shade(x,W,H);return;}
 if(c==='helmet'){const col=['#5c6248','#4a5038','#2e3236','#1e2024'][d.cls-2];x.beginPath();x.ellipse(W/2,H*.62,W*.4,H*.42,0,Math.PI,0);x.closePath();x.fillStyle=col;x.fill();rr(x,W*.08,H*.6,W*.84,H*.08,3,'rgba(0,0,0,.35)');if(d.cls>=5)rr(x,W*.18,H*.62,W*.64,H*.22,6,'rgba(40,60,70,.85)');shade(x,W,H);return;}
 if(c==='bag'){const col=['#4f5a40','#5a4a36','#3e4a52','#2e3330'][d.r];rr(x,W*.16,H*.14,W*.68,H*.78,14,col);rr(x,W*.24,H*.5,W*.52,H*.34,8,'rgba(0,0,0,.2)');rr(x,W*.36,H*.04,W*.28,H*.14,6,null,'#222');shade(x,W,H);return;}
 if(c==='mod'){const s=d.slot;if(s==='optic'){if(id==='x4'){rr(x,W*.08,H*.3,W*.84,H*.36,10,C.gun2);rr(x,W*.04,H*.24,W*.18,H*.5,6,C.gun2);rr(x,W*.78,H*.24,W*.18,H*.5,6,C.gun2);circ(x,W*.13,H*.49,6,C.glass);}else{rr(x,W*.18,H*.3,W*.64,H*.4,6,C.gun2);circ(x,W/2,H/2,9,C.glass);circ(x,W/2,H/2,2.5,'#ff3a2a');}}
  else if(s==='muzzle'){if(d.sup)rr(x,W*.06,H*.32,W*.88,H*.36,8,'#45494f');else{rr(x,W*.2,H*.34,W*.6,H*.32,4,'#55595f');for(let k=0;k<3;k++)rr(x,W*(.3+k*.15),H*.38,5,H*.24,2,'#222');}}
  else if(s==='grip'){rr(x,W*.38,H*.14,W*.24,H*.72,5,C.gun2);rr(x,W*.24,H*.1,W*.52,H*.12,3,C.gun);}
  else if(s==='mag'){if(id==='vx50'){circ(x,W*.5,H*.5,H*.36,C.gun2);circ(x,W*.5,H*.5,H*.12,C.gun);}else{x.save();x.translate(W/2,H*.12);x.rotate(.18);rr(x,-W*.16,0,W*.32,H*.78,4,C.gun2);x.restore();}}shade(x,W,H);return;}
 if(c==='med'){if(id==='band'){circ(x,W/2,H/2,20,C.white);circ(x,W/2,H/2,7,'#cfcbbd');}else if(id==='kit'||id==='trauma'){rr(x,W*.12,H*.2,W*.76,H*.62,8,id==='kit'?'#5a6248':'#6e2e2a');rr(x,W/2-4,H*.32,8,H*.38,1,C.white);rr(x,W/2-H*.19,H*.47,H*.38,8,1,C.white);}
  else if(id==='splint'){rr(x,W*.2,H*.12,W*.18,H*.76,3,'#b09060');rr(x,W*.6,H*.12,W*.18,H*.76,3,'#b09060');rr(x,W*.14,H*.4,W*.72,8,2,C.white);}
  else if(id==='pills'){rr(x,W*.3,H*.22,W*.4,H*.62,6,'#d8a82e');rr(x,W*.27,H*.12,W*.46,H*.14,3,C.white);}
  else if(id==='stim'){x.save();x.translate(W/2,H/2);x.rotate(-.7);rr(x,-W*.4,-6,W*.6,12,3,'#c8e0e8');rr(x,-W*.4,-4,W*.4,8,2,'#ffb030');rr(x,W*.2,-2,W*.2,4,1,C.steel);x.restore();}
  else if(id==='surg'){rr(x,W*.08,H*.2,W*.84,H*.62,6,'#2e5a8a');rr(x,W*.4,H*.35,W*.2,H*.3,2,C.white);}shade(x,W,H);return;}
 if(c==='key'){const col={pharm:'#5fe08a',harbor:'#4aa3ff',cage:'#ff8a3d',dir:'#ffc53d'}[d.door];circ(x,W*.32,H*.42,13,null,C.steel,6);rr(x,W*.44,H*.38,W*.44,8,2,C.steel);rr(x,W*.72,H*.46,6,10,1,C.steel);rr(x,W*.82,H*.46,6,8,1,C.steel);rr(x,W*.12,H*.68,W*.32,H*.2,3,col);return;}
 if(c==='card'){rr(x,W*.12,H*.22,W*.76,H*.56,6,'#2a6fd6');rr(x,W*.18,H*.32,W*.22,H*.16,2,C.gold);rr(x,W*.18,H*.6,W*.6,4,1,'rgba(255,255,255,.6)');shade(x,W,H);return;}
 if(c==='flare'){rr(x,W*.38,H*.08,W*.24,H*.84,5,'#c43a2a');rr(x,W*.36,H*.06,W*.28,H*.16,4,'#3fcf6a');rr(x,W*.38,H*.5,W*.24,4,1,'rgba(255,255,255,.5)');shade(x,W,H);return;}
 if(c==='cash'){for(let k=0;k<3;k++){rr(x,W*.12+k*3,H*.28-k*5,W*.68,H*.42,3,k===2?'#7fae6a':'#5f8e4a');}circ(x,W*.5,H*.36,7,'rgba(255,255,255,.3)');return;}
 if(c==='quest'){if(id==='manifest'){rr(x,W*.2,H*.1,W*.6,H*.8,3,'#e8e2cc');rr(x,W*.38,H*.06,W*.24,H*.1,2,'#555');for(let k=0;k<5;k++)rr(x,W*.28,H*(.26+k*.12),W*.44,3,1,'#777');}else{rr(x,W*.18,H*.12,W*.64,H*.76,4,'#6a2a22');rr(x,W*.24,H*.12,4,H*.76,1,'#3a1612');rr(x,W*.36,H*.3,W*.36,H*.12,2,C.gold);}shade(x,W,H);return;}
 // loot / valuables
 const L={bolts:()=>{rr(x,W*.16,H*.3,W*.68,H*.5,4,'#6a6e74');for(let k=0;k<4;k++)circ(x,W*(.28+k*.15),H*.24,5,C.steel);},tape:()=>{circ(x,W/2,H/2,20,'#9aa0a6');circ(x,W/2,H/2,9,'#2b2e33');},wire:()=>{circ(x,W/2,H/2,20,C.cu);for(let k=0;k<4;k++)circ(x,W/2,H/2,18-k*3,null,'#8a4a20',1);circ(x,W/2,H/2,6,'#333');},
  battery:()=>{rr(x,W*.3,H*.16,W*.4,H*.72,5,'#2e7a4a');rr(x,W*.42,H*.08,W*.16,H*.1,2,C.steel);rr(x,W*.3,H*.4,W*.4,6,1,'#d8d040');},lighter:()=>{rr(x,W*.32,H*.24,W*.36,H*.6,5,C.brass);rr(x,W*.32,H*.14,W*.36,H*.14,3,'#a88430');},lens:()=>{circ(x,W/2,H/2,19,C.gun2);circ(x,W/2,H/2,13,C.glass);circ(x,W*.44,H*.44,4,'rgba(255,255,255,.6)');},
  hdd:()=>{rr(x,W*.14,H*.18,W*.72,H*.64,4,'#7a8088');circ(x,W*.44,H*.48,13,'#b8bec6');circ(x,W*.44,H*.48,3,'#333');},board:()=>{rr(x,W*.1,H*.18,W*.8,H*.64,3,'#2f7a3a');for(let k=0;k<4;k++)rr(x,W*(.18+k*.17),H*.3,8,8,1,'#222');rr(x,W*.2,H*.62,W*.6,3,1,C.gold);},
  coin:()=>{circ(x,W/2,H/2,18,'#c8ccd0');circ(x,W/2,H/2,13,null,'#8a8e94',2);},toolset:()=>{rr(x,W*.06,H*.24,W*.88,H*.6,5,'#b03a2a');rr(x,W*.36,H*.12,W*.28,H*.16,4,null,'#222');rr(x,W*.06,H*.46,W*.88,4,1,'#5a1a12');},
  fuel:()=>{rr(x,W*.14,H*.16,W*.72,H*.76,8,'#b8402a');rr(x,W*.2,H*.06,W*.24,H*.14,3,'#333');poly(x,[W*.3,H*.38,W*.7,H*.62,W*.7,H*.38,W*.3,H*.62],'rgba(0,0,0,.25)');},radio:()=>{rr(x,W*.18,H*.18,W*.64,H*.76,6,'#4a5236');rr(x,W*.6,H*.02,4,H*.2,1,'#222');rr(x,W*.28,H*.3,W*.44,H*.18,2,'#9ac08a');for(let k=0;k<3;k++)circ(x,W*(.32+k*.18),H*.66,4,'#222');},
  brandy:()=>{rr(x,W*.26,H*.32,W*.48,H*.62,10,'#7a3a12');rr(x,W*.4,H*.06,W*.2,H*.3,3,'#5a2a0a');rr(x,W*.3,H*.5,W*.4,H*.18,2,'#e8d8a8');},chain:()=>{for(let k=0;k<7;k++){const a=k/7*Math.PI*2;circ(x,W/2+Math.cos(a)*15,H/2+Math.sin(a)*15,5,null,C.gold,3);}},
  watch:()=>{rr(x,W*.38,H*.04,W*.24,H*.92,4,'#b8902a');circ(x,W/2,H/2,15,C.gold);circ(x,W/2,H/2,11,'#f4ecd8');x.strokeStyle='#333';x.lineWidth=2;x.beginPath();x.moveTo(W/2,H/2);x.lineTo(W/2,H/2-8);x.moveTo(W/2,H/2);x.lineTo(W/2+6,H/2);x.stroke();},
  docs:()=>{rr(x,W*.14,H*.18,W*.72,H*.64,3,'#c8b890');circ(x,W/2,H*.6,8,'#a02a1a');},owl:()=>{x.beginPath();x.ellipse(W/2,H*.58,W*.28,H*.36,0,0,7);x.fillStyle=C.brass;x.fill();circ(x,W*.4,H*.4,8,'#e8d080');circ(x,W*.6,H*.4,8,'#e8d080');circ(x,W*.4,H*.4,3,'#333');circ(x,W*.6,H*.4,3,'#333');poly(x,[W*.3,H*.22,W*.36,H*.1,W*.42,H*.24],C.brass);poly(x,[W*.7,H*.22,W*.64,H*.1,W*.58,H*.24],C.brass);},
  gpu:()=>{rr(x,W*.04,H*.18,W*.92,H*.58,4,'#2a2d32');circ(x,W*.3,H*.47,13,'#16181b');circ(x,W*.7,H*.47,13,'#16181b');circ(x,W*.3,H*.47,4,'#555');circ(x,W*.7,H*.47,4,'#555');rr(x,W*.1,H*.76,W*.6,6,1,C.gold);rr(x,W*.04,H*.18,W*.92,4,1,'#ff4d00');},
  gem:()=>{poly(x,[W*.5,H*.12,W*.82,H*.4,W*.5,H*.9,W*.18,H*.4],'#2a5ad8');poly(x,[W*.5,H*.12,W*.62,H*.4,W*.5,H*.9,W*.38,H*.4],'#5a8cff');poly(x,[W*.18,H*.4,W*.82,H*.4,W*.5,H*.12],'rgba(255,255,255,.25)');}};
 (L[id]||(()=>rr(x,W*.2,H*.2,W*.6,H*.6,6,'#777')))();shade(x,W,H);}
export function iconFor(it,rot){const d=ITEMS[it.id];const key=it.id+(it.mods?Object.values(it.mods).map(m=>m?m.id:'').join(','):'')+(rot?'r':'');if(ICON[key])return ICON[key];
 const W=d.w*CELL,H=d.h*CELL,cv=document.createElement('canvas');cv.width=rot?H:W;cv.height=rot?W:H;const x=cv.getContext('2d');if(rot){x.translate(H,0);x.rotate(Math.PI/2);}draw(x,W,H,d,it);return ICON[key]=cv.toDataURL();}
