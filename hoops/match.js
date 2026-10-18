// COURT KINGS — game simulation: players, dribbling + moves, jumpers with release timing, layups, dunks (rim hang, contact),
// passes (lead passes, lobs), steals, blocks, rebounds with box-outs, fouls + free throws, inbounds, shot clock, quarters,
// overtime, the street game (check ball, take it back, first to 21) and the box score.
import * as THREE from '../vendor/three.module.min.js';
import {C,CT,setCourt,hoopOf,inBounds,isThree,Ball,stepBall,solve,predict} from './physics.js';
import {TEAMS,roster,kitsFor,SKIN,HAIR,SHOES} from './data.js';
import {newAnim,act,NP} from './rig.js';
import {aiThink,resetPlays} from './ai.js';
const V=THREE.Vector3,hyp=Math.hypot,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=Math.random,lerp=(a,b,t)=>a+(b-a)*t;
const gauss=()=>{let u=0;for(let i=0;i<4;i++)u+=rnd();return(u-2)/.577;};
export const S={phase:'idle',teams:[],pl:[],ents:[],refs:[],bench:[],ball:new Ball(),score:[0,0],q:1,nq:4,qLen:120,clock:120,sc:24,scLen:24,poss:-1,events:[],lines:[[],[]],time:0,
 deadT:0,next:null,humans:[],arrow:0,clear:[false,false],tf:[0,0],sudden:false,toWin:0,ft:null,inb:null,tip:null,winner:-1,endT:0,street:false,attract:false,fx:()=>{},pred:[],predT:0,
 ast:null,buzz:false,breakT:0,lastScore:null,qbreak:false,dunkRep:null,feedOn:true};
export const reach=p=>2.14*p.h+p.p.y;
export const dHoop=p=>{const H=hoopOf(p.team);return hyp(p.p.x-H.x,p.p.z);};
export const opp=t=>S.teams[1-t];
const fwd=p=>({x:Math.sin(p.face),z:Math.cos(p.face)});
function mkPl(o){return Object.assign({p:new V(),v:new V(),vy:0,face:0,h:1,anim:newAnim(),pose:new Float32Array(NP),tp:new Float32Array(NP),visible:true,sprint:false,def:false,hands:false,drib:0,hold:false,sit:false,
 ctl:-1,mark:null,ai:{tx:0,tz:0,spr:false,face:null,t:0,mode:'',cutT:0,jumpAt:-1,stealCD:0,idle:0,help:false},act:null,mv:{x:0,z:0},faceT:null,stun:0,team:-1,role:'',cd:0,stealCD:0,moveCD:0,jumpCD:0,holdT:0,
 st:{pts:0,reb:0,oreb:0,ast:0,stl:0,blk:0,fgm:0,fga:0,tpm:0,tpa:0,ftm:0,fta:0,to:0,pf:0,dnk:0}},o);}
/* ================= setup ================= */
export function setup(c){setCourt(!!c.street);const street=!!c.street;
 Object.assign(S,{street,phase:'idle',score:[0,0],q:1,nq:street?1:4,qLen:c.qLen,clock:c.qLen,scLen:street?14:24,sc:street?14:24,poss:-1,events:[],lines:[[0],[0]],time:0,deadT:0,next:null,
  arrow:0,clear:[false,false],tf:[0,0],sudden:false,toWin:street?21:0,ft:null,inb:null,tip:null,winner:-1,endT:0,attract:!!c.attract,ast:null,buzz:false,breakT:0,lastScore:null,qbreak:false,dunkRep:null});
 S.ball.reset();const kits=kitsFor(c.home,c.away);S.ents=[];S.pl=[];S.refs=[];S.bench=[];
 S.teams=[0,1].map(t=>{const ti=t?c.away:c.home,info=TEAMS[ti],kit=kits[t];const T={idx:t,ti,info,kit,diff:c.diff[t],pl:[],play:null,human:false,stats:null};
  const ros=roster(ti),use=street?[0,2,4]:[0,1,2,3,4];
  for(const i of use){const s=ros[i];const at={...s.at};const b=c.boost?c.boost[t]||0:0;for(const k in at)at[k]=cl(at[k]+b,25,99);
   const look={c1:kit.c1,c2:kit.c2,pat:kit.pat,sh:kit.c1,sh2:kit.c2,so:s.shoe===1?'#16171b':'#f2f2f2',skin:SKIN[s.skin*SKIN.length|0],hair:HAIR[s.hair*HAIR.length|0],shoe:s.shoe===3?kit.c1:SHOES[s.shoe],sole:s.shoe===1?'#f2f2f2':'#e9e9e4',
    num:s.num,sleeve:s.sleeve?(s.shoe%2?'#16171b':'#f2f2f2'):null,band:s.band?kit.c2:null,bald:s.style===3};
   const p=mkPl({team:t,slot:T.pl.length,pos:s.pos,name:s.name,short:s.short,last:s.last,num:s.num,at,ovr:s.ovr,h:s.h,cm:s.cm,look,idx:S.ents.length,role:'P'});T.pl.push(p);S.pl.push(p);S.ents.push(p);}
  return T;});
 for(const T of S.teams)T.pl.forEach((p,i)=>p.mark=opp(T.idx).pl[i]);
 if(!street){const rl={c1:'#d8d8d8',c2:'#141414',pat:2,sh:'#141414',sh2:'#141414',so:'#141414',skin:SKIN[2],hair:HAIR[0],shoe:'#141414',sole:'#222',num:null};
  for(let i=0;i<2;i++){const r=mkPl({role:'REF',name:'OFFICIAL',look:{...rl,skin:SKIN[i?5:1]},idx:S.ents.length,h:1});S.refs.push(r);S.ents.push(r);}
  // bench: four in warm-up shirts on each side of the scorer's table
  for(const t of[0,1])for(let i=0;i<4;i++){const k=S.teams[t].kit,s=t?1:-1;const b=mkPl({role:'BENCH',sit:true,team:t,idx:S.ents.length,h:1.02+rnd()*.12,look:{c1:k.c2,c2:k.c1,pat:0,sh:k.c1,sh2:k.c2,so:'#f2f2f2',skin:SKIN[rnd()*SKIN.length|0],hair:HAIR[rnd()*HAIR.length|0],shoe:'#f4f4f2',num:null}});
   b.p.set(s*(5.6+i*.75),0,-(C.W+2.8));b.face=0;S.bench.push(b);S.ents.push(b);}}
 S.humans=[];for(let i=0;i<(c.humans||0);i++){S.humans.push({i,team:i,pl:null,inp:{},prev:{},edge:{},idle:0,mv:{x:0,z:0}});S.teams[i].human=true;}
 for(const T of S.teams)T.stats={pts:0,reb:0,ast:0,stl:0,blk:0,to:0,fgm:0,fga:0,tpm:0,tpa:0,ftm:0,fta:0,pf:0,pip:0,fb:0,lead:0};
 resetPlays();if(street){const t=rnd()<.5?0:1;startCheck(t,true);}else startTip();}
/* ================= helpers ================= */
const live=()=>S.phase==='live';
export function hum(p){return S.humans.find(h=>h.pl===p);}
export function setCtl(h,p){if(h.pl&&h.pl!==p)h.pl.ctl=-1;h.pl=p;if(p)p.ctl=h.i;h.idle=0;}
function feed(txt,team){if(S.feedOn)S.fx('feed',txt,team);}
function topSpeed(p){const d=S.teams[p.team]?S.teams[p.team].diff:null;return(4.15+p.at.spd/100*1.9)*(d&&!S.teams[p.team].human?d.pace:1);}
export function contestOf(p){const H=hoopOf(p.team);let c=0;const hx=H.x-p.p.x,hz=-p.p.z,hl=hyp(hx,hz)||1;
 for(const o of opp(p.team).pl){if(o.stun>0)continue;const dx=o.p.x-p.p.x,dz=o.p.z-p.p.z,d=hyp(dx,dz);let k=cl((2.3-d)/1.6,0,1);if(k<=0)continue;const front=(dx*hx+dz*hz)/(d*hl||1);k*=front>.15?1:front>-.3?.6:.25;if(o.p.y>.1||o.hands)k*=1.3;c=Math.max(c,k);}const OT=opp(p.team);return cl(c*(OT.human?1:OT.diff.con),0,1);}
