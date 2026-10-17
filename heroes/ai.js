// ZENITH PROTOCOL — CPU heroes. Bots drive the same input struct as the player: perception with reaction delay, smoothed aim with
// drifting error and target leading, role behaviour (tanks lead and shield, supports pick the most hurt ally and heal, damage heroes
// hold angles near the objective), per-hero ability and ultimate logic, and A* path following over the nav graph toward the objective.
import {V,cl,wrapA,rnd,damp} from './util.js';
import {WPN} from './weapons.js';
import {HEROES} from './heroes.js';
import {PHY} from './world.js';

export const BOTDIFF=[
 {n:'EASY',react:.62,err:.085,track:3.4,turn:3,strafe:.35,abil:.35,ult:.45,lead:.2,fireCone:1.35,fov:.35,heal:.6,hs:.04},
 {n:'NORMAL',react:.36,err:.046,track:6,turn:5.5,strafe:.7,abil:.7,ult:.8,lead:.6,fireCone:1,fov:.15,heal:.85,hs:.2},
 {n:'HARD',react:.2,err:.024,track:10,turn:9,strafe:1,abil:1,ult:1,lead:.9,fireCone:.8,fov:0,heal:1,hs:.45}];

const tv=new V(),tv2=new V();
export function newBrain(diff){return{d:diff,target:null,seenT:0,lostT:9,lastPos:new V(),path:null,pi:0,goal:null,goalT:0,stuckT:0,stuckP:new V(),strafe:1,strafeT:0,
 errP:Math.random()*100,thinkT:0,hsBias:Math.random()<diff.hs,abT:1+rnd(1),ally:null,allyT:0,vis:false,meleeCD:0,flinch:0,noTargetT:0,escape:0,anchorOff:new V((Math.random()-.5)*4,0,(Math.random()-.5)*4)};}
const near=(G,p,r,fn)=>{let n=0;for(const o of G.fighters)if(o.alive&&fn(o)&&o.pos.distanceTo(p)<r)n++;return n;};

