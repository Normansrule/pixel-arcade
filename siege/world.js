// FORTRESS BREACH — scene construction. Static geometry is lit by BAKED lamp light (per-vertex, ray-traced through the
// level so furniture and walls cast real shadows); destructible walls are rebuilt per chunk from their cell grids;
// night sky, rain, wet ground, streetlights, lightning.
import * as THREE from '../vendor/three.module.min.js';
import {CELL,FH,SLAB_B,ROOF,PH,BX0,BX1,BZ0,BZ1,OX0,OX1,OZ0,OZ1,ROOMS} from './level.js';
import {labelTex} from './tex.js';
const V=THREE.Vector3;
export const BAKE_U={value:1};
/* ---------- materials: baked irradiance (attribute "bake") replaces point lights on static surfaces ---------- */
export function bakeMat(o){const m=new THREE.MeshStandardMaterial(o);m.onBeforeCompile=s=>{s.uniforms.uBake=BAKE_U;
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 bake;varying vec3 vBake;').replace('#include <begin_vertex>','#include <begin_vertex>\nvBake=bake;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vBake;uniform float uBake;')
   .replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )','#if 0'))
   .replace('#include <lights_fragment_maps>','#include <lights_fragment_maps>\n irradiance+=vBake*uBake;');};m.customProgramCacheKey=()=>'bake1';return m;}
/* ---------- geometry builder ---------- */
class GB{constructor(){this.p=[];this.n=[];this.uv=[];this.c=[];this.b=[];this.i=[];}
 v(x,y,z,nx,ny,nz,u,w,c,b){this.p.push(x,y,z);this.n.push(nx,ny,nz);this.uv.push(u,w);this.c.push(c[0],c[1],c[2]);this.b.push(b[0],b[1],b[2]);return this.p.length/3-1;}
 // quad from 4 corners (any winding); n = desired normal; uvf(p)->[u,v]; col; bk(p,n)->[r,g,b]
 quad(P,n,uvf,col,bk){const[a,b,c]=P;const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
  const Q=cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0?[P[3],P[2],P[1],P[0]]:P;const k=this.p.length/3;for(const p of Q){const t=uvf(p);this.v(p[0],p[1],p[2],n[0],n[1],n[2],t[0],t[1],typeof col==='function'?col(p):col,bk?bk(p,n):[0,0,0]);}this.i.push(k,k+1,k+2,k,k+2,k+3);}
 // axis-aligned box faces (skip: set of 'px','nx','py','ny','pz','nz')
 box(x0,y0,z0,x1,y1,z1,col,bk,o={}){const s=o.s||1,sk=o.skip||'';const F=[['px',[1,0,0],[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],p=>[p[2]/s,p[1]/s]],['nx',[-1,0,0],[[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1]],p=>[p[2]/s,p[1]/s]],
  ['py',[0,1,0],[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],p=>[p[0]/s,p[2]/s]],['ny',[0,-1,0],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],p=>[p[0]/s,p[2]/s]],
  ['pz',[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],p=>[p[0]/s,p[1]/s]],['nz',[0,0,-1],[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],p=>[p[0]/s,p[1]/s]]];
  for(const[k,n,P,uv]of F)if(!sk.includes(k))this.quad(P,n,uv,typeof col==='function'?(p=>col(p,n)):col,bk);}
 // generic transformed geometry (three BufferGeometry), single colour
 add(g,m,col,bk){const G=g.index?g.toNonIndexed():g;const P=G.attributes.position,N=G.attributes.normal,U=G.attributes.uv;const v=new V(),n=new V(),nm=new THREE.Matrix3().getNormalMatrix(m);const k=this.p.length/3;
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m);n.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();this.v(v.x,v.y,v.z,n.x,n.y,n.z,U?U.getX(i):0,U?U.getY(i):0,col,bk?bk([v.x,v.y,v.z],[n.x,n.y,n.z]):[0,0,0]);this.i.push(k+i);}}
 geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setAttribute('bake',new THREE.Float32BufferAttribute(this.b,3));g.setIndex(this.i);g.computeBoundingSphere();return g;}
 get empty(){return!this.i.length;}}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const lin=h=>{const c=new THREE.Color(h);return[c.r,c.g,c.b];};
const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

/* ================================================================== lamps + baking */
function makeLamps(){const L=[];const add=(x,y,z,col,I,R,o={})=>L.push({x,y,z,col:lin(col),I,R,...o});
 for(const r of ROOMS){const[x0,x1,z0,z1]=r.r,base=r.f*FH,y=base+(r.f?ROOF-FH:SLAB_B)-.22;const col=r.id==='vault'?0xd8ecff:r.id==='server'?0xa8c8ff:r.id==='bath'||r.id==='kitchen'?0xfff2dc:0xffc488;const I=r.id==='vault'?7:r.id==='server'?5.5:6.5;
  const w=x1-x0,d=z1-z0;if(w*d>44){if(w>=d){add(x0+w*.28,y,(z0+z1)/2,col,I,8.5,{room:r.id});add(x0+w*.72,y,(z0+z1)/2,col,I,8.5,{room:r.id});}else{add((x0+x1)/2,y,z0+d*.28,col,I,8.5,{room:r.id});add((x0+x1)/2,y,z0+d*.72,col,I,8.5,{room:r.id});}}
  else add(r.id==='hall'?-1:(x0+x1)/2,y,(z0+z1)/2,col,I,8.5,{room:r.id,flick:r.id==='hall'||r.id==='landing'});}
 // exterior: sodium streetlights, porch lamps, garden + alley lights
 for(const x of[-20,-4,12,27])add(x,5.6,14.7,0xffa050,28,19,{street:1});
 add(-.4,2.55,8.55,0xffc890,6,9,{porch:1});add(8.6,2.55,-8.55,0xffc890,6,9,{porch:1});add(12.6,5.65,-3,0xffc890,5,8,{porch:1});
 add(-10,1.1,-12.5,0xb8d4ff,5,9,{post:1});add(10,1.1,-12.5,0xb8d4ff,5,9,{post:1});add(-20.5,3.6,0,0xd0e0ff,9,12,{wall:1});add(21.4,2.9,-6,0xffd0a0,8,11,{wall:1});
 return L;}
function bakeAt(L,lamps,x,y,z,nx,ny,nz,skip,amb=[.026,.03,.042]){const o=[amb[0],amb[1],amb[2]];
 for(const l of lamps){const dx=l.x-x,dy=l.y-y,dz=l.z-z,d2=dx*dx+dy*dy+dz*dz;if(d2>l.R*l.R)continue;const d=Math.sqrt(d2);const ndl=(dx*nx+dy*ny+dz*nz)/d;const fall=l.I/(1+d2*.55)*ss(l.R,l.R*.55,d);
  // bounce fill (unshadowed, weak) + direct (shadowed)
  const fill=fall*.075*(.6+.4*Math.max(0,ndl));o[0]+=l.col[0]*fill;o[1]+=l.col[1]*fill;o[2]+=l.col[2]*fill;if(ndl<=0)continue;
  const ox=x+nx*.04,oy=y+ny*.04,oz=z+nz*.04;if(!L.los(ox,oy,oz,l.x,l.y,l.z,skip))continue;const k=fall*ndl;o[0]+=l.col[0]*k;o[1]+=l.col[1]*k;o[2]+=l.col[2]*k;}
 return o;}

