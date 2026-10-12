// NIGHTFALL — ROOK, the CPU survivor: keeps close, covers you, backs off from grabs, revives you when you go down.
import * as THREE from '../vendor/three.module.min.js';
import {buildHumanoid,outfit,hitSpheres} from './rig.js';
import {gunModel} from './weapons.js';
const V=THREE.Vector3,R=Math.random,TAU=Math.PI*2,cl=(v,a,b)=>v<a?a:v>b?b:v;
const angDiff=(a,b)=>((b-a+Math.PI*3)%TAU)-Math.PI;
export const ALLY_SKILL=[{acc:.75,rate:.21,react:.3},{acc:.6,rate:.26,react:.4},{acc:.5,rate:.3,react:.55}];

export class Ally{
 constructor(scene,pos){this.rig=buildHumanoid(outfit('ally'));this.root=this.rig.root;this.B=this.rig.bones;scene.add(this.root);
  this.gun=gunModel('ranger');this.gun.scale.setScalar(1.15);this.gun.rotation.y=Math.PI;this.gun.position.set(-.13,.08,.22);this.B.chest.add(this.gun);
  const fm=new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.2,1.2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});this.mflash=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),fm);this.mflash.visible=false;this.gun.add(this.mflash);this.mflash.position.copy(this.gun.userData.muzzle);
  this.name='ROOK';this.reset(pos);}
 reset(pos){this.pos=new V(pos.x,0,pos.z);this.vel=new V();this.yaw=Math.PI;this.aim=0;this.pitch=0;this.hpMax=150;this.hp=150;this.downed=false;this.dead=false;this.bleed=0;this.hurtT=9;this.fireT=0;this.target=null;this.thinkT=0;this.reviving=0;this.phase=0;this.flashT=0;this.root.visible=true;this.strafe=R()<.5?1:-1;this.strafeT=0;this.reactT=0;this.kills=0;this.revives=0;}
 spheres(){this.sph=hitSpheres(this.rig,this.sph);return this.sph;}
 update(dt,G){const P=G.player,map=G.map;if(this.dead){this.root.visible=false;return;}this.root.visible=true;
  if(this.downed){this.bleed-=dt;if(this.bleed<=0){this.dead=true;this.downed=false;G.onAllyDead&&G.onAllyDead();return;}this.vel.set(0,0,0);this.animate(dt,G);return;}
  this.hurtT+=dt;if(this.hurtT>4)this.hp=Math.min(this.hpMax,this.hp+dt*30);
  const sk=G.allySkill;
  // choose a target (zombies near the player first)
  this.thinkT-=dt;if(this.thinkT<=0){this.thinkT=.2;let best=null,bs=1e9;for(const z of G.zombies){if(!z.alive||z.state==='rise')continue;const d=Math.hypot(z.pos.x-this.pos.x,z.pos.z-this.pos.z);if(d>24)continue;
    const dp=Math.hypot(z.pos.x-P.pos.x,z.pos.z-P.pos.z);const sc=d*.7+dp*.6-(z.target===this?3:0)-(z.type==='boss'?2:0);if(sc>=bs)continue;const c=z.center(new V());if(!map.los(this.pos.x,1.45,this.pos.z,c.x,c.y,c.z))continue;bs=sc;best=z;}
   if(best!==this.target){this.target=best;this.reactT=sk.react*(.6+R()*.8);}}
  if(this.target&&!this.target.alive)this.target=null;
  // movement goals
  let mx=0,mz=0,spd=4.4;const dp=Math.hypot(P.pos.x-this.pos.x,P.pos.z-this.pos.z);let close=null,cd=1e9;for(const z of G.zombies){if(!z.alive||z.state==='rise'||z.win)continue;const d=Math.hypot(z.pos.x-this.pos.x,z.pos.z-this.pos.z);if(d<cd){cd=d;close=z;}}
  this.reviving=Math.max(0,this.reviving-(P.downed?0:dt));
  if(P.downed&&!P.dead){if(dp>1.1){if(map.descend(G.fieldP,this.pos.x,this.pos.z,this._d||(this._d={}))&&(this._d.x||this._d.z)){mx=this._d.x;mz=this._d.z;}else{mx=(P.pos.x-this.pos.x)/(dp||1);mz=(P.pos.z-this.pos.z)/(dp||1);}spd=5.2;this.reviving=0;}
   else if(!(close&&cd<1.6)){this.reviving+=dt;if(this.reviving>=G.reviveTime(true)){this.reviving=0;G.revivePlayer(this);this.revives++;}}}
  else if(close&&cd<2.6){const ax=this.pos.x-close.pos.x,az=this.pos.z-close.pos.z,al=Math.hypot(ax,az)||1;mx=ax/al*.85+(P.pos.x-this.pos.x)/(dp||1)*.3;mz=az/al*.85+(P.pos.z-this.pos.z)/(dp||1)*.3;spd=4.6;}
  else if(dp>6.5){if(map.descend(G.fieldP,this.pos.x,this.pos.z,this._d||(this._d={}))&&(this._d.x||this._d.z)){mx=this._d.x;mz=this._d.z;}else{mx=(P.pos.x-this.pos.x)/dp;mz=(P.pos.z-this.pos.z)/dp;}}
  else if(dp<1.8){mx=-(P.pos.x-this.pos.x)/(dp||1)*.6;mz=-(P.pos.z-this.pos.z)/(dp||1)*.6;spd=2.5;}
  else{this.strafeT-=dt;if(this.strafeT<=0){this.strafeT=1.5+R()*2;this.strafe=R()<.5?1:-1;if(R()<.3)this.strafe=0;}const tx=-(P.pos.z-this.pos.z)/dp,tz=(P.pos.x-this.pos.x)/dp;mx=tx*this.strafe*.35;mz=tz*this.strafe*.35;spd=2.2;}
  const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}this.vel.x+=(mx*spd-this.vel.x)*Math.min(1,dt*8);this.vel.z+=(mz*spd-this.vel.z)*Math.min(1,dt*8);this.pos.x+=this.vel.x*dt;this.pos.z+=this.vel.z*dt;map.collide(this.pos,.3);
  // aim + fire
  const t=this.target;let wantYaw=this.yaw;if(t){const c=t.center(new V());if(t.type!=='boss')c.y=t.pos.y+1.35*t.rig.scale;wantYaw=Math.atan2(c.x-this.pos.x,c.z-this.pos.z);this.pitch=Math.atan2(c.y-1.4,Math.hypot(c.x-this.pos.x,c.z-this.pos.z));}
  else if(Math.hypot(this.vel.x,this.vel.z)>.5)wantYaw=Math.atan2(this.vel.x,this.vel.z);else this.pitch*=.9;
  if(this.reviving>0)wantYaw=Math.atan2(P.pos.x-this.pos.x,P.pos.z-this.pos.z);
  const d=angDiff(this.yaw,wantYaw);this.yaw+=cl(d,-dt*7,dt*7);this.fireT-=dt;this.reactT-=dt;
  if(t&&this.reactT<=0&&Math.abs(d)<.25&&this.fireT<=0&&this.reviving<=0){this.fireT=sk.rate*(.85+R()*.3);this.fire(G,t,sk);}
  this.flashT-=dt;this.mflash.visible=this.flashT>0;this.animate(dt,G);}
 fire(G,t,sk){this.flashT=.05;this.mflash.scale.setScalar(.7+R()*.8);const mz=this.gun.userData.muzzle.clone();this.gun.localToWorld(mz);const c=t.center(new V());const dist=c.distanceTo(mz);
  const acc=sk.acc*cl(1.25-dist/30,.4,1.1);const hit=R()<acc;const head=hit&&R()<.22;const aim=head?t.head(new V()):c.clone().add(new V((R()-.5)*.3,(R()-.2)*.4,(R()-.5)*.3));if(!hit){aim.x+=(R()-.5)*1.4;aim.y+=(R()-.3)*1.2;aim.z+=(R()-.5)*1.4;}
  G.fx.streaks.fire(mz,aim,0xffd8a0,{speed:200,len:2.4,w:.016});G.fx.flash(mz,0xffb060,24,8,.06);G.snd&&G.snd.allyShot(mz);
  if(hit)G.allyHit(t,head?'head':'body',aim,this);else{const dir=aim.clone().sub(mz).normalize();const o=G.map.ray(mz.x,mz.y,mz.z,dir.x,dir.y,dir.z,40,{});if(o.t<40)G.fx.impact(mz.clone().addScaledVector(dir,o.t),new V(o.nx||0,o.ny||0,o.nz||0),o.kind);}}
 hurt(G,dmg){if(this.downed||this.dead)return;this.hp-=dmg;this.hurtT=0;if(this.hp<=0){this.hp=0;this.downed=true;this.bleed=30;this.reviving=0;G.onAllyDown&&G.onAllyDown();}}
 animate(dt,G){const B=this.B,rest=this.rig.rest;const sp=Math.hypot(this.vel.x,this.vel.z);this.phase+=dt*sp/1.7*TAU;const sn=Math.sin(this.phase),cs=Math.cos(this.phase);const mv=cl(sp/3,0,1);
  const k=Math.min(1,dt*12);const S=(b,x,y,z)=>{b.rotation.x+=(x-b.rotation.x)*k;b.rotation.y+=(y-b.rotation.y)*k;b.rotation.z+=(z-b.rotation.z)*k;};
  this.root.position.set(this.pos.x,0,this.pos.z);
  if(this.downed){this.root.rotation.y=this.yaw;B.hips.position.y+=(.32-B.hips.position.y)*k;S(B.hips,0,0,0);S(B.spine,-.55,0,.1);S(B.chest,-.2,0,0);S(B.head,.3,0,.15);S(B.thL,-1.45,0,.15);S(B.thR,-1.3,0,-.2);S(B.knL,.25,0,0);S(B.knR,.6,0,0);
   S(B.shL,.5,0,.5);S(B.elL,-.3,0,0);S(B.shR,-.9,0,-.4);S(B.elR,-1.4,0,0);return;}
  const kneel=this.reviving>0;const lean=.08+mv*.12;
  // movement relative to facing (backpedal / strafe)
  const fwd=Math.sin(this.yaw)*this.vel.x+Math.cos(this.yaw)*this.vel.z;const dir=fwd<-.3?-1:1;
  B.hips.position.y+=((kneel?.58:rest.hips.y-Math.abs(cs)*.04*mv)-B.hips.position.y)*k;this.root.rotation.y=this.yaw;
  S(B.hips,0,sn*.12*mv,0);S(B.spine,lean,0,0);S(B.chest,-this.pitch*.8,0,0);S(B.neck,0,0,0);S(B.head,-this.pitch*.3,0,0);
  if(kneel){S(B.thL,-1.5,0,.1);S(B.knL,1.55,0,0);S(B.thR,-.2,0,-.1);S(B.knR,2.0,0,0);S(B.ftL,0,0,0);S(B.ftR,.4,0,0);S(B.shL,-1.1,0,-.2);S(B.elL,-.6,0,0);}
  else{const A=.65*mv*dir;S(B.thL,-sn*A,0,.03);S(B.thR,sn*A,0,-.03);S(B.knL,.1+Math.max(0,cs*dir)*1.0*mv,0,0);S(B.knR,.1+Math.max(0,-cs*dir)*1.0*mv,0,0);S(B.ftL,0,0,0);S(B.ftR,0,0,0);
   S(B.shL,-1.25,0,-.5);S(B.elL,-.55,0,0);}
  S(B.shR,-.75,0,.55);S(B.elR,-1.45,0,0);}
}
