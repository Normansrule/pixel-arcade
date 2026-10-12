// SKY LANCERS — weapons + effects: bullets/tracers, missiles, flares, bombs, flak, particles, ribbons, explosions, debris, parachutes.
import * as THREE from '../vendor/three.module.min.js';
import {SKYU,SKY_GLSL,hAt,DECK_Y} from './world.js';
import {makeMissileMesh,makeBombMesh,GRAV} from './planes.js';
const V=THREE.Vector3,C=THREE.Color,rnd=(a=1)=>Math.random()*a,rs=(a=1)=>(Math.random()*2-1)*a;
const _v=new V(),_w=new V(),_q=new THREE.Quaternion(),_m=new THREE.Matrix4();

/* ================= particles: additive (fire, sparks) + alpha (smoke, spray, dust) ================= */
export class Particles{constructor(scene,n,additive){this.n=n;this.add=additive;this.i=0;
  const A=k=>new Float32Array(n*k);Object.assign(this,{p:A(3),v:A(3),c:A(3),oc:A(3),s:A(1),s0:A(1),s1:A(1),al:A(1),a0:A(1),life:A(1),max:A(1),g:A(1),drag:A(1),seed:A(1)});
  const geo=new THREE.BufferGeometry(),D=THREE.DynamicDrawUsage;geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(D));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(D));
  geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(D));geo.setAttribute('alpha',new THREE.BufferAttribute(this.al,1).setUsage(D));geo.setAttribute('seed',new THREE.BufferAttribute(this.seed,1));this.geo=geo;
  this.U={uScale:{value:500},uLight:{value:new C(1,1,1)},uNoise:SKYU.uNoise};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:{...SKYU,...this.U},transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,vertexColors:true,
   vertexShader:`attribute float size,alpha,seed;uniform float uScale;varying vec3 vC;varying float vA,vS;varying vec3 vWP;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vA=alpha;vS=seed;vWP=position;
    float ps=size*uScale/max(.5,-mv.z);gl_PointSize=min(ps,900.);vA*=smoothstep(1.,4.,ps)*smoothstep(1.,6.,-mv.z);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`uniform sampler2D uNoise;uniform vec3 uLight;varying vec3 vC;varying float vA,vS;varying vec3 vWP;${SKY_GLSL}
    void main(){vec2 pc=gl_PointCoord-.5;float d=length(pc);float n=texture2D(uNoise,gl_PointCoord*.45+vec2(vS,vS*1.7)).r;float a=smoothstep(.5,.12,d+(n-.5)*.35)*vA;if(a<.004)discard;
     ${additive?'gl_FragColor=vec4(vC*a,1.);':'vec3 c=vC*uLight*(.78+.42*(.5-gl_PointCoord.y)+(n-.5)*.3);c=haze(c,vWP);gl_FragColor=vec4(c,a);'}}`}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?9:7;scene.add(this.pts);}
 emit(x,y,z,vx,vy,vz,r,g,b,s0,s1,life,o={}){const i=this.i;this.i=(i+1)%this.n;const p=this.p,v=this.v;p[i*3]=x;p[i*3+1]=y;p[i*3+2]=z;v[i*3]=vx;v[i*3+1]=vy;v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;
  this.s0[i]=s0;this.s1[i]=s1;this.a0[i]=o.a??1;this.life[i]=this.max[i]=life;this.g[i]=o.g??0;this.drag[i]=o.drag??1;this.seed[i]=Math.random();}
 burst(pos,n,speed,col,s0,s1,life,o={}){for(let k=0;k<n;k++){let dx=rs(),dy=rs(),dz=rs();const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.up)dy=Math.abs(dy)*(o.up===true?1:o.up);if(o.dir){dx=dx*(o.spread??.5)+o.dir.x;dy=dy*(o.spread??.5)+o.dir.y;dz=dz*(o.spread??.5)+o.dir.z;}
  const s=speed*(.3+rnd(.7)),c=Array.isArray(col)?col[Math.random()*col.length|0]:col,base=o.vel;const r=o.r||0;
  this.emit(pos.x+dx*r,pos.y+dy*r,pos.z+dz*r,dx*s+(base?base.x:0),dy*s+(base?base.y:0),dz*s+(base?base.z:0),c.r,c.g,c.b,s0*(.6+rnd(.8)),s1*(.6+rnd(.8)),life*(.55+rnd(.7)),o);}}
 update(dt){const{p,v,c,oc,s,s0,s1,al,a0,life,max,g,drag}=this,add=this.add;for(let i=0;i<this.n;i++){if(life[i]<=0){if(al[i]!==0){al[i]=0;s[i]=0;}continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),t=1-k,dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
   if(add){const f=k*k;c[i*3]=oc[i*3]*f;c[i*3+1]=oc[i*3+1]*f;c[i*3+2]=oc[i*3+2]*f;al[i]=a0[i];}else{c[i*3]=oc[i*3];c[i*3+1]=oc[i*3+1];c[i*3+2]=oc[i*3+2];al[i]=a0[i]*Math.min(1,t*8)*k;}
   s[i]=s0[i]+(s1[i]-s0[i])*(1-(1-t)*(1-t));}
  const a=this.geo.attributes;a.position.needsUpdate=a.color.needsUpdate=a.size.needsUpdate=a.alpha.needsUpdate=true;}
 clear(){this.life.fill(0);}}

/* ================= ribbons (contrails, wingtip vortices, missile trails) ================= */
export class Ribbon{constructor(scene,n,width,col,alpha=.5){this.n=n;this.w=width;this.col=col;this.alpha=alpha;this.pts=[];this.pos=new Float32Array(n*6);this.c=new Float32Array(n*8);
  const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.c,4).setUsage(THREE.DynamicDrawUsage));g.setIndex(idx);
  this.mesh=new THREE.Mesh(g,Ribbon.mat||(Ribbon.mat=new THREE.ShaderMaterial({uniforms:SKYU,transparent:true,depthWrite:false,side:THREE.DoubleSide,
   vertexShader:'attribute vec4 color;varying vec4 vC;varying vec3 vWP;void main(){vC=color;vWP=position;gl_Position=projectionMatrix*viewMatrix*vec4(position,1.);}',
   fragmentShader:`varying vec4 vC;varying vec3 vWP;${SKY_GLSL}void main(){vec3 l=uSunCol*.6+uZen*.25+uHor*.45;gl_FragColor=vec4(haze(vC.rgb*l,vWP),vC.a*smoothstep(12.,70.,length(vWP-cameraPosition)));}`})));this.mesh.frustumCulled=false;this.mesh.renderOrder=7;scene.add(this.mesh);this.str=0;this.dead=0;}
 push(p,on,dt,minStep=3){this.str+=((on?1:0)-this.str)*Math.min(1,dt*(on?5:2.2));const last=this.pts[0];if(!last||last.p.distanceToSquared(p)>minStep*minStep){this.pts.unshift({p:p.clone(),s:this.str,t:0});if(this.pts.length>this.n)this.pts.pop();}else{last.p.copy(p);last.s=this.str;}
  for(const q of this.pts)q.t+=dt;}
 clear(){this.pts.length=0;this.str=0;}
 update(cam,life=6){const P=this.pts,n=P.length,side=new V(),tan=new V(),tmp=new V();this.mesh.visible=n>1&&P.some(q=>q.s>.02);if(!this.mesh.visible)return;
  for(let i=0;i<this.n;i++){const k=Math.min(i,n-1),q=P[k];tan.subVectors(P[Math.max(0,k-1)].p,P[Math.min(n-1,k+1)].p);tmp.subVectors(cam.position,q.p);side.crossVectors(tan,tmp);const sl=side.length();if(sl>1e-6)side.divideScalar(sl);
   const age=Math.min(1,q.t/life),w=this.w*(1+age*1.8);for(let j=0;j<2;j++){const o=i*6+j*3,sg=j?-1:1;this.pos[o]=q.p.x+side.x*w*sg;this.pos[o+1]=q.p.y+side.y*w*sg;this.pos[o+2]=q.p.z+side.z*w*sg;
    const a=i<n?this.alpha*q.s*(1-age)*(1-age)*Math.min(1,i/2):0;const c=i*8+j*4;this.c[c]=this.col.r;this.c[c+1]=this.col.g;this.c[c+2]=this.col.b;this.c[c+3]=a;}}
  const a=this.mesh.geometry.attributes;a.position.needsUpdate=a.color.needsUpdate=true;}
 dispose(scene){scene.remove(this.mesh);this.mesh.geometry.dispose();}}

/* ================= tracers (instanced camera-facing streaks) ================= */
class Tracers{constructor(scene,n){this.n=n;const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,-1,0,1,-1,0,1,1,0,0,1,0],3));g.setIndex([0,1,2,0,2,3]);
  this.a=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3).setUsage(THREE.DynamicDrawUsage);this.b=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3).setUsage(THREE.DynamicDrawUsage);this.c=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iA',this.a);g.setAttribute('iB',this.b);g.setAttribute('iC',this.c);g.instanceCount=0;this.g=g;
  this.mesh=new THREE.Mesh(g,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:`attribute vec3 iA,iB,iC;varying vec3 vC;varying float vY,vX;void main(){vec3 p=mix(iA,iB,position.x);vec3 d=normalize(iB-iA);vec3 e=normalize(p-cameraPosition);vec3 s=normalize(cross(d,e));float dist=length(p-cameraPosition);
    float w=max(.22,dist*.0011);vC=iC*(1.+.6/(1.+dist*.002))*smoothstep(18.,70.,dist);vY=position.y;vX=position.x;gl_Position=projectionMatrix*viewMatrix*vec4(p+s*w*position.y,1.);}`,
   fragmentShader:'varying vec3 vC;varying float vY,vX;void main(){float a=(1.-abs(vY))*smoothstep(0.,.5,vX);gl_FragColor=vec4(vC*a*a,1.);}'}));this.mesh.frustumCulled=false;this.mesh.renderOrder=9;scene.add(this.mesh);this.k=0;}
 begin(){this.k=0;}
 put(ax,ay,az,bx,by,bz,r,g,b){if(this.k>=this.n)return;const i=this.k++;this.a.array[i*3]=ax;this.a.array[i*3+1]=ay;this.a.array[i*3+2]=az;this.b.array[i*3]=bx;this.b.array[i*3+1]=by;this.b.array[i*3+2]=bz;this.c.array[i*3]=r;this.c.array[i*3+1]=g;this.c.array[i*3+2]=b;}
 end(){this.g.instanceCount=this.k;this.a.needsUpdate=this.b.needsUpdate=this.c.needsUpdate=true;}}

/* ================= shock shells + light flashes ================= */
class Shocks{constructor(scene,n=8){this.list=[];const geo=new THREE.SphereGeometry(1,24,12);for(let i=0;i<n;i++){const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new C()},uA:{value:0}},
  vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.5);gl_FragColor=vec4(uC*f*uA,1.);}'}));m.visible=false;m.frustumCulled=false;scene.add(m);this.list.push({m,t:0,d:1,r:1});}}
 fire(p,col,r,d){const s=this.list.find(s=>!s.m.visible)||this.list[0];s.m.position.copy(p);s.m.material.uniforms.uC.value.copy(col);s.t=0;s.d=d;s.r=r;s.m.visible=true;}
 update(dt){for(const s of this.list){if(!s.m.visible)continue;s.t+=dt;const k=s.t/s.d;if(k>=1){s.m.visible=false;continue;}s.m.scale.setScalar(1+s.r*(1-Math.pow(1-k,3)));s.m.material.uniforms.uA.value=(1-k)*(1-k)*1.4;}}}

/* ================= FX facade ================= */
const FIRE=[new C(3,1.5,.4),new C(2.6,.9,.2),new C(3.2,2.4,1.2)],SPARK=[new C(3,2.2,1),new C(2.6,1.4,.4)];
export class FX{constructor(scene,q=2){this.scene=scene;this.add=new Particles(scene,q>0?7000:3500,true);this.alpha=new Particles(scene,q>0?9000:4500,false);this.tracers=new Tracers(scene,2400);this.shocks=new Shocks(scene);
  this.lights=[0,1,2].map(()=>{const l=new THREE.PointLight(0xffaa66,0,900,1.6);scene.add(l);return l;});this.li=0;this.debris=[];this.chutes=[];this.fires=[];this.ribbons=[];
  this.chunkGeo=[new THREE.BoxGeometry(1.4,.25,.9),new THREE.BoxGeometry(.6,.6,1.8),new THREE.TetrahedronGeometry(.9)];this.chunkMat=new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:.8,metalness:.3});}
 flash(p,int,col=0xffaa66){const l=this.lights[this.li=(this.li+1)%this.lights.length];l.position.copy(p);l.color.set(col);l.intensity=int;}
 explode(p,size=1,o={}){const s=size,vel=o.vel||null;
  this.add.burst(p,Math.round(50*Math.min(2.5,s)),26*s,FIRE,5*s,14*s,.9,{drag:2.6,g:-3,vel:vel&&_v.copy(vel).multiplyScalar(.3)});
  this.add.burst(p,30,90*Math.sqrt(s),SPARK,.9,.3,1.3,{drag:.6,g:12,vel:vel&&_v.copy(vel).multiplyScalar(.3)});
  this.alpha.burst(p,Math.round(26*Math.min(2.5,s)),12*s,[new C(.14,.13,.12),new C(.22,.2,.18),new C(.3,.27,.24)],8*s,26*s,4.5,{drag:1.4,g:-1.5,r:3*s,a:.85,vel:vel&&_v.copy(vel).multiplyScalar(.2)});
  this.shocks.fire(p,new C(1.4,.9,.5),22*s,.5);this.flash(p,9000*s*s);if(o.debris!==false)this.spawnDebris(p,vel,Math.round(5+4*s));}
 groundBlast(p,size=1){this.add.burst(p,70,30*size,FIRE,6*size,16*size,1.1,{up:true,drag:2.2,g:-6});this.alpha.burst(p,40,16*size,[new C(.5,.45,.36),new C(.36,.32,.27)],10*size,34*size,5,{up:true,drag:1.3,g:-2,r:4,a:.9});
  this.alpha.burst(p,26,10*size,[new C(.12,.11,.1)],10*size,40*size,8,{up:true,drag:1,g:-4,a:.8});this.add.burst(p,40,70,SPARK,1,.3,1.5,{up:true,drag:.5,g:14});this.shocks.fire(p,new C(1.4,.8,.4),30*size,.6);this.flash(p,16000*size);}
 splash(p,size=1){this.alpha.burst(_w.set(p.x,.5,p.z),Math.round(30*size),14*size,[new C(.95,.97,1),new C(.8,.86,.9)],3*size,12*size,2.4,{up:3,drag:1.2,g:16,a:.75});
  this.alpha.burst(_w.set(p.x,1,p.z),Math.round(10*size),20*size,[new C(.9,.93,.95)],6*size,22*size,3,{dir:new V(0,.15,0),spread:1,drag:2.5,g:1,a:.4});}
 bulletImpact(p,water){if(water){this.alpha.emit(p.x,.6,p.z,rs(2),8+rnd(8),rs(2),.95,.97,1,1.2,4,1.1,{g:14,drag:1,a:.7});}else{this.alpha.emit(p.x,p.y+.5,p.z,rs(2),3+rnd(3),rs(2),.45,.4,.32,1.2,5,1.4,{g:2,drag:1.5,a:.7});this.add.emit(p.x,p.y+.3,p.z,rs(8),rnd(10),rs(8),2.6,1.8,.8,.5,.1,.15);}}
 hitSpark(p,vel){for(let i=0;i<5;i++)this.add.emit(p.x,p.y,p.z,rs(30)+(vel?vel.x*.5:0),rs(30)+(vel?vel.y*.5:0),rs(30)+(vel?vel.z*.5:0),3,2.2,1,.6,.15,.25,{drag:1});this.alpha.emit(p.x,p.y,p.z,vel?vel.x*.4:0,vel?vel.y*.4:0,vel?vel.z*.4:0,.25,.24,.22,1,4,1,{drag:2,a:.6});}
 flak(p){this.add.burst(p,14,20,[new C(3,1.6,.5)],3,6,.35,{drag:3});this.alpha.burst(p,10,8,[new C(.08,.08,.08),new C(.14,.13,.12)],5,16,4,{drag:1.6,g:-.4,r:2,a:.9});this.flash(p,1500);}
 smokePuff(p,vel,dark,size=1){const c=dark>.5?.09:dark>.2?.3:.75;this.alpha.emit(p.x+rs(.5),p.y+rs(.5),p.z+rs(.5),vel.x*.15+rs(1.5),vel.y*.15+rs(1.5)+1,vel.z*.15+rs(1.5),c,c*.97,c*.94,1.5*size,(7+dark*6)*size,2.4+dark*2.5,{drag:1.6,g:-.8,a:.75});}
 firePuff(p,vel){this.add.emit(p.x+rs(.5),p.y+rs(.5),p.z+rs(.5),vel.x*.3+rs(3),vel.y*.3+rs(3),vel.z*.3+rs(3),3,1.4+rnd(.6),.3,2.6,.8,.35,{drag:2});}
 spawnDebris(p,vel,n){for(let i=0;i<n;i++){const m=new THREE.Mesh(this.chunkGeo[i%3],this.chunkMat);m.position.copy(p);m.scale.setScalar(.6+rnd(1.4));m.castShadow=false;this.scene.add(m);
  this.debris.push({m,v:new V(rs(60),rs(40)+15,rs(60)).add(vel?_v.copy(vel).multiplyScalar(.6):new V()),w:new V(rs(9),rs(9),rs(9)),t:0,life:5+rnd(4),smoke:Math.random()<.6,fire:Math.random()<.35});}}
 detach(obj,vel,spin){// a broken-off part (wing / tail) keeps falling and smoking
  const wp=new V(),wq=new THREE.Quaternion();obj.getWorldPosition(wp);obj.getWorldQuaternion(wq);obj.removeFromParent();obj.position.copy(wp);obj.quaternion.copy(wq);this.scene.add(obj);
  this.debris.push({m:obj,v:vel.clone().multiplyScalar(.85).add(new V(rs(10),8,rs(10))),w:spin||new V(rs(3),rs(3),rs(5)),t:0,life:14,smoke:true,fire:true,big:true});}
 chute(p,vel,team){const g=new THREE.Group();const can=new THREE.Mesh(new THREE.SphereGeometry(3.2,12,6,0,Math.PI*2,0,Math.PI/2.3),new THREE.MeshStandardMaterial({color:team===0?0xff6a1a:0xe8e4da,roughness:.8,side:THREE.DoubleSide}));can.position.y=6;can.scale.y=.6;g.add(can);
  const lm=new THREE.LineBasicMaterial({color:0x222222}),lp=[];for(let i=0;i<8;i++){const a=i/8*6.28;lp.push(0,0,0,Math.cos(a)*2.9,5.6,Math.sin(a)*2.9);}const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));g.add(new THREE.LineSegments(lg,lm));
  const pil=new THREE.Mesh(new THREE.CapsuleGeometry(.3,1,4,8),new THREE.MeshStandardMaterial({color:0x3a4a2a,roughness:.8}));pil.position.y=-.6;g.add(pil);g.position.copy(p);g.scale.setScalar(.2);this.scene.add(g);
  const c={g,v:vel.clone().multiplyScalar(.4).add(new V(0,22,0)),t:0,open:0};this.chutes.push(c);return c;}
 burning(p,t=20,size=1){this.fires.push({p:p.clone(),t,size,acc:0});}
 update(dt,cam){this.add.update(dt);this.alpha.update(dt);this.shocks.update(dt);for(const l of this.lights)l.intensity*=Math.exp(-dt*7);
  for(let i=this.debris.length-1;i>=0;i--){const d=this.debris[i];d.t+=dt;d.v.y-=GRAV*dt;d.v.multiplyScalar(Math.exp(-dt*(d.big?.25:.5)));d.m.position.addScaledVector(d.v,dt);_q.setFromEuler(new THREE.Euler(d.w.x*dt,d.w.y*dt,d.w.z*dt));d.m.quaternion.multiply(_q);
   if(d.smoke&&Math.random()<(d.big?.9:.5))this.smokePuff(d.m.position,d.v,d.big?.8:.5,d.big?1.4:.7);if(d.fire&&d.t<4&&Math.random()<.7)this.firePuff(d.m.position,d.v);
   const gh=Math.max(0,hAt(d.m.position.x,d.m.position.z));if(d.m.position.y<gh||d.t>d.life){if(d.m.position.y<1&&gh<=0)this.splash(d.m.position,d.big?1.2:.5);else if(d.big)this.groundBlast(d.m.position,.5);this.scene.remove(d.m);this.debris.splice(i,1);}}
  for(let i=this.chutes.length-1;i>=0;i--){const c=this.chutes[i];c.t+=dt;c.open=Math.min(1,c.open+dt*(c.t>1.2?1.5:0));c.g.scale.setScalar(.2+.8*c.open);const drag=.3+c.open*2.5;c.v.y-=GRAV*dt;c.v.multiplyScalar(Math.exp(-dt*drag));c.g.position.addScaledVector(c.v,dt);
   c.g.rotation.z=Math.sin(c.t*1.3)*.12;c.g.rotation.x=Math.cos(c.t*1.1)*.1;const gh=Math.max(0,hAt(c.g.position.x,c.g.position.z));if(c.g.position.y<gh+.5||c.t>90){if(gh<=0)this.splash(c.g.position,.25);this.scene.remove(c.g);this.chutes.splice(i,1);}}
  for(let i=this.fires.length-1;i>=0;i--){const f=this.fires[i];f.t-=dt;f.acc+=dt;while(f.acc>.12){f.acc-=.12;this.alpha.emit(f.p.x+rs(4*f.size),f.p.y+2,f.p.z+rs(4*f.size),rs(2)+3,8+rnd(6),rs(2),.1,.095,.09,6*f.size,40*f.size,9,{g:-1.2,drag:.5,a:.75});if(Math.random()<.6)this.add.emit(f.p.x+rs(3*f.size),f.p.y+1,f.p.z+rs(3*f.size),rs(2),6+rnd(6),rs(2),3,1.3,.3,4*f.size,1.5,.7,{drag:1});}if(f.t<=0)this.fires.splice(i,1);}
  for(let i=this.ribbons.length-1;i>=0;i--){const r=this.ribbons[i];r.update(cam,r.life||6);if(r.orphan){r.orphan-=dt;r.str*=Math.exp(-dt*.2);for(const q of r.pts)q.t+=dt;if(r.orphan<=0){r.dispose(this.scene);this.ribbons.splice(i,1);}}}}
 ribbon(n,w,col,a,life){const r=new Ribbon(this.scene,n,w,col,a);r.life=life;this.ribbons.push(r);return r;}
 clear(){this.add.clear();this.alpha.clear();for(const d of this.debris)this.scene.remove(d.m);for(const c of this.chutes)this.scene.remove(c.g);this.debris=[];this.chutes=[];this.fires=[];for(const r of this.ribbons)r.dispose(this.scene);this.ribbons=[];}}

/* ================= bullets ================= */
export class Bullets{constructor(n=3000){this.n=n;const A=()=>new Float32Array(n);Object.assign(this,{px:A(),py:A(),pz:A(),vx:A(),vy:A(),vz:A(),life:A(),dmg:A(),cr:A(),cg:A(),cb:A()});this.own=new Array(n).fill(null);this.i=0;}
 fire(owner,p,v,dmg,col,life=2.2){const i=this.i;this.i=(i+1)%this.n;this.px[i]=p.x;this.py[i]=p.y;this.pz[i]=p.z;this.vx[i]=v.x;this.vy[i]=v.y;this.vz[i]=v.z;this.life[i]=life;this.dmg[i]=dmg;this.own[i]=owner;this.cr[i]=col[0];this.cg[i]=col[1];this.cb[i]=col[2];}
 clear(){this.life.fill(0);}
 // step + collide: planes (sub-sphere hit boxes), ground targets, terrain, water
 update(dt,planes,targets,fx,onHit,cam){const tr=fx.tracers;tr.begin();const s0=new V(),s1=new V();
  for(let i=0;i<this.n;i++){if(this.life[i]<=0)continue;this.life[i]-=dt;const x0=this.px[i],y0=this.py[i],z0=this.pz[i];this.vy[i]-=GRAV*.5*dt;const x1=x0+this.vx[i]*dt,y1=y0+this.vy[i]*dt,z1=z0+this.vz[i]*dt;
   this.px[i]=x1;this.py[i]=y1;this.pz[i]=z1;s0.set(x0,y0,z0);s1.set(x1,y1,z1);const own=this.own[i];let hit=false;
   for(const pl of planes){if(!pl.alive||pl===own||(own&&own.team===pl.team&&pl.team>=0))continue;const r=pl.s.rad+2;
    // quick reject: segment vs bounding sphere
    const dx=pl.p.x-x0,dy=pl.p.y-y0,dz=pl.p.z-z0,sx=x1-x0,sy=y1-y0,sz=z1-z0,sl=sx*sx+sy*sy+sz*sz;let t=(dx*sx+dy*sy+dz*sz)/sl;t=t<0?0:t>1?1:t;const ex=x0+sx*t-pl.p.x,ey=y0+sy*t-pl.p.y,ez=z0+sz*t-pl.p.z;if(ex*ex+ey*ey+ez*ez>r*r)continue;
    const h=segHit(pl,s0,s1);if(h){onHit(pl,h.part,this.dmg[i],own,h.p,_w.set(this.vx[i],this.vy[i],this.vz[i]));hit=true;break;}}
   if(!hit&&targets)for(const g of targets){if(g.dead||(own&&own.team===g.team))continue;const dx=g.p.x-x1,dy=g.p.y+g.r*.4-y1,dz=g.p.z-z1;if(dx*dx+dy*dy+dz*dz<g.r*g.r){onHit(g,'site',this.dmg[i],own,s1,null);hit=true;break;}}
   if(!hit){if(y1<.4){if(hAt(x1,z1)<0){fx.bulletImpact(s1,true);hit=true;}}if(!hit&&y1<1300){const h=hAt(x1,z1);if(y1<h){fx.bulletImpact(s1.set(x1,h,z1),false);hit=true;}}}
   if(hit){this.life[i]=0;continue;}
   const k=.035;tr.put(x1-this.vx[i]*k,y1-this.vy[i]*k,z1-this.vz[i]*k,x1,y1,z1,this.cr[i],this.cg[i],this.cb[i]);}
  tr.end();}}
const _l0=new V(),_l1=new V(),_iq=new THREE.Quaternion();
// segment vs. an aircraft's local hit spheres; returns {part,p}
export function segHit(pl,a,b){const hs=pl.mesh&&pl.mesh.userData.hit;if(!hs)return null;_iq.copy(pl.q).invert();_l0.subVectors(a,pl.p).applyQuaternion(_iq);_l1.subVectors(b,pl.p).applyQuaternion(_iq);
 const d=_v.subVectors(_l1,_l0),dl=d.lengthSq()||1;let best=null,bt=2;
 for(const h of hs){if(pl.lost[h[4]])continue;const cx=h[0]-_l0.x,cy=h[1]-_l0.y,cz=h[2]-_l0.z;let t=(cx*d.x+cy*d.y+cz*d.z)/dl;t=t<0?0:t>1?1:t;const ex=_l0.x+d.x*t-h[0],ey=_l0.y+d.y*t-h[1],ez=_l0.z+d.z*t-h[2];if(ex*ex+ey*ey+ez*ez<h[3]*h[3]&&t<bt){bt=t;best=h;}}
 if(!best)return null;return{part:best[4],p:new V().lerpVectors(a,b,bt)};}

/* ================= missiles, flares, bombs, flak ================= */
export class Ordnance{constructor(scene,fx){this.scene=scene;this.fx=fx;this.missiles=[];this.flares=[];this.bombs=[];this.pool=[];this.bpool=[];}
 launch(owner,target,kind='ir'){const pl=owner;let m=this.pool.pop();if(!m){m=makeMissileMesh();}if(kind==='sam')m.scale.setScalar(1.6);else m.scale.setScalar(1);this.scene.add(m);
  const p=pl.p.clone(),f=new V(0,0,-1).applyQuaternion(pl.q);if(pl.mesh&&pl.mesh.userData.msl){const ms=pl.mesh.userData.msl.find(o=>o.visible);if(ms){ms.getWorldPosition(p);ms.visible=false;}}
  const mi={owner:pl,target,kind,p,v:pl.v?pl.v.clone().addScaledVector(f,kind==='sam'?40:8).add(pl.mesh?new V(0,-6,0).applyQuaternion(pl.q):new V()):f.clone().multiplyScalar(60),t:0,life:kind==='sam'?14:kind==='agm'?14:9,burn:kind==='sam'?4:2.6,mesh:m,seek:true,
   trail:this.fx.ribbon(64,kind==='sam'?1.4:.8,new C(.92,.92,.92),.4,4),gmax:kind==='sam'?24:kind==='agm'?20:34,top:kind==='sam'?620:kind==='agm'?420:560,smokeAcc:0,armed:.25};
  if(kind==='sam'){mi.v.set(0,90,0);mi.p.y+=4;}
  m.position.copy(mi.p);this.missiles.push(mi);return mi;}
 dropFlares(pl){for(let k=0;k<2;k++){const side=k?1:-1;const r=new V(side,0,0).applyQuaternion(pl.q),u=new V(0,-1,0).applyQuaternion(pl.q);
  this.flares.push({p:pl.p.clone(),v:pl.v.clone().multiplyScalar(.5).addScaledVector(r,25).addScaledVector(u,18),t:0,owner:pl,acc:0});}
  // each flare pair may spoof the missiles tracking this aircraft
  for(const m of this.missiles)if(m.target===pl&&m.seek&&m.kind!=='agm'){const d=m.p.distanceTo(pl.p),pr=(m.kind==='sam'?.35:.55)*(d<1800?1:.5)*(d<180?.3:1);if(Math.random()<pr){m.target=this.flares[this.flares.length-1];m.decoyed=true;}}}
 dropBomb(pl){let m=this.bpool.pop()||makeBombMesh();this.scene.add(m);const p=pl.p.clone();const bs=pl.mesh&&pl.mesh.userData.bombs.find(o=>o.visible);if(bs){bs.getWorldPosition(p);bs.visible=false;}
  m.position.copy(p);m.quaternion.copy(pl.q);this.bombs.push({owner:pl,p,v:pl.v.clone().add(new V(0,-3,0)),mesh:m,t:0});}
 clear(){for(const m of this.missiles){this.scene.remove(m.mesh);this.pool.push(m.mesh);m.trail.orphan=.01;}for(const b of this.bombs){this.scene.remove(b.mesh);this.bpool.push(b.mesh);}this.missiles=[];this.bombs=[];this.flares=[];}
 update(dt,world,ev){const fx=this.fx;
  for(let i=this.flares.length-1;i>=0;i--){const f=this.flares[i];f.t+=dt;f.v.y-=GRAV*.6*dt;f.v.multiplyScalar(Math.exp(-dt*1.2));f.p.addScaledVector(f.v,dt);f.acc+=dt;
   if(f.acc>.03){f.acc=0;fx.add.emit(f.p.x,f.p.y,f.p.z,0,0,0,3.4,2.8,2,3.2,1.2,.25,{drag:0});fx.alpha.emit(f.p.x,f.p.y,f.p.z,rs(1),rs(1),rs(1),.85,.85,.85,1.2,5,2.4,{drag:1,a:.5});}if(f.t>4.5)this.flares.splice(i,1);}
  for(let i=this.missiles.length-1;i>=0;i--){const m=this.missiles[i];m.t+=dt;m.armed-=dt;const sp=m.v.length();
   const tg=m.target;let tp=null;if(m.seek&&tg){if(tg.alive===false||(tg.t!==undefined&&tg.t>4.5)||tg.dead){m.seek=false;}else{tp=tg.p;}}
   // thrust profile
   const want=m.t<m.burn?m.top+(m.owner&&m.owner.sp?m.owner.sp*.5:0):sp*Math.exp(-dt*.18);let nsp=sp+(want-sp)*Math.min(1,dt*(m.t<m.burn?2.2:1));
   const dir=m.v.clone().divideScalar(Math.max(sp,1));
   if(tp&&m.t>.15){const tv=tg.v||new V();const rel=_v.subVectors(tp,m.p),dist=rel.length();const clos=Math.max(80,nsp-tv.dot(rel)/Math.max(dist,1));const tgo=Math.min(6,dist/clos);
    const aim=_w.copy(tp).addScaledVector(tv,tgo*.9);if(m.kind==='agm')aim.y+=1;aim.sub(m.p).normalize();
    // seeker gimbal limit
    if(aim.dot(dir)<Math.cos(1.25)){m.seek=false;}else{const ang=Math.acos(Math.min(1,aim.dot(dir))),maxR=m.gmax*GRAV/Math.max(nsp,80)*dt*(m.t<.5?.4:1);if(ang>1e-5){const ax=new V().crossVectors(dir,aim);if(ax.lengthSq()>1e-10){ax.normalize();dir.applyQuaternion(_q.setFromAxisAngle(ax,Math.min(ang,maxR)));}}}
    if(m.kind!=='agm'&&tg.alive!==undefined&&dist<15&&m.armed<=0){this.detonate(m,i,world,ev,tg);continue;}}
   else{dir.y-=GRAV*.25*dt/Math.max(nsp,100);dir.normalize();}
   m.v.copy(dir).multiplyScalar(nsp);m.p.addScaledVector(m.v,dt);m.mesh.position.copy(m.p);m.mesh.quaternion.setFromUnitVectors(new V(0,0,-1),dir);
   if(m.t<m.burn){m.trail.push(m.p,true,dt,4);fx.add.emit(m.p.x-dir.x*2,m.p.y-dir.y*2,m.p.z-dir.z*2,-dir.x*30,-dir.y*30,-dir.z*30,3,1.8,.7,m.kind==='sam'?2.4:1.6,.4,.07,{drag:3});}else m.trail.push(m.p,false,dt,4);
   // proximity to any hostile aircraft (also flares can be overflown) + ground impact
   if(m.armed<=0&&m.kind!=='agm'){let hitPl=null;for(const pl of world.planes){if(!pl.alive||pl.team===m.owner.team&&pl.team>=0||pl===m.owner)continue;if(pl.p.distanceToSquared(m.p)<(pl.s.rad*.9+6)**2){hitPl=pl;break;}}if(hitPl){this.detonate(m,i,world,ev,hitPl);continue;}}
   const gh=hAt(m.p.x,m.p.z);if(m.p.y<Math.max(0,gh)||m.t>m.life||(m.kind==='agm'&&tg&&tg.p&&m.p.distanceTo(tg.p)<(tg.r||8))){this.detonate(m,i,world,ev,null);continue;}}
  for(let i=this.bombs.length-1;i>=0;i--){const b=this.bombs[i];b.t+=dt;b.v.y-=GRAV*dt;b.v.multiplyScalar(Math.exp(-dt*.03));b.p.addScaledVector(b.v,dt);b.mesh.position.copy(b.p);b.mesh.quaternion.setFromUnitVectors(new V(0,0,-1),_v.copy(b.v).normalize());
   const gh=hAt(b.p.x,b.p.z);let hitT=null;for(const g of world.targets){if(!g.dead&&g.p.distanceToSquared(b.p)<(g.r+2)**2)hitT=g;}
   if(b.p.y<Math.max(gh,0)||hitT||b.t>40||(world.deckHit&&world.deckHit(b.p))){this.scene.remove(b.mesh);this.bpool.push(b.mesh);this.bombs.splice(i,1);const water=gh<0&&b.p.y<2;if(water)fx.splash(b.p,2.2);else fx.groundBlast(b.p,1.1);ev('bomb',b.owner,b.p.clone(),water);}}}
 detonate(m,i,world,ev,direct){this.scene.remove(m.mesh);this.pool.push(m.mesh);m.trail.orphan=5;this.missiles.splice(i,1);const gh=hAt(m.p.x,m.p.z);
  if(m.p.y<2&&gh<0)this.fx.splash(m.p,1.2);else if(m.p.y<gh+3)this.fx.groundBlast(m.p,.7);else this.fx.explode(m.p,.75,{debris:false});ev('missile',m,m.p.clone(),direct);}}
// predicted bomb impact point (CCIP)
export function bombImpact(p,v){const q=p.clone(),w=v.clone().add(new V(0,-3,0));for(let i=0;i<400;i++){const dt=.05;w.y-=GRAV*dt;w.multiplyScalar(Math.exp(-dt*.03));q.addScaledVector(w,dt);if(q.y<Math.max(0,hAt(q.x,q.z)))return{p:q,t:i*dt};}return null;}
