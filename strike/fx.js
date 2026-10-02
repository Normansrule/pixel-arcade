// STRIKE ZONE — effects: additive sparks/embers, soft smoke, tracers, rail beams, shockwave rings, stylised gibs (glowing chunks), scorch decals, pooled dynamic lights.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,R=Math.random;

class Points{constructor(scene,n,additive,tex){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.gr=new Float32Array(n);
  this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.rot=new Float32Array(n);this.al=new Float32Array(n);this.i=0;
  const geo=new THREE.BufferGeometry();const A=(a,k)=>new THREE.BufferAttribute(a,k).setUsage(THREE.DynamicDrawUsage);geo.setAttribute('position',A(this.p,3));geo.setAttribute('color',A(this.c,4));geo.setAttribute('size',A(this.s,1));geo.setAttribute('rot',A(this.rot,1));
  this.U={uScale:{value:500},uTex:{value:tex},uFog:{value:new THREE.Color()},uFogD:{value:.01}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute float rot;attribute vec4 color;uniform float uScale;varying vec4 vC;varying float vR,vD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vR=rot;vD=-mv.z;gl_PointSize=min(1024.,size*uScale/max(.05,-mv.z));gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'uniform vec3 uFog;uniform float uFogD;varying vec4 vC;varying float vR,vD;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);float f=exp(-uFogD*uFogD*vD*vD*.5);gl_FragColor=vec4(vC.rgb*a*vC.a*f,1.);}'
    :'uniform sampler2D uTex;uniform vec3 uFog;uniform float uFogD;varying vec4 vC;varying float vR,vD;void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);p=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+.5;vec4 t=texture2D(uTex,p);float f=1.-exp(-uFogD*uFogD*vD*vD);gl_FragColor=vec4(mix(vC.rgb*(1.1-.4*gl_PointCoord.y),uFog,f),t.a*vC.a*smoothstep(.1,1.,vD));}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?4:3;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0,alpha=1){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.gr[i]=grow;this.rot[i]=R()*6.28;this.al[i]=alpha;return i;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=R()*2-1,dy=R()*2-1,dz=R()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const s=o.spread??.6;dx=dx*s+o.dir.x;dy=dy*s+o.dir.y;dz=dz*s+o.dir.z;}if(o.up)dy=Math.abs(dy);const sp=speed*(.3+R()*.7);
  const c=Array.isArray(col)?col[R()*col.length|0]:col;this.emit(p.x,p.y,p.z,dx*sp,dy*sp,dz*sp,c.r,c.g,c.b,size*(.5+R()*.8),life*(.5+R()*.6),o.grav??0,o.drag??1.5,o.grow??0,o.alpha??1);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag,gr,al}=this;const add=this.add;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(add){const f=k*k;c[i*4]=oc[i*3]*f;c[i*4+1]=oc[i*3+1]*f;c[i*4+2]=oc[i*3+2]*f;c[i*4+3]=1;s[i]=os[i]*(.4+.6*k);}
   else{const fin=Math.min(1,(1-k)*8),fout=Math.min(1,life[i]/Math.min(1.5,max[i]*.4));c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=al[i]*fin*fout;os[i]+=gr[i]*dt;s[i]=os[i];this.rot[i]+=dt*.2;}}
  const A=this.geo.attributes;A.position.needsUpdate=A.color.needsUpdate=A.size.needsUpdate=A.rot.needsUpdate=true;}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}}

