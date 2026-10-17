// STRIKE ZONE — CPU fighters: perception (vision cone + line of sight + hearing + damage), human-like aim (reaction time, converging error,
// recoil compensation, head/body choice), duelling movement (strafe, crouch, jump, slide), cover seeking, flanking, item runs and grenades.
import {WPN} from './weapons.js';
export const DIFF=[
 {n:'ROOKIE',react:.58,err:7,conv:1.3,turn:230,comp:.1,head:.08,fov:100,see:55,hear:26,strafe:.15,cover:.25,flank:.12,jump:.015,crouch:0,tap:.32,mult:.8},
 {n:'VETERAN',react:.33,err:3.9,conv:2.6,turn:430,comp:.5,head:.2,fov:115,see:80,hear:40,strafe:.6,cover:.6,flank:.38,jump:.05,crouch:.25,tap:.16,mult:1},
 {n:'ELITE',react:.2,err:2.3,conv:4.3,turn:720,comp:.82,head:.33,fov:130,see:110,hear:55,strafe:.92,cover:.85,flank:.6,jump:.12,crouch:.45,tap:.08,mult:1.3}];
const R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v,D2R=Math.PI/180;
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d;};
const yawTo=(dx,dz)=>Math.atan2(-dx,-dz);
const PREF={rifle:20,smg:10,shotgun:5,sniper:38,lmg:22,pistol:12,revolver:14,rl:16,knife:1};

export class Brain{
 constructor(a){this.a=a;this.reset();this.style=R();}
 reset(){this.tgt=null;this.seenT=-9;this.last=null;this.lastT=-99;this.react=0;this.ey=0;this.ep=0;this.path=null;this.pi=0;this.goal=null;this.mode='roam';this.thinkT=R()*.3;this.perT=R()*.1;this.stuckT=0;this.lp={x:0,z:0};this.progT=0;
  this.strafeDir=R()<.5?-1:1;this.strafeT=0;this.crouchT=0;this.burstT=0;this.pauseT=0;this.nextTap=0;this.hurtT=-9;this.coverT=0;this.fragCD=6+R()*8;this.headAim=R();this.evSeen=0;this.smoothT=0;this.holdT=0;this.wantJump=0;this.lookT=0;this.lookYaw=null;this.slideCD=0;}
 setGoal(G,x,y,z,mode){this.goal={x,y,z};this.mode=mode;this.path=G.L.path(this.a.pos.x,this.a.pos.y,this.a.pos.z,x,y,z);this.pi=1;this.progT=0;if(!this.path){this.goal=null;}}
 arrived(r=1.2){if(!this.goal)return true;return Math.hypot(this.goal.x-this.a.pos.x,this.goal.z-this.a.pos.z)<r&&Math.abs(this.goal.y-this.a.pos.y)<1.4;}}

function canSee(G,a,b){const ex=a.pos.x,ey=a.pos.y+a.eyeH(),ez=a.pos.z;const L=G.L;for(const h of[b.pos.y+b.headH(),b.pos.y+1.0]){if(L.los(ex,ey,ez,b.pos.x,h,b.pos.z))return h;}return null;}
export{canSee};

