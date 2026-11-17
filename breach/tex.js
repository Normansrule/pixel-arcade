// BREACH POINT — procedural canvas textures with derived normal maps (no image files).
import * as THREE from '../vendor/three.module.min.js';

let seed=7;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
const cnv=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function speckle(x,w,h,n,a,sz=2){for(let i=0;i<n;i++){const v=R();x.fillStyle=v<.5?`rgba(0,0,0,${a*R()})`:`rgba(255,255,255,${a*R()*.7})`;const s=1+R()*sz;x.fillRect(R()*w,R()*h,s,s);}}
function blotch(x,w,h,n,col,r0,r1){for(let i=0;i<n;i++){const r=r0+R()*(r1-r0),cx=R()*w,cy=R()*h;for(const ox of[-w,0,w])for(const oy of[-h,0,h]){const g=x.createRadialGradient(cx+ox,cy+oy,0,cx+ox,cy+oy,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx+ox-r,cy+oy-r,r*2,r*2);}}}
function normalFrom(src,str=2){const w=src.width,h=src.height,d=src.getContext('2d').getImageData(0,0,w,h).data,c=cnv(w,h),x=c.getContext('2d'),o=x.createImageData(w,h);
 const L=new Float32Array(w*h);for(let i=0;i<w*h;i++)L[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/765;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(L[j*w+(i+1)%w]-L[j*w+(i-1+w)%w])*str,dy=(L[((j+1)%h)*w+i]-L[((j-1+h)%h)*w+i])*str,l=Math.hypot(dx,dy,1),k=(j*w+i)*4;o.data[k]=(-dx/l*.5+.5)*255;o.data[k+1]=(dy/l*.5+.5)*255;o.data[k+2]=(1/l*.5+.5)*255;o.data[k+3]=255;}
 x.putImageData(o,0,0);return c;}
function T(c,srgb=true){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
// {map, normalMap, roughnessMap?}; hdraw draws a height map (else derived from colour)
function pair(size,draw,hdraw,str,rdraw){const c=cnv(size),x=c.getContext('2d');draw(x,size,size);let hc=c;if(hdraw){hc=cnv(size);hdraw(hc.getContext('2d'),size,size);}const o={map:T(c),normalMap:T(normalFrom(hc,str),false)};
 if(rdraw){const rc=cnv(size>>1);rdraw(rc.getContext('2d'),size>>1,size>>1);o.roughnessMap=T(rc,false);}return o;}

// running-bond block pattern helper
function blocks(x,w,h,bw,bh,base,vary,mortar,gap=3){x.fillStyle=mortar;x.fillRect(0,0,w,h);for(let r=0;r<h/bh;r++)for(let c=0;c<w/bw;c++){const ox=(r%2)*bw/2,v=R();const X=c*bw+ox+gap/2,Y=r*bh+gap/2,W=bw-gap,Hh=bh-gap;
  const a0=.04+R()*.08,a1=.05+R()*.12,chip=R()<.45,cs=3+R()*7,cl=R()<.5,ct=R()<.5;
  for(const wx of[0,-w]){const bx=X+wx;if(bx>=w||bx+W<=0)continue;x.fillStyle=vary(v);x.fillRect(bx,Y,W,Hh);
   // per-block tone gradient, worn bevel (lit top edge, shaded bottom/right edge) and a chipped corner; wrap copy keeps the tile seamless
   const g=x.createLinearGradient(bx,Y,bx+W,Y+Hh);g.addColorStop(0,`rgba(255,250,235,${a0})`);g.addColorStop(1,`rgba(40,25,10,${a1})`);x.fillStyle=g;x.fillRect(bx,Y,W,Hh);
   x.fillStyle='rgba(255,248,230,.16)';x.fillRect(bx,Y,W,2);x.fillStyle='rgba(30,20,10,.22)';x.fillRect(bx,Y+Hh-3,W,3);x.fillRect(bx+W-2,Y,2,Hh);
   if(chip){x.fillStyle=mortar;const cx=cl?bx:bx+W-cs,cy=ct?Y:Y+Hh-cs;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+cs,cy);x.lineTo(cx+(cl?0:cs),cy+cs);x.fill();}}}}
