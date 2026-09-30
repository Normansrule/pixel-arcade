import * as THREE from '../vendor/three.module.min.js';
import {Sky} from '../vendor/jsm/objects/Sky.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';
import {cinematic,setQuality} from '../js/fx3d.js';

const $=id=>document.getElementById(id);const rnd=(a=1)=>Math.random()*a,cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const N=new SimplexNoise({random:mulberry(42)});
const WORLD=300;

/* ================= seabed ================= */
function heightAt(x,z){const r=Math.hypot(x,z);let h=-12-Math.max(0,r-50)*.5;
 const fb=N.noise(x*.012,z*.012)*9+N.noise(x*.04,z*.04)*3+N.noise(x*.15,z*.15)*.6;h+=fb;
 const cz=z-45*Math.sin(x*.012),t=THREE.MathUtils.smoothstep(x,70,170);h-=230*t*Math.exp(-Math.pow(cz/28,2));
 const pl=Math.exp(-Math.pow((x+120)/60,2)-Math.pow((z-110)/60,2));h-=60*pl;
 h+=Math.sin(x*.9+N.noise(x*.05,z*.05)*3)*.25*(h>-60?1:0);return Math.min(h,-4);}
const depthOf=y=>-y;

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.25));
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(70,1,.05,500);scene.add(cam);
scene.fog=new THREE.FogExp2(0x106a88,.02);
const sun=new THREE.DirectionalLight(0xbfe8ff,2);sun.position.set(40,100,20);scene.add(sun);const hemi=new THREE.HemisphereLight(0x8fdcff,0x0a2030,.9);scene.add(hemi);
const lamp=new THREE.SpotLight(0xe8f6ff,0,70,.42,.5,1.2);lamp.position.set(0,-.2,0);cam.add(lamp);cam.add(lamp.target);lamp.target.position.set(0,0,-10);
const flareL=new THREE.PointLight(0xff6a40,0,40,1.5);scene.add(flareL);
const sky=new Sky();sky.scale.setScalar(800);sky.visible=false;scene.add(sky);Object.assign(sky.material.uniforms.sunPosition.value,{x:.4,y:.8,z:.2});

/* caustics + depth tint injected into standard materials */
const U={uTime:{value:0},uSun:{value:1}};
function causticify(m,strength=1){m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.uniforms.uStr={value:strength};
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>',`#include <project_vertex>
 vec4 wq=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 wq=instanceMatrix*wq;
 #endif
 vWP=(modelMatrix*wq).xyz;`);
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
 varying vec3 vWP;uniform float uTime,uSun,uStr;
 float caus(vec2 p,float t){vec2 i=p;float c=1.;float inten=.005;for(int n=0;n<4;n++){float tt=t*(1.-(3.5/float(n+1)));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));vec2 dv=vec2(sin(i.x+tt),cos(i.y+tt));dv=sign(dv)*max(abs(dv),vec2(1e-3));c+=1./max(length(vec2(p.x/(dv.x/inten),p.y/(dv.y/inten))),1e-3);}c/=4.;c=1.17-pow(max(c,0.),1.4);return clamp(pow(abs(c),8.),0.,3.);}`)
 .replace('#include <tonemapping_fragment>',`float cz=caus(mod(vWP.xz*.16,6.2831)+vec2(0.,0.),uTime*.55);float cf=exp(vWP.y*.022)*uSun*uStr;gl_FragColor.rgb+=diffuseColor.rgb*vec3(.75,1.,1.)*cz*.75*cf;gl_FragColor.rgb=max(gl_FragColor.rgb,vec3(0.));
 #include <tonemapping_fragment>`);};return m;}

/* procedural textures */
function tex(w,h,fn,rep){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep,rep);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const sandT=tex(256,256,(x,w,h)=>{x.fillStyle='#a8996c';x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=150+rnd(90)|0;x.fillStyle=`rgba(${v},${v-12},${v-50},.5)`;x.fillRect(rnd(w),rnd(h),1+rnd(1.5),1+rnd(1.5));}for(let i=0;i<40;i++){x.strokeStyle='rgba(120,100,70,.15)';x.beginPath();const y=rnd(h);x.moveTo(0,y);for(let k=0;k<=w;k+=16)x.lineTo(k,y+Math.sin(k*.05+i)*4);x.stroke();}},60);

/* ================= seabed mesh ================= */
const SEG=280,geo=new THREE.PlaneGeometry(WORLD*2,WORLD*2,SEG,SEG);geo.rotateX(-Math.PI/2);{const p=geo.attributes.position,col=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=heightAt(x,z);p.setY(i,y);}geo.computeVertexNormals();const n=geo.attributes.normal;
 for(let i=0;i<p.count;i++){const y=p.getY(i),sl=1-n.getY(i),deep=cl(-y/220,0,1);const rock=cl(sl*4-.4,0,1);const c=new THREE.Color().setRGB(lerp(.82,.4,deep),lerp(.8,.46,deep),lerp(.72,.56,deep)).lerp(new THREE.Color(.34,.33,.36),rock);col.set([c.r,c.g,c.b],i*3);}geo.setAttribute('color',new THREE.BufferAttribute(col,3));}
const floorM=causticify(new THREE.MeshStandardMaterial({map:sandT,vertexColors:true,roughness:.95}));const floor=new THREE.Mesh(geo,floorM);scene.add(floor);

