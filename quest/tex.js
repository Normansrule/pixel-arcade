// WILD QUEST — procedural texture baker: tileable noise, terrain albedo + normal sets, foliage atlases, bark. Baked once at load, cached, all <= 512px.
import * as THREE from '../vendor/three.module.min.js';

/* ---------- tileable value noise ---------- */
function hash(i,j,s){let h=(i*374761393+j*668265263+s*1442695041)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;}
export function pnoise(x,y,per,s=0){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi;const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 const m=k=>((k%per)+per)%per;const a=hash(m(xi),m(yi),s),b=hash(m(xi+1),m(yi),s),c=hash(m(xi),m(yi+1),s),d=hash(m(xi+1),m(yi+1),s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
export function pfbm(x,y,per,oct=5,s=0,lac=2){let t=0,a=.5,n=0;for(let o=0;o<oct;o++){t+=pnoise(x,y,per,s+o*17)*a;n+=a;a*=.5;x*=lac;y*=lac;per*=lac;}return t/n;}
// worley-ish cells (distance to nearest jittered point), tileable
export function pcell(x,y,per,s=0){const xi=Math.floor(x),yi=Math.floor(y);let d1=9,d2=9,id=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const cx=xi+i,cy=yi+j,mx=((cx%per)+per)%per,my=((cy%per)+per)%per;
  const px=cx+hash(mx,my,s),py=cy+hash(mx,my,s+9);const d=Math.hypot(px-x,py-y);if(d<d1){d2=d1;d1=d;id=hash(mx,my,s+5);}else if(d<d2)d2=d;}return[d1,d2,id];}

const cvs=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function tex(c,o={}){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;t.colorSpace=o.srgb===false?THREE.NoColorSpace:THREE.SRGBColorSpace;t.anisotropy=o.aniso??8;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;return t;}
// height field -> tangent-space normal map canvas (wraps at edges)
function normalCanvas(hf,N,str){const c=cvs(N,N),x=c.getContext('2d'),id=x.createImageData(N,N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const l=hf[j*N+(i+N-1)%N],r=hf[j*N+(i+1)%N],u=hf[((j+N-1)%N)*N+i],d=hf[((j+1)%N)*N+i];
  let nx=(l-r)*str,ny=(u-d)*str,nz=1;const k=1/Math.hypot(nx,ny,nz);const o=(j*N+i)*4;id.data[o]=(nx*k*.5+.5)*255;id.data[o+1]=(ny*k*.5+.5)*255;id.data[o+2]=(nz*k*.5+.5)*255;id.data[o+3]=255;}x.putImageData(id,0,0);return c;}
function lum(c){const N=c.width,d=c.getContext('2d').getImageData(0,0,N,N).data,h=new Float32Array(N*N);for(let k=0;k<N*N;k++)h[k]=(d[k*4]*.3+d[k*4+1]*.59+d[k*4+2]*.11)/255;return h;}
// draw f at the 9 wrapped offsets so canvas strokes tile
const wrap=(N,f)=>{for(const dx of[-N,0,N])for(const dy of[-N,0,N])f(dx,dy);};
function rngOf(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

let TS=null;
/* terrain material set: grass ground, dirt, rock (strata), sand. Each: albedo (sRGB) + normal (linear). */
export function terrainSet(N=512){if(TS)return TS;const t0=performance.now();
 // --- grass ground (top-down): mottled soil + thousands of blade strokes
 const g=cvs(N,N),gx=g.getContext('2d');{const id=gx.createImageData(N,N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const n=pfbm(i/64,j/64,8,4,3),m=pfbm(i/32,j/32,N/32,3,7);const o=(j*N+i)*4;
   id.data[o]=(46+n*40+m*16)|0;id.data[o+1]=(62+n*44+m*14)|0;id.data[o+2]=(22+n*14)|0;id.data[o+3]=255;}gx.putImageData(id,0,0);
  const r=rngOf(11);for(let k=0;k<9000;k++){const x=r()*N,y=r()*N,a=r()*6.283,L=4+r()*10,dry=r()<.12;const l=dry?52+r()*20:28+r()*30,h=dry?48+r()*12:82+r()*30;gx.strokeStyle=`hsl(${h},${dry?40:45+r()*20}%,${l}%)`;gx.lineWidth=.8+r()*1.4;gx.lineCap='round';
   wrap(N,(dx,dy)=>{gx.beginPath();gx.moveTo(x+dx,y+dy);gx.quadraticCurveTo(x+dx+Math.cos(a)*L*.5+2,y+dy+Math.sin(a)*L*.5,x+dx+Math.cos(a)*L,y+dy+Math.sin(a)*L);gx.stroke();});}
  for(let k=0;k<160;k++){const x=r()*N,y=r()*N,rr=2+r()*4;gx.fillStyle=`rgba(${r()<.5?220:240},${r()<.5?210:200},${r()<.5?90:200},.55)`;wrap(N,(dx,dy)=>{for(let p=0;p<5;p++){const a=p*1.256;gx.beginPath();gx.arc(x+dx+Math.cos(a)*rr*.4,y+dy+Math.sin(a)*rr*.4,rr*.35,0,6.283);gx.fill();}});}}
 const gh=lum(g);
 // --- dirt: soil noise, pebbles, cracks
 const d=cvs(N,N),dx=d.getContext('2d');const dh=new Float32Array(N*N);{const id=dx.createImageData(N,N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const n=pfbm(i/64,j/64,N/64,5,21),f=pnoise(i/4,j/4,N/4,4);const crack=1;
   const cr=.82+.18*crack,m2=pfbm(i/16,j/16,N/16,3,5);const h=n*.6+f*.2+crack*.08+m2*.2;dh[j*N+i]=h;const o=(j*N+i)*4,v=.5+n*.5+m2*.2;id.data[o]=Math.min(255,(112*v+f*16)*cr);id.data[o+1]=Math.min(255,(84*v+f*12)*cr);id.data[o+2]=Math.min(255,(58*v+f*9)*cr);id.data[o+3]=255;}dx.putImageData(id,0,0);
  const r=rngOf(5);for(let k=0;k<1400;k++){const x=r()*N,y=r()*N,rr=.8+r()*r()*5,v=90+r()*90|0;wrap(N,(ox,oy)=>{const gr=dx.createRadialGradient(x+ox-rr*.3,y+oy-rr*.4,0,x+ox,y+oy,rr);gr.addColorStop(0,`rgb(${v+30},${v+24},${v+14})`);gr.addColorStop(.75,`rgb(${v-20},${v-26},${v-34})`);gr.addColorStop(1,'rgba(30,20,10,0)');dx.fillStyle=gr;dx.beginPath();dx.arc(x+ox,y+oy,rr,0,6.283);dx.fill();});}}
 {const r=rngOf(15);for(let k=0;k<420;k++){const x=r()*N,y=r()*N,a=r()*6.283,L=3+r()*5;const hue=[28,36,48,70][r()*4|0];dx.fillStyle=`hsla(${hue},${35+r()*25}%,${22+r()*22}%,.85)`;wrap(N,(ox,oy)=>{dx.save();dx.translate(x+ox,y+oy);dx.rotate(a);dx.beginPath();dx.ellipse(0,0,L,L*.45,0,0,6.283);dx.fill();dx.restore();});}
  dx.strokeStyle='rgba(60,40,22,.7)';for(let k=0;k<60;k++){const x=r()*N,y=r()*N,a=r()*6.283,L=6+r()*14;dx.lineWidth=.8+r();wrap(N,(ox,oy)=>{dx.beginPath();dx.moveTo(x+ox,y+oy);dx.lineTo(x+ox+Math.cos(a)*L,y+oy+Math.sin(a)*L);dx.stroke();});}}
 const dl=lum(d);for(let k=0;k<N*N;k++)dh[k]=dh[k]*.5+dl[k]*.9;
 // --- rock: horizontal strata (v = world height), fractures, lichen
 const rk=cvs(N,N),rx=rk.getContext('2d');const rh=new Float32Array(N*N);{const id=rx.createImageData(N,N);const r=rngOf(9);const tints=[];for(let b=0;b<24;b++)tints.push([.85+r()*.3,.85+r()*.22,.82+r()*.2,r()]);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const w=pfbm(i/128,j/128,N/128,3,31);const yy=j/N*12+w*1.6+pfbm(i/32,j/32,N/32,2,2)*.3;const band=Math.floor(yy),fb=yy-band;const T=tints[((band%12)+12)%12];
   const edge=Math.min(1,fb*7)*Math.min(1,(1-fb)*4);const n=pfbm(i/16,j/8,N/16,4,13);const[c1,c2]=pcell(i/64,j/32,N/64,3);const frac=Math.min(1,(c2-c1)*9);const grain=pnoise(i/2,j/2,N/2,6);
   const h=(.35+edge*.35+n*.25)*(.55+.45*frac)+grain*.06+T[3]*.05;rh[j*N+i]=h;const lich=Math.max(0,pfbm(i/16+50,j/16,N/16,3,77)-.62)*4*(1-fb*.5);
   const base=(.42+n*.35+grain*.08)*(.6+.4*edge)*(.55+.45*frac);const o=(j*N+i)*4;
   let R=150*base*T[0],G=142*base*T[1],B=128*base*T[2];R+=lich*60;G+=lich*66;B+=lich*10;id.data[o]=Math.min(255,R);id.data[o+1]=Math.min(255,G);id.data[o+2]=Math.min(255,B);id.data[o+3]=255;}rx.putImageData(id,0,0);}
 // --- sand: fine grain + wind ripples
 const sd=cvs(N,N),sx=sd.getContext('2d');const sh=new Float32Array(N*N);{const id=sx.createImageData(N,N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const w=pfbm(i/64,j/64,N/64,3,41);const rip=Math.sin((j/N*28+w*3+i/N*4)*6.283)*.5+.5;const gr=pnoise(i/2,j/2,N/2,2);
   const h=rip*.5+gr*.35+w*.3;sh[j*N+i]=h;const v=.7+w*.25+gr*.12-rip*.06;const o=(j*N+i)*4;id.data[o]=Math.min(255,176*v);id.data[o+1]=Math.min(255,156*v);id.data[o+2]=Math.min(255,118*v);id.data[o+3]=255;}sx.putImageData(id,0,0);}
 TS={grass:tex(g),grassN:tex(normalCanvas(gh,N,6),{srgb:false}),dirt:tex(d),dirtN:tex(normalCanvas(dh,N,7),{srgb:false}),rock:tex(rk),rockN:tex(normalCanvas(rh,N,9),{srgb:false}),sand:tex(sd),sandN:tex(normalCanvas(sh,N,4),{srgb:false}),ms:performance.now()-t0};
 return TS;}

/* broadleaf foliage atlas (512): top-left 48px solid block (crown volume uvs), rest = leaf sprays with alpha. Plus a matching alpha-aware normal. */
let LF=null;export function leafAtlas(){if(LF)return LF;const N=512,c=cvs(N,N),x=c.getContext('2d');x.clearRect(0,0,N,N);x.fillStyle='#8f9a78';x.fillRect(0,0,48,48);const r=rngOf(77);
 // twigs
 x.strokeStyle='rgba(70,52,36,.95)';x.lineCap='round';const twig=(x0,y0,a,L,w)=>{if(L<14)return;const x1=x0+Math.cos(a)*L,y1=y0+Math.sin(a)*L;x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();twig(x1,y1,a+.45+r()*.3,L*.62,w*.7);twig(x1,y1,a-.45-r()*.3,L*.62,w*.7);};
 for(let k=0;k<5;k++)twig(280,282,k*1.256+r()*.5,70,4);
 // leaves: many small ovate leaves with a midrib, darker toward the centre (self-shadow)
 for(let i=0;i<520;i++){const a=r()*6.283,dd=Math.pow(r(),.6)*200,cx=280+Math.cos(a)*dd,cy=282+Math.sin(a)*dd*.95;if(cx<60&&cy<60)continue;const ang=a+(r()-.5)*1.8,L=10+r()*9,W=L*(.42+r()*.12);
  const inner=1-dd/200,l=36+r()*26-inner*12,h=82+r()*26;x.save();x.translate(cx,cy);x.rotate(ang);const gr=x.createLinearGradient(-L,0,L,0);gr.addColorStop(0,`hsl(${h},${36+r()*18}%,${l-8}%)`);gr.addColorStop(1,`hsl(${h+6},${40+r()*18}%,${l+8}%)`);x.fillStyle=gr;
  x.beginPath();x.moveTo(-L,0);x.bezierCurveTo(-L*.4,-W,L*.5,-W*.9,L,0);x.bezierCurveTo(L*.5,W*.9,-L*.4,W,-L,0);x.fill();x.strokeStyle='rgba(30,40,12,.35)';x.lineWidth=.8;x.beginPath();x.moveTo(-L*.9,0);x.lineTo(L*.85,0);x.stroke();x.restore();}
 const t=tex(c,{clamp:true});LF=t;return t;}
/* conifer branch card (256x512): a drooping spray of needles along a central twig, alpha */
let PN=null;export function pineAtlas(){if(PN)return PN;const W=256,H=512,c=cvs(W,H),x=c.getContext('2d');x.clearRect(0,0,W,H);x.fillStyle='#5a6a4a';x.fillRect(0,0,24,24);const r=rngOf(19);
 const spray=(x0,y0,a,L,w,depth)=>{const x1=x0+Math.cos(a)*L,y1=y0+Math.sin(a)*L;x.strokeStyle='rgba(60,44,30,1)';x.lineWidth=w;x.beginPath();x.moveTo(x0,y0);x.lineTo(x1,y1);x.stroke();
  const n=Math.floor(L/2.2);for(let i=0;i<n;i++){const t=i/n,px=x0+(x1-x0)*t,py=y0+(y1-y0)*t,nl=(6+r()*5)*(1-t*.5)*(depth?1:1.2);for(const s of[-1,1]){const na=a+s*(.9+r()*.35);const l=20+r()*22;x.strokeStyle=`hsl(${105+r()*25},${30+r()*20}%,${l}%)`;x.lineWidth=1+r()*.6;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(na)*nl,py+Math.sin(na)*nl);x.stroke();}}
  if(depth<2){const k=3+(r()*2|0);for(let i=0;i<k;i++){const t=.2+i/k*.7;spray(x0+(x1-x0)*t,y0+(y1-y0)*t,a+(i%2?1:-1)*(.6+r()*.3),L*(.42-t*.15),w*.6,depth+1);}}};
 spray(128,30,Math.PI/2,450,4,0);PN=tex(c,{clamp:true});return PN;}
