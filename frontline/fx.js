// FRONTLINE OPS — effects: additive sparks/fire, soft lit smoke, tracers, impact decals, flash lights,
// surface-aware bullet impacts, explosions with fireball + debris + shock ring, smoke grenades, contrails.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,C=(r,g,b)=>new THREE.Color(r,g,b);

export class Particles{constructor(scene,n=3000,additive=true,tex=null){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.gr=new Float32Array(n);
  this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.rot=new Float32Array(n);this.i=0;this.alive=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('rot',new THREE.BufferAttribute(this.rot,1));
  this.U={uScale:{value:500},uTex:{value:tex},uFog:{value:new THREE.Color()},uFogD:{value:.01},uLight:{value:new THREE.Color(1,1,1)}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute float rot;attribute vec4 color;uniform float uScale;varying vec4 vC;varying float vR,vD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vR=rot;vD=-mv.z;gl_PointSize=min(900.,size*uScale/max(.1,-mv.z));gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;varying float vR,vD;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}'
    :'uniform sampler2D uTex;uniform vec3 uFog,uLight;uniform float uFogD;varying vec4 vC;varying float vR,vD;void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);vec2 q=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+.5;vec4 t=texture2D(uTex,q);float sh=.75+.35*(.5-p.y);float f=1.-exp(-uFogD*uFogD*vD*vD);gl_FragColor=vec4(mix(vC.rgb*uLight*sh,uFog,f),t.a*vC.a*1.6);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?3:2;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.gr[i]=grow;this.rot[i]=Math.random()*6.28;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const s=o.spread??.6;dx=dx*s+o.dir.x;dy=dy*s+o.dir.y;dz=dz*s+o.dir.z;}if(o.up)dy=Math.abs(dy)+(o.lift||0);const sp=speed*(.3+Math.random()*.7);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x+(o.jit?(Math.random()-.5)*o.jit:0),p.y+(o.jit?(Math.random()-.5)*o.jit*.5:0),p.z+(o.jit?(Math.random()-.5)*o.jit:0),dx*sp,dy*sp,dz*sp,c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5,o.grow??0);}}
 update(dt){const{p,v,c,oc,s,os,life,max,g,drag,gr}=this;let alive=0;const add=this.add;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}alive++;life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;if(p[i*3+1]<.03&&g[i]>0){p[i*3+1]=.03;v[i*3+1]*=-.35;v[i*3]*=.6;v[i*3+2]*=.6;}
   if(add){const f=k*k;c[i*4]=oc[i*3]*f;c[i*4+1]=oc[i*3+1]*f;c[i*4+2]=oc[i*3+2]*f;c[i*4+3]=1;s[i]=os[i]*(.4+.6*k);}else{c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=Math.min(1,(1-k)*7)*k;os[i]+=gr[i]*dt;s[i]=os[i];this.rot[i]+=dt*.25;}}
  this.alive=alive;this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;this.geo.attributes.rot.needsUpdate=!add;}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}}

export class Tracers{constructor(scene,n=90){this.n=n;this.list=[];const g=new THREE.BoxGeometry(.022,.022,1);g.translate(0,0,-.5);
  this.mesh=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),n);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.z=new V(0,0,-1);this.col=new THREE.Color();
  this.mesh.setColorAt(0,this.col.setRGB(1,1,1));}
 fire(a,b,speed=420,len=3.2,w=1,col){if(this.list.length>=this.n)this.list.shift();const d=new V().subVectors(b,a),dist=d.length();if(dist<1)return;d.divideScalar(dist);this.list.push({a:a.clone(),d,dist,t:0,speed,len:Math.min(len,dist),w,col:col||[6,4.2,2]});}
 update(dt){let k=0;for(let i=this.list.length-1;i>=0;i--){const t=this.list[i];t.t+=dt*t.speed;if(t.t-t.len>t.dist){this.list.splice(i,1);continue;}}
  for(const t of this.list){const head=Math.min(t.dist,t.t),tail=Math.max(0,t.t-t.len),L=head-tail;if(L<=.01)continue;this.q.setFromUnitVectors(this.z,t.d);this.m.compose(new V().copy(t.a).addScaledVector(t.d,tail),this.q,new V(t.w,t.w,L));this.mesh.setMatrixAt(k,this.m);this.mesh.setColorAt(k,this.col.setRGB(t.col[0],t.col[1],t.col[2]));k++;}
  this.mesh.count=k;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;}
 clear(){this.list.length=0;this.mesh.count=0;}}

