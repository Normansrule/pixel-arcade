// PENGUIN PLAZA — shared helpers: math, canvas textures, geometry merging, particles, seeded RNG.
import * as THREE from '../vendor/three.module.min.js';
export {THREE};
export const V3=THREE.Vector3;
export const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a),ri=n=>Math.random()*n|0,pick=a=>a[Math.random()*a.length|0];
export const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
export const sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const angDiff=(a,b)=>{let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d;};
export const dampAng=(a,b,k,dt)=>a+angDiff(a,b)*(1-Math.exp(-k*dt));
export const easeOutBack=t=>{const c=1.70158;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
export function rng(seed){let a=seed>>>0||1;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const $=id=>document.getElementById(id);

export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
export const M=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V3(sx,sy,sz));
// merge [geometry, matrix?, color?] entries into one non-indexed geometry with vertex colours
export function merge(list){const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c!==undefined?new THREE.Color(c):null;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3).fill(1);let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(g.attributes.color)col.set(g.attributes.color.array,o*3);else if(g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(col,3));r.computeBoundingSphere();return r;}
export function disposeTree(o){o.traverse(n=>{if(n.geometry&&!n.geometry.userData.keep)n.geometry.dispose();const m=n.material;if(m&&!m.userData?.keep){(Array.isArray(m)?m:[m]).forEach(x=>{if(x.userData?.keep)return;for(const k in x)if(x[k]&&x[k].isTexture&&!x[k].userData.keep)x[k].dispose();x.dispose();});}});}
// standard PBR material shortcut
export const mat=(color,o={})=>new THREE.MeshStandardMaterial({color,roughness:o.r??.7,metalness:o.m??0,vertexColors:!!o.vc,emissive:o.e??0x000000,emissiveIntensity:o.ei??1,transparent:!!o.t,opacity:o.o??1,side:o.side??THREE.FrontSide,flatShading:!!o.flat,envMapIntensity:o.env??.6,map:o.map||null});

// soft environment map for snowy PBR reflections
export function makeEnv(R,top=0x9fc4ff,hor=0xf4f8ff,gnd=0xdfe6f0){const s=new THREE.Scene();
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{a:{value:new THREE.Color(top)},b:{value:new THREE.Color(hor)},c:{value:new THREE.Color(gnd)}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 a,b,c;varying vec3 vP;void main(){float h=normalize(vP).y;vec3 col=h>0.?mix(b,a,pow(h,.6)):mix(b,c,pow(-h,.5));gl_FragColor=vec4(col,1.);}'})));
 const lm=new THREE.MeshBasicMaterial({color:new THREE.Color(6,5.6,5),side:THREE.DoubleSide});const m=new THREE.Mesh(new THREE.CircleGeometry(12,16),lm);m.position.set(40,70,30);m.lookAt(0,0,0);s.add(m);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.04);pm.dispose();return rt.texture;}

/* ---------- GPU particles (additive or alpha) ---------- */
export class Particles{constructor(scene,n=2000,blend='add'){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.i=0;this.alive=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('pcol',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  const add=blend==='add';this.U={uScale:{value:500}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute vec4 pcol;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=pcol;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:add?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}':'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.2,d);if(a*vC.a<.01)discard;gl_FragColor=vec4(vC.rgb,a*vC.a);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=5;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){dx=dx*(o.spread??.6)+o.dir.x;dy=dy*(o.spread??.6)+o.dir.y;dz=dz*(o.spread??.6)+o.dir.z;}if(o.up)dy=Math.abs(dy)+(o.up===true?0:o.up);const s=speed*(.35+Math.random()*.65);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x+(o.jit?rnd(-o.jit,o.jit):0),p.y,p.z+(o.jit?rnd(-o.jit,o.jit):0),dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5);}}
 update(dt,floor=-1e9){const{p,v,c,oc,s,os,life,max,g,drag}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;if(p[i*3+1]<floor&&g[i]>0){p[i*3+1]=floor;v[i*3+1]*=-.3;v[i*3]*=.6;v[i*3+2]*=.6;}
   const f=Math.min(1,k*2.5);c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=f*f;s[i]=os[i]*(.5+.5*Math.min(1,k*1.6));}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.pcol.needsUpdate=this.geo.attributes.size.needsUpdate=true;}
 setScale(cam,h,pr){this.U.uScale.value=h*pr/(2*Math.tan(cam.fov*Math.PI/360));}}

// a canvas label sprite (signs, floating titles)
export function textSprite(text,o={}){const fs=o.size??64,font=`${o.weight??'400'} ${fs}px ${o.font??'Anton, Impact, sans-serif'}`;const c=document.createElement('canvas'),x=c.getContext('2d');x.font=font;const w=Math.ceil(x.measureText(text).width)+fs*.9,h=Math.ceil(fs*1.5);c.width=w;c.height=h;
 x.font=font;if(o.bg){x.fillStyle=o.bg;x.beginPath();x.roundRect(2,2,w-4,h-4,h*.45);x.fill();}x.fillStyle=o.color??'#fff';x.textAlign='center';x.textBaseline='middle';if(o.stroke){x.lineWidth=fs*.14;x.strokeStyle=o.stroke;x.strokeText(text,w/2,h/2+fs*.04);}x.fillText(text,w/2,h/2+fs*.04);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:o.fog??true,toneMapped:o.tm??true}));const sc=o.scale??1;s.scale.set(w/h*sc,sc,1);return s;}
