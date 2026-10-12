// NEON BAY — effects: GPU particles (smoke + glow), skid marks, headlight beams, mission beacons/checkpoints.
import {THREE,cl} from './util.js';
import * as TX from './tex.js';
const V=THREE.Vector3;

export class Particles{constructor(scene,n,add){this.n=n;this.add=add;const A=k=>new Float32Array(n*k);Object.assign(this,{p:A(3),v:A(3),c:A(3),oc:A(3),al:A(1),s:A(1),os:A(1),life:A(1),max:A(1),g:A(1),drag:A(1),grow:A(1)});this.i=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('alpha',new THREE.BufferAttribute(this.al,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,vertexColors:true,
   vertexShader:'attribute float size,alpha;uniform float uScale;varying vec3 vC;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vA=alpha*smoothstep(1.5,9.,-mv.z);gl_PointSize=min(size*uScale/max(.1,-mv.z),300.);gl_Position=projectionMatrix*mv;}',
   fragmentShader:add?'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vC*a*vA,1.);}'
    :'varying vec3 vC;varying float vA;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);float a=smoothstep(.5,.15,d)*vA;if(a<.01)discard;gl_FragColor=vec4(vC,a);}'}));this.pts.frustumCulled=false;this.pts.renderOrder=add?5:4;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,o={}){const i=this.i;this.i=(i+1)%this.n;this.p.set([x,y,z],i*3);this.v.set([vx,vy,vz],i*3);this.oc.set([r,g,b],i*3);this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=o.grav??0;this.drag[i]=o.drag??1;this.grow[i]=o.grow??0;this.al[i]=o.a??1;this.a0=this.a0||new Float32Array(this.n);this.a0[i]=o.a??1;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.up)dy=Math.abs(dy);if(o.dir){dx=dx*(o.spread??.6)+o.dir.x;dy=dy*(o.spread??.6)+o.dir.y;dz=dz*(o.spread??.6)+o.dir.z;}const s=speed*(.35+Math.random()*.65);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x,p.y,p.z,dx*s,dy*s,dz*s,c.r,c.g,c.b,size*(.6+Math.random()*.8),life*(.6+Math.random()*.6),o);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag,grow,al}=this;const a0=this.a0;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(this.add){const f=k*k;c[i*3]=oc[i*3]*f;c[i*3+1]=oc[i*3+1]*f;c[i*3+2]=oc[i*3+2]*f;s[i]=os[i]*(.4+.6*k);al[i]=1;}
   else{c[i*3]=oc[i*3];c[i*3+1]=oc[i*3+1];c[i*3+2]=oc[i*3+2];s[i]=os[i]*(1+grow[i]*(1-k));al[i]=(a0?a0[i]:1)*Math.min(1,k*2.2)*Math.min(1,(1-k)*8+.15);}}
  const ga=this.geo.attributes;ga.position.needsUpdate=ga.color.needsUpdate=ga.size.needsUpdate=ga.alpha.needsUpdate=true;}}

export class Skids{constructor(scene,n=900){const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);this.mesh=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.42,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-8}),n);
  this.mesh.frustumCulled=false;this.mesh.count=0;this.i=0;this.n=n;this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.last=new Map();scene.add(this.mesh);this.mesh.renderOrder=2;}
 mark(key,x,y,z,w){const L=this.last.get(key);this.last.set(key,{x,y,z});if(!L)return;const dx=x-L.x,dz=z-L.z,l=Math.hypot(dx,dz);if(l<.05||l>3)return;
  this.q.setFromAxisAngle(_up,Math.atan2(dx,dz));this.m.compose(_p.set((x+L.x)/2,(y+L.y)/2+.04,(z+L.z)/2),this.q,_s.set(w,1,l+.05));this.mesh.setMatrixAt(this.i,this.m);this.i=(this.i+1)%this.n;this.mesh.count=Math.min(this.n,Math.max(this.mesh.count,this.i));this.mesh.instanceMatrix.needsUpdate=true;}
 lift(key){this.last.delete(key);}}
const _up=new V(0,1,0),_p=new V(),_s=new V();

