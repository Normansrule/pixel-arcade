// HARDFALL — dresses a map description: facade/roof/container/ground PBR sets, parapets, cars, street lamps, neon signs,
// a baked procedural sky (+ distant mesas or skyline) as background + environment, sun shadows and a wet-street mirror.
import * as THREE from '../vendor/three.module.min.js';
import {V,M4,merge,boxUV,ctex,rng} from './util.js';
import {panelSet,rockSet,glowTex,facadeSet,containerSet,groundSet,roofSet,hazardSet} from './tex.js';

const C=(r,g,b)=>new THREE.Color(r,g,b);
export const THEMES={
 dusk:{fog:[0xc89a78,.0052],hemi:[0xffd8b0,0x4a3428,.62],sun:[0xffc48a,2.9,[.72,.3,-.42]],exp:.92,bloom:.4,thr:.9,sat:1.06,tint:'#fff2e4',winI:.5,refl:0,
  mats:{asphalt:['ground','asphalt'],sand:['ground','sand'],conc:['ground','conc'],cliff:['rock',[178,122,86],[98,62,46]],
   facA:['fac','#a39280',{style:'glass',lit:.08,glass:'#3c4a54',sky:'#e8b48a'}],facB:['fac','#bba083',{style:'conc',lit:.12,ac:1}],facC:['fac','#7c8389',{style:'slot',lit:.04,stripe:'#b8582a'}],facD:['fac','#ad8670',{style:'conc',lit:.15,frame:'#2c2a28'}],facG:['fac','#7d8a96',{style:'glass',lit:.1}],
   deck:['panel','#615b54',{},.55,.6],steel:['panel','#76603e',{stripes:'#e0a020'},.45,.75],tank:['plain',0xd2c8b8,0,.45,.55],metal:['plain',0x5c5a58,0,.4,.85],conc2:['ground','conc'],wallBig:['rock',[178,122,86],[98,62,46]],
   barrier:['barrier'],hazard:['hazard'],roof:['roof'],cap:['plain',0x8a8478,0,.85,0],contR:['cont','#8c3324','HARDLINE'],contB:['cont','#2c5a8a','ORBITAL'],contG:['cont','#3d6a46',''],contY:['cont','#c8962a','KILN CO'],contW:['cont','#b8b4ac','']},
  trims:{c:C(.4,1.6,3),o:C(3.2,1.1,.25),m:C(2.6,.4,2.2)}},
 neon:{fog:[0x223050,.0105],hemi:[0x7890d0,0x141826,.5],sun:[0xa8beff,1.05,[-.38,.62,.32]],exp:1.18,bloom:.85,thr:.72,sat:1.1,tint:'#eef2ff',winI:2.4,refl:.62,
  mats:{asphalt:['ground','asphalt',{},.32,.1],conc:['ground','conc'],conc2:['ground','conc'],wallBig:['fac','#3a4048',{style:'slot',lit:.35}],
   facA:['fac','#59606c',{style:'conc',lit:.42,ac:1,frame:'#202226'}],facB:['fac','#6d6258',{style:'conc',lit:.5}],facC:['fac','#4c545c',{style:'slot',lit:.3}],facD:['fac','#5a4a52',{style:'slot',lit:.45,stripe:'#2a8ab8'}],facG:['fac','#40505e',{style:'glass',lit:.38,glass:'#1c2836',sky:'#4a5a80'}],
   deck:['panel','#4a505c',{},.5,.7],steel:['panel','#4c5260',{stripes:'#45d8ff'},.4,.8],tank:['plain',0x8a929c,0,.4,.6],metal:['plain',0x3c4048,0,.35,.85],sand:['ground','conc'],cliff:['rock',[90,90,100],[40,40,48]],
   barrier:['barrier'],hazard:['hazard'],roof:['roof'],cap:['plain',0x50545a,0,.85,0],contR:['cont','#7a2a2a','HARDLINE'],contB:['cont','#23507a','ORBITAL'],contG:['cont','#2f5a3a',''],contY:['cont','#a87a22','HALCYON'],contW:['cont','#8a8a88','']},
  trims:{c:C(.35,1.6,3.4),o:C(3.4,1,.3),m:C(3.2,.35,2)}}};

