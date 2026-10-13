// IRON VANGUARD — CPU soldiers and crews. Infantry: perception (FOV + line of sight + hearing + spotting), conquest objective
// picking by squad, pathing on the nav grid, strafing gunfights, class jobs (medic revives / heals, engineer RPG + repair,
// recon spotting, assault resupply + grenades), vehicle entry. Crews: tank, jeep driver/gunner, attack helicopter, jet.
import {V,PI,cl,rr,ang} from './util.js';
import {POINTS,HQ,PLAY,riverZ,BRIDGE} from './terrain.js';
export const DIFF=[{n:'EASY',err:4.6,react:1.0,turn:3.4,dmg:.3,foe:.6,burst:[2,4],pause:[.7,1.3],nade:.15,veh:.55},{n:'NORMAL',err:3.1,react:.66,turn:5.2,dmg:.46,foe:.8,burst:[3,5],pause:[.5,.9],nade:.3,veh:.8},{n:'HARD',err:2.0,react:.4,turn:8,dmg:.7,foe:.95,burst:[3,6],pause:[.35,.65],nade:.45,veh:1.1}];
// bot-vs-bot gunfights use one fixed profile so the battle pace does not depend on the chosen difficulty
export const SKIRM={err:2.6,react:.55,turn:6,burst:[3,6],pause:[.45,.8],veh:.8};
export const EYE=1.58,CEYE=1.08;
const tv=new V(),tv2=new V(),eye=new V(),tgt=new V();
export const eyeOf=(a,o)=>o.set(a.pos.x,a.pos.y+(a.crouchV>.5?CEYE:EYE),a.pos.z);
export const chestOf=(a,o)=>o.set(a.pos.x,a.pos.y+1.2-(a.crouchV||0)*.42,a.pos.z);
// any target (soldier or vehicle): centre of mass
export function centerOf(t,o){if(t.isVeh)return o.set(t.p.x,t.p.y+(t.kind==='tank'?1.6:t.kind==='jeep'?1.1:1.2),t.p.z);return chestOf(t,o);}
export const posOf=t=>t.isVeh?t.p:t.pos;
export function newBrain(o={}){return{state:'idle',target:null,seen:0,last:null,lastT:-99,path:null,pathT:-99,goal:null,obj:null,objT:-99,react:0,think:Math.random()*.4,strafe:0,strafeT:0,burst:0,pauseT:0,nadeT:rr(5,12),onT:0,stuckT:0,lastPos:new V(),kitT:rr(6,20),spotT:rr(2,8),
 job:null,jobT:0,vehGoal:null,crouchE:false,hurtT:-99,lastAttacker:null,lookYaw:0,lookT:0,squad:o.squad??0,leader:false,useRPG:false};}

/* ================= perception ================= */
function canSee(a,b,W,range){const bp=posOf(b),dx=bp.x-a.pos.x,dz=bp.z-a.pos.z,d2=dx*dx+dz*dz;if(d2>range*range)return false;const d=Math.sqrt(d2)||1;
 const dot=(Math.sin(a.yaw)*dx+Math.cos(a.yaw)*dz)/d;if(dot<.3&&d>6&&!(a.ai.alerted&&dot>-.3))return false;
 eyeOf(a,eye);centerOf(b,tgt);if(W.fx.smokeBlocks(eye,tgt))return false;if(W.W.los(eye,tgt))return true;if(b.isVeh)return false;tgt.y=b.pos.y+(b.crouchV>.5?1.15:1.62);return W.W.los(eye,tgt);}
