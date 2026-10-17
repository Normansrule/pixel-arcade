// SHARDWAR — the battlefield in 3D: vertex-coloured terrain raised into cliffs where the map blocks the ground, a river
// with fords, instanced rocks, forests and crystal debris, and the fog of war (visible / explored / unexplored) shared by
// every material that goes through fogify().
import * as THREE from '../vendor/three.module.min.js';
import {rng,cl} from './util.js';
import {rockGeo,treeGeo,crystalGeo} from './models.js';

export const FOG={tex:null,data:null,cur:null,n:0,size:1};
export const fogU={uFog:{value:null},uFogOn:{value:0},uFogS:{value:1}};
export function fogInit(n,size){FOG.n=n;FOG.size=size;FOG.data=new Uint8Array(n*n*4);FOG.cur=new Float32Array(n*n);FOG.ex=new Float32Array(n*n);if(FOG.tex)FOG.tex.dispose();
 FOG.tex=new THREE.DataTexture(FOG.data,n,n,THREE.RGBAFormat);FOG.tex.magFilter=FOG.tex.minFilter=THREE.LinearFilter;FOG.tex.needsUpdate=true;fogU.uFog.value=FOG.tex;fogU.uFogS.value=size;}
const FOG_GLSL='{vec4 fv4=texture2D(uFog,(vFogW+uFogS*.5)/uFogS);float fv=mix(1.,fv4.r,uFogOn),fe=mix(1.,fv4.g,uFogOn);float l=dot(gl_FragColor.rgb,vec3(.3,.59,.11));vec3 mem=mix(vec3(l)*vec3(.6,.66,.85),gl_FragColor.rgb,.35)*.45;gl_FragColor.rgb=mix(mix(mem*.12,mem,fe),gl_FragColor.rgb,fv);}';
export function fogify(mat){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,fogU);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vFogW;').replace('#include <project_vertex>','#include <project_vertex>\n{vec4 fw=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nfw=instanceMatrix*fw;\n#endif\nfw=modelMatrix*fw;vFogW=fw.xz;}');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vFogW;uniform sampler2D uFog;uniform float uFogOn,uFogS;').replace('#include <dithering_fragment>','#include <dithering_fragment>\n'+FOG_GLSL);};
 mat.customProgramCacheKey=()=>'fog'+mat.uuid;return mat;}
// vis: Uint8 visible per cell, exp: explored per cell
export function fogUpdate(vis,exp,dt,snap){const n=FOG.n,d=FOG.data,c=FOG.cur,e=FOG.ex,k=snap?1:Math.min(1,dt*7);for(let i=0;i<n*n;i++){c[i]+=((vis[i]?1:0)-c[i])*k;e[i]+=((exp[i]?1:0)-e[i])*k;d[i*4]=c[i]*255;d[i*4+1]=e[i]*255;}FOG.tex.needsUpdate=true;}

