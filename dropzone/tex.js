// DROPZONE — procedural textures: albedo + normal maps from tileable height fields, building facades, soldier kit atlases, sprites.
import * as THREE from '../vendor/three.module.min.js';

/* ---------- tileable value noise ---------- */
function hash(x,y,s){let h=(x*374761393+y*668265263+s*982451653)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;}
function vnoise(x,y,p,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const m=a=>((a%p)+p)%p;
 const a=hash(m(xi),m(yi),s),b=hash(m(xi+1),m(yi),s),c=hash(m(xi),m(yi+1),s),d=hash(m(xi+1),m(yi+1),s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,p,oct,s){let f=0,a=.5,t=0;for(let o=0;o<oct;o++){f+=vnoise(x*(1<<o),y*(1<<o),p*(1<<o),s+o)*a;t+=a;a*=.5;}return f/t;}
const mix=(a,b,t)=>a+(b-a)*t,cl=(v,a=0,b=1)=>v<a?a:v>b?b:v,sm=(a,b,v)=>{const t=cl((v-a)/(b-a));return t*t*(3-2*t);};
const set=(c,r,g,b)=>{c[0]=cl(r,0,255);c[1]=cl(g,0,255);c[2]=cl(b,0,255);};
function tex(cv,srgb=true){const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
// fn(u,v,rgbOut) -> height; returns {map, normalMap}
function build(N,fn,opt={}){const cv=document.createElement('canvas');cv.width=opt.w||N;cv.height=N;const W=cv.width;const x=cv.getContext('2d');const img=x.createImageData(W,N),d=img.data,H=new Float32Array(W*N);const c=[0,0,0];
 for(let j=0;j<N;j++)for(let i=0;i<W;i++){const h=fn(i/W,j/N,c,i,j);H[j*W+i]=h;const k=(j*W+i)*4;d[k]=c[0];d[k+1]=c[1];d[k+2]=c[2];d[k+3]=255;}x.putImageData(img,0,0);
 const map=tex(cv);const nc=document.createElement('canvas');nc.width=W;nc.height=N;const nx=nc.getContext('2d'),ni=nx.createImageData(W,N),nd=ni.data,st=opt.bump??3;
 for(let j=0;j<N;j++)for(let i=0;i<W;i++){const l=H[j*W+((i-1+W)%W)],r=H[j*W+((i+1)%W)],u=H[((j-1+N)%N)*W+i],dn=H[((j+1)%N)*W+i];const ax=(l-r)*st,ay=(u-dn)*st,L=Math.hypot(ax,ay,1);const k=(j*W+i)*4;nd[k]=(ax/L*.5+.5)*255;nd[k+1]=(ay/L*.5+.5)*255;nd[k+2]=(1/L*.5+.5)*255;nd[k+3]=255;}
 nx.putImageData(ni,0,0);return{map,normalMap:tex(nc,false)};}

export function makeTextures(){const T={},N=256;
 T.conc=build(N,(u,v,c)=>{const n=fbm(u*8,v*8,8,5,1),st=fbm(u*3,v*3,3,3,2),pit=hash((u*N)|0,(v*N)|0,3)>.985?-.25:0;const line=Math.abs(((v*2)%1)-.5)>.494?-.12:0;let l=150+n*60-sm(.55,.8,st)*40+pit*90+line*80;set(c,l*.98,l*.97,l*.93);return n*.6+pit+line;},{bump:4});
 T.plaster=build(N,(u,v,c)=>{const n=fbm(u*6,v*6,6,5,4),cr=Math.abs(fbm(u*4,v*4,4,4,5)-.5)<.004?-.12:0,dirt=sm(.5,.85,fbm(u*2,v*2,2,3,6))*(1-v*.3);const l=225+n*25-dirt*45+cr*120;set(c,l,l*.985,l*.96);return n*.3+cr;},{bump:3});
 T.brick=build(N,(u,v,c)=>{const rows=8,cols=4;const ry=v*rows,row=Math.floor(ry),off=row%2?.5:0,cx=u*cols+off,col=Math.floor(cx);const fy=ry-row,fx=cx-col;const mort=fy<.09||fx<.04;
  const b=hash(((col%cols)+cols)%cols,row,7),n=fbm(u*16,v*16,16,3,8);if(mort){const l=150+n*30;set(c,l,l*.97,l*.92);return -.4+n*.1;}const r=150+b*50+n*30,g=72+b*20+n*14,bl=52+b*14+n*10;set(c,r,g,bl);return .2+n*.3;},{bump:5});
 T.metal=build(N,(u,v,c)=>{const rib=Math.sin(u*Math.PI*2*12),n=fbm(u*8,v*8,8,4,9),streak=sm(.55,.9,fbm(u*40,v*2,40,3,10))*sm(.2,1,v),rs=sm(.62,.82,fbm(u*5,v*5,5,4,11));
  let l=205+n*30;set(c,mix(l,150,rs)-streak*45,mix(l,95,rs)-streak*55,mix(l,60,rs)-streak*60);return rib*.5*(rib>0?1:.6)+n*.15;},{bump:2.5});
 T.wood=build(N,(u,v,c)=>{const pl=6,py=v*pl,row=Math.floor(py),f=py-row,gap=f<.05;const g=fbm(u*3+row*7.3,v*pl*6,3,4,12+row),gr=Math.sin((u*30+g*6+row)*3)*.5+.5,b=hash(row,1,13);
  if(gap){set(c,40,32,24);return -.5;}const l=150+b*55+gr*25+g*20;set(c,l,l*.78,l*.56);return gr*.25+g*.2;},{bump:4});
 T.floor=build(N,(u,v,c)=>{const t=4,fx=(u*t)%1,fy=(v*t)%1,gr=fx<.03||fy<.03,ch=(Math.floor(u*t)+Math.floor(v*t))%2,n=fbm(u*10,v*10,10,4,14),dirt=sm(.45,.9,fbm(u*3,v*3,3,3,15));
  if(gr){set(c,70,68,64);return -.3;}const l=(ch?190:168)+n*20-dirt*50;set(c,l,l*.98,l*.93);return n*.15;},{bump:3});
 T.asph=build(N,(u,v,c)=>{const n=fbm(u*16,v*16,16,4,16),sp=hash((u*N)|0,(v*N)|0,17),cr=Math.abs(fbm(u*3,v*3,3,5,18)-.5)<.01,patch=sm(.62,.66,fbm(u*2,v*2,2,3,40));const l=72+n*24+(sp>.93?28:sp<.05?-14:0)-(cr?30:0)-patch*14;set(c,l,l,l*1.02);return n*.4+(sp>.93?.3:0)-(cr?.6:0);},{bump:4});
 T.roof=build(N,(u,v,c)=>{const n=fbm(u*12,v*12,12,4,19),seam=((v*6)%1)<.04,st=sm(.5,.8,fbm(u*4,v*4,4,3,41));const l=86+n*30-(seam?18:0)-st*20;set(c,l,l*.98,l*.96);return n*.4-(seam?.4:0);},{bump:3});
 T.steel=build(N,(u,v,c)=>{const n=fbm(u*6,v*6,6,4,20),scr=Math.abs(fbm(u*30,v*3,30,2,21)-.5)<.01?20:0,rs=sm(.66,.86,fbm(u*4,v*4,4,4,22));const l=210+n*24+scr;set(c,mix(l,140,rs),mix(l,90,rs),mix(l,60,rs));return n*.15+rs*.2;},{bump:2});
 T.rust=build(N,(u,v,c)=>{const n=fbm(u*8,v*8,8,5,23),m=fbm(u*20,v*20,20,3,24);set(c,110+n*70+m*20,58+n*35,32+n*18);return n*.6+m*.3;},{bump:5});
 T.fabric=build(N,(u,v,c)=>{const w=(Math.sin(u*Math.PI*2*48)*Math.sin(v*Math.PI*2*48))*.5+.5,n=fbm(u*6,v*6,6,3,25);const l=190+w*30+n*30;set(c,l,l,l);return w*.4;},{bump:2});
 T.ground=build(N,(u,v,c)=>{const n=fbm(u*8,v*8,8,5,26),m=fbm(u*32,v*32,32,3,27),st=hash((u*N)|0,(v*N)|0,28)>.97;const l=170+n*60+m*25+(st?25:0);set(c,l,l,l);return n*.5+m*.3+(st?.4:0);},{bump:4});
 T.water=build(N,(u,v,c)=>{const n=fbm(u*6,v*6,6,5,29);set(c,128,128,255);return n;},{bump:6});
 T.tile=build(N,(u,v,c)=>{const t=8,fx=(u*t)%1,fy=(v*t)%1,gr=fx<.05||fy<.05,n=fbm(u*8,v*8,8,3,30),b=hash(Math.floor(u*t),Math.floor(v*t),31);if(gr){set(c,120,118,112);return -.3;}const l=200+b*30+n*15;set(c,l,l*.99,l*.95);return .1;},{bump:3});
 // facades: tiling window bays (1 tile = 3 m wide x 3.2 m storey); windows are dark glass with sky reflection gradient, frames + sills
 const facade=(seed,base,frame)=>build(256,(u,v,c,i,j)=>{const bx=u*2%1,by=v*2%1;const n=fbm(u*8,v*8,8,4,seed),dirt=sm(.4,.9,fbm(u*2,v*2,2,3,seed+1));
  const win=bx>.2&&bx<.8&&by>.24&&by<.78,fr=bx>.17&&bx<.83&&by>.2&&by<.82,sill=bx>.15&&bx<.85&&by>.18&&by<.22,band=by>.94;
  if(win){const lit=hash(Math.floor(u*2),Math.floor(v*2),seed+5);const g=mix(.95,.35,(by-.24)/.54);const mul=(bx>.48&&bx<.52)?.4:1;const L=lit>.82?1:0;set(c,(40+g*70+L*120)*mul,(52+g*80+L*95)*mul,(66+g*95+L*50)*mul);return -.6;}
  if(sill){set(c,frame[0]*.9,frame[1]*.9,frame[2]*.9);return .5;}if(fr){set(c,frame[0],frame[1],frame[2]);return .3;}
  const l=.85+n*.25-dirt*.18-(band?.12:0);set(c,base[0]*l,base[1]*l,base[2]*l);return n*.3+(band?.2:0);},{bump:3});
 T.facA=facade(50,[215,205,188],[70,72,76]);T.facB=facade(60,[178,92,70],[226,222,210]);T.facC=facade(70,[196,200,204],[40,44,50]);T.facD=facade(80,[222,212,170],[120,96,70]);
 // corrugated warehouse sheet
 T.corr=build(N,(u,v,c)=>{const rib=Math.abs(Math.sin(u*Math.PI*16)),n=fbm(u*6,v*6,6,4,90),streak=sm(.5,.9,fbm(u*30,v*1.5,30,3,91))*sm(.0,1,v),rs=sm(.65,.85,fbm(u*4,v*4,4,4,92));const l=200+n*30-rib*30;set(c,mix(l,150,rs)-streak*40,mix(l,100,rs)-streak*45,mix(l,70,rs)-streak*48);return rib*.8+n*.1;},{bump:3});
 T.grass=build(N,(u,v,c)=>{const n=fbm(u*8,v*8,8,5,93),m=fbm(u*40,v*40,40,2,94),d=sm(.55,.75,fbm(u*3,v*3,3,3,95));set(c,90+n*50+d*60,110+n*50+d*30,52+n*25+d*20);return n*.4+m*.4;},{bump:3});
 T.sand=build(N,(u,v,c)=>{const n=fbm(u*8,v*8,8,4,96),r=Math.sin((u*24+fbm(u*2,v*2,2,2,97)*4)*Math.PI)*.5+.5;const l=200+n*30+r*10;set(c,l,l*.92,l*.76);return n*.3+r*.2;},{bump:2});
 return T;}

// small sprite textures: puff, flash, bullet hole, glow, beam
export function makeSprites(){const mk=(N,fn,clamp=true)=>{const cv=document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d');fn(x,N);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;if(clamp)t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;};
 return{
  puff:mk(64,(x,N)=>{const g=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,N,N);}),
  flash:mk(128,(x,N)=>{x.translate(N/2,N/2);for(let i=0;i<7;i++){x.rotate(Math.PI*2/7+.3*Math.random());const g=x.createLinearGradient(0,0,N/2,0);g.addColorStop(0,'rgba(255,240,200,1)');g.addColorStop(1,'rgba(255,160,60,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,-5);x.lineTo(N/2*(.6+Math.random()*.4),0);x.lineTo(0,5);x.fill();}
   const g=x.createRadialGradient(0,0,0,0,0,N/4);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,N/4,0,7);x.fill();}),
  hole:mk(64,(x,N)=>{const g=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.22,'rgba(10,10,10,.95)');g.addColorStop(.32,'rgba(60,55,50,.6)');g.addColorStop(1,'rgba(60,55,50,0)');x.fillStyle=g;x.fillRect(0,0,N,N);}),
  glow:mk(64,(x,N)=>{const g=x.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.2,'rgba(255,255,255,.6)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,N,N);}),
  beam:mk(64,(x,N)=>{const g=x.createLinearGradient(0,0,N,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,N,N);const h=x.createLinearGradient(0,0,0,N);h.addColorStop(0,'rgba(0,0,0,1)');h.addColorStop(1,'rgba(0,0,0,0)');x.globalCompositeOperation='destination-out';x.fillStyle=h;x.fillRect(0,0,N,N);}),
 };}

// soldier kit atlas: left half camo (u<.5), right half neutral cloth
export function makeKit(base,cols,seed){let s=seed*7919+1;const R=()=>(s=(s*16807)%2147483647)/2147483647;const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
 x.fillStyle=base;x.fillRect(0,0,128,256);for(const col of cols)for(let i=0;i<16;i++){x.fillStyle=col;x.beginPath();let px=R()*128,py=R()*256;x.moveTo(px,py);for(let k=0;k<7;k++)x.lineTo(px+Math.cos(k)*(6+R()*16),py+Math.sin(k)*(5+R()*12));x.fill();}
 x.fillStyle='#e8e8e8';x.fillRect(128,0,128,256);for(let i=0;i<5000;i++){x.fillStyle=R()<.5?`rgba(0,0,0,${.12*R()})`:`rgba(255,255,255,${.08*R()})`;x.fillRect(R()*256,R()*256,1+R(),1+R());}
 x.globalAlpha=.08;for(let i=0;i<256;i+=3){x.fillStyle=i%6?'#000':'#fff';x.fillRect(0,i,256,1);}x.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
