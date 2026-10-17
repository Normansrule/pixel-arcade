// STRIKE ZONE — effects: additive sparks, soft lit smoke, tracers, bullet-hole and scorch decals, ejected brass, impact dust per surface,
// hit mist, explosions with shock rings, pooled dynamic lights (muzzle flashes light the room) and rocket trails.
import * as THREE from '../vendor/three.module.min.js';
import {fxTex} from './tex.js';
const V=THREE.Vector3,R=Math.random;

class Points{constructor(scene,n,additive,tex){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.gr=new Float32Array(n);
  this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.rot=new Float32Array(n);this.al=new Float32Array(n);this.i=0;this.alive=0;
  const geo=new THREE.BufferGeometry();const A=(a,k)=>new THREE.BufferAttribute(a,k).setUsage(THREE.DynamicDrawUsage);geo.setAttribute('position',A(this.p,3));geo.setAttribute('color',A(this.c,4));geo.setAttribute('size',A(this.s,1));geo.setAttribute('rot',A(this.rot,1));
  this.U={uScale:{value:500},uTex:{value:tex},uFog:{value:new THREE.Color()},uFogD:{value:.01}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute float rot;attribute vec4 color;uniform float uScale;varying vec4 vC;varying float vR,vD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vR=rot;vD=-mv.z;gl_PointSize=min(900.,size*uScale/max(.05,-mv.z));gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'uniform float uFogD;varying vec4 vC;varying float vR,vD;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);float f=exp(-uFogD*uFogD*vD*vD*.5);gl_FragColor=vec4(vC.rgb*a*vC.a*f,1.);}'
    :'uniform sampler2D uTex;uniform vec3 uFog;uniform float uFogD;varying vec4 vC;varying float vR,vD;void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);p=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+.5;vec4 t=texture2D(uTex,p);float f=1.-exp(-uFogD*uFogD*vD*vD);gl_FragColor=vec4(mix(vC.rgb*(1.1-.4*gl_PointCoord.y),uFog,f),t.a*vC.a*smoothstep(.1,1.,vD));}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?4:3;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0,alpha=1){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.gr[i]=grow;this.rot[i]=R()*6.28;this.al[i]=alpha;return i;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=R()*2-1,dy=R()*2-1,dz=R()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const s=o.spread??.6;dx=dx*s+o.dir.x;dy=dy*s+o.dir.y;dz=dz*s+o.dir.z;}if(o.up)dy=Math.abs(dy);const sp=speed*(.3+R()*.7);
  const c=Array.isArray(col)?col[R()*col.length|0]:col;this.emit(p.x,p.y,p.z,dx*sp,dy*sp,dz*sp,c.r,c.g,c.b,size*(.5+R()*.8),life*(.5+R()*.6),o.grav??0,o.drag??1.5,o.grow??0,o.alpha??1);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag,gr,al}=this;const add=this.add;let alive=0;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}alive++;life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(add){const f=k*k;c[i*4]=oc[i*3]*f;c[i*4+1]=oc[i*3+1]*f;c[i*4+2]=oc[i*3+2]*f;c[i*4+3]=1;s[i]=os[i]*(.4+.6*k);}
   else{const fin=Math.min(1,(1-k)*8),fout=Math.min(1,life[i]/Math.min(1.5,max[i]*.4));c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=al[i]*fin*fout;os[i]+=gr[i]*dt;s[i]=os[i];this.rot[i]+=dt*.2;}}
  this.alive=alive;const A=this.geo.attributes;A.position.needsUpdate=A.color.needsUpdate=A.size.needsUpdate=A.rot.needsUpdate=true;}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}}

class Streaks{constructor(scene,n=128){this.n=n;this.list=[];const g=new THREE.BoxGeometry(1,1,1);g.translate(0,0,-.5);
  this.mesh=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),n);this.mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.z=new V(0,0,-1);this.t=new V();this.sc=new V();this.col=new THREE.Color();}
 fire(a,b,col,o={}){if(this.list.length>=this.n)this.list.shift();const d=new V().subVectors(b,a),dist=d.length();if(dist<.5)return;d.divideScalar(dist);this.list.push({a:a.clone(),d,dist,t:o.skip||0,speed:o.speed??320,len:Math.min(o.len??5,dist),w:o.w??.025,col:new THREE.Color(col??0xffd890),life:o.life??.25,age:0});}
 update(dt){let k=0;for(let i=this.list.length-1;i>=0;i--){const t=this.list[i];t.age+=dt;if(t.speed>0){t.t+=dt*t.speed;if(t.t-t.len>t.dist)this.list.splice(i,1);}else if(t.age>t.life)this.list.splice(i,1);}
  for(const t of this.list){let head,tail,w=t.w,f=1;if(t.speed>0){head=Math.min(t.dist,t.t);tail=Math.max(0,t.t-t.len);}else{head=t.dist;tail=0;f=1-t.age/t.life;w=t.w*(1+t.age*6);}const L=head-tail;if(L<=.01)continue;
   this.q.setFromUnitVectors(this.z,t.d);this.m.compose(this.t.copy(t.a).addScaledVector(t.d,head),this.q,this.sc.set(w,w,L));this.mesh.setMatrixAt(k,this.m);this.col.copy(t.col).multiplyScalar(f);this.mesh.setColorAt(k,this.col);k++;}
  this.mesh.count=k;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;}
 clear(){this.list.length=0;this.mesh.count=0;}}