/* ================================================================== world */
export function buildWorld(L,TX,R){const group=new THREE.Group();const lamps=makeLamps();
 const bk=(skip)=>(p,n)=>bakeAt(L,lamps,p[0],p[1],p[2],n[0],n[1],n[2],skip);
 const MAT={
  plaster:bakeMat({map:TX.plaster.map,normalMap:TX.plaster.normalMap,roughnessMap:TX.plaster.roughnessMap,roughness:.92,vertexColors:true,envMapIntensity:.25}),
  brick:bakeMat({map:TX.brick.map,normalMap:TX.brick.normalMap,roughness:.78,vertexColors:true,envMapIntensity:.6}),
  metal:bakeMat({map:TX.metal.map,normalMap:TX.metal.normalMap,roughnessMap:TX.metal.roughnessMap,roughness:.5,metalness:.6,vertexColors:true,envMapIntensity:.6}),
  planks:bakeMat({map:TX.planks.map,normalMap:TX.planks.normalMap,roughness:.8,vertexColors:true,envMapIntensity:.2}),
  concrete:bakeMat({map:TX.concrete.map,normalMap:TX.concrete.normalMap,roughness:.9,vertexColors:true,envMapIntensity:.3}),
  wood:bakeMat({map:TX.wood.map,normalMap:TX.wood.normalMap,roughnessMap:TX.wood.roughnessMap,roughness:.55,vertexColors:true,envMapIntensity:.45}),
  tile:bakeMat({map:TX.tile.map,normalMap:TX.tile.normalMap,roughness:.25,vertexColors:true,envMapIntensity:.6}),
  carpet:bakeMat({map:TX.carpet.map,normalMap:TX.carpet.normalMap,roughness:1,vertexColors:true,envMapIntensity:.1}),
  server:bakeMat({map:TX.server.map,normalMap:TX.server.normalMap,roughness:.45,metalness:.3,vertexColors:true,envMapIntensity:.5}),
  grass:bakeMat({map:TX.grass.map,normalMap:TX.grass.normalMap,roughness:.75,vertexColors:true,envMapIntensity:.5}),
  asphalt:bakeMat({map:TX.asphalt.map,normalMap:TX.asphalt.normalMap,roughnessMap:TX.asphalt.roughnessMap,roughness:.55,vertexColors:true,envMapIntensity:1.6}),
  paving:bakeMat({map:TX.paving.map,normalMap:TX.paving.normalMap,roughnessMap:TX.paving.roughnessMap,roughness:.5,vertexColors:true,envMapIntensity:1.2}),
  roof:bakeMat({map:TX.roof.map,normalMap:TX.roof.normalMap,roughness:.45,vertexColors:true,envMapIntensity:1.2}),
  hedge:bakeMat({map:TX.hedge.map,normalMap:TX.hedge.normalMap,roughness:.9,vertexColors:true,envMapIntensity:.3}),
  bark:bakeMat({map:TX.bark.map,normalMap:TX.bark.normalMap,roughness:.95,vertexColors:true}),
  fabric:bakeMat({map:TX.fabric.map,normalMap:TX.fabric.normalMap,roughness:.95,vertexColors:true,envMapIntensity:.1}),
  paint:bakeMat({roughness:.35,metalness:.5,vertexColors:true,envMapIntensity:1.3}),
  steel:bakeMat({roughness:.35,metalness:.85,vertexColors:true,envMapIntensity:1}),
  dark:bakeMat({roughness:.6,metalness:.2,vertexColors:true,envMapIntensity:.4}),
  glass:new THREE.MeshStandardMaterial({color:0x101820,roughness:.05,metalness:.9,transparent:true,opacity:.32,envMapIntensity:1.6,depthWrite:false}),
  lampOn:new THREE.MeshBasicMaterial({color:new THREE.Color(4,3.2,2.2),fog:true}),lampCold:new THREE.MeshBasicMaterial({color:new THREE.Color(3,3.6,4.4)}),lampSodium:new THREE.MeshBasicMaterial({color:new THREE.Color(5,2.6,1.1)}),
  led:new THREE.MeshBasicMaterial({vertexColors:true})};
 MAT.plaster.map.repeat.set(1,1);
 const meshes=[];const emit=(G,mat,o={})=>{if(G.empty)return null;const m=new THREE.Mesh(G.geo(),mat);m.receiveShadow=o.rs!==false;m.castShadow=!!o.cs;group.add(m);meshes.push(m);return m;};

 /* ---------- floors, ceilings, slab edges, stairs ---------- */
 const FL={wood:new GB(),tile:new GB(),carpet:new GB(),server:new GB(),concrete:new GB()};const CEIL=new GB(),EDGE=new GB(),STAIR=new GB(),ROOFG=new GB(),TRIM=new GB(),BRK=new GB(),CON=new GB();
 const white=[1,1,1];
 for(const r of ROOMS){const[x0,x1,z0,z1]=r.r,y=r.f*FH,G=FL[r.floor];const s=r.floor==='tile'?1.2:r.floor==='server'?.6:r.floor==='concrete'?3:r.floor==='wood'?2.2:2;
  const tint=r.floor==='wood'?[.8,.7,.62]:r.floor==='carpet'?(r.id==='bedroom'?[.75,.45,.42]:r.id==='study'?[.42,.5,.4]:[.45,.5,.6]):white;
  for(let z=z0;z<z1;z++)for(let x=x0;x<x1;x++){const cx=x+.5,cz=z+.5;if(r.f===1&&!L.slabSolid(cx,cz)&&L.slab(cx,cz)!==3)continue;if(r.f===1&&L.slab(cx,cz)===3)continue;
   G.quad([[x,y,z],[x+1,y,z],[x+1,y,z+1],[x,y,z+1]],[0,1,0],p=>[p[0]/s,p[2]/s],tint,bk());
   const cy=r.f?ROOF:SLAB_B;if(r.f===0&&(L.slab(cx,cz)===2||L.slab(cx,cz)===3))continue;CEIL.quad([[x,cy,z],[x+1,cy,z],[x+1,cy,z+1],[x,cy,z+1]],[0,-1,0],p=>[p[0]/1.5,p[2]/1.5],[.86,.84,.8],bk());}}
 // over the stairwell the ground-floor "ceiling" is the upper-floor ceiling
 for(let z=-3;z<3;z++)for(let x=2;x<4;x++)CEIL.quad([[x,ROOF,z],[x+1,ROOF,z],[x+1,ROOF,z+1],[x,ROOF,z+1]],[0,-1,0],p=>[p[0]/1.5,p[2]/1.5],[.86,.84,.8],bk());
 // slab edges around holes (stairwell + hatches) and the building band
 const holeEdge=(x0,z0,x1,z1)=>{for(const[a,b,n]of[[[x0,z0],[x1,z0],[0,0,1]],[[x0,z1],[x1,z1],[0,0,-1]],[[x0,z0],[x0,z1],[1,0,0]],[[x1,z0],[x1,z1],[-1,0,0]]])
  EDGE.quad([[a[0],SLAB_B,a[1]],[b[0],SLAB_B,b[1]],[b[0],FH,b[1]],[a[0],FH,a[1]]],n,p=>[(p[0]+p[2])/1.5,p[1]/1.5],[.8,.78,.74],bk());};
 holeEdge(2,-3,4,3);for(const h of L.hatches)holeEdge(h.x,h.z,h.x+1,h.z+1);
 // stair treads (visual steps over the ramp collision)
 for(const rp of L.ramps){const n=12,len=rp.z1-rp.z0;for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n;const za=rp.zA+(rp.zB-rp.zA)*t0,zb=rp.zA+(rp.zB-rp.zA)*t1;const h=rp.h0+(rp.h1-rp.h0)*t1;
   STAIR.box(rp.x0,h-.06-(rp.h1-rp.h0)/n,Math.min(za,zb),rp.x1,h,Math.max(za,zb),[.72,.6,.5],bk(),{s:1.4,skip:''});}}
 /* ---------- static boxes: pillars, hard walls, furniture, exterior props ---------- */
 const PROPS={wood:new GB(),fabric:new GB(),metal:new GB(),steel:new GB(),dark:new GB(),paint:new GB(),hedge:new GB(),bark:new GB(),concrete:new GB(),led:new GB(),white:new GB(),felt:new GB()};
 const outward=(p,n)=>!L.inFoot(p[0]+n[0]*.4,p[2]+n[2]*.4)&&L.inFoot(p[0]-n[0]*.4,p[2]-n[2]*.4);
 for(const b of L.boxes){if(!b.vis)continue;const k=b.kind;
  if(k==='pillar'||k==='wall'){// brick on outside faces, plaster/concrete inside
   const inside=b.mat==='hard'&&k==='wall'?CON:null;const sides=[['px',[1,0,0]],['nx',[-1,0,0]],['pz',[0,0,1]],['nz',[0,0,-1]]];
   for(const[f,n]of sides){const px=n[0]>0?b.x1:n[0]<0?b.x0:(b.x0+b.x1)/2,pz=n[2]>0?b.z1:n[2]<0?b.z0:(b.z0+b.z1)/2;const out=outward([px,0,pz],n);
    const G=out?BRK:(inside||PROPS.white);const sk='pxnxpynypznz'.replace(f,'').match(/../g).join('');G.box(b.x0,b.y0,b.z0,b.x1,b.y1,b.z1,out?[.9,.9,.9]:inside?[.75,.76,.78]:[.82,.8,.76],bk(),{s:out?2:1.5,skip:sk});}continue;}
  if(k==='prop'||k==='ext'||k==='rail'||k==='stringer'||k==='balcony'||k==='post')propMesh(b,PROPS,bk(new Set([b])));}
 // window + door trims, glass panes
 const glass=[];
 for(const op of L.openings){const ax=op.axis==='x',c=op.c,th=op.panel.th/2+.02,w=.07;const ext=op.panel.kind==='ext';const col=[.32,.22,.16];
  const B=(a0,a1,y0,y1)=>{if(ax){TRIM.box(a0,y0,c-th,a1,y1,c+th,col,bk(),{s:1});}else TRIM.box(c-th,y0,a0,c+th,y1,a1,col,bk(),{s:1});};
  if(op.kind!=='A'){B(op.a-w,op.a,op.y0,op.y1+w);B(op.b,op.b+w,op.y0,op.y1+w);B(op.a-w,op.b+w,op.y1,op.y1+w);if(op.kind==='w')B(op.a-w,op.b+w,op.y0-w,op.y0);}
  if(op.kind==='w'){const gm=new THREE.Mesh(new THREE.PlaneGeometry(op.b-op.a,op.y1-op.y0),MAT.glass);gm.position.set(ax?(op.a+op.b)/2:c,(op.y0+op.y1)/2,ax?c:(op.a+op.b)/2);if(!ax)gm.rotation.y=Math.PI/2;gm.renderOrder=2;group.add(gm);glass.push({op,mesh:gm,broken:false});}}
 /* ---------- exterior ground ---------- */
 const GR={grass:new GB(),asphalt:new GB(),paving:new GB()};
 const zone=(x,z)=>z>16?'asphalt':(z>13.4&&z<16)||(x>-2&&x<2&&z>8&&z<13.4)||(x>12&&x<26&&z>-4&&z<9)||(x>8&&x<10&&z<-8&&z>-14)||(L.inFoot(x,z))?'paving':'grass';
 for(let z=OZ0;z<OZ1;){const fine=z>-16&&z<18;const dz=fine?1:2;for(let x=OX0;x<OX1;){const fx=fine&&x>-22&&x<24;const dx=fx?1:2;const cx=x+dx/2,cz=z+dz/2;
   if(!(cx>BX0&&cx<BX1&&cz>BZ0&&cz<BZ1)){const zk=zone(cx,cz);const s=zk==='asphalt'?5:zk==='paving'?2:3;const t=zk==='grass'?[.9,1,.9]:white;
    GR[zk].quad([[x,0,z],[x+dx,0,z],[x+dx,0,z+dz],[x,0,z+dz]],[0,1,0],p=>[p[0]/s,p[2]/s],t,bk());}x+=dx;}z+=dz;}
 // curbs + road markings
 PROPS.concrete.box(OX0,0,15.85,OX1,.14,16.1,[.7,.7,.7],bk(),{s:2});for(let x=-30;x<30;x+=6)PROPS.white.box(x,0,21.05,x+3,.012,21.2,[.8,.75,.5],bk(),{skip:'ny'});
 // foundation plinth + slab band between floors + eaves
 for(const[x0,z0,x1,z1]of[[BX0-.2,BZ0-.2,BX1+.2,BZ0+.02],[BX0-.2,BZ1-.02,BX1+.2,BZ1+.2],[BX0-.2,BZ0,BX0+.02,BZ1],[BX1-.02,BZ0,BX1+.2,BZ1]]){CON.box(x0,0,z0,x1,.32,z1,[.5,.5,.52],bk(),{s:2});CON.box(x0,FH-.3,z0,x1,FH,z1,[.62,.6,.58],bk(),{s:2});}
 /* ---------- roof: gable along x ---------- */
 {const e=.6,y0=ROOF+.25,yr=9.2,x0=BX0-e,x1=BX1+e,z0=BZ0-e,z1=BZ1+e,zc=0;const rc=[.8,.82,.9];
  ROOFG.quad([[x0,y0,z0],[x1,y0,z0],[x1,yr,zc],[x0,yr,zc]],[0,.8,-.6],p=>[p[0]/2,p[2]/2+p[1]],rc,bk());ROOFG.quad([[x0,y0,z1],[x1,y0,z1],[x1,yr,zc],[x0,yr,zc]],[0,.8,.6],p=>[p[0]/2,-p[2]/2+p[1]],rc,bk());
  for(const[x,n]of[[BX0,-1],[BX1,1]])BRK.quad([[x,ROOF,BZ0],[x,ROOF,BZ1],[x,yr-.4,0],[x,yr-.4,0]],[n,0,0],p=>[p[2]/2,p[1]/2],[.9,.9,.9],bk());
  CON.box(BX0-.25,ROOF+.02,BZ0-.25,BX1+.25,ROOF+.32,BZ1+.25,[.3,.3,.32],bk(),{s:2,skip:'ny'});CON.box(-7,7,-2.6,-5.6,10.4,-1.2,[.55,.45,.4],bk(),{s:1});}
 emit(FL.wood,MAT.wood);emit(FL.tile,MAT.tile);emit(FL.carpet,MAT.carpet);emit(FL.server,MAT.server);emit(FL.concrete,MAT.concrete);emit(CEIL,MAT.plaster);emit(EDGE,MAT.concrete);
 emit(STAIR,MAT.wood,{cs:true});emit(ROOFG,MAT.roof,{cs:true});emit(TRIM,MAT.wood);emit(BRK,MAT.brick,{cs:true});emit(CON,MAT.concrete,{cs:true});
 emit(GR.grass,MAT.grass);emit(GR.asphalt,MAT.asphalt);emit(GR.paving,MAT.paving);
 emit(PROPS.wood,MAT.wood,{cs:true});emit(PROPS.fabric,MAT.fabric,{cs:true});emit(PROPS.metal,MAT.metal,{cs:true});emit(PROPS.steel,MAT.steel,{cs:true});emit(PROPS.dark,MAT.dark,{cs:true});emit(PROPS.paint,MAT.paint,{cs:true});
 emit(PROPS.hedge,MAT.hedge,{cs:true});emit(PROPS.bark,MAT.bark,{cs:true});emit(PROPS.concrete,MAT.concrete,{cs:true});emit(PROPS.led,MAT.led,{rs:false});emit(PROPS.white,MAT.plaster,{cs:true});
 const felt=bakeMat({color:0x1f6a3a,roughness:.95,vertexColors:true});emit(PROPS.felt,felt);
 /* ---------- lamp fixtures + light cones ---------- */
 const fix=new THREE.Group();group.add(fix);const coneMat=new THREE.ShaderMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,uniforms:{col:{value:new THREE.Color(1,.6,.3)}},
  vertexShader:'varying vec2 vU;varying vec3 vN,vV;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform vec3 col;varying vec2 vU;varying vec3 vN,vV;void main(){float f=abs(dot(vN,vV));float a=.075*pow(vU.y,1.6)*f*f;gl_FragColor=vec4(col*a,1.);}'});
 for(const l of lamps){if(l.street){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,5.8,8),MAT.steel);pole.position.set(l.x,2.9,l.z+.6);pole.geometry.setAttribute('bake',new THREE.Float32BufferAttribute(new Float32Array(pole.geometry.attributes.position.count*3).fill(.05),3));pole.castShadow=true;fix.add(pole);
   const arm=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.8),MAT.steel);arm.position.set(l.x,5.75,l.z+.25);fix.add(arm);const head=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.3),MAT.lampSodium);head.position.set(l.x,5.62,l.z);fix.add(head);
   const cone=new THREE.Mesh(new THREE.ConeGeometry(3.4,5.5,20,1,true),coneMat);cone.position.set(l.x,2.85,l.z);fix.add(cone);}
  else{const g=l.porch||l.wall?new THREE.BoxGeometry(.22,.28,.22):l.post?new THREE.CylinderGeometry(.12,.12,.3,10):new THREE.CylinderGeometry(.32,.38,.06,18);const m=new THREE.Mesh(g,l.room==='vault'||l.room==='server'||l.post||l.wall&&l.x<0?MAT.lampCold:MAT.lampOn);m.position.set(l.x,l.y+(l.post||l.porch||l.wall?0:.17),l.z);fix.add(m);l.mesh=m;
   if(l.post){const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,1,8),MAT.steel);p.position.set(l.x,.5,l.z);p.geometry.setAttribute('bake',new THREE.Float32BufferAttribute(new Float32Array(p.geometry.attributes.position.count*3).fill(.04),3));fix.add(p);}}}
 /* ---------- destructible panels: chunked meshes rebuilt from cell grids ---------- */
 const PMAT=[MAT.plaster,MAT.brick,MAT.metal,MAT.planks];
 // per-panel per-side baked light grid (every 2 cells)
 for(const pn of L.panels){const gx=Math.ceil(pn.cols/2)+1,gy=Math.ceil(pn.rows/2)+1;pn.bg=[];const ax=pn.axis==='x';const skip=new Set([pn]);
  for(const s of[-1,1]){const arr=new Float32Array(gx*gy*3);const n=ax?[0,0,s]:[s,0,0];for(let j=0;j<gy;j++)for(let i=0;i<gx;i++){const u=Math.min(pn.u1,pn.u0+i*CELL*2),y=Math.min(pn.top,pn.y0+j*CELL*2);const p=pn.world(u,y,s);
    const v=bakeAt(L,lamps,p.x,p.y,p.z,n[0],n[1],n[2],skip);arr.set(v,(j*gx+i)*3);}pn.bg.push(arr);}pn.gx=gx;pn.gy=gy;
  // side info: tint + material
  pn.side=[-1,1].map(s=>{const n=ax?[0,0,s]:[s,0,0];const mu=(pn.u0+pn.u1)/2,p=pn.world(mu,pn.y0+1,s);const out=!L.inFoot(p.x+n[0]*.3,p.z+n[2]*.3);const rm=L.roomAt(p.x+n[0]*.3,p.z+n[2]*.3,pn.y0+.5);
   return{out,tint:out?[.9,.9,.9]:rm?rm.tint.map(v=>.55+v*.6):[.8,.78,.74],mat:pn.kind==='bar'?3:out?1:0};});}
 const bakeLook=(pn,si,u,y)=>{const g=pn.bg[si],gx=pn.gx,fx=Math.max(0,Math.min(pn.gx-1.001,(u-pn.u0)/(CELL*2))),fy=Math.max(0,Math.min(pn.gy-1.001,(y-pn.y0)/(CELL*2)));const i=fx|0,j=fy|0,tx=fx-i,ty=fy-j;const o=[0,0,0];
  for(let c=0;c<3;c++){const a=g[(j*gx+i)*3+c],b=g[(j*gx+i+1)*3+c],d=g[((j+1)*gx+i)*3+c],e=g[((j+1)*gx+i+1)*3+c];o[c]=(a*(1-tx)+b*tx)*(1-ty)+(d*(1-tx)+e*tx)*ty;}return o;};
 const chunks=new Map();const chunkKey=pn=>{const ax=pn.axis==='x';const mu=(pn.u0+pn.u1)/2;const x=ax?mu:pn.c,z=ax?pn.c:mu;return pn.f+':'+(x<-4.01?0:x<4.01?1:2)+':'+(z<0?0:1);};
 for(const pn of L.panels){const k=chunkKey(pn);if(!chunks.has(k))chunks.set(k,{panels:[],mesh:null,ver:-1,ext:false});const c=chunks.get(k);c.panels.push(pn);if(pn.kind==='ext')c.ext=true;pn.chunk=c;pn.seen=-1;}
 function panelGeo(pn,G){const ax=pn.axis==='x',C=pn.cols,Rw=pn.rows,ht=pn.th/2;const P=(u,y,s)=>ax?[u,y,pn.c+s*ht]:[pn.c+s*ht,y,u];
  // greedy rectangles of solid cells (baseboard row kept separate)
  const used=new Uint8Array(C*Rw);const rects=[];
  for(let r=0;r<Rw;r++)for(let c=0;c<C;c++){if(used[r*C+c]||!pn.cells[r*C+c])continue;let w=1;while(c+w<C&&pn.cells[r*C+c+w]&&!used[r*C+c+w])w++;let h=1;
   if(r>0||pn.kind!=='soft')outer:while(r+h<Rw){for(let i=0;i<w;i++)if(!pn.cells[(r+h)*C+c+i]||used[(r+h)*C+c+i])break outer;h++;}
   for(let j=0;j<h;j++)for(let i=0;i<w;i++)used[(r+j)*C+c+i]=1;rects.push([c,r,w,h]);}
  for(let si=0;si<2;si++){const s=si?1:-1,sd=pn.side[si];let mi=sd.mat;if(pn.rein&&pn.rside===s)mi=2;const g=G[mi];const n=ax?[0,0,s]:[s,0,0];const sc=mi===1?2:mi===2?1.2:mi===3?1.2:1.5;
   for(const[c,r,w,h]of rects){const ua=pn.u0+c*CELL,ub=pn.u0+(c+w)*CELL,ya=pn.y0+r*CELL,yb=pn.y0+(r+h)*CELL;const base=r===0&&pn.kind==='soft'&&mi===0;const col=base?[.3,.22,.17]:mi===0?sd.tint:[.9,.9,.9];
    g.quad([P(ua,ya,s),P(ub,ya,s),P(ub,yb,s),P(ua,yb,s)],n,p=>{const u=ax?p[0]:p[2];return[(ax?u*s:-u*s)/sc,p[1]/sc];},col,(p)=>bakeLook(pn,si,ax?p[0]:p[2],p[1]));}}
  // hole edges
  const emi=pn.rein?2:pn.kind==='bar'?3:0;const eg=G[emi];const ec=pn.kind==='soft'?[.95,.93,.88]:pn.kind==='ext'?[.62,.5,.4]:[.9,.9,.9];const bar=pn.kind==='bar';
  const eb=(u,y)=>{const a=bakeLook(pn,0,u,y),b=bakeLook(pn,1,u,y);return[(a[0]+b[0])*.4,(a[1]+b[1])*.4,(a[2]+b[2])*.4];};
  for(let r=0;r<Rw;r++)for(let c=0;c<C;c++){if(!pn.cells[r*C+c])continue;const ua=pn.u0+c*CELL,ub=ua+CELL,ya=pn.y0+r*CELL,yb=ya+CELL;
   const L_=c===0?bar:!pn.cells[r*C+c-1],R_=c===C-1?bar:!pn.cells[r*C+c+1],D_=r===0?bar:!pn.cells[(r-1)*C+c],U_=r===Rw-1?bar:!pn.cells[(r+1)*C+c];
   const ev=(u,y)=>eb(u,y);
   if(L_)eg.quad([P(ua,ya,-1),P(ua,ya,1),P(ua,yb,1),P(ua,yb,-1)],ax?[-1,0,0]:[0,0,-1],p=>[(p[0]+p[2])*2,p[1]*2],ec,p=>ev(ua,ya));
   if(R_)eg.quad([P(ub,ya,-1),P(ub,ya,1),P(ub,yb,1),P(ub,yb,-1)],ax?[1,0,0]:[0,0,1],p=>[(p[0]+p[2])*2,p[1]*2],ec,p=>ev(ub,ya));
   if(D_)eg.quad([P(ua,ya,-1),P(ub,ya,-1),P(ub,ya,1),P(ua,ya,1)],[0,-1,0],p=>[(p[0]+p[2])*2,p[1]*2],ec,p=>ev(ua,ya));
   if(U_)eg.quad([P(ua,yb,-1),P(ub,yb,-1),P(ub,yb,1),P(ua,yb,1)],[0,1,0],p=>[(p[0]+p[2])*2,p[1]*2],ec,p=>ev(ua,yb));}}
 function rebuildChunk(ch){const G=[new GB(),new GB(),new GB(),new GB()];for(const pn of ch.panels){pn.seen=pn.ver+(pn.active?0:1e6)+(pn.rein?5e5:0);if(pn.active)panelGeo(pn,G);}
  // merge material groups into one geometry with groups
  const all=new GB();const groups=[];for(let mi=0;mi<4;mi++){const g=G[mi];if(g.empty)continue;const vo=all.p.length/3,io=all.i.length;all.p.push(...g.p);all.n.push(...g.n);all.uv.push(...g.uv);all.c.push(...g.c);all.b.push(...g.b);for(const i of g.i)all.i.push(i+vo);groups.push([io,g.i.length,mi]);}
  if(ch.mesh){group.remove(ch.mesh);ch.mesh.geometry.dispose();ch.mesh=null;}if(all.empty)return;const geo=all.geo();for(const[s,c,m]of groups)geo.addGroup(s,c,m);
  const m=new THREE.Mesh(geo,PMAT);m.receiveShadow=true;m.castShadow=ch.ext;group.add(m);ch.mesh=m;}
 for(const ch of chunks.values())rebuildChunk(ch);
 /* ---------- hatches ---------- */
 const hatchMeshes=L.hatches.map(h=>{const g=new THREE.Group();const lid=new THREE.Mesh(new THREE.BoxGeometry(.98,.08,.98),bakeMat({map:TX.planks.map,normalMap:TX.planks.normalMap,roughness:.8}));lid.position.set(h.x+.5,FH-.05,h.z+.5);
  const rein=new THREE.Mesh(new THREE.BoxGeometry(1.0,.06,1.0),bakeMat({map:TX.metal.map,normalMap:TX.metal.normalMap,roughness:.45,metalness:.6}));rein.position.set(h.x+.5,FH-.02,h.z+.5);rein.visible=false;
  for(const m of[lid,rein]){const b=bakeAt(L,lamps,h.x+.5,FH+.1,h.z+.5,0,1,0,null);m.geometry.setAttribute('bake',new THREE.Float32BufferAttribute(new Float32Array(m.geometry.attributes.position.count*3).map((_,i)=>b[i%3]),3));m.receiveShadow=true;}
  g.add(lid,rein);group.add(g);return{h,lid,rein};});
 function syncHatches(){for(const m of hatchMeshes){m.lid.visible=m.h.state!=='open'&&!m.h.rein;m.rein.visible=m.h.state!=='open'&&m.h.rein;}}
 /* ---------- security cameras ---------- */
 const camMeshes=[];
 /* ---------- sky, skyline, moon ---------- */
 const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{time:{value:0},flash:{value:0}},
  vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform float time,flash;varying vec3 vD;float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
  float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
  void main(){vec3 d=normalize(vD);float h=d.y;vec3 top=vec3(.012,.016,.028),hor=vec3(.06,.06,.075);vec3 c=mix(hor,top,pow(clamp(h,0.,1.),.45));
   c+=vec3(.16,.09,.05)*pow(1.-clamp(h,0.,1.),8.)*.9; // city glow
   vec2 p=d.xz/(h+.15)*1.2+vec2(time*.012,time*.004);float n=fbm(p);c=mix(c,vec3(.05,.055,.07)+vec3(.05,.04,.03)*n,smoothstep(.35,.8,n)*smoothstep(0.,.25,h));
   vec3 md=normalize(vec3(-.4,.55,-.7));float m=max(dot(d,md),0.);c+=vec3(.5,.55,.65)*(pow(m,1800.)*3.+pow(m,40.)*.05)*(1.-smoothstep(.45,.75,n)*.85);
   c+=vec3(.55,.6,.8)*flash*(.6+.4*n)*smoothstep(-.1,.4,h);if(h<0.)c=hor*.6;gl_FragColor=vec4(c,1.);}`}));
 sky.renderOrder=-10;sky.frustumCulled=false;group.add(sky);
 // distant skyline with lit windows
 {const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');x.fillStyle='#07080b';x.fillRect(0,0,256,256);for(let j=0;j<32;j++)for(let i=0;i<16;i++){if(Math.random()<.22){x.fillStyle=Math.random()<.7?'#ffcf86':'#a8c6ff';x.globalAlpha=.4+Math.random()*.6;x.fillRect(i*16+4,j*8+2,8,4);}}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;const sm=new THREE.MeshBasicMaterial({map:t,color:0x9a9aa0,fog:false});
  const P=[],U=[],I=[];for(let i=0;i<46;i++){const a=i/46*Math.PI*2+Math.random()*.05,r=95+Math.random()*60,wd=10+Math.random()*16,h=14+Math.random()*48;const g=new THREE.BoxGeometry(wd,h,wd).toNonIndexed();g.applyMatrix4(M4(Math.cos(a)*r,h/2-1,Math.sin(a)*r,0,-a,0));
   const pa=g.attributes.position,ua=g.attributes.uv;const o=P.length/3;for(let k=0;k<pa.count;k++){P.push(pa.getX(k),pa.getY(k),pa.getZ(k));U.push(ua.getX(k)*wd/16,ua.getY(k)*h/16);I.push(o+k);}}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));sg.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));sg.setIndex(I);group.add(new THREE.Mesh(sg,sm));}
 /* ---------- lights ---------- */
 const moon=new THREE.DirectionalLight(0x9ab0e0,.85);moon.position.set(-24,46,-34);moon.castShadow=true;const sc=moon.shadow.camera;sc.left=-40;sc.right=40;sc.top=36;sc.bottom=-36;sc.near=5;sc.far=130;moon.shadow.mapSize.set(2048,2048);moon.shadow.bias=-.0006;moon.shadow.normalBias=.04;
 moon.target.position.set(0,0,0);group.add(moon,moon.target);
 const hemi=new THREE.HemisphereLight(0x4a5c80,0x14161a,.55);group.add(hemi);
 // dynamic point lights for characters/debris: follow the lamps nearest to the camera
 const dyn=[0,1,2,3,4].map(()=>{const l=new THREE.PointLight(0xffc080,0,9,1.6);group.add(l);return l;});
 /* ---------- rain ---------- */
 const RN=3600;const rg=new THREE.BufferGeometry();const rp=new Float32Array(RN*2*3),rs=new Float32Array(RN*2);for(let i=0;i<RN;i++){const x=(Math.random()-.5)*60,y=Math.random()*24,z=(Math.random()-.5)*60;rp.set([x,y,z,x,y,z],i*6);rs[i*2]=0;rs[i*2+1]=1;}
 rg.setAttribute('position',new THREE.BufferAttribute(rp,3));rg.setAttribute('end',new THREE.BufferAttribute(rs,1));
 const rainU={time:{value:0},cam:{value:new V()},wind:{value:new THREE.Vector2(1.4,.6)}};
 const rain=new THREE.LineSegments(rg,new THREE.ShaderMaterial({uniforms:rainU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,
  vertexShader:`attribute float end;uniform float time;uniform vec3 cam;uniform vec2 wind;varying float vA;
   void main(){vec3 p=position;float sp=14.;p.y=mod(p.y-time*sp,24.)-4.;p.xz+=wind*(p.y*.08);vec3 w=p;w.x=cam.x+mod(p.x-cam.x+30.,60.)-30.;w.z=cam.z+mod(p.z-cam.z+30.,60.)-30.;w.y=p.y+max(0.,cam.y-6.);
    w.xyz-=end*vec3(wind.x*.05,-.42,wind.y*.05);bool inside=w.x>${(BX0-.7).toFixed(2)}&&w.x<${(BX1+.7).toFixed(2)}&&w.z>${(BZ0-.7).toFixed(2)}&&w.z<${(BZ1+.7).toFixed(2)}&&w.y<9.5;bool bal=w.x>12.&&w.x<14.7&&w.z>-5.2&&w.z<-.8&&w.y<3.;
    vA=(inside||bal||w.y<0.)?0.:.18+.12*end;float d=distance(w,cam);vA*=smoothstep(30.,8.,d)*smoothstep(.3,1.2,d);gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
  fragmentShader:'varying float vA;void main(){if(vA<.005)discard;gl_FragColor=vec4(vec3(.62,.68,.78)*vA,1.);}'}));rain.frustumCulled=false;group.add(rain);
 // splashes on wet ground: tiny additive points near the camera
 const SPN=400;const spg=new THREE.BufferGeometry();const spp=new Float32Array(SPN*3);spg.setAttribute('position',new THREE.BufferAttribute(spp,3).setUsage(THREE.DynamicDrawUsage));
 const splash=new THREE.Points(spg,new THREE.PointsMaterial({color:0x8090a8,size:.05,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));splash.frustumCulled=false;group.add(splash);
 /* ---------- fog + environment ---------- */
 const fog=new THREE.FogExp2(0x0c1018,.017);
 const env=(()=>{const pm=new THREE.PMREMGenerator(R);const s=new THREE.Scene();const g=new THREE.SphereGeometry(10,24,12);const m=new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){vec3 d=normalize(vP);vec3 c=mix(vec3(.05,.045,.05),vec3(.03,.04,.065),smoothstep(-.1,.6,d.y));c+=vec3(.5,.3,.14)*pow(1.-abs(d.y),10.)*.5;gl_FragColor=vec4(c*1.4,1.);}'});
  s.add(new THREE.Mesh(g,m));const rt=pm.fromScene(s,.02);pm.dispose();return rt.texture;})();
 /* ---------- update ---------- */
 let t=0,flashT=0,nextFlash=6+Math.random()*10;const nearL=[];
 function update(dt,cam){t+=dt;rainU.time.value=t;rainU.cam.value.copy(cam.position);sky.material.uniforms.time.value=t;
  // lightning
  nextFlash-=dt;if(nextFlash<=0){flashT=.55;nextFlash=12+Math.random()*22;api.onThunder&&api.onThunder();}if(flashT>0)flashT-=dt;const fk=flashT>0?(Math.sin(flashT*38)>0?1:.25)*Math.min(1,flashT*3):0;
  sky.material.uniforms.flash.value=fk;moon.intensity=.85+fk*3.2;hemi.intensity=.55+fk*1.2;api.flash=fk;
  // flicker
  for(const l of lamps)if(l.flick&&l.mesh){const f=Math.random()<.02?.2:1;l.mesh.material=f<1?MAT.lampCold:MAT.lampOn;}
  // dynamic lights: nearest lamps to camera
  nearL.length=0;for(const l of lamps){const d=(l.x-cam.position.x)**2+(l.y-cam.position.y)**2+(l.z-cam.position.z)**2;nearL.push([d,l]);}nearL.sort((a,b)=>a[0]-b[0]);
  for(let i=0;i<dyn.length;i++){const e=nearL[i];const L2=dyn[i];if(!e||e[0]>26*26){L2.intensity=0;continue;}const l=e[1];L2.position.set(l.x,l.y-.15,l.z);L2.color.setRGB(l.col[0],l.col[1],l.col[2]);L2.intensity=l.I*(l.street?1.3:1.35);L2.distance=l.R;}
  // splashes
  for(let i=0;i<8;i++){const k=(Math.random()*SPN)|0;const x=cam.position.x+(Math.random()-.5)*24,z=cam.position.z+(Math.random()-.5)*24;if(x>BX0-.5&&x<BX1+.5&&z>BZ0-.5&&z<BZ1+.5){spp[k*3+1]=-9;continue;}spp[k*3]=x;spp[k*3+1]=.03;spp[k*3+2]=z;}spg.attributes.position.needsUpdate=true;
  // panel chunks
  for(const ch of chunks.values()){let dirty=false;for(const pn of ch.panels){if(pn.seen!==pn.ver+(pn.active?0:1e6)+(pn.rein?5e5:0)){dirty=true;break;}}if(dirty)rebuildChunk(ch);}
  syncHatches();}
 function breakGlass(op){const g=glass.find(q=>q.op===op);if(!g||g.broken)return null;g.broken=true;g.mesh.visible=false;return g;}
 function resetRound(){for(const g of glass){g.broken=false;g.mesh.visible=true;}syncHatches();}
 const api={group,fog,env,moon,hemi,dyn,lamps,glass,breakGlass,resetRound,update,MAT,bakeAt:(x,y,z,nx,ny,nz)=>bakeAt(L,lamps,x,y,z,nx,ny,nz,null),flash:0,onThunder:null,syncHatches,camMeshes};
 return api;}