export function targetable(b){if(b.isVeh)return b.alive&&b.occupied();return b.alive&&!b.veh&&!b.downed;}
function perceive(a,G){const ai=a.ai,range=a.cls==='recon'?190:a.cls==='engineer'?150:125;let best=null,bs=1e9;const cands=G.tmpC;cands.length=0;
 for(const b of G.actors){if(b.team===a.team||!targetable(b))continue;const d=a.pos.distanceTo(b.pos);if(d<range)cands.push([d*(b.spotT>G.time?.6:1)*(b===ai.lastAttacker&&G.time-ai.hurtT<4?.5:1),b]);}
 for(const v of G.vehicles){if(v.team===a.team||!targetable(v))continue;const d=a.pos.distanceTo(v.p);if(d<range*1.4)cands.push([d*(a.cls==='engineer'?.45:1.3),v]);}
 cands.sort((p,q)=>p[0]-q[0]);let n=0;for(const[s,b]of cands){if(n++>=4)break;if((b.isVeh&&(b.kind==='jet'||b.kind==='heli'&&a.cls!=='engineer'))&&s>80)continue;if(canSee(a,b,G,range*(b.isVeh?1.4:1))){best=b;bs=s;break;}}void bs;
 if(best){if(ai.target!==best||ai.seen<=0){ai.react=(best.isPlayer?G.diff:SKIRM).react*rr(.8,1.3);ai.onT=0;ai.alerted=true;}ai.target=best;ai.seen=1;ai.last=posOf(best).clone();ai.lastT=G.time;
  if(a.cls==='recon'&&ai.spotT<=0&&!best.isVeh){G.spot(a,best);ai.spotT=rr(5,9);}}
 else{if(ai.target&&!targetable(ai.target))ai.target=null;ai.seen=0;}
 if(!best)for(const n of G.noises){if(n.team===a.team||G.time-n.t>.6)continue;if(a.pos.distanceTo(n.p)<n.r){ai.last=n.p.clone();ai.lastT=G.time;ai.alerted=true;break;}}}

/* ================= objectives ================= */
export function pickObjective(a,G){const t=a.team;let best=null,bs=-1e9;const me=posOf(a.veh||a);
 for(const p of G.points){const d=Math.hypot(p.x-me.x,p.z-me.z);let s=-d*.012;if(p.own!==t)s+=p.own===-1?2.6:2.2;else s+=p.contest>0?2.4:-1.5;
  // spread out: fewer bots already heading there is better
  s-=(G.objLoad[t][p.i]||0)*.12;s+=Math.random()*1.4;if(s>bs){bs=s;best=p;}}return best;}
function objGoal(a,p){const an=Math.random()*PI*2,r=Math.random()*p.r*.75;let x=p.x+Math.cos(an)*r,z=p.z+Math.sin(an)*r;if(p.kind==='bridge'){x=p.x+rr(-3,3);z=p.z+rr(-14,14);}return[x,z];}
export function setPath(a,x,z,G,budget=true){if(budget){if(G.pathBudget<=0)return false;G.pathBudget--;}const p=posOf(a.veh||a);const path=G.W.path(p.x,p.z,x,z);a.ai.path=path&&path.length?path:null;a.ai.goal=new V(x,0,z);a.ai.pathT=G.time;return!!a.ai.path;}
function leaderOf(a,G){if(a.ai.leader)return null;for(const b of G.actors)if(b.team===a.team&&b.ai&&b.ai.squad===a.ai.squad&&b.ai.leader&&b.alive&&!b.downed)return b;const P=G.player;if(P&&P.alive&&P.team===a.team&&P.squad===a.ai.squad)return P;return null;}

