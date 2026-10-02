// BREACH POINT — CPU operators: team plans (executes, splits, holds, rotations, retakes), perception (vision, smoke, flash, sound),
// human-like aim (reaction time, converging error, spray control, burst discipline), utility, bomb play, trading and economy.
import {WPN,NADE,gunValue} from './weapons.js';
export const DIFF=[
 {n:'EASY',floor:1.4,react:.62,err:7.5,conv:1.5,turn:200,comp:.15,head:.07,fov:62,hear:30,burst:.5,strafe:0},
 {n:'NORMAL',floor:.75,react:.36,err:4.6,conv:2.8,turn:380,comp:.55,head:.16,fov:72,hear:42,burst:1,strafe:.4},
 {n:'HARD',floor:.4,react:.22,err:2.8,conv:4.4,turn:620,comp:.82,head:.27,fov:80,hear:55,burst:1,strafe:.8}];
const R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v,D2R=Math.PI/180;
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d;};
const yawTo=(dx,dz)=>Math.atan2(-dx,-dz);

/* ===================================================================== team plans */
export function planRound(G){const L=G.L,d=L.def;const P={atk:{},def:{}};
 const site=R()<.5?'A':'B';const r=R();P.atk={site,style:r<.62?'exec':r<.88?'split':'rush',go:false,goT:G.timer-(28+R()*30),rotated:false,lurk:null,utilDone:false};
 const atk=G.agents.filter(a=>G.side(a)==='atk'&&!a.human);if(P.atk.style==='split'&&atk.length>2){const l=atk.filter(a=>!a.hasBomb);P.atk.lurk=l[R()*l.length|0];}
 // defenders: 2-1-2 / 3-0-2 / 2-0-3
 const defs=G.agents.filter(a=>G.side(a)==='def'&&!a.human).sort(()=>R()-.5);const sets=[['A','A','mid','B','B'],['A','A','A','B','B'],['A','A','B','B','B'],['A','mid','mid','B','B']];const s=sets[R()*sets.length|0].slice().sort(()=>R()-.5);
 const used={A:[],B:[],mid:[]};defs.forEach((a,i)=>{const z=s[i%s.length];const list=d.holds[z];let k=R()*list.length|0;for(let t=0;t<list.length&&used[z].includes(k);t++)k=(k+1)%list.length;used[z].push(k);a.brain.zone=z;a.brain.hold=list[k];});
 P.def.alert=null;P.def.alertT=0;G.plan=P;}

/* ===================================================================== buying */
export function botBuy(a,G){const side=G.side(a),m=()=>a.money;const prim=a.slots[1]?a.slots[1].id:null;const team=G.agents.filter(x=>G.side(x)===side);const avg=team.reduce((s,x)=>s+x.money,0)/team.length;
 const pistolRound=G.roundInHalf===0;const eco=!pistolRound&&avg<2600&&m()<3700&&!(prim);
 const buy=id=>G.buy(a,id,true);
 if(pistolRound){if(R()<.5)buy('vest');else if(R()<.5)buy('hawk');else buy('wasp');if(R()<.6)buy(R()<.5?'flash':'smoke');if(side==='def'&&R()<.3)buy('kit');return;}
 if(eco){if(m()>1200&&R()<.4)buy('vest');else if(m()>700&&R()<.5)buy(R()<.5?'hawk':'wasp');if(R()<.4)buy('flash');return;}
 if(!prim||gunValue(prim)<5){const r=R();let want=side==='atk'?'vanta':'sentry';if(r<.12&&m()>=5800)want='longbow';else if(m()<(WPN[want].price+1000))want=m()>=3050?'lynx':m()>=2300?'mako':m()>=1800?'bulwark':null;if(want&&R()<.85)buy(want);}
 if(a.armor<60||!a.helmet)buy(m()>=1000?'helm':'vest');if(side==='def'&&!a.kit&&m()>=400&&R()<.7)buy('kit');
 const pref=side==='atk'?['smoke','flash','frag','inc','flash']:['smoke','inc','flash','frag','flash'];for(const k of pref){if(m()<300)break;if(R()<.7)buy(k);}}

