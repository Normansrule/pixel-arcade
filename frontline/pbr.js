// FRONTLINE OPS — physically based surface sets generated in code (albedo + normal + roughness), baked once at load.
// Everything is tileable and drawn into typed arrays, then handed to three as canvas textures. No image files.
import * as THREE from '../vendor/three.module.min.js';

let seed=4242;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const cl=(v,a=0,b=1)=>v<a?a:v>b?b:v;
const hash=(x,y)=>{let h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295;};
function vnoise(n){const g=new Float32Array(n*n);for(let i=0;i<g.length;i++)g[i]=R();return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,a=(xi%n+n)%n,b=(yi%n+n)%n,a1=(a+1)%n,b1=(b+1)%n;
 const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return(g[b*n+a]*(1-u)+g[b*n+a1]*u)*(1-v)+(g[b1*n+a]*(1-u)+g[b1*n+a1]*u)*v;};}
// tileable fbm over S x S, base period p cells, returns 0..1-ish
function fbm(S,p=8,oct=4,sx=1,sy=1){const ns=[];for(let o=0;o<oct;o++)ns.push(vnoise(p<<o));const out=new Float32Array(S*S);
 for(let j=0;j<S;j++)for(let i=0;i<S;i++){let v=0,a=.5,t=0;for(let o=0;o<oct;o++){const s=(p<<o)/S;v+=ns[o](i*s*sx,j*s*sy)*a;t+=a;a*=.5;}out[j*S+i]=v/t;}return out;}
