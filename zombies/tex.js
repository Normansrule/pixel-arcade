// NIGHTFALL — procedural textures (no image files): ground, gravel, concrete, fieldstone, barn planks, floorboards, corrugated metal, lab tile, shingles, boards, grime, sprites.
import * as THREE from '../vendor/three.module.min.js';

// seeded value noise so the compound looks the same every visit
let seed=1337;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
function noiseField(w,h,cell,oct=4){const out=new Float32Array(w*h);let amp=1,sum=0;
 for(let o=0;o<oct;o++){const cw=Math.max(1,cell>>o),gx=Math.ceil(w/cw)+1,gz=Math.ceil(h/cw)+1;const g=new Float32Array(gx*gz);for(let i=0;i<g.length;i++)g[i]=rnd();
  for(let y=0;y<h;y++){const fy=y/cw,iy=fy|0,ty=fy-iy,sy=ty*ty*(3-2*ty);for(let x=0;x<w;x++){const fx=x/cw,ix=fx|0,tx=fx-ix,sx=tx*tx*(3-2*tx);
   // wrap so textures tile
   const x0=ix%(gx-1),x1=(ix+1)%(gx-1),y0=iy%(gz-1),y1=(iy+1)%(gz-1);
   const a=g[y0*gx+x0],b=g[y0*gx+x1],c=g[y1*gx+x0],d=g[y1*gx+x1];out[y*w+x]+=amp*((a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy);}}
  sum+=amp;amp*=.5;}
 for(let i=0;i<out.length;i++)out[i]/=sum;return out;}
function mk(size,draw,o={}){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');draw(x,size);const t=new THREE.CanvasTexture(c);
 t.wrapS=t.wrapT=THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(o.rep)t.repeat.set(o.rep,o.rep);t.userData.canvas=c;return t;}
// paint a noise field through a palette function into the canvas
function paint(x,s,f){const img=x.getImageData(0,0,s,s),d=img.data;for(let i=0;i<s*s;i++){const[r,g,b]=f(i%s,(i/s)|0,i);d[i*4]=r;d[i*4+1]=g;d[i*4+2]=b;d[i*4+3]=255;}x.putImageData(img,0,0);}
const mix=(a,b,t)=>a+(b-a)*t;

export function makeTextures(){seed=1337;const T={};
 // packed dirt with patchy dead grass
 T.ground=mk(512,(x,s)=>{const n=noiseField(s,s,64,5),m=noiseField(s,s,24,3),k=noiseField(s,s,6,2);
  paint(x,s,(px,py,i)=>{const g=Math.max(0,Math.min(1,(n[i]-.47)*4));const v=.7+m[i]*.5+k[i]*.25;return[mix(86,70,g)*v,mix(72,76,g)*v,mix(58,46,g)*v];});
  for(let i=0;i<1800;i++){const a=rnd()*s,b=rnd()*s;x.fillStyle=`rgba(${rnd()<.5?'30,28,22':'140,128,96'},${.15+rnd()*.3})`;x.fillRect(a,b,1+rnd()*3,1+rnd()*3);}
  x.strokeStyle='rgba(88,92,50,.35)';x.lineWidth=1;for(let i=0;i<900;i++){const a=rnd()*s,b=rnd()*s;x.beginPath();x.moveTo(a,b);x.lineTo(a+(rnd()-.5)*4,b-3-rnd()*5);x.stroke();}});
 T.gravel=mk(256,(x,s)=>{const n=noiseField(s,s,32,4);paint(x,s,(px,py,i)=>{const v=60+n[i]*60;return[v*1.02,v,v*.94];});
  for(let i=0;i<2600;i++){const a=rnd()*s,b=rnd()*s,r=1+rnd()*2.6,v=70+rnd()*90|0;x.fillStyle=`rgb(${v},${v-4},${v-10})`;x.beginPath();x.ellipse(a,b,r,r*.75,rnd()*3,0,7);x.fill();x.fillStyle='rgba(0,0,0,.35)';x.fillRect(a-r*.3,b+r*.4,r,1);}});
 T.grass=mk(256,(x,s)=>{const n=noiseField(s,s,48,4);paint(x,s,(px,py,i)=>{const v=.6+n[i]*.6;return[44*v,58*v,32*v];});
  for(let i=0;i<2600;i++){const a=rnd()*s,b=rnd()*s;x.strokeStyle=`rgba(${80+rnd()*50|0},${96+rnd()*50|0},${50+rnd()*20|0},.6)`;x.beginPath();x.moveTo(a,b);x.lineTo(a+(rnd()-.5)*3,b-2-rnd()*5);x.stroke();}});
 // poured concrete compound wall: panels, stains, rust streaks
 T.concrete=mk(512,(x,s)=>{const n=noiseField(s,s,64,5),m=noiseField(s,s,8,2);paint(x,s,(px,py,i)=>{const v=90+n[i]*70+m[i]*25-(py/s)*14;return[v,v*.99,v*.96];});
  x.strokeStyle='rgba(20,20,20,.55)';x.lineWidth=2;for(let k=0;k<=2;k++){x.beginPath();x.moveTo(k*s/2,0);x.lineTo(k*s/2,s);x.stroke();}x.beginPath();x.moveTo(0,s*.5);x.lineTo(s,s*.5);x.stroke();
  for(let i=0;i<26;i++){const a=rnd()*s,w=2+rnd()*6;const gr=x.createLinearGradient(0,0,0,s);gr.addColorStop(0,'rgba(60,40,24,.0)');gr.addColorStop(.3,`rgba(70,44,26,${.12+rnd()*.2})`);gr.addColorStop(1,'rgba(40,30,20,0)');x.fillStyle=gr;x.fillRect(a,rnd()*s*.5,w,s*.6);}
  for(let i=0;i<500;i++){x.fillStyle=`rgba(0,0,0,${rnd()*.4})`;x.fillRect(rnd()*s,rnd()*s,1+rnd()*2,1+rnd()*2);}});
 // fieldstone farmhouse
 T.stone=mk(512,(x,s)=>{x.fillStyle='#3a3632';x.fillRect(0,0,s,s);const rows=8,rh=s/rows;
  for(let r=0;r<rows;r++){let cx=-rnd()*40;while(cx<s){const w=40+rnd()*50;const v=70+rnd()*50|0,t=rnd()*14|0;x.fillStyle=`rgb(${v+t},${v+t*.6|0},${v-6})`;const y=r*rh;x.beginPath();x.roundRect(cx+2,y+2,w-4,rh-4,8);x.fill();
   const gr=x.createLinearGradient(0,y,0,y+rh);gr.addColorStop(0,'rgba(255,255,255,.12)');gr.addColorStop(1,'rgba(0,0,0,.3)');x.fillStyle=gr;x.fill();cx+=w;}}
  const n=noiseField(s,s,16,3);const img=x.getImageData(0,0,s,s),d=img.data;for(let i=0;i<s*s;i++){const k=.8+n[i]*.4;d[i*4]*=k;d[i*4+1]*=k;d[i*4+2]*=k;}x.putImageData(img,0,0);
  for(let i=0;i<140;i++){x.fillStyle=`rgba(60,80,40,${rnd()*.25})`;x.beginPath();x.arc(rnd()*s,rnd()*s,2+rnd()*8,0,7);x.fill();}});
 // weathered barn planks (vertical), oxide red
 T.planks=mk(512,(x,s)=>{const n=noiseField(s,s,32,3);const cols=8,cw=s/cols;
  for(let c=0;c<cols;c++){const base=[110+rnd()*30,38+rnd()*14,26+rnd()*10];
   const img=x.getImageData(c*cw,0,cw,s),d=img.data;for(let y=0;y<s;y++)for(let k=0;k<cw;k++){const i=(y*cw+k)*4;const gx=c*cw+k;const v=.62+n[y*s+gx]*.5+Math.sin((gx*.7+y*.02)+c)*.05;const fade=n[((y*3)%s)*s+gx]>.55?.75:1;
    d[i]=base[0]*v*fade+30*(1-fade);d[i+1]=base[1]*v*fade+30*(1-fade);d[i+2]=base[2]*v*fade+28*(1-fade);d[i+3]=255;}x.putImageData(img,c*cw,0);
   x.fillStyle='rgba(10,6,4,.85)';x.fillRect(c*cw,0,2,s);x.fillStyle='rgba(255,220,200,.08)';x.fillRect(c*cw+2,0,1,s);
   for(let k=0;k<3;k++){x.fillStyle='rgba(20,14,10,.6)';const y=rnd()*s;x.beginPath();x.ellipse(c*cw+cw/2,y,3,8,0,0,7);x.fill();}
   x.fillStyle='#1a1a1a';x.fillRect(c*cw+cw/2-2,s*.1,3,3);x.fillRect(c*cw+cw/2-2,s*.9,3,3);}});
 T.boards=mk(256,(x,s)=>{const n=noiseField(s,s,16,3);paint(x,s,(px,py,i)=>{const g=Math.sin(py*.25+n[i]*6)*.08;const v=.7+n[i]*.45+g;return[132*v,98*v,66*v];});
  x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,0,s,3);x.fillRect(0,s-3,s,3);for(const a of[14,s-18]){x.fillStyle='#222';x.beginPath();x.arc(a,s/2,4,0,7);x.fill();x.fillStyle='#777';x.beginPath();x.arc(a-1,s/2-1,1.5,0,7);x.fill();}});
 T.floor=mk(512,(x,s)=>{const n=noiseField(s,s,32,4);const rows=8,rh=s/rows;paint(x,s,(px,py,i)=>{const r=(py/rh)|0;const v=.55+n[i]*.45+((r*37)%7)*.02+Math.sin(px*.08+r*9)*.03;return[96*v,70*v,48*v];});
  for(let r=0;r<rows;r++){x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,r*rh,s,2);let c=(r*97)%s;x.fillRect(c,r*rh,2,rh);x.fillRect((c+s/2)%s,r*rh,2,rh);}});
 T.hay=mk(256,(x,s)=>{x.fillStyle='#8a7238';x.fillRect(0,0,s,s);for(let i=0;i<2600;i++){const a=rnd()*s,b=rnd()*s,l=4+rnd()*14,an=(rnd()-.5)*.9;x.strokeStyle=`rgba(${170+rnd()*70|0},${140+rnd()*60|0},${60+rnd()*40|0},.7)`;x.lineWidth=1;x.beginPath();x.moveTo(a,b);x.lineTo(a+Math.cos(an)*l,b+Math.sin(an)*l);x.stroke();}
  for(let i=0;i<600;i++){x.fillStyle='rgba(40,30,10,.3)';x.fillRect(rnd()*s,rnd()*s,2,2);}});
 // corrugated lab sheeting
 T.metal=mk(256,(x,s)=>{const n=noiseField(s,s,32,4);paint(x,s,(px,py,i)=>{const c=Math.sin(px/s*Math.PI*2*10);const v=.55+c*.12+n[i]*.35;return[112*v,118*v,120*v];});
  for(let i=0;i<30;i++){const a=rnd()*s;const gr=x.createLinearGradient(0,0,0,s);gr.addColorStop(0,'rgba(120,60,20,0)');gr.addColorStop(.5,`rgba(130,64,20,${.1+rnd()*.25})`);gr.addColorStop(1,'rgba(90,40,10,0)');x.fillStyle=gr;x.fillRect(a,rnd()*s*.5,2+rnd()*5,s*.5);}});
 T.tile=mk(256,(x,s)=>{const n=noiseField(s,s,32,3);const t=4,ts=s/t;paint(x,s,(px,py,i)=>{const k=((px/ts|0)+(py/ts|0))%2;const v=(k?.78:.7)+n[i]*.25;return[150*v,156*v,150*v];});
  x.fillStyle='rgba(20,22,22,.8)';for(let k=0;k<=t;k++){x.fillRect(k*ts-1,0,2,s);x.fillRect(0,k*ts-1,s,2);}for(let i=0;i<40;i++){x.fillStyle=`rgba(40,30,20,${rnd()*.25})`;x.beginPath();x.arc(rnd()*s,rnd()*s,4+rnd()*20,0,7);x.fill();}});
 T.shingle=mk(256,(x,s)=>{const rows=8,rh=s/rows;x.fillStyle='#1a1614';x.fillRect(0,0,s,s);for(let r=0;r<rows;r++){const off=r%2?s/12:0;for(let c=-1;c<7;c++){const v=40+rnd()*26|0;x.fillStyle=`rgb(${v+6},${v},${v-4})`;x.fillRect(off+c*s/6+1,r*rh+1,s/6-2,rh-2);}}});
 T.rust=mk(256,(x,s)=>{const n=noiseField(s,s,32,5);paint(x,s,(px,py,i)=>{const r=Math.max(0,Math.min(1,(n[i]-.4)*3));return[mix(70,120,r),mix(72,58,r),mix(70,34,r)];});});
 T.bark=mk(256,(x,s)=>{const n=noiseField(s,s,16,3);paint(x,s,(px,py,i)=>{const v=.5+n[i]*.5+Math.sin(px*.3+n[i]*8)*.15;return[52*v,44*v,38*v];});});
 // greyscale grime/detail used on characters (multiplies vertex colours)
 T.grime=mk(256,(x,s)=>{const n=noiseField(s,s,24,4),m=noiseField(s,s,4,2);paint(x,s,(px,py,i)=>{const v=170+n[i]*80+m[i]*30-(n[i]>.6?40:0);return[v,v,v];});
  for(let i=0;i<500;i++){x.fillStyle=`rgba(0,0,0,${rnd()*.25})`;x.fillRect(rnd()*s,rnd()*s,2+rnd()*4,1+rnd()*2);}});
 // sprites
 T.puff=mk(128,(x,s)=>{const n=noiseField(s,s,16,4);const img=x.createImageData(s,s),d=img.data;for(let i=0;i<s*s;i++){const px=i%s,py=i/s|0;const r=Math.hypot(px-s/2,py-s/2)/(s/2);const a=Math.max(0,1-r)**1.4*(.45+n[i]*.9);d[i*4]=d[i*4+1]=d[i*4+2]=255;d[i*4+3]=Math.min(255,a*255);}x.putImageData(img,0,0);},{srgb:false});
 T.flash=mk(128,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(.25,'rgba(255,200,120,.9)');g.addColorStop(1,'rgba(255,90,10,0)');x.fillStyle=g;x.fillRect(0,0,s,s);
  x.globalCompositeOperation='lighter';for(let k=0;k<6;k++){x.save();x.translate(s/2,s/2);x.rotate(k/6*Math.PI*2+rnd()*.3);const gg=x.createLinearGradient(0,0,s/2,0);gg.addColorStop(0,'rgba(255,230,180,.9)');gg.addColorStop(1,'rgba(255,120,30,0)');x.fillStyle=gg;x.beginPath();x.moveTo(0,-4);x.lineTo(s/2,0);x.lineTo(0,4);x.fill();x.restore();}});
 T.hole=mk(64,(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.25,'rgba(10,8,6,.95)');g.addColorStop(.5,'rgba(30,26,22,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,s,s);});
 T.scorch=mk(128,(x,s)=>{const n=noiseField(s,s,16,4);const img=x.createImageData(s,s),d=img.data;for(let i=0;i<s*s;i++){const px=i%s,py=i/s|0;const r=Math.hypot(px-s/2,py-s/2)/(s/2);const a=Math.max(0,1-r*(1.1-n[i]*.5));d[i*4]=10;d[i*4+1]=8;d[i*4+2]=6;d[i*4+3]=Math.min(255,a*a*330);}x.putImageData(img,0,0);});
 T.beam=mk(64,(x,s)=>{const g=x.createLinearGradient(0,0,s,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,s,s);const v=x.createLinearGradient(0,0,0,s);v.addColorStop(0,'rgba(0,0,0,1)');v.addColorStop(.15,'rgba(0,0,0,0)');x.globalCompositeOperation='destination-out';x.fillStyle=v;x.fillRect(0,0,s,s);},{srgb:false});
 return T;}

// text label texture (signs, price tags, perk fronts)
export function labelTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
export const DISP='"Anton", Impact, "Arial Narrow", sans-serif',MONO='"JetBrains Mono", ui-monospace, monospace';
