// IRON VANGUARD — shared helpers: math, seeded random, noise, geometry merging / profiles.
import * as THREE from '../vendor/three.module.min.js';
import {ImprovedNoise} from '../vendor/jsm/math/ImprovedNoise.js';
export const V=THREE.Vector3,PI=Math.PI,TAU=PI*2;
export const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rr=(a,b)=>a+Math.random()*(b-a);
export const sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const ang=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
export function mulberry(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const PN=new ImprovedNoise();
export const noise=(x,y,z=0)=>PN.noise(x,y,z);
export function fbm(x,y,oct=4,seed=0){let a=0,f=1,amp=1,n=0;for(let i=0;i<oct;i++){a+=PN.noise(x*f,y*f,seed+i*7.3)*amp;n+=amp;f*=2.03;amp*=.5;}return a/n;}
export const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const IDM=new THREE.Matrix4();
// merge [{geo,m,c,us,vs}] into one non-indexed geometry (vertex colours when any part has c)
export function merge(list){const P=[],N=[],U=[],C=[];let hasC=false;const nm=new THREE.Matrix3(),v=new V();for(const it of list){const geo=it.geo,m=it.m||IDM;const g=geo.index?geo.toNonIndexed():geo;const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,c=g.attributes.color;nm.getNormalMatrix(m);const col=it.c!=null?new THREE.Color(it.c):null;if(col||c)hasC=true;
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);U.push(u?u.getX(i)*(it.us||1):0,u?u.getY(i)*(it.vs||1):0);
   if(c)C.push(c.getX(i),c.getY(i),c.getZ(i));else if(col)C.push(col.r,col.g,col.b);else C.push(1,1,1);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));if(hasC)g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeBoundingSphere();return g;}
// side profile (u = forward z, v = up y) extruded across x with a soft bevel
export function prof(pts,width,bevel=.04,curve=4){const s=new THREE.Shape();pts.forEach(([u,v],i)=>i?s.lineTo(u,v):s.moveTo(u,v));const g=new THREE.ExtrudeGeometry(s,{depth:width-bevel*2,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:curve>1?2:1,curveSegments:curve});
 g.translate(0,0,-(width-bevel*2)/2);g.rotateY(-PI/2);g.computeVertexNormals();return g;}
export const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(rt,rb,h,s=12,open=false)=>new THREE.CylinderGeometry(rt,rb,h,s,1,open),SP=(r,a=12,b=8)=>new THREE.SphereGeometry(r,a,b);
// ray vs AABB (slab); returns t or Infinity; sets out normal axis
export function rayAABB(ox,oy,oz,ix,iy,iz,x0,y0,z0,x1,y1,z1,maxT,n){let t1=(x0-ox)*ix,t2=(x1-ox)*ix,tmin,tmax,a=0,s;if(t1<t2){tmin=t1;tmax=t2;s=-1;}else{tmin=t2;tmax=t1;s=1;}
 t1=(y0-oy)*iy;t2=(y1-oy)*iy;if(t1>t2){const q=t1;t1=t2;t2=q;if(t1>tmin){tmin=t1;a=1;s=1;}}else if(t1>tmin){tmin=t1;a=1;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax)return Infinity;
 t1=(z0-oz)*iz;t2=(z1-oz)*iz;if(t1>t2){const q=t1;t1=t2;t2=q;if(t1>tmin){tmin=t1;a=2;s=1;}}else if(t1>tmin){tmin=t1;a=2;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax||tmax<0||tmin<0||tmin>maxT)return Infinity;
 if(n)n.set(a===0?s:0,a===1?s:0,a===2?s:0);return tmin;}
