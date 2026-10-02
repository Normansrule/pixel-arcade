// NIGHT DRIVE — dispatch: taxi fares (tips for speed and stunts), deliveries (fragile cargo), checkpoint races vs two rival drivers,
// getaway runs (instant 3-star heat), stunt jumps; markers, checkpoints and the passenger figures.
import * as THREE from '../vendor/three.module.min.js';
import {SP,HALF,WORLD} from './city.js';
import {Car,carModel,RIVAL,aiInput} from './car.js';
const V=THREE.Vector3,R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v;
export const JOBC={fare:0xffc21a,delivery:0x40a8ff,race:0xc050ff,getaway:0xff3040,drop:0x40ff90,stunt:0xff7a10};
const PAX=[{n:'COMMUTER',stunt:1,crash:1,time:1},{n:'THRILL SEEKER',stunt:2,crash:.5,time:.8},{n:'NERVOUS TOURIST',stunt:0,crash:2.2,time:.9},{n:'LATE FOR A SHOW',stunt:1,crash:1,time:1.8},{n:'NIGHT OWL',stunt:1.3,crash:1,time:1}];

function beacon(col){const g=new THREE.Group();const c=new THREE.Color(col);const beam=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.6,70,20,1,true),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(.1),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=35;g.add(beam);
 const ring=new THREE.Mesh(new THREE.RingGeometry(3.4,4.2,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));ring.position.y=.3;g.add(ring);
 g.userData={beam,ring};return g;}
function person(col){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:col,roughness:.7}),sk=new THREE.MeshStandardMaterial({color:0xe0b090,roughness:.7}),dk=new THREE.MeshStandardMaterial({color:0x202430,roughness:.8});
 const t=new THREE.Mesh(new THREE.BoxGeometry(.48,.64,.28),m);t.position.y=1.22;const h=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),sk);h.position.y=1.7;const l1=new THREE.Mesh(new THREE.BoxGeometry(.17,.82,.18),dk);l1.position.set(-.11,.45,0);const l2=l1.clone();l2.position.x=.11;
 const arm=new THREE.Group();arm.position.set(.32,1.5,0);const a=new THREE.Mesh(new THREE.BoxGeometry(.12,.62,.13),m);a.position.y=.3;arm.add(a);const a2=new THREE.Mesh(new THREE.BoxGeometry(.12,.62,.13),m);a2.position.set(-.32,1.2,0);g.add(t,h,l1,l2,arm,a2);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.userData.arm=arm;return g;}

