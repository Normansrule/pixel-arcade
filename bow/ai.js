// LONGBOW KEEP — CPU soldiers: roles (attack / defend / midfield), flag logic (take, carry, escort, return, hunt the carrier), retreat,
// A* pathing over the nav graph (ladders, wall walks), ballistic aim that leads moving targets, sword duels with blocking, bomb pots.
const V=(x=0,y=0,z=0)=>({x,y,z});
export const DIFF=[
 {n:'SQUIRE',react:.8,err:.055,lead:.35,turn:4.5,draw:.78,strafe:.25,hs:0,block:.12,see:55,fov:.35,bomb:.2},
 {n:'KNIGHT',react:.45,err:.026,lead:.78,turn:8,draw:.88,strafe:.6,hs:.2,block:.45,see:78,fov:.1,bomb:.45},
 {n:'WARLORD',react:.24,err:.013,lead:.97,turn:12,draw:.95,strafe:.9,hs:.45,block:.75,see:95,fov:-.15,bomb:.7}];
const rnd=Math.random,dist2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),dist3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};

// Ballistic launch solve (low arc) with iterative target leading. Returns {yaw,pitch,t} or null when out of range.
export function solveAim(from,target,tv,speed,g,lead){let tx=target.x,ty=target.y,tz=target.z,ang=0,t=0,ok=true;
 for(let i=0;i<3;i++){const dx=tx-from.x,dz=tz-from.z,dy=ty-from.y,d=Math.max(.01,Math.hypot(dx,dz)),v2=speed*speed,disc=v2*v2-g*(g*d*d+2*dy*v2);
  if(disc<0){ang=Math.PI/4;ok=false;}else{ang=g<1e-3?Math.atan2(dy,d):Math.atan((v2-Math.sqrt(disc))/(g*d));ok=true;}t=d/(speed*Math.cos(ang));
  tx=target.x+tv.x*t*lead;tz=target.z+tv.z*t*lead;ty=target.y+(tv.y>0?0:0);}
 const dx=tx-from.x,dz=tz-from.z;return{yaw:Math.atan2(-dx,-dz),pitch:ang,t,ok};}

export function initBot(b,role){b.ai={lane:null,role,goal:null,goalKind:'',path:null,pi:0,replan:0,decide:rnd()*.3,target:null,seen:0,react:0,errY:0,errP:0,aimT:0,stuck:0,lastP:{x:b.pos.x,z:b.pos.z},stuckChk:1,strafeT:0,strafe:1,
 swingCD:0,blockT:0,bombCD:6+rnd()*8,throwing:0,spot:null,spotT:0,want:'bow',release:0,jumpCD:0,dodgeT:0};}

