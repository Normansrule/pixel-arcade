// PET BRAWL — 3D diorama: floating meadow island, wooden stage, market counter, pet views, battle playback, particles.
import * as THREE from '../vendor/three.module.min.js';
import {makePet,animatePet} from './models.js';
import {petById,foodById} from './data.js';
const V=THREE.Vector3,lerp=(a,b,t)=>a+(b-a)*t,cl=(v,a,b)=>v<a?a:v>b?b:v,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function rng(s){return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

/* ---------- layout ---------- */
export const TEAM_X=i=>5.1-i*2.5,TEAM_Z=-.6,SHOP_Y=1.05,SHOP_Z=3.3;
export const PET_SCALE=1.55;
export const shopX=(k,isFood,np)=>isFood?3.75+k*1.85:-5.95+k*1.85;
export const BAT_X=(side,i)=>(side===0?-1:1)*(1.3+i*1.95),BAT_Z=-.35;

/* ---------- small helpers ---------- */
function vmesh(geo,col,o={}){const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:col,roughness:o.r??.8,metalness:o.m??0,flatShading:o.flat!==false,emissive:o.e??0,emissiveIntensity:o.ei??1,transparent:!!o.t,opacity:o.t??1}));m.castShadow=o.cast!==false;m.receiveShadow=true;return m;}
function jitter(g,amt,seed=1){g=g.index?g.toNonIndexed():g;const p=g.attributes.position,r=rng(seed*7919+1),cache=new Map();for(let i=0;i<p.count;i++){const k=p.getX(i).toFixed(2)+','+p.getY(i).toFixed(2)+','+p.getZ(i).toFixed(2);let d=cache.get(k);if(!d){d=[(r()-.5)*amt,(r()-.5)*amt,(r()-.5)*amt];cache.set(k,d);}p.setXYZ(i,p.getX(i)+d[0],p.getY(i)+d[1],p.getZ(i)+d[2]);}g.computeVertexNormals();return g;}
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}

