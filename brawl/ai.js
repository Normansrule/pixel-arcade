// PLATFORM BRAWL — CPU fighters, levels 1–9. Reads the world like a player (with reaction delay) and writes the same inputs.
// Neutral spacing, projectile zoning, shield + punish, grab/throw choice, combo chasing, edge-guarding, recovery, DI, teching, hazard dodging.
import {blankInput} from './sim.js';
const sgn=v=>v<0?-1:v>0?1:0,rnd=()=>Math.random();
export function level(L){const q=(Math.max(1,Math.min(9,L))-1)/8;return{q,react:Math.round(32-27*q),shield:.03+.6*q,aggr:.35+.6*q,acc:.35+.65*q,forget:.3*(1-q)*(1-q),edge:q>=.37,di:q>=.25,tech:.75*q,combo:q>=.3,spacing:q>=.5,hop:.25+.5*q};}

export function think(f,w){const inp=blankInput();f.inp=inp;const m=f.ai||(f.ai={t:0,next:0,plan:null,tgt:null,tgtT:0,hold:0,def:null,ledgeT:0,charge:0,lastSeen:new Map(),pumN:0,hopAir:null});m.t++;const P=f.lvlP||(f.lvlP=level(f.lvl));
 const S=w.stage.solids[0],st=f.st;
 if(st==='dead'||st==='out')return inp;
 if(st==='held'){inp.mash=rnd()<.15+P.q*.5;inp.x=rnd()<.5?-1:1;return inp;}
 if(st==='revive'){if(f.t>18+rnd()*40)inp.x=f.x>0?-1:1;return inp;}
 if(st==='dizzy'){inp.mash=rnd()<.3;return inp;}
 // DI and teching while launched
 if((st==='tumble'||st==='stun')&&f.hitstun>0){if(P.di&&rnd()<.25+P.q){const kx=f.kx,ky=f.ky;if(Math.abs(kx)>Math.abs(ky)*.6){inp.x=-sgn(kx)*.75;inp.y=.75;}else if(ky>0){inp.x=f.x>0?-1:1;}}
  if(st==='tumble'&&!m.tech&&f.ky+f.vy<0){const g=w.surfaceBelow(f.x,f.y);if(g&&f.y-g.y<1.6&&rnd()<P.tech){inp.shieldP=true;m.tech=true;}}return inp;}
 m.tech=false;
 if(st==='down'){if(f.t>20+rnd()*30*(1-P.q)){const r=rnd();if(r<.3)inp.atkP=true;else if(r<.7)inp.x=rnd()<.5?-1:1;else inp.y=1;}return inp;}
 if(st==='ledge'){if(!m.ledgeT)m.ledgeT=10+(rnd()*40*(1-P.q)|0);if(f.t>=m.ledgeT){m.ledgeT=0;const r=rnd();inp.want=r<.4?'lclimb':r<.62?'ljump':r<.82?'lroll':'latk';}return inp;}
 m.ledgeT=0;
 if(st==='hold')return grabAI(f,w,inp,m,P,S);
 // pick a target
 if(!m.tgt||m.t>m.tgtT||!alive(m.tgt)){let best=null,bd=1e9;for(const o of w.f){if(o===f||!alive(o))continue;const d=Math.hypot(o.x-f.x,o.y-f.y)-(o.human>=0?3:0)+(o.st==='revive'?20:0);if(d<bd){bd=d;best=o;}}m.tgt=best;m.tgtT=m.t+90+rnd()*90;}
 const T=m.tgt;
 // recovery has priority
 const off=f.x<S.x0-.1||f.x>S.x1+.1||(!f.ground&&f.y<S.y-.4&&(f.x<S.x0+1||f.x>S.x1-1));
 if(!f.ground&&off){recover(f,w,inp,m,P,S);return inp;}
 if(st==='helpless'){inp.x=sgn(-f.x);return inp;}
 if(!T){inp.x=sgn(-f.x)*(Math.abs(f.x)>3?1:0);return inp;}
 hazardDodge(f,w,inp,P,S);if(inp.want)return inp;
 const dx=T.x-f.x,dy=T.y-f.y,adx=Math.abs(dx),dir=sgn(dx)||f.face;
 // charge release / jet / breath holds
 if(st==='atk'){const K=f.move&&f.move.sp&&f.move.sp.kind;if(f.move&&f.move.charge&&m.charge>0){inp.want='charge';m.charge--;}
  if(K==='breath'&&adx<2.8&&Math.abs(dy)<1.6)inp.spc=true;
  if((K==='cshot'||K==='cpunch')&&m.charge>0){inp.spc=true;m.charge--;}
  if(!f.ground){inp.x=m.drift||0;}return inp;}
 // keep shielding while a threat is live
 const thr=threat(T,f);
 if(st==='shield'||st==='sstun'){if(thr&&m.hold-->0){inp.shield=true;return inp;}
  if(adx<1.9&&Math.abs(dy)<1.2&&rnd()<.4+P.q*.6){inp.want=rnd()<.6?'grab':(rnd()<.5?'uspec':'usmash');inp.x=dir;inp.y=inp.want==='grab'?0:1;inp.shield=true;return inp;}
  return inp;}
 // react to incoming attacks
 if(thr&&m.def!==thr.id){m.def=thr.id;if(rnd()<P.shield){if(f.ground&&ACT(f)){const r=rnd();if(r<.65){inp.want='shield';inp.shield=true;m.hold=6+(rnd()*10|0);return inp;}if(r<.8){inp.want='dodge';return inp;}inp.want='roll';inp.x=-dir;return inp;}
   if(!f.ground&&!f.adUsed&&rnd()<.5){inp.want='adodge';inp.x=-dir*.7;inp.y=.3;return inp;}}}
 // decision cadence (reaction delay)
 if(m.t<m.next&&m.plan){return follow(f,w,inp,m,P,S,T);}
 m.next=m.t+P.react+(rnd()*P.react*.5|0);m.plan=decide(f,w,m,P,S,T);return follow(f,w,inp,m,P,S,T);}

