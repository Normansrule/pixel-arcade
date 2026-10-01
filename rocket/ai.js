// ROCKET ARENA — CPU drivers: role rotation (attack / support / keeper), shots lined up at goal, boost runs, dodges, aerials.
import * as THREE from '../vendor/three.module.min.js';
import {W,L,GW,GH,RB,G,SP,CAR,query,mkQ} from './physics.js';
const V=THREE.Vector3;const cl=(v,a,b)=>v<a?a:v>b?b:v;
export const DIFF=[
 {n:'EASY',react:.38,noise:7,boost:.4,dodge:.15,jump:false,aerial:false,speed:.86,save:.45},
 {n:'NORMAL',react:.17,noise:3.2,boost:.85,dodge:.6,jump:true,aerial:false,speed:1,save:.8},
 {n:'HARD',react:.06,noise:1.2,boost:1,dodge:1,jump:true,aerial:true,speed:1,save:1}];
const f=new V(),u=new V(),lf=new V(),d=new V(),t1=new V(),t2=new V(),o1=new V(),o2=new V(),Qr=mkQ();

/* ---------- team roles: who attacks, who supports, who keeps ---------- */
export function assignRoles(cars,ball,pred){for(const team of[0,1]){const mine=cars.filter(c=>c.team===team&&c.demoT<=0);const dir=team?-1:1;
  for(const c of mine){const est=intercept(c,pred,1).t;const onside=(ball.p.z-c.p.z)*dir>-6;let hb=0;if(c.human>=0){t1.subVectors(ball.p,c.p).setY(0).normalize();hb=c.v.dot(t1)>6?-.5:1.5;}// humans get first touch only if they are going for it
   c.roleCost=est+(onside?0:1.6)+hb+(c.role==='attack'?-.25:0);}
  mine.sort((a,b)=>a.roleCost-b.roleCost);mine.forEach((c,i)=>{c.role=i===0?'attack':i===1&&mine.length===3?'support':'keeper';});
  if(mine.length===2){const back=mine[1];back.role=Math.abs(back.p.z+dir*L)<Math.abs(ball.p.z+dir*L)*.6?'keeper':'support';}}}

// earliest predicted ball state this car can reach: returns {i,t,need}
function intercept(c,pred,maxH){const sp=c.v.length(),vEst=Math.max(sp,(c.boost>20?50:36)*.8);c.fwd(f);let best=null;
 for(let i=2;i<pred.n;i+=3){const p=pred[i];if(p.y>(maxH===1?4.6:maxH))continue;const dx=p.x-c.p.x,dz=p.z-c.p.z,dist=Math.max(0,Math.hypot(dx,dz)-RB-1.4);
  const ang=Math.abs(Math.atan2(f.x*dz-f.z*dx,f.x*dx+f.z*dz));const need=dist/vEst+ang*.35+(p.y>4.6?.35:0);if(need<=p.t){return{i,t:p.t,need};}best={i,t:p.t+need,need};}
 return best||{i:Math.max(0,pred.n-1),t:3,need:3};}

/* ---------- steering helpers ---------- */
function drive(c,k,tx,ty,tz,speedCap=99){c.fwd(f);c.up(u);lf.crossVectors(u,f);d.set(tx-c.p.x,ty-c.p.y,tz-c.p.z);d.addScaledVector(u,-d.dot(u));
 const lz=d.dot(f),lx=d.dot(lf),dist=Math.hypot(lx,lz),sp=c.v.dot(f);let ang=Math.atan2(lx,lz);
 // target nearly behind: commit to one turning direction instead of flip-flopping
 const ai=c.ai;if(ai){if(Math.abs(ang)>2.2){if(!ai.ts)ai.ts=Math.sign(ang)||1;ang=ai.ts*Math.abs(ang);}else ai.ts=0;}
 k.steer=cl(ang*3.6,-1,1);k.thr=1;k.hb=Math.abs(ang)>1.8&&sp>14&&c.ground;
 if(sp>speedCap+3)k.thr=sp>speedCap+10?-1:0;else if(sp>speedCap)k.thr=.2;
 if(c.ground&&Math.abs(ang)>2.5&&dist<10&&sp<6){k.thr=-1;k.steer=-k.steer;}
 return{ang,dist,sp};}
