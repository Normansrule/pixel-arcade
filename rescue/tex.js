// BEACON RESCUE — procedural textures (no image files): warm floor planks, hex slate, whitewashed lighthouse stone, painted
// iron, crates, hazard stripes, the scrolling power pulse for live cables, sign plates, the storm outside and soft sprites.
import * as THREE from '../vendor/three.module.min.js';
export const DISP="'Anton',Impact,sans-serif",MONO="'JetBrains Mono',ui-monospace,monospace";
let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
function noise(w,h,cell,oct=4){const out=new Float32Array(w*h);let amp=1,sum=0;
 for(let o=0;o<oct;o++){const cw=Math.max(1,cell>>o),gx=Math.ceil(w/cw)+1,gz=Math.ceil(h/cw)+1,g=new Float32Array(gx*gz);for(let i=0;i<g.length;i++)g[i]=rnd();
  for(let y=0;y<h;y++){const fy=y/cw,iy=fy|0,ty=fy-iy,sy=ty*ty*(3-2*ty);for(let x=0;x<w;x++){const fx=x/cw,ix=fx|0,tx=fx-ix,sx=tx*tx*(3-2*tx);
   const x0=ix%(gx-1),x1=(ix+1)%(gx-1),y0=iy%(gz-1),y1=(iy+1)%(gz-1),a=g[y0*gx+x0],b=g[y0*gx+x1],c=g[y1*gx+x0],d=g[y1*gx+x1];out[y*w+x]+=amp*((a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy);}}
  sum+=amp;amp*=.5;}for(let i=0;i<out.length;i++)out[i]/=sum;return out;}
function cv(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tex(c,o={}){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function mk(w,h,draw,o){const c=cv(w,h);draw(c.getContext('2d'),w,h);return tex(c,o);}
const mix=(a,b,t)=>a+(b-a)*t;
function shade(x,w,h,k,cell=48){const n=noise(w,h,cell,4),img=x.getImageData(0,0,w,h),d=img.data;for(let i=0;i<w*h;i++){const m=1-k*.5+n[i]*k;d[i*4]*=m;d[i*4+1]*=m;d[i*4+2]*=m;}x.putImageData(img,0,0);}

export function makeTextures(){seed=11;const T={};
 // warm floor planks (boathouse)
 T.planks=mk(512,512,(x,w,h)=>{const n=noise(w,h,64,3);const img=x.createImageData(w,h),d=img.data;const rows=8,rh=h/rows;
  for(let y=0;y<h;y++){const r=(y/rh)|0,off=(r*137)%w,tone=.84+((r*53)%7)/32;for(let X=0;X<w;X++){const i=y*w+X,xx=(X+off)%w,gr=.5+.5*Math.sin(y*.75+n[i]*6+Math.sin(xx*.012+r)*2.5);
   const v=tone*(.86+gr*.1+n[i]*.12),e=y%rh<3||xx%256<2?.45:1,wear=Math.max(0,n[i]-.55)*1.6;d[i*4]=(mix(66,96,gr)+wear*60)*v*e;d[i*4+1]=(mix(78,106,gr)+wear*30)*v*e;d[i*4+2]=(mix(92,122,gr)+wear*5)*v*e;d[i*4+3]=255;}}
  x.putImageData(img,0,0);x.fillStyle='rgba(20,22,28,.6)';for(let r=0;r<rows;r++)for(const X of[40,216,300,470])if(rnd()<.6){x.beginPath();x.arc(((X+r*137)%w),r*rh+rh*.5,2.2,0,7);x.fill();}});
 // hex slate tiles (storeroom), blue-grey like a cold cellar floor
 T.hex=mk(512,512,(x,w,h)=>{x.fillStyle='#1a2230';x.fillRect(0,0,w,h);const R=w/8,hh=Math.sqrt(3)*R;
  for(let cx=-1;cx<10;cx++)for(let cy=-1;cy<10;cy++){const px=cx*R*1.5,py=cy*hh+(cx&1?hh/2:0);const t=.8+rnd()*.35;x.fillStyle=`rgb(${62*t|0},${76*t|0},${96*t|0})`;x.beginPath();
   for(let k=0;k<6;k++){const a=k*Math.PI/3;x.lineTo(px+Math.cos(a)*(R-4),py+Math.sin(a)*(R-4));}x.closePath();x.fill();x.strokeStyle='rgba(255,255,255,.06)';x.lineWidth=2;x.stroke();}
  shade(x,w,h,.35,64);});
 // whitewashed lighthouse stone blocks
 T.stone=mk(512,512,(x,w,h)=>{x.fillStyle='#3a3530';x.fillRect(0,0,w,h);const rows=6,rh=h/rows;for(let r=0;r<rows;r++){let X=-(r%2)*60;while(X<w){const bw=90+rnd()*70,t=.86+rnd()*.18;x.fillStyle=`rgb(${214*t|0},${204*t|0},${188*t|0})`;
   x.fillRect(X+3,r*rh+3,bw-6,rh-6);X+=bw;}}shade(x,w,h,.45,40);x.fillStyle='rgba(60,40,20,.18)';for(let i=0;i<6;i++){const sx=rnd()*w;x.fillRect(sx,0,6+rnd()*14,h*(.3+rnd()*.5));}});
 // painted iron panel with rivets (machinery, doors)
 T.iron=mk(256,256,(x,w,h)=>{x.fillStyle='#8a9aa0';x.fillRect(0,0,w,h);shade(x,w,h,.4,32);x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=3;x.strokeRect(6,6,w-12,h-12);x.fillStyle='rgba(20,20,20,.5)';
  for(let i=0;i<8;i++)for(const[a,b]of[[14+i*30,14],[14+i*30,h-14],[14,14+i*30],[w-14,14+i*30]]){x.beginPath();x.arc(a,b,3,0,7);x.fill();}x.fillStyle='rgba(120,60,30,.25)';for(let i=0;i<5;i++){x.beginPath();x.ellipse(rnd()*w,rnd()*h,10+rnd()*20,4+rnd()*10,rnd()*3,0,7);x.fill();}});
 // wooden crate
 T.crate=mk(256,256,(x,w,h)=>{const n=noise(w,h,32,3),img=x.createImageData(w,h),d=img.data;for(let i=0;i<w*h;i++){const y=(i/w)|0,g=.5+.5*Math.sin(y*.3+n[i]*6),v=.8+n[i]*.3;d[i*4]=mix(150,200,g)*v;d[i*4+1]=mix(98,140,g)*v;d[i*4+2]=mix(52,80,g)*v;d[i*4+3]=255;}x.putImageData(img,0,0);
  x.fillStyle='rgba(60,30,10,.85)';x.fillRect(0,0,w,22);x.fillRect(0,h-22,w,22);x.fillRect(0,0,22,h);x.fillRect(w-22,0,22,h);x.save();x.translate(w/2,h/2);x.rotate(Math.PI/4);x.fillRect(-w*.7,-10,w*1.4,20);x.restore();
  x.strokeStyle='rgba(255,230,190,.12)';x.strokeRect(22,22,w-44,h-44);});
 // hazard stripes
 T.haz=mk(128,128,(x,w,h)=>{x.fillStyle='#1c1a16';x.fillRect(0,0,w,h);x.fillStyle='#f0b020';for(let i=-4;i<8;i++){x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32+16,0);x.lineTo(i*32+16+h,h);x.lineTo(i*32+h,h);x.fill();}shade(x,w,h,.3,32);});
 // live cable: dark rubber with bright pulses; the material scrolls its offset so power visibly flows
 T.pulse=mk(256,16,(x,w,h)=>{x.fillStyle='#0c3640';x.fillRect(0,0,w,h);for(let i=0;i<4;i++){const g=x.createLinearGradient(i*64,0,i*64+48,0);g.addColorStop(0,'rgba(120,255,255,0)');g.addColorStop(.7,'rgba(200,255,255,1)');g.addColorStop(1,'rgba(120,255,255,0)');x.fillStyle=g;x.fillRect(i*64,0,48,h);}});
 T.rubber=mk(128,16,(x,w,h)=>{x.fillStyle='#24201c';x.fillRect(0,0,w,h);x.fillStyle='rgba(255,255,255,.07)';for(let i=0;i<w;i+=16)x.fillRect(i,0,2,h);});
 // the storm outside the windows: night sea, low clouds, rain streaks
 T.storm=mk(256,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#16223a');g.addColorStop(.55,'#2a3c5c');g.addColorStop(.6,'#0c1626');g.addColorStop(1,'#060a14');x.fillStyle=g;x.fillRect(0,0,w,h);
  x.fillStyle='rgba(160,190,230,.12)';for(let i=0;i<30;i++){x.beginPath();x.ellipse(rnd()*w,rnd()*h*.5,30+rnd()*50,6+rnd()*10,0,0,7);x.fill();}
  x.strokeStyle='rgba(180,210,255,.25)';x.lineWidth=1;for(let i=0;i<70;i++){const a=rnd()*w,b=rnd()*h;x.beginPath();x.moveTo(a,b);x.lineTo(a-4,b+14);x.stroke();}
  x.fillStyle='rgba(200,220,255,.18)';for(let i=0;i<40;i++)x.fillRect(rnd()*w,h*.62+rnd()*h*.35,8+rnd()*20,1);});
 // soft sprites
 T.glow=mk(64,64,(x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,w);});
 T.blob=mk(64,64,(x,w)=>{const g=x.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);g.addColorStop(0,'rgba(0,0,0,.75)');g.addColorStop(.6,'rgba(0,0,0,.35)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,w,w);});
 T.ring=mk(128,128,(x,w)=>{x.strokeStyle='#fff';x.lineWidth=7;x.beginPath();x.arc(w/2,w/2,w/2-8,0,7);x.stroke();x.lineWidth=3;x.setLineDash([10,10]);x.beginPath();x.arc(w/2,w/2,w/2-22,0,7);x.stroke();});
 T.beam=mk(64,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);const s=x.createLinearGradient(0,0,w,0);s.addColorStop(0,'rgba(0,0,0,1)');s.addColorStop(.5,'rgba(0,0,0,0)');s.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=s;x.fillRect(0,0,w,h);});
 return T;}

