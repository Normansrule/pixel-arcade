// CRITTER KART — vehicle physics for karts, hovercraft and planes: hop-drift with 3 mini-turbo tiers, ramp tricks,
// slipstream, boost pads, surfaces (grass / rough / ice), jump gaps, lap tracking, pickups, racer-vs-racer contact.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,lerp,wrapA} from './util.js';
import {query,at,atK,yawAt,SEA} from './course.js';
import {statMul} from './data.js';
export const KMH=3.6;
export const DRIFT_LV=[.85,1.75,2.7],MT_TIME=[0,.6,1.05,1.6];
const _v=new V();

export function newRacer(d,veh,o={}){return{d,st:statMul(d),veh,human:o.human??-1,boss:!!o.boss,ghost:!!o.ghost,name:o.name||d.n,p:new V(),vel:new V(),yaw:0,pitch:0,roll:0,v:0,vl:0,vy:0,air:false,airT:0,idx:-1,q:{},
 lap:0,f:0,half:true,prog:0,fin:0,place:1,item:null,itemN:0,roll_:0,berries:0,coins:0,zipT:0,zipPow:1.38,spinT:0,shield:0,magnetT:0,frenzyT:0,rescueT:0,offT:0,hop:0,barrelT:0,
 drift:{on:false,dir:0,t:0,lvl:0,arm:false},steerV:0,trickWin:0,trickT:0,trickDone:false,trickK:0,draft:0,squash:0,land:0,
 lastRamp:0,bestLap:1e9,lapStart:0,lapTimes:[],rub:1,cc:{top:1,acc:1},inp:{gas:0,brake:0,steer:0,pitch:0,drift:false,item:false,hop:false},prevDrift:false,prevItem:false,prevHop:false,hitT:0,
 stats:{hits:0,items:0,rings:0,mt:0,tricks:0,cuts:0,drafts:0},ringIdx:0,laneOff:0,ai:{},anim:{}};}

export function place(C,r,i,u,yOff=0){const q=at(C,i,u);r.p.copy(q);r.gyPrev=undefined;r.yaw=yawAt(C,i);r.idx=((Math.round(i)%C.B.n)+C.B.n)%C.B.n;r.v=0;r.vl=0;r.vel.set(0,0,0);r.vy=0;r.pitch=0;
 if(r.veh==='plane')r.p.y+=yOff;else if(C.B.wet[r.idx])r.p.y=Math.max(r.p.y,SEA+.5);query(C,r.p.x,r.p.z,r.idx,r.q,r.veh==='plane'?r.p.y:null);r.f=r.q.prog;}

// ground under a racer: road surface (+ramp) when on the road, terrain elsewhere, nothing over a gap
export function groundY(C,TR,r,q){const onRoad=Math.abs(q.u)<=q.w+.6&&!q.wet&&!q.gap;return onRoad?q.roadY+q.rampH:TR.h(r.p.x,r.p.z);}

const fwd=(yaw,pitch=0,o=new V())=>o.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
export function topSpeed(r){const base=r.veh==='plane'?40:r.veh==='hover'?(r.water?34:28):31;return base*r.st.top*r.cc.top*(1+r.berries*.012)*(r.human<0?r.rub:1)*(r.boss?1.02:1);}

function landEvt(r,env,impact){r.squash=Math.min(1,impact/14);env.land&&env.land(r,impact);
 if(r.trickDone){r.zipT=Math.max(r.zipT,.85);r.zipPow=1.32;r.driftBoost=4;r.stats.tricks++;env.trickBoost&&env.trickBoost(r);}
 r.trickDone=false;r.trickT=0;r.trickWin=0;}

