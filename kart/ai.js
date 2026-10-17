// CRITTER KART — CPU drivers: racing-line following (karts / hovercraft), 3D path + ring chasing (planes),
// drift timing by difficulty, ramp tricks, shortcut decisions, hazard + item avoidance, item tactics and a fair rubber band
// (capped catch-up / hold-back that fades out over the last half of the final lap). Bosses get hazards.
import {cl,wrapA,sstep} from './util.js';
import {at,atK} from './course.js';
const _t={x:0,y:0,z:0};

export function think(C,r,rs,diff,ctx,dt){const I=r.inp,B=C.B,n=B.n,plane=r.veh==='plane',ai=r.ai;
 ai.t=(ai.t||0)+dt;I.item=false;
 // ---- fair rubber band against the best human ----
 const hum=rs.filter(o=>o.human>=0&&!o.ghost);const lead=hum.length?Math.max(...hum.map(o=>o.prog)):r.prog;const gapM=(lead-r.prog)*C.len;// >0: CPU behind the humans
 const laps=ctx.laps||3;let band=gapM>0?diff.up*sstep(25,280,gapM):-diff.down*sstep(25,240,-gapM);
 if(r.lap>=laps&&r.f>.5)band*=.3;// honest finish
 r.rub=(r.boss?1.03+band*.8:diff.base*(r.personal||1)+band);if(ctx.finishedHumans||!hum.length)r.rub=diff.base*(r.personal||1);
 const sk=diff.skill*(r.boss?1.05:1)*(r.personal||1);
 // ---- shortcut decision when approaching a branch mouth ----
 let K=r.q.cut||null;
 if(!K&&!plane){for(const k of C.cuts){const d=(k.ia-r.idx+n)%n;if(d>2&&d<34){if(ai.cutFor!==k){ai.cutFor=k;const boosted=r.zipT>.4||r.item==='zip'||r.item==='zip3'||r.frenzyT>0;const ch=k.surf==='off'?(boosted?diff.cut+.15:diff.cut*.1):diff.cut;ai.takeCut=Math.random()<ch;}if(ai.takeCut)K=k;break;}}}
 if(!K&&ai.cutFor&&((r.idx-ai.cutFor.ia+n)%n)>ai.cutFor.span+4&&((r.idx-ai.cutFor.ia+n)%n)<n-40)ai.cutFor=null;
 // ---- target point ----
 const look=(plane?10:6)+Math.max(0,r.v)*(plane?.5:.42);let tx,tz,ty;
 if(K&&!plane){let ci=r.q.cut===K?r.q.ci:0;if(r.q.cut!==K){// steer for the mouth of the branch
   const d=(K.ia-r.idx+n)%n;ci=Math.max(0,Math.round(look/K.step)-d);}
  const want=ci+Math.round(look/K.step);let tp;
  if(want>K.n-1){// past the end of the branch: aim further along the main road
   const endMain=(K.ia+K.span)%n,li=(endMain+Math.round((want-(K.n-1))*K.step/B.step))%n;tp=at(C,li,B.line[li]*sk*.5);}
  else tp=atK(K,want,0);tx=tp.x;tz=tp.z;ty=tp.y;
  // use a zip in the grass
  if(r.q.cut===K&&r.q.offSurf===1&&r.zipT<=0&&(r.item==='zip'||r.item==='zip3'))I.item=true;}
 else{const li=(r.idx+Math.round(look/B.step))%n;let u=B.line[li]*sk+r.laneOff*(1-sk*.6);
  // weave for pickups: nearest pod or berry ahead
  if(!r.item&&ai.t%4<2.4){for(const p of C.pods){let di=p.i-r.idx;if(di<0)di+=n;if(di>4&&di<26&&p.t<=0){u=p.u;break;}}}
  else if(r.berries<10){for(const b of C.berries){if(b.cut)continue;let di=b.i-r.idx;if(di<0)di+=n;if(di>3&&di<18&&b.t<=0){u=b.u;break;}}}
  // dodge dropped goo, boulders and live hazards just ahead
  const sy=Math.sin(r.yaw),cy=Math.cos(r.yaw);
  const dodge=(px,pz,rad)=>{const dx=px-r.p.x,dz=pz-r.p.z;const fw=dx*sy+dz*cy;if(fw>2&&fw<28){const side=-dx*cy+dz*sy;if(Math.abs(side)<rad+2)u+=(side>0?-1:1)*(rad+2.5)*sk;}};
  for(const h of ctx.hazards){if(h.k!=='goo'&&h.k!=='ice'&&h.k!=='boulder')continue;dodge(h.p.x,h.p.z,1.5);}
  if(ctx.obs&&sk>.5)for(const o of ctx.obs)dodge(o.p.x,o.p.z,o.r);
  // occasional wobble for weaker CPUs
  if(diff.mistake&&Math.sin(ai.t*.7+(r.personal||1)*40)>1-diff.mistake*.4)u+=Math.sin(ai.t*3)*B.w[li]*.5;
  const tp=at(C,li,cl(u,-B.w[li]*.85,B.w[li]*.85));tx=tp.x;tz=tp.z;ty=tp.y;}
 if(plane&&C.rings.length){// aim through the next ring
  let best=null,bd=1e9;for(const g of C.rings){let di=g.i-r.idx;if(di<0)di+=n;if(di>2&&di<bd){bd=di;best=g;}}if(best&&bd*B.step<70){tx=best.p.x;tz=best.p.z;ty=best.p.y;}}
 if(r.magnetT>0&&r.magTarget){tx=r.magTarget.p.x;tz=r.magTarget.p.z;ty=r.magTarget.p.y;}
 const want=Math.atan2(tx-r.p.x,tz-r.p.z),da=wrapA(want-r.yaw);
 I.steer=cl(da*(plane?2.2:2.6),-1,1)*(.75+.25*Math.min(1,sk));
 const curvAhead=Math.abs(B.curv[(r.idx+Math.round(18/B.step))%n]);
 I.gas=1;I.brake=0;
 if(!plane&&Math.abs(da)>.9&&r.v>16){I.gas=0;I.brake=.6;}
 // corner speed: compare the yaw rate a bend needs with what the kart can deliver (drifting helps)
 if(!plane&&r.veh==='kart'&&!r.air){let cm=0;const K2=r.q.cut;if(K2){for(let k=2;k<16;k++){const j=Math.min(K2.n-1,r.q.ci+k);cm=Math.max(cm,Math.abs(K2.curv[j]));}}
  for(let k=Math.round(4/B.step);k<Math.round((10+r.v*.9)/B.step);k++)cm=Math.max(cm,Math.abs(B.curv[(r.idx+k)%n]));
  const top=31*r.st.top*r.cc.top,avail=(r.drift.on?2.3:1.95)*r.st.han*(1-.26*Math.min(1.2,r.v/top)),need=r.v*cm,slack=.9+.12*sk;
  if(need>avail*slack*1.3&&r.v>12){I.gas=0;I.brake=.55;}else if(need>avail*slack&&r.v>12){I.gas=0;}}
 if(!plane){
  // drift through sustained corners; better CPUs hold it for orange / purple sparks
  if(curvAhead<.008)ai.dr=null;else if(ai.dr==null&&curvAhead>.014)ai.dr=Math.random()<diff.drift*.9+.05;const wantDrift=!!ai.dr&&curvAhead>.014&&r.v>18;
  if(r.drift.on){const hold=sk>.95?3:sk>.7?2:1;I.drift=r.drift.lvl<hold&&curvAhead>.006||curvAhead>.012;if(r.drift.t>4)I.drift=false;}
  else if(r.drift.arm&&(r.air||ai.wantD>0)){I.drift=true;ai.wantD-=dt;}// keep holding through the hop
  else if(wantDrift&&Math.abs(I.steer)>.4&&ai.dcool<=0){I.drift=true;ai.dcool=.6;ai.wantD=.5;}else{I.drift=false;ai.wantD=0;}
  ai.dcool=(ai.dcool||0)-dt;
  // ramp tricks
  if(r.air&&r.trickWin>0&&!r.trickDone&&r.trickWin<.45&&Math.random()<sk*.25)I.drift=true;
  if(r.veh==='hover')I.hop=false;}
 else{const dh=ty-r.p.y;I.pitch=cl(dh*.07-r.pitch*.6,-1,1);I.drift=false;I.hop=false;
  for(const h of ctx.hazards){if(h.o!==r&&(h.k==='hornet')&&h.target===r&&h.p.distanceTo(r.p)<12&&Math.random()<sk*.08)I.hop=true;}}
 // ---- items ----
 if(r.item&&r.roll_<=0&&!I.item){ai.hold=(ai.hold||0)+dt;const it=r.item,use=diff.item*(r.boss?1.4:1);
  if((it==='zip'||it==='zip3')&&(ai.hold>1.2||r.v<15)&&curvAhead<.02&&!ai.takeCut)I.item=Math.random()<use*.5;
  else if(it==='bubble')I.item=ai.hold>.6||ctx.hazards.some(h=>h.k==='hornet'&&h.target===r);
  else if(it==='goo')I.item=rs.some(o=>o!==r&&r.prog-o.prog>0&&r.prog-o.prog<.06)&&Math.random()<use*.2;
  else if(it==='hornet'||it==='magnet')I.item=rs.some(o=>o!==r&&o.prog>r.prog&&o.prog-r.prog<.25)&&Math.random()<use*.12;
  else if(it==='darts'){const f=rs.find(o=>{if(o===r||o.ghost)return false;const dx=o.p.x-r.p.x,dz=o.p.z-r.p.z,d=Math.hypot(dx,dz);return d<60&&Math.abs(wrapA(Math.atan2(dx,dz)-r.yaw))<.12;});I.item=!!f&&Math.random()<use*.3;}
  else if(it==='frenzy')I.item=ai.hold>.8&&Math.random()<use*.4;
  else if(it==='storm')I.item=ai.hold>1.5&&r.place>1&&Math.random()<use*.3;
  if(ai.hold>9)I.item=true;if(I.item)ai.hold=0;}
 // ---- boss hazards ----
 if(r.boss&&ctx.hazard){ai.hz=(ai.hz||2.5)-dt;const h=hum[0];if(ai.hz<=0&&h){const gm=(r.prog-h.prog)*C.len;if(Math.abs(gm)<140){ctx.hazard(r,h);ai.hz=r.bossHz==='bolt'?2.4:r.bossHz==='fire'?1.8:3.1;}else ai.hz=.8;}}}
