// FRONTLINE OPS — bot brains: perception (FOV + line of sight + hearing + smoke), cover, flanking, burst fire, grenades, callouts.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
export const DIFF=[{n:'RECRUIT',err:4.2,react:.95,turn:3.5,dmg:.3,burst:[2,4],pause:[.7,1.3],nade:.2,flank:.2},{n:'REGULAR',err:2.9,react:.62,turn:5.5,dmg:.48,burst:[3,5],pause:[.5,.9],nade:.4,flank:.35},{n:'VETERAN',err:1.9,react:.38,turn:8,dmg:.72,burst:[3,6],pause:[.35,.65],nade:.6,flank:.5}];
const rr=(a,b)=>a+Math.random()*(b-a),ang=a=>Math.atan2(Math.sin(a),Math.cos(a));
const tv=new V(),tv2=new V(),eye=new V(),tgt=new V();
export const EYE=1.58,CEYE=1.08;
export function eyeOf(a,out){return out.set(a.pos.x,a.pos.y+(a.crouchV>.5?CEYE:EYE),a.pos.z);}
export function chestOf(a,out){return out.set(a.pos.x,a.pos.y+1.2-(a.crouchV||0)*.42,a.pos.z);}

export function newBrain(role,o={}){return{role,state:'idle',target:null,seen:0,last:null,lastT:-99,path:null,pathT:0,goal:null,cover:null,coverT:0,peek:0,peekT:0,react:0,think:Math.random()*.3,strafe:0,strafeT:0,burst:0,pauseT:0,
 nadeT:rr(6,14),callT:0,onT:0,stuckT:0,lastPos:new V(),flank:0,post:o.post||null,route:o.route||null,ri:0,hold:o.hold||null,static:!!o.static,alerted:false,lookT:0,lookYaw:0,fol:o.fol||null,hunt:o.hunt||null,coverPick:-99,hurtT:-99,lastAttacker:null,slot:o.slot||0};}

function canSee(a,b,W){const d2=(a.pos.x-b.pos.x)**2+(a.pos.z-b.pos.z)**2;if(d2>78*78)return false;
 const fwdx=Math.sin(a.yaw),fwdz=Math.cos(a.yaw),dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.sqrt(d2)||1;const dot=(fwdx*dx+fwdz*dz)/d;
 const night=W.night&&!b.firingT;const range=night?(a.ai.alerted?55:32):78;if(d>range)return false;
 if(dot<.42&&d>5&&!(a.ai.alerted&&dot>-.2))return false;
 eyeOf(a,eye);chestOf(b,tgt);if(W.fx.smokeBlocks(eye,tgt))return false;if(W.level.los(eye,tgt))return true;
 tgt.y=b.pos.y+(b.crouchV>.5?1.15:1.62);return W.level.los(eye,tgt)&&!W.fx.smokeBlocks(eye,tgt);}

function pickCover(a,threat,W){const L=W.level,cs=L.cover,px=a.pos.x,pz=a.pos.z;let best=null,bs=1e9,checks=0;const cand=[];
 for(const c of cs){const d=(c.x-px)**2+(c.z-pz)**2;if(d>196||(c.owner&&c.owner!==a&&c.owner.alive))continue;const tx=threat.x-c.x,tz=threat.z-c.z,tl=Math.hypot(tx,tz)||1;if((c.nx*tx+c.nz*tz)/tl<.35)continue;if(tl<5)continue;cand.push([d+(c.tall?0:-4),c]);}
 cand.sort((p,q)=>p[0]-q[0]);for(const[s,c]of cand){if(checks++>10)break;tv.set(c.x,(c.tall?1.5:1.0),c.z);tv2.set(threat.x,threat.y+1.5,threat.z);if(L.los(tv2,tv))continue;if(s<bs){bs=s;best=c;break;}}
 return best;}

export function setPath(a,x,z,W){if(W.pathBudget<=0)return false;W.pathBudget--;const p=W.level.path(a.pos.x,a.pos.z,x,z);a.ai.path=p&&p.length?p:null;a.ai.goal=a.ai.path?new V(x,0,z):null;a.ai.pathT=W.time;return!!p;}

