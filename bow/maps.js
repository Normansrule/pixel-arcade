// LONGBOW KEEP — the three battlefields: terrain, castles (walls, towers, gatehouse, keep, ladders, ramps), bridges, moats, props and lighting.
import * as THREE from '../vendor/three.module.min.js';
import {V,C,TEAMS,makeNoise,rng,sstep,lerp,boxGeo,Batch,mat4,merge,makeSky,makeEnv,makeClouds,makeWaterMat,clothMat,bannerTex} from './gfx.js';
import {World,Nav} from './world.js';

export const MAPS=[
 {id:'vale',name:'GREENWATER VALE',sub:'RIVER VALLEY · MOATED KEEPS',seed:11,b:{x0:-60,x1:60,z0:-104,z1:104},cz:72,P:2.4,moat:true,
  sky:{top:0x3d7ccc,hor:0xd4e6f2,bot:0x8fa69a,sun:[.5,.62,.42],sunC:0xfff0d0,haze:.14,gnd:0x5a7a3a},fog:[0xcfe2ee,70,460],sun:[0xfff0d8,2.7],hemi:[0xc4dcff,0x5d6b3c,.95],exp:1.0,stone:0xd8d0c2,trim:0xa8a094,water:0x2c6a7a},
 {id:'spire',name:'CLOUDSPIRE',sub:'SKY ISLANDS · BRIDGE WARFARE',seed:23,b:{x0:-56,x1:56,z0:-104,z1:104},cz:70,P:2,sky:{top:0x2c66c4,hor:0xdcecff,bot:0xf2f6ff,sun:[-.35,.74,.45],sunC:0xfff4dc,haze:.12,gnd:0xe8eef8},
  fog:[0xdcecff,120,640],sun:[0xfff4e0,2.8],hemi:[0xd0e4ff,0x8a8f7a,1.0],exp:.98,stone:0xeeeae0,trim:0xc2b8a6,water:0x3a7f9a},
 {id:'pass',name:'FROSTFANG PASS',sub:'SNOWY MOUNTAIN PASS · FROZEN LAKE',seed:37,b:{x0:-58,x1:58,z0:-104,z1:104},cz:72,P:1.2,snow:true,
  sky:{top:0x6d8db4,hor:0xd8e2ec,bot:0xc8d2dc,sun:[.62,.33,-.42],sunC:0xffe0c0,haze:.2,gnd:0xe0e8f0},fog:[0xd8e2ec,40,300],sun:[0xffe6cc,2.1],hemi:[0xdde8ff,0x8a96a8,1.05],exp:1.02,stone:0x9ea3aa,trim:0x7b8088,water:0x6a8fa8}];

/* ================= shared materials ================= */
let MAT=null;
function mats(T){if(MAT)return MAT;const vc=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.88,metalness:0});
 MAT={vc,leaf:new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.8}),
  wood:new THREE.MeshStandardMaterial({map:T.wood,normalMap:T.woodN,vertexColors:true,roughness:.85,color:0xc89a68}),
  iron:new THREE.MeshStandardMaterial({color:0x34363c,roughness:.45,metalness:.7}),
  snow:new THREE.MeshStandardMaterial({color:0xf4f8ff,roughness:.75,flatShading:true}),
  roof:[0,1].map(t=>new THREE.MeshStandardMaterial({map:T.roof,color:new C(TEAMS[t].col).lerp(new C(0xffffff),.12),roughness:.7,flatShading:true})),
  glass:new THREE.MeshStandardMaterial({color:0x1a1410,roughness:.9})};return MAT;}

/* ================= prop geometries (vertex coloured, low poly) ================= */
const G={};
function propGeos(){if(G.oak)return G;const nz=makeNoise(5);
 const disp=(g,amt,f=1.3)=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+nz(x*f+3.1,z*f+y*1.7)*amt;p.setXYZ(i,x*k,y*k,z*k);}g.computeVertexNormals();return g;};
 const ico=(r,d=0)=>new THREE.IcosahedronGeometry(r,d);
 G.oak=merge([[new THREE.CylinderGeometry(.2,.32,3.2,6),0x6b4a2e,[0,1.6,0]],[disp(ico(1.7,1),.18),0x4f8a32,[0,3.9,0]],[disp(ico(1.2,1),.2),0x5f9a3a,[1,3.2,.5]],[disp(ico(1.25,1),.2),0x467d2c,[-.9,3.4,-.4]],[disp(ico(1,1),.2),0x6aa640,[.2,4.8,-.3]]]);
 G.pine=merge([[new THREE.CylinderGeometry(.16,.26,2,6),0x5a3e28,[0,1,0]],[new THREE.ConeGeometry(2,2.8,8),0x2f6a3a,[0,2.6,0]],[new THREE.ConeGeometry(1.55,2.4,8),0x357444,[0,3.9,0]],[new THREE.ConeGeometry(1.05,2,8),0x3d7e4a,[0,5.1,0]]]);
 G.snowpine=merge([[new THREE.CylinderGeometry(.16,.26,2,6),0x5a3e28,[0,1,0]],[new THREE.ConeGeometry(2,2.8,8),0x2c5a40,[0,2.6,0]],[new THREE.ConeGeometry(1.7,1.1,8),0xf2f6ff,[0,3.25,0]],[new THREE.ConeGeometry(1.55,2.4,8),0x31634a,[0,3.9,0]],[new THREE.ConeGeometry(1.3,1,8),0xf4f8ff,[0,4.5,0]],[new THREE.ConeGeometry(1.05,2,8),0x386c52,[0,5.1,0]],[new THREE.ConeGeometry(.72,1.1,8),0xffffff,[0,5.65,0]]]);
 G.rock=merge([[disp(new THREE.DodecahedronGeometry(1,1),.28,1.1),0x8a8780,[0,.35,0],[0,0,0],[1,.7,1]]]);
 G.snowrock=merge([[disp(new THREE.DodecahedronGeometry(1,1),.28,1.1),0x7c8088,[0,.35,0],[0,0,0],[1,.7,1]],[disp(new THREE.DodecahedronGeometry(.8,1),.2,1.3),0xf2f6ff,[.05,.62,0],[0,0,0],[1,.32,1]]]);
 G.bush=merge([[disp(ico(.8,1),.2),0x4a8432,[0,.5,0]],[disp(ico(.6,1),.2),0x5a943a,[.6,.4,.2]],[disp(ico(.55,1),.2),0x3e7a2c,[-.5,.38,-.2]]]);
 const blade=new THREE.ConeGeometry(.06,.7,3);G.grass=merge([[blade,0x6aa83e,[0,.35,0],[.15,0,.1]],[blade,0x5c9a36,[.12,.3,.05],[-.1,0,-.25],[1,.8,1]],[blade,0x78b848,[-.1,.32,-.06],[.2,1,.2],[1,.9,1]],[blade,0x5a9030,[.02,.28,-.12],[-.25,0,0],[1,.75,1]]]);
 G.flower=merge([[new THREE.CylinderGeometry(.015,.015,.4,3),0x4a8a2a,[0,.2,0]],[ico(.08,0),0xffffff,[0,.42,0]]]);
 G.hay=merge([[new THREE.CylinderGeometry(.75,.75,1.3,12),0xd8b45a,[0,.75,0],[0,0,Math.PI/2]],[new THREE.CylinderGeometry(.76,.76,.06,12),0xb08a3a,[.3,.75,0],[0,0,Math.PI/2]],[new THREE.CylinderGeometry(.76,.76,.06,12),0xb08a3a,[-.3,.75,0],[0,0,Math.PI/2]]]);
 G.barrel=merge([[new THREE.CylinderGeometry(.42,.42,1.1,10),0x8a5a34,[0,.55,0]],[new THREE.CylinderGeometry(.44,.44,.08,10),0x3a3a3e,[0,.2,0]],[new THREE.CylinderGeometry(.44,.44,.08,10),0x3a3a3e,[0,.9,0]],[new THREE.CylinderGeometry(.4,.4,.02,10),0x6a4426,[0,1.1,0]]]);
 G.crate=merge([[new THREE.BoxGeometry(1.1,1.1,1.1),0x9a6a3c,[0,.55,0]],[new THREE.BoxGeometry(1.14,.12,1.14),0x6a4426,[0,.08,0]],[new THREE.BoxGeometry(1.14,.12,1.14),0x6a4426,[0,1.02,0]],[new THREE.BoxGeometry(.12,1.1,1.16),0x6a4426,[0,.55,0],[0,.0,.78]]]);
 const wheel=new THREE.CylinderGeometry(.55,.55,.14,12);
 G.cart=merge([[new THREE.BoxGeometry(1.6,.5,2.6),0x8a5a34,[0,.95,0]],[new THREE.BoxGeometry(1.7,.12,2.7),0x6a4426,[0,.72,0]],[wheel,0x4a3220,[.88,.55,.6],[0,0,Math.PI/2]],[wheel,0x4a3220,[-.88,.55,.6],[0,0,Math.PI/2]],[wheel,0x4a3220,[.88,.55,-.6],[0,0,Math.PI/2]],[wheel,0x4a3220,[-.88,.55,-.6],[0,0,Math.PI/2]],[new THREE.BoxGeometry(.1,.1,2),0x6a4426,[.3,.9,2.1]],[new THREE.BoxGeometry(.1,.1,2),0x6a4426,[-.3,.9,2.1]],[disp(ico(.7,1),.15),0xd8b45a,[0,1.35,.2],[0,0,0],[1.1,.5,1.5]]]);
 const beam=(l,w=.28)=>new THREE.BoxGeometry(w,w,l);
 G.catapult=merge([[beam(4.2),0x7a5232,[.9,.5,0]],[beam(4.2),0x7a5232,[-.9,.5,0]],[new THREE.BoxGeometry(2.1,.26,.26),0x6a4426,[0,.5,1.6]],[new THREE.BoxGeometry(2.1,.26,.26),0x6a4426,[0,.5,-1.6]],
  [new THREE.BoxGeometry(.26,2.4,.26),0x7a5232,[.9,1.6,-.2],[.25,0,0]],[new THREE.BoxGeometry(.26,2.4,.26),0x7a5232,[-.9,1.6,-.2],[.25,0,0]],[new THREE.BoxGeometry(2.1,.3,.3),0x6a4426,[0,2.55,.1]],
  [new THREE.BoxGeometry(.24,.24,4.4),0x8a6038,[0,1.5,-.5],[-.55,0,0]],[new THREE.CylinderGeometry(.5,.35,.4,10),0x5a3a24,[0,2.8,-2.4]],[new THREE.BoxGeometry(.6,.6,.6),0x4a4a4e,[0,.85,1.2]],
  [wheel,0x4a3220,[1.08,.55,1.5],[0,0,Math.PI/2]],[wheel,0x4a3220,[-1.08,.55,1.5],[0,0,Math.PI/2]],[wheel,0x4a3220,[1.08,.55,-1.5],[0,0,Math.PI/2]],[wheel,0x4a3220,[-1.08,.55,-1.5],[0,0,Math.PI/2]],[ico(.32,0),0x8a8780,[0,3.05,-2.4]]]);
 G.fence=merge([[new THREE.BoxGeometry(.14,1.1,.14),0x7a5232,[-1.4,.55,0]],[new THREE.BoxGeometry(.14,1.1,.14),0x7a5232,[1.4,.55,0]],[new THREE.BoxGeometry(3,.12,.08),0x8a6038,[0,.8,0]],[new THREE.BoxGeometry(3,.12,.08),0x8a6038,[0,.42,0]]]);
 G.floatrock=merge([[disp(new THREE.ConeGeometry(1,2.4,7,3),.25,.9),0x7a6a5a,[0,-1.2,0],[Math.PI,0,0]],[disp(new THREE.CylinderGeometry(1.02,.95,.3,7),.1),0x6aa040,[0,.05,0]]]);
 return G;}
