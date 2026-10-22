// STORM ROYALE — building system: grid pieces (wall / floor / ramp / roof) in wood, stone and metal plus the
// prefab house materials. Instanced rendering, per-piece HP, collision boxes + walkable surfaces, ray hits,
// quick placement planning (ramp runs, level snapping), ghost previews and structural collapse.
// Look: every material is one 512px atlas (a 4x4 m surface on top, four trim swatches along the bottom: painted
// trim, stone plinth, dark beam, steel). Pieces carry real frames / beams / ribs / sills, houses get gable roofs,
// and one shared shader patch draws the build-in sweep (holographic blueprint rising), hit flash and damage cracks.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,rng,rayBox,boxNormal,M,normalFrom,tnoise} from './util.js';
export const CELL=4,H=4,TH=.24,ROOFH=1.7,COST=10,GR=2;
export const D=[[0,1],[1,0],[0,-1],[-1,0]];
export const TYPES=['wall','floor','ramp','roof'];
// yield: material the pickaxe harvests from it (0 wood 1 stone 2 metal)
export const MATS=[{n:'WOOD',hp:150,bt:.6,yield:0},{n:'STONE',hp:300,bt:1.1,yield:1},{n:'METAL',hp:500,bt:1.7,yield:2},{n:'PLASTER',hp:300,bt:0,yield:0},{n:'SHINGLE',hp:220,bt:0,yield:0},{n:'PLANK',hp:260,bt:0,yield:0}];
const ck=(ix,iz)=>(ix+600)*4096+(iz+600);

/* ---------- textures: 512 atlas, main 512x384 on top, 4 swatches 128x128 along the bottom ---------- */
let R=rng(1);const rnd=()=>R();
function grain(x,x0,y0,w,h,n,a){for(let i=0;i<n;i++){x.fillStyle=`rgba(${rnd()<.5?'0,0,0':'255,255,255'},${rnd()*a})`;x.fillRect(x0+rnd()*w,y0+rnd()*h,1+rnd()*2.5,1);}}
function fbmFill(x,x0,y0,w,h,cells,seed,lo,hi,rgb,alpha=1){const n=256,f=tnoise(n,cells,seed,4),img=x.getImageData(x0,y0,w,h),d=img.data;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const v=f[(j%n)*n+(i%n)],k=(j*w+i)*4,m=lo+(hi-lo)*v;d[k]=d[k]*(1-alpha)+d[k]*m*alpha;d[k+1]=d[k+1]*(1-alpha)+d[k+1]*m*alpha;d[k+2]=d[k+2]*(1-alpha)+d[k+2]*m*alpha;}x.putImageData(img,x0,y0);}
function streaks(x,x0,y0,w,h,n,col,len){for(let i=0;i<n;i++){const px=x0+rnd()*w,py=y0+rnd()*h*.3,l=len*(.4+rnd()),g=x.createLinearGradient(px,py,px,py+l);g.addColorStop(0,`rgba(${col},${.08+rnd()*.12})`);g.addColorStop(1,`rgba(${col},0)`);x.fillStyle=g;x.fillRect(px,py,1.5+rnd()*3,l);}}
function grime(x,x0,y0,w,h,a=.35){let g=x.createLinearGradient(0,y0+h,0,y0+h*.7);g.addColorStop(0,`rgba(40,32,22,${a})`);g.addColorStop(1,'rgba(40,32,22,0)');x.fillStyle=g;x.fillRect(x0,y0,w,h);
 g=x.createLinearGradient(0,y0,0,y0+h*.12);g.addColorStop(0,`rgba(30,25,20,${a*.5})`);g.addColorStop(1,'rgba(30,25,20,0)');x.fillStyle=g;x.fillRect(x0,y0,w,h);}
function boards(x,x0,y0,w,h,n,base,vertical,gap=2){for(let i=0;i<n;i++){const l=.82+rnd()*.3,c=base.map(v=>v*l|0);const a=vertical?[x0+i*w/n,y0,w/n,h]:[x0,y0+i*h/n,w,h/n];x.fillStyle=`rgb(${c})`;x.fillRect(...a);
  for(let k=0;k<30;k++){x.strokeStyle=`rgba(60,32,14,${.06+rnd()*.12})`;x.lineWidth=.6+rnd();x.beginPath();if(vertical){const px=a[0]+rnd()*a[2];x.moveTo(px,y0);x.bezierCurveTo(px+rnd()*4-2,y0+h*.3,px+rnd()*4-2,y0+h*.7,px+rnd()*3-1.5,y0+h);}else{const py=a[1]+rnd()*a[3];x.moveTo(x0,py);x.bezierCurveTo(x0+w*.3,py+rnd()*4-2,x0+w*.7,py+rnd()*4-2,x0+w,py+rnd()*3-1.5);}x.stroke();}
  if(rnd()<.6){const kx=a[0]+rnd()*a[2],ky=a[1]+rnd()*a[3];x.fillStyle='rgba(70,38,16,.5)';x.beginPath();x.ellipse(kx,ky,vertical?2.5:5,vertical?5:2.5,0,0,7);x.fill();}
  x.fillStyle='rgba(30,16,6,.8)';if(vertical)x.fillRect(a[0],y0,gap,h);else x.fillRect(x0,a[1],w,gap);x.fillStyle='rgba(255,225,180,.16)';if(vertical)x.fillRect(a[0]+gap,y0,1,h);else x.fillRect(x0,a[1]+gap,w,1);}}
