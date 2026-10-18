// NEON BAY — missions from map markers: taxi fares, package delivery, street races, time trials, photo hunts, escape the cops.
import {THREE,cl,wrapA,rng,fmtCash} from './util.js';
import {polyAt,poly,BEACH,WL,RW} from './world.js';
import {Vehicle,aiDrive,SPECS,trafficPaint} from './vehicles.js';
import {Beacon} from './fx.js';
import {randLook,newPose,animate} from './people.js';
import * as TX from './tex.js';

export const KIND={taxi:{col:0xffc61a,icon:'T',label:'TAXI SHIFT',job:'Pick up three fares and drive them across town. Speed and air time earn tips.'},delivery:{col:0x7dff6a,icon:'D',label:'PACKAGE RUN',job:'Three drop-offs, one ticking clock. Dents cost you.'},
 race:{col:0xff4d00,icon:'R',label:'STREET RACE',job:'Three rivals, one route. Podium pays, first pays big.'},trial:{col:0x36f0ff,icon:'C',label:'TIME TRIAL',job:'Checkpoints add time. Hit them all before the clock dies.'},
 photo:{col:0xff3fa4,icon:'P',label:'PHOTO HUNT',job:'Snap the cars on the list with P. Get close, keep it in frame.'},escape:{col:0x3d8bff,icon:'!',label:'HOT PURSUIT',job:'Three stars, right now. Shake the cops before time runs out.'},
 heist:{col:0xe8c15a,icon:'V',label:'ARMORED TAKEDOWN',job:'Ram a cash truck until the doors give, grab the bags, then shake three stars.'},boost:{col:0xc77dff,icon:'B',label:'BOOST TO ORDER',job:'A buyer wants a specific car off the curb. Steal it, keep it clean, bring it in cold.'},
 garage:{col:0x8a7cff,icon:'$',label:'GARAGE',job:'Buy new wheels.'},spray:{col:0xff8a3d,icon:'S',label:'SPRAY SHOP',job:'Respray $150: full repair and the cops lose your description.'},home:{col:0xffffff,icon:'H',label:'SAFEHOUSE',job:''},police:{col:0x3d8bff,icon:'',label:'',job:''}};
const PHOTO_T=[{d:'A YELLOW CABBY',t:v=>v.id==='cabby',b:'cabby'},{d:'A POLICE CRUISER',t:v=>v.id==='police',b:'police'},{d:'A SKIPJACK MOTORBIKE',t:v=>v.id==='skipjack',b:'skipjack'},{d:'A RED CAR',t:v=>{const c=new THREE.Color(v.paint);return c.r>.6&&c.g<.3&&c.b<.3;}},{d:'A HAULER PICKUP',t:v=>v.id==='hauler',b:'hauler'},
 {d:'A PARCEL VAN',t:v=>v.id==='parcel',b:'parcel'},{d:'A ZEPHYR R SUPERCAR',t:v=>v.id==='zephyr',b:'zephyr'},{d:'A BRUISER MUSCLE CAR',t:v=>v.id==='bruiser',b:'bruiser'},{d:'ANY CAR ON THE FREEWAY',t:v=>v.y>9},{d:'A CAR CATCHING AIR',t:v=>!v.onG&&v.air>.25}];

