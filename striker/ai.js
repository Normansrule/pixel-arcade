// STRIKER 11 — team AI: shape that breathes with the ball, pressing + marking, off-ball runs, support angles,
// carrier decisions (shoot / pass / through ball / cross / dribble / skill), goalkeeper positioning and saves.
import {P,crossing,passSpeed} from './physics.js';
const cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=Math.random,hyp=Math.hypot,fwdOf=p=>({x:Math.sin(p.face),z:Math.cos(p.face)});
export const active=p=>!p.off&&!p.hidden;
export function topSpeed(p,diff){return(6.6+(p.at.pace-60)*.05)*(diff?diff.pace:1);}
function intercept(p,pred,react,maxH,sp){for(const q of pred){if(q.y>maxH)continue;const d=hyp(q.x-p.p.x,q.z-p.p.z)-.55;if(react+Math.max(0,d)/sp<=q.t)return{t:q.t,x:q.x,z:q.z};}
 const l=pred[pred.length-1];return{t:l.t+hyp(l.x-p.p.x,l.z-p.p.z)/sp,x:l.x,z:l.z};}
// clearance between a pass segment and the opponents (negative = would be cut out)
// time race along a ground pass: >0 seconds of margin before any opponent can reach the ball's path (negative = cut out)
export function lane(ax,az,bx,bz,opp,end=8){const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1,len=Math.sqrt(l2),v0=passSpeed(len,end),va=(v0+end)/2;let m=9;
 for(const o of opp){if(!active(o)||o.stun>0)continue;const t=cl(((o.p.x-ax)*dx+(o.p.z-az)*dz)/l2,0,1),px=ax+dx*t,pz=az+dz*t;const tb=t*len/va;
  const to=.22+Math.max(0,hyp(o.p.x-px,o.p.z-pz)-.75)/7.4;const mg=to-tb;if(mg<m)m=mg;}return m;}
function nearestOpp(x,z,opp){let m=99,who=null;for(const o of opp){if(!active(o))continue;const d=hyp(o.p.x-x,o.p.z-z);if(d<m){m=d;who=o;}}return[m,who];}
export function homeSpot(p,T,att,bx,bz){const s=p.slot,dir=T.dir;let uz=s.z+(att?.15:0)+(bz-.5)*(att?.55:.62);
 if(p.role==='DF')uz=cl(uz,.06,att?.58:.44);else if(p.role==='MF')uz=cl(uz,.14,att?.8:.6);else uz=cl(uz,.28,att?.9:.68);
 const wf=att?.92:.6;const wx=-s.x*dir*P.W*wf+bx*(att?.16:.36);return{x:cl(wx,-P.W+1.2,P.W-1.2),z:dir*(-P.L+2*P.L*uz)};}