/* ---------- food models ---------- */
export function makeFood(id){const f=foodById(id),g=new THREE.Group(),c=f.col;const S=(col,x,y,z,sx,sy=sx,sz=sx,smooth)=>{const m=vmesh(new THREE.IcosahedronGeometry(1,smooth?2:1),col,{r:.45,flat:!smooth});m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;};
 const leaf=(x,y,z)=>{const m=vmesh(new THREE.ConeGeometry(.12,.3,4),'#3ab84a');m.position.set(x,y,z);m.rotation.z=.6;g.add(m);};
 switch(id){
  case'clover':case'goldclover':for(let i=0;i<3;i++){const a=i/3*Math.PI*2;S(id==='goldclover'?'#ffd700':'#5ad04a',Math.cos(a)*.16,.42,Math.sin(a)*.16,.17,.06,.17);}{const st=vmesh(new THREE.CylinderGeometry(.03,.03,.4,5),'#3a8a2a');st.position.y=.2;g.add(st);}break;
  case'honey':{const m=vmesh(new THREE.CylinderGeometry(.3,.3,.32,6),'#ffb02a',{r:.25,e:'#a05000',ei:.3});m.position.y=.3;g.add(m);S('#ffd86a',0,.48,0,.12,.05,.12,1);break;}
  case'seeds':for(let i=0;i<7;i++)S(i%2?'#3a2a1a':'#e8d8a0',Math.cos(i)*.15,.15+i*.04,Math.sin(i*1.7)*.15,.09,.05,.13);break;
  case'carrot':for(let k=-1;k<=1;k++){const m=vmesh(new THREE.ConeGeometry(.1,.55,6),'#ff8a2a');m.position.set(k*.16,.32,0);m.rotation.x=Math.PI;m.rotation.z=k*.2;g.add(m);leaf(k*.16,.62,0);}break;
  case'cookie':{const m=vmesh(new THREE.CylinderGeometry(.32,.32,.1,12),'#c88a4a');m.position.y=.25;m.rotation.x=.5;g.add(m);for(let i=0;i<5;i++)S('#4a2a1a',Math.cos(i*1.3)*.15,.3+Math.sin(i)*.08,.05+Math.sin(i*1.3)*.1,.04);break;}
  case'tea':{const m=S('#6ab04a',0,.3,0,.32,.06,.18);m.rotation.z=.5;S('#4a8a2a',0,.33,0,.02,.02,.2);break;}
  case'acorn':S('#a8763a',0,.25,0,.22,.27,.22,1);S('#6a6a7a',0,.44,0,.25,.12,.25);{const st=vmesh(new THREE.CylinderGeometry(.03,.03,.14,5),'#4a3a2a');st.position.y=.56;g.add(st);}break;
  case'rice':S('#f4f4f4',0,.28,0,.28,.26,.26,1);{const b=vmesh(new THREE.BoxGeometry(.58,.2,.3),'#1a3a2a');b.position.y=.2;g.add(b);}break;
  case'chili':{const m=vmesh(new THREE.ConeGeometry(.12,.6,8),'#ff3a2a',{r:.3});m.position.y=.32;m.rotation.z=1.2;g.add(m);leaf(-.25,.4,0);break;}
  case'shroom':{const st=vmesh(new THREE.CylinderGeometry(.08,.11,.3,7),'#f0e8ff');st.position.y=.15;g.add(st);const cap=vmesh(new THREE.SphereGeometry(.28,10,6,0,Math.PI*2,0,Math.PI/2),'#8a6aff',{e:'#6a3aff',ei:.7});cap.position.y=.28;g.add(cap);break;}
  case'platter':{const p=vmesh(new THREE.CylinderGeometry(.4,.32,.06,14),'#f0f0f0',{r:.3});p.position.y=.12;g.add(p);S('#ff3a4a',-.15,.24,0,.12);S('#ffd04a',.12,.24,.08,.1);S('#5ad04a',.05,.25,-.14,.1);S('#c88a4a',.1,.36,0,.09);break;}
  case'bun':S('#d8904a',0,.25,0,.3,.2,.28,1);S('#ff5a2a',0,.42,0,.08,.04,.08);break;
  case'jar':{const j=vmesh(new THREE.CylinderGeometry(.22,.22,.45,10),'#a8c8e8',{r:.1,t:.7});j.position.y=.28;g.add(j);const l=vmesh(new THREE.CylinderGeometry(.24,.24,.08,10),'#c83a3a');l.position.y=.54;g.add(l);S('#ff8a2a',0,.22,0,.15);break;}
  case'starfruit':{const sh=new THREE.Shape();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=i%2?.14:.32;i?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r);}const m=vmesh(new THREE.ExtrudeGeometry(sh,{depth:.18,bevelEnabled:false}),'#ffe04a',{r:.35});m.position.set(0,.36,-.09);g.add(m);break;}
  case'melon':S('#4ac85a',0,.3,0,.32,.3,.32,1);for(let i=0;i<4;i++){const t=vmesh(new THREE.TorusGeometry(.32,.025,4,16),'#2a7a3a');t.position.y=.3;t.rotation.y=i/4*Math.PI;g.add(t);}break;
  case'truffle':S('#c8a040',0,.26,0,.28,.24,.26);S('#ffd86a',.1,.38,.1,.06);break;
  case'cake':{for(let k=0;k<2;k++){const c2=vmesh(new THREE.CylinderGeometry(.3-k*.08,.3-k*.08,.18,12),k?'#ffffff':'#7ac8ff',{flat:false});c2.position.y=.12+k*.18;g.add(c2);}const b=vmesh(new THREE.ConeGeometry(.06,.25,4),'#ffe04a',{e:'#ffc000',ei:1});b.position.y=.55;g.add(b);break;}
  case'dragonfruit':S('#ff4a9a',0,.3,0,.27,.33,.27,1);for(let i=0;i<6;i++){const m=vmesh(new THREE.ConeGeometry(.06,.18,4),'#7ad84a');const a=i/6*Math.PI*2;m.position.set(Math.cos(a)*.22,.35+(i%2)*.1,Math.sin(a)*.22);m.rotation.z=-Math.cos(a);m.rotation.x=Math.sin(a);g.add(m);}break;
  default:S(c,0,.3,0,.28);}
 g.userData={food:true};return g;}

