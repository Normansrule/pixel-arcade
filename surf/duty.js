// SWELL GUARD — lifeguard duty. Swimmers bob in the flagged zone; incidents turn some into victims (rip current drift,
// a cramped bodyboarder out the back, a kid on an inflatable blown offshore) on a countdown. Reach them, grab them onto
// the board (E), bring them to the sand, and your partner walks them up to the tower. Beach events each have their own
// mechanics: shark fin (whistle everyone out before it reaches them), jellyfish bloom (clear swimmers from its path; it
// stings), seagull thief (whistle at it or hit it in the air), lost child (walk the kid to the searching parent),
// big-set warning (clear the impact zone before the bombs land), contest heat (out-score CPU surfers on your best two
// waves) and a dolphin pod (paddle or surf alongside it).
import * as THREE from '../vendor/three.module.min.js';
import {Rig,POSE,blendPose,SKIN,HAIR,boardGeometry} from './rig.js';
import {groundY,ZONE,TOWER} from './world.js';
import {C} from './ocean.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
export const DUTY_CFG=[{swimmers:6,inc:[46,60],timer:75,maxV:1,ev:[26,36]},{swimmers:8,inc:[36,48],timer:58,maxV:2,ev:[22,30]},{swimmers:10,inc:[28,38],timer:46,maxV:2,ev:[18,26]}];
export const EVENTS={shark:{name:'SHARK FIN SIGHTED',goal:'Whistle (F) every swimmer out before the fin reaches them'},jelly:{name:'JELLYFISH BLOOM',goal:'Clear swimmers from the bloom\'s path. It stings'},
 gull:{name:'SEAGULL THIEF',goal:'Whistle at the gull or hit it during an aerial'},child:{name:'LOST CHILD',goal:'On foot: take the crying kid (E) to the searching parent'},
 bigset:{name:'BIG SET WARNING',goal:'Clear the impact zone. Big waves score x1.5'},heat:{name:'CONTEST HEAT',goal:'Best two waves win. Your partner covers the tower'},dolphins:{name:'DOLPHIN POD',goal:'Paddle or surf alongside the pod'}};
const LOOKC=['#2d5fa0','#d84a3a','#1f8a6a','#f0b429','#e46b8a','#222','#7b4fbf','#ff8a3d','#38a3c8'];
export function randomLook(r,o={}){const fem=r()<.5;return{skin:SKIN[r()*5|0],hair:HAIR[r()*6|0],shorts:LOOKC[r()*9|0],top:fem?'suit':'none',topC:LOOKC[r()*9|0],female:fem,long:fem&&r()<.7,glasses:false,...o};}

