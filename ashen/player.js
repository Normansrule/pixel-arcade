// ASHEN VIGIL — the Unkindled: stamina combat for three weapon styles (light/heavy chains, roll with i-frames, guard, parry → riposte,
// backstabs, flasks, poise), lock-on, and the third-person souls camera.
import * as THREE from '../vendor/three.module.min.js';
import {makeRig,arm,animate,gearPoints} from './rig.js';
import {Trail} from './fx.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
const tv=new V(),tv2=new V(),tv3=new V();

/* weapon styles: attacks are {anim, dur, h0, h1 (hit window), dmg, poise, stam, reach, arc, lunge, h2/h3 (second hit window)} */
export const STYLES={
 ss:{name:'SWORD & SHIELD',sub:'Steady. A true shield and the widest parry.',absorb:1,guardCost:.55,parry:.2,poiseMax:32,rollDur:.62,iA:.07,iB:.42,hp:520,crit:150,
  light:[{anim:'slash1',dur:.56,h0:.18,h1:.29,dmg:28,poise:22,stam:13,reach:2.7,arc:2.1,lunge:3.5},{anim:'slash2',dur:.56,h0:.18,h1:.29,dmg:28,poise:22,stam:13,reach:2.7,arc:2.1,lunge:3.5},{anim:'thrust',dur:.66,h0:.21,h1:.32,dmg:34,poise:28,stam:15,reach:3.0,arc:.9,lunge:6}],
  heavy:{anim:'chop',dur:1.0,h0:.44,h1:.56,dmg:58,poise:55,stam:28,reach:2.9,arc:1.3,lunge:4.5},run:{anim:'thrust',dur:.7,h0:.24,h1:.36,dmg:38,poise:35,stam:18,reach:3.1,arc:1,lunge:9}},
 gs:{name:'GREATSWORD',sub:'Slow, crushing arcs. Heavy blows ignore flinching.',absorb:.72,guardCost:.75,parry:.14,poiseMax:55,rollDur:.68,iA:.09,iB:.42,hp:560,crit:210,
  light:[{anim:'gsweepR',dur:.9,h0:.34,h1:.48,dmg:52,poise:48,stam:22,reach:3.5,arc:2.7,lunge:3},{anim:'gsweepL',dur:.9,h0:.34,h1:.48,dmg:52,poise:48,stam:22,reach:3.5,arc:2.7,lunge:3}],
  heavy:{anim:'slam2',dur:1.3,h0:.62,h1:.74,dmg:98,poise:95,stam:36,reach:3.6,arc:1.1,lunge:3,hyper:1,shock:1.8},run:{anim:'gsweepR',dur:.95,h0:.36,h1:.5,dmg:60,poise:55,stam:26,reach:3.6,arc:2.4,lunge:8}},
 dg:{name:'TWIN DAGGERS',sub:'Quick flurries, a fast roll, brutal crits.',absorb:.45,guardCost:.9,parry:.26,poiseMax:16,rollDur:.5,iA:.05,iB:.43,hp:480,crit:190,
  light:[{anim:'dagR',dur:.34,h0:.1,h1:.19,dmg:15,poise:9,stam:8,reach:2.1,arc:1.9,lunge:3},{anim:'dagL',dur:.34,h0:.1,h1:.19,dmg:15,poise:9,stam:8,reach:2.1,arc:1.9,lunge:3,off:1},{anim:'dagR',dur:.34,h0:.1,h1:.19,dmg:16,poise:9,stam:8,reach:2.1,arc:1.9,lunge:3},{anim:'dagL',dur:.34,h0:.1,h1:.19,dmg:16,poise:9,stam:8,reach:2.1,arc:1.9,lunge:3,off:1},{anim:'dagX',dur:.55,h0:.2,h1:.3,dmg:26,poise:20,stam:12,reach:2.3,arc:2.2,lunge:4}],
  heavy:{anim:'spin',dur:.72,h0:.2,h1:.3,h2:.42,h3:.52,dmg:26,poise:24,stam:22,reach:2.5,arc:6.3,lunge:2,spin:1},run:{anim:'dagX',dur:.6,h0:.22,h1:.33,dmg:28,poise:20,stam:14,reach:2.5,arc:1.6,lunge:9}}};

