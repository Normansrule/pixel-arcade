// CRITTER KART — vehicle physics for karts, hovercraft and planes; lap tracking; pickups; racer-vs-racer contact.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,lerp,wrapA} from './util.js';
import {query,at,yawAt,SEA} from './course.js';
import {statMul} from './data.js';
export const KMH=3.6;
const _q={},_v=new V();

export function newRacer(d,veh,o={}){return{d,st:statMul(d),veh,human:o.human??-1,boss:!!o.boss,name:o.name||d.n,p:new V(),vel:new V(),yaw:0,pitch:0,roll:0,v:0,vy:0,air:false,idx:-1,q:{},
 lap:0,f:0,half:true,prog:0,fin:0,place:1,item:null,roll_:0,berries:0,coins:0,zipT:0,spinT:0,shield:0,magnetT:0,rescueT:0,offT:0,hop:0,barrelT:0,
 drift:{on:false,dir:0,t:0,lvl:0},lastRamp:0,bestLap:1e9,lapStart:0,lapTimes:[],rub:1,inp:{gas:0,brake:0,steer:0,pitch:0,drift:false,item:false,hop:false},prevDrift:false,prevItem:false,prevHop:false,hitT:0,stats:{hits:0,items:0,rings:0},ringIdx:0,laneOff:0,ai:{}};}

export function place(C,r,i,u,yOff=0){const q=at(C,i,u);r.p.copy(q);r.yaw=yawAt(C,i);r.idx=((Math.round(i)%C.B.n)+C.B.n)%C.B.n;r.v=0;r.vel.set(0,0,0);r.vy=0;r.pitch=0;
 if(r.veh==='plane')r.p.y+=yOff;else if(C.B.wet[r.idx])r.p.y=Math.max(r.p.y,SEA+.5);query(C,r.p.x,r.p.z,r.idx,r.q,r.veh==='plane'?r.p.y:null);r.f=r.q.prog;}

export function groundY(C,TR,r,q){const onRoad=Math.abs(q.u)<=q.w+.6&&!q.wet;return onRoad?q.roadY+q.rampH:TR.h(r.p.x,r.p.z);}

const fwd=(yaw,pitch=0,o=new V())=>o.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
export function topSpeed(r){const base=r.veh==='plane'?40:r.veh==='hover'?(r.water?34:28):31;return base*r.st.top*(1+r.berries*.012)*r.rub*(r.boss?1.02:1);}