class Streaks{constructor(scene,n=96){this.n=n;this.list=[];const g=new THREE.BoxGeometry(1,1,1);g.translate(0,0,-.5);
  this.mesh=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),n);this.mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.z=new V(0,0,-1);this.t=new V();this.sc=new V();this.col=new THREE.Color();}
 // moving tracer (speed>0) or a fading beam (speed=0)
 fire(a,b,col,o={}){if(this.list.length>=this.n)this.list.shift();const d=new V().subVectors(b,a),dist=d.length();if(dist<.5)return;d.divideScalar(dist);this.list.push({a:a.clone(),d,dist,t:0,speed:o.speed??260,len:Math.min(o.len??4,dist),w:o.w??.03,col:new THREE.Color(col??0xffd080),life:o.life??.25,age:0});}
 update(dt){let k=0;for(let i=this.list.length-1;i>=0;i--){const t=this.list[i];t.age+=dt;if(t.speed>0){t.t+=dt*t.speed;if(t.t-t.len>t.dist)this.list.splice(i,1);}else if(t.age>t.life)this.list.splice(i,1);}
  for(const t of this.list){let head,tail,w=t.w,f=1;if(t.speed>0){head=Math.min(t.dist,t.t);tail=Math.max(0,t.t-t.len);}else{head=t.dist;tail=0;f=1-t.age/t.life;w=t.w*(1+t.age*6);}const L=head-tail;if(L<=.01)continue;
   this.q.setFromUnitVectors(this.z,t.d);this.m.compose(this.t.copy(t.a).addScaledVector(t.d,head),this.q,this.sc.set(w,w,L));this.mesh.setMatrixAt(k,this.m);this.col.copy(t.col).multiplyScalar(f);this.mesh.setColorAt(k,this.col);k++;}
  this.mesh.count=k;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;}
 clear(){this.list.length=0;this.mesh.count=0;}}

class Decals{constructor(scene,tex,n,size){this.n=n;this.i=0;const m=new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,roughness:.95});
  this.mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(size,size),m,n);this.mesh.count=0;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.q2=new THREE.Quaternion();this.Z=new V(0,0,1);this.sv=new V();this.pv=new V();}
 add(p,n,s=1){const i=this.i;this.i=(i+1)%this.n;this.q.setFromUnitVectors(this.Z,n);this.q2.setFromAxisAngle(this.Z,R()*6.28);this.q.multiply(this.q2);this.m.compose(this.pv.copy(p).addScaledVector(n,.01),this.q,this.sv.set(s,s,s));this.mesh.setMatrixAt(i,this.m);this.mesh.count=Math.max(this.mesh.count,i+1);this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.mesh.count=0;this.i=0;}}

// stylised gibs: chunky faceted shards that tumble, bounce and cool from glowing orange to dark
class Gibs{constructor(scene,n=220){this.n=n;this.list=[];const g=new THREE.IcosahedronGeometry(.5,0);this.mat=new THREE.MeshStandardMaterial({roughness:.55,metalness:.2,vertexColors:false});
  this.mesh=new THREE.InstancedMesh(g,this.mat,n);this.mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);this.mesh.castShadow=true;this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);
  this.glowM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});this.glow=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.5,0),this.glowM,n);this.glow.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);this.glow.frustumCulled=false;this.glow.count=0;scene.add(this.glow);
  this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.e=new THREE.Euler();this.sv=new V();this.c=new THREE.Color();}
 spawn(p,vel,col,glowCol,count,size,L){for(let k=0;k<count;k++){if(this.list.length>=this.n)this.list.shift();const a=R()*6.28,up=R();const sp=3+R()*7;
  this.list.push({p:new V(p.x+(R()-.5)*.6,p.y+(R()-.5)*.8,p.z+(R()-.5)*.6),v:new V(Math.cos(a)*sp+vel.x*.5,3+up*7+vel.y*.3,Math.sin(a)*sp+vel.z*.5),r:new V(R()*6,R()*6,R()*6),w:new V((R()-.5)*14,(R()-.5)*14,(R()-.5)*14),s:size*(.35+R()*.8),col:new THREE.Color(col).offsetHSL(0,0,(R()-.5)*.1),glow:new THREE.Color(glowCol),t:0,life:4+R()*2,rest:false,L});}}
 update(dt,fx){let k=0;for(let i=this.list.length-1;i>=0;i--){const g=this.list[i];g.t+=dt;if(g.t>g.life){this.list.splice(i,1);continue;}
   if(!g.rest){g.v.y-=22*dt;g.p.addScaledVector(g.v,dt);g.r.addScaledVector(g.w,dt);const gr=g.L?g.L.groundAt(g.p.x,g.p.z,g.p.y+.3):0;if(g.p.y-g.s*.3<gr){if(gr<-30){}else{g.p.y=gr+g.s*.3;g.v.y*=-.35;g.v.x*=.55;g.v.z*=.55;g.w.multiplyScalar(.6);if(Math.abs(g.v.y)<1.2&&Math.hypot(g.v.x,g.v.z)<1)g.rest=true;}}
    if(fx&&g.t<1.2&&R()<dt*14)fx.sparks.emit(g.p.x,g.p.y,g.p.z,0,.4,0,g.glow.r,g.glow.g,g.glow.b,.12,.5,-.5,1);}}
  for(const g of this.list){const shrink=g.t>g.life-.8?Math.max(.01,(g.life-g.t)/.8):1;this.e.set(g.r.x,g.r.y,g.r.z);this.q.setFromEuler(this.e);this.m.compose(g.p,this.q,this.sv.set(g.s*shrink,g.s*shrink*.8,g.s*shrink*1.1));this.mesh.setMatrixAt(k,this.m);this.mesh.setColorAt(k,g.col);
   const heat=Math.max(0,1-g.t/1.6);this.sv.multiplyScalar(1.12);this.m.compose(g.p,this.q,this.sv);this.glow.setMatrixAt(k,this.m);this.c.copy(g.glow).multiplyScalar(heat*.8);this.glow.setColorAt(k,this.c);k++;}
  this.mesh.count=this.glow.count=k;this.mesh.instanceMatrix.needsUpdate=this.glow.instanceMatrix.needsUpdate=true;if(k){this.mesh.instanceColor.needsUpdate=true;this.glow.instanceColor.needsUpdate=true;}}
 clear(){this.list.length=0;this.mesh.count=this.glow.count=0;}}

