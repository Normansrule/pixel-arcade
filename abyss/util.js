// ABYSS DIVER — small shared helpers.
import * as THREE from '../vendor/three.module.min.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';

export const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sm=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
export const NZ=new SimplexNoise({random:mulberry(42)});
export const n2=(x,z)=>NZ.noise(x,z),n3=(x,y,z)=>NZ.noise3d(x,y,z);
export const $=id=>document.getElementById(id);
export const mmss=t=>{t=Math.max(0,Math.ceil(t));return (t/60|0)+':'+String(t%60).padStart(2,'0');};

/* merge non-indexed copies of geometries (position, normal, color, uv) */
export function merge(list){const P=[],Nn=[],C=[],UV=[];for(const g0 of list){const g=g0.index?g0.toNonIndexed():g0;if(!g.attributes.normal)g.computeVertexNormals();const p=g.attributes.position,n=g.attributes.normal,c=g.attributes.color,u=g.attributes.uv;
 for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));Nn.push(n.getX(i),n.getY(i),n.getZ(i));if(c)C.push(c.getX(i),c.getY(i),c.getZ(i));else C.push(1,1,1);if(u)UV.push(u.getX(i),u.getY(i));else UV.push(0,0);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(Nn,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));return g;}
/* paint a whole geometry one colour, or by a function of (x,y,z,nx,ny,nz) */
export function paint(g,col){const p=g.attributes.position,n=g.attributes.normal||(g.computeVertexNormals(),g.attributes.normal);const a=new Float32Array(p.count*3);const c=new THREE.Color();
 for(let i=0;i<p.count;i++){if(typeof col==='function')col(c,p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i));else c.set(col);a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
/* smooth normals for non-indexed geometry: average normals of coincident vertices */
export function smoothNormals(g){g.computeVertexNormals();if(g.index)return g;const p=g.attributes.position,n=g.attributes.normal;const map=new Map();const key=i=>Math.round(p.getX(i)*1e3)+','+Math.round(p.getY(i)*1e3)+','+Math.round(p.getZ(i)*1e3);
 for(let i=0;i<p.count;i++){const k=key(i);let a=map.get(k);if(!a){a=[0,0,0];map.set(k,a);}a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);}
 for(let i=0;i<p.count;i++){const a=map.get(key(i));const l=Math.hypot(a[0],a[1],a[2])||1;n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}n.needsUpdate=true;return g;}
export function displace(g,amt,freq,seed=0){const p=g.attributes.position;const v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const k=1+n3(v.x*freq+seed,v.y*freq,v.z*freq)*amt+n3(v.x*freq*2.7,v.y*freq*2.7+seed,v.z*freq*2.7)*amt*.35;p.setXYZ(i,v.x*k,v.y*k,v.z*k);}return smoothNormals(g);}
export const xf=(g,{p=[0,0,0],r=[0,0,0],s=[1,1,1]}={})=>{const m=new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)),new THREE.Vector3(...(typeof s==='number'?[s,s,s]:s)));g.applyMatrix4(m);return g;};

/* canvas textures */
export function canvasTex(w,h,fn,{rep=1,srgb=true,aniso=4}={}){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=aniso;return t;}
/* height array -> normal map texture */
export function normalTex(w,h,H,str=2){return canvasTex(w,h,(x)=>{const im=x.createImageData(w,h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const l=H[j*w+(i-1+w)%w],r=H[j*w+(i+1)%w],u=H[((j-1+h)%h)*w+i],d=H[((j+1)%h)*w+i];let nx=(l-r)*str,ny=(u-d)*str,nz=1;const k=1/Math.hypot(nx,ny,nz);const o=(j*w+i)*4;im.data[o]=(nx*k*.5+.5)*255;im.data[o+1]=(ny*k*.5+.5)*255;im.data[o+2]=(nz*k*.5+.5)*255;im.data[o+3]=255;}x.putImageData(im,0,0);},{srgb:false});}
/* tileable fbm height field */
export function fbmField(w,h,oct,seed,fn){const H=new Float32Array(w*h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const a=i/w*Math.PI*2,b=j/h*Math.PI*2;let s=0,amp=1,f=1,tot=0;for(let o=0;o<oct;o++){s+=NZ.noise4d(Math.cos(a)*f+seed,Math.sin(a)*f,Math.cos(b)*f,Math.sin(b)*f+seed)*amp;tot+=amp;amp*=.5;f*=2;}H[j*w+i]=fn?fn(s/tot,i,j):s/tot;}return H;}

/* collapse a static group into one mesh per material (transforms baked), to cut draw calls */
export function mergeByMaterial(root){root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();const by=new Map();const m=new THREE.Matrix4();const keep=[];
 root.traverse(o=>{if(!o.isMesh||o===root)return;if(o.isInstancedMesh||o.material.transparent||o.userData.keep){keep.push(o);return;}const g=o.geometry.clone();m.multiplyMatrices(inv,o.matrixWorld);g.applyMatrix4(m);
  if(m.determinant()<0){const ix=g.index;if(ix){const a=ix.array;for(let i=0;i<a.length;i+=3){const t=a[i];a[i]=a[i+2];a[i+2]=t;}}}
  if(!by.has(o.material))by.set(o.material,{list:[],cast:false});const e=by.get(o.material);e.list.push(g);e.cast=e.cast||o.castShadow;});
 const out=new THREE.Group();out.position.copy(root.position);out.quaternion.copy(root.quaternion);out.scale.copy(root.scale);
 for(const[mat,e]of by){const mesh=new THREE.Mesh(merge(e.list),mat);mesh.castShadow=e.cast;out.add(mesh);}
 for(const o of keep){const c=o;c.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.parent.matrixWorld));out.add(c);}
 return out;}