// point the car's nose along `fw` with its roof toward `up` (air control)
function orient(c,k,fw,upv){c.fwd(f);c.up(u);lf.crossVectors(u,f);o1.crossVectors(f,fw);// rotation axis (world) to bring nose onto fw
 const ax=o1.dot(lf),ay=o1.dot(u);o2.crossVectors(u,upv);const az=o2.dot(f);const err=f.dot(fw);
 k.thr=cl(ax*4-c.wl.x*.35,-1,1);k.steer=cl(ay*4-c.wl.y*.3,-1,1)*(err<-.2?1:1);k.roll=cl(az*3-c.wl.z*.3,-1,1)*(err>.6?1:.3);k.hb=false;if(err<0&&Math.abs(ay)<.15)k.steer=1;}

/* ---------- main brain ---------- */
export function think(c,w,dt){const k=c.ctrl;k.jump=false;k.boost=false;k.hb=false;k.roll=0;
 if(c.idle||c.demoT>0){k.thr=0;k.steer=0;return;}
 const D=w.diff,ai=c.ai||(c.ai={t:0,plan:null,seq:null,seqT:0,stuck:0,aer:null,boostRoll:Math.random()}),ball=w.ball,dir=c.team?-1:1,pred=w.pred;
 // scripted button sequences (dodges, jumps)
 if(ai.seq){ai.seqT+=dt;const s=ai.seq;let st=null;for(const e of s)if(ai.seqT>=e.t)st=e;if(st){k.jump=!!st.jump;if(st.thr!==undefined){k.thr=st.thr;k.steer=st.steer||0;}}if(ai.seqT>s[s.length-1].t+.05)ai.seq=null;if(st&&st.thr!==undefined)return;}
 // aerial in progress
 if(ai.aer){if(aerial(c,k,w,dt))return;ai.aer=null;}
 // in the air: land on the wheels
 if(!c.ground){if(c.body){k.jump=ai.turtle=!ai.turtle;k.thr=0;k.steer=0;return;}
  query(c.p,Qr);t2.set(c.v.x,0,c.v.z);if(t2.lengthSq()<1)c.fwd(t2).setY(0);t2.normalize();const upv=Qr.d<9?Qr.n:t1.set(0,1,0);if(upv.y<.95){t2.addScaledVector(upv,-t2.dot(upv)).normalize();}
  orient(c,k,t2,upv);if(c.dodgeT>0){k.thr=0;k.steer=0;k.roll=0;}return;}
 // stuck detection
 if(c.v.length()<2.5&&!w.kickoff)ai.stuck+=dt;else ai.stuck=0;if(ai.stuck>1.4){ai.stuck=0;ai.seq=[{t:0,jump:1},{t:.15,jump:0}];ai.seqT=0;}
 // kickoff
 if(w.kickoff&&!c.kick&&w.kickT>.6){// the designated taker is not going (e.g. an idle human): the nearest bot takes it
  const mates=w.cars.filter(o=>o.team===c.team&&o.demoT<=0),tk=mates.find(o=>o.kick);if(tk&&tk.human>=0&&tk.v.length()<8){const bots=mates.filter(o=>o.human<0).sort((a,b)=>a.p.lengthSq()-b.p.lengthSq());if(bots[0]===c){tk.kick=false;c.kick=true;}}}
 if(w.kickoff){if(c.kick){const r=drive(c,k,0,0,-dir*1.2,99);k.boost=c.boost>0;const dd=Math.hypot(c.p.x-ball.p.x,c.p.z-ball.p.z);
   if(dd<11+c.v.length()*.04&&Math.random()<D.dodge*1.6+.1){ai.seq=[{t:0,jump:1,thr:1,steer:0},{t:.06,jump:0,thr:1,steer:0},{t:.1,jump:1,thr:1,steer:cl(r.ang*2,-.4,.4)},{t:.2,jump:0,thr:1,steer:0}];ai.seqT=0;}return;}
  if(c.role==='keeper'||w.size===1){goTo(c,k,cl(ball.p.x*.2,-6,6),-dir*(L-5),ball);return;}
  const pad=w.pads.filter(p=>p.big&&p.t<=0&&p.z*dir<0).sort((a,b)=>dist2(c,a)-dist2(c,b))[0];if(pad){drive(c,k,pad.x,0,pad.z);k.boost=c.boost>40;return;}}
 // re-plan at the bot's reaction rate
 ai.t-=dt;if(ai.t<=0||!ai.plan){ai.t=D.react*(.7+Math.random()*.6);ai.plan=plan(c,w);ai.boostRoll=Math.random();}
 const P=ai.plan;
 if(P.type==='spot'){if(P.through)drive(c,k,P.x,0,P.z);else goTo(c,k,P.x,P.z,ball,P.cap);if(P.boost)k.boost=k.thr>0&&c.boost>0&&ai.boostRoll<D.boost;return;}
 // attacking / clearing
 const[tx,tz,pd]=approach(c,P);const r=drive(c,k,tx,0,tz);const bd=t1.subVectors(ball.p,c.p).length();
 // tight turn near the target: slow down so the turning circle fits
 const ta=Math.abs(r.ang);if(r.dist<28&&ta>.3&&c.ground){const vmax=1.35*r.dist/Math.sin(Math.min(1.5,ta))+7;if(r.sp>vmax+12)k.thr=-1;else if(r.sp>vmax)k.thr=0;if(ta>1.1&&r.sp>12)k.hb=true;}
 if(P.wait>.35&&P.py>5&&bd>12){const want=pd/Math.max(.25,P.t-.15);if(r.sp>want+4)k.thr=r.sp>want+12?-.6:0;}
 if(Math.abs(r.ang)<.3&&c.boost>0&&r.sp<SP.max-1&&ai.boostRoll<D.boost&&(r.dist>14||P.shot)&&!(P.wait>.5&&P.py>5))k.boost=true;
 // contact moves
 c.fwd(f);const hz=ball.p.y;const toB=t2.subVectors(ball.p,c.p);const along=toB.dot(f);const side=Math.abs(toB.dot(lf.crossVectors(u.set(0,1,0),f)));
 if(c.ground&&c.n.y>.8){
  if(hz<4.6&&along>2&&along<7.5+r.sp*.06&&side<2.4&&r.sp>14&&ai.boostRoll<D.dodge&&Math.abs(r.ang)<.4){const sx=cl(toB.dot(lf)*.25,-.6,.6);ai.seq=[{t:0,jump:1,thr:1,steer:0},{t:.06,jump:0,thr:1,steer:0},{t:.11,jump:1,thr:1,steer:sx},{t:.22,jump:0,thr:1,steer:0}];ai.seqT=0;return;}
  if(D.jump&&hz>4.8&&hz<11&&along>0&&along<7&&side<3.2&&ball.v.y<6){ai.seq=hz>7.5?[{t:0,jump:1},{t:.2,jump:0},{t:.26,jump:1},{t:.32,jump:0}]:[{t:0,jump:1},{t:.24,jump:0}];ai.seqT=0;return;}
  if(D.aerial&&P.aerial&&c.boost>22&&Math.abs(r.ang)<.25){ai.aer={t:0,tgt:P.ti,t0:w.time};ai.seq=null;aerial(c,k,w,dt);return;}}
}
const dist2=(c,p)=>(c.p.x-p.x)**2+(c.p.z-p.z)**2;
function goTo(c,k,x,z,ball,cap){const r=drive(c,k,x,0,z,cap??99);if(r.dist<7){const b=drive(c,k,ball.p.x,0,ball.p.z,4);k.thr=r.sp>3?-.5:Math.abs(b.ang)>.4?.4:0;k.hb=false;}else if(r.dist<22){const want=Math.max(8,r.dist*1.6);if(r.sp>want)k.thr=0;}}

