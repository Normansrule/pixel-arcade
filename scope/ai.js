// LONG SHOT — entities + behaviour: people (routines, wandering, perception, panic, investigation, combat, departure),
// vehicles on paths (cars, boats, helicopter, chairlift chairs), hazards (accident set-pieces), destroyable objects.
import * as THREE from '../vendor/three.module.min.js';
import {Rig,pose,randomLook,pick} from './actors.js';
import {vehicleModel,clamp,rng} from './world.js';
const V=THREE.Vector3;
const COLN=[['WHITE',0xf0f0f0],['CREAM',0xe8dcc0],['BLACK',0x161616],['CHARCOAL',0x3a3c40],['GREY',0x8a8c90],['NAVY',0x1c2a4a],['BLUE',0x2a5ab0],['SKY BLUE',0x7ab0e0],['RED',0xc02a24],['MAROON',0x6a1a1e],['PINK',0xe07aa0],['ORANGE',0xf07a20],['YELLOW',0xe8c020],['GREEN',0x2e7a3a],['OLIVE',0x6a6a3a],['TEAL',0x1a8a8a],['TAN',0xc0a070],['BROWN',0x6a4a2a],['PURPLE',0x6a3a9a],['GOLD',0xd8b040],['SILVER',0xc0c4c8]];
export function colName(h){const r=(h>>16)&255,g=(h>>8)&255,b=h&255;let best=COLN[0],bd=1e9;for(const c of COLN){const d=(r-((c[1]>>16)&255))**2*.3+(g-((c[1]>>8)&255))**2*.59+(b-(c[1]&255))**2*.11;if(d<bd){bd=d;best=c;}}return best[0];}
const GARM={suit:'JACKET',uniform:'UNIFORM',coat:'TRENCH COAT',dress:'DRESS',vest:'WAISTCOAT',hivis:'SHIRT',ski:'SKI SUIT',parka:'PARKA',tee:'T-SHIRT',shirt:'SHIRT'};
const HATN={fedora:'FEDORA',wide:'WIDE-BRIM HAT',cap:'CAP',beanie:'BEANIE',hardhat:'HARD HAT',helmet:'HELMET',skihelm:'SKI HELMET',peaked:'PEAKED CAP',beret:'BERET'};
export function describe(o){const d=[];if(o.topT==='hivis'||o.vest)d.push(colName(o.vestC??0xff7a10)+' HI-VIS VEST');else d.push(colName(o.top)+' '+GARM[o.topT||'shirt']);
 if(o.tie)d.push(colName(o.tie)+' TIE');if(o.scarf)d.push(colName(o.scarf)+' SCARF');if(o.hat&&o.hat!=='none')d.push(colName(o.hatC??0x2a2a2a)+' '+HATN[o.hat]);
 if(o.glasses==='sun')d.push('SUNGLASSES');if(o.glasses==='goggles')d.push(colName(o.goggleC??0xd8a020)+' GOGGLES');if(o.medals)d.push('MEDALS');
 if(o.briefcase)d.push((o.briefcase==='black'?'BLACK':'SILVER')+' BRIEFCASE');if(o.clipboard)d.push('CLIPBOARD');if(o.drink)d.push('HOLDING A DRINK');if(o.umbrella)d.push('UMBRELLA');if(o.rifle)d.push('ARMED');if(o.skis)d.push('SKIS');return d;}

