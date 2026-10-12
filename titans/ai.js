// HARDFALL — CPU combatants. Pilots and grunts drive the same input struct as the player: perception with reaction delay,
// drifting human-like aim with target leading, weapon choice by range, A* over the pilot nav graph (jumps, double-jump + mantle
// climbs, drops), strafe-jumps / slides (walls catch them into wall-runs), grenades, frame call-ins and boarding, fleeing hostile frames.
// Frames (mechs) path over a coarse ground graph, keep a fighting distance, strafe, spin the chaingun, fire salvos, raise the aegis and dash.
import {V,cl,wrapA,rnd,damp} from './util.js';
import {WPN,MECH} from './weapons.js';
import {PHY} from './world.js';

export const BOTDIFF=[
 {n:'RECRUIT',react:.66,err:.09,track:3.4,turn:3,strafe:.35,nade:.06,hs:.05,lead:.15,fireCone:1.3,fov:.35,seek:.15,mech:.55},
 {n:'VETERAN',react:.38,err:.05,track:6,turn:5,strafe:.75,nade:.16,hs:.2,lead:.6,fireCone:1,fov:.15,seek:.3,mech:.8},
 {n:'ELITE',react:.22,err:.027,track:10,turn:8,strafe:1,nade:.28,hs:.45,lead:.9,fireCone:.82,fov:0,seek:.4,mech:1}];
export const CALLSIGNS=['VEGA','ORION','KESTREL','TALON','NYX','RIGEL','SABLE','JUNO','DRAKE','LYRA','ONYX','PYRE','CINDER','ZEN','COBALT','MARROW','QUILL','RUNE','VOLK','ECHO','WREN','AXIOM','FABLE','HOLLOW','BRANDT','SKYE','MOTH','HALE'];

const tv=new V(),tv2=new V();
export function newBrain(diff){return{d:diff,target:null,seenT:0,lostT:9,lastPos:new V(),lastT:-99,path:null,pi:0,goal:null,goalT:0,stuckT:0,stuckP:new V(),strafe:1,strafeT:0,
 errP:Math.random()*100,nadeCD:3+rnd(4),thinkT:0,hsBias:Math.random()<diff.hs,waitLand:0,meleeCD:0,slideCD:0,heard:null,flinch:0,threat:null,seekLike:Math.random()<diff.seek,callDelay:1+rnd(4)};}
const clearInp=inp=>{inp.fwd=inp.side=0;inp.jump=inp.jumpEdge=inp.sprint=inp.slide=inp.fire=inp.zoom=inp.reload=inp.melee=inp.nade=inp.swap=inp.interact=inp.dash=inp.shield=inp.callMech=false;inp.swapTo=-1;};
const aimH=t=>t.isMech?3.6:t.slideT>0?.75:1.15;

