// STARFALL VANGUARD — CPU squadmates and Kyrr AI. Both drive the same input struct as the player: perception with reaction
// delay and line of sight, human-like drifting aim with target leading, heat-aware energy fire, grenades, A* movement over the
// walkable grid, strafing at a preferred range. Marines follow the player / move to orders; Kyrr guard, patrol, chase within
// a leash, Skitters panic when their Warden falls, Ravagers charge, turrets hold.
import {V,cl,wrapA,rnd} from './util.js';
import {WPN} from './weapons.js';
import {PHY} from './world.js';

export const DIFF=[
 {n:'EASY',react:.85,err:.12,track:3.4,turn:3,strafe:.35,nade:.05,dmg:.45,hp:.8,lead:.1,cone:1.4,rate:1.5},
 {n:'NORMAL',react:.5,err:.075,track:5.5,turn:5,strafe:.65,nade:.14,dmg:.75,hp:1,lead:.45,cone:1.1,rate:1.15},
 {n:'HEROIC',react:.34,err:.05,track:8,turn:7,strafe:.85,nade:.25,dmg:1.1,hp:1.2,lead:.75,cone:.95,rate:1},
 {n:'LEGENDARY',react:.22,err:.032,track:11,turn:9,strafe:1,nade:.38,dmg:1.6,hp:1.45,lead:.92,cone:.85,rate:.9}];
export const MARINE_AI={react:.4,err:.06,track:6,turn:6,strafe:.6,nade:.12,lead:.5,cone:1,rate:1.1};
// per-kind stats: hp, shield, speed, weapon, preferred range, melee damage, score
export const KIND={
 skitter:{hp:42,sh:0,spd:5.4,w:'spark',pref:[4,22],melee:22,score:50,r:.34,h:1.3,head:1.08,name:'SKITTER'},
 warden:{hp:70,sh:85,spd:6.6,w:'ion',pref:[6,30],melee:70,score:150,r:.42,h:2.05,head:1.88,name:'WARDEN'},
 wardenR:{hp:90,sh:130,spd:6.8,w:'ion',pref:[6,30],melee:80,score:220,r:.42,h:2.1,head:1.92,name:'WARDEN CAPTAIN'},
 ravager:{hp:420,sh:0,spd:5.6,w:'mortar',pref:[8,45],melee:95,score:450,r:.62,h:2.6,head:2.32,armor:.75,name:'RAVAGER'},
 overseer:{hp:1100,sh:450,spd:5.2,w:'mortar',pref:[6,40],melee:120,score:2500,r:.75,h:3.1,head:2.85,armor:.8,boss:1,name:'OVERSEER VASH'},
 turret:{hp:220,sh:0,spd:0,w:'ion',pref:[0,70],melee:0,score:200,r:.9,h:2.6,head:9,fixed:1,name:'SHARD TURRET'},
 marine:{hp:110,sh:0,spd:6.4,pref:[4,35],melee:60,r:.38,h:1.8,head:1.62},
 vanguard:{hp:100,sh:100,spd:6.6,r:.38,h:1.8,head:1.62}};

const tv=new V(),tv2=new V();
export function newBrain(d){return{d,target:null,seenT:0,lostT:9,lastPos:new V(),path:null,pi:0,goal:null,goalT:0,stuckT:0,stuckP:new V(),strafe:1,strafeT:0,errP:Math.random()*100,nadeCD:4+rnd(5),thinkT:Math.random()*.2,
 meleeCD:0,flinch:0,alert:false,burstT:0,hold:0,crouchT:0,leash:46,chargeT:0,slamCD:3,heard:null,form:Math.random()*Math.PI*2};}