export function teamThink(M,t){const T=M.teams[t],O=M.teams[1-t],b=M.ball,dir=T.dir,D=T.diff;
 const mine=T.pl.filter(p=>active(p)&&p.role!=='GK'),opp=O.pl.filter(active);
 const owner=b.owner||b.held,own=owner&&owner.team===t,theirs=owner&&owner.team!==t,loose=!owner;
 const att=own||(loose&&M.lastTeam===t&&M.passLive);const bz=(b.p.z*dir+P.L)/(2*P.L);
 const us=opp.map(o=>o.p.z*dir).sort((a,c)=>c-a);const offLine=Math.max(us[1]??0,0,b.p.z*dir);T.offLine=offLine;
 for(const p of mine){const sp=topSpeed(p,D);p.ai.ic=intercept(p,M.pred,D.react*.6,2.0,sp);}
 const byT=mine.slice().sort((a,c)=>a.ai.ic.t-c.ai.ic.t);
 let chaser=null,presser=null,presser2=null;
 if(loose){chaser=byT[0];if(M.passTo&&M.passTo.team===t&&active(M.passTo)&&M.passTo.ai.ic.t<chaser.ai.ic.t+.6)chaser=M.passTo;
  if(chaser&&chaser.ctl>=0){/* human chases on his own */}}
 if(theirs){const c=owner;let best=99;for(const p of mine){const d=hyp(p.p.x-c.p.x,p.p.z-c.p.z)/topSpeed(p,D)+(p.role==='FW'&&c.p.z*dir<-P.L*.3?1.5:0);p.ai.pd=d;if(d<best){best=d;presser=p;}}
  if(T.press2||D.press>.95||(D.press>.7&&c.p.z*dir<-P.L*.4)){let b2=99;for(const p of mine){if(p===presser)continue;if(p.ai.pd<b2){b2=p.ai.pd;presser2=p;}}}}
 // marking assignments (defending)
 const marks=new Map();if(!att){const threats=opp.filter(o=>o.role!=='GK'&&o!==owner).sort((a,c)=>a.p.z*dir-c.p.z*dir);const free=mine.filter(p=>p!==presser&&p!==presser2&&p!==chaser&&p.role!=='FW');
  for(const o of threats){let best=null,bd=17;for(const p of free){if(marks.has(p))continue;const h=homeSpot(p,T,false,b.p.x,bz);const d=hyp(h.x-o.p.x,h.z-o.p.z);if(d<bd){bd=d;best=p;}}if(best)marks.set(best,o);}}
 const carrierMates=own?mine.filter(p=>p!==owner).sort((a,c)=>hyp(a.p.x-owner.p.x,a.p.z-owner.p.z)-hyp(c.p.x-owner.p.x,c.p.z-owner.p.z)).slice(0,2):[];
 for(const p of mine){if(p.ctl>=0&&!p.assist)continue;const ai=p.ai;ai.sprint=false;ai.mode='shape';ai.look=null;ai.runT=Math.max(0,(ai.runT||0)-.1);
  let h=homeSpot(p,T,att,b.p.x,bz);let tx=h.x,tz=h.z;
  if(p===owner){ai.mode='carry';continue;}
  if(p===chaser&&loose){ai.mode='chase';tx=ai.ic.x;tz=ai.ic.z;ai.sprint=hyp(tx-p.p.x,tz-p.p.z)>3;}
  else if(p===presser){ai.mode='press';const c=owner,gx=0,gz=-dir*P.L;const dx=gx-c.p.x,dz=gz-c.p.z,dl=hyp(dx,dz)||1;const lead=Math.min(1.2,hyp(c.p.x-p.p.x,c.p.z-p.p.z)/8);
   tx=c.p.x+c.v.x*lead*.5+dx/dl*.9;tz=c.p.z+c.v.z*lead*.5+dz/dl*.9;ai.sprint=hyp(tx-p.p.x,tz-p.p.z)>4*D.press;ai.look=c;
   const dc=hyp(c.p.x-p.p.x,c.p.z-p.p.z);if(p.tackleCD<=0&&p.stun<=0){const f=fwdOf(p),fa=((c.p.x-p.p.x)*f.x+(c.p.z-p.p.z)*f.z)/(dc||1);
    const cf=fwdOf(c),bh=((p.p.x-c.p.x)*cf.x+(p.p.z-c.p.z)*cf.z)/(dc||1);if(dc<1.7&&fa>.3&&(bh>-.35||rnd()<.15)&&rnd()<D.tackle*.55)M.act.tackle(p);else if(dc>1.8&&dc<3.6&&fa>.75&&bh>-.2&&hyp(c.v.x,c.v.z)>4.5&&rnd()<.035*D.tackle*(c.p.z*dir<-P.L*.2?1.6:1))M.act.slide(p);}}
  else if(p===presser2){ai.mode='cover';const c=owner;let mm=null,md=99;for(const o of opp){if(o===c||o.role==='GK')continue;const d=hyp(o.p.x-c.p.x,o.p.z-c.p.z);if(d<md){md=d;mm=o;}}
   if(mm){tx=(c.p.x+mm.p.x)/2;tz=(c.p.z+mm.p.z)/2;}else{tx=c.p.x;tz=c.p.z-dir*3;}ai.sprint=true;ai.look=c;}
  else if(marks.has(p)){const o=marks.get(p);ai.mode='mark';const gz=-dir*P.L,dx=-o.p.x*.15,dz=gz-o.p.z,dl=hyp(dx,dz)||1;const mx=o.p.x+dx/dl*1.8,mz=o.p.z+dz/dl*1.8;
   tx=mx*.72+h.x*.28;tz=mz*.72+h.z*.28;if((tz-o.p.z)*dir>-.8)tz=o.p.z-dir*1.2;ai.sprint=hyp(tx-p.p.x,tz-p.p.z)>6;ai.look=b;}
  else if(att){// attacking shape: runs in behind, support angles, stay onside
   if(own&&carrierMates.includes(p)&&p.role!=='DF'){const c=owner,side=(p.p.x-c.p.x)>=0?1:-1;const sx=c.p.x+side*9,sz=c.p.z+dir*(p.role==='FW'?8:2);let bx=sx,bzz=sz,bo=-1;
    for(const o of[[sx,sz],[sx,sz+dir*6],[c.p.x+side*14,c.p.z-dir*3],[h.x,h.z]]){const[d]=nearestOpp(o[0],o[1],opp);if(d>bo){bo=d;bx=o[0];bzz=o[1];}}tx=bx*.7+h.x*.3;tz=bzz*.7+h.z*.3;ai.mode='support';}
   if((p.role==='FW'||p.role==='MF'&&Math.abs(p.slot.x)>.6)&&own&&owner.p.z*dir>-P.L*.5&&ai.runT<=0&&p.p.z*dir<=offLine+.3&&rnd()<.06*(p.role==='FW'?1.5:1)){ai.runT=2.4;ai.runX=cl(p.p.x*.6,-P.BW,P.BW);}
   if(ai.runT>0){tx=ai.runX;tz=dir*Math.min(P.L-P.SD,offLine+9);ai.sprint=true;ai.mode='run';}
   else if(M.offsideOn&&tz*dir>offLine-.6)tz=dir*(offLine-.8);}
  tx=cl(tx,-P.W+.6,P.W-.6);tz=cl(tz,-P.L+.6,P.L-.6);ai.tx=tx;ai.tz=tz;}}