/* ---------- planar reflection (wet streets) ---------- */
export class Mirror{constructor(scale=.5){this.rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType});this.cam=new THREE.PerspectiveCamera();this.mat=new THREE.Matrix4();this.scale=scale;this.on=true;this.y=0;
  this.U={tRefl:{value:this.rt.texture},uTexMat:{value:this.mat},uReflStr:{value:.5},uMirY:{value:0}};}
 render(R,scene,cam,w,h,hide){if(!this.on)return;const rw=Math.max(4,w*this.scale|0),rh=Math.max(4,h*this.scale|0);if(this.rt.width!==rw||this.rt.height!==rh)this.rt.setSize(rw,rh);const Y=this.y;this.U.uMirY.value=Y;
  const vc=this.cam,d=new V(0,0,-1).applyQuaternion(cam.quaternion),up=new V(0,1,0).applyQuaternion(cam.quaternion);if(cam.position.y<Y+.05)return;
  vc.position.set(cam.position.x,2*Y-cam.position.y,cam.position.z);vc.up.set(up.x,-up.y,up.z);vc.lookAt(cam.position.x+d.x,2*Y-(cam.position.y+d.y),cam.position.z+d.z);
  vc.near=cam.near;vc.far=cam.far;vc.updateMatrixWorld();vc.projectionMatrix.copy(cam.projectionMatrix);
  this.mat.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
  const pl=new THREE.Plane(new V(0,1,0),-Y).applyMatrix4(vc.matrixWorldInverse),cp=new THREE.Vector4(pl.normal.x,pl.normal.y,pl.normal.z,pl.constant),pm=vc.projectionMatrix.elements;
  const q=new THREE.Vector4((Math.sign(cp.x)+pm[8])/pm[0],(Math.sign(cp.y)+pm[9])/pm[5],-1,(1+pm[10])/pm[14]);cp.multiplyScalar(2/cp.dot(q));pm[2]=cp.x;pm[6]=cp.y;pm[10]=cp.z+1-.003;pm[14]=cp.w;
  vc.layers.set(0);hide.forEach(o=>o.visible=false);const prev=R.getRenderTarget(),sh=R.shadowMap.autoUpdate;R.shadowMap.autoUpdate=false;R.setRenderTarget(this.rt);R.clear();R.render(scene,vc);R.setRenderTarget(prev);R.shadowMap.autoUpdate=sh;hide.forEach(o=>o.visible=true);}}
function reflective(mat,U){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform mat4 uTexMat;varying vec4 vRefl;varying vec3 vWP;varying vec3 vWN;').replace('#include <project_vertex>','#include <project_vertex>\nvec4 wpR=modelMatrix*vec4(transformed,1.);vRefl=uTexMat*wpR;vWP=wpR.xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tRefl;uniform float uReflStr,uMirY;varying vec4 vRefl;varying vec3 vWP;varying vec3 vWN;').replace('#include <opaque_fragment>',`
 if(vWN.y>.9&&abs(vWP.y-uMirY)<.05){vec2 ruv=vRefl.xy/vRefl.w;vec2 j=(normal.xy)*.03;
  vec3 rc=(texture2D(tRefl,ruv+j).rgb*.4+texture2D(tRefl,ruv+j+vec2(.004,0.)).rgb*.2+texture2D(tRefl,ruv+j-vec2(.004,0.)).rgb*.2+texture2D(tRefl,ruv+j+vec2(0.,.006)).rgb*.2);
  float fr=.3+.7*pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);float rough=texture2D(roughnessMap,vRoughnessMapUv).g;outgoingLight+=rc*uReflStr*fr*(1.25-rough);}
 #include <opaque_fragment>`);};mat.customProgramCacheKey=()=>'refl';return mat;}

