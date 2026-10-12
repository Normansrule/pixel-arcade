// NOVA ARENA — dresses a map description with themed PBR materials, neon trims, skies, set pieces and a planar floor mirror.
import * as THREE from '../vendor/three.module.min.js';
import {V,M4,merge,boxUV,ctex,rng} from './util.js';
import {panelSet,floorSet,rockSet,grateSet,crateSet,hexTex,glowTex} from './tex.js';

const C=(r,g,b)=>new THREE.Color(r,g,b);
export const THEMES={
 space:{bg:0x02030a,fog:[0x0a0e1c,.0028],hemi:[0x8090c0,0x1a1620,.5],sun:[0xfff2e2,2.4,[-.45,.75,.35]],exp:1.02,bloom:.62,thr:.86,sat:1.06,tint:'#f2f6ff',
  mats:{floor:['floor','#1a202c',{inlay:'#2b4a66'},.16,.55,.55],deck:['panel','#434a59',{},.5,.75],wall:['panel','#525a6a',{stripes:'#d8a020'},.5,.7],hull:['panel','#3a404c',{},.55,.75],metal:['plain',0x8d96a8,0,.28,1],
   plat:['panel','#5c6476',{},.35,.8],crate:['crate','#38404e','#ff4d00'],barrier:['panel','#2e3440',{stripes:'#ff4d00'},.45,.6],rail:['plain',0x23272f,0,.35,.9],reactor:['grate','#40d0ff']},
  trims:{c:C(.35,1.5,3.2),o:C(3.4,.95,.16),m:C(2.4,.35,2.6),b:C(.3,.85,3.4),k:C(2.4,1.25,.3)}},
 canyon:{bg:0x14061a,fog:[0x2a0c26,.0075],hemi:[0xc070b0,0x2a1410,.55],sun:[0xff9a60,1.7,[.6,.32,-.4]],exp:1.08,bloom:.72,thr:.8,sat:1.12,tint:'#fff0f4',
  mats:{floor:['floor','#241a22',{inlay:'#4a2440'},.22,.35,.45],deck:['panel','#4a4250',{},.5,.7],wall:['panel','#4e4656',{},.5,.7],base:['panel','#3e3a48',{stripes:'#ff3d7f'},.45,.7],metal:['plain',0x8a7f90,0,.3,1],
   rock:['rock',[150,62,58],[58,22,34]],riverbed:['rock',[96,58,70],[34,18,28]],crate:['crate','#3a3240','#ff3d7f'],barrier:['panel','#30283a',{stripes:'#ff3d7f'},.45,.6],rail:['plain',0x28202c,0,.35,.9],plat:['panel','#5a5060',{},.4,.8]},
  trims:{c:C(.3,1.6,3.2),o:C(3.4,.9,.15),m:C(3.2,.25,1.8),b:C(.3,.85,3.4),k:C(3,.5,1.4)}},
 sky:{bg:0x8fc4f0,fog:[0xa8c6e6,.0022],hemi:[0xbcd4ff,0x3a4050,.5],sun:[0xfff0d8,2.2,[.35,.82,.3]],exp:.74,bloom:.32,thr:.96,sat:1.14,tint:'#fff8f0',
  mats:{floor:['floor','#7d889a',{inlay:'#4f6d92'},.14,.35,.42],deck:['panel','#6f7888',{},.42,.6],wall:['panel','#7c8494',{},.42,.55],metal:['plain',0x9aa2ae,0,.22,1],plat:['panel','#8a93a3',{},.32,.55],
   crate:['crate','#5c6470','#2f8cff'],barrier:['panel','#5a6372',{stripes:'#2f8cff'},.4,.5],rail:['plain',0x7a808a,0,.25,1],rockF:['rock',[110,100,92],[52,48,50]]},
  trims:{c:C(.3,1.7,3.4),o:C(3.4,1.1,.2),m:C(2.6,.6,3.2),b:C(.3,.9,3.4),k:C(2.6,1.6,.5)}}};

/* ---------- planar reflection for the main floor ---------- */
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
 if(vWN.y>.9&&abs(vWP.y-uMirY)<.05){vec2 ruv=vRefl.xy/vRefl.w;vec2 j=(normal.xy)*.02;
  vec3 rc=(texture2D(tRefl,ruv+j).rgb*.4+texture2D(tRefl,ruv+j+vec2(.003,0.)).rgb*.2+texture2D(tRefl,ruv+j-vec2(.003,0.)).rgb*.2+texture2D(tRefl,ruv+j+vec2(0.,.004)).rgb*.2);
  float fr=.35+.65*pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);float rough=texture2D(roughnessMap,vRoughnessMapUv).g;outgoingLight+=rc*uReflStr*fr*(1.2-rough);}
 #include <opaque_fragment>`);};mat.customProgramCacheKey=()=>'refl';return mat;}

