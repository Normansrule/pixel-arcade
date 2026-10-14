// DROPZONE — CPU operator brains: drop planning, looting, rotating with the gas, perception (FOV + line of sight + gunfire hearing),
// fights with strafing and bursts, retreat-and-plate, third-partying nearby fights, depot shopping, and the 1v1 gulag duel.
import * as THREE from '../vendor/three.module.min.js';
import {WPN,wstats} from './weapons.js';
const V=THREE.Vector3,rr=(a,b)=>a+Math.random()*(b-a),angD=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
// vs the player: aim error (deg), reaction (s), damage scale; bot-vs-bot uses one fixed profile so match pace does not depend on difficulty
export const DIFF=[{n:'EASY',err:4.6,react:.95,dmg:.42,turn:4},{n:'NORMAL',err:3.1,react:.62,dmg:.62,turn:6},{n:'HARD',err:1.9,react:.36,dmg:.85,turn:9}];
export const SKIRM={err:3.8,react:.95,dmg:.4,turn:6};
const EYE=1.55;const tv=new V(),tv2=new V();

export function newBrain(){return{t:Math.random()*.3,state:'loot',target:null,seenT:-99,react:0,last:null,lastT:-99,path:null,pi:0,goal:null,goalKind:'',goalRef:null,pathT:-99,stuckT:0,lastPos:new V(),
 strafe:0,strafeT:0,burst:0,pauseT:0,hurtT:-99,attacker:null,heard:null,heardT:-99,retreat:false,dropTo:null,jumpAt:0,want:null,lootT:0,ignore:new Set(),depotT:0};}

function setGoal(a,x,z,G,kind='',ref=null){const ai=a.ai;ai.goal=new V(x,0,z);ai.goalKind=kind;ai.goalRef=ref;ai.path=null;ai.pi=0;ai.pathT=-99;}
function planPath(a,G){const ai=a.ai;if(!ai.goal||G.pathBudget<=0)return;G.pathBudget--;ai.pathT=G.time;
 // long trips: path toward an intermediate point at most ~90 m away
 let tx=ai.goal.x,tz=ai.goal.z;const dx=tx-a.pos.x,dz=tz-a.pos.z,d=Math.hypot(dx,dz);if(d>90){tx=a.pos.x+dx/d*90;tz=a.pos.z+dz/d*90;}
 const p=G.nav.path(a.pos.x,a.pos.z,tx,tz,7000);ai.path=p&&p.length?p:null;ai.pi=0;if(!ai.path){ai.path=[[tx,tz]];}}

function canSee(a,b,G){const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.hypot(dx,dz)||1;const range=b.state==='chute'?140:b.isPlayer||a.isPlayer||a.inGulag?a.range||110:72;if(d>range)return false;
 const ai=a.ai;const fx=Math.sin(a.yaw),fz=Math.cos(a.yaw);const dot=(fx*dx+fz*dz)/d;const alert=G.time-ai.hurtT<3||G.time-ai.seenT<2;if(dot<.35&&d>6&&!alert)return false;
 const ey=a.pos.y+EYE;const ty=b.pos.y+(b.state==='chute'?2.4:1.25);return G.W.los(a.pos.x,ey,a.pos.z,b.pos.x,ty,b.pos.z)||G.W.los(a.pos.x,ey,a.pos.z,b.pos.x,b.pos.y+1.62,b.pos.z);}

function gunScore(it){return it?(1+it.r*.35)*({p9:.5,vx9:1,ark:1.2,hrn:1.05,stk:.95}[it.w]):0;}
export function wantsItem(a,it){if(it.kind==='cash')return true;if(it.kind==='plates')return a.plates<5;if(it.kind==='ammo')return a.ammo[it.t]<(it.t==='shell'?20:120)&&a.guns.some(g=>g&&WPN[g.w].ammo===it.t);
 if(it.kind==='gun'){const worst=Math.min(gunScore(a.guns[0]),gunScore(a.guns[1]));return gunScore(it)>worst+.05&&!a.guns.some(g=>g&&g.w===it.w&&g.r>=it.r);}return false;}

