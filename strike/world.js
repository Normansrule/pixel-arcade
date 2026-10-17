// STRIKE ZONE — scene construction: merged PBR level geometry with baked vertex lighting (ambient occlusion, sky visibility,
// lamp bounce), mood lighting + shadows, procedural sky dome, distant backdrops, props, decor and animated set pieces.
import * as THREE from '../vendor/three.module.min.js';
import {surf,fxTex,signTex} from './tex.js';
const V=THREE.Vector3,R=Math.random;

export const MOODS={
 dusk:{sky:{top:0x24203c,hor:0xf08848,gnd:0x2a2422,sun:[-.78,.2,.42],sunCol:0xffa060,clouds:.7,cloudCol:0x6a4a58,stars:0},hemi:[0x9aa0c8,0x5a4a40,1.25],sun:[0xffb070,2.7],fog:[0x6a5a5c,.0085],exp:1.05,bloom:.42,thr:.86,sat:1.08,tint:0xfff0e4,env:.9,amb:.45},
 night:{sky:{top:0x05060f,hor:0x2a1c48,gnd:0x0a0812,sun:[.35,.55,-.6],sunCol:0x9ab4ff,clouds:.35,cloudCol:0x2a2840,stars:1},hemi:[0x7484c8,0x3a2440,1.5],sun:[0xb0c4ff,1.9],fog:[0x1a1630,.0095],exp:1.4,bloom:.75,thr:.72,sat:1.12,tint:0xeef0ff,env:1.1,amb:.62,lamp:1.8},
 noon:{sky:{top:0x2c6cc8,hor:0xcfe0ee,gnd:0xb8a888,sun:[.42,.82,.38],sunCol:0xfff2d8,clouds:.32,cloudCol:0xffffff,stars:0},hemi:[0xc0d6ff,0xa08a68,.85],sun:[0xfff2dc,3.3],fog:[0xd8dce0,.0048],exp:.92,bloom:.28,thr:.94,sat:1.1,tint:0xfff6ec,env:1,amb:.42}};

/* ---------- geometry builder ---------- */
class GB{constructor(){this.p=[];this.n=[];this.uv=[];this.c=[];this.i=[];}
 quad(a,b,c,d,n,ua,ub,uc,ud,ca,cb,cc,cd){const k=this.p.length/3;this.p.push(...a,...b,...c,...d);for(let q=0;q<4;q++)this.n.push(n[0],n[1],n[2]);this.uv.push(...ua,...ub,...uc,...ud);this.c.push(...ca,...cb,...cc,...cd);this.i.push(k,k+1,k+2,k,k+2,k+3);}
 geo(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setIndex(this.i);g.computeBoundingSphere();return g;}
 get empty(){return!this.p.length;}}
// merge many (geometry, matrix) into one non-indexed geometry with optional vertex colours
export function mergeGeos(list,withColor=false){let n=0;const parts=[];for(const[g0,m,col]of list){const g=g0.index?g0.toNonIndexed():g0.clone();if(m)g.applyMatrix4(m);parts.push([g,col]);n+=g.attributes.position.count;}
 const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2),C=withColor?new Float32Array(n*3):null;let o=0;
 for(const[g,col]of parts){const c=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)U.set(g.attributes.uv.array,o*2);if(C){const cc=col||[1,1,1];for(let i=0;i<c;i++)C.set(cc,(o+i)*3);}o+=c;g.dispose();}
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.BufferAttribute(P,3));G.setAttribute('normal',new THREE.BufferAttribute(N,3));G.setAttribute('uv',new THREE.BufferAttribute(U,2));if(C)G.setAttribute('color',new THREE.BufferAttribute(C,3));G.computeBoundingSphere();return G;}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));

/* ---------- materials ---------- */
const MATC={};
function pbr(key,o={}){const k=key+(o.tag||'');if(MATC[k])return MATC[k];const s=surf(key);const m=new THREE.MeshStandardMaterial({map:s.map,normalMap:s.normalMap,roughnessMap:s.roughnessMap,roughness:o.r??1,metalness:o.m??s.metal,vertexColors:o.vc!==false,color:o.col??0xffffff,envMapIntensity:(o.env??1)*s.env});m.normalScale.set(s.nsc,s.nsc);MATC[k]=m;return m;}
const std=o=>new THREE.MeshStandardMaterial(o);

