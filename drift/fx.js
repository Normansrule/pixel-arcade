// SIDEWAYS — effects: lit tyre smoke, skid-mark decals, sparks/embers, rain, planar wet reflection, backfire flames.
import * as THREE from '../vendor/three.module.min.js';
import {ctex} from './util.js';
const V=THREE.Vector3;

/* ---------- lit tyre smoke (alpha-blended billboards lit by lamps, headlights and taillights) ---------- */
export const NL=8;
export class Smoke{
 constructor(scene,n=3200){this.n=n;this.i=0;const A=(k)=>new Float32Array(n*k);
  this.p=A(3);this.v=A(3);this.life=A(1);this.max=A(1);this.s0=A(1);this.s1=A(1);this.al=A(1);this.size=A(1);this.alpha=A(1);this.rot=A(1);this.tint=A(3);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('size',new THREE.BufferAttribute(this.size,1).setUsage(THREE.DynamicDrawUsage));g.setAttribute('alpha',new THREE.BufferAttribute(this.alpha,1).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('rot',new THREE.BufferAttribute(this.rot,1));g.setAttribute('tint',new THREE.BufferAttribute(this.tint,3).setUsage(THREE.DynamicDrawUsage));
  const lp=[],lc=[];for(let i=0;i<NL;i++){lp.push(new V(0,-999,0));lc.push(new THREE.Color(0,0,0));}
  this.U={uScale:{value:600},uTex:{value:puffTex()},uAmb:{value:new THREE.Color(.1,.11,.14)},uLP:{value:lp},uLC:{value:lc},uHP:{value:new V()},uHD:{value:new V(0,0,1)},uHC:{value:new THREE.Color(1,.95,.85)},uTP:{value:new V()},uTC:{value:new THREE.Color(.12,.012,.006)},uSun:{value:new V(0,1,0)},uSunC:{value:new THREE.Color(0,0,0)},uMax:{value:900}};
  this.mat=new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,
   vertexShader:`attribute float size,alpha,rot;attribute vec3 tint;uniform float uScale,uMax;uniform vec3 uAmb,uLP[${NL}],uLC[${NL}],uHP,uHD,uHC,uTP,uTC,uSun,uSunC;varying float vA,vR;varying vec3 vC;
    void main(){vec4 wp=modelMatrix*vec4(position,1.);vec4 mv=viewMatrix*wp;vec3 L=uAmb;
     for(int i=0;i<${NL};i++){vec3 d=uLP[i]-wp.xyz;float dd=dot(d,d);L+=uLC[i]*(1./(1.+dd*.025))*smoothstep(1000.,120.,dd);}
     vec3 hd=wp.xyz-uHP;float hl=length(hd);float cone=smoothstep(.55,.92,dot(hd/max(hl,.01),uHD));L+=uHC*cone*(1.4/(1.+hl*hl*.03));
     vec3 td=wp.xyz-uTP;L+=uTC*(1.2/(1.+dot(td,td)*.6));L+=uSunC*.6;
     vC=tint*L;vA=alpha;vR=rot;gl_PointSize=min(uMax,size*uScale/max(.5,-mv.z));gl_Position=projectionMatrix*mv;
     vA*=smoothstep(1.,5.5,-mv.z);}`,
   fragmentShader:`uniform sampler2D uTex;varying float vA,vR;varying vec3 vC;void main(){vec2 c=gl_PointCoord-.5;float s=sin(vR),co=cos(vR);c=mat2(co,-s,s,co)*c+.5;vec4 t=texture2D(uTex,c);float a=t.a*vA;if(a<.004)discard;gl_FragColor=vec4(vC*(.75+.5*t.r),a);}`});
  this.pts=new THREE.Points(g,this.mat);this.pts.frustumCulled=false;this.pts.renderOrder=5;scene.add(this.pts);this.g=g;}
 emit(x,y,z,vx,vy,vz,s0,s1,life,al,r=1,gg=1,b=1){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;
  this.life[i]=this.max[i]=life;this.s0[i]=s0;this.s1[i]=s1;this.al[i]=al;this.rot[i]=Math.random()*6.28;this.tint[i*3]=r;this.tint[i*3+1]=gg;this.tint[i*3+2]=b;this.g.attributes.rot.needsUpdate=true;}
 update(dt,wind){const{p,v,life,max,size,alpha,s0,s1,al}=this;let any=false;const dr=Math.exp(-dt*1.6);
  for(let i=0;i<this.n;i++){if(life[i]<=0){if(alpha[i]!==0){alpha[i]=0;size[i]=0;}continue;}any=true;life[i]-=dt;const k=1-Math.max(0,life[i])/max[i];
   v[i*3]=v[i*3]*dr+(wind?wind.x*dt:0);v[i*3+1]=v[i*3+1]*dr+.55*dt;v[i*3+2]=v[i*3+2]*dr+(wind?wind.z*dt:0);p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   size[i]=s0[i]+(s1[i]-s0[i])*(1-(1-k)*(1-k));alpha[i]=al[i]*Math.min(1,k*k*16)*(1-k)*(1-k)*1.1;}
  const g=this.g;g.attributes.position.needsUpdate=g.attributes.size.needsUpdate=g.attributes.alpha.needsUpdate=g.attributes.tint.needsUpdate=true;return any;}
 clear(){this.life.fill(0);this.alpha.fill(0);this.size.fill(0);}}