// fields shared between surfaces (sampled with offsets so they do not visibly correlate)
let F=null;function fields(){if(F)return F;F={big:fbm(512,3,5),mid:fbm(512,8,5),fine:fbm(512,32,3),streak:fbm(512,24,4,1,.08)};return F;}
const at=(A,S,i,j,ox=0,oy=0)=>A[((j+oy)%S+S)%S*S+((i+ox)%S+S)%S];
// line masks (cracks / scratches) drawn with canvas then read back
function lineMask(S,draw){const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d',{willReadFrequently:true});draw(x,S);const d=x.getImageData(0,0,S,S).data,m=new Float32Array(S*S);for(let k=0;k<S*S;k++)m[k]=d[k*4+3]/255;return m;}
function cracks(x,S,n,len,w=1.2,a=.9){x.lineCap='round';for(let i=0;i<n;i++){let px=R()*S,py=R()*S,ang=R()*6.28;const segs=6+R()*len|0;let lw=w*(.7+R()*.8);
 for(let k=0;k<segs;k++){const nx=px+Math.cos(ang)*(4+R()*9),ny=py+Math.sin(ang)*(4+R()*9);x.strokeStyle=`rgba(0,0,0,${a})`;x.lineWidth=lw;for(const[ox,oy]of[[0,0],[S,0],[-S,0],[0,S],[0,-S]]){x.beginPath();x.moveTo(px+ox,py+oy);x.lineTo(nx+ox,ny+oy);x.stroke();}
  px=nx;py=ny;ang+=(R()-.5)*1.1;lw*=.93;if(R()<.12){const b=ang+(R()<.5?1:-1)*(.6+R()*.6);let qx=px,qy=py,bl=lw*.7;for(let q=0;q<4;q++){const mx=qx+Math.cos(b)*(3+R()*6),my=qy+Math.sin(b)*(3+R()*6);x.lineWidth=bl;x.beginPath();x.moveTo(qx,qy);x.lineTo(mx,my);x.stroke();qx=mx;qy=my;bl*=.8;}}}}}
function canvasFrom(S,fill){const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');const im=x.createImageData(S,S);fill(im.data);x.putImageData(im,0,0);return c;}
function tex(c,srgb=true,aniso=8){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=aniso;if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.generateMipmaps=true;return t;}
function normalOf(H,S,str){return canvasFrom(S,d=>{for(let j=0;j<S;j++)for(let i=0;i<S;i++){const k=j*S+i,dx=(H[j*S+(i+1)%S]-H[j*S+(i-1+S)%S])*str,dy=(H[((j+1)%S)*S+i]-H[((j-1+S)%S)*S+i])*str,l=Math.hypot(dx,dy,1);
 d[k*4]=(-dx/l*.5+.5)*255;d[k*4+1]=(dy/l*.5+.5)*255;d[k*4+2]=(1/l*.5+.5)*255;d[k*4+3]=255;}});}
function roughOf(Rf,S){return canvasFrom(S,d=>{for(let k=0;k<S*S;k++){const v=cl(Rf[k])*255;d[k*4]=d[k*4+1]=d[k*4+2]=v;d[k*4+3]=255;}});}
// build one surface: fn(i,j,out) writes out.r,g,b (0..255), out.h (height 0..1), out.ro (roughness)
function surface(S,fn,nstr=3){const A=new Uint8ClampedArray(S*S*4),H=new Float32Array(S*S),Rf=new Float32Array(S*S),o={r:0,g:0,b:0,h:0,ro:.9};
 for(let j=0;j<S;j++)for(let i=0;i<S;i++){fn(i,j,o);const k=j*S+i;A[k*4]=o.r;A[k*4+1]=o.g;A[k*4+2]=o.b;A[k*4+3]=255;H[k]=o.h;Rf[k]=o.ro;}
 const map=tex(canvasFrom(S,d=>d.set(A)));return{map,normalMap:tex(normalOf(H,S,nstr),false),roughnessMap:tex(roughOf(Rf,S),false),H,A};}

/* ---------- brick module (reused by brick walls and plaster patches) ---------- */
// cols x rows bricks per tile; returns {e: distance into brick (px, <0 = mortar), id, u, v}
function brickAt(i,j,S,cols,rows,mortar){const bw=S/cols,rh=S/rows,row=Math.floor(j/rh),off=(row&1)*bw/2,x=(i+off)%S,col=Math.floor(x/bw),u=x-col*bw,v=j-row*rh;
 const e=Math.min(u,bw-u,v,rh-v)-mortar/2;return{e,id:hash(col%cols,row%rows),u:u/bw,v:v/rh};}

export function makePBR(){seed=4242;const f=fields(),S=512,B=f.big,M=f.mid,Fi=f.fine,St=f.streak;const out={};
 /* ---------- PLASTER: trowelled render with exposed-brick patches, hairline cracks, water marks ---------- */
 {const crk=lineMask(S,x=>cracks(x,S,9,14,1.3)),patchN=fbm(S,2,5);
  out.plaster=surface(S,(i,j,o)=>{const k=j*S+i,b=at(B,S,i,j),m=at(M,S,i,j,90,40),fi=at(Fi,S,i,j),pn=patchN[k]+(fi-.5)*.18,st=at(St,S,i,j,200,0);
   const patch=sm(.735,.745,pn),lip=sm(.71,.735,pn)*(1-patch);
   let r=230,g=224,bl=212;const mott=.9+b*.16+(m-.5)*.08;r*=mott;g*=mott;bl*=mott*.99;
   // water marks / dirt streaks running down
   const wm=sm(.55,.75,st)*.18;r*=1-wm;g*=1-wm*1.05;bl*=1-wm*1.15;
   let h=.72+(m-.5)*.05+(fi-.5)*.035+lip*.08,ro=.9+(fi-.5)*.1;
   if(patch>0){const br=brickAt(i,j,S,10,30,3);const inB=sm(-.5,1,br.e);const bv=.82+br.id*.3;
    const pr=170*bv,pg=128*bv,pb=104*bv,mr=176,mg=168,mb=154;const cr=pr*inB+mr*(1-inB),cg=pg*inB+mg*(1-inB),cb=pb*inB+mb*(1-inB);
    r=r*(1-patch)+cr*patch*(.9+fi*.15);g=g*(1-patch)+cg*patch*(.9+fi*.15);bl=bl*(1-patch)+cb*patch*(.9+fi*.15);h=h*(1-patch)+(.38+inB*.16+(fi-.5)*.04)*patch;ro=ro*(1-patch)+(.86+(1-inB)*.08)*patch;}
   const c=crk[k];r*=1-c*.55;g*=1-c*.57;bl*=1-c*.6;h-=c*.12;ro+=c*.08;
   o.r=r;o.g=g;o.b=bl;o.h=h;o.ro=ro;},3.2);}
 /* ---------- BRICK: running bond with bevelled faces, chipped corners, burnt headers, soot ---------- */
 out.brick=surface(S,(i,j,o)=>{const k=j*S+i,br=brickAt(i,j,S,16,48,2.2),fi=at(Fi,S,i,j,30,70),m=at(M,S,i,j,10,300),b=at(B,S,i,j,77,11);
  const chip=sm(.62,.75,fi+m*.25-.2)*sm(3,0,br.e);const e=br.e-chip*2.5;const inB=sm(-.3,1.2,e);
  const id=br.id,burnt=id<.12?.55:id>.93?1.18:1;const bv=(.78+id*.38)*burnt*(.92+fi*.16);
  let r=168*bv,g=88*bv,bl=64*bv;if(id>.5&&id<.56){r*=.85;g*=.95;bl*=1.05;}
  const mr=176+(fi-.5)*30,mg=166+(fi-.5)*28,mb=150+(fi-.5)*24;
  r=r*inB+mr*(1-inB);g=g*inB+mg*(1-inB);bl=bl*inB+mb*(1-inB);
  const soot=sm(.6,.85,b)*.35;r*=1-soot;g*=1-soot;bl*=1-soot*.9;
  o.r=r;o.g=g;o.b=bl;o.h=.25+inB*(.55+sm(0,2.5,e)*.12)+(fi-.5)*.06*inB;o.ro=inB?.82+(fi-.5)*.12+(1-inB)*.12:.95;},3.4);
 /* ---------- CONCRETE: cast panels with seams, form-tie holes, aggregate pits, rust/water streaks, cracks ---------- */
 {const crk=lineMask(S,x=>cracks(x,S,6,16,1.1)),pits=new Float32Array(S*S);for(let n=0;n<1400;n++){const cx=R()*S|0,cy=R()*S|0,r=R()<.85?1:2;for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r)pits[((cy+y+S)%S)*S+(cx+x+S)%S]=1;}
  out.concrete=surface(S,(i,j,o)=>{const k=j*S+i,b=at(B,S,i,j,150,90),m=at(M,S,i,j,40,200),fi=at(Fi,S,i,j,111,5),st=at(St,S,i,j,60,10);
   const sx=Math.min(i%256,256-i%256),sy=Math.min(j%256,256-j%256),seam=Math.min(sx,sy);const sd=sm(2.5,0,seam);
   const tx=(i+64)%128-64,ty=(j+64)%128-64,td=Math.hypot(tx,ty),tie=sm(5,3,td),tieRing=sm(9,6,td)*(1-tie);
   let v=188*(.88+b*.18+(m-.5)*.1)+(fi-.5)*16;const stain=sm(.5,.78,st)*(.6+b*.4);v*=1-stain*.22;
   let r=v,g=v*.985,bl=v*.96;const rust=sm(.72,.9,st)*sm(40,0,Math.abs(tx))*.4;r=r*(1-rust)+120*rust;g=g*(1-rust)+80*rust;bl=bl*(1-rust)+56*rust;
   const p=pits[k],c=crk[k];const dk=1-p*.35-c*.5-sd*.45-tie*.6-tieRing*.06;r*=dk;g*=dk;bl*=dk;
   o.r=r;o.g=g;o.b=bl;o.h=.7+(m-.5)*.06+(fi-.5)*.03-p*.12-c*.1-sd*.14-tie*.25+tieRing*.03;o.ro=.84+(b-.5)*.14+stain*.06+p*.1-sd*.02;},2.6);}
 /* ---------- STONE: dressed ashlar with irregular joints and tooled faces ---------- */
 out.stone=surface(S,(i,j,o)=>{const k=j*S+i,rows=8,rh=S/rows,row=Math.floor(j/rh),rr=hash(row,7),bw=S/(3+(rr*3|0)),off=(row*97)%S,x=(i+off)%S,col=Math.floor(x/bw),u=x-col*bw,v=j-row*rh;
  const fi=at(Fi,S,i,j,5,9),m=at(M,S,i,j,300,60),wob=(at(M,S,i,j,7,7)-.5)*7;const e=Math.min(u,bw-u,v,rh-v)-2.5+wob;const inB=sm(-.5,2,e);const id=hash(col+row*31,row);
  const bv=(.85+id*.25)*(.92+m*.14);let r=214*bv,g=200*bv,bl=176*bv;const mr=150,mg=140,mb=124;r=r*inB+mr*(1-inB);g=g*inB+mg*(1-inB);bl=bl*inB+mb*(1-inB);r+= (fi-.5)*18;g+=(fi-.5)*17;bl+=(fi-.5)*15;
  o.r=r;o.g=g;o.b=bl;o.h=.3+inB*(.5+sm(0,6,e)*.1+(fi-.5)*.08+(m-.5)*.08);o.ro=.88+(fi-.5)*.1;},3);
 /* ---------- METAL cladding: corrugated, chipped paint over rust, run-off streaks (u runs along the wall) ---------- */
 out.metal=surface(S,(i,j,o)=>{const k=j*S+i,rib=Math.sin(i/32*Math.PI*2),b=at(B,S,i,j,9,99),m=at(M,S,i,j,250,3),fi=at(Fi,S,i,j,40,40),st=at(St,S,i,j,333,0);
  const chip=sm(.71,.74,m*.75+fi*.35+b*.1-.08);const streak=sm(.55,.82,st)*(.4+b*.6)*(1-chip);
  let r=222,g=222,bl=220;const dirt=(1-b)*.12+streak*.3;r*=1-dirt*.6;g*=1-dirt*.75;bl*=1-dirt*.9;
  const rr=104+(fi-.5)*40,rg=72+(fi-.5)*24,rb=52+(fi-.5)*14;r=r*(1-chip)+rr*chip;g=g*(1-chip)+rg*chip;bl=bl*(1-chip)+rb*chip;
  const shade=.93+rib*.07;o.r=r*shade;o.g=g*shade;o.b=bl*shade;o.h=.5+rib*.32+(fi-.5)*.02-chip*.04;o.ro=.42+(fi-.5)*.08+chip*.48+streak*.18;},1.6);
 /* ---------- ASPHALT: aggregate, sealed cracks, patch repairs, oil darkening ---------- */
 {const crk=lineMask(S,x=>{cracks(x,S,7,22,2.2,1);}),stones=new Float32Array(S*S);for(let n=0;n<9000;n++){const cx=R()*S|0,cy=R()*S|0,r=R()<.7?1:2,h=.4+R()*.6;for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+.5){const q=((cy+y+S)%S)*S+(cx+x+S)%S;stones[q]=Math.max(stones[q],h*(1-(x*x+y*y)/(r*r+2)));}}
  out.asphalt=surface(S,(i,j,o)=>{const k=j*S+i,b=at(B,S,i,j,20,20),m=at(M,S,i,j,80,180),fi=at(Fi,S,i,j,220,90);const patch=sm(.66,.68,at(B,S,i,j,250,250)*.8+m*.3);
   const s=stones[k];let v=74+b*22+(fi-.5)*14+s*36;v*=1-patch*.25;const oil=sm(.7,.85,at(M,S,i,j,400,100))*.3;v*=1-oil;const c=crk[k];v*=1-c*.4;
   o.r=v;o.g=v;o.b=v*1.03+2;o.h=.5+s*.18-c*.15+(m-.5)*.05+patch*.03;o.ro=.86+(fi-.5)*.08-patch*.08-oil*.28+c*.05;},2.2);}
 /* ---------- SLAB paving: chamfered flagstones with tint drift and stains ---------- */
 out.slab=surface(S,(i,j,o)=>{const k=j*S+i,cs=128,cx=Math.floor(i/cs),cy=Math.floor(j/cs),u=i%cs,v=j%cs,e=Math.min(u,cs-u,v,cs-v)-1.5,id=hash(cx,cy);const inS=sm(0,3,e);
  const b=at(B,S,i,j,60,60),fi=at(Fi,S,i,j,9,30),m=at(M,S,i,j,200,40);let val=(150+id*34)*(.9+b*.16)+(fi-.5)*16;const stain=sm(.62,.8,m)*.25;val*=1-stain;
  const lip=sm(8,1,e)*.08;const g=val*(1-lip)*inS+val*.66*(1-inS);o.r=g;o.g=g*.985;o.b=g*.955;o.h=.25+inS*(.6+(fi-.5)*.05);o.ro=inS?.78+(fi-.5)*.1+stain*.1:.95;},2.4);
 /* ---------- ROOF (flat): bitumen membrane with gravel and seam lines ---------- */
 out.roof=surface(256,(i,j,o)=>{const fi=at(Fi,S,i*2,j*2,30,0),m=at(M,S,i*2,j*2,0,60);const seam=sm(1.5,0,Math.abs((j%64)-32)-30);let v=88+fi*40+(m-.5)*18;v*=1-seam*.3;
  o.r=v;o.g=v*.98;o.b=v*.95;o.h=.5+fi*.3-seam*.1;o.ro=.9+(fi-.5)*.1;},2.5);
 return out;}