export class Duty{
 constructor(ctx){Object.assign(this,ctx);this.cfg=DUTY_CFG[ctx.diff];this.people=[];this.victims=[];this.events=[];this.t=0;this.rip={x:this.rnd()<.5?-22:24,w:9};
  this.nextInc=18+this.rnd()*6;this.nextEv=26+this.rnd()*6;this.order=shuffle(Object.keys(EVENTS),this.rnd);this.oi=0;this.mult=1;this.partner=null;this.done=[];
  this.build();}
 // ---------- population ----------
 build(){const r=this.rnd,s=this.scene;
  for(let i=0;i<this.cfg.swimmers;i++){const p=this.person(randomLook(r));const x=ZONE[0]+6+r()*(ZONE[1]-ZONE[0]-12),z=5+r()*17;Object.assign(p,{x,z,state:'swim',home:[x,z]});this.people.push(p);}
  // partner lifeguard at the tower
  const pl=this.person({skin:SKIN[2],hair:HAIR[3],shorts:'#c8261c',top:'vest',topC:'#d8261c',glasses:true});Object.assign(pl,{x:TOWER.x+4,z:TOWER.z+7,state:'idle',kind:'partner'});this.partner=pl;
  // entities
  this.fin=finMesh();s.add(this.fin);this.fin.visible=false;
  this.jelly=jellies(40);s.add(this.jelly);this.jelly.visible=false;
  this.gull=gullMesh();s.add(this.gull);this.gull.visible=false;
  this.pod=[0,1,2,3,4].map(()=>{const d=dolphinMesh();s.add(d);d.visible=false;return d;});
  this.ring=floatRing();s.add(this.ring);this.ring.visible=false;
  this.bb=new THREE.Mesh(boardGeometry(1.05,.52,.06),new THREE.MeshStandardMaterial({color:0x1f6fd0,roughness:.4}));s.add(this.bb);this.bb.visible=false;}
 person(look){const rig=new Rig(look,this.mat);this.scene.add(rig.root);return{rig,look,x:0,z:0,y:0,yaw:0,state:'swim',t:this.rnd()*10,vx:0,vz:0,kind:'swimmer',out:false};}
 dispose(){for(const p of[...this.people,this.partner,...this.victims.filter(v=>!this.people.includes(v)),this.kid,this.parent].filter(Boolean))this.scene.remove(p.rig.root);
  for(const m of[this.fin,this.jelly,this.gull,...this.pod,this.ring,this.bb])this.scene.remove(m);}
 inWater(p){return['swim','victim','exit','tow'].includes(p.state);}
 current(x,z){const r=this.rip,d=Math.abs(x-r.x);let cx=0,cz=0;if(z>-1&&z<75){if(d<r.w){cz=1.25*(1-d/r.w)*cl((75-z)/25,0,1);}if(z<12)cx=-Math.sign(x-r.x)*.35*cl(1-d/60,0,1);}return[cx,cz];}
 hazard(){return this.events.some(e=>['shark','jelly','bigset'].includes(e.type)&&e.phase!=='done');}
 // ---------- incidents ----------
 incident(type){const r=this.rnd,P=this.player();type=type||['rip','board','float','rip'][r()*4|0];let v=null;
  if(type==='rip'){const c=this.people.filter(p=>p.state==='swim');if(!c.length)type='board';else{v=c[r()*c.length|0];v.x=this.rip.x+(r()-.5)*4;v.z=Math.max(v.z,16);}}
  if(type==='board'){v=this.person(randomLook(r,{top:'tee',topC:'#1f2a44'}));v.kind='boarder';v.x=(r()<.5?-1:1)*(30+r()*55);v.z=72+r()*16;this.bb.visible=true;}
  if(type==='float'){v=this.person(randomLook(r,{kid:true,top:'none'}));v.kind='float';v.x=(r()-.5)*70;v.z=10;this.ring.visible=true;}
  if(!v)return null;v.state='victim';v.vtype=type;v.maxT=this.cfg.timer+Math.hypot(v.x-P.x,v.z-P.z)/4;v.timer=v.maxT;v.t=0;this.victims.push(v);this.ev('incident',v);return v;}
 makeVictim(p,type){if(p.state==='victim'||p.state==='tow')return;p.state='victim';p.vtype=type;p.maxT=this.cfg.timer*.75;p.timer=p.maxT;this.victims.push(p);this.ev('incident',p);}
 tryGrab(S){if(S.tow||(S.state!=='paddle'&&S.state!=='foot'))return null;for(const v of this.victims)if(v.state==='victim'&&Math.hypot(v.x-S.x,v.z-S.z)<3.2){v.state='tow';S.tow=v;if(v.kind==='float')this.ring.visible=false;if(v.kind==='boarder')this.bb.visible=false;this.ev('grab',v);return v;}return null;}
 drop(S){const v=S.tow;if(!v)return;S.tow=null;v.state='victim';v.timer=Math.max(v.timer,10);v.x=S.x+1.5;v.z=S.z+1;this.ev('drop',v);}
 deliver(S){const v=S.tow;if(!v)return;S.tow=null;v.state='walk';v.x=S.x+.8;v.z=S.z;this.victims=this.victims.filter(o=>o!==v);const pts=1500+Math.round(v.timer/v.maxT*1000)+(v.surfIn?600:0);this.ev('rescue',{v,pts});
  const pr=this.partner;pr.state='meet';pr.target=v;}
 whistle(x,z){let n=0;for(const p of this.people)if(p.state==='swim'&&Math.hypot(p.x-x,p.z-z)<26){p.state='exit';n++;}
  let gull=false;const g=this.events.find(e=>e.type==='gull'&&e.phase==='fly');if(g&&this.gull.position.distanceTo(new V(x,this.gull.position.y,z))<16){gull=true;this.endEvent(g,true,'WHISTLED THE GULL DOWN');}
  if(n&&!this.hazard()&&!this.victims.length){this.ev('falseAlarm',n);}else if(n)this.ev('cleared',n);
  for(const e of this.events)if(e.cleared!==undefined)e.cleared+=n;return{n,gull};}
 interact(S){// on foot: take the lost kid's hand, hand them to the parent
  const e=this.events.find(e=>e.type==='child'&&e.phase==='on');if(!e)return false;const k=this.kid,p=this.parent;
  if(!e.follow&&Math.hypot(k.x-S.x,k.z-S.z)<2.6){e.follow=true;this.ev('kid',k);return true;}
  if(e.follow&&Math.hypot(p.x-S.x,p.z-S.z)<3){this.endEvent(e,true,'FAMILY REUNITED');return true;}return false;}
 // ---------- events ----------
 startEvent(type){const r=this.rnd,e={type,t:0,phase:'on',ok:true,cleared:0,...EVENTS[type]};const P=this.player();
  if(type==='shark'){e.dur=42;e.x=(r()-.5)*90;e.z=95;e.cx=(ZONE[0]+ZONE[1])/2;this.fin.visible=true;e.phase='on';}
  if(type==='jelly'){e.side=r()<.5?-1:1;e.x=e.side*-64;e.z=13;e.dur=50;e.stings=0;this.jelly.visible=true;}
  if(type==='gull'){e.dur=34;e.x=(r()-.5)*60;e.z=-20;e.phase='steal';this.gull.visible=true;}
  if(type==='child'){e.dur=80;const kx=(r()<.5?-1:1)*(25+r()*60);const k=this.kid=this.person(randomLook(r,{kid:true,top:'tee',topC:'#ffba08'}));k.x=kx;k.z=-2;k.state='cry';k.kind='kid';
   const p=this.parent=this.person(randomLook(r,{cap:'#f4f0e8'}));p.x=kx+(kx>0?-1:1)*(45+r()*40);p.z=-24-r()*8;p.state='search';p.kind='parent';e.follow=false;}
  if(type==='bigset'){e.dur=50;e.warn=12;this.sim.spawnSet(1);e.tumbles=0;}
  if(type==='heat'){e.dur=90;e.scores={};}
  if(type==='dolphins'){e.dur=60;e.dir=r()<.5?1:-1;e.x=-e.dir*170;e.z=58+r()*12;e.podT=0;e.waveRide=false;this.pod.forEach(d=>d.visible=true);}
  this.events.push(e);this.ev('event',e);return e;}
 endEvent(e,ok,why){if(e.phase==='done')return;e.phase='done';e.ok=ok;e.why=why;this.ev('eventEnd',e);
  if(e.type==='shark')this.fin.visible=false;if(e.type==='jelly')this.jelly.visible=false;if(e.type==='gull')this.gull.visible=false;if(e.type==='dolphins')this.pod.forEach(d=>d.visible=false);
  if(e.type==='child'){for(const p of[this.kid,this.parent])if(p){p.state='leave';p.leaveT=6;}}
  if(['shark','jelly','bigset'].includes(e.type))for(const p of this.people)if(p.state==='beach'||p.state==='exit')p.back=6+this.rnd()*14;}
 // ---------- update ----------
 update(dt,S,rivals,clockLeft){this.t+=dt;const r=this.rnd;
  if(clockLeft>25){const heatOn=this.events.some(e=>e.type==='heat'&&e.phase!=='done');this.nextInc-=dt*(heatOn?.35:1);if(this.nextInc<=0){this.nextInc=this.cfg.inc[0]+r()*(this.cfg.inc[1]-this.cfg.inc[0]);if(this.victims.length<this.cfg.maxV)this.incident();}
   this.nextEv-=dt;if(this.nextEv<=0&&!this.events.some(e=>e.phase!=='done')){this.nextEv=this.cfg.ev[0]+r()*(this.cfg.ev[1]-this.cfg.ev[0]);this.startEvent(this.order[this.oi++%this.order.length]);}}
  for(const e of this.events)if(e.phase!=='done')this.stepEvent(e,dt,S,rivals);
  this.events=this.events.filter(e=>e.phase!=='done'||(e.keep=(e.keep??3)-dt)>0);
  // people
  for(const p of this.people)this.stepPerson(p,dt,S);
  for(const v of this.victims)if(!this.people.includes(v))this.stepPerson(v,dt,S);
  this.stepPerson(this.partner,dt,S);if(this.kid)this.stepPerson(this.kid,dt,S);if(this.parent)this.stepPerson(this.parent,dt,S);
  // whatever hit a swimmer
  if(S.state==='ride'||S.state==='air')for(const p of this.people)if(this.inWater(p)&&p.state!=='tow'&&Math.hypot(p.x-S.x,p.z-S.z)<1.25&&Math.abs(S.y-p.y)<1.6){this.ev('hitSwimmer',p);p.vx=(p.x-S.x)*2;p.vz=(p.z-S.z)*2;break;}}
 stepPerson(p,dt,S){p.t+=dt;const r=this.rnd;const rig=p.rig;let pose;const h=this.sim.height(p.x,p.z);
  switch(p.state){
   case'swim':{if(p.back!==undefined)delete p.back;const[hx,hz]=p.home;p.vx+=((hx-p.x)*.02+(r()-.5)*.4)*dt;p.vz+=((hz-p.z)*.02+(r()-.5)*.4)*dt;p.vx*=Math.exp(-dt);p.vz*=Math.exp(-dt);
    const[cx,cz]=this.current(p.x,p.z);p.x+=(p.vx+cx*.3)*dt;p.z+=(p.vz+cz*.3)*dt;p.y=h;pose=POSE.tread(p.t,0);p.yaw+=(Math.atan2(-p.vx,-1)*.3-p.yaw)*dt;break;}
   case'victim':{p.timer-=dt;const[cx,cz]=this.current(p.x,p.z);let dx=cx,dz=cz;if(p.vtype==='float'){dz=1.0;dx=.45;}if(p.vtype==='board'){dx=.15;dz=.2;}
    if(p.z>78&&p.vtype==='rip')dz=.1;p.x+=dx*dt;p.z+=dz*dt;p.y=h;pose=p.kind==='float'?POSE.sit(p.t):POSE.tread(p.t,1);p.yaw=Math.PI+Math.sin(p.t*.7)*.5;
    if(p.kind==='float'){this.ring.position.set(p.x,h+.05,p.z);this.ring.rotation.set(Math.sin(p.t*1.3)*.08,p.t*.2,Math.sin(p.t)*.08);}
    if(p.kind==='boarder'){this.bb.position.set(p.x,h+.03,p.z+.5);this.bb.rotation.set(0,p.t*.05,Math.sin(p.t*1.1)*.06);}
    if(p.timer<=0||p.z>150){this.miss(p);return;}break;}
   case'tow':{// lying on the back half of the guard's board, holding on
    const hx=Math.sin(S.yaw),hz=Math.cos(S.yaw);p.x=S.x-hx*.85;p.z=S.z-hz*.85;p.y=S.y+.05;p.yaw=S.yaw+Math.PI;pose=POSE.lieFront();rig.root.position.set(p.x,p.y,p.z);rig.root.rotation.set(0,S.yaw,0);rig.apply(pose);
    if(S.state==='ride'||(S.state==='paddle'&&S.catchT>.6))p.surfIn=true;return;}
   case'exit':{const tz=-2.5;p.vz=-1.3;p.vx*=.95;p.z+=p.vz*dt;p.x+=p.vx*dt;const g=groundY(p.x,p.z);if(h-g<.45){p.state='beach';p.y=g;}else p.y=h;pose=h-g>.9?POSE.swim(p.t):POSE.run(p.t,1.4);p.yaw=Math.PI;if(p.z<tz)p.state='beach';break;}
   case'beach':{p.y=groundY(p.x,p.z);pose=POSE.stand(p.t);p.yaw=Math.sin(p.t*.2)*.3;if(p.back!==undefined){p.back-=dt;if(p.back<=0&&!this.hazard()){p.state='enter';delete p.back;}}break;}
   case'enter':{p.z+=1.2*dt;const g=groundY(p.x,p.z);p.y=Math.max(g,h-1);pose=h-g>.9?POSE.swim(p.t):POSE.run(p.t,1.2);p.yaw=0;if(p.z>=p.home[1]||h-g>1.3){p.state='swim';}break;}
   case'walk':{// rescued: walk up to the tower with the partner
    const tx=TOWER.x+2.95,tz=TOWER.z+7;const dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);if(d<1.5){p.state='rest';p.restT=12;}else{p.x+=dx/d*1.3*dt;p.z+=dz/d*1.3*dt;p.yaw=Math.atan2(dx,dz);}p.y=groundY(p.x,p.z);pose=POSE.run(p.t,1.3);break;}
   case'rest':{p.y=groundY(p.x,p.z);pose=POSE.beachSit();p.restT-=dt;if(p.restT<=0){if(this.people.includes(p)){p.state='beach';p.x=p.home[0];p.z=-3;p.back=4;}else{this.scene.remove(rig.root);p.state='gone';}}break;}
   case'gone':rig.root.visible=false;return;
   // partner
   case'idle':{p.y=groundY(p.x,p.z);pose=POSE.stand(p.t);p.yaw=0;break;}
   case'meet':{const v=p.target;const dx=v.x-p.x,dz=v.z-p.z,d=Math.hypot(dx,dz);if(d<1.4||v.state!=='walk'){p.state='back';}else{p.x+=dx/d*5*dt;p.z+=dz/d*5*dt;p.yaw=Math.atan2(dx,dz);}p.y=groundY(p.x,p.z);pose=POSE.run(p.t,5);break;}
   case'back':{const tx=TOWER.x+4,tz=TOWER.z+7,dx=tx-p.x,dz=tz-p.z,d=Math.hypot(dx,dz);if(d<.6){p.state='idle';}else{p.x+=dx/d*1.3*dt;p.z+=dz/d*1.3*dt;p.yaw=Math.atan2(dx,dz);}p.y=groundY(p.x,p.z);pose=POSE.run(p.t,1.3);break;}
   // lost child
   case'cry':{p.y=Math.max(groundY(p.x,p.z),h-.6);pose=POSE.cry(p.t);const e=this.events.find(e=>e.type==='child'&&e.phase==='on');
    if(e&&e.follow){const dx=S.x-p.x,dz=S.z-p.z,d=Math.hypot(dx,dz);if(d>1.4){p.x+=dx/d*Math.min(5,d*2)*dt;p.z+=dz/d*Math.min(5,d*2)*dt;p.yaw=Math.atan2(dx,dz);pose=POSE.run(p.t,Math.min(5,d*2));}else pose=POSE.stand(p.t);}else p.yaw=Math.PI*.9;break;}
   case'search':{p.y=groundY(p.x,p.z);pose=POSE.search(p.t);p.yaw=Math.sin(p.t*.4)*1.5;break;}
   case'leave':{p.leaveT-=dt;p.y=groundY(p.x,p.z);p.z-=1.2*dt;p.yaw=Math.PI;pose=POSE.run(p.t,1.2);if(p.leaveT<=0){this.scene.remove(rig.root);if(p===this.kid)this.kid=null;if(p===this.parent)this.parent=null;return;}break;}
  }
  if(!pose)return;rig.root.position.set(p.x,p.y,p.z);rig.root.rotation.set(0,p.yaw,0);rig.apply(pose);rig.root.visible=true;}
 miss(v){this.victims=this.victims.filter(o=>o!==v);this.ev('missed',v);if(v.kind==='float')this.ring.visible=false;if(v.kind==='boarder')this.bb.visible=false;
  if(this.people.includes(v)){v.state='beach';v.x=v.home[0];v.z=-3;v.back=12;}else{this.scene.remove(v.rig.root);v.state='gone';}}
 stepEvent(e,dt,S,rivals){e.t+=dt;const r=this.rnd;
  switch(e.type){
   case'shark':{// cruise in, then circle the swim zone
    const tx=e.cx+Math.cos(e.t*.22)*16,tz=14+Math.sin(e.t*.22)*8;const dx=tx-e.x,dz=tz-e.z,d=Math.hypot(dx,dz)||1,sp=e.t<12?3.4:2.4;e.x+=dx/d*sp*dt;e.z+=dz/d*sp*dt;
    const h=this.sim.height(e.x,e.z);this.fin.position.set(e.x,h-.05,e.z);this.fin.rotation.y=Math.atan2(dx,dz);
    for(const p of this.people)if(p.state==='swim'&&Math.hypot(p.x-e.x,p.z-e.z)<6.5){e.ok=false;this.makeVictim(p,'shark');this.ev('scare',p);}
    if(S.state==='paddle'&&Math.hypot(S.x-e.x,S.z-e.z)<4&&S.knock<=0){S.knock=3;S.vx+=(S.x-e.x)*1.2;S.vz+=(S.z-e.z)*1.2;this.ev('bump');}
    if(e.t>e.dur){this.endEvent(e,e.ok,e.ok?'BEACH CLEARED':'SWIMMERS SCARED');}
    else if(e.t>10&&!this.people.some(p=>p.state==='swim')&&!e.clearedAll){e.clearedAll=true;this.ev('note','WATER CLEAR · KEEP IT CLEAR');}break;}
   case'jelly':{e.x+=e.side*2.6*dt;const R=11;this.jelly.position.set(e.x,0,e.z);this.jelly.userData.t=e.t;const M=this.jelly,m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new V();
    for(let i=0;i<M.count;i++){const a=i*2.4,rr=Math.sqrt((i+.5)/M.count)*R,lx=Math.cos(a)*rr,lz=Math.sin(a)*rr;const wx=e.x+lx,wz=e.z+lz;const h=this.sim.height(wx,wz);const pul=1+Math.sin(e.t*3+i)*.12;
     m4.compose(new V(lx,h-.06+Math.sin(e.t*2+i)*.04,lz),q.setFromEuler(new THREE.Euler(Math.sin(e.t+i)*.2,i,0)),s.set(pul*.9,1/pul,pul*.9));M.setMatrixAt(i,m4);}M.instanceMatrix.needsUpdate=true;
    for(const p of this.people)if(p.state==='swim'&&Math.hypot(p.x-e.x,p.z-e.z)<R){p.sting=(p.sting||0)+dt;if(p.sting>1.6){p.sting=0;e.ok=false;e.stings++;this.makeVictim(p,'sting');this.ev('sting',p);}}
    if((S.state==='paddle'||S.state==='wipe')&&Math.hypot(S.x-e.x,S.z-e.z)<R&&S.stung<=0){S.stung=4;this.ev('stungMe');}
    if(Math.abs(e.x)>64&&e.t>10)this.endEvent(e,e.ok,e.ok?'BLOOM PASSED · NO STINGS':e.stings+' STUNG');break;}
   case'gull':{const G=this.gull;if(e.phase==='steal'){const k=Math.min(1,e.t/3);G.position.set(e.x,1+k*6,e.z+k*20);if(e.t>3)e.phase='fly';}
    else{const a=(e.t-3)*.42,cx=S.x*.25+e.x*.75,cz=46;G.position.set(cx+Math.sin(a)*28,4.2+Math.sin(a*2.3)*1.8,cz+Math.sin(a*2)*16);e.x+=(S.x-e.x)*dt*.05;}
    const v=G.userData.prev?G.position.clone().sub(G.userData.prev):new V(1,0,0);G.userData.prev=G.position.clone();G.rotation.y=Math.atan2(v.x,v.z);G.userData.flap=e.t;
    if(S.state==='air'&&G.position.distanceTo(new V(S.x,S.y+1,S.z))<3.2)this.endEvent(e,true,'SANDWICH SNATCHED BACK');
    if(e.t>e.dur)this.endEvent(e,false,'THE GULL GOT AWAY');break;}
   case'child':{if(e.t>e.dur)this.endEvent(e,false,'PARTNER FOUND THE PARENT');break;}
   case'bigset':{if(e.t<e.warn){if(!e.warned){e.warned=true;}}
    else{this.mult=1.5;for(const w of this.sim.waves)if(w.big&&w.broke)for(const p of this.people)if(p.state==='swim'){const o=this.sim.sampleWave(w,p.x,p.z,{});if(o.br>.6&&o.u>-o.wf&&o.u<1&&o.a>1.5&&!p.rolled){p.rolled=true;e.ok=false;e.tumbles++;this.makeVictim(p,'tumble');this.ev('tumble',p);}}
     if(e.t>e.dur){this.mult=1;for(const p of this.people)p.rolled=false;this.endEvent(e,e.ok,e.ok?'IMPACT ZONE KEPT CLEAR':e.tumbles+' SWIMMERS ROLLED');}}break;}
   case'heat':{if(e.t>e.dur){const me=best2(e.scores.YOU),ranks=rivals.map(rv=>({n:rv.name,s:best2(e.scores[rv.name])})).concat([{n:'YOU',s:me}]).sort((a,b)=>b.s-a.s);e.place=ranks.findIndex(x=>x.n==='YOU')+1;e.ranks=ranks;this.endEvent(e,e.place===1,e.place===1?'HEAT WON':'FINISHED '+['1ST','2ND','3RD','4TH'][e.place-1]);}break;}
   case'dolphins':{e.x+=e.dir*5.2*dt;this.pod.forEach((d,i)=>{const ox=-i*3.2*e.dir+Math.sin(i*2.1)*2,oz=Math.sin(i*1.7)*4,x=e.x+ox,z=e.z+oz,ph=e.t*2.4+i*1.3;const h=this.sim.height(x,z);const arc=Math.sin(ph);
      d.position.set(x,h-.55+Math.max(0,arc)*1.1,z);d.rotation.set(-Math.cos(ph)*.55,e.dir>0?Math.PI/2:-Math.PI/2,0);});
    const near=Math.hypot(S.x-e.x,S.z-e.z)<11&&S.state!=='foot';if(near){e.podT+=dt;if((S.state==='ride'||S.state==='air')&&!e.waveRide){e.waveRide=true;this.ev('dolphinWave');}}
    if(e.podT>=5&&!e.done5){e.done5=true;this.endEvent(e,true,e.waveRide?'DOLPHIN WAVE!':'SWAM WITH THE POD');}
    if(Math.abs(e.x)>175&&e.t>5)this.endEvent(e,false,'THE POD SWAM ON');break;}}}
 finish(rivals){for(const e of this.events)if(e.phase!=='done'){if(e.type==='heat'){e.t=e.dur+1;this.stepEvent(e,0,this.player(),rivals);}}}
 // HUD: things worth an off-screen marker
 markers(){const m=[];for(const v of this.victims)if(v.state==='victim')m.push({x:v.x,y:v.y+1.6,z:v.z,kind:'help',label:'HELP',t:v.timer,k:v.timer/v.maxT});
  for(const e of this.events){if(e.phase==='done')continue;if(e.type==='child'){if(this.kid&&!e.follow)m.push({x:this.kid.x,y:this.kid.y+1.4,z:this.kid.z,kind:'kid',label:'LOST KID'});if(this.parent&&e.follow)m.push({x:this.parent.x,y:this.parent.y+2.1,z:this.parent.z,kind:'parent',label:'PARENT'});}
   if(e.type==='shark')m.push({x:e.x,y:1.6,z:e.z,kind:'shark',label:'FIN'});if(e.type==='gull')m.push({x:this.gull.position.x,y:this.gull.position.y+.8,z:this.gull.position.z,kind:'gull',label:'GULL'});
   if(e.type==='dolphins')m.push({x:e.x,y:1.4,z:e.z,kind:'pod',label:'POD'});if(e.type==='jelly')m.push({x:e.x,y:1.2,z:e.z,kind:'jelly',label:'BLOOM'});}return m;}
 animate(t){if(this.gull.visible){const f=Math.sin((this.gull.userData.flap||t)*14);this.gull.userData.wl.rotation.z=.2+f*.6;this.gull.userData.wr.rotation.z=-.2-f*.6;}
  if(this.fin.visible){this.fin.children[1].material.opacity=.32;}}
}
export function best2(list){if(!list||!list.length)return 0;const s=[...list].sort((a,b)=>b-a);return s[0]+(s[1]||0);}
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=r()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
// ---------- creature meshes ----------
function finMesh(){const g=new THREE.Group();const s=new THREE.Shape();s.moveTo(-.45,0);s.quadraticCurveTo(-.05,.25,.12,.78);s.quadraticCurveTo(.12,.3,.4,0);s.lineTo(-.45,0);
 const fg=new THREE.ExtrudeGeometry(s,{depth:.06,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:2});fg.translate(0,0,-.03);fg.rotateY(-Math.PI/2);
 const fin=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:0x4a5560,roughness:.45}));fin.castShadow=true;g.add(fin);
 const sh=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({color:0x061018,transparent:true,opacity:.32,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.scale.set(.7,2.6,1);sh.position.set(0,.04,-.6);sh.renderOrder=3;g.add(sh);return g;}
function jellies(n){const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new THREE.Vector2(Math.sin(t*Math.PI*.55)*.32*(1+.15*Math.sin(t*18)),Math.cos(t*Math.PI*.5)*.22));}
 const g=new THREE.LatheGeometry(pts,14);const m=new THREE.MeshPhysicalMaterial({color:0xd78cff,emissive:0x6a2a8a,emissiveIntensity:.5,roughness:.15,transparent:true,opacity:.72,transmission:0,side:THREE.DoubleSide,depthWrite:false});
 const im=new THREE.InstancedMesh(g,m,n);im.renderOrder=3;im.frustumCulled=false;return im;}
