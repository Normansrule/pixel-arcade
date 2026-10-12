// GLOSS RIOT — CPU crew. Bots drive the same input struct as the player. They read the ink map to pick turf to claim,
// sweep the floor with their weapon while walking A* paths, swim through friendly ink to travel and refill, duck into
// ink when hurt, duel with lead + drop compensation and human-like aim drift, lob bombs, and trigger INKQUAKE.
import {V,cl,wrapA,rnd,damp} from './util.js';
import {PHY} from './world.js';
import {WPN,BOMB} from './weapons.js';

export const BOTDIFF=[
 {n:'ROOKIE',react:.7,err:.11,track:3.4,turn:3,strafe:.3,bomb:.04,special:.35,hesit:.35,fov:.3,stealth:2.5,paint:.75},
 {n:'PRO',react:.4,err:.06,track:6,turn:5.5,strafe:.7,bomb:.13,special:.8,hesit:.12,fov:.1,stealth:3.5,paint:.9},
 {n:'ACE',react:.22,err:.03,track:10,turn:9,strafe:1,bomb:.28,special:1,hesit:0,fov:-.1,stealth:5,paint:1}];
export const NAMES=['FIZZ','NORI','PIP','DOT','ZIGGY','MOCHI','KIWI','BLOOP','SKIP','JUNE','TANGO','YUZU','PEBBLE','ROO','SUDS','MINT','JAX','LOLO','TAFFY','DASH','OPAL','WREN','BEANS','COCO'];

const tv=new V(),tv2=new V();
export function newBrain(d){return{d,target:null,seenT:0,lostT:9,lastPos:new V(),path:null,pi:0,goal:null,goalT:0,stuckT:0,stuckP:new V(),strafe:1,strafeT:0,errP:Math.random()*100,thinkT:0,
 bombCD:4+rnd(4),sweep:Math.random()*6,refill:false,charging:false,flickT:0,hesT:0,wantSwim:false,specT:2+rnd(4)};}

// projectile drop at horizontal distance h for a weapon (straight phase, then gravity)
function dropAt(w,h){const t=h/w.speed;return t>w.straight?.5*w.grav*(t-w.straight)**2:0;}
function aimAt(f,b,d,dt,tx,ty,tz,errK=1){const eye=tv.set(f.pos.x,f.pos.y+(f.swim?.5:PHY.eye),f.pos.z);const dx=tx-eye.x,dz=tz-eye.z,dy=ty-eye.y,hd=Math.hypot(dx,dz);
 b.errP+=dt*1.6;const e=d.err*errK;const ex=(Math.sin(b.errP*1.7)+Math.sin(b.errP*3.1+1.3)*.5)*e,ey=(Math.sin(b.errP*2.3+2)*.6+Math.sin(b.errP*4.1)*.3)*e*.7;
 const wy=Math.atan2(-dx,-dz)+ex,wp=Math.atan2(dy,hd)+ey;const k=1-Math.exp(-d.track*dt),mx=d.turn*dt;f.yaw+=cl(wrapA(wy-f.yaw)*k,-mx,mx);f.pitch=cl(f.pitch+cl((wp-f.pitch)*k,-mx,mx),-1.3,1.2);
 return Math.abs(wrapA(wy-f.yaw))+Math.abs(wp-f.pitch);}

