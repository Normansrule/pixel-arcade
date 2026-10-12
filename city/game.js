// NEON BAY — open-world coastal city. Original game for Pixel Arcade.
import {THREE,cl,lerp,wrapA,fmtCash,fmtRace,rng,sstep} from './util.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {World,DNAME,WL,RW,FWY_Y,BOUND,XS,ZS} from './world.js';
import {buildCity} from './build.js';
import {Env,nightOf} from './env.js';
import {Vehicle,Wheels,SPECS,SHOP,buildModel} from './vehicles.js';
import {Crowd,Walker,Peds,animate,newPose,randLook} from './people.js';
import {Traffic,Police,lightState} from './traffic.js';
import {Missions,KIND} from './missions.js';
import {Particles,Skids,Beams} from './fx.js';
import {Sound,STATIONS} from './sound.js';
import {Hud} from './hud.js';
import {addRound,bestKey,postScore,saveBest,userName} from '../js/kit3d/score.js';
const V=THREE.Vector3,$=id=>document.getElementById(id);
const DT=1/60;

/* ================= renderer / scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance',antialias:false});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.25,2600);
const U={uNight:{value:0},uTime:{value:0},uWet:{value:0},uRain:{value:0}};

/* ================= game object ================= */
const G={R,scene,cam,U,app:'loading',opt:{len:20,cops:1,traffic:1},vehicles:[],time:0,hour:7,clock:1200,total:1200,cash:500,rep:0,earned:0,stats:null,owned:['pip'],favCar:'pip',paint:{},freeze:false,weatherRain:0,camYaw:0,route:null,gpsTarget:null,waypoint:null,zoneName:'',timeScale:1};
window.G_=G;
function loadSave(){try{const s=JSON.parse(localStorage.getItem('pxd_neonbay'))||{};if(Array.isArray(s.owned)&&s.owned.length)G.owned=s.owned.filter(id=>SPECS[id]);if(s.fav&&SPECS[s.fav])G.favCar=s.fav;if(s.paint)G.paint=s.paint;if(s.opt)Object.assign(G.opt,s.opt);if(s.station!=null)G.station0=s.station;}catch(e){}}
function save(){try{localStorage.setItem('pxd_neonbay',JSON.stringify({owned:G.owned,fav:G.favCar,paint:G.paint,opt:G.opt,station:G.snd.station}));}catch(e){}}
loadSave();

async function boot(){
 try{await Promise.race([Promise.all([document.fonts.load('120px Anton'),document.fonts.load('bold 38px "JetBrains Mono"')]),new Promise(r=>setTimeout(r,1500))]);}catch(e){}
 const T0=performance.now(),TT={};const W=G.W=new World(1987);TT.world=performance.now()-T0;G.city=buildCity(scene,W,U,R);TT.city=performance.now()-T0;G.env=new Env(R,scene,W,U);TT.env=performance.now()-T0;
 G.wheels=new Wheels(scene);G.crowd=new Crowd(scene,110);G.peds=new Peds(W,G.crowd);G.traffic=new Traffic(G);G.police=new Police(G);G.snd=new Sound();if(G.station0!=null)G.snd.station=G.station0;
 G.smoke=new Particles(scene,2600,false);G.glow=new Particles(scene,2200,true);G.skids=new Skids(scene);G.beams=new Beams(scene,U);
 G.player={w:new Walker(),veh:null,get x(){return this.veh?this.veh.x:this.w.x;},get y(){return this.veh?this.veh.y:this.w.y;},get z(){return this.veh?this.veh.z:this.w.z;},get yaw(){return this.veh?this.veh.a:this.w.yaw;}};
 TT.actors=performance.now()-T0;G.hud=new Hud(G);TT.hud=performance.now()-T0;G.missions=new Missions(G);
 headlight();applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));G.city.streamChunks(0,0,99,true);TT.chunks=performance.now()-T0;
 toMenu();G.app='menu';TT.menu=performance.now()-T0;G.boot=TT;$('loading').hidden=true;requestAnimationFrame(loop);}

/* ================= headlight + reflections ================= */
let spot=null;function headlight(){spot=new THREE.SpotLight(0xfff2dd,0,70,.5,.55,1.4);spot.castShadow=false;scene.add(spot,spot.target);}
class Mirror{constructor(){this.rt=new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType});this.cam=new THREE.PerspectiveCamera();this.on=false;this.scale=.42;}
 render(R,scene,cam,w,h,hide,U){if(!this.on)return;const rw=Math.max(4,w*this.scale|0),rh=Math.max(4,h*this.scale|0);if(this.rt.width!==rw||this.rt.height!==rh)this.rt.setSize(rw,rh);
  const vc=this.cam,d=new V(0,0,-1).applyQuaternion(cam.quaternion),up=new V(0,1,0).applyQuaternion(cam.quaternion),py=.1;vc.position.set(cam.position.x,2*py-cam.position.y,cam.position.z);vc.up.set(up.x,-up.y,up.z);vc.lookAt(cam.position.x+d.x,2*py-(cam.position.y+d.y),cam.position.z+d.z);
  vc.near=cam.near;vc.far=cam.far;vc.updateMatrixWorld();vc.projectionMatrix.copy(cam.projectionMatrix);U.uTexMat.value.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
  const pl=new THREE.Plane(new V(0,1,0),-py).applyMatrix4(vc.matrixWorldInverse),cp=new THREE.Vector4(pl.normal.x,pl.normal.y,pl.normal.z,pl.constant),pm=vc.projectionMatrix.elements;const q=new THREE.Vector4((Math.sign(cp.x)+pm[8])/pm[0],(Math.sign(cp.y)+pm[9])/pm[5],-1,(1+pm[10])/pm[14]);cp.multiplyScalar(2/cp.dot(q));pm[2]=cp.x;pm[6]=cp.y;pm[10]=cp.z+1-.003;pm[14]=cp.w;
  hide.forEach(o=>o.visible=false);const fog=scene.fog;const prev=R.getRenderTarget();R.setRenderTarget(this.rt);R.clear();R.render(scene,vc);R.setRenderTarget(prev);hide.forEach(o=>o.visible=true);U.tRefl.value=this.rt.texture;}}
const mirror=new Mirror();

/* ================= quality ================= */
let gfx=quality(),fx=null;
function applyQuality(q){gfx=q;fx=null;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));if(G.env){const s=G.env.sun;s.castShadow=q>0;const n=q>=2?2048:1024;if(s.shadow.mapSize.x!==n){s.shadow.mapSize.set(n,n);if(s.shadow.map){s.shadow.map.dispose();s.shadow.map=null;}}}
 if(G.city)for(const p of G.city.props)p.R=p.R0=(p.R0||p.R);}
const POST={exposure:1,bloom:.5,bloomThreshold:.88,bloomRadius:.55,vignette:.3,saturation:1.08,grain:.02,ao:false};

