// DUSTWATER — shared helpers: math, seeded random, canvas textures, geometry merging (adapted from Storm Royale).
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
// height canvas (luminance) -> tangent-space normal map texture
export function normalFrom(src,strength=2,o={}){const w=src.width,h=src.height,d0=src.getContext('2d').getImageData(0,0,w,h).data,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),img=x.createImageData(w,h),d=img.data;
 const L=(i,j)=>{const k=(((j+h)%h)*w+((i+w)%w))*4;return(d0[k]*.3+d0[k+1]*.59+d0[k+2]*.11)/255;};
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const dx=(L(i+1,j)-L(i-1,j))*strength,dy=(L(i,j+1)-L(i,j-1))*strength,l=Math.hypot(dx,dy,1),k=(j*w+i)*4;d[k]=(-dx/l*.5+.5)*255;d[k+1]=(dy/l*.5+.5)*255;d[k+2]=(1/l*.5+.5)*255;d[k+3]=255;}
 x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;t.anisotropy=8;return t;}
// tileable value-noise fbm field (n x n, values 0..1)
export function tnoise(n,cells,seed,oct=4){const out=new Float32Array(n*n);let amp=1,tot=0;for(let o=0;o<oct;o++){const C=cells<<o,r=rng(seed+o*31),g=new Float32Array(C*C).map(()=>r());
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const u=i/n*C,v=j/n*C,i0=u|0,j0=v|0,fu=smooth(0,1,u-i0),fv=smooth(0,1,v-j0),i1=(i0+1)%C,j1=(j0+1)%C,a=g[j0*C+i0],b=g[j0*C+i1],c=g[j1*C+i0],d=g[j1*C+i1];out[j*n+i]+=(a+(b-a)*fu+(c-a)*fv+(a-b-c+d)*fu*fv)*amp;}tot+=amp;amp*=.5;}
 for(let i=0;i<n*n;i++)out[i]/=tot;return out;}
// rounded box (radius r) and a capsule hanging down from its top (pivot at y=0)
export function rbox(w,h,d,r=.03,seg=3){r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);const g=new THREE.BoxGeometry(w,h,d,seg,seg,seg),p=g.attributes.position,n=g.attributes.normal,v=new V(),c=new V(),hw=w/2-r,hh=h/2-r,hd=d/2-r;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(cl(v.x,-hw,hw),cl(v.y,-hh,hh),cl(v.z,-hd,hd));v.sub(c);if(v.lengthSq()<1e-10)v.fromBufferAttribute(n,i);v.normalize();n.setXYZ(i,v.x,v.y,v.z);p.setXYZ(i,c.x+v.x*r,c.y+v.y*r,c.z+v.z*r);}return g;}
export const cap=(r,len,rs=10)=>{const g=new THREE.CapsuleGeometry(r,Math.max(.001,len),3,rs);g.translate(0,-len/2-r,0);return g;};
// loft: a smooth tube through cross-sections S=[{c:[x,y,z],rx,ry,dn?,sq?,ox?,oy?}] (rx across, ry 'up' of the section frame,
// dn scales the lower half, sq = superellipse exponent for boxy sections). up = reference axis for the frame. Closed ends unless o.open.
const crs=(a,b,c,d,t)=>{const t2=t*t,t3=t2*t;return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);};
// resample sections along a Catmull-Rom spline so the surface has no creases at the stations
function subSec(S,k){if(k<=1||S.length<3)return S;const out=[],n=S.length,keys=['rx','ry','dn','bk','ox','oy','sq'];
 for(let i=0;i<n-1;i++)for(let j=0;j<k;j++){const t=j/k,a=S[Math.max(0,i-1)],b=S[i],c=S[i+1],d=S[Math.min(n-1,i+2)],q={c:[0,1,2].map(m=>crs(a.c[m],b.c[m],c.c[m],d.c[m],t))};
  for(const key of keys){if(b[key]==null&&c[key]==null)continue;const f=(s,dv)=>s[key]??dv;const dv=key==='dn'||key==='bk'?1:key==='sq'?2:0;q[key]=Math.max(key==='rx'||key==='ry'?.001:-9,crs(f(a,dv),f(b,dv),f(c,dv),f(d,dv),t));}out.push(q);}
 out.push(S[n-1]);return out;}
