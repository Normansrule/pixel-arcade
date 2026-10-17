// VOIDWING — starfighter runtime: flight model (boost, drift, power routing), lasers with heat, CPU pilot brains.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,rnd,rs,TAU} from './util.js';
import {CLASSES} from './ships.js';
const _v=new V(),_w=new V(),_l=new V(),_q=new THREE.Quaternion(),_iq=new THREE.Quaternion(),_e=new THREE.Euler();
let SID=0;const WANT=new V(),AV=new V();
export class Ship{constructor(cls,team,o={}){this.id=SID++;this.cls=cls;this.c=CLASSES[cls];this.team=team;this.name=o.name||'PILOT';this.human=!!o.human;
  this.p=new V();this.q=new THREE.Quaternion();this.v=new V();this.w=new V();this.sp=0;this.kills=0;this.deaths=0;this.assists=0;this.score=0;this.capDmg=0;this.subKills=0;this.dmgBy=new Map();
  this.pips={eng:2,wpn:2,shd:2};this.ctrl={pitch:0,yaw:0,roll:0,thr:.7,boost:false,drift:false,fire:false,sec:false,cm:false};this.reset();}
 reset(){const c=this.c;this.alive=true;this.hull=this.maxHull=c.hull;this.maxShield=c.shield;this.shield=this.shieldMax();this.heat=0;this.overheat=false;this.boostE=c.boostCap;this.boosting=false;this.drifting=false;
  this.secN=c.sec.n;this.cmN=c.cm;this.cmT=0;this.gunT=0;this.secT=0;this.lastHit=-99;this.lockT=0;this.lockTgt=null;this.lastHitBy=null;this.lastHitT=-99;this.dmgBy.clear();this.fireT=0;this.thr=.7;this.ctrl.thr=.7;this.w.set(0,0,0);this.driftDir=new V();this.respawnT=0;this.smokeAcc=0;}
 fwd(o){return(o||new V()).set(0,0,-1).applyQuaternion(this.q);}up(o){return(o||new V()).set(0,1,0).applyQuaternion(this.q);}right(o){return(o||new V()).set(1,0,0).applyQuaternion(this.q);}
 place(p,dir,sp){this.p.copy(p);const m=new THREE.Matrix4().lookAt(new V(),dir.clone().normalize(),Math.abs(dir.y)<.95?new V(0,1,0):new V(1,0,0));this.q.setFromRotationMatrix(m);this.sp=sp;this.v.copy(this.fwd()).multiplyScalar(sp);}
 shieldMax(){return this.c.shield*(.75+.125*this.pips.shd);}
 maxSpeed(){return this.c.spd*(.82+.09*this.pips.eng);}
 // move one pip into a system (taken from the fullest other one)
 route(sys){const P=this.pips;if(sys==='bal'){P.eng=P.wpn=P.shd=2;return;}if(P[sys]>=4)return;const others=['eng','wpn','shd'].filter(k=>k!==sys&&P[k]>0).sort((a,b)=>P[b]-P[a]);if(!others.length)return;P[others[0]]--;P[sys]++;}
 // agility sweet spot around 50-70 % throttle
 agility(){return 1+.25*(1-Math.min(1,Math.abs(this.thr-.6)*2.4));}}