/* ================= vehicles: spawn / enter / exit ================= */
function spawnVehicle(id,x,z,a,o={}){const v=new Vehicle(id,{mode:'parked',paint:o.paint??G.paint[id],owned:o.owned});v.attach(scene,U);v.place(x,z,a,G.W,o.y);v.traffic=!o.owned;if(o.owned)v.keep=true;G.vehicles.push(v);if(v.traffic)G.traffic.cars.push(v);return v;}
G.spawnVehicle=spawnVehicle;
function enterVehicle(v,instant){const P=G.player;if(P.veh){if(!instant||P.veh===v)return;const o=P.veh;o.mode='parked';o.driver=null;o.ctrl.thr=0;o.ctrl.steer=0;o.ctrl.hb=true;o.keep=o.owned;P.veh=null;}// kick out an NPC driver
 if(v.driver==='npc'&&v.mode==='lane'||v.mode==='chase'||v.mode==='race'&&!v.racer){const sa=Math.sin(v.a),ca=Math.cos(v.a);const c=G.peds.spawn(v.x,v.z,0,1e9);if(c){c.x=v.x-ca*(v.wid/2+.8);c.z=v.z+sa*(v.wid/2+.8);c.y=G.W.groundAt(c.x,c.z,v.y+1);c.state='walk';c.idle=1.2;c.fistT=1.2;c.flee=5;}if(!instant)G.snd.play('yelp');}
 if(v.id==='police'&&!instant){G.police.crime('cartheft',v.x,v.z,2,true);G.police.cops=G.police.cops.filter(c=>c!==v);}
 if(v.cop){v.cop={patrol:false,stolen:true};v.siren=false;}
 v.mode='player';v.driver='player';v.lane=null;v.keep=true;v.racer=null;v.stuck=0;P.veh=v;G.snd.play('door');if(G.snd.station<3)G.hud.toast(STATIONS[G.snd.station].name+(STATIONS[G.snd.station].tag?' · '+STATIONS[G.snd.station].tag:''),2);cam.userData.snap=true;}
G.enterVehicle=enterVehicle;
function exitVehicle(){const P=G.player,v=P.veh;if(!v)return;const sa=Math.sin(v.a),ca=Math.cos(v.a);const w=P.w;let ok=false;
 for(const side of[-1,1]){const x=v.x+(-ca)*side*(v.wid/2+.75),z=v.z+sa*side*(v.wid/2+.75);G.W.collide(x,z,.34,v.y+.4,v.y+1.7,_col);if(!_col.hit){w.x=x;w.z=z;ok=true;break;}}if(!ok){w.x=v.x;w.z=v.z;}
 w.y=G.W.groundAt(w.x,w.z,v.y+1.5);w.yaw=v.a;w.vx=w.vz=w.vy=0;w.state='idle';
 if(v.speed>9&&!v.water){w.knock(v.vx*.55,3.5,v.vz*.55);G.snd.play('whoosh');}
 v.mode='parked';v.driver=null;v.ctrl.thr=0;v.ctrl.steer=0;v.ctrl.hb=v.speed<9;v.keep=v.owned||(G.missions.active&&G.missions.active.car===v);G.snd.hornOn(false);P.veh=null;G.snd.play('door');cam.userData.snap=true;}
const _col={};

/* ================= money / rep ================= */
G.addCash=(n,label)=>{n=Math.round(n);G.cash+=n;if(n>0)G.stats.earned+=n;G.hud.cashPop(n,label);};
G.addRep=n=>{G.rep=Math.max(0,G.rep+n);};
G.rank=()=>G.rep>=300?'BAY LEGEND':G.rep>=160?'STREET STAR':G.rep>=80?'HUSTLER':G.rep>=25?'LOCAL':'NOBODY';
G.cheer=()=>{if(!G.player.veh){G.player.w.state='cheer';}};
G.sfx3d=(k,v)=>{const d=Math.hypot(v.x-G.player.x,v.z-G.player.z);G.snd.play(k,Math.max(0,1-d/45));};
G.setStation=i=>{G.snd.setStation(i);G.hud.toast(STATIONS[i].name+(STATIONS[i].tag?' · '+STATIONS[i].tag:''),2);save();};
G.setWaypoint=(x,z)=>{G.waypoint=x==null?null:{x,z};routeT=0;};
G.toggleMap=on=>{G.hud.openMap(on);if(on&&document.pointerLockElement)document.exitPointerLock();};
G.onStars=(n,kind)=>{G.snd.play('star');G.hud.toast('WANTED '+'★'.repeat(n)+({crash:' · RECKLESS DRIVING',ped:' · HIT A PEDESTRIAN',speeding:' · SPEEDING',redlight:' · RAN A RED LIGHT',ramcop:' · RAMMED A CRUISER',cartheft:' · STOLE A CRUISER'}[kind]||''));};
G.onEscape=st=>{G.snd.play('lost');G.hud.toast('YOU LOST THEM · +'+st*3+' REP');G.addRep(st*3);G.stats.escapes++;};
G.onBusted=()=>{const fine=Math.min(G.cash,Math.max(100,Math.round(G.cash*.12)));G.cash-=fine;G.stats.earned-=fine;G.stats.busted++;G.addRep(-8);G.snd.play('busted');G.hud.banner('BUSTED','FINE '+fmtCash(fine)+' · YOUR RIDE IS IMPOUNDED','#3d8bff',3.4);
 if(G.missions.active)G.missions.cleanup(),G.stats.failed++;G.police.clear();bustT=2.2;G.freeze=true;};
let bustT=0;function finishBust(){const P=G.player;if(P.veh){const v=P.veh;P.veh=null;v.driver=null;v.mode='parked';v.keep=false;}const p=G.W.pois.find(q=>q.kind==='police');P.w.place(p.x,p.z+1,G.W,0);P.w.state='idle';G.freeze=false;cam.userData.snap=true;}
G.buyCar=id=>{const s=SPECS[id];const own=G.owned.includes(id);if(!own&&G.cash<s.price){G.hud.toast('NOT ENOUGH CASH');return;}if(!own){G.cash-=s.price;G.owned.push(id);G.stats.spent+=s.price;G.snd.play('buy');G.hud.cashPop(-s.price,'');}
 G.favCar=id;save();G.hud.closeShop();const P=G.player;if(P.veh)exitVehicle();const p=nearestCarSpot();G.missions.clearAround(p[0],p[1],10);const v=spawnVehicle(id,p[0],p[1],p[2],{owned:true});enterVehicle(v,true);G.hud.toast(own?'ENJOY THE RIDE':'SOLD · '+s.name+' IS YOURS');};
function nearestCarSpot(){const P=G.player;let best=null,bd=1e9;for(const p of G.W.pois)if(p.car){const d=Math.hypot(p.x-P.x,p.z-P.z);if(d<bd){bd=d;best=p.car;}}return best;}
G.respray=c=>{const v=G.player.veh;if(!v){G.hud.toast('BRING A VEHICLE');return;}if(G.cash<150){G.hud.toast('NOT ENOUGH CASH');return;}G.cash-=150;G.stats.spent+=150;G.hud.cashPop(-150,'RESPRAY');v.setPaint(c);v.repair();if(v.owned){G.paint[v.id]=c;save();}G.snd.play('spray');
 if(G.police.stars>0){if(!G.police.seen){G.police.clear();G.hud.toast('NEW PAINT · THE COPS LOST YOUR DESCRIPTION');}else G.hud.toast('THEY SAW YOU GO IN!');}else G.hud.toast('GOOD AS NEW');G.hud.renderShop();};