/* ===================================================================== per-bot brain */
export class Brain{constructor(a){this.a=a;this.tgt=null;this.seen=new Map();this.last=null;this.lastT=-99;this.react=0;this.ey=0;this.ep=0;this.path=null;this.pi=0;this.goal=null;this.repathT=0;this.thinkT=R()*.2;this.perT=R()*.1;
  this.zone=null;this.hold=null;this.mode='move';this.lookAt=null;this.stuckT=0;this.lastP={x:0,z:0};this.nadeCD=3+R()*4;this.burstN=0;this.pauseT=0;this.crouchT=0;this.strafeT=0;this.strafeDir=1;this.holdCrouch=R()<.3;this.waitT=0;this.evSeen=0;this.plantSpot=null;this.alertSite=null;this.headAim=R();}
 reset(){this.tgt=null;this.seen.clear();this.last=null;this.lastT=-99;this.path=null;this.goal=null;this.mode='move';this.lookAt=null;this.nadeCD=3+R()*5;this.plantSpot=null;this.holdCrouch=R()<.3;this.evSeen=0;this.burstN=0;this.pauseT=0;this.headAim=R();this.alertSite=null;this.lastHurtT=-9;this.utilThrown=false;this.throwPlan=null;this.wantInc=null;this.mode='move';}
 goTo(x,z,G,force){if(!force&&this.goal&&Math.hypot(this.goal.x-x,this.goal.z-z)<.8&&this.path)return;this.goal={x,z};this.path=G.L.path(this.a.pos.x,this.a.pos.z,x,z);this.pi=1;this.repathT=4+R()*2;}
 arrived(r=1.2){return!this.goal||Math.hypot(this.goal.x-this.a.pos.x,this.goal.z-this.a.pos.z)<r;}}

// vision test a -> b (eye to head/chest), respects smoke + range
export function canSee(G,a,b){const ex=a.pos.x,ey=a.pos.y+a.eye,ez=a.pos.z;for(const h of[b.headY(),b.pos.y+1.15-b.crouchV*.35]){if(G.L.los(ex,ey,ez,b.pos.x,h,b.pos.z)&&!G.fx.smokeBlocks(ex,ey,ez,b.pos.x,h,b.pos.z))return h;}return null;}

function engageRange(a){const g=a.slots[1]||a.slots[2];const c=g?g.def.cls:'pistol';return{pistol:36,smg:44,shotgun:22,rifle:90,sniper:160}[c]||60;}
function perceive(G,a,B,dt){const df=G.diff,side=G.side(a);if(a.blind>.6){if(B.tgt&&R()<.02)B.tgt=null;return;}
 const fov=(B.tgt?100:df.fov)*D2R;let best=null,bd=1e9;
 for(const e of G.agents){if(!e.alive||G.side(e)===side)continue;const dx=e.pos.x-a.pos.x,dz=e.pos.z-a.pos.z,d=Math.hypot(dx,dz);if(d>90)continue;
  const ang=Math.abs(angDiff(yawTo(dx,dz),a.yaw));if(ang>fov&&d>2.5&&e!==B.tgt)continue;const h=canSee(G,a,e);if(h===null)continue;
  const was=B.seen.get(e)||-9;B.seen.set(e,G.time);if(G.time-was>.6&&B.tgt!==e){/* fresh sighting */}
  if(G.time-(e.spotT[side]||-9)>6&&G.radio)G.radio(a,'CONTACT · '+G.L.callout(e.pos.x,e.pos.z),'c'+e.id);
  G.spot(e,side);if(d>engageRange(a)&&G.time-B.lastHurtT>2.5&&e!==B.tgt)continue;let score=d+(e===B.tgt?-8:0)+(e.hasBomb||e.defusing||e.planting?-10:0);if(score<bd){bd=score;best=e;}}
 if(best){if(best!==B.tgt){const fresh=G.time-(B.seenTgt||-9)>.8||B.tgt;B.tgt=best;const k=.8+R()*.5;B.react=G.time+(fresh?df.react*k*(a.blind>0?1.8:1):df.react*.4);const er=df.err*(.7+R()*.6)*(1+cl(G.time-B.lastT>3?.3:0,0,1));const th=R()*6.28;B.ey=Math.cos(th)*er*D2R;B.ep=Math.sin(th)*er*.6*D2R;B.headAim=R();}
  B.seenTgt=G.time;B.last={x:best.pos.x,z:best.pos.z,y:best.pos.y};B.lastT=G.time;}
 else if(B.tgt&&G.time-B.seenTgt>.5){B.tgt=null;}}

