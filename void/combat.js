// VOIDWING — weapons + effects: laser bolts, lock-on missiles/torpedoes, countermeasures, particles, engine ribbons, explosions with debris.
import * as THREE from '../vendor/three.module.min.js';
import {V,C,rnd,rs} from './util.js';
import {makeMissileMesh} from './ships.js';
const _v=new V(),_w=new V(),_q=new THREE.Quaternion();

/* ================= particles: additive (fire, sparks, plasma) + alpha (smoke, dust) ================= */
export class Particles{constructor(scene,n,additive){this.n=n;this.add=additive;this.i=0;
  const A=k=>new Float32Array(n*k);Object.assign(this,{p:A(3),v:A(3),c:A(3),oc:A(3),s:A(1),s0:A(1),s1:A(1),al:A(1),a0:A(1),life:A(1),max:A(1),drag:A(1),seed:A(1)});
  const geo=new THREE.BufferGeometry(),D=THREE.DynamicDrawUsage;geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(D));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(D));
  geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(D));geo.setAttribute('alpha',new THREE.BufferAttribute(this.al,1).setUsage(D));geo.setAttribute('seed',new THREE.BufferAttribute(this.seed,1));this.geo=geo;
  this.U={uScale:{value:500},uLight:{value:new C(1,1,1)}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,vertexColors:true,
   vertexShader:`attribute float size,alpha,seed;uniform float uScale;varying vec3 vC;varying float vA,vS;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vA=alpha;vS=seed;
    float ps=size*uScale/max(.3,-mv.z);gl_PointSize=min(ps,700.);vA*=smoothstep(.5,3.,ps)*smoothstep(.5,3.,-mv.z);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`uniform vec3 uLight;varying vec3 vC;varying float vA,vS;
    float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    void main(){vec2 pc=gl_PointCoord-.5;float d=length(pc);float n=n2(gl_PointCoord*4.+vS*17.);float a=smoothstep(.5,.1,d+(n-.5)*.3)*vA;if(a<.004)discard;
     ${additive?'gl_FragColor=vec4(vC*a,1.);':'vec3 c=vC*uLight*(.75+.5*(.5-gl_PointCoord.y)+(n-.5)*.3);gl_FragColor=vec4(c,a);'}}`}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?9:7;scene.add(this.pts);}
 emit(x,y,z,vx,vy,vz,r,g,b,s0,s1,life,o={}){const i=this.i;this.i=(i+1)%this.n;const p=this.p,v=this.v;p[i*3]=x;p[i*3+1]=y;p[i*3+2]=z;v[i*3]=vx;v[i*3+1]=vy;v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;
  this.s0[i]=s0;this.s1[i]=s1;this.a0[i]=o.a??1;this.life[i]=this.max[i]=life;this.drag[i]=o.drag??1;this.seed[i]=Math.random();}
 burst(pos,n,speed,col,s0,s1,life,o={}){for(let k=0;k<n;k++){let dx=rs(),dy=rs(),dz=rs();const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){dx=dx*(o.spread??.5)+o.dir.x;dy=dy*(o.spread??.5)+o.dir.y;dz=dz*(o.spread??.5)+o.dir.z;}
  const s=speed*(.3+rnd(.7)),c=Array.isArray(col)?col[Math.random()*col.length|0]:col,base=o.vel;const r=o.r||0;
  this.emit(pos.x+dx*r*rnd(),pos.y+dy*r*rnd(),pos.z+dz*r*rnd(),dx*s+(base?base.x:0),dy*s+(base?base.y:0),dz*s+(base?base.z:0),c.r,c.g,c.b,s0*(.6+rnd(.8)),s1*(.6+rnd(.8)),life*(.55+rnd(.7)),o);}}
 update(dt){const{p,v,c,oc,s,s0,s1,al,a0,life,max,drag}=this,add=this.add;for(let i=0;i<this.n;i++){if(life[i]<=0){if(al[i]!==0){al[i]=0;s[i]=0;}continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),t=1-k,dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]*=dr;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(add){const f=k*k;c[i*3]=oc[i*3]*f;c[i*3+1]=oc[i*3+1]*f;c[i*3+2]=oc[i*3+2]*f;al[i]=a0[i];}else{c[i*3]=oc[i*3];c[i*3+1]=oc[i*3+1];c[i*3+2]=oc[i*3+2];al[i]=a0[i]*Math.min(1,t*8)*k;}
   s[i]=s0[i]+(s1[i]-s0[i])*(1-(1-t)*(1-t));}
  const a=this.geo.attributes;a.position.needsUpdate=a.color.needsUpdate=a.size.needsUpdate=a.alpha.needsUpdate=true;}
 clear(){this.life.fill(0);}}

/* ================= ribbons (engine trails, missile trails) ================= */
const RIB_MAT={};
export class Ribbon{constructor(scene,n,width,col,alpha=.5,additive=true){this.n=n;this.w=width;this.col=col;this.alpha=alpha;this.pts=[];this.pos=new Float32Array(n*6);this.c=new Float32Array(n*8);
  const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  const key=additive?'a':'n';this.mesh=new THREE.Mesh(g,RIB_MAT[key]||(RIB_MAT[key]=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute vec4 color;varying vec4 vC;varying float vD;void main(){vC=color;vD=length(position-cameraPosition);gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec4 vC;varying float vD;void main(){float a=vC.a*smoothstep(6.,40.,vD);${additive?'gl_FragColor=vec4(vC.rgb*a,1.);':'gl_FragColor=vec4(vC.rgb,a);'}}`})));
  this.mesh.frustumCulled=false;this.mesh.renderOrder=8;scene.add(this.mesh);this.str=0;}
 push(p,on,dt,minStep=2){this.str+=((on?1:0)-this.str)*Math.min(1,dt*(on?6:2.5));const last=this.pts[0];if(!last||last.p.distanceToSquared(p)>minStep*minStep){this.pts.unshift({p:p.clone(),s:this.str,t:0});if(this.pts.length>this.n)this.pts.pop();}else{last.p.copy(p);last.s=this.str;}
  for(const q of this.pts)q.t+=dt;}
 clear(){this.pts.length=0;this.str=0;}
 update(cam,life=1.5){const P=this.pts,n=P.length,side=new V(),tan=new V(),tmp=new V();this.mesh.visible=n>1&&P.some(q=>q.s>.02);if(!this.mesh.visible)return;
  for(let i=0;i<this.n;i++){const k=Math.min(i,n-1),q=P[k];tan.subVectors(P[Math.max(0,k-1)].p,P[Math.min(n-1,k+1)].p);tmp.subVectors(cam.position,q.p);side.crossVectors(tan,tmp);const sl=side.length();if(sl>1e-6)side.divideScalar(sl);
   const age=Math.min(1,q.t/life),w=this.w*(1-age*.6);for(let j=0;j<2;j++){const o=i*6+j*3,sg=j?-1:1;this.pos[o]=q.p.x+side.x*w*sg;this.pos[o+1]=q.p.y+side.y*w*sg;this.pos[o+2]=q.p.z+side.z*w*sg;
    const a=i<n?this.alpha*q.s*(1-age)*(1-age)*Math.min(1,i/2):0;const c=i*8+j*4;this.c[c]=this.col.r;this.c[c+1]=this.col.g;this.c[c+2]=this.col.b;this.c[c+3]=a;}}
  const a=this.mesh.geometry.attributes;a.position.needsUpdate=a.color.needsUpdate=true;}
 dispose(scene){scene.remove(this.mesh);this.mesh.geometry.dispose();}}

