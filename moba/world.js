// AEONFALL — the Sundered Vale in 3D: vertex-coloured terrain with cliffs, animated river, base plazas, instanced forest,
// rocks and bushes, and the fog-of-war patch that darkens everything outside the player's team vision.
import * as THREE from '../vendor/three.module.min.js';
import * as MAP from './map.js';
import {rng,cl} from './util.js';
import {treeGeo,rockGeo,bushGeo,crystalGeo,TEAMC} from './models.js';

// fog of war: a 100x100 visibility texture shared by every material that calls fogify()
export const FOG={tex:null,data:null,cur:null};
{const n=100;FOG.data=new Uint8Array(n*n*4);FOG.cur=new Float32Array(n*n);FOG.tex=new THREE.DataTexture(FOG.data,n,n,THREE.RGBAFormat);FOG.tex.magFilter=FOG.tex.minFilter=THREE.LinearFilter;FOG.tex.needsUpdate=true;FOG.cur.fill(1);FOG.data.fill(255);}
export const fogU={uFog:{value:FOG.tex},uFogOn:{value:1}};
export function fogify(mat){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,fogU);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vFogW;').replace('#include <project_vertex>','#include <project_vertex>\n{vec4 fw=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nfw=instanceMatrix*fw;\n#endif\nfw=modelMatrix*fw;vFogW=fw.xz;}');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vFogW;uniform sampler2D uFog;uniform float uFogOn;').replace('#include <dithering_fragment>','#include <dithering_fragment>\n{float fv=texture2D(uFog,(vFogW+100.)/200.).r;fv=mix(1.,fv,uFogOn);float l=dot(gl_FragColor.rgb,vec3(.3,.59,.11));gl_FragColor.rgb=mix(mix(vec3(l)*vec3(.55,.62,.85),gl_FragColor.rgb,.35)*.42,gl_FragColor.rgb,fv);}');};
 mat.customProgramCacheKey=()=>'fog'+(mat.uuid);return mat;}
export function fogUpdate(vis,dt){const n=100,d=FOG.data,c=FOG.cur,k=Math.min(1,dt*6);for(let i=0;i<n*n;i++){const v=vis[i]?1:0;c[i]+=(v-c[i])*k;d[i*4]=c[i]*255;}FOG.tex.needsUpdate=true;}

function canvasTex(n,draw,rep=1){const c=document.createElement('canvas');c.width=c.height=n;draw(c.getContext('2d'),n);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=8;return t;}
// value noise for colour variation
const R0=rng(7);const NG=64,NV=new Float32Array(NG*NG).map(()=>R0());
function noise(x,z){x=x/9+500;z=z/9+500;const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,s=t=>t*t*(3-2*t);const a=NV[(j%NG)*NG+i%NG],b=NV[(j%NG)*NG+(i+1)%NG],c=NV[((j+1)%NG)*NG+i%NG],d=NV[((j+1)%NG)*NG+(i+1)%NG];return a+(b-a)*s(fx)+(c-a)*s(fz)+(a-b-c+d)*s(fx)*s(fz);}
const fbm=(x,z)=>noise(x,z)*.6+noise(x*2.3,z*2.3)*.28+noise(x*5.1,z*5.1)*.12;