let _puff=null;function puffTex(){if(_puff)return _puff;_puff=ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);
  for(let i=0;i<26;i++){const a=Math.random()*6.28,r=Math.random()*28,cx=w/2+Math.cos(a)*r,cy=h/2+Math.sin(a)*r,rr=18+Math.random()*26;const g=x.createRadialGradient(cx,cy,0,cx,cy,rr);const v=180+Math.random()*75|0;
   g.addColorStop(0,`rgba(${v},${v},${v},.22)`);g.addColorStop(1,`rgba(${v},${v},${v},0)`);x.fillStyle=g;x.fillRect(0,0,w,h);}
  const id=x.getImageData(0,0,w,h),d=id.data;for(let j=0;j<h;j++)for(let i=0;i<w;i++){const e=Math.hypot(i-w/2,j-h/2)/(w/2);const k=(j*w+i)*4;d[k+3]=d[k+3]*Math.max(0,1-e*e);}x.putImageData(id,0,0);},{clamp:true,srgb:false});return _puff;}

/* ---------- additive sparks / embers / flame bits ---------- */
export class Sparks{constructor(scene,n=1500){this.n=n;this.i=0;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*3);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
   vertexShader:'attribute float size;uniform float uScale;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;gl_PointSize=min(64.,size*uScale/max(.1,-mv.z));gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vC*a*a,1.);}'}));this.pts.frustumCulled=false;this.pts.renderOrder=6;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=9.8){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;}
 update(dt,floor=0){const{p,v,c,oc,s,os,life,max,g}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]);
   v[i*3+1]-=g[i]*dt;const dr=Math.exp(-dt*.8);v[i*3]*=dr;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   const f=k*k;c[i*3]=oc[i*3]*f;c[i*3+1]=oc[i*3+1]*f*f;c[i*3+2]=oc[i*3+2]*f*f;s[i]=os[i]*(.5+.5*k);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;}
 clear(){this.life.fill(0);this.s.fill(0);}}

