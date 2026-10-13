// STARWARDEN — CPU brains. Fireteam guardians (allies, and the autopilot used by tests/attract) drive the same input struct as the
// player: perception, smoothed aim with drifting error, element-matched weapon choice, abilities, revives, objective/follow goals
// and A* path following. Enemies: idle patrols that wake as a group, ranged troops that hold distance and strafe, melee rushers,
// shield-bearing majors that blink, slow heavies.
import {V,cl,wrapA,rnd,damp} from './util.js';
import {ARCH} from './loot.js';
import {PHY} from './world.js';

export const DIFF=[
 {n:'ADEPT',lvl:-10,hp:.85,dmg:.8,acc:.65,rate:.8,aggro:.7,ally:{err:.04,track:7,react:.35},drop:0,pts:1},
 {n:'VETERAN',lvl:0,hp:1,dmg:1,acc:.8,rate:1,aggro:1,ally:{err:.035,track:7.5,react:.3},drop:1,pts:1.5},
 {n:'LEGEND',lvl:15,hp:1.35,dmg:1.45,acc:1,rate:1.25,aggro:1.3,ally:{err:.03,track:8.5,react:.25},drop:2,pts:2.3}];
export const ALLY_NAMES=['CASSIA-7','ORRIN VALE','THESSALY','KADE-9','IONA','BRAMBLE','SOREN','MIRE-4'];
const PREF={auto:[0,35],pulse:[6,50],scout:[14,80],hand:[0,28],smg:[0,15],shot:[0,9],snipe:[14,160],fusion:[0,18],rocket:[8,70]};
const tv=new V(),tv2=new V();
export function newBrain(o={}){return{target:null,seenT:0,lostT:9,lastPos:new V(),path:null,pi:0,goal:null,goalP:new V(),goalT:0,stuckT:0,stuckP:new V(),stuck:0,strafe:1,strafeT:0,
 errP:Math.random()*100,thinkT:0,waitLand:0,meleeCD:0,nadeCD:2+rnd(3),supCD:0,selT:0,flinch:0,jHeld:false,auto:!!o.auto,...o};}