function blocksH(x,w,h,bw,bh,gap=3){x.fillStyle='#202020';x.fillRect(0,0,w,h);for(let r=0;r<h/bh;r++)for(let c=0;c<w/bw;c++){const ox=(r%2)*bw/2,X=c*bw+ox+gap/2+1,Y=r*bh+gap/2+1,W=bw-gap-2,Hh=bh-gap-2,v=170+R()*40|0;
  for(const wx of[0,-w]){const bx=X+wx;if(bx>=w||bx+W<=0)continue;x.fillStyle=`rgb(${v-50},${v-50},${v-50})`;x.fillRect(bx,Y,W,Hh);x.fillStyle=`rgb(${v-22},${v-22},${v-22})`;x.fillRect(bx+2,Y+2,W-4,Hh-4);x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(bx+5,Y+5,W-10,Hh-10);}}speckle(x,w,h,6000,.35,2);}
// irregular flagstone paving: tileable Voronoi cells with mortar joints, per-stone tone + grain; returns [colour canvas, height canvas]
function flagstones(w,cells,tone,mortar){const P=[];for(let i=0;i<cells;i++)P.push([R()*w,R()*w,R()]);const c=cnv(w),hc=cnv(w),x=c.getContext('2d'),hx=hc.getContext('2d'),o=x.createImageData(w,w),ho=hx.createImageData(w,w);
 const cs=w/Math.sqrt(cells),G=Math.ceil(w/cs),grid=[];for(let i=0;i<G*G;i++)grid.push([]);P.forEach((p,i)=>grid[Math.min(G-1,p[1]/cs|0)*G+Math.min(G-1,p[0]/cs|0)].push(i));
 for(let j=0;j<w;j++)for(let i=0;i<w;i++){let d1=1e9,d2=1e9,k1=0;const gx=i/cs|0,gy=j/cs|0;for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){const cx=((gx+ox)%G+G)%G,cy=((gy+oy)%G+G)%G,sx=Math.floor((gx+ox)/G)*w,sy=Math.floor((gy+oy)/G)*w;
   for(const k of grid[cy*G+cx]){const p=P[k],dx=p[0]+sx-i,dy=p[1]+sy-j,d=dx*dx+dy*dy;if(d<d1){d2=d1;d1=d;k1=k;}else if(d<d2)d2=d;}}
  const e=Math.sqrt(d2)-Math.sqrt(d1),q=(j*w+i)*4,gr=(Math.sin(i*.9+j*.37)*Math.sin(j*.71-i*.23))*.5+.5,sp=R();
  if(e<1.7){const m=mortar;o.data[q]=m[0]+sp*14;o.data[q+1]=m[1]+sp*12;o.data[q+2]=m[2]+sp*10;ho.data[q]=ho.data[q+1]=ho.data[q+2]=30;}
  else{const t=tone(P[k1][2]),b=Math.min(1,(e-1.7)/5),sh=.82+.18*b+(sp>.97?.08:sp<.03?-.1:0)+gr*.04;o.data[q]=t[0]*sh;o.data[q+1]=t[1]*sh;o.data[q+2]=t[2]*sh;const hv=120+b*90+P[k1][2]*30+sp*12;ho.data[q]=ho.data[q+1]=ho.data[q+2]=hv;}
  o.data[q+3]=ho.data[q+3]=255;}
 x.putImageData(o,0,0);hx.putImageData(ho,0,0);return[c,hc];}