/* ================= infantry think (every ~.3 s) ================= */
export function think(a,G){const ai=a.ai,D=G.diff;ai.think=a.far?rr(.5,.8):rr(.25,.4);perceive(a,G);ai.spotT-=.3;ai.kitT-=.3;ai.nadeT-=.3;
 const tA=ai.seen?ai.target:null,me=a.pos;
 // engineer: rocket for vehicles
 ai.useRPG=a.cls==='engineer'&&tA&&tA.isVeh&&a.rpg>0;
 // grenades at enemies who ducked out of sight
 if(!tA&&ai.last&&G.time-ai.lastT<5&&G.time-ai.lastT>1.2&&ai.nadeT<=0&&a.nades>0){const d=me.distanceTo(ai.last);if(d>9&&d<30&&Math.random()<D.nade+.15){G.throwNade(a,ai.last);a.nades--;ai.nadeT=rr(14,24);}else ai.nadeT=rr(3,6);}
 // class jobs when not under fire
 if(!tA||me.distanceTo(posOf(tA))>25){
  if(a.cls==='medic'){let best=null,bd=45;for(const b of G.actors){if(b.team!==a.team||!b.downed||b.reviver&&b.reviver!==a)continue;const d=me.distanceTo(b.pos);if(d<bd){bd=d;best=b;}}
   if(best){ai.job={kind:'revive',t:best};best.reviver=a;if(me.distanceTo(best.pos)>1.6){if(!ai.path||G.time-ai.pathT>2)setPath(a,best.pos.x,best.pos.z,G);}ai.state='job';return;}
   if(ai.kitT<=0){for(const b of G.actors)if(b.team===a.team&&b.alive&&!b.downed&&b!==a&&b.hp<b.maxHp*.7&&me.distanceTo(b.pos)<9){G.dropKit(a,'med');ai.kitT=rr(18,26);break;}}}
  if(a.cls==='assault'&&ai.kitT<=0){for(const b of G.actors)if(b.team===a.team&&b.alive&&b!==a&&me.distanceTo(b.pos)<9&&(b.isPlayer?b.lowAmmo:Math.random()<.2)){G.dropKit(a,'ammo');ai.kitT=rr(20,30);break;}}
  if(a.cls==='engineer'){let best=null,bd=35;for(const v of G.vehicles){if(v.team!==a.team||!v.alive||v.hp>v.S.hp*.8||v.kind==='jet'||v.kind==='heli'&&v.p.y-G.W.height(v.p.x,v.p.z)>3)continue;const d=me.distanceTo(v.p);if(d<bd){bd=d;best=v;}}
   if(best){ai.job={kind:'repair',t:best};if(me.distanceTo(best.p)>3.6){if(!ai.path||G.time-ai.pathT>2)setPath(a,best.p.x,best.p.z,G);}ai.state='job';return;}}}
 if(ai.job){if(ai.job.t)ai.job.t.reviver=ai.job.t.reviver===a?null:ai.job.t.reviver;ai.job=null;}
 // vehicles: grab a free one nearby
 if(!tA&&!a.veh&&G.time-(a.spawnT||0)<20&&!ai.vehGoal&&Math.random()<.5){let best=null,bd=a.atHQ?60:24;for(const v of G.vehicles){if(v.team!==a.team||!v.alive||v.claim&&v.claim!==a)continue;const fs=v.freeSeat();if(fs<0)continue;if(fs===0&&v.kind!=='jeep'&&!a.atHQ&&v.kind!=='tank')continue;
   const d=me.distanceTo(v.p);if(d<bd&&(v.kind!=='jet'&&v.kind!=='heli'||a.atHQ&&Math.random()<.6)){bd=d;best=v;}}
  if(best){ai.vehGoal=best;if(best.freeSeat()===0)best.claim=a;setPath(a,best.p.x,best.p.z,G,false);}}
 if(ai.vehGoal){const v=ai.vehGoal;if(!v.alive||v.freeSeat()<0||(v.claim&&v.claim!==a)){if(v.claim===a)v.claim=null;ai.vehGoal=null;}else{if(me.distanceTo(v.p)<4.2){if(v.claim===a)v.claim=null;G.enterVehicle(a,v);ai.vehGoal=null;return;}if(!ai.path||G.time-ai.pathT>3)setPath(a,v.p.x,v.p.z,G);ai.state='veh';return;}}
 // fighting
 if(tA){const d=me.distanceTo(posOf(tA));ai.state='engage';if(ai.obj&&Math.hypot(me.x-ai.obj.x,me.z-ai.obj.z)>ai.obj.r&&d>35&&Math.random()<.35){if(!ai.path||G.time-ai.pathT>4){const[x,z]=objGoal(a,ai.obj);setPath(a,x,z,G);}}else if(d<30||!ai.path)ai.path=null;return;}
 if(ai.last&&G.time-ai.lastT<7&&me.distanceTo(ai.last)<45){if(ai.state!=='hunt'||!ai.path||G.time-ai.pathT>4){ai.state='hunt';setPath(a,ai.last.x+rr(-4,4),ai.last.z+rr(-4,4),G);}return;}
 // objective
 ai.state='move';if(!ai.obj||G.time-ai.objT>(ai.leader?rr(14,22):rr(20,30))||(ai.obj.own===a.team&&!ai.obj.contest&&G.time-ai.objT>8)){const L=leaderOf(a,G);const prev=ai.obj;ai.obj=L&&L.ai?L.ai.obj||pickObjective(a,G):L&&L.isPlayer?nearestPoint(L.pos,G):pickObjective(a,G);ai.objT=G.time;if(prev!==ai.obj)ai.path=null;}
 const L=leaderOf(a,G);if(L&&me.distanceTo(L.pos)>22&&!L.veh){if(!ai.path||G.time-ai.pathT>3)setPath(a,L.pos.x+rr(-4,4),L.pos.z+rr(-4,4),G);return;}
 const o=ai.obj;if(o){const d=Math.hypot(me.x-o.x,me.z-o.z);if(d>o.r*.8){if(!ai.path||G.time-ai.pathT>9)setPath(a,...objGoal(a,o),G);}else if(!ai.path&&Math.random()<.12)setPath(a,...objGoal(a,o),G);}}
