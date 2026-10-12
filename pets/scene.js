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
class Puffs{constructor(scene,n=900,add=false){this.n=n;this.i=0;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3));geo.setAttribute('pc',new THREE.BufferAttribute(this.c,4));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1));this.geo=geo;this.U={uScale:{value:400}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,depthTest:!add,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,vertexShader:'attribute float size;attribute vec4 pc;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=pc;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',fragmentShader:add?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=((1.-smoothstep(0.,.5,d))*.7+(1.-smoothstep(0.,.14,d)))*vC.a;if(a<.01)discard;gl_FragColor=vec4(vC.rgb*a*1.8,1.);}':'varying vec4 vC;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);float a=smoothstep(.5,.2,d)*vC.a;if(a<.01)discard;gl_FragColor=vec4(vC.rgb*(1.-q.y*.35),a);}'}));this.pts.frustumCulled=false;this.pts.renderOrder=add?6:5;scene.add(this.pts);}
 burst(p,n,sp,cols,size,life,grav=-2,up=.3){for(let k=0;k<n;k++){const i=this.i;this.i=(i+1)%this.n;const a=Math.random()*Math.PI*2,b=Math.random()*Math.PI-.3,v=sp*(.4+Math.random()*.6);this.p.set([p.x,p.y,p.z],i*3);this.v.set([Math.cos(a)*Math.cos(b)*v,Math.sin(b)*v+sp*up,Math.sin(a)*Math.cos(b)*v],i*3);const c=new THREE.Color(cols[k%cols.length]);this.oc.set([c.r,c.g,c.b],i*3);this.os[i]=size*(.6+Math.random()*.6);this.life[i]=this.max[i]=life*(.6+Math.random()*.5);this.g[i]=grav;}}
 update(dt){for(let i=0;i<this.n;i++){if(this.life[i]<=0){this.s[i]=0;continue;}this.life[i]-=dt;const k=Math.max(0,this.life[i]/this.max[i]);const d=Math.exp(-2.2*dt);this.v[i*3]*=d;this.v[i*3+1]=this.v[i*3+1]*d+this.g[i]*dt;this.v[i*3+2]*=d;this.p[i*3]+=this.v[i*3]*dt;this.p[i*3+1]+=this.v[i*3+1]*dt;this.p[i*3+2]+=this.v[i*3+2]*dt;
   this.c[i*4]=this.oc[i*3];this.c[i*4+1]=this.oc[i*3+1];this.c[i*4+2]=this.oc[i*3+2];this.c[i*4+3]=Math.min(1,k*2);this.s[i]=this.os[i]*(.5+(1-k)*.8);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.pc.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

/* ---------- static batching: many parts -> one vertex-coloured mesh per material ---------- */
const _m4=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new V(),_s=new V();
class Batch{constructor(){this.l=[];this.n=0;}
 // o.g=[bottom,top] brightness gradient along the part's own height, o.j=per-vertex jitter, o.uv=fixed uv
 add(geo,col,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0,o={}){const g=geo.index?geo.toNonIndexed():geo.clone();if(!g.attributes.normal)g.computeVertexNormals();const P=g.attributes.position,k=P.count;g.computeBoundingBox();const y0=g.boundingBox.min.y,yh=Math.max(1e-4,g.boundingBox.max.y-y0);
  const c=new THREE.Color(col),cs=new Float32Array(k*3),G=o.g||[1,1],J=o.j||0;for(let i=0;i<k;i++){const t=(P.getY(i)-y0)/yh,m=lerp(G[0],G[1],t)*(1+(Math.random()-.5)*J);cs[i*3]=c.r*m;cs[i*3+1]=c.g*m;cs[i*3+2]=c.b*m;}
  g.applyMatrix4(_m4.compose(_p.set(x,y,z),_q.setFromEuler(_e.set(rx,ry,rz)),_s.set(sx,sy,sz)));const uv=new Float32Array(k*2);if(g.attributes.uv&&!o.uv)uv.set(g.attributes.uv.array.subarray(0,k*2));else if(o.uv)for(let i=0;i<k;i++){uv[i*2]=o.uv[0];uv[i*2+1]=o.uv[1];}
  this.l.push([g.attributes.position.array,g.attributes.normal.array,uv,cs]);this.n+=k;g.dispose();return this;}
 mesh(mat,cast=true,recv=true){const n=this.n,a=[new Float32Array(n*3),new Float32Array(n*3),new Float32Array(n*2),new Float32Array(n*3)];let o=0;for(const L of this.l){const k=L[0].length/3;a[0].set(L[0],o*3);a[1].set(L[1],o*3);a[2].set(L[2],o*2);a[3].set(L[3],o*3);o+=k;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(a[0],3));geo.setAttribute('normal',new THREE.BufferAttribute(a[1],3));geo.setAttribute('uv',new THREE.BufferAttribute(a[2],2));geo.setAttribute('color',new THREE.BufferAttribute(a[3],3));geo.computeBoundingSphere();
  const m=new THREE.Mesh(geo,mat);m.castShadow=cast;m.receiveShadow=recv;this.l=[];this.n=0;return m;}}

/* ---------- procedural textures ---------- */
function rep(t,x,y){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(x,y);return t;}
function pair(w,h,draw){// colour map + matching greyscale bump map from one seeded draw
 const mk=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};const a=mk(),b=mk();draw(a.getContext('2d'),w,h,rng(9),false);draw(b.getContext('2d'),w,h,rng(9),true);
 const ta=new THREE.CanvasTexture(a);ta.colorSpace=THREE.SRGBColorSpace;ta.anisotropy=8;const tb=new THREE.CanvasTexture(b);tb.anisotropy=4;return[ta,tb];}
const hsl=(h,s,l)=>`hsl(${h},${s}%,${l}%)`,grey=l=>`hsl(0,0%,${l}%)`;
function texGrass(){return pair(512,512,(x,w,h,r,m)=>{x.fillStyle=m?grey(45):hsl(98,46,52);x.fillRect(0,0,w,h);
 for(let i=0;i<60;i++){const l=r();x.fillStyle=m?grey(40+l*15):hsl(90+l*25,40+l*15,44+l*14);x.globalAlpha=.25;x.beginPath();x.arc(r()*w,r()*h,20+r()*50,0,7);x.fill();}x.globalAlpha=1;
 for(let i=0;i<14000;i++){const px=r()*w,py=r()*h,l=r(),a=-Math.PI/2+(r()-.5)*1.1,len=4+r()*9;x.strokeStyle=m?grey(30+l*65):hsl(82+r()*36,42+r()*25,30+l*38);x.lineWidth=1+r()*1.3;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*len,py+Math.sin(a)*len);x.stroke();}
 for(let i=0;i<120;i++){const l=r();x.fillStyle=m?grey(80):l<.5?'#fff6c8':'#e8f8a0';x.beginPath();x.arc(r()*w,r()*h,1+r()*1.4,0,7);x.fill();}});}