// a sign plate: dark enamel, cream border, big label and an icon; used on every socket, dock and pan so the role reads without colour
export function plate(text,icon,col='#f4e6c8'){return mk(256,128,(x,w,h)=>{x.fillStyle='#1a1c22';x.fillRect(0,0,w,h);x.strokeStyle=col;x.lineWidth=6;x.strokeRect(8,8,w-16,h-16);
 x.fillStyle=col;x.font=`700 40px ${MONO}`;x.textAlign='center';x.textBaseline='middle';x.fillText(icon,46,h/2+2);x.font=`400 44px ${DISP}`;x.textAlign='left';x.fillText(text,84,h/2+3);});}
// little round status disc: ⚡ powered / ✕ off / ▲ held  (drawn as shapes, so it also works without colour)
export function statusTex(kind){return mk(64,64,(x,w)=>{x.clearRect(0,0,w,w);x.fillStyle=kind==='on'?'#5ff0ff':kind==='hold'?'#ffd060':'#ff6a4a';x.beginPath();x.arc(32,32,30,0,7);x.fill();x.fillStyle='#10141c';
 if(kind==='on'){x.beginPath();x.moveTo(36,8);x.lineTo(18,36);x.lineTo(30,36);x.lineTo(26,56);x.lineTo(46,26);x.lineTo(34,26);x.closePath();x.fill();}
 else if(kind==='hold'){x.beginPath();x.moveTo(32,12);x.lineTo(52,46);x.lineTo(12,46);x.closePath();x.fill();}
 else{x.lineWidth=9;x.strokeStyle='#10141c';x.beginPath();x.moveTo(18,18);x.lineTo(46,46);x.moveTo(46,18);x.lineTo(18,46);x.stroke();}},{});}
