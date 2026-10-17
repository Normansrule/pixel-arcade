// SILENT CONTRACT — NPC brains. Routines (go to a spot, act for a while, loop), bodyguards that follow, perception of the player
// (vision cone + line of sight, darkness, enforcers who see through a disguise, trespass and illegal actions feeding a suspicion
// meter), reactions (investigate a noise, turn off a radio, repair a fuse box, find a body, report to a guard, flee, cower, search,
// combat with pistols), and the two targets' scripted visits with their opportunity hooks.
import * as THREE from '../vendor/three.module.min.js';
import {ALLOW,HOSTILE} from './level.js';
const V=THREE.Vector3,PI=Math.PI,cl=(v,a,b)=>v<a?a:v>b?b:v;
export const angDiff=(a,b)=>{let d=a-b;while(d>PI)d-=2*PI;while(d<-PI)d+=2*PI;return d;};
export const yawTo=(dx,dz)=>Math.atan2(dx,dz);
// difficulty: suspicion speed, guard damage/accuracy, vision range, reaction time
export const DIFF=[{name:'EASY',sus:.55,dmg:6,acc:.4,range:.8,react:1.1,time:900,hp:140,find:.6},{name:'NORMAL',sus:1,dmg:9,acc:.5,range:1,react:.75,time:720,hp:100,find:1},{name:'HARD',sus:1.55,dmg:12,acc:.6,range:1.15,react:.5,time:600,hp:100,find:1.4}];

export class NPC{
 constructor(o){Object.assign(this,{id:o.id,role:o.role,kind:o.kind,name:o.name||'',pos:new V(o.x,0,o.z),yaw:o.yaw||0,routine:o.routine||[],ri:0,wait:o.wait??0,act:o.act||'idle',baseAct:o.act||'idle',
  state:'routine',path:null,pi:0,goal:null,speed:o.speed||1.35,sus:0,susShown:0,alive:true,ko:false,hidden:false,dragged:false,hp:o.hp||100,enforcer:!!o.enforcer,target:o.target||null,
  follow:o.follow??null,yOff:o.yOff||0,lastSeen:null,t:0,stT:0,seeT:0,reportTo:null,witness:false,fireT:0,aimK:0,heard:null,task:null,found:new Set(),warned:0,spot:{x:o.x,z:o.z,yaw:o.yaw||0},
  noticeBody:null,vy:0,falling:0,dieAct:null,dieT:0,lieFace:1,deathCause:null,looksAt:null,spd:0});this.y=0;}
 get isGuard(){return this.kind==='guard';}
 get down(){return!this.alive||this.ko;}
}

/* ---------- movement */
export function goTo(G,n,x,z){const L=G.L;if(n.goal&&Math.hypot(n.goal.x-x,n.goal.z-z)<.3&&n.path)return;n.goal={x,z};n.path=G.pathFor(n.pos.x,n.pos.z,x,z);n.pi=0;}
function step(G,n,dt,speed){if(!n.path||n.pi>=n.path.length){n.spd=0;return true;}const p=n.path[n.pi],dx=p.x-n.pos.x,dz=p.z-n.pos.z,d=Math.hypot(dx,dz);
 if(d<.25){n.pi++;if(n.pi>=n.path.length){n.spd=0;return true;}return false;}const v=Math.min(d,speed*dt);n.pos.x+=dx/d*v;n.pos.z+=dz/d*v;n.spd=speed;
 const ty=yawTo(dx,dz);n.yaw+=angDiff(ty,n.yaw)*Math.min(1,dt*8);return false;}
function face(n,yaw,dt){n.yaw+=angDiff(yaw,n.yaw)*Math.min(1,dt*5);}
function arrive(G,n,dt,x,z,speed){if(!n.goal||Math.hypot(n.goal.x-x,n.goal.z-z)>.3)goTo(G,n,x,z);const done=step(G,n,dt,speed);if(done&&Math.hypot(n.pos.x-x,n.pos.z-z)>.6&&n.path&&n.path.length){n.goal=null;}return done;}