// one brain tick (called every ~.25s); sets intent for the per-frame driver
export function think(a,W){const ai=a.ai,L=W.level,D=W.diff,me=a.pos;ai.think=rr(.18,.32);
 if(ai.static&&ai.state==='idle')ai.state='guard';
 // --- perception
 let best=null,bd=1e9;for(const b of W.actors){if(!b.alive||b.team===a.team||b.ghost)continue;const d=me.distanceTo(b.pos);if(d>80)continue;
  const known=ai.target===b&&ai.seen>0;if(!canSee(a,b,W)){continue;}let s=d;if(b===ai.lastAttacker&&W.time-ai.hurtT<4)s*=.5;if(known)s*=.7;if(b.vip)s*=1.3;if(s<bd){bd=s;best=b;}}
 if(best){if(ai.target!==best||ai.seen<=0){ai.react=D.react*rr(.8,1.3)*(W.night&&!best.firingT?1.4:1);ai.onT=0;if(!ai.alerted&&a.team===0)W.callout(a,'contact',best);ai.alerted=true;}
  ai.target=best;ai.seen=1;ai.last=best.pos.clone();ai.lastT=W.time;}
 else{if(ai.seen>0&&ai.target&&!ai.target.alive)ai.target=null;ai.seen=0;}
 // hearing
 if(!best)for(const n of W.noises){if(n.team===a.team||n.t<W.time-.6)continue;const d=me.distanceTo(n.p);if(d<n.r){ai.last=n.p.clone();ai.lastT=W.time;ai.alerted=true;if(!ai.target||!ai.target.alive)ai.target=n.src;break;}}
 const tgtA=ai.seen?ai.target:null;
 if(a.vip){ai.state='idle';const lead=ai.fol&&ai.fol.alive?ai.fol:null;if(!lead){ai.path=null;return;}const d=me.distanceTo(lead.pos);if(d>3.2){if(!ai.path||W.time-ai.pathT>.7)setPath(a,lead.pos.x-Math.sin(lead.yaw)*2.2,lead.pos.z-Math.cos(lead.yaw)*2.2,W);}else ai.path=null;return;}
 // --- grenades at enemies hiding behind cover
 ai.nadeT-=.25;if(!tgtA&&ai.last&&W.time-ai.lastT<5&&W.time-ai.lastT>1.2&&ai.nadeT<=0&&a.nades>0){const d=me.distanceTo(ai.last);if(d>9&&d<30&&Math.random()<D.nade){W.throwNade(a,ai.last);ai.nadeT=rr(14,24);a.nades--;}else ai.nadeT=rr(3,6);}
 // --- decide
 const lowHp=a.hp<a.maxHp*.45,reloading=a.reloadT>0;
 if(tgtA){const d=me.distanceTo(tgtA.pos);
  if(ai.static){ai.state='guard';return;}
  if(ai.cover&&ai.state==='cover'){ai.coverT-=.25;if(ai.coverT<=0&&!lowHp&&!reloading){ai.state='engage';ai.cover.owner=null;ai.cover=null;}return;}
  if((lowHp||reloading||(d>10&&Math.random()<.18))&&W.time-ai.coverPick>2){ai.coverPick=W.time;const c=pickCover(a,tgtA.pos,W);if(c){if(ai.cover)ai.cover.owner=null;ai.cover=c;c.owner=a;ai.state='tocover';ai.coverT=rr(3,6);setPath(a,c.x,c.z,W);if(reloading&&a.team===0)W.callout(a,'reload');return;}}
  if(ai.state==='tocover'&&ai.path)return;
  ai.state='engage';if(d>28&&ai.role!=='guard'&&Math.random()<.4)setPath(a,tgtA.pos.x,tgtA.pos.z,W);else if(!ai.path||d<14)ai.path=null;return;}
 if(ai.cover){ai.cover.owner=null;ai.cover=null;}
 if(ai.last&&W.time-ai.lastT<9&&ai.role!=='follow'&&ai.role!=='vip'&&!ai.static){// hunt / flank toward last known position
  if(ai.state!=='hunt'||!ai.path||W.time-ai.pathT>4){ai.state='hunt';let gx=ai.last.x,gz=ai.last.z;
   if(Math.random()<D.flank&&me.distanceTo(ai.last)>12){const dx=gx-me.x,dz=gz-me.z,l=Math.hypot(dx,dz)||1,s=Math.random()<.5?1:-1;gx+=-dz/l*11*s;gz+=dx/l*11*s;ai.flank=s;if(a.team===0)W.callout(a,s>0?'flankR':'flankL');}
   setPath(a,gx,gz,W);}return;}
 // --- idle behaviors by role
 ai.state='idle';
 if(ai.static)return;
 if(ai.role==='follow'||ai.role==='vip'){const lead=ai.fol&&ai.fol.alive?ai.fol:null;if(!lead)return;const d=me.distanceTo(lead.pos);const far=ai.role==='vip'?3.2:6;
  if(d>far){const off=ai.slot||0;const lx=lead.pos.x-Math.sin(lead.yaw)*2.5+Math.cos(lead.yaw)*off,lz=lead.pos.z-Math.cos(lead.yaw)*2.5-Math.sin(lead.yaw)*off;if(!ai.path||W.time-ai.pathT>.8)setPath(a,lx,lz,W);}else ai.path=null;return;}
 if(ai.role==='guard'){if(ai.post&&me.distanceTo(ai.post)>2.5){if(!ai.path||W.time-ai.pathT>3)setPath(a,ai.post.x,ai.post.z,W);}return;}
 if(ai.role==='patrol'&&ai.route){if(!ai.path||!ai.path.length){const p=ai.route[ai.ri=(ai.ri+1)%ai.route.length];setPath(a,p[0],p[1],W);}return;}
 if(ai.role==='assault'&&ai.hold){if(me.distanceTo(ai.hold)>4&&(!ai.path||W.time-ai.pathT>5))setPath(a,ai.hold.x+rr(-4,4),ai.hold.z+rr(-4,4),W);return;}
 if(ai.role==='hunt'&&ai.hunt){const h=ai.hunt();if(h&&(!ai.path||W.time-ai.pathT>5))setPath(a,h.x+rr(-6,6),h.z+rr(-6,6),W);return;}
 if(ai.role==='tdm'){if(!ai.path||!ai.path.length||W.time-ai.pathT>14){let p;if(Math.random()<.45){const foes=W.actors.filter(b=>b.alive&&b.team!==a.team);const f=foes[Math.random()*foes.length|0];if(f)p=[f.pos.x+rr(-10,10),f.pos.z+rr(-10,10)];}
  if(!p){const h=L.hot[Math.random()*L.hot.length|0];p=[h[0]+rr(-5,5),h[1]+rr(-5,5)];}setPath(a,p[0],p[1],W);}}}