// called every frame for each living bot; sets a.in (mx,mz,fire,jump,sprint) and a.yaw/pitch
export function thinkBot(a,G,dt){const ai=a.ai,I=a.in;I.fire=false;I.jump=false;
 if(a.state==='plane'){if(ai.dropTo&&G.plane){const pp=G.plane.pos,d=Math.hypot(pp.x-ai.dropTo.x,pp.z-ai.dropTo.z);if(d<ai.jumpR||G.planeT>ai.jumpAt)I.jump=true;}return;}
 if(a.state==='fall'||a.state==='chute'){const t=ai.dropTo||a.pos;const dx=t.x-a.pos.x,dz=t.z-a.pos.z;a.yaw=Math.atan2(dx,dz);const d=Math.hypot(dx,dz);I.mz=d>4?1:0;I.mx=0;a.pitch=d>60?-.9:-.3;
  if(a.state==='fall'&&a.pos.y<110)I.jump=true;return;}
 if(a.state!=='ground')return;
 const D=G.diff;ai.t-=dt;if(ai.t<=0){ai.t=rr(.2,.32);think(a,G);}
 // ---- per-frame driving
 let tgt=ai.target&&ai.target.alive&&ai.target.state!=='dead'?ai.target:null;const seen=tgt&&G.time-ai.seenT<.35;
 let mx=0,mz=0,wantYaw=a.yaw,run=true;
 // path following
 if(ai.path&&ai.pi<ai.path.length){const w=ai.path[ai.pi];const dx=w[0]-a.pos.x,dz=w[1]-a.pos.z,d=Math.hypot(dx,dz);if(d<.9){ai.pi++;if(ai.pi>=ai.path.length){ai.path=null;}}
  else{const yawTo=Math.atan2(dx,dz);if(!seen)wantYaw=yawTo;const rel=angD(a.yaw,yawTo);mz=Math.cos(rel);mx=-Math.sin(rel);}}
 if(seen){const P=tgt.pos;const dx=P.x-a.pos.x,dz=P.z-a.pos.z;wantYaw=Math.atan2(dx,dz);const d=Math.hypot(dx,dz);
  const prof=tgt.isPlayer?D:SKIRM;
  // strafe while fighting
  ai.strafeT-=dt;if(ai.strafeT<=0){ai.strafeT=rr(.5,1.3);ai.strafe=Math.random()<.5?-1:1;if(Math.random()<.25)ai.strafe=0;}
  if(!ai.path||ai.retreat){const it=a.guns[a.cur];const ideal=it?WPN[it.w].range[0]*.8:20;mz=ai.retreat?-1:d>ideal+6?.7:d<ideal*.4?-.6:0;mx=ai.strafe*.8;}else{mx+=ai.strafe*.4;}
  run=ai.retreat;
  // aim + fire once the reaction time is over
  const it=a.guns[a.cur];if(it&&G.time-ai.seenStart>ai.react&&d<WPN[it.w].range[1]*1.7+8){const err=angD(a.yaw,wantYaw);if(Math.abs(err)<.12+(d<8?.25:0)){
   ai.pauseT-=dt;if(ai.pauseT<=0){I.fire=true;ai.burst-=dt;if(ai.burst<=0){ai.pauseT=WPN[it.w].auto?rr(.25,.6):rr(.08,.3);ai.burst=WPN[it.w].auto?rr(.35,.9):rr(.05,.12);}}}
   a.pitch=Math.atan2(P.y+1.2-(a.pos.y+EYE),d);a.aimErr=prof.err;}}
 else{a.pitch*=.9;}
 // turn
 const turn=(seen?(tgt.isPlayer?D.turn:SKIRM.turn):5)*dt;const e=angD(a.yaw,wantYaw);a.yaw+=Math.max(-turn,Math.min(turn,e));
 // move input is relative to the facing direction
 const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l;}I.mx=mx;I.mz=mz;I.sprint=run&&!seen&&mz>.5;
 // stuck detection
 if(ai.path){ai.stuckT+=dt;if(ai.stuckT>1.6){if(a.pos.distanceTo(ai.lastPos)<.8){ai.path=null;ai.pathT=-99;I.jump=true;ai.strafe=Math.random()<.5?-1:1;if(ai.goalKind==='loot'&&ai.goalRef){ai.ignore.add(ai.goalRef);ai.goal=null;}}ai.stuckT=0;ai.lastPos.copy(a.pos);}}}

