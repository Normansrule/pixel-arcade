// VOIDWING — small shared helpers: math, seeded rng, canvas textures, geometry merging, noise.
import * as THREE from '../vendor/three.module.min.js';
export const V=THREE.Vector3,Q=THREE.Quaternion,C=THREE.Color,TAU=Math.PI*2;
export const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rnd=(a=1)=>Math.random()*a,rs=(a=1)=>(Math.random()*2-1)*a,rr=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
export const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
export function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
export const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);
 t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
// merge [geometry, matrix?, color?] entries into one non-indexed geometry (vertex colours when any colour is given)
export function merge(list){const withCol=list.some(e=>e[2]!==undefined&&e[2]!==null);const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c!==undefined&&c!==null?new C(c):null;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=withCol?new Float32Array(n*3).fill(1):null;let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(col&&g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(col)r.setAttribute('color',new THREE.BufferAttribute(col,3));r.computeBoundingSphere();return r;}
export const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new Q().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
// world-space box UVs so tiled hull textures keep a constant texel density on every face
export function boxUV(g,scale=.05){g=g.index?g.toNonIndexed():g;const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));let u,v;
 if(ay>.6){u=p.getX(i);v=p.getZ(i);}else if(ax>.6){u=p.getZ(i);v=p.getY(i);}else{u=p.getX(i);v=p.getY(i);}uv.setXY(i,u*scale,v*scale);}uv.needsUpdate=true;return g;}
// smooth vertex normals of a non-indexed geometry by welding equal positions
export function smoothNormals(g){const p=g.attributes.position,n=g.attributes.normal,map=new Map(),key=i=>Math.round(p.getX(i)*1e3)+','+Math.round(p.getY(i)*1e3)+','+Math.round(p.getZ(i)*1e3);
 for(let i=0;i<p.count;i++){const k=key(i);let a=map.get(k);if(!a){a=[0,0,0];map.set(k,a);}a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);}
 for(let i=0;i<p.count;i++){const a=map.get(key(i)),l=Math.hypot(a[0],a[1],a[2])||1;n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}n.needsUpdate=true;return g;}
// cheap 3D value noise for geometry displacement
const HP=new Uint8Array(512);{const r=rng(1337),p=[...Array(256).keys()];for(let i=255;i>0;i--){const j=r()*(i+1)|0;[p[i],p[j]]=[p[j],p[i]];}for(let i=0;i<512;i++)HP[i]=p[i&255];}
const fade=t=>t*t*(3-2*t);
export function vnoise(x,y,z){const X=Math.floor(x),Y=Math.floor(y),Z=Math.floor(z),fx=fade(x-X),fy=fade(y-Y),fz=fade(z-Z);const h=(i,j,k)=>HP[HP[HP[(X+i)&255]+((Y+j)&255)]+((Z+k)&255)]/255;
 const a=lerp(lerp(h(0,0,0),h(1,0,0),fx),lerp(h(0,1,0),h(1,1,0),fx),fy),b=lerp(lerp(h(0,0,1),h(1,0,1),fx),lerp(h(0,1,1),h(1,1,1),fx),fy);return lerp(a,b,fz);}
export function fbm3(x,y,z,o=4){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f,z*f);f*=2.03;a*=.5;}return s;}
// GLSL noise used by the sky, planet and shield shaders
export const GLSL_NOISE=`float h13(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x),mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x),f.y),mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x),mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p,int o){float s=0.,a=.5;for(int i=0;i<8;i++){if(i>=o)break;s+=a*vn(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}`;
