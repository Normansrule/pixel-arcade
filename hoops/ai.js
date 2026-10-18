// COURT KINGS — CPU basketball: spacing spots, pick and roll, cuts, shot selection by expected points and the shot clock,
// lead passes to the open man, drives + rim finishes, on-ball pressure, help defence and rotations, switching on screens,
// steals, contests and blocks, box-outs and rebounding, transition and set-piece positioning.
import {S,shoot,drive,pass,move,steal,block,canDunk,contestOf,shotProb,openness,laneClear,dHoop,reach,hum,opp} from './match.js';
import {C,CT,hoopOf,isThree} from './physics.js';
import {act} from './rig.js';
const hyp=Math.hypot,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=Math.random,lerp=(a,b,t)=>a+(b-a)*t;
const SP5=[[7.4,0],[5.6,5.2],[5.6,-5.2],[.7,-6.7],[1.3,2.6]],SP3=[[7.4,0],[4.4,5.6],[1.5,-2.6]];
export function resetPlays(team){for(const T of S.teams){if(team!=null&&T.idx!==team)continue;T.play=null;T.helper=null;T.flip=rnd()<.5?1:-1;for(const p of T.pl){p.ai.cutT=0;p.ai.jumpAt=-1;}}
 // default man-to-man: matching slots
 if(S.teams.length===2)for(const T of S.teams)T.pl.forEach((p,i)=>{p.mark=opp(T.idx).pl[i];});}
const spotOf=(p,H,T)=>{const sp=(S.street?SP3:SP5)[p.slot]||[5,0];return{x:H.x-H.s*sp[0],z:sp[1]*(T.flip||1)};};
function go(p,x,z,spr=false){if(S.phase==='live'&&S.ball.owner===p){x=cl(x,CT.xmin+.7,CT.xmax-.7);z=cl(z,-C.W+.7,C.W-.7);}p.ai.tx=x;p.ai.tz=z;p.ai.spr=spr;}
function toward(a,H,d){const ux=H.x-a.p.x,uz=-a.p.z,l=hyp(ux,uz)||1;return{x:a.p.x+ux/l*d,z:a.p.z+uz/l*d};}
/* ================= entry ================= */
export function aiThink(S_,dt){const b=S.ball;
 for(const T of S.teams){const D=T.diff;teamDefense(T,dt);
  for(const p of T.pl){const cpu=!hum(p);p.ai.t-=dt;
   if(S.phase!=='live'){setPiece(p,T);continue;}
   if(b.owner){if(b.owner.team===T.idx)offense(p,T,cpu,dt);else defense(p,T,cpu,dt);}else free(p,T,cpu,dt);}}}
/* ================= offence ================= */
function offense(p,T,cpu,dt){const b=S.ball,H=hoopOf(p.team);p.def=false;p.hands=false;p.ai.face=null;
 if(b.owner===p){if(cpu)handler(p,T,dt);return;}
 offBall(p,T,dt);}