/* ================================================================== props (furniture + exterior) */
function propMesh(b,P,bk){const{x0,y0,z0,x1,y1,z1}=b;const w=x1-x0,h=y1-y0,d=z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;const k=b.prop;
 const wood=[.55,.4,.3],dw=[.3,.2,.14],lw=[.75,.62,.48],steel=[.55,.57,.6],dark=[.12,.12,.13];const along=w>=d;
 const leg=(lx,lz,th,top)=>P.wood.box(lx-th,y0,lz-th,lx+th,top,lz+th,dw,bk,{s:1});
 switch(k){
  case'sofa':{const fab=b.y0>1?[.45,.34,.3]:[.36,.4,.48];P.fabric.box(x0,y0,z0,x1,y0+.42,z1,fab,bk,{s:.6});const t=.22;
   if(along){const back=cz>0?[z1-t,z1]:[z0,z0+t];P.fabric.box(x0,y0+.42,back[0],x1,y1,back[1],fab,bk,{s:.6});P.fabric.box(x0,y0+.42,z0,x0+.2,y0+.62,z1,fab,bk,{s:.6});P.fabric.box(x1-.2,y0+.42,z0,x1,y0+.62,z1,fab,bk,{s:.6});}
   else{const back=cx>0?[x1-t,x1]:[x0,x0+t];P.fabric.box(back[0],y0+.42,z0,back[1],y1,z1,fab,bk,{s:.6});}break;}
  case'table':case'dtable':case'desk':case'steeltable':{const m=k==='steeltable'?P.steel:P.wood;m.box(x0,y1-.06,z0,x1,y1,z1,k==='steeltable'?steel:lw,bk,{s:1.2});const t=.04;for(const[a,c]of[[x0+.08,z0+.08],[x1-.08,z0+.08],[x0+.08,z1-.08],[x1-.08,z1-.08]])(k==='steeltable'?P.steel:P.wood).box(a-t,y0,c-t,a+t,y1-.06,c+t,k==='steeltable'?steel:dw,bk);
   if(k==='desk'){P.dark.box(cx-.3,y1,cz-.05,cx+.3,y1+.38,cz+.02,dark,bk);P.led.box(cx-.27,y1+.04,cz+.021,cx+.27,y1+.36,cz+.024,[.2,.35,.5],null,{skip:'nz'});}break;}
  case'cabinet':case'shelf':case'wardrobe':case'counter':case'island':case'bar':case'bench':{const col=k==='counter'||k==='island'||k==='bar'?[.42,.32,.24]:wood;P.wood.box(x0,y0,z0,x1,y1,z1,col,bk,{s:1.6});
   if(k==='counter'||k==='island'||k==='bar')P.concrete.box(x0-.02,y1,z0-.02,x1+.02,y1+.04,z1+.02,[.85,.85,.85],bk,{s:1});
   if(k==='shelf')for(let yy=y0+.4;yy<y1-.1;yy+=.42){P.dark.box(x0+.03,yy,z0-.01,x1-.03,yy+.3,z1+.01,[.25+Math.random()*.3,.12+Math.random()*.15,.1],bk);}break;}
  case'bed':P.wood.box(x0,y0,z0,x1,y0+.3,z1,dw,bk);P.fabric.box(x0+.03,y0+.3,z0+.03,x1-.03,y1,z1-.03,[.8,.78,.74],bk,{s:.6});P.fabric.box(x0+.1,y1,z0+.2,x0+.5,y1+.12,z1-.2,[.9,.9,.9],bk,{s:.5});break;
  case'tub':P.white.box(x0,y0,z0,x1,y1,z1,[1,1,1],bk,{s:2});break;
  case'pool':P.wood.box(x0,y0,z0,x1,y1-.06,z1,dw,bk);P.felt.box(x0+.12,y1-.06,z0+.12,x1-.12,y1-.02,z1-.12,[1,1,1],bk);break;
  case'crate':P.wood.box(x0,y0,z0,x1,y1,z1,[.75,.6,.42],bk,{s:.8});break;
  case'lockers':P.steel.box(x0,y0,z0,x1,y1,z1,[.42,.44,.47],bk,{s:1});for(let x=x0+.4;x<x1;x+=.4)P.dark.box(x-.01,y0+.1,z1,x+.01,y1-.1,z1+.01,dark,bk);break;
  case'rack':case'console':case'ups':case'fridge':{(k==='fridge'?P.steel:P.dark).box(x0,y0,z0,x1,y1,z1,k==='fridge'?[.85,.86,.88]:[.09,.095,.11],bk,{s:1});
   if(k==='rack'||k==='console'){const fz=d<w?(cz<-4.5&&b.y0>1&&cz>-7?z1:z1):z1;for(let yy=y0+.2;yy<y1-.1;yy+=.16)for(let x=x0+.1;x<x1-.1;x+=.22){const c=Math.random();P.led.box(x,yy,z1,x+.03,yy+.02,z1+.012,c<.6?[.1,1.4,.3]:c<.85?[1.6,.9,.1]:[.2,.6,1.6],null,{skip:'nz'});P.led.box(x,yy,z0-.012,x+.03,yy+.02,z0,c<.6?[.1,1.4,.3]:[.2,.6,1.6],null,{skip:'pz'});}}break;}
  case'rail':case'srail':P.steel.box(x0,y1-.06,z0,x1,y1,z1,steel,bk);for(let a=(along?x0:z0)+.05;a<(along?x1:z1);a+=.5)P.steel.box(along?a:x0+.02,y0,along?z0+.02:a,along?a+.04:x1-.02,y1,along?z1-.02:a+.04,steel,bk);break;
  case'stringer':P.wood.box(x0,y0,z0,x1,y1,z1,[.5,.36,.26],bk);break;
  case'balcony':P.concrete.box(x0,y0,z0,x1,y1,z1,[.6,.6,.62],bk,{s:2});break;
  case'post':P.steel.box(x0,y0,z0,x1,y1,z1,steel,bk);break;
  case'hedge':P.hedge.box(x0,y0,z0,x1,y1,z1,[1,1,1],bk,{s:2.5});break;
  case'lowwall':case'planter':case'fountain':P.concrete.box(x0,y0,z0,x1,y1,z1,[.62,.6,.56],bk,{s:2});if(k==='planter')P.hedge.box(x0+.1,y1,z0+.1,x1-.1,y1+.35,z1-.1,[1,1,1],bk);if(k==='fountain')P.steel.box(cx-.1,y1,cz-.1,cx+.1,y1+.9,cz+.1,steel,bk);break;
  case'car':case'van':{const CC=[[.5,.07,.06],[.1,.16,.28],[.75,.75,.72],[.08,.08,.09],[.25,.3,.24],[.55,.5,.42]][b.col||0];const cab=k==='van'?.9:.55;const al=w>d;
   P.paint.box(x0,y0+.32,z0,x1,y0+h*cab,z1,CC,bk,{s:4});const ins=k==='van'?.05:.12;
   if(al)P.dark.box(x0+w*(k==='van'?.05:.22),y0+h*cab,z0+ins,x1-w*(k==='van'?.3:.22),y1,z1-ins,[.04,.05,.06],bk);else P.dark.box(x0+ins,y0+h*cab,z0+d*.22,x1-ins,y1,z1-d*.22,[.04,.05,.06],bk);
   const wr=.33;for(const a of[.18,.82])for(const s of[0,1]){const m=al?M4(x0+w*a,y0+wr,s?z1-.05:z0+.05,Math.PI/2):M4(s?x1-.05:x0+.05,y0+wr,z0+d*a,0,0,Math.PI/2);P.dark.add(new THREE.CylinderGeometry(wr,wr,.24,14),m,[.05,.05,.05],bk);}
   if(al){P.led.box(x1,y0+.55,z0+.25,x1+.01,y0+.68,z0+.55,[2.4,2.2,1.6],null);P.led.box(x1,y0+.55,z1-.55,x1+.01,y0+.68,z1-.25,[2.4,2.2,1.6],null);P.led.box(x0-.01,y0+.6,z0+.2,x0,y0+.72,z0+.5,[1.6,.05,.03],null);P.led.box(x0-.01,y0+.6,z1-.5,x0,y0+.72,z1-.2,[1.6,.05,.03],null);}break;}
  case'tree':P.bark.add(new THREE.CylinderGeometry(.18,.28,y1-y0,8),M4(cx,(y0+y1)/2,cz),[1,1,1],bk);for(let i=0;i<4;i++)P.hedge.add(new THREE.IcosahedronGeometry(1.6+Math.random()*.6,1),M4(cx+(Math.random()-.5)*1.6,y1-.4+Math.random()*1.8,cz+(Math.random()-.5)*1.6),[.8,.9,.8],bk);break;
  case'shed':P.wood.box(x0,y0,z0,x1,y1,z1,[.42,.36,.3],bk,{s:1.2});P.dark.box(x0-.2,y1,z0-.2,x1+.2,y1+.12,z1+.2,[.16,.16,.18],bk);break;
  case'garage':P.concrete.box(x0,y0,z0,x1,y1,z1,[.55,.52,.5],bk,{s:2});P.metal.box(x0-.02,y0,cz-1.6,x0,y0+2.5,cz+1.6,[.5,.52,.55],bk);break;
  case'dumpster':P.paint.box(x0,y0,z0,x1,y1,z1,[.12,.3,.2],bk,{s:2});break;
  case'fence':P.wood.box(x0,y0,z0,x1,y1,z1,[.45,.38,.3],bk,{s:1});break;
  case'generator':P.paint.box(x0,y0,z0,x1,y1,z1,[.55,.45,.12],bk,{s:1});break;
  default:P.wood.box(x0,y0,z0,x1,y1,z1,wood,bk);}}
