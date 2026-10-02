// STRIKER 11 — match simulation: players, possession + dribbling, kicks, tackles, fouls + cards, offside,
// set pieces (kick-off, throw-in, corner, goal kick, free kick, penalty), clock + periods, extra time and shootouts.
import * as THREE from '../vendor/three.module.min.js';
import {P,R,Ball,setPitch,stepBall,predict,crossing,passSpeed,loftVel} from './physics.js';
import {CLUBS,squad,SKIN,HAIR,BOOTS,kitsFor} from './data.js';
import {newAnim,act,NP} from './rig.js';
import {teamThink,carrierThink,gkThink,gkRelease,topSpeed,active,lane,homeSpot} from './ai.js';
const V=THREE.Vector3,hyp=Math.hypot,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=Math.random;
const gauss=()=>{let u=0;for(let i=0;i<4;i++)u+=rnd();return(u-2)/.577;};
export const S={phase:'idle',teams:[],plist:[],ents:[],ball:new Ball(),pred:[],cross:[null,null],score:[0,0],period:1,clock:0,per:180,events:[],humans:[],sp:null,pend:null,time:0,
 lastTeam:-1,passTo:null,passLive:false,passFrom:null,pendPass:null,offsideOn:true,offTeam:-1,act:{},fx:()=>{},cup:false,attract:false,deadT:0,goalT:0,breakT:0,endT:0,shoot:null,goal:null,
 stoppage:0,kickoffFirst:0,ref:null,lines:[],thinkT:0,cardInfo:null,penLive:false,lastToucher:null,prevToucher:null,prevT:0,idle:[false,false],breakKind:''};
export const fwdOf=p=>({x:Math.sin(p.face),z:Math.cos(p.face)});
function mkEnt(o){return Object.assign({p:new V(),v:new V(),face:0,h:1,anim:newAnim(),pose:new Float32Array(NP),tp:new Float32Array(NP),visible:true,
 ai:{tx:0,tz:0,sprint:false,mode:'',dT:0,ic:null,runT:0,look:null,save:null},mv:{x:0,z:0},sprint:false,ctl:-1,assist:false,stamina:1,stun:0,slideT:0,dive:0,diveV:0,tackling:0,
 kickCD:0,tackleCD:0,skillT:0,skillCD:0,headCD:0,yellow:0,off:false,hidden:false,offside:false,frozen:false,charging:0,team:-1,role:'',at:{pace:62},
 st:{goals:0,assists:0,shots:0,sot:0,passes:0,passOK:0,tackles:0,saves:0,fouls:0,yel:0,red:0}},o);}
const dark=(h,k=.45)=>{const c=new THREE.Color(h).multiplyScalar(k);return'#'+c.getHexString();};
/* ================= setup ================= */
export function setupMatch(c){setPitch(c.size);
 Object.assign(S,{score:[0,0],period:1,clock:0,per:c.per,events:[],sp:null,pend:null,shoot:null,goal:null,offsideOn:!!c.offside,cup:!!c.cup,attract:!!c.attract,lastTeam:-1,passTo:null,passLive:false,
  pendPass:null,stoppage:0,time:0,cardInfo:null,penLive:false,lastToucher:null,prevToucher:null,offTeam:-1,idle:[false,false],thinkT:0,breakKind:''});
 S.ball.reset();const kits=kitsFor(c.home,c.away);S.ents=[];S.plist=[];
 S.teams=[0,1].map(t=>{const ci=t?c.away:c.home,club=CLUBS[ci];const T={idx:t,ci,club,kit:kits[t],dir:t?-1:1,form:c.form[t],diff:c.diff[t],pl:[],gk:null,press2:false,gkRush:false,offLine:0,
   stats:{shots:0,sot:0,passes:0,passOK:0,fouls:0,yel:0,red:0,corners:0,offsides:0,poss:0,tackles:0,saves:0}};
  squad(ci,c.form[t],c.size).forEach(s=>{const at={...s.at};const bo=(c.boost&&c.boost[t])||0;for(const k in at)at[k]=cl(at[k]+bo,25,99);
   const k=T.kit,gk=s.role==='GK';const look=gk?{c1:club.gk,c2:dark(club.gk),pat:0,sh:dark(club.gk,.3),so:club.gk,glove:'#f4f4f4'}:{c1:k.c1,c2:k.c2,pat:k.pat,sh:k.sh,so:k.so};
   Object.assign(look,{skin:SKIN[s.skin*SKIN.length|0],hair:HAIR[s.hair*HAIR.length|0],boot:BOOTS[s.boot],num:s.num,bald:s.hair>.93});
   const p=mkEnt({team:t,name:s.name,num:s.num,role:s.role,slot:{x:s.x,z:s.z},at,ovr:s.ovr,h:s.h,look,idx:S.ents.length});if(gk)T.gk=p;T.pl.push(p);S.plist.push(p);S.ents.push(p);});return T;});
 const offLook=(c2)=>({c1:'#16171b',c2,pat:5,sh:'#16171b',so:'#16171b',skin:SKIN[2],hair:HAIR[0],boot:'#111111',num:0});
 S.ref=mkEnt({role:'REF',name:'REFEREE',look:offLook('#f5d000'),idx:S.ents.length,h:1});S.ents.push(S.ref);
 S.lines=[1,-1].map(s=>{const l=mkEnt({role:'LINE',name:'ASSISTANT',side:s,look:offLook('#f5d000'),idx:S.ents.length,h:.98});S.ents.push(l);return l;});
 S.humans=[];for(let i=0;i<(c.humans||0);i++)S.humans.push({i,team:i,pl:null,prev:{},inp:{},charge:0,buf:null,swT:0,aim:{x:0,z:0}});
 S.kickoffFirst=c.kickoff??(rnd()<.5?0:1);beginSP({type:'kick',team:S.kickoffFirst},true);
 S.ref.p.set(6,0,-8);S.lines[0].p.set(P.W+1,0,P.L*.4);S.lines[1].p.set(-P.W-1,0,-P.L*.4);}