function plan(c,w){const D=w.diff,ball=w.ball,dir=c.team?-1:1,pred=w.pred,own=-dir*L,threat=w.threat[c.team];
 const ownDist=Math.abs(ball.p.z-own);
 let role=c.role;if(w.size===1)role='attack';
 if(role!=='attack'){// defenders jump in when the net is in danger
  if(threat&&threat.t<2.2&&Math.random()<D.save&&(role==='keeper'||threat.t<1.2))role='attack';
  else if(role==='keeper'&&ownDist<34)role='attack';}
 if(role==='support'){let x=cl(ball.p.x*.4,-W*.55,W*.55),z=cl(ball.p.z-dir*34,-L+12,L-12);
  if(c.boost<35){const pad=w.pads.filter(p=>p.t<=0&&(p.z-ball.p.z)*dir<4).sort((a,b)=>dist2(c,a)*(a.big?.45:1)-dist2(c,b)*(b.big?.45:1))[0];if(pad&&dist2(c,pad)<45*45)return{type:'spot',x:pad.x,z:pad.z,cap:99,boost:false};}
  return{type:'spot',x,z,cap:30+Math.abs(c.p.z-z)*.6,boost:Math.abs(c.p.z-z)>30};}
 if(role==='keeper')return{type:'spot',x:cl(ball.p.x*.3,-GW*.6,GW*.6),z:own+dir*5,cap:24+Math.abs(c.p.z-own)*.7,boost:Math.abs(c.p.z-own)>45};
 // attacker: if we're on the wrong side of a ball that is coming back at our goal, retreat goal-side via the far post
 const wrong=(ball.p.z-c.p.z)*dir<-3,ballToward=ball.v.z*dir<-6;
 let sideClear=false;
 if(wrong&&(ballToward||threat)){if(ball.p.y>7||ball.v.length()>36){const z=dir>0?Math.max(own+6,ball.p.z-16):Math.min(own-6,ball.p.z+16);return{type:'spot',x:ball.p.x>0?-GW*.7:GW*.7,z,cap:99,boost:true,through:true};}sideClear=true;}
 const maxH=D.aerial&&c.boost>25?28:D.jump?10:4.6;const it=intercept(c,pred,maxH);const p=pred[it.i]||{x:ball.p.x,y:ball.p.y,z:ball.p.z,t:0};
 // low on boost and not urgent: grab a pad that is roughly on the way
 if(c.boost<25&&it.t>1.4&&!threat&&!sideClear){c.fwd(f);const pad=w.pads.filter(q=>q.t<=0&&dist2(c,q)<(q.big?40*40:22*22)&&((q.x-c.p.x)*f.x+(q.z-c.p.z)*f.z)>0).sort((a,b)=>dist2(c,a)*(a.big?.4:1)-dist2(c,b)*(b.big?.4:1))[0];if(pad)return{type:'spot',x:pad.x,z:pad.z,cap:99,boost:false,through:true};}
 // aim: at the opponent goal, or away from our own goal when clearing
 const clearing=(p.z-own)*dir<L*.55;let ax,az;
 if(sideClear){ax=c.p.x>p.x?-1:1;az=dir*.35;}else if(clearing){ax=p.x;az=p.z-(own-dir*25);}
 else{const gx=cl(p.x*.3,-GW+5,GW-5)+(Math.random()-.5)*D.noise;ax=gx-p.x;az=dir*(L+4)-p.z;}
 const al=Math.hypot(ax,az)||1;ax/=al;az/=al;
 return{type:'hit',px:p.x,py:p.y,pz:p.z,ax,az,t:it.t,wait:it.t-it.need,shot:!clearing,aerial:p.y>9,ti:it.i};}