export class Missions{constructor(G){this.G=G;this.R=rng(808);this.active=null;this.done=0;this.passed=0;this.icons={};this.beacons=[];this.cool=0;
  for(const p of G.W.pois){const K=KIND[p.kind];if(!K.icon)continue;this.icons[p.kind]=this.icons[p.kind]||TX.iconTex(K.icon,'#'+new THREE.Color(K.col).getHexString());const b=new Beacon(G.scene,K.col,{icon:this.icons[p.kind],r:p.kind==='spray'?5:3,h:p.kind==='home'?12:28});p.beacon=b;
   p.y=G.W.groundBase(p.x,p.z);b.set(p.x,p.y,p.z);}
  this.pool=[];for(let i=0;i<4;i++)this.pool.push(new Beacon(G.scene,0xffffff,{r:4,h:40}));this.arch=new Beacon(G.scene,0xff4d00,{r:8,h:30,arch:9});this.next=new Beacon(G.scene,0xff4d00,{r:5,h:16});}
 // the nearest interactable marker
 nearPOI(){const G=this.G;if(this.active)return null;let best=null,bd=1e9;for(const p of G.W.pois){if(!p.beacon||!p.beacon.g.visible)continue;const d=Math.hypot(p.x-G.player.x,p.z-G.player.z);const r=p.kind==='spray'?6:4.2;if(d<r&&d<bd&&Math.abs(G.player.y-p.y)<3){bd=d;best=p;}}return best;}
 update(dt){const G=this.G;this.cool-=dt;for(const p of G.W.pois)if(p.beacon){p.beacon.g.visible=!this.active&&p.kind!=='police';p.beacon.update(dt,G.cam.position);}
  for(const b of this.pool)b.update(dt,G.cam.position);this.arch.update(dt,G.cam.position);this.next.update(dt,G.cam.position);
  if(this.active){const m=this.active;m.t+=dt;if(m.timer!=null&&m.timerOn!==false){m.timer-=dt;if(m.timer<=0){m.timer=0;this.fail(m.timeoutMsg||'OUT OF TIME');return;}}m.update(dt);}}
 // GPS target for the minimap route
 gps(){const m=this.active;if(!m)return this.G.waypoint;return m.gps?m.gps():null;}
 start(p){const G=this.G,K=KIND[p.kind];if(this.active||this.cool>0)return;const make={taxi:Taxi,delivery:Delivery,race:Race,trial:Trial,photo:Photo,escape:Escape,heist:Heist,boost:Boost}[p.kind];if(!make)return;
  const m=new make(this,p);m.kind=p.kind;m.name=p.name;m.t=0;this.active=m;G.waypoint=null;G.hud.banner(K.label,p.name,'#'+new THREE.Color(K.col).getHexString(),2.4);G.snd.play('beep',1);m.begin();}
 pass(reward,rep,sub){const G=this.G,m=this.active;if(!m)return;this.cleanup();this.done++;this.passed++;G.stats.missions++;G.addCash(reward,'MISSION');G.addRep(rep);G.hud.banner('MISSION PASSED',(sub?sub+' · ':'')+'+'+fmtCash(reward)+'  +'+rep+' REP','#ffd23f',3.2);G.snd.play('pass');this.cool=2;G.cheer();}
 fail(why,payout=0){const G=this.G;if(!this.active)return;this.cleanup();G.stats.failed++;if(payout>0)G.addCash(payout,'KEPT');G.hud.banner('MISSION FAILED',why,'#ff4d4d',3);G.snd.play('fail');this.cool=2;}
 cleanup(){const m=this.active;if(m&&m.end)m.end();this.active=null;for(const b of this.pool)b.hide();this.arch.hide();this.next.hide();this.G.hud.objective(null);this.G.traffic.bias=null;}
 abort(){if(this.active)this.fail('ABANDONED');}
 // helpers
 sidewalkPoint(minD,maxD,from){const G=this.G,P=from||G.player;for(let k=0;k<60;k++){const w=G.peds.walks[this.R()*G.peds.walks.length|0];if(w.b.d==='boardwalk'&&this.R()<.6)continue;const p=G.peds.at(w,this.R()*G.peds.perim(w),{});const d=Math.hypot(p.x-P.x,p.z-P.z);if(d<minD||d>maxD)continue;
   const ne=G.W.nearestEdge(p.x,p.z,14);if(!ne||ne.e.kind!=='street'||ne.d>9.5)continue;const q=polyAt(ne.e.pts,ne.s,{});return{x:p.x,z:p.z,y:G.W.groundBase(p.x,p.z),rx:q.x,rz:q.z,a:p.a};}return null;}
 spawnCar(id,x,z,a,o={}){const G=this.G;const v=new Vehicle(id,{mode:'parked',paint:o.paint});v.attach(G.scene,G.U);v.place(x,z,a,G.W,o.y);v.keep=true;G.vehicles.push(v);G.traffic.cars.push(v);v.traffic=true;return v;}
 clearAround(x,z,r){const G=this.G;for(const v of G.vehicles.slice())if(v!==G.player.veh&&v.traffic&&!v.keep&&Math.hypot(v.x-x,v.z-z)<r)G.traffic.remove(v);}}