/* ================= input ================= */
const keys={},edge={};let mouseDX=0,mouseDY=0,locked=false,lookIdle=9;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Backspace'].includes(e.code))e.preventDefault();
 if(G.app==='play'&&G.hud.phoneOpen&&G.hud.phoneKey(e.code)){delete edge[e.code];return;}
 if(e.code==='Escape'){if(G.hud.shopOpen){G.hud.closeShop();return;}if(G.hud.mapOpen){G.toggleMap(false);return;}if(G.hud.phoneOpen){G.hud.togglePhone(false);return;}if(G.app==='play')pause(true);else if(G.app==='paused')pause(false);}
 if(G.app==='play'&&e.code==='KeyM'){G.toggleMap(!G.hud.mapOpen);}});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
addEventListener('mousemove',e=>{if(locked){mouseDX+=e.movementX;mouseDY+=e.movementY;}});
canvas.addEventListener('mousedown',()=>{if(G.app==='play'&&!locked&&!G.hud.mapOpen&&!G.hud.shopOpen)lock();});
function lock(){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='play'&&!G.hud.mapOpen&&!G.hud.shopOpen&&!G.hud.phoneOpen)pause(true);});
const padPrev={};function pad(){const list=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];return list[0]||null;}
function readInput(){const k=c=>!!keys[c];const g=pad();const inp={mx:(k('KeyD')?1:0)-(k('KeyA')?1:0),mz:(k('KeyW')?1:0)-(k('KeyS')?1:0),sprint:k('ShiftLeft')||k('ShiftRight'),jump:!!(edge.Space),walk:k('AltLeft'),
  thr:(k('KeyW')||(!G.hud.phoneOpen&&k('ArrowUp'))?1:0)-(k('KeyS')||(!G.hud.phoneOpen&&k('ArrowDown'))?1:0),steer:(k('KeyA')||(!G.hud.phoneOpen&&k('ArrowLeft'))?1:0)-(k('KeyD')||(!G.hud.phoneOpen&&k('ArrowRight'))?1:0),hb:k('Space'),horn:k('KeyH'),
  enter:!!edge.KeyF,act:!!(edge.KeyE||edge.Enter&&!G.hud.phoneOpen),photo:!!edge.KeyP,radio:!!edge.KeyR,camMode:!!edge.KeyC,phone:!!(edge.KeyT||edge.Tab),lx:0,ly:0};
 if(g){const ax=g.axes,bt=g.buttons,pr=padPrev,dz=v=>Math.abs(v)>.18?v:0;const sx=dz(ax[0]||0),sy=dz(ax[1]||0);if(sx||sy){inp.mx=sx;inp.mz=-sy;}if(sx)inp.steer=-sx;const rt=bt[7]?.value||0,lt=bt[6]?.value||0;if(rt>.05||lt>.05)inp.thr=rt-lt;
  inp.lx=dz(ax[2]||0);inp.ly=dz(ax[3]||0);if(bt[0]?.pressed){inp.hb=true;if(!pr.a)inp.jump=true;}if(bt[10]?.pressed)inp.sprint=true;if(bt[1]?.pressed&&!G.player.veh)inp.sprint=true;if(bt[3]?.pressed&&!pr.y)inp.enter=true;if(bt[2]?.pressed&&!pr.x)inp.act=true;if(bt[11]?.pressed)inp.horn=true;if(bt[5]?.pressed&&!pr.rb)inp.radio=true;if(bt[4]?.pressed&&!pr.lb)inp.photo=true;if(bt[12]?.pressed&&!pr.up)inp.phone=true;if(bt[13]?.pressed&&!pr.dn)inp.camMode=true;
  if(bt[9]?.pressed&&!pr.st)pause(G.app==='play');if(bt[8]?.pressed&&!pr.bk&&G.app==='play')G.toggleMap(!G.hud.mapOpen);pr.a=bt[0]?.pressed;pr.y=bt[3]?.pressed;pr.x=bt[2]?.pressed;pr.rb=bt[5]?.pressed;pr.lb=bt[4]?.pressed;pr.up=bt[12]?.pressed;pr.dn=bt[13]?.pressed;pr.st=bt[9]?.pressed;pr.bk=bt[8]?.pressed;}
 for(const c in edge)delete edge[c];return inp;}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');if(document.pointerLockElement)document.exitPointerLock();G.snd.radioLevel(0);}
 else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= session flow ================= */
function weatherPlan(R){const p=[];const a=11+R()*4,b=21.5+R()*4;p.push([a,a+1.2+R()*1.2],[b,b+1.5+R()*1.5]);if(R()<.5){const c=3+R()*2;p.push([c,c+1]);}return p;}
let rainPlan=[];
function start(o={}){Object.assign(G.opt,o);save();G.snd.init();G.snd.setStation(G.snd.station);
 G.total=G.clock=G.opt.len*60;G.cash=500;G.rep=0;G.time=0;G.stats={earned:0,spent:0,missions:0,failed:0,races:0,bestRace:0,bestTrial:0,stunts:0,photos:0,busted:0,escapes:0,maxStars:0,crashes:0,air:0};G.stats.bestRace=Infinity;G.stats.bestTrial=Infinity;
 rainPlan=weatherPlan(rng(Date.now()&0xffff));G.W.stunts.forEach(s=>s.done=false);G.missions.cleanup();G.police.clear();G.police.maxStars=0;G.waypoint=null;G.route=null;
 // clear vehicles + peds
 for(const v of G.vehicles.slice())v.detach();G.vehicles.length=0;G.traffic.cars.length=0;G.peds.list.length=0;G.player.veh=null;
 const home=G.W.pois.find(p=>p.kind==='home');G.player.w.place(home.x-7,home.z,G.W,home.face);const car=G.owned.includes(G.favCar)?G.favCar:'pip';spawnVehicle(car,home.car[0],home.car[1],home.car[2],{owned:true});
 G.city.streamChunks(home.x,home.z,99,true);for(let i=0;i<30;i++)G.traffic.spawnOne(home.x,home.z,40,260);for(let i=0;i<20;i++)G.peds.spawn(home.x,home.z,8,120);
 G.app='play';G.freeze=false;bustT=0;camMode=0;G.camYaw=home.face;camPitch=.28;cam.userData.snap=true;
 $('menu').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');G.hud.objective(null);
 G.hud.banner('NEON BAY',`ONE DAY · ${G.opt.len} MINUTES · MAKE BANK`,'#ff4d00',3);setTimeout(()=>{if(G.app==='play')G.hud.toast('F ENTER YOUR CAR · T PHONE FOR JOBS · M MAP',5);},2600);lock();}
