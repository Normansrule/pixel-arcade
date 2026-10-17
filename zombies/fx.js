// NIGHTFALL — effects: additive sparks/embers, soft dust & ash puffs, low ground mist, tracers, bullet-hole/scorch decals,
// lightning arcs, tumbling debris (boards, planks, armour), shock rings and a pooled flash light. No gore: hits read as dust and ash.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,R=Math.random,TAU=Math.PI*2;

class Points{constructor(scene,n,additive,tex){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.gr=new Float32Array(n);
  this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.drag=new Float32Array(n);this.rot=new Float32Array(n);this.al=new Float32Array(n);this.i=0;this.live=0;
  const geo=new THREE.BufferGeometry();const A=(a,k)=>new THREE.BufferAttribute(a,k).setUsage(THREE.DynamicDrawUsage);geo.setAttribute('position',A(this.p,3));geo.setAttribute('color',A(this.c,4));geo.setAttribute('size',A(this.s,1));geo.setAttribute('rot',A(this.rot,1));
  this.U={uScale:{value:500},uTex:{value:tex},uFog:{value:new THREE.Color()},uFogD:{value:.03},uNear:{value:.8}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
   vertexShader:'attribute float size;attribute float rot;attribute vec4 color;uniform float uScale;varying vec4 vC;varying float vR,vD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;vR=rot;vD=-mv.z;gl_PointSize=min(900.,size*uScale/max(.05,-mv.z));gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'uniform float uFogD;varying vec4 vC;varying float vR,vD;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);float f=exp(-uFogD*uFogD*vD*vD*.6);gl_FragColor=vec4(vC.rgb*a*vC.a*f,1.);}'
    :'uniform sampler2D uTex;uniform vec3 uFog;uniform float uFogD,uNear;varying vec4 vC;varying float vR,vD;void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);p=vec2(c*p.x-s*p.y,s*p.x+c*p.y)+.5;vec4 t=texture2D(uTex,p);float f=1.-exp(-uFogD*uFogD*vD*vD);gl_FragColor=vec4(mix(vC.rgb*(1.1-.35*gl_PointCoord.y),uFog,f),t.a*vC.a*smoothstep(uNear*.12,uNear,vD));}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=additive?4:3;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0,grow=0,alpha=1){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.drag[i]=drag;this.gr[i]=grow;this.rot[i]=R()*6.28;this.al[i]=alpha;this.live=1;return i;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=R()*2-1,dy=R()*2-1,dz=R()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.dir){const s=o.spread??.6;dx=dx*s+o.dir.x;dy=dy*s+o.dir.y;dz=dz*s+o.dir.z;}if(o.up)dy=Math.abs(dy);const sp=speed*(.3+R()*.7);
  const c=Array.isArray(col)?col[R()*col.length|0]:col;const j=o.jit??0;this.emit(p.x+(R()-.5)*j,p.y+(R()-.5)*j,p.z+(R()-.5)*j,dx*sp,dy*sp,dz*sp,c.r,c.g,c.b,size*(.5+R()*.8),life*(.5+R()*.6),o.grav??0,o.drag??1.5,o.grow??0,o.alpha??1);}}
 update(dt){if(!this.live)return;const{p,v,c,oc,s,os,life,max,g,drag,gr,al}=this;const add=this.add;let any=0;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}any=1;life[i]-=dt;const k=Math.max(0,life[i]/max[i]),dr=Math.exp(-drag[i]*dt);
   v[i*3]*=dr;v[i*3+1]=v[i*3+1]*dr-g[i]*dt;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;if(p[i*3+1]<.02&&v[i*3+1]<0){p[i*3+1]=.02;v[i*3+1]*=-.3;v[i*3]*=.6;v[i*3+2]*=.6;}
   if(add){const f=k*k;c[i*4]=oc[i*3]*f;c[i*4+1]=oc[i*3+1]*f;c[i*4+2]=oc[i*3+2]*f;c[i*4+3]=1;s[i]=os[i]*(.4+.6*k);}
   else{const fin=Math.min(1,(1-k)*8),fout=Math.min(1,life[i]/Math.min(1.5,max[i]*.5));c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=al[i]*fin*fout;os[i]+=gr[i]*dt;s[i]=os[i];this.rot[i]+=dt*.25;}}
  this.live=any;const A=this.geo.attributes;A.position.needsUpdate=A.color.needsUpdate=A.size.needsUpdate=A.rot.needsUpdate=true;}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}}