function handler(p,T,dt){const H=hoopOf(p.team),D=T.diff,d=dHoop(p);p.ai.face={x:H.x,z:0};
 if(p.act||p.stun>0)return;
 const back=!S.street&&(p.p.x*H.s<0);
 if(p.ai.t>0){return;}p.ai.t=.1+(1-D.iq)*.22+rnd()*.08;
 const urg=1-S.sc/S.scLen;
 if(S.street&&S.clear[p.team]){const a=cl(Math.atan2(p.p.z,(p.p.x-H.x)*-H.s),-1.2,1.2);go(p,H.x-H.s*Math.cos(a)*8.4,Math.sin(a)*8.4,true);return;}
 if(back){const sp=spotOf(p,H,T);const ahead=opp(p.team).pl.filter(o=>(o.p.x-p.p.x)*H.s>0).length;go(p,sp.x,cl(p.p.z,-4,4),ahead<=1);
  if(ahead===0&&d<12){go(p,H.x,0,true);}
  // outlet to a team-mate already up the floor and open
  const up=T.pl.find(m=>m!==p&&(m.p.x-p.p.x)*H.s>6&&openness(m)>3.5&&laneClear(p,m.p.x,m.p.z,p.team,.9));if(up&&rnd()<.35*D.iq)pass(p,up);return;}
 const c=contestOf(p),three=isThree(H,p.p.x,p.p.z),q=shotProb(p,d,c),ev=q*(three?3:2);
 // shot discipline: smarter CPUs only fire with a cleaner look; dunk or lay it in, rolled once per trip to the rim
 const ctol=.62-.32*D.iq,lane=laneClear(p,H.x,0,p.team,.8);if(!(p.ai.finT>S.time)){p.ai.finT=S.time+1.4;p.ai.finR=rnd();}const dk=canDunk(p)&&p.ai.finR<cl((p.at.dunk-64)/28,0,1)*(lane?.75:.3)*(.4+.6*D.iq);
 const drv=p.ai.drv>S.time;if(drv&&d>=4.1){const ux=H.x-p.p.x,uz=-p.p.z,ul=hyp(ux,uz)||1;if(d<5.6&&c<.3&&rnd()<.3){shoot(p,false);return;}
  // the drive is cut off: pull up from mid-range
  if(!lane&&!three&&d<7.2&&c<ctol+.1&&rnd()<.3*(.5+D.iq*.5)){shoot(p,false);return;}go(p,p.p.x+ux/ul*3-uz/ul*p.ai.ds*.7,p.p.z+uz/ul*3+ux/ul*p.ai.ds*.7,true);return;}
 // finish at the rim (or a floater over a big in the way)
 if(d<4.1&&(lane||d<1.9||drv)){if(dk){drive(p,true);return;}if(d<2.5){drive(p,false);return;}if(!lane&&c<ctol+.2&&rnd()<.25){shoot(p,false);return;}go(p,H.x,0,true);return;}
 // take the shot?
 let thr=1.14-urg*.62+(three?(p.at.three>85?-.02:.2):0)+(D.iq-.82)*.15+Math.min(0,D.iq-.82)*.5;if(S.sc<2.2||(S.clock<2.5&&!S.street&&S.clock<S.sc))thr=-1;
 if((ev>thr&&c<(three?ctol-.06:ctol))||thr<0){if(d<3.2)drive(p,dk);else shoot(p,false);return;}
 // look for the open man
 let best=null,bv=-1;for(const m of T.pl){if(m===p)continue;const dm=dHoop(m),om=openness(m),cm=cl((2.3-om)/1.6,0,1);let v=shotProb(m,dm,cm)*(isThree(H,m.p.x,m.p.z)?3:2);
  if(m.ai.cutT>0||(T.play&&T.play.scr===m&&T.play.ph==='roll'))v+=.35;if(!laneClear(p,m.p.x+m.v.x*.3,m.p.z+m.v.z*.3,p.team,.7))continue;const dd=hyp(m.p.x-p.p.x,m.p.z-p.p.z);if(dd<2.5||dd>16)continue;if(v>bv){bv=v;best=m;}}
 const lob=best&&dHoop(best)<4.2&&best.at.dunk>=60&&(best.ai.cutT>0||T.play&&T.play.scr===best&&T.play.ph==='roll')&&rnd()<.5;
 if(best&&(bv>ev+.22+(1-D.iq)*.3-(p.holdT>2.5?.3:0)-urg*.2||(p.holdT>4&&bv>.6))){pass(p,best,lob);return;}
 // pick and roll
 if(!T.play&&d<10.5&&rnd()<.22*D.iq&&S.sc>8){const scr=[...T.pl].filter(m=>m!==p).sort((a,b)=>(b.pos==='C'?2:b.pos==='PF'?1:0)-(a.pos==='C'?2:a.pos==='PF'?1:0))[0];if(scr)T.play={k:'pnr',scr,h:p,ph:'go',t:0,side:rnd()<.5?-1:1};}
 const pl=T.play;if(pl&&pl.h===p){if(pl.ph==='set'||pl.ph==='roll'){const sc=pl.scr,ux=H.x-sc.p.x,uz=-sc.p.z,ul=hyp(ux,uz)||1;go(p,sc.p.x-uz/ul*pl.side*1.3+ux/ul*2.2,sc.p.z+ux/ul*pl.side*1.3+uz/ul*2.2,true);}
  else{const sp=spotOf(p,H,T);go(p,lerp(p.p.x,sp.x,.3),p.p.z,false);}return;}
 // beat the man in front of you
 const dfd=opp(p.team).pl.find(o=>o.mark===p);const df=dfd?hyp(dfd.p.x-p.p.x,dfd.p.z-p.p.z):9;
 if(df<1.4&&p.moveCD<=0&&rnd()<.3*(p.at.hand/85)){const r=rnd(),kind=d>7.4&&p.at.three>78&&r<.35?'step':r<.7?'cross':'spin';move(p,kind,rnd()<.5?-1:1);return;}
 if(d<10&&laneClear(p,H.x,0,p.team,.7)&&rnd()<.8){p.ai.drv=S.time+1.2;p.ai.ds=0;const t=toward(p,H,3);go(p,t.x,t.z,true);return;}
 if(dfd&&d<10.5&&rnd()<.65*D.iq){// attack the gap beside the defender
  const ux=H.x-p.p.x,uz=-p.p.z,ul=hyp(ux,uz)||1,lx=-uz/ul,lz=ux/ul,side=((dfd.p.x-p.p.x)*lx+(dfd.p.z-p.p.z)*lz)>0?-1:1;const tx=p.p.x+ux/ul*2.6+lx*side*1.5,tz=p.p.z+uz/ul*2.6+lz*side*1.5;
  if(Math.abs(tz)<C.W-.8){p.ai.drv=S.time+1.1;p.ai.ds=side;go(p,tx,tz,true);return;}}
 // probe: jab around the top of the floor
 const sp=spotOf(p,H,T);go(p,sp.x+(rnd()-.5)*3,sp.z*.6+(rnd()-.5)*4,false);}
