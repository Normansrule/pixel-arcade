// STARFALL VANGUARD — small shared helpers: math, canvas textures, geometry merging.
import * as THREE from '../vendor/three.module.min.js';
export const V=THREE.Vector3,TAU=Math.PI*2;
export const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,rnd=(a=1)=>Math.random()*a,rr=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.random()*a.length|0];
export const wrapA=a=>{while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a;};
export const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
// seeded rng (maps are deterministic)
export function rng(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}

export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);
 t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(o.nearest){t.magFilter=THREE.NearestFilter;}return t;}

// merge [geometry, matrix?, color?] entries into one geometry (vertex colours when a colour is given)
export function merge(list){const withCol=list.some(e=>e[2]||e[0].attributes.color);const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=withCol?new Float32Array(n*3).fill(1):null;let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(col){if(g.attributes.color)col.set(g.attributes.color.array,o*3);else if(g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(col)r.setAttribute('color',new THREE.BufferAttribute(col,3));return r;}
export const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));

// world-space box UVs so tiled textures keep a constant texel density on every face
export function boxUV(g,scale=.25){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));let u,v;
 if(ay>.5){u=p.getX(i);v=p.getZ(i);}else if(ax>.5){u=p.getZ(i);v=p.getY(i);}else{u=p.getX(i);v=p.getY(i);}uv.setXY(i,u*scale,v*scale);}uv.needsUpdate=true;return g;}

export const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};

// binary heap for A*
export class Heap{constructor(){this.k=[];this.v=[];}get size(){return this.k.length;}
 push(key,val){const k=this.k,v=this.v;let i=k.length;k.push(key);v.push(val);while(i>0){const p=(i-1)>>1;if(k[p]<=k[i])break;[k[p],k[i]]=[k[i],k[p]];[v[p],v[i]]=[v[i],v[p]];i=p;}}
 pop(){const k=this.k,v=this.v,top=v[0],lk=k.pop(),lv=v.pop();if(k.length){k[0]=lk;v[0]=lv;let i=0;for(;;){const l=i*2+1,r=l+1;let m=i;if(l<k.length&&k[l]<k[m])m=l;if(r<k.length&&k[r]<k[m])m=r;if(m===i)break;[k[m],k[i]]=[k[i],k[m]];[v[m],v[i]]=[v[i],v[m]];i=m;}}return top;}}
