// STORM ROYALE — set dressing that is also gameplay: picket fences and corral rails, parked cars, barrels, crates,
// hay bales (all harvestable / destructible obstacles) and street lamps. One instanced batch per prop type, shared
// material with per-vertex albedo and a per-vertex mask for the per-instance paint colour (car body, fence paint).
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,rng,M,rbox,ctex,normalFrom} from './util.js';

// parts: [geometry, matrix, hex colour, tintMask(0/1)]
function mergeT(parts){let n=0;const gs=parts.map(([g,m,c,t])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);n+=g.attributes.position.count;return[g,new THREE.Color(c),t||0];});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3),tm=new Float32Array(n);let o=0;
 for(const[g,c,t]of gs){const k=g.attributes.position.count,p=g.attributes.position,nn=g.attributes.normal;pos.set(p.array,o*3);nor.set(nn.array,o*3);
  for(let i=0;i<k;i++){const ax=Math.abs(nn.getX(i)),ay=Math.abs(nn.getY(i));const a=ay>.7?p.getX(i):ax>.7?p.getZ(i):p.getX(i),b=ay>.7?p.getZ(i):p.getY(i);uv[(o+i)*2]=a*.5;uv[(o+i)*2+1]=b*.5;col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;tm[o+i]=t;}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(col,3));r.setAttribute('aT',new THREE.BufferAttribute(tm,1));r.computeBoundingSphere();return r;}
const B=(w,h,d,x,y,z,c,t,rx=0,ry=0,rz=0)=>[new THREE.BoxGeometry(w,h,d),M(x,y,z,rx,ry,rz),c,t];
const RB=(w,h,d,x,y,z,c,t,r=.06,rx=0,ry=0,rz=0)=>[rbox(w,h,d,r,2),M(x,y,z,rx,ry,rz),c,t];
const CY=(r0,r1,h,x,y,z,c,t,seg=12,rx=0,ry=0,rz=0)=>[new THREE.CylinderGeometry(r0,r1,h,seg),M(x,y,z,rx,ry,rz),c,t];

function fenceGeo(){const p=[];for(const x of[-1,1])p.push(B(.12,1.05,.12,x*.94,.52,0,0xf2efe8,1));p.push(B(2,.08,.05,0,.32,0,0xece8e0,1),B(2,.08,.05,0,.78,0,0xece8e0,1));
 for(let i=0;i<9;i++){const x=-.8+i*.2;p.push(B(.1,.95,.03,x,.5,.04,0xf6f3ec,1),[new THREE.ConeGeometry(.07,.12,4),M(x,1.03,.04,0,Math.PI/4,0),0xf6f3ec,1]);}return mergeT(p);}
function railGeo(){const p=[];for(const x of[-1,1])p.push(CY(.08,.1,1.4,x*.95,.62,0,0x7a5a3a,0,6));for(const y of[.45,.9,1.25])p.push(B(2.05,.12,.07,0,y,0,0x8e6a44,0,0,0,(y-.9)*.02));return mergeT(p);}
function carGeo(){const p=[],paint=0xffffff,glass=0x1b2630,trim=0x22252a,chrome=0xc8ccd2;
 p.push(RB(1.86,.62,4.3,0,.66,0,paint,1,.18),RB(1.7,.5,2.2,0,1.18,-.2,paint,1,.16),RB(1.72,.44,2.0,0,1.2,-.2,glass,0,.12),RB(1.6,.08,2.05,0,1.46,-.2,paint,1,.04));
 p.push(B(1.9,.16,4.34,0,.42,0,trim,0),B(1.7,.18,.12,0,.62,2.16,trim,0),B(1.7,.18,.12,0,.62,-2.16,trim,0),B(1.5,.12,.06,0,.82,2.15,chrome,0));
 for(const s of[-1,1]){p.push(B(.34,.14,.06,s*.62,.86,2.15,0xfff6d8,0),B(.34,.12,.06,s*.62,.84,-2.15,0xc42020,0),B(.06,.1,.18,s*.97,1.1,.7,trim,0));
  for(const z of[1.35,-1.35])p.push(CY(.36,.36,.26,s*.83,.36,z,0x151515,0,14,0,0,Math.PI/2),CY(.2,.2,.28,s*.83,.36,z,chrome,0,10,0,0,Math.PI/2));}
 return mergeT(p);}
