// KART GRAND PRIX — procedural PBR texture sets baked once at load: albedo + normal + roughness (+ emissive),
// all tileable. Road surfaces, kerbs, walls, terrain detail, trackside banners and the kart decal atlas.
import * as THREE from '../vendor/three.module.min.js';
import {rng} from './util.js';

const CACHE=new Map();
const cached=(k,f)=>{if(!CACHE.has(k))CACHE.set(k,f());return CACHE.get(k);};
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function toTex(c,srgb=true,rep=true){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=rep?THREE.RepeatWrapping:THREE.ClampToEdgeWrapping;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;return t;}

/* ---------- tileable value noise / fbm / voronoi on a pixel grid ---------- */
function vnoise(S,cells,seed){const r=rng(seed),L=new Float32Array(cells*cells);for(let i=0;i<L.length;i++)L[i]=r();const out=new Float32Array(S*S),k=cells/S;
 const X0=new Int32Array(S),X1=new Int32Array(S),SX=new Float32Array(S);for(let x=0;x<S;x++){const fx=x*k,ix=fx|0,tx=fx-ix;X0[x]=ix%cells;X1[x]=(ix+1)%cells;SX[x]=tx*tx*(3-2*tx);}
 for(let y=0;y<S;y++){const fy=y*k,iy=fy|0,ty=fy-iy,sy=ty*ty*(3-2*ty),r0=(iy%cells)*cells,r1=((iy+1)%cells)*cells,o=y*S;
  for(let x=0;x<S;x++){const x0=X0[x],x1=X1[x],sx=SX[x];const a=L[r0+x0],b=L[r0+x1],c=L[r1+x0],d=L[r1+x1];const ab=a+(b-a)*sx;out[o+x]=ab+((c+(d-c)*sx)-ab)*sy;}}return out;}
export function fbmT(S,cells,oct,seed,gain=.5){const out=new Float32Array(S*S);let a=1,sum=0;for(let o=0;o<oct;o++){const c=Math.min(S,cells<<o),n=vnoise(S,c,seed+o*17);for(let i=0;i<out.length;i++)out[i]+=n[i]*a;sum+=a;a*=gain;}for(let i=0;i<out.length;i++)out[i]/=sum;return out;}
// voronoi: returns {f1,f2,id} per pixel, tileable, cells across
function voronoi(S,cells,seed,jit=.9){const r=rng(seed),P=[];for(let j=0;j<cells;j++)for(let i=0;i<cells;i++)P.push([(i+.5+(r()-.5)*jit)/cells*S,(j+.5+(r()-.5)*jit)/cells*S,r()]);
 const f1=new Float32Array(S*S),f2=new Float32Array(S*S),id=new Float32Array(S*S),cs=S/cells;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const cx=Math.floor(x/cs),cy=Math.floor(y/cs);let d1=1e9,d2=1e9,bid=0;
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const gx=cx+ox,gy=cy+oy,wx=((gx%cells)+cells)%cells,wy=((gy%cells)+cells)%cells,p=P[wy*cells+wx];
   const ddx=p[0]+(gx-wx)*cs-x,ddy=p[1]+(gy-wy)*cs-y,d=ddx*ddx+ddy*ddy;if(d<d1){d2=d1;d1=d;bid=p[2];}else if(d<d2)d2=d;}
  const i=y*S+x;f1[i]=Math.sqrt(d1)/cs;f2[i]=Math.sqrt(d2)/cs;id[i]=bid;}
 return{f1,f2,id};}