/* ================= laser bolts: instanced camera-facing streaks ================= */
class Streaks{constructor(scene,n){this.n=n;const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,-1,0,1,-1,0,1,1,0,0,1,0],3));g.setIndex([0,1,2,0,2,3]);
  const IA=()=>new THREE.InstancedBufferAttribute(new Float32Array(n*4),4).setUsage(THREE.DynamicDrawUsage);this.a=IA();this.b=IA();this.c=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iA',this.a);g.setAttribute('iB',this.b);g.setAttribute('iC',this.c);g.instanceCount=0;this.g=g;
  this.mesh=new THREE.Mesh(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:`attribute vec4 iA,iB;attribute vec3 iC;varying vec3 vC;varying float vY,vX;void main(){vec3 p=mix(iA.xyz,iB.xyz,position.x);vec3 d=normalize(iB.xyz-iA.xyz);vec3 e=normalize(p-cameraPosition);vec3 s=normalize(cross(d,e));float dist=length(p-cameraPosition);
    float w=max(iA.w,dist*.0016*iB.w);vC=iC*(1.+1.2/(1.+dist*.004));vY=position.y;vX=position.x;gl_Position=projectionMatrix*viewMatrix*vec4(p+s*w*position.y,1.);}`,
   fragmentShader:'varying vec3 vC;varying float vY,vX;void main(){float a=1.-abs(vY);float core=smoothstep(.55,1.,a);float e=smoothstep(0.,.15,vX)*smoothstep(1.,.85,vX);gl_FragColor=vec4((vC*a*a+vec3(core*1.6))*e,1.);}'}));this.mesh.frustumCulled=false;this.mesh.renderOrder=9;scene.add(this.mesh);this.k=0;}
 begin(){this.k=0;}
 put(ax,ay,az,bx,by,bz,w,r,g,b,wf=1){if(this.k>=this.n)return;const i=this.k++,A=this.a.array,B=this.b.array,Cc=this.c.array;A[i*4]=ax;A[i*4+1]=ay;A[i*4+2]=az;A[i*4+3]=w;B[i*4]=bx;B[i*4+1]=by;B[i*4+2]=bz;B[i*4+3]=wf;Cc[i*3]=r;Cc[i*3+1]=g;Cc[i*3+2]=b;}
 end(){this.g.instanceCount=this.k;this.a.needsUpdate=this.b.needsUpdate=this.c.needsUpdate=true;}}