function canvasTex(n,draw,rep=1){const c=document.createElement('canvas');c.width=c.height=n;draw(c.getContext('2d'),n);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=8;return t;}
export function buildWorld(scene,M,q){const out={objs:[],animated:[]};const add=o=>{scene.add(o);out.objs.push(o);return o;};
 const size=M.size,half=M.half,SEG=Math.round(size/(q>=1?1:1.5));
 const geo=new THREE.PlaneGeometry(size+60,size+60,SEG,SEG);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position,col=new Float32Array(pos.count*3);
 const c=new THREE.Color(),c2=new THREE.Color();const tint=new THREE.Color(M.tint);
 const grassA=new THREE.Color('#4f7034').lerp(tint,.18),grassB=new THREE.Color('#7f8f48').lerp(tint,.15),dry=new THREE.Color('#ab9a66'),dirt=new THREE.Color('#7a5c3e'),rock=new THREE.Color('#7a6e62'),rockTop=new THREE.Color('#5a5446'),sand=new THREE.Color('#c8b488'),mud=new THREE.Color('#4a5a4a'),moss=new THREE.Color('#4a6a38');
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);const h=M.height(x,z);pos.setY(i,h);const[f,ft]=M.field(x,z);const n=M.noise(x,z),n2=M.noise(x*3.1+70,z*3.1);
  const n3=M.noise(x*7.3+11,z*7.3);c.copy(grassA).lerp(grassB,cl(n*1.8-.5,0,1)).lerp(dry,cl((n2-.55)*2.6,0,1)*.7);c.multiplyScalar(.9+n3*.2);if(M.noise(x*.6+200,z*.6)>.62)c.lerp(dirt,cl((M.noise(x*.6+200,z*.6)-.62)*4,0,.7));
  if(ft<3)c.lerp(moss,cl((3-ft)/4,0,.7));
  // base pads: worn ground around every base
  for(const b of M.bases){const d=Math.hypot(x-b.x,z-b.z)+(n2-.5)*6;if(d<17)c.lerp(dirt,cl((17-d)/9,0,.5));}
  if(h>.6){c2.copy(rock).lerp(rockTop,cl((h-3)/2.5,0,1));c2.multiplyScalar(.82+n2*.35);c.lerp(c2,cl((h-.4)/1.2,0,1));}
  const rk=M.riverK(x,z);if(rk>0){c.lerp(sand,cl(rk*2.5,0,.8));if(rk>.5)c.lerp(mud,cl((rk-.5)*2,0,1));}
  col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
 geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
 const detail=canvasTex(256,(x,n)=>{const r=rng(3);x.fillStyle='#d4d4d4';x.fillRect(0,0,n,n);for(let i=0;i<6000;i++){const v=165+r()*90|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(r()*n,r()*n,1+r()*2,1+r()*2);}
  for(let i=0;i<400;i++){x.strokeStyle=`rgba(255,255,255,${r()*.3})`;x.beginPath();const px=r()*n,py=r()*n;x.moveTo(px,py);x.lineTo(px+(r()-.5)*4,py-2-r()*4);x.stroke();}},size/5);
 const terrain=add(new THREE.Mesh(geo,fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,map:detail}))));terrain.receiveShadow=true;out.terrain=terrain;
 // river water with fords
 if(M.river){const wU={uT:{value:0},...fogU};const wg=new THREE.PlaneGeometry(20,size,1,40);wg.rotateX(-Math.PI/2);
  const water=add(new THREE.Mesh(wg,new THREE.ShaderMaterial({uniforms:wU,transparent:true,depthWrite:false,
   vertexShader:'varying vec2 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`uniform float uT,uFogOn,uFogS;uniform sampler2D uFog;varying vec2 vW;
   float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
   void main(){float cx=sin(vW.y*.05)*2.;float e=abs(vW.x-cx)/(5.5+sin(vW.y*.07)*1.2);float a=smoothstep(1.25,.8,e);vec2 p=vW*.3;float t=uT*.5;float w=n(p+vec2(t*.2,t))*.6+n(p*2.3-vec2(t*.3,t*1.4))*.4;
    vec3 c=mix(vec3(.08,.3,.36),vec3(.3,.6,.6),smoothstep(.2,1.,e)*.7+w*.25);c+=vec3(.8,.95,1.)*smoothstep(.75,.92,w)*.35;float foam=smoothstep(.8,1.05,e)*(.5+.5*n(p*4.+t*2.));c=mix(c,vec3(.85,.95,1.),foam*.45);
    vec4 fv4=texture2D(uFog,(vW+uFogS*.5)/uFogS);float fv=mix(1.,fv4.r,uFogOn),fe=mix(1.,fv4.g,uFogOn);float l=dot(c,vec3(.3,.59,.11));vec3 mem=mix(vec3(l)*vec3(.6,.66,.85),c,.35)*.45;c=mix(mix(mem*.12,mem,fe),c,fv);gl_FragColor=vec4(c,a*.85);}`})));
  water.position.y=-.55;water.renderOrder=1;out.water=wU;}
 // rocks on cliffs, forests, crystal debris (instanced)
 const r=rng(91+M.idx);const rocks=[[],[]],trees=[[],[]],crystals=[];const step=q>=2?2.2:q>=1?2.7:3.4;
 for(let z=-half;z<=half;z+=step)for(let x=-half;x<=half;x+=step){const px=x+(r()-.5)*step*.9,pz=z+(r()-.5)*step*.9;const[f,ft]=M.field(px,pz);
  if(ft<-.4&&r()<.85)trees[r()<.5?1:0].push([px,M.height(px,pz)-.1,pz,.75+r()*.5,r()*6]);
  else if(f<.6&&f>-7&&Math.max(Math.abs(px),Math.abs(pz))<half-1&&r()<.55)rocks[r()<.4?1:0].push([px,M.height(px,pz)-.4,pz,.8+r()*1.1+cl(-f*.12,0,.8),r()*6]);
  else if(f>4&&ft>3&&r()<.006&&M.riverK(px,pz)===0&&!M.bases.some(b=>Math.hypot(px-b.x,pz-b.z)<18))crystals.push([px,M.height(px,pz),pz,.6+r()*.8,r()*6]);}
 // border wall of trees outside the playable area
 for(let a=-half-26;a<=half+26;a+=step*1.4)for(const s of[-1,1])for(let k=0;k<3;k++){const o=half+2+k*5+r()*3;trees[r()<.6?1:0].push([a+(r()-.5)*2,M.height(a,s*o)-.1,s*o,.9+r()*.6,r()*6]);trees[r()<.6?1:0].push([s*o,M.height(s*o,a)-.1,a+(r()-.5)*2,.9+r()*.6,r()*6]);}
 const tufts=[],pebs=[];if(q>=1){const tr=rng(5+M.idx);for(let i=0;i<(q>=2?9000:5000);i++){const x=(tr()-.5)*size,z=(tr()-.5)*size;const[f,ft]=M.field(x,z);if(f<1||M.riverK(x,z)>.3)continue;if(M.noise(x*2,z*2)<.38&&tr()<.7)continue;(tr()<.82?tufts:pebs).push([x,M.height(x,z)-.05,z,.5+tr()*.7,tr()*6]);}}
 const inst=(g,list,mat,shadow)=>{if(!list.length)return null;const m=new THREE.InstancedMesh(g,mat,list.length);const o=new THREE.Object3D(),cc=new THREE.Color();
  list.forEach((t,i)=>{o.position.set(t[0],t[1],t[2]);o.rotation.set(0,t[4],0);o.scale.setScalar(t[3]);o.updateMatrix();m.setMatrixAt(i,o.matrix);const v=.8+r()*.32;cc.setRGB(v,v*(.96+r()*.08),v*(.95+r()*.06));m.setColorAt(i,cc);});
  m.castShadow=shadow;m.receiveShadow=true;add(m);return m;};
 const fmat=fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88,flatShading:true}));
 rocks.forEach((l,k)=>inst(rockGeo(k),l,fmat,q>=1));trees.forEach((l,k)=>inst(treeGeo(k),l,fmat,q>=1));
 inst(crystalGeo(),crystals,fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.25,emissive:'#6040a0',emissiveIntensity:.5,flatShading:true})),false);
 {const tg=new THREE.ConeGeometry(.12,.7,3);const parts=[];for(let k=0;k<5;k++){const g=tg.clone();g.rotateZ((k-2)*.25);g.rotateY(k*1.3);g.translate(Math.sin(k*2.1)*.18,.3,Math.cos(k*2.1)*.18);parts.push(g);}
  const pos=[];for(const g of parts){const a=g.toNonIndexed().attributes.position;for(let i=0;i<a.count;i++)pos.push(a.getX(i),a.getY(i),a.getZ(i));}const tgm=new THREE.BufferGeometry();tgm.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));tgm.computeVertexNormals();
  const cols=new Float32Array(pos.length);for(let i=0;i<pos.length/3;i++){const y=pos[i*3+1];const k=y/.7;cols[i*3]=.28+k*.3;cols[i*3+1]=.42+k*.3;cols[i*3+2]=.16+k*.1;}tgm.setAttribute('color',new THREE.BufferAttribute(cols,3));
  inst(tgm,tufts,fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide})),false);inst(new THREE.DodecahedronGeometry(.22,0),pebs,fogify(new THREE.MeshStandardMaterial({color:'#8a8070',roughness:.9,flatShading:true})),false);}
 out.counts={rocks:rocks[0].length+rocks[1].length,trees:trees[0].length+trees[1].length};
 return out;}
