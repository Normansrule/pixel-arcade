// STRIKE ZONE — fast arena "boomer shooter": strafe-jumping, dash, double jump, six weapons, finishers, secrets, a boss. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {ARENAS,Level,CS,STEP} from './levels.js';
import {makeTextures} from './tex.js';
import {buildWorld,MOOD} from './world.js';
import {FX} from './fx.js';
import {Sound} from './sound.js';
import {MON,Monster} from './monsters.js';
import {WPN,ORDER,AMMO,GIVE,buildViewmodel,Projectiles} from './weapons.js';
import {Items,ITEM} from './items.js';
import {HUD,mmss} from './hud.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,TAU=Math.PI*2;
const MV={ground:9.6,accel:11,friction:7,stop:2.6,airAccel:3,airCap:1.5,jump:7.9,djump:7.6,grav:21,max:34,dash:17,dashT:.16,dashRe:1.15,eye:1.62,r:.38};
const DIFFS=[{n:'WARM',hp:.8,dmg:.6,rate:1.35,spd:.9,agg:.8,lead:.2,home:0,count:.75,alive:7},{n:'HOT',hp:1,dmg:1,rate:1,spd:1,agg:1,lead:.55,home:.6,count:1,alive:9},{n:'MOLTEN',hp:1.2,dmg:1.35,rate:.78,spd:1.12,agg:1.25,lead:.85,home:1.4,count:1.3,alive:12}];
const CAMPAIGN=[[{imp:5},{imp:6,charger:1,eye:2},{imp:5,eye:3,charger:2,brute:1}],[{imp:6,eye:3,charger:1},{imp:5,charger:3,brute:1,eye:2},{imp:6,eye:4,brute:2,charger:2}],[{imp:6,eye:4,charger:2,brute:1},{imp:6,eye:3,charger:3,brute:2},{boss:1}]];
const PAR=[150,180,240],CAMP_T=15*60,ENDLESS_T=6*60,DT=1/120;

/* ================= renderer ================= */
const canvas=$('c');const Rr=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});Rr.setPixelRatio(Math.min(devicePixelRatio,1.5));Rr.shadowMap.enabled=true;Rr.shadowMap.type=THREE.PCFSoftShadowMap;Rr.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(80,1,.05,900);cam.rotation.order='YXZ';
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(62,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xffffff,0x221814,.8),vmKey=new THREE.DirectionalLight(0xfff0e0,1.5),vmRim=new THREE.DirectionalLight(0xff8040,1.2),vmFlash=new THREE.PointLight(0xffaa55,0,3,1.5);
vmKey.position.set(-1,2,1);vmRim.position.set(2,.4,-1.5);vmFlash.position.set(.15,-.05,-.8);vmScene.add(vmHemi,vmKey,vmRim,vmFlash);
const snd=new Sound();const TXC={},WC={};let TX=null,world=null,L=null,fx=null,VM=null,proj=null,items=null;

/* ================= state ================= */
const G={app:'menu',mode:'camp',opt:{mode:'camp',arena:0,diff:1,sens:1,vol:.8,mus:.55,fov:100},diff:DIFFS[1],L:null,monsters:[],time:0,clock:CAMP_T,arenaIdx:0,wave:0,waveMax:3,phase:'intro',phaseT:0,toSpawn:[],spawnT:0,arenaT:0,par:0,
 score:0,combo:1,comboT:0,quadT:0,hurtFx:0,lavaFx:0,gloryFx:0,attract:true,exit:null,shocks:[],meteors:[],gloryTarget:null,timeScale:1,hitstop:0,noRespawn:false,idle:false,god:false,
 stats:null,player:null,flowWalk:null,flowLeap:null,flowT:0};
try{Object.assign(G.opt,JSON.parse(localStorage.getItem('pxd_strike_opt'))||{});}catch(e){}
G.left=()=>G.monsters.filter(m=>m.alive).length+G.toSpawn.length;
G.banner=(t,s,d)=>hud.banner(t,s,'#ff8a3d',d);
G.shake=a=>{shake=Math.max(shake,a);};
function newStats(){return{kills:0,glory:0,secrets:0,secretsTotal:0,shots:0,hits:0,dmgTaken:0,topSpeed:0,arenas:0,waves:0,byType:{},dmgBy:{},time:0,rocketJumps:0};}

/* ================= player ================= */
function newPlayer(){return{pos:new V(),vel:new V(),yaw:0,pitch:0,hp:100,armor:0,alive:true,onGround:true,dbl:false,dashes:2,dashCD:0,dashRe:MV.dashRe,dashT:0,dashDir:new V(),jumpHeld:false,
 weapons:{sg:true},cur:'sg',prev:'sg',ammo:{shells:AMMO.shells.start,bullets:0,cells:0,rockets:0,slugs:0},nextFire:0,spin:0,spread:0,eye:new V(),lastSafe:new V(),padCD:0,teleCD:0,lavaT:0,landDip:0,punch:0,
 meleeCD:0,glory:null,invuln:0,roll:0,swapT:0,airT:0};}
G.player=newPlayer();const P=()=>G.player;

/* ================= arenas ================= */
function loadArena(i){const def=ARENAS[i];if(world)scene.remove(world.group);const mood=def.mood;
 if(!TXC[mood])TXC[mood]=makeTextures(mood);TX=TXC[mood];if(!WC[def.id]){WC[def.id]={def};}
 L=new Level(def);G.L=L;world=buildWorld(L,TX,Rr);scene.add(world.group);scene.fog=world.fog;scene.environment=world.env;vmScene.environment=world.env;scene.background=new THREE.Color(world.M.fog);
 if(!fx){fx=new FX(scene,TX);G.fx=fx;proj=new Projectiles(scene);items=new Items(scene);G.items=items;}else{fx.clear();proj.clear();items.clear();}
 fx.smoke.U.uTex.value=TX.puff;
 for(const m of G.monsters)scene.remove(m.root);G.monsters=[];G.shocks.length=0;for(const m of G.meteors)scene.remove(m.mark);G.meteors.length=0;if(G.exitMesh){scene.remove(G.exitMesh);G.exitMesh=null;}G.exit=null;
 vmHemi.color.set(world.M.hemi[0]);vmRim.color.set(new THREE.Color(...world.M.ember).multiplyScalar(.4));
 fxStack=null;Rr.shadowMap.needsUpdate=true;G.flowWalk=G.flowLeap=null;}
function placeItems(campaign){const def=L.def;for(const it of def.items){const p=L.P(it.c);items.add(it.k,new V(p.x,p.y+.05,p.z),{placed:true});}
 for(const ws of def.wspots){if(campaign&&!ws.camp)continue;const p=L.P(ws.c);items.add('weapon',new V(p.x,p.y+.05,p.z),{placed:true,w:{id:ws.w,col:WPN[ws.w].col}});}
 def.secrets.forEach((s,k)=>{s._found=false;for(const r of s.reward){const p=L.P(r.c);items.add(r.k,new V(p.x,p.y+.05,p.z),{placed:true,secret:true});}});}