function inst(group,geo,mat,items,shadow=true,recv=true){if(!items.length)return null;const m=new THREE.InstancedMesh(geo,mat,items.length);const M=new THREE.Matrix4(),col=new C();
 items.forEach((it,i)=>{M.copy(mat4([it.x,it.y,it.z],[it.rx||0,it.ry||0,it.rz||0],[it.sx??it.s??1,it.sy??it.s??1,it.sz??it.s??1]));m.setMatrixAt(i,M);if(it.c!==undefined){col.set(it.c);m.setColorAt(i,col);}else{const v=.88+Math.random()*.24;col.setRGB(v,v,v);m.setColorAt(i,col);}});
 m.castShadow=shadow;m.receiveShadow=recv;m.instanceMatrix.needsUpdate=true;group.add(m);return m;}

/* ================= build context ================= */
function Ctx(W,T,def){const M=mats(T);return{W,T,def,M,bat:{stone:new Batch(),trim:new Batch(),wood:new Batch(),roof0:new Batch(),roof1:new Batch(),iron:new Batch(),snow:new Batch(),floor:new Batch()},
 nav:{paths:[],ladders:[]},spawns:[[],[]],homes:[],supply:[[],[]],props:{},banners:[],flagpoles:[],wind:[],rnd:rng(def.seed*7+1)};}
function prop(ctx,type,it){(ctx.props[type]||(ctx.props[type]=[])).push(it);}
// solid block + visual box (in world coordinates)
function box(ctx,x0,y0,z0,x1,y1,z1,mat,o={}){if(x0>x1)[x0,x1]=[x1,x0];if(z0>z1)[z0,z1]=[z1,z0];
 let b=null;if(o.solid!==false)b=ctx.W.addBlock({x0,y0,z0,x1,y1,z1,kind:mat==='wood'?'wood':'stone',walk:o.walk!==false,nav:!!o.nav,ramp:o.ramp||null});
 if(mat&&o.vis!==false){const w=x1-x0,h=y1-y0,d=z1-z0;let g=boxGeo(w,h,d,o.ts||(mat==='wood'?2:3),(x0*.37+z0*.21)%1,y0/3);
  if(o.ramp){const p=g.attributes.position,ax=o.ramp.axis,dir=o.ramp.dir,lo=(o.ramp.lo??y0)-y0-h/2;for(let i=0;i<p.count;i++){if(p.getY(i)<=0)continue;const c=ax==='x'?p.getX(i):p.getZ(i);if(dir>0?c<0:c>0)p.setY(i,lo+.01);}g.computeVertexNormals();}
  const sh=o.tint??(.86+ctx.rnd()*.2);ctx.bat[mat].add(g,mat4([(x0+x1)/2,(y0+y1)/2,(z0+z1)/2]),new C(sh,sh,sh*.98));}
 return b;}
function vis(ctx,mat,geo,p,r,s,col){ctx.bat[mat].add(geo,mat4(p,r,s),col!==undefined?new C(col):null);}
function ladder(ctx,x,z,nx,nz,y0,y1,top){const tx=-nz,tz=nx;const l={x,z,nx,nz,tx,tz,w:1.1,y0,y1};ctx.W.ladders.push(l);
 const h=y1-y0+.9,cx=x+nx*.12,cz=z+nz*.12,ry=Math.atan2(nx,nz);
 for(const s of[-.5,.5])vis(ctx,'wood',new THREE.BoxGeometry(.1,h,.1),[cx+tx*s,y0+h/2,cz+tz*s],[0,ry,0]);
 for(let y=y0+.35;y<y1+.6;y+=.42)vis(ctx,'wood',new THREE.BoxGeometry(1,.07,.07),[cx,y,cz],[0,ry,0]);
 ctx.nav.ladders.push({bx:x+nx*.75,by:y0,bz:z+nz*.75,tx:top[0],ty:top[1],tz:top[2],ref:l});return l;}

