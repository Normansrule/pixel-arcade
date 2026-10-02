// KART GRAND PRIX — kart handling: throttle, steering, hop-drift with 3-stage mini-turbos, tricks, gliding, surfaces, walls, falls.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,wrapA} from './util.js';
import {query,F,SURF} from './trackmath.js';
import {arenaHeight} from './world.js';

export const G=34,DT=1/60;
export const DRIFT_LV=[1.0,2.0,3.1],MT_TIME=[0,.75,1.3,2.0];
export const KMH=3.4;

export function newKart(o){return{...o,p:new V(),vel:new V(),yaw:0,spd:0,steerV:0,ground:true,airT:0,gy:0,gyPrev:0,q:{},drift:0,driftT:0,driftLv:0,driftArm:false,hop:0,
 boost:0,boostPow:1.3,boostCol:null,aura:0,shrink:0,spin:0,tumble:0,squish:0,invuln:0,coins:0,item:null,itemN:0,roulette:0,rollFor:null,orbs:0,orbA:0,
 prog:0,lastS:null,lap:1,place:1,finished:null,glide:false,trickWin:0,trick:0,trickDone:false,respawn:0,safe:null,surf:0,under:false,
 ctrl:{thr:0,brake:0,steer:0,drift:false,item:false,back:false,look:false},pDrift:false,pItem:false,land:0,accelVis:0,prevSpd:0,
 rb:1,balloons:3,pops:0,out:false,hits:0,stats:{items:0,hits:0,falls:0,mt:0,tricks:0}};}

export function maxSpeed(k,cc){const s=k.stats_;return cc.v*(.92+s.spd*.028)*(1+Math.min(10,k.coins)*.006)*(k.human<0?k.rb:1);}

// ground info for the battle arena
export function arenaQuery(A,x,z,o){const r=Math.hypot(x,z);o.ok=true;o.inside=r<A.R-1.4;o.onRoad=true;o.y=arenaHeight(x,z,A.R);o.baseY=o.y;o.surf=SURF.road;o.flag=0;o.gap=false;o.ramp=null;o.pads=null;o.r=r;o.B=null;o.u=0;o.lim=A.R-1.4;o.prog=0;o.patch=null;return o;}

