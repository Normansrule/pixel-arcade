// FORTRESS BREACH — CPU operators. Team planner (prep: reinforce / barricade / gadgets / drones; action: breach plans,
// entry, clearing, plant, retake, roaming) + per-bot brain (A* path following, perception, aim with reaction time,
// recoil control, wallbangs on known enemies, shooting gadgets and drones, barricade kicking).
import * as THREE from '../vendor/three.module.min.js';
import {FH,SITES,ROAM,CELL} from './level.js';
const V=THREE.Vector3,R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v;
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};

export class Brain{constructor(a){this.a=a;this.reset();}
 reset(){this.tasks=[];this.path=null;this.pi=0;this.goal=null;this.tgt=null;this.tgtK=null;this.reactT=0;this.know=null;this.knowT=-99;this.look=null;this.stuck=0;this.lastP=null;this.lastPT=0;this.repath=0;
  this.err=new V();this.percT=R()*.2;this.engT=0;this.headAim=false;this.taskT=0;this.dr=null;this.gTgt=null;this.wbT=0;this.kickT=0;this.sweep=R()*6;this.waitT=0;this.crouchHold=R()<.5;}
 heard(p,t,hurt){if(!this.know||t-this.knowT>.8||hurt){this.know={x:p.x,y:p.y,z:p.z};this.knowT=t;}}
 set(tasks){this.tasks=tasks;this.path=null;this.taskT=0;}
 get task(){return this.tasks[0];}
 next(){this.tasks.shift();this.path=null;this.taskT=0;this.a.ctl.use=false;}}

/* ============================================================ planning */
function standFor(L,pn,u,toSite,dist=.75){const ax=pn.axis==='x';const s=toSite;return ax?{x:u,z:pn.c+s*dist}:{x:pn.c+s*dist,z:u};}
function siteSideOf(C,pn,site){const ax=pn.axis==='x';const mu=(pn.u0+pn.u1)/2;for(const s of[-1,1]){const p=ax?new V(mu,site.f*FH+.5,pn.c+s*.6):new V(pn.c+s*.6,site.f*FH+.5,mu);if(C.inSite(p))return s;}return 1;}
export function planRound(G,C){const L=C.L,s=G.site;const bots=G.agents.filter(a=>a.brain&&a.alive);const defs=bots.filter(a=>C.side(a)==='def'),atks=bots.filter(a=>C.side(a)==='atk');
 G.plan={breachDone:false,actionPlanned:false,guess:null};
 /* ---------- defenders: reinforce, barricade, gadgets, holds ---------- */
 const work=[];const sh=s.reinP.slice();let budget=G.rein;
 for(const pn of sh){if(budget<=0)break;const side=siteSideOf(C,pn,s);const u=Math.max(pn.u0+.5,Math.min(pn.u1-.5,(pn.u0+pn.u1)/2));const st=standFor(L,pn,u,side,.8);work.push({k:'rein',pn,stand:st,look:pn.axis==='x'?{x:u,z:pn.c}:{x:pn.c,z:u},f:s.f});budget--;}
 for(const hi of s.hatch){if(budget<=0)break;const h=L.hatches[hi];work.push({k:'hrein',h,stand:{x:h.x+.5,z:h.z+.5},f:1});budget--;}
 // barricades on the site's doors + windows
 for(const op of L.openings){if(!op.bar||op.f!==s.f)continue;const ax=op.axis==='x';const mu=(op.a+op.b)/2;const onEdge=ax?(Math.abs(op.c-s.r[2])<.01||Math.abs(op.c-s.r[3])<.01)&&mu>s.r[0]&&mu<s.r[1]:(Math.abs(op.c-s.r[0])<.01||Math.abs(op.c-s.r[1])<.01)&&mu>s.r[2]&&mu<s.r[3];if(!onEdge)continue;
  const side=siteSideOf(C,op.panel,s);work.push({k:'bar',op,stand:standFor(L,op.panel,mu,side,.85),look:ax?{x:mu,z:op.c}:{x:op.c,z:mu},f:s.f});}
 work.sort((p,q)=>(p.k==='bar')-(q.k==='bar'));
 defs.forEach((a,i)=>{const T=[];const mine=[];for(let j=i;j<work.length;j+=Math.max(1,defs.length))mine.push(work[j]);const g=a.op.gad;
  const gpos=g==='wire'?s.traps.slice(0,a.gn).map(p=>({x:p[0],z:p[1]})):g==='trap'?s.traps.slice(1,1+a.gn).map(p=>({x:p[0]+.4,z:p[1]+.3})):g==='shield'?s.shield.map(p=>({x:p[0],z:p[1],yaw:p[2]?Math.PI/2:0})):g==='jammer'?s.jam.map(p=>({x:p[0],z:p[1]})):[];
  for(const p of gpos.slice(0,a.gn))T.push({k:'place',pos:p,f:s.f,yaw:p.yaw});T.push(...mine.filter(t=>t.k!=='bar'));
  // shotgun defenders open a murder hole in a soft site wall that overlooks an approach
  if(a.slots[1].def.brk&&R()<.7){const cand=s.breachP.filter(b=>!b.p.rein);if(cand.length){const b=cand[R()*cand.length|0];const side=-Math.sign(b.stand[b.p.axis==='x'?1:0]-b.p.c)||1;T.push({k:'murder',pn:b.p,u:b.u+(R()-.5)*.8,y:b.p.y0+1.3,stand:standFor(L,b.p,b.u,side,1.6),f:s.f});}}
  T.push(...mine.filter(t=>t.k==='bar'));const hold=s.holds[i%s.holds.length];const roam=i===defs.length-1&&defs.length>=3&&G.diff.n!=='EASY';
  T.push(roam?{k:'roam',f:s.f}:{k:'hold',x:hold[0],z:hold[1],f:s.f,look:{x:hold[2],z:hold[3]}});a.brain.set(T);a.brain.role=roam?'roam':'anchor';});
 /* ---------- attackers: drive drones during prep ---------- */
 const droneGoals=SITES.map(x=>({x:x.c[0],z:x.c[1],f:x.f})).sort(()=>R()-.5).concat(ROAM.map(r=>({x:r[0],z:r[1],f:r[2]})).sort(()=>R()-.5));
 atks.forEach((a,i)=>{a.brain.set([{k:'drone',goal:droneGoals[i%droneGoals.length]},{k:'wait'}]);a.brain.role=null;});}