export function shotProb(p,d,c){const a=p.at,H=hoopOf(p.team);let q;
 if(d<2.2)q=.45+.48*a.ins/100;else if(d<4.2)q=.35+.30*a.mid/100;else if(!isThree(H,p.p.x,p.p.z))q=.3+.28*a.mid/100;else q=.2+.31*a.three/100-Math.max(0,d-8)*.08;
 q*=1-.45*c;const T=S.teams[p.team];if(!T.human)q+=T.diff.shot;return cl(q,.02,.96);}
export function openness(p){let m=9;for(const o of opp(p.team).pl)m=Math.min(m,hyp(o.p.x-p.p.x,o.p.z-p.p.z));return m;}
// is the straight lane from a to b clear of defenders (within rad metres of the segment)?
export function laneClear(a,bx,bz,team,rad=.85){const ax=a.p.x,az=a.p.z,dx=bx-ax,dz=bz-az,L2=dx*dx+dz*dz||1;
 for(const o of opp(team).pl){const t=cl(((o.p.x-ax)*dx+(o.p.z-az)*dz)/L2,.05,.95),px=ax+dx*t,pz=az+dz*t;if(hyp(o.p.x-px,o.p.z-pz)<rad)return false;}return true;}
function jump(p,vy){if(p.p.y>0||p.vy>0)return false;p.vy=vy;p.p.y=.001;return true;}
function holdBall(p){return S.ball.owner===p;}
function stat(p,k,n=1){p.st[k]+=n;const T=S.teams[p.team];if(T.stats[k]!=null)T.stats[k]+=n;}
/* ================= possession ================= */
export function give(p,how){const b=S.ball,prevT=b.lastTeam;b.owner=p;b.pass=null;b.v.set(0,0,0);b.last=p;b.lastTeam=p.team;b.floorT=0;p.drib=p.drib||1;p.hold=true;p.holdT=0;
 if(b.shot){if(how!=='rebound')b.shot=null;}
 if(S.poss!==p.team){const old=S.poss;S.poss=p.team;S.sc=S.scLen;if(S.street&&old>=0&&how!=='check')S.clear[p.team]=true;if(how!=='inbound'&&how!=='check'&&how!=='tip')S.ast=null;resetPlays(p.team);}
 for(const h of S.humans){if(h.team===p.team)setCtl(h,p);else if(h.team!==p.team&&(!h.pl||how!=='pass')){const d=S.teams[h.team].pl.find(q=>q.mark===p)||nearest(S.teams[h.team].pl,p.p);setCtl(h,d);}}
 S.fx('catch',p,how);}
function nearest(list,pt,excl){let b=null,bd=1e9;for(const q of list){if(q===excl)continue;const d=hyp(q.p.x-pt.x,q.p.z-pt.z);if(d<bd){bd=d;b=q;}}return b;}
/* ================= actions (shared by humans and the AI) ================= */
// jumper: human=true runs the shot meter (release on button up); CPU releases near the top of the jump
export function shoot(p,human){if(!holdBall(p)||p.act||p.p.y>0||p.stun>0)return false;const sp=hyp(p.v.x,p.v.z);
 const vy=2.75+p.at.hops/100*.75;p.act={k:'shoot',t:0,vy,T:.2+vy/C.G,human,rel:false,mov:sp>3.2,ft:false,c0:contestOf(p)};act(p,'shoot',99);p.hold=false;p.drib=0;S.fx('gather',p);return true;}
// layup or dunk at the rim
export function drive(p,dunk){if(!holdBall(p)||p.act||p.p.y>0||p.stun>0)return false;p.act={k:dunk?'dunk':'layup',t:0,jumped:false,rel:false,side:p.p.z*hoopOf(p.team).s>0?-1:1};
 act(p,dunk?'dunk':'layup',99,{side:p.act.side,v:0});p.hold=false;p.drib=0;return true;}
export function canDunk(p){const d=dHoop(p);return p.at.dunk>=55&&d<4.1&&d>.6&&(hyp(p.v.x,p.v.z)>2.2||d<2);}
export function pass(p,to,lob){if(!holdBall(p)||!to||to===p||p.stun>0)return false;if(p.act&&p.act.k!=='move')return false;const b=S.ball;
 const H=hoopOf(p.team),oop=lob&&dHoop(to)<5&&to.at.dunk>=60;const d0=hyp(to.p.x-p.p.x,to.p.z-p.p.z),spd=oop?9:Math.min(15,8+d0*.5);let t=d0/spd;
 let tx=to.p.x+to.v.x*t*.9,tz=to.p.z+to.v.z*t*.9;
 if(oop){const ux=H.x-to.p.x,uz=-to.p.z,ul=hyp(ux,uz)||1;tx=H.x-ux/ul*.55;tz=-uz/ul*-.55*0;tz=to.p.z*.15;}
 tx=cl(tx,CT.xmin+.9,CT.xmax-.9);tz=cl(tz,-C.W+.9,C.W-.9);
 const src=b.hp.y>.3&&b.owner===p&&b.hpO===p?b.hp.clone():new V(p.p.x+Math.sin(p.face)*.3,1.2*p.h,p.p.z+Math.cos(p.face)*.3);
 const ty=oop?C.RH+.45:1.15*to.h;const tgt=new V(tx,ty,tz);const dd=hyp(tx-src.x,tz-src.z);
 b.owner=null;b.p.copy(src);solve(src,tgt,oop?.95:dd>12?.22:.1,b.v);b.pass={from:p,to,t:0,tgt,oop,lob:!!lob,tried:new Set(),team:p.team};b.last=p;b.lastTeam=p.team;b.shot=null;
 act(p,oop||lob?'lob':'pass',.42);p.hold=false;p.drib=0;p.act={k:'pass',t:0};to.ai.catchT=tgt;to.ai.oop=oop;S.ast={p,t:S.time};S.fx('pass',p,to);return true;}
export function move(p,kind,side){if(!holdBall(p)||p.act||p.p.y>0||p.moveCD>0||p.stun>0)return false;const f=fwd(p);
 p.act={k:'move',kind,t:0,dur:kind==='spin'?.48:kind==='step'?.4:.32,side,done:false};p.moveCD=.55;p.hold=false;
 act(p,kind==='step'?'step':kind,p.act.dur,{side});S.fx('move',p,kind);
 // ankle-breaker: a beaten defender stumbles or goes down
 const d=opp(p.team).pl.find(o=>o.mark===p)||nearest(opp(p.team).pl,p.p);if(d&&hyp(d.p.x-p.p.x,d.p.z-p.p.z)<2&&d.p.y<=0){const h=hum(d);const ch=(p.at.hand-d.at.perd)/100*.9+.18-(h?.08:0);
  if(rnd()<ch){const big=rnd()<.25;d.stun=big?1.1:.55;act(d,big?'fall':'stumble',big?1.2:.6);S.fx('ankles',p,d,big);if(big)feed(`${p.short} breaks ${d.short}'s ankles`,p.team);}}return true;}
export function steal(p){if(p.stealCD>0||p.act||p.stun>0||p.p.y>0)return false;p.stealCD=.75;act(p,'steal',.36,{side:1});p.act={k:'steal',t:0};return true;}
export function block(p){if(p.p.y>0||p.act||p.jumpCD>0||p.stun>0)return false;const vy=3.0+p.at.hops/100*.9;jump(p,vy);p.jumpCD=.9;p.act={k:'jump',t:0};
 const reb=S.ball.owner==null&&S.ball.shot&&S.ball.shot.rim;act(p,reb?'reb':'block',99);return true;}