/* ---------- geometry helpers ---------- */
function cylUV(g,R,scale){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)*scale,p.getZ(i)*scale);else uv.setXY(i,Math.atan2(p.getZ(i),p.getX(i))*R*scale,p.getY(i)*scale);}return g;}
function wedge(r){const{x0,z0,x1,z1,axis,dir,y0,y1}=r;const P=(u,w,y)=>axis==='x'?[u,y,w]:[w,y,u];const u0=axis==='x'?x0:z0,u1=axis==='x'?x1:z1,w0=axis==='x'?z0:x0,w1=axis==='x'?z1:x1;const lo=dir>0?u0:u1,hi=dir>0?u1:u0;
 const tri=[];const q=(a,b,c,d)=>tri.push(a,b,c,a,c,d);const A=P(lo,w0,y0),B=P(lo,w1,y0),Ct=P(hi,w1,y1),Dt=P(hi,w0,y1),Cb=P(hi,w1,y0),Db=P(hi,w0,y0);
 q(A,B,Ct,Dt);q(Db,Dt,Ct,Cb);tri.push(A,Dt,Db);tri.push(B,Cb,Ct);q(A,Db,Cb,B);
 const pos=new Float32Array(tri.length*3);tri.forEach((p,i)=>pos.set(p,i*3));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(tri.length*2),2));g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal,cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2;for(let i=0;i<p.count;i+=3){const mx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3-cx,my=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3-cy,mz=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3-cz;
  if(mx*n.getX(i)+my*n.getY(i)+mz*n.getZ(i)<0){const t=[p.getX(i+1),p.getY(i+1),p.getZ(i+1)];p.setXYZ(i+1,p.getX(i+2),p.getY(i+2),p.getZ(i+2));p.setXYZ(i+2,...t);}}
 g.computeVertexNormals();boxUV(g,.25);return g;}

/* ---------- materials ---------- */
const setCache={};
function makeMat(key,spec,T,mirror){const[k,a,b,rough,metal]=spec;let m;const id=key+JSON.stringify(spec);
 if(k==='plain')m=new THREE.MeshStandardMaterial({color:a,roughness:rough,metalness:metal});
 else if(k==='fac'){const s=setCache[id]||(setCache[id]=facadeSet(a,key.length*17+(T.winI>1?5:1),b));m=new THREE.MeshStandardMaterial({map:s.map,normalMap:s.normalMap,roughnessMap:s.roughnessMap,emissiveMap:s.emissiveMap,emissive:0xffffff,emissiveIntensity:T.winI,roughness:1,metalness:b.style==='glass'?.35:.05,normalScale:new THREE.Vector2(.8,.8)});m.userData.uv=1/16;}
 else if(k==='cont'){const s=setCache[id]||(setCache[id]=containerSet(a,key.length*5+3,b));m=new THREE.MeshStandardMaterial({...s,roughness:.6,metalness:.45});}
 else if(k==='ground'){const s=setCache[id]||(setCache[id]=groundSet(a,key.length*7+1));m=new THREE.MeshStandardMaterial({...s,roughness:rough??1,metalness:metal??0});if(mirror&&key==='asphalt'&&T.refl){reflective(m,mirror.U);mirror.U.uReflStr.value=T.refl;m.userData.mirror=true;}}
 else if(k==='rock'){const s=setCache[id]||(setCache[id]=rockSet(a,b,key.length*7));m=new THREE.MeshStandardMaterial({...s,roughness:1,metalness:0});m.userData.uv=.08;}
 else if(k==='roof'){const s=setCache.roof||(setCache.roof=roofSet());m=new THREE.MeshStandardMaterial({...s,roughness:.95,metalness:0});}
 else if(k==='hazard'){const s=hazardSet();m=new THREE.MeshStandardMaterial({...s,roughness:.6,metalness:.3});}
 else if(k==='barrier'){const s=setCache.bar||(setCache.bar=groundSet('conc',77));m=new THREE.MeshStandardMaterial({map:s.map,normalMap:s.normalMap,color:0xd8d2c8,roughness:.9});}
 else{const s=setCache[id]||(setCache[id]=panelSet(a,key.length*13+7,b));m=new THREE.MeshStandardMaterial({...s,roughness:rough,metalness:metal});}
 return m;}