function nearestPoint(p,G){let b=null,bd=1e9;for(const q of G.points){const d=Math.hypot(q.x-p.x,q.z-p.z);if(d<bd){bd=d;b=q;}}return b;}

/* ================= infantry drive (per frame) ================= */
export function drive(a,G,dt){const ai=a.ai;ai.think-=dt;if(ai.think<=0)think(a,G);
 const tA=ai.seen&&ai.target&&targetable(ai.target)?ai.target:null,D=tA&&tA.isPlayer?G.diff:SKIRM;let mx=0,mz=0,speed=0;a.crouch=false;
 if(ai.path&&ai.path.length){const wp=ai.path[0],dx=wp[0]-a.pos.x,dz=wp[1]-a.pos.z,d=Math.hypot(dx,dz);if(d<1.2){ai.path.shift();if(!ai.path.length)ai.path=null;}else{mx=dx/d;mz=dz/d;}
  speed=tA?3.2:ai.state==='job'||ai.state==='veh'?5.6:a.inWater?2.4:5.3;if(a.inWater)speed=Math.min(speed,2.6);}
 if(speed>0){if(a.pos.distanceToSquared(ai.lastPos)<.0009*Math.max(1,speed)){ai.stuckT+=dt;if(ai.stuckT>1.2){ai.stuckT=0;ai.path=null;ai.strafe=Math.random()<.5?1:-1;ai.strafeT=.8;}}else ai.stuckT=0;}
 ai.lastPos.copy(a.pos);
 // jobs
 if(ai.job&&ai.state==='job'){const j=ai.job,tp=j.kind==='revive'?j.t.pos:j.t.p,d=a.pos.distanceTo(tp);
  if(j.kind==='revive'){if(!j.t.downed){ai.job=null;}else if(d<1.8){speed=0;a.crouch=true;ai.jobT+=dt;if(ai.jobT>1.4){G.revive(a,j.t);ai.job=null;ai.jobT=0;}}}
  else if(j.kind==='repair'){if(!j.t.alive||j.t.hp>=j.t.S.hp){ai.job=null;}else if(d<4.2){speed=0;G.repair(a,j.t,dt);a.repairing=.2;}}}
 if(ai.state==='engage'&&tA){ai.strafeT-=dt;if(ai.strafeT<=0){ai.strafe=Math.random()<.3?0:(Math.random()<.5?1:-1);ai.strafeT=rr(.6,1.6);if(Math.random()<.3)ai.crouchE=!ai.crouchE;}
  const tp=posOf(tA),dx=tp.x-a.pos.x,dz=tp.z-a.pos.z,l=Math.hypot(dx,dz)||1;if(!ai.path){mx=-dz/l*ai.strafe;mz=dx/l*ai.strafe;speed=ai.strafe?2.4:0;}a.crouch=ai.crouchE&&!ai.path&&!ai.strafe;}
 if(ai.strafeT>0&&!tA&&ai.strafe&&!ai.path){ai.strafeT-=dt;mx=Math.cos(a.yaw)*ai.strafe;mz=-Math.sin(a.yaw)*ai.strafe;speed=2.2;}
 for(const b of G.near(a)){if(b===a||!b.alive||b.veh)continue;const dx=a.pos.x-b.pos.x,dz=a.pos.z-b.pos.z,d2=dx*dx+dz*dz;if(d2<1.4&&d2>1e-4){const d=Math.sqrt(d2);mx+=dx/d*(1.2-d)*1.5;mz+=dz/d*(1.2-d)*1.5;speed=Math.max(speed,1.2);}}
 const ml=Math.hypot(mx,mz);if(ml>1e-4){mx/=ml;mz/=ml;}else speed=0;if(a.crouch)speed=Math.min(speed,1.8);a.move.set(mx*speed,0,mz*speed);
 // aim
 let wantYaw=a.yaw,wantPitch=0;if(tA){eyeOf(a,eye);centerOf(tA,tgt);if(ai.headAim&&!tA.isVeh)tgt.y+=.42;if(tA.isVeh&&ai.useRPG){const dd=eye.distanceTo(tgt);tgt.addScaledVector(tA.vel,dd/90);tgt.y+=dd*dd*.00045;}
  wantYaw=Math.atan2(tgt.x-eye.x,tgt.z-eye.z);wantPitch=Math.atan2(tgt.y-eye.y,Math.hypot(tgt.x-eye.x,tgt.z-eye.z));}
 else if(ai.job){const tp=ai.job.kind==='revive'?ai.job.t.pos:ai.job.t.p;wantYaw=Math.atan2(tp.x-a.pos.x,tp.z-a.pos.z);}
 else if(ai.last&&G.time-ai.lastT<6)wantYaw=Math.atan2(ai.last.x-a.pos.x,ai.last.z-a.pos.z);else if(speed>.5)wantYaw=Math.atan2(mx,mz);
 else{ai.lookT-=dt;if(ai.lookT<=0){ai.lookT=rr(1.5,4);ai.lookYaw=a.yaw+rr(-1.4,1.4);}wantYaw=ai.lookYaw;}
 const turn=(tA?D.turn:3.2)*dt;a.yaw+=cl(ang(wantYaw-a.yaw),-turn,turn);a.pitch+=(wantPitch-a.pitch)*Math.min(1,dt*6);a.wantRPG=!!ai.useRPG;
 // fire
 if(tA&&a.weapon){ai.react-=dt;ai.onT+=dt;if(a.reloadT>0)return;const dist=a.pos.distanceTo(posOf(tA));
  if(ai.useRPG){if(a.rpgT>0||ai.react>0||Math.abs(ang(wantYaw-a.yaw))>.06)return;G.fireRPG(a,tgt.clone(),(tA.isPlayer||tA.driver&&tA.driver.isPlayer?G.diff:SKIRM).err*1.3*PI/180);a.rpgT=rr(4,6);a.rpg--;return;}
  if(tA.isVeh&&(tA.kind==='tank'||dist>90))return;// rifles do nothing to armour
  if(a.mag<=0){G.reload(a);return;}const off=Math.abs(ang(wantYaw-a.yaw));if(ai.react>0||off>.12)return;if(ai.pauseT>0){ai.pauseT-=dt;return;}
  if(a.fireT<=0&&dist<(a.weapon.range[1]*1.6+20)){const P=tA.isPlayer||(tA.isVeh&&tA.seats.some(s=>s&&s.isPlayer));const DD=P?G.diff:SKIRM;
   const err=DD.err*(1+Math.min(2,(tA.speed||0)*.1))*(speed>2.5?1.5:1)*Math.max(.45,1-ai.onT*.3)*(tA.crouchV>.5?1.1:1)*(a.weapon.id==='sniper'?.45:1)*(1+dist/160)*PI/180;
   G.botFire(a,tA,err);ai.burst++;if(ai.burst>=rr(DD.burst[0],DD.burst[1])){ai.burst=0;ai.pauseT=rr(DD.pause[0],DD.pause[1])*(a.weapon.id==='sniper'?2.5:1);ai.headAim=Math.random()<(G.diffI===2?.3:.12);}}}}