export function think(f,G,dt){const b=f.ai,d=b.d,W=G.W,inp=f.inp;const prevFire=inp.fire;inp.fwd=inp.side=0;inp.jump=inp.jumpEdge=inp.fire=inp.swim=inp.sub=inp.special=false;
 if(!f.alive){b.path=null;return;}b.bombCD-=dt;b.specT-=dt;b.hesT-=dt;
 b.thinkT-=dt;if(b.thinkT<=0){b.thinkT=.13+rnd(.06);perceive(f,G);}
 const t=b.target&&b.target.alive?b.target:null;if(!t)b.target=null;const vis=t&&b.lostT<.05;if(vis)b.seenT+=dt;else b.seenT=Math.max(0,b.seenT-dt*2);
 const w=WPN[f.wpn],dist=t?Math.hypot(t.pos.x-f.pos.x,t.pos.z-f.pos.z):99;const under=f.onGround?G.P.ownerAt(f.pos,.35):-1,ownInk=under===f.team+1,enemyInk=under>0&&!ownInk;
 // ---------- refill / retreat state ----------
 if(f.ink<14)b.refill=true;else if(f.ink>88)b.refill=false;
 const hurt=f.hp<40&&t&&dist<9;
 // ---------- combat ----------
 let engaged=false,mv=new V();
 const range=f.wpn==='charger'?34:f.wpn==='roller'?9:13.5;
 if(t&&vis&&dist<range+4&&!f.slam){engaged=true;const tgt=tv2.set(t.pos.x,t.pos.y+(t.swim?.3:.95),t.pos.z);
  // lead + drop
  const proj=f.wpn==='charger'?null:f.wpn==='roller'?{speed:w.flickSpeed,straight:w.straight,grav:w.grav}:w;if(proj){const tof=dist/proj.speed;tgt.x+=t.vel.x*tof*.7;tgt.z+=t.vel.z*tof*.7;tgt.y+=dropAt(proj,dist);}
  const settle=1/(1+b.seenT*1.5);const err=aimAt(f,b,d,dt,tgt.x,tgt.y,tgt.z,.5+settle*1.4+(t.swim?.5:0));const cone=(f.wpn==='charger'?.045:.1)+Math.atan2(.5,Math.max(1,dist));const aimOk=err<cone;
  const canAct=b.seenT>d.react;
  if(canAct){
   if(f.wpn==='splatter'){if(aimOk&&dist<range&&f.ink>2&&b.hesT<=0)inp.fire=true;if(Math.random()<dt*d.hesit*2)b.hesT=.2+rnd(.4);}
   else if(f.wpn==='charger'){const need=dist>22?.98:dist>12?.7:.45;if(f.ink>3){if(!b.charging){b.charging=true;}inp.fire=true;if(f.chargeT>=need*w.charge&&aimOk){inp.fire=false;b.charging=false;}}}
   else{if(dist<3.6){inp.fire=true;b.rollIn=true;}else if(dist<8.5&&aimOk&&f.ink>w.flickCost){b.flickT-=dt;if(b.flickT<=0&&!prevFire){inp.fire=true;b.flickT=.55+rnd(.3)+d.hesit;}}}
   // bomb
   if(b.bombCD<=0&&dist>4.5&&dist<11&&f.ink>BOMB.cost+8&&Math.random()<d.bomb){const v=BOMB.speed,g=BOMB.grav;const s=cl(dist*g/(v*v),0,1);f.pitch=.5*Math.asin(s)-.08;inp.sub=true;b.bombCD=5+rnd(5);}
   else if(b.bombCD<=0)b.bombCD=1.5;
   // special when close
   if(f.special>=100&&dist<7&&Math.random()<d.special)inp.special=true;}
  // combat movement
  b.strafeT-=dt;if(b.strafeT<=0){b.strafe=Math.random()<.5?-1:1;b.strafeT=.4+rnd(.9)/(.5+d.strafe);}
  const toT=tv.set(t.pos.x-f.pos.x,0,t.pos.z-f.pos.z).normalize();const side=new V(-toT.z,0,toT.x);let adv=0;
  if(f.wpn==='splatter')adv=dist>9?1:dist<4?-.6:0;else if(f.wpn==='charger')adv=dist>26?.8:dist<12?-1:0;else adv=1;
  if(hurt&&f.wpn!=='roller')adv=-1;mv.addScaledVector(side,b.strafe*d.strafe*(f.wpn==='roller'?.3:1)).addScaledVector(toT,adv);
  if(f.onGround&&Math.random()<dt*d.strafe*.6&&f.wpn!=='charger')inp.jumpEdge=inp.jump=true;}
 else{b.charging=false;
  // ---------- painting + travel ----------
  b.goalT-=dt;if(b.goalT<=0||!b.path)chooseGoal(f,G);
  const node=b.path&&b.path[b.pi];
  if(node){const n=node.n,dx=n.x-f.pos.x,dz=n.z-f.pos.z,hd=Math.hypot(dx,dz),dy=n.y-f.pos.y;mv.set(dx,0,dz);if(hd>.01)mv.divideScalar(hd);
   if(node.t===2&&hd<1.8&&f.onGround)inp.jumpEdge=inp.jump=true;
   if(hd<(node.t===0?.9:.75)&&dy<1.3&&dy>-(node.t===1?20:1.4)){b.pi++;if(b.pi>=b.path.length){b.path=null;b.goalT=Math.min(b.goalT,.15);}}}
  const myaw=mv.lengthSq()>.01?Math.atan2(-mv.x,-mv.z):f.yaw;
  // look: face travel, sweep the floor ahead while painting
  const painting=!b.refill&&f.ink>(f.wpn==='charger'?30:8)&&(b.goal&&b.goal.kind!=='travel'||Math.random()<.02||!ownInk);
  b.sweep+=dt*(1.6+d.paint);
  if(f.wpn==='roller'){f.yaw+=wrapA(myaw-f.yaw)*(1-Math.exp(-dt*6));f.pitch=damp(f.pitch,-.2,4,dt);if(painting&&mv.lengthSq()>.01&&f.onGround)inp.fire=true;}
  else if(f.wpn==='splatter'){const sw=Math.sin(b.sweep)*.55*d.paint;f.yaw+=wrapA(myaw+sw-f.yaw)*(1-Math.exp(-dt*7));f.pitch=damp(f.pitch,-.32-Math.sin(b.sweep*.7)*.08,5,dt);if(painting&&!b.swimTravel)inp.fire=Math.random()<d.paint+.1;}
  else{f.yaw+=wrapA(myaw+Math.sin(b.sweep*.5)*.3-f.yaw)*(1-Math.exp(-dt*5));f.pitch=damp(f.pitch,-.16,4,dt);if(painting&&!b.swimTravel){if(f.chargeT<w.charge*.95)inp.fire=true;else inp.fire=false;}}
  // swim to travel over own ink / refill
  b.swimTravel=(b.refill||hurt||ownInk&&!painting&&mv.lengthSq()>.01)&&ownInk;if(b.refill&&!ownInk&&f.ink>1&&f.wpn==='splatter'){f.pitch=-1.1;inp.fire=true;b.swimTravel=false;}
  if(b.swimTravel){inp.swim=true;inp.fire=false;}
  // paint-bomb the turf
  if(b.bombCD<=0&&f.ink>97&&Math.random()<d.bomb*.25){f.pitch=.35;inp.sub=true;b.bombCD=8+rnd(6);}
  // special for turf
  if(f.special>=100&&b.specT<=0){b.specT=2+rnd(3);if(Math.random()<d.special*.5)inp.special=true;}}
 if(enemyInk&&!engaged&&f.ink>2&&f.wpn==='splatter'){f.pitch=-.9;inp.fire=true;inp.swim=false;}
 if(hurt&&ownInk&&f.wpn!=='roller'){inp.swim=true;inp.fire=false;}
 // don't walk off ledges into the void / water
 if(mv.lengthSq()>.01){const ax=f.pos.x+mv.x*1.3,az=f.pos.z+mv.z*1.3;const g=W.groundBelow(ax,f.pos.y+.4,az,.1);if(f.pos.y-g>4||g<(G.D.water??W.killY)+.2){mv.multiplyScalar(-.3);b.path=null;b.goalT=0;}}
 // stuck
 b.stuckT+=dt;if(b.stuckT>1.1){const moved=f.pos.distanceTo(b.stuckP);b.stuckP.copy(f.pos);b.stuckT=0;if(moved<.6&&mv.lengthSq()>.1){b.stuck=(b.stuck||0)+1;inp.jumpEdge=inp.jump=true;if(b.stuck>2){b.path=null;b.goalT=0;b.stuck=0;b.strafe*=-1;}}else b.stuck=0;}
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);inp.fwd=cl(-(mv.x*sy+mv.z*cy),-1,1);inp.side=cl(mv.x*cy-mv.z*sy,-1,1);}