function think(a,G){const ai=a.ai,me=a.pos;const gas=G.gas;
 // ---- perception
 let best=null,bd=1e9;const cands=[];for(const b of G.actors){if(b===a||!b.alive||b.inGulag!==a.inGulag)continue;if(b.state!=='ground'&&b.state!=='chute')continue;const d=Math.abs(b.pos.x-me.x)+Math.abs(b.pos.z-me.z);if(d>160)continue;cands.push([d,b]);}
 cands.sort((p,q)=>p[0]-q[0]);let checks=0;const cur=a.guns[a.cur],er=cur?Math.min(115,WPN[cur.w].range[1]*1.5):12;ai.far=null;
 for(const[d,b]of cands){if(checks++>=3)break;if(canSee(a,b,G)){const hb=b===ai.attacker&&G.time-ai.hurtT<5;const dd=a.pos.distanceTo(b.pos);
   // far targets are ignored unless they are shooting at us (keeps early-game bots looting instead of plinking across the map)
   if(dd>er&&!hb&&!a.inGulag&&!(b===ai.target&&G.time-ai.seenT<2)){ai.far=b;continue;}let s=d;if(hb)s*=.5;if(b===ai.target)s*=.7;if(s<bd){bd=s;best=b;}}}
 if(best){if(ai.target!==best||G.time-ai.seenT>1.5){ai.seenStart=G.time;ai.react=(best.isPlayer?G.diff:SKIRM).react*rr(.8,1.3);}ai.target=best;ai.seenT=G.time;ai.last=best.pos.clone();ai.lastT=G.time;}
 // got shot by someone unseen: turn toward them
 if(!best&&ai.attacker&&ai.attacker.alive&&G.time-ai.hurtT<1.5){ai.last=ai.attacker.pos.clone();ai.lastT=G.time;}
 // ---- weapon management
 const it=a.guns[a.cur],other=a.guns[1-a.cur];if(best&&other){const d=me.distanceTo(best.pos);const good=g=>g?(d<12?{stk:3,vx9:2.4,p9:1,ark:1.6,hrn:.5}:d<45?{stk:.4,vx9:2,p9:.8,ark:2.4,hrn:1.4}:{stk:.1,vx9:.9,p9:.5,ark:2,hrn:2.6})[g.w]*(1+g.r*.2)*(g.mag>0||a.ammo[WPN[g.w].ammo]>0?1:.05):0;if(good(other)>good(it)*1.2&&G.time-(a.swapT||0)>2){G.swap(a);a.swapT=G.time;}}
 if(it&&it.mag<=0&&a.ammo[WPN[it.w].ammo]<=0&&other&&(other.mag>0||a.ammo[WPN[other.w].ammo]>0))G.swap(a);
 if(it&&!best&&it.mag<wstats(it).mag*.5&&a.reloadT<=0)G.reload(a);
 // ---- gulag duel: hunt the opponent, use cover
 if(a.inGulag){if(best){ai.path=null;ai.retreat=false;return;}const o=G.actors.find(b=>b!==a&&b.alive&&b.inGulag);if(o&&(!ai.path||G.time-ai.pathT>1.2)){ai.path=[[o.pos.x+rr(-3,3),o.pos.z+rr(-3,3)]];ai.pi=0;ai.pathT=G.time;}return;}
 // ---- retreat + plate when hurt
 const tot=a.hp+a.armor;ai.retreat=!!best&&tot<70&&(a.plates>0)&&Math.random()<.6;
 if(!best&&a.armor<150&&a.plates>0&&G.time-ai.seenT>1.5&&!a.plateT)G.plate(a);
 if(best){if(me.distanceTo(best.pos)>40&&!ai.retreat&&Math.random()<.25){setGoal(a,best.pos.x+rr(-6,6),best.pos.z+rr(-6,6),G,'push');planPath(a,G);}else if(!ai.retreat)ai.path=null;
  if(ai.retreat&&(!ai.path||G.time-ai.pathT>2)){const dx=me.x-best.pos.x,dz=me.z-best.pos.z,l=Math.hypot(dx,dz)||1;setGoal(a,me.x+dx/l*18+rr(-6,6),me.z+dz/l*18+rr(-6,6),G,'retreat');planPath(a,G);}return;}
 // a far enemy in view: well-armed bots go hunting, the rest keep looting
 if(ai.far&&gunScore(a.guns[a.cur])>=1.25&&a.hp+a.armor>150&&Math.random()<.2&&ai.goalKind!=='push'){setGoal(a,ai.far.pos.x,ai.far.pos.z,G,'push');planPath(a,G);return;}
 // recently seen target: chase the last known position
 if(ai.last&&G.time-ai.lastT<5&&ai.target&&ai.target.alive){if(ai.goalKind!=='chase'||G.time-ai.pathT>3){setGoal(a,ai.last.x,ai.last.z,G,'chase');planPath(a,G);}return;}
 // ---- walking to a claimed rover
 if(ai.goalKind==='car'){const c=ai.goalRef;if(!c||c.dead||c.driver||Math.abs(c.pos.y-me.y)>1.5){ai.goalKind='';ai.goal=null;ai.goalRef=null;ai.path=null;ai.carCD=G.time+10;}
  else{const d=Math.hypot(c.pos.x-me.x,c.pos.z-me.z);if(d<3.4){G.enterCar(a,c);return;}c.claimT=G.time;if(!ai.path||G.time-ai.pathT>4||Math.hypot(ai.goal.x-c.pos.x,ai.goal.z-c.pos.z)>4){setGoal(a,c.pos.x,c.pos.z,G,'car',c);planPath(a,G);}return;}}
 // ---- gas: rotate inside
 const dg=Math.hypot(me.x-gas.cur.x,me.z-gas.cur.z),dn=Math.hypot(me.x-gas.next.x,me.z-gas.next.z);
 const outside=dg>gas.cur.r-6||(gas.state!=='closed'&&dn>gas.next.r*.92&&(gas.state==='shrink'||gas.left<45+a.id%20));
 // far from the next circle (or already rotating a long way) with a free rover nearby: take it
 const far=dn-gas.next.r;if((outside&&far>50||far>80&&(gas.state==='shrink'||gas.left<80||gunScore(a.guns[a.cur])>=1))&&G.time>(ai.carCD||0)&&gas.next.r>20){const c=freeCar(a,G,Math.min(190,far*1.1),gas.next,dn);if(c){c.claim=a;c.claimT=G.time;G.stats.rover.claim++;setGoal(a,c.pos.x,c.pos.z,G,'car',c);planPath(a,G);return;}}
 if(outside){if(ai.goalKind!=='rotate'||!ai.goal||Math.hypot(ai.goal.x-gas.next.x,ai.goal.z-gas.next.z)>gas.next.r*.8){const an=Math.random()*Math.PI*2,rad=Math.sqrt(Math.random())*gas.next.r*.55;let gx=gas.next.x+Math.cos(an)*rad,gz=gas.next.z+Math.sin(an)*rad;const p=G.nav.randomNear(gx,gz,8);if(p){gx=p[0];gz=p[1];}setGoal(a,gx,gz,G,'rotate');}
  if(!ai.path||(ai.path&&ai.pi>=ai.path.length)||G.time-ai.pathT>6)planPath(a,G);return;}
 // ---- third party: go toward recent gunfire if healthy
 if(ai.heard&&G.time-ai.heardT<8&&tot>120&&a.guns[a.cur]&&a.id%3!==0){if(ai.goalKind!=='third'||G.time-ai.pathT>4){setGoal(a,ai.heard.x+rr(-10,10),ai.heard.z+rr(-10,10),G,'third');planPath(a,G);}return;}
 // ---- depot shopping
 if(a.cash>=4000&&!a.bought&&G.depots.length){const dp=G.depots.reduce((b,d)=>Math.hypot(d.x-me.x,d.z-me.z)<Math.hypot(b.x-me.x,b.z-me.z)?d:b);const d=Math.hypot(dp.x-me.x,dp.z-me.z);
  if(d<3){G.botBuy(a);return;}if(d<160){if(ai.goalKind!=='depot'||!ai.path){setGoal(a,dp.x+1.6,dp.z+1.6,G,'depot');planPath(a,G);}return;}}
 // ---- loot
 if(ai.goalKind==='loot'&&ai.goalRef){const r=ai.goalRef;if(r.it&&!G.loot.includes(r)){ai.goal=null;ai.goalRef=null;}else if(!r.it&&r.opened){ai.goal=null;ai.goalRef=null;}
  else{const p=r.p||r;if(Math.hypot(p.x-me.x,p.z-me.z)<2.2){const ok=Math.abs((p.y||0)-me.y)<1.6&&(r.it?G.pickup(a,r):(G.openCrate(a,r),true));if(!ok)ai.ignore.add(r);ai.goal=null;ai.goalRef=null;ai.path=null;ai.goalKind='';return;}}}
 if(!ai.goal||ai.goalKind!=='loot'||!ai.path){let bl=null,bs=1e9;for(const l of G.loot){if(l.lvl>0||!l.settled||ai.ignore.has(l))continue;const d=Math.abs(l.p.x-me.x)+Math.abs(l.p.z-me.z);if(d>55||d>=bs)continue;if(!wantsItem(a,l.it))continue;if(Math.hypot(l.p.x-gas.next.x,l.p.z-gas.next.z)>gas.next.r&&gas.state==='shrink')continue;bs=d;bl=l;}
  for(const c of G.crates){if(c.opened||c.lvl>0||c.y>1||ai.ignore.has(c))continue;const d=(Math.abs(c.x-me.x)+Math.abs(c.z-me.z))*.6;if(d<45&&d<bs){bs=d;bl=c;}}
  if(bl){const p=bl.p||bl;setGoal(a,p.x,p.z,G,'loot',bl);planPath(a,G);return;}
  // nothing nearby: roam toward a random spot inside the next circle
  if(!ai.path||ai.pi>=(ai.path?ai.path.length:0)){const an=Math.random()*Math.PI*2,rad=Math.sqrt(Math.random())*Math.min(gas.next.r*.8,150);let gx=me.x*.5+(gas.next.x+Math.cos(an)*rad)*.5,gz=me.z*.5+(gas.next.z+Math.sin(an)*rad)*.5;setGoal(a,gx,gz,G,'roam');planPath(a,G);}}
}