/* ================= crews ================= */
function vehTarget(v,G,range,airOK=true,groundOK=true){let best=null,bs=1e9;const o=tv.copy(v.p);o.y+=v.kind==='tank'?3:v.kind==='jeep'?2.2:0;
 const consider=(t,s)=>{if(s>=bs)return;centerOf(t,tgt);if(!G.W.los(o,tgt)||G.fx.smokeBlocks(o,tgt))return;bs=s;best=t;};
 const list=[];for(const b of G.actors){if(b.team===v.team||!targetable(b)||!groundOK)continue;const d=b.pos.distanceTo(v.p);if(d<range)list.push([d,b]);}
 for(const u of G.vehicles){if(u.team===v.team||!targetable(u))continue;const air=u.kind==='heli'||u.kind==='jet';if(air&&!airOK||!air&&!groundOK)continue;const d=u.p.distanceTo(v.p);if(d<range*1.2)list.push([d*(v.kind==='tank'&&!air?.5:air&&v.kind==='jet'?.4:.9),u]);}
 list.sort((p,q)=>p[0]-q[0]);let n=0;for(const[s,t]of list){if(n++>5)break;consider(t,s);if(best)break;}return best;}
function steerTo(v,x,z,dt,maxThr=1){const dx=x-v.p.x,dz=z-v.p.z,d=Math.hypot(dx,dz),want=Math.atan2(dx,dz),e=ang(want-v.yaw);v.ctrl.steer=cl(e*2.2,-1,1);v.ctrl.thr=Math.abs(e)>1.6?-.4:cl(d/10,.25,maxThr)*(1-Math.min(.6,Math.abs(e)*.4));return d;}
export function crew(a,G,dt){const v=a.veh,ai=a.ai,c=v.ctrl,seat=a.seat;ai.think-=dt;const thinkNow=ai.think<=0;if(thinkNow)ai.think=rr(.3,.5);
 const k=v.kind;
 // pick an objective
 if(thinkNow&&(!ai.obj||G.time-ai.objT>25||ai.obj.own===a.team&&!ai.obj.contest&&G.time-ai.objT>10)){ai.obj=pickObjective(a,G);ai.objT=G.time;ai.path=null;}
 const o=ai.obj;
 if(k==='tank'||k==='jeep'){
  if(seat===0){if(thinkNow&&o){const d=Math.hypot(v.p.x-o.x,v.p.z-o.z);if(d>o.r*.9&&(!ai.path||G.time-ai.pathT>10))setPath(a,o.x+rr(-6,6),o.z+rr(-6,6),G);if(d<o.r*.9&&!ai.path&&Math.random()<.1)setPath(a,o.x+rr(-o.r,o.r),o.z+rr(-o.r,o.r),G);}
   if(ai.path&&ai.path.length){const wp=ai.path[0],d=steerTo(v,wp[0],wp[1],dt,k==='tank'?1:.85);if(d<(k==='tank'?5:6)){ai.path.shift();if(!ai.path.length)ai.path=null;}}else{c.thr=0;c.steer=0;}
   if(ai.seen&&k==='tank'&&ai.target&&v.p.distanceTo(posOf(ai.target))<70&&o&&Math.hypot(v.p.x-o.x,v.p.z-o.z)<o.r*1.5){c.thr*=.3;}
   // unstick
   if(Math.abs(c.thr)>.2&&v.speed<.6){ai.stuckT+=dt;if(ai.stuckT>2.5){ai.stuckT=-1.5;ai.path=null;}}else if(ai.stuckT>0)ai.stuckT=0;if(ai.stuckT<0){ai.stuckT+=dt;c.thr=-.8;c.steer=.6;}}
  // gunner (tank: driver also gunner; jeep: seat 1)
  if(k==='tank'||seat===1){if(thinkNow){const t=vehTarget(v,G,k==='tank'?200:110,false);if(t!==ai.target){ai.react=(t&&(t.isPlayer||t.isVeh&&t.seats.some(s=>s&&s.isPlayer))?G.diff:SKIRM).react;}ai.target=t;ai.seen=t?1:0;}
   const t=ai.seen&&ai.target&&targetable(ai.target)?ai.target:null;if(t){centerOf(t,c.aim);const d=v.p.distanceTo(c.aim);if(t.vel)c.aim.addScaledVector(t.vel||tv2.set(0,0,0),d/(k==='tank'?170:600));ai.react-=dt;
    const pl=t.isPlayer||t.isVeh&&t.seats.some(s=>s&&s.isPlayer);const err=(pl?G.diff:SKIRM).err*(k==='tank'?.35:1)*(1+d/150);c.aim.x+=(Math.random()-.5)*d*err*.012;c.aim.y+=(Math.random()-.5)*d*err*.008;
    const aligned=Math.abs(ang(Math.atan2(c.aim.x-v.p.x,c.aim.z-v.p.z)-(v.yaw+v.tYaw)))<(k==='tank'?.05:.12);
    c.fire=ai.react<=0&&aligned&&(k!=='tank'||t.isVeh||d>12);c.fire2=k==='tank'&&ai.react<=0&&aligned&&!t.isVeh&&d<80;}
   else{c.fire=c.fire2=false;if(seat===0||k==='tank'){const f=v.fwd(tv2);c.aim.set(v.p.x+f.x*60,v.p.y+2.5,v.p.z+f.z*60);}}}
  else c.fire=c.fire2=false;
  // bail out of a burning vehicle sometimes
  if(v.hp<v.S.hp*.15&&Math.random()<dt*.3&&k==='jeep')G.exitVehicle(a);return;}
 if(k==='heli'){const h=G.W.height(v.p.x,v.p.z);let gx=o?o.x:0,gz=o?o.z:0;const t0=ai.seen&&ai.target&&targetable(ai.target)?ai.target:null;
  if(thinkNow){const t=vehTarget(v,G,190);if(t!==ai.target)ai.react=SKIRM.react*1.4;ai.target=t;ai.seen=t?1:0;ai.orbit=(ai.orbit??Math.random()*6)+.25;}
  const orbitR=55,an=ai.orbit||0;if(t0){const tp=posOf(t0);gx=tp.x+Math.cos(an)*orbitR;gz=tp.z+Math.sin(an)*orbitR;}else if(o){gx=o.x+Math.cos(an*.6)*orbitR*1.3;gz=o.z+Math.sin(an*.6)*orbitR*1.3;}
  if(v.hp<v.S.hp*.3){const hq=HQ[v.team];gx=hq.x;gz=hq.z;}
  let alt=h+(t0?32:45);let ahead=0;for(const s of[25,50]){const f=v.fwd(tv2);ahead=Math.max(ahead,G.W.height(v.p.x+v.vel.x*s/20,v.p.z+v.vel.z*s/20));void f;}alt=Math.max(alt,ahead+25);
  c.lift=cl((alt-v.p.y)/8,-1,1);const dx=gx-v.p.x,dz=gz-v.p.z,dist=Math.hypot(dx,dz);const face=t0?posOf(t0):tv.set(gx,0,gz);c.yawT=Math.atan2(face.x-v.p.x,face.z-v.p.z);
  const lx=dx*Math.sin(v.yaw)+dz*Math.cos(v.yaw),ls=dx*Math.cos(v.yaw)-dz*Math.sin(v.yaw);c.thr=cl(lx/25,-1,1)*(dist>8?1:0);c.side=cl(ls/25,-1,1)*(dist>8?1:0);
  if(t0){centerOf(t0,c.aim);const d=v.p.distanceTo(c.aim);if(t0.vel)c.aim.addScaledVector(t0.vel,d/320);ai.react-=dt;const pl=t0.isPlayer||t0.isVeh&&t0.seats.some(s=>s&&s.isPlayer);const err=(pl?G.diff:SKIRM).err*1.2;c.aim.x+=(Math.random()-.5)*d*err*.014;c.aim.z+=(Math.random()-.5)*d*err*.014;
   const fa=Math.abs(ang(Math.atan2(c.aim.x-v.p.x,c.aim.z-v.p.z)-v.yaw));c.fire=ai.react<=0&&fa<.5&&d<200;c.fire2=ai.react<=0&&fa<.08&&d<170&&(t0.isVeh||Math.random()<.05);}else{c.fire=c.fire2=false;c.aim.set(v.p.x+Math.sin(v.yaw)*60,v.p.y-10,v.p.z+Math.cos(v.yaw)*60);}
  return;}
 if(k==='jet'){if(thinkNow){const t=vehTarget(v,G,420,true,true);ai.target=t&&(t.isVeh||Math.random()<.4)?t:ai.target&&targetable(ai.target)?ai.target:t;ai.seen=ai.target?1:0;}
  const t=ai.seen&&ai.target&&targetable(ai.target)?ai.target:null;const h=G.W.height(v.p.x,v.p.z);c.thr=.5;
  if(t){const tp=centerOf(t,tv);const d=v.p.distanceTo(tp),air=t.isVeh&&(t.kind==='jet'||t.kind==='heli');if(t.vel)tp.addScaledVector(t.vel,d/150);
   if(!air&&(ai.run==='pull'||d<110&&v.p.y-h<70)){ai.run='pull';c.aim.set(v.p.x+Math.sin(v.yaw)*200,h+150,v.p.z+Math.cos(v.yaw)*200);if(v.p.y-h>120||d>300)ai.run=null;c.fire=false;}
   else{c.aim.copy(tp);const f=v.fwd(tv2),dir=tgt.subVectors(tp,v.p).normalize(),dot=f.dot(dir);c.fire=dot>.985&&d<360;if(v.ammo2>0&&v.lock===t&&v.lockT>1.2&&d<400&&Math.random()<dt*2){c.fire2=true;}else c.fire2=false;}}
  else{const an=G.time*.12+v.id;c.aim.set(Math.cos(an)*220,Math.max(h,40)+120,Math.sin(an)*220);c.fire=c.fire2=false;}
  return;}}