let PID=0;const R=Math.random;
// ============================== PERSON ==============================
export class Person{
 constructor(L,s){this.L=L;this.s=s;this.id=s.id||('p'+(++PID));this.role=s.role||'civ';this.name=s.name||'';
  const base=randomLook(L.rand);this.o={...base,topT:'shirt',top:0x8a8c90,pants:0x2a2c30,...(s.look||{})};if(s.look&&s.look.hair===undefined&&this.o.hat==='none')this.o.hair=base.hair;
  this.rig=new Rig(this.o,s.h||(.94+L.rand()*.1));L.scene.add(this.rig.root);
  const at=L.pt(s.at);this.pos=at.clone();this.pos.y=L.world.groundAt(at.x,at.z,at.y+.3);this.yaw=s.yaw??L.rand()*6.28;this.spd=0;this.ph=L.rand()*6;this.walk=(s.walk||1.25)+(L.rand()-.5)*.25;
  this.routine=s.routine||null;this.ri=-1;this.path=[];this.wait=s.wait??(L.rand()*4);this.act=s.act||'idle';this.faceP=null;this.state=s.follow?'follow':s.routine?'routine':s.wander?'wander':'idle';this.home=this.state;
  this.alive=true;this.wounded=false;this.alert=0;this.lookP=null;this.vehicle=null;this.seat=-1;this.tag=false;this.found=false;this.hidden=false;this.gone=false;this.react=0;this.fireT=2+R()*2;this.losT=0;this.los=false;
  this.zone=s.wander?L.zones[s.wander]:null;this.acts=s.acts||(this.zone&&this.zone.acts)||['idle','talk','phone'];this.traits=describe(this.o);this.hv=null;this.hvT=-1;this.moving=false;this.vel=new V();this.prevPos=this.pos.clone();
  this.isTarget=this.role==='target';this.hostile=this.role==='guard'||this.role==='courier'||this.isTarget||this.role==='hostile';
  if(s.hiddenUntil){this.hidden=true;this.rig.root.visible=false;}
  this.place();}
 place(){const r=this.rig.root;r.position.copy(this.pos);r.rotation.y=this.yaw;}
 get eye(){return new V(this.pos.x,this.pos.y+1.62,this.pos.z);}
 get chest(){if(this.rig.rag)return this.rig.rag.pts[3].clone();return new V(this.pos.x,this.pos.y+(this.act==='sit'||this.vehicle?.85:1.3),this.pos.z);}
 setPath(pts){this.path=pts.map(p=>p.clone());}
 goTo(p,via){const pts=[];if(via)for(const n of via)pts.push(this.L.pt(n));pts.push(this.L.pt(p));this.setPath(pts);}
 // ---------------- per-frame ----------------
 update(dt,t){if(this.gone)return;const L=this.L,G=L.G;
  if(!this.alive){if(this.rig.rag){this.rig.stepRagdoll(dt);if(this.rig.rag.wet&&!this.hidden){this.hidden=true;}}else if(this.vehicle){this.seatPos();pose(this.rig,'slump',0,0,t);this.rig.apply(dt,6);}return;}
  if(this.hidden&&this.s.hiddenUntil)return;
  if(this.vehicle){this.seatPos();const v=this.vehicle;if(this.rig.props.skis){for(const k of this.rig.props.skis)k.visible=v.type==='chair';for(const k of this.rig.props.poles)k.visible=false;}pose(this.rig,v.type==='chair'?'ride':this.seat===0&&v.type!=='heli'&&!v.dims.boat?'drive':'ride',this.ph,0,t);this.rig.apply(dt,8);return;}
  this.react-=dt;this.brain(dt,t);
  // movement
  let sp=0;const x0=this.pos.x,z0=this.pos.z;if(this.path.length){const tgt=this.path[0];const dx=tgt.x-this.pos.x,dz=tgt.z-this.pos.z,d=Math.hypot(dx,dz);const vmax=this.ski?this.skiSpd||10:this.run?this.runSpd||4.3:this.walk;
   if(d<.35){this.path.shift();if(!this.path.length)this.arrive();}else{sp=this.ski?vmax:Math.min(vmax,d*3+.5);const a=Math.atan2(dx,dz);const y0=this.yaw;this.turn(a,dt,this.ski?2.2:this.run?7:4.5);this.carve=clamp((this.yaw-y0)/Math.max(dt,1e-4)*.6,-1,1);const k=sp*dt/d;this.pos.x+=dx*Math.min(1,k);this.pos.z+=dz*Math.min(1,k);}}
  else if(this.faceP){this.turn(Math.atan2(this.faceP.x-this.pos.x,this.faceP.z-this.pos.z),dt,3);}
  sp=this.solid(dt,sp,x0,z0);this.spd+=(sp-this.spd)*Math.min(1,dt*8);const gy=L.world.groundAt(this.pos.x,this.pos.z,this.pos.y+.2);this.pos.y+=(gy-this.pos.y)*Math.min(1,dt*12);if(Math.abs(gy-this.pos.y)>2)this.pos.y=gy;
  this.vel.subVectors(this.pos,this.prevPos).divideScalar(Math.max(dt,1e-4));this.prevPos.copy(this.pos);
  this.ph+=dt*(this.spd>.2?(this.spd>2.6?this.spd*1.55:2.2+this.spd*1.9):0);
  // pose
  let act=this.path.length?(this.ski?'ski':'walk'):this.act;const o={rifle:!!this.o.rifle,briefcase:!!this.o.briefcase,umbrella:!!this.o.umbrella,clipboard:!!this.o.clipboard,panic:this.state==='panic',carve:this.carve||0};if(this.rig.props.skis){const on=!!this.ski;for(const k of this.rig.props.skis)k.visible=on;for(const k of this.rig.props.poles)k.visible=on;}
  if(this.lookP&&!this.path.length&&act!=='aim'){let a=Math.atan2(this.lookP.x-this.pos.x,this.lookP.z-this.pos.z)-this.yaw;a=((a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;o.headY=clamp(a,-1.1,1.1);}
  pose(this.rig,act,this.ph,this.spd,t,o);this.rig.setProp('phone',act==='phone');this.rig.setProp('cig',act==='smoke');this.rig.apply(dt,this.state==='panic'?14:9);this.place();}
 // solid body: circle r .28 vs other people, static OBBs above step height and ground vehicles; slides along walls, side-steps head-on blocks, re-plans (wander) or ghosts when wedged >4s
 solid(dt,sp,x0,z0){const L=this.L,W=L.world,p=this.pos,r=.28,y=p.y;
  const box=(cx,cz,hx,hz,c,s)=>{const dx=p.x-cx,dz=p.z-cz,lx=dx*c-dz*s,lz=dx*s+dz*c,ex=lx-clamp(lx,-hx,hx),ez=lz-clamp(lz,-hz,hz),d=Math.hypot(ex,ez);if(d>=r)return;let ox=0,oz=0;
   if(d>1e-5){ox=ex*(r-d)/d;oz=ez*(r-d)/d;}else{const px=hx-Math.abs(lx),pz=hz-Math.abs(lz);if(px<pz)ox=(px+r)*(lx<0?-1:1);else oz=(pz+r)*(lz<0?-1:1);}p.x+=ox*c+oz*s;p.z+=oz*c-ox*s;};
  const run=()=>{if(this.ghost)return;for(const q of L.people){if(q===this||!q.alive||q.gone||q.hidden||q.vehicle||q.ghost)continue;const dx=p.x-q.pos.x,dz=p.z-q.pos.z,d2=dx*dx+dz*dz;if(d2>=.3136||Math.abs(q.pos.y-y)>1.2)continue;const d=Math.sqrt(d2),o=.56-d;if(d>1e-4){p.x+=dx/d*o;p.z+=dz/d*o;}else p.x+=o*(this.side||1);}
   if(!this.path.length&&this.act==='sit')return;const wy=this.path.length?Math.max(y,this.path[0].y):y;for(const c of W.near(p.x,p.z)){const top=c.cy+c.hy;if(!c.on||top<=wy+.6||c.cy-c.hy>=y+1.7)continue;if(c.walk&&c.hy<.3&&top<=y+1){const dx=p.x-c.cx,dz=p.z-c.cz;if(Math.abs(dx*c.c-dz*c.s)<c.hx&&Math.abs(dx*c.s+dz*c.c)<c.hz)p.y=top;continue;}box(c.cx,c.cz,c.hx,c.hz,c.c,c.s);}
   for(const v of L.vehicles){const b=v.body;if(!b||v.gone||v===this.escapeV||v.dims.boat||v.type==='heli'||Math.abs(v.pos.x-p.x)>9||Math.abs(v.pos.z-p.z)>9||v.pos.y+b.oy+b.hy<y+.6||v.pos.y+b.oy-b.hy>y+1.7)continue;box(v.pos.x,v.pos.z,b.hx,b.hz,Math.cos(v.yaw),Math.sin(v.yaw));}};
  run();if(!this.path.length||sp<=0){if(!this.path.length)this.wp=null,this.ghost=false;return sp;}const t=this.path[0];if(this.wp!==t){this.wp=t;this.best=1e9;this.stk=0;this.ghost=false;}if(!this.side)this.side=L.rand()<.5?-1:1;
  let ux=t.x-x0,uz=t.z-z0;const D=Math.hypot(ux,uz)||1;ux/=D;uz/=D;const step=sp*dt;
  if((p.x-x0)*ux+(p.z-z0)*uz<step*.3){p.x+=uz*this.side*step*.8;p.z-=ux*this.side*step*.8;run();}
  const d=Math.hypot(t.x-p.x,t.z-p.z);if(d<this.best-.25){this.best=d;this.stk=0;}else if(d<1.2&&this.stk>.5){this.path.shift();if(!this.path.length)this.arrive();}else if((this.stk+=dt)>4){if(this.state==='wander'){this.path=[];this.arrive();}else if(this.state==='follow')this.path=[];else this.ghost=true;this.stk=0;}else if(this.stk>1.8&&this.stk-dt<=1.8)this.side=-this.side;
  return Math.min(sp,Math.hypot(p.x-x0,p.z-z0)/Math.max(dt,1e-4));}
 turn(a,dt,rate){let d=a-this.yaw;d=((d+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;this.yaw+=clamp(d,-rate*dt,rate*dt);}
 seatPos(){const v=this.vehicle,s=v.dims.seats[this.seat]||v.dims.seats[0];const p=new V(s[0],s[1]-.49,s[2]).applyMatrix4(v.g.matrixWorld);this.pos.copy(p);this.yaw=v.yaw+(v.type==='chair'?0:0);this.rig.root.position.copy(p);this.rig.root.rotation.set(0,this.yaw,0);
  if(v.type!=='chair'&&v.g.rotation.z)this.rig.root.rotation.z=v.g.rotation.z;}
 arrive(){if(this.onArrive){const f=this.onArrive;this.onArrive=null;f();return;}
  if(this.state==='routine'){const st=this.routine[this.ri];if(st){this.act=st.act||'idle';this.wait=st.wait??5;this.faceP=st.face?this.L.pt(st.face):null;}}
  else if(this.state==='wander'){this.act=pick(this.acts,this.L.rand);this.wait=6+this.L.rand()*14;this.faceP=null;if(this.act==='talk'){const n=this.L.nearest(this.pos,6,p=>p!==this&&p.alive);if(n)this.faceP=n.pos.clone();}}
  else if(this.state==='panic'){if(this.exitHide){this.hide();}else{this.act='cower';this.wait=1e9;}}
  else if(this.state==='investigate'){this.act='look';this.wait=5+this.L.rand()*4;}
  else if(this.state==='flee'||this.state==='depart'){this.reachEscape();}}
 next(){const r=this.routine;if(!r||!r.length){this.state='idle';return;}this.ri++;if(this.ri>=r.length){if(this.s.loop===false){this.ri=r.length-1;this.wait=1e9;return;}this.ri=0;}const st=r[this.ri];this.run=!!st.run;this.ski=!!st.ski;if(st.spd)this.skiSpd=st.spd;this.ski=!!st.ski;if(st.spd)this.skiSpd=st.spd;
  if(st.to){this.goTo(st.to,st.via);this.act='idle';}else{this.act=st.act||'idle';this.wait=st.wait??5;this.faceP=st.face?this.L.pt(st.face):null;}if(st.do)st.do(this);}
 brain(dt,t){const L=this.L,G=L.G;
  switch(this.state){
   case'idle':this.wait-=dt;break;
   case'routine':if(!this.path.length){this.wait-=dt;if(this.wait<=0)this.next();}break;
   case'wander':if(!this.path.length){this.wait-=dt;if(this.wait<=0){const z=this.zone;const s=z.spots[Math.floor(L.rand()*z.spots.length)];this.goTo(new V(s[0]+(L.rand()-.5)*(z.jit??2),z.y??this.pos.y,s[1]+(L.rand()-.5)*(z.jit??2)));this.act='idle';}}break;
   case'alert':this.wait-=dt;this.act='look';if(this.role==='guard')this.act='guard';if(this.wait<=0)this.resume();break;
   case'investigate':if(!this.path.length){this.wait-=dt;if(this.wait<=0)this.resume();}break;
   case'panic':if(!this.path.length&&this.act!=='cower')this.act='cower';break;
   case'combat':{this.act='aim';this.faceP=G.perchPos();this.lookP=null;this.fireT-=dt;this.losT-=dt;if(this.losT<=0){this.losT=.6+R()*.4;this.los=L.world.los(this.eye,G.perchPos());}
    if(this.fireT<=0){this.fireT=1.2+R()*2.2;if(this.los)G.guardFire(this);}break;}
   case'handoff':this.wait-=dt;this.act='talk';if(this.wait<=0){this.state='routine';this.ri=-1;this.routine=this.s.after||[{to:this.s.at,act:'idle',wait:1e9}];this.s.loop=false;this.next();}break;
   case'seek':{const tg=L.byId(this.s.meet);if(!tg||!tg.alive){this.state='routine';this.resume();break;}const d=this.pos.distanceTo(tg.pos);
    if(d<1.9){this.path=[];this.state='handoff';this.wait=5;this.faceP=tg.pos.clone();tg.handoff(this);G.handoff(this,tg);}else if(!this.path.length||this.react<=0){this.react=.8;this.setPath([tg.pos]);}break;}
   case'ride':break;
   case'follow':{const tg=L.byId(this.s.follow);if(!tg||!tg.alive){this.engage();break;}if(tg.vehicle){this.act='guard';break;}const off=this.s.off||[1.2,-1.4];const c=Math.cos(tg.yaw),sn=Math.sin(tg.yaw);const want=new V(tg.pos.x+off[0]*c+off[1]*sn,tg.pos.y,tg.pos.z-off[0]*sn+off[1]*c);
    this.react-=0;if(this.pos.distanceTo(want)>1.4&&(!this.path.length||this.react<=0)){this.react=.5;this.setPath([want]);this.run=tg.run;}this.act='guard';this.lookP=null;this.faceP=tg.pos.clone().add(new V(Math.sin(tg.yaw)*4,0,Math.cos(tg.yaw)*4));break;}}
  if(this.role==='courier'&&this.state==='routine'&&this.s.meet&&this.ri>=this.routine.length-1&&!this.path.length&&!this.didHand){this.state='seek';this.didHand=true;}}
 handoff(c){if(this.state==='routine'||this.state==='wander'||this.state==='idle'){this.saved={state:this.state,path:this.path.slice(),wait:this.wait};this.path=[];this.act='talk';this.faceP=c.pos.clone();this.state='alert';this.wait=5;this.lookP=c.pos.clone();}}
 resume(){this.lookP=null;this.run=false;if(this.saved){const s=this.saved;this.saved=null;this.state=s.state;this.path=s.path;this.wait=s.wait;if(this.state==='routine'&&!this.path.length&&this.ri>=0){const st=this.routine[this.ri];if(st&&st.to)this.goTo(st.to,st.via);}return;}
  this.state=this.home;if(this.state==='routine'){this.ri=Math.max(-1,this.ri-1);this.wait=0;this.path=[];}}
 // ---------------- reactions ----------------
 startle(src,strength){if(!this.alive||this.vehicle||this.hidden||this.state==='panic'||this.state==='flee'||this.state==='combat'||this.state==='depart')return;const L=this.L;
  if(this.role==='guard'){if(this.state!=='investigate'){this.saved=this.saved||{state:this.state,path:this.path.slice(),wait:this.wait};}this.state='investigate';this.run=strength>1;this.setPath([src.clone().add(new V((L.rand()-.5)*3,0,(L.rand()-.5)*3))]);this.lookP=src.clone();return;}
  if(strength>1.2||(this.role==='civ'||this.role==='staff')&&strength>.7)return this.panic(src);
  if(this.state!=='alert'){this.saved=this.saved||{state:this.state,path:this.path.slice(),wait:this.wait};}this.path=[];this.state='alert';this.wait=3+L.rand()*4;this.lookP=src.clone();}
 panic(src){if(!this.alive||this.vehicle||this.state==='panic')return;const L=this.L;if(this.isTarget||this.role==='courier'){if(this.isTarget)return L.flee(this);}
  if(this.role==='guard')return this.engage();this.state='panic';this.run=true;this.runSpd=4.4+L.rand()*.6;this.saved=null;const ex=L.nearestExit(this.pos,src);if(ex){this.exitHide=ex.hide;this.goTo(ex.p,ex.via&&this.pos.y>ex.p.y+3?ex.via:null);}else{this.path=[];this.act='cower';}
  if(L.rand()<.5)L.G.scream(this.pos);}
 engage(){if(!this.alive||this.vehicle||this.state==='combat')return;this.state='combat';this.path=[];this.saved=null;this.fireT=1.5+R()*2.5;this.losT=0;}
 hide(){this.hidden=true;this.gone=true;this.rig.root.visible=false;}
 reachEscape(){const L=this.L;const v=this.escapeV;if(v&&v.alive&&!v.disabled){v.board(this);if(this.isTarget&&!L.G.M.waitAll)v.depart();}else{this.act='cower';this.state='panic';}}
 // ---------------- damage ----------------
 kill(info){if(!this.alive)return;this.alive=false;this.deathInfo=info;this.path=[];const L=this.L;this.rig.setProp('phone',false);this.rig.setProp('cig',false);
  if(this.vehicle){this.rig.T.fill(0);return;}
  const imp=info.dir?info.dir.clone().multiplyScalar(info.force||3.5):new V();imp.y+=info.lift||.6;this.rig.startRagdoll(L.world,imp,info.part||'torso',info.extra||this.vel.clone().multiplyScalar(.8));
  for(const k of['rifle','umbrella','drink','briefcase','clipboard'])if(this.rig.props[k]&&k!=='briefcase'&&k!=='clipboard')this.rig.props[k].visible=false;}
 // hit volumes in world space (cached per frame)
 hitVolumes(){const L=this.L;if(this.hvT===L.frame&&this.hv)return this.hv;const b=this.rig.bones;this.rig.root.updateMatrixWorld(true);const w=i=>b[i].getWorldPosition(new V());const loc=(i,y)=>new V(0,y,0).applyMatrix4(b[i].matrixWorld);
  const hv={head:loc(4,.16),neck:w(4),hips:w(1),chest:loc(3,.15),eL:loc(6,0),eR:loc(8,0),hL:loc(6,-.3),hR:loc(8,-.3),sL:w(5),sR:w(7),kL:w(10),kR:w(12),fL:loc(10,-.45),fR:loc(12,-.45),thL:w(9),thR:w(11)};this.hv=hv;this.hvT=L.frame;return hv;}
 // segment a→b (V) → {t, part} or null
 hit(a,b){if(this.gone||this.hidden&&this.s.hiddenUntil)return null;const c=this.rig.rag?this.rig.rag.pts[0]:this.pos;const mx=a.x-b.x,mz=a.z-b.z;
  // coarse: distance from body centre to the segment
  const cx=c.x,cy=(c.y+(this.rig.rag?0:1)),cz=c.z;if(segPt(a,b,cx,cy,cz)>2.6)return null;const s=this.rig.h||1;const hv=this.hitVolumes();let best=null;
  const test=(t,part)=>{if(t!==null&&t>=0&&t<=1&&(!best||t<best.t))best={t,part};};
  test(segSphere(a,b,hv.head,.125*s),'head');test(segCap(a,b,hv.hips,hv.chest,.19*s),'torso');test(segCap(a,b,hv.chest,hv.neck,.15*s),'torso');
  test(segCap(a,b,hv.sL,hv.hL,.065*s),'arm');test(segCap(a,b,hv.sR,hv.hR,.065*s),'arm');test(segCap(a,b,hv.thL,hv.kL,.09*s),'leg');test(segCap(a,b,hv.thR,hv.kR,.09*s),'leg');test(segCap(a,b,hv.kL,hv.fL,.07*s),'leg');test(segCap(a,b,hv.kR,hv.fR,.07*s),'leg');
  return best;}
 remove(){this.L.scene.remove(this.rig.root);this.rig.mesh.geometry.dispose();}
}
// ---- segment geometry helpers ----
const _d=new V(),_m=new V();
function segPt(a,b,x,y,z){_d.subVectors(b,a);const l2=_d.lengthSq()||1e-9;let t=((x-a.x)*_d.x+(y-a.y)*_d.y+(z-a.z)*_d.z)/l2;t=clamp(t,0,1);return Math.hypot(a.x+_d.x*t-x,a.y+_d.y*t-y,a.z+_d.z*t-z);}
export function segSphere(a,b,c,r){_d.subVectors(b,a);const L=_d.length();if(L<1e-9)return null;const dx=_d.x/L,dy=_d.y/L,dz=_d.z/L;const ox=a.x-c.x,oy=a.y-c.y,oz=a.z-c.z;const B=ox*dx+oy*dy+oz*dz,C=ox*ox+oy*oy+oz*oz-r*r,D=B*B-C;if(D<0)return null;const t=-B-Math.sqrt(D);if(t<0&&C>0)return null;return Math.max(0,t)/L;}
export function segCap(a,b,p,q,r){// sample-based capsule test (accurate enough for 2-4 m bullet sub-steps)
 _d.subVectors(b,a);const L=_d.length();if(L<1e-9)return null;let best=null;const n=Math.max(2,Math.ceil(L/.04));
 // closest approach between segment ab and segment pq
 const u=_d,v=_m.subVectors(q,p),w0x=a.x-p.x,w0y=a.y-p.y,w0z=a.z-p.z;const A=u.dot(u),Bv=u.x*v.x+u.y*v.y+u.z*v.z,Cv=v.dot(v),D=u.x*w0x+u.y*w0y+u.z*w0z,E=v.x*w0x+v.y*w0y+v.z*w0z;const den=A*Cv-Bv*Bv;
 let sc,tc;if(den<1e-9){sc=0;tc=Cv>0?E/Cv:0;}else{sc=(Bv*E-Cv*D)/den;tc=(A*E-Bv*D)/den;}sc=clamp(sc,0,1);tc=clamp(tc,0,1);
 const px=a.x+u.x*sc-(p.x+v.x*tc),py=a.y+u.y*sc-(p.y+v.y*tc),pz=a.z+u.z*sc-(p.z+v.z*tc);const dist=Math.hypot(px,py,pz);if(dist>r)return null;
 return Math.max(0,sc-Math.sqrt(Math.max(0,r*r-dist*dist))/L);}

// ============================== VEHICLE ==============================
export class Vehicle{
 constructor(L,s){this.L=L;this.s=s;this.id=s.id;this.type=s.type;this.alive=true;this.disabled=false;this.gone=false;this.engineHP=s.engineHP??2;this.occ=[];
  if(s.type==='chair'){this.g=new THREE.Group();const m=L.world.mat('darksteel');const seat=new THREE.Mesh(new THREE.BoxGeometry(1.4,.12,.6),m);seat.position.y=-.1;seat.castShadow=true;this.g.add(seat);const back=new THREE.Mesh(new THREE.BoxGeometry(1.4,.6,.08),m);back.position.set(0,.2,-.3);this.g.add(back);
   const bar=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.2,5),m);bar.position.y=1.1;this.g.add(bar);this.dims={seats:[[.35,.38,.05],[-.35,.38,.05]],L:1.4,W:.6,H:.6};this.wheels=[];}
  else{const M=vehicleModel(s.type,s.color);this.g=M.g;this.dims=M.dims;this.wheels=M.wheels;}
  L.scene.add(this.g);this.path=(s.path||[]).map(p=>L.pt(p));this.leave=s.leave?s.leave.map(p=>L.pt(p)):null;this.spd=0;this.vmax=s.speed||12;this.dist=s.startDist||0;this.state=s.state||'park';this.wait=0;this.stops=s.stops||{};this.loop=!!s.loop;this.yaw=s.yaw||0;this.pos=new V();
  this.segs=[];this.buildSegs();if(this.path.length)this.placeAt(this.dist);else if(s.at){const p=L.pt(s.at);this.pos.copy(p);if(!this.dims.boat&&s.type!=='chair')this.pos.y=L.world.groundAt(p.x,p.z,p.y+1);this.g.position.copy(this.pos);this.g.rotation.y=this.yaw;}
  this.cols=[];if(s.type!=='chair'){const d=this.dims;this.body={hx:d.W/2,hy:(d.H*.45)/2,hz:d.L/2,oy:d.H*.45/2+.2,matK:'metal',owner:this,part:'body'};this.cabin={hx:d.cabin[3],hy:d.cabin[4],hz:d.cabin[5],ox:d.cabin[0],oy:d.cabin[1],oz:d.cabin[2],matK:'glass',owner:this,part:'cabin'};
   this.eng={hx:d.engine[3],hy:d.engine[4],hz:d.engine[5],ox:d.engine[0],oy:d.engine[1],oz:d.engine[2],matK:'metal',owner:this,part:'engine'};this.fuel={hx:d.fuel[3],hy:d.fuel[4],hz:d.fuel[5],ox:d.fuel[0],oy:d.fuel[1],oz:d.fuel[2],matK:'metal',owner:this,part:'fuel'};this.cols=[this.eng,this.fuel,this.cabin,this.body];}
  this.smokeT=0;this.fuelHP=s.fuelHP??(s.type==='truck'?1:2);this.bob=L.rand()*6;}
 buildSegs(){this.segs=[];let acc=0;const P=this.path;for(let i=0;i<P.length-1;i++){const l=P[i].distanceTo(P[i+1]);this.segs.push({a:P[i],b:P[i+1],l,s0:acc});acc+=l;}if(this.loop&&P.length>1){const l=P[P.length-1].distanceTo(P[0]);this.segs.push({a:P[P.length-1],b:P[0],l,s0:acc});acc+=l;}this.total=acc;}
 pointAt(d){if(!this.segs.length)return{p:this.pos.clone(),dir:new V(0,0,1)};if(this.loop)d=((d%this.total)+this.total)%this.total;else d=clamp(d,0,this.total);let s=this.segs[this.segs.length-1];for(const g of this.segs)if(d<=g.s0+g.l){s=g;break;}
  const t=s.l?(d-s.s0)/s.l:0;return{p:new V().lerpVectors(s.a,s.b,t),dir:new V().subVectors(s.b,s.a).normalize(),seg:s};}
 placeAt(d){const{p,dir}=this.pointAt(d);const ahead=this.pointAt(d+(this.type==='chair'?.1:3)).p;this.pos.copy(p);const W=this.L.world;
  if(this.dims.boat){this.pos.y=W.waterY+Math.sin(this.L.t*1.3+this.bob)*.08;}else if(this.type==='chair'||this.type==='heli'||this.s.fly){}else this.pos.y=W.groundAt(p.x,p.z,p.y+1.5);
  const ty=Math.atan2(ahead.x-p.x,ahead.z-p.z);if(this.type!=='chair'){let dd=ty-this.yaw;dd=((dd+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;this.yaw+=dd*Math.min(1,(this.L.dt||.016)*3.5);}else this.yaw=this.s.yaw||0;
  this.g.position.copy(this.pos);this.g.rotation.set(this.dims.boat?Math.sin(this.L.t*1.1+this.bob)*.02-this.spd*.004:0,this.yaw,this.dims.boat?Math.sin(this.L.t*.9+this.bob)*.025:0);}
 update(dt,t){if(this.gone)return;const L=this.L;
  if(this.type==='heli'&&this.dims.rotor){const on=this.state!=='park'||this.spin;this.rs=(this.rs||0)+((on?1:0)-(this.rs||0))*dt*.5;this.dims.rotor.rotation.y+=dt*this.rs*28;this.dims.tail.rotation.x+=dt*this.rs*40;}
  if(this.state==='drive'||this.state==='leave'){const stopAt=this.nextStop();let target=this.vmax;if(this.disabled)target=0;if(stopAt!==null){const d=stopAt-this.dist;target=Math.min(target,Math.sqrt(Math.max(0,2*4*(d-.2))));}
   const acc=target>this.spd?3:6;this.spd+=clamp(target-this.spd,-acc*dt,acc*dt);this.dist+=this.spd*dt;if(stopAt!==null&&this.dist>=stopAt-.3){this.dist=stopAt;this.spd=0;this.state='wait';this.wait=this.stops[this.stopKey];this.waited=this.stopKey;}
   if(!this.loop&&this.dist>=this.total-.05){this.dist=this.total;this.spd=0;this.state=this.state==='leave'?'gone':'park';if(this.state==='gone')this.vanish();if(this.onEnd){const f=this.onEnd;this.onEnd=null;f(this);}}
   if(this.type==='heli'&&this.state==='leave'){}this.placeAt(this.dist);}
  else if(this.state==='wait'){this.wait-=dt;if(this.wait<=0&&!this.hold){this.state='drive';}if(this.dims.boat)this.placeAt(this.dist);}
  else if(this.dims.boat&&this.path.length)this.placeAt(this.dist);else if(this.dims.boat){this.g.position.y=L.world.waterY+Math.sin(t*1.3+this.bob)*.08;this.g.rotation.x=Math.sin(t*1.1+this.bob)*.02;this.g.rotation.z=Math.sin(t*.9+this.bob)*.025;}
  for(const w of this.wheels)w.children[0].rotation.x=w.children[1].rotation.x=0,w.rotation.x+=this.spd*dt/.38;
  this.g.updateMatrixWorld(true);
  if(this.disabled){this.smokeT-=dt;if(this.smokeT<=0){this.smokeT=.12;const p=this.local(this.eng.ox,this.eng.oy+.4,this.eng.oz);L.G.fx.smoke(p,this.destroyed?2.4:1.2,this.destroyed);}}}
 nextStop(){let best=null;for(const k in this.stops){const d=+k;if(d>this.dist-.5&&(best===null||d<best)&&this.waited!==k){best=d;this.stopKey=k;}}return best;}
 local(x,y,z){return new V(x,y,z).applyMatrix4(this.g.matrixWorld);}
 go(){if(this.state==='park'||this.state==='wait'){this.state='drive';this.hold=false;}}
 depart(){if(this.disabled||this.gone)return;const L=this.L;if(this.leave){this.path=[this.pos.clone(),...this.leave];this.loop=false;this.buildSegs();this.dist=0;this.stops=this.s.leaveStops||{};this.waited=null;}this.state='leave';this.spin=true;this.departing=true;}
 board(p){const used=new Set(this.occ.map(o=>o.seat));let seat=0;while(used.has(seat))seat++;if(seat>=this.dims.seats.length)seat=this.dims.seats.length-1;p.vehicle=this;p.seat=seat;p.path=[];p.state='ride';this.occ.push(p);}
 unload(){for(const p of this.occ){if(!p.alive)continue;p.vehicle=null;const side=p.seat%2?-1:1;p.pos.copy(this.local(side*(this.dims.W/2+.7),0,this.dims.seats[p.seat][2]));p.pos.y=this.L.world.groundAt(p.pos.x,p.pos.z,p.pos.y+2);p.prevPos.copy(p.pos);p.rig.root.rotation.z=0;}this.occ=this.occ.filter(p=>!p.alive);}
 vanish(){this.gone=true;this.g.visible=false;for(const p of this.occ){p.gone=true;p.rig.root.visible=false;}}
 // world-space OBB tests for bullets: returns {t,part,col} or null
 hit(a,b){if(this.gone)return null;const d=this.dims;if(Math.hypot(a.x-this.pos.x,a.z-this.pos.z)>Math.max(d.L,30)+Math.hypot(b.x-a.x,b.z-a.z))return null;let best=null;const c=Math.cos(this.yaw),s=Math.sin(this.yaw);
  for(const k of this.cols){const ctr=this.local(k.ox||0,k.oy,k.oz||0);const box={cx:ctr.x,cy:ctr.y,cz:ctr.z,hx:k.hx,hy:k.hy,hz:k.hz,c,s};const h=rayBoxSeg(a,b,box);if(h!==null&&(!best||h<best.t-.0001))best={t:h,part:k.part,col:k};}return best;}
 damage(part,power,G){if(!this.alive)return;if(part==='engine'){this.engineHP-=power>=4?2:1;G.fx.sparks(this.local(this.eng.ox,this.eng.oy,this.eng.oz),18);if(this.engineHP<=0&&!this.disabled){this.disable(G);}}
  else if(part==='fuel'){this.fuelHP-=power>=4?2:1;if(this.fuelHP<=0)G.explode(this.local(this.fuel.ox,this.fuel.oy,this.fuel.oz),this.type==='truck'?14:8,{accident:true,src:this});else G.fx.sparks(this.local(this.fuel.ox,this.fuel.oy,this.fuel.oz),10);}}
 disable(G,boom){if(this.disabled)return;this.disabled=true;this.hold=true;if(boom){this.destroyed=true;this.alive=false;this.g.traverse(o=>{if(o.isMesh&&o.material&&o.material.color&&!o.material.isMeshBasicMaterial){o.material=o.material.clone();o.material.color.multiplyScalar(.18);o.material.metalness=.2;o.material.roughness=1;}});}
  G.vehicleDisabled(this);if(this.state==='leave'||this.state==='drive'){}const L=this.L;setTimeout0(L,()=>{this.unload();for(const p of L.people)if(p.alive&&!p.vehicle&&p.pos.distanceTo(this.pos)<6&&p.lastVeh===this)p.panic(this.pos);},this.spd>1?1.2:.6);}
}
function setTimeout0(L,f,d){L.timers.push({t:d,f});}
function rayBoxSeg(a,b,c){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;const px=a.x-c.cx,pz=a.z-c.cz,lx=px*c.c-pz*c.s,lz=px*c.s+pz*c.c,ly=a.y-c.cy,ddx=dx*c.c-dz*c.s,ddz=dx*c.s+dz*c.c;let t0=0,t1=1;
 for(const[o,d,h]of[[lx,ddx,c.hx],[ly,dy,c.hy],[lz,ddz,c.hz]]){if(Math.abs(d)<1e-9){if(Math.abs(o)>h)return null;continue;}let ta=(-h-o)/d,tb=(h-o)/d;if(ta>tb){const q=ta;ta=tb;tb=q;}t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1)return null;}return t0;}

// ============================== HAZARD / OBJECT ==============================
export class Hazard{
 constructor(L,s){this.L=L;this.s=s;this.id=s.id;this.kind=s.kind;this.r=s.r||7;this.p=L.pt(s.at);this.used=false;this.hp=s.hp||1;const W=L.world;this.g=new THREE.Group();this.g.position.copy(this.p);L.scene.add(this.g);
  const std=o=>new THREE.MeshStandardMaterial(o);const add=(geo,m,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;this.g.add(o);return o;};
  if(this.kind==='gas'){add(new THREE.CylinderGeometry(.3,.3,1.1,14),std({color:0xd8dcdc,metalness:.6,roughness:.3}),0,.6,0);add(new THREE.SphereGeometry(.3,14,8,0,Math.PI*2,0,Math.PI/2),std({color:0xd8dcdc,metalness:.6,roughness:.3}),0,1.15,0);add(new THREE.CylinderGeometry(.12,.12,.18,8),std({color:0x2a2a2a}),0,1.42,0);add(new THREE.BoxGeometry(.62,.08,.02),std({color:0xc02a20}),0,.8,.3);this.col=W.collider(this.p.x,this.p.y+.7,this.p.z,.32,.72,.32,0,false,'metal',this);}
  else if(this.kind==='barrels'){const m=std({color:0xb83a1a,metalness:.5,roughness:.6});for(const[x,z]of[[0,0],[.65,.1],[.3,.62],[-.4,.5],[-.3,-.55]])add(new THREE.CylinderGeometry(.3,.3,.9,12),m,x,.45,z);add(new THREE.CylinderGeometry(.3,.3,.9,12),m,.2,1.35,.2);this.col=W.collider(this.p.x+.1,this.p.y+.7,this.p.z+.1,.75,.7,.75,0,false,'metal',this);}
  else if(this.kind==='tank'){const m=std({color:0xe0e0d8,metalness:.6,roughness:.35});add(new THREE.CylinderGeometry(1.6,1.6,6,18),m,0,2,0,0,0,Math.PI/2);for(const x of[-2,2])add(new THREE.BoxGeometry(.3,1.4,2.4),std({color:0x3a3a3a}),x,.7,0);add(new THREE.BoxGeometry(2,.5,.05),std({color:0xd02a20,emissive:0x200000}),0,2.2,1.62);this.col=W.collider(this.p.x,this.p.y+2,this.p.z,3,1.6,1.6,0,true,'metal',this);this.g.rotation.y=s.ry||0;this.col.c=Math.cos(s.ry||0);this.col.s=Math.sin(s.ry||0);}
  else if(this.kind==='gen'){add(new THREE.BoxGeometry(1.6,1.1,1),std({color:0xd8a020,metalness:.4,roughness:.5}),0,.55,0);add(new THREE.CylinderGeometry(.08,.08,.6,6),std({color:0x2a2a2a}),.5,1.3,0);this.col=W.collider(this.p.x,this.p.y+.55,this.p.z,.8,.55,.5,0,true,'metal',this);}
  else if(this.kind==='load'){// crane load hanging on a cable from height s.top
   const top=s.top;this.hang=top-this.p.y;const crate=add(new THREE.BoxGeometry(2.4,1.6,2.4),std({color:0x5a6a7a,metalness:.5,roughness:.6}),0,.8,0);add(new THREE.BoxGeometry(2.42,.2,2.42),std({color:0xd8a020}),0,1.5,0);this.crate=this.g;
   const cg=new THREE.CylinderGeometry(.03,.03,1,5);cg.translate(0,.5,0);this.cable=new THREE.Mesh(cg,std({color:0x222222,metalness:.8}));this.cable.position.set(this.p.x,this.p.y+1.6,this.p.z);this.cable.scale.y=top-this.p.y-1.6;L.scene.add(this.cable);
   this.hook=new THREE.Mesh(new THREE.BoxGeometry(.5,.6,.5),std({color:0xd8a020,metalness:.5}));this.hook.position.set(this.p.x,this.p.y+2.3,this.p.z);this.hook.castShadow=true;L.scene.add(this.hook);
   this.col=W.collider(this.p.x,this.p.y+2.3,this.p.z,.35,.4,.35,0,false,'metal',this);this.col2=W.collider(this.p.x,this.p.y+.8,this.p.z,1.2,.8,1.2,0,false,'metal',null);this.vy=0;}
  else if(this.kind==='charge'){add(new THREE.BoxGeometry(.8,.6,.6),std({color:0xc02a20,metalness:.3,roughness:.5}),0,.3,0);add(new THREE.CylinderGeometry(.04,.04,1.2,5),std({color:0x222}),.3,.9,0);add(new THREE.SphereGeometry(.06,6,5),new THREE.MeshBasicMaterial({color:0xff3020}),.3,1.5,0);this.col=W.collider(this.p.x,this.p.y+.3,this.p.z,.45,.35,.35,0,false,'metal',this);}
  this.blink=0;}
 trigger(G){if(this.used)return;this.used=true;const L=this.L;
  if(this.kind==='load'){this.falling=true;this.col.on=false;G.fx.sparks(this.hook.position,20);G.snd.play('snap');return;}
  if(this.kind==='charge'){G.explode(this.p.clone().add(new V(0,.5,0)),3,{accident:true,src:this,quiet:true});G.avalanche(this);this.g.visible=false;return;}
  this.g.visible=false;this.col.on=false;G.explode(this.p.clone().add(new V(0,1,0)),this.r,{accident:true,src:this});}
 update(dt){if(this.falling){this.vy+=9.81*dt;const g=this.g;g.position.y-=this.vy*dt;this.hook.position.y-=this.vy*dt;this.col2.cy=g.position.y+.8;
   const gy=this.L.world.groundAt(g.position.x,g.position.z,g.position.y+1.5);if(g.position.y<=gy){g.position.y=gy;this.falling=false;this.landed=true;this.L.G.crush(this,new V(g.position.x,gy,g.position.z),this.s.r||3.2);this.hook.position.y=gy+1.6;}}
  if(this.kind==='charge'&&!this.used){this.blink+=dt;this.g.children[2].visible=this.blink%1<.5;}}
}
export class Obj{
 constructor(L,s){this.L=L;this.s=s;this.id=s.id;this.hp=s.hp||1;this.p=L.pt(s.at);this.alive=true;const std=o=>new THREE.MeshStandardMaterial(o);this.g=new THREE.Group();this.g.position.copy(this.p);this.g.rotation.y=s.ry||0;L.scene.add(this.g);
  const add=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;this.g.add(o);return o;};const sz=s.size||[.8,1,.5];
  if(s.kind==='relay'){add(new THREE.BoxGeometry(sz[0],sz[1],sz[2]),std({color:0xc8ccd0,metalness:.6,roughness:.4}),0,sz[1]/2,0);add(new THREE.CylinderGeometry(.03,.03,1.6,5),std({color:0x333}),.2,sz[1]+.8,0);this.led=add(new THREE.SphereGeometry(.05,6,5),new THREE.MeshBasicMaterial({color:0x40ff60}),-.2,sz[1]*.8,sz[2]/2+.02);}
  else if(s.kind==='motor'){add(new THREE.BoxGeometry(sz[0],sz[1],sz[2]),std({color:0x3a6a9a,metalness:.5,roughness:.5}),0,sz[1]/2,0);add(new THREE.CylinderGeometry(sz[1]*.4,sz[1]*.4,sz[0]*1.1,14),std({color:0x8a9098,metalness:.8,roughness:.3}),0,sz[1]*.55,0).rotation.z=Math.PI/2;this.led=add(new THREE.SphereGeometry(.07,6,5),new THREE.MeshBasicMaterial({color:0x40ff60}),0,sz[1]+.05,sz[2]/2);}
  const c=Math.cos(s.ry||0),sn=Math.sin(s.ry||0);this.col=L.world.collider(this.p.x,this.p.y+sz[1]/2,this.p.z,sz[0]/2,sz[1]/2,sz[2]/2,s.ry||0,false,'metal',this);}
 damage(G){if(!this.alive)return;this.hp--;G.fx.sparks(this.p.clone().add(new V(0,.6,0)),24);if(this.hp<=0){this.alive=false;if(this.led)this.led.material=new THREE.MeshBasicMaterial({color:0xff2010});this.g.children[0].material=this.g.children[0].material.clone();this.g.children[0].material.color.multiplyScalar(.3);G.objDestroyed(this);}}
 update(dt){if(!this.alive){this.st=(this.st||0)-dt;if(this.st<=0){this.st=.25;this.L.G.fx.smoke(this.p.clone().add(new V(0,1,0)),.8,false);}}}
}

// ============================== LEVEL (api for missions) ==============================
export class Level{
 constructor(G,world,scene,seed=1){this.G=G;this.world=world;this.scene=scene;this.rand=rng(seed);this.nodes={};this.zones={};this.people=[];this.vehicles=[];this.hazards=[];this.objs=[];this.exits=[];this.timers=[];this.t=0;this.frame=0;this.dt=.016;}
 pt(p){if(p instanceof V)return p.clone();if(typeof p==='string'){const n=this.nodes[p];if(!n)throw new Error('node '+p);return n.clone();}const y=p[1]===null||p[1]===undefined?this.world.groundAt(p[0],p[2]):p[1];return new V(p[0],y,p[2]);}
 node(n,x,y,z){this.nodes[n]=new V(x,y===null||y===undefined?this.world.groundAt(x,z):y,z);return this.nodes[n];}
 zone(n,spots,o={}){this.zones[n]={spots,...o};}
 exit(x,y,z,hide=true,via=null){this.exits.push({p:this.pt([x,y,z]),hide,via});}
 person(s){const p=new Person(this,s);this.people.push(p);return p;}
 vehicle(s){const v=new Vehicle(this,s);this.vehicles.push(v);return v;}
 hazard(s){const h=new Hazard(this,s);this.hazards.push(h);return h;}
 obj(s){const o=new Obj(this,s);this.objs.push(o);return o;}
 byId(id){return this.people.find(p=>p.id===id)||this.vehicles.find(v=>v.id===id)||this.hazards.find(h=>h.id===id)||this.objs.find(o=>o.id===id);}
 nearest(pos,r,f){let b=null,bd=r;for(const p of this.people){if(!f(p))continue;const d=p.pos.distanceTo(pos);if(d<bd){bd=d;b=p;}}return b;}
 nearestExit(pos,away){let b=null,bd=1e9;for(const e of this.exits){let d=e.p.distanceTo(pos);if(away&&e.p.distanceTo(away)<pos.distanceTo(away)*.6)d*=2;if(d<bd&&d<90){bd=d;b=e;}}return b;}
 flee(p){if(!p.alive||p.state==='flee'||p.vehicle)return;const esc=this.G.M.escape;p.state='flee';p.saved=null;p.run=true;p.runSpd=4;const v=esc&&this.byId(esc.vehicle);p.escapeV=v;if(v){p.goTo(esc.board||v.pos,esc.via);if(esc.vehicleWait)v.hold=false;}else{p.path=[];p.act='cower';}}
 depart(p){if(!p.alive||p.vehicle||p.state==='flee'||p.state==='depart')return;const d=this.G.M.depart||this.G.M.escape;if(!d)return;const v=this.byId(d.vehicle);p.state='depart';p.saved=null;p.run=false;p.escapeV=v;p.lookP=null;if(v)p.goTo(d.board||v.pos,d.via);}
 update(dt,t){this.dt=dt;this.t=t;this.frame++;for(let i=this.timers.length-1;i>=0;i--){const tm=this.timers[i];tm.t-=dt;if(tm.t<=0){this.timers.splice(i,1);tm.f();}}
  for(const v of this.vehicles)v.update(dt,t);for(const p of this.people)p.update(dt,t);for(const h of this.hazards)h.update(dt);for(const o of this.objs)o.update(dt);
  // light separation
  const P=this.people;for(let i=0;i<P.length;i++){const a=P[i];if(!a.alive||a.vehicle||a.gone)continue;for(let j=i+1;j<P.length;j++){const b=P[j];if(!b.alive||b.vehicle||b.gone)continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d2=dx*dx+dz*dz;if(d2<.36&&d2>1e-6&&Math.abs(a.pos.y-b.pos.y)<1){const d=Math.sqrt(d2),k=(.6-d)*.5/d;a.pos.x-=dx*k;a.pos.z-=dz*k;b.pos.x+=dx*k;b.pos.z+=dz*k;a.place();b.place();}}}}
 dispose(){for(const p of this.people)p.remove();for(const v of this.vehicles)this.scene.remove(v.g);for(const h of this.hazards){this.scene.remove(h.g);if(h.cable)this.scene.remove(h.cable,h.hook);}for(const o of this.objs)this.scene.remove(o.g);}
}
