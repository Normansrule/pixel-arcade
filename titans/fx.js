// HARDFALL — effects: GPU point particles (additive sparks + soft smoke), tracer/beam ribbons, shockwaves, decals, pooled dynamic lights.
import * as THREE from '../vendor/three.module.min.js';
import {V,rnd} from './util.js';
import {decalTex} from './tex.js';

export class Particles{
 constructor(scene,n=4000,smoke=false){this.n=n;this.smoke=smoke;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.fl=new Float32Array(n).fill(-1e9);this.i=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('col',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:smoke?THREE.NormalBlending:THREE.AdditiveBlending,
   vertexShader:'attribute float size;attribute vec4 col;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=col;vC.a*=smoothstep(.25,1.2,-mv.z);gl_PointSize=min(size*uScale/max(.1,-mv.z),400.);gl_Position=projectionMatrix*mv;}',
   fragmentShader:smoke?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vC.rgb,vC.a*a*a);}':'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.04,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=smoke?5:6;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,floor=-1e9){const i=this.i;this.i=(i+1)%this.n;const i3=i*3;this.p[i3]=x;this.p[i3+1]=y;this.p[i3+2]=z;this.v[i3]=vx;this.v[i3+1]=vy;this.v[i3+2]=vz;this.oc[i3]=r;this.oc[i3+1]=g;this.oc[i3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.fl[i]=floor;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const sp=o.spread??.6;dx=dx*sp+o.dir.x;dy=dy*sp+o.dir.y;dz=dz*sp+o.dir.z;}if(o.up)dy=Math.abs(dy);const s=speed*(.3+Math.random()*.7);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x+(o.jit?(Math.random()-.5)*o.jit:0),p.y+(o.jit?(Math.random()-.5)*o.jit:0),p.z+(o.jit?(Math.random()-.5)*o.jit:0),dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5,o.floor??-1e9);}}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag,fl}=this,sm=this.smoke;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt),i3=i*3;
   v[i3]*=dr;v[i3+1]=v[i3+1]*dr-g[i]*dt;v[i3+2]*=dr;p[i3]+=v[i3]*dt;p[i3+1]+=v[i3+1]*dt;p[i3+2]+=v[i3+2]*dt;if(p[i3+1]<fl[i]){p[i3+1]=fl[i];v[i3+1]*=-.35;v[i3]*=.6;v[i3+2]*=.6;}
   const i4=i*4;if(sm){c[i4]=oc[i3];c[i4+1]=oc[i3+1];c[i4+2]=oc[i3+2];c[i4+3]=k*Math.min(1,(1-k)*8)*.7;s[i]=os[i]*(1.8-k*.9);}else{const f=k*k;c[i4]=oc[i3]*f;c[i4+1]=oc[i3+1]*f;c[i4+2]=oc[i3+2]*f;c[i4+3]=1;s[i]=os[i]*(.4+.6*k);}}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.col.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}