// night headlight pools projected on the road in front of each car
export class Beams{constructor(scene,U,n=80){const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);g.translate(0,0,.5);const m=new THREE.MeshBasicMaterial({map:TX.beamTex(),color:0xfff0d0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-8});
  m.onBeforeCompile=sh=>{sh.uniforms.uNight=U.uNight;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uNight;').replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb*=uNight*.55;');};
  this.mesh=new THREE.InstancedMesh(g,m,n);this.mesh.frustumCulled=false;this.mesh.count=0;this.k=0;this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();scene.add(this.mesh);this.mesh.renderOrder=3;}
 begin(){this.k=0;}add(v){if(this.k>=this.mesh.instanceMatrix.count||v.wrecked)return;const sa=Math.sin(v.a),ca=Math.cos(v.a),f=v.len/2+.2;this.q.setFromAxisAngle(_up,v.a);this.m.compose(_p.set(v.x+sa*f,v.y+.06,v.z+ca*f),this.q,_s.set(v.bike?3:4.6,1,v.bike?9:13));this.mesh.setMatrixAt(this.k++,this.m);}
 end(){this.mesh.count=this.k;this.mesh.instanceMatrix.needsUpdate=true;}}

// glowing light-column beacon (mission markers, checkpoints, drop-offs)
const beamGeo=new THREE.CylinderGeometry(1,1,1,24,1,true);beamGeo.translate(0,.5,0);const ringGeo=new THREE.RingGeometry(.82,1,40);ringGeo.rotateX(-Math.PI/2);
const beamMat=c=>{const m=new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color(c)},uT:{value:0},uA:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
 vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 uC;uniform float uT,uA;varying vec2 vU;void main(){float a=(1.-vU.y)*(1.-vU.y)*(.55+.45*sin(vU.y*30.-uT*4.));gl_FragColor=vec4(uC*a*uA,1.);}'});return m;};
export class Beacon{constructor(scene,color,o={}){this.g=new THREE.Group();this.r=o.r||3;this.h=o.h||26;this.col=new THREE.Color(color);
  this.bm=beamMat(color);this.beam=new THREE.Mesh(beamGeo,this.bm);this.beam.scale.set(this.r,this.h,this.r);this.g.add(this.beam);
  this.rm=new THREE.MeshBasicMaterial({color:this.col.clone().multiplyScalar(2.2),transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});this.ring=new THREE.Mesh(ringGeo,this.rm);this.ring.scale.setScalar(this.r);this.ring.position.y=.12;this.g.add(this.ring);
  if(o.icon){this.icon=new THREE.Sprite(new THREE.SpriteMaterial({map:o.icon,depthWrite:false,transparent:true}));this.icon.scale.set(2.6,2.6,1);this.icon.position.y=4.2;this.g.add(this.icon);}
  if(o.arch){const t=new THREE.Mesh(new THREE.TorusGeometry(o.arch,.35,8,40,Math.PI),new THREE.MeshBasicMaterial({color:this.col.clone().multiplyScalar(2.5)}));this.arch=t;this.g.add(t);}
  scene.add(this.g);this.t=Math.random()*5;this.g.visible=false;}
 set(x,y,z,a){this.g.position.set(x,y,z);if(a!==undefined&&this.arch)this.arch.rotation.y=a+Math.PI/2;this.g.visible=true;return this;}
 hide(){this.g.visible=false;}
 update(dt,camPos){if(!this.g.visible)return;this.t+=dt;this.bm.uniforms.uT.value=this.t;const s=1+Math.sin(this.t*3)*.06;this.ring.scale.setScalar(this.r*s);if(this.icon){this.icon.position.y=4.2+Math.sin(this.t*2)*.3;}
  // fade the tall beam when the camera is close so it doesn't blind
  if(camPos){const d=Math.hypot(camPos.x-this.g.position.x,camPos.z-this.g.position.z);const a=cl((d-4)/22,.06,1);this.bm.uniforms.uA.value=a;this.rm.opacity=.95*cl((d-2)/10,.15,1);if(this.icon)this.icon.material.opacity=cl((d-5)/10,0,1);}}}