/* ---------- skies (baked once into a cube map) ---------- */
const SKYV='varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}';
const NOISE=`float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=vn(p)*a;p*=2.03;a*=.5;}return s;}
float stars(vec3 d,float dens){vec3 q=d*dens;vec3 id=floor(q);float s=h3(id);vec3 f=fract(q)-.5-(vec3(h3(id+3.),h3(id+5.),h3(id+7.))-.5)*.6;return step(.965,s)*smoothstep(.09,0.,length(f))*(.4+1.6*h3(id+1.));}`;
function skyMat(theme,sunDir){const U={uSun:{value:sunDir.clone()}};let f;
 if(theme==='dusk')f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;float sd=max(dot(d,uSun),0.);
  vec3 zen=vec3(.09,.17,.38),mid=vec3(.42,.42,.55),hor=vec3(1.25,.66,.34);vec3 c=mix(hor,mid,smoothstep(0.,.18,y));c=mix(c,zen,smoothstep(.12,.7,y));c=mix(c,vec3(.55,.36,.26),smoothstep(0.,-.15,y));
  c+=vec3(1.2,.55,.2)*pow(sd,5.)*.55*(1.-smoothstep(.0,.5,y));
  vec2 cp=d.xz/(y+.12);float cl=fbm(vec3(cp.x*1.6,cp.y*5.,1.3));float cl2=fbm(vec3(cp*3.1,4.));float cm=smoothstep(.5,.78,cl*.8+cl2*.35)*smoothstep(.02,.25,y)*(1.-smoothstep(.55,.9,y));
  vec3 lit=mix(vec3(.55,.32,.3),vec3(1.5,.82,.45),pow(sd,2.)*.8+.2);c=mix(c,lit*(.75+cl2*.4),cm*.85);
  c+=vec3(1.,.85,.6)*(pow(sd,900.)*26.+pow(sd,60.)*.5);gl_FragColor=vec4(c,1.);}`;
 else f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;
  vec3 zen=vec3(.008,.014,.045),hor=vec3(.08,.1,.22);vec3 c=mix(hor,zen,pow(clamp(y,0.,1.),.5));
  float glow=exp(-max(y,0.)*9.);c+=vec3(.55,.22,.42)*glow*.55+vec3(.2,.35,.6)*glow*.25;c=mix(c,vec3(.05,.06,.12),smoothstep(0.,-.1,y));
  c+=vec3(.9,.95,1.)*stars(d,300.)*smoothstep(.1,.5,y)*.9;
  vec2 cp=d.xz/(y+.1);float cl=fbm(vec3(cp*1.4,2.));c=mix(c,vec3(.16,.14,.24)+vec3(.4,.2,.3)*glow,smoothstep(.5,.8,cl)*smoothstep(.04,.3,y)*.7);
  float m=dot(d,uSun);c=mix(c,vec3(1.1,1.08,1.)*(.8+fbm(d*70.)*.3),smoothstep(.9992,.9994,m));c+=vec3(.5,.6,.9)*pow(max(m,0.),80.)*.4;gl_FragColor=vec4(c,1.);}`;
 return new THREE.ShaderMaterial({uniforms:U,vertexShader:SKYV,fragmentShader:f,side:THREE.BackSide,depthWrite:false,fog:false});}
function mesas(){const r=rng(31),parts=[];for(let i=0;i<70;i++){const a=r()*Math.PI*2,dist=380+r()*600,w=50+r()*110,h=26+r()*80;const g=new THREE.CylinderGeometry(w*.75,w,h,6+(r()*4|0));parts.push([g,M4(Math.cos(a)*dist,h/2-10,Math.sin(a)*dist,0,r()*3,0)]);
  const g2=new THREE.CylinderGeometry(w*1.1,w*1.5,h*.3,7);parts.push([g2,M4(Math.cos(a)*dist,h*.15-10,Math.sin(a)*dist,0,r()*3,0)]);}
 return new THREE.Mesh(merge(parts),new THREE.MeshStandardMaterial({color:0x9a6650,roughness:1,emissive:0x1a0c08}));}
function skyline(){const r=rng(9),parts=[];for(let i=0;i<170;i++){const a=r()*Math.PI*2,dist=420+r()*520,w=24+r()*46,h=30+r()*(r()<.18?190:80);const g=new THREE.BoxGeometry(w,h,w*(.6+r()*.8));g.translate(0,h/2,0);parts.push([g,M4(Math.cos(a)*dist,-14,Math.sin(a)*dist,0,r()*3,0)]);}
 const tx=ctex(256,256,(x,w,h)=>{x.fillStyle='#070a12';x.fillRect(0,0,w,h);for(let j=0;j<h;j+=8)for(let i=0;i<w;i+=6)if(Math.random()<.22){x.fillStyle=Math.random()<.7?'#ffcf8a':Math.random()<.5?'#9fd8ff':'#ff7ac8';x.globalAlpha=.35+Math.random()*.6;x.fillRect(i,j,3,4);}x.globalAlpha=1;});
 const g=merge(parts);boxUV(g,.016);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:tx,color:new THREE.Color(1.3,1.3,1.4)}));return m;}

