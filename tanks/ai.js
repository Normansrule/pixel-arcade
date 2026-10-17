// IRONCLAD — CPU commanders: A* navigation, spotting (bushes conceal), target focus, cover, flanking, retreat, objectives per mode.
import * as THREE from '../vendor/three.module.min.js';
import {V3,cl,angDiff,wrapA} from './util.js';
import {B,NAV,los,bushesOn,inBush} from './maps.js';
import {rayTanks} from './combat.js';
const R=(a=1)=>Math.random()*a;
export const DIFF=[
 {n:'RECRUIT',react:.95,err:.045,lead:.35,cover:.25,focus:.25,flank:.12,retreat:.2,upg:0,tol:.07,think:.45,acc:.85},
 {n:'VETERAN',react:.5,err:.022,lead:.75,cover:.6,focus:.6,flank:.3,retreat:.3,upg:1,tol:.04,think:.3,acc:1},
 {n:'ACE',react:.22,err:.009,lead:1,cover:.85,focus:.9,flank:.45,retreat:.34,upg:3,tol:.022,think:.2,acc:1}];

/* ---------------- A* on the nav grid ---------------- */
let heapI=null,heapF=null,gS=null,cameFrom=null,closed=null,stamp=null,gen=0;
function ensure(n){if(gS&&gS.length===n)return;heapI=new Int32Array(n*8);heapF=new Float32Array(n*8);gS=new Float32Array(n);cameFrom=new Int32Array(n);closed=new Uint32Array(n);stamp=new Uint32Array(n);}
export function cellOf(g,x,z){return[cl(Math.floor((x+B)/g.cell),0,g.n-1),cl(Math.floor((z+B)/g.cell),0,g.n-1)];}
export const cellPos=(g,i,j)=>[-B+(i+.5)*g.cell,-B+(j+.5)*g.cell];
function nearestFree(g,i,j){if(!g.blk[j*g.n+i])return[i,j];for(let r=1;r<8;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const a=i+di,b=j+dj;if(a<0||b<0||a>=g.n||b>=g.n)continue;if(!g.blk[b*g.n+a])return[a,b];}return[i,j];}
export function walkLine(g,x0,z0,x1,z1){const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/(g.cell*.5));for(let k=0;k<=n;k++){const t=k/n;const[i,j]=cellOf(g,x0+(x1-x0)*t,z0+(z1-z0)*t);if(g.blk[j*g.n+i])return false;}return true;}
export function findPath(g,x0,z0,x1,z1){const n=g.n,N=n*n;ensure(N);gen++;let[si,sj]=nearestFree(g,...cellOf(g,x0,z0));let[ti,tj]=nearestFree(g,...cellOf(g,x1,z1));const s=sj*n+si,t=tj*n+ti;
 let hs=0;const push=(i,f)=>{let k=hs++;heapI[k]=i;heapF[k]=f;while(k>0){const p=(k-1)>>1;if(heapF[p]<=heapF[k])break;[heapI[p],heapI[k]]=[heapI[k],heapI[p]];[heapF[p],heapF[k]]=[heapF[k],heapF[p]];k=p;}};
 const pop=()=>{const top=heapI[0];hs--;if(hs>0){heapI[0]=heapI[hs];heapF[0]=heapF[hs];let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<hs&&heapF[l]<heapF[m])m=l;if(r<hs&&heapF[r]<heapF[m])m=r;if(m===k)break;[heapI[m],heapI[k]]=[heapI[k],heapI[m]];[heapF[m],heapF[k]]=[heapF[k],heapF[m]];k=m;}}return top;};
 const h=(i,j)=>{const dx=Math.abs(i-ti),dz=Math.abs(j-tj);return(dx+dz)+(1.414-2)*Math.min(dx,dz);};
 stamp[s]=gen;gS[s]=0;cameFrom[s]=-1;push(s,h(si,sj));let found=false,it=0,bestC=s,bestH=h(si,sj);
 while(hs>0&&it++<5000){const c=pop();if(c===t){found=true;break;}if(closed[c]===gen)continue;closed[c]=gen;const ci=c%n,cj=(c/n)|0;const hc=h(ci,cj);if(hc<bestH){bestH=hc;bestC=c;}
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const a=ci+di,b=cj+dj;if(a<0||b<0||a>=n||b>=n)continue;const k=b*n+a;if(g.blk[k]||closed[k]===gen)continue;if(di&&dj&&(g.blk[cj*n+a]||g.blk[b*n+ci]))continue;
   const ng=gS[c]+(di&&dj?1.414:1)*(1+g.cost[k]);if(stamp[k]!==gen||ng<gS[k]){stamp[k]=gen;gS[k]=ng;cameFrom[k]=c;push(k,ng+h(a,b));}}}
 const end=found?t:bestC;if(end===s&&!found)return[];const cells=[];for(let c=end;c!==-1;c=cameFrom[c])cells.push(c);cells.reverse();
 const pts=cells.map(c=>cellPos(g,c%n,(c/n)|0));if(found)pts[pts.length-1]=[x1,z1];
 // greedy string-pull: from each anchor, walk forward while the straight line stays walkable
 const out=[];let a=[x0,z0],i=0;while(i<pts.length){let j=i;while(j+1<pts.length&&j-i<14&&walkLine(g,a[0],a[1],pts[j+1][0],pts[j+1][1]))j++;out.push(pts[j]);a=pts[j];i=j+1;}return out;}