function hear(G,a,B){const df=G.diff,side=G.side(a);const ev=G.events;for(let i=ev.length-1;i>=0;i--){const e=ev[i];if(e.t<=B.evSeen)break;if(e.side===side)continue;const r=e.kind==='shot'?df.hear:e.kind==='step'?df.hear*.33:e.kind==='defuse'||e.kind==='plant'?df.hear*.5:df.hear*.7;
  const d=Math.hypot(e.x-a.pos.x,e.z-a.pos.z);if(d<r&&(!B.tgt)){if(G.time-B.lastT>.8||!B.last||Math.hypot(B.last.x-e.x,B.last.z-e.z)>4){B.last={x:e.x,z:e.z,y:e.y||0};B.lastT=G.time-.4;}if(e.kind==='defuse'&&a.nades.inc>0&&d<26)B.wantInc={x:e.x,z:e.z};}}
 if(ev.length)B.evSeen=ev[ev.length-1].t;}

/* ===================================================================== main think (per frame) */
export function think(G,a,dt){const B=a.brain,df=G.diff,side=G.side(a),c=a.ctl;c.slot=null;c.fire=false;c.reload=false;c.use=false;c.jump=false;c.throwKind=null;c.mx=0;c.mz=0;c.walk=false;
 if(G.phase==='freeze'){c.crouch=false;aimIdle(G,a,B,dt);return;}
 if((B.perT-=dt)<=0){B.perT=.09+R()*.05;perceive(G,a,B,dt);hear(G,a,B);}
 B.thinkT-=dt;if(B.thinkT<=0){B.thinkT=.22+R()*.12;decide(G,a,B);}
 const g=a.gun();
 // combat
 if(B.tgt&&B.tgt.alive){combat(G,a,B,dt);return;}
 B.tgt=null;
 // reload when safe
 if(g&&g.def.mag&&g.mag<g.def.mag*.4&&g.res>0&&G.time-B.lastT>1.5)c.reload=true;
 // utility
 if(B.throwPlan){const tp=B.throwPlan;if(a.nades[tp.k]>0){c.slot=4;a.nadeSel=tp.k;const dy=tp.y-(a.pos.y+a.eye);aimAt(a,tp.x,tp.y+1.2,tp.z,dt,df.turn*1.4);if(a.cur===4&&a.nadeSel===tp.k&&Math.abs(angDiff(yawTo(tp.x-a.pos.x,tp.z-a.pos.z),a.yaw))<.12&&a.switchT<=0){c.throwKind=tp.k;c.throwTarget=tp;B.throwPlan=null;B.nadeCD=4+R()*6;}return;}B.throwPlan=null;}
 if(a.cur===4&&!B.throwPlan)c.slot=a.slots[1]?1:2;
 // planting / defusing
 if(B.mode==='plant'){if(a.planting||(G.L.site(a.pos.x,a.pos.z)&&B.arrived(1))){c.use=true;c.slot=5;aimIdle(G,a,B,dt);return;}}
 if(B.mode==='defuse'&&G.bomb.state==='planted'){const bp=G.bomb.pos;if(Math.hypot(bp.x-a.pos.x,bp.z-a.pos.z)<1.3){c.use=true;c.crouch=true;aimIdle(G,a,B,dt);return;}}
 // movement along path
 move(G,a,B,dt);aimIdle(G,a,B,dt);}

