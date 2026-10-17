// HALCYON HEIST — CPU behaviour: civilians (wander, panic, flee and phone, cower, tied), guards (patrols, suspicion, investigation,
// combat), police units (pathing assault, cover-aware engagement ranges, shield advance) and the crew (follow / hold / carry loot,
// fight, revive the player first).
const R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v;
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d;};
export const yawTo=(dx,dz)=>Math.atan2(-dx,-dz);
export const DIFF=[
 {n:'EASY',det:.6,acc:.5,dmg:.55,cap:7,resp:45,pagers:4,downs:4,bleed:40,ties:6,guards:0,drill:0,jam:[26,40],spawn:2.2,crewAcc:1.2,hpMul:.85},
 {n:'NORMAL',det:1,acc:.8,dmg:1,cap:11,resp:32,pagers:4,downs:3,bleed:30,ties:4,guards:0,drill:1,jam:[18,32],spawn:1.5,crewAcc:1,hpMul:1},
 {n:'HARD',det:1.5,acc:1.1,dmg:1.55,cap:15,resp:22,pagers:3,downs:2,bleed:22,ties:3,guards:1,drill:2,jam:[13,24],spawn:1,crewAcc:.9,hpMul:1.25}];

/* ---------- movement helpers ---------- */
export function goTo(G,a,x,z,force){const B=a.brain;if(!force&&B.goal&&Math.hypot(B.goal.x-x,B.goal.z-z)<.7&&B.path)return;B.goal={x,z};B.path=G.L.path(a.pos.x,a.pos.z,x,z);B.pi=1;B.repathT=3+R()*2;B.stuckT=0;}
export function arrived(a,r=.8){const B=a.brain;return!B.goal||Math.hypot(B.goal.x-a.pos.x,B.goal.z-a.pos.z)<r;}
// steer along the path; returns true while moving. spd: 0..1 of the agent's run speed
export function steer(G,a,dt,spd=1,face=true){const B=a.brain,c=a.ctl;c.mx=c.mz=0;if(!B.path||!B.goal)return false;
 if(B.pi>=B.path.length){B.path=null;return false;}let wp=B.path[B.pi];let dx=wp.x-a.pos.x,dz=wp.z-a.pos.z,d=Math.hypot(dx,dz);
 while(d<.45&&B.pi<B.path.length-1){B.pi++;wp=B.path[B.pi];dx=wp.x-a.pos.x;dz=wp.z-a.pos.z;d=Math.hypot(dx,dz);}
 if(B.pi===B.path.length-1&&d<.35){B.path=null;return false;}
 c.mx=dx/d*spd;c.mz=dz/d*spd;if(face){const want=yawTo(dx,dz);a.yaw+=angDiff(want,a.yaw)*Math.min(1,dt*8);}
 // stuck: repath / nudge
 const mv=Math.hypot(a.pos.x-B.lastP.x,a.pos.z-B.lastP.z);B.lastP.x=a.pos.x;B.lastP.z=a.pos.z;if(mv<dt*.4)B.stuckT+=dt;else B.stuckT=Math.max(0,B.stuckT-dt);
 if(B.stuckT>1.2){B.stuckT=0;if(B.goal){const g=B.goal;B.path=G.L.path(a.pos.x+(R()-.5)*.3,a.pos.z+(R()-.5)*.3,g.x,g.z);B.pi=1;}G.openNear(a,1.6);}
 B.repathT-=dt;if(B.repathT<=0&&B.goal){goTo(G,a,B.goal.x,B.goal.z,true);}return true;}
function face(a,x,z,dt,k=8){const want=yawTo(x-a.pos.x,z-a.pos.z);a.yaw+=angDiff(want,a.yaw)*Math.min(1,dt*k);return Math.abs(angDiff(want,a.yaw));}

/* ---------- civilians + staff ---------- */
export function thinkCiv(G,a,dt){const B=a.brain,c=a.ctl;c.mx=c.mz=0;c.run=false;a.pose='stand';
 if(a.cs==='tied'){a.pose='tied';return;}
 if(a.cs==='cower'){a.pose='cower';B.t-=dt;if(B.t<=0){a.cs=G.loud?'panic':'idle';B.path=null;B.callT=0;}return;}
 if(a.cs==='panic'){a.pose='panic';c.run=true;if(!B.exit){const ex=G.exitFor(a);B.exit=ex;goTo(G,a,ex.x,ex.z,true);}
  if(!steer(G,a,dt,1)){if(B.exit&&Math.hypot(B.exit.x-a.pos.x,B.exit.z-a.pos.z)<2.5){if(!G.loud){B.callT+=dt;a.pose='stand';a.rig.setGun('phone');if(B.callT>4)G.alarm('A CIVILIAN CALLED THE POLICE');}else G.despawn(a);}else{B.exit=null;}}
  // a masked robber close by and facing them makes them hit the floor
  return;}
 if(a.cs==='sit'){a.pose='sit';return;}
 // idle: wander between spots of the zone, pause, look around
 if(B.wait>0){B.wait-=dt;if(B.look!==undefined)face(a,a.pos.x+Math.sin(B.look),a.pos.z-Math.cos(B.look),dt,2);return;}
 if(!B.path){const spots=G.def.civs[a.zone]||G.def.civs.lobby;const s=spots[R()*spots.length|0];const p=G.L.P(s);goTo(G,a,p.x+(R()-.5)*.8,p.z+(R()-.5)*.8,true);if(!B.path){B.wait=2;}}
 if(!steer(G,a,dt,.42)){B.path=null;B.wait=a.zone==='tellers'?6+R()*10:3+R()*6;B.look=a.zone==='tellers'?0:R()*6.28;}}

