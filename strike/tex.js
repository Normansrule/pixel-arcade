// STRIKE ZONE — procedural PBR surface library: tileable albedo + normal (from a height field) + roughness, all generated on canvases.
import * as THREE from '../vendor/three.module.min.js';

let seed=1;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
const cnv=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d',{willReadFrequently:true});return c;};
// periodic value noise (fbm) in [0,1]
function fbm(size,cells,oct=4,pers=.5){const out=new Float32Array(size*size);let amp=1,tot=0;
 for(let o=0;o<oct;o++){const n=cells<<o,L=new Float32Array(n*n);for(let i=0;i<n*n;i++)L[i]=R();const s=size/n;
  for(let y=0;y<size;y++){const fy=y/s,iy=Math.floor(fy),ty=fy-iy,sy=ty*ty*(3-2*ty),y0=(iy%n)*n,y1=((iy+1)%n)*n;for(let x=0;x<size;x++){const fx=x/s,ix=Math.floor(fx),tx=fx-ix,sx=tx*tx*(3-2*tx),x0=ix%n,x1=(ix+1)%n;
    const a=L[y0+x0],b=L[y0+x1],c=L[y1+x0],d=L[y1+x1];out[y*size+x]+=((a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy)*amp;}}tot+=amp;amp*=pers;}
 for(let i=0;i<out.length;i++)out[i]/=tot;return out;}
function T(c,srgb=true){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t;}
function normalFrom(hc,str){const w=hc.width,h=hc.height,d=hc.getContext('2d').getImageData(0,0,w,h).data,c=cnv(w,h),x=c.getContext('2d'),o=x.createImageData(w,h);const L=new Float32Array(w*h);for(let i=0;i<w*h;i++)L[i]=d[i*4]/255;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(L[j*w+(i+1)%w]-L[j*w+(i-1+w)%w])*str,dy=(L[((j+1)%h)*w+i]-L[((j-1+h)%h)*w+i])*str,l=Math.hypot(dx,dy,1),k=(j*w+i)*4;o.data[k]=(-dx/l*.5+.5)*255;o.data[k+1]=(dy/l*.5+.5)*255;o.data[k+2]=(1/l*.5+.5)*255;o.data[k+3]=255;}
 x.putImageData(o,0,0);return c;}
// modulate colour/height/roughness canvases with fbm: f(n,px) -> [dc (colour mult), dh (height add), dr (rough add)]
function grain(cx,hx,rx,size,cells,oct,f){const n=fbm(size,cells,oct),cd=cx.getImageData(0,0,size,size),hd=hx.getImageData(0,0,size,size);const rs=rx?rx.canvas.width:0,rd=rx?rx.getImageData(0,0,rs,rs):null;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=y*size+x,k=i*4;const[m,dh,dr]=f(n[i],x,y);cd.data[k]=Math.min(255,cd.data[k]*m);cd.data[k+1]=Math.min(255,cd.data[k+1]*m);cd.data[k+2]=Math.min(255,cd.data[k+2]*m);const hv=Math.max(0,Math.min(255,hd.data[k]+dh*255));hd.data[k]=hd.data[k+1]=hd.data[k+2]=hv;
  if(rd&&dr&&!(x&1)&&!(y&1)){const q=((y>>1)*rs+(x>>1))*4;const v=Math.max(0,Math.min(255,rd.data[q]+dr*255));rd.data[q]=rd.data[q+1]=rd.data[q+2]=v;}}
 cx.putImageData(cd,0,0);hx.putImageData(hd,0,0);if(rd)rx.putImageData(rd,0,0);}
function speck(x,w,h,n,a,sz=2,col){for(let i=0;i<n;i++){const v=R();x.fillStyle=col||(v<.5?`rgba(0,0,0,${a*R()})`:`rgba(255,255,255,${a*R()*.7})`);const s=.6+R()*sz;x.fillRect(R()*w,R()*h,s,s);}}
function blot(x,w,h,n,col,r0,r1){for(let i=0;i<n;i++){const r=r0+R()*(r1-r0),cx=R()*w,cy=R()*h;for(const ox of[-w,0,w])for(const oy of[-h,0,h]){const g=x.createRadialGradient(cx+ox,cy+oy,0,cx+ox,cy+oy,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx+ox-r,cy+oy-r,r*2,r*2);}}}
function streaks(x,w,h,n,col,len=.5){for(let i=0;i<n;i++){const sx=R()*w,sy=R()*h*.4,ww=2+R()*7;const g=x.createLinearGradient(0,sy,0,sy+h*len*(.4+R()));g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(sx,sy,ww,h*len*(.4+R()));}}
const gs=v=>{v=Math.max(0,Math.min(255,v|0));return`rgb(${v},${v},${v})`;};