export function makePlayer(G){const rig=makeRig('hero');G.scene.add(rig.root);
 const P={rig,p:new V(),v:new V(),yaw:0,hp:500,maxHp:500,st:100,stMax:100,stDelay:0,flasks:4,maxFlasks:4,style:'ss',S:STYLES.ss,
  act:null,queue:null,combo:0,block:false,blockT:0,iframe:0,poise:0,poiseT:0,lock:null,dead:false,deadT:0,sprinting:false,stepT:0,grounded:true,
  trail:new Trail(G.scene,16,new THREE.Color(.62,.5,.34)),trail2:new Trail(G.scene,12,new THREE.Color(.62,.5,.34)),stats:{parries:0,ripostes:0,backstabs:0,flasks:0,hits:0,dmg:0,rolls:0,blocks:0}};
 G.P=P;return P;}
export function equip(G,style){const P=G.P;P.style=style;P.S=STYLES[style];arm(P.rig,style);P.rig.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});P.trail.col.setRGB(1.4,1.2,.9);}
export function resetPlayer(G,x,y,z,yaw){const P=G.P;P.p.set(x,y,z);P.v.set(0,0,0);P.yaw=yaw;P.act=null;P.queue=null;P.block=false;P.lock=null;P.dead=false;P.deadT=0;P.iframe=1;P.poise=0;P.combo=0;P.hp=P.maxHp;P.st=P.stMax;
 P.rig.root.position.copy(P.p);P.rig.root.rotation.set(0,yaw,0);G.cam.yaw=yaw;G.cam.pitch=.18;G.cam.snap=true;}
function useStam(P,a){P.st=Math.max(-12,P.st-a);P.stDelay=a>14?.8:.55;}