export function callPick(p){const T=S.teams[p.team];if(!holdBall(p))return;const big=[...T.pl].filter(q=>q!==p).sort((a,b)=>(b.pos==='C'?2:b.pos==='PF'?1:0)-(a.pos==='C'?2:a.pos==='PF'?1:0))[0];
 if(big){T.play={k:'pnr',scr:big,h:p,ph:'go',t:0,side:rnd()<.5?-1:1,called:true};S.fx('pick',big);}}
/* ================= release + shot outcome ================= */
const tv=new V(),tv2=new V();
function grade(e,w){const a=Math.abs(e);return a<=w?'green':a<=w*2.6?'good':a<=w*5?(e<0?'slightly early':'slightly late'):(e<0?'very early':'very late');}
function release(p,e){const b=S.ball,H=hoopOf(p.team),d=dHoop(p),c=(contestOf(p)+(p.act.c0??contestOf(p)))/2,T=S.teams[p.team],human=p.act.human,ft=p.act.ft;
 let q=ft?cl(.48+.45*p.at.ft/100,.3,.95):shotProb(p,d,c)*(p.act.mov?.85:1),gr=null;
 if(human){const w=(.05+(ft?p.at.ft:d>6.5?p.at.three:p.at.mid)/100*.035)*(1-c*.5)*T.diff.win;gr=grade(e,w);q=gr==='green'?1:gr==='good'?Math.min(.95,q+.18):gr.startsWith('slightly')?q*.72:q*.25;}
 else if(!ft){q*=1-Math.min(.5,Math.abs(e)*.8);}
 const made=rnd()<q,three=!ft&&isThree(H,p.p.x,p.p.z);
 const src=b.owner===p&&b.hp.y>1&&b.hpO===p?b.hp.clone():new V(p.p.x,2.3*p.h+p.p.y,p.p.z);
 const ux=H.x-src.x,uz=-src.z,ul=hyp(ux,uz)||1;let ox=0,oz=0;
 if(made){const r=rnd()*.03,a=rnd()*6.28;ox=Math.cos(a)*r;oz=Math.sin(a)*r;}else{const along=(rnd()<.5?-1:1)*(.16+rnd()*.16),side=(rnd()-.5)*.36;ox=ux/ul*along-uz/ul*side;oz=uz/ul*along+ux/ul*side;}
 tv.set(H.x+ox,C.RH+.02,oz);const ang=ft?.93:(.86+Math.min(d,8)*.004);
 b.owner=null;b.p.copy(src);solve(src,tv,ang,b.v);b.shot={by:p,team:p.team,pts:ft?1:three?3:2,hoop:H,t:0,rim:false,foul:null,ft,made,dunk:false,lay:false,d};b.pass=null;b.last=p;b.lastTeam=p.team;b.rimmed=false;
 p.act.rel=true;p.act.relT=p.act.t;p.anim.rel=p.anim.t;
 if(!ft){stat(p,'fga');if(three)stat(p,'tpa');}else stat(p,'fta');
 // shooting foul from a defender flying in
 if(!ft){const dfd=opp(p.team).pl.find(o=>hyp(o.p.x-p.p.x,o.p.z-p.p.z)<1.05&&(o.p.y>.15||o.act&&o.act.k==='jump'));const fd=S.teams[1-p.team].diff;
  if(dfd&&rnd()<.22*(S.teams[1-p.team].human?1:fd.foul))b.shot.foul={by:dfd,n:three?3:2};}
 S.fx('release',p,gr,e,b.shot);return made;}
/* ================= free throws ================= */
function startFT(p,n,and1){S.phase='ft';S.ft={p,n,i:0,t:0,st:'aim',and1,made:0};S.ball.shot=null;S.ball.pass=null;placeFT();give(p,'ft');S.fx('ft',p,n,and1);}
function placeFT(){const f=S.ft,p=f.p,H=hoopOf(p.team),s=H.s,ftx=s*(C.L-C.FTX);p.p.set(ftx-s*.35,0,0);p.v.set(0,0,0);p.face=s>0?Math.PI/2:-Math.PI/2;p.act=null;p.anim.act='';p.vy=0;
 const lane=[2.13,3.0,3.87].map(d=>s*(C.L-d));const def=opp(p.team).pl,offp=S.teams[p.team].pl.filter(q=>q!==p);let k=0;
 const spots=[];for(const x of lane)for(const zs of[-1,1])spots.push([x,zs*(C.KW/2+.45),zs]);
 const put=(q,x,z)=>{q.p.set(x,0,z);q.v.set(0,0,0);q.vy=0;q.act=null;q.anim.act='';q.face=Math.atan2(H.x-x,-z);q.def=false;q.hands=false;};
 def.forEach((q,i)=>{if(i<2)put(q,spots[i][0],spots[i][1]);else put(q,ftx-s*(4+i),(i-2.5)*3);});offp.forEach((q,i)=>{if(i<2)put(q,spots[2+i][0],spots[2+i][1]);else put(q,ftx-s*(4.5+i),(i-1.5)*-3.3);});}
function ftStep(dt){const f=S.ft,p=f.p,b=S.ball;f.t+=dt;
 if(f.st==='aim'){p.v.set(0,0,0);const h=hum(p);
  if(!p.act&&f.t>.9&&(!h||h.edge.shoot||f.t>15)){p.act={k:'shoot',t:0,vy:0,T:.62,human:!!h,rel:false,ft:true};act(p,'ft',99);p.hold=false;}
  if(p.act&&p.act.ft){const a=p.act;if(a.human){if(!h.inp.shoot||a.t>a.T*1.5)release(p,a.t/a.T-1);}else if(a.t>=a.T+gauss()*.02)release(p,gauss()*.04);if(a.rel){f.st='fly';f.t=0;}}}
 else if(f.st==='fly'){if(f.t>2.4||(b.p.y<C.RH-.7&&b.v.y<0&&f.t>.5)||b.floorT>0||b.p.y<.4){// missed (scores are handled by onScore)
   f.st='res';f.t=0;if(f.i>=f.n-1){S.phase='live';S.ft=null;p.act=null;p.anim.act='';if(S.ball.shot)S.ball.shot.rim=true;S.fx('ftmiss',p);return;}S.fx('ftmiss',p);}}
 else if(f.st==='res'){if(f.t>1.1){f.i++;if(f.i>=f.n){S.ft=null;afterScoreInbound(1-p.team);return;}f.st='aim';f.t=0;p.act=null;p.anim.act='';placeFT();give(p,'ft');}}
 if(p.act&&p.act.rel&&p.act.t>p.act.relT+.6){p.act=null;p.anim.act='';}}
/* ================= set plays: tip, inbound, check ================= */
function startTip(){S.phase='tip';S.tip={t:0,done:false};const[A,B]=S.teams;for(const T of S.teams){const s=T.idx?1:-1;T.pl.forEach((p,i)=>{const c=p.pos==='C';const a=[2.4,-2.4,1.2,-1.2][i]||0;
  if(c)p.p.set(s*.42,0,0);else p.p.set(s*(1.6+(i%2)*1.6),0,(i<2?-1:1)*(1.6+(i%2)*1.2));p.face=s>0?-Math.PI/2:Math.PI/2;p.v.set(0,0,0);});}
 S.ball.owner=null;S.ball.p.set(0,1.5,0);S.ball.v.set(0,0,0);S.ball.shot=null;S.ball.pass=null;S.poss=-1;for(const h of S.humans)setCtl(h,S.teams[h.team].pl.find(p=>p.pos==='C'));}
