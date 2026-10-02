// STORM ROYALE — shared helpers: math, seeded random, canvas textures, geometry merging.
import * as THREE from '../vendor/three.module.min.js';
export const V=THREE.Vector3;
export const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
export const smooth=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
export function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const pick=(a,r=Math.random)=>a[Math.floor(r()*a.length)];
export function wpick(w,r=Math.random){let s=0;for(const k in w)s+=w[k];let x=r()*s;for(const k in w){x-=w[k];if(x<=0)return k;}return Object.keys(w)[0];}
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
export const M=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
// merge [geometry, matrix?, color?] entries into one non-indexed geometry with vertex colors
export function merge(list,flat=false){const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);if(flat)g.computeVertexNormals();g.userData.c=c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3).fill(1);let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(g.attributes.color)col.set(g.attributes.color.array,o*3);else if(g.userData.c!=null){const c=new THREE.Color(g.userData.c);for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(col,3));r.computeBoundingSphere();r.computeBoundingBox();return r;}
// box-projected world-ish UVs (scale s per metre) so tiling textures line up across merged parts
export function wuv(g,s=.25){const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));
  if(ay>=ax&&ay>=az)uv.setXY(i,p.getX(i)*s,p.getZ(i)*s);else if(ax>=az)uv.setXY(i,p.getZ(i)*s,p.getY(i)*s);else uv.setXY(i,p.getX(i)*s,p.getY(i)*s);}uv.needsUpdate=true;return g;}
// jitter vertices of a (non-indexed) geometry by a deterministic noise for a hand-made look
export function lumpy(g,amt,seed=1){const p=g.attributes.position,r=rng(seed),map=new Map();for(let i=0;i<p.count;i++){const k=p.getX(i).toFixed(3)+','+p.getY(i).toFixed(3)+','+p.getZ(i).toFixed(3);let o=map.get(k);if(!o){o=[(r()-.5)*amt,(r()-.5)*amt,(r()-.5)*amt];map.set(k,o);}p.setXYZ(i,p.getX(i)+o[0],p.getY(i)+o[1],p.getZ(i)+o[2]);}g.computeVertexNormals();return g;}
// slab test: ray (o,d) vs AABB b -> t or -1
export function rayBox(ox,oy,oz,dx,dy,dz,b,maxT){let t0=0,t1=maxT;
 for(let a=0;a<3;a++){const o=a===0?ox:a===1?oy:oz,d=a===0?dx:a===1?dy:dz,mn=a===0?b[0]:a===1?b[1]:b[2],mx=a===0?b[3]:a===1?b[4]:b[5];
  if(Math.abs(d)<1e-9){if(o<mn||o>mx)return -1;continue;}let ta=(mn-o)/d,tb=(mx-o)/d;if(ta>tb){const s=ta;ta=tb;tb=s;}if(ta>t0)t0=ta;if(tb<t1)t1=tb;if(t0>t1)return -1;}return t0;}
export function boxNormal(px,py,pz,b){const e=[Math.abs(px-b[0]),Math.abs(py-b[1]),Math.abs(pz-b[2]),Math.abs(px-b[3]),Math.abs(py-b[4]),Math.abs(pz-b[5])];let k=0;for(let i=1;i<6;i++)if(e[i]<e[k])k=i;const n=new V();n.setComponent(k%3,k<3?-1:1);return n;}
// vertical cylinder (x,z,r,y0,y1)
export function rayCyl(ox,oy,oz,dx,dy,dz,c,maxT){let best=-1;const fx=ox-c.x,fz=oz-c.z,a=dx*dx+dz*dz;
 if(a>1e-9){const b=fx*dx+fz*dz,cc=fx*fx+fz*fz-c.r*c.r,disc=b*b-a*cc;if(disc>=0){const t=(-b-Math.sqrt(disc))/a;if(t>=0&&t<=maxT){const y=oy+dy*t;if(y>=c.y0&&y<=c.y1)best=t;}}}
 if(dy<0&&oy>c.y1){const t=(c.y1-oy)/dy;if(t<=maxT&&(best<0||t<best)){const x=fx+dx*t,z=fz+dz*t;if(x*x+z*z<=c.r*c.r)best=t;}}return best;}
export const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