const tv=new V(),tv2=new V();
// ctx: {C (course) | A (arena), cc, W (world), ev(type,...), fall:boolean theme, time}
export function stepKart(k,ctx,dt){
 const c=k.ctrl,cc=ctx.cc,st=k.stats_;
 if(k.respawn>0){k.respawn-=dt;if(k.respawn<=0)placeAtSafe(k,ctx);return;}
 if(k.out)return;
 // timers
 if(k.boost>0)k.boost-=dt;if(k.aura>0)k.aura-=dt;if(k.shrink>0)k.shrink-=dt;if(k.invuln>0)k.invuln-=dt;if(k.squish>0)k.squish-=dt;
 const hurt=k.spin>0||k.tumble>0;if(k.spin>0)k.spin-=dt;if(k.tumble>0)k.tumble-=dt;
 // ---------- ground query ----------
 const q=k.q;if(ctx.A)arenaQuery(ctx.A,k.p.x,k.p.z,q);else query(ctx.C,k.p.x,k.p.z,k.p.y,q);
 let gy=-1e4,wallHit=0;
 if(q.ok){
  if(q.inside){gy=q.gap?-1e4:q.y;}
  else{const edgeFall=!ctx.A&&((ctx.fall&&!(q.flag&F.rail))||(q.flag&F.noWall));
   if(edgeFall){gy=-1e4;}
   else if(ctx.A){const r=q.r||1,nx=k.p.x/r,nz=k.p.z/r,ex=r-q.lim;k.p.x-=nx*ex;k.p.z-=nz*ex;const vn=k.vel.x*nx+k.vel.z*nz;if(vn>0){k.vel.x-=nx*vn*1.6;k.vel.z-=nz*vn*1.6;wallHit=vn;}gy=q.y;}
   else{const sg=Math.sign(q.u),ex=Math.abs(q.u)-q.lim;k.p.x-=q.nx*sg*ex;k.p.z-=q.nz*sg*ex;const vn=(k.vel.x*q.nx+k.vel.z*q.nz)*sg;if(vn>0){k.vel.x-=q.nx*sg*vn*1.6;k.vel.z-=q.nz*sg*vn*1.6;wallHit=vn;}gy=q.y;}}}
 if(ctx.A)for(const p of ctx.A.cols){const dx=k.p.x-p.x,dz=k.p.z-p.z,d=Math.hypot(dx,dz),m=p.r+1.1;if(d<m&&d>0){const nx=dx/d,nz=dz/d;k.p.x+=nx*(m-d);k.p.z+=nz*(m-d);const vn=-(k.vel.x*nx+k.vel.z*nz);if(vn>0){k.vel.x+=nx*vn*1.6;k.vel.z+=nz*vn*1.6;wallHit=Math.max(wallHit,vn);}}}
 if(wallHit>3){if(k.drift&&wallHit>8){k.drift=0;k.driftT=0;}k.spd*=Math.max(.55,1-wallHit*.02);ctx.ev('wall',k,wallHit);}
 // surface
 let surf=q.ok?q.surf:SURF.off;
 const pads=q.ok&&q.B&&q.B.padAt?q.B.padAt[q.i]:null;let padHit=null;
 if(pads)for(const p of pads){if(Math.abs(q.u-p.u)<=(p.kind==='glide'?q.lim+.5:Math.min(p.hw,q.w)+.4)){if(p.kind==='patch')surf=p.surf;else padHit=p;}}
 if(q.inside&&!q.onRoad&&q.B&&q.B.kind==='main'&&surf===SURF.road)surf=SURF.off;
 k.surf=surf;k.under=ctx.W&&ctx.W.waterY!==undefined&&k.p.y<ctx.W.waterY-.9;
 // ---------- speed targets ----------
 let vmax=maxSpeed(k,cc);const boosting=k.boost>0;
 const trc=.52+st.trc*.065;
 if(k.ground&&k.aura<=0&&!boosting){if(surf===SURF.off)vmax*=trc;else if(surf===SURF.mud)vmax*=trc*.78;else if(surf===SURF.sand)vmax*=Math.min(1,trc*1.1);}
 if(k.under)vmax*=.88;if(k.shrink>0)vmax*=.72;if(k.aura>0)vmax*=1.16;if(k.squish>0)vmax*=.6;
 if(boosting)vmax*=k.boostPow;
 // ---------- velocity frame ----------
 const sy=Math.sin(k.yaw),cy=Math.cos(k.yaw);let vF=k.vel.x*sy+k.vel.z*cy,vL=k.vel.x*cy-k.vel.z*sy;
 const accRate=(.55+st.acc*.11)*cc.acc;
 let thr=hurt||ctx.frozen?0:c.thr,brk=hurt||ctx.frozen?0:c.brake,steer=hurt?0:c.steer;
 if(k.ground||k.glide){
  if(boosting&&vF<vmax){vF+=Math.max(30,(vmax-vF)*3)*dt;if(vF>vmax)vF=vmax;}
  else if(thr>0){if(vF<vmax)vF+=(vmax-vF)*accRate*thr*dt+(vF<6?7*dt:0);else vF+=(vmax-vF)*Math.min(1,dt*2.2);}
  else if(brk>0){vF-=(vF>0?44:14)*brk*dt;if(vF<-cc.v*.32)vF=-cc.v*.32;}
  else{vF*=Math.exp(-.55*dt);if(vF>vmax)vF+=(vmax-vF)*Math.min(1,dt*2.2);}
  if(hurt)vF*=Math.exp(-2.6*dt);}
 else{vF*=Math.exp(-.05*dt);}
 // ---------- steering + drift ----------
 const spdF=cl(Math.abs(vF)/12,0,1),hdl=(1.72+st.hdl*.12)*(k.shrink>0?1.1:1);
 k.steerV+=(steer-k.steerV)*Math.min(1,dt*(Math.abs(steer)>Math.abs(k.steerV)?9:12));
 const dPress=c.drift&&!k.pDrift,dRel=!c.drift&&k.pDrift;k.pDrift=c.drift;
 if(dPress&&k.ground&&!hurt&&vF>6&&!ctx.frozen){k.vel.y=5.2;k.ground=false;k.hop=1;k.driftArm=true;ctx.ev('hop',k);}
 if(dPress&&!k.ground&&k.trickWin>0&&!k.trickDone&&!hurt){k.trick=.5;k.trickDone=true;ctx.ev('trick',k);}
 else if(dPress&&!k.ground&&!hurt)k.driftArm=true;
 if(!c.drift)k.driftArm=false;
 if(k.driftArm&&k.ground&&!k.drift&&Math.abs(steer)>.3&&vF>11)k.drift=Math.sign(steer);
 if(k.drift&&(dRel||vF<9||hurt||!c.drift)){if(k.driftLv>0&&!hurt){const t=MT_TIME[k.driftLv]*(.85+st.mt*.06);k.boost=Math.max(k.boost,t);k.boostPow=1.3;k.boostCol=k.driftLv;ctx.ev('mt',k,k.driftLv);k.stats.mt++;}k.drift=0;k.driftT=0;k.driftLv=0;}
 let yawRate;
 const turn=hdl*spdF*(1-.22*cl(vF/cc.v,0,1.3))*Math.sign(vF||1);
 if(k.drift){const inner=steer*k.drift;yawRate=k.drift*Math.abs(turn)*(.62+.5*inner)*1.12;if(k.ground){k.driftT+=dt*(.65+.75*Math.max(0,inner));const lv=k.driftT>=DRIFT_LV[2]?3:k.driftT>=DRIFT_LV[1]?2:k.driftT>=DRIFT_LV[0]?1:0;if(lv>k.driftLv){k.driftLv=lv;ctx.ev('driftlv',k,lv);}}}
 else yawRate=k.steerV*turn;
 if(!k.ground&&!k.glide)yawRate*=.55;if(k.glide)yawRate*=.8;
 if(k.spin>0){k.yaw+=dt*11;}else k.yaw=wrapA(k.yaw+yawRate*dt);
 // lateral grip
 let grip=k.drift?4.2:13;if(k.ground&&k.aura<=0){if(surf===SURF.ice)grip=k.drift?1.4:2.2;else if(surf===SURF.oil)grip=1.8;}if(!k.ground)grip=k.glide?3:.6;
 vL*=Math.exp(-grip*dt);if(k.drift&&k.ground)vL+=-k.drift*Math.min(vF,30)*.42*dt;
 // recompose
 const sy2=Math.sin(k.yaw),cy2=Math.cos(k.yaw);
 // when the heading changes, most forward speed follows the nose (arcade), the rest is lateral slip
 k.vel.x=sy2*vF+cy2*vL;k.vel.z=cy2*vF-sy2*vL;k.spd=vF;
 // pads
 const nearG=k.ground||(q.ok&&k.p.y-q.y<2.6&&k.vel.y<6);
 if(padHit&&padHit.kind==='glide'&&!k.glide&&nearG){k.vel.y=9.5;k.ground=false;k.hop=1;k.glide=true;k.drift=0;k.driftT=0;k.driftLv=0;k.trickWin=.5;k.trickDone=false;if(Math.hypot(k.vel.x,k.vel.z)<cc.v*.9){const f=cc.v*.92/Math.max(1,Math.hypot(k.vel.x,k.vel.z));k.vel.x*=f;k.vel.z*=f;}ctx.ev('glide',k);padHit=null;}
 if(padHit&&nearG){if(padHit.kind==='boost'){if(k.boost<1.0){ctx.ev('pad',k);}k.boost=Math.max(k.boost,1.1);k.boostPow=1.42;k.boostCol=4;}
  else if(padHit.kind==='jump'){k.vel.y=13;k.ground=false;k.hop=1;k.trickWin=.6;k.trickDone=false;ctx.ev('spring',k);}
  else if(padHit.kind==='glide'){k.vel.y=11.5;k.ground=false;k.hop=1;k.glide=true;k.trickWin=.5;k.trickDone=false;if(k.vel.length()<cc.v*.9){const f=cc.v*.92/Math.max(1,Math.hypot(k.vel.x,k.vel.z));k.vel.x*=f;k.vel.z*=f;}ctx.ev('glide',k);}}
 // ---------- vertical ----------
 let g=G*(k.under?.55:1);if(k.glide){g=9/(st.glide||1);}
 k.vel.y-=g*dt;if(k.glide){const term=(c.brake>0&&!ctx.frozen?-11:-5)/(st.glide||1);if(k.vel.y<term)k.vel.y+=(term-k.vel.y)*Math.min(1,dt*4);}
 k.p.x+=k.vel.x*dt;k.p.z+=k.vel.z*dt;k.p.y+=k.vel.y*dt;
 const wasGround=k.ground;const prevRamp=k.lastRamp;
 if(k.p.y<=gy){const impact=-k.vel.y;k.p.y=gy;let gv=wasGround?(gy-k.gyPrev)/dt:0;gv=cl(gv,-30,30);k.vel.y=gv;
  if(!wasGround){k.land=Math.min(1,impact/14);ctx.ev('land',k,impact);if(k.trick>0||k.trickDone){if(!hurt){k.boost=Math.max(k.boost,.9);k.boostPow=1.3;k.boostCol=5;ctx.ev('trickboost',k);k.stats.tricks++;}}k.trickDone=false;k.trick=0;k.trickWin=0;k.glide=false;
   if(k.tumble>0)k.vel.y=0;}
  k.ground=true;k.airT=0;}
 else if(wasGround&&k.p.y-gy<.45&&gy>-1e3&&!k.hop){k.p.y=gy;k.vel.y=cl((gy-k.gyPrev)/dt,-30,8);}
 else{if(wasGround){k.airT=0;if(prevRamp&&prevRamp.trick){k.trickWin=.55;k.trickDone=false;}else if(k.vel.y>3.5){k.trickWin=.35;k.trickDone=false;}}k.ground=false;k.airT+=dt;}
 k.lastRamp=k.ground&&q.ok?q.ramp:null;
 if(k.hop&&k.ground)k.hop=0;if(k.hop&&k.airT>.6)k.hop=0;
 if(k.trickWin>0)k.trickWin-=dt;if(k.trick>0)k.trick-=dt;
 k.gyPrev=gy<-1e3?k.p.y:gy;
 // remember a safe spot
 if(k.ground&&q.ok&&q.inside&&!q.gap&&q.B&&!ctx.A){k.safe={B:q.B,i:q.i,u:cl(q.u,-q.w*.5,q.w*.5)};}
 if(ctx.A&&k.ground)k.safe={x:k.p.x,z:k.p.z,yaw:k.yaw};
 // falls (pits, off the edge, into lava)
 const floor=q.ok&&q.B?q.baseY-16:(k.safe&&k.safe.B?k.safe.B.y[k.safe.i]-16:-30);
 if(k.p.y<floor||(ctx.W&&ctx.W.lavaY!==undefined&&k.p.y<ctx.W.lavaY+.4)){fall(k,ctx,q);}
 k.accelVis=(k.spd-k.prevSpd)/dt;k.prevSpd=k.spd;}