function tipStep(dt){const t=S.tip,b=S.ball;t.t+=dt;const cs=S.teams.map(T=>T.pl.find(p=>p.pos==='C'));if(S.refs[0]){S.refs[0].p.set(0,0,.9);S.refs[0].face=Math.PI;}
 if(t.t<.9){b.p.set(0,1.55,.55);b.v.set(0,0,0);return;}
 if(!t.tossed){t.tossed=true;b.p.set(0,1.9,0);b.v.set(0,5.4,0);S.fx('toss');if(S.refs[0])act(S.refs[0],'tip',.6);}
 for(const p of cs){const h=hum(p);if(!h&&!p.ai.tipJ&&t.t>.9+.32+gauss()*.05*(1.4-S.teams[p.team].diff.iq)){p.ai.tipJ=1;jump(p,3.3+p.at.hops/100*.8);act(p,'tip',1.1);}
  if(h&&h.edge.shoot&&!p.ai.tipJ){p.ai.tipJ=1;jump(p,3.3+p.at.hops/100*.8);act(p,'tip',1.1);}}
 stepBall(b,dt,()=>{});
 if(b.v.y<-.4&&!t.done){t.done=true;const sc=cs.map(p=>reach(p)+.45-Math.abs(b.p.y-(reach(p)+.4))*.3+rnd()*.25);const w=sc[0]>sc[1]?0:1;const W=S.teams[w],tgt=W.pl.find(p=>p.pos==='PG');
  b.v.set((tgt.p.x-b.p.x)*.9,1.2,(tgt.p.z-b.p.z)*.9);b.lastTeam=w;b.last=cs[w];S.arrow=1-w;S.phase='live';S.poss=-1;S.fx('tipwin',cs[w]);for(const p of cs)p.ai.tipJ=0;}}
export function startInbound(team,x,z,kind){S.phase='inbound';const T=S.teams[team],H=hoopOf(team);
 const by=kind==='make'?(T.pl.find(p=>p.pos==='C')||T.pl[T.pl.length-1]):T.pl.find(p=>p.pos==='SF')||T.pl[1]||T.pl[0];
 by.p.set(x,0,z);by.v.set(0,0,0);by.act=null;by.anim.act='';by.vy=0;by.face=Math.atan2(-x*.3+(H.x-x)*.2,-z);
 S.inb={team,by,t:0,kind,x,z};S.ball.shot=null;S.ball.pass=null;give(by,'inbound');S.sc=S.scLen;S.fx('inbound',team,kind);}
function inbStep(dt){const I=S.inb;I.t+=dt;const by=I.by;by.v.set(0,0,0);by.p.set(I.x,0,I.z);const h=hum(by);const T=S.teams[I.team];
 const mates=T.pl.filter(p=>p!==by);
 if((!h&&I.t>1.5)||(h&&(h.edge.pass||I.t>5))){let tgt=null;if(h&&hyp(h.mv.x,h.mv.z)>.3){let bv=-2;for(const m of mates){const dx=m.p.x-by.p.x,dz=m.p.z-by.p.z,d=hyp(dx,dz)||1,a=(dx*h.mv.x+dz*h.mv.z)/d;if(a>bv){bv=a;tgt=m;}}}
  if(!tgt){let bv=-1e9;for(const m of mates){const o=openness(m),d=hyp(m.p.x-by.p.x,m.p.z-by.p.z);const v=o*1.2-d*.15+(m.pos==='PG'?1.5:0)-(laneClear(by,m.p.x,m.p.z,by.team,.7)?0:4);if(v>bv){bv=v;tgt=m;}}}
  if(tgt&&I.t>.4){pass(by,tgt,false);S.phase='live';S.inb=null;S.fx('inbpass');}}}
export function startCheck(team,first){S.phase='check';const T=S.teams[team],H=hoopOf(team),pg=T.pl[0];S.clear=[false,false];
 const put=(q,x,z)=>{q.p.set(x,0,z);q.v.set(0,0,0);q.vy=0;q.act=null;q.anim.act='';q.face=Math.atan2(H.x-x,-z);};
 put(pg,H.x-H.s*8.6,0);T.pl.forEach((q,i)=>{if(i)put(q,H.x-H.s*(i===1?4.5:1.6),i===1?5.2:-2.8);});opp(team).pl.forEach((q,i)=>{const m=T.pl[i];put(q,lerp(m.p.x,H.x,.16),m.p.z*.84);q.face=Math.atan2(m.p.x-q.p.x,m.p.z-q.p.z);q.mark=m;});
 S.ball.shot=null;S.ball.pass=null;S.check={team,t:0};give(pg,'check');S.clear=[false,false];S.sc=S.scLen;S.fx('check',team,first);}
function checkStep(dt){S.check.t+=dt;if(S.check.t>1.2){S.phase='live';S.check=null;}}
function afterScoreInbound(team){if(S.street){startCheck(team);return;}const H=hoopOf(1-team);startInbound(team,H.s*(C.L+.45),(rnd()<.5?-1:1)*1.4,'make');}
function toDead(t,next){S.phase='dead';S.deadT=t;S.next=next;S.ball.pass=null;}
function turnover(p,why){if(p){stat(p,'to');}const t=p?1-p.team:1-S.ball.lastTeam;toDead(1.1,()=>sideInbound(t));S.fx('turnover',p,why);if(p)feed(`${why} · ${p.short}`,p.team);}
function sideInbound(t,x){if(S.street){startCheck(t);return;}const bx=x??cl(S.ball.p.x,-C.L+3,C.L-3);startInbound(t,cl(bx,-C.L+2.5,C.L-2.5),C.W+.45,'side');}
/* ================= scoring ================= */
function onScore(H){const b=S.ball,sh=b.shot;if(S.phase==='dead'||S.phase==='end'||S.phase==='qbreak')return;
 let team,pts=2,by=null;if(sh){team=sh.team;pts=sh.pts;by=sh.by;}else{team=b.lastTeam>=0?b.lastTeam:0;by=b.last;}
 const own=hoopOf(team)!==H;if(own&&!S.street)team=1-team;
 if(S.street&&S.clear[team]&&!(sh&&sh.ft)){S.fx('takeback',team);feed('NO GOOD · TAKE IT BACK',team);b.shot=null;toDead(1.2,()=>startCheck(1-team));return;}
 S.score[team]+=pts;const ln=S.lines[team];ln[ln.length-1]+=pts;
 if(by&&by.team===team){stat(by,'pts',pts);if(sh&&!sh.ft){stat(by,'fgm');if(pts===3)stat(by,'tpm');}if(sh&&sh.ft)stat(by,'ftm');
  if(S.ast&&S.ast.p!==by&&S.ast.p.team===team&&S.time-S.ast.t<5&&!(sh&&sh.ft)){stat(S.ast.p,'ast');S.fx('assist',S.ast.p);}}
 S.ast=null;S.lastScore={team,pts,by,dunk:sh&&sh.dunk,t:S.time};
 S.fx('score',team,pts,by,sh);
 const foul=sh&&sh.foul;b.shot=null;
 if(sh&&sh.ft){if(!S.ft){toDead(1.3,()=>afterScoreInbound(1-team));return;}// a last free throw that rattled in after play resumed
  S.ft.made++;S.ft.st='res';S.ft.t=0;if(S.ft.i>=S.ft.n-1){S.ft.t=-.4;}return;}
 if(S.street&&S.score[team]>=S.toWin){toDead(1.6,()=>endGame());return;}
 if(S.sudden){toDead(1.6,()=>endGame());return;}
 if(S.buzz){S.buzz=false;toDead(1.4,()=>endPeriod());return;}
 if(foul){stat(foul.by,'pf');S.tf[1-team]++;S.fx('andone',by,foul.by);feed(`AND ONE · ${by.short}`,team);toDead(1.5,()=>startFT(by,1,true));return;}
 toDead(sh&&sh.dunk?2.4:1.3,()=>afterScoreInbound(1-team));}
