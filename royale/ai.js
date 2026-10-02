// STORM ROYALE — bot brains: pick a drop, glide in, loot houses (through the door), harvest, rotate with the storm,
// fight with range-appropriate weapons, build cover when shot, heal when safe. Difficulty scales reaction, aim and building.
import {cl,angDiff,lerp} from './util.js';
import {GUNS,HEALS,gunValue} from './items.js';
import {CELL} from './build.js';

export const DIFF=[{n:'EASY',react:.9,err:.085,build:.22,view:65,burst:.45,dmg:.6,turn:4,strafe:.5},{n:'NORMAL',react:.55,err:.05,build:.55,view:95,burst:.62,dmg:.8,turn:7,strafe:.8},{n:'HARD',react:.28,err:.026,build:.9,view:125,burst:.85,dmg:1,turn:11,strafe:1}];
const PREF={sg:[0,9],smg:[3,18],ar:[8,70],sn:[35,260],rl:[12,90]};

export function initBot(a,G){a.ai={mode:'drop',target:null,enemy:null,seen:0,react:0,thinkT:Math.random()*.3,strafe:1,strafeT:0,stuckT:0,last:{x:0,z:0},lastCheck:0,buildCd:0,err:{x:0,y:0},errT:0,
  jumpAt:0,heard:null,detour:0,detourDir:1,lootT:0,harvest:null,emoteT:0,doorStage:0,goal:null,wander:null,lootTarget:null,peekT:0};}

// called when the bus launches: choose landing spot and the bus time to jump
export function planDrop(a,G,bus){const W=G.world,r=Math.random();let spot;
 const houseSpots=G.containers.filter(c=>c.house),pool=r<.8?houseSpots:G.containers;spot=pool[Math.random()*pool.length|0];
 a.ai.dropTo=spot?{x:spot.p.x+(Math.random()-.5)*8,z:spot.p.z+(Math.random()-.5)*8,house:spot.house}:{x:(Math.random()-.5)*200,z:(Math.random()-.5)*200};
 if(spot&&spot.house){const d=W.doorOut(spot.house);a.ai.dropTo.x=d.x;a.ai.dropTo.z=d.z;}
 // param along bus line closest to the target, minus glide lead
 const t=((a.ai.dropTo.x-bus.p0.x)*bus.dir.x+(a.ai.dropTo.z-bus.p0.z)*bus.dir.z);const side=Math.abs((a.ai.dropTo.x-bus.p0.x)*bus.dir.z-(a.ai.dropTo.z-bus.p0.z)*bus.dir.x);
 a.ai.jumpAt=cl((t-side*.35-20)/bus.speed+(Math.random()-.5)*2,2.2,bus.len/bus.speed-1);}

const tv={x:0,z:0};
function steer(a,tx,tz,G,dt,sprint=true,stop=1.2){const dx=tx-a.pos.x,dz=tz-a.pos.z,d=Math.hypot(dx,dz);const I=a.in;
 if(d<stop){I.mx=0;I.mz=0;return d;}let want=Math.atan2(dx,dz);const ai=a.ai;if(ai.detour>0){want+=ai.detourDir*1.1;}
 turnTo(a,want,0,dt,G,6);I.mz=1;I.mx=0;I.sprint=sprint&&d>8;return d;}
function turnTo(a,yaw,pitch,dt,G,rate){const k=Math.min(1,dt*rate);a.yaw+=angDiff(a.yaw,yaw)*k;a.pitch+=(pitch-a.pitch)*k;}
const dist2=(a,b)=>(a.x-b.x)**2+(a.z-b.z)**2;

function bestGun(a,d){let best=-1,bv=-1;a.inv.forEach((it,i)=>{if(!it||it.kind!=='gun')return;const g=GUNS[it.t],pr=PREF[it.t],ok=d>=pr[0]-2&&d<=pr[1]+10;const hasAmmo=it.mag>0||a.ammo[g.ammo]>0;if(!hasAmmo)return;
  const v=gunValue(it)+(ok?20:0)-(it.t==='rl'&&d<8?30:0);if(v>bv){bv=v;best=i;}});return best;}