/* ---------------- perception ---------------- */
const _a=new V3(),_b=new V3();
export function canSee(G,obs,tgt){const d=obs.p.distanceTo(tgt.p);if(d>185)return false;_a.copy(obs.p);_a.y+=obs.d.y1+1;_b.copy(tgt.p);_b.y+=tgt.d.y1*.8;
 if(!los(G.W,_a,_b))return false;if(d<24)return true;const fired=G.time-tgt.lastFire<2.5;if(fired)return true;
 if(inBush(G.W,tgt.p.x,tgt.p.z)&&d>30)return false;if(bushesOn(G.W,_a,_b,14)>0&&d>36)return false;return true;}

/* ---------------- brain ---------------- */
export function initBot(t,diff){t.ai={diff,think:R(.3),path:null,pi:0,repath:0,dest:null,mode:'obj',target:null,react:0,err:new V3(),errK:1,stuckT:0,unstuck:0,uSteer:1,cover:null,coverT:0,flank:null,flankT:0,strafe:R()<.5?1:-1,strafeT:0,lastSeen:null,lastSeenT:-99,clear:false,role:'attack',lane:(t.id%3)-1,hold:0,pick:null};}
function setDest(G,t,x,z,force){const a=t.ai;if(!force&&a.dest&&Math.hypot(a.dest[0]-x,a.dest[1]-z)<6&&a.path&&a.repath>0)return;a.dest=[x,z];a.path=findPath(G.nav,t.p.x,t.p.z,x,z)||[];a.pi=0;a.repath=3+R(2);}
function coverFrom(G,t,threat){const best={p:null,s:1e9};const tp=_b.copy(threat.p);tp.y+=threat.d.y1+.8;
 for(let k=0;k<14;k++){const ang=R(6.283),r=7+R(18);const x=t.p.x+Math.cos(ang)*r,z=t.p.z+Math.sin(ang)*r;if(Math.abs(x)>B-5||Math.abs(z)>B-5)continue;const[i,j]=cellOf(G.nav,x,z);if(G.nav.blk[j*G.nav.n+i])continue;
  const p=new V3(x,G.W.terrain.height(x,z)+1.6,z);if(los(G.W,tp,p))continue;const dT=Math.hypot(x-threat.p.x,z-threat.p.z);if(dT<22)continue;const s=r+Math.max(0,60-dT)*.3;if(s<best.s){best.s=s;best.p=[x,z];}}return best.p;}
