// NEON BAY — turns the World layout into meshes: terrain, streets, freeway/ramps/bridges/tunnel, block slabs,
// chunk-streamed instanced buildings with a procedural facade shader, and distance-streamed instanced props.
import {THREE,M,merge,cl,lerp,hash2,rng} from './util.js';
import {XS,ZS,RW,WALK,SLAB,WL,CANAL,QUAY,BEACH,FWY_Y,FWY_HW,polyAt} from './world.js';
import * as TX from './tex.js';
import {parkedGeo,parkedMat} from './vehicles.js';
const V=THREE.Vector3;

/* ---------- material helpers ---------- */
// wet road: darker + glossier with rain, puddles from world-space noise, rain ripples, optional planar reflection (ultra)
const NOISE2=`float wh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float wn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wh(i),wh(i+vec2(1,0)),f.x),mix(wh(i+vec2(0,1)),wh(i+vec2(1,1)),f.x),f.y);}`;
function wetify(mat,U,refl,o={}){const pud=o.puddles??1;mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{uWet:U.uWet,uTime:U.uTime,uRain:U.uRain});if(refl)Object.assign(sh.uniforms,refl.U);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWq;'+(refl?'uniform mat4 uTexMat;varying vec4 vRefl;':'')).replace('#include <project_vertex>','#include <project_vertex>\nvWq=(modelMatrix*vec4(transformed,1.)).xyz;'+(refl?'vRefl=uTexMat*modelMatrix*vec4(transformed,1.);':''));
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uWet,uTime,uRain;varying vec3 vWq;float gPud=0.;float gWetD=0.;'+NOISE2+(refl?'uniform sampler2D tRefl;uniform float uReflStr;varying vec4 vRefl;':''))
  .replace('#include <color_fragment>',`#include <color_fragment>
  {float n=wn(vWq.xz*.085)*.62+wn(vWq.xz*.33+7.)*.38;float th=.7-.2*uWet;gPud=${pud.toFixed(2)}*smoothstep(th,th+.035,n)*smoothstep(.04,.25,uWet);gWetD=clamp(uWet*1.5,0.,1.);
   diffuseColor.rgb*=mix(1.,.52,gWetD);diffuseColor.rgb*=mix(1.,.5,gPud);}`)
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.2+.18*wn(vWq.xz*1.7),gWetD*.85);roughnessFactor=mix(roughnessFactor,.025,gPud);')
  .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  normal=normalize(mix(normal,nonPerturbedNormal,gPud*.92+gWetD*.25));
  if(uRain>.05){vec2 rp=vWq.xz*2.2;vec2 ci=floor(rp);vec2 rv=vec2(0.);for(int k=0;k<4;k++){vec2 c=ci+vec2(k%2,k/2);float h=wh(c);vec2 ctr=c+vec2(wh(c+3.1),wh(c+7.7));float t=fract(uTime*1.1+h);vec2 d=rp-ctr;float r=length(d);float ring=sin((r-t*.9)*38.)*exp(-pow((r-t*.9)*9.,2.))*(1.-t);rv+=d/max(r,1e-3)*ring;}
   normal=normalize(normal+(mat3(viewMatrix)*vec3(rv.x,0.,rv.y))*.45*uRain*(.25+gPud));}`);
 if(refl){sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',`{vec2 ruv=vRefl.xy/vRefl.w;vec2 j=(normal.xy-nonPerturbedNormal.xy)*.06;vec3 rc=vec3(0.);float sp=mix(.018,.002,gPud);
   for(int k=-2;k<=2;k++)rc+=texture2D(tRefl,ruv+j+vec2(0.,float(k)*sp)).rgb;rc*=.2;
   float fr=.3+.7*pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);outgoingLight+=rc*uReflStr*fr*(gWetD*.45+gPud*.9);}
   #include <opaque_fragment>`);}};
 mat.customProgramCacheKey=()=>(refl?'wetR':'wet')+pud;return mat;}
// unlit glow material whose brightness follows night (and optionally a per-instance atlas cell)
function glowMat(U,o={}){const m=new THREE.MeshBasicMaterial({color:o.color??0xffffff,map:o.map||null,vertexColors:!!o.vc,transparent:!!o.transparent,depthWrite:!o.transparent,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending,side:o.side||THREE.FrontSide,fog:o.fog??true});
 const day=o.day??.6,night=o.night??2.4;m.onBeforeCompile=sh=>{sh.uniforms.uNight=U.uNight;sh.uniforms.uTime=U.uTime;
  if(o.cells){sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aCell;varying float vFl;').replace('#include <uv_vertex>',`#include <uv_vertex>\nvMapUv=vMapUv*vec2(${1/TX.ATLAS.cols},${1/TX.ATLAS.rows})+aCell;vFl=fract(aCell.x*7.3+aCell.y*3.1+instanceMatrix[3].x*.013);`);}
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight,uTime;'+(o.cells?'varying float vFl;':''))
   .replace('#include <map_fragment>',`#include <map_fragment>\nfloat bo=mix(${day.toFixed(3)},${night.toFixed(3)},uNight);${o.cells?'bo*=1.-.6*step(.93,fract(sin(floor(uTime*9.+vFl*50.))*43758.5))*step(.7,vFl)*uNight;':''}diffuseColor.rgb*=bo;${o.alphaNight?'diffuseColor.a*=uNight;':''}`);};
 m.customProgramCacheKey=()=>'glow'+(o.cells?'c':'')+day+night+(o.alphaNight?'a':'');return m;}

/* ---------- geometry helpers ---------- */
function ribbon(P,hw,o={}){const pos=[],uv=[],idx=[];const yo=o.y||0,vs=o.v||16,l0=o.l??-hw,l1=o.r??hw;for(let i=0;i<P.length;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)];let tx=b.x-a.x,tz=b.z-a.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;const rx=-tz,rz=tx,p=P[i],y=(p.y??0)+yo;
  pos.push(p.x+rx*l0,y,p.z+rz*l0,p.x+rx*l1,y,p.z+rz*l1);uv.push(0,p.s/vs,1,p.s/vs);}
 for(let i=0;i<P.length-1;i++){if(o.mask&&!(o.mask(i)&&o.mask(i+1)))continue;const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();if(o.flip){const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,-n.getX(i),-n.getY(i),-n.getZ(i));}return g;}
// vertical wall strip at lateral offset `lat` from y0 to y1 (relative to the polyline height unless abs)
function wallStrip(P,lat,y0,y1,o={}){const pos=[],uv=[],idx=[];for(let i=0;i<P.length;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)];let tx=b.x-a.x,tz=b.z-a.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;const p=P[i],x=p.x-tz*lat,z=p.z+tx*lat,y=o.abs?0:(p.y??0);
  pos.push(x,y+y0,z,x,y+y1,z);uv.push(p.s/(o.v||8),0,p.s/(o.v||8),(y1-y0)/(o.v||8));}
 for(let i=0;i<P.length-1;i++){if(o.mask&&!(o.mask(i)&&o.mask(i+1)))continue;const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function mergeIdx(gs){const list=gs.filter(Boolean).map(g=>[g]);return merge(list);}
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);

/* ---------- distance-streamed instanced prop set ---------- */
const _fw=new V();
class PropSet{constructor(scene,geo,mat,items,mk,o={}){this.items=items;this.n=items.length;this.mats=new Float32Array(this.n*16);this.cols=o.color?new Float32Array(this.n*3):null;this.pos=new Float32Array(this.n*2);this.R=o.range||420;this.qR=o.qR||null;this.cull=!!o.cull;
  const m4=new THREE.Matrix4(),c=new THREE.Color();items.forEach((it,i)=>{mk(it,m4,c);m4.toArray(this.mats,i*16);if(this.cols){this.cols[i*3]=c.r;this.cols[i*3+1]=c.g;this.cols[i*3+2]=c.b;}this.pos[i*2]=it.x;this.pos[i*2+1]=it.z;});
  this.mesh=new THREE.InstancedMesh(geo,mat,Math.max(1,this.n));this.mesh.count=0;this.mesh.castShadow=!!o.shadow;this.mesh.receiveShadow=o.receive??true;this.mesh.frustumCulled=false;if(this.cols)this.mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1,this.n)*3),3);
  if(o.extra){this.extra=o.extra;this.extraData=new Float32Array(this.n*o.extra.size);items.forEach((it,i)=>o.extra.fill(it,this.extraData,i*o.extra.size));this.extraAttr=new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1,this.n)*o.extra.size),o.extra.size);geo.setAttribute(o.extra.name,this.extraAttr);}
  this.map=new Int32Array(this.n);scene.add(this.mesh);this.lx=1e9;this.lz=1e9;}
 refresh(x,z,force,cam){if(this.cull&&cam){cam.getWorldDirection(_fw);const yaw=Math.atan2(_fw.x,_fw.z);if(Math.abs(yaw-(this.lyaw??99))>.12){this.lyaw=yaw;force=true;}this.fx=_fw.x;this.fz=_fw.z;const l=Math.hypot(this.fx,this.fz)||1;this.fx/=l;this.fz/=l;this.cosF=Math.cos(Math.min(Math.PI*.95,cam.fov*Math.PI/180*.5*Math.max(1,cam.aspect)+.5));}
  if(!force&&Math.hypot(x-this.lx,z-this.lz)<(this.cull?8:24))return;this.lx=x;this.lz=z;const cu=this.cull&&this.fx!=null;const R2=this.R*this.R,im=this.mesh.instanceMatrix.array,ic=this.mesh.instanceColor?this.mesh.instanceColor.array:null;let k=0;const ex=this.extra?this.extra.size:0;
  for(let i=0;i<this.n;i++){const dx=this.pos[i*2]-x,dz=this.pos[i*2+1]-z;const d2=dx*dx+dz*dz;if(d2>R2||this.items[i].dead)continue;if(cu&&d2>400){const dd=Math.sqrt(d2);if((dx*this.fx+dz*this.fz)/dd<this.cosF-12/dd)continue;}for(let j=0;j<16;j++)im[k*16+j]=this.mats[i*16+j];if(ic){ic[k*3]=this.cols[i*3];ic[k*3+1]=this.cols[i*3+1];ic[k*3+2]=this.cols[i*3+2];}
   if(ex)for(let j=0;j<ex;j++)this.extraAttr.array[k*ex+j]=this.extraData[i*ex+j];this.map[k]=i;k++;}
  this.mesh.count=k;this.mesh.visible=k>0;this.mesh.instanceMatrix.needsUpdate=true;if(ic)this.mesh.instanceColor.needsUpdate=true;if(ex)this.extraAttr.needsUpdate=true;}}