class Streaks{constructor(scene,n=80){this.n=n;this.list=[];const g=new THREE.BoxGeometry(1,1,1);g.translate(0,0,-.5);
  this.mesh=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),n);this.mesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(n*3),3);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.z=new V(0,0,-1);this.t=new V();this.sc=new V();this.col=new THREE.Color();}
 fire(a,b,col,o={}){if(this.list.length>=this.n)this.list.shift();const d=new V().subVectors(b,a),dist=d.length();if(dist<.6)return;d.divideScalar(dist);this.list.push({a:a.clone(),d,dist,t:0,speed:o.speed??240,len:Math.min(o.len??3,dist),w:o.w??.022,col:new THREE.Color(col??0xffd080),life:o.life??.2,age:0});}
 update(dt){for(let i=this.list.length-1;i>=0;i--){const t=this.list[i];t.age+=dt;if(t.speed>0){t.t+=dt*t.speed;if(t.t-t.len>t.dist)this.list.splice(i,1);}else if(t.age>t.life)this.list.splice(i,1);}let k=0;
  for(const t of this.list){let head,tail,w=t.w,f=1;if(t.speed>0){head=Math.min(t.dist,t.t);tail=Math.max(0,t.t-t.len);}else{head=t.dist;tail=0;f=1-t.age/t.life;w=t.w*(1+t.age*5);}const L=head-tail;if(L<=.01)continue;
   this.q.setFromUnitVectors(this.z,t.d);this.m.compose(this.t.copy(t.a).addScaledVector(t.d,head),this.q,this.sc.set(w,w,L));this.mesh.setMatrixAt(k,this.m);this.col.copy(t.col).multiplyScalar(f);this.mesh.setColorAt(k,this.col);k++;}
  this.mesh.count=k;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;}
 clear(){this.list.length=0;this.mesh.count=0;}}

class Decals{constructor(scene,tex,n,size,o={}){this.n=n;this.i=0;const m=new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4,roughness:.95,...o});
  this.mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(size,size),m,n);this.mesh.count=0;this.mesh.receiveShadow=true;this.mesh.frustumCulled=false;scene.add(this.mesh);this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.q2=new THREE.Quaternion();this.Z=new V(0,0,1);this.sv=new V();this.pv=new V();}
 add(p,n,s=1){const i=this.i;this.i=(i+1)%this.n;this.q.setFromUnitVectors(this.Z,n);this.q2.setFromAxisAngle(this.Z,R()*6.28);this.q.multiply(this.q2);this.m.compose(this.pv.copy(p).addScaledVector(n,.012),this.q,this.sv.set(s,s,s));this.mesh.setMatrixAt(i,this.m);this.mesh.count=Math.max(this.mesh.count,i+1);this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.mesh.count=0;this.i=0;}}

// jagged lightning arcs (volt caster, power switch, forge)
class Bolts{constructor(scene,n=24,seg=10){this.n=n;this.seg=seg;this.list=[];const pos=new Float32Array(n*seg*2*3);this.pos=pos;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));g.setDrawRange(0,0);
  this.line=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:new THREE.Color(1.6,2.6,4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));this.line.frustumCulled=false;scene.add(this.line);this.g=g;}
 add(a,b,life=.25,amp=.35){if(this.list.length>=this.n)this.list.shift();this.list.push({a:a.clone(),b:b.clone(),life,max:life,amp});}
 update(dt){let k=0;const P=this.pos,S=this.seg;const d=new V(),pr=new V(),cur=new V();for(let i=this.list.length-1;i>=0;i--){const b=this.list[i];b.life-=dt;if(b.life<=0){this.list.splice(i,1);continue;}}
  for(const b of this.list){d.subVectors(b.b,b.a);pr.copy(b.a);for(let s=1;s<=S;s++){const t=s/S;cur.copy(b.a).addScaledVector(d,t);if(s<S){const j=b.amp*Math.sin(t*Math.PI);cur.x+=(R()-.5)*j;cur.y+=(R()-.5)*j;cur.z+=(R()-.5)*j;}
    const o=k*6;P[o]=pr.x;P[o+1]=pr.y;P[o+2]=pr.z;P[o+3]=cur.x;P[o+4]=cur.y;P[o+5]=cur.z;k++;pr.copy(cur);}}
  this.g.setDrawRange(0,k*2);this.g.attributes.position.needsUpdate=true;this.line.material.opacity=1;}
 clear(){this.list.length=0;this.g.setDrawRange(0,0);}}