function barrelGeo(){const p=[CY(.4,.4,1.15,0,.58,0,0xffffff,1,14)];for(const y of[.18,.58,.98])p.push(CY(.415,.415,.06,0,y,0,0x444a50,0,14));p.push(CY(.36,.36,.02,0,1.16,0,0x555a60,0,14));return mergeT(p);}
function crateGeo(){const p=[B(1.2,1.2,1.2,0,.6,0,0xb48a58,0)];for(const s of[-1,1]){p.push(B(1.24,.14,1.24,0,.6+s*.53,0,0x7a5632,0),B(.14,1.24,1.24,s*.53,.6,0,0x7a5632,0),B(1.24,1.24,.14,0,.6,s*.53,0x7a5632,0));}
 p.push(B(1.26,.12,1.5,0,.6,0,0x8a6438,0,Math.PI/4,0,0));return mergeT(p);}
function hayGeo(){const p=[CY(.62,.62,1.3,0,.62,0,0xd8b860,0,14,0,0,Math.PI/2)];for(const x of[-.3,.3])p.push(CY(.635,.635,.04,x,.62,0,0x9a7a3a,0,14,0,0,Math.PI/2));return mergeT(p);}
function lampGeo(){const p=[CY(.07,.1,4.4,0,2.2,0,0x2e3338,0,8),CY(.18,.22,.3,0,.15,0,0x2e3338,0,8),B(.08,.08,.9,0,4.3,.4,0x2e3338,0),RB(.42,.18,.42,0,4.26,.85,0x2e3338,0,.05),B(.32,.06,.32,0,4.15,.85,0xfff2c8,0)];return mergeT(p);}
function mailGeo(){return mergeT([B(.08,1,.08,0,.5,0,0x5a4030,0),RB(.26,.28,.46,0,1.1,0,0xffffff,1,.1),B(.03,.16,.06,.15,1.2,-.1,0xd03030,0)]);}

export const PROPS={fence:{geo:fenceGeo,yield:0,max:90,dc:0xeee8dc},rail:{geo:railGeo,yield:0,max:110,dc:0x8e6a44},car:{geo:carGeo,yield:2,max:420,dc:0x9aa0a8},barrel:{geo:barrelGeo,yield:2,max:160,dc:0x7a8088},
 crate:{geo:crateGeo,yield:0,max:120,dc:0xb48a58},hay:{geo:hayGeo,yield:0,max:80,dc:0xd8b860},lamp:{geo:lampGeo,max:1e9},mail:{geo:mailGeo,yield:2,max:40,dc:0x7a8088}};
const CARCOL=[0xc8302a,0x2a5ab8,0xe8e4dc,0x2e3a44,0x3a7a4a,0xe0a020,0x7a1e2e,0x9aa4ae];
const PAINT=[0xffffff,0xf4ead8,0xdfe8ec,0xe8d8c8];