/* ---------- guards (stealth) ---------- */
export function thinkGuard(G,a,dt){const B=a.brain,c=a.ctl;c.mx=c.mz=0;c.run=false;c.fire=false;a.pose=a.type==='operator'&&!a.combat?'sit':'stand';
 if(a.combat||G.loud){return thinkCop(G,a,dt);}
 if(a.type==='operator'){const p=G.L.P(G.def.operator);if(Math.hypot(p.x-a.pos.x,p.z-a.pos.z)>.6){a.pose='stand';goTo(G,a,p.x,p.z);steer(G,a,dt,.4);}else{a.yaw+=angDiff(G.def.operator[2]*Math.PI/180+Math.PI,a.yaw)*Math.min(1,dt*3);a.pos.x+=(p.x-a.pos.x)*dt*4;a.pos.z+=(p.z-a.pos.z)*dt*4;}
  if(B.inv){a.pose='stand';}else return;}
 // investigating a noise / glimpse / body
 if(B.inv){const q=B.inv;const d=Math.hypot(q.x-a.pos.x,q.z-a.pos.z);if(!B.invGo){goTo(G,a,q.x,q.z,true);B.invGo=true;B.invT=12;}B.invT-=dt;
  if(d>1.6&&steer(G,a,dt,q.hurry?.8:.5)){}else{c.mx=c.mz=0;B.lookT=(B.lookT||0)+dt;a.yaw+=Math.sin(B.lookT*1.2)*dt*1.2;if(B.lookT>4){B.inv=null;B.invGo=false;B.lookT=0;B.path=null;}}
  if(B.invT<=0){B.inv=null;B.invGo=false;B.path=null;}return;}
 // patrol
 const route=a.route;if(!route){if(B.wait>0)B.wait-=dt;return;}if(B.wait>0){B.wait-=dt;a.yaw+=Math.sin(G.time*.7+a.id)*dt*.6;return;}
 const wp=G.L.P(route[B.ri%route.length]);if(!B.path||!B.goal||Math.hypot(B.goal.x-wp.x,B.goal.z-wp.z)>.5)goTo(G,a,wp.x,wp.z,true);
 if(!steer(G,a,dt,.4)){B.ri++;B.wait=a.wait*(.6+R()*.8);B.path=null;}}

/* ---------- police (and guards once loud) ---------- */
const RANGE={guard:18,operator:14,cop:20,swat:26,heavy:16,shield:12};
export function thinkCop(G,a,dt){const B=a.brain,c=a.ctl;c.mx=c.mz=0;c.fire=false;c.run=true;a.pose='stand';
 B.tT-=dt;if(B.tT<=0||!B.tgt||!B.tgt.alive||B.tgt.custody){B.tT=.6+R()*.4;B.tgt=G.pickTarget(a);}
 const t=B.tgt;if(!t){if(B.wait>0){B.wait-=dt;return;}const v=G.L.P(G.def.start);goTo(G,a,v.x,v.z);steer(G,a,dt,.6);return;}
 const dx=t.pos.x-a.pos.x,dz=t.pos.z-a.pos.z,d=Math.hypot(dx,dz);B.seeT-=dt;if(B.seeT<=0){B.seeT=.2+R()*.15;B.sees=G.canSee(a,t);}
 const rng=RANGE[a.type]||20;
 if(B.sees&&d<rng*1.3){face(a,t.pos.x,t.pos.z,dt,a.type==='heavy'?4:7);
  // keep distance: shields + heavies push in, others hold and strafe
  const push=a.type==='shield'||a.type==='heavy'?5:9;if(d>push&&(a.type==='shield'||a.type==='heavy'||d>rng*.8)){goTo(G,a,t.pos.x,t.pos.z);steer(G,a,dt,a.type==='heavy'?.45:a.type==='shield'?.4:.7,false);}
  else{B.strafeT-=dt;if(B.strafeT<=0){B.strafeT=.8+R()*1.4;B.sd=R()<.5?-1:1;if(R()<.3)B.sd=0;}const sx=Math.cos(a.yaw),sz=-Math.sin(a.yaw);c.mx=sx*B.sd*.45;c.mz=sz*B.sd*.45;c.run=false;B.path=null;}
  c.fire=true;c.aim=t;}
 else{goTo(G,a,t.pos.x,t.pos.z);steer(G,a,dt,a.type==='heavy'?.5:a.type==='shield'?.5:.9);}}