const MAIN={
 wood(x,w,h){boards(x,0,0,w,h,8,[168,112,62],false,3);x.fillStyle='rgba(35,25,18,.85)';for(let i=0;i<8;i++)for(const px of[18,w/2,w-18]){x.beginPath();x.arc(px+(rnd()-.5)*4,i*h/8+h/16,2,0,7);x.fill();}fbmFill(x,0,0,w,h,6,11,.85,1.12,0);grime(x,0,0,w,h,.3);},
 stone(x,w,h){x.fillStyle='#5a5d62';x.fillRect(0,0,w,h);const rows=7,rh=h/rows;for(let r=0;r<rows;r++){let cx=-(rnd()*40);while(cx<w){const bw=56+rnd()*44,l=.78+rnd()*.34,warm=rnd()*14;x.fillStyle=`rgb(${148*l+warm|0},${148*l+warm*.6|0},${150*l|0})`;
   x.beginPath();x.roundRect(cx+3,r*rh+3,bw-6,rh-6,5);x.fill();x.fillStyle='rgba(255,255,255,.13)';x.fillRect(cx+5,r*rh+4,bw-10,3);x.fillStyle='rgba(0,0,0,.22)';x.fillRect(cx+5,r*rh+rh-7,bw-10,3);cx+=bw;}}
  fbmFill(x,0,0,w,h,8,21,.78,1.15,0);grain(x,0,0,w,h,5000,.12);for(let i=0;i<60;i++){x.fillStyle=`rgba(${60+rnd()*30|0},${90+rnd()*40|0},40,${.1+rnd()*.25})`;x.beginPath();x.arc(rnd()*w,h-rnd()*h*.3,1+rnd()*5,0,7);x.fill();}grime(x,0,0,w,h,.28);},
 metal(x,w,h){const n=10;for(let i=0;i<n;i++){const g=x.createLinearGradient(i*w/n,0,(i+1)*w/n,0);g.addColorStop(0,'#6f7780');g.addColorStop(.25,'#b4bcc4');g.addColorStop(.5,'#8a929b');g.addColorStop(.8,'#5d646c');g.addColorStop(1,'#7a828b');x.fillStyle=g;x.fillRect(i*w/n,0,w/n+1,h);}
  fbmFill(x,0,0,w,h,10,31,.85,1.1,0);grain(x,0,0,w,h,3000,.1);x.fillStyle='#4a5058';x.fillRect(0,0,w,10);x.fillRect(0,h-10,w,10);x.fillStyle='#d5dbe0';for(let i=12;i<w;i+=w/n)for(const y of[5,h-5]){x.beginPath();x.arc(i,y,2.4,0,7);x.fill();}
  streaks(x,0,0,w,h,40,'140,70,25',120);for(let i=0;i<10;i++){x.fillStyle=`rgba(150,72,26,${rnd()*.25})`;x.beginPath();x.arc(rnd()*w,rnd()*h,4+rnd()*16,0,7);x.fill();}for(let i=0;i<70;i++){x.strokeStyle=`rgba(230,235,240,${rnd()*.25})`;x.lineWidth=.6;x.beginPath();const px=rnd()*w,py=rnd()*h;x.moveTo(px,py);x.lineTo(px+(rnd()-.5)*30,py+(rnd()-.5)*8);x.stroke();}grime(x,0,0,w,h,.25);},
 plaster(x,w,h){x.fillStyle='#ece6da';x.fillRect(0,0,w,h);fbmFill(x,0,0,w,h,10,41,.9,1.05,0);for(let i=0;i<160;i++){const v=rnd()<.5?'0,0,0':'255,255,255',px=rnd()*w,py=rnd()*h,r=6+rnd()*26,g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(${v},${rnd()*.05})`);g.addColorStop(1,`rgba(${v},0)`);x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2);}
  grain(x,0,0,w,h,9000,.06);streaks(x,0,0,w,h,26,'70,60,45',160);for(let i=0;i<6;i++){x.strokeStyle='rgba(80,70,60,.25)';x.lineWidth=.7;x.beginPath();let px=rnd()*w,py=rnd()*h;x.moveTo(px,py);for(let k=0;k<6;k++){px+=(rnd()-.5)*18;py+=rnd()*12;x.lineTo(px,py);}x.stroke();}grime(x,0,0,w,h,.42);},
 shingle(x,w,h){x.fillStyle='#3a3530';x.fillRect(0,0,w,h);const rows=10,rh=h/rows,cw=w/9;for(let r=0;r<rows;r++)for(let c=-1;c<10;c++){const cx=c*cw+(r%2)*cw/2+(rnd()-.5)*4,l=.62+rnd()*.38,ww=cw-2-rnd()*3;x.fillStyle=`rgb(${236*l|0},${232*l|0},${226*l|0})`;
   x.beginPath();x.moveTo(cx,r*rh);x.lineTo(cx+ww,r*rh);x.lineTo(cx+ww,r*rh+rh*.82);x.quadraticCurveTo(cx+ww/2,r*rh+rh+3,cx,r*rh+rh*.82);x.closePath();x.fill();x.fillStyle='rgba(0,0,0,.35)';x.fillRect(cx,r*rh+rh-3,ww,3);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(cx,r*rh,ww,2);}
  fbmFill(x,0,0,w,h,6,51,.8,1.12,0);for(let i=0;i<50;i++){x.fillStyle=`rgba(70,${95+rnd()*40|0},40,${.08+rnd()*.2})`;x.beginPath();x.arc(rnd()*w,rnd()*h,2+rnd()*7,0,7);x.fill();}},
 plank(x,w,h){boards(x,0,0,w,h,7,[150,100,62],true,3);fbmFill(x,0,0,w,h,6,61,.85,1.1,0);for(let i=0;i<7;i++){const y=rnd()*h;x.fillStyle='rgba(30,16,6,.7)';x.fillRect(i*w/7,y,w/7,2);}grain(x,0,0,w,h,3000,.08);}};
function swatches(x,y0){const S=128;
 // 0 painted trim: off-white boards with chips
 x.fillStyle='#f1ede4';x.fillRect(0,y0,S,S);boards(x,0,y0,S,S,4,[242,238,228],false,1);x.globalAlpha=.55;x.fillStyle='#f4f1ea';x.fillRect(0,y0,S,S);x.globalAlpha=1;for(let i=0;i<40;i++){x.fillStyle=`rgba(120,90,60,${.2+rnd()*.3})`;x.fillRect(rnd()*S,y0+rnd()*S,1+rnd()*3,1+rnd()*2);}
 // 1 stone plinth: cut blocks
 x.fillStyle='#4b4d50';x.fillRect(S,y0,S,S);for(let r=0;r<4;r++){let cx=S-(rnd()*20);while(cx<2*S){const bw=26+rnd()*20,l=.75+rnd()*.3;x.fillStyle=`rgb(${128*l|0},${126*l|0},${122*l|0})`;x.fillRect(Math.max(S,cx+2),y0+r*32+2,bw-4,28);cx+=bw;}}grain(x,S,y0,S,S,1500,.15);
 // 2 dark beam wood
 boards(x,2*S,y0,S,S,3,[96,62,36],false,2);
 // 3 steel
 const g=x.createLinearGradient(0,y0,0,y0+S);g.addColorStop(0,'#5d646c');g.addColorStop(.5,'#8a939c');g.addColorStop(1,'#4d545b');x.fillStyle=g;x.fillRect(3*S,y0,S,S);grain(x,3*S,y0,S,S,1200,.12);for(let i=0;i<8;i++){x.fillStyle=`rgba(140,70,25,${rnd()*.3})`;x.beginPath();x.arc(3*S+rnd()*S,y0+rnd()*S,3+rnd()*8,0,7);x.fill();}}
function atlas(fn,seed){R=rng(seed);const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');fn(x,512,384);swatches(x,384);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;}

/* ---------- piece geometry (local space): parts carry uv mode (main or swatch k), tint mask, shade ---------- */
const P=(g,m,map='m',tint=1,shade=1)=>({g,m,map,tint,shade});
const BX=(x0,y0,z0,x1,y1,z1,map='m',tint=1,shade=1,rx=0,ry=0,rz=0)=>P(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),M((x0+x1)/2,(y0+y1)/2,(z0+z1)/2,rx,ry,rz),map,tint,shade);
function build(parts,uvFn){let n=0;const gs=parts.map(p=>{const g=p.g.index?p.g.toNonIndexed():p.g;if(p.m)g.applyMatrix4(p.m);n+=g.attributes.position.count;return[g,p];});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3),hh=new Float32Array(n);let o=0;
 for(const[g,p]of gs){const k=g.attributes.position.count,ps=g.attributes.position,ns=g.attributes.normal;pos.set(ps.array,o*3);nor.set(ns.array,o*3);
  for(let i=0;i<k;i++){const x=ps.getX(i),y=ps.getY(i),z=ps.getZ(i),ax=Math.abs(ns.getX(i)),ay=Math.abs(ns.getY(i)),az=Math.abs(ns.getZ(i));let a,b,ya=false;
   if(ay>=ax&&ay>=az){a=x;b=z;}else if(ax>=az){a=z;b=y;ya=true;}else{a=x;b=y;ya=true;}
   let u,v;if(p.map==='m'){u=cl((a+2)/4,.003,.997);v=.25+.747*cl(ya?b/4:(b+2)/4,0,1);if(uvFn){const r=uvFn(x,y,z,ax,ay,az);if(r){u=r[0];v=r[1];}}}
   else{const s=p.map;u=s*.25+.012+cl((a+2.2)*.052,0,.226);v=.012+cl((ya?b+.2:b+2.2)*.052,0,.226);}
   uv[(o+i)*2]=u;uv[(o+i)*2+1]=v;col[(o+i)*3]=p.tint;col[(o+i)*3+1]=p.shade;col[(o+i)*3+2]=0;}
  o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(col,3));
 r.computeBoundingBox();const y0=r.boundingBox.min.y,y1=r.boundingBox.max.y;for(let i=0;i<n;i++)hh[i]=(pos[i*3+1]-y0)/Math.max(.01,y1-y0);r.setAttribute('aH',new THREE.BufferAttribute(hh,1));r.computeBoundingSphere();return r;}
const WALLB={wall:[[-2,0,2,4]],door:[[-2,0,-.8,4],[.8,0,2,4],[-.8,2.75,.8,4]],window:[[-2,0,-.85,4],[.85,0,2,4],[-.85,0,.85,1.25],[-.85,2.85,.85,4]]};
const T2=TH/2;
function wallGeo(kind,mat){const ps=WALLB[kind].map(([a,y0,b,y1])=>BX(a,y0,-T2,b,y1,T2));
 const frameOpen=(sw,tint,shade,d)=>{if(kind==='window'){ps.push(BX(-.97,1.13,-d,-.85,2.97,d,sw,tint,shade),BX(.85,1.13,-d,.97,2.97,d,sw,tint,shade),BX(-.97,2.85,-d,.97,2.97,d,sw,tint,shade),BX(-1.02,1.1,-d-.08,1.02,1.25,d+.08,sw,tint,shade*.95),
   BX(-.025,1.25,-.03,.025,2.85,.03,sw,tint,shade),BX(-.85,2.03,-.03,.85,2.08,.03,sw,tint,shade));}
  if(kind==='door'){ps.push(BX(-.92,0,-d,-.8,2.87,d,sw,tint,shade),BX(.8,0,-d,.92,2.87,d,sw,tint,shade),BX(-.92,2.75,-d,.92,2.87,d,sw,tint,shade));}};
 if(mat===3){const d=T2+.045;// house plaster: corner boards, stone plinth, top band, painted frames
  ps.push(BX(-2,0,-d,-1.84,4,d,0,0,1),BX(1.84,0,-d,2,4,d,0,0,1),BX(-2,3.8,-d,2,4,d,0,0,.96));
  for(const[a,b]of kind==='door'?[[-1.84,-.92],[.92,1.84]]:[[-1.84,1.84]])ps.push(BX(a,0,-d-.02,b,.34,d+.02,1,0,1));frameOpen(0,0,1,d+.01);}
 else if(mat===0){const d=T2+.05;// wood: dark beam frame + diagonal brace
  ps.push(BX(-2,0,-d,-1.8,4,d,2,0,1),BX(1.8,0,-d,2,4,d,2,0,1),BX(-2,3.8,-d,2,4,d,2,0,1),BX(-2,0,-d,2,.2,d,2,0,1));
  if(kind==='wall'){const L=Math.hypot(3.6,3.6);ps.push(BX(-L/2,-.09,-d+.01,L/2,.09,d-.01,2,0,.92,0,0,Math.PI/4));}frameOpen(2,0,1,d);}
 else if(mat===1){const d=T2+.05;// stone: footing + cap course
  ps.push(BX(-2,0,-d,2,.3,d,1,0,.9),BX(-2,3.82,-d,2,4,d,1,0,1));frameOpen(1,0,1.05,d);}
 else if(mat===2){const d=T2+.05;// metal: steel frame + vertical ribs
  ps.push(BX(-2,0,-d,-1.86,4,d,3,0,1),BX(1.86,0,-d,2,4,d,3,0,1),BX(-2,3.86,-d,2,4,d,3,0,1),BX(-2,0,-d,2,.14,d,3,0,1));
  for(let i=-1.4;i<1.5;i+=.7){if(kind!=='wall'&&Math.abs(i)<1)continue;ps.push(BX(i-.04,.14,-T2-.03,i+.04,3.86,T2+.03,'m',1,.92));}frameOpen(3,0,1,d);}
 return build(ps);}
function floorGeo(mat){const ps=[BX(-2,-TH,-2,2,0,2)];if(mat===0||mat===5)for(const s of[-1,1]){ps.push(BX(-2,-TH-.18,s*2-(s>0?.16:0),2,-TH,s*2+(s<0?.16:0),2,0,1));ps.push(BX(-.08,-TH-.16,-2,.08,-TH,2,2,0,.9));}
 if(mat===2)ps.push(BX(-2,-TH-.1,-2,2,-TH,-1.9,3,0,1),BX(-2,-TH-.1,1.9,2,-TH,2,3,0,1));return build(ps);}
function rampGeo(mat){const L=Math.hypot(CELL,H),ang=-Math.atan2(H,CELL),m=M(0,H/2-TH*.7,0,ang),sw=mat===2?3:mat===1?1:2;
 const raw=[P(new THREE.BoxGeometry(CELL,TH,L),null)];for(const s of[-1,1])raw.push(P(new THREE.BoxGeometry(.2,.42,L),M(s*1.9,.08,0),sw,0,1));
 if(mat!==1)for(let i=0;i<7;i++)raw.push(P(new THREE.BoxGeometry(3.6,.06,.12),M(0,TH/2+.03,-L/2+.5+i*(L-1)/6),sw,0,.95));
 for(const p of raw)p.m=p.m?m.clone().multiply(p.m):m;
 return build(raw,(x,y,z,ax,ay,az)=>{if(ay<.5)return null;const al=(z+2)/4*.7+(y/4)*.3;return[cl((x+2)/4,.003,.997),.25+.747*cl(al,0,1)];});}
function roofGeo(){const g=new THREE.ConeGeometry(CELL/Math.SQRT2,ROOFH,4,1);g.rotateY(Math.PI/4);g.translate(0,ROOFH/2,0);
 return build([P(g,null)],(x,y,z)=>[cl((x+z+4)/8,.003,.997),.25+.747*cl(y/ROOFH*.6+(x-z+4)/16,0,1)]);}
// house gable: 'grise' rises GR over the cell toward +z (rotated by dir) with an eave overhang on the low side; 'gpeak' is a ridge cell
function gableGeo(kind){const ps=[],sl=kind==='grise'?GR/CELL:.5,T=.16;
 const slab=(z0,z1,y0,y1)=>{const L=Math.hypot(z1-z0,y1-y0),a=Math.atan2(y1-y0,z1-z0);return P(new THREE.BoxGeometry(CELL,T,L),M(0,(y0+y1)/2+T/2,(z0+z1)/2,-a));};
 const tri=(x,pts)=>{const g=new THREE.BufferGeometry(),v=pts.map(([z,y])=>[x,y,z]);const e1=[0,1,2].map(i=>v[1][i]-v[0][i]),e2=[0,1,2].map(i=>v[2][i]-v[0][i]),nx=e1[1]*e2[2]-e1[2]*e2[1];if(Math.sign(nx)!==Math.sign(x))v.reverse();
  g.setAttribute('position',new THREE.Float32BufferAttribute(v.flat(),3));g.computeVertexNormals();return P(g,null,0,0,.97);};
 if(kind==='grise'){ps.push(slab(-2.55,2,-.28,GR));ps.push(BX(-2,-.36,-2.62,2,-.08,-2.5,0,0,1));// fascia
  ps.push(tri(-2,[[-2,0],[2,0],[2,GR]]),tri(2,[[-2,0],[2,0],[2,GR]]));}
 else{ps.push(slab(-2,0,0,1),slab(0,2,1,0));ps.push(BX(-2.02,.98,-.12,2.02,1.22,.12,0,0,.9));ps.push(tri(-2,[[-2,0],[2,0],[0,1]]),tri(2,[[-2,0],[2,0],[0,1]]));}
 return build(ps,(x,y,z,ax,ay,az)=>{if(ax>.5)return null;return[cl((x+2)/4,.003,.997),.25+.747*cl((z+2.6)/5.2,0,1)];});}
// decorations that live and die with their piece: window glass, chimney
function glassGeo(){return build([BX(-.85,1.25,-.012,.85,2.85,.012)]);}
function chimneyGeo(){return build([BX(-.45,0,-.45,.45,3.4,.45,1,0,1),BX(-.55,3.2,-.55,.55,3.5,.55,1,0,.85),BX(-.3,3.5,-.3,.3,3.7,.3,3,0,.6)]);}

/* ---------- material patch: tint mask, build sweep, flash, cracks ---------- */
const N3=`float bh3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float bn3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(bh3(i),bh3(i+vec3(1,0,0)),f.x),mix(bh3(i+vec3(0,1,0)),bh3(i+vec3(1,1,0)),f.x),f.y),mix(mix(bh3(i+vec3(0,0,1)),bh3(i+vec3(1,0,1)),f.x),mix(bh3(i+vec3(0,1,1)),bh3(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
function patch(mat){mat.vertexColors=true;mat.onBeforeCompile=s=>{
 s.vertexShader='attribute vec4 aState;attribute float aH;varying vec4 vSt;varying float vH;varying vec3 vLp;\n'+s.vertexShader.replace('#include <color_vertex>',`vColor=vec3(1.);
#ifdef USE_INSTANCING_COLOR
 vColor=mix(vec3(1.),instanceColor.rgb,color.r);
#endif
 vColor*=color.g;vSt=aState;vH=aH;vLp=position;`);
 s.fragmentShader='varying vec4 vSt;varying float vH;varying vec3 vLp;\n'+N3+'\n'+s.fragmentShader
  .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n if(vSt.x<.999&&vH>vSt.x*1.06+.001)discard;')
  .replace('#include <color_fragment>',`#include <color_fragment>
 float dmg=vSt.z;if(dmg>.04){vec3 q=vLp*1.6;float cn=bn3(q)*.6+bn3(q*2.3)*.4;float ck=smoothstep(.04,.0,abs(cn-.5))*smoothstep(.1,.65,dmg+(bn3(vLp*.7)-.5)*.5);diffuseColor.rgb*=(1.-ck*.8)*(1.-dmg*.22);}`)
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 if(vSt.x<.999){float e=smoothstep(.12,.0,vSt.x*1.06-vH);vec3 gq=fract(vLp*1.5);float gl=step(.93,max(max(gq.x,gq.y),gq.z));totalEmissiveRadiance+=vec3(.2,.6,1.5)*(e*2.6+gl*.5*(1.-vSt.x)+.12*(1.-vSt.x));}
 totalEmissiveRadiance+=vec3(1.,.92,.85)*vSt.y*.45;`);};
 mat.customProgramCacheKey=()=>'royale-build';return mat;}

/* ---------- instanced batches ---------- */
class Batch{constructor(geo,mat,cap){this.cap=cap;this.mesh=new THREE.InstancedMesh(geo,mat,cap);this.mesh.count=0;this.mesh.castShadow=this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;
  this.mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3).fill(1),3);this.st=new THREE.InstancedBufferAttribute(new Float32Array(cap*4),4);this.st.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('aState',this.st);this.items=[];this.on=true;this.mesh.visible=false;}
 vis(){this.mesh.visible=this.on&&this.items.length>0;}
 add(p){if(this.items.length>=this.cap)return false;p.bi=this.items.length;this.items.push(p);this.mesh.count=this.items.length;this.set(p);this.vis();return true;}
 remove(p){const i=p.bi;if(i<0)return;const last=this.items.pop();if(last!==p){this.items[i]=last;last.bi=i;this.set(last);}this.mesh.count=this.items.length;p.bi=-1;this.dirty();this.vis();}
 set(p){const i=p.bi;this.mesh.setMatrixAt(i,p.mx);this.mesh.setColorAt(i,p.col);const s=p.sv;this.st.setXYZW(i,s[0],s[1],s[2],s[3]);this.dirty();}
 dirty(){this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor.needsUpdate=true;this.st.needsUpdate=true;}}

const _q=new THREE.Quaternion(),_s=new V(1,1,1),_p=new V(),_e=new THREE.Euler();
export class Build{
 constructor(scene,world){this.scene=scene;this.world=world;this.keys=new Map();this.grid=new Map();this.all=new Set();this.batches=new Map();this.growing=new Set();this.falling=[];this.onBreak=null;this.built=0;
  const fns=[MAIN.wood,MAIN.stone,MAIN.metal,MAIN.plaster,MAIN.shingle,MAIN.plank],NS=[3,4,3,1.6,4,3],RG=[.8,.88,.42,.93,.84,.78];
  this.mats=fns.map((f,i)=>{const t=atlas(f,11+i*7);return patch(new THREE.MeshStandardMaterial({map:t,normalMap:normalFrom(t.image,NS[i],{clamp:true}),normalScale:new THREE.Vector2(.9,.9),roughness:RG[i],metalness:i===2?.55:0,envMapIntensity:i===2?1.2:.7}));});
  this.glassMat=new THREE.MeshStandardMaterial({color:0x9fc4d8,roughness:.05,metalness:.1,envMapIntensity:2.2,transparent:true,opacity:.42,depthWrite:false});
  this.geos={};this.geoCache=new Map();
  for(const k of['wall','floor','ramp','roof'])this.geos[k]=this.geo(k,0);
  // ghost
  this.ghostMat=new THREE.MeshBasicMaterial({color:0x58b8ff,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide});
  this.ghostLine=new THREE.LineBasicMaterial({color:0xa8e0ff,transparent:true,opacity:.9});
  this.ghost=new THREE.Group();this.ghost.visible=false;scene.add(this.ghost);this.ghostParts={};
  const gg={wall:build([BX(-2,0,-T2,2,4,T2)]),floor:build([BX(-2,-TH,-2,2,0,2)]),ramp:this.geos.ramp,roof:this.geos.roof};
  for(const k of['wall','floor','ramp','roof']){const m=new THREE.Mesh(gg[k],this.ghostMat),l=new THREE.LineSegments(new THREE.EdgesGeometry(gg[k],30),this.ghostLine);const g=new THREE.Group();g.add(m,l);g.visible=false;this.ghost.add(g);this.ghostParts[k]=g;}
  this.decoOn=true;}
 geo(kind,mat){const key=kind+'|'+mat;let g=this.geoCache.get(key);if(g)return g;
  g=WALLB[kind]?wallGeo(kind,mat):kind==='floor'?floorGeo(mat):kind==='ramp'?rampGeo(mat):kind==='roof'?roofGeo():kind==='glass'?glassGeo():kind==='chimney'?chimneyGeo():gableGeo(kind);
  this.geoCache.set(key,g);return g;}
 // each batch owns its geometry copy (the aState attribute is per batch)
 batch(kind,mat){const key=kind+'|'+mat;let b=this.batches.get(key);if(!b){const geo=this.geo(kind,mat).clone();const m=kind==='glass'?this.glassMat:this.mats[mat];
   b=new Batch(geo,m,kind==='wall'||kind==='floor'?1400:kind==='roof'?600:kind==='window'||kind==='glass'?500:400);if(kind==='glass'){b.mesh.castShadow=false;b.mesh.renderOrder=1;b.on=this.decoOn!==false;}this.batches.set(key,b);this.scene.add(b.mesh);}return b;}
 setQuality(q){this.decoOn=q>0;const b=this.batches.get('glass|0');if(b){b.on=this.decoOn;b.vis();}}
 clear(){for(const p of[...this.all])this.remove(p);this.keys.clear();this.grid.clear();this.growing.clear();this.falling=[];this.built=0;}

 /* ----- create ----- */
 // wall: dir gives which edge of cell (ix,iz) it sits on. Returns the piece or null if occupied / at capacity.
 key(type,ix,iz,dir,base){const lv=Math.round(base*2);if(type==='wall'){if(dir===0||dir===2){const zl=dir===0?iz+1:iz;return'wx'+ix+','+zl+','+lv;}const xl=dir===1?ix+1:ix;return'wz'+xl+','+iz+','+lv;}return type[0]+type[1]+ix+','+iz+','+lv;}
 occupied(type,ix,iz,dir,base){return this.keys.has(this.key(type,ix,iz,dir,base));}
 place(type,mat,ix,iz,dir,base,o={}){const k=this.key(type,ix,iz,dir,base);if(this.keys.has(k))return null;
  const kind=type==='wall'?(o.variant||'wall'):type==='roof'&&o.variant?o.variant:type,p={type,kind,mat,ix,iz,dir,base,key:k,hp:0,max:o.hp||MATS[mat].hp,t:o.instant?1:0,bt:MATS[mat].bt||.01,anchor:!!o.anchor,tint:new THREE.Color(o.tint??0xffffff),col:new THREE.Color(),mx:new THREE.Matrix4(),sv:[1,0,0,0],flash:0,cells:[],boxes:[],owner:o.owner||null,bi:-1,alive:true,dec:[]};
  p.hp=o.instant?p.max:Math.max(1,p.max*.15);
  const cx=(ix+.5)*CELL,cz=(iz+.5)*CELL;let rot=0;
  if(type==='wall'){if(dir===0||dir===2){const zl=dir===0?iz+1:iz;p.x=cx;p.z=zl*CELL;rot=0;p.cells=[[ix,zl-1],[ix,zl]];}else{const xl=dir===1?ix+1:ix;p.x=xl*CELL;p.z=cz;rot=Math.PI/2;p.cells=[[xl-1,iz],[xl,iz]];}
   p.axis=rot?1:0;for(const[a,y0,b,y1]of WALLB[kind])p.boxes.push(rot?[p.x-TH/2,base+y0,p.z+a,p.x+TH/2,base+y1,p.z+b]:[p.x+a,base+y0,p.z-TH/2,p.x+b,base+y1,p.z+TH/2]);}
  else{p.x=cx;p.z=cz;p.cells=[[ix,iz]];rot=type==='ramp'||kind==='grise'||kind==='gpeak'?[0,Math.PI/2,Math.PI,-Math.PI/2][dir]:0;
   if(type==='floor')p.boxes.push([ix*CELL,base-TH,iz*CELL,(ix+1)*CELL,base,(iz+1)*CELL]);}
  p.rot=rot;const b=this.batch(kind,mat);if(!b.add(p))return null;
  // bounding box
  const rh=kind==='grise'?GR:kind==='gpeak'?1:ROOFH;
  const bb=type==='wall'?p.boxes.reduce((a,x)=>[Math.min(a[0],x[0]),Math.min(a[1],x[1]),Math.min(a[2],x[2]),Math.max(a[3],x[3]),Math.max(a[4],x[4]),Math.max(a[5],x[5])],[1e9,1e9,1e9,-1e9,-1e9,-1e9]):
   type==='floor'?p.boxes[0].slice():type==='ramp'?[ix*CELL,base,iz*CELL,(ix+1)*CELL,base+H,(iz+1)*CELL]:[ix*CELL,base,iz*CELL,(ix+1)*CELL,base+rh,(iz+1)*CELL];p.aabb=bb;
  this.keys.set(k,p);this.all.add(p);for(const[a,c]of p.cells){const g=ck(a,c);let s=this.grid.get(g);if(!s){s=new Set();this.grid.set(g,s);}s.add(p);}
  p.batch=b;
  // decorations bound to this piece
  if(kind==='window'&&mat===3)this.addDec(p,'glass',0);if(o.chimney)this.addDec(p,'chimney',1);
  if(!o.instant)this.growing.add(p);this.refresh(p);if(o.owner)this.built++;return p;}
 addDec(p,kind,mat){const b=this.batch(kind,mat),r={mx:p.mx,col:p.col,sv:p.sv,bi:-1};if(b.add(r))p.dec.push({b,r});}
 refresh(p){_q.setFromEuler(_e.set(0,p.rot,0));_p.set(p.x,p.base,p.z);p.mx.compose(_p,_q,_s);
  p.col.copy(p.tint);p.sv[0]=p.t>=1?1:p.t;p.sv[1]=p.flash;p.sv[2]=1-cl(p.hp/p.max,0,1);p.batch.set(p);for(const d of p.dec)d.b.set(d.r);}
 remove(p){if(!p.alive)return;p.alive=false;p.batch.remove(p);for(const d of p.dec)d.b.remove(d.r);p.dec.length=0;this.keys.delete(p.key);this.all.delete(p);this.growing.delete(p);for(const[a,c]of p.cells){const s=this.grid.get(ck(a,c));if(s){s.delete(p);if(!s.size)this.grid.delete(ck(a,c));}}}

 /* ----- damage & collapse ----- */
 damage(p,dmg,src){if(!p.alive)return false;p.hp-=dmg;p.flash=1;if(p.hp<=0){this.destroy(p,src);return true;}this.refresh(p);this.growing.add(p);return false;}
 destroy(p,src){if(!p.alive)return;this.remove(p);this.onBreak&&this.onBreak(p,src);this.collapseFrom(p);}
 near(bb,pad,cb){const x0=Math.floor((bb[0]-pad)/CELL)-1,x1=Math.floor((bb[3]+pad)/CELL)+1,z0=Math.floor((bb[2]-pad)/CELL)-1,z1=Math.floor((bb[5]+pad)/CELL)+1;const seen=new Set();
  for(let i=x0;i<=x1;i++)for(let k=z0;k<=z1;k++){const s=this.grid.get(ck(i,k));if(s)for(const q of s){if(seen.has(q))continue;seen.add(q);cb(q);}}}
 touching(p,cb){const a=p.aabb,e=.18;this.near(a,e,q=>{if(q===p)return;const b=q.aabb;if(a[0]-e<=b[3]&&a[3]+e>=b[0]&&a[1]-e<=b[4]&&a[4]+e>=b[1]&&a[2]-e<=b[5]&&a[5]+e>=b[2])cb(q);});}
 grounded(p){if(p.anchor)return true;const W=this.world;const a=p.aabb;let h=-1e9;for(const[u,v]of[[.5,.5],[.1,.1],[.9,.1],[.1,.9],[.9,.9]])h=Math.max(h,W.heightAt(a[0]+(a[3]-a[0])*u,a[2]+(a[5]-a[2])*v));return a[1]<=h+.45;}
 collapseFrom(p){const seeds=[];this.touching(p,q=>seeds.push(q));const done=new Set();
  for(const s of seeds){if(done.has(s)||!s.alive)continue;const comp=[s],seen=new Set([s]);let ok=false;
   for(let i=0;i<comp.length&&comp.length<700;i++){const q=comp[i];if(this.grounded(q)){ok=true;break;}this.touching(q,r=>{if(!seen.has(r)&&r.alive){seen.add(r);comp.push(r);}});}
   comp.forEach(q=>done.add(q));if(!ok){comp.forEach((q,i)=>this.falling.push({p:q,t:.08+i*.035+Math.random()*.05}));}}}
 update(dt){for(const p of this.growing){if(p.t<1){p.t=Math.min(1,p.t+dt/p.bt);p.hp=Math.min(p.max,p.hp+p.max*.85*dt/p.bt);}p.flash=Math.max(0,p.flash-dt*6);this.refresh(p);if(p.t>=1&&p.flash<=0)this.growing.delete(p);}
  for(let i=this.falling.length-1;i>=0;i--){const f=this.falling[i];f.t-=dt;if(f.p.alive){f.p.flash=1;this.refresh(f.p);}if(f.t<=0){this.falling.splice(i,1);if(f.p.alive){this.remove(f.p);this.onBreak&&this.onBreak(f.p,null);}}}}

 /* ----- queries ----- */
 // height of a roof-type piece's top surface at (x,z), or -1e9 outside
 roofH(p,x,z,r){const dx=x-p.x,dz=z-p.z;
  if(p.kind==='grise'||p.kind==='gpeak'){const Dv=D[p.dir],al=dx*Dv[0]+dz*Dv[1],lat=Math.abs(dx*Dv[1]-dz*Dv[0]);if(lat>2+r*.4||Math.abs(al)>2+r*.4)return -1e9;
   return p.kind==='grise'?p.base+GR*(cl(al,-2,2)+2)/4+.16:p.base+1-Math.min(2,Math.abs(al))/2+.16;}
  const m=Math.max(Math.abs(dx),Math.abs(dz));if(m>2+r*.4)return -1e9;return p.base+ROOFH*(1-Math.min(m,2)/2);}
 // highest walkable surface under (x,z) that is <= y+step. returns {h,p}
 support(x,z,y,step,r,out){out.h=-1e9;out.p=null;const ix=Math.floor(x/CELL),iz=Math.floor(z/CELL);
  for(let i=ix-1;i<=ix+1;i++)for(let k=iz-1;k<=iz+1;k++){const s=this.grid.get(ck(i,k));if(!s)continue;for(const p of s){let h=-1e9;
   if(p.type==='ramp'){const dx=x-p.x,dz=z-p.z,Dv=D[p.dir],al=dx*Dv[0]+dz*Dv[1],lat=Math.abs(dx*Dv[1]-dz*Dv[0]);if(lat<=2+r*.5&&al>=-2-r*.6&&al<=2+r*.6)h=p.base+H*(cl(al,-2,2)+2)/4;}
   else if(p.type==='roof')h=this.roofH(p,x,z,r);
   else for(const b of p.boxes){if(x>=b[0]-r*.6&&x<=b[3]+r*.6&&z>=b[2]-r*.6&&z<=b[5]+r*.6&&b[4]>h&&b[4]<=y+step)h=b[4];}
   if(h<=y+step&&h>out.h){out.h=h;out.p=p;}}}return out;}
 // push a vertical cylinder (feet y, height ht, radius r) out of wall/floor boxes; returns true if pushed
 collide(pos,r,ht,step,cb){let hit=false;const ix=Math.floor(pos.x/CELL),iz=Math.floor(pos.z/CELL);
  for(let i=ix-1;i<=ix+1;i++)for(let k=iz-1;k<=iz+1;k++){const s=this.grid.get(ck(i,k));if(!s)continue;for(const p of s){if(!p.boxes.length)continue;for(const b of p.boxes){
   if(b[4]<=pos.y+step||b[1]>=pos.y+ht)continue;const qx=cl(pos.x,b[0],b[3]),qz=cl(pos.z,b[2],b[5]),dx=pos.x-qx,dz=pos.z-qz,d2=dx*dx+dz*dz;if(d2>=r*r)continue;
   if(d2>1e-8){const d=Math.sqrt(d2);pos.x+=dx/d*(r-d);pos.z+=dz/d*(r-d);}
   else{const pen=[pos.x-b[0]+r,b[3]-pos.x+r,pos.z-b[2]+r,b[5]-pos.z+r];let m=0;for(let j=1;j<4;j++)if(pen[j]<pen[m])m=j;if(m===0)pos.x=b[0]-r;else if(m===1)pos.x=b[3]+r;else if(m===2)pos.z=b[2]-r;else pos.z=b[5]+r;}
   hit=true;cb&&cb(p);}}}return hit;}
 // lowest box bottom above head (for ceilings)
 ceiling(x,z,y,r){let c=1e9;const ix=Math.floor(x/CELL),iz=Math.floor(z/CELL);for(let i=ix-1;i<=ix+1;i++)for(let k=iz-1;k<=iz+1;k++){const s=this.grid.get(ck(i,k));if(!s)continue;for(const p of s){
  if(p.type==='ramp'){const dx=x-p.x,dz=z-p.z,Dv=D[p.dir],al=dx*Dv[0]+dz*Dv[1],lat=Math.abs(dx*Dv[1]-dz*Dv[0]);if(lat<2&&Math.abs(al)<2){const h=p.base+H*(al+2)/4-TH*1.4;if(h>y&&h<c)c=h;}continue;}
  for(const b of p.boxes)if(x>b[0]-r*.5&&x<b[3]+r*.5&&z>b[2]-r*.5&&z<b[5]+r*.5&&b[1]>y&&b[1]<c)c=b[1];}}return c;}
 // ray through grid cells (DDA). returns {t,p,n} or null
 ray(o,d,maxT){if(!this.all.size)return null;let best=null,bt=maxT;const seen=new Set();
  const test=p=>{if(seen.has(p))return;seen.add(p);
   if(p.type==='ramp'){const Dv=D[p.dir],nx=-Dv[0],nz=-Dv[1],ny=1,den=d.x*nx+d.y*ny+d.z*nz;if(Math.abs(den)<1e-6)return;const px=p.x-Dv[0]*2,pz=p.z-Dv[1]*2,t=((px-o.x)*nx+(p.base-o.y)*ny+(pz-o.z)*nz)/den;
    if(t<0||t>=bt)return;const hx=o.x+d.x*t-p.x,hz=o.z+d.z*t-p.z;if(Math.abs(hx)>2||Math.abs(hz)>2)return;bt=t;best={t,p,n:new V(nx,ny,nz).normalize().multiplyScalar(den<0?1:-1)};return;}
   if(p.type==='roof'){const top=p.kind==='grise'?GR*.6:p.kind==='gpeak'?.7:ROOFH*.55,b=[p.x-2,p.base,p.z-2,p.x+2,p.base+top,p.z+2],t=rayBox(o.x,o.y,o.z,d.x,d.y,d.z,b,bt);if(t>=0&&t<bt){bt=t;best={t,p,n:new V(0,1,0)};}return;}
   for(const b of p.boxes){const t=rayBox(o.x,o.y,o.z,d.x,d.y,d.z,b,bt);if(t>=0&&t<bt){bt=t;best={t,p,n:null,b};}}};
  let ix=Math.floor(o.x/CELL),iz=Math.floor(o.z/CELL);const sx=Math.sign(d.x),sz=Math.sign(d.z);
  const tdx=sx?CELL/Math.abs(d.x):1e9,tdz=sz?CELL/Math.abs(d.z):1e9;let tmx=sx?((sx>0?(ix+1)*CELL:ix*CELL)-o.x)/d.x:1e9,tmz=sz?((sz>0?(iz+1)*CELL:iz*CELL)-o.z)/d.z:1e9,t=0;
  for(let n=0;n<400;n++){for(const[a,c]of[[ix,iz],[ix-1,iz],[ix+1,iz],[ix,iz-1],[ix,iz+1]]){const s=this.grid.get(ck(a,c));if(s)for(const p of s)test(p);}
   if(best&&best.t<=t)break;if(tmx<tmz){t=tmx;tmx+=tdx;ix+=sx;}else{t=tmz;tmz+=tdz;iz+=sz;}if(t>bt)break;}
  if(best&&!best.n){const h=_p.copy(d).multiplyScalar(best.t).add(o);best.n=boxNormal(h.x,h.y,h.z,best.b);}return best;}

 /* ----- placement planning ----- */
 // level a new piece snaps to, given the actor's footing; prefers lining up with nearby structures
 level(a,ix,iz){const s=a.support||a.coyote;let L;
  if(s){L=s.type==='ramp'?s.base+H*Math.round((a.pos.y-s.base)/H):s.type==='roof'?s.base:s.type==='wall'?s.base+H:s.base;}
  else L=Math.round(a.pos.y*4)/4;
  let best=null,bd=.75;this.near([ix*CELL,0,iz*CELL,(ix+1)*CELL,0,(iz+1)*CELL],2,q=>{const c=q.base+H*Math.round((L-q.base)/H),dd=Math.abs(c-L);if(dd<bd){bd=dd;best=c;}});return best??L;}
 plan(a,type,out={}){const f=a.yaw,fx=Math.sin(f),fz=Math.cos(f);let dir=((Math.round(Math.atan2(fx,fz)/(Math.PI/2))%4)+4)%4;const Dv=D[dir];
  let ix=Math.floor(a.pos.x/CELL),iz=Math.floor(a.pos.z/CELL);const fr=(dir===0?a.pos.z/CELL-iz:dir===2?1-(a.pos.z/CELL-iz):dir===1?a.pos.x/CELL-ix:1-(a.pos.x/CELL-ix));
  const s=a.support||a.coyote,onRamp=s&&s.type==='ramp'&&s.dir===dir;let base;
  if(onRamp){ix=s.ix+Dv[0];iz=s.iz+Dv[1];base=s.base+H;if(type==='ramp'&&this.occupied('ramp',ix,iz,dir,base)){ix+=Dv[0];iz+=Dv[1];base+=H;}}
  else{if(type==='floor'){if((a.pitch??0)>-.55){ix+=Dv[0];iz+=Dv[1];}}else if(type==='ramp'){if(fr>.5){ix+=Dv[0];iz+=Dv[1];}}
   base=this.level(a,ix,iz);if(type==='roof')base+=H;
   if(type==='ramp'&&this.occupied('ramp',ix,iz,dir,base)){ix+=Dv[0];iz+=Dv[1];}
   if(type==='floor'&&this.occupied('floor',ix,iz,dir,base)&&(a.pitch??0)<=-.55){ix+=Dv[0];iz+=Dv[1];}}
  out.type=type;out.ix=ix;out.iz=iz;out.dir=dir;out.base=base;out.ok=!this.occupied(type,ix,iz,dir,base);return out;}
 showGhost(pl,ok){for(const k in this.ghostParts)this.ghostParts[k].visible=false;if(!pl){this.ghost.visible=false;return;}this.ghost.visible=true;const g=this.ghostParts[pl.type];g.visible=true;
  const cx=(pl.ix+.5)*CELL,cz=(pl.iz+.5)*CELL;if(pl.type==='wall'){const d=pl.dir;if(d===0||d===2){g.position.set(cx,pl.base,(d===0?pl.iz+1:pl.iz)*CELL);g.rotation.y=0;}else{g.position.set((d===1?pl.ix+1:pl.ix)*CELL,pl.base,cz);g.rotation.y=Math.PI/2;}}
  else{g.position.set(cx,pl.base,cz);g.rotation.y=pl.type==='ramp'?[0,Math.PI/2,Math.PI,-Math.PI/2][pl.dir]:0;}
  this.ghostMat.color.set(ok?0x58b8ff:0xff5a4a);this.ghostLine.color.set(ok?0xbfe8ff:0xffb0a0);}
}
