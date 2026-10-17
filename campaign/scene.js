// STARFALL VANGUARD — dresses a mission: triplanar terrain (ground/cliff blend + world-space normal mapping), rocks, alien
// and human structures with glowing trims, instanced trees and wind-swept grass, objective set pieces (relay, conduits, pylons,
// control station, barrier, lift), and a baked sky with the ring-world arch and a gas giant.
import * as THREE from '../vendor/three.module.min.js';
import {V,M4,merge,boxUV,ctex,rng} from './util.js';
import {panelSet,floorSet,crateSet,grateSet,hexTex,glowTex,groundTex,cliffSet} from './tex.js';
import {fbm2} from './missions.js';

const C=(r,g,b)=>new THREE.Color(r,g,b);
export const THEMES={
 gorge:{sun:[0xffd6a8,2.7,[.62,.38,-.3]],hemi:[0xa0c0e8,0x6a4430,.62],fog:[0xd2a888,.0036],exp:.88,bloom:.32,thr:.93,sat:1.1,tint:'#fff3e8',
  ground:[[156,98,64],[182,128,84],[86,120,74]],cliff:[[196,118,78],[104,58,44]],sky:{zen:[.12,.28,.55],hor:[1.15,.72,.48],sun:[1.4,.8,.45]}},
 spire:{sun:[0xd8c8ff,1.4,[.4,.62,.5]],hemi:[0x8070c0,0x281c3a,.55],fog:[0x1c1430,.0052],exp:1.05,bloom:.75,thr:.78,sat:1.1,tint:'#f2e8ff',
  ground:[[78,70,96],[96,84,112],[60,96,104]],cliff:[[118,100,140],[52,42,66]],sky:{zen:[.06,.08,.24],hor:[.75,.42,.62],sun:[1.2,.7,.9]}},
 plains:{sun:[0xfff0d8,3.1,[.38,.72,.34]],hemi:[0xbcd8ff,0x40502c,.62],fog:[0xaac8e8,.0024],exp:.74,bloom:.28,thr:.95,sat:1.14,tint:'#fffaf2',
  ground:[[64,104,52],[98,136,62],[150,140,98]],cliff:[[156,142,116],[64,68,56]],sky:{zen:[.1,.3,.72],hor:[.62,.78,.98],sun:[1.3,1.1,.85]}}};
const TRIMS={p:C(2.4,.6,3.4),c:C(.4,1.8,3.2),o:C(3.4,1.6,.3),r:C(3.4,.4,.3)};

/* ---------- triplanar terrain material ---------- */
function terrainMat(T,gfx){const g=groundTex(T.ground[0],T.ground[1],T.ground[2],7,1),cl=cliffSet(T.cliff[0],T.cliff[1],13);
 const m=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.94,metalness:0});const U={tG:{value:g},tC:{value:cl.map},tCN:{value:cl.normalMap}};
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tG,tC,tCN;varying vec3 vWP;varying vec3 vWN;vec3 tpW;float tpF;')
  .replace('#include <map_fragment>',`vec3 bw=pow(abs(vWN),vec3(4.));bw/=bw.x+bw.y+bw.z;const float S=.045;
   vec3 rock=texture2D(tC,vWP.zy*S).rgb*bw.x+texture2D(tC,vWP.xz*S*1.3).rgb*bw.y+texture2D(tC,vWP.xy*S).rgb*bw.z;
   vec3 grd=mix(texture2D(tG,vWP.xz*.09).rgb,texture2D(tG,vWP.xz*.013+.37).rgb,.45);
   tpF=smoothstep(.7,.86,vWN.y);diffuseColor.rgb*=mix(rock,grd,tpF);
   vec3 nx=texture2D(tCN,vWP.zy*S).xyz*2.-1.,ny=texture2D(tCN,vWP.xz*S*1.3).xyz*2.-1.,nz=texture2D(tCN,vWP.xy*S).xyz*2.-1.;
   nx=vec3(nx.xy+vWN.zy,abs(nx.z)*vWN.x);ny=vec3(ny.xy+vWN.xz,abs(ny.z)*vWN.y);nz=vec3(nz.xy+vWN.xy,abs(nz.z)*vWN.z);
   tpW=normalize(mix(normalize(nx.zyx*bw.x+ny.xzy*bw.y+nz.xyz*bw.z),vWN,tpF*.85));`)
  .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=normalize((viewMatrix*vec4(tpW,0.)).xyz);');};
 m.customProgramCacheKey=()=>'terrain';return m;}