// G exposes: fighters, W, enemy(a,b), time, objective(f) -> {p,r}, revealedTo(o,team), noise, deadAllies(team,sec)
export function think(f,G,dt){const b=f.ai,d=b.d,inp=f.inp;for(const k in inp)inp[k]=typeof inp[k]==='number'?0:false;
 if(!f.alive||f.stunT>0||f.dash||f.flyT>0)return;b.meleeCD-=dt;b.flinch=Math.max(0,b.flinch-dt);b.escape=Math.max(0,b.escape-dt);
 const H=HEROES[f.hero],wd=WPN[H.wpn],sup=H.role==='support';
 b.thinkT-=dt;if(b.thinkT<=0){b.thinkT=.12+rnd(.06);perceive(f,G);}
 const t=b.target&&b.target.alive?b.target:null;if(!t){b.target=null;b.seenT=0;b.noTargetT+=dt;}else b.noTargetT=0;
 const vis=!!(t&&b.vis);if(vis)b.seenT+=dt;else b.seenT=Math.max(0,b.seenT-dt*2);
 const eye=tv.copy(f.pos);eye.y+=PHY.eye;const dist=t?t.pos.distanceTo(f.pos):99;
 // supports: pick who to heal
 let ally=null;if(sup){b.allyT-=dt;if(b.allyT<=0){b.allyT=.25;b.ally=pickAlly(f,G,wd);}ally=b.ally&&b.ally.alive&&b.ally!==f?b.ally:null;}
 const healMode=ally&&(ally.hp/ally.maxHp<(H.wpn==='beam'?.97:.82))&&ally.pos.distanceTo(f.pos)<(H.wpn==='beam'?wd.range-1:45)&&G.W.los(eye,tv2.copy(ally.pos).setY(ally.pos.y+1.2))&&Math.random()<1.5;
 // reload when idle / empty
 if(wd.mag&&f.reloadT<=0){if(f.mag===0)inp.reload=true;else if(!vis&&b.noTargetT>1.2&&f.mag<wd.mag*.5)inp.reload=true;}
 /* ---------- aim ---------- */
 let aimOk=false,aimP=null;
 if(healMode){aimP=tv2.copy(ally.pos);aimP.y+=1.15;const v=ally.vel;aimP.x+=v.x*.08;aimP.z+=v.z*.08;}
 else if(t&&(vis||b.lostT<1.2)){aimP=tv2.copy(vis?t.pos:b.lastPos);const prec=wd.precision;aimP.y+=b.hsBias&&prec?1.6:1.15;
  if(vis){const tof=wd.proj?dist/wd.speed:0,ld=d.lead;aimP.x+=t.vel.x*(tof+.05)*ld;aimP.z+=t.vel.z*(tof+.05)*ld;if(wd.proj){aimP.y-=.8;aimP.y+=wd.grav*tof*tof*.5;}}}
 if(aimP){b.errP+=dt*(1.3+(t?Math.hypot(t.vel.x,t.vel.z)*.12:0));const settle=1/(1+b.seenT*1.6);const e=healMode?d.err*.4:d.err*(.45+settle*1.3+(t?Math.hypot(t.vel.x,t.vel.z)*.035:0)+b.flinch*1.5);
  const ex=Math.sin(b.errP*1.7)+Math.sin(b.errP*3.1+1.3)*.5,ey=Math.sin(b.errP*2.3+2)*.6+Math.sin(b.errP*4.1)*.3;
  const dx=aimP.x-eye.x,dy=aimP.y-eye.y,dz=aimP.z-eye.z,hd=Math.hypot(dx,dz);const wy=Math.atan2(-dx,-dz)+ex*e,wp=Math.atan2(dy,hd)+ey*e*.7;
  const k=1-Math.exp(-d.track*(healMode?1.5:1)*dt),dyw=wrapA(wy-f.yaw),mx=d.turn*dt;f.yaw+=cl(dyw*k,-mx,mx);f.pitch+=cl((wp-f.pitch)*k,-mx,mx);f.pitch=cl(f.pitch,-1.45,1.45);
  const err=Math.abs(wrapA(wy-f.yaw))+Math.abs(wp-f.pitch);const dd=Math.hypot(dx,dy,dz);const cone=(wd.beam?.2:wd.pel?.12:wd.proj?.09:wd.scope?.03:.06)*d.fireCone+Math.atan2(.5,Math.max(1,dd));aimOk=err<cone;}
 else if(b.path&&b.path[b.pi]){const n=b.path[b.pi].n;const dx=n.x-f.pos.x,dz=n.z-f.pos.z;if(dx*dx+dz*dz>.5){const wy=Math.atan2(-dx,-dz);f.yaw+=wrapA(wy-f.yaw)*(1-Math.exp(-dt*5));}f.pitch=damp(f.pitch,0,3,dt);}
 /* ---------- fire ---------- */
 if(healMode){if(aimOk)inp.fire=true;}
 else if(t&&vis&&b.seenT>d.react){const inRange=dist<(wd.beam?wd.range:wd.range*.9);
  if(dist<2.2&&b.meleeCD<=0){inp.melee=true;b.meleeCD=1+rnd(.6);}
  else if(inRange&&aimOk){if(wd.scope){if(dist>14){inp.zoom=true;if(f.zoom>.7&&f.chargeT>=wd.charge*(.55+d.abil*.4))inp.fire=true;}else inp.fire=true;}else if(!(wd.proj&&dist<2.5))inp.fire=true;}}
 /* ---------- abilities ---------- */
 b.abT-=dt;if(b.abT<=0){b.abT=.35+rnd(.3);if(Math.random()<d.abil+.15)abilities(f,G,b,H,t,vis,dist,ally,healMode);}
 /* ---------- goals + movement ---------- */
 b.goalT-=dt;if(b.goalT<=0||!b.path){chooseGoal(f,G,H,t,vis,ally);b.goalT=1.1+rnd(1.2);}
 const mv=tv.set(0,0,0);let wantJump=false;const node=b.path&&b.path[b.pi];
 if(node){const n=node.n,dx=n.x-f.pos.x,dz=n.z-f.pos.z,hd=Math.hypot(dx,dz),dy=n.y-f.pos.y;mv.set(dx,0,dz);if(hd>.01)mv.divideScalar(hd);
  if(node.t===2&&hd<1.8&&f.onGround)wantJump=true;
  const reached=hd<(node.t===0?.9:.75)&&dy<1.3&&dy>-(node.t===1?20:1.4);if(reached){b.pi++;if(b.pi>=b.path.length){b.path=null;b.goalT=Math.min(b.goalT,.3);}}}
 if(t&&vis&&!healMode){b.strafeT-=dt;if(b.strafeT<=0){b.strafe=Math.random()<.5?-1:1;b.strafeT=.35+rnd(.9)/(.5+d.strafe);}
  const toT=tv2.subVectors(t.pos,f.pos).setY(0).normalize();const sideV=new V(-toT.z,0,toT.x);const p=wd.pref;let adv=0;if(dist>p[1])adv=1;else if(dist<p[0]+1)adv=-.7;if(H.role==='tank'&&dist>4)adv=Math.max(adv,.5);
  const combat=new V().addScaledVector(sideV,b.strafe*d.strafe).addScaledVector(toT,adv);const onObj=b.goal&&b.goal.kind==='obj';if(b.path&&onObj)combat.lerp(mv,.55);mv.copy(combat);
  if(f.onGround&&Math.random()<dt*d.strafe*.6)wantJump=true;}
 else if(healMode&&ally){const dd=ally.pos.distanceTo(f.pos);if(dd<4&&!b.path){mv.subVectors(f.pos,ally.pos).setY(0).normalize().multiplyScalar(.5);}}
 if(b.escape>0&&t){mv.subVectors(f.pos,t.pos).setY(0).normalize();}
 b.stuckT+=dt;if(b.stuckT>1.1){const moved=f.pos.distanceTo(b.stuckP);b.stuckP.copy(f.pos);b.stuckT=0;if(moved<.5&&mv.lengthSq()>.1){b.stuck=(b.stuck||0)+1;wantJump=true;if(b.stuck>2){b.path=null;b.goalT=0;b.stuck=0;b.strafe*=-1;}}else b.stuck=0;}
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);inp.fwd=cl(-(mv.x*sy+mv.z*cy),-1,1);inp.side=cl(mv.x*cy-mv.z*sy,-1,1);
 if(wantJump&&f.onGround){inp.jumpEdge=true;inp.jump=true;}}

