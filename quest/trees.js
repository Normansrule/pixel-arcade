// WILD QUEST — vegetation models (branching broadleaf trees, card conifers, bushes, layered cliff outcrops) and Scatter:
// a camera-driven instancing system that culls every instance against the view frustum and swaps near (detailed, shadow
// casting) and far (cheap) LODs, so thousands of trees cost a fixed handful of draw calls.
import * as THREE from '../vendor/three.module.min.js';
import {noise2,mulberry} from './terrain.js';
const V=THREE.Vector3;
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};

/* ---------- small geometry helpers ---------- */
// tapered tube through pts with radii; uv u around, v along length
export function tube(pts,radii,rad=6,vScale=.5){const n=pts.length,pos=[],nor=[],uv=[],idx=[];let len=0;const T=new V(),Nn=new V(),B=new V(),ref=new V(),tmp=new V();
 let prevN=null;for(let i=0;i<n;i++){if(i)len+=pts[i].distanceTo(pts[i-1]);T.copy(pts[Math.min(n-1,i+1)]).sub(pts[Math.max(0,i-1)]).normalize();
  if(!prevN){ref.set(0,0,1);if(Math.abs(T.dot(ref))>.9)ref.set(1,0,0);Nn.crossVectors(T,ref).normalize();}else{Nn.copy(prevN).addScaledVector(T,-prevN.dot(T)).normalize();}prevN=Nn.clone();B.crossVectors(T,Nn);
  for(let k=0;k<=rad;k++){const a=k/rad*Math.PI*2;tmp.copy(Nn).multiplyScalar(Math.cos(a)).addScaledVector(B,Math.sin(a));const r=radii[i];pos.push(pts[i].x+tmp.x*r,pts[i].y+tmp.y*r,pts[i].z+tmp.z*r);nor.push(tmp.x,tmp.y,tmp.z);uv.push(k/rad*Math.max(1,Math.round(r*8)),len*vScale);}}
 for(let i=0;i<n-1;i++)for(let k=0;k<rad;k++){const a=i*(rad+1)+k,b=a+rad+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;}
export function mergeAll(list,withColor=true){// list of geometries (any index), keeps position/normal/uv/color
 const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;for(const g of gs)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),UV=new Float32Array(n*2),Cc=new Float32Array(n*3).fill(1);let o=0;
 for(const g of gs){const c=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)UV.set(g.attributes.uv.array,o*2);if(g.attributes.color)Cc.set(g.attributes.color.array,o*3);o+=c;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(P,3));r.setAttribute('normal',new THREE.BufferAttribute(N,3));r.setAttribute('uv',new THREE.BufferAttribute(UV,2));if(withColor)r.setAttribute('color',new THREE.BufferAttribute(Cc,3));r.computeBoundingSphere();return r;}
function paint(g,f){const p=g.attributes.position,n=g.attributes.normal,c=new Float32Array(p.count*3),col=new THREE.Color();for(let i=0;i<p.count;i++){f(col,p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i));c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b;}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;}
function setUV(g,u,v){const a=new Float32Array(g.attributes.position.count*2);for(let i=0;i<a.length;i+=2){a[i]=u;a[i+1]=v;}g.setAttribute('uv',new THREE.BufferAttribute(a,2));return g;}
function lumpy(r,detail,amp,seed){const g=new THREE.IcosahedronGeometry(r,detail);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const k=1+noise2(x*1.7+seed,z*1.7+y*.9)*amp;p.setXYZ(i,x*k,y*k,z*k);}
 const ng=g.toNonIndexed();ng.computeVertexNormals();// smooth normals by welded position
 const pp=ng.attributes.position,nn=ng.attributes.normal,m=new Map(),key=i=>(pp.getX(i)*1e3|0)+','+(pp.getY(i)*1e3|0)+','+(pp.getZ(i)*1e3|0);for(let i=0;i<pp.count;i++){const k=key(i),a=m.get(k)||[0,0,0];a[0]+=nn.getX(i);a[1]+=nn.getY(i);a[2]+=nn.getZ(i);m.set(k,a);}
 for(let i=0;i<pp.count;i++){const a=m.get(key(i)),l=Math.hypot(...a)||1;nn.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}return ng;}