// action-phase attacker plan (called at action start and when the objective is found)
function planAttack(G,C){const L=C.L,s=G.siteKnown?G.site:(G.plan.guess||(G.plan.guess=SITES[R()*SITES.length|0]));G.plan.target=s;G.plan.actionPlanned=true;
 const atks=G.agents.filter(a=>a.brain&&a.alive&&C.side(a)==='atk');if(!atks.length)return;
 const bps=s.breachP.slice().sort(()=>R()-.5);const volt=atks.find(a=>a.op.gad==='cutter'&&a.gn>0),forge=atks.find(a=>a.op.gad==='charge'&&a.gn>0);
 let used=new Set();const assign={};
 if(volt){const b=bps.find(b=>b.p.rein)||bps[0];if(b){assign[volt.id]=b;used.add(b);}}
 if(forge){const b=bps.find(b=>!b.p.rein&&!used.has(b))||bps.find(b=>!used.has(b));if(b&&!b.p.rein){assign[forge.id]=b;used.add(b);}}
 const sc=G.site.c;atks.forEach((a,i)=>{const T=[];const b=assign[a.id];
  if(b){T.push({k:'goto',x:b.stand[0],z:b.stand[1],f:b.f,bar:true});T.push({k:'breach',b});}
  else if(a.op.gad==='emp'&&a.gn>0){const tb=Object.values(assign)[0]||bps[0];if(tb){T.push({k:'goto',x:tb.stand[0]+(R()-.5),z:tb.stand[1]+(R()-.5),f:tb.f,bar:true});const pn=tb.p,ax=pn.axis==='x',side=ax?Math.sign(tb.stand[1]-pn.c):Math.sign(tb.stand[0]-pn.c);T.push({k:'emp',to:ax?{x:tb.u,y:tb.f*FH+1,z:pn.c-side*1.5}:{x:pn.c-side*1.5,y:tb.f*FH+1,z:tb.u}});}}
  else T.push({k:'wait',t:6+R()*10});
  T.push({k:'clear',site:s});if(G.opt.mode==='secure')T.push({k:'plant',site:s});T.push({k:'hold',x:s.holds[i%s.holds.length][0],z:s.holds[i%s.holds.length][1],f:s.f,look:{x:s.holds[i%s.holds.length][2],z:s.holds[i%s.holds.length][3]}});
  a.brain.set(T);a.brain.role=b?'breach':'entry';});}
