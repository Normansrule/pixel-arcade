// WILD QUEST — open-world island adventure. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {ShaderPass} from '../vendor/jsm/postprocessing/ShaderPass.js';
import {POI,HALF,N,H,heightAt,gradAt,waterAt,inLake,roadDist,clearing,forestDensity,GRASS,FOREST,mulberry,ss} from './terrain.js';
import {World,U,lighting} from './world.js';
import {buildStructures} from './build.js';
import {buildShrines} from './shrines.js';
import {Phys} from './phys.js';
import {Particles} from './fx.js';
import {Enemy,Projectiles,Waves,KIND} from './actors.js';
import {makePlayer,resetPlayer,updatePlayer,updateCamera,makeCam,upgradeSword,useStam} from './player.js';
import {Sound} from './sound.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a;
const ID='wildquest';
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};

/* ================= renderer / scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.25));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x9fb8d0,.0042);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,2600);
const hemi=new THREE.HemisphereLight(0xbcd4ff,0x3a3020,2.2);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0dc,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:55,bottom:-55,near:1,far:400});sun.shadow.bias=-.0004;sun.shadow.normalBias=.06;scene.add(sun,sun.target);
const lamps=[0,1].map(()=>{const l=new THREE.PointLight(0xff9a4a,0,16,1.6);scene.add(l);return l;});
const phys=new Phys();
const world=new World(scene,phys);
const S=buildStructures(scene,phys);
const rooms=buildShrines(scene,phys);
const parts=new Particles(scene,6000,true),sparks=new Particles(scene,1500,true),smoke=new Particles(scene,2500,false);
const snd=new Sound();

/* ================= shared game context ================= */
const timers=[];
const G={after:(t,f)=>timers.push({t,f}),scene,camera,phys,world,S,rooms,snd,parts,sparks,smoke,enemies:[],time:0,timeScale:1,night:0,rain:0,dm:null,tokens:2,room:null,camps:S.camps,castle:S.castle,cam:makeCam()};
G.proj=new Projectiles(G);G.waves=new Waves(G);
const P=makePlayer(G);
rooms.forEach(r=>{r.sfx=k=>snd.play(k);});
const DIFF=[{n:'EASY',hp:.75,dmg:.5,aggr:.75,hearts:4,pen:30,tokens:1},{n:'NORMAL',hp:1,dmg:1,aggr:1,hearts:3,pen:60,tokens:2},{n:'HARD',hp:1.3,dmg:1.5,aggr:1.25,hearts:3,pen:0,tokens:3}];

/* ================= items ================= */
const ING={apple:{n:'Sunapple',heal:2,col:'#e2402a',k:'apple'},herb:{n:'Swiftsprig',heal:1,buff:'speed',col:'#6ad24a'},mushroom:{n:'Ironcap',heal:1,buff:'defense',col:'#9a7650'},pepper:{n:'Ember Pepper',heal:1,buff:'attack',col:'#ff6a1a'},
 honey:{n:'Wild Honey',heal:4,buff:'stamina',col:'#ffc23a'},truffle:{n:'Hearty Truffle',heal:4,buff:'hearty',col:'#e8d2b0'},meat:{n:'Raw Meat',heal:3,col:'#c8545a'}};
const ORDER=['apple','herb','mushroom','pepper','honey','truffle','meat'];
const BUFF={speed:'SWIFT',attack:'FIERCE',defense:'IRONCLAD',stamina:'VIGOR',hearty:'HEARTY'};
const DISH={apple:'Apple Bake',herb:'Herb Salad',mushroom:'Mushroom Stew',pepper:'Pepper Sauté',honey:'Honey Glaze',truffle:'Truffle Pot Pie',meat:'Meat Skewer'};
function cookResult(list){if(!list.length)return null;const cnt={};list.forEach(k=>cnt[k]=(cnt[k]||0)+1);let heal=0;list.forEach(k=>heal+=ING[k].heal*2);
 const bc={};list.forEach(k=>{const b=ING[k].buff;if(b)bc[b]=(bc[b]||0)+1;});const bk=Object.keys(bc);const buff=bk.length===1?bk[0]:null;const main=cnt.meat?'meat':cnt.truffle?'truffle':Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]||ING[b].heal-ING[a].heal)[0];
 const n=(buff?{speed:'Swift',attack:'Fierce',defense:'Ironclad',stamina:'Vigorous',hearty:'Hearty'}[buff]+' ':bk.length>1?'Muddled ':'')+DISH[main];
 return{name:n,heal:buff==='hearty'?99:heal,tmp:buff==='hearty'?4*bc.hearty:0,buff:buff==='hearty'?null:buff,dur:buff?60*bc[buff]:0,col:ING[main].col};}

/* pickups: instanced per type */
const pickups=[];const PK={};{const mk=(type,geo,mat,max)=>{const m=new THREE.InstancedMesh(geo,mat,max);m.count=max;m.castShadow=true;const z=new THREE.Matrix4().makeScale(0,0,0);for(let i=0;i<max;i++)m.setMatrixAt(i,z);scene.add(m);PK[type]={m,max,free:[...Array(max).keys()]};};
 const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:o.r??.6,emissive:o.e??0,emissiveIntensity:o.ei??1});
 mk('apple',new THREE.SphereGeometry(.16,10,8),std(0xd8321e,{r:.35,e:0x3a0800}),120);
 const mg=new THREE.CylinderGeometry(.04,.05,.18,6).translate(0,.09,0);const cap=new THREE.SphereGeometry(.16,10,6,0,Math.PI*2,0,Math.PI/2).scale(1,.6,1).translate(0,.17,0);mk('mushroom',mergeG([mg,cap]),std(0x8a6a48,{r:.8}),70);
 mk('herb',mergeG([0,1,2,3,4].map(i=>new THREE.ConeGeometry(.05,.42,4).translate(0,.21,0).rotateZ(.35).rotateY(i*1.25))),std(0x5cc23a,{r:.7,e:0x0a2a04}),70);
 mk('pepper',new THREE.ConeGeometry(.08,.3,8).rotateX(Math.PI).translate(0,.15,0),std(0xff4a10,{r:.3,e:0x401000}),40);
 mk('honey',mergeG([new THREE.SphereGeometry(.22,10,8).scale(1,1.2,1).translate(0,.26,0),new THREE.TorusGeometry(.2,.04,4,12).rotateX(Math.PI/2).translate(0,.3,0)]),std(0xe8a820,{r:.3,e:0x402800}),20);
 mk('truffle',new THREE.DodecahedronGeometry(.17,1).translate(0,.14,0),std(0xe8d2b0,{r:.8,e:0x302010}),16);
 mk('meat',new THREE.CylinderGeometry(.13,.15,.32,8).rotateZ(Math.PI/2).translate(0,.13,0),std(0xb8434a,{r:.5}),40);
 mk('arrows',mergeG([0,1,2,3,4].map(i=>new THREE.CylinderGeometry(.012,.012,.8,4).rotateX(Math.PI/2).translate((i-2)*.04,.06,0))),std(0xc8a070,{r:.8}),40);}
