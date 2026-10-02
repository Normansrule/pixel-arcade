// WILD QUEST — enemies (Mossback grunts & archers, Rune Colossus, Ashen Warden), their AI, shockwaves and projectiles.
import * as THREE from '../vendor/three.module.min.js';
import {makeRig,animate,gearPoints} from './rig.js';
import {heightAt,waterAt} from './terrain.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a,cl=(v,a,b)=>v<a?a:v>b?b:v;
const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
export const KIND={grunt:{name:'MOSSBACK',hp:44,r:.55,speed:4.4,dmg:4,reach:2.4,headY:1.62,headR:.32,bodyY:.95,bodyR:.62,sight:24,score:80},
 archer:{name:'MOSSBACK ARCHER',hp:30,r:.45,speed:4.2,dmg:3,reach:2,headY:1.72,headR:.25,bodyY:1.1,bodyR:.48,sight:36,score:100},
 golem:{name:'RUNE COLOSSUS',hp:420,r:1.5,speed:3.1,dmg:8,reach:4.6,headY:4.55,headR:.45,bodyY:3.1,bodyR:1.45,sight:22,score:800},
 boss:{name:'THE ASHEN WARDEN',hp:1300,r:1.1,speed:4.6,dmg:6,reach:4.8,headY:4.0,headR:.4,bodyY:2.5,bodyR:1.15,sight:80,score:3000}};
const tv=new V(),tv2=new V(),ta=new V(),tb=new V();