function aimAt(a,x,y,z,dt,turn,comp=0){const dx=x-a.pos.x,dz=z-a.pos.z,dy=y-(a.pos.y+a.eye);const ty=yawTo(dx,dz),tp=Math.atan2(dy,Math.hypot(dx,dz));
 const wantYaw=ty-a.recoil.x*D2R*comp,wantPitch=tp-a.recoil.y*D2R*comp;const max=turn*D2R*dt;const dyaw=angDiff(wantYaw,a.yaw),dp=wantPitch-a.pitch;
 const k=Math.min(1,dt*12);a.yaw+=cl(dyaw*k*1.6,-max,max);a.pitch+=cl(dp*k*1.6,-max,max);a.pitch=cl(a.pitch,-1.4,1.4);}

function aimIdle(G,a,B,dt){let L=null;if(B.last&&G.time-B.lastT<4){L={x:B.last.x,y:(B.last.y||0)+1.5,z:B.last.z};}
 else if(B.lookAt){L=B.lookAt;}else if(B.path&&B.pi<B.path.length){const p=B.path[B.pi];L={x:p.x,y:G.L.floorH(p.x,p.z)+1.5,z:p.z};if(Math.hypot(p.x-a.pos.x,p.z-a.pos.z)<1.5&&B.pi+1<B.path.length){const q=B.path[B.pi+1];L={x:q.x,y:G.L.floorH(q.x,q.z)+1.5,z:q.z};}}
 if(L)aimAt(a,L.x,L.y,L.z,dt,G.diff.turn*.55);else a.pitch*=1-Math.min(1,dt*3);}

function move(G,a,B,dt){const c=a.ctl;if(!B.path||B.pi>=B.path.length){c.mx=c.mz=0;return;}const p=B.path[B.pi];const dx=p.x-a.pos.x,dz=p.z-a.pos.z,d=Math.hypot(dx,dz);
 if(d<.55){B.pi++;return;}c.mx=dx/d;c.mz=dz/d;
 // stuck detection
 B.stuckT+=dt;if(B.stuckT>.8){const m=Math.hypot(a.pos.x-B.lastP.x,a.pos.z-B.lastP.z);B.lastP.x=a.pos.x;B.lastP.z=a.pos.z;B.stuckT=0;if(m<.25){if(B.goal){const g=B.goal;B.goal=null;B.goTo(g.x,g.z,G,true);}c.jump=R()<.3;}}
 if(B.walk)c.walk=true;}