const hash=(i,s=0)=>{let h=(i*374761393+s*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};

// height (0..1, S×S) → tangent-space normal map canvas
function normalCanvas(H,S,strength){const c=canvas(S,S),x=c.getContext('2d'),im=x.createImageData(S,S),d=im.data;
 for(let y=0;y<S;y++)for(let X=0;X<S;X++){const l=H[y*S+((X-1+S)%S)],r=H[y*S+((X+1)%S)],u=H[((y-1+S)%S)*S+X],b=H[((y+1)%S)*S+X];
  let nx=(l-r)*strength,ny=(u-b)*strength,nz=1;const n=Math.hypot(nx,ny,nz);const o=(y*S+X)*4;d[o]=(nx/n*.5+.5)*255;d[o+1]=(ny/n*.5+.5)*255;d[o+2]=(nz/n*.5+.5)*255;d[o+3]=255;}
 x.putImageData(im,0,0);return c;}
function rgbCanvas(S,fn){const c=canvas(S,S),x=c.getContext('2d'),im=x.createImageData(S,S),d=im.data,o3=[0,0,0];for(let i=0;i<S*S;i++){fn(i,o3);d[i*4]=o3[0];d[i*4+1]=o3[1];d[i*4+2]=o3[2];d[i*4+3]=255;}x.putImageData(im,0,0);return c;}
function grayCanvas(S,G){return rgbCanvas(S,(i,o)=>{const v=Math.max(0,Math.min(255,G[i]*255));o[0]=o[1]=o[2]=v;});}
const sat=v=>v<0?0:v>1?1:v,smooth=(a,b,x)=>{const t=sat((x-a)/(b-a));return t*t*(3-2*t);};

// draw strokes into a float buffer through a canvas (wrap-aware); returns Float32 alpha mask 0..1
function strokeMask(S,draw){const c=canvas(S,S),x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,S,S);x.strokeStyle='#fff';x.fillStyle='#fff';x.lineCap=x.lineJoin='round';
 for(const ox of[-S,0,S])for(const oy of[-S,0,S]){x.save();x.translate(ox,oy);draw(x);x.restore();}
 const d=x.getImageData(0,0,S,S).data,m=new Float32Array(S*S);for(let i=0;i<m.length;i++)m[i]=d[i*4]/255;return m;}
function crackPaths(x,S,n,r,len=7,step=26){for(let i=0;i<n;i++){let px=r()*S,py=r()*S,a=r()*6.28;x.lineWidth=.8+r()*1.6;x.beginPath();x.moveTo(px,py);for(let k=0;k<len;k++){a+=(r()-.5)*1.4;px+=Math.cos(a)*step*(.5+r());py+=Math.sin(a)*step*(.5+r());x.lineTo(px,py);if(r()<.2){const bx=px,by=py;x.moveTo(bx,by);x.lineTo(bx+(r()-.5)*40,by+(r()-.5)*40);x.moveTo(px,py);}}x.stroke();}}

/* =================== ROAD SURFACES ===================
 u (x) runs across the full road width, v (y) along it; tile length set by the world builder. */