/* ---------- crew ---------- */
export function thinkCrew(G,a,dt){const B=a.brain,c=a.ctl;c.mx=c.mz=0;c.fire=false;c.run=false;a.pose='stand';const P=G.player;
 if(a.standby){// waiting at the van, unmasked, until called or the alarm goes
  if(G.loud||a.order!=='standby'){a.standby=false;a.setMask(true);}else{const p=a.home;if(Math.hypot(p.x-a.pos.x,p.z-a.pos.z)>.6){goTo(G,a,p.x,p.z);steer(G,a,dt,.4);}else{a.yaw+=angDiff(a.homeYaw,a.yaw)*dt*2;}return;}}
 // combat target (loud only)
 let foe=null;if(G.loud){B.tT-=dt;if(B.tT<=0){B.tT=.35+R()*.25;B.foe=G.pickFoe(a,32);}foe=B.foe&&B.foe.alive?B.foe:null;}
 // revive downed crew (player first)
 const down=[P,...G.crew].filter(x=>x&&x!==a&&x.alive&&x.down&&!x.custody).sort((p,q)=>(p===P?-50:0)+Math.hypot(p.pos.x-a.pos.x,p.pos.z-a.pos.z)-((q===P?-50:0)+Math.hypot(q.pos.x-a.pos.x,q.pos.z-a.pos.z)))[0];
 if(down&&Math.hypot(down.pos.x-a.pos.x,down.pos.z-a.pos.z)<45){const d=Math.hypot(down.pos.x-a.pos.x,down.pos.z-a.pos.z);
  if(d>1.2){goTo(G,a,down.pos.x,down.pos.z);steer(G,a,dt,1);c.run=true;B.revT=0;}else{B.revT=(B.revT||0)+dt;a.pose='stand';a.crouch=true;face(a,down.pos.x,down.pos.z,dt);if(B.revT>3){G.revive(down,a);B.revT=0;}return;}
  if(foe){c.fire=true;c.aim=foe;}return;}
 B.revT=0;
 const mode=a.order;const sneak=!G.loud;c.crouch=sneak;
 if(mode==='loot'){B.lootT=(B.lootT||0)-dt;
  if(a.bag){const z=G.vanZone;const tx=(z.x0+z.x1)/2,tz=(z.z0+z.z1)/2;if(G.inVan(a.pos.x,a.pos.z)){G.secureBag(a.bag,a);}else{goTo(G,a,tx,tz);steer(G,a,dt,.85,!foe);}}
  else{if(!B.lj||B.lootT<=0||(B.lj.bag&&B.lj.bag.carrier)||(B.lj.loot&&B.lj.loot.left<=0)){B.lj=G.findLootJob(a);B.lootT=3;}const j=B.lj;
   if(j){const d=Math.hypot(j.x-a.pos.x,j.z-a.pos.z);if(d>1.3){goTo(G,a,j.x,j.z);steer(G,a,dt,.9,!foe);B.bagT=0;}else{B.bagT=(B.bagT||0)+dt;face(a,j.x,j.z,dt);if(j.bag){G.pickBag(a,j.bag);B.lj=null;}else if(B.bagT>2){G.takeLoot(a,j.loot);B.lj=null;B.bagT=0;}}}
   else followP(G,a,dt,foe);}}
 else if(mode==='hold'){const h=a.holdP;if(h&&Math.hypot(h.x-a.pos.x,h.z-a.pos.z)>.8){goTo(G,a,h.x,h.z);steer(G,a,dt,.9,!foe);}}
 else followP(G,a,dt,foe);
 if(foe){face(a,foe.pos.x,foe.pos.z,dt,9);c.fire=true;c.aim=foe;}}
function followP(G,a,dt,foe){const P=G.player;if(!P)return;const k=G.crew.indexOf(a);const ang=P.yaw+Math.PI+(k-1)*.7;const tx=P.pos.x+Math.sin(ang)*-2.6,tz=P.pos.z+Math.cos(ang)*-2.6;
 const d=Math.hypot(P.pos.x-a.pos.x,P.pos.z-a.pos.z);const B=a.brain;if(d>4.2||(B.path&&d>2.4)){const ok=G.L.nfree(tx,tz);goTo(G,a,ok?tx:P.pos.x,ok?tz:P.pos.z);a.ctl.run=d>7;steer(G,a,dt,d>7?1:.75,!foe);}else{B.path=null;if(!foe)face(a,a.pos.x-Math.sin(P.yaw),a.pos.z-Math.cos(P.yaw),dt,2);}}
