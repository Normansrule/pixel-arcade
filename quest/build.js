// WILD QUEST — structures: Thornhold Keep (barrier + sealed gate), Ruins of Ostvale, Mossback camps, shrine gates, the waking stone.
import * as THREE from '../vendor/three.module.min.js';
import {POI,heightAt,mulberry,noise2} from './terrain.js';
import {U,stoneMat,merge,M4,blob,ctex,detailTex} from './world.js';
const V=THREE.Vector3,C=(r,g,b)=>new THREE.Color().setRGB(r,g,b);
const rng=mulberry(77),rnd=(a=1)=>rng()*a;

// merged-geometry builder with collider registration
export class Builder{
 constructor(phys){this.phys=phys;this.L={};}
 add(key,geo,m,col){(this.L[key]||(this.L[key]=[])).push([geo,m,col]);}
 box(key,cx,y0,cz,w,h,d,o={}){const col=o.col||C(1,1,1);this.add(key,new THREE.BoxGeometry(w,h,d),M4(cx,y0+h/2,cz,o.rx||0,o.ry||0,o.rz||0),col);if(o.coll!==false&&!o.ry&&!o.rx&&!o.rz)return this.phys.cbox(cx,y0,cz,w,h,d,{climb:o.climb??true,tag:o.tag});return null;}
 cyl(key,x,y0,z,r0,r1,h,seg,o={}){this.add(key,new THREE.CylinderGeometry(r1??r0,r0,h,seg||12),M4(x,y0+h/2,z,o.rx||0,o.ry||0,o.rz||0),o.col||C(1,1,1));if(o.coll!==false&&!o.rx&&!o.rz)return this.phys.cyl(x,z,Math.max(r0,r1??r0),y0,y0+h,{climb:o.climb??true,tag:o.tag});return null;}
 build(scene,mats,group){const out={};for(const k in this.L){const g=merge(this.L[k]);const m=new THREE.Mesh(g,mats[k]);m.castShadow=m.receiveShadow=true;(group||scene).add(m);out[k]=m;}this.L={};return out;}}

const glowMat=(c,i=2.5)=>new THREE.MeshStandardMaterial({color:0x000000,emissive:c,emissiveIntensity:i,roughness:.6});
const tileTex=ctex(256,256,(x,w,h)=>{x.fillStyle='#15171c';x.fillRect(0,0,w,h);for(let i=0;i<4;i++)for(let j=0;j<4;j++){const v=48+Math.random()*16|0;x.fillStyle=`rgb(${v},${v+2},${v+8})`;x.fillRect(i*64+2,j*64+2,60,60);
 for(let k=0;k<60;k++){const s=Math.random()*40|0;x.fillStyle=`rgba(${s},${s},${s+6},.25)`;x.fillRect(i*64+4+Math.random()*54,j*64+4+Math.random()*54,1+Math.random()*3,1);}x.strokeStyle='rgba(255,255,255,.05)';x.strokeRect(i*64+6.5,j*64+6.5,51,51);}});
const tileGlow=ctex(256,256,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.strokeStyle='#5ff';x.lineWidth=2;x.globalAlpha=.9;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,h);x.stroke();x.beginPath();x.moveTo(0,i*64);x.lineTo(w,i*64);x.stroke();}
 x.lineWidth=1.5;x.globalAlpha=.7;x.beginPath();x.arc(128,128,38,0,7);x.stroke();x.beginPath();x.arc(128,128,22,0,7);x.stroke();for(let k=0;k<8;k++){const a=k/8*6.283;x.beginPath();x.moveTo(128+Math.cos(a)*22,128+Math.sin(a)*22);x.lineTo(128+Math.cos(a)*38,128+Math.sin(a)*38);x.stroke();}});