/* ================= castle ================= */
// Local frame: u = lateral, v = toward the enemy. face=+1 for AZURE (south, facing +z), -1 for CRIMSON.
function castle(ctx,team,cx,cz,face,P,st){const W=ctx.W,def=ctx.def;
 const L=(u0,v0,u1,v1)=>face>0?[cx+u0,cz+v0,cx+u1,cz+v1]:[cx-u1,cz-v1,cx-u0,cz-v0];
 const B=(u0,y0,v0,u1,y1,v1,mat='stone',o={})=>{const[x0,z0,x1,z1]=L(u0,v0,u1,v1);let ramp=o.ramp;if(ramp)ramp={axis:ramp.axis==='v'?'z':'x',dir:ramp.dir*face,lo:ramp.lo!==undefined?P+ramp.lo:undefined};return box(ctx,x0,P+y0,z0,x1,P+y1,z1,mat,{...o,ramp});};
 const pt=(u,y,v)=>[cx+u*face,P+y,cz+v*face];const ry0=face>0?0:Math.PI;
 const H=7,TH=10.5,snow=def.snow;
 const merl=(u0,v0,u1,v1,y,side)=>{// side: outward normal in local (su,sv)
  const along=Math.abs(u1-u0)>Math.abs(v1-v0),len=along?u1-u0:v1-v0,n=Math.floor(Math.abs(len)/2);const[su,sv]=side;
  for(let k=0;k<n;k++){const a=(along?u0:v0)+Math.sign(len)*(k*2+.5+(Math.abs(len)-n*2)/2);const a1=a+Math.sign(len);
   if(along){const ev=v0;B(Math.min(a,a1),y,sv>0?ev-.55:ev,Math.max(a,a1),y+1.15,sv>0?ev:ev+.55,'stone',{tint:.92,walk:false});if(snow)B(Math.min(a,a1)-.04,y+1.15,sv>0?ev-.59:ev-.04,Math.max(a,a1)+.04,y+1.3,sv>0?ev+.04:ev+.59,'snow',{solid:false});}
   else{const eu=u0;B(su>0?eu-.55:eu,y,Math.min(a,a1),su>0?eu:eu+.55,y+1.15,Math.max(a,a1),'stone',{tint:.92,walk:false});if(snow)B(su>0?eu-.59:eu-.04,y+1.15,Math.min(a,a1)-.04,su>0?eu+.04:eu+.59,y+1.3,Math.max(a,a1)+.04,'snow',{solid:false});}}
  // trim band under the merlons
  if(along)B(Math.min(u0,u1),y-.45,sv>0?v0-.05:v0-.25,Math.max(u0,u1),y-.05,sv>0?v0+.25:v0+.05,'trim',{solid:false});else B(su>0?u0-.05:u0-.25,y-.45,Math.min(v0,v1),su>0?u0+.25:u0+.05,y-.05,Math.max(v0,v1),'trim',{solid:false});
  if(snow){if(along)B(Math.min(u0,u1),y,Math.min(v0,v0-sv*2),Math.max(u0,u1),y+.08,Math.max(v0,v0-sv*2),'snow',{solid:false});else B(Math.min(u0,u0-su*2),y,Math.min(v0,v1),Math.max(u0,u0-su*2),y+.08,Math.max(v0,v1),'snow',{solid:false});}};
 // plinth course (visual) around the base
 const plinth=(u0,v0,u1,v1)=>B(u0-.25,-.6,v0-.25,u1+.25,.7,v1+.25,'trim',{solid:false});
 /* walls */
 B(-13,0,12,-6,H,14);B(6,0,12,13,H,14);plinth(-13,12,-6,14);plinth(6,12,13,14);merl(-13,14,-6,14,H,[0,1]);merl(6,14,13,14,H,[0,1]);
 for(const s of[-1,1]){const u0=s>0?16:-18,u1=s>0?18:-16;// side walls with a postern gate
  B(u0,0,-13,u1,H,-10.2);B(u0,0,-7.4,u1,H,9);B(u0,3.3,-10.2,u1,H,-7.4);plinth(u0,-13,u1,-10.2);plinth(u0,-7.4,u1,9);merl(s>0?18:-18,-13,s>0?18:-18,9,H,[s,0]);
  B(s>0?15.8:-18.2,0,-10.35,s>0?16.1:-15.9,3.45,-10.1,'wood',{solid:false});B(s>0?15.8:-18.2,0,-7.5,s>0?16.1:-15.9,3.45,-7.25,'wood',{solid:false});}
 B(-13,0,-18,13,H,-16);plinth(-13,-18,13,-16);merl(-13,-18,13,-18,H,[0,-1]);
 /* gatehouse */
 B(-6,0,12,-2.8,H+.6,16.2);B(2.8,0,12,6,H+.6,16.2);B(-2.8,4.5,12,2.8,H+.6,16.2);plinth(-6,12,6,16.2);merl(-6,16.2,6,16.2,H+.6,[0,1]);
 B(-6.3,4.2,16.2,6.3,4.6,16.6,'trim',{solid:false});
 // portcullis (raised) + open gate leaves
 for(let i=-2;i<=2;i++)vis(ctx,'iron',new THREE.BoxGeometry(.12,1.6,.12),pt(i*1.1,5.4,16.0),[0,ry0,0]);vis(ctx,'iron',new THREE.BoxGeometry(5.6,.14,.14),pt(0,4.7,16.0),[0,ry0,0]);
 for(const s of[-1,1]){const g=boxGeo(2.6,4.2,.22,2);vis(ctx,'wood',g,pt(s*3.1,2.1,11.2),[0,ry0+s*1.25,0]);}
 /* corner towers */
 for(const[su,sv]of[[-1,1],[1,1],[-1,-1],[1,-1]]){const u0=su>0?13:-20,u1=su>0?20:-13,v0=sv>0?9:-20,v1=sv>0?16:-13;B(u0,0,v0,u1,TH,v1);plinth(u0,v0,u1,v1);
  merl(u0,v1,u1,v1,TH,[0,1]);merl(u0,v0,u1,v0,TH,[0,-1]);merl(u0,v0,u0,v1,TH,[-1,0]);merl(u1,v0,u1,v1,TH,[1,0]);
  for(const y of[4,7.5])for(const fu of[-1,1]){const fv=sv>0?v1:v0;vis(ctx,'iron',new THREE.BoxGeometry(.3,1.3,.1),pt((u0+u1)/2+fu*1.6,y,fv+sv*.03),[0,ry0,0]);}
  const fu=su>0?u0:u1,lv=sv>0?10.4:-14.6;// ladder on the courtyard face
  const top=pt(fu-su*1.2,TH,lv);const[lx,,lz]=pt(fu,0,lv);ladder(ctx,lx,lz,-su*face,0,P,P+TH,top);
  ctx.nav.paths.push([pt((u0+u1)/2,TH,(v0+v1)/2),pt(fu-su*1.2,TH,lv)]);
  // banner on the outer face
  const bv=sv>0?v1+.32:v0-.32;ctx.banners.push({team,p:pt((u0+u1)/2,TH-3.6,bv),ry:ry0+(sv>0?0:Math.PI),w:2.2,h:4.6});}
 ctx.banners.push({team,p:pt(-4.4,H-1.6,16.85),ry:ry0,w:1.6,h:3.4});ctx.banners.push({team,p:pt(4.4,H-1.6,16.85),ry:ry0,w:1.6,h:3.4});
 /* inner ramps (stairs) up to the side wall walks */
 for(const s of[-1,1]){const u0=s>0?12.4:-16,u1=s>0?16:-12.4;B(u0,0,-5,u1,H,8,'stone',{ramp:{axis:'v',dir:1,lo:0},nav:true,vis:false});
  for(let k=0;k<20;k++){const v0=-5+k*.65,h=(k+1)*H/20;B(u0,0,v0,u1,h,v0+.65,'trim',{solid:false,tint:.8+(k%2)*.08});}
  if(snow)for(let k=0;k<20;k++){const v0=-5+k*.65,h=(k+1)*H/20;B(u0,h,v0,u1,h+.06,v0+.4,'snow',{solid:false});}
  ctx.nav.paths.push([pt(s*14.2,0,-6.2),pt(s*14.2,H*(.5/13),-4.5),pt(s*14.2,H*(12/13),7),pt(s*16.8,H,7.6),pt(s*16.8,H,-12.3)]);}
 // gatehouse ladders
 for(const s of[-1,1]){const[lx,,lz]=pt(s*4.4,0,12);ladder(ctx,lx,lz,0,-face,P,P+H+.6,pt(s*4.4,H+.6,13.4));}
 ctx.nav.paths.push([pt(-12.4,H,13),pt(-6.4,H,13),pt(-4.4,H+.6,14.2),pt(0,H+.6,14.6),pt(4.4,H+.6,14.2),pt(6.4,H,13),pt(12.4,H,13)]);
 /* keep */
 const KH=10;B(-7,0,-16,7,KH,-6);plinth(-7,-16,7,-6);merl(-7,-6,7,-6,KH,[0,1]);merl(-7,-16,-7,-6,KH,[-1,0]);merl(7,-16,7,-6,KH,[1,0]);merl(-7,-16,7,-16,KH,[0,-1]);
 for(const[su,sv]of[[-1,1],[1,1],[-1,-1],[1,-1]]){const u=su*6,v=sv>0?-7:-15;B(u-1.1,KH,v-1.1,u+1.1,KH+2.6,v+1.1);
  const[tx,ty,tz]=pt(u,KH+2.6,v);ctx.bat['roof'+team].add(new THREE.ConeGeometry(1.75,3.2,8),mat4([tx,ty+1.6,tz],[0,Math.PI/8,0]));}
 for(const u of[-4.5,-1.5,1.5,4.5])vis(ctx,'iron',new THREE.BoxGeometry(.5,1.4,.1),pt(u,6.6,-5.95),[0,ry0,0]);
 vis(ctx,'wood',boxGeo(2.4,3.2,.2,2),pt(0,1.6,-5.9),[0,ry0,0]);vis(ctx,'trim',boxGeo(3,.4,.5),pt(0,3.4,-5.8),[0,ry0,0]);
 {const[lx,,lz]=pt(4.8,0,-6);ladder(ctx,lx,lz,0,face,P,P+KH,pt(4.8,KH,-7.4));}
 ctx.nav.paths.push([pt(4.8,KH,-7.4),pt(0,KH,-9),pt(-3,KH,-12),pt(3,KH,-12)]);
 // keep flag pole with the big standard
 {const p=pt(0,KH,-11);vis(ctx,'iron',new THREE.CylinderGeometry(.08,.1,7,8),[p[0],p[1]+3.5,p[2]]);ctx.flagpoles.push({team,p:[p[0],p[1]+6.9,p[2]],ry:ry0+Math.PI/2,w:3.6,h:2.2});}
 /* courtyard floor + flag pedestal + supply racks */
 {const[x0,z0,x1,z1]=L(-16,-16,16,12);const g=new THREE.PlaneGeometry(x1-x0,z1-z0).rotateX(-Math.PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(x1-x0)/4,uv.getY(i)*(z1-z0)/4);
  ctx.bat.floor.add(g,mat4([(x0+x1)/2,P+.03,(z0+z1)/2]),new C(.75,.74,.72));}
 const home=pt(0,.32,-2);B(-1.3,0,-3.3,1.3,.3,-.7,'trim');vis(ctx,'stone',new THREE.CylinderGeometry(1.15,1.35,.32,12),[home[0],P+.16,home[2]]);ctx.homes[team]=new V(...home);
 {const p=pt(-10.5,0,-10);B(-11.6,0,-10.5,-9.4,1.3,-9.5,'wood');for(let i=0;i<7;i++)vis(ctx,'wood',new THREE.CylinderGeometry(.03,.03,1.5,4),[p[0]+(i-3)*.28*face,P+1.5,p[2]-.1*face],[.1,0,0]);
  ctx.supply[team].push({x:p[0],y:P,z:p[2],kind:'arrows'});}
 {const p=pt(10.5,0,-10);B(9.4,0,-11,11.6,.9,-9,'wood');for(let i=0;i<4;i++)vis(ctx,'wood',boxGeo(2.4,.18,.4,2),[p[0],P+1+i*.2,p[2]+(i%2?.25:-.25)],[0,ry0+.05*(i-1.5),0]);ctx.supply[team].push({x:p[0],y:P,z:p[2],kind:'planks'});}
 prop(ctx,'barrel',{x:pt(-14.5,0,-1)[0],y:P,z:pt(-14.5,0,-1)[2]});prop(ctx,'barrel',{x:pt(-14.6,0,.1)[0],y:P,z:pt(-14.6,0,.1)[2],s:.95});prop(ctx,'crate',{x:pt(14.3,0,-2)[0],y:P,z:pt(14.3,0,-2)[2],ry:.3});
 for(const[u,v]of[[-14.5,-1],[14.3,-2]]){const c=pt(u,0,v);box(ctx,c[0]-.55,P,c[2]-.55,c[0]+.55,P+1.1,c[2]+.55,null,{vis:false});}
 /* spawns */
 for(const[u,v]of[[-9,-3],[9,-3],[-6,4],[6,4],[-10,7],[10,7],[0,7],[-3,-1],[3,-1],[-11,-12],[11,-12],[0,3]]){const p=pt(u,0,v);ctx.spawns[team].push({x:p[0],y:P,z:p[2],yaw:face>0?Math.PI:0});}
 /* catapults on the flanks (outside) */
 for(const s of[-1,1]){const p=pt(s*26,0,6);const tz=W.fn?W.fn(p[0],p[2]):0;prop(ctx,'catapult',{x:p[0],y:(tz??P)-.05,z:p[2],ry:ry0+s*.25});box(ctx,p[0]-1.3,(tz??P),p[2]-2,p[0]+1.3,(tz??P)+1.6,p[2]+2,null,{vis:false});}
 return{face,P,cx,cz,L,B,pt};}