function combat(G,a,B,dt){const df=G.diff,c=a.ctl,e=B.tgt,g=a.gun();const vis=G.time-B.seenTgt<.15;
 // weapon readiness
 if(a.cur!==1&&a.cur!==2){c.slot=a.slots[1]&&a.slots[1].mag+a.slots[1].res>0?1:2;}
 if(g&&g.mag===0){if(g.res>0&&a.cur===1&&a.slots[2]&&a.slots[2].mag>0&&Math.hypot(e.pos.x-a.pos.x,e.pos.z-a.pos.z)<14)c.slot=2;else c.reload=true;}
 // aim point with converging error
 B.ey*=Math.exp(-df.conv*dt);B.ep*=Math.exp(-df.conv*dt);const d=Math.hypot(e.pos.x-a.pos.x,e.pos.z-a.pos.z);const ev=Math.hypot(e.vel.x,e.vel.z);if(ev>2.5){B.ey+=(R()-.5)*ev*.0016*dt*60/Math.max(1,d*.1);}
 const head=B.headAim<df.head||(d<6&&B.headAim<df.head*1.4);const ty=head?e.headY():e.pos.y+1.08-e.crouchV*.35;
 const lead=df.n==='HARD'?.06:0;const tx=e.pos.x+e.vel.x*lead,tz=e.pos.z+e.vel.z*lead;
 // offset target by error in angle space
 const rx=Math.cos(a.yaw),rz=-Math.sin(a.yaw);const ax=tx+rx*Math.tan(B.ey)*d,az=tz+rz*Math.tan(B.ey)*d,ay=ty+Math.tan(B.ep)*d;
 aimAt(a,ax,ay,az,dt,df.turn,df.comp*(a.blind>0?.3:1));
 // movement: stop to shoot; strafe between bursts; crouch spray sometimes
 c.mx=c.mz=0;if(B.pauseT>0){B.pauseT-=dt;if(df.strafe&&R()<df.strafe*.04+.01){B.strafeDir*=-1;}if(df.strafe>0&&d>6){c.mx=rx*B.strafeDir*.9;c.mz=rz*B.strafeDir*.9;}}
 if(df.n==='EASY'&&B.path&&B.pi<B.path.length&&R()<.5){move(G,a,B,dt);}
 B.crouchT-=dt;if(B.crouchT<=0){B.crouchT=1+R()*2;c.crouch=d>9&&d<35&&R()<(df.n==='EASY'?.1:.3);}
 if(!vis){// lost sight briefly: hold the angle, maybe close in when attacking
  if(G.side(a)==='atk'&&G.time-B.seenTgt>1.2&&B.last){if(!B.goal||Math.hypot(B.goal.x-B.last.x,B.goal.z-B.last.z)>3)B.goTo(B.last.x,B.last.z,G);move(G,a,B,dt);}return;}
 if(G.time<B.react||!g||g.mag===0||a.reloadT>0||a.switchT>0)return;
 // fire discipline
 const view={y:a.yaw+a.recoil.x*D2R,p:a.pitch+a.recoil.y*D2R};const want=yawTo(ax-a.pos.x,az-a.pos.z);const off=Math.abs(angDiff(want,view.y));const tol=Math.max(.6*D2R,Math.atan2(.35,d))+ (g.def.cls==='shotgun'?.06:0);
 if(off>tol*2.2)return;
 const sn=a.sprayN;let maxB=d>28?1:d>16?3:d>9?6:40;if(g.def.cls==='sniper'||g.def.semi)maxB=1;if(g.def.cls==='shotgun'&&d>16)return;
 if(B.pauseT>0)return;if(B.burstN>=maxB){B.burstN=0;B.pauseT=d>28?.32+R()*.25:.22+R()*.2;return;}
 if(g.def.semi&&G.time<a.nextFire)return;
 if(G.time>=a.nextFire){c.fire=true;B.burstN++;const fl=df.floor*D2R;B.ey+=(R()+R()-1)*fl;B.ep+=(R()+R()-1)*fl*.7;if(sn>=maxB&&maxB<40){B.burstN=maxB;}}}

/* ===================================================================== decisions (few Hz) */
function decide(G,a,B){const side=G.side(a),L=G.L,d=L.def,plan=G.plan,bomb=G.bomb;if(B.tgt)return;
 B.walk=false;B.lookAt=null;a.ctl.crouch=false;
 // grab a loose bomb
 if(side==='atk'&&bomb.state==='dropped'){const near=G.agents.filter(x=>x.alive&&G.side(x)==='atk'&&!x.human).sort((p,q)=>dist(p,bomb.pos)-dist(q,bomb.pos))[0];if(near===a){B.mode='pickup';B.goTo(bomb.pos.x,bomb.pos.z,G);return;}}
 // utility opportunities
 if(B.wantInc&&a.nades.inc>0){B.throwPlan={k:'inc',x:B.wantInc.x,y:L.floorH(B.wantInc.x,B.wantInc.z),z:B.wantInc.z};B.wantInc=null;return;}
 B.nadeCD-=.3;if(B.nadeCD<=0&&B.last&&G.time-B.lastT<4){const dl=Math.hypot(B.last.x-a.pos.x,B.last.z-a.pos.z);if(dl>8&&dl<26){const k=a.nades.frag>0&&R()<.5?'frag':side==='def'&&a.nades.inc>0&&R()<.5?'inc':a.nades.flash>0&&R()<.25?'flash':null;if(k){B.throwPlan={k,x:B.last.x,y:B.last.y||0,z:B.last.z};return;}}B.nadeCD=2+R()*3;}
 if(side==='atk')decideAtk(G,a,B,plan.atk);else decideDef(G,a,B,plan.def);}