export function stepRacer(C,TR,r,dt,env){
 const I=r.inp,boosting=r.zipT>0;r.zipT=Math.max(0,r.zipT-dt);r.shield=Math.max(0,r.shield-dt);r.magnetT=Math.max(0,r.magnetT-dt);r.hitT=Math.max(0,r.hitT-dt);r.barrelT=Math.max(0,r.barrelT-dt);
 if(r.rescueT>0){r.rescueT-=dt;r.v=0;r.vel.set(0,0,0);if(r.rescueT<=0){const i=(r.idx+4)%C.B.n;place(C,r,i,C.B.line[i]*.5,0);r.p.y+=r.veh==='plane'?0:3;r.vy=0;r.air=r.veh!=='plane';r.hitT=1.5;}return;}
 if(r.veh==='plane')return stepPlane(C,TR,r,dt,env,boosting);
 const hover=r.veh==='hover';let top=topSpeed(r),acc=(hover?18:21)*r.st.acc*(r.rub>1?r.rub:1);
 const q=r.q;const off=Math.abs(q.u)>q.w+.6;r.water=hover&&(q.wet&&!off||TR.h(r.p.x,r.p.z)<SEA-.2);
 if(off&&!boosting&&!r.water){top*=hover?.8:.6;}if(boosting){top*=1.38;acc*=3;}if(r.magnetT>0)top*=1.18;
 // speed
 if(r.spinT>0){r.spinT-=dt;r.v*=Math.pow(.15,dt);r.yaw+=dt*11*Math.sign(r.spinDir||1);}
 else{const gas=I.gas,br=I.brake;if(env.frozen){r.v*=Math.pow(.2,dt);}else if(gas>0){if(r.v<top)r.v=Math.min(top,r.v+acc*gas*dt*(1-.55*cl(r.v/top,0,1)));else r.v=Math.max(top,r.v-(r.v-top)*2.4*dt);}
  else if(br>0){r.v=Math.max(-9,r.v-(r.v>0?36:12)*br*dt);}else{r.v-=r.v*(hover?.35:.7)*dt;if(Math.abs(r.v)<.2)r.v=0;}if(r.v>top&&gas<=0)r.v-=(r.v-top)*2*dt;}
 // steering & drift
 const han=r.st.han*(q.ice?.55:1),sf=cl(Math.abs(r.v)/8,0,1)*(1-.28*cl(r.v/top,0,1));let turn=0;
 if(r.spinT<=0&&!env.frozen){
  if(I.drift&&!r.prevDrift&&!r.air&&!hover){r.vy=4.2;r.air=true;r.hop=1;}
  if(I.drift&&!r.drift.on&&Math.abs(I.steer)>.3&&r.v>13){r.drift.on=true;r.drift.dir=Math.sign(I.steer);r.drift.t=0;r.drift.lvl=0;}
  if(r.drift.on){if(!I.drift||r.v<9){if(r.drift.lvl>0)r.zipT=Math.max(r.zipT,r.drift.lvl===2?1.1:.55),r.driftBoost=r.drift.lvl;r.drift.on=false;}
   else{r.drift.t+=dt*(1+.6*Math.abs(I.steer+r.drift.dir)/2);r.drift.lvl=r.drift.t>1.6?2:r.drift.t>.75?1:0;turn=(r.drift.dir*.95+I.steer*.55)*1.9*han*sf;}}
  if(!r.drift.on)turn=I.steer*(hover?2.15:2.0)*han*sf;
  if(r.air&&!hover)turn*=.5;r.yaw+=turn*dt*(r.v<0?-1:1);}
 r.prevDrift=I.drift;
 // move
 const fx=Math.sin(r.yaw),fz=Math.cos(r.yaw);
 if(hover){const grip=r.water?1.5:2.6;r.vel.x+=(fx*r.v-r.vel.x)*Math.min(1,grip*dt*(r.drift.on?.5:1));r.vel.z+=(fz*r.v-r.vel.z)*Math.min(1,grip*dt*(r.drift.on?.5:1));
  if(r.drift.on){r.vel.x+=fz*r.drift.dir*r.v*.25*dt;r.vel.z-=fx*r.drift.dir*r.v*.25*dt;}}
 else{const slip=r.drift.on?r.drift.dir*r.v*.16:0;r.vel.set(fx*r.v+fz*slip,0,fz*r.v-fx*slip);}
 r.p.x+=r.vel.x*dt;r.p.z+=r.vel.z*dt;
 // track query & bounds
 query(C,r.p.x,r.p.z,r.idx,q);r.idx=q.i;
 const lim=q.w+(hover?22:26);if(Math.abs(q.u)>lim){const s=Math.sign(q.u),over=Math.abs(q.u)-lim;r.p.x-=q.nx*s*over;r.p.z-=q.nz*s*over;const vn=r.vel.x*q.nx*s+r.vel.z*q.nz*s;if(vn>0){r.v*=.85;}r.yaw+=wrapA(Math.atan2(q.tx,q.tz)-r.yaw)*Math.min(1,dt*2);}
 // vertical
 let gy=groundY(C,TR,r,q);if(hover)gy=Math.max(gy,SEA)+.42+Math.sin(env.t*5+r.d.spd)*.06;
 if(!hover&&gy<SEA-.6&&r.p.y<SEA-.4&&!r.air){r.rescueT=1.4;r.v=0;env.splash&&env.splash(r);return;}
 if(r.air||r.p.y>gy+.15){r.vy-=(hover?22:30)*dt;r.p.y+=r.vy*dt;r.air=true;if(r.p.y<=gy){r.p.y=gy;if(r.vy<-6)env.land&&env.land(r,-r.vy);r.vy=0;r.air=false;r.hop=0;}}
 else{// launch off ramp lips
  if(r.lastRamp>2&&q.rampH<.5&&r.v>8){r.vy=5+r.v*.16;r.air=true;env.jump&&env.jump(r);}
  r.p.y=lerp(r.p.y,gy,Math.min(1,dt*(hover?6:30)));if(r.p.y<gy)r.p.y=gy;}
 r.lastRamp=q.rampH;
 if(hover&&I.hop&&!r.prevHop&&!r.air){r.vy=6.5;r.air=true;r.p.y+=.1;}r.prevHop=I.hop;
 // pitch / roll visuals
 const ahead=TR.h(r.p.x+fx*1.5,r.p.z+fz*1.5),behind=TR.h(r.p.x-fx*1.5,r.p.z-fz*1.5);const onRoad=!off&&!q.wet;const slope=onRoad?Math.atan(C.B.ty[q.i]*Math.cos(wrapA(r.yaw-Math.atan2(q.tx,q.tz)))):Math.atan2(ahead-behind,3);
 r.pitch=lerp(r.pitch,r.air?cl(r.vy*.03,-.4,.4):slope,Math.min(1,dt*8));r.roll=lerp(r.roll,-turn*(r.drift.on?.12:.07)*cl(r.v/20,0,1)*(hover?2:1),Math.min(1,dt*6));
 boostPads(C,r);progress(C,r,env);r.offT=off&&!r.water?r.offT+dt:0;}