/* ---------- ball carrier ---------- */
export function carrierThink(M,p,dt){const T=M.teams[p.team],O=M.teams[1-p.team],D=T.diff,dir=T.dir,ai=p.ai;const opp=O.pl.filter(active),mates=T.pl.filter(m=>active(m)&&m!==p);
 const gz=dir*P.L,pu=p.p.z*dir,dG=hyp(p.p.x,gz-p.p.z);let[press]=nearestOpp(p.p.x,p.p.z,opp);
 // forward cone pressure
 let front=9;for(const o of opp){const dx=o.p.x-p.p.x,dz=o.p.z-p.p.z,d=hyp(dx,dz);if(d<9&&dz*dir>-.3&&Math.abs(dx)<d*.95+.5)front=Math.min(front,d);}
 ai.held=(M.ball.owner===p?(ai.held||0)+dt:0);ai.dT-=dt;if(ai.dT>0){dribbleMove(p,opp,dir,front);return;}
 ai.dT=(.4+rnd()*.4)*D.decide;
 const opts=[];const noise=()=>(rnd()-.5)*.9*D.passErr;
 if(dG<32&&pu>0){let s=Math.pow(1-dG/32,1.1)*7.5*(p.at.shot/78)+(dG>16&&front<5?.6:0);const bl=lane(p.p.x,p.p.z,0,gz,opp.filter(o=>o.role!=='GK'),20);if(bl<-.1)s-=1.6;if(dG<14)s+=2.4;if(dG<9)s+=2;
  if(Math.abs(p.p.x)>P.GW+(P.L-Math.abs(p.p.z))*1.1&&dG<20)s-=2.2;if(press<1.3)s-=.6;opts.push({k:'shot',v:s});}
 for(const m of mates){if(m.role==='GK'&&!(press<2.5&&pu<-P.L*.4))continue;if(m.stun>0)continue;const mx=m.p.x+m.v.x*.45,mz=m.p.z+m.v.z*.45,d=hyp(mx-p.p.x,mz-p.p.z);if(d<4.5||d>44)continue;
  const ln=lane(p.p.x,p.p.z,mx,mz,opp),[open]=nearestOpp(mx,mz,opp),prog=mz*dir-pu;if(ln<.08&&d<30)continue;
  const lob=d>30||ln<.05;let v=prog*.1+Math.min(open,8)*.2+Math.min(ln,1.2)*1.1-d*.035+(m.role==='FW'?.25:0)+(press<2?.9:0)-(m.p.z*dir>T.offLine+.3&&M.offsideOn?6:0)-(lob?.7:0);if(prog<-4)v-=.5;if(m.role==='GK')v-=1;
  opts.push({k:lob?'lob':'pass',m,x:mx,z:mz,v:v+noise()});
  if(m.role!=='DF'&&(m.ai.runT>0||mz*dir>pu+5)&&mz*dir<P.L-8){const lx=cl(mx*.85,-P.W+3,P.W-3),lz=mz+dir*7;const[o2]=nearestOpp(lx,lz,opp),l2=lane(p.p.x,p.p.z,lx,lz,opp,4);
   if(o2>3&&l2>.12&&Math.abs(lz)<P.L-2&&!(M.offsideOn&&m.p.z*dir>T.offLine+.2))opts.push({k:'through',m,x:lx,z:lz,v:1.4+prog*.07+(m.ai.runT>0?1.2:0)+noise()});}}
 if(Math.abs(p.p.x)>P.W*.45&&pu>P.L-P.BD-7){const inBox=mates.filter(m=>m.p.z*dir>P.L-P.BD&&Math.abs(m.p.x)<P.BW).length;opts.push({k:'cross',v:.8+inBox*.9+noise()});}
 let dv=.55+Math.min(front,8)*.34+(p.at.drib-72)*.04+(pu<P.L-20?.25:0)-(press<1.7?1.6:press<3?.5:0)+(p.role==='DF'&&pu<-P.L*.3?-.6:0)+(ai.held<.45?.6:0)-(ai.held>3?.6:0)+noise();opts.push({k:'drib',v:dv});
 if(pu<-P.L*.55&&press<2.2)opts.push({k:'clear',v:1.2+noise()});
 opts.sort((a,c)=>c.v-a.v);const o=opts[0];
 if(o.k==='drib'){if(front<2.4&&p.at.drib>70&&p.skillCD<=0&&rnd()<.3*(p.at.drib/85)){const s=rnd()<.5?-1:1;M.act.skill(p,s);}dribbleMove(p,opp,dir,front);ai.dT=Math.min(ai.dT,(press<2.5?.25:.45)+rnd()*.3);return;}
 if(o.k==='shot'){const gk=O.pl.find(q=>q.role==='GK'&&active(q));const side=gk?(gk.p.x>0?-1:1):(rnd()<.5?-1:1);const far=rnd()<.75?side:-side;
  M.act.shoot(p,{ax:far*(.55+rnd()*.35),ay:rnd()<.55?.18+rnd()*.3:.55+rnd()*.35,pow:cl(.55+dG/45+rnd()*.15,.5,.95)});return;}
 if(o.k==='cross'){const tg=mates.filter(m=>m.p.z*dir>P.L-P.BD-3&&Math.abs(m.p.x)<P.BW).sort(()=>rnd()-.5)[0];const x=tg?tg.p.x:(rnd()-.5)*P.GW*2,z=tg?tg.p.z+dir*1.5:dir*(P.L-P.SPOT+rnd()*4);M.act.pass(p,{x,z},'cross',tg);return;}
 if(o.k==='clear'){const fw=mates.filter(m=>m.role==='FW');const tg=fw[rnd()*fw.length|0];M.act.pass(p,tg?{x:tg.p.x,z:tg.p.z+dir*3}:{x:p.p.x*.5,z:p.p.z+dir*35},'lob',tg);return;}
 M.act.pass(p,{x:o.x,z:o.z},o.k,o.m);}