export class Enemy{
 constructor(G,kind,x,z,o={}){this.G=G;this.kind=kind;this.K=KIND[kind];this.rig=makeRig(kind);G.scene.add(this.rig.root);
  this.p=new V(x,o.y??heightAt(x,z),z);this.v=new V();this.yaw=o.yaw??rnd(6.28);this.home=this.p.clone();this.tower=o.tower||null;this.camp=o.camp;
  this.hp=this.maxHp=Math.round(this.K.hp*G.dm.hp);this.state=kind==='golem'?'dormant':kind==='boss'?'intro':'idle';this.t=0;this.alert=0;this.aware=false;this.lostT=0;this.atkCd=1+rnd(1.5);this.hurtT=0;this.stun=0;this.dead=false;this.deadT=0;
  this.st={mode:'idle',speed:0,t:rnd(10),atk:null,hurt:0,aim:0,oneHand:true};this.wT=rnd(4);this.wTarget=null;this.losT=0;this.los=true;this.flash=0;this.hits=0;this.phase=1;this.token=false;this.combo=0;this.mk=null;
  this.rig.root.position.copy(this.p);if(kind==='boss'){this.rig.root.visible=false;}}
 get center(){return tv.set(this.p.x,this.p.y+this.K.bodyY,this.p.z);}
 face(x,z,dt,rate=6){const a=Math.atan2(x-this.p.x,z-this.p.z);this.yaw+=angDiff(this.yaw,a)*Math.min(1,dt*rate);}
 becomeAware(shout=true){if(this.aware||this.dead)return;this.aware=true;this.alert=1;this.lostT=0;this.state=this.kind==='golem'||this.kind==='boss'?this.state:'chase';this.G.snd.play('alert');this.alertFlash=1.2;
  if(shout&&this.camp!==undefined)for(const e of this.G.enemies)if(e!==this&&e.camp===this.camp&&!e.aware)this.G.after(.3+rnd(.5),()=>e.becomeAware(false));}
 update(dt){const G=this.G,P=G.P,K=this.K;this.t+=dt;this.st.t+=dt;this.hurtT=Math.max(0,this.hurtT-dt);this.atkCd-=dt;this.flash=Math.max(0,this.flash-dt*3);this.alertFlash=Math.max(0,(this.alertFlash||0)-dt);
  if(this.dead){this.deadT+=dt;this.st.mode='dead';this.st.dp=Math.min(1,this.deadT*1.6);this.st.atk=null;animate(this.rig,this.st,dt);this.place(dt);
   if(this.deadT>1.8&&!this.gone){this.gone=true;const c=this.center.clone();G.parts.burst(c,this.kind==='boss'?260:this.kind==='golem'?160:60,this.kind==='golem'?6:4,[new THREE.Color(.9,.25,1.6),new THREE.Color(1.6,.5,.15),new THREE.Color(.3,.1,.5)],.9,1.4,{up:true,grav:-2,drag:1.2,r:.5});G.smoke.burst(c,this.kind==='golem'?40:16,2,new THREE.Color(.12,.08,.14),2.4,1.6,{up:true,grav:-1.5,drag:1.5,r:.6});G.scene.remove(this.rig.root);}return;}
  const dx=P.p.x-this.p.x,dz=P.p.z-this.p.z,d=Math.hypot(dx,dz),dy=P.p.y-this.p.y;const pAvail=!P.dead&&!G.room;
  // line of sight (terrain only) refreshed a few times a second
  if((this.losT-=dt)<=0){this.losT=.35+rnd(.2);const e=this.center;e.y+=.6;tv2.set(P.p.x,P.p.y+1.4,P.p.z).sub(e);const L=tv2.length();tv2.divideScalar(L||1);this.los=L>80?false:G.phys.terrainRay(e.x,e.y,e.z,tv2.x,tv2.y,tv2.z,L,1.5)===Infinity;}
  const sleeping=this.kind==='grunt'&&!this.aware&&G.night>.55&&this.state==='idle';this.sleeping=sleeping;
  if(this.kind==='grunt'||this.kind==='archer'){
   if(!this.aware){const fwd=Math.sin(this.yaw)*dx+Math.cos(this.yaw)*dz;const range=K.sight*(sleeping?.22:1)*(G.night>.55?.65:1)*(P.crouch?.6:1);
    const seen=pAvail&&this.los&&d<range&&(fwd>d*.25||d<5)&&Math.abs(dy)<20;const loud=pAvail&&d<(P.sprinting?11:P.loud>0?14:0);
    if(seen||loud)this.alert+=dt*(1.8*(1-d/Math.max(range,1))+.35+(loud?1.2:0))*G.dm.aggr;else this.alert=Math.max(0,this.alert-dt*.3);if(this.alert>=1)this.becomeAware();}
   else{if(!pAvail||d>48){this.lostT+=dt;if(this.lostT>6){this.aware=false;this.alert=0;this.state='return';this.releaseToken();}}else this.lostT=0;}}
  this.stun=Math.max(0,this.stun-dt);
  ({grunt:this.grunt,archer:this.archer,golem:this.golem,boss:this.boss})[this.kind].call(this,dt,d,dx,dz);
  this.st.hurt=Math.max(0,this.hurtT*2.5);animate(this.rig,this.st,dt);this.place(dt);
  if(this.rig.eyes){this.rig.eyes.emissiveIntensity=this.aware?3.4:sleeping?.2:1.6;}}
 releaseToken(){if(this.token){this.token=false;this.G.tokens++;}}
 // ground-following movement with collision
 move(dt,vx,vz,acc=10){this.v.x+=(vx-this.v.x)*Math.min(1,dt*acc);this.v.z+=(vz-this.v.z)*Math.min(1,dt*acc);const G=this.G;
  const nx=this.p.x+this.v.x*dt,nz=this.p.z+this.v.z*dt;if(!this.tower){const wl=waterAt(nx,nz),gh=heightAt(nx,nz);if(wl-gh>.9){this.v.x*=-.3;this.v.z*=-.3;return;}}
  this.p.x=nx;this.p.z=nz;const h=G.phys.push(this.p,this.K.r,2,.6);if(h.o){const vn=this.v.x*h.nx+this.v.z*h.nz;if(vn<0){this.v.x-=vn*h.nx;this.v.z-=vn*h.nz;}}
  for(const o of G.enemies)if(o!==this&&!o.dead){const ex=this.p.x-o.p.x,ez=this.p.z-o.p.z,ed=Math.hypot(ex,ez),m=this.K.r+o.K.r;if(ed<m&&ed>1e-4){this.p.x+=ex/ed*(m-ed)*.5;this.p.z+=ez/ed*(m-ed)*.5;}}
  const g=G.phys.ground(this.p.x,this.p.y+.3,this.p.z,this.K.r*.5,.9);if(this.p.y>g.h+.05){this.v.y-=24*dt;this.p.y+=this.v.y*dt;if(this.p.y<=g.h){this.p.y=g.h;this.v.y=0;}}else{this.p.y+=(g.h-this.p.y)*Math.min(1,dt*20);this.v.y=0;}}
 place(dt){const r=this.rig.root;r.position.copy(this.p);r.rotation.y=this.yaw;if(this.spin)r.rotation.y+=this.spin;}
 /* ---------- Mossback grunt ---------- */
 grunt(dt,d,dx,dz){const G=this.G,P=G.P,K=this.K,st=this.st;st.atk=null;let mv=0;
  if(this.state==='stagger'||this.state==='down'){this.move(dt,0,0,4);st.mode=this.state==='down'?'dead':'move';st.dp=Math.min(1,this.t*3);if(this.t>(this.state==='down'?1.7:.45)){this.state='chase';this.t=0;}return;}
  if(!this.aware){this.releaseToken();
   if(this.state==='return'){tv.subVectors(this.home,this.p).setY(0);if(tv.length()<1.5){this.state='idle';}else{tv.normalize();this.move(dt,tv.x*2,tv.z*2);this.face(this.home.x,this.home.z,dt);st.mode='move';st.speed=2;return;}}
   const camp=this.camp!==undefined?G.camps[this.camp]:null;
   if(this.sleeping){st.mode='sleep';this.move(dt,0,0);return;}
   if(this.alert>.05){this.face(P.p.x,P.p.z,dt,2);st.mode='idle';st.speed=0;this.move(dt,0,0);this.st.look=-.2;return;}
   this.wT-=dt;if(this.wT<=0){this.wT=4+rnd(6);const r=rnd();if(r<.45&&camp){this.wTarget=null;this.sitAt=true;}else{this.sitAt=false;const a=rnd(6.28),rr=3+rnd(6);this.wTarget=new V(this.home.x+Math.cos(a)*rr,0,this.home.z+Math.sin(a)*rr);}}
   if(this.sitAt&&camp){const a=Math.atan2(this.home.x-camp.x,this.home.z-camp.z);tv.set(camp.x+Math.sin(a)*2.6,0,camp.z+Math.cos(a)*2.6);const td=Math.hypot(tv.x-this.p.x,tv.z-this.p.z);if(td>.6){tv.sub(this.p).setY(0).normalize();this.move(dt,tv.x*1.6,tv.z*1.6);this.face(this.p.x+tv.x,this.p.z+tv.z,dt,4);st.mode='move';st.speed=1.6;}else{this.move(dt,0,0);this.face(camp.x,camp.z,dt,3);st.mode='sit';}return;}
   if(this.wTarget){tv.set(this.wTarget.x-this.p.x,0,this.wTarget.z-this.p.z);if(tv.length()>.8){tv.normalize();this.move(dt,tv.x*1.5,tv.z*1.5);this.face(this.wTarget.x,this.wTarget.z,dt,4);st.mode='move';st.speed=1.5;return;}}
   this.move(dt,0,0);st.mode='idle';st.speed=0;return;}
  // combat
  if(this.state==='chase'||this.state==='idle'||this.state==='return'){this.state='chase';this.face(P.p.x,P.p.z,dt,8);
   if(d>2.2){const s=K.speed*(d>7?1:.75)*G.dm.aggr;mv=s;this.move(dt,dx/d*s,dz/d*s);}else{const sx=-dz/d,sz=dx/d,side=Math.sin(this.t*.7+this.camp)>0?1:-1;this.move(dt,sx*side*1.4-dx/d*.4,sz*side*1.4-dz/d*.4);mv=1.4;}
   if(d<K.reach+.3&&this.atkCd<=0&&!P.dead&&(this.token||G.tokens>0)){if(!this.token){this.token=true;G.tokens--;}this.state='windup';this.t=0;G.snd.play('grunt');}
   st.mode='move';st.speed=mv;return;}
  if(this.state==='windup'){const dur=.62/G.dm.aggr;this.face(P.p.x,P.p.z,dt,5);this.move(dt,0,0);st.mode='idle';st.atk={name:'smash',p:Math.min(.3,this.t/dur*.3)};this.flash=.6;if(this.t>dur){this.state='strike';this.t=0;this.hitDone=false;}return;}
  if(this.state==='strike'){const f=Math.sin(this.yaw),c=Math.cos(this.yaw);this.move(dt,f*(this.t<.15?4:0),c*(this.t<.15?4:0),12);st.mode='idle';st.atk={name:'smash',p:.3+Math.min(.7,this.t/.25*.7)};
   if(!this.hitDone&&this.t>.09){this.hitDone=true;const fw=(dx*f+dz*c)/Math.max(d,.01);if(d<K.reach+.5&&fw>.4&&Math.abs(P.p.y-this.p.y)<1.8)G.hurtPlayer(Math.round(K.dmg*G.dm.dmg),this,'melee');G.shake(.12,this.p);}
   if(this.t>.32){this.state='recover';this.t=0;}return;}
  if(this.state==='recover'){this.move(dt,0,0);st.mode='idle';st.atk={name:'smash',p:1};if(this.t>.7){this.releaseToken();this.atkCd=(1.5+rnd(1.8))/G.dm.aggr;this.state='chase';this.t=0;}return;}}
 /* ---------- Mossback archer ---------- */
 archer(dt,d,dx,dz){const G=this.G,P=G.P,K=this.K,st=this.st;st.atk=null;st.aim=0;
  if(this.state==='stagger'||this.state==='down'){this.move(dt,0,0,4);st.mode=this.state==='down'?'dead':'move';st.dp=Math.min(1,this.t*3);if(this.t>(this.state==='down'?1.6:.45)){this.state='chase';this.t=0;}return;}
  if(!this.aware){if(this.tower){this.move(dt,0,0);this.yaw+=Math.sin(this.t*.4)*dt*.6;st.mode='idle';return;}
   if(this.state==='return'){tv.subVectors(this.home,this.p).setY(0);if(tv.length()<1.5)this.state='idle';else{tv.normalize();this.move(dt,tv.x*2,tv.z*2);this.face(this.home.x,this.home.z,dt);st.mode='move';st.speed=2;return;}}
   this.move(dt,0,0);st.mode='idle';if(this.alert>.05)this.face(P.p.x,P.p.z,dt,2);return;}
  this.face(P.p.x,P.p.z,dt,7);
  if(this.state==='draw'){this.move(dt,0,0);st.mode='idle';st.aim=Math.min(1,this.t/1.1);st.pitch=-Math.atan2(P.p.y-this.p.y,d)*.8;
   if(this.t>1.25/G.dm.aggr){this.state='chase';this.t=0;this.atkCd=(1.6+rnd(1.4))/G.dm.aggr;
    // lead the target, compensate gravity
    const src=this.center.clone();src.y+=.55;const sp=34;const tt=d/sp;tv.set(P.p.x+P.v.x*tt*.7,P.p.y+1.2,P.p.z+P.v.z*tt*.7).sub(src);const L=tv.length();tv.normalize().multiplyScalar(sp);tv.y+=6*L/sp*.5;
    G.proj.spawn('arrow',src,tv,'enemy',Math.round(K.dmg*G.dm.dmg),this);G.snd.play('shoot');}return;}
  if(d<3&&!this.tower){if(this.atkCd<=0){this.state='windup2';}const s=-3.5;this.move(dt,dx/d*s,dz/d*s);st.mode='move';st.speed=3.5;
   if(this.state==='windup2'&&this.t>.4){this.state='chase';this.atkCd=1.4;if(d<2.4)G.hurtPlayer(2,this,'melee');}return;}
  let mv=0;if(!this.tower){if(d>20){mv=K.speed;this.move(dt,dx/d*mv,dz/d*mv);}else if(d<8){mv=3;this.move(dt,-dx/d*mv,-dz/d*mv);}else{const sx=-dz/d,sz=dx/d;mv=1.5;this.move(dt,sx*Math.sin(this.t*.5)*mv,sz*Math.sin(this.t*.5)*mv);}}else this.move(dt,0,0);
  st.mode='move';st.speed=mv;if(this.atkCd<=0&&d<K.sight*1.3&&this.los&&!P.dead){this.state='draw';this.t=0;G.snd.play('draw');}}
 /* ---------- Rune Colossus (mini-boss) ---------- */
 golem(dt,d,dx,dz){const G=this.G,P=G.P,K=this.K,st=this.st;st.atk=null;st.oneHand=false;const rr=this.rig;
  if(this.state==='dormant'){st.mode='sit';this.move(dt,0,0);rr.glow.forEach(m=>m.emissiveIntensity=.3+Math.sin(this.t*1.5)*.15);if(d<17&&!P.dead&&!G.room){this.state='waking';this.t=0;G.snd.play('roar');G.bossIntro(this);G.shake(.5,this.p);}return;}
  if(this.state==='waking'){st.mode='idle';this.move(dt,0,0);this.face(P.p.x,P.p.z,dt,2);rr.glow.forEach(m=>m.emissiveIntensity=.3+this.t*1.4);if(this.t>2.2){this.state='chase';this.t=0;this.aware=true;this.atkCd=.8;}return;}
  rr.glow.forEach(m=>m.emissiveIntensity=this.stun>0?.4+Math.sin(this.t*20)*.3:3);
  if(this.hp<this.maxHp*.5&&this.phase===1){this.phase=2;G.snd.play('roar');G.toast('The Colossus is enraged!','');}
  const fast=this.phase===2?1.25:1;
  if(this.state==='stunned'){st.mode='sit';this.move(dt,0,0,3);if(this.t>3.2){this.state='chase';this.t=0;this.atkCd=.6;}return;}
  if(P.dead||G.room||d>60){this.move(dt,0,0);st.mode='idle';return;}
  if(this.state==='chase'){this.face(P.p.x,P.p.z,dt,3*fast);let mv=0;if(d>3.6){mv=K.speed*fast;this.move(dt,dx/d*mv,dz/d*mv,4);}else this.move(dt,0,0,4);st.mode='move';st.speed=mv*.8;
   if(this.atkCd<=0){const r=rnd();this.atk=d<5.2?(r<.5?'slam':'swipe'):(this.phase===2&&r<.4?'throw':d<16&&r<.75?'charge':'slam');this.state='windup';this.t=0;G.snd.play('grunt');}return;}
  const a=this.atk;const f=Math.sin(this.yaw),c=Math.cos(this.yaw);
  if(this.state==='windup'){const dur=(a==='charge'?.8:a==='throw'?.9:.95)/fast;this.face(P.p.x,P.p.z,dt,4);this.move(dt,0,0,6);st.mode='idle';st.atk={name:a==='swipe'?'sweep':'slam2',p:Math.min(.3,this.t/dur*.3)};if(a==='charge'){st.mode='move';st.speed=0;}this.flash=.8;
   if(this.t>dur){this.state='strike';this.t=0;this.hitDone=false;if(a==='throw'){const src=tv.set(this.p.x,this.p.y+5,this.p.z).clone();const sp=22,tt=d/sp;tv2.set(P.p.x+P.v.x*tt,P.p.y+1,P.p.z+P.v.z*tt).sub(src);const L=tv2.length();tv2.normalize().multiplyScalar(sp);tv2.y+=14*L/sp*.5;G.proj.spawn('rock',src,tv2,'enemy',6,this);}}return;}
  if(this.state==='strike'){if(a==='charge'){this.move(dt,f*13*fast,c*13*fast,8);st.mode='move';st.speed=9;if(!this.hitDone&&d<K.r+1.4){this.hitDone=true;G.hurtPlayer(Math.round(K.dmg*G.dm.dmg),this,'melee',{knock:14});}if(this.t>1.15){this.state='recover';this.t=0;}return;}
   st.atk={name:a==='swipe'?'sweep':'slam2',p:.3+Math.min(.7,this.t/.3*.7)};this.move(dt,0,0);st.mode='idle';
   if(!this.hitDone&&this.t>.15){this.hitDone=true;if(a==='slam'){const hx=this.p.x+f*3,hz=this.p.z+c*3;G.wave(hx,this.p.y,hz,{speed:11,max:13,dmg:Math.round(6*G.dm.dmg),col:new THREE.Color(.6,1.6,2)});G.shake(.6,this.p);G.snd.play('slam');G.dust(hx,this.p.y,hz,40);
     if(Math.hypot(P.p.x-hx,P.p.z-hz)<3)G.hurtPlayer(Math.round(K.dmg*G.dm.dmg),this,'melee',{knock:10});}
    else if(a==='swipe'){const fw=(dx*f+dz*c)/Math.max(d,.01);if(d<K.reach+1&&fw>-.1)G.hurtPlayer(Math.round(6*G.dm.dmg),this,'melee',{knock:12});G.snd.play('swing');}}
   if(this.t>.5){this.state='recover';this.t=0;}return;}
  if(this.state==='recover'){this.move(dt,0,0,5);st.mode='idle';st.atk=a==='charge'||a==='throw'?null:{name:a==='swipe'?'sweep':'slam2',p:1};if(this.t>1.3/fast){this.state='chase';this.t=0;this.atkCd=(1.6+rnd(1.4))/fast/G.dm.aggr;}return;}}
 /* ---------- The Ashen Warden (final boss) ---------- */
 boss(dt,d,dx,dz){const G=this.G,P=G.P,K=this.K,st=this.st;st.atk=null;st.oneHand=false;const rr=this.rig;
  if(this.state==='intro'){this.rig.root.visible=false;const ar=G.castle.arena;if(G.castle.opened&&!P.dead&&Math.hypot(P.p.x-ar.x,P.p.z-ar.z)<ar.r-2&&P.p.y>G.castle.h-1){this.state='rise';this.t=0;this.rig.root.visible=true;G.bossIntro(this);if(G.onArena)G.onArena();G.snd.play('roar');G.shake(.8,this.p);G.parts.burst(tv.set(this.p.x,this.p.y+1,this.p.z),200,14,[new THREE.Color(2.6,.8,.15),new THREE.Color(1.4,.3,.1)],1,1.6,{up:true,grav:-3,drag:1,r:1.2});}return;}
  if(this.state==='rise'){st.mode='idle';this.move(dt,0,0);this.face(P.p.x,P.p.z,dt,2);this.rig.root.scale.setScalar(Math.min(1,.3+this.t*.5));if(this.t>2.2){this.rig.root.scale.setScalar(1);this.state='chase';this.t=0;this.aware=true;this.atkCd=.6;}return;}
  const ph=this.hp>this.maxHp*.66?1:this.hp>this.maxHp*.33?2:3;if(ph!==this.phase){this.phase=ph;G.snd.play('roar');G.banner(ph===2?'THE WARDEN BURNS':'ASHFALL','The Warden grows desperate','#ff5a1a',2.2);G.shake(.6,this.p);}
  const fast=[1,1,1.12,1.25][ph];if(Math.random()<dt*(4+ph*6))G.parts.emit(this.p.x+rnd(2)-1,this.p.y+rnd(3.5),this.p.z+rnd(2)-1,rnd(1)-.5,1+rnd(2),rnd(1)-.5,2.4,.7,.12,.35,1.4,-1,.5);
  if(this.state==='stunned'){st.mode='sit';this.move(dt,0,0,3);rr.glow.forEach(m=>m.emissiveIntensity=.6+Math.sin(this.t*18)*.4);if(this.t>3.4){this.state='chase';this.t=0;this.atkCd=.5;}return;}
  rr.glow.forEach(m=>m.emissiveIntensity=2.6+ph*.4);
  if(P.dead){this.move(dt,0,0);st.mode='idle';return;}
  // keep inside the arena
  const ar=G.castle.arena;
  if(this.state==='chase'){this.face(P.p.x,P.p.z,dt,4*fast);let mv=0;if(d>4){mv=K.speed*fast;this.move(dt,dx/d*mv,dz/d*mv,5);}else{const sx=-dz/d,sz=dx/d;this.move(dt,sx*1.5,sz*1.5,5);mv=1.5;}st.mode='move';st.speed=mv;
   if(this.atkCd<=0){const r=rnd();const opts=['sweep','thrust','smash'];if(ph>=2)opts.push('firewave','leap');if(ph>=3)opts.push('orbs','orbs');let a=opts[(r*opts.length)|0];if(d>9&&(a==='sweep'||a==='smash'))a=ph>=2?'leap':'thrust';if(d<4&&a==='thrust')a='sweep';this.atk=a;this.state='windup';this.t=0;this.combo=0;G.snd.play('grunt');}return;}
  const a=this.atk,f=Math.sin(this.yaw),c=Math.cos(this.yaw);
  const MV={sweep:'sweep',thrust:'thrust',smash:'slam2',firewave:'slam2',leap:'slam2',orbs:'slam2'}[a];
  if(this.state==='windup'){const dur={sweep:.8,thrust:.75,smash:.9,firewave:1.1,leap:.7,orbs:1.0}[a]/fast;this.face(P.p.x,P.p.z,dt,a==='thrust'?6:4);this.move(dt,0,0,6);st.mode='idle';st.atk={name:MV,p:Math.min(.3,this.t/dur*.3)};this.flash=.8;
   if(a==='leap'&&this.t>dur){this.leapFrom=this.p.clone();this.leapTo=new V(P.p.x,P.p.y,P.p.z);const L=this.leapTo.distanceTo(this.leapFrom);if(L>14)this.leapTo.lerpVectors(this.leapFrom,this.leapTo,14/L);}
   if(this.t>dur){this.state='strike';this.t=0;this.hitDone=false;if(a==='orbs'){for(let i=0;i<3;i++){const src=new V(this.p.x+f*1.2+(i-1)*1.4,this.p.y+4.2,this.p.z+c*1.2);tv2.set(P.p.x-src.x,P.p.y+1.2-src.y,P.p.z-src.z).normalize().multiplyScalar(11+i*1.5);G.proj.spawn('orb',src,tv2,'enemy',Math.round(4*G.dm.dmg),this);}G.snd.play('fire');}}return;}
  if(this.state==='strike'){
   if(a==='leap'){const k=Math.min(1,this.t/.75);this.p.lerpVectors(this.leapFrom,this.leapTo,k);this.p.y=this.leapTo.y+Math.sin(k*Math.PI)*7;st.mode='air';st.vy=k<.5?1:-1;st.atk={name:'slam2',p:.3+k*.7};
    if(k>=1&&!this.hitDone){this.hitDone=true;G.wave(this.p.x,this.p.y,this.p.z,{speed:13,max:16,dmg:Math.round(4*G.dm.dmg),col:new THREE.Color(2.6,.7,.12)});G.shake(.8,this.p);G.snd.play('slam');G.dust(this.p.x,this.p.y,this.p.z,50);if(d<3.4)G.hurtPlayer(Math.round(8*G.dm.dmg),this,'melee',{knock:14});}
    if(this.t>1.1){this.state='recover';this.t=0;}return;}
   const lunge=a==='thrust'?(this.t<.22?17:0):a==='sweep'?(this.t<.15?5:0):0;this.move(dt,f*lunge,c*lunge,14);st.mode='idle';st.atk={name:MV,p:.3+Math.min(.7,this.t/.28*.7)};
   if(!this.hitDone&&this.t>(a==='thrust'?.14:.12)){this.hitDone=true;const fw=(dx*f+dz*c)/Math.max(d,.01);
    if(a==='sweep'){if(d<K.reach+.6&&fw>-.2)G.hurtPlayer(Math.round(K.dmg*G.dm.dmg),this,'melee',{knock:11});G.snd.play('swing');}
    else if(a==='thrust'){if(d<K.reach+1.2&&fw>.55)G.hurtPlayer(Math.round(K.dmg*G.dm.dmg),this,'melee',{knock:13});G.snd.play('swing');}
    else if(a==='smash'){const hx=this.p.x+f*3.4,hz=this.p.z+c*3.4;G.wave(hx,this.p.y,hz,{speed:12,max:10,dmg:Math.round(4*G.dm.dmg),col:new THREE.Color(2.6,.7,.12)});G.shake(.5,this.p);G.snd.play('slam');if(Math.hypot(P.p.x-hx,P.p.z-hz)<2.8)G.hurtPlayer(Math.round(8*G.dm.dmg),this,'melee',{knock:12});}
    else if(a==='firewave'){for(let i=0;i<2;i++)G.after(i*.7,()=>{if(!this.dead)G.wave(this.p.x,this.p.y,this.p.z,{speed:10,max:24,dmg:Math.round(4*G.dm.dmg),col:new THREE.Color(3,.9,.15),fire:true});});G.shake(.5,this.p);G.snd.play('fire');}}
   if(a==='sweep'&&this.t>.45&&this.combo<(ph>=2?2:1)&&d<7){this.combo++;this.t=0;this.hitDone=false;this.face(P.p.x,P.p.z,1,1);return;}
   if(this.t>(a==='firewave'?1.4:.6)){this.state='recover';this.t=0;}return;}
  if(this.state==='recover'){this.move(dt,0,0,5);st.mode='idle';st.atk=a==='orbs'||a==='leap'?null:{name:MV,p:1};if(this.t>1.05/fast){this.state='chase';this.t=0;this.atkCd=(.9+rnd(1.2))/fast/G.dm.aggr;}
   // never leave the arena
   const ex=this.p.x-ar.x,ez=this.p.z-ar.z,ed=Math.hypot(ex,ez);if(ed>ar.r-2){this.p.x=ar.x+ex/ed*(ar.r-2);this.p.z=ar.z+ez/ed*(ar.r-2);}return;}}
}