// called every 0.4 s
export function teamTick(G,C){if(G.phase==='prep')return;
 if(!G.plan.defAction){G.plan.defAction=true;for(const d of G.agents){if(!d.brain||!d.alive||C.side(d)!=='def')continue;const T=d.brain.tasks;const keep=T.filter((t,i)=>t.k==='hold'||t.k==='roam'||(i===0&&d.brain.taskT>0&&(t.k==='rein'||t.k==='bar')));if(keep.length!==T.length)d.brain.set(keep);}}const atks=G.agents.filter(a=>a.brain&&a.alive&&C.side(a)==='atk'),defs=G.agents.filter(a=>a.brain&&a.alive&&C.side(a)==='def');
 if(G.phase==='action'){if(!G.plan.actionPlanned||(G.siteKnown&&G.plan.target!==G.site))planAttack(G,C);
  // the defuser carrier: when inside the site, plant
  if(G.opt.mode==='secure'){const car=G.defuser.state==='carried'?G.defuser.carrier:null;if(car&&car.brain&&C.inSite(car.pos)&&car.brain.task&&car.brain.task.k!=='plant'&&!car.brain.tgt)car.brain.tasks.unshift({k:'plant',site:G.site});
   if(G.defuser.state==='dropped'){const n=atks.slice().sort((p,q)=>p.pos.distanceTo(G.defuser.pos)-q.pos.distanceTo(G.defuser.pos))[0];if(n&&(!n.brain.task||n.brain.task.k!=='pickup'))n.brain.tasks.unshift({k:'pickup'});}}
  // capture mode: defenders contest
  if(G.opt.mode==='capture'&&G.contested===false&&G.cap>.05)for(const d of defs)if(!d.brain.task||d.brain.task.k!=='retake')d.brain.tasks.unshift({k:'retake',x:G.site.c[0],z:G.site.c[1],f:G.site.f});}
 if(G.phase==='post'){const d=G.defuser;defs.sort((p,q)=>p.pos.distanceTo(d.pos)-q.pos.distanceTo(d.pos));defs.forEach((a,i)=>{if(!a.brain.task||a.brain.task.k!=='disarm')a.brain.set([{k:'disarm'}]);});
  for(const a of atks){if(a.brain.task&&(a.brain.task.k==='hold'||a.brain.task.k==='guard'))continue;const h=G.site.holds[a.id%G.site.holds.length];a.brain.set([{k:'hold',x:h[0],z:h[1],f:G.site.f,look:{x:h[2],z:h[3]}}]);}}
 // late round: few attackers left -> defenders with nothing to do hunt known positions
 if(G.phase==='action'&&atks.length+G.agents.filter(a=>a.human&&a.alive&&C.side(a)==='atk').length<=1&&G.timer<70)for(const d of defs){if(d.brain.task&&d.brain.task.k==='hold'&&d.brain.know&&G.time-d.brain.knowT<6)d.brain.tasks.unshift({k:'goto',x:d.brain.know.x,z:d.brain.know.z,f:d.brain.know.y>2?1:0,tmo:12});}}