function gullMesh(){const g=new THREE.Group(),w=new THREE.MeshStandardMaterial({color:0xf2f2ee,roughness:.7}),gr=new THREE.MeshStandardMaterial({color:0x9aa2aa,roughness:.7}),o=new THREE.MeshStandardMaterial({color:0xffa31a,roughness:.5});
 const b=new THREE.Mesh(new THREE.SphereGeometry(.16,10,8),w);b.scale.set(1,1,2.2);g.add(b);const hd=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),w);hd.position.set(0,.08,.36);g.add(hd);
 const bk=new THREE.Mesh(new THREE.ConeGeometry(.03,.14,6),o);bk.rotation.x=Math.PI/2;bk.position.set(0,.06,.5);g.add(bk);
 const wg=new THREE.BoxGeometry(.85,.02,.26);wg.translate(.42,0,0);const wl=new THREE.Mesh(wg,gr);wl.position.set(.08,.04,0);const wr=new THREE.Mesh(wg,gr);wr.scale.x=-1;wr.position.set(-.08,.04,0);g.add(wl,wr);g.userData.wl=wl;g.userData.wr=wr;
 const sw=new THREE.Mesh(new THREE.BoxGeometry(.14,.05,.12),new THREE.MeshStandardMaterial({color:0xe8c27a,roughness:.8}));sw.position.set(0,-.02,.52);g.add(sw);g.scale.setScalar(1.6);g.traverse(c=>{if(c.isMesh)c.castShadow=true;});return g;}
