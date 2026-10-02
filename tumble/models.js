// TUMBLE ROYALE — visuals: toy materials, rounded blocks, the game-show stadium, instanced jelly beans, particles, confetti.
import * as THREE from '../vendor/three.module.min.js';
import {H} from './physics.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a;
export const M=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}

/* ---------- looks ---------- */
export const COLORS=['#ff5fa2','#ffb21e','#3fd4ff','#7cf05a','#a46bff','#ff6b3d','#ffe94a','#2e7bff','#ff9fd0','#18d6a3','#ffffff','#3b3f58'];
export const PATTERNS=[{n:'SOLID',k:0},{n:'STRIPES',k:0},{n:'DOTS',k:200},{n:'SPLIT',k:500},{n:'BELLY',k:900},{n:'ZIGZAG',k:1400},{n:'FADE',k:2000}];
export const HATS=[{n:'NONE',k:0},{n:'PARTY',k:0},{n:'BEANIE',k:300},{n:'TOP HAT',k:800},{n:'PROPELLER',k:1500},{n:'HORNS',k:2500},{n:'FLOWER',k:0,crowns:1}];
export function randomLook(){const a=Math.random()*COLORS.length|0;let b=Math.random()*COLORS.length|0;if(b===a)b=(a+3)%COLORS.length;return{c1:COLORS[a],c2:COLORS[b],pat:Math.random()*PATTERNS.length|0,hat:Math.random()<.75?Math.random()*HATS.length|0:0};}

/* ---------- geometry helpers ---------- */
// rounded box from a sphere: every vertex is pushed to its octant's inner corner, then out by the radius
export function rbox(w,h,d,r=.25){r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);const g=new THREE.SphereGeometry(1,20,11,Math.PI/20);const p=g.attributes.position,n=g.attributes.normal;
 const hx=w/2-r,hy=h/2-r,hz=d/2-r;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);n.setXYZ(i,x,y,z);p.setXYZ(i,Math.sign(x)*hx+x*r,Math.sign(y)*hy+y*r,Math.sign(z)*hz+z*r);}return g;}
export function merge(list){const withCol=list.some(e=>e[2]||e[0].attributes.color);const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=withCol?new Float32Array(n*3).fill(1):null;let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);
  if(col){if(g.attributes.color)col.set(g.attributes.color.array,o*3);else if(g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));if(col)r.setAttribute('color',new THREE.BufferAttribute(col,3));return r;}