// G exposes: fighters, mechs, W, WM, D, time, enemy(a,b), mechOf(f), noise
export function think(f,G,dt){const b=f.ai,inp=f.inp;clearInp(inp);if(!f.alive)return;
 if(f.mech){if(f.mech.state==='piloted')thinkMech(f,f.mech,G,dt);return;}
 const d=b.d,grunt=f.kind==='grunt';b.nadeCD-=dt;b.meleeCD-=dt;b.slideCD-=dt;b.flinch=Math.max(0,b.flinch-dt);
 b.thinkT-=dt;if(b.thinkT<=0){b.thinkT=.13+rnd(.07);perceive(f,G);}
 let t=b.target&&(b.target.isMech?b.target.state!=='dead':b.target.alive&&!b.target.mech)?b.target:null;if(!t){b.target=null;b.seenT=0;}
 const vis=t&&b.lostT<.05;if(vis)b.seenT+=dt;else b.seenT=Math.max(0,b.seenT-dt*2);
 const eye=tv.copy(f.pos);eye.y+=f.slideT>0?PHY.eyeSlide:PHY.eye;const dist=t?t.pos.distanceTo(f.pos):99;
 /* weapons */
 if(!grunt&&t&&f.swapT<=0&&f.reloadT<=0){const want=t.isMech?0:dist<8?1:dist<16&&b.seekLike?2:0;if(want!==f.wi&&b.seenT>.1&&Math.random()<dt*4)inp.swapTo=want;}
 const w=f.weapons[f.wi],wd=w&&WPN[w.id];
 if(w&&w.mag===0)inp.reload=true;else if(w&&!vis&&b.lostT>1.5&&w.mag<wd.mag*.5)inp.reload=true;
 /* aim */
 let aimOk=false;
 if(t&&(vis||b.lostT<1.2)){const tgt=tv2.copy(vis?t.pos:b.lastPos);tgt.y+=t.isMech?3.4:(b.hsBias&&!grunt?1.58:aimH(t));
  if(vis){const ld=d.lead;tgt.x+=t.vel.x*.06*ld;tgt.z+=t.vel.z*.06*ld;}
  b.errP+=dt*(1.3+Math.hypot(t.vel.x,t.vel.z)*.12);const settle=1/(1+b.seenT*1.6),ts=Math.hypot(t.vel.x,t.vel.z);const e=d.err*(grunt?1.7:1)*(.45+settle*1.3+ts*.035+b.flinch*1.5)*(t.wallT>0?1.4:1);
  const ex=Math.sin(b.errP*1.7)+Math.sin(b.errP*3.1+1.3)*.5,ey=Math.sin(b.errP*2.3+2)*.6+Math.sin(b.errP*4.1)*.3;
  const dx=tgt.x-eye.x,dy=tgt.y-eye.y,dz=tgt.z-eye.z,hd=Math.hypot(dx,dz);const wy=Math.atan2(-dx,-dz)+ex*e,wp=Math.atan2(dy,hd)+ey*e*.7;
  const k=1-Math.exp(-d.track*(grunt?.6:1)*dt),dyw=wrapA(wy-f.yaw),mx=d.turn*dt;f.yaw+=cl(dyw*k,-mx,mx);f.pitch+=cl((wp-f.pitch)*k,-mx,mx);f.pitch=cl(f.pitch,-1.45,1.45);
  const err=Math.abs(wrapA(wy-f.yaw))+Math.abs(wp-f.pitch);const cone=(wd?.pel?.12:wd?.smart?.2:.06)*d.fireCone+Math.atan2(t.isMech?2:.5,Math.max(1,dist));aimOk=err<cone;}
 else if(b.path&&b.path[b.pi]){const n=b.path[b.pi].n;const dx=n.x-f.pos.x,dz=n.z-f.pos.z;if(dx*dx+dz*dz>.5){const wy=Math.atan2(-dx,-dz);f.yaw+=wrapA(wy-f.yaw)*(1-Math.exp(-dt*5));}f.pitch=damp(f.pitch,0,3,dt);}
 /* fire / melee / grenades */
 if(t&&vis&&wd&&b.seenT>d.react*(grunt?1.4:1)&&f.swapT<=0){const pilotVsMech=t.isMech&&!grunt;
  if(!t.isMech&&dist<2.2&&b.meleeCD<=0){inp.melee=true;b.meleeCD=1.2+rnd(.6);}
  else if(dist<wd.range*.92&&aimOk&&!(pilotVsMech&&dist>40))inp.fire=true;
  if(!grunt&&b.nadeCD<=0&&f.nades>0&&dist>7&&dist<26&&Math.random()<(t.isMech?d.nade*3:d.nade)){inp.nade=true;b.nadeCD=4+rnd(5);}else if(b.nadeCD<=0)b.nadeCD=1.2;}
 /* frame: call in when ready, then go and board it */
 const own=G.mechOf(f);
 if(!grunt&&f.meter>=1&&!own){b.callDelay-=dt;if(b.callDelay<=0&&(!t||dist>14)){inp.callMech=true;b.callDelay=1+rnd(3);}}
 if(own&&own.state==='idle'){const md=Math.hypot(own.pos.x-f.pos.x,own.pos.z-f.pos.z);if(md<4.2)inp.interact=true;else if(!b.goal||b.goal.kind!=='board'||b.goalT<=0){setGoal(f,G,'board',own.pos);b.goalT=2;}}
 /* goals + movement */
 b.goalT-=dt;if(b.goalT<=0||!b.path){chooseGoal(f,G);b.goalT=1.4+rnd(1.6);}
 const mv=tv.set(0,0,0);let wantJump=false,sprint=false;
 if(b.waitLand>0){b.waitLand-=dt;if(f.onGround&&b.waitLand<.9)b.waitLand=0;}
 const node=b.path&&b.path[b.pi];
 if(node&&b.waitLand<=0){const n=node.n,dx=n.x-f.pos.x,dz=n.z-f.pos.z,hd=Math.hypot(dx,dz),dy=n.y-f.pos.y;mv.set(dx,0,dz);if(hd>.01)mv.divideScalar(hd);
  if(node.t===2&&hd<1.9&&f.onGround)wantJump=true;
  if(node.t===3){if(f.onGround&&hd<2.4)wantJump=true;else if(!f.onGround&&f.vel.y<1.2&&f.dbl&&f.pos.y<n.y)wantJump=true;if(!f.onGround&&f.pos.y<n.y-.4&&hd<1)mv.multiplyScalar(.3);}
  const reached=hd<(node.t===0?1:.8)&&dy<1.3&&dy>-(node.t===1?20:1.4);if(reached){b.pi++;if(b.pi>=b.path.length){b.path=null;b.goalT=Math.min(b.goalT,.2);}}
  sprint=(!t||!vis)&&hd>3&&node.t===0;}
 // combat movement
 if(t&&(vis||b.lostT<1)&&wd&&!(b.threat&&!t.isMech&&b.goal&&b.goal.kind==='flee')){b.strafeT-=dt;if(b.strafeT<=0){b.strafe=Math.random()<.5?-1:1;b.strafeT=.35+rnd(.9)/(.5+d.strafe);}
  const toT=tv2.subVectors(t.pos,f.pos).setY(0).normalize();const sideV=new V(-toT.z,0,toT.x);const p=wd.pref;let adv=0;if(dist>p[1])adv=1;else if(dist<p[0]+1&&!wd.pel)adv=-.7;if(wd.pel)adv=dist>3?1:0;if(t.isMech)adv=-.6;
  const combat=new V().addScaledVector(sideV,b.strafe*d.strafe*(grunt?.5:1)).addScaledVector(toT,adv);if(b.path&&b.goal&&b.goal.kind!=='hunt')combat.lerp(mv,.55);mv.copy(combat);
  if(!grunt){if(f.onGround&&Math.random()<dt*d.strafe*.9)wantJump=true;else if(!f.onGround&&f.dbl&&f.vel.y<0&&Math.random()<dt*d.strafe*1.5)wantJump=true;
   if(wd.pel&&dist<10&&f.onGround&&b.slideCD<=0&&Math.random()<dt*d.strafe){inp.slide=true;inp.sprint=true;b.slideCD=3;mv.copy(toT);}}}
 // stuck detection
 b.stuckT+=dt;if(b.stuckT>1.1){const moved=f.pos.distanceTo(b.stuckP);b.stuckP.copy(f.pos);b.stuckT=0;if(moved<.6&&mv.lengthSq()>.1&&b.waitLand<=0){b.stuck=(b.stuck||0)+1;wantJump=true;if(b.stuck>2){b.path=null;b.goalT=0;b.stuck=0;b.strafe*=-1;}}else b.stuck=0;}
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);inp.fwd=cl(-(mv.x*sy+mv.z*cy),-1,1);inp.side=cl(mv.x*cy-mv.z*sy,-1,1);
 inp.sprint=!grunt&&(inp.sprint||sprint&&inp.fwd>.7);if(wantJump&&!grunt){if(f.onGround||!b.jHeld)inp.jumpEdge=true;}else if(wantJump&&f.onGround)inp.jumpEdge=true;inp.jump=wantJump;b.jHeld=inp.jump;}