export function think(f,G,dt){const b=f.ai,d=b.d,inp=f.inp;inp.fwd=inp.side=0;inp.jump=inp.jumpEdge=inp.sprint=inp.fire=inp.zoom=inp.reload=inp.melee=inp.nade=inp.swap=inp.interact=false;f.crouch=false;
 if(!f.alive)return;b.nadeCD-=dt;b.meleeCD-=dt;b.flinch=Math.max(0,b.flinch-dt);b.slamCD-=dt;
 b.thinkT-=dt;if(b.thinkT<=0){b.thinkT=.14+rnd(.08);perceive(f,G);}
 const t=b.target&&b.target.alive?b.target:null;if(!t){b.target=null;b.seenT=0;}
 const vis=t&&b.lostT<.05;if(vis)b.seenT+=dt;else b.seenT=Math.max(0,b.seenT-dt*2);
 const K=f.K;const eye=tv.copy(f.pos);eye.y+=K.head;
 const w=f.weapons[f.wi],wd=w&&WPN[w.id];const tp=t?(t.veh?t.veh.pos:t.pos):null;const dist=t?tp.distanceTo(f.pos):99;
 // flee (skitter panic)
 if(f.flee>0){f.flee-=dt;const away=tv2.subVectors(f.pos,tp||G.mePos()).setY(0).normalize();moveDir(f,away,1);inp.sprint=true;if(Math.random()<dt*.6)G.sfx('chitter',f.pos);return;}
 // reload (human weapons)
 if(w&&!wd.energy&&w.mag===0&&w.res>0&&f.reloadT<=0)inp.reload=true;
 /* ---------- aim ---------- */
 let aimOk=false;
 if(t&&(vis||b.lostT<1.2)){const tgt=tv2.copy(vis?tp:b.lastPos);tgt.y+=t.veh?1.2:t.K.head*.75;
  if(vis&&wd){const tof=wd.bolt?dist/wd.bolt:wd.proj?dist/wd.speed:0,ld=d.lead;const vv=t.veh?t.veh.vel:t.vel;tgt.x+=vv.x*(tof+.05)*ld;tgt.z+=vv.z*(tof+.05)*ld;if(wd.arc)tgt.y+=dist*dist*.0042;}
  b.errP+=dt*1.4;const settle=1/(1+b.seenT*1.4);const vv=t.veh?t.veh.vel:t.vel;const ts=Math.hypot(vv.x,vv.z);const e=d.err*(.5+settle*1.3+ts*.03+b.flinch*1.5);
  const ex=Math.sin(b.errP*1.7)+Math.sin(b.errP*3.1+1.3)*.5,ey=Math.sin(b.errP*2.3+2)*.6+Math.sin(b.errP*4.1)*.3;
  const dx=tgt.x-eye.x,dy=tgt.y-eye.y,dz=tgt.z-eye.z,hd=Math.hypot(dx,dz);const wy=Math.atan2(-dx,-dz)+ex*e,wp=Math.atan2(dy,hd)+ey*e*.7;
  const k=1-Math.exp(-d.track*dt),dyw=wrapA(wy-f.yaw),mx=d.turn*dt;f.yaw+=cl(dyw*k,-mx,mx);f.pitch+=cl((wp-f.pitch)*k,-mx,mx);f.pitch=cl(f.pitch,-1.3,1.3);
  const err=Math.abs(wrapA(wy-f.yaw))+Math.abs(wp-f.pitch);aimOk=err<(wd?.pel?.12:wd?.arc?.12:.07)*d.cone+Math.atan2(.6,Math.max(1,dist));}
 else if(b.path&&b.path[b.pi]){const n=b.path[b.pi];const dx=n.x-f.pos.x,dz=n.z-f.pos.z;if(dx*dx+dz*dz>.5){f.yaw+=wrapA(Math.atan2(-dx,-dz)-f.yaw)*(1-Math.exp(-dt*5));}f.pitch*=Math.exp(-dt*3);}
 /* ---------- attack ---------- */
 if(t&&vis&&b.seenT>d.react&&f.swapT<=0){
  if(dist<2.4*f.scale&&b.meleeCD<=0&&K.melee){inp.melee=true;b.meleeCD=1.1+rnd(.6);}
  else if(wd&&dist<wd.range*.95&&aimOk){
   // fire discipline: energy weapons vent before overheating, bursts with pauses
   b.burstT-=dt;if(b.burstT<-(.35+rnd(.5))*d.rate)b.burstT=(.5+rnd(1.1))/d.rate;
   if(b.burstT>0&&!(wd.energy&&w.heat>.82)&&!(wd.splash&&dist<4))inp.fire=true;}
  if(wd&&wd.scope&&dist>20)inp.zoom=true;
  if(b.nadeCD<=0&&dist>8&&dist<24&&f.nades&&(f.nades.frag+f.nades.stick)>0&&Math.random()<d.nade){inp.nade=true;b.nadeCD=6+rnd(7);}else if(b.nadeCD<=0)b.nadeCD=2;
  // boss ground slam
  if(f.kind==='overseer'&&dist<7&&b.slamCD<=0){f.slam=1;b.slamCD=5+rnd(3);}}
 if(K.fixed)return;
 /* ---------- goals ---------- */
 b.goalT-=dt;if(b.goalT<=0||!b.path){chooseGoal(f,G,t,vis,dist);b.goalT=.9+rnd(1.2);}
 const mv=tv.set(0,0,0);let sprint=false;const node=b.path&&b.path[b.pi];
 if(node){const dx=node.x-f.pos.x,dz=node.z-f.pos.z,hd=Math.hypot(dx,dz);mv.set(dx,0,dz);if(hd>.01)mv.divideScalar(hd);if(hd<1.1){b.pi++;if(b.pi>=b.path.length){b.path=null;b.goalT=Math.min(b.goalT,.3);}}sprint=!t&&hd>4&&b.goal&&b.goal.far;}
 // combat movement: strafe, keep preferred range; ravagers charge
 if(t&&(vis||b.lostT<1)&&wd){b.strafeT-=dt;if(b.strafeT<=0){b.strafe=Math.random()<.5?-1:1;b.strafeT=.4+rnd(1)/(.5+d.strafe);}
  const toT=tv2.subVectors(tp,f.pos).setY(0).normalize();const sideV=new V(-toT.z,0,toT.x);const p=K.pref;let adv=0;if(dist>p[1])adv=1;else if(dist<p[0])adv=-.8;
  if((f.kind==='ravager'||f.kind==='overseer')&&dist<12&&b.seenT>.5){adv=1;sprint=true;b.chargeT=1;}
  const st=f.kind==='skitter'?.6:1;const combat=new V().addScaledVector(sideV,b.strafe*d.strafe*st).addScaledVector(toT,adv);if(b.path&&b.goal&&b.goal.kind!=='fight')combat.lerp(mv,.6);mv.copy(combat);
  if(f.team===0&&dist>p[0]&&Math.random()<dt*.15)b.crouchT=1+rnd(1.5);if(f.kind==='warden'&&Math.random()<dt*d.strafe*.5&&f.onGround)inp.jumpEdge=true;}
 if(b.crouchT>0){b.crouchT-=dt;f.crouch=true;mv.multiplyScalar(.3);}
 b.stuckT+=dt;if(b.stuckT>1.2){const moved=f.pos.distanceTo(b.stuckP);b.stuckP.copy(f.pos);b.stuckT=0;if(moved<.5&&mv.lengthSq()>.1){b.stuck=(b.stuck||0)+1;inp.jumpEdge=true;if(b.stuck>1){b.path=null;b.goalT=0;b.stuck=0;b.strafe*=-1;}}else b.stuck=0;}
 moveDir(f,mv,mv.length()>1?1:mv.length());inp.sprint=inp.sprint||sprint&&inp.fwd>.6;}