/* ================= per-step update ================= */
export function updatePlayer(G,dt,inp){const P=G.P,rig=P.rig,S=P.S;
 P.iframe=Math.max(0,P.iframe-dt);P.poiseT-=dt;if(P.poiseT<=0)P.poise=Math.max(0,P.poise-dt*20);
 if(P.dead){P.deadT+=dt;P.v.multiplyScalar(.9);animate(rig,{mode:'dead',dp:Math.min(1,P.deadT*1.4),t:G.time},dt);rig.root.position.copy(P.p);G.updateCape(P.cape,rig,dt);return;}
 // camera-relative input
 const cy=G.cam.yaw,fx=Math.sin(cy),fz=Math.cos(cy);let wx=fx*inp.my-fz*inp.mx,wz=fz*inp.my+fx*inp.mx;const wl=Math.hypot(wx,wz);if(wl>1e-4){wx/=wl;wz/=wl;}const im=Math.min(1,wl);
 // lock validity
 if(P.lock&&(P.lock.dead||P.lock.p.distanceTo(P.p)>28||!P.lock.rig.root.visible||P.lock.state==='dormant'))P.lock=null;
 // stamina regen
 P.stDelay-=dt;if(P.stDelay<=0&&!P.act){P.st=Math.min(P.stMax,P.st+dt*(P.block?14:P.sprinting?0:48));}
 const a=P.act;
 // ---------- start actions ----------
 const free=!a||a.cancel&&a.t>=a.cancel;
 if(inp.flask&&!a&&P.flasks>0){P.act={k:'drink',t:0,dur:1.25};P.flasks--;P.stats.flasks++;G.snd.play('drinkStart',P.p);}
 else if(inp.flask&&!a&&P.flasks<=0)G.note('No Ember Flasks remain');
 if(inp.roll&&(free||a&&a.k==='atk'&&a.t>a.A.h1+.06)&&P.st>0&&!(a&&(a.k==='crit'||a.k==='drink'||a.k==='hurt'))){startRoll(G,wl>.1?{x:wx,z:wz}:null);}
 else if(inp.parry&&free&&P.st>0&&!(a&&a.k!=='atk')){P.act={k:'parry',t:0,dur:.6};useStam(P,10);G.snd.play('parrySwing',P.p);P.queue=null;}
 else if((inp.light||inp.heavy)&&P.st>0){if(!a||a.k==='atk'&&a.t>a.A.dur*.35||a.k==='roll'&&a.t>a.dur*.7){P.queue=inp.heavy?'heavy':'light';P.queueT=.45;}}
 if(P.queue){P.queueT-=dt;if(P.queueT<=0)P.queue=null;}
 if(P.queue&&P.st>0){const c=P.act;const ready=!c||c.k==='atk'&&c.t>=Math.min(c.A.dur,c.A.h1+(c.A.dur-c.A.h1)*.45)||c.k==='roll'&&c.t>c.dur*.82;
  if(ready){const q=P.queue;P.queue=null;// riposte / backstab take priority over a normal light attack
   const crit=q==='light'?findCrit(G):null;if(crit)startCrit(G,crit.e,crit.kind);else startAtk(G,q,c,wl>.1?{x:wx,z:wz}:null);}}
 // guard
 const canBlock=(!P.act||P.act.k==='atk'&&P.act.t>P.act.A.h1+.1)&&inp.block;if(canBlock&&P.act&&P.act.k==='atk'){P.act=null;}
 if(canBlock&&!P.block)P.blockT=0;P.block=canBlock&&!P.act;if(P.block)P.blockT+=dt;
 // sprint
 P.sprinting=inp.sprint&&wl>.1&&!P.act&&!P.block&&P.st>0&&!inp.light;if(P.sprinting){P.st-=dt*16;P.stDelay=.45;}
 // ---------- actions ----------
 let mvSpeed=(P.sprinting?6.9:inp.walk?2.2:4.4)*im,face=null;
 if(P.block)mvSpeed*=.5;
 const c=P.act;if(c){c.t+=dt;
  if(c.k==='roll'){const k=c.t/c.dur;const sp=(c.back?6.5:8.6)*(1-ease(k)*.85)*(P.style==='dg'?1.1:1);P.v.x=c.x*sp;P.v.z=c.z*sp;mvSpeed=-1;if(c.t>=c.dur)P.act=null;}
  else if(c.k==='atk'){const A=c.A;mvSpeed=0;if(c.t<A.h0*.6){// steer during the windup
    if(P.lock)face=Math.atan2(P.lock.p.x-P.p.x,P.lock.p.z-P.p.z);else if(c.steer)face=Math.atan2(c.steer.x,c.steer.z);}
   const lg=c.t>A.h0*.7&&c.t<A.h1?A.lunge:0;tv.set(Math.sin(P.yaw),0,Math.cos(P.yaw));const near=nearestFront(G,1.4);P.v.x=tv.x*lg*(near?.2:1);P.v.z=tv.z*lg*(near?.2:1);mvSpeed=-1;
   if(c.t>=A.h0&&!c.hit1){c.hit1=true;swing(G,c,A,1);}if(A.h2&&c.t>=A.h2&&!c.hit2){c.hit2=true;swing(G,c,A,2);}
   if(c.t>=A.dur){P.act=null;if(!P.queue)P.combo=0;}}
  else if(c.k==='parry'){mvSpeed*=.2;if(c.t>=c.dur)P.act=null;}
  else if(c.k==='drink'){mvSpeed*=.35;if(c.t>.6&&!c.healed){c.healed=true;const h=Math.round(P.maxHp*G.dm.heal);P.hp=Math.min(P.maxHp,P.hp+h);G.healFx(h);}if(c.t>=c.dur)P.act=null;}
  else if(c.k==='crit'){mvSpeed=-1;P.v.multiplyScalar(.8);P.iframe=Math.max(P.iframe,.1);const e=c.e;if(e&&!e.dead){P.yaw+=angDiff(P.yaw,Math.atan2(e.p.x-P.p.x,e.p.z-P.p.z))*Math.min(1,dt*12);}
   if(c.t>=.48&&!c.done){c.done=true;critHit(G,c);}if(c.t>=c.dur)P.act=null;}
  else if(c.k==='hurt'){mvSpeed=-1;P.v.multiplyScalar(Math.exp(-dt*5));if(c.t>=c.dur)P.act=null;}
  else if(c.k==='rest'){mvSpeed=0;}}
 // locomotion
 if(mvSpeed>=0){const tx=wx*mvSpeed,tz=wz*mvSpeed;const acc=wl>.1?12:16;P.v.x+=(tx-P.v.x)*Math.min(1,dt*acc);P.v.z+=(tz-P.v.z)*Math.min(1,dt*acc);}
 // facing
 if(face!==null)P.yaw+=angDiff(P.yaw,face)*Math.min(1,dt*18);
 else if(!P.act||P.act.k==='drink'||P.act.k==='parry'){if(P.lock&&!P.sprinting)P.yaw+=angDiff(P.yaw,Math.atan2(P.lock.p.x-P.p.x,P.lock.p.z-P.p.z))*Math.min(1,dt*12);else if(wl>.1)P.yaw+=angDiff(P.yaw,Math.atan2(wx,wz))*Math.min(1,dt*12);}
 // move + collide
 P.p.x+=P.v.x*dt;P.p.z+=P.v.z*dt;const hit=G.phys.push(P.p,.42,1.8,.55);if(hit.o){const vn=P.v.x*hit.nx+P.v.z*hit.nz;if(vn<0){P.v.x-=vn*hit.nx;P.v.z-=vn*hit.nz;}}
 for(const e of G.foes){if(e.dead||!e.rig.root.visible||e.flying)continue;const dx=P.p.x-e.p.x,dz=P.p.z-e.p.z,d=Math.hypot(dx,dz),m=.42+e.D.r;if(d<m&&d>1e-4&&Math.abs(P.p.y-e.p.y)<2){P.p.x+=dx/d*(m-d);P.p.z+=dz/d*(m-d);}}
 const gr=G.phys.ground(P.p.x,P.p.y+.3,P.p.z,.4,.85);if(P.p.y>gr.h+.05){P.v.y-=26*dt;P.p.y=Math.max(gr.h,P.p.y+P.v.y*dt);P.grounded=false;}else{P.p.y+=(gr.h-P.p.y)*Math.min(1,dt*22);P.v.y=0;P.grounded=true;}
 if(P.p.y<-12&&!P.dead)G.fellToDeath();
 // ---------- animation ----------
 const hsp=Math.hypot(P.v.x,P.v.z),c2=P.act;const st={t:G.time,speed:hsp,guard:P.style,gw:1,block:P.block,hurt:0,oneHand:P.style==='ss'};
 st.mode=c2&&c2.k==='roll'?(c2.back?'backstep':'roll'):c2&&c2.k==='hurt'?'stagger':c2&&c2.k==='rest'?'rest':hsp>.3?(P.lock&&!P.sprinting?'strafe':'move'):'idle';
 if(st.mode==='roll'||st.mode==='backstep')st.roll={p:c2.t/c2.dur};if(st.mode==='stagger')st.sp=c2.t/c2.dur;
 if(st.mode==='strafe'){const f=Math.sin(P.yaw),cc=Math.cos(P.yaw);st.fwd=(P.v.x*f+P.v.z*cc)/Math.max(hsp,1);st.side=(P.v.x*cc-P.v.z*f)/Math.max(hsp,1);}
 if(P.sprinting)st.gw=.25;
 if(c2&&c2.k==='atk'){const A=c2.A,t=c2.t;st.atk=t<A.h0?{name:A.anim,p:0,w:ease(t/(A.h0*.85))}:t<A.h1?{name:A.anim,p:.45*(t-A.h0)/(A.h1-A.h0)}:{name:A.anim,p:.45+.55*ease((t-A.h1)/(A.dur-A.h1))};if(A.h2&&t>A.h1&&t<A.h3)st.atk={name:A.anim,p:.45};st.snap=t>=A.h0*.85&&t<A.h1+.04;
  if(P.style==='ss')st.atk.keepL=true;}
 if(c2&&c2.k==='parry'){st.atk={name:P.style==='ss'?'parry':'parryW',p:Math.min(1,c2.t/.5)};st.snap=true;if(P.style==='ss')st.atk.keepL=false;}
 if(c2&&c2.k==='drink'){st.atk={name:'drink',p:Math.min(1,c2.t/.9),keepL:true};}
 if(c2&&c2.k==='crit'){const k=c2.t;st.atk={name:c2.kind==='riposte'?'thrust':'thrust',p:k<.38?0:Math.min(1,.45*(k-.38)/.12+(k>.5?.55*(k-.5)/.8:0)),w:k<.38?ease(k/.3):1};st.snap=k>.36&&k<.55;}
 animate(rig,st,dt);
 rig.root.position.copy(P.p);rig.root.rotation.y=P.yaw+(c2&&c2.k==='atk'&&c2.A.spin?Math.max(0,Math.min(1,(c2.t-c2.A.h0*.8)/(c2.A.h3-c2.A.h0*.8)))*Math.PI*4:0);
 G.updateCape(P.cape,rig,dt);
 // footsteps
 if(P.grounded&&hsp>1&&(!c2||c2.k!=='roll')){P.stepT-=dt*hsp/(P.sprinting?2.4:1.9);if(P.stepT<=0){P.stepT=1;G.snd.play('step',P.p,P.sprinting?1:.7);}}
 // blade trails
 const on=!!c2&&(c2.k==='atk'&&c2.t>c2.A.h0*.75&&c2.t<c2.A.h1+.08||c2.A&&c2.A.h2&&c2.t>c2.A.h2-.05&&c2.t<c2.A.h3+.05)||c2&&c2.k==='crit'&&c2.t>.36&&c2.t<.6;
 const mw=rig.weapons.main;if(mw){gearPoints(mw,tv,tv2);P.trail.push(tv,tv2,on,dt);}
 const ow=rig.weapons.off;if(ow){gearPoints(ow,tv,tv2);P.trail2.push(tv,tv2,on&&(c2.A&&(c2.A.off||c2.A.anim==='dagX'||c2.A.spin)),dt);}else P.trail2.push(tv,tv2,false,dt);}