/* ================= terrain mesh ================= */
function terrainMesh(ctx,colorAt){const W=ctx.W,nx=W.nx,nz=W.nz,H=W.H,r=W.res;const pos=new Float32Array(nx*nz*3),col=new Float32Array(nx*nz*3),uv=new Float32Array(nx*nz*2);const idx=[];const n=makeNoise(ctx.def.seed+3),c=new C();
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,x=W.tx0+i*r,z=W.tz0+j*r,h=H[k];pos[k*3]=x;pos[k*3+1]=h===h?h:0;pos[k*3+2]=z;uv[k*2]=x/4;uv[k*2+1]=z/4;
  if(h===h){const hx=(H[k+1]??h)-(H[k-1]??h),hz=(H[k+nx]??h)-(H[k-nx]??h);const sl=Math.hypot(hx===hx?hx:0,hz===hz?hz:0)/(2*r);colorAt(c,x,z,h,sl,n);col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}}
 for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,cc=a+nx,d=cc+1;const ok=k=>H[k]===H[k];if((i+j)%2){if(ok(a)&&ok(cc)&&ok(b))idx.push(a,cc,b);if(ok(b)&&ok(cc)&&ok(d))idx.push(b,cc,d);}else{if(ok(a)&&ok(cc)&&ok(d))idx.push(a,cc,d);if(ok(a)&&ok(d)&&ok(b))idx.push(a,d,b);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();
 const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,map:ctx.T.grain,roughness:.95,flatShading:true}));m.receiveShadow=true;m.castShadow=true;return m;}

/* ================= map builders ================= */
function castleField(def){// plateau + moat shaping around both castles
 const P=def.P,cz=def.cz;return(x,z,h)=>{for(const f of[1,-1]){const ccz=-f*cz;const u=(x)*f,v=(z-ccz)*f;// local coords
   const du=Math.max(0,Math.abs(u)-26),dv=Math.max(0,v-23,-23-v);const d=Math.hypot(du,dv);
   if(d<16)h=lerp(h,P,sstep(16,0,d));
   if(def.moat){const mu=Math.max(0,Math.abs(u)-21.5),mv=Math.max(0,v-17.5,-21.5-v);const md=Math.hypot(mu,mv);if(md>0&&md<7.5)h=P-2.3*Math.sin(Math.PI*md/7.5)**.8;}}return h;};}