/* ---------- perception */
const tv=new V();
export function canSee(G,n,px,py,pz,rangeK=1){const L=G.L,dx=px-n.pos.x,dz=pz-n.pos.z,d=Math.hypot(dx,dz);let range=(n.isGuard?21:15)*G.diff.range*rangeK;
 if(G.darkAt(px,pz)||G.darkAt(n.pos.x,n.pos.z))range=Math.min(range,4.5);if(d>range)return 0;const eyeY=n.y+1.6,dy=py-eyeY;if(Math.abs(dy)>6)return 0;
 const a=Math.abs(angDiff(yawTo(dx,dz),n.yaw)),fov=n.isGuard?1.05:1.15;if(a>fov&&d>(n.isGuard?2.2:1.4))return 0;
 if(!L.los(n.pos.x,eyeY,n.pos.z,px,py,pz))return 0;return cl(1.35-d/range,.25,1.35)*(a>fov*.6?.6:1);}

// suspicion the player's situation causes for this npc (per second, before distance factor)
function threat(G,n){const P=G.player,dis=P.disguise,z=G.L.zoneAt(P.pos.x,P.pos.z);let r=0,illegal=false,why='';
 if(P.hidden)return{r:0};
 if(P.illegal){illegal=true;r=n.isGuard?3.2:2.4;why=P.illegal;}
 else{const ok=ALLOW[dis]||[0];if(!ok.includes(z)){r=Math.max(r,HOSTILE.includes(z)?(n.isGuard?1.5:.5):(n.isGuard?.8:.35));why='trespass';}
  if(n.enforcer&&n.enforcerOf===dis&&dis!=='suit'){const d=n.pos.distanceTo(P.pos);if(d<7){r=Math.max(r,(n.isGuard?1:.8)*(1.4-d/7));why=why||'enforcer';}}
  if(G.compromised&&G.compromised===dis&&n.isGuard){r=Math.max(r,1.6);why='compromised';}
  const d=n.pos.distanceTo(P.pos);if(P.running&&d<7&&!why){r=Math.max(r,.18);why='running';}if(P.crouch&&P.moving&&d<6&&!why&&z!==0){r=Math.max(r,.12);why='sneaking';}
  if(P.sus&&d<12){r=Math.max(r,P.sus);why=why||'act';}}
 return{r,illegal,why};}

/* ---------- reactions */
export function hear(G,x,z,radius,kind,o={}){// noises pull nearby npcs that are not busy
 const ls=[];for(const n of G.npcs){if(n.down||n.state==='combat'||n.state==='flee'||n.state==='cower'||n.role==='target'&&kind!=='crash')continue;const d=Math.hypot(n.pos.x-x,n.pos.z-z);if(d>radius)continue;
  const thru=G.L.los(n.pos.x,n.y+1.6,n.pos.z,x,(G.L.h(x,z)||0)+.5,z);if(!thru&&d>radius*.5)continue;ls.push([d,n]);}
 ls.sort((a,b)=>a[0]-b[0]);
 if(kind==='coin'){let k=0;for(const[,n]of ls){if(k>=1)break;if(n.task)continue;n.task={kind:'look',x,z,t:0};n.state='task';k++;n.say='?';}}
 else if(kind==='radio'){const n=ls.find(([,n])=>!n.task&&n.role!=='guest')||ls.find(([,n])=>!n.task);if(n){n[1].task={kind:'radio',x:o.use.x,z:o.use.z,use:o.use,t:0};n[1].state='task';n[1].say='?';}}
 else if(kind==='shot'||kind==='crash'||kind==='scream'||kind==='thud'){for(const[,n]of ls){if(n.isGuard){if(kind==='crash'||kind==='scream'||kind==='shot'){n.task={kind:'look',x,z,t:0,run:kind!=='thud'};n.state='task';n.say='!';}}
   else if(kind==='shot'||kind==='scream'){if(n.role!=='target'){n.state='cower';n.stT=0;}}else if(kind==='crash'){n.task={kind:'gawk',x,z,t:0};n.state='task';}}}}
export function fuseFixer(G,use){let best=null,bd=1e9;for(const n of G.npcs){if(n.down||n.task||n.state!=='routine'||n.role==='target'||n.role==='guest'||n.follow!=null)continue;const d=Math.hypot(n.pos.x-use.x,n.pos.z-use.z);if(d<bd&&d<45){bd=d;best=n;}}
 if(best){best.task={kind:'fuse',x:use.x+(use.x<0?-.7:.7),z:use.z,use,t:0};best.state='task';best.say='?';}return best;}