export function roadSet(style,q=2){return cached('road'+style+q,()=>{
 const S=q>=2?1024:512,f=S/1024,r=rng(style.length*977+3);
 let H=new Float32Array(S*S),A=new Float32Array(S*S*3),RG=new Float32Array(S*S),E=null,o={rough:1,metal:0,emissiveIntensity:1,normalScale:1};
 const n1=fbmT(S,8,5,11),grain=fbmT(S,128,2,23),fine=new Float32Array(S*S);for(let i=0;i<fine.length;i++)fine[i]=hash(i,7);
 const set=(i,R,G,B)=>{A[i*3]=R;A[i*3+1]=G;A[i*3+2]=B;};
 const U=i=>(i%S)/S;
 if(style==='asphalt'||style==='neon'){const night=style==='neon';
  const cr=strokeMask(S,x=>crackPaths(x,S,10,r,6,30*f));
  const patch=strokeMask(S,x=>{for(let i=0;i<3;i++){const w=(120+r()*220)*f,h=(160+r()*380)*f,px=(.2+r()*.6)*S,py=r()*S;x.globalAlpha=1;x.fillRect(px-w/2,py,w,h);}});
  const skid=strokeMask(S,x=>{for(let i=0;i<5;i++){const u0=(.25+r()*.5)*S,v0=r()*S;x.lineWidth=(10+r()*8)*f;x.globalAlpha=.35+r()*.4;for(const s of[-1,1]){x.beginPath();x.moveTo(u0+s*48*f,v0);x.bezierCurveTo(u0+s*48*f+60*f*(r()-.5),v0+120*f,u0+s*48*f+120*(r()-.5)*f,v0+260*f,u0+s*48*f+(r()-.5)*160*f,v0+420*f);x.stroke();}}});
  const puddle=fbmT(S,4,4,91);
  for(let i=0;i<S*S;i++){const u=U(i),agg=fine[i],ag2=grain[i];
   const lane=Math.exp(-((u-.36)**2)/.006)+Math.exp(-((u-.64)**2)/.006);// polished tyre lanes
   let l=(night?.13:.25)+(n1[i]-.5)*.07+(agg-.5)*.035+(ag2-.5)*.04-lane*.03;
   l+=patch[i]*(.02+(n1[i]-.5)*.04)-skid[i]*.09-cr[i]*.08;
   let rr=.82+(agg-.5)*.18-lane*.12+patch[i]*.04-skid[i]*.08;
   H[i]=agg*.25+ag2*.45-cr[i]*.8+patch[i]*.08;
   // painted edge lines (worn)
   const edge=(u>.018&&u<.04)||(u>.96&&u<.982);const wear=n1[i]*1.4-ag2*.25;
   if(edge&&wear>.25&&!night){l=.82*(.85+agg*.15);rr=.55;H[i]+=.25;}
   if(night){const pd=smooth(.55,.62,puddle[i]);rr=rr*(1-pd)+.04*pd;l*=1-pd*.35;}
   set(i,l*(night?.95:1),l*(night?.97:.99),l*(night?1.08:1.02));RG[i]=sat(rr);}
  o.rough=1;if(night){o.normalScale=.6;E=canvas(S,S);const x=E.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,S,S);x.fillStyle='#16e0ff';x.fillRect(.018*S,0,.02*S,S);x.fillRect(.962*S,0,.02*S,S);x.fillStyle='#ff2a9a';for(let k=0;k<4;k++)x.fillRect(S/2-4*f,k*S/4,8*f,S/8);o.emissiveIntensity=1.5;}
  if(!night){// dashed centre line
   for(let i=0;i<S*S;i++){const u=U(i),v=Math.floor(i/S)/S;if(Math.abs(u-.5)<.006&&(v*4%1)<.45&&n1[i]>.32){A[i*3]=.85;A[i*3+1]=.68;A[i*3+2]=.25;RG[i]=.6;H[i]+=.15;}}}}
 else if(style==='stone'||style==='cobble'||style==='basalt'){const cob=style==='cobble',bas=style==='basalt';
  const V=voronoi(S,cob?16:bas?9:7,style.length*31,cob?.7:.95);const moss=fbmT(S,6,4,77);
  for(let i=0;i<S*S;i++){const e=V.f2[i]-V.f1[i],id=V.id[i],gap=1-smooth(.03,cob?.16:.1,e),dome=cob?sat(1-V.f1[i]*1.5):smooth(.02,.25,e);
   const agg=fine[i],tone=(id-.5)*.12+(n1[i]-.5)*.08+(agg-.5)*.05;
   let R,G,B,rr;
   if(bas){const l=.12+tone*.6;R=l*1.05;G=l*.92;B=l*.88;rr=.82+(agg-.5)*.2;if(gap>.4){R=.05;G=.03;B=.03;}}
   else if(cob){const l=.3+tone;R=l*.92;G=l*.93;B=l*1.08;rr=.75-(gap*.55)+(agg-.5)*.15;const mm=gap*smooth(.45,.7,moss[i]);R=R*(1-mm)+.12*mm;G=G*(1-mm)+.2*mm;B=B*(1-mm)+.1*mm;}
   else{const l=.44+tone,warm=id*.06;R=l*(1+warm);G=l*(.98+warm*.4);B=l*.86;rr=.88+(agg-.5)*.12;const mm=Math.max(gap*.9,smooth(.62,.8,moss[i])*(1-dome)*.8);R=R*(1-mm)+.16*mm;G=G*(1-mm)+.26*mm;B=B*(1-mm)+.1*mm;}
   if(gap>.5&&!bas){R*=.45;G*=.45;B*=.45;}
   set(i,R,G,B);RG[i]=sat(rr);H[i]=dome*.7+agg*.18+grain[i]*.15-gap*.5;}
  if(bas){E=canvas(S,S);const x=E.getContext('2d'),im=x.createImageData(S,S),d=im.data,hot=fbmT(S,5,3,55);for(let i=0;i<S*S;i++){const e=V.f2[i]-V.f1[i],g=(1-smooth(.0,.06,e))*smooth(.45,.65,hot[i]);d[i*4]=255*g;d[i*4+1]=90*g*g;d[i*4+2]=14*g;d[i*4+3]=255;}x.putImageData(im,0,0);o.emissiveIntensity=2.2;}
  o.normalScale=cob?1.4:1.2;}
 else if(style==='packed'||style==='clay'){const snow=style==='packed';const rut=strokeMask(S,x=>{x.globalAlpha=.6;for(const c of[.33,.4,.6,.67]){x.lineWidth=(snow?26:22)*f;x.beginPath();for(let y=-20;y<=S+20;y+=40){const xx=c*S+Math.sin(y*.013+c*9)*10*f;y<0?x.moveTo(xx,y):x.lineTo(xx,y);}x.stroke();}});
  const tread=new Float32Array(S*S);for(let i=0;i<S*S;i++){const y=Math.floor(i/S);tread[i]=rut[i]*(Math.sin(y*.9/f)>0?1:0);}
  const peb=strokeMask(S,x=>{for(let i=0;i<(snow?200:900);i++){x.globalAlpha=.4+r()*.6;x.beginPath();x.arc(r()*S,r()*S,(1+r()*(snow?2:3.5))*f,0,7);x.fill();}});
  const cr=snow?null:(()=>{const V=voronoi(S,10,5,1);const m=new Float32Array(S*S);for(let i=0;i<S*S;i++)m[i]=(1-smooth(0,.035,V.f2[i]-V.f1[i]))*smooth(.5,.7,n1[i]);return m;})();
  for(let i=0;i<S*S;i++){const agg=fine[i];
   if(snow){const l=.86+(n1[i]-.5)*.12+(agg-.5)*.05-rut[i]*.1;set(i,l*.93,l*.96,l*1.02);RG[i]=sat(.6-rut[i]*.25+(agg-.5)*.2);H[i]=n1[i]*.5+grain[i]*.3-rut[i]*.5+tread[i]*.12+peb[i]*.2;}
   else{const l=.5+(n1[i]-.5)*.18+(agg-.5)*.08-rut[i]*.07+peb[i]*.05-(cr?cr[i]*.2:0);set(i,l*1.18,l*.72,l*.5);RG[i]=sat(.92+(agg-.5)*.1-rut[i]*.1);H[i]=n1[i]*.6+grain[i]*.25-rut[i]*.4+peb[i]*.5-(cr?cr[i]*.6:0);}}
  if(!snow){// painted edge lines
   for(let i=0;i<S*S;i++){const u=U(i);if(((u>.02&&u<.04)||(u>.96&&u<.98))&&n1[i]>.3){A[i*3]=.86;A[i*3+1]=.82;A[i*3+2]=.76;RG[i]=.7;}}}}
 else if(style==='glass'){const V=voronoi(S,4,8,0);
  for(let i=0;i<S*S;i++){const u=U(i),v=Math.floor(i/S)/S;const seam=Math.min(Math.abs((v*4)%1-.5),Math.abs(u-.5))<.004||u<.012||u>.988;const sh=(n1[i]-.5)*.05;
   set(i,.9+sh,.88+sh,.95+sh);RG[i]=seam?.4:.08+(n1[i]-.5)*.06;H[i]=seam?0:.6+(grain[i]-.5)*.02;}
  E=canvas(S,S);const x=E.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,S,S);x.fillStyle='#ffb040';x.fillRect(0,S/2-2*f,S,4*f);x.fillRect(6*f,0,5*f,S);x.fillRect(S-11*f,0,5*f,S);o.emissiveIntensity=.7;o.normalScale=.5;}
 const map=toTex(rgbCanvas(S,(i,c)=>{c[0]=sat(A[i*3])*255;c[1]=sat(A[i*3+1])*255;c[2]=sat(A[i*3+2])*255;}));
 const normalMap=toTex(normalCanvas(H,S,style==='glass'?2:style==='asphalt'||style==='neon'?2.2:4*f+2),false);const roughnessMap=toTex(grayCanvas(S,RG),false);
 return{map,normalMap,roughnessMap,emissive:E?toTex(E):null,...o};});}