function moveDir(f,mv,k){const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);const l=Math.hypot(mv.x,mv.z)||1;const x=mv.x/l*k,z=mv.z/l*k;f.inp.fwd=cl(-(x*sy+z*cy),-1,1);f.inp.side=cl(x*cy-z*sy,-1,1);}

function perceive(f,G){const b=f.ai,W=G.W;let best=null,bs=1e9;const eye=new V(f.pos.x,f.pos.y+f.K.head,f.pos.z);const fx=-Math.sin(f.yaw),fz=-Math.cos(f.yaw);const range=f.K.fixed?75:f.team?70:80;
 for(const o of G.actors){if(o===f||!o.alive||o.team===f.team||o.hidden)continue;const op=o.veh?o.veh.pos:o.pos;const dx=op.x-f.pos.x,dz=op.z-f.pos.z,dy=op.y-f.pos.y,dist=Math.hypot(dx,dy,dz);if(dist>range)continue;
  const front=(dx*fx+dz*fz)/Math.max(.1,Math.hypot(dx,dz));const aware=b.alert||front>-.1||dist<9||o===b.target&&b.lostT<3||o===f.lastHitBy&&G.time-f.lastHitT<3;if(!aware)continue;
  const tp=new V(op.x,op.y+(o.veh?1.4:o.K.head*.7),op.z);if(!W.los(eye,tp)){tp.y=op.y+(o.veh?2.2:o.K.head);if(!W.los(eye,tp))continue;}
  let s=dist+(o===b.target?-8:0)-(o===f.lastHitBy?10:0)+(o.human?-4:0)+(o.veh?-6:0);if(s<bs){bs=s;best=o;}}
 if(best){if(best!==b.target){b.target=best;b.seenT=0;if(!b.alert&&f.team===1)G.alertGroup(f);}b.alert=true;b.lostT=0;b.lastPos.copy(best.veh?best.veh.pos:best.pos);}
 else{b.lostT+=.16;if(b.target&&b.lostT>6)b.target=null;}
 if(!best&&G.noise&&G.noise.t>G.time-1.2&&G.noise.who.team!==f.team&&G.noise.p.distanceTo(f.pos)<38){b.heard=G.noise.p.clone();b.alert=true;}}