/* ---------------- taxi ---------------- */
class Taxi{constructor(M,p){this.M=M;this.G=M.G;this.p=p;this.fares=0;this.earned=0;this.timer=null;}
 begin(){const G=this.G,p=this.p;this.M.clearAround(p.car[0],p.car[1],12);this.car=this.M.spawnCar('cabby',p.car[0],p.car[1],p.car[2]);G.enterVehicle(this.car,true);this.newFare();}
 newFare(){const G=this.G;const sp=this.M.sidewalkPoint(140,420);if(!sp){this.M.fail('NO FARES AROUND');return;}this.pick=sp;this.phase='pickup';this.timer=null;
  const c=G.peds.spawn(sp.x,sp.z,0,1e9);if(c){c.keep=true;c.x=sp.x;c.z=sp.z;c.y=sp.y;c.state='wave';c.custom=(c,dt)=>{c.t=(c.t||0);c.tt=(c.tt||0)+dt;c.yaw=Math.atan2(sp.rx-c.x,sp.rz-c.z);if(c.walkTo){const dx=c.walkTo.x-c.x,dz=c.walkTo.z-c.z,d=Math.hypot(dx,dz);if(d>.4){c.x+=dx/d*2.2*dt;c.z+=dz/d*2.2*dt;c.yaw=Math.atan2(dx,dz);c.state='walk';c.spd=2.2;}else{c.gone=true;}}else{c.state='wave';c.spd=0;}c.t=c.tt;};this.ped=c;}
  this.M.pool[0].set(sp.x,sp.y,sp.z);this.M.pool[0].bm.uniforms.uC.value.set(0xffc61a);this.obj();}
 obj(){const G=this.G;G.hud.objective(this.phase==='pickup'?`FARE ${this.fares+1}/3 · PICK UP THE PASSENGER`:`FARE ${this.fares+1}/3 · DROP OFF AT THE MARKER`,this.phase==='ride'?'TIPS FOR SPEED + AIR TIME':'STOP NEXT TO THE WAVING PASSENGER');}
 gps(){return this.phase==='pickup'?this.pick:this.dest;}
 update(dt){const G=this.G,v=G.player.veh;if(this.car.wrecked){this.M.fail('YOU WRECKED THE CAB',this.earned*0);return;}
  if(v!==this.car){this.away=(this.away||0)+dt;if(this.away>12){this.M.fail('YOU LEFT YOUR CAB');return;}G.hud.objective('GET BACK IN YOUR CAB',Math.ceil(12-this.away)+'s');return;}if(this.away){this.away=0;this.obj();}
  if(this.phase==='pickup'){const d=Math.hypot(v.x-this.pick.x,v.z-this.pick.z);if(d<12&&v.speed<3){if(!this.ped.walkTo){this.ped.walkTo={x:v.x,z:v.z};}else{this.ped.walkTo.x=v.x;this.ped.walkTo.z=v.z;}}
   if(this.ped&&this.ped.gone){this.removePed();G.snd.play('door');const sp=this.M.sidewalkPoint(320,780,this.pick);if(!sp){this.M.fail('NOWHERE TO GO');return;}this.dest=sp;const r=G.W.route(v.x,v.z,sp.x,sp.z);this.len=r.len;this.timer=Math.round(r.len/12.5+14);this.dmg0=v.dmg;this.tips=0;this.phase='ride';
    this.M.pool[0].set(sp.x,sp.y,sp.z);G.hud.toast('"'+['Step on it!','Ocean Drive, and make it snappy.','I am SO late.','Take the scenic route. Kidding. Hurry.','Meter running? Then run.'][this.fares%5]+'"');this.obj();}}
  else{if(!v.onG&&v.air>.35){this.tips+=dt*45;}const d=Math.hypot(v.x-this.dest.x,v.z-this.dest.z);
   if(d<12&&v.speed<3){const dmg=Math.max(0,v.dmg-this.dmg0);const pay=Math.round(60+this.len*.17+this.timer*3+this.tips-dmg*.8);this.earned+=Math.max(20,pay);G.addCash(Math.max(20,pay),'FARE');G.snd.play('cash');this.fares++;
    G.hud.toast(`FARE ${fmtCash(Math.max(20,pay))}${this.tips>5?' · TIP '+fmtCash(this.tips):''}`);const c=G.peds.spawn(this.dest.x,this.dest.z,0,1e9);if(c){c.x=v.x+2;c.z=v.z;}
    if(this.fares>=3){this.M.pass(250,25,'3 FARES · EARNED '+fmtCash(this.earned+250));return;}this.newFare();}}}
 removePed(){if(this.ped){const L=this.G.peds.list;const i=L.indexOf(this.ped);if(i>=0)L.splice(i,1);this.ped=null;}}
 end(){this.removePed();if(this.car){this.car.keep=false;}}}

