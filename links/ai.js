// FAIRWAY LEGENDS — CPU golfers. They plan with the real ball physics: candidate targets (the pin, lay-ups down the
// centreline), clubs that carry there, a fan of aim lines; each is simulated (wind, bounce, roll, hazards) and scored by
// expected strokes from where it stops. Execution then adds skill-based power / accuracy errors.
import {CLUBS,PUTTER,LIES,ball,launch,simulate,carryOf} from './physics.js';
import {dropSpot} from './course.js';
export const DIFF=[{n:'EASY',pw:.08,err:.45,pd:.2,pa:.06,think:.8},{n:'NORMAL',pw:.055,err:.3,pd:.14,pa:.042,think:.6},{n:'HARD',pw:.03,err:.17,pd:.085,pa:.024,think:.45}];
const H=Math.hypot;
export function expStrokes(T,p,lie){const d=H(p.x-T.pin.x,p.z-T.pin.z);
 if(lie==='green')return 1+Math.min(1.15,d<.8?0:.35+d/14);
 const base=d<25?2.15+d/60:d<120?2.5+d/400:2.75+(d-120)/210;
 return base+({tee:0,fairway:0,fringe:-.12,rough:.28,deep:.75,sand:d<40?.35:.55}[lie]||0);}
function outcome(T,b,from){if(b.st==='holed')return 0;if(b.st==='water'||b.st==='ob'){const e=b.land||b.p,dp=dropSpot(T,e,from);return 1+expStrokes(T,dp,T.surf(dp.x,dp.z));}
 return expStrokes(T,b.p,T.surf(b.p.x,b.p.z));}
/** Best shot from position p with lie, for the given wind. Returns {club,pw,yaw,shape,range,score}. */
export function plan(T,p,lie,wind){const y=T.h(p.x,p.z);const toPin=Math.atan2(T.pin.x-p.x,T.pin.z-p.z),dp=H(T.pin.x-p.x,T.pin.z-p.z);
 if(lie==='green'||(lie==='fringe'&&dp<14)||(lie==='fairway'&&dp<9&&T.field(p.x,p.z,1)>-5))return planPutt(T,p,lie,wind);
 // candidate targets: pin, plus centreline lay-ups
 const tg=[{x:T.pin.x,z:T.pin.z,pin:true}];const pr=T.proj(p.x,p.z);for(let s=pr.s+60;s<T.S-30;s+=35)tg.push(T.ptAt(s,0));
 let best=null;const maxC=carryOf(0)*LIES[lie].pw*1.04;
 for(const t of tg){const dist=H(t.x-p.x,t.z-p.z);if(dist>maxC*1.12&&!t.pin)continue;const want=t.pin?dist*.95:dist*.92;
  // club + power that carries ~want
  let ci=-1,pw=1;for(let c=PUTTER-1;c>=0;c--){if(c===0&&lie!=='tee')continue;const full=carryOf(c)*LIES[lie].pw;if(full>=want*.97){ci=c;pw=Math.min(1,want/full);break;}}
  if(ci<0){ci=lie==='tee'?0:1;pw=1;}if(lie==='sand'&&ci<9&&dist<60){ci=11;pw=Math.min(1,want/(carryOf(11)*.93));}if(pw<.3&&ci<12){ci=12;pw=Math.min(1,want/carryOf(12));}
  const a0=Math.atan2(t.x-p.x,t.z-p.z);
  for(const off of[-.05,-.025,0,.025,.05]){const o={club:ci,pw,yaw:a0+off,shape:0,lie};let sc=0;for(const e of[-.25,0,.25]){const b=ball(p.x,y,p.z);launch(b,{...o,err:e});const r=simulate(b,T,wind,16);sc+=outcome(T,r.b,p)*(e?0.3:0.4);}
   if(!best||sc<best.score)best={...o,score:sc};}}
 return best;}
function planPutt(T,p,lie,wind){const y=T.h(p.x,p.z),a0=Math.atan2(T.pin.x-p.x,T.pin.z-p.z),d=H(T.pin.x-p.x,T.pin.z-p.z),range=Math.max(3,d*1.7);let best=null;
 const tryP=(yaw,pw)=>{const b=ball(p.x,y,p.z);launch(b,{club:PUTTER,pw,range,yaw,lie});const r=simulate(b,T,wind,20);const e=r.b.st==='holed'?-1+Math.abs(pw-d*1.15/range)*.1:H(r.b.p.x-T.pin.x,r.b.p.z-T.pin.z)+(r.b.st!=='rest'?9:0);if(!best||e<best.e)best={club:PUTTER,pw,range,yaw,shape:0,lie,e};};
 for(let i=-6;i<=6;i++)for(let k=0;k<8;k++)tryP(a0+i*.035,(d/range)*(.85+k*.1));
 const b0=best;for(let i=-2;i<=2;i++)for(let k=-2;k<=2;k++)tryP(b0.yaw+i*.009,b0.pw+k*.015*(d/range));return best;}
/** add the CPU's human-like error */
export function execute(pl,dk,R=Math.random){const D=DIFF[dk],g=()=>{let s=0;for(let i=0;i<4;i++)s+=R();return(s-2)/.58;};
 if(pl.club===PUTTER)return{...pl,pw:pl.pw*(1+g()*D.pd*.5),yaw:pl.yaw+g()*D.pa*.5,err:0};
 return{...pl,pw:Math.min(1.08,pl.pw*(1+g()*D.pw)),err:Math.max(-1,Math.min(1,g()*D.err)),yaw:pl.yaw+g()*D.err*.012};}
export function clubFor(T,p,lie){const d=H(T.pin.x-p.x,T.pin.z-p.z);if(lie==='green')return PUTTER;for(let c=PUTTER-1;c>=0;c--){if(c===0&&lie!=='tee')continue;if(carryOf(c)*LIES[lie].pw*1.04>=d)return c;}return lie==='tee'?0:1;}
export {CLUBS};