function tileMat(){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.25,emissive:0xffffff,emissiveIntensity:1});
 m.onBeforeCompile=sh=>{sh.uniforms.uTile={value:tileTex};sh.uniforms.uGlow={value:tileGlow};sh.uniforms.uTime=U.uTime;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP3;varying vec3 vWN3;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP3=(modelMatrix*vec4(transformed,1.)).xyz;vWN3=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP3;varying vec3 vWN3;uniform sampler2D uTile,uGlow;uniform float uTime;')
  .replace('#include <map_fragment>','vec2 tuv=abs(vWN3.y)>.5?vWP3.xz:abs(vWN3.x)>.5?vWP3.zy:vWP3.xy;tuv/=6.;diffuseColor.rgb*=texture2D(uTile,tuv).rgb*2.2;')
  .replace('#include <emissivemap_fragment>','float gl=texture2D(uGlow,tuv).g;float pulse=.55+.45*sin(uTime*1.3-length(vWP3.xz-vec2(floor(vWP3.x/200.+.5)*200.,0.))*.25);totalEmissiveRadiance=vec3(.25,.95,1.)*gl*pulse*1.4;');};
 m.customProgramCacheKey=()=>'tile';return m;}
export function mats(){return{tile:tileMat(),stone:stoneMat({scale:.22}),rock:stoneMat({natural:true,rough:.92}),crag:(()=>{const m=stoneMat({natural:true,rough:.95,crag:true});m.flatShading=true;return m;})(),dark:stoneMat({scale:.3,rough:.6}),wood:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}),
 roof:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:.1}),hide:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide}),
 ember:glowMat(0xff4a10,2.2),rune:glowMat(0x38e0e8,2.4)};}