function perceive(f,G){const b=f.ai,d=b.d,W=G.W;let best=null,bs=1e9;const eye=new V(f.pos.x,f.pos.y+(f.swim?.5:PHY.eye),f.pos.z);const fx=-Math.sin(f.yaw),fz=-Math.cos(f.yaw);
 for(const o of G.fighters){if(!o.alive||o.team===f.team)continue;const dx=o.pos.x-f.pos.x,dz=o.pos.z-f.pos.z,dy=o.pos.y-f.pos.y,dist=Math.hypot(dx,dy,dz);if(dist>45)continue;
  if(o.sub&&o.lastFire<G.time-1.2&&dist>d.stealth&&o!==b.target)continue;// hidden in ink
  const front=(dx*fx+dz*fz)/Math.max(.1,Math.hypot(dx,dz));const aware=front>d.fov||dist<8||o===b.target&&b.lostT<2||o===f.lastHitBy&&G.time-f.lastHitT<2;if(!aware)continue;
  const tp=new V(o.pos.x,o.pos.y+(o.swim?.35:1),o.pos.z);if(!W.los(eye,tp))continue;
  let s=dist+(o===b.target?-6:0)+(o===f.lastHitBy?-8:0)+o.hp*.03;if(s<bs){bs=s;best=o;}}
 if(best){if(best!==b.target){b.target=best;b.seenT=0;}b.lostT=0;b.lastPos.copy(best.pos);}else{b.lostT+=.15;if(b.target&&b.lostT>3.5)b.target=null;}}

