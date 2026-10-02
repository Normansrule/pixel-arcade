// TUMBLE ROYALE — CPU contestants: racing lines, look-ahead hazard timing (jump / wait), door guessing, see-saw balancing,
// tail chasing, ball pushing and hex-tile picking — with per-difficulty reaction noise and deliberate mistakes.
import * as THREE from '../vendor/three.module.min.js';
import {contact,SPH,R,G as GRAV} from './physics.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a,cl=(v,a,b)=>v<a?a:v>b?b:v;
export const DIFF=[
 {n:'EASY',speed:.83,react:.16,miss:.3,hes:.14,wob:.6,door:.35,grab:.35,bal:.15,jumpy:.2},
 {n:'NORMAL',speed:.915,react:.08,miss:.13,hes:.06,wob:.4,door:.62,grab:.7,bal:.55,jumpy:.12},
 {n:'HARD',speed:.97,react:.035,miss:.045,hes:.02,wob:.22,door:.9,grab:1,bal:.95,jumpy:.06}];
const tgt=new V(),pp=new V(),tv=new V(),KS=[.1,.2,.3,.42,.56,.7];

export function initBot(b,d){b.ai={lane:rnd(1.5)-.75,laneT:1+rnd(3),senseT:rnd(.08),wait:0,hes:0,stuckT:0,lastP:b.p.clone(),door:[],ign:new Map(),wp:null,wpT:0,lead:.24,chase:null,chaseT:0,tile:null,tileT:0,grabT:0,role:b.id%4===0?'def':'att',danger:null};
 b.speed=d.speed*(.97+rnd(.06));}

// look ahead along the bean's current motion for moving hazards: returns {k (seconds), m (mover)} for the soonest hit
function sense(b,W,t){let res=null;const vx=b.v.x,vz=b.v.z,vy=b.ground?0:b.v.y;
 for(const m of W.movers){if(!m.danger)continue;const dx=m.c.x-b.p.x,dz=m.c.z-b.p.z,dy=m.c.y-b.p.y,rr=m.R+8;if(dx*dx+dz*dz>rr*rr||dy>6||dy<-4)continue;
  for(const k of KS){if(res&&k>=res.k)break;m.pose(t+k,m.scr);m.scr.qi.copy(m.scr.q).invert();pp.set(b.p.x+vx*k,b.p.y+(b.ground?0:vy*k-GRAV*k*k/2),b.p.z+vz*k);let hit=false;
   for(let s=0;s<3&&!hit;s++){tv.set(pp.x,pp.y+SPH[s],pp.z);if(contact(m.scr,tv,R+.12))hit=true;}
   if(hit){res={k,m};break;}}}
 return res;}

function steer(b,x,z,thr=1){const dx=x-b.p.x,dz=z-b.p.z,d=Math.hypot(dx,dz);if(d<.05){b.ctrl.x=b.ctrl.z=0;return 0;}const k=thr*Math.min(1,d/.8);b.ctrl.x=dx/d*k;b.ctrl.z=dz/d*k;return d;}