/* ============================================================ per-bot think */
export function think(G,C,a,dt){const b=a.brain,c=a.ctl,L=C.L;b.taskT+=dt;c.fire=false;c.ads=false;c.sprint=false;c.sprintOk=false;c.jump=false;c.lean=0;c.slot=null;c.reload=false;c.prone=false;
 if(a.vault)return;
 perceive(G,C,a,b,dt);
 // combat overrides tasks (except while finishing a plant/defuse when no target)
 if(b.tgt){combat(G,C,a,b,dt);return;}
 c.crouch=false;
 if(a.cur>2&&a.switchT<=0&&!(b.task&&['breach','place','emp','util'].includes(b.task.k)))C.switchTo(a,1);
 const g=a.gun();if(g&&g.mag<g.def.mag*.45&&g.res>0&&a.reloadT<=0)c.reload=true;
 // gadget targets: shoot traps / jammers / cameras / drones in sight
 if(b.gTgt&&b.gTgt.o&&(b.gTgt.o.alive===false))b.gTgt=null;if(b.gTgt){if(aimAt(a,b,b.gTgt.p,dt,G)<.03&&a.cur<=2)c.fire=true;b.gT-=dt;if(b.gT<=0)b.gTgt=null;moveHold(c);return;}
 // wallbang a known enemy position through soft walls
 if(wallbang(G,C,a,b,dt))return;
 const t=b.task;if(!t){idleLook(a,b,dt,G);moveHold(c);return;}
 switch(t.k){
  case'drone':{droneDrive(G,C,a,b,t,dt);moveHold(c);a.yaw+=Math.sin(G.time*.5+a.id)*.002;if(G.phase!=='prep'){if(a.drone){a.drone.ctl.mx=a.drone.ctl.mz=0;a.drone.ctl.world=false;}b.next();}break;}
  case'wait':{moveHold(c);idleLook(a,b,dt,G);if(t.t!==undefined&&b.taskT>t.t)b.next();break;}
  case'goto':{if(follow(G,C,a,b,t.x,t.z,t.f,{bar:t.bar||C.side(a)==='atk'}))b.next();else if(t.tmo&&b.taskT>t.tmo)b.next();break;}
  case'rein':case'bar':case'hrein':{if(t.k==='rein'&&t.pn.rein||t.k==='bar'&&t.op.bar.active||t.k==='hrein'&&(t.h.rein||t.h.state==='open')||G.rein<=0&&t.k!=='bar'){b.next();break;}
   if(!follow(G,C,a,b,t.stand.x,t.stand.z,t.f,{tol:.3}))break;moveHold(c);const lk=t.look||{x:t.stand.x,z:t.stand.z};if(t.k==='hrein'){a.pitch+=(-1.25-a.pitch)*Math.min(1,dt*6);}else{faceXZ(a,lk.x,lk.z,dt*8);a.pitch+=((t.k==='bar'?-.05:0)-a.pitch)*Math.min(1,dt*6);}
   c.use=b.taskT>.3;if(b.taskT>9)b.next();break;}
  case'place':{if(a.gn<=0){b.next();break;}if(!follow(G,C,a,b,t.pos.x+.8,t.pos.z,t.f,{tol:.6}))break;moveHold(c);if(a.cur!==3){C.switchTo(a,3);break;}if(a.switchT>0)break;
   if(!c.fireLock){a.ctl.gadOpt={pos:{x:t.pos.x,z:t.pos.z},yaw:t.yaw};c.fire=true;}else{a.ctl.gadOpt=null;b.next();}if(b.taskT>8)b.next();break;}
  case'murder':{if(!follow(G,C,a,b,t.stand.x,t.stand.z,t.f,{tol:.4}))break;moveHold(c);const p=t.pn.world(t.u,t.y,0);const err=aimAt(a,b,p,dt,G);if(a.cur!==1){C.switchTo(a,1);break;}
   if(err<.04&&a.reloadT<=0)c.fire=R()<.5;let open=0;for(let k=-2;k<=2;k++)for(let j=-2;j<=2;j++)if(!t.pn.solidAt(t.u+k*CELL,t.y+j*CELL))open++;if(open>12||b.taskT>6)b.next();break;}
  case'hold':{if(!follow(G,C,a,b,t.x,t.z,t.f,{tol:.4}))break;moveHold(c);
   if(a.op.util==='impact'&&a.un>0&&b.know&&G.time-b.knowT<1.5&&G.phase!=='prep'&&G.time>(b.utilT||0)&&R()<G.diff.util*dt*.6){const d=Math.hypot(b.know.x-a.pos.x,b.know.z-a.pos.z);if(d>3&&d<13){b.tasks.unshift({k:'util',to:{x:b.know.x,y:b.know.y+1,z:b.know.z}});break;}}c.crouch=b.crouchHold&&G.diff.n!=='EASY';holdLook(G,a,b,t,dt);break;}
  case'roam':{if(!b.roamP||b.roamDone){const pts=ROAM.filter(r=>Math.hypot(r[0]-G.site.c[0],r[1]-G.site.c[1])>4);const r=pts[R()*pts.length|0];b.roamP={x:r[0],z:r[1],f:r[2]};b.roamDone=false;b.roamWait=3+R()*6;}
   if(follow(G,C,a,b,b.roamP.x,b.roamP.z,b.roamP.f,{tol:.8})){moveHold(c);idleLook(a,b,dt,G);b.roamWait-=dt;if(b.roamWait<=0)b.roamDone=true;}break;}
  case'breach':{const bp=t.b,pn=bp.p,g2=a.op.gad;if(a.gn<=0&&!t.placed){b.next();break;}
   const ax=pn.axis==='x';const side=ax?Math.sign(bp.stand[1]-pn.c):Math.sign(bp.stand[0]-pn.c);
   if(!t.placed){if(!follow(G,C,a,b,bp.stand[0],bp.stand[1],bp.f,{tol:.4,bar:true}))break;moveHold(c);faceXZ(a,ax?bp.u:pn.c,ax?pn.c:bp.u,dt*8);a.pitch+=(-.1-a.pitch)*Math.min(1,dt*6);
    if(a.cur!==3){C.switchTo(a,3);break;}if(a.switchT>0)break;const surf={kind:'panel',pn,u:bp.u,y:pn.y0+1.05,side};if(GX(C).deploy(a,{surf})){t.placed=true;t.pt=G.time;t.back=ax?{x:bp.u+(R()<.5?-2.2:2.2),z:pn.c+side*2.4}:{x:pn.c+side*2.4,z:bp.u+(R()<.5?-2.2:2.2)};C.switchTo(a,1);}else{b.next();}break;}
   // step back, then detonate (charge) or wait for the cutter
   follow(G,C,a,b,t.back.x,t.back.z,bp.f,{tol:.5});faceXZ(a,ax?bp.u:pn.c,ax?pn.c:bp.u,dt*6);
   if(g2==='charge'&&G.time-t.pt>2.2){const ok=GX(C).detonate(a);if(ok){G.plan.breachDone=true;b.next();}else if(G.time-t.pt>9)b.next();}
   if(g2==='cutter'&&!GX(C).list.some(o=>o.alive&&o.owner===a&&o.type==='cutter')){G.plan.breachDone=true;b.next();}if(b.taskT>20)b.next();break;}
  case'emp':{if(a.gn<=0){b.next();break;}if(a.cur!==3){C.switchTo(a,3);break;}if(a.switchT>0)break;a.ctl.gadOpt={target:new V(t.to.x,t.to.y,t.to.z)};faceXZ(a,t.to.x,t.to.z,dt*8);if(!c.fireLock){c.fire=true;GX(C).deploy(a,{target:new V(t.to.x,t.to.y,t.to.z)});a.ctl.gadOpt=null;b.next();C.switchTo(a,1);}break;}
  case'clear':{const s=t.site;if(!b.clearP||b.clearDone){const x=s.r[0]+.8+R()*(s.r[1]-s.r[0]-1.6),z=s.r[2]+.8+R()*(s.r[3]-s.r[2]-1.6);b.clearP={x,z};b.clearDone=false;}
   // entry team waits for the breach (or a while) before pushing
   if(b.role==='entry'&&!G.plan.breachDone&&G.timer>G.len().act-40&&!C.inSite(a.pos)&&b.taskT<30){const w=follow(G,C,a,b,b.clearP.x,b.clearP.z,s.f,{tol:.8,bar:true,stopShort:7});if(w)idleLook(a,b,dt,G);break;}
   if(!b.utilUsed&&a.un>0&&a.op.util!=='impact'&&!C.inSite(a.pos)&&b.path&&b.path.length-b.pi<9&&R()<G.diff.util){b.utilUsed=true;const k=a.op.util==='smoke'?.6:1;b.tasks.unshift({k:'util',to:{x:s.c[0]*k+a.pos.x*(1-k),y:s.f*FH+1,z:s.c[1]*k+a.pos.z*(1-k)}});break;}
   if(follow(G,C,a,b,b.clearP.x,b.clearP.z,s.f,{tol:.8,bar:true})){b.clearDone=true;b.clears=(b.clears||0)+1;if(b.clears>=2||C.inSite(a.pos)&&b.clears>=1)b.next();}
   if(G.opt.mode==='capture'&&C.inSite(a.pos)){b.next();}break;}
  case'plant':{if(G.opt.mode!=='secure'||G.phase!=='action'||G.defuser.carrier!==a){b.next();break;}const p=t.site.plant[a.id%t.site.plant.length];if(!follow(G,C,a,b,p[0],p[1],t.site.f,{tol:.5,bar:true}))break;moveHold(c);c.crouch=true;c.use=true;idleLook(a,b,dt,G);break;}
  case'pickup':{const d=G.defuser;if(d.state!=='dropped'){b.next();break;}if(follow(G,C,a,b,d.pos.x,d.pos.z,d.pos.y>2?1:0,{tol:.4,bar:true}))b.next();break;}
  case'disarm':{const d=G.defuser;if(d.state!=='planted'){b.next();break;}if(!follow(G,C,a,b,d.pos.x+.5,d.pos.z,d.pos.y>2?1:0,{tol:.9}))break;moveHold(c);c.crouch=true;c.use=true;faceXZ(a,d.pos.x,d.pos.z,dt*6);break;}
  case'util':{if(a.un<=0||b.taskT>3){b.next();break;}moveHold(c);faceXZ(a,t.to.x,t.to.z,dt*8);if(a.cur!==4){C.switchTo(a,4);break;}if(a.switchT>0)break;
   if(!c.fireLock){c.throwTarget=new V(t.to.x,t.to.y,t.to.z);c.fire=true;}else{b.next();b.utilT=G.time+12;}break;}
  case'retake':{if(follow(G,C,a,b,t.x,t.z,t.f,{tol:1.2}))b.next();break;}
  default:b.next();}}