function stepPlane(C,TR,r,dt,env,boosting){const I=r.inp,q=r.q;let top=topSpeed(r);if(boosting)top*=1.4;if(r.magnetT>0)top*=1.18;
 if(r.spinT>0){r.spinT-=dt;r.v*=Math.pow(.4,dt);r.roll+=dt*14;}
 else if(!env.frozen){const want=I.brake>0?top*.6:I.gas>=0?top:top*.8;r.v+=(want-r.v)*Math.min(1,dt*(boosting?3:.9)*r.st.acc);
  const yr=I.steer*1.25*r.st.han;r.yaw+=yr*dt;r.roll=lerp(r.roll,-I.steer*.75,Math.min(1,dt*4));r.pitch=lerp(r.pitch,cl(I.pitch,-1,1)*.5,Math.min(1,dt*2.6));
  if(I.hop&&!r.prevHop&&r.barrelT<=0){r.barrelT=.7;env.barrel&&env.barrel(r);}}
 else r.v*=Math.pow(.3,dt);
 r.prevHop=I.hop;
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

function boostPads(C,r){const q=r.q;for(const p of C.boosts){let di=q.i-p.i;if(di<0)di+=C.B.n;if(di*C.B.step<p.len&&Math.abs(q.u-p.u)<1.9){if(r.zipT<.8&&r.onPadPrev!==p){r.onPadPrev=p;}r.zipT=Math.max(r.zipT,.9);return;}}r.onPadPrev=null;}

function progress(C,r,env){const f=r.q.prog;if(f>.4&&f<.6)r.half=true;
 if(r.f>.85&&f<.15){if(r.half){r.lap++;r.half=false;env.lap&&env.lap(r);}}else if(r.f<.15&&f>.85){r.lap--;r.half=true;}
 r.f=f;r.prog=r.lap+f;}

/* ---------- contact between racers ---------- */
export function collide(rs,env){for(let a=0;a<rs.length;a++)for(let b=a+1;b<rs.length;b++){const A=rs[a],B=rs[b];if(A.rescueT>0||B.rescueT>0)continue;
 const ra=A.boss?2.2:A.veh==='plane'?1.8:1.3,rb=B.boss?2.2:B.veh==='plane'?1.8:1.3;const dx=B.p.x-A.p.x,dz=B.p.z-A.p.z,dy=(B.p.y-A.p.y)*(A.veh==='plane'?1:.5);const d=Math.hypot(dx,dz,dy),R=ra+rb;
 if(d<R&&d>1e-4){const nx=dx/d,nz=dz/d,ov=R-d,wa=A.st.wt*(A.boss?3:1),wb=B.st.wt*(B.boss?3:1),sa=wb/(wa+wb),sb=wa/(wa+wb);A.p.x-=nx*ov*sa;A.p.z-=nz*ov*sa;B.p.x+=nx*ov*sb;B.p.z+=nz*ov*sb;
  if(A.veh==='hover'){A.vel.x-=nx*4*sa;A.vel.z-=nz*4*sa;}if(B.veh==='hover'){B.vel.x+=nx*4*sb;B.vel.z+=nz*4*sb;}
  const dv=B.v-A.v;A.v+=dv*.12*sa;B.v-=dv*.12*sb;env.bump&&env.bump(A,B,ov);}}}

/* ---------- pickups ---------- */
export function pickups(C,r,env,coinsOn){const plane=r.veh==='plane',rad=plane?3.4:2.3;
 for(const p of C.pods){if(p.t>0)continue;if(p.m.position.distanceToSquared(r.p)<(rad+.6)**2){p.t=2.5;if(!r.item&&r.roll_<=0){r.roll_=1;env.pod&&env.pod(r,p);}}}
 if(r.berries<10)for(const b of C.berries){if(b.t>0)continue;if(b.p.distanceToSquared(r.p)<(rad)**2){b.t=9;r.berries++;env.berry&&env.berry(r,b);}}
 if(coinsOn&&r.human>=0)for(const c of C.coins){if(c.got)continue;if(c.p.distanceToSquared(r.p)<(rad+.4)**2){c.got=1;r.coins++;env.coin&&env.coin(r,c);}}}

export function hitRacer(r,env,kind='hit'){if(r.rescueT>0||r.hitT>0||r.barrelT>0)return false;if(r.shield>0){r.shield=0;env.pop&&env.pop(r);return false;}
 r.spinT=1.1;r.spinDir=Math.random()<.5?-1:1;r.v*=.35;r.hitT=1.6;const lost=Math.min(r.berries,2);r.berries-=lost;r.drift.on=false;r.stats.hits++;if(r.veh!=='plane')r.vy=5,r.air=true;env.hurt&&env.hurt(r,lost,kind);return true;}