/* ================= surface (seen from above and below) ================= */
const surfM=new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,uniforms:{uTime:U.uTime,camPos:{value:new THREE.Vector3()}},
 vertexShader:`varying vec3 vW;uniform float uTime;void main(){vec3 p=position;p.y+=sin(p.x*.18+uTime)*.25+cos(p.z*.22+uTime*1.3)*.2;vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`varying vec3 vW;uniform float uTime;uniform vec3 camPos;
 float n(vec2 p){return sin(p.x)*sin(p.y);}
 void main(){vec2 q=vW.xz*.25;float r=n(q+uTime*.3)*.5+n(q*2.3-uTime*.4)*.3+n(q*5.1+uTime*.7)*.2;
  if(!gl_FrontFacing){vec3 v=normalize(vW-camPos);float win=smoothstep(.55,.9,v.y);vec3 c=mix(vec3(.04,.28,.36),vec3(.55,.85,.92),win)+r*.1;gl_FragColor=vec4(c*.85,.94);}
  else{vec3 v=normalize(camPos-vW);float fr=pow(1.-max(v.y,0.),4.);vec3 c=mix(vec3(.02,.18,.26),vec3(.6,.8,.95),fr)+max(0.,r)*.2;gl_FragColor=vec4(c,.92);}}`});
const surf=new THREE.Mesh(new THREE.PlaneGeometry(WORLD*2,WORLD*2,120,120).rotateX(-Math.PI/2),surfM);scene.add(surf);

/* ================= god rays ================= */
const rayM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uTime:U.uTime,uI:{value:1}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'varying vec2 vUv;uniform float uTime,uI;void main(){float a=pow(vUv.y,1.6)*smoothstep(0.,.5,vUv.x)*smoothstep(1.,.5,vUv.x)*(.6+.4*sin(uTime*.7+vUv.x*9.));gl_FragColor=vec4(vec3(.55,.9,1.)*a*.16*uI,1.);}'});
const rays=[];for(let i=0;i<22;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(4+rnd(6),70),rayM);m.userData={ox:rnd(160)-80,oz:rnd(160)-80,tilt:rnd(.3)-.15};scene.add(m);rays.push(m);}

/* ================= marine snow ================= */
const snow=(()=>{const n=2500,p=new Float32Array(n*3);for(let i=0;i<n*3;i++)p[i]=rnd(60)-30;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:0xcff4ff,size:.07,transparent:true,opacity:.55,depthWrite:false}));})();scene.add(snow);

/* ================= scatter helpers ================= */
const place=(n,filter)=>{const out=[];for(let t=0;t<n*30&&out.length<n;t++){const x=rnd(WORLD*1.9)-WORLD*.95,z=rnd(WORLD*1.9)-WORLD*.95,y=heightAt(x,z);if(filter(-y,x,z))out.push([x,y,z]);}return out;};
const dummy=new THREE.Object3D();
// rocks
{const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);v.multiplyScalar(1+N.noise3d(v.x*1.3,v.y*1.3,v.z*1.3)*.28);p.setXYZ(i,v.x,v.y*.7,v.z);}g.computeVertexNormals();
 const m=causticify(new THREE.MeshStandardMaterial({color:0x6a6a72,roughness:1,flatShading:true}));const pts=place(700,()=>true);const im=new THREE.InstancedMesh(g,m,pts.length);pts.forEach((q,i)=>{const s=.5+Math.pow(rnd(),3)*7;dummy.position.set(q[0],q[1]+s*.1,q[2]);dummy.rotation.set(rnd(.5),rnd(6.3),rnd(.5));dummy.scale.set(s,s*(.6+rnd(.6)),s);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);});scene.add(im);}
// kelp forest with vertex sway
const kelpM=causticify(new THREE.MeshStandardMaterial({color:0x4a5a1c,roughness:.75,side:THREE.DoubleSide,emissive:0x0a1402}),.4);
kelpM.onBeforeCompile=(orig=>sh=>{orig(sh);sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 float ph=float(gl_InstanceID)*1.7;float k=uv.y*uv.y;transformed.x+=sin(uTime*.8+ph+uv.y*3.)*k*1.6;transformed.z+=cos(uTime*.6+ph*1.3+uv.y*2.)*k*1.2;`).replace('#include <common>','#include <common>\nuniform float uTime;');})(kelpM.onBeforeCompile);
{const g=new THREE.PlaneGeometry(.55,1,1,14);g.translate(0,.5,0);const pts=place(900,(d,x,z)=>d>9&&d<42&&N.noise(x*.03,z*.03)>.05);const im=new THREE.InstancedMesh(g,kelpM,pts.length);pts.forEach((q,i)=>{const h=Math.min(-q[1]-2,8+rnd(18));dummy.position.set(q[0],q[1],q[2]);dummy.rotation.set(0,rnd(6.3),0);dummy.scale.set(.7+rnd(.9),h,1);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);});scene.add(im);}
// coral (colourful shallow) and bioluminescent flora (deep)
const coralCols=[0xff6a8a,0xffa04a,0xb070ff,0xff4a6a,0x4ad8c8,0xffd84a];
function coralField(n,filter,glow){const geos=[new THREE.ConeGeometry(.5,2,6),new THREE.TorusKnotGeometry(.5,.18,40,6),new THREE.SphereGeometry(.8,10,8),new THREE.CylinderGeometry(.08,.3,2.4,6)];geos.forEach(g=>g.translate(0,1,0));
 const pts=place(n,filter);geos.forEach((g,k)=>{const sub=pts.filter((_,i)=>i%geos.length===k);const m=causticify(new THREE.MeshStandardMaterial({roughness:.6,emissive:glow?0xffffff:0x000000,emissiveIntensity:glow?1.3:0}));if(glow){const o=m.onBeforeCompile;m.onBeforeCompile=sh=>{o(sh);sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\ntotalEmissiveRadiance*=vColor;\n#endif');};}const im=new THREE.InstancedMesh(g,m,sub.length);sub.forEach((q,i)=>{const s=.5+rnd(1.4);dummy.position.set(q[0],q[1],q[2]);dummy.rotation.set(rnd(.4)-.2,rnd(6.3),rnd(.4)-.2);dummy.scale.set(s,s*(.7+rnd(.8)),s);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);im.setColorAt(i,new THREE.Color(glow?[0x3af0ff,0x7a4aff,0x3aff9a,0xff3ab0][i%4]:coralCols[(i*7)%coralCols.length]));});scene.add(im);});}
coralField(1400,(d,x,z)=>d>8&&d<60&&N.noise(x*.02+9,z*.02)>-.1,false);coralField(900,d=>d>85,true);

/* ================= fish (instanced boids) ================= */
function fishGeo(){const b=new THREE.SphereGeometry(.5,10,6);b.scale(.35,.42,1);const t=new THREE.ConeGeometry(.3,.5,4);t.rotateX(Math.PI/2);t.scale(.2,1,1);t.translate(0,0,-.6);const g=new THREE.BufferGeometry();const pa=[],na=[];for(const s of[b.toNonIndexed(),t.toNonIndexed()]){pa.push(...s.attributes.position.array);na.push(...s.attributes.normal.array);}g.setAttribute('position',new THREE.Float32BufferAttribute(pa,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(na,3));return g;}
const FG=fishGeo();function fishMat(color,emi){const m=new THREE.MeshStandardMaterial({color,roughness:.35,metalness:.3,emissive:emi||0,emissiveIntensity:emi?1.2:0});m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat w=max(0.,-position.z);transformed.x+=sin(uTime*10.+float(gl_InstanceID)*2.1+position.z*3.)*.18*w;');};return m;}
const SPECIES={glowfin:{n:'GLOWFIN',info:'Small schooling fish. Its fins store light from the surface and glow at dusk.'},sandskip:{n:'SANDSKIPPER',info:'Skittish reef grazer. Schools scatter from anything larger than they are.'},reefback:{n:'REEFBACK',info:'Colossal gentle filter-feeder. An entire reef grows on its shell.'},razorjaw:{n:'RAZORJAW',info:'Territorial predator of the reef edge. Bright flares drive it away.'},jelly:{n:'LANTERN JELLY',info:'Drifting jelly that pulses with blue light in the twilight zone.'},crab:{n:'CRYSTAL CRAB',info:'Deep-sea crustacean with a shell of living quartz.'}};
const schools=[];function makeSchool(kind,n,color,emi,cx,cy,cz,scale){const im=new THREE.InstancedMesh(FG,fishMat(color,emi),n);im.frustumCulled=false;scene.add(im);const f=[];for(let i=0;i<n;i++)f.push({p:new THREE.Vector3(cx+rnd(8)-4,cy+rnd(4)-2,cz+rnd(8)-4),v:new THREE.Vector3(rnd(2)-1,0,rnd(2)-1)});const s={kind,im,f,c:new THREE.Vector3(cx,cy,cz),goal:new THREE.Vector3(cx,cy,cz),scale,home:new THREE.Vector3(cx,cy,cz)};schools.push(s);return s;}
function spawnSchools(){schools.splice(0).forEach(s=>scene.remove(s.im));for(let i=0;i<5;i++){const a=rnd(6.3),r=20+rnd(60);const x=Math.cos(a)*r,z=Math.sin(a)*r,y=heightAt(x,z);makeSchool(i%2?'sandskip':'glowfin',34,i%2?0xffd84a:0x6ae8ff,i%2?0:0x1a6aaa,x,y+4+rnd(6),z,.8);}
 for(let i=0;i<3;i++){const a=rnd(6.3),r=100+rnd(80);const x=Math.cos(a)*r,z=Math.sin(a)*r,y=heightAt(x,z);makeSchool('glowfin',30,0x6affe8,0x2aaa9a,x,y+8,z,.9);}}
function stepSchools(dt){const tmp=new THREE.Vector3(),q=new THREE.Quaternion(),fwd=new THREE.Vector3(0,0,1);for(const s of schools){if(s.goal.distanceTo(s.c)<4||Math.random()<.002){const a=rnd(6.3),r=rnd(25);s.goal.set(s.home.x+Math.cos(a)*r,0,s.home.z+Math.sin(a)*r);s.goal.y=heightAt(s.goal.x,s.goal.z)+3+rnd(8);}
 s.c.set(0,0,0);s.f.forEach(f=>s.c.add(f.p));s.c.multiplyScalar(1/s.f.length);const dp=s.c.distanceTo(P.pos);
 s.f.forEach((f,i)=>{const acc=tmp.copy(s.goal).sub(f.p).setLength(.6);acc.add(s.c.clone().sub(f.p).multiplyScalar(.25));for(let j=0;j<s.f.length;j+=3){const o=s.f[j];if(o===f)continue;const d=f.p.distanceTo(o.p);if(d<1.2)acc.add(f.p.clone().sub(o.p).setLength((1.2-d)*4));}
  const pd=f.p.distanceTo(P.pos);if(pd<7)acc.add(f.p.clone().sub(P.pos).setLength((7-pd)*(s.kind==='sandskip'?3:1.6)));const fy=heightAt(f.p.x,f.p.z);if(f.p.y<fy+1.5)acc.y+=4;if(f.p.y>-2)acc.y-=4;
  f.v.addScaledVector(acc,dt);const sp=f.v.length();if(sp>5)f.v.multiplyScalar(5/sp);if(sp<1.5)f.v.multiplyScalar(1.5/Math.max(sp,.01));f.p.addScaledVector(f.v,dt);
  dummy.position.copy(f.p);q.setFromUnitVectors(fwd,tmp.copy(f.v).normalize());dummy.quaternion.copy(q);dummy.scale.setScalar(s.scale);dummy.updateMatrix();s.im.setMatrixAt(i,dummy.matrix);});s.im.instanceMatrix.needsUpdate=true;s.dist=dp;}}

/* ================= big creatures ================= */
const creatures=[];
function reefback(x,z){const g=new THREE.Group();const skin=causticify(new THREE.MeshStandardMaterial({color:0x6a7a8a,roughness:.8}),.5);const body=new THREE.Mesh(new THREE.SphereGeometry(6,24,16),skin);body.scale.set(1,.55,1.6);g.add(body);
 const shell=new THREE.Mesh(new THREE.SphereGeometry(6.2,20,12,0,6.3,0,1.2),causticify(new THREE.MeshStandardMaterial({color:0x5a6a4a,roughness:1,flatShading:true})));shell.scale.set(1,.7,1.5);shell.position.y=1;g.add(shell);
 for(let i=0;i<14;i++){const c=new THREE.Mesh(new THREE.ConeGeometry(.5,1.6,5),new THREE.MeshStandardMaterial({color:coralCols[i%6],roughness:.6}));const a=rnd(6.3),b=rnd(.9);c.position.set(Math.sin(b)*Math.cos(a)*5.5,4.2*Math.cos(b)+.8,Math.sin(b)*Math.sin(a)*8);g.add(c);}
 const fins=[-1,1].map(s=>{const f=new THREE.Mesh(new THREE.BoxGeometry(7,.3,2.4),skin);f.position.set(s*6,-1,1);g.add(f);return f;});const tent=[];for(let i=0;i<6;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(.15,.05,6,5),skin);t.position.set((i%3-1)*1.4,-3.5,8-(i>2?1:0));g.add(t);tent.push(t);}
 g.position.set(x,-30,z);scene.add(g);creatures.push({kind:'reefback',g,fins,tent,t:rnd(10),a:rnd(6.3),r:Math.hypot(x,z),y:-30,size:9});}
function razorjaw(x,z){const g=new THREE.Group();const m=causticify(new THREE.MeshStandardMaterial({color:0x2a3a44,roughness:.4,metalness:.3}),.5);const body=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),m);body.scale.set(.6,.6,2.6);g.add(body);
 const jaw=new THREE.Mesh(new THREE.ConeGeometry(.55,1.4,8),new THREE.MeshStandardMaterial({color:0x8a2a2a}));jaw.rotation.x=Math.PI/2;jaw.position.z=2.6;g.add(jaw);for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),new THREE.MeshBasicMaterial({color:0xffaa2a}));e.position.set(s*.42,.25,2);g.add(e);const f=new THREE.Mesh(new THREE.BoxGeometry(1.6,.1,.8),m);f.position.set(s*.9,0,.3);f.rotation.z=s*.3;g.add(f);}
 const tail=new THREE.Mesh(new THREE.BoxGeometry(.1,1.4,1),m);tail.position.z=-2.8;g.add(tail);const y=heightAt(x,z)+5;g.position.set(x,y,z);scene.add(g);creatures.push({kind:'razorjaw',g,tail,t:rnd(10),home:new THREE.Vector3(x,y,z),state:'patrol',cd:0,scare:0,size:3});}
function jelly(x,y,z){const g=new THREE.Group();const bell=new THREE.Mesh(new THREE.SphereGeometry(1,20,12,0,6.3,0,1.6),new THREE.MeshStandardMaterial({color:0x6ab8ff,emissive:0x2a6aff,emissiveIntensity:1.6,transparent:true,opacity:.55,roughness:.2,side:THREE.DoubleSide}));g.add(bell);
 const tm=new THREE.MeshBasicMaterial({color:0x8ad8ff,transparent:true,opacity:.5});const ts=[];for(let i=0;i<8;i++){const t=new THREE.Mesh(new THREE.CylinderGeometry(.03,.01,3,3),tm);const a=i/8*6.28;t.position.set(Math.cos(a)*.6,-1.6,Math.sin(a)*.6);g.add(t);ts.push(t);}g.position.set(x,y,z);scene.add(g);creatures.push({kind:'jelly',g,bell,ts,t:rnd(10),size:1.5});}
function crab(x,z){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0xcfe8ff,emissive:0x5ab8ff,emissiveIntensity:.8,roughness:.1,metalness:.2,flatShading:true});const body=new THREE.Mesh(new THREE.OctahedronGeometry(.8,0),m);body.scale.set(1.2,.5,1);g.add(body);
 const legs=[];for(let i=0;i<6;i++){const l=new THREE.Mesh(new THREE.BoxGeometry(.9,.08,.08),new THREE.MeshStandardMaterial({color:0x8aa8c8}));const s=i<3?-1:1;l.position.set(s*1,-.2,(i%3-1)*.45);l.rotation.z=s*.5;g.add(l);legs.push(l);}g.position.set(x,heightAt(x,z)+.5,z);scene.add(g);creatures.push({kind:'crab',g,legs,t:rnd(10),dir:rnd(6.3),size:1});}