function shotFoulResolve(){const sh=S.ball.shot,f=sh.foul;stat(f.by,'pf');S.tf[1-sh.team]++;S.ball.shot=null;S.fx('foul',f.by,sh.by,'shooting');feed(`SHOOTING FOUL · ${f.by.short}`,f.by.team);
 const n=f.n;toDead(1.3,()=>startFT(sh.by,n,false));}
// non-shooting foul: bonus free throws from the fifth team foul of a quarter
function foulOn(off,vic,kind){stat(off,'pf');S.tf[off.team]++;S.fx('foul',off,vic,kind);feed(`${kind.toUpperCase()} FOUL · ${off.short}`,off.team);
 if(kind==='offensive'){stat(off,'to');toDead(1.3,()=>sideInbound(1-off.team));return;}
 if(S.tf[off.team]>=5&&!S.street)toDead(1.3,()=>startFT(vic,2,false));else toDead(1.3,()=>sideInbound(vic.team,vic.p.x));}
/* ================= periods ================= */
function endPeriod(){S.fx('buzzer');S.ball.shot=null;const q=S.q;
 if(S.street){if(S.score[0]===S.score[1]){S.sudden=true;S.fx('sudden');feed('NEXT BUCKET WINS',-1);toDead(1.4,()=>startCheck(rnd()<.5?0:1));return;}endGame();return;}
 if(q>=S.nq&&S.score[0]!==S.score[1]){endGame();return;}
 S.phase='qbreak';S.breakT=0;S.qbreak=true;S.fx('period',q);}
export function nextPeriod(){if(S.phase!=='qbreak')return;S.q++;if(S.q>S.nq){S.nq=S.q;}S.clock=S.q>4?Math.min(S.qLen,60):S.qLen;S.tf=[0,0];for(const l of S.lines)l.push(0);S.qbreak=false;
 const t=S.arrow;S.arrow=1-S.arrow;S.ball.shot=null;S.ball.owner=null;for(const p of S.pl){p.act=null;p.anim.act='';p.vy=0;p.p.y=0;p.stun=0;}
 // everyone back to their own half
 for(const T of S.teams){const H=hoopOf(T.idx);T.pl.forEach((p,i)=>{p.p.set(-H.s*(2+i*1.6)*(T.idx===t?-.3:1),0,(i-2)*2.4);p.v.set(0,0,0);});}
 resetPlays();sideInbound(t,0);S.fx('qstart',S.q);}
function endGame(){S.phase='end';S.endT=0;S.winner=S.score[0]>S.score[1]?0:S.score[1]>S.score[0]?1:-1;S.fx('final',S.winner);}
/* ================= the fixed step ================= */
const preds=[];
export function fixed(dt){S.time+=dt;const b=S.ball;
 for(const h of S.humans)humanInput(h,dt);
 switch(S.phase){
  case'tip':tipStep(dt);break;
  case'inbound':inbStep(dt);break;
  case'check':checkStep(dt);break;
  case'ft':ftStep(dt);break;
  case'dead':S.deadT-=dt;if(S.deadT<=0){const n=S.next;S.next=null;S.phase='live';if(n)n();}break;
  case'qbreak':S.breakT+=dt;if(S.breakT>(S.attract?3:6))nextPeriod();break;
  case'end':S.endT+=dt;break;}
 if(S.phase==='live'){S.clock-=dt;
  if(b.owner||b.pass){if(!(b.shot&&b.shot.rim))S.sc-=dt;}
  if(S.sc<=0&&S.poss>=0&&!(b.shot&&!b.owner)){S.sc=0;S.fx('horn');const p=b.owner;if(!p)feed('SHOT CLOCK VIOLATION',S.poss);turnover(p||null,'SHOT CLOCK');}
  if(S.clock<=0&&!S.sudden){S.clock=0;if(!S.buzz&&b.shot&&!b.owner&&!b.shot.rim&&!b.shot.ft)S.buzz=true;else if(!S.buzz||b.owner||!b.shot){S.buzz=false;endPeriod();}}}
 if(S.phase==='live'||S.phase==='dead'||S.phase==='inbound'||S.phase==='check'||S.phase==='ft'||S.phase==='tip')aiThink(S,dt);
 for(const p of S.pl)stepPlayer(p,dt);collide();for(const r of S.refs)refStep(r,dt);
 if(S.phase!=='tip')ballStep(dt);
 if(S.street&&b.owner&&S.clear[b.owner.team]&&dHoop(b.owner)>C.TR+.25){S.clear[b.owner.team]=false;S.sc=Math.max(S.sc,10);S.fx('cleared',b.owner.team);}
 for(const h of S.humans){for(const k in h.edge)h.edge[k]=false;}}
/* ================= human input ================= */
function humanInput(h,dt){const p=h.pl;if(!p)return;const i=h.inp,e=h.edge;h.mv.x=i.x||0;h.mv.z=i.z||0;const mag=hyp(h.mv.x,h.mv.z);h.idle=mag>.15?0:h.idle+dt;
 const T=S.teams[h.team],offense=S.poss===h.team&&(S.ball.owner?S.ball.owner.team===h.team:true),has=S.ball.owner===p;
 if(S.phase==='live'||S.phase==='dead'){
  if(has){if(e.shoot){if(canDunk(p)&&(i.spr||dHoop(p)<2.4)&&dHoop(p)<(i.spr?4.1:2.6))drive(p,true);else if(dHoop(p)<2.6&&p.at.ins>0)drive(p,false);else shoot(p,true);}
   else if(e.pass){const to=passTarget(p,h.mv.x,h.mv.z);if(to)pass(p,to,i.lob);}
   else if(e.lob){const to=passTarget(p,h.mv.x,h.mv.z,true);if(to)pass(p,to,true);}
   else if(e.move||e.rs){moveFromInput(p,h,e.rs?h.rs:null);}
   else if(e.sw)callPick(p);}
  else if(!S.ball.owner||S.ball.owner.team!==h.team){// defence or loose ball
   if(e.shoot)block(p);if(e.pass)steal(p);p.hands=!!i.move;
 p.def=S.phase==='live';
   if(e.sw){const pool=T.pl.filter(q=>q!==p);const bp=S.ball.p;const n=nearest(pool,bp);if(n)setCtl(h,n);}}
  else if(e.sw){// teammate has it: switch to the handler
   setCtl(h,S.ball.owner);}}
 if(p.act&&p.act.k==='shoot'&&p.act.human&&!p.act.rel&&!p.act.ft){if(!i.shoot||p.act.t>p.act.T*1.45)release(p,p.act.t/p.act.T-1);}}
function moveFromInput(p,h,rs){const H=hoopOf(p.team),hx=H.x-p.p.x,hz=-p.p.z,hl=hyp(hx,hz)||1;let x=rs?rs.x:h.mv.x,z=rs?rs.z:h.mv.z;const m=hyp(x,z);
 const f=fwd(p),lat=f.z*x-f.x*z;// + = towards the player's right? (cross of facing and input)
 let kind='cross',side=p.drib>0?-1:1;if(m>.3){const toward=(x*hx+z*hz)/(m*hl);if(toward<-.55)kind='step';else if(h.inp.spr&&!rs)kind='spin';side=lat>0?-1:1;}else if(h.inp.spr)kind='spin';
 move(p,kind,side);}
export function passTarget(p,x,z,lobOnly){const T=S.teams[p.team],m=hyp(x,z);let best=null,bv=-1e9;
 for(const q of T.pl){if(q===p)continue;const dx=q.p.x-p.p.x,dz=q.p.z-p.p.z,d=hyp(dx,dz)||1;let v=openness(q)*.6-d*.05;if(m>.3)v+=((dx*x+dz*z)/(d*m))*4;if(lobOnly)v-=dHoop(q)*.4;if(v>bv){bv=v;best=q;}}return best;}