/* ================= run flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setMusic(G.opt.mus);
 G.attract=false;G.app='play';G.mode=G.opt.mode;G.diff=DIFFS[G.opt.diff];G.stats=newStats();G.score=0;G.combo=1;G.comboT=0;G.quadT=0;G.time=0;G.clock=G.mode==='camp'?CAMP_T:ENDLESS_T;G.player=newPlayer();G.timeScale=1;G.slowT=0;G.hitstop=0;G.result=null;G.bossDead=false;G.deathT=0;
 G.arenaIdx=G.mode==='camp'?0:G.opt.arena;if(G.mode==='endless'){for(const id of ORDER){G.player.weapons[id]=id==='sg';}}
 enterArena(G.arenaIdx);hud.show(true);hud.clear();['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.add('playing');lock();}
function enterArena(i){G.arenaIdx=i;loadArena(i);const def=L.def,p=P();placeItems(G.mode==='camp');const s=L.P(def.start);p.pos.set(s.x,s.y,s.z);p.vel.set(0,0,0);p.yaw=def.yaw;p.pitch=0;p.lastSafe.copy(p.pos);p.glory=null;
 G.wave=0;G.waveMax=G.mode==='camp'?3:99;G.phase='intro';G.phaseT=G.mode==='camp'&&i>0?2.2:2.6;G.arenaT=0;G.par=G.mode==='camp'?PAR[i]:0;G.toSpawn=[];G.stats.secretsTotal+=def.secrets.length;
 hud.banner(def.name,def.sub+(G.mode==='camp'?' · ARENA '+(i+1)+' OF 3':' · ENDLESS'),'#ff8a3d',2.6);snd.music(1);equip(p.cur,true);}
function nextWave(){G.wave++;const D=G.diff;let comp;if(G.mode==='camp')comp=CAMPAIGN[G.arenaIdx][G.wave-1];else comp=endlessWave(G.wave);
 const list=[];for(const k in comp){const n=k==='boss'?1:Math.max(1,Math.round(comp[k]*D.count));for(let i=0;i<n;i++)list.push(k);}list.sort(()=>R()-.5);if(list.includes('boss')){list.splice(list.indexOf('boss'),1);list.unshift('boss');}
 G.toSpawn=list;G.spawnT=.4;G.phase=comp.boss?'boss':'fight';G.stats.waves=Math.max(G.stats.waves,G.wave-1);
 if(comp.boss){hud.banner('PYRE COLOSSUS','IT WAKES · STRIKE THE MOLTEN CORE','#ff5a1a',3.2);snd.music(3);}else{hud.banner('WAVE '+G.wave,G.mode==='camp'?(G.wave===3?'FINAL WAVE':list.length+' HOSTILES'):list.length+' HOSTILES','#ff8a3d',1.8);snd.music(2);}snd.wave();}
function endlessWave(n){const b=5+n*3;const c={imp:0,charger:0,eye:0,brute:0};let budget=b;while(budget>0){const r=R();if(n>=3&&r<.12&&budget>=6){c.brute++;budget-=6;}else if(n>=2&&r<.3&&budget>=3){c.charger++;budget-=3;}else if(r<.55){c.eye++;budget-=2;}else{c.imp++;budget-=1;}}if(n%6===0){return{boss:1,imp:2};}return c;}
function waveCleared(){G.score+=250*G.wave;G.stats.waves=Math.max(G.stats.waves,G.wave);if(G.mode==='camp'&&G.wave>=G.waveMax){arenaClear();return;}G.phase='break';G.phaseT=3;hud.banner('WAVE CLEAR','+'+(250*G.wave)+' · CATCH YOUR BREATH','#9be27a',1.8);snd.music(1);snd.clear();}
function arenaClear(){G.phase='clear';G.stats.arenas++;const bonus=Math.max(0,Math.round((G.par-G.arenaT)*10));G.score+=bonus+1000;hud.banner('ARENA CLEAR',(bonus?'+'+bonus+' PAR BONUS · ':'')+'+1000 · WALK INTO THE PORTAL','#ffd04a',3.2);snd.clear();snd.music(1);
 // exit portal at the arena start
 const p=L.P(L.def.start);G.exit=new V(p.x,p.y,p.z);const g=new THREE.Group();g.position.copy(G.exit);const col=new THREE.Color(1,.75,.25);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,.16,10,40),new THREE.MeshBasicMaterial({color:col.clone().multiplyScalar(3)}));ring.position.y=1.9;g.add(ring);
 const disc=new THREE.Mesh(new THREE.CircleGeometry(1.5,40),new THREE.MeshBasicMaterial({map:TX.portal,color:col.clone().multiplyScalar(1.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));disc.position.y=1.9;g.add(disc);
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.6,40,20,1,true),new THREE.MeshBasicMaterial({color:col.clone().multiplyScalar(.35),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=20;g.add(beam);
 g.userData={ring,disc};scene.add(g);G.exitMesh=g;fx.spawnPortal(G.exit,0xffc040);}
function toMenu(){unlock();['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing');hud.show(false);attractMode();}
function attractMode(){G.attract=true;G.app='menu';G.diff=DIFFS[1];loadArena(G.opt.mode==='endless'?G.opt.arena:G.opt.arena);G.player=newPlayer();const c=L.P([L.W/2,L.H/2]);G.player.pos.set(c.x,-50,c.z);
 const kinds=['imp','imp','imp','charger','eye','eye','brute'];for(let i=0;i<kinds.length;i++){const sp=L.def[kinds[i]==='eye'?'air':'spawns'][i%L.def[kinds[i]==='eye'?'air':'spawns'].length];const p=L.P(sp);if(kinds[i]==='eye')p.y+=4;const m=new Monster(kinds[i],p,G);m.state='chase';m.root.scale.setScalar(m.rig.scale||1);scene.add(m.root);G.monsters.push(m);}
 placeItems(false);snd.music(0);updateBest();}

/* ================= spawning ================= */
function spawn(type,at){const def=L.def,p=P();let pos;
 if(at)pos=at.clone();
 else if(type==='boss'){const b=L.P(def.bossAt||def.start);pos=new V(b.x,b.y,b.z);}
 else{const pool=(type==='eye'?def.air:def.spawns).map(c=>{const q=L.P(c);if(type==='eye')q.y=Math.max(q.y,0)+3.5+R()*2;return new V(q.x,q.y,q.z);});
  const far=pool.filter(q=>Math.hypot(q.x-p.pos.x,q.z-p.pos.z)>11);const pick=(far.length?far:pool);pos=pick[(R()*pick.length)|0].clone();pos.x+=(R()-.5)*1.5;pos.z+=(R()-.5)*1.5;if(type!=='eye')pos.y=L.groundAt(pos.x,pos.z,pos.y+1,.3);}
 const m=new Monster(type,pos,G);scene.add(m.root);G.monsters.push(m);fx.spawnPortal(type==='eye'?new V(pos.x,pos.y-1,pos.z):pos,type==='boss'?0xff5a00:new THREE.Color(...world.M.ember).getHex());snd.monster('spawn',pos);
 m.root.traverse(o=>{if(o.isMesh)o.castShadow=gfx>=1&&o.castShadow;});return m;}
G.spawnNear=(pos,type)=>{for(let k=0;k<12;k++){const a=R()*TAU,r=3+R()*5;const x=pos.x+Math.cos(a)*r,z=pos.z+Math.sin(a)*r;const t=L.cellTop(x,z);if(t>-1&&t<3&&!L.isLava(x,z)){spawn(type,new V(x,type==='eye'?t+4:t,z));return;}}};

/* ================= enemy attacks ================= */
const EK={fireball:{dmg:12,splash:0},bolt:{dmg:7,splash:0},cannon:{dmg:24,splash:3.2},meteor:{dmg:26,splash:3.6}};
G.enemyShot=(kind,from,target,lead=0,dir=null,speed=null)=>{const sp=speed||{fireball:17,bolt:27,cannon:15,meteor:30}[kind];let d;
 if(dir)d=dir.clone().normalize();else{const t=new V(target.pos.x,target.pos.y+1.05,target.pos.z);const dist=t.distanceTo(from);const tt=dist/sp;t.x+=target.vel.x*tt*lead;t.z+=target.vel.z*tt*lead;if(kind==='cannon')t.y+=Math.min(3,dist*.06);d=t.sub(from).normalize();}
 const k=EK[kind];proj.add(kind,'e',from,d.multiplyScalar(sp),{dmg:k.dmg*G.diff.dmg,splash:k.splash,sdmg:k.dmg*G.diff.dmg});if(kind==='bolt')snd.monster('bolt',from);};
G.hurtPlayer=(dmg,from,kind)=>{const p=P();if(!p.alive||p.invuln>0||G.god||G.app!=='play')return;let a=0;if(p.armor>0){a=Math.min(p.armor,dmg*.66);p.armor-=a;}const real=dmg-a;p.hp-=real;G.stats.dmgTaken+=dmg;G.stats.dmgBy[kind]=(G.stats.dmgBy[kind]||0)+Math.round(dmg);G.hurtFx=Math.min(1,G.hurtFx+dmg/40);
 if(from){const ang=Math.atan2(from.x-p.pos.x,from.z-p.pos.z);hud.hurt(ang,p.yaw);}snd.hurt(Math.min(1,dmg/30));p.punch+=Math.min(3,dmg*.08);G.shake(Math.min(.5,dmg/60));G.combo=1;
 if(p.hp<=0){p.hp=0;playerDied(kind);}};