function pickAlly(f,G,wd){let best=null,bs=1e9;const range=wd.beam?wd.range+6:45;
 for(const o of G.fighters){if(o===f||!o.alive||G.enemy(f,o))continue;const d=o.pos.distanceTo(f.pos);if(d>range)continue;const r=o.hp/o.maxHp;
  let s=r*100+d*.8-(HEROES[o.hero].role==='tank'?8:0)-(o.human?6:0);if(o===f.ai.ally)s-=10;if(s<bs){bs=s;best=o;}}return best;}

function perceive(f,G){const b=f.ai,d=b.d,W=G.W;let best=null,bs=1e9,bvis=false;const eye=new V(f.pos.x,f.pos.y+PHY.eye,f.pos.z);const fx=-Math.sin(f.yaw),fz=-Math.cos(f.yaw);
 for(const o of G.fighters){if(o===f||!o.alive||!G.enemy(f,o))continue;const dx=o.pos.x-f.pos.x,dz=o.pos.z-f.pos.z,dy=o.pos.y-f.pos.y,dist=Math.hypot(dx,dy,dz);if(dist>85)continue;
  const front=(dx*fx+dz*fz)/Math.max(.1,Math.hypot(dx,dz));const known=G.revealedTo(o,f.team);
  const aware=known||front>d.fov-.25||dist<8||o===b.target&&b.lostT<2||o===f.lastHitBy&&G.time-f.lastHitT<2;if(!aware)continue;
  const tp=new V(o.pos.x,o.pos.y+1.3,o.pos.z);let los=W.los(eye,tp);if(!los){tp.y=o.pos.y+1.7;los=W.los(eye,tp);}if(!los&&!known)continue;
  let s=dist+(o===b.target?-8:0)+o.hp*.02-(o===f.lastHitBy?10:0)+(los?0:25)-(HEROES[o.hero].role==='support'?3:0);if(s<bs){bs=s;best=o;bvis=los;}}
 if(best){if(best!==b.target){b.target=best;b.seenT=0;b.hsBias=Math.random()<d.hs;}b.vis=bvis;b.lostT=bvis?0:b.lostT+.15;b.lastPos.copy(best.pos);}
 else{b.vis=false;b.lostT+=.15;if(b.target&&b.lostT>4)b.target=null;}}