/* ---------- geometry helpers ---------- */
function cylUV(g,R,scale){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)*scale,p.getZ(i)*scale);else uv.setXY(i,Math.atan2(p.getZ(i),p.getX(i))*R*scale,p.getY(i)*scale);}return g;}
function wedge(r){const{x0,z0,x1,z1,axis,dir,y0,y1}=r;// world-space wedge, flat base at y0
 const P=(u,w,y)=>axis==='x'?[u,y,w]:[w,y,u];const u0=axis==='x'?x0:z0,u1=axis==='x'?x1:z1,w0=axis==='x'?z0:x0,w1=axis==='x'?z1:x1;const lo=dir>0?u0:u1,hi=dir>0?u1:u0;
 const tri=[];const q=(a,b,c,d)=>tri.push(a,b,c,a,c,d);
 const A=P(lo,w0,y0),B=P(lo,w1,y0),Ct=P(hi,w1,y1),Dt=P(hi,w0,y1),Cb=P(hi,w1,y0),Db=P(hi,w0,y0);
 q(A,B,Ct,Dt);q(Db,Dt,Ct,Cb);tri.push(A,Dt,Db);tri.push(B,Cb,Ct);q(A,Db,Cb,B);
 const pos=new Float32Array(tri.length*3);tri.forEach((p,i)=>pos.set(p,i*3));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(tri.length*2),2));g.computeVertexNormals();
 // make each face wind outward: flip if normal points inward
 const p=g.attributes.position,n=g.attributes.normal,cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2;for(let i=0;i<p.count;i+=3){const mx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3-cx,my=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3-cy,mz=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3-cz;
  if(mx*n.getX(i)+my*n.getY(i)+mz*n.getZ(i)<0){const t=[p.getX(i+1),p.getY(i+1),p.getZ(i+1)];p.setXYZ(i+1,p.getX(i+2),p.getY(i+2),p.getZ(i+2));p.setXYZ(i+2,...t);}}
 g.computeVertexNormals();boxUV(g,.25);return g;}

/* ---------- materials ---------- */
const setCache={};
function makeMat(key,spec,mirror){const[k,a,b,rough,metal,refl]=spec;let m;const id=key+JSON.stringify(spec);
 if(k==='plain')m=new THREE.MeshStandardMaterial({color:a,roughness:rough,metalness:metal});
 else if(k==='grate'){const s=grateSet(a);m=new THREE.MeshStandardMaterial({map:s.map,emissiveMap:s.emissiveMap,emissive:0xffffff,emissiveIntensity:2.2,roughness:.4,metalness:.7});}
 else if(k==='crate'){const s=setCache[id]||(setCache[id]=crateSet(a,b));m=new THREE.MeshStandardMaterial({...s,roughness:.55,metalness:.45});}
 else if(k==='rock'){const s=setCache[id]||(setCache[id]=rockSet(a,b,key.length*7));m=new THREE.MeshStandardMaterial({...s,roughness:1,metalness:0});}
 else if(k==='floor'){const s=floorSet(a,'#07080b',3,b);m=new THREE.MeshStandardMaterial({...s,roughness:rough,metalness:metal});if(mirror){reflective(m,mirror.U);mirror.U.uReflStr.value=refl??.5;}}
 else{const s=setCache[id]||(setCache[id]=panelSet(a,key.length*13+7,b));m=new THREE.MeshStandardMaterial({...s,roughness:rough,metalness:metal});}
 return m;}