G.knockPlayer=(x,y,z)=>{const p=P();p.vel.x+=x;p.vel.y=Math.max(p.vel.y,y);p.vel.z+=z;p.onGround=false;};
G.shockwave=(pos,maxR,life,dmg,src)=>{const gy=L.groundAt(pos.x,pos.z,pos.y+.5);G.shocks.push({x:pos.x,y:gy,z:pos.z,r:0,maxR,v:maxR/life,dmg,hit:false});fx.shock({x:pos.x,y:gy,z:pos.z},0xff7020,maxR,life);fx.sparks.burst(new V(pos.x,gy+.3,pos.z),50,12,[new THREE.Color(3,1.4,.3)],.2,.6,{up:true,grav:10});snd.monster('slam',pos);G.shake(.3);};
G.meteor=(at,delay)=>{const gy=L.groundAt(at.x,at.z,40);if(gy<-20)return;const mark=new THREE.Mesh(new THREE.RingGeometry(2.6,3.2,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:new THREE.Color(3,.6,.1),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));mark.position.set(at.x,gy+.08,at.z);scene.add(mark);G.meteors.push({x:at.x,y:gy,z:at.z,t:0,delay,mark,fired:false});};

/* ================= combat ================= */
const tv=new V(),tv2=new V(),ro={};
function aimDir(out=new V()){const p=P();return out.set(-Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch));}
function raySphere(o,d,c,r,maxT){const ox=o.x-c.x,oy=o.y-c.y,oz=o.z-c.z;const b=ox*d.x+oy*d.y+oz*d.z,cc=ox*ox+oy*oy+oz*oz-r*r;if(cc>0&&b>0)return-1;const disc=b*b-cc;if(disc<0)return-1;const t=-b-Math.sqrt(disc);return t<0?(cc<0?0:-1):t<=maxT?t:-1;}
function traceMonsters(o,d,maxT,all){const hits=[];for(const m of G.monsters){if(!m.alive||m.state==='spawn')continue;const c=m.center(tv2);const big=m.type==='boss'?7:3.5;if(raySphere(o,d,c,big,maxT)<0)continue;let best=null;for(const s of m.spheres()){const t=raySphere(o,d,s.p,s.r,maxT);if(t>=0&&(!best||t<best.t||t-best.t<.15&&s.m>best.m))best={t,m,part:s.part,mult:s.m};}if(best)hits.push(best);}
 hits.sort((a,b)=>a.t-b.t);return all?hits:hits.slice(0,1);}
function muzzleWorld(){const p=P();const d=aimDir(new V());const r=new V(Math.cos(p.yaw),0,-Math.sin(p.yaw));return cam.position.clone().addScaledVector(d,.6).addScaledVector(r,.14).add(new V(0,-.12,0));}
function fire(){const p=P(),w=WPN[p.cur];if(G.time<p.nextFire||p.swapT>0||p.glory)return false;if(p.ammo[w.ammo]<w.use){snd.dry();p.nextFire=G.time+.3;autoSwitch();return false;}
 if(p.cur==='cg'&&p.spin<1)return false;
 p.ammo[w.ammo]-=w.use;p.nextFire=G.time+w.rate;G.stats.shots++;const q=G.quadT>0?4:1;if(q>1)snd.quadShot();
 const eye=cam.position.clone(),dir=aimDir(new V());const up=Math.abs(dir.y)>.95?new V(1,0,0):new V(0,1,0);const rt=new V().crossVectors(dir,up).normalize(),u2=new V().crossVectors(rt,dir).normalize();
 let hitAny=false,crit=false,kill=false;
 if(!w.proj){const n=w.pel||1;const acc=new Map();let spr=w.spr||0;if(p.cur==='cg'){spr=w.spr+p.spread;p.spread=Math.min(w.sprMax,p.spread+.004);}
  for(let i=0;i<n;i++){const a=R()*TAU,r=Math.sqrt(R());const sx=Math.cos(a)*r*spr,sy=Math.sin(a)*r*(w.sprY??spr);const d=new V().copy(dir).addScaledVector(rt,sx).addScaledVector(u2,sy).normalize();
   L.ray(eye.x,eye.y,eye.z,d.x,d.y,d.z,160,ro);const wallT=Math.min(160,ro.t);const hits=traceMonsters(eye,d,wallT,!!w.pierce);
   for(const h of hits){const fall=w.pel?Math.max(.35,1-Math.max(0,h.t-6)/26):1;const e=acc.get(h.m)||{dmg:0,part:'body',mult:1,t:h.t,pt:null};e.dmg+=w.dmg*fall*h.mult*q;if(h.mult>e.mult){e.mult=h.mult;e.part=h.part;}e.pt=eye.clone().addScaledVector(d,h.t);acc.set(h.m,e);}
   const endT=hits.length&&!w.pierce?hits[0].t:wallT;const end=eye.clone().addScaledVector(d,endT);
   if(!hits.length||w.pierce){if(ro.t<160){const n2=new V(ro.nx,ro.ny,ro.nz);if(i%2===0||n<3)fx.impact(end,n2);if(i===0)snd.impact(end);runeHit(ro.i);}}
   if(p.cur==='rg')fx.rail(muzzleWorld(),eye.clone().addScaledVector(d,wallT),w.col);else if(p.cur==='cg'||i<3)fx.streaks.fire(muzzleWorld(),end,0xffd890,{speed:220,len:p.cur==='cg'?3:2,w:.025});}
  for(const[m,e]of acc){const wasAlive=m.alive;m.damage(G,e.dmg,'player',e.part,p.cur==='ssg'&&e.t<5?'ssg':p.cur==='rg'?'rail':'hit',dir);fx.blood(e.pt,dir.clone().negate(),m.def.ichor);hitAny=true;if(e.mult>1)crit=true;if(wasAlive&&!m.alive)kill=true;m.knock.addScaledVector(dir,(w.push||1)*(m.type==='imp'||m.type==='eye'?2.5:m.type==='boss'?0:.6)*(e.dmg/60));}
  if(p.cur==='ssg'&&!p.onGround){p.vel.addScaledVector(dir,-w.push);}}
 else{// projectile weapons aim at the crosshair point
  L.ray(eye.x,eye.y,eye.z,dir.x,dir.y,dir.z,200,ro);const hits=traceMonsters(eye,dir,Math.min(200,ro.t),false);const tgt=eye.clone().addScaledVector(dir,hits.length?hits[0].t:Math.min(200,ro.t));
  const from=muzzleWorld();if(tgt.distanceTo(eye)<2.5)from.copy(eye).addScaledVector(dir,.3);const v=tgt.sub(from).normalize().multiplyScalar(w.speed);
  if(p.cur==='pg'){v.x+=(R()-.5)*.6;v.y+=(R()-.5)*.6;}proj.add(w.proj,'p',from,v,{dmg:w.dmg*q,splash:w.splash,sdmg:w.sdmg*q});}
 if(hitAny){G.stats.hits++;hud.hitmark(kill?'kill':crit?'crit':'');snd.hit(kill?'kill':crit?'crit':'');}
 VM.fire(w.kick,G.time);vmFlash.intensity=p.cur==='pg'?2:6;fx.muzzle(muzzleWorld(),dir,w.col,p.cur==='ssg'?1.6:p.cur==='cg'||p.cur==='pg'?.5:1);snd.shot(p.cur);p.punch+=w.kick*.6;G.shake(p.cur==='ssg'?.18:p.cur==='rl'||p.cur==='rg'?.12:.03);return true;}