/* ---------- props ---------- */
const CARC=[0x2e5ea8,0xb8442c,0xd8d4cc,0x2a2c30,0x6a8a50];
function cars(list){const parts=[],glass=[],lamps=[],wheels=[];for(const c of list){const rot=c.rot?Math.PI/2:0,col=new THREE.Color(CARC[c.c%CARC.length]);
  const P=(g,x,y,z)=>{g.translate(x,y,z);g.rotateY(rot);g.translate(c.x,0,c.z);return g;};
  parts.push([P(new THREE.BoxGeometry(4.3,.7,1.85),0,.62,0),null,col]);parts.push([P(new THREE.BoxGeometry(2.3,.55,1.65),-.25,1.22,0),null,col]);
  glass.push([P(new THREE.BoxGeometry(2.36,.4,1.6),-.25,1.24,0)]);
  for(const[x,z]of[[1.35,.85],[1.35,-.85],[-1.35,.85],[-1.35,-.85]]){const w=new THREE.CylinderGeometry(.36,.36,.26,14);w.rotateX(Math.PI/2);wheels.push([P(w,x,.36,z)]);}
  for(const z of[.6,-.6]){lamps.push([P(new THREE.BoxGeometry(.06,.14,.36),2.16,.75,z),null,new THREE.Color(2.4,2.2,1.8)]);lamps.push([P(new THREE.BoxGeometry(.06,.12,.32),-2.16,.75,z),null,new THREE.Color(3,.2,.15)]);}}
 const g=new THREE.Group();if(!list.length)return g;
 const body=new THREE.Mesh(merge(parts),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.25,metalness:.6}));body.castShadow=body.receiveShadow=true;g.add(body);
 g.add(new THREE.Mesh(merge(glass),new THREE.MeshStandardMaterial({color:0x101418,roughness:.05,metalness:.9})));const wm=new THREE.Mesh(merge(wheels),new THREE.MeshStandardMaterial({color:0x111111,roughness:.8}));wm.castShadow=true;g.add(wm);
 g.add(new THREE.Mesh(merge(lamps),new THREE.MeshBasicMaterial({vertexColors:true})));return g;}
function lamps(list,T,glow){const parts=[],heads=[],g=new THREE.Group();const sp=[];
 for(const l of list){const dx=l.dx*1.4,dz=l.dz*1.4,ry=Math.atan2(l.dx,l.dz)+Math.PI/2;parts.push([new THREE.BoxGeometry(1.6,.12,.12),M4(l.x+dx/2,l.h-.1,l.z+dz/2,0,ry,0)]);heads.push([new THREE.BoxGeometry(.7,.12,.32),M4(l.x+dx,l.h-.22,l.z+dz,0,ry,0)]);sp.push(new V(l.x+dx,l.h-.35,l.z+dz));}
 if(!list.length)return g;const pm=new THREE.Mesh(merge(parts),new THREE.MeshStandardMaterial({color:0x3a3c40,roughness:.4,metalness:.8}));pm.castShadow=true;g.add(pm);
 const warm=T.winI>1?new THREE.Color(2.6,2.2,1.7):new THREE.Color(2.2,1.6,1);g.add(new THREE.Mesh(merge(heads),new THREE.MeshBasicMaterial({color:warm})));
 if(T.winI>1){// light pools on the street (cheap: additive discs)
  const disc=new THREE.MeshBasicMaterial({map:glow,color:warm.clone().multiplyScalar(.16),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});for(const p of sp){const d=new THREE.Mesh(new THREE.PlaneGeometry(9,9),disc);d.rotation.x=-Math.PI/2;d.position.set(p.x,.04,p.z);d.renderOrder=1;g.add(d);}}
 return g;}
