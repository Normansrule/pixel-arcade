// NOVA ARENA — CPU fighters. Bots drive the same input struct as the player: perception with reaction delay, smoothed
// human-like aim with drifting error and target leading, weapon choice by range, item / power-weapon / hill goals,
// A* path following over the nav graph (jumps, jetpack climbs, pads, teleporters), strafe-jumping, slides and grenades.
import {V,cl,wrapA,rnd,damp} from './util.js';
import {WPN} from './weapons.js';
import {PHY} from './world.js';

export const BOTDIFF=[
 {n:'RECRUIT',react:.62,err:.085,track:3.6,turn:3.2,strafe:.35,jet:.3,power:.3,nade:.08,hs:.05,lead:.15,fireCone:1.3,hear:20,fov:.35},
 {n:'VETERAN',react:.36,err:.045,track:6.5,turn:5.5,strafe:.75,jet:.7,power:.7,nade:.22,hs:.22,lead:.6,fireCone:1,hear:32,fov:.15},
 {n:'LEGEND',react:.2,err:.022,track:11,turn:9,strafe:1,jet:1,power:1,nade:.4,hs:.5,lead:.92,fireCone:.8,hear:45,fov:0}];
export const CALLSIGNS=['VEGA','ORION','KESTREL','TALON','NYX','RIGEL','SABLE','JUNO','DRAKE','LYRA','ONYX','PYRE','CINDER','ZEN','COBALT','MARROW','QUILL','RUNE','VOLK','ECHO','WREN','AXIOM','FABLE','GHOST'];

const tv=new V(),tv2=new V();
export function newBrain(diff){return{d:diff,target:null,seenT:0,lostT:9,lastPos:new V(),lastT:-99,path:null,pi:0,goal:null,goalT:0,repath:0,stuckT:0,stuckP:new V(),strafe:1,strafeT:0,jumpT:0,
 errP:Math.random()*100,aimYaw:0,aimPitch:0,nadeCD:3+rnd(4),thinkT:0,hsBias:Math.random()<diff.hs,jetHold:0,waitLand:0,meleeCD:0,slideCD:0,engageT:0,heard:null,want:null,flinch:0};}

