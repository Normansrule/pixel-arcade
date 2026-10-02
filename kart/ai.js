// CRITTER KART — CPU drivers: racing line following for karts / hovercraft, 3D path + ring chasing for planes,
// drift timing, item tactics and rubber-band pacing relative to the human players. Bosses get hazards.
import {cl,wrapA} from './util.js';
import {at} from './course.js';
const _a={x:0,y:0,z:0};

export function think(C,r,rs,diff,ctx,dt){const I=r.inp,B=C.B,n=B.n,plane=r.veh==='plane',ai=r.ai;
 ai.t=(ai.t||0)+dt;
 // rubber band: compare against the best human
 const hum=rs.filter(o=>o.human>=0);let lead=hum.length?Math.max(...hum.map(o=>o.prog)):r.prog;const gap=lead-r.prog;// >0: cpu behind humans
 const sk=diff.skill*(r.boss?1.05:1)*(r.personal||1);
 r.rub=cl(diff.rub+(r.boss?.06:0)+cl(gap*(r.boss?.6:.45),-.14,.16),.78,1.22);
 if(ctx.finishedHumans)r.rub=1;
 // target point along the line
 const look=(plane?10:6)+Math.max(0,r.v)*(plane?.5:.42);const li=(r.idx+Math.round(look/B.step))%n;
 let u=B.line[li]*sk+r.laneOff*(1-sk*.6);
 // weave for pickups: nearest pod or berry ahead
 if(!r.item&&ai.t%4<2.4){for(const p of C.pods){let di=p.i-r.idx;if(di<0)di+=n;if(di>4&&di<26&&p.t<=0){u=p.u;break;}}}
 else if(r.berries<10){for(const b of C.berries){let di=b.i-r.idx;if(di<0)di+=n;if(di>3&&di<18&&b.t<=0){u=b.u;break;}}}
 // avoid goo / hazards just ahead
 for(const h of ctx.hazards){if(h.k!=='goo'&&h.k!=='ice'&&h.k!=='boulder')continue;const dx=h.p.x-r.p.x,dz=h.p.z-r.p.z;const fwd=dx*Math.sin(r.yaw)+dz*Math.cos(r.yaw);if(fwd>2&&fwd<26){const side=-dx*Math.cos(r.yaw)+dz*Math.sin(r.yaw);if(Math.abs(side)<3.5)u+=(side>0?-1:1)*4*sk;}}
 const tp=at(C,li,cl(u,-B.w[li]*.85,B.w[li]*.85));
 let tx=tp.x,tz=tp.z,ty=tp.y;
 if(plane&&C.rings.length){// aim through the next ring
  let best=null,bd=1e9;for(const g of C.rings){let di=g.i-r.idx;if(di<0)di+=n;if(di>2&&di<bd){bd=di;best=g;}}if(best&&bd*B.step<70){tx=best.p.x;tz=best.p.z;ty=best.p.y;}}
 if(r.magnetT>0&&r.magTarget){tx=r.magTarget.p.x;tz=r.magTarget.p.z;ty=r.magTarget.p.y;}
 const want=Math.atan2(tx-r.p.x,tz-r.p.z),da=wrapA(want-r.yaw);
 I.steer=cl(da*(plane?2.2:2.6),-1,1)*(.75+.25*sk);
 const curvAhead=Math.abs(B.curv[(r.idx+Math.round(18/B.step))%n]);
 I.gas=1;I.brake=0;
 if(!plane&&Math.abs(da)>.9&&r.v>16){I.gas=0;I.brake=.6;}
 // drift on sustained corners (better CPUs drift more)
 if(!plane){const drift=sk>.6&&curvAhead>.016&&r.v>18;if(drift&&!r.drift.on&&Math.abs(I.steer)>.4)I.drift=true;else if(r.drift.on)I.drift=r.drift.lvl<(sk>.9?2:1)||curvAhead>.012;else I.drift=false;if(r.veh==='hover')I.hop=false;}
 else{const dh=ty-r.p.y;I.pitch=cl(dh*.07-r.pitch*.6,-1,1);I.drift=false;I.hop=false;
  for(const h of ctx.hazards){if(h.o!==r&&(h.k==='hornet')&&h.target===r&&h.p.distanceTo(r.p)<12&&Math.random()<sk*.08)I.hop=true;}}
 // items
 I.item=false;if(r.item&&r.roll_<=0){ai.hold=(ai.hold||0)+dt;const it=r.item,use=diff.item*(r.boss?1.4:1);
  if(it==='zip'&&(ai.hold>1.2||r.v<15)&&curvAhead<.02)I.item=Math.random()<use*.5;
  else if(it==='bubble')I.item=ai.hold>.6||ctx.hazards.some(h=>h.k==='hornet'&&h.target===r);
  else if(it==='goo')I.item=rs.some(o=>o!==r&&r.prog-o.prog>0&&r.prog-o.prog<.06)&&Math.random()<use*.2;
  else if(it==='hornet'||it==='magnet')I.item=rs.some(o=>o!==r&&o.prog>r.prog&&o.prog-r.prog<.25)&&Math.random()<use*.12;
  else if(it==='darts'){const f=rs.find(o=>{if(o===r)return false;const dx=o.p.x-r.p.x,dz=o.p.z-r.p.z,d=Math.hypot(dx,dz);return d<60&&Math.abs(wrapA(Math.atan2(dx,dz)-r.yaw))<.12;});I.item=!!f&&Math.random()<use*.3;}
  if(ai.hold>9)I.item=true;if(I.item)ai.hold=0;}
 // boss hazards
 if(r.boss&&ctx.hazard){ai.hz=(ai.hz||2.5)-dt;const h=hum[0];if(ai.hz<=0&&h){const gapM=(r.prog-h.prog)*C.len;if(Math.abs(gapM)<140){ctx.hazard(r,h);ai.hz=r.bossHz==='bolt'?2.4:r.bossHz==='fire'?1.8:3.1;}else ai.hz=.8;}}}