export function buildStructures(scene,phys){const B=new Builder(phys),M=mats();const out={fires:[],chests:[],towers:[],shrines:[],seals:[],anim:[]};
 const STONE=C(.9,.86,.8),MOSS=C(.45,.6,.3),DARK=C(.32,.3,.34),WOOD=C(.2,.12,.06),WOOD2=C(.28,.18,.09);
 /* ---------- Thornhold Keep ---------- */
 {const c=POI.castle,h=c.h,x0=c.x,z0=c.z,S=30,T=3,WH=13;
  // curtain walls (south wall split by the gate)
  B.box('dark',x0,h-2,z0-S,2*S,WH+2,T,{col:DARK});B.box('dark',x0-S,h-2,z0,T,WH+2,2*S,{col:DARK});B.box('dark',x0+S,h-2,z0,T,WH+2,2*S,{col:DARK});
  const gw=8,seg=S-gw/2;B.box('dark',x0-S+seg/2,h-2,z0+S,seg,WH+2,T,{col:DARK});B.box('dark',x0+S-seg/2,h-2,z0+S,seg,WH+2,T,{col:DARK});
  for(let i=-S;i<=S;i+=2.4)for(const[cx,cz,w,d]of[[x0+i,z0-S,1.2,T],[x0-S,z0+i,T,1.2],[x0+S,z0+i,T,1.2]])B.box('dark',cx,h+WH,cz,w,1.2,d,{col:DARK,coll:false});
  for(let i=-S;i<=S;i+=2.4){if(Math.abs(i)<gw/2+1)continue;B.box('dark',x0+i,h+WH,z0+S,1.2,1.2,T,{col:DARK,coll:false});}
  // walkway on top (stand on walls)
  for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const tx=x0+sx*S,tz=z0+sz*S;B.cyl('dark',tx,h-3,tz,5.5,5,25,14,{col:DARK});B.add('roof',new THREE.ConeGeometry(6.4,8,14),M4(tx,h+26,tz),C(.25,.05,.03));
   for(let k=0;k<4;k++)B.add('ember',new THREE.BoxGeometry(.4,2.6,.2),M4(tx+Math.cos(k*1.57+.78)*5.3,h+17,tz+Math.sin(k*1.57+.78)*5.3,0,-(k*1.57+.78)+Math.PI/2,0));}
  // gatehouse
  for(const sx of[-1,1])B.box('dark',x0+sx*(gw/2+3),h-2,z0+S+.5,6,WH+8,6,{col:DARK});B.box('dark',x0,h+9.5,z0+S+.5,gw+.2,WH-7.5+8-2,6,{col:DARK,coll:false});phys.cbox(x0,h+9.5,z0+S+.5,gw,6,6);
  B.add('roof',new THREE.ConeGeometry(4.6,6,4),M4(x0-(gw/2+3),h+WH+9,z0+S+.5,0,.78,0),C(.25,.05,.03));B.add('roof',new THREE.ConeGeometry(4.6,6,4),M4(x0+(gw/2+3),h+WH+9,z0+S+.5,0,.78,0),C(.25,.05,.03));
  // keep
  B.box('dark',x0,h,z0-17,24,18,14,{col:DARK});B.box('dark',x0,h+18,z0-17,18,7,10,{col:DARK});B.cyl('dark',x0+9,h,z0-21,4.2,3.6,38,12,{col:DARK});B.add('roof',new THREE.ConeGeometry(5.2,14,12),M4(x0+9,h+45,z0-21),C(.25,.05,.03));
  B.cyl('dark',x0-9,h,z0-20,3.4,3,30,10,{col:DARK});B.add('roof',new THREE.ConeGeometry(4.2,10,10),M4(x0-9,h+35,z0-20),C(.25,.05,.03));
  B.box('dark',x0,h,z0-9.5,10,7,2,{col:DARK});// keep door frame
  for(let i=0;i<9;i++){const a=i/9;B.add('ember',new THREE.BoxGeometry(.25,3+rnd(5),.2),M4(x0-11+a*22,h+5+rnd(8),z0-9.9,0,0,rnd(.6)-.3));}
  B.add('ember',new THREE.BoxGeometry(6,4.5,.2),M4(x0,h+2.3,z0-8.4));
  // courtyard paving + stairs to the wall walk
  B.cyl('stone',x0,h-.6,z0+6,23,23,.65,40,{col:C(.7,.66,.6),climb:false});
  for(let i=0;i<6;i++)B.box('dark',x0-S+3.5+i*1.5,h,z0+S-6+0,1.6,1.8+i*1.9,4,{col:DARK,climb:false});
  // braziers around the arena
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.5,bx=x0+Math.cos(a)*19,bz=z0+6+Math.sin(a)*19;B.cyl('dark',bx,h,bz,.6,.9,1.4,8,{col:DARK});out.fires.push({x:bx,y:h+1.5,z:bz,brazier:true,lit:true});}
  // the gate (lowers once all four seals are lit) + seals
  const gm=new THREE.Mesh(new THREE.BoxGeometry(gw,9,1),new THREE.MeshStandardMaterial({color:0x2a1d14,roughness:.6,metalness:.4}));gm.position.set(x0,h+4.5,z0+S+.5);gm.castShadow=true;scene.add(gm);
  for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.25,9,1.2),new THREE.MeshStandardMaterial({color:0x56565e,metalness:.85,roughness:.35}));b.position.set(-3.2+i*1.6,0,0);gm.add(b);}
  const gate=phys.cbox(x0,h,z0+S+.5,gw,9,1.2,{dyn:true,climb:false,tag:'gate'});
  for(let i=0;i<4;i++){const s=new THREE.Mesh(new THREE.CircleGeometry(.6,24),glowMat(0xff4a10,1.2));s.position.set(x0-2.7+i*1.8,h+11,z0+S+3.55);scene.add(s);out.seals.push(s);}
  // barrier dome
  const bm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uTime:U.uTime,uA:{value:1}},
   vertexShader:'varying vec3 vP,vN,vV;void main(){vP=position;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:'uniform float uTime,uA;varying vec3 vP,vN,vV;float h(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5);}void main(){float f=pow(1.-abs(dot(vN,vV)),2.5);vec2 g=vec2(atan(vP.z,vP.x)*14.,vP.y*.35);vec2 c=fract(g)-.5;float hex=smoothstep(.42,.5,max(abs(c.x),abs(c.y)));float flow=sin(vP.y*.4-uTime*1.6+h(floor(g))*6.)*.5+.5;gl_FragColor=vec4(vec3(1.,.28,.06)*(f*.9+hex*.35*flow+.04)*uA,1.);}'});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(52,48,24,0,Math.PI*2,0,Math.PI/2),bm);dome.position.set(x0,h-8,z0);dome.scale.y=1.25;dome.renderOrder=3;scene.add(dome);
  const barrier=phys.cyl(x0,z0,52,-50,200,{dyn:true,climb:false,tag:'barrier'});
  // swirling ash vortex over the keep
  const vm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:U.uTime,uA:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uTime,uA;varying vec2 vUv;void main(){vec2 p=vUv-.5;float r=length(p)*2.;float a=atan(p.y,p.x);float s=sin(a*3.+r*10.-uTime*1.2)*.5+.5;float k=smoothstep(1.,.2,r)*smoothstep(0.,.15,r);vec3 c=mix(vec3(.05,.02,.03),vec3(.9,.25,.06),s*smoothstep(.6,.1,r));gl_FragColor=vec4(c,k*(.35+.4*s)*uA);}'});
  const vortex=new THREE.Mesh(new THREE.CircleGeometry(70,48).rotateX(Math.PI/2),vm);vortex.position.set(x0,h+95,z0-10);vortex.visible=false;
  out.castle={x:x0,z:z0,h,gateMesh:gm,gate,barrier,dome,domeMat:bm,vortex,vortexMat:vm,arena:{x:x0,z:z0+6,r:22},open:0};}
 /* ---------- Ruins of Ostvale ---------- */
 {const r=POI.ruins,h=r.h;const hs=[9,3,9,6,2,9,5,9,4,7,9,3];for(let i=0;i<12;i++){const a=i/12*Math.PI*2,px=r.x+Math.cos(a)*22,pz=r.z+Math.sin(a)*22;const ph=hs[i];B.cyl('rock',px,h-1,pz,1.1,.95,ph+1,10,{col:STONE});if(ph>=9){B.box('rock',px,h+ph,pz,2.6,.8,2.6,{col:STONE});}
   B.add('stone',new THREE.CylinderGeometry(1.2,1.2,.3,10),M4(px,h+ph+(ph>=9?.95:.15),pz),MOSS);
   const n=(i+1)%12;if(ph>=9&&hs[n]>=9){const b=(n)/12*Math.PI*2,qx=r.x+Math.cos(b)*22,qz=r.z+Math.sin(b)*22;const mx=(px+qx)/2,mz=(pz+qz)/2,len=Math.hypot(qx-px,qz-pz);B.add('stone',new THREE.BoxGeometry(len+2,1.2,2.2),M4(mx,h+ph+1.4,mz,0,-Math.atan2(qz-pz,qx-px),0),STONE);}}
  for(const[a,l]of[[.3,8],[2.2,7],[4.1,9]]){const px=r.x+Math.cos(a)*30,pz=r.z+Math.sin(a)*30;const yy=heightAt(px,pz);B.add('rock',new THREE.CylinderGeometry(1.05,1.05,l,10),M4(px,yy+.7,pz,0,a,Math.PI/2),STONE);phys.cyl(px,pz,2.2,yy-1,yy+1.7,{climb:true});}
  for(const[a,w,hh]of[[1.2,8,4],[3.3,10,3],[5.2,7,5]]){const px=r.x+Math.cos(a)*14,pz=r.z+Math.sin(a)*14;const yy=heightAt(px,pz);B.box('stone',px,yy-1,pz,Math.abs(Math.cos(a))>.5?1.5:w,hh+1,Math.abs(Math.cos(a))>.5?w:1.5,{col:STONE});for(let k=0;k<4;k++)B.add('stone',new THREE.BoxGeometry(1,1+rnd(1.5),1),M4(px+(rnd(1)-.5)*w*.6,yy+hh+.3,pz+(rnd(1)-.5)*w*.6),STONE);}
  B.cyl('stone',r.x,h-.8,r.z,8,8.4,1.2,24,{col:C(.75,.72,.66),climb:false});B.add('rune',new THREE.TorusGeometry(6.4,.12,4,48).rotateX(Math.PI/2),M4(r.x,h+.45,r.z));
  for(let i=0;i<6;i++){const a=i/6*6.283;B.add('rune',new THREE.BoxGeometry(.25,.05,2.4),M4(r.x+Math.cos(a)*4,h+.43,r.z+Math.sin(a)*4,0,-a,0));}
  out.ruins={x:r.x,z:r.z,h:h+.4};}
 /* ---------- camps ---------- */
 POI.camps.forEach((cp,ci)=>{const h=heightAt(cp.x,cp.z),cam={x:cp.x,z:cp.z,h,towers:[]};
  for(let i=0;i<9;i++){const a=i/9*6.283;B.add('stone',new THREE.DodecahedronGeometry(.32,0),M4(cp.x+Math.cos(a)*1.1,h+.1,cp.z+Math.sin(a)*1.1,a,a,0),C(.55,.53,.5));}
  for(let i=0;i<3;i++)B.add('wood',new THREE.CylinderGeometry(.09,.09,1.4,6),M4(cp.x,h+.25,cp.z,Math.PI/2-.3,i*2.1,0),WOOD);
  out.fires.push({x:cp.x,y:h+.3,z:cp.z,camp:ci,lit:true});
  const nt=2+(ci%2);for(let i=0;i<nt;i++){const a=i/nt*6.283+ci,tx=cp.x+Math.cos(a)*7.5,tz=cp.z+Math.sin(a)*7.5,th=heightAt(tx,tz);B.add('hide',new THREE.ConeGeometry(2.4,3.2,5,1,true),M4(tx,th+1.5,tz,0,a,0),C(.42,.3,.18));B.add('wood',new THREE.CylinderGeometry(.06,.06,4.2,5),M4(tx,th+2,tz),WOOD);phys.cyl(tx,tz,2.1,th-1,th+2.2,{climb:false,tag:'tent'});}
  for(let i=0;i<cp.towers;i++){const a=i*2.6+ci*1.3+1.2,tx=cp.x+Math.cos(a)*10.5,tz=cp.z+Math.sin(a)*10.5,th=heightAt(tx,tz),TH=5.6;
   for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]])B.box('wood',tx+sx*1.2,th-1,tz+sz*1.2,.32,TH+1+1.2,.32,{col:WOOD,climb:true});
   B.box('wood',tx,th+TH,tz,3.2,.3,3.2,{col:WOOD2,climb:false});for(const[sx,sz,w,d]of[[0,-1.5,3.2,.12],[0,1.5,3.2,.12],[-1.5,0,.12,3.2],[1.5,0,.12,3.2]])B.box('wood',tx+sx,th+TH+.6,tz+sz,w,.12,d,{col:WOOD2,coll:false});
   B.add('hide',new THREE.ConeGeometry(2.4,1.4,4,1,true),M4(tx,th+TH+2.4,tz,0,.78,0),C(.5,.16,.08));for(let k=0;k<7;k++)B.box('wood',tx+1.65,th+.4+k*.8,tz,.12,.1,1,{col:WOOD2,coll:false});
   const tw={x:tx,y:th+TH+.3,z:tz};cam.towers.push(tw);out.towers.push(tw);}
  // banner + crates + chest
  const bx=cp.x+Math.cos(ci*2+3)*5,bz=cp.z+Math.sin(ci*2+3)*5,bh=heightAt(bx,bz);B.cyl('wood',bx,bh-.5,bz,.1,.08,5,6,{col:WOOD});B.add('hide',new THREE.PlaneGeometry(1.2,1.8),M4(bx+.62,bh+3.3,bz,0,0,0),C(.55,.08,.05));
  for(let k=0;k<3;k++){const a=ci*1.7+k*.9+4,kx=cp.x+Math.cos(a)*4.6,kz=cp.z+Math.sin(a)*4.6,kh=heightAt(kx,kz);B.box('wood',kx,kh-.2,kz,1,1.1,1,{col:WOOD2,tag:'crate'});}
  const ca=ci*1.7+1.9,chx=cp.x+Math.cos(ca)*3.4,chz=cp.z+Math.sin(ca)*3.4;out.chests.push(makeChest(scene,phys,chx,heightAt(chx,chz),chz,Math.atan2(cp.x-chx,cp.z-chz),ci));
  (out.camps||(out.camps=[])).push(cam);});
 /* ---------- climbable rock spires (a seed waits on many of them) ---------- */
 out.spires=[];for(const[x,z,r,hh]of[[-28,62,3.6,17],[122,-92,4.2,22],[-150,-26,3.4,15],[64,112,3,13],[192,30,3.8,19],[-46,-168,4.5,24],[-104,148,3.2,14]]){const y=heightAt(x,z)-1.5;const g=new THREE.CylinderGeometry(r*.72,r,hh,11,8);const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),a=Math.atan2(pz,px);const n=1+noise2(a*2.1+x,py*.18+z)*.28+noise2(a*5+z,py*.6)*.14+(Math.round(py/2.2)%2?.04:0);if(Math.abs(py)<hh/2-.01){p.setX(i,px*n);p.setZ(i,pz*n);}}g.computeVertexNormals();
  const cg=g.toNonIndexed();const cols=new Float32Array(cg.attributes.position.count*3);for(let i=0;i<cols.length/3;i++){const yy=cg.attributes.position.getY(i),ny=cg.attributes.normal.getY(i);const c=C(.42,.38,.33).lerp(C(.25,.36,.14),ny>.6?.85:0).multiplyScalar(.75+.25*((yy+hh/2)/hh));cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b;}cg.setAttribute('color',new THREE.BufferAttribute(cols,3));
  B.add('crag',cg,M4(x,y+hh/2,z));phys.cyl(x,z,r*.92,y-2,y+hh,{climb:true,tag:'spire'});out.spires.push({x,y:y+hh,z,r});}
 /* ---------- waking stone at the start ---------- */
 {const s=POI.start,h=s.h;for(let i=0;i<7;i++){const a=i/7*6.283;B.add('rock',blob(.7,1,.25,i*2.3),M4(s.x+Math.cos(a)*7.5,h+.6,s.z+Math.sin(a)*7.5,rnd(.15),-a,rnd(.15),.8,2.2+rnd(1.2),.6),C(.75,.73,.68));phys.cyl(s.x+Math.cos(a)*7.5,s.z+Math.sin(a)*7.5,.6,h-1,h+2.4,{tag:'rock'});}
  B.box('rock',s.x,h-.4,s.z-3,1.6,3.6,.7,{col:C(.62,.6,.56)});B.add('rune',new THREE.BoxGeometry(.9,.07,.05),M4(s.x,h+2,s.z-2.62));B.add('rune',new THREE.TorusGeometry(.38,.04,4,24),M4(s.x,h+1.25,s.z-2.62));
  for(let i=0;i<8;i++){const a=i/8*6.283;B.add('stone',new THREE.DodecahedronGeometry(.25,0),M4(s.x+3+Math.cos(a)*.9,h+.05,s.z+1+Math.sin(a)*.9),C(.55,.53,.5));}
  for(let i=0;i<3;i++)B.add('wood',new THREE.CylinderGeometry(.08,.08,1.2,6),M4(s.x+3,h+.2,s.z+1,Math.PI/2-.3,i*2.1,0),WOOD);out.fires.push({x:s.x+3,y:h+.2,z:s.z+1,lit:true,start:true});}
 /* ---------- shrine gates ---------- */
 POI.shrines.forEach((s,i)=>{const h=s.h,rot=Math.atan2(-s.x,-s.z);const fx=Math.sin(rot),fz=Math.cos(rot);
  B.cyl('stone',s.x,h-1.5,s.z,5.2,5.6,2,6,{col:C(.6,.58,.56),climb:false});B.add('rune',new THREE.TorusGeometry(4.6,.09,4,6).rotateX(Math.PI/2),M4(s.x,h+.52,s.z,0,0,0));
  const px=-fz,pz=fx;for(const sx of[-1,1]){B.box('stone',s.x+px*sx*2.3,h+.5,s.z+pz*sx*2.3,1,4.4,1,{col:C(.5,.48,.46)});}
  B.add('stone',new THREE.TorusGeometry(2.3,.5,6,16,Math.PI),M4(s.x,h+4.9,s.z,0,rot+Math.PI/2,0),C(.5,.48,.46));
  const pm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:U.uTime,uC:{value:new THREE.Color(1.6,.55,.12)}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uTime;uniform vec3 uC;varying vec2 vUv;void main(){vec2 p=vUv-.5;float r=length(p)*2.;float a=atan(p.y,p.x);float s=sin(a*5.+r*9.-uTime*3.)*.5+.5;float e=smoothstep(1.,.85,r);gl_FragColor=vec4(uC*(s*.6+.5+smoothstep(.6,1.,r)*1.5)*e,e*.85);}'});
  const portal=new THREE.Mesh(new THREE.CircleGeometry(2,40),pm);portal.position.set(s.x,h+3.1,s.z);portal.rotation.y=rot;scene.add(portal);
  const beamM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:U.uTime,uC:pm.uniforms.uC,uA:{value:1}},vertexShader:'varying vec2 vUv;varying vec3 vN,vV;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:'uniform float uTime,uA;uniform vec3 uC;varying vec2 vUv;varying vec3 vN,vV;void main(){float e=pow(abs(dot(vN,vV)),2.);float f=smoothstep(1.,.0,vUv.y)*smoothstep(0.,.01,vUv.y);float s=.7+.3*sin(vUv.y*80.-uTime*4.);gl_FragColor=vec4(uC*e*f*s*.55*uA,1.);}'});
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,320,16,1,true),beamM);beam.position.set(s.x,h+160,s.z);beam.renderOrder=3;scene.add(beam);
  out.shrines.push({i,x:s.x,y:h+.5,z:s.z,rot,fx,fz,portal,beam,beamMat:beamM,col:pm.uniforms.uC.value,name:s.name,trial:s.trial,done:false,enter:{x:s.x+fx*1.2,z:s.z+fz*1.2}});});
 const ms=B.build(scene,M);out.anim.push(M.ember);out.mats=M;return out;}

function makeChest(scene,phys,x,y,z,ry,i){const g=new THREE.Group();const w=new THREE.MeshStandardMaterial({color:0x6a3e1c,roughness:.8}),m=new THREE.MeshStandardMaterial({color:0xc9a040,roughness:.35,metalness:.85});
 const base=new THREE.Mesh(new THREE.BoxGeometry(1.1,.6,.7),w);base.position.y=.3;g.add(base);const lid=new THREE.Group();lid.position.set(0,.6,-.35);const lm=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1.1,10,1,false,0,Math.PI).rotateZ(Math.PI/2),w);lm.position.z=.35;lid.add(lm);g.add(lid);
 for(const sx of[-.45,.45]){const b=new THREE.Mesh(new THREE.BoxGeometry(.08,.62,.72),m);b.position.set(sx,.31,0);g.add(b);}const lock=new THREE.Mesh(new THREE.BoxGeometry(.16,.18,.06),m);lock.position.set(0,.55,.37);g.add(lock);
 g.position.set(x,y,z);g.rotation.y=ry;g.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});scene.add(g);phys.cbox(x,y-.5,z,1,1.1,1,{climb:false});return{g,lid,x,y,z,open:false,i,openT:0};}