const alive=o=>o&&o.st!=='dead'&&o.st!=='out';
const ACT=f=>['idle','walk','run','crouch','land'].includes(f.st)&&(f.st!=='land'||f.t>=f.lag);
function threat(T,f){if(T.st!=='atk'||!T.move)return null;const m=T.move;for(const h of m.h){if(T.mt>h.e||h.s-T.mt>9)continue;const cx=T.x+T.face*h.x,cy=T.y+h.y;const d=Math.hypot(cx-f.x,cy-(f.y+f.H*.5));if(d<h.r+f.W/2+1.1)return{id:T.id*1000+(T.mname.length*31)+(T.mt-T.t),h};}
 return null;}
function hazardDodge(f,w,inp,P,S){const z=w.haz,H=w.stage.hazard;if(!H||!z||!(z.warn||z.on)||P.q<.2)return;if(rnd()>.3+P.q)return;
 if(H.kind==='geyser'&&Math.abs(f.x-z.x)<2.8&&f.ground){inp.x=f.x<z.x?-1:1;if(f.x-S.x0<2.5||S.x1-f.x<2.5)inp.x=-inp.x;if(Math.abs(f.x-z.x)<1.6&&z.warn&&w.haz.t>H.warn-25){inp.want='jump';}}
 if(H.kind==='laser'&&f.ground&&(z.warn&&z.t>H.warn-14||z.on)){if(z.y<S.y+1){inp.want='jump';}else if(z.y<S.y+2.5){inp.y=-1;inp.want=null;}}}

/* ---------- planning ---------- */
function decide(f,w,m,P,S,T){const dx=T.x-f.x,dy=T.y-f.y,adx=Math.abs(dx),dir=sgn(dx)||f.face,mv=f.mv;
 // items: heal when hurt, bombs to throw
 const it=w.items.find(i=>!i.held&&(i.type==='heal'&&f.dmg>40||i.type==='power'||i.type==='bomb'&&P.q>.4&&!f.item)&&Math.abs(i.x-f.x)<12&&i.ground);
 if(it&&rnd()<.6)return{kind:'item',it};
 if(f.item)return{kind:'toss'};
 const Toff=T.x<S.x0-.5||T.x>S.x1+.5||(T.y<S.y-1&&!T.ground);
 if(Toff&&P.edge&&T.st!=='revive')return{kind:'edge'};
 // projectile zoning at range
 const ns=mv.nspec&&mv.nspec.sp,ss=mv.sspec&&mv.sspec.sp;const zoner=ns&&['shoot','cshot'].includes(ns.kind);
 if(adx>5.5&&Math.abs(dy)<3&&f.ground&&rnd()<(zoner?.55:.2)*(.5+P.q*.5)&&w.proj.filter(p=>p.owner===f).length<2){if(ns&&['shoot','cshot'].includes(ns.kind))return{kind:'act',act:'nspec',face:dir,charge:ns.kind==='cshot'?(adx>10?60:20):0};if(ss&&ss.kind==='shoot')return{kind:'act',act:'sspec',face:dir};}
 if(adx>4&&adx<9&&f.ground&&ss&&ss.kind==='dash'&&rnd()<.15)return{kind:'act',act:'sspec',face:dir};
 // punish / combo chase
 const vuln=(T.st==='land'&&T.lag>6)||T.st==='down'||T.st==='dizzy'||T.st==='helpless'&&T.y<S.y+2||(T.st==='atk'&&T.move&&T.mt>Math.max(...T.move.h.map(h=>h.e),0)+3);
 const hurt=(T.st==='stun'||T.st==='tumble')&&T.hitstun>4;
 if(hurt&&P.combo&&adx<6&&dy>-1){return{kind:'chase'};}
 if(T.st==='shield'&&adx<2.5)return{kind:'act',act:'grab',face:dir,approach:true};
 // ranged decision: pick best move for current spacing
 const pick=bestMove(f,T,P,vuln);if(pick)return{kind:'act',act:pick.name,face:dir,approach:true,charge:pick.charge};
 // otherwise approach (sometimes with a hop + aerial), or space out
 if(P.spacing&&adx<2.5&&rnd()<.25)return{kind:'retreat'};
 if(dy>2.5&&adx<6&&T.ground){m.climbT=m.t;return{kind:'climb'};}
 if(rnd()<P.hop*.6&&adx<7&&adx>2)return{kind:'hop',air:pickAir(f,T)};
 return{kind:'approach'};}