class Debris{constructor(scene){this.scene=scene;this.list=[];}
 // throw an existing mesh (re-parented into world space) or a new one
 add(mesh,vel,spin,life=3,o={}){mesh.updateMatrixWorld(true);const wp=new V(),wq=new THREE.Quaternion(),ws=new V();mesh.matrixWorld.decompose(wp,wq,ws);if(mesh.parent)mesh.parent.remove(mesh);this.scene.add(mesh);mesh.position.copy(wp);mesh.quaternion.copy(wq);mesh.scale.copy(ws);
  this.list.push({m:mesh,v:vel.clone(),w:spin.clone(),life,max:life,r:o.r??.1,fade:o.fade??true});}
 update(dt){const q=new THREE.Quaternion(),e=new THREE.Euler();for(let i=this.list.length-1;i>=0;i--){const d=this.list[i];d.life-=dt;d.v.y-=14*dt;d.m.position.addScaledVector(d.v,dt);
   if(d.m.position.y<d.r){d.m.position.y=d.r;d.v.y*=-.3;d.v.x*=.55;d.v.z*=.55;d.w.multiplyScalar(.6);}e.set(d.w.x*dt,d.w.y*dt,d.w.z*dt);q.setFromEuler(e);d.m.quaternion.multiply(q);
   if(d.life<.6)d.m.position.y-=dt*.4;if(d.life<=0){this.scene.remove(d.m);this.list.splice(i,1);}}}
 clear(){for(const d of this.list)this.scene.remove(d.m);this.list.length=0;}}