/* ---------------- guardians ---------------- */
export function thinkGuardian(f,G,dt){const b=f.ai,d=G.dif.ally,W=G.W,inp=f.inp;for(const k in inp)inp[k]=typeof inp[k]==='number'?0:false;inp.sel=-1;
 if(!f.alive||f.downed)return;b.meleeCD-=dt;b.nadeCD-=dt;b.supCD-=dt;
 b.thinkT-=dt;if(b.thinkT<=0){b.thinkT=.14+rnd(.06);perceiveG(f,G);}
 const t=b.target&&b.target.alive&&!b.target.dead?b.target:null;if(!t)b.target=null;const vis=t&&b.lostT<.05;if(vis)b.seenT+=dt;else b.seenT=Math.max(0,b.seenT-dt*2);
 const eye=tv.set(f.pos.x,f.pos.y+PHY.eye,f.pos.z);const dist=t?t.pos.distanceTo(f.pos):99;
 /* weapon choice */
 const w=f.weapons[f.wi],A=w&&w.st;b.selT-=dt;
 if(t&&b.selT<=0&&f.swapT<=0&&f.reloadT<=0){b.selT=.8;let best=f.wi,bs=-99;f.weapons.forEach((x,i)=>{if(!x||x.mag+x.res<=0)return;const p=PREF[x.it.a];let s=(dist>=p[0]&&dist<=p[1]?2:0)-Math.max(0,p[0]-dist)*.15-Math.max(0,dist-p[1])*.06;
   if(t.shield>0&&t.shEl===x.it.el)s+=3;if(i===2)s+=(t.boss||t.kind==='heavy'?2.2:t.kind==='major'?.8:-1.5)+(t.boss&&t.exposed?2:0);if(x.mag===0)s-=1;if(i===f.wi)s+=.6;if(s>bs){bs=s;best=i;}});
  if(best!==f.wi)inp.sel=best;}
 if(w&&f.reloadT<=0&&f.swapT<=0&&inp.sel<0){if(w.mag===0&&w.res>0)inp.reload=true;else if(!vis&&b.lostT>1.5&&w.mag<A.mag*.5&&w.res>0)inp.reload=true;else if(w.mag===0&&w.res===0)inp.sel=(f.wi+1)%2;}
 /* aim */
 let aimOk=false;
 if(t&&(vis||b.lostT<1)){const tp=tv2.copy(vis?t.pos:b.lastPos);tp.y+=t.aimY*(b.hs?1.12:.8);if(vis&&A&&!A.proj){tp.x+=t.vel.x*.08;tp.z+=t.vel.z*.08;}if(A&&A.proj){tp.x+=t.vel.x*dist/A.speed;tp.z+=t.vel.z*dist/A.speed;tp.y-=t.aimY*.5;}
  b.errP+=dt*1.4;const settle=1/(1+b.seenT*1.6);const e=d.err*(.5+settle*1.2+b.flinch*1.2);const ex=Math.sin(b.errP*1.7)+Math.sin(b.errP*3.1+1.3)*.5,ey=Math.sin(b.errP*2.3+2)*.6;
  const dx=tp.x-eye.x,dy=tp.y-eye.y,dz=tp.z-eye.z,hd=Math.hypot(dx,dz);const wy=Math.atan2(-dx,-dz)+ex*e,wp=Math.atan2(dy,hd)+ey*e*.7;
  const k=1-Math.exp(-d.track*dt),mx=6*dt;f.yaw+=cl(wrapA(wy-f.yaw)*k,-mx,mx);f.pitch=cl(f.pitch+cl((wp-f.pitch)*k,-mx,mx),-1.45,1.45);
  const err=Math.abs(wrapA(wy-f.yaw))+Math.abs(wp-f.pitch);const cone=(A?.pel?.1:A?.proj?.08:.05)+Math.atan2(t.r*.9,Math.max(1,dist));aimOk=err<cone;}
 else if(b.path&&b.path[b.pi]){const n=b.path[b.pi].n;const dx=n.x-f.pos.x,dz=n.z-f.pos.z;if(dx*dx+dz*dz>.5)f.yaw+=wrapA(Math.atan2(-dx,-dz)-f.yaw)*(1-Math.exp(-dt*5));f.pitch=damp(f.pitch,0,3,dt);}
 /* fire + abilities */
 b.flinch=Math.max(0,(b.flinch||0)-dt);
 if(t&&vis&&A&&b.seenT>d.react&&f.swapT<=0&&!(t.immune)){if(dist<A.range*1.05&&aimOk)inp.fire=true;if(A.zoom>2&&dist>16)inp.zoom=true;if(A.charge&&dist<A.range)inp.fire=aimOk||f.chargeT>0;}
 if(t&&vis&&!t.immune){const near=G.foes.filter(o=>o.alive&&o.pos.distanceTo(t.pos)<6).length;
  if(f.nadeT<=0&&b.nadeCD<=0&&dist>5&&dist<28&&(near>=2||t.kind!=='grunt'&&t.kind!=='rusher')){inp.nade=true;b.nadeCD=1.5+rnd(3);}
  const mr=f.cls==='strider'?8:f.cls==='seer'?11:3.4;if(f.meleeCD2<=0&&b.meleeCD<=0&&dist<mr&&(dist<3||Math.random()<dt*2)){inp.melee=true;b.meleeCD=1.5;}
  if(f.superK>=1&&b.supCD<=0){const crowd=G.foes.filter(o=>o.alive&&!o.immune&&o.pos.distanceTo(f.pos)<24).length;if(crowd>=4||t.boss&&(t.exposed||Math.random()<dt*.15)||t.kind==='heavy'&&dist<25){inp.sup=true;b.supCD=4;}}}
 /* goals */
 b.goalT-=dt;const goal=G.goalFor(f);if(goal&&(b.goalT<=0||!b.path||goal.p.distanceTo(b.goalP)>4)){b.goalT=1+rnd(1);b.goalP.copy(goal.p);b.goal=goal;const path=W.path(f.pos,goal.p,4000);b.path=path&&path.length?path:null;b.pi=0;}
 const mv=new V();let wantJump=false,wantJet=false,sprint=false;if(b.waitLand>0)b.waitLand-=dt;
 const gd=goal?Math.hypot(goal.p.x-f.pos.x,goal.p.z-f.pos.z):0,arrive=goal?goal.r||1.5:0;
 const node=b.path&&b.path[b.pi];
 if(node&&gd>arrive&&b.waitLand<=0){const n=node.n,dx=n.x-f.pos.x,dz=n.z-f.pos.z,hd=Math.hypot(dx,dz),dy=n.y-f.pos.y;mv.set(dx,0,dz);if(hd>.01)mv.divideScalar(hd);
  if(node.t===2&&hd<1.8&&f.onGround)wantJump=true;if(node.t===3){if(f.onGround&&hd<2.2)wantJump=true;if(!f.onGround&&f.pos.y<n.y+.6)wantJet=true;}
  if(hd<(node.t===0?1:.8)&&dy<1.3&&dy>-(node.t===1?20:1.4)){b.pi++;if(b.pi>=b.path.length)b.path=null;}sprint=!t&&hd>3&&gd>10;}
 else if(goal&&gd>arrive){mv.set(goal.p.x-f.pos.x,0,goal.p.z-f.pos.z).normalize();}
 if(goal&&goal.revive&&gd<1.9){mv.set(0,0,0);inp.interact=true;}
 // combat footwork: strafe around while holding the goal
 if(t&&vis&&!(goal&&goal.revive)){b.strafeT-=dt;if(b.strafeT<=0){b.strafe=Math.random()<.5?-1:1;b.strafeT=.5+rnd(1.2);}const toT=tv2.subVectors(t.pos,f.pos).setY(0).normalize();const side=new V(-toT.z,0,toT.x);
  const p=PREF[w?w.it.a:'auto'];let adv=dist>p[1]?.8:dist<Math.max(3,p[0])?-.6:0;const c=new V().addScaledVector(side,b.strafe*.7).addScaledVector(toT,adv);if(gd>arrive*2)c.lerp(mv,.65);mv.copy(c);
  if(f.onGround&&Math.random()<dt*.5)wantJump=true;}
 b.stuckT+=dt;if(b.stuckT>1.1){const moved=f.pos.distanceTo(b.stuckP);b.stuckP.copy(f.pos);b.stuckT=0;if(moved<.6&&mv.lengthSq()>.1&&!inp.interact){b.stuck++;wantJump=true;if(b.stuck>2){b.path=null;b.goalT=0;b.stuck=0;b.strafe*=-1;}}else b.stuck=0;}
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);inp.fwd=cl(-(mv.x*sy+mv.z*cy),-1,1);inp.side=cl(mv.x*cy-mv.z*sy,-1,1);inp.sprint=sprint&&inp.fwd>.7;
 if(wantJump){if(f.onGround||!b.jHeld)inp.jumpEdge=true;}if(wantJump||wantJet)inp.jump=true;b.jHeld=inp.jump;}
