// FAIRWAY LEGENDS — CPU golfers. They plan with the real ball physics: candidate targets (the pin, lay-ups down the
// centreline), clubs that carry there, a fan of aim lines; each is simulated (wind, bounce, roll, hazards) and scored by
// expected strokes from where it stops. Each rival has a personality that shapes that plan (how much risk they take,
// how far they hit it, how they putt) and their execution errors, on top of the chosen difficulty.
import {CLUBS,PUTTER,LIES,ball,launch,simulate,carryOf} from './physics.js';
import {dropSpot} from './course.js';
export const DIFF=[{n:'EASY',pw:.08,err:.45,pd:.2,pa:.06,think:.8},{n:'NORMAL',pw:.055,err:.3,pd:.14,pa:.042,think:.6},{n:'HARD',pw:.03,err:.17,pd:.085,pa:.024,think:.45}];
// aggr: 0 plays safe (wide dispersion in the plan, favours lay-ups) .. 1 attacks every pin; boost: ball speed; err/pw/putt: execution scatter
export const PERSONAS={
 'ISLA BRENNAN':{tag:'THE SURGEON',aggr:.35,boost:1,err:.7,pw:.8,putt:1,think:1.2},
 'KAI LINDQVIST':{tag:'BOMBER',aggr:.75,boost:1.055,err:1.35,pw:1.1,putt:1.1,think:.6},
 'MATEO FERRAZ':{tag:'SHOTMAKER',aggr:.9,boost:1.02,err:.95,pw:.9,putt:1,think:.9},
 'HANA OKABE':{tag:'PUTTING WIZARD',aggr:.4,boost:.98,err:1.05,pw:1,putt:.55,think:1},
 'CALLUM REIDY':{tag:'GRINDER',aggr:.05,boost:.99,err:.85,pw:.85,putt:.9,think:1.3},
 'SOFIA MARCHETTI':{tag:'ICE COLD',aggr:.5,boost:1,err:.85,pw:.85,putt:.8,think:.8},
 'TOBIAS WREN':{tag:'GAMBLER',aggr:1,boost:1.03,err:1.25,pw:1.15,putt:1.15,think:.5},
 'AMARA OSEI':{tag:'ALL-ROUNDER',aggr:.5,boost:1.01,err:.9,pw:.9,putt:.9,think:.9}};
export const NEUTRAL={tag:'',aggr:.5,boost:1,err:1,pw:1,putt:1,think:1};
const H=Math.hypot;
export function expStrokes(T,p,lie){const d=H(p.x-T.pin.x,p.z-T.pin.z);
 if(lie==='green')return 1+Math.min(1.15,d<.8?0:.35+d/14);
 const base=d<25?2.15+d/60:d<120?2.5+d/400:2.75+(d-120)/210;
 return base+({tee:0,fairway:0,fringe:-.12,rough:.28,deep:.75,sand:d<40?.35:.55}[lie]||0);}
function outcome(T,b,from,risk){if(b.st==='holed')return 0;if(b.st==='water'||b.st==='ob'){const e=b.land||b.p,dp=dropSpot(T,e,from);return(1+expStrokes(T,dp,T.surf(dp.x,dp.z)))*risk;}
 return expStrokes(T,b.p,T.surf(b.p.x,b.p.z));}
