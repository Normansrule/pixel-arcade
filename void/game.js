// VOIDWING — cockpit starfighter combat: 5v5 squadron dogfights and fleet battles against capital ships. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {addRound,bestScore,saveBest,userName} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,toast as note} from '../js/kit3d/ui.js';
import {V,C,cl,rnd,rs,fmt,pick,TAU} from './util.js';
import {MAPS,ARENA,bakeSky,makePlanet,placePlanet,makeSun,placeSun,Asteroids,Dust} from './space.js';
import {TEAMS,CLASSES,CLASS_IDS,buildFighter,buildCockpit,mats} from './ships.js';
import {FX,Bolts,Missiles} from './combat.js';
import {Capital,TurretSet} from './fleet.js';
import {Ship,fly,think,steer,leadPoint,SKILL} from './pilot.js';
import {HUD,drawScreen} from './hud.js';
import {Sound} from './sound.js';

const $=id=>document.getElementById(id),DT=1/60,ID='voidwing';
const NAMES=[['VANE','ORRIN','SOLACE','PIKE','JUNO','MERIT','TERN','BRISK','CALLA','REED'],['HEX','RAVEN','SCOUR','VIGIL','THRAX','MORROW','KADE','SKARN','VESS','NULL','GRAVE','ASH']];
const SQUAD={dogfight:[['fighter','interceptor','fighter','bomber'],['interceptor','fighter','fighter','bomber','interceptor']],fleet:[['bomber','fighter','bomber','interceptor'],['interceptor','fighter','interceptor','fighter','bomber']]};

/* ================= renderer + lights ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance',antialias:false});R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(72,1,.3,60000);scene.add(cam);
const sun=new THREE.DirectionalLight(0xffffff,3.4);Object.assign(sun.shadow.camera,{left:-240,right:240,top:240,bottom:-240,near:10,far:3000});sun.shadow.bias=-.0005;sun.shadow.normalBias=.05;scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight(0x3a6c8a,1.1);scene.add(fill,fill.target);const hemi=new THREE.HemisphereLight(0x6688aa,0x1a1410,.7);scene.add(hemi);
let gfx=quality();
const env={map:-1,rt:null,envRT:null,planet:null,sun:null,rocks:null};let dust=null;
function setMap(i){if(env.map===i)return;env.map=i;const M=MAPS[i];
 if(env.rt){env.rt.dispose();env.envRT.dispose();scene.remove(env.planet,env.sun);for(const m of env.rocks.meshes){scene.remove(m);m.dispose();}}
 env.rt=bakeSky(R,M,[512,1024,1024][gfx]);scene.background=env.rt.texture;const pm=new THREE.PMREMGenerator(R);env.envRT=pm.fromCubemap(env.rt.texture);pm.dispose();scene.environment=env.envRT.texture;
 env.planet=makePlanet(M);scene.add(env.planet);env.sun=makeSun(M);scene.add(env.sun);env.rocks=new Asteroids(scene,M,gfx);W.rocks=env.rocks;
 sun.color.set(M.sunCol);fill.color.set(M.fill);hemi.color.set(M.fill);sunDir.set(...M.sun).normalize();fillDir.copy(sunDir).multiplyScalar(-1).add(new V(0,-.3,0)).normalize();}
const sunDir=new V(),fillDir=new V();
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,[1,1.25,1.5][q]));sun.castShadow=q>=2;sun.shadow.mapSize.set(2048,2048);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}post=null;}
let post=null;bindQualityKey(()=>gfx,q=>applyQuality(q));
const fx=new FX(scene,gfx),bolts=new Bolts(2600),missiles=new Missiles(scene,fx),turrets=new TurretSet(scene,80),snd=new Sound(),hud=new HUD($('hudc'),$('radar'));
applyQuality(gfx);

/* ================= state ================= */
const opts={mode:'dogfight',map:0,cls:'fighter',diff:1,clock:480,view:'cockpit',aim:'direct',sens:1};
const saveOpts=stored('pxd_voidwing_opt',opts);
const G={app:'menu',ships:[],caps:[],time:0,clock:0,player:null,score:0,stats:null,result:null,endT:0,tk:[0,0],cap:30,phase:0,ev:[],attract:true,target:null,lockK:0,dead:null,auto:false};
const W={ships:G.ships,caps:G.caps,rocks:null,missiles,mode:'dogfight',arena:ARENA,humanBias:0,time:0};
let camMode='cockpit',cockpit=null,cockpitKey='',shake=0,dmgFlash=0,shFlash=0,slowmo=1,bounds=0,menuFocus=null,menuSwitch=0,menuCamT=0,lastWarn=0,lookY=0,lookP=0;
const stick={x:0,y:0};