export function thinkBot(a,G,dt){const ai=a.ai,I=a.in,D=G.diff,W=G.world;I.fire=false;I.aim=false;I.jump=false;I.sprint=false;
 if(!a.alive)return;ai.buildCd-=dt;ai.thinkT-=dt;ai.detour-=dt;
 // ---- airborne: steer to landing
 if(a.state==='bus'){if(G.busT>=ai.jumpAt)G.jump(a);return;}
 if(a.state==='fall'||a.state==='glide'){const t=ai.dropTo;const dx=t.x-a.pos.x,dz=t.z-a.pos.z,d=Math.hypot(dx,dz);a.yaw=Math.atan2(dx,dz);I.mz=d>3?1:0;I.mx=0;a.pitch=a.state==='fall'&&d<60?-1.2:0;return;}
 if(a.state!=='ground')return;
 // ---- perception (throttled)
 if(ai.thinkT<=0){ai.thinkT=.22+Math.random()*.1;perceive(a,G);}
 let en=ai.enemy&&ai.enemy.alive?ai.enemy:null;if(!en)ai.enemy=null;
 // unarmed: keep looting, only swing back at very close attackers
 if(en&&!hasGun(a)){const dd=Math.hypot(en.pos.x-a.pos.x,en.pos.z-a.pos.z);if(!(dd<3.2&&G.time-a.lastHurt<2.5))en=null;}
 // ---- stuck detection
 if(G.time-ai.lastCheck>.8){const mv=Math.hypot(a.pos.x-ai.last.x,a.pos.z-ai.last.z);ai.last.x=a.pos.x;ai.last.z=a.pos.z;ai.lastCheck=G.time;
  if((I.mz||I.mx)&&mv<.7){ai.stuckT+=.8;}else ai.stuckT=Math.max(0,ai.stuckT-.8);}
 if(ai.stuckT>0&&ai.stuckT<1.7&&a.ground&&Math.random()<.1)I.jump=true;
 if(ai.stuckT>=1.6&&ai.stuckT<3.3&&!en){// smash what's in front
  G.select(a,0);I.fire=true;I.mz=.3;a.pitch*=.8;if(ai.stuckT>3)ai.stuckT=3.3;return;}
 if(ai.stuckT>=3.3){ai.detour=1.4;ai.detourDir=Math.random()<.5?-1:1;ai.stuckT=0;}
 // ---- healing when safe
 if(a.healing){I.mz=0;I.mx=0;if(en&&G.time-a.lastHurt<1){G.select(a,bestSlot(a,en));}else{I.fire=true;return;}}
 const hp=a.hp+a.sh;
 // ---- storm
 const st=G.storm,safe=st.state==='wait'&&st.phase<st.count?st.next:st.cur;const ds=Math.hypot(a.pos.x-safe.x,a.pos.z-safe.z);
 const outCur=Math.hypot(a.pos.x-st.cur.x,a.pos.z-st.cur.z)>st.cur.r-1;const urgent=outCur||(ds>safe.r*.8&&(st.state==='shrink'||st.left<ds/5+15));
 // ---- fight
 if(en){fight(a,G,en,dt,urgent,safe);return;}
 if(hp<70&&G.time-a.lastHurt>3){const hs=healSlot(a);if(hs>=0){G.select(a,hs);I.fire=true;I.mz=0;a.healing||null;return;}}
 if(G.time-a.lastHurt<.6&&a.lastHurtBy&&a.lastHurtBy.alive&&hasGun(a)){ai.enemy=a.lastHurtBy;ai.react=G.time+D.react*.6;}
 if(urgent){if(!ai.goal||ai.goal.kind!=='storm'||G.time-ai.goal.t>6){const ang=Math.random()*6.28,rr=Math.sqrt(Math.random())*safe.r*.55;ai.goal={kind:'storm',x:safe.x+Math.cos(ang)*rr,z:safe.z+Math.sin(ang)*rr,t:G.time};}
  G.select(a,0);steer(a,ai.goal.x,ai.goal.z,G,dt,true,2);if(ai.heard)ai.heard=null;return;}
 // ---- investigate gunfire
 if(ai.heard&&G.time-ai.heard.t<6&&hasGun(a)){G.select(a,bestSlot(a,null));const d=steer(a,ai.heard.x,ai.heard.z,G,dt,false,6);if(d<7)ai.heard=null;return;}
 // ---- loot
 ai.lootT-=dt;if(ai.lootT<=0){ai.lootT=1;ai.goal=pickLoot(a,G,safe);}
 if(ai.goal&&ai.goal.kind!=='storm'){if(!ai.goal.ok()){ai.goal=null;ai.lootT=0;}else{G.select(a,hasGun(a)?bestSlot(a,null):0);gotoLoot(a,G,ai.goal,dt);return;}}
 // ---- harvest materials
 if(a.mats[0]+a.mats[1]+a.mats[2]<90){if(!ai.harvest||!ai.harvest.alive||dist2(ai.harvest,a.pos)>40*40){ai.harvest=null;let bd=900;W.obsNear(a.pos.x-30,a.pos.z-30,a.pos.x+30,a.pos.z+30,o=>{if(o.k==='prop')return;const d=dist2(o,a.pos);if(d<bd){bd=d;ai.harvest=o;}});}
  if(ai.harvest){const o=ai.harvest;G.select(a,0);const d=steer(a,o.x,o.z,G,dt,false,(o.r||1.5)+1.2);if(d<(o.r||2)+1.6){turnTo(a,Math.atan2(o.x-a.pos.x,o.z-a.pos.z),-.1,dt,G,10);I.fire=true;}return;}}
 // ---- wander toward the safe zone / a random house
 if(!ai.wander||dist2(ai.wander,a.pos)<36||G.time-ai.wander.t>25){const h=G.world.houses[Math.random()*G.world.houses.length|0];const inSafe=h&&Math.hypot(h.cx-safe.x,h.cz-safe.z)<safe.r*.85;
  ai.wander=inSafe&&Math.random()<.6?{x:h.cx,z:h.cz,t:G.time}:{x:safe.x+(Math.random()-.5)*safe.r,z:safe.z+(Math.random()-.5)*safe.r,t:G.time};}
 G.select(a,bestSlot(a,null));steer(a,ai.wander.x,ai.wander.z,G,dt,true,3);
 const cur=a.sel>0?a.inv[a.sel-1]:null;if(cur&&cur.kind==='gun'&&cur.mag<GUNS[cur.t].mag*.5)G.reload(a);}