function nearestFront(G,r){const P=G.P;for(const e of G.foes){if(e.dead||!e.rig.root.visible)continue;const dx=e.p.x-P.p.x,dz=e.p.z-P.p.z,d=Math.hypot(dx,dz)-e.D.r;if(d<r&&(dx*Math.sin(P.yaw)+dz*Math.cos(P.yaw))>0)return e;}return null;}
function startRoll(G,d){const P=G.P,S=P.S;const back=!d;if(back)d={x:-Math.sin(P.yaw),z:-Math.cos(P.yaw)};const dur=back?.42:S.rollDur;P.act={k:'roll',t:0,dur,x:d.x,z:d.z,back};if(!back)P.yaw=Math.atan2(d.x,d.z);
 P.iframe=0;P.rollI={a:back?.03:S.iA,b:back?.28:S.iB,t0:G.time};useStam(P,back?12:P.style==='gs'?20:16);P.queue=null;P.block=false;P.stats.rolls++;G.snd.play('roll',P.p);G.dust(P.p.x,P.p.y,P.p.z,6,true);}
export function rollInvuln(G){const P=G.P;if(!P.act||P.act.k!=='roll')return false;const t=P.act.t;return t>=P.rollI.a&&t<=P.rollI.b;}
function startAtk(G,kind,prev,steer){const P=G.P,S=P.S;let A;
 if(kind==='heavy'){A=S.heavy;P.combo=0;}
 else if(P.sprinting||prev&&prev.k==='roll'){A=S.run;P.combo=0;}
 else{const chain=prev&&prev.k==='atk'&&!prev.heavy;P.combo=chain?(P.combo+1)%S.light.length:0;A=S.light[P.combo];}
 P.act={k:'atk',t:0,A,heavy:kind==='heavy',steer,cancel:A.h1+.05};useStam(P,A.stam);P.block=false;
 // snap to the lock target / nearest foe in front
 let tgt=P.lock;if(!tgt){let bd=4.5;for(const e of G.foes){if(e.dead||!e.rig.root.visible||e.state==='dormant')continue;const dx=e.p.x-P.p.x,dz=e.p.z-P.p.z,d=Math.hypot(dx,dz)-e.D.r;const fw=(dx*Math.sin(P.yaw)+dz*Math.cos(P.yaw))/Math.max(.01,Math.hypot(dx,dz));if(d<bd&&fw>.2){bd=d;tgt=e;}}}
 if(tgt&&!steer)P.act.steer={x:tgt.p.x-P.p.x,z:tgt.p.z-P.p.z};if(tgt&&steer&&P.lock)P.act.steer=null;
 G.snd.play(kind==='heavy'?'swingHeavy':'swing',P.p,P.style==='gs'?1.3:P.style==='dg'?.7:1);}