export function botThink(G,t){const a=t.ai,D=a.diff,enemies=G.tanks.filter(e=>e.alive&&e.team!==t.team);
 // perception
 const vis=[];for(const e of enemies){if(canSee(G,t,e)){vis.push(e);G.spot(t.team,e);}}
 // target choice (sticky, focus fire, threats, flag carriers)
 let best=null,bs=-1e9;for(const e of vis){const d=t.p.distanceTo(e.p);let s=-d*.5+(1-e.hp/e.max)*45*D.focus+G.focusCount(t.team,e)*14*D.focus;if(e===t.lastHitBy&&G.time-t.hitT<5)s+=22;if(G.carrierOf&&G.carrierOf(e))s+=45;if(e===a.target)s+=12;if(e.human)s+=4;if(s>bs){bs=s;best=e;}}
 if(best!==a.target){a.target=best;if(best){a.react=D.react*(.7+R(.6));a.errK=1;a.err.set(R(2)-1,R(1)-.3,R(2)-1).normalize();}}
 if(best){a.lastSeen=best.p.clone();a.lastSeenT=G.time;}
 // clear shot? (no ally in the way, no wall in the way)
 a.clear=false;if(a.target){const m=t.muzzle(_a),tp=_b.copy(a.target.p);tp.y+=a.target.d.y1*.7;const h=rayTanks(G.tanks,m,tp,t);a.clear=(!h||h.tank.team!==t.team)&&los(G.W,m,tp);}
 // decide behaviour
 const hpF=t.hp/t.max,carrying=G.carrierOf&&G.carrierOf(t);let dest=null;let mode='obj';
 const repair=G.drops.find(d=>d.state==='ground'&&d.kind==='repair'&&Math.hypot(d.x-t.p.x,d.z-t.p.z)<90);
 const near=G.drops.find(d=>d.state==='ground'&&Math.hypot(d.x-t.p.x,d.z-t.p.z)<38&&(d.kind!=='repair'||hpF<.75));
 const obj=G.objective(t),push=obj&&obj[2]>=2;
 if(hpF<D.retreat&&!carrying&&!push&&G.time>(a.noRetreat||0)&&!a.retreatT){a.retreatT=G.time+7+R(4);a.retreatTo=null;}
 if(a.retreatT&&(G.time>a.retreatT||hpF>.6)){a.retreatT=0;a.noRetreat=G.time+22;}
 if(a.retreatT&&!carrying&&!push){mode='retreat';if(repair)dest=[repair.x,repair.z];else{if(!a.retreatTo){const th=a.target||t.lastHitBy;if(th&&th.alive&&R()<D.cover+.2)a.retreatTo=coverFrom(G,t,th);if(!a.retreatTo){const sp=G.W.spawns[t.team][t.id%6];a.retreatTo=[t.p.x*.5+sp.x*.3,t.p.z*.5+sp.z*.5];}}dest=a.retreatTo;}}
 else if(near&&!carrying&&(!a.target||t.p.distanceTo(a.target.p)>45)){mode='pickup';dest=[near.x,near.z];}
 else{// mode-specific goal [x,z,priority]
  const td=a.target?t.p.distanceTo(a.target.p):1e9;if(a.target&&(!obj||obj[2]<=1)){const d=td;mode='engage';
   const longReload=t.T.reload>3&&t.reload>1.2&&t.ammo<=0;
   if(longReload&&R()<D.cover&&(!a.cover||G.time>a.coverT)){const c=coverFrom(G,t,a.target);if(c){a.cover=c;a.coverT=G.time+Math.min(5,t.reload+.5);}}
   if(a.cover&&G.time<a.coverT){mode='cover';dest=a.cover;}
   else{a.cover=null;
    if(a.flank&&G.time<a.flankT){mode='flank';dest=a.flank;if(Math.hypot(a.flank[0]-t.p.x,a.flank[1]-t.p.z)<8)a.flankT=0;}
    else if(d>45&&R()<D.flank*.25&&G.focusCount(t.team,a.target)>=1){const dx=t.p.x-a.target.p.x,dz=t.p.z-a.target.p.z,l=Math.hypot(dx,dz)||1,s=R()<.5?1:-1,ang=Math.atan2(dz,dx)+s*1.2;
     const fx=cl(a.target.p.x+Math.cos(ang)*34,-B+8,B-8),fz=cl(a.target.p.z+Math.sin(ang)*34,-B+8,B-8);a.flank=[fx,fz];a.flankT=G.time+12;mode='flank';dest=a.flank;}
    else{const ideal=t.lo.hull==='kestrel'?38:t.lo.turret==='lance'?80:55;if(!a.clear||d>ideal+15)dest=[a.target.p.x,a.target.p.z];else dest=null;}}}
  else if(obj){dest=[obj[0],obj[1]];mode=a.target?'engage-obj':'obj';}
  else if(a.lastSeen&&G.time-a.lastSeenT<8){dest=[a.lastSeen.x,a.lastSeen.z];mode='hunt';}
  else{const pts=G.W.points;const pp=pts[(a.lane+1+pts.length)%pts.length];dest=[pp.x+(t.team?-1:1)*0,pp.z];mode='patrol';}}
 a.mode=mode;
 if(dest)setDest(G,t,dest[0],dest[1],false);else{a.path=null;a.dest=null;}
 a.think=D.think*(.8+R(.4));}