const dist=(a,p)=>Math.hypot(a.pos.x-p.x,a.pos.z-p.z);

function decideAtk(G,a,B,P){const L=G.L,d=L.def,bomb=G.bomb;const site=P.site;
 if(bomb.state==='planted'){// post-plant: hold angles around the bomb
  const sp=d.post[bomb.site];const k=(a.id*7)%sp.length;const p=L.P(sp[k]);const bp=bomb.pos;if(B.mode!=='post'||!B.goal){B.mode='post';B.goTo(p.x,p.z,G);}
  if(B.arrived(1.5)){B.lookAt={x:bp.x,y:bp.y+.6,z:bp.z};B.path=null;}return;}
 // carrier on go: plant
 if(a.hasBomb&&(P.go||P.style==='rush')){const S=d.sites[site];if(!B.plantSpot){const pp=S.plant[R()*S.plant.length|0];B.plantSpot=L.P(pp);}const onSite=L.site(a.pos.x,a.pos.z)===site;
  if(onSite&&G.time-B.lastT>1.2){B.mode='plant';B.goTo(a.pos.x,a.pos.z,G);B.path=null;return;}B.mode='move';B.goTo(B.plantSpot.x,B.plantSpot.z,G);return;}
 // trade / chase recent info
 if(B.last&&G.time-B.lastT<3&&(P.go||dist(a,B.last)<12)){B.mode='hunt';B.goTo(B.last.x,B.last.z,G);return;}
 if(P.lurk===a&&!P.go){const s2=d.stage2[site];const p=L.P(s2[a.id%s2.length]);B.goTo(p.x,p.z,G);if(B.arrived(1.5)){B.path=null;const sc=L.P(d.sites[site].c);B.lookAt={x:sc.x,y:1.5,z:sc.z};B.walk=true;}return;}
 if(!P.go&&P.style!=='rush'){const st=d.stage[site];const p=L.P(st[a.id%st.length]);B.mode='stage';B.goTo(p.x,p.z,G);
  if(B.arrived(2)){B.path=null;const sc=L.P(d.sites[site].c);B.lookAt={x:sc.x,y:1.6,z:sc.z};}
  return;}
 // executing: utility first, then onto site
 if(P.go&&!B.utilThrown){B.utilThrown=true;const U=d.util[site];for(const u of U){if(a.nades[u.k]>0&&u._t!==G.round){u._t=G.round;const p=L.P(u.to);B.throwPlan={k:u.k,x:p.x,y:L.floorH(p.x,p.z),z:p.z};return;}}}
 const S=d.sites[site];const pick=S.plant[(a.id*3)%S.plant.length];const p=L.P(pick);B.mode='exec';B.goTo(p.x+(R()-.5)*2,p.z+(R()-.5)*2,G);
 if(B.arrived(2.5)){B.path=null;const ps=d.post[site];const q=L.P(ps[a.id%ps.length]);B.lookAt={x:q.x,y:1.6,z:q.z};}}