function perceive(G,a,B){const df=G.diff;const fov=(B.tgt?170:df.fov)*.5*D2R;let best=null,bd=1e9;
 for(const e of G.actors){if(e===a||!e.alive||!G.enemies(a,e))continue;const dx=e.pos.x-a.pos.x,dz=e.pos.z-a.pos.z,dy=e.pos.y-a.pos.y,d=Math.hypot(dx,dz,dy);if(d>df.see&&e!==B.tgt)continue;
  const ang=Math.abs(angDiff(yawTo(dx,dz),a.yaw));const spotted=e.lastFire&&G.time-e.lastFire<.25&&d<df.hear;if(ang>fov&&d>3&&e!==B.tgt&&!spotted)continue;if(e.spawnProt>0&&e!==B.tgt&&R()<.5)continue;
  const h=canSee(G,a,e);if(h===null)continue;let sc=d+(e===B.tgt?-10:0)-(G.time-B.hurtT<2&&a.lastAttacker===e?14:0)+(e.isPlayer&&G.mode!=='tdm'?-2:0);if(sc<bd){bd=sc;best=e;}}
 if(best){if(best!==B.tgt){const fresh=G.time-B.seenT>1||!B.tgt;B.tgt=best;B.react=G.time+(fresh?df.react*(.75+R()*.5):df.react*.35);const er=df.err*(.7+R()*.6);const th=R()*6.28;B.ey=Math.cos(th)*er*D2R;B.ep=Math.sin(th)*er*.6*D2R;B.headAim=R();B.burstT=0;}
  B.seenT=G.time;B.last={x:best.pos.x,y:best.pos.y,z:best.pos.z};B.lastT=G.time;if(G.mode==='tdm')G.intel[a.team]={x:best.pos.x,y:best.pos.y,z:best.pos.z,t:G.time};}
 else if(B.tgt&&(G.time-B.seenT>.45||!B.tgt.alive)){B.tgt=null;}}
function hear(G,a,B){const df=G.diff;const ev=G.events;for(let i=ev.length-1;i>=0;i--){const e=ev[i];if(e.t<=B.evSeen)break;if(e.who===a||(e.team>=0&&e.team===a.team&&G.mode==='tdm'))continue;const r=e.kind==='shot'?df.hear:e.kind==='step'?df.hear*.3:df.hear*.7;
  const d=Math.hypot(e.x-a.pos.x,e.z-a.pos.z);if(d<r&&!B.tgt&&(G.time-B.lastT>1.5||!B.last)){B.last={x:e.x,y:e.y,z:e.z};B.lastT=G.time-.3;}}if(ev.length)B.evSeen=ev[ev.length-1].t;}

/* ---------------- tactical decisions (a few times a second) ---------------- */
function decide(G,a,B){const df=G.diff,L=G.L,g=a.gun();const cls=g?g.w.cls:'rifle';const hp=a.hp;
 // weapon management
 if(g&&g.mag===0&&g.res===0&&!g.w.melee){const other=a.slots.find((s,i)=>s&&i!==a.cur&&(s.mag>0||s.res>0||s.w.melee));if(other)G.switchTo(a,a.slots.indexOf(other));}
 if(B.tgt&&cls==='sniper'&&Math.hypot(B.tgt.pos.x-a.pos.x,B.tgt.pos.z-a.pos.z)<7&&a.slots[1])G.switchTo(a,1);
 if(!B.tgt&&a.cur===1&&a.slots[0]&&(a.slots[0].mag>0||a.slots[0].res>0)&&G.time-B.seenT>2)G.switchTo(a,0);
 if(!B.tgt&&g&&!g.w.melee&&g.mag<g.w.mag*.5&&g.res>0&&a.reloadT<=0&&G.time-B.seenT>1.2)G.reload(a);
 // cover: hurt or reloading under pressure
 const pressured=B.tgt&&(hp<40||(a.reloadT>0&&Math.hypot(B.tgt.pos.x-a.pos.x,B.tgt.pos.z-a.pos.z)>5));
 if(pressured&&B.mode!=='cover'&&R()<df.cover&&G.time>B.coverT){const c=findCover(G,a,B.tgt);if(c>=0){const n=L.node(c);B.setGoal(G,n.x,n.y,n.z,'cover');B.coverT=G.time+4;B.holdT=G.time+2.5+R()*2;return;}}
 if(B.mode==='cover'){if(B.arrived(.8)){a.ctl.crouch=R()<.6;if(G.time>B.holdT||hp>85){B.mode='roam';B.goal=null;}}else if(!B.path)B.mode='roam';return;}
 if(B.tgt){B.mode='fight';return;}
 // items: health when hurt, the power weapon when free
 if(hp<65||(!a.slots[2]&&R()<.5)){let best=null,bd=hp<65?34:24;for(const p of G.pickups){if(!p.active)continue;if(p.k==='hp'&&hp>=65)continue;if(p.k==='rl'&&a.slots[2])continue;if(p.k==='ammo'&&(!g||g.res>g.w.mag))continue;const d=Math.hypot(p.x-a.pos.x,p.z-a.pos.z)+Math.abs(p.y-a.pos.y)*2;if(d<bd){bd=d;best=p;}}
  if(best&&(!B.goal||B.mode!=='item'||Math.hypot(B.goal.x-best.x,B.goal.z-best.z)>1)){B.setGoal(G,best.x,best.y,best.z,'item');if(B.path)return;}}
 if(B.mode==='item'&&B.goal&&!B.arrived(.6))return;
 // known enemy position: chase or flank
 const intel=G.mode==='tdm'?G.intel[a.team]:null;const know=B.last&&G.time-B.lastT<6?B.last:intel&&G.time-intel.t<5?intel:null;
 if(know&&cls!=='sniper'){if(B.mode!=='chase'&&B.mode!=='flank'){if(R()<df.flank&&Math.hypot(know.x-a.pos.x,know.z-a.pos.z)>10){const f=flankPoint(G,a,know);if(f>=0){const n=L.node(f);B.setGoal(G,n.x,n.y,n.z,'flank');if(B.path)return;}}
   B.setGoal(G,know.x,know.y,know.z,'chase');if(B.path)return;}else if(B.arrived(1.5)){B.last=null;B.mode='roam';B.goal=null;}else return;}
 // frags at a recently lost target
 // roam
 if(!B.goal||B.arrived(1.5)||!B.path||B.mode!=='roam'){pickRoam(G,a,B,cls);}}

