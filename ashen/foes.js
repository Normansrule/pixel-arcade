// ASHEN VIGIL — foes: hollow shield knights, ash hounds, gaunt archers and the four great foes (Vargul the Bellwarden,
// Griska Mother of Hounds, Seraphel the Cinder Cantor, Ordhal the Ashen King). Data-driven movesets with readable windups,
// phase changes, posture, plus projectiles and area hazards with ground telegraphs.
import * as THREE from '../vendor/three.module.min.js';
import {makeRig,makeHound,animate,animateHound,gearPoints} from './rig.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a,cl=(v,a,b)=>v<a?a:v>b?b:v,ease=t=>t<0?0:t>1?1:t*t*(3-2*t);
const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
const tv=new V(),tv2=new V(),ta=new V(),tb=new V();
const C=(r,g,b)=>new THREE.Color(r,g,b);
const EMBER=[C(2.6,.9,.2),C(2.2,.5,.1),C(1.8,1.2,.4)],GOLD=[C(2.4,1.9,1),C(1.8,1.3,.6)];

/* move fields: anim, w (windup), a (active), r (recovery), dmg, reach, arc (total, radians), lunge (m/s during active), parry, ub (unblockable),
   poise (hits on the player's poise), knock, next [[move,chance]], fx: special behaviour, min/max (distance band to pick it) */
const M={
 // hollow knight
 k_slash:{anim:'slash1',w:.6,a:.22,r:.65,dmg:18,reach:2.4,arc:1.6,lunge:3,parry:1,poise:22,max:2.8,next:[['k_slash2',.45]]},
 k_slash2:{anim:'slash2',w:.38,a:.22,r:.7,dmg:18,reach:2.4,arc:1.6,lunge:3,parry:1,poise:22},
 k_thrust:{anim:'thrust',w:.75,a:.22,r:.8,dmg:22,reach:3.1,arc:.6,lunge:7,parry:1,poise:25,min:2,max:4.5},
 k_bash:{anim:'bash',w:.45,a:.16,r:.55,dmg:10,reach:1.9,arc:1.2,lunge:4,parry:0,poise:45,max:2.2,knock:4},
 // ash hound
 h_bite:{anim:'bite',w:.42,a:.16,r:.55,dmg:12,reach:1.8,arc:1.2,lunge:5,parry:1,poise:12,max:2.4,next:[['h_bite',.35]]},
 h_pounce:{anim:'pounce',w:.55,a:.5,r:.6,dmg:16,reach:1.9,arc:1.4,lunge:12,parry:1,poise:22,min:3,max:7.5},
 // gaunt archer
 a_shot:{anim:'bow',w:1.1,a:.12,r:.55,dmg:14,reach:30,arc:.3,fx:'arrow',min:4,max:28,parry:0},
 a_stab:{anim:'slash1',w:.5,a:.2,r:.6,dmg:10,reach:1.9,arc:1.4,lunge:3,parry:1,poise:12,max:2.2},
 // Vargul, the Bellwarden
 b_oh:{anim:'slam2',w:1.05,a:.25,r:1.1,dmg:40,reach:4.6,arc:.7,lunge:4,parry:0,poise:70,knock:7,fx:'shock',shockR:2.8,max:5.5},
 b_sweep:{anim:'gsweepR',w:.75,a:.3,r:.85,dmg:32,reach:4.6,arc:2.6,lunge:3,parry:1,poise:55,knock:5,max:5.2,next:[['b_sweep2',.55]]},
 b_sweep2:{anim:'gsweepL',w:.42,a:.3,r:.9,dmg:30,reach:4.6,arc:2.6,lunge:3,parry:1,poise:55,knock:5,next:[['b_oh',.5]]},
 b_charge:{anim:'bash',w:.8,a:.85,r:1.0,dmg:28,reach:2.6,arc:1.2,lunge:11,parry:0,poise:70,knock:9,min:6,max:20},
 b_toll:{anim:'slam2',w:1.35,a:.25,r:1.2,dmg:34,reach:3,arc:6.3,parry:0,ub:1,fx:'toll',phase:2,max:9},
 // Griska, Mother of Hounds
 m_bite:{anim:'bite',w:.5,a:.2,r:.6,dmg:28,reach:3.6,arc:1.2,lunge:5,parry:1,poise:50,knock:4,max:4.2,next:[['m_bite',.45]]},
 m_pounce:{anim:'pounce',w:.75,a:.85,r:.9,dmg:36,reach:3,arc:6.3,parry:0,poise:70,knock:8,fx:'leap',min:5,max:22},
 m_sweep:{anim:'sweep',w:.6,a:.45,r:.75,dmg:26,reach:4.4,arc:6.3,parry:0,poise:60,knock:7,fx:'spin',max:4.6},
 m_breath:{anim:'breath',w:.8,a:1.5,r:.8,dmg:9,reach:8,arc:.7,parry:0,ub:1,fx:'breath',phase:2,max:7.5},
 m_howl:{anim:'howl',w:.5,a:1.2,r:.5,dmg:0,reach:0,arc:0,fx:'howl',phase:2},
 // Seraphel, the Cinder Cantor
 c_volley:{anim:'cast',w:.85,a:.3,r:.8,dmg:18,reach:30,arc:6.3,parry:0,fx:'volley',min:3,max:30},
 c_rain:{anim:'cast',w:1.0,a:.3,r:.9,dmg:30,reach:30,arc:6.3,parry:0,ub:1,fx:'rain',min:2,max:30},
 c_staff:{anim:'gsweepR',w:.55,a:.25,r:.7,dmg:22,reach:3.4,arc:2.4,lunge:3,parry:1,poise:40,knock:6,max:3.6},
 c_blink:{anim:'roar',w:.3,a:.45,r:.3,dmg:0,reach:0,arc:0,fx:'blink',max:5},
 c_beam:{anim:'point',w:1.05,a:1.0,r:.9,dmg:34,reach:24,arc:6.3,parry:0,ub:1,fx:'beam',phase:2,min:4,max:24},
 // Ordhal, the Ashen King
 k2_oh:{anim:'slam2',w:1.15,a:.25,r:1.15,dmg:48,reach:6.2,arc:.6,lunge:4,parry:0,poise:90,knock:8,fx:'shock',shockR:3.2,max:7},
 k2_sweep:{anim:'gsweepR',w:.8,a:.32,r:.9,dmg:40,reach:6.4,arc:2.7,lunge:4,parry:1,poise:70,knock:6,max:6.6,next:[['k2_sweepL',.6]]},
 k2_sweepL:{anim:'gsweepL',w:.42,a:.32,r:.9,dmg:38,reach:6.4,arc:2.7,lunge:4,parry:1,poise:70,knock:6,next:[['k2_thrust',.5]]},
 k2_thrust:{anim:'thrust',w:.55,a:.25,r:1.0,dmg:42,reach:7.2,arc:.5,lunge:13,parry:1,poise:80,knock:7,min:4,max:11},
 k2_stomp:{anim:'stomp',w:.5,a:.15,r:.6,dmg:24,reach:4.4,arc:6.3,parry:0,poise:60,knock:10,fx:'stomp',max:3.6},
 k2_leap:{anim:'slam2',w:.6,a:1.1,r:1.1,dmg:50,reach:4.5,arc:6.3,parry:0,ub:1,poise:90,knock:10,fx:'leap',phase:2,min:7,max:26},
 k2_embers:{anim:'cast',w:.9,a:.3,r:.8,dmg:26,reach:30,arc:6.3,parry:0,ub:1,fx:'embers',phase:2,min:3,max:30},
 k2_nova:{anim:'kneelStab',w:2.1,a:.3,r:1.6,dmg:70,reach:10,arc:6.3,parry:0,ub:1,fx:'nova',phase:3,max:30}};
