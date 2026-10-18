// LANTERN STREET — shared helpers (adapted from plaza/util.js): math, canvas textures, geometry merging, lit-instance meshes, particles.
import * as THREE from '../vendor/three.module.min.js';
export {THREE};
export const V3=THREE.Vector3;
export const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
export const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
export const sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const angDiff=(a,b)=>{let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d;};
export const dampAng=(a,b,k,dt)=>a+angDiff(a,b)*(1-Math.exp(-k*dt));
export const easeOutBack=t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
export const fmtT=s=>{s=Math.max(0,Math.ceil(s));return(s/60|0)+':'+String(s%60).padStart(2,'0');};
export function rng(seed){let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const $=id=>document.getElementById(id);

export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;if(o.rep)t.repeat.set(o.rep[0],o.rep[1]);return t;}
export const M=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V3(sx,sy,sz));
// merge [geometry, matrix?, color?] entries into one non-indexed geometry with vertex colours
export function merge(list){const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c!==undefined&&c!==null?new THREE.Color(c):null;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3).fill(1);let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(col,3));r.computeBoundingSphere();return r;}
export const mat=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:o.r??.75,metalness:o.m??0,vertexColors:!!o.vc,emissive:o.e??0x000000,emissiveIntensity:o.ei??1,transparent:!!o.t,opacity:o.o??1,side:o.side??THREE.FrontSide,flatShading:!!o.flat,map:o.map||null,depthWrite:o.dw??true});
// a bucket that collects static pieces per material and flushes them as one merged mesh each
export function bucket(){const B=new Map();const add=(mt,geo,m,c)=>{if(!B.has(mt))B.set(mt,[]);B.get(mt).push([geo,m,c]);};
 add.flush=(parent,o={})=>{const out=[];for(const[mt,list]of B){const me=new THREE.Mesh(merge(list),mt);me.castShadow=o.cast??true;me.receiveShadow=true;if(mt.userData.noShadow)me.castShadow=false;parent.add(me);out.push(me);}B.clear();return out;};return add;}

/* Instanced mesh whose per-instance emissive glow follows a 0..1 "lit" attribute (lanterns, bulbs, flames): lit(i,v) */
export function litInstances(geo,n,o={}){const mt=new THREE.MeshStandardMaterial({color:o.color??0xffffff,roughness:o.r??.6,emissive:0xffffff,emissiveIntensity:1,transparent:!!o.t,opacity:o.o??1});
 const aLit=new THREE.InstancedBufferAttribute(new Float32Array(n),1);geo.setAttribute('aLit',aLit);const glow=o.glow??2.4,dark=o.dark??.04;
 mt.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aLit;varying float vLit;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLit=aLit;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vLit;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance=vColor.rgb*('+glow.toFixed(2)+'*vLit+'+dark.toFixed(3)+');diffuseColor.rgb=mix(mix(vec3(dot(diffuseColor.rgb,vec3(.3,.5,.2))),diffuseColor.rgb,.45)*.32,diffuseColor.rgb,vLit);\n#else\ntotalEmissiveRadiance=vec3(0.);\n#endif');};
 mt.customProgramCacheKey=()=>'lit'+glow+dark;const im=new THREE.InstancedMesh(geo,mt,n);im.castShadow=false;im.receiveShadow=false;im.frustumCulled=false;
 const c=new THREE.Color();for(let i=0;i<n;i++){im.setColorAt(i,c.set(0xffffff));}
 im.lit=(i,v)=>{aLit.array[i]=v;aLit.needsUpdate=true;};im.litArr=aLit.array;return im;}
/* additive ground glow pools (instanced quads), opacity per instance */
export function pools(n,color=0xffa040){const g=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);const a=new THREE.InstancedBufferAttribute(new Float32Array(n),1);g.setAttribute('aA',a);
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color(color)}},
  vertexShader:'attribute float aA;varying float vA;varying vec2 vUv;void main(){vA=aA;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 uC;varying float vA;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;float f=pow(max(0.,1.-d),1.8);gl_FragColor=vec4(uC*f*vA*.55,1.);}'});
 const im=new THREE.InstancedMesh(g,m,n);im.frustumCulled=false;im.renderOrder=2;im.setA=(i,v)=>{a.array[i]=v;a.needsUpdate=true;};return im;}

/* ---------- GPU particles (additive or alpha), from plaza/util.js ---------- */
export class Particles{constructor(scene,n=2000,blend='add'){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.i=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('pcol',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  const add=blend==='add';this.U={uScale:{value:500}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 pcol;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=pcol;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:add?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}':'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.2,d);if(a*vC.a<.01)discard;gl_FragColor=vec4(vC.rgb,a*vC.a);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=5;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.up)dy=Math.abs(dy)+(o.up===true?0:o.up);const s=speed*(.35+Math.random()*.65);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x+(o.jit?rnd(-o.jit,o.jit):0),p.y+(o.jit?rnd(-o.jit,o.jit)*.5:0),p.z+(o.jit?rnd(-o.jit,o.jit):0),dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5);}}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   const f=Math.min(1,k*2.5);c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=f*f;s[i]=os[i]*(.5+.5*Math.min(1,k*1.6));}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.pcol.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

// a canvas label sprite (floating names / damage numbers are HTML; this is for in-world signs)
export function textSprite(text,o={}){const fs=o.size??64,font=`${o.weight??'400'} ${fs}px ${o.font??'Anton, Impact, sans-serif'}`;const c=document.createElement('canvas'),x=c.getContext('2d');x.font=font;const w=Math.ceil(x.measureText(text).width)+fs*.9,h=Math.ceil(fs*1.5);c.width=w;c.height=h;
 x.font=font;if(o.bg){x.fillStyle=o.bg;x.beginPath();x.roundRect(2,2,w-4,h-4,h*.3);x.fill();}x.fillStyle=o.color??'#fff';x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2+fs*.04);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));const sc=o.scale??1;s.scale.set(w/h*sc,sc,1);return s;}