/* ---------- skies ---------- */
const SKYV='varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}';
const NOISE=`float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=vn(p)*a;p*=2.03;a*=.5;}return s;}
float stars(vec3 d,float dens){vec3 q=d*dens;vec3 id=floor(q);float s=h3(id);vec3 f=fract(q)-.5-(vec3(h3(id+3.),h3(id+5.),h3(id+7.))-.5)*.6;return step(.965,s)*smoothstep(.09,0.,length(f))*(.4+1.6*h3(id+1.));}`;
function skyMat(theme,sunDir){const U={uSun:{value:sunDir.clone()},uT:{value:0}};let f;
 if(theme==='space')f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);
  float n=fbm(d*2.2+vec3(3.)),n2=fbm(d*5.+vec3(9.));vec3 neb=vec3(.10,.03,.16)*smoothstep(.45,.85,n)+vec3(.02,.07,.14)*smoothstep(.5,.9,n2);
  float band=exp(-pow(dot(d,normalize(vec3(.3,.5,-.8)))*3.2,2.));vec3 c=vec3(.004,.006,.014)+neb*1.4+vec3(.05,.045,.07)*band*n2;
  c*=.55;c+=vec3(1.,.95,.9)*stars(d,320.)*1.6+vec3(.8,.85,1.)*stars(d,140.)*.9*band;
  float sd=max(dot(d,uSun),0.);c+=vec3(1.,.9,.75)*(pow(sd,900.)*30.+pow(sd,12.)*.25+pow(sd,3.)*.05);gl_FragColor=vec4(c,1.);}`;
 else if(theme==='canyon')f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;
  vec3 top=vec3(.03,.012,.08),mid=vec3(.32,.05,.26),hor=vec3(1.2,.36,.16);vec3 c=mix(hor,mid,smoothstep(-.02,.16,y));c=mix(c,top,smoothstep(.12,.6,y));c=mix(c,vec3(.12,.03,.1),smoothstep(0.,-.2,y));
  c+=vec3(1.,.9,1.)*stars(d,260.)*smoothstep(.15,.5,y)*1.2;float cl=fbm(vec3(d.x*4.,d.y*14.,d.z*4.));c=mix(c,c*.55+vec3(.25,.05,.15),smoothstep(.55,.75,cl)*smoothstep(.35,.05,abs(y-.12)));
  vec3 md=normalize(vec3(-.5,.42,.75));float m=dot(d,md);float disc=smoothstep(.9988,.999,m);float cr=fbm(d*60.);c=mix(c,vec3(1.1,.95,1.)*(.75+cr*.4),disc);c+=vec3(.9,.5,.8)*pow(max(m,0.),60.)*.35;
  float sd=max(dot(d,uSun),0.);c+=vec3(1.4,.5,.2)*pow(sd,8.)*.5;gl_FragColor=vec4(c,1.);}`;
 else f=`${NOISE}uniform vec3 uSun;varying vec3 vD;void main(){vec3 d=normalize(vD);float y=d.y;
  vec3 zen=vec3(.08,.24,.68),hor=vec3(.5,.68,.95),low=vec3(.7,.78,.9);vec3 c=mix(hor,zen,pow(clamp(y,0.,1.),.55));c=mix(c,low,smoothstep(0.,-.12,y));
  float cl=fbm(vec3(d.xz/(abs(y)+.2)*2.,1.));c=mix(c,vec3(1.),smoothstep(.55,.8,cl)*smoothstep(.02,.3,y)*.55);
  float sd=max(dot(d,uSun),0.);c+=vec3(1.,.9,.7)*(pow(sd,1200.)*40.+pow(sd,60.)*.6+pow(sd,6.)*.16);gl_FragColor=vec4(c,1.);}`;
 return new THREE.ShaderMaterial({uniforms:U,vertexShader:SKYV,fragmentShader:f,side:THREE.BackSide,depthWrite:false,fog:false});}