function offBall(p,T,dt){const b=S.ball,H=hoopOf(p.team),hd=b.owner,pl=T.play;p.ai.face={x:hd.p.x,z:hd.p.z};
 // the pick and roll big
 if(pl&&pl.scr===p){pl.t+=dt;const h=pl.h,dfd=opp(p.team).pl.find(o=>o.mark===h)||h;const ux=H.x-h.p.x,uz=-h.p.z,ul=hyp(ux,uz)||1;
  if(pl.ph==='go'){const tx=dfd.p.x-uz/ul*pl.side*.62+ux/ul*.15,tz=dfd.p.z+ux/ul*pl.side*.62+uz/ul*.15;go(p,tx,tz,true);if(hyp(tx-p.p.x,tz-p.p.z)<.5||pl.t>3.2){pl.ph='set';pl.t=0;act(p,'screen',1.3);p.v.set(0,0,0);S.fx('screen',p);}}
  else if(pl.ph==='set'){go(p,p.p.x,p.p.z);if(pl.t>1.1){pl.ph='roll';pl.t=0;}}
  else{go(p,H.x-H.s*1.3,pl.side*.9,true);if(pl.t>2.4)T.play=null;}
  if(hd!==pl.h&&pl.ph!=='roll')T.play=null;return;}
 // cutting
 if(p.ai.cutT>0){p.ai.cutT-=dt;go(p,H.x-H.s*1.2,p.ai.cutZ,true);return;}
 const sp=spotOf(p,H,T);let tx=sp.x,tz=sp.z;
 // backcourt: run the floor (wings and bigs sprint ahead on the break)
 if(!S.street&&hd.p.x*H.s<0){tx=lerp(sp.x,H.x-H.s*3,p.slot>0&&p.slot<3?.5:0);go(p,tx,tz,true);return;}
 // shift away from a driving handler's side so the lane stays open
 if(dHoop(hd)<4.5&&p.slot>=3)tz=sp.z*1.1;
 // don't stand on top of the handler
 const dd=hyp(tx-hd.p.x,tz-hd.p.z);if(dd<3){tz+=(tz>hd.p.z?1:-1)*2.5;}
 go(p,tx,tz,hyp(tx-p.p.x,tz-p.p.z)>3);
 // backdoor / basket cut when the defender is ball-watching
 const df=opp(p.team).pl.find(o=>o.mark===p);if(df&&p.ai.t<=0){p.ai.t=.5+rnd()*.5;const lazy=hyp(df.p.x-p.p.x,df.p.z-p.p.z)>2.3||((df.p.x-H.x)*-H.s>(p.p.x-H.x)*-H.s+.5);
  if(hyp(p.p.x-tx,p.p.z-tz)<1.2&&rnd()<(lazy?.32:.06)*T.diff.iq){p.ai.cutT=1.7;p.ai.cutZ=(rnd()-.5)*1.6;}}}
/* ================= defence ================= */
function teamDefense(T,dt){const b=S.ball,own=b.owner;T.helpT=(T.helpT||0)-dt;if(!own||own.team===T.idx||S.phase!=='live'){T.helper=null;return;}const D=T.diff;
 const H=hoopOf(own.team),od=dHoop(own),d0=T.pl.find(p=>p.mark===own);
 if(T.helper&&(T.helpT<=0||od>6.5))T.helper=null;
 if(!T.helper&&d0&&od<6&&rnd()<D.help){const beaten=d0.stun>0||hyp(d0.p.x-own.p.x,d0.p.z-own.p.z)>2||hyp(d0.p.x-H.x,d0.p.z)>od+.3;
  if(beaten){let best=null,bv=1e9;const pt=toward(own,H,1.2);for(const p of T.pl){if(p===d0||p.stun>0)continue;const m=p.mark,md=m?hyp(m.p.x-own.p.x,m.p.z-own.p.z):9;const v=hyp(p.p.x-pt.x,p.p.z-pt.z)-md*.25;if(v<bv){bv=v;best=p;}}if(best){T.helper=best;T.helpT=1.4;}}}
 // switch on a set screen
 const OP=S.teams[own.team].play;if(D.sw&&OP&&OP.ph==='set'&&d0&&!OP.sw){const scr=OP.scr,d1=T.pl.find(p=>p.mark===scr);if(d1&&hyp(scr.p.x-d0.p.x,scr.p.z-d0.p.z)<1.2&&hyp(own.p.x-d0.p.x,own.p.z-d0.p.z)>1.5&&rnd()<.7){d0.mark=scr;d1.mark=own;OP.sw=1;S.fx('switch',d1);}}}