/* ---------- toy plastic material with an object-space procedural pattern ---------- */
// pat: 0 plain, 1 soft tiles, 2 diagonal stripes, 3 dots, 4 chevrons, 5 checker
export function toyMat(color,o={}){const m=new THREE.MeshStandardMaterial({color,roughness:o.rough??.42,metalness:o.metal??0,envMapIntensity:o.env??.85,vertexColors:!!o.vc,emissive:o.emissive??0x000000,emissiveIntensity:o.ei??1,side:o.side??THREE.FrontSide,transparent:!!o.transparent,opacity:o.opacity??1});
 const U={uCol2:{value:new THREE.Color(o.col2??color)},uPat:{value:o.pat??0},uScale:{value:o.scale??2}};
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;varying vec3 vON;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOP=position;vON=normal;\n#ifdef USE_INSTANCING\nvOP=(instanceMatrix*vec4(position,1.)).xyz;\n#endif');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;varying vec3 vON;uniform vec3 uCol2;uniform float uPat,uScale;').replace('#include <color_fragment>',`#include <color_fragment>
  {vec3 an=abs(normalize(vON));vec2 uv=an.y>.6?vOP.xz:an.x>.6?vOP.zy:vOP.xy;uv/=uScale;float m=0.;
   if(uPat>.5&&uPat<1.5){vec2 f=abs(fract(uv)-.5);float e=max(f.x,f.y);m=smoothstep(.40,.47,e)*.85;float ck=mod(floor(uv.x)+floor(uv.y),2.);diffuseColor.rgb*=1.-ck*.07;}
   else if(uPat<2.5&&uPat>1.5){m=smoothstep(.47,.53,fract(uv.x+uv.y))*(1.-smoothstep(.97,1.,fract(uv.x+uv.y)));}
   else if(uPat<3.5&&uPat>2.5){vec2 f=fract(uv)-.5;m=1.-smoothstep(.2,.25,length(f));}
   else if(uPat<4.5&&uPat>3.5){m=step(.5,fract(uv.y+abs(fract(uv.x)-.5)));}
   else if(uPat>4.5){m=mod(floor(uv.x)+floor(uv.y),2.);}
   diffuseColor.rgb=mix(diffuseColor.rgb,uCol2,m);}`);};
 m.customProgramCacheKey=()=>'toy';m.userData.U=U;return m;}

export function makeMats(){return{
 floor:toyMat(0x9f86ff,{col2:0x7656ea,pat:1,scale:2.4}),floor2:toyMat(0xff8fc8,{col2:0xe8559f,pat:1,scale:2.4}),floor3:toyMat(0x6fd3ff,{col2:0x2fa6e6,pat:1,scale:2.4}),
 side:toyMat(0xffc93a,{col2:0xff8a1e,pat:2,scale:1.4}),pink:toyMat(0xff4f9a,{rough:.3}),cyan:toyMat(0x27c8ff,{rough:.3}),orange:toyMat(0xff7a1f,{rough:.32}),
 lime:toyMat(0x7be04a,{rough:.35}),purple:toyMat(0x8a5cff,{rough:.32}),white:toyMat(0xf4f2ff,{rough:.28}),yellow:toyMat(0xffd23a,{rough:.3}),
 bar:toyMat(0xff3d6e,{col2:0xffffff,pat:2,scale:.9,rough:.28}),bar2:toyMat(0x2bb8ff,{col2:0xffffff,pat:2,scale:.9,rough:.28}),
 check:toyMat(0x23243a,{col2:0xffffff,pat:5,scale:.8,rough:.4}),slime:toyMat(0x8a3cff,{col2:0xb36bff,pat:3,scale:1.2,rough:.25}),
 door:toyMat(0x37d0ff,{col2:0x89e6ff,pat:1,scale:1.2,rough:.3}),wall:toyMat(0xff79b8,{col2:0xff5aa6,pat:4,scale:1.6,rough:.38}),
 bump:toyMat(0xff4fd8,{rough:.22,emissive:0x400030}),dark:toyMat(0x3a3460,{rough:.5})};}

/* ---------- environment map (bright show sky for glossy reflections) ---------- */
export function makeEnv(R){const s=new THREE.Scene();
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.9,.45,.75),vec3(.75,.88,1.),smoothstep(-.3,.05,h));c=mix(c,vec3(.25,.5,1.),smoothstep(.1,.9,h));gl_FragColor=vec4(c*.9,1.);}'})));
 const sun=new THREE.Mesh(new THREE.SphereGeometry(8,16,8),new THREE.MeshBasicMaterial({color:new THREE.Color(12,11,9)}));sun.position.set(40,60,30);s.add(sun);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.03);pm.dispose();return rt.texture;}

export function gooMat(time,color,em,bub){const m=new THREE.MeshStandardMaterial({color,roughness:.34,metalness:0,emissive:em,emissiveIntensity:.8,envMapIntensity:.32});const ub={value:new THREE.Vector3(...bub)};
 m.onBeforeCompile=sh=>{sh.uniforms.uT=time;sh.uniforms.uBub=ub;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uT;uniform vec3 uBub;varying vec3 vW;').replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  {vec2 p=vW.xz*.18;float a=sin(p.x*1.3+uT*1.1)+sin(p.y*1.7-uT*.9)+sin((p.x+p.y)*2.3+uT*1.6)*.5;float b=cos(p.x*1.1-uT*.7)+cos(p.y*1.4+uT*1.3);vec3 pn=normalize(vec3(a*.12,1.,b*.12));normal=normalize((viewMatrix*vec4(pn,0.)).xyz);}`)
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
  {vec2 g=vW.xz*.11+vec2(uT*.05,uT*.03);vec2 f=fract(g)-.5;vec2 id=floor(g);float r=fract(sin(dot(id,vec2(12.9,78.2)))*437.5);float bb=smoothstep(.035,.0,abs(length(f+vec2(sin(r*9.+uT)*.2,0.))-.06-r*.05))*step(.72,r);totalEmissiveRadiance+=uBub*bb*.35;}`);};m.customProgramCacheKey=()=>'goo';return m;}
/* ---------- the stadium: sky, goo sea, stands with a crowd, banners, balloons, clouds ---------- */
export const CZ=60;// every round is laid out around z=CZ so the bowl frames it
export function buildStage(scene){const out={time:{value:0},hype:{value:0}};
 const SUN=new V(.45,.78,.36).normalize();out.sunDir=SUN;
 scene.add(new THREE.Mesh(new THREE.SphereGeometry(900,40,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uSun:{value:SUN}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uSun;varying vec3 vP;void main(){vec3 d=normalize(vP);float h=d.y;vec3 top=vec3(.10,.36,.92),hor=vec3(.55,.78,1.),low=vec3(.98,.62,.82);
   vec3 c=mix(hor,top,smoothstep(.02,.65,h));c=mix(low,c,smoothstep(-.25,.06,h));float s=max(0.,dot(d,uSun));c+=vec3(1.,.85,.6)*(pow(s,600.)*6.+pow(s,24.)*.18);gl_FragColor=vec4(c,1.);}`})));
 // goo sea filling the bowl
 const gooM=gooMat(out.time,0xe0349a,0x3a0628,[.7,.35,.6]);out.gooMat=(c,e,b)=>gooMat(out.time,c,e,b);
 const goo=new THREE.Mesh(new THREE.CircleGeometry(260,64),gooM);goo.rotation.x=-Math.PI/2;goo.position.set(0,-14,CZ);goo.receiveShadow=true;scene.add(goo);out.goo=goo;
 // stands: elliptical stepped bowl
 const A=96,B=132,T=16,step=2.6,rise=2.4,y0=-13;const seg=160;
 {const pos=[],col=[],idx=[];const pal=[new THREE.Color(0xffd23a),new THREE.Color(0xff5fa2),new THREE.Color(0x3fd4ff),new THREE.Color(0x8a5cff)];
  const rows=[];for(let t=0;t<=T;t++){rows.push([t*step,y0+t*rise],[t*step+step*.98,y0+t*rise]);}rows.push([T*step+step,y0+T*rise+6]);
  for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);rows.forEach(([o,y],j)=>{const x=(A+o)*ca,z=(B+o)*sa;pos.push(x,y,z+CZ);const k=(i>>2)%4;const c=j%2?pal[k].clone().multiplyScalar(.7):new THREE.Color(.62,.56,.86);col.push(c.r,c.g,c.b);});}
  const nr=rows.length;for(let i=0;i<seg;i++)for(let j=0;j<nr-1;j++){const a=i*nr+j,b=a+nr;idx.push(a,a+1,b,a+1,b+1,b);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,side:THREE.DoubleSide}));scene.add(m);}
 // crowd of tiny beans cheering (instanced, bob in the vertex shader)
 {const geo=merge([[new THREE.CylinderGeometry(.4,.44,.9,7,1,true),M(0,.55,0)],[new THREE.SphereGeometry(.41,7,3,0,Math.PI*2,0,Math.PI/2),M(0,1,0)]]);const mat=new THREE.MeshLambertMaterial({color:0xffffff});
  mat.onBeforeCompile=sh=>{sh.uniforms.uTime=out.time;sh.uniforms.uHype=out.hype;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime,uHype;').replace('#include <begin_vertex>',`#include <begin_vertex>
   #ifdef USE_INSTANCING
   vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);float ph=fract(sin(dot(ip.xz,vec2(12.9898,78.233)))*43758.5453);float jb=max(0.,sin(uTime*(5.+ph*4.)+ph*40.));transformed.y+=jb*jb*(.15+uHype*1.1)*(.5+ph);
   #endif`);sh.fragmentShader=sh.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\ntotalEmissiveRadiance+=vColor*.18;\n#endif');};
  const pts=[];for(let t=1;t<T;t++){const o=t*step+step*.5,y=y0+t*rise;const per=2*Math.PI*Math.sqrt(((A+o)**2+(B+o)**2)/2);const n=per/1.45|0;for(let i=0;i<n;i++){if(Math.random()<.24)continue;const a=(i+rnd(.4))/n*Math.PI*2;pts.push([(A+o)*Math.cos(a),y,(B+o)*Math.sin(a)+CZ,a]);}}
  const mesh=new THREE.InstancedMesh(geo,mat,pts.length);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
  pts.forEach((p,i)=>{q.setFromAxisAngle(new V(0,1,0),Math.atan2(-p[0],-(p[2]-CZ)));const s=.95+rnd(.25);m4.compose(new V(p[0],p[1],p[2]),q,new V(s,s,s));mesh.setMatrixAt(i,m4);c.set(COLORS[Math.random()*10|0]);mesh.setColorAt(i,c);});
  scene.add(mesh);out.crowd=mesh;}
 // scalloped awning around the rim + banner band
 {const ban=ctex(1024,64,(x,w,h)=>{x.fillStyle='#1b1640';x.fillRect(0,0,w,h);x.font='44px Anton, Impact, sans-serif';x.textBaseline='middle';const it=[['TUMBLE ROYALE','#ffffff'],['★','#ffd23a'],['PIXEL ARCADE','#3fd4ff'],['★','#ff5fa2'],['STAY ON YOUR FEET','#ffd23a'],['★','#7cf05a']];let px=10;for(const[t,c]of it){x.fillStyle=c;x.fillText(t,px,h/2+2);px+=x.measureText(t).width+26;}});ban.repeat.set(10,1);
  const o=T*step+step,yb=y0+T*rise+6;const pos=[],uv=[],idx=[];for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2;for(const[dy,v]of[[0,0],[5,1]]){pos.push((A+o-.2)*Math.cos(a),yb+dy,(B+o-.2)*Math.sin(a)+CZ);uv.push(i/seg,v);}}for(let i=0;i<seg;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);scene.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:ban,side:THREE.DoubleSide,color:new THREE.Color(.95,.95,.95)})));
  const cones=[];const n=72;for(let i=0;i<n;i++){const a=(i+.5)/n*Math.PI*2;const cg=new THREE.ConeGeometry(4.4,3.2,3,1);cones.push([cg,M((A+o-.4)*Math.cos(a),yb+5+1.6,(B+o-.4)*Math.sin(a)+CZ,Math.PI,-a,0,1,1,.35),new THREE.Color(COLORS[i%4===0?0:i%4===1?1:i%4===2?2:4])]);}
  scene.add(new THREE.Mesh(merge(cones),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,side:THREE.DoubleSide})));
  // flag poles with pennants
  const poles=[],flags=[];for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=(A+o+1)*Math.cos(a),z=(B+o+1)*Math.sin(a)+CZ;poles.push([new THREE.CylinderGeometry(.25,.3,18,6),M(x,yb+9,z)]);flags.push([new THREE.PlaneGeometry(5,3),M(x+2.5*Math.sin(a),yb+16.5,z-2.5*Math.cos(a),0,-a+Math.PI/2,0),new THREE.Color(COLORS[(i*5)%10])]);}
  scene.add(new THREE.Mesh(merge(poles),new THREE.MeshStandardMaterial({color:0xf0f0ff,roughness:.3,metalness:.5})));scene.add(new THREE.Mesh(merge(flags),new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.7})));}
 // giant floating balloons and clouds
 {const bal=[],n=46;for(let i=0;i<n;i++){const a=rnd(6.283),r=40+rnd(60),x=Math.cos(a)*r*.75,z=Math.sin(a)*r+CZ,y=12+rnd(30),s=1.6+rnd(1.6);bal.push({x,y,z,s,ph:rnd(9)});}
  const g=merge([[new THREE.SphereGeometry(1,18,14),M(0,0,0,0,0,0,1,1.18,1)],[new THREE.ConeGeometry(.22,.3,8),M(0,-1.25,0,Math.PI)]]);const mesh=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({roughness:.18,metalness:0,envMapIntensity:1.3}),n);
  bal.forEach((b,i)=>mesh.setColorAt(i,new THREE.Color(COLORS[i%10])));scene.add(mesh);out.balloons={mesh,bal};
  const cg=merge([[new THREE.IcosahedronGeometry(1,1),M(0,0,0,0,0,0,1.4,1,1.2)],[new THREE.IcosahedronGeometry(1,1),M(1.3,-.15,.2,0,0,0,1.1,.8,1)],[new THREE.IcosahedronGeometry(1,1),M(-1.3,-.2,-.1,0,0,0,1,.75,.95)],[new THREE.IcosahedronGeometry(1,1),M(.4,.5,-.4,0,0,0,.9,.8,.9)]]);
  const cm=new THREE.MeshLambertMaterial({color:0xffffff,emissive:0xb0c4ee,emissiveIntensity:.42});const cl=[];for(let i=0;i<34;i++){const a=rnd(6.283),r=150+rnd(260);cl.push(M(Math.cos(a)*r,-30+rnd(110)+(r>300?40:0),Math.sin(a)*r+CZ,0,rnd(6),0,8+rnd(10),5+rnd(4),8+rnd(8)));}
  const cmesh=new THREE.InstancedMesh(cg,cm,cl.length);cl.forEach((m,i)=>cmesh.setMatrixAt(i,m));scene.add(cmesh);}
 out.update=(t)=>{out.time.value=t;const {mesh,bal}=out.balloons,m4=new THREE.Matrix4(),q=new THREE.Quaternion();bal.forEach((b,i)=>{q.setFromEuler(new THREE.Euler(Math.sin(t*.7+b.ph)*.15,0,Math.cos(t*.6+b.ph)*.15));m4.compose(new V(b.x,b.y+Math.sin(t*.5+b.ph)*1.2,b.z),q,new V(b.s,b.s,b.s));mesh.setMatrixAt(i,m4);});mesh.instanceMatrix.needsUpdate=true;};
 return out;}