function findCover(G,a,e){const L=G.L,list=L.coverList;let best=-1,bs=1e9;const ex=e.pos.x,ey=e.pos.y+e.eyeH(),ez=e.pos.z;
 for(let k=0;k<26;k++){const n=list[(R()*list.length)|0];const x=L.nx[n],y=L.ny[n],z=L.nz[n];const d=Math.hypot(x-a.pos.x,z-a.pos.z);if(d>16||Math.abs(y-a.pos.y)>3)continue;const de=Math.hypot(x-ex,z-ez);if(de<6)continue;
  if(L.los(x,y+1.1,z,ex,ey,ez)||L.los(x,y+1.5,z,ex,ey,ez))continue;const s=d-de*.3+(de<Math.hypot(a.pos.x-ex,a.pos.z-ez)?6:0);if(s<bs){bs=s;best=n;}}return best;}
function flankPoint(G,a,k){const L=G.L;const dx=k.x-a.pos.x,dz=k.z-a.pos.z,d=Math.hypot(dx,dz)||1;const px=-dz/d,pz=dx/d;const side=R()<.5?-1:1;
 for(let t=0;t<6;t++){const s=side*(t%2?-1:1)*(9+R()*6);const x=k.x+px*s+dx/d*3,z=k.z+pz*s+dz/d*3;const n=L.nearestNode(x,k.y+.5,z,true);if(n>=0)return n;}return -1;}