/* ---------- building facade material ---------- */
// unit building: outer walls + parapet cap + inner parapet walls + roof deck sunk 0.9 m (metric offsets survive the per-instance scale)
function buildingGeo(){const pos=[],nor=[],off=[],idx=[];const P=.38,D=-.95;
 const quad=(v,n,o,k)=>{const b=pos.length/3;for(let i=0;i<4;i++){pos.push(...v[i]);nor.push(...n);off.push(...o[i],k);}idx.push(b,b+1,b+2,b,b+2,b+3);};
 const sides=[[1,0],[-1,0],[0,1],[0,-1]];
 for(const[nx,nz]of sides){const tx=-nz,tz=nx;const c=(s,y)=>[nx*.5+tx*.5*s,y,nz*.5+tz*.5*s];
  quad([c(-1,0),c(1,0),c(1,1),c(-1,1)],[nx,0,nz],[[0,0,0],[0,0,0],[0,0,0],[0,0,0]],0);
  // parapet cap: outer edge -> inner edge
  const io=s=>[-nx*P-tx*P*s,0,-nz*P-tz*P*s];quad([c(-1,1),c(1,1),c(1,1),c(-1,1)],[0,1,0],[[0,0,0],[0,0,0],io(1),io(-1)],1);
  // inner parapet wall facing the roof
  const ib=s=>{const o=io(s);return[o[0],D,o[2]];};quad([c(1,1),c(-1,1),c(-1,1),c(1,1)],[-nx,0,-nz],[io(1),io(-1),ib(-1),ib(1)],1);}
 // roof deck
 quad([[-.5,1,.5],[.5,1,.5],[.5,1,-.5],[-.5,1,-.5]],[0,1,0],[[P,D,-P],[-P,D,-P],[-P,D,P],[P,D,P]],2);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('aO',new THREE.Float32BufferAttribute(off,4));g.setIndex(idx);
 // fix winding so every face is front-facing along its normal
 const ix=g.index.array,pp=g.attributes.position.array,oo=g.attributes.aO.array,nn=g.attributes.normal.array,v=k=>new V(pp[k*3]+oo[k*4]*.1,pp[k*3+1]+oo[k*4+1]*.1,pp[k*3+2]+oo[k*4+2]*.1);
 for(let t=0;t<ix.length;t+=3){const A=v(ix[t]),B=v(ix[t+1]),C=v(ix[t+2]);const n=new V().subVectors(B,A).cross(new V().subVectors(C,A));if(n.dot(new V(nn[ix[t]*3],nn[ix[t]*3+1],nn[ix[t]*3+2]))<0){const tmp=ix[t+1];ix[t+1]=ix[t+2];ix[t+2]=tmp;}}
 return g;}
