// STRIKER 11 — procedural textures baked once per page load (canvas only, no image files) and cached:
// grass blades (albedo + tangent normal + roughness/AO), pitch wear, net mesh, lens-flare sprites, shadow blobs.
import * as THREE from '../vendor/three.module.min.js';
const C={};
let seed=90210;const rr=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};// own deterministic stream: same pitch every load
const can=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function tex(c,o={}){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;t.colorSpace=o.srgb===false?THREE.NoColorSpace:THREE.SRGBColorSpace;t.anisotropy=o.aniso??8;return t;}
// height field -> tangent-space normal map (wraps at the edges, so it tiles)
function normalFrom(h,N,k){const c=can(N,N),x=c.getContext('2d'),id=x.createImageData(N,N),H=(a,b)=>h[((b+N)%N)*N+(a+N)%N];
 for(let y=0;y<N;y++)for(let i=0;i<N;i++){const dx=(H(i+1,y)-H(i-1,y))*k,dy=(H(i,y+1)-H(i,y-1))*k,l=Math.hypot(dx,dy,1),q=(y*N+i)*4;
  id.data[q]=(-dx/l*.5+.5)*255;id.data[q+1]=(dy/l*.5+.5)*255;id.data[q+2]=(1/l*.5+.5)*255;id.data[q+3]=255;}x.putImageData(id,0,0);return c;}
// ---- grass: thousands of short blades drawn into three canvases at once (colour, height, roughness) ----
export function grass(){if(C.grass)return C.grass;const N=512,ca=can(N,N),ch=can(N,N),cr=can(N,N),a=ca.getContext('2d'),h=ch.getContext('2d'),r=cr.getContext('2d');
 a.fillStyle='#3a4d26';a.fillRect(0,0,N,N);h.fillStyle='#202020';h.fillRect(0,0,N,N);r.fillStyle='#e6e6e6';r.fillRect(0,0,N,N);// soil between blades: dull, low, rough
 a.lineCap=h.lineCap=r.lineCap='round';
 const blade=(px,py,ang,len,w,col,hv,ro)=>{for(const ox of[-N,0,N])for(const oy of[-N,0,N]){const sx=px+ox,sy=py+oy;if(sx<-20||sx>N+20||sy<-20||sy>N+20)continue;
   const ex=sx+Math.cos(ang)*len,ey=sy+Math.sin(ang)*len;
   h.strokeStyle=`rgb(${hv},${hv},${hv})`;h.lineWidth=w;h.beginPath();h.moveTo(sx,sy);h.lineTo(ex,ey);h.stroke();
   a.strokeStyle=col;a.lineWidth=w;a.beginPath();a.moveTo(sx,sy);a.lineTo(ex,ey);a.stroke();
   r.strokeStyle=`rgb(${ro},${ro},${ro})`;r.lineWidth=w;r.beginPath();r.moveTo(sx,sy);r.lineTo(ex,ey);r.stroke();}};
 for(let i=0;i<12000;i++){const t=i/12000;// later blades sit on top: brighter, taller, smoother
  const px=rr()*N,py=rr()*N,ang=-Math.PI/2+(rr()-.5)*1.6+(rr()<.15?Math.PI:0),len=4+rr()*9,w=1+rr()*1.6;
  const L=.6+t*.42+(rr()-.5)*.2,hue=rr();const R=(38+hue*46)*L,G=(112+hue*34)*L,B=(26+hue*14)*L;// green to straw-green
  blade(px,py,ang,len,w,`rgb(${R|0},${G|0},${B|0})`,Math.min(255,90+t*150+rr()*20)|0,Math.max(120,235-t*80-rr()*30)|0);}
 // thin clover/weed specks and darker thatch
 for(let i=0;i<500;i++){const px=rr()*N,py=rr()*N,s=1+rr()*2;a.fillStyle=rr()<.5?'rgba(40,64,26,.7)':'rgba(150,160,90,.5)';a.fillRect(px,py,s,s);}
 const hd=h.getImageData(0,0,N,N).data,hf=new Float32Array(N*N);for(let i=0;i<N*N;i++)hf[i]=hd[i*4]/255;
 // pack: roughness in G (three reads .g), blade-depth AO in R
 const rd=r.getImageData(0,0,N,N);for(let i=0;i<N*N;i++){rd.data[i*4]=60+hf[i]*195;}r.putImageData(rd,0,0);
 const albedo=tex(ca),normal=tex(normalFrom(hf,N,2.4),{srgb:false}),rough=tex(cr,{srgb:false});
 return C.grass={albedo,normal,rough};}