/* bark (256x512): deep vertical furrows, plates, moss toward the bottom-north; luminance also drives the bump */
let BK=null;export function barkTex(){if(BK)return BK;const W=256,H=512,c=cvs(W,H),x=c.getContext('2d'),id=x.createImageData(W,H);const hf=new Float32Array(W*H);
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){const u=i/W,v=j/H;const warp=pfbm(u*4,v*2,4,3,5)*1.5;const fur=Math.abs(Math.sin((u*9+warp)*Math.PI));const[c1,c2]=pcell(u*10,v*5,5,2);const plate=Math.min(1,(c2-c1)*5);
  const n=pfbm(u*16,v*8,8,4,9);const h=Math.pow(fur,.5)*.6*(.5+.5*plate)+n*.4;hf[j*W+i]=h;const o=(j*W+i)*4;const moss=Math.max(0,pfbm(u*6+20,v*3,3,3,4)-.55)*3*(1-fur*.5);
  const base=.28+h*.6;id.data[o]=Math.min(255,(120*base)*(1-moss*.4)+moss*40);id.data[o+1]=Math.min(255,(104*base)*(1-moss*.2)+moss*70);id.data[o+2]=Math.min(255,(88*base)*(1-moss*.5)+moss*20);id.data[o+3]=255;}
 x.putImageData(id,0,0);const nc=cvs(W,H);{const nx=nc.getContext('2d'),nd=nx.createImageData(W,H);for(let j=0;j<H;j++)for(let i=0;i<W;i++){const l=hf[j*W+(i+W-1)%W],rr=hf[j*W+(i+1)%W],u=hf[((j+H-1)%H)*W+i],d=hf[((j+1)%H)*W+i];let ax=(l-rr)*5,ay=(u-d)*5;const k=1/Math.hypot(ax,ay,1);const o=(j*W+i)*4;nd.data[o]=(ax*k*.5+.5)*255;nd.data[o+1]=(ay*k*.5+.5)*255;nd.data[o+2]=(k*.5+.5)*255;nd.data[o+3]=255;}nx.putImageData(nd,0,0);}
 BK={map:tex(c),normal:tex(nc,{srgb:false})};return BK;}