export function alertGuards(G,x,z,radius,why){let k=0;for(const n of G.npcs){if(!n.isGuard||n.down||n.state==='combat')continue;if(Math.hypot(n.pos.x-x,n.pos.z-z)>radius)continue;n.state='search';n.searchAt={x,z};n.stT=0;n.task=null;k++;}return k;}
function nearestGuard(G,n){let best=null,bd=1e9;for(const g of G.npcs){if(!g.isGuard||g.down)continue;const d=g.pos.distanceTo(n.pos);if(d<bd){bd=d;best=g;}}return best;}
export function enterCombat(G,n){if(n.state!=='combat'){n.state='combat';n.stT=0;n.task=null;n.fireT=G.diff.react+Math.random()*.4;n.say='!';}G.combatT=0;G.combatEver=true;G.compromised=G.player.disguise;
 // nearby guards join
 for(const g of G.npcs)if(g.isGuard&&!g.down&&g!==n&&g.state!=='combat'&&g.pos.distanceTo(n.pos)<22){g.state='combat';g.stT=0;g.task=null;g.fireT=G.diff.react+.4+Math.random()*.6;}}

/* ---------- per-frame brain */
export function think(G,n,dt){if(n.hidden)return;n.t+=dt;n.stT+=dt;if(n.say&&n.stT>2.5)n.say=null;
 if(n.dieAct){n.dieT+=dt;n.act=n.dieAct;n.spd=0;if(n.dieAct==='flail'&&n.dieT>.35){n.vy-=9.8*dt;n.fallY=(n.fallY??n.y)+n.vy*dt;n.pos.z+=dt*1.4;}if(n.dieT>(n.dieDur||2.5)){n.dieAct=null;G.kill(n,n.deathCause,{silent:true,noBody:n.deathCause==='fall'});}return;}
 if(n.down){n.spd=0;return;}
 const P=G.player;
 // ---- perception of the player
 let see=0;if(!P.hidden&&!G.over)see=canSee(G,n,P.pos.x,P.pos.y+1.25,P.pos.z);n.seesPlayer=see>0;
 if(see){const th=threat(G,n);n.lastSeen={x:P.pos.x,z:P.pos.z};
  if(th.r>0){const before=n.sus;n.sus=Math.min(1,n.sus+th.r*see*G.diff.sus*dt*(n.state==='combat'?3:1));n.susWhy=th.why;if(th.illegal&&n.sus>.35)n.sus=1;
   if(n.sus>=1&&before<1)spotted(G,n,th);else if(n.sus>=1&&n.isGuard&&th.illegal&&n.state!=='combat')enterCombat(G,n);}
  else if(n.state!=='combat')n.sus=Math.max(0,n.sus-dt*.12);}
 else n.sus=Math.max(0,n.sus-dt*(n.state==='combat'?.04:.1));
 // ---- bodies in view
 if(!n.noticeBody&&n.state!=='combat'&&n.t%0.25<dt){for(const b of G.bodies){if(b.hidden||b.dragged&&!n.seesPlayer||n.found.has(b))continue;const d=Math.hypot(b.pos.x-n.pos.x,b.pos.z-n.pos.z);if(d>14*G.diff.find)continue;
   if(canSee(G,n,b.pos.x,b.y+.3,b.pos.z,.75)){n.found.add(b);if(b.dragged){continue;}bodySeen(G,n,b);break;}}}
 // ---- states
 switch(n.state){
  case 'routine':routine(G,n,dt);break;
  case 'task':task(G,n,dt);break;
  case 'investigate':{const s=n.lastSeen||n.searchAt;if(!s){n.state='routine';break;}n.act='search';const done=arrive(G,n,dt,s.x,s.z,2.2);
   if(n.seesPlayer&&n.pos.distanceTo(P.pos)<4.5&&n.sus>.6){const z=G.L.zoneAt(P.pos.x,P.pos.z);if(!(ALLOW[P.disguise]||[0]).includes(z)||G.compromised===P.disguise){n.warned+=dt;n.say='GET OUT';face(n,yawTo(P.pos.x-n.pos.x,P.pos.z-n.pos.z),dt);if(n.warned>3.5||HOSTILE.includes(z))enterCombat(G,n);}else{n.sus=Math.max(0,n.sus-dt*.5);}}
   if(done||n.stT>25){n.state='search';n.searchAt={x:n.pos.x,z:n.pos.z};n.stT=0;}break;}
  case 'search':{n.act='search';if(!n.searchPt||n.stT-n.searchPt.t>6){const s=n.searchAt||n.pos;n.searchPt={...G.L.randomWalk(s.x-7,s.z-7,s.x+7,s.z+7),t:n.stT};n.goal=null;}
   arrive(G,n,dt,n.searchPt.x,n.searchPt.z,1.8);if(n.stT>28){n.state='routine';n.searchPt=null;n.goal=null;n.sus=Math.min(n.sus,.3);}break;}
  case 'combat':combat(G,n,dt,see);break;
  case 'flee':{n.act='flee';const g=n.reportTo;if(!g||g.down){n.reportTo=nearestGuard(G,n);if(!n.reportTo){n.state='cower';break;}}
   const done=arrive(G,n,dt,n.reportTo.pos.x,n.reportTo.pos.z,4.2);if(done||n.pos.distanceTo(n.reportTo.pos)<2.2){const g2=n.reportTo;if(!g2.down){n.reported=true;
     if(n.reportWhat==='body'){g2.state='investigate';g2.lastSeen=n.reportAt;g2.stT=0;g2.task=null;}else{g2.state='investigate';g2.lastSeen=n.reportAt;g2.stT=0;g2.task=null;g2.sus=.8;if(n.reportWhat==='illegal'){G.reported(n);}}}
    n.state='cower';n.stT=0;}break;}
  case 'cower':{n.act='cower';n.spd=0;if(n.stT>18&&!G.combatNear(n)){n.state='routine';n.goal=null;}break;}
 }
 if(n.isGuard&&n.state!=='combat')n.aimK=Math.max(0,n.aimK-dt*3);}