const GX=C=>C.GX;
function moveHold(c){c.mx=0;c.mz=0;}
function faceXZ(a,x,z,k){const want=Math.atan2(-(x-a.pos.x),-(z-a.pos.z));a.yaw+=angDiff(want,a.yaw)*Math.min(1,k);}
function idleLook(a,b,dt,G){b.sweep+=dt*.4;if(b.know&&G.time-b.knowT<5){faceXZ(a,b.know.x,b.know.z,dt*3);return;}a.yaw+=Math.sin(b.sweep*1.3)*dt*.35;a.pitch+=(-.04-a.pitch)*Math.min(1,dt*3);}
function holdLook(G,a,b,t,dt){if(b.know&&G.time-b.knowT<4){faceXZ(a,b.know.x,b.know.z,dt*4);return;}b.sweep+=dt*.5;const base=Math.atan2(-(t.look.x-a.pos.x),-(t.look.z-a.pos.z))+Math.sin(b.sweep)*.35;a.yaw+=angDiff(base,a.yaw)*Math.min(1,dt*3);a.pitch+=(-.03-a.pitch)*Math.min(1,dt*3);
 // peek: lean toward the look side now and then
 if(G.diff.n==='HARD'&&Math.sin(b.sweep*.7)>.6)a.ctl.lean=Math.sin(b.sweep)>0?1:-1;}

