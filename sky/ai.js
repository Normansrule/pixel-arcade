// SKY LANCERS — CPU pilots: target selection, energy fighting, lead pursuit, defensive breaks + flares, ground avoidance, bombers, strikers, escorts.
import * as THREE from '../vendor/three.module.min.js';
import {instruct,GRAV} from './planes.js';
import {hAt,WORLD,height} from './world.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a,rs=(a=1)=>(Math.random()*2-1)*a;
export const SKILL=[
 {n:'ROOKIE',aimErr:.045,tol:.03,react:1.15,flare:.3,lockT:2.6,gfac:.72,notice:.45,range:760,burst:.55},
 {n:'VETERAN',aimErr:.022,tol:.022,react:.7,flare:.62,lockT:1.8,gfac:.9,notice:.8,range:900,burst:.8},
 {n:'ACE',aimErr:.009,tol:.016,react:.38,flare:.88,lockT:1.15,gfac:1,notice:1,range:1080,burst:1}];
const _a=new V(),_b=new V(),_f=new V(),_u=new V(),_r=new V(),UPV=new V(0,1,0);
export const hostile=(a,b)=>a!==b&&b.alive&&(a.team<0||b.team<0||a.team!==b.team);
// time-of-flight lead for guns (bullets drop at half gravity in this game)
export function leadPoint(shooter,tgt,spd,out=new V()){const rel=_b.subVectors(tgt.p,shooter.p);let t=rel.length()/(spd+shooter.sp*.9);for(let k=0;k<2;k++){out.copy(tgt.p).addScaledVector(tgt.v,t);t=out.distanceTo(shooter.p)/(spd+shooter.sp*.9);}
 out.addScaledVector(shooter.v,-t*.0);out.y+=.25*GRAV*t*t;return out;}
function pickTarget(pl,W,sk){const f=pl.fwd(_f);let best=null,bs=1e18;const pref=pl.ai.pref;
 for(const o of W.planes){if(!hostile(pl,o)||o.doomed)continue;const d=o.p.distanceTo(pl.p);if(pl.ai.leash&&o.p.distanceTo(pl.ai.leash.p)>pl.ai.leash.r&&d>1500)continue;
  _a.subVectors(o.p,pl.p).divideScalar(d||1);let sc=d+(1-_a.dot(f))*700;if(o.ai&&o.ai.tgt===pl)sc-=500;if(o.human)sc-=W.humanBias||0;if(pref&&pref(o))sc-=pref(o);if(o===pl.ai.tgt)sc-=350;if(sc<bs){bs=sc;best=o;}}return best;}
