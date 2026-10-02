// SKATE CITY — procedural urban textures (canvas): concrete, skatelite, plywood, brick, asphalt, pavers, tiles,
// diamond plate, gravel roofs, facades with lit windows, graffiti, chain-link. Everything is generated, no image files.
import * as THREE from '../vendor/three.module.min.js';
const rnd=(a=1)=>Math.random()*a,ri=n=>Math.random()*n|0,pick=a=>a[ri(a.length)];
// seeded random so levels look the same every visit
let seed=1;export function srand(s){seed=s>>>0||1;}
function sr(){seed^=seed<<13;seed>>>=0;seed^=seed>>17;seed^=seed<<5;seed>>>=0;return seed/4294967296;}
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);
 t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.userData.canvas=c;return t;}
function noise(x,w,h,n,a,sz=2,col='0,0,0'){const d=x.getImageData(0,0,w,h),D=d.data;const[r,g,b]=col.split(',').map(Number);const s=Math.max(1,Math.round(sz));
 for(let i=0;i<n;i++){const al=Math.random()*a,px=Math.random()*w|0,py=Math.random()*h|0;for(let yy=0;yy<s;yy++)for(let xx=0;xx<s;xx++){const k=(((py+yy)%h)*w+(px+xx)%w)*4;if(D[k+3]===0)continue;D[k]+=(r-D[k])*al;D[k+1]+=(g-D[k+1])*al;D[k+2]+=(b-D[k+2])*al;}}x.putImageData(d,0,0);}
function blotch(x,w,h,n,r,col,a){for(let i=0;i<n;i++){const cx=rnd(w),cy=rnd(h),rr=r*(.4+rnd());const g=x.createRadialGradient(cx,cy,0,cx,cy,rr);g.addColorStop(0,`rgba(${col},${a*rnd()})`);g.addColorStop(1,`rgba(${col},0)`);x.fillStyle=g;
 for(const ox of[-w,0,w])for(const oy of[-h,0,h]){x.save();x.translate(ox,oy);x.fillRect(cx-rr,cy-rr,rr*2,rr*2);x.restore();}}}
function scuffs(x,w,h,n,col,a){x.lineCap='round';for(let i=0;i<n;i++){x.strokeStyle=`rgba(${col},${rnd(a)})`;x.lineWidth=1+rnd(3);x.beginPath();const cx=rnd(w),cy=rnd(h),r=40+rnd(200),a0=rnd(6.28);x.arc(cx,cy,r,a0,a0+.2+rnd(.8));x.stroke();}}
function cracks(x,w,h,n,a){x.lineWidth=1.2;for(let i=0;i<n;i++){x.strokeStyle=`rgba(20,18,16,${a*(.5+rnd(.5))})`;x.beginPath();let px=rnd(w),py=rnd(h);x.moveTo(px,py);let ang=rnd(6.28);for(let k=0;k<14;k++){ang+=rnd(1)-.5;px+=Math.cos(ang)*9;py+=Math.sin(ang)*9;x.lineTo(px,py);}x.stroke();}}