function pickRoam(G,a,B,cls){const L=G.L;let x,y,z;
 if(cls==='sniper'&&R()<.7){for(let t=0;t<20;t++){const n=L.reachList[(R()*L.reachList.length)|0];if(L.ny[n]>2.5){x=L.nx[n];y=L.ny[n];z=L.nz[n];break;}}}
 if(x===undefined&&R()<.45&&G.pickups.length){const p=G.pickups[(R()*G.pickups.length)|0];x=p.x;y=p.y;z=p.z;}
 if(x===undefined&&G.mode==='tdm'&&R()<.6){// push toward the enemy half
  const es=L.spawns.filter(s=>s.team===1-a.team);const s=es[(R()*es.length)|0];const mx=(L.X0+L.X1)/2,mz=(L.Z0+L.Z1)/2;const t=.35+R()*.5;const n=L.nearestNode(mx+(s.x-mx)*t+(R()-.5)*14,1,mz+(s.z-mz)*t+(R()-.5)*14,true);if(n>=0){x=L.nx[n];y=L.ny[n];z=L.nz[n];}}
 if(x===undefined){// toward the action: other fighters, weighted to the nearest
  const others=G.actors.filter(o=>o!==a&&o.alive&&G.enemies(a,o));if(others.length&&R()<.55){const o=others[(R()*others.length)|0];const n=L.nearestNode(o.pos.x+(R()-.5)*12,o.pos.y+.5,o.pos.z+(R()-.5)*12,true);if(n>=0){x=L.nx[n];y=L.ny[n];z=L.nz[n];}}}
 if(x===undefined){const n=L.reachList[(R()*L.reachList.length)|0];x=L.nx[n];y=L.ny[n];z=L.nz[n];}
 B.setGoal(G,x,y,z,'roam');}

/* ---------------- per frame ---------------- */
export function think(G,a,dt){const B=a.brain,df=G.diff,c=a.ctl;c.fire=false;c.jump=false;c.ads=false;c.slide=false;c.mx=0;c.mz=0;if(B.mode!=='cover')c.crouch=false;
 if(a.hurtNow){a.hurtNow=false;B.hurtT=G.time;if(a.lastAttacker&&a.lastAttacker.alive&&!B.tgt){B.last={x:a.lastAttacker.pos.x,y:a.lastAttacker.pos.y,z:a.lastAttacker.pos.z};B.lastT=G.time;B.lookYaw=yawTo(a.lastAttacker.pos.x-a.pos.x,a.lastAttacker.pos.z-a.pos.z);B.lookT=G.time+.6;}}
 if((B.perT-=dt)<=0){B.perT=.08+R()*.06;perceive(G,a,B);hear(G,a,B);}
 if((B.thinkT-=dt)<=0){B.thinkT=.22+R()*.18;decide(G,a,B);}
 B.slideCD=Math.max(0,B.slideCD-dt);
 const g=a.gun();
 if(B.tgt&&B.tgt.alive){combat(G,a,B,dt,g);return;}
 // frag a lost target behind cover
 B.fragCD-=dt;if(B.last&&G.time-B.lastT<2.5&&G.time-B.lastT>.6&&B.fragCD<=0&&a.frags>0&&R()<.5){const d=Math.hypot(B.last.x-a.pos.x,B.last.z-a.pos.z);if(d>7&&d<26){G.throwFrag(a,B.last);B.fragCD=9+R()*10;}}
 steer(G,a,B,dt,1);aimIdle(G,a,B,dt);}