function defense(p,T,cpu,dt){const b=S.ball,own=b.owner,D=T.diff,man=p.mark||own,H=hoopOf(man.team);p.def=true;p.ai.face={x:own.p.x,z:own.p.z};
 if(p.stun>0)return;
 const md=dHoop(man);let tx,tz,spr=false;
 if(T.helper===p){const t=toward(own,H,.95);tx=t.x;tz=t.z;spr=true;p.hands=true;}
 else if(man===own){const gap=md>9.5?2.6:md>7.8?1.25:1.05+(1-D.iq)*.35;const t=toward(man,H,gap),lag=.12-D.react*.9+(man.ai.drv>S.time?.22:0);tx=t.x+man.v.x*lag;tz=t.z+man.v.z*lag;spr=hyp(tx-p.p.x,tz-p.p.z)>1.6;
  p.hands=!!(man.act&&man.act.k==='shoot')||(md<8&&man.hold);
  if(cpu){const dd=hyp(own.p.x-p.p.x,own.p.z-p.p.z);
   if(dd<1.35&&p.stealCD<=0&&!own.act&&rnd()<dt*.22*D.steal*(p.at.stl/80)){steal(p);}
   if(own.act&&(own.act.k==='shoot'||own.act.k==='layup'||own.act.k==='dunk')&&p.ai.jumpAt<0&&dd<2.1&&rnd()<D.block*(.55+p.at.blk/250)){p.ai.jumpAt=S.time+D.react*(.55+rnd()*.6)+(own.act.k==='shoot'?.18:0);}}}
 else{const dm=hyp(man.p.x-own.p.x,man.p.z-own.p.z),help=cl((dm-3.2)/8,0,.55)*D.help;const t=toward(man,H,1.4);const mx=(own.p.x+H.x)/2,mz=own.p.z/2;tx=lerp(t.x,mx,help);tz=lerp(t.z,mz,help);
  // the big protects the paint when his man is out on the perimeter
  if((p.pos==='C'||S.street&&p.slot===2)&&md>6.5){tx=lerp(tx,H.x-H.s*2.2,.45);tz=lerp(tz,0,.45);}
  spr=hyp(tx-p.p.x,tz-p.p.z)>2.5;p.hands=false;
  // contest the nearest shooter if he goes up
  if(cpu&&own.act&&own.act.k!=='move'&&(own.act.k==='layup'||own.act.k==='dunk')&&p.ai.jumpAt<0&&hyp(own.p.x-p.p.x,own.p.z-p.p.z)<2.2&&rnd()<D.block*(.3+p.at.blk/200))p.ai.jumpAt=S.time+D.react*(.5+rnd()*.5);}
 if(cpu&&p.ai.jumpAt>0&&S.time>=p.ai.jumpAt){p.ai.jumpAt=-1;if(hyp(own.p.x-p.p.x,own.p.z-p.p.z)<2.2)block(p);}
 go(p,tx,tz,spr);}