export function makeTextures(){const T={};
 T.floor=ctex(1024,1024,(x,w,h)=>{x.fillStyle='#86837d';x.fillRect(0,0,w,h);blotch(x,w,h,60,160,'60,56,50',.18);blotch(x,w,h,40,120,'200,196,186',.12);noise(x,w,h,26000,.09);noise(x,w,h,9000,.06,2,'255,255,255');
  scuffs(x,w,h,90,'25,22,20',.25);cracks(x,w,h,3,.5);x.fillStyle='rgba(40,38,36,.55)';x.fillRect(0,0,w,3);x.fillRect(0,0,3,h);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(0,4,w,1);x.fillRect(4,0,1,h);});
 T.conc=ctex(512,512,(x,w,h)=>{x.fillStyle='#b4b0a8';x.fillRect(0,0,w,h);blotch(x,w,h,30,90,'90,86,78',.2);noise(x,w,h,14000,.1);noise(x,w,h,3000,.08,2,'255,255,255');for(let i=0;i<220;i++){x.fillStyle=`rgba(0,0,0,${rnd(.18)})`;x.beginPath();x.arc(rnd(w),rnd(h),1+rnd(2),0,7);x.fill();}scuffs(x,w,h,8,'30,28,26',.12);});
 T.ramp=ctex(512,512,(x,w,h)=>{x.fillStyle='#5e544a';x.fillRect(0,0,w,h);blotch(x,w,h,26,120,'120,104,90',.16);noise(x,w,h,9000,.07);noise(x,w,h,2500,.05,2,'255,240,220');
  x.lineCap='round';for(let i=0;i<110;i++){x.strokeStyle=`rgba(${rnd()<.5?'15,12,10':'170,150,130'},${rnd(.22)})`;x.lineWidth=1+rnd(2);x.beginPath();const yy=rnd(h);x.moveTo(rnd(w),yy);x.bezierCurveTo(rnd(w),yy+rnd(80)-40,rnd(w),yy+rnd(80)-40,rnd(w),yy+rnd(60)-30);x.stroke();}
  x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,0,w,2);x.fillRect(0,0,2,h);for(let i=0;i<w;i+=64){x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.arc(i+32,6,2.2,0,7);x.fill();}});
 T.ply=ctex(512,512,(x,w,h)=>{x.fillStyle='#30343c';x.fillRect(0,0,w,h);noise(x,w,h,9000,.1);noise(x,w,h,3000,.06,2,'255,255,255');x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,0,w,3);x.fillRect(0,0,3,h);x.fillRect(0,h/2,w,2);
  for(let i=0;i<14;i++){x.fillStyle='rgba(0,0,0,.4)';x.beginPath();x.arc(8+(i%7)*72,8+(i>6?h/2:0),2.2,0,7);x.fill();}
  const cols=['#ff4d00','#3dd6ff','#ffd23f','#ff3fa4','#7cff5b','#f2f2f2'];x.lineCap='round';x.lineJoin='round';
  for(let k=0;k<7;k++){const c=pick(cols);x.strokeStyle=c;x.globalAlpha=.55+rnd(.35);x.lineWidth=3+rnd(5);x.beginPath();let px=rnd(w),py=rnd(h);x.moveTo(px,py);for(let s=0;s<8;s++){px+=rnd(50)-15;py+=rnd(40)-20;x.quadraticCurveTo(px+rnd(30)-15,py-rnd(30),px+rnd(20),py);}x.stroke();}
  x.globalAlpha=1;for(let k=0;k<3;k++){x.save();x.translate(rnd(w),rnd(h));x.rotate(rnd(.4)-.2);x.font=`${28+rnd(26)|0}px Anton, Impact, sans-serif`;x.fillStyle=pick(cols);x.globalAlpha=.75;x.fillText(pick(['SK8','RIP','GO','DIY','CITY','ZAP','OK']),0,0);x.restore();}
  x.globalAlpha=1;noise(x,w,h,4000,.12);});
 T.brick=ctex(512,512,(x,w,h)=>{const bw=64,bh=24;for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const o=r%2?bw/2:0;const v=sr()*30|0;x.fillStyle=`rgb(${118+v},${58+v*.6|0},${44+v*.4|0})`;x.fillRect(c*bw+o+2,r*bh+2,bw-4,bh-4);}
  x.globalCompositeOperation='destination-over';x.fillStyle='#8a8478';x.fillRect(0,0,w,h);x.globalCompositeOperation='source-over';noise(x,w,h,14000,.12);blotch(x,w,h,20,100,'30,24,20',.25);});
 T.block=ctex(512,512,(x,w,h)=>{const bw=128,bh=64;x.fillStyle='#6d7179';x.fillRect(0,0,w,h);for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const o=r%2?bw/2:0;x.fillStyle=`rgba(255,255,255,${.02+sr()*.05})`;x.fillRect(c*bw+o+2,r*bh+2,bw-4,bh-4);}
  x.strokeStyle='rgba(30,32,36,.6)';x.lineWidth=3;for(let r=0;r<=h/bh;r++){x.beginPath();x.moveTo(0,r*bh);x.lineTo(w,r*bh);x.stroke();for(let c=0;c<=w/bw;c++){const o=r%2?bw/2:0;x.beginPath();x.moveTo(c*bw+o,r*bh);x.lineTo(c*bw+o,r*bh+bh);x.stroke();}}noise(x,w,h,9000,.08);});
 T.asphalt=ctex(1024,1024,(x,w,h)=>{x.fillStyle='#3d3d3f';x.fillRect(0,0,w,h);blotch(x,w,h,50,150,'20,20,22',.3);blotch(x,w,h,30,120,'110,108,104',.12);noise(x,w,h,60000,.18,2);noise(x,w,h,20000,.12,2,'200,200,200');cracks(x,w,h,8,.55);});
 T.pavers=ctex(1024,1024,(x,w,h)=>{const s=64;for(let r=0;r<h/s;r++)for(let c=0;c<w/s;c++){const v=sr();x.fillStyle=v<.15?'#7a6c5c':v<.5?'#958c80':'#888076';x.fillRect(c*s+1,r*s+1,s-2,s-2);}
  x.globalCompositeOperation='destination-over';x.fillStyle='#6a645c';x.fillRect(0,0,w,h);x.globalCompositeOperation='source-over';noise(x,w,h,30000,.1);blotch(x,w,h,30,120,'40,36,30',.18);scuffs(x,w,h,40,'20,18,16',.2);});
 T.slab=ctex(512,512,(x,w,h)=>{x.fillStyle='#c9c2b4';x.fillRect(0,0,w,h);noise(x,w,h,12000,.08);blotch(x,w,h,16,90,'110,100,90',.15);x.fillStyle='rgba(60,55,50,.5)';x.fillRect(0,0,w,3);x.fillRect(0,0,3,h);x.fillRect(0,h/2,w,2);x.fillRect(w/2,0,2,h);scuffs(x,w,h,20,'30,28,26',.2);});
 T.wood=ctex(512,512,(x,w,h)=>{const pw=64;for(let i=0;i<w/pw;i++){const v=sr()*30|0;x.fillStyle=`rgb(${120+v},${80+v*.7|0},${48+v*.4|0})`;x.fillRect(i*pw,0,pw-3,h);for(let k=0;k<30;k++){x.strokeStyle=`rgba(50,30,15,${rnd(.25)})`;x.beginPath();const xx=i*pw+rnd(pw);x.moveTo(xx,0);x.bezierCurveTo(xx+rnd(8)-4,h/3,xx+rnd(8)-4,h*2/3,xx+rnd(6)-3,h);x.stroke();}}x.fillStyle='#2a1c10';for(let i=0;i<w/pw;i++)x.fillRect(i*pw+pw-3,0,3,h);noise(x,w,h,5000,.08);});
 T.roof=ctex(512,512,(x,w,h)=>{x.fillStyle='#8a8580';x.fillRect(0,0,w,h);noise(x,w,h,40000,.25,2);noise(x,w,h,15000,.2,2,'230,226,220');blotch(x,w,h,20,90,'40,38,36',.2);});
 T.pool=ctex(512,512,(x,w,h)=>{x.fillStyle='#c6d4d8';x.fillRect(0,0,w,h);blotch(x,w,h,30,110,'90,120,130',.2);noise(x,w,h,10000,.06);scuffs(x,w,h,70,'30,30,34',.3);});
 T.tile=ctex(256,256,(x,w,h)=>{const s=32;for(let r=0;r<h/s;r++)for(let c=0;c<w/s;c++){const v=sr();x.fillStyle=v<.5?'#1f6fb0':'#2a86c8';x.fillRect(c*s+1,r*s+1,s-2,s-2);}x.globalCompositeOperation='destination-over';x.fillStyle='#e8eef0';x.fillRect(0,0,w,h);x.globalCompositeOperation='source-over';noise(x,w,h,3000,.08);});
 T.plate=ctex(256,256,(x,w,h)=>{x.fillStyle='#7d8288';x.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<8;c++){x.save();x.translate(c*32+16+(r%2?8:-8)*.5,r*32+16);x.rotate(r%2?.6:-.6);const g=x.createLinearGradient(-9,0,9,0);g.addColorStop(0,'#5c6066');g.addColorStop(1,'#b0b6bc');x.fillStyle=g;x.fillRect(-11,-3,22,6);x.restore();}noise(x,w,h,3000,.12);blotch(x,w,h,8,60,'60,40,20',.25);});
 T.metal=ctex(256,256,(x,w,h)=>{x.fillStyle='#9aa0a8';x.fillRect(0,0,w,h);for(let i=0;i<h;i++){x.fillStyle=`rgba(${rnd()<.5?'0,0,0':'255,255,255'},${rnd(.06)})`;x.fillRect(0,i,w,1);}blotch(x,w,h,10,50,'90,60,30',.2);});
 T.grass=ctex(256,256,(x,w,h)=>{x.fillStyle='#3d5a2a';x.fillRect(0,0,w,h);noise(x,w,h,20000,.5,2,'20,40,10');noise(x,w,h,12000,.4,1,'120,160,70');});
 T.kiosk=ctex(512,256,(x,w,h)=>{for(let i=0;i<w/32;i++){x.fillStyle=i%2?'#e8e2d4':'#d1361f';x.fillRect(i*32,0,32,70);}x.fillStyle='#1c3b4a';x.fillRect(0,70,w,h-70);x.fillStyle='#ffcf3f';x.font='bold 64px Anton, Impact, sans-serif';x.textAlign='center';x.fillText('NEWS · COFFEE',w/2,170);x.fillStyle='rgba(255,255,255,.2)';for(let i=0;i<6;i++)x.fillRect(30+i*80,190,50,50);noise(x,w,h,4000,.1);});
 T.chain=ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='rgba(200,205,210,.95)';x.lineWidth=2.4;for(let i=-8;i<16;i++){x.beginPath();x.moveTo(i*16,0);x.lineTo(i*16+h,h);x.stroke();x.beginPath();x.moveTo(i*16+h,0);x.lineTo(i*16,h);x.stroke();}},{srgb:true});
 T.water=ctex(256,256,(x,w,h)=>{x.fillStyle='#1d5a72';x.fillRect(0,0,w,h);for(let i=0;i<300;i++){x.strokeStyle=`rgba(200,240,255,${rnd(.35)})`;x.lineWidth=1+rnd(2);x.beginPath();const cx=rnd(w),cy=rnd(h);x.ellipse(cx,cy,6+rnd(20),2+rnd(4),0,0,7);x.stroke();}});
 T.gfx=[0,1,2,3,4,5].map(i=>graffiti(i));
 return T;}