/* =================== KERB (rumble strip) =================== */
export function kerbSet(c1,c2){return cached('kerb'+c1+c2,()=>{const W=64,Hh=256,cv=canvas(W,Hh),x=cv.getContext('2d');
 // two blocks per tile along v, each with a bevelled rib
 const n=fbmT(256,16,3,4);
 x.fillStyle=c1;x.fillRect(0,0,W,Hh/2);x.fillStyle=c2;x.fillRect(0,Hh/2,W,Hh/2);
 const im=x.getImageData(0,0,W,Hh),d=im.data;for(let i=0;i<W*Hh;i++){const k=.82+n[(i*7)%n.length]*.25;d[i*4]*=k;d[i*4+1]*=k;d[i*4+2]*=k;}x.putImageData(im,0,0);
 // grime toward the outer edge
 const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba(30,25,20,.0)');g.addColorStop(.85,'rgba(30,25,20,.0)');g.addColorStop(1,'rgba(30,25,20,.45)');x.fillStyle=g;x.fillRect(0,0,W,Hh);
 const hc=canvas(W,Hh),hx=hc.getContext('2d'),ig=hx.createImageData(W,Hh),hd=ig.data,Hf=new Float32Array(Hh*Hh);
 // normal: bevel at each block end (stripes) — build height in a square buffer then crop
 const S=Hh;for(let y=0;y<S;y++)for(let X=0;X<S;X++){const v=(y%(S/2))/(S/2);const bev=Math.min(1,v*8,(1-v)*8);Hf[y*S+X]=bev*.8+n[y*S+X]*.1;}
 const nc=normalCanvas(Hf,S,6),out=canvas(W,Hh);out.getContext('2d').drawImage(nc,0,0,W,Hh,0,0,W,Hh);
 return{map:toTex(cv),normalMap:toTex(out,false)};});}