for(const k in M)M[k].id=k;

export const FOES={
 knight:{name:'Hollow Knight',hp:130,r:.5,h:2,walk:2.2,run:4.4,turn:5,poise:45,cd:1.5,sight:15,moves:['k_slash','k_thrust','k_bash'],shield:true,score:120,guard:'knight',bodyY:1.2,headY:2.05},
 hound:{name:'Ash Hound',hp:60,r:.45,h:1.1,walk:3,run:8.2,turn:9,poise:18,cd:1.0,sight:16,moves:['h_bite','h_pounce'],quad:true,score:70,bodyY:.75,headY:1.3},
 archer:{name:'Gaunt Archer',hp:70,r:.42,h:1.9,walk:2.4,run:3.8,turn:6,poise:20,cd:1.8,sight:24,moves:['a_shot','a_stab'],ranged:true,score:90,guard:'bow',bodyY:1.15,headY:1.95},
 bell:{name:'VARGUL, THE BELLWARDEN',hp:1050,r:1.05,h:4,walk:2.4,run:5.2,turn:3.2,poise:260,cd:1.1,moves:['b_oh','b_sweep','b_charge','b_toll'],boss:true,score:3000,guard:'hammer',phases:[.5],bodyY:2.2,headY:3.9},
 mother:{name:'GRISKA, MOTHER OF HOUNDS',hp:950,r:1.2,h:2.6,walk:3.4,run:8.5,turn:4.5,poise:220,cd:1.0,moves:['m_bite','m_pounce','m_sweep','m_breath','m_howl'],boss:true,quad:true,score:3000,phases:[.55],bodyY:1.6,headY:3.2},
 cantor:{name:'SERAPHEL, THE CINDER CANTOR',hp:820,r:.8,h:3.4,walk:2.4,run:3.6,turn:4,poise:180,cd:1.15,moves:['c_volley','c_rain','c_staff','c_blink','c_beam'],boss:true,score:3000,guard:'staff',phases:[.5],float:true,bodyY:2.4,headY:4.0},
 king:{name:'ORDHAL, THE ASHEN KING',hp:1700,r:1.25,h:5,walk:2.6,run:5.6,turn:3,poise:340,cd:1.0,moves:['k2_oh','k2_sweep','k2_thrust','k2_stomp','k2_leap','k2_embers','k2_nova'],boss:true,score:5000,guard:'king',phases:[.6,.25],bodyY:2.9,headY:5.2}};