function buildVale(ctx){const def=ctx.def,W=ctx.W,n=makeNoise(def.seed),P=def.P,cf=castleField(def);
 const zr=x=>5*Math.sin(x/17);
 const nat=(x,z)=>{let h=n.fbm(x/48,z/48,3)*1.6+n.fbm(x/14+5,z/14,2)*.45+.6;const ax=Math.abs(x);h+=sstep(36,58,ax)*(9+n.fbm(x/20,z/20)*6)+sstep(30,40,ax)*1.2;h+=sstep(92,108,Math.abs(z))*8;
  const dr=Math.abs(z-zr(x));h=lerp(h,-2.6,sstep(10,4.5,dr));return h;};
 W.setTerrain((x,z)=>cf(x,z,nat(x,z)));
 W.waters.push({x0:-70,x1:70,z0:-24,z1:24,y:-1});for(const f of[1,-1])W.waters.push({x0:-33,x1:33,z0:-f*def.cz-28,z1:-f*def.cz+28,y:P-1.05});
 const Cs=[castle(ctx,0,0,-def.cz,1,P),castle(ctx,1,0,def.cz,-1,P)];
 // moat bridges (gate + posterns)
 for(const c of Cs){const[x0,z0,x1,z1]=c.L(-3,16,3,26.5);box(ctx,x0,P-1.2,z0,x1,P,z1,'wood',{nav:true,tint:.95});
  for(const s of[-1,1]){const[a0,b0,a1,b1]=c.L(s*3,16,s*3.25,26.5);box(ctx,a0,P,b0,a1,P+.9,b1,'wood',{solid:true,walk:false});}
  for(const s of[-1,1]){const[a0,b0,a1,b1]=c.L(s>0?18:-30,-10.4,s>0?30:-18,-7.2);box(ctx,a0,P-1,b0,a1,P,b1,'wood',{nav:true,tint:.9});}}
 // river bridges: arched stone bridge in the middle, timber bridges on the flanks
 {const top=1.5;box(ctx,-3.5,-3,-13,3.5,top,0,'stone',{ramp:{axis:'z',dir:1,lo:.2},nav:true});box(ctx,-3.5,-3,0,3.5,top,13,'stone',{ramp:{axis:'z',dir:-1,lo:.2},nav:true});
  for(const s of[-1,1]){const a=s>0?3.5:-3.75,b=s>0?3.75:-3.5;box(ctx,a,-3,-13,b,top+.85,0,'trim',{walk:false,ramp:{axis:'z',dir:1,lo:1.05}});box(ctx,a,-3,0,b,top+.85,13,'trim',{walk:false,ramp:{axis:'z',dir:-1,lo:1.05}});}
  for(const zz of[-5,5])box(ctx,-2.6,-3,zz-1,2.6,-.4,zz+1,'trim',{solid:false});}
 for(const s of[-1,1]){const x=s*32,z0=zr(x)-11,z1=zr(x)+11;box(ctx,x-1.6,-.6,z0,x+1.6,.55,z1,'wood',{nav:true,ts:2});for(const zz of[z0+2,(z0+z1)/2,z1-2])for(const xx of[-1.3,1.3])box(ctx,x+xx-.15,-2.8,zz-.15,x+xx+.15,1.5,zz+.15,'wood',{walk:false});
  box(ctx,x-1.75,.55,z0,x-1.6,1.4,z1,'wood',{walk:false,solid:false});box(ctx,x+1.6,.55,z0,x+1.75,1.4,z1,'wood',{walk:false,solid:false});}
 // midfield cover: ruined walls + watch posts (point-symmetric)
 const sym=(fn)=>{fn(1);fn(-1);};
 sym(f=>{const S=(x0,y0,z0,x1,y1,z1,m='stone',o)=>box(ctx,f>0?x0:-x1,y0,f>0?z0:-z1,f>0?x1:-x0,y1,f>0?z1:-z0,m,o);const g=(x,z)=>W.terrain(x*f,z*f);
  // broken wall near the river bank
  {const y=g(-14,-20)-.5;S(-20,y,-21,-8,y+2.6,-19.8);S(-20,y+2.6,-21,-15,y+3.6,-19.8);S(-11,y+2.6,-21,-8,y+3.1,-19.8);}
  {const y=g(16,-26)-.5;S(14,y,-28,15.2,y+2.4,-22);}
  // lookout hut on the hill with a ladder
  {const x=-40,z=-30,y=g(x,z)-.3;S(x-2.5,y,z-2.5,x+2.5,y+5,z+2.5,'stone');S(x-2.8,y+5,z-2.8,x+2.8,y+5.4,z+2.8,'wood',{nav:true});
   const[lx,lz]=[x*f,(z+2.5)*f];ladder(ctx,lx,lz,0,f,y,y+5.4,[x*f,y+5.4,z*f]);ctx.nav.paths.push([[x*f,y+5.4,z*f],[(x+1.6)*f,y+5.4,(z+1.6)*f]]);
   for(const[a,b]of[[-2.6,-2.6],[2.6,-2.6],[-2.6,2.6],[2.6,2.6]])S(x+a-.12,y+5.4,z+b-.12,x+a+.12,y+7.6,z+b+.12,'wood',{walk:false});
   const rp=[x*f,y+7.6,z*f];ctx.bat.roof0.add(new THREE.ConeGeometry(4.1,2.2,4),mat4([rp[0],rp[1]+1.1,rp[2]],[0,Math.PI/4,0]));}
  // hay + carts for cover in the fields
  for(const[x,z,t,r]of[[-6,-38,'hay',0],[-4.4,-38.4,'hay',.2],[22,-40,'cart',.6],[-26,-14,'hay',1.2],[8,-24,'crate',.4],[9.1,-24.2,'crate',.1],[34,-48,'hay',.4]]){const y=g(x,z);prop(ctx,t,{x:x*f,y:y-.05,z:z*f,ry:r+(f<0?Math.PI:0)});const R=t==='cart'?1.3:t==='hay'?.8:.55;box(ctx,x*f-R,y,z*f-R,x*f+R,y+(t==='cart'?1.5:t==='hay'?1.45:1.1),z*f+R,null,{vis:false});}});
 // windmill on the west ridge (decor + collision)
 {const x=-50,z=0,y=W.terrain(x,z)-.5;box(ctx,x-2.6,y,z-2.6,x+2.6,y+9,z+2.6,null,{vis:false});const g=new THREE.CylinderGeometry(2.2,3,9,10);vis(ctx,'stone',g,[x,y+4.5,z]);ctx.bat.roof1.add(new THREE.ConeGeometry(3,3.4,10),mat4([x,y+10.7,z]));
  const blades=new THREE.Group();blades.position.set(x+3,y+8,z);const bm=merge([[new THREE.BoxGeometry(.3,.3,.8),0x5a3a24,[0,0,0]],...[0,1,2,3].map(i=>[new THREE.BoxGeometry(.2,6,.06),0xe8dcc0,[0,3*Math.cos(i*Math.PI/2),3*Math.sin(i*Math.PI/2)],[i*Math.PI/2,0,0],[1,1,1]]),...[0,1,2,3].map(i=>[new THREE.BoxGeometry(.06,5.2,1.1),0xd8c8a8,[.08,3.2*Math.cos(i*Math.PI/2),3.2*Math.sin(i*Math.PI/2)+.5*Math.cos(i*Math.PI/2)],[i*Math.PI/2,0,0]])]);
  const bmesh=new THREE.Mesh(bm,ctx.M.vc);bmesh.castShadow=true;blades.add(bmesh);ctx.wind.push(blades);}
 // vegetation
 const R=ctx.rnd,free=(x,z,pad=0)=>{for(const f of[1,-1]){const u=x*f,v=(z+f*def.cz)*f;if(Math.abs(u)<36+pad&&v>-30-pad&&v<34+pad)return false;}if(Math.abs(z-zr(x))<12+pad)return false;if(Math.abs(x)<6+pad&&Math.abs(z)<20)return false;return true;};
 const trees=[],pines=[],rocks=[],bushes=[],grass=[],flowers=[];
 for(let i=0;i<260;i++){const x=(R()-.5)*116,z=(R()-.5)*204;if(!free(x,z,2))continue;const y=W.terrain(x,z);const ax=Math.abs(x);if(ax<24&&R()<.85)continue;
  const s=.8+R()*.6;if(ax>40&&R()<.5)pines.push({x,y:y-.1,z,s,ry:R()*6});else trees.push({x,y:y-.1,z,s,ry:R()*6});}
 for(let i=0;i<70;i++){const x=(R()-.5)*112,z=(R()-.5)*200;if(!free(x,z,0))continue;rocks.push({x,y:W.terrain(x,z)-.2,z,s:.6+R()*1.4,ry:R()*6});}
 for(let i=0;i<110;i++){const x=(R()-.5)*110,z=(R()-.5)*200;if(!free(x,z,-2))continue;bushes.push({x,y:W.terrain(x,z)-.1,z,s:.7+R()*.6,ry:R()*6});}
 for(let i=0;i<2600;i++){const x=(R()-.5)*114,z=(R()-.5)*204;if(!free(x,z,-6))continue;const y=W.terrain(x,z);if(y<-.6)continue;grass.push({x,y,z,s:.7+R()*.8,ry:R()*6});if(R()<.12)flowers.push({x:x+.3,y,z,s:.8+R()*.5,c:[0xffe14a,0xff6aa0,0xffffff,0xa070ff][R()*4|0]});}
 for(const t of trees)box(ctx,t.x-.3*t.s,t.y,t.z-.3*t.s,t.x+.3*t.s,t.y+3.2*t.s,t.z+.3*t.s,null,{vis:false,walk:false});
 for(const t of pines)box(ctx,t.x-.25*t.s,t.y,t.z-.25*t.s,t.x+.25*t.s,t.y+2.4*t.s,t.z+.25*t.s,null,{vis:false,walk:false});
 for(const r of rocks)box(ctx,r.x-.7*r.s,r.y-1,r.z-.7*r.s,r.x+.7*r.s,r.y+.75*r.s,r.z+.7*r.s,null,{vis:false});
 Object.assign(ctx.props,{oak:trees,pine:pines,rock:rocks,bush:bushes,grass,flower:flowers});
 ctx.colorAt=(c,x,z,h,sl,nn)=>{const v=nn(x/9,z/9)*.5+nn(x/2.3,z/2.3)*.2;const dr=Math.abs(z-zr(x));
  c.setRGB(.24+v*.05,.46+v*.08,.14+v*.03);if(nn(x/30+9,z/30)>.25)c.lerp(new C(.36,.5,.16),.6);
  if(dr<10.5){const k=sstep(10.5,7,dr);c.lerp(new C(.62,.55,.38),k);if(h<-1.1)c.lerp(new C(.36,.32,.24),.7);}
  if(sl>.7)c.lerp(new C(.42,.4,.36),sstep(.7,1.1,sl));
  for(const f of[1,-1]){const u=x*f,v=(z+f*def.cz)*f;if(Math.abs(u)<4&&v>16&&v<50)c.lerp(new C(.5,.42,.3),.55*sstep(4,2,Math.abs(u)));if(Math.abs(u)<26&&v>-24&&v<23&&h>P-.4)c.lerp(new C(.42,.38,.3),.5);}
  if(Math.abs(x)<3&&Math.abs(z)<60&&Math.abs(z)>12)c.lerp(new C(.5,.42,.3),.35);};
 ctx.clouds=[];const Rc=rng(3);for(let i=0;i<26;i++){const a=Rc()*Math.PI*2,r=300+Rc()*500;ctx.clouds.push({x:Math.cos(a)*r,y:120+Rc()*120,z:Math.sin(a)*r,w:120,h:24,d:60,s:40+Rc()*30,n:7});}
 return Cs;}