/* ---------- instanced jelly beans (one draw call per body part for the whole field) ---------- */
function hatGeo(k){const C=c=>new THREE.Color(c);switch(k){
 case 1:{const g=new THREE.ConeGeometry(.2,.52,18,6);const p=g.attributes.position,col=[];for(let i=0;i<p.count;i++){const y=p.getY(i);const c=Math.floor((y+.26)*9)%2?C('#ffe94a'):C('#ff5fa2');col.push(c.r,c.g,c.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  return merge([[g,M(.05,.2,0,0,0,-.2)],[new THREE.SphereGeometry(.07,10,8),M(.1,.47,0),C('#3fd4ff')]]);}
 case 2:return merge([[new THREE.SphereGeometry(.4,20,10,0,Math.PI*2,0,Math.PI/2),M(0,-.05,0,0,0,0,1.05,.8,1.05),C('#2e7bff')],[new THREE.CylinderGeometry(.43,.43,.12,20),M(0,-.04,0),C('#ffffff')],[new THREE.SphereGeometry(.12,12,8),M(0,.32,0),C('#ffffff')]]);
 case 3:return merge([[new THREE.CylinderGeometry(.27,.28,.5,20),M(0,.22,0),C('#23243a')],[new THREE.CylinderGeometry(.46,.46,.04,24),M(0,-.02,0),C('#23243a')],[new THREE.CylinderGeometry(.285,.285,.1,20),M(0,.05,0),C('#ff3d6e')]]);
 case 4:return merge([[new THREE.SphereGeometry(.38,20,10,0,Math.PI*2,0,Math.PI/2),M(0,-.08,0,0,0,0,1.08,.7,1.08),C('#ffd23a')],[new THREE.BoxGeometry(.3,.03,.2),M(0,-.08,.42),C('#ff3d6e')],[new THREE.CylinderGeometry(.025,.025,.2,6),M(0,.25,0),C('#ffffff')],[new THREE.BoxGeometry(.7,.02,.09),M(0,.35,0),C('#3fd4ff')],[new THREE.BoxGeometry(.09,.02,.7),M(0,.35,0),C('#ff5fa2')]]);
 case 5:{const L=[];for(const s of[-1,1]){for(let i=0;i<5;i++){const t=i/5;L.push([new THREE.CylinderGeometry(.075*(1-t)+.01,.075*(1-t*.8)+.02,.1,8),M(s*(.28+t*.16+t*t*.1),-.08+t*.36,0,0,0,-s*(.5+t*.6)),C('#fff3d6')]);}}return merge(L);}
 case 6:{const L=[[new THREE.SphereGeometry(.1,12,8),M(.12,.06,0),C('#ffd23a')]];for(let i=0;i<7;i++){const a=i/7*Math.PI*2;L.push([new THREE.SphereGeometry(.09,10,8),M(.12+Math.cos(a)*.14,.04,Math.sin(a)*.14,0,0,0,1,.5,1),C('#ff9fd0')]);}L.push([new THREE.SphereGeometry(.06,8,6),M(-.18,.02,.08,0,0,0,1.6,.4,.8),C('#7cf05a')]);return merge(L);}}
 return null;}
export function crownGeo(){const L=[[new THREE.CylinderGeometry(.34,.3,.22,24,1,true),M(0,.1,0)]];for(let i=0;i<6;i++){const a=i/6*Math.PI*2;L.push([new THREE.ConeGeometry(.09,.24,8),M(Math.cos(a)*.31,.32,Math.sin(a)*.31)],[new THREE.SphereGeometry(.05,8,6),M(Math.cos(a)*.31,.45,Math.sin(a)*.31),new THREE.Color(1.2,.25,.4)]);}
 L.push([new THREE.TorusGeometry(.32,.03,8,24),M(0,0,0,Math.PI/2)]);const g=merge(L.map(e=>[e[0],e[1],e[2]||new THREE.Color(1,1,1)]));return g;}

export class Beans{
 constructor(scene,n=32){this.n=n;const body=new THREE.CapsuleGeometry(.5,.72,8,18);const bp=body.attributes.position;for(let i=0;i<bp.count;i++){const y=bp.getY(i),s=1-.07*Math.max(0,y)/.86+.03*Math.max(0,-y)/.86;bp.setX(i,bp.getX(i)*s);bp.setZ(i,bp.getZ(i)*s);}body.computeVertexNormals();
  this.c1=new Float32Array(n*3);this.c2=new Float32Array(n*3);this.pat=new Float32Array(n);
  body.setAttribute('aC1',new THREE.InstancedBufferAttribute(this.c1,3));body.setAttribute('aC2',new THREE.InstancedBufferAttribute(this.c2,3));body.setAttribute('aPat',new THREE.InstancedBufferAttribute(this.pat,1));
  const bm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.36,metalness:0,envMapIntensity:.9});
  bm.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aC1;attribute vec3 aC2;attribute float aPat;varying vec3 vC1;varying vec3 vC2;varying float vPat;varying vec3 vOP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvC1=aC1;vC2=aC2;vPat=aPat;vOP=position;');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vC1;varying vec3 vC2;varying float vPat;varying vec3 vOP;').replace('#include <color_fragment>',`#include <color_fragment>
   {vec3 p=vOP;float ang=atan(p.x,p.z);float m=0.;
    if(vPat>.5&&vPat<1.5)m=smoothstep(.45,.5,fract(p.y*3.1+.2))*(1.-smoothstep(.95,1.,fract(p.y*3.1+.2)));
    else if(vPat>1.5&&vPat<2.5){vec2 g=vec2(ang*1.9,p.y*4.2);g.x+=mod(floor(g.y),2.)*.5;vec2 f=fract(g)-.5;m=1.-smoothstep(.2,.25,length(f));}
    else if(vPat>2.5&&vPat<3.5)m=smoothstep(-.02,.02,p.x);
    else if(vPat>3.5&&vPat<4.5)m=(1.-smoothstep(.3,.34,length(vec2(p.x*1.15,(p.y+.18)*.62))))*smoothstep(0.,.1,p.z);
    else if(vPat>4.5&&vPat<5.5)m=step(.5,fract(p.y*2.4+abs(fract(ang*1.3)-.5)*1.3));
    else if(vPat>5.5)m=smoothstep(-.55,.75,p.y);
    diffuseColor.rgb*=mix(vC1,vC2,m);}`);};
  bm.customProgramCacheKey=()=>'bean';
  const mk=(g,m,count=n)=>{const im=new THREE.InstancedMesh(g,m,count);im.castShadow=true;im.frustumCulled=false;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(im);return im;};
  this.body=mk(body,bm);
  const face=new THREE.SphereGeometry(1,24,16);this.face=mk(face,new THREE.MeshPhysicalMaterial({color:0x14122a,roughness:.08,metalness:.2,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.6}));this.face.castShadow=false;
  const eye=merge([[new THREE.SphereGeometry(1,14,10),M(-.12,0,0,0,0,0,.085,.11,.04),new THREE.Color(1,1,1)],[new THREE.SphereGeometry(1,14,10),M(.12,0,0,0,0,0,.085,.11,.04),new THREE.Color(1,1,1)],
   [new THREE.SphereGeometry(1,10,8),M(-.105,-.012,.03,0,0,0,.04,.055,.02),new THREE.Color(.03,.03,.06)],[new THREE.SphereGeometry(1,10,8),M(.105,-.012,.03,0,0,0,.04,.055,.02),new THREE.Color(.03,.03,.06)],
   [new THREE.SphereGeometry(1,6,4),M(-.085,.03,.045,0,0,0,.016,.018,.01),new THREE.Color(1.6,1.6,1.6)],[new THREE.SphereGeometry(1,6,4),M(.125,.03,.045,0,0,0,.016,.018,.01),new THREE.Color(1.6,1.6,1.6)]]);
  this.eyes=mk(eye,new THREE.MeshBasicMaterial({vertexColors:true}));this.eyes.castShadow=false;
  const arm=merge([[new THREE.CapsuleGeometry(.135,.12,4,10),M(0,-.12,0)],[new THREE.SphereGeometry(.17,14,10),M(0,-.29,.02,0,0,0,1.05,.92,1.12)]]);
  const limbM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.4});this.arms=mk(arm,limbM,n*2);
  const leg=merge([[new THREE.CapsuleGeometry(.14,.14,4,10),M(0,-.13,0)],[new THREE.SphereGeometry(.17,12,10),M(0,-.26,.05,0,0,0,1,.75,1.25)]]);this.legs=mk(leg,limbM,n*2);
  this.hats=[];for(let k=1;k<HATS.length;k++){const g=hatGeo(k);this.hats[k]=mk(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:k===3?.1:0}));}
  this.crown=mk(crownGeo(),new THREE.MeshStandardMaterial({color:0xffc23a,roughness:.22,metalness:.9,emissive:0x5a3000,vertexColors:true,envMapIntensity:1.6}));
  const tail=merge([[new THREE.ConeGeometry(.16,.55,12),M(0,.25,0)],[new THREE.SphereGeometry(.2,12,10),M(0,.58,0)]]);const tm=new THREE.MeshStandardMaterial({color:0xffb21e,emissive:0xff7a10,emissiveIntensity:.55,roughness:.5});this.tail=mk(tail,tm);
  this.looks=[];this.m4=new THREE.Matrix4();this.root=new THREE.Matrix4();this.tmp=new THREE.Matrix4();this.q=new THREE.Quaternion();this.q2=new THREE.Quaternion();this.e=new THREE.Euler();this.v=new V();this.s=new V();this.zero=new THREE.Matrix4().makeScale(0,0,0);this.col=new THREE.Color();
  for(let i=0;i<n;i++)this.setLook(i,randomLook());}
 setLook(i,l,team){this.looks[i]=l;const a=new THREE.Color(l.c1),b=new THREE.Color(l.c2);a.convertSRGBToLinear();b.convertSRGBToLinear();
  this.c1.set([a.r,a.g,a.b],i*3);this.c2.set([b.r,b.g,b.b],i*3);this.pat[i]=l.pat;const ga=this.body.geometry.attributes;ga.aC1.needsUpdate=ga.aC2.needsUpdate=ga.aPat.needsUpdate=true;
  this.col.set(l.c1);this.arms.setColorAt(i*2,this.col);this.arms.setColorAt(i*2+1,this.col);this.col.set(l.c2);if(l.c2==='#ffffff')this.col.set(l.c1).multiplyScalar(.8);this.legs.setColorAt(i*2,this.col);this.legs.setColorAt(i*2+1,this.col);
  this.arms.instanceColor.needsUpdate=this.legs.instanceColor.needsUpdate=true;}
 // pose every bean from its physics state; returns nothing, writes instance matrices
 update(list,t,dt,cp){const{m4,root,tmp,q,q2,e,v,s}=this;
  for(let i=0;i<this.n;i++){const b=list[i];const near=cp&&b&&(b.p.x-cp.x)**2+(b.p.y+.9-cp.y)**2+(b.p.z-cp.z)**2<6.5;
   if(!b||b.out&&!b.showOut||b.hidden||near){this.body.setMatrixAt(i,this.zero);this.face.setMatrixAt(i,this.zero);this.eyes.setMatrixAt(i,this.zero);this.arms.setMatrixAt(i*2,this.zero);this.arms.setMatrixAt(i*2+1,this.zero);this.legs.setMatrixAt(i*2,this.zero);this.legs.setMatrixAt(i*2+1,this.zero);
    for(let k=1;k<this.hats.length;k++)this.hats[k].setMatrixAt(i,this.zero);this.tail.setMatrixAt(i,this.zero);this.crown.setMatrixAt(i,this.zero);continue;}
   const sp=Math.hypot(b.v.x-b.gv.x,b.v.z-b.gv.z),g=b.ground;b.walk+=(g?sp*1.55:3)*dt;const w=b.walk;
   const run=Math.min(1,sp/8),st=b.state,cele=b.cele;b.lean+=((g&&st==='run'?run*.22:0)-b.lean)*Math.min(1,dt*8);
   // root: feet position, then (about the belly) tumble / dive pitch / lean, then yaw
   root.makeTranslation(b.p.x,b.p.y+.86,b.p.z);
   if(st==='rag'){tmp.makeRotationFromQuaternion(b.rq);root.multiply(tmp);q.setFromAxisAngle(v.set(0,1,0),b.yaw);}
   else{if(b.rq.w<.9999&&b.getup>0){b.rq.slerp(q2.identity(),Math.min(1,dt*10));tmp.makeRotationFromQuaternion(b.rq);root.multiply(tmp);}else b.rq.identity();
    const pitch=st==='dive'?1.35:st==='slide'?1.5:b.lean+(cele?Math.sin(t*9+i)*.08:0);e.set(pitch,b.yaw,Math.sin(w*.5)*.06*run+(cele?Math.sin(t*5+i)*.12:0),'YXZ');q.setFromEuler(e);}
   tmp.makeRotationFromQuaternion(q);root.multiply(tmp);
   const sq=b.squash+(g&&st==='run'?Math.abs(Math.sin(w))*.05*run:0)+(cele?Math.max(0,Math.sin(t*10+i))*.08:0);
   const bob=g&&st==='run'?Math.abs(Math.sin(w))*.07*run:0;tmp.makeTranslation(0,bob+(st==='slide'||st==='dive'?-.2:0),0);root.multiply(tmp);
   m4.copy(root).multiply(tmp.makeScale(1-sq*.5,1+sq,1-sq*.5));this.body.setMatrixAt(i,m4);
   const top=.86*(1+sq);
   m4.copy(root).multiply(tmp.compose(v.set(0,.33*(1+sq),.37*(1-sq*.5)),q2.setFromEuler(e.set(-.12,0,0)),s.set(.38*(1-sq*.4),.28*(1+sq*.6),.165)));this.face.setMatrixAt(i,m4);
   const blink=(Math.sin(t*1.3+i*7.1)>.985||st==='rag'&&Math.sin(t*20)>0)?.12:1;
   m4.copy(root).multiply(tmp.compose(v.set(0,.345*(1+sq),.5*(1-sq*.5)),q2.setFromEuler(e.set(-.12,0,0)),s.set(1,blink,1)));this.eyes.setMatrixAt(i,m4);
   // arms
   for(const sd of[-1,1]){let ax,az;
    if(st==='rag'){ax=Math.sin(t*13+i*3+sd)*1.4;az=sd*(1.2+Math.sin(t*11+i+sd*2)*.7);}
    else if(st==='dive'||st==='slide'){ax=-2.9;az=sd*.25;}
    else if(b.grabbing){ax=-1.55;az=sd*.12;}
    else if(cele){ax=-2.6+Math.sin(t*12+i+sd)*.4;az=sd*.5;}
    else if(!g){ax=-1.9+Math.sin(t*16+sd)*.35;az=sd*1.05;}
    else{ax=Math.sin(w+(sd>0?0:Math.PI))*1.1*run;az=sd*(.18+(1-run)*.08+Math.sin(t*2+i)*.04);}
    m4.copy(root).multiply(tmp.compose(v.set(sd*.47,.12*(1+sq),0),q2.setFromEuler(e.set(ax,0,az)),s.set(1,1,1)));this.arms.setMatrixAt(i*2+(sd>0?1:0),m4);
    let lx;if(st==='rag')lx=Math.sin(t*12+i+sd*1.7)*.9;else if(st==='dive'||st==='slide')lx=.3;else if(!g)lx=sd*.35-.2;else lx=Math.sin(w+(sd>0?Math.PI:0))*1.0*run;
    m4.copy(root).multiply(tmp.compose(v.set(sd*.21,-.58*(1+sq*.6),0),q2.setFromEuler(e.set(lx,0,sd*.05)),s.set(1,1,1)));this.legs.setMatrixAt(i*2+(sd>0?1:0),m4);}
   // hat / crown / tail
   const hk=b.crowned?-1:this.looks[i].hat;for(let k=1;k<this.hats.length;k++){if(k===hk){m4.copy(root).multiply(tmp.makeTranslation(0,top-.02,0));this.hats[k].setMatrixAt(i,m4);}else this.hats[k].setMatrixAt(i,this.zero);}
   if(b.crowned){m4.copy(root).multiply(tmp.compose(v.set(0,top+.02+Math.sin(t*3)*.03,0),q2.setFromEuler(e.set(-.08,t*.8,0)),s.set(1,1,1)));this.crown.setMatrixAt(i,m4);}else this.crown.setMatrixAt(i,this.zero);
   if(b.tail){m4.copy(root).multiply(tmp.compose(v.set(0,-.3,-.4),q2.setFromEuler(e.set(-1.75+Math.sin(t*9+i)*.25,0,Math.sin(t*7+i)*.35)),s.set(1.5,1.5,1.5)));this.tail.setMatrixAt(i,m4);}else this.tail.setMatrixAt(i,this.zero);}
  for(const im of[this.body,this.face,this.eyes,this.arms,this.legs,this.crown,this.tail,...this.hats.filter(Boolean)])im.instanceMatrix.needsUpdate=true;}}