function hasGun(a){return a.inv.some(it=>it&&it.kind==='gun'&&(it.mag>0||a.ammo[GUNS[it.t].ammo]>0));}
function bestSlot(a,en){const d=en?Math.hypot(en.pos.x-a.pos.x,en.pos.z-a.pos.z):30;const i=bestGun(a,d);return i<0?0:i+1;}
function healSlot(a){let best=-1;a.inv.forEach((it,i)=>{if(!it||it.kind!=='heal')return;const h=HEALS[it.t];if(h.sh&&a.sh<h.cap)best=i;else if(h.hp&&a.hp<h.cap&&best<0)best=i;});return best<0?-1:best+1;}

function perceive(a,G){const ai=a.ai,D=G.diff;let best=null,bs=1e9;
 for(const b of G.actors){if(b===a||!b.alive||b.state!=='ground'&&b.state!=='glide')continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,dy=b.pos.y-a.pos.y,d=Math.hypot(dx,dz,dy);if(d>D.view*(b.player?1:.5))continue;
  const ang=Math.abs(angDiff(a.yaw,Math.atan2(dx,dz)));const aware=d<12||ang<1.4||b===a.lastHurtBy&&G.time-a.lastHurt<3;if(!aware)continue;
  // player gets a tiny grace at very long range on easy
  const score=d+(b===ai.enemy?-15:0)+(b.player?G.diff.n==='EASY'?12:0:0);if(score<bs&&G.los(a,b)){bs=score;best=b;}}
 if(best&&best!==ai.enemy){ai.enemy=best;ai.react=G.time+D.react*(.7+Math.random()*.6);ai.seen=G.time;}
 else if(best)ai.seen=G.time;else if(ai.enemy&&G.time-ai.seen>2.5)ai.enemy=null;}