/* ================= flight model ================= */
export function fly(s,dt){const c=s.c,k=s.ctrl;
 s.thr+=(cl(k.thr,0,1)-s.thr)*Math.min(1,dt*3);
 // boost + drift
 const canBoost=s.boostE>(s.boosting?0:.6);s.boosting=k.boost&&canBoost;s.drifting=s.boosting&&k.drift;
 if(s.boosting){s.boostE=Math.max(0,s.boostE-dt*(s.drifting?.75:1));}else s.boostE=Math.min(c.boostCap,s.boostE+dt*.32*(.55+.25*s.pips.eng));
 // rotation: rate commands with a little inertia
 const ag=s.agility()*(s.drifting?1.35:s.boosting?.82:1);const r=c.rate;
 _v.set(cl(k.pitch,-1,1)*r[0]*ag,-cl(k.yaw,-1,1)*r[1]*ag,-cl(k.roll,-1,1)*r[2]);s.w.lerp(_v,Math.min(1,dt*(s.human?9:6)));
 _q.setFromEuler(_e.set(s.w.x*dt,s.w.y*dt,s.w.z*dt,'XYZ'));s.q.multiply(_q).normalize();
 // speed
 const tgt=s.boosting?c.boost*(.9+.05*s.pips.eng):s.thr*s.maxSpeed();const a=tgt>s.sp?c.acc*(s.boosting?1.8:1):c.acc*1.4;s.sp+=cl(tgt-s.sp,-a*dt,a*dt);
 const f=s.fwd(_w);
 if(s.drifting){if(!s.wasDrift)s.driftDir.copy(s.v).normalize();s.v.copy(s.driftDir).multiplyScalar(s.sp);}
 else{const cur=_l.copy(s.v);const l=cur.length();if(l>1)cur.divideScalar(l);else cur.copy(f);cur.lerp(f,1-Math.exp(-dt*(s.wasDrift?3:9))).normalize();s.v.copy(cur).multiplyScalar(s.sp);}
 s.wasDrift=s.drifting;s.p.addScaledVector(s.v,dt);
 // weapons heat, shields, countermeasures
 const cool=c.laser.cool*(.55+.3*s.pips.wpn);s.heat=Math.max(0,s.heat-cool*dt*(k.fire&&!s.overheat?.15:1));if(s.overheat&&s.heat<.3)s.overheat=false;
 const sm=s.shieldMax();if(s.shield>sm)s.shield=Math.max(sm,s.shield-sm*.2*dt);else if(s.age-s.lastHit>3)s.shield=Math.min(sm,s.shield+c.shield*.2*(.35+.4*s.pips.shd)*dt);
 if(s.cmN<c.cm){s.cmT+=dt;if(s.cmT>11){s.cmT=0;s.cmN++;}}
 s.age=(s.age||0)+dt;}

/* ================= CPU pilots ================= */
export const SKILL=[{n:'EASY',err:.055,react:.75,tol:.09,agi:.72,cm:.25,msl:.35,lead:.7,dmg:.45},{n:'NORMAL',err:.028,react:.4,tol:.06,agi:.86,cm:.55,msl:.65,lead:.9,dmg:.7},{n:'HARD',err:.012,react:.18,tol:.04,agi:1,cm:.85,msl:1,lead:1,dmg:.95}];
// steer toward a world direction; returns the angle off the nose
export function steer(s,dir,k,agi=1,precise=false){_iq.copy(s.q).invert();_l.copy(dir).applyQuaternion(_iq);const fz=-_l.z,ang=Math.acos(cl(fz/(_l.length()||1),-1,1));
 const yawE=Math.atan2(_l.x,fz),pitE=Math.atan2(_l.y,Math.hypot(_l.x,fz));
 if(ang>.45&&!precise){// bank and pull: roll the target to the top, then pitch
  const rollE=Math.atan2(_l.x,_l.y);k.roll=cl(rollE*2.2,-1,1)*agi;k.pitch=cl((ang)*2*Math.max(.25,Math.cos(rollE)),-1,1)*agi;k.yaw=cl(yawE*.8,-1,1)*agi;}
 else{k.yaw=cl(yawE*5,-1,1)*agi;k.pitch=cl(pitE*5,-1,1)*agi;const lev=s.up(_v);k.roll=cl(Math.atan2(s.right(_w).y,lev.y)*.6,-1,1)*.4;}
 return ang;}