// expanding ground rings (shockwaves, spawn portals, pickups)
class Rings{constructor(scene,tex){this.list=[];this.scene=scene;this.geo=new THREE.RingGeometry(.86,1,48);this.geo.rotateX(-Math.PI/2);this.tex=tex;}
 add(p,col,r0,r1,life,o={}){const m=new THREE.Mesh(o.disc?new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2):this.geo,new THREE.MeshBasicMaterial({color:new THREE.Color(col),map:o.disc?this.tex:null,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.position.set(p.x,p.y+.06,p.z);if(o.vertical){m.rotation.x=Math.PI/2;}scene_add(this.scene,m);const r={m,r0,r1,life,t:0,col:m.material.color.clone(),spin:o.spin||0,wave:o.wave};this.list.push(r);return r;}
 update(dt){for(let i=this.list.length-1;i>=0;i--){const r=this.list[i];r.t+=dt;const k=r.t/r.life;if(k>=1){this.scene.remove(r.m);r.m.material.dispose();this.list.splice(i,1);continue;}const rad=r.r0+(r.r1-r.r0)*(r.wave?k:1-Math.pow(1-k,3));r.m.scale.set(rad,1,rad);r.m.rotation.y+=r.spin*dt;r.m.material.color.copy(r.col).multiplyScalar(1-k*k);}}
 clear(){for(const r of this.list)this.scene.remove(r.m);this.list.length=0;}}
function scene_add(s,m){s.add(m);}

export class FX{
 constructor(scene,TX){this.scene=scene;this.TX=TX;this.sparks=new Points(scene,3200,true);this.smoke=new Points(scene,1100,false,TX.puff);this.streaks=new Streaks(scene);this.holes=new Decals(scene,TX.scorch,140,.35);this.scorch=new Decals(scene,TX.scorch,30,3.6);this.gibs=new Gibs(scene);this.rings=new Rings(scene,TX.portal);
  this.lights=[0,1,2,3,4,5].map(()=>{const l=new THREE.PointLight(0xffb060,0,14,1.8);scene.add(l);return l;});this.li=0;}
 flash(p,col,int,dist=14){let l=this.lights[this.li];// reuse the dimmest light
  let best=0,bi=0;for(let i=0;i<this.lights.length;i++){const v=this.lights[i].intensity;if(i===0||v<best){best=v;bi=i;}}l=this.lights[bi];l.position.copy(p);l.color.set(col);l.intensity=int;l.distance=dist;return l;}
 impact(p,n,col){this.sparks.burst(p,6,6,[new THREE.Color(3,2.2,1),new THREE.Color(2.4,1.2,.4)],.06,.28,{dir:n,spread:.9,grav:9,drag:1});this.smoke.burst(p,2,1.2,new THREE.Color(.35,.32,.3),.35,.8,{dir:n,spread:.8,drag:3,grow:.8,alpha:.5});if(n.y<.9||R()<.5)this.holes.add(p,n,.6+R()*.5);}
 blood(p,d,col){// stylised ichor burst: glowing droplets, not gore
  const c=new THREE.Color(col||0xff5a10);this.sparks.burst(p,10,5,[c.clone().multiplyScalar(2.2),c.clone().multiplyScalar(1.2)],.09,.4,{dir:d,spread:.7,grav:12});}
 muzzle(p,d,col,big=1){this.sparks.burst(p,5,6*big,[new THREE.Color(col||0xffc070).multiplyScalar(2.6)],.07*big,.08,{dir:d,spread:.4,drag:4});this.flash(p,col||0xffb060,7*big,10);}
 explosion(p,big=1,col){const c=col?new THREE.Color(col):null;this.sparks.burst(p,70*big,18*big,c?[c.clone().multiplyScalar(3),c.clone().multiplyScalar(1.6),new THREE.Color(3,3,2.4)]:[new THREE.Color(3.4,2,.6),new THREE.Color(2.8,1,.2),new THREE.Color(3,2.8,2)],.45*big,.5,{drag:2.4,grav:2});
  this.sparks.burst(p,24*big,12*big,[new THREE.Color(2.6,1.4,.5)],.07,1,{up:true,grav:14,drag:.5});
  this.smoke.burst(p,14*big,4*big,[new THREE.Color(.16,.14,.13),new THREE.Color(.26,.22,.2)],1.4*big,2.2,{up:true,drag:1.6,grow:1.2,alpha:.7});this.flash(p,col||0xff8a30,80*big,20*big);
  this.rings.add({x:p.x,y:p.y-.3,z:p.z},col||0xff7a30,.5,4.5*big,.35);}
 spawnPortal(p,col){this.rings.add(p,col,.2,2.6,.9,{disc:true,spin:5});this.rings.add(p,col,.2,3.2,.7);this.sparks.burst({x:p.x,y:p.y+1,z:p.z},40,7,[new THREE.Color(col).multiplyScalar(2.5)],.15,.6,{up:true,drag:2});this.flash({x:p.x,y:p.y+1.5,z:p.z},col,40,12);}
 shock(p,col,r1,life){return this.rings.add(p,col,.5,r1,life,{wave:true});}
 rail(a,b,col){this.streaks.fire(a,b,col,{speed:0,w:.07,life:.6});this.streaks.fire(a,b,0xffffff,{speed:0,w:.025,life:.25});const d=new V().subVectors(b,a);const L=d.length();d.divideScalar(L);for(let s=0;s<L;s+=.6){const q=a.clone().addScaledVector(d,s);const c=new THREE.Color(col);this.sparks.emit(q.x,q.y,q.z,(R()-.5)*.6,(R()-.5)*.6,(R()-.5)*.6,c.r*1.4,c.g*1.4,c.b*1.4,.12,.5+R()*.3,0,1.5);}}
 update(dt,fog){this.sparks.update(dt);this.smoke.update(dt);this.streaks.update(dt);this.gibs.update(dt,this);this.rings.update(dt);if(fog){this.smoke.U.uFog.value.copy(fog.color);this.smoke.U.uFogD.value=fog.density;this.sparks.U.uFogD.value=fog.density*.6;}
  for(const l of this.lights)l.intensity*=Math.exp(-dt*16);}
 clear(){this.sparks.clear();this.smoke.clear();this.streaks.clear();this.holes.clear();this.scorch.clear();this.gibs.clear();this.rings.clear();for(const l of this.lights)l.intensity=0;}}