export class Decals{constructor(scene,tex,n=240,size=.13,o={}){this.n=n;this.i=0;const m=new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,roughness:.9,color:o.color||0xffffff});
  this.mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(size,size),m,n);this.mesh.count=0;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.q2=new THREE.Quaternion();this.Z=new V(0,0,1);}
 add(p,n,s=1){const i=this.i;this.i=(i+1)%this.n;this.q.setFromUnitVectors(this.Z,n);this.q2.setFromAxisAngle(this.Z,Math.random()*6.28);this.q.multiply(this.q2);this.m.compose(new V().copy(p).addScaledVector(n,.012),this.q,new V(s,s,s));this.mesh.setMatrixAt(i,this.m);this.mesh.count=Math.max(this.mesh.count,i+1);this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.mesh.count=0;this.i=0;}}

export class LightPool{constructor(scene,n=4){this.list=[];for(let i=0;i<n;i++){const l=new THREE.PointLight(0xffaa55,0,12,1.6);scene.add(l);this.list.push({l,t:0,d:1,I:0});}}
 flash(p,col,I,dist,dur){const s=this.list.reduce((a,b)=>a.l.intensity<=b.l.intensity?a:b);s.l.position.copy(p);s.l.color.set(col);s.l.distance=dist;s.I=I;s.t=0;s.d=dur;s.l.intensity=I;}
 update(dt){for(const s of this.list){if(s.l.intensity<=0)continue;s.t+=dt;s.l.intensity=s.t>=s.d?0:s.I*Math.pow(1-s.t/s.d,2);}}
 clear(){for(const s of this.list)s.l.intensity=0;}}

// expanding fresnel shells + ground shock rings for explosions
export class Shock{constructor(scene,n=5){this.list=[];const geo=new THREE.SphereGeometry(1,24,12),rg=new THREE.RingGeometry(.8,1,48);rg.rotateX(-Math.PI/2);
  for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uA:{value:0}},
   vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.5);gl_FragColor=vec4(vec3(1.8,1.1,.6)*f*uA,1.);}'}));m.visible=false;scene.add(m);
   const r=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({color:0xfff0d8,transparent:true,opacity:0,depthWrite:false}));r.visible=false;scene.add(r);this.list.push({m,r,t:0,rad:1});}}
 fire(p,r){const s=this.list.find(s=>!s.m.visible)||this.list[0];s.m.position.copy(p);s.r.position.set(p.x,.06,p.z);s.t=0;s.rad=r;s.m.visible=s.r.visible=true;}
 update(dt){for(const s of this.list){if(!s.m.visible)continue;s.t+=dt;const k=s.t/.5;if(k>=1){s.m.visible=s.r.visible=false;continue;}s.m.scale.setScalar(.5+s.rad*(1-Math.pow(1-k,3)));s.m.material.uniforms.uA.value=(1-k)*(1-k)*.24;
  s.r.scale.setScalar(.5+s.rad*2.2*(1-Math.pow(1-k,2)));s.r.material.opacity=(1-k)*.35;}}}