/** Best shot from position p with lie, for the given wind. Returns {club,pw,yaw,shape,range,score}. */
export function plan(T,p,lie,wind,per=NEUTRAL){const y=T.h(p.x,p.z);const dp=H(T.pin.x-p.x,T.pin.z-p.z);
 if(lie==='green'||(lie==='fringe'&&dp<14)||(lie==='fairway'&&dp<9&&T.field(p.x,p.z,1)>-5))return planPutt(T,p,lie,wind);
 // risk appetite: cautious players plan with a wider spread and fear hazards more; gamblers plan tight and love the pin
 const spread=.4-per.aggr*.28,risk=1.25-per.aggr*.35,boost=per.boost||1;
 const tg=[{x:T.pin.x,z:T.pin.z,pin:true}];const pr=T.proj(p.x,p.z);for(let s=pr.s+60;s<T.S-30;s+=35)tg.push(T.ptAt(s,0));
 let best=null;const maxC=carryOf(0)*LIES[lie].pw*1.04*boost;
 for(const t of tg){const dist=H(t.x-p.x,t.z-p.z);if(dist>maxC*1.12&&!t.pin)continue;const want=t.pin?dist*.95:dist*.92;
  let ci=-1,pw=1;for(let c=PUTTER-1;c>=0;c--){if(c===0&&lie!=='tee')continue;const full=carryOf(c)*LIES[lie].pw*boost;if(full>=want*.97){ci=c;pw=Math.min(1,want/full);break;}}
  if(ci<0){ci=lie==='tee'?0:1;pw=1;}if(lie==='sand'&&ci<9&&dist<60){ci=11;pw=Math.min(1,want/(carryOf(11)*.93));}if(pw<.3&&ci<12){ci=12;pw=Math.min(1,want/carryOf(12));}
  const a0=Math.atan2(t.x-p.x,t.z-p.z);
  for(const off of[-.05,-.025,0,.025,.05]){const o={club:ci,pw,yaw:a0+off,shape:0,lie,boost};let sc=0;for(const e of[-spread,0,spread]){const b=ball(p.x,y,p.z);launch(b,{...o,err:e});const r=simulate(b,T,wind,16);sc+=outcome(T,r.b,p,risk)*(e?0.3:0.4);}
   if(t.pin)sc-=per.aggr*.06;if(!best||sc<best.score)best={...o,score:sc,pin:!!t.pin};}}
 return best;}
function planPutt(T,p,lie,wind){const y=T.h(p.x,p.z),a0=Math.atan2(T.pin.x-p.x,T.pin.z-p.z),d=H(T.pin.x-p.x,T.pin.z-p.z),range=Math.max(3,d*1.7);let best=null;
 const tryP=(yaw,pw)=>{const b=ball(p.x,y,p.z);launch(b,{club:PUTTER,pw,range,yaw,lie});const r=simulate(b,T,wind,20);const e=r.b.st==='holed'?-1+Math.abs(pw-d*1.15/range)*.1:H(r.b.p.x-T.pin.x,r.b.p.z-T.pin.z)+(r.b.st!=='rest'?9:0);if(!best||e<best.e)best={club:PUTTER,pw,range,yaw,shape:0,lie,e};};
 for(let i=-6;i<=6;i++)for(let k=0;k<8;k++)tryP(a0+i*.035,(d/range)*(.85+k*.1));
 const b0=best;for(let i=-2;i<=2;i++)for(let k=-2;k<=2;k++)tryP(b0.yaw+i*.009,b0.pw+k*.015*(d/range));return best;}
/** add the CPU's human-like error */
export function execute(pl,dk,R=Math.random,per=NEUTRAL){const D=DIFF[dk],g=()=>{let s=0;for(let i=0;i<4;i++)s+=R();return(s-2)/.58;};
 if(pl.club===PUTTER)return{...pl,pw:pl.pw*(1+g()*D.pd*.5*per.putt),yaw:pl.yaw+g()*D.pa*.5*per.putt,err:0};
 return{...pl,pw:Math.min(1.08,pl.pw*(1+g()*D.pw*per.pw)),err:Math.max(-1,Math.min(1,g()*D.err*per.err)),yaw:pl.yaw+g()*D.err*.012*per.err};}
export function clubFor(T,p,lie,boost=1){const d=H(T.pin.x-p.x,T.pin.z-p.z);if(lie==='green')return PUTTER;for(let c=PUTTER-1;c>=0;c--){if(c===0&&lie!=='tee')continue;if(carryOf(c)*LIES[lie].pw*1.04*boost>=d)return c;}return lie==='tee'?0:1;}
export {CLUBS};
