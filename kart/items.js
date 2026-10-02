// CRITTER KART — item use, projectiles (hornets, darts, goo mines) and boss hazards (boulders, ice, fireballs, lightning).
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,wrapA} from './util.js';
import {query,at,SEA} from './course.js';
import {hitRacer} from './physics.js';
import {missileMesh,gooMesh,mat} from './models.js';

export class Items{
 constructor(scene,C,TR,fx){this.scene=scene;this.C=C;this.TR=TR;this.fx=fx;this.list=[];this.q={};}
 clear(){for(const p of this.list)this.scene.remove(p.m);this.list=[];}
 add(o){this.scene.add(o.m);this.list.push(o);return o;}
 ground(x,z,idx,plane,y){if(plane)return y;const q=query(this.C,x,z,idx,this.q);const on=Math.abs(q.u)<=q.w+.6&&!q.wet;return Math.max(on?q.roadY+q.rampH:this.TR.h(x,z),SEA);}
 ahead(r,rs){let best=null,bd=1e9;for(const o of rs){if(o===r||o.fin||o.rescueT>0)continue;const d=o.prog-r.prog;if(d>0&&d<bd){bd=d;best=o;}}return best;}
 use(r,rs,env){const it=r.item;if(!it)return;r.item=null;r.stats.items++;const plane=r.veh==='plane';const f=new V(Math.sin(r.yaw)*Math.cos(r.pitch),Math.sin(r.pitch),Math.cos(r.yaw)*Math.cos(r.pitch));
  if(it==='zip'){r.zipT=Math.max(r.zipT,1.3);env.sfx&&env.sfx('zip',r);}
  else if(it==='bubble'){r.shield=12;env.sfx&&env.sfx('bubble',r);}
  else if(it==='magnet'){r.magnetT=2.6;r.magTarget=this.ahead(r,rs);env.sfx&&env.sfx('magnet',r);}
  else if(it==='goo'){const m=gooMesh();const p=r.p.clone().addScaledVector(f,-3.2);p.y=this.ground(p.x,p.z,r.idx,plane,p.y);m.position.copy(p);if(plane)m.scale.setScalar(1.6);this.add({k:'goo',m,p,life:40,o:r,idx:r.idx,arm:.5,plane});env.sfx&&env.sfx('drop',r);}
  else if(it==='hornet'){const m=missileMesh();const p=r.p.clone().addScaledVector(f,2.5);p.y+=plane?0:.8;m.position.copy(p);this.add({k:'hornet',m,p,v:58+r.v*.5,yaw:r.yaw,pitch:r.pitch,life:7,o:r,idx:r.idx,target:this.ahead(r,rs),plane,arm:.25});env.sfx&&env.sfx('fire',r);}
  else if(it==='darts'){for(const a of[-.07,0,.07]){const m=new THREE.Mesh(new THREE.ConeGeometry(.28,1.4,8),mat(0xffb02a,{r:.3,m:.5,e:0xff6a00,ei:.5}));m.castShadow=true;const p=r.p.clone().addScaledVector(f,2.4);p.y+=plane?0:.7;m.position.copy(p);this.add({k:'dart',m,p,v:72+r.v*.6,yaw:r.yaw+a,pitch:r.pitch,life:2.2,o:r,idx:r.idx,plane,arm:.2});}env.sfx&&env.sfx('fire',r);}}
 hazard(kind,boss,target){const C=this.C,plane=boss.veh==='plane';
  if(kind==='boulder'||kind==='ice'){const m=new THREE.Mesh(kind==='ice'?new THREE.BoxGeometry(2.6,2.6,2.6):new THREE.DodecahedronGeometry(1.6,1),mat(kind==='ice'?0xa8e8ff:0x8a7a68,{r:kind==='ice'?.1:.9,flat:true,t:kind==='ice'?.85:0,e:kind==='ice'?0x2a6a9a:0,ei:.4}));m.castShadow=true;
   const p=boss.p.clone();p.x-=Math.sin(boss.yaw)*5;p.z-=Math.cos(boss.yaw)*5;m.position.copy(p);this.add({k:kind,m,p,idx:boss.idx,life:kind==='ice'?14:7,o:boss,u:(Math.random()-.5)*C.def.wd*1.2,arm:.4,roll:kind==='boulder'});}
  else if(kind==='fire'){const m=new THREE.Mesh(new THREE.SphereGeometry(1.4,12,10),new THREE.MeshBasicMaterial({color:0xff7a2a}));const p=boss.p.clone();m.position.copy(p);
   const tg=target?target.p.clone().add(new V(Math.sin(target.yaw)*18,0,Math.cos(target.yaw)*18)):p.clone();const dir=tg.sub(p).normalize();this.add({k:'fire',m,p,dir,v:34,life:3,o:boss,arm:.2,plane:true});}
  else if(kind==='bolt'&&target){const i=(target.idx+Math.round((12+target.v*.9)/C.B.step))%C.B.n;const q=at(C,i,target.q.u||0);const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,3,32),new THREE.MeshBasicMaterial({color:0xb8c8ff,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;q.y+=.2;ring.position.copy(q);
   this.add({k:'bolt',m:ring,p:q,life:1.6,o:boss,arm:1.1,strike:false});}}
 update(dt,rs,env){const C=this.C,out=[];
  for(const p of this.list){p.life-=dt;p.arm-=dt;
   if(p.k==='hornet'){const t=p.target&&!p.target.fin&&p.target.rescueT<=0?p.target:null;let wantYaw=p.yaw;
    if(t){const dx=t.p.x-p.p.x,dz=t.p.z-p.p.z;wantYaw=Math.atan2(dx,dz);if(p.plane)p.pitch+=(Math.atan2(t.p.y-p.p.y,Math.hypot(dx,dz))-p.pitch)*Math.min(1,dt*3);}
    else{const q=query(C,p.p.x,p.p.z,p.idx,this.q);p.idx=q.i;const a=at(C,q.i+6,0);wantYaw=Math.atan2(a.x-p.p.x,a.z-p.p.z);}
    p.yaw+=cl(wrapA(wantYaw-p.yaw),-3*dt,3*dt);p.p.x+=Math.sin(p.yaw)*Math.cos(p.pitch)*p.v*dt;p.p.z+=Math.cos(p.yaw)*Math.cos(p.pitch)*p.v*dt;
    if(p.plane)p.p.y+=Math.sin(p.pitch)*p.v*dt;else{const q=query(C,p.p.x,p.p.z,p.idx,this.q);p.idx=q.i;p.p.y=this.ground(p.p.x,p.p.z,p.idx,false)+.9;}
    p.m.position.copy(p.p);p.m.rotation.set(-p.pitch,p.yaw,p.life*12,'YXZ');this.fx.trail(p.p,0xff8a3a);}
   else if(p.k==='dart'){p.p.x+=Math.sin(p.yaw)*Math.cos(p.pitch)*p.v*dt;p.p.z+=Math.cos(p.yaw)*Math.cos(p.pitch)*p.v*dt;if(p.plane)p.p.y+=Math.sin(p.pitch)*p.v*dt;else{const q=query(C,p.p.x,p.p.z,p.idx,this.q);p.idx=q.i;p.p.y=this.ground(p.p.x,p.p.z,p.idx,false)+.7;}
    p.m.position.copy(p.p);p.m.rotation.set(Math.PI/2-p.pitch,p.yaw,0,'YXZ');}
   else if(p.k==='goo'){p.m.rotation.y+=dt;p.m.scale.y=(p.plane?1.6:1)*(1+Math.sin(p.life*6)*.1);}
   else if(p.k==='boulder'||p.k==='ice'){if(p.roll){p.idx=(p.idx-dt*9/C.B.step+C.B.n)%C.B.n;}const q=at(C,p.idx,p.u);p.p.x=q.x;p.p.z=q.z;p.p.y=Math.max(q.y,SEA)+(p.k==='ice'?1.3:1.6);p.m.position.copy(p.p);if(p.roll)p.m.rotation.x-=dt*6;}
   else if(p.k==='fire'){p.p.addScaledVector(p.dir,p.v*dt);p.m.position.copy(p.p);this.fx.trail(p.p,0xff5a10,2);}
   else if(p.k==='bolt'){p.m.material.opacity=.4+.4*Math.sin(p.life*30);if(p.arm<=0&&!p.strike){p.strike=true;this.fx.bolt(p.p);for(const r of rs)if(r!==p.o&&r.p.distanceTo(p.p)<4.2)hitRacer(r,env,'bolt');}}
   // collisions
   if(p.arm<=0&&p.k!=='bolt'){const rad=p.k==='goo'?(p.plane?3.2:1.9):p.k==='boulder'?2.6:p.k==='ice'?2.4:p.k==='fire'?2.6:1.7;
    for(const r of rs){if(r===p.o&&(p.k==='hornet'||p.k==='dart'||p.k==='fire'||p.k==='boulder'||p.k==='ice'))continue;if(r.rescueT>0)continue;if(r.p.distanceToSquared(p.p)<(rad+1)**2){const h=hitRacer(r,env,p.k);if(p.k!=='boulder'){p.life=0;}this.fx.boom(p.p,p.k);if(h&&p.o&&p.o!==r)p.o.stats.landed=(p.o.stats.landed||0)+1;break;}}}
   if(p.life>0)out.push(p);else this.scene.remove(p.m);}
  this.list=out;}}