export function loft(S,seg=12,o={}){S=subSec(S,o.sub??3);const n=S.length,C=S.map(s=>new V(...s.c)),pos=[],uv=[],idx=[];let L=0;const vv=[0];for(let i=1;i<n;i++){L+=C[i].distanceTo(C[i-1]);vv.push(L);}
 const ref=new V(...(o.up||[0,1,0])),a0=o.arc?o.arc[0]:0,a1=o.arc?o.arc[1]:Math.PI*2,full=!o.arc,ns=full?seg:seg+1;
 for(let i=0;i<n;i++){const t=new V().subVectors(C[Math.min(n-1,i+1)],C[Math.max(0,i-1)]).normalize(),r=ref.clone();if(Math.abs(r.dot(t))>.97)r.set(0,0,1);const s=new V().crossVectors(r,t).normalize(),u=new V().crossVectors(t,s),q=S[i];
  for(let j=0;j<ns;j++){const a=a0+(a1-a0)*j/seg,ca=Math.cos(a),sa=Math.sin(a);let k=1;if(q.sq){const e=q.sq;k=Math.pow(Math.pow(Math.abs(ca),e)+Math.pow(Math.abs(sa),e),-1/e);}
   const rx=q.rx*k*(ca<0&&q.bk!=null?q.bk:1),ry=q.ry*k*(sa<0&&q.dn!=null?q.dn:1);const p=C[i].clone().addScaledVector(s,ca*rx+(q.ox||0)).addScaledVector(u,sa*ry+(q.oy||0));pos.push(p.x,p.y,p.z);uv.push(j/seg,vv[i]);}}
 for(let i=0;i<n-1;i++)for(let j=0;j<(full?seg:seg);j++){const j1=full?(j+1)%seg:j+1,a=i*ns+j,b=i*ns+j1,c=(i+1)*ns+j,d=(i+1)*ns+j1;idx.push(a,c,b,b,c,d);}
 if(full&&!o.open){for(const[e,dir]of[[0,-1],[n-1,1]]){const ci=pos.length/3,c=C[e],t=new V().subVectors(C[Math.min(n-1,e+1)],C[Math.max(0,e-1)]).normalize().multiplyScalar(dir*(o.capOut||0));pos.push(c.x+t.x,c.y+t.y,c.z+t.z);uv.push(.5,vv[e]);for(let j=0;j<seg;j++){const j1=(j+1)%seg;if(dir<0)idx.push(ci,e*ns+j,e*ns+j1);else idx.push(ci,e*ns+j1,e*ns+j);}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 // orientation check: first ring normal should point away from its centre
 const nr=g.attributes.normal,p0=new V().fromBufferAttribute(g.attributes.position,Math.min(1,ns-1));if(new V().fromBufferAttribute(nr,Math.min(1,ns-1)).dot(p0.sub(C[0]))<0){for(let i=0;i<idx.length;i+=3){const s=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=s;}g.setIndex(idx);g.computeVertexNormals();}
 if(o.double){}return g;}
// darken vertex colours toward the ground (cheap baked AO / grime) between y0 and y1
export function vgrime(g,y0,y1,lo=.55){const p=g.attributes.position,c=g.attributes.color;for(let i=0;i<p.count;i++){const k=lerp(lo,1,smooth(y0,y1,p.getY(i)));c.setXYZ(i,c.getX(i)*k,c.getY(i)*k,c.getZ(i)*k);}c.needsUpdate=true;return g;}
// cheap per-vertex colour noise (breaks up flat colour on merged props)
export function vnoise(g,amt=.12,f=.7,seed=3){const p=g.attributes.position,c=g.attributes.color,r=rng(seed);const ph=[r()*9,r()*9,r()*9];for(let i=0;i<p.count;i++){const x=p.getX(i)*f,y=p.getY(i)*f,z=p.getZ(i)*f,k=1+amt*(Math.sin(x*1.7+ph[0]+Math.sin(z*1.3))*.5+Math.sin(y*2.3+ph[1]+x)*.3+Math.sin(z*3.1+ph[2])*.2);c.setXYZ(i,c.getX(i)*k,c.getY(i)*k,c.getZ(i)*k);}c.needsUpdate=true;return g;}