// leaf card (quad, optionally bent) centred at c, facing roughly `face`, normals bent outward from the crown centre
const SOLID=[.045,.955];
function card(c,face,size,r,crown,squash=1.25,uv0=.1){const g=new THREE.PlaneGeometry(size,size,1,1);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){uv.setX(i,uv0+uv.getX(i)*(1-uv0));uv.setY(i,uv0+uv.getY(i)*(1-uv0));}
 const q=new THREE.Quaternion().setFromUnitVectors(new V(0,0,1),face.clone().normalize());q.multiply(new THREE.Quaternion().setFromAxisAngle(new V(0,0,1),r()*6.28));g.applyQuaternion(q);g.translate(c.x,c.y,c.z);
 const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const v=new V(p.getX(i)-crown.x,(p.getY(i)-crown.y)*squash,p.getZ(i)-crown.z).normalize();v.y+=.3;v.normalize();n.setXYZ(i,v.x,v.y,v.z);}return g;}

/* ---------- broadleaf tree: recursive limbs, leaf clusters at the twig ends ---------- */
export function broadleaf(seed,variant=0){const r=mulberry(seed);const wood=[],leaves=[],tips=[];
 const grow=(start,dir,len,r0,depth,maxD)=>{const pts=[start.clone()],rad=[r0];const segs=depth?4:6;let p=start.clone(),d=dir.clone();
  for(let i=1;i<=segs;i++){d.x+=(r()-.5)*.35;d.z+=(r()-.5)*.35;d.y+=variant===1?.06:.03;d.normalize();p=p.clone().addScaledVector(d,len/segs);pts.push(p);rad.push(r0*(1-i/segs*.62));}
  if(depth===0){for(let i=0;i<2;i++){/* root flare */}rad[0]*=1.55;rad[1]*=1.15;}
  wood.push(tube(pts,rad,depth?5:8,.45));
  if(depth<maxD){const k=depth===0?(variant===1?5:4):depth===1?(variant===1?2:3):2;for(let i=0;i<k;i++){const t=depth===0?(variant===1?.45+i/k*.5:.62+r()*.3):.35+r()*.6;const at=Math.min(pts.length-1,Math.round(t*segs));
    const a=i/k*6.283+r()*1.2,up=depth===0?(variant===1?.55:.75):.55;const nd=new V(Math.cos(a),0,Math.sin(a)).multiplyScalar(Math.sqrt(1-up*up)).add(new V(0,up,0)).lerp(d,.25).normalize();
    grow(pts[at],nd,len*(depth===0?(variant===1?.5:.62):.6)*(.8+r()*.4),rad[at]*.62,depth+1,maxD);}}
  if(depth>=maxD-1)tips.push({p:pts[pts.length-1],d:d.clone(),s:len});};
 const H0=variant===1?3.4:2.4;grow(new V(0,-.3,0),new V((r()-.5)*.12,1,(r()-.5)*.12).normalize(),variant===1?5.6:3.6,variant===1?.26:.34,0,variant===1?2:3);
 // crown centre for normal bending / AO
 const crown=new V();tips.forEach(t=>crown.add(t.p));crown.divideScalar(tips.length);let cr=0;tips.forEach(t=>cr=Math.max(cr,t.p.distanceTo(crown)));cr+=1.2;
 const big=tips.length>14;for(const t of tips){const rc=(variant===1?.95:big?.95:1.25)*(.85+r()*.35);const cc=t.p.clone().addScaledVector(t.d,rc*.3);leaves.push(setUV(lumpy(rc*.42,0,.25,seed+tips.indexOf(t)),...SOLID).translate(cc.x,cc.y,cc.z));
  const nC=variant===1?8:big?7:10;for(let k=0;k<nC;k++){const u=r()*2-1,ph=r()*6.283,rr=Math.sqrt(1-u*u);const dir=new V(rr*Math.cos(ph),u*.7+.25,rr*Math.sin(ph)).normalize();const out=cc.clone().sub(crown).normalize();
   const face=dir.clone().lerp(out,.35).normalize();leaves.push(card(cc.clone().addScaledVector(dir,rc*.7),face,rc*1.7,r,crown));}}
 const lg=paint(mergeAll(leaves,false),(c,x,y,z)=>{const o=Math.min(1,new V(x-crown.x,(y-crown.y)*1.2,z-crown.z).length()/cr);const top=ss(crown.y-cr*.6,crown.y+cr*.8,y);c.setRGB(.4+.3*top,.5+.3*top,.27+.1*top).multiplyScalar(.32+.8*o*o);});
 const wg=paint(mergeAll(wood,false),(c,x,y)=>{c.setRGB(1,1,1).multiplyScalar(.55+.45*ss(-.3,2.5,y));});
 // far LOD: a few lumpy crown masses + a stub trunk, everything in the leaf atlas solid block
 const far=[];const ft=new THREE.CylinderGeometry(.16,.3,H0+1,5);ft.translate(0,(H0+1)/2-.3,0);paint(setUV(ft,...SOLID),c=>c.setRGB(.18,.13,.09));far.push(ft);
 const groups=Math.min(5,tips.length);for(let i=0;i<groups;i++){const t=tips[Math.floor(i/groups*tips.length)];const b=lumpy(cr*.48,1,.22,seed*3+i);b.translate((t.p.x+crown.x)/2,(t.p.y+crown.y)/2+.2,(t.p.z+crown.z)/2);
  paint(setUV(b,...SOLID),(c,x,y,z,nx,ny)=>{const top=ss(crown.y-cr,crown.y+cr,y);c.setRGB(.26+.2*top,.4+.25*top,.17+.07*top).multiplyScalar(.6+.4*(ny*.5+.5));});far.push(b);}
 const fg=mergeAll(far);const height=crown.y+cr*.9;return{wood:wg,leaves:lg,far:fg,radius:Math.max(cr+1,height*.55),height,crownY:crown.y};}