// ---- pitch wear mask (R) + large-scale patchiness (G), covering the whole grass plane (half sizes a,b) ----
export function pitchMaps(P,a,b){const k=`${P.size}`;if(C['pm'+k])return C['pm'+k];const W=256,H=512,c=can(W,H),x=c.getContext('2d');
 x.fillStyle='rgb(0,128,0)';x.fillRect(0,0,W,H);const ex=W/(2*a),ez=H/(2*b),X=v=>W/2+v*ex,Z=v=>H/2+v*ez;
 // large patchy variation in G: soft blobs lighter/darker
 for(let i=0;i<260;i++){const cx=rr()*W,cy=rr()*H,rd=6+rr()*30,v=rr()<.5?0:255,g=x.createRadialGradient(cx,cy,0,cx,cy,rd);g.addColorStop(0,`rgba(0,${v},0,${.06+rr()*.08})`);g.addColorStop(1,'rgba(0,128,0,0)');x.fillStyle=g;x.fillRect(cx-rd,cy-rd,rd*2,rd*2);}
 // wear in R: speckled, broken edges (many small dabs whose density falls off)
 x.globalCompositeOperation='lighter';
 const scuff=(cx,cz,rx,rz,n,al)=>{for(let i=0;i<n;i++){const u=rr(),ang=rr()*6.283,d=Math.pow(u,.7);const px=X(cx+Math.cos(ang)*rx*d),py=Z(cz+Math.sin(ang)*rz*d),s=.6+rr()*2.2*(1-d);x.fillStyle=`rgba(${(al*(1-d*.8)*255)|0},0,0,1)`;x.fillRect(px-s/2,py-s/2,s,s);}};
 const L=P.L,W2=P.W;
 for(const s of[-1,1]){scuff(0,s*(L-.8),P.GW*.95,1.3,1300,.16);scuff(0,s*(L-2.4),P.GW*.55,2,700,.12);scuff(0,s*(L-P.SPOT),.9,.75,260,.22);
  scuff(0,s*(L-P.SD*.6),P.GW*1.6,P.SD*.7,900,.05);
  for(const sx of[-1,1])scuff(sx*(W2-.1),s*(L-.1),1.1,1.1,140,.25);// corner arcs
  // assistant referee tracks just outside each touchline (one half each)
  for(let i=0;i<900;i++){const z=s*(rr()*L),xx=s*(W2+.8+(rr()-.5)*.9);const px=X(xx),py=Z(z);x.fillStyle=`rgba(${(30+rr()*40)|0},0,0,1)`;x.fillRect(px,py,1,1.5);}}
 scuff(0,0,.9,.9,400,.35);scuff(0,0,P.CR*.8,P.CR*.5,900,.06);
 x.globalCompositeOperation='source-over';
 const t=tex(c,{srgb:false,clamp:true});return C['pm'+k]=t;}
// ---- goal net: knotted diamond mesh with alpha ----
export function netTex(){if(C.net)return C.net;const N=64,c=can(N,N),x=c.getContext('2d');x.clearRect(0,0,N,N);x.strokeStyle='#fff';x.lineWidth=3.6;x.lineCap='round';
 for(const o of[-N,0,N]){x.beginPath();x.moveTo(o,0);x.lineTo(o+N,N);x.stroke();x.beginPath();x.moveTo(o+N,0);x.lineTo(o,N);x.stroke();}
 x.fillStyle='#fff';for(const[px,py]of[[0,0],[N,0],[0,N],[N,N],[N/2,N/2]]){x.beginPath();x.arc(px,py,3,0,7);x.fill();}
 const t=tex(c);t.magFilter=THREE.LinearFilter;return C.net=t;}
// ---- soft elongated shadow blob (floodlight multi-shadows) ----
export function blobTex(){if(C.blob)return C.blob;const W=64,H=128,c=can(W,H),x=c.getContext('2d');const id=x.createImageData(W,H);
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){const u=(i+.5)/W*2-1,v=(j+.5)/H;// v=0 at the feet, 1 at the far tip
  const wdt=.42+.4*Math.min(1,v*2.2),e=Math.abs(u)/wdt;let a=Math.max(0,1-e*e)*(v<.06?v/.06:1)*Math.pow(1-v,.8);a*=.95;const q=(j*W+i)*4;id.data[q]=id.data[q+1]=id.data[q+2]=255;id.data[q+3]=a*255;}
 x.putImageData(id,0,0);const t=tex(c,{clamp:true,srgb:false});return C.blob=t;}