class Rings{constructor(scene){this.scene=scene;this.list=[];this.geo=new THREE.RingGeometry(.86,1,48).rotateX(-Math.PI/2);}
 add(p,col,r0,r1,life){const m=new THREE.Mesh(this.geo,new THREE.MeshBasicMaterial({color:new THREE.Color(col),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.position.set(p.x,p.y+.06,p.z);this.scene.add(m);this.list.push({m,r0,r1,life,max:life,col:new THREE.Color(col)});}
 update(dt){for(let i=this.list.length-1;i>=0;i--){const r=this.list[i];r.life-=dt;const k=1-r.life/r.max;r.m.scale.setScalar(r.r0+(r.r1-r.r0)*(1-Math.pow(1-k,2)));r.m.material.color.copy(r.col).multiplyScalar(1-k);if(r.life<=0){this.scene.remove(r.m);r.m.material.dispose();this.list.splice(i,1);}}}
 clear(){for(const r of this.list)this.scene.remove(r.m);this.list.length=0;}}

export class FX{
 constructor(scene,T){this.scene=scene;this.T=T;
  this.sparks=new Points(scene,2600,true);this.smoke=new Points(scene,1400,false,T.puff);this.mist=new Points(scene,70,false,T.puff);this.mist.U.uNear.value=7;
  this.streaks=new Streaks(scene);this.holes=new Decals(scene,T.hole,140,.12);this.scorch=new Decals(scene,T.scorch,24,3.2);this.bolts=new Bolts(scene);this.debris=new Debris(scene);this.rings=new Rings(scene);
  this.lights=[0].map(()=>{const l=new THREE.PointLight(0xffa050,0,14,1.8);scene.add(l);return{l,t:0,max:1,i:0};});this.li=0;this.mistT=0;}
 flash(p,col,int,dist,life=.12){const L=this.lights[this.li++%this.lights.length];L.l.position.copy(p);L.l.color.set(col);L.l.distance=dist;L.i=int;L.t=L.max=life;L.l.intensity=int;}
 // non-gory zombie hit: dust/ash puff + a few embers
 ashHit(p,dir,big=false){const n=big?16:7;this.smoke.burst(p,n,big?2.4:1.4,[new THREE.Color(.34,.32,.3),new THREE.Color(.24,.23,.22),new THREE.Color(.45,.42,.38)],big?.55:.32,big?1.1:.7,{dir,spread:.9,grav:-.2,drag:3,grow:big?.7:.45,alpha:.75,jit:.06});
  this.sparks.burst(p,big?14:5,big?5:3.4,[new THREE.Color(2.6,1,.25),new THREE.Color(1.8,.6,.12)],.05,.45,{dir,spread:1,grav:4,drag:1.6});}
 impact(p,n,kind){const dust=kind==='M'||kind==='steel'?0:1;if(dust)this.smoke.burst(p,4,1.2,[new THREE.Color(.42,.38,.33),new THREE.Color(.3,.28,.25)],.24,.6,{dir:n,spread:.7,grav:-.1,drag:3,grow:.4,alpha:.6});
  this.sparks.burst(p,dust?4:9,dust?2.5:5,[new THREE.Color(2.4,1.8,1),new THREE.Color(2,1,.3)],.035,.3,{dir:n,spread:1,grav:9,drag:1});if(kind!=='ground'||R()<.5)this.holes.add(p,n,.8+R()*.5);}
 explosion(p,s=1){this.sparks.burst(p,60*s,14*s,[new THREE.Color(3.2,1.6,.4),new THREE.Color(3,2.4,1.2),new THREE.Color(2,.6,.1)],.22*s,.7,{grav:6,drag:1.4});
  this.smoke.burst(p,26*s,3.6*s,[new THREE.Color(.22,.2,.19),new THREE.Color(.32,.29,.26),new THREE.Color(.15,.14,.13)],1.0*s,2.2,{grav:-.6,drag:1.6,grow:1.4,alpha:.85,jit:.5});
  this.rings.add(p,new THREE.Color(2,1,.4),.5,6*s,.45);this.flash(new V(p.x,p.y+.8,p.z),0xff8a40,220*s,16*s,.28);this.scorch.add(new V(p.x,.01,p.z),new V(0,1,0),.8+s*.5);}
 // a zombie crumbling to ash
 crumble(p,h=1.8,col=new THREE.Color(.3,.29,.28)){for(let k=0;k<3;k++)this.smoke.burst(new V(p.x,p.y+h*(.25+k*.3),p.z),5,.8,[col,new THREE.Color(.2,.19,.18)],.35,1.6,{grav:-.35,drag:2,grow:.5,alpha:.55,jit:.3});
  this.sparks.burst(new V(p.x,p.y+h*.5,p.z),14,1.6,[new THREE.Color(2.4,.9,.2),new THREE.Color(1.6,.5,.1)],.05,1.4,{grav:-1.2,drag:1.2,jit:.5});}
 dirt(p,n=10){this.smoke.burst(p,n,2.2,[new THREE.Color(.3,.25,.2),new THREE.Color(.22,.18,.14)],.45,1.0,{up:true,grav:2,drag:2.5,grow:.6,alpha:.8,jit:.4});}
 update(dt,fog,player){this.sparks.update(dt);this.smoke.update(dt);this.mist.update(dt);this.streaks.update(dt);this.bolts.update(dt);this.debris.update(dt);this.rings.update(dt);
  for(const L of this.lights){if(L.t>0){L.t-=dt;L.l.intensity=L.i*Math.max(0,L.t/L.max);}else L.l.intensity=0;}
  if(fog){for(const P of[this.smoke,this.mist]){P.U.uFog.value.copy(fog.color);P.U.uFogD.value=fog.density;}this.sparks.U.uFogD.value=fog.density;}
  // drifting ground mist around the player
  this.mistT-=dt;if(player&&this.mistT<=0){this.mistT=.18;const a=R()*TAU,r=8+R()*18;this.mist.emit(player.x+Math.cos(a)*r,.2+R()*.4,player.z+Math.sin(a)*r,(R()-.5)*.3,0,(R()-.5)*.3,.14,.16,.21,2.6+R()*2.5,10+R()*6,0,0,.2,.09);}}
 clear(){this.sparks.clear();this.smoke.clear();this.streaks.clear();this.holes.clear();this.scorch.clear();this.bolts.clear();this.debris.clear();this.rings.clear();}}
