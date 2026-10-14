// VOIDWING — capital ships at runtime: shields, subsystems, hull spheres, point-defence turrets (instanced), damage states.
import * as THREE from '../vendor/three.module.min.js';
import {V,C,rs,rnd,cl} from './util.js';
import {buildCapital,TEAMS} from './ships.js';
const _a=new V(),_b=new V(),_m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_iq=new THREE.Quaternion();

const SHIELD_MAT=team=>new THREE.ShaderMaterial({uniforms:{uC:{value:TEAMS[team].glow.clone().multiplyScalar(.35)},uHit:{value:new V()},uHitT:{value:9},uA:{value:1},uT:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
 vertexShader:'varying vec3 vN,vV,vL;void main(){vL=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
 fragmentShader:`uniform vec3 uC,uHit;uniform float uHitT,uA,uT;varying vec3 vN,vV,vL;
  float hex(vec2 p){p.x*=1.1547;p.y+=mod(floor(p.x),2.)*.5;vec2 f=abs(fract(p)-.5);return abs(max(f.x*1.5+f.y,f.y*2.)-1.);}
  void main(){float fr=pow(1.-abs(dot(vN,vV)),3.);vec3 n=normalize(vL);vec2 uv=vec2(atan(n.z,n.x)*6.,n.y*8.);float h=smoothstep(.12,.0,hex(uv*1.6));
   float d=distance(n,uHit);float ring=smoothstep(.06,.0,abs(d-uHitT*.9))*(1.-smoothstep(.0,.8,uHitT))*1.6;float spot=smoothstep(.35,.0,d)*(1.-smoothstep(0.,.4,uHitT))*1.5;
   float a=(fr*.16+h*.025*(.5+.5*sin(uT*2.+n.y*9.))+ring*(.4+h)+spot)*uA;gl_FragColor=vec4(uC*a,1.);}`});

export class Capital{constructor(scene,kind,team,pos,yaw,name){const B=buildCapital(kind,team);Object.assign(this,{kind,team,name,group:B.group,L:B.L,W:B.W,H:B.H,eng:B.eng,turretDefs:B.turrets});
  this.p=pos.clone();this.q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,yaw,0));this.v=new V();this.dir=new V(0,0,-1).applyQuaternion(this.q);this.speed=kind==='flagship'?3:5;
  this.big=kind==='flagship';this.maxHull=this.big?7000:3400;this.hull=this.maxHull;this.maxShield=this.big?3200:1500;this.shield=this.maxShield;this.shieldRegen=this.big?22:14;this.shieldR=B.shieldR;this.locked=false;this.dead=false;this.lastHit=0;
  this.hullS=B.hullS;this.subs=B.subs.map(s=>Object.assign(s,{cap:this,max:s.hp,dead:false,team,wp:o=>(o||new V()).copy(s.lp).applyQuaternion(this.q).add(this.p),get alive(){return!this.dead;}}));
  this.turrets=this.turretDefs.map((t,i)=>({lp:t.lp,up:t.up,yaw:0,pitch:0,cd:rnd(2),burst:0,dead:false,sub:this.subs.find(s=>s.turret===i),aimQ:new THREE.Quaternion()}));
  this.shieldMesh=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),SHIELD_MAT(team));this.shieldMesh.scale.copy(this.shieldR);this.shieldMesh.renderOrder=11;this.group.add(this.shieldMesh);
  this.group.position.copy(this.p);this.group.quaternion.copy(this.q);scene.add(this.group);this.scene=scene;this.fires=[];this.sinkT=0;this.dmgBy=new Map();this.blinkT=rnd(2);
  this.r=Math.max(this.L*.5,this.W);this.c={rad:this.L*.4};}
 get alive(){return!this.dead;}
 wp(o){return(o||new V()).copy(this.p);}
 shieldUp(){return!this.down&&this.shield>0&&this.gensAlive()>0;}
 gensAlive(){return this.subs.filter(s=>s.kind==='shield'&&!s.dead).length;}
 // world -> local
 toLocal(x,y,z,o){_iq.copy(this.q).invert();return o.set(x-this.p.x,y-this.p.y,z-this.p.z).applyQuaternion(_iq);}
 segHit(x0,y0,z0,x1,y1,z1){const dx=(x0+x1)/2-this.p.x,dy=(y0+y1)/2-this.p.y,dz=(z0+z1)/2-this.p.z,R=this.shieldR.z+40;if(dx*dx+dy*dy+dz*dz>R*R)return null;
  const a=this.toLocal(x0,y0,z0,_a),b=this.toLocal(x1,y1,z1,_b);
  if(this.shieldUp()){// ellipsoid crossing (from outside)
   const S=this.shieldR,ia=new V(a.x/S.x,a.y/S.y,a.z/S.z),ib=new V(b.x/S.x,b.y/S.y,b.z/S.z);const la=ia.lengthSq(),lb=ib.lengthSq();
   if(la>=1&&lb<1){const d=ib.clone().sub(ia),A=d.lengthSq(),Bq=2*ia.dot(d),Cq=la-1,disc=Bq*Bq-4*A*Cq;const t=disc>0?(-Bq-Math.sqrt(disc))/(2*A):0;const n=ia.clone().addScaledVector(d,t);
    return{p:new V().lerpVectors(a,b,t).applyQuaternion(this.q).add(this.p),shield:true,n};}
   // subsystems outside the bubble (generators poke out) are still targets
  }
  const d=new V().subVectors(b,a),dl=d.lengthSq()||1;let best=null,bt=2;
  const test=(cx,cy,cz,r,o)=>{const ex=cx-a.x,ey=cy-a.y,ez=cz-a.z;let t=(ex*d.x+ey*d.y+ez*d.z)/dl;t=t<0?0:t>1?1:t;const qx=a.x+d.x*t-cx,qy=a.y+d.y*t-cy,qz=a.z+d.z*t-cz;if(qx*qx+qy*qy+qz*qz<r*r&&t<bt){bt=t;best=o;}};
  for(const s of this.subs)if(!s.dead)test(s.lp.x,s.lp.y,s.lp.z,s.r,s);
  if(!best&&!this.shieldUp())for(const h of this.hullS)test(h[0],h[1],h[2],h[3],'hull');
  if(!best&&this.shieldUp()){// shielded: only generators that sit outside the bubble
   return null;}
  if(!best)return null;return{p:new V().lerpVectors(a,b,bt).applyQuaternion(this.q).add(this.p),sub:best==='hull'?null:best,shield:false};}
 // collision push-out for a fighter (sphere radius r) -> returns penetration normal or null
 collide(p,r){const R=this.shieldR.z+30;if(p.distanceToSquared(this.p)>R*R)return null;const l=this.toLocal(p.x,p.y,p.z,_a);
  for(const h of this.hullS){const dx=l.x-h[0],dy=l.y-h[1],dz=l.z-h[2],d2=dx*dx+dy*dy+dz*dz,rr=h[3]+r;if(d2<rr*rr){const d=Math.sqrt(d2)||1;return{n:new V(dx/d,dy/d,dz/d).applyQuaternion(this.q),depth:rr-d};}}return null;}
 hitShield(n){const u=this.shieldMesh.material.uniforms;u.uHit.value.copy(n).normalize();u.uHitT.value=0;}
 update(dt,G){if(this.dead){this.sinkT+=dt;this.group.position.addScaledVector(this.dir,dt*2).add(_a.set(0,-dt*3,0));this.group.rotateZ(dt*.01);this.group.rotateX(dt*.004);return;}
  this.p.addScaledVector(this.dir,this.speed*dt);this.v.copy(this.dir).multiplyScalar(this.speed);this.group.position.copy(this.p);
  const u=this.shieldMesh.material.uniforms;u.uHitT.value+=dt;u.uT.value+=dt;const up=this.shieldUp();u.uA.value+=((up?(this.locked?1.3:1):0)-u.uA.value)*Math.min(1,dt*4);this.shieldMesh.visible=u.uA.value>.01;
  if(this.gensAlive()&&G.time-(this.down?this.brokeT||0:this.lastHit)>(this.down?18:4)){this.shield=Math.min(this.maxShield,this.shield+this.shieldRegen*dt*this.gensAlive()/2);if(this.down&&this.shield>this.maxShield*.3)this.down=false;}
  this.blinkT+=dt;this.group.userData.blink.visible=this.blinkT%1.6<.12;}
 // turret aim + world transform of each turret (for instanced rendering)
 turretWorld(t,o){return o.copy(t.lp).applyQuaternion(this.q).add(this.p);}
 // point a turret at a world position (or along the hull); returns elevation above the hull plane
 aimTurret(t,target){const p=this.turretWorld(t,_a),up=_b.copy(t.up).applyQuaternion(this.q);const tg=target?target:_c.copy(p).addScaledVector(this.dir,100).addScaledVector(up,8);
  const dir=_d.subVectors(tg,p).normalize();let el=Math.asin(cl(dir.dot(up),-1,1));if(el<.05){dir.addScaledVector(up,.05-el).normalize();}
  _m.lookAt(p,_c.copy(p).add(dir),up);t.aimQ.setFromRotationMatrix(_m);return el;}}