function spray(x,cx,cy,r,col){const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,col);g.addColorStop(.6,col+'aa');g.addColorStop(1,col+'00');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();}
// original graffiti tags/pieces (no real-world brands): bubble letters with outline, drips and highlights
const WORDS=['SKATE CITY','GO BIG','SK8','RAD','SHRED','HARBOR','GRIND','NO COMPLY','DROP IN','STOKED','CITY KIDS','AIR'];
export function graffiti(i){const word=WORDS[i*7%WORDS.length];return ctex(1024,384,(x,w,h)=>{x.clearRect(0,0,w,h);const cols=[['#ff4d00','#ffd23f'],['#3dd6ff','#ff3fa4'],['#7cff5b','#ffffff'],['#ffd23f','#ff2a6d'],['#b48cff','#3dd6ff'],['#ff3fa4','#ffd23f']][i%6];
  // background blob
  x.fillStyle='rgba(20,20,30,.0)';x.save();x.translate(w/2,h/2);x.rotate((i%2?-1:1)*.05);
  const fs=word.length>7?150:200;x.font=`${fs}px Anton, Impact, sans-serif`;x.textAlign='center';x.textBaseline='middle';
  x.lineJoin='round';x.strokeStyle='#0c0c12';x.lineWidth=34;x.strokeText(word,0,0);
  const g=x.createLinearGradient(0,-fs/2,0,fs/2);g.addColorStop(0,cols[1]);g.addColorStop(1,cols[0]);x.fillStyle=g;x.fillText(word,0,0);
  x.lineWidth=6;x.strokeStyle='#ffffff';x.globalAlpha=.85;x.strokeText(word,-4,-5);x.globalAlpha=1;
  // drips
  x.fillStyle=cols[0];for(let k=0;k<10;k++){const dx=(rnd()-.5)*fs*word.length*.42,dl=20+rnd(60);x.fillRect(dx,fs*.32,5,dl);x.beginPath();x.arc(dx+2.5,fs*.32+dl,4,0,7);x.fill();}
  // sparkles
  x.fillStyle='#fff';for(let k=0;k<5;k++){const sx=(rnd()-.5)*fs*word.length*.4,sy=(rnd()-.5)*fs*.6;x.save();x.translate(sx,sy);x.rotate(.785);x.fillRect(-2,-14,4,28);x.fillRect(-14,-2,28,4);x.restore();}
  x.restore();},{clamp:true});}