export class Foe{
 constructor(G,kind,sp,boss){this.G=G;this.kind=kind;this.D=FOES[kind];const D=this.D;this.boss=boss||null;
  this.rig=D.quad?makeHound(kind==='mother'?'mother':'hound'):makeRig(kind);G.scene.add(this.rig.root);
  this.p=new V(sp.x,sp.y||0,sp.z);this.home=this.p.clone();this.homeYaw=sp.yaw??Math.PI;this.v=new V();this.yaw=this.homeYaw;this.perch=!!sp.perch;
  this.st={mode:'idle',speed:0,t:rnd(10),atk:null,guard:D.guard,oneHand:true};this.reset(true);
  if(this.rig.capeAt)this.cape=G.makeCape(this.rig);}
 reset(first){const D=this.D,G=this.G;this.p.copy(this.home);this.v.set(0,0,0);this.yaw=this.homeYaw;this.maxHp=Math.round(D.hp*G.dm.hp);this.hp=this.maxHp;this.post=0;this.dead=false;this.gone=false;this.deadT=0;
  this.state=D.boss?'dormant':'idle';this.t=0;this.mv=null;this.aware=false;this.cd=1+rnd(1);this.phase=1;this.guardHits=0;this.hurtT=0;this.flash=0;this.strafeDir=Math.random()<.5?-1:1;this.strafeT=0;this.combo=0;this.last=[];this.howlT=0;
  this.rig.root.visible=true;this.rig.root.position.copy(this.p);this.rig.root.rotation.y=this.yaw;this.rig.root.scale.setScalar(1);if(this.rig.edge)this.rig.edge.emissiveIntensity=.6;if(this.rig.haloGlow)this.rig.haloGlow.emissiveIntensity=2;}
 get center(){return tv.set(this.p.x,this.p.y+this.D.bodyY,this.p.z);}
 get fwd(){return tv2.set(Math.sin(this.yaw),0,Math.cos(this.yaw));}
 face(x,z,dt,rate){const a=Math.atan2(x-this.p.x,z-this.p.z);this.yaw+=cl(angDiff(this.yaw,a),-rate*dt,rate*dt);}
 // the player relative to me
 rel(){const P=this.G.P;const dx=P.p.x-this.p.x,dz=P.p.z-this.p.z,d=Math.hypot(dx,dz);const f=Math.sin(this.yaw),c=Math.cos(this.yaw);return{dx,dz,d,dot:d>1e-4?(dx*f+dz*c)/d:1,side:d>1e-4?(dx*c-dz*f)/d:0};}
 wake(){if(this.aware||this.dead)return;this.aware=true;this.state='engage';this.cd=.4+rnd(.8);this.G.snd.play(this.D.quad?'growl':'alert',this.p);
  if(this.kind==='hound')for(const e of this.G.foes)if(e!==this&&e.kind==='hound'&&!e.aware&&e.p.distanceTo(this.p)<12)this.G.after(.2+rnd(.4),()=>e.wake());}
 move(dt,vx,vz,acc=10){const G=this.G;this.v.x+=(vx-this.v.x)*Math.min(1,dt*acc);this.v.z+=(vz-this.v.z)*Math.min(1,dt*acc);
  this.p.x+=this.v.x*dt;this.p.z+=this.v.z*dt;const h=G.phys.push(this.p,this.D.r,this.D.h,.6);if(h.o){const vn=this.v.x*h.nx+this.v.z*h.nz;if(vn<0){this.v.x-=vn*h.nx;this.v.z-=vn*h.nz;}}
  for(const o of G.foes)if(o!==this&&!o.dead&&o.rig.root.visible){const ex=this.p.x-o.p.x,ez=this.p.z-o.p.z,ed=Math.hypot(ex,ez),m=this.D.r+o.D.r;if(ed<m&&ed>1e-4){const k=o.D.boss&&!this.D.boss?1:this.D.boss&&!o.D.boss?0:.5;this.p.x+=ex/ed*(m-ed)*k;this.p.z+=ez/ed*(m-ed)*k;}}
  if(this.boss){const a=this.boss.arena,r=this.D.r;this.p.x=cl(this.p.x,a.x0+r,a.x1-r);this.p.z=cl(this.p.z,a.z0+r,a.z1-r);}
  if(!this.flying){const g=G.phys.ground(this.p.x,this.p.y+.4,this.p.z,this.D.r*.5,1);if(g.h<-5&&!this.D.boss){this.p.x-=this.v.x*dt*1.5;this.p.z-=this.v.z*dt*1.5;this.v.set(0,0,0);}else{const gh=g.h<-5?this.p.y:g.h;if(this.p.y>gh+.05){this.v.y-=24*dt;this.p.y=Math.max(gh,this.p.y+this.v.y*dt);}else{this.p.y+=(gh-this.p.y)*Math.min(1,dt*20);this.v.y=0;}}}}
 update(dt){const G=this.G,P=G.P,D=this.D,st=this.st;this.t+=dt;st.t+=dt;this.hurtT=Math.max(0,this.hurtT-dt);this.flash=Math.max(0,this.flash-dt*2.5);st.atk=null;st.block=false;st.snap=false;st.slow=false;st.prowl=false;st.guard=D.guard;
  if(this.dead){this.deadT+=dt;st.mode='dead';st.dp=Math.min(1,this.deadT*1.4);this.anim(dt);
   if(this.deadT>(D.boss?3.2:1.6)&&!this.gone){this.gone=true;G.dissolve(this);this.rig.root.visible=false;if(this.cape)this.cape.mesh.visible=false;}return;}
  const R=this.rel();
  if(this.state==='dormant'){st.mode=this.kind==='king'||this.kind==='mother'?'kneel':this.kind==='cantor'?'float':'idle';st.guard=null;this.move(dt,0,0);this.anim(dt);return;}
  if(this.state==='intro'){st.mode='idle';st.atk={name:this.D.quad?'howl':'roar',p:Math.min(1,this.t/1.4)};this.face(P.p.x,P.p.z,dt,2);this.move(dt,0,0);if(this.t>2.4){this.state='engage';this.t=0;this.cd=.8;}this.anim(dt);return;}
  if(!this.aware){this.idle(dt,R);this.anim(dt);return;}
  if(P.dead&&!['atk'].includes(this.state)){this.state='engage';}
  // phase change (bosses)
  if(D.boss&&D.phases){const f=this.hp/this.maxHp;const want=1+D.phases.filter(x=>f<=x).length;if(want>this.phase&&this.state!=='atk'&&this.state!=='broken'){this.phase=want;this.state='phase';this.t=0;G.bossPhase(this);}}
  switch(this.state){
   case'phase':{st.mode='idle';st.atk={name:D.quad?'howl':'roar',p:Math.min(1,this.t/1.2)};this.move(dt,0,0,6);if(this.t>2.2){this.state='engage';this.t=0;this.cd=.3;}break;}
   case'stagger':{st.mode='stagger';st.sp=this.t/this.stagT;this.move(dt,0,0,5);if(this.t>this.stagT){this.state='engage';this.t=0;this.cd=Math.min(this.cd,.4+rnd(.5));}break;}
   case'parried':case'broken':{st.mode=this.state==='broken'||D.quad?'kneel':'stagger';st.sp=.5;this.move(dt,0,0,5);if(this.t>this.stagT){this.state='engage';this.t=0;this.cd=.5;this.post=0;}break;}
   case'crit':{st.mode='dead';st.dp=Math.min(.55,this.t*1.6);this.move(dt,0,0,4);if(this.t>this.stagT){this.state='engage';this.t=0;this.cd=.6;}break;}
   case'atk':this.attack(dt,R);break;
   default:this.engage(dt,R);}
  // telegraph glow on weapons / eyes
  const wind=this.state==='atk'&&this.t<this.mv.w*this.wk;const gl=wind?(this.mv.ub?2.2+Math.sin(this.t*30)*1.5:1.4):0;
  for(const m of this.rig.glow){if(m===this.rig.edge)continue;m.emissiveIntensity+=((D.boss?2.4+this.phase*.6:2.6)+gl-m.emissiveIntensity)*Math.min(1,dt*10);}
  if(this.rig.edge){const lit=this.phase>=2;this.rig.edge.emissiveIntensity+=((lit?4.5:.9)+gl*1.5-this.rig.edge.emissiveIntensity)*Math.min(1,dt*6);}
  this.anim(dt);}
 anim(dt){const st=this.st,r=this.rig;st.hurt=this.hurtT*2.5;if(this.D.quad)animateHound(r,st,dt);else animate(r,st,dt);r.root.position.copy(this.p);r.root.rotation.y=this.yaw+(this.spin||0);
  if(this.cape)this.G.updateCape(this.cape,r,dt);}
 /* ---------- unaware: guard post / patrol, wake on sight ---------- */
 idle(dt,R){const G=this.G,P=G.P,D=this.D,st=this.st;st.mode='idle';st.speed=0;st.guard=null;
  const tgt=this.home;const hd=Math.hypot(tgt.x-this.p.x,tgt.z-this.p.z);if(hd>.6){const s=D.walk;this.move(dt,(tgt.x-this.p.x)/hd*s,(tgt.z-this.p.z)/hd*s);this.face(tgt.x,tgt.z,dt,D.turn);st.mode='move';st.speed=s;}else{this.move(dt,0,0);this.yaw+=angDiff(this.yaw,this.homeYaw)*Math.min(1,dt*2);}
  if(this.kind==='hound')st.prowl=false;
  if(P.dead||!G.run||D.boss)return;const sight=D.sight*(P.sneak?.6:1);
  if(R.d<sight&&Math.abs(P.p.y-this.p.y)<5&&(R.dot>.2||R.d<4.5)){if((this.losT=(this.losT||0)-dt)<=0){this.losT=.25;ta.set(this.p.x,this.p.y+D.headY*.9,this.p.z);tb.set(P.p.x,P.p.y+1.4,P.p.z);if(G.phys.clear(ta,tb,o=>o.tag!=='pew'&&o.tag!=='deb'))this.wake();}}}
 /* ---------- aware: approach, strafe, pick attacks ---------- */
 engage(dt,R){const G=this.G,P=G.P,D=this.D,st=this.st;const aggr=G.dm.aggr*(D.boss?[1,1,1.15,1.3][this.phase]:1);this.cd-=dt*aggr;
  if(!D.boss&&(R.d>40||Math.abs(P.p.y-this.p.y)>8)&&!P.dead){this.aware=false;this.state='idle';return;}
  if(P.dead){this.move(dt,0,0);st.mode='idle';return;}
  this.face(P.p.x,P.p.z,dt,D.turn);st.guard=D.guard;
  const pref=D.ranged?9:D.boss?Math.min(4,D.r+2.6):D.quad?2.6:2.1;let vx=0,vz=0,s=0;const nx=R.dx/(R.d||1),nz=R.dz/(R.d||1);
  if(D.ranged&&R.d<4.5){s=D.run;vx=-nx*s;vz=-nz*s;}// back off
  else if(R.d>pref+(this.cd>0.6?2.5:.4)){s=R.d>9?D.run:D.walk*1.4;vx=nx*s;vz=nz*s;}
  else{this.strafeT-=dt;if(this.strafeT<=0){this.strafeT=1+rnd(2);this.strafeDir=Math.random()<.5?-1:1;}s=D.walk*(D.quad?1.5:1);vx=-nz*this.strafeDir*s;vz=nx*this.strafeDir*s;if(R.d<pref-.8){vx-=nx*1.6;vz-=nz*1.6;}}
  if(this.perch&&!D.boss){vx=0;vz=0;s=0;}
  this.move(dt,vx,vz,7);const sp=Math.hypot(this.v.x,this.v.z);st.speed=sp;st.mode=sp>.3?(R.d<pref+3&&!D.quad?'strafe':'move'):'idle';if(D.float)st.mode='float';
  if(st.mode==='strafe'){const f=Math.sin(this.yaw),c=Math.cos(this.yaw);st.fwd=(this.v.x*f+this.v.z*c)/Math.max(sp,1);st.side=(this.v.x*c-this.v.z*f)/Math.max(sp,1);}
  if(this.kind==='hound'&&R.d<6)st.prowl=true;
  if(D.shield&&this.cd>.15&&R.d<6){st.block=true;}
  if(this.cd<=0&&!P.dead){const mv=this.pick(R);if(mv)this.begin(mv);else this.cd=.3;}}
 pick(R){const D=this.D;const ok=D.moves.map(k=>M[k]).filter(m=>(m.phase||1)<=this.phase&&R.d<=(m.max??99)&&R.d>=(m.min??0));
  if(this.kind==='mother'&&this.phase>=2){const pups=this.G.foes.filter(e=>e.summoned&&!e.dead).length;if(pups>0||this.howlT>this.G.time)ok.splice(ok.findIndex(m=>m.id==='m_howl')>>>0,ok.findIndex(m=>m.id==='m_howl')>=0?1:0);}
  if(this.kind==='king'&&this.phase>=3&&this.novaT>this.G.time){const i=ok.findIndex(m=>m.id==='k2_nova');if(i>=0)ok.splice(i,1);}
  if(this.kind==='cantor'){const i=ok.findIndex(m=>m.id==='c_blink');if(i>=0&&!(R.d<4&&Math.random()<.5))ok.splice(i,1);}
  if(!ok.length)return null;// avoid repeating the same move three times
  let c=ok.filter(m=>!(this.last.length>=2&&this.last[0]===m.id&&this.last[1]===m.id));if(!c.length)c=ok;
  // weighting: phase-gated specials are favoured right after a phase change
  const w=c.map(m=>(m.phase||1)>1?1.6:1);let s=w.reduce((a,b)=>a+b,0)*Math.random();for(let i=0;i<c.length;i++){s-=w[i];if(s<=0)return c[i];}return c[0];}
 begin(mv){const G=this.G;this.mv=mv;this.state='atk';this.t=0;this.hitDone=false;this.fxDone=false;this.wk=G.dm.tele*(this.D.boss?[1,1,.92,.82][this.phase]:1)*(G.dm.feint&&this.D.boss&&Math.random()<.25?1.3:1);
  this.last.unshift(mv.id);this.last.length=Math.min(this.last.length,3);this.hits=0;this.spin=0;
  if(mv.ub)G.perilous(this);G.snd.play(this.D.boss?'bossWind':'wind',this.p,mv.ub?1.2:.8);
  if(mv.fx==='toll')G.decal({x:this.p.x,y:this.p.y,z:this.p.z,r:9.5,dur:mv.w*this.wk+.25,col:0xff5a14});
  if(mv.fx==='nova')G.decal({x:this.p.x,y:this.p.y,z:this.p.z,r:10,dur:mv.w*this.wk+.25,col:0xff2a08});
  if(mv.fx==='stomp')G.decal({x:this.p.x,y:this.p.y,z:this.p.z,r:mv.reach,dur:mv.w*this.wk+.1,col:0xff6a20});
  if(mv.fx==='rain'||mv.fx==='embers'){const P=G.P;const n=mv.fx==='rain'?(this.phase>=2?6:3):(this.phase>=3?12:8);this.marks=[];for(let i=0;i<n;i++){const a=i/n*6.283+rnd(.5),d=i===0?0:(mv.fx==='rain'?2.6+rnd(2.2):2.4+rnd(5));const x=P.p.x+Math.cos(a)*d+P.v.x*.4,z=P.p.z+Math.sin(a)*d+P.v.z*.4;
    const delay=mv.w*this.wk+mv.a+(mv.fx==='embers'?.9+i*.06:.15+i*.05);this.marks.push(G.hazard({type:'circle',x,y:P.p.y,z,r:mv.fx==='rain'?2.1:2.4,delay,dmg:this.dmg(mv),src:this,fx:mv.fx}));}}}
 dmg(mv){return Math.round(mv.dmg*this.G.dm.dmg*(this.D.boss?[1,1,1.08,1.15][this.phase]:1));}
 attack(dt,R){const G=this.G,P=G.P,D=this.D,st=this.st,mv=this.mv;const W=mv.w*this.wk,A=mv.a,Rc=mv.r*(D.boss?[1,1,.9,.75][this.phase]:1)/(G.dm.aggr>1.1?1.12:1);const t=this.t;
  const f=Math.sin(this.yaw),c=Math.cos(this.yaw);st.guard=D.guard;st.mode=D.float?'float':'idle';st.speed=0;
  if(t<W){// windup: track the player, hold the raised pose
   const trk=mv.fx==='beam'?(t<W-.35?2.5:0):mv.fx==='leap'?D.turn*1.5:D.turn*(t<W*.7?1.2:.35);this.face(P.p.x,P.p.z,dt,trk);
   st.atk={name:mv.anim,p:0,w:ease(t/(W*.8))};st.slow=D.boss;if(mv.anim==='pounce')st.prowl=true;this.move(dt,mv.fx==='leap'||mv.lunge>8?0:-f*.5,mv.fx==='leap'||mv.lunge>8?0:-c*.5,6);
   if(mv.fx==='beam'&&!this.beamDecal&&t>.05){this.beamDecal=G.decal({x:this.p.x,y:this.p.y,z:this.p.z,mode:'line',w:1.6,len:mv.reach,yaw:this.yaw,dur:W-t,col:0xffc060});}
   if(this.beamDecal){this.beamDecal.m.rotation.y=this.yaw;}
   if(mv.fx==='leap'&&t+dt>=W){this.leapFrom=this.p.clone();const lead=.45;this.leapTo=new V(P.p.x+P.v.x*lead,P.p.y,P.p.z+P.v.z*lead);const L=this.leapTo.distanceTo(this.leapFrom);const mx=D.boss?24:8;if(L>mx)this.leapTo.lerpVectors(this.leapFrom,this.leapTo,mx/L);
    if(this.boss){const a=this.boss.arena;this.leapTo.x=cl(this.leapTo.x,a.x0+D.r,a.x1-D.r);this.leapTo.z=cl(this.leapTo.z,a.z0+D.r,a.z1-D.r);}G.decal({x:this.leapTo.x,y:this.leapTo.y,z:this.leapTo.z,r:mv.reach,dur:A,col:0xff4a10});}
   return;}
  if(t<W+A){// active
   const k=(t-W)/A;st.atk={name:mv.anim,p:Math.min(.45,k*.9)};st.snap=true;
   if(mv.fx==='leap'){const kk=ease(Math.min(1,k));this.flying=true;this.p.x=this.leapFrom.x+(this.leapTo.x-this.leapFrom.x)*kk;this.p.z=this.leapFrom.z+(this.leapTo.z-this.leapFrom.z)*kk;this.p.y=this.leapFrom.y+(this.leapTo.y-this.leapFrom.y)*kk+Math.sin(kk*Math.PI)*(D.boss?7:1.6);
    st.atk={name:mv.anim,p:k<.8?0:.45};st.mode=D.quad?'idle':'air';if(D.quad)st.atk={name:'pounce',p:.1+k*.35};if(k>=.97&&!this.hitDone){this.hitDone=true;this.flying=false;this.p.copy(this.leapTo);this.impact(mv,this.p.x,this.p.z,mv.reach);}return;}
   if(mv.fx==='spin'){this.spin=k*Math.PI*2;}
   const lunge=(mv.lunge||0)*(k<.6?1:.3)*(R.d<D.r+1.2&&mv.lunge<9?.2:1);this.move(dt,f*lunge,c*lunge,14);
   if(mv.fx==='charge'||mv.lunge>8)this.face(P.p.x,P.p.z,dt,1.2);
   if(!this.fxDone){this.fxDone=true;this.special(mv);}
   if(mv.fx==='breath'){this.yaw+=Math.sin(k*Math.PI*2)*dt*1.1;G.breath(this,dt,mv);return;}
   if(mv.fx==='beam'){G.beam(this,dt,mv);return;}
   if(['toll','nova','volley','rain','embers','howl','blink','stomp'].includes(mv.fx))return;
   if(!this.hitDone&&mv.reach>0){// arc sweep check against the player
    const rd=mv.reach+.35;if(R.d<rd&&(mv.arc>=6||Math.abs(Math.acos(cl(R.dot,-1,1)))<mv.arc/2+.15)&&Math.abs(P.p.y-this.p.y)<2.4+D.h*.3){this.hitDone=true;const res=G.hurtPlayer(this.dmg(mv),this,mv);if(res==='parry')return;}}
   return;}
  if(mv.fx==='shock'&&!this.shockDone){this.shockDone=true;}
  if(t<W+A+Rc){st.atk={name:mv.anim,p:.45+.55*ease((t-W-A)/Rc)};st.slow=true;if(mv.fx==='spin')this.spin=0;this.move(dt,0,0,8);if(this.beamDecal){this.beamDecal=null;}
   // combo chain
   const nx=mv.next&&t>W+A+Rc*.35&&!this.chained;if(nx){this.chained=true;for(const[n,ch]of mv.next){if(Math.random()<ch*(G.dm.aggr)*(D.boss&&this.phase>1?1.2:1)&&R.d<(M[n].max??9)+1){this.chained=false;this.begin(M[n]);return;}}}
   return;}
  this.chained=false;this.shockDone=false;this.spin=0;this.state='engage';this.t=0;this.cd=(D.cd*(.7+rnd(.7)))/(D.boss?[1,1,1.15,1.35][this.phase]:1);if(D.quad&&!D.boss)this.strafeT=0;}
 special(mv){const G=this.G,P=G.P,D=this.D;const f=Math.sin(this.yaw),c=Math.cos(this.yaw);
  switch(mv.fx){
   case'shock':{const x=this.p.x+f*mv.reach*.82,z=this.p.z+c*mv.reach*.82;G.after(.06,()=>{if(this.dead)return;this.impact(mv,x,z,mv.shockR,true);if(this.kind==='king'&&this.phase>=2)G.hazard({type:'wave',x,y:this.p.y,z,yaw:this.yaw,len:20,w:2.2,speed:15,dmg:Math.round(this.dmg(mv)*.6),src:this});});break;}
   case'toll':G.after(.05,()=>{if(this.dead)return;G.hazard({type:'ring',x:this.p.x,y:this.p.y,z:this.p.z,r:10,speed:10,dmg:this.dmg(mv),src:this});G.shake(1,this.p);G.snd.play('bell',this.p,1.4);G.level.bellRing=1;});break;
   case'nova':G.hazard({type:'circle',x:this.p.x,y:this.p.y,z:this.p.z,r:10,delay:.01,dmg:this.dmg(mv),src:this,fx:'nova'});G.shake(1.4,this.p);break;
   case'stomp':this.impact(mv,this.p.x,this.p.z,mv.reach,true);break;
   case'volley':{const n=this.phase>=2?5:3;for(let i=0;i<n;i++)G.after(i*.12,()=>{if(this.dead)return;const a=(i-(n-1)/2)*.5;const src=new V(this.p.x-Math.cos(this.yaw)*Math.sin(a)*1.6,this.p.y+D.headY+.4+Math.cos(a)*.8,this.p.z+Math.sin(this.yaw)*Math.sin(a)*1.6);
     tv.set(P.p.x-src.x,P.p.y+1.1-src.y,P.p.z-src.z).normalize().multiplyScalar(15);G.proj.spawn('blade',src,tv,this.dmg(mv),this,{home:1.6});G.snd.play('blade',src);});break;}
   case'howl':{G.snd.play('howl',this.p,1.4);this.howlT=G.time+22;for(let i=0;i<2;i++){const a=this.yaw+(i?1.9:-1.9);G.summon('hound',this.p.x+Math.sin(a)*4,this.p.z+Math.cos(a)*4,this.p.y,this);}break;}
   case'blink':{const a=this.boss.arena;let best=null,bd=0;for(let k=0;k<12;k++){const x=a.x0+2+rnd(a.x1-a.x0-4),z=a.z0+2+rnd(a.z1-a.z0-4);const d=Math.hypot(x-P.p.x,z-P.p.z);if(d>bd&&d<16){bd=d;best=[x,z];}}
     if(best){G.vanish(this);this.p.x=best[0];this.p.z=best[1];G.after(.05,()=>G.vanish(this));}break;}
   case'arrow':{const src=new V(this.p.x+f*.4,this.p.y+1.5,this.p.z+c*.4);const lead=Math.min(.6,Math.hypot(P.p.x-src.x,P.p.z-src.z)/28);tv.set(P.p.x+P.v.x*lead-src.x,P.p.y+1.2-src.y,P.p.z+P.v.z*lead-src.z);const L=tv.length();tv.normalize().multiplyScalar(28);tv.y+=L*.04;G.proj.spawn('arrow',src,tv,this.dmg(mv),this);G.snd.play('bow',src);break;}}}
 impact(mv,x,z,r,quake){const G=this.G,P=G.P;G.shake(this.D.boss?.9:.4,this.p);G.snd.play('slam',new V(x,this.p.y,z),this.D.boss?1.3:.7);G.dust(x,this.p.y,z,this.D.boss?36:12);G.decal({x,y:this.p.y,z,r:r*1.15,mode:'wave',dur:.45,col:0xff8a40});
  G.sparks.burst(new V(x,this.p.y+.2,z),this.D.boss?60:20,8,EMBER,.25,.6,{up:true,grav:12,r:.4});
  const d=Math.hypot(P.p.x-x,P.p.z-z);if(d<r+.4&&Math.abs(P.p.y-this.p.y)<2.2&&!this.hitDone2){G.hurtPlayer(this.dmg(mv),this,{...mv,parry:0,knock:mv.knock||8});}}
 // the player hit me
 struck(dmg,o){const G=this.G,D=this.D;if(this.dead)return'none';const R=this.rel();
  if(this.state==='dormant'||this.state==='phase'&&this.t<.6)return'none';
  if(!this.aware)this.wake();
  // a hollow knight's tower shield turns frontal blows that aren't crits
  if(D.shield&&!o.crit&&R.dot>.35&&(this.state==='engage'||this.state==='stagger'&&this.t>.3)&&!o.heavy){this.guardHits++;this.cd=Math.min(this.cd,.25);this.st.block=true;G.blocked(this,o);
   if(this.guardHits>=4){this.guardHits=0;this.state='stagger';this.t=0;this.stagT=1.3;G.snd.play('guardbreak',this.p);return'guardbreak';}this.hp-=Math.round(dmg*.08);if(this.hp<=0){this.die();return'kill';}return'blocked';}
  this.hp-=dmg;this.hurtT=.3;this.flash=1;
  if(this.hp<=0){this.die();return'kill';}
  if(o.crit){this.state='crit';this.t=0;this.stagT=D.boss?1.4:1.6;this.post=0;return'crit';}
  // poise / posture
  this.post+=o.poise||0;const brk=D.poise*(this.state==='atk'&&this.mv&&this.t<this.mv.w*this.wk?.8:1)*(this.state==='atk'&&D.boss?1.25:1);
  if(this.post>=brk&&this.state!=='broken'&&this.state!=='parried'){this.post=0;if(D.boss){this.state='broken';this.t=0;this.stagT=2.6;G.postureBreak(this);return'broken';}this.state='stagger';this.t=0;this.stagT=D.quad?.55:.75;this.v.set(o.dir.x*3,0,o.dir.z*3);return'stagger';}
  if(!D.boss&&D.poise<30&&this.state!=='atk'){this.state='stagger';this.t=0;this.stagT=.35;}
  return'hit';}
 parried(){const G=this.G;if(this.dead)return;this.state='parried';this.t=0;this.stagT=this.D.boss?1.45:1.8;this.post=this.D.boss?this.post+this.D.poise*.35:0;if(this.D.boss&&this.post>=this.D.poise){this.post=0;this.state='broken';this.stagT=2.6;G.postureBreak(this);}}
 die(){const G=this.G;this.dead=true;this.deadT=0;this.hp=0;this.state='dead';G.foeDied(this);}}