// light attack into a parried/broken foe (front) or an unaware/unready foe (back) → critical
function findCrit(G){const P=G.P;let best=null,bd=9;for(const e of G.foes){if(e.dead||!e.rig.root.visible||e.state==='dormant'||e.flying)continue;const dx=e.p.x-P.p.x,dz=e.p.z-P.p.z,d=Math.hypot(dx,dz);const reach=e.D.r+(e.D.boss?2.2:1.5);if(d>reach||Math.abs(e.p.y-P.p.y)>1.5)continue;
  const fe=Math.sin(e.yaw)*-dx+Math.cos(e.yaw)*-dz;// >0: player in front of the foe
  const toE=(dx*Math.sin(P.yaw)+dz*Math.cos(P.yaw))/Math.max(d,.01);
  if((e.state==='parried'||e.state==='broken')&&fe>-.2&&d<bd){bd=d;best={e,kind:'riposte'};}
  else if(!e.D.boss&&!e.D.quad&&fe<-d*.55&&toE>.4&&e.state!=='atk'&&e.state!=='crit'&&d<bd){bd=d;best={e,kind:'backstab'};}}return best;}
function startCrit(G,e,kind){const P=G.P;P.act={k:'crit',t:0,dur:1.35,e,kind};P.iframe=1.4;P.block=false;P.lock=P.lock||null;
 // pull the hero into position
 const dx=P.p.x-e.p.x,dz=P.p.z-e.p.z,d=Math.hypot(dx,dz)||1;const want=e.D.r+.9;if(kind==='backstab'){const bx=-Math.sin(e.yaw),bz=-Math.cos(e.yaw);P.p.x=e.p.x+bx*want;P.p.z=e.p.z+bz*want;e.state='crit';e.t=-0.4;e.stagT=1.9;}
 else{P.p.x=e.p.x+dx/d*want;P.p.z=e.p.z+dz/d*want;e.t=Math.min(e.t,e.stagT-1.2);}
 P.yaw=Math.atan2(e.p.x-P.p.x,e.p.z-P.p.z);G.snd.play('critStart',P.p);G.critStart(e,kind);}