function decideDef(G,a,B,P){const L=G.L,d=L.def,bomb=G.bomb;
 if(bomb.state==='planted'){const bp=bomb.pos;const left=bomb.fuse,need=a.kit?5:10;
  if(left<need+.5&&!a.defusing){// save: get away
   B.mode='save';const far=L.P(d.spawns.def[a.id%5]);B.goTo(far.x,far.z,G);return;}
  const enemiesKnown=G.agents.some(e=>e.alive&&G.side(e)==='atk'&&G.time-(e.spotT.def||-9)<2.5&&dist(e,bp)<18);
  const defuser=G.agents.find(x=>x.alive&&x.defusing&&G.side(x)==='def');
  if(defuser&&defuser!==a){B.mode='cover';const off={x:bp.x+Math.cos(a.id)*4,z:bp.z+Math.sin(a.id)*4};B.goTo(off.x,off.z,G);if(B.arrived(2)){B.path=null;}return;}
  if(!enemiesKnown||left<need+3){B.mode='defuse';B.goTo(bp.x,bp.z,G);return;}
  B.mode='retake';const rt=d.retake[bomb.site];const p=L.P(rt[a.id%rt.length]);if(dist(a,p)>3&&dist(a,bp)>12)B.goTo(p.x,p.z,G);else B.goTo(bp.x,bp.z,G);return;}
 // rotate on info
 const al=P.alert;if(al&&G.time-P.alertT<14&&B.zone!==al){const ok=B.zone==='mid'||G.time-P.alertT>2.5;if(ok&&(a.id%3!==0||G.agents.filter(x=>x.alive&&G.side(x)==='def'&&x.brain&&x.brain.zone===B.zone).length>1)){B.zone=al;const H=d.holds[al];B.hold=H[(a.id+1)%H.length];}}
 if(B.last&&G.time-B.lastT<2.5&&dist(a,B.last)<7){B.lookAt={x:B.last.x,y:1.5,z:B.last.z};B.path=null;return;}
 if(!B.hold){const H=d.holds.mid;B.hold=H[a.id%H.length];}
 const h=L.P(B.hold);B.mode='hold';B.goTo(h.x,h.z,G);if(B.arrived(1.2)){B.path=null;a.ctl.crouch=B.holdCrouch&&G.diff.n!=='EASY';const lk=L.P([B.hold[2],B.hold[3]]);B.lookAt={x:lk.x,y:1.5,z:lk.z};}else{a.ctl.crouch=false;B.walk=G.diff.n==='HARD'&&dist(a,h)<6;}}

/* ===================================================================== team-level updates (called a few times a second) */
export function teamTick(G){const P=G.plan;if(!P)return;const L=G.L,d=L.def;
 // attackers: decide when to execute
 const A=P.atk;if(!A.go){const atk=G.agents.filter(a=>a.alive&&G.side(a)==='atk'&&!a.human);const st=d.stage[A.site].map(c=>L.P(c));const ready=atk.filter(a=>st.some(p=>Math.hypot(p.x-a.pos.x,p.z-a.pos.z)<5)).length;
  if(A.style==='rush'||G.timer<A.goT||ready>=Math.max(1,atk.length-1)&&G.timer<108||G.timer<55){A.go=true;const r=atk[0];if(r&&G.radio)G.radio(r,(A.style==='rush'?'RUSH ':'EXECUTE ')+A.site+' · GO GO GO','go');}}
 // attackers: abort to other site after heavy losses before plant
 if(A.go&&!A.rotated&&G.bomb.state!=='planted'){const dead=G.agents.filter(a=>!a.alive&&G.side(a)==='atk').length;const alive=G.agents.filter(a=>a.alive&&G.side(a)==='atk').length;if(dead>=2&&alive>=2&&G.timer>45&&Math.random()<.02){A.rotated=true;A.site=A.site==='A'?'B':'A';A.go=false;A.goT=G.timer-12;G.agents.forEach(a=>{if(a.brain)a.brain.utilThrown=false;});}}
 // defenders: alert on attackers spotted near a site
 const D=P.def;for(const s of['A','B']){const c=L.P(d.sites[s].c);const n=G.agents.filter(e=>e.alive&&G.side(e)==='atk'&&G.time-(e.spotT.def||-9)<3&&Math.hypot(e.pos.x-c.x,e.pos.z-c.z)<20).length;if(n>=2&&D.alert!==s){D.alert=s;D.alertT=G.time;const r=G.agents.find(x=>x.alive&&G.side(x)==='def'&&!x.human);if(r&&G.radio)G.radio(r,n+' ON '+s+' · ROTATE','al'+s);}}
 if(G.bomb.state==='planted'){D.alert=G.bomb.site;}}