// G exposes: fighters, W (world), D (map data), items, mode, hill(), enemy(a,b), time, los(a,b)
export function think(f,G,dt){const b=f.ai,d=b.d,W=G.W,inp=f.inp;inp.fwd=inp.side=0;inp.jump=inp.jumpEdge=inp.sprint=inp.slide=inp.fire=inp.zoom=inp.reload=inp.melee=inp.nade=inp.swap=inp.interact=false;
 if(!f.alive)return;b.nadeCD-=dt;b.meleeCD-=dt;b.slideCD-=dt;b.flinch=Math.max(0,b.flinch-dt);
 /* ---------- perception ---------- */
 b.thinkT-=dt;if(b.thinkT<=0){b.thinkT=.12+rnd(.06);perceive(f,G);}
 const t=b.target&&b.target.alive?b.target:null;if(!t){b.target=null;b.seenT=0;}
 const vis=t&&b.lostT<.05;if(vis)b.seenT+=dt;else b.seenT=Math.max(0,b.seenT-dt*2);
 const eye=tv.copy(f.pos);eye.y+=f.slideT>0?PHY.eyeSlide:PHY.eye;
 /* ---------- weapon management ---------- */
 const w=f.weapons[f.wi],wd=w&&WPN[w.id];const dist=t?t.pos.distanceTo(f.pos):99;
 if(w&&f.reloadT<=0&&f.swapT<=0){const other=f.weapons[1-f.wi];
  if(w.mag===0&&w.res===0&&other&&(other.mag>0||other.res>0))inp.swap=true;
  else if(t&&other&&(other.mag>0||other.res>0)&&b.seenT>0){const score=(x,dd)=>{const p=WPN[x.id].pref;return(dd>=p[0]&&dd<=p[1]?2:0)+WPN[x.id].tier*.6-(x.mag===0?3:0)-Math.max(0,p[0]-dd)*.1-Math.max(0,dd-p[1])*.05;};
   if(score(other,dist)>score(w,dist)+1.2&&Math.random()<dt*2)inp.swap=true;}
  else if(w.mag===0&&w.res>0)inp.reload=true;else if(!vis&&b.lostT>1.5&&w.mag<WPN[w.id].mag*.5&&w.res>0&&!wd.noReload)inp.reload=true;}
 /* ---------- aim ---------- */
 let aimOk=false;
 if(t&&(vis||b.lostT<1.2)){const tgt=tv2.copy(vis?t.pos:b.lastPos);const precision=wd&&(wd.precision||wd.scope);tgt.y+=(t.slideT>0?.75:(b.hsBias&&precision?1.62:1.18));
  if(vis&&wd){const tof=wd.proj?dist/wd.speed:0,ld=d.lead;tgt.x+=t.vel.x*(tof+.06)*ld;tgt.z+=t.vel.z*(tof+.06)*ld;tgt.y+=Math.max(-2,t.vel.y*tof*.5)*ld;if(wd.proj)tgt.y-=1;}
  // drifting error grows with distance and target motion, shrinks with time on target
  b.errP+=dt*(1.3+Math.hypot(t.vel.x,t.vel.z)*.12);const settle=1/(1+b.seenT*1.6),ts=Math.hypot(t.vel.x,t.vel.z);const e=d.err*(.45+settle*1.3+ts*.035+b.flinch*1.5)*(t.camo>0?2.2:1);
  const ex=Math.sin(b.errP*1.7)+Math.sin(b.errP*3.1+1.3)*.5,ey=Math.sin(b.errP*2.3+2)*.6+Math.sin(b.errP*4.1)*.3;
  const dx=tgt.x-eye.x,dy=tgt.y-eye.y,dz=tgt.z-eye.z,hd=Math.hypot(dx,dz);const wy=Math.atan2(-dx,-dz)+ex*e,wp=Math.atan2(dy,hd)+ey*e*.7;
  const k=1-Math.exp(-d.track*dt),dyw=wrapA(wy-f.yaw),mx=d.turn*dt;f.yaw+=cl(dyw*k,-mx,mx);f.pitch+=cl((wp-f.pitch)*k,-mx,mx);f.pitch=cl(f.pitch,-1.45,1.45);
  const err=Math.abs(wrapA(wy-f.yaw))+Math.abs(wp-f.pitch);const cone=(wd?.melee?.5:wd?.scope?.035:wd?.pel?.12:wd?.proj?.09:.06)*d.fireCone+Math.atan2(.5,Math.max(1,dist));aimOk=err<cone;}
 else if(b.path&&b.path[b.pi]){const n=b.path[b.pi].n;const dx=n.x-f.pos.x,dz=n.z-f.pos.z;if(dx*dx+dz*dz>.5){const wy=Math.atan2(-dx,-dz);f.yaw+=wrapA(wy-f.yaw)*(1-Math.exp(-dt*5));}f.pitch=damp(f.pitch,0,3,dt);}
 /* ---------- fire / melee / grenades ---------- */
 if(t&&vis&&wd&&b.seenT>d.react&&f.swapT<=0){const inRange=dist<(wd.melee?wd.lunge+.5:wd.range*.9);
  if(dist<2.3&&b.meleeCD<=0&&!wd.melee){inp.melee=true;b.meleeCD=1+rnd(.6);}
  else if(inRange&&aimOk){if(wd.melee){if(dist<wd.lunge)inp.fire=true;}else if(!(wd.proj&&dist<3.2&&f.health+f.shield<180))inp.fire=true;}
  if(wd.scope&&dist>18)inp.zoom=true;
  if(b.nadeCD<=0&&dist>7&&dist<26&&(f.nades.frag+f.nades.plasma)>0&&Math.random()<d.nade){inp.nade=true;f.nadeSel=f.nades.plasma>0&&dist<16?'plasma':f.nades.frag>0?'frag':'plasma';b.nadeCD=5+rnd(6);}
  else if(b.nadeCD<=0)b.nadeCD=1.5;}
 else if(t&&!vis&&b.lostT>.4&&b.lostT<2.5&&b.nadeCD<=0&&f.nades.frag>0&&dist<22&&Math.random()<d.nade*.5){f.pitch=.35;inp.nade=true;f.nadeSel='frag';b.nadeCD=6+rnd(5);}
 /* ---------- goals + movement ---------- */
 b.goalT-=dt;if(b.goalT<=0||!b.path){chooseGoal(f,G);b.goalT=1.2+rnd(1.4);}
 const mv=tv.set(0,0,0);let wantJump=false,wantJet=false,sprint=false;
 if(b.waitLand>0){b.waitLand-=dt;if(f.onGround&&b.waitLand<.9)b.waitLand=0;}
 const node=b.path&&b.path[b.pi];
 if(node&&b.waitLand<=0){const n=node.n,dx=n.x-f.pos.x,dz=n.z-f.pos.z,hd=Math.hypot(dx,dz),dy=n.y-f.pos.y;mv.set(dx,0,dz);if(hd>.01)mv.divideScalar(hd);
  if(node.t===2&&hd<1.8&&f.onGround)wantJump=true;
  if(node.t===3){if(f.onGround&&hd<2.2)wantJump=true;if(!f.onGround&&f.pos.y<n.y+.6){wantJet=true;if(f.pos.y<n.y-.3&&hd<1.2)mv.multiplyScalar(.2);}}
  if((node.t===4||node.t===5)&&hd<1.4){b.waitLand=1.6;}
  const reached=hd<(node.t===0?.9:.75)&&dy<1.3&&dy>-(node.t===1?20:1.4);if(reached){b.pi++;if(b.pi>=b.path.length){b.path=null;b.goalT=Math.min(b.goalT,.2);}}
  sprint=!t&&hd>3&&node.t===0;}
 // combat movement: strafe, keep preferred distance, strafe-jump, slides
 if(t&&(vis||b.lostT<1)&&wd){b.engageT+=dt;b.strafeT-=dt;if(b.strafeT<=0){b.strafe=Math.random()<.5?-1:1;b.strafeT=.35+rnd(.9)/(.5+d.strafe);}
  const toT=tv2.subVectors(t.pos,f.pos).setY(0).normalize();const sideV=new V(-toT.z,0,toT.x);const p=wd.pref;let adv=0;if(dist>p[1])adv=1;else if(dist<p[0]+1&&!wd.melee&&!wd.pel)adv=-.7;if(wd.melee||wd.pel)adv=dist>2?1:0;
  const combat=new V().addScaledVector(sideV,b.strafe*d.strafe).addScaledVector(toT,adv);if(b.path&&b.goal&&b.goal.kind!=='hunt')combat.lerp(mv,.5);mv.copy(combat);
  if(f.onGround&&Math.random()<dt*d.strafe*.9)wantJump=true;if(!f.onGround&&f.vel.y<0&&f.fuel>.5&&Math.random()<dt*d.jet*1.5)b.jetHold=.3+rnd(.4);
  if((wd.pel||wd.melee)&&dist<10&&f.onGround&&b.slideCD<=0&&Math.random()<dt*d.strafe){inp.slide=true;inp.sprint=true;b.slideCD=3;mv.copy(toT);}}
 else b.engageT=0;
 if(b.jetHold>0){b.jetHold-=dt;wantJet=true;}
 // stuck detection
 b.stuckT+=dt;if(b.stuckT>1.1){const moved=f.pos.distanceTo(b.stuckP);b.stuckP.copy(f.pos);b.stuckT=0;if(moved<.6&&mv.lengthSq()>.1&&b.waitLand<=0){b.stuck=(b.stuck||0)+1;wantJump=true;if(b.stuck>2){b.path=null;b.goalT=0;b.stuck=0;b.strafe*=-1;}}else b.stuck=0;}
 // world move dir -> local input
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);inp.fwd=cl(-(mv.x*sy+mv.z*cy),-1,1);inp.side=cl(mv.x*cy-mv.z*sy,-1,1);
 inp.sprint=inp.sprint||sprint&&inp.fwd>.7;if(wantJump){if(f.onGround||!b.jHeld)inp.jumpEdge=true;}if(wantJump||wantJet)inp.jump=true;b.jHeld=inp.jump;}