// building facade: rows of windows, some lit (emissive)
export function facade(kind,seedv){srand(seedv);const W=512,H=512;const col=kind==='brick'?'#7a4636':kind==='glass'?'#22303e':kind==='school'?'#9a5a44':'#8c8a84';
 const draw=(lit)=>(x,w,h)=>{x.fillStyle=lit?'#000':col;x.fillRect(0,0,w,h);if(!lit){noise(x,w,h,16000,.12);if(kind==='brick'||kind==='school'){x.strokeStyle='rgba(40,20,14,.35)';x.lineWidth=1;for(let y=0;y<h;y+=8){x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke();}}}
  const cols=4,rows=4,cw=w/cols,ch=h/rows;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const on=sr();const wx=c*cw+cw*.18,wy=r*ch+ch*.22,ww=cw*.64,wh=ch*(kind==='glass'?.66:.56);
   if(lit){if(on<.38){const t=sr();x.fillStyle=t<.5?'#ffd9a0':t<.8?'#ffe9c8':'#bfe0ff';x.globalAlpha=.55+sr()*.45;x.fillRect(wx,wy,ww,wh);x.globalAlpha=1;}else sr();}
   else{const g=x.createLinearGradient(wx,wy,wx+ww,wy+wh);g.addColorStop(0,'#4e6a84');g.addColorStop(1,'#1a2430');x.fillStyle=g;x.fillRect(wx,wy,ww,wh);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(wx,wy,ww*.3,wh);sr();
    x.fillStyle='rgba(0,0,0,.35)';x.fillRect(wx-3,wy+wh,ww+6,5);x.strokeStyle='rgba(20,20,24,.8)';x.lineWidth=3;x.strokeRect(wx,wy,ww,wh);x.beginPath();x.moveTo(wx+ww/2,wy);x.lineTo(wx+ww/2,wy+wh);x.stroke();}}};
 const map=ctex(W,H,draw(false));srand(seedv);const em=ctex(W,H,draw(true));return{map,em};}