function buildSpire(ctx){const def=ctx.def,W=ctx.W,n=makeNoise(def.seed),P=def.P;
 const isl=[{x:0,z:-66,r:36,h:1.4,c:1},{x:0,z:66,r:36,h:1.4,c:1},{x:0,z:0,r:15,h:.6},{x:-30,z:0,r:10.5,h:1.2},{x:30,z:0,r:10.5,h:1.2}];
 const cf=castleField(def);
 const fn=(x,z)=>{let best=null;for(const I of isl){const dx=x-I.x,dz=z-I.z,d=Math.hypot(dx,dz),a=Math.atan2(dz,dx);const R=I.r*(1+.07*n(Math.cos(a)*2+I.x*.1,Math.sin(a)*2+I.z*.1));if(d>R)continue;const k=d/R;
   let h=I.h+n.fbm(x/16,z/16,3)*1.1-sstep(.84,1,k)*2.2;if(I.c)h=cf(x,z,h);if(best===null||h>best)best=h;}return best;};
 W.setTerrain(fn);W.voidY=-30;ctx.islands=isl;
 const Cs=[castle(ctx,0,0,-def.cz,1,P),castle(ctx,1,0,def.cz,-1,P)];
 // bridges: centre causeway, flank sky-bridges, islet links
 const bridge=(x0,z0,x1,z1,y,axis)=>{box(ctx,x0,y-.45,z0,x1,y,z1,'wood',{nav:true,ts:2});const L=axis==='z'?z1-z0:x1-x0;
  for(let t=1.5;t<L;t+=3.5){const px=axis==='z'?(x0+x1)/2:x0+t,pz=axis==='z'?z0+t:(z0+z1)/2;vis(ctx,'wood',new THREE.BoxGeometry(axis==='z'?x1-x0+.5:.3,.3,axis==='z'?.3:z1-z0+.5),[px,y-.6,pz]);
   for(const s of[-1,1]){const qx=axis==='z'?(s<0?x0:x1):px,qz=axis==='z'?pz:(s<0?z0:z1);box(ctx,qx-.1,y,qz-.1,qx+.1,y+1.1,qz+.1,'wood',{walk:false});}}
  for(const s of[-1,1]){if(axis==='z'){const qx=s<0?x0:x1;box(ctx,qx-.05,y+.95,z0,qx+.05,y+1.05,z1,'wood',{solid:false});}else{const qz=s<0?z0:z1;box(ctx,x0,y+.95,qz-.05,x1,y+1.05,qz+.05,'wood',{solid:false});}}};
 for(const f of[1,-1]){bridge(-2,f>0?10:-36,2,f>0?36:-10,.7,'z');bridge(f>0?27.6:-32.4,f>0?7:-60,f>0?32.4:-27.6,f>0?60:-7,1.3,'z');}
 bridge(-21,-1.7,-12,1.7,.9,'x');bridge(12,-1.7,21,1.7,.9,'x');
 // central ruin: broken arches and pillars
 for(const f of[1,-1]){const S=(x0,y0,z0,x1,y1,z1,m='stone',o)=>box(ctx,f>0?x0:-x1,y0,f>0?z0:-z1,f>0?x1:-x0,y1,f>0?z1:-z0,m,o);const y=W.terrain(0,0)-.4;
  S(-7,y,4,-5.5,y+5,5.5);S(5.5,y,4,7,y+5,5.5);S(-7,y+5,4,7,y+6.2,5.5,'stone',{nav:false});S(-9.5,y,-1,-8,y+3.2,1);S(-3,y,7.5,3,y+1.2,8.4);
  S(-34,W.terrain(-30*f,-2*f)-.4,-4,-31,W.terrain(-30*f,-2*f)+2.4,-3);S(-27,W.terrain(-30*f,3*f)-.4,2.5,-25,W.terrain(-30*f,3*f)+1.4,4.5);
  for(const[x,z]of[[-30,4],[-32,2]]){const yy=W.terrain(x*f,z*f);prop(ctx,'crate',{x:x*f,y:yy,z:z*f,ry:x});box(ctx,x*f-.55,yy,z*f-.55,x*f+.55,yy+1.1,z*f+.55,null,{vis:false});}
  {const x=-18,z=-36,yy=W.terrain(x*f,z*f);if(yy>-50){prop(ctx,'hay',{x:x*f,y:yy,z:z*f,ry:.5});box(ctx,x*f-.8,yy,z*f-.8,x*f+.8,yy+1.4,z*f+.8,null,{vis:false});}}}
 const R=ctx.rnd,trees=[],rocks=[],bushes=[],grass=[],flowers=[];
 const free=(x,z)=>{for(const f of[1,-1]){const u=x*f,v=(z+f*def.cz)*f;if(Math.abs(u)<31&&v>-29&&v<29)return false;}if(Math.abs(x)<4&&Math.abs(z)<40)return false;if(Math.abs(Math.abs(x)-30)<4)return false;if(Math.abs(z)<3&&Math.abs(x)<34)return false;if(Math.abs(x)<9&&Math.abs(z)<9)return false;return true;};
 for(let i=0;i<700;i++){const x=(R()-.5)*110,z=(R()-.5)*200;const y=W.terrain(x,z);if(y<-5)continue;if(!free(x,z))continue;const k=R();if(k<.05)trees.push({x,y:y-.1,z,s:.7+R()*.5,ry:R()*6});else if(k<.1)rocks.push({x,y:y-.2,z,s:.6+R()*1.1,ry:R()*6});else if(k<.18)bushes.push({x,y,z,s:.6+R()*.6,ry:R()*6});}
 for(let i=0;i<2400;i++){const x=(R()-.5)*110,z=(R()-.5)*200;const y=W.terrain(x,z);if(y<-.3)continue;grass.push({x,y,z,s:.7+R()*.8,ry:R()*6});if(R()<.14)flowers.push({x:x+.3,y,z,s:.8+R()*.5,c:[0xffe14a,0xff6aa0,0xffffff,0x7ab0ff][R()*4|0]});}
 for(const t of trees)box(ctx,t.x-.3*t.s,t.y,t.z-.3*t.s,t.x+.3*t.s,t.y+3.2*t.s,t.z+.3*t.s,null,{vis:false,walk:false});
 for(const r of rocks)box(ctx,r.x-.7*r.s,r.y-1,r.z-.7*r.s,r.x+.7*r.s,r.y+.75*r.s,r.z+.7*r.s,null,{vis:false});
 // distant floating rocks
 const fr=[];const Rf=rng(9);for(let i=0;i<46;i++){const a=Rf()*Math.PI*2,r=110+Rf()*260;fr.push({x:Math.cos(a)*r,y:-30+Rf()*70,z:Math.sin(a)*r*1.2,s:3+Rf()*9,ry:Rf()*6});}
 Object.assign(ctx.props,{oak:trees,rock:rocks,bush:bushes,grass,flower:flowers,floatrock:fr});
 ctx.colorAt=(c,x,z,h,sl,nn)=>{const v=nn(x/9,z/9)*.5+nn(x/2.3,z/2.3)*.2;c.setRGB(.3+v*.05,.55+v*.08,.18+v*.03);if(nn(x/24+3,z/24)>.3)c.lerp(new C(.44,.6,.2),.5);
  if(sl>.55)c.lerp(new C(.55,.5,.42),sstep(.55,1,sl));for(const f of[1,-1]){const u=x*f,v=(z+f*def.cz)*f;if(Math.abs(u)<26&&v>-24&&v<23&&h>P-.4)c.lerp(new C(.48,.44,.36),.5);}};
 ctx.clouds=[];const Rc=rng(4);for(let i=0;i<70;i++){const a=Rc()*Math.PI*2,r=60+Rc()*700;ctx.clouds.push({x:Math.cos(a)*r,y:-55-Rc()*30,z:Math.sin(a)*r*1.2,w:160,h:14,d:120,s:50+Rc()*40,n:6});}
 for(let i=0;i<14;i++){const a=Rc()*Math.PI*2,r=400+Rc()*400;ctx.clouds.push({x:Math.cos(a)*r,y:60+Rc()*150,z:Math.sin(a)*r,w:120,h:20,d:60,s:40+Rc()*30,n:6});}
 return Cs;}