function spawnCreatures(){creatures.splice(0).forEach(c=>scene.remove(c.g));reefback(60,-40);reefback(-140,60);for(const p of[[70,40],[-60,-90],[20,110],[-110,-20]])razorjaw(...p);
 for(let i=0;i<40;i++){let x,z;do{x=rnd(560)-280;z=rnd(560)-280;}while(heightAt(x,z)>-70);const fy=heightAt(x,z);jelly(x,lerp(fy+8,-40,rnd()),z);}for(let i=0;i<20;i++){let x,z;do{x=rnd(560)-280;z=rnd(560)-280;}while(heightAt(x,z)>-110);crab(x,z);}}
function stepCreatures(dt){for(const c of creatures){c.t+=dt;const g=c.g;
 if(c.kind==='reefback'){c.a+=dt*.018;{const px=Math.cos(c.a)*c.r,pz=Math.sin(c.a)*c.r,fy=heightAt(px,pz)+11;c.y=lerp(c.y,Math.max(fy,-40)+Math.sin(c.t*.2)*2,dt*.5);g.position.set(px,Math.min(c.y,-8),pz);}g.rotation.y=-c.a;c.fins.forEach((f,i)=>f.rotation.z=Math.sin(c.t*.8)*.25*(i?1:-1));c.tent.forEach((t,i)=>t.rotation.x=Math.sin(c.t+i)*.3);}
 else if(c.kind==='razorjaw'){const to=P.pos.clone().sub(g.position),d=to.length();if(c.scare>0){c.scare-=dt;c.state='flee';}else if(d<26&&-P.pos.y>6&&c.state!=='retreat')c.state='chase';else if(c.state==='chase'&&d>45)c.state='patrol';if(c.cd>0){c.cd-=dt;if(c.cd<=0&&c.state==='retreat')c.state='patrol';}
  let dir;if(c.state==='chase')dir=to.normalize();else if(c.state==='flee'||c.state==='retreat')dir=to.normalize().negate();else{dir=new THREE.Vector3(Math.cos(c.t*.3),Math.sin(c.t*.5)*.2,Math.sin(c.t*.3)).add(c.home.clone().sub(g.position).multiplyScalar(.03)).normalize();}
  const sp=c.state==='chase'?9.5:c.state==='flee'?12:4;c.v=(c.v||new THREE.Vector3()).lerp(dir.multiplyScalar(sp),dt*2);g.position.addScaledVector(c.v,dt);const fy=heightAt(g.position.x,g.position.z)+1.5;if(g.position.y<fy)g.position.y=fy;if(g.position.y>-3)g.position.y=-3;
  g.lookAt(g.position.clone().add(c.v));c.tail.rotation.y=Math.sin(c.t*12)*.5;if(c.state==='chase'&&d<2.8&&c.cd<=0){hurt(22,'RAZORJAW');c.state='retreat';c.cd=4;}}
 else if(c.kind==='jelly'){const s=1+Math.sin(c.t*2.2)*.15;c.bell.scale.set(s,1/s,s);g.position.y+=Math.sin(c.t*2.2)*dt*.6;g.position.x+=Math.sin(c.t*.1)*dt*.3;c.ts.forEach((t,i)=>t.rotation.x=Math.sin(c.t*2+i)*.25);if(g.position.distanceTo(P.pos)<2.2&&(c.sting=(c.sting||0)-dt)<=0){c.sting=1.5;hurt(6,'LANTERN JELLY');}}
 else if(c.kind==='crab'){if(Math.random()<.01)c.dir+=rnd(2)-1;g.position.x+=Math.cos(c.dir)*dt*.7;g.position.z+=Math.sin(c.dir)*dt*.7;g.position.y=heightAt(g.position.x,g.position.z)+.5;g.rotation.y=-c.dir;c.legs.forEach((l,i)=>l.rotation.y=Math.sin(c.t*8+i)*.4);}}}