/* ---------- ground surfaces: proper height-derived normals ---------- */
export function groundPBR(kind){const f=fields(),S=512,B=f.big,M=f.mid,Fi=f.fine;seed=kind.length*977;
 const pebbles=new Float32Array(S*S);const np=kind==='gravel'?14000:kind==='dirt'?2600:kind==='sand'?900:kind==='grass'?600:0;
 for(let n=0;n<np;n++){const cx=R()*S|0,cy=R()*S|0,r=kind==='gravel'?1+(R()*2.6|0):R()<.8?1:2;for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++)if(x*x+y*y<=r*r+.5){const q=((cy+y+S)%S)*S+(cx+x+S)%S;pebbles[q]=Math.max(pebbles[q],(1-(x*x+y*y)/(r*r+2))*(.6+R()*.4));}}
 const P={sand:[[214,190,150],[196,168,126]],dirt:[[150,132,104],[112,98,76]],snow:[[238,242,248],[214,222,236]],grass:[[104,120,66],[138,136,84]],gravel:[[150,146,138],[118,116,110]]}[kind];
 return surface(S,(i,j,o)=>{const k=j*S+i,b=at(B,S,i,j,17,3),m=at(M,S,i,j,3,17),fi=at(Fi,S,i,j,71,13),p=pebbles[k];const mix=sm(.35,.7,m*.7+b*.3);
  let r=P[0][0]*(1-mix)+P[1][0]*mix,g=P[0][1]*(1-mix)+P[1][1]*mix,bl=P[0][2]*(1-mix)+P[1][2]*mix;const n=(fi-.5)*(kind==='snow'?10:34)+(b-.5)*20;r+=n;g+=n*.95;bl+=n*.85;
  if(p){const pv=kind==='snow'?0:(.75+hash(i>>1,j>>1)*.5);r=r*(1-p*.6)+150*pv*p*.6;g=g*(1-p*.6)+144*pv*p*.6;bl=bl*(1-p*.6)+134*pv*p*.6;}
  let h=b*.25+m*.2+fi*.08+p*.35;if(kind==='sand'){const rip=Math.sin((i*.11+j*.05+m*14)*1.0);h+=rip*.08;r+=rip*4;g+=rip*4;bl+=rip*3;}
  o.r=r;o.g=g;o.b=bl;o.h=h;o.ro=kind==='snow'?.62+(fi-.5)*.2:kind==='sand'?.96:.92-p*.1;},kind==='snow'?1.6:kind==='sand'?2.2:3);}