export function stepRacer(C,TR,r,dt,env){
 const I=r.inp,boosting=r.zipT>0||r.frenzyT>0;r.zipT=Math.max(0,r.zipT-dt);r.shield=Math.max(0,r.shield-dt);r.magnetT=Math.max(0,r.magnetT-dt);r.hitT=Math.max(0,r.hitT-dt);r.barrelT=Math.max(0,r.barrelT-dt);r.frenzyT=Math.max(0,r.frenzyT-dt);
 r.squash=Math.max(0,r.squash-dt*3);if(r.trickWin>0)r.trickWin-=dt;if(r.trickT>0)r.trickT-=dt;
 if(r.rescueT>0){r.rescueT-=dt;r.v=0;r.vl=0;r.vel.set(0,0,0);r.drift.on=false;r.zipT=0;
  if(!r.rescued&&r.rescueT<=.6){let i=r.rescueTo??(r.idx+4)%C.B.n;r.rescueTo=null;place(C,r,i,C.B.line[i]*.5,0);r.rescued=true;env.respawn&&env.respawn(r);}
  if(r.rescueT<=0){r.rescued=false;r.vy=0;r.air=r.veh!=='plane';r.p.y+=r.veh==='plane'?0:.3;r.hitT=1.5;}return;}
 if(r.veh==='plane')return stepPlane(C,TR,r,dt,env,boosting);
 const hover=r.veh==='hover';let top=topSpeed(r),acc=(hover?18:21)*r.st.acc*r.cc.acc*(r.human<0&&r.rub>1?r.rub:1);
 const q=r.q;const off=Math.abs(q.u)>q.w+.6;r.water=hover&&(q.wet&&!off||TR.h(r.p.x,r.p.z)<SEA-.2);
 // surfaces: grass beside the road and grass shortcuts are slow, rough shortcuts a little slow; boosts and frenzy ignore them
 let surfMul=1;if(!r.water&&!r.air){if(off||q.offSurf===1)surfMul=hover?.8:.6;else if(q.offSurf===2)surfMul=.82;}
 if(!boosting)top*=surfMul;if(r.zipT>0){top*=r.zipPow;acc*=3;}if(r.frenzyT>0)top*=1.14;if(r.magnetT>0)top*=1.18;
 // speed
 const hurt=r.spinT>0;
 if(hurt){r.spinT-=dt;r.v*=Math.pow(.15,dt);r.yaw+=dt*11*Math.sign(r.spinDir||1);}
 else{const gas=I.gas,br=I.brake;if(env.frozen){r.v*=Math.pow(.2,dt);}
  else if(r.air&&!hover){r.v*=Math.exp(-.04*dt);}
  else if(gas>0){if(r.v<top)r.v=Math.min(top,r.v+acc*gas*dt*(1-.55*cl(r.v/top,0,1))+(r.v<6?6*dt:0));else r.v=Math.max(top,r.v-(r.v-top)*2.4*dt);}
  else if(br>0){r.v=Math.max(-9,r.v-(r.v>0?36:12)*br*dt);}else{r.v-=r.v*(hover?.35:.7)*dt;if(Math.abs(r.v)<.2)r.v=0;}if(r.v>top&&gas<=0&&!r.air)r.v-=(r.v-top)*2*dt;}
 // steering, hop & drift
 const han=r.st.han*(q.ice?.6:1),sf=cl(Math.abs(r.v)/8,0,1)*(1-.26*cl(r.v/(top||1),0,1.2));let turn=0;
 r.steerV+=((I.steer||0)-r.steerV)*Math.min(1,dt*(Math.abs(I.steer)>Math.abs(r.steerV)?10:14));
 const dPress=I.drift&&!r.prevDrift,dRel=!I.drift&&r.prevDrift;
 if(!hurt&&!env.frozen){
  if(dPress&&r.air&&!hover&&r.trickWin>0&&!r.trickDone){r.trickT=.5;r.trickDone=true;r.trickK=(r.trickK+1+(Math.random()*2|0))%3;env.trick&&env.trick(r);}
  else if(dPress&&!r.air&&!hover&&r.v>3){r.vy=4.6;r.air=true;r.hop=1;r.drift.arm=true;env.hop&&env.hop(r);}
  else if(dPress)r.drift.arm=true;
  if(!I.drift)r.drift.arm=false;
  if((r.drift.arm||hover&&I.drift)&&!r.air&&!r.drift.on&&Math.abs(I.steer)>.3&&r.v>11){r.drift.on=true;r.drift.dir=Math.sign(I.steer);r.drift.t=0;r.drift.lvl=0;}
  if(r.drift.on){if(!I.drift||r.v<8||dRel){if(r.drift.lvl>0){r.zipT=Math.max(r.zipT,MT_TIME[r.drift.lvl]*r.st.mt);r.zipPow=r.drift.lvl===3?1.42:1.36;r.driftBoost=r.drift.lvl;r.stats.mt++;env.mt&&env.mt(r,r.drift.lvl);}r.drift.on=false;}
   else{const inner=I.steer*r.drift.dir;if(!r.air){r.drift.t+=dt*(.7+.8*Math.max(0,inner))*r.st.mt;const lv=r.drift.t>=DRIFT_LV[2]?3:r.drift.t>=DRIFT_LV[1]?2:r.drift.t>=DRIFT_LV[0]?1:0;if(lv>r.drift.lvl){r.drift.lvl=lv;env.driftLv&&env.driftLv(r,lv);}}
    turn=r.drift.dir*(.66+.46*inner)*2.05*han*sf;}}
  if(!r.drift.on)turn=r.steerV*(hover?2.15:2.0)*han*sf;
  if(r.air&&!hover)turn*=.55;r.yaw+=turn*dt*(r.v<0?-1:1);}
 else if(r.drift.on&&hurt)r.drift.on=false;
 r.prevDrift=I.drift;r.turn=turn;
 // move
 const fx=Math.sin(r.yaw),fz=Math.cos(r.yaw);
 if(hover){const grip=r.water?1.5:2.6;r.vel.x+=(fx*r.v-r.vel.x)*Math.min(1,grip*dt*(r.drift.on?.5:1));r.vel.z+=(fz*r.v-r.vel.z)*Math.min(1,grip*dt*(r.drift.on?.5:1));
  if(r.drift.on){r.vel.x+=fz*r.drift.dir*r.v*.25*dt;r.vel.z-=fx*r.drift.dir*r.v*.25*dt;}}
 else{// forward speed + lateral slip (outward while drifting, low grip on ice)
  let grip=r.drift.on?4.5:12;if(q.ice)grip=r.drift.on?1.6:2.4;if(r.air)grip=.5;
  r.vl*=Math.exp(-grip*dt);if(r.drift.on&&!r.air)r.vl+=-r.drift.dir*Math.min(r.v,32)*.4*dt;
  // a turn while sliding on ice keeps some of the old heading
  r.vel.set(fx*r.v+fz*r.vl,0,fz*r.v-fx*r.vl);}
 r.p.x+=r.vel.x*dt;r.p.z+=r.vel.z*dt;
 // track query & bounds
 const wasCut=q.cut;query(C,r.p.x,r.p.z,r.idx,q);r.idx=q.i;if(q.cut&&!wasCut&&q.offSurf){r.stats.cuts++;}
 const lim=q.w+(q.cut?9:(hover?22:26));if(Math.abs(q.u)>lim){const s=Math.sign(q.u),over=Math.abs(q.u)-lim;r.p.x-=q.nx*s*over;r.p.z-=q.nz*s*over;const vn=r.vel.x*q.nx*s+r.vel.z*q.nz*s;if(vn>0){r.v*=.85;r.vl*=.3;}r.yaw+=wrapA(Math.atan2(q.tx,q.tz)-r.yaw)*Math.min(1,dt*2);}
 // vertical
 let gy=groundY(C,TR,r,q);if(hover)gy=Math.max(gy,SEA)+.42+Math.sin(env.t*5+r.d.spd)*.06;
 if(!hover&&gy<SEA-.6&&r.p.y<SEA-.4&&!r.air){r.rescueT=1.4;r.v=0;r.rescueTo=gapExit(C,r);env.splash&&env.splash(r);return;}
 if(!hover&&q.gapZone&&r.p.y<q.roadY-4){r.rescueT=1.5;r.v=0;r.rescueTo=gapExit(C,r);env.fall&&env.fall(r);return;}
 if(!r.air&&r.lastRamp>2&&q.rampH<.5&&r.v>8){r.vy=5+r.v*.16;r.air=true;r.airT=0;r.trickWin=.6;r.trickDone=false;env.jump&&env.jump(r);}
 if(r.air||r.p.y>gy+.15){if(!r.air){r.air=true;r.airT=0;if(r.vy>3.5&&!r.hop){r.trickWin=.45;r.trickDone=false;}}r.airT+=dt;r.vy-=(hover?22:30)*dt;r.p.y+=r.vy*dt;if(r.p.y<=gy){r.p.y=gy;const imp=-r.vy;r.vy=0;r.air=false;r.hop=0;if(imp>3)landEvt(r,env,imp);else{r.trickDone&&landEvt(r,env,imp);}}}
 else{// follow the ground (and carry a little vertical speed off crests)
  const gv=(gy-(r.gyPrev??gy))/Math.max(dt,1e-3);r.vy=cl(gv,-30,12);
  r.p.y=lerp(r.p.y,gy,Math.min(1,dt*(hover?6:30)));if(r.p.y<gy)r.p.y=gy;}
 r.lastRamp=q.rampH;r.gyPrev=gy;
 if(hover&&I.hop&&!r.prevHop&&!r.air){r.vy=6.5;r.air=true;r.p.y+=.1;}r.prevHop=I.hop;
 // pitch / roll visuals
 const ahead=TR.h(r.p.x+fx*1.5,r.p.z+fz*1.5),behind=TR.h(r.p.x-fx*1.5,r.p.z-fz*1.5);const onRoad=!off&&!q.wet;const slope=onRoad?Math.atan((q.cut?q.cut.ty[q.ci]:C.B.ty[q.i])*Math.cos(wrapA(r.yaw-Math.atan2(q.tx,q.tz)))):Math.atan2(ahead-behind,3);
 r.pitch=lerp(r.pitch,r.air?cl(r.vy*.03,-.4,.4):slope,Math.min(1,dt*8));r.roll=lerp(r.roll,-turn*(r.drift.on?.12:.07)*cl(r.v/20,0,1)*(hover?2:1),Math.min(1,dt*6));
 boostPads(C,r,env);progress(C,r,env);r.offT=off&&!r.water?r.offT+dt:0;}