// per-frame: aim, move, shoot. returns desired move vector in a.move (x,z) and speed
export function drive(a,W,dt){const ai=a.ai,D=W.diff;ai.think-=dt;if(ai.think<=0)think(a,W);
 const tgtA=ai.seen&&ai.target&&ai.target.alive?ai.target:null;let mx=0,mz=0,speed=0;a.crouch=false;
 // follow path
 if(ai.path&&ai.path.length){const wp=ai.path[0];const dx=wp[0]-a.pos.x,dz=wp[1]-a.pos.z,d=Math.hypot(dx,dz);if(d<.55){ai.path.shift();if(!ai.path.length)ai.path=null;}else{mx=dx/d;mz=dz/d;}
  speed=tgtA?(ai.state==='tocover'?5.2:3.0):(ai.state==='hunt'?4.6:ai.role==='follow'||ai.role==='vip'?(a.pos.distanceTo(ai.fol?.pos||a.pos)>12?6:4.2):ai.role==='patrol'?1.8:4.4);
  if(ai.state==='tocover'&&!ai.path){ai.state='cover';}}
 else if(ai.state==='tocover'){ai.state='cover';}
 // stuck handling
 if(speed>0){if(a.pos.distanceToSquared(ai.lastPos)<.0004*Math.max(1,speed)){ai.stuckT+=dt;if(ai.stuckT>1){ai.stuckT=0;ai.path=null;ai.strafe=Math.random()<.5?1:-1;ai.strafeT=.6;}}else ai.stuckT=0;}
 ai.lastPos.copy(a.pos);
 // in cover: crouch/peek cycle (low cover) or hold (tall)
 if(ai.state==='cover'&&ai.cover){const c=ai.cover;if(!ai.path){const dx=c.x-a.pos.x,dz=c.z-a.pos.z,d=Math.hypot(dx,dz);if(d>.3){mx=dx/d;mz=dz/d;speed=2.5;}}
  ai.peekT-=dt;if(ai.peekT<=0){ai.peek=ai.peek?0:1;ai.peekT=ai.peek?rr(1.1,2.2):rr(.7,1.5);}a.crouch=!c.tall&&(!ai.peek||a.reloadT>0);if(c.tall&&ai.peek&&tgtA&&a.reloadT<=0){// lean out: strafe a step perpendicular
   mx+=-c.nz*.8*(ai.flank||1);mz+=c.nx*.8*(ai.flank||1);speed=Math.max(speed,1.6);}}
 // engage: strafe
 if(ai.state==='engage'&&tgtA&&!ai.static){ai.strafeT-=dt;if(ai.strafeT<=0){ai.strafe=Math.random()<.25?0:(Math.random()<.5?1:-1);ai.strafeT=rr(.6,1.5);if(Math.random()<.25)ai.crouchE=!ai.crouchE;}
  const dx=tgtA.pos.x-a.pos.x,dz=tgtA.pos.z-a.pos.z,l=Math.hypot(dx,dz)||1;if(!ai.path){mx=-dz/l*ai.strafe;mz=dx/l*ai.strafe;speed=ai.strafe?2.2:0;}a.crouch=!!ai.crouchE&&!ai.path&&!ai.strafe;}
 if(ai.state==='guard')a.crouch=ai.crouchG??(ai.crouchG=Math.random()<.4);
 if(a.vip&&ai.seen){a.crouch=true;}
 if(ai.strafeT>0&&!tgtA&&ai.strafe&&!ai.path){ai.strafeT-=dt;mx=Math.cos(a.yaw)*ai.strafe;mz=-Math.sin(a.yaw)*ai.strafe;speed=2;}
 // separation from friends
 for(const b of W.actors){if(b===a||!b.alive||b.team!==a.team)continue;const dx=a.pos.x-b.pos.x,dz=a.pos.z-b.pos.z,d2=dx*dx+dz*dz;if(d2<1.4&&d2>1e-4){const d=Math.sqrt(d2);mx+=dx/d*(1.2-d)*1.5;mz+=dz/d*(1.2-d)*1.5;speed=Math.max(speed,1.2);}}
 // friendlies keep out of the player's line of fire
 const P=W.player;if(a.team===0&&P&&P.alive){const dx=a.pos.x-P.pos.x,dz=a.pos.z-P.pos.z,d=Math.hypot(dx,dz);if(d<9&&d>.01){const fx=Math.sin(P.yaw),fz=Math.cos(P.yaw),along=(dx*fx+dz*fz)/d;if(along>.82){const side=(dx*fz-dz*fx)>=0?1:-1;mx+=fz*side*2.2;mz+=-fx*side*2.2;speed=Math.max(speed,3);}}}
 const ml=Math.hypot(mx,mz);if(ml>1e-4){mx/=ml;mz/=ml;}else speed=0;if(a.crouch)speed=Math.min(speed,1.8);
 a.move.set(mx*speed,0,mz*speed);
 // --- aim
 let wantYaw=a.yaw,wantPitch=0;if(tgtA){eyeOf(a,eye);chestOf(tgtA,tgt);if(ai.headAim)tgt.y+=.42;wantYaw=Math.atan2(tgt.x-eye.x,tgt.z-eye.z);wantPitch=Math.atan2(tgt.y-eye.y,Math.hypot(tgt.x-eye.x,tgt.z-eye.z));}
 else if(ai.last&&W.time-ai.lastT<6){wantYaw=Math.atan2(ai.last.x-a.pos.x,ai.last.z-a.pos.z);}
 else if(speed>.5)wantYaw=Math.atan2(mx,mz);
 else if(ai.state==='guard'||ai.state==='idle'){ai.lookT-=dt;if(ai.lookT<=0){ai.lookT=rr(1.5,4);ai.lookYaw=(ai.baseYaw??a.yaw)+rr(-1.2,1.2);if(ai.baseYaw==null)ai.baseYaw=a.yaw;}wantYaw=ai.lookYaw;}
 const turn=(tgtA?D.turn:3)*dt;a.yaw+=Math.max(-turn,Math.min(turn,ang(wantYaw-a.yaw)));a.pitch+=(wantPitch-a.pitch)*Math.min(1,dt*6);
 // --- fire
 if(tgtA&&a.weapon){ai.react-=dt;ai.onT+=dt;if(a.reloadT>0)return;if(a.mag<=0){W.reload(a);if(a.team===0&&Math.random()<.3)W.callout(a,'reload');return;}
  const off=Math.abs(ang(wantYaw-a.yaw));if(ai.react>0||off>.12||(a.crouch&&ai.state==='cover'))return;if(ai.pauseT>0){ai.pauseT-=dt;return;}
  if(a.fireT<=0){const err=D.err*(1+Math.min(2,(tgtA.speed||0)*.12))*(speed>2.5?1.5:1)*Math.max(.45,1-ai.onT*.35)*(tgtA.crouchV>.5?1.1:1)*(W.night?1.15:1)*(a.weapon.id==='sniper'?.5:1)*Math.PI/180;
   W.botFire(a,tgtA,err);ai.burst++;if(ai.burst>=rr(D.burst[0],D.burst[1])){ai.burst=0;ai.pauseT=rr(D.pause[0],D.pause[1]);ai.headAim=Math.random()<(W.diffI===2?.3:.1);}}}}
