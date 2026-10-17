// IRON VANGUARD (adapted from FRONTLINE OPS) — procedural textures (canvas + value noise) with derived normal maps. No image files.
import * as THREE from '../vendor/three.module.min.js';

let seed=1337;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
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
 S.brick=pair(512,(x,w,h)=>{x.fillStyle='#8a8070';x.fillRect(0,0,w,h);const bw=64,bh=26;for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const ox=(r%2)*bw/2,v=R();x.fillStyle=`rgb(${176+v*50|0},${92+v*30|0},${70+v*22|0})`;x.fillRect(c*bw+ox+2,r*bh+2,bw-4,bh-4);}speckle(x,w,h,9000,.22);const N=fbm(w,6,4);paintNoise(x,w,h,N,n=>[n*200,n*190,n*170],.15);},
  (x,w,h)=>{grey(x,w,h,40);const bw=64,bh=26;for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){x.fillStyle='#b0b0b0';x.fillRect(c*bw+(r%2)*bw/2+3,r*bh+3,bw-6,bh-6);}speckle(x,w,h,8000,.3);},3);
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
 S.roof=pair(256,(x,w,h)=>{grey(x,w,h,120);const N=fbm(w,8,4);paintNoise(x,w,h,N,n=>{const v=96+n*50;return[v,v-2,v-4];});speckle(x,w,h,12000,.3,2);},null,2);
 // terracotta roof tiles (rows across v)
 S.tiles=pair(256,(x,w,h)=>{x.fillStyle='#7a3a22';x.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<8;c++){const v=R()*30,ox=(r%2)*16;const g=x.createLinearGradient(0,r*32,0,r*32+32);g.addColorStop(0,`rgb(${150+v|0},${70+v*.5|0},${44|0})`);g.addColorStop(1,`rgb(${196+v|0},${100+v|0},${62+v*.5|0})`);x.fillStyle=g;x.beginPath();x.ellipse(c*32+ox+16,r*32+18,15,17,0,0,Math.PI);x.fill();x.fillRect(c*32+ox+1,r*32,30,18);}speckle(x,w,h,4000,.2);},
  (x,w,h)=>{grey(x,w,h,30);for(let r=0;r<8;r++)for(let c=0;c<9;c++){const ox=(r%2)*16;const g=x.createLinearGradient(c*32+ox,0,c*32+ox+32,0);g.addColorStop(0,'#404040');g.addColorStop(.5,'#e0e0e0');g.addColorStop(1,'#404040');x.fillStyle=g;x.fillRect(c*32+ox-16,r*32+2,30,28);}},3);
 // ---------- ground ----------
 const ground=(base,alt,p=6,spk=.25,pebbles=0,hstr=2)=>pair(512,(x,w,h)=>{grey(x,w,h,128);const N=fbm(w,p,5),N2=fbm(w,p*4,3);paintNoise(x,w,h,N,(n,i,j)=>{const m=Math.min(1,Math.max(0,(N2[j*w+i]-.42)*3));return[base[0]*(1-m)+alt[0]*m+(n-.5)*60,base[1]*(1-m)+alt[1]*m+(n-.5)*56,base[2]*(1-m)+alt[2]*m+(n-.5)*48];});
  speckle(x,w,h,26000,spk,2);for(let i=0;i<pebbles;i++){const v=R()*70+90;x.fillStyle=`rgb(${v|0},${v*.94|0},${v*.85|0})`;x.beginPath();x.ellipse(R()*w,R()*h,1+R()*3,1+R()*2,R()*3,0,7);x.fill();}},null,hstr);
 S.sand=ground([214,190,150],[196,168,126],5,.18,600,1.6);
 S.dirt=ground([150,132,104],[118,104,80],6,.25,900,2.2);
 S.snow=ground([236,240,246],[214,222,234],5,.08,0,1.0);
 S.grass=ground([108,122,70],[136,138,84],7,.22,200,2);
 S.gravel=ground([150,146,138],[120,118,112],10,.4,2600,3);

 S.sandbag=pair(256,(x,w,h)=>{x.fillStyle='#6d6247';x.fillRect(0,0,w,h);const bh=32,bw=64;for(let r=0;r<h/bh;r++)for(let c=-1;c<w/bw+1;c++){const ox=(r%2)*bw/2,cx=c*bw+ox+bw/2,cy=r*bh+bh/2,g=x.createRadialGradient(cx,cy-4,4,cx,cy,bw*.55);const v=R()*20;g.addColorStop(0,`rgb(${196+v|0},${178+v|0},${136+v|0})`);g.addColorStop(1,'rgb(96,84,60)');x.fillStyle=g;x.beginPath();x.ellipse(cx,cy,bw*.49,bh*.48,0,0,7);x.fill();}speckle(x,w,h,5000,.18);},null,3.2);
 S.hesco=pair(256,(x,w,h)=>{x.fillStyle='#b8a888';x.fillRect(0,0,w,h);const N=fbm(w,6,4);paintNoise(x,w,h,N,n=>[150+n*80,138+n*72,106+n*60]);x.strokeStyle='rgba(70,70,64,.85)';x.lineWidth=2;for(let i=0;i<=w;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}x.lineWidth=6;x.strokeStyle='#4c4c46';for(let i=0;i<=w;i+=128){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}},null,2.5);
 S.asphalt=pair(512,(x,w,h)=>{grey(x,w,h,80);const N=fbm(w,6,5);paintNoise(x,w,h,N,n=>{const v=70+n*40;return[v,v,v+4];});speckle(x,w,h,40000,.3,2);
  x.strokeStyle='rgba(20,20,20,.55)';x.lineWidth=1.5;for(let i=0;i<8;i++){let px=R()*w,py=R()*h;x.beginPath();x.moveTo(px,py);for(let k=0;k<10;k++){px+=R()*24-12;py+=R()*24-12;x.lineTo(px,py);}x.stroke();}},null,1.4);
 S.cobble=pair(512,(x,w,h)=>{x.fillStyle='#7a726a';x.fillRect(0,0,w,h);const s=32;for(let r=0;r<h/s;r++)for(let c=-1;c<w/s+1;c++){const v=R()*40,ox=(r%2)*s/2;x.fillStyle=`rgb(${130+v|0},${122+v|0},${112+v|0})`;x.beginPath();x.ellipse(c*s+ox+s/2,r*s+s/2,s*.45,s*.42,R(),0,7);x.fill();}speckle(x,w,h,9000,.2);},
  (x,w,h)=>{grey(x,w,h,20);const s=32;seed=7;for(let r=0;r<h/s;r++)for(let c=-1;c<w/s+1;c++){const ox=(r%2)*s/2,g=x.createRadialGradient(c*s+ox+s/2,r*s+s/2,2,c*s+ox+s/2,r*s+s/2,s*.46);g.addColorStop(0,'#fff');g.addColorStop(1,'#333');x.fillStyle=g;x.beginPath();x.ellipse(c*s+ox+s/2,r*s+s/2,s*.45,s*.42,0,0,7);x.fill();}},3);
 S.slab=pair(512,(x,w,h)=>{grey(x,w,h,170);const N=fbm(w,6,5);paintNoise(x,w,h,N,n=>{const v=150+n*55;return[v,v-2,v-6];});speckle(x,w,h,16000,.2);x.strokeStyle='rgba(40,38,36,.5)';x.lineWidth=3;for(let i=0;i<=w;i+=128){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}
  for(let i=0;i<10;i++){x.fillStyle=`rgba(40,36,30,${.1+R()*.15})`;x.beginPath();x.ellipse(R()*w,R()*h,10+R()*40,6+R()*20,R()*3,0,7);x.fill();}},
  (x,w,h)=>{grey(x,w,h,140);speckle(x,w,h,20000,.3,2);x.strokeStyle='#202020';x.lineWidth=4;for(let i=0;i<=w;i+=128){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}},2);
 // ---------- soldiers: kit atlas (left half camo, right half neutral cloth) ----------
 const kit=(base,cols,neutral)=>{const c=cnv(256),x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,128,256);for(const col of cols)for(let i=0;i<16;i++){x.fillStyle=col;x.beginPath();let px=R()*128,py=R()*256;x.moveTo(px,py);for(let k=0;k<7;k++)x.lineTo(px+Math.cos(k)*(6+R()*16),py+Math.sin(k)*(5+R()*12));x.fill();}
  x.fillStyle=neutral;x.fillRect(128,0,128,256);speckle(x,256,256,5000,.12,1);
  // fabric weave
  x.globalAlpha=.08;for(let i=0;i<256;i+=3){x.fillStyle=i%6?'#000':'#fff';x.fillRect(0,i,256,1);}x.globalAlpha=1;return T(c);};
 S.kitA=kit('#8a7a58',['#6a6244','#a69470','#585a3e','#7a6a4a'],'#e8e8e8');
 S.kitB=kit('#6e7068',['#53554e','#888a80','#5c5e56','#45473f'],'#e8e8e8');
 // ---------- sprites ----------
 {const c=cnv(64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,30);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.16,'rgba(10,8,6,.95)');g.addColorStop(.28,'rgba(40,36,30,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  x.strokeStyle='rgba(20,18,15,.6)';for(let i=0;i<7;i++){const a=R()*6.28;x.beginPath();x.moveTo(32,32);x.lineTo(32+Math.cos(a)*(10+R()*14),32+Math.sin(a)*(10+R()*14));x.stroke();}S.hole=clampT(T(c));}
 {const c=cnv(128),x=c.getContext('2d');for(let i=0;i<40;i++){const r=10+R()*50,cx=64+R()*30-15,cy=64+R()*30-15,g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(5,4,3,.5)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);}S.scorch=clampT(T(c));}
 {const c=cnv(128),x=c.getContext('2d');x.translate(64,64);for(let i=0;i<7;i++){x.rotate(Math.PI*2/7);const g=x.createLinearGradient(0,0,0,62);g.addColorStop(0,'rgba(255,245,215,1)');g.addColorStop(.35,'rgba(255,180,70,.85)');g.addColorStop(1,'rgba(255,100,20,0)');x.fillStyle=g;x.beginPath();x.moveTo(-8,0);x.lineTo(0,34+R()*28);x.lineTo(8,0);x.fill();}
  const g=x.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,'rgba(255,255,245,1)');g.addColorStop(.5,'rgba(255,200,110,.7)');g.addColorStop(1,'rgba(255,140,50,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,30,0,7);x.fill();S.flash=clampT(T(c));}
 // side-on muzzle flame (for the viewmodel side plane)
 {const c=cnv(128,64),x=c.getContext('2d');const g=x.createRadialGradient(10,32,0,10,32,110);g.addColorStop(0,'rgba(255,250,230,1)');g.addColorStop(.25,'rgba(255,190,90,.85)');g.addColorStop(1,'rgba(255,110,30,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,32);x.quadraticCurveTo(50,4,128,30);x.lineTo(128,34);x.quadraticCurveTo(50,60,0,32);x.fill();S.flashSide=clampT(T(c));}
 {const c=cnv(128),x=c.getContext('2d');const N=fbm(128,4,4);const im=x.createImageData(128,128);for(let j=0;j<128;j++)for(let i=0;i<128;i++){const d=Math.hypot(i-64,j-64)/64,k=(j*128+i)*4,a=Math.max(0,1-d*d)*(.45+N[j*128+i]*.9);im.data[k]=im.data[k+1]=im.data[k+2]=255;im.data[k+3]=Math.min(255,a*200);}x.putImageData(im,0,0);S.puff=clampT(T(c));}
 {const c=cnv(64),x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);S.glow=clampT(T(c));}
 {const c=cnv(256),x=c.getContext('2d');x.fillStyle='#5a5c5e';x.fillRect(0,0,256,256);speckle(x,256,256,9000,.3);x.strokeStyle='#f0e8d8';x.lineWidth=10;x.beginPath();x.arc(128,128,108,0,7);x.stroke();x.fillStyle='#f0e8d8';x.fillRect(78,64,22,128);x.fillRect(156,64,22,128);x.fillRect(78,117,100,22);S.pad=T(c);}
 // foliage cards
 {const c=cnv(64,128),x=c.getContext('2d');for(let i=0;i<26;i++){const bx=6+R()*52,g=x.createLinearGradient(0,128,0,20);const v=R()*40;g.addColorStop(0,`rgb(${70+v|0},${84+v|0},${40+v*.5|0})`);g.addColorStop(1,`rgb(${150+v|0},${160+v|0},${90+v|0})`);x.strokeStyle=g;x.lineWidth=2+R()*2;x.beginPath();x.moveTo(bx,128);x.quadraticCurveTo(bx+R()*10-5,80,bx+R()*24-12,20+R()*40);x.stroke();}S.grassCard=clampT(T(c));}
 {const c=cnv(256,128),x=c.getContext('2d');// palm frond (alpha)
  x.strokeStyle='#5a6a2a';x.lineWidth=4;x.beginPath();x.moveTo(4,64);x.quadraticCurveTo(128,40,252,70);x.stroke();for(let i=0;i<46;i++){const t=i/46,px=4+t*248,py=64-Math.sin(t*Math.PI)*18+t*6,len=(1-Math.abs(t-.35))*56;for(const s of[-1,1]){const v=R()*30;x.strokeStyle=`rgb(${80+v|0},${118+v|0},${46+v*.5|0})`;x.lineWidth=3;x.beginPath();x.moveTo(px,py);x.lineTo(px+12,py+s*len);x.stroke();}}S.palm=clampT(T(c));}
 {const c=cnv(128),x=c.getContext('2d');x.fillStyle='#3a5230';x.fillRect(0,0,128,128);for(let i=0;i<300;i++){const v=R()*50;x.fillStyle=`rgb(${48+v|0},${80+v|0},${40+v*.4|0})`;x.beginPath();x.ellipse(R()*128,R()*128,3+R()*6,2+R()*3,R()*3,0,7);x.fill();}S.leaf=T(c);}
 {const c=cnv(128),x=c.getContext('2d');x.fillStyle='#9a8466';x.fillRect(0,0,128,128);for(let i=0;i<128;i+=4){x.fillStyle=`rgba(40,30,18,${R()*.45})`;x.fillRect(i,0,2,128);}S.bark=T(c);}
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
 // night/dusk lit window emissive mask (only the lit cell)
 {const c=cnv(256),x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,256,256);x.fillStyle='#ffd090';x.fillRect(148,144,40,96);x.fillRect(196,144,40,96);x.fillStyle='#000';x.fillRect(188,144,8,96);x.fillRect(148,188,88,6);S.winE=clampT(T(c));}
 // cloth (awnings / tarps)
 {const c=cnv(128),x=c.getContext('2d');grey(x,128,128,235);for(let i=0;i<128;i+=16){x.fillStyle='rgba(0,0,0,.06)';x.fillRect(i,0,8,128);}speckle(x,128,128,2000,.1);S.cloth=T(c);}
 {const c=cnv(128),x=c.getContext('2d');grey(x,128,128,235);for(let i=0;i<128;i+=32){x.fillStyle='rgba(255,255,255,.9)';x.fillRect(i,0,16,128);x.fillStyle='rgba(0,0,0,0)';}S.stripe=T(c);}
 // hazard stripes
 {const c=cnv(128,32),x=c.getContext('2d');x.fillStyle='#e8b81a';x.fillRect(0,0,128,32);x.fillStyle='#1a1a1a';for(let i=-32;i<160;i+=32){x.beginPath();x.moveTo(i,32);x.lineTo(i+16,32);x.lineTo(i+32,0);x.lineTo(i+16,0);x.fill();}S.hazard=T(c);}
 // signs with original names
 S.sign=(text,bg,fg,w=512,h=128)=>{const c=cnv(w,h),x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=fg;x.font=`bold ${h*.55|0}px Impact, 'Arial Narrow', sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2+2);speckle(x,w,h,1500,.15);const t=T(c);t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;};
 // water normal (tileable ripples)
 {const s=256,c=cnv(s),x=c.getContext('2d');grey(x,s,s,128);const N=fbm(s,8,4);paintNoise(x,s,s,N,n=>[n*255,n*255,n*255]);S.waterN=T(normalFrom(c,3),false);}
 // ---------- valley ground, rock, vehicles ----------
 S.meadow=ground([92,112,56],[128,130,70],7,.2,120,2);
 S.rock=ground([132,128,120],[104,100,94],9,.35,400,3);
 S.mud=ground([104,90,70],[84,74,58],6,.3,500,2);
 const blot=(x,cx,cy,r,f)=>{x.fillStyle=f;for(const ox of[-512,0,512])for(const oy of[-512,0,512]){x.beginPath();x.arc(cx+ox,cy+oy,r,0,7);x.fill();}};
 S.camo=(cols)=>{const c=cnv(512),x=c.getContext('2d');x.fillStyle=cols[0];x.fillRect(0,0,512,512);for(let k=1;k<4;k++)for(let i=0;i<14;i++){const cx=R()*512,cy=R()*512;for(let j=0;j<6;j++)blot(x,cx+(R()-.5)*70,cy+(R()-.5)*50,14+R()*26,cols[k]);}
  speckle(x,512,512,16000,.12);x.strokeStyle='rgba(0,0,0,.28)';x.lineWidth=2;for(let i=0;i<5;i++){x.beginPath();x.moveTo(R()*512,0);x.lineTo(R()*512,512);x.stroke();}x.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<160;i++){x.beginPath();x.arc(R()*512,R()*512,1.6,0,7);x.fill();}
  for(let i=0;i<40;i++){const g=x.createLinearGradient(0,0,0,80);g.addColorStop(0,'rgba(30,22,14,.25)');g.addColorStop(1,'rgba(30,22,14,0)');x.fillStyle=g;x.save();x.translate(R()*512,R()*512);x.fillRect(0,0,3+R()*5,60+R()*50);x.restore();}return T(c);};
 S.camoA=S.camo(['#5b6236','#454b28','#6f7547','#3a3d24']);S.camoB=S.camo(['#6c7178','#4b4f55','#8c9198','#33363a']);
 {const c=cnv(64),x=c.getContext('2d');x.fillStyle='#2b2a28';x.fillRect(0,0,64,64);for(let i=0;i<4;i++){const y=i*16;x.fillStyle='#4a4844';x.fillRect(2,y+2,60,12);x.fillStyle='#5d5a54';x.fillRect(6,y+4,52,3);x.fillStyle='#1a1918';x.fillRect(0,y+14,64,2);x.fillStyle='#36342f';x.fillRect(26,y+6,12,6);}S.tread=T(c);}
 {const c=cnv(128),x=c.getContext('2d');x.fillStyle='#2e2d2a';x.fillRect(0,0,128,128);x.fillStyle='#55534d';x.beginPath();x.arc(64,64,60,0,7);x.fill();x.fillStyle='#3c3a36';x.beginPath();x.arc(64,64,48,0,7);x.fill();x.strokeStyle='#5f5c55';x.lineWidth=9;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;x.beginPath();x.moveTo(64+Math.cos(a)*14,64+Math.sin(a)*14);x.lineTo(64+Math.cos(a)*46,64+Math.sin(a)*46);x.stroke();}
  x.fillStyle='#6b6860';x.beginPath();x.arc(64,64,16,0,7);x.fill();S.wheel=clampT(T(c));S.wheel.center.set(.5,.5);}
 // pine needle card + broadleaf canopy (alpha)
 {const c=cnv(128),x=c.getContext('2d');for(let i=0;i<500;i++){const v=R()*60;x.fillStyle=`rgb(${40+v|0},${70+v|0},${36+v*.5|0})`;const a=R()*6.28,px=R()*128,py=R()*128;x.save();x.translate(px,py);x.rotate(a);x.fillRect(-1,-5,2,10);x.restore();}S.needle=T(c);}
 {const c=cnv(128),x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,128,128);for(let i=0;i<500;i++){const v=150+R()*105|0;x.fillStyle=`rgb(${v},${v},${v})`;x.beginPath();x.ellipse(R()*128,R()*128,2+R()*4,1+R()*2,R()*3,0,7);x.fill();}S.foliage=T(c);}
 return S;}