function mergeG(list){const pos=[],nor=[];for(const g of list){const n=g.index?g.toNonIndexed():g;pos.push(...n.attributes.position.array);nor.push(...n.attributes.normal.array);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return g;}
const tm=new THREE.Matrix4(),tq=new THREE.Quaternion(),te=new THREE.Euler();
function addPickup(type,x,y,z,n=1){const k=PK[type];if(!k||!k.free.length)return null;const i=k.free.pop();const ry=rnd(6.28);k.m.setMatrixAt(i,tm.compose(new V(x,y,z),tq.setFromEuler(te.set(0,ry,0)),new V(1,1,1)));k.m.instanceMatrix.needsUpdate=true;const p={type,x,y,z,i,n,taken:false};pickups.push(p);return p;}
function takePickup(p){p.taken=true;const k=PK[p.type];k.m.setMatrixAt(p.i,tm.makeScale(0,0,0));k.m.instanceMatrix.needsUpdate=true;k.free.push(p.i);}
function spawnPickups(){for(const p of pickups)if(!p.taken)takePickup(p);pickups.length=0;const r=mulberry(99),R2=()=>r();
 world.apples.slice(0,110).forEach(a=>{const h=heightAt(a.x,a.z);if(h>2&&!inLake(a.x,a.z))addPickup('apple',a.x,h+.12,a.z);});
 const place=(type,n,test,tries=4000)=>{let c=0;for(let t=0;t<tries&&c<n;t++){const x=(R2()*2-1)*HALF*.85,z=(R2()*2-1)*HALF*.85,h=heightAt(x,z);if(h<2.5||inLake(x,z)||clearing(x,z,1)||roadDist(x,z)<2)continue;const g=gradAt(x,z);if(Math.hypot(g.x,g.z)>.9)continue;if(!test(x,z,h))continue;addPickup(type,x,h,z);c++;}};
 place('mushroom',60,(x,z)=>forestDensity(x,z)>.55);place('herb',60,(x,z,h)=>forestDensity(x,z)<.3&&h<60);place('pepper',34,(x,z,h)=>x>40&&h<50);place('honey',16,(x,z)=>forestDensity(x,z)>.35);place('truffle',12,(x,z,h)=>forestDensity(x,z)>.75||h>45);
 for(const c of POI.camps)for(let k=0;k<2;k++){const a=rnd(6.28);addPickup('arrows',c.x+Math.cos(a)*5.5,heightAt(c.x+Math.cos(a)*5.5,c.z+Math.sin(a)*5.5),c.z+Math.sin(a)*5.5,5);}
 for(const k of['herb','apple','mushroom'])for(let i=0;i<2;i++){const a=rnd(6.28),d=4+rnd(4);const x=POI.start.x+Math.cos(a)*d,z=POI.start.z+Math.sin(a)*d;addPickup(k,x,heightAt(x,z)+(k==='apple'?.12:0),z);}}

/* glimmer seeds (20 hidden collectibles) */
const seeds=[];const seedMat=new THREE.MeshStandardMaterial({color:0x332200,emissive:0xffc040,emissiveIntensity:2.6,roughness:.3});const seedGeo=new THREE.SphereGeometry(.16,10,8).scale(1,1.5,1);const leafGeo=new THREE.ConeGeometry(.08,.25,4).translate(0,.3,0);const leafMat=new THREE.MeshStandardMaterial({color:0x2a8a2a,emissive:0x0a3a0a});
function seedSpots(){const L=[];const add=(x,y,z,why)=>L.push({x,y,z,why});const r=POI.ruins,hs=[9,3,9,6,2,9,5,9,4,7,9,3];
 [0,5,10].forEach(i=>{const a=i/12*Math.PI*2;add(r.x+Math.cos(a)*22,r.h+hs[i]+1.3,r.z+Math.sin(a)*22,'pillar');});
 let best=0,bk=0;for(let k=0;k<N*N;k++)if(H[k]>best){best=H[k];bk=k;}const mx=-HALF+(bk%N)*(HALF*2/(N-1)),mz=-HALF+Math.floor(bk/N)*(HALF*2/(N-1));add(mx,heightAt(mx,mz)+1.2,mz,'summit');
 add(-128,heightAt(-128,70)+3.6*2.6+1,70,'great tree');
 world.rocks.slice().sort((a,b)=>b[3]-a[3]).slice(0,4).forEach(k=>add(k[0],k[1]+k[3]*1.05+.9,k[2],'rock'));
 S.towers.slice(0,2).forEach(t=>add(t.x+.8,t.y+.7,t.z+.8,'tower'));
 add(POI.start.x,POI.start.h+3.6,POI.start.z-3,'tablet');add(132,POI.lake.level+.6,50,'lake');
 const c=S.castle;add(c.x-7,c.h+19.6,c.z+30.5,'gatehouse');S.spires.slice(0,6).forEach(s=>add(s.x,s.y+1,s.z,'spire'));
 const rr=mulberry(5);let guard=0;while(L.length<20&&guard++<6000){const x=(rr()*2-1)*HALF*.8,z=(rr()*2-1)*HALF*.8,h=heightAt(x,z);if(h<14||h>85)continue;const g=gradAt(x,z),s=Math.hypot(g.x,g.z);if(s<1.25)continue;if(L.some(q=>Math.hypot(q.x-x,q.z-z)<45)||clearing(x,z,10))continue;add(x-g.x/s*.6,h+1,z-g.z/s*.6,'cliff');}
 return L;}
function spawnSeeds(){for(const s of seeds)scene.remove(s.m);seeds.length=0;for(const p of seedSpots()){const g=new THREE.Group();g.add(new THREE.Mesh(seedGeo,seedMat));const l=new THREE.Mesh(leafGeo,leafMat);g.add(l);g.position.set(p.x,p.y,p.z);scene.add(g);seeds.push({...p,m:g,taken:false});}}

/* fires (campfires cook; braziers light the keep) */
const fires=S.fires;

/* ================= run state ================= */
let app='menu',opt={diff:1,len:20};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_wq_opt'))||{});}catch(e){}
let run=null,lastAward=null,menuT=0;
function newRun(){return{clock:opt.len*60,len:opt.len*60,tod:.36,dayLen:opt.len*24,day:1,shrines:0,golemDead:false,bossDead:false,victory:false,end:false,gems:0,chests:0,regions:new Set(),cur:null,rainT:70,rainOn:false,thunderT:8,
 respawn:{x:POI.start.x,y:POI.start.h,z:POI.start.z+2,yaw:Math.PI},hintI:0,hintT:3,endT:0,overReason:'',score:0,killScore:0,discover:0,deaths:0,enemies0:0};}
function spawnEnemies(){for(const e of G.enemies)scene.remove(e.rig.root);G.enemies=[];
 POI.camps.forEach((c,ci)=>{const cam=S.camps[ci];for(let i=0;i<c.grunts;i++){const a=i/c.grunts*6.28+ci,x=c.x+Math.cos(a)*3.5,z=c.z+Math.sin(a)*3.5;G.enemies.push(new Enemy(G,'grunt',x,z,{camp:ci,yaw:a+Math.PI}));}
  for(let i=0;i<c.archers;i++){const tw=cam.towers[i];if(tw)G.enemies.push(new Enemy(G,'archer',tw.x,tw.z,{camp:ci,tower:tw,y:tw.y}));else G.enemies.push(new Enemy(G,'archer',c.x+4,c.z-4,{camp:ci}));}});
 [[60,-6,10,['grunt','grunt']],[-112,92,11,['grunt','archer']],[-30,-80,12,['grunt','grunt']]].forEach(([x,z,ci,ks])=>{ks.forEach((k,i)=>G.enemies.push(new Enemy(G,k,x+i*2.5,z+i,{camp:ci})));});
 const r=POI.ruins;G.golem=new Enemy(G,'golem',r.x,r.z,{y:S.ruins.h,yaw:Math.PI*.5});G.enemies.push(G.golem);
 const a=S.castle.arena;G.boss=new Enemy(G,'boss',a.x,a.z-4,{y:S.castle.h+.05,yaw:0});G.enemies.push(G.boss);G.camps=S.camps.map((c,i)=>c);
 G.camps[10]=G.camps[11]=G.camps[12]=null;run.enemies0=G.enemies.filter(e=>e.kind==='grunt'||e.kind==='archer').length;}

function resetWorldState(){S.shrines.forEach(s=>{s.done=false;s.col.setRGB(1.6,.55,.12);s.beamMat.uniforms.uA.value=1;});S.seals.forEach(s=>s.material.emissive.setHex(0xff4a10));
 const c=S.castle;c.opened=false;c.open=0;c.barrier.on=true;c.dome.visible=true;c.domeMat.uniforms.uA.value=1;c.vortexMat.uniforms.uA.value=1;phys.move(c.gate,0,c.h-c.gate.y0,0);c.gateMesh.position.y=c.h+4.5;
 S.chests.forEach(ch=>{ch.open=false;ch.openT=0;ch.lid.rotation.x=0;});
 rooms.forEach(r=>{r.solved=false;r.t=0;r.g.visible=false;if(r.quiver)r.quiver.visible=true;if(r.orb){r.orb.taken=false;r.orb.o.visible=true;}if(r.crystals)r.crystals.forEach(k=>k.on=0);r.bridgeUp=false;if(r.fan)r.fan.on=false;
  if(r.ball){r.ball.locked=false;r.ball.p.copy(r.ball.home);r.ball.v.set(0,0,0);r.socket.m.material.emissive.setHex(0xff6a1a);const ob=r.orb;if(ob.y>-3){phys.move(ob.c,0,-3-ob.y,0);ob.y=-3;ob.g.position.y=-3;}}
  if(r.cube){const c2=r.cube;phys.move(c2.b,r.ox-5-c2.x,0,9-c2.z);c2.x=r.ox-5;c2.z=9;c2.m.position.set(c2.x,.9,c2.z);}});
 G.proj.clear();G.waves.clear();parts.clear();sparks.clear();smoke.clear();}

function start(o={}){Object.assign(opt,o);try{localStorage.setItem('pxd_wq_opt',JSON.stringify(opt));}catch(e){}snd.init();
 timers.length=0;const D=DIFF[opt.diff];G.dm=D;G.tokens=D.tokens;run=newRun();resetWorldState();spawnEnemies();spawnPickups();spawnSeeds();
 P.maxHp=D.hearts*4;P.hp=P.maxHp;P.tmp=0;P.stMax=100;P.st=100;P.ex=false;P.arrows=20;P.inv={apple:1};P.dishes=[];P.buffs={};P.seeds=0;P.kills=0;P.cooked=0;P.falls=0;P.sword='traveler';P.swordMul=1;
 if(P.rig.sword.userData.kind==='rune')upgradeSword(G,'traveler');
 G.room=null;G.bossTarget=null;$('boss').hidden=true;G.time=0;G.timeScale=1;
 resetPlayer(G,run.respawn.x,run.respawn.y,run.respawn.z,run.respawn.yaw);G.cam.yaw=Math.PI;G.cam.pitch=.2;
 app='play';hideAll();$('hud').hidden=false;document.body.classList.add('playing');lockPointer();
 banner('WILD QUEST',`Clear the four shrines · the Crimson Moon rises in ${opt.len}:00`,'#ff6a1a',3.2);run.cur='Dawnrise Meadow';run.regions.add('Dawnrise Meadow');}
function hideAll(){for(const id of['menu','keys','over','pause','cook','inv','map','bless','dead'])$(id).hidden=true;}
function toMenu(){app='menu';hideAll();$('menu').hidden=false;$('keys').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing');unlockPointer();G.room=null;rooms.forEach(r=>r.g.visible=false);
 $('best').textContent=best()?`BEST ${best()} PTS`:'';}

/* ================= feedback helpers ================= */
let banT=0,locT=0;
function banner(t,s,col,dur=2.4){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('bs').style.display=s?'':'none';$('banner').classList.add('on');banT=dur;}
G.banner=banner;
function toast(t,cls='g'){const d=document.createElement('div');d.textContent=t;if(cls)d.className=cls;$('toasts').prepend(d);setTimeout(()=>d.remove(),3400);while($('toasts').children.length>5)$('toasts').lastChild.remove();}
G.toast=toast;
function region(name){const el=$('loc');el.querySelector('b').textContent=name.toUpperCase();el.classList.add('on');locT=3.2;}
G.shake=(a,p)=>{const d=p?P.p.distanceTo(p):0;G.cam.shake=Math.max(G.cam.shake,a*(1-Math.min(1,d/40)));};
G.dust=(x,y,z,n,small)=>smoke.burst(new V(x,y+.15,z),n,small?1.2:3,new THREE.Color(.55,.5,.42),small?.5:1.1,small?.6:1,{up:true,flat:true,grav:-.4,drag:2.5,r:.3});
G.splash=(x,y,z,n)=>{smoke.burst(new V(x,y+.05,z),n,2.6,new THREE.Color(.8,.9,.95),.16,.5,{up:true,grav:9,drag:.8});};
G.hitstop=t=>{G.stopT=Math.max(G.stopT||0,t);};
G.setFlurry=on=>{$('flurry').classList.toggle('on',on);};
G.updraft=p=>{if(G.room)return G.room.updraft?G.room.updraft(p):false;for(const f of fires){if(f.lit&&!f.brazier&&Math.hypot(p.x-f.x,p.z-f.z)<1.8&&p.y<f.y+18)return true;}return false;};
G.wave=(x,y,z,o)=>G.waves.spawn(x,y,z,o);
G.onArena=()=>{const c=S.castle;run.respawn={x:c.x,y:heightAt(c.x,c.z+40),z:c.z+40,yaw:Math.PI};};
G.bossIntro=e=>{G.bossTarget=e;if(e.kind==='golem'&&run)run.respawn={x:POI.ruins.x,y:heightAt(POI.ruins.x,POI.ruins.z+44),z:POI.ruins.z+44,yaw:Math.PI};$('boss').hidden=false;$('bname').textContent=e.K.name;banner(e.K.name,e.kind==='boss'?'Guardian of Thornhold Keep':'Ancient guardian of the ruins','#ff4a2a',2.6);};
G.voidFall=()=>{hurt(2,null,'fall');if(P.dead)return;P.p.copy(G.room.spawn);P.v.set(0,0,0);P.mode='ground';G.cam.snap=true;fade();};
G.drowned=()=>{toast('Swept under… you crawl back ashore.','');hurt(4,null,'drown');if(P.dead)return;P.p.copy(P.lastSafe);P.v.set(0,0,0);P.mode='ground';P.st=P.stMax;P.ex=false;G.cam.snap=true;fade();};
function fade(white){const f=$('fade');f.classList.toggle('white',!!white);f.classList.add('on');setTimeout(()=>f.classList.remove('on'),260);}

/* ================= damage ================= */
function hurt(q,from,kind,o={}){if(P.dead||!run||run.end)return'none';
 if(P.iframe>0&&kind!=='fall'&&kind!=='drown'){if(kind==='melee'&&P.roll&&G.time-P.lastDodge<.36&&from&&!from.dead&&!P.flurry){startFlurry(from);return'dodge';}return'none';}
 const src=from?from.p:o.from;let frontal=false;if(src){const dx=src.x-P.p.x,dz=src.z-P.p.z,d=Math.hypot(dx,dz)||1;frontal=(dx*Math.sin(P.yaw)+dz*Math.cos(P.yaw))/d>.25;}
 if(P.block&&frontal&&['melee','arrow','orb','rock'].includes(kind)){const fp=new V(P.p.x+Math.sin(P.yaw)*.6,P.p.y+1.2,P.p.z+Math.cos(P.yaw)*.6);
  if(P.blockT<.28){snd.play('parry');sparks.burst(fp,50,9,[new THREE.Color(2.6,2.4,1.6),new THREE.Color(.6,1.8,2.6)],.25,.5,{grav:6});G.hitstop(.12);
   if(from&&kind==='melee'&&!from.dead){if(from.kind==='grunt'||from.kind==='archer'){from.state='down';from.t=0;from.releaseToken();}else{from.state='recover';from.t=-.9;}}toast('Perfect guard!','t');return'parry';}
  snd.play('block');sparks.burst(fp,18,6,new THREE.Color(2.4,2,1.4),.2,.35,{grav:8});const big=from&&(from.kind==='golem'||from.kind==='boss');P.stun=big?.35:.15;const k=o.knock?o.knock*.4:3;if(src){const dx=P.p.x-src.x,dz=P.p.z-src.z,d=Math.hypot(dx,dz)||1;P.v.x+=dx/d*k;P.v.z+=dz/d*k;}
  if(!big||kind==='arrow')return'block';q=Math.ceil(q*.25);}
 if(P.buffs.defense&&kind!=='fall'&&kind!=='drown')q=Math.ceil(q*.5);
 const a=Math.min(P.tmp,q);P.tmp-=a;q-=a;P.hp-=q;P.hurtT=.35;snd.play('hurt');G.cam.shake=Math.max(G.cam.shake,.45);$('vign').style.opacity=.9;G.hitstop(.05);
 if(src&&o.knock){const dx=P.p.x-src.x,dz=P.p.z-src.z,d=Math.hypot(dx,dz)||1;P.v.x+=dx/d*o.knock;P.v.z+=dz/d*o.knock;P.v.y=4;if(P.mode==='ground')P.mode='air';P.airT=.3;P.fallV=0;}
 if(P.mode==='climb'||P.mode==='glide'){P.mode='air';P.climb=null;P.rig.glider.visible=false;P.fallV=0;}P.atk=null;P.charge=0;
 if(P.hp<=0){P.hp=0;die(kind);}return'hit';}
G.hurtPlayer=hurt;
function startFlurry(e){P.flurry={t:3,target:e,hits:0};G.setFlurry(true);snd.play('flurry');toast('FLURRY RUSH!','t');P.roll=null;P.iframe=3;P.lock=P.lock||e;}
function die(kind){P.dead=true;P.deadT=0;P.atk=null;P.aim=false;P.lock=null;P.flurry=null;G.setFlurry(false);snd.play('death');run.deaths++;P.falls++;
 G.after(.9,()=>{if(app==='play'&&P.dead){$('dead').hidden=false;$('deads').textContent=G.dm.pen?`The Crimson Moon draws ${G.dm.pen}s nearer…`:'On HARD there is no second chance.';}});
 G.after(3.2,()=>{if(!run||run.end||!P.dead)return;$('dead').hidden=true;if(!G.dm.pen){endRun('fallen');return;}run.clock-=G.dm.pen;if(run.clock<=0){endRun('moon');return;}
  if(G.room){exitRoom(false);}const r=run.respawn;resetPlayer(G,r.x,r.y,r.z,r.yaw);G.cam.yaw=r.yaw;P.hp=P.maxHp;P.st=P.stMax;P.ex=false;fade();toast('You wake, shaken but alive.','');});}
function dmgNum(p,v,crit){const s=p.clone().project(camera);if(s.z>1)return;const d=document.createElement('div');d.className='mk dmg'+(crit?' crit':'');d.textContent=v;d.style.left=(s.x*.5+.5)*innerWidth+'px';d.style.top=(-s.y*.5+.5)*innerHeight+'px';$('marks').appendChild(d);setTimeout(()=>d.remove(),900);}
G.damageEnemy=(e,dmg,o={})=>{if(e.dead)return;const K=e.K;const at=o.at||new V(e.p.x,e.p.y+K.bodyY+.3,e.p.z);let crit=!!o.head||!!o.sneak;
 if(e.kind==='golem'&&o.head&&o.kind==='arrow'&&e.state!=='stunned'&&e.state!=='dormant'){e.state='stunned';e.t=0;toast('Struck its eye! The Colossus staggers.','t');snd.play('crit');}
 if(e.kind==='boss'&&o.kind==='orb'){e.state='stunned';e.t=0;dmg=60;crit=true;toast('Its own fire! The Warden reels.','t');}
 if(e.kind==='golem'&&e.state==='dormant'){e.state='waking';e.t=0;G.bossIntro(e);}
 e.hp-=dmg;e.hurtT=.3;e.flash=1;dmgNum(at,o.sneak?'SNEAK '+dmg:dmg,crit);snd.play(crit?'crit':'hit');sparks.burst(at,crit?40:18,crit?9:6,[new THREE.Color(2.8,2.2,1.2),new THREE.Color(2.6,1,.3)],.22,.4,{grav:10,dir:o.dir,spread:1.2});
 if(o.flurry)parts.burst(at,30,6,new THREE.Color(.5,1.6,2.6),.3,.4,{});
 if(e.kind==='grunt'||e.kind==='archer'){e.becomeAware();e.releaseToken();e.state=(o.knock||o.sneak||e.hits>=2)?'down':'stagger';e.t=0;e.hits=e.state==='down'?0:e.hits+1;if(o.dir){const k=e.state==='down'?7:3.5;e.v.x+=o.dir.x*k;e.v.z+=o.dir.z*k;}}
 else{e.poise=(e.poise||0)+dmg;if(e.poise>(e.kind==='golem'?85:170)&&(e.state==='chase'||e.state==='recover'||e.state==='windup')){e.poise=0;e.state='recover';e.t=-.55;e.hurtT=.5;if(!e.atk)e.atk='slam';toast(e.kind==='golem'?'The Colossus staggers!':'The Warden staggers!','t');}}
 if(e.hp<=0)killEnemy(e);};
function killEnemy(e){e.dead=true;e.deadT=0;e.releaseToken();P.kills++;run.killScore+=e.K.score;snd.play('kill');if(P.lock===e)P.lock=null;
 if(e.kind==='grunt'){if(Math.random()<.65)addPickup('meat',e.p.x,e.p.y,e.p.z);if(Math.random()<.35)addPickup('arrows',e.p.x+.6,e.p.y,e.p.z,4);}
 if(e.kind==='archer')addPickup('arrows',e.p.x,e.p.y,e.p.z,5);
 if(e.kind==='golem'){run.golemDead=true;$('boss').hidden=true;G.bossTarget=null;G.after(1.6,()=>{if(!run||run.end)return;upgradeSword(G);P.maxHp+=4;P.hp=P.maxHp;banner('RUNE BLADE','The Colossus yields its blade · +1 heart container','#3fe6e6',3.2);snd.play('blessing');});}
 if(e.kind==='boss'){run.bossDead=true;run.victory=true;$('boss').hidden=true;G.bossTarget=null;G.victoryT=0;banner('THE KEEP IS FREED','The Ashen Warden falls','#ffcf5a',4);snd.play('victory');G.shake(1,e.p);fade(true);}
 // camp cleared?
 if(e.camp!==undefined&&e.camp<10){const left=G.enemies.filter(x=>x.camp===e.camp&&!x.dead).length;if(!left){toast('Camp cleared!','g');run.gems+=150;}}}

/* ================= shrines ================= */
function enterRoom(s){const r=rooms[s.i];fade();snd.play('warp');G.after(.23,()=>{G.room=r;r.g.visible=true;r.t=0;resetPlayer(G,r.spawn.x,r.spawn.y,r.spawn.z,Math.PI);G.cam.yaw=Math.PI;G.cam.pitch=.18;run.respawn={x:s.enter.x,y:heightAt(s.enter.x,s.enter.z)+.6,z:s.enter.z,yaw:s.rot+Math.PI};G.curShrine=s;
  banner(r.title,s.name,'#3fe6e6',2.6);G.after(2.2,()=>toast(r.hint,'t'));if(r.i===1&&P.arrows<10){P.arrows=10;toast('A quiver waits by the door (+arrows)','');}});}
function exitRoom(done=true){const r=G.room;const s=G.curShrine||S.shrines[r.i];r.g.visible=false;G.room=null;const x=s.enter.x+s.fx*1.5,z=s.enter.z+s.fz*1.5;resetPlayer(G,x,Math.max(heightAt(x,z),s.y),z,Math.atan2(s.fx,s.fz));G.cam.yaw=P.yaw;fade(true);
 if(done&&!s.done){s.done=true;run.shrines++;s.col.setRGB(.3,1.6,1.8);S.seals[run.shrines-1].material.emissive.setHex(0x40f0ff);toast(`Shrine cleared · ${run.shrines}/4`,'t');
  if(run.shrines>=4)G.after(1.8,openCastle);}}
function openCastle(){if(!run||run.end)return;const c=S.castle;c.opened=true;c.barrier.on=false;banner('THE SEAL IS BROKEN','Thornhold Keep lies open · face its Warden','#ff6a1a',3.6);snd.play('door');snd.play('moon');G.shake(.4);}
function takeOrb(){const r=G.room;r.orb.taken=true;r.orb.o.visible=false;r.solved=true;snd.play('shrine');parts.burst(new V(r.orb.x,r.orb.y+1.5,r.orb.z),120,6,[new THREE.Color(.4,2.2,2.6),new THREE.Color(2,2,2)],.4,1.4,{up:true,drag:1});
 G.after(.9,()=>{if(!run||run.end)return;app='panel';$('bless').hidden=false;$('blt').innerHTML=r.title+'<em>.</em>';unlockPointer();});}
function bless(kind){if($('bless').hidden)return;$('bless').hidden=true;if(kind==='heart'){P.maxHp+=4;P.hp=P.maxHp;toast('+1 Heart container','g');}else{P.stMax+=40;P.st=P.stMax;toast('Stamina vessel · the wheel grows','g');}snd.play('blessing');app='play';lockPointer();exitRoom(true);}

/* ================= interaction / food ================= */
let near=null;
function findInteract(){let best=null,bd=2.4;const consider=(o,d,label,act)=>{if(d<bd){bd=d;best={o,label,act};}};
 if(G.room){const r=G.room;if(r.orb&&!r.orb.taken&&r.orb.y>-.5)consider(r.orb,Math.hypot(P.p.x-r.orb.x,P.p.z-r.orb.z)-.5,'CLAIM THE LUMEN ORB',takeOrb);
  if(r.quiver&&r.quiver.visible)consider(r.quiver,Math.hypot(P.p.x-r.arrows.x,P.p.z-r.arrows.z),'TAKE ARROWS',()=>{P.arrows=Math.max(P.arrows,15);r.quiver.visible=false;snd.play('pickup');toast('Arrows restocked','');});return best;}
 for(const p of pickups){if(p.taken)continue;const d=Math.hypot(P.p.x-p.x,P.p.z-p.z);if(d<bd&&Math.abs(P.p.y-p.y)<1.6)consider(p,d,p.type==='arrows'?`PICK UP ${p.n} ARROWS`:'PICK UP '+ING[p.type].n.toUpperCase(),()=>pick(p));}
 for(const c of S.chests){if(c.open)continue;consider(c,Math.hypot(P.p.x-c.x,P.p.z-c.z)-.4,'OPEN CHEST',()=>openChest(c));}
 for(const f of fires){if(f.brazier)continue;consider(f,Math.hypot(P.p.x-f.x,P.p.z-f.z)-.8,'COOK AT THE FIRE',openCook);}
 for(const s of S.shrines){const d=Math.hypot(P.p.x-s.enter.x,P.p.z-s.enter.z);if(Math.abs(P.p.y-s.y)<3)consider(s,d-.8,s.done?`${s.name.toUpperCase()} · CLEARED`:'ENTER '+s.name.toUpperCase(),()=>{if(!s.done)enterRoom(s);else toast('This trial is complete. Warp here from the map.','');});}
 return best;}
function pick(p){takePickup(p);if(p.type==='arrows'){P.arrows+=p.n;toast(`+${p.n} arrows`,'');}else{P.inv[p.type]=(P.inv[p.type]||0)+1;toast('+1 '+ING[p.type].n,'g');}snd.play('pickup');}
function openChest(c){c.open=true;snd.play('chest');const loot=[{arrows:10,gem:300,t:'+10 arrows · silver gem (+300)'},{truffle:1,gem:300,t:'Hearty Truffle · silver gem (+300)'},{arrows:15,gem:300,t:'+15 arrows · silver gem (+300)'},{honey:2,gem:500,t:'Wild Honey ×2 · gold gem (+500)'}][c.i%4];
 if(loot.arrows)P.arrows+=loot.arrows;if(loot.truffle)P.inv.truffle=(P.inv.truffle||0)+loot.truffle;if(loot.honey)P.inv.honey=(P.inv.honey||0)+loot.honey;run.gems+=loot.gem;run.chests++;toast('Chest: '+loot.t,'g');
 parts.burst(new V(c.x,c.y+.8,c.z),60,4,[new THREE.Color(2.6,2,.8),new THREE.Color(2,2,2)],.3,1,{up:true,drag:1.5});}
function eat(item){// item: {dish} or ingredient key
 let heal,tmp=0,buff=null,dur=0,name;if(typeof item==='string'){if(!P.inv[item])return;P.inv[item]--;const I=ING[item];heal=I.heal;name=I.n;if(I.buff==='stamina'){P.st=Math.min(P.stMax,P.st+30);P.ex=false;}}
 else{const i=P.dishes.indexOf(item);if(i<0)return;P.dishes.splice(i,1);heal=item.heal;tmp=item.tmp;buff=item.buff;dur=item.dur;name=item.name;}
 P.hp=Math.min(P.maxHp,P.hp+heal);P.tmp=Math.max(P.tmp,tmp);if(buff){if(buff==='stamina'){P.st=P.stMax;P.ex=false;}P.buffs[buff]=Math.max(P.buffs[buff]||0,dur);}snd.play('eat');toast('Ate '+name,'g');}
function quickEat(){if(P.hp>=P.maxHp&&!P.dishes.length){toast('Your hearts are full.','');return;}
 const miss=P.maxHp-P.hp;const opts=[...P.dishes.map(d=>({it:d,h:d.heal})),...ORDER.filter(k=>P.inv[k]).map(k=>({it:k,h:ING[k].heal}))];if(!opts.length){toast('Nothing to eat. Forage or cook!','');return;}
 opts.sort((a,b)=>{const fa=a.h>=miss,fb=b.h>=miss;if(fa!==fb)return fa?-1:1;return fa?a.h-b.h:b.h-a.h;});eat(opts[0].it);}
/* cooking panel */
let pot=[];
function openCook(){app='panel';pot=[];$('cook').hidden=false;unlockPointer();drawCook();}
function closePanels(){for(const id of['cook','inv','map'])$(id).hidden=true;if(app==='panel'){app='play';lockPointer();}}
function drawCook(){const avail=k=>(P.inv[k]||0)-pot.filter(x=>x===k).length;
 $('ings').innerHTML=ORDER.map((k,i)=>`<button class="it${avail(k)>0&&pot.length<3?'':' dis'}" data-k="${k}"><span class="dot" style="background:${ING[k].col}"></span><span><b>${ING[k].n}</b><small>${ING[k].buff?BUFF[ING[k].buff]:'heal'} · ${i+1}</small></span><span class="n">${avail(k)}</span></button>`).join('');
 $('ings').querySelectorAll('button').forEach(b=>b.onclick=()=>{addPot(b.dataset.k);});
 $('pot').innerHTML=[0,1,2].map(i=>`<span>${pot[i]?`<i class="dot" style="background:${ING[pot[i]].col}"></i>`:''}</span>`).join('');
 const r=cookResult(pot);$('cprev').textContent=r?`${r.name} · heals ${r.heal>=99?'fully':(r.heal/4).toFixed(2).replace(/\.?0+$/,'')+' ♥'}${r.tmp?` · +${r.tmp/4} bonus ♥`:''}${r.buff?` · ${BUFF[r.buff]} ${r.dur}s`:''}`:'Add ingredients to the pot.';$('cookgo').disabled=!r;}
function addPot(k){if(pot.length<3&&(P.inv[k]||0)>pot.filter(x=>x===k).length){pot.push(k);snd.play('pop');drawCook();}}
function cook(){const r=cookResult(pot);if(!r)return;pot.forEach(k=>P.inv[k]--);pot=[];P.dishes.push(r);P.cooked++;run.gems+=50;snd.play('cook');toast('Cooked: '+r.name,'g');const f=near&&near.o;if(f)parts.burst(new V(f.x,f.y+.8,f.z),60,4,[new THREE.Color(2.6,1.8,.6)],.35,1,{up:true,drag:1});drawCook();}
function openInv(){app='panel';$('inv').hidden=false;unlockPointer();drawInv();}
function drawInv(){const items=[...P.dishes.map(d=>({d,n:d.name,col:d.col,s:`heals ${d.heal>=99?'fully':d.heal/4+' ♥'}${d.buff?' · '+BUFF[d.buff]+' '+d.dur+'s':''}${d.tmp?' · +'+d.tmp/4+' bonus ♥':''}`,c:1})),...ORDER.filter(k=>P.inv[k]).map(k=>({k,n:ING[k].n,col:ING[k].col,s:`raw · heals ${ING[k].heal/4} ♥`,c:P.inv[k]}))];
 $('invg').innerHTML=items.length?items.map((it,i)=>`<button class="it" data-i="${i}"><span class="dot" style="background:${it.col}"></span><span><b>${it.n}</b><small>${it.s}${i<9?' · '+(i+1):''}</small></span><span class="n">${it.c}</span></button>`).join(''):'<p class="sub">Your bag is empty. Forage apples, herbs and mushrooms, then cook at a fire.</p>';
 $('invg').querySelectorAll('button').forEach(b=>b.onclick=()=>{const it=items[+b.dataset.i];eat(it.d||it.k);drawInv();});G.invItems=items;
 $('invs').innerHTML=`<b>${(P.hp/4).toFixed(2).replace(/\.?0+$/,'')}</b>/${P.maxHp/4} hearts · stamina <b>${P.stMax}</b> · arrows <b>${P.arrows}</b> · ${P.sword==='rune'?'<b>Rune Blade</b>':'Traveler\'s Blade'} · glimmer seeds <b>${P.seeds}</b>/20 · foes felled <b>${P.kills}</b>`;}
/* map */
const mapCanvas=document.createElement('canvas');mapCanvas.width=mapCanvas.height=640;{const x=mapCanvas.getContext('2d'),id=x.createImageData(640,640);for(let j=0;j<640;j++)for(let i=0;i<640;i++){const wx=i-320,wz=j-320,h=heightAt(wx,wz),k=(j*640+i)*4;let r,g,b;
  const lake=inLake(wx,wz)&&h<POI.lake.level;if(h<0||lake){const d=lake?POI.lake.level-h:-h;r=20;g=70+Math.max(0,40-d*4);b=110+Math.max(0,50-d*5);}else{const gx=heightAt(wx+1,wz)-heightAt(wx-1,wz),gz=heightAt(wx,wz+1)-heightAt(wx,wz-1);const sh=cl(1-(gx+gz)*.35,.55,1.35);const f=forestDensity(wx,wz);
   if(h<2.5){r=200;g=184;b=130;}else if(h>72){r=230;g=235;b=240;}else if(Math.hypot(gx,gz)/2>1.05){r=120;g=114;b=104;}else{r=96-f*40+h*.4;g=130-f*30+h*.2;b=60-f*10+h*.3;}
   if(roadDist(wx,wz)<2.2&&h>1){r=176;g=148;b=96;}r*=sh;g*=sh;b*=sh;}id.data[k]=r;id.data[k+1]=g;id.data[k+2]=b;id.data[k+3]=255;}x.putImageData(id,0,0);}
function drawMapMarks(ctx,toPx,scale=1){const dia=(x,y,c,s=6)=>{ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle=c;ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.fillRect(-s/2,-s/2,s,s);ctx.strokeRect(-s/2,-s/2,s,s);ctx.restore();};
 for(const s of S.shrines){const[x,y]=toPx(s.x,s.z);dia(x,y,s.done?'#3fe6e6':'#ff7a2a',8*scale);}
 POI.camps.forEach((c,i)=>{if(G.enemies.some(e=>e.camp===i&&!e.dead)){const[x,y]=toPx(c.x,c.z);ctx.fillStyle='#d33';ctx.beginPath();ctx.arc(x,y,4*scale,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();}});
 {const[x,y]=toPx(S.castle.x,S.castle.z);dia(x,y,S.castle.opened?'#b04aff':'#5a2a7a',11*scale);}
 if(G.golem&&!G.golem.dead){const[x,y]=toPx(POI.ruins.x,POI.ruins.z);ctx.strokeStyle='#3fe6e6';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6*scale,0,7);ctx.stroke();}}
function openMap(){app='panel';$('map').hidden=false;unlockPointer();drawMap();}
function drawMap(){const c=$('mapc'),x=c.getContext('2d');x.drawImage(mapCanvas,0,0);x.fillStyle='rgba(0,0,0,.12)';x.fillRect(0,0,640,640);drawMapMarks(x,(wx,wz)=>[wx+320,wz+320],1.4);
 x.save();x.translate(P.p.x+320,P.p.z+320);x.rotate(-P.yaw+Math.PI);x.fillStyle='#fff';x.strokeStyle='#000';x.lineWidth=2;x.beginPath();x.moveTo(0,-9);x.lineTo(6,7);x.lineTo(0,4);x.lineTo(-6,7);x.closePath();x.stroke();x.fill();x.restore();
 x.font='700 11px JetBrains Mono, monospace';x.fillStyle='#fff';x.strokeStyle='rgba(0,0,0,.7)';x.lineWidth=3;for(const r of POI.regions){if(!run||!run.regions.has(r.name))continue;x.strokeText(r.name.toUpperCase(),r.x+320-40,r.z+320-14);x.fillText(r.name.toUpperCase(),r.x+320-40,r.z+320-14);}}
$('mapc').onclick=e=>{const b=$('mapc').getBoundingClientRect();const wx=(e.clientX-b.left)/b.width*640-320,wz=(e.clientY-b.top)/b.height*640-320;for(const s of S.shrines){if(s.done&&Math.hypot(s.x-wx,s.z-wz)<14&&!G.room){closePanels();warpTo(s);return;}}};
function warpTo(s){snd.play('warp');fade(true);const x=s.enter.x+s.fx*1.5,z=s.enter.z+s.fz*1.5;resetPlayer(G,x,Math.max(heightAt(x,z),s.y),z,Math.atan2(s.fx,s.fz));G.cam.yaw=P.yaw;toast('Warped to '+s.name,'t');}

/* ================= input ================= */
const keys={},edge={},mouse={b:[false,false,false],e:[false,false,false]};let mdx=0,mdy=0,locked=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(app==='panel'){if(!$('bless').hidden)return;closePanels();}else if(app==='play')pause(true);else if(app==='paused')pause(false);}
 if(app==='panel'){if(!$('cook').hidden){const n=+e.key;if(n>=1&&n<=7)addPot(ORDER[n-1]);if(e.code==='Backspace'){pot.pop();drawCook();}if(e.code==='Enter')cook();if(e.code==='KeyE'&&edge.KeyE&&false)closePanels();}
  if(!$('inv').hidden){const n=+e.key;if(n>=1&&n<=9&&G.invItems&&G.invItems[n-1]){const it=G.invItems[n-1];eat(it.d||it.k);drawInv();}if(e.code==='Tab')closePanels();}
  if(!$('map').hidden&&e.code==='KeyM')closePanels();if(!$('bless').hidden){if(e.key==='1')bless('heart');if(e.key==='2')bless('stamina');}}});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.b=[false,false,false];});