// camera-facing ribbons: travelling tracers and lingering beams
export class Beams{
 constructor(scene,n=96){this.n=n;this.list=[];const A=new Float32Array(n*4*3),Bv=new Float32Array(n*4*3),side=new Float32Array(n*4),along=new Float32Array(n*4),col=new Float32Array(n*4*3),w=new Float32Array(n*4),idx=[];
  for(let i=0;i<n;i++){for(let k=0;k<4;k++){side[i*4+k]=k%2?1:-1;along[i*4+k]=k<2?0:1;}const a=i*4;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*4*3),3));g.setAttribute('a',new THREE.BufferAttribute(A,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('b',new THREE.BufferAttribute(Bv,3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('side',new THREE.BufferAttribute(side,1));g.setAttribute('along',new THREE.BufferAttribute(along,1));g.setAttribute('col',new THREE.BufferAttribute(col,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('w',new THREE.BufferAttribute(w,1).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  this.A=A;this.B=Bv;this.col=col;this.w=w;this.g=g;for(let i=0;i<n;i++)this.list.push({life:0});
  this.mesh=new THREE.Mesh(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:'attribute vec3 a,b,col;attribute float side,along,w;varying float vS,vA;varying vec3 vC;void main(){vec3 p=mix(a,b,along);vec3 d=b-a;float L=length(d);d=L>0.?d/L:vec3(0.,1.,0.);vec3 tc=normalize(cameraPosition-p);vec3 s=normalize(cross(d,tc)+vec3(1e-5));p+=s*w*side;vS=side;vA=along;vC=col;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',
   fragmentShader:'varying float vS,vA;varying vec3 vC;void main(){float c=exp(-vS*vS*3.);float core=exp(-vS*vS*30.);gl_FragColor=vec4(vC*(c*.6+core*1.4)*(.25+.75*vA),1.);}'}));this.mesh.frustumCulled=false;this.mesh.renderOrder=7;scene.add(this.mesh);this.i=0;}
 // moving tracer from a to b: speed m/s, len m
 tracer(a,b,col,w=.025,speed=320,len=7){const t=this._get();t.mode=0;t.a=a.clone();t.b=b.clone();t.d=a.distanceTo(b);t.s=0;t.sp=speed;t.len=len;t.c=col;t.wd=w;t.life=t.d/speed+.05;}
 beam(a,b,col,w=.08,life=.6){const t=this._get();t.mode=1;t.a=a.clone();t.b=b.clone();t.c=col;t.wd=w;t.life=t.max=life;}
 _get(){const t=this.list[this.i];this.i=(this.i+1)%this.n;return t;}
 clear(){for(const t of this.list)t.life=0;}
 update(dt){const{A,B,col,w}=this;const tv=new V();this.list.forEach((t,i)=>{let on=t.life>0;if(on){t.life-=dt;
   if(t.mode===0){t.s+=t.sp*dt;const e=Math.min(t.d,t.s),s0=Math.max(0,t.s-t.len);if(s0>=t.d)on=false;else{tv.subVectors(t.b,t.a).normalize();for(let k=0;k<4;k++){A[(i*4+k)*3]=t.a.x+tv.x*s0;A[(i*4+k)*3+1]=t.a.y+tv.y*s0;A[(i*4+k)*3+2]=t.a.z+tv.z*s0;B[(i*4+k)*3]=t.a.x+tv.x*e;B[(i*4+k)*3+1]=t.a.y+tv.y*e;B[(i*4+k)*3+2]=t.a.z+tv.z*e;col[(i*4+k)*3]=t.c[0];col[(i*4+k)*3+1]=t.c[1];col[(i*4+k)*3+2]=t.c[2];w[i*4+k]=t.wd;}}}
   else{const f=Math.max(0,t.life/t.max),ff=f*f;for(let k=0;k<4;k++){A[(i*4+k)*3]=t.a.x;A[(i*4+k)*3+1]=t.a.y;A[(i*4+k)*3+2]=t.a.z;B[(i*4+k)*3]=t.b.x;B[(i*4+k)*3+1]=t.b.y;B[(i*4+k)*3+2]=t.b.z;col[(i*4+k)*3]=t.c[0]*ff;col[(i*4+k)*3+1]=t.c[1]*ff;col[(i*4+k)*3+2]=t.c[2]*ff;w[i*4+k]=t.wd*(.4+.6*f);}}}
  if(!on){for(let k=0;k<4;k++)w[i*4+k]=0;}});
  for(const n of['a','b','col','w'])this.g.attributes[n].needsUpdate=true;}}

export class Shocks{constructor(scene,n=8){this.list=[];const geo=new THREE.SphereGeometry(1,32,16);for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color()},uA:{value:0}},
  vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.2);gl_FragColor=vec4(uC*f*uA,1.);}'}));m.visible=false;m.renderOrder=6;scene.add(m);this.list.push({m,t:0,d:1,r:1});}}
 fire(p,col,radius,dur){const s=this.list.find(s=>!s.m.visible)||this.list[0];s.m.position.copy(p);s.m.material.uniforms.uC.value.copy(col);s.t=0;s.d=dur;s.r=radius;s.m.visible=true;}
 clear(){for(const s of this.list)s.m.visible=false;}
 update(dt){for(const s of this.list){if(!s.m.visible)continue;s.t+=dt;const k=s.t/s.d;if(k>=1){s.m.visible=false;continue;}s.m.scale.setScalar(.3+s.r*(1-Math.pow(1-k,3)));s.m.material.uniforms.uA.value=(1-k)*(1-k)*1.6;}}}