/* ---------- skid marks: ring buffer of quads (rgba vertex colours) ---------- */
export class Skids{constructor(scene,n=7000){this.n=n;this.i=0;this.pos=new Float32Array(n*4*3);this.col=new Float32Array(n*4*4);const idx=new Uint32Array(n*6);
  for(let i=0;i<n;i++){const a=i*4;idx.set([a,a+1,a+2,a+1,a+3,a+2],i*6);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.col,4).setUsage(THREE.DynamicDrawUsage));g.setIndex(new THREE.BufferAttribute(idx,1));
  this.mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,color:0xffffff});
  this.mesh=new THREE.Mesh(g,this.mat);this.mesh.frustumCulled=false;this.mesh.renderOrder=1;scene.add(this.mesh);this.g=g;this.dirty=false;this.lo=n;this.hi=0;}
 // a,b: previous / current contact points (V3), w half-width, alpha
 add(ax,ay,az,bx,by,bz,w,a0,a1,col){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz);if(l<.01)return;const nx=-dz/l*w,nz=dx/l*w,i=this.i;this.i=(i+1)%this.n;
  const P=this.pos,o=i*12;P[o]=ax+nx;P[o+1]=ay;P[o+2]=az+nz;P[o+3]=ax-nx;P[o+4]=ay;P[o+5]=az-nz;P[o+6]=bx+nx;P[o+7]=by;P[o+8]=bz+nz;P[o+9]=bx-nx;P[o+10]=by;P[o+11]=bz-nz;
  const C=this.col,q=i*16,r=col?col[0]:.02,g=col?col[1]:.02,b=col?col[2]:.022;for(let k=0;k<4;k++){C[q+k*4]=r;C[q+k*4+1]=g;C[q+k*4+2]=b;C[q+k*4+3]=k<2?a0:a1;}this.dirty=true;}
 flush(){if(!this.dirty)return;this.g.attributes.position.needsUpdate=this.g.attributes.color.needsUpdate=true;this.dirty=false;}
 clear(){this.pos.fill(0);this.col.fill(0);this.dirty=true;this.flush();}}

/* ---------- rain: line streaks wrapped around the camera on the GPU ---------- */
export class Rain{constructor(scene,n=5000){const p=new Float32Array(n*6),s=new Float32Array(n*2);for(let i=0;i<n;i++){const x=Math.random()*60-30,y=Math.random()*30,z=Math.random()*60-30,r=Math.random();p.set([x,y,z,x,y,z],i*6);s[i*2]=0;s[i*2+1]=1;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('e',new THREE.BufferAttribute(s,1));
  this.U={uT:{value:0},uC:{value:new V()},uV:{value:new V()}};
  this.mesh=new THREE.LineSegments(g,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:`attribute float e;uniform float uT;uniform vec3 uC,uV;varying float vA;void main(){vec3 p=position;p.y=mod(p.y-uT*24.,30.);vec3 w=uC+vec3(mod(p.x-uC.x,60.)-30.,p.y-8.,mod(p.z-uC.z,60.)-30.);
    w-=(vec3(-uV.x*.03,1.,-uV.z*.03)*.55)*e;vA=(.045+.05*e)*smoothstep(26.,4.,length(w-uC));gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}`,
   fragmentShader:'varying float vA;void main(){gl_FragColor=vec4(vec3(.62,.7,.82)*vA,1.);}'}));this.mesh.frustumCulled=false;scene.add(this.mesh);}
 update(dt,cam,vel){this.U.uT.value+=dt;this.U.uC.value.copy(cam.position);if(vel)this.U.uV.value.copy(vel);}}