function runeHit(i){if(i<0)return;const r=L.runeAt(i);if(r&&!r.opening&&r.open===0){r.opening=true;snd.secret();hud.feed('A SIGIL CRACKS · SECRET OPENING','s');G.shake(.25);}}
function explode(p,kind,radius,dmg,owner){fx.explosion(p,kind==='rocket'||kind==='meteor'||kind==='cannon'?1:.35,kind==='plasma'?0x50d8ff:null);if(kind!=='plasma')snd.boom(p,kind==='rocket'?1:.8);else snd.impact(p,true);
 if(kind==='rocket'||kind==='cannon'||kind==='meteor'){fx.scorch.add(new V(p.x,L.groundAt(p.x,p.z,p.y+.5)+.02,p.z),new V(0,1,0),1);G.shake(Math.max(0,.45-p.distanceTo(P().pos)*.02));}
 // runes near explosions
 if(owner==='p'){const i=L.idx(p.x,p.z);for(const r of L.runes){const[x0,z0,x1,z1]=r.cells;const cx=(x0+x1+1)/2*CS,cz=(z0+z1+1)/2*CS;if(Math.hypot(cx-p.x,cz-p.z)<radius+2&&r.open===0&&!r.opening){runeHit(z0*L.W+x0);}}
  let hitAny=false,kill=false;for(const m of G.monsters){if(!m.alive)continue;const c=m.center(new V());const d=Math.max(0,c.distanceTo(p)-m.def.r*(m.rig.scale||1));if(d>radius)continue;const k=1-d/radius;const wasAlive=m.alive;m.damage(G,dmg*(.35+.65*k),'player','body',kind,c.clone().sub(p).normalize());hitAny=true;if(!m.alive&&wasAlive)kill=true;
   if(m.alive&&m.type!=='boss'){const kv=c.sub(p).normalize().multiplyScalar(k*(m.type==='imp'||m.type==='eye'?9:3));kv.y=Math.abs(kv.y)+k*(m.type==='imp'?5:1.5);m.knock.add(kv);if(m.type==='imp')m.onGround=false;}}
  if(hitAny){hud.hitmark(kill?'kill':'');snd.hit(kill?'kill':'');}}
 // player self-damage + knockback (rocket jumping)
 const pl=P();const pc=new V(pl.pos.x,pl.pos.y+.9,pl.pos.z);const d=pc.distanceTo(p);if(d<radius&&pl.alive){const k=1-d/radius;
  if(owner==='p'){if(kind==='rocket'){const dir=pc.sub(p).normalize();pl.vel.addScaledVector(dir,8*k+2);pl.vel.y=Math.max(pl.vel.y,0)+4.5*k;pl.onGround=false;G.hurtPlayer(dmg*.16*k,null,'self');if(k>.4)G.stats.rocketJumps++;}}
  else G.hurtPlayer(dmg*(.4+.6*k),p,kind);}}
function projHit(pr,dx,dy,dz,len,world){if(world==='world'){if(pr.owner==='p'){if(pr.splash)explode(pr.pos.clone(),pr.kind,pr.splash,pr.sdmg,'p');else{fx.impact(pr.pos.clone(),pr.hitN||new V(0,1,0));}if(pr.hitCell!==undefined)runeHit(pr.hitCell);}
  else{if(pr.splash)explode(pr.pos.clone(),pr.kind,pr.splash,pr.sdmg,'e');else{fx.sparks.burst(pr.pos,10,4,[new THREE.Color(...pr.col)],.12,.3,{grav:6});}}return{t:0};}
 const o=pr.pos,d=tv.set(dx,dy,dz);
 if(pr.owner==='p'){const hits=traceMonsters(o,d,len+pr.r,false);if(!hits.length)return null;const h=hits[0];const at=o.clone().addScaledVector(d,h.t);
  if(pr.splash){h.m.damage(G,pr.dmg*h.mult,'player',h.part,pr.kind,d.clone());explode(at,pr.kind,pr.splash,pr.sdmg,'p');}else{const was=h.m.alive;h.m.damage(G,pr.dmg*h.mult,'player',h.part,pr.kind,d.clone());fx.blood(at,d.clone().negate(),h.m.def.ichor);fx.sparks.burst(at,8,5,[new THREE.Color(.6,2.4,4)],.1,.25);hud.hitmark(!h.m.alive&&was?'kill':h.mult>1?'crit':'');snd.hit(!h.m.alive&&was?'kill':'');}
  G.stats.hits+=pr.kind==='rocket'?1:.25;return{t:h.t};}
 const pl=P();if(!pl.alive)return null;const c=tv2.set(pl.pos.x,pl.pos.y+.95,pl.pos.z);const t=raySphere(o,d,c,.55+pr.r,len);if(t<0)return null;const at=o.clone().addScaledVector(d,t);
 if(pr.splash)explode(at,pr.kind,pr.splash,pr.sdmg,'e');else{G.hurtPlayer(pr.dmg,o,pr.kind);fx.sparks.burst(at,12,5,[new THREE.Color(...pr.col)],.12,.3,{grav:6});}return{t};}

/* ================= kills, combo, drops ================= */
G.onKill=(m,kind,gibbed)=>{if(G.attract)return;const s=G.stats;s.kills++;s.byType[m.type]=(s.byType[m.type]||0)+1;const glory=kind==='glory';if(glory)s.glory++;
 if(G.comboT>0)G.combo=Math.min(6,G.combo+1);else G.combo=1;G.comboT=3;const pts=Math.round((m.def.score+(glory?150:0))*G.combo);G.score+=pts;
 hud.feed(`${glory?'FINISHED ':''}${m.def.name} +${pts}`,'k');snd.monster(gibbed?'gib':'die',m.pos);
 const c=m.center(new V());const p=P();
 if(glory){const n=p.hp<40?7:4;for(let i=0;i<n;i++)drop('orb',c);if(p.armor<50)for(let i=0;i<2;i++)drop('aorb',c);for(let i=0;i<2;i++)ammoDrop(c);}
 else{if(R()<.35)ammoDrop(c);if(R()<.15)drop('shard',c);if(m.type==='brute'||m.type==='charger'){ammoDrop(c);drop('orb',c);}}
 if(m.type==='boss'){G.bossDead=true;G.slowT=1.3;fx.explosion(c,3);G.shake(1);hud.banner('COLOSSUS FALLEN','THE PYRE GOES COLD','#ffd04a',4);}};
function drop(kind,c){items.add(kind,new V(c.x,c.y,c.z),{vel:new V((R()-.5)*6,4+R()*4,(R()-.5)*6),life:14});}
function ammoDrop(c){const p=P();const own=ORDER.filter(id=>p.weapons[id]&&id!=='sg').concat(['sg']);const id=own[(R()*own.length)|0];drop(WPN[id].ammo,c);}
G.onStagger=(m)=>{snd.stagger();};
function take(it,dry){const p=P(),k=it.kind;
 const ok=k==='hp'||k==='orb'?p.hp<100:k==='mega'?p.hp<200:k==='armor'?p.armor<150:k==='megaarmor'?p.armor<200:k==='shard'||k==='aorb'?p.armor<200:k==='quad'?true:k==='weapon'?(!p.weapons[it.w.id]||p.ammo[WPN[it.w.id].ammo]<AMMO[WPN[it.w.id].ammo].max):AMMO[k]?p.ammo[k]<AMMO[k].max:true;
 if(dry||!ok)return ok;
 let msg='';if(k==='hp'){p.hp=Math.min(100,p.hp+25);msg='+25 HEALTH';}else if(k==='orb'){p.hp=Math.min(100,p.hp+8);}else if(k==='mega'){p.hp=Math.min(200,p.hp+100);msg='MEGA HEALTH';}else if(k==='armor'){p.armor=Math.min(150,p.armor+50);msg='+50 ARMOUR';}
 else if(k==='megaarmor'){p.armor=200;msg='HEAVY ARMOUR';}else if(k==='shard'){p.armor=Math.min(200,p.armor+5);}else if(k==='aorb'){p.armor=Math.min(200,p.armor+6);}else if(k==='quad'){G.quadT=20;msg='QUAD DAMAGE';hud.banner('QUAD DAMAGE','20 SECONDS · ×4','#c070ff',1.6);}
 else if(k==='weapon'){const id=it.w.id;const had=p.weapons[id];p.weapons[id]=true;for(const a in GIVE[id])p.ammo[a]=Math.min(AMMO[a].max,p.ammo[a]+GIVE[id][a]);if(!had){equip(id);msg=WPN[id].name;hud.banner(WPN[id].name,'PRESS '+WPN[id].slot+' · '+WPN[id].ammo.toUpperCase(),'#ffb040',1.6);}else msg='+'+WPN[id].ammo.toUpperCase();}
 else if(AMMO[k]){p.ammo[k]=Math.min(AMMO[k].max,p.ammo[k]+AMMO[k].pick*(it.placed?1:.5)|0);msg=it.placed?'+'+k.toUpperCase():'';}
 snd.pickup(k==='weapon'?'weapon':k);if(msg)hud.feed(msg,'p');return true;}

/* ================= weapons switching ================= */
function equip(id,force){const p=P();if(!p.weapons[id])return;if(p.cur===id&&!force)return;if(p.cur!==id)p.prev=p.cur;p.cur=id;p.swapT=.16;p.spin=0;p.spread=0;VM&&VM.set(id);if(!force)snd.swap();}
function autoSwitch(){const p=P();const pref=['ssg','rl','pg','cg','sg','rg'];for(const id of pref){const w=WPN[id];if(p.weapons[id]&&p.ammo[w.ammo]>=w.use&&id!==p.cur){equip(id);return;}}}
function cycle(dir){const p=P();const own=ORDER.filter(id=>p.weapons[id]);let i=own.indexOf(p.cur);i=(i+dir+own.length)%own.length;equip(own[i]);}