// place props for the world's locations: pushes obstacles via world.addObs and records instance slots
export function layoutProps(W){const r=rng(4242),R=()=>r();const list=W.props=[];
 const free=(x,z,pad)=>!W.inHouse(x,z,pad)&&W.heightAt(x,z)>1.4;
 const add=(k,x,z,ry,extra={})=>{const y=W.heightAt(x,z);const o={k,x,z,y,ry,...extra};const P=PROPS[k];
  if(k==='fence'||k==='rail'){const c=Math.cos(ry),s=Math.sin(ry),hx=Math.abs(c)*1.02+Math.abs(s)*.1,hz=Math.abs(s)*1.02+Math.abs(c)*.1;o.b=[x-hx,y-.2,z-hz,x+hx,y+(k==='rail'?1.35:1.1),z+hz];}
  else if(k==='car'){const c=Math.abs(Math.cos(ry)),s=Math.abs(Math.sin(ry)),hx=c*.95+s*2.15,hz=s*.95+c*2.15;o.b=[x-hx,y-.2,z-hz,x+hx,y+1.5,z+hz];}
  else if(k==='crate'){o.b=[x-.62,y-.2,z-.62,x+.62,y+1.2,z+.62];}
  else if(k==='hay'){const c=Math.abs(Math.cos(ry)),s=Math.abs(Math.sin(ry)),hx=c*.66+s*.62,hz=s*.66+c*.62;o.b=[x-hx,y-.2,z-hz,x+hx,y+1.24,z+hz];}
  else{o.r=k==='barrel'?.42:k==='lamp'?.14:.14;o.y0=y-.5;o.y1=y+(k==='barrel'?1.16:k==='lamp'?4.5:1.25);}
  if(o.b){o.y0=o.b[1];o.y1=o.b[4];}o.max=P.max;o.yield=P.yield;o.dc=P.dc;if(k==='lamp')o.k='prop',o.kind='lamp';else o.kind=k;
  W.addObs(o);list.push(o);return o;};
 for(const h of W.houses){const poi=h.poi.kind;const D=[[0,1],[1,0],[0,-1],[-1,0]][h.door],d=W.doorOut(h);
  // picket fence across the front yard with a gate gap at the path
  if((poi==='suburb'||poi==='village'||poi==='lake')&&R()<.75){const off=4.2,cx=d.x+D[0]*(off-4.2+2.4),cz=d.z+D[1]*(off-4.2+2.4),px=-D[1],pz=D[0],span=(h.door%2?h.d:h.w)*2+3,ry=Math.atan2(pz,px)*-1;const paint=PAINT[R()*PAINT.length|0];
   for(let t=-span;t<=span;t+=2){if(Math.abs(t)<1.6)continue;const x=cx+px*t,z=cz+pz*t;if(free(x,z,1.2))add('fence',x,z,Math.atan2(-pz,px),{tint:paint});}
   if(R()<.7){const x=cx+px*2.6,z=cz+pz*2.6;if(free(x,z,1))add('mail',x+D[0]*.6,z+D[1]*.6,0,{tint:[0xd03030,0x3060c0,0x404850,0xf0f0f0][R()*4|0]});}}
  // car parked beside the house
  if((poi==='suburb'||poi==='village'||poi==='yard'||poi==='lake')&&R()<.6){const side=R()<.5?1:-1,px=-D[1]*side,pz=D[0]*side,hw=(h.door%2?h.d:h.w)*2;const x=d.x+px*(hw+2.2)-D[0]*1.5,z=d.z+pz*(hw+2.2)-D[1]*1.5;
   if(free(x,z,2.6)&&W.clearOf(x,z,1.8))add('car',x,z,Math.atan2(D[0],D[1])+(R()-.5)*.25,{tint:CARCOL[R()*CARCOL.length|0]});}
  if(h.kind==='warehouse'||poi==='docks'){for(let i=0;i<5;i++){const a=R()*6.28,rr=8+R()*6,x=h.cx+Math.cos(a)*rr,z=h.cz+Math.sin(a)*rr;if(free(x,z,1.5))add(R()<.5?'barrel':'crate',x,z,R()*6.28,{tint:[0x2a5ab8,0xc8402a,0x3a8a4a,0xe0a020][R()*4|0]});}}
  if(h.kind==='barn'){for(let i=0;i<9;i++){const a=R()*6.28,rr=9+R()*9,x=h.cx+Math.cos(a)*rr,z=h.cz+Math.sin(a)*rr;if(free(x,z,1.5))add('hay',x,z,R()*6.28);}}}
 // ranch corral: rail fence ring
 {const rn=W.pois.find(p=>p.kind==='ranch');if(rn){const cx=rn.x+16,cz=rn.z-12,rad=11;for(let i=0;i<34;i++){if(i>=31)continue;const a=i/34*6.28,x=cx+Math.cos(a)*rad,z=cz+Math.sin(a)*rad;if(free(x,z,1))add('rail',x,z,-a+Math.PI/2);}}}
 // street lamps along the paths inside the suburbs and village
 for(const poi of W.pois){if(poi.kind!=='suburb'&&poi.kind!=='village'&&poi.kind!=='docks')continue;for(const s of W.paths){const mx=(s[0]+s[2])/2,mz=(s[1]+s[3])/2;if(Math.hypot(mx-poi.x,mz-poi.z)>poi.r*1.1)continue;const L=Math.hypot(s[2]-s[0],s[3]-s[1]);if(L<10)continue;
   const t=.5,x=s[0]+(s[2]-s[0])*t+(s[3]-s[1])/L*2.6,z=s[1]+(s[3]-s[1])*t-(s[2]-s[0])/L*2.6;if(free(x,z,2)&&W.clearOf(x,z,1))add('lamp',x,z,Math.atan2(-(s[3]-s[1]),(s[2]-s[0])));}}
 // yard + quarry + docks clutter
 for(const poi of W.pois){const n={yard:14,quarry:8,docks:10}[poi.kind];if(!n)continue;for(let i=0;i<n*3&&n>0;i++){const a=R()*6.28,rr=Math.sqrt(R())*poi.r,x=poi.x+Math.cos(a)*rr,z=poi.z+Math.sin(a)*rr;if(!free(x,z,2)||!W.clearOf(x,z,1))continue;
   add(R()<.55?'barrel':'crate',x,z,R()*6.28,{tint:[0x2a5ab8,0xc8402a,0x3a8a4a,0xe0a020,0x5a6068][R()*5|0]});}}}