export function think(b,Rd,Gs,dt){const k=b.ctrl,ai=b.ai,d=Gs.diff,t=Gs.t;k.jump=false;k.dive=false;k.grab=false;
 if(b.finished){// victory lap: drift forward then celebrate
  if(!ai.cel)ai.cel={x:b.p.x+rnd(6)-3,z:b.p.z+3+rnd(5)};if(steer(b,ai.cel.x,ai.cel.z,.5)<.6){k.x=k.z=0;b.cele=true;if(b.ground&&Math.random()<dt*.8)k.jump=true;}return;}
 if(b.state==='rag'||b.out||b.frozen){k.x=k.z=0;return;}
 ai.laneT-=dt;if(ai.laneT<=0){ai.laneT=1.5+rnd(3);ai.lane=cl(ai.lane+(rnd(2)-1)*d.wob,-.85,.85);}
 if(ai.hes>0){ai.hes-=dt;k.x=k.z=0;return;}if(Math.random()<d.hes*dt&&Rd.kind!=='final')ai.hes=.25+rnd(.4);
 const kind=Rd.kind;
 if(kind==='race'){if(Rd.rows&&Rd.rows[0].doors)doorNav(b,Rd,Gs);else raceNav(b,Rd,Gs);}
 else if(kind==='tail')tailNav(b,Rd,Gs,dt);else if(kind==='survival')skipNav(b,Rd,Gs,dt);else if(kind==='team')ballNav(b,Rd,Gs);else if(kind==='final')hexNav(b,Rd,Gs,dt);else if(kind==='lobby'){lobbyNav(b,Rd,Gs,dt);return;}
 // hazards: jump the low ones, wait out the tall ones
 if(ai.wait>0){ai.wait-=dt;k.x*=-.25;k.z*=-.25;}
 if((ai.senseT-=dt)<=0){ai.senseT=.06;const h=sense(b,Rd.W,t);ai.danger=h;
  if(h){let dec=ai.ign.get(h.m);if(!dec||t>dec.until){dec={until:t+1.3,ig:Math.random()<d.miss};ai.ign.set(h.m,dec);ai.lead=cl(.24+(rnd(2)-1)*d.react*2.2,.04,.5);}
   if(!dec.ig){if(h.m.danger==='low'){if(b.ground&&h.k<=ai.lead+.04)k.jump=true;}else if(h.m.danger==='tall'&&h.k<.5&&kind!=='team'){ai.wait=.18+rnd(.2);}}}}
 // stuck: barely moving while trying to -> hop and change lane
 const mv=Math.hypot(k.x,k.z);if(mv>.5&&b.ground&&Math.hypot(b.v.x-b.gv.x,b.v.z-b.gv.z)<1.2){ai.stuckT+=dt;if(ai.stuckT>1.1){ai.stuckT=0;if(kind!=='survival'&&kind!=='final')k.jump=true;ai.lane=-ai.lane||rnd(1.4)-.7;ai.door.length=0;}}else ai.stuckT=Math.max(0,ai.stuckT-dt);
 if(kind!=='survival'&&kind!=='final'&&kind!=='team'&&b.ground&&Math.random()<d.jumpy*dt)k.jump=true;}

function raceNav(b,Rd,Gs){const ai=b.ai,path=Rd.path;let n=path[path.length-1];for(const p of path){if(p.z>b.p.z+.5){n=p;break;}}
 let x=n.x||0;if(n.row!==undefined){const row=Rd.rows[n.row];const bd=row.boards.length>1?row.boards[ai.lane>0?1:0]:row.boards[0];x=bd.x;
  const sw=bd.sw;if(b.gcol===sw.col&&Math.abs(sw.ang)>.04)x+=Math.sign(sw.ang)*Math.min(bd.w/2-1.2,1+Math.abs(sw.ang)*8)*Gs.diff.bal;else x+=ai.lane*n.w;}
 else x+=ai.lane*n.w;
 // drift around a bean that is right in front
 steer(b,x,n.z+1.5);
 if(Rd.finishZ&&Math.abs(Rd.finishZ-b.p.z)<3.2&&b.p.z<Rd.finishZ&&b.ground&&Math.random()<Gs.diff.grab*.03)b.ctrl.dive=true;
 if(Gs.t>4&&Math.random()<.002*Gs.diff.grab){for(const o of Gs.beans){if(o===b||o.out)continue;const dx=o.p.x-b.p.x,dz=o.p.z-b.p.z;if(dx*dx+dz*dz<1.4&&dz>0){ai.grabT=.6;break;}}}
 if(ai.grabT>0){ai.grabT-=1/120;b.ctrl.grab=true;}}