/* ---------- conifer: tapered trunk + whorls of drooping needle-spray cards ---------- */
export function conifer(seed){const r=mulberry(seed);const H=11,cards=[],wood=[];
 const tp=[],tr=[];for(let i=0;i<=8;i++){const t=i/8;tp.push(new V(Math.sin(t*3+seed)*.05,t*H-.3,Math.cos(t*2+seed)*.05));tr.push(.3*(1-t*.92)+(i===0?.12:0));}wood.push(tube(tp,tr,7,.4));
 const crown=new V(0,H*.45,0);const W=13;for(let w=0;w<W;w++){const t=w/(W-1),y=1.9+t*(H-2.4)+(r()-.5)*.3,L0=(2.8*(1-t)+.5)*(.85+r()*.3),n=t>.8?4:6+(r()*3|0);
  for(let k=0;k<n;k++){const a=k/n*6.283+w*.9+r()*.7;const dx=Math.cos(a),dz=Math.sin(a);const L=L0*(.7+r()*.5),dr=.7+r()*.6;// bent strip of 3 segments drooping then curling up at the tip
   const g=new THREE.PlaneGeometry(L*.62,L,1,3);const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++){const s=(p.getY(i)/L)+.5;// 0 at trunk .. 1 at tip
     const along=s*L,side=p.getX(i);const droop=(-along*.28-s*s*L*.22+s*s*s*L*.18)*dr;const px=dx*along-dz*side,pz=dz*along+dx*side;p.setXYZ(i,px,y+droop+(side*side)*-.12,pz);uv.setXY(i,.1+(uv.getX(i))*.9,1-s*.92);}
   g.computeVertexNormals();const nn=g.attributes.normal;for(let i=0;i<p.count;i++){const v=new V(p.getX(i),(p.getY(i)-crown.y)*.35+1.6,p.getZ(i)).normalize();nn.setXYZ(i,v.x,v.y,v.z);}cards.push(g);}}
 // inner shading cones so the silhouette never shows daylight through the middle
 for(let i=0;i<3;i++){const t=i/3,c=new THREE.ConeGeometry(1.15*(1-t*.75),H*.34,6,1,true);c.translate(0,2.6+t*H*.25+H*.17,0);cards.push(setUV(c,.05,.97));}
 const cg=paint(mergeAll(cards,false),(c,x,y,z)=>{const rr=Math.hypot(x,z),maxR=2.9*(1-(y-1.9)/(H-1.9))+.5;const o=Math.min(1,rr/Math.max(.5,maxR));const top=ss(2,H,y);c.setRGB(.4+.2*top,.52+.25*top,.36+.08*top).multiplyScalar(.35+.8*o);});
 const wg=paint(mergeAll(wood,false),(c,x,y)=>c.setRGB(.8,.75,.7).multiplyScalar(.6+.4*ss(0,4,y)));
 const far=[];for(let i=0;i<3;i++){const t=i/3,c=new THREE.ConeGeometry(2.9*(1-t*.62),H*.42,7);c.translate(0,2.2+t*H*.27+H*.21,0);paint(setUV(c,.05,.97),(cc,x,y,z,nx,ny)=>cc.setRGB(.2,.3,.18).multiplyScalar(.55+.5*(ny*.5+.5)));far.push(c);}
 const ft=new THREE.CylinderGeometry(.1,.3,2.4,5);ft.translate(0,.9,0);paint(setUV(ft,.05,.97),c=>c.setRGB(.14,.1,.07));far.push(ft);
 return{wood:wg,leaves:cg,far:mergeAll(far),radius:H*.6,height:H};}