export function leadPoint(s,t,spd,out){const tp=t.wp?t.wp(out):out.copy(t.p);const tv=t.v||_v.set(0,0,0);const rel=_w.subVectors(tp,s.p);const d=rel.length();let tt=d/spd;for(let i=0;i<2;i++){const fut=_l.copy(tp).addScaledVector(tv,tt);tt=fut.distanceTo(s.p)/spd;}return out.addScaledVector(tv,tt);}
export const hostile=(a,b)=>a.team!==b.team;
// look ahead for rocks / capital hulls / the arena edge; returns an avoidance direction or null
function avoid(s,W,out){const look=Math.max(140,s.sp*2.2),f=s.v.lengthSq()>1?_w.copy(s.v).normalize():s.fwd(_w);let best=null,bd=1e9;
 const check=(c,r)=>{const rel=_l.subVectors(c,s.p),t=rel.dot(f);if(t<-r||t>look+r)return;const perp=rel.addScaledVector(f,-t),d=perp.length();if(d<r+s.c.rad*3&&t<bd){bd=t;best={perp:perp.clone(),d,r};}};
 for(let k=0;k<=look;k+=120){const pp=_v.copy(s.p).addScaledVector(f,k);for(const a of W.rocks.near(pp))check(a.p,a.r);}
 for(const cp of W.caps){if(cp.dead)continue;if(cp.p.distanceTo(s.p)>cp.L*.7+look)continue;for(const h of cp.hullS){const c=new V(h[0],h[1],h[2]).applyQuaternion(cp.q).add(cp.p);check(c,h[3]+6);}}
 if(!best)return null;const away=best.d>.5?best.perp.multiplyScalar(-1/best.d):s.up(new V());return out.copy(f).multiplyScalar(.3).add(away).normalize();}