function spotted(G,n,th){const P=G.player;n.say=th.illegal?'!':'?';G.onSpotted(n,th);
 if(n.isGuard){if(th.illegal||HOSTILE.includes(G.L.zoneAt(P.pos.x,P.pos.z))||th.why==='compromised')enterCombat(G,n);else{n.state='investigate';n.stT=0;n.warned=0;n.task=null;}}
 else{if(th.illegal){n.witness=true;n.state='flee';n.reportWhat='illegal';n.reportAt={x:P.pos.x,z:P.pos.z};n.reportTo=nearestGuard(G,n);n.stT=0;G.sfx('scream',n.pos);hear(G,n.pos.x,n.pos.z,14,'scream');}
  else{n.state='flee';n.reportWhat='sus';n.reportAt={x:P.pos.x,z:P.pos.z};n.reportTo=nearestGuard(G,n);n.stT=0;n.act='flee';}}}
function bodySeen(G,n,b){n.say='!';G.onBodyFound(b,n);
 if(n.isGuard){n.state='investigate';n.lastSeen={x:b.pos.x,z:b.pos.z};n.stT=0;n.task=null;alertGuards(G,b.pos.x,b.pos.z,24);}
 else{n.state='flee';n.reportWhat='body';n.reportAt={x:b.pos.x,z:b.pos.z};n.reportTo=nearestGuard(G,n);n.stT=0;G.sfx('scream',n.pos);}}

