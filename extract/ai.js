// EXFIL — CPU raiders + patrol squads: patrol routes, sight + hearing, cover, peeking, suppression, flanking, reloading, healing, looting bodies.
import * as THREE from '../vendor/three.module.min.js';
import {WPN,ITEMS,AMMO,wstats} from './data.js';
import {POI} from './map.js';
const V=THREE.Vector3,R=Math.random,TAU=Math.PI*2;
const wrap=a=>{while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a;};
export const BOT_HP={head:35,thorax:85,stomach:70,arm:120,leg:130};
export const hostile=(a,b)=>a!==b&&a.fac!==b.fac;

export class Bot{
 constructor(G,o){this.G=G;Object.assign(this,o);this.pos=o.pos.clone();this.vel=new V();this.yaw=o.yaw??R()*TAU;this.pitch=0;this.crouchV=0;this.crouch=0;this.leanV=0;this.lean=0;this.alive=true;this.onGround=true;
  this.hp={...BOT_HP};this.state='patrol';this.alert=0;this.det=0;this.target=null;this.seen=false;this.seenT=-99;this.lastSeen=new V();this.spotT=0;this.react=0;this.path=null;this.pi=0;this.repathT=0;this.goal=null;this.idleT=R()*3;
  this.thinkT=R()*.3;this.fireT=0;this.burst=0;this.burstGap=0;this.reloadT=0;this.cover=null;this.coverT=0;this.peekT=0;this.peeking=false;this.suppress=0;this.aimErr=.3;this.aimYaw=this.yaw;this.flank=null;this.lootT=0;this.lootBody=null;
  this.stuckT=0;this.lastP=this.pos.clone();this.voiceT=3+R()*10;this.healT=0;this.healed=0;this.investT=0;this.mode='walk';this.lookT=0;this.lookYaw=this.yaw;this.kills=0;this.st=this.weapon?wstats(this.weapon):null;this.eyeV=new V();this._v=new V();this._w=new V();
  this.mag=this.weapon?this.weapon.ammo:0;this.spd=0;}
 get eye(){return this.eyeV.set(this.pos.x,this.pos.y+1.6-this.crouchV*.55,this.pos.z);}
 aimPoint(out,head){const s=1-this.crouchV*.36;return out.set(this.pos.x,this.pos.y+(head?1.63:1.25)*s,this.pos.z);}
 total(){return this.hp.head+this.hp.thorax+this.hp.stomach+this.hp.arm+this.hp.leg;}
 /* ---------- perception ---------- */
 canSee(t,maxR){const G=this.G,e=this.eye,tp=t.aimPoint(this._v,false);const dx=tp.x-e.x,dz=tp.z-e.z,d=Math.hypot(dx,dz);if(d>maxR)return false;
  const fov=this.state==='combat'||this.alert>.6?2.4:1.9;const ang=Math.abs(wrap(Math.atan2(dx,dz)-this.yaw));if(ang>fov/2&&d>4)return false;
  if(G.W.los(e.x,e.y,e.z,tp.x,tp.y,tp.z))return true;const hp=t.aimPoint(this._w,true);return G.W.los(e.x,e.y,e.z,hp.x,hp.y,hp.z);}
 hear(n){if(this.state==='combat'&&this.seen)return;const d=this.pos.distanceTo(n.p);if(d>n.r*this.G.diff.hear)return;if(n.src&&!hostile(this,n.src))return;
  if(n.kind==='shot'&&n.src&&this.state==='combat'){this.lastSeen.copy(n.p);this.seenT=Math.max(this.seenT,this.G.time-4);return;}
  if(this.state==='combat'&&this.G.time-this.seenT<6)return;
  this.state='investigate';this.alert=Math.min(1,this.alert+(n.kind==='shot'?.6:.3));this.investP=n.p.clone().add(new V((R()-.5)*n.r*.15,0,(R()-.5)*n.r*.15));this.investT=0;this.mode=n.kind==='shot'?'run':'walk';this.setGoal(this.investP);
  if(n.kind==='shot'&&n.src&&n.src.fac)this.heardSrc=n.src;this.yell();}
 yell(){if(this.voiceT<2)return;this.voiceT=0;if(this.fac==='patrol')this.G.snd.radio(this.pos);else this.G.snd.voice(this.pos,this.fac);}
 /* ---------- navigation ---------- */
 setGoal(p,force){if(!force&&this.goal&&this.goal.distanceTo(p)<1.5&&this.path)return;this.goal=p.clone?p.clone():new V(p[0],p[1],p[2]);this.path=null;this.pi=0;this.repathT=0;}
 follow(dt,speed){if(!this.goal)return false;if(!this.path){if(this.repathT>0)return false;const p=this.G.nav.path(this.pos.x,this.pos.z,this.goal.x,this.goal.z);this.repathT=.6+R()*.4;if(!p){this.goal=null;return false;}this.path=p;this.pi=0;}
  const w=this.path[this.pi];if(!w){this.path=null;this.goal=null;return false;}const dx=w[0]-this.pos.x,dz=w[2]-this.pos.z,d=Math.hypot(dx,dz);
  if(d<.6){this.pi++;if(this.pi>=this.path.length){this.path=null;this.goal=null;return false;}return true;}
  this.vel.x=dx/d*speed;this.vel.z=dz/d*speed;this.moveYaw=Math.atan2(dx,dz);return true;}
 /* ---------- cover ---------- */
 findCover(from){const G=this.G;let best=null,bs=-1e9;const pref=this.prefRange();const n=G.lowCpu?8:14;
  for(let k=0;k<n;k++){const a=R()*TAU,r=2.5+R()*12;const c=G.nav.randomNear(this.pos.x+Math.cos(a)*r,this.pos.z+Math.sin(a)*r,1.5);if(!c)continue;const cx=c[0],cy=c[1],cz=c[2];
   const lowBlocked=!G.W.los(from.x,from.y,from.z,cx,cy+.95,cz);if(!lowBlocked)continue;const peek=G.W.los(from.x,from.y,from.z,cx,cy+1.6,cz);const dT=Math.hypot(cx-from.x,cz-from.z);
   const s=(peek?1.2:0)-Math.hypot(cx-this.pos.x,cz-this.pos.z)*.06-Math.abs(dT-pref)*.03-(dT<5?2:0);if(s>bs){bs=s;best={x:cx,y:cy,z:cz,peek};}}
  return best;}
 prefRange(){const c=this.st?this.st.cls:'PISTOL';return c==='SHOTGUN'?9:c==='PISTOL'?14:c==='SMG'?16:c==='MARKSMAN'?45:28;}
 /* ---------- think (throttled) ---------- */
 think(dt){const G=this.G,D=G.diff;
  // targets
  const range=Math.min(D.view,G.visRange)*(this.alert>.5?1.15:1);let best=null,bd=1e9;
  for(const t of G.targets){if(!t.alive||!hostile(this,t))continue;const d=this.pos.distanceTo(t.pos);if(d>range*1.2||d>bd||!t.isPlayer&&(t!==this.target||d>40))continue;
   let r=range;if(t.isPlayer){r*=t.crouchV>.5?.72:1;if(t.light)r*=1.4;}if(this.canSee(t,r)){bd=d;best=t;}}
  if(best){const t=best;if(t.isPlayer&&this.target!==t){const d=bd;const moving=t.speed>.5?1.4:.8;const rate=(2.4/(1+d/10))*moving*(t.crouchV>.5?.6:1)*(this.alert>.5?2.2:1)*(d<6?6:1);this.det+=rate*this.thinkDt;if(this.det<1){this.yawTo(t.pos,.6);return;}}
   if(this.target!==t||!this.seen){if(this.state!=='combat'||G.time-this.seenT>2){this.react=D.react*(.75+R()*.6)*(this.alert>.6?.7:1);this.aimErr=.16+(1-D.acc)*.25;}this.yell();}
   this.target=t;this.seen=true;this.seenT=G.time;this.lastSeen.copy(t.pos);this.state='combat';this.alert=1;this.det=1;
   for(const m of G.bots)if(m!==this&&m.alive&&m.squad&&m.squad===this.squad&&m.state!=='combat'){m.state='combat';m.target=t;m.lastSeen.copy(t.pos);m.seenT=G.time-1.5;m.alert=1;m.react=D.react;}}
  else{this.seen=false;this.det=Math.max(0,this.det-this.thinkDt*.4);}
  if(this.state==='combat'){if(!this.target||!this.target.alive||G.time-this.seenT>22){this.state='patrol';this.target=null;this.cover=null;this.flank=null;this.goal=null;this.alert=.7;}}}
 yawTo(p,k){const a=Math.atan2(p.x-this.pos.x,p.z-this.pos.z);this.aimYaw=a;}
 /* ---------- per-frame update ---------- */
 update(dt){const G=this.G,D=G.diff;if(!this.alive){this.rig.update(dt,{dead:true});return;}
  this.voiceT+=dt;this.thinkT-=dt;if(this.thinkT<=0){this.thinkDt=.2+R()*.08;this.thinkT=this.thinkDt;this.think(dt);}
  this.suppress=Math.max(0,this.suppress-dt*.6);this.repathT-=dt;this.vel.x=0;this.vel.z=0;let speed=0;this.crouch=0;this.lean=0;let fireOK=false,aimAt=null;
  const runS=4.4*this.spdMul,walkS=1.9*this.spdMul,legF=this.hp.leg<=0?.55:1;
  if(this.reloadT>0){this.reloadT-=dt;if(this.reloadT<=0)this.finishReload();}
  if(this.healT>0){this.healT-=dt;if(this.healT<=0){this.hp.thorax=Math.min(BOT_HP.thorax,this.hp.thorax+35);this.hp.stomach=Math.min(BOT_HP.stomach,this.hp.stomach+30);this.hp.leg=Math.max(this.hp.leg,30);this.healed++;}}
  if(this.state==='patrol'||this.state==='loot'){this.patrol(dt);speed=this.mode==='run'?runS:walkS;}
  else if(this.state==='investigate'){this.investT+=dt;speed=this.mode==='run'?runS:walkS*.9;if(!this.follow(dt,speed)){this.lookAround(dt);if(this.investT>7+R()*4){this.state='patrol';this.goal=null;this.mode='walk';}}else this.aimYaw=this.moveYaw;}
  else if(this.state==='combat'){const t=this.target;const vis=this.seen&&G.time-this.seenT<.35;const d=this.pos.distanceTo(t?t.pos:this.lastSeen);
   this.coverT-=dt;this.peekT-=dt;
   const lowHp=this.hp.thorax<35||this.total()<170;
   if(this.mag<=0&&this.reloadT<=0&&this.weapon)this.startReload();
   // decide movement goal
   if(this.coverT<=0){this.coverT=2.4+R()*2.5;const from=t?t.aimPoint(new V(),false):this.lastSeen.clone().setY(this.lastSeen.y+1.4);
    const aggressive=this.st&&(this.st.cls==='SHOTGUN'||this.st.cls==='SMG')&&this.fac==='drifter';
    if(lowHp&&this.healed<2&&!vis){this.cover=this.findCover(from);if(this.cover){this.setGoal(new V(this.cover.x,this.cover.y,this.cover.z),true);this.wantHeal=true;}}
    else if(!vis&&G.time-this.seenT>3&&!this.flank&&this.squad&&R()<D.flank){const a=Math.atan2(this.pos.x-this.lastSeen.x,this.pos.z-this.lastSeen.z)+(R()<.5?1:-1)*(1.1+R()*.6);const f=G.nav.randomNear(this.lastSeen.x+Math.sin(a)*12,this.lastSeen.z+Math.cos(a)*12,4);if(f){this.flank=new V(f[0],f[1],f[2]);this.setGoal(this.flank,true);this.cover=null;}}
    else if(!vis&&G.time-this.seenT>4.5){this.setGoal(this.lastSeen.clone().add(new V((R()-.5)*4,0,(R()-.5)*4)),true);this.cover=null;}
    else if(vis&&(aggressive&&d>7||d>this.prefRange()*1.8)){const c=this.findCover(from);if(c&&Math.hypot(c.x-t.pos.x,c.z-t.pos.z)<d){this.cover=c;this.setGoal(new V(c.x,c.y,c.z),true);}else{const n=G.nav.randomNear(this.pos.x+(t.pos.x-this.pos.x)*.3,this.pos.z+(t.pos.z-this.pos.z)*.3,3);if(n)this.setGoal(new V(n[0],n[1],n[2]),true);}}
    else if(!this.cover||R()<.25){this.cover=this.findCover(from);if(this.cover)this.setGoal(new V(this.cover.x,this.cover.y,this.cover.z),true);else if(vis){const a=this.yaw+Math.PI/2*(R()<.5?1:-1);const n=G.nav.randomNear(this.pos.x+Math.sin(a)*4,this.pos.z+Math.cos(a)*4,2);if(n)this.setGoal(new V(n[0],n[1],n[2]),true);}}}
   const moving=this.follow(dt,(this.goal&&this.goal.distanceTo(this.pos)>5?runS:walkS*1.1)*legF);
   if(moving){speed=Math.hypot(this.vel.x,this.vel.z);if(!vis)this.aimYaw=this.moveYaw;}
   else{// in cover / holding
    if(this.flank&&this.flank.distanceTo(this.pos)<2){this.flank=null;}
    if(this.wantHeal&&!vis&&this.healT<=0&&this.healed<2){this.healT=4;this.wantHeal=false;}
    if(this.cover&&Math.hypot(this.cover.x-this.pos.x,this.cover.z-this.pos.z)<1.2){if(this.peekT<=0){this.peeking=!this.peeking;this.peekT=this.peeking?1.4+R()*2.2:.8+R()*1.4+this.suppress*2;}this.crouch=this.peeking?(this.cover.peek?0:.5):1;}
    else this.crouch=vis&&d>18&&!this.st.cls.includes('SHOT')?.6:0;
    if(this.reloadT>0||this.healT>0)this.crouch=1;}
   // aim + fire
   if(t){if(vis){aimAt=t.aimPoint(this._v,R()<D.head*.12+(this.aimHead?1:0)*.9);fireOK=true;}else if(G.time-this.seenT<3.5&&this.suppressOK()){aimAt=this._v.copy(this.lastSeen).setY(this.lastSeen.y+1.1);fireOK=this.crouch<1;this.suppressing=true;}}
   if(aimAt){this.aimYaw=Math.atan2(aimAt.x-this.pos.x,aimAt.z-this.pos.z);const e=this.eye;this.pitch+=(Math.atan2(aimAt.y-e.y,Math.hypot(aimAt.x-e.x,aimAt.z-e.z))-this.pitch)*Math.min(1,dt*8);}
   if(vis){this.aimErr=Math.max(.012+(1-D.acc)*.05,this.aimErr-dt*(.12/D.aim));this.react-=dt;}
   if(fireOK&&this.react<=0&&this.reloadT<=0&&this.healT<=0&&speed<2.6)this.tryFire(dt,aimAt,vis);}
  else if(this.state==='dead'){}
  // turn
  const tr=(this.state==='combat'?7:3.5)*dt;const dy=wrap(this.aimYaw-this.yaw);this.yaw+=Math.max(-tr,Math.min(tr,dy));
  // move
  this.vel.x*=legF;this.vel.z*=legF;if(this.crouch>.5){this.vel.x*=.55;this.vel.z*=.55;}
  this.vel.y-=20*dt;const res=G.W.move(this.pos,this.vel,dt,.3,this.crouch>.5?1.2:1.75,this.onGround,2);this.onGround=res.ground;
  // doors
  if(speed>.2){for(const d of G.doors){if(d.open||Math.abs(d.x-this.pos.x)>1.8||Math.abs(d.z-this.pos.z)>1.8)continue;if(d.lock&&!d.unlocked)continue;if(Math.hypot(d.x-this.pos.x,d.z-this.pos.z)<1.6)G.toggleDoor(d,this);}}
  // stuck
  this.stuckT+=dt;if(this.stuckT>1.2){const m=this.pos.distanceTo(this.lastP);if(speed>.5&&m<.5){this.path=null;this.repathT=0;if(this.goal&&R()<.4)this.goal=null;}this.lastP.copy(this.pos);this.stuckT=0;}
  this.spd=Math.hypot(this.vel.x,this.vel.z);this.crouchV+=(this.crouch-this.crouchV)*Math.min(1,dt*7);this.leanV+=(this.lean-this.leanV)*Math.min(1,dt*7);
  // footsteps
  if(this.spd>.5&&this.onGround){this.stepT=(this.stepT||0)+dt*this.spd;if(this.stepT>1.7){this.stepT=0;G.botStep(this);}}
  // rig
  const rg=this.rig;rg.root.position.copy(this.pos);rg.root.rotation.y=this.yaw;rg.update(dt,{speed:this.spd,crouch:this.crouchV,pitch:this.pitch,lean:this.leanV,reload:this.reloadT>0?this.reloadT:0,lower:this.state==='patrol'&&this.spd<2.5&&this.alert<.5||this.healT>0||this.state==='loot'});}
 suppressOK(){if(!this.weapon)return false;return this.mag>this.st.mag*.35&&this.G.diff.acc>.6&&this.st.cls!=='SHOTGUN'&&this.st.cls!=='MARKSMAN';}
 lookAround(dt){this.lookT-=dt;if(this.lookT<=0){this.lookT=1.2+R()*2;this.aimYaw=this.yaw+(R()-.5)*2.4;}}
 patrol(dt){const G=this.G;this.mode=this.alert>.5?'walk':'walk';
  // drifters loot nearby bodies
  if(this.state==='loot'){const b=this.lootBody;if(!b||b.lootedBy&&b.lootedBy!==this){this.state='patrol';return;}if(Math.hypot(b.x-this.pos.x,b.z-this.pos.z)<1.6){this.crouch=1;this.lootT+=dt;this.aimYaw=Math.atan2(b.x-this.pos.x,b.z-this.pos.z);if(this.lootT>3.5){G.botLoot(this,b);this.state='patrol';this.lootBody=null;}return;}if(!this.follow(dt,1.9)){this.setGoal(new V(b.x,b.y,b.z),true);}else this.aimYaw=this.moveYaw;return;}
  if(this.fac==='drifter'&&!this.looted&&R()<.004){for(const b of G.bodies){if(b.lootedBy||Math.hypot(b.x-this.pos.x,b.z-this.pos.z)>28)continue;b.lootedBy=this;this.lootBody=b;this.state='loot';this.lootT=0;this.setGoal(new V(b.x,b.y,b.z),true);this.looted=true;return;}}
  // squad followers trail the leader
  if(this.squad&&this.lead&&this.lead!==this&&this.lead.alive){const L=this.lead;const off=this.slot||1;const a=L.yaw+Math.PI+(off%2?.6:-.6);const tx=L.pos.x+Math.sin(a)*2.2*off,tz=L.pos.z+Math.cos(a)*2.2*off;
   if(Math.hypot(tx-this.pos.x,tz-this.pos.z)>2.5){if(!this.goal||this.goal.distanceTo(new V(tx,0,tz))>4)this.setGoal(new V(tx,L.pos.y,tz),true);if(this.follow(dt,Math.hypot(tx-this.pos.x,tz-this.pos.z)>8?3.6:2.1))this.aimYaw=this.moveYaw;}else{this.goal=null;this.aimYaw=L.yaw+(R()-.5)*.1;this.lookAround(dt);}return;}
  if(!this.goal){this.idleT-=dt;this.lookAround(dt);if(this.idleT<=0){const p=this.pickPOI();this.setGoal(p);this.idleT=3+R()*6;}}
  else if(this.follow(dt,1.9))this.aimYaw=this.moveYaw;}
 pickPOI(){const list=this.route||POI;let t=0;for(const p of list)t+=p.w||1;let r=R()*t,c=list[0];for(const p of list){r-=p.w||1;if(r<=0){c=p;break;}}
  const q=this.G.nav.randomNear(c.x,c.z,6)||[c.x,0,c.z];return new V(q[0],q[1],q[2]);}
 /* ---------- weapon ---------- */
 startReload(){if(!this.weapon||this.reloadT>0)return;this.reloadT=this.st.reload*(this.st.tube?Math.max(2,this.st.mag-this.mag)*.6:1.2);}
 finishReload(){if(this.reserve<=0){this.reserve=this.st.mag*2;}const n=Math.min(this.st.mag-this.mag,this.reserve);this.mag+=n;this.reserve-=n;}
 tryFire(dt,aim,vis){const G=this.G,s=this.st;this.fireT-=dt;if(this.fireT>0)return;if(this.mag<=0){this.startReload();return;}
  const d=aim?this.pos.distanceTo(aim):30;const auto=s.modes.includes('auto');const ang=Math.abs(wrap(this.aimYaw-this.yaw));if(ang>.2)return;
  if(this.burstGap>0){this.burstGap-=dt;return;}
  this.mag--;this.weapon.ammo=this.mag;const interval=60/s.rpm;
  if(auto){this.burst++;this.fireT=interval;const maxB=d<15?7:d<40?4:2;if(this.burst>=maxB+((R()*3)|0)){this.burst=0;this.burstGap=(.25+R()*.5)*(d/25+.5);}}
  else{this.fireT=Math.max(interval,(s.cls==='MARKSMAN'?.7:s.cls==='SHOTGUN'?.9:.32)+R()*.35*(d/30));}
  G.botFire(this,aim,vis);if(this.mag<=0)this.startReload();}
 damage(part,dmg){if(part==='arm'||part==='leg'||part==='stomach'){const left=this.hp[part]-dmg;if(left<0){this.hp[part]=0;this.hp.thorax+=left*.7;}else this.hp[part]=left;}else this.hp[part]-=dmg;
  this.rig.flinch=1;this.suppress=Math.min(1.5,this.suppress+.6);this.aimErr=Math.min(.5,this.aimErr+.06);this.alert=1;if(this.state!=='combat'){this.state='combat';this.seenT=this.G.time-1;this.react=Math.max(this.react,.25);}
  if(this.hp.head<=0||this.hp.thorax<=0)return true;return false;}
}