export function think(pl,W,dt){const ai=pl.ai,sk=SKILL[ai.skill??1],c=pl.ctrl,s=pl.s;ai.t-=dt;ai.errT-=dt;ai.cd=(ai.cd||0)-dt;ai.flareCd=(ai.flareCd||0)-dt;c.fire=false;c.msl=null;c.flare=false;c.bomb=false;c.brake=false;
 if(!(ai.errT>0)){ai.errT=.35+rnd(.7);ai.errGoal=(ai.errGoal||new V()).set(rs(),rs(),rs()).normalize().multiplyScalar(sk.aimErr*(.4+rnd(.8)));}ai.err=(ai.err||new V()).lerp(ai.errGoal,Math.min(1,dt*2.5));
 const f=pl.fwd(_f),aim=ai.aim||(ai.aim=new V());let thr=1,ab=false,gentle=sk.gfac;
 if(ai.role==='bomber'||ai.role==='transport'||ai.role==='fortress'){route(pl,W,dt,aim);instruct(pl,aim,c,{gentle:.6});c.thr=ai.thr??.9;c.ab=false;return;}
 // ---- ground + boundary safety (highest priority)
 const look=Math.max(2.2,pl.sp/90);_a.copy(pl.p).addScaledVector(pl.v,look);const floor=Math.max(0,hAt(_a.x,_a.z),hAt(pl.p.x+pl.v.x*1.2,pl.p.z+pl.v.z*1.2),hAt(pl.p.x,pl.p.z))+90+pl.sp*.35;
 if(_a.y<floor||pl.p.y<floor-40){aim.set(pl.v.x,0,pl.v.z).normalize();aim.y=cl((floor-_a.y)/300,.35,1.2);aim.normalize();instruct(pl,aim,c,{gentle:1});c.thr=1;c.ab=s.wep>1;ai.mode='pullup';return;}
 if(Math.abs(pl.p.x)>WORLD*1.02||Math.abs(pl.p.z)>WORLD*1.02||pl.p.y>8000){aim.set(-pl.p.x,Math.max(0,3000-pl.p.y)*.4,-pl.p.z).normalize();instruct(pl,aim,c,{gentle});c.thr=1;ai.mode='return';return;}
 // ---- threats
 let msl=null,md=1e9;for(const m of W.ord.missiles){if(m.target===pl&&m.seek){const d=m.p.distanceTo(pl.p);if(d<md){md=d;msl=m;}}}
 if(msl&&md<2600){if(ai.flareCd<=0&&pl.flares>0){ai.flareCd=.55;if(Math.random()<sk.flare*(md<1500?1:.5))c.flare=true;}
  if(!ai.noticeM){ai.noticeM=Math.random()<sk.notice+.2?1:-1;}if(ai.noticeM>0){_a.subVectors(msl.p,pl.p).normalize();_b.crossVectors(_a,UPV);if(_b.lengthSq()<.01)_b.set(1,0,0);_b.normalize().multiplyScalar(ai.breakDir||(ai.breakDir=Math.random()<.5?1:-1));
   aim.copy(_b).addScaledVector(_a,-.25);aim.y=pl.p.y<600?.3:-.15;aim.normalize();instruct(pl,aim,c,{gentle:1});c.thr=1;c.ab=true;ai.mode='evade-msl';return;}}
 else{ai.noticeM=0;ai.breakDir=0;}
 // guns threat: hostile on our six pointing at us
 if(ai.t<=0){ai.t=sk.react*(.6+rnd(.8));ai.tgt=ai.forceTgt&&ai.forceTgt.alive?ai.forceTgt:pickTarget(pl,W,sk);ai.threat=null;
  for(const o of W.planes){if(!hostile(pl,o)||!o.s.gun)continue;const d=o.p.distanceTo(pl.p);if(d>1000)continue;_a.subVectors(pl.p,o.p).divideScalar(d);const theirAim=o.fwd(_u).dot(_a);_b.copy(_a).negate();const behind=f.dot(_b);
   if(theirAim>.94&&behind<.1&&Math.random()<sk.notice){ai.threat=o;ai.jinkT=0;break;}}}
 if(ai.threat&&ai.threat.alive&&ai.threat.p.distanceTo(pl.p)<1100&&(!ai.tgt||ai.tgt===ai.threat?ai.threat.p.distanceTo(pl.p)<600:true)){const o=ai.threat;ai.jinkT=(ai.jinkT||0)-dt;
  if(ai.jinkT<=0){ai.jinkT=1.1+rnd(1.6);ai.jinkMode=Math.random()<.25?'vert':'break';ai.jinkDir=Math.random()<.5?1:-1;}
  _a.subVectors(o.p,pl.p).normalize();_b.crossVectors(f,UPV).normalize();// break into the attacker's side, alternating (scissors)
  if(ai.jinkMode==='vert'){aim.copy(f).addScaledVector(UPV,pl.sp>s.stall*2.4?1.4:-.4);}else{const side=Math.sign(_b.dot(_a))||1;aim.copy(_b).multiplyScalar(side*ai.jinkDir).addScaledVector(f,.25);aim.y+=pl.sp<s.stall*1.8?-.35:.05;}
  aim.normalize();instruct(pl,aim,c,{gentle:1});c.thr=1;c.ab=true;if(Math.random()<dt*.4*sk.flare&&pl.flares>0&&ai.flareCd<=0){c.flare=true;ai.flareCd=2;}ai.mode='defend';return;}
 // ---- roles that do not dogfight unless engaged
 if(ai.role==='striker'&&ai.strike&&!(ai.tgt&&ai.tgt.p.distanceTo(pl.p)<500&&pl.hp<pl.s.hp)){strike(pl,W,dt,aim,sk);return;}
 const t=ai.tgt;
 if(!t){// patrol: orbit the leash point or wander
  const cp=ai.leash?ai.leash.p:ai.home||(ai.home=pl.p.clone());const ang=(W.time*.07+pl.id)%6.283;_a.set(cp.x+Math.cos(ang)*1600,Math.max(1200,cp.y||0),cp.z+Math.sin(ang)*1600);aim.subVectors(_a,pl.p).normalize();instruct(pl,aim,c,{gentle:.6});c.thr=.8;c.ab=false;ai.mode='patrol';return;}
 // ---- offensive: energy-aware lead pursuit
 const rel=_a.subVectors(t.p,pl.p),dist=rel.length();rel.divideScalar(dist);const off=Math.acos(cl(f.dot(rel),-1,1));const clos=-_b.subVectors(t.v,pl.v).dot(rel);
 const gs=s.gun?s.gun.spd:900;const lp=leadPoint(pl,t,gs,ai.lp||(ai.lp=new V()));
 if(dist>1700){aim.copy(t.p);aim.y+=Math.min(400,dist*.12);aim.sub(pl.p).normalize();thr=1;ab=dist>3500||pl.sp<s.vmax*.75;}
 else{aim.subVectors(lp,pl.p).normalize().add(ai.err).normalize();
  // energy: unload when slow and the shot is far off the nose
  if(pl.sp<s.stall*1.75&&off>.7){aim.copy(f).setY(f.y-.6).normalize().lerp(rel,.35).normalize();gentle=.5;ai.mode='extend';}
  else ai.mode='attack';
  // overshoot management
  if(dist<320&&clos>45){thr=.15;c.brake=clos>90;}else if(dist<600&&clos>80)thr=.5;
  if(dist<130&&off<.6){aim.copy(f).addScaledVector(UPV,1).normalize();}
  ab=pl.sp<s.vmax*.85&&dist>500;}
 // head-on collision avoidance
 if(dist<380&&clos>260&&t.fwd(_u).dot(rel)<-.8){aim.addScaledVector(_b.crossVectors(f,UPV).normalize(),.8).normalize();}
 instruct(pl,aim,c,{gentle});c.thr=thr;c.ab=ab;
 // ---- weapons
 if(s.gun&&dist<sk.range&&pl.heat<.82){const ld=_b.subVectors(lp,pl.p).normalize();const err=Math.acos(cl(f.dot(ld),-1,1));const tol=sk.tol+Math.atan2(t.s.rad*.6,dist);const headOn=t.fwd(_u).dot(rel)<-.88;if(err<tol&&!(headOn&&(ai.skill??1)===0)&&!(headOn&&(ai.skill??1)===1&&Math.random()<.6))ai.burst=.18+rnd(.4)*sk.burst;}
 if(ai.burst>0){ai.burst-=dt;c.fire=true;}
 if(pl.msl>0&&(ai.skill??1)>0&&ai.cd<=0&&dist>450&&dist<3200&&off<.22&&!(W.clouds&&W.clouds.density(t.p)>.45)){ai.lockT=(ai.lockT||0)+dt;if(ai.lockT>sk.lockT){c.msl=t;ai.cd=8+rnd(9);ai.lockT=0;}}else ai.lockT=Math.max(0,(ai.lockT||0)-dt*2);
 ai.lockOn=ai.lockT>0?t:null;}