// where to put a racer back after a fall: just past the gap it fell into (or a little ahead)
function gapExit(C,r){const n=C.B.n;for(const g of C.gaps){let d=r.idx-g.i0;if(d<-n/2)d+=n;if(d>n/2)d-=n;if(d>-14&&d<g.k+14)return(g.i1+3)%n;}return(r.idx+4)%n;}

function stepPlane(C,TR,r,dt,env,boosting){const I=r.inp,q=r.q;let top=topSpeed(r);if(r.zipT>0)top*=1.4;if(r.frenzyT>0)top*=1.14;if(r.magnetT>0)top*=1.18;
 if(r.spinT>0){r.spinT-=dt;r.v*=Math.pow(.4,dt);r.roll+=dt*14;}
 else if(!env.frozen){const want=I.brake>0?top*.6:I.gas>=0?top:top*.8;r.v+=(want-r.v)*Math.min(1,dt*(boosting?3:.9)*r.st.acc);
  const yr=I.steer*1.25*r.st.han;r.yaw+=yr*dt;r.roll=lerp(r.roll,-I.steer*.75,Math.min(1,dt*4));r.pitch=lerp(r.pitch,cl(I.pitch,-1,1)*.5,Math.min(1,dt*2.6));
  if(I.hop&&!r.prevHop&&r.barrelT<=0){r.barrelT=.7;env.barrel&&env.barrel(r);}}
 else r.v*=Math.pow(.3,dt);
 r.prevHop=I.hop;r.turn=I.steer;
 fwd(r.yaw,r.pitch,_v);r.p.addScaledVector(_v,r.v*dt);r.vel.copy(_v).multiplyScalar(r.v);
 query(C,r.p.x,r.p.z,r.idx,q,r.p.y);r.idx=q.i;
 const ty=q.roadY;// soft tube around the flight path
 const lim=q.w+38;if(Math.abs(q.u)>lim){const s=Math.sign(q.u),over=Math.abs(q.u)-lim;r.p.x-=q.nx*s*over*Math.min(1,dt*4);r.p.z-=q.nz*s*over*Math.min(1,dt*4);r.yaw+=wrapA(Math.atan2(q.tx,q.tz)-r.yaw)*Math.min(1,dt*1.5);}
 if(r.p.y>ty+34){r.p.y=lerp(r.p.y,ty+34,Math.min(1,dt*3));r.pitch=Math.min(r.pitch,0);}
 const gy=Math.max(TR.h(r.p.x,r.p.z),SEA)+2.2;if(r.p.y<gy){r.p.y=gy;r.pitch=Math.max(r.pitch,.25);if(r.v>14)r.v*=Math.pow(.4,dt);env.scrape&&env.scrape(r);}
 if(r.barrelT>0)r.roll=(1-r.barrelT/.7)*Math.PI*2*(r.barrelDir||1);
 // rings
 const R=C.rings;if(R.length){for(let k=0;k<R.length;k++){const g=R[k];let di=g.i-q.i;if(di<-C.B.n/2)di+=C.B.n;if(di>C.B.n/2)di-=C.B.n;if(di>1||di<-2)continue;const d=r.p.distanceTo(g.p);
  if(d<g.r+.8&&r.lastRing!==k){r.lastRing=k;r.zipT=Math.max(r.zipT,g.gold?1.5:.7);r.stats.rings++;if(r.human>=0)g.flash=.6;env.ring&&env.ring(r,g);}}}
 progress(C,r,env);}