function dribbleMove(p,opp,dir,front){const ai=p.ai,gz=dir*P.L;let dx=-p.p.x*.35,dz=gz-p.p.z;let l=hyp(dx,dz)||1;dx/=l;dz/=l;
 let ax=0,az=0;for(const o of opp){const ox=o.p.x-p.p.x,oz=o.p.z-p.p.z,d=hyp(ox,oz);if(d>7||d<.01)continue;if(ox*dx+oz*dz<-.5)continue;const w=(7-d)/7*1.5,s=(ox*-dz+oz*dx)>0?-1:1;ax+=-dz*s*w-ox/d*w*.3;az+=dx*s*w-oz/d*w*.3;}
 dx+=ax;dz+=az;
 if(Math.abs(p.p.x)>P.W-4)dx-=Math.sign(p.p.x)*.8;l=hyp(dx,dz)||1;dx/=l;dz/=l;ai.tx=p.p.x+dx*6;ai.tz=p.p.z+dz*6;ai.sprint=front>4.5&&p.stamina>.25;}

/* ---------- goalkeeper ---------- */
export function gkThink(M,g,dt){const T=M.teams[g.team],O=M.teams[1-g.team],D=T.diff,b=M.ball,dir=T.dir,gl=-dir*P.L,ai=g.ai;ai.sprint=false;g.anim.set=false;
 if(g.dive>0||g.stun>0)return;
 if(b.held===g){ai.mode='hold';ai.holdT=(ai.holdT||0)+dt;ai.tx=g.p.x;ai.tz=g.p.z;if(g.ctl<0&&ai.holdT>1.3+rnd()*.03)gkRelease(M,g);return;}
 ai.holdT=0;
 // shot incoming?
 if(!b.owner&&!b.held&&b.v.z*dir<-4){const c=M.cross[g.team];if(c&&Math.abs(c.x)<P.GW+.9&&c.y<P.GH+.5&&c.t<2){if(!ai.save){ai.react=(ai.react??-1)<0?D.react*.55*(90/g.at.gk)+rnd()*.06:ai.react;ai.react-=dt;
   if(ai.react<=0){ai.react=-1;planSave(M,g,c,T,D);}}}else ai.react=-1;}
 if(ai.save){ai.tx=ai.save.x;ai.tz=g.p.z;ai.sprint=true;return;}
 // claim loose balls in the box
 const inBox=(x,z)=>Math.abs(x)<P.BW&&(z*dir)<-P.L+P.BD;
 if(!b.owner&&!b.held){const ic=intercept(g,M.pred,D.react*.5,2.5,topSpeed(g));const oppT=Math.min(...O.pl.filter(active).map(o=>o.ai.ic?o.ai.ic.t:9));
  if(inBox(ic.x,ic.z)&&hyp(ic.x,ic.z-gl)<(P.size===5?7:12)&&ic.t<oppT-.25){ai.mode='claim';ai.tx=ic.x;ai.tz=ic.z;ai.sprint=true;return;}}
 const c=b.owner;if(c&&c.team!==g.team){const d=hyp(c.p.x-g.p.x,c.p.z-g.p.z),dg=hyp(c.p.x,c.p.z-gl);const def=T.pl.filter(p=>active(p)&&p!==g&&(p.p.z-c.p.z)*dir<0&&hyp(p.p.x-c.p.x,p.p.z-c.p.z)<6).length;
  if((inBox(c.p.x,c.p.z)&&dg<P.BD*.8&&def===0)||T.gkRush){ai.mode='rush';ai.tx=c.p.x+(0-c.p.x)*.15;ai.tz=c.p.z-dir*.6;ai.sprint=true;if(d<1.6&&g.tackleCD<=0&&rnd()<.25)M.act.tackle(g);return;}}
 // position on the arc between ball and goal centre
 const bx=b.p.x,bz=b.p.z,dx=bx,dz=bz-gl,dl=hyp(dx,dz)||1;const off=cl(dl*.09,.5,P.size===5?1.8:3.6);let tx=dx/dl*off,tz=gl+dz/dl*off;tx=cl(tx,-P.GW+.25,P.GW-.25);
 ai.mode='keep';ai.tx=tx;ai.tz=tz;ai.look=b;g.anim.set=dl<30;}