/* =================== WALLS / BARRIERS =================== */
export function wallSet(kind){return cached('wall'+kind,()=>{const S=256,r=rng(kind.length*13);const n=fbmT(S,8,4,kind.length),g=fbmT(S,64,2,9);const A=new Float32Array(S*S*3),H=new Float32Array(S*S),RG=new Float32Array(S*S);
 const col={rope:[.86,.86,.84],stone:[.5,.48,.4],snowbank:[.95,.97,1],rock:[.72,.42,.26],neon:[.12,.12,.16],basalt:[.16,.13,.13],fence:[.2,.2,.24],none:[1,1,1]}[kind]||[.6,.6,.6];
 const blocks=kind==='stone'||kind==='basalt'||kind==='rock';const V=blocks?voronoi(S,kind==='rock'?3:5,kind.length,.6):null;
 for(let i=0;i<S*S;i++){const u=(i%S)/S,v=Math.floor(i/S)/S;let k=.85+(n[i]-.5)*.35+(g[i]-.5)*.12,h=n[i]*.4+g[i]*.3,rr=.85;
  if(blocks){const e=V.f2[i]-V.f1[i];const gap=1-smooth(.02,.08,e);k*=1-gap*.55+(V.id[i]-.5)*.25;h=smooth(0,.2,e)*.7+g[i]*.3;}
  if(kind==='rope'){// concrete barrier with red/white chevron band + panel joints
   const joint=(v*4)%1<.015;if(joint){k*=.55;h=0;}if(u>.35&&u<.62){const st=((v*8+u*2)%1)<.5;A[i*3]=st?.82:.85;A[i*3+1]=st?.12:.85;A[i*3+2]=st?.12:.85;RG[i]=.6;H[i]=h;continue;}
   if(u<.12)k*=.6+u*3;// dirt along the base
  }
  if(kind==='neon'||kind==='fence'){const joint=(v*4)%1<.02;if(joint){k*=.4;}rr=.35+(g[i]-.5)*.2;h=joint?0:.5;}
  if(kind==='snowbank'){rr=.6;k=.9+(n[i]-.5)*.2;}
  A[i*3]=col[0]*k;A[i*3+1]=col[1]*k;A[i*3+2]=col[2]*k;RG[i]=rr;H[i]=h;}
 return{map:toTex(rgbCanvas(S,(i,c)=>{c[0]=sat(A[i*3])*255;c[1]=sat(A[i*3+1])*255;c[2]=sat(A[i*3+2])*255;})),normalMap:toTex(normalCanvas(H,S,5),false),roughnessMap:toTex(grayCanvas(S,RG),false)};});}