function toMenu(){G.app='menu';G.missions&&G.missions.cleanup();$('menu').hidden=false;$('keys').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;document.body.classList.remove('playing');G.hud.togglePhone(false);G.hud.openMap(false);G.hud.closeShop();
 if(document.pointerLockElement)document.exitPointerLock();menuT=0;G.hour=18.4;career();
 if(!G.traffic.cars.length){for(let i=0;i<26;i++)G.traffic.spawnOne(60,150,0,400,true);}}
function career(){let best=0;try{best=+(localStorage.getItem(hsKey())||0);}catch(e){}$('career').textContent=`BEST SCORE ${best.toLocaleString('en-US')} · GARAGE: ${G.owned.map(id=>SPECS[id].name).join(', ')}`;}
function hsKey(){return bestKey('neonbay');}
function score(){return Math.max(0,Math.round(G.stats.earned+G.rep*10));}
let lastAward=null;
function endDay(){G.app='over';G.missions.cleanup();G.snd.hornOn(false);if(document.pointerLockElement)document.exitPointerLock();$('hud').hidden=true;document.body.classList.remove('playing');G.hud.togglePhone(false);G.hud.openMap(false);G.hud.closeShop();
 const s=G.stats,sc=score();const won=s.earned>=5000;let tok=5+Math.min(60,sc/250|0);
 addRound(tok,won);saveBest('neonbay',sc);
 lastAward={score:sc,cash:G.cash,earned:s.earned,rep:G.rep,missions:G.missions.passed,best:s.bestRace,len:G.opt.len,won};
 $('ores').textContent=won?'BIG DAY':'DAY DONE';$('oeye').textContent=`THE SUN'S UP · ${G.opt.len}-MINUTE DAY · ${G.rank()}`;$('ofs').textContent=sc.toLocaleString('en-US')+' PTS';
 const rows=[['CASH IN HAND',fmtCash(G.cash)],['EARNED TODAY',fmtCash(s.earned)],['SPENT',fmtCash(s.spent)],['REPUTATION',G.rep+' · '+G.rank()],['MISSIONS PASSED',G.missions.passed+(s.failed?' · '+s.failed+' failed':'')],['BEST RACE TIME',fmtRace(s.bestRace)],['BEST TRIAL TIME',fmtRace(s.bestTrial)],['UNIQUE STUNTS',s.stunts+' / '+G.W.stunts.length],['PHOTOS',s.photos],['MOST WANTED','★'.repeat(G.police.maxStars)||'—'],['TIMES BUSTED',s.busted]];
 let th='';for(let i=0;i<rows.length;i+=2){const A=rows[i],B=rows[i+1];th+=`<tr><td>${A[0]}</td><td>${A[1]}</td>${B?`<td>${B[0]}</td><td>${B[1]}</td>`:'<td></td><td></td>'}</tr>`;}$('stats').innerHTML=th;let best=0;try{best=+(localStorage.getItem(hsKey())||0);}catch(e){}$('otok').textContent=`+${tok} TOKENS · BEST ${best.toLocaleString('en-US')} PTS · SCORE = EARNINGS + 10 × REP`;$('over').hidden=false;overT=0;}
let overT=0,menuT=0;

/* ================= simulation ================= */
let routeT=0,zoneT=0,speedT=0,lastNode=null,photoT=0,stuntSlow=0,airTrack=null;
function fixed(dt){const P=G.player,W=G.W;
 // vehicles
 for(const v of G.vehicles){if(v.mode==='lane')continue;if(G.freeze&&(v.mode==='player'||v.mode==='race'))continue;
  if(v.mode==='parked'){if(v.onG&&v.speed<.05&&!v.water&&Math.abs(v.w)<.01){v.vx=v.vz=0;continue;}v.ctrl.thr=0;v.ctrl.hb=v.speed<12;}
  v.step(dt,W,{wet:U.uWet.value});}
 collideVehicles();
 // events
 for(const v of G.vehicles){if(!v.events.length)continue;for(const e of v.events)vehEvent(v,e);v.events.length=0;}}
function collideVehicles(){const L=G.vehicles,n=L.length,ca=[],cb=[];for(let i=0;i<n;i++){const a=L[i];if(!a.group)continue;for(let j=i+1;j<n;j++){const b=L[j];if(!b.group)continue;if(a.mode==='lane'&&b.mode==='lane')continue;const dx=b.x-a.x,dz=b.z-a.z,R=(a.len+b.len)/2;if(dx*dx+dz*dz>R*R||Math.abs(a.y-b.y)>2.2)continue;
  a.circles(ca);b.circles(cb);let best=null;for(const p of ca)for(const q of cb){const ex=q.x-p.x,ez=q.z-p.z,d=Math.hypot(ex,ez),pen=a.r+b.r-d;if(pen>0&&(!best||pen>best.pen))best={p,q,pen,nx:ex/(d||1),nz:ez/(d||1)};}if(!best)continue;
  for(const v of[a,b])if(v.mode==='lane'){v.mode='parked';v.driver='npc';v.npcStop=1;v.vx=v.vx||0;v.vz=v.vz||0;}
  const ma=a.mass*(a.mode==='parked'&&a.speed<.5?1.6:1),mb=b.mass*(b.mode==='parked'&&b.speed<.5?1.6:1),im=1/ma+1/mb;const{nx,nz,pen}=best;a.x-=nx*pen*(1/ma)/im;a.z-=nz*pen*(1/ma)/im;b.x+=nx*pen*(1/mb)/im;b.z+=nz*pen*(1/mb)/im;
  const vr=(b.vx-a.vx)*nx+(b.vz-a.vz)*nz;if(vr<0){const J=-(1.3)*vr/im;a.vx-=J/ma*nx;a.vz-=J/ma*nz;b.vx+=J/mb*nx;b.vz+=J/mb*nz;a.w+=(Math.random()-.5)*vr*.05;b.w-=(Math.random()-.5)*vr*.05;
   const str=-vr;if(str>3){const hx=(best.p.x+best.q.x)/2,hz=(best.p.z+best.q.z)/2;a.hurt(str*1.1/a.mass*.9,{nx:-nx,nz:-nz,x:hx,z:hz});b.hurt(str*1.1/b.mass*.9,{nx,nz,x:hx,z:hz});crashFx(hx,(a.y+b.y)/2+.7,hz,str);
    const pv=G.player.veh;if(pv===a||pv===b){const o=pv===a?b:a;G.stats.crashes++;const sg=pv===a?1:-1;const app=(pv.vx*nx+pv.vz*nz)*sg;if(o.cop&&app>4)G.police.crime('ramcop',o.x,o.z,str>8?1.2:.6,true);else if(o.cop){}else if(str>6)G.police.crime('crash',pv.x,pv.z,.6);if(o.mode==='parked'&&o.driver==='npc'&&Math.random()<.6)setTimeout(()=>G.sfx3d('honk',o),400);}}}}}}