/* ================= glory kills + melee ================= */
function findGlory(){const p=P();if(!p.alive||p.glory)return null;let best=null,bd=1e9;const f=new V(-Math.sin(p.yaw),0,-Math.cos(p.yaw));
 for(const m of G.monsters){if(!m.alive||!m.staggered)continue;const dx=m.pos.x-p.pos.x,dz=m.pos.z-p.pos.z,dy=m.pos.y-p.pos.y,d=Math.hypot(dx,dz);const reach=m.type==='boss'?7.5:m.type==='brute'?4.6:4.2;if(d>reach||Math.abs(dy)>(m.def.fly?5:2.5))continue;const dot=(dx*f.x+dz*f.z)/(d||1);if(dot<.25&&d>1.8)continue;if(d<bd){bd=d;best=m;}}return best;}
function melee(){const p=P();if(!p.alive||p.glory||p.meleeCD>0)return;const g=findGlory();if(g){p.glory={m:g,t:0,from:p.pos.clone(),done:false};p.invuln=1;VM.punch(true);snd.glory();G.gloryFx=1;return;}
 p.meleeCD=.55;VM.punch(false);const eye=cam.position.clone(),d=aimDir(new V());const h=traceMonsters(eye,d,2.6,false)[0];if(h){h.m.damage(G,35*(G.quadT>0?4:1),'player',h.part,'melee',d);h.m.knock.addScaledVector(d,h.m.type==='imp'||h.m.type==='eye'?10:2);hud.hitmark(h.m.alive?'':'kill');snd.hit('kill');G.shake(.15);}else snd.dash();}
function stepGlory(dt){const p=P(),gl=p.glory;gl.t+=dt;const m=gl.m;const tgt=m.pos.clone();const dx=tgt.x-gl.from.x,dz=tgt.z-gl.from.z,d=Math.hypot(dx,dz)||1;const stop=m.type==='boss'?4.5:m.type==='brute'?2.2:1.4;
 const k=Math.min(1,gl.t/.22);const ek=1-Math.pow(1-k,3);p.pos.x=gl.from.x+dx/d*Math.max(0,d-stop)*ek;p.pos.z=gl.from.z+dz/d*Math.max(0,d-stop)*ek;if(!m.def.fly)p.pos.y=Math.max(p.pos.y,L.groundAt(p.pos.x,p.pos.z,p.pos.y+1,MV.r));p.vel.set(0,0,0);
 const want=Math.atan2(-(tgt.x-p.pos.x),-(tgt.z-p.pos.z));let dy=((want-p.yaw+Math.PI*3)%TAU)-Math.PI;p.yaw+=dy*Math.min(1,dt*18);const ch=m.center(new V());p.pitch+=(Math.atan2(ch.y-(p.pos.y+MV.eye),Math.max(1,d-stop))-p.pitch)*Math.min(1,dt*14);
 if(gl.t>.26&&!gl.done){gl.done=true;if(m.alive){m.damage(G,1e6,'player','body','glory',aimDir(new V()));if(m.alive)m.die(G,null,'glory',true);}G.hitstop=.09;G.shake(.6);fx.flash(ch,0xffa040,60,14);}
 if(gl.t>.42){p.glory=null;p.invuln=.35;}}

/* ================= player movement ================= */
const keys={},mouse={l:false,r:false,dx:0,dy:0};let locked=false,wheelOpen=false,wheelSel=null,wheelV={x:0,y:0},jumpEdge=false,dashEdge=false;
function accelerate(v,wd,ws,acc,dt,cap){const cur=v.x*wd.x+v.z*wd.z;const add=(cap??ws)-cur;if(add<=0)return;let a=acc*ws*dt;if(a>add)a=add;v.x+=a*wd.x;v.z+=a*wd.z;}
function movePlayer(dt,input){const p=P(),v=p.vel;const sy=Math.sin(p.yaw),cy=Math.cos(p.yaw);let wx=-sy*input.f+cy*input.s,wz=-cy*input.f-sy*input.s;const wl=Math.hypot(wx,wz);if(wl>0){wx/=wl;wz/=wl;}const wd={x:wx,z:wz};
 // dash
 p.dashCD=Math.max(0,p.dashCD-dt);if(p.dashes<2&&p.dashCD<=0){p.dashes++;if(p.dashes<2)p.dashCD=p.dashRe;}
 if(input.dash&&p.dashes>0){const d=wl>0?new V(wx,0,wz):new V(-sy,0,-cy);const along=v.x*d.x+v.z*d.z;const sp=Math.max(MV.dash,along+6);v.x=d.x*sp;v.z=d.z*sp;v.y=Math.max(v.y,.5);p.dashT=MV.dashT;p.dashes--;if(p.dashCD<=0)p.dashCD=p.dashRe;snd.dash();p.dashDir.copy(d);fx.smoke.burst(new V(p.pos.x,p.pos.y+.4,p.pos.z),6,2,new THREE.Color(.5,.45,.42),.6,.5,{drag:3,grow:1,alpha:.4});}
 const coyote=!p.onGround&&p.airT<.12&&!p.jumped&&v.y<=1;if(p.onGround||coyote&&input.jumpEdge){if(input.jumpEdge||input.hold&&input.jump){v.y=MV.jump;p.onGround=false;p.dbl=false;p.jumped=true;snd.jump(false);p.airT=0;}
  else{const sp=Math.hypot(v.x,v.z);if(sp>0){const drop=Math.max(sp,MV.stop)*MV.friction*dt;const ns=Math.max(0,sp-drop)/sp;v.x*=ns;v.z*=ns;}accelerate(v,wd,wl>0?MV.ground:0,MV.accel,dt);}}
 else{if(wl>0)accelerate(v,wd,MV.ground,MV.airAccel,dt,MV.airCap);p.airT+=dt;
  if(input.jumpEdge&&!p.dbl&&(p.airT>.06||p.jumped)){p.dbl=true;v.y=Math.max(v.y,MV.djump);if(wl>0){const sp=Math.hypot(v.x,v.z);const nx=v.x/(sp||1)*.6+wx*.4,nz=v.z/(sp||1)*.6+wz*.4,nl=Math.hypot(nx,nz)||1;v.x=nx/nl*sp;v.z=nz/nl*sp;}snd.jump(true);fx.rings.add({x:p.pos.x,y:p.pos.y-.1,z:p.pos.z},0xffc070,.3,1.4,.3);}}
 const hs=Math.hypot(v.x,v.z);if(hs>MV.max){v.x*=MV.max/hs;v.z*=MV.max/hs;}
 if(p.dashT>0){p.dashT-=dt;v.y=Math.max(v.y,0);}else v.y-=MV.grav*dt;
 const was=p.onGround;const res=L.move(p.pos,v,dt,MV.r,p.onGround,STEP);
 if(res.landed){p.jumped=false;if(!was){const imp=res.impact||0;if(imp>4){snd.land(Math.min(1,imp/16));p.landDip=Math.min(.35,imp*.018);}p.dbl=false;p.airT=0;}p.onGround=true;}else if(p.onGround&&p.pos.y>res.ground+.06)p.onGround=false;else if(!res.landed)p.onGround=false;
 if(res.stepped>0&&p.onGround)p.stepDip=(p.stepDip||0)+res.stepped;
 if(p.onGround&&!L.isLava(p.pos.x,p.pos.z)&&!L.isVoid(p.pos.x,p.pos.z)&&res.ground>-1)p.lastSafe.copy(p.pos);}