function perceive(f,G){const b=f.ai,d=b.d,W=G.W;let best=null,bs=1e9;const eye=new V(f.pos.x,f.pos.y+PHY.eye,f.pos.z);const fx=-Math.sin(f.yaw),fz=-Math.cos(f.yaw);
 for(const o of G.fighters){if(o===f||!o.alive||!G.enemy(f,o))continue;const dx=o.pos.x-f.pos.x,dz=o.pos.z-f.pos.z,dy=o.pos.y-f.pos.y,dist=Math.hypot(dx,dy,dz);if(dist>90)continue;
  const camo=o.camo>0&&dist>6&&o.lastFire<G.time-1;if(camo&&dist>9)continue;const front=(dx*fx+dz*fz)/Math.max(.1,Math.hypot(dx,dz));
  const aware=front>d.fov-.25||dist<7||o===b.target&&b.lostT<2||o===f.lastHitBy&&G.time-f.lastHitT<2;if(!aware)continue;
  const tp=new V(o.pos.x,o.pos.y+(o.slideT>0?.7:1.3),o.pos.z);if(!W.los(eye,tp)){tp.y=o.pos.y+1.65;if(!W.los(eye,tp))continue;}
  let s=dist+(o===b.target?-8:0)+(o.shield+o.health)*.03-(o===f.lastHitBy?10:0);if(G.mode==='koth'&&G.inHill(o))s-=6;if(s<bs){bs=s;best=o;}}
 if(best){if(best!==b.target){b.target=best;b.seenT=0;b.hsBias=Math.random()<d.hs;}b.lostT=0;b.lastPos.copy(best.pos);b.lastT=G.time;}
 else{b.lostT+=.15;if(b.target&&b.lostT>4)b.target=null;}
 // hearing: gunfire nearby gives a position to investigate
 if(!best&&G.noise&&G.noise.t>G.time-1.2&&G.noise.who!==f&&G.enemy(f,G.noise.who)&&G.noise.p.distanceTo(f.pos)<d.hear){b.heard=G.noise.p.clone();}}