function combat(G,a,B,dt,g){const df=G.diff,c=a.ctl,t=B.tgt;const dx=t.pos.x-a.pos.x,dz=t.pos.z-a.pos.z,d=Math.hypot(dx,dz);const w=g?g.w:WPN.knife;const cls=w.cls;
 // converge aim error, choose head or chest, lead the target a little
 const conv=Math.exp(-dt*df.conv);B.ey*=conv;B.ep*=conv;const head=B.headAim<df.head+(d<8?.1:0)||cls==='sniper'&&B.headAim<df.head*1.8;
 const ty=t.pos.y+(head?t.headH():1.15-(t.crouchV||0)*.3);const lead=Math.min(.25,d/400+.05);const tx=t.pos.x+t.vel.x*lead,tz=t.pos.z+t.vel.z*lead;
 aimAt(a,tx,ty,tz,dt,df.turn*(cls==='sniper'?.8:1),df.comp,B.ey,B.ep);
 const vis=G.time-B.seenT<.15;
 // movement: hold a preferred range, strafe (ADAD), crouch-peek, jump, slide in
 const pref=PREF[cls]||18;B.strafeT-=dt;if(B.strafeT<=0){B.strafeT=.25+R()*(1.1-df.strafe*.7);if(R()<.7)B.strafeDir*=-1;if(R()<df.jump&&a.onGround)c.jump=true;}
 let fwd=0;if(d>pref*1.35)fwd=1;else if(d<pref*.55&&cls!=='shotgun'&&cls!=='knife')fwd=-.7;if(cls==='shotgun'||cls==='knife'||cls==='smg')fwd=d>pref?1:.2;
 const fx=dx/(d||1),fz=dz/(d||1),sx=-fz,sz=fx;let st=R()<df.strafe?B.strafeDir:B.strafeDir*.3;if(cls==='sniper'&&a.ctl.ads)st*=.25;
 if(!vis){fwd=1;st=0;}
 let mx=fx*fwd+sx*st,mz=fz*fwd+sz*st;
 // don't strafe off ledges or into walls
 const L=G.L,px=a.pos.x+mx*.9,pz=a.pos.z+mz*.9;const gnd=L.groundAt(px,pz,a.pos.y,.3);if(gnd<a.pos.y-1.2||L.blocked(px,pz,a.pos.y+.6,a.pos.y+1.4,.3)){B.strafeDir*=-1;mx=fx*fwd;mz=fz*fwd;const g2=L.groundAt(a.pos.x+mx*.9,a.pos.z+mz*.9,a.pos.y,.3);if(g2<a.pos.y-1.2){mx=0;mz=0;}}
 if(!vis&&B.last){steer(G,a,B,dt,1);}else{const l=Math.hypot(mx,mz);if(l>0){c.mx=mx/l;c.mz=mz/l;}}
 if(vis&&df.crouch>0&&(cls==='sniper'||cls==='lmg'||cls==='rifle')&&d>14){B.crouchT-=dt;if(B.crouchT<=0){B.crouchT=.6+R()*1.4;B.crouching=R()<df.crouch;}c.crouch=!!B.crouching;if(c.crouch){c.mx*=.5;c.mz*=.5;}}
 if((cls==='shotgun'||cls==='smg'||cls==='knife')&&d>4&&d<12&&a.onGround&&B.slideCD<=0&&R()<df.jump*3){c.slide=true;c.crouch=true;B.slideCD=3;c.mx=fx;c.mz=fz;}
 // ADS for longer shots
 if(vis&&g&&!w.melee&&(cls==='sniper'||d>(cls==='smg'||cls==='shotgun'?12:16)))c.ads=true;
 // fire control
 if(!vis||G.time<B.react||!g)return;if(w.melee){if(d<w.range*.9&&Math.abs(t.pos.y-a.pos.y)<1.5)G.melee(a);return;}
 if(g.mag<=0){if(g.res>0)G.reload(a);else if(a.cur!==1&&a.slots[1])G.switchTo(a,1);return;}
 const want=Math.atan2(.32,Math.max(1,d))+(cls==='shotgun'?.05:0);const ax=angErr(a,tx,ty,tz);
 if(cls==='sniper'&&(a.adsK||0)<.9)return;if(ax>want*(cls==='sniper'?1.1:1.8))return;
 if(w.auto){B.burstT-=dt;if(B.burstT<=0){if(B.pauseT>0){B.pauseT-=dt;return;}B.burstT=d>30?.25+R()*.2:d>15?.45+R()*.5:1.2+R();B.pauseT=d>15?df.tap*(1+R()):0;}c.fire=true;}
 else if(G.time>=B.nextTap){c.fire=true;B.nextTap=G.time+w.rate+df.tap*(.5+R())+(cls==='sniper'?.2:0);}}