function perceiveG(f,G){const b=f.ai,W=G.W;let best=null,bs=1e9;const eye=new V(f.pos.x,f.pos.y+PHY.eye,f.pos.z);
 for(const o of G.foes){if(!o.alive||o.spawnT>0)continue;const dist=o.pos.distanceTo(f.pos);if(dist>75)continue;if(o.immune&&!o.pylon&&G.foes.some(x=>x.alive&&!x.immune&&x.pos.distanceTo(f.pos)<60))continue;
  const tp=new V(o.pos.x,o.pos.y+o.aimY,o.pos.z);if(!W.los(eye,tp)){tp.y=o.pos.y+o.aimY*.5;if(!W.los(eye,tp))continue;}
  let s=dist+(o===b.target?-6:0)-(o.pylon?14:0)-(o.boss&&o.exposed?30:0)+(o.immune?60:0)-(o.target===G.me?4:0)-(o.kind==='rusher'&&dist<10?8:0);if(s<bs){bs=s;best=o;}}
 if(best){if(best!==b.target){b.target=best;b.seenT=0;b.hs=Math.random()<.4;}b.lostT=0;b.lastPos.copy(best.pos);}else{b.lostT+=.15;if(b.target&&b.lostT>3)b.target=null;}}

/* ---------------- enemies ---------------- */
// foe: {kind,pos,vel,yaw,pitch,onGround,home,aware,target,path,pi,fireT,burst,atkT,stagger,...}
export function thinkFoe(e,G,dt){const dif=G.dif,W=G.W;e.thinkT-=dt;e.fireT-=dt;e.atkT=Math.max(0,e.atkT-dt);e.stagger=Math.max(0,e.stagger-dt);e.blinkCD-=dt;
 if(e.thinkT<=0){e.thinkT=.2+rnd(.15);let best=null,bs=1e9;const eye=new V(e.pos.x,e.pos.y+e.aimY,e.pos.z);
  for(const g of G.team){if(!g.alive||g.downed)continue;const dd=g.pos.distanceTo(e.pos);if(dd>(e.aware?70:24*dif.aggro))continue;if(!W.los(eye,new V(g.pos.x,g.pos.y+1.4,g.pos.z)))continue;const s=dd-(g===e.lastHitBy?10:0)-(g===G.me?3:0);if(s<bs){bs=s;best=g;}}
  if(best){e.target=best;e.seen=true;e.lastSeen=G.time;e.lastPos.copy(best.pos);if(!e.aware)G.alertGroup(e);e.aware=true;}else{e.seen=false;if(e.target&&(!e.target.alive||e.target.downed))e.target=null;}}
 const t=e.target;const mv=new V();let spd=e.speed;
 if(!e.aware){// patrol: amble around home
  e.wanderT-=dt;if(e.wanderT<=0){e.wanderT=3+rnd(4);e.wander=new V(e.home.x+rnd(8)-4,e.home.y,e.home.z+rnd(8)-4);}if(e.wander){mv.set(e.wander.x-e.pos.x,0,e.wander.z-e.pos.z);if(mv.length()<.8)mv.set(0,0,0);else mv.normalize().multiplyScalar(.35);}}
 else if(t){const dist=Math.hypot(t.pos.x-e.pos.x,t.pos.z-e.pos.z);const toT=tv.set(t.pos.x-e.pos.x,0,t.pos.z-e.pos.z).normalize();
  if(e.kind==='rusher'){if(e.seen&&dist<12||!e.path){mv.copy(toT);}if(dist<1.9&&e.atkT<=0&&e.stagger<=0){e.atkT=.5;e.hitDone=false;}if(e.atkT>.15&&e.atkT<.3&&!e.hitDone&&dist<2.4){e.hitDone=true;G.foeMelee(e,t);}spd*=e.atkT>0?.3:1;}
  else{const pr=e.pref;if(e.seen){e.strafeT-=dt;if(e.strafeT<=0){e.strafeT=1+rnd(1.6);e.strafe=Math.random()<.5?-1:1;if(Math.random()<.25)e.strafe=0;}
    const side=tv2.set(-toT.z,0,toT.x);mv.addScaledVector(side,e.strafe*.6).addScaledVector(toT,dist>pr[1]?.9:dist<pr[0]?-.7:0);spd*=.7;
    if(e.kind==='heavy'&&dist<5&&e.atkT<=0){e.atkT=.9;e.hitDone=false;}if(e.kind==='heavy'&&e.atkT>.3&&e.atkT<.45&&!e.hitDone){e.hitDone=true;G.foeSlam(e);}}
   else if(G.time-e.lastSeen>1.5){mv.copy(toT);}}
  // shooting: bursts with reaction + accuracy by difficulty
  if(e.seen&&e.kind!=='rusher'&&e.fireT<=0&&e.stagger<=0&&dist<e.range&&e.atkT<=0){if(e.burst<=0){e.burst=e.burstN;}G.foeShoot(e,t);e.burst--;e.fireT=e.burst>0?e.gap:e.cool*(.8+rnd(.6))/dif.rate;}
  // majors blink away when hurt
  if(e.kind==='major'&&e.blinkCD<=0&&e.hurtT<.3){e.blinkCD=5+rnd(4);G.foeBlink(e);}
  // path toward the target when out of sight
  if(!e.seen||e.kind==='rusher'){e.pathT-=dt;if(e.pathT<=0){e.pathT=.9+rnd(.6);const p=W.path(e.pos,e.lastPos,2500);e.path=p&&p.length?p:null;e.pi=0;}
   const n=e.path&&e.path[e.pi];if(n&&(!e.seen||dist>6)){const dx=n.n.x-e.pos.x,dz=n.n.z-e.pos.z,hd=Math.hypot(dx,dz);mv.set(dx/(hd||1),0,dz/(hd||1));if(hd<1)e.pi++;if(n.t>=2&&hd<1.8&&e.onGround)e.vel.y=PHY.jump*.95;}}}
 if(mv.lengthSq()>1)mv.normalize();if(e.stagger>0)mv.multiplyScalar(.2);
 const k=Math.min(1,dt*(e.onGround?9:1.5));e.vel.x+=(mv.x*spd-e.vel.x)*k;e.vel.z+=(mv.z*spd-e.vel.z)*k;
 // facing: target when engaged, else travel direction
 let wy=e.yaw;if(t&&(e.seen||e.kind==='rusher')){wy=Math.atan2(-(t.pos.x-e.pos.x),-(t.pos.z-e.pos.z));const dy=t.pos.y+1.2-(e.pos.y+e.aimY),hd=Math.hypot(t.pos.x-e.pos.x,t.pos.z-e.pos.z);e.pitch=damp(e.pitch,Math.atan2(dy,hd),6,dt);}
 else if(Math.hypot(e.vel.x,e.vel.z)>.4)wy=Math.atan2(-e.vel.x,-e.vel.z);e.yaw+=wrapA(wy-e.yaw)*Math.min(1,dt*(e.kind==='heavy'?3:7));}