function bestMove(f,T,P,vuln){const dx=T.x-f.x,dy=T.y-f.y,face=sgn(dx)||f.face;const rx=dx*face,ry=dy+T.H*.5;let best=null,bs=-1e9;const killy=T.dmg>85;
 const nk=f.mv.nspec&&f.mv.nspec.sp&&f.mv.nspec.sp.kind;const list=f.ground?['jab','ftilt','utilt','dtilt','fsmash','usmash','dsmash','grab','dspec','sspec',...(['cmd','cpunch','breath'].includes(nk)?['nspec']:[])]:['nair','fair','bair','uair','dair'];
 for(const n of list){const m=f.mv[n];if(!m||!m.ai)continue;const a=m.ai;const lead=(T.vx+T.kx)*a.st*face;const px=rx+lead*.5;
  if(px<a.x0-.4-T.W/2||px>a.x1+.3+T.W/2||ry<a.y0-.6||ry>a.y1+.8)continue;
  if(n==='dspec'&&m.sp&&!['counter','reflect'].includes(m.sp.kind)&&!(m.h.length))continue;
  if(n==='dspec'&&m.sp&&['counter','reflect'].includes(m.sp.kind))continue;
  if(n==='sspec'&&m.sp&&m.sp.kind==='shoot')continue;
  if(n==='nspec'&&nk==='breath'&&a.x1<1)continue;let s=a.d*.6-a.st*.35+(rnd()-.5)*6*(1-P.acc);if(n==='nspec'){s=nk==='cmd'?(T.st==='shield'?24:8+(killy?4:0)):nk==='cpunch'?(vuln?14:2):6;}if(killy)s+=a.kb*.08;else if(/smash/.test(n))s-=6;if(vuln)s+=/smash/.test(n)?8:0;if(n==='grab')s+=T.st==='shield'?20:(killy?-2:3);
  if(s>bs){bs=s;best={name:n,charge:vuln&&(/smash/.test(n)||nk==='cpunch'&&n==='nspec')?Math.round(20+rnd()*30):(n==='nspec'&&nk==='breath'?40:0)};}}
 if(best&&rnd()>P.aggr+.15)return null;return best;}
function pickAir(f,T){const dy=T.y-f.y;if(dy>1.6)return'uair';return rnd()<.6?'fair':'nair';}