/* ---------- bush: three lumps of leaf cards ---------- */
export function bush(seed){const r=mulberry(seed),L=[];const crown=new V(0,.35,0);
 [[0,.5,0,1.1],[.7,.42,.3,.85],[-.6,.36,-.2,.75],[.1,.3,-.7,.7]].forEach(([x,y,z,s],i)=>{const c=new V(x,y,z);L.push(setUV(lumpy(s*.6,0,.25,seed+i*3),...SOLID).translate(x,y,z));for(let k=0;k<8;k++){const a=r()*6.28,u=r()*.9;const d=new V(Math.cos(a)*(1-u*.4),u*.7+.15,Math.sin(a)*(1-u*.4)).normalize();L.push(card(c.clone().addScaledVector(d,s*.55),d,s*1.15,r,crown,1));}});
 return paint(mergeAll(L,false),(c,x,y,z)=>{const o=Math.min(1,Math.hypot(x,(y-.3)*1.3,z)/1.6);c.setRGB(.32,.46,.22).multiplyScalar(.45+.75*o*ss(-.2,1.2,y+.4));});}

/* ---------- cliff outcrop: stacked, stepped strata slabs (instanced on steep slopes, oriented into the face) ---------- */
export function outcrop(seed){const r=mulberry(seed),L=[];let y=-.6,back=0;const n=3+(r()*2|0);for(let i=0;i<n;i++){const h=.45+r()*.5,w=1.6+r()*1.4,d=1.1+r()*.8;
  const g=lumpy(1,1,.18,seed*7+i);{const pp=g.attributes.position;for(let q=0;q<pp.count;q++){if(pp.getY(q)>.55)pp.setY(q,.55+(pp.getY(q)-.55)*.2);if(pp.getY(q)<-.6)pp.setY(q,-.6);}g.computeVertexNormals();}g.scale(w,h,d);g.rotateY((r()-.5)*.4);g.translate((r()-.5)*.6,y+h*.5,back);L.push(g);y+=h*1.15;back-=.25+r()*.35;}
 const g=mergeAll(L);paint(g,(c,x,yy,z,nx,ny)=>c.setRGB(.62,.58,.54));return g;}