/* ---------------- delivery ---------------- */
class Delivery{constructor(M,p){this.M=M;this.G=M.G;this.p=p;this.left=3;this.timeoutMsg='PACKAGES ARRIVED LATE';}
 begin(){const G=this.G,p=this.p;this.M.clearAround(p.car[0],p.car[1],12);this.car=this.M.spawnCar('hauler',p.car[0],p.car[1],p.car[2],{paint:0xff4d00});G.enterVehicle(this.car,true);
  this.drops=[];let from={x:p.x,z:p.z},tot=0;for(let i=0;i<3;i++){const sp=this.M.sidewalkPoint(200,620,from);if(!sp)break;this.drops.push(sp);tot+=G.W.route(from.x,from.z,sp.x,sp.z).len;from=sp;}
  this.drops.forEach((d,i)=>{this.M.pool[i].set(d.x,d.y,d.z);this.M.pool[i].bm.uniforms.uC.value.set(0x7dff6a);});this.timer=Math.round(tot/12+30);this.dmg0=this.car.dmg;this.obj();this.boxes=this.addBoxes();}
 addBoxes(){const g=new THREE.Group();for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(.7,.55,.7),new THREE.MeshStandardMaterial({color:0xb08850,roughness:.9}));m.position.set((i-1)*.6,1.62,-1.7+(i%2)*.4);m.rotation.y=i;m.castShadow=true;g.add(m);}this.car.bodyPivot.add(g);return g;}
 obj(){this.G.hud.objective(`DELIVER THE PACKAGES · ${3-this.left}/3`,'ANY ORDER · DAMAGE CUTS YOUR PAY');}
 gps(){const v=this.G.player;let best=null,bd=1e9;for(const d of this.drops){if(d.done)continue;const dd=Math.hypot(d.x-v.x,d.z-v.z);if(dd<bd){bd=dd;best=d;}}return best;}
 update(dt){const G=this.G,v=G.player.veh;if(this.car.wrecked){this.M.fail('THE PACKAGES ARE TOAST');return;}if(v!==this.car){this.away=(this.away||0)+dt;if(this.away>12){this.M.fail('YOU ABANDONED THE TRUCK');return;}G.hud.objective('GET BACK IN THE TRUCK',Math.ceil(12-this.away)+'s');return;}if(this.away){this.away=0;this.obj();}
  this.drops.forEach((d,i)=>{if(d.done)return;if(Math.hypot(v.x-d.x,v.z-d.z)<11.5&&v.speed<4){d.done=true;this.left--;this.M.pool[i].hide();const k=1-Math.min(.6,(v.dmg-this.dmg0)/v.hp);const pay=Math.round(140*k);G.addCash(pay,'DELIVERED');G.snd.play('cash');G.hud.toast('PACKAGE DELIVERED · '+fmtCash(pay));if(this.boxes.children[this.left])this.boxes.children[this.left].visible=false;this.obj();}});
  if(this.left<=0)this.M.pass(Math.round(200+this.timer*4),20,'ALL PACKAGES DELIVERED');}
 end(){if(this.boxes&&this.boxes.parent)this.boxes.parent.remove(this.boxes);if(this.car)this.car.keep=false;}}

/* ---------------- shared checkpoint runner ---------------- */
class Course{gps(){const c=this.cps[this.ci];return c?{x:c.x,z:c.z}:null;}
 showCP(){const c=this.cps[this.ci],n=this.cps[this.ci+1];const M=this.M;if(c){M.arch.set(c.x,c.y,c.z,c.a);M.arch.bm.uniforms.uC.value.set(c.fin?0xffffff:this.col);M.arch.arch.material.color.set(c.fin?0xffffff:this.col).multiplyScalar(2.5);}else M.arch.hide();if(n)M.next.set(n.x,n.y,n.z);else M.next.hide();}
 hitCP(v){const c=this.cps[this.ci];if(!c)return false;const dx=v.x-c.x,dz=v.z-c.z;return Math.hypot(dx,dz)<11&&Math.abs(v.y-c.y)<6;}}

