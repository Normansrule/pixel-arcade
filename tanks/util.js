// IRONCLAD — shared helpers: math, seeded random, noise, geometry merging, canvas textures.
import * as THREE from '../vendor/three.module.min.js';
import {ImprovedNoise} from '../vendor/jsm/math/ImprovedNoise.js';
export const V3=THREE.Vector3;
export const cl=(v,a,b)=>v<a?a:v>b?b:v;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const TAU=Math.PI*2;
export const wrapA=a=>{a%=TAU;if(a>Math.PI)a-=TAU;else if(a<-Math.PI)a+=TAU;return a;};
export const angDiff=(a,b)=>wrapA(b-a);
export function mulberry(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const PN=new ImprovedNoise();
export const noise=(x,y,z=0)=>PN.noise(x,y,z);
export function fbm(x,y,oct=4,seed=0){let a=0,f=1,amp=1,n=0;for(let i=0;i<oct;i++){a+=PN.noise(x*f,y*f,seed+i*7.3)*amp;n+=amp;f*=2.03;amp*=.5;}return a/n;}
export const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};

export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h,c);const t=new THREE.CanvasTexture(c);
 t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=o.aniso??8;if(o.rep)t.repeat.set(o.rep[0],o.rep[1]);return t;}
// tangent-space normal map from a grey height canvas
export function normalFrom(src,str=2){const w=src.width,h=src.height,s=src.getContext('2d').getImageData(0,0,w,h).data;const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),o=x.createImageData(w,h),d=o.data;
 const H=(i,j)=>s[(((j+h)%h)*w+((i+w)%w))*4]/255;
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(H(i+1,j)-H(i-1,j))*str,dy=(H(i,j+1)-H(i,j-1))*str;const l=Math.hypot(dx,dy,1);const k=(j*w+i)*4;d[k]=(-dx/l*.5+.5)*255;d[k+1]=(dy/l*.5+.5)*255;d[k+2]=(1/l*.5+.5)*255;d[k+3]=255;}
 x.putImageData(o,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
export function canvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c;}
export function texFrom(c,o={}){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}

// merge [geometry, matrix?, color?] into one non-indexed geometry with optional vertex colors
export function merge(list){const withCol=list.some(e=>e[2]||e[0].attributes.color);const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=withCol?new Float32Array(n*3).fill(1):null;let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(!g.attributes.normal)g.computeVertexNormals();nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(col){if(g.attributes.color&&g.attributes.color.itemSize===3)col.set(g.attributes.color.array,o*3);else if(g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(col)r.setAttribute('color',new THREE.BufferAttribute(col,3));r.computeBoundingSphere();return r;}
const _q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new V3(),_p=new V3();
export const M=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(_p.set(x,y,z),_q.setFromEuler(_e.set(rx,ry,rz)),_s.set(sx,sy,sz));
export const col=(h)=>new THREE.Color(h);
// box whose UVs are in world units / tile (so textures don't stretch)
export function boxUV(w,h,d,tu=4,tv=3.2){const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
 for(let f=0;f<6;f++){const[a,b]=dims[f];for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*a/tu,uv.getY(k)*b/tv);}}return g;}
// soft round sprite for particles
export function spriteTex(){return ctex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true,srgb:false});}