function dolphinMesh(){const pts=[];for(let i=0;i<=14;i++){const t=i/14;pts.push(new THREE.Vector2(Math.max(.005,Math.sin(Math.pow(t,.75)*Math.PI)*.3*(1-t*.35)),t*2.3-1.15));}
 const body=new THREE.LatheGeometry(pts,12);body.rotateX(Math.PI/2);body.scale(1,.85,1);
 const m=new THREE.MeshStandardMaterial({color:0x5d6c7a,roughness:.3,metalness:.05});const g=new THREE.Group();g.add(new THREE.Mesh(body,m));
 const fin=new THREE.Mesh(new THREE.ConeGeometry(.13,.42,4),m);fin.position.set(0,.33,-.1);fin.rotation.x=-.5;fin.scale.z=.3;g.add(fin);
 const tail=new THREE.Mesh(new THREE.BoxGeometry(.7,.03,.2),m);tail.position.set(0,0,-1.18);g.add(tail);
 const beak=new THREE.Mesh(new THREE.CylinderGeometry(.04,.07,.25,8),m);beak.rotation.x=Math.PI/2;beak.position.set(0,-.03,1.22);g.add(beak);
 for(const s of[-1,1]){const f=new THREE.Mesh(new THREE.BoxGeometry(.3,.02,.14),m);f.position.set(s*.28,-.12,.35);f.rotation.z=s*.4;g.add(f);}g.traverse(c=>{if(c.isMesh)c.castShadow=true;});return g;}
function floatRing(){const c=document.createElement('canvas');c.width=128;c.height=16;const x=c.getContext('2d');for(let i=0;i<8;i++){x.fillStyle=i%2?'#ffffff':'#ff4f8b';x.fillRect(i*16,0,16,16);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=THREE.RepeatWrapping;
 const g=new THREE.TorusGeometry(.48,.17,12,28);g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshPhysicalMaterial({map:t,roughness:.25,clearcoat:1}));m.castShadow=true;return m;}