canvas.addEventListener('mousedown',e=>{if(app==='play'&&!locked)lockPointer();mouse.b[e.button]=true;mouse.e[e.button]=true;});addEventListener('mouseup',e=>{mouse.b[e.button]=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(locked){mdx+=e.movementX;mdy+=e.movementY;}});
addEventListener('wheel',e=>{if(app==='play')G.cam.zoom=cl(G.cam.zoom+Math.sign(e.deltaY)*.1,.6,1.6);},{passive:true});
function lockPointer(){if(G.noPauseOnUnlock)return;try{const p=canvas.requestPointerLock&&canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(e){}}
function unlockPointer(){try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&app==='play'&&!G.noPauseOnUnlock)pause(true);});
function pause(on){if(on&&app==='play'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlockPointer();}else if(!on&&app==='paused'){app='play';$('pause').hidden=true;document.body.classList.add('playing');lockPointer();}}
const padPrev={};
function readInput(dt){const k=c=>!!keys[c],e=c=>!!edge[c];const inp={mx:(k('KeyD')?1:0)-(k('KeyA')?1:0),my:(k('KeyW')?1:0)-(k('KeyS')?1:0),sprint:k('ShiftLeft')||k('ShiftRight'),walk:false,jumpEdge:e('Space'),
  atkEdge:mouse.e[0]||e('KeyJ'),atkHeld:mouse.b[0]||k('KeyJ'),aim:mouse.b[2]||k('KeyK'),block:k('KeyF'),roll:e('KeyC')||e('KeyR'),letGo:e('KeyC')||e('KeyR'),lockEdge:e('KeyQ')||mouse.e[1],interact:e('KeyE'),eat:e('KeyH'),inv:e('Tab'),map:e('KeyM'),rdt:dt};
 let lx=0,ly=0;const pads=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];const gp=pads[0];
 if(gp){const dz=v=>Math.abs(v)>.15?v:0,b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed),be=i=>b(i)&&!padPrev[i];lx=dz(gp.axes[0]||0);ly=dz(gp.axes[1]||0);if(lx||ly){inp.mx=lx;inp.my=-ly;}
  const rx=dz(gp.axes[2]||0),ry=dz(gp.axes[3]||0);G.cam.yaw-=rx*dt*2.6;G.cam.pitch=cl(G.cam.pitch+ry*dt*1.8,-1.1,1.3);
  if(b(1))inp.sprint=true;if(be(0))inp.jumpEdge=true;if(be(2))inp.atkEdge=true;if(b(2))inp.atkHeld=true;if((gp.buttons[7]?.value||0)>.5)inp.aim=true;if(be(5))inp.fire=true;if(b(4))inp.block=true;if(be(11))inp.roll=true;if(be(1))inp.letGo=true;
  const lt=(gp.buttons[6]?.value||0)>.5;if(lt&&!padPrev.lt)inp.lockEdge=true;padPrev.lt=lt;if(be(3))inp.interact=true;if(be(10))inp.eat=true;if(be(8))inp.map=true;if(be(9))pause(app==='play');
  for(let i=0;i<16;i++)padPrev[i]=b(i);}
 if(inp.aim&&inp.atkEdge){inp.fire=true;inp.atkEdge=false;}if(inp.aim)inp.atkHeld=false;
 // camera
 const sens=.0024;G.cam.yaw-=mdx*sens;G.cam.pitch=cl(G.cam.pitch+mdy*sens,-1.1,1.3);mdx=mdy=0;
 const ak=(k('ArrowLeft')?1:0)-(k('ArrowRight')?1:0),av=(k('ArrowDown')?1:0)-(k('ArrowUp')?1:0);G.cam.yaw+=ak*dt*2.4;G.cam.pitch=cl(G.cam.pitch-av*dt*1.6,-1.1,1.3);
 if(G.scripted)Object.assign(inp,G.scripted);
 for(const c in edge)delete edge[c];mouse.e=[false,false,false];return inp;}