function routine(G,n,dt){
 // bodyguards shadow their principal
 if(n.follow!=null){const p=G.npcById[n.follow];if(!p||p.down){if(p&&p.down&&!n.mourn){n.mourn=1;alertGuards(G,p.pos.x,p.pos.z,30);}n.follow=null;n.routine=[{x:n.pos.x,z:n.pos.z,yaw:n.yaw,act:'search',dur:1e9}];n.ri=0;return;}
  const bx=p.pos.x-Math.sin(p.yaw)*1.8+Math.cos(p.yaw)*1.1,bz=p.pos.z-Math.cos(p.yaw)*1.8-Math.sin(p.yaw)*1.1;const d=Math.hypot(bx-n.pos.x,bz-n.pos.z);
  if(d>1.2){if(!n.goal||Math.hypot(n.goal.x-bx,n.goal.z-bz)>2)goTo(G,n,bx,bz);step(G,n,dt,d>5?3:Math.max(1.2,p.spd));n.act='idle';}else{n.spd=0;face(n,p.yaw,dt);n.act='idle';n.path=null;n.goal=null;}return;}
 const R=n.routine;if(!R.length){n.spd=0;n.act=n.baseAct;return;}const s=R[n.ri%R.length];
 if(!n.arrived){n.act=s.walkAct||(n.role==='waiter'?'tray':'idle');const done=arrive(G,n,dt,s.x,s.z,s.run?3.4:n.speed);if(done){n.arrived=true;n.wait=s.dur;n.stepT=0;if(s.on)G.event(s.on,n,s);}return;}
 n.spd=0;n.stepT=(n.stepT||0)+dt;if(s.yaw!=null)face(n,s.yaw,dt);n.act=s.act||n.baseAct;if(s.during)G.during(s.during,n,s,dt);
 n.wait-=dt;if(n.wait<=0&&R.length>1){if(s.off)G.event(s.off,n,s);n.ri=(n.ri+1)%R.length;n.arrived=false;n.goal=null;}}

function task(G,n,dt){const t=n.task;if(!t){n.state='routine';return;}t.t+=dt;const back=()=>{n.task=null;n.state='routine';n.arrived=false;n.goal=null;n.say=null;};
 if(t.kind==='look'||t.kind==='gawk'){if(!t.there){n.act='search';const d=Math.hypot(t.x-n.pos.x,t.z-n.pos.z);if(d<(t.kind==='gawk'?4:1.2)||arrive(G,n,dt,t.x,t.z,t.run?3.2:1.7)){t.there=true;t.t=0;}if(t.t>20)back();}
  else{n.spd=0;n.act=t.kind==='gawk'?'talk':'look';face(n,yawTo(t.x-n.pos.x,t.z-n.pos.z)+(t.kind==='look'?Math.sin(t.t)*.8:0),dt);if(t.t>(t.kind==='gawk'?8:5))back();}}
 else if(t.kind==='radio'){if(!t.there){n.act='idle';if(arrive(G,n,dt,t.x+(Math.sin(t.use.face||0)*.7),t.z+(Math.cos(t.use.face||0)*.7),1.9)||Math.hypot(t.x-n.pos.x,t.z-n.pos.z)<1.1){t.there=true;t.t=0;}if(t.t>25){t.use.on=false;back();}}
  else{n.spd=0;n.act='use';face(n,yawTo(t.x-n.pos.x,t.z-n.pos.z),dt);if(t.t>2.2){G.radioOff(t.use);back();}}}
 else if(t.kind==='fuse'){if(!t.there){n.act='idle';if(arrive(G,n,dt,t.x,t.z,2.2)||Math.hypot(t.x-n.pos.x,t.z-n.pos.z)<.9){t.there=true;t.t=0;}if(t.t>40){G.fuseFixed(t.use);back();}}
  else{n.spd=0;n.act='fix';face(n,yawTo(t.use.x-n.pos.x,t.use.z-n.pos.z),dt);if(t.t>9){G.fuseFixed(t.use);back();}}}
 else back();}

function combat(G,n,dt,see){const P=G.player;n.act='idle';if(!n.isGuard){n.state='cower';return;}const d=n.pos.distanceTo(P.pos);G.combatT=0;
 if(see){n.seeT=0;n.lastSeen={x:P.pos.x,z:P.pos.z};}else n.seeT+=dt;
 if(n.seeT>9){n.state='search';n.searchAt=n.lastSeen;n.stT=0;n.aimK=0;return;}
 const tgt=n.lastSeen||{x:P.pos.x,z:P.pos.z};
 if(see&&d<15){n.path=null;n.goal=null;n.spd=0;n.aimK=Math.min(1,n.aimK+dt*3);face(n,yawTo(P.pos.x-n.pos.x,P.pos.z-n.pos.z),dt*2);
  n.fireT-=dt;if(n.fireT<=0&&n.aimK>.7){n.fireT=.8+Math.random()*.6;G.npcShoot(n);}}
 else{n.aimK=Math.max(.3,n.aimK-dt);arrive(G,n,dt,tgt.x,tgt.z,3.6);if(see){n.fireT-=dt;if(n.fireT<=0&&d<24){n.fireT=.9+Math.random()*.6;G.npcShoot(n);}}}}
