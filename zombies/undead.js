// NIGHTFALL — the undead: shamblers, sprinters, armoured ironclads and the Gravekeeper boss.
// Each is one skinned mesh with a procedural rig: limping walk, sprint, board-tearing, window climbing, swipes, flinches, falls and an ash dissolve.
import * as THREE from '../vendor/three.module.min.js';
import {buildHumanoid,outfit,hitSpheres} from './rig.js';
const V=THREE.Vector3,R=Math.random,TAU=Math.PI*2,cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const angDiff=(a,b)=>((b-a+Math.PI*3)%TAU)-Math.PI;

export const ZT={
 walker:{name:'SHAMBLER',r:.32,reach:1.25,dmg:1,atk:.95,hit:.48,tear:1.15},
 runner:{name:'SPRINTER',r:.3,reach:1.3,dmg:1,atk:.7,hit:.3,tear:.75},
 brute:{name:'IRONCLAD',r:.42,reach:1.45,dmg:1.6,atk:1.1,hit:.6,tear:.9},
 boss:{name:'THE GRAVEKEEPER',r:.85,reach:3.0,dmg:1,atk:1.7,hit:.95,tear:.3}};
let NID=0;const T0=new V(),T1=new V(),T2=new V();

export class Zombie{
 constructor(type,o,G){this.id=NID++;this.type=type;this.def=ZT[type];this.gait=o.gait??(type==='runner'?2:0);this.hpMax=this.hp=o.hp;this.speed=o.speed;this.dmg=o.dmg*this.def.dmg;
  const out=outfit(type==='walker'||type==='runner'?type:type);this.rig=buildHumanoid(out);this.root=this.rig.root;this.B=this.rig.bones;this.U=this.rig.U;
  this.pos=new V().copy(o.pos);this.vel=new V();this.yaw=o.yaw??R()*TAU;this.state=o.state||'rise';this.st=0;this.alive=true;this.deadT=0;this.win=o.win||null;this.phase=R()*TAU;this.flinch=0;this.flinchV=0;this.headSnap=0;this.flash=0;
  this.armStyle=R();this.limp=.5+R()*.5;this.tilt=(R()-.5)*.5;this.atkT=0;this.atkHit=false;this.target=null;this.losT=R()*.3;this.see=false;this.groanT=1+R()*5;this.tearT=0;this.wait=0;this.stuckT=0;this.lastPos=this.pos.clone();this.knock=new V();this.y=0;
  this.armor=null;if(type==='brute'){this.armor={helm:this.hpMax*.28,plate:this.hpMax*.4};this.addArmor();}
  if(type==='boss'){this.addBossGear();this.slamCd=3;this.chargeCd=6;this.charging=0;}
  this.root.position.copy(this.pos);this.root.rotation.y=this.yaw;if(this.state==='rise'){this.root.position.y=-1.8;}this.sph=null;}
 get r(){return this.def.r;}
 addArmor(){const M=new THREE.MeshStandardMaterial({color:0x5a5850,roughness:.45,metalness:.85});M.envMapIntensity=.6;const M2=new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:.3,metalness:.6});
  const helm=new THREE.Group();const hb=new THREE.Mesh(new THREE.BoxGeometry(.27,.3,.28),M);hb.position.set(0,.11,.02);helm.add(hb);const vis=new THREE.Mesh(new THREE.BoxGeometry(.2,.04,.02),new THREE.MeshBasicMaterial({color:new THREE.Color(3,1.1,.2)}));vis.position.set(0,.13,.165);helm.add(vis);
  const rim=new THREE.Mesh(new THREE.BoxGeometry(.29,.04,.3),M2);rim.position.set(0,-.03,.02);helm.add(rim);this.B.head.add(helm);
  const plate=new THREE.Group();const pf=new THREE.Mesh(new THREE.BoxGeometry(.46,.4,.06),M);pf.position.set(0,.1,.16);pf.rotation.x=-.08;plate.add(pf);const pb=pf.clone();pb.position.z=-.16;plate.add(pb);for(const s of[-1,1]){const st=new THREE.Mesh(new THREE.BoxGeometry(.05,.06,.34),M2);st.position.set(s*.16,.3,0);plate.add(st);}
  for(const s of[-1,1]){const pad=new THREE.Mesh(new THREE.SphereGeometry(.13,10,6,0,TAU,0,1.3),M);pad.position.set(s*.24,.22,0);pad.rotation.z=s*-.5;plate.add(pad);}this.B.chest.add(plate);
  for(const m of[helm,plate])m.traverse(o=>{if(o.isMesh){o.castShadow=true;}});this.helm=helm;this.plate=plate;}
 addBossGear(){const wood=new THREE.MeshStandardMaterial({color:0x4a3220,roughness:.7}),iron=new THREE.MeshStandardMaterial({color:0x3a3a3a,roughness:.4,metalness:.9});
  const sh=new THREE.Group();const handle=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.3,8),wood);handle.position.y=-.35;sh.add(handle);const blade=new THREE.Mesh(new THREE.BoxGeometry(.26,.32,.03),iron);blade.position.y=-1.08;sh.add(blade);sh.rotation.x=1.2;sh.position.set(0,-.08,0);this.B.haR.add(sh);this.shovel=sh;
  const ln=new THREE.Group();const cage=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,.16,8,1,true),iron);ln.add(cage);const glass=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2,.6)}));ln.add(glass);
  const hook=new THREE.Mesh(new THREE.TorusGeometry(.04,.008,6,12),iron);hook.position.y=.12;ln.add(hook);ln.position.set(0,-.22,0);this.B.haL.add(ln);this.lantern=ln;sh.traverse(o=>o.isMesh&&(o.castShadow=true));}
 spheres(){this.sph=hitSpheres(this.rig,this.sph);return this.sph;}
 center(out=new V()){const s=this.rig.scale;return out.set(this.pos.x,this.pos.y+1.15*s,this.pos.z);}
 head(out=new V()){const s=this.rig.scale;return out.set(this.pos.x,this.pos.y+1.65*s,this.pos.z);}
 // returns {dmg applied, killed, armorHit}
 damage(G,amt,part,kind,dir){if(!this.alive)return{killed:false};let armorHit=null;
  if(this.armor&&kind!=='splash'&&kind!=='volt'&&kind!=='nuke'){if(part==='head'&&this.armor.helm>0){this.armor.helm-=amt;armorHit='helm';amt*=.15;if(this.armor.helm<=0)this.dropArmor(G,'helm',dir);}
   else if(part==='body'&&this.armor.plate>0){this.armor.plate-=amt;armorHit='plate';amt*=.25;if(this.armor.plate<=0)this.dropArmor(G,'plate',dir);}}
  if(kind==='insta'&&this.type!=='boss')amt=this.hp+1;else if(kind==='insta')amt=Math.max(amt,this.hpMax*.06);
  this.hp-=amt;this.flash=.12;this.flinchV-=Math.min(3.5,amt/this.hpMax*14+(part==='head'?2:.6))*(this.type==='boss'?.2:1);if(part==='head')this.headSnap=1;
  if(dir&&this.type!=='boss'){this.knock.x+=dir.x*Math.min(2.5,amt/this.hpMax*4);this.knock.z+=dir.z*Math.min(2.5,amt/this.hpMax*4);}
  if(this.hp<=0){this.die(G,kind,part,dir);return{killed:true,armorHit,amt};}
  if(this.type==='boss'&&!this.enraged&&this.hp<this.hpMax*.4){this.enraged=true;G.onBossEnrage&&G.onBossEnrage(this);}
  return{killed:false,armorHit,amt};}
 dropArmor(G,which,dir){const m=which==='helm'?this.helm:this.plate;if(!m)return;const d=dir||new V(0,0,1);G.fx.debris.add(m,new V(d.x*3+(R()-.5)*2,3+R()*2,d.z*3+(R()-.5)*2),new V(R()*12,R()*12,R()*12),3,{r:.1});
  G.fx.sparks.burst(this.head(T0),20,6,[new THREE.Color(3,2.4,1.4),new THREE.Color(2.4,1.2,.3)],.05,.4,{grav:9});G.snd&&G.snd.clang(this.pos);if(which==='helm')this.helm=null;else this.plate=null;
  if(!this.helm&&!this.plate){this.enraged=true;}}
 die(G,kind,part,dir){if(!this.alive)return;this.alive=false;this.hp=0;this.state='dead';this.deadT=0;this.fallDir=R()<.6?-1:1;if(dir){const fwd=Math.sin(this.yaw)*dir.x+Math.cos(this.yaw)*dir.z;this.fallDir=fwd>0?-1:1;}
  if(this.win&&this.win.busy===this)this.win.busy=null;this.killKind=kind;this.killPart=part;G.onZombieDeath&&G.onZombieDeath(this,kind,part);}

 /* ------------------------------ AI ------------------------------ */
 update(dt,G){this.st+=dt;this.flash=Math.max(0,this.flash-dt);this.U.uFlash.value=this.flash>0?this.flash*3.5:0;
  // flinch spring
  this.flinchV+=(-this.flinch*90-this.flinchV*11)*dt;this.flinch+=this.flinchV*dt;this.headSnap=Math.max(0,this.headSnap-dt*4);
  if(!this.alive){this.deadT+=dt;this.animDeath(dt,G);return;}
  const map=G.map;const s=this.state;let mx=0,mz=0,spd=this.speed*(this.enraged&&this.type!=='boss'?1.7:1)*(G.speedMul||1);
  this.groanT-=dt;if(this.groanT<=0){this.groanT=(this.gait===2?2:3.5)+R()*5;G.snd&&G.snd.groan(this.pos,this.type,this.gait);}
  if(s==='rise'){const k=Math.min(1,this.st/1.5);this.root.position.y=-1.8*(1-k*k*(3-2*k));if(this.st<1.3&&R()<.3)G.fx.dirt(T0.set(this.pos.x,0,this.pos.z),2);if(k>=1){this.root.position.y=0;this.state=this.win?'approach':'chase';this.st=0;}}
  else if(s==='approach'){const w=this.win;const dx=w.outPos.x-this.pos.x,dz=w.outPos.z-this.pos.z,d=Math.hypot(dx,dz);
   if(d<.45&&(!w.busy||w.busy===this||!w.busy.alive)){w.busy=this;this.state=w.boards>0?'tear':'climb';this.st=0;this.tearT=this.def.tear*.6;}
   else{if(w.busy&&w.busy!==this&&w.busy.alive&&d<1.6){this.wait+=dt;mx=0;mz=0;this.face(w.inPos.x,w.inPos.z,dt,4);}else if(map.descend(w.field,this.pos.x,this.pos.z,T1)&&(T1.x||T1.z)){mx=T1.x;mz=T1.z;}else if(d>.01){mx=dx/d;mz=dz/d;}}
   if(this.gait===0)spd*=.85;}
  else if(s==='tear'){const w=this.win;this.face(w.inPos.x,w.inPos.z,dt,6);this.pos.x+=(w.outPos.x-this.pos.x)*Math.min(1,dt*4);this.pos.z+=(w.outPos.z-this.pos.z)*Math.min(1,dt*4);
   // swipe through the window at anyone standing at it
   const tg=this.pickTarget(G);if(tg&&Math.hypot(tg.pos.x-w.inPos.x,tg.pos.z-w.inPos.z)<1.25&&this.atkT<=0&&!tg.downed){this.state='attack';this.st=0;this.atkHit=false;this.target=tg;this.atkFrom='tear';}
   else{this.tearT-=dt;if(this.tearT<=0){if(w.boards>0){G.tearBoard(w,this);this.tearT=this.def.tear*(this.gait===2?.8:1)*(.85+R()*.3);this.pull=1;}if(w.boards<=0){this.state='climb';this.st=0;}}}}
  else if(s==='climb'){const w=this.win;const dur=this.type==='brute'?1.4:this.gait===2?.8:1.15;const k=Math.min(1,this.st/dur);const e=k*k*(3-2*k);
   this.pos.x=lerp(w.outPos.x,w.inPos.x,e);this.pos.z=lerp(w.outPos.z,w.inPos.z,e);this.y=Math.sin(k*Math.PI)*.75;this.face(w.inPos.x,w.inPos.z,dt,8);
   if(w.boards>0&&k<.35){this.state='tear';this.st=0;this.y=0;}else if(k>=1){this.y=0;this.state='chase';this.st=0;if(w.busy===this)w.busy=null;this.win=null;G.fx.dirt(T0.set(this.pos.x,.1,this.pos.z),4);}}
  else if(s==='chase'){const tg=this.pickTarget(G);this.target=tg;
   if(tg){const dx=tg.pos.x-this.pos.x,dz=tg.pos.z-this.pos.z,d=Math.hypot(dx,dz);this.losT-=dt;if(this.losT<=0){this.losT=.25+R()*.15;this.see=d<10&&map.los(this.pos.x,1.5,this.pos.z,tg.pos.x,1.2,tg.pos.z);}
    if(this.type==='boss')this.bossThink(dt,G,tg,d);
    if(d<this.def.reach*(this.type==='boss'?1:.92)&&this.atkT<=0&&!tg.downed&&Math.abs(angDiff(this.yaw,Math.atan2(dx,dz)))<.9&&(this.type!=='boss'||!this.charging)){this.state='attack';this.st=0;this.atkHit=false;this.atkFrom='chase';}
    else if(this.charging>0){mx=Math.sin(this.yaw);mz=Math.cos(this.yaw);spd=6.2;}
    else if(this.see||d<1.5){mx=dx/(d||1);mz=dz/(d||1);}
    else{const f=tg===G.player?G.fieldP:G.fieldA;if(f&&map.descend(f,this.pos.x,this.pos.z,T1)&&(T1.x||T1.z)){mx=T1.x;mz=T1.z;}else{mx=dx/(d||1);mz=dz/(d||1);}}
    if(d<this.def.reach*.6&&!tg.downed){mx*=.1;mz*=.1;}}
   else{this.wanderT=(this.wanderT||0)-dt;if(this.wanderT<=0){this.wanderT=2+R()*3;this.wa=R()*TAU;}mx=Math.sin(this.wa)*.4;mz=Math.cos(this.wa)*.4;}}
  else if(s==='attack'){const D=this.def;const tg=this.target;if(tg)this.face(tg.pos.x,tg.pos.z,dt,this.type==='boss'?2.5:7);const hitAt=D.hit*(this.gait===2?.85:1),dur=D.atk*(this.gait===2?.85:1);
   if(!this.atkHit&&this.st>=hitAt){this.atkHit=true;if(this.type==='boss'){G.bossSlam(this);}
    else if(tg&&!tg.downed){const dx=tg.pos.x-this.pos.x,dz=tg.pos.z-this.pos.z,d=Math.hypot(dx,dz);const reach=this.atkFrom==='tear'?2.1:D.reach*1.3;if(d<reach&&Math.abs(angDiff(this.yaw,Math.atan2(dx,dz)))<1.3)G.hurt(tg,this.dmg,this);else G.snd&&G.snd.whiff(this.pos);}}
   if(this.atkFrom!=='tear'&&this.st<hitAt+.1&&this.type!=='boss'){mx=Math.sin(this.yaw)*.35;mz=Math.cos(this.yaw)*.35;}
   if(this.st>=dur){this.atkT=this.type==='boss'?1.2:.15+R()*.25;this.state=this.atkFrom==='tear'&&this.win?'tear':'chase';this.st=0;}}
  this.atkT=Math.max(0,this.atkT-dt);
  // integrate
  const acc=this.gait===2||this.charging>0?10:6;this.vel.x+=(mx*spd-this.vel.x)*Math.min(1,dt*acc);this.vel.z+=(mz*spd-this.vel.z)*Math.min(1,dt*acc);
  if(s!=='climb'&&s!=='rise'){this.pos.x+=(this.vel.x+this.knock.x)*dt;this.pos.z+=(this.vel.z+this.knock.z)*dt;this.knock.multiplyScalar(Math.exp(-dt*6));
   if(s!=='tear'&&s!=='approach'||!this.win)map.collide(this.pos,this.def.r);else this.collideOutside(map);
   const v=Math.hypot(this.vel.x,this.vel.z);if(v>.2&&s!=='attack'&&s!=='tear')this.face(this.pos.x+this.vel.x,this.pos.z+this.vel.z,dt,this.gait===2?9:5);
   // stuck detection: nudge sideways
   this.stuckT+=dt;if(this.stuckT>1.2){this.stuckT=0;if(this.lastPos.distanceTo(this.pos)<.25&&(s==='chase'||s==='approach')&&v>.1){this.knock.x+=(R()-.5)*3;this.knock.z+=(R()-.5)*3;}this.lastPos.copy(this.pos);}}
  if(this.charging>0){this.charging-=dt;if(map.blocked(Math.floor(this.pos.x+Math.sin(this.yaw)*1.2),Math.floor(this.pos.z+Math.cos(this.yaw)*1.2)))this.charging=0;}
  this.root.position.set(this.pos.x,(s==='rise'?this.root.position.y:this.y),this.pos.z);this.root.rotation.y=this.yaw;
  this.anim(dt,G);}
 collideOutside(map){// outside the walls: only walls/trees block (window tiles too)
  map.collide(this.pos,this.def.r);}
 face(tx,tz,dt,rate){const want=Math.atan2(tx-this.pos.x,tz-this.pos.z);const d=angDiff(this.yaw,want);this.yaw+=cl(d,-rate*dt,rate*dt);}
 pickTarget(G){let best=null,bd=1e9;for(const t of G.targets()){if(!t||t.downed||t.dead)continue;let d;const f=t===G.player?G.fieldP:G.fieldA;const i=G.map.idx(this.pos.x,this.pos.z);d=f&&i>=0&&f[i]>=0?f[i]*.5:Math.hypot(t.pos.x-this.pos.x,t.pos.z-this.pos.z)*1.4+(this.win?50:0);if(t===G.player)d-=1.5;if(d<bd){bd=d;best=t;}}return best;}
 bossThink(dt,G,tg,d){this.slamCd-=dt;this.chargeCd-=dt;if(this.charging>0)return;
  if(this.chargeCd<=0&&d>7&&this.see){this.charging=1.6;this.chargeCd=(this.enraged?5:8)+R()*2;this.face(tg.pos.x,tg.pos.z,1,99);G.snd&&G.snd.bossRoar(this.pos);}}

 /* ------------------------------ animation ------------------------------ */
 anim(dt,G){const B=this.B,s=this.state,rest=this.rig.rest;const sp=Math.hypot(this.vel.x,this.vel.z);const run=this.gait===2||this.charging>0;const brute=this.type==='brute'||this.type==='boss';
  const stride=(run?2.3:this.gait===1?1.7:1.25)*this.rig.scale;this.phase+=dt*Math.max(s==='tear'||s==='attack'?0:.4,sp)/stride*TAU*(s==='approach'||s==='chase'?1:.0);
  const ph=this.phase,sn=Math.sin(ph),cs=Math.cos(ph);const mv=cl(sp/(this.speed*.6+.01),0,1);
  // defaults: zombie lurch
  let lean=run?.48:brute?.22:.3,hipY=0,hipZ=sn*.07*mv,hipYaw=sn*.12*mv;let shL=-1.25,shR=-1.15,elL=-.25,elR=-.3,szL=.12,szR=-.12,headX=.15+this.tilt*.2,headZ=this.tilt+Math.sin(ph*.5)*.1,jaw=.15+Math.max(0,Math.sin(this.st*7+this.id))*.12;
  const A=run?.95:this.gait===1?.7:.48;let thL=-sn*A*mv,thR=sn*A*mv*(this.gait===0?this.limp:1),knL=.12+Math.max(0,cs)*A*1.3*mv,knR=.12+Math.max(0,-cs)*A*1.3*mv*(this.gait===0?.6:1),ftL=0,ftR=0;
  hipY=-Math.abs(cs)*(run?.06:.035)*mv;
  if(this.armStyle<.25&&!run){shR=-.15+sn*.15;elR=-.1;szR=-.05;}else if(this.armStyle>.85&&!run){shL=-.2-sn*.12;elL=-.15;}
  if(run){shL=-.9-sn*.7;shR=-.9+sn*.7;elL=-.9;elR=-.9;szL=.2;szR=-.2;jaw=.35;}
  if(this.type==='boss'){shL=-.5+sn*.15;elL=-.6;szL=.25;shR=-.35-sn*.12;elR=-.4;lean=.18;jaw=.05;}
  if(s==='tear'||s==='approach'&&this.wait>0&&sp<.2){const p=this.pull=Math.max(0,(this.pull||0)-dt*2.2);const reach=Math.sin(this.st*5+this.id)*.25;shL=-1.55+p*1.1+reach;shR=-1.5+p*1.0-reach;elL=-.2-p*.9;elR=-.25-p*.8;lean=.45-p*.35;jaw=.4;thL=-.1;thR=.15;knL=.2;knR=.25;}
  if(s==='climb'){const k=Math.min(1,this.st/(this.type==='brute'?1.4:this.gait===2?.8:1.15));lean=.7*Math.sin(k*Math.PI)+.2;thL=-1.3*Math.sin(Math.min(1,k*2)*Math.PI);thR=-1.2*Math.sin(cl(k*2-.6,0,1)*Math.PI);knL=1.6*Math.sin(Math.min(1,k*2)*Math.PI);knR=1.4*Math.sin(cl(k*2-.6,0,1)*Math.PI);shL=shR=-1.9+k*.6;elL=elR=-.3;}
  if(s==='attack'){const D=this.def,hitAt=D.hit*(this.gait===2?.85:1),dur=D.atk*(this.gait===2?.85:1);const t=this.st;
   if(this.type==='boss'){const up=cl(t/hitAt,0,1),down=cl((t-hitAt)/.15,0,1),rec=cl((t-hitAt-.15)/(dur-hitAt-.15),0,1);shR=-2.8*up+2.3*down*(1-rec)-.4*rec;elR=-.6*up;lean=-.15*up+.55*down*(1-rec);shL=-.4-up*.6;jaw=.4*up;}
   else{const up=cl(t/hitAt,0,1),dn=cl((t-hitAt)/.14,0,1),rec=cl((t-hitAt-.14)/Math.max(.1,dur-hitAt-.14),0,1);const sw=-2.5*up+(1.7*dn)*(1-rec)+(-1.2)*rec*0;
    shL=lerp(lerp(-1.2,-2.6,up),-.9,dn);shR=lerp(lerp(-1.1,-2.5,up),-.8,dn);if(rec>0){shL=lerp(shL,-1.2,rec);shR=lerp(shR,-1.1,rec);}elL=elR=-.2-up*.5+dn*.4;lean=lerp(lerp(.25,-.05,up),.65,dn*(1-rec))+.2*rec;jaw=.2+up*.5;szL=.25*up;szR=-.25*up;thL=-.4*dn*(1-rec);knL=.3*dn;void sw;}}
  // flinch + head snap
  lean+=this.flinch;headX-=this.headSnap*.9;
  const k=Math.min(1,dt*14);const S=(b,x,y,z)=>{b.rotation.x+=(x-b.rotation.x)*k;b.rotation.y+=(y-b.rotation.y)*k;b.rotation.z+=(z-b.rotation.z)*k;};
  B.hips.position.y=rest.hips.y+hipY;S(B.hips,0,hipYaw,hipZ);S(B.spine,lean*.55,-hipYaw*.6,-hipZ*.6);S(B.chest,lean*.45,-hipYaw*.5,0);S(B.neck,-lean*.4+.05,0,0);S(B.head,headX,0,headZ);B.jaw.rotation.x+=(jaw-B.jaw.rotation.x)*k;
  S(B.shL,shL,0,szL);S(B.shR,shR,0,szR);S(B.elL,elL,0,0);S(B.elR,elR,0,0);S(B.thL,thL,0,.04);S(B.thR,thR,0,-.04);S(B.knL,knL,0,0);S(B.knR,knR,0,0);S(B.ftL,ftL-knL*.3,0,0);S(B.ftR,ftR-knR*.3,0,0);
  if(this.lantern){this.lantern.rotation.x=Math.sin(this.st*3)*.3;}}
 animDeath(dt,G){const B=this.B,t=this.deadT;const fall=Math.min(1,t/.65),e=fall*fall;
  // buckle then topple
  const k=Math.min(1,dt*10);B.knL.rotation.x+=(1.2*Math.min(1,t*4)-B.knL.rotation.x)*k;B.knR.rotation.x+=(1.0*Math.min(1,t*4)-B.knR.rotation.x)*k;B.thL.rotation.x+=(-.6-B.thL.rotation.x)*k;B.thR.rotation.x+=(-.3-B.thR.rotation.x)*k;
  B.shL.rotation.x+=((this.fallDir<0?-2.6:-.4)-B.shL.rotation.x)*k*.6;B.shR.rotation.x+=((this.fallDir<0?-2.4:.3)-B.shR.rotation.x)*k*.6;B.head.rotation.x+=(this.fallDir*.4-B.head.rotation.x)*k;B.jaw.rotation.x+=(.5-B.jaw.rotation.x)*k;
  this.root.rotation.order='YXZ';this.root.rotation.x=this.fallDir*-1.45*e;this.root.position.y=Math.max(0,this.y*(1-fall))+(.18*this.rig.scale)*e;
  const D=.9;if(t>D){const d=Math.min(1,(t-D)/1.3);this.U.uDis.value=d;if(!this.crumbled){this.crumbled=true;G.fx.crumble(this.pos,1.8*this.rig.scale*.6);}if(R()<.5)G.fx.smoke.emit(this.pos.x+(R()-.5)*.8,.2+R()*.4,this.pos.z+(R()-.5)*.8,(R()-.5)*.3,.3+R()*.4,(R()-.5)*.3,.3,.29,.28,.25,1.2,-.2,1,.3,.5);}
  if(t>D+1.35)this.gone=true;}
 dispose(){this.rig.mesh.geometry.dispose();this.rig.mat.dispose();}
}