function perceive(f,G){const b=f.ai,d=b.d,W=G.W;let best=null,bs=1e9;const eye=new V(f.pos.x,f.pos.y+PHY.eye,f.pos.z);const fx=-Math.sin(f.yaw),fz=-Math.cos(f.yaw);const grunt=f.kind==='grunt';b.threat=null;let td=1e9;
 const consider=(o,isM)=>{const dx=o.pos.x-f.pos.x,dz=o.pos.z-f.pos.z,dy=o.pos.y-f.pos.y,dist=Math.hypot(dx,dy,dz);if(dist>(isM?110:85))return;
  const front=(dx*fx+dz*fz)/Math.max(.1,Math.hypot(dx,dz));const aware=isM||front>d.fov-.25||dist<7||o===b.target&&b.lostT<2||o===f.lastHitBy&&G.time-f.lastHitT<2;if(!aware)return;
  const tp=new V(o.pos.x,o.pos.y+(isM?3.6:o.slideT>0?.7:1.3),o.pos.z);if(!W.los(eye,tp)){tp.y=o.pos.y+(isM?5.5:1.65);if(!W.los(eye,tp))return;}
  if(isM&&dist<td){td=dist;b.threat=o;}
  let s=dist+(o===b.target?-8:0)-(o===f.lastHitBy?10:0)+(isM?(grunt?0:(f.nades>0&&dist<26?10:60)):0)+(o.kind==='grunt'&&!grunt?8:0);if(s<bs){bs=s;best=o;}};
 for(const o of G.fighters){if(o===f||!o.alive||o.mech||!G.enemy(f,o))continue;consider(o,false);}
 for(const m of G.mechs){if(m.state==='dead'||m.state==='drop'||m.team===f.team)continue;consider(m,true);}
 if(best){if(best!==b.target){b.target=best;b.seenT=0;b.hsBias=Math.random()<d.hs;}b.lostT=0;b.lastPos.copy(best.pos);b.lastT=G.time;}
 else{b.lostT+=.15;if(b.target&&b.lostT>4)b.target=null;}
 if(!best&&G.noise&&G.noise.t>G.time-1.2&&G.noise.who!==f&&G.noise.team!==f.team&&G.noise.p.distanceTo(f.pos)<34)b.heard=G.noise.p.clone();}