class Decals{constructor(scene,tex,n,size,o={}){this.n=n;this.i=0;const m=new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,roughness:.95,color:o.color||0xffffff});
  this.mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(size,size),m,n);this.mesh.count=0;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.q2=new THREE.Quaternion();this.Z=new V(0,0,1);this.sv=new V();this.pv=new V();}
 add(p,n,s=1){const i=this.i;this.i=(i+1)%this.n;this.q.setFromUnitVectors(this.Z,n);this.q2.setFromAxisAngle(this.Z,R()*6.28);this.q.multiply(this.q2);this.m.compose(this.pv.copy(p).addScaledVector(n,.008),this.q,this.sv.set(s,s,s));this.mesh.setMatrixAt(i,this.m);this.mesh.count=Math.max(this.mesh.count,i+1);this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.mesh.count=0;this.i=0;}}

// ejected brass: tumbling instanced casings that bounce and settle
class Brass{constructor(scene,n=80){this.n=n;this.list=[];const g=new THREE.CylinderGeometry(.006,.006,.03,6);g.rotateZ(Math.PI/2);this.mesh=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:0xd8a040,metalness:1,roughness:.3}),n);this.mesh.count=0;this.mesh.frustumCulled=false;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.e=new THREE.Euler();this.s=new V(1,1,1);}
 add(p,v,big=1){if(this.list.length>=this.n)this.list.shift();this.list.push({p:p.clone(),v:v.clone(),r:new V(R()*6,R()*6,R()*6),w:new V((R()-.5)*30,(R()-.5)*30,(R()-.5)*30),t:0,big,rest:false});}
 update(dt,L){let k=0;for(let i=this.list.length-1;i>=0;i--){const b=this.list[i];b.t+=dt;if(b.t>3.5){this.list.splice(i,1);continue;}if(!b.rest){b.v.y-=14*dt;b.p.addScaledVector(b.v,dt);b.r.addScaledVector(b.w,dt);const g=L?L.groundAt(b.p.x,b.p.z,b.p.y+.1,.01):0;if(b.p.y<g+.01){b.p.y=g+.01;b.v.y*=-.35;b.v.x*=.5;b.v.z*=.5;b.w.multiplyScalar(.5);if(Math.abs(b.v.y)<.5)b.rest=true;}}}
  for(const b of this.list){this.e.set(b.r.x,b.r.y,b.r.z);this.q.setFromEuler(this.e);const s=b.big*(b.t>3?(3.5-b.t)*2:1);this.m.compose(b.p,this.q,this.s.set(s*1.4,s,s));this.mesh.setMatrixAt(k++,this.m);}this.mesh.count=k;this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.list.length=0;this.mesh.count=0;}}