/* ================= shock shells + light flashes ================= */
class Shocks{constructor(scene,n=10){this.list=[];const geo=new THREE.SphereGeometry(1,24,12);for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new C()},uA:{value:0}},
  vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.5);gl_FragColor=vec4(uC*f*uA,1.);}'}));m.visible=false;m.frustumCulled=false;m.renderOrder=10;scene.add(m);this.list.push({m,t:0,d:1,r:1});}
  const rg=new THREE.RingGeometry(.9,1,48);this.rings=[];for(let i=0;i<4;i++){const m=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({color:new C(2,1.4,.9),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));m.visible=false;m.renderOrder=10;scene.add(m);this.rings.push({m,t:0,d:1,r:1});}}
 fire(p,col,r,d){const s=this.list.find(s=>!s.m.visible)||this.list[0];s.m.position.copy(p);s.m.material.uniforms.uC.value.copy(col);s.t=0;s.d=d;s.r=r;s.m.visible=true;}
 ring(p,col,r,d){const s=this.rings.find(s=>!s.m.visible)||this.rings[0];s.m.position.copy(p);s.m.quaternion.setFromEuler(new THREE.Euler(rnd(6.28),rnd(6.28),0));s.m.material.color.copy(col);s.t=0;s.d=d;s.r=r;s.m.visible=true;}
 update(dt){for(const s of this.list){if(!s.m.visible)continue;s.t+=dt;const k=s.t/s.d;if(k>=1){s.m.visible=false;continue;}s.m.scale.setScalar(1+s.r*(1-Math.pow(1-k,3)));s.m.material.uniforms.uA.value=(1-k)*(1-k)*1.4;}
  for(const s of this.rings){if(!s.m.visible)continue;s.t+=dt;const k=s.t/s.d;if(k>=1){s.m.visible=false;continue;}s.m.scale.setScalar(1+s.r*(1-Math.pow(1-k,2)));s.m.material.opacity=(1-k);}}}