/* ================= resources ================= */
const RES={titanium:{n:'TITANIUM',c:0xb8c0c8,d:[5,60]},quartz:{n:'QUARTZ',c:0xe8f4ff,d:[15,90],crystal:1},copper:{n:'COPPER',c:0xd88a4a,d:[30,120]},lithium:{n:'LITHIUM',c:0x9aff8a,d:[80,200],crystal:1},ruby:{n:'RUBY',c:0xff3a5a,d:[170,400],crystal:1}};
const nodes=[];function spawnNodes(){nodes.splice(0).forEach(n=>scene.remove(n.m));for(const[k,r]of Object.entries(RES)){const pts=place(26,d=>d>=r.d[0]&&d<=r.d[1]);for(const q of pts){const m=r.crystal?new THREE.Mesh(new THREE.OctahedronGeometry(.6,0),new THREE.MeshStandardMaterial({color:r.c,emissive:r.c,emissiveIntensity:1.1,roughness:.1,metalness:.3,flatShading:true})):new THREE.Mesh(new THREE.DodecahedronGeometry(.8,0),new THREE.MeshStandardMaterial({color:0x6a6a70,emissive:r.c,emissiveIntensity:.35,roughness:.7,flatShading:true}));
 if(r.crystal)m.scale.set(.8,1.8,.8);m.position.set(q[0],q[1]+.8,q[2]);m.rotation.y=rnd(6.3);scene.add(m);nodes.push({k,m});}}}