function critHit(G,c){const P=G.P,e=c.e;if(!e||e.dead)return;const dmg=Math.round(P.S.crit*(c.kind==='backstab'?1.15:1)*(e.D.boss?1.25:1));
 if(c.kind==='riposte')P.stats.ripostes++;else P.stats.backstabs++;G.damageFoe(e,dmg,{crit:true,poise:999,dir:tv3.set(Math.sin(P.yaw),0,Math.cos(P.yaw)).clone(),kind:c.kind});}
function swing(G,c,A,n){const P=G.P;const f=Math.sin(P.yaw),co=Math.cos(P.yaw);let any=false;const hy=A.hyper;
 for(const e of G.foes){if(e.dead||!e.rig.root.visible||e.state==='dormant')continue;const dx=e.p.x-P.p.x,dz=e.p.z-P.p.z,d=Math.hypot(dx,dz)-e.D.r*.85;if(d>A.reach||Math.abs(e.p.y+(e.flying?0:0)-P.p.y)>2.2+e.D.h*.4)continue;
  const fw=(dx*f+dz*co)/Math.max(.01,Math.hypot(dx,dz));if(A.arc<6&&fw<Math.cos(A.arc/2)&&d>.5)continue;
  const dmg=Math.round(A.dmg*(.9+Math.random()*.2)*(c.heavy?1:1+P.combo*.04));G.damageFoe(e,dmg,{poise:A.poise,heavy:c.heavy,dir:new V(f,0,co),kind:'melee',A});any=true;}
 if(A.shock){const x=P.p.x+f*2.6,z=P.p.z+co*2.6;G.dust(x,P.p.y,z,14);G.decal({x,y:P.p.y,z,r:A.shock,mode:'wave',dur:.35,col:0xffb070});G.shake(.25,P.p);G.snd.play('slam',new V(x,P.p.y,z),.6);
  for(const e of G.foes){if(e.dead||!e.rig.root.visible||e.state==='dormant')continue;if(Math.hypot(e.p.x-x,e.p.z-z)<A.shock+e.D.r&&!(Math.hypot(e.p.x-P.p.x,e.p.z-P.p.z)-e.D.r<A.reach&&any))G.damageFoe(e,Math.round(A.dmg*.4),{poise:A.poise*.5,dir:new V(f,0,co),kind:'shock'});}}
 if(!any)G.snd.play('whoosh',P.p,.6);}

