// LONG SHOT — world builder: sky dome + environment map, warped-grid terrain, shore-aware water, batched static geometry
// with OBB colliders and walkable surfaces, instanced swaying vegetation, wind flags, weather, particles, vehicle models.
import * as THREE from '../vendor/three.module.min.js';
import {textures,labelTex} from './tex.js';
const V=THREE.Vector3;
export const lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>v<a?a:v>b?b:v,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
// ---- value noise ----
export function rng(seed){let s=seed>>>0||1;return()=>(s=(s*1664525+1013904223)>>>0)/4294967296;}
const PERM=(()=>{const r=rng(1234),p=new Uint8Array(512),a=[...Array(256).keys()];for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}for(let i=0;i<512;i++)p[i]=a[i&255];return p;})();
const fade=t=>t*t*t*(t*(t*6-15)+10);
function grad(h,x,y){const g=h&7;const u=g<4?x:y,v=g<4?y:x;return((g&1)?-u:u)+((g&2)?-2*v:2*v);}
export function noise(x,y){const X=Math.floor(x)&255,Y=Math.floor(y)&255;x-=Math.floor(x);y-=Math.floor(y);const u=fade(x),v=fade(y);const a=PERM[X]+Y,b=PERM[X+1]+Y;
 return lerp(lerp(grad(PERM[a],x,y),grad(PERM[b],x-1,y),u),lerp(grad(PERM[a+1],x,y-1),grad(PERM[b+1],x-1,y-1),u),v)*.25;}
export function fbm(x,y,o=5){let s=0,a=.5,f=1;for(let i=0;i<o;i++){s+=a*noise(x*f,y*f);f*=2.03;a*=.5;}return s;}