function setGoal(f,G,kind,p){const b=f.ai;b.goal={kind,p:p.clone?p.clone():new V(p.x,p.y,p.z)};const path=G.W.path(f.pos,p);if(path&&path.length){b.path=path;b.pi=0;}else b.path=null;return!!b.path;}
function chooseGoal(f,G,H,t,vis,ally){const b=f.ai;const obj=G.objective(f);const dObj=obj?f.pos.distanceTo(obj.p):0;const hpR=f.hp/f.maxHp;
 // badly hurt damage heroes fall back to a healer when one is alive
 if(H.role!=='support'&&hpR<.35&&!vis){let s=null,sd=1e9;for(const o of G.fighters)if(o.alive&&o!==f&&!G.enemy(f,o)&&HEROES[o.hero].role==='support'){const dd=o.pos.distanceTo(f.pos);if(dd<sd){sd=dd;s=o;}}if(s&&sd>5&&setGoal(f,G,'heal',s.pos))return;}
 // supports stay with the team: follow the heal target or the front-most ally near the objective
 if(H.role==='support'){let a=ally;if(!a||a.pos.distanceTo(f.pos)>30){let bs=1e9;for(const o of G.fighters)if(o.alive&&o!==f&&!G.enemy(f,o)){const s=(obj?o.pos.distanceTo(obj.p):0)+(HEROES[o.hero].role==='tank'?-6:0);if(s<bs){bs=s;a=o;}}}
  if(a){const p=tv.copy(a.pos).add(b.anchorOff);if(obj){tv2.subVectors(a.pos,obj.p).setY(0);if(tv2.lengthSq()>1)p.addScaledVector(tv2.normalize(),2.5);}if(p.distanceTo(f.pos)>3.5&&setGoal(f,G,'follow',p))return;}}
 // chase a target that was just seen near the objective
 if(t&&!vis&&b.lostT<4&&(!obj||t.pos.distanceTo(obj.p)<22)&&setGoal(f,G,'hunt',b.lastPos))return;
 if(obj){const off=new V((Math.random()-.5)*obj.r*1.4,0,(Math.random()-.5)*obj.r*1.4);if(H.role==='damage'&&obj.hold&&dObj<obj.r*3&&Math.random()<.4)off.multiplyScalar(2.2);if(dObj>obj.r*.7||Math.random()<.5){if(setGoal(f,G,'obj',obj.p.clone().add(off)))return;}}
 const R=G.W.roam;for(let k=0;k<4;k++){const n=R[Math.random()*R.length|0];if(n&&setGoal(f,G,'roam',n))return;}}