/* incoming damage: returns 'none' | 'dodge' | 'parry' | 'block' | 'guardbreak' | 'hit' */
export function hurtPlayer(G,dmg,src,mv={}){const P=G.P;if(P.dead||!G.run||G.run.end)return'none';
 if(rollInvuln(G)){G.dodged(src);return'dodge';}if(P.iframe>0)return'none';
 const from=mv.from||(src&&src.p)||P.p;const dx=from.x-P.p.x,dz=from.z-P.p.z,d=Math.hypot(dx,dz)||1;const frontal=(dx*Math.sin(P.yaw)+dz*Math.cos(P.yaw))/d>.3;
 // parry
 const a=P.act;if(a&&a.k==='parry'&&frontal&&mv.parry&&src&&src.state==='atk'&&a.t>=.04&&a.t<=.04+P.S.parry){P.stats.parries++;src.parried();G.parryFx(src);return'parry';}
 // guard
 if(P.block&&frontal&&!mv.ub){const cost=dmg*P.S.guardCost*(mv.kind==='proj'?.5:1)+(mv.poise||10)*.25;P.stats.blocks++;
  if(P.st-cost<=0){P.st=0;P.stDelay=1.2;P.block=false;P.act={k:'hurt',t:0,dur:1.05};G.guardBroken();takeDmg(G,Math.round(dmg*(1-P.S.absorb)+dmg*.15),src,mv,true);return'guardbreak';}
  useStam(P,cost);P.stDelay=.9;const left=Math.round(dmg*(1-P.S.absorb));G.blockFx(src,mv);if(left>0)takeDmg(G,left,src,mv,true);const k=(mv.knock||3)*.35;P.v.x-=dx/d*k;P.v.z-=dz/d*k;return'block';}
 takeDmg(G,dmg,src,mv,false);return'hit';}
function takeDmg(G,dmg,src,mv,chip){const P=G.P;P.hp-=dmg;P.stats.dmg+=dmg;P.stats.hits+=chip?0:1;G.hurtFx(dmg,chip);
 if(P.hp<=0){P.hp=0;G.playerDied();return;}if(chip)return;
 // poise / flinch
 P.poise+=mv.poise||15;P.poiseT=3;const hy=P.act&&P.act.k==='atk'&&P.act.A.hyper&&P.act.t<P.act.A.h1;const lim=P.S.poiseMax*(hy?2.2:1);
 if(P.poise>=lim||(mv.knock||0)>=7){P.poise=0;const from=mv.from||(src&&src.p)||P.p;const dx=P.p.x-from.x,dz=P.p.z-from.z,d=Math.hypot(dx,dz)||1;const k=mv.knock||4;P.v.x=dx/d*k;P.v.z=dz/d*k;
  if(!(P.act&&P.act.k==='crit'))P.act={k:'hurt',t:0,dur:k>=7?.85:.5};P.queue=null;P.block=false;P.iframe=k>=7?.6:.12;}}