/* ---------- path following over the nav grid ---------- */
function follow(G,C,a,b,x,z,f,o={}){const L=C.L,c=a.ctl;const tol=o.tol||.45;const ty=f*FH;
 const dGoal=Math.hypot(x-a.pos.x,z-a.pos.z);if(dGoal<tol&&Math.abs(a.pos.y-ty)<1.4){c.mx=c.mz=0;b.path=null;return true;}
 const key=x.toFixed(1)+','+z.toFixed(1)+','+f+(o.bar?'b':'');if(!b.path||b.goalKey!==key||b.navVer!==L.navVer&&G.time>b.repath||G.time>b.repath+6){
  const from=L.nearNode(a.pos.x,a.pos.z,a.pos.y),to=L.nearNode(x,z,ty+.1);b.path=L.path(from,to,{bar:o.bar,inside:C.side(a)==='def'&&L.isIn(from)&&L.isIn(to)});b.pi=1;b.goalKey=key;b.navVer=L.navVer;b.repath=G.time+.8;if(!b.path){b.path=[];b.failT=(b.failT||0)+1;}}
 let tgt;if(b.pi<b.path.length){const n=b.path[b.pi];const p=L.nodePos(n);tgt=p;
  // barricade edge ahead: kick it down
  if(b.pi>0){const e=L.edgeFlag(b.path[b.pi-1],n);if(e&&e[2]===1&&e[3]&&e[3].active&&e[3].intact()>.25&&Math.hypot(p.x-a.pos.x,p.z-a.pos.z)<1.4){const bar=e[3];const ax=bar.axis==='x';let mu=(bar.u0+bar.u1)/2,my=a.pos.y+1,bd=1e9;const cu=mu;for(let r=0;r<bar.rows;r++)for(let q=0;q<bar.cols;q++){if(!bar.cells[r*bar.cols+q])continue;const uu=bar.u0+(q+.5)*CELL,yy=bar.y0+(r+.5)*CELL;if(yy>a.pos.y+1.9)continue;const dd=Math.abs(uu-cu)*1.5+Math.abs(yy-(a.pos.y+1));if(dd<bd){bd=dd;mu=uu;my=yy;}}
   faceXZ(a,ax?mu:bar.c,ax?bar.c:mu,.6);const ey=a.pos.y+a.eye,hd=Math.hypot((ax?mu:bar.c)-a.pos.x,(ax?bar.c:mu)-a.pos.z);a.pitch+=(Math.atan2(my-ey,hd)-a.pitch)*.6;c.mx=c.mz=0;if(G.time>b.kickT){b.kickT=G.time+.8;C.melee(a);}if(G.time>b.repath){b.repath=G.time+1;L.reNavPanel(bar);b.path=null;}return false;}}
  if(Math.hypot(p.x-a.pos.x,p.z-a.pos.z)<.42&&Math.abs(p.y-a.pos.y)<1.2)b.pi++;}
 else tgt={x,z,y:ty};
 if(o.stopShort&&b.path&&b.path.length-b.pi<o.stopShort){c.mx=c.mz=0;return true;}
 const dx=tgt.x-a.pos.x,dz=tgt.z-a.pos.z,d=Math.hypot(dx,dz)||1;c.mx=dx/d;c.mz=dz/d;
 // look where we go unless something else matters
 if(!b.tgt){const want=Math.atan2(-dx,-dz);a.yaw+=angDiff(want,a.yaw)*Math.min(1,.12);a.pitch+=(-.05-a.pitch)*.1;}
 c.sprint=dGoal>10&&G.phase!=='post'&&!b.tgt&&(C.side(a)==='atk'||G.phase==='prep');c.sprintOk=c.sprint;
 // stuck detection
 if(!b.lastP||G.time-b.lastPT>1.4){if(b.lastP&&b.lastP.distanceTo(a.pos)<.35){b.stuck++;b.path=null;if(b.stuck>1){c.jump=true;a.yaw+=R()-.5;}if(b.stuck>4){b.stuck=0;if(b.task&&b.task.k!=='hold')b.next();}}else b.stuck=0;b.lastP=(b.lastP||new V()).copy(a.pos);b.lastPT=G.time;}
 return false;}

/* ---------- drones (prep phase) ---------- */
function droneDrive(G,C,a,b,t,dt){const d=a.drone;const L=C.L;if(!d||!d.alive)return;const dc=d.ctl;
 if(!b.dPath||b.dGoal!==t.goal){const from=L.nearNode(d.pos.x,d.pos.z,d.pos.y),to=L.nearNode(t.goal.x,t.goal.z,t.goal.f*FH+.1);b.dPath=L.path(from,to,{drone:true})||[];b.dpi=1;b.dGoal=t.goal;b.dLast=d.pos.clone();b.dLT=G.time;}
 if(b.dpi<b.dPath.length){const p=L.nodePos(b.dPath[b.dpi]);const dx=p.x-d.pos.x,dz=p.z-d.pos.z,dd=Math.hypot(dx,dz);if(dd<.4)b.dpi++;dc.world=true;dc.wx=dx/(dd||1)*.85;dc.wz=dz/(dd||1)*.85;d.yaw+=angDiff(Math.atan2(-dx,-dz),d.yaw)*Math.min(1,dt*6);dc.jump=false;
  if(G.time-b.dLT>1.2){if(b.dLast.distanceTo(d.pos)<.2){dc.jump=true;b.dpi++;}b.dLast.copy(d.pos);b.dLT=G.time;}}
 else{dc.world=true;dc.wx=dc.wz=0;d.yaw+=dt*.6;}
 // spot defenders from the drone camera
 if(G.diff.n!=='EASY'&&(b.dSpot=(b.dSpot||0)-dt)<=0){b.dSpot=.5;const e=C.GX.droneEye(d);const dv=new V(-Math.sin(d.yaw),0,-Math.cos(d.yaw));for(const v of G.agents){if(!v.alive||C.side(v)!=='def')continue;const to=new V(v.pos.x-e.x,v.pos.y+1-e.y,v.pos.z-e.z);const dd=to.length();if(dd>14)continue;if(to.normalize().dot(dv)<.4)continue;if(L.los(e.x,e.y,e.z,v.pos.x,v.pos.y+1,v.pos.z))C.spot(v,'atk',3);}}}