/* ---------- executing plans ---------- */
function follow(f,w,inp,m,P,S,T){const p=m.plan,dx=T.x-f.x,dy=T.y-f.y,adx=Math.abs(dx),dir=sgn(dx)||f.face;
 const act=ACT(f)||f.st==='air'||f.st==='tumble'&&f.hitstun<=0;
 const stay=x=>Math.max(S.x0+.8,Math.min(S.x1-.8,x));
 switch(p.kind){
  case 'item':{const it=p.it;if(it.dead||it.held){m.plan=null;break;}inp.x=Math.abs(it.x-f.x)>.5?sgn(it.x-f.x):0;if(Math.abs(it.x-f.x)<.8&&it.type==='bomb'&&f.ground)inp.atkP=true;if(it.y>f.y+1.5&&f.ground&&Math.abs(it.x-f.x)<2)inp.want='jump';break;}
  case 'toss':{if(!f.item){m.plan=null;break;}if(adx<9&&Math.abs(dy)<3){inp.x=dir;inp.atkP=true;m.plan=null;}else inp.x=dir;break;}
  case 'edge':{const side=T.x<0?-1:1,ex=side<0?S.x0:S.x1;const tx=ex-side*1.0;if(f.ground){if(Math.abs(f.x-tx)>.5)inp.x=sgn(tx-f.x);else{f.face!==side&&(inp.x=side*.3);
     const rx=(T.x-f.x)*side,ry=T.y-f.y;
     if(rx>0&&rx<2.6&&ry>-2.4&&ry<1.4&&rnd()<.25+P.q*.4){inp.want=ry<-.6?'dsmash':'fsmash';inp.x=side;m.plan=null;}
     else if(P.q>.6&&rx>1.5&&rx<6&&ry>-3&&ry<3&&f.jumpsLeft>0&&rnd()<.04){inp.want='jump';m.plan={kind:'hop',air:rx>0?'fair':'bair',drift:side};}
     else{const ns=f.mv.nspec&&f.mv.nspec.sp;if(ns&&ns.kind==='shoot'&&Math.abs(ry)<1.5&&rnd()<.05){inp.want='nspec';inp.x=side;}}}}
   else inp.x=sgn(tx-f.x);if(!(T.x<S.x0-.5||T.x>S.x1+.5||(T.y<S.y-1&&!T.ground))){m.plan=null;}break;}
  case 'chase':{inp.x=adx>.6?dir:0;if(f.ground){if(dy>1.2&&adx<3&&act)inp.want='jump';else if(adx<1.6&&Math.abs(dy)<1.2&&act){inp.want=dy>.5?'utilt':'jab';inp.x=dir;}}
   else if(act){const a=airFor(f,T);if(a){inp.want=a;inp.x=a==='bair'?-f.face:f.face;}else if(dy>1.5&&f.jumpsLeft>0&&f.vy<.05&&rnd()<.3)inp.want='jump';}
   if(!((T.st==='stun'||T.st==='tumble')&&T.hitstun>0))m.plan=null;break;}
  case 'act':{const mvm=f.mv[p.act];if(!mvm){m.plan=null;break;}const a=mvm.ai;const rx=dx*(p.face||dir);const tgtx=(a.x0+a.x1)/2;
   if(p.approach&&f.ground&&(rx>a.x1+.3+T.W/2||rx<a.x0-.4)&&!/spec$/.test(p.act)){inp.x=sgn(rx-tgtx)*(p.face||dir);if(Math.abs(rx-tgtx)>3&&f.st==='run'&&rnd()<.04&&f.mv.dash){inp.want='dash';inp.x=dir;m.plan=null;}if(adx>9)m.plan=null;break;}
   if(!act)break;
   if(!f.ground&&!mvm.air&&!/spec$/.test(p.act)){m.plan=null;break;}
   if(f.ground&&mvm.air){inp.want='hop';m.plan={kind:'hop',air:p.act};break;}
   inp.want=p.act;inp.x=p.face||dir;if(p.act==='nspec'&&f.ground)f.face=p.face||dir;
   if(p.act==='uspec')inp.y=1;if(p.act==='dspec')inp.y=-1;m.charge=p.charge||0;m.plan=null;break;}
  case 'hop':{if(f.ground&&act){inp.want='hop';inp.x=dir*.6;break;}if(!f.ground){m.drift=p.drift||dir;inp.x=m.drift;const a=airFor(f,T)||(f.vy<0&&f.y-S.y<1.4?p.air:null);if(a&&act){inp.want=a;inp.x=a==='bair'?-f.face:a==='fair'?f.face:0;m.plan=null;}}break;}
  case 'retreat':inp.x=-dir;if(f.x<S.x0+2||f.x>S.x1-2){m.plan=null;}break;
  case 'climb':{if(f.ground&&act&&adx<3.5)inp.want='jump';else if(f.ground)inp.x=sgn(dx);else{inp.x=sgn(dx)*(adx>.6?1:0);if(f.vy<.05&&f.y<T.y-.3&&f.jumpsLeft>0&&act)inp.want='jump';}if(!f.ground&&f.y>T.y+.2||m.t-(m.climbT||0)>150){m.plan=null;}break;}
  case 'approach':default:{const goal=stay(T.x-dir*1.4);const gd=Math.abs(goal-f.x);if(gd>(m.near?1.1:.5)){inp.x=sgn(goal-f.x);m.near=false;}else{inp.x=0;m.near=true;}if(f.ground&&T.y<f.y-1.5&&f.ground.soft&&Math.abs(dx)<5){inp.y=f.py<-.5?0:-1;inp.x=0;}
   if(f.ground&&dy>2.8&&adx<3&&act&&rnd()<.1)inp.want='jump';if(!f.ground&&act){const a=airFor(f,T);if(a){inp.want=a;inp.x=a==='bair'?-f.face:f.face;}}break;}
 }
 if(f.st==='crouch'&&inp.y===0&&!inp.want)inp.x=inp.x||0;
 // don't run off the stage by accident
 if(f.ground&&!f.ground.soft&&inp.x&&!inp.want){const nx=f.x+inp.x*1.2;if(nx<S.x0+.3||nx>S.x1-.3)if(!(m.plan&&m.plan.kind==='edge'))inp.x=0;}
 return inp;}