function vehEvent(v,e){const P=G.player,mine=v===P.veh;
 if(e.t==='crash'){crashFx(e.x,v.y+.7,e.z,e.str);if(mine){G.stats.crashes++;shake=Math.max(shake,Math.min(.6,e.str*.03));}if(mine&&v.bike&&e.str>14){exitVehicle();P.w.knock(v.vx*.4+(Math.random()-.5)*4,5,v.vz*.4);G.hud.toast('WIPEOUT!');}}
 else if(e.t==='land'){if(mine){if(e.imp>4)G.snd.play('land',e.imp);if(e.imp>6)shake=Math.max(shake,Math.min(.5,e.imp*.03));stuntLand(v,e);}}
 else if(e.t==='splash'){G.smoke.burst({x:v.x,y:WL+.2,z:v.z},40,8,new THREE.Color(.85,.92,.95),2.4,1.6,{up:true,grav:6,grow:1,a:.8});if(Math.hypot(v.x-P.x,v.z-P.z)<60)G.snd.play('splash');if(mine)G.hud.toast('SPLASHDOWN! SWIM FOR SHORE');}
 else if(e.t==='wreck'){G.smoke.burst({x:v.x,y:v.y+1,z:v.z},30,5,new THREE.Color(.12,.12,.13),3,2.4,{up:true,grav:-1.2,grow:1.5,a:.9});G.glow.burst({x:v.x,y:v.y+1,z:v.z},50,12,[new THREE.Color(3,1.4,.3),new THREE.Color(2.4,.6,.1)],.5,.8,{grav:9});if(mine){G.hud.toast('WRECKED · PRESS F TO GET OUT');G.snd.play('crash',20);}}}
function crashFx(x,y,z,str){if(Math.hypot(x-G.player.x,z-G.player.z)>140)return;G.glow.burst({x,y,z},Math.min(40,6+str*1.5|0),6+str*.4,[new THREE.Color(3,2,.8),new THREE.Color(2.5,1.2,.3)],.28,.5,{grav:14,drag:1.2});
 if(str>8)G.smoke.burst({x,y,z},6,2,new THREE.Color(.55,.55,.56),1.6,1.2,{up:true,grav:-.5,grow:1.2,a:.5});G.snd.play('crash',str);
 // nearby peds panic
 for(const c of G.peds.list)if(!c.custom&&Math.hypot(c.x-x,c.z-z)<18&&(c.state==='walk'||c.state==='idle')){c.flee=4;c.idle=0;}}
// stunts: big air bonus + unique stunt ramps
function stuntLand(v,e){const air=e.air,f=e.from;if(!f)return;const dist=Math.hypot(v.x-f.x,v.z-f.z);G.stats.air=Math.max(G.stats.air,air);
 const D=f.deck&&f.deck.deck&&f.deck.deck.stunt;const ok=Math.abs(v.vroll)<.9&&Math.abs(v.vpitch)<.9;
 if(D&&air>.7){if(!D.done&&ok){D.done=true;G.stats.stunts++;const pay=Math.round(250+dist*5+air*80);G.addCash(pay,'STUNT');G.addRep(6);G.hud.banner('UNIQUE STUNT',`${D.name} · ${dist.toFixed(0)} M · ${air.toFixed(1)}s AIR`,'#ffe14a',2.8);G.snd.play('stunt');}
  else if(D.done&&ok){G.addCash(40,'STUNT');G.hud.toast('STUNT · '+dist.toFixed(0)+' M');}else if(!ok)G.hud.toast('BOTCHED LANDING');}
 else if(air>1.3&&ok){const pay=Math.round(air*30);G.addCash(pay,'AIR');G.hud.toast(`BIG AIR · ${air.toFixed(1)}s`);G.addRep(1);}
 const m=G.missions.active;if(m&&m.kind==='taxi'&&m.phase==='ride'&&air>.5)G.hud.toast('THE FARE LOVED THAT · TIP +'+fmtCash(air*45));}

function step(dt){dt=Math.min(dt,.1);G.time+=dt;U.uTime.value=G.time;
 if(G.app==='menu'){menuT+=dt;G.hour=18.2+Math.sin(menuT*.02)*.4;simWorld(dt,true);menuCam(dt);return;}
 if(G.app==='over'){overT+=dt;simWorld(dt,true);overCam(dt);return;}
 if(G.app!=='play'){visuals(0);return;}
 const inp=readInput();const P=G.player;
 if(G.hud.mapOpen||G.hud.shopOpen){mouseDX=mouseDY=0;visuals(0);G.hud.update(0);return;}
 // session clock + time of day
 G.clock-=dt;if(G.clock<=0){G.clock=0;endDay();return;}G.hour=(7+24*(1-G.clock/G.total))%24;
 if(bustT>0){bustT-=dt;if(bustT<=0)finishBust();}
 // controls
 if(inp.phone){G.hud.togglePhone();}
 if(inp.radio&&P.veh){G.setStation((G.snd.station+1)%STATIONS.length);}
 if(inp.camMode&&P.veh){camMode=(camMode+1)%3;G.hud.toast(['CHASE CAM','FAR CAM','BUMPER CAM'][camMode],1.2);}
 if(inp.photo){photoT=.4;G.hud.flash();G.snd.play('shutter');const m=G.missions.active;if(m&&m.snap)m.snap();else if(!P.veh)P.w.lock=.4;}
 const freeze=G.freeze||bustT>0;
 if(P.veh){const v=P.veh;if(!freeze){v.ctrl.thr=inp.thr;v.ctrl.steer=inp.steer;v.ctrl.hb=inp.hb;}else{v.ctrl.thr=0;v.ctrl.hb=true;}G.snd.hornOn(inp.horn&&!v.wrecked);if(inp.horn&&!v.hornCd){v.hornCd=1;for(const c of G.peds.list)if(Math.hypot(c.x-v.x,c.z-v.z)<14&&c.state==='walk'){c.flee=2;}}if(!inp.horn)v.hornCd=0;
  if(inp.enter&&!freeze&&v.speed<30)exitVehicle();
  if(v.water>1.2){exitVehicle();P.w.y=WL-1.15;P.w.swim=true;}}
 else{const w=P.w;const ip={mx:freeze?0:inp.mx,mz:freeze?0:inp.mz,sprint:inp.sprint,jump:!freeze&&inp.jump,walk:inp.walk,pose:photoT>0?'photo':null};
  // enter nearest vehicle
  if(inp.enter&&!freeze&&w.state!=='tumble'&&w.state!=='prone'){let best=null,bd=4.2;for(const v of G.vehicles){if(v.wrecked||v.water||v.driver==='player')continue;const d=Math.hypot(v.x-w.x,v.z-w.z);if(d<bd&&Math.abs(v.y-w.y)<2){bd=d;best=v;}}if(best){enterVehicle(best);}}
  if(!P.veh)w.update(dt,ip,G.camYaw,G.W,G.vehicles,(k,v)=>{if(k==='jump')G.snd.play('jump');else if(k==='land')G.snd.play('land',4);else if(k==='hitbycar'&&v&&w.state!=='tumble'){w.knock(v.vx*.5,4,v.vz*.5);G.snd.play('crash',6);}});}
 photoT-=dt;
 // interact with mission markers / shops
 const poi=G.missions.nearPOI();let prompt='';
 if(poi&&bustT<=0){const K=KIND[poi.kind];if(poi.kind==='spray'){prompt=P.veh?'<kbd>E</kbd> RESPRAY $150':'BRING A VEHICLE TO RESPRAY';if(inp.act&&P.veh)G.hud.openShop('spray');}
  else if(poi.kind==='garage'||poi.kind==='home'){prompt=`<kbd>E</kbd> ${poi.kind==='home'?'CALL ONE OF YOUR CARS':'BROWSE CARS'}`;if(inp.act)G.hud.openShop('garage');}
  else{prompt=`<kbd>E</kbd> START ${K.label} · <span>${poi.name}</span><br><small>${K.job}</small>`;if(inp.act){G.missions.start(poi);}}}
 else if(!P.veh&&bustT<=0){let best=null,bd=4.2;for(const v of G.vehicles){if(v.wrecked||v.water)continue;const d=Math.hypot(v.x-P.w.x,v.z-P.w.z);if(d<bd&&Math.abs(v.y-P.w.y)<2){bd=d;best=v;}}if(best&&P.w.state!=='tumble')prompt=`<kbd>F</kbd> ${best.driver==='npc'?'BORROW':'ENTER'} ${best.spec.name}`;}
 else if(P.veh&&P.veh.wrecked)prompt='<kbd>F</kbd> GET OUT';
 G.hud.prompt(prompt);
 // physics
 let ts=G.timeScale;if(stuntSlow>0){stuntSlow-=dt;ts=.45;}acc+=dt*ts;let n=0;while(acc>=DT&&n<4){fixed(DT);acc-=DT;n++;}if(n>=4)acc=0;
 // stunt slow-mo trigger: leaving a fresh unique ramp
 const pv=P.veh;if(pv&&!pv.onG&&pv.airStart&&pv.air<.1){const D=pv.airStart.deck&&pv.airStart.deck.deck&&pv.airStart.deck.deck.stunt;if(D&&!D.done&&pv.speed>14)stuntSlow=1.2;}
 if(pv&&pv.onG)stuntSlow=Math.min(stuntSlow,0);
 // crimes witnessed by patrols: speeding + red lights
 crimes(dt);
 G.police.update(dt);G.missions.update(dt);
 simWorld(dt,false);
 // GPS
 routeT-=dt;const tgt=G.missions.gps()||G.waypoint;G.gpsTarget=tgt;if(tgt){if(routeT<=0){routeT=1;G.route=G.W.route(P.x,P.z,tgt.x,tgt.z).pts;}if(G.waypoint&&!G.missions.active&&Math.hypot(tgt.x-P.x,tgt.z-P.z)<15){G.waypoint=null;G.hud.toast('YOU HAVE ARRIVED');}}else G.route=null;
 zoneT-=dt;if(zoneT<=0){zoneT=.5;const z=DNAME[G.W.zone(P.x,P.z,P.y)]||'';if(z!==G.zoneName){G.zoneName=z;const e=$('zone');e.classList.remove('show');void e.offsetWidth;e.classList.add('show');}}
 G.hud.update(dt);G.police.maxStars=Math.max(G.police.maxStars,G.police.stars);}