/* ---------- soldier fabric: multi-scale camouflage + weave normal ---------- */
export function camo(kind){const S=256;seed=kind==='A'?77:kind==='B'?99:55;const n1=fbm(S,3,4),n2=fbm(S,6,4),n3=fbm(S,12,3);
 const PAL={A:[[150,132,96],[112,104,72],[86,90,60],[176,160,120],[70,62,46]],B:[[84,88,74],[58,62,52],[106,108,92],[38,40,36],[74,70,58]]}[kind];
 const c=canvasFrom(S,d=>{for(let j=0;j<S;j++)for(let i=0;i<S;i++){const k=j*S+i;let col;
  if(i<S/2){const a=n1[k],b=n2[(k+4111)%(S*S)],c3=n3[k];col=PAL[0];if(a>.55)col=PAL[1];if(b>.58)col=PAL[2];if(a<.38&&c3>.5)col=PAL[3];if(b<.36&&a>.5)col=PAL[4];}
  else col=[232,232,232];const w=((i&3)<2?1:.94)*((j&3)<2?1:.95)*(.93+n3[k]*.12);d[k*4]=col[0]*w;d[k*4+1]=col[1]*w;d[k*4+2]=col[2]*w;d[k*4+3]=255;}});
 return tex(c);}
let weave=null;export function fabricNormal(){if(weave)return weave;const S=128,H=new Float32Array(S*S);const n=fbm(S,8,3);
 for(let j=0;j<S;j++)for(let i=0;i<S;i++){const a=Math.sin(i*Math.PI/2)*.5+.5,b=Math.sin(j*Math.PI/2)*.5+.5;H[j*S+i]=((i+j)>>1&1?a:b)*.6+n[j*S+i]*.8;}return weave=tex(normalOf(H,S,1.4),false);}