/* ---------- perception ---------- */
function perceive(G,C,a,b,dt){b.percT-=dt;if(b.percT>0){if(b.tgt&&(!b.tgt.alive||b.tgtK==='drone'&&!b.tgt.alive))b.tgt=null;return;}b.percT=.13+R()*.05;const L=C.L,sd=C.side(a),e=C.eyePos(a),f=C.viewDir(a);
 let best=null,bd=1e9;
 if(G.phase!=='prep')for(const v of G.agents){if(!v.alive||C.side(v)===sd)continue;const vh=new V(v.pos.x,v.pos.y+(v.proneV>.5?.3:v.eye-.05),v.pos.z);const to=vh.clone().sub(e);const d=to.length();if(d>55)continue;to.divideScalar(d);
  const known=G.spotted(v,sd)||b.tgt===v;const fov=to.dot(f)>(known?-.2:.42)||d<2.2;if(!fov)continue;if(a.blind>.8)continue;
  const chest=new V(v.pos.x,v.pos.y+(v.proneV>.5?.25:1.1-v.crouchV*.35),v.pos.z);let vis=L.los(e.x,e.y,e.z,vh.x,vh.y,vh.z)||L.los(e.x,e.y,e.z,chest.x,chest.y,chest.z);if(!vis)continue;if(C.fx.smokeBlocks(e.x,e.y,e.z,vh.x,vh.y,vh.z))continue;
  if(d>6&&glassBlocks(C,e,vh))continue;
  // dark + distance: needs some exposure time before a far target is recognised
  if(d>16&&!known){b.seen=b.seen||{};b.seen[v.id]=(b.seen[v.id]||0)+.15*(Math.hypot(v.vel.x,v.vel.z)>1?1.6:1);if(b.seen[v.id]<(d-16)*.07)continue;}
  const score=d-(known?8:0)-(b.tgt===v?6:0);if(score<bd){bd=score;best=v;}}
 // enemy drones (defenders shoot them)
 if(!best&&sd==='def'){for(const d of C.GX.drones){if(!d.alive)continue;const p=new V(d.pos.x,d.pos.y+.1,d.pos.z);const dd=p.distanceTo(e);if(dd>13)continue;const to=p.clone().sub(e).normalize();if(to.dot(f)<.3)continue;if(!L.los(e.x,e.y,e.z,p.x,p.y,p.z))continue;b.gTgt={p,o:d};b.gT=1.5;break;}}
 // enemy gadgets + cameras (attackers)
 if(!best&&!b.gTgt&&G.phase!=='prep'){for(const t of C.GX.targets(sd)){if(t.kind==='drone')continue;const dd=t.p.distanceTo(e);if(dd>15)continue;const to=t.p.clone().sub(e).normalize();if(to.dot(f)<.5)continue;if(!L.los(e.x,e.y,e.z,t.p.x,t.p.y,t.p.z,null))continue;b.gTgt={p:t.p.clone(),o:t.o};b.gT=1.6;break;}}
 if(G.phase==='prep')b.tgt=null;
 if(best&&best!==b.tgt){b.tgt=best;b.tgtK='agent';b.reactT=G.time+G.diff.react*(.7+R()*.6)*(G.spotted(best,sd)?.6:1);b.engT=0;b.headAim=R()<G.diff.head;b.err.set((R()-.5),(R()-.5),(R()-.5)).multiplyScalar(G.diff.aim*2.4);}
 if(!best&&b.tgt){if(b.tgt.alive)b.heard(b.tgt.pos,G.time,false);b.lostT=(b.lostT||0)+.15;if(b.lostT>1.1){b.tgt=null;b.lostT=0;}}else b.lostT=0;
 // sounds: gunfire / footsteps / breaches give a position to look at
 for(let i=G.events.length-1;i>=0&&i>G.events.length-12;i--){const ev=G.events[i];if(G.time-ev.t>.4||ev.side===sd)continue;const d=Math.hypot(ev.x-a.pos.x,ev.z-a.pos.z);const r=ev.kind==='shot'?40:ev.kind==='boom'||ev.kind==='breach'?30:ev.kind==='wire'?22:ev.kind==='step'?(ev.loud?14:8):0;if(d<r){b.heard(ev,G.time,false);break;}}}