/* ================= simulation ================= */
let hintList=[['WASD to move · mouse to look · Space to jump',''],['Walk into a cliff to climb it · watch your stamina wheel',''],['Press Space in mid-air to open your glider',''],['Beams of light mark the Lumen Shrines',''],['E to forage · cook at a campfire for buffs','']];
function step(dt){dt=Math.min(dt,.1);if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}if(locT>0){locT-=dt;if(locT<=0)$('loc').classList.remove('on');}
 if(app==='menu'){menuT+=dt;run=run||null;envUpdate(dt,true);world.update(dt,camera,false);menuCam(dt);parts.update(dt);smoke.update(dt);ambient(dt,true);return;}
 if(app==='over'){menuT+=dt;envUpdate(dt,true);world.update(dt,camera,false);overCam(dt);parts.update(dt);smoke.update(dt);sparks.update(dt);return;}
 if(app!=='play'){envUpdate(0,false);return;}
 for(let i=timers.length-1;i>=0;i--){const t=timers[i];t.t-=dt;if(t.t<=0){timers.splice(i,1);t.f();}}if(app!=='play')return;
 const inp=readInput(dt);
 // time scale: hitstop, flurry rush, mid-air aim, victory
 G.stopT=Math.max(0,(G.stopT||0)-dt);let ts=1;if(G.stopT>0)ts=.06;if(P.flurry)ts=Math.min(ts,.14);if(P.slow)ts=Math.min(ts,.28);if(G.victoryT!==undefined&&G.victoryT<2.5)ts=Math.min(ts,.4);G.timeScale=ts;
 // menus
 if(inp.inv&&!P.dead){openInv();return;}if(inp.map&&!P.dead){openMap();return;}if(inp.eat&&!P.dead)quickEat();
 if(inp.lockEdge&&!P.dead){if(P.lock)P.lock=null;else{let best=null,bs=-1;const f=new V();camera.getWorldDirection(f);for(const e of G.enemies){if(e.dead||e.state==='intro'||e.state==='dormant')continue;const d=e.p.distanceTo(P.p);if(d>26)continue;const dir=new V(e.p.x-camera.position.x,e.p.y+1-camera.position.y,e.p.z-camera.position.z).normalize();const sc=dir.dot(f)-d*.01;if(sc>.55&&sc>bs){bs=sc;best=e;}}P.lock=best;if(!best)toast('No target in sight','');}}
 near=P.dead?null:findInteract();if(inp.interact&&near){near.act();inp.interact=false;}
 // simulate in sub-steps
 const n=Math.max(1,Math.ceil(dt/(1/60)));const r=dt/n;
 for(let i=0;i<n;i++){const wdt=r*ts,pdt=P.flurry?r*.9:r*ts;G.time+=wdt;updatePlayer(G,pdt,inp);inp.jumpEdge=inp.atkEdge=inp.roll=inp.letGo=inp.fire=false;
  for(const e of G.enemies){const d=Math.abs(e.p.x-P.p.x)+Math.abs(e.p.z-P.p.z);if(d>170&&!e.aware&&(G.time*10|0)%4!==(e.home.x|0)%4)continue;e.update(d>170?wdt*4:wdt);}
  G.proj.update(wdt);G.waves.update(wdt);if(G.room){G.room.t+=wdt;G.room.cam=camera.position;G.room.update(wdt,P);}}
 if(P.flurry&&P.atk&&P.atk.name==='flurry'&&!P.atk.counted){P.atk.counted=true;P.flurry.hits++;if(P.flurry.hits>=8){P.flurry=null;G.setFlurry(false);}}
 // seeds
 for(const s of seeds){if(s.taken)continue;s.m.rotation.y+=dt*2;s.m.position.y=s.y+Math.sin(G.time*2+s.x)*.12;const d=Math.hypot(P.p.x-s.x,P.p.z-s.z);if(d<40&&Math.random()<dt*3)parts.emit(s.x+rnd(.6)-.3,s.y+rnd(.4),s.z+rnd(.6)-.3,0,.6,0,2.2,1.6,.5,.18,.9);
  if(d<1.4&&Math.abs(P.p.y+.9-s.y)<1.9){s.taken=true;scene.remove(s.m);P.seeds++;snd.play('seed');toast(`Glimmer seed! ${P.seeds}/20`,'g');parts.burst(new V(s.x,s.y,s.z),60,4,[new THREE.Color(2.6,2,.6),new THREE.Color(.6,2.4,.8)],.3,1,{up:true,drag:1.5});}}
 // chest lids
 for(const c of S.chests){if(c.open&&c.openT<1){c.openT=Math.min(1,c.openT+dt*1.5);c.lid.rotation.x=-c.openT*1.7;}}
 // world clock: crimson moon, day/night, weather
 if(!run.end){run.clock-=dt;run.tod+=dt/run.dayLen;if(run.tod>=1){run.tod-=1;run.day++;}
  if(run.clock<=60&&!run.warned){run.warned=true;banner('THE CRIMSON MOON','rises in one minute','#ff2a2a',2.6);snd.play('moon');}
  if(run.clock<=0&&!run.victory){run.clock=0;endRun('moon');return;}
  run.rainT-=dt;if(run.rainT<=0){run.rainOn=!run.rainOn&&Math.random()<.65;run.rainT=run.rainOn?45+rnd(60):60+rnd(80);if(run.rainOn)toast('Rain rolls in. Wet rock is slippery.','');}
  if(run.rainOn&&G.rain>.7){run.thunderT-=dt;if(run.thunderT<=0){run.thunderT=10+rnd(18);G.flash=1;G.after(.4+rnd(1.2),()=>snd.play('thunder'));}}}
 G.rain+=((run.rainOn?1:0)-G.rain)*Math.min(1,dt*.25);
 if(G.victoryT!==undefined){G.victoryT+=dt;if(G.victoryT>5.5){G.victoryT=undefined;endRun('victory');return;}}
 // castle opening animation
 const c=S.castle;if(c.opened&&c.open<1){c.open=Math.min(1,c.open+dt*.25);c.domeMat.uniforms.uA.value=1-c.open;c.dome.visible=c.open<1;const gy=c.h-8.6*c.open;phys.move(c.gate,0,gy-c.gate.y0,0);c.gateMesh.position.y=gy+4.5;if(Math.random()<dt*20)G.dust(c.x+rnd(8)-4,c.h,c.z+30.5,2,true);}
 if(run.bossDead)c.vortexMat.uniforms.uA.value=Math.max(0,c.vortexMat.uniforms.uA.value-dt*.3);c.vortex.rotation.y+=dt*.05;
 // regions
 if(!G.room){let cur=null,bd=1e9;for(const r of POI.regions){const d=Math.hypot(P.p.x-r.x,P.p.z-r.z)/r.r;if(d<1&&d<bd){bd=d;cur=r.name;}}if(cur&&cur!==run.cur&&banT<=0){run.cur=cur;if(!run.regions.has(cur)){run.regions.add(cur);run.discover+=50;}region(cur);}}
 // hints for new players
 if(run.hintI<hintList.length){run.hintT-=dt;if(run.hintT<=0){toast(hintList[run.hintI][0],'t');run.hintI++;run.hintT=9;}}
 ambient(dt,false);envUpdate(dt,false);world.update(dt,camera,!!G.room);
 parts.update(dt*Math.max(ts,.3));sparks.update(dt*Math.max(ts,.3));smoke.update(dt*Math.max(ts,.3));
 updateCamera(G,dt);hud(dt);
 snd.music(dt,{night:G.night>.5,combat:G.enemies.some(e=>e.aware&&!e.dead&&e.p.distanceTo(P.p)<40)||!!G.bossTarget?1:0});
 const nearFire=fires.reduce((m,f)=>Math.min(m,Math.hypot(P.p.x-f.x,P.p.z-f.z)),1e9);snd.beds({wind:P.mode==='glide'?.18:G.room?0:.03+(P.p.y>60?.05:0),rain:G.room?0:G.rain,fire:G.room?0:Math.max(0,1-nearFire/12),water:G.room?0:P.mode==='swim'?1:0});}