function setGoal(f,G,kind,p,far){const b=f.ai;b.goal={kind,p:p.clone(),far};const path=G.W.path(f.pos,p);if(path&&path.length){b.path=path.map(k=>G.W.cpos(k,new V()));b.pi=0;}else b.path=null;return!!b.path;}
function chooseGoal(f,G,t,vis,dist){const b=f.ai;
 if(f.team===0){// marines: follow the player in a loose ring, or hold the ordered point
  const anchor=G.squadAnchor(f);if(!anchor)return;const a=b.form+G.time*.02,rad=anchor.r??7;const want=new V(anchor.p.x+Math.cos(a)*rad*.8,anchor.p.y,anchor.p.z+Math.sin(a)*rad*.8);
  const dA=f.pos.distanceTo(anchor.p);if(t&&vis&&dA<rad+16){// fight near the anchor
   const toT=tv2.subVectors(t.veh?t.veh.pos:t.pos,f.pos).setY(0).normalize();const p=f.pos.clone().addScaledVector(toT,dist>f.K.pref[1]?6:-2).add(new V((Math.random()-.5)*6,0,(Math.random()-.5)*6));setGoal(f,G,'fight',p);return;}
  if(dA>rad+2||!b.path)setGoal(f,G,'follow',want,dA>14);return;}
 // kyrr
 const home=f.home;if(t&&b.alert){const tp=t.veh?t.veh.pos:t.pos;const lp=vis?tp:b.lastPos;const leash=f.leash??b.leash;
  if(home&&lp.distanceTo(home)>leash){setGoal(f,G,'guard',G.W.randomNear(home,8,new V()));return;}
  const toT=tv2.subVectors(lp,f.pos).setY(0);const dd=toT.length();toT.normalize();const p=f.K.pref;let off;
  if(dd>p[1]||!vis)off=f.pos.clone().addScaledVector(toT,Math.min(dd-p[0],12));else{const side=new V(-toT.z,0,toT.x).multiplyScalar((Math.random()-.5)*14);off=f.pos.clone().add(side).addScaledVector(toT,dd<p[0]?-5:2);}
  setGoal(f,G,'fight',off);return;}
 if(b.heard){setGoal(f,G,'hunt',b.heard);b.heard=null;return;}
 if(home){setGoal(f,G,'patrol',G.W.randomNear(home,f.K.fixed?0:9,new V()));b.goalT=3+rnd(4);}}