let acc=0;
function crimes(dt){const P=G.player,v=P.veh;speedT-=dt;if(!v)return;
 if(v.speed>31&&speedT<=0){for(const c of G.vehicles){if(!c.cop||!c.cop.patrol)continue;const d=Math.hypot(c.x-v.x,c.z-v.z);if(d<32&&G.W.los(c.x,c.z,v.x,v.z,2)){if(G.police.crime('speeding',v.x,v.z,1))speedT=8;break;}}}
 // red lights at signalised junctions
 let node=null;for(const n of G.W.nodes){if(!n.light)continue;if(Math.abs(v.x-n.x)<RW&&Math.abs(v.z-n.z)<RW&&v.y<3){node=n;break;}}
 if(node&&node!==lastNode&&v.speed>7){const axis=Math.abs(Math.sin(v.a))>Math.abs(Math.cos(v.a))?'x':'z';if(lightState(node,axis,G.traffic.t)===2)G.police.crime('redlight',v.x,v.z,1);}lastNode=node;}
// world sim shared by menu attract mode and play
let wantT=0;
function simWorld(dt,attract){const P=G.player;const fx=attract?cam.position.x:P.x,fz=attract?cam.position.z:P.z;const want=[18,30,42][G.opt.traffic];
 G.traffic.update(dt,fx,fz,attract?24:want);
 if(attract){acc+=dt;let n=0;while(acc>=DT&&n<3){for(const v of G.vehicles){if(v.mode==='lane')continue;if(v.mode==='parked'&&v.onG&&v.speed<.05)continue;v.step(DT,G.W,{});}collideVehicles();for(const v of G.vehicles)v.events.length=0;acc-=DT;n++;}if(n>=3)acc=0;}
 G.peds.update(dt,fx,fz,attract?14:[20,30,40][G.opt.traffic],G.vehicles,(k,c,v)=>{if(k==='pedhit'){G.snd.play('crash',4);G.snd.play('yelp');if(v===P.veh)G.police.crime('ped',v.x,v.z,1);}else if(k==='peddive'){if(Math.hypot(c.x-P.x,c.z-P.z)<30)G.snd.play('yelp');}});
 // weather
 let rain=0;for(const[a,b]of rainPlan){const h=G.hour<a-1?G.hour+24:G.hour;rain=Math.max(rain,sstep(a,a+.3,h)*(1-sstep(b-.3,b,h)));}if(attract)rain=0;G.weatherRain=rain;U.uWet.value=cl(Math.max(rain*1.25,U.uWet.value-dt*.004*(G.total/1200<1?2:1)),0,1);
 visuals(dt);}

/* ================= visuals ================= */
let shake=0;const tv=new V(),tv2=new V();
function visuals(dt){const P=G.player,night=nightOf(G.hour);
 // streaming
 G.city.streamChunks(cam.position.x,cam.position.z,1);G.city.update(cam,G.time);
 // vehicles
 G.wheels.begin();G.beams.begin();for(const v of G.vehicles){v.sync(Math.max(dt,1e-3),U,G.wheels,night);if(night>.05&&!v.wrecked&&Math.hypot(v.x-cam.position.x,v.z-cam.position.z)<220)G.beams.add(v);vehFx(v,dt);}G.wheels.end();G.beams.end();
 // characters
 G.crowd.begin();const w=P.w;if(!P.veh)G.crowd.draw(w);else if(P.veh.bike){rider(w,P.veh,dt);G.crowd.draw(w);}
 for(const v of G.vehicles)if(v.bike&&v!==P.veh&&v.driver==='npc'){v.rider=v.rider||{look:randLook(),pose:newPose(),state:'ride',t:0};rider(v.rider,v,dt);G.crowd.draw(v.rider);}
 G.peds.draw(G.crowd);G.crowd.end();
 G.smoke.update(dt);G.glow.update(dt);
 // rain splashes near the camera
 if(G.weatherRain>.2&&dt>0)for(let i=0;i<G.weatherRain*6;i++){const x=cam.position.x+(Math.random()-.5)*40,z=cam.position.z+(Math.random()-.5)*40;const y=G.W.groundAt(x,z,cam.position.y);G.glow.emit(x,y+.05,z,0,1.5,0,.35,.38,.42,.18,.25,{grav:9});}
 // headlight for the player's car
 const pv=P.veh;if(pv&&night>.1&&!pv.wrecked){const sa=Math.sin(pv.a),ca=Math.cos(pv.a);spot.position.set(pv.x+sa*2.2,pv.y+1.0,pv.z+ca*2.2);spot.target.position.set(pv.x+sa*22,pv.y-1,pv.z+ca*22);spot.intensity=night*90;}else spot.intensity=0;
 // audio
 if(G.snd.ac){G.snd.drive(pv,G.app==='play'&&!!pv);const S=G.police.stars;let near=0;for(const v of G.vehicles)if(v.siren){const d=Math.hypot(v.x-P.x,v.z-P.z);near=Math.max(near,1-d/150);}G.snd.env(G.weatherRain,Math.max(0,near),G.time,!!pv,G.app==='play'?.5:.2);
  G.snd.radioLevel(G.app==='menu'?.18:G.app==='play'&&pv&&G.snd.station<3?.42:0);G.snd.tick();}}