function fall(k,ctx,q){k.respawn=1.7;k.drift=0;k.driftT=0;k.driftLv=0;k.boost=0;k.glide=false;k.vel.set(0,0,0);k.spd=0;k.stats.falls++;
 // fell into a gap → come back after it
 if(q.ok&&q.B&&q.gap){const B=q.B;let e=q.i;while(B.flag[e%B.n]&F.gap&&e-q.i<400)e++;k.safe={B,i:(e+4)%B.n,u:0};}
 else if(k.safe&&k.safe.B){const B=k.safe.B;let i=k.safe.i;for(let s=0;s<14;s++){const j=(i+s)%B.n;if(B.flag[j]&F.gap){let e=j;while(B.flag[e%B.n]&F.gap&&e-j<400)e++;k.safe={B,i:(e+4)%B.n,u:0};break;}}}
 ctx.ev('fall',k);}
export function placeAtSafe(k,ctx){const s=k.safe;if(!s){return;}
 if(s.B){const B=s.B,i=B.closed?(s.i-1+B.n)%B.n:Math.max(0,s.i-1);k.p.set(B.x[i]+B.nx[i]*(s.u||0),B.y[i]+.5,B.z[i]+B.nz[i]*(s.u||0));k.yaw=Math.atan2(B.tx[i],B.tz[i]);}
 else{k.p.set(s.x,arenaHeight(s.x,s.z,ctx.A.R)+.5,s.z);k.yaw=s.yaw;}
 k.vel.set(Math.sin(k.yaw)*6,0,Math.cos(k.yaw)*6);k.spd=6;k.ground=false;k.gyPrev=k.p.y;k.invuln=2;k.respawn=0;ctx.ev('respawn',k);}