/* ambient particles + fires + lamps */
function ambient(dt,menu){const cp=camera.position;const night=G.night;
 if(!G.room){// fireflies at night, pollen motes by day, leaves in the forest
  const n=Math.random()<dt*(night>.5?14:6);if(n){const a=rnd(6.28),d=4+rnd(18),x=cp.x+Math.cos(a)*d,z=cp.z+Math.sin(a)*d,h=heightAt(x,z);if(h>2&&!inLake(x,z)){if(night>.5)parts.emit(x,h+.4+rnd(1.5),z,rnd(.6)-.3,rnd(.3),rnd(.6)-.3,1.2,2.4,.4,.16,4+rnd(3),-.05,.2);else parts.emit(x,h+.5+rnd(3),z,rnd(.4)-.2,rnd(.2),rnd(.4)-.2,.9,.85,.6,.06,5,0,.1);}}
  if(forestDensity(cp.x,cp.z)>.5&&Math.random()<dt*5){const a=rnd(6.28),d=rnd(16);const x=cp.x+Math.cos(a)*d,z=cp.z+Math.sin(a)*d;smoke.emit(x,heightAt(x,z)+5+rnd(4),z,.6+rnd(.5),-.6,.3,.25,.3,.05,.18,5,0,.2);}}
 // fires
 let L=[];for(const f of fires){if(!f.lit)continue;if(G.room)continue;const d=Math.hypot(cp.x-f.x,cp.z-f.z);if(d>70)continue;L.push([d,f]);const k=f.brazier?.7:1;if(Math.random()<dt*34*k)parts.emit(f.x+rnd(.5)-.25,f.y+.1+(f.brazier?0:.05),f.z+rnd(.5)-.25,rnd(.3)-.15,1.2+rnd(1.2),rnd(.3)-.15,1.6,.62,.14,.32,.55,-1.2,.6);
  if(Math.random()<dt*4)parts.emit(f.x,f.y+.4,f.z,rnd(1)-.5,2+rnd(2),rnd(1)-.5,3,1.6,.4,.07,1.4,-.5,.3);if(Math.random()<dt*3)smoke.emit(f.x,f.y+1.4,f.z,rnd(.3)-.15,1+rnd(.5),rnd(.3)-.15,.42,.4,.38,.6,2.4,-.2,.4);}
 L.sort((a,b)=>a[0]-b[0]);
 if(G.room){lamps.forEach((l,i)=>{l.position.copy(G.room.lights[i]);l.color.setHex(0x7af0ff);l.intensity=40;l.distance=40;});}
 else lamps.forEach((l,i)=>{const f=L[i]&&L[i][1];if(f){l.position.set(f.x,f.y+1,f.z);l.color.setHex(0xff8a3a);l.distance=16;l.intensity=(8+G.night*14)*(.85+Math.sin(G.time*13+i)*.08+Math.random()*.07);}else l.intensity=0;});}