/* ================= helpers ================= */
const ownBox=(p)=>{const T=S.teams[p.team];return Math.abs(p.p.x)<P.BW+.3&&p.p.z*-T.dir>P.L-P.BD-.3;};
function pressure(p){let m=99;for(const o of S.plist)if(o.team!==p.team&&active(o))m=Math.min(m,hyp(o.p.x-p.p.x,o.p.z-p.p.z));return m;}
export function setCtl(h,p){if(h.pl&&h.pl!==p){h.pl.ctl=-1;h.pl.assist=false;h.pl.charging=0;}h.pl=p;if(p){p.ctl=h.i;}h.swT=0;h.charge=0;}
export function minute(){if(S.period>4)return'120';const span=S.period<=2?45:15,base=[0,0,45,90,105][S.period],lim=S.period<=2?S.per:S.per/3;const m=S.clock/lim*span;if(m>=span)return`${base+span}+${Math.min(9,Math.floor((m-span))+1)}`;return String(Math.floor(base+m)+1);}
export function clockText(){if(S.period>4)return'PENS';if(S.period<1)return'00:00';const span=S.period<=2?45:15,base=[0,0,45,90,105][S.period],lim=S.period<=2?S.per:S.per/3;const m=Math.min(span,S.clock/lim*span)+base,mm=Math.floor(m),ss=Math.floor((m-mm)*60);return String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');}
function nearestMate(T,x,z,excl,noGK=true){let best=null,bd=1e9;for(const p of T.pl){if(!active(p)||p===excl||(noGK&&p.role==='GK'))continue;const d=hyp(p.p.x-x,p.p.z-z);if(d<bd){bd=d;best=p;}}return best;}
function bestInDir(p,dx,dz,cone=.8,maxD=55,noGK=true){const T=S.teams[p.team],l=hyp(dx,dz);if(l<.1)return null;dx/=l;dz/=l;let best=null,bv=1e9;
 for(const m of T.pl){if(m===p||!active(m)||(noGK&&m.role==='GK'))continue;const mx=m.p.x+m.v.x*.3-p.p.x,mz=m.p.z+m.v.z*.3-p.p.z,d=hyp(mx,mz);if(d<2||d>maxD)continue;const a=Math.acos(cl((mx*dx+mz*dz)/d,-1,1));if(a>cone)continue;const v=a*1.6+d*.018;if(v<bv){bv=v;best=m;}}return best;}
/* ================= ball touches, possession, offside ================= */
function touchBy(p,isKick){if(S.offsideOn&&p.offside&&S.offTeam===p.team&&S.phase==='play'){callOffside(p);return true;}
 for(const q of S.plist)q.offside=false;S.offTeam=-1;
 const pp=S.pendPass;if(pp&&pp.from!==p){if(pp.team===p.team){S.teams[p.team].stats.passOK++;pp.from.st.passOK++;}S.pendPass=null;}
 if(S.lastToucher!==p){S.prevToucher=S.lastToucher;S.prevT=S.time;}S.lastToucher=p;S.ball.last=p;S.lastTeam=p.team;
 if(!isKick){S.passTo=null;S.passLive=false;if(S.penLive&&p.role!=='GK')S.penLive=false;}return false;}
function markOffside(t){if(!S.offsideOn||S.phase!=='play')return;const T=S.teams[t],O=S.teams[1-t],dir=T.dir;const us=O.pl.filter(active).map(o=>o.p.z*dir).sort((a,b)=>b-a);const line=us[1]??-99,bu=S.ball.p.z*dir;
 for(const q of T.pl){if(!active(q)||q===S.lastToucher)continue;const u=q.p.z*dir;q.offside=u>0&&u>bu+.2&&u>line+.2;}S.offTeam=t;}
function callOffside(p){const T=S.teams[p.team];T.stats.offsides++;for(const q of S.plist)q.offside=false;S.offTeam=-1;
 const line=S.lines.find(l=>Math.sign(p.p.z||1)===l.side*1)||S.lines[0];act(line,'flag',2.2);
 S.pend={type:'free',team:1-p.team,x:cl(p.p.x,-P.W+.5,P.W-.5),z:cl(p.p.z,-P.L+1,P.L-1),indirect:true};S.fx('offside',p);toDead(1.6);}
function takeBall(p){const b=S.ball;b.owner=p;b.held=null;b.v.set(p.v.x,0,p.v.z);b.p.y=R;b.w.set(0,0,0);if(touchBy(p,false))return;if(S.phase!=='play')return;
 p.ai.dT=S.teams[p.team].diff.react*(.8+rnd()*.8);p.ai.held=0;S.fx('touch',p);
 const h=S.humans.find(h=>h.team===p.team);if(h&&h.pl!==p&&p.role!=='GK')setCtl(h,p);
 if(h&&h.pl===p&&h.buf){const bf=h.buf;h.buf=null;firstTime(p,bf,h);}}
function control(p){const b=S.ball,h=S.humans.find(h=>h.pl===p);
 if(h&&h.buf){b.owner=p;if(touchBy(p,false))return;const bf=h.buf;h.buf=null;firstTime(p,bf,h);return;}
 const rs=hyp(b.v.x-p.v.x,b.v.z-p.v.z)+Math.max(0,b.p.y-.5)*6;if(rs>19&&rnd()>p.at.drib/125){b.v.multiplyScalar(-.22).add(p.v);b.v.y=Math.abs(b.v.y)*.3+.8;p.kickCD=.3;touchBy(p,false);S.fx('touch',p);return;}
 takeBall(p);}
function firstTime(p,bf,h){if(bf.k==='shoot')shoot(p,{ax:aimX(p,h.inp),pow:bf.pow||.6,first:true});else humanPass(p,h.inp,bf.k);}
function gkCollect(g){const b=S.ball;
 if(S.lastToucher&&S.lastToucher.team===g.team&&S.lastToucher!==g&&S.pendPass){control(g);return;}// back-pass: feet only
 if(b.v.length()>27&&rnd()<.45){parry(g);g.st.saves++;S.teams[g.team].stats.saves++;S.fx('save',g,false);return;}
 b.held=g;b.owner=null;b.v.set(0,0,0);b.w.set(0,0,0);if(touchBy(g,false))return;act(g,'catch',99);g.ai.holdT=0;S.fx('catch',g);
 const h=S.humans.find(h=>h.team===g.team);if(h)setCtl(h,g);}
function parry(g){const b=S.ball,s=-S.teams[g.team].dir;const sx=Math.sign(b.p.x-g.p.x)||(rnd()<.5?-1:1);
 if(rnd()<.3){b.v.set(sx*(7+rnd()*4),2+rnd()*3,s*2.5);}else b.v.set(sx*(3+rnd()*5),1.5+rnd()*4,-s*(3+rnd()*5));b.w.set(0,0,0);touchBy(g,false);}
function header(p){const b=S.ball,T=S.teams[p.team],dir=T.dir;p.headCD=.7;act(p,'header',.55,{h:cl((b.p.y-1.3)/.9+.35,.3,1)});
 const h=S.humans.find(h=>h.pl===p);const gz=dir*P.L,dG=hyp(b.p.x,gz-b.p.z);if(touchBy(p,false))return;if(S.phase!=='play')return;
 let mode;if(h&&h.buf){mode=h.buf.k==='shoot'?'shot':'pass';h.buf=null;}else if(h)mode=dG<13?'shot':'pass';else mode=dG<15&&b.p.z*dir>0?'shot':b.p.z*dir<-P.L*.35?'clear':'pass';
 if(mode==='shot'){b.owner=p;shoot(p,{ax:h?aimX(p,h.inp):(rnd()-.5)*1.6,ay:rnd()*.55,pow:.7,header:true,first:true});return;}
 const f=fwdOf(p);let tx,tz;if(mode==='clear'){tx=b.p.x+Math.sign(b.p.x||1)*8;tz=b.p.z+dir*22;}
 else{const iv=h&&hyp(h.inp.x||0,h.inp.z||0)>.2?h.inp:{x:f.x,z:f.z};const m=bestInDir(p,iv.x,iv.z,.9,25);if(m){tx=m.p.x;tz=m.p.z;}else{tx=b.p.x+iv.x*9;tz=b.p.z+iv.z*9;}}
 const dx=tx-b.p.x,dz=tz-b.p.z,d=hyp(dx,dz)||1,sp=mode==='clear'?16:Math.min(14,6+d*.45);b.owner=null;b.held=null;b.v.set(dx/d*sp,mode==='clear'?5.5:2.2,dz/d*sp);b.w.set(0,0,0);
 S.fx('header',p);S.lastTeam=p.team;S.passTo=null;markOffside(p.team);}
/* ================= kicking ================= */
function release(p,v,spin,kind){const b=S.ball;const wasHeld=b.held===p,wasOwn=b.owner===p;b.owner=null;b.held=null;b.v.copy(v);b.w.copy(spin);b.inNet=0;p.kickCD=.32;
 const hz=hyp(v.x,v.z);if(hz>.5&&kind!=='header')p.face=Math.atan2(v.x,v.z);
 if(kind==='throw')act(p,'throw',.5);else if(wasHeld&&kind==='pass')act(p,'gkthrow',.55);else if(kind!=='header'){const f=fwdOf(p);act(p,'kick',.42,{side:1,pow:cl(v.length()/30,.35,1),h:kind==='lob'||kind==='cross'?1:.3});}
 if(wasOwn&&kind!=='throw'){b.p.x=p.p.x+Math.sin(p.face)*.45;b.p.z=p.p.z+Math.cos(p.face)*.45;if(b.p.y<R)b.p.y=R;}
 S.lastTeam=p.team;touchBy(p,true);S.fx('kick',p,v.length(),kind);}
function kickTo(p,tgt,type,mate,o={}){const b=S.ball;const sp=S.sp;if(!(b.owner===p||b.held===p||(sp&&sp.taker===p&&!sp.done)))return false;
 if(sp&&sp.taker===p&&!sp.done)takeSP();
 const T=S.teams[p.team],D=T.diff,human=p.ctl>=0;let dx=tgt.x-b.p.x,dz=tgt.z-b.p.z,d=hyp(dx,dz)||1;
 const err=(1.32-p.at.pass/100)*(human?.75:D.passErr)*(type==='lob'||type==='cross'?1.5:1)*(pressure(p)<1.4?1.35:1);
 const ang=gauss()*err*.06,lm=1+gauss()*err*.05,ca=Math.cos(ang),sa=Math.sin(ang);[dx,dz]=[dx*ca-dz*sa,dx*sa+dz*ca];dx*=lm;dz*=lm;d*=lm;
 let v;const spin=new V();
 if(type==='pass'||type==='through'){const s=Math.min(30,passSpeed(d,type==='through'?4.5:8));v=new V(dx/d*s,0,dz/d*s);b.p.y=Math.max(R,b.held===p?R:b.p.y);if(b.held===p)b.p.y=R+.02;}
 else{const Tt=type==='cross'?.95+d*.025:type==='throw'?.5+d*.032:.8+d*.03;v=loftVel(dx,dz,Tt,b.p.y,type==='cross'?1.6:.35);if(type==='cross')spin.y=(rnd()<.5?-1:1)*7;else spin.x=-Math.sign(dz||1)*5;}
 release(p,v,spin,type);if(S.phase!=='play')return true;
 S.passFrom=p;S.passTo=mate||null;S.passLive=true;T.stats.passes++;p.st.passes++;S.pendPass={from:p,team:p.team};
 if(mate&&type==='through')mate.ai.runT=Math.max(mate.ai.runT,1.5);
 if(!o.noOff)markOffside(p.team);
 const h=S.humans.find(h=>h.team===p.team);if(h&&mate&&h.pl!==mate&&mate.role!=='GK')setCtl(h,mate);
 return true;}
function aimVel(from,tx,ty,tz,speed,spin){const tb=new Ball();let dx=tx-from.x,dz=tz-from.z;const d=hyp(dx,dz)||1;let hx=dx/d,hz=dz/d;const c=.0125;const Tt=(Math.exp(c*d)-1)/(c*speed);let vy=(ty-from.y)/Tt+9.81*Tt/2;
 for(let it=0;it<4;it++){tb.p.copy(from);tb.v.set(hx*speed,vy,hz*speed);tb.w.copy(spin);const r=crossing(tb,Math.sign(dz)||1,3,tz);if(!r)break;vy+=(ty-r.y)/Math.max(.25,r.t)*.95;const a=(r.x-tx)/d*Math.sign(hz),ca=Math.cos(a),sa=Math.sin(a);[hx,hz]=[hx*ca-hz*sa,hx*sa+hz*ca];}
 return new V(hx*speed,vy,hz*speed);}
export function shoot(p,o){const b=S.ball;const sp=S.sp;if(!(b.owner===p||o.first||(sp&&sp.taker===p&&!sp.done)))return false;if(sp&&sp.taker===p&&!sp.done)takeSP();
 const T=S.teams[p.team],D=T.diff,human=p.ctl>=0,dir=T.dir,gz=dir*P.L;const pow=cl(o.pow,0,1);
 let tx=cl(o.ax,-1,1)*(P.GW-.3),ty=o.ay!=null?.15+o.ay*(P.GH-.4):.18+pow*1.05+(pow>.86?(pow-.86)*10:0);
 const dist=hyp(tx-b.p.x,gz-b.p.z);const sig=(1.32-p.at.shot/100)*(.3+dist*.03)*(human?.8:D.shotErr)*(pressure(p)<1.3?1.3:1)*(o.header?1.5:1)*(pow>.93?1.35:1)*(o.pen?.55:1);
 tx+=gauss()*sig;ty=Math.max(.12,ty+gauss()*sig*.55);
 const speed=(o.header?9+pow*7:14+pow*17)*(.82+p.at.shot/430);const spin=new V(0,(o.curl??gauss()*.35)*13,0);if(!o.header&&pow>.6)spin.x=Math.sign(gz-b.p.z)*pow*9;
 if(b.p.y<R)b.p.y=R;const v=aimVel(b.p,tx,ty,gz,speed,spin);release(p,v,spin,o.header?'header':'shot');if(S.phase!=='play'&&!S.shoot)return true;
 if(!S.shoot){T.stats.shots++;p.st.shots++;const c=crossing(b,dir);if(c&&Math.abs(c.x)<P.GW&&c.y<P.GH){T.stats.sot++;p.st.sot++;}}
 S.passTo=null;S.passLive=false;S.pendPass=null;S.fx('shot',p,pow);if(!S.shoot)markOffside(p.team);return true;}
export function aimX(p,inp){const T=S.teams[p.team];const ix=inp&&inp.x||0;if(Math.abs(ix)>.2)return cl(ix*1.25,-1,1);return-Math.sign(p.p.x||(rnd()-.5))*.55;}
export function humanPass(p,inp,type){const f=fwdOf(p);let dx=inp&&inp.x||0,dz=inp&&inp.z||0;if(hyp(dx,dz)<.2){dx=f.x;dz=f.z;}const l=hyp(dx,dz);dx/=l;dz/=l;
 const T=S.teams[p.team],dir=T.dir;if(type==='lob'&&Math.abs(p.p.x)>P.W*.45&&p.p.z*dir>P.L-P.BD-8)type='cross';
 if(type==='cross'){const m=T.pl.filter(m=>m!==p&&active(m)&&m.p.z*dir>P.L-P.BD-4&&Math.abs(m.p.x)<P.BW).sort((a,b)=>hyp(a.p.x-(p.p.x+dx*12),a.p.z-(p.p.z+dz*12))-hyp(b.p.x-(p.p.x+dx*12),b.p.z-(p.p.z+dz*12)))[0];
  const tx=m?m.p.x+m.v.x*.6:Math.sign(-p.p.x)*2,tz=m?m.p.z+m.v.z*.6+dir*1:dir*(P.L-P.SPOT);return kickTo(p,{x:tx,z:tz},'cross',m);}
 const m=bestInDir(p,dx,dz,type==='through'?.62:.75,type==='lob'?60:45,true);
 if(m){let tx=m.p.x+m.v.x*.35,tz=m.p.z+m.v.z*.35;if(type==='through'){let rx=dx*.5,rz=dir;const rl=hyp(rx,rz);tx=m.p.x+rx/rl*7;tz=m.p.z+rz/rl*7;}else if(type==='lob'){tx=m.p.x+m.v.x*.8;tz=m.p.z+m.v.z*.8;}
  tx=cl(tx,-P.W+1,P.W-1);tz=cl(tz,-P.L+1,P.L-1);return kickTo(p,{x:tx,z:tz},type,m);}
 const dd=type==='lob'?28:type==='through'?20:14;return kickTo(p,{x:cl(p.p.x+dx*dd,-P.W+1,P.W-1),z:cl(p.p.z+dz*dd,-P.L+1,P.L-1)},type,null);}
/* ================= tackles, slides, fouls ================= */
function tackle(p){if(p.tackleCD>0||p.stun>0||p.slideT>0||p.dive>0||S.ball.owner===p)return;p.tackleCD=.8;act(p,'tackle',.42);p.tackling=.36;p.tkDone=false;S.fx('swing',p);}
function tackleStep(p){if(p.tkDone)return;const k=.36-p.tackling;if(k<.05)return;const c=S.ball.owner;if(!c||c.team===p.team)return;const f=fwdOf(p),fx=p.p.x+f.x*.7,fz=p.p.z+f.z*.7;
 if(hyp(fx-c.p.x,fz-c.p.z)<1.15||hyp(fx-S.ball.p.x,fz-S.ball.p.z)<.7){p.tkDone=true;resolveTackle(p,c);}}
function resolveTackle(p,c){const D=S.teams[p.team].diff,human=p.ctl>=0;let ch=.52+(p.at.def-c.at.drib)*.013+(human?.06:(D.tackle-.5)*.6)-(c.ctl>=0?.04:0);if(c.skillT>0)ch*=.25;
 const f=fwdOf(c),bx=p.p.x-c.p.x,bz=p.p.z-c.p.z,bl=hyp(bx,bz)||1;const behind=(f.x*bx+f.z*bz)/bl<-.45;if(behind)ch*=.55;
 if(rnd()<ch){const b=S.ball;b.owner=null;const fp=fwdOf(p);b.v.set(fp.x*4.2+(rnd()-.5)*3,0,fp.z*4.2+(rnd()-.5)*3);c.kickCD=.55;p.st.tackles++;S.teams[p.team].stats.tackles++;touchBy(p,false);S.fx('tackle',p);if(rnd()<.45)takeBall(p);}
 else{if(behind&&rnd()<.38){foul(p,c,.3);return;}c.v.multiplyScalar(.75);p.stun=.3;act(p,'stumble',.45);}}
function slide(p){if(p.tackleCD>0||p.stun>0||p.slideT>0||p.dive>0||S.ball.owner===p||S.ball.held)return;p.tackleCD=1.7;p.slideT=1.05;p.slideBall=false;p.slideHit=new Set();act(p,'slide',1.05);
 const f=fwdOf(p),s=Math.max(hyp(p.v.x,p.v.z),6.8);p.v.set(f.x*s,0,f.z*s);S.fx('slide',p);}
function slideStep(p){const f=fwdOf(p),fx=p.p.x+f.x*.95,fz=p.p.z+f.z*.95,b=S.ball;
 if(!p.slideBall&&!b.held&&b.p.y<.6&&hyp(b.p.x-fx,b.p.z-fz)<.85){p.slideBall=true;const c=b.owner;b.owner=null;b.v.set(f.x*7+(rnd()-.5)*3,.6,f.z*7+(rnd()-.5)*3);if(c)c.kickCD=.6;if(touchBy(p,false))return;p.st.tackles++;S.teams[p.team].stats.tackles++;S.fx('tackle',p);}
 for(const o of S.plist){if(o.team===p.team||!active(o)||o.stun>0||p.slideHit.has(o)||o.dive>0)continue;if(hyp(o.p.x-fx,o.p.z-fz)<.8||hyp(o.p.x-p.p.x,o.p.z-p.p.z)<.7){p.slideHit.add(o);trip(o);
   if(!p.slideBall&&S.phase==='play'){const of=fwdOf(o);foul(p,o,(of.x*f.x+of.z*f.z)>.5?.85:.55);return;}}}}
function trip(o){o.stun=1.4;act(o,'fall',1.4);if(S.ball.owner===o){S.ball.owner=null;S.ball.v.set(o.v.x*.6,0,o.v.z*.6);}o.v.multiplyScalar(.5);S.fx('fall',o);}
export function foul(off,vic,sev){if(S.phase!=='play')return;const T=S.teams[off.team],VT=S.teams[vic.team],dir=VT.dir;T.stats.fouls++;off.st.fouls++;
 const x=vic.p.x,z=vic.p.z,u=z*dir,dg=hyp(x,dir*P.L-z);const cover=T.pl.filter(q=>active(q)&&q!==off&&q.role!=='GK'&&q.p.z*dir>u).length;
 const dogso=dg<25&&cover===0&&(S.ball.owner===vic||hyp(S.ball.p.x-vic.p.x,S.ball.p.z-vic.p.z)<3)&&u>0;
 let card=null;const r=rnd();if(dogso&&rnd()<.7||r<sev*.035)card='red';else if(r<sev*.6||dogso)card='yellow';
 if(card==='yellow'){off.yellow++;off.st.yel++;T.stats.yel++;if(off.yellow>=2)card='red2';}if(card&&card!=='yellow'){off.st.red++;T.stats.red++;off.sentOff=true;}
 const inBox=Math.abs(x)<P.BW&&u>P.L-P.BD;S.pend=inBox?{type:'pen',team:vic.team}:{type:'free',team:vic.team,x:cl(x,-P.W+.5,P.W-.5),z:cl(z,-P.L+1,P.L-1)};
 S.cardInfo=card?{p:off,card,t:0}:null;S.fx('foul',off,vic,card,inBox);toDead(card?2.8:1.4);}
function skill(p,side){if(p.skillCD>0||S.ball.owner!==p)return;p.skillCD=1.1;p.skillT=.5;act(p,'skill',.5,{side});const f=fwdOf(p);p.v.x+=-f.z*side*3.2;p.v.z+=f.x*side*3.2;S.fx('skill',p);}
S.act={pass:(p,t,type,m)=>kickTo(p,t,type,m),shoot:(p,o)=>shoot(p,o),tackle,slide,skill,dive:(g,side,h)=>{act(g,'dive',1.25,{side,h});g.dive=1.25;S.fx('dive',g);}};
/* ================= GK saves ================= */
function resolveSaves(dt){const b=S.ball;for(const T of S.teams){const g=T.gk;if(!g||!active(g)||!g.ai.save)continue;const sv=g.ai.save,s=-T.dir;sv.t-=dt;
 if(b.owner||b.held){g.ai.save=null;continue;}const reached=(b.p.z-g.p.z)*s>=-.25;
 if(reached||sv.t<-.45){if(sv.ok&&sv.real&&b.v.z*s>0&&Math.abs(b.p.z)<P.L+.3&&Math.abs(b.p.x-g.p.x)<3.8){
   if(sv.catchIt){b.held=g;b.v.set(0,0,0);b.w.set(0,0,0);touchBy(g,false);if(g.dive<=0)act(g,'catch',99);g.ai.holdT=-.6;const h=S.humans.find(h=>h.team===g.team);if(h)setCtl(h,g);}else parry(g);
   g.st.saves++;T.stats.saves++;S.penLive=false;S.fx('save',g,sv.catchIt);}g.ai.save=null;}}}
function penKeeper(g){const T=S.teams[g.team],b=S.ball,s=-T.dir;const c=crossing(b,s,2.5);if(!c){return;}const h=S.humans.find(h=>h.team===g.team);let side=0;
 if(h){const ix=h.inp&&h.inp.x||0;side=Math.abs(ix)>.3?Math.sign(ix):0;}
 else{const read=.28+T.diff.save*.3;if(rnd()<read)side=Math.abs(c.x)>.7?Math.sign(c.x):0;else side=[-1,0,1][rnd()*3|0];}
 const right=(side!==0&&Math.sign(c.x)===side&&Math.abs(c.x)>.45)||(side===0&&Math.abs(c.x)<1.05);const on=Math.abs(c.x)<P.GW&&c.y<P.GH;
 let pS=.62*(g.at.gk/80)*(1-Math.max(0,Math.abs(c.x)-(P.GW-.9))*.9)*(c.y>1.8?.55:1)*(c.speed>24?.8:1);const ok=on&&right&&rnd()<pS;
 g.ai.save={t:c.t,ok,catchIt:ok&&c.speed<19&&rnd()<.4,x:c.x,y:c.y,real:on};g.frozen=false;
 if(side!==0){g.diveV=side*(ok?Math.max(.5,Math.abs(c.x-g.p.x)):2.4)/Math.max(.35,c.t);S.act.dive(g,side*T.dir,cl(c.y-.55,0,1.1));}}
/* ================= set pieces ================= */
function toDead(t){S.phase='dead';S.deadT=t;S.sp=null;S.passTo=null;S.passLive=false;S.penLive=false;for(const e of S.ents){e.ai.tx=e.p.x;e.ai.tz=e.p.z;e.ai.sprint=false;e.tackling=0;e.ai.save=null;}S.fx('whistle',1);}
export function beginSP(sp,instant){S.sp=sp;S.phase='setpiece';Object.assign(sp,{t:0,ready:false,done:false,readyT:0,run:null});S.pend=null;S.penLive=false;S.passTo=null;S.passLive=false;S.pendPass=null;S.cardInfo=null;
 const b=S.ball;b.reset();for(const q of S.plist)q.offside=false;S.offTeam=-1;
 const T=S.teams[sp.team],dir=T.dir;
 if(sp.type==='kick'){sp.x=0;sp.z=0;}
 else if(sp.type==='throw'){sp.x=Math.sign(sp.x||1)*(P.W+.15);sp.z=cl(sp.z,-P.L+1,P.L-1);}
 else if(sp.type==='corner'){sp.x=Math.sign(sp.x||1)*(P.W-.35);sp.z=Math.sign(sp.z||1)*(P.L-.35);}
 else if(sp.type==='goalkick'){sp.x=(sp.x>0?1:-1)*P.SW*.55;sp.z=-dir*(P.L-P.SD+.4);}
 else if(sp.type==='pen'){sp.x=0;sp.z=dir*(P.L-P.SPOT);}
 b.p.set(sp.x,R,sp.z);
 const ac=T.pl.filter(p=>active(p));
 if(sp.type==='goalkick')sp.taker=T.gk&&active(T.gk)?T.gk:nearestMate(T,sp.x,sp.z,null);
 else if(sp.type==='pen')sp.taker=sp.taker||ac.filter(p=>p.role!=='GK').sort((a,b)=>b.at.shot-a.at.shot)[0];
 else if(sp.type==='kick')sp.taker=ac.filter(p=>p.role==='FW').sort((a,b)=>Math.abs(a.slot.x)-Math.abs(b.slot.x))[0]||nearestMate(T,0,0,null);
 else if(sp.type==='free'){const dg=hyp(sp.x,dir*P.L-sp.z);sp.taker=dg<32?ac.filter(p=>p.role!=='GK').sort((a,b)=>b.at.shot-a.at.shot)[0]:nearestMate(T,sp.x,sp.z,null);}
 else sp.taker=nearestMate(T,sp.x,sp.z,null);
 spTargets(sp);
 for(const e of S.ents){e.stun=0;e.slideT=0;e.dive=0;e.tackling=0;e.anim.act='';e.ai.save=null;e.assist=false;e.charging=0;e.frozen=false;e.ai.runT=0;
  if(instant&&e.spT){e.p.set(e.spT.x,0,e.spT.z);e.v.set(0,0,0);e.face=e.spT.f;}}
 if(sp.type==='throw')b.held=sp.taker;
 for(const h of S.humans){h.buf=null;h.charge=0;if(h.team===sp.team)setCtl(h,sp.taker);else if(!h.pl||!active(h.pl)||h.pl.role==='GK')setCtl(h,nearestMate(S.teams[h.team],sp.x,sp.z,null));}
 sp.aiDelay=sp.type==='pen'?1.2:.7+rnd()*.7;S.fx('setpiece',sp);}
function spTargets(sp){const b=S.ball,bx=sp.x,bz=sp.z,ka=S.teams[sp.team];
 const put=(p,x,z,f)=>{p.spT={x:cl(x,-P.W-1.5,P.W+1.5),z:cl(z,-P.L-1.5,P.L+1.5),f:f??Math.atan2(bx-x,bz-z)};};
 for(const T of S.teams){const att=T.idx===sp.team,bzN=(bz*T.dir+P.L)/(2*P.L);for(const p of T.pl){if(!active(p)){p.spT=null;continue;}
   if(p.role==='GK'){put(p,0,-T.dir*(P.L-.7),T.dir>0?0:Math.PI);continue;}const h=homeSpot(p,T,att&&sp.type!=='kick',bx,sp.type==='kick'?.5:bzN);put(p,h.x,h.z);}}
 const away=(T,r)=>{for(const p of T.pl){if(!p.spT||p===sp.taker||p.role==='GK')continue;const dx=p.spT.x-bx,dz=p.spT.z-bz,d=hyp(dx,dz);if(d<r){const k=r/(d||1);p.spT.x=bx+(d?dx:1)*k;p.spT.z=bz+(d?dz:0)*k;p.spT.f=Math.atan2(bx-p.spT.x,bz-p.spT.z);}}};
 const opp=S.teams[1-sp.team],dir=ka.dir;
 switch(sp.type){
  case'kick':for(const T of S.teams)for(const p of T.pl){if(!p.spT||p.role==='GK')continue;if(p.spT.z*T.dir>-.6)p.spT.z=-T.dir*(.6+rnd()*2);p.spT.f=T.dir>0?0:Math.PI;}
   away(opp,P.CR+.6);put(sp.taker,0,-dir*.45,dir>0?0:Math.PI);{const mate=ka.pl.filter(p=>p.spT&&p!==sp.taker&&p.role!=='GK').sort((a,c)=>hyp(a.spT.x,a.spT.z)-hyp(c.spT.x,c.spT.z))[0];if(mate)put(mate,-dir*0+2.6,-dir*1.2,dir>0?0:Math.PI);}break;
  case'throw':put(sp.taker,Math.sign(bx)*(P.W+.45),bz,Math.sign(bx)>0?-Math.PI/2:Math.PI/2);away(opp,3);break;
  case'corner':{const sx=Math.sign(bx),sz=Math.sign(bz);put(sp.taker,bx+sx*.7,bz+sz*.7,Math.atan2(-sx,-sz));
   const spots=[[sx*1.6,sz*(P.L-4.5)],[-sx*1,sz*(P.L-7)],[0,sz*(P.L-10.5)],[-sx*4,sz*(P.L-5.5)],[sx*3.5,sz*(P.L-8.5)],[sx*-1,sz*(P.L-15)]].map(([x,z])=>[x*(P.size===5?.6:1),sz*(P.L-(P.L-Math.abs(z))*(P.size===5?.6:1))]);
   const atk=ka.pl.filter(p=>p.spT&&p!==sp.taker&&p.role!=='GK').sort((a,c)=>(c.role==='FW')-(a.role==='FW')||c.at.head-a.at.head);const nA=P.size===5?2:5;
   atk.slice(0,nA).forEach((p,i)=>put(p,spots[i][0]+(rnd()-.5),spots[i][1]+(rnd()-.5)*.8));
   const dfs=opp.pl.filter(p=>p.spT&&p.role!=='GK').sort((a,c)=>c.at.def-a.at.def);atk.slice(0,nA).forEach((a,i)=>{const d=dfs[i];if(d)put(d,a.spT.x*.92,a.spT.z-sz*.9);});
   if(dfs[nA])put(dfs[nA],sx*P.GW*.85,sz*(P.L-.9));away(opp,P.size===5?5:9.15);break;}
  case'goalkick':{put(sp.taker,bx,bz-dir*1.6,dir>0?0:Math.PI);for(const p of opp.pl){if(!p.spT)continue;if(Math.abs(p.spT.x)<P.BW+1&&p.spT.z*-dir>P.L-P.BD-1)p.spT.z=-dir*(P.L-P.BD-1.5);}break;}
  case'free':{const gz=dir*P.L,dx=0-bx,dz=gz-bz,dl=hyp(dx,dz)||1;put(sp.taker,bx-dx/dl*1.4,bz-dz/dl*1.4,Math.atan2(dx,dz));
   const R9=P.size===5?5:9.15;away(opp,R9);
   if(dl<34&&bz*dir>0){const n=P.size===5?1:dl<20?4:dl<27?3:2;const wx=bx+dx/dl*R9,wz=bz+dz/dl*R9,px=-dz/dl,pz=dx/dl;const wall=opp.pl.filter(p=>p.spT&&p.role!=='GK').sort((a,c)=>hyp(a.spT.x-wx,a.spT.z-wz)-hyp(c.spT.x-wx,c.spT.z-wz)).slice(0,n);
    wall.forEach((p,i)=>{const o=(i-(n-1)/2)*.62+Math.sign(bx||1)*.35;put(p,wx+px*o,wz+pz*o);p.wall=true;});}
   break;}
  case'pen':{const s=dir,spz=s*(P.L-P.SPOT);put(sp.taker,0,spz-s*1.9,s>0?0:Math.PI);const g=opp.gk;if(g)put(g,0,s*(P.L-.2),s>0?Math.PI:0);
   let i=0;for(const T of S.teams)for(const p of T.pl){if(!p.spT||p===sp.taker||p.role==='GK')continue;if(sp.shootout){const a=i*.55;put(p,Math.cos(a)*3.5,Math.sin(a)*3.5);}else{const k=cl((i%2?1:-1)*(2+(i>>1)*2.3),-P.W+2,P.W-2);put(p,k,Math.abs(k)<P.CR*.72?s*(P.L-P.SPOT-P.CR-1):s*(P.L-P.BD-1.8));}i++;}
   if(sp.shootout){const og=ka.gk;if(og)put(og,P.BW*.6,s*(P.L-P.BD-1));}break;}}}
export function toPlay(){if(S.sp&&!S.sp.done)takeSP();else{S.phase='play';for(const e of S.ents){e.frozen=false;e.wall=false;}}}
function takeSP(){const sp=S.sp;if(!sp||sp.done)return;sp.done=true;S.phase=S.shoot?'shootkick':'play';for(const e of S.ents){e.frozen=false;e.wall=false;}S.thinkT=0;if(sp.type==='pen')S.penLive=true;S.fx('taken',sp);}
function spTick(dt){const sp=S.sp;sp.t+=dt;const b=S.ball;
 for(const e of S.plist){if(!e.spT||!active(e))continue;e.ai.tx=e.spT.x;e.ai.tz=e.spT.z;e.ai.sprint=hyp(e.spT.x-e.p.x,e.spT.z-e.p.z)>4;e.ai.look=sp.ready?b:null;e.faceT=e.spT.f;}
 if(!sp.ready){let all=true;for(const e of S.plist)if(e.spT&&active(e)&&hyp(e.spT.x-e.p.x,e.spT.z-e.p.z)>.9)all=false;
  if(all||sp.t>2.3){for(const e of S.plist)if(e.spT&&active(e)&&hyp(e.spT.x-e.p.x,e.spT.z-e.p.z)>1.5){e.p.set(e.spT.x,0,e.spT.z);e.v.set(0,0,0);}sp.ready=true;
   const tk=sp.taker;tk.p.set(tk.spT.x,0,tk.spT.z);tk.face=tk.spT.f;tk.v.set(0,0,0);tk.frozen=true;if(sp.type==='throw')act(tk,'throwHold',99);if(sp.type==='pen'){const g=S.teams[1-sp.team].gk;if(g){g.frozen=true;g.p.set(g.spT.x,0,g.spT.z);g.face=g.spT.f;g.anim.set=true;}}
   S.fx('ready',sp);}return;}
 sp.readyT+=dt;const tk=sp.taker;
 if(sp.run){sp.run.t+=dt;tk.frozen=false;const s=S.teams[tk.team].dir;tk.ai.tx=b.p.x;tk.ai.tz=b.p.z-s*.5;tk.ai.sprint=false;
  if(sp.run.t>.55||hyp(tk.p.x-b.p.x,tk.p.z-b.p.z)<.7){const r=sp.run;sp.run=null;const g=S.teams[1-tk.team].gk;shoot(tk,{ax:r.ax,ay:r.ay,pow:r.pow,pen:true,curl:0});if(g)penKeeper(g);}return;}
 const hum=S.humans.find(h=>h.pl===tk);
 if(!hum&&sp.readyT>sp.aiDelay)aiTakeSP(sp);else if(hum&&sp.readyT>(sp.type==='kick'?7:11))aiTakeSP(sp);}
function aiTakeSP(sp){const p=sp.taker,T=S.teams[p.team],O=S.teams[1-p.team],dir=T.dir,b=S.ball;const opp=O.pl.filter(active);
 const pick=(maxD=40,minD=6)=>{let best=null,bv=-99;for(const m of T.pl){if(m===p||!active(m)||m.role==='GK')continue;const d=hyp(m.p.x-b.p.x,m.p.z-b.p.z);if(d<minD||d>maxD)continue;const ln=lane(b.p.x,b.p.z,m.p.x,m.p.z,opp);
  let o=99;for(const q of opp)o=Math.min(o,hyp(q.p.x-m.p.x,q.p.z-m.p.z));const v=Math.min(o,8)*.3+Math.min(ln,1.2)*1.2+(m.p.z*dir-b.p.z*dir)*.05+rnd()*.6;if(v>bv){bv=v;best=m;}}return best;};
 switch(sp.type){
  case'kick':{const m=T.pl.filter(q=>q!==p&&active(q)&&q.role==='MF').sort((a,c)=>hyp(a.p.x,a.p.z)-hyp(c.p.x,c.p.z))[0]||pick(40,2);if(m)kickTo(p,{x:m.p.x,z:m.p.z},'pass',m);else kickTo(p,{x:0,z:-dir*12},'pass',null);break;}
  case'throw':{const m=pick(20,3);if(m)kickTo(p,{x:m.p.x,z:m.p.z},'throw',m,{noOff:true});else kickTo(p,{x:b.p.x-Math.sign(b.p.x)*6,z:b.p.z+dir*12},'throw',null,{noOff:true});break;}
  case'corner':{if(rnd()<.8){const tg=T.pl.filter(m=>m!==p&&active(m)&&Math.abs(m.p.z)>P.L-P.BD&&Math.abs(m.p.x)<P.BW).sort(()=>rnd()-.5)[0];const x=tg?tg.p.x:0,z=tg?tg.p.z:Math.sign(b.p.z)*(P.L-P.SPOT);kickTo(p,{x,z},'cross',tg,{noOff:true});}
   else{const m=nearestMate(T,b.p.x,b.p.z,p);kickTo(p,{x:m.p.x,z:m.p.z},'pass',m,{noOff:true});}break;}
  case'goalkick':{const m=rnd()<.4?pick(25,8):null;if(m)kickTo(p,{x:m.p.x,z:m.p.z},'pass',m,{noOff:true});else{const f=T.pl.filter(q=>active(q)&&(q.role==='FW'||q.role==='MF')).sort(()=>rnd()-.5)[0];kickTo(p,{x:f.p.x,z:f.p.z+dir*3},'lob',f,{noOff:true});}break;}
  case'free':{const dg=hyp(b.p.x,dir*P.L-b.p.z);if(dg<30&&b.p.z*dir>0&&!sp.indirect){const g=O.gk;const side=g&&g.p.x>0?-1:1;shoot(p,{ax:side*(.6+rnd()*.3),ay:.55+rnd()*.35,pow:.72+rnd()*.12,curl:side*-1*.9});}
   else{const m=pick(45,6);if(m){const d=hyp(m.p.x-b.p.x,m.p.z-b.p.z);kickTo(p,{x:m.p.x,z:m.p.z},d>26?'lob':'pass',m);}else kickTo(p,{x:b.p.x*.5,z:b.p.z+dir*30},'lob',null);}break;}
  case'pen':{const side=rnd()<.5?-1:1;sp.run={t:0,ax:side*(.45+rnd()*.5),ay:rnd()<.65?rnd()*.35:.45+rnd()*.4,pow:.68+rnd()*.15};break;}}}
function spHuman(h,dt){const sp=S.sp,p=h.pl,inp=h.inp,ed=k=>inp[k]&&!h.prev[k];if(!sp||!sp.ready||sp.taker!==p||sp.done||sp.run)return;const T=S.teams[p.team],dir=T.dir,b=S.ball;
 const il=hyp(inp.x||0,inp.z||0);h.aim={x:il>.2?inp.x/il:0,z:il>.2?inp.z/il:0};
 const charge=()=>{if(inp.shoot){h.charge=Math.min(1,h.charge+dt/1.05);p.charging=h.charge;return false;}if(h.charge>0){const c=h.charge;h.charge=0;p.charging=0;return c;}return false;};
 switch(sp.type){
  case'kick':if(ed('pass')||ed('lob')||ed('thru')){const f=il>.2?inp:{x:0,z:-dir};humanPass(p,f,ed('lob')?'lob':ed('thru')?'through':'pass');}break;
  case'throw':{const f=il>.2?inp:{x:-Math.sign(b.p.x),z:dir*.6};if(ed('pass')||ed('lob')){const m=bestInDir(p,f.x,f.z,.8,ed('lob')?32:18);const tg=m?{x:m.p.x,z:m.p.z}:{x:b.p.x+f.x*(ed('lob')?24:12),z:b.p.z+f.z*(ed('lob')?24:12)};kickTo(p,tg,'throw',m,{noOff:true});}break;}
  case'corner':{const sz=Math.sign(b.p.z);const tx=(inp.x||0)*5,tz=sz*(P.L-P.SPOT+1)-(inp.z||0)*sz*3;sp.aimPt={x:cl(tx,-P.BW,P.BW),z:tz};
   if(ed('lob')||ed('shoot')){const m=T.pl.filter(q=>q!==p&&active(q)).sort((a,c)=>hyp(a.p.x-sp.aimPt.x,a.p.z-sp.aimPt.z)-hyp(c.p.x-sp.aimPt.x,c.p.z-sp.aimPt.z))[0];kickTo(p,sp.aimPt,'cross',m,{noOff:true});}
   else if(ed('pass')){const m=nearestMate(T,b.p.x,b.p.z,p);kickTo(p,{x:m.p.x,z:m.p.z},'pass',m,{noOff:true});}break;}
  case'goalkick':{const f=il>.2?inp:{x:0,z:dir};if(ed('pass')){const m=bestInDir(p,f.x,f.z,.9,30);kickTo(p,m?{x:m.p.x,z:m.p.z}:{x:b.p.x+f.x*15,z:b.p.z+f.z*15},'pass',m,{noOff:true});}
   else if(ed('lob')||ed('shoot')||ed('thru')){const m=bestInDir(p,f.x,f.z,.7,65);kickTo(p,m?{x:m.p.x,z:m.p.z}:{x:cl(b.p.x+f.x*40,-P.W+2,P.W-2),z:cl(b.p.z+f.z*40,-P.L+2,P.L-2)},'lob',m,{noOff:true});}break;}
  case'free':{const c=charge();if(c!==false){shoot(p,{ax:aimX(p,inp),pow:c,curl:-Math.sign(b.p.x||1)*.7});break;}
   if(ed('pass')||ed('lob')||ed('thru')){const f=il>.2?inp:{x:0,z:dir};humanPass(p,f,ed('lob')?'lob':ed('thru')?'through':'pass');}break;}
  case'pen':{const c=charge();if(c!==false)sp.run={t:0,ax:aimX(p,inp)*.95,ay:c>.93?1.3:cl((c-.2)*1.3,0,1.05),pow:Math.min(c,.95)};break;}}}
/* ================= human control ================= */
function human(h,dt){const T=S.teams[h.team],inp=h.inp,ed=k=>inp[k]&&!h.prev[k];T.press2=false;T.gkRush=false;h.swT+=dt;
 let p=h.pl;if(!p||!active(p)){p=nearestMate(T,S.ball.p.x,S.ball.p.z,null);setCtl(h,p);}if(!p)return;
 if(S.phase==='setpiece'){spHuman(h,dt);return;}
 if(S.phase!=='play')return;
 const b=S.ball,own=b.owner||b.held;if(p.role==='GK'&&b.held!==p){const q=nearestMate(T,b.p.x,b.p.z,null);if(q){setCtl(h,q);p=q;}}p.mv.x=inp.x||0;p.mv.z=inp.z||0;p.sprint=!!inp.spr;p.assist=false;const has=own===p;
 if(ed('sw')&&!has){let best=null,bd=1e9;for(const q of T.pl){if(!active(q)||q===p||q.role==='GK')continue;const d=hyp(q.p.x-b.p.x,q.p.z-b.p.z);if(d<bd){bd=d;best=q;}}if(best){setCtl(h,best);p=best;S.fx('switch',p);}}
 if(has){if(b.held===p){p.mv.x*=.6;p.mv.z*=.6;if(ed('pass')||ed('thru'))humanPass(p,inp,'pass');else if(ed('lob')||ed('shoot'))humanPass(p,inp,'lob');}
  else{if(ed('pass'))humanPass(p,inp,'pass');else if(ed('thru'))humanPass(p,inp,'through');else if(ed('lob'))humanPass(p,inp,'lob');
   else if(ed('skill')){const f=fwdOf(p);const side=((inp.x||0)*-f.z+(inp.z||0)*f.x)>=0?1:-1;skill(p,side);}
   if(b.owner===p){if(inp.shoot){h.charge=Math.min(1,h.charge+dt/1.05);p.charging=h.charge;}else if(h.charge>0){const c=h.charge;h.charge=0;p.charging=0;shoot(p,{ax:aimX(p,inp),pow:c});}}}}
 else{const def=own&&own.team!==h.team;
  if(def){h.charge=0;p.charging=0;if(ed('pass'))tackle(p);if(ed('shoot'))slide(p);if(inp.thru)T.gkRush=true;if(inp.skill)T.press2=true;
   if(inp.lob&&own.role!=='GK'){p.assist=true;const gz=-T.dir*P.L,dx=0-own.p.x,dz=gz-own.p.z,dl=hyp(dx,dz)||1;p.ai.tx=own.p.x+dx/dl*1.3;p.ai.tz=own.p.z+dz/dl*1.3;p.ai.sprint=!!inp.spr;p.ai.look=own;}}
  else{if(ed('pass'))h.buf={k:'pass',t:.9};if(ed('lob'))h.buf={k:'lob',t:.9};if(ed('thru'))h.buf={k:'through',t:.9};
   if(inp.shoot){h.charge=Math.min(1,h.charge+dt/1.05);p.charging=h.charge;}else if(h.charge>0){h.buf={k:'shoot',pow:h.charge,t:.9};h.charge=0;p.charging=0;}
   if(!own&&S.passTo&&S.passTo.team===h.team&&S.passTo!==p&&S.passTo.role!=='GK'){setCtl(h,S.passTo);}
   else if(!own&&!S.passTo&&h.swT>1.2){// loose ball: hand control to whoever will get there first
    let best=null,bt=1e9;for(const q of T.pl){if(!active(q)||q.role==='GK'||!q.ai.ic)continue;if(q.ai.ic.t<bt){bt=q.ai.ic.t;best=q;}}if(best&&best!==p&&p.ai.ic&&p.ai.ic.t>bt+1.2&&hyp(p.p.x-b.p.x,p.p.z-b.p.z)>12)setCtl(h,best);}}}
 if(h.buf){h.buf.t-=dt;if(h.buf.t<=0)h.buf=null;}}
/* ================= movement ================= */
function move(e,dt){if(e.hidden||e.off)return;
 if(e.stun>0){e.stun-=dt;e.v.multiplyScalar(Math.exp(-dt*5));e.p.addScaledVector(e.v,dt);return;}
 if(e.slideT>0){e.slideT-=dt;e.v.multiplyScalar(Math.exp(-dt*(e.slideT>.4?1.3:7)));e.p.addScaledVector(e.v,dt);if(e.slideT>.4&&S.phase==='play')slideStep(e);return;}
 if(e.dive>0){e.dive-=dt;if(e.dive<=0&&S.ball.held===e)act(e,'catch',99);const k=1-e.dive/1.25;if(k<.45)e.p.x=cl(e.p.x+e.diveV*dt,-P.GW-1.4,P.GW+1.4);e.v.set(0,0,0);return;}
 if(e.tackling>0){e.tackling-=dt;tackleStep(e);}
 let mx=0,mz=0,spr=false,look=null;const hum=e.ctl>=0&&!e.assist&&S.phase==='play';
 if(hum){mx=e.mv.x;mz=e.mv.z;spr=e.sprint;}else{const dx=e.ai.tx-e.p.x,dz=e.ai.tz-e.p.z,d=hyp(dx,dz);if(d>.18){const sl=cl(d/2.4,0,1);mx=dx/d*sl;mz=dz/d*sl;}spr=e.ai.sprint;look=e.ai.look;}
 if(e.frozen||S.idle[e.team]&&!hum&&S.phase==='play'&&e.role!=='GK'){mx=mz=0;}
 const ml=hyp(mx,mz);if(ml>1){mx/=ml;mz/=ml;}const has=S.ball.owner===e,T=S.teams[e.team];
 const top=topSpeed(e,T&&T.diff)*(e.role==='REF'||e.role==='LINE'?.86:1);const run=spr&&e.stamina>.05&&ml>.3;
 const spd=top*(run?1:.74)*(has?(run?.9:.93):1)*(e.stamina<.25?.88:1)*(e.charging>0?.55:1)*(S.phase==='goal'&&e.anim.act==='dejected'?.35:1);
 const acc=(has?11:15)*dt;let dvx=mx*spd-e.v.x,dvz=mz*spd-e.v.z;const dl=hyp(dvx,dvz);if(dl>acc){dvx*=acc/dl;dvz*=acc/dl;}e.v.x+=dvx;e.v.z+=dvz;e.v.y=0;
 e.p.x=cl(e.p.x+e.v.x*dt,-P.W-5,P.W+5);e.p.z=cl(e.p.z+e.v.z*dt,-P.L-4,P.L+4);
 const sp=hyp(e.v.x,e.v.z);let want=null;if(sp>.7&&!(look&&sp<2.6))want=Math.atan2(e.v.x,e.v.z);else if(look)want=Math.atan2(look.p.x-e.p.x,look.p.z-e.p.z);else if(e.faceT!=null&&S.phase==='setpiece')want=e.faceT;
 if(e.frozen&&e.spT)want=e.spT.f;if(want!=null){let d=want-e.face;d=Math.atan2(Math.sin(d),Math.cos(d));const tr=(has?7.5:11)*dt;e.face+=cl(d,-tr,tr);}
 if(run&&sp>5)e.stamina=Math.max(0,e.stamina-dt*.055*(1.4-e.at.pace/200));else e.stamina=Math.min(1,e.stamina+dt*(sp<3?.06:.025));}
function separate(){const L=S.ents;for(let i=0;i<L.length;i++){const a=L[i];if(a.hidden||a.off)continue;for(let j=i+1;j<L.length;j++){const b=L[j];if(b.hidden||b.off)continue;const dx=b.p.x-a.p.x,dz=b.p.z-a.p.z,d2=dx*dx+dz*dz;if(d2>.34||d2<1e-6)continue;
 const d=Math.sqrt(d2),o=(.58-d)/d*.5;if(o<=0)continue;const fa=a.frozen||a.dive>0?0:b.frozen||b.dive>0?2:1,fb=2-fa;a.p.x-=dx*o*fa;a.p.z-=dz*o*fa;b.p.x+=dx*o*fb;b.p.z+=dz*o*fb;}}}
/* ================= officials ================= */
function officials(dt){const r=S.ref,b=S.ball;if(S.cardInfo&&S.phase==='dead'){const c=S.cardInfo,o=c.p;r.ai.tx=o.p.x+1.4;r.ai.tz=o.p.z+.6;r.ai.sprint=true;r.ai.look=o;
  if(hyp(r.p.x-o.p.x,r.p.z-o.p.z)<2.2&&r.anim.act!=='card'&&!c.shown){c.shown=true;act(r,'card',1.7);S.fx('card',o,c.card);}}
 else{const sx=b.p.x>0?-1:1;r.ai.tx=cl(b.p.x*.55+sx*7,-P.W+2,P.W-2);r.ai.tz=cl(b.p.z-Math.sign(b.p.z||1)*6,-P.L+6,P.L-6);r.ai.sprint=hyp(r.ai.tx-r.p.x,r.ai.tz-r.p.z)>12;r.ai.look=b;}
 for(const l of S.lines){const s=l.side;// covers the half where z*s>0, standing on touchline x=s*(W+1)
  const def=S.teams.find(T=>T.dir===-s);const us=def?def.pl.filter(active).map(p=>p.p.z*s).sort((a,c)=>c-a):[];const line=Math.max(us[1]??0,b.p.z*s,0);
  l.ai.tx=s*(P.W+1.1);l.ai.tz=s*cl(line,0,P.L);l.ai.sprint=Math.abs(l.ai.tz-l.p.z)>5;l.ai.look=b;}}
/* ================= laws ================= */
function laws(){const b=S.ball,ax=Math.abs(b.p.x),az=Math.abs(b.p.z);
 if(az>P.L+R&&ax<P.GW&&b.p.y<P.GH){goalScored(Math.sign(b.p.z));return;}
 if(b.held||S.phase!=='play')return;
 if(az>P.L+R){const s=Math.sign(b.p.z),def=S.teams.find(T=>T.dir===-s);if(S.lastTeam===def.idx){S.teams[1-def.idx].stats.corners++;S.pend={type:'corner',team:1-def.idx,x:b.p.x,z:b.p.z};S.fx('out','CORNER');}
  else{S.pend={type:'goalkick',team:def.idx,x:b.p.x};S.fx('out','GOAL KICK');}toDead(1.1);return;}
 if(ax>P.W+R){S.pend={type:'throw',team:1-Math.max(0,S.lastTeam),x:b.p.x,z:b.p.z};S.fx('out','THROW-IN');toDead(.9);}}
function goalScored(s){const t=S.teams.findIndex(T=>T.dir===s);if(S.shoot){if(!S.shoot.res)S.shoot.res='goal';return;}if(S.phase!=='play')return;
 let sc=S.lastToucher;if(sc&&sc.team!==t&&S.prevToucher&&S.prevToucher.team===t&&S.time-S.prevT<1.6)sc=S.prevToucher;const og=!!sc&&sc.team!==t;let as=null;if(!og&&S.prevToucher&&S.prevToucher.team===t&&S.prevToucher!==sc&&S.lastToucher.team===t&&S.time-S.prevT<10)as=S.prevToucher;
 S.score[t]++;if(sc&&!og)sc.st.goals++;if(as)as.st.assists++;S.events.push({team:t,name:sc?sc.name:'?',min:minute(),og,pen:S.penLive});
 const cel=og||!sc?S.teams[t].pl.filter(active).sort((a,c)=>(c.role==='FW')-(a.role==='FW'))[0]:sc;
 S.goal={team:t,scorer:og?null:sc,cel,og,side:s,p:S.ball.p.clone(),assist:as,v:rnd()*4|0,pen:S.penLive};S.phase='goal';S.goalT=0;S.penLive=false;S.passTo=null;
 for(const e of S.ents){e.ai.save=null;e.tackling=0;e.charging=0;}for(const h of S.humans){h.charge=0;h.buf=null;}
 const cx=-P.W+3,cz=s*(P.L-10);for(const p of S.plist){if(!active(p))continue;if(p===cel){act(p,'cele',99,{v:S.goal.v});p.ai.tx=cx;p.ai.tz=cz;p.ai.sprint=true;}
  else if(p.team===t){p.ai.tx=cx+(rnd()-.5)*4;p.ai.tz=cz-s*(2+rnd()*4);p.ai.sprint=true;}else{p.ai.tx=p.p.x*.8;p.ai.tz=p.p.z*.8;p.ai.sprint=false;if(rnd()<.6||p.role==='GK')act(p,'dejected',99);}}
 S.fx('goal',S.goal);}
function celebrate(dt){const g=S.goal,c=g.cel;for(const p of S.plist){if(!active(p)||p.team!==g.team||p===c)continue;const d=hyp(p.p.x-c.p.x,p.p.z-c.p.z);if(S.goalT>.8){p.ai.tx=c.p.x+(p.idx%3-1)*.9;p.ai.tz=c.p.z+((p.idx>>1)%3-1)*.9;p.ai.sprint=d>4;}
  if(d<2.2&&p.anim.act!=='hug')act(p,'hug',99);p.ai.look=c;}
 if(c&&g.v===1&&S.goalT>1.4)c.ai.sprint=false;}
export function afterGoal(){if(checkPeriodEnd(true))return;const g=S.goal;beginSP({type:'kick',team:1-g.team},true);}
function lim(){return S.period<=2?S.per:S.per/3;}
function checkPeriodEnd(force){if(S.clock<lim())return false;if(S.attract){S.clock=0;return false;}
 if(!force&&S.phase==='play'){const own=S.ball.owner;const danger=(own&&own.p.z*S.teams[own.team].dir>P.L-30)||(Math.abs(S.ball.p.z)>P.L-P.BD&&Math.abs(S.ball.p.x)<P.BW);if(danger&&S.stoppage<6)return false;}
 if(!force&&S.phase==='setpiece'&&S.sp&&S.sp.type==='pen')return false;
 endPeriod();return true;}
function endPeriod(){const draw=S.score[0]===S.score[1];S.sp=null;S.pend=null;for(const e of S.ents){e.ai.tx=e.p.x;e.ai.tz=e.p.z;e.charging=0;e.ai.save=null;}
 if(S.period===1){S.phase='break';S.breakT=5;S.breakKind='HALF TIME';S.fx('period','HALF TIME');}
 else if(S.period===2&&!(S.cup&&draw)||S.period===4&&!draw){fullTime();}
 else if(S.period===2||S.period===3){S.phase='break';S.breakT=S.period===2?4:2.6;S.breakKind=S.period===2?'EXTRA TIME':'ET HALF TIME';S.fx('period',S.breakKind);}
 else{S.phase='break';S.breakT=4;S.breakKind='PENALTIES';S.fx('period','PENALTIES');}}
function fullTime(){S.phase='end';S.endT=0;const w=S.score[0]>S.score[1]?0:S.score[1]>S.score[0]?1:-1;S.winner=w;
 let k=0;for(const p of S.plist){if(!active(p))continue;const a=k++*.57+rnd()*.2,r=(p.team===w||w<0?3.5:9)+rnd()*4;p.ai.tx=Math.cos(a)*r;p.ai.tz=Math.sin(a)*r;p.ai.sprint=false;p.ai.look=null;if(w<0)continue;act(p,p.team===w?'cele':'dejected',99,{v:p.team===w?[2,3,0][k%3]:0});}S.fx('fulltime',w);}
function nextPeriod(){if(S.breakKind==='PENALTIES'){startShootout();return;}S.period++;S.clock=0;S.stoppage=0;if(S.period===2||S.period===4)for(const T of S.teams)T.dir*=-1;
 const ko=S.period===2||S.period===4?1-S.kickoffFirst:S.kickoffFirst;for(const p of S.plist)p.stamina=Math.min(1,p.stamina+.5);beginSP({type:'kick',team:ko},true);S.fx('kickoffPeriod',S.period);}
/* ================= shootout ================= */
function startShootout(){S.shoot={kicks:[[],[]],turn:rnd()<.5?0:1,res:null,t:0,stage:'next',order:S.teams.map(T=>T.pl.filter(p=>active(p)&&p.role!=='GK').sort((a,b)=>b.at.shot-a.at.shot)),n:[0,0],winner:-1};
 S.period=5;for(const T of S.teams)T.dir=1;S.fx('shootout');shootNext();}
function shootNext(){const so=S.shoot;const a=so.kicks[0],b=so.kicks[1],ga=a.filter(x=>x).length,gb=b.filter(x=>x).length;
 const ra=Math.max(0,5-a.length),rb=Math.max(0,5-b.length);let w=-1;if(a.length<=5&&b.length<=5){if(ga+ra<gb)w=1;else if(gb+rb<ga)w=0;else if(a.length>=5&&b.length>=5&&a.length===b.length&&ga!==gb)w=ga>gb?0:1;}
 else if(a.length===b.length&&ga!==gb)w=ga>gb?0:1;
 if(w>=0){so.winner=w;fullTime();S.winner=w;return;}
 const t=so.turn,T=S.teams[t];for(const X of S.teams)X.dir=1;// everyone shoots at the +z goal
 T.dir=1;S.teams[1-t].dir=-1;const taker=so.order[t][so.n[t]%so.order[t].length];so.n[t]++;so.res=null;so.t=0;so.stage='aim';
 beginSP({type:'pen',team:t,taker,shootout:true},true);}
function shootTick(dt){const so=S.shoot;if(!so||S.phase==='end')return;
 if(S.phase==='shootkick'){so.t+=dt;const b=S.ball,s=1;const away=b.v.z<-.5&&b.p.z<P.L-.5&&so.t>.4,stop=b.v.length()<.4&&so.t>.6,out=Math.abs(b.p.x)>P.W||b.p.z>P.L+R&&!(Math.abs(b.p.x)<P.GW&&b.p.y<P.GH);
  if(so.res||away||stop||out||so.t>3.2||b.held){const sc=so.res==='goal';so.kicks[so.turn].push(sc);S.fx('pen',so.turn,sc);S.phase='shootres';so.t=0;}}
 else if(S.phase==='shootres'){so.t+=dt;if(so.t>1.8){so.turn=1-so.turn;shootNext();}}}
/* ================= ball + per-step driver ================= */
function makePred(){const b=S.ball,o=b.owner||b.held;S.pred.length=0;if(!o){predict(b,3,.1,S.pred);return;}for(let i=0;i<=30;i++){const t=i*.1;S.pred.push({x:cl(o.p.x+o.v.x*t*.8,-P.W,P.W),y:R,z:cl(o.p.z+o.v.z*t*.8,-P.L,P.L),t});}}
function ballStep(dt){const b=S.ball;
 if(b.owner){const o=b.owner,f=fwdOf(o),sp=hyp(o.v.x,o.v.z);const off=.42+sp*.045+(o.sprint&&sp>5.5?.32:0)+.1*Math.abs(Math.sin(o.anim.ph));const tx=o.p.x+f.x*off,tz=o.p.z+f.z*off,k=1-Math.exp(-dt*16);
  const ox=b.p.x,oz=b.p.z;b.p.x+=(tx-b.p.x)*k;b.p.z+=(tz-b.p.z)*k;b.p.y=R;b.v.set((b.p.x-ox)/dt,0,(b.p.z-oz)/dt);}
 else if(b.held){const o=b.held,f=fwdOf(o);if(o.anim.act==='throwHold'||o.anim.act==='throw'){b.p.set(o.p.x-f.x*.08,2.18*o.h,o.p.z-f.z*.08);}else if(o.dive>0){b.p.set(o.p.x+f.x*.3,.45,o.p.z+f.z*.3);}else b.p.set(o.p.x+f.x*.34,1.02*o.h,o.p.z+f.z*.34);b.v.set(0,0,0);}
 stepBall(b,dt,(k,a,pos)=>{S.fx(k,a,pos);if(k==='post'&&S.phase==='play')S.fx('chance');if(k==='net'&&S.goal){}});
 if(S.phase==='play'||S.phase==='shootkick')contacts();resolveSaves(dt);}
let rot=0;function contacts(){const b=S.ball;if(b.owner||b.held)return;const L=S.plist,n=L.length;rot=(rot+7)%n;
 for(let k=0;k<n;k++){const p=L[(k+rot)%n];if(!active(p)||p.stun>0||p.slideT>0||p.kickCD>0)continue;if(S.phase==='shootkick'&&p.role!=='GK')continue;
  const f=fwdOf(p),fx=p.p.x+f.x*.3,fz=p.p.z+f.z*.3,d=hyp(b.p.x-fx,b.p.z-fz);
  if(p.role==='GK'&&ownBox(p)&&p.dive<=0){if(d<1.05&&b.p.y<2.5){gkCollect(p);return;}}
  if(p.dive>0)continue;
  if(b.p.y<.62&&d<.62){control(p);return;}
  if(b.p.y<1.3&&d<.55&&b.v.length()<21){control(p);return;}
  if(b.p.y>=1.3&&b.p.y<2.45&&d<.75&&p.headCD<=0){const recv=S.passTo===p||(S.lastTeam===p.team&&b.v.y<0&&b.v.length()<16);const att=p.p.z*S.teams[p.team].dir>P.L-P.BD-2;const hb=S.humans.some(h=>h.pl===p&&h.buf);if(!recv||att||hb||b.p.y>1.95){header(p);return;}}}}
export function fixed(dt){S.time+=dt;const b=S.ball;for(const e of S.ents){e.kickCD-=dt;e.tackleCD-=dt;e.skillT-=dt;e.skillCD-=dt;e.headCD-=dt;}
 switch(S.phase){
  case'play':S.clock+=dt;if(checkPeriodEnd())break;{const o=b.owner||b.held;if(o&&o.team>=0)S.teams[o.team].stats.poss+=dt;}
   S.thinkT-=dt;if(S.thinkT<=0){S.thinkT=.1;makePred();teamThink(S,0);teamThink(S,1);}
   S.cross[0]=S.cross[1]=null;if(!b.owner&&!b.held)for(const T of S.teams){const s=-T.dir;if(b.v.z*s>3)S.cross[T.idx]=crossing(b,s,2.2);}
   for(const p of S.plist){if(!active(p))continue;if(S.idle[p.team]&&p.ctl<0&&p.role!=='GK')continue;if(p.role==='GK')gkThink(S,p,dt);else if(b.owner===p&&p.ctl<0)carrierThink(S,p,dt);}
   break;
  case'setpiece':if(!S.shoot){S.clock+=dt;}spTick(dt);break;
  case'dead':if(!S.shoot)S.clock+=dt;S.deadT-=dt;if(S.deadT<=0){for(const p of S.plist)if(p.sentOff&&!p.off){p.off=true;p.hidden=true;for(const h of S.humans)if(h.pl===p)setCtl(h,null);}S.cardInfo=null;
    if(S.clock>=lim()&&!(S.pend&&S.pend.type==='pen')){endPeriod();break;}beginSP(S.pend||{type:'kick',team:0});}break;
  case'goal':S.goalT+=dt;celebrate(dt);if(S.goalT>3.6){S.phase='replay';S.fx('replay');}break;
  case'break':S.breakT-=dt;if(S.breakT<=0)nextPeriod();break;
  case'end':S.endT+=dt;break;
  case'shootkick':case'shootres':shootTick(dt);for(const T of S.teams){const g=T.gk;if(g&&active(g)&&S.phase==='shootkick'){g.ai.tx=g.p.x;g.ai.tz=g.p.z;}}break;}
 if(S.phase==='replay')return;
 for(const h of S.humans)human(h,dt);
 officials(dt);
 for(const e of S.ents)move(e,dt);separate();
 ballStep(dt);
 if(S.phase==='play'||S.phase==='shootkick')laws();
 for(const h of S.humans)h.prev={...h.inp};}
export function skipBreak(){if(S.phase==='break')S.breakT=Math.min(S.breakT,.01);}