function airFor(f,T){const dx=T.x-f.x,dy=(T.y+T.H*.5)-(f.y+f.H*.5),fx=dx*f.face;
 const inBox=n=>{const m=f.mv[n];if(!m||!m.ai)return false;const a=m.ai,rx=fx,ry=dy+f.H*.5,lead=a.st*.5;return rx>a.x0-.5-T.W/2-lead*.1&&rx<a.x1+.4+T.W/2&&ry>a.y0-.6&&ry<a.y1+.6;};
 for(const n of[dy>1.2?'uair':null,dy<-1.2?'dair':null,fx>0?'fair':'bair','nair']){if(n&&inBox(n))return n;}return null;}

/* ---------- grabbing ---------- */
function grabAI(f,w,inp,m,P,S){const v=f.held;if(!v)return inp;if(f.t<8+(1-P.q)*12)return inp;
 if(m.pumN<(P.q>.5?2:0)&&f.t<40){if(f.pumT<=0){inp.want='pummel';m.pumN++;}return inp;}m.pumN=0;
 const toEdgeR=S.x1-f.x,toEdgeL=f.x-S.x0,edgeDir=toEdgeR<toEdgeL?1:-1;let k;
 if(v.dmg>100)k=Math.min(toEdgeR,toEdgeL)<7?(edgeDir===f.face?'f':'b'):'u';else if(v.dmg<45&&P.combo)k=rnd()<.6?'d':'u';else k=Math.min(toEdgeR,toEdgeL)<6?(edgeDir===f.face?'f':'b'):(rnd()<.5?'f':'b');
 inp.want='throw'+k.toUpperCase();return inp;}

/* ---------- recovery ---------- */
function recover(f,w,inp,m,P,S){const side=f.x<0?-1:1,ex=side<0?S.x0:S.x1,ey=S.y;const dx=ex-f.x,dy=ey-f.y,toward=-side;inp.x=toward;
 const st=f.st,act=st==='air'||(st==='tumble'&&f.hitstun<=0);const up=f.mv.uspec,K=up&&up.sp&&up.sp.kind;
 if(st==='atk'&&f.mname==='uspec'){if(K==='jet'){inp.spc=f.y<ey+2.5||Math.abs(dx)>1.5;inp.x=toward;}if(K==='tele'){const L=Math.hypot(dx,dy+1.2)||1;inp.x=dx/L;inp.y=(dy+1.2)/L;}return;}
 if(st==='atk'){inp.x=toward;return;}
 if(!act){inp.x=toward;return;}
 if(m.forgot===undefined||m.forgotT!==f.usedUp){m.forgot=rnd()<P.forget;m.forgotT=f.usedUp;}
 const below=f.y<ey-.3,far=Math.abs(dx)>(K==='tele'?6.5:5),falling=f.vy+f.ky<.02;
 // side special to cover distance
 const ss=f.mv.sspec&&f.mv.sspec.sp;if(Math.abs(dx)>8&&!f.usedSide&&ss&&(ss.kind==='dash'||ss.kind==='spin')&&f.y>ey-3&&rnd()<.5){inp.want='sspec';inp.x=toward;return;}
 if(f.jumpsLeft>0&&falling&&(f.y<ey+1.5||far)){inp.want='jump';inp.x=toward;return;}
 if(!f.usedUp&&!m.forgot&&falling&&(below||far)){const reach=K==='tele'?6.8:K==='jet'?8:K==='rise'?(up.sp.vy*up.sp.dur*.8+2.5):4;
  if(dy<reach-.5||f.y<ey-reach*.8||f.y<w.stage.blast.b+8){inp.want='uspec';if(K==='tele'){const L=Math.hypot(dx,dy+1.2)||1;inp.x=dx/L;inp.y=(dy+1.2)/L;}else{inp.x=toward;inp.y=1;}return;}}
 if(!f.adUsed&&P.q>.55&&falling&&Math.abs(dx)<4&&dy>0&&dy<3&&f.usedUp&&f.jumpsLeft===0){inp.want='adodge';inp.x=toward*.7;inp.y=.7;}}