function rider(ch,v,dt){const sa=Math.sin(v.a),ca=Math.cos(v.a);ch.x=v.x-sa*.25;ch.z=v.z-ca*.25;ch.y=v.y+.12;ch.yaw=v.a;ch.state='ride';ch.rideLean=Math.max(0,v.vf)*.004;ch.pose.rz=v.lean;ch.pose.rx=v.vpitch;animate(ch,Math.max(dt,.016));ch.pose.rz=v.lean;ch.pose.rx=v.vpitch;}
function vehFx(v,dt){if(dt<=0)return;const d=Math.hypot(v.x-cam.position.x,v.z-cam.position.z);if(d>140)return;const sa=Math.sin(v.a),ca=Math.cos(v.a);const f=v.dmg/v.hp;
 if(f>.55&&Math.random()<dt*(f>.85?26:10)){const hx=v.x+sa*(v.len/2-.6),hz=v.z+ca*(v.len/2-.6);const c=f>.85||v.wrecked?.12:.75;G.smoke.emit(hx+(Math.random()-.5)*.6,v.y+1.1,hz+(Math.random()-.5)*.6,(Math.random()-.5)*.6,1.6+Math.random(),(Math.random()-.5)*.6,c,c,c*1.02,1.1,2.2,{grow:2.2,a:f>.85?.85:.55,drag:.6});
  if(v.wrecked&&Math.random()<.4)G.glow.emit(hx,v.y+1,hz,(Math.random()-.5),2+Math.random()*2,(Math.random()-.5),2.6,1,.2,.45,.5,{grav:-1});}
 if(v.onG&&v.slip>.38&&v.speed>4&&!v.water){const surf=v.surf;for(const s of(v.bike?[0]:[-1,1])){const rx=v.x-sa*(v.len/2-.7)-ca*s*(v.wid/2-.25),rz=v.z-ca*(v.len/2-.7)+sa*s*(v.wid/2-.25);
   if(surf==='road'||surf==='walk'){G.skids.mark(v.uid+'_'+s,rx,v.y,rz,v.bike?.18:.26);if(Math.random()<v.slip*.6)G.smoke.emit(rx,v.y+.3,rz,(Math.random()-.5),.8,(Math.random()-.5),.8,.8,.82,.9,1.4,{grow:2.5,a:.42*v.slip,drag:1.2});}
   else{G.skids.lift(v.uid+'_'+s);if(Math.random()<.5){const c=surf==='sand'?[.85,.75,.55]:[.55,.47,.36];G.smoke.emit(rx,v.y+.3,rz,(Math.random()-.5)*2,1,(Math.random()-.5)*2,c[0],c[1],c[2],1,1.2,{grow:2,a:.5});}}}}
 else{G.skids.lift(v.uid+'_-1');G.skids.lift(v.uid+'_1');G.skids.lift(v.uid+'_0');}
 if(v.water&&v.water<2&&Math.random()<.5)G.smoke.emit(v.x+(Math.random()-.5)*2,WL+.1,v.z+(Math.random()-.5)*2,0,1.5,0,.9,.95,1,1,1,{grow:1.5,a:.6});}

/* ================= cameras ================= */
let camMode=0,camPitch=.28,camDist=4.4;const cpos=new V(),clook=new V();
function camera(dt){const P=G.player,W=G.W;const mx=mouseDX,my=mouseDY;mouseDX=mouseDY=0;const g=readStick();
 const lookX=mx*.0024+g.x*dt*2.6,lookY=my*.0022+g.y*dt*1.8;
 let want,look,fov=62;
 if(bustT>0){const p=new V(P.x,P.y,P.z);G.camYaw+=dt*.4;want=p.clone().add(new V(Math.sin(G.camYaw)*-9,4.5,Math.cos(G.camYaw)*-9));look=p.clone().add(new V(0,1,0));}
 else if(P.veh){const v=P.veh;if(Math.abs(lookX)+Math.abs(lookY)>1e-4){lookIdle=0;}else lookIdle+=dt;G.camYaw-=lookX;camPitch=cl(camPitch+lookY,-.15,1.1);
  const sp=Math.abs(v.vf);let tgtYaw=v.a;if(v.vf<-3)tgtYaw=v.a;if(lookIdle>1.2){G.camYaw+=wrapA(tgtYaw-G.camYaw)*Math.min(1,dt*(2.2+sp*.06));camPitch+=(.2-camPitch)*Math.min(1,dt*1.5);}
  const far=camMode===1?1.5:1;const dist=(v.len*.95+3.6+(v.bike?-.6:0))*far+sp*.03,h=(v.bike?1.9:2.4)*far+camPitch*dist*.6;
  if(stuntSlow>0){const sa=Math.sin(v.a+1.3),ca=Math.cos(v.a+1.3);want=new V(v.x+sa*12,v.y+3,v.z+ca*12);look=new V(v.x,v.y+1,v.z);fov=55;}
  else if(camMode===2){const sa=Math.sin(v.a),ca=Math.cos(v.a);want=new V(v.x+sa*(v.len/2-.2),v.y+(v.bike?1.45:1.15),v.z+ca*(v.len/2-.2));look=new V(v.x+sa*30,v.y+1,v.z+ca*30);fov=72;}
  else{const fx=Math.sin(G.camYaw),fz=Math.cos(G.camYaw);want=new V(v.x-fx*dist,v.y+h,v.z-fz*dist);look=new V(v.x+fx*4,v.y+1.3,v.z+fz*4);fov=62+Math.min(18,sp*.28);}}
 else{const w=P.w;G.camYaw-=lookX;camPitch=cl(camPitch+lookY,-.35,1.25);const fx=Math.sin(G.camYaw),fz=Math.cos(G.camYaw),rx=-fz,rz=fx;const head=new V(w.x+rx*.38,w.y+(w.swim?.6:1.55),w.z+rz*.38);
  const dist=camDist,cp=Math.cos(camPitch),spc=Math.sin(camPitch);want=new V(head.x-fx*dist*cp,head.y+dist*spc,head.z-fz*dist*cp);look=head.clone().add(new V(fx*2,-.2,fz*2));fov=60+Math.min(6,w.spd);}
 // collision: pull the camera in front of walls
 const lk=look,fr=W.rayFree(lk.x,lk.y,lk.z,want.x,want.y,want.z);if(fr<1){want.lerpVectors(lk,want,Math.max(.12,fr-.04));}
 const gy=W.groundAt(want.x,want.z,want.y)+.35;if(want.y<gy&&!W.inTunnel(want.x,want.z))want.y=gy;
 if(cam.userData.snap){cpos.copy(want);clook.copy(look);cam.userData.snap=false;}else{const k=1-Math.exp(-dt*(P.veh?9:14)),kl=1-Math.exp(-dt*16);cpos.lerp(want,k);clook.lerp(look,kl);}
 cam.position.copy(cpos);shake=Math.max(0,shake-dt*1.5);const s=shake*shake*.6;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.position.z+=(Math.random()-.5)*s;cam.lookAt(clook);cam.fov+=(fov-cam.fov)*Math.min(1,dt*3);cam.updateProjectionMatrix();
 const f=new V();cam.getWorldDirection(f);G.camYaw=P.veh&&lookIdle>1.2?G.camYaw:G.camYaw;G.viewYaw=Math.atan2(f.x,f.z);}