/* ---------------- street race ---------------- */
const RACE_CARS={race1:['bruiser','zephyr','bruiser'],race2:['skipjack','bruiser','pip'],race3:['zephyr','zephyr','bruiser']};
class Race extends Course{constructor(M,p){super();this.M=M;this.G=M.G;this.p=p;this.col=0xff4d00;this.timer=null;}
 begin(){const G=this.G,W=G.W,k=this.p.id;this.route=W.races[k];this.cps=W.raceCP[k];this.ci=0;this.cd=3.2;this.phase='count';
  const P=this.route;const s0=polyAt(P,0,{});const a=Math.atan2(s0.tx,s0.tz);this.M.clearAround(s0.x,s0.z,60);
  let v=G.player.veh;if(!v||v.wrecked){v=this.M.spawnCar('bruiser',s0.x,s0.z,a,{paint:0x15171c});G.enterVehicle(v,true);}else{v.keep=true;}
  const grid=[[-2.8,-6],[2.8,-6],[-2.8,-14],[2.8,-14]];const place=(car,i)=>{const[lat,back]=grid[i];const x=s0.x+s0.tx*back-s0.tz*lat,z=s0.z+s0.tz*back+s0.tx*lat;car.place(x,z,a,G.W,(s0.y||0)+1.5);};
  place(v,3);this.rivals=RACE_CARS[k].map((id,i)=>{const r=this.M.spawnCar(id,0,0,a,{paint:trafficPaint(this.R?this.R():Math.random())});place(r,i);r.mode='race';r.driver='npc';r.racer={s:0,ci:0,skill:[.9,.96,1.02][G.opt.cops]*(1-i*.025),fin:0,name:['VIPER','JADE','ROOK'][i]};return r;});
  this.ps=0;this.showCP();G.hud.objective('STREET RACE · '+this.p.name,'GET READY');}
 progress(v,st){// arc length along the route near the last known position
  const P=this.route;let best=st.s,bd=1e9;for(let s=st.s-20;s<st.s+70;s+=3){const q=polyAt(P,Math.max(0,Math.min(P.len,s)),_q);const d=Math.hypot(q.x-v.x,q.z-v.z);if(d<bd){bd=d;best=Math.max(0,Math.min(P.len,s));}}st.s=best;return best;}
 update(dt){const G=this.G,v=G.player.veh;if(this.phase==='count'){this.cd-=dt;G.freeze=true;const n=Math.ceil(this.cd);if(n!==this.lastN&&n>0&&n<=3){this.lastN=n;G.snd.play('beep',0);G.hud.big(String(n));}if(this.cd<=0){G.freeze=false;this.phase='go';this.timer=null;this.t0=this.t;G.snd.play('beep',1);G.hud.big('GO!');}return;}
  if(!v||v.wrecked){this.away=(this.away||0)+dt;if(this.away>10||(v&&v.wrecked)){this.M.fail(v&&v.wrecked?'WRECKED':'YOU QUIT THE RACE');return;}}else this.away=0;
  const me={s:this.ps};if(v)this.ps=this.progress(v,me);
  for(const r of this.rivals){if(r.racer.fin)continue;this.rival(r,dt);}
  if(v&&this.hitCP(v)){const c=this.cps[this.ci];this.ci++;G.snd.play('cp');if(c.fin){this.finish();return;}this.showCP();}
  const order=[{me:true,s:this.ps+this.ci*.001,fin:0},...this.rivals.map(r=>({s:r.racer.s,fin:r.racer.fin}))];const ahead=this.rivals.filter(r=>r.racer.fin||r.racer.s>this.ps).length;this.pos=ahead+1;
  G.hud.objective(`STREET RACE · POS ${this.pos}/4`,`CHECKPOINT ${Math.min(this.ci+1,this.cps.length)}/${this.cps.length} · ${((this.t-this.t0)).toFixed(1)}s`);
  if(this.t-this.t0>300)this.M.fail('TOO SLOW');}
 rival(r,dt){const G=this.G,P=this.route,st=r.racer;const s=this.progress(r,st);if(s>=P.len-6){st.fin=this.t;r.mode='parked';r.ctrl.thr=0;r.ctrl.hb=true;return;}
  const look=Math.max(12,r.speed*.75);const q=polyAt(P,Math.min(P.len,s+look),{});const q2=polyAt(P,Math.min(P.len,s+look+28),{});const a1=Math.atan2(q.x-r.x,q.z-r.z),a2=Math.atan2(q2.x-q.x,q2.z-q.z);const bend=Math.abs(wrapA(a2-a1));
  let want=r.spec.max*st.skill*(bend>1.1?.42:bend>.6?.62:bend>.3?.82:1);// rubber band
  const gap=s-this.ps;if(gap>120)want*=.85;else if(gap<-120)want*=1.12;
  if(r.speed<1.3&&r.ctrl.thr>0&&this.t-this.t0>3)r.stuck=(r.stuck||0)+dt;else r.stuck=Math.max(0,(r.stuck||0)-dt);if(r.stuck>2){// teleport back onto the route if hopelessly stuck
   const p=polyAt(P,s+4,{});r.place(p.x,p.z,Math.atan2(p.tx,p.tz),G.W,(p.y||0)+1.5);r.stuck=0;}
  aiDrive(r,q.x,q.z,want,{dt,nohb:bend<.8});}
 finish(){const G=this.G;const t=this.t-this.t0;const place=1+this.rivals.filter(r=>r.racer.fin).length;G.stats.bestRace=Math.min(G.stats.bestRace||1e9,t);G.stats.races++;
  const pay=[1500,700,300,0][place-1];if(place<=3){this.M.pass(pay,[30,15,8][place-1],['1ST','2ND','3RD'][place-1]+' PLACE · '+t.toFixed(2)+'s');}else this.M.fail('FINISHED LAST · '+t.toFixed(2)+'s');}
 end(){for(const r of this.rivals||[]){r.keep=false;r.mode='parked';r.ctrl.thr=0;}const v=this.G.player.veh;if(v)v.keep=v.owned;this.G.freeze=false;}}
const _q={};

/* ---------------- time trial ---------------- */
class Trial extends Course{constructor(M,p){super();this.M=M;this.G=M.G;this.p=p;this.col=0x36f0ff;}
 begin(){const G=this.G,k=this.p.id;this.route=G.W.races[k];this.cps=G.W.raceCP[k];this.ci=0;const s0=polyAt(this.route,0,{});const a=Math.atan2(s0.tx,s0.tz);this.M.clearAround(s0.x,s0.z,40);
  let v=G.player.veh;if(!v||v.wrecked){v=this.M.spawnCar('skipjack',s0.x,s0.z,a);G.enterVehicle(v,true);}v.place(s0.x-s0.tx*4,s0.z-s0.tz*4,a,G.W,(s0.y||0)+1.5);this.add=k==='trial1'?6.5:9;this.timer=k==='trial1'?16:20;this.showCP();this.obj();}
 obj(){this.G.hud.objective('TIME TRIAL · '+this.p.name,`CHECKPOINT ${Math.min(this.ci+1,this.cps.length)}/${this.cps.length} · +${this.add}s EACH`);}
 update(dt){const G=this.G,v=G.player.veh;if(!v){this.away=(this.away||0)+dt;if(this.away>8){this.M.fail('YOU BAILED');}return;}this.away=0;if(v.wrecked){this.M.fail('WRECKED');return;}
  if(this.hitCP(v)){const c=this.cps[this.ci];this.ci++;G.snd.play('cp');if(c.fin){const t=this.t;G.stats.bestTrial=Math.min(G.stats.bestTrial||1e9,t);this.M.pass(Math.round(350+Math.min(this.timer,40)*15),15,'TIME '+t.toFixed(2)+'s');return;}this.timer+=this.add;G.hud.toast('+'+this.add+'s');this.showCP();this.obj();}}
 end(){}}