/* ================= spawning ================= */
const SHIELD_GEO=new THREE.SphereGeometry(1,24,16);
function shieldFxMat(team){return new THREE.ShaderMaterial({uniforms:{uC:{value:TEAMS[team].glow.clone().multiplyScalar(.5)},uA:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
 vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),3.);gl_FragColor=vec4(uC*(f*.8+.02)*uA,1.);}'});}
let nameI=[0,0];
function spawnShip(cls,team,o={}){const s=new Ship(cls,team,{name:o.name||NAMES[team][nameI[team]++%NAMES[team].length],human:o.human});
 s.mesh=buildFighter(cls,team);scene.add(s.mesh);const sh=new THREE.Mesh(SHIELD_GEO,shieldFxMat(team));sh.scale.setScalar(s.c.rad*1.35);sh.visible=false;s.mesh.add(sh);s.shFx=sh;
 const tc=TEAMS[team].glow.clone().multiplyScalar(.22);s.trails=s.mesh.userData.eng.map(()=>fx.ribbon(30,cls==='bomber'?.24:.15,tc,.55,.5));
 if(!o.human)s.ai={skill:o.skill??1,role:o.role||'',t:rnd(1),home:null};G.ships.push(s);return s;}
function spawnPoint(team){const f=G.mode==='fleet';return team===0?new V(0,40,f?2700:2300):new V(0,-40,f?-2600:-2300);}
function launchShip(s,i=0,warp=false){const sp=spawnPoint(s.team),dir=new V(0,0,s.team?1:-1);const k=i%5;const off=new V((k%2?1:-1)*Math.ceil(k/2)*70,(k%3-1)*25,Math.ceil(k/2)*40*(s.team?-1:1));
 const p=sp.add(off).add(new V(rs(30),rs(30),rs(30)));s.reset();s.place(p,dir,s.c.spd*.8);s.mesh.visible=true;for(const t of s.trails)t.clear();if(s.ai){s.ai.tgt=null;s.ai.home=new V(rs(400),rs(200),s.team?-600:600);s.ai.evade=0;s.ai.extend=0;}
 if(warp){fx.warpIn(p,dir,TEAMS[s.team].glow);if(s.human)snd.play('warp');}}

/* ================= session flow ================= */
function clearWorld(){for(const s of G.ships){scene.remove(s.mesh);for(const t of s.trails)t.orphan=.01;}G.ships.length=0;for(const c of G.caps){scene.remove(c.group);}G.caps.length=0;
 bolts.clear();missiles.clear();fx.clear();G.player=null;G.target=null;G.lockK=0;G.dead=null;G.ev.length=0;nameI=[0,0];}
function setupMatch(mode,attract){clearWorld();setMap(attract?env.map<0?0:env.map:opts.map);G.mode=W.mode=mode;G.attract=attract;G.time=0;W.time=0;G.result=null;G.endT=0;slowmo=1;G.tk=[0,0];G.phase=0;G.score=0;bounds=0;
 G.stats={kills:0,deaths:0,assists:0,shots:0,hits:0,capDmg:0,subs:0,msl:0,taken:0,bonus:0};G.clock=opts.clock;G.cap={300:20,480:30,720:40}[opts.clock]||30;
 const diff=opts.diff;
 if(mode==='fleet'){G.caps.push(new Capital(scene,'flagship',0,new V(0,-60,3700),0,'ACS DAWNBREAK'),new Capital(scene,'frigate',0,new V(-950,140,2900),.05,'ACS HALCYON'),
   new Capital(scene,'frigate',1,new V(-900,120,-2050),Math.PI-.08,'VHS RAKE'),new Capital(scene,'frigate',1,new V(1000,-170,-2250),Math.PI+.1,'VHS SCOURGE'),new Capital(scene,'flagship',1,new V(150,60,-3700),Math.PI,'VHS NOCTURNE'));
  G.flag=[G.caps[0],G.caps[4]];G.caps[4].locked=true;for(const c of G.caps){c.speed*=.3;for(const t of c.turrets)c.aimTurret(t,null);}
  // the defending fleet's bombers hit harder on higher skill
  G.caps[0].maxHull=G.caps[0].hull=7000*[1.25,1,.85][diff];}
 const sq=SQUAD[mode];
 if(!attract){const pl=spawnShip(opts.cls,0,{human:true,name:'YOU'});G.player=pl;}
 sq[0].forEach((c,i)=>spawnShip(c,0,{skill:attract?2:1,role:mode==='fleet'&&i===1?'strike':''}));sq[1].forEach(c=>spawnShip(c,1,{skill:attract?2:diff}));
 const per=[0,0];for(const s of G.ships)launchShip(s,per[s.team]++);
 W.humanBias=[0,150,300][diff];camMode=opts.view;}
function attract(){setupMatch(Math.random()<.5?'fleet':'dogfight',true);G.app='menu';menuFocus=null;menuSwitch=0;
 // the menu battle starts mid-fight
 for(const s of G.ships)s.place(new V(rs(900),rs(300),rs(900)),new V(rs(),rs(.3),rs()),s.c.spd*.8);}
function start(o={}){Object.assign(opts,o);saveOpts();snd.init();setupMatch(opts.mode,false);G.app='play';showPanel(null);$('hud').hidden=false;document.body.classList.add('playing');$('feed').innerHTML='';$('toasts').innerHTML='';
 for(const s of G.ships)if(s.team===0)fx.warpIn(s.p,s.fwd(),TEAMS[0].glow);snd.play('warp');lock();
 banner(G.mode==='fleet'?'FLEET BATTLE':'DOGFIGHT',G.mode==='fleet'?'BREAK THE PICKET · DESTROY THE FLAGSHIP':`FIRST SQUADRON TO ${G.cap} KILLS`,2.8);updObjective();}
function toMenu(){unlock();attract();showPanel('menu');$('hud').hidden=true;document.body.classList.remove('playing');snd.off();renderMenu();}
function showPanel(id){for(const p of['menu','pause','over'])$(p).hidden=p!==id;$('keys').hidden=id!=='menu';$('lock').hidden=true;}
function pause(on){if(on&&G.app==='play'){G.app='paused';showPanel('pause');unlock();snd.suspend(true);}else if(!on&&G.app==='paused'){G.app='play';showPanel(null);lock();snd.suspend(false);}}

function endMatch(res,why){if(G.result)return;G.result=res;G.why=why;G.endT=0;slowmo=.3;
 if(res==='win'){G.stats.bonus=(G.mode==='fleet'?2500:1200)+Math.round(G.clock*2)+[0,300,700][opts.diff];addScore(G.stats.bonus,null);snd.play('win');}else snd.play('lose');
 banner(res==='win'?'VICTORY':'DEFEAT',why,3.2,res==='win'?'#6dff9e':'#ff4a3d');}
let lastAward=null;
function showOver(){G.app='over';unlock();$('hud').hidden=true;document.body.classList.remove('playing');snd.off();const s=G.stats,won=G.result==='win',pl=G.player;
 $('o-eye').textContent=`${G.mode==='fleet'?'FLEET BATTLE':'DOGFIGHT 5V5'} · ${MAPS[opts.map].name} · ${SKILL[opts.diff].n}`;$('o-res').textContent=won?'VICTORY':'DEFEAT';$('o-res').style.color=won?'#6dff9e':'#ff5a4a';$('o-sub').textContent=G.why||'';
 const acc=s.shots?Math.round(s.hits/s.shots*100):0;
 const rows=[['SCORE',G.score],['KILLS',s.kills],['ASSISTS',s.assists],['DEATHS',s.deaths],['ACCURACY',acc+'%'],['MISSILES FIRED',s.msl],['CAPITAL DAMAGE',Math.round(s.capDmg)],['SUBSYSTEMS DESTROYED',s.subs],['VICTORY BONUS',s.bonus]];
 $('o-stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
 const board=[...G.ships].sort((a,b)=>a.team-b.team||b.kills*100+b.assists*50+b.capDmg/5-(a.kills*100+a.assists*50+a.capDmg/5));
 $('o-board').innerHTML='<tr><th>PILOT</th><th>CLASS</th><th>K</th><th>A</th><th>D</th></tr>'+board.map(p=>`<tr class="${p.human?'me':''}"><td class="h${p.team}">${p.name}</td><td>${p.c.role}</td><td>${p.kills}</td><td>${p.assists}</td><td>${p.deaths}</td></tr>`).join('');
 lastAward={pts:G.score,won,mode:G.mode,kills:s.kills,cls:CLASSES[opts.cls].names[0],diff:SKILL[opts.diff].n,map:MAPS[opts.map].name};const tok=5+Math.min(60,G.score/100|0);addRound(tok,won);saveBest(ID,G.score);
 $('o-tok').textContent=`+${tok} TOKENS · BEST ${bestScore(ID)} PTS`;showPanel('over');}

/* ================= scoring + damage ================= */
function addScore(n,why,cls){G.score+=n;if(why)toast('+'+n+' '+why,cls);}
const isPilot=o=>o&&o.c&&o.ai!==undefined||o&&o.human;
function hurtShip(s,dmg,by,point,vel){if(!s.alive||G.result&&s.human)return;if(s.human&&G.attract)return;
 if(s.human&&by&&!by.human)dmg*=SKILL[opts.diff].dmg;if(!s.human&&s.team===0&&by&&by.team===1&&!G.attract)dmg*=G.mode==='fleet'?.65:.85;
 s.lastHit=s.age;if(by&&by!==s){s.lastHitBy=by;s.lastHitT=G.time;if(isPilot(by))s.dmgBy.set(by,(s.dmgBy.get(by)||0)+dmg);}
 let rem=dmg;if(s.shield>0){const a=Math.min(s.shield,rem);s.shield-=a;rem-=a;s.shFx.material.uniforms.uA.value=s.human?.4:.6;if(point&&near(point,900))fx.shieldHit(point,TEAMS[s.team].glow);}
 else if(point&&near(point,900))fx.hitSpark(point,s.v);
 s.hull-=rem;
 if(s.human){G.stats.taken+=dmg;if(rem>0){dmgFlash=Math.min(1,dmgFlash+rem/25);shake=Math.max(shake,Math.min(.9,rem/18));snd.play('hullHit');}else{shFlash=Math.min(.8,shFlash+.25);shake=Math.max(shake,.2);snd.play('shieldHit');}}
 if(by&&by.human&&!s.human){G.stats.hits++;hud.hit(false);snd.play('hit');}
 if(s.hull<=0)killShip(s,by);}
const near=(p,d)=>p.distanceToSquared(cam.position)<d*d;
function killShip(s,by){if(!s.alive)return;s.alive=false;s.hull=0;s.deaths++;
 fx.explode(s.p,s.c.rad/4.5,{vel:s.v,mat:s.mesh.userData.hull.material});sndAt('boom',s.p,1.2);s.mesh.visible=false;for(const t of s.trails){t.orphan=1.2;}s.trails=s.mesh.userData.eng.map(()=>fx.ribbon(30,s.cls==='bomber'?.24:.15,TEAMS[s.team].glow.clone().multiplyScalar(.22),.55,.5));
 const killer=isPilot(by)?by:(s.lastHitBy&&isPilot(s.lastHitBy)&&G.time-s.lastHitT<10?s.lastHitBy:null);
 G.tk[1-s.team]++;if(killer&&killer.team!==s.team)killer.kills++;
 for(const [p,d] of s.dmgBy)if(p!==killer&&p.team!==s.team&&d>s.maxHull*.25){p.assists++;if(p.human&&!G.attract){G.stats.assists++;addScore(50,'ASSIST');}}
 if(killer&&killer.human){G.stats.kills++;addScore(s.cls==='bomber'?150:100,(s.cls==='bomber'?'BOMBER DOWN · ':'KILL · ')+s.name);hud.hit(true);snd.play('kill');}
 if(s.human){G.stats.deaths++;G.dead={t:0,by:killer||by,pos:s.p.clone()};G.target=null;}
 feed(killer?`${killer.name} ✕ ${s.name}`:by&&by.name?`${by.name} ✕ ${s.name}`:`${s.name} DESTROYED`,killer&&killer.human?'good':s.human?'bad':s.team===0?'ally':'');
 s.respawnT=s.human?5:G.mode==='fleet'?(s.team?8+rnd(3):5+rnd(2)):6+rnd(3);}
function capHit(cp,dmg,by,point,h,torp){if(cp.dead||G.result&&G.mode!=='fleet')return;cp.lastHit=G.time;const human=by&&by.human;
 if(h.shield){if(cp.locked){cp.hitShield(h.n);if(human)toast('SHIELD LINKED TO THE FRIGATES',true,'lnk');return;}
  cp.shield=Math.max(0,cp.shield-dmg*(torp?1.4:1));cp.hitShield(h.n);if(near(point,1500))fx.shieldHit(point,TEAMS[cp.team].glow);
  if(human){G.stats.hits++;hud.hit(false);credit(by,cp,dmg*.5);}if(cp.shield<=0){cp.down=true;cp.brokeT=G.time;feed(`${cp.name} SHIELDS DOWN`,'big');if(cp.team===1)banner('SHIELDS DOWN',cp.name+' · HIT THE SUBSYSTEMS',2);}return;}
 const sub=h.sub;let hd=dmg*(torp?.9:.35);
 if(sub){sub.hp-=dmg*(torp?1.2:1);hd=dmg*(torp?.5:.25);if(human){G.stats.hits++;hud.hit(false);}if(sub.hp<=0)killSub(sub,by);}
 cp.hull-=hd;if(human){G.stats.hits++;hud.hit(false);credit(by,cp,hd+(sub?dmg:0));}
 if(near(point,1500))fx.hitSpark(point,null);if(Math.random()<.1&&near(point,1500))fx.smokePuff(point,cp.v,.6,3);
 if(cp.hull<=0)killCap(cp,by);}
function credit(by,cp,d){if(!by||!by.c)return;by.capDmg+=d;if(by.human){G.stats.capDmg+=d;G.capAcc=(G.capAcc||0)+d;if(G.capAcc>=40){const n=Math.floor(G.capAcc/40);G.capAcc-=n*40;G.score+=n*8;}}}
function killSub(sub,by){if(sub.dead)return;sub.dead=true;sub.hp=0;const cp=sub.cap,p=sub.wp(new V());fx.explode(p,sub.kind==='turret'?2:3.5,{debris:true,mat:cp.group.userData.hull.material});sndAt('boom',p,1.6);
 if(sub.mesh)sub.mesh.visible=false;if(sub.turret!==undefined)cp.turrets[sub.turret].dead=true;fx.burning(sub.lp.clone(),600,sub.kind==='turret'?1.2:2.4,cp.group);
 if(sub.kind==='engines'){cp.speed=0;if(cp.group.userData.glowMesh)cp.group.userData.glowMesh.material=cp.group.userData.glowMesh.material.clone(),cp.group.userData.glowMesh.material.color.multiplyScalar(.15);}
 cp.hull-=sub.max*(sub.kind==='turret'?.15:.5);
 if(sub.kind==='shield'&&cp.gensAlive()===0){cp.shield=0;feed(`${cp.name} SHIELD GENERATORS OFFLINE`,'big');}
 if(by&&by.c)by.subKills++;if(by&&by.human){G.stats.subs++;addScore(sub.kind==='turret'?150:sub.kind==='shield'?400:300,sub.label+' DESTROYED');snd.play('sub');hud.hit(true);}
 feed(`${by&&by.name?by.name:'?'} ✕ ${cp.name} ${sub.label}`,by&&by.human?'good':cp.team===1?'ally':'bad');
 if(sub.kind==='reactor')G.ev.push({t:.4,fn:()=>killCap(cp,by)});else if(cp.hull<=0)killCap(cp,by);updObjective();}
function killCap(cp,by){if(cp.dead)return;cp.dead=true;cp.hull=0;cp.shield=0;feed(`${cp.name} DESTROYED`,'big');snd.play('bigboom');shake=Math.max(shake,near(cp.p,3000)?1:.3);
 for(let i=0;i<9;i++)G.ev.push({t:i*.35+rnd(.2),fn:()=>{const lp=new V(rs(cp.W*.4),rs(cp.H*.5),rs(cp.L*.45));const p=lp.applyQuaternion(cp.group.quaternion).add(cp.group.position);fx.capBlast(p,3+rnd(4));sndAt('boom',p,2);}});
 G.ev.push({t:3.4,fn:()=>{fx.capBlast(cp.group.position.clone(),cp.big?16:9);fx.flash(cp.group.position,4e6,0xffcc88,cp.L*3);sndAt('bigboom',cp.group.position,3);fx.spawnDebris(cp.group.position,null,30,cp.group.userData.hull.material,cp.big?9:5);}});
 G.ev.push({t:3.6,fn:()=>{cp.group.visible=false;}});
 for(const s of cp.subs){s.dead=true;}if(by&&by.human){addScore(cp.big?3000:1500,cp.name+' DESTROYED','cy');}
 if(G.mode==='fleet'&&cp.team===1&&!cp.big){const fr=G.caps.filter(c=>c.team===1&&!c.big&&!c.dead);if(!fr.length&&G.flag[1].locked){G.flag[1].locked=false;G.ev.push({t:2,fn:()=>banner('FLAGSHIP EXPOSED',G.flag[1].name+' · SHIELD LINK BROKEN',2.6)});}}
 updObjective();}
function onBolt(kind,tgt,dmg,own,point,h){if(kind==='ship')hurtShip(tgt,dmg,own,point,h);else capHit(tgt,dmg,own,point,h,false);}
function onMissile(m,ship,cap){const own=m.owner;sndAt('boom',m.p,1);
 if(ship){const d=m.kind==='torpedo'?140:m.dmg;hurtShip(ship,d,own,m.p.clone());}
 else if(cap)capHit(cap.cp,m.kind==='torpedo'?m.dmg:m.dmg*.6,own,m.p.clone(),cap.h,m.kind==='torpedo');
 // splash vs nearby fighters
 for(const s of G.ships){if(!s.alive||s===ship||s.team===own.team)continue;const d=s.p.distanceTo(m.p);if(d<22)hurtShip(s,m.dmg*.5*(1-d/22),own,m.p.clone());}}

/* ================= input ================= */
// mouse look counts whenever a match is live (locked or not); the click-to-play hint is shown per frame in frame()
const I=controls(canvas,{canLock:()=>G.app==='play',clickThrough:true,menu:()=>G.app==='play',onLock:(on,was)=>{if(was&&!on&&G.app==='play')pause(true);},
 onDown:e=>{if(G.app!=='play')return true;if(e.button===2)edge.Fire2=true;if(e.button===1)e.preventDefault();},
 look:e=>{if(G.app!=='play')return false;if(Math.abs(e.movementX)+Math.abs(e.movementY)>2)padMode=false;return true;},
 onKey:e=>{if(['Space','Tab','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  if(e.code==='Escape'){if(G.app==='play')pause(true);else if(G.app==='paused')pause(false);}
  if(G.app!=='play')return;if(e.code==='KeyV')camMode=camMode==='cockpit'?'chase':'cockpit';if(e.code==='KeyM'){snd.on=!snd.on;toast(snd.on?'SOUND ON':'SOUND OFF');if(!snd.on)snd.off();}}});
const {keys,edge,mouse,lock,unlock}=I;let padMode=false;
$('lock').onclick=()=>lock();
const padPrev={};
function readPad(){const gp=gamepad();if(!gp)return null;const a=gp.axes,b=gp.buttons,dz=v=>deadzone(v,.15,true);
 const P={lx:dz(a[0]||0),ly:dz(a[1]||0),rx:dz(a[2]||0),ry:dz(a[3]||0),rt:b[7]?.value||0,lt:b[6]?.value||0,A:b[0]?.pressed,B:b[1]?.pressed,X:b[2]?.pressed,Y:b[3]?.pressed,LB:b[4]?.pressed,RB:b[5]?.pressed,start:b[9]?.pressed,up:b[12]?.pressed,down:b[13]?.pressed,left:b[14]?.pressed,right:b[15]?.pressed};
 P.e={};for(const k of['X','Y','start','up','down','left','right'])P.e[k]=P[k]&&!padPrev[k];for(const k of['X','Y','start','up','down','left','right'])padPrev[k]=P[k];P.e.LT=P.lt>.5&&!padPrev.LT;padPrev.LT=P.lt>.5;
 if(Math.abs(P.lx)+Math.abs(P.ly)>.05)padMode=true;return P;}

/* ================= player control ================= */
function playerInput(s,dt,P){const k=s.ctrl;
 if(G.auto){if(!s.ai)s.ai={skill:2,t:0,home:new V(0,0,0)};think(s,W,dt);return;}
 if(padMode&&P){k.pitch=P.ly;k.yaw=P.lx;k.roll=(P.RB?1:0)-(P.LB?1:0);}else{k.pitch=-stick.y;k.yaw=stick.x;k.roll=0;}
 if(keys.KeyA||keys.KeyD)k.roll=(keys.KeyD?1:0)-(keys.KeyA?1:0); if(keys.ArrowLeft||keys.ArrowRight)k.yaw=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0);if(keys.ArrowUp||keys.ArrowDown)k.pitch=(keys.ArrowDown?1:0)-(keys.ArrowUp?1:0);
 if(keys.KeyW)k.thr=Math.min(1,k.thr+dt*.8);if(keys.KeyS)k.thr=Math.max(0,k.thr-dt*.8);if(P&&Math.abs(P.ry)>.2)k.thr=cl(k.thr-P.ry*dt*.8,0,1);
 const wasB=s.boosting;k.boost=!!(keys.ShiftLeft||keys.ShiftRight||P&&P.A);k.drift=!!(keys.Space||P&&P.B);if(k.boost&&!wasB&&s.boostE>.6)snd.play('boostOn');
 k.fire=mouse.l||!!keys.KeyK||!!(P&&P.rt>.3);k.sec=!!(edge.Fire2||edge.KeyQ||P&&P.e.LT);k.cm=!!(edge.KeyF||edge.KeyX||P&&P.e.X);
 const rt=sys=>{s.route(sys);snd.play('pip',['eng','wpn','shd','bal'].indexOf(sys));};
 if(edge.Digit1||P&&P.e.left)rt('eng');if(edge.Digit2||P&&P.e.up)rt('wpn');if(edge.Digit3||P&&P.e.right)rt('shd');if(edge.Digit4||P&&P.e.down)rt('bal');
 if(edge.KeyT||P&&P.e.Y)selectTarget(s);if(edge.KeyE)cycleSub(s);if(edge.KeyR&&s.lastHitBy&&s.lastHitBy.alive!==false&&s.lastHitBy.c){G.target=s.lastHitBy;toast('TARGET · '+s.lastHitBy.name);}}
function selectTarget(s){const f=s.fwd(new V());let best=null,ba=.5;const cand=[...G.ships.filter(o=>o.alive&&o.team!==s.team),...G.caps.filter(c=>!c.dead&&c.team!==s.team)];
 for(const o of cand){const d=o.p.distanceTo(s.p);if(d>(o.L?9000:4500))continue;const a=f.angleTo(new V().subVectors(o.p,s.p))+(o.L?.05:0);if(a<ba){ba=a;best=o;}}
 if(best){G.target=best;snd.play('ui');}}
function cycleSub(s){let cp=G.target&&(G.target.L?G.target:G.target.cap);if(!cp){const cs=G.caps.filter(c=>!c.dead&&c.team!==s.team);if(!cs.length)return;cp=cs.reduce((a,b)=>a.p.distanceTo(s.p)<b.p.distanceTo(s.p)?a:b);}
 const subs=cp.subs.filter(x=>!x.dead).sort((a,b)=>(a.kind==='turret')-(b.kind==='turret'));if(!subs.length){G.target=cp;return;}const i=subs.indexOf(G.target);G.target=subs[(i+1)%subs.length];snd.play('ui');toast('SUBSYSTEM · '+G.target.label);}

/* ================= weapons ================= */
const _f=new V(),_g=new V(),_d=new V(),_t=new V();
function weapons(s,dt){const c=s.c,k=s.ctrl;s.gunT-=dt;s.secT-=dt;s.cmCd=(s.cmCd||0)-dt;
 if(k.fire&&!s.overheat&&s.alive){const L=c.laser,ud=s.mesh.userData,f=s.fwd(_f);let n=0;const conv=_t.copy(s.p).addScaledVector(f,s.human?650:500);
  while(s.gunT<=0&&n<3){s.gunT+=1/L.rof;n++;const linked=s.cls==='bomber';const mounts=linked?ud.guns:[ud.guns[(s.gunI=(s.gunI||0)+1)%ud.guns.length]];
   for(const gm of mounts){const o=_g.copy(gm).applyQuaternion(s.q).add(s.p);_d.subVectors(conv,o).normalize().add(new V(rs(L.spread),rs(L.spread),rs(L.spread))).normalize();
    const v=_d.multiplyScalar(L.spd).add(s.v);bolts.fire(s,s.team,o,v,L.dmg*(.85+.075*s.pips.wpn)*(linked?.6:1),TEAMS[s.team].bolt,1.35,.22,.024);if(near(o,600))fx.muzzle(o,TEAMS[s.team].bolt);}
   s.heat+=L.heat;if(s.human)G.stats.shots+=mounts.length;}
  if(n){if(s.human){snd.play(s.cls==='bomber'?'heavy':'laser'+s.team);shake=Math.max(shake,.05);}else if(near(s.p,700)&&Math.random()<.5)snd.play('enemyLaser',1-s.p.distanceTo(cam.position)/700);}
  if(s.heat>=1){s.overheat=true;s.heat=1;if(s.human)toast('LASERS OVERHEATED',true);}}
 else s.gunT=Math.max(s.gunT,0);
 if(k.sec&&s.secN>0&&s.secT<=0&&s.alive){s.secT=.7;s.secN--;let tg=null;if(s.human){tg=G.lockK>=1?G.target:null;G.stats.msl++;}else tg=s.lockT>=c.sec.lock?s.lockTgt:null;
  missiles.launch(s,tg,c.sec);if(s.human){snd.play(c.sec.kind==='torpedo'?'torp':'msl');if(!tg)toast('NO LOCK · DUMBFIRE',true);G.lockK=0;}else{sndAt('msl',s.p,.6);s.lockT=0;}
  if(tg&&tg.human)toast('MISSILE INCOMING',true);}
 if(k.cm&&s.cmN>0&&s.cmCd<=0&&s.alive){s.cmN--;s.cmCd=.8;const n=missiles.breakLocks(s);for(const o of G.ships)if(o.lockTgt===s){o.lockT=0;}fx.chaff(s.p,s.v);if(s.human){snd.play('cm');toast(n?`COUNTERMEASURES · ${n} BROKEN`:'COUNTERMEASURES','','cy');}else if(near(s.p,500))sndAt('cm',s.p,.5);}}
function playerLock(s,dt){if(!G.target&&!G.auto){const f=s.fwd(_f);let ba=.17;for(const o of G.ships){if(!o.alive||o.team===s.team)continue;const d=o.p.distanceTo(s.p);if(d>1500)continue;const a=f.angleTo(_d.subVectors(o.p,s.p));if(a<ba){ba=a;G.target=o;}}}
 const t=G.target,c=s.c;if(!t||t.dead||t.alive===false){G.target=null;G.lockK=0;return;}
 const isCap=!!(t.L||t.cap),tp=t.wp?t.wp(_t):t.p,d=tp.distanceTo(s.p),a=s.fwd(_f).angleTo(_d.subVectors(tp,s.p));
 const ok=s.secN>0&&(c.sec.capOnly?isCap:true)&&d<(c.sec.kind==='torpedo'?1900:1500)&&a<.28;if(ok)G.lockK=Math.min(1,G.lockK+dt/c.sec.lock);else G.lockK=Math.max(0,G.lockK-dt*1.5);}

/* ================= capital-ship turrets ================= */
const _ta=new V();
function capTurrets(dt){for(const cp of G.caps){if(cp.dead)continue;const enemyTeam=cp.team===1,sk=enemyTeam?opts.diff:1;
  for(const t of cp.turrets){if(t.dead)continue;t.cd-=dt;t.rt=(t.rt||0)-dt;const wp=cp.turretWorld(t,_ta);
   if(t.rt<=0){t.rt=.8+rnd(.6);t.tgt=null;let bd=1700;for(const s of G.ships){if(!s.alive||s.team===cp.team)continue;const d=s.p.distanceTo(wp);if(d<bd){bd=d;t.tgt=s;}}}
   const tg=t.tgt&&t.tgt.alive?t.tgt:null;const aim=tg?leadPoint({p:wp},tg,700,new V()):null;const el=cp.aimTurret(t,aim);
   if(tg&&t.cd<=0&&el>0&&!G.attract||tg&&t.cd<=0&&el>0&&G.attract){t.cd=(enemyTeam?[3.2,2.4,1.8][sk]:2.4)*(cp.big?.8:1)+rnd(.8);const err=[.045,.03,.018][sk]*(tg.human?1:1.7);
    for(let i=0;i<2;i++){const dir=new V().subVectors(aim,wp).normalize().add(new V(rs(err),rs(err),rs(err))).normalize();const o=wp.clone().addScaledVector(dir,8);
     G.ev.push({t:i*.12,fn:()=>{bolts.fire(cp,cp.team,o,dir.clone().multiplyScalar(700),5.5,cp.team?[3.6,1.4,.4]:[.6,2.4,3.2],2.6,.9,.035);}});}
    if(near(wp,900))sndAt('turret',wp,.7);}}}}

/* ================= simulation step ================= */
const _n=new V();
function collide(s,dt){if(!s.alive)return;s.bumpT=(s.bumpT||0)-dt;
 for(const a of env.rocks.near(s.p)){const d=s.p.distanceTo(a.p),rr=a.r+s.c.rad*.7;if(d<rr){_n.subVectors(s.p,a.p).divideScalar(d||1);s.p.addScaledVector(_n,rr-d+.1);bump(s,_n,a.p);}}
 for(const cp of G.caps){if(cp.dead&&cp.sinkT>4)continue;const h=cp.collide(s.p,s.c.rad*.7);if(h){s.p.addScaledVector(h.n,h.depth+.1);bump(s,h.n,null);}}}
function bump(s,n,src){const vn=s.v.dot(n);if(vn<0){s.v.addScaledVector(n,-vn*1.6);s.sp=s.v.length()*.6;s.v.multiplyScalar(.6);}if(s.bumpT>0)return;s.bumpT=.6;const d=12+Math.max(0,-vn)*.35;
 if(s.human){shake=1;snd.play('hullHit');toast('COLLISION',true);}if(near(s.p,800))fx.hitSpark(s.p.clone().addScaledVector(n,-s.c.rad),null);const sh=s.shield;s.shield=0;hurtShip(s,d+sh*0,null,null);s.shield=Math.max(0,sh-d);if(!s.human&&s.ai){s.ai.extend=1.2;s.ai.extDir=n.clone();}}
function sim(dt){G.time+=dt;W.time=G.time;const P=G.app==='play'?readPad():null;if(P&&P.e.start)pause(true);
 for(let i=G.ev.length-1;i>=0;i--){const e=G.ev[i];e.t-=dt;if(e.t<=0){G.ev.splice(i,1);e.fn();}}
 for(const s of G.ships){if(!s.alive)continue;if(s.human){if(G.app==='play'&&!G.result)playerInput(s,dt,P);else{s.ctrl.fire=s.ctrl.sec=s.ctrl.cm=false;}}else think(s,W,dt);
  fly(s,dt);weapons(s,dt);collide(s,dt);if(s.human)playerLock(s,dt);
  if(s.hull<s.maxHull*.35&&near(s.p,2500)){s.smokeAcc+=dt;while(s.smokeAcc>.05){s.smokeAcc-=.05;const e=s.mesh.userData.eng[0];fx.smokePuff(_g.copy(e).applyQuaternion(s.q).add(s.p),s.v,.8,s.c.rad/6);if(s.hull<s.maxHull*.2)fx.firePuff(_g,s.v,s.c.rad/6);}}}
 for(const c of G.caps)c.update(dt,G);capTurrets(dt);
 bolts.update(dt,W,fx,onBolt);missiles.update(dt,W,onMissile);if(env.rocks)env.rocks.update(dt);
 // respawns
 for(const s of G.ships){if(s.alive)continue;s.respawnT-=dt;if(s.respawnT<=0&&!G.result&&!(s.human&&G.app!=='play'&&!G.attract)){launchShip(s,(Math.random()*5)|0,true);if(s.human){G.dead=null;banner('RELAUNCH','',1.2);}}}}

/* ================= per-frame update ================= */
function frame(dt){if(G.app==='play'||G.app==='menu'){const sdt=dt*slowmo;G.acc=(G.acc||0)+sdt;let n=0;while(G.acc>=DT&&n<6){sim(DT);G.acc-=DT;n++;}if(n>=6)G.acc=0;if(G.app==='play')flow(dt);else menuDirector(dt);}
 // mouse -> stick / free look
 if(G.app==='play'&&G.player){const sens=opts.sens||1;if(keys.KeyC){lookY=cl(lookY-mouse.dx*.003,-2.4,2.4);lookP=cl(lookP-mouse.dy*.003,-1.2,1.2);}else{lookY*=Math.exp(-dt*6);lookP*=Math.exp(-dt*6);
   if(opts.aim==='stick'){stick.x=cl(stick.x+mouse.dx*.0028*sens,-1,1);stick.y=cl(stick.y+mouse.dy*.0028*sens,-1,1);const l=Math.hypot(stick.x,stick.y);if(l>1){stick.x/=l;stick.y/=l;}}
   else{const k=1/Math.max(dt,1/240)/900*sens;const tx=cl(mouse.dx*k,-1,1),ty=cl(mouse.dy*k,-1,1);const a=1-Math.exp(-dt*30);stick.x+=(tx-stick.x)*a;stick.y+=(ty-stick.y)*a;}}}
 mouse.dx=mouse.dy=0;I.flush();
 visuals(dt);camera(dt);hudUpdate(dt);}
function flow(dt){const pl=G.player;
 if(!G.result){G.clock-=dt;
  if(G.mode==='dogfight'){if(G.tk[0]>=G.cap)endMatch('win','AURORA COMPACT WINS '+G.tk[0]+'–'+G.tk[1]);else if(G.tk[1]>=G.cap)endMatch('lose','VESPER HOLLOW WINS '+G.tk[1]+'–'+G.tk[0]);
   else if(G.clock<=0){G.clock=0;if(G.tk[0]>G.tk[1])endMatch('win','TIME · '+G.tk[0]+'–'+G.tk[1]);else endMatch('lose',G.tk[0]===G.tk[1]?'TIME · DRAW '+G.tk[0]+'–'+G.tk[1]:'TIME · '+G.tk[0]+'–'+G.tk[1]);}}
  else{if(G.flag[1].dead)endMatch('win',G.flag[1].name+' DESTROYED · '+fmt(G.clock)+' LEFT');else if(G.flag[0].dead)endMatch('lose',G.flag[0].name+' WAS LOST');else if(G.clock<=0){G.clock=0;endMatch('lose','TIME UP · THE ENEMY FLEET HELD');}}}
 if(G.result){G.endT+=dt;slowmo=G.endT<2.4?.3:1;if(G.endT>(G.mode==='fleet'&&G.result==='win'?5.5:4)){slowmo=1;showOver();return;}}
 if(G.dead)G.dead.t+=dt;
 // combat area
 if(pl&&pl.alive){const out=pl.p.length()>ARENA;bounds=out?bounds+dt:Math.max(0,bounds-dt*2);if(bounds>8)hurtShip(pl,dt*30,null,null);}
 $('lock').hidden=!(G.app==='play'&&!I.locked&&!navigator.webdriver);
 updObjective(true);}
function menuDirector(dt){menuSwitch-=dt;if(!menuFocus||menuFocus.alive===false||menuFocus.dead||menuSwitch<=0){const al=G.ships.filter(p=>p.alive);const cs=G.caps.filter(c=>!c.dead);menuFocus=cs.length&&Math.random()<.3?pick(cs):pick(al)||null;menuSwitch=7+rnd(4);menuCamT=0;}}

/* ================= visuals ================= */
const _w=new V();
function visuals(dt){const ply=G.app==='play'&&G.player;
 for(const s of G.ships){const m=s.mesh;if(!s.alive){continue;}m.position.copy(s.p);m.quaternion.copy(s.q);m.visible=!(s.human&&camMode==='cockpit'&&ply&&!G.result);
  const ud=m.userData,k=s.boosting?1.6:.45+s.thr*.6;for(const f of ud.flames){f.scale.z+=(k*(.9+rnd(.2))-f.scale.z)*Math.min(1,dt*10);}
  const u=s.shFx.material.uniforms.uA;u.value=Math.max(0,u.value-dt*3);s.shFx.visible=u.value>.02;
  const vis=near(s.p,3500);ud.eng.forEach((e,i)=>{const r=s.trails[i];if(!r)return;r.push(_w.copy(e).applyQuaternion(s.q).add(s.p),vis,dt,1.5);});}
 fx.update(dt,cam);turrets.update(G.caps);
 for(const c of G.caps)if(!c.dead||c.sinkT<12)c.update(0,G);
 placePlanet(env.planet,cam);env.planet.userData.U.uTime.value=G.time;const pd=env.planet.userData.dir;const occ=Math.acos(cl(pd.dot(sunDir),-1,1))<env.planet.userData.ang*1.02;placeSun(env.sun,cam,occ);
 const fc=G.player&&G.player.alive?G.player.p:cam.position;sun.position.copy(fc).addScaledVector(sunDir,1200);sun.target.position.copy(fc);fill.position.copy(fc).addScaledVector(fillDir,1000);fill.target.position.copy(fc);
 if(ply){if(!dust)dust=new Dust(scene,gfx?800:400);dust.mesh.visible=true;dust.update(cam,G.player.alive?G.player.v:_w.set(0,0,0));}else if(dust)dust.mesh.visible=false;}

/* ================= camera ================= */
let fovNow=72;const _cq=new THREE.Quaternion(),_e=new THREE.Euler(),camVel=new V(),_cp=new V();
function setCockpit(on){const pl=G.player;const key=pl?opts.cls+pl.team:'';if(on&&key!==cockpitKey){if(cockpit)cam.remove(cockpit);cockpit=buildCockpit(pl.team,pl.cls);cam.add(cockpit);cockpitKey=key;}if(cockpit)cockpit.visible=on;}
function camera(dt){const pl=G.player;let fov=70;const ply=G.app==='play'||G.app==='paused'||G.app==='over';
 if(!ply||!pl){setCockpit(false);const f=menuFocus;menuCamT+=dt;if(f){const fp=f.p,big=!!f.L;const fw=big?f.dir:f.fwd(_f),side=_g.set(-fw.z,0,fw.x).normalize();const ph=menuCamT*(big?.04:.12);
   const R0=big?f.L*.9:26;const off=_t.copy(side).multiplyScalar(Math.cos(ph)*R0).addScaledVector(fw,(big?-.3:-1)*R0+Math.sin(ph)*R0*.8).add(_d.set(0,R0*(big?.25:.3)+Math.sin(ph*.7)*R0*.1,0));
   const want=_cp.copy(fp).add(off);if(menuCamT<.05)cam.position.copy(want);else cam.position.lerp(want,1-Math.exp(-dt*3));cam.lookAt(fp);if(G.app==='menu')cam.rotateY(.3);}else{cam.position.set(0,200,1500);cam.lookAt(0,0,0);}fov=big0(f)?50:52;cam.near=1;}
 else if(G.result&&G.mode==='fleet'&&G.result==='win'){setCockpit(false);const cp=G.flag[1];const want=_cp.copy(cp.group.position).add(_t.set(cp.L*.9,cp.L*.35,cp.L*1.2));cam.position.lerp(want,1-Math.exp(-dt*1.5));cam.lookAt(cp.group.position);fov=55;cam.near=1;}
 else if(!pl.alive){setCockpit(false);const tgt=G.dead?G.dead.pos:pl.p;const a=G.time*.25;const want=_cp.set(tgt.x+Math.cos(a)*45,tgt.y+18,tgt.z+Math.sin(a)*45);cam.position.lerp(want,1-Math.exp(-dt*2));cam.lookAt(tgt);fov=60;cam.near=1;}
 else if(camMode==='cockpit'&&!G.result){setCockpit(true);cam.position.copy(pl.mesh.userData.eye).applyQuaternion(pl.q).add(pl.p);cam.quaternion.copy(pl.q);
  // head lean with the turn + free look
  _e.set(-pl.w.x*.035+lookP,-pl.w.y*.035+lookY,-pl.w.z*.02,'YXZ');_cq.setFromEuler(_e);cam.quaternion.multiply(_cq);
  if(cockpit){cockpit.position.set(pl.w.y*.006,-pl.w.x*.006-(pl.boosting?.01:0),pl.boosting?.03:0);cockpit.rotation.set(-lookP*0,0,0);const lev=cockpit.userData.lever;lev.rotation.x=-.6+pl.thr*1.1;
   const sc=cockpit.userData.screen;sc.t-=dt;if(sc.t<=0){sc.t=.12;drawScreen(sc,pl,pl.team,G.target);}}
  fov=78+(pl.boosting?8:0);cam.near=.3;}
 else{setCockpit(false);const dist=pl.c.rad*2.6+7,hgt=pl.c.rad*.55+2.2;_cq.copy(pl.q);if(lookY||lookP){_e.set(lookP,lookY,0,'YXZ');_cq.multiply(new THREE.Quaternion().setFromEuler(_e));}
  cam.quaternion.slerp(_cq,1-Math.exp(-dt*7));const back=_f.set(0,0,1).applyQuaternion(cam.quaternion),up=_g.set(0,1,0).applyQuaternion(cam.quaternion);
  cam.position.copy(pl.p).addScaledVector(back,dist).addScaledVector(up,hgt);fov=70+(pl.boosting?9:0)+cl((pl.sp-120)/200,0,1)*4;cam.near=.5;}
 if(ply&&pl&&pl.alive&&!G.result){shake=Math.max(0,shake-dt*2.4)+(pl.boosting?.05:0)*dt*4;}else shake=Math.max(0,shake-dt*2);
 fovNow+=(fov-fovNow)*Math.min(1,dt*4);cam.fov=fovNow;cam.updateProjectionMatrix();
 if(shake>0.001){const s=shake*shake*.25;cam.position.x+=rs(s);cam.position.y+=rs(s);cam.position.z+=rs(s);_cq.setFromEuler(_e.set(rs(s*.02),rs(s*.02),rs(s*.02)));cam.quaternion.multiply(_cq);}}
const big0=f=>f&&!!f.L;

/* ================= HUD ================= */
const ovc={};function ov(id,v){v=Math.round(v*50)/50;if(ovc[id]===v)return;ovc[id]=v;const e=$(id);e.style.display=v>0?'block':'none';e.style.opacity=v;}
const hc={};function setTxt(id,v){if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}}function setHTML(id,v){if(hc[id]!==v){hc[id]=v;$(id).innerHTML=v;}}
function feed(t,cls=''){if(G.attract)return;const d=note($('feed'),'',6000,6);d.textContent=t;d.className=cls;}
let banT=0;function banner(t,s,dur=2.4,col){if(G.attract)return;$('bt').textContent=t;$('bt').style.color=col||'';$('bs').textContent=s||'';$('bs').hidden=!s;$('banner').classList.add('on');banT=dur;snd.play('banner');}
const toastSeen={};function toast(t,bad,key){if(G.attract)return;if(key){if(toastSeen[key]&&G.time-toastSeen[key]<3)return;toastSeen[key]=G.time;}const d=note($('toasts'),'',1800,4,false);d.textContent=t;d.className=bad===true?'bad':bad||'';}
function sndAt(k,p,a=1){const d=p.distanceTo(cam.position);if(d<4000)snd.play(k,a*Math.min(1,400/(d+120)));}
function updObjective(tick){if(G.attract)return;let h='';
 if(G.mode==='dogfight'){h=`Destroy enemy starfighters. First squadron to <b>${G.cap}</b> kills wins.`;}
 else{const fr=G.caps.filter(c=>c.team===1&&!c.big),F=G.flag[1];
  if(F.locked){h='<b>PHASE 1</b> · Destroy the picket frigates (their shield link protects the flagship)<br>'+fr.map(c=>`<span class="${c.dead?'done':''}">${c.name} — ${c.dead?'DESTROYED':(c.shieldUp()?'SHIELDS '+Math.round(c.shield/c.maxShield*100)+'%':'HULL '+Math.round(c.hull/c.maxHull*100)+'%')}</span>`).join('<br>');}
  else if(F.shieldUp())h=`<b>PHASE 2</b> · Drop ${F.name}'s shields: destroy both shield generators or overload the bubble (${Math.round(F.shield/F.maxShield*100)}%)`;
  else h=`<b>PHASE 3</b> · ${F.name} is exposed — strike the <b>reactor core</b>, bridge and engines (hull ${Math.round(F.hull/F.maxHull*100)}%)`;
  h+=`<br><span style="color:#a8d4ff">Protect ${G.flag[0].name} · hull ${Math.round(G.flag[0].hull/G.flag[0].maxHull*100)}%</span>`;}
 setHTML('obj',h);}
function hudUpdate(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}
 const pl=G.player,playing=G.app==='play'&&pl;
 if(!playing){hud.draw({hidden:true});ov('dmg',0);ov('flash',0);return;}
 const alive=pl.alive;
 // lead pip for the selected target (or the hostile nearest the nose)
 let tgt=G.target;if(tgt&&(tgt.alive===false||tgt.dead))tgt=G.target=null;
 let soft=tgt;if(!soft&&alive){let ba=.18;const f=pl.fwd(_f);for(const o of G.ships){if(!o.alive||o.team===pl.team)continue;const d=o.p.distanceTo(pl.p);if(d>1500)continue;const a=f.angleTo(_d.subVectors(o.p,pl.p));if(a<ba){ba=a;soft=o;}}}
 let lead=null,leadIn=false;if(soft&&alive){lead=leadPoint(pl,soft,pl.c.laser.spd,new V());const tp=soft.wp?soft.wp(new V()):soft.p;leadIn=pl.fwd(_f).angleTo(_d.subVectors(lead,pl.p))<Math.atan2(soft.r||soft.c&&soft.c.rad||10,tp.distanceTo(pl.p))+.01;}
 const incoming=missiles.list.filter(m=>m.target===pl&&m.seek);const enemyLock=G.ships.some(o=>o.alive&&o.team!==pl.team&&o.lockTgt===pl&&o.lockT>.2);
 const reticle=camMode==='cockpit'?null:hud.proj(cam,_t.copy(pl.p).addScaledVector(pl.fwd(_f),900),{});
 hud.draw({cam,pl,dt,time:G.time,ships:G.ships,caps:G.caps,missiles:missiles.list,target:tgt||soft,lead,leadIn,lockTgt:G.lockK>0?tgt:null,lockT:G.lockK,incoming,stick:opts.aim==='stick'&&!padMode?stick:null,reticle,radarRange:3000});
 // warnings
 let warn='',wl=0;if(alive){if(incoming.length){warn='MISSILE INCOMING · F COUNTERMEASURES';wl=2;}else if(enemyLock){warn='ENEMY LOCKING ON';wl=1;}else if(bounds>0){warn='LEAVING THE BATTLE ZONE '+Math.max(0,Math.ceil(8-bounds));wl=1;}else if(pl.overheat){warn='LASERS OVERHEATED';}else if(pl.hull<pl.maxHull*.25){warn='HULL CRITICAL';wl=1;}}
 setTxt('warn',warn);$('warn').className=wl===2?'hot':wl?'on':warn?'soft':'';
 snd.engine({on:alive&&!G.result,speed:pl.sp,thr:pl.thr,boost:pl.boosting,drift:pl.drifting,lock:alive?(G.lockK>=1?2:G.lockK>0?1:enemyLock?3:0):0,warn:wl});
 $('dead').hidden=!(G.dead&&!pl.alive&&!G.result);if(G.dead){setTxt('killer',G.dead.by&&G.dead.by.name?'BY '+G.dead.by.name:'');setTxt('rsp','RELAUNCH IN '+Math.max(0,Math.ceil(pl.respawnT)));}
 setTxt('clock',fmt(G.clock));$('clock').className=G.clock<=30?'low':'';setTxt('score',G.score);setTxt('kd',`${G.stats.kills} K · ${G.stats.assists} A · ${G.stats.deaths} D`);
 if(G.mode==='dogfight'){setTxt('t0s',G.tk[0]);setTxt('t1s',G.tk[1]);$('t0b').style.width=(G.tk[0]/G.cap*100)+'%';$('t1b').style.width=(G.tk[1]/G.cap*100)+'%';setTxt('modeTag','DOGFIGHT · '+G.cap);}
 else{const a=G.flag[0],b=G.flag[1];setTxt('t0s',Math.round(a.hull/a.maxHull*100)+'%');setTxt('t1s',Math.round(b.hull/b.maxHull*100)+'%');$('t0b').style.width=(a.hull/a.maxHull*100)+'%';$('t1b').style.width=(b.hull/b.maxHull*100)+'%';setTxt('modeTag','FLAGSHIP HULL');}
 dmgFlash=Math.max(0,dmgFlash-dt*1.8);ov('dmg',dmgFlash);shFlash=Math.max(0,shFlash-dt*2.5);ov('flash',shFlash);
 if(keys.Tab){$('board').hidden=false;const t=tm=>'<table><tr><th class="h'+tm+'">'+TEAMS[tm].short+'</th><th>K</th><th>A</th><th>D</th></tr>'+G.ships.filter(s=>s.team===tm).sort((a,b)=>b.kills-a.kills).map(s=>`<tr class="${s.human?'me':''}"><td>${s.name} · ${s.c.role[0]}</td><td>${s.kills}</td><td>${s.assists}</td><td>${s.deaths}</td></tr>`).join('')+'</table>';setHTML('board',t(0)+t(1));}else $('board').hidden=true;}

/* ================= rendering ================= */
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);post=null;}
 cam.aspect=w/h;cam.updateProjectionMatrix();fx.add.U.uScale.value=fx.alpha.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 if(!post){post=cinematic(R,scene,cam,{exposure:1.05,bloom:.75,bloomThreshold:.8,bloomRadius:.55,vignette:.32,saturation:1.15,grain:.02,ao:false,quality:gfx});post.setSize(w,h);}
 post.render();}
