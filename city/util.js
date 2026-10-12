// NEON BAY — shared helpers: seeded RNG, noise, math, geometry merging, canvas textures.
import * as THREE from '../vendor/three.module.min.js';
export {THREE};
export const V3=THREE.Vector3;
export const cl=(v,a,b)=>v<a?a:v>b?b:v;
export const lerp=(a,b,t)=>a+(b-a)*t;
export const sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const wrapA=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
export const fmtCash=n=>(n<0?'-$':'$')+Math.abs(Math.round(n)).toLocaleString('en-US');
export const fmtT=t=>{t=Math.max(0,t);const m=t/60|0,s=t%60;return m+':'+(s<10?'0':'')+s.toFixed(0).padStart(1,'0');};
export const fmtClock=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
export const fmtRace=t=>{if(!isFinite(t)||t<=0)return'—';const m=t/60|0,s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(2);};

// mulberry-style seeded RNG
export function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
export function hash2(x,z){let h=Math.imul(x|0,374761393)+Math.imul(z|0,668265263);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
// smooth value noise + fbm
export function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z),xf=x-xi,zf=z-zi,u=xf*xf*(3-2*xf),v=zf*zf*(3-2*zf);
 const a=hash2(xi,zi),b=hash2(xi+1,zi),c=hash2(xi,zi+1),d=hash2(xi+1,zi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
export function fbm(x,z,o=4){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*vnoise(x*f,z*f);f*=2.03;a*=.5;}return s;}
// distance from point to segment, returns {d,t}
export function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1e-9;let t=((px-ax)*dx+(pz-az)*dz)/l2;t=cl(t,0,1);const x=ax+dx*t-px,z=az+dz*t-pz;return{d:Math.sqrt(x*x+z*z),t};}

// canvas texture
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=o.aniso??8;if(o.nomip){t.generateMipmaps=false;t.minFilter=THREE.LinearFilter;}return t;}

// matrix helper
const _q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new V3(),_p=new V3();
export function M(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx){return new THREE.Matrix4().compose(_p.set(x,y,z),_q.setFromEuler(_e.set(rx,ry,rz,'YXZ')),_s.set(sx,sy,sz));}

// merge [geometry, matrix?, color?, extra?] into one non-indexed geometry with vertex colors (+ optional per-entry float attribute 'aK')
export function merge(list,o={}){const gs=list.map(([g,m,c,k])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;g.userData.k=k||0;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3).fill(1),kk=o.k?new Float32Array(n):null;let off=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,off*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,off*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,off*2);
  if(g.attributes.color)col.set(g.attributes.color.array,off*3);else if(g.userData.c!=null){const c=g.userData.c instanceof THREE.Color?g.userData.c:new THREE.Color(g.userData.c);for(let i=0;i<k;i++){col[(off+i)*3]=c.r;col[(off+i)*3+1]=c.g;col[(off+i)*3+2]=c.b;}}
  if(kk)kk.fill(g.userData.k,off,off+k);off+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(col,3));if(kk)r.setAttribute('aK',new THREE.BufferAttribute(kk,1));r.computeBoundingSphere();return r;}

// simple keyed lerp of keyframes [[t,value...]]
export function keyed(keys,t){if(t<=keys[0][0])return keys[0].slice(1);for(let i=1;i<keys.length;i++){if(t<=keys[i][0]){const a=keys[i-1],b=keys[i],f=(t-a[0])/(b[0]-a[0]);return a.slice(1).map((v,k)=>v+(b[k+1]-v)*f);}}return keys[keys.length-1].slice(1);}