function doorNav(b,Rd,Gs){const ai=b.ai,rows=Rd.rows,dd=Gs.diff;let ri=rows.findIndex(r=>r.z>b.p.z-.4);if(ri<0){steer(b,ai.lane*6,Rd.finishZ+6);return;}
 const row=rows[ri];let d=ai.door[ri];ai.dT=(ai.dT||0)-1/60;const chk=ai.dT<=0;if(chk)ai.dT=.25;const bad=d&&!d.broken&&(b.lastFake===d||chk&&d.knownFake&&Math.random()<dd.door*.5);
 if(!d||bad){const broken=row.doors.filter(x=>x.broken);
  if(broken.length&&Math.random()<dd.door)d=broken.reduce((a,x)=>Math.abs(x.x-b.p.x)<Math.abs(a.x-b.p.x)?x:a);
  else{let cand=row.doors.filter(x=>x!==b.lastFake&&(!x.knownFake||Math.random()>dd.door));if(!cand.length)cand=row.doors.filter(x=>x!==b.lastFake);cand.sort((a,c)=>Math.abs(a.x-b.p.x)-Math.abs(c.x-b.p.x));d=cand[Math.min(cand.length-1,Math.random()*Math.min(3,cand.length)|0)];}
  ai.door[ri]=d;}
 else if(chk&&!d.broken&&Math.random()<.15){const broken=row.doors.filter(x=>x.broken);if(broken.length&&Math.random()<dd.door*.5)ai.door[ri]=broken[Math.random()*broken.length|0];}
 const dz=row.z-b.p.z;steer(b,d.x+ai.lane*.4,dz>1.2?row.z-.3:row.z+3);}

function inArena(Rd,x,z,m){const c=Rd.center,dx=x-c.x,dz=z-c.z,dd=Math.hypot(dx,dz),lim=(Rd.radius||12)-m;if(dd>lim){tgt.set(c.x+dx/dd*lim,0,c.z+dz/dd*lim);return tgt;}return tgt.set(x,0,z);}
function tailNav(b,Rd,Gs,dt){const ai=b.ai,c=Rd.center;
 if(b.tail){let best=null,bd=1e9;for(const o of Gs.beans){if(o===b||o.out||o.tail)continue;const dd=o.p.distanceToSquared(b.p);if(dd<bd){bd=dd;best=o;}}
  if(best&&bd<64){tv.subVectors(b.p,best.p).setY(0).normalize();const side=Math.sin(Gs.t*.7+b.id)*.8;const tx=b.p.x+(tv.x+tv.z*side)*5,tz=b.p.z+(tv.z-tv.x*side)*5;const p=inArena(Rd,tx,tz,3);steer(b,p.x,p.z);
   if(bd<3&&b.ground&&Math.random()<dt*2.2)b.ctrl.jump=true;}
  else wander(b,Rd,Gs,dt,10);}
 else{if(!ai.chase||ai.chase.out||!ai.chase.tail||(ai.chaseT-=dt)<0){let best=null,bd=1e9;for(const o of Gs.beans){if(o===b||o.out||!o.tail)continue;const dd=o.p.distanceToSquared(b.p)+rnd(30);if(dd<bd){bd=dd;best=o;}}ai.chase=best;ai.chaseT=1.5+rnd(2);}
  const o=ai.chase;if(!o){wander(b,Rd,Gs,dt,10);return;}const p=inArena(Rd,o.p.x+o.v.x*.35,o.p.z+o.v.z*.35,1.5);const dd=steer(b,p.x,p.z);
  if(dd<1.6){if(Math.random()<Gs.diff.grab*dt*6||ai.grabT>0){ai.grabT=ai.grabT>0?ai.grabT-dt:.7;b.ctrl.grab=true;}}else ai.grabT=0;
  if(dd>2.2&&dd<4.5&&b.ground&&Math.random()<dt*.25)b.ctrl.dive=true;}}
function wander(b,Rd,Gs,dt,r){const ai=b.ai,c=Rd.center;if(!ai.wp||(ai.wpT-=dt)<0||ai.wp.distanceTo(b.p)<1){const a=rnd(6.283),d=Math.sqrt(Math.random())*r;ai.wp=new V(c.x+Math.sin(a)*d,0,c.z+Math.cos(a)*d);ai.wpT=2+rnd(3);}
 steer(b,ai.wp.x,ai.wp.z,.75);}
function skipNav(b,Rd,Gs,dt){const ai=b.ai,c=Rd.center,sr=Rd.safeR(Gs.pt+2)-1.4;if(!ai.wp||(ai.wpT-=dt)<0||ai.wp.distanceTo(b.p)<.8||Math.hypot(ai.wp.x-c.x,ai.wp.z-c.z)>sr){const a=rnd(6.283),d=3.2+rnd(Math.max(.5,sr-3.2));ai.wp=new V(c.x+Math.sin(a)*d,0,c.z+Math.cos(a)*d);ai.wpT=1.5+rnd(3);}
 steer(b,ai.wp.x,ai.wp.z,.55);}