/* lighting per frame */
function envUpdate(dt,menu){let tod,rain,blood;if(menu||!run){tod=app==='over'&&run?run.tod:.355+Math.sin(menuT*.02)*.01;rain=0;blood=0;}else{tod=run.tod;rain=G.rain;blood=Math.pow(cl(1-run.clock/120,0,1),1.5);}
 G.blood=blood;U.uTime.value=G.time+menuT;U.uRain.value=rain;U.uBlood.value=blood;U.uPlayer.value.copy(P.p);U.uWind.value.set(.6+rain*.8+(P.mode==='glide'?.3:0),.3+rain*.4);
 if(G.room){hemi.color.setRGB(.2,.28,.36);hemi.groundColor.setRGB(.05,.05,.07);hemi.intensity=1.5;sun.intensity=.55;sun.color.setRGB(.55,.8,1);scene.fog.color.setRGB(.015,.04,.055);scene.fog.density=.022;sun.position.set(P.p.x+20,P.p.y+60,P.p.z+30);sun.target.position.copy(P.p);G.night=0;return;}
 const r=lighting(tod,rain,blood,sun,hemi,scene.fog);G.night=r.night;
 if(G.flash>0){G.flash-=dt*3;hemi.intensity+=Math.max(0,G.flash)*6;}
 // shadow box follows the player (texel-snapped)
 const fp=app==='play'?P.p:camera.position;const dir=sun.position.clone().normalize();const snap=110/sun.shadow.mapSize.x;const tx=Math.round(fp.x/snap)*snap,tz=Math.round(fp.z/snap)*snap;sun.target.position.set(tx,fp.y,tz);sun.position.copy(sun.target.position).addScaledVector(dir,180);}