/* ---------------- projectiles ---------------- */
export class Projectiles{
 constructor(G){this.G=G;this.list=[];const wood=new THREE.MeshStandardMaterial({color:0x8a6a40,roughness:.8}),tip=new THREE.MeshStandardMaterial({color:0xb8c0c8,metalness:.8,roughness:.3}),fl=new THREE.MeshStandardMaterial({color:0xf0e8d8,roughness:.9,side:THREE.DoubleSide});
  this.arrowGeo=[new THREE.CylinderGeometry(.012,.012,.8,5).rotateX(Math.PI/2),new THREE.ConeGeometry(.03,.09,5).rotateX(Math.PI/2).translate(0,0,.44),new THREE.PlaneGeometry(.06,.14).rotateX(Math.PI/2).rotateZ(Math.PI/2).translate(0,0,-.34),new THREE.PlaneGeometry(.06,.14).rotateX(Math.PI/2).translate(0,0,-.34)];this.arrowMat=[wood,tip,fl,fl];
  this.rockGeo=new THREE.DodecahedronGeometry(.7,0);this.rockMat=new THREE.MeshStandardMaterial({color:0x6c6a62,roughness:.9,flatShading:true});
  this.orbGeo=new THREE.SphereGeometry(.45,16,12);this.orbMat=new THREE.MeshStandardMaterial({color:0x000000,emissive:0xff6a1a,emissiveIntensity:4});this.orbMatR=new THREE.MeshStandardMaterial({color:0x000000,emissive:0x40f0ff,emissiveIntensity:4});}
 mesh(kind){let g;if(kind==='arrow'){g=new THREE.Group();this.arrowGeo.forEach((geo,i)=>g.add(new THREE.Mesh(geo,this.arrowMat[i])));}else if(kind==='rock'){g=new THREE.Mesh(this.rockGeo,this.rockMat);g.castShadow=true;}else g=new THREE.Mesh(this.orbGeo,this.orbMat);this.G.scene.add(g);return g;}
 spawn(kind,p,v,owner,dmg,from){const m=this.mesh(kind);const o={kind,p:p.clone(),v:v.clone(),owner,dmg,from,m,life:kind==='arrow'?6:8,stuck:0,grav:kind==='arrow'?(owner==='player'?5:6):kind==='rock'?14:0};m.position.copy(o.p);this.orient(o);this.list.push(o);return o;}
 orient(o){if(o.kind==='arrow'){tv.copy(o.p).add(o.v);o.m.lookAt(tv);}else if(o.kind==='rock'){o.m.rotation.x+=.1;o.m.rotation.y+=.07;}}
 kill(o){this.G.scene.remove(o.m);o.dead=true;}
 clear(){for(const o of this.list)this.G.scene.remove(o.m);this.list.length=0;}
 update(dt){const G=this.G,P=G.P;for(const o of this.list){if(o.dead)continue;o.life-=dt;if(o.life<=0){this.kill(o);continue;}if(o.stuck){if(o.stuckTo&&!o.stuckTo.dead){o.m.position.copy(o.stuckTo.p).add(o.off);}continue;}
   if(o.kind==='orb'&&o.owner==='enemy'){tv.set(P.p.x,P.p.y+1.2,P.p.z).sub(o.p).normalize().multiplyScalar(o.v.length());o.v.lerp(tv,Math.min(1,dt*.9));if(Math.random()<.7)G.parts.emit(o.p.x,o.p.y,o.p.z,rnd(1)-.5,rnd(1)-.5,rnd(1)-.5,2.6,.8,.15,.5,.5);}
   if(o.kind==='orb'&&o.owner==='player'&&Math.random()<.7)G.parts.emit(o.p.x,o.p.y,o.p.z,0,0,0,.3,1.6,2.4,.5,.5);
   const steps=Math.max(1,Math.ceil(o.v.length()*dt/1.2));const sd=dt/steps;
   for(let s=0;s<steps&&!o.dead&&!o.stuck;s++){ta.copy(o.p);o.v.y-=o.grav*sd;o.p.addScaledVector(o.v,sd);tb.copy(o.p);this.collide(o,ta,tb,sd);}
   if(!o.dead){o.m.position.copy(o.p);this.orient(o);}}
  this.list=this.list.filter(o=>!o.dead);}
 collide(o,a,b,dt){const G=this.G,P=G.P;const dir=tv2.subVectors(b,a);const L=dir.length();if(L<1e-6)return;dir.divideScalar(L);
  // creatures
  if(o.owner==='player'){for(const e of G.enemies){if(e.dead||(e.kind==='boss'&&e.state==='intro'))continue;const K=e.K;
    const hc=tv.set(e.p.x,e.p.y+K.headY,e.p.z);if(segSphere(a,b,hc,K.headR+.08)){G.damageEnemy(e,o.kind==='orb'?40:o.dmg*2,{dir,kind:o.kind==='orb'?'orb':'arrow',head:true,at:hc.clone()});this.hitFx(o,b);this.stick(o,e);return;}
    const bc=tv.set(e.p.x,e.p.y+K.bodyY,e.p.z);if(segSphere(a,b,bc,K.bodyR)){G.damageEnemy(e,o.kind==='orb'?40:o.dmg,{dir,kind:o.kind==='orb'?'orb':'arrow',at:b.clone()});this.hitFx(o,b);this.stick(o,e);return;}}
   if(G.room&&G.room.hit&&G.room.hit(b,'arrow',dir)){this.hitFx(o,b);this.kill(o);return;}}
  else if(!P.dead&&!G.room){const px=P.p.x,pz=P.p.z;// capsule vs segment (sampled)
   for(let k=0;k<=3;k++){const q=tv.lerpVectors(a,b,k/3);if(Math.hypot(q.x-px,q.z-pz)<.5+(o.kind==='rock'?.5:0)&&q.y>P.p.y-.2&&q.y<P.p.y+1.9){const r=G.hurtPlayer(o.dmg,o.from,o.kind==='orb'?'orb':o.kind==='rock'?'rock':'arrow',{from:a});
     if(r==='parry'&&o.from&&!o.from.dead){o.owner='player';const t=o.from.center.clone();t.y+=.4;o.v.copy(t.sub(o.p)).normalize().multiplyScalar(o.kind==='orb'?26:40);o.grav=0;if(o.kind==='orb')o.m.material=this.orbMatR;o.life=4;G.snd.play('parry');return;}
     this.hitFx(o,q);this.kill(o);return;}}}
  // world
  const hy=G.phys.terrainOn(b.x,b.z)?heightAt(b.x,b.z):-1e9;if(b.y<hy){this.hitFx(o,b);if(o.kind==='arrow'){o.p.y=hy+.05;this.stick(o,null);}else this.kill(o);return;}
  const wl=waterAt(b.x,b.z);if(G.phys.terrainOn(b.x,b.z)&&b.y<wl&&a.y>=wl){G.splash(b.x,wl,b.z,6);this.kill(o);return;}
  const t=G.phys.ray(a.x,a.y,a.z,dir.x,dir.y,dir.z,L);if(t<Infinity){o.p.copy(a).addScaledVector(dir,t);if(G.room&&G.room.hit&&o.owner==='player')G.room.hit(o.p,'arrow',dir);this.hitFx(o,o.p);if(o.kind==='arrow')this.stick(o,null);else this.kill(o);}}
 stick(o,e){if(o.kind!=='arrow'){this.kill(o);return;}o.stuck=1;o.life=e?2:5;o.stuckTo=e;if(e){o.off=o.p.clone().sub(e.p);}this.G.snd.play('arrowhit');}
 hitFx(o,p){const G=this.G;if(o.kind==='arrow')G.sparks.burst(p,10,5,new THREE.Color(1.6,1.3,.8),.18,.35,{grav:9});else if(o.kind==='rock'){G.dust(p.x,p.y,p.z,20);G.snd.play('thud');G.shake(.3,p);if(this.G.P.p.distanceTo(p)<3&&o.owner==='enemy')G.hurtPlayer(o.dmg,o.from,'rock');}else{G.parts.burst(p,60,8,[new THREE.Color(2.6,.8,.15),new THREE.Color(1.6,.4,.1)],.7,.7,{drag:2});G.snd.play('fire');}}}