/* ================= lifepod ================= */
const pod=new THREE.Group();{const hull=new THREE.MeshStandardMaterial({color:0xe8e8ee,roughness:.35,metalness:.4});const body=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.6,4,20),hull);pod.add(body);const cap=new THREE.Mesh(new THREE.SphereGeometry(2.2,20,10,0,6.3,0,1.57),hull);cap.position.y=2;pod.add(cap);
 const band=new THREE.Mesh(new THREE.CylinderGeometry(2.62,2.62,.6,20),new THREE.MeshStandardMaterial({color:0xff5a1a,roughness:.5}));band.position.y=-.8;pod.add(band);const beacon=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),new THREE.MeshBasicMaterial({color:0xff3a1a}));beacon.position.y=4.3;pod.add(beacon);pod.userData.beacon=beacon;
 const bl=new THREE.PointLight(0xff5a2a,20,30,2);bl.position.y=4.3;pod.add(bl);pod.userData.bl=bl;}pod.position.set(0,-.4,0);scene.add(pod);

/* ================= player ================= */
const P={pos:new THREE.Vector3(3,-2,6),vel:new THREE.Vector3(),yaw:0,pitch:-.2,o2:45,o2max:45,hp:100,rating:120,samples:{},banked:0,scanned:new Set(),maxD:0,light:false,flares:3,flareT:0,score:0,bat:100,beacons:3,sonarCD:0};
const TIERS=[{need:0,o2:45,rating:120,n:'STANDARD SUIT'},{need:5,o2:75,rating:220,n:'REINFORCED SUIT'},{need:12,o2:110,rating:350,n:'DEEP DIVE SUIT'},{need:20,o2:150,rating:500,n:'ABYSSAL RIG'}];
let tier=0,state='menu',scanT=0,scanTarget=null,toastT=0,t=0,hurtT=0;
function toast(a,b){$('toastb').textContent=a;$('toasts').textContent=b||'';$('toast').style.opacity=1;toastT=3.2;}
function hint(s){$('hint').textContent=s;$('hint').style.opacity=s?1:0;}
function hurt(n,src){if(state!=='play')return;P.hp-=n;hurtT=.6;sfx('hurt');if(P.hp<=0){P.hp=0;end(src==='CRUSH'?'CRUSHED BY THE DEEP':src==='O2'?'OUT OF AIR':'KILLED BY '+src);}}

/* ================= audio ================= */
let AC=null,amb=null;function audio(){try{AC=AC||new AudioContext();if(!amb){const b=AC.createBuffer(1,AC.sampleRate*4,AC.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<d.length;i++){l=l*.995+(Math.random()*2-1)*.02;d[i]=l;}amb=AC.createBufferSource();amb.buffer=b;amb.loop=true;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=380;const g=AC.createGain();g.gain.value=.9;amb.connect(f);f.connect(g);g.connect(AC.destination);amb.start();}}catch(e){}}
function sfx(k){try{AC=AC||new AudioContext();const t0=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();const m={hurt:[120,.3,.2,'sawtooth'],pick:[660,.15,.08,'sine'],scan:[880,.4,.06,'sine'],bank:[520,.5,.1,'triangle'],flare:[200,.6,.12,'square'],up:[440,.8,.1,'triangle'],ping:[1320,1.4,.09,'sine']}[k]||[440,.1,.05,'sine'];o.type=m[3];o.frequency.setValueAtTime(m[0],t0);o.frequency.exponentialRampToValueAtTime(m[0]*(k==='hurt'?.5:1.6),t0+m[1]);g.gain.setValueAtTime(m[2],t0);g.gain.exponentialRampToValueAtTime(.001,t0+m[1]);o.connect(g);g.connect(AC.destination);o.start();o.stop(t0+m[1]);}catch(e){}}

/* ================= input ================= */
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(state!=='play')return;if(e.code==='KeyL'){P.light=!P.light;sfx('pick');}if(e.code==='KeyF')flare();if(e.code==='KeyE')use();if(e.code==='KeyR')sonar();if(e.code==='KeyB')dropBeacon();if(e.code==='Tab'){e.preventDefault();if(!pdaOpen)openPda();}if(e.code==='KeyG'){const q=(fx.q+2)%3;setQuality(q);buildFx();resize();toast('GRAPHICS',['FAST','HIGH','ULTRA'][q]);}if(e.code==='Space')e.preventDefault();});addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Tab'&&pdaOpen){pdaOpen=false;$('pda').hidden=true;}});
canvas.addEventListener('mousedown',()=>{if(state==='play'&&document.pointerLockElement!==canvas)canvas.requestPointerLock();});
addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||state!=='play')return;P.yaw-=e.movementX*.0021;P.pitch=cl(P.pitch-e.movementY*.0021,-1.5,1.5);});
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&state==='play'){state='paused';$('menu').style.display='flex';$('go').textContent='CLICK TO RESUME';document.body.classList.remove('playing');}});
function flare(){if(P.flares<=0||P.flareT>0){hint('NO FLARES');return;}P.flares--;P.flareT=12;sfx('flare');creatures.forEach(c=>{if(c.kind==='razorjaw'&&c.g.position.distanceTo(P.pos)<35){c.scare=8;}});toast('FLARE','Predators scatter');}
function nearest(){let best=null,bd=4;for(const n of nodes){const d=n.m.position.distanceTo(P.pos);if(d<bd){bd=d;best=n;}}return best;}
function use(){if(P.pos.distanceTo(pod.position)<7){bank();return;}const bn=beaconList.find(b=>b.g.position.distanceTo(P.pos)<3.5);if(bn){scene.remove(bn.g);beaconList.splice(beaconList.indexOf(bn),1);P.beacons++;sfx('pick');toast('BEACON RECOVERED',P.beacons+' in pack');return;}const n=nearest();if(n){P.samples[n.k]=(P.samples[n.k]||0)+1;scene.remove(n.m);nodes.splice(nodes.indexOf(n),1);P.score+=25;sfx('pick');toast('+1 '+RES[n.k].n,'Bring samples back to the lifepod');}}
function bank(){const n=Object.values(P.samples).reduce((a,b)=>a+b,0);if(!n){toast('LIFEPOD','Oxygen and scooter recharged');P.o2=P.o2max;P.bat=100;return;}P.banked+=n;P.score+=n*50;P.samples={};P.o2=P.o2max;P.bat=100;P.flares=Math.min(5,P.flares+1);sfx('bank');let msg=n+' samples stored';while(tier<TIERS.length-1&&P.banked>=TIERS[tier+1].need){tier++;P.o2max=TIERS[tier].o2;P.o2=P.o2max;P.rating=TIERS[tier].rating;P.beacons++;sfx('up');msg=TIERS[tier].n+' · O2 '+P.o2max+'s · rated '+P.rating+'m';}toast('LIFEPOD',msg);checkWin();}
function checkWin(){if(P.scanned.size>=6&&P.maxD>=300&&P.banked>=20)end('SURVEY COMPLETE',true);}