function readInput(){const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);const inp={f,s,jump:!!keys.Space,hold:!!keys.Space,jumpEdge:jumpEdge,dash:dashEdge};jumpEdge=false;dashEdge=false;
 const p=P();const sens=.0022*G.opt.sens;if(locked&&!wheelOpen){p.yaw-=mouse.dx*sens;p.pitch=cl(p.pitch-mouse.dy*sens,-1.5,1.5);}if(wheelOpen){wheelV.x+=mouse.dx;wheelV.y+=mouse.dy;const l=Math.hypot(wheelV.x,wheelV.y);if(l>70){wheelV.x*=70/l;wheelV.y*=70/l;}if(l>25){let a=Math.atan2(wheelV.y,wheelV.x)+Math.PI/2;a=(a+TAU+Math.PI/6)%TAU;wheelSel=ORDER[Math.floor(a/(TAU/6))%6];}hud.wheel(true,wheelSel);}
 VM.mdx=mouse.dx;VM.mdy=mouse.dy;mouse.dx=mouse.dy=0;
 const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.18?v:0;const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);if(lx||ly){inp.f=-ly;inp.s=lx;}p.yaw-=rx*.045*G.opt.sens;p.pitch=cl(p.pitch-ry*.035*G.opt.sens,-1.5,1.5);
  const pr=G.pad||{};const btn=i=>bt[i]&&(bt[i].pressed||bt[i].value>.4);if(btn(0)){inp.jump=inp.hold=true;if(!pr.a)inp.jumpEdge=true;}if(btn(4)&&!pr.lb)inp.dash=true;if(btn(7))mouse.pad=true;else mouse.pad=false;if(btn(2)&&!pr.x)melee();if(btn(3)&&!pr.y)cycle(1);if(btn(5)&&!pr.rb)cycle(1);if(btn(9)&&!pr.st)pause(true);
  G.pad={a:btn(0),lb:btn(4),x:btn(2),y:btn(3),rb:btn(5),st:btn(9)};}
 return inp;}

/* ================= main step ================= */
let shake=0,acc=0;
function step(dt){dt=Math.min(dt,.1);if(G.app==='paused'){visuals(0);return;}
 if(G.hitstop>0){G.hitstop-=dt;visuals(dt*.1);return;}
 if(G.slowT>0){G.slowT-=dt;G.timeScale=G.slowT>0?.3:1;}const sdt=dt*(wheelOpen?.25:1)*G.timeScale;G.time+=sdt;
 if(G.app==='play')playStep(sdt,dt);else if(G.app==='menu'){for(const m of G.monsters)m.update(sdt,G);for(let i=G.monsters.length-1;i>=0;i--)if(G.monsters[i].gone){scene.remove(G.monsters[i].root);G.monsters.splice(i,1);}}
 else if(G.app==='over'){for(const m of G.monsters)if(!m.alive)m.update(sdt,G);}
 proj.update(G.app==='play'?sdt:sdt,L,fx,projHit);fx.update(sdt,scene.fog);world.update(sdt,fx);if(items)items.update(G.app==='play'?sdt:0,G,G.app==='play'?take:()=>false);
 visuals(sdt);}
function playStep(dt,rdt){const p=P();const inp=readInput();
 if(G.app!=='play')return;
 G.clock-=dt;G.arenaT+=dt;G.stats.time+=dt;if(G.clock<=0){G.clock=0;endRun('time');return;}
 G.comboT=Math.max(0,G.comboT-dt);if(G.comboT<=0)G.combo=1;if(G.quadT>0)G.quadT=Math.max(0,G.quadT-dt);G.hurtFx=Math.max(0,G.hurtFx-dt*1.6);G.gloryFx=Math.max(0,G.gloryFx-dt*3);p.invuln=Math.max(0,p.invuln-dt);p.meleeCD=Math.max(0,p.meleeCD-dt);p.swapT=Math.max(0,p.swapT-dt);
 // movement at fixed sub-steps
 if(p.alive&&!p.glory){acc+=dt;let n=0;let first=true;while(acc>=DT&&n<14){movePlayer(DT,first?inp:{...inp,jumpEdge:false,dash:false});first=false;acc-=DT;n++;}if(n>=14)acc=0;if(n===0){/* keep edges for next frame */if(inp.jumpEdge)jumpEdge=true;if(inp.dash)dashEdge=true;}}
 else if(p.glory)stepGlory(dt);
 if(!p.alive){G.deathT=(G.deathT||0)+dt;p.vel.y-=MV.grav*dt;L.move(p.pos,p.vel,dt,MV.r,p.onGround);if(G.deathT>2.4){endRun('dead');return;}}
 p.eye.set(p.pos.x,p.pos.y+MV.eye,p.pos.z);const hs=Math.hypot(p.vel.x,p.vel.z);G.stats.topSpeed=Math.max(G.stats.topSpeed,hs);
 // hazards + map features
 p.padCD=Math.max(0,p.padCD-dt);p.teleCD=Math.max(0,p.teleCD-dt);
 if(p.alive){
  for(const pd of world.pads){if(p.padCD<=0&&Math.hypot(p.pos.x-pd.x,p.pos.z-pd.z)<1.15&&Math.abs(p.pos.y-pd.y)<.6){launch(p,pd);}}
  for(const tp of world.teles){if(p.teleCD<=0&&Math.hypot(p.pos.x-tp.x,p.pos.z-tp.z)<1.1&&Math.abs(p.pos.y-tp.y)<1.6){teleport(p,tp);}}
  if(L.isLava(p.pos.x,p.pos.z)&&p.pos.y<.05){p.lavaT-=dt;G.lavaFx=Math.min(.8,G.lavaFx+dt*3);if(p.lavaT<=0){p.lavaT=.45;G.hurtPlayer(5.5*(G.diff.dmg*.35+.65),null,'lava');snd.lava();fx.sparks.burst(new V(p.pos.x,p.pos.y,p.pos.z),14,4,[new THREE.Color(3,1.2,.2)],.15,.5,{up:true,grav:6});}}else{G.lavaFx=Math.max(0,G.lavaFx-dt*2);p.lavaT=Math.min(p.lavaT,.15);}
  if(p.pos.y<-14){G.hurtPlayer(20,null,'void');if(p.alive){p.pos.copy(p.lastSafe);p.vel.set(0,0,0);fx.spawnPortal(p.pos,0x50ffa0);snd.tele();hud.feed('THE VOID SPITS YOU BACK','s');}}
  L.def.secrets.forEach(s=>{if(!s._found&&L.inCells(p.pos.x,p.pos.z,s.cells)&&p.pos.y>L.visTop(p.pos.x,p.pos.z)-.6){s._found=true;G.stats.secrets++;G.score+=500;hud.banner('SECRET FOUND',G.stats.secrets+' OF '+G.stats.secretsTotal+' · +500','#ffd04a',2);snd.secret();}});
  if(G.exit&&Math.hypot(p.pos.x-G.exit.x,p.pos.z-G.exit.z)<1.7&&Math.abs(p.pos.y-G.exit.y)<2.5){G.exit=null;snd.tele();if(G.arenaIdx<2)enterArena(G.arenaIdx+1);return;}}
 // weapons
 G.gloryTarget=findGlory();
 if(p.alive&&!p.glory){const w=WPN[p.cur];const wantFire=(mouse.l&&locked&&!wheelOpen)||mouse.pad||G.autoFire;
  if(p.cur==='cg'){const was=p.spin;p.spin=wantFire&&p.ammo.bullets>0?Math.min(1,p.spin+dt/w.spin):Math.max(0,p.spin-dt*1.5);VM.spinUp(p.spin);if(was===0&&p.spin>0)snd.spin(true);}else VM.spinUp(0);
  if(!wantFire)p.spread=Math.max(0,p.spread-dt*.08);
  if(wantFire)fire();}
 // flow fields + monsters
 G.flowT-=dt;if(G.flowT<=0||!G.flowWalk){G.flowT=.3;G.flowWalk=L.flow(p.pos.x,p.pos.z,.6).slice();G.flowLeap=L.flow(p.pos.x,p.pos.z,3.3).slice();}
 if(!G.idle)for(const m of G.monsters)m.update(dt,G);else for(const m of G.monsters){if(!m.alive)m.update(dt,G);else{m.root.position.copy(m.pos);if(m.state==='spawn'){m.state='chase';m.root.scale.setScalar(m.rig.scale||1);}}}
 for(let i=G.monsters.length-1;i>=0;i--)if(G.monsters[i].gone){scene.remove(G.monsters[i].root);G.monsters.splice(i,1);}
 // shockwaves + meteors
 for(let i=G.shocks.length-1;i>=0;i--){const s=G.shocks[i];const r0=s.r;s.r+=s.v*dt;if(s.r>s.maxR){G.shocks.splice(i,1);continue;}const d=Math.hypot(p.pos.x-s.x,p.pos.z-s.z);if(!s.hit&&d>=r0-.6&&d<=s.r+.6&&p.pos.y<s.y+.55){s.hit=true;G.hurtPlayer(s.dmg,new V(s.x,s.y,s.z),'shock');G.knockPlayer((p.pos.x-s.x)/(d||1)*6,7,(p.pos.z-s.z)/(d||1)*6);}}
 for(let i=G.meteors.length-1;i>=0;i--){const m=G.meteors[i];m.t+=dt;m.mark.material.color.setRGB(3,.6*(1+Math.sin(m.t*20)),.1);m.mark.scale.setScalar(1-Math.min(.6,m.t/m.delay*.6));if(!m.fired&&m.t>m.delay-.9){m.fired=true;const from=new V(m.x+8,m.y+26,m.z+4);const d=new V(m.x,m.y,m.z).sub(from).normalize().multiplyScalar(30);proj.add('meteor','e',from,d,{dmg:EK.meteor.dmg*G.diff.dmg,splash:EK.meteor.splash,sdmg:EK.meteor.dmg*G.diff.dmg});}if(m.t>m.delay+.4){scene.remove(m.mark);G.meteors.splice(i,1);}}
 // waves
 G.phaseT-=dt;if(G.phase==='intro'&&G.phaseT<=0)nextWave();else if(G.phase==='break'&&G.phaseT<=0)nextWave();
 else if(G.phase==='fight'||G.phase==='boss'){G.spawnT-=dt;const alive=G.monsters.filter(m=>m.alive).length;if(G.toSpawn.length&&G.spawnT<=0&&alive<G.diff.alive){G.spawnT=G.phase==='boss'?.2:.55+R()*.5;spawn(G.toSpawn.shift());}
  if(!G.toSpawn.length&&alive===0&&G.spawnT<=0&&!G.monsters.some(m=>m.state==='spawn')){if(G.phase==='boss'||G.bossDead){if(G.mode==='camp'){G.phase='won';G.phaseT=3;}else{G.bossDead=false;waveCleared();}}else waveCleared();}}
 else if(G.phase==='won'&&G.phaseT<=0){endRun('win');return;}
 if(G.exitMesh){G.exitMesh.userData.disc.rotation.z+=dt*2;G.exitMesh.userData.ring.rotation.z-=dt;}}