function signs(list,T){const g=new THREE.Group();for(const s of list){const W=s.w,H=W*.26;const tx=ctex(512,128,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.font='88px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#fff';x.shadowBlur=16;x.fillStyle='#fff';x.fillText(s.text,w/2,h/2+5);x.shadowBlur=0;x.strokeStyle='rgba(255,255,255,.6)';x.lineWidth=4;x.strokeRect(10,10,w-20,h-20);},{clamp:true});
  const k=T.winI>1?3.2:2.2;const m=new THREE.Mesh(new THREE.PlaneGeometry(W,H),new THREE.MeshBasicMaterial({map:tx,color:new THREE.Color(s.col).multiplyScalar(k),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  m.position.set(s.x+Math.sin(s.face)*.08,s.y,s.z+Math.cos(s.face)*.08);m.rotation.y=s.face;m.renderOrder=3;g.add(m);
  const bk=new THREE.Mesh(new THREE.BoxGeometry(W+.3,H+.3,.12),new THREE.MeshStandardMaterial({color:0x14161a,roughness:.5,metalness:.7}));bk.position.set(s.x,s.y,s.z);bk.rotation.y=s.face;g.add(bk);}return g;}

/* ---------- build ---------- */
export function buildScene(D,R,gfx){const def=D.def,T=THEMES[def.theme],root=new THREE.Group(),anim=[];
 const sunDir=new V(...T.sun[2]).normalize();
 const mirror=new Mirror(.5);mirror.on=!!T.refl;const mats={};const mat=k=>mats[k]||(mats[k]=makeMat(k,T.mats[k]||T.mats.deck,T,mirror));
 const buckets={},trims={};const add=(b,g)=>(buckets[b]||(buckets[b]=[])).push([g]);const trim=(k,g)=>(trims[k]||(trims[k]=[])).push([g]);
 for(const s of D.solids){if(s.o.novis||s.mat==='none')continue;const h=s.b[1]-s.a[1];const sc=mat(s.mat).userData.uv||.25;
  if(s.c){const g=new THREE.CylinderGeometry(s.R,s.R,h,Math.max(16,Math.min(48,s.R*10|0)),1);g.translate(s.cx,s.a[1]+h/2,s.cz);cylUV(g,s.R,sc);add(s.mat,g);
   if(s.o.trim){const t=new THREE.TorusGeometry(s.R+.015,.05,6,Math.max(24,s.R*12|0));t.rotateX(Math.PI/2);t.translate(s.cx,s.b[1]-.15,s.cz);trim(s.o.trim,t);}continue;}
  const w=s.b[0]-s.a[0],d=s.b[2]-s.a[2],cx=(s.a[0]+s.b[0])/2,cz=(s.a[2]+s.b[2])/2;
  if(s.o.bar){// jersey barrier profile
   const sh=new THREE.Shape();const L=s.o.rot?d:w;sh.moveTo(-.35,0);sh.lineTo(.35,0);sh.lineTo(.3,.2);sh.lineTo(.13,.45);sh.lineTo(.11,h);sh.lineTo(-.11,h);sh.lineTo(-.13,.45);sh.lineTo(-.3,.2);sh.lineTo(-.35,0);
   const g=new THREE.ExtrudeGeometry(sh,{depth:L,bevelEnabled:false});g.translate(0,0,-L/2);if(!s.o.rot)g.rotateY(Math.PI/2);g.translate(cx,s.a[1],cz);boxUV(g,.5);add('barrier',g);continue;}
  const g=new THREE.BoxGeometry(w,h,d);g.translate(cx,s.a[1]+h/2,cz);boxUV(g,sc);
  if(s.o.cont){// shift the UV so each container shows its whole label
   const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)+.5-(s.o.rot?cz:cx)*.25);}
  add(s.mat,g);
  if(s.o.roof){const top=s.b[1];const rg=new THREE.BoxGeometry(w-.1,.1,d-.1);rg.translate(cx,top+.04,cz);boxUV(rg,.25);add('roof',rg);
   for(const[sx,sz,len,rot]of[[0,d/2-.15,w,0],[0,-d/2+.15,w,0],[w/2-.15,0,d-.6,1],[-w/2+.15,0,d-.6,1]]){const p=new THREE.BoxGeometry(rot?.3:len,.5,rot?len:.3);p.translate(cx+sx,top+.25,cz+sz);add('cap',p);}
   // roof clutter: vents / AC boxes (visual only, low)
   const r=rng((cx*13+cz*7)|0);for(let k=0;k<2+(w*d/60|0)&&k<6;k++){const bw=.8+r()*1.6,bd=.8+r()*1.4,bh=.4+r()*.7;const x=cx+(r()-.5)*(w-4),z=cz+(r()-.5)*(d-4);const b=new THREE.BoxGeometry(bw,bh,bd);b.translate(x,top+bh/2,z);boxUV(b,.5);add('metal',b);}}
  if(s.o.trim){const y=s.b[1]-.1;for(const[sx,sz,len,rot]of[[0,d/2+.012,w-.12,0],[0,-d/2-.012,w-.12,0],[w/2+.012,0,d-.12,1],[-w/2-.012,0,d-.12,1]]){if(len<.2)continue;const t=new THREE.BoxGeometry(rot?.03:len,.07,rot?len:.03);t.translate(cx+sx,y,cz+sz);trim(s.o.trim,t);}}}
 for(const r of D.ramps){add(r.mat,wedge(r));if(r.o&&r.o.trim){const L=r.axis==='x'?r.x1-r.x0:r.z1-r.z0,rise=r.y1-r.y0,len=Math.hypot(L,rise),ang=Math.atan2(rise,L)*r.dir;
   for(const w of r.axis==='x'?[r.z0-.012,r.z1+.012]:[r.x0-.012,r.x1+.012]){const t=new THREE.BoxGeometry(len,.06,.03);if(r.axis==='x'){t.rotateZ(ang);t.translate((r.x0+r.x1)/2,(r.y0+r.y1)/2-.05,w);}else{t.rotateZ(ang);t.rotateY(Math.PI/2);t.translate(w,(r.y0+r.y1)/2-.05,(r.z0+r.z1)/2);}trim(r.o.trim,t);}}}
 const solidMeshes=[],winMats=[];for(const k in buckets){const m=new THREE.Mesh(merge(buckets[k]),mat(k));m.castShadow=!/^(asphalt|sand|conc|cliff|wallBig)$/.test(k);m.receiveShadow=true;root.add(m);solidMeshes.push(m);if(mat(k).emissiveMap)winMats.push(mat(k));}
 for(const k in trims){const m=new THREE.Mesh(merge(trims[k]),new THREE.MeshBasicMaterial({color:T.trims[k]||T.trims.c}));root.add(m);}
 const glow=glowTex();
 root.add(cars(D.deco.filter(d=>d.type==='car')));root.add(lamps(D.lamps,T,glow));root.add(signs(D.signs,T));
 // sky + far set pieces baked into a cube map
 const skyScene=new THREE.Scene();const sky=new THREE.Mesh(new THREE.SphereGeometry(5000,48,24),skyMat(def.theme,sunDir));sky.frustumCulled=false;skyScene.add(sky);
 if(def.theme==='dusk'){skyScene.add(mesas());const h=new THREE.HemisphereLight(0xffc8a0,0x402018,1.2);const dl=new THREE.DirectionalLight(0xffb070,1.6);dl.position.copy(sunDir);skyScene.add(h,dl);skyScene.fog=new THREE.Fog(0xd09878,250,1100);}
 else{skyScene.add(skyline());skyScene.fog=new THREE.Fog(0x1a2444,300,1100);}
 const crt=new THREE.WebGLCubeRenderTarget(gfx>=2?1024:512,{type:THREE.HalfFloatType});const cc=new THREE.CubeCamera(1,20000,crt);cc.position.set(0,6,0);skyScene.add(cc);cc.update(R,skyScene);
 skyScene.traverse(o=>{if(o.geometry&&o!==cc)o.geometry.dispose();});const bgTex=crt.texture;
 const envScene=new THREE.Scene();envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{uC:{value:bgTex}},vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform samplerCube uC;varying vec3 vD;void main(){gl_FragColor=vec4(textureCube(uC,normalize(vD)).rgb,1.);}'})));
 if(def.theme==='neon')for(const[x,c]of[[-50,0xff3d9a],[50,0x45d8ff],[0,0xffb040]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(40,6),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.5),side:THREE.DoubleSide}));p.position.set(x,20,0);p.rotation.x=Math.PI/2;envScene.add(p);}
 const pm=new THREE.PMREMGenerator(R);const env=pm.fromScene(envScene,.03).texture;pm.dispose();
 // lights
 const hemi=new THREE.HemisphereLight(T.hemi[0],T.hemi[1],T.hemi[2]);root.add(hemi);
 const sun=new THREE.DirectionalLight(T.sun[0],T.sun[1]);const[b0,b1,b2,b3]=def.bounds,ext=Math.max(b1-b0,b3-b2)/2+8;
 sun.position.set(sunDir.x*160,sunDir.y*160,sunDir.z*160);sun.target.position.set(0,0,0);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:20,far:360});sun.shadow.bias=-.0005;sun.shadow.normalBias=.08;root.add(sun,sun.target);
 for(const l of D.lights){const p=new THREE.PointLight(l.c,l.i,l.d,1.6);p.position.copy(l.p);root.add(p);}
 return{root,env,sun,hemi,mirror,anim,sky,theme:T,fog:new THREE.FogExp2(T.fog[0],T.fog[1]),bg:bgTex,solidMeshes,glow,winMats,update(t){for(const f of anim)f(t);}};}