/* ---------- weapon finishes: cerakote speckle with worn scratches (roughness + albedo), polymer stipple ---------- */
export function gunFinish(){const S=256;seed=31;const n=fbm(S,16,3),m=fbm(S,4,4);const scr=lineMask(S,x=>{x.lineCap='round';for(let i=0;i<180;i++){const px=R()*S,py=R()*S,a=R()*6.28,l=4+R()*26;x.strokeStyle=`rgba(0,0,0,${.3+R()*.7})`;x.lineWidth=.6+R()*.8;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();}});
 const A=new Uint8ClampedArray(S*S*4),H=new Float32Array(S*S),Rf=new Float32Array(S*S);for(let k=0;k<S*S;k++){const s=scr[k]*sm(.45,.6,m[k]),sp=n[k];const v=200+sp*40+s*55;A[k*4]=A[k*4+1]=A[k*4+2]=v;A[k*4+3]=255;H[k]=sp*.4-s*.25;Rf[k]=.62+(sp-.5)*.18-s*.38+(m[k]-.5)*.1;}
 const st=new Float32Array(S*S);for(let k=0;k<S*S;k++){const i=k%S,j=k/S|0;st[k]=hash(i>>1,j>>1)*.7+n[k]*.3;}
 return{map:tex(canvasFrom(S,d=>d.set(A))),roughnessMap:tex(roughOf(Rf,S),false),normalMap:tex(normalOf(H,S,2),false),stipple:tex(normalOf(st,S,3.5),false)};}