/* ================= sonar, beacons, survey tablet ================= */
const pingMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uA:{value:0}},
 vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),3.);gl_FragColor=vec4(vec3(.35,.95,1.)*f*uA,1.);}'});
const pingMesh=new THREE.Mesh(new THREE.SphereGeometry(1,40,20),pingMat);pingMesh.visible=false;pingMesh.frustumCulled=false;scene.add(pingMesh);
const pings=[];let pingT=-1,pdaOpen=false;const beaconList=[];const BCOL=['#ffd24a','#ff5ad2','#6fff9a','#6ab8ff','#ff8a4a','#ffffff','#b08aff'];
function sonar(){if(P.sonarCD>0){hint('SONAR RECHARGING');return;}P.sonarCD=5;pingT=0;pingMesh.position.copy(P.pos);sfx('ping');pings.length=0;
 for(const n of nodes){const d=n.m.position.distanceTo(P.pos);if(d<75)pings.push({p:n.m.position,l:RES[n.k].n,c:'#'+new THREE.Color(RES[n.k].c).getHexString(),delay:d/45,res:1});}
 for(const c of creatures){const d=c.g.position.distanceTo(P.pos);if(d<110)pings.push({p:c.g.position,l:P.scanned.has(c.kind)?SPECIES[c.kind].n:'UNKNOWN LIFEFORM',c:c.kind==='razorjaw'?'#ff5a4a':'#e8fbff',delay:d/45,danger:c.kind==='razorjaw'});}
 for(const s of schools){const d=s.c.distanceTo(P.pos);if(d<90)pings.push({p:s.c,l:P.scanned.has(s.kind)?SPECIES[s.kind].n:'FISH SCHOOL',c:'#bdf6ff',delay:d/45});}
 pings.forEach(p=>p.t=7+p.delay);toast('SONAR',pings.filter(p=>p.res).length+' deposits · '+pings.filter(p=>p.danger).length+' predators in range');}
function dropBeacon(){if(P.beacons<=0){hint('NO BEACONS · SUIT UPGRADES ADD MORE');return;}P.beacons--;const col=BCOL[beaconList.length%BCOL.length],g=new THREE.Group();
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,1.4,8),new THREE.MeshStandardMaterial({color:0x2a3a44,roughness:.4,metalness:.6}));pole.position.y=.7;g.add(pole);
 const lamp2=new THREE.Mesh(new THREE.SphereGeometry(.22,14,10),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:4}));lamp2.position.y=1.5;g.add(lamp2);
 const y=Math.max(heightAt(P.pos.x,P.pos.z),P.pos.y-1.6);g.position.set(P.pos.x,y,P.pos.z);scene.add(g);const b={g,lamp:lamp2,c:col,n:'BEACON '+(beaconList.length+1),d:Math.round(depthOf(P.pos.y))};beaconList.push(b);sfx('bank');toast(b.n+' PLACED',b.d+'m deep · E to pick up');}
function openPda(){pdaOpen=true;$('pda').hidden=false;const kinds=Object.keys(SPECIES);$('pdas').innerHTML=kinds.map(k=>P.scanned.has(k)?`<div class="sp"><b>${SPECIES[k].n}</b>${SPECIES[k].info}</div>`:`<div class="sp no"><b>UNSCANNED</b>Hold Q while looking at an unknown lifeform.</div>`).join('');
 const g=[[`Scan 6 species (${P.scanned.size}/6)`,P.scanned.size>=6],[`Reach 300 m (deepest ${Math.round(P.maxD)} m)`,P.maxD>=300],[`Store 20 samples (${P.banked}/20)`,P.banked>=20]];const nx=TIERS[tier+1];
 $('pdag').innerHTML='<b style="color:#6ff0ff;letter-spacing:.14em">SURVEY GOALS</b>'+g.map(([t,ok])=>`<div class="${ok?'ok':''}">${ok?'■':'□'} ${t}</div>`).join('')+`<div style="margin-top:8px;color:#7fb8c8">${TIERS[tier].n} · rated ${P.rating} m${nx?' · next upgrade at '+nx.need+' stored':''} · ${P.beacons} beacons · ${P.flares} flares</div>`;}
const tp=new THREE.Vector3();
function marker(pos,label,col,sub,op=1){tp.copy(pos).project(cam);if(tp.z>1||Math.abs(tp.x)>1.1||Math.abs(tp.y)>1.1)return '';return `<div class="mk" style="left:${(tp.x*.5+.5)*100}%;top:${(-tp.y*.5+.5)*100}%;color:${col};opacity:${op}">${label}<em>${sub}</em><i></i></div>`;}
function drawMarks(dt){if(pingT>=0){pingT+=dt;const r=pingT*45;pingMesh.visible=pingT<2.4;pingMesh.scale.setScalar(Math.max(.1,r));pingMat.uniforms.uA.value=Math.max(0,1-pingT/2.4)*.9;}
 let h='';for(const p of pings){p.t-=dt;if(p.t<=0||p.t>7)continue;const d=Math.round(p.p.distanceTo(P.pos));h+=marker(p.p,p.l,p.c,d+'m',Math.min(1,p.t/1.5).toFixed(2));}
 for(const b of beaconList){b.lamp.material.emissiveIntensity=2.5+2*Math.sin(t*4);h+=marker(tp.copy(b.g.position).setY(b.g.position.y+2),b.n,b.c,Math.round(b.g.position.distanceTo(P.pos))+'m');}
 const pd=pod.position.distanceTo(P.pos);if(pd>20)h+=marker(tv.copy(pod.position).setY(pod.position.y+5),'LIFEPOD','#ff6a3a',Math.round(pd)+'m');
 $('marks').innerHTML=h;}