/* ---------- per-hero ability logic ---------- */
function abilities(f,G,b,H,t,vis,dist,ally,healMode){const inp=f.inp,d=b.d,hpR=f.hp/f.maxHp,hurt=G.time-f.lastHitT<1.5,ready=k=>f.cd[k]<=0,ult=f.ult>=H.ult.cost&&f.ultOn<=0&&Math.random()<d.ult+.1;
 const foesNear=(p,r)=>near(G,p,r,o=>G.enemy(f,o)),friendsNear=(p,r)=>near(G,p,r,o=>o!==f&&!G.enemy(f,o));
 switch(f.hero){
 case'granite':if(ready('a1')&&vis&&dist<28&&!f.barrier&&(hurt||friendsNear(f.pos,9)>=1))inp.a1=true;else if(ready('a2')&&vis&&dist>3.5&&dist<11&&hpR>.4)inp.a2=true;
  if(ult&&(foesNear(f.pos,7.5)>=2||foesNear(f.pos,6)>=1&&hpR<.4))inp.ult=true;break;
 case'kodiak':if(ready('a1')&&(hurt&&hpR<.7||vis&&friendsNear(f.pos,5)>=2&&hurt))inp.a1=true;else if(ready('a2')&&vis&&dist>6&&dist<16)inp.a2=true;
  if(ult&&vis&&t&&foesNear(t.pos,7)>=2&&dist<25)inp.ult=true;break;
 case'volt':if(ready('a1')&&hurt&&hpR<.45){b.escape=.3;inp.a1=true;}else if(ready('a2')&&vis&&dist>5&&dist<20)inp.a2=true;else if(ready('a1')&&vis&&Math.random()<.15)inp.a1=true;
  if(ult&&vis&&dist<24&&(foesNear(t.pos,6)>=2||t.hp<160))inp.ult=true;break;
 case'sable':if(ready('a1')&&f.onGround&&(hurt&&hpR<.45||!vis&&b.noTargetT>3&&Math.random()<.2))inp.a1=true;else if(ready('a2')&&!vis&&b.noTargetT>2){const o=G.objective(f);if(o){const dx=o.p.x-f.pos.x,dz=o.p.z-f.pos.z;f.yaw=Math.atan2(-dx,-dz);f.pitch=-.05;inp.a2=true;}}
  if(ult&&(vis||t&&b.lostT<2))inp.ult=true;break;
 case'cinder':if(ready('a1')&&hurt&&hpR<.4){b.escape=.4;inp.a1=true;}else if(ready('a2')&&vis&&dist>3&&dist<14)inp.a2=true;else if(ready('a1')&&vis&&Math.random()<.08)inp.a1=true;
  if(ult&&vis&&dist<34&&(foesNear(t.pos,6)>=2||G.onObjective(t)))inp.ult=true;break;
 case'solace':if(ready('a1')&&ally&&ally.hp/ally.maxHp<.6&&ally.pos.distanceTo(f.pos)>9&&healMode)inp.a1=true;
  else if(ready('a2')&&(near(G,f.pos,6,o=>!G.enemy(f,o)&&o.hp<o.maxHp*.75)>=2||hpR<.5&&hurt))inp.a2=true;
  if(ult&&(G.deadAllies(f.team,9)>=2||G.deadAllies(f.team,9)>=1&&Math.random()<.3||near(G,f.pos,14,o=>!G.enemy(f,o)&&o.hp<o.maxHp*.45)>=3))inp.ult=true;break;
 case'riff':if(ready('a1')&&(vis&&friendsNear(f.pos,10)>=2||!vis&&G.objective(f)&&f.pos.distanceTo(G.objective(f).p)>25&&friendsNear(f.pos,10)>=1))inp.a1=true;
  else if(ready('a2')){if(healMode&&ally&&near(G,ally.pos,4,o=>!G.enemy(f,o)&&o.hp<o.maxHp*.8)>=2)inp.a2=true;else if(healMode&&ally&&ally.hp<ally.maxHp*.45)inp.a2=true;else if(!healMode&&vis&&dist<20&&foesNear(t.pos,4)>=2)inp.a2=true;}
  if(ult&&vis&&friendsNear(f.pos,13)>=2)inp.ult=true;break;}}