// aim at a world point with turn rate + error; returns angular error
function aimAt(a,b,p,dt,G){const e=new V(a.pos.x,a.pos.y+a.eye,a.pos.z);const dx=p.x-e.x,dy=p.y-e.y,dz=p.z-e.z;const wy=Math.atan2(-dx,-dz),wp=Math.atan2(dy,Math.hypot(dx,dz));const k=Math.min(1,dt*G.diff.turn);
 const ey=angDiff(wy,a.yaw),ep=wp-a.pitch;a.yaw+=ey*k;a.pitch+=ep*k;return Math.hypot(ey,ep);}
function combat(G,C,a,b,dt){const v=b.tgt,c=a.ctl,sd=C.side(a);b.engT+=dt;a.act=null;c.use=false;
 if(a.cur>2&&a.switchT<=0)C.switchTo(a,1);const g=a.gun();if(g&&g.mag<=0&&g.res<=0&&a.cur===1)C.switchTo(a,2);
 const d0=v.pos.distanceTo(a.pos);const err=b.err.clone().multiplyScalar(Math.max(.25,1.4-b.engT*.9)*(1+Math.max(0,d0-10)/12)*(a.blind>0?3:1));const hy=v.proneV>.5?.25:b.headAim?v.eye+.04:1.15-v.crouchV*.35;const p=new V(v.pos.x+err.x,v.pos.y+hy+err.y*.5,v.pos.z+err.z);
 // compensate own recoil (players feel it too)
 a.pitch-=(a.recoil.y*Math.PI/180)*Math.min(1,dt*5)*(1/G.diff.acc)*.5;
 const ang=aimAt(a,b,p,dt,G);const d=v.pos.distanceTo(a.pos);
 c.ads=d>5&&G.diff.n!=='EASY';
 if(G.time>b.reactT&&g&&ang<.06+(g?G.spreadOf(a):0)*1.5){if(g.def.semi){c.fire=(G.time*20+a.id)%3<1;}else if(g.def.cls==='shotgun'){c.fire=d<14||R()<.3;}else{const burst=d>20?.45:.9;c.fire=(G.time*2.2+a.id*.37)%1<burst;}}
 if(g&&g.mag===0&&g.res>0)c.reload=true;
 // movement while fighting
 const s=Math.sin(G.time*1.7+a.id*2);const right=new V(Math.cos(a.yaw),0,-Math.sin(a.yaw));
 if(sd==='atk'&&d>4&&G.diff.n!=='EASY'){c.mx=right.x*s*.6;c.mz=right.z*s*.6;}else{c.mx=c.mz=0;}
 c.crouch=G.diff.n==='HARD'?s>.3:b.crouchHold&&sd==='def';if(sd==='def'&&G.diff.n!=='EASY'&&d>6)c.lean=s>0?.0:0;
 // if the target is out of range of shotgun, close in (attackers) or hold (defenders)
 if(g&&g.def.cls==='shotgun'&&d>12&&sd==='atk'){const f=new V(v.pos.x-a.pos.x,0,v.pos.z-a.pos.z).normalize();c.mx=f.x;c.mz=f.z;}}
// fire through soft walls at a fresh known enemy position
function wallbang(G,C,a,b,dt){if(G.diff.wallbang<=0||!b.know||G.time-b.knowT>2.2||G.phase==='prep')return false;const g=a.gun();if(!g||a.cur>2)return false;const k=b.know;const e=C.eyePos(a);const p=new V(k.x,k.y+1.1,k.z);const d=p.distanceTo(e);if(d>16||d<2)return false;
 if(b.wbOk===undefined||G.time>b.wbT){b.wbT=G.time+.6;const dir=p.clone().sub(e).normalize();const h=C.L.ray(e.x,e.y,e.z,dir.x,dir.y,dir.z,d);b.wbOk=!!h&&(h.mat==='soft'||h.mat==='bar'||h.mat==='wood')&&h.t>.8&&R()<G.diff.wallbang;}
 if(!b.wbOk)return false;const ang=aimAt(a,b,p,dt,G);a.ctl.mx=a.ctl.mz=0;if(ang<.05&&a.reloadT<=0)a.ctl.fire=g.def.semi?(G.time*10|0)%2===0:true;return true;}

// intact window glass at night: reflective, hides what is behind it beyond a few metres
function glassBlocks(C,a,b){for(const g of C.world.glass){if(g.broken)continue;const op=g.op,ax=op.axis==='x';const da=ax?a.z-op.c:a.x-op.c,db=ax?b.z-op.c:b.x-op.c;if(da*db>0)continue;const t=da/(da-db);const u=ax?a.x+(b.x-a.x)*t:a.z+(b.z-a.z)*t,y=a.y+(b.y-a.y)*t;if(u>op.a&&u<op.b&&y>op.y0&&y<op.y1)return true;}return false;}