/* ---------- planar reflection (flat wet tracks; reflects y=0) ---------- */
export class Mirror{constructor(scale=.5){this.rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType});this.cam=new THREE.PerspectiveCamera();this.mat=new THREE.Matrix4();this.scale=scale;this.on=true;
  this.U={tRefl:{value:this.rt.texture},uTexMat:{value:this.mat},uReflStr:{value:.5}};}
 render(R,scene,cam,w,h,hide){if(!this.on)return;const rw=Math.max(4,w*this.scale|0),rh=Math.max(4,h*this.scale|0);if(this.rt.width!==rw||this.rt.height!==rh)this.rt.setSize(rw,rh);
  const vc=this.cam,d=new V(0,0,-1).applyQuaternion(cam.quaternion),up=new V(0,1,0).applyQuaternion(cam.quaternion);
  vc.position.set(cam.position.x,-cam.position.y,cam.position.z);vc.up.set(up.x,-up.y,up.z);vc.lookAt(cam.position.x+d.x,-(cam.position.y+d.y),cam.position.z+d.z);
  vc.near=cam.near;vc.far=cam.far;vc.updateMatrixWorld();vc.projectionMatrix.copy(cam.projectionMatrix);
  this.mat.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
  const pl=new THREE.Plane(new V(0,1,0),0).applyMatrix4(vc.matrixWorldInverse),cp=new THREE.Vector4(pl.normal.x,pl.normal.y,pl.normal.z,pl.constant),pm=vc.projectionMatrix.elements;
  const q=new THREE.Vector4((Math.sign(cp.x)+pm[8])/pm[0],(Math.sign(cp.y)+pm[9])/pm[5],-1,(1+pm[10])/pm[14]);cp.multiplyScalar(2/cp.dot(q));pm[2]=cp.x;pm[6]=cp.y;pm[10]=cp.z+1-.003;pm[14]=cp.w;
  const prevFog=scene.fog;hide.forEach(o=>o.visible=false);const prev=R.getRenderTarget();R.setRenderTarget(this.rt);R.clear();R.render(scene,vc);R.setRenderTarget(prev);hide.forEach(o=>o.visible=true);scene.fog=prevFog;}}
// patch a standard material so it adds the mirror texture, rippled + blurred by a puddle/roughness mask
export function reflective(mat,U,key='refl'){mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform mat4 uTexMat;varying vec4 vRefl;varying vec3 vWP;').replace('#include <project_vertex>','#include <project_vertex>\nvRefl=uTexMat*modelMatrix*vec4(transformed,1.);vWP=(modelMatrix*vec4(transformed,1.)).xyz;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tRefl;uniform float uReflStr;varying vec4 vRefl;varying vec3 vWP;').replace('#include <opaque_fragment>',`
 {vec2 ruv=vRefl.xy/vRefl.w;float wet=clamp(1.-roughnessFactor*1.25,0.,1.);float h1=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5,h2=fract(sin(dot(gl_FragCoord.xy,vec2(39.346,11.135)))*23421.631)-.5;
  vec2 rip=vec2(sin(vWP.x*3.1+vWP.z*.7),cos(vWP.z*2.7-vWP.x*.4))*.003;vec2 j=vec2(h1,h2)*mix(.02,.004,wet)+rip;
  vec3 rc=(texture2D(tRefl,ruv+j).rgb+texture2D(tRefl,ruv-j*1.7).rgb+texture2D(tRefl,ruv+vec2(-j.y,j.x)*2.3).rgb+texture2D(tRefl,ruv+vec2(j.y,-j.x)*1.2).rgb)*.25;
  float fr=.25+.75*pow(1.-abs(dot(normalize(vViewPosition),normal)),4.);outgoingLight+=rc*uReflStr*fr*(.25+wet);}
 #include <opaque_fragment>`);};mat.customProgramCacheKey=()=>key;return mat;}

/* ---------- backfire flame cone (one per car) ---------- */
export function makeFlame(){const g=new THREE.ConeGeometry(.09,.55,10,1,true);g.rotateX(-Math.PI/2);g.translate(0,0,-.27);
 const m=new THREE.MeshBasicMaterial({color:new THREE.Color(4,1.8,.5),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
 const core=new THREE.Mesh(new THREE.ConeGeometry(.05,.3,8,1,true).rotateX(-Math.PI/2).translate(0,0,-.15),new THREE.MeshBasicMaterial({color:new THREE.Color(3,3.4,5),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
 const f=new THREE.Mesh(g,m);f.add(core);f.visible=false;return f;}