/* ================= FX facade ================= */
const FIRE=[new C(2.2,1,.28),new C(1.8,.6,.14),new C(2.4,1.5,.6)],SPARK=[new C(3,2.2,1),new C(2.6,1.4,.4)],SMOKE=[new C(.12,.11,.11),new C(.2,.19,.18),new C(.28,.26,.25)];
export class FX{constructor(scene,q=2){this.scene=scene;this.add=new Particles(scene,q>0?8000:4000,true);this.alpha=new Particles(scene,q>0?6000:3000,false);this.bolts=new Streaks(scene,1800);this.shocks=new Shocks(scene);
  this.lights=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xffaa66,0,600,1.6);scene.add(l);return l;});this.li=0;this.debris=[];this.ribbons=[];this.fires=[];
  this.chunkGeo=[new THREE.BoxGeometry(1.4,.25,.9),new THREE.BoxGeometry(.6,.6,1.8),new THREE.TetrahedronGeometry(.9),new THREE.BoxGeometry(2.2,.2,1.2)];this.chunkMat=new THREE.MeshStandardMaterial({color:0x3a3a3e,roughness:.6,metalness:.6,emissive:0x331100});}
 flash(p,int,col=0xffaa66,dist=600){const l=this.lights[this.li=(this.li+1)%this.lights.length];l.position.copy(p);l.color.set(col);l.intensity=int;l.distance=dist;}
 explode(p,size=1,o={}){const s=size,vel=o.vel?_v.copy(o.vel).multiplyScalar(.4):null;
  this.add.burst(p,Math.round(36*Math.min(3,s)),22*s,FIRE,3*s,9*s,.85,{drag:2.2,vel,r:s});
  this.add.burst(p,Math.round(40*Math.min(2,s)),110*Math.sqrt(s),SPARK,.8,.2,1.4,{drag:.4,vel});
  if(o.col)this.add.burst(p,30,40*s,[o.col],3*s,8*s,.5,{drag:2,vel});
  this.alpha.burst(p,Math.round(22*Math.min(3,s)),10*s,SMOKE,6*s,22*s,3.5,{drag:1.2,r:2*s,a:.8,vel});
  this.shocks.fire(p,new C(1,.6,.3),16*s,.45);this.shocks.ring(p,new C(.7,.4,.18),30*s,.6);this.flash(p,9000*s*s,0xffaa66,350*s);if(o.debris!==false)this.spawnDebris(p,o.vel,Math.round(6+5*s),o.mat,s);}
 capBlast(p,size){this.explode(p,size,{debris:true});this.alpha.burst(p,40,20*size,SMOKE,20*size,60*size,6,{drag:.6,r:8*size,a:.7});this.add.burst(p,90,60*size,FIRE,10*size,30*size,1.6,{drag:1.2,r:6*size});}
 hitSpark(p,vel,col){for(let i=0;i<6;i++)this.add.emit(p.x,p.y,p.z,rs(40)+(vel?vel.x*.3:0),rs(40)+(vel?vel.y*.3:0),rs(40)+(vel?vel.z*.3:0),col?col.r:3,col?col.g:2.2,col?col.b:1,.8,.2,.3,{drag:1});}
 shieldHit(p,col){for(let i=0;i<8;i++)this.add.emit(p.x,p.y,p.z,rs(25),rs(25),rs(25),col.r*.6,col.g*.6,col.b*.6,1.4,.3,.35,{drag:2});this.add.emit(p.x,p.y,p.z,0,0,0,col.r*.5,col.g*.5,col.b*.5,1,6,.25,{drag:0});}
 rockHit(p){this.alpha.emit(p.x,p.y,p.z,rs(4),rs(4),rs(4),.4,.36,.32,1.5,7,1.4,{drag:1.5,a:.7});this.add.emit(p.x,p.y,p.z,rs(20),rs(20),rs(20),2.6,1.6,.8,.7,.1,.25);}
 muzzle(p,col){this.add.emit(p.x,p.y,p.z,0,0,0,col[0]*.9,col[1]*.9,col[2]*.9,1.4,.4,.06,{drag:0});}
 smokePuff(p,vel,dark,size=1){const c=dark>.5?.08:.25;this.alpha.emit(p.x+rs(.4),p.y+rs(.4),p.z+rs(.4),vel.x*.2+rs(2),vel.y*.2+rs(2),vel.z*.2+rs(2),c,c*.97,c*.95,1.2*size,(5+dark*5)*size,1.6+dark*1.6,{drag:1.6,a:.7});}
 firePuff(p,vel,size=1){this.add.emit(p.x+rs(.4),p.y+rs(.4),p.z+rs(.4),vel.x*.3+rs(3),vel.y*.3+rs(3),vel.z*.3+rs(3),3,1.4+rnd(.6),.3,2.2*size,.6*size,.35,{drag:2});}
 chaff(p,vel){this.add.burst(p,50,55,[new C(1.4,1.4,1.5),new C(1.1,1.3,1.7),new C(1.6,1.2,.7)],.55,.15,1.4,{drag:.9,vel:_v.copy(vel).multiplyScalar(.6)});this.shocks.ring(p,new C(1.6,1.8,2.4),25,.45);this.flash(p,8000,0xcfe3ff,200);}
 warpIn(p,dir,col){for(let i=0;i<40;i++){const k=rnd(60);this.add.emit(p.x-dir.x*k,p.y-dir.y*k,p.z-dir.z*k,-dir.x*rnd(200),-dir.y*rnd(200),-dir.z*rnd(200),col.r*.5,col.g*.5,col.b*.5,2,.3,.6,{drag:2});}this.flash(p,20000,0xbfe0ff,300);}
 spawnDebris(p,vel,n,mat,s=1){for(let i=0;i<n;i++){const m=new THREE.Mesh(this.chunkGeo[i%4],mat||this.chunkMat);m.position.copy(p);m.scale.setScalar((.5+rnd(1.3))*Math.min(4,s));this.scene.add(m);
  const dir=new V(rs(),rs(),rs()).normalize();this.debris.push({m,v:dir.multiplyScalar(20+rnd(50)*s).add(vel?_w.copy(vel).multiplyScalar(.5):new V()),w:new V(rs(6),rs(6),rs(6)),t:0,life:3+rnd(4),smoke:Math.random()<.7,fire:Math.random()<.5});}}
 burning(p,t,size,owner){this.fires.push({p,t,size,acc:0,owner});}
 update(dt,cam){this.add.update(dt);this.alpha.update(dt);this.shocks.update(dt);for(const l of this.lights)l.intensity*=Math.exp(-dt*6);
  for(let i=this.debris.length-1;i>=0;i--){const d=this.debris[i];d.t+=dt;d.v.multiplyScalar(Math.exp(-dt*.15));d.m.position.addScaledVector(d.v,dt);_q.setFromEuler(new THREE.Euler(d.w.x*dt,d.w.y*dt,d.w.z*dt));d.m.quaternion.multiply(_q);
   if(d.smoke&&Math.random()<.6)this.smokePuff(d.m.position,d.v,.7,.8);if(d.fire&&d.t<2.5&&Math.random()<.7)this.firePuff(d.m.position,d.v,.8);
   if(d.t>d.life){if(d.t>d.life+.01&&Math.random()<.4)this.add.burst(d.m.position,8,10,FIRE,1,3,.4,{drag:2});this.scene.remove(d.m);this.debris.splice(i,1);}}
  for(let i=this.fires.length-1;i>=0;i--){const f=this.fires[i];f.t-=dt;f.acc+=dt;const wp=f.owner?_w.copy(f.p).applyQuaternion(f.owner.quaternion).add(f.owner.position):f.p;
   while(f.acc>.08){f.acc-=.08;this.alpha.emit(wp.x+rs(2*f.size),wp.y+rs(2*f.size),wp.z+rs(2*f.size),rs(3),rs(3)+2,rs(3),.1,.095,.09,4*f.size,18*f.size,4,{drag:.5,a:.6});if(Math.random()<.7)this.add.emit(wp.x+rs(2*f.size),wp.y+rs(2*f.size),wp.z+rs(2*f.size),rs(4),rs(4),rs(4),3,1.3,.3,4*f.size,1.5,.5,{drag:1});}if(f.t<=0)this.fires.splice(i,1);}
  for(let i=this.ribbons.length-1;i>=0;i--){const r=this.ribbons[i];r.update(cam,r.life||1.5);if(r.orphan){r.orphan-=dt;r.str*=Math.exp(-dt*.5);for(const q of r.pts)q.t+=dt;if(r.orphan<=0){r.dispose(this.scene);this.ribbons.splice(i,1);}}}}
 ribbon(n,w,col,a,life,additive=true){const r=new Ribbon(this.scene,n,w,col,a,additive);r.life=life;this.ribbons.push(r);return r;}
 clear(){this.add.clear();this.alpha.clear();for(const d of this.debris)this.scene.remove(d.m);this.debris=[];this.fires=[];for(const r of this.ribbons)r.dispose(this.scene);this.ribbons=[];}}