// kart vs kart
export function collideKarts(a,b,ev){if(a.respawn>0||b.respawn>0||a.out||b.out)return;const ra=a.shrink>0?.7:1.25,rb=b.shrink>0?.7:1.25;
 const dx=b.p.x-a.p.x,dz=b.p.z-a.p.z,dy=b.p.y-a.p.y,d=Math.hypot(dx,dz);if(d>ra+rb||d<1e-4||Math.abs(dy)>2)return;
 const nx=dx/d,nz=dz/d,wa=1+a.stats_.wgt*.3+(a.aura>0?6:0)-(a.shrink>0?.8:0),wb=1+b.stats_.wgt*.3+(b.aura>0?6:0)-(b.shrink>0?.8:0),ov=ra+rb-d,ta=wb/(wa+wb),tb=wa/(wa+wb);
 a.p.x-=nx*ov*ta;a.p.z-=nz*ov*ta;b.p.x+=nx*ov*tb;b.p.z+=nz*ov*tb;
 const rv=(b.vel.x-a.vel.x)*nx+(b.vel.z-a.vel.z)*nz;if(rv<0){const j=-(1.6)*rv/(1/wa+1/wb);a.vel.x-=nx*j/wa;a.vel.z-=nz*j/wa;b.vel.x+=nx*j/wb;b.vel.z+=nz*j/wb;
  // extra shove sideways so bumping feels weighty
  const sh=Math.min(8,-rv*.5);a.vel.x-=nx*sh*ta;a.vel.z-=nz*sh*ta;b.vel.x+=nx*sh*tb;b.vel.z+=nz*sh*tb;}
 ev('bump',a,b,-rv);}