function texWood(){return pair(1024,128,(x,w,h,r,m)=>{x.fillStyle=m?grey(60):'#efe2cc';x.fillRect(0,0,w,h);
 for(let i=0;i<70;i++){const y0=r()*h,l=r();x.strokeStyle=m?grey(30+l*30):`rgba(${120+l*40|0},${78+l*30|0},${40+l*20|0},${.18+r()*.25})`;x.lineWidth=.6+r()*2.2;x.beginPath();for(let px=0;px<=w;px+=16){const y=y0+Math.sin(px*.006+i)*5+Math.sin(px*.03+i*2)*1.2;px?x.lineTo(px,y):x.moveTo(px,y);}x.stroke();}
 for(let i=0;i<5;i++){const kx=r()*w,ky=r()*h;const g=x.createRadialGradient(kx,ky,1,kx,ky,9+r()*6);g.addColorStop(0,m?grey(15):'rgba(90,50,20,.75)');g.addColorStop(1,m?'rgba(0,0,0,0)':'rgba(90,50,20,0)');x.fillStyle=g;x.beginPath();x.ellipse(kx,ky,16,8,0,0,7);x.fill();}
 x.fillStyle=m?grey(20):'rgba(70,40,20,.5)';x.fillRect(0,0,w,2);x.fillRect(0,h-2,w,2);});}
function texBark(){return pair(128,256,(x,w,h,r,m)=>{x.fillStyle=m?grey(55):'#d8c4ae';x.fillRect(0,0,w,h);for(let i=0;i<90;i++){const px=r()*w,l=r();x.strokeStyle=m?grey(15+l*30):`rgba(70,45,25,${.25+l*.4})`;x.lineWidth=1+r()*3;x.beginPath();x.moveTo(px,0);for(let y=0;y<=h;y+=16)x.lineTo(px+Math.sin(y*.05+i)*3,y);x.stroke();}});}
function texStone(){return pair(256,256,(x,w,h,r,m)=>{const c=w/2;x.fillStyle=m?grey(55):'#e9dcc4';x.fillRect(0,0,w,h);
 for(let i=0;i<2600;i++){const l=r();x.fillStyle=m?grey(30+l*50):`rgba(${150+l*90|0},${135+l*80|0},${110+l*70|0},.35)`;x.fillRect(r()*w,r()*h,1+r()*2,1+r()*2);}
 x.lineWidth=7;x.strokeStyle=m?grey(22):'rgba(120,96,70,.55)';x.beginPath();x.arc(c,c,c*.86,0,7);x.stroke();x.lineWidth=2;x.beginPath();x.arc(c,c,c*.72,0,7);x.stroke();
 for(let k=0;k<12;k++){const a=k/12*Math.PI*2;x.beginPath();x.arc(c+Math.cos(a)*c*.79,c+Math.sin(a)*c*.79,3,0,7);x.fillStyle=m?grey(25):'rgba(120,96,70,.6)';x.fill();}
 x.fillStyle=m?grey(30):'rgba(150,118,84,.42)';x.beginPath();x.ellipse(c,c+16,30,24,0,0,7);x.fill();for(const[dx,dy,s]of[[-34,-22,12],[-13,-40,13],[13,-40,13],[34,-22,12]]){x.beginPath();x.ellipse(c+dx,c+dy,s*.8,s,dx*.02,0,7);x.fill();}});}