function planet(sunDir){const g=new THREE.Group();const U={uSun:{value:sunDir}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.ShaderMaterial({uniforms:U,fog:false,vertexShader:'varying vec3 vN,vP,vW;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=normalize(w.xyz-cameraPosition);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`${NOISE}uniform vec3 uSun;varying vec3 vN,vP,vW;void main(){float n=fbm(vP*3.),c2=fbm(vP*6.+vec3(4.));float land=smoothstep(.5,.53,n);
   vec3 col=mix(vec3(.02,.08,.22),vec3(.05,.16,.32),fbm(vP*9.));col=mix(col,mix(vec3(.18,.24,.1),vec3(.42,.34,.22),c2),land);col=mix(col,vec3(.92,.94,1.),smoothstep(.82,.95,abs(vP.y)));
   float cl=smoothstep(.5,.72,fbm(vP*4.5+vec3(1.,2.,3.)));col=mix(col,vec3(1.),cl*.85);
   float l=dot(vN,uSun);vec3 c=col*smoothstep(-.12,.4,l)*1.1;c+=vec3(1.,.55,.25)*.25*smoothstep(-.15,0.,l)*smoothstep(.15,0.,l)*land;
   c+=vec3(1.,.8,.4)*.12*(1.-land)*smoothstep(.1,0.,l)*smoothstep(-.12,0.,l);float rim=pow(1.-abs(dot(vN,-vW)),3.);c+=vec3(.3,.55,1.)*rim*smoothstep(-.3,.3,l)*.9;gl_FragColor=vec4(c,1.);}`}));
 const at=new THREE.Mesh(new THREE.SphereGeometry(1.035,64,48),new THREE.ShaderMaterial({uniforms:U,fog:false,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.BackSide,
  vertexShader:'varying vec3 vN,vW;void main(){vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=normalize(w.xyz-cameraPosition);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform vec3 uSun;varying vec3 vN,vW;void main(){float r=pow(1.-abs(dot(vN,vW)),1.6);float l=smoothstep(-.4,.4,dot(-vN,uSun));gl_FragColor=vec4(vec3(.25,.5,1.)*r*l*1.4,1.);}'}));
 g.add(m,at);return g;}

function ringStructure(){// the orbital ring this station rides on, arcing overhead
 const R=1500,tex=ctex(1024,64,(x,w,h)=>{x.fillStyle='#0b0e15';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=8)for(let j=6;j<h-6;j+=7)if(Math.random()<.35){x.fillStyle=Math.random()<.85?'#ffd9a0':'#9fd8ff';x.fillRect(i,j,4,3);}x.fillStyle='#ff4d00';x.fillRect(0,2,w,2);x.fillRect(0,h-4,w,2);});
 tex.repeat.set(40,1);const em=tex.clone();em.repeat.set(40,1);
 const g=new THREE.Group(),d=.07;const geo=new THREE.TorusGeometry(R,26,10,320,Math.PI*2-2*d);geo.scale(1,1,1);
 const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x6a7080,map:tex,emissiveMap:em,emissive:0xffffff,emissiveIntensity:1.6,roughness:.5,metalness:.8,fog:false}));
 m.rotation.z=-Math.PI/2+d;m.scale.set(1,1,3.4);m.position.y=R-40;g.add(m);
 // spokes to a distant hub
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(90,90,160,32),new THREE.MeshStandardMaterial({color:0x4a5060,roughness:.4,metalness:.9,emissive:0x203040,fog:false}));hub.rotation.x=Math.PI/2;hub.position.y=R-40;g.add(hub);
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.5;const s=new THREE.Mesh(new THREE.CylinderGeometry(6,6,R-80,8),new THREE.MeshStandardMaterial({color:0x3a4050,roughness:.5,metalness:.9,fog:false}));s.position.set(Math.cos(a)*(R/2),R-40+Math.sin(a)*(R/2),0);s.rotation.z=a+Math.PI/2;g.add(s);}
 return g;}

/* ---------- build ---------- */
export function buildScene(D,R,gfx){const def=D.def,TH=THEMES[def.theme],root=new THREE.Group(),anim=[];const T=TH;
 const sunDir=new V(...T.sun[2]).normalize();
 // materials
 const mirror=new Mirror(.5);mirror.y=def.mirrorY??0;const mats={};const mat=k=>mats[k]||(mats[k]=makeMat(k,T.mats[k]||T.mats.wall,k==='floor'?mirror:null));
 const glassM=new THREE.MeshStandardMaterial({color:def.theme==='sky'?0xd8ecff:0x8fb8e8,roughness:.04,metalness:.9,transparent:true,opacity:.14,envMapIntensity:2,depthWrite:false,side:THREE.DoubleSide});
 // solids -> merged buckets
 const buckets={},trims={};const add=(b,g)=>(buckets[b]||(buckets[b]=[])).push([g]);const trim=(k,g)=>(trims[k]||(trims[k]=[])).push([g]);
 for(const s of D.solids){if(s.o.novis||s.mat==='none')continue;const h=s.b[1]-s.a[1];
  if(s.mat==='glass'){const m=new THREE.Mesh(new THREE.BoxGeometry(s.b[0]-s.a[0],h,s.b[2]-s.a[2]),glassM);m.position.set((s.a[0]+s.b[0])/2,(s.a[1]+s.b[1])/2,(s.a[2]+s.b[2])/2);m.renderOrder=2;root.add(m);continue;}
  if(s.c){const g=new THREE.CylinderGeometry(s.R,s.R,h,Math.max(16,Math.min(64,s.R*10|0)),1);g.translate(s.cx,s.a[1]+h/2,s.cz);cylUV(g,s.R,.25);add(s.mat,g);
   if(s.o.trim){const t=new THREE.TorusGeometry(s.R+.015,.045,6,Math.max(24,s.R*12|0));t.rotateX(Math.PI/2);t.translate(s.cx,s.b[1]-.12,s.cz);trim(s.o.trim,t);}continue;}
  const w=s.b[0]-s.a[0],d=s.b[2]-s.a[2],cx=(s.a[0]+s.b[0])/2,cz=(s.a[2]+s.b[2])/2;const g=new THREE.BoxGeometry(w,h,d);g.translate(cx,s.a[1]+h/2,cz);boxUV(g,.25);add(s.mat,g);
  if(s.o.trim){const y=s.b[1]-.1;for(const[sx,sz,len,rot]of[[0,d/2+.012,w-.12,0],[0,-d/2-.012,w-.12,0],[w/2+.012,0,d-.12,1],[-w/2-.012,0,d-.12,1]]){if(len<.2)continue;const t=new THREE.BoxGeometry(rot?.03:len,.06,rot?len:.03);t.translate(cx+sx,y,cz+sz);trim(s.o.trim,t);}}}
 for(const r of D.ramps){add(r.mat,wedge(r));if(r.o&&r.o.trim){const L=r.axis==='x'?r.x1-r.x0:r.z1-r.z0,rise=r.y1-r.y0,len=Math.hypot(L,rise),ang=Math.atan2(rise,L)*r.dir;
   for(const w of r.axis==='x'?[r.z0-.012,r.z1+.012]:[r.x0-.012,r.x1+.012]){const t=new THREE.BoxGeometry(len,.06,.03);if(r.axis==='x'){t.rotateZ(ang);t.translate((r.x0+r.x1)/2,(r.y0+r.y1)/2-.05,w);}else{t.rotateZ(ang);t.rotateY(Math.PI/2);t.translate(w,(r.y0+r.y1)/2-.05,(r.z0+r.z1)/2);}trim(r.o.trim,t);}}}
 const solidMeshes=[];for(const k in buckets){const m=new THREE.Mesh(merge(buckets[k]),mat(k));m.castShadow=true;m.receiveShadow=true;root.add(m);solidMeshes.push(m);}
 for(const k in trims){const m=new THREE.Mesh(merge(trims[k]),new THREE.MeshBasicMaterial({color:T.trims[k]||T.trims.c}));root.add(m);}
 // deco
 const glow=glowTex();const deco=[];
 for(const d of D.deco){if(d.type==='window'){const parts=[];for(let x=d.x0;x<=d.x1+.01;x+=6.2)parts.push([new THREE.BoxGeometry(.35,d.y1-d.y0,.35),M4(x,(d.y0+d.y1)/2,d.z)]);
    for(const y of[d.y0+.25,d.y0+6.5,d.y1-.2])parts.push([new THREE.BoxGeometry(d.x1-d.x0,.3,.4),M4((d.x0+d.x1)/2,y,d.z)]);const m=new THREE.Mesh(merge(parts),mat('metal'));m.castShadow=true;root.add(m);
    const lt=new THREE.Mesh(new THREE.BoxGeometry(d.x1-d.x0,.05,.05),new THREE.MeshBasicMaterial({color:T.trims.c}));lt.position.set((d.x0+d.x1)/2,d.y0+6.3,d.z-Math.sign(d.z)*.25);root.add(lt);}
  else if(d.type==='shaft'){const parts=[];for(const y of[-6.2,-4.4,-2.6,-1.2])for(const[sx,sz,rot]of[[0,1,0],[0,-1,0],[1,0,1],[-1,0,1]])parts.push([new THREE.BoxGeometry(rot?.04:d.w-.4,.08,rot?d.w-.4:.04),M4(d.x+sx*(d.w/2-.02),y,d.z+sz*(d.w/2-.02))]);
    root.add(new THREE.Mesh(merge(parts),new THREE.MeshBasicMaterial({color:T.trims.c})));
    const col=new THREE.Mesh(new THREE.BoxGeometry(8.8,30,16),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uT:{value:0}},
     vertexShader:'varying vec3 vP;varying vec2 vU;void main(){vP=position;vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
     fragmentShader:'uniform float uT;varying vec3 vP;void main(){float s=fract(vP.y*.18-uT*.25);float a=smoothstep(.0,.06,s)*smoothstep(.14,.06,s)*.12+.02;a*=smoothstep(15.,-6.,vP.y)*smoothstep(-15.,-12.,vP.y);gl_FragColor=vec4(vec3(.25,.75,1.)*a,1.);}'}));
    col.position.set(0,7.5,0);col.renderOrder=3;root.add(col);anim.push(t=>col.material.uniforms.uT.value=t);}
  else if(d.type==='holo'){const g=new THREE.Group();const hm=new THREE.MeshBasicMaterial({color:new THREE.Color(.4,1.5,2.6),wireframe:true,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false});
    const ico=new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,1),hm);g.add(ico);for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(2.4+i*.5,.03,4,64),new THREE.MeshBasicMaterial({color:new THREE.Color(.3,1.2,2.4)}));r.rotation.x=Math.PI/2+i*.5;g.add(r);}
    g.position.set(d.x,d.y,d.z);root.add(g);anim.push(t=>{ico.rotation.y=t*.4;ico.rotation.x=t*.25;g.children.forEach((c,i)=>{if(i)c.rotation.z=t*(.3+i*.2);});});}
  else if(d.type==='sign'){const tx=ctex(512,128,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.font='92px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#fff';x.shadowBlur=14;x.fillStyle='#fff';x.fillText(d.text,w/2,h/2+4);});
    const c=new THREE.Color(d.col).multiplyScalar(3);const m=new THREE.Mesh(new THREE.PlaneGeometry(9,2.25),new THREE.MeshBasicMaterial({map:tx,color:c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    m.position.set(d.x-d.face*.6,d.y,d.z);m.rotation.y=d.face>0?-Math.PI/2:Math.PI/2;root.add(m);}
  else if(d.type==='mesas'){const r=rng(31),parts=[];for(let i=0;i<46;i++){const a=r()*Math.PI*2,dist=170+r()*260,w=30+r()*70,h=40+r()*110;const g=new THREE.CylinderGeometry(w*.7,w,h,6+(r()*4|0));parts.push([g,M4(Math.cos(a)*dist*1.4,h/2-20,Math.sin(a)*dist,0,r()*3,0)]);}
    const m=new THREE.Mesh(merge(parts),new THREE.MeshStandardMaterial({color:0x2a1020,roughness:1,emissive:0x12040c}));root.add(m);}
  else if(d.type==='dome'){const dm=new THREE.Mesh(new THREE.SphereGeometry(d.r,64,24,0,Math.PI*2,0,Math.PI/2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uHex:{value:hexTex()},uT:{value:0}},
     vertexShader:'varying vec3 vN,vV;varying vec2 vU;void main(){vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
     fragmentShader:'uniform sampler2D uHex;uniform float uT;varying vec3 vN,vV;varying vec2 vU;void main(){float f=pow(1.-abs(dot(vN,vV)),2.5);float hx=texture2D(uHex,vU*vec2(24.,8.)).r;float sweep=smoothstep(.04,0.,abs(fract(vU.y*.5-uT*.05)-.5));gl_FragColor=vec4(vec3(.75,.9,1.)*(f*.55+hx*(.05+sweep*.4)+.02),f*.45+hx*.06+.04);}'}));
    dm.position.y=d.y;dm.renderOrder=4;root.add(dm);anim.push(t=>dm.material.uniforms.uT.value=t);
    const parts=[];for(let i=0;i<16;i++){const g=new THREE.TorusGeometry(d.r+.05,.09,6,48,Math.PI/2);g.rotateY(i/16*Math.PI*2);parts.push([g,M4(0,d.y,0)]);}parts.push([new THREE.TorusGeometry(d.r+.05,.18,6,96),M4(0,d.y,0,Math.PI/2)]);
    for(let k=1;k<4;k++){const a=k/4*Math.PI/2;parts.push([new THREE.TorusGeometry((d.r+.05)*Math.cos(a),.07,5,96),M4(0,d.y+(d.r+.05)*Math.sin(a),0,Math.PI/2)]);}
    const rib=new THREE.Mesh(merge(parts),mat('metal'));root.add(rib);
    for(let i=0;i<4;i++){const g=new THREE.CylinderGeometry(15.4,15.4,d.y,48,1,true,i*Math.PI/2+.34,Math.PI/2-.68);const m=new THREE.Mesh(g,glassM);m.position.y=d.y/2;m.renderOrder=2;root.add(m);}}
  else if(d.type==='gate'){const g=new THREE.Group();const pm=mat('metal'),tm=new THREE.MeshBasicMaterial({color:T.trims.c});for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.5,4.4,.5),pm);p.position.set(d.ax==='z'?0:s*2.9,2.2,d.ax==='z'?s*2.9:0);g.add(p);const l=new THREE.Mesh(new THREE.BoxGeometry(.08,4,.08),tm);l.position.copy(p.position);l.position.y=2.2;l.position[d.ax==='z'?'x':'z']=-.3*Math.sign(d.x+d.z);g.add(l);}
    const top=new THREE.Mesh(new THREE.BoxGeometry(d.ax==='z'?.6:6.3,.5,d.ax==='z'?6.3:.6),pm);top.position.y=4.4;g.add(top);g.position.set(d.x,0,d.z);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});root.add(g);}}
 // jump pads
 for(const p of D.pads){const g=new THREE.Group();g.position.set(p.x,p.y,p.z);const base=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.3,.14,32),mat('metal'));base.position.y=.07;base.receiveShadow=true;g.add(base);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.06,8,40),new THREE.MeshBasicMaterial({color:T.trims.o}));ring.rotation.x=Math.PI/2;ring.position.y=.16;g.add(ring);
  const U={uT:{value:0},uC:{value:T.trims.o.clone().multiplyScalar(.5)}};const beam=new THREE.Mesh(new THREE.CylinderGeometry(.95,1.05,3.2,32,1,true),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
   vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uT;uniform vec3 uC;varying vec2 vU;void main(){float s=fract(vU.y*3.-uT*1.6);float a=smoothstep(.0,.15,s)*smoothstep(.45,.15,s);gl_FragColor=vec4(uC*(a*.9+.12)*(1.-vU.y),1.);}'}));
  beam.position.y=1.7;g.add(beam);const disc=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({color:T.trims.o.clone().multiplyScalar(.6),transparent:true,blending:THREE.AdditiveBlending,map:glow,depthWrite:false}));disc.rotation.x=-Math.PI/2;disc.position.y=.15;g.add(disc);
  root.add(g);anim.push(t=>U.uT.value=t);}
 // teleporters
 for(const tp of D.teles){const g=new THREE.Group();g.position.set(tp.x,tp.y,tp.z);const col=(T.trims[tp.col]||T.trims.c).clone();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.4,.16,32),mat('metal'));base.position.y=.08;g.add(base);
  const U={uT:{value:0},uC:{value:col.clone().multiplyScalar(.6)}};const disc=new THREE.Mesh(new THREE.CircleGeometry(1.15,48),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uT;uniform vec3 uC;varying vec2 vP;void main(){float r=length(vP),a=atan(vP.y,vP.x);float s=sin(a*3.+r*9.-uT*5.)*.5+.5;gl_FragColor=vec4(uC*(s*.8+.3)*smoothstep(1.15,.2,r)*1.4,1.);}'}));
  disc.rotation.x=-Math.PI/2;disc.position.y=.18;g.add(disc);const rings=[];for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(1.1-i*.12,.035,6,40),new THREE.MeshBasicMaterial({color:col}));r.rotation.x=Math.PI/2;g.add(r);rings.push(r);}
  root.add(g);anim.push(t=>{U.uT.value=t;rings.forEach((r,i)=>{const k=(t*.6+i/3)%1;r.position.y=.2+k*2.6;r.scale.setScalar(1-k*.35);r.material.color.copy(col).multiplyScalar(1-k);});});}
 // low gravity column frames
 for(const z of D.low){const w=z.b[0]-z.a[0],d=z.b[2]-z.a[2],frames=[];for(let i=0;i<4;i++){const parts=[];for(const[sx,sz,rot]of[[0,1,0],[0,-1,0],[1,0,1],[-1,0,1]])parts.push([new THREE.BoxGeometry(rot?.05:w,.05,rot?d:.05),M4((z.a[0]+z.b[0])/2+sx*w/2,0,(z.a[2]+z.b[2])/2+sz*d/2)]);
   const m=new THREE.Mesh(merge(parts),new THREE.MeshBasicMaterial({color:T.trims.c.clone(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));root.add(m);frames.push(m);}
  anim.push(t=>frames.forEach((m,i)=>{const k=(t*.12+i/4)%1;m.position.y=z.a[1]+k*20;m.material.color.copy(T.trims.c).multiplyScalar(Math.sin(k*Math.PI)*.8);}));}
 // sky + far set pieces
 // procedural sky, planet, orbital ring and cloud sea are baked ONCE into a cubemap (per-pixel noise is far too costly to run every frame)
 const skyScene=new THREE.Scene();const sky=new THREE.Mesh(new THREE.SphereGeometry(5000,48,24),skyMat(def.theme,sunDir));sky.frustumCulled=false;skyScene.add(sky);
 if(def.theme==='space'){const pl=planet(sunDir);pl.scale.setScalar(1500);pl.position.set(-900,-1400,-2600);pl.rotation.set(.3,.5,.2);skyScene.add(pl);skyScene.add(ringStructure());}
 if(def.theme==='sky'){const U={uT:{value:0},uSun:{value:sunDir}};const cl=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000,1,1),new THREE.ShaderMaterial({uniforms:U,fog:false,transparent:true,depthWrite:false,
   vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`${NOISE}uniform float uT;uniform vec3 uSun;varying vec3 vW;void main(){vec2 p=vW.xz*.004+vec2(uT*.004,uT*.002);float n=fbm(vec3(p,uT*.01));float n2=fbm(vec3(p*3.1,2.));float d=smoothstep(.38,.72,n*.8+n2*.3);
    vec3 c=mix(vec3(.55,.66,.86),vec3(1.,.99,.97),d);c*=.8+.25*n2;float dist=length(vW.xz-cameraPosition.xz);float fade=smoothstep(4200.,1500.,dist);gl_FragColor=vec4(mix(vec3(.82,.88,.96),c,fade),mix(.85,1.,d)*smoothstep(4400.,3000.,dist));}`}));
  cl.rotation.x=-Math.PI/2;cl.position.y=-70;skyScene.add(cl);U.uT.value=37;
  const r=rng(77),parts=[];for(let i=0;i<14;i++){const a=r()*Math.PI*2,dist=220+r()*500,s=12+r()*40;const top=new THREE.CylinderGeometry(s,s*.9,s*.25,9);const bot=new THREE.ConeGeometry(s*.9,s*1.6,9);bot.rotateX(Math.PI);
   const y=-20+r()*60;parts.push([top,M4(Math.cos(a)*dist,y,Math.sin(a)*dist)]);parts.push([bot,M4(Math.cos(a)*dist,y-s*.92,Math.sin(a)*dist)]);}
  root.add(new THREE.Mesh(merge(parts),new THREE.MeshStandardMaterial({color:0x8a8478,roughness:1})));
}
 const crt=new THREE.WebGLCubeRenderTarget(gfx>=2?1024:512,{type:THREE.HalfFloatType});const cc=new THREE.CubeCamera(1,20000,crt);cc.position.set(0,4,0);skyScene.add(cc);cc.update(R,skyScene);
 skyScene.traverse(o=>{if(o.geometry&&o!==cc)o.geometry.dispose();});const bgTex=crt.texture;
 const envScene=new THREE.Scene();envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{uC:{value:bgTex}},vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform samplerCube uC;varying vec3 vD;void main(){gl_FragColor=vec4(textureCube(uC,normalize(vD)).rgb,1.);}'})));
 if(def.theme==='sky'){const ec=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshBasicMaterial({color:0xf2f6fc,side:THREE.DoubleSide}));ec.rotation.x=-Math.PI/2;ec.position.y=-30;envScene.add(ec);}
 if(def.theme==='canyon'){for(const[x,c]of[[-60,0xff3d7f],[60,0x2fd0ff],[0,0xff8a20]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(50,8),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(4),side:THREE.DoubleSide}));p.position.set(x,30,0);p.rotation.x=Math.PI/2;envScene.add(p);}}
 else{const p=new THREE.Mesh(new THREE.PlaneGeometry(40,6),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,2.4,2.6),side:THREE.DoubleSide}));p.position.set(0,40,0);p.rotation.x=Math.PI/2;envScene.add(p);}
 const pm=new THREE.PMREMGenerator(R);const env=pm.fromScene(envScene,.03).texture;pm.dispose();
 // lights
 const hemi=new THREE.HemisphereLight(T.hemi[0],T.hemi[1],T.hemi[2]);root.add(hemi);
 const sun=new THREE.DirectionalLight(T.sun[0],T.sun[1]);const[b0,b1,b2,b3]=def.bounds,cx=(b0+b1)/2,cz=(b2+b3)/2,ext=Math.max(b1-b0,b3-b2)/2+6;
 sun.position.set(cx+sunDir.x*120,sunDir.y*120,cz+sunDir.z*120);sun.target.position.set(cx,0,cz);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:40,far:260});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;root.add(sun,sun.target);
 for(const l of D.lights){const p=new THREE.PointLight(l.c,l.i,l.d,1.6);p.position.copy(l.p);root.add(p);}
 return{root,env,sun,hemi,mirror,anim,sky,theme:T,fog:new THREE.FogExp2(T.fog[0],T.fog[1]),bg:bgTex,solidMeshes,glow,update(t){for(const f of anim)f(t);}};}