// tumbling debris chunks
export class Debris{constructor(scene,n=60){this.n=n;this.list=[];const g=new THREE.BoxGeometry(.12,.08,.1);this.mesh=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({color:0x5a5450,roughness:.9}),n);this.mesh.count=0;this.mesh.castShadow=true;this.mesh.frustumCulled=false;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.e=new THREE.Euler();this.c=new THREE.Color();this.mesh.setColorAt(0,this.c.set(0xffffff));}
 burst(p,n,speed,col){for(let i=0;i<n;i++){if(this.list.length>=this.n)this.list.shift();const a=Math.random()*6.28,u=.4+Math.random()*.8,s=speed*(.4+Math.random()*.6);this.list.push({p:p.clone(),v:new V(Math.cos(a)*s*.7,u*s,Math.sin(a)*s*.7),r:new V(Math.random()*6,Math.random()*6,0),w:new V((Math.random()-.5)*20,(Math.random()-.5)*20,0),t:0,s:.5+Math.random()*1.4,col:new THREE.Color(col).multiplyScalar(.7+Math.random()*.4)});}}
 update(dt){let k=0;for(let i=this.list.length-1;i>=0;i--){const d=this.list[i];d.t+=dt;if(d.t>5){this.list.splice(i,1);continue;}d.v.y-=14*dt;d.p.addScaledVector(d.v,dt);if(d.p.y<.04){d.p.y=.04;d.v.y*=-.3;d.v.x*=.5;d.v.z*=.5;d.w.multiplyScalar(.5);}d.r.addScaledVector(d.w,dt);}
  for(const d of this.list){const s=d.s*(d.t>4?5-d.t:1);this.m.compose(d.p,this.q.setFromEuler(this.e.set(d.r.x,d.r.y,0)),new V(s,s,s));this.mesh.setMatrixAt(k,this.m);this.mesh.setColorAt(k,d.col);k++;}this.mesh.count=k;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;}
 clear(){this.list.length=0;this.mesh.count=0;}}

const SURF={metal:{spark:12,dust:[.42,.42,.44],deb:0},ground:{spark:2,dust:[.62,.55,.44],deb:0},sand:{spark:0,dust:[.78,.68,.52],deb:0},snow:{spark:0,dust:[1.05,1.08,1.12],deb:0},wood:{spark:1,dust:[.55,.42,.3],deb:0x8a6a44},
 concrete:{spark:4,dust:[.66,.64,.6],deb:0x8a8680},plaster:{spark:2,dust:[.8,.76,.68],deb:0xd8d0c0},stone:{spark:4,dust:[.74,.66,.54],deb:0xc8b08a},brick:{spark:3,dust:[.7,.48,.4],deb:0x9a5a44},sandbag:{spark:0,dust:[.68,.6,.46],deb:0},hesco:{spark:0,dust:[.68,.6,.46],deb:0},glass:{spark:6,dust:[.8,.85,.9],deb:0}};