function launch(p,pd){const g=MV.grav;const apex=Math.max(p.pos.y,pd.to.y)+2.6;const vy=Math.sqrt(2*g*(apex-p.pos.y));const t=vy/g+Math.sqrt(2*Math.max(.01,apex-pd.to.y)/g);p.vel.set((pd.to.x-p.pos.x)/t,vy,(pd.to.z-p.pos.z)/t);p.onGround=false;p.padCD=.6;p.dbl=false;p.airT=.1;pd.pulse=1;snd.pad();fx.rings.add({x:pd.x,y:pd.y,z:pd.z},new THREE.Color(...world.M.ember).getHex(),.4,2.2,.4);}
function teleport(p,tp){fx.spawnPortal(p.pos,0xffffff);const sp=Math.hypot(p.vel.x,p.vel.z);p.pos.set(tp.to.x,tp.to.y+.05,tp.to.z);p.yaw=tp.yaw;p.vel.set(-Math.sin(p.yaw)*sp,0,-Math.cos(p.yaw)*sp);p.teleCD=1;fx.spawnPortal(p.pos,0xffffff);snd.tele();G.gloryFx=.6;
 for(const m of G.monsters)if(m.alive&&Math.hypot(m.pos.x-p.pos.x,m.pos.z-p.pos.z)<1.6&&m.type!=='boss'){m.die(G,null,'telefrag',true);hud.feed('TELEFRAG','k');}}
function playerDied(kind){const p=P();p.alive=false;p.hp=0;snd.death();hud.banner('SLAIN',kind==='lava'?'THE MAGMA TOOK YOU':kind==='void'?'LOST TO THE VOID':'THE ARENA CLAIMS ANOTHER','#ff3a2a',3);G.deathT=0;}

/* ================= end + scoring ================= */
let lastAward=null;
function rankOf(score,won,reason){const T=G.mode==='camp'?[30000,21000,13000,6000]:[20000,13000,8000,3500];const dm=[.8,1,1.25][G.opt.diff];let r=score>=T[0]*dm?'S':score>=T[1]*dm?'A':score>=T[2]*dm?'B':score>=T[3]*dm?'C':'D';if(reason==='dead'&&(r==='S'||r==='A'))r='B';return r;}
function endRun(reason){if(G.app!=='play')return;const p=P();G.app='over';unlock();wheelOpen=false;hud.wheel(false);hud.show(false);document.body.classList.remove('playing');
 const won=reason==='win'||(G.mode==='endless'&&reason==='time'&&p.alive);if(reason==='win'){G.score+=Math.round(G.clock*5)+Math.round(p.hp*10)+Math.round(p.armor*5);}if(G.mode==='endless'&&reason==='time')G.score+=Math.round(p.hp*10);
 const s=G.stats;const rank=rankOf(G.score,won,reason);G.result={reason,won,rank,score:G.score};
 $('oeye').textContent=(G.mode==='camp'?'CAMPAIGN · ':'ENDLESS · '+L.def.name+' · ')+G.diff.n+' HEAT · '+mmss(s.time);
 $('ores').textContent=reason==='win'?'PYRE EXTINGUISHED':reason==='dead'?'SLAIN':G.mode==='endless'?'SURVIVED':'TIME UP';$('ores').style.color=won?'#ffd04a':reason==='dead'?'#ff5a3a':'#ddd';
 $('ofs').textContent=G.score.toLocaleString()+' PTS';$('orank').textContent=rank;$('orank').style.color={S:'#ffd04a',A:'#ff8a3d',B:'#ff4d00',C:'#c8a8a0',D:'#8a8380'}[rank];
 const acc=s.shots?Math.round(Math.min(1,s.hits/s.shots)*100):0;
 const rows=[['ARENAS CLEARED',G.mode==='camp'?s.arenas+' / 3':'—'],['WAVES SURVIVED',s.waves],['KILLS',s.kills+(s.kills?'  ('+Object.entries(s.byType).map(([k,v])=>v+' '+MON[k].name.split(' ').pop()).join(' · ')+')':'')],['FINISHERS',s.glory],['SECRETS',s.secrets+' / '+s.secretsTotal],['ACCURACY',acc+'%'],['DAMAGE TAKEN',Math.round(s.dmgTaken)],['TOP SPEED',s.topSpeed.toFixed(1)+' M/S'+(s.rocketJumps?' · '+s.rocketJumps+' ROCKET JUMPS':'')],['TIME',mmss(s.time)]];
 $('stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
 const tok=award(won,rank);$('otok').textContent=`+${tok} TOKENS · BEST ${best().toLocaleString()} PTS`;$('over').hidden=false;snd.music(0);}
function award(won,rank){const pts=G.score;lastAward={pts,won,rank,mode:G.mode,diff:G.diff.n,kills:G.stats.kills,secrets:G.stats.secrets,arena:L.def.name};const tok=5+Math.min(60,pts/500|0);
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'strike3d';if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'strike3d')||0);}catch(e){return 0;}}
function updateBest(){const b=best();$('best').textContent=b?'BEST · '+b.toLocaleString()+' PTS':'';}