/* =================== TERRAIN DETAIL (luminance ~1 average, tinted by vertex colours) =================== */
export function detailSet(kind){return cached('det'+kind,()=>{const S=512,r=rng(kind.length*71+1);const n=fbmT(S,16,5,kind.length*5),g=fbmT(S,128,2,kind.length*9+1);
 const L=new Float32Array(S*S*3),H=new Float32Array(S*S),RG=new Float32Array(S*S);let mean=[0,0,0];
 if(kind==='grass'){const bl=strokeMask(S,x=>{for(let i=0;i<5200;i++){const px=r()*S,py=r()*S,a=-1.57+(r()-.5)*1.2,l=6+r()*12;x.globalAlpha=.25+r()*.75;x.lineWidth=1+r()*1.3;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();}});
  const cl2=fbmT(S,6,3,3);for(let i=0;i<S*S;i++){const b=bl[i],k=.55+b*.55+(n[i]-.5)*.4;const dry=smooth(.55,.75,cl2[i]);L[i*3]=k*(1+dry*.35);L[i*3+1]=k*(1-dry*.05);L[i*3+2]=k*(.85-dry*.2);H[i]=b*.6+n[i]*.3;RG[i]=.9-b*.15;}}
 else if(kind==='sand'){for(let i=0;i<S*S;i++){const x=i%S,y=(i/S)|0;const rip=Math.sin((y+n[i]*60)*.18)*.5+.5;const k=.85+(rip-.5)*.12+(g[i]-.5)*.18+(n[i]-.5)*.2;L[i*3]=k;L[i*3+1]=k*.98;L[i*3+2]=k*.95;H[i]=rip*.5+g[i]*.4;RG[i]=.95;}}
 else if(kind==='snow'){for(let i=0;i<S*S;i++){const k=.92+(n[i]-.5)*.18+(g[i]-.5)*.05;const sp=hash(i,3)>.996?.3:0;L[i*3]=k+sp;L[i*3+1]=k+sp;L[i*3+2]=k*1.03+sp;H[i]=n[i]*.7+g[i]*.2;RG[i]=sp?.2:.62;}}
 else if(kind==='dirt'||kind==='ash'){const peb=strokeMask(S,x=>{for(let i=0;i<1600;i++){x.globalAlpha=.3+r()*.7;x.beginPath();x.ellipse(r()*S,r()*S,1+r()*4,1+r()*3,r()*3,0,7);x.fill();}});
  for(let i=0;i<S*S;i++){const k=.75+(n[i]-.5)*.5+(g[i]-.5)*.2+peb[i]*.25;L[i*3]=k;L[i*3+1]=k*.97;L[i*3+2]=k*.94;H[i]=n[i]*.5+peb[i]*.6+g[i]*.2;RG[i]=.95-peb[i]*.1;}}
 else if(kind==='rock'){const V=voronoi(S,6,kind.length*3,1);const cr=strokeMask(S,x=>crackPaths(x,S,26,r,5,22));
  for(let i=0;i<S*S;i++){const e=V.f2[i]-V.f1[i];const k=.7+(n[i]-.5)*.6+(V.id[i]-.5)*.25+(g[i]-.5)*.2-cr[i]*.35-(1-smooth(0,.05,e))*.3;L[i*3]=k;L[i*3+1]=k*.98;L[i*3+2]=k*.95;H[i]=n[i]*.6+smooth(0,.25,e)*.5+g[i]*.2-cr[i]*.5;RG[i]=.88;}}
 for(let i=0;i<S*S;i++){mean[0]+=L[i*3];mean[1]+=L[i*3+1];mean[2]+=L[i*3+2];}mean=mean.map(m=>m/(S*S));
 // normalise to mean 0.5 in the texture (shader multiplies by 2)
 const map=toTex(rgbCanvas(S,(i,c)=>{c[0]=sat(L[i*3]/mean[0]*.5)*255;c[1]=sat(L[i*3+1]/mean[1]*.5)*255;c[2]=sat(L[i*3+2]/mean[2]*.5)*255;}),false);
 return{map,normalMap:toTex(normalCanvas(H,S,kind==='snow'?2:4),false),roughnessMap:toTex(grayCanvas(S,RG),false)};});}