export function makeTextures(mood){seed=mood==='noon'?11:23;const S={};
 /* ---------- shared ---------- */
 S.wood=pair(256,(x,w,h)=>{x.fillStyle='#8a6a42';x.fillRect(0,0,w,h);for(let i=0;i<h;i+=32){const v=R();x.fillStyle=`rgb(${128+v*40|0},${92+v*30|0},${56+v*18|0})`;x.fillRect(0,i+1,w,30);for(let k=0;k<26;k++){x.strokeStyle=`rgba(60,40,20,${.1+R()*.2})`;x.lineWidth=1;x.beginPath();const y=i+2+R()*28;x.moveTo(0,y);x.bezierCurveTo(w*.3,y+R()*4-2,w*.6,y+R()*4-2,w,y);x.stroke();}x.fillStyle='rgba(30,20,10,.7)';x.fillRect(0,i,w,2);}
  x.fillStyle='rgba(40,28,16,.85)';x.fillRect(0,0,w,14);x.fillRect(0,h-14,w,14);x.fillRect(0,0,14,h);x.fillRect(w-14,0,14,h);x.save();x.translate(w/2,h/2);x.rotate(Math.atan2(h,w));x.fillRect(-w*.72,-7,w*1.44,14);x.restore();
  for(const[a,b]of[[7,7],[w-7,7],[7,h-7],[w-7,h-7]]){x.fillStyle='#2a2a2a';x.beginPath();x.arc(a,b,3,0,7);x.fill();}speckle(x,w,h,2500,.18);},null,2.2);
 S.metal=pair(256,(x,w,h)=>{x.fillStyle='#7a7d80';x.fillRect(0,0,w,h);blotch(x,w,h,26,'rgba(120,60,25,.35)',6,40);speckle(x,w,h,4000,.25);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,h*.3,w,3);x.fillRect(0,h*.7,w,3);},null,1.5);
 S.decal=(()=>{const c=cnv(64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(5,5,5,1)');g.addColorStop(.18,'rgba(15,12,10,.95)');g.addColorStop(.32,'rgba(60,50,40,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  x.strokeStyle='rgba(20,16,12,.6)';for(let i=0;i<7;i++){const a=R()*6.28;x.beginPath();x.moveTo(32,32);x.lineTo(32+Math.cos(a)*(12+R()*12),32+Math.sin(a)*(12+R()*12));x.stroke();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 S.scorch=(()=>{const c=cnv(128),x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,62);g.addColorStop(0,'rgba(10,8,6,.95)');g.addColorStop(.5,'rgba(20,16,12,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 S.puff=(()=>{const c=cnv(128),x=c.getContext('2d');for(let i=0;i<26;i++){const r=14+R()*30,cx=64+(R()-.5)*50,cy=64+(R()-.5)*50,g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.34)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);}
  const m=x.getImageData(0,0,128,128);for(let j=0;j<128;j++)for(let i=0;i<128;i++){const d=Math.hypot(i-64,j-64)/64;m.data[(j*128+i)*4+3]*=Math.max(0,1-d*d);}x.putImageData(m,0,0);return new THREE.CanvasTexture(c);})();
 S.flash=(()=>{const c=cnv(128),x=c.getContext('2d');x.translate(64,64);for(let i=0;i<7;i++){x.rotate(Math.PI*2/7+R()*.3);const g=x.createLinearGradient(0,0,58,0);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(1,'rgba(255,140,40,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,-7);x.lineTo(56+R()*6,0);x.lineTo(0,7);x.fill();}
  const g=x.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,180,80,0)');x.fillStyle=g;x.fillRect(-64,-64,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 S.hazard=pair(128,(x,w,h)=>{x.fillStyle='#d8a81c';x.fillRect(0,0,w,h);x.fillStyle='#1a1a1a';for(let i=-h;i<w;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i+16,0);x.lineTo(i+16+h,h);x.lineTo(i+h,h);x.fill();}speckle(x,w,h,1500,.3);blotch(x,w,h,6,'rgba(60,40,20,.35)',8,30);},null,1);
 if(mood==='noon'){
  S.wall=pair(512,(x,w,h)=>{blocks(x,w,h,128,64,'',v=>`rgb(${196+v*28|0},${164+v*22|0},${118+v*16|0})`,'#8a7050',5);blotch(x,w,h,30,'rgba(120,85,50,.18)',20,80);blotch(x,w,h,16,'rgba(255,245,220,.14)',20,60);speckle(x,w,h,16000,.22,2);
   const g=x.createLinearGradient(0,h*.8,0,h);g.addColorStop(0,'rgba(110,80,50,0)');g.addColorStop(1,'rgba(110,80,50,.35)');x.fillStyle=g;x.fillRect(0,0,w,h);},(x,w,h)=>blocksH(x,w,h,128,64,6),3);
  S.wall2=pair(512,(x,w,h)=>{x.fillStyle='#d9a066';x.fillRect(0,0,w,h);blotch(x,w,h,40,'rgba(170,100,50,.2)',20,110);blotch(x,w,h,25,'rgba(255,230,190,.2)',10,60);speckle(x,w,h,9000,.18);
   for(let i=0;i<4;i++){const cx=R()*w,cy=R()*h,rw=40+R()*80,rh=26+R()*50;x.fillStyle='#8c5a3c';x.fillRect(cx,cy,rw,rh);x.strokeStyle='#5a3a26';x.lineWidth=2;for(let yy=cy;yy<cy+rh;yy+=13)for(let xx=cx+((yy-cy)/13%2)*10;xx<cx+rw;xx+=20){x.strokeRect(xx,yy,20,13);}}
   x.strokeStyle='rgba(90,60,40,.35)';for(let i=0;i<10;i++){let px=R()*w,py=R()*h;x.beginPath();x.moveTo(px,py);for(let k=0;k<7;k++){px+=R()*14-7;py+=R()*14;x.lineTo(px,py);}x.stroke();}},null,1.8);
  S.tower=pair(512,(x,w,h)=>{x.fillStyle='#e8dcc4';x.fillRect(0,0,w,h);blotch(x,w,h,30,'rgba(150,120,80,.18)',20,100);speckle(x,w,h,10000,.15);x.fillStyle='rgba(150,110,70,.55)';x.fillRect(0,h*.47,w,22);x.fillStyle='rgba(120,80,50,.4)';for(let i=0;i<w;i+=32)x.fillRect(i+8,h*.47+5,14,12);},null,1.6);
  S.floor0=pair(512,(x,w,h)=>{x.fillStyle='#c9a877';x.fillRect(0,0,w,h);blotch(x,w,h,60,'rgba(150,115,70,.25)',10,70);blotch(x,w,h,40,'rgba(240,215,170,.22)',10,60);speckle(x,w,h,30000,.2,2);
   for(let i=0;i<120;i++){x.fillStyle=`rgba(${110+R()*40|0},${90+R()*30|0},${60+R()*20|0},.6)`;x.beginPath();x.arc(R()*w,R()*h,1+R()*3,0,7);x.fill();}},null,2);
  S.floor1=(()=>{const[c,hc]=flagstones(512,70,v=>[170+v*48,146+v*40,110+v*30],[132,112,84]);const x=c.getContext('2d');blotch(x,512,512,22,'rgba(90,65,40,.18)',20,90);blotch(x,512,512,14,'rgba(255,240,210,.12)',20,70);speckle(x,512,512,9000,.16,2);
   return{map:T(c),normalMap:T(normalFrom(hc,2.8),false)};})();
  S.floor2=pair(512,(x,w,h)=>{x.fillStyle='#b48c5e';x.fillRect(0,0,w,h);blotch(x,w,h,50,'rgba(120,85,50,.25)',15,90);speckle(x,w,h,26000,.22,2);x.strokeStyle='rgba(100,70,40,.25)';for(let i=0;i<30;i++){x.beginPath();x.moveTo(R()*w,R()*h);x.lineTo(R()*w,R()*h);x.stroke();}},null,2);
  S.site=pair(512,(x,w,h)=>{blocks(x,w,h,128,128,'',v=>`rgb(${206+v*24|0},${186+v*20|0},${150+v*16|0})`,'#7a6448',6);blotch(x,w,h,26,'rgba(120,90,50,.2)',20,80);speckle(x,w,h,16000,.2);},(x,w,h)=>blocksH(x,w,h,128,128,8),2.5);
  S.raised=S.site;S.roof=S.wall;S.thin=S.wood;S.low=S.wall;
 }else{
  S.wall=pair(512,(x,w,h)=>{x.fillStyle='#5d666b';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=32){const g=x.createLinearGradient(i,0,i+32,0);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(.5,'rgba(255,255,255,.14)');g.addColorStop(1,'rgba(0,0,0,.35)');x.fillStyle=g;x.fillRect(i,0,32,h);}
   blotch(x,w,h,40,'rgba(110,60,30,.35)',8,60);for(let i=0;i<30;i++){const sx=R()*w;const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(80,40,20,.4)');g.addColorStop(1,'rgba(80,40,20,0)');x.fillStyle=g;x.fillRect(sx,R()*h*.5,3+R()*5,h*.5);}speckle(x,w,h,8000,.2);x.fillStyle='rgba(0,0,0,.4)';x.fillRect(0,h-6,w,6);},
   (x,w,h)=>{for(let i=0;i<w;i+=32){const g=x.createLinearGradient(i,0,i+32,0);g.addColorStop(0,'#202020');g.addColorStop(.5,'#e0e0e0');g.addColorStop(1,'#202020');x.fillStyle=g;x.fillRect(i,0,32,h);}speckle(x,w,h,3000,.2);},2.4);
  S.wall2=pair(512,(x,w,h)=>{blocks(x,w,h,64,26,'',v=>`rgb(${112+v*44|0},${48+v*20|0},${36+v*14|0})`,'#3a302c',4);speckle(x,w,h,9000,.25);blotch(x,w,h,20,'rgba(20,15,10,.3)',20,90);blotch(x,w,h,10,'rgba(200,200,190,.12)',20,60);},(x,w,h)=>blocksH(x,w,h,64,26,4),3);
  S.tower=pair(512,(x,w,h)=>{x.fillStyle='#8a8a86';x.fillRect(0,0,w,h);blotch(x,w,h,40,'rgba(40,40,40,.25)',20,100);for(let i=0;i<14;i++){const sx=R()*w;const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(30,30,30,.4)');g.addColorStop(1,'rgba(30,30,30,0)');x.fillStyle=g;x.fillRect(sx,0,6+R()*16,h);}
   speckle(x,w,h,12000,.25);x.strokeStyle='rgba(30,30,30,.6)';x.lineWidth=2;for(let i=0;i<=h;i+=128){x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}},null,2);
  const wet=(x,w,h)=>{x.fillStyle='#b0b0b0';x.fillRect(0,0,w,h);blotch(x,w,h,26,'rgba(10,10,10,.9)',14,60);blotch(x,w,h,30,'rgba(40,40,40,.6)',6,30);speckle(x,w,h,3000,.4,2);};
  S.floor0=pair(512,(x,w,h)=>{x.fillStyle='#62666a';x.fillRect(0,0,w,h);blotch(x,w,h,40,'rgba(30,30,30,.25)',20,90);speckle(x,w,h,20000,.22,2);x.strokeStyle='rgba(25,25,25,.7)';x.lineWidth=3;for(let i=0;i<=w;i+=256){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}},null,2,wet);
  S.floor1=pair(512,(x,w,h)=>{x.fillStyle='#34373b';x.fillRect(0,0,w,h);speckle(x,w,h,40000,.3,2);blotch(x,w,h,30,'rgba(15,15,15,.3)',20,80);x.fillStyle='rgba(220,200,120,.7)';x.fillRect(w/2-6,0,12,h*.42);x.fillRect(w/2-6,h*.58,12,h*.42);},null,1.6,wet);
  S.floor2=pair(512,(x,w,h)=>{x.fillStyle='#585a58';x.fillRect(0,0,w,h);blotch(x,w,h,50,'rgba(80,60,40,.18)',15,90);speckle(x,w,h,26000,.25,2);x.strokeStyle='rgba(20,20,20,.5)';x.lineWidth=2;for(let i=0;i<=w;i+=128){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}},null,2,wet);
  S.site=pair(512,(x,w,h)=>{x.fillStyle='#6a6c6a';x.fillRect(0,0,w,h);speckle(x,w,h,20000,.22,2);blotch(x,w,h,30,'rgba(30,30,30,.25)',20,80);x.fillStyle='rgba(220,170,30,.75)';x.fillRect(0,0,w,14);x.fillRect(0,0,14,h);},null,2,wet);
  S.indoor=pair(512,(x,w,h)=>{x.fillStyle='#7d7f7c';x.fillRect(0,0,w,h);blotch(x,w,h,30,'rgba(40,40,40,.2)',30,120);blotch(x,w,h,20,'rgba(220,220,210,.12)',30,100);speckle(x,w,h,12000,.15,2);x.strokeStyle='rgba(30,30,30,.5)';for(let i=0;i<=w;i+=256){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}},null,1.2,(x,w,h)=>{x.fillStyle='#707070';x.fillRect(0,0,w,h);blotch(x,w,h,30,'rgba(20,20,20,.5)',20,60);});
  S.container=pair(512,(x,w,h)=>{x.fillStyle='#bbbbbb';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=26){x.fillStyle='rgba(0,0,0,.28)';x.fillRect(i,0,6,h);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(i+12,0,5,h);}blotch(x,w,h,40,'rgba(90,45,20,.45)',6,40);speckle(x,w,h,6000,.25);x.fillStyle='rgba(30,30,30,.6)';x.fillRect(0,0,w,10);x.fillRect(0,h-12,w,12);},
   (x,w,h)=>{x.fillStyle='#808080';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=26){x.fillStyle='#202020';x.fillRect(i,0,6,h);x.fillStyle='#e0e0e0';x.fillRect(i+12,0,5,h);}},2.4);
  S.raised=S.floor2;S.roof=S.wall;S.thin=S.wall;S.low=S.tower;
 }
 return S;}

// big painted site letter (floor decal)
export function letterTex(ch,col){const c=cnv(256),x=c.getContext('2d');x.font='220px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle=col;x.globalAlpha=.85;x.fillText(ch,128,138);
 const d=x.getImageData(0,0,256,256);for(let i=0;i<d.data.length;i+=4){if(Math.random()<.35)d.data[i+3]*=.4+Math.random()*.4;}x.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