/* menu & results cameras */
function menuCam(dt){const s=POI.start;const a=Math.sin(menuT*.04)*.25;camera.position.set(s.x-5+Math.sin(a)*2,s.h+3.6,s.z+7.5);camera.lookAt(s.x+12+Math.sin(a)*14,s.h+3,s.z-110);camera.fov=58;camera.updateProjectionMatrix();
 P.rig.root.visible=true;if(app==='menu'){P.p.set(s.x+1,s.h,s.z-1);P.rig.root.position.copy(P.p);P.rig.root.rotation.y=Math.PI+.2;import_anim(dt);}}
function import_anim(dt){animateIdle(dt);}
function overCam(dt){const a=menuT*.06;const c=run&&run.victory?S.castle:{x:P.p.x,z:P.p.z,h:P.p.y};const tx=c.x,tz=run&&run.victory?c.z:c.z,ty=(run&&run.victory?c.h+8:c.h+2);camera.position.set(tx+Math.cos(a)*(run&&run.victory?70:14),ty+(run&&run.victory?30:6),tz+Math.sin(a)*(run&&run.victory?70:14));camera.lookAt(tx,ty,tz);camera.fov=55;camera.updateProjectionMatrix();}
import {animate as animRig} from './rig.js';
function animateIdle(dt){animRig(P.rig,{mode:'idle',speed:0,t:menuT,idleLook:1},dt);P.trail.push(new V(),new V(),false,dt);}

/* ================= HUD ================= */
const hc={};const setT=(el,v,k)=>{if(hc[k]!==v){hc[k]=v;el.textContent=v;}};
const markPool=[];function mark(i){if(!markPool[i]){const d=document.createElement('div');d.className='mk';$('marks').appendChild(d);markPool[i]=d;}return markPool[i];}
const mini=$('mini').getContext('2d');let miniT=0;const tv=new V();
function hud(dt){// hearts
 const hk=P.hp+'/'+P.maxHp+'/'+P.tmp;if(hc.h!==hk){hc.h=hk;let s='';for(let i=0;i<P.maxHp/4;i++){const f=cl(P.hp-i*4,0,4)*25;s+=`<i style="--f:${f}%"></i>`;}for(let i=0;i<Math.ceil(P.tmp/4);i++){const f=cl(P.tmp-i*4,0,4)*25;s+=`<i class="tmp" style="--f:${f}%"></i>`;}$('hearts').innerHTML=s;$('hearts').classList.toggle('low',P.hp<=4&&!P.dead);}
 const bk=Object.entries(P.buffs).map(([k,v])=>`${BUFF[k]} ${Math.ceil(v)}s`).join('|');if(hc.b!==bk){hc.b=bk;$('buffs').innerHTML=bk?bk.split('|').map(t=>`<span>${t}</span>`).join(''):'';}
 // objective
 const ok=`${run.shrines}|${run.golemDead}|${S.castle.opened}|${run.bossDead}`;if(hc.o!==ok){hc.o=ok;$('obj').innerHTML=run.shrines<4?`Clear the Lumen Shrines <b>${run.shrines}/4</b><br><em>Follow the beams of light</em>`+(run.golemDead?'':'<br>Optional · a guardian sleeps in the Ruins of Ostvale'):run.bossDead?'<b>The Keep is free.</b>':'Storm <b>Thornhold Keep</b> · defeat its Warden<br><em>The seal is broken</em>';}
 // moon
 const frac=1-run.clock/run.len;setT($('mtime'),fmt(run.clock),'mt');$('mprog').setAttribute('stroke-dasharray',`${(frac*182).toFixed(1)} 200`);$('mdisc').style.fill=`rgb(${242},${Math.round(239-frac*200)},${Math.round(230-frac*200)})`;$('mshade').setAttribute('cx',(40+frac*24).toFixed(1));
 $('moon').classList.toggle('blood',run.clock<60);const hrs=(run.tod*24+24)%24;setT($('tod'),`DAY ${run.day} · ${String(hrs|0).padStart(2,'0')}:${String((hrs%1)*60|0).padStart(2,'0')}`,'tod');setT($('wx'),G.rain>.4?'RAIN':G.night>.5?'NIGHT':'CLEAR','wx');
 // stamina wheel next to the hero
 const st=$('stam');const show=P.stShow>0||P.ex||P.mode==='climb'||P.mode==='glide';st.style.opacity=show&&!P.dead?1:0;if(show){tv.set(P.p.x,P.p.y+1.4,P.p.z).project(camera);const C1=2*Math.PI*24,C2=2*Math.PI*28;const base=100,f1=Math.min(P.st,base)/base,f2=P.stMax>base?Math.max(0,P.st-base)/(P.stMax-base):0;
  $('stfg').setAttribute('stroke-dasharray',`${(f1*C1).toFixed(1)} 200`);$('stfg2').setAttribute('stroke-dasharray',`${(f2*C2*(P.stMax-base)/120).toFixed(1)} 200`);$('stbg2').style.display=$('stfg2').style.display=P.stMax>base?'':'none';$('stbg2').setAttribute('stroke-dasharray',`${(C2*(P.stMax-base)/120).toFixed(1)} 200`);
  st.style.left=((tv.x*.5+.5)*innerWidth+70)+'px';st.style.top=((-tv.y*.5+.5)*innerHeight)+'px';st.classList.toggle('ex',P.ex);st.classList.toggle('warn',!P.ex&&P.st<P.stMax*.3);}
 // gear
 setT($('garr'),String(P.arrows),'ar');setT($('gseed'),P.seeds+'/20','sd');setT($('gfood'),String(P.dishes.length+ORDER.reduce((s,k)=>s+(P.inv[k]||0),0)),'fd');$('gsw').classList.toggle('rune',P.sword==='rune');$('gbo').classList.toggle('on',P.aim);$('gsh').classList.toggle('on',P.block);
 // prompt
 const pt=near&&!P.dead?`<kbd>E</kbd>${near.label}`:'';if(hc.pt!==pt){hc.pt=pt;$('prompt').innerHTML=pt;$('prompt').classList.toggle('on',!!pt);}
 // crosshair / lock
 $('cross').classList.toggle('on',P.aim);$('cross').classList.toggle('full',P.draw>=1);
 const lr=$('lockr');if(P.lock){tv.set(P.lock.p.x,P.lock.p.y+P.lock.K.bodyY,P.lock.p.z).project(camera);lr.style.left=(tv.x*.5+.5)*innerWidth+'px';lr.style.top=(-tv.y*.5+.5)*innerHeight+'px';lr.classList.add('on');}else lr.classList.remove('on');
 // enemy markers
 let mi=0;for(const e of G.enemies){if(e.dead||mi>=14||G.room)continue;if(e.state==='intro'||e.state==='dormant'||e===G.bossTarget)continue;const d=e.p.distanceTo(P.p);if(d>36)continue;const showHp=e.hp<e.maxHp,al=!e.aware&&e.alert>.05,zz=e.sleeping;if(!showHp&&!al&&!zz&&!(e.alertFlash>0))continue;
  tv.set(e.p.x,e.p.y+e.K.headY+.55,e.p.z).project(camera);if(tv.z>1||Math.abs(tv.x)>1.1||Math.abs(tv.y)>1.1)continue;const m=mark(mi++);m.style.display='';m.style.left=(tv.x*.5+.5)*innerWidth+'px';m.style.top=(-tv.y*.5+.5)*innerHeight+'px';
  const key=(e.alertFlash>0?'!':al?'?'+(e.alert*10|0):zz?'z':'')+'|'+(showHp?Math.round(e.hp/e.maxHp*46):'');if(m._k!==key){m._k=key;m.innerHTML=(e.alertFlash>0?'<div class="al">!</div>':al?`<div class="al q" style="opacity:${.4+e.alert*.6}">?</div>`:zz?'<div class="zz">Zz</div>':'')+(showHp?`<div class="hp"><i style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></i></div>`:'');}}
 for(let i=mi;i<markPool.length;i++)markPool[i].style.display='none';
 // boss bar
 if(G.bossTarget){const e=G.bossTarget;const f=Math.max(0,e.hp/e.maxHp*100)+'%';$('bhp').style.width=f;$('bhp2').style.width=f;}
 $('vign').style.opacity=Math.max(0,(+$('vign').style.opacity||0)-dt*1.6)+(P.hp<=4&&!P.dead?.25+Math.sin(G.time*5)*.1:0);
 // minimap
 if((miniT-=dt)<=0){miniT=.05;drawMini();}}