/* ---------------- projectiles: arrows and cantor blades ---------------- */
export class Projectiles{
 constructor(G){this.G=G;this.list=[];const wood=new THREE.MeshStandardMaterial({color:0x5a4430,roughness:.8}),tip=new THREE.MeshStandardMaterial({color:0x8a8e94,metalness:.8,roughness:.3});
  this.arrowGeo=[new THREE.CylinderGeometry(.014,.014,.85,5).rotateX(Math.PI/2),new THREE.ConeGeometry(.035,.12,5).rotateX(Math.PI/2).translate(0,0,.48)];this.arrowMat=[wood,tip];
  this.bladeGeo=new THREE.ConeGeometry(.07,.9,4).rotateX(Math.PI/2);this.bladeMat=new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffc070,emissiveIntensity:3.2,metalness:1});}
 spawn(kind,p,v,dmg,owner,o={}){const g=new THREE.Group();if(kind==='arrow'){this.arrowGeo.forEach((geo,i)=>g.add(new THREE.Mesh(geo,this.arrowMat[i])));}else g.add(new THREE.Mesh(this.bladeGeo,this.bladeMat));
  g.position.copy(p);this.G.scene.add(g);this.list.push({kind,g,p:p.clone(),v:v.clone(),dmg,owner,life:kind==='arrow'?2.5:3.2,home:o.home||0});}
 update(dt){const G=this.G,P=G.P;for(let i=this.list.length-1;i>=0;i--){const b=this.list[i];b.life-=dt;
   if(b.home&&!P.dead&&b.life>1.6){tv.set(P.p.x-b.p.x,P.p.y+1.1-b.p.y,P.p.z-b.p.z).normalize().multiplyScalar(b.v.length());b.v.lerp(tv,Math.min(1,dt*b.home));}
   if(b.kind==='arrow')b.v.y-=6*dt;const ox=b.p.x,oy=b.p.y,oz=b.p.z;b.p.addScaledVector(b.v,dt);b.g.position.copy(b.p);b.g.lookAt(tv.copy(b.p).add(b.v));
   if(b.kind==='blade'&&Math.random()<dt*40)G.parts.emit(b.p.x,b.p.y,b.p.z,0,0,0,2.4,1.6,.7,.14,.3,0,1);
   // hit the player (capsule) or the world
   const px=P.p.x,pz=P.p.z;const dx=b.p.x-px,dz=b.p.z-pz;let hit=false;if(!P.dead&&Math.hypot(dx,dz)<.55&&b.p.y>P.p.y&&b.p.y<P.p.y+1.9){hit=true;const r=G.hurtPlayer(b.dmg,b.owner,{parry:0,kind:'proj',knock:2,poise:b.kind==='arrow'?12:20,from:b.p});if(r==='dodge')hit=false;}
   const L=Math.hypot(b.p.x-ox,b.p.y-oy,b.p.z-oz)||1;const wt=G.phys.ray(ox,oy,oz,(b.p.x-ox)/L,(b.p.y-oy)/L,(b.p.z-oz)/L,L,o=>o.tag!=='fog');const gnd=b.p.y<G.phys.ground(b.p.x,b.p.y+.5,b.p.z,.1,1).h;
   if(hit||wt<L||gnd||b.life<=0){if(!hit&&(wt<L||gnd))G.sparks.burst(b.p,8,3,b.kind==='arrow'?[C(1.6,1.2,.8)]:GOLD,.12,.3,{grav:8});G.scene.remove(b.g);this.list.splice(i,1);}}}
 clear(){for(const b of this.list)this.G.scene.remove(b.g);this.list.length=0;}}