/* ---------- particles: soft puffs (normal blend) or sparkles (additive), one draw call each ---------- */
export class Particles{constructor(scene,n,additive){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.dr=new Float32Array(n);this.i=0;this.add=additive;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 color;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);a*=a;gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}':'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.22,d);vec3 c=vC.rgb*(1.-d*.22);gl_FragColor=vec4(c,a*vC.a*.62);}'}));this.pts.frustumCulled=false;this.pts.renderOrder=5;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=1.5){const i=this.i;this.i=(i+1)%this.n;this.p.set([x,y,z],i*3);this.v.set([vx,vy,vz],i*3);this.oc.set([r,g,b],i*3);this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.dr[i]=drag;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=rnd(2)-1,dy=rnd(2)-1,dz=rnd(2)-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.up)dy=Math.abs(dy)*(o.upK??1);if(o.flat)dy*=.25;const s=speed*(.35+rnd(.65));const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;
  this.emit(p.x+(o.jit?dx*o.jit:0),p.y,p.z+(o.jit?dz*o.jit:0),dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.6+rnd(.7)),life*(.6+rnd(.6)),o.grav??0,o.drag??1.5);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,dr}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0){s[i]=0;c[i*4+3]=0;}continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),d=Math.exp(-dr[i]*dt);
   v[i*3]*=d;v[i*3+1]=v[i*3+1]*d-g[i]*dt;v[i*3+2]*=d;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=this.add?k*k:Math.min(1,k*2.2);s[i]=os[i]*(this.add?.4+.6*k:1.25-.5*k);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

