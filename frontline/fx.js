// FRONTLINE OPS — effects: additive sparks/fire, soft smoke, tracers, impact decals, flash lights, explosions.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;

export class Particles{constructor(scene,n=3000,additive=true,tex=null){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.gr=new Float32Array(n);
  this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.rot=new Float32Array(n);this.i=0;this.alive=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('rot',new THREE.BufferAttribute(this.rot,1));
  this.U={uScale:{value:500},uTex:{value:tex},uFog:{value:new THREE.Color()},uFogD:{value:.01}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute float rot;attribute vec4 color;uniform float uScale;varying vec4 vC;varying float vR,vD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vR=rot;vD=-mv.z;gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;varying float vR,vD;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}'
    :'uniform sampler2D uTex;uniform vec3 uFog;uniform float uFogD;varying vec4 vC;varying float vR,vD;void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);p=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+.5;vec4 t=texture2D(uTex,p);float f=1.-exp(-uFogD*uFogD*vD*vD);gl_FragColor=vec4(mix(vC.rgb,uFog,f),t.a*vC.a*2.2);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?3:2;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.gr[i]=grow;this.rot[i]=Math.random()*6.28;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const s=o.spread??.6;dx=dx*s+o.dir.x;dy=dy*s+o.dir.y;dz=dz*s+o.dir.z;}if(o.up)dy=Math.abs(dy);const sp=speed*(.3+Math.random()*.7);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x+(o.jit?(Math.random()-.5)*o.jit:0),p.y+(o.jit?(Math.random()-.5)*o.jit*.5:0),p.z+(o.jit?(Math.random()-.5)*o.jit:0),dx*sp,dy*sp,dz*sp,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5,o.grow??0);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag,gr}=this;let alive=0;const add=this.add;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}alive++;life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;if(p[i*3+1]<.03&&g[i]>0){p[i*3+1]=.03;v[i*3+1]*=-.35;v[i*3]*=.6;v[i*3+2]*=.6;}
   if(add){const f=k*k;c[i*4]=oc[i*3]*f;c[i*4+1]=oc[i*3+1]*f;c[i*4+2]=oc[i*3+2]*f;c[i*4+3]=1;s[i]=os[i]*(.4+.6*k);}else{c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=Math.min(1,(1-k)*6)*k;os[i]+=gr[i]*dt;s[i]=os[i];this.rot[i]+=dt*.2;}}
  this.alive=alive;this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;this.geo.attributes.rot.needsUpdate=!add;}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}}

export class Tracers{constructor(scene,n=80){this.n=n;this.list=[];const g=new THREE.BoxGeometry(.018,.018,1);g.translate(0,0,-.5);
  this.mesh=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(5,3.6,1.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}),n);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.z=new V(0,0,-1);}
 fire(a,b,speed=420,len=3.2,w=1){if(this.list.length>=this.n)this.list.shift();const d=new V().subVectors(b,a),dist=d.length();if(dist<1)return;d.divideScalar(dist);this.list.push({a:a.clone(),d,dist,t:0,speed,len:Math.min(len,dist),w});}
 update(dt){let k=0;for(let i=this.list.length-1;i>=0;i--){const t=this.list[i];t.t+=dt*t.speed;if(t.t-t.len>t.dist){this.list.splice(i,1);continue;}}
  for(const t of this.list){const head=Math.min(t.dist,t.t),tail=Math.max(0,t.t-t.len),L=head-tail;if(L<=.01)continue;this.q.setFromUnitVectors(this.z,t.d);this.m.compose(new V().copy(t.a).addScaledVector(t.d,tail),this.q,new V(t.w,t.w,L));this.mesh.setMatrixAt(k++,this.m);}
  this.mesh.count=k;this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.list.length=0;this.mesh.count=0;}}

export class Decals{constructor(scene,tex,n=240,size=.13,o={}){this.n=n;this.i=0;const m=new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,roughness:.9,color:o.color||0xffffff});
  this.mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(size,size),m,n);this.mesh.count=0;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.q2=new THREE.Quaternion();this.Z=new V(0,0,1);}
 add(p,n,s=1){const i=this.i;this.i=(i+1)%this.n;this.q.setFromUnitVectors(this.Z,n);this.q2.setFromAxisAngle(this.Z,Math.random()*6.28);this.q.multiply(this.q2);this.m.compose(new V().copy(p).addScaledVector(n,.012),this.q,new V(s,s,s));this.mesh.setMatrixAt(i,this.m);this.mesh.count=Math.max(this.mesh.count,i+1);this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.mesh.count=0;this.i=0;}}

export class LightPool{constructor(scene,n=4){this.list=[];for(let i=0;i<n;i++){const l=new THREE.PointLight(0xffaa55,0,12,1.6);scene.add(l);this.list.push({l,t:0,d:1,I:0});}this.k=0;}
 flash(p,col,I,dist,dur){const s=this.list.reduce((a,b)=>a.l.intensity<=b.l.intensity?a:b);s.l.position.copy(p);s.l.color.set(col);s.l.distance=dist;s.I=I;s.t=0;s.d=dur;s.l.intensity=I;}
 update(dt){for(const s of this.list){if(s.l.intensity<=0)continue;s.t+=dt;s.l.intensity=s.t>=s.d?0:s.I*Math.pow(1-s.t/s.d,2);}}
 clear(){for(const s of this.list)s.l.intensity=0;}}