const _d=new V3();
export function botStep(G,t,dt){const a=t.ai,c=t.ctrl,D=a.diff;if(!t.alive)return;a.think-=dt;a.repath-=dt;if(a.think<=0)botThink(G,t);
 // steering along path
 let thr=0,steer=0;const v=t.p;
 if(a.unstuck>0){a.unstuck-=dt;thr=-1;steer=a.uSteer;}
 else if(a.path&&a.pi<a.path.length){let wp=a.path[a.pi];let d=Math.hypot(wp[0]-v.x,wp[1]-v.z);while(d<4&&a.pi<a.path.length-1){a.pi++;wp=a.path[a.pi];d=Math.hypot(wp[0]-v.x,wp[1]-v.z);}
  const last=a.pi===a.path.length-1;if(last&&d<3.5){a.path=null;}else{const want=Math.atan2(wp[0]-v.x,wp[1]-v.z);let ang=angDiff(t.yaw,want);
   // avoid allies ahead
   for(const o of G.tanks){if(o===t||!o.alive)continue;const dx=o.p.x-v.x,dz=o.p.z-v.z,dd=Math.hypot(dx,dz);if(dd>9)continue;const rel=angDiff(t.yaw,Math.atan2(dx,dz));if(Math.abs(rel)<.7){ang+=rel>0?-.5:.5;thr-=.3;}}
   const rev=Math.abs(ang)>2.4&&d<14;if(rev){ang=angDiff(t.yaw+Math.PI,want);steer=cl(-ang*2.4,-1,1);thr=-1;}else{steer=cl(ang*2.4,-1,1);thr+=Math.abs(ang)>1.2?.15:Math.abs(ang)>.6?.6:1;if(last&&d<12)thr*=.6;}}}
 // engage: hold + face target (heavies angle the front plate, lights circle-strafe)
 if(a.mode==='engage'&&!a.path&&a.target&&a.target.alive){const want=Math.atan2(a.target.p.x-v.x,a.target.p.z-v.z);
  if(t.lo.hull==='kestrel'){a.strafeT-=dt;if(a.strafeT<=0){a.strafe*=-1;a.strafeT=1.5+R(2.5);}const ang=angDiff(t.yaw,want+a.strafe*Math.PI/2);steer=cl(ang*2.2,-1,1);thr=.85;}
  else{const off=t.lo.hull==='behemoth'?.4*(t.id%2?1:-1):0;const ang=angDiff(t.yaw,want+off);steer=cl(ang*2.2,-1,1);thr=Math.abs(ang)>.5?0:0;a.hold+=dt;if(a.hold>6){a.hold=0;a.path=null;a.dest=null;}}}
 // stuck detection
 if(thr>.5&&Math.abs(t.v)<.8&&!t.crit.track){a.stuckT+=dt;if(a.stuckT>1.3){a.stuckT=0;a.unstuck=.9+R(.6);a.uSteer=R()<.5?1:-1;a.repath=0;if(a.dest)setDest(G,t,a.dest[0],a.dest[1],true);}}else a.stuckT=Math.max(0,a.stuckT-dt*2);
 c.thr=cl(thr,-1,1);c.steer=steer;
 // aim
 if(a.target&&a.target.alive){const tg=a.target;const d=t.p.distanceTo(tg.p);const tof=t.T.speed>0?d/t.T.speed:0;
  _d.copy(tg.p);_d.y+=tg.d.y1*.65;_d.x+=tg.vel.x*tof*D.lead;_d.z+=tg.vel.z*tof*D.lead;a.errK=Math.max(.25,a.errK*Math.exp(-dt/1.6));_d.addScaledVector(a.err,d*D.err*a.errK*(1+Math.abs(tg.v)/12));
  c.aim.lerp(_d,Math.min(1,dt*8));a.react-=dt;
  const gd=t.gunDir(_a),mz=t.muzzle(_b);const to=_d.clone().sub(mz).normalize();// compare yaw only for ballistic guns; full for coilgun
  const yawErr=Math.abs(angDiff(Math.atan2(gd.x,gd.z),Math.atan2(to.x,to.z)));
  c.fire=a.react<=0&&a.clear&&yawErr<D.tol+t.disp*.5&&d<190;}
 else{const look=a.path&&a.pi<a.path.length?a.path[Math.min(a.pi+1,a.path.length-1)]:null;if(a.lastSeen&&G.time-a.lastSeenT<6)_d.copy(a.lastSeen).setY(a.lastSeen.y+1.5);else if(look)_d.set(look[0],t.p.y+2,look[1]);else _d.set(v.x+Math.sin(t.yaw)*40,v.y+2,v.z+Math.cos(t.yaw)*40);c.aim.lerp(_d,Math.min(1,dt*3));c.fire=false;}}