/* ================= input ================= */
function lock(){if(G.app!=='play')return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='play')pause(true);});
canvas.addEventListener('mousedown',e=>{if(G.app==='play'&&!locked){lock();}});
addEventListener('mousedown',e=>{if(G.app!=='play'||!locked)return;if(e.button===0)mouse.l=true;if(e.button===2)melee();if(e.button===1){e.preventDefault();openWheel(true);}});
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===1)openWheel(false);});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(!locked)return;mouse.dx+=e.movementX;mouse.dy+=e.movementY;});
addEventListener('wheel',e=>{if(G.app!=='play'||!locked||wheelOpen)return;cycle(e.deltaY>0?1:-1);},{passive:true});
function openWheel(on){if(on&&!wheelOpen){wheelOpen=true;wheelSel=P().cur;wheelV.x=wheelV.y=0;hud.wheel(true,wheelSel);}else if(!on&&wheelOpen){wheelOpen=false;hud.wheel(false);if(wheelSel&&P().weapons[wheelSel])equip(wheelSel);}}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];keys[e.code]=true;if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='paused')pause(false);else if(G.app==='play')pause(true);return;}if(G.app!=='play'||!first)return;
 if(e.code==='Space')jumpEdge=true;if(e.code==='ShiftLeft'||e.code==='ShiftRight')dashEdge=true;
 if(e.code.startsWith('Digit')){const n=+e.code.slice(5);if(n>=1&&n<=6)equip(ORDER[n-1]);}
 if(e.code==='KeyQ')equip(P().prev);if(e.code==='KeyF'||e.code==='KeyE'||e.code==='KeyV')melee();if(e.code==='Tab')openWheel(true);});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Tab')openWheel(false);});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=false;});
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlock();openWheel(false);}else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= visuals: camera + viewmodel ================= */
let orbitA=0;
function visuals(dt){const p=P();shake=Math.max(0,shake-dt*2.2);
 if(G.app==='menu'||G.app==='over'){orbitA+=dt*.06;const c=L.P([L.W/2,L.H/2]);const rad=Math.max(L.W,L.H)*CS*.42;cam.position.set(c.x+Math.cos(orbitA)*rad,9+Math.sin(orbitA*.7)*2,c.z+Math.sin(orbitA)*rad);cam.lookAt(c.x,1.5,c.z);cam.fov=60;cam.updateProjectionMatrix();if(VM)VM.root.visible=false;snd.listener(cam.position.x,cam.position.y,cam.position.z,0);return;}
 p.landDip=Math.max(0,p.landDip-dt*1.2);p.stepDip=Math.max(0,(p.stepDip||0)-dt*4);p.punch*=Math.exp(-dt*8);
 const sp=Math.hypot(p.vel.x,p.vel.z);const bob=p.onGround?Math.sin(G.time*sp*1.1)*Math.min(1,sp/9)*.035:0;
 const strafe=(p.vel.x*Math.cos(p.yaw)-p.vel.z*Math.sin(p.yaw))/12;p.roll+=(cl(-strafe*.025,-.03,.03)-p.roll)*Math.min(1,dt*8);
 const eyeY=p.pos.y+MV.eye-p.landDip-Math.min(.3,p.stepDip)+bob+(p.alive?0:-1.2);cam.position.set(p.pos.x,eyeY,p.pos.z);const s=shake*shake*.18;
 cam.rotation.set(p.pitch+p.punch*.012+(R()-.5)*s,p.yaw+(R()-.5)*s,p.roll+(p.alive?0:.5));
 const aspect=innerWidth/innerHeight;const hf=G.opt.fov+Math.min(10,Math.max(0,sp-10)*.5);cam.fov=2*Math.atan(Math.tan(hf*Math.PI/360)/aspect)*180/Math.PI;cam.updateProjectionMatrix();
 snd.listener(cam.position.x,cam.position.y,cam.position.z,p.yaw);
 if(VM){const w=WPN[p.cur];VM.update({dt,mdx:VM.mdx||0,mdy:VM.mdy||0,speed:sp,onGround:p.onGround,airborne:!p.onGround,vy:p.vel.y,strafe,t:G.time,ammoFrac:p.ammo[w.ammo]/AMMO[w.ammo].max,visible:p.alive});}
 vmFlash.intensity*=Math.exp(-dt*30);}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM||!VM.root.visible||G.app!=='play'&&G.app!=='paused')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;Rr.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.15:.85));fxStack=null;fxSize='';if(world){world.sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(world.sun.shadow.map){world.sun.shadow.map.dispose();world.sun.shadow.map=null;}}Rr.shadowMap.needsUpdate=true;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(Rr.domElement.width!==Math.floor(w*Rr.getPixelRatio())||Rr.domElement.height!==Math.floor(h*Rr.getPixelRatio()))Rr.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();const sc=h*Rr.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));fx.sparks.U.uScale.value=fx.smoke.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<3)Rr.shadowMap.needsUpdate=true;
 const M=world.M;const key=w+'x'+h;if(!fxStack){fxStack=cinematic(Rr,scene,cam,{exposure:M.exp,bloom:M.bloom,bloomThreshold:M.thr,bloomRadius:.55,saturation:M.sat,tint:M.tint,vignette:.4,grain:.035,aoStrength:.8,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade){const p=P();const hp=G.app==='play'&&p.alive?Math.min(1,p.hp/60):1;fxStack.grade.uniforms.sat.value=M.sat*(.45+.55*hp);}
 if(fxStack.composer)fxStack.render();else{Rr.autoClear=true;Rr.render(scene,cam);if(VM&&VM.root.visible&&G.app==='play'){Rr.autoClear=false;Rr.clearDepth();Rr.render(vmScene,vmCam);Rr.autoClear=true;}}}

/* ================= HUD + menus ================= */
const hud=new HUD(G);G.hud=hud;G.snd=snd;
function saveOpt(){try{localStorage.setItem('pxd_strike_opt',JSON.stringify(G.opt));}catch(e){}}
const seg=(id,key,num=true,cb)=>{const el=$(id);const set=(v,init)=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(num?+b.dataset.v:b.dataset.v)===String(v)));if(!init){saveOpt();cb&&cb(v);}};set(G.opt[key],true);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(num?+b.dataset.v:b.dataset.v));};
seg('o-mode','mode',false,()=>{$('o-arena').classList.toggle('dim',G.opt.mode==='camp');if(G.app==='menu')attractMode();});seg('o-arena','arena',true,()=>{if(G.app==='menu')attractMode();});seg('o-diff','diff');
seg('o-sens','sens');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-mus','mus',true,v=>snd.setMusic(v));seg('o-fov','fov');$('o-arena').classList.toggle('dim',G.opt.mode==='camp');
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Strike Zone\nScore: ${a.pts||0}\nRank: ${a.rank||'-'} · ${a.won?'win':'loss'}\nMode: ${a.mode==='camp'?'campaign':'endless · '+(a.arena||'')} · Heat ${a.diff||''}\nKills: ${a.kills||0} · Secrets: ${a.secrets||0}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] strike3d '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= boot + loop ================= */
VM=buildViewmodel(makeTextures('ash'));vmCam.add(VM.root);VM.set('sg');
attractMode();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{step(dt);if(G.app==='play'||G.app==='paused')hud.update(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.STRIKE={get state(){return G.app;},get app(){return G.app;},G,get P(){return G.player;},get player(){return G.player;},get monsters(){return G.monsters;},get enemies(){return G.monsters;},get wave(){return G.wave;},get phase(){return G.phase;},get L(){return L;},
 step,render,start,toMenu,pause,deploy:o=>start(o),endRun,hud:()=>hud,fx:()=>fx,scene,cam,R:Rr,
 set matchT(v){G.clock=v;},setClock(s){G.clock=s;},setIdle(v=true){G.idle=v;},god(v=true){G.god=v;},setQuality:applyQuality,get gfx(){return gfx;},
 fire:()=>fire(),melee,equip,give(id){const p=P();p.weapons[id]=true;for(const a in GIVE[id])p.ammo[a]=AMMO[a].max;equip(id);},
 spawn:(type,x,z,y)=>spawn(type,x!==undefined?new V(x,y??L.groundAt(x,z,40),z):null),
 killAll(kind='hit'){for(const m of G.monsters)if(m.alive)m.die(G,null,kind,true);G.toSpawn.length=0;},
 clearWave(){G.toSpawn.length=0;for(const m of G.monsters)if(m.alive)m.die(G,null,'hit',true);},
 damagePlayer(n){G.hurtPlayer(n,null,'test');},teleport(x,z,y){const p=P();p.pos.set(x,y??L.groundAt(x,z,40),z);p.vel.set(0,0,0);},look(yaw,pitch=0){const p=P();p.yaw=yaw;p.pitch=pitch;},
 aimAt(m){const p=P();const t=m.center?m.center(new V()):m.g.position.clone().add(new V(0,1.2,0));const dx=t.x-p.pos.x,dz=t.z-p.pos.z,dy=t.y-(p.pos.y+MV.eye);p.yaw=Math.atan2(-dx,-dz);p.pitch=Math.atan2(dy,Math.hypot(dx,dz));cam.position.set(p.pos.x,p.pos.y+MV.eye,p.pos.z);cam.rotation.set(p.pitch,p.yaw,0);cam.updateMatrixWorld();},
 stagger(m){m.hp=Math.min(m.hp,m.hpMax*m.def.stagger*.9);m.staggered=true;m.wasStaggered=true;m.stagger=3;m.state='stagger';},
 nextArena(){if(G.phase!=='clear'){G.toSpawn.length=0;for(const m of G.monsters)if(m.alive)m.die(G,null,'hit',true);G.wave=G.waveMax;arenaClear();}const e=G.exit;if(e){const p=P();p.pos.set(e.x,e.y,e.z);}},
 keys,mouse,input:{jump(){jumpEdge=true;},dash(){dashEdge=true;}},MV,VM:()=>VM,snd,proj:()=>proj,items:()=>items,world:()=>world};