export function buildProps(W,scene){const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.15,envMapIntensity:.9});
 const grime=ctex(256,256,(x,w,h)=>{x.fillStyle='#e8e8e8';x.fillRect(0,0,w,h);for(let i=0;i<4000;i++){const v=170+Math.random()*85|0;x.fillStyle=`rgba(${v},${v},${v},.5)`;x.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1);}for(let i=0;i<40;i++){x.fillStyle=`rgba(90,80,60,${Math.random()*.2})`;x.beginPath();x.arc(Math.random()*w,Math.random()*h,4+Math.random()*16,0,7);x.fill();}});
 mat.map=grime;mat.normalMap=normalFrom(grime.image,1.5);mat.normalScale=new THREE.Vector2(.4,.4);
 mat.onBeforeCompile=s=>{s.vertexShader='attribute float aT;\n'+s.vertexShader.replace('#include <color_vertex>',`vColor=color;
#ifdef USE_INSTANCING_COLOR
 vColor*=mix(vec3(1.),instanceColor.rgb,aT);
#endif`);};mat.customProgramCacheKey=()=>'royale-props';
 const out={};for(const k in PROPS){const items=W.props.filter(o=>o.kind===k);if(!items.length)continue;const im=new THREE.InstancedMesh(PROPS[k].geo(),mat,items.length);
  items.forEach((o,i)=>{o.inst={mesh:im,i,m:M(o.x,o.y-.03,o.z,0,o.ry,0)};im.setMatrixAt(i,o.inst.m);im.setColorAt(i,new THREE.Color(o.tint??0xffffff));});
  if(!im.instanceColor)im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(items.length*3).fill(1),3);
  im.castShadow=im.receiveShadow=true;im.computeBoundingSphere();scene.add(im);out[k]=im;}
 // LOW quality: every prop merged into ONE static mesh (a single draw call instead of one per type); a tiny
 // per-prop alive texture read in the vertex shader collapses destroyed props to a point
 const all=W.props,N=all.length,TW=64,TH=Math.max(1,Math.ceil(N/TW)),alive=new Uint8Array(TW*TH*4).fill(255),aTex=new THREE.DataTexture(alive,TW,TH);aTex.needsUpdate=true;
 const geos={};let n=0;for(const o of all){const g=geos[o.kind]||(geos[o.kind]=PROPS[o.kind].geo());n+=g.attributes.position.count;}
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3),pid=new Float32Array(n),v=new V(),nm=new THREE.Matrix3(),tc=new THREE.Color();let q=0;
 all.forEach((o,j)=>{o.lowId=j;const g=geos[o.kind],P=g.attributes.position,Nn=g.attributes.normal,U=g.attributes.uv,C=g.attributes.color,T=g.attributes.aT,m=o.inst.m;nm.getNormalMatrix(m);tc.set(o.tint??0xffffff);
  for(let i=0;i<P.count;i++,q++){v.fromBufferAttribute(P,i).applyMatrix4(m);pos.set([v.x,v.y,v.z],q*3);v.fromBufferAttribute(Nn,i).applyMatrix3(nm).normalize();nor.set([v.x,v.y,v.z],q*3);uv[q*2]=U.getX(i);uv[q*2+1]=U.getY(i);
   const t=T.getX(i);col[q*3]=C.getX(i)*(1+(tc.r-1)*t);col[q*3+1]=C.getY(i)*(1+(tc.g-1)*t);col[q*3+2]=C.getZ(i)*(1+(tc.b-1)*t);pid[q]=j;}});
 const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(pos,3));lg.setAttribute('normal',new THREE.BufferAttribute(nor,3));lg.setAttribute('uv',new THREE.BufferAttribute(uv,2));lg.setAttribute('color',new THREE.BufferAttribute(col,3));lg.setAttribute('aPid',new THREE.BufferAttribute(pid,1));lg.computeBoundingSphere();
 const lm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.15,envMapIntensity:.9,map:grime});
 lm.onBeforeCompile=s=>{s.uniforms.uAlive={value:aTex};s.vertexShader='attribute float aPid;\nuniform sampler2D uAlive;\n'+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 transformed*=step(.5,texture2D(uAlive,vec2((mod(aPid,${TW}.)+.5)/${TW}.,(floor(aPid/${TW}.)+.5)/${TH}.)).r);`);};lm.customProgramCacheKey=()=>'royale-props-low';
 const low=new THREE.Mesh(lg,lm);low.visible=false;scene.add(low);
 const setAlive=(j,on)=>{const b=on?255:0;if(alive[j*4]===b)return;alive[j*4]=b;aTex.needsUpdate=true;};
 return {types:out,low,setAlive,setQuality(q){low.visible=q===0;for(const k in out)out[k].visible=q>0;}};}