function readStick(){const g=pad();if(!g)return{x:0,y:0};const dz=v=>Math.abs(v)>.18?v:0;return{x:dz(g.axes[2]||0),y:dz(g.axes[3]||0)};}
const MENU_PATH=[[150,60,520,60,8,300],[-120,45,470,-60,10,280],[-260,70,-150,-60,20,-420],[400,90,-200,90,10,-100],[300,22,420,120,6,300]];
function menuCam(dt){const n=MENU_PATH.length,t=menuT/18,i=Math.floor(t)%n,f=sstep(0,1,t%1);const a=MENU_PATH[i],b=MENU_PATH[(i+1)%n];const p=a.map((v,k)=>lerp(v,b[k],f));cam.position.set(p[0],p[1],p[2]);cam.lookAt(p[3],p[4],p[5]);cam.fov=55;cam.updateProjectionMatrix();G.viewYaw=0;}
function overCam(dt){const P=G.player;const a=overT*.08;cam.position.set(P.x+Math.cos(a)*170,P.y+120,P.z+Math.sin(a)*170);cam.lookAt(P.x,P.y+10,P.z);cam.fov=50;cam.updateProjectionMatrix();}

/* ================= render ================= */
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);if(fx)fx.setSize(w,h);}
 cam.aspect=w/h;cam.updateProjectionMatrix();const P=G.player;
 const focus=G.app==='play'||G.app==='paused'?new V(P.x,P.y,P.z):new V(cam.position.x,0,cam.position.z).add(new V(0,0,0).copy(cam.getWorldDirection(new V())).multiplyScalar(60));
 G.env.update(0,G.hour,G.weatherRain,focus,cam,gfx);const pal=G.env.pal,night=nightOf(G.hour);
 R.toneMappingExposure=pal.exp;if(!fx){fx=cinematic(R,scene,cam,{...POST,quality:gfx});}
 if(fx.bloom){fx.bloom.strength=lerp(.3,.62,night)+G.weatherRain*.06;fx.bloom.threshold=lerp(.93,.78,night);}
 G.smoke.U.uScale.value=G.glow.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 mirror.on=gfx>=2&&U.uWet.value>.06;G.city.reflU.uReflStr.value=mirror.on?.85:0;if(mirror.on){mirror.render(R,scene,cam,w*R.getPixelRatio(),h*R.getPixelRatio(),[G.city.streets,G.city.inters,G.city.slabs],G.city.reflU);}
 R.shadowMap.needsUpdate=gfx>0;fx.render();}
addEventListener('resize',()=>{fx&&fx.setSize(innerWidth,innerHeight);});

/* ================= loop ================= */
let last=performance.now();function tick(dt){step(dt);if(G.app==='play'||G.app==='paused')camera(dt);}function frame(dt){tick(dt);render();}
function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;frame(dt);requestAnimationFrame(loop);}

/* ================= menu wiring ================= */
const seg=(id,key)=>{const el=$(id);const set=v=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));};set(G.opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(+b.dataset.v));};
seg('o-len','len');seg('o-cops','cops');seg('o-traffic','traffic');
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Neon Bay\nScore: ${a.score||0}\nEarned: ${fmtCash(a.earned||0)} · Cash: ${fmtCash(a.cash||0)}\nRep: ${a.rep||0} · Missions passed: ${a.missions||0}\nBest race: ${fmtRace(a.best)}\nDay length: ${a.len||''} min\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore('neonbay',a.score||0,body);};
addEventListener('pointerdown',()=>{if(G.snd&&G.app==='menu')G.snd.init();},{once:false});

/* ================= test hooks ================= */
window.NEONBAY={get state(){return G.app;},get app(){return G.app;},start,toMenu,step,render,frame,tick,endDay,pause,get boot(){return G.boot;},
 setClock(s){G.clock=s;},get clock(){return G.clock;},setHour(h){G.clock=G.total*(1-(((h-7)%24+24)%24)/24);},get hour(){return G.hour;},
 get cash(){return G.cash;},addCash(n){G.addCash(n,'TEST');},get rep(){return G.rep;},get score(){return score();},get stats(){return G.stats;},
 get heat(){return G.police.stars;},setHeat(n){G.police.set(n);},get police(){return G.police;},
 get player(){const P=G.player;return{x:P.x,y:P.y,z:P.z,inVehicle:!!P.veh,vehicle:P.veh?P.veh.id:null,state:P.w.state,speed:P.veh?P.veh.speed:P.w.spd,dmg:P.veh?P.veh.dmg:0};},
 teleport(x,z,a=0){const P=G.player;if(P.veh){P.veh.place(x,z,a,G.W);}else P.w.place(x,z,G.W,a);cam.userData.snap=true;G.city.streamChunks(x,z,99,true);},
 spawnAndEnter(id='pip'){const P=G.player;if(P.veh)exitVehicle();const v=spawnVehicle(id,P.x+3,P.z,P.yaw);enterVehicle(v,true);return v;},enter:enterVehicle,exit:exitVehicle,
 get vehicles(){return G.vehicles;},get traffic(){return G.traffic.cars.length;},get peds(){return G.peds.list.length;},get missions(){return G.missions;},get pois(){return G.W.pois;},
 startMission(id){const p=G.W.pois.find(q=>q.id===id);G.missions.cooldown=0;G.missions.cool=0;this.teleport(p.x,p.z);G.missions.start(p);return G.missions.active;},
 setWeather(r){rainPlan=r>0?[[G.hour-1,G.hour+5]]:[];U.uWet.value=r;},setQuality(q){applyQuality(q);},keys,G,W:()=>G.W,cam};
boot();