/* water streak texture for rivers / falls: R = foam streaks, G = fine foam bubbles, B = soft noise (linear) */
let WS=null;export function waterStreak(){if(WS)return WS;const N=256,c=cvs(N,N),x=c.getContext('2d'),id=x.createImageData(N,N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const s=pfbm(i/N*24,j/N*3,3,4,3);const st=Math.pow(Math.max(0,s*1.6-.55),1.4);const[c1]=pcell(i/8,j/8,N/8,4);const b=1-Math.min(1,c1*1.6);const n=pfbm(i/32,j/32,8,4,11);const o=(j*N+i)*4;
  id.data[o]=Math.min(255,st*255);id.data[o+1]=Math.min(255,b*b*255);id.data[o+2]=n*255;id.data[o+3]=255;}x.putImageData(id,0,0);WS=tex(c,{srgb:false});return WS;}
/* weathered planks (grain along v) and stitched hide patchwork for camps */
let CW=null;export function campTex(){if(CW)return CW;const N=256;
 const w=cvs(N,N),x=w.getContext('2d'),id=x.createImageData(N,N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const plank=Math.floor(i/64),u=(i%64)/64;const g=pfbm(i/8+plank*7,j/64,32,4,plank+3);const ring=Math.sin((g*14+u*3)*3.1)*.5+.5;const edge=Math.min(1,u*14)*Math.min(1,(1-u)*14);
  const v=(.5+ring*.25+g*.3)*(.55+.45*edge)*(.85+hash(plank,0,4)*.3);const o=(j*N+i)*4;id.data[o]=Math.min(255,150*v);id.data[o+1]=Math.min(255,112*v);id.data[o+2]=Math.min(255,78*v);id.data[o+3]=255;}x.putImageData(id,0,0);
 const h=cvs(N,N),y=h.getContext('2d'),r=rngOf(3);y.fillStyle='#8a6a48';y.fillRect(0,0,N,N);for(let k=0;k<26;k++){const px=r()*N,py=r()*N,pw=40+r()*70,ph=30+r()*60,v=(100+r()*70)|0;wrap(N,(dx,dy)=>{y.fillStyle=`rgb(${v+30},${v},${v-30})`;y.fillRect(px+dx,py+dy,pw,ph);y.strokeStyle='rgba(40,25,10,.8)';y.setLineDash([3,3]);y.lineWidth=1.2;y.strokeRect(px+dx+2,py+dy+2,pw-4,ph-4);y.setLineDash([]);});}
 const id2=y.getImageData(0,0,N,N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const n=pfbm(i/32,j/32,8,4,9),o=(j*N+i)*4;for(let c=0;c<3;c++)id2.data[o+c]*=.7+n*.5;}y.putImageData(id2,0,0);
 CW={wood:tex(w),hide:tex(h)};return CW;}