/* ================= laser bolts ================= */
// world = {ships, caps, rocks}; onHit(kind, target, dmg, owner, point, extra)
export class Bolts{constructor(n=2400){this.n=n;const A=()=>new Float32Array(n);Object.assign(this,{px:A(),py:A(),pz:A(),vx:A(),vy:A(),vz:A(),life:A(),dmg:A(),cr:A(),cg:A(),cb:A(),w:A(),len:A()});this.own=new Array(n).fill(null);this.team=new Int8Array(n);this.i=0;}
 fire(owner,team,p,v,dmg,col,life=1.5,w=.25,len=.022){const i=this.i;this.i=(i+1)%this.n;this.px[i]=p.x;this.py[i]=p.y;this.pz[i]=p.z;this.vx[i]=v.x;this.vy[i]=v.y;this.vz[i]=v.z;this.life[i]=life;this.dmg[i]=dmg;this.own[i]=owner;this.team[i]=team;this.cr[i]=col[0];this.cg[i]=col[1];this.cb[i]=col[2];this.w[i]=w;this.len[i]=len;}
 clear(){this.life.fill(0);}
 update(dt,W,fx,onHit){const st=fx.bolts;st.begin();const s0=new V(),s1=new V();
  for(let i=0;i<this.n;i++){if(this.life[i]<=0)continue;this.life[i]-=dt;const x0=this.px[i],y0=this.py[i],z0=this.pz[i];const x1=x0+this.vx[i]*dt,y1=y0+this.vy[i]*dt,z1=z0+this.vz[i]*dt;
   this.px[i]=x1;this.py[i]=y1;this.pz[i]=z1;const own=this.own[i],tm=this.team[i];let hit=false;const sx=x1-x0,sy=y1-y0,sz=z1-z0,sl=sx*sx+sy*sy+sz*sz||1;
   // fighters
   for(const sh of W.ships){if(!sh.alive||sh===own||sh.team===tm)continue;const r=sh.c.rad+(own&&own.human?1.2:.4);const dx=sh.p.x-x0,dy=sh.p.y-y0,dz=sh.p.z-z0;let t=(dx*sx+dy*sy+dz*sz)/sl;t=t<0?0:t>1?1:t;const ex=x0+sx*t-sh.p.x,ey=y0+sy*t-sh.p.y,ez=z0+sz*t-sh.p.z;
    if(ex*ex+ey*ey+ez*ez<r*r){onHit('ship',sh,this.dmg[i],own,s1.set(x0+sx*t,y0+sy*t,z0+sz*t),_w.set(this.vx[i],this.vy[i],this.vz[i]));hit=true;break;}}
   // capital ships: shield bubble, then subsystems, then hull
   if(!hit)for(const cp of W.caps){if(cp.dead||cp.team===tm)continue;const h=cp.segHit(x0,y0,z0,x1,y1,z1);if(h){onHit('cap',cp,this.dmg[i],own,h.p,h);hit=true;break;}}
   if(!hit&&W.rocks){const h=W.rocks.seg(x0,y0,z0,x1,y1,z1);if(h){fx.rockHit(s1.set(x0+sx*h.t,y0+sy*h.t,z0+sz*h.t));hit=true;}}
   if(hit){this.life[i]=0;continue;}
   const k=this.len[i];st.put(x1-this.vx[i]*k,y1-this.vy[i]*k,z1-this.vz[i]*k,x1,y1,z1,this.w[i],this.cr[i],this.cg[i],this.cb[i],this.w[i]>1?3:1);}
  st.end();}}