// ---- lens flare parts: starburst glow, anamorphic streak, ghost ring ----
export function flareTex(){if(C.flare)return C.flare;const N=256;
 const glow=can(N,N),g=glow.getContext('2d');{const rg=g.createRadialGradient(N/2,N/2,0,N/2,N/2,N/2);rg.addColorStop(0,'rgba(255,255,255,1)');rg.addColorStop(.08,'rgba(255,244,220,.85)');rg.addColorStop(.3,'rgba(255,220,170,.18)');rg.addColorStop(1,'rgba(255,200,150,0)');g.fillStyle=rg;g.fillRect(0,0,N,N);
  g.globalCompositeOperation='lighter';g.translate(N/2,N/2);for(let i=0;i<12;i++){g.rotate(Math.PI/6+(rr()-.5)*.1);const l=N*(.3+rr()*.2);const lg=g.createLinearGradient(0,0,l,0);lg.addColorStop(0,'rgba(255,240,220,.5)');lg.addColorStop(1,'rgba(255,240,220,0)');g.fillStyle=lg;g.fillRect(0,-.8,l,1.6);}}
 const streak=can(N,32),s=streak.getContext('2d');{const lg=s.createLinearGradient(0,0,N,0);lg.addColorStop(0,'rgba(120,170,255,0)');lg.addColorStop(.5,'rgba(200,225,255,1)');lg.addColorStop(1,'rgba(120,170,255,0)');s.fillStyle=lg;s.fillRect(0,0,N,32);
  s.globalCompositeOperation='destination-in';const vg=s.createLinearGradient(0,0,0,32);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(.5,'rgba(0,0,0,1)');vg.addColorStop(1,'rgba(0,0,0,0)');s.fillStyle=vg;s.fillRect(0,0,N,32);}
 const ring=can(128,128),q=ring.getContext('2d');{const rg=q.createRadialGradient(64,64,30,64,64,62);rg.addColorStop(0,'rgba(255,255,255,0)');rg.addColorStop(.75,'rgba(255,255,255,.35)');rg.addColorStop(.9,'rgba(255,255,255,.12)');rg.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=rg;q.fillRect(0,0,128,128);
  const hg=q.createRadialGradient(64,64,0,64,64,34);hg.addColorStop(0,'rgba(255,255,255,.18)');hg.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=hg;q.fillRect(0,0,128,128);}
 return C.flare={glow:tex(glow,{clamp:true}),streak:tex(streak,{clamp:true}),ring:tex(ring,{clamp:true})};}
// ---- shirt sponsors: one word per row, white on transparent ----
export const SPONSORS=['VOLTWAVE','ORBITAIR','MERIDIAN','KITECORE','NOVAPAY','HALO','BRIGHTLINE','QUASAR','TERRAFIN','ZEPHYR','ARCLIGHT','NIMBUS','PIXELCO','SUMMIT','KESTREL','OCTANE'];
export function sponsorAtlas(){if(C.sp)return C.sp;const W=256,H=1024,c=can(W,H),x=c.getContext('2d');
 const draw=()=>{x.clearRect(0,0,W,H);x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';
  SPONSORS.forEach((s,i)=>{let fs=46;const f=()=>x.font=`${fs}px "Anton", Impact, "Arial Black", sans-serif`;f();while(x.measureText(s).width>W-20&&fs>12){fs--;f();}x.fillText(s,W/2,i*64+34);});};
 draw();const t=new THREE.CanvasTexture(c);t.flipY=true;t.colorSpace=THREE.NoColorSpace;t.anisotropy=4;
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{draw();t.needsUpdate=true;});return C.sp=t;}
// ---- hair strands (tangent normal) ----
export function hairNormal(){if(C.hair)return C.hair;const N=128,h=new Float32Array(N*N);for(let i=0;i<N;i++){const ph=rr()*6.283,f=6+rr()*10,amp=.3+rr()*.7;for(let j=0;j<N;j++)h[j*N+i]+=Math.sin(j/N*Math.PI*2*Math.round(f/2)+ph)*.15*amp+(rr()-.5)*.25;}
 for(let j=0;j<N;j++)for(let i=1;i<N;i++)h[j*N+i]=h[j*N+i]*.6+h[j*N+i-1]*.4;
 const t=tex(normalFrom(h,N,1.6),{srgb:false});t.repeat.set(4,2);return C.hair=t;}