addEventListener('resize',()=>{post=null;});

/* ================= menu UI ================= */
const seg=pickers(opts,saveOpts),pickUI=()=>{snd.init();snd.play('ui');renderMenu();};
for(const[id,key,num]of[['o-mode','mode',false],['o-map','map'],['o-diff','diff'],['o-clock','clock'],['o-view','view',false],['o-aim','aim',false],['o-sens','sens']])seg(id,key,num??true,pickUI);
function renderMenu(){seg.sync();
 $('m-note').innerHTML=opts.mode==='fleet'?'<b>FLEET BATTLE</b> — escort the bombers, destroy the two picket frigates to break the flagship\'s shield link, then drop its shields and strike its subsystems. Protect your own flagship.':'<b>DOGFIGHT</b> — five on five through the rocks. CPU wingmen fly with you. First squadron to the kill limit, or the leader when time runs out, wins.';
 $('ships').innerHTML=CLASS_IDS.map(id=>{const c=CLASSES[id];return`<button data-id="${id}" class="${id===opts.cls?'on':''}"><small>${c.role}</small><b>${c.names[0]}</b>${Object.entries(c.stats).map(([k,v])=>`<div class="bar"><span>${k}</span><i style="--v:${v}"></i></div>`).join('')}<p>${c.blurb}</p></button>`;}).join('');
 $('ships').querySelectorAll('button').forEach(b=>b.onclick=()=>{opts.cls=b.dataset.id;saveOpts();snd.init();snd.play('ui');renderMenu();});
 $('best').textContent=bestScore(ID)?'BEST '+bestScore(ID)+' PTS':'';$('go').textContent=opts.mode==='fleet'?'LAUNCH · FLEET BATTLE':'LAUNCH · DOGFIGHT';}