/* ================= loose ball, shots in the air, passes ================= */
function free(p,T,cpu,dt){const b=S.ball,pz=b.pass,sh=b.shot;p.hands=false;
 if(pz){if(pz.to===p){const t=p.ai.catchT||pz.tgt;go(p,t.x,t.z,true);p.ai.face={x:b.p.x,z:b.p.z};
   if(pz.oop&&cpu!==false&&p.p.y<=0){const bh=hyp(b.v.x,b.v.z)||1,tt=hyp(t.x-b.p.x,t.z-b.p.z)/bh;if(tt<.42&&!p.act){if(block(p))act(p,'dunk',99,{v:0});}}return;}
  // everyone else keeps their shape around the receiver
  if(pz.team===p.team){const H=hoopOf(p.team),sp=spotOf(p,H,T);go(p,sp.x,sp.z);}else{const man=p.mark,H=man?hoopOf(man.team):null;if(man){const t=toward(man,H,1.3);go(p,t.x,t.z,true);}p.def=true;}
  return;}
 const H=hoopOf(p.team);
 // a shot on its way up: box out or crash
 if(sh&&!sh.rim&&!sh.ft&&sh.t<1.6){if(sh.team===p.team){if(p===sh.by){go(p,p.p.x,p.p.z);return;}const big=p.pos==='C'||p.pos==='PF'||S.street&&p.slot===2;if(big||rnd()<.002){const a=cl(Math.atan2(p.p.z,(p.p.x-H.x)*-H.s),-1.2,1.2);go(p,H.x-H.s*Math.cos(a)*1.7,Math.sin(a)*1.7,true);}else if(p.pos==='PG'&&!S.street){go(p,H.x-H.s*8,0);}}
  else{const man=p.mark;const Hm=hoopOf(1-p.team);if(man&&dHoop(man)<5.5){const ux=Hm.x-man.p.x,uz=-man.p.z,ul=hyp(ux,uz)||1;go(p,man.p.x+ux/ul*.7,man.p.z+uz/ul*.7,true);p.ai.face={x:man.p.x,z:man.p.z};}
   else{const a=Math.atan2(p.p.z,(p.p.x-Hm.x)*-Hm.s);go(p,Hm.x-Hm.s*Math.cos(a)*2.4,Math.sin(a)*2.4,true);}}return;}
 // loose / off the rim: go and get it
 const land=landing(p);const d=hyp(land.x-p.p.x,land.z-p.p.z);
 const rank=S.pl.filter(q=>q.team===p.team&&q.stun<=0).map(q=>hyp(land.x-q.p.x,land.z-q.p.z)).sort((a,b)=>a-b).indexOf(d);
 if(rank<=1||d<4){go(p,land.x,land.z,true);p.ai.face={x:b.p.x,z:b.p.z};}
 else{const sp=spotOf(p,H,T);go(p,lerp(p.p.x,sp.x,.5),lerp(p.p.z,sp.z,.5));}
 if(cpu&&p.p.y<=0&&p.jumpCD<=0&&b.v.y<.5){const dh=hyp(b.p.x-p.p.x,b.p.z-p.p.z),r=reach(p);if(dh<1.3&&b.p.y>r-.15&&b.p.y<r+.85){block(p);}}}
function landing(p){const pr=S.pred,b=S.ball;const r=reach(p)+.3;for(let i=0;i<pr.length;i++){const q=pr[i];if(q.y<r&&(i===0||pr[i-1].y>=q.y))return q;}return pr.length?pr[pr.length-1]:b.p;}
/* ================= set pieces: dead balls, inbounds, checks ================= */
function setPiece(p,T){const H=hoopOf(p.team),sp=spotOf(p,H,T);p.hands=false;
 if(S.phase==='dead'){const ls=S.lastScore,fresh=ls&&S.time-ls.t<3;if(fresh){if(ls.team===p.team){// get back on D
    const Hd=hoopOf(1-p.team),dsp=(S.street?SP3:SP5)[p.slot];go(p,lerp(p.p.x,Hd.x-Hd.s*dsp[0]*.7,.7),lerp(p.p.z,dsp[1]*.6,.5),!S.street);p.def=true;}
   else{go(p,lerp(p.p.x,sp.x,.35),lerp(p.p.z,sp.z,.35));p.def=false;}}else go(p,p.p.x,p.p.z);
  p.ai.face={x:S.ball.p.x,z:S.ball.p.z};return;}
 if(S.phase==='inbound'&&S.inb){const I=S.inb;p.ai.face={x:I.by.p.x,z:I.by.p.z};if(p===I.by)return;
  if(p.team===I.team){p.def=false;const inx=I.by.p.x,inz=I.by.p.z,s=Math.sign(inx)||1;
   if(p.slot===0||(I.by.slot===0&&p.slot===1)){if(I.kind==='make')go(p,inx-s*3.4,cl(inz*.4+(inz>0?-2:2),-5,5),true);else go(p,inx+(rnd()<.5?2:-2)*0+1.5*H.s,C.W-3.2,true);}
   else go(p,sp.x,sp.z,true);}
  else{p.def=true;const man=p.mark;if(man){if(I.kind==='make'){const Hd=hoopOf(1-p.team),dsp=(S.street?SP3:SP5)[p.slot];go(p,Hd.x-Hd.s*dsp[0]*.8,dsp[1]*.7,true);}else{const t=toward(man,hoopOf(man.team),1.5);go(p,t.x,t.z,true);}}}
  return;}
 if(S.phase==='check'||S.phase==='ft'||S.phase==='tip'){go(p,p.p.x,p.p.z);}}