/* ---------------- goal selection ---------------- */
function chooseGoal(b,G){const ai=b.ai,me=b.team,F=G.flags,my=F[me],en=F[1-me],home=G.homes[me];
 const mates=G.players.filter(p=>p.team===me&&p.alive&&p!==b);const rank=(pos)=>mates.filter(m=>dist3(m.pos,pos)<dist3(b.pos,pos)).length;
 const dirE=me===0?1:-1;// +z is toward CRIMSON
 const viaLane=(dir,goal)=>{const L=ai.lane;if(!L)return goal;const prog=(b.pos.z-L.z)*dir;if(prog<-4&&Math.abs(b.pos.z-goal.z)>30)return L;return goal;};
 if(b.carrying){if(my.state!=='home'&&my.state==='carried'&&my.carrier&&dist3(my.carrier.pos,b.pos)<26)return['hunt',my.carrier.pos];return['cap',viaLane(-dirE,home)];}
 if(my.state==='dropped'&&(rank(my.pos)<2||dist3(b.pos,my.pos)<30))return['return',my.pos];
 if(my.state==='carried'&&my.carrier&&(rank(my.carrier.pos)<2||ai.role==='defend'||dist3(b.pos,my.carrier.pos)<30))return['hunt',my.carrier.pos];
 if(en.state==='dropped'&&(rank(en.pos)<2||dist3(b.pos,en.pos)<40))return['take',en.pos];
 const carrier=en.state==='carried'?en.carrier:null;
 if(carrier&&carrier!==b&&ai.role!=='defend'&&dist3(b.pos,carrier.pos)<55){const h=home;const dx=h.x-carrier.pos.x,dz=h.z-carrier.pos.z,l=Math.hypot(dx,dz)||1;ai.esc=ai.esc||{x:0,y:0,z:0};
  const side=(b.id%2?1:-1)*2.5;ai.esc.x=carrier.pos.x-dx/l*3+(-dz/l)*side;ai.esc.y=carrier.pos.y;ai.esc.z=carrier.pos.z-dz/l*3+(dx/l)*side;return['escort',ai.esc];}
 if(b.hp<38&&ai.role!=='attack')return['retreat',home];
 if(ai.role==='attack')return['take',en.state==='home'?viaLane(dirE,en.pos):en.pos];
 // defend / midfield: hold a spot for a while
 ai.spotT-=.25;if(!ai.spot||ai.spotT<=0){const L=ai.role==='defend'?G.spots[me].def:G.spots[me].mid;ai.spot=L[(rnd()*L.length)|0];ai.spotT=12+rnd()*14;}
 return[ai.role==='defend'?'guard':'hold',ai.spot];}

/* ---------------- perception ---------------- */
const eye=V(),tp=V(),tmp=V();
function eyeOf(p,o){o.x=p.pos.x;o.y=p.pos.y+1.55;o.z=p.pos.z;return o;}
function pickTarget(b,G,D,range){const ai=b.ai;let best=null,bs=-1e9;eyeOf(b,eye);const fx=-Math.sin(b.yaw),fz=-Math.cos(b.yaw);
 for(const e of G.players){if(e.team===b.team||!e.alive||e.spawnProt>0)continue;const d=dist3(e.pos,b.pos);if(d>D.see||(d>range&&!e.carrying&&e!==ai.target))continue;const dx=(e.pos.x-b.pos.x)/(d||1),dz=(e.pos.z-b.pos.z)/(d||1);
  const facing=dx*fx+dz*fz;if(d>9&&facing<D.fov&&e!==ai.target)continue;tp.x=e.pos.x;tp.y=e.pos.y+1.25;tp.z=e.pos.z;if(!G.W.los(eye,tp)){tp.y=e.pos.y+1.65;if(!G.W.los(eye,tp))continue;}
  let s=-d;if(e.carrying)s+=60;if(e===ai.target)s+=12;if(d<6)s+=20;s-=e.hp*.08;if(s>bs){bs=s;best=e;}}
 return best;}