export class Decals{constructor(scene,n=140){this.n=n;this.i=0;this.age=new Float32Array(n).fill(99);this.sz=new Float32Array(n);this.mats=[];
  this.mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:decalTex(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,opacity:.9}),n);
  this.mesh.frustumCulled=false;this.mesh.renderOrder=1;const z=new THREE.Matrix4().makeScale(0,0,0);for(let i=0;i<n;i++){this.mesh.setMatrixAt(i,z);this.mats.push(new THREE.Matrix4());}scene.add(this.mesh);this.q=new THREE.Quaternion();}
 add(p,n,size){const i=this.i;this.i=(i+1)%this.n;this.q.setFromUnitVectors(new V(0,0,1),n);const r=new THREE.Quaternion().setFromAxisAngle(n,Math.random()*6.28);this.q.premultiply(r);
  this.mats[i].compose(p.clone().addScaledVector(n,.01),this.q,new V(size,size,size));this.age[i]=0;this.sz[i]=size;this.mesh.setMatrixAt(i,this.mats[i]);this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){const z=new THREE.Matrix4().makeScale(0,0,0);for(let i=0;i<this.n;i++){this.age[i]=99;this.mesh.setMatrixAt(i,z);}this.mesh.instanceMatrix.needsUpdate=true;}
 update(dt){let ch=false;const m=new THREE.Matrix4(),p=new V(),q=new THREE.Quaternion(),s=new V();for(let i=0;i<this.n;i++){if(this.age[i]>=14)continue;this.age[i]+=dt;if(this.age[i]>11){const k=Math.max(0,(14-this.age[i])/3);this.mats[i].decompose(p,q,s);m.compose(p,q,s.setScalar(this.sz[i]*k));this.mesh.setMatrixAt(i,m);ch=true;}}if(ch)this.mesh.instanceMatrix.needsUpdate=true;}}

// fixed pool of point lights (fixed count keeps shaders from recompiling)
export class LightPool{constructor(scene,n=5){this.l=[];for(let i=0;i<n;i++){const L=new THREE.PointLight(0xffffff,0,14,1.8);L.position.set(0,-999,0);scene.add(L);this.l.push({L,t:0,life:0,base:0,own:null});}}
 flash(p,col,inten,dist,life){const s=this.l.filter(x=>!x.own).sort((a,b)=>(a.life-a.t)-(b.life-b.t))[0];if(!s)return;s.L.position.copy(p);s.L.color.set(col);s.base=inten;s.L.distance=dist;s.t=0;s.life=life;s.L.intensity=inten;}
 grab(owner,col,inten,dist){const s=this.l.find(x=>!x.own&&x.t>=x.life)||this.l.find(x=>!x.own);if(!s)return null;s.own=owner;s.L.color.set(col);s.L.intensity=inten;s.L.distance=dist;s.t=s.life=0;return s;}
 release(s){if(s){s.own=null;s.t=s.life=0;s.L.intensity=0;}}
 clear(){for(const s of this.l){s.own=null;s.t=s.life=0;s.L.intensity=0;}}
 update(dt){for(const s of this.l){if(s.own)continue;if(s.t<s.life){s.t+=dt;const k=Math.max(0,1-s.t/s.life);s.L.intensity=s.base*k*k;}else s.L.intensity=0;}}}