function buildPass(ctx){const def=ctx.def,W=ctx.W,n=makeNoise(def.seed),P=def.P,cf=castleField(def);
 const xc=z=>11*Math.sin(z/26)*sstep(66,34,Math.abs(z));const hw=z=>lerp(19,33,sstep(30,58,Math.abs(z)));
 const nat=(x,z)=>{const d=Math.abs(x-xc(z))-hw(z);let h=n.fbm(x/22,z/22,3)*.9+.4;if(d>0)h+=d*1.15+d*d*.03+n.fbm(x/9,z/9,3)*4*sstep(0,8,d);h+=sstep(94,108,Math.abs(z))*10;
  const le=Math.hypot(x/14,z/9.5);if(le<1)h=lerp(h,-.35,sstep(1,.8,le));return Math.min(h,46);};
 W.setTerrain((x,z)=>cf(x,z,nat(x,z)));W.ice={x:0,z:0,rx:14,rz:9.5};
 const Cs=[castle(ctx,0,0,-def.cz,1,P),castle(ctx,1,0,def.cz,-1,P)];
 // ruined watchtowers flanking the lake + rock outcrops + log barriers (point-symmetric)
 for(const f of[1,-1]){const S=(x0,y0,z0,x1,y1,z1,m='stone',o)=>box(ctx,f>0?x0:-x1,y0,f>0?z0:-z1,f>0?x1:-x0,y1,f>0?z1:-z0,m,o);const g=(x,z)=>W.terrain(x*f,z*f);
  {const x=-16,z=-14,y=g(x,z)-.3;S(x-2.6,y,z-2.6,x+2.6,y+7,z+2.6);S(x-2.9,y+7,z-2.9,x+2.9,y+7.3,z+2.9,'wood',{nav:true});
   for(const[a,b]of[[-2.9,-2.9],[2.9,-2.9],[-2.9,2.9],[2.9,2.9]])S(x+a-.3,y+7.3,z+b-.3,x+a+.3,y+8.4,z+b+.3);S(x-2.9,y+7.3,z-2.9,x+2.9,y+8,z-2.6);S(x-2.9,y+7.3,z+2.6,x-.8,y+8,z+2.9);
   ladder(ctx,(x+2.6)*f,z*f,f,0,y,y+7.3,[x*f,y+7.3,z*f]);ctx.nav.paths.push([[x*f,y+7.3,z*f],[(x-1.5)*f,y+7.3,(z+1.2)*f]]);}
  {const y=g(6,-24)-.4;S(2,y,-25,10,y+1.3,-23.6,'wood');}
  {const y=g(-4,-44)-.4;S(-9,y,-45,-1,y+1.3,-43.6,'wood');}
  {const y=g(14,-46)-.5;S(12,y,-48,17,y+2.8,-44);}
  for(const[x,z,t,r]of[[-8,-30,'barrel',0],[-7.2,-30.6,'barrel',0],[18,-30,'crate',.3],[-22,-50,'cart',.4],[3,-56,'crate',.6]]){const y=g(x,z);prop(ctx,t,{x:x*f,y:y-.05,z:z*f,ry:r});const Rr=t==='cart'?1.3:t==='barrel'?.42:.55;box(ctx,x*f-Rr,y,z*f-Rr,x*f+Rr,y+(t==='cart'?1.5:1.1),z*f+Rr,null,{vis:false});}}
 const R=ctx.rnd,pines=[],rocks=[];
 for(let i=0;i<420;i++){const x=(R()-.5)*114,z=(R()-.5)*204;const y=W.terrain(x,z);const d=Math.abs(x-xc(z))-hw(z);let ok=true;for(const f of[1,-1]){const u=x*f,v=(z+f*def.cz)*f;if(Math.abs(u)<34&&v>-30&&v<34)ok=false;}if(!ok)continue;if(Math.hypot(x/16,z/12)<1)continue;
  if(d<-6&&R()<.8)continue;if(d>10&&R()<.3)continue;const s=.8+R()*.7;if(R()<.75)pines.push({x,y:y-.2,z,s,ry:R()*6});else rocks.push({x,y:y-.3,z,s:.8+R()*1.6,ry:R()*6});}
 for(const t of pines)box(ctx,t.x-.25*t.s,t.y,t.z-.25*t.s,t.x+.25*t.s,t.y+2.4*t.s,t.z+.25*t.s,null,{vis:false,walk:false});
 for(const r of rocks)box(ctx,r.x-.7*r.s,r.y-1,r.z-.7*r.s,r.x+.7*r.s,r.y+.75*r.s,r.z+.7*r.s,null,{vis:false});
 Object.assign(ctx.props,{snowpine:pines,snowrock:rocks});
 ctx.colorAt=(c,x,z,h,sl,nn)=>{const v=nn(x/7,z/7)*.5+nn(x/2,z/2)*.25;c.setRGB(.86+v*.06,.9+v*.05,.96+v*.03);
  if(sl>.62)c.lerp(new C(.36,.37,.4),sstep(.62,1.05,sl));if(Math.hypot(x/14,z/9.5)<1.05)c.setRGB(.62,.76,.86);
  for(const f of[1,-1]){const u=x*f,v=(z+f*def.cz)*f;if(Math.abs(u)<26&&v>-24&&v<23&&h>P-.4)c.lerp(new C(.62,.62,.64),.45);if(Math.abs(u)<3.5&&v>16&&v<60)c.lerp(new C(.7,.68,.66),.4);}};
 ctx.clouds=[];const Rc=rng(5);for(let i=0;i<24;i++){const a=Rc()*Math.PI*2,r=320+Rc()*500;ctx.clouds.push({x:Math.cos(a)*r,y:90+Rc()*80,z:Math.sin(a)*r,w:180,h:30,d:90,s:50+Rc()*40,n:8});}
 // ice sheet
 ctx.ice=true;return Cs;}