/* ---------------- main think ---------------- */
export function think(b,G,dt){const ai=b.ai,D=G.diff,inp=b.inp,W=G.W;if(G.idleTeam===3)return;inp.f=0;inp.s=0;inp.jump=false;inp.sprint=false;inp.alt=false;inp.slot=null;inp.bomb=false;
 if(!b.alive)return;if(G.idleTeam===b.team||G.idleTeam===2){inp.fire=false;return;}
 ai.decide-=dt;ai.replan-=dt;ai.swingCD-=dt;ai.bombCD-=dt;ai.jumpCD-=dt;ai.strafeT-=dt;
 if(ai.decide<=0){ai.decide=.25+rnd()*.1;const[k,g]=chooseGoal(b,G);if(k!==ai.goalKind||!ai.goal||dist3(ai.goal,g)>3.5){ai.goalKind=k;ai.goal={x:g.x,y:g.y,z:g.z};ai.replan=0;}
  const urgent=ai.goalKind==='take'||ai.goalKind==='cap'||ai.goalKind==='return'||ai.goalKind==='hunt';const t=pickTarget(b,G,D,urgent?30:D.see);if(t!==ai.target){ai.target=t;ai.react=D.react*(.7+rnd()*.6);ai.aimT=0;const e=D.err*(1+rnd());ai.errY=(rnd()-.5)*2*e;ai.errP=(rnd()-.5)*2*e;ai.head=rnd()<D.hs;}}
 const T=ai.target&&ai.target.alive?ai.target:null;if(!T)ai.target=null;
 // ---------- movement along the path ----------
 let mx=0,mz=0,want=0,ladderFace=null;
 if(ai.goal){if(ai.replan<=0||!ai.path){ai.replan=1.2+rnd()*.6;const a=G.nav.nearest(b.pos.x,b.pos.y,b.pos.z,5),z=G.nav.nearest(ai.goal.x,ai.goal.y,ai.goal.z,6);ai.path=G.nav.path(a,z);ai.pi=0;if(!ai.path&&ai.goalKind!=='unstick'){const f=G.flags[1-b.team].pos,h=G.homes[b.team];const g2=b.carrying?h:f;ai.path=G.nav.path(a,G.nav.nearest(g2.x,g2.y,g2.z,6));}
   if(ai.path&&ai.path.length>1){// skip the first node if we're already past it
    const p0=ai.path[0],p1=ai.path[1];if(dist2(b.pos,p1)<dist2(p0,p1))ai.pi=1;}}
  const P=ai.path;let node=P&&P[ai.pi];
  while(node){const lad=node.tag==='lb'&&P[ai.pi+1]&&P[ai.pi+1].tag==='lt';const r=lad?.55:1.15;if(dist2(b.pos,node)<r&&Math.abs(b.pos.y-node.y)<(lad?1:2.2)){ai.pi++;node=P[ai.pi];}else break;}
  if(node&&!ai.chop){// the planned route goes through a barricade (no detour was short enough): hack it down once we reach it
   for(const[u,v]of[[P[ai.pi-1],node],[node,P[ai.pi+1]]]){const e=u&&v&&G.nav.edge(u,v),o=e&&e[3];if(o&&!o.dead&&Math.hypot(Math.max(o.x0-b.pos.x,0,b.pos.x-o.x1),Math.max(o.z0-b.pos.z,0,b.pos.z-o.z1))<2.2){ai.chop=o;break;}}}
  if(node){const prev=P[ai.pi-1];if(prev&&prev.tag==='lb'&&node.tag==='lt'){const l=prev.ladder;ladderFace=l;mx=-l.nx;mz=-l.nz;want=1;}else{mx=node.x-b.pos.x;mz=node.z-b.pos.z;want=1;}}
  else if(dist2(b.pos,ai.goal)>1.4){mx=ai.goal.x-b.pos.x;mz=ai.goal.z-b.pos.z;want=1;}
  const ml=Math.hypot(mx,mz);if(ml>0){mx/=ml;mz/=ml;}}
 if(b.ladder){// keep climbing toward the top node
  const l=b.ladder;mx=-l.nx;mz=-l.nz;want=1;ladderFace=l;}
 // ---------- combat ----------
 const near=T?dist3(T.pos,b.pos):1e9;let aimYaw=null,aimPitch=0;
 const dash=(ai.goalKind==='take'||ai.goalKind==='return')&&ai.goal&&dist3(b.pos,ai.goal)<(ai.goalKind==='take'?34:22)&&!G.W.solidAt(ai.goal.x,ai.goal.y+1,ai.goal.z);
 const busy=(ai.goalKind==='cap'&&near>4)||(dash&&near>2.5)||(ai.goalKind==='take'&&ai.role==='attack'&&T&&near>10&&!T.carrying);
 if(T&&!busy){ai.aimT+=dt;ai.react-=dt;
  if(near<3.4||(b.weapon==='sword'&&near<6)||(b.ammo<=0&&near<30)){// sword duel
   if(b.weapon!=='sword')inp.slot='sword';const dx=T.pos.x-b.pos.x,dz=T.pos.z-b.pos.z;aimYaw=Math.atan2(-dx,-dz);aimPitch=Math.atan2(T.pos.y-b.pos.y,near)*.5;
   if(near>1.9){mx=dx/near;mz=dz/near;want=1;}else{mx=-dz/near*ai.strafe*.6;mz=dx/near*ai.strafe*.6;want=.5;}
   if(ai.strafeT<=0){ai.strafeT=.8+rnd();ai.strafe=-ai.strafe;}
   const threat=T.swing>0&&T.swing<.35&&near<3.2;if(threat&&rnd()<D.block*dt*12)ai.blockT=.45;
   ai.blockT-=dt;inp.alt=ai.blockT>0;if(near<2.7&&ai.swingCD<=0&&ai.react<=0&&!inp.alt){inp.fire=true;ai.swingCD=.5+rnd()*.5;}else inp.fire=false;}
  else if(b.bombs>0&&ai.bombCD<=0&&near>7&&near<24&&(T.carrying||rnd()<D.bomb*.04)&&!b.carrying){// lob a fire pot
   if(b.weapon!=='bomb')inp.slot='bomb';const s=solveAim(eyeOf(b,eye),{x:T.pos.x,y:T.pos.y+.4,z:T.pos.z},T.vel,G.BOMB.speed,G.BOMB.g,D.lead*.8);aimYaw=s.yaw+ai.errY;aimPitch=s.pitch+ai.errP;
   if(b.weapon==='bomb'){ai.throwing+=dt;inp.fire=ai.throwing<.6;if(ai.throwing>=.6){ai.throwing=0;ai.bombCD=9+rnd()*10;}}}
  else if(b.ammo>0){if(b.weapon!=='bow')inp.slot='bow';const w=G.WPN[b.loadout];
   tp.x=T.pos.x;tp.z=T.pos.z;tp.y=T.pos.y+(ai.head?1.66:1.2);const s=solveAim(eyeOf(b,eye),tp,T.vel,w.spd[1]*(b.loadout==='cross'?1:D.draw),w.g,D.lead);
   const shrink=Math.max(.3,1-ai.aimT*.6),mov=Math.min(2.4,1+Math.hypot(T.vel.x,T.vel.z)*.16),rng=1+near/28;aimYaw=s.yaw+ai.errY*shrink*mov*rng;aimPitch=s.pitch+ai.errP*shrink*mov*rng;
   const settled=Math.abs(wrap(aimYaw-b.yaw))<.03+.2/(near+2)&&Math.abs(aimPitch-b.pitch)<.04;
   if(b.loadout==='cross'){inp.fire=b.loaded&&settled&&ai.react<=0&&ai.aimT>.25;}
   else{const need=Math.min(1,D.draw*(near<18?.8:1));if(ai.release>0){ai.release-=dt;inp.fire=false;}else if(b.draw>=need&&settled&&ai.react<=0){inp.fire=false;ai.release=.12+rnd()*.25;}else inp.fire=true;}
   // footwork while shooting
   const push=ai.goalKind==='take'||ai.goalKind==='return'||ai.goalKind==='hunt'||ai.goalKind==='escort';
   if(push&&near>14&&!T.carrying){want=Math.max(want,.9);}
   else if(!b.carrying){if(ai.strafeT<=0){ai.strafeT=.7+rnd()*1.4;ai.strafe=rnd()<.5?-1:1;}
    if(rnd()<D.strafe){const sx=-Math.sin(aimYaw),sz=-Math.cos(aimYaw);const rx=-sz*ai.strafe,rz=sx*ai.strafe;tmp.x=b.pos.x+rx*1.6;tmp.z=b.pos.z+rz*1.6;
     if(W.groundAt(tmp.x,tmp.z,b.pos.y+1)>b.pos.y-1.5){mx=rx;mz=rz;want=.8;}else ai.strafe*=-1;}else if(ai.goalKind==='guard'||ai.goalKind==='hold'||ai.goalKind==='retreat')want=0;else want*=.5;}}
  else{inp.fire=false;}}
 else{// no target: cancel any draw, carry the bow
  inp.fire=false;if(b.weapon==='bow'&&b.draw>0)inp.alt=true;ai.blockT=0;
  if(b.weapon!=='bow'&&b.ammo>0&&!(b.weapon==='sword'&&ai.swingCD>-1))inp.slot='bow';
  if(b.weapon==='sword'&&b.ammo<=0)inp.slot=null;}
 // ---------- stuck handling ----------
 ai.stuckChk-=dt;if(ai.stuckChk<=0){const moved=Math.hypot(b.pos.x-ai.lastP.x,b.pos.z-ai.lastP.z);ai.stuckChk=.8;if(want>.5&&moved<.35&&!b.ladder){ai.stuck++;if(ai.stuck>=1&&ai.jumpCD<=0){inp.jump=true;ai.jumpCD=.6;}
   if(ai.stuck>=3){// boxed in by a barricade with no route at all: chop it; otherwise try another route
    const blk=G.dynNear(b.pos,2.6);if(blk&&!ai.path)ai.chop=blk;ai.path=null;ai.replan=0;ai.pi=0;if(ai.stuck>5){ai.stuck=0;ai.goal={x:b.pos.x+(rnd()-.5)*10,y:b.pos.y,z:b.pos.z+(rnd()-.5)*10};ai.goalKind='unstick';ai.decide=1.5;}}}else ai.stuck=0;ai.lastP.x=b.pos.x;ai.lastP.z=b.pos.z;}
 if(ai.chop){if(ai.chop.dead||dist2(b.pos,{x:(ai.chop.x0+ai.chop.x1)/2,z:(ai.chop.z0+ai.chop.z1)/2})>4)ai.chop=null;else if(!T||near>12){inp.slot=b.weapon==='sword'?null:'sword';const cx=(ai.chop.x0+ai.chop.x1)/2,cz=(ai.chop.z0+ai.chop.z1)/2;aimYaw=Math.atan2(-(cx-b.pos.x),-(cz-b.pos.z));aimPitch=-.1;mx=cx-b.pos.x;mz=cz-b.pos.z;const l=Math.hypot(mx,mz)||1;mx/=l;mz/=l;want=.6;if(ai.swingCD<=0&&b.weapon==='sword'){inp.fire=true;ai.swingCD=.5;}else if(b.weapon==='sword')inp.fire=false;}}
 // sky islands: never walk off an edge on purpose
 if(want>0&&!ladderFace&&W.voidY>-100){tmp.x=b.pos.x+mx*1.2;tmp.z=b.pos.z+mz*1.2;if(W.groundAt(tmp.x,tmp.z,b.pos.y+1)<b.pos.y-6&&!(ai.path&&ai.path[ai.pi]&&ai.path[ai.pi].y<b.pos.y-1)){want=0;ai.replan=0;}}
 // ---------- look + convert world move dir into input ----------
 const moveYaw=want>0?Math.atan2(-mx,-mz):b.yaw;let ty=aimYaw!==null?aimYaw:ladderFace?Math.atan2(ladderFace.nx,ladderFace.nz):moveYaw,tpch=aimYaw!==null?aimPitch:ladderFace?.5:(b.carrying?0:-.05);
 const turn=D.turn*(aimYaw!==null?1:.8)*dt;const dyaw=wrap(ty-b.yaw);inp.yaw=b.yaw+Math.max(-turn,Math.min(turn,dyaw));inp.pitch=b.pitch+Math.max(-turn,Math.min(turn,tpch-b.pitch));
 if(want>0){const fx=-Math.sin(inp.yaw),fz=-Math.cos(inp.yaw),rx=Math.cos(inp.yaw),rz=-Math.sin(inp.yaw);inp.f=(mx*fx+mz*fz)*want;inp.s=(mx*rx+mz*rz)*want;if(ladderFace)inp.f=1;
  inp.sprint=aimYaw===null&&want>.9&&b.draw===0;}
 if(T&&near<26&&ai.dodgeT<=0&&rnd()<D.strafe*.004){inp.jump=true;ai.dodgeT=2;}ai.dodgeT-=dt;}