/* ---------- sky with ring arch ---------- */
const NOISE=`float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=vn(p)*a;p*=2.03;a*=.5;}return s;}`;
function skyScene(T,sunDir){const S=new THREE.Scene(),k=T.sky,v3=a=>new THREE.Vector3(...a);
 const U={uSun:{value:sunDir},uZ:{value:v3(k.zen)},uH:{value:v3(k.hor)},uS:{value:v3(k.sun)}};
 S.add(new THREE.Mesh(new THREE.SphereGeometry(5000,48,24),new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`${NOISE}uniform vec3 uSun,uZ,uH,uS;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(uH,uZ,pow(clamp(y,0.,1.),.5));c=mix(c,uH*.8,smoothstep(0.,-.2,y));
   float cl=fbm(vec3(d.xz/(abs(y)+.25)*1.6,1.));float cl2=fbm(vec3(d.xz/(abs(y)+.25)*5.,3.));c=mix(c,mix(uH*1.15,vec3(1.),.5),smoothstep(.5,.78,cl*.8+cl2*.3)*smoothstep(.02,.25,y)*.65);
   float st=step(.985,h3(floor(d*400.)))*smoothstep(.3,.8,y)*smoothstep(.5,.15,length(uH)*.6);c+=st*.8;
   float sd=max(dot(d,uSun),0.);c+=uS*(pow(sd,1400.)*50.+pow(sd,40.)*.6+pow(sd,5.)*.2);gl_FragColor=vec4(c,1.);}`})));
 // the ring arch: inner face = land/sea/cloud bands, edges = bright walls, haze toward the horizon
 const R=3000,ring=new THREE.Mesh(new THREE.CylinderGeometry(R,R,380,512,1,true),new THREE.ShaderMaterial({uniforms:U,side:THREE.DoubleSide,transparent:true,depthWrite:false,
  vertexShader:'varying vec2 vU;varying vec3 vW;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`${NOISE}uniform vec3 uSun,uZ,uH;varying vec2 vU;varying vec3 vW;void main(){vec3 d=normalize(vW);float a=vU.x*30.,w=vU.y;
   float n=fbm(vec3(a*1.1,w*2.5,1.)),n2=fbm(vec3(a*3.5,w*8.,4.));vec3 land=mix(vec3(.12,.24,.4),mix(vec3(.25,.42,.18),vec3(.55,.48,.32),n2),smoothstep(.45,.5,n));
   land=mix(land,vec3(.95),smoothstep(.52,.72,fbm(vec3(a*2.2,w*4.,9.)+vec3(fbm(vec3(a*6.,w*12.,2.))*.6)))*.75);float edge=smoothstep(.045,.03,w)+smoothstep(.955,.97,w);vec3 col=mix(land,vec3(.75,.78,.85),edge);
   if(!gl_FrontFacing)col=col;else col=vec3(.2,.22,.26)+vec3(.9,.8,.6)*step(.97,h3(floor(vec3(a*40.,w*12.,0.))));
   float lit=.65+.35*max(dot(normalize(-vW*vec3(0.,1.,1.)),uSun),0.);col*=lit*1.25;float haze=exp(-max(d.y,0.)*5.);col=mix(col,uH,haze*.85);
   gl_FragColor=vec4(col,smoothstep(-.02,.05,d.y));}`}));
 ring.rotation.z=Math.PI/2;ring.rotation.y=.38;ring.position.set(1350,R*.86,-300);S.add(ring);
 // gas giant
 const gg=new THREE.Mesh(new THREE.SphereGeometry(1,64,40),new THREE.ShaderMaterial({uniforms:U,depthWrite:false,transparent:true,
  vertexShader:'varying vec3 vP,vN,vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=normalize(w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`${NOISE}uniform vec3 uSun,uH;varying vec3 vP,vN,vW;void main(){float b=vP.y*7.+fbm(vP*3.)*1.6;vec3 c=mix(vec3(.85,.62,.42),vec3(.55,.36,.3),.5+.5*sin(b*3.1));c=mix(c,vec3(.95,.9,.8),smoothstep(.6,.9,sin(b*1.3+1.)));
   float l=smoothstep(-.15,.5,dot(vN,uSun));c*=l;c+=vec3(.4,.55,.9)*pow(1.-abs(dot(vN,vW)),3.)*.6*l;c=mix(c,uH,.35*exp(-max(vW.y,0.)*3.));gl_FragColor=vec4(c,smoothstep(-.01,.04,vW.y));}`}));
 gg.scale.setScalar(620);gg.position.set(-2600,1300,-3200);gg.rotation.z=.4;S.add(gg);
 return S;}

/* ---------- materials ---------- */
function mats(T){const P=(base,seed,o,rough,metal)=>{const s=panelSet(base,seed,o);return new THREE.MeshStandardMaterial({...s,roughness:rough,metalness:metal});};
 const M={hum:P('#6a6e60',11,{stripes:'#e0a020'},.55,.6),barrier:P('#4f5444',17,{stripes:'#e8b020'},.5,.55),crate:new THREE.MeshStandardMaterial({...crateSet('#4c5636','#ffb020'),roughness:.6,metalness:.4}),
  alienW:P('#3e2f5e',23,{},.22,.85),alienC:P('#54407e',29,{},.2,.85),ceil:P('#231b33',31,{},.35,.8),alien:new THREE.MeshStandardMaterial({color:0x5c4a86,roughness:.18,metalness:.92}),
  alienF:(()=>{const s=floorSet('#2a2140','#0b0812',7,{inlay:'#6a3ad8'});return new THREE.MeshStandardMaterial({...s,roughness:.3,metalness:.6});})(),
  door:(()=>{const s=grateSet('#ff40c0');return new THREE.MeshStandardMaterial({map:s.map,emissiveMap:s.emissiveMap,emissive:0xffffff,emissiveIntensity:2,roughness:.4,metalness:.7});})()};
 for(const k of['hum','barrier','alienW','alienC','ceil','alienF']){const m=M[k];for(const t of['map','normalMap','roughnessMap'])if(m[t])m[t].repeat.set(1,1);}return M;}

/* ---------- objective set pieces ---------- */
function relayModel(M){const g=new THREE.Group(),P=[];for(const[x,z]of[[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]])P.push([new THREE.BoxGeometry(.25,14,.25),M4(x*(1-.3),7,z*(1-.3),z*.04,0,-x*.04)]);
 for(let y=1;y<14;y+=2.2)P.push([new THREE.BoxGeometry(2.6-y*.08,.15,.15),M4(0,y,-1+y*.03)],[new THREE.BoxGeometry(2.6-y*.08,.15,.15),M4(0,y,1-y*.03)],[new THREE.BoxGeometry(.15,.15,2.6-y*.08),M4(-1+y*.03,y,0)],[new THREE.BoxGeometry(.15,.15,2.6-y*.08),M4(1-y*.03,y,0)]);
 P.push([new THREE.BoxGeometry(4,1.4,3),M4(2.6,.7,0)],[new THREE.CylinderGeometry(2,.3,.8,20,1,true),M4(0,14.5,0,-.7)]);const m=new THREE.Mesh(merge(P),M.hum);m.castShadow=true;g.add(m);
 const lt=new THREE.Mesh(new THREE.SphereGeometry(.25,12,8),new THREE.MeshBasicMaterial({color:C(4,.4,.3)}));lt.position.y=14.6;g.add(lt);g.userData.blink=lt;
 const scr=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.9),new THREE.MeshBasicMaterial({color:C(.4,1.6,2.2)}));scr.position.set(2.6,1.0,1.51);g.add(scr);g.userData.screen=scr;return g;}
function conduitModel(M){const g=new THREE.Group();const base=new THREE.Mesh(merge([[new THREE.CylinderGeometry(2.2,2.6,1,8)],[new THREE.CylinderGeometry(.5,.9,9,8),M4(0,5,0)],[new THREE.CylinderGeometry(1.6,1.6,.4,8),M4(0,9.4,0)]]),M.alien);base.castShadow=true;g.add(base);
 const cm=new THREE.MeshBasicMaterial({color:C(.6,2,3.6),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false});const core=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,8,16,1,true),cm);core.position.y=5;g.add(core);
 const rings=[];for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(1.3,.06,6,32),cm);r.rotation.x=Math.PI/2;g.add(r);rings.push(r);}g.userData={core,rings,cm};return g;}
function pylonModel(M){const g=new THREE.Group(),body=new THREE.Group();g.add(body);const P=[[new THREE.CylinderGeometry(4,5,2,6)],[new THREE.CylinderGeometry(1.3,2.6,16,6),M4(0,9,0)],[new THREE.CylinderGeometry(3.4,1.2,2,6),M4(0,17.5,0)]];
 for(let i=0;i<3;i++){const a=i/3*Math.PI*2;P.push([new THREE.BoxGeometry(.8,10,1.6),M4(Math.cos(a)*2.6,5.5,Math.sin(a)*2.6,0,-a,Math.cos(a)*.18)]);}
 const m=new THREE.Mesh(merge(P),M.alien);m.castShadow=true;body.add(m);
 const cm=new THREE.MeshBasicMaterial({color:C(3.4,.8,3.2)});const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(2.2,0),cm);crystal.position.y=22;crystal.scale.y=1.6;body.add(crystal);
 const bm=new THREE.MeshBasicMaterial({color:C(1.6,.4,1.8),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false});const beam=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,400,12,1,true),bm);beam.position.y=222;body.add(beam);
 const debris=new THREE.Mesh(merge([[new THREE.CylinderGeometry(4,5,2,6)],[new THREE.DodecahedronGeometry(2,0),M4(2,1.5,1)],[new THREE.DodecahedronGeometry(1.5,0),M4(-2.5,1,-1)],[new THREE.CylinderGeometry(1.3,2.3,4,6),M4(0,2.5,0,.3,0,.2)]]),M.alien);debris.visible=false;g.add(debris);
 g.userData={body,crystal,beam,debris};return g;}
function stationModel(M){const g=new THREE.Group(),P=[];const arch=new THREE.TorusGeometry(15,1.2,10,64,Math.PI);P.push([arch,M4(0,0,0)],[new THREE.TorusGeometry(15,.6,8,64,Math.PI),M4(0,0,0,0,Math.PI/2)]);
 P.push([new THREE.CylinderGeometry(2.5,3.5,6,8),M4(0,3,0)]);const m=new THREE.Mesh(merge(P),M.alien);m.castShadow=true;g.add(m);
 const cm=new THREE.MeshBasicMaterial({color:C(3.2,1.8,.5)});const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.8,1),cm);core.position.y=9;g.add(core);
 const bm=new THREE.MeshBasicMaterial({color:C(1.8,1,.3),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false});const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,600,12,1,true),bm);beam.position.y=300;g.add(beam);g.userData={core,beam};return g;}
function barrierModel(r){const U={uHex:{value:hexTex()},uT:{value:0},uA:{value:1}};const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,26,96,1,true),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vU;varying vec3 vN,vV;void main(){vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform sampler2D uHex;uniform float uT,uA;varying vec2 vU;varying vec3 vN,vV;void main(){float hx=texture2D(uHex,vU*vec2(40.,8.)).r;float s=smoothstep(.05,0.,abs(fract(vU.y*1.5-uT*.2)-.5));float f=pow(1.-abs(dot(vN,vV)),2.);gl_FragColor=vec4(vec3(1.,.55,.15)*(hx*.35+s*.4+f*.4+.05)*uA*(1.-vU.y*.6),1.);}'}));
 m.position.y=13;m.userData.U=U;return m;}
function liftModel(M){const g=new THREE.Group();const p=new THREE.Mesh(new THREE.CylinderGeometry(3,3.2,.4,32),M.alien);p.position.y=.2;g.add(p);const r=new THREE.Mesh(new THREE.TorusGeometry(3,.08,6,48),new THREE.MeshBasicMaterial({color:C(.5,2.6,3.4)}));r.rotation.x=Math.PI/2;r.position.y=.42;g.add(r);
 const bm=new THREE.MeshBasicMaterial({color:C(.3,1.2,1.8),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});const col=new THREE.Mesh(new THREE.CylinderGeometry(2.9,2.9,15,32,1,true),bm);col.position.y=7.8;g.add(col);g.userData={col};return g;}
export function turretModel(){const g=new THREE.Group(),M=new THREE.MeshStandardMaterial({color:0x4a3a70,roughness:.2,metalness:.9}),gm=new THREE.MeshBasicMaterial({color:C(1.8,1.2,3.6)});
 const base=new THREE.Mesh(merge([[new THREE.CylinderGeometry(.7,1.1,1.2,8),M4(0,.6,0)],[new THREE.CylinderGeometry(.2,.3,.9,8),M4(0,1.5,0)]]),M);base.castShadow=true;g.add(base);
 const head=new THREE.Group();head.position.y=2.1;g.add(head);const h=new THREE.Mesh(merge([[new THREE.SphereGeometry(.55,16,10),M4(0,0,0,0,0,0,1,.7,1.4)],[new THREE.CylinderGeometry(.09,.12,1.3,8),M4(.22,0,-.9,Math.PI/2)],[new THREE.CylinderGeometry(.09,.12,1.3,8),M4(-.22,0,-.9,Math.PI/2)],[new THREE.BoxGeometry(1.8,.9,.08),M4(0,.1,-.4)]]),M);h.castShadow=true;head.add(h);
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),gm);eye.position.set(0,.18,-.6);head.add(eye);g.userData={head,muzzle:new V(0,0,-1.6)};return g;}
export function landerModel(human){const g=new THREE.Group(),M=new THREE.MeshStandardMaterial({color:human?0x5a6648:0x3a2c5c,roughness:.3,metalness:.8}),gm=new THREE.MeshBasicMaterial({color:human?C(3,1.8,.6):C(2,.8,3.4)});
 const P=human?[[new THREE.BoxGeometry(4,3,12),M4(0,0,0)],[new THREE.BoxGeometry(3,1.6,4),M4(0,1.8,-4)],[new THREE.BoxGeometry(12,.5,3),M4(0,.8,2)],[new THREE.CylinderGeometry(1,1,3.5,12),M4(-5.5,.8,2,Math.PI/2)],[new THREE.CylinderGeometry(1,1,3.5,12),M4(5.5,.8,2,Math.PI/2)],[new THREE.BoxGeometry(.4,3,3),M4(0,2.5,5.5)]]
  :[[new THREE.SphereGeometry(3,24,14),M4(0,0,0,0,0,0,1,.7,3)],[new THREE.SphereGeometry(1.8,16,10),M4(0,1.2,-5,0,0,0,1,.8,1.6)],[new THREE.SphereGeometry(1.4,16,10),M4(-5,-.5,2,0,0,0,1,.8,3)],[new THREE.SphereGeometry(1.4,16,10),M4(5,-.5,2,0,0,0,1,.8,3)],[new THREE.BoxGeometry(10,.4,2),M4(0,-.3,2)]];
 const m=new THREE.Mesh(merge(P),M);m.castShadow=true;g.add(m);for(const x of human?[-5.5,5.5]:[-5,5]){const e=new THREE.Mesh(new THREE.CylinderGeometry(.8,.4,.3,12),gm);e.position.set(x,human?-.2:-1.3,human?2:4);g.add(e);}
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.5,10,20,1,true),new THREE.MeshBasicMaterial({color:human?C(.8,.6,.2):C(.6,.3,1),transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=-6;beam.visible=false;g.add(beam);g.userData={beam};return g;}

/* ---------- build ---------- */
export function buildScene(D,R,gfx){const def=D.def,T=THEMES[def.theme],root=new THREE.Group(),anim=[],W=D.W,M=mats(T);const sunDir=new V(...T.sun[2]).normalize();const emit=[];
 // terrain mesh
 const hf=W.hf,geo=new THREE.PlaneGeometry((hf.nx-1)*hf.cs,(hf.nz-1)*hf.cs,hf.nx-1,hf.nz-1);geo.rotateX(-Math.PI/2);geo.translate(hf.x0+(hf.nx-1)*hf.cs/2,0,hf.z0+(hf.nz-1)*hf.cs/2);
 const pa=geo.attributes.position,col=new Float32Array(pa.count*3);for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i),y=W.H(x,z);pa.setY(i,y);const n=fbm2(x/50+3,z/50),k=.82+n*.36;col[i*3]=k;col[i*3+1]=k*(.96+n*.08);col[i*3+2]=k*.95;}
 geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.computeVertexNormals();const tm=terrainMat(T,gfx);const terr=new THREE.Mesh(geo,tm);terr.receiveShadow=true;terr.castShadow=true;root.add(terr);
 // rocks: displaced dodecahedra with the terrain's triplanar material
 const rk=[];const rr=rng(def.seed+5);for(const r of D.rocks){const g=new THREE.IcosahedronGeometry(1,1);const p=g.attributes.position;const sd=rr()*100;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=.78+fbm2(x*1.7+sd,z*1.7+y*1.3)*.5;p.setXYZ(i,x*k,y*k,z*k);}
  rk.push([g,M4(r.x,r.y+r.h*.45,r.z,rr()*.3,rr()*6,rr()*.3,r.r,r.h*.6,r.r*(.8+rr()*.4)),new THREE.Color(1,1,1)]);}
 if(rk.length){const g=merge(rk);g.computeVertexNormals();const m=new THREE.Mesh(g,tm);m.castShadow=true;m.receiveShadow=true;root.add(m);}
 // solids -> merged buckets + trims
 const buckets={},trims={},WH=new THREE.Color(1,1,1);const add=(b,g)=>(buckets[b]||(buckets[b]=[])).push(b==='rockB'||b==='rockC'?[g,null,WH]:[g]);const trim=(k,g)=>(trims[k]||(trims[k]=[])).push([g]);
 for(const s of D.solids){if(s.o.novis||s.mat==='none'||s.o.door)continue;const h=s.b[1]-s.a[1];
  if(s.c){const g=new THREE.CylinderGeometry(s.R,s.R*1.08,h,Math.max(12,Math.min(48,s.R*10|0)),1);g.translate(s.cx,s.a[1]+h/2,s.cz);boxUV(g,.25);add(s.mat,g);
   if(s.o.trim)for(const f of[.15,.55,.92]){const t=new THREE.TorusGeometry(s.R*1.05+.02,.06,6,24);t.rotateX(Math.PI/2);t.translate(s.cx,s.a[1]+h*f,s.cz);trim(s.o.trim,t);}continue;}
  const w=s.b[0]-s.a[0],d=s.b[2]-s.a[2],cx=(s.a[0]+s.b[0])/2,cz=(s.a[2]+s.b[2])/2;const g=new THREE.BoxGeometry(w,h,d);g.translate(cx,s.a[1]+h/2,cz);boxUV(g,s.mat==='rockB'?.06:.25);add(s.mat==='rockB'?'rockB':s.mat,g);
  if(s.mat==='alienW'||s.mat==='alienC'){const y=s.b[1]-.15,y2=s.a[1]+Math.min(h*.5,1.1);for(const yy of s.mat==='alienW'?[y2,Math.min(y,s.a[1]+6)]:[y])for(const[sx,sz,len,rot]of[[0,d/2+.015,w-.1,0],[0,-d/2-.015,w-.1,0],[w/2+.015,0,d-.1,1],[-w/2-.015,0,d-.1,1]]){if(len<.3)continue;const t=new THREE.BoxGeometry(rot?.03:len,.07,rot?len:.03);t.translate(cx+sx,yy,cz+sz);trim(s.mat==='alienW'?'p':'c',t);}}}
 const solidMeshes=[];for(const k in buckets){const m=new THREE.Mesh(merge(buckets[k]),k==='rockB'||k==='rockC'?tm:M[k]||M.hum);m.castShadow=true;m.receiveShadow=true;root.add(m);solidMeshes.push(m);}
 for(const k in trims)root.add(new THREE.Mesh(merge(trims[k]),new THREE.MeshBasicMaterial({color:TRIMS[k]||TRIMS.c})));
 // doors
 const doors=[];for(const s of D.solids)if(s.o.door){const w=s.b[0]-s.a[0],h=s.b[1]-s.a[1],d=s.b[2]-s.a[2];const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M.door);m.position.set((s.a[0]+s.b[0])/2,s.a[1]+h/2,(s.a[2]+s.b[2])/2);root.add(m);doors.push({s,m,y0:m.position.y});}
 // trees: curved trunks + layered canopies, instanced
 if(D.trees.length){const trunkG=merge([[new THREE.CylinderGeometry(.25,.45,5,7),M4(0,2.5,0)],[new THREE.CylinderGeometry(.18,.25,4.5,7),M4(.4,6.6,0,0,0,-.18)]]);
  const canG=merge([[new THREE.SphereGeometry(2.6,10,6),M4(.8,8.6,0,0,0,0,1,.35,1)],[new THREE.SphereGeometry(1.9,10,6),M4(.9,9.6,.2,0,0,0,1,.4,1)],[new THREE.SphereGeometry(3.2,10,6),M4(.5,7.4,-.3,0,0,0,1,.28,1)]]);
  const tM=new THREE.MeshStandardMaterial({color:0x5a4a5e,roughness:.9}),cM=new THREE.MeshStandardMaterial({color:0x3aa890,roughness:.7,emissive:0x0a3a30,emissiveIntensity:.5});
  const ti=new THREE.InstancedMesh(trunkG,tM,D.trees.length),ci=new THREE.InstancedMesh(canG,cM,D.trees.length);const tr=rng(9);
  D.trees.forEach((t,i)=>{const m=M4(t.x,t.y-.3,t.z,0,tr()*6.28,0,t.s,t.s,t.s);ti.setMatrixAt(i,m);ci.setMatrixAt(i,m);ci.setColorAt(i,new THREE.Color().setHSL(.44+tr()*.12,.55,.32+tr()*.15));});
  ti.castShadow=ci.castShadow=true;ti.receiveShadow=ci.receiveShadow=true;root.add(ti,ci);}
 // grass (medium+ quality)
 const gd=D.deco.find(d=>d.type==='grass');let grass=null;
 if(gd){const bl=[],br=rng(11);for(let k=0;k<7;k++){const g=new THREE.ConeGeometry(.045,.55+br()*.4,3,2);g.translate(0,(.55)/2,0);g.rotateZ((br()-.5)*.7);g.rotateY(br()*6.3);g.translate((br()-.5)*.35,0,(br()-.5)*.35);bl.push([g]);}const bg=merge(bl);const c=new Float32Array(bg.attributes.position.count*3);for(let i=0;i<c.length/3;i++){const y=Math.min(1,bg.attributes.position.getY(i)/.8);c[i*3]=.35+y*.55;c[i*3+1]=.45+y*.55;c[i*3+2]=.3+y*.35;}bg.setAttribute('color',new THREE.BufferAttribute(c,3));
  const gm=new THREE.MeshStandardMaterial({color:0x7aa050,vertexColors:true,roughness:.9,side:THREE.DoubleSide});const GU={uT:{value:0}};gm.onBeforeCompile=sh=>{sh.uniforms.uT=GU.uT;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;').replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 ip=instanceMatrix*vec4(0.,0.,0.,1.);float sw=sin(uT*1.7+ip.x*.3+ip.z*.2)*.18*position.y;transformed.x+=sw;transformed.z+=sw*.6;');};gm.customProgramCacheKey=()=>'grass';
  grass=new THREE.InstancedMesh(bg,gm,gd.n);const gr=rng(4);let n=0;const nn=new V();for(let i=0;i<gd.n*3&&n<gd.n;i++){const x=W.bounds[0]+gr()*(W.bounds[1]-W.bounds[0]),z=W.bounds[2]+gr()*(W.bounds[3]-W.bounds[2]);W.normal(x,z,nn);if(nn.y<.9||fbm2(x/22,z/22)<.42)continue;
   const s=.8+gr()*1.1;grass.setMatrixAt(n,M4(x,W.H(x,z)-.05,z,0,gr()*6,0,s,s*(.7+gr()*.6),s));grass.setColorAt(n,new THREE.Color().setHSL(.2+gr()*.07,.42,.3+gr()*.12));n++;}grass.count=n;grass.receiveShadow=true;root.add(grass);anim.push(t=>GU.uT.value=t);}
 // deco
 for(const d of D.deco){const y=W.H(d.x||0,d.z||0);
  if(d.type==='pod'){const g=new THREE.Group();const pm=new THREE.MeshStandardMaterial({color:0x8a8e86,roughness:.45,metalness:.75}),bm=new THREE.MeshStandardMaterial({color:0x1c1a18,roughness:.9});
   const body=new THREE.Mesh(merge([[new THREE.CylinderGeometry(1.4,1.9,4.2,12)],[new THREE.ConeGeometry(1.4,1.6,12),M4(0,2.9,0)],[new THREE.BoxGeometry(.4,3,.4),M4(1.6,0,0)],[new THREE.BoxGeometry(.4,3,.4),M4(-1.6,0,0)]]),pm);body.castShadow=true;g.add(body);
   const scorch=new THREE.Mesh(new THREE.CircleGeometry(7,24),new THREE.MeshBasicMaterial({color:0x0a0806,transparent:true,opacity:.65,depthWrite:false}));scorch.rotation.x=-Math.PI/2;scorch.position.y=-y+W.H(d.x,d.z)+.08;
   g.position.set(d.x,y+.6,d.z);g.rotation.set(.55,.4,.2);root.add(g);const s2=new THREE.Mesh(new THREE.CircleGeometry(7,24),scorch.material);s2.rotation.x=-Math.PI/2;s2.position.set(d.x,y+.1,d.z);root.add(s2);
   const fire=new THREE.PointLight(0xff7a30,30,16,1.6);fire.position.set(d.x,y+2,d.z);root.add(fire);anim.push(t=>fire.intensity=24+Math.sin(t*17)*6+Math.sin(t*7)*4);emit.push({p:new V(d.x,y+2.2,d.z),k:'fire'});}
  else if(d.type==='supply'){const g=new THREE.Mesh(merge([[new THREE.BoxGeometry(4,2.4,3),M4(0,1.2,0)],[new THREE.BoxGeometry(4.2,.3,3.2),M4(0,2.5,-1.6,-1.2)]]),M.hum);g.castShadow=true;g.position.set(d.x,y-.1,d.z+2.5);root.add(g);
   const b=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3,6),new THREE.MeshBasicMaterial({color:C(3,1.6,.3)}));b.position.set(d.x+2.4,y+1.5,d.z+2.5);root.add(b);emit.push({p:new V(d.x+2.4,y+3,d.z+2.5),k:'flare'});}
  else if(d.type==='spireTop'){const P=[[new THREE.CylinderGeometry(20,64,190,8),M4(0,95,d.z-30)],[new THREE.CylinderGeometry(4,20,90,8),M4(0,230,d.z-30)]];for(let i=0;i<4;i++){const a=i/4*6.28+.4;P.push([new THREE.BoxGeometry(6,150,10),M4(Math.cos(a)*48,70,d.z-30+Math.sin(a)*40,0,-a,Math.cos(a)*.25)]);}
   const m=new THREE.Mesh(merge(P),M.alienW);m.castShadow=false;root.add(m);const s=new THREE.Mesh(new THREE.CylinderGeometry(.6,.6,240,8,1,true),new THREE.MeshBasicMaterial({color:C(2,.6,3),transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false}));s.position.set(0,140,d.z-3.2);root.add(s);}
  else if(d.type==='lz'){const g=new THREE.Mesh(new THREE.CylinderGeometry(9,9.4,.3,32),M.hum);g.position.set(d.x,y,d.z);g.receiveShadow=true;root.add(g);for(let i=0;i<8;i++){const a=i/8*6.28;const l=new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.3),new THREE.MeshBasicMaterial({color:C(3,1.8,.4)}));l.position.set(d.x+Math.cos(a)*8.6,y+.2,d.z+Math.sin(a)*8.6);root.add(l);}}}
 // objective set pieces
 for(const o of D.objs){let m=null;
  if(o.type==='relay')m=relayModel(M);else if(o.type==='conduit')m=conduitModel(M);else if(o.type==='pylon')m=pylonModel(M);else if(o.type==='station')m=stationModel(M);else if(o.type==='barrier')m=barrierModel(o.r);else if(o.type==='lift')m=liftModel(M);
  if(m){m.position.copy(o.p);if(o.type==='barrier')m.position.y=o.p.y+13;root.add(m);o.mesh=m;}}
 // sky bake -> cube background + PMREM env
 const sky=skyScene(T,sunDir);const crt=new THREE.WebGLCubeRenderTarget(gfx>=2?1024:gfx===1?512:256,{type:THREE.HalfFloatType});const cc=new THREE.CubeCamera(1,20000,crt);cc.position.set(0,0,0);sky.add(cc);cc.update(R,sky);
 sky.traverse(o=>{if(o.geometry&&o!==cc)o.geometry.dispose();});const bgTex=crt.texture;
 const envScene=new THREE.Scene();envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{uC:{value:bgTex}},vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform samplerCube uC;varying vec3 vD;void main(){vec3 d=normalize(vD);vec3 c=textureCube(uC,d).rgb;if(d.y<0.)c=mix(c,vec3(.25,.2,.17),smoothstep(0.,-.3,d.y));gl_FragColor=vec4(c,1.);}'})));
 const pm=new THREE.PMREMGenerator(R);const env=pm.fromScene(envScene,.03).texture;pm.dispose();
 // lights
 const hemi=new THREE.HemisphereLight(T.hemi[0],T.hemi[1],T.hemi[2]);root.add(hemi);
 const sun=new THREE.DirectionalLight(T.sun[0],T.sun[1]);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const ext=def.theme==='spire'?70:62;Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:20,far:420});sun.shadow.bias=-.0005;sun.shadow.normalBias=.06;root.add(sun,sun.target);
 const pls=[];for(const l of D.lights){const p=new THREE.PointLight(l.c,l.i,l.d,1.5);p.position.copy(l.p);root.add(p);pls.push(p);}
 return{root,env,sun,sunDir,hemi,anim,theme:T,fog:new THREE.FogExp2(T.fog[0],T.fog[1]),bg:bgTex,solidMeshes,doors,emit,grass,pls,terr,
  follow(p){sun.position.set(p.x+sunDir.x*200,p.y+sunDir.y*200,p.z+sunDir.z*200);sun.target.position.copy(p);},update(t){for(const f of anim)f(t);}};}