/* =================== TRACKSIDE ADVERTISING ATLAS (original fictional brands) =================== */
export const BRANDS=[['TURBO FIZZ','#ff2a3a','#fff'],['PIXEL ARCADE','#0b0c12','#ff4d00'],['NITRO NOODLES','#ffd23a','#1a1a22'],['GRIPLINE TYRES','#121418','#ffd040'],['SUNBURST OIL','#ff8a1e','#fff'],['ZOOM COLA','#1e58ff','#fff'],['ACORN BANK','#1f8a4a','#f4f0e0'],['COMET PIZZA','#f4f0e0','#d8302a']];
export function bannerAtlas(){return cached('banners',()=>{const W=1024,Hh=512,c=canvas(W,Hh),x=c.getContext('2d');// 2 cols × 4 rows, 512×128 each
 BRANDS.forEach(([t,bg,fg],k)=>{const ox=(k%2)*512,oy=(k>>1)*128;x.fillStyle=bg;x.fillRect(ox,oy,512,128);
  const g=x.createLinearGradient(0,oy,0,oy+128);g.addColorStop(0,'rgba(255,255,255,.12)');g.addColorStop(.5,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.18)');x.fillStyle=g;x.fillRect(ox,oy,512,128);
  x.fillStyle=fg;x.globalAlpha=.9;x.fillRect(ox+16,oy+104,480,6);x.globalAlpha=1;
  x.font='italic 900 66px Anton, Impact, "Arial Black", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle=fg;x.fillText(t,ox+256,oy+58,470);
  x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=4;x.strokeRect(ox+2,oy+2,508,124);});
 return toTex(c,true,false);});}

/* =================== KART DECAL ATLAS ===================
 512×512: [0..64]² flat white · race numbers 1–16 in 64px discs (rows 1–2) · checker · sponsor stickers · carbon weave · grille */
export const ATLAS={white:[2/512,2/512,30/512,30/512],num:n=>{const k=(n-1)%16,cx=(k%8)*64,cy=64+(k>>3)*64;return[cx/512,cy/512,(cx+64)/512,(cy+64)/512];},
 checker:[0,192/512,256/512,224/512],sticker:k=>{const cx=(k%2)*256,cy=256+(k>>1)*64;return[cx/512,cy/512,(cx+256)/512,(cy+64)/512];},
 carbon:[256/512,192/512,320/512,256/512],grille:[320/512,192/512,384/512,256/512],stripe:[64/512,0,128/512,64/512],tread:[128/512,0,192/512,64/512]};