function planSave(M,g,c,T,D){const b=M.ball,dir=T.dir,sp=b.v.length();const tg=Math.max(.05,c.t-Math.abs(g.p.z-(-dir*P.L))/Math.max(4,Math.abs(b.v.z)));
 const dx=c.x-g.p.x,h=c.y,ad=Math.abs(dx),gkr=g.at.gk/82;const reach=2.95*gkr;
 const rr=Math.min(1.2,ad/reach);let pS=D.save*(.9+.3*gkr)-Math.max(0,sp-24)*.02-rr*rr*.35-(h>1.9?.1:0)+(tg>.6?.12:0)+(ad<.8&&h<1.8?.2:0);if(Math.abs(c.x)>P.GW-.25&&h>P.GH-.45)pS-=.2;
 if(ad>reach+tg*1.2||h>2.75)pS=.03;const ok=Math.abs(c.x)>P.GW+.15||c.y>P.GH+.15?false:rnd()<cl(pS,.04,.94);
 const catchIt=ok&&sp<23&&ad<1.3&&h<1.9&&rnd()<.75;
 g.ai.save={t:tg,ok,catchIt,x:c.x,y:h,real:!(Math.abs(c.x)>P.GW+.15||c.y>P.GH+.15)};
 if(ad>.75||h>1.85){const side=dx*dir>0?1:-1;// dive: lateral speed reaches the ball if ok, falls short if not
  const want=ok?dx:dx*(.45+rnd()*.3);g.diveV=want/Math.max(.3,tg+.05);g.diveV=cl(g.diveV,-9,9);M.act.dive(g,side,cl(h-.55,0,1.15));}
 else g.ai.save.step=true;}
export function gkRelease(M,g){const T=M.teams[g.team],O=M.teams[1-g.team],dir=T.dir,opp=O.pl.filter(active);let best=null,bv=-99,type='pass';
 for(const m of T.pl){if(m===g||!active(m))continue;const[open]=nearestOpp(m.p.x,m.p.z,opp);const d=hyp(m.p.x-g.p.x,m.p.z-g.p.z);const ln=lane(g.p.x,g.p.z,m.p.x,m.p.z,opp);
  let v=Math.min(open,10)*.3+Math.min(ln,1.2)*1.2+(m.role==='FW'?.6:0)+rnd()*.8;if(d>35)v-=.4;if(ln<.08&&d<30)v-=3;if(v>bv){bv=v;best=m;type=d>30||ln<.08?'lob':'pass';}}
 if(best)M.act.pass(g,{x:best.p.x+best.v.x*.5,z:best.p.z+best.v.z*.5},type,best);else M.act.pass(g,{x:0,z:g.p.z+dir*40},'lob',null);}
export{intercept};