/* ---------- sky ---------- */
function makeSky(o,big=480){const g=new THREE.SphereGeometry(big,32,16);const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{top:{value:new THREE.Color(o.top)},hor:{value:new THREE.Color(o.hor)},gnd:{value:new THREE.Color(o.gnd)},sunDir:{value:new V(...o.sun).normalize()},sunCol:{value:new THREE.Color(o.sunCol)},cl:{value:o.clouds},clc:{value:new THREE.Color(o.cloudCol)},time:{value:0},stars:{value:o.stars}},
 vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform vec3 top,hor,gnd,sunCol,clc,sunDir;uniform float cl,time,stars;varying vec3 vD;
 float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
 void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=mix(hor,top,pow(clamp(h,0.,1.),.45));c=mix(c,gnd,smoothstep(0.,-.1,h));
  float s=max(dot(d,sunDir),0.);c+=sunCol*(pow(s,1200.)*(stars>.5?3.:16.)+pow(s,14.)*.35+pow(s,3.)*.14);
  if(stars>.5&&h>0.){vec2 q=d.xz/(h+.3)*90.;float st=step(.9965,h2(floor(q)))*smoothstep(.0,.25,h);c+=vec3(.9,.95,1.)*st*(.5+.5*sin(time*2.+h2(floor(q))*40.));}
  if(cl>0.&&h>0.){vec2 p=d.xz/(h+.12)*.9+vec2(time*.004,time*.002);float n=fbm(p*1.3);float k=smoothstep(.5-cl*.25,.95,n)*smoothstep(0.,.2,h)*min(1.,cl*1.2);vec3 cc=clc*(.7+.5*n)+sunCol*pow(s,4.)*.6;c=mix(c,cc,k);}
  gl_FragColor=vec4(c,1.);}`});const s=new THREE.Mesh(g,m);s.renderOrder=-10;s.frustumCulled=false;return s;}
function envFor(M,renderer){const s=new THREE.Scene();const sk=makeSky(M.sky,9);sk.material=sk.material.clone();s.add(sk);const sun=new THREE.Mesh(new THREE.SphereGeometry(.6,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(M.sky.sunCol).multiplyScalar(8)}));sun.position.copy(new V(...M.sky.sun).normalize().multiplyScalar(7));s.add(sun);
 const g=new THREE.Mesh(new THREE.CircleGeometry(9,24),new THREE.MeshBasicMaterial({color:new THREE.Color(M.sky.gnd).multiplyScalar(.6)}));g.rotation.x=-Math.PI/2;g.position.y=-1;s.add(g);
 for(let k=0;k<5;k++){const pl=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.9),new THREE.MeshBasicMaterial({color:new THREE.Color(M.sky.hor).multiplyScalar(2.2),side:THREE.DoubleSide}));const a=k/5*Math.PI*2;pl.position.set(Math.cos(a)*7,1.5,Math.sin(a)*7);pl.lookAt(0,0,0);s.add(pl);}
 const pm=new THREE.PMREMGenerator(renderer);const t=pm.fromScene(s,.02).texture;pm.dispose();return t;}

/* ---------- baked vertex lighting ---------- */
function lighter(L,M){const cache=new Map();const lamps=L.lights.filter(l=>l.bake).map(l=>({...l,c:new THREE.Color(l.col)}));const amb=M.amb;
 return(x,y,z,nx,ny,nz,tint)=>{const key=((x*4)|0)+','+((y*4)|0)+','+((z*4)|0)+','+nx+ny+nz;let v=cache.get(key);
  if(!v){const ao=L.occlusion(x,y,z,nx,ny,nz),sky=L.skyVis(x,y,z,nx,ny,nz);const base=Math.pow(ao,1.25)*(amb+(1-amb)*Math.pow(sky,.85));let r=base,g=base,b=base;
   for(const l of lamps){const dx=l.x-x,dy=l.y-y,dz=l.z-z,d=Math.hypot(dx,dy,dz);if(d>l.dist||d<.01)continue;const ndl=(dx*nx+dy*ny+dz*nz)/d;if(ndl<=0)continue;if(!L.lineFree(x+nx*.3,y+ny*.3,z+nz*.3,l.x-dx/d*.4,l.y-dy/d*.4,l.z-dz/d*.4))continue;
    const f=Math.pow(1-d/l.dist,2)*(.35+.65*ndl)*l.int*.11*(M.lamp||1);r+=l.c.r*f;g+=l.c.g*f;b+=l.c.b*f;}
   v=[r,g,b];cache.set(key,v);}
  return tint?[v[0]*tint[0],v[1]*tint[1],v[2]*tint[2]]:v;};}

/* ---------- level boxes -> merged meshes ---------- */
const CONT_COL=[[.66,.18,.13],[.13,.32,.58],[.2,.46,.28],[.86,.5,.12],[.55,.56,.58]];
function buildLevel(L,group,M){const lit=lighter(L,M);const gbs={};const gb=k=>gbs[k]||(gbs[k]=new GB());const gy=L.gy;
 const emit=(G,key,ax,sg,fx,a0,a1,b0,b1,box)=>{// face on axis ax (0 x,1 y,2 z) at coordinate fx, spanning a (first other axis) and b (second)
  const s=surf(key).scale;const la=a1-a0,lb=b1-b0;const na=Math.max(1,Math.ceil(la/1.6)),nb=Math.max(1,Math.ceil(lb/1.6));const n=ax===0?[sg,0,0]:ax===1?[0,sg,0]:[0,0,sg];
  let tint=box.tint;if(typeof tint==='number')tint=CONT_COL[tint%CONT_COL.length];
  for(let i=0;i<na;i++)for(let j=0;j<nb;j++){const u0=a0+la*i/na,u1=a0+la*(i+1)/na,v0=b0+lb*j/nb,v1=b0+lb*(j+1)/nb;
   // positions: axis x -> (fx, b, a)?? use a = z (for x faces) / x (for y,z faces); b = y (for x,z faces) / z (for y faces)
   const P=(u,v)=>ax===0?[fx,v,u]:ax===1?[u,fx,v]:[u,v,fx];
   const UV=(u,v)=>{if(box.uvBox){const A=(u-a0)/la,B=(v-b0)/lb;return box.kind==='container'?[A*(la>3?2:1),B]:[A,B];}if(ax===1)return[u/s,-v/s];return[(ax===0?-sg:sg)*u/s,v/s];};
   let p=[P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1)],q=[UV(u0,v0),UV(u1,v0),UV(u1,v1),UV(u0,v1)];
   // winding so the face points along n
   const e1=[p[1][0]-p[0][0],p[1][1]-p[0][1],p[1][2]-p[0][2]],e2=[p[2][0]-p[0][0],p[2][1]-p[0][1],p[2][2]-p[0][2]];const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
   if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0){p=[p[1],p[0],p[3],p[2]];q=[q[1],q[0],q[3],q[2]];}
   const C=p.map(v=>lit(v[0]+n[0]*.02,v[1]+n[1]*.02,v[2]+n[2]*.02,n[0],n[1],n[2],tint));G.quad(p[0],p[1],p[2],p[3],n,q[0],q[1],q[2],q[3],C[0],C[1],C[2],C[3]);}};
 for(const b of L.boxes){if(!b.vis)continue;const k=b.m,kt=b.top||b.m;const G=gb(k),GT=gb(kt);const onFloor=L.ground&&b.y0<=gy+.01;
  for(const sg of[-1,1]){const fx=sg<0?b.x0:b.x1;if(Math.abs(fx-(sg<0?L.X0:L.X1))<.01&&b.kind==='perimeter')continue;emit(G,k,0,sg,fx,b.z0,b.z1,b.y0,b.y1,b);}
  for(const sg of[-1,1]){const fz=sg<0?b.z0:b.z1;if(Math.abs(fz-(sg<0?L.Z0:L.Z1))<.01&&b.kind==='perimeter')continue;emit(G,k,2,sg,fz,b.x0,b.x1,b.y0,b.y1,b);}
  if(!b.noTop)emit(GT,kt,1,1,b.y1,b.x0,b.x1,b.z0,b.z1,b);if(!onFloor&&!b.noBottom)emit(G,k,1,-1,b.y0,b.x0,b.x1,b.z0,b.z1,b);}
 if(L.ground){const G=gb(L.def.floor||'asphalt');const st=2;for(let x=L.X0;x<L.X1;x+=st)for(let z=L.Z0;z<L.Z1;z+=st)emit(G,L.def.floor||'asphalt',1,1,gy,x,Math.min(L.X1,x+st),z,Math.min(L.Z1,z+st),{});}
 const meshes=[];for(const k in gbs){if(gbs[k].empty)continue;const o={};if(k==='container')o.m=.45;const m=new THREE.Mesh(gbs[k].geo(),pbr(k,o));m.castShadow=true;m.receiveShadow=true;m.userData.lv=1;group.add(m);meshes.push(m);}
 return meshes;}

/* ---------- decor ---------- */
function decor(L,group,M,mood,anim,dyn){const D=L.decor;const steel=pbr('steel',{vc:false,tag:'d'}),metal=pbr('metal',{vc:false,tag:'d'}),wood=pbr('wood',{vc:false,tag:'d'}),stone=pbr('stone',{vc:false,tag:'d'}),concrete=pbr('concrete2',{vc:false,tag:'d'});
 const add=(geo,mat,cast=true,recv=true)=>{const m=new THREE.Mesh(geo,mat);m.castShadow=cast;m.receiveShadow=recv;group.add(m);return m;};
 const rails=[],barrels=[[],[]],trees=[],foliage=[];
 for(const d of D){const k=d.k;
  if(k==='rail'){const ax=(d.x1-d.x0)>=(d.z1-d.z0);const len=ax?d.x1-d.x0:d.z1-d.z0,cx=(d.x0+d.x1)/2,cz=(d.z0+d.z1)/2,top=d.y+d.h;
   rails.push([new THREE.CylinderGeometry(.035,.035,len,8),M4(cx,top-.03,cz,0,0,ax?Math.PI/2:0).multiply(ax?new THREE.Matrix4():M4(0,0,0,Math.PI/2))]);rails.push([new THREE.BoxGeometry(ax?len:.03,.03,ax?.03:len),M4(cx,d.y+d.h*.5,cz)]);
   const n=Math.max(1,Math.round(len/1.4));for(let i=0;i<=n;i++){const t=i/n;const x=ax?d.x0+len*t:cx,z=ax?cz:d.z0+len*t;rails.push([new THREE.BoxGeometry(.05,d.h,.05),M4(x,d.y+d.h/2,z)]);}}
  else if(k==='barrel')barrels[d.col?1:0].push(M4(d.x,d.y+.52,d.z,0,R()*6,0));
  else if(k==='furnace'){const lip=add(new THREE.CylinderGeometry(d.s*.42,d.s*.46,.5,24),steel);lip.position.set(d.x,d.y+.2,d.z);
   const lava=new THREE.Mesh(new THREE.CircleGeometry(d.s*.38,32),new THREE.ShaderMaterial({uniforms:{t:{value:0}},vertexShader:'varying vec2 u;void main(){u=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float t;varying vec2 u;float h(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){vec2 p=u*7.;float a=n(p+vec2(t*.3,t*.2))*.6+n(p*2.3-vec2(t*.4,0.))*.4;float c=smoothstep(.25,.85,a);vec3 col=mix(vec3(.6,.08,0.),vec3(4.,1.6,.3),c)+vec3(3.,2.4,1.)*pow(c,6.)*2.;gl_FragColor=vec4(col,1.);}'}));
   lava.rotation.x=-Math.PI/2;lava.position.set(d.x,d.y+.46,d.z);group.add(lava);anim.push(dt=>{lava.material.uniforms.t.value+=dt;});const pl=new THREE.PointLight(0xff7020,14,16,1.6);pl.position.set(d.x,d.y+2,d.z);group.add(pl);dyn.furnace={x:d.x,y:d.y+.5,z:d.z,r:d.s*.36,light:pl};
   const chain=add(new THREE.CylinderGeometry(.06,.06,5.5,6),steel);chain.position.set(d.x+1.6,d.y+4.4,d.z);}
  else if(k==='silo'){const body=add(new THREE.CylinderGeometry(d.r,d.r,d.h,28,4),pbr('metal',{vc:false,tag:'s',col:0xc8ccd2}));body.position.set(d.x,d.h/2,d.z);const cone=add(new THREE.ConeGeometry(d.r*1.02,d.r*.9,28),metal);cone.position.set(d.x,d.h+d.r*.45,d.z);
   for(const y of[2.5,6,9.5]){const r=add(new THREE.TorusGeometry(d.r+.03,.06,6,32),steel);r.rotation.x=Math.PI/2;r.position.set(d.x,y,d.z);}const lad=add(new THREE.BoxGeometry(.5,d.h,.08),steel);lad.position.set(d.x,d.h/2,d.z+d.r+.06);}
  else if(k==='truck'){const red=std({color:0x8a2a1c,roughness:.45,metalness:.5,envMapIntensity:1.2});const cab=add(new THREE.BoxGeometry(2.4,2.2,2),red);cab.position.set(d.x,1.5,d.z-2.2);const win=add(new THREE.BoxGeometry(2.2,.8,.05),pbr('glass',{vc:false,tag:'t'}));win.position.set(d.x,2.1,d.z-3.21);
   const bed=add(new THREE.BoxGeometry(2.4,1.5,4),steel);bed.position.set(d.x,1.6,d.z+.9);for(const[a,b]of[[-1.1,-2.3],[1.1,-2.3],[-1.1,1.6],[1.1,1.6]]){const w=add(new THREE.CylinderGeometry(.48,.48,.35,16),std({color:0x151515,roughness:.9}));w.rotation.z=Math.PI/2;w.position.set(d.x+a,.48,d.z+b);}}
  else if(k==='facade'){const w=d.x1-d.x0,dd=d.z1-d.z0,h=70;const tex=fxTex('windows');const mk=(len)=>{const t=tex.clone();t.needsUpdate=true;t.repeat.set(len/12,h/24);return std({color:0x15161c,roughness:.6,metalness:.4,emissive:0xffffff,emissiveMap:t,emissiveIntensity:1.6});};
   for(const[x,z,ry,len]of[[(d.x0+d.x1)/2,d.z0,Math.PI,w],[(d.x0+d.x1)/2,d.z1,0,w],[d.x0,(d.z0+d.z1)/2,-Math.PI/2,dd],[d.x1,(d.z0+d.z1)/2,Math.PI/2,dd]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(len,h),mk(len));p.position.set(x,d.y-h/2,z);p.rotation.y=ry;group.add(p);}
   const ledge=add(new THREE.BoxGeometry(w+.4,.5,dd+.4),concrete);ledge.position.set((d.x0+d.x1)/2,d.y-.2,(d.z0+d.z1)/2);}
  else if(k==='glass'){const g=new THREE.Mesh(new THREE.PlaneGeometry(d.x1-d.x0,d.y1-d.y0),std({color:0x8cc8ff,roughness:.05,metalness:.9,transparent:true,opacity:.22,envMapIntensity:2,depthWrite:false,side:THREE.DoubleSide}));g.position.set((d.x0+d.x1)/2,(d.y0+d.y1)/2,d.z);group.add(g);}
  else if(k==='tank'){const t=add(new THREE.CylinderGeometry(d.r,d.r,d.h,24,3),pbr('wood',{vc:false,tag:'k',col:0x9a8070}));t.position.set(d.x,d.y+d.h/2,d.z);const c=add(new THREE.ConeGeometry(d.r*1.05,1.2,24),steel);c.position.set(d.x,d.y+d.h+.6,d.z);for(const y of[.8,2.2,3.6]){const r=add(new THREE.TorusGeometry(d.r+.02,.05,6,28),steel);r.rotation.x=Math.PI/2;r.position.set(d.x,d.y+y,d.z);}}
  else if(k==='hvac'){const top=add(new THREE.CylinderGeometry(Math.min(d.w,d.d)*.34,Math.min(d.w,d.d)*.34,.08,20),std({color:0x1a1c20,roughness:.6,metalness:.6}));top.position.set(d.x,1.64,d.z);const fan=add(new THREE.BoxGeometry(Math.min(d.w,d.d)*.6,.04,.1),steel);fan.position.set(d.x,1.66,d.z);anim.push(dt=>{fan.rotation.y+=dt*9;});
   const pipe=add(new THREE.CylinderGeometry(.18,.18,1.2,10),metal);pipe.position.set(d.x+d.w*.3,2.1,d.z);}
  else if(k==='helipad'){const p=new THREE.Mesh(new THREE.PlaneGeometry(13,13),std({map:fxTex('helipad'),transparent:true,depthWrite:false,roughness:.8,polygonOffset:true,polygonOffsetFactor:-2}));p.rotation.x=-Math.PI/2;p.position.set(d.x,d.y+.01,d.z);p.receiveShadow=true;group.add(p);
   const lights=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2;const b=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(.4,2.4,1)}));b.position.set(d.x+Math.cos(a)*6.9,d.y+.05,d.z+Math.sin(a)*6.9);group.add(b);lights.push(b);}
   anim.push((dt,t)=>{lights.forEach((b,i)=>{const on=((t*8|0)%16)===i;b.material.color.setRGB(on?3:.3,on?3:2.2,on?3:.9);});});}
  else if(k==='billboard'){const g=new THREE.Group();g.position.set(d.x,d.y,d.z);g.rotation.y=d.face>0?Math.PI/2:-Math.PI/2;group.add(g);const word=d.col===0xff3d8a?'NOVA·24':'HYPERLINE';
   const sign=new THREE.Mesh(new THREE.PlaneGeometry(d.w,d.h),new THREE.MeshBasicMaterial({map:signTex(word,d.col),color:new THREE.Color(1.6,1.6,1.6)}));sign.position.y=d.h/2+1.4;g.add(sign);
   const frame=new THREE.Mesh(new THREE.BoxGeometry(d.w+.4,d.h+.4,.3),steel);frame.position.set(0,d.h/2+1.4,-.2);g.add(frame);for(const x of[-d.w*.35,d.w*.35]){const p=new THREE.Mesh(new THREE.BoxGeometry(.3,1.6,.3),steel);p.position.set(x,.8,-.2);g.add(p);}
   anim.push((dt,t)=>{const f=.85+.15*Math.sin(t*3.1)+(R()<.01?-.5:0);sign.material.color.setScalar(1.6*f);});}
  else if(k==='city'){buildCity(group,L,anim);}
  else if(k==='gable'){const w=d.x1-d.x0,dd=d.z1-d.z0,ax=d.ax==='x';const span=ax?dd:w,len=ax?w:dd,hh=Math.min(2.6,span*.32);const rm=pbr('roof',{vc:false,tag:'r'+d.col,col:d.col?new THREE.Color(d.col).lerp(new THREE.Color(0xffffff),.55).multiplyScalar(1.15):0xffffff});
   const slope=Math.hypot(span/2,hh),ang=Math.atan2(hh,span/2);const geo=new THREE.BoxGeometry(len,.12,slope+.2);const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*len/2,uv.getY(i)*slope/2);
   for(const s of[-1,1]){const m=add(geo,rm);if(ax){m.rotation.set(s*ang,0,0);m.position.set((d.x0+d.x1)/2,d.y+hh/2,(d.z0+d.z1)/2+s*span/4);}else{m.rotation.set(0,Math.PI/2,0);m.rotateX(s*ang);m.position.set((d.x0+d.x1)/2+s*span/4,d.y+hh/2,(d.z0+d.z1)/2);}}
   const tri=new THREE.Shape();tri.moveTo(-span/2+.3,0);tri.lineTo(span/2-.3,0);tri.lineTo(0,hh-.08);const tg=new THREE.ShapeGeometry(tri);const pm=pbr('plaster',{vc:false,tag:'g'});for(const s of[-1,1]){const m=add(tg,pm);if(ax){m.rotation.y=s>0?Math.PI/2:-Math.PI/2;m.position.set(s>0?d.x1-.3:d.x0+.3,d.y,(d.z0+d.z1)/2);}else{m.rotation.y=s>0?0:Math.PI;m.position.set((d.x0+d.x1)/2,d.y,s>0?d.z1-.3:d.z0+.3);}}}
  else if(k==='spire'){const c=add(new THREE.ConeGeometry(d.s*.72,4,4),pbr('roof',{vc:false,tag:'sp'}));c.rotation.y=Math.PI/4;c.position.set(d.x,d.y+2,d.z);const ball=add(new THREE.SphereGeometry(.18,10,8),std({color:0xc8a040,metalness:1,roughness:.3}));ball.position.set(d.x,d.y+4.1,d.z);}
  else if(k==='bell'){const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new THREE.Vector2(.18+.55*Math.pow(t,1.6),-t*1.0));}const b=add(new THREE.LatheGeometry(pts,20),std({color:0xa8783a,metalness:1,roughness:.35,side:THREE.DoubleSide}));b.position.set(d.x,d.y,d.z);dyn.bell=b;}
  else if(k==='tree'){trees.push(M4(d.x,d.y+1.5*d.s,d.z,0,R()*6,0,d.s,d.s,d.s));for(let i=0;i<5;i++){const a=R()*6.28,r=.6+R()*.8;foliage.push(M4(d.x+Math.cos(a)*r*d.s,d.y+(2.9+R()*1.2)*d.s,d.z+Math.sin(a)*r*d.s,R()*3,R()*3,0,(1+R()*.5)*d.s,(.8+R()*.4)*d.s,(1+R()*.5)*d.s));}}
  else if(k==='pergola'){const g=[];for(const x of[d.x0,d.x1])for(const z of[d.z0,(d.z0+d.z1)/2,d.z1])g.push([new THREE.BoxGeometry(.22,2.8,.22),M4(x,d.y+1.4,z)]);for(let x=d.x0;x<=d.x1+.01;x+=1)g.push([new THREE.BoxGeometry(.12,.18,d.z1-d.z0+.6),M4(x,d.y+2.85,(d.z0+d.z1)/2)]);
   for(const z of[d.z0,d.z1])g.push([new THREE.BoxGeometry(d.x1-d.x0+.6,.2,.16),M4((d.x0+d.x1)/2,d.y+2.75,z)]);add(mergeGeos(g),wood);for(let i=0;i<10;i++)foliage.push(M4(d.x0+R()*(d.x1-d.x0),d.y+3,d.z0+R()*(d.z1-d.z0),R()*3,R()*3,0,.9,.35,.9));}
  else if(k==='fountain'){const basin=add(new THREE.CylinderGeometry(2.7,2.9,.9,8),stone);basin.position.set(d.x,.45,d.z);basin.rotation.y=Math.PI/8;const water=new THREE.Mesh(new THREE.CylinderGeometry(2.45,2.45,.05,8),std({color:0x2a6070,roughness:.05,metalness:.3,envMapIntensity:1.6,transparent:true,opacity:.85}));water.position.set(d.x,.78,d.z);water.rotation.y=Math.PI/8;group.add(water);
   const col=add(new THREE.CylinderGeometry(.35,.45,2.8,12),stone);col.position.set(d.x,1.4,d.z);const bowl=add(new THREE.CylinderGeometry(.9,.4,.35,16),stone);bowl.position.set(d.x,2.3,d.z);dyn.fountain={x:d.x,y:2.5,z:d.z};}
  else if(k==='awning'){const cv=document.createElement('canvas');cv.width=128;cv.height=16;const x=cv.getContext('2d');const css='#'+new THREE.Color(d.col).getHexString();for(let i=0;i<8;i++){x.fillStyle=i%2?css:'#f4ecd8';x.fillRect(i*16,0,16,16);}const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;
   const cl=new THREE.Mesh(new THREE.PlaneGeometry(d.w,d.d,6,3),std({map:t,roughness:.9,side:THREE.DoubleSide}));const p=cl.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin((p.getX(i)/d.w+.5)*Math.PI*6)*.04);cl.geometry.computeVertexNormals();cl.rotation.x=-Math.PI/2+.25;cl.position.set(d.x,d.y,d.z);cl.castShadow=true;cl.receiveShadow=true;group.add(cl);
   for(const s of[-1,1]){const po=add(new THREE.CylinderGeometry(.05,.05,d.y,6),wood);po.position.set(d.x+s*d.w*.46,d.y/2,d.z+d.d*.42);}}
  else if(k==='cart'){for(const s of[-1,1]){const w=add(new THREE.TorusGeometry(.5,.07,6,14),wood);w.position.set(d.x+s*1.25,.5,d.z);w.rotation.y=Math.PI/2;}const h=add(new THREE.BoxGeometry(.1,.1,2),wood);h.position.set(d.x,.8,d.z+1.8);h.rotation.x=.3;}}
 if(rails.length)add(mergeGeos(rails),steel,true,true);
 const bg=new THREE.CylinderGeometry(.34,.34,1.04,16);bg.translate(0,0,0);[0,1].forEach(c=>{if(!barrels[c].length)return;const m=new THREE.InstancedMesh(bg,std({color:c?0x2a5aa8:0xa83020,roughness:.45,metalness:.6,envMapIntensity:1.2}),barrels[c].length);barrels[c].forEach((x,i)=>m.setMatrixAt(i,x));m.castShadow=m.receiveShadow=true;group.add(m);});
 if(trees.length){const tg=new THREE.CylinderGeometry(.14,.24,3,8);const m=new THREE.InstancedMesh(tg,std({color:0x5a4430,roughness:.9}),trees.length);trees.forEach((x,i)=>m.setMatrixAt(i,x));m.castShadow=true;group.add(m);}
 if(foliage.length){const fg=new THREE.IcosahedronGeometry(1,1);const p=fg.attributes.position;for(let i=0;i<p.count;i++){const v=new V(p.getX(i),p.getY(i),p.getZ(i));v.multiplyScalar(.85+((Math.sin(v.x*7)+Math.sin(v.y*9)+Math.sin(v.z*5))*.06));p.setXYZ(i,v.x,v.y,v.z);}fg.computeVertexNormals();
  const m=new THREE.InstancedMesh(fg,std({color:mood==='noon'?0x5a7a34:0x3a5a2a,roughness:.85,flatShading:true}),foliage.length);foliage.forEach((x,i)=>{m.setMatrixAt(i,x);m.setColorAt(i,new THREE.Color().setHSL(.22+R()*.06,.45,.26+R()*.1));});m.castShadow=true;m.receiveShadow=true;group.add(m);
  anim.push((dt,t)=>{m.rotation.y=0;});}}

function buildCity(group,L,anim){const n=260,geo=new THREE.BoxGeometry(1,1,1);geo.translate(0,.5,0);const tex=fxTex('windows').clone();tex.needsUpdate=true;tex.repeat.set(1,2.5);
 const m=new THREE.InstancedMesh(geo,std({color:0x0e0f16,roughness:.7,metalness:.3,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.95}),n);let k=0;
 for(let i=0;i<n;i++){const a=R()*Math.PI*2,r=60+Math.pow(R(),.7)*260;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<45&&Math.abs(z)<35)continue;const w=10+R()*18,d=10+R()*18,h=30+R()*120*(r<150?1:.7);m.setMatrixAt(k++,M4(x,-70,z,0,R()*.4,0,w,h,d));}m.count=k;group.add(m);
 // the gap between the two towers: a lit street far below
 const st=new THREE.Mesh(new THREE.PlaneGeometry(14,400),new THREE.MeshBasicMaterial({color:new THREE.Color(.5,.32,.12)}));st.rotation.x=-Math.PI/2;st.position.set(0,-68,0);group.add(st);
 const cars=[];const cg=new THREE.SphereGeometry(.4,6,4);const cm=new THREE.InstancedMesh(cg,new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.2,1.4)}),40);for(let i=0;i<40;i++)cars.push({z:(R()-.5)*400,v:(R()<.5?-1:1)*(10+R()*12),x:R()<.5?-3:3});group.add(cm);
 anim.push((dt)=>{cars.forEach((c,i)=>{c.z+=c.v*dt;if(c.z>200)c.z=-200;if(c.z<-200)c.z=200;cm.setMatrixAt(i,M4(c.x+(c.v>0?1.5:-1.5),-67.6,c.z));cm.setColorAt?.(i,c.v>0?new THREE.Color(3,2.4,1.6):new THREE.Color(3,.3,.2));});cm.instanceMatrix.needsUpdate=true;if(cm.instanceColor)cm.instanceColor.needsUpdate=true;});
 const glow=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.MeshBasicMaterial({color:new THREE.Color(.12,.06,.16)}));glow.rotation.x=-Math.PI/2;glow.position.y=-72;group.add(glow);}

function backdrop(group,M,mood,L){// a ring of distant hills / silhouettes tinted by fog
 const seg=96,R0=230,geo=new THREE.BufferGeometry(),P=[],I=[];for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2;const h=(mood==='noon'?28:18)+Math.sin(a*3.1)*10+Math.sin(a*7.3+1)*6+Math.sin(a*13.7)*3;P.push(Math.cos(a)*R0,-8,Math.sin(a)*R0,Math.cos(a)*R0,h,Math.sin(a)*R0);if(i<seg){const k=i*2;I.push(k,k+1,k+2,k+1,k+3,k+2);}}
 geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setIndex(I);geo.computeVertexNormals();const col=new THREE.Color(M.fog[0]).lerp(new THREE.Color(mood==='noon'?0x7a8a6a:0x2a2228),.45);
 const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,fog:false}));group.add(m);
 if(mood==='dusk'){const cm=std({color:0x2a2224,roughness:.9});for(let i=0;i<9;i++){const a=-.6+i*.32+R()*.1,r=110+R()*60;const h=26+R()*30;const c=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2.4,h,10),cm);c.position.set(Math.cos(a)*r,h/2-2,Math.sin(a)*r);group.add(c);}
  const fb=new THREE.Mesh(new THREE.BoxGeometry(60,16,24),cm);fb.position.set(-150,6,40);group.add(fb);const fb2=new THREE.Mesh(new THREE.BoxGeometry(40,22,30),cm);fb2.position.set(120,9,-110);group.add(fb2);}
 if(mood==='noon'){const sea=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),std({color:0x2a5a78,roughness:.15,metalness:.2,envMapIntensity:1.4}));sea.rotation.x=-Math.PI/2;sea.position.y=-16;group.add(sea);
  const hill=std({color:0x8a8a62,roughness:1});for(let i=0;i<26;i++){const a=R()*Math.PI*2,r=60+R()*90;const s=10+R()*22;const h=new THREE.Mesh(new THREE.SphereGeometry(s,10,6,0,Math.PI*2,0,Math.PI/2),hill);h.scale.y=.35+R()*.3;h.position.set(Math.cos(a)*r,-9,Math.sin(a)*r);group.add(h);}
  const town=std({color:0xe8dcc8,roughness:.9});for(let i=0;i<70;i++){const a=R()*Math.PI*2,r=48+R()*70;if(Math.abs(Math.cos(a)*r)<40&&Math.abs(Math.sin(a)*r)<40)continue;const b=new THREE.Mesh(new THREE.BoxGeometry(4+R()*6,3+R()*7,4+R()*6),town);b.position.set(Math.cos(a)*r,-4+R()*3,Math.sin(a)*r);b.rotation.y=R()*3;group.add(b);}}
 if(mood==='dusk'||mood==='noon'){const outer=new THREE.Mesh(new THREE.PlaneGeometry(900,900),std({color:mood==='noon'?0x8c8460:0x2e2a2a,roughness:1}));outer.rotation.x=-Math.PI/2;outer.position.y=-.06;group.add(outer);}}

/* ---------- light fixtures ---------- */
function fixtures(L,group,real,anim,dyn){const glowM=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(3.2)});const steel=pbr('steel',{vc:false,tag:'d'});let nReal=0;
 for(const l of L.lights){if(l.fixture==='ceil'){const p=new THREE.Mesh(new THREE.BoxGeometry(1.2,.06,.5),glowM(l.col));p.position.set(l.x,l.y+.26,l.z);group.add(p);}
  else if(l.fixture==='hang'){const c=new THREE.Mesh(new THREE.ConeGeometry(.45,.4,16,1,true),new THREE.MeshStandardMaterial({color:0x2a2c30,metalness:.7,roughness:.4,side:THREE.DoubleSide}));c.position.set(l.x,l.y+.2,l.z);group.add(c);const b=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),glowM(l.col));b.position.set(l.x,l.y+.05,l.z);group.add(b);
   const w=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,2,4),steel);w.position.set(l.x,l.y+1.4,l.z);group.add(w);}
  else if(l.fixture==='pole'){const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.16,l.y,8),steel);p.position.set(l.x,l.y/2,l.z);p.castShadow=true;group.add(p);const h=new THREE.Mesh(new THREE.BoxGeometry(1.4,.25,.6),steel);h.position.set(l.x,l.y+.1,l.z);group.add(h);const g=new THREE.Mesh(new THREE.BoxGeometry(1.2,.05,.45),glowM(l.col));g.position.set(l.x,l.y-.04,l.z);group.add(g);}
  else if(l.fixture==='wall'){const b=new THREE.Mesh(new THREE.BoxGeometry(.32,.18,.18),glowM(l.col));b.position.set(l.x,l.y,l.z);group.add(b);}
  else if(l.fixture==='strip'){const s=new THREE.Mesh(new THREE.BoxGeometry(11,.05,.12),new THREE.MeshBasicMaterial({color:new THREE.Color(l.col).multiplyScalar(1.4)}));s.position.set(l.x,l.y+.15,l.z);group.add(s);}
  else if(l.fixture==='neon'){const s=new THREE.Mesh(new THREE.TorusGeometry(.6,.05,6,24),glowM(l.col));s.position.set(l.x,l.y,l.z);s.rotation.x=Math.PI/2;group.add(s);anim.push((dt,t)=>{s.material.color.setRGB(...new THREE.Color(l.col).multiplyScalar(2.6+Math.sin(t*5+l.x)*.6).toArray());});}
  if(l.real&&nReal<(dyn.furnace?2:3)){const pl=new THREE.PointLight(l.col,l.int*1.2,l.dist,1.7);pl.position.set(l.x,l.y-.15,l.z);group.add(pl);real.push(pl);nReal++;}}}

/* ---------- jump pads ---------- */
function pads(L,group,anim,col){const out=[];for(const p of L.pads){const g=new THREE.Group();g.position.set(p.x,p.y+.02,p.z);group.add(g);const c=new THREE.Color(col);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.15,.12,24),new THREE.MeshStandardMaterial({color:0x22252a,metalness:.8,roughness:.35}));base.position.y=.06;base.receiveShadow=true;g.add(base);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.85,.06,8,32),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(3)}));ring.rotation.x=Math.PI/2;ring.position.y=.14;g.add(ring);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(.78,32),new THREE.MeshBasicMaterial({map:fxTex('glow'),color:c.clone().multiplyScalar(1.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));disc.rotation.x=-Math.PI/2;disc.position.y=.15;g.add(disc);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.7,.8,2.4,20,1,true),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(.35),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=1.3;g.add(beam);
  const arrow=new THREE.Mesh(new THREE.ConeGeometry(.25,.4,3),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(2)}));arrow.rotation.x=Math.PI/2;const dir=Math.atan2(p.to.x-p.x,p.to.z-p.z);const ag=new THREE.Group();ag.rotation.y=dir;ag.position.y=.3;arrow.position.z=.4;ag.add(arrow);g.add(ag);
  const o={p,g,ring,beam,disc,pulse:0};out.push(o);}
 anim.push((dt,t)=>{for(const o of out){o.pulse=Math.max(0,o.pulse-dt*2);const s=1+o.pulse*.6;o.ring.scale.set(s,s,s);o.beam.material.opacity=1;o.beam.scale.y=1+Math.sin(t*4)*.1+o.pulse;o.disc.material.color.setScalar(1.2+Math.sin(t*6)*.3+o.pulse*2).multiply(new THREE.Color(col));}});return out;}

/* ===================================================================== entry */
export function buildWorld(L,renderer){const mood=L.def.mood,M=MOODS[mood];const group=new THREE.Group();const anim=[],dyn={},real=[];
 const t0=performance.now();const meshes=buildLevel(L,group,M);const tLevel=performance.now()-t0;
 decor(L,group,M,mood,anim,dyn);fixtures(L,group,real,anim,dyn);const padList=pads(L,group,anim,mood==='night'?0x3de0ff:mood==='dusk'?0xffa040:0x40d0ff);
 const sky=makeSky(M.sky);group.add(sky);backdrop(group,M,mood,L);
 const hemi=new THREE.HemisphereLight(M.hemi[0],M.hemi[1],M.hemi[2]);group.add(hemi);
 const sun=new THREE.DirectionalLight(M.sun[0],M.sun[1]);const sd=new V(...M.sky.sun).normalize();const cx=(L.X0+L.X1)/2,cz=(L.Z0+L.Z1)/2,half=Math.max(L.X1-L.X0,L.Z1-L.Z0)/2+4;
 sun.position.set(cx+sd.x*90,sd.y*90+(mood==='dusk'?20:0),cz+sd.z*90);sun.target.position.set(cx,0,cz);group.add(sun,sun.target);sun.castShadow=true;const sc=sun.shadow.camera;sc.left=-half;sc.right=half;sc.top=half;sc.bottom=-half;sc.near=1;sc.far=260;sc.updateProjectionMatrix();sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;
 const fog=new THREE.FogExp2(M.fog[0],M.fog[1]);const env=envFor(M,renderer);
 let time=0;
 return{group,sun,hemi,fog,env,M,mood,pads:padList,real,dyn,meshes,tLevel,
  update(dt){time+=dt;sky.material.uniforms.time.value=time;for(const f of anim)f(dt,time);if(dyn.furnace)dyn.furnace.light.intensity=12+Math.sin(time*7)*1.5+Math.sin(time*13)*1;if(dyn.bell)dyn.bell.rotation.z=Math.sin(time*.8)*.04;}};}