function fight(a,G,en,dt,urgent,safe){const ai=a.ai,I=a.in,D=G.diff;const dx=en.pos.x-a.pos.x,dz=en.pos.z-a.pos.z,d=Math.hypot(dx,dz);
 const slot=bestSlot(a,en);G.select(a,slot);const it=a.sel>0?a.inv[a.sel-1]:null;
 // aim with error that re-rolls
 if(G.time>ai.errT){ai.errT=G.time+.25+Math.random()*.35;const e=D.err*(1+(en.state==='glide'?1:0)+(G.time-ai.seen>.5?1:0));ai.err.x=(Math.random()-.5)*2*e;ai.err.y=(Math.random()-.5)*2*e;}
 const tx=en.pos.x,ty=en.pos.y+(Math.random()<(D.n==='HARD'?.25:.08)?1.6:1.15),tz=en.pos.z,ey=a.pos.y+1.5,hd=Math.hypot(tx-a.pos.x,tz-a.pos.z);
 const wantYaw=Math.atan2(tx-a.pos.x,tz-a.pos.z)+ai.err.x,wantPitch=Math.atan2(ty-ey,hd)+ai.err.y;turnTo(a,wantYaw,wantPitch,dt,G,D.turn);
 const aligned=Math.abs(angDiff(a.yaw,wantYaw))<.12&&G.time>ai.react;
 if(it&&it.kind==='gun'){const g=GUNS[it.t];ai.burst=(ai.burst||0)-dt;if(ai.burst<-(1-D.burst)*1.3)ai.burst=D.burst*1.1;
  if(it.mag<=0){G.reload(a);}else if(aligned&&d<g.range[1]*.9){I.fire=g.auto?ai.burst>0:Math.random()<.5;I.aim=g.scope||d>25;}}
 else if(d<2.6){I.fire=aligned;}
 // movement: keep preferred range, strafe
 ai.strafeT-=dt;if(ai.strafeT<=0){ai.strafeT=.4+Math.random()*1;ai.strafe=Math.random()<.5?-1:1;if(Math.random()<.25*D.strafe&&a.ground)I.jump=true;}
 const pr=it&&it.kind==='gun'?PREF[it.t]:[0,1.6];const want=(pr[0]+pr[1])/2;I.mz=d>Math.min(pr[1],want+6)?1:d<pr[0]?-1:0;I.mx=ai.strafe*D.strafe;
 if(!it||it.kind!=='gun'){I.mz=d>1.8?1:0;I.mx=0;}
 if(urgent&&d>20){const gx=safe.x-a.pos.x,gz=safe.z-a.pos.z,gy=Math.atan2(gx,gz),rel=angDiff(a.yaw,gy);I.mz=Math.cos(rel);I.mx=-Math.sin(rel);I.sprint=true;}
 // build cover when taking fire
 if(G.build&&G.buildOn&&G.time-a.lastHurt<.4&&ai.buildCd<=0&&Math.random()<D.build&&a.mats.some(m=>m>=10)){ai.buildCd=2.2+Math.random()*2.5/D.build;
  const y=a.yaw;a.yaw=Math.atan2((a.lastHurtBy||en).pos.x-a.pos.x,(a.lastHurtBy||en).pos.z-a.pos.z);G.placePiece(a,'wall');
  if(D.n!=='EASY'&&Math.random()<.6){G.placePiece(a,'ramp');}
  if(D.n==='HARD'&&Math.random()<.35){for(const o of[Math.PI/2,-Math.PI/2,Math.PI]){const yy=a.yaw;a.yaw=yy+o;G.placePiece(a,'wall');a.yaw=yy;}}a.yaw=y;}
 // emote over a fresh elimination
}

function pickLoot(a,G,safe){const W=G.world;let best=null,bs=1e9;const want=a.inv.filter(Boolean).length<5||!hasGun(a)||a.inv.some(it=>it&&it.kind==='gun'&&it.r<2);
 const near=(p)=>Math.hypot(p.x-a.pos.x,p.z-a.pos.z);
 for(const c of G.containers){if(c.opened)continue;const d=near(c.p);if(d>90||Math.abs(c.p.y-a.pos.y)>2.5&&d<12)continue;if(Math.hypot(c.p.x-safe.x,c.p.z-safe.z)>safe.r)continue;const s=d+(c.kind==='ammo'?25:0)+(c.claim&&c.claim!==a?40:0);if(s<bs){bs=s;best={kind:'cont',c,ok:()=>!c.opened}};}
 if(want)for(const l of G.loot){if(!l.settled)continue;const d=near(l.p);if(d>60||Math.abs(l.p.y-a.pos.y)>2.5&&d<12)continue;const it=l.it;let s=d;
  if(it.kind==='gun'){const worst=Math.min(...a.inv.map(x=>x&&x.kind==='gun'?gunValue(x):0));const have=a.inv.filter(x=>x&&x.kind==='gun').length;if(have>=3&&gunValue(it)<=worst+1)continue;s-=10;}
  else if(it.kind==='heal'){if(a.inv.filter(x=>x&&x.kind==='heal').length>=2&&!a.inv.some(x=>x&&x.kind==='heal'&&x.t===it.t))continue;}
  if(s<bs){bs=s;best={kind:'item',l,ok:()=>G.loot.includes(l)};}}
 if(best&&best.kind==='cont')best.c.claim=a;return best;}

function gotoLoot(a,G,goal,dt){const ai=a.ai,W=G.world,p=goal.kind==='cont'?goal.c.p:goal.l.p,h=goal.kind==='cont'?goal.c.house:W.inHouse(p.x,p.z,.1);
 // route through the door when the target is inside a house and we are outside it
 const inside=h&&a.pos.x>h.x0&&a.pos.x<h.x1&&a.pos.z>h.z0&&a.pos.z<h.z1;let tx=p.x,tz=p.z;
 if(h&&!inside){const d=W.doorOut(h);const dd=Math.hypot(a.pos.x-d.x,a.pos.z-d.z);if(dd>1.5&&ai.doorStage===0){tx=d.x;tz=d.z;}else{ai.doorStage=1;tx=d.ix;tz=d.iz;}}else ai.doorStage=0;
 const d=steer(a,tx,tz,G,dt,true,.6);if(Math.hypot(p.x-a.pos.x,p.z-a.pos.z)<2.2&&Math.abs(p.y-a.pos.y)<2.5){a.in.mz=0;G.interact(a,goal.kind==='cont'?goal.c:goal.l);ai.goal=null;ai.lootT=.2;ai.doorStage=0;}}