function setGoal(f,G,kind,p){const b=f.ai;b.goal={kind,p:p.clone?p.clone():p};const path=G.W.path(f.pos,p);if(path&&path.length){b.path=path;b.pi=0;}else b.path=null;return!!b.path;}
function chooseGoal(f,G){const b=f.ai;const own=G.mechOf(f);if(own&&own.state==='idle'&&setGoal(f,G,'board',own.pos))return;
 // hostile frame close by: break line of sight (pilots only)
 if(f.kind!=='grunt'&&b.threat&&b.threat.state==='piloted'&&b.threat.pos.distanceTo(f.pos)<34&&f.nades<=0){const R=G.W.roam;let best=null,bs=-1e9;for(let k=0;k<10;k++){const n=R[Math.random()*R.length|0];if(!n)continue;const s=Math.hypot(n.x-b.threat.pos.x,n.z-b.threat.pos.z)-Math.hypot(n.x-f.pos.x,n.z-f.pos.z)*.6+n.y*2;if(s>bs){bs=s;best=n;}}if(best&&setGoal(f,G,'flee',best))return;}
 if(b.target&&b.lostT<6&&setGoal(f,G,'hunt',b.lastPos))return;if(b.heard&&setGoal(f,G,'hunt',b.heard)){b.heard=null;return;}
 const fr=G.D.fronts;if(f.kind==='grunt'||Math.random()<.35){const p=fr[Math.random()*fr.length|0];if(p&&setGoal(f,G,'front',p.clone().add(new V((Math.random()-.5)*10,0,(Math.random()-.5)*10))))return;}
 if(Math.random()<.5){let e=null,ed=1e9;for(const o of G.fighters)if(o!==f&&o.alive&&!o.mech&&G.enemy(f,o)){const dd=o.pos.distanceTo(f.pos);if(dd<ed){ed=dd;e=o;}}if(e&&setGoal(f,G,'hunt',e.pos.clone().add(new V((Math.random()-.5)*14,0,(Math.random()-.5)*14))))return;}
 const R=G.W.roam;for(let k=0;k<4;k++){const n=R[Math.random()*R.length|0];if(n&&setGoal(f,G,'roam',n))return;}}