/* ---------------- photo hunt ---------------- */
class Photo{constructor(M,p){this.M=M;this.G=M.G;this.p=p;this.timer=240;}
 begin(){const R=this.M.R;const pool=PHOTO_T.slice();this.targets=[];while(this.targets.length<3){const t=pool.splice(R()*pool.length|0,1)[0];this.targets.push({...t,got:false});}const bias={};for(const t of this.targets)if(t.b)bias[t.b]=4;this.G.traffic.bias=bias;this.obj();this.G.hud.toast('PRESS P TO TAKE A PHOTO');}
 obj(){this.G.hud.objective('PHOTO HUNT · '+this.targets.filter(t=>t.got).length+'/3',this.targets.map(t=>(t.got?'✓ ':'· ')+t.d).join('  '));}
 snap(){const G=this.G,cam=G.cam;const fr=new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));let got=null;
  for(const v of G.vehicles){if(v===G.player.veh||!v.group)continue;const d=cam.position.distanceTo(_p.set(v.x,v.y+.8,v.z));if(d>60)continue;if(!fr.containsPoint(_p))continue;if(!G.W.los(cam.position.x,cam.position.z,v.x,v.z,1.5)&&d>15)continue;
   for(const t of this.targets){if(t.got)continue;if(t.t(v)){t.got=true;got=t;break;}}if(got)break;}
  if(got){G.addCash(200,'PHOTO');G.addRep(3);G.stats.photos++;G.hud.toast('NICE SHOT · '+got.d);G.snd.play('cash');this.obj();if(this.targets.every(t=>t.got))this.M.pass(350,15,'PORTFOLIO COMPLETE');}else G.hud.toast('NOTHING ON THE LIST IN FRAME');}
 update(dt){}end(){this.G.traffic.bias=null;}}
const _p=new THREE.Vector3();

/* ---------------- escape ---------------- */
class Escape{constructor(M,p){this.M=M;this.G=M.G;this.p=p;this.timer=150;this.timeoutMsg='THEY WORE YOU DOWN';}
 begin(){this.G.police.set(3.2);this.G.onStars(3,'job');this.G.hud.objective('LOSE THE COPS','BREAK LINE OF SIGHT · RESPRAY WORKS TOO');}
 update(dt){if(this.G.police.stars===0){this.M.pass(1000,25,'CLEAN GETAWAY');}}
 gps(){return null;}end(){}}