// make one material set. draw(cx,hx,rx,S): colour ctx, height ctx (grey, mid = 128), rough ctx (half res, pre-scaled)
function mat(size,o,draw){const c=cnv(size),h=cnv(size),r=cnv(size>>1);const cx=c.getContext('2d'),hx=h.getContext('2d'),rx=r.getContext('2d');
 cx.fillStyle=o.base||'#888';cx.fillRect(0,0,size,size);hx.fillStyle='#808080';hx.fillRect(0,0,size,size);rx.fillStyle=gs((o.rough??.85)*255);rx.fillRect(0,0,size>>1,size>>1);
 draw(cx,hx,rx,size);
 return{map:T(c),normalMap:T(normalFrom(h,o.ns??2.4),false),roughnessMap:T(r,false),scale:o.scale||2,rough:1,metal:o.metal||0,nsc:o.nsc||1,env:o.env??1,col:o.col};}
const rxs=(rx,f)=>{rx.save();rx.scale(.5,.5);f();rx.restore();};

const GEN={
 asphalt:()=>mat(512,{base:'#4a4a4c',scale:7,rough:.92,ns:3},(cx,hx,rx,S)=>{blot(cx,S,S,24,'rgba(20,20,22,.35)',30,120);blot(cx,S,S,14,'rgba(120,115,105,.18)',20,90);
  grain(cx,hx,rx,S,16,5,(n,x,y)=>{const v=R();return[.84+n*.3+(v<.04?.35:0),(n-.5)*.18+(v<.05?.08:0),(n-.5)*-.15];});
  hx.strokeStyle='#4a4a4a';cx.strokeStyle='rgba(15,15,15,.75)';for(let i=0;i<9;i++){let a=R()*S,b=R()*S;cx.lineWidth=hx.lineWidth=1+R()*1.6;cx.beginPath();hx.beginPath();cx.moveTo(a,b);hx.moveTo(a,b);for(let k=0;k<8;k++){a+=(R()-.5)*60;b+=(R()-.5)*60;cx.lineTo(a,b);hx.lineTo(a,b);}cx.stroke();hx.stroke();}
  for(let i=0;i<5;i++){const x=R()*S,y=R()*S,r=20+R()*50;const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(8,8,10,.55)');g.addColorStop(1,'rgba(8,8,10,0)');cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2);rxs(rx,()=>{const g2=rx.createRadialGradient(x,y,0,x,y,r);g2.addColorStop(0,'rgba(40,40,40,.8)');g2.addColorStop(1,'rgba(40,40,40,0)');rx.fillStyle=g2;rx.fillRect(x-r,y-r,r*2,r*2);});}
  cx.fillStyle='rgba(210,170,40,.55)';cx.fillRect(S*.48,0,S*.035,S*.38);cx.fillRect(S*.48,S*.62,S*.035,S*.38);}),
 brick:()=>mat(512,{base:'#6a4a3e',scale:2.4,rough:.9,ns:3.2},(cx,hx,rx,S)=>{const bw=64,bh=21;cx.fillStyle='#8a8278';cx.fillRect(0,0,S,S);hx.fillStyle='#3a3a3a';hx.fillRect(0,0,S,S);
  for(let r=0;r<S/bh;r++)for(let c=-1;c<S/bw+1;c++){const ox=(r%2)*bw/2,v=R(),x=c*bw+ox+2,y=r*bh+2;cx.fillStyle=`rgb(${128+v*44|0},${74+v*28|0},${58+v*20|0})`;if(R()<.1)cx.fillStyle=`rgb(${92+v*30|0},${60+v*18|0},${50+v*12|0})`;if(R()<.06)cx.fillStyle=`rgb(${150+v*30|0},${110+v*24|0},${86+v*16|0})`;cx.fillRect(x,y,bw-4,bh-4);hx.fillStyle=gs(150+R()*40);hx.fillRect(x+1,y+1,bw-6,bh-6);}
  grain(cx,hx,rx,S,32,3,(n)=>[.9+n*.2,(n-.5)*.1,0]);streaks(cx,S,S,14,'rgba(20,14,10,.18)',.7);speck(cx,S,S,9000,.22,2);}),
 concrete:()=>mat(512,{base:'#9a9893',scale:4,rough:.9,ns:2},(cx,hx,rx,S)=>{grain(cx,hx,rx,S,12,5,(n)=>[.88+n*.22,(n-.5)*.12,(n-.5)*.1]);blot(cx,S,S,20,'rgba(70,64,58,.14)',30,120);streaks(cx,S,S,22,'rgba(60,55,50,.28)',.6);speck(cx,S,S,14000,.2,2);
  cx.strokeStyle='rgba(50,48,45,.6)';hx.strokeStyle='#505050';cx.lineWidth=hx.lineWidth=3;for(const v of[0,S/2]){cx.beginPath();cx.moveTo(0,v+1);cx.lineTo(S,v+1);cx.stroke();hx.beginPath();hx.moveTo(0,v+1);hx.lineTo(S,v+1);hx.stroke();cx.beginPath();cx.moveTo(v+1,0);cx.lineTo(v+1,S);cx.stroke();hx.beginPath();hx.moveTo(v+1,0);hx.lineTo(v+1,S);hx.stroke();}
  for(const a of[S/4,S*3/4])for(const b of[S/4,S*3/4]){cx.fillStyle='rgba(40,38,36,.8)';cx.beginPath();cx.arc(a,b,5,0,7);cx.fill();hx.fillStyle='#303030';hx.beginPath();hx.arc(a,b,5,0,7);hx.fill();}}),
 concrete2:()=>mat(512,{base:'#5e6064',scale:4,rough:.75,ns:1.6,env:1.2},(cx,hx,rx,S)=>{grain(cx,hx,rx,S,5,5,(n)=>[.8+n*.38,(n-.5)*.08,(n-.5)*.25]);blot(cx,S,S,14,'rgba(20,22,26,.25)',40,140);streaks(cx,S,S,16,'rgba(15,16,20,.3)',.8);speck(cx,S,S,8000,.15,2);
  cx.fillStyle='rgba(20,20,24,.75)';hx.fillStyle='#404040';cx.fillRect(0,0,S,4);hx.fillRect(0,0,S,4);cx.fillRect(0,0,4,S);hx.fillRect(0,0,4,S);cx.fillRect(0,S/2,S,2);hx.fillRect(0,S/2,S,2);}),
 metal:()=>mat(512,{base:'#7c8086',scale:3,rough:.5,metal:.55,ns:3.4,env:1.2},(cx,hx,rx,S)=>{for(let i=0;i<S;i+=32){const g=cx.createLinearGradient(i,0,i+32,0);g.addColorStop(0,'rgba(0,0,0,.28)');g.addColorStop(.5,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(0,0,0,.28)');cx.fillStyle=g;cx.fillRect(i,0,32,S);
   const h=hx.createLinearGradient(i,0,i+32,0);h.addColorStop(0,'#202020');h.addColorStop(.5,'#e0e0e0');h.addColorStop(1,'#202020');hx.fillStyle=h;hx.fillRect(i,0,32,S);}
  grain(cx,hx,rx,S,8,4,(n)=>[.85+n*.3,0,(n-.5)*.4]);blot(cx,S,S,30,'rgba(120,58,22,.4)',6,50);streaks(cx,S,S,40,'rgba(110,52,20,.45)',.5);rxs(rx,()=>{blot(rx,S,S,20,'rgba(255,255,255,.35)',10,60);});speck(cx,S,S,5000,.2);}),
 steel:()=>mat(256,{base:'#3a3d42',scale:2,rough:.42,metal:.75,ns:1.5,env:1.3},(cx,hx,rx,S)=>{grain(cx,hx,rx,S,4,4,(n)=>[.85+n*.3,(n-.5)*.05,(n-.5)*.3]);cx.strokeStyle='rgba(200,200,210,.18)';for(let i=0;i<60;i++){cx.lineWidth=.5+R();cx.beginPath();const a=R()*S,b=R()*S;cx.moveTo(a,b);cx.lineTo(a+(R()-.5)*40,b+(R()-.5)*10);cx.stroke();}
  blot(cx,S,S,10,'rgba(100,50,20,.3)',4,20);speck(cx,S,S,2000,.2);}),
 plate:()=>mat(256,{base:'#6c7075',scale:1.6,rough:.38,metal:.85,ns:4,env:1.3},(cx,hx,rx,S)=>{grain(cx,hx,rx,S,4,4,(n)=>[.8+n*.35,0,(n-.5)*.35]);const st=32;for(let y=0;y<S;y+=st/2)for(let x=0;x<S;x+=st){const ox=((y/(st/2))%2)*st/2;const cxp=x+ox+st/2,cyp=y+st/4;const ang=((y/(st/2))%2)?.6:-.6;
   for(const[ctx,c]of[[cx,'rgba(255,255,255,.22)'],[hx,'#f0f0f0']]){ctx.save();ctx.translate(cxp%S,cyp);ctx.rotate(ang);ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,10,2.6,0,0,7);ctx.fill();ctx.restore();}}
  blot(cx,S,S,8,'rgba(30,25,20,.3)',10,40);speck(cx,S,S,1600,.25);}),
 crate:()=>mat(256,{base:'#9a6e3e',scale:1,rough:.78,ns:2.6},(cx,hx,rx,S)=>{for(let i=0;i<S;i+=32){const v=R();cx.fillStyle=`rgb(${140+v*40|0},${98+v*30|0},${56+v*20|0})`;cx.fillRect(0,i+1,S,30);hx.fillStyle=gs(140+v*30);hx.fillRect(0,i+2,S,28);cx.fillStyle='rgba(40,25,10,.6)';cx.fillRect(0,i,S,2);}
  grain(cx,hx,rx,S,16,3,(n,x,y)=>[.86+n*.28+Math.sin(y*.9+n*8)*.04,(n-.5)*.1,0]);const f=26;cx.fillStyle='#7a5530';hx.fillStyle='#d0d0d0';for(const[a,b,c,d]of[[0,0,S,f],[0,S-f,S,f],[0,0,f,S],[S-f,0,f,S]]){cx.fillRect(a,b,c,d);hx.fillRect(a,b,c,d);}
  cx.save();cx.translate(S/2,S/2);cx.rotate(Math.PI/4);cx.fillRect(-S*.68,-f/2,S*1.36,f);cx.restore();hx.save();hx.translate(S/2,S/2);hx.rotate(Math.PI/4);hx.fillRect(-S*.68,-f/2,S*1.36,f);hx.restore();
  cx.strokeStyle='rgba(30,18,8,.7)';cx.lineWidth=2;cx.strokeRect(f,f,S-2*f,S-2*f);for(const[a,b]of[[12,12],[S-12,12],[12,S-12],[S-12,S-12]]){cx.fillStyle='#2a2a2a';cx.beginPath();cx.arc(a,b,3.5,0,7);cx.fill();}
  cx.fillStyle='rgba(30,20,10,.55)';cx.font='bold 22px monospace';cx.fillText('SZ-'+(100+R()*800|0),f+8,S/2-30);speck(cx,S,S,1500,.18);}),
 container:()=>mat(512,{base:'#d8d8d8',scale:1,rough:.55,metal:.45,ns:3,env:1.1},(cx,hx,rx,S)=>{for(let i=0;i<S;i+=21){const g=cx.createLinearGradient(i,0,i+21,0);g.addColorStop(0,'rgba(0,0,0,.3)');g.addColorStop(.35,'rgba(255,255,255,.18)');g.addColorStop(.7,'rgba(0,0,0,.08)');g.addColorStop(1,'rgba(0,0,0,.3)');cx.fillStyle=g;cx.fillRect(i,0,21,S);
   const h=hx.createLinearGradient(i,0,i+21,0);h.addColorStop(0,'#303030');h.addColorStop(.4,'#e8e8e8');h.addColorStop(.75,'#e8e8e8');h.addColorStop(1,'#303030');hx.fillStyle=h;hx.fillRect(i,0,21,S);}
  cx.fillStyle='rgba(40,40,40,.85)';hx.fillStyle='#f0f0f0';cx.fillRect(0,0,S,16);cx.fillRect(0,S-16,S,16);hx.fillRect(0,0,S,16);hx.fillRect(0,S-16,S,16);
  grain(cx,hx,rx,S,8,4,(n)=>[.86+n*.28,0,(n-.5)*.3]);blot(cx,S,S,40,'rgba(110,55,20,.45)',4,30);streaks(cx,S,S,30,'rgba(90,45,15,.4)',.4);cx.fillStyle='rgba(255,255,255,.75)';cx.font='bold 34px monospace';cx.fillText('SZCU '+(1e5+R()*8e5|0),S*.1,S*.22);}),
 tile:()=>mat(512,{base:'#9c9a96',scale:3,rough:.35,ns:2.2,env:1.1},(cx,hx,rx,S)=>{const n=6,s=S/n;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const v=R();cx.fillStyle=`rgb(${150+v*24|0},${148+v*22|0},${142+v*20|0})`;cx.fillRect(i*s+2,j*s+2,s-4,s-4);hx.fillStyle=gs(150);hx.fillRect(i*s+2,j*s+2,s-4,s-4);}
  cx.strokeStyle='rgba(60,58,55,.9)';cx.lineWidth=3;hx.strokeStyle='#505050';hx.lineWidth=3;for(let i=0;i<=n;i++){cx.beginPath();cx.moveTo(i*s,0);cx.lineTo(i*s,S);cx.moveTo(0,i*s);cx.lineTo(S,i*s);cx.stroke();hx.beginPath();hx.moveTo(i*s,0);hx.lineTo(i*s,S);hx.moveTo(0,i*s);hx.lineTo(S,i*s);hx.stroke();}
  grain(cx,hx,rx,S,6,4,(n)=>[.88+n*.24,0,(n-.5)*.35]);blot(cx,S,S,12,'rgba(60,55,50,.2)',20,90);speck(cx,S,S,4000,.12);}),
 terracotta:()=>mat(512,{base:'#a8603e',scale:2.4,rough:.7,ns:2.6},(cx,hx,rx,S)=>{const n=8,s=S/n;for(let j=0;j<n;j++)for(let i=0;i<n;i++){const v=R();cx.fillStyle=`rgb(${168+v*40|0},${88+v*30|0},${56+v*22|0})`;cx.fillRect(i*s+2,j*s+2,s-4,s-4);hx.fillStyle=gs(160+R()*30);hx.fillRect(i*s+3,j*s+3,s-6,s-6);}
  grain(cx,hx,rx,S,12,4,(n)=>[.84+n*.32,(n-.5)*.1,(n-.5)*.3]);blot(cx,S,S,16,'rgba(80,40,20,.2)',20,80);speck(cx,S,S,6000,.18);}),
 wood:()=>mat(256,{base:'#7a5232',scale:1.6,rough:.6,ns:1.6},(cx,hx,rx,S)=>{for(let i=0;i<S;i+=32){const v=R();cx.fillStyle=`rgb(${110+v*36|0},${74+v*26|0},${44+v*16|0})`;cx.fillRect(0,i,S,31);hx.fillStyle=gs(150);hx.fillRect(0,i+1,S,29);}
  grain(cx,hx,rx,S,4,4,(n,x,y)=>[.8+.25*Math.sin(y*.55+n*14)+n*.15,(n-.5)*.06,0]);cx.fillStyle='rgba(30,18,8,.6)';for(let i=0;i<S;i+=32)cx.fillRect(0,i,S,1.5);speck(cx,S,S,1200,.12);}),
 deck:()=>mat(512,{base:'#6e5038',scale:2.4,rough:.7,ns:3},(cx,hx,rx,S)=>{const bw=S/10;for(let i=0;i<10;i++){let y=0;while(y<S){const len=S*(.3+R()*.5),v=R();cx.fillStyle=`rgb(${104+v*40|0},${74+v*26|0},${50+v*18|0})`;cx.fillRect(i*bw+3,y,bw-6,len-3);hx.fillStyle=gs(170);hx.fillRect(i*bw+3,y,bw-6,len-3);y+=len;}}
  cx.fillStyle='#120c08';hx.fillStyle='#202020';for(let i=0;i<=10;i++){cx.fillRect(i*bw-3,0,6,S);hx.fillRect(i*bw-3,0,6,S);}grain(cx,hx,rx,S,6,4,(n,x,y)=>[.82+.18*Math.sin(x*.4+n*12)+n*.2,(n-.5)*.08,(n-.5)*.3]);speck(cx,S,S,3000,.15);}),
 membrane:()=>mat(512,{base:'#3c403c',scale:5,rough:.88,ns:2.4},(cx,hx,rx,S)=>{grain(cx,hx,rx,S,10,5,(n)=>{const v=R();return[.8+n*.4+(v<.03?.4:0),(n-.5)*.14+(v<.03?.08:0),(n-.5)*.2];});blot(cx,S,S,14,'rgba(20,22,20,.35)',40,140);
  cx.fillStyle='rgba(15,16,15,.8)';hx.fillStyle='#a8a8a8';for(const y of[S/3,S*2/3])for(const[c,h]of[[cx,hx]]){c.fillRect(0,y,S,6);h.fillRect(0,y,S,6);}cx.fillStyle='rgba(255,255,255,.04)';for(const y of[S/3,S*2/3])cx.fillRect(0,y+6,S,3);
  for(let i=0;i<6;i++){const x=R()*S,y=R()*S,r=20+R()*40;const g=cx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(5,10,14,.6)');g.addColorStop(1,'rgba(5,10,14,0)');cx.fillStyle=g;cx.fillRect(x-r,y-r,r*2,r*2);rxs(rx,()=>{const g2=rx.createRadialGradient(x,y,0,x,y,r);g2.addColorStop(0,'rgba(30,30,30,.9)');g2.addColorStop(1,'rgba(30,30,30,0)');rx.fillStyle=g2;rx.fillRect(x-r,y-r,r*2,r*2);});}}),
 fabric:()=>mat(256,{base:'#d0d0d0',scale:1,rough:.95,ns:1.2},(cx,hx,rx,S)=>{for(let y=0;y<S;y+=2){cx.fillStyle=y%4?'rgba(0,0,0,.06)':'rgba(255,255,255,.05)';cx.fillRect(0,y,S,1);}for(let x=0;x<S;x+=2){hx.fillStyle=x%4?'#909090':'#707070';hx.fillRect(x,0,1,S);}grain(cx,hx,rx,S,8,3,(n)=>[.85+n*.3,0,0]);}),
 glass:()=>mat(128,{base:'#20323e',scale:2,rough:.06,metal:.9,ns:.4,env:1.6},(cx,hx,rx,S)=>{grain(cx,hx,rx,S,4,3,(n)=>[.9+n*.2,0,(n-.5)*.05]);cx.fillStyle='rgba(180,220,255,.08)';cx.fillRect(0,0,S,S/3);}),
 cobble:()=>mat(512,{base:'#7e7468',scale:3.2,rough:.82,ns:4},(cx,hx,rx,S)=>{cx.fillStyle='#4e463e';cx.fillRect(0,0,S,S);hx.fillStyle='#2a2a2a';hx.fillRect(0,0,S,S);const rows=10,rh=S/rows;
  for(let r=0;r<rows;r++){let x=(r%2)*rh*.5-rh;while(x<S+rh){const w=rh*(.8+R()*.5),v=R();const cxp=x+w/2,cyp=r*rh+rh/2;for(const ox of[-S,0,S]){cx.fillStyle=`rgb(${120+v*50|0},${110+v*44|0},${98+v*36|0})`;cx.beginPath();cx.ellipse(cxp+ox,cyp,w/2-2.5,rh/2-2.5,0,0,7);cx.fill();
     const g=hx.createRadialGradient(cxp+ox,cyp,0,cxp+ox,cyp,w/2);g.addColorStop(0,'#e8e8e8');g.addColorStop(.7,'#b0b0b0');g.addColorStop(1,'#404040');hx.fillStyle=g;hx.beginPath();hx.ellipse(cxp+ox,cyp,w/2-2.5,rh/2-2.5,0,0,7);hx.fill();}x+=w;}}
  grain(cx,hx,rx,S,10,4,(n)=>[.82+n*.36,(n-.5)*.1,(n-.5)*.3]);blot(cx,S,S,14,'rgba(60,50,40,.2)',30,110);speck(cx,S,S,8000,.18);}),
 cobble2:()=>mat(512,{base:'#c8bca6',scale:4,rough:.8,ns:2.6},(cx,hx,rx,S)=>{cx.fillStyle='#8a8070';cx.fillRect(0,0,S,S);hx.fillStyle='#303030';hx.fillRect(0,0,S,S);let y=0;while(y<S){const h=S/4;let x=(R()*S/3)-S/3;while(x<S){const w=S*(.2+R()*.25),v=R();for(const ox of[-S,0,S]){cx.fillStyle=`rgb(${196+v*30|0},${184+v*26|0},${160+v*22|0})`;cx.fillRect(x+ox+3,y+3,w-6,h-6);hx.fillStyle=gs(170+R()*20);hx.fillRect(x+ox+4,y+4,w-8,h-8);}x+=w;}y+=h;}
  grain(cx,hx,rx,S,8,5,(n)=>[.86+n*.28,(n-.5)*.08,(n-.5)*.2]);blot(cx,S,S,20,'rgba(120,100,70,.18)',20,90);speck(cx,S,S,10000,.15);}),
 stone:()=>mat(512,{base:'#cbbd9e',scale:4.5,rough:.88,ns:3},(cx,hx,rx,S)=>{cx.fillStyle='#9a8c72';cx.fillRect(0,0,S,S);hx.fillStyle='#3a3a3a';hx.fillRect(0,0,S,S);const rh=S/6;for(let r=0;r<6;r++){let x=(r%2)*S*.18-S*.2;while(x<S){const w=S*(.24+R()*.16),v=R();for(const ox of[-S,0,S]){cx.fillStyle=`rgb(${200+v*28|0},${188+v*24|0},${160+v*20|0})`;cx.fillRect(x+ox+2,r*rh+2,w-4,rh-4);
     const g=hx.createLinearGradient(0,r*rh,0,r*rh+rh);g.addColorStop(0,'#a0a0a0');g.addColorStop(.12,'#d8d8d8');g.addColorStop(.88,'#d0d0d0');g.addColorStop(1,'#909090');hx.fillStyle=g;hx.fillRect(x+ox+3,r*rh+3,w-6,rh-6);}x+=w;}}
  grain(cx,hx,rx,S,8,5,(n)=>[.82+n*.34,(n-.5)*.14,(n-.5)*.15]);streaks(cx,S,S,20,'rgba(90,80,60,.25)',.5);blot(cx,S,S,16,'rgba(110,100,70,.2)',20,80);speck(cx,S,S,14000,.2);}),
 plaster:()=>mat(512,{base:'#ece4d6',scale:3,rough:.92,ns:2.2},(cx,hx,rx,S)=>{grain(cx,hx,rx,S,8,6,(n)=>[.86+n*.24,(n-.5)*.2,0]);blot(cx,S,S,16,'rgba(150,130,100,.16)',30,120);streaks(cx,S,S,6,'rgba(120,100,80,.12)',.6);
  for(let i=0;i<2;i++){const x=R()*S,y=R()*S,w=30+R()*50,h=20+R()*30;cx.fillStyle='#9a6a4c';cx.fillRect(x,y,w,h);hx.fillStyle='#606060';hx.fillRect(x,y,w,h);cx.strokeStyle='#6a4632';cx.lineWidth=1.5;for(let yy=y;yy<y+h;yy+=10)for(let xx=x+((yy-y)/10%2)*8;xx<x+w;xx+=16)cx.strokeRect(xx,yy,16,10);}
  speck(cx,S,S,6000,.12);}),
 roof:()=>mat(256,{base:'#b5583a',scale:2,rough:.75,ns:3.6},(cx,hx,rx,S)=>{const rows=8,rh=S/rows,cw=S/8;for(let r=0;r<rows;r++)for(let c=-1;c<9;c++){const x=c*cw+(r%2)*cw/2,y=r*rh,v=R();const g=cx.createLinearGradient(x,0,x+cw,0);g.addColorStop(0,`rgb(${120+v*30|0},${50+v*16|0},${30+v*10|0})`);g.addColorStop(.5,`rgb(${200+v*30|0},${100+v*24|0},${66+v*16|0})`);g.addColorStop(1,`rgb(${120+v*30|0},${50+v*16|0},${30+v*10|0})`);cx.fillStyle=g;cx.fillRect(x,y,cw,rh-2);
   const h=hx.createLinearGradient(x,0,x+cw,0);h.addColorStop(0,'#404040');h.addColorStop(.5,'#f0f0f0');h.addColorStop(1,'#404040');hx.fillStyle=h;hx.fillRect(x,y,cw,rh-2);}
  grain(cx,hx,rx,S,8,4,(n)=>[.85+n*.3,0,0]);blot(cx,S,S,10,'rgba(40,40,30,.25)',10,40);}),
 painted:()=>mat(256,{base:'#4e6a64',scale:2,rough:.55,metal:.35,ns:1.4,env:1.1},(cx,hx,rx,S)=>{grain(cx,hx,rx,S,8,4,(n)=>[.88+n*.24,(n-.5)*.05,(n-.5)*.3]);for(let i=0;i<70;i++){const x=R()*S,y=R()*S,r=1+R()*5;cx.fillStyle='#5a5c60';cx.beginPath();cx.ellipse(x,y,r*1.6,r,R()*3,0,7);cx.fill();hx.fillStyle='#606060';hx.beginPath();hx.ellipse(x,y,r*1.6,r,R()*3,0,7);hx.fill();}
  streaks(cx,S,S,16,'rgba(90,50,20,.35)',.5);cx.fillStyle='rgba(220,170,40,.85)';for(let i=0;i<S;i+=24){cx.save();cx.beginPath();cx.rect(0,S-18,S,18);cx.clip();cx.fillRect(i,S-18,12,18);cx.restore();}speck(cx,S,S,2000,.2);}),
 hazard:()=>mat(128,{base:'#d8a81c',scale:1,rough:.6,ns:1},(cx,hx,rx,S)=>{cx.fillStyle='#1a1a1a';for(let i=-S;i<S*2;i+=32){cx.beginPath();cx.moveTo(i,0);cx.lineTo(i+16,0);cx.lineTo(i+16+S,S);cx.lineTo(i+S,S);cx.fill();}grain(cx,hx,rx,S,4,3,(n)=>[.8+n*.3,0,0]);speck(cx,S,S,800,.3);}),
};
const CACHE={};
export function surf(key){if(!GEN[key])key='concrete';if(!CACHE[key]){seed=1+[...key].reduce((a,c)=>a*31+c.charCodeAt(0),7)%9973;CACHE[key]=GEN[key]();}return CACHE[key];}
export const SURF_KEYS=Object.keys(GEN);

/* ---------- small effect / UI textures ---------- */
const FXC={};
export function fxTex(k){if(FXC[k])return FXC[k];seed=99+k.length;let c;
 if(k==='hole'){c=cnv(64);const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(5,5,5,1)');g.addColorStop(.16,'rgba(12,10,8,.95)');g.addColorStop(.3,'rgba(50,44,38,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);x.strokeStyle='rgba(20,16,12,.55)';for(let i=0;i<7;i++){const a=R()*6.28;x.beginPath();x.moveTo(32,32);x.lineTo(32+Math.cos(a)*(10+R()*14),32+Math.sin(a)*(10+R()*14));x.stroke();}}
 else if(k==='scorch'){c=cnv(128);const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,62);g.addColorStop(0,'rgba(8,6,5,.95)');g.addColorStop(.5,'rgba(18,14,12,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);}
 else if(k==='puff'){c=cnv(128);const x=c.getContext('2d');for(let i=0;i<26;i++){const r=14+R()*30,cx=64+(R()-.5)*50,cy=64+(R()-.5)*50,g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.34)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);}
  const m=x.getImageData(0,0,128,128);for(let j=0;j<128;j++)for(let i=0;i<128;i++){const d=Math.hypot(i-64,j-64)/64;m.data[(j*128+i)*4+3]*=Math.max(0,1-d*d);}x.putImageData(m,0,0);FXC[k]=new THREE.CanvasTexture(c);return FXC[k];}
 else if(k==='flash'){c=cnv(128);const x=c.getContext('2d');x.translate(64,64);for(let i=0;i<7;i++){x.rotate(Math.PI*2/7+R()*.3);const g=x.createLinearGradient(0,0,58,0);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(1,'rgba(255,140,40,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,-7);x.lineTo(56+R()*6,0);x.lineTo(0,7);x.fill();}
  const g=x.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,180,80,0)');x.fillStyle=g;x.fillRect(-64,-64,128,128);}
 else if(k==='glow'){c=cnv(64);const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.25,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);}
 else if(k==='windows'){c=cnv(256,512);const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,256,512);for(let j=0;j<32;j++){const floorOn=R()<.75;for(let i=0;i<8;i++){const on=floorOn&&R()<.38;x.fillStyle='rgba(40,50,70,.35)';x.fillRect(i*32+5,j*16+4,22,9);if(!on)continue;const v=R();x.fillStyle=v<.75?`rgba(255,${210+R()*30|0},${150+R()*50|0},${.35+R()*.45})`:v<.93?`rgba(160,210,255,${.35+R()*.4})`:`rgba(255,120,200,${.45+R()*.3})`;x.fillRect(i*32+5,j*16+4,22,9);}}}
 else if(k==='helipad'){c=cnv(512);const x=c.getContext('2d');x.clearRect(0,0,512,512);x.strokeStyle='rgba(250,240,220,.9)';x.lineWidth=18;x.beginPath();x.arc(256,256,220,0,7);x.stroke();x.fillStyle='rgba(250,240,220,.92)';x.fillRect(150,120,50,272);x.fillRect(312,120,50,272);x.fillRect(150,230,212,50);
  const d=x.getImageData(0,0,512,512);for(let i=3;i<d.data.length;i+=4)if(R()<.3)d.data[i]*=.5+R()*.4;x.putImageData(d,0,0);}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;if(k==='windows'){t.wrapS=t.wrapT=THREE.RepeatWrapping;}FXC[k]=t;return t;}
// neon / billboard sign texture with a word and a glow
export function signTex(word,col,w=1024,h=384){const c=cnv(w,h),x=c.getContext('2d');x.fillStyle='#05040a';x.fillRect(0,0,w,h);const css='#'+new THREE.Color(col).getHexString();x.strokeStyle=css;x.lineWidth=10;x.shadowColor=css;x.shadowBlur=30;x.strokeRect(24,24,w-48,h-48);
 x.font=`${h*.52|0}px Anton, Impact, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.shadowBlur=40;x.fillText(word,w/2,h/2+8);x.shadowBlur=0;x.fillStyle=css;x.globalAlpha=.35;x.fillText(word,w/2,h/2+8);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