/* ---------------- frames ---------------- */
function thinkMech(f,m,G,dt){const b=f.ai,d=b.d,inp=f.inp,WM=G.WM;b.thinkT-=dt;b.mDash=(b.mDash||0)-dt;
 if(b.thinkT<=0){b.thinkT=.15+rnd(.08);const eye=new V(m.pos.x,m.pos.y+MECH.eye,m.pos.z);let best=null,bs=1e9;
  const con=(o,isM)=>{const dist=o.pos.distanceTo(m.pos);if(dist>(isM?120:75))return;const tp=new V(o.pos.x,o.pos.y+(isM?3.6:1.2),o.pos.z);if(!G.W.los(eye,tp))return;const s=dist-(isM?30:0)-(o===b.target?10:0)+(o.kind==='grunt'?10:0);if(s<bs){bs=s;best=o;}};
  for(const o of G.fighters)if(o.alive&&!o.mech&&G.enemy(f,o))con(o,false);for(const o of G.mechs)if(o!==m&&o.team!==m.team&&o.state!=='dead'&&o.state!=='drop')con(o,true);
  if(best){if(best!==b.target){b.target=best;b.seenT=0;}b.lostT=0;b.lastPos.copy(best.pos);}else{b.lostT+=.15;if(b.lostT>5)b.target=null;}}
 const t=b.target&&(b.target.isMech?b.target.state!=='dead':b.target.alive&&!b.target.mech)?b.target:null;const vis=t&&b.lostT<.05;if(vis)b.seenT+=dt;else b.seenT=Math.max(0,b.seenT-dt);
 const dist=t?t.pos.distanceTo(m.pos):99;let aimOk=false;
 if(t&&(vis||b.lostT<1.5)){const tgt=tv2.copy(vis?t.pos:b.lastPos);tgt.y+=t.isMech?3.4:1.1;tgt.x+=t.vel.x*.1*d.lead;tgt.z+=t.vel.z*.1*d.lead;
  b.errP+=dt*1.2;const e=d.err*.8*(.5+1/(1+b.seenT*1.4));const ex=Math.sin(b.errP*1.7)+Math.sin(b.errP*3.1+1.3)*.5,ey=Math.sin(b.errP*2.3+2)*.5;
  const dx=tgt.x-m.pos.x,dy=tgt.y-(m.pos.y+MECH.eye),dz=tgt.z-m.pos.z,hd=Math.hypot(dx,dz);const wy=Math.atan2(-dx,-dz)+ex*e,wp=Math.atan2(dy,hd)+ey*e;
  const k=1-Math.exp(-d.track*.7*dt),mx=d.turn*.6*dt;f.yaw+=cl(wrapA(wy-f.yaw)*k,-mx,mx);f.pitch+=cl((wp-f.pitch)*k,-mx,mx);
  const err=Math.abs(wrapA(wy-f.yaw))+Math.abs(wp-f.pitch);aimOk=err<.07*d.fireCone+Math.atan2(t.isMech?2.2:.6,Math.max(1,dist));}
 if(t&&vis&&b.seenT>d.react*.8){if(aimOk&&dist<MECH.cg.range*.9)inp.fire=true;else if(m.cg.spin>.5&&b.seenT>0)inp.fire=Math.random()<.5;
  if(m.rk.cd<=0&&aimOk&&(t.isMech&&dist<75||!t.isMech&&dist<35&&dist>6)&&Math.random()<dt*2*d.mech)inp.nade=true;
  if(t.isMech&&dist<5.8&&m.punchCD<=0)inp.melee=true;}
 if(m.recentDmg>260&&m.aegis.cd<=0&&t&&Math.random()<dt*4*d.mech)inp.shield=true;
 if(m.dash.n>0&&b.mDash<=0&&(m.recentDmg>180||t&&t.isMech&&dist<12)&&Math.random()<dt*2*d.mech){inp.dash=true;b.mDash=2.5;b.dashSide=Math.random()<.5?-1:1;}
 // movement
 b.goalT-=dt;const mv=tv.set(0,0,0);
 if(b.goalT<=0||!b.path){b.goalT=1.5+rnd(1.5);let goal=null;if(t){const want=t.isMech?24:18;if(dist>want+14)goal=t.pos;else if(dist<want-8){const away=tv2.subVectors(m.pos,t.pos).setY(0).normalize().multiplyScalar(12).add(m.pos);goal=away;}}
  if(!goal&&!t){const fr=G.D.fronts;goal=Math.random()<.6&&fr.length?fr[Math.random()*fr.length|0].clone().add(new V((Math.random()-.5)*16,0,(Math.random()-.5)*16)):null;if(!goal){const R=WM.reach;const n=R[Math.random()*R.length|0];if(n)goal=new V(n.x,n.y,n.z);}}
  if(goal){const p=WM.path(m.pos,goal);if(p&&p.length){b.path=p;b.pi=0;}else b.path=null;}else b.path=null;}
 const node=b.path&&b.path[b.pi];if(node){const n=node.n,dx=n.x-m.pos.x,dz=n.z-m.pos.z,hd=Math.hypot(dx,dz);mv.set(dx,0,dz);if(hd>.01)mv.divideScalar(hd);if(hd<2.2){b.pi++;if(b.pi>=b.path.length)b.path=null;}
  if(!t){const wy=Math.atan2(-dx,-dz);f.yaw+=wrapA(wy-f.yaw)*(1-Math.exp(-dt*2));f.pitch=damp(f.pitch,0,2,dt);}}
 if(t&&vis){b.strafeT-=dt;if(b.strafeT<=0){b.strafe=Math.random()<.5?-1:1;b.strafeT=1+rnd(2);}const toT=tv2.subVectors(t.pos,m.pos).setY(0).normalize();mv.lerp(new V(-toT.z*b.strafe,0,toT.x*b.strafe),.6);}
 b.stuckT+=dt;if(b.stuckT>1.5){const moved=m.pos.distanceTo(b.stuckP);b.stuckP.copy(m.pos);b.stuckT=0;if(moved<.8&&mv.lengthSq()>.1){b.path=null;b.goalT=0;b.strafe*=-1;}}
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);inp.fwd=cl(-(mv.x*sy+mv.z*cy),-1,1);inp.side=cl(mv.x*cy-mv.z*sy,-1,1);if(inp.dash&&b.dashSide){inp.side=b.dashSide;}}