/* ================= game flow ================= */
function reset(){Object.assign(P,{o2:45,o2max:45,hp:100,rating:120,samples:{},banked:0,maxD:0,light:false,flares:3,flareT:0,score:0,yaw:0,pitch:-.2,bat:100,beacons:3,sonarCD:0});beaconList.splice(0).forEach(b=>scene.remove(b.g));pings.length=0;P.scanned=new Set();P.pos.set(3,-2,6);P.vel.set(0,0,0);tier=0;spawnSchools();spawnCreatures();spawnNodes();}
function start(){if(state==='menu'||state==='over')reset();state='play';$('menu').style.display='none';$('over').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');audio();try{canvas.requestPointerLock();}catch(e){}if(P.banked===0&&P.scanned.size===0)toast('ABYSS DIVER','Scan 6 species · reach 300m · store 20 samples');}
function end(title,win){state='over';try{document.exitPointerLock();}catch(e){}$('hud').hidden=true;$('over').hidden=false;document.body.classList.remove('playing');const score=P.score+P.scanned.size*200+Math.round(P.maxD)*2+(win?2000:0);P.final=score;$('otitle').textContent=title;
 $('ostats').textContent=`Score ${score} · deepest ${Math.round(P.maxD)}m · ${P.scanned.size}/6 species · ${P.banked} samples stored`;try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=5+Math.min(60,score/100|0);if(win)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'abyss3d';if(+(localStorage.getItem(k)||0)<score)localStorage.setItem(k,score);}catch(e){}}
$('go').onclick=start;$('again').onclick=start;$('post').onclick=()=>{let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] abyss3d '+(P.final||0))+'&body='+encodeURIComponent(`Game: Abyss Diver\nScore: ${P.final}\nDeepest: ${Math.round(P.maxD)}m\nSpecies: ${P.scanned.size}/6\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`),'_blank');};

/* ================= update ================= */
const tv=new THREE.Vector3();
function step(dt){t+=dt;U.uTime.value=t;if(state!=='play'){return;}
 const k=keys,fw=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0),st=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0),up=(k.Space?1:0)-(k.KeyC||k.ControlLeft?1:0),boost=(k.ShiftLeft||k.ShiftRight)&&P.bat>0&&(fw||st||up);if(boost){P.bat=Math.max(0,P.bat-dt*4.5);if(P.bat===0)hint('SCOOTER BATTERY EMPTY, RECHARGE AT THE LIFEPOD');}if(P.sonarCD>0)P.sonarCD-=dt;
 const under=P.pos.y<-.3;const dir=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(P.pitch,P.yaw,0,'YXZ')),right=new THREE.Vector3(1,0,0).applyEuler(new THREE.Euler(0,P.yaw,0));
 const want=tv.set(0,0,0).addScaledVector(dir,fw).addScaledVector(right,st);want.y+=up;if(want.lengthSq()>1)want.normalize();const sp=under?(boost?11:5.2):3;
 if(under){P.vel.lerp(want.multiplyScalar(sp),Math.min(1,dt*2.2));}else{P.vel.x=lerp(P.vel.x,want.x*sp,dt*3);P.vel.z=lerp(P.vel.z,want.z*sp,dt*3);P.vel.y-=9*dt;if(P.pos.y<.3&&want.y<0)P.vel.y=want.y*4;}
 P.pos.addScaledVector(P.vel,dt);const fy=heightAt(P.pos.x,P.pos.z)+1.1;if(P.pos.y<fy){P.pos.y=fy;P.vel.y=Math.max(0,P.vel.y);}if(P.pos.y>.6){P.pos.y=.6;P.vel.y=Math.min(P.vel.y,0);}P.pos.x=cl(P.pos.x,-WORLD+5,WORLD-5);P.pos.z=cl(P.pos.z,-WORLD+5,WORLD-5);
 if(P.pos.distanceTo(pod.position)<3.2){const away=P.pos.clone().sub(pod.position).setLength(3.2);P.pos.copy(pod.position).add(away);}
 const d=depthOf(P.pos.y);P.maxD=Math.max(P.maxD,d);
 if(under&&P.pos.y<-1){P.o2-=dt*(boost?1.5:1);if(P.o2<=0){P.o2=0;if(Math.random()<dt*2)hurt(8,'O2');}}else P.o2=Math.min(P.o2max,P.o2+dt*20);
 if(d>P.rating){if(Math.random()<dt*2)hurt(4,'CRUSH');}if(P.hp<100&&P.o2>0)P.hp=Math.min(100,P.hp+dt*1.2);if(P.flareT>0)P.flareT-=dt;
 // scanning
 scanTarget=null;if(k.KeyQ){let best=null,bd=18;const tgts=[...creatures.map(c=>({kind:c.kind,p:c.g.position,size:c.size})),...schools.map(s=>({kind:s.kind,p:s.c,size:3}))];for(const c of tgts){if(P.scanned.has(c.kind))continue;const to=c.p.clone().sub(P.pos),dd=to.length();if(dd>bd+c.size)continue;const ang=to.normalize().angleTo(dir);if(ang<.35+c.size*.02){bd=dd;best=c;}}
  if(best){scanTarget=best;scanT+=dt;if(scanT>=2.2){P.scanned.add(best.kind);scanT=0;P.score+=200;sfx('scan');toast(SPECIES[best.kind].n,SPECIES[best.kind].info);checkWin();}}else scanT=Math.max(0,scanT-dt*2);}else scanT=0;
 stepSchools(dt);stepCreatures(dt);if(hurtT>0)hurtT-=dt;
 const nn=nearest();hint(P.pos.distanceTo(pod.position)<7?'E  LIFEPOD: STORE SAMPLES + REFILL OXYGEN':nn?'E  COLLECT '+RES[nn.k].n:(P.o2<12&&under?'LOW OXYGEN, SURFACE NOW':''));}