/* ---------------- area hazards: circles (delayed blasts), expanding rings, travelling fire waves ---------------- */
export class Hazards{
 constructor(G){this.G=G;this.list=[];}
 add(o){const G=this.G;o.t=0;o.hit=false;if(o.type==='circle')o.decal=G.decal({x:o.x,y:o.y,z:o.z,r:o.r,dur:o.delay,col:o.fx==='nova'?0xff2a08:o.fx==='rain'?0xffc060:0xff4a10});
  if(o.type==='wave'){o.d=0;}if(o.type==='ring'){o.R=0;G.decal({x:o.x,y:o.y,z:o.z,r:o.r,mode:'wave',dur:o.r/o.speed,col:0xffa040});}this.list.push(o);return o;}
 update(dt){const G=this.G,P=G.P;for(let i=this.list.length-1;i>=0;i--){const h=this.list[i];h.t+=dt;const pd=Math.hypot(P.p.x-h.x,P.p.z-h.z);let done=false;
   if(h.type==='circle'){if(h.t>=h.delay&&!h.fired){h.fired=true;const pos=new V(h.x,h.y,h.z);
     if(h.fx==='rain'){for(let k=0;k<5;k++){const a=Math.random()*6.28,r=Math.random()*h.r;G.proj.fall(h.x+Math.cos(a)*r,h.y,h.z+Math.sin(a)*r);}G.snd.play('blade',pos,1);}
     else if(h.fx==='nova'){G.sparks.burst(tv.set(h.x,h.y+1,h.z),260,22,EMBER,.5,1.1,{up:true,grav:4});G.parts.burst(tv,120,14,EMBER,1.2,1.4,{flat:true,drag:1});G.snd.play('nova',pos,1.6);G.shake(1.6,pos);}
     else{G.sparks.burst(tv.set(h.x,h.y+.3,h.z),40,9,EMBER,.3,.7,{up:true,grav:8,r:h.r*.6});G.parts.burst(tv,16,4,EMBER,.9,.7,{up:true,drag:2,r:h.r*.5});G.snd.play('blast',pos,.9);G.shake(.3,pos);}
     if(pd<h.r+.3&&Math.abs(P.p.y-h.y)<2.5)G.hurtPlayer(h.dmg,h.src,{parry:0,ub:1,kind:'aoe',knock:h.fx==='nova'?12:6,poise:60,from:pos});done=true;}}
   else if(h.type==='ring'){h.R+=h.speed*dt;if(!h.hit&&Math.abs(pd-h.R)<.7&&Math.abs(P.p.y-h.y)<1.6){h.hit=true;G.hurtPlayer(h.dmg,h.src,{parry:0,ub:1,kind:'aoe',knock:8,poise:60,from:new V(h.x,h.y,h.z)});}
     if(Math.random()<.9){for(let k=0;k<6;k++){const a=Math.random()*6.283;G.parts.emit(h.x+Math.cos(a)*h.R,h.y+.2,h.z+Math.sin(a)*h.R,0,1.5,0,2.4,1.2,.5,.3,.4,0,1);}}if(h.R>h.r)done=true;}
   else if(h.type==='wave'){h.d+=h.speed*dt;const x=h.x+Math.sin(h.yaw)*h.d,z=h.z+Math.cos(h.yaw)*h.d;for(let k=0;k<3;k++){const s=(Math.random()-.5)*h.w;G.parts.emit(x+Math.cos(h.yaw)*s,h.y+.1,z-Math.sin(h.yaw)*s,0,2+Math.random()*3,0,2.6,.8,.15,.5,.5,-1,1);}
     if(!h.hit&&Math.hypot(P.p.x-x,P.p.z-z)<h.w*.5+.5&&Math.abs(P.p.y-h.y)<1.5){h.hit=true;G.hurtPlayer(h.dmg,h.src,{parry:0,ub:1,kind:'aoe',knock:7,poise:50,from:new V(x,h.y,z)});}
     if(h.d>h.len||G.phys.ray(x,h.y+.6,z,Math.sin(h.yaw),0,Math.cos(h.yaw),.5,o=>o.tag==='wall')<.5)done=true;}
   if(done||h.t>8)this.list.splice(i,1);}}
 clear(){this.list.length=0;}}