export class FX{constructor(scene,TX){this.sparks=new Particles(scene,3500,true);this.smoke=new Particles(scene,1600,false,TX.puff);this.tracers=new Tracers(scene);this.holes=new Decals(scene,TX.hole,280,.12);this.scorch=new Decals(scene,TX.scorch,24,3.6,{color:0x888888});
  this.lights=new LightPool(scene,4);this.shock=new Shock(scene);this.debris=new Debris(scene);this.clouds=[];this.dustK=1;this.ground='ground';}
 impact(p,n,surf){if(surf==='ground')surf=this.ground;const S=SURF[surf]||SURF.concrete;
  if(S.spark)this.sparks.burst(p,S.spark,surf==='metal'?7:4,[C(4,3,1.6),C(3,2,.8)],.045,.3,{dir:n,spread:.9,grav:9.8,drag:2});
  const k=this.dustK;this.smoke.burst(p,3,1.6,C(S.dust[0]*k,S.dust[1]*k,S.dust[2]*k),.32,.8,{dir:n,spread:.45,drag:3.2,grow:1.1});
  this.smoke.burst(p,1,3.2,C(S.dust[0]*k*.9,S.dust[1]*k*.9,S.dust[2]*k*.9),.12,.5,{dir:n,spread:.15,drag:5,grow:1.8});
  if(S.deb&&Math.random()<.35)this.debris.burst(p.clone().addScaledVector(n,.05),1,2.5,S.deb);if(surf!=='snow'&&surf!=='sand')this.holes.add(p,n,.8+Math.random()*.5);}
 blood(p,d){this.smoke.burst(p,2,1.8,C(.3,.02,.02),.15,.32,{dir:d,spread:.5,drag:5,grow:.9});this.sparks.burst(p,2,2.2,C(.5,.02,.02),.04,.22,{dir:d,spread:.6,grav:9.8});}
 muzzle(p,d,big=1){this.sparks.burst(p,3,3*big,C(3,2,.9),.06,.12,{dir:d,spread:.3,drag:6});this.smoke.burst(p,1,.6,C(.55,.55,.55),.18*big,.6,{dir:d,spread:.3,drag:3,grow:.7});}
 explode(p,r=1,ground=true){const fire=[C(3,1.3,.3),C(2.6,.9,.15),C(2.2,1.3,.5)];this.sparks.burst(p,90*r,11*r,fire,1.5*r,.65,{drag:3.2,jit:1.4,grav:-3,up:true,lift:.25});this.sparks.burst(p,26*r,5*r,[C(4,2.4,1)],2.8*r,.24,{drag:4,jit:.6});
  this.sparks.burst(p.clone().setY(p.y+1.2*r),30*r,6*r,fire,1.1*r,.9,{drag:2.6,jit:2,grav:-4,up:true});
  this.sparks.burst(p,50*r,24*r,[C(3,1.8,.6),C(2.4,1,.3)],.06,1.3,{grav:12,drag:.6,up:true});
  const d=this.dustK;this.smoke.burst(p,30*r,4.5*r,[C(.16*d,.15*d,.14*d),C(.24*d,.22*d,.2*d),C(.1*d,.1*d,.1*d)],2.2*r,5,{drag:1.5,grow:1.5,jit:1.8,up:true,lift:.3});this.smoke.burst(p.clone().setY(p.y+2),12*r,7*r,[C(.12*d,.11*d,.1*d)],2.6*r,6,{drag:1.2,grow:1.2,jit:1,up:true,lift:1.2});
  if(ground)this.smoke.burst(new V(p.x,.3,p.z),14*r,7*r,[C(.55*d,.5*d,.42*d)],1.4*r,2.4,{drag:2.2,grow:1.6,jit:.6,up:true});
  this.lights.flash(p,0xff8a3a,140*r,30*r,.6);this.shock.fire(p,6*r);this.debris.burst(p.clone().setY(Math.max(.3,p.y)),Math.round(8*r),9*r,0x4a4642);if(ground)this.scorch.add(new V(p.x,.01,p.z),new V(0,1,0),r);}
 trail(p,col=.85,size=.9,life=2.4){this.smoke.emit(p.x,p.y,p.z,(Math.random()-.5)*.2,(Math.random()-.5)*.2,(Math.random()-.5)*.2,col,col,col,size,life,0,.3,.9);}
 smokeCloud(p,dur=13){this.clouds.push({p:p.clone(),t:0,dur,r:0});}
 update(dt,smokeCol){for(let i=this.clouds.length-1;i>=0;i--){const c=this.clouds[i];c.t+=dt;c.r=Math.min(4.6,c.t*2.2)*(c.t>c.dur-2?Math.max(0,(c.dur-c.t)/2):1);if(c.t>c.dur){this.clouds.splice(i,1);continue;}
   if(c.t<c.dur-2.5&&Math.random()<dt*30){const a=Math.random()*6.28,rr=Math.random()*Math.min(3.6,c.t*2);const v=.8+Math.random()*.3;this.smoke.emit(c.p.x+Math.cos(a)*rr,.4+Math.random()*1.6,c.p.z+Math.sin(a)*rr,Math.cos(a)*.6,.2+Math.random()*.3,Math.sin(a)*.6,smokeCol.r*v,smokeCol.g*v,smokeCol.b*v,2.6+Math.random()*1.8,3.6+Math.random()*1.4,0,.5,.6);}}
  this.sparks.update(dt);this.smoke.update(dt);this.tracers.update(dt);this.lights.update(dt);this.shock.update(dt);this.debris.update(dt);}
 smokeBlocks(a,b){for(const c of this.clouds){if(c.r<1.2)continue;const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l2=dx*dx+dy*dy+dz*dz;let t=((c.p.x-a.x)*dx+(1.4-a.y)*dy+(c.p.z-a.z)*dz)/l2;t=Math.max(0,Math.min(1,t));const x=a.x+dx*t-c.p.x,y=a.y+dy*t-1.4,z=a.z+dz*t-c.p.z;if(x*x+y*y*1.6+z*z<c.r*c.r)return true;}return false;}
 clear(){this.sparks.clear();this.smoke.clear();this.tracers.clear();this.holes.clear();this.scorch.clear();this.lights.clear();this.debris.clear();this.clouds.length=0;}}