/* ---------- particles ---------- */
class Puffs{constructor(scene,n=900){this.n=n;this.i=0;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3));geo.setAttribute('pc',new THREE.BufferAttribute(this.c,4));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1));this.geo=geo;this.U={uScale:{value:400}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,vertexShader:'attribute float size;attribute vec4 pc;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=pc;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.2,d)*vC.a;if(a<.01)discard;gl_FragColor=vec4(vC.rgb,a);}'}));this.pts.frustumCulled=false;this.pts.renderOrder=5;scene.add(this.pts);}
 burst(p,n,sp,cols,size,life,grav=-2){for(let k=0;k<n;k++){const i=this.i;this.i=(i+1)%this.n;const a=Math.random()*Math.PI*2,b=Math.random()*Math.PI-.3,v=sp*(.4+Math.random()*.6);this.p.set([p.x,p.y,p.z],i*3);this.v.set([Math.cos(a)*Math.cos(b)*v,Math.sin(b)*v+sp*.3,Math.sin(a)*Math.cos(b)*v],i*3);const c=new THREE.Color(cols[k%cols.length]);this.oc.set([c.r,c.g,c.b],i*3);this.os[i]=size*(.6+Math.random()*.6);this.life[i]=this.max[i]=life*(.6+Math.random()*.5);this.g[i]=grav;}}
 update(dt){for(let i=0;i<this.n;i++){if(this.life[i]<=0){this.s[i]=0;continue;}this.life[i]-=dt;const k=Math.max(0,this.life[i]/this.max[i]);const d=Math.exp(-2.2*dt);this.v[i*3]*=d;this.v[i*3+1]=this.v[i*3+1]*d+this.g[i]*dt;this.v[i*3+2]*=d;this.p[i*3]+=this.v[i*3]*dt;this.p[i*3+1]+=this.v[i*3+1]*dt;this.p[i*3+2]+=this.v[i*3+2]*dt;
   this.c[i*4]=this.oc[i*3];this.c[i*4+1]=this.oc[i*3+1];this.c[i*4+2]=this.oc[i*3+2];this.c[i*4+3]=Math.min(1,k*2);this.s[i]=this.os[i]*(.5+(1-k)*.8);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.pc.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

/* ================= the diorama ================= */
export class Diorama{
 constructor(R){this.R=R;const s=this.scene=new THREE.Scene();this.t=0;this.views=new Map();this.items=new Map();
  s.fog=new THREE.Fog(0xcfe8ff,48,120);
  // sky dome
  const U={top:{value:new THREE.Color(0x2f7ee8)},hor:{value:new THREE.Color(0xbfe2ff)},sun:{value:new V(.4,.5,-.6).normalize()},t:{value:0}};this.skyU=U;
  const sky=new THREE.Mesh(new THREE.SphereGeometry(200,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 top,hor,sun;uniform float t;varying vec3 vD;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p*=2.;a*=.5;}return s;}void main(){vec3 d=normalize(vD);vec3 c=mix(hor,top,smoothstep(-.05,.6,d.y));float sd=max(dot(d,sun),0.);c+=vec3(1.,.9,.7)*(pow(sd,300.)*4.+pow(sd,10.)*.25);vec2 q=d.xz/(abs(d.y)+.15)*1.5+vec2(t*.01,0.);float cl=smoothstep(.45,.8,fb(q));c=mix(c,vec3(1.),cl*.7*smoothstep(-.3,.1,d.y)*(d.y<0.?1.2:.8));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));sky.renderOrder=-1;s.add(sky);this.sky=sky;
  // lights
  s.add(new THREE.HemisphereLight(0xdff0ff,0x6a8a4a,1.1));const sun=this.sun=new THREE.DirectionalLight(0xfff0d8,2.6);sun.position.set(8,16,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:14,bottom:-14,near:1,far:60});sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;s.add(sun);
  const rim=new THREE.DirectionalLight(0xa8c8ff,.6);rim.position.set(-10,8,-12);s.add(rim);
  this.buildIsland();this.puffs=new Puffs(s);
  this.cam=new THREE.PerspectiveCamera(42,16/9,.1,400);this.camPos=new V(0,8.8,15);this.camLook=new V(0,.7,.9);this.camWantPos=this.camPos.clone();this.camWantLook=this.camLook.clone();
  this.cam.position.copy(this.camPos);this.cam.lookAt(this.camLook);this.mode='shop';this.counterY=0;}
 buildIsland(){const s=this.scene,r=rng(77);
  // top disc with vertex-coloured grass
  const top=new THREE.CylinderGeometry(13,12.4,1.2,64,4);const pa=top.attributes.position,col=new Float32Array(pa.count*3);const g1=new THREE.Color(0x6ac04a),g2=new THREE.Color(0x8ad85a),dirt=new THREE.Color(0x8a6a44);
  for(let i=0;i<pa.count;i++){const y=pa.getY(i),x=pa.getX(i),z=pa.getZ(i);const c=y>.55?g1.clone().lerp(g2,(Math.sin(x*.7)*Math.cos(z*.6)+1)*.35+r()*.15):dirt.clone().multiplyScalar(.85+r()*.2);if(y>.55)pa.setY(i,y+Math.sin(x*.4+z*.3)*.06);col.set([c.r,c.g,c.b],i*3);}
  top.setAttribute('color',new THREE.BufferAttribute(col,3));top.computeVertexNormals();const tm=new THREE.Mesh(top,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true}));tm.position.y=-.6;tm.receiveShadow=true;s.add(tm);
  const under=jitter(new THREE.ConeGeometry(12.6,11,24,5),1.1,3);under.rotateX(Math.PI);const um=new THREE.Mesh(under,new THREE.MeshStandardMaterial({color:0x7a5a3e,roughness:1,flatShading:true}));um.position.y=-6.7;s.add(um);
  for(let k=0;k<7;k++){const rk=vmesh(jitter(new THREE.DodecahedronGeometry(1.2+r()*1.4,0),.4,k),0x8a7a6a);const a=r()*Math.PI*2;rk.position.set(Math.cos(a)*10.5,-2-r()*3,Math.sin(a)*10.5);s.add(rk);}
  // floating mini islets + cloud sea
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2+.4,d=30+r()*12;const isl=new THREE.Group();const t2=vmesh(new THREE.CylinderGeometry(2.2+r()*1.5,2,1,10),0x6ac04a);const u2=vmesh(jitter(new THREE.ConeGeometry(2.2,3.5,9,2),.3,k),0x7a5a3e);u2.rotation.x=Math.PI;u2.position.y=-2.2;isl.add(t2,u2);
   const tr=this.tree(r);tr.scale.setScalar(.7);tr.position.y=.5;isl.add(tr);isl.position.set(Math.cos(a)*d,-3+r()*8,Math.sin(a)*d-12);isl.userData.bob=r()*6;s.add(isl);(this.islets||(this.islets=[])).push(isl);}
  const cm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,emissive:0x8899aa,emissiveIntensity:.35,transparent:true,opacity:.95});const cg=new THREE.IcosahedronGeometry(1,2);
  const clouds=new THREE.InstancedMesh(cg,cm,70);const m4=new THREE.Matrix4();for(let k=0;k<70;k++){const a=r()*Math.PI*2,d=16+r()*50,sz=3+r()*5;m4.compose(new V(Math.cos(a)*d,-9-r()*4,Math.sin(a)*d),new THREE.Quaternion(),new V(sz*1.6,sz*.7,sz));clouds.setMatrixAt(k,m4);}s.add(clouds);
  // wooden stage
  const stage=new THREE.Group();for(let k=0;k<9;k++){const pl=vmesh(new THREE.BoxGeometry(15.6,.22,.42),k%2?0xb8834e:0xc8935a,{r:.85});pl.position.set(0,.11,-2.05+k*.46);stage.add(pl);}
  for(const x of[-7.6,7.6])for(const z of[-2.1,1.6]){const p=vmesh(new THREE.CylinderGeometry(.14,.16,.7,6),0x8a5a2e);p.position.set(x,.3,z);stage.add(p);}s.add(stage);
  // slot pads
  this.pads=[];for(let i=0;i<5;i++){const pad=vmesh(new THREE.CylinderGeometry(.98,1.06,.08,28),0xe8d8b8,{r:.6});pad.position.set(TEAM_X(i),.26,TEAM_Z);pad.receiveShadow=true;s.add(pad);const ring=new THREE.Mesh(new THREE.TorusGeometry(1.02,.06,6,40),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.0}));ring.rotation.x=Math.PI/2;ring.position.set(TEAM_X(i),.32,TEAM_Z);s.add(ring);this.pads.push({pad,ring});}
  // market counter
  const counter=this.counter=new THREE.Group();const top2=vmesh(new THREE.BoxGeometry(18.4,.24,2.2),0xd8a868,{r:.7});top2.position.set(-.3,.88,SHOP_Z);counter.add(top2);
  const front=vmesh(new THREE.BoxGeometry(17,.8,.18),0xa8683a);front.position.set(-.3,.42,SHOP_Z+1);counter.add(front);
  const stripe=canvasTex(512,32,(x,w,h)=>{for(let i=0;i<16;i++){x.fillStyle=i%2?'#ffffff':'#ff4d00';x.fillRect(i*32,0,32,h);}});const band=new THREE.Mesh(new THREE.PlaneGeometry(17,.36),new THREE.MeshStandardMaterial({map:stripe,roughness:.8}));band.position.set(-.3,.62,SHOP_Z+1.1);counter.add(band);
  const sign=canvasTex(512,128,(x,w,h)=>{x.fillStyle='#2a1a10';x.fillRect(0,0,w,h);x.strokeStyle='#ffcf6a';x.lineWidth=8;x.strokeRect(6,6,w-12,h-12);x.fillStyle='#ffe8b0';x.font='bold 76px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('PET MARKET',w/2,h/2+4);});
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.85),new THREE.MeshStandardMaterial({map:sign,roughness:.6}));sg.position.set(-.3,.4,SHOP_Z+1.12);counter.add(sg);
  const divider=vmesh(new THREE.BoxGeometry(.12,.5,1.8),0x8a5a2e);divider.position.set(2.65,1.2,SHOP_Z);counter.add(divider);
  for(let k=0;k<7;k++){const crate=vmesh(new THREE.BoxGeometry(1.5,.16,1.3),0xe0b878,{r:.8});crate.position.set(k<5?shopX(k,false):shopX(k-5,true),1.06,SHOP_Z);counter.add(crate);}
  s.add(counter);
  // trees, bushes, flowers, fence, lanterns, pond
  for(const[x,z,sc]of[[-10.2,-5,1.1],[-7.5,-8,1.3],[9.8,-5.5,1.2],[6.5,-8.4,1],[-11.6,-1.5,.85],[11.8,-2,.9],[2,-9.5,1.15],[-3.5,-9.6,1]]){const t=this.tree(r);t.position.set(x,0,z);t.scale.setScalar(sc);s.add(t);}
  const bushG=jitter(new THREE.IcosahedronGeometry(.7,1),.25,5);const bm=new THREE.MeshStandardMaterial({color:0x4aa83a,roughness:.9,flatShading:true});const bush=new THREE.InstancedMesh(bushG,bm,26);for(let k=0;k<26;k++){const a=Math.PI+r()*Math.PI,d=9+r()*3;m4.compose(new V(Math.cos(a)*d,.15,Math.sin(a)*d*.85-1),new THREE.Quaternion(),new V(1+r(),.7+r()*.5,1+r()));bush.setMatrixAt(k,m4);}bush.castShadow=true;s.add(bush);
  const flG=new THREE.IcosahedronGeometry(.12,0);const fl=new THREE.InstancedMesh(flG,new THREE.MeshStandardMaterial({roughness:.6}),90);const fcols=[0xff6a8a,0xffe04a,0xffffff,0xb08aff,0xff9a3a];for(let k=0;k<90;k++){const a=r()*Math.PI*2,d=8+r()*4.4;m4.compose(new V(Math.cos(a)*d,.12,Math.sin(a)*d),new THREE.Quaternion(),new V(1,1,1));fl.setMatrixAt(k,m4);fl.setColorAt(k,new THREE.Color(fcols[k%5]));}s.add(fl);
  const grassG=new THREE.ConeGeometry(.06,.35,3);const gr=new THREE.InstancedMesh(grassG,new THREE.MeshStandardMaterial({color:0x5ab03a,roughness:1}),500);for(let k=0;k<500;k++){const a=r()*Math.PI*2,d=Math.sqrt(r())*12.5;const x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.abs(z+.3)<2.6&&Math.abs(x)<8.2||Math.abs(z-SHOP_Z)<1.3&&Math.abs(x)<9){m4.makeScale(0,0,0);}else m4.compose(new V(x,.15,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(r()*.3,r()*6,r()*.3)),new V(1,.6+r(),1));gr.setMatrixAt(k,m4);}s.add(gr);
  for(let k=0;k<15;k++){const x=-8.4+k*1.2;const post=vmesh(new THREE.BoxGeometry(.14,.9,.14),0xd8c8a8);post.position.set(x,.45,-5.6+Math.sin(k*.5)*.2);s.add(post);}const rail=vmesh(new THREE.BoxGeometry(17,.1,.08),0xd8c8a8);rail.position.set(0,.7,-5.6);s.add(rail);
  this.lamps=[];for(const[x,z]of[[-8.6,-1.8],[8.6,-1.8],[-8.6,3],[8.6,3]]){const p=vmesh(new THREE.CylinderGeometry(.07,.09,2.2,6),0x3a3a44);p.position.set(x,1.1,z);s.add(p);const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.26,1),new THREE.MeshStandardMaterial({color:0xfff0b0,emissive:0xffc860,emissiveIntensity:1.6}));b.position.set(x,2.3,z);s.add(b);this.lamps.push(b);}
  const pond=new THREE.Mesh(new THREE.CircleGeometry(1.6,24),new THREE.MeshStandardMaterial({color:0x4ab8e8,roughness:.1,metalness:.2,emissive:0x0a3a5a,emissiveIntensity:.3}));pond.rotation.x=-Math.PI/2;pond.scale.set(1.4,1,1);pond.position.set(-10,.05,-1.5);s.add(pond);
  for(let k=0;k<5;k++){const sh=vmesh(new THREE.CylinderGeometry(.05,.07,.3,5),0xf0e8e0);const cap=vmesh(new THREE.SphereGeometry(.18,8,5,0,Math.PI*2,0,Math.PI/2),k%2?0xff5a4a:0xffb03a);const x=6+Math.cos(k*2)*1.6,z=-4.2+Math.sin(k*1.3)*.8;sh.position.set(x,.15,z);cap.position.set(x,.28,z);s.add(sh,cap);}}
 tree(r){const g=new THREE.Group();const tr=vmesh(new THREE.CylinderGeometry(.2,.32,2.2,6),0x7a5230);tr.position.y=1.1;g.add(tr);const cols=[0x3a9a3a,0x4ab04a,0x2f8a3a];for(let k=0;k<3;k++){const b=vmesh(jitter(new THREE.IcosahedronGeometry(1.2-k*.15,1),.3,k+Math.floor(r()*99)),cols[k]);b.position.set((r()-.5)*.8,2.4+k*.7,(r()-.5)*.8);g.add(b);}return g;}

 /* ---------- views ---------- */
 petView(key,id,o={}){let v=this.views.get(key);if(v&&v.id===id)return v;if(v)this.removeView(key,false);const b=petById(id);const g=makePet(b.m);const ms=b.m.s||1,k=PET_SCALE*(.62+.38*ms)/ms;g.scale.setScalar(k);this.scene.add(g);
  v={key,id,g,ks:k,pos:new V(o.x||0,o.y||0,o.z||0),want:new V(o.x||0,o.y||0,o.z||0),face:o.face??Math.PI/2-.45,phase:Math.random()*6,mode:'idle',lunge:0,hurt:0,faint:0,spawn:1,pop:0,flash:0,tier:b.t,hidden:false,bounce:0};
  g.position.copy(v.pos);this.views.set(key,v);return v;}
 foodView(key,id,o){let v=this.views.get(key);if(v&&v.id===id)return v;if(v)this.removeView(key,false);const g=makeFood(id);g.scale.setScalar(1.5);this.scene.add(g);g.traverse(m=>{if(m.isMesh)m.castShadow=true;});
  v={key,id,g,pos:new V(o.x,o.y,o.z),want:new V(o.x,o.y,o.z),face:0,phase:Math.random()*6,mode:'food',lunge:0,hurt:0,faint:0,spawn:1,pop:0,flash:0,food:true,bounce:0};g.position.copy(v.pos);this.views.set(key,v);return v;}
 removeView(key,poof=true){const v=this.views.get(key);if(!v)return;if(poof)this.poof(v.g.position,v.food?['#ffffff','#ffe8a0']:['#ffffff','#e8e8f0']);this.scene.remove(v.g);v.g.traverse(o=>{if(o.geometry&&o.geometry!==undefined&&!o.userData.keep)o.geometry.dispose&&o.geometry.dispose();});if(v.ice)this.scene.remove(v.ice);this.views.delete(key);}
 clearViews(prefix){for(const k of [...this.views.keys()])if(!prefix||k.startsWith(prefix))this.removeView(k,false);}
 poof(p,cols=['#ffffff'],n=18){this.puffs.burst(new V(p.x,p.y+.6,p.z),n,3.2,cols,.55,.7,1.5);}
 sparkle(p,col,n=14){this.puffs.burst(new V(p.x,p.y+.8,p.z),n,4,[col,'#ffffff'],.3,.6,-3);}
 setIce(v,on){if(on&&!v.ice){const m=new THREE.Mesh(new THREE.BoxGeometry(1.35,1.5,1.2),new THREE.MeshStandardMaterial({color:0xbfe8ff,transparent:true,opacity:.42,roughness:.05,metalness:.1,emissive:0x2a6a9a,emissiveIntensity:.25}));this.scene.add(m);v.ice=m;}else if(!on&&v.ice){this.scene.remove(v.ice);v.ice=null;}}
 setMode(m){this.mode=m;if(m==='shop'){this.camWantPos.set(0,8.4,12.9);this.camWantLook.set(0,.55,1.2);}else if(m==='battle'){this.camWantPos.set(0,5.4,15.6);this.camWantLook.set(0,1.0,-.3);}else if(m==='menu'){this.camWantPos.set(-3.4,4.6,14.6);this.camWantLook.set(2.6,1.1,-.6);}}
 update(dt){this.t+=dt;this.skyU.t.value=this.t;const T=this.t;
  this.counterY=lerp(this.counterY,this.mode!=='shop'?-3.2:0,Math.min(1,dt*4));this.counter.position.y=this.counterY;
  (this.islets||[]).forEach(i=>i.position.y+=Math.sin(T*.5+i.userData.bob)*.003);
  this.lamps.forEach((l,k)=>l.material.emissiveIntensity=1.4+Math.sin(T*3+k)*.2);
  for(const v of this.views.values()){const g=v.g;v.pos.lerp(v.want,Math.min(1,dt*(v.fast?14:7)));const moving=v.pos.distanceTo(v.want)>.08;
   let x=v.pos.x,y=v.pos.y,z=v.pos.z;const fdir=Math.sin(v.face)>0?1:-1;
   if(v.lunge>0){v.lunge=Math.max(0,v.lunge-dt*2.4);const k=Math.sin((1-v.lunge)*Math.PI);x+=fdir*k*.95;y+=k*.35;}
   if(v.hurt>0){v.hurt=Math.max(0,v.hurt-dt*3);x+=Math.sin(v.hurt*40)*.12*v.hurt;}
   if(v.bounce>0){v.bounce=Math.max(0,v.bounce-dt*2.5);y+=Math.sin(v.bounce*Math.PI)*.5;}
   if(v.spawn<1)v.spawn=Math.min(1,v.spawn+dt*3.2);
   let sc=(v.food?1.35:v.ks*(this.mode==='battle'?.88:v.key[0]==='s'?.8:1))*ease(v.spawn)*(1+Math.sin(Math.min(1,v.pop)*Math.PI)*.25);if(v.pop>0)v.pop=Math.max(0,v.pop-dt*3);
   g.position.set(x,y,z);g.rotation.y=lerp(g.rotation.y,v.face,Math.min(1,dt*8));
   if(v.faint>0){v.faint=Math.min(1,v.faint+dt*2.2);g.rotation.z=fdir*-v.faint*1.6;g.position.y+=Math.sin(v.faint*Math.PI)*.6;sc*=1-v.faint*.5;}
   if(v.dragging){g.position.y+=.5;sc*=1.08;}
   g.scale.setScalar(Math.max(.001,sc));
   if(!v.food)animatePet(g,T,v.phase,moving?'walk':'idle');else{g.rotation.y=Math.sin(T*1.2+v.phase)*.4;g.position.y+=Math.sin(T*2+v.phase)*.04;}
   if(v.ice){v.ice.position.set(g.position.x,g.position.y+.6,g.position.z);}}
  this.puffs.update(dt);
  this.camPos.lerp(this.camWantPos,Math.min(1,dt*2.6));this.camLook.lerp(this.camWantLook,Math.min(1,dt*2.6));this.cam.position.copy(this.camPos);this.cam.lookAt(this.camLook);
  if(this.shake>0){this.shake=Math.max(0,this.shake-dt*3);this.cam.position.x+=(Math.random()-.5)*this.shake*.3;this.cam.position.y+=(Math.random()-.5)*this.shake*.3;}this.cam.updateMatrixWorld();}
 project(p,w,h,out={}){const v=p.clone().project(this.cam);out.x=(v.x+1)/2*w;out.y=(1-v.y)/2*h;out.z=v.z;return out;}
 pickPlane(nx,ny,y=1){const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(nx,ny),this.cam);const t=(y-ray.ray.origin.y)/ray.ray.direction.y;return ray.ray.origin.clone().addScaledVector(ray.ray.direction,t);}}