// ---- rovers: pick a free one, then drive it (called from carTick with the bot as driver)
// a free rover within R that is roughly on the way (walk to it + its distance to the circle centre <= 1.45x the direct trip)
function freeCar(a,G,R,n,dn){let best=null,bd=R;for(const c of G.cars){if(c.dead||c.driver||c.hp<200||Math.abs(c.pos.y-a.pos.y)>1.5)continue;if(c.claim&&c.claim!==a&&c.claim.alive&&G.time-c.claimT<3)continue;const d=Math.hypot(c.pos.x-a.pos.x,c.pos.z-a.pos.z);if(d<bd&&d+Math.hypot(c.pos.x-n.x,c.pos.z-n.z)<dn*1.45){bd=d;best=c;}}return best;}
// steers along a path on the car nav grid (walls grown by a rover half-width), feeler rays avoid corners, reverses out when stuck,
// swerves into enemies on foot; returns {thr,st,exit} where exit names why the bot gets out
export function driveBot(a,c,G,dt){const ai=a.ai,gas=G.gas,nv=G.cnav,p=c.pos,S=G.stats.rover;let dv=ai.dv;
 if(!dv)dv=ai.dv={goal:null,gk:'',path:null,pi:0,pathT:-99,stuckT:0,revT:0,stuckN:0,t0:G.time,prey:null,preyT:0,preyCD:0,scanT:0,chkT:4,chk:p.clone(),stop:''};
 a.yaw=c.yaw;a.pitch=0;const o={thr:0,st:0,exit:''};
 // goal: well inside the next circle, on the side we come from
 const gk=gas.next.x+','+gas.next.z+','+gas.next.r;if(dv.gk!==gk){const dx=p.x-gas.next.x,dz=p.z-gas.next.z,l=Math.hypot(dx,dz)||1,k=Math.min(l,gas.next.r*.45);let gx=gas.next.x+dx/l*k,gz=gas.next.z+dz/l*k;const q=nv.randomNear(gx,gz,12);if(q){gx=q[0];gz=q[1];}dv.goal=new V(gx,0,gz);dv.gk=gk;dv.path=null;}
 const dGoal=Math.hypot(dv.goal.x-p.x,dv.goal.z-p.z),dn=Math.hypot(p.x-gas.next.x,p.z-gas.next.z),hurt=G.time-ai.hurtT<.4;
 // reasons to get out: wrecked, heavy fire, arrived, stuck, too long
 if(!dv.stop){if(c.hp<170)dv.stop='wreck';else if(hurt&&a.hp+a.armor<60)dv.stop='fire';else if(dGoal<16||(G.time-dv.t0>3&&dn<gas.next.r*.6))dv.stop='goal';else if(dv.stuckN>=4)dv.stop='stuck';else if(G.time-dv.t0>75)dv.stop='time';}
 if(dv.stop){if(Math.abs(c.v)>4&&dv.stop!=='wreck'&&dv.stop!=='fire'){o.thr=c.v>0?-1:1;return o;}o.exit=dv.stop;return o;}
 // path on the car grid toward an intermediate point at most ~150 m away
 if((!dv.path||dv.pi>=dv.path.length||G.time-dv.pathT>6)&&G.pathBudget>0){G.pathBudget--;dv.pathT=G.time;let tx=dv.goal.x,tz=dv.goal.z;if(dGoal>150){tx=p.x+(tx-p.x)/dGoal*150;tz=p.z+(tz-p.z)/dGoal*150;}const pa=nv.path(p.x,p.z,tx,tz,16000);dv.path=pa&&pa.length?pa:[[tx,tz]];dv.pi=0;}
 let tx=dv.goal.x,tz=dv.goal.z,last=true;if(dv.path&&dv.pi<dv.path.length){while(dv.pi<dv.path.length-1&&Math.hypot(dv.path[dv.pi][0]-p.x,dv.path[dv.pi][1]-p.z)<6)dv.pi++;const w=dv.path[dv.pi];tx=w[0];tz=w[1];last=dv.pi>=dv.path.length-1;if(Math.hypot(tx-p.x,tz-p.z)<4)dv.pi++;}
 // roadkill: swerve into an enemy on foot ahead
 if((dv.scanT-=dt)<=0){dv.scanT=.25;let bp=null,bd=30;if(G.time>dv.preyCD&&c.v>6)for(const b of G.actors){if(b===a||!b.alive||b.car||b.inGulag||b.state!=='ground'||Math.abs(b.pos.y-p.y)>1.2)continue;const dx=b.pos.x-p.x,dz=b.pos.z-p.z,d=Math.abs(dx)+Math.abs(dz);if(d>bd*1.4)continue;const e=Math.hypot(dx,dz);if(e<bd&&e>2.5&&Math.abs(angD(c.yaw,Math.atan2(dx,dz)))<.65&&nv.walkable(p.x,p.z,b.pos.x,b.pos.z)){bd=e;bp=b;}}
  if(bp!==dv.prey){dv.prey=bp;dv.preyT=G.time;}}
 if(dv.prey&&dv.prey.alive&&!dv.prey.car){if(G.time-dv.preyT>3.5){dv.prey=null;dv.preyCD=G.time+6;}else{tx=dv.prey.pos.x+dv.prey.vel.x*.25;tz=dv.prey.pos.z+dv.prey.vel.z*.25;last=false;}}
 const want=Math.atan2(tx-p.x,tz-p.z),err=angD(c.yaw,want),dT=Math.hypot(tx-p.x,tz-p.z);
 // feelers on the car grid
 const fl=(an,d)=>nv.free(p.x+Math.sin(c.yaw+an)*d,p.z+Math.cos(c.yaw+an)*d);let av=0,wall=false;if(c.v>2&&!dv.prey){const L=3.5+c.v*.3;if(!fl(.42,L))av-=1;if(!fl(-.42,L))av+=1;if(!av&&!fl(0,L))av=err>=0?1:-1;wall=!fl(0,L*1.6)||!fl(0,L*.8);}
 // stuck: low speed under throttle, or no progress over 4 s -> back out and replan
 if(dv.revT>0){dv.revT-=dt;o.thr=-1;o.st=err>0?-1:1;return o;}
 let tgt=(last&&dT<25?10:27)-Math.min(1,Math.abs(err)/1.1)*17-(av?6:0);if(wall)tgt=Math.min(tgt,9);
 // brake ahead of a sharp corner at the next waypoint
 if(!last&&!dv.prey&&dT<c.v*1.4+4){const w2=dv.path[dv.pi+1];if(w2){const tn=Math.abs(angD(want,Math.atan2(w2[0]-tx,w2[1]-tz)));tgt=Math.min(tgt,27-Math.min(1,tn/1.4)*19);}}o.thr=c.v<tgt-1?1:c.v>tgt+3?-.7:0;o.st=Math.max(-1,Math.min(1,err*2.2+av*.9));
 if(o.thr>0&&Math.abs(c.v)<1.5)dv.stuckT+=dt;else dv.stuckT=Math.max(0,dv.stuckT-dt*.5);
 if((dv.chkT-=dt)<=0){dv.chkT=4;if(p.distanceTo(dv.chk)<6)dv.stuckT=9;dv.chk.copy(p);}
 if(dv.stuckT>1.1){dv.stuckT=0;dv.revT=rr(1,1.6);dv.stuckN++;S.stuck++;dv.path=null;dv.pathT=-99;dv.chkT=4+dv.revT;}
 else if(Math.abs(c.v)>8)dv.stuckN=Math.max(0,dv.stuckN-dt*.1);
 return o;}

// a bot heard gunfire or took damage
export function hearShot(a,src,G){if(!a.ai||a===src)return;const d=a.pos.distanceTo(src.pos);if(d<(src.loud||120)){a.ai.heard=src.pos.clone();a.ai.heardT=G.time;}}
export function botHurt(a,src,G){if(!a.ai)return;a.ai.hurtT=G.time;if(src&&src!==a){a.ai.attacker=src;if(!a.ai.target||!a.ai.target.alive||G.time-a.ai.seenT>1)a.ai.target=src;a.ai.last=src.pos.clone();a.ai.lastT=G.time;}}