/* ---------------- armored takedown ---------------- */
// a cash truck drives a fixed route across town: ram it until the doors give, grab the spilled bags, then lose the heat or reach the drop
const _hq={},_hq2={};
class Heist{constructor(M,p){this.M=M;this.G=M.G;this.p=p;this.timer=260;this.phase='chase';this.bags=0;this.timeoutMsg='THE TRAIL WENT COLD';}
 begin(){const G=this.G,M=this.M;const A=M.sidewalkPoint(200,480),B=A&&M.sidewalkPoint(650,1200,A);if(!A||!B){M.fail('NO TRUCK ON THE ROAD TODAY');return;}
  const r=G.W.route(A.rx,A.rz,B.rx,B.rz);const pts=r.pts.map(q=>({x:q.x,z:q.z,y:q.y}));if(pts.length<2){M.fail('NO TRUCK ON THE ROAD TODAY');return;}this.path=poly(pts);this.st={s:6};
  const q=this.lane(6,{});M.clearAround(q.x,q.z,18);this.truck=M.spawnCar('vault',q.x,q.z,Math.atan2(q.tx,q.tz),{paint:0x3c4a40,y:(q.y||0)+1.5});this.truck.mode='race';this.truck.racer={s:0,heist:1};this.truck.driver='npc';
  this.hp0=this.truck.dmg;this.want=[12,13.5,15][G.opt.cops];this.obj();}
 lane(s,o){const P=this.path;polyAt(P,cl(s,0,P.len),o);o.x+=-o.tz*3.5;o.z+=o.tx*3.5;return o;}
 armor(){return 1-Math.min(1,(this.truck.dmg-this.hp0)/(this.truck.hp*.45));}
 obj(){const G=this.G;if(this.phase==='chase')G.hud.objective('RAM THE ARMORED TRUCK','ARMOR '+Math.round(this.armor()*100)+'% · STOP IT BEFORE IT REACHES THE VAULT');
  else if(this.phase==='loot')G.hud.objective(`GRAB THE CASH BAGS · ${this.bags}/3`,'ON FOOT OR DRIVE OVER THEM');else G.hud.objective('GET AWAY WITH '+fmtCash(this.pay()),'LOSE THE COPS OR REACH THE DROP');}
 pay(){return Math.round(this.bags*[750,850,1000][this.G.opt.cops]);}
 gps(){if(this.phase==='chase')return{x:this.truck.x,z:this.truck.z};if(this.phase==='loot'){const b=this.bagList.find(b=>!b.got);return b?{x:b.x,z:b.z}:null;}return this.drop;}
 update(dt){const G=this.G,M=this.M,T=this.truck,P=G.player;
  if(this.phase==='chase'){const s=this.prog();
   if(s>=this.path.len-10){M.fail('THE TRUCK MADE IT TO THE VAULT');return;}
   if(!this.hit&&T.dmg>this.hp0+4){this.hit=true;this.want*=1.45;G.police.crime('heist',T.x,T.z,1.2,true);G.hud.toast('THE GUARDS RADIO IT IN · THE TRUCK IS RUNNING');}
   if(T.dmg>=this.hp0+T.hp*.45||T.wrecked||P.veh===T){this.spill();return;}
   const look=Math.max(10,T.speed*.8);const q=this.lane(s+look,_hq),q2=this.lane(s+look+24,_hq2);const bend=Math.abs(wrapA(Math.atan2(q2.x-q.x,q2.z-q.z)-Math.atan2(q.x-T.x,q.z-T.z)));
   if(T.speed<1.2&&this.t>3)T.stuck=(T.stuck||0)+dt;else T.stuck=Math.max(0,(T.stuck||0)-dt);if(T.stuck>3&&Math.hypot(P.x-T.x,P.z-T.z)>40){const p=this.lane(s+6,{});T.place(p.x,p.z,Math.atan2(p.tx,p.tz),G.W,(p.y||0)+1.5);T.stuck=0;}
   aiDrive(T,q.x,q.z,this.want*(bend>1.1?.45:bend>.6?.65:1),{dt,nohb:true});this.M.pool[0].set(T.x,T.y+1,T.z);if((this.ot=(this.ot||0)-dt)<=0){this.ot=.25;this.obj();}return;}
  if(this.phase==='loot'){for(const b of this.bagList){if(b.got)continue;b.m.rotation.y+=dt*1.5;if(Math.hypot(P.x-b.x,P.z-b.z)<(P.veh?3.2:1.8)){b.got=true;b.m.visible=false;this.bags++;G.snd.play('cash');G.hud.toast('BAG GRABBED · '+fmtCash(this.pay()));this.obj();}}
   if(this.bags>=3||(this.bags>0&&Math.hypot(P.x-T.x,P.z-T.z)>90)){this.getaway();}return;}
  if(G.police.stars===0){M.pass(this.pay(),30,'CLEAN GETAWAY · '+this.bags+' BAGS');return;}
  if(Math.hypot(P.x-this.drop.x,P.z-this.drop.z)<11&&(!P.veh||P.veh.speed<5)){M.pass(this.pay(),30,'MONEY DROPPED · '+this.bags+' BAGS');}}
 prog(){const P=this.path,T=this.truck,st=this.st;let best=st.s,bd=1e9;for(let s=st.s-15;s<st.s+60;s+=2){const q=polyAt(P,cl(s,0,P.len),_q);const d=Math.hypot(q.x-T.x,q.z-T.z);if(d<bd){bd=d;best=cl(s,0,P.len);}}st.s=best;return best;}
 spill(){const G=this.G,T=this.truck;this.phase='loot';T.mode='parked';T.ctrl.thr=0;T.ctrl.hb=true;this.M.pool[0].hide();G.snd.play('crash',18);
  G.police.set(Math.max(G.police.heat,3.2));G.onStars(3,'heist');G.hud.banner('THE DOORS GAVE','GRAB THE BAGS','#e8c15a',2);
  const geo=new THREE.CapsuleGeometry(.24,.5,3,8);geo.rotateZ(Math.PI/2);const mat=new THREE.MeshStandardMaterial({color:0x2c4a2a,roughness:.85,emissive:0x6a5410,emissiveIntensity:.25});
  const sa=Math.sin(T.a),ca=Math.cos(T.a);this.bagList=[-1.6,0,1.6].map((lat,i)=>{const back=T.len/2+1.6+i*.9;const x=T.x-sa*back+ca*lat,z=T.z-ca*back-sa*lat;const y=G.W.groundAt(x,z,T.y+1)+.26;const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;G.scene.add(m);
   G.glow.burst({x,y:y+.3,z},14,4,[new THREE.Color(2,1.6,.5)],.18,.6,{grav:6});return{x,z,m,got:false};});this.obj();}
 getaway(){const G=this.G;this.phase='run';const d=this.M.sidewalkPoint(320,700);this.drop=d||{x:this.p.x,z:this.p.z,y:G.W.groundBase(this.p.x,this.p.z)};this.M.pool[1].set(this.drop.x,this.drop.y??0,this.drop.z);this.M.pool[1].bm.uniforms.uC.value.set(0xe8c15a);this.timer=Math.max(this.timer,150);this.obj();}
 end(){for(const b of this.bagList||[])b.m.parent&&b.m.parent.remove(b.m);if(this.truck){this.truck.keep=false;this.truck.racer=null;if(this.truck.mode==='race'){this.truck.mode='parked';this.truck.ctrl.thr=0;}}}}