export function think(s,W,dt){const ai=s.ai,k=s.ctrl,S=SKILL[ai.skill],c=s.c;ai.t-=dt;ai.mt=(ai.mt||0)-dt;k.fire=k.sec=k.cm=false;
 // pick a target
 if(ai.t<=0||!ai.tgt||ai.tgt.alive===false||ai.tgt.dead){ai.t=1.2+rnd(1.5);ai.tgt=pickTarget(s,W);}
 const tg=ai.tgt;let want=WANT.set(0,0,0),boost=false,precise=false,thr=.7;
 // evade incoming missiles
 const inc=W.missiles.list.filter(m=>m.target===s&&m.seek);
 if(inc.length){const m=inc[0],d=m.p.distanceTo(s.p);if(d<900&&s.cmN>0&&!ai.cmTried){ai.cmTried=true;if(Math.random()<S.cm){ai.cmDelay=.15+rnd(S.react);} }
  if(ai.cmDelay!==undefined){ai.cmDelay-=dt;if(ai.cmDelay<=0){k.cm=true;ai.cmDelay=undefined;}}
  if(d<1200){ai.evade=1.5;}}else ai.cmTried=false;
 if(s.age-s.lastHit<.3&&s.lastHitBy&&s.lastHitBy.p&&_l.subVectors(s.lastHitBy.p,s.p).dot(s.fwd(_w))<0&&Math.random()<.35*(ai.skill+1)*dt*20)ai.evade=Math.max(ai.evade||0,1+rnd(1));
 if(ai.evade>0){ai.evade-=dt;if(!ai.jink||ai.jinkT<=0){ai.jink=new V(rs(),rs(),rs()).normalize();ai.jinkT=.5+rnd(.6);}ai.jinkT-=dt;want.copy(s.fwd(_w)).add(ai.jink.clone().multiplyScalar(1.4)).normalize();boost=true;thr=.6;}
 else if(ai.extend>0){ai.extend-=dt;want.copy(ai.extDir);boost=s.boostE>1;thr=1;}
 else if(tg){const tp=tg.wp?tg.wp(new V()):tg.p.clone();const dist=tp.distanceTo(s.p);const isCap=!!(tg.cap||tg.L);
  const aim=leadPoint(s,tg,c.laser.spd+s.sp*.3,new V());aim.lerp(tp,1-S.lead);if(ai.err===undefined||ai.mt<=0){ai.err=new V(rs(),rs(),rs()).multiplyScalar(S.err*dist);ai.mt=.5+rnd(.6);}aim.add(ai.err);
  want.subVectors(aim,s.p).normalize();precise=dist<900;
  if(isCap){// strafing / torpedo run: break off before the hull
   const capR=(tg.cap||tg).L*.35;if(dist<Math.max(220,capR*.6)&&_l.subVectors(tp,s.p).dot(s.fwd(_w))>0){ai.extend=2.5+rnd(1.5);ai.extDir=s.fwd(new V()).add(new V(rs(),rs(),rs()).multiplyScalar(.9)).normalize();}
   thr=dist>1400?1:.65;boost=dist>1800&&s.boostE>1.2;}
  else{thr=dist<160?.35:dist<500?.6:.85;boost=dist>1300&&s.boostE>1.5;const behind=_l.subVectors(tp,s.p).dot(s.fwd(_w))<0;
   if(dist<55||(dist<140&&behind&&Math.random()<dt*.8)){ai.extend=1.2+rnd(1.4);ai.extDir=s.fwd(new V()).add(new V(rs(),rs(),rs())).normalize();}}
  const ang=s.fwd(_w).angleTo(_l.subVectors(aim,s.p));
  if(ang<S.tol*(isCap?2.5:1)+Math.atan2(isCap?tg.r||20:c.rad,dist)&&dist<(isCap?1100:850)&&!s.overheat&&s.heat<.9)k.fire=true;
  // missile lock (AI keeps its own lock timer)
  const canLock=s.secN>0&&(isCap?c.sec.capOnly||true:!c.sec.capOnly)&&dist<(c.sec.kind==='torpedo'?1500:1300)&&ang<.22;
  if(canLock){if(s.lockTgt===tg)s.lockT+=dt;else{s.lockTgt=tg;s.lockT=0;}if(s.lockT>=c.sec.lock&&s.secT<=0&&Math.random()<S.msl*dt*1.2)k.sec=true;}else{s.lockT=Math.max(0,s.lockT-dt*2);}}
 else{// regroup toward the action / own capital
  want.copy(ai.home||_l.set(0,0,0)).sub(s.p);if(want.lengthSq()<1e4)want.copy(s.fwd(_w));want.normalize();thr=.7;}
 // boundary + obstacle avoidance override
 if(s.p.length()>W.arena*.8){want.lerp(_l.copy(s.p).multiplyScalar(-1).normalize(),.8).normalize();}
 const av=avoid(s,W,AV);if(av){want.copy(av);precise=false;boost=false;thr=Math.min(thr,.6);k.fire=false;}
 steer(s,want,k,S.agi,precise);k.thr=thr;k.boost=boost;k.drift=ai.evade>0&&Math.random()<.3;}
function pickTarget(s,W){let best=null,bs=-1e9;const fleet=W.mode==='fleet';const bomber=s.cls==='bomber';
 if(fleet&&(bomber||(s.ai.role==='strike'))){const caps=W.caps.filter(cp=>!cp.dead&&cp.team!==s.team&&!cp.locked);if(caps.length){const cp=caps.reduce((a,b)=>a.p.distanceTo(s.p)<b.p.distanceTo(s.p)?a:b);
   if(cp.shieldUp())return cp;const subs=cp.subs.filter(x=>!x.dead);if(subs.length){const pr={shield:5,reactor:4,engines:3,bridge:3,turret:1};subs.sort((a,b)=>(pr[b.kind]||0)-(pr[a.kind]||0)+rs(1.2));return subs[0];}return cp;}}
 for(const o of W.ships){if(!o.alive||o.team===s.team)continue;const d=o.p.distanceTo(s.p);let sc=-d;if(o.human)sc+=W.humanBias;if(s.cls==='interceptor'&&o.cls==='bomber')sc+=500;
  if(o.lastHitBy===s)sc+=300;if(fleet){for(const cp of W.caps)if(cp.team===s.team&&!cp.dead&&o.p.distanceTo(cp.p)<1400)sc+=450;}
  if(o.ai&&o.ai.tgt===s)sc+=250;if(sc>bs){bs=sc;best=o;}}
 return best;}