/* ================= per-player physics + actions ================= */
function stepPlayer(p,dt){const b=S.ball;p.stealCD-=dt;p.moveCD-=dt;p.jumpCD-=dt;if(p.stun>0)p.stun-=dt;
 if(b.owner&&b.owner.team===p.team){p.def=false;p.hands=false;}
 const air=p.p.y>0||p.vy>0,has=b.owner===p,H=hoopOf(p.team);
 // desired motion: humans steer directly, everyone else seeks their AI target
 let mx=0,mz=0,spr=false;const h=hum(p);
 if(h&&(h.idle<.35||has)&&!(S.phase==='inbound'&&!has)){mx=h.mv.x;mz=h.mv.z;spr=!!h.inp.spr;}
 else{const dx=p.ai.tx-p.p.x,dz=p.ai.tz-p.p.z,d=hyp(dx,dz);if(d>.12){const k=Math.min(1,d/1.1);mx=dx/d*k;mz=dz/d*k;}spr=p.ai.spr&&hyp(dx,dz)>1.5;}
 if(S.phase==='inbound'&&S.inb&&S.inb.by===p){mx=mz=0;}
 if(S.phase==='ft'||S.phase==='tip'&&p.pos!=='C'){/* hold spots */}
 p.sprint=spr;let spd=topSpeed(p)*(spr?1.28:1)*(has?.93:1)*(p.def&&!spr?.82:1);if(p.stun>0)spd*=.15;
 if(S.phase==='ft'||S.phase==='tip'||S.phase==='check'){spd=0;if(S.phase==='tip'&&p.pos!=='C')spd=0;}
 const a=p.act;let ctrl=!air&&!(a&&(a.k==='shoot'||a.k==='layup'||a.k==='dunk'||a.k==='steal'||a.k==='move'));
 if(ctrl){const tx=mx*spd,tz=mz*spd,acc=(hyp(tx,tz)<hyp(p.v.x,p.v.z)?26:15)*dt,dvx=tx-p.v.x,dvz=tz-p.v.z,dl=hyp(dvx,dvz);if(dl<=acc){p.v.x=tx;p.v.z=tz;}else{p.v.x+=dvx/dl*acc;p.v.z+=dvz/dl*acc;}
  if(dl>6&&hyp(p.v.x,p.v.z)>3&&rnd()<dt*8)S.fx('squeak',p);}
 // actions
 if(a){a.t+=dt;switch(a.k){
  case'shoot':{if(a.ft)break;p.v.x*=.86;p.v.z*=.86;faceTo(p,H.x,0,dt,14);if(a.t>=.2&&!a.jumped){a.jumped=true;jump(p,a.vy);}
   if(!a.rel&&!a.human&&a.t>=a.T+(a.err??(a.err=gauss()*.045*(1.3-S.teams[p.team].diff.iq))))release(p,a.err/a.T);
   if(a.rel&&!air&&a.t>a.relT+.15){p.act=null;p.anim.act='';}
   if(!a.rel&&!has){p.act=null;p.anim.act='';}break;}
  case'layup':case'dunk':{const dunk=a.k==='dunk',ux=H.x-p.p.x,uz=-p.p.z,ul=hyp(ux,uz)||1;
   if(!a.jumped){faceTo(p,H.x,0,dt,12);const sp=Math.max(3,hyp(p.v.x,p.v.z));p.v.x=ux/ul*sp*.85;p.v.z=uz/ul*sp*.85;
    if(a.t>=.18){a.jumped=true;if(dunk){const need=Math.max(.45,C.RH+.18-2.14*p.h);a.vy=Math.sqrt(2*C.G*need)+.2;}else a.vy=2.9+p.at.hops/100*.6;jump(p,a.vy);a.tp=a.vy/C.G;
     const stop=dunk?.42:.85,tx=dunk?H.x-ux/ul*stop:H.x-H.s*Math.max(.5,-ux/ul*H.s*stop),tz=-uz/ul*stop*(dunk?1:.6),dd=hyp(tx-p.p.x,tz-p.p.z),hs=Math.min(dunk?7.5:5,dd/a.tp);p.v.x=(tx-p.p.x)/(dd||1)*hs;p.v.z=(tz-p.p.z)/(dd||1)*hs;}
    if(!has){p.act=null;p.anim.act='';}}
   else if(!a.rel){if(!has){p.act=null;p.anim.act='';}else if(dunk){if(p.vy<=.15||a.t>=.18+a.tp)slam(p);}else if(p.vy<=.6)layupRelease(p);}
   else if(a.hang>0){a.hang-=dt;p.vy=0;p.p.y=a.hy;p.v.set(0,0,0);if(a.hang<=0){p.vy=-.5;p.p.y=a.hy-.01;p.anim.v=0;act(p,'reb',.5);}}
   else if(!air&&a.t>a.relT+.12){p.act=null;if(p.anim.act==='layup'||p.anim.act==='dunk')p.anim.act='';}
   break;}
  case'pass':if(a.t>.3)p.act=null;break;
  case'move':{const f=fwd(p),k=a.t/a.dur;if(a.kind==='cross'){const lx=f.z*a.side,lz=-f.x*a.side,sp=k<.75?5.2:2.5;p.v.x=lx*sp+f.x*2.2;p.v.z=lz*sp+f.z*2.2;if(!a.done&&a.t>.12){a.done=true;p.drib=-p.drib||1;}}
   else if(a.kind==='spin'){const ang=a.side*Math.PI*k;const c=Math.cos(ang),s=Math.sin(ang);p.v.x=(f.x*c-f.z*s*a.side)*4.4;p.v.z=(f.z*c+f.x*s*a.side)*4.4;if(!a.done&&a.t>.24){a.done=true;p.drib=-p.drib||1;}}
   else{const sp=k<.6?-4.2:-1;p.v.x=f.x*sp;p.v.z=f.z*sp;}
   if(a.t>=a.dur){p.act=null;}break;}
  case'steal':if(!a.done&&a.t>.12){a.done=true;stealTry(p);}if(a.t>.38)p.act=null;break;
  case'jump':if(!air&&a.t>.2){p.act=null;if(p.anim.act==='block'||p.anim.act==='reb')p.anim.act='';}break;}}
 // integrate
 if(air&&!(a&&a.hang>0)){p.vy-=C.G*dt;}
 p.p.x+=p.v.x*dt;p.p.z+=p.v.z*dt;p.p.y+=p.vy*dt;if(p.p.y<=0&&(p.vy<0||p.p.y<0)){if(p.p.y<0||p.vy<0){if(p.vy<-1.5)S.fx('land',p,-p.vy);}p.p.y=0;p.vy=0;if(air&&!(a&&(a.k==='dunk'||a.k==='layup'||a.k==='shoot'))){p.v.x*=.4;p.v.z*=.4;}}
 const bx=S.inb&&S.inb.by===p?2:1.3;p.p.x=cl(p.p.x,CT.xmin-bx,CT.xmax+bx);p.p.z=cl(p.p.z,-C.W-bx,C.W+bx);
 // facing
 if(!(a&&(a.k==='shoot'||a.k==='dunk'||a.k==='layup'||a.k==='move'))){const sp=hyp(p.v.x,p.v.z);const ft=p.ai.face;
  if(ft&&(!h||h.idle>.35||!has&&p.def)&&!(has&&sp>1.5))faceTo(p,ft.x,ft.z,dt,9);else if(sp>.4)faceTo(p,p.p.x+p.v.x,p.p.z+p.v.z,dt,10);else if(has)faceTo(p,H.x,0,dt,4);}
 // dribble rhythm
 if(has&&!p.hold){p.anim.dph+=dt*(1.45+hyp(p.v.x,p.v.z)*.07);}else p.anim.dph=0;
 if(has&&p.hold){p.holdT+=dt;if(hyp(p.v.x,p.v.z)>.9&&S.phase==='live')p.hold=false;}
 p.drib=has&&!p.hold&&!(a&&a.k!=='move')?(p.drib||1):has?p.drib:0;}