function setGoal(f,G,kind,p){const b=f.ai;b.goal={kind,p:p.clone?p.clone():new V(p.x,p.y,p.z)};const path=G.W.path(f.pos,p);if(path&&path.length){b.path=path;b.pi=0;}else b.path=null;b.goalT=2.2+rnd(2);return!!b.path;}
function chooseGoal(f,G){const b=f.ai,W=G.W,R=W.roam;if(!R.length)return;const own=f.team+1,fw=f.team?-1:1;
 // low ink: head for the nearest friendly ink
 if(b.refill){let best=null,bd=1e9;for(let k=0;k<26;k++){const n=R[Math.random()*R.length|0];if(G.P.ownerAt(n,.3)!==own)continue;const dd=Math.hypot(n.x-f.pos.x,n.z-f.pos.z);if(dd<bd){bd=dd;best=n;}}if(best&&bd>2&&setGoal(f,G,'refill',best))return;}
 // zone mode: claim the zone
 if(G.mode==='zone'&&G.D.zones.length&&Math.random()<.65){const z=G.D.zones[0],sh=G.P.zoneShare(0);if(sh[f.team]<.8){const p=new V(z.x0+Math.random()*(z.x1-z.x0),z.y,z.z0+Math.random()*(z.z1-z.z0));if(setGoal(f,G,'zone',p))return;}}
 // hunt a remembered enemy sometimes
 if(b.target&&b.lostT<5&&Math.random()<.5&&setGoal(f,G,'hunt',b.lastPos))return;
 // turf: score candidate nodes by ink ownership, distance, front line and spread from allies
 const es=G.D.spawns[1-f.team][0];let best=null,bs=-1e9;
 for(let k=0;k<22;k++){const n=R[Math.random()*R.length|0];const o=G.P.ownerAt(n,.3);let s=o===own?-40:o===0?12:16;const dd=Math.hypot(n.x-f.pos.x,n.z-f.pos.z);s-=Math.abs(dd-11)*.35;s+=n.z*fw*.12;
  if(es&&Math.hypot(n.x-es.x,n.z-es.z)<9)s-=40;for(const a of G.fighters)if(a!==f&&a.team===f.team&&a.ai&&a.ai.goal&&Math.hypot(a.ai.goal.p.x-n.x,a.ai.goal.p.z-n.z)<7)s-=9;s+=rnd(8);if(s>bs){bs=s;best=n;}}
 if(best&&setGoal(f,G,'paint',best))return;
 for(let k=0;k<4;k++){const n=R[Math.random()*R.length|0];if(n&&setGoal(f,G,'travel',n))return;}}