$('go').onclick=()=>start();$('resume').onclick=()=>pause(false);$('quit').onclick=()=>toMenu();$('again').onclick=()=>start();$('o-menu').onclick=()=>toMenu();
postButton($('post'),ID,()=>{const a=lastAward||{};
 return[a.pts||0,`Game: Voidwing\nPoints: ${a.pts||0}\nResult: ${a.won?'victory':'defeat'} · ${a.mode==='fleet'?'Fleet Battle':'Dogfight'} · ${a.map||''} · ${a.diff||''}\nKills: ${a.kills||0}\nStarfighter: ${a.cls||''}`];});

/* ================= loop ================= */
setMap(opts.map);attract();renderMenu();showPanel('menu');
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;frame(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.VOIDWING={get state(){return G.app;},G,W,opts,step:frame,render,start(o={}){start(o);},toMenu,pause,
 get player(){return G.player;},get ships(){return G.ships;},get bots(){return G.ships.filter(s=>!s.human);},get caps(){return G.caps;},get stats(){return G.stats;},get score(){return G.score;},get result(){return G.result;},
 get round(){return{mode:G.mode,clock:G.clock,teamKills:G.tk.slice(),cap:G.cap,phase:G.mode==='fleet'?(G.flag[1].locked?1:G.flag[1].shieldUp()?2:3):0,result:G.result};},
 setClock(s){G.clock=s;},autopilot(on=true){G.auto=on;},keys,edge,setMouse(l,r){mouse.l=l;if(r&&!mouse.r)edge.Fire2=true;mouse.r=r;},aim(dx,dy){mouse.dx+=dx;mouse.dy+=dy;},

 target:t=>{G.target=t;},selectTarget:()=>G.player&&selectTarget(G.player),cycleSub:()=>G.player&&cycleSub(G.player),get lockK(){return G.lockK;},
 killAll(team=1){for(const s of G.ships)if(s.alive&&s.team===team)killShip(s,G.player);},killCap,killSub,win:()=>endMatch('win','TEST'),lose:()=>endMatch('lose','TEST'),
 setQuality:applyQuality,get gfx(){return gfx;},toggleCam:()=>{camMode=camMode==='cockpit'?'chase':'cockpit';},get camMode(){return camMode;},setCam:m=>{camMode=m;},scene,R,cam,fx,bolts,missiles,env,THREE,menuFocus:f=>{menuFocus=f;menuSwitch=99;menuCamT=0;}};