function boostPads(C,r,env){const q=r.q;for(const p of C.boosts){let hit=false;
  if(p.cut){if(q.cut===p.cut&&q.ci>=p.i&&(q.ci-p.i)*p.cut.step<p.len&&Math.abs(q.u-p.u)<2.2)hit=true;}
  else if(!q.cut){let di=q.i-p.i;if(di<0)di+=C.B.n;if(di*C.B.step<p.len&&Math.abs(q.u-p.u)<1.9)hit=true;}
  if(hit){if(r.onPadPrev!==p){r.onPadPrev=p;env.pad&&env.pad(r);}r.zipT=Math.max(r.zipT,.95);r.zipPow=Math.max(r.zipT>1?r.zipPow:1,1.42);r.driftBoost=5;return;}}
 r.onPadPrev=null;}

function progress(C,r,env){const f=r.q.prog;if(f>.4&&f<.6)r.half=true;
 if(r.f>.85&&f<.15){if(r.half){r.lap++;r.half=false;env.lap&&env.lap(r);}}else if(r.f<.15&&f>.85){r.lap--;r.half=true;}
 r.f=f;r.prog=r.lap+f;}

/* ---------- slipstream: tuck in behind a racer to charge a free boost ---------- */
export function slipstream(rs,dt,env){for(const r of rs){if(r.veh==='plane'||r.air||r.rescueT>0||r.spinT>0||r.v<18||r.zipT>0){r.draft=Math.max(0,r.draft-dt*2);continue;}
 const fx=Math.sin(r.yaw),fz=Math.cos(r.yaw);let any=false;
 for(const o of rs){if(o===r||o.rescueT>0||o.v<14)continue;const dx=o.p.x-r.p.x,dz=o.p.z-r.p.z,ah=dx*fx+dz*fz;if(ah<2.5||ah>15)continue;const lat=Math.abs(-dx*fz+dz*fx);if(lat<1.9+ah*.06){any=true;break;}}
 if(any){r.draft+=dt;if(r.draft>1.3){r.draft=0;r.zipT=Math.max(r.zipT,.9);r.zipPow=1.34;r.driftBoost=6;r.stats.drafts++;env.draft&&env.draft(r);}}
 else r.draft=Math.max(0,r.draft-dt*1.5);}}