function angErr(a,x,y,z){const dx=x-a.pos.x,dz=z-a.pos.z,dy=y-(a.pos.y+a.eyeH());const ty=yawTo(dx,dz),tp=Math.atan2(dy,Math.hypot(dx,dz));return Math.hypot(angDiff(ty,a.yaw+a.recoil.x*D2R),tp-(a.pitch+a.recoil.y*D2R));}
function aimAt(a,x,y,z,dt,turn,comp=0,ey=0,ep=0){const dx=x-a.pos.x,dz=z-a.pos.z,dy=y-(a.pos.y+a.eyeH());const ty=yawTo(dx,dz)+ey,tp=Math.atan2(dy,Math.hypot(dx,dz))+ep;
 const wy=ty-a.recoil.x*D2R*comp,wp=tp-a.recoil.y*D2R*comp;const max=turn*D2R*dt;const dyaw=angDiff(wy,a.yaw),dp=wp-a.pitch;const k=Math.min(1,dt*14);a.yaw+=cl(dyaw*k*1.5,-max,max);a.pitch=cl(a.pitch+cl(dp*k*1.5,-max,max),-1.4,1.4);}
function aimIdle(G,a,B,dt){const df=G.diff;let ty=null,tp=0;
 if(B.lookYaw!==null&&G.time<B.lookT){ty=B.lookYaw;}
 else if(B.last&&G.time-B.lastT<3){const dx=B.last.x-a.pos.x,dz=B.last.z-a.pos.z;ty=yawTo(dx,dz);tp=Math.atan2(B.last.y+1.3-(a.pos.y+a.eyeH()),Math.hypot(dx,dz));}
 else if(B.path&&B.pi<B.path.length){const p=B.path[Math.min(B.path.length-1,B.pi+1)];const dx=p.x-a.pos.x,dz=p.z-a.pos.z;if(Math.hypot(dx,dz)>.3){ty=yawTo(dx,dz);tp=Math.atan2(p.y+1.4-(a.pos.y+a.eyeH()),Math.hypot(dx,dz))*.5;}}
 if(ty===null)return;const max=df.turn*.55*D2R*dt;a.yaw+=cl(angDiff(ty,a.yaw)*Math.min(1,dt*6),-max,max);a.pitch+=cl((tp-a.pitch)*Math.min(1,dt*5),-max,max);}

function steer(G,a,B,dt,speed){const c=a.ctl,L=G.L;if(!B.path||B.pi>=B.path.length){B.path=null;return;}
 // smoothing: skip ahead when a straight walk is clear
 B.smoothT-=dt;if(B.smoothT<=0){B.smoothT=.35;for(let k=Math.min(B.path.length-1,B.pi+5);k>B.pi;k--){const p=B.path[k];let ok=true;for(let j=B.pi;j<=k;j++)if(B.path[j].t!==1){ok=false;break;}if(!ok)continue;if(Math.abs(p.y-a.pos.y)<.6&&L.walkLine(a.pos.x,a.pos.y,a.pos.z,p.x,p.y,p.z)){B.pi=k;break;}}}
 const p=B.path[B.pi];const dx=p.x-a.pos.x,dz=p.z-a.pos.z,dh=Math.hypot(dx,dz);
 if(dh<.5&&Math.abs(p.y-a.pos.y)<1.2){B.pi++;if(B.pi>=B.path.length){B.path=null;return;}return steer(G,a,B,0,speed);}
 c.mx=dx/(dh||1)*speed;c.mz=dz/(dh||1)*speed;
 const nx=B.path[B.pi];if(nx.t===2&&dh<1.6&&a.onGround)c.jump=true;
 // stuck detection
 B.progT+=dt;if(B.progT>.9){const moved=Math.hypot(a.pos.x-B.lp.x,a.pos.z-B.lp.z);B.lp.x=a.pos.x;B.lp.z=a.pos.z;B.progT=0;if(moved<.35){B.stuckT++;if(a.onGround)c.jump=true;if(B.stuckT>=2&&B.goal){B.stuckT=0;B.setGoal(G,B.goal.x,B.goal.y,B.goal.z,B.mode);if(!B.path){B.goal=null;B.mode='roam';}}}else B.stuckT=0;}}