/* ---------- Scatter: per-instance frustum culling + near/far LOD with fixed draw calls ---------- */
const _f=new THREE.Frustum(),_m=new THREE.Matrix4(),_s=new THREE.Sphere();
export class Scatter{
 // parts: [{geo,mat,shadow}] drawn near; far: {geo,mat} or null; items: [[x,y,z,scale,rotY]]; o:{radius,nearD:[l,m,h],farD:[l,m,h],tint:fn(i)->Color,shadowD}
 constructor(scene,parts,far,items,o={}){this.items=items;this.n=items.length;this.o=o;this.R=o.radius||4;this.q=2;
  const n=this.n;this.mats=new Float32Array(n*16);this.cols=new Float32Array(n*3).fill(1);const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color();
  items.forEach((t,i)=>{m4.compose(new V(t[0],t[1],t[2]),q.setFromEuler(e.set(t[5]||0,t[4]||0,t[6]||0)),new V(t[3],t[3]*(t[7]??1),t[3]));m4.toArray(this.mats,i*16);if(o.tint){o.tint(i,c);this.cols[i*3]=c.r;this.cols[i*3+1]=c.g;this.cols[i*3+2]=c.b;}});
  const mk=(list)=>{const im=new THREE.InstancedBufferAttribute(new Float32Array(n*16),16).setUsage(THREE.DynamicDrawUsage),ic=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3).setUsage(THREE.DynamicDrawUsage);
   const meshes=list.map(p=>{const m=new THREE.InstancedMesh(p.geo,p.mat,n);m.instanceMatrix=im;m.instanceColor=ic;m.count=0;m.frustumCulled=false;m.castShadow=!!p.shadow;m.receiveShadow=true;scene.add(m);return m;});return{im,ic,meshes};};
  this.near=mk(parts);this.far=far?mk([far]):null;this.last=new V(1e9,0,0);this.lastDir=new V();this.t=0;this.nearCount=0;this.farCount=0;}
 setQuality(q){this.q=q;this.last.set(1e9,0,0);}
 update(cam,dt,force,focus){this.t-=dt;const dir=cam.getWorldDirection(_s.center);const moved=cam.position.distanceToSquared(this.last)>4||this.lastDir.dot(dir)<.995;if(!force&&!(moved||this.t<=0))return;
  this.t=.5;this.last.copy(cam.position);this.lastDir.copy(dir);
  _m.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);_f.setFromProjectionMatrix(_m);
  const o=this.o,q=this.q,nd=o.nearD[q],fd=this.far?o.farD[q]:nd,nd2=nd*nd,fd2=fd*fd,sd=o.shadowD??30,sd2=sd*sd,cx=cam.position.x,cz=cam.position.z,fx=focus?focus.x:cx,fz=focus?focus.z:cz;
  const N=this.near,F=this.far,M=this.mats,C=this.cols;let a=0,b=0;
  for(let i=0;i<this.n;i++){const t=this.items[i];const dx=t[0]-cx,dz=t[2]-cz,d2=dx*dx+dz*dz;if(d2>fd2)continue;const rr=this.R*t[3];
   let vis=true;_s.center.set(t[0],t[1]+rr*.5,t[2]);_s.radius=rr;vis=_f.intersectsSphere(_s);
   if(d2<nd2){const ex=t[0]-fx,ez=t[2]-fz;if(vis||(ex*ex+ez*ez<sd2&&N.meshes.some(m=>m.castShadow))){N.im.array.set(M.subarray(i*16,i*16+16),a*16);N.ic.array[a*3]=C[i*3];N.ic.array[a*3+1]=C[i*3+1];N.ic.array[a*3+2]=C[i*3+2];a++;}}
   else if(vis&&F){F.im.array.set(M.subarray(i*16,i*16+16),b*16);F.ic.array[b*3]=C[i*3];F.ic.array[b*3+1]=C[i*3+1];F.ic.array[b*3+2]=C[i*3+2];b++;}}
  this.vis=this.vis??true;for(const m of N.meshes){m.count=a;m.visible=this.vis&&a>0;}N.im.needsUpdate=N.ic.needsUpdate=true;if(F){F.meshes[0].count=b;F.meshes[0].visible=this.vis&&b>0;F.im.needsUpdate=F.ic.needsUpdate=true;}
  this.nearCount=a;this.farCount=b;}
 set visible(v){this.vis=v;for(const m of this.near.meshes)m.visible=v&&m.count>0;if(this.far)this.far.meshes[0].visible=v&&this.far.meshes[0].count>0;}}