export function kartAtlas(){return cached('kartatlas',()=>{const S=512,c=canvas(S,S),x=c.getContext('2d'),hc=canvas(S,S),hx=hc.getContext('2d');
 x.fillStyle='#fff';x.fillRect(0,0,S,S);hx.fillStyle='#808080';hx.fillRect(0,0,S,S);
 // stripe region: white with two dark racing stripes
 x.fillStyle='#14161c';x.fillRect(64+12,0,10,64);x.fillRect(64+42,0,10,64);
 // tread region (used by tyre sidewalls/tread)
 x.fillStyle='#2a2a2e';x.fillRect(128,0,64,64);hx.fillStyle='#606060';hx.fillRect(128,0,64,64);hx.fillStyle='#202020';for(let i=0;i<8;i++){hx.fillRect(128,i*8,64,3);}
 // numbers
 for(let n=1;n<=16;n++){const k=n-1,cx=(k%8)*64,cy=64+(k>>3)*64;x.fillStyle='#fff';x.fillRect(cx,cy,64,64);x.fillStyle='#14161c';x.beginPath();x.arc(cx+32,cy+32,29,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(cx+32,cy+32,25,0,7);x.fill();
  x.fillStyle='#14161c';x.font='900 34px Anton, Impact, "Arial Black", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(n),cx+32,cy+34);
  hx.fillStyle='#909090';hx.beginPath();hx.arc(cx+32,cy+32,29,0,7);hx.fill();}
 // checker
 for(let i=0;i<32;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?'#111':'#f4f4f4';x.fillRect(i*8,192+j*8,8,8);}
 // carbon weave
 for(let i=0;i<8;i++)for(let j=0;j<8;j++){const g=x.createLinearGradient(256+i*8,192+j*8,256+i*8+8,192+j*8+8);const a=(i+j)%2;g.addColorStop(0,a?'#2a2c32':'#16171b');g.addColorStop(1,a?'#16171b':'#2a2c32');x.fillStyle=g;x.fillRect(256+i*8,192+j*8,8,8);hx.fillStyle=a?'#8a8a8a':'#767676';hx.fillRect(256+i*8,192+j*8,8,8);}
 // grille
 x.fillStyle='#0c0d10';x.fillRect(320,192,64,64);x.fillStyle='#3a3c44';for(let i=0;i<8;i++)for(let j=0;j<8;j++){x.beginPath();x.arc(324+i*8,196+j*8,2.4,0,7);x.fill();}
 hx.fillStyle='#404040';hx.fillRect(320,192,64,64);
 // stickers: 8 brand decals 256×64
 BRANDS.forEach(([t,bg,fg],k)=>{const cx=(k%2)*256,cy=256+(k>>1)*64;x.fillStyle=bg;x.fillRect(cx,cy,256,64);x.fillStyle=fg;x.font='italic 900 30px Anton, Impact, "Arial Black", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(t,cx+128,cy+33,240);hx.fillStyle='#888';hx.fillRect(cx,cy,256,64);});
 const H=new Float32Array(S*S),d=hx.getImageData(0,0,S,S).data;for(let i=0;i<S*S;i++)H[i]=d[i*4]/255;
 const map=toTex(c,true,false),normalMap=toTex(normalCanvas(H,S,3),false,false);return{map,normalMap};});}

/* small generic detail normal for fur / plastics */
export function microNormal(){return cached('micro',()=>{const S=256,n=fbmT(S,64,3,5),g=fbmT(S,16,2,6);const H=new Float32Array(S*S);for(let i=0;i<S*S;i++)H[i]=n[i]*.7+g[i]*.3;return toTex(normalCanvas(H,S,3),false);});}