function segSphere(a,b,c,r){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=dx*dx+dy*dy+dz*dz;let t=l>0?((c.x-a.x)*dx+(c.y-a.y)*dy+(c.z-a.z)*dz)/l:0;t=cl(t,0,1);const x=a.x+dx*t-c.x,y=a.y+dy*t-c.y,z=a.z+dz*t-c.z;return x*x+y*y+z*z<r*r;}

/* ---------------- shockwaves / fire rings ---------------- */
export class Waves{constructor(G){this.G=G;this.list=[];this.geo=new THREE.RingGeometry(.92,1,64,1).rotateX(-Math.PI/2);}
 spawn(x,y,z,o){const m=new THREE.Mesh(this.geo,new THREE.MeshBasicMaterial({color:o.col||new THREE.Color(2,1,.3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));m.position.set(x,y+.25,z);this.G.scene.add(m);this.list.push({x,y,z,r:.5,m,hit:false,...o});}
 update(dt){const G=this.G,P=G.P;for(const w of this.list){w.r+=w.speed*dt;const k=w.r/w.max;w.m.scale.setScalar(w.r);w.m.material.opacity=1-k;w.m.position.y=heightAt(w.x,w.z)>w.y-2?w.y+.25:w.y+.25;
   if(w.fire){for(let i=0;i<6;i++){const a=rnd(6.28);G.parts.emit(w.x+Math.cos(a)*w.r,w.y+.2,w.z+Math.sin(a)*w.r,0,2+rnd(2),0,2.6,.8,.15,.6,.45,-1,.5);}}
   else if(Math.random()<.5){const a=rnd(6.28);G.smoke.emit(w.x+Math.cos(a)*w.r,w.y+.3,w.z+Math.sin(a)*w.r,0,1,0,.45,.42,.38,1.2,.6,0,1);}
   if(!w.hit&&!P.dead&&!G.room){const d=Math.hypot(P.p.x-w.x,P.p.z-w.z);const air=P.p.y-w.y;if(Math.abs(d-w.r)<.9&&air<.7&&air>-1.5){w.hit=true;G.hurtPlayer(w.dmg,null,'wave',{from:new V(w.x,w.y,w.z),knock:8});}}
   if(k>=1){G.scene.remove(w.m);w.m.material.dispose();w.dead=true;}}
  this.list=this.list.filter(w=>!w.dead);}
 clear(){for(const w of this.list){this.G.scene.remove(w.m);}this.list.length=0;}}