// steering target for a planned hit: slides in behind the ball along the aim line as we close in (a smooth curve, no branches)
function approach(c,P){const dx=P.px-c.p.x,dz=P.pz-c.p.z,dist=Math.hypot(dx,dz)||1,ahead=dx*P.ax+dz*P.az,lineup=ahead/dist;
 let x,z;
 if(ahead<RB+1.5&&dist<34){// level with or past the ball: swing round on the side we're already on
  const s=Math.sign(-dx*-P.az+-dz*P.ax)||1;x=P.px+(-P.az)*s*(RB+6)-P.ax*(RB+6);z=P.pz+P.ax*s*(RB+6)-P.az*(RB+6);}
 else if(dist<9&&lineup>.9){x=P.px+P.ax*5;z=P.pz+P.az*5;}
 else{const off=RB+1.2+Math.min(26,dist*.6)*(1-lineup);x=P.px-P.ax*off;z=P.pz-P.az*off;}
 return[cl(x,-W+3,W-3),cl(z,-L-6,L+6),dist];}

function aerial(c,k,w,dt){const A=c.ai.aer;A.t+=dt;const el=w.time-A.t0,pred=w.pred;
 if(A.t>2.6||(c.ground&&A.t>.4)||c.boost<=0&&A.t>.6)return false;
 // re-target the predicted ball each frame
 let best=null;for(let i=0;i<pred.n;i++){const p=pred[i];if(p.t<.15)continue;const tau=p.t;d.set(p.x-c.p.x,p.y-c.p.y,p.z-c.p.z);
  const req=t1.copy(d).addScaledVector(c.v,-tau).multiplyScalar(2/(tau*tau));req.y+=G;const need=req.length();if(need<SP.boostAcc*1.05){best={p,tau,req:req.clone()};break;}}
 if(!best)return A.t<.5;
 k.jump=A.t<.18||(A.t>.24&&A.t<.3);k.thr=0;k.steer=0;
 if(A.t<.24&&c.ground)return true;
 const fw=t2.copy(best.req).normalize();orient(c,k,fw,t1.set(0,1,0));c.fwd(f);k.boost=f.dot(fw)>.7;
 if(d.length()<RB+2.5&&best.tau<.25){k.boost=true;}return true;}