/* ================= visual update ================= */
const deepC=new THREE.Color(0x020a14),shallowC=new THREE.Color(0x1a88a8),midC=new THREE.Color(0x0a3a5a);
function visuals(dt){const d=depthOf(cam.position.y),under=cam.position.y<0;const f=cl(d/260,0,1);
 const c=under?(d<50?shallowC.clone().lerp(midC,d/50):midC.clone().lerp(deepC,cl((d-50)/90,0,1))):new THREE.Color(0xa8d4ee);scene.fog.color.copy(c);scene.fog.density=under?lerp(.022,.034,f):.004;R.setClearColor(c);sky.visible=!under;
 const sunI=under?Math.exp(-d/55):1;U.uSun.value=sunI;sun.intensity=1.7*sunI+.02;hemi.intensity=.06+.8*sunI;rayM.uniforms.uI.value=under?Math.exp(-d/30):0;
 lamp.intensity=(P.light||d>70)&&under&&state!=='menu'?60:0;flareL.intensity=P.flareT>0?60*Math.min(1,P.flareT/3):0;if(P.flareT>0)flareL.position.copy(P.pos).addScaledVector(new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(P.pitch,P.yaw,0,'YXZ')),6);
 rays.forEach(r=>{const u=r.userData;const gx=Math.round((cam.position.x-u.ox)/160)*160+u.ox,gz=Math.round((cam.position.z-u.oz)/160)*160+u.oz;r.position.set(gx,-35,gz);r.rotation.set(u.tilt,Math.atan2(cam.position.x-gx,cam.position.z-gz),u.tilt*.5);});
 const sp=snow.geometry.attributes.position;for(let i=0;i<sp.count;i++){let y=sp.getY(i)-dt*.25;if(y<-30)y+=60;sp.setY(i,y);}sp.needsUpdate=true;snow.position.set(Math.floor(cam.position.x/60)*60,Math.floor(cam.position.y/60)*60,Math.floor(cam.position.z/60)*60);snow.visible=under;
 surfM.uniforms.camPos.value.copy(cam.position);surf.position.set(Math.round(cam.position.x/10)*10,0,Math.round(cam.position.z/10)*10);
 pod.position.y=-.4+Math.sin(t*.8)*.25;pod.rotation.z=Math.sin(t*.6)*.04;pod.userData.beacon.visible=pod.userData.bl.visible=Math.sin(t*3)>0;
 nodes.forEach(n=>n.m.rotation.y+=dt*.4);
 if(fx.grade){const hv=hurtT>0?hurtT/.6:0;fx.grade.uniforms.tint.value.setRGB(1,1-hv*.5,1-hv*.5);}}

function hud(){if($('hud').hidden)return;$('bat').style.setProperty('--p',P.bat+'%');$('batt').textContent=Math.ceil(P.bat);const d=Math.max(0,Math.round(-P.pos.y));$('dm').textContent=d;$('crush').textContent=d>P.rating?'CRUSH DEPTH '+P.rating+'m':d>P.rating*.85?'NEAR LIMIT '+P.rating+'m':'';
 $('o2').style.setProperty('--p',(P.o2/P.o2max*100)+'%');$('o2').style.setProperty('--c',P.o2<12?'#ff5a4a':'#6ff0ff');$('o2t').textContent=Math.ceil(P.o2);$('hp').style.setProperty('--p',P.hp+'%');$('hpt').textContent=Math.ceil(P.hp);
 const inv=Object.entries(P.samples).map(([k,v])=>RES[k].n+' '+v).join(' · ')||'EMPTY';$('tl').innerHTML=`<b>${TIERS[tier].n}</b><br>SPECIES ${P.scanned.size}/6 · STORED ${P.banked}/20 · DEEPEST ${Math.round(P.maxD)}m<br>CARRYING ${inv}<br>FLARES ${P.flares}`;
 const deg=((-P.yaw*180/Math.PI)%360+360)%360;const podB=((Math.atan2(pod.position.x-P.pos.x,-(pod.position.z-P.pos.z))*180/Math.PI)%360+360)%360;let s='';for(let a=-180;a<=540;a+=15){const lab=['N','E','S','W'][((a%360)+360)%360/90]||'·';s+=`<span style="position:absolute;left:${(a-deg)*2+160}px">${lab}</span>`;}
 let pb=podB-deg;while(pb>180)pb-=360;while(pb<-180)pb+=360;s+=`<span style="position:absolute;left:${pb*2+156}px;color:#ff6a3a">▼POD</span>`;for(const b of beaconList){let bb=((Math.atan2(b.g.position.x-P.pos.x,-(b.g.position.z-P.pos.z))*180/Math.PI)%360+360)%360-deg;while(bb>180)bb-=360;while(bb<-180)bb+=360;s+=`<span style="position:absolute;left:${bb*2+157}px;color:${b.c}">◆</span>`;}$('compin').innerHTML=s;
 $('scan').style.opacity=scanTarget?1:0;$('scanbar').style.width=(scanT/2.2*100)+'%';$('scanname').textContent=scanTarget?'UNKNOWN LIFEFORM':'';$('dmg').style.opacity=hurtT>0?hurtT:P.hp<30?.35:0;if(toastT>0){toastT-=1/60;if(toastT<=0)$('toast').style.opacity=0;}}

/* ================= loop ================= */
let fx;const buildFx=()=>{fx=cinematic(R,scene,cam,{exposure:.82,bloom:.65,bloomThreshold:.85,bloomRadius:.6,vignette:.45,saturation:1.1,ao:true,aoStrength:.7,grain:.035});};
function resize(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();fx&&fx.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);
buildFx();resize();spawnSchools();spawnCreatures();spawnNodes();
let last=performance.now(),mA=0;function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);
 if(state==='play'||state==='paused'){cam.position.copy(P.pos);cam.rotation.set(P.pitch,P.yaw,0,'YXZ');}else{mA+=dt*.05;cam.position.set(Math.cos(mA)*40+20,-16+Math.sin(mA*.7)*4,Math.sin(mA)*40-20);cam.lookAt(40,-24,-30);stepSchools(dt);stepCreatures(dt);}
 visuals(dt);fx.render();hud();if(state==='play')drawMarks(dt);else $('marks').innerHTML='';requestAnimationFrame(loop);}requestAnimationFrame(loop);
window.ABYSS={sonar,dropBeacon,openPda,beaconList,pings,drawMarks,step,P,start,get state(){return state;},heightAt,creatures,schools,nodes,use,bank,flare,keys,pod,visuals,render:()=>fx.render(),R,cam,end};