const _c=new V(),_d=new V();

// all turrets of all capitals as two instanced meshes (base + twin barrels)
export class TurretSet{constructor(scene,n=64){const mat=new THREE.MeshStandardMaterial({color:0x6b6e75,metalness:.7,roughness:.45});const dm=new THREE.MeshStandardMaterial({color:0x2a2c30,metalness:.8,roughness:.4});
  const base=new THREE.CylinderGeometry(4,5,3,12);const head=new THREE.BoxGeometry(6,3.2,6);head.translate(0,2.4,0);const bg=mergeTwo(base,head);
  const bar=new THREE.CylinderGeometry(.5,.5,9,6);bar.rotateX(Math.PI/2);bar.translate(0,2.6,-5.5);const b1=bar.clone();b1.translate(-1.3,0,0);const b2=bar.clone();b2.translate(1.3,0,0);
  this.base=new THREE.InstancedMesh(bg,mat,n);this.bars=new THREE.InstancedMesh(mergeTwo(b1,b2),dm,n);for(const m of[this.base,this.bars]){m.count=0;m.frustumCulled=false;m.castShadow=true;scene.add(m);}this.dummy=new THREE.Object3D();}
 update(caps,scale=1){let k=0;const d=this.dummy;for(const cp of caps){if(cp.dead&&cp.sinkT>12)continue;for(const t of cp.turrets){if(k>=this.base.instanceMatrix.count)break;
   d.position.copy(t.lp).applyQuaternion(cp.group.quaternion).add(cp.group.position);d.quaternion.copy(t.aimQ);d.scale.setScalar(t.dead?.001:(cp.big?2.4:1.8)*scale);d.updateMatrix();this.base.setMatrixAt(k,d.matrix);this.bars.setMatrixAt(k,d.matrix);k++;}}
  this.base.count=this.bars.count=k;this.base.instanceMatrix.needsUpdate=this.bars.instanceMatrix.needsUpdate=true;}}
function mergeTwo(a,b){a=a.index?a.toNonIndexed():a;b=b.index?b.toNonIndexed():b;const g=new THREE.BufferGeometry();for(const k of['position','normal','uv']){const A=a.attributes[k],B=b.attributes[k];const arr=new Float32Array(A.array.length+B.array.length);arr.set(A.array);arr.set(B.array,A.array.length);g.setAttribute(k,new THREE.BufferAttribute(arr,A.itemSize));}return g;}