const SKY_V=`varying vec3 vD;void main(){vD=normalize((modelMatrix*vec4(position,0.)).xyz);vec4 p=projectionMatrix*viewMatrix*vec4((modelMatrix*vec4(position,1.)).xyz,1.);gl_Position=p.xyww;}`;
const SKY_F=`uniform vec3 top,hor,bot,sunDir,sunCol;uniform float sunSize,cloud,night,time,cloudDark;varying vec3 vD;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.07;a*=.5;}return s;}
 void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=y>0.?mix(hor,top,pow(clamp(y,0.,1.),.55)):mix(hor,bot,clamp(-y*4.,0.,1.));
  float sd=max(dot(d,sunDir),0.);c+=sunCol*(pow(sd,8.)*.25+pow(sd,64.)*.5)*(1.-night*.6);c+=sunCol*smoothstep(1.-sunSize,1.-sunSize*.6,sd)*6.;
  if(y>0.&&cloud>0.){vec2 uv=d.xz/(y+.12)*1.6+vec2(time*.004,time*.0015);float cl=smoothstep(.45-cloud*.25,.95,fb(uv));cl*=smoothstep(0.,.25,y);
   vec3 cc=mix(vec3(1.)*mix(1.,.35,cloudDark),hor*.9,.35)+sunCol*pow(sd,6.)*.6;c=mix(c,cc*(1.-night*.85),cl*.9);}
  if(night>0.&&y>0.){vec2 g=d.xz/(y+.3)*260.;float st=step(.996,h(floor(g)))*smoothstep(0.,.3,y);c+=vec3(st)*night*.9;}
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;
const WATER_V=`#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;
#include <logdepthbuf_vertex>
}`;
const WATER_F=`#include <logdepthbuf_pars_fragment>
uniform sampler2D nrm,depth;uniform vec3 deep,shallow,sunDir,sunCol,skyH,skyT,fogC;uniform float time,fogD,dRange,rough,foamOn;uniform vec2 dC;varying vec3 vW;
 void main(){
#include <logdepthbuf_fragment>
 vec2 uv=vW.xz;vec3 n1=texture2D(nrm,uv*.045+vec2(time*.012,time*.008)).xyz*2.-1.;vec3 n2=texture2D(nrm,uv*.11-vec2(time*.017,-time*.011)).xyz*2.-1.;vec3 n3=texture2D(nrm,uv*.007+vec2(time*.003,0.)).xyz*2.-1.;
  vec3 n=normalize(vec3(n1.x+n2.x+n3.x*1.5,6.*rough,n1.y+n2.y+n3.y*1.5));vec3 v=normalize(cameraPosition-vW);float dist=length(cameraPosition-vW);
  float fr=.02+.98*pow(1.-max(dot(n,v),0.),5.);vec3 r=reflect(-v,n);vec3 sky=mix(skyH,skyT,pow(clamp(r.y,0.,1.),.5));
  vec2 duv=(vW.xz-dC)/dRange*.5+.5;float dep=1.;if(duv.x>0.&&duv.x<1.&&duv.y>0.&&duv.y<1.)dep=texture2D(depth,duv).r;
  vec3 body=mix(shallow,deep,smoothstep(0.,.55,dep));vec3 c=mix(body,sky,fr);
  float sp=pow(max(dot(r,sunDir),0.),mix(900.,180.,rough));c+=sunCol*sp*3.;
  float foam=foamOn*(1.-smoothstep(0.,.045,dep))*(.6+.4*sin(time*1.6+vW.x*.7+vW.z*.5+n1.x*4.));c=mix(c,vec3(.92),clamp(foam,0.,1.));
  float fg=1.-exp(-fogD*fogD*dist*dist);c=mix(c,fogC,fg);gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`;

// ======================== World ========================
export class World{
 constructor(scene,R,env){this.scene=scene;this.R=R;this.env=env;this.S=textures();this.batches=new Map();this.cols=[];this.ramps=[];this.grid=new Map();this.cell=16;this.stamp=1;
  this.uTime={value:0};this.uWind=new THREE.Uniform(new THREE.Vector3(1,0,0));this.flags=[];this.objs=[];this.updaters=[];this.mats={};this.waterY=null;this.waters=[];
  this.H=env.height||(()=>0);this.group=new THREE.Group();scene.add(this.group);this.instanced=[];this.plights=[];this.night=env.night||0;}
 // ---------------- materials ----------------
 mat(name){if(this.mats[name])return this.mats[name];const S=this.S,std=o=>new THREE.MeshStandardMaterial(o),n=this.night;let m;
  const tex=(t,o)=>std({map:t.map,normalMap:t.normalMap,roughnessMap:t.roughnessMap||null,...o});
  if(name.startsWith('facade:')){const st=name.slice(7),t=S.facade[st];m=std({map:t.map,normalMap:t.normalMap,roughness:st==='office'?.35:.85,metalness:st==='office'?.35:0,emissiveMap:t.emissiveMap,emissive:new THREE.Color(n?0xffffff:0x000000),emissiveIntensity:n?1.6:0});m.userData.tile=[12,12.8];}
  else switch(name){
   case'stucco':m=tex(S.stucco,{roughness:.92});m.userData.tile=[4,4];break;
   case'terracotta':m=tex(S.terracotta,{roughness:.75});m.userData.tile=[3,3];break;
   case'paving':m=tex(S.paving,{roughness:.8,color:0xffffff});m.userData.tile=[3,3];break;
   case'wood':m=tex(S.wood,{roughness:.7});m.userData.tile=[3,3];break;
   case'concrete':m=tex(S.concrete,{roughness:.9});m.userData.tile=[5,5];break;
   case'concreteD':m=tex(S.concrete,{roughness:.9,color:0x8a8a88});m.userData.tile=[5,5];break;
   case'wetconcrete':m=tex(S.concrete,{roughness:.25,color:0x6a6a6a,metalness:.1});m.userData.tile=[5,5];break;
   case'asphalt':m=tex(S.asphalt,{roughness:n?.25:.85,metalness:n?.2:0});m.userData.tile=[6,6];break;
   case'metal':m=tex(S.metal,{metalness:.6,roughness:.5});m.userData.tile=[3,3];break;
   case'sand':m=tex(S.sand,{color:0xe0c9a0,roughness:1});m.userData.tile=[6,6];break;
   case'rock':m=tex(S.rockd,{color:0x8a8178,roughness:.95});m.userData.tile=[6,6];break;
   case'fabric':m=tex(S.fabric,{roughness:.9});m.userData.tile=[2,2];break;
   case'glass':m=std({color:0x203040,roughness:.05,metalness:.9,envMapIntensity:1.4});break;
   case'pool':m=std({color:0x2ab8d8,roughness:.05,metalness:.2,emissive:0x0a4a5a,emissiveIntensity:n?1:.3});break;
   case'white':m=std({color:0xf2f0ea,roughness:.6});break;
   case'black':m=std({color:0x16171a,roughness:.6});break;
   case'steel':m=std({color:0x8a9098,roughness:.4,metalness:.8});break;
   case'darksteel':m=std({color:0x3a3e44,roughness:.5,metalness:.7});break;
   case'rust':m=tex(S.metal,{color:0xb06030,metalness:.4,roughness:.8});m.userData.tile=[3,3];break;
   case'yellow':m=std({color:0xe8b020,roughness:.5,metalness:.3});break;
   case'red':m=std({color:0xc02a20,roughness:.5,metalness:.2});break;
   case'green':m=std({color:0x3a5a2a,roughness:.8});break;
   case'snow':m=tex(S.detail,{color:0xf4f8ff,roughness:.75});m.userData.tile=[8,8];break;
   case'neon':m=new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true});break;
   case'vcol':m=std({vertexColors:true,roughness:.7});break;
   case'vcolM':m=std({vertexColors:true,roughness:.35,metalness:.55});break;
   case'bulb':m=new THREE.MeshBasicMaterial({color:0xffd9a0});break;
   default:m=std({color:0xaaaaaa});}
  return this.mats[name]=m;}
 // ---------------- batched static geometry ----------------
 batch(mat,cast=true,recv=true){const k=(typeof mat==='string'?mat:mat.uuid)+(cast?'c':'')+(recv?'r':'');let b=this.batches.get(k);if(!b){b={m:typeof mat==='string'?this.mat(mat):mat,cast,recv,pos:[],nor:[],uv:[],col:[],idx:[],n:0};this.batches.set(k,b);}return b;}
 // axis box (optionally rotated about y). y = bottom. mats = one name or {side,top,bottom}
 box(x,y,z,w,h,d,mats,o={}){const ry=o.ry||0,c=Math.cos(ry),s=Math.sin(ry);const M=typeof mats==='string'?{side:mats,top:mats,bottom:mats}:mats;const col=o.col?new THREE.Color(o.col):null;
  const faces=[[[1,0,0],[0,0,-1],[0,1,0],w,d,h,'side'],[[-1,0,0],[0,0,1],[0,1,0],w,d,h,'side'],[[0,1,0],[1,0,0],[0,0,-1],h,w,d,'top'],[[0,-1,0],[1,0,0],[0,0,1],h,w,d,'bottom'],[[0,0,1],[1,0,0],[0,1,0],d,w,h,'side'],[[0,0,-1],[-1,0,0],[0,1,0],d,w,h,'side']];
  for(const[n,u,v,dn,du,dv,kind]of faces){if(o.skip&&o.skip.includes(kind))continue;if(kind==='bottom'&&!o.bottom)continue;const mn=M[kind]||M.side;const b=this.batch(mn,o.cast!==false,o.recv!==false);const tile=b.m.userData.tile||[1,1];
   const cx=n[0]*w/2,cy=n[1]*h/2+h/2,cz=n[2]*d/2;const base=b.n;
   for(const[a,e]of[[-1,-1],[1,-1],[1,1],[-1,1]]){let px=cx+u[0]*a*du/2+v[0]*e*dv/2,py=cy+u[1]*a*du/2+v[1]*e*dv/2,pz=cz+u[2]*a*du/2+v[2]*e*dv/2;
    b.pos.push(x+px*c+pz*s,y+py,z-px*s+pz*c);b.nor.push(n[0]*c+n[2]*s,n[1],-n[0]*s+n[2]*c);
    const uu=kind==='side'?(a+1)/2*du/tile[0]+(o.uo||0):(x+px*c+pz*s)/tile[0],vv=kind==='side'?(e+1)/2*dv/tile[1]+(o.vo!==undefined?o.vo:y/tile[1]):(z-px*s+pz*c)/tile[1];b.uv.push(uu,vv);
    if(col)b.col.push(col.r,col.g,col.b);else b.col.push(1,1,1);}
   b.idx.push(base,base+1,base+2,base,base+2,base+3);b.n+=4;}
  if(o.collide!==false)this.collider(x,y+h/2,z,w/2,h/2,d/2,ry,o.walk!==false,o.matK||'stone',o.owner);}
 // arbitrary geometry into a batch (geometry must have position/normal; uv optional)
 geo(g,mat,m,o={}){const b=this.batch(mat,o.cast!==false,o.recv!==false);if(m)g.applyMatrix4(m);const p=g.attributes.position,nr=g.attributes.normal,uv=g.attributes.uv,cl=g.attributes.color;const base=b.n;const col=o.col?new THREE.Color(o.col):null;
  for(let i=0;i<p.count;i++){b.pos.push(p.getX(i),p.getY(i),p.getZ(i));b.nor.push(nr.getX(i),nr.getY(i),nr.getZ(i));b.uv.push(uv?uv.getX(i)*(o.us||1):0,uv?uv.getY(i)*(o.vs||1):0);if(cl)b.col.push(cl.getX(i),cl.getY(i),cl.getZ(i));else if(col)b.col.push(col.r,col.g,col.b);else b.col.push(1,1,1);}
  if(g.index)for(let i=0;i<g.index.count;i++)b.idx.push(base+g.index.getX(i));else for(let i=0;i<p.count;i++)b.idx.push(base+i);b.n+=p.count;g.dispose();}
 cyl(x,y,z,r1,r2,h,mat,o={}){const g=new THREE.CylinderGeometry(r1,r2,h,o.seg||12,1,!!o.open);const m=new THREE.Matrix4().compose(new V(x,y+h/2,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx||0,o.ry||0,o.rz||0)),new V(1,1,1));
  this.geo(g,mat,m,{...o,us:o.us||Math.max(1,Math.round(Math.PI*2*r1/3)),vs:o.vs||Math.max(1,h/3)});if(o.collide)this.collider(x,y+h/2,z,Math.max(r1,r2)*.85,h/2,Math.max(r1,r2)*.85,0,o.walk!==false,o.matK||'metal');}
 // ---------------- colliders + walk surfaces ----------------
 collider(cx,cy,cz,hx,hy,hz,ry=0,walk=true,matK='stone',owner=null){const c={cx,cy,cz,hx,hy,hz,c:Math.cos(ry),s:Math.sin(ry),walk,matK,owner,st:0,on:true};this.cols.push(c);this.index(c);return c;}
 index(c){const r=Math.hypot(c.hx,c.hz),C=this.cell;for(let i=Math.floor((c.cx-r)/C);i<=Math.floor((c.cx+r)/C);i++)for(let j=Math.floor((c.cz-r)/C);j<=Math.floor((c.cz+r)/C);j++){const k=i*73856093^j*19349663;let a=this.grid.get(k);if(!a)this.grid.set(k,a=[]);a.push(c);}}
 near(x,z){return this.grid.get(Math.floor(x/this.cell)*73856093^Math.floor(z/this.cell)*19349663)||[];}
 ramp(x0,z0,x1,z1,y0,y1,axis){this.ramps.push({x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1),y0,y1,axis,ax0:axis==='x'?x0:z0,ax1:axis==='x'?x1:z1});}
 terrainAt(x,z){return this.H(x,z);}
 waterAt(x,z){for(const w of this.waters)if(x>=w.x0&&x<=w.x1&&z>=w.z0&&z<=w.z1&&this.H(x,z)<w.y)return w.y;return null;}
 // highest walkable surface under (x,z) that is not far above y
 groundAt(x,z,y=1e9){let g=this.H(x,z);for(const c of this.near(x,z)){if(!c.walk||!c.on)continue;const dx=x-c.cx,dz=z-c.cz,lx=dx*c.c-dz*c.s,lz=dx*c.s+dz*c.c;if(Math.abs(lx)<=c.hx&&Math.abs(lz)<=c.hz){const t=c.cy+c.hy;if(t<=y+.6&&t>g)g=t;}}
  for(const r of this.ramps)if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1){const a=r.axis==='x'?x:z,t=r.y0+(r.y1-r.y0)*clamp((a-r.ax0)/(r.ax1-r.ax0),0,1);if(t<=y+.6&&t>g)g=t;}return g;}
 // push a point out of any solid box (ragdolls)
 pushOut(p,rad){for(const c of this.near(p.x,p.z)){if(!c.on)continue;const dx=p.x-c.cx,dz=p.z-c.cz,lx=dx*c.c-dz*c.s,lz=dx*c.s+dz*c.c,ly=p.y-c.cy;const ox=c.hx+rad-Math.abs(lx),oy=c.hy+rad-Math.abs(ly),oz=c.hz+rad-Math.abs(lz);
  if(ox>0&&oy>0&&oz>0){if(oy<=ox&&oy<=oz)p.y+=Math.sign(ly)*oy;else if(ox<oz){const m=Math.sign(lx)*ox;p.x+=m*c.c;p.z-=m*c.s;}else{const m=Math.sign(lz)*oz;p.x+=m*c.s;p.z+=m*c.c;}}}}
 // segment a→b vs static colliders + terrain + water. returns {t(0..1),p,n,kind,col} or null
 segment(ax,ay,az,bx,by,bz,o={}){const dx=bx-ax,dy=by-ay,dz=bz-az,L=Math.hypot(dx,dy,dz);if(L<1e-6)return null;let best=null;const st=++this.stamp;const C=this.cell;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/(C*.5)));const seen=new Set();
  for(let k=0;k<=steps;k++){const x=ax+dx*k/steps,z=az+dz*k/steps;for(const ox of[-C*.5,C*.5])for(const oz of[-C*.5,C*.5]){const key=Math.floor((x+ox)/C)*73856093^Math.floor((z+oz)/C)*19349663;if(seen.has(key))continue;seen.add(key);const a=this.grid.get(key);if(!a)continue;
    for(const c of a){if(c.st===st||!c.on||(o.skip&&o.skip(c)))continue;c.st=st;const h=rayBox(ax,ay,az,dx,dy,dz,c);if(h&&h.t<=1&&(!best||h.t<best.t)){best=h;best.col=c;best.kind=c.matK;}}}}
  // terrain march
  const n=Math.max(2,Math.ceil(L/(o.coarse?4:1.2)));let pt=0,pd=ay-this.H(ax,az);const lim=best?best.t:1;
  for(let i=1;i<=n;i++){const t=i/n;if(t>lim+1/n)break;const x=ax+dx*t,y=ay+dy*t,z=az+dz*t,d=y-this.H(x,z);if(d<0&&pd>=0){let lo=pt,hi=t;for(let j=0;j<6;j++){const m=(lo+hi)/2;if(ay+dy*m-this.H(ax+dx*m,az+dz*m)<0)hi=m;else lo=m;}
    if(!best||hi<best.t){best={t:hi,n:new V(0,1,0),kind:'ground'};}break;}pt=t;pd=d;}
  if(!o.noWater)for(const w of this.waters){if(ay>w.y!==by>w.y){const t=(w.y-ay)/dy,x=ax+dx*t,z=az+dz*t;if(t>=0&&t<=1&&(!best||t<best.t)&&x>=w.x0&&x<=w.x1&&z>=w.z0&&z<=w.z1&&this.H(x,z)<w.y)best={t,n:new V(0,1,0),kind:'water'};}}
  if(best)best.p=new V(ax+dx*best.t,ay+dy*best.t,az+dz*best.t);return best;}
 los(a,b,o){const h=this.segment(a.x,a.y,a.z,b.x,b.y,b.z,{coarse:true,noWater:true,...o});return !h||h.t>.985;}
 // ---------------- finalize batches into meshes ----------------
 finalize(){for(const b of this.batches.values()){if(!b.n)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));
  if(b.m.vertexColors)g.setAttribute('color',new THREE.Float32BufferAttribute(b.col,3));g.setIndex(b.n>65535?new THREE.Uint32BufferAttribute(b.idx,1):new THREE.Uint16BufferAttribute(b.idx,1));g.computeBoundingSphere();
  const m=new THREE.Mesh(g,b.m);m.castShadow=b.cast;m.receiveShadow=b.recv;m.matrixAutoUpdate=false;m.updateMatrix();this.group.add(m);}this.batches.clear();}
 add(o){this.group.add(o);return o;}
 update(dt,t,wind){this.uTime.value=t;this.uWind.value.copy(wind);for(const f of this.flags)f.update(t,wind);for(const u of this.updaters)u(dt,t,wind);}
 dispose(){this.scene.remove(this.group);this.group.traverse(o=>{if(o.geometry)o.geometry.dispose();});for(const k in this.mats)this.mats[k].dispose();if(this.envRT)this.envRT.dispose();}

 // ======================== environment ========================
 sky(o){this.skyO=o;const U={top:{value:new THREE.Color(o.top)},hor:{value:new THREE.Color(o.hor)},bot:{value:new THREE.Color(o.bot??o.hor)},sunDir:{value:o.sunDir.clone().normalize()},sunCol:{value:new THREE.Color(o.sunCol)},sunSize:{value:o.sunSize??.0008},cloud:{value:o.cloud??.3},night:{value:o.night??0},time:this.uTime,cloudDark:{value:o.cloudDark??0}};
  const m=new THREE.ShaderMaterial({uniforms:U,vertexShader:SKY_V,fragmentShader:SKY_F,side:THREE.BackSide,depthWrite:false,fog:false});const s=new THREE.Mesh(new THREE.SphereGeometry(4000,32,16),m);s.renderOrder=-1;s.frustumCulled=false;this.group.add(s);this.skyMesh=s;
  // environment map from the sky only
  const es=new THREE.Scene();const s2=new THREE.Mesh(new THREE.SphereGeometry(100,32,16),m);es.add(s2);const pm=new THREE.PMREMGenerator(this.R);this.envRT=pm.fromScene(es,0,1,1000);pm.dispose();this.scene.environment=this.envRT.texture;
  this.skyU=U;return s;}
 lights(o){const hemi=new THREE.HemisphereLight(o.skyC,o.gndC,o.hemi);this.group.add(hemi);const sun=new THREE.DirectionalLight(o.sunC,o.sunI);sun.position.copy(o.sunDir).normalize().multiplyScalar(400).add(o.center);sun.target.position.copy(o.center);
  sun.castShadow=true;const r=o.shadowR||110;Object.assign(sun.shadow.camera,{left:-r,right:r,top:r,bottom:-r,near:10,far:900});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;
  this.group.add(sun,sun.target);this.sun=sun;this.hemi=hemi;return sun;}
 terrain(o){const N=o.seg||288,RAD=o.size||1600,EX=o.warp||1.55;const pos=new Float32Array((N+1)*(N+1)*3),col=new Float32Array((N+1)*(N+1)*3),uv=new Float32Array((N+1)*(N+1)*2);
  const wp=u=>Math.sign(u)*Math.pow(Math.abs(u),EX)*RAD;const c=new THREE.Color();let k=0;
  for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const x=wp(i/N*2-1)+(o.cx||0),z=wp(j/N*2-1)+(o.cz||0),y=this.H(x,z);pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;
   const e=1.5,sl=Math.min(1,Math.hypot(this.H(x+e,z)-this.H(x-e,z),this.H(x,z+e)-this.H(x,z-e))/(2*e));o.color(x,z,y,sl,c);col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;uv[k*2]=x/7;uv[k*2+1]=z/7;k++;}
  const idx=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,cc=a+N+1,d=cc+1;idx.push(a,cc,b,b,cc,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
  const t=o.rocky?this.S.rockd:this.S.detail;const m=new THREE.MeshStandardMaterial({vertexColors:true,map:t.map,normalMap:t.normalMap,normalScale:new THREE.Vector2(.8,.8),roughness:o.rough??.95,metalness:0});
  const mesh=new THREE.Mesh(g,m);mesh.receiveShadow=true;mesh.castShadow=o.cast!==false;mesh.matrixAutoUpdate=false;this.group.add(mesh);this.terrainMesh=mesh;return mesh;}
 water(o){const so=this.skyO||{};o={sunDir:so.sunDir||new V(0,1,0),sunCol:so.sunCol??0xffffff,skyH:so.hor??0x8899aa,skyT:so.top??0x335577,...o};const S=this.S,RN=o.range||600,N=256;const b=o.bounds||[-1e9,-1e9,1e9,1e9];const wy=o.y;this.waters.push({y:wy,x0:b[0],z0:b[1],x1:b[2],z1:b[3]});if(this.waterY===null)this.waterY=wy;const dd=new Uint8Array(N*N*4);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(o.cx||0)+(i/(N-1)*2-1)*RN,z=(o.cz||0)+(j/(N-1)*2-1)*RN;const d=clamp((wy-this.H(x,z))/(o.depthScale||8),0,1);const q=(j*N+i)*4;dd[q]=d*255;dd[q+1]=dd[q+2]=0;dd[q+3]=255;}
  const dt=new THREE.DataTexture(dd,N,N);dt.magFilter=dt.minFilter=THREE.LinearFilter;dt.needsUpdate=true;
  const fog=this.scene.fog;const U={nrm:{value:S.water},depth:{value:dt},deep:{value:new THREE.Color(o.deep)},shallow:{value:new THREE.Color(o.shallow)},sunDir:{value:o.sunDir.clone().normalize()},sunCol:{value:new THREE.Color(o.sunCol)},skyH:{value:new THREE.Color(o.skyH)},skyT:{value:new THREE.Color(o.skyT)},
   fogC:{value:fog?fog.color:new THREE.Color()},fogD:{value:fog?fog.density:0},time:this.uTime,dRange:{value:RN},dC:{value:new THREE.Vector2(o.cx||0,o.cz||0)},rough:{value:o.rough??1},foamOn:{value:o.foam??1}};
  const m=new THREE.ShaderMaterial({uniforms:U,vertexShader:WATER_V,fragmentShader:WATER_F});const sx=o.bounds?b[2]-b[0]:o.size||8000,sz=o.bounds?b[3]-b[1]:o.size||8000;const w=new THREE.Mesh(new THREE.PlaneGeometry(sx,sz,1,1),m);w.rotation.x=-Math.PI/2;w.position.set(o.bounds?(b[0]+b[2])/2:o.cx||0,wy,o.bounds?(b[1]+b[3])/2:o.cz||0);w.receiveShadow=false;this.group.add(w);this.waterU=U;return w;}
 // small decorative water surface (pools)
 pool(x,y,z,w,d){const U={...this.waterU};const m=new THREE.MeshStandardMaterial({color:0x2ab0d0,roughness:.04,metalness:.1,normalMap:this.S.water,normalScale:new THREE.Vector2(.25,.25),emissive:0x0a5a70,emissiveIntensity:this.night?1.4:.35});
  this.updaters.push((dt,t)=>{m.normalMap.offset.set(t*.01,t*.007);});const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);p.rotation.x=-Math.PI/2;p.position.set(x,y,z);p.receiveShadow=true;this.group.add(p);return p;}

 // ======================== vegetation (instanced, wind sway) ========================
 swayMat(base,amt){base.onBeforeCompile=sh=>{sh.uniforms.uTime=this.uTime;sh.uniforms.uWind=this.uWind;sh.vertexShader='uniform float uTime;uniform vec3 uWind;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   #ifdef USE_INSTANCING
   vec3 ip=instanceMatrix[3].xyz;float ph=ip.x*.13+ip.z*.17;
   #else
   float ph=0.;
   #endif
   float hh=max(position.y,0.);float ws=length(uWind);vec3 wd=ws>.01?uWind/ws:vec3(1,0,0);float sw=(${amt.toFixed(4)})*hh*hh*(.35+ws*.12)*(.6+.4*sin(uTime*(1.1+ws*.08)+ph))+${(amt*.25).toFixed(4)}*hh*hh*sin(uTime*2.7+ph*2.)*(ws*.08);
   transformed.x+=wd.x*sw;transformed.z+=wd.z*sw;`);};base.customProgramCacheKey=()=>'sway'+amt;return base;}
 trees(kind,list,o={}){const g=treeGeo(kind,o);const m=this.swayMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:0}),kind==='palm'?.0025:kind==='pine'||kind==='snowpine'?.0012:.0018);
  const im=new THREE.InstancedMesh(g,m,list.length);const M=new THREE.Matrix4(),q=new THREE.Quaternion(),r=rng(o.seed||7);
  const TH={palm:9,pine:13,snowpine:13,cypress:9.5,olive:5,broad:5.5,bush:1.5,cactus:5,shrub:1}[kind]||6;im.userData.inst=[];
  list.forEach((p,i)=>{const s=(p[3]||1)*(o.scale||1)*(.85+r()*.3);const y=p[1]??this.H(p[0],p[2]);q.setFromEuler(new THREE.Euler((r()-.5)*.06,r()*6.28,(r()-.5)*.06));M.compose(new V(p[0],y,p[2]),q,new V(s,s,s));im.setMatrixAt(i,M);
   const col=o.collide!==false&&kind!=='bush'?this.collider(p[0],y+3*s,p[2],.35*s,3*s,.35*s,0,false,'wood'):null;im.userData.inst.push({x:p[0],y,z:p[2],top:y+TH*s,col});});
  im.castShadow=true;im.receiveShadow=true;im.computeBoundingSphere();this.group.add(im);this.instanced.push(im);return im;}
 rocks(list,mat='rock'){const g=new THREE.IcosahedronGeometry(1,1);const p=g.attributes.position;const r=rng(99);for(let i=0;i<p.count;i++){const v=new V(p.getX(i),p.getY(i),p.getZ(i));v.multiplyScalar(.75+noise(v.x*2+3,v.z*2+v.y)*.9+r()*.08);p.setXYZ(i,v.x,v.y*.7,v.z);}g.computeVertexNormals();
  const im=new THREE.InstancedMesh(g,this.mat(mat),list.length);const M=new THREE.Matrix4(),q=new THREE.Quaternion();list.forEach((a,i)=>{q.setFromEuler(new THREE.Euler(r()*.4,r()*6,r()*.4));const s=a[3]||1;M.compose(new V(a[0],a[1]??this.H(a[0],a[2]),a[2]),q,new V(s*(.8+r()*.5),s*(.6+r()*.5),s*(.8+r()*.5)));im.setMatrixAt(i,M);});
  im.castShadow=true;im.receiveShadow=true;this.group.add(im);return im;}
 // wind flag on a pole: shows wind direction + strength
 flag(x,y,z,o={}){const S=this.S,pole=o.pole??7;this.cyl(x,y,z,.05,.06,pole,'steel',{seg:6});const W=o.w||1.6,Hh=o.h||1;const g=new THREE.PlaneGeometry(W,Hh,16,8);g.translate(W/2,0,0);
  const t=o.tex||labelTex(o.text||'',{w:128,h:80,bg:o.color||'#c02a20',fg:'#fff',size:26});const m=new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:.8});
  const U={uT:{value:0},uS:{value:0}};m.onBeforeCompile=sh=>{sh.uniforms.uT=U.uT;sh.uniforms.uS=U.uS;sh.vertexShader='uniform float uT,uS;\n'+sh.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float k=position.x/${W.toFixed(2)};float a=(.08+.22*uS)*k;transformed.z+=sin(position.x*3.-uT*(4.+uS*9.))*a+sin(position.x*5.7-uT*7.+position.y*2.)*a*.4;transformed.y-=(1.-uS)*k*k*.9;transformed.x*=(.75+.25*uS);`);};
  const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;const grp=new THREE.Group();grp.position.set(x,y+pole-Hh/2-.05,z);grp.add(mesh);this.group.add(grp);
  const f={grp,update:(t,w)=>{const s=Math.hypot(w.x,w.z);U.uT.value=t;U.uS.value=clamp(s/9,0,1);const a=Math.atan2(-w.z,w.x);grp.rotation.y+=(a-grp.rotation.y+Math.PI*3)%(Math.PI*2)-Math.PI>0?.02:-.02;grp.rotation.y=a+Math.sin(t*1.3+x)*.08*(1-U.uS.value*.6);}};this.flags.push(f);return f;}
 // string of party bulbs between two points (instanced)
 lightString(a,b,n=14,sag=.6,col=0xffd9a0){const g=new THREE.SphereGeometry(.07,6,4);const m=new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(this.night?3:1.6)});const im=new THREE.InstancedMesh(g,m,n);const M=new THREE.Matrix4();
  for(let i=0;i<n;i++){const t=i/(n-1);const p=new V().lerpVectors(a,b,t);p.y-=Math.sin(t*Math.PI)*sag;M.makeTranslation(p.x,p.y,p.z);im.setMatrixAt(i,M);}this.group.add(im);
  const pts=[];for(let i=0;i<=16;i++){const t=i/16;const p=new V().lerpVectors(a,b,t);p.y-=Math.sin(t*Math.PI)*sag;pts.push(p);}const lg=new THREE.BufferGeometry().setFromPoints(pts);this.group.add(new THREE.Line(lg,new THREE.LineBasicMaterial({color:0x111111})));return im;}
 pointLight(x,y,z,col,int,dist){const l=new THREE.PointLight(col,int,dist,1.6);l.position.set(x,y,z);this.group.add(l);this.plights.push(l);return l;}
 sign(x,y,z,w,h,txt,o={}){const t=labelTex(txt,{w:o.tw||512,h:o.th||128,bg:o.bg||'#05060a',fg:o.fg||'#ff3a8a',size:o.size||86,glow:o.glow!==false});const m=o.lit===false?new THREE.MeshStandardMaterial({map:t,roughness:.6}):new THREE.MeshBasicMaterial({map:t,color:new THREE.Color(1,1,1).multiplyScalar(o.bright||(this.night?2.2:1))});
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);p.position.set(x,y,z);p.rotation.y=o.ry||0;this.group.add(p);return p;}
}

// ---- ray vs oriented box (rotation about y) ----
const _n=new V();
export function rayBox(ox,oy,oz,dx,dy,dz,c){const px=ox-c.cx,pz=oz-c.cz,lx=px*c.c-pz*c.s,lz=px*c.s+pz*c.c,ly=oy-c.cy,ddx=dx*c.c-dz*c.s,ddz=dx*c.s+dz*c.c;
 let t0=-1e9,t1=1e9,ax=-1;const sl=(o,d,h,a)=>{if(Math.abs(d)<1e-9){return Math.abs(o)<=h;}let ta=(-h-o)/d,tb=(h-o)/d;if(ta>tb){const q=ta;ta=tb;tb=q;}if(ta>t0){t0=ta;ax=a;}if(tb<t1)t1=tb;return t0<=t1;};
 if(!sl(lx,ddx,c.hx,0)||!sl(ly,dy,c.hy,1)||!sl(lz,ddz,c.hz,2))return null;if(t1<0)return null;const t=t0<0?0:t0;
 let n;if(ax===0){const sx=-Math.sign(ddx);n=new V(sx*c.c,0,-sx*c.s);}else if(ax===1)n=new V(0,-Math.sign(dy),0);else{const sz=-Math.sign(ddz);n=new V(sz*c.s,0,sz*c.c);}return{t,n};}

// ======================== tree geometry (vertex coloured, merged) ========================
function vcMerge(parts){let n=0;for(const p of parts)n+=p.g.attributes.position.count;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let k=0;
 for(const{g,c}of parts){const gg=g.index?g.toNonIndexed():g;const a=gg.attributes.position.array,b=gg.attributes.normal.array;for(let i=0;i<a.length;i+=3){pos[k*3]=a[i];pos[k*3+1]=a[i+1];pos[k*3+2]=a[i+2];nor[k*3]=b[i];nor[k*3+1]=b[i+1];nor[k*3+2]=b[i+2];
   const cc=typeof c==='function'?c(a[i],a[i+1],a[i+2],b[i+1]):c;col[k*3]=cc.r;col[k*3+1]=cc.g;col[k*3+2]=cc.b;k++;}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));return g;}
export {vcMerge};
const LC=h=>new THREE.Color(h);
function treeGeo(kind,o){const P=[],r=rng(kind.length*31+(o.seed||1));const M=(g,x,y,z,rx=0,ry=0,rz=0,s=1)=>{g.applyMatrix4(new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(s,s,s)));return g;};
 if(kind==='palm'){const H=9;let x=0,y=0,z=0;const bark=LC(0x8a7458);for(let i=0;i<6;i++){const h=H/6,lean=.06+i*.035;const g=new THREE.CylinderGeometry(.17-i*.012,.2-i*.012,h*1.02,7);M(g,x+Math.sin(lean)*h/2,y+h/2,z,0,0,-lean);P.push({g,c:bark});x+=Math.sin(lean)*h;y+=Math.cos(lean)*h;}
  for(let i=0;i<9;i++){const a=i/9*6.283+r()*.3;const len=3.6+r()*.8;for(let s=0;s<4;s++){const t0=s/4,seg=len/4;const g=new THREE.BoxGeometry(seg*1.05,.04,(.7-t0*.45)*(1+r()*.1));const ang=-.25-t0*.9*(.8+r()*.3);const d=Math.cos(ang);
    const px=x+Math.cos(a)*(t0*len*.92+seg/2),pz=z+Math.sin(a)*(t0*len*.92+seg/2),py=y+.1-Math.pow(t0+.12,2)*1.9;M(g,px,py,pz,0,-a,ang);P.push({g,c:(xx,yy,zz,ny)=>LC(ny>0?0x4a7a2a:0x2e5420)});}}
  for(let i=0;i<4;i++){const g=new THREE.SphereGeometry(.13,6,5);M(g,x+Math.cos(i*1.7)*.22,y-.25,z+Math.sin(i*1.7)*.22);P.push({g,c:LC(0x6a5a20)});}}
 else if(kind==='pine'||kind==='snowpine'){const H=11+r()*3;const g=new THREE.CylinderGeometry(.16,.3,H*.45,6);M(g,0,H*.22,0);P.push({g,c:LC(0x5a4030)});
  for(let i=0;i<6;i++){const t=i/6,rr=(1-t)*2.6+.5,h=H*.32;const c=new THREE.ConeGeometry(rr,h,9,1);M(c,0,H*.22+t*H*.7+h*.4,0,0,r()*3,0);const snow=kind==='snowpine';P.push({g:c,c:(x,y,z,ny)=>snow&&ny>.25?LC(0xf2f6fa):LC(i%2?0x24402a:0x2a4a30)});}}
 else if(kind==='cypress'){const g=new THREE.CylinderGeometry(.12,.18,1.4,6);M(g,0,.7,0);P.push({g,c:LC(0x5a4030)});const c=new THREE.SphereGeometry(1,10,10);M(c,0,5.2,0);c.scale(.85,4.2,.85);c.translate(0,0,0);P.push({g:c,c:LC(0x24402a)});}
 else if(kind==='olive'||kind==='broad'){const g=new THREE.CylinderGeometry(.14,.24,2.6,6);M(g,0,1.3,0,0,0,.08);P.push({g,c:LC(0x5a4636)});const leaf=kind==='olive'?0x6a7a4a:0x3a5a2a;
  for(let i=0;i<7;i++){const s=1.1+r()*.9;const c=new THREE.IcosahedronGeometry(s,1);M(c,(r()-.5)*2.4,2.8+r()*1.6,(r()-.5)*2.4);P.push({g:c,c:(x,y,z,ny)=>LC(ny>.3?leaf:new THREE.Color(leaf).multiplyScalar(.7).getHex())});}}
 else if(kind==='bush'){for(let i=0;i<4;i++){const s=.6+r()*.5;const c=new THREE.IcosahedronGeometry(s,1);M(c,(r()-.5)*1.2,s*.7,(r()-.5)*1.2);P.push({g:c,c:LC(o.color||0x4a6a32)});}}
 else if(kind==='cactus'){const g=new THREE.CylinderGeometry(.28,.32,5,8);M(g,0,2.5,0);P.push({g,c:LC(0x4a6a3a)});for(const s of[-1,1]){const a=new THREE.CylinderGeometry(.18,.2,1.4,7);M(a,s*.62,2.2,0,0,0,s*1.57);P.push({g:a,c:LC(0x4a6a3a)});const b=new THREE.CylinderGeometry(.17,.18,1.6,7);M(b,s*1.2,3,0);P.push({g:b,c:LC(0x4a6a3a)});}}
 else if(kind==='shrub'){for(let i=0;i<3;i++){const c=new THREE.IcosahedronGeometry(.5+r()*.3,0);M(c,(r()-.5),.35,(r()-.5));P.push({g:c,c:LC(0x8a7a4a)});}}
 return vcMerge(P);}

// ======================== particles ========================
const PV=`#include <common>
#include <logdepthbuf_pars_vertex>
attribute float aS;attribute float aA;attribute vec3 aC;varying float vA;varying vec3 vC;uniform float uScale;void main(){vA=aA;vC=aC;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aS*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;
#include <logdepthbuf_vertex>
}`;
const PF=`#include <logdepthbuf_pars_fragment>
uniform sampler2D tex;varying float vA;varying vec3 vC;void main(){
#include <logdepthbuf_fragment>
vec4 t=texture2D(tex,gl_PointCoord);gl_FragColor=vec4(vC*t.rgb,t.a*vA);
 #include <colorspace_fragment>
}`;
export class Particles{
 constructor(scene,n,tex,additive){this.n=n;this.i=0;const g=new THREE.BufferGeometry();this.p=new Float32Array(n*3);this.s=new Float32Array(n);this.a=new Float32Array(n);this.c=new Float32Array(n*3);
  this.v=new Float32Array(n*3);this.life=new Float32Array(n);this.max=new Float32Array(n);this.grow=new Float32Array(n);this.drag=new Float32Array(n);this.grav=new Float32Array(n);this.a0=new Float32Array(n);this.wind=new Float32Array(n);
  g.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aS',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aA',new THREE.BufferAttribute(this.a,1).setUsage(THREE.DynamicDrawUsage));g.setAttribute('aC',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:600},tex:{value:tex}};const m=new THREE.ShaderMaterial({uniforms:this.U,vertexShader:PV,fragmentShader:PF,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending});
  this.mesh=new THREE.Points(g,m);this.mesh.frustumCulled=false;this.mesh.renderOrder=5;scene.add(this.mesh);this.g=g;this.alive=0;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,o={}){const i=this.i;this.i=(this.i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.c[i*3]=r;this.c[i*3+1]=g;this.c[i*3+2]=b;
  this.s[i]=size;this.life[i]=life;this.max[i]=life;this.grow[i]=o.grow||0;this.drag[i]=o.drag??1;this.grav[i]=o.grav??0;this.a0[i]=o.a??1;this.a[i]=this.a0[i];this.wind[i]=o.wind||0;}
 burst(p,n,spd,col,size,life,o={}){const cols=Array.isArray(col)?col:[col];for(let k=0;k<n;k++){const c=cols[k%cols.length];let x=Math.random()*2-1,y=Math.random()*2-1,z=Math.random()*2-1;const l=Math.hypot(x,y,z)||1;x/=l;y/=l;z/=l;
  if(o.up)y=Math.abs(y);if(o.dir){x=x*(o.spread??.6)+o.dir.x;y=y*(o.spread??.6)+o.dir.y;z=z*(o.spread??.6)+o.dir.z;}const s=spd*(.3+Math.random()*.7);
  this.emit(p.x+(o.jit?(Math.random()-.5)*o.jit:0),p.y+(o.jit?(Math.random()-.5)*o.jit*.5:0),p.z+(o.jit?(Math.random()-.5)*o.jit:0),x*s,y*s,z*s,c.r,c.g,c.b,size*(.6+Math.random()*.8),life*(.6+Math.random()*.6),o);}}
 update(dt,wind){for(let i=0;i<this.n;i++){if(this.life[i]<=0){if(this.a[i]!==0)this.a[i]=0;continue;}this.life[i]-=dt;const k=Math.exp(-this.drag[i]*dt),w=this.wind[i];
  this.v[i*3]=this.v[i*3]*k+(w&&wind?wind.x*w*(1-k):0);this.v[i*3+1]=this.v[i*3+1]*k-this.grav[i]*dt;this.v[i*3+2]=this.v[i*3+2]*k+(w&&wind?wind.z*w*(1-k):0);
  this.p[i*3]+=this.v[i*3]*dt;this.p[i*3+1]+=this.v[i*3+1]*dt;this.p[i*3+2]+=this.v[i*3+2]*dt;this.s[i]+=this.grow[i]*dt;const f=this.life[i]/this.max[i];this.a[i]=this.a0[i]*Math.min(1,f*2.5)*Math.min(1,(1-f)*12+.2);}
  this.g.attributes.position.needsUpdate=true;this.g.attributes.aS.needsUpdate=true;this.g.attributes.aA.needsUpdate=true;this.g.attributes.aC.needsUpdate=true;}
 clear(){this.life.fill(0);this.a.fill(0);}
}
// weather volume (rain streaks or snow flakes) that follows a focus point
export class Weather{
 constructor(scene,kind,n,box){this.kind=kind;this.n=n;this.box=box;this.p=new Float32Array(n*3);const r=rng(5);for(let i=0;i<n;i++){this.p[i*3]=(r()-.5)*box;this.p[i*3+1]=(r()-.5)*box*.6;this.p[i*3+2]=(r()-.5)*box;}this.center=new V();
  if(kind==='rain'){const g=new THREE.BufferGeometry();this.l=new Float32Array(n*6);g.setAttribute('position',new THREE.BufferAttribute(this.l,3).setUsage(THREE.DynamicDrawUsage));this.mesh=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x9aaabb,transparent:true,opacity:.35,depthWrite:false}));}
  else{const g=new THREE.BufferGeometry();this.l=new Float32Array(n*3);g.setAttribute('position',new THREE.BufferAttribute(this.l,3).setUsage(THREE.DynamicDrawUsage));this.mesh=new THREE.Points(g,new THREE.PointsMaterial({color:kind==='dust'?0xd8c09a:0xffffff,size:kind==='dust'?.06:.07,transparent:true,opacity:kind==='dust'?.5:.9,depthWrite:false}));}
  this.mesh.frustumCulled=false;scene.add(this.mesh);}
 update(dt,wind,center,scale=1){const h=this.box*.3,fall=this.kind==='rain'?14:this.kind==='snow'?1.4:.2;const wx=wind.x*(this.kind==='rain'?.6:.9),wz=wind.z*(this.kind==='rain'?.6:.9);
  for(let i=0;i<this.n;i++){let x=this.p[i*3]+wx*dt,y=this.p[i*3+1]-fall*dt*(this.kind==='dust'?0:1),z=this.p[i*3+2]+wz*dt;
   if(this.kind!=='rain'){x+=Math.sin(y*1.3+i)*.3*dt;z+=Math.cos(y*1.1+i*.7)*.3*dt;}
   const rx=((x-center.x)/scale%this.box+this.box*1.5)%this.box-this.box/2,rz=((z-center.z)/scale%this.box+this.box*1.5)%this.box-this.box/2;let ry=(y-center.y)/scale;if(ry<-h)ry+=2*h;if(ry>h)ry-=2*h;
   this.p[i*3]=center.x+rx*scale;this.p[i*3+1]=center.y+ry*scale;this.p[i*3+2]=center.z+rz*scale;}
  if(this.kind==='rain'){const L=.045;for(let i=0;i<this.n;i++){const x=this.p[i*3],y=this.p[i*3+1],z=this.p[i*3+2];this.l[i*6]=x;this.l[i*6+1]=y;this.l[i*6+2]=z;this.l[i*6+3]=x-wx*L;this.l[i*6+4]=y+fall*L*scale**.3;this.l[i*6+5]=z-wz*L;}}
  else this.l.set(this.p);this.mesh.geometry.attributes.position.needsUpdate=true;this.mesh.material.size=(this.kind==='dust'?.06:.07)*Math.max(1,scale*.6);}
}

// ======================== vehicle models ========================
// returns {g: Group, parts:{body, wheels[], rotor?}, dims}
export function vehicleModel(type,color=0x202226){const g=new THREE.Group();const std=o=>new THREE.MeshStandardMaterial(o);
 const paint=std({color,roughness:.28,metalness:.65}),glass=std({color:0x0a0e14,roughness:.05,metalness:.9}),tyre=std({color:0x151515,roughness:.9}),chrome=std({color:0xc8ccd0,roughness:.2,metalness:1}),dark=std({color:0x1a1a1c,roughness:.7}),
  lamp=new THREE.MeshBasicMaterial({color:0xfff2d8}),tail=new THREE.MeshBasicMaterial({color:0xff2010});
 const add=(geo,m,x,y,z,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
 const wheels=[];const wheel=(x,y,z,r=.38,w=.28)=>{const w0=new THREE.Group();w0.position.set(x,y,z);const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r,w,14),tyre);t.rotation.z=Math.PI/2;t.castShadow=true;w0.add(t);const h=new THREE.Mesh(new THREE.CylinderGeometry(r*.55,r*.55,w+.02,10),chrome);h.rotation.z=Math.PI/2;w0.add(h);g.add(w0);wheels.push(w0);};
 let dims;
 if(type==='suv'||type==='sedan'||type==='pickup'){const suv=type==='suv',L=suv?4.8:4.6,W=1.95,bh=suv?.85:.7,ch=suv?.75:.55;
  add(new THREE.BoxGeometry(W,bh,L),paint,0,.45+bh/2,0);const cab=add(new THREE.BoxGeometry(W*.94,ch,type==='pickup'?L*.38:L*(suv?.62:.5)),glass,0,.45+bh+ch/2,type==='pickup'?.3:suv?-.25:-.1);
  add(new THREE.BoxGeometry(W*.96,.08,type==='pickup'?L*.36:L*(suv?.6:.48)),paint,0,.45+bh+ch,cab.position.z);
  for(const s of[-1,1]){add(new THREE.BoxGeometry(.3,.12,.05),lamp,s*.65,.45+bh*.7,L/2+.01);add(new THREE.BoxGeometry(.3,.12,.05),tail,s*.7,.45+bh*.7,-L/2-.01);}
  add(new THREE.BoxGeometry(W*.7,.18,.06),chrome,0,.45+bh*.45,L/2+.02);if(type==='pickup')add(new THREE.BoxGeometry(W*.9,.4,L*.36),dark,0,.45+bh+.05,-L*.28);
  for(const sx of[-1,1])for(const sz of[-1,1])wheel(sx*W*.45,.4,sz*L*.32);dims={L,W,H:.45+bh+ch,engine:[0,.45+bh*.6,L*.36,W*.4,.3,.5],fuel:[0,.6,-L*.3,.5,.2,.4],cabin:[0,.45+bh+ch/2,cab.position.z,W*.47,ch/2,cab.geometry.parameters.depth/2],seats:[[.42,.45+bh-.42,.2],[-.42,.45+bh-.42,.2],[.42,.45+bh-.42,-1],[-.42,.45+bh-.42,-1]]};}
 else if(type==='truck'){const L=8.5,W=2.4;add(new THREE.BoxGeometry(W,1.6,2.4),paint,0,1.6,L/2-1.3);add(new THREE.BoxGeometry(W*.9,.8,1.2),glass,0,2.7,L/2-1.6);add(new THREE.BoxGeometry(W,.3,L-2.6),dark,0,.95,-1.3);
  const tank=add(new THREE.CylinderGeometry(1.15,1.15,L-3,16),std({color:0xd8d8d0,roughness:.35,metalness:.6}),0,2.25,-1.4,Math.PI/2);add(new THREE.BoxGeometry(.3,.8,1),std({color:0xc02a20,roughness:.5}),W*.5,2.3,-1.4);
  for(const sz of[3,-1,-3.3])for(const sx of[-1,1])wheel(sx*W*.44,.5,sz,.5,.35);dims={L,W,H:3.4,engine:[0,1.6,L/2-.8,W*.45,.6,.6],fuel:[0,2.25,-1.4,1.15,1.15,(L-3)/2],cabin:[0,2.7,L/2-1.6,W*.45,.4,.6],seats:[[.5,1.95,L/2-1.6],[-.5,1.95,L/2-1.6]]};}
 else if(type==='speedboat'||type==='yacht'){const y=type==='yacht',L=y?16:7,W=y?4.6:2.4;const hull=new THREE.CylinderGeometry(W/2,W/2*.4,L,12,1,false,0,Math.PI);hull.rotateX(Math.PI/2);hull.rotateZ(Math.PI);hull.scale(1,.55,1);
  const hp=hull.attributes.position;for(let i=0;i<hp.count;i++){const z=hp.getZ(i);if(z>0){const k=z/(L/2);hp.setX(i,hp.getX(i)*(1-k*k*.85));}}hull.computeVertexNormals();
  add(hull,std({color:0xf4f4f0,roughness:.3,metalness:.1}),0,y?.4:.3,0);add(new THREE.BoxGeometry(W*.98,.08,L*.96),std({color:0x9a7a5a,roughness:.6}),0,y?.42:.32,-L*.02);
  add(new THREE.BoxGeometry(W*.98,.2,L*.9),std({color:color,roughness:.3,metalness:.3}),0,y?.3:.2,-L*.03);
  if(y){add(new THREE.BoxGeometry(W*.75,1.8,L*.42),std({color:0xf4f4f0,roughness:.35}),0,1.3,-L*.06);add(new THREE.BoxGeometry(W*.77,.6,L*.42),glass,0,1.6,-L*.06);add(new THREE.BoxGeometry(W*.6,1.2,L*.2),std({color:0xf4f4f0,roughness:.35}),0,2.8,-L*.1);add(new THREE.BoxGeometry(W*.62,.4,L*.2),glass,0,3,-L*.1);
   add(new THREE.CylinderGeometry(.06,.06,4,6),chrome,0,5,-L*.1);}
  else{add(new THREE.BoxGeometry(W*.8,.5,.1),glass,0,.75,.6,-.5);add(new THREE.BoxGeometry(.6,.4,.5),dark,0,.55,-L/2+.3);}
  dims={L,W,H:y?3.4:1.2,engine:[0,y?.8:.5,-L/2+.6,W*.3,.3,.5],fuel:[0,y?.6:.4,-L*.25,W*.3,.2,.5],cabin:[0,y?1.6:.8,0,W*.45,.5,L*.3],seats:y?[[0,.45,-L*.3],[.8,.45,-L*.36],[-.8,.45,-L*.36],[0,1.6,L*.22],[0,.45,-L*.42]]:[[.45,.35,-.3],[-.45,.35,-.3],[0,.35,-1.6]],boat:true};}
 else if(type==='heli'){const body=new THREE.SphereGeometry(1.4,16,12);body.scale(1,1,1.9);add(body,paint,0,1.7,0);add(new THREE.SphereGeometry(1.05,12,10,0,Math.PI*2,0,Math.PI*.5),glass,0,1.85,1.2,.9);
  add(new THREE.CylinderGeometry(.35,.15,5,8),paint,0,2,-4,Math.PI/2);add(new THREE.BoxGeometry(.1,1.4,.8),paint,0,2.6,-6.3);for(const s of[-1,1])add(new THREE.BoxGeometry(.12,.12,4),dark,s*1,.12,0);for(const s of[-1,1])for(const z of[-1,1])add(new THREE.BoxGeometry(.08,.6,.08),dark,s*1,.4,z*1.1);
  const rot=new THREE.Group();rot.position.set(0,3.3,0);for(let i=0;i<4;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.04,10),dark);b.rotation.y=i*Math.PI/2;b.castShadow=true;rot.add(b);}rot.add(new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.4,8),dark));g.add(rot);
  const tr=new THREE.Group();tr.position.set(.3,2.7,-6.3);const tb=new THREE.Mesh(new THREE.BoxGeometry(.04,1.4,.14),dark);tr.add(tb);g.add(tr);
  dims={L:9,W:2.8,H:3.4,engine:[0,2.6,-.6,.7,.5,.8],fuel:[0,1,-.5,.8,.3,.8],cabin:[0,1.9,.6,1,.7,1.2],seats:[[.5,1.05,.9],[-.5,1.05,.9],[.5,1.05,-.4],[-.5,1.05,-.4]],rotor:rot,tail:tr,heli:true};}
 else if(type==='snowmobile'){add(new THREE.BoxGeometry(1,.5,2.4),paint,0,.55,0);add(new THREE.BoxGeometry(.9,.35,.8),dark,0,.95,-.2);add(new THREE.BoxGeometry(.8,.4,.1),glass,0,1.1,.75,-.5);for(const s of[-1,1])add(new THREE.BoxGeometry(.12,.06,1.4),dark,s*.55,.1,.8);add(new THREE.BoxGeometry(.7,.35,1.6),tyre,0,.3,-.6);
  dims={L:2.6,W:1.1,H:1.2,engine:[0,.6,.7,.45,.25,.4],fuel:[0,.7,-.9,.3,.2,.25],cabin:[0,1,0,.5,.3,.6],seats:[[0,.6,-.3]]};}
 return{g,wheels,dims};}