function texFelt(a,b,check){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle=a;x.fillRect(0,0,128,128);if(check){x.fillStyle=b;for(let i=0;i<8;i++){x.globalAlpha=.55;x.fillRect(i*16,0,8,128);x.fillRect(0,i*16,128,8);}x.globalAlpha=1;}const r=rng(4);for(let i=0;i<1600;i++){x.fillStyle=`rgba(${r()<.5?0:255},${r()<.5?0:255},${r()<.5?0:255},.06)`;x.fillRect(r()*128,r()*128,1,2);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function texWaterN(){const n=256,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),id=x.createImageData(n,n),H=(i,j)=>{const u=i/n*Math.PI*2,v=j/n*Math.PI*2;return Math.sin(u*3+v)*.5+Math.sin(v*5-u*2)*.35+Math.sin(u*7+v*4)*.18+Math.sin(u*2-v*9)*.12;};
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const dx=H(i+1,j)-H(i-1,j),dy=H(i,j+1)-H(i,j-1),k=(j*n+i)*4,nn=new V(-dx*6,-dy*6,1).normalize();id.data[k]=(nn.x*.5+.5)*255;id.data[k+1]=(nn.y*.5+.5)*255;id.data[k+2]=(nn.z*.5+.5)*255;id.data[k+3]=255;}x.putImageData(id,0,0);const t=new THREE.CanvasTexture(c);return rep(t,3,3);}
function softRing(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.08)');g.addColorStop(.78,'rgba(255,255,255,.9)');g.addColorStop(.88,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
function blob(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
// wind sway in the vertex shader (grass, leaves); amt scales by local height
function windy(mat,amt,U,useY=true){mat.onBeforeCompile=sh=>{sh.uniforms.uT=U;sh.vertexShader='uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 vec3 wp=position;
 #ifdef USE_INSTANCING
 wp=(instanceMatrix*vec4(position,1.)).xyz;
 #endif
 float wh=${useY?'max(position.y,0.)':'1.'}*${amt.toFixed(3)};transformed.x+=sin(uT*1.9+wp.x*.45+wp.z*.3)*wh;transformed.z+=cos(uT*1.3+wp.x*.27-wp.z*.2)*wh*.6;`);};return mat;}
// ground height: flat around the stage, market and pond, gently rolling elsewhere
const PONDX=-10,PONDZ=-1.5;
function groundH(x,z){const dx=Math.max(0,Math.abs(x)-9.6),dz=Math.max(0,-2.6-z,z-4.7),dr=Math.hypot(dx,dz),dp=Math.hypot((x-PONDX)/1.4,z-PONDZ);const m=cl((dr-.6)/2.5,0,1)*cl((dp-2.2)/1.2,0,1)*cl((12.6-Math.hypot(x,z))/1.2,0,1);return m*(Math.sin(x*.55+z*.3)*.16+Math.sin(z*.8-x*.25)*.1+.08);}

// one clump of tapered grass blades, dark at the root and sunlit at the tip; normals point up for soft meadow shading
function bladeClump(r){const P=[],C=[],N=[];for(let b=0;b<7;b++){const a=r()*6.28,d=r()*.16,h=.22+r()*.3,w=.03+r()*.02,ln=(r()-.5)*.6,bx=Math.cos(a)*d,bz=Math.sin(a)*d,an=r()*Math.PI,ca=Math.cos(an),sa=Math.sin(an);
  const pt=(t,sd)=>{const ww=w*(1-t)*sd,o=ln*t*t*h;return[bx+ca*ww-sa*o,t*h,bz+sa*ww+ca*o];},L0=pt(0,-1),R0=pt(0,1),L1=pt(.55,-1),R1=pt(.55,1),T=pt(1,0);
  for(const v of[L0,R0,R1,L0,R1,L1,L1,R1,T]){P.push(...v);const t=v[1]/h;C.push(.3+t*.42,.42+t*.42,.2+t*.16);N.push(0,1,0);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return g;}
// five petals around a yellow heart (vertex colour white petals tinted per instance)
function flowerHead(){const b=new Batch();for(let i=0;i<5;i++){const a=i/5*Math.PI*2;b.add(new THREE.CircleGeometry(.065,7),0xffffff,Math.cos(a)*.065,0,Math.sin(a)*.065,1,1,1,-Math.PI/2,0,0);}b.add(new THREE.IcosahedronGeometry(.04,1),0xffd23a,0,.015,0);const m=b.mesh(null);return m.geometry;}
/* ================= the diorama ================= */
export class Diorama{
 constructor(R){this.R=R;const s=this.scene=new THREE.Scene();this.t=0;this.views=new Map();this.items=new Map();this.windU={value:0};
  s.fog=new THREE.Fog(0xcfe6fb,46,125);
  // sky dome
  const U={top:{value:new THREE.Color(0x2f7ee8)},hor:{value:new THREE.Color(0xc4e4ff)},sun:{value:new V(.4,.5,-.6).normalize()},t:{value:0}};this.skyU=U;
  const sky=new THREE.Mesh(new THREE.SphereGeometry(200,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 top,hor,sun;uniform float t;varying vec3 vD;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p*=2.;a*=.5;}return s;}void main(){vec3 d=normalize(vD);vec3 c=mix(hor,top,smoothstep(-.05,.6,d.y));float sd=max(dot(d,sun),0.);c+=vec3(1.,.9,.7)*(pow(sd,300.)*4.+pow(sd,10.)*.25);vec2 q=d.xz/(abs(d.y)+.15)*1.5+vec2(t*.01,0.);float f=fb(q);float cl=smoothstep(.45,.8,f);vec3 cc=mix(vec3(.78,.84,.93),vec3(1.,.98,.95),smoothstep(.5,.9,fb(q+vec2(.08,.05))));c=mix(c,cc,cl*.75*smoothstep(-.3,.1,d.y)*(d.y<0.?1.2:.8));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));sky.renderOrder=-1;s.add(sky);this.sky=sky;
  // image-based light: a small procedural sky + meadow, prefiltered, so the glossy parts pick up reflections
  {const pm=new THREE.PMREMGenerator(R),es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{sun:U.sun},vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform vec3 sun;varying vec3 vD;void main(){vec3 d=normalize(vD);vec3 c=d.y>0.?mix(vec3(.66,.76,.86),vec3(.24,.44,.8),pow(d.y,.55)):mix(vec3(.4,.52,.3),vec3(.2,.3,.14),min(1.,-d.y*2.5));c+=vec3(1.,.92,.78)*pow(max(dot(d,sun),0.),48.)*7.;gl_FragColor=vec4(c,1.);}'})));
   s.environment=pm.fromScene(es,.03).texture;pm.dispose();}
  // lights
  s.add(new THREE.HemisphereLight(0xdff0ff,0x6a8a4a,.7));const sun=this.sun=new THREE.DirectionalLight(0xfff0d8,2.7);sun.position.set(8,16,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:13,bottom:-13,near:4,far:44});sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;sun.shadow.radius=3;s.add(sun);
  const rim=new THREE.DirectionalLight(0xa8c8ff,.7);rim.position.set(-10,8,-12);s.add(rim);
  this.buildIsland();this.puffs=new Puffs(s);this.glow=new Puffs(s,500,true);this.buildFx();
  this.cam=new THREE.PerspectiveCamera(42,16/9,.1,400);this.camPos=new V(0,8.8,15);this.camLook=new V(0,.7,.9);this.camWantPos=this.camPos.clone();this.camWantLook=this.camLook.clone();
  this.cam.position.copy(this.camPos);this.cam.lookAt(this.camLook);this.mode='shop';this.counterY=0;this.setQuality(2);}
 setQuality(q){this.q=q;this.grass.count=[520,1100,1700][q];this.flowers[0].count=this.flowers[1].count=[60,110,150][q];this.motes.visible=q>0;this.flies.visible=q>0;
  this.sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}for(const v of this.views.values())if(v.blob)v.blob.visible=q===0;}
 buildIsland(){const s=this.scene,r=rng(77),WU=this.windU;
  const [gT,gB]=texGrass(),[wT,wB]=texWood(),[bT,bB]=texBark(),[sT,sB]=texStone();
  const M={wood:new THREE.MeshStandardMaterial({vertexColors:true,map:rep(wT,1,1),bumpMap:rep(wB,1,1),bumpScale:2.2,roughness:.78}),
   bark:new THREE.MeshStandardMaterial({vertexColors:true,map:rep(bT,2,1),bumpMap:rep(bB,2,1),bumpScale:3,roughness:.95}),
   leaf:windy(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.82,flatShading:true}),.012,WU),
   rock:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true}),
   paint:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45}),
   metal:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.75})};this.M=M;
  const B={wood:new Batch(),bark:new Batch(),leaf:new Batch(),rock:new Batch(),paint:new Batch(),metal:new Batch()};
  const geo={ico1:new THREE.IcosahedronGeometry(1,1),ico0:new THREE.IcosahedronGeometry(1,0),dod:new THREE.DodecahedronGeometry(1,0),box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,10),cyl6:new THREE.CylinderGeometry(1,1,1,6),cone:new THREE.ConeGeometry(1,1,7),sph:new THREE.SphereGeometry(1,14,9)};
  // meadow top: finely ringed disc, gently rolling, grass texture tinted by vertex colour (worn earth round the stage)
  const top=new THREE.RingGeometry(.01,13,96,30);top.rotateX(-Math.PI/2);const pa=top.attributes.position,col=new Float32Array(pa.count*3),g1=new THREE.Color(0xb8e0a0),g2=new THREE.Color(0xe8f4c8),dirt=new THREE.Color(0xc8a47a),gc=new THREE.Color();
  for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);pa.setY(i,groundH(x,z));const dx=Math.max(0,Math.abs(x)-8.1),dz=Math.max(0,-2.4-z,z-1.9),wear=cl(1-Math.hypot(dx,dz)/.9,0,1)*(.6+r()*.4),dp=Math.hypot((x-PONDX)/1.4,z-PONDZ),mud=cl(1-(dp-1.55)/.5,0,1);
   gc.copy(g1).lerp(g2,cl((Math.sin(x*.5)*Math.cos(z*.45)+1)*.4+r()*.12,0,1)).lerp(dirt,Math.max(wear*.75,mud*.9));col.set([gc.r,gc.g,gc.b],i*3);}
  top.setAttribute('color',new THREE.BufferAttribute(col,3));top.computeVertexNormals();const tuv=top.attributes.uv;for(let i=0;i<tuv.count;i++)tuv.setXY(i,pa.getX(i)/26*7,pa.getZ(i)/26*7);
  const tm=new THREE.Mesh(top,new THREE.MeshStandardMaterial({vertexColors:true,map:rep(gT,1,1),bumpMap:rep(gB,1,1),bumpScale:1.6,roughness:.93}));tm.receiveShadow=true;s.add(tm);
  // cliff skirt + rocky underside with earthy strata
  const side=new THREE.CylinderGeometry(13,12.5,1.3,96,3,true);side.translate(0,-.62,0);const under=jitter(new THREE.ConeGeometry(12.6,11,40,8),1,3);under.rotateX(Math.PI);under.translate(0,-6.75,0);
  for(const[gq,base]of[[side,0x8a6440],[under,0x7a5a3e]]){const P=gq.attributes.position,cc=new Float32Array(P.count*3),c0=new THREE.Color(base),c1=new THREE.Color(0x5e4632),c2=new THREE.Color(0x8a8278);for(let i=0;i<P.count;i++){const y=P.getY(i);gc.copy(c0).lerp(c1,(Math.sin(y*2.3)*.5+.5)*.6).lerp(c2,cl(-y/12,0,1)*.7).multiplyScalar(y>-.12?1.25:.92+((i*7)%5)*.03);cc.set([gc.r,gc.g,gc.b],i*3);}gq.setAttribute('color',new THREE.BufferAttribute(cc,3));}
  const sm=new THREE.Mesh(side,M.rock);sm.receiveShadow=true;s.add(sm,new THREE.Mesh(under,M.rock));
  const lip=new THREE.TorusGeometry(12.98,.11,5,120);lip.rotateX(Math.PI/2);B.leaf.add(lip,0x5aa83a,0,0,0,1,1,1,0,0,0,{j:.3});
  for(let k=0;k<9;k++){const a=r()*Math.PI*2;B.rock.add(jitter(new THREE.DodecahedronGeometry(1,0),.35,k),0x9a8a7a,Math.cos(a)*10.6,-2-r()*3.5,Math.sin(a)*10.6,1.2+r()*1.4,1+r(),1.2+r()*1.4,r(),r(),r(),{g:[.7,1.1],j:.15});}
  for(let k=0;k<26;k++){const a=r()*Math.PI*2,d=12.2+r()*.5;B.bark.add(geo.cone,0x5a3e28,Math.cos(a)*d,-1.3-r()*.6,Math.sin(a)*d,.06+r()*.05,1+r()*1.6,.06,Math.PI+(r()-.5)*.4,0,(r()-.5)*.4);}
  // floating islets (each merged; they bob) + cloud sea
  this.islets=[];for(let k=0;k<5;k++){const a=k/5*Math.PI*2+.4,d=30+r()*12,b=new Batch(),rad=2.2+r()*1.5;b.add(new THREE.CylinderGeometry(rad,rad*.92,.5,14),0x6ac04a,0,.25,0,1,1,1,0,0,0,{g:[.8,1.1],j:.1});b.add(jitter(new THREE.ConeGeometry(rad*.95,3.5,12,3),.3,k),0x7a5a3e,0,-1.75,0,1,1,1,Math.PI,0,0,{g:[1,.6],j:.2});
   b.add(geo.cyl6,0x7a5230,0,1.1,0,.14,1.4,.14,0,0,0,{g:[.7,1]});for(let j=0;j<3;j++)b.add(jitter(new THREE.IcosahedronGeometry(.8-j*.1,1),.2,k*3+j),[0x3a9a3a,0x4ab04a,0x2f8a3a][j],(r()-.5)*.6,1.9+j*.5,(r()-.5)*.6,1,1,1,0,0,0,{g:[.6,1.25]});
   const isl=b.mesh(M.leaf,false,false);isl.position.set(Math.cos(a)*d,-3+r()*8,Math.sin(a)*d-12);isl.userData.bob=r()*6;s.add(isl);this.islets.push(isl);}
  const cm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,emissive:0x8899aa,emissiveIntensity:.35,transparent:true,opacity:.95});const cg=new THREE.IcosahedronGeometry(1,2);
  const clouds=new THREE.InstancedMesh(cg,cm,70);const m4=new THREE.Matrix4();for(let k=0;k<70;k++){const a=r()*Math.PI*2,d=16+r()*50,sz=3+r()*5;m4.compose(new V(Math.cos(a)*d,-9-r()*4,Math.sin(a)*d),new THREE.Quaternion(),new V(sz*1.6,sz*.7,sz));clouds.setMatrixAt(k,m4);}s.add(clouds);
  // wooden stage: textured planks with per-plank tint, edge beams, posts, steps
  for(let k=0;k<9;k++){const t=.88+r()*.2;B.wood.add(geo.box,new THREE.Color(0xd09a62).multiplyScalar(t),0,.11+(r()-.5)*.012,-2.05+k*.46,15.6,.22,.42,0,(r()-.5)*.004,(r()-.5)*.003);}
  for(const z of[-2.32,1.86])B.wood.add(geo.box,0x8a5a32,0,.1,z,15.9,.26,.14);for(const x of[-7.88,7.88])B.wood.add(geo.box,0x8a5a32,x,.1,-.23,.14,.26,4.3);
  for(const x of[-7.6,7.6])for(const z of[-2.1,1.6]){B.wood.add(geo.cyl,0x7a4e2a,x,.36,z,.15,.75,.15);B.metal.add(geo.cyl,0x3a3a44,x,.62,z,.17,.06,.17);B.metal.add(geo.sph,0xd8b060,x,.76,z,.09);}
  B.wood.add(geo.box,0xb88050,0,.04,2.14,4,.08,.4);
  // slot pads: carved stone medallions with a paw emblem
  this.pads=[];const padB=new Batch(),padTop=new THREE.CylinderGeometry(.98,1.06,.1,40,1);for(let i=0;i<5;i++){padB.add(padTop,0xe2d8c6,TEAM_X(i),.26,TEAM_Z,1,1,1,0,i*.7,0);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(1.02,.06,6,40),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.0}));ring.rotation.x=Math.PI/2;ring.position.set(TEAM_X(i),.32,TEAM_Z);s.add(ring);this.pads.push({pad:null,ring});}
  const pads=padB.mesh(new THREE.MeshStandardMaterial({vertexColors:true,map:sT,bumpMap:sB,bumpScale:3,roughness:.7}),false);s.add(pads);
  for(let i=0;i<5;i++){const rim=new THREE.TorusGeometry(1.03,.035,6,48);rim.rotateX(Math.PI/2);B.metal.add(rim,0xc89a48,TEAM_X(i),.31,TEAM_Z);}
  // market counter (moves as one group): wooden top, front, trays with felt
  const counter=this.counter=new THREE.Group(),cb=new Batch();
  cb.add(geo.box,0xe0b070,-.3,.88,SHOP_Z,18.4,.24,2.2);cb.add(geo.box,0x9a5e34,-.3,.42,SHOP_Z+1,17,.8,.18);cb.add(geo.box,0x9a5e34,-.3,.42,SHOP_Z-1,17,.8,.18);cb.add(geo.box,0x7a4a2a,-.3,.98,SHOP_Z+1.08,18.5,.08,.1);
  cb.add(geo.box,0x8a5a2e,2.65,1.2,SHOP_Z,.12,.5,1.8);for(const x of[-9.2,8.6])cb.add(geo.box,0x7a4a2a,x,.45,SHOP_Z,.3,.9,2.1);
  const felt=[new Batch(),new Batch()];for(let k=0;k<7;k++){const x=k<5?shopX(k,false):shopX(k-5,true);cb.add(geo.box,0xd8aa6a,x,1.02,SHOP_Z,1.5,.06,1.3);for(const sd of[-1,1]){cb.add(geo.box,0xc0904e,x,1.08,SHOP_Z+sd*.62,1.5,.14,.07);cb.add(geo.box,0xc0904e,x+sd*.72,1.08,SHOP_Z,.07,.14,1.2);}
   felt[k<5?0:1].add(new THREE.PlaneGeometry(1.32,1.12),0xffffff,x,1.056,SHOP_Z,1,1,1,-Math.PI/2,0,0);}
  counter.add(cb.mesh(M.wood),felt[0].mesh(new THREE.MeshStandardMaterial({vertexColors:true,map:texFelt('#3f8a5a','#000',false),roughness:1}),false),felt[1].mesh(new THREE.MeshStandardMaterial({vertexColors:true,map:texFelt('#fff4ec','#e8443a',true),roughness:1}),false));
  const stripe=canvasTex(512,32,(x,w,h)=>{for(let i=0;i<16;i++){x.fillStyle=i%2?'#ffffff':'#ff4d00';x.fillRect(i*32,0,32,h);}x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,h-4,w,4);});const band=new THREE.Mesh(new THREE.PlaneGeometry(17,.36),new THREE.MeshStandardMaterial({map:stripe,roughness:.8}));band.position.set(-.3,.62,SHOP_Z+1.1);counter.add(band);
  const sign=canvasTex(512,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3a2414');g.addColorStop(1,'#1e120a');x.fillStyle=g;x.fillRect(0,0,w,h);x.strokeStyle='#ffcf6a';x.lineWidth=8;x.strokeRect(6,6,w-12,h-12);x.fillStyle='#ffe8b0';x.font='bold 76px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('PET MARKET',w/2,h/2+4);});
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.85),new THREE.MeshStandardMaterial({map:sign,roughness:.4,metalness:.1,emissive:0xffffff,emissiveMap:sign,emissiveIntensity:.12}));sg.position.set(-.3,.4,SHOP_Z+1.12);counter.add(sg);
  s.add(counter);
  // trees, bushes, flowers, grass, fence, lanterns, bunting, pond
  for(const[x,z,sc]of[[-10.2,-5,1.1],[-7.5,-8,1.3],[9.8,-5.5,1.2],[6.5,-8.4,1],[-11.6,-1.5,.85],[11.8,-2,.9],[2,-9.5,1.15],[-3.5,-9.6,1],[11,1.8,.75],[-6,-10.6,.8]])this.tree(B,r,x,groundH(x,z),z,sc);
  for(let k=0;k<30;k++){const a=Math.PI+r()*Math.PI,d=9+r()*3,x=Math.cos(a)*d,z=Math.sin(a)*d*.85-1;if(Math.hypot((x-PONDX)/1.4,z-PONDZ)<2.3)continue;const sc=.6+r()*.5;B.leaf.add(jitter(new THREE.IcosahedronGeometry(.7,1),.25,k),[0x4aa83a,0x3f9a36,0x5ab845][k%3],x,groundH(x,z)+.15,z,sc*(1+r()),sc*(.75+r()*.4),sc*(1+r()),0,r()*6,0,{g:[.55,1.25],j:.08});}
  for(let k=0;k<5;k++){const x=6+Math.cos(k*2)*1.6,z=-4.2+Math.sin(k*1.3)*.8;B.paint.add(geo.cyl,0xf0e8e0,x,.15,z,.06,.3,.06);B.paint.add(new THREE.SphereGeometry(.18,10,6,0,Math.PI*2,0,Math.PI/2),k%2?0xff5a4a:0xffb03a,x,.27,z,1,1,1,0,0,0,{g:[.7,1.1]});for(let j=0;j<3;j++)B.paint.add(geo.sph,0xffffff,x+Math.cos(j*2.1+k)*.1,.36+(j%2)*.02,z+Math.sin(j*2.1+k)*.1,.03,.015,.03);}
  for(let k=0;k<15;k++){const x=-8.4+k*1.2,z=-5.6+Math.sin(k*.5)*.2,y=groundH(x,z);B.wood.add(geo.box,0xe4d6bc,x,.45+y,z,.14,.95,.14,0,0,(r()-.5)*.06);B.wood.add(geo.cone,0xe4d6bc,x,.98+y,z,.1,.14,.1,0,Math.PI/4,0);}
  for(const h of[.42,.72])for(let k=0;k<14;k++){const x=-8.4+k*1.2+.6,z=-5.6+Math.sin((k+.5)*.5)*.2;B.wood.add(geo.box,0xd8c8a8,x,h+groundH(x,z),z,1.24,.09,.06);}
  const lampP=[[-8.6,-1.8],[8.6,-1.8],[-8.6,3],[8.6,3]],bulbs=new Batch();for(const[x,z]of lampP){B.metal.add(geo.cyl,0x2e2e36,x,1.25,z,.07,2.5,.07);B.metal.add(geo.cyl6,0x2e2e36,x,.08,z,.22,.16,.22);B.metal.add(geo.cone,0x2e2e36,x,2.78,z,.3,.2,.3);B.metal.add(geo.cyl6,0xb8903a,x,2.5,z,.2,.04,.2);
   for(let j=0;j<4;j++){const a=j/4*Math.PI*2+Math.PI/4;B.metal.add(geo.box,0x2e2e36,x+Math.cos(a)*.17,2.6,z+Math.sin(a)*.17,.03,.36,.03);}bulbs.add(new THREE.IcosahedronGeometry(.15,2),0xffffff,x,2.6,z);}
  const bulb=bulbs.mesh(new THREE.MeshStandardMaterial({color:0xfff0b0,emissive:0xffc860,emissiveIntensity:1.6}),false,false);s.add(bulb);this.lamps=[bulb];
  // bunting strung between the back lanterns
  {const N=24,pts=[];for(let i=0;i<=N;i++){const t=i/N;pts.push(new V(-8.6+t*17.2,2.68-Math.sin(t*Math.PI)*.62,-1.8));}B.metal.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),48,.016,4),0x3a3a3a);const fc=[0xff4d00,0xfff4e0,0x2ab8c8,0xffd23a,0x7ad04a];const tri=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([.17,0,0,-.17,0,0,0,-.38,0],3));tri.computeVertexNormals();
   for(let i=1;i<N;i++){const p=pts[i];B.paint.add(tri,fc[i%5],p.x,p.y-.01,p.z,1,1,1,0,0,(pts[i+1].y-pts[i-1].y)/(pts[i+1].x-pts[i-1].x)*.8);}}
  // pond: ripple normal map, glossy water, muddy bank, pebbles, lily pads, reeds
  this.waterN=texWaterN();const pond=new THREE.Mesh(new THREE.CircleGeometry(1.6,40),new THREE.MeshStandardMaterial({color:0x2a8cc0,roughness:.22,metalness:.05,normalMap:this.waterN,normalScale:new THREE.Vector2(.25,.25),transparent:true,opacity:.88,emissive:0x0a3a5a,emissiveIntensity:.25}));pond.rotation.x=-Math.PI/2;pond.scale.set(1.4,1,1);pond.position.set(PONDX,.05,PONDZ);pond.receiveShadow=true;s.add(pond);
  for(let k=0;k<22;k++){const a=k/22*Math.PI*2+r()*.2,x=PONDX+Math.cos(a)*1.62*1.4,z=PONDZ+Math.sin(a)*1.62;B.rock.add(geo.dod,0xb0a898,x,.04,z,.12+r()*.12,.07+r()*.06,.12+r()*.1,r(),r()*6,0,{g:[.7,1.1]});}
  for(let k=0;k<3;k++){const lp=new THREE.CylinderGeometry(.24,.24,.02,16,1,false,0,5.6);B.paint.add(lp,0x4aa040,PONDX-.8+k*.7,.07,PONDZ+(k%2?.5:-.4),1+k*.15,1,1+k*.15,0,r()*6,0);}B.paint.add(geo.sph,0xffb8d0,PONDX-.1,.12,PONDZ+.5,.07,.05,.07);
  for(let k=0;k<12;k++){const a=-1.2+r()*1.4,x=PONDX+Math.cos(a)*2.1,z=PONDZ+Math.sin(a)*1.5;B.leaf.add(geo.cone,0x5a9a3a,x,.4,z,.04,.8+r()*.4,.04,(r()-.5)*.2,0,(r()-.5)*.2,{g:[.6,1.2]});if(k%3===0)B.bark.add(geo.cyl,0x6a4026,x,.75,z+.02,.05,.18,.05);}
  // grass clumps (instanced, swaying) and flowers
  const gg=bladeClump(rng(5));const gm=windy(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,side:THREE.DoubleSide}),.22,WU);const grass=this.grass=new THREE.InstancedMesh(gg,gm,1700);grass.receiveShadow=true;
  const okAt=(x,z)=>!(Math.abs(z+.25)<2.6&&Math.abs(x)<8.3||Math.abs(z-SHOP_Z)<1.5&&Math.abs(x)<9.6||Math.hypot((x-PONDX)/1.4,z-PONDZ)<1.75);const spot=()=>{for(;;){const a=r()*Math.PI*2,d=Math.sqrt(r())*12.6,x=Math.cos(a)*d,z=Math.sin(a)*d;if(okAt(x,z))return[x,z];}};
  for(let k=0;k<1700;k++){const[x,z]=spot(),sc=.7+r()*.7;m4.compose(new V(x,groundH(x,z)-.02,z),new THREE.Quaternion().setFromEuler(new THREE.Euler((r()-.5)*.2,r()*6,(r()-.5)*.2)),new V(sc,sc*(.7+r()*.6),sc));grass.setMatrixAt(k,m4);grass.setColorAt(k,new THREE.Color().setHSL(.23+r()*.07,.5+r()*.2,.46+r()*.16));}s.add(grass);
  const stemG=new THREE.CylinderGeometry(.012,.016,.32,4);stemG.translate(0,.16,0);const headG=flowerHead();const fls=[new THREE.InstancedMesh(stemG,new THREE.MeshStandardMaterial({color:0x4a9a3a,roughness:.9}),150),new THREE.InstancedMesh(headG,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,side:THREE.DoubleSide}),150)];this.flowers=fls;
  const fcols=[0xff6a8a,0xffe04a,0xffffff,0xb08aff,0xff9a3a,0x7ac8ff];for(let k=0;k<150;k++){let x,z;do{const a=r()*Math.PI*2,d=7.6+r()*4.9;x=Math.cos(a)*d;z=Math.sin(a)*d;}while(!okAt(x,z));const y=groundH(x,z),sc=.8+r()*.5,h=.8+r()*.6;m4.compose(new V(x,y,z),new THREE.Quaternion(),new V(sc,sc*h,sc));fls[0].setMatrixAt(k,m4);m4.compose(new V(x,y+.32*sc*h,z),new THREE.Quaternion().setFromEuler(new THREE.Euler((r()-.5)*.6,r()*6,(r()-.5)*.6)),new V(sc,sc,sc));fls[1].setMatrixAt(k,m4);fls[1].setColorAt(k,new THREE.Color(fcols[k%6]));}
  for(const f of fls){f.castShadow=false;f.receiveShadow=true;s.add(f);}
  for(const k in B)if(B[k].n)s.add(B[k].mesh(M[k]));}
 tree(B,r,x,y,z,sc){const tw=r()*6,lean=(r()-.5)*.12;B.bark.add(new THREE.CylinderGeometry(.17,.34,2.5,9,3),0x9a7050,x,y+1.2*sc,z,sc,sc,sc,lean,tw,lean,{g:[.7,1.05]});
  for(let k=0;k<4;k++){const a=k/4*Math.PI*2+tw;B.bark.add(new THREE.ConeGeometry(.16,.6,6),0x8a6040,x+Math.cos(a)*.3*sc,y+.12*sc,z+Math.sin(a)*.3*sc,sc,sc,sc,Math.sin(a)*1.1,0,-Math.cos(a)*1.1);}
  for(const sd of[-1,1])B.bark.add(new THREE.CylinderGeometry(.04,.09,.8,6),0x9a7050,x+sd*.28*sc,y+2.35*sc,z,sc,sc,sc,0,tw,-sd*.7);
  const cols=[0x3a9a3a,0x4ab04a,0x2f8a3a,0x55b84a,0x3c9e40];const n=5;for(let k=0;k<n;k++){const big=k<2,rad=(big?1.15:.85)-k*.04,a=k*2.3+tw;B.leaf.add(jitter(new THREE.IcosahedronGeometry(rad,1),.28,k+Math.floor(r()*99)),cols[k],x+(k?Math.cos(a)*.7:0)*sc,y+(2.55+(k?.15+r()*.6:.75))*sc+(k===n-1?.5*sc:0),z+(k?Math.sin(a)*.7:0)*sc,sc,sc*.92,sc,0,r()*6,0,{g:[.5,1.3],j:.06});}}
 /* ---------- battle + ambient effects ---------- */
 buildFx(){const s=this.scene;this.blobTex=blob();
  const rt=softRing();this.rings=[];const rg=new THREE.PlaneGeometry(2,2);rg.rotateX(-Math.PI/2);for(let k=0;k<8;k++){const m=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({map:rt,color:0xffffff,transparent:true,opacity:0,depthWrite:false,fog:false}));m.visible=false;m.renderOrder=4;s.add(m);this.rings.push({m,t:1,dur:.4,s:2});}
  // drifting pollen motes (moved in the vertex shader)
  const n=110,p=new Float32Array(n*3),r=rng(31);for(let i=0;i<n;i++){p[i*3]=(r()-.5)*24;p[i*3+1]=.4+r()*3.4;p[i*3+2]=-9+r()*14;}const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(p,3));this.moteU={uT:this.windU};
  this.motes=new THREE.Points(mg,new THREE.ShaderMaterial({uniforms:this.moteU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:'uniform float uT;varying float vA;void main(){vec3 q=position;float s=q.x*1.7+q.z*.9;q.x+=sin(uT*.3+s)*.8;q.y+=sin(uT*.5+s*1.3)*.35;q.z+=cos(uT*.25+s)*.6;vec4 mv=modelViewMatrix*vec4(q,1.);vA=.5+.5*sin(uT*1.7+s*3.);gl_PointSize=70./max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=(1.-smoothstep(0.,.5,d))*vA*.55;gl_FragColor=vec4(vec3(1.,.92,.6)*a,a);}'}));this.motes.frustumCulled=false;s.add(this.motes);
  // butterflies: two instanced wings each, flapping along lazy loops
  const sh=new THREE.Shape();sh.moveTo(0,0);sh.bezierCurveTo(.12,.16,.26,.14,.24,.02);sh.bezierCurveTo(.26,-.1,.12,-.14,0,0);const wg=new THREE.ShapeGeometry(sh,6);wg.rotateX(-Math.PI/2);
  this.flies=new THREE.InstancedMesh(wg,new THREE.MeshStandardMaterial({roughness:.6,side:THREE.DoubleSide,emissive:0x222222}),16);this.flies.frustumCulled=false;this.fly=[];const fc=[0xffb03a,0x8ad0ff,0xffffff,0xff7ab0,0xffe04a,0xb08aff,0xff6a3a,0x9af07a];
  for(let k=0;k<8;k++){this.fly.push({cx:(r()-.5)*20,cz:-9+r()*7,rx:1.5+r()*3,rz:1+r()*2,sp:.2+r()*.3,ph:r()*6,y:.8+r()*1.6});const c=new THREE.Color(fc[k]);this.flies.setColorAt(k*2,c);this.flies.setColorAt(k*2+1,c);}s.add(this.flies);}
 ring(x,y,z,col,size=2,dur=.45){const r=this.rings.find(r=>r.t>=1)||this.rings[0];r.t=0;r.dur=dur;r.s=size;r.m.material.color.set(col);r.m.position.set(x,y,z);r.m.visible=true;}
 impact(p){const q=new V(p.x,p.y+.7,p.z+.3);this.ring(p.x,.36,p.z,'#ffe6a8',3.8,.5);this.puffs.burst(q,26,8,['#ffc21a','#ff7a00','#fff3b0'],.55,.5,-9,.4);this.glow.burst(q,10,6,['#ffd23a','#ff8a2a'],.5,.3,-6);this.glow.burst(q,1,0,['#fff0c0'],3.4,.16,0,0);this.puffs.burst(new V(p.x,.45,p.z),14,2.8,['#e8d8c0','#ffffff','#d8c0a0'],.6,.7,.4,.1);}
 hit(p,col='#ffb03a'){const q=new V(p.x,p.y+.9,p.z+.5);this.puffs.burst(q,14,5.5,[col,'#ffe070','#ff5a2a'],.45,.45,-7);this.glow.burst(q,1,0,['#fff4d0'],2.2,.16,0,0);}
 soul(p){this.ring(p.x,.36,p.z,'#c8d4ff',2.4,.7);this.puffs.burst(new V(p.x,p.y+.7,p.z),14,1.4,['#e8eeff','#c8d4ff','#ffd8f0'],.5,1.3,2.2,.6);this.glow.burst(new V(p.x,p.y+.7,p.z),8,1.4,['#a8b8ff','#ffffff'],.5,1.1,2,.6);}
 aura(p,col='#ffd23a'){this.ring(p.x,.36,p.z,col,2.4,.55);this.puffs.burst(new V(p.x,p.y+.3,p.z),16,2.2,[col,'#ffffff','#fff0a0'],.45,.8,3,.9);this.glow.burst(new V(p.x,p.y+.5,p.z),6,1.5,[col],.6,.6,2.5,.8);}
 fxUpdate(dt,T){this.windU.value=T;this.waterN.offset.set(T*.012,T*.007);this.glow.update(dt);
  for(const r of this.rings){if(r.t>=1)continue;r.t=Math.min(1,r.t+dt/r.dur);const e=1-Math.pow(1-r.t,3);r.m.scale.setScalar(.25+r.s*e*.5);r.m.material.opacity=Math.min(1,(1-r.t)*1.4);if(r.t>=1)r.m.visible=false;}
  if(this.flies.visible){const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new V(),sc=new V();this.fly.forEach((f,k)=>{const a=T*f.sp+f.ph,x=f.cx+Math.sin(a)*f.rx,z=f.cz+Math.sin(a*2)*f.rz,y=f.y+Math.sin(T*2.3+f.ph)*.25,hd=Math.atan2(Math.cos(a)*f.rx,Math.cos(a*2)*2*f.rz),fl=Math.sin(T*16+f.ph)*1.1;
   for(const sd of[-1,1]){e.set(0,hd-Math.PI/2,sd*fl,'YXZ');q.setFromEuler(e);m4.compose(p.set(x,y,z),q,sc.set(sd,1,1));this.flies.setMatrixAt(k*2+(sd>0?1:0),m4);}});this.flies.instanceMatrix.needsUpdate=true;}}

 /* ---------- views ---------- */
 petView(key,id,o={}){let v=this.views.get(key);if(v&&v.id===id)return v;if(v)this.removeView(key,false);const b=petById(id);const g=makePet(b.m);const ms=b.m.s||1,k=PET_SCALE*(.62+.38*ms)/ms;g.scale.setScalar(k);this.scene.add(g);
  v={key,id,g,ks:k,pos:new V(o.x||0,o.y||0,o.z||0),want:new V(o.x||0,o.y||0,o.z||0),face:o.face??Math.PI/2-.45,phase:Math.random()*6,mode:'idle',lunge:0,hurt:0,faint:0,spawn:1,pop:0,flash:0,tier:b.t,hidden:false,bounce:0};
  g.position.copy(v.pos);v.blob=new THREE.Mesh(this.blobG||(this.blobG=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2)),this.blobM||(this.blobM=new THREE.MeshBasicMaterial({map:this.blobTex,transparent:true,depthWrite:false})));v.blob.visible=this.q===0;v.blob.renderOrder=2;this.scene.add(v.blob);this.views.set(key,v);return v;}
 foodView(key,id,o){let v=this.views.get(key);if(v&&v.id===id)return v;if(v)this.removeView(key,false);const g=makeFood(id);g.scale.setScalar(1.5);this.scene.add(g);g.traverse(m=>{if(m.isMesh)m.castShadow=true;});
  v={key,id,g,pos:new V(o.x,o.y,o.z),want:new V(o.x,o.y,o.z),face:0,phase:Math.random()*6,mode:'food',lunge:0,hurt:0,faint:0,spawn:1,pop:0,flash:0,food:true,bounce:0};g.position.copy(v.pos);this.views.set(key,v);return v;}
 removeView(key,poof=true){const v=this.views.get(key);if(!v)return;if(poof)this.poof(v.g.position,v.food?['#ffffff','#ffe8a0']:['#ffffff','#e8e8f0']);this.scene.remove(v.g);v.g.traverse(o=>{if(o.geometry&&o.geometry!==undefined&&!o.userData.keep)o.geometry.dispose&&o.geometry.dispose();});if(v.ice)this.scene.remove(v.ice);if(v.blob)this.scene.remove(v.blob);this.views.delete(key);}
 clearViews(prefix){for(const k of [...this.views.keys()])if(!prefix||k.startsWith(prefix))this.removeView(k,false);}
 poof(p,cols=['#ffffff'],n=18){this.puffs.burst(new V(p.x,p.y+.6,p.z),n,3.2,cols,.55,.7,1.5);}
 sparkle(p,col,n=14){this.puffs.burst(new V(p.x,p.y+.8,p.z),n>>1,4,[col,'#ffffff'],.3,.6,-3);this.glow.burst(new V(p.x,p.y+.8,p.z),n,4.5,[col,'#ffffff'],.5,.55,-3);}
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
   if(v.ice){v.ice.position.set(g.position.x,g.position.y+.6,g.position.z);}
   if(v.blob&&v.blob.visible){const hh=Math.max(0,g.position.y-v.pos.y);v.blob.position.set(g.position.x,v.pos.y+.07,g.position.z);v.blob.scale.setScalar(Math.max(.01,sc/v.ks)*1.5/(1+hh));}}
  this.puffs.update(dt);this.fxUpdate(dt,T);
  this.camPos.lerp(this.camWantPos,Math.min(1,dt*2.6));this.camLook.lerp(this.camWantLook,Math.min(1,dt*2.6));this.cam.position.copy(this.camPos);this.cam.lookAt(this.camLook);
  if(this.shake>0){this.shake=Math.max(0,this.shake-dt*3);this.cam.position.x+=(Math.random()-.5)*this.shake*.3;this.cam.position.y+=(Math.random()-.5)*this.shake*.3;}this.cam.updateMatrixWorld();}
 project(p,w,h,out={}){const v=p.clone().project(this.cam);out.x=(v.x+1)/2*w;out.y=(1-v.y)/2*h;out.z=v.z;return out;}
 pickPlane(nx,ny,y=1){const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(nx,ny),this.cam);const t=(y-ray.ray.origin.y)/ray.ray.direction.y;return ray.ray.origin.clone().addScaledVector(ray.ray.direction,t);}}