/* ---------- decal atlas (4 x 2 cells of 256): grime and detail that breaks up tiling ---------- */
// 0 torn poster, 1 painted tag, 2 water stain, 3 crack web, 4 soot burn, 5 oil stain (ground), 6 drain grate (ground), 7 rubble/dirt spill (ground)
export function decalAtlas(){const W=1024,H=512,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');seed=808;
 const cell=(n,fn)=>{x.save();x.translate((n%4)*256,(n>>2)*256);x.beginPath();x.rect(0,0,256,256);x.clip();fn();x.restore();};
 const blob=(cx,cy,r,col,k=14)=>{x.fillStyle=col;x.beginPath();for(let i=0;i<=k;i++){const a=i/k*6.283,rr=r*(.7+R()*.5);i?x.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr):x.moveTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}x.fill();};
 cell(0,()=>{for(let p=0;p<3;p++){const px=40+p*50+R()*20,py=30+R()*30,w=90+R()*30,h=130+R()*30;x.save();x.translate(px,py);x.rotate((R()-.5)*.12);x.fillStyle=['#e6dcc4','#d8c8a4','#cfd4d8'][p];x.fillRect(0,0,w,h);
  x.fillStyle=['#a8321e','#2a4a6a','#1e1e1e'][p];x.fillRect(8,10,w-16,h*.34);x.fillStyle='rgba(30,30,30,.75)';for(let l=0;l<6;l++)x.fillRect(10,h*.5+l*10,(w-20)*(.5+R()*.5),5);
  x.globalCompositeOperation='destination-out';for(let t=0;t<8;t++)blob(R()*w,h-R()*30,6+R()*18,'#000',8);x.globalCompositeOperation='source-over';x.fillStyle='rgba(90,70,40,.18)';x.fillRect(0,0,w,h);x.restore();}});
 cell(1,()=>{x.lineCap='round';x.lineJoin='round';const cols=['#d23a2a','#2a7ad2','#e8e0d0','#1a1a1a','#3aa860'];for(let s=0;s<3;s++){x.strokeStyle=cols[(R()*cols.length)|0];x.lineWidth=7+R()*7;x.globalAlpha=.85;x.beginPath();let px=30+R()*40,py=100+R()*60;x.moveTo(px,py);
  for(let k=0;k<9;k++){px+=12+R()*16;py+=(R()-.5)*70;x.quadraticCurveTo(px-8,py-30*(R()-.5),px,py);}x.stroke();}x.globalAlpha=.6;x.fillStyle='#1a1a1a';for(let d=0;d<10;d++){x.fillRect(40+R()*180,150+R()*60,2,8+R()*30);}x.globalAlpha=1;});
 cell(2,()=>{for(let k=0;k<26;k++){const cx=60+R()*136,w=4+R()*16,g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'rgba(40,32,22,.0)');g.addColorStop(.15,'rgba(40,32,22,.35)');g.addColorStop(1,'rgba(40,32,22,0)');x.fillStyle=g;x.fillRect(cx,0,w,180+R()*76);}
  const g2=x.createRadialGradient(128,30,4,128,30,110);g2.addColorStop(0,'rgba(30,26,20,.4)');g2.addColorStop(1,'rgba(30,26,20,0)');x.fillStyle=g2;x.fillRect(0,0,256,140);});
 cell(3,()=>{x.strokeStyle='rgba(20,18,16,.85)';x.lineCap='round';for(let b=0;b<7;b++){let px=128,py=128,a=b/7*6.28+R()*.4,lw=3;x.beginPath();x.moveTo(px,py);for(let k=0;k<10;k++){px+=Math.cos(a)*(8+R()*8);py+=Math.sin(a)*(8+R()*8);a+=(R()-.5)*.8;x.lineWidth=lw;x.lineTo(px,py);lw*=.86;}x.stroke();}
  const g=x.createRadialGradient(128,128,0,128,128,30);g.addColorStop(0,'rgba(20,18,16,.8)');g.addColorStop(1,'rgba(20,18,16,0)');x.fillStyle=g;x.fillRect(0,0,256,256);});
 cell(4,()=>{for(let k=0;k<30;k++){const cx=128+(R()-.5)*90,cy=150+(R()-.5)*60-k*2,r=20+R()*60,g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(12,10,8,.35)');g.addColorStop(1,'rgba(12,10,8,0)');x.fillStyle=g;x.fillRect(0,0,256,256);}});
 cell(5,()=>{for(let k=0;k<14;k++){const cx=128+(R()-.5)*80,cy=128+(R()-.5)*80,r=20+R()*50,g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(8,8,10,.55)');g.addColorStop(.7,'rgba(16,14,18,.25)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,256,256);}});
 cell(6,()=>{x.fillStyle='#2a2a2c';x.fillRect(48,48,160,160);x.fillStyle='#55575a';x.fillRect(56,56,144,144);x.fillStyle='#0c0c0e';for(let k=0;k<9;k++)x.fillRect(66+k*15,64,8,128);x.strokeStyle='rgba(120,70,40,.5)';x.lineWidth=6;x.strokeRect(54,54,148,148);});
 cell(7,()=>{for(let k=0;k<60;k++){const cx=128+(R()-.5)*170,cy=128+(R()-.5)*170,r=2+R()*9,v=90+R()*80|0;x.fillStyle=`rgba(${v},${v*.95|0},${v*.88|0},.95)`;x.beginPath();x.ellipse(cx,cy,r,r*.7,R()*3,0,7);x.fill();}
  const g=x.createRadialGradient(128,128,0,128,128,120);g.addColorStop(0,'rgba(70,62,52,.45)');g.addColorStop(1,'rgba(70,62,52,0)');x.globalCompositeOperation='destination-over';x.fillStyle=g;x.fillRect(0,0,256,256);x.globalCompositeOperation='source-over';});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