function setGoal(f,G,kind,p){const b=f.ai;b.goal={kind,p:p.clone?p.clone():p};const path=G.W.path(f.pos,p);if(path&&path.length){b.path=path;b.pi=0;}else{b.path=null;}return!!b.path;}
function chooseGoal(f,G){const b=f.ai,d=b.d;const items=G.items;const hp=f.health+f.shield;
 // 1) heal when hurt and not mid-duel at close range
 if(f.health<55&&f.shield<40){const hk=nearestItem(f,items.filter(i=>i.kind==='health'&&i.ready),40);if(hk&&setGoal(f,G,'heal',hk.p))return;}
 // 2) King of the Hill
 if(G.mode==='koth'&&G.hill()){const h=G.hill();const off=new V((Math.random()-.5)*h.r*1.2,0,(Math.random()-.5)*h.r*1.2);if(Math.random()<.85&&setGoal(f,G,'hill',h.p.clone().add(off)))return;}
 // 3) power weapons / power-ups / better guns
 const want=items.filter(i=>i.ready&&(i.kind==='power'||i.kind==='rack'&&WPN[i.w].power&&!f.weapons.some(w=>w.id===i.w)||i.kind==='rack'&&!f.weapons.some(w=>w.id===i.w)&&f.weapons.length<2)).map(i=>({i,d:i.p.distanceTo(f.pos)-(i.kind==='power'?12:WPN[i.w]?.power?10:0)}));
 want.sort((a,c)=>a.d-c.d);if(want.length&&want[0].d<34&&Math.random()<d.power*(b.target?.4:1)){if(setGoal(f,G,'item',want[0].i.p))return;}
 // ammo: low on everything -> grab a matching rack
 const w=f.weapons[f.wi];if(w&&w.mag+w.res<WPN[w.id].mag*.6){const r=nearestItem(f,items.filter(i=>i.kind==='rack'&&i.ready&&f.weapons.some(x=>x.id===i.w)),45);if(r&&setGoal(f,G,'ammo',r.p))return;}
 if(f.nades.frag+f.nades.plasma===0&&Math.random()<.5){const r=nearestItem(f,items.filter(i=>i.kind==='nade'&&i.ready),30);if(r&&setGoal(f,G,'nade',r.p))return;}
 // 4) hunt: last known target / heard noise / nearest enemy loosely
 if(b.target&&b.lostT<6&&setGoal(f,G,'hunt',b.lastPos))return;if(b.heard&&setGoal(f,G,'hunt',b.heard)){b.heard=null;return;}
 if(Math.random()<.45){let e=null,ed=1e9;for(const o of G.fighters)if(o!==f&&o.alive&&G.enemy(f,o)){const dd=o.pos.distanceTo(f.pos);if(dd<ed){ed=dd;e=o;}}if(e){const p=e.pos.clone().add(new V((Math.random()-.5)*14,0,(Math.random()-.5)*14));if(setGoal(f,G,'hunt',p))return;}}
 // 5) roam
 const R=G.W.roam;for(let k=0;k<4;k++){const n=R[Math.random()*R.length|0];if(n&&setGoal(f,G,'roam',n))return;}}
function nearestItem(f,list,max){let best=null,bd=max;for(const i of list){const d=i.p.distanceTo(f.pos);if(d<bd){bd=d;best=i;}}return best;}