/* ---------- contact between racers ---------- */
export function collide(rs,env){for(let a=0;a<rs.length;a++)for(let b=a+1;b<rs.length;b++){const A=rs[a],B=rs[b];if(A.rescueT>0||B.rescueT>0||A.ghost||B.ghost)continue;
 const ra=A.boss?2.2:A.veh==='plane'?1.8:1.3,rb=B.boss?2.2:B.veh==='plane'?1.8:1.3;const dx=B.p.x-A.p.x,dz=B.p.z-A.p.z,dy=(B.p.y-A.p.y)*(A.veh==='plane'?1:.5);const d=Math.hypot(dx,dz,dy),R=ra+rb;
 if(d<R&&d>1e-4){// frenzy flattens whoever it touches
  if(A.frenzyT>0&&B.frenzyT<=0){hitRacer(B,env,'frenzy',A);continue;}if(B.frenzyT>0&&A.frenzyT<=0){hitRacer(A,env,'frenzy',B);continue;}
  const nx=dx/d,nz=dz/d,ov=R-d,wa=A.st.wt*(A.boss?3:1),wb=B.st.wt*(B.boss?3:1),sa=wb/(wa+wb),sb=wa/(wa+wb);A.p.x-=nx*ov*sa;A.p.z-=nz*ov*sa;B.p.x+=nx*ov*sb;B.p.z+=nz*ov*sb;
  if(A.veh==='hover'){A.vel.x-=nx*4*sa;A.vel.z-=nz*4*sa;}if(B.veh==='hover'){B.vel.x+=nx*4*sb;B.vel.z+=nz*4*sb;}
  // sideways shove into each other's lateral slip: heavier critters win
  if(A.veh==='kart'){const s=(nx*Math.cos(A.yaw)-nz*Math.sin(A.yaw));A.vl-=s*5*sa;}if(B.veh==='kart'){const s=(nx*Math.cos(B.yaw)-nz*Math.sin(B.yaw));B.vl+=s*5*sb;}
  const dv=B.v-A.v;A.v+=dv*.12*sa;B.v-=dv*.12*sb;env.bump&&env.bump(A,B,ov);}}}