function faceTo(p,x,z,dt,rate){const t=Math.atan2(x-p.p.x,z-p.p.z);let d=t-p.face;d=Math.atan2(Math.sin(d),Math.cos(d));p.face+=d*Math.min(1,dt*rate);}
function collide(){const n=S.pl.length;for(let i=0;i<n;i++){const a=S.pl[i];for(let j=i+1;j<n;j++){const b=S.pl[j];if(Math.abs(a.p.y-b.p.y)>.8)continue;
  const dx=b.p.x-a.p.x,dz=b.p.z-a.p.z,d=hyp(dx,dz),r=.36*(a.h+b.h);if(d>=r||d<1e-5)continue;const o=r-d,nx=dx/d,nz=dz/d;
  const wa=anchor(a),wb=anchor(b),ka=wb/(wa+wb),kb=wa/(wa+wb);a.p.x-=nx*o*ka;a.p.z-=nz*o*ka;b.p.x+=nx*o*kb;b.p.z+=nz*o*kb;
  // bleed the velocity into each other (screens stop people)
  const rv=(b.v.x-a.v.x)*nx+(b.v.z-a.v.z)*nz;if(rv<0){a.v.x+=nx*rv*ka;a.v.z+=nz*rv*ka;b.v.x-=nx*rv*kb;b.v.z-=nz*rv*kb;if(-rv>3.2&&live())bump(a,b,-rv);}}}}
function anchor(p){return p.anim.act==='screen'?5:p.act&&(p.act.k==='shoot'||p.act.k==='dunk')?3:p.def&&hyp(p.v.x,p.v.z)<1?2:1;}
// a hard collision between a driver and a defender: charge or block (rare)
function bump(a,b,sp){const own=S.ball.owner;if(!own||(own!==a&&own!==b))return;const dfd=own===a?b:a;if(dfd.team===own.team)return;if(dHoop(own)>6)return;
 const set=hyp(dfd.v.x,dfd.v.z)<1.1&&dHoop(dfd)>1.3;if(rnd()<.18*(sp/5)){if(set)foulOn(own,dfd,'offensive');else foulOn(dfd,own,'blocking');}}
function stealTry(p){const b=S.ball,o=b.owner;if(!o||o.team===p.team)return;const f=fwd(p),dx=o.p.x-p.p.x,dz=o.p.z-p.p.z,d=hyp(dx,dz);if(d>1.45||(dx*f.x+dz*f.z)/(d||1)<.2)return;
 const T=S.teams[p.team],hm=T.human,shooting=o.act&&(o.act.k==='shoot'||o.act.k==='layup'||o.act.k==='dunk');if(o.p.y>0)return;
 const ch=cl(.07+(p.at.stl-o.at.hand)/100*.5+(o.hold?-.04:.03)+(hm?.08:0),.02,.4);
 if(rnd()<ch&&!shooting){stat(p,'stl');stat(o,'to');S.fx('steal',p,o);feed(`STEAL · ${p.short}`,p.team);loose(p,o);}
 else if(rnd()<(shooting?.5:.13)*(hm?1:T.diff.foul)){if(shooting){const sh={by:o};foulOn(p,o,'reach-in');}else foulOn(p,o,'reach-in');}}
function loose(p,o){const b=S.ball;b.owner=null;b.shot=null;b.pass=null;b.p.set(o.p.x,.9,o.p.z);const dx=p.p.x-o.p.x,dz=p.p.z-o.p.z,d=hyp(dx,dz)||1;b.v.set(dx/d*3.5,1.5,dz/d*3.5);b.last=p;b.lastTeam=p.team;o.drib=0;o.hold=false;}
/* ---- rim finishes ---- */
function layupRelease(p){const a=p.act,H=hoopOf(p.team),c=contestOf(p),T=S.teams[p.team];a.rel=true;a.relT=a.t;p.anim.rel=p.anim.t;
 let q=(.44+.5*p.at.ins/100)*(1-.34*c);if(!T.human)q+=T.diff.shot;const DT_=S.teams[1-p.team];if(!DT_.human)q-=(DT_.diff.con-1)*.25;q=cl(q,.1,.95);const made=rnd()<q;const b=S.ball;
 const src=b.hp.y>1.5&&b.owner===p&&b.hpO===p?b.hp.clone():new V(p.p.x,2.25*p.h+p.p.y,p.p.z);if((src.x-H.x)*H.s>-.3)src.x=H.x-H.s*.3;{const rx=src.x-H.x,rd=hyp(rx,src.z);if(rd<.62){src.x=H.x+rx/rd*.62;src.z*=.62/rd;}}// never from behind the glass or under the ring; arc high enough to drop in
 let ox=0,oz=0;if(!made){const ang=rnd()*6.28,r=.17+rnd()*.12;ox=Math.cos(ang)*r;oz=Math.sin(ang)*r;}else{ox=(rnd()-.5)*.04;oz=(rnd()-.5)*.04;}
 tv.set(H.x+ox,C.RH+.02,oz);b.owner=null;b.p.copy(src);for(let g=1;g<1.5;g+=.05){solve(src,tv,g,b.v);if(src.y+b.v.y*b.v.y/(2*C.G)>C.RH+.42)break;}b.shot={by:p,team:p.team,pts:2,hoop:H,t:0,rim:false,foul:null,made,lay:true,d:dHoop(p)};b.last=p;b.lastTeam=p.team;stat(p,'fga');
 const dfd=opp(p.team).pl.find(o=>hyp(o.p.x-p.p.x,o.p.z-p.p.z)<1.1);if(dfd&&rnd()<.2*(S.teams[1-p.team].human?1:S.teams[1-p.team].diff.foul))b.shot.foul={by:dfd,n:2};
 S.fx('release',p,null,0,b.shot);}
function slam(p){const a=p.act,H=hoopOf(p.team),b=S.ball;a.rel=true;a.relT=a.t;
 // a well-timed rim protector can stuff it
 const prot=opp(p.team).pl.find(o=>o.p.y>.25&&hyp(o.p.x-H.x,o.p.z)<1.6&&hyp(o.p.x-p.p.x,o.p.z-p.p.z)<1.2);
 if(prot&&rnd()<cl((prot.at.blk-p.at.dunk)/100+.22,.06,.45)*(S.teams[prot.team].human?1.2:S.teams[prot.team].diff.block)){b.owner=null;b.p.set(p.p.x,reach(p)+.1,p.p.z);const ux=p.p.x-H.x,uz=p.p.z,ul=hyp(ux,uz)||1;b.v.set(ux/ul*6,1.5,uz/ul*6+(rnd()-.5)*3);
  b.shot=null;b.last=prot;b.lastTeam=prot.team;stat(p,'fga');stat(prot,'blk');S.fx('block',prot,p,true);feed(`REJECTED AT THE RIM · ${prot.short}`,prot.team);p.anim.v=0;act(p,'reb',.6);return;}
 const contact=opp(p.team).pl.filter(o=>hyp(o.p.x-p.p.x,o.p.z-p.p.z)<1.25&&o.stun<=0);
 b.owner=null;b.p.set(H.x,C.RH+.3,0);b.v.set(0,-6,0);b.shot={by:p,team:p.team,pts:2,hoop:H,t:0,rim:true,foul:null,made:true,dunk:true,d:0};b.last=p;b.lastTeam=p.team;stat(p,'fga');stat(p,'dnk');
 for(const o of contact){o.stun=1.1;act(o,'fall',1.3);o.v.set((o.p.x-p.p.x)*2,0,(o.p.z-p.p.z)*2);}
 if(contact.length&&rnd()<.3)b.shot.foul={by:contact[0],n:2};
 H.flex=1;p.anim.v=1;p.anim.t=0;a.hang=.5;const ux=H.x-p.p.x,uz=-p.p.z,ul=hyp(ux,uz)||1;p.p.x=H.x-ux/ul*.42;p.p.z=-uz/ul*.42*0+p.p.z*.3;a.hy=Math.max(.2,C.RH+.06-2.14*p.h);p.p.y=a.hy;p.v.set(0,0,0);
 p.anim.v=2;S.fx('slam',p,contact.length>0);}