export class Jobs{
 constructor(scene,city,G){this.scene=scene;this.city=city;this.G=G;this.offers=[];this.active=null;this.stunts=city.kickers.map((k,i)=>({k,i,done:false}));this.cp=[];this.rivals=[];this.t=0;}
 reset(){for(const o of this.offers)this.scene.remove(o.g);this.offers=[];this.cancel(true);for(const s of this.stunts)s.done=false;this.fill();}
 fill(){const P=this.G.car;const want={fare:3,delivery:1,race:1,getaway:1};for(const k in want){let n=this.offers.filter(o=>o.type===k).length;while(n<want[k]){if(!this.addOffer(k,P))break;n++;}}}
 addOffer(type,P){const C=this.city;let spot;for(let t=0;t<20;t++){spot=C.curbSpot(R,P?P.x:WORLD/2,P?P.z:WORLD/2,type==='race'?100:70,type==='fare'?320:520);if(!this.offers.some(o=>Math.hypot(o.x-spot.x,o.z-spot.z)<60))break;}
  if(type==='race'){const n=C.nearestNode(spot.x,spot.z);spot={x:n.x,z:n.z};}
  const g=new THREE.Group();g.position.set(spot.x,0,spot.z);const b=beacon(JOBC[type]);g.add(b);let fig=null;if(type==='fare'||type==='getaway'){fig=person(type==='getaway'?0x202020:[0xd03030,0x3060d0,0x30a050,0xe0a020,0x8040c0][(R()*5)|0]);fig.position.set(0,.18,0);g.add(fig);}
  if(type==='delivery'){const box=new THREE.Mesh(new THREE.BoxGeometry(1.2,.9,1.2),new THREE.MeshStandardMaterial({color:0xc89a5a,roughness:.8}));box.position.y=.6;box.castShadow=true;g.add(box);}
  if(type==='race'){const flag=new THREE.Mesh(new THREE.BoxGeometry(.12,4,.12),new THREE.MeshStandardMaterial({color:0xdddddd,metalness:.8,roughness:.3}));flag.position.set(2.5,2,0);g.add(flag);}
  this.scene.add(g);const o={type,x:spot.x,z:spot.z,g,beacon:b,fig,t:R()*6,spot};this.offers.push(o);return o;}
 removeOffer(o){this.scene.remove(o.g);this.offers.splice(this.offers.indexOf(o),1);}
 target(){const a=this.active;if(!a)return null;if(a.type==='race')return this.cp[a.cpi]?{x:this.cp[a.cpi].x,z:this.cp[a.cpi].z}:null;return a.stage==='go'?{x:a.dx,z:a.dz}:null;}
 cancel(silent){const a=this.active;if(!a)return;if(a.marker)this.scene.remove(a.marker);for(const c of this.cp)this.scene.remove(c.g);this.cp=[];for(const r of this.rivals)this.scene.remove(r.car.model);this.rivals=[];this.active=null;if(!silent)this.G.hud.job(null);}
 fail(why){const a=this.active;if(!a)return;this.G.toast(why,'#ff5040');this.G.stats.failed++;this.G.sfx('fail');this.cancel();}
 accept(o){const G=this.G,P=G.car;this.removeOffer(o);const C=this.city;const a={type:o.type,stage:'board',t:0,x:o.x,z:o.z};
  if(o.type==='fare'||o.type==='delivery'||o.type==='getaway'){const minD=o.type==='getaway'?520:o.type==='delivery'?320:260,maxD=o.type==='getaway'?900:o.type==='delivery'?850:700;const d=C.curbSpot(R,o.x,o.z,minD,maxD);a.dx=d.x;a.dz=d.z;
   const rt=C.route(o.x,o.z,d.x,d.z);a.len=rt.len;a.limit=Math.round(rt.len/(o.type==='getaway'?13:o.type==='delivery'?12.5:13.5)+(o.type==='getaway'?25:18));a.left=a.limit;a.pax=o.type==='fare'?PAX[(R()*PAX.length)|0]:null;a.tips=0;a.sat=1;a.dmg0=G.car.dmg;a.drift=0;a.air=0;a.nm=0;
   a.marker=beacon(o.type==='fare'?JOBC.drop:o.type==='delivery'?0x40c0ff:0xffe040);a.marker.position.set(d.x,0,d.z);this.scene.add(a.marker);a.stage='board';a.t=0;
   G.toast(o.type==='fare'?'HOP IN!':o.type==='delivery'?'PARCEL LOADED':'CREW ABOARD · DRIVE!',o.type==='getaway'?'#ff5040':'#ffd040');G.sfx('door');
   if(o.type==='getaway'){G.setWanted(3,true);}}
  else if(o.type==='race'){this.setupRace(a);}
  this.active=a;G.hud.job(a);}
 setupRace(a){const G=this.G,C=this.city,P=G.car;// pick 6 checkpoints far apart, route through them
  const nodes=C.nodes.filter(n=>n.alive&&n.nb.length&&n.x>=0&&n.x<=WORLD);let cur=C.nearestNode(a.x,a.z);const pts=[];const seq=[cur];
  for(let k=0;k<5;k++){let best=null,bs=-1;for(let t=0;t<40;t++){const n=nodes[(R()*nodes.length)|0];const d=Math.hypot(n.x-cur.x,n.z-cur.z);if(d<160||d>330)continue;if(seq.some(s=>Math.hypot(s.x-n.x,s.z-n.z)<120))continue;const sc=R();if(sc>bs){bs=sc;best=n;}}if(!best)break;seq.push(best);cur=best;}
  seq.push(seq[0]);for(let k=1;k<seq.length;k++){const r=C.route(seq[k-1].x,seq[k-1].z,seq[k].x,seq[k].z).pts;for(let i=k===1?0:1;i<r.length;i++)pts.push(r[i]);}
  // dense waypoints for rivals
  const way=[];for(let i=1;i<pts.length;i++){const[a0,b0]=pts[i-1],[a1,b1]=pts[i];const L=Math.hypot(a1-a0,b1-b0);const n=Math.max(1,Math.ceil(L/8));for(let s=0;s<n;s++)way.push([a0+(a1-a0)*s/n,b0+(b1-b0)*s/n]);}way.push(pts[pts.length-1]);
  a.way=way;a.cps=seq.slice(1).map(n=>({x:n.x,z:n.z}));a.cpi=0;a.stage='count';a.t=0;a.total=a.cps.length;a.laps=1;
  for(const[i,c]of a.cps.entries()){const g=new THREE.Group();const ring=new THREE.Mesh(new THREE.TorusGeometry(7,.35,10,48),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1,3.2)}));ring.position.y=6;g.add(ring);const fl=new THREE.Mesh(new THREE.CircleGeometry(7,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:new THREE.Color(.5,.2,.7),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));fl.position.y=.2;g.add(fl);g.position.set(c.x,0,c.z);g.visible=i<2;this.scene.add(g);this.cp.push({x:c.x,z:c.z,g,ring});}
  // grid: player + two rivals side by side, facing the first waypoint
  const w0=way[0],w1=way[Math.min(4,way.length-1)];const ang=Math.atan2(w1[0]-w0[0],w1[1]-w0[1]);const rx=Math.cos(ang),rz=-Math.sin(ang);
  P.place(w0[0],w0[1],ang,C);const cols=[0x20d0ff,0xff3060];for(let k=0;k<2;k++){const sp={...RIVAL};const m=carModel(sp,cols[k],{});this.scene.add(m);const car=new Car(sp,m);const off=k?-3.6:3.6;car.place(w0[0]+rx*off-Math.sin(ang)*(k+1)*2,w0[1]+rz*off-Math.cos(ang)*(k+1)*2,ang,C);this.rivals.push({car,wi:0,cpi:0,done:false,name:['NOVA','VANDAL'][k],skill:(.86+this.G.opt.diff*.07)*(k?1:.96),place:0});}
  this.G.toast('RACE · 3','#c070ff');}
 // progress metric for ordering (higher = further along)
 prog(cpi,x,z,a){const c=a.cps[Math.min(cpi,a.cps.length-1)];return cpi*10000-Math.hypot(c.x-x,c.z-z);}
 update(dt,G){this.t+=dt;const P=G.car;const sp=P.speed;
  for(const o of this.offers){o.t+=dt;o.beacon.userData.ring.scale.setScalar(1+Math.sin(o.t*3)*.08);if(o.fig){o.fig.userData.arm.rotation.z=-2.4+Math.sin(o.t*7)*.4;o.fig.lookAt(P.x,0,P.z);}
   if(!this.active&&Math.hypot(P.x-o.x,P.z-o.z)<7&&sp<9&&Math.abs(P.y)<2){this.accept(o);break;}}
  for(const s of this.stunts){/* handled via onAir */}
  const a=this.active;if(!a)return;a.t+=dt;
  if(a.marker){a.marker.userData.ring.scale.setScalar(1+Math.sin(this.t*4)*.1);}
  if(a.type==='race')return this.raceUpdate(dt,a,G);
  if(a.stage==='board'){if(a.t>.8){a.stage='go';G.hud.job(a);}return;}
  a.left-=dt;if(a.left<=0){this.fail(a.type==='fare'?'PASSENGER BAILED':a.type==='delivery'?'DELIVERY LATE':'THE CREW JUMPED OUT');return;}
  if(a.type==='fare'&&a.pax){if(P.slip>4&&sp>9){a.drift+=dt;a.tips+=dt*5*a.pax.stunt;}}
  if(Math.hypot(P.x-a.dx,P.z-a.dz)<8&&sp<8){this.complete(a,G);}}
 onCrash(imp){const a=this.active;if(!a||a.stage!=='go')return;if(a.type==='fare'&&a.pax){a.sat=Math.max(.3,a.sat-imp*.012*a.pax.crash);}}
 onAir(air,dist,kicker){const G=this.G,a=this.active;let pay=0;
  if(kicker){const s=this.stunts[kicker.idx];if(s&&air>.6){pay=Math.round(50+air*50+dist*.8);if(!s.done){s.done=true;pay=Math.round(pay*1.5);G.stats.uniq++;G.toast('UNIQUE STUNT JUMP '+G.stats.uniq+'/'+this.stunts.length,'#ff8a20');}G.earn(pay,'stunt','STUNT JUMP');G.stats.jumps++;}}
  if(a&&a.type==='fare'&&a.pax&&a.stage==='go'&&air>.35){const tip=Math.round(air*14*a.pax.stunt);a.tips+=tip;a.air+=air;if(tip>0)G.pop('AIR TIP +$'+tip);}
  else if(!kicker&&air>1){G.earn(Math.round(air*12),'stunt','BIG AIR');}}
 onNearMiss(){const a=this.active;if(a&&a.type==='fare'&&a.pax&&a.stage==='go'){a.tips+=8*a.pax.stunt;a.nm++;this.G.pop('NEAR MISS TIP +$'+Math.round(8*a.pax.stunt));}else this.G.earn(5,'street','NEAR MISS');}
 complete(a,G){let pay=0,lines=[];const frac=a.left/a.limit;
  if(a.type==='fare'){const base=Math.round(25+a.len*.18);const speed=Math.round(base*frac*.6*a.pax.time);const sat=a.sat;pay=Math.round((base+speed)*sat+a.tips);G.stats.fares++;G.stats.tips+=Math.round(a.tips+speed*sat);
   lines=['FARE $'+base,'SPEED TIP $'+speed,a.tips?'STUNT TIPS $'+Math.round(a.tips):'',sat<1?'RATING '+Math.round(sat*100)+'%':''];G.earn(pay,'fares','FARE COMPLETE');}
  else if(a.type==='delivery'){const dmg=Math.max(0,G.car.dmg-a.dmg0);const k=Math.max(.3,1-dmg/60);pay=Math.round((90+a.len*.22)*k*(G.car.spec.id==='mule'?1.3:1)*(.8+frac*.4));G.stats.deliveries++;lines=['CARGO '+Math.round(k*100)+'% INTACT'];G.earn(pay,'deliveries','DELIVERED');}
  else if(a.type==='getaway'){pay=Math.round(420+a.len*.2+G.wanted*80);G.stats.getaways++;lines=['HEAT '+G.wanted+'★'];G.earn(pay,'getaways','CLEAN GETAWAY');}
  G.toast(lines.filter(Boolean).join(' · '),'#9be27a');G.sfx('cash');this.cancel();this.fill();}
 raceUpdate(dt,a,G){const P=G.car,C=this.city;
  if(a.stage==='count'){P.vx=P.vz=0;const n=3-Math.floor(a.t);if(n!==a.lastN&&n>0){a.lastN=n;G.toast('RACE · '+n,'#c070ff');G.sfx('beep');}if(a.t>=3){a.stage='go';G.toast('GO!','#9be27a');G.sfx('go');}
   for(const r of this.rivals)r.car.step({thr:0,brk:1,steer:0,hb:false},dt,C,{});return;}
  if(a.stage==='done'){a.t2=(a.t2||0)+dt;for(const r of this.rivals)if(!r.done)this.driveRival(r,a,dt,G);if(a.t2>3){this.cancel();this.fill();}return;}
  // player checkpoints
  const c=this.cp[a.cpi];if(c&&Math.hypot(P.x-c.x,P.z-c.z)<9){c.g.visible=false;a.cpi++;G.sfx('cp');if(this.cp[a.cpi+1])this.cp[a.cpi+1].g.visible=true;if(a.cpi>=a.total){this.finishRace(a,G);return;}}
  for(const r of this.rivals)if(!r.done)this.driveRival(r,a,dt,G);
  // place
  const me=this.prog(a.cpi,P.x,P.z,a);a.place=1+this.rivals.filter(r=>r.done||this.prog(r.cpi,r.car.x,r.car.z,a)>me).length;
  for(const cp of this.cp)cp.ring.rotation.y+=dt;}
 driveRival(r,a,dt,G){const car=r.car,w=a.way;let wi=r.wi;// advance waypoint
  while(wi<w.length-1&&Math.hypot(w[wi][0]-car.x,w[wi][1]-car.z)<10)wi++;r.wi=wi;const tgt=w[Math.min(wi+1,w.length-1)];const far=w[Math.min(wi+4,w.length-1)];
  // corner speed: look ahead
  const a1=Math.atan2(tgt[0]-car.x,tgt[1]-car.z),a2=Math.atan2(far[0]-tgt[0],far[1]-tgt[1]);let turn=Math.abs(((a2-a1+Math.PI*3)%(Math.PI*2))-Math.PI);
  const P=G.car;const behind=this.prog(r.cpi,car.x,car.z,a)<this.prog(a.cpi,P.x,P.z,a)-150;let want=car.spec.max*r.skill*(turn>1?.42:turn>.5?.7:1)*(behind?1.12:1);
  const inp=aiInput(car,tgt[0],tgt[1],want,{drift:true});if(r.stuck>1.4){inp.thr=0;inp.brk=1;inp.steer*=-1;if(r.stuck>2.6)r.stuck=0;}car.step(inp,dt,this.city,{wet:G.wet});if(car.speed<1.5&&a.stage==='go')r.stuck=(r.stuck||0)+dt;else r.stuck=0;
  const c=a.cps[r.cpi];if(c&&Math.hypot(car.x-c.x,car.z-c.z)<12){r.cpi++;if(r.cpi>=a.total){r.done=true;r.place=1+this.rivals.filter(o=>o!==r&&o.done&&o.place).length+(a.stage==='done'&&a.myPlace?1:0);}}}
 finishRace(a,G){a.stage='done';a.t2=0;const place=1+this.rivals.filter(r=>r.done).length;a.myPlace=place;const pay=[0,650,300,120][place];G.stats.races++;if(place===1)G.stats.raceWins++;G.earn(pay,'races',place===1?'RACE WON':'FINISHED P'+place);G.toast(['','1ST PLACE','2ND PLACE','3RD PLACE'][place]+' · +$'+pay,place===1?'#ffd040':'#c070ff');G.sfx(place===1?'cash':'cp');}}