function ballNav(b,Rd,Gs){const ai=b.ai,c=Rd.center,dir=b.team===0?1:-1,gz=c.z+dir*(Rd.Z+3);
 if(!ai.ball||Math.random()<.004){const bs=Rd.balls;ai.ball=bs[(b.id+(Math.random()<.25?1:0))%bs.length];}let ball=ai.ball;for(const bl of Rd.balls)if(bl!==ball&&bl.p.distanceToSquared(b.p)<ball.p.distanceToSquared(b.p)*.3)ball=bl;
 if(b.id%9===0){const og=c.z-dir*(Rd.Z-2.5);let thr=null,td=1e9;for(const bl of Rd.balls){const d=Math.abs(bl.p.z-og);if(d<td){td=d;thr=bl;}}
  if(td<12){ball=thr;}else{steer(b,thr.p.x*.6,og+dir*5);return;}}
 tv.set(-ball.p.x*.85,0,gz-ball.p.z).normalize();const r=ball.r,rx=b.p.x-ball.p.x,rz=b.p.z-ball.p.z,along=rx*tv.x+rz*tv.z;
 if(along>-r*.55){const ab=Math.atan2(rx,rz),at=Math.atan2(-tv.x,-tv.z);let d=at-ab;d=Math.atan2(Math.sin(d),Math.cos(d));const an=ab+cl(d,-1.1,1.1),rad=r+2;steer(b,ball.p.x+Math.sin(an)*rad,ball.p.z+Math.cos(an)*rad);}
 else{const px=ball.p.x-tv.x*(r+.9),pz=ball.p.z-tv.z*(r+.9),dd=Math.hypot(px-b.p.x,pz-b.p.z);const perp=Math.abs(rx*tv.z-rz*tv.x);
  if(dd<1.8||perp<.9){steer(b,ball.p.x+tv.x*3,ball.p.z+tv.z*3);if(perp<.7&&-along<r+3&&b.ground&&Math.random()<Gs.diff.grab*.025)b.ctrl.dive=true;}else steer(b,px,pz);}}
function hexNav(b,Rd,Gs,dt){const ai=b.ai,hx=Rd.hx;let L=null;for(const l of hx.layers){if(l.y<=b.p.y+.6){L=l;break;}}if(!L){b.ctrl.x=b.ctrl.z=0;return;}
 // the tile under our feet
 const S=hx.s,lx=b.p.x-L.cx,lz=b.p.z-L.cz;const cur=L.map.get(Math.round((Math.sqrt(3)/3*lx-lz/3)/S+0)+','+Math.round((2/3*lz)/S));
 if(!ai.tile||ai.tile.st!==0||ai.tileL!==L||(ai.tileT-=dt)<0||(cur&&cur===ai.tile&&cur.st!==0)){let best=null,bs=-1e9;for(const t of L.tiles){if(t.st!==0)continue;const d=Math.hypot(t.x-b.p.x,t.z-b.p.z);if(d>8||d<1.2)continue;
   let nb=0;for(const[a,c]of[[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]]){const o=L.map.get((t.q+a)+','+(t.r+c));if(o&&o.st===0)nb++;}
   const sc=-Math.abs(d-2.3)*.8-Math.hypot(t.x-L.cx,t.z-L.cz)*.08+nb*(.25+.5*Gs.diff.bal)+rnd(1.2)-(d>4?2:0);if(sc>bs){bs=sc;best=t;}}
  ai.tile=best;ai.tileL=L;ai.tileT=.5+rnd(.6);}
 if(ai.tile)steer(b,ai.tile.x,ai.tile.z,.62);else steer(b,L.cx+Math.sin(b.id)*3,L.cz+Math.cos(b.id)*3,.5);
 if(b.ground&&cur&&cur.st===1&&cur.t>.12&&Math.random()<dt*(4+Gs.diff.bal*6))b.ctrl.jump=true;}
function lobbyNav(b,Rd,Gs,dt){b.ctrl.x=b.ctrl.z=0;b.cele=true;if(b.ground&&Math.random()<dt*.6)b.ctrl.jump=true;}