/* ================= missiles + torpedoes ================= */
export class Missiles{constructor(scene,fx){this.scene=scene;this.fx=fx;this.list=[];this.pool={seeker:[],lance:[],torpedo:[]};}
 launch(owner,target,spec,dir){const kind=spec.kind;let m=this.pool[kind].pop()||makeMissileMesh(kind);this.scene.add(m);const ud=owner.mesh&&owner.mesh.userData;const mp=ud&&ud.msl.length?ud.msl[(owner.mslI=(owner.mslI||0)+1)%ud.msl.length]:new V();
  const p=mp.clone().applyQuaternion(owner.q).add(owner.p);const f=(dir||owner.fwd(new V())).clone();
  const col=kind==='torpedo'?new C(1.2,.7,.4):owner.team?new C(1.2,.45,.3):new C(.4,.8,1.3);
  const mi={owner,target,kind,spec,p,v:owner.v.clone().addScaledVector(f,20),t:0,life:kind==='torpedo'?12:7,mesh:m,seek:!!target,trail:this.fx.ribbon(48,kind==='torpedo'?.55:.3,col,.45,1),armed:.3,dmg:spec.dmg};
  m.position.copy(p);this.list.push(mi);return mi;}
 // a countermeasure burst breaks every lock on this ship
 breakLocks(ship){let n=0;for(const m of this.list)if(m.target===ship&&m.seek){m.seek=false;m.decoyed=true;n++;}return n;}
 clear(){for(const m of this.list){this.scene.remove(m.mesh);this.pool[m.kind].push(m.mesh);m.trail.orphan=.01;}this.list=[];}
 update(dt,W,ev){const fx=this.fx;
  for(let i=this.list.length-1;i>=0;i--){const m=this.list[i];m.t+=dt;m.armed-=dt;const sp=m.v.length(),S=m.spec;const tg=m.target;let tp=null;
   if(m.seek&&tg){if(tg.alive===false||tg.dead){m.seek=false;}else tp=tg.wp?tg.wp(_w):tg.p;}
   let nsp=sp+(S.spd-sp)*Math.min(1,dt*2.5);const dir=m.v.clone().divideScalar(Math.max(sp,1));
   if(tp&&m.t>.12){const rel=_v.subVectors(tp,m.p),dist=rel.length();const tv=tg.v||new V();const tgo=Math.min(4,dist/Math.max(60,nsp));const aim=_v.copy(tp).addScaledVector(tv,tgo*.8).sub(m.p).normalize();
    const ang=Math.acos(Math.min(1,aim.dot(dir))),maxR=S.turn*dt*(m.t<.4?.5:1);if(ang>1e-5){const ax=new V().crossVectors(dir,aim);if(ax.lengthSq()>1e-10){ax.normalize();dir.applyQuaternion(_q.setFromAxisAngle(ax,Math.min(ang,maxR)));}}
    if(tg.shFx&&dist<tg.c.rad+3&&m.armed<=0){this.detonate(m,i,W,ev,tg);continue;}}
   m.v.copy(dir).multiplyScalar(nsp);m.p.addScaledVector(m.v,dt);m.mesh.position.copy(m.p);m.mesh.quaternion.setFromUnitVectors(_w.set(0,0,-1),dir);
   m.trail.push(m.p,true,dt,3);if(Math.random()<.5)fx.add.emit(m.p.x-dir.x*1.5,m.p.y-dir.y*1.5,m.p.z-dir.z*1.5,-dir.x*20,-dir.y*20,-dir.z*20,3,1.8,.8,m.kind==='torpedo'?2.6:1.5,.3,.08,{drag:3});
   if(m.decoyed&&Math.random()<.02)dir.applyQuaternion(_q.setFromEuler(new THREE.Euler(rs(.3),rs(.3),0)));
   // proximity vs anything hostile, rocks, capital hulls
   let hitS=null;if(m.armed<=0){for(const s of W.ships){if(!s.alive||s.team===m.owner.team)continue;if(s.p.distanceToSquared(m.p)<(s.c.rad+2.5)**2){hitS=s;break;}}}
   if(hitS){this.detonate(m,i,W,ev,hitS);continue;}
   let capH=null;if(m.armed<=0)for(const cp of W.caps){if(cp.dead||cp.team===m.owner.team)continue;const h=cp.segHit(m.p.x-m.v.x*dt,m.p.y-m.v.y*dt,m.p.z-m.v.z*dt,m.p.x,m.p.y,m.p.z);if(h){capH={cp,h};break;}}
   if(capH){this.detonate(m,i,W,ev,null,capH);continue;}
   if(W.rocks&&m.armed<=0){const h=W.rocks.seg(m.p.x-m.v.x*dt,m.p.y-m.v.y*dt,m.p.z-m.v.z*dt,m.p.x,m.p.y,m.p.z);if(h){this.detonate(m,i,W,ev,null,null);continue;}}
   if(m.t>m.life){this.detonate(m,i,W,ev,null,null);continue;}}}
 detonate(m,i,W,ev,ship,cap){this.scene.remove(m.mesh);this.pool[m.kind].push(m.mesh);m.trail.orphan=2;this.list.splice(i,1);this.fx.explode(m.p,m.kind==='torpedo'?2:1,{debris:false});ev(m,ship,cap);}}