const FACADE=`
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float hs1(float n){return fract(sin(n*78.233+.17)*43758.5453);}
const float BAY[7]=float[7](1.6,3.2,3.0,3.4,6.0,3.3,3.0);
const float FLH[7]=float[7](3.9,3.6,3.3,2.9,6.0,3.6,3.4);
const float WWF[7]=float[7](.96,.5,.56,.42,.55,.54,.6);
const float WHF[7]=float[7](.72,.56,.5,.46,.22,.58,.5);
// facade layout: returns x=window mask, y=frame mask, z=height (bump), w=store mask; cell + f out
vec4 facade(vec2 p,float fw,float fh,int si,float aa,out vec2 cell,out vec2 f,out vec2 csz){
 float bay=BAY[si],flh=FLH[si];float g0=(si==5||si==6)?4.3:0.;
 float nb=max(1.,floor(fw/bay+.5)),bw=fw/nb;csz=vec2(bw,flh);
 vec2 q=vec2(p.x/bw,(p.y-g0)/flh);cell=floor(q);f=fract(q);
 float ww=WWF[si],wh=WHF[si];vec2 dm=(abs(f-vec2(.5,.52))-vec2(ww,wh)*.5)*csz;
 float top=fh-(si==3?.45:si==0?.6:1.4);float valid=step(g0+.5,p.y)*step(p.y,top);if(si==4)valid*=step(fh-4.8,p.y);
 float m=max(dm.x,dm.y);float win=(1.-smoothstep(-aa,aa,m))*valid;
 float fr=win*smoothstep(-.09-aa,-.07+aa,m);
 if(si==1||si==2||si==3||si==5)fr=max(fr,win*(1.-smoothstep(.03,.03+aa,abs((f.x-.5)*bw))));
 if(si==3)fr=max(fr,win*(1.-smoothstep(.025,.025+aa,abs((f.y-.62)*flh))));
 if(si==0){win=valid*(1.-smoothstep(.45,.45+aa,abs((f.y-.38)*flh)-flh*.38+.45));fr=valid*(1.-smoothstep(.035,.035+aa,min(abs(f.x*bw),abs((1.-f.x)*bw))));}
 float h=-.16*win*(1.-fr);
 float yb=(.52-wh*.5)*flh,yc=f.y*flh;
 if(si!=0&&si!=4){h+=.06*valid*step(abs(dm.x+.05),.0+.1)*step(dm.x,.08)*step(yb-.13,yc)*step(yc,yb)*(1.-win);}
 if(si==1||si==5){float lg=step(yc,.22)*step(g0+.1,p.y);h+=.07*lg;}
 if(si==2){float yt=(.52+wh*.5)*flh;h+=.12*step(yt,yc)*step(yc,yt+.16)*step(p.y,top);}
 if(si==4)h+=.025*sin(p.x*31.4)*(1.-smoothstep(.02,.08,aa));
 if(si==1)h-=.012*(step(fract(p.x/bw+.004),.008)+step(f.y,.01));
 float store=0.;if(g0>0.){store=step(.4,p.y)*step(p.y,3.5);float sb=2.6;float sx=fract(p.x/sb);float mul=1.-smoothstep(.02,.02+aa/sb,min(sx,1.-sx));
  store*=1.-max(mul*0.,0.);h+=-.22*store+.12*step(3.5,p.y)*step(p.y,4.2)+.04*step(p.y,.4);
  if(store>.5){fr=max(fr,store*(1.-smoothstep(.04,.04+aa,min(sx,1.-sx)*sb)));fr=max(fr,store*step(2.75,p.y)*step(p.y,2.85));}}
 return vec4(win,fr,h,store);}
// shop interior: shelving with products on back + side walls, tiled floor, bright ceiling panels
vec3 shopRoom(vec2 cf,vec2 cs,vec3 d,float sd,float depth,out float ceil){vec3 p=vec3(cf*cs,0.);d.z=max(d.z,.05);
 float tx=((d.x>0.?cs.x:0.)-p.x)/(abs(d.x)<1e-4?1e-4:d.x);float ty=((d.y>0.?cs.y:0.)-p.y)/(abs(d.y)<1e-4?1e-4:d.y);float tz=depth/d.z;float t=min(min(tx,ty),tz);vec3 h=p+d*t;ceil=0.;vec3 c;
 vec3 tone=mix(vec3(.9,.86,.8),mix(vec3(.75,.85,.9),vec3(.95,.8,.75),hs1(sd*5.)),hs1(sd*3.));
 if(t==tz||t==tx){float u=t==tz?h.x:h.z;float shelf=step(fract(h.y/.48),.12);vec2 pc=vec2(floor(u/.22),floor(h.y/.48));float pr=hs(pc+sd);
  vec3 prod=mix(vec3(.62,.3,.26),mix(vec3(.3,.42,.6),vec3(.7,.62,.36),step(.5,hs(pc*1.7+sd))),step(.35,pr))*(.4+.4*hs(pc*2.3));prod=mix(prod,vec3(.55,.52,.48),.35);
  c=h.y<2.1&&h.y>.15?mix(prod,vec3(.75,.7,.62),shelf):tone*(t==tz?.95:.8);if(step(.75,fract(u/.22))>0.&&h.y<2.1)c*=.6;}
 else if(d.y>0.){c=vec3(.95);ceil=1.;c+=step(.7,fract(h.z/1.2))*step(.5,fract(h.x/1.3))*1.5;}
 else{vec2 tl=floor(h.xz/.5);c=mix(vec3(.82,.8,.76),vec3(.62,.6,.58),mod(tl.x+tl.y,2.));}
 return c*mix(1.,.6,clamp(t/(depth*1.4),0.,1.));}
// interior mapping: a box room behind each window seen along the view ray (face space: x along wall, y up, z into the wall)
vec3 room(vec2 cf,vec2 cs,vec3 d,float sd,float depth,out float ceil){vec3 p=vec3(cf*cs,0.);d.z=max(d.z,.05);
 float tx=((d.x>0.?cs.x:0.)-p.x)/(abs(d.x)<1e-4?1e-4:d.x);float ty=((d.y>0.?cs.y:0.)-p.y)/(abs(d.y)<1e-4?1e-4:d.y);float tz=depth/d.z;float t=min(min(tx,ty),tz);vec3 h=p+d*t;
 vec3 wc=mix(vec3(.78,.72,.62),mix(vec3(.55,.62,.72),vec3(.72,.55,.5),hs1(sd*7.)),hs1(sd*3.1));vec3 c;ceil=0.;
 if(t==tz){c=wc*.9;float fx=cs.x*(.25+.5*hs1(sd));float furn=step(h.y,cs.y*(.25+.12*hs1(sd+9.)))*step(abs(h.x-fx),cs.x*(.18+.12*hs1(sd+2.)));c=mix(c,vec3(.16,.13,.12)+.22*vec3(hs1(sd+1.),hs1(sd+2.),hs1(sd+3.)),furn);
  float art=step(abs(h.y-cs.y*.62),.28)*step(abs(h.x-cs.x*.62),.32)*step(.45,hs1(sd+4.));c=mix(c,vec3(hs1(sd+5.),hs1(sd+6.),hs1(sd+8.))*.8+.1,art);}
 else if(t==tx)c=wc*.72;else if(d.y>0.){c=vec3(.9,.89,.86);ceil=1.;}else c=mix(vec3(.3,.2,.13),vec3(.42,.42,.44),step(.6,hs1(sd+6.)));
 return c*mix(1.,.5,clamp(t/(depth*1.4),0.,1.));}
`;
function buildingMat(U,tGrime){const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8,metalness:0,envMapIntensity:1});m.userData.q={value:2};
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{uNight:U.uNight,uTime:U.uTime,uWet:U.uWet,tGrime:{value:tGrime},uQ:m.userData.q});
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 aB;attribute vec4 aO;varying vec3 vLp;varying vec3 vLn;varying vec3 vSz;varying vec4 vB;varying float vK;varying vec3 vWp;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 szz=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));transformed=position+aO.xyz/szz;vLp=transformed*szz;vLn=normal;vSz=szz;vB=aB;vK=aO.w;vWp=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
uniform float uNight,uTime,uWet,uQ;uniform sampler2D tGrime;varying vec3 vLp;varying vec3 vLn;varying vec3 vSz;varying vec4 vB;varying float vK;varying vec3 vWp;float gR=.8;float gM=0.;vec3 gE=vec3(0.);vec2 gBump=vec2(0.);vec3 gT=vec3(1.,0.,0.);float gFace=0.;
${FACADE}`)
  .replace('#include <color_fragment>',`#include <color_fragment>
{vec3 wc=diffuseColor.rgb;int si=int(floor(vB.x+.5));float sd=floor(vB.y+.5),lf=vB.z;vec3 sz=floor(vSz*8.+.5)/8.;
 float ux=step(.5,abs(vLn.x));float fw=mix(sz.x,sz.z,ux);float fu=mix(vLp.x,vLp.z,ux)+fw*.5;float fv=vLp.y;vec3 N=normalize(vLn);gT=ux>.5?vec3(0.,0.,1.):vec3(1.,0.,0.);
 float pf=max(length(fwidth(vLp)),1e-3);float aa=pf*.7;
 vec2 gs=vec2(fu*.11+sd*.37,fv*.07);vec4 gm=texture2D(tGrime,gs);float streak=gm.r,blot=gm.g;
 if(vK>1.5){// roof deck: gravel + membrane patches + puddles
  float n=hs(floor(vLp.xz*3.));vec3 rc=mix(vec3(.34,.33,.31),vec3(.4,.39,.37),n)*(.85+.3*blot);float pch=step(.72,hs(floor(vLp.xz/6.)+sd));rc=mix(rc,vec3(.26,.26,.27),pch*.4);
  diffuseColor.rgb=rc;gR=mix(.95,.25,uWet*pch);}
 else if(vK>.5){// parapet: coping on top, render inside
  float top=step(.5,vLn.y);diffuseColor.rgb=mix(wc*.62,mix(wc*.55,vec3(.72,.7,.66),.6),top)*(.9+.2*blot);gR=.9;}
 else{gFace=1.;vec2 cell,f,cs;vec4 F=facade(vec2(fu,fv),fw,sz.y,si,aa,cell,f,cs);float win=F.x,fr=F.y,store=F.w;
  if(uQ>.5){float e=clamp(pf*.8,.02,.25);vec2 c2,f2,s2;float hx=facade(vec2(fu+e,fv),fw,sz.y,si,aa,c2,f2,s2).z,hy=facade(vec2(fu,fv+e),fw,sz.y,si,aa,c2,f2,s2).z;gBump=vec2(hx-F.z,hy-F.z)/e*.55*(1.-smoothstep(.15,.6,pf));}
  // wall surface per style
  vec3 wall=wc;float wr=.88,wm=0.;
  if(si==0){wall=wc*.32+vec3(.02,.025,.03);wr=.32;wm=.6;}
  else if(si==5){vec2 bp=vec2(fu,fv)/vec2(.23,.075);bp.x+=.5*mod(floor(bp.y),2.);vec2 bi=floor(bp),bf=fract(bp);float mort=max(step(bf.y,.14),step(bf.x,.05));float bv=hs(bi+sd);
   vec3 brick=wc*(.78+.4*bv)*mix(vec3(1.),vec3(1.08,.92,.85),step(.8,hs(bi*1.3)));float fade=smoothstep(.02,.06,pf);brick=mix(brick,wc*.95,fade);wall=mix(brick,vec3(.62,.6,.56),mort*(1.-fade));if(uQ>.5)gBump-=vec2(0.,(step(bf.y,.14)-.14)*.25)*(1.-fade);}
  else if(si==4){wall=wc*(.85+.15*sin(fu*31.4)*(1.-smoothstep(.02,.08,pf)));wr=.5;wm=.45;}
  else if(si==1){wall=wc*(.9+.12*hs(cell+sd*.1));}
  else{wall=wc*(.95+.08*blot);}
  // weathering: rain streaks from sills, dirt near the ground and under the roofline
  float drip=streak*(1.-smoothstep(0.,2.5,fract((fv-.4)/FLH[si])*FLH[si]))*.0+streak*.5;wall*=1.-.22*drip-.14*blot;wall*=mix(.62,1.,smoothstep(0.,2.2,fv));wall*=mix(1.,.82,smoothstep(sz.y-1.5,sz.y,fv));
  wall*=mix(1.,.6,uWet*(.4+.6*streak));wr=mix(wr,.35,uWet*.7);
  // windows: reflective glass in front of an interior room
  vec3 Vw=normalize(vWp-cameraPosition);vec3 vf=vec3(dot(Vw,gT),Vw.y,-dot(Vw,N));
  float wseed=hs(cell*vec2(.371,.613)+vec2(sd*.17,N.x*3.+N.z*5.));float lit=step(wseed,lf*(.7+.3*uNight));
  vec3 glassC;float gr=.04,gm2=0.;vec3 em=vec3(0.);
  if(si==0){glassC=mix(wc,vec3(.6,.7,.75),.5)*.55;gr=.035;gm2=.92;float fl=step(hs(vec2(cell.y,sd)),lf*.9)*step(.35,hs(cell+3.));em=vec3(.75,.85,1.)*fl*.55;
   if(uQ>.5){float cl;vec3 rm=room(f,cs,vf,wseed*91.,6.,cl);em=rm*vec3(.9,.95,1.)*fl*(.5+cl*.6);}}
  else{float cl=0.;vec3 rm=vec3(.25);if(uQ>.5)rm=room(f,cs,vf,wseed*91.,cs.x*.9,cl);float blind=step(.62,hs1(wseed*13.));float bl=blind*step(1.-(.25+.5*hs1(wseed*5.)),(f.y-(.52-WHF[si]*.5))/WHF[si]);
   vec3 lc=mix(vec3(1.,.72,.42),vec3(.78,.86,1.),step(.68,hs1(wseed*29.)));rm=mix(rm,vec3(.85,.78,.62),bl);
   glassC=rm*.16+vec3(.012,.015,.02);em=rm*lc*lit*(.5+cl*.7+bl*.4)*.85;}
  if(store>.5){float cl=0.;float sh=hs(floor(vec2(fu/7.8,sd*.7)));vec3 rm=vec3(.3);if(uQ>.5)rm=shopRoom(vec2(fract(fu/2.6),(fv-.4)/3.1),vec2(2.6,3.1),vf,sh*91.,5.,cl);
   float closed=step(.68,sh)*smoothstep(.3,.8,uNight);vec3 sc=mix(vec3(1.,.8,.55),vec3(.85,.92,1.),step(.45,hs1(sh*17.)));
   glassC=rm*.1+.006;em=rm*sc*(.3+.32*uNight)*(.55+.5*cl)*(1.-closed);gr=.025;
   if(closed>.5){fr=0.;glassC=vec3(.32,.33,.34)*(.8+.2*sin(fv*40.));gr=.55;em=vec3(0.);}win=1.;}
  float glass=win*(1.-fr);vec3 frameC=si==3||si==2?vec3(.9,.9,.86):vec3(.13,.14,.15);
  vec3 base=mix(wall,frameC,fr*win);base=mix(base,glassC,glass);
  if(store<.5&&fv<4.3&&(si==5||si==6)){base=mix(base,vec3(.08,.08,.09),step(3.5,fv)*step(fv,4.2));base=mix(base,vec3(.22,.21,.2),step(fv,.4));}
  diffuseColor.rgb=base;gR=mix(mix(wr,.35,fr*win),gr,glass);gM=mix(mix(wm,.5,fr*win),gm2,glass);
  gE=em*glass*mix(store>.5?.85:.12,1.,uNight);
  if(si==2){gE+=wc*vec3(1.,.8,.6)*exp(-fv*.25)*.35*uNight*(1.-glass);}
  if(si==0){gE+=vec3(.7,.9,1.)*step(sz.y-.5,fv)*uNight*1.6;}}
 }`)
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=gR;')
  .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=gM;')
  .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nif(gFace>.5&&uQ>.5){vec3 Tv=normalize((viewMatrix*vec4(gT,0.)).xyz);vec3 Bv=normalize((viewMatrix*vec4(0.,1.,0.,0.)).xyz);normal=normalize(normal-(gBump.x*Tv+gBump.y*Bv));}')
  .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=gE;');};
 m.customProgramCacheKey=()=>'facade2';return m;}

/* ================================================================ */
export function buildCity(scene,W,U,R){const out={props:[],chunks:new Map(),glows:[]};const rnd=rng(5);
 const st=TX.streetSet(),fw=TX.fwySet(),it=TX.interSet(),wk=TX.walkSet();const tex={street:st.map,streetN:st.nmap,fwy:fw.map,fwyN:fw.nmap,inter:it.map,interN:it.nmap,paver:wk.map,paverN:wk.nmap,wood:TX.woodTex(),conc:TX.concreteTex(),noise:TX.noiseTex(),glow:TX.glowTex(),atlas:TX.signAtlas(),grime:TX.grimeTex()};
 out.tex=tex;
 // planar reflection uniforms (filled by game's Mirror)
 out.reflU={tRefl:{value:null},uTexMat:{value:new THREE.Matrix4()},uReflStr:{value:.0}};
 const NS=new THREE.Vector2(.9,.9);
 const streetMat=wetify(new THREE.MeshStandardMaterial({map:tex.street,normalMap:tex.streetN,normalScale:NS,roughness:.86,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),U,{U:out.reflU});
 const interMat=wetify(new THREE.MeshStandardMaterial({map:tex.inter,normalMap:tex.interN,normalScale:NS,roughness:.86,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6}),U,{U:out.reflU});
 const fwyMat=wetify(new THREE.MeshStandardMaterial({map:tex.fwy,normalMap:tex.fwyN,normalScale:NS,roughness:.84}),U,null);const rampMat=wetify(new THREE.MeshStandardMaterial({map:tex.street,normalMap:tex.streetN,normalScale:NS,roughness:.84}),U,null);
 const slabMat=wetify(new THREE.MeshStandardMaterial({map:tex.paver,normalMap:tex.paverN,normalScale:new THREE.Vector2(.7,.7),vertexColors:true,roughness:.9}),U,{U:out.reflU},{puddles:.35});
 const concMat=new THREE.MeshStandardMaterial({map:tex.conc,roughness:.9,side:THREE.DoubleSide});const concVC=new THREE.MeshStandardMaterial({map:tex.conc,vertexColors:true,roughness:.85,side:THREE.DoubleSide});
 const woodMat=new THREE.MeshStandardMaterial({map:tex.wood,roughness:.85});out.mats={streetMat,interMat,slabMat,fwyMat};
 const vcMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75,metalness:.05});const vcMetal=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.6});
 const add=(g,m,o={})=>{const me=new THREE.Mesh(g,m);me.castShadow=!!o.cast;me.receiveShadow=o.recv??true;if(o.name)me.name=o.name;scene.add(me);return me;};

 /* ---- terrain ---- */
 {const S=5,X0=-900,X1=1000,Z0=-860,Z1=1000,NX=(X1-X0)/S+1,NZ=(Z1-Z0)/S+1;const pos=new Float32Array(NX*NZ*3),col=new Float32Array(NX*NZ*3),uv=new Float32Array(NX*NZ*2),H=new Float32Array(NX*NZ),FL=new Uint8Array(NX*NZ);
  const c=new THREE.Color(),sand=new THREE.Color(0xe6d2a0),wet=new THREE.Color(0xb09868),sea=new THREE.Color(0x4a5a58),grass=new THREE.Color(0x6f8a3c),dry=new THREE.Color(0xa49660),rock=new THREE.Color(0x8a7c6c),mud=new THREE.Color(0x4a4636),dirt=new THREE.Color(0x9a7a56);
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=X0+i*S,z=Z0+j*S,k=j*NX+i;const h=W.terrainH(x,z);H[k]=h;pos[k*3]=x;pos[k*3+1]=h;pos[k*3+2]=z;uv[k*2]=x/9;uv[k*2+1]=z/9;
   const fi=Math.round((x-W.TX0)/W.TS),fj=Math.round((z-W.TZ0)/W.TS);if(fi>=0&&fj>=0&&fi<W.TNX&&fj<W.TNZ)FL[k]=W.TF[fj*W.TNX+fi];
   const sl=Math.abs(W.terrainH(x+2,z)-h)+Math.abs(W.terrainH(x,z+2)-h),n=hash2(i,j),nn=(W.ridgeAt(x*.5,z*.5)%1+1)%1;
   if(h<WL-.4){c.copy(wet).lerp(sea,cl((WL-h)/6,0,1));if(x>CANAL[0]&&x<CANAL[1])c.copy(mud);}
   else if(z>BEACH-6&&h<3){c.copy(sand).lerp(wet,cl((1-h)/2,0,1)*.6);}
   else if(h>.5){c.copy(grass).lerp(dry,cl(.35+(n-.5)*.5+h/220,0,1)).lerp(rock,cl((sl-1.6)/2.2,0,1));const hr=W.hillDist(x,z);if(hr.d<11)c.lerp(dirt,cl((11-hr.d)/5,0,1)*.7);if(FL[k]===1&&W.fwyDist(x,z).d<FWY_HW+3)c.lerp(rock,.5);}
   else c.copy(grass).lerp(dry,n*.4);
   c.multiplyScalar(.9+n*.18);col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
  const TN=5,tiles=[];for(let k=0;k<TN*TN;k++)tiles.push({idx:[],y0:1e9,y1:-1e9});const idx={push:()=>{}};let tile=null;
  for(let j=0;j<NZ-1;j++)for(let i=0;i<NX-1;i++){const a=j*NX+i,b=a+1,cc=a+NX,d=cc+1;tile=tiles[Math.min(TN-1,(j*TN/(NZ-1))|0)*TN+Math.min(TN-1,(i*TN/(NX-1))|0)];const hs=[H[a],H[b],H[cc],H[d]];const mx=Math.max(...hs),mn=Math.min(...hs);
   if(mx<-8.4)continue;const cx=X0+(i+.5)*S,cz=Z0+(j+.5)*S;if(mx<.05&&mn>-.05){const cov=(x,z)=>!!W.blockAt(x,z)||W.onStreet(x,z);const x0=cx-2.5,x1=cx+2.5,z0=cz-2.5,z1=cz+2.5;if(cov(x0,z0)&&cov(x1,z0)&&cov(x0,z1)&&cov(x1,z1)&&cov(cx,cz))continue;}
   const f=[FL[a],FL[b],FL[cc],FL[d]];if(f.includes(1)&&mn<FWY_Y+9.5)continue;tile.idx.push(a,cc,b,b,cc,d);tile.y0=Math.min(tile.y0,mn);tile.y1=Math.max(tile.y1,mx);}
  // one shared vertex buffer, split into frustum-culled tiles
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(tiles.flatMap(t=>t.idx));g.computeVertexNormals();const nrm=g.attributes.normal;
  const tm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96,map:tex.noise});tm.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','vec4 nT=texture2D(map,vMapUv);vec4 nT2=texture2D(map,vMapUv*.13);diffuseColor.rgb*=.62+.75*nT.r*nT2.r*1.6;');};
  out.terrain=[];tiles.forEach((t,k)=>{if(!t.idx.length)return;const tg=new THREE.BufferGeometry();tg.setAttribute('position',g.attributes.position);tg.setAttribute('normal',nrm);tg.setAttribute('color',g.attributes.color);tg.setAttribute('uv',g.attributes.uv);tg.setIndex(t.idx);
   const ti=k%TN,tj=(k/TN)|0,x0=X0+(X1-X0)*ti/TN,x1=X0+(X1-X0)*(ti+1)/TN,z0=Z0+(Z1-Z0)*tj/TN,z1=Z0+(Z1-Z0)*(tj+1)/TN;tg.boundingSphere=new THREE.Sphere(new V((x0+x1)/2,(t.y0+t.y1)/2,(z0+z1)/2),Math.hypot(x1-x0,z1-z0,t.y1-t.y0)/2+2);
   const me=add(tg,tm,{recv:true});me.name='terrain';out.terrain.push(me);});}

 /* ---- streets + intersections ---- */
 {const gs=[],ig=[];const trim=(P,a0,b0)=>{const L=P.len;const o=[];for(const p of P)if(p.s>=a0-.01&&p.s<=L-b0+.01)o.push(p);const A=polyAt(P,a0,{}),B=polyAt(P,L-b0,{});o.unshift({x:A.x,z:A.z,y:A.y,s:a0});o.push({x:B.x,z:B.z,y:B.y,s:L-b0});return o;};
  for(const e of W.edges){if(e.kind==='street'){const P=trim(e.pts,RW,RW);gs.push(ribbon(P,RW,{y:.03,v:32}));}}
  for(const n of W.nodes){if(n.kind!=='grid'&&n.kind!=='ramp')continue;const g=new THREE.PlaneGeometry(RW*2,RW*2);g.rotateX(-Math.PI/2);g.translate(n.x,.035,n.z);ig.push(g);}
  out.streets=add(mergeIdx(gs),streetMat,{name:'streets'});out.inters=add(mergeIdx(ig),interMat);
  // hill road
  const hp=W.hill.map(p=>({...p}));add(ribbon(hp,6.2,{y:.07,v:32}),rampMat);add(wallStrip(hp,6.6,-.3,.5,{v:4}),concMat);
  // summit plateau
  {const g=new THREE.CircleGeometry(38,40);g.rotateX(-Math.PI/2);g.translate(W.summit.x,W.summit.y+.05,W.summit.z);add(g,new THREE.MeshStandardMaterial({map:tex.paver,roughness:.9,color:0xcfc8bb}));}}

 /* ---- decks: freeway, ramps, bridges, piers, stunt ramps ---- */
 {const surf={fwy:[],ramp:[],wood:[]},conc=[],under=[];const overlapOther=(D,x,z,y)=>{for(const o of W.dHash.at(x,z)){if(o.deck===D)continue;const qx=x-o.ax,qz=z-o.az,u=qx*o.dx+qz*o.dz;if(u<0||u>o.len)continue;if(Math.abs(qx*o.dz-qz*o.dx)<o.hw-.3&&Math.abs(o.ay+(o.by-o.ay)*u/o.len-y)<1.6)return true;}return false;};
  for(const D of W.decksAll){const P=D.P;if(D.kind==='stunt'){const s=D.stunt;const L=s.len,wdt=5.6;const geo=new THREE.BoxGeometry(wdt,1,L,1,1,1);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const zz=p.getZ(i),t=(zz+L/2)/L;p.setY(i,p.getY(i)>0?s.h*t:-.6);}geo.computeVertexNormals();
     geo.rotateY(s.a);geo.translate(s.x,s.y0+.02,s.z);conc.push([geo,null,new THREE.Color(0xffc21a)]);const strip=new THREE.BoxGeometry(wdt+.1,.08,.5);for(let k=1;k<5;k++){const t=k/5,sg=strip.clone();sg.rotateX(-Math.atan2(s.h,L));sg.translate(0,s.h*t+.05,-L/2+L*t);sg.rotateY(s.a);sg.translate(s.x,s.y0+.02,s.z);conc.push([sg,null,new THREE.Color(0x15151a)]);}continue;}
   if(D.kind==='bridge'){const mask=()=>true;conc.push([wallStrip(P,RW+.5,-.2,1.1,{v:4})],[wallStrip(P,-RW-.5,-.2,1.1,{v:4})]);under.push(ribbon(P,RW+.6,{y:-.9,v:8,flip:true}));
     for(const sx of[-1,1]){const arc=[];for(let k=0;k<=24;k++){const x=CANAL[0]+(CANAL[1]-CANAL[0])*k/24;arc.push({x,z:D.Z+sx*(RW+.6),y:-5+5.6*Math.sin(Math.PI*k/24)});}poly2(arc);conc.push([wallStrip(arc,0,-.6,.6,{v:4})]);}continue;}
   if(D.kind==='pier'){surf.wood.push(ribbon(P,D.hw,{y:0,v:6}));under.push(ribbon(P,D.hw,{y:-.4,v:6,flip:true}));for(let s=0;s<P.len;s+=8)for(const sx of[-1,1]){const p=polyAt(P,s,{});const g=new THREE.CylinderGeometry(.35,.35,10,8);g.translate(p.x+sx*(D.hw-.6)*(-p.tz),.6-5,p.z+sx*(D.hw-.6)*p.tx);conc.push([g,null,new THREE.Color(0x5a4a3a)]);}continue;}
   const isF=D.kind==='fwy';const hw=D.hw;const tun=i=>P[i].tun;
   surf[isF?'fwy':'ramp'].push(ribbon(P,hw,{y:.04,v:32}));
   for(const side of[-1,1]){const lat=side*hw;const mask=i=>{const p=P[i],a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)];const tx=b.x-a.x,tz=b.z-a.z,l=Math.hypot(tx,tz)||1;const x=p.x-tz/l*(lat+side*.6),z=p.z+tx/l*(lat+side*.6);return!overlapOther(D,x,z,p.y)&&(D.kind!=='ramp'||p.y>.9);};
    conc.push([wallStrip(P,lat,0,1.05,{v:4,mask})],[wallStrip(P,lat+side*.45,-1.2,1.05,{v:4,mask:i=>mask(i)||true})],[ribbon(P,.23,{y:1.05,l:lat,r:lat+side*.45,v:4,mask})]);}
   under.push(ribbon(P,hw+.45,{y:-1.2,v:8,flip:true}));}
  out.fwy=add(mergeIdx(surf.fwy),fwyMat,{name:'freeway'});add(mergeIdx(surf.ramp),rampMat);if(surf.wood.length)add(mergeIdx(surf.wood),woodMat);
  add(merge(conc.map(e=>e[2]?e:[e[0],null,new THREE.Color(1,1,1)])),concVC,{cast:true});add(mergeIdx(under),concMat);
  // tunnel interior + portals
  const tg=[],lg=[];for(const[s0,s1]of W.tunnels){const P=[];for(let s=s0-6;s<=s1+6;s+=6){const p=polyAt(W.fwy,Math.min(s,W.fwy.len),{});P.push({x:p.x,z:p.z,y:FWY_Y,s});}
   tg.push(wallStrip(P,FWY_HW+.5,0,8.4,{v:6}),wallStrip(P,-FWY_HW-.5,0,8.4,{v:6}),ribbon(P,FWY_HW+.6,{y:8.4,v:8,flip:true}));
   for(let k=0;k<P.length;k+=2){const p=P[k];const g=new THREE.BoxGeometry(.6,.12,3.2);g.rotateY(Math.atan2((P[k+1]||p).x-p.x,(P[k+1]||p).z-p.z));for(const o of[-5,5]){const gg=g.clone();const a=Math.atan2((P[k+1]||P[k-1]).x-p.x,(P[k+1]||P[k-1]).z-p.z);gg.translate(p.x+Math.cos(a)*o,FWY_Y+8.3,p.z-Math.sin(a)*o);lg.push(gg);}}}
  if(tg.length)add(mergeIdx(tg),new THREE.MeshStandardMaterial({map:tex.conc,color:0xd8d2c4,roughness:.8,side:THREE.DoubleSide}));if(lg.length){const lm=glowMat(U,{color:0xffd9a0,day:2.2,night:2.2});add(mergeIdx(lg),lm);}
  const pg=[];for(const pt of W.portals){const a=pt.a,w=FWY_HW*2+18;const parts=[[w,13,4,0,FWY_Y+8.4+6.5,0],[6,22,4,-(FWY_HW+4),FWY_Y+9,0],[6,22,4,FWY_HW+4,FWY_Y+9,0]];for(const[bw,bh,bd,ox,oy,oz]of parts){const g=new THREE.BoxGeometry(bw,bh,bd);g.translate(ox,oy,oz);g.rotateY(a+Math.PI/2*0);g.translate(pt.x,0,pt.z);pg.push(g);}}
  if(pg.length){add(mergeIdx(pg),new THREE.MeshStandardMaterial({map:tex.conc,color:0xbab2a4,roughness:.85}),{cast:true});}}

 /* ---- block slabs, boardwalk, canal + quay walls, railings ---- */
 {const sl=[],wd=[],walls=[];const cP=new THREE.Color(1,1,1),cPark=new THREE.Color(.42,.66,.32),cHarb=new THREE.Color(.72,.72,.74),cCan=new THREE.Color(.95,.9,.82);
  for(const b of W.blocks){if(b.walk){const g=new THREE.BoxGeometry(b.x1-b.x0,SLAB+.4,5);g.translate((b.x0+b.x1)/2,SLAB/2-.2,b.z0+2.5);sl.push([g,null,cP]);
     for(const[x0,x1]of[[b.x0,CANAL[0]],[CANAL[1],b.x1]]){const gw=new THREE.BoxGeometry(x1-x0,.36+.6,BEACH-b.z0-5);gw.translate((x0+x1)/2,.36/2-.3,(b.z0+5+BEACH)/2);wd.push(gw);}continue;}
   const g=new THREE.BoxGeometry(b.x1-b.x0,SLAB+.4,b.z1-b.z0);g.translate((b.x0+b.x1)/2,SLAB/2-.2,(b.z0+b.z1)/2);// world-space uv on top
   const p=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<p.count;i++){uv.setXY(i,p.getX(i)/4,p.getZ(i)/4);}
   sl.push([g,null,b.d==='park'?cPark:b.d==='harbor'?cHarb:b.d==='canal'?cCan:cP]);
   if(b.d==='park'){// paths
    const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2;for(const[w,d]of[[b.x1-b.x0-10,5],[5,b.z1-b.z0-10]]){const pg=new THREE.BoxGeometry(w,.06,d);pg.translate(cx,SLAB+.03,cz);const pu=pg.attributes.position,uu=pg.attributes.uv;for(let i=0;i<pu.count;i++)uu.setXY(i,pu.getX(i)/4,pu.getZ(i)/4);sl.push([pg,null,new THREE.Color(.95,.9,.8)]);}}}
  // world uv for boardwalk sidewalks too
  const slab=merge(sl);{const p=slab.attributes.position,uv=slab.attributes.uv,n=slab.attributes.normal;for(let i=0;i<p.count;i++)if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)/4,p.getZ(i)/4);else uv.setXY(i,(p.getX(i)+p.getZ(i))/4,p.getY(i)/4);}
  out.slabs=add(slab,slabMat,{name:'slabs'});const wg=mergeIdx(wd);{const p=wg.attributes.position,uv=wg.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/6,p.getZ(i)/6);}add(wg,woodMat);
  // canal + quay walls
  for(const X of CANAL){walls.push(wallStrip(poly2([{x:X,z:-420},{x:X,z:BEACH+30}]),0,-7.5,SLAB,{abs:true,v:6}));}
  walls.push(wallStrip(poly2([{x:CANAL[0],z:-420},{x:CANAL[1],z:-420}]),0,-7.5,.2,{abs:true,v:6}));walls.push(wallStrip(poly2([{x:QUAY,z:-400},{x:QUAY,z:BEACH+4}]),0,-9.5,SLAB,{abs:true,v:6}));
  add(mergeIdx(walls),concMat);
  const rg=[];for(const r of W.railings){const L=Math.abs(r.z1-r.z0);const t=new THREE.BoxGeometry(.12,.1,L);t.translate(r.x0,SLAB+1,(r.z0+r.z1)/2);rg.push([t]);const t2=t.clone();t2.translate(0,-.45,0);rg.push([t2]);for(let z=r.z0;z<=r.z1;z+=2.5){const pp=new THREE.BoxGeometry(.09,1,.09);pp.translate(r.x0,SLAB+.5,z);rg.push([pp]);}}
  if(rg.length)add(merge(rg.map(e=>[e[0],null,new THREE.Color(.25,.3,.32)])),vcMetal);}

 /* ---- buildings: chunk-streamed instanced boxes ---- */
 const bmat=buildingMat(U,tex.grime);out.bmat=bmat;const CH=200;const boxG=buildingGeo();
 for(const b of W.bld){const k=Math.floor((b.x+900)/CH)+'_'+Math.floor((b.z+900)/CH);let c=out.chunks.get(k);if(!c){c={k,list:[],cx:(Math.floor((b.x+900)/CH)+.5)*CH-900,cz:(Math.floor((b.z+900)/CH)+.5)*CH-900,mesh:null};out.chunks.set(k,c);}c.list.push(b);}
 out.buildChunk=c=>{const n=c.list.length,geo=boxG.clone(),mesh=new THREE.InstancedMesh(geo,bmat,n),aB=new Float32Array(n*4),m4=new THREE.Matrix4(),col=new THREE.Color();
  c.list.forEach((b,i)=>{m4.makeScale(b.w,b.h,b.d);m4.setPosition(b.x,b.y0,b.z);mesh.setMatrixAt(i,m4);mesh.setColorAt(i,col.set(b.col));aB.set([b.style,Math.floor(b.seed%97),Math.round(b.lit*64)/64,0],i*4);});
  geo.setAttribute('aB',new THREE.InstancedBufferAttribute(aB,4));mesh.castShadow=mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=2;scene.add(mesh);c.mesh=mesh;};
 out.streamChunks=(x,z,budget=2,force)=>{let built=0;const list=[...out.chunks.values()].sort((a,b)=>Math.hypot(a.cx-x,a.cz-z)-Math.hypot(b.cx-x,b.cz-z));
  for(const c of list){const d=Math.hypot(c.cx-x,c.cz-z);if(!c.mesh&&d<1150&&(force||built<budget)){out.buildChunk(c);built++;}if(c.mesh)c.mesh.visible=d<1250;}return built;};

 /* ---- instanced props ---- */
 const P=(geo,mat,items,mk,o)=>{const s=new PropSet(scene,geo,mat,items,mk,o);out.props.push(s);return s;};
 const yAt=(x,z)=>W.groundBase(x,z);
 // house roofs
 {const g=new THREE.BufferGeometry();const v=[-.5,0,-.5,.5,0,-.5,.5,0,.5,-.5,0,.5,-.5,1,0,.5,1,0];const ix=[0,4,1,1,4,5,3,2,5,3,5,4,0,3,4,1,5,2,0,1,2,0,2,3];g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(ix);const gg=g.toNonIndexed();gg.computeVertexNormals();
  P(gg,new THREE.MeshStandardMaterial({roughness:.8}),W.roofs,(r,m,c)=>{m.compose(new V(r.x,r.y,r.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),r.ry),new V(r.ry?r.d:r.w,r.h,r.ry?r.w:r.d));c.set(r.col);},{color:true,shadow:true,range:600});}
 // lamp posts + bulbs + light pools
 {const pole=merge([[new THREE.CylinderGeometry(.09,.14,7,6),M(0,3.5,0)],[new THREE.BoxGeometry(.12,.12,2),M(0,6.9,.95)],[new THREE.BoxGeometry(.5,.18,.8),M(0,6.85,1.9)],[new THREE.CylinderGeometry(.22,.26,.5,8),M(0,.25,0)]]);
  const mk=(l,m)=>{m.compose(new V(l.x,l.y??yAt(l.x,l.z),l.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),l.ry),new V(1,1,1));};
  P(pole,new THREE.MeshStandardMaterial({color:0x3a3f46,roughness:.5,metalness:.7}),W.lamps,mk,{shadow:true,range:380});
  const bulb=new THREE.BoxGeometry(.38,.08,.6);bulb.translate(0,6.73,1.9);P(bulb,glowMat(U,{color:0xffd090,day:.5,night:6}),W.lamps,mk,{range:600});
  const pool=new THREE.PlaneGeometry(13,13);pool.rotateX(-Math.PI/2);pool.translate(0,.08,2.6);const pm=glowMat(U,{color:0xffa860,map:tex.glow,transparent:true,add:true,day:0,night:.42});pm.polygonOffset=true;pm.polygonOffsetFactor=-4;
  out.pools=P(pool,pm,W.lamps,(l,m)=>{m.compose(new V(l.x,(l.y??yAt(l.x,l.z))-SLAB+.05,l.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),l.ry),new V(1,1,1));},{range:420,receive:false});}
 // palms (sway in the wind)
 {const H=8.5;const tr=new THREE.CylinderGeometry(.17,.3,H,7,10,true);tr.translate(0,H/2,0);{const p=tr.attributes.position;for(let i=0;i<p.count;i++){const t=p.getY(i)/H;p.setX(i,p.getX(i)+1.1*t*t);}}tr.computeVertexNormals();
  const trc=new Float32Array(tr.attributes.position.count*3);{const p=tr.attributes.position;for(let i=0;i<p.count;i++){const b=.55+.1*Math.sin(p.getY(i)*9);trc.set([b*.75,b*.62,b*.48],i*3);}}tr.setAttribute('color',new THREE.BufferAttribute(trc,3));
  const fr=[];for(let k=0;k<9;k++){const g=new THREE.PlaneGeometry(.85,4.2,1,6);g.translate(0,2.1,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,-.09*y*y);p.setX(i,p.getX(i)*(1-y/5.2));}g.rotateX(-1.15+((k*37)%5)*.08);g.rotateY(k/9*Math.PI*2);g.translate(1.1,H-.1,0);
   const cc=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const t=p.getY(i);const gg=.38+.18*Math.random();cc.set([.18+gg*.3,.45+gg*.4,.14],i*3);}g.setAttribute('color',new THREE.BufferAttribute(cc,3));fr.push(g);}
  const palmG=merge([[tr],...fr.map(g=>[g])]);
  const pm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,side:THREE.DoubleSide});pm.onBeforeCompile=sh=>{sh.uniforms.uTime=U.uTime;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat sw=sin(uTime*1.25+instanceMatrix[3].x*.11+instanceMatrix[3].z*.07)*.5+sin(uTime*2.9+instanceMatrix[3].x)*.15;float hy=max(transformed.y,0.)/8.5;transformed.x+=sw*.38*hy*hy;transformed.z+=sw*.2*hy*hy;');};pm.customProgramCacheKey=()=>'palm';
  P(palmG,pm,W.palms,(t,m)=>{const s=t.s||1;m.compose(new V(t.x,yAt(t.x,t.z),t.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),hash2(t.x|0,t.z|0)*6.28),new V(s,s,s));},{shadow:true,range:520,qR:[340,520,520]});}
 // round trees + pines
 {const tg=[[new THREE.CylinderGeometry(.18,.3,3.2,6),M(0,1.6,0),new THREE.Color(.36,.26,.18)]];for(let k=0;k<4;k++){const g=new THREE.IcosahedronGeometry(1.9-k*.15,1);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)*(1+(hash2(i,k)-.5)*.25),p.getY(i)*(.85+hash2(k,i)*.2),p.getZ(i)*(1+(hash2(i+3,k)-.5)*.25));g.computeVertexNormals();
   tg.push([g,M([0,1.1,-1,.4][k],4.2+[0,.6,.3,1.3][k],[0,.7,.6,-.9][k]),new THREE.Color().setHSL(.27+k*.012,.42,.27+k*.03)]);}
  P(merge(tg),vcMat,W.trees,(t,m)=>{const s=t.s||1;m.compose(new V(t.x,t.y??yAt(t.x,t.z),t.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),hash2(t.x|0,t.z|0)*6.28),new V(s,s,s));},{shadow:true,range:560,qR:[380,560,560]});
  const pg=[[new THREE.CylinderGeometry(.2,.32,3,6),M(0,1.5,0),new THREE.Color(.3,.22,.16)]];for(let k=0;k<3;k++)pg.push([new THREE.ConeGeometry(2.6-k*.6,3.6,8),M(0,3.6+k*2.1,0),new THREE.Color().setHSL(.33,.38,.2+k*.03)]);
  P(merge(pg),vcMat,W.pines,(t,m)=>{const s=(t.s||1)*1.2;m.compose(new V(t.x,(t.y??yAt(t.x,t.z))-.3,t.z),new THREE.Quaternion(),new V(s,s*1.1,s));},{shadow:true,range:900});}
 // benches, hydrants, umbrellas, containers
 {const bench=merge([[box(2,.08,.5),M(0,.5,0),new THREE.Color(.55,.38,.22)],[box(2,.5,.08),M(0,.8,-.24),new THREE.Color(.55,.38,.22)],[box(.08,.5,.5),M(-.9,.25,0),new THREE.Color(.2,.2,.22)],[box(.08,.5,.5),M(.9,.25,0),new THREE.Color(.2,.2,.22)]]);
  P(bench,vcMat,W.benches,(b,m)=>m.compose(new V(b.x,yAt(b.x,b.z),b.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),b.ry||0),new V(1,1,1)),{range:260});
  const hyd=merge([[new THREE.CylinderGeometry(.16,.2,.7,8),M(0,.35,0),new THREE.Color(.85,.15,.1)],[new THREE.SphereGeometry(.17,8,6),M(0,.72,0),new THREE.Color(.85,.15,.1)],[new THREE.CylinderGeometry(.07,.07,.5,6),M(0,.45,0,0,0,Math.PI/2),new THREE.Color(.75,.75,.7)]]);
  P(hyd,vcMetal,W.hydrants,(b,m)=>m.compose(new V(b.x,yAt(b.x,b.z),b.z),new THREE.Quaternion(),new V(1,1,1)),{range:220});
  const umb=merge([[new THREE.CylinderGeometry(.04,.04,2.4,5),M(0,1.2,0),new THREE.Color(.9,.9,.9)],[new THREE.ConeGeometry(1.5,.6,10,1,true),M(0,2.35,0)]]);
  P(umb,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,side:THREE.DoubleSide}),W.umbrellas,(u,m,c)=>{m.compose(new V(u.x,W.terrainH(u.x,u.z),u.z),new THREE.Quaternion().setFromEuler(new THREE.Euler(.08,u.x,0)),new V(u.s,u.s,u.s));c.set(u.col);},{color:true,shadow:true,range:420});
  const ct=TX.concreteTex();const cg=new THREE.BoxGeometry(12.1,2.58,2.44,24,1,1);cg.translate(0,1.29,0);{const p=cg.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);if(Math.abs(p.getZ(i))>1.2)p.setZ(i,p.getZ(i)+Math.sign(p.getZ(i))*.04*Math.cos(x*8));}cg.computeVertexNormals();}
  P(cg,new THREE.MeshStandardMaterial({roughness:.55,metalness:.4,map:ct}),W.containers,(c,m,col)=>{m.compose(new V(c.x,c.y,c.z),new THREE.Quaternion(),new V(1,1,1));col.set(c.col);},{color:true,shadow:true,range:600});}
 // traffic lights: poles + three lamp sets (colours driven by the signal controller)
 {const pole=merge([[new THREE.CylinderGeometry(.1,.13,4.4,6),M(0,2.2,0)],[box(.42,1.2,.36),M(0,4.6,0)],[box(.56,1.3,.06),M(0,4.6,-.2)]]);const mk=(t,m)=>m.compose(new V(t.x,yAt(t.x,t.z),t.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),t.ry),new V(1,1,1));
  P(pole,new THREE.MeshStandardMaterial({color:0x2a2e34,roughness:.5,metalness:.6}),W.tlights,mk,{shadow:true,range:340});
  out.tl=[0,1,2].map(k=>{const g=new THREE.CircleGeometry(.13,10);g.translate(0,4.98-k*.37,.19);const s=P(g,glowMat(U,{day:1,night:1.4}),W.tlights,mk,{color:true,range:340});return s;});}
 // pillars
 {const g=new THREE.BoxGeometry(1,1,1);g.translate(0,.5,0);P(g,new THREE.MeshStandardMaterial({map:tex.conc,roughness:.85}),W.pillars,(p,m)=>m.compose(new V(p.x,p.y0-1,p.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),p.a),new V(p.w,p.y1-p.y0+1,p.w)),{shadow:true,range:900});
  const cap=new THREE.BoxGeometry(1,1.2,2.6);cap.translate(0,-.6,0);P(cap,new THREE.MeshStandardMaterial({map:tex.conc,roughness:.85}),W.pillars,(p,m)=>m.compose(new V(p.x,p.y1+.1,p.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),p.a+Math.PI/2),new V(p.cap,1,1)),{shadow:false,range:900});}
 // roof props
 {const ac=merge([[box(1,.6,1),M(0,.3,0),new THREE.Color(.62,.64,.66)],[new THREE.CylinderGeometry(.3,.3,.08,10),M(0,.62,0),new THREE.Color(.25,.25,.27)]]);const acs=[];for(const r of W.roofProps)if(r.t==='ac')for(let k=0;k<3;k++)acs.push({x:r.x+(hash2(k,r.x|0)-.5)*r.s,z:r.z+(hash2(r.z|0,k)-.5)*r.s,y:r.y,s:2+hash2(k,k+(r.x|0))*1.5});
  P(ac,vcMat,acs,(a,m)=>m.compose(new V(a.x,a.y,a.z),new THREE.Quaternion(),new V(a.s,a.s,a.s)),{range:700});
  const tank=merge([[new THREE.CylinderGeometry(1.4,1.4,2.6,12),M(0,3.4,0),new THREE.Color(.45,.32,.22)],[new THREE.ConeGeometry(1.5,.9,12),M(0,5.1,0),new THREE.Color(.3,.22,.16)],...[[-1,-1],[1,-1],[-1,1],[1,1]].map(([a,b])=>[box(.15,2.2,.15),M(a*.9,1.1,b*.9),new THREE.Color(.2,.2,.2)])]);
  P(tank,vcMat,W.roofProps.filter(r=>r.t==='tank'),(a,m)=>m.compose(new V(a.x,a.y,a.z),new THREE.Quaternion(),new V(1,1,1)),{range:700,shadow:true});
  const spire=merge([[new THREE.CylinderGeometry(.08,.35,1,6),M(0,.5,0),new THREE.Color(.7,.72,.76)]]);P(spire,vcMetal,W.roofProps.filter(r=>r.t==='spire'),(a,m)=>m.compose(new V(a.x,a.y,a.z),new THREE.Quaternion(),new V(1,a.s,1)),{range:1200});
  const tip=new THREE.SphereGeometry(.35,8,6);P(tip,glowMat(U,{color:0xff2020,day:1.2,night:5}),W.roofProps.filter(r=>r.t==='spire'),(a,m)=>m.compose(new V(a.x,a.y+a.s,a.z),new THREE.Quaternion(),new V(1,1,1)),{range:1500});
  const heli=merge([[new THREE.CylinderGeometry(1,1,.3,24),M(0,.15,0),new THREE.Color(.3,.32,.34)],[box(.12,.04,.9),M(-.28,.32,0),new THREE.Color(1,1,1)],[box(.12,.04,.9),M(.28,.32,0),new THREE.Color(1,1,1)],[box(.56,.04,.12),M(0,.32,0),new THREE.Color(1,1,1)]]);
  P(heli,vcMat,W.roofProps.filter(r=>r.t==='heli'),(a,m)=>m.compose(new V(a.x,a.y,a.z),new THREE.Quaternion(),new V(a.s,1,a.s)),{range:1200});
  const deco=merge([[box(1,1,1),M(0,.5,0)],[box(.6,1.6,.6),M(0,1.3,0)],[box(.25,2.4,.25),M(0,1.8,0)]]);P(deco,new THREE.MeshStandardMaterial({roughness:.7}),W.roofProps.filter(r=>r.t==='deco'),(a,m,c)=>{m.compose(new V(a.x,a.y,a.z),new THREE.Quaternion(),new V(a.s*.6,a.s*.35,a.s*.6));c.set(a.col);},{color:true,range:900,shadow:true});}
 // neon signs + billboards (atlas cells)
 {const cellOf=i=>[(i%TX.ATLAS.cols)/TX.ATLAS.cols,1-((i/TX.ATLAS.cols|0)+1)/TX.ATLAS.rows];
  const q=new THREE.PlaneGeometry(1,1);const sm=glowMat(U,{map:tex.atlas,cells:true,day:.75,night:1.7});
  P(q.clone(),sm,W.signs,(s,m)=>m.compose(new V(s.x,s.y,s.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),s.ry),new V(s.w,s.h,1)),{range:600,extra:{name:'aCell',size:2,fill:(s,a,o)=>{const c=cellOf(s.idx);a[o]=c[0];a[o+1]=c[1];}}});
  const bm=glowMat(U,{map:tex.atlas,cells:true,day:.95,night:1.5});
  P(q.clone(),bm,W.boards,(s,m)=>m.compose(new V(s.x,s.y,s.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),s.ry),new V(s.w,s.h,1)),{range:900,extra:{name:'aCell',size:2,fill:(s,a,o)=>{const c=cellOf(s.idx);a[o]=c[0];a[o+1]=c[1];}}});
  const frame=merge([[box(1.04,1.06,.2),M(0,0,-.12)],[box(.03,.9,.03),M(-.3,-.95,-.15)],[box(.03,.9,.03),M(.3,-.95,-.15)]]);
  P(frame,new THREE.MeshStandardMaterial({color:0x2a2c30,roughness:.6,metalness:.5}),W.boards,(s,m)=>m.compose(new V(s.x,s.y,s.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),s.ry),new V(s.w,s.h,1)),{range:900,shadow:true});
  // POI pylon signs
  const poi=W.pois.filter(p=>p.sign);const pylon=merge([[new THREE.CylinderGeometry(.18,.22,7,8),M(0,3.5,0),new THREE.Color(.2,.2,.22)],[box(5.4,2.8,.5),M(0,7.6,0),new THREE.Color(.08,.08,.1)]]);const map={TAXI:16,MOTORS:17,SPRAY:18,POLICE:19,COURIER:20};
  const items=poi.map(p=>({x:p.x+(p.kind==='spray'?6:0),z:p.z+(p.kind==='spray'?-4.5:0),ry:0,idx:map[p.sign]}));items.push(...W.pois.filter(p=>p.kind==='delivery').map(p=>({x:p.x+3,z:p.z+4,ry:Math.PI/2,idx:20})));
  P(pylon,vcMat,items,(s,m)=>m.compose(new V(s.x,yAt(s.x,s.z),s.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),s.ry),new V(1,1,1)),{range:900,shadow:true});
  const two=[];for(const s of items)for(const f of[1,-1])two.push({...s,f});
  P(q.clone(),glowMat(U,{map:tex.atlas,cells:true,day:1,night:2.8}),two,(s,m)=>m.compose(new V(s.x+Math.sin(s.ry)*.26*s.f,yAt(s.x,s.z)+7.6,s.z+Math.cos(s.ry)*.26*s.f),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),s.ry+(s.f<0?Math.PI:0)),new V(5,2.5,1)),{range:900,extra:{name:'aCell',size:2,fill:(s,a,o)=>{const c=cellOf(s.idx);a[o]=c[0];a[o+1]=c[1];}}});}

 /* ---- fabric awnings over street-facing shopfronts ---- */
 {const aw=[];const R=rng(77);const COL=[0xb3261e,0x1f5f3a,0x1d2f5a,0xd9a31c,0x6a2a5a,0x2a6a7a,0xe2dccf,0x222226];
  for(const b of W.bld){if(b.style!==5&&b.style!==6||b.y0>1)continue;for(const[nx,nz]of[[1,0],[-1,0],[0,1],[0,-1]]){const fx=b.x+nx*(b.w/2),fz=b.z+nz*(b.d/2);if(!W.onStreet(fx+nx*9,fz+nz*9))continue;const len=nx?b.d:b.w;
    for(let u=-len/2+1.4;u<len/2-2.5;u+=7.8){if(R()<.35)continue;const w=Math.min(5.2,len/2-u-.8);if(w<2)continue;const c=u+w/2;aw.push({x:fx+(nz?c:0)+nx*.02,z:fz+(nx?c:0)+nz*.02,ry:Math.atan2(nx,nz),w,col:COL[R()*COL.length|0]});}}}
  const g=new THREE.BufferGeometry();const v=[-.5,3.55,0,.5,3.55,0,.5,3.05,1.35,-.5,3.05,1.35,-.5,3.05,1.35,.5,3.05,1.35,.5,2.8,1.38,-.5,2.8,1.38];g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex([0,3,1,1,3,2,4,7,5,5,7,6]);g.computeVertexNormals();
  const fm=new THREE.MeshStandardMaterial({roughness:.92,side:THREE.DoubleSide});fm.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vAp;').replace('#include <begin_vertex>','#include <begin_vertex>\nvAp=position*vec3(length(instanceMatrix[0].xyz),1.,1.);');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vAp;').replace('#include <color_fragment>','#include <color_fragment>\nfloat stp=step(.5,fract(vAp.x*1.6));diffuseColor.rgb=mix(diffuseColor.rgb,mix(diffuseColor.rgb,vec3(.92,.9,.85),.75),stp*step(.5,fract(vColor.r*7.3+vColor.b*3.1)));diffuseColor.rgb*=.85+.15*smoothstep(3.,3.5,vAp.y);');};fm.customProgramCacheKey=()=>'awning';
  P(g,fm,aw,(a,m,c)=>{m.compose(new V(a.x,SLAB,a.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),a.ry),new V(a.w,1,1));c.set(a.col);},{color:true,shadow:true,range:300,qR:[0,230,300],cull:true});}
 /* ---- street furniture, street trees, parked cars ---- */
 {const F=furnish(W);out.parked=F.parked;
  P(treeGeo(),treeMat(U),F.trees,(t,m)=>m.compose(new V(t.x,yAt(t.x,t.z),t.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),t.ry),new V(t.s,t.s*(.9+t.h*.2),t.s)),{shadow:true,range:420,qR:[150,320,420],cull:true});
  const grate=new THREE.BoxGeometry(1.3,.04,1.3);grate.translate(0,.02,0);P(grate,new THREE.MeshStandardMaterial({color:0x2a2620,roughness:.6,metalness:.6}),F.trees,(t,m)=>m.compose(new V(t.x,yAt(t.x,t.z),t.z),new THREE.Quaternion(),new V(1,1,1)),{range:160,qR:[0,160,160],receive:true});
  const bin=merge([[new THREE.CylinderGeometry(.3,.27,.95,12),M(0,.5,0),new THREE.Color(.16,.24,.2)],[new THREE.CylinderGeometry(.32,.32,.08,12),M(0,.99,0),new THREE.Color(.1,.12,.11)],[new THREE.CylinderGeometry(.18,.18,.04,10),M(0,1.04,0),new THREE.Color(.05,.05,.05)]]);
  P(bin,vcMetal,F.bins,(b,m)=>m.compose(new V(b.x,yAt(b.x,b.z),b.z),new THREE.Quaternion(),new V(1,1,1)),{range:200,shadow:true,qR:[0,160,220]});
  const news=merge([[box(.5,.9,.45),M(0,.55,0)],[box(.46,.32,.02),M(0,.78,.23),new THREE.Color(.85,.85,.82)],[box(.08,.12,.08),M(0,.05,0),new THREE.Color(.2,.2,.2)]]);
  P(news,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.3}),F.news,(b,m,c)=>{m.compose(new V(b.x,yAt(b.x,b.z),b.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),b.ry),new V(1,1,1));c.set(b.col);},{color:true,range:180,qR:[0,150,200],shadow:true});
  const meter=merge([[new THREE.CylinderGeometry(.04,.05,1.15,8),M(0,.58,0),new THREE.Color(.3,.32,.34)],[box(.16,.3,.12),M(0,1.3,0),new THREE.Color(.42,.44,.46)],[box(.1,.08,.02),M(0,1.36,.065),new THREE.Color(.05,.07,.06)]]);
  P(meter,vcMetal,F.meters,(b,m)=>m.compose(new V(b.x,yAt(b.x,b.z),b.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),b.ry),new V(1,1,1)),{range:150,qR:[0,120,170]});
  const bol=merge([[new THREE.CylinderGeometry(.11,.13,.9,10),M(0,.45,0),new THREE.Color(.22,.23,.25)],[new THREE.SphereGeometry(.11,10,6,0,Math.PI*2,0,Math.PI/2),M(0,.9,0),new THREE.Color(.22,.23,.25)],[new THREE.CylinderGeometry(.115,.115,.06,10),M(0,.72,0),new THREE.Color(.8,.66,.2)]]);
  P(bol,vcMetal,F.bollards,(b,m)=>m.compose(new V(b.x,yAt(b.x,b.z),b.z),new THREE.Quaternion(),new V(1,1,1)),{range:160,qR:[0,130,180]});
  const sh=merge([[box(4,.08,1.5),M(0,2.55,0),new THREE.Color(.25,.27,.3)],[box(.08,2.5,.08),M(-1.9,1.25,-.65),new THREE.Color(.3,.32,.35)],[box(.08,2.5,.08),M(1.9,1.25,-.65),new THREE.Color(.3,.32,.35)],[box(.08,2.5,.08),M(-1.9,1.25,.6),new THREE.Color(.3,.32,.35)],[box(.08,2.5,.08),M(1.9,1.25,.6),new THREE.Color(.3,.32,.35)],
   [box(3.6,.06,.4),M(0,.5,-.4),new THREE.Color(.55,.38,.22)],[box(1.3,2.0,.06),M(1.25,1.4,-.66),new THREE.Color(.95,.9,.8)]]);
  P(sh,vcMetal,F.shelters,(b,m)=>m.compose(new V(b.x,yAt(b.x,b.z),b.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),b.ry),new V(1,1,1)),{range:300,qR:[0,300,300],shadow:true});
  const glassS=new THREE.BoxGeometry(3.8,2.0,.03);glassS.translate(0,1.45,-.7);P(glassS,new THREE.MeshPhysicalMaterial({color:0x9fb4c0,roughness:.05,metalness:0,transparent:true,opacity:.28,depthWrite:false}),F.shelters,(b,m)=>m.compose(new V(b.x,yAt(b.x,b.z),b.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),b.ry),new V(1,1,1)),{range:220,qR:[0,220,220]});
  const adq=new THREE.PlaneGeometry(1.2,1.8);adq.translate(1.25,1.4,-.62);P(adq,glowMat(U,{map:tex.atlas,cells:true,day:.9,night:1.6}),F.shelters,(b,m)=>m.compose(new V(b.x,yAt(b.x,b.z),b.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),b.ry),new V(1,1,1)),{range:260,qR:[0,260,260],extra:{name:'aCell',size:2,fill:(s2,a,o)=>{const i=8+(s2.ad%8);a[o]=(i%TX.ATLAS.cols)/TX.ATLAS.cols;a[o+1]=1-((i/TX.ATLAS.cols|0)+1)/TX.ATLAS.rows;}}});
  // parked cars: instanced per body type, paint per instance
  const pm=parkedMat();out.parkedSets={};for(const id of PARK_TYPES){const g=parkedGeo(id);const items=F.parked.filter(c=>c.id===id);if(!items.length)continue;
   out.parkedSets[id]=P(g.geo,pm,items,(c,m,col)=>{m.compose(new V(c.x,c.y,c.z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),c.a),new V(1,1,1));col.set(c.paint);},{color:true,shadow:true,range:200,qR:[0,150,200],cull:true});}}

 /* ---- unique structures: cranes, boats, lifeguard towers, observatory, fountain ---- */
 {const cr=[];const O=new THREE.Color(0xe0581a),Wt=new THREE.Color(0xe8e4dc),D=new THREE.Color(0x2a2a2e);
  for(const c of W.cranes){const x=c.x,z=c.z;for(const dx of[-9,9])for(const dz of[-7,7])cr.push([box(1.6,38,1.6),M(x+dx,19,z+dz),O]);for(const dz of[-7,7])cr.push([box(70,2.4,1.4),M(x+22,39,z+dz),O]);for(const dx of[-9,9])cr.push([box(1.4,1.6,15),M(x+dx,30,z),Wt]);
   cr.push([box(5,3.4,4),M(x+8,36.5,z),Wt]);cr.push([box(8,3,16),M(x-14,38,z),D]);for(let k=0;k<6;k++)cr.push([box(.14,10,.14),M(x+10+k*7,44,z+(k%2?3:-3),0,0,(k%2?.5:-.5)),O]);cr.push([box(.1,22,.1),M(x+30,27,z),D]);cr.push([box(3,1,2.6),M(x+30,15.5,z),D]);}
  add(merge(cr),vcMetal,{cast:true});
  const tw=[];for(const t of W.towers){const y=W.terrainH(t.x,t.z);for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])tw.push([box(.2,2.6,.2),M(t.x+a*1.4,y+1.3,t.z+b*1.4),new THREE.Color(.85,.85,.82)]);tw.push([box(3.6,.2,3.6),M(t.x,y+2.7,t.z),new THREE.Color(.8,.78,.74)]);tw.push([box(3,2,3),M(t.x,y+3.8,t.z),new THREE.Color(t.x>0?0xff9ab0:0x7fd6e0)]);tw.push([new THREE.ConeGeometry(2.6,1.2,4),M(t.x,y+5.4,t.z,0,Math.PI/4,0),new THREE.Color(.95,.95,.95)]);tw.push([box(.6,3.6,.2),M(t.x,y+1.4,t.z+2.6,-.6,0,0),new THREE.Color(.85,.85,.82)]);}
  add(merge(tw),vcMat,{cast:true});
  const o=W.observatory;add(merge([[new THREE.CylinderGeometry(8,9,7,24),M(o.x,o.y+3.5,o.z),new THREE.Color(.92,.9,.86)],[new THREE.SphereGeometry(8.2,24,12,0,Math.PI*2,0,Math.PI/2),M(o.x,o.y+7,o.z),new THREE.Color(.78,.8,.84)],[box(2,8,.6),M(o.x,o.y+11,o.z-7.7,.55,0,0),new THREE.Color(.15,.15,.18)],[new THREE.CylinderGeometry(.25,.6,30,6),M(o.x+30,o.y+15,o.z-4),new THREE.Color(.75,.2,.15)]]),vcMetal,{cast:true});
  const f=W.fountains[0];if(f){const fy=SLAB;add(merge([[new THREE.CylinderGeometry(9,9.4,.8,32),M(f.x,fy+.4,f.z),new THREE.Color(.85,.82,.76)],[new THREE.CylinderGeometry(1.4,2,2.6,16),M(f.x,fy+1.3,f.z),new THREE.Color(.85,.82,.76)],[new THREE.CylinderGeometry(3.4,3.4,.3,24),M(f.x,fy+2.6,f.z),new THREE.Color(.85,.82,.76)]]),vcMat,{cast:true});
   const wg=new THREE.CircleGeometry(8.5,32);wg.rotateX(-Math.PI/2);wg.translate(f.x,fy+.7,f.z);add(wg,new THREE.MeshStandardMaterial({color:0x3aa7b8,roughness:.05,metalness:.2,transparent:true,opacity:.85}));
   const jet=new THREE.ConeGeometry(1.2,5,12,1,true);jet.translate(f.x,fy+5.2,f.z);jet.rotateX(Math.PI);jet.translate(0,2*(fy+5.2),2*f.z);out.jet=add(jet,new THREE.MeshBasicMaterial({color:0xcfefff,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide}));}
  // boats
  out.boats=[];const hullG={ship:merge([[box(60,8,14),M(0,1,0),new THREE.Color(.62,.12,.1)],[box(60.2,2,14.2),M(0,5.5,0),new THREE.Color(.15,.15,.17)],[box(10,12,13),M(-24,12,0),new THREE.Color(.92,.92,.9)],[box(4,4,4),M(-24,20,0),new THREE.Color(.92,.92,.9)],...[0,1,2,3,4,5].map(k=>[box(6,2.5,12),M(-12+k*7,7.8,0),new THREE.Color().setHSL(k*.17,.6,.42)]),[new THREE.ConeGeometry(7,14,4),M(33,1,0,0,Math.PI/4,-Math.PI/2),new THREE.Color(.62,.12,.1)]]),
   tug:merge([[box(14,3,6),M(0,.6,0),new THREE.Color(.15,.25,.55)],[box(5,3.5,4.5),M(-1,3.4,0),new THREE.Color(.95,.95,.92)],[new THREE.CylinderGeometry(.6,.6,3,8),M(-3,5.5,0),new THREE.Color(.9,.3,.1)]]),
   yacht:merge([[box(16,2.2,5),M(0,.5,0),new THREE.Color(.97,.97,.97)],[new THREE.ConeGeometry(2.5,5,4),M(10,.5,0,0,Math.PI/4,-Math.PI/2),new THREE.Color(.97,.97,.97)],[box(8,1.8,4),M(-1,2.4,0),new THREE.Color(.95,.95,.95)],[box(8.1,.6,4.1),M(-1,2.6,0),new THREE.Color(.08,.1,.14)]]),
   sail:merge([[box(9,1.4,3),M(0,.4,0),new THREE.Color(.95,.95,.92)],[new THREE.CylinderGeometry(.08,.1,11,6),M(.5,6,0),new THREE.Color(.6,.6,.6)],[new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([.6,1.6,0,.6,11,0,5,1.6,0],3)).setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,0,1],3)).setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,1,1,0],2)),null,new THREE.Color(1,1,1)]])};
  const bm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.1,side:THREE.DoubleSide});for(const b of W.boats){const m=add(hullG[b.t].clone(),bm,{cast:true});m.position.set(b.x,WL,b.z);m.rotation.y=b.ry;m.userData={...b,ph:Math.random()*6};out.boats.push(m);}}
 out.refreshParked=id=>{const s=out.parkedSets&&out.parkedSets[id];if(s)s.refresh(s.lx,s.lz,true);};
 out.update=(cam,t)=>{for(const s of out.props)s.refresh(cam.position.x,cam.position.z,false,cam);for(const b of out.boats){const u=b.userData;b.position.y=WL-.3+Math.sin(t*.8+u.ph)*.25;b.rotation.z=Math.sin(t*.6+u.ph)*.03;b.rotation.x=Math.sin(t*.7+u.ph*2)*.02;if(u.t!=='ship'){b.position.x=u.x+Math.sin(t*.02+u.ph)*30;b.position.z=u.z+Math.cos(t*.02+u.ph)*16;}}if(out.jet){out.jet.scale.y=.9+Math.sin(t*7)*.08;}};
 return out;}
function poly2(P){let s=0;P[0].s=0;for(let i=1;i<P.length;i++){s+=Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z);P[i].s=s;}P.len=s;return P;}
export {glowMat,PropSet,ribbon};

/* ---------- street trees: trunk + limbs + clumped canopy with soft, centre-out normals and baked AO ---------- */
function treeGeo(){const parts=[];const R=rng(31);const bark=new THREE.Color(.3,.24,.19);
 const tr=new THREE.CylinderGeometry(.11,.19,3.4,6,1,true);tr.translate(0,1.7,0);parts.push([tr,null,bark]);
 for(let k=0;k<3;k++){const a=k/3*Math.PI*2+.4,g=new THREE.CylinderGeometry(.05,.09,1.6,4,1,true);g.translate(0,.8,0);g.rotateZ(.75);g.rotateY(a);g.translate(0,2.6+k*.25,0);parts.push([g,null,bark]);}
 const C0=new V(0,4.4,0);for(let k=0;k<7;k++){const g=new THREE.IcosahedronGeometry(1,1);const r=.95+R()*.6;const a=R()*Math.PI*2,rr=k?.6+R()*.9:0,y=4.2+(R()-.4)*1.4+(k?0:.5);const cx=Math.cos(a)*rr,cz=Math.sin(a)*rr;
  g.scale(r,r*.82,r);g.translate(cx,y,cz);const p=g.attributes.position,n=g.attributes.normal,col=new Float32Array(p.count*3);const base=new THREE.Color().setHSL(.25+R()*.05,.45,.24+R()*.06);
  for(let i=0;i<p.count;i++){const x=p.getX(i),yy=p.getY(i),z=p.getZ(i);const d=new V(x,yy,z).sub(C0);const out=d.length();d.normalize();n.setXYZ(i,d.x*.75+n.getX(i)*.25,d.y*.75+n.getY(i)*.25,d.z*.75+n.getZ(i)*.25);
   const hn=Math.sin(x*12.9+yy*7.1+z*5.3)*.5+.5;const ao=Math.min(1,.42+.35*(yy-3)/2.4+.28*out/2.2)*(.82+hn*.3);col.set([base.r*ao,base.g*ao,base.b*ao],i*3);}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));parts.push([g]);}
 return merge(parts);}
function treeMat(U){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});m.onBeforeCompile=sh=>{sh.uniforms.uTime=U.uTime;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat hy=max(transformed.y-2.5,0.)/3.;float ph=instanceMatrix[3].x*.21+instanceMatrix[3].z*.13;transformed.x+=sin(uTime*1.3+ph)*.07*hy;transformed.z+=sin(uTime*1.7+ph*1.3)*.05*hy;');};
 m.customProgramCacheKey=()=>'tree2';return m;}
const PARK_TYPES=['pip','marlin','hauler','bruiser','cabby'];
const PARK_PAINT=[0xe8e8ec,0x15171c,0x9aa3ad,0x2a5bd7,0xc4201a,0x2f7d5a,0x6a4a3a,0xd8c8a8,0x4fc3e8,0x3a3f4a,0x7a1428,0xf2d36b,0x5b6470,0xb8bcc2];
// lays out curbside furniture + parked cars along every street and registers their collision solids
function furnish(W){const R=rng(2024),out={trees:[],bins:[],news:[],meters:[],bollards:[],shelters:[],parked:[]};
 const near=(L,x,z,r)=>L.some(o=>Math.abs(o.x-x)<r&&Math.abs(o.z-z)<r);const poiNear=(x,z,r)=>W.pois.some(p=>Math.hypot(p.x-x,p.z-z)<r||(p.car&&Math.hypot(p.car[0]-x,p.car[1]-z)<r));
 const deckNear=(x,z)=>{for(const d of W.dHash.at(x,z)){if(d.kind==='bridge'||d.kind==='fwy')continue;const qx=x-d.ax,qz=z-d.az,u=qx*d.dx+qz*d.dz;if(u>-8&&u<d.len+8&&Math.abs(qx*d.dz-qz*d.dx)<d.hw+4)return true;}return false;};
 const solid=(x0,z0,x1,z1,y1,kind,ref)=>{const s=W.addSolid(x0,z0,x1,z1,-.5,y1,kind,{ref});W.sHash.add(s,s.x0,s.z0,s.x1,s.z1);return s;};
 const _c={};const free=(x,z,r)=>{W.collide(x,z,r,.2,2,_c);return!_c.hit;};const tl=W.tlights;
 for(const e of W.edges){if(e.kind!=='street')continue;const a=W.nodes[e.a],b=W.nodes[e.b];const L=e.len,dx=(b.x-a.x)/L,dz=(b.z-a.z)/L;
  for(const side of[-1,1]){const nx=-dz*side,nz=dx*side;
   // sidewalk furniture line, 1.1 m in from the curb
   for(let s=RW+5,k=0;s<L-RW-5;s+=8.5,k++){const x=a.x+dx*s+nx*(RW+1.1),z=a.z+dz*s+nz*(RW+1.1);const blk=W.blockAt(x,z);if(!blk||blk.walk)continue;
    if(near(W.lamps,x,z,3.2)||near(W.hydrants,x,z,2.5)||near(tl,x,z,4)||near(W.palms,x,z,3)||poiNear(x,z,7)||W.excluded(x,z,x,z,1)||!free(x,z,.6))continue;const d=blk.d;
    if((d==='downtown'||d==='midtown'||d==='strip'||d==='canal')&&k%2===0){out.trees.push({x,z,ry:R()*6.28,s:.85+R()*.35,h:R()});solid(x-.22,z-.22,x+.22,z+.22,6,'pole');continue;}
    const r=R();if(r<.22){out.bins.push({x,z});solid(x-.3,z-.3,x+.3,z+.3,1,'prop');}
    else if(r<.34&&d!=='suburb'){const ry=Math.atan2(-nx,-nz);for(let j=0;j<2;j++){const o=(j-.5)*.6;out.news.push({x:x+dz*o*side,z:z-dx*o*side,ry,col:[0x2a5bd7,0xc4201a,0x2f7d5a,0xffc61a][R()*4|0]});}solid(x-.6,z-.6,x+.6,z+.6,1.1,'prop');}
    else if(r<.42&&(d==='downtown'||d==='midtown'||d==='strip')&&L>80&&Math.abs(s-L/2)<12){const ry=Math.atan2(-nx,-nz);out.shelters.push({x:x+nx*.4,z:z+nz*.4,ry,ad:R()*8|0});}}
   // parked cars in the curb lane, with meters on the sidewalk beside them downtown
   for(let s=RW+9;s<L-RW-9;s+=6.6){if(R()<.5)continue;const lat=RW-1.15,x=a.x+dx*s+nx*lat,z=a.z+dz*s+nz*lat;const cx=a.x+dx*s+nx*(RW+.5),cz=a.z+dz*s+nz*(RW+.5);
    if(e.bridge&&x>CANAL[0]-14&&x<CANAL[1]+14)continue;if(!W.blockAt(cx,cz)||near(W.hydrants,x,z,5)||poiNear(x,z,16)||deckNear(x,z)||W.excluded(x-3,z-3,x+3,z+3,2)||!free(x,z,1.6))continue;
    const id=PARK_TYPES[R()*PARK_TYPES.length|0],dims={pip:[3.9,1.76],marlin:[5.1,1.96],hauler:[5.2,1.98],bruiser:[4.85,1.98],cabby:[4.7,1.86]}[id];const ang=Math.atan2(dx*side,dz*side);
    const c={id,x,z,y:yAt0(W,x,z),a:ang,paint:id==='cabby'?0xffc61a:PARK_PAINT[R()*PARK_PAINT.length|0],dead:false};const hx=Math.abs(dx)*dims[0]/2+Math.abs(dz)*dims[1]/2,hz=Math.abs(dz)*dims[0]/2+Math.abs(dx)*dims[1]/2;
    c.solid=solid(x-hx,z-hz,x+hx,z+hz,1.45,'parked',c);out.parked.push(c);
    const blk=W.blockAt(cx,cz);if(blk&&(blk.d==='downtown'||blk.d==='midtown')&&R()<.6){const mx=a.x+dx*s+nx*(RW+.45),mz=a.z+dz*s+nz*(RW+.45);if(!near(W.lamps,mx,mz,1.5)&&!near(out.trees,mx,mz,1.5))out.meters.push({x:mx,z:mz,ry:Math.atan2(nx,nz)});}}}}
 // bollards guarding the corners downtown
 for(const n of W.nodes){if(n.kind!=='grid')continue;for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const x=n.x+sx*(RW+.6),z=n.z+sz*(RW+.6);const blk=W.blockAt(x+sx*.5,z+sz*.5);if(!blk||blk.d!=='downtown')continue;
   for(const[ox,oz]of[[sx*1.2,0],[0,sz*1.2]])if(!near(tl,x+ox,z+oz,1.2)&&!near(W.lamps,x+ox,z+oz,1.2))out.bollards.push({x:x+ox,z:z+oz});}}
 return out;}
const yAt0=(W,x,z)=>W.groundBase(x,z)+.0;