/* ================= assemble ================= */
export function buildMap(idx,R,T){const def=MAPS[idx];const W=new World(def.b);W.res=1.5;const ctx=Ctx(W,T,def);const group=new THREE.Group();const U={value:0};
 const Cs=[buildVale,buildSpire,buildPass][idx](ctx);const M=ctx.M;
 // terrain
 const tm=terrainMesh(ctx,ctx.colorAt);group.add(tm);
 // island undersides
 if(ctx.islands){const nz=makeNoise(91),b=new Batch();for(const I of ctx.islands){const N=30,rings=6,depth=I.r*(I.c?.95:1.1);const pos=[];
   for(let k=0;k<=rings;k++)for(let a=0;a<N;a++){const ang=a/N*Math.PI*2;let rr=I.r*.3,lo=0,hi=I.r*1.3;for(let s=0;s<14;s++){const m=(lo+hi)/2;if(W.terrain(I.x+Math.cos(ang)*m,I.z+Math.sin(ang)*m)>-1e8)lo=m;else hi=m;}rr=lo;
    const t=k/rings,rad=rr*(1-Math.pow(t,.9)*.96)*(1+(k>0?nz(a*.7,k*1.3)*.12:0)),y=(k===0?W.terrain(I.x+Math.cos(ang)*rr*.98,I.z+Math.sin(ang)*rr*.98)-.3:I.h-1.5-depth*Math.pow(t,1.25))+(k>0&&k<rings?nz(a*.9+5,k)*1.5:0);
    pos.push(I.x+Math.cos(ang)*rad,y,I.z+Math.sin(ang)*rad);}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const idx2=[];for(let k=0;k<rings;k++)for(let a=0;a<N;a++){const i0=k*N+a,i1=k*N+(a+1)%N,i2=(k+1)*N+a,i3=(k+1)*N+(a+1)%N;idx2.push(i0,i1,i2,i1,i3,i2);}g.setIndex(idx2);g.computeVertexNormals();
   const col=[];for(let i=0;i<pos.length/3;i++){const k=Math.floor(i/N)/rings;const v=nz(i*.37,3)*.06;col.push(k<.12?.36:.46-k*.12+v,k<.12?.5:.4-k*.12+v,k<.12?.22:.33-k*.1+v);}g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(pos.length/3*2).fill(0),2));
   b.add(g,new THREE.Matrix4());}
  const um=new THREE.Mesh(b.build(),M.vc);um.castShadow=true;um.receiveShadow=true;group.add(um);}
 // castle batches
 const sm=new THREE.MeshStandardMaterial({map:T.stone,normalMap:T.stoneN,normalScale:new THREE.Vector2(1.2,1.2),vertexColors:true,roughness:.92,color:def.stone});
 const tmM=new THREE.MeshStandardMaterial({map:T.stone,normalMap:T.stoneN,vertexColors:true,roughness:.95,color:def.trim});
 const fl=new THREE.MeshStandardMaterial({map:T.stone,normalMap:T.stoneN,vertexColors:true,roughness:.95,color:new C(def.trim).multiplyScalar(.9)});
 const add=(bat,mat,sh=true)=>{if(bat.empty)return null;const m=new THREE.Mesh(bat.build(),mat);m.castShadow=sh;m.receiveShadow=true;group.add(m);return m;};
 add(ctx.bat.stone,sm);add(ctx.bat.trim,tmM);add(ctx.bat.wood,M.wood);add(ctx.bat.roof0,M.roof[0]);add(ctx.bat.roof1,M.roof[1]);add(ctx.bat.iron,M.iron);add(ctx.bat.snow,M.snow);add(ctx.bat.floor,fl,false);
 // props
 const G=propGeos();for(const k in ctx.props){const big=['oak','pine','snowpine','catapult','cart','floatrock'].includes(k);inst(group,G[k],k==='grass'||k==='flower'?M.leaf:M.vc,ctx.props[k],k!=='grass'&&k!=='flower',true);}
 for(const w of ctx.wind)group.add(w);
 // banners + keep standards
 const bm=[0,1].map(t=>clothMat({map:bannerTex(t),transparent:true,alphaTest:.5},U,true)),fm=[0,1].map(t=>clothMat({map:bannerTex(t)},U,false));
 for(const b of ctx.banners){const g=new THREE.PlaneGeometry(b.w,b.h,4,10);const m=new THREE.Mesh(g,bm[b.team]);m.position.set(...b.p);m.rotation.y=b.ry;m.castShadow=true;group.add(m);
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,b.w+.4,6).rotateZ(Math.PI/2),M.iron);rod.position.set(b.p[0],b.p[1]+b.h/2,b.p[2]);rod.rotation.y=b.ry;group.add(rod);}
 for(const f of ctx.flagpoles){const g=new THREE.PlaneGeometry(f.w,f.h,10,4);g.translate(f.w/2,-f.h/2,0);const m=new THREE.Mesh(g,fm[f.team]);m.position.set(...f.p);m.rotation.y=f.ry;m.castShadow=true;group.add(m);}
 // water
 const waters=[];if(def.id==='vale'){const wm=makeWaterMat(T,def.water);for(const w of W.waters){const g=new THREE.PlaneGeometry(w.x1-w.x0,w.z1-w.z0).rotateX(-Math.PI/2);const m=new THREE.Mesh(g,wm);m.position.set((w.x0+w.x1)/2,w.y,(w.z0+w.z1)/2);m.receiveShadow=true;group.add(m);}waters.push(wm);}
 if(ctx.ice){const g=new THREE.CircleGeometry(1,48).rotateX(-Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xbfe0f0,roughness:.12,metalness:.15,transparent:true,opacity:.86}));m.scale.set(14.4,1,9.9);m.position.set(0,-.3,0);m.receiveShadow=true;group.add(m);}
 // sky, clouds, light
 const sky=makeSky(def.sky);group.add(sky);const clouds=makeClouds(T.puff,ctx.clouds,0xffffff,def.id==='pass'?0xa8b2c0:0xb8c4dc);group.add(clouds);
 const env=makeEnv(R,def.sky);
 // nav
 const nav=new Nav(W);nav.build(ctx.nav);
 return{def,W,nav,group,U,sky,clouds,env,waters,wind:ctx.wind,spawns:ctx.spawns,homes:ctx.homes,supply:ctx.supply,castles:Cs,
  update(t,dt,cam){U.value=t;clouds.userData.U.uTime.value=t;sky.position.copy(cam.position);for(const w of waters){w.userData.n.offset.set(t*.012,t*.02);}for(const w of ctx.wind)w.rotation.x+=dt*.6;}};}