/* ---- the ball ---- */
function ballStep(dt){const b=S.ball;if(b.owner){const o=b.owner;if(b.hp.y>0&&b.hpT===S.time){}else{b.p.set(o.p.x+Math.sin(o.face)*.35,1.0*o.h+o.p.y,o.p.z+Math.cos(o.face)*.35);}
  if(live()&&!(S.inb&&S.inb.by===o)&&!inBounds(o.p.x,o.p.z,-.02)&&o.p.y<=0){turnover(o,'OUT OF BOUNDS');b.owner=null;b.v.set(0,0,0);}return;}
 if(b.shot)b.shot.t+=dt;if(b.pass)b.pass.t+=dt;
 const py=b.p.y;stepBall(b,dt,(k,a,H)=>{if(k==='score')onScore(a);else if(k==='rim'){if(b.shot)b.shot.rim=true;S.fx('rim',a,H);}else if(k==='board'){if(b.shot)b.shot.rim=true;S.fx('board',a,H);}else if(k==='floor'){S.fx('floor',a);
   if(b.shot&&b.shot.foul&&S.phase==='live')shotFoulResolve();}});
 if(S.phase==='dead'||S.phase==='end'||S.phase==='qbreak'){b.pass=null;return;}
 if(S.phase==='ft')return;
 // buzzer-beater resolution
 if(S.buzz&&(b.floorT>0||(b.shot&&b.shot.rim&&b.p.y<C.RH-.8)||!b.shot)){S.buzz=false;b.shot=null;endPeriod();return;}
 // shooting foul on a miss
 if(b.shot&&b.shot.foul&&(b.shot.t>2.2||(b.shot.rim&&b.p.y<C.RH-.5&&b.v.y<0))&&S.phase==='live'){shotFoulResolve();return;}
 // blocks: a rising shot meets a leaping hand
 if(b.shot&&!b.shot.dunk&&!b.shot.ft&&b.shot.t<.4&&b.v.y>-1){for(const o of opp(b.shot.team).pl){if(o.p.y<.1)continue;tv2.set(o.p.x,reach(o)+.05,o.p.z);if(tv2.distanceTo(b.p)<.42){const hm=S.teams[o.team].human;
   if(rnd()<cl(.35+o.at.blk/100*.45,.2,.85)*(hm?1:S.teams[o.team].diff.block+.2)){const sh=b.shot;stat(o,'blk');const H=sh.hoop,ux=b.p.x-H.x,uz=b.p.z,ul=hyp(ux,uz)||1;b.v.set(ux/ul*5.5+(rnd()-.5)*2,1+rnd()*2,uz/ul*5.5+(rnd()-.5)*3);
    b.shot=null;b.last=o;b.lastTeam=o.team;S.fx('block',o,sh.by,false);feed(`BLOCKED · ${o.short}`,o.team);break;}else{b.shot.tried=1;}}}}
 // out of bounds
 if(b.p.y<1.1&&!inBounds(b.p.x,b.p.z,-.02)&&live()&&!(b.pass&&b.pass.t<.45)){const t=b.lastTeam>=0?b.lastTeam:0;S.fx('out',b.p.clone(),b.last&&b.last.short,b.shot?'shot':b.pass?'pass':'loose');feed('OUT OF BOUNDS',t);b.shot=null;b.pass=null;const x=b.p.x;toDead(1,()=>sideInbound(1-t,x));return;}
 // catches, interceptions, rebounds, loose balls
 const pz=b.pass;let best=null,bd=1e9;
 for(const p of S.pl){if(p.stun>0||(p.act&&(p.act.k==='shoot'||p.act.k==='layup'||p.act.k==='dunk')))continue;if(b.shot&&b.shot.dunk&&b.p.y>C.RH-.6)break;const dx=b.p.x-p.p.x,dz=b.p.z-p.p.z,dh=hyp(dx,dz);
  const rr=reach(p)+.15,lowOK=b.p.y>.15;if(dh>(p.p.y>0?.85:.7)||b.p.y>rr||!lowOK)continue;
  if(pz){if(pz.from===p&&pz.t<.35)continue;if(p.team!==pz.team){if(pz.tried.has(p))continue;pz.tried.add(p);const hm=S.teams[p.team].human;const ch=cl((p.at.stl/100)*.22*(hm?1.3:S.teams[p.team].diff.steal)*(pz.oop?.6:1)+(dh<.4?.08:0),.02,.4);
    if(rnd()<ch){stat(p,'stl');stat(pz.from,'to');S.fx('steal',p,pz.from,true);feed(`PICKED OFF · ${p.short}`,p.team);give(p,'steal');return;}continue;}
   if(pz.oop&&p===pz.to&&p.p.y>.2&&dHoop(p)<1.8){give(p,'pass');p.act={k:'dunk',t:.3,jumped:true,rel:false,tp:.1,side:1};act(p,'dunk',99,{v:0});slam(p);return;}
   give(p,'pass');return;}
  if(b.shot&&!b.shot.rim&&b.shot.t<.9)continue;// let shots fly
  let sc=dh-(p.p.y>.1?.2:0)-(b.shot&&p.team!==b.shot.team?.12:0);if(sc<bd){bd=sc;best=p;}}
 if(best){const sh=b.shot;if(sh&&sh.foul&&S.phase==='live'){shotFoulResolve();return;}
  if(sh){stat(best,'reb');if(best.team===sh.team)stat(best,'oreb');S.fx('rebound',best,best.team===sh.team);const oreb=best.team===sh.team;b.shot=null;give(best,'rebound');if(oreb)S.sc=Math.min(S.scLen,S.street?12:14);}
  else give(best,'loose');}
 // prediction for the AI (where will this come down?)
 S.predT-=dt;if(S.predT<=0){S.predT=.1;predict(b,2.2,.05,S.pred);}}
function refStep(r,dt){const b=S.ball,i=S.refs.indexOf(r);let tx,tz;if(i===0){tx=cl(b.p.x*.8,-C.L+3,C.L-3);tz=-(C.W+.9);}else{const s=S.poss>=0?hoopOf(S.poss).s:1;tx=s*(C.L+.9);tz=-(C.W*.55);}
 if(S.phase==='tip'&&i===0){r.v.set(0,0,0);return;}const dx=tx-r.p.x,dz=tz-r.p.z,d=hyp(dx,dz);const sp=d>.3?Math.min(5.5,d*2):0;r.v.set(d?dx/d*sp:0,0,d?dz/d*sp:0);r.p.x+=r.v.x*dt;r.p.z+=r.v.z*dt;faceTo(r,b.p.x,b.p.z,dt,6);}
export function refWhistle(){for(const r of S.refs)act(r,'whistle',1.2);}
export function clockText(){if(S.sudden)return'NEXT';const t=Math.max(0,S.clock);if(t<60&&!S.street)return t.toFixed(1);const m=Math.floor(t/60),s=Math.floor(t%60);return m+':'+String(s).padStart(2,'0');}
export function periodText(){if(S.street)return S.sudden?'SUDDEN DEATH':'TO 21';return S.q>4?'OT'+(S.q>5?S.q-4:''):['','1ST','2ND','3RD','4TH'][S.q];}