/* ---------------- boost to order ---------------- */
// a buyer at the docks wants one specific parked car: steal it (the alarm draws heat), keep it clean, and deliver it with no stars
const BOOST_WANT=[['marlin','A MARLIN SEDAN'],['bruiser','A BRUISER MUSCLE CAR'],['hauler','A HAULER PICKUP'],['cabby','AN OFF-DUTY CABBY']];
class Boost{constructor(M,p){this.M=M;this.G=M.G;this.p=p;this.timer=300;this.phase='find';this.timeoutMsg='THE BUYER WALKED';}
 begin(){const G=this.G,M=this.M,P=G.player;const R=M.R;const order=BOOST_WANT[R()*BOOST_WANT.length|0];let best=null,bd=1e9;
  for(const c of G.city.parked){if(c.dead)continue;const d=Math.hypot(c.x-P.x,c.z-P.z);if(d<220||d>800)continue;const sc=(c.id===order[0]?0:500)+Math.abs(d-420)+R()*60;if(sc<bd){bd=sc;best=c;}}
  if(!best){M.fail('NO ORDERS TODAY');return;}this.want=best.id===order[0]?order[1]:'THE CAR ON YOUR GPS';const v=G.convertParked(best);if(!v){M.fail('NO ORDERS TODAY');return;}
  v.setPaint([0xd8c8a0,0x0f5e57,0x7a1020,0x1e3fa8][R()*4|0]);v.keep=true;v.ctrl.hb=true;this.car=v;const ne=G.W.nearestEdge(this.p.x,this.p.z,40);const q=ne?polyAt(ne.e.pts,ne.s,{}):{x:this.p.x,z:this.p.z};
  this.drop={x:(q.x+this.p.x)/2,z:(q.z+this.p.z)/2};this.drop.y=G.W.groundBase(this.drop.x,this.drop.z);this.obj();}
 obj(){const G=this.G;if(this.phase==='find')G.hud.objective('STEAL '+this.want,'IT IS PARKED AT THE MARKER · ALARMS DRAW HEAT');
  else G.hud.objective(G.police.stars?'LOSE THE HEAT · THE BUYER WANTS IT COLD':'DELIVER THE CAR TO THE DOCKS','CONDITION '+Math.round(this.cond()*100)+'% · PAY '+fmtCash(this.pay()));}
 cond(){const v=this.car;return Math.max(0,1-(v.dmg)/(v.hp*.9));}
 pay(){return Math.round((700+1500*this.cond())*[.9,1,1.2][this.G.opt.cops]);}
 gps(){return this.phase==='find'?{x:this.car.x,z:this.car.z}:this.drop;}
 update(dt){const G=this.G,M=this.M,v=this.car,P=G.player;if(v.wrecked){M.fail('THE CAR IS SCRAP');return;}
  if(this.phase==='find'){M.pool[0].set(v.x,v.y,v.z);M.pool[0].bm.uniforms.uC.value.set(0xc77dff);if(P.veh===v){this.phase='drive';M.pool[0].hide();G.police.crime('alarm',v.x,v.z,1,true);G.snd.play('beep',1);
    M.pool[1].set(this.drop.x,this.drop.y,this.drop.z);M.pool[1].bm.uniforms.uC.value.set(0xc77dff);this.obj();}return;}
  if(P.veh!==v){this.away=(this.away||0)+dt;if(this.away>20){M.fail('YOU DITCHED THE ORDER');return;}G.hud.objective('GET BACK IN THE CAR',Math.ceil(20-this.away)+'s');return;}this.away=0;
  if((this.ot=(this.ot||0)-dt)<=0){this.ot=.25;this.obj();}
  if(Math.hypot(v.x-this.drop.x,v.z-this.drop.z)<11&&v.speed<4){if(G.police.stars>0){if(!this.warned){this.warned=1;G.hud.toast('THE BUYER WON\'T TOUCH A HOT CAR');}return;}
   const pay=this.pay();this.car.keep=false;M.pass(pay,20,'DELIVERED · '+Math.round(this.cond()*100)+'% CONDITION');}}
 end(){if(this.car&&this.G.player.veh!==this.car)this.car.keep=false;}}