/* ================= lock-on ================= */
export function toggleLock(G){const P=G.P;if(P.lock){P.lock=null;return;}P.lock=pickTarget(G,null,0);if(!P.lock)G.cam.recenter=.35;}
export function pickTarget(G,cur,dir){const P=G.P,cam=G.camera;const f=new V();cam.getWorldDirection(f);let best=null,bs=-1e9;const right=new V(f.z,0,-f.x).normalize();
 for(const e of G.foes){if(e.dead||!e.rig.root.visible||e.state==='dormant'||e===cur)continue;const d=e.p.distanceTo(P.p);if(d>24)continue;tv.set(e.p.x-cam.position.x,e.p.y+e.D.bodyY-cam.position.y,e.p.z-cam.position.z).normalize();const sc=tv.dot(f);if(sc<.45)continue;
  if(dir&&cur){const side=tv.dot(right)-tv2.set(cur.p.x-cam.position.x,cur.p.y-cam.position.y,cur.p.z-cam.position.z).normalize().dot(right);if(Math.sign(side)!==Math.sign(dir))continue;}
  if(!G.phys.clear(tv3.set(P.p.x,P.p.y+1.5,P.p.z),tv.set(e.p.x,e.p.y+e.D.bodyY,e.p.z),o=>o.tag==='wall'))continue;const s=sc*2-d*.05+(e.D.boss?.5:0);if(s>bs){bs=s;best=e;}}
 return best;}

/* ================= camera ================= */
export function makeCam(){return{yaw:0,pitch:.18,dist:4.6,pos:new V(),look:new V(),fov:60,shake:0,snap:true,recenter:0};}
export function updateCamera(G,dt){const P=G.P,C=G.cam,cam=G.camera;
 if(C.recenter>0){C.recenter-=dt;C.yaw+=angDiff(C.yaw,P.yaw)*Math.min(1,dt*10);C.pitch+=(.15-C.pitch)*Math.min(1,dt*6);}
 let tgtY=1.55;const L=P.lock;
 if(L){const a=Math.atan2(L.p.x-P.p.x,L.p.z-P.p.z);C.yaw+=angDiff(C.yaw,a)*Math.min(1,dt*6);const d=Math.hypot(L.p.x-P.p.x,L.p.z-P.p.z);const h=L.p.y+L.D.bodyY-P.p.y-1.5;
  const want=cl(.2+Math.atan2(-h*.5,d+3)*.6+(L.D.boss?-.02:0),-.05,.5);C.pitch+=(want-C.pitch)*Math.min(1,dt*3);}
 const big=L&&L.D.boss?L.D.h:0;const dist=(L?5.2+big*.25:4.6)*(G.indoor?.95:1);C.dist+=(dist-C.dist)*Math.min(1,dt*4);
 const tgt=tv.set(P.p.x,P.p.y+tgtY,P.p.z);const cp=Math.cos(C.pitch),sp=Math.sin(C.pitch);const dir=tv2.set(-Math.sin(C.yaw)*cp,sp,-Math.cos(C.yaw)*cp);
 // shoulder offset
 const sx=Math.cos(C.yaw)*-.45,sz=-Math.sin(C.yaw)*-.45;tgt.x+=sx;tgt.z+=sz;
 const filt=o=>o.tag!=='fog'&&o.tag!=='pew'&&o.tag!=='deb'&&o.tag!=='lever'&&o.tag!=='brazier'&&o.tag!=='shrine'&&o.tag!=='altar'&&o.tag!=='statue'&&o.tag!=='tomb';
 let d=C.dist;const tr=G.phys.ray(tgt.x,tgt.y,tgt.z,dir.x,dir.y,dir.z,d,filt);if(tr<d)d=Math.max(.7,tr-.3);
 const want=tv3.copy(tgt).addScaledVector(dir,d);const fl=G.phys.ground(want.x,want.y,want.z,.1,.2).h;if(want.y<fl+.3)want.y=fl+.3;
 if(C.snap){C.pos.copy(want);C.look.copy(tgt);C.snap=false;}else{C.pos.lerp(want,Math.min(1,dt*14));
  const look=L?tv.copy(tgt).lerp(tv2.set(L.p.x,L.p.y+L.D.bodyY*.8,L.p.z),.35):tgt;C.look.lerp(look,Math.min(1,dt*14));}
 cam.position.copy(C.pos);C.shake=Math.max(0,C.shake-dt*2.4);const s=C.shake*C.shake*.35;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.position.z+=(Math.random()-.5)*s;
 cam.lookAt(C.look);const fov=P.sprinting?64:60;C.fov+=(fov-C.fov)*Math.min(1,dt*4);cam.fov=C.fov;cam.updateProjectionMatrix();P.rig.root.visible=C.pos.distanceTo(tv.set(P.p.x,P.p.y+1.5,P.p.z))>.8||P.dead;}