// big shells for explosions
export class Shock{constructor(scene,n=4){this.list=[];const geo=new THREE.SphereGeometry(1,24,12);for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uA:{value:0}},
  vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.5);gl_FragColor=vec4(vec3(1.6,1.0,.6)*f*uA,1.);}'}));m.visible=false;scene.add(m);this.list.push({m,t:0,r:1});}}
 fire(p,r){const s=this.list.find(s=>!s.m.visible)||this.list[0];s.m.position.copy(p);s.t=0;s.r=r;s.m.visible=true;}
 update(dt){for(const s of this.list){if(!s.m.visible)continue;s.t+=dt;const k=s.t/.45;if(k>=1){s.m.visible=false;continue;}s.m.scale.setScalar(.5+s.r*(1-Math.pow(1-k,3)));s.m.material.uniforms.uA.value=(1-k)*(1-k)*.22;}}}

export class FX{constructor(scene,TX){this.sparks=new Particles(scene,3500,true);this.smoke=new Particles(scene,1400,false,TX.puff);this.tracers=new Tracers(scene);this.holes=new Decals(scene,TX.hole,260,.12);this.scorch=new Decals(scene,TX.scorch,24,3.4,{color:0x888888});this.lights=new LightPool(scene,4);this.shock=new Shock(scene);this.clouds=[];this.dustK=.5;}
 impact(p,n,surf){const c=surf==='metal'?[new THREE.Color(4,3,1.6),new THREE.Color(3,2,.8)]:[new THREE.Color(2.2,1.7,1.1),new THREE.Color(1.2,1,.8)];this.sparks.burst(p,surf==='metal'?10:5,surf==='metal'?7:4,c,.05,.35,{dir:n,spread:.9,grav:9.8,drag:2});
  const dust=(surf==='metal'?.35:surf==='ground'||surf==='sandbag'||surf==='hesco'?.55:.45)*this.dustK;this.smoke.burst(p,2,1.2,new THREE.Color(dust,dust*.92,dust*.82),.35,.7,{dir:n,spread:.5,drag:3,grow:.9});this.holes.add(p,n,.8+Math.random()*.5);}
 blood(p,d){this.smoke.burst(p,3,1.4,new THREE.Color(.35*this.dustK+.05,.02,.02),.22,.4,{dir:d,spread:.5,drag:4,grow:.7});}
 muzzle(p,d,big=1){this.sparks.burst(p,3,3*big,new THREE.Color(3,2,.9),.06,.12,{dir:d,spread:.3,drag:6});this.smoke.burst(p,1,.6,new THREE.Color(.5,.5,.5),.18*big,.5,{dir:d,spread:.3,drag:3,grow:.6});}
 explode(p,r=1){const fire=[new THREE.Color(2.6,1.05,.22),new THREE.Color(2.2,.7,.12),new THREE.Color(1.8,1.1,.4)];this.sparks.burst(p,80*r,12*r,fire,1.0*r,.5,{drag:3.2,jit:.9,grav:-2});this.sparks.burst(p,24*r,5*r,[new THREE.Color(3,1.6,.5)],1.8*r,.18,{drag:4,jit:.4});this.sparks.burst(p,60*r,22*r,[new THREE.Color(3,1.8,.6),new THREE.Color(2.4,1,.3)],.07,1.2,{grav:12,drag:.7,up:true});
  this.smoke.burst(p,30*r,4*r,[new THREE.Color(.09,.085,.08),new THREE.Color(.14,.13,.12),new THREE.Color(.06,.06,.06)],1.8*r,4,{drag:1.6,grow:1.3,jit:1.6,up:true});this.lights.flash(p,0xff8a3a,120*r,28*r,.6);
  this.scorch.add(new V(p.x,0,p.z),new V(0,1,0),r);}
 smokeCloud(p,dur=13){this.clouds.push({p:p.clone(),t:0,dur,r:0});}
 update(dt,smokeCol){for(let i=this.clouds.length-1;i>=0;i--){const c=this.clouds[i];c.t+=dt;c.r=Math.min(4.6,c.t*2.2)*(c.t>c.dur-2?Math.max(0,(c.dur-c.t)/2):1);if(c.t>c.dur){this.clouds.splice(i,1);continue;}
   if(c.t<c.dur-2.5&&Math.random()<dt*28){const a=Math.random()*6.28,rr=Math.random()*Math.min(3.6,c.t*2);const v=.75+Math.random()*.35;this.smoke.emit(c.p.x+Math.cos(a)*rr,.4+Math.random()*1.6,c.p.z+Math.sin(a)*rr,Math.cos(a)*.6,.2+Math.random()*.3,Math.sin(a)*.6,smokeCol.r*v,smokeCol.g*v,smokeCol.b*v,2.4+Math.random()*1.8,3.6+Math.random()*1.4,0,.5,.6);}}
  this.sparks.update(dt);this.smoke.update(dt);this.tracers.update(dt);this.lights.update(dt);this.shock.update(dt);}
 // does segment a->b pass through an active smoke cloud?
 smokeBlocks(a,b){for(const c of this.clouds){if(c.r<1.2)continue;const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l2=dx*dx+dy*dy+dz*dz;let t=((c.p.x-a.x)*dx+(1.4-a.y)*dy+(c.p.z-a.z)*dz)/l2;t=Math.max(0,Math.min(1,t));const x=a.x+dx*t-c.p.x,y=a.y+dy*t-1.4,z=a.z+dz*t-c.p.z;if(x*x+y*y*1.6+z*z<c.r*c.r)return true;}return false;}
 clear(){this.sparks.clear();this.smoke.clear();this.tracers.clear();this.holes.clear();this.scorch.clear();this.lights.clear();this.clouds.length=0;}}