function drawMini(){const w=180,c=w/2;mini.save();mini.clearRect(0,0,w,w);mini.beginPath();mini.arc(c,c,c-1,0,7);mini.clip();mini.fillStyle='#0a2a3a';mini.fillRect(0,0,w,w);
 if(G.room){mini.fillStyle='#123';mini.fillRect(0,0,w,w);mini.fillStyle='#3fe6e6';mini.font='700 11px JetBrains Mono, monospace';mini.textAlign='center';mini.fillText('SHRINE',c,c+40);}
 else{const yaw=G.cam.yaw;const phi=Math.atan2(Math.cos(yaw),Math.sin(yaw));const th=-Math.PI/2-phi;mini.translate(c,c);mini.rotate(th);mini.scale(1,1);mini.drawImage(mapCanvas,-P.p.x-320,-P.p.z-320);drawMapMarks(mini,(x,z)=>[x-P.p.x,z-P.p.z],1);
  for(const e of G.enemies){if(e.dead||!e.aware||e.state==='intro')continue;mini.fillStyle='#ff4a3a';mini.beginPath();mini.arc(e.p.x-P.p.x,e.p.z-P.p.z,2.5,0,7);mini.fill();}
  mini.rotate(-th);
  // player arrow
  mini.rotate(-(P.yaw-yaw));mini.fillStyle='#fff';mini.strokeStyle='#000';mini.lineWidth=1.5;mini.beginPath();mini.moveTo(0,-8);mini.lineTo(5.5,6);mini.lineTo(0,3);mini.lineTo(-5.5,6);mini.closePath();mini.stroke();mini.fill();}
 mini.restore();}

/* ================= end of run / scoring ================= */
function scoreBreakdown(){const t=[['Lumen shrines cleared',run.shrines+'/4',run.shrines*1000],['Foes defeated',String(P.kills),run.killScore],['Glimmer seeds',P.seeds+'/20',P.seeds*150],['Treasure & cooking',run.chests+' chests · '+P.cooked+' dishes',run.gems],['Regions discovered',run.regions.size+'/'+POI.regions.length,run.discover]];
 if(run.victory)t.push(['Victory','Warden defeated',2000],['Moon to spare',fmt(run.clock),Math.round(run.clock)*3]);if(P.falls)t.push(['Falls',String(P.falls),-150*P.falls]);return t;}
function endRun(reason){if(run.end)return;run.end=true;run.overReason=reason;const rows=scoreBreakdown();const total=Math.max(0,rows.reduce((s,r)=>s+r[2],0));run.score=total;
 app='over';hideAll();$('hud').hidden=true;document.body.classList.remove('playing');unlockPointer();G.setFlurry(false);P.flurry=null;if(G.room){G.room.g.visible=false;G.room=null;}
 const won=reason==='victory';if(!won)snd.play('moon');
 $('oeye').textContent=won?'THE KEEP IS FREED · '+fmt(run.len-run.clock)+' ELAPSED':reason==='fallen'?'FALLEN ON HARD · '+fmt(run.len-run.clock):'THE CRIMSON MOON ROSE';
 $('ores').textContent=won?'VICTORY':'DEFEAT';$('ores').style.color=won?'#ffcf5a':'#ff3a3a';$('ofs').textContent=total.toLocaleString()+' PTS';
 $('stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]>0?'+':''}${r[2]}</td></tr>`).join('');
 const tok=award(total,won);$('otok').textContent=`+${tok} TOKENS · BEST ${best()} PTS · ${DIFF[opt.diff].n} · ${opt.len} MIN MOON`;$('over').hidden=false;menuT=0;}
function award(pts,won){lastAward={pts,won,shrines:run.shrines,kills:P.kills,seeds:P.seeds,diff:DIFF[opt.diff].n.toLowerCase(),len:opt.len,time:fmt(run.len-run.clock)};const tok=5+Math.min(60,pts/150|0);
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID;if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID)||0);}catch(e){return 0;}}

/* ================= rendering ================= */
const GodRays={uniforms:{tDiffuse:{value:null},uSun:{value:new THREE.Vector2(.5,.5)},uStr:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uSun;uniform float uStr;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);if(uStr<=.001){gl_FragColor=c;return;}vec2 d=(vUv-uSun)*(1./36.)*.85;vec2 uv=vUv;float w=1.;vec3 acc=vec3(0.);
 for(int i=0;i<36;i++){uv-=d;vec3 s=texture2D(tDiffuse,clamp(uv,0.,1.)).rgb;float l=dot(s,vec3(.3,.59,.11));acc+=s*smoothstep(1.1,2.4,l)*w;w*=.955;}gl_FragColor=vec4(c.rgb+acc*uStr/36.,c.a);}`};
const POST={exposure:1.0,bloom:.42,bloomThreshold:.92,bloomRadius:.5,vignette:.32,saturation:1.12,grain:.02,aoStrength:.65};
let fx=null,gfx=quality(),godPass=null;
function applyQuality(q){gfx=q;world.setQuality(q);sun.castShadow=q>0;sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}R.setPixelRatio(Math.min(devicePixelRatio,[1,1,1.25][q]));fx=null;}
function getFx(){if(!fx){fx=cinematic(R,scene,camera,{...POST,quality:gfx});fx.w=0;godPass=null;if(fx.composer){godPass=new ShaderPass(GodRays);fx.composer.insertPass(godPass,fx.ao?2:1);}
  if(fx.ao){const ov=fx.ao.overrideVisibility.bind(fx.ao);fx.ao.overrideVisibility=function(){ov();for(const o of[world.grass,world.flowers,world.sea,world.lake,world.sky,world.rain,world.shafts,S.castle.dome,S.castle.vortex])o.visible=false;};}}
 const w=innerWidth,h=innerHeight;if(fx.w!==w*9999+h){fx.w=w*9999+h;R.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fx.setSize(w,h);}return fx;}
function render(){const f=getFx();const cp=camera.position;for(const e of G.enemies){if(e.gone)continue;const d=Math.abs(e.p.x-cp.x)+Math.abs(e.p.z-cp.z);e.rig.root.visible=d<(e.kind==='golem'?190:120)&&!(e.kind==='boss'&&e.state==='intro')&&(!G.room);}parts.U.uScale.value=sparks.U.uScale.value=smoke.U.uScale.value=innerHeight*R.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));
 if(godPass){const sd=U.uSunDir.value;const s=tv.copy(camera.position).addScaledVector(sd,1000).project(camera);const facing=new V();camera.getWorldDirection(facing);const k=facing.dot(sd);
  godPass.uniforms.uSun.value.set(s.x*.5+.5,s.y*.5+.5);godPass.uniforms.uStr.value=G.room?0:cl(k,0,1)*ss(-.02,.15,sd.y)*(1-U.uNight.value)*(1-G.rain)*.6*(gfx>=1?1:0);}
 f.render();}
addEventListener('resize',()=>{if(fx)fx.w=0;});
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));

/* ================= menu wiring ================= */
const seg=(id,key)=>{const el=$(id);const set=v=>{opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));};set(opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(+b.dataset.v));};
seg('o-diff','diff');seg('o-len','len');
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{if(run)run.end=true;toMenu();};
$('cookgo').onclick=cook;$('cookx').onclick=closePanels;$('bh').onclick=()=>bless('heart');$('bs2').onclick=()=>bless('stamina');
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Wild Quest\nPoints: ${a.pts||0}\nResult: ${a.won?'victory':'defeat'} in ${a.time||''}\nShrines: ${a.shrines||0}/4 · Foes: ${a.kills||0} · Seeds: ${a.seeds||0}/20\nChallenge: ${a.diff||''} · Moon: ${a.len||20} min\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] '+ID+' '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.QUEST={R,get state(){return app;},get app(){return app;},start,step,render,toMenu,pause,G,P,S,rooms,seeds,pickups,get run(){return run;},get enemies(){return G.enemies;},
 setClock(s){if(run)run.clock=s;},get clock(){return run?run.clock:0;},setTod(t){if(run)run.tod=t;},setRain(on){if(run){run.rainOn=on;run.rainT=999;G.rain=on?1:0;}},
 teleport(x,z,y){resetPlayer(G,x,y??heightAt(x,z),z,P.yaw);},input(o){G.scripted=o;},noLock(){G.noPauseOnUnlock=true;},
 enterShrine(i){enterRoom(S.shrines[i]);},completeShrine(i){const s=S.shrines[i];if(G.room)exitRoom(true);else{G.curShrine=s;G.room=rooms[i];rooms[i].g.visible=true;exitRoom(true);}},
 takeOrb,bless,openCastle,killAll(kind){for(const e of G.enemies)if(!e.dead&&(!kind||e.kind===kind)){if(e.kind==='boss'&&e.state==='intro'){e.state='chase';e.rig.root.visible=true;}G.damageEnemy(e,99999,{});}},
 hurt:(q,kind='fall')=>hurt(q,null,kind),cook,openCook,eat,setQuality:applyQuality,get quality(){return gfx;},endRun,score:()=>run&&run.score,scoreBreakdown,cookResult,
 camYaw(y,p){G.cam.yaw=y;if(p!==undefined)G.cam.pitch=p;}};