/* ---------- pickups ---------- */
export function pickups(C,r,env,coinsOn){const plane=r.veh==='plane',rad=plane?3.4:2.3;if(r.ghost)return;
 for(const p of C.pods){if(p.t>0)continue;if(p.m.position.distanceToSquared(r.p)<(rad+.6)**2){p.t=2.5;if(!r.item&&r.roll_<=0){r.roll_=1;env.pod&&env.pod(r,p);}else env.podEmpty&&env.podEmpty(r,p);}}
 if(r.berries<10)for(const b of C.berries){if(b.t>0)continue;if(b.p.distanceToSquared(r.p)<(rad)**2){b.t=9;r.berries++;env.berry&&env.berry(r,b);}}
 if(coinsOn&&r.human>=0)for(const c of C.coins){if(c.got)continue;if(c.p.distanceToSquared(r.p)<(rad+.4)**2){c.got=1;r.coins++;env.coin&&env.coin(r,c);}}}

export function hitRacer(r,env,kind='hit',by=null){if(r.rescueT>0||r.hitT>0||r.barrelT>0||r.frenzyT>0||r.ghost)return false;if(r.shield>0){r.shield=0;env.pop&&env.pop(r);return false;}
 r.spinT=kind==='bump'?.5:1.1;r.spinDir=Math.random()<.5?-1:1;r.v*=kind==='bump'?.6:.35;r.vl=0;r.hitT=1.6;const lost=Math.min(r.berries,kind==='bump'?1:2);r.berries-=lost;r.drift.on=false;r.zipT=0;r.stats.hits++;
 if(r.veh!=='plane')r.vy=kind==='geyser'||kind==='frenzy'?9:5,r.air=true;env.hurt&&env.hurt(r,lost,kind,by);return true;}