/* ---------- confetti: fluttering paper squares ---------- */
export class Confetti{constructor(scene,n=1400){this.n=n;this.live=0;const g=new THREE.PlaneGeometry(.22,.13);this.mesh=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.5,emissive:0x222222}),n);this.mesh.frustumCulled=false;this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.P=new Float32Array(n*3);this.Vv=new Float32Array(n*3);this.A=new Float32Array(n*3);this.L=new Float32Array(n);this.i=0;const z=new THREE.Matrix4().makeScale(0,0,0),c=new THREE.Color();for(let i=0;i<n;i++){this.mesh.setMatrixAt(i,z);c.set(COLORS[i%10]);this.mesh.setColorAt(i,c);}scene.add(this.mesh);this.m4=new THREE.Matrix4();this.q=new THREE.Quaternion();this.e=new THREE.Euler();this.z=z;}
 burst(p,n,speed,up=1){for(let k=0;k<n;k++){const i=this.i;this.i=(i+1)%this.n;const a=rnd(6.283),s=speed*(.3+rnd(.7));this.P.set([p.x,p.y,p.z],i*3);this.Vv.set([Math.cos(a)*s*.6,(4+rnd(6))*up+s*.3,Math.sin(a)*s*.6],i*3);this.A.set([rnd(6),rnd(6),rnd(6)],i*3);this.L[i]=3+rnd(3);}this.live=6;}
 rain(c,r,n){for(let k=0;k<n;k++){const i=this.i;this.i=(i+1)%this.n;const a=rnd(6.283),d=rnd(r);this.P.set([c.x+Math.cos(a)*d,c.y+8+rnd(6),c.z+Math.sin(a)*d],i*3);this.Vv.set([rnd(2)-1,-1-rnd(2),rnd(2)-1],i*3);this.A.set([rnd(6),rnd(6),rnd(6)],i*3);this.L[i]=4+rnd(2);}this.live=6;}
 update(dt,t){if(this.live<=0)return;this.live-=dt;const{P,Vv,A,L,m4,q,e}=this;for(let i=0;i<this.n;i++){if(L[i]<=0)continue;L[i]-=dt;if(L[i]<=0){this.mesh.setMatrixAt(i,this.z);continue;}
   Vv[i*3+1]-=9*dt;const d=Math.exp(-dt*2.4);Vv[i*3]*=d;Vv[i*3+1]=Math.max(Vv[i*3+1]*d,-2.2);Vv[i*3+2]*=d;P[i*3]+=(Vv[i*3]+Math.sin(t*3+i)*.6)*dt;P[i*3+1]+=Vv[i*3+1]*dt;P[i*3+2]+=(Vv[i*3+2]+Math.cos(t*2.6+i)*.6)*dt;
   e.set(A[i*3]+t*(3+i%5),A[i*3+1]+t*2,A[i*3+2]);q.setFromEuler(e);const s=Math.min(1,L[i]);m4.compose(new V(P[i*3],P[i*3+1],P[i*3+2]),q,new V(s,s,s));this.mesh.setMatrixAt(i,m4);this.live=Math.max(this.live,.1);}
  this.mesh.instanceMatrix.needsUpdate=true;}}