// ---- formation/route flying for bombers, transports and the fortress
function route(pl,W,dt,aim){const ai=pl.ai;if(ai.leader&&ai.leader.alive){const L=ai.leader;const off=_b.copy(ai.slot).applyQuaternion(L.q);const tp=_a.copy(L.p).add(off).addScaledVector(L.v,1.5);aim.subVectors(tp,pl.p);const d=aim.length();aim.normalize();
  const along=_u.subVectors(tp,pl.p).dot(L.fwd(_r));ai.thr=cl(.85+along*.01,.4,1);return;}
 const wp=ai.route[ai.wi];if(!wp){aim.copy(pl.fwd(_f));aim.y=0;aim.normalize();return;}_a.set(wp.x,wp.y,wp.z);if(_b.subVectors(_a,pl.p).setY(0).length()<500){if(ai.loop)ai.wi=(ai.wi+1)%ai.route.length;else ai.wi++;}
 aim.subVectors(_a,pl.p);aim.y*=.4;aim.normalize();const gh=Math.max(0,hAt(pl.p.x+pl.v.x*6,pl.p.z+pl.v.z*6));if(pl.p.y<gh+250)aim.y=Math.max(aim.y,.3);aim.normalize();ai.thr=.85;}
// ---- strike runs on ships / ground sites: approach, dive, release, egress
function strike(pl,W,dt,aim,sk){const ai=pl.ai,c=pl.ctrl,st=ai.strike;const tg=st.target;if(!tg||tg.dead){ai.strike=null;return;}
 const tp=tg.p,rel=_a.subVectors(tp,pl.p),hd=Math.hypot(rel.x,rel.z);st.phase=st.phase||'in';
 if(st.phase==='in'){const alt=st.alt||700;aim.set(rel.x,0,rel.z).normalize();aim.y=cl((alt-pl.p.y)/900,-.3,.3);
  // level bomb release: predicted fall time * speed
  const tf=Math.sqrt(2*Math.max(1,pl.p.y-tp.y)/GRAV);const lead=pl.sp*tf*.97;if(st.mode==='dive'&&hd<pl.p.y*1.3+200){st.phase='dive';}
  if(st.mode!=='dive'&&hd<lead+60&&hd>lead-160&&Math.abs(Math.atan2(rel.x,rel.z)-Math.atan2(pl.v.x,pl.v.z))<.25){c.bomb=true;st.drops=(st.drops||0)+1;if(st.drops>=(st.salvo||2)){st.phase='out';st.outT=9;}}}
 if(st.phase==='dive'){aim.copy(rel).normalize();if(pl.p.y-tp.y<520||hd<120){c.bomb=true;st.phase='out';st.outT=8;}if(pl.s.gun&&rel.length()<1100)c.fire=Math.random()<.7;}
 if(st.phase==='out'){st.outT-=dt;aim.copy(pl.fwd(_f)).setY(.35).normalize();if(st.outT<=0){st.phase='turn';}}
 if(st.phase==='turn'){aim.set(rel.x,0,rel.z).normalize();aim.y=cl((900-pl.p.y)/800,-.2,.4);if(hd>2600||Math.acos(cl(pl.fwd(_f).dot(_b.copy(rel).normalize()),-1,1))<.3){st.phase='in';st.drops=0;}}
 aim.normalize();instruct(pl,aim,c,{gentle:.85});c.thr=1;c.ab=false;ai.mode='strike';}
// turret gunners (bombers, fortress, carrier CIWS, AA): pick a target in range, return a lead aim point
export function gunnerAim(from,W,team,range,out){let best=null,bd=range;for(const o of W.planes){if(!o.alive||o.team===team)continue;const d=o.p.distanceTo(from);if(d<bd){bd=d;best=o;}}if(!best)return null;const t=bd/850;out.copy(best.p).addScaledVector(best.v,t);out.y+=.25*GRAV*t*t;return best;}