class Rings{constructor(scene){this.list=[];this.scene=scene;this.geo=new THREE.RingGeometry(.86,1,48);this.geo.rotateX(-Math.PI/2);}
 add(p,col,r0,r1,life,o={}){const m=new THREE.Mesh(this.geo,new THREE.MeshBasicMaterial({color:new THREE.Color(col),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.position.set(p.x,p.y+.06,p.z);if(o.face){m.lookAt(o.face);m.rotateX(Math.PI/2);}this.scene.add(m);const r={m,r0,r1,life,t:0,col:m.material.color.clone()};this.list.push(r);return r;}
 update(dt){for(let i=this.list.length-1;i>=0;i--){const r=this.list[i];r.t+=dt;const k=r.t/r.life;if(k>=1){this.scene.remove(r.m);r.m.material.dispose();this.list.splice(i,1);continue;}const rad=r.r0+(r.r1-r.r0)*(1-Math.pow(1-k,3));r.m.scale.set(rad,1,rad);r.m.material.color.copy(r.col).multiplyScalar(1-k*k);}}
 clear(){for(const r of this.list)this.scene.remove(r.m);this.list.length=0;}}

const DUST={concrete:[.62,.6,.56],concrete2:[.45,.46,.5],brick:[.55,.36,.28],stone:[.8,.74,.62],plaster:[.86,.82,.76],cobble:[.6,.56,.5],cobble2:[.78,.72,.62],asphalt:[.35,.35,.36],wood:[.5,.36,.22],crate:[.55,.4,.24],deck:[.45,.34,.24],tile:[.7,.7,.68],terracotta:[.62,.36,.24],membrane:[.3,.32,.3],fabric:[.5,.5,.5]};
const METAL={metal:1,steel:1,plate:1,container:1,painted:1,glass:1,barrel:1};
export class FX{
 constructor(scene){this.scene=scene;this.sparks=new Points(scene,2600,true);this.smoke=new Points(scene,1000,false,fxTex('puff'));this.tracers=new Streaks(scene);this.holes=new Decals(scene,fxTex('hole'),160,.13);this.scorch=new Decals(scene,fxTex('scorch'),24,3.2);this.brass=new Brass(scene);this.rings=new Rings(scene);
  this.lights=[0,1].map(()=>{const l=new THREE.PointLight(0xffb060,0,12,1.8);scene.add(l);return l;});this.trails=[];}
 flash(p,col,int,dist=12){let bi=0,best=1e9;for(let i=0;i<this.lights.length;i++){const v=this.lights[i].intensity;if(v<best){best=v;bi=i;}}const l=this.lights[bi];l.position.copy(p);l.color.set(col);l.intensity=int;l.distance=dist;return l;}
 impact(p,n,mat,big=1){const metal=METAL[mat];const d=DUST[mat]||[.55,.52,.5];
  if(metal)this.sparks.burst(p,7*big,7,[new THREE.Color(3,2.3,1.2),new THREE.Color(2.6,1.4,.5)],.05,.3,{dir:n,spread:.9,grav:10,drag:1});else this.sparks.burst(p,2,4,[new THREE.Color(1.8,1.4,1)],.04,.15,{dir:n,spread:.9,grav:9});
  this.smoke.burst(p,metal?1:3,1.4,new THREE.Color(d[0],d[1],d[2]),.28*big,.7,{dir:n,spread:.7,drag:3.4,grow:.9,alpha:.6});if(!metal)this.sparks.burst(p,4,3,[new THREE.Color(d[0]*.6,d[1]*.6,d[2]*.6)],.04,.5,{dir:n,spread:1,grav:9,drag:.6});
  this.holes.add(p,n,.8+R()*.5);}
 hit(p,d,head){this.smoke.burst(p,head?7:4,head?2.6:1.6,new THREE.Color(.55,.04,.04),head?.3:.22,.5,{dir:d,spread:.6,drag:3,grow:.7,alpha:.85});this.sparks.burst(p,head?8:4,3.5,[new THREE.Color(1.4,.08,.05)],.05,.35,{dir:d,spread:.7,grav:12});}
 muzzle(p,d,big=1,col=0xffb060){this.sparks.burst(p,4,5*big,[new THREE.Color(col).multiplyScalar(2.6)],.06*big,.07,{dir:d,spread:.35,drag:4});this.smoke.burst(p,1,.6,new THREE.Color(.5,.5,.5),.18*big,.6,{dir:d,spread:.4,drag:2,grow:.6,alpha:.25});this.flash(p,col,4.5*big,9);}
 explosion(p,big=1){this.sparks.burst(p,70*big,16*big,[new THREE.Color(3.4,2,.6),new THREE.Color(2.8,1,.2),new THREE.Color(3,2.8,2)],.45*big,.5,{drag:2.4,grav:2});this.sparks.burst(p,26*big,12*big,[new THREE.Color(2.6,1.4,.5)],.07,1,{up:true,grav:14,drag:.5});
  this.smoke.burst(p,16*big,4*big,[new THREE.Color(.16,.14,.13),new THREE.Color(.26,.22,.2)],1.5*big,2.4,{up:true,drag:1.6,grow:1.3,alpha:.75});this.flash(p,0xff8a30,70*big,18*big);this.rings.add({x:p.x,y:p.y-.3,z:p.z},0xff7a30,.5,5*big,.35);}
 rocketTrail(p,d){this.smoke.emit(p.x,p.y,p.z,(R()-.5)*.4,(R()-.5)*.4+.2,(R()-.5)*.4,.55,.53,.5,.35,1.4,0,1.2,.9,.55);this.sparks.emit(p.x,p.y,p.z,-d.x*3,-d.y*3,-d.z*3,3,1.6,.4,.18,.12,0,2);}
 spawnFx(p,col){this.rings.add(p,col,.2,1.6,.6);this.sparks.burst({x:p.x,y:p.y+1,z:p.z},24,4,[new THREE.Color(col).multiplyScalar(2.5)],.08,.6,{up:true,drag:2});}
 padFx(p,col){this.rings.add(p,col,.4,2.2,.4);this.sparks.burst({x:p.x,y:p.y+.3,z:p.z},14,6,[new THREE.Color(col).multiplyScalar(2.5)],.06,.4,{up:true,drag:2});}
 update(dt,fog,L){this.sparks.update(dt);this.smoke.update(dt);this.tracers.update(dt);this.brass.update(dt,L);this.rings.update(dt);if(fog){this.smoke.U.uFog.value.copy(fog.color);this.smoke.U.uFogD.value=fog.density;this.sparks.U.uFogD.value=fog.density*.6;}
  for(const l of this.lights)l.intensity*=Math.exp(-dt*20);}
 clear(){this.sparks.clear();this.smoke.clear();this.tracers.clear();this.holes.clear();this.scorch.clear();this.brass.clear();this.rings.clear();for(const l of this.lights)l.intensity=0;}}