export function buildWorld(scene,q){
 const out={animated:[]};
 /* ---- terrain ---- */
 const SEG=q>=1?220:150;const geo=new THREE.PlaneGeometry(MAP.SIZE+40,MAP.SIZE+40,SEG,SEG);geo.rotateX(-Math.PI/2);
 const pos=geo.attributes.position,col=new Float32Array(pos.count*3);const c=new THREE.Color(),c2=new THREE.Color();
 const grassA=new THREE.Color('#4f8a3c'),grassB=new THREE.Color('#6a9c44'),grassC=new THREE.Color('#3d7238'),dirt=new THREE.Color('#bfa070'),dirt2=new THREE.Color('#a08058'),sand=new THREE.Color('#c8b480'),river=new THREE.Color('#2a6a6a'),cliff=new THREE.Color('#6a6258'),cliffTop=new THREE.Color('#2e5530'),stone=[new THREE.Color('#8a94a8'),new THREE.Color('#a8948c')];
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);const h=MAP.height(x,z);pos.setY(i,h);const f=MAP.field(x,z);
  const n=fbm(x,z);c.copy(grassA).lerp(grassB,cl(n*1.6-.4,0,1)).lerp(grassC,cl((noise(x*.5+40,z*.5)-.55)*2.5,0,1));
  const lk=MAP.laneK(x,z);if(lk>0){c2.copy(dirt).lerp(dirt2,noise(x*3,z*3));const st=noise(x*6+9,z*6);if(st>.62)c2.multiplyScalar(1.12);if(st<.3)c2.lerp(grassA,.25);c.lerp(c2,cl(lk*(.7+n*.5),0,.95));}
  const rk=MAP.riverK(x,z);if(rk>0){c.lerp(sand,cl(rk*3,0,1));if(rk>.35)c.lerp(river,cl((rk-.35)*2.5,0,1));}
  for(let t=0;t<2;t++){const d=Math.hypot(x-MAP.CORE[t][0],z-MAP.CORE[t][1]);if(d<MAP.BASE_R+2){c.lerp(stone[t],cl((MAP.BASE_R+2-d)/4,0,.85));}}
  if(f>0){const k=cl(f/2.4,0,1);c2.copy(cliff).lerp(cliffTop,cl((f-1.6)/1.5,0,1));c2.multiplyScalar(.85+n*.3);c.lerp(c2,k);}
  col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
 geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();
 const detail=canvasTex(256,(x,n)=>{const r=rng(3);x.fillStyle='#d8d8d8';x.fillRect(0,0,n,n);for(let i=0;i<5000;i++){const v=170+r()*85|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(r()*n,r()*n,1+r()*2,1+r()*3);}
  for(let i=0;i<300;i++){x.strokeStyle=`rgba(255,255,255,${r()*.25})`;x.beginPath();const px=r()*n,py=r()*n;x.moveTo(px,py);x.lineTo(px+(r()-.5)*4,py-3-r()*4);x.stroke();}},70);
 const tmat=fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,map:detail}));
 const terrain=new THREE.Mesh(geo,tmat);terrain.receiveShadow=true;scene.add(terrain);out.terrain=terrain;
 /* ---- base plazas with tiles and a team-coloured inlay ---- */
 for(const t of[0,1]){const tex=canvasTex(512,(x,n)=>{x.fillStyle='#9a9a98';x.fillRect(0,0,n,n);const r=rng(11+t);const s=n/16;for(let j=0;j<16;j++)for(let i=0;i<16;i++){const v=140+r()*50|0;x.fillStyle=`rgb(${v},${v-4},${v-10})`;x.fillRect(i*s+1,j*s+1,s-2,s-2);}
   x.strokeStyle=TEAMC[t];x.lineWidth=10;x.globalAlpha=.55;x.beginPath();x.arc(n/2,n/2,n*.36,0,7);x.stroke();x.lineWidth=4;x.beginPath();x.arc(n/2,n/2,n*.3,0,7);x.stroke();for(let k=0;k<8;k++){const a=k/8*Math.PI*2;x.beginPath();x.moveTo(n/2+Math.cos(a)*n*.3,n/2+Math.sin(a)*n*.3);x.lineTo(n/2+Math.cos(a)*n*.46,n/2+Math.sin(a)*n*.46);x.stroke();}},1);
  const m=new THREE.Mesh(new THREE.CircleGeometry(22,48),fogify(new THREE.MeshStandardMaterial({map:tex,roughness:.75,transparent:true,alphaMap:canvasTex(128,(x,n)=>{const g=x.createRadialGradient(n/2,n/2,n*.3,n/2,n/2,n/2);g.addColorStop(0,'#fff');g.addColorStop(.8,'#fff');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,n,n);}),depthWrite:false})));
  m.rotation.x=-Math.PI/2;m.position.set(MAP.CORE[t][0],.04,MAP.CORE[t][1]);m.receiveShadow=true;m.renderOrder=-1;scene.add(m);}
 /* ---- river water ---- */
 const wU={uT:{value:0},...fogU};const wgeo=new THREE.PlaneGeometry(270,20,1,1);wgeo.rotateX(-Math.PI/2);
 const water=new THREE.Mesh(wgeo,new THREE.ShaderMaterial({uniforms:wU,transparent:true,depthWrite:false,
  vertexShader:'varying vec2 vW;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uT;uniform sampler2D uFog;uniform float uFogOn;varying vec2 vW;varying vec2 vUv;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){float e=abs(vUv.y-.5)*2.;float a=smoothstep(1.,.62,e);vec2 p=vW*.35;float t=uT*.6;float w=n(p+vec2(t,t*.7))*.6+n(p*2.3-vec2(t*1.3,t))*.4;
   vec3 deep=vec3(.06,.32,.42),shal=vec3(.25,.62,.66);vec3 c=mix(deep,shal,smoothstep(.2,.95,e)*.8+w*.25);float sp=smoothstep(.72,.9,w)*(1.-e*.6);c+=vec3(.7,.9,1.)*sp*.5;
   float foam=smoothstep(.55,.72,e)*smoothstep(.95,.75,e)*(.5+.5*n(p*4.+t*2.));c=mix(c,vec3(.85,.95,1.),foam*.5);
   float fv=mix(1.,texture2D(uFog,(vW+100.)/200.).r,uFogOn);float l=dot(c,vec3(.3,.59,.11));c=mix(mix(vec3(l)*vec3(.55,.62,.85),c,.35)*.42,c,fv);gl_FragColor=vec4(c,a*.86);}`}));
 water.rotation.y=-Math.PI/4;water.position.y=-.32;water.renderOrder=1;scene.add(water);out.water=wU;
 /* ---- forest: instanced trees on the cliffs ---- */
 const r=rng(42);const trees=[[],[],[]],rocks=[],bushes=[],crystals=[];
 const step=q>=2?2.4:q>=1?2.9:3.6;
 for(let z=-119;z<=119;z+=step)for(let x=-119;x<=119;x+=step){const px=x+(r()-.5)*step*.9,pz=z+(r()-.5)*step*.9;const f=MAP.field(px,pz);
  if(f>1.4){if(Math.max(Math.abs(px),Math.abs(pz))>108&&r()<.5)continue;const n=noise(px*.7,pz*.7);const kind=n>.72?2:n>.45?1:0;trees[kind].push([px,MAP.height(px,pz)-.2,pz,.6+r()*.4,r()*6]);}
  else if(f>.2&&f<1.4&&r()<.35)rocks.push([px,MAP.height(px,pz)-.1,pz,.5+r()*.9,r()*6]);
  else if(f<-1.5&&f>-3.2&&r()<.06&&MAP.riverK(px,pz)===0&&MAP.laneK(px,pz)<.3)bushes.push([px,MAP.height(px,pz),pz,.7+r()*.5,r()*6]);
  else if(MAP.riverK(px,pz)>.15&&MAP.riverK(px,pz)<.5&&r()<.05)crystals.push([px,MAP.height(px,pz)-.1,pz,.5+r()*.6,r()*6]);}
 const inst=(g,list,mat,shadow)=>{if(!list.length)return null;const m=new THREE.InstancedMesh(g,mat,list.length);const o=new THREE.Object3D(),cc=new THREE.Color();
  list.forEach((t,i)=>{o.position.set(t[0],t[1],t[2]);o.rotation.set(0,t[4],0);o.scale.setScalar(t[3]);o.updateMatrix();m.setMatrixAt(i,o.matrix);const v=.82+r()*.3;cc.setRGB(v,v*(.95+r()*.1),v);m.setColorAt(i,cc);});
  m.castShadow=shadow;m.receiveShadow=true;scene.add(m);return m;};
 const fmat=fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true}));
 trees.forEach((l,k)=>inst(treeGeo(k),l,fmat,q>=2));inst(rockGeo(),rocks,fmat,q>=2);inst(bushGeo(),bushes,fmat,false);
 inst(crystalGeo(),crystals,fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.2,emissive:'#2a6aa0',emissiveIntensity:.6,flatShading:true})),false);
 out.treeCount=trees.reduce((s,l)=>s+l.length,0);
 /* ---- boss pits: glowing rune circles ---- */
 for(const[k,col]of[['warden','#a070ff'],['drake','#ff7a2a']]){const p=MAP.PITS[k];const tex=canvasTex(256,(x,n)=>{x.clearRect(0,0,n,n);x.strokeStyle=col;x.lineWidth=5;x.beginPath();x.arc(n/2,n/2,n*.44,0,7);x.stroke();x.lineWidth=2;x.beginPath();x.arc(n/2,n/2,n*.38,0,7);x.stroke();
   for(let i=0;i<12;i++){const a=i/12*Math.PI*2;x.save();x.translate(n/2+Math.cos(a)*n*.41,n/2+Math.sin(a)*n*.41);x.rotate(a);x.fillStyle=col;x.fillRect(-6,-2,12,4);x.restore();}},1);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(20,20),fogify(new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.6})));m.rotation.x=-Math.PI/2;m.position.set(p[0],MAP.height(p[0],p[1])+.05,p[1]);scene.add(m);out.animated.push(m);}
 return out;}
