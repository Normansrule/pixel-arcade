// STRIKE ZONE — fast arena FPS vs CPU fighters: free-for-all, team deathmatch and gun ladder on three original maps.
// Slide + bunny-hop movement, ADS, recoil, headshots, rockets, frags, killcams, medals, scoreboard. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {Level,STEP} from './level.js';
import {MAPS} from './maps.js';
import {buildWorld} from './world.js';
import {FX} from './fx.js';
import {Sound} from './sound.js';
import {WPN,FRAG,CLASSES,LADDER,HP,REGEN_DELAY,REGEN_RATE,falloff,zoneMult,newGun} from './weapons.js';
import {buildViewmodel} from './viewmodel.js';
import {Rig,hitActor,PALETTES} from './actors.js';
import {Brain,DIFF,think,canSee} from './ai.js';
import {HUD,mmss} from './hud.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,D2R=Math.PI/180,TAU=Math.PI*2;
const MV={run:7.3,accel:11,friction:7.2,stop:2.4,airAccel:2.4,airCap:1.05,jump:7.1,grav:20,max:17,crouchMul:.5,adsMul:.66,slideBoost:3.8,slideFric:.85,slideT:.8,slideMin:5.2,slideMax:14,r:.38,h:1.8,hc:1.22,eye:1.62};
const DT=1/120,KC_PRE=3,KC_POST=.6;
const NAMES=['AXLE','BRISK','CINDR','DUSK','EMBER','FROST','GHOST','HALO','IRIS','JINX','KOI','LUMEN','MAKO','NOVA','ONYX','PIXEL','QUARK','RUNE','SPARK','TALON','UMBRA','VOLT','WISP','ZERO','BLAZE','CROW'];
const MEDAL={2:'DOUBLE KILL',3:'TRIPLE KILL',4:'QUAD KILL',5:'PENTA KILL'},STREAK={3:'ON A ROLL',5:'RAMPAGE',8:'UNSTOPPABLE',12:'LEGENDARY'};
const TEAM_ACC=[0xff6a1a,0x3d9bff],TEAM_CSS=['#ff9a5a','#7cbcff'];

/* ================= renderer + scenes ================= */
const canvas=$('c');const Rr=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});Rr.setPixelRatio(Math.min(devicePixelRatio,1.5));Rr.shadowMap.enabled=true;Rr.shadowMap.type=THREE.PCFSoftShadowMap;Rr.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(80,1,.05,1200);cam.rotation.order='YXZ';
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xffffff,0x4a3a30,1.3),vmKey=new THREE.DirectionalLight(0xfff2e0,2.2),vmRim=new THREE.DirectionalLight(0xbcd0ff,1.4),vmFlash=new THREE.PointLight(0xffaa55,0,2.5,1.5);
vmKey.position.set(-1,2,1);vmRim.position.set(2,.6,-1.5);vmFlash.position.set(.12,-.06,-.7);vmScene.add(vmHemi,vmKey,vmRim,vmFlash);
const snd=new Sound();let L=null,world=null,fx=null;const WC={};const VM=buildViewmodel(TEAM_ACC[0]);vmCam.add(VM.root);

/* ================= state ================= */
const G={app:'menu',opt:{mode:'ffa',map:0,cls:0,diff:1,len:360,sens:1,asens:.8,fov:100,vol:.8,mus:.35},actors:[],player:null,mode:'ffa',clock:360,limit:25,teamScore:[0,0],time:0,events:[],pickups:[],rockets:[],frags:[],
 diff:DIFF[1],intel:[null,null],attract:true,hurtFx:0,kc:null,rec:{frames:[],shots:[]},recT:0,idle:false,god:false,firstBlood:false,result:null,cam,V3:V,spreadNow:0,aimedAt:null,shake:0};
try{Object.assign(G.opt,JSON.parse(localStorage.getItem('pxd_strike_opt'))||{});}catch(e){}
if(!['ffa','tdm','ladder'].includes(G.opt.mode))G.opt.mode='ffa';G.opt.map=cl(+G.opt.map||0,0,2);G.opt.cls=cl(+G.opt.cls||0,0,4);G.opt.diff=cl(+G.opt.diff||0,0,2);if(![240,360,600].includes(+G.opt.len))G.opt.len=360;
G.enemies=(a,b)=>a!==b&&(G.mode!=='tdm'||a.team!==b.team);
G.leader=(ex)=>{let b=null;for(const a of G.actors){if(a===ex)continue;if(!b||(G.mode==='ladder'?a.ladder>b.ladder||a.ladder===b.ladder&&a.stats.k>b.stats.k:a.stats.k>b.stats.k))b=a;}return b;};
G.wname=a=>{const g=a.slots[0];return g?g.w.name:'';};

/* ================= actors ================= */
class Actor{constructor(id,name,team,isPlayer,pal,key){Object.assign(this,{id,name,team,isPlayer,pos:new V(),vel:new V(),yaw:0,pitch:0,onGround:true,hp:HP,alive:false,slots:[null,null,null],cur:0,prev:1,reloadT:0,reloadKind:'mag',switchT:0,nextFire:0,meleeNext:0,
  recoil:{x:0,y:0},bloom:0,adsK:0,frags:2,crouchV:0,slideV:0,slideT:0,slideCD:0,lastHurt:-9,lastAttacker:null,lastFire:-9,dmgBy:new Map(),spawnProt:0,deathT:0,respawnT:0,padCD:0,stepAcc:0,ladder:0,clsIdx:0,stun:0,hurtNow:false,jumpHeld:false,
  ctl:{mx:0,mz:0,jump:false,crouch:false,slide:false,fire:false,ads:false,reload:false},stats:{k:0,d:0,a:0,hs:0,score:0,streak:0,best:0,dmg:0,shots:0,hits:0,multi:0,multiT:-9},pal,css:'#'+new THREE.Color(pal.acc).getHexString(),light:1,lightT:0,eyeY:undefined});
  this.rig=new Rig(pal,key);this.rig.root.visible=false;scene.add(this.rig.root);if(!isPlayer)this.brain=new Brain(this);}
 eyeH(){return MV.eye-this.crouchV*.52-this.slideV*.62;}headH(){return 1.66-Math.max(this.crouchV,this.slideV)*.5;}
 gun(){return this.slots[this.cur];}}
function roster(attract){for(const a of G.actors){scene.remove(a.rig.root);a.rig.dispose();}G.actors=[];const names=NAMES.slice().sort(()=>R()-.5);let user=userName();
 const tdm=G.mode==='tdm';const n=tdm?10:attract?7:8;let id=0;
 for(let i=0;i<n;i++){const human=!attract&&i===0;const team=tdm?(i<5?0:1):-1;let pal;
  if(tdm){const b=PALETTES[(i%5)+(team?4:0)]||PALETTES[i%PALETTES.length];pal={...b,acc:TEAM_ACC[team],suit:team?0x4e5c72:0x6e5e50};}else pal=PALETTES[i%PALETTES.length];
  const a=new Actor(id++,human?(user?user.toUpperCase().slice(0,10):'YOU'):names.pop(),team,human,pal,(tdm?'t'+team:'f')+(i%9));a.clsIdx=human?G.opt.cls:pickClass();G.actors.push(a);}
 G.player=G.actors.find(a=>a.isPlayer)||null;}
function pickClass(){const r=R();return r<.3?0:r<.52?1:r<.68?2:r<.82?3:4;}
function loadout(a){if(G.mode==='ladder'){a.slots=[newGun(LADDER[a.ladder]),null,null];a.frags=0;}else{const c=CLASSES[a.clsIdx];a.slots=[newGun(c.p),newGun(c.s),null];a.frags=FRAG.per;}a.cur=0;a.prev=1;a.reloadT=0;a.switchT=0;a.recoil.x=a.recoil.y=0;a.bloom=0;a.adsK=0;}
function spawnPoint(a){const list=L.spawns.filter(s=>G.mode!=='tdm'||s.team===a.team);let best=null,bs=-1e9;
 for(const s of list){let md=60;for(const e of G.actors){if(!e.alive||!G.enemies(a,e))continue;const d=Math.hypot(e.pos.x-s.x,e.pos.z-s.z)+Math.abs(e.pos.y-s.y);md=Math.min(md,d);if(d<45&&L.los(e.pos.x,e.pos.y+1.6,e.pos.z,s.x,s.y+1.5,s.z))md-=22;}
  for(const e of G.actors)if(e.alive&&e!==a&&Math.hypot(e.pos.x-s.x,e.pos.z-s.z)<1.2)md-=30;const sc=md+R()*6-(s.used&&G.time-s.used<3?25:0);if(sc>bs){bs=sc;best=s;}}
 best.used=G.time;return best;}
function spawnActor(a){const s=spawnPoint(a);a.pos.set(s.x+(R()-.5)*.6,s.y,s.z+(R()-.5)*.6);a.pos.y=L.groundAt(a.pos.x,a.pos.z,s.y+.3,.3);a.vel.set(0,0,0);a.yaw=s.yaw+(R()-.5)*.3;a.pitch=0;a.hp=HP;a.alive=true;a.onGround=true;a.crouchV=a.slideV=0;a.slideT=0;a.spawnProt=1.6;
 a.lastHurt=-9;a.lastAttacker=null;a.dmgBy.clear();a.stun=0;loadout(a);a.rig.die=0;a.rig.root.visible=!a.isPlayer;a.rig.setGun(a.gun().id);a.eyeY=undefined;if(a.brain)a.brain.reset();
 if(a.isPlayer){equipVM(a,true);G.kc=null;document.body.classList.remove('kc');hud.dead(false);snd.spawn();}if(fx)fx.spawnFx(a.pos,a.pal.acc);}

/* ================= map + match flow ================= */
function loadMap(i){const def=MAPS[i];if(world)scene.remove(world.group);if(!WC[def.id]){const lv=new Level(def);WC[def.id]={L:lv,W:buildWorld(lv,Rr)};}
 L=WC[def.id].L;world=WC[def.id].W;G.L=L;scene.add(world.group);scene.fog=world.fog;scene.environment=world.env;vmScene.environment=world.env;scene.background=new THREE.Color(world.M.fog[0]);
 const m=world.mood;vmHemi.color.set(m==='noon'?0xfff4e4:m==='night'?0x9aa8e0:0xffd8c0);vmHemi.intensity=m==='noon'?1.5:m==='night'?1.15:1.25;vmKey.color.set(m==='night'?0xc0d0ff:0xfff0d8);vmKey.intensity=m==='noon'?2.4:1.8;vmRim.color.set(m==='night'?0xff60c0:m==='dusk'?0xff9050:0xbcd0ff);
 if(!fx){fx=new FX(scene);G.fx=fx;}fx.clear();for(const p of G.pickups)scene.remove(p.mesh);G.pickups=L.pickups.map(p=>({...p,active:true,t:0,mesh:pickupMesh(p.k)}));for(const p of G.pickups){p.mesh.position.set(p.x,p.y+.55,p.z);scene.add(p.mesh);}
 hud.buildMini(L);fxStack=null;Rr.shadowMap.needsUpdate=true;applyShadow();}
function setupMatch(attract){G.attract=attract;G.mode=attract?'ffa':G.opt.mode;G.diff=DIFF[attract?2:G.opt.diff];roster(attract);G.teamScore=[0,0];G.events.length=0;G.intel=[null,null];G.firstBlood=false;G.result=null;G.warned=false;G.rec.frames.length=0;G.rec.shots.length=0;G.kc=null;
 for(const r of G.rockets)scene.remove(r.mesh);G.rockets.length=0;for(const f of G.frags)scene.remove(f.mesh);G.frags.length=0;for(const p of G.pickups){p.active=true;p.mesh.visible=true;}
 const len=G.opt.len;G.clock=attract?1e9:len;G.limit=G.mode==='tdm'?(len<=240?40:len<=360?50:75):G.mode==='ladder'?LADDER.length:(len<=240?20:len<=360?25:35);
 for(const a of G.actors){a.ladder=0;spawnActor(a);}hud.clear();}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setMusic(G.opt.mus);
 if(!L||L.def!==MAPS[G.opt.map])loadMap(G.opt.map);setupMatch(false);G.app='play';hud.show(true);['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.add('playing');
 const mn={ffa:'FREE FOR ALL',tdm:'TEAM DEATHMATCH',ladder:'GUN LADDER'}[G.mode];hud.banner(mn,L.def.name+' · '+(G.mode==='ladder'?'9 WEAPONS · KNIFE TO WIN':'FIRST TO '+G.limit)+' · '+mmss(G.clock),'#ff8a3d',3);snd.music(2);snd.beep(true);lock();}
function attractMode(){G.app='menu';if(!L||L.def!==MAPS[G.opt.map])loadMap(G.opt.map);setupMatch(true);hud.show(false);VM.root.visible=false;snd.music(0);updateBest();menuTgt=null;}
function toMenu(){unlock();['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing','kc');hud.board(false);hud.dead(false);$('scope').hidden=true;attractMode();}

/* ================= weapons ================= */
const ro={t:0,i:-1,nx:0,ny:0,nz:0},tv=new V(),tv2=new V(),tv3=new V();
function viewDir(a,out=new V()){const y=a.yaw+a.recoil.x*D2R,p=a.pitch+a.recoil.y*D2R;return out.set(-Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p));}
function eyeOf(a,out=new V()){return out.set(a.pos.x,a.pos.y+a.eyeH(),a.pos.z);}
function equipVM(a,instant){const g=a.gun();VM.set(g.id,g.w.cls==='ar'?'rifle':g.w.cls);if(instant)VM.st.equip=.7;}
function equipTime(w){return w.cls==='sniper'||w.cls==='lmg'||w.cls==='rl'?.6:w.cls==='knife'?.25:w.cls==='pistol'||w.cls==='revolver'?.35:.45;}
function switchTo(a,slot,force){if(!a.slots[slot]||(slot===a.cur&&!force)||!a.alive)return;if(a.cur!==slot)a.prev=a.cur;a.cur=slot;a.reloadT=0;a.adsK=0;a.bloom=0;const w=a.gun().w;a.switchT=force?.15:equipTime(w);a.rig.setGun(a.gun().id);if(a.isPlayer){equipVM(a);VM.cancelReload();snd.reload('draw');}}
G.switchTo=switchTo;
function reload(a){const g=a.gun();if(!g||g.w.melee||g.mag>=g.w.mag||g.res<=0||a.reloadT>0||a.switchT>0)return;const w=g.w;a.adsK*=.3;
 if(w.shell){a.reloadKind='shell';a.reloadT=w.shell+(g.mag===0?.2:0);if(a.isPlayer){VM.reload(a.reloadT,'shell');snd.reload('shell');}}
 else{const empty=g.mag===0;a.reloadKind='mag';a.reloadT=empty?w.reloadE:w.reload;if(a.isPlayer){VM.reload(a.reloadT,w.cls==='revolver'?'cyl':w.cls==='rl'?'rocket':'mag',empty);snd.reload(w.cls==='revolver'?'cyl':w.cls==='rl'?'rocket':'magout');a.reloadSnd=0;}}
 a.rig.reloadT=1;}
G.reload=reload;
function finishReload(a){const g=a.gun();if(!g)return;const w=g.w;if(w.shell){g.mag++;g.res--;if(a.isPlayer)snd.reload('shell');if(g.mag<w.mag&&g.res>0){a.reloadT=w.shell;if(a.isPlayer)VM.reload(w.shell,'shell');}else if(a.isPlayer){VM.pump();snd.reload('pump');}return;}
 const take=Math.min(w.mag-g.mag,g.res);g.mag+=take;g.res-=take;a.rig.reloadT=0;}
function spreadOf(a,w){const sp=w.sp;const hs=Math.hypot(a.vel.x,a.vel.z);const mv=cl((hs-1.5)/5.5,0,1);const base=sp.hip+(sp.ads-sp.hip)*a.adsK;return base*(a.crouchV>.6?.8:1)+sp.move*mv*(1-a.adsK*.5)+(a.onGround?0:sp.air)+a.bloom+(a.slideV>.5?sp.move*.5:0);}
function fire(a){const g=a.gun();if(!g||!a.alive||a.switchT>0||G.time<a.nextFire||a.stun>0)return false;const w=g.w;
 if(w.melee)return melee(a);
 if(a.reloadT>0){if(w.shell&&g.mag>0){a.reloadT=0;if(a.isPlayer)VM.cancelReload();}else return false;}
 if(g.mag<=0){a.nextFire=G.time+.22;if(a.isPlayer)snd.dry();if(g.res>0)reload(a);return false;}
 g.mag--;a.nextFire=G.time+w.rate;a.spawnProt=0;a.lastFire=G.time;a.stats.shots++;
 const spread=spreadOf(a,w);a.bloom=Math.min(w.sp.max,a.bloom+w.sp.bloom);const eye=eyeOf(a,new V()),dir=viewDir(a,new V());
 const up=Math.abs(dir.y)>.95?new V(1,0,0):new V(0,1,0);const rt=new V().crossVectors(dir,up).normalize(),u2=new V().crossVectors(rt,dir).normalize();const mz=muzzlePos(a);
 if(w.proj){L.ray(eye.x,eye.y,eye.z,dir.x,dir.y,dir.z,300,ro);const tgt=eye.clone().addScaledVector(dir,Math.min(300,ro.t));const from=mz.clone();if(tgt.distanceTo(eye)<2)from.copy(eye).addScaledVector(dir,.4);const v=tgt.sub(from).normalize().multiplyScalar(w.pspeed);launchRocket(a,from,v,w);}
 else{const n=w.pellets||1;let hit=false,head=false,kill=false,whiz=false;for(let i=0;i<n;i++){const r=spread*Math.sqrt(R()),th=R()*TAU;const d=tv3.copy(dir).addScaledVector(rt,Math.cos(th)*r).addScaledVector(u2,Math.sin(th)*r).normalize();const res=trace(a,eye,d,w,i,mz);if(res){hit=true;if(res.head)head=true;if(res.kill)kill=true;}if(res&&res.whiz)whiz=true;}
  if(hit)a.stats.hits++;if(a.isPlayer&&hit){hud.hitmark(kill?'kill':head?'head':'body');snd.hit(kill?'kill':head?'head':'body');}}
 // recoil kick
 const rc=w.rc,ak=1-(1-rc.ads)*a.adsK,ck=a.crouchV>.6?.8:1;a.recoil.y+=rc.v*ak*ck*(.85+R()*.3)*(a.isPlayer?1:.75);a.recoil.x+=(R()-.5)*2*rc.h*ak;
 // effects + sound
 const cls=w.cls==='ar'?'rifle':w.cls;fx.muzzle(mz,dir,w.cls==='shotgun'||w.cls==='sniper'||w.cls==='revolver'?1.6:w.cls==='rl'?1.3:1,w.cls==='rl'?0xffa040:0xffb060);snd.shot(cls,mz,a.isPlayer);
 if(a.isPlayer){VM.fire(w.kick);vmFlash.intensity=w.cls==='rl'?2:5;G.shake=Math.max(G.shake,w.cls==='shotgun'||w.cls==='sniper'?.22:w.cls==='rl'?.3:.05);if(w.pump){setTimeout(()=>{if(a.gun()&&a.gun().w===w){VM.pump();snd.reload('pump');ejectBrass(a,true);}},170);}if(w.bolt){setTimeout(()=>{if(a.gun()&&a.gun().w===w){VM.bolt(.62);snd.reload('bolt');ejectBrass(a,true);}},260);}}
 else a.rig.fired();
 if(!w.pump&&!w.bolt&&w.cls!=='revolver'&&w.cls!=='rl')ejectBrass(a,false);
 G.events.push({t:G.time,x:a.pos.x,y:a.pos.y,z:a.pos.z,kind:'shot',who:a,team:a.team});
 if(g.mag===0&&g.res>0)setTimeout(()=>{if(a.alive&&a.gun()===g&&g.mag===0)reload(a);},w.bolt?600:180);
 return true;}
G.fire=fire;
function ejectBrass(a,big){if(!a.isPlayer&&Math.hypot(a.pos.x-cam.position.x,a.pos.z-cam.position.z)>18)return;let p,v;
 if(a.isPlayer&&!G.kc){p=VM.ejectCam(new V());p.applyMatrix4(cam.matrixWorld);const r=new V(Math.cos(a.yaw),0,-Math.sin(a.yaw));v=r.multiplyScalar(2.2+R()).add(new V(0,2+R(),0)).add(a.vel.clone().multiplyScalar(.8));}
 else{p=a.rig.muzzleWorld(new V());p.y-=.05;const r=new V(Math.cos(a.yaw),0,-Math.sin(a.yaw));v=r.multiplyScalar(-2).add(new V(0,2,0));}fx.brass.add(p,v,big?1.6:1);}
function muzzlePos(a){if(a.isPlayer&&!a.thirdP){const p=VM.muzzleCam(new V());cam.updateMatrixWorld();return p.applyMatrix4(cam.matrixWorld);}return a.rig.muzzleWorld(new V());}
function trace(a,o,d,w,i,mz){const maxT=260;L.ray(o.x,o.y,o.z,d.x,d.y,d.z,maxT,ro);const tw=Math.min(maxT,ro.t);let hitA=null,hp=null;
 for(const e of G.actors){if(!e.alive||e===a||!G.enemies(a,e))continue;const h=hitActor(e,o.x,o.y,o.z,d.x,d.y,d.z,tw);if(h&&(!hp||h.t<hp.t)){hp=h;hitA=e;}}
 const tracer=i===0&&(!a.isPlayer||w.cls==='lmg'||w.cls==='smg'||w.cls==='rifle'||w.cls==='ar'||w.cls==='sniper')&&(a.isPlayer?(a.stats.shots%2===0||w.cls==='sniper'):true);let res=null,end;
 // near-miss whiz past the player's head
 const P=G.player;if(P&&a!==P&&P.alive&&i===0){const hx=P.pos.x-o.x,hy=P.pos.y+1.6-o.y,hz=P.pos.z-o.z;const t=hx*d.x+hy*d.y+hz*d.z;if(t>2&&t<(hp?hp.t:tw)){const px=hx-d.x*t,py=hy-d.y*t,pz=hz-d.z*t;if(px*px+py*py+pz*pz<1.4&&hitA!==P){const[,pan]=snd.at(P.pos);snd.whiz(-pan);}}}
 if(hitA){end=new V(o.x+d.x*hp.t,o.y+d.y*hp.t,o.z+d.z*hp.t);const dmg=w.dmg*falloff(w,hp.t)*zoneMult(w,hp.part);fx.hit(end,d,hp.part==='head');const was=hitA.alive;damage(hitA,a,dmg,hp.part,w,d.clone());res={head:hp.part==='head',kill:was&&!hitA.alive};}
 else if(ro.i!==-1&&ro.t<maxT){end=new V(o.x+d.x*ro.t,o.y+d.y*ro.t,o.z+d.z*ro.t);const n=new V(ro.nx,ro.ny,ro.nz);const mat=ro.i===-2?(L.def.floor||'asphalt'):L.boxes[ro.i].m;fx.impact(end,n,mat,w.cls==='sniper'?1.6:1);if(i===0||R()<.25)snd.impact(end,mat==='metal'||mat==='steel'||mat==='plate'||mat==='container'||mat==='painted');}
 else end=new V(o.x+d.x*maxT,o.y+d.y*maxT,o.z+d.z*maxT);
 if(tracer)fx.tracers.fire(mz,end,a.isPlayer?0xffe0a0:0xffc070,{skip:a.isPlayer?2:.5,w:w.cls==='sniper'?.04:.022,len:w.cls==='sniper'?9:5});
 if(i===0)G.rec.shots.push({t:G.time,a:a.id,f:[mz.x,mz.y,mz.z],e:[end.x,end.y,end.z]});
 if(!res&&a!==P&&P&&false)res={};return res||(hitA?null:null);}
function melee(a){const g=a.gun();const knife=g&&g.w.melee;if(G.time<a.meleeNext||!a.alive||a.switchT>0)return false;a.meleeNext=G.time+(knife?g.w.rate:.8);a.nextFire=Math.max(a.nextFire,G.time+(knife?g.w.rate:.5));a.reloadT=0;a.spawnProt=0;
 if(a.isPlayer){VM.melee();VM.cancelReload();}else{a.rig.throwT=.6;}snd.knife(false,a.pos,a.isPlayer);const eye=eyeOf(a,new V()),dir=viewDir(a,new V());const f=new V(-Math.sin(a.yaw),0,-Math.cos(a.yaw));
 let best=null,bd=9;for(const e of G.actors){if(!e.alive||e===a||!G.enemies(a,e))continue;const dx=e.pos.x-a.pos.x,dz=e.pos.z-a.pos.z,dy=e.pos.y-a.pos.y;const d=Math.hypot(dx,dz);if(d>2.4||Math.abs(dy)>1.6)continue;if((dx*f.x+dz*f.z)/(d||1)<.55&&d>.8)continue;if(!L.los(eye.x,eye.y,eye.z,e.pos.x,e.pos.y+1.2,e.pos.z))continue;if(d<bd){bd=d;best=e;}}
 if(best){const ef=new V(-Math.sin(best.yaw),0,-Math.cos(best.yaw));const back=ef.dot(f)>.4;const dmg=knife?(back?g.w.back:g.w.dmg):(back?100:50);const was=best.alive;damage(best,a,dmg,'body',knife?g.w:{id:'melee',name:'MELEE',cls:'melee'},dir);snd.knife(true,best.pos,a.isPlayer);fx.hit(new V(best.pos.x,best.pos.y+1.2,best.pos.z),dir,false);
  if(a.isPlayer){hud.hitmark(was&&!best.alive?'kill':'body');snd.hit(was&&!best.alive?'kill':'body');if(back&&was&&!best.alive)hud.medal('BACKSTAB',50);}}
 else{L.ray(eye.x,eye.y,eye.z,dir.x,dir.y,dir.z,2.2,ro);if(ro.t<2.2){fx.impact(new V(eye.x+dir.x*ro.t,eye.y+dir.y*ro.t,eye.z+dir.z*ro.t),new V(ro.nx,ro.ny,ro.nz),'concrete',.6);}}return true;}
G.melee=melee;

/* ================= rockets + frags ================= */
const rocketGeo=new THREE.ConeGeometry(.07,.42,8);rocketGeo.rotateX(-Math.PI/2);const rocketMat=new THREE.MeshStandardMaterial({color:0x8a2a1a,roughness:.5,metalness:.4,emissive:0xff6020,emissiveIntensity:.6});
function launchRocket(a,from,v,w){const m=new THREE.Mesh(rocketGeo,rocketMat);m.position.copy(from);scene.add(m);G.rockets.push({owner:a,pos:from.clone(),vel:v,t:0,mesh:m,w});}
function stepRockets(dt){for(let i=G.rockets.length-1;i>=0;i--){const r=G.rockets[i];r.t+=dt;const sp=r.vel.length(),d=tv.copy(r.vel).divideScalar(sp),len=sp*dt;let hitT=len+1,who=null;
  L.ray(r.pos.x,r.pos.y,r.pos.z,d.x,d.y,d.z,len,ro);if(ro.t<len)hitT=ro.t;for(const e of G.actors){if(!e.alive||e===r.owner&&r.t<.3)continue;if(e!==r.owner&&!G.enemies(r.owner,e))continue;const h=hitActor(e,r.pos.x,r.pos.y,r.pos.z,d.x,d.y,d.z,Math.min(hitT,len));if(h&&h.t<hitT){hitT=h.t;who=e;}}
  if(hitT<=len||r.t>5){const p=r.pos.clone().addScaledVector(d,Math.min(hitT,len));if(who){damage(who,r.owner,r.w.dmg*.45,'body',r.w,d.clone());}explode(p,r.owner,r.w.sdmg,r.w.splash,r.w,ro.t<len&&!who?new V(ro.nx,ro.ny,ro.nz):null);scene.remove(r.mesh);G.rockets.splice(i,1);continue;}
  r.pos.addScaledVector(r.vel,dt);r.mesh.position.copy(r.pos);r.mesh.lookAt(r.pos.x+d.x,r.pos.y+d.y,r.pos.z+d.z);fx.rocketTrail(r.pos,d);}}
function explode(p,owner,dmg,rad,w,n){fx.explosion(p,rad>5?1.1:.9);snd.boom(p,1);if(n&&n.y>.5)fx.scorch.add(p.clone().addScaledVector(n,.02),n,1);else{const gy=L.groundAt(p.x,p.z,p.y+.3,.1);if(p.y-gy<1.2)fx.scorch.add(new V(p.x,gy+.02,p.z),new V(0,1,0),1);}
 const dc=cam.position.distanceTo(p);if(dc<22)G.shake=Math.max(G.shake,.55*(1-dc/22));G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'boom',who:owner,team:owner?owner.team:-1});
 for(const e of G.actors){if(!e.alive)continue;const c=tv2.set(e.pos.x,e.pos.y+1,e.pos.z);const d=c.distanceTo(p);if(d>rad)continue;if(!L.los(p.x,p.y+.1,p.z,c.x,c.y,c.z)&&!L.los(p.x,p.y+.1,p.z,c.x,c.y+.6,c.z))continue;const k=1-d/rad;
  const self=e===owner;if(!self&&owner&&!G.enemies(owner,e))continue;const push=tv3.copy(c).sub(p).normalize();e.vel.addScaledVector(push,(self?9:5)*k+1.5);e.vel.y=Math.max(e.vel.y,0)+(self?5.5:3)*k;e.onGround=false;
  const was=e.alive;damage(e,owner,dmg*(.3+.7*k)*(self?.35:1),'body',w,push.clone());if(owner&&owner.isPlayer&&!self&&was){hud.hitmark(!e.alive?'kill':'body');snd.hit(!e.alive?'kill':'body');}}}
const fragGeo=new THREE.SphereGeometry(.07,10,8),fragMat=new THREE.MeshStandardMaterial({color:0x4b5530,roughness:.6,metalness:.2});
function throwFrag(a,target){if(a.frags<=0||!a.alive)return false;a.frags--;a.spawnProt=0;const eye=eyeOf(a,new V());let vel;
 if(target){const T=cl(Math.hypot(target.x-eye.x,target.z-eye.z)/13,.5,1.6);vel=new V((target.x-eye.x)/T,(target.y+.3-eye.y)/T+.5*12.5*T,(target.z-eye.z)/T);if(vel.length()>21)vel.setLength(21);}
 else{vel=viewDir(a,new V()).multiplyScalar(17);vel.y+=2.6;vel.add(a.vel.clone().multiplyScalar(.6));}
 const m=new THREE.Mesh(fragGeo,fragMat);m.castShadow=true;m.position.copy(eye);scene.add(m);G.frags.push({owner:a,pos:eye.clone().addScaledVector(vel.clone().normalize(),.35),vel,t:0,mesh:m});if(a.isPlayer){VM.throwIt();snd.throwIt();}else a.rig.throwT=1;return true;}
G.throwFrag=throwFrag;
function stepFrags(dt){const g=12.5;for(let i=G.frags.length-1;i>=0;i--){const n=G.frags[i];n.t+=dt;for(let s=0;s<3;s++){const h=dt/3;n.vel.y-=g*h;const sp=n.vel.length();if(sp<1e-4)continue;const dx=n.vel.x/sp,dy=n.vel.y/sp,dz=n.vel.z/sp;L.ray(n.pos.x,n.pos.y,n.pos.z,dx,dy,dz,sp*h+.07,ro);
   if(ro.t<sp*h+.07){n.pos.addScaledVector(n.vel,Math.max(0,ro.t-.07)/sp);const vn=n.vel.x*ro.nx+n.vel.y*ro.ny+n.vel.z*ro.nz;n.vel.x-=1.55*vn*ro.nx;n.vel.y-=1.55*vn*ro.ny;n.vel.z-=1.55*vn*ro.nz;n.vel.multiplyScalar(ro.ny>.7?.5:.68);if(Math.abs(vn)>2)snd.bounce(n.pos);}else n.pos.addScaledVector(n.vel,h);}
  n.mesh.position.copy(n.pos);n.mesh.rotation.x+=dt*8;if(n.t>=FRAG.fuse||n.pos.y<L.killY){if(n.pos.y>=L.killY)explode(n.pos.clone(),n.owner,FRAG.dmg,FRAG.radius,{id:'frag',name:'FRAG',cls:'frag'},null);scene.remove(n.mesh);G.frags.splice(i,1);}}}

/* ================= damage + kills ================= */
function damage(v,a,amount,part,w,dir){if(!v.alive||G.app==='over')return;if(v.spawnProt>0&&a!==v)return;if(v.isPlayer&&G.god)return;amount=Math.max(1,Math.round(amount));
 v.hp-=amount;v.lastHurt=G.time;if(a&&a!==v){v.lastAttacker=a;a.stats.dmg+=Math.min(amount,v.hp+amount);v.dmgBy.set(a,(v.dmgBy.get(a)||0)+amount);}v.hurtNow=true;v.rig.hit();
 if(v.isPlayer){const src=a&&a!==v?a.pos:null;if(src)hud.hurt(Math.atan2(src.x-v.pos.x,src.z-v.pos.z));snd.hurt(Math.min(1,amount/40));G.hurtFx=Math.min(1,G.hurtFx+amount/45);v.punch=(v.punch||0)+Math.min(3,amount*.06);G.shake=Math.max(G.shake,Math.min(.3,amount/120));}
 if(v.hp<=0)kill(v,a,w,part==='head',dir);}
function kill(v,a,w,head,dir){v.alive=false;v.hp=0;v.stats.d++;v.stats.streak=0;v.deathT=G.time;v.respawnT=G.time+(v.isPlayer?4.4:3.2);v.reloadT=0;v.slots[2]=null;
 const dd=dir?dir.clone():new V(0,0,1);const inv=new V(Math.cos(v.yaw),0,-Math.sin(v.yaw)),fw=new V(-Math.sin(v.yaw),0,-Math.cos(v.yaw));v.rig.dieDir.set(dd.dot(inv),0,dd.dot(fw)*-1);
 const wn=w&&w.name?w.name:'WORLD';let feedW=wn;
 if(a&&a!==v){a.stats.k++;a.stats.streak++;a.stats.best=Math.max(a.stats.best,a.stats.streak);if(head)a.stats.hs++;let pts=100+(head?50:0);const dist=Math.hypot(a.pos.x-v.pos.x,a.pos.z-v.pos.z);
  if(G.time-a.stats.multiT<3.5)a.stats.multi++;else a.stats.multi=1;a.stats.multiT=G.time;if(a.stats.multi>=2)pts+=50*(a.stats.multi-1);if(!G.firstBlood){G.firstBlood=true;pts+=50;if(a.isPlayer)hud.medal('FIRST BLOOD',50);}
  if(a.isPlayer){hud.medal(v.name+(head?' · HEADSHOT':''),head?150:100,head?'hs':'');if(dist>40&&w&&!w.melee)hud.medal('LONGSHOT',50);if(a.stats.multi>=2){hud.banner(MEDAL[Math.min(5,a.stats.multi)],'+'+50*(a.stats.multi-1)+' BONUS','#ffd04a',1.6);snd.streak(a.stats.multi);}
   if(STREAK[a.stats.streak]){hud.banner(STREAK[a.stats.streak],a.stats.streak+' KILLS WITHOUT DYING','#ff8a3d',2);snd.streak(a.stats.streak>=8?6:4);}if(a.nemesis===v){hud.medal('PAYBACK',50);pts+=50;a.nemesis=null;}if(dist>40)pts+=50;}
  a.stats.score+=pts;v.nemesis=a;
  for(const[b,d]of v.dmgBy){if(b!==a&&b.alive!==undefined&&d>=30&&G.enemies(b,v)){b.stats.a++;b.stats.score+=40;if(b.isPlayer)hud.medal('ASSIST',40);}}
  if(G.mode==='tdm')G.teamScore[a.team]++;
  if(G.mode==='ladder'){if(w&&w.melee&&v.ladder>0){v.ladder--;if(v.isPlayer)hud.banner('DEMOTED','KNIFED BACK TO '+WPN[LADDER[v.ladder]].name,'#ff5a3a',2);}advanceLadder(a);}}
 else if(a===v||!a){v.stats.score=Math.max(0,v.stats.score-50);if(G.mode==='ffa'&&v.stats.k>0&&false)v.stats.k--;feedW=a===v?wn:L.killY>v.pos.y?'FELL':'WORLD';}
 hud.feed({k:a&&a!==v?a.name:'',kt:a?a.team:-1,kc:G.mode==='tdm'?null:a?a.css:null,v:v.name,vt:v.team,vc:G.mode==='tdm'?null:v.css,w:feedW,hs:head,me:(a&&a.isPlayer)||v.isPlayer});
 if(v.isPlayer){VM.root.visible=false;$('scope').hidden=true;hud.board(false);snd.death();startDeath(a&&a!==v?a:null,w);}
 if(G.app==='play'&&!G.attract){if(G.mode==='ffa'&&a&&a.stats.k>=G.limit)endMatch('limit');else if(G.mode==='tdm'&&a&&G.teamScore[a.team]>=G.limit)endMatch('limit');}}
function advanceLadder(a){a.ladder++;if(a.ladder>=LADDER.length){a.ladder=LADDER.length-1;if(G.app==='play'&&!G.attract)endMatch('limit',a);else{for(const b of G.actors)b.ladder=0;}return;}
 a.slots=[newGun(LADDER[a.ladder]),null,null];a.cur=0;a.reloadT=0;a.switchT=.2;a.rig.setGun(a.gun().id);if(a.isPlayer){equipVM(a);hud.medal('NEXT · '+a.gun().w.name,0);if(a.ladder===LADDER.length-1)hud.banner('FINAL TIER','GET A KNIFE KILL TO WIN','#ffd04a',2.2);}}

/* ================= death, killcam, respawn ================= */
function startDeath(killer,w){const P=G.player;G.kc={killer,w,t:0,phase:'down',deathT:G.time,idx:killer?killer.id:-1};document.body.classList.add('kc');
 hud.dead(true,{by:killer?killer.name:'YOU FELL',col:killer?killer.css:'#fff',w:killer?(w&&w.name?w.name:'')+(killer.alive?' · '+Math.max(1,Math.ceil(killer.hp))+' HP LEFT':''):''});$('deadt').textContent='';classText();}
function classText(){$('deadcls').innerHTML=G.mode==='ladder'?'':'NEXT LIFE: '+CLASSES.map((c,i)=>`<b style="${i===G.opt.cls?'':'color:#888'}">${i+1} ${c.name}</b>`).join(' · ');}
function stepDeath(dt){const k=G.kc;if(!k)return;k.t+=dt;const P=G.player;
 if(k.phase==='down'&&k.t>.9){if(k.killer&&G.rec.frames.length){k.phase='cam';k.rt=Math.max(G.rec.frames[0].t,k.deathT-KC_PRE);k.end=k.deathT+KC_POST;k.vmGun=null;$('deadt').textContent='SPACE / CLICK TO SKIP';}else{k.phase='wait';k.wt=0;}}
 else if(k.phase==='cam'){k.rt+=dt;if(k.rt>=k.end||k.skip){k.phase='wait';k.wt=0;VM.root.visible=false;}}
 else if(k.phase==='wait'){k.wt+=dt;$('deadt').textContent='RESPAWN IN '+Math.max(0,P.respawnT-G.time).toFixed(1)+' · SPACE';if(G.time>=P.respawnT||k.skip&&G.time>=P.respawnT-1.5){spawnActor(P);}}}
function recSample(){const fr={t:G.time,s:G.actors.map(a=>{const c=Math.cos(a.yaw),s=Math.sin(a.yaw);const fw=-(a.vel.x*s+a.vel.z*c),sd=a.vel.x*c-a.vel.z*s;return[a.pos.x,a.pos.y,a.pos.z,a.yaw,a.pitch+a.recoil.y*D2R,a.alive?1:0,a.gun()?a.gun().id:'ar',a.crouchV,a.slideV,fw,sd,a.onGround?0:1,G.time-a.lastFire<.06?1:0,a.adsK];})};
 const F=G.rec.frames;F.push(fr);while(F.length&&F[0].t<G.time-6)F.shift();const S=G.rec.shots;while(S.length&&S[0].t<G.time-6)S.shift();}
function recAt(t){const F=G.rec.frames;if(!F.length)return null;let i=0;while(i<F.length-1&&F[i+1].t<=t)i++;const a=F[i],b=F[Math.min(F.length-1,i+1)];const k=b.t>a.t?cl((t-a.t)/(b.t-a.t),0,1):0;
 return a.s.map((s,j)=>{const q=b.s[j]||s;const ly=(x,y)=>x+(y-x)*k;let dy=q[3]-s[3];while(dy>Math.PI)dy-=TAU;while(dy<-Math.PI)dy+=TAU;return[ly(s[0],q[0]),ly(s[1],q[1]),ly(s[2],q[2]),s[3]+dy*k,ly(s[4],q[4]),k<.5?s[5]:q[5],s[6],ly(s[7],q[7]),ly(s[8],q[8]),ly(s[9],q[9]),ly(s[10],q[10]),s[11],Math.max(s[12],q[12]),ly(s[13],q[13])];});}

/* ================= movement ================= */
function accel(v,wx,wz,ws,acc,dt,cap){const cur=v.x*wx+v.z*wz;const add=(cap??ws)-cur;if(add<=0)return;let a=acc*ws*dt;if(a>add)a=add;v.x+=a*wx;v.z+=a*wz;}
function moveActor(a,dt){const c=a.ctl,v=a.vel,p=a.pos;const g=a.gun();const w=g?g.w:WPN.knife;let wx=c.mx,wz=c.mz;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}const wn=Math.hypot(wx,wz);
 if(a.stun>0){wx=wz=0;}
 const hs=Math.hypot(v.x,v.z);
 if(c.slide&&a.onGround&&a.slideT<=0&&a.slideCD<=0&&hs>MV.slideMin){a.slideT=MV.slideT;a.slideCD=1;const ns=Math.min(MV.slideMax,hs+MV.slideBoost);v.x=v.x/hs*ns;v.z=v.z/hs*ns;if(a.isPlayer)snd.slide();}
 if(a.slideT>0){a.slideT-=dt;if((!c.crouch&&a.slideT<MV.slideT-.2)||Math.hypot(v.x,v.z)<2.5)a.slideT=0;}a.slideCD=Math.max(0,a.slideCD-dt);
 const sliding=a.slideT>0;a.slideV+=((sliding?1:0)-a.slideV)*Math.min(1,dt*12);
 let wantC=c.crouch&&!sliding?1:0;if(!wantC&&a.crouchV>.05){const ce=L.ceil(p.x,p.z,p.y,.3);if(ce<p.y+MV.h+.05)wantC=1;}a.crouchV+=(wantC-a.crouchV)*Math.min(1,dt*11);
 const ws=wn>0?MV.run*w.speed*(a.adsK>.4?MV.adsMul:1)*(a.crouchV>.5?MV.crouchMul:1):0;const dx=wn>0?wx/wn:0,dz=wn>0?wz/wn:0;
 if(a.onGround){if(c.jump&&a.crouchV<.7&&a.stun<=0){v.y=MV.jump;a.onGround=false;a.slideT=0;if(a.isPlayer)snd.jump();}
  else{const sp=Math.hypot(v.x,v.z);if(sp>0){const fr=sliding?MV.slideFric:MV.friction;const drop=Math.max(sp,MV.stop)*fr*dt;const ns=Math.max(0,sp-drop)/sp;v.x*=ns;v.z*=ns;}if(!sliding)accel(v,dx,dz,ws,MV.accel,dt);}}
 else accel(v,dx,dz,ws,MV.airAccel,dt,MV.airCap);
 const h2=Math.hypot(v.x,v.z);if(h2>MV.max){v.x*=MV.max/h2;v.z*=MV.max/h2;}
 v.y-=MV.grav*dt;
 const H=MV.h-a.crouchV*(MV.h-MV.hc)-a.slideV*.7;const bx=p.x+v.x*dt,bz=p.z+v.z*dt;p.x=bx;p.z=bz;const ns=a.isPlayer?0:1;L.collide(p,MV.r,H,a.onGround?STEP:.28,ns);const ddx=p.x-bx,ddz=p.z-bz,dl=Math.hypot(ddx,ddz);if(dl>1e-5){const nx=ddx/dl,nz=ddz/dl;const vn=v.x*nx+v.z*nz;if(vn<0){v.x-=vn*nx;v.z-=vn*nz;}}
 const feet0=p.y;p.y+=v.y*dt;const gnd=L.groundAt(p.x,p.z,Math.max(feet0,p.y),.3,ns);const was=a.onGround;
 if(v.y<=0&&p.y<=gnd+.001){const imp=-v.y;p.y=gnd;v.y=0;a.onGround=true;if(!was&&imp>6){if(a.isPlayer){snd.land(Math.min(1,(imp-5)/10));VM.land(Math.min(.8,imp*.04));a.landDip=Math.min(.25,imp*.012);}}}
 else if(was&&v.y<=0&&p.y-gnd<STEP+.06){p.y=gnd;v.y=0;a.onGround=true;}
 else{if(gnd>p.y&&gnd-p.y<.3)p.y=gnd;a.onGround=false;}
 const ce=L.ceil(p.x,p.z,p.y,.3);if(p.y+H>ce){p.y=Math.max(a.onGround?gnd:p.y-.5,ce-H);if(v.y>0)v.y=0;}}
function separate(){const A=G.actors;for(let i=0;i<A.length;i++){const a=A[i];if(!a.alive)continue;for(let j=i+1;j<A.length;j++){const b=A[j];if(!b.alive)continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d2=dx*dx+dz*dz;if(d2>.56||d2<1e-6||Math.abs(a.pos.y-b.pos.y)>1.6)continue;const d=Math.sqrt(d2),push=(.75-d)*.5;a.pos.x-=dx/d*push;a.pos.z-=dz/d*push;b.pos.x+=dx/d*push;b.pos.z+=dz/d*push;}}}

/* ================= per-actor update ================= */
function updateActor(a,dt){if(!a.alive){if(!a.isPlayer&&G.time>=a.respawnT&&!(G.app==='over'))spawnActor(a);return;}
 a.spawnProt=Math.max(0,a.spawnProt-dt);a.stun=Math.max(0,a.stun-dt);a.padCD=Math.max(0,a.padCD-dt);
 if(a.switchT>0)a.switchT-=dt;if(a.reloadT>0){const g0=a.gun();a.reloadT-=dt;if(a.isPlayer&&g0&&!g0.w.shell&&a.reloadSnd===0&&a.reloadT<(g0.mag===0?g0.w.reloadE:g0.w.reload)*.42){a.reloadSnd=1;snd.reload(g0.w.cls==='revolver'?'cyl':g0.w.cls==='rl'?'rocket':'magin');}if(a.reloadT<=0){a.reloadT=0;finishReload(a);}}
 const g=a.gun(),w=g?g.w:null;
 // recoil recovery, bloom decay, ADS blend
 if(w){if(G.time-a.lastFire>w.rate*1.2){const k=Math.exp(-dt*(a.isPlayer?7:9));a.recoil.x*=k;a.recoil.y*=k;}a.bloom=Math.max(0,a.bloom-dt*(w.sp.bloom*8+.02));
  const can=a.ctl.ads&&a.switchT<=0&&a.reloadT<=0&&!w.melee&&a.slideV<.5;a.adsK=cl(a.adsK+(can?1:-1)*dt/w.ads.t,0,1);}
 // health regen
 if(a.hp<HP&&G.time-a.lastHurt>REGEN_DELAY)a.hp=Math.min(HP,a.hp+REGEN_RATE*dt);
 // fire / reload / switch requests
 if(a.ctl.reload){a.ctl.reload=false;reload(a);}
 if(w){if(a.isPlayer){if(w.semi||w.pump||w.bolt||w.proj||w.melee){if(mouse.click&&G.time-mouse.clickT<.3){if(fire(a)||(w.melee&&false))mouse.click=false;}}else if(a.ctl.fire)fire(a);}else if(a.ctl.fire)fire(a);}
 // jump pads
 for(const pd of world.pads){const p=pd.p;if(a.padCD<=0&&Math.hypot(a.pos.x-p.x,a.pos.z-p.z)<1.1&&Math.abs(a.pos.y-p.y)<.7){launchPad(a,p);pd.pulse=1;}}
 // pickups
 for(const p of G.pickups){if(!p.active)continue;if(Math.hypot(a.pos.x-p.x,a.pos.z-p.z)<1.2&&Math.abs(a.pos.y-p.y)<1.6)takePickup(a,p);}
 // the void
 if(a.pos.y<L.killY){damage(a,a.lastAttacker&&G.time-a.lastHurt<4?a.lastAttacker:null,999,'body',{name:'FELL'},null);if(a.alive){a.hp=0;kill(a,null,{name:'FELL'},false,null);}return;}
 // footsteps
 const hs=Math.hypot(a.vel.x,a.vel.z);if(a.onGround&&hs>3.5&&a.crouchV<.5&&a.slideV<.3){a.stepAcc+=hs*dt;if(a.stepAcc>2.3){a.stepAcc=0;const mat=surfaceAt(a);snd.step(a.pos,a.isPlayer,mat);G.events.push({t:G.time,x:a.pos.x,y:a.pos.y,z:a.pos.z,kind:'step',who:a,team:a.team});}}}
function surfaceAt(a){L.ray(a.pos.x,a.pos.y+.3,a.pos.z,0,-1,0,.6,ro);if(ro.i>=0){const m=L.boxes[ro.i].m;return m==='plate'||m==='metal'||m==='steel'||m==='container'?'metal':'stone';}return 'stone';}
function launchPad(a,p){const g=MV.grav;const apex=Math.max(a.pos.y,p.to.y)+2.8;const vy=Math.sqrt(2*g*(apex-a.pos.y));const t=vy/g+Math.sqrt(2*Math.max(.05,apex-p.to.y)/g);a.vel.set((p.to.x-a.pos.x)/t,vy,(p.to.z-a.pos.z)/t);a.onGround=false;a.padCD=.8;a.slideT=0;
 if(a.isPlayer||cam.position.distanceTo(a.pos)<30)snd.pad();fx.padFx(p,world.mood==='night'?0x3de0ff:0xffa040);}
const PICK_RESPAWN={hp:16,ammo:20,rl:42};
function takePickup(a,p){if(p.k==='hp'){if(a.hp>=HP)return;a.hp=Math.min(HP,a.hp+60);if(a.isPlayer)hud.medal('HEALTH',0);}
 else if(p.k==='ammo'){let need=false;for(const s of a.slots)if(s&&!s.w.melee&&s.res<s.w.res){s.res=s.w.res;need=true;}if(G.mode!=='ladder'&&a.frags<FRAG.per){a.frags=FRAG.per;need=true;}if(!need)return;if(a.isPlayer)hud.medal('AMMO',0);}
 else if(p.k==='rl'){if(G.mode==='ladder'||a.slots[2])return;a.slots[2]=newGun('rl');a.slots[2].res=3;switchTo(a,2);if(a.isPlayer)hud.banner('COMET RL','4 ROCKETS · SLOT 3','#ffb040',1.6);else hud.feed({k:a.name,kt:a.team,kc:G.mode==='tdm'?null:a.css,v:'COMET RL',vt:-1,w:'PICKED UP'});}
 p.active=false;p.t=PICK_RESPAWN[p.k];p.mesh.visible=false;if(a.isPlayer)snd.pickup(p.k);}
let _gt=null;function glowTex(){if(_gt)return _gt;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return _gt=new THREE.CanvasTexture(c);}
function pickupMesh(k){const g=new THREE.Group();const col=k==='hp'?0x50ff90:k==='rl'?0xffa040:0xe8d8b0;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.02,6,28),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(1.3)}));ring.rotation.x=Math.PI/2;ring.position.y=-.5;g.add(ring);
 const glow=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({map:glowTex(),color:new THREE.Color(col).multiplyScalar(.5),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.y=-.52;g.add(glow);
 const body=new THREE.Group();g.add(body);g.userData.body=body;
 if(k==='hp'){body.add(new THREE.Mesh(new THREE.BoxGeometry(.5,.32,.3),new THREE.MeshStandardMaterial({color:0xf0f0ea,roughness:.4})));const cm=new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,.25,.2)});const a=new THREE.Mesh(new THREE.BoxGeometry(.24,.07,.31),cm);const b=new THREE.Mesh(new THREE.BoxGeometry(.07,.24,.31),cm);body.add(a,b);}
 else if(k==='ammo'){body.add(new THREE.Mesh(new THREE.BoxGeometry(.5,.3,.32),new THREE.MeshStandardMaterial({color:0x4c5536,roughness:.6})));const s=new THREE.Mesh(new THREE.BoxGeometry(.52,.06,.33),new THREE.MeshBasicMaterial({color:new THREE.Color(2,1.6,.6)}));body.add(s);}
 else{const t=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.9,12),new THREE.MeshStandardMaterial({color:0x4c5536,roughness:.6}));t.rotation.z=Math.PI/2;body.add(t);const w=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,10),new THREE.MeshStandardMaterial({color:0x8a2a1a,emissive:0xff5010,emissiveIntensity:.8}));w.rotation.z=-Math.PI/2;w.position.x=.55;body.add(w);}
 body.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
function stepPickups(dt){for(const p of G.pickups){if(!p.active){p.t-=dt;if(p.t<=0){p.active=true;p.mesh.visible=true;fx.spawnFx({x:p.x,y:p.y,z:p.z},p.k==='rl'?0xffa040:0x80ffb0);}}else{const b=p.mesh.userData.body;b.rotation.y+=dt*1.6;b.position.y=Math.sin(G.time*2+p.x)*.08;}}}

/* ================= input ================= */
const keys={},mouse={l:false,r:false,dx:0,dy:0,click:false,clickT:-9};let locked=false;
function lock(){if(G.app!=='play')return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='play')pause(true);});
canvas.addEventListener('mousedown',()=>{if(G.app==='play'&&!locked)lock();});
addEventListener('mousedown',e=>{if(G.app!=='play'||!locked)return;if(G.kc){G.kc.skip=true;return;}if(e.button===0){mouse.l=true;mouse.click=true;mouse.clickT=G.time;}if(e.button===2)mouse.r=true;});
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(!locked)return;mouse.dx+=e.movementX;mouse.dy+=e.movementY;});
addEventListener('wheel',e=>{if(G.app!=='play'||!locked||!G.player||!G.player.alive)return;const P=G.player;const own=[0,1,2].filter(i=>P.slots[i]);let i=own.indexOf(P.cur);i=(i+(e.deltaY>0?1:-1)+own.length)%own.length;switchTo(P,own[i]);},{passive:true});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];keys[e.code]=true;if(['Space','Tab','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='paused')pause(false);else if(G.app==='play')pause(true);return;}if(G.app!=='play'||!first)return;const P=G.player;
 if(e.code==='Tab'){hud.board(true);return;}
 if(!P.alive){if(e.code==='Space'&&G.kc)G.kc.skip=true;if(e.code.startsWith('Digit')&&G.mode!=='ladder'){const n=+e.code.slice(5)-1;if(n>=0&&n<5){G.opt.cls=n;P.clsIdx=n;saveOpt();classText();snd.click();}}return;}
 if(e.code.startsWith('Digit')){const n=+e.code.slice(5)-1;if(n>=0&&n<3)switchTo(P,n);}
 if(e.code==='KeyQ'&&P.slots[P.prev])switchTo(P,P.prev);if(e.code==='KeyR')P.ctl.reload=true;if(e.code==='KeyV')melee(P);if(e.code==='KeyF'&&G.mode!=='ladder')throwFrag(P,null);
 if((e.code==='KeyC'||e.code==='ControlLeft'||e.code==='ShiftLeft'||e.code==='ShiftRight')&&P.onGround&&Math.hypot(P.vel.x,P.vel.z)>MV.slideMin)slideEdge=true;});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Tab')hud.board(false);});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
let slideEdge=false;
function readPlayer(dt){const P=G.player,c=P.ctl;const g=P.gun();const zoom=g&&P.adsK>.5?g.w.ads.zoom:1;const sens=.0022*G.opt.sens*(P.adsK>.5?G.opt.asens/zoom*(zoom>2?1.6:1):1);
 if(locked&&P.alive&&!G.kc){P.yaw-=mouse.dx*sens;P.pitch=cl(P.pitch-mouse.dy*sens,-1.5,1.5);}VM.mdx=mouse.dx;VM.mdy=mouse.dy;mouse.dx=mouse.dy=0;
 const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);c.mx=-sy*f+cy*s;c.mz=-cy*f-sy*s;
 c.jump=!!keys.Space;c.crouch=!!(keys.KeyC||keys.ControlLeft||keys.ShiftLeft||keys.ShiftRight);c.slide=slideEdge;slideEdge=false;c.fire=mouse.l&&locked;c.ads=mouse.r&&locked;
 const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.16?v:0;const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);const pr=G.pad||{};const btn=i=>bt[i]&&(bt[i].pressed||bt[i].value>.4);
  if(lx||ly){c.mx=-sy*(-ly)+cy*lx;c.mz=-cy*(-ly)-sy*lx;}const gs=dt*2.8*G.opt.sens*(P.adsK>.5?.45:1);P.yaw-=rx*Math.abs(rx)*gs;P.pitch=cl(P.pitch-ry*Math.abs(ry)*gs*.8,-1.5,1.5);
  if(btn(7)){c.fire=true;if(!pr.rt){mouse.click=true;mouse.clickT=G.time;}}if(btn(6))c.ads=true;if(btn(0))c.jump=true;if(btn(1)){c.crouch=true;if(!pr.b&&P.onGround)c.slide=true;}if(btn(2)&&!pr.x)c.reload=true;if(btn(3)&&!pr.y)switchTo(P,P.cur===0&&P.slots[1]?1:0);
  if(btn(5)&&!pr.rb&&G.mode!=='ladder')throwFrag(P,null);if(btn(4)&&!pr.lb)melee(P);if(btn(9)&&!pr.st)pause(true);G.pad={rt:btn(7),b:btn(1),x:btn(2),y:btn(3),rb:btn(5),lb:btn(4),st:btn(9)};}}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlock();hud.board(false);}else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= main step ================= */
let acc=0;
function step(dt){dt=Math.min(dt,.1);if(G.app==='paused'){visuals(0);return;}G.time+=dt;
 const live=G.app==='play'||G.app==='menu';
 if(G.app==='play'&&G.player){if(G.player.alive)readPlayer(dt);else{mouse.dx=mouse.dy=0;const c=G.player.ctl;c.mx=c.mz=0;c.fire=c.ads=false;}}
 if(G.app==='play'){G.clock-=dt;if(G.clock<=60&&!G.warned){G.warned=true;hud.banner('ONE MINUTE','FINAL PUSH','#ff8a3d',2);snd.music(3);}if(G.clock<=0){G.clock=0;endMatch('time');}}
 if(live){for(const a of G.actors){if(a.isPlayer||!a.alive)continue;if(G.idle||a.stun>0){a.ctl.mx=a.ctl.mz=0;a.ctl.fire=false;a.ctl.jump=false;continue;}think(G,a,dt);}
  acc+=dt;let n=0;while(acc>=DT&&n<14){for(const a of G.actors)if(a.alive)moveActor(a,DT);separate();acc-=DT;n++;}if(n>=14)acc=0;
  for(const a of G.actors)updateActor(a,dt);stepRockets(dt);stepFrags(dt);stepPickups(dt);
  if(G.app==='play'&&G.player&&!G.player.alive)stepDeath(dt);
  G.recT-=dt;if(G.recT<=0){G.recT=.05;recSample();}
  if(G.events.length>140)G.events.splice(0,G.events.length-140);}
 G.hurtFx=Math.max(0,G.hurtFx-dt*1.4);visuals(dt);if(G.app==='play')hud.update(dt);}

/* ================= visuals: rigs, camera, viewmodel ================= */
let menuA=0,menuTgt=null;const specCam=new V();let specInit=false;
function rigFrom(a,s,dt){const r=a.rig;r.root.position.set(s.x,s.y,s.z);r.root.rotation.y=s.yaw+Math.PI;r.setGun(s.gun);a.lightT-=dt;if(a.lightT<=0){a.lightT=.25;a.light=.5+.5*L.skyVis(s.x,s.y+1.6,s.z);if(world.mood==='night')a.light=Math.min(1,a.light+.25);}
 r.update(dt,{fwd:s.fw,side:s.sd,crouch:s.cr,slide:s.sl>.5,air:s.air,pitch:s.pitch,dead:!s.alive,reload:s.reload||0,light:a.light,shim:s.shim||0});}
function visuals(dt){const kc=G.kc&&G.kc.phase==='cam'?recAt(G.kc.rt):null;
 for(const a of G.actors){const r=a.rig;if(kc){const s=kc[a.id];if(!s)continue;r.root.visible=true;if(s[12]&&!a._kf){r.fired();a._kf=true;}else if(!s[12])a._kf=false;rigFrom(a,{x:s[0],y:s[1],z:s[2],yaw:s[3],pitch:s[4],alive:!!s[5],gun:s[6],cr:s[7],sl:s[8],fw:s[9],sd:s[10],air:!!s[11]},dt);if(a===G.kc.killer)r.root.visible=false;continue;}
  const hide=a.isPlayer&&(a.alive||!G.kc)&&G.app!=='menu'&&G.app!=='over';const deadLong=!a.alive&&G.time-a.deathT>2.6;r.root.visible=!hide&&!deadLong&&(a.alive||a.deathT>0);if(!r.root.visible)continue;
  const c=Math.cos(a.yaw),s=Math.sin(a.yaw);rigFrom(a,{x:a.pos.x,y:a.pos.y,z:a.pos.z,yaw:a.yaw,pitch:a.pitch+a.recoil.y*D2R,alive:a.alive,gun:a.gun()?a.gun().id:'ar',cr:a.crouchV,sl:a.slideV,fw:-(a.vel.x*s+a.vel.z*c),sd:a.vel.x*c-a.vel.z*s,air:!a.onGround,reload:a.reloadT>0?G.time:0,shim:a.spawnProt>0?.6:0},dt);}
 // killcam tracers
 if(kc){const t0=G.kc.rt-dt,t1=G.kc.rt;for(const sh of G.rec.shots)if(sh.t>t0&&sh.t<=t1&&sh.a!==G.kc.killer.id)fx.tracers.fire(new V(...sh.f),new V(...sh.e),0xffc070,{skip:.5});}
 fx.update(dt,scene.fog,L);world.update(dt);cameras(dt,kc);}
function cameras(dt,kc){G.shake=Math.max(0,G.shake-dt*1.8);const P=G.player;vmFlash.intensity*=Math.exp(-dt*30);
 if(G.app==='menu'||G.attract){// cinematic chase of a CPU fighter
  menuA+=dt;if(!menuTgt||!menuTgt.alive||menuA>8){const al=G.actors.filter(a=>a.alive);if(al.length){menuTgt=al[(R()*al.length)|0];menuA=0;specInit=false;}}VM.root.visible=false;const s=menuTgt;if(!s)return;
  const f=new V(-Math.sin(s.yaw),0,-Math.cos(s.yaw)),side=new V(Math.cos(s.yaw),0,-Math.sin(s.yaw));const head=new V(s.pos.x,s.pos.y+1.7,s.pos.z);const want=head.clone().addScaledVector(f,-3.6).addScaledVector(side,-1.4).add(new V(0,.55,0));
  const dir=want.clone().sub(head);const dl=dir.length();dir.normalize();L.ray(head.x,head.y,head.z,dir.x,dir.y,dir.z,dl+.3,ro);if(ro.t<dl+.3)want.copy(head).addScaledVector(dir,Math.max(.4,ro.t-.35));if(!specInit){specCam.copy(want);specInit=true;}specCam.lerp(want,Math.min(1,dt*3));
  cam.position.copy(specCam);cam.lookAt(head.x+f.x*8-side.x*2.6,head.y-.4+Math.sin(s.pitch)*3,head.z+f.z*8-side.z*2.6);setFov(62);snd.listener(cam.position.x,cam.position.y,cam.position.z,s.yaw);return;}
 if(G.app==='over'){menuA+=dt*.2;const m=G.result&&G.result.winner||P;const p=m.pos;cam.position.set(p.x+Math.cos(menuA)*4.5,p.y+2.2,p.z+Math.sin(menuA)*4.5);const d=new V().subVectors(cam.position,new V(p.x,p.y+1.6,p.z));const l=d.length();d.normalize();L.ray(p.x,p.y+1.6,p.z,d.x,d.y,d.z,l,ro);if(ro.t<l)cam.position.set(p.x,p.y+1.6,p.z).addScaledVector(d,Math.max(.6,ro.t-.3));cam.lookAt(p.x,p.y+1.2,p.z);setFov(52);VM.root.visible=false;return;}
 if(kc&&G.kc.killer){// killcam: through the killer's eyes, with their weapon
  const s=kc[G.kc.killer.id];const eye=s[1]+MV.eye-s[7]*.52-s[8]*.62;cam.position.set(s[0],eye,s[2]);cam.rotation.set(s[4],s[3],0);setFov(G.opt.fov/(s[13]>.5?(WPN[s[6]].ads.zoom>2?2:WPN[s[6]].ads.zoom):1)*1);
  if(G.kc.vmGun!==s[6]){G.kc.vmGun=s[6];VM.set(s[6],WPN[s[6]].cls==='ar'?'rifle':WPN[s[6]].cls);VM.st.equip=1;}VM.root.visible=true;if(s[12]&&!G.kc._f){VM.fire(WPN[s[6]].kick);G.kc._f=true;}else if(!s[12])G.kc._f=false;
  VM.update({dt,mdx:0,mdy:0,speed:Math.hypot(s[9],s[10]),onGround:!s[11],strafe:s[10],slide:s[8]>.5,aiming:s[13]>.5,t:G.time,adsTime:.15});snd.listener(cam.position.x,cam.position.y,cam.position.z,s[3]);return;}
 if(P&&!P.alive){// death cam: drop and look at the killer
  VM.root.visible=false;const k=G.kc&&G.kc.killer;const t=Math.min(1,(G.time-P.deathT)/.8);cam.position.set(P.pos.x,P.pos.y+MV.eye-1.2*t,P.pos.z);if(k){const tgt=new V(k.pos.x,k.pos.y+1.3,k.pos.z);const m=new THREE.Matrix4().lookAt(cam.position,tgt,new V(0,1,0));const q=new THREE.Quaternion().setFromRotationMatrix(m);cam.quaternion.slerp(q,Math.min(1,dt*3));}else cam.rotation.z=t*.4;setFov(G.opt.fov);return;}
 if(!P)return;
 // first person
 const eyeT=P.pos.y+P.eyeH();P.eyeY=P.eyeY===undefined||Math.abs(P.eyeY-eyeT)>1.2?eyeT:P.eyeY+(eyeT-P.eyeY)*Math.min(1,dt*18);P.landDip=Math.max(0,(P.landDip||0)-dt*1.4);P.punch=(P.punch||0)*Math.exp(-dt*8);
 const hs=Math.hypot(P.vel.x,P.vel.z);P.bobT=(P.bobT||0)+dt*hs*1.1*(P.onGround&&P.slideV<.3?1:0);const bob=Math.sin(P.bobT)*Math.min(1,hs/7)*.03*(1-P.adsK*.8);
 cam.position.set(P.pos.x,P.eyeY-P.landDip+bob,P.pos.z);const sh=G.shake*G.shake*.3;const strafe=(P.vel.x*Math.cos(P.yaw)-P.vel.z*Math.sin(P.yaw));P.roll=(P.roll||0)+((cl(-strafe*.004,-.025,.025)+P.slideV*.05)-(P.roll||0))*Math.min(1,dt*8);
 cam.rotation.set(P.pitch+P.recoil.y*D2R+(R()-.5)*sh+P.punch*.01,P.yaw+P.recoil.x*D2R+(R()-.5)*sh,P.roll);
 const g=P.gun();const zoom=g?1+(g.w.ads.zoom-1)*P.adsK:1;const scoped=g&&g.w.ads.scope&&P.adsK>.9;setFov(G.opt.fov/zoom+Math.min(8,Math.max(0,hs-9)*.8)*(1-P.adsK));$('scope').hidden=!scoped;
 VM.root.visible=!scoped;VM.update({dt,mdx:VM.mdx||0,mdy:VM.mdy||0,speed:hs,onGround:P.onGround,strafe:strafe,slide:P.slideV>.5,aiming:P.ctl.ads&&P.switchT<=0&&P.reloadT<=0,t:G.time,adsTime:g?g.w.ads.t:.2});vmCam.fov=66-P.adsK*14;
 G.spreadNow=g&&!g.w.melee?spreadOf(P,g.w):0;snd.listener(cam.position.x,cam.position.y,cam.position.z,P.yaw);
 // what is under the crosshair (name tags)
 G.aimT=(G.aimT||0)-dt;if(G.aimT<=0){G.aimT=.08;G.aimedAt=null;const o=cam.position,d=viewDir(P,new V());const tw=Math.min(90,L.ray(o.x,o.y,o.z,d.x,d.y,d.z,90,ro));let bt=tw;for(const e of G.actors){if(e===P||!e.alive)continue;const h=hitActor(e,o.x,o.y,o.z,d.x,d.y,d.z,bt);if(h){bt=h.t;G.aimedAt=e;}}}}
function setFov(hf){const aspect=innerWidth/innerHeight;cam.fov=2*Math.atan(Math.tan(hf*Math.PI/360)/aspect)*180/Math.PI;cam.updateProjectionMatrix();}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible)return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyShadow(){if(!world)return;const s=world.sun;const ms=gfx>=2?2048:gfx===1?2048:1024;if(s.shadow.mapSize.x!==ms){if(s.shadow.map){s.shadow.map.dispose();s.shadow.map=null;}s.shadow.mapSize.set(ms,ms);}
 for(const a of G.actors)a.rig.root.traverse(o=>{if(o.isMesh&&o!==a.rig.blob)o.castShadow=gfx>=1;});Rr.shadowMap.needsUpdate=true;}
function applyQuality(q){gfx=q;Rr.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.15:.85));fxStack=null;fxSize='';applyShadow();}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(Rr.domElement.width!==Math.floor(w*Rr.getPixelRatio())||Rr.domElement.height!==Math.floor(h*Rr.getPixelRatio()))Rr.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();const sc=h*Rr.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));fx.sparks.U.uScale.value=fx.smoke.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<4)Rr.shadowMap.needsUpdate=true;
 const M=world.M;const key=w+'x'+h;if(!fxStack){fxStack=cinematic(Rr,scene,cam,{exposure:M.exp,bloom:M.bloom,bloomThreshold:M.thr,bloomRadius:.5,saturation:M.sat,tint:M.tint,vignette:.32,grain:.028,aoStrength:.85,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade){const P=G.player;const hp=G.app==='play'&&P&&P.alive?Math.min(1,P.hp/50):1;fxStack.grade.uniforms.sat.value=M.sat*(.35+.65*hp);}
 if(fxStack.composer)fxStack.render();else{Rr.autoClear=true;Rr.render(scene,cam);if(VM.root.visible){Rr.autoClear=false;Rr.clearDepth();Rr.render(vmScene,vmCam);Rr.autoClear=true;}}}

/* ================= match end + scoring ================= */
let lastAward=null;
function placement(){const list=G.actors.slice().sort((a,b)=>G.mode==='ladder'?(b.ladder-a.ladder||b.stats.k-a.stats.k):(b.stats.k-a.stats.k||b.stats.score-a.stats.score));return list;}
function endMatch(reason,winner){if(G.app!=='play')return;G.app='over';unlock();hud.board(false);hud.show(false);hud.dead(false);document.body.classList.remove('playing','kc');$('scope').hidden=true;G.kc=null;
 const P=G.player,list=placement();let won,place=list.indexOf(P)+1,res;
 if(G.mode==='tdm'){const s=G.teamScore;won=s[P.team]>s[1-P.team];const draw=s[0]===s[1];res=draw?'DRAW':won?'VICTORY':'DEFEAT';G.result={winner:list.filter(a=>a.team===(s[0]>=s[1]?0:1)).sort((a,b)=>b.stats.score-a.stats.score)[0],draw};}
 else{const top=winner||list[0];won=top===P;res=won?'VICTORY':place<=3?'PODIUM':'DEFEAT';G.result={winner:top};}
 const D=DIFF[G.opt.diff],s=P.stats;let pts=s.k*100+s.hs*50+s.a*40+s.best*30;if(G.mode==='tdm')pts+=won?800:0;else pts+=place===1?1000:place===2?600:place===3?300:0;if(G.mode==='ladder')pts+=P.ladder*80;pts=Math.round(pts*D.mult);
 const ord=n=>n+(n===1?'ST':n===2?'ND':n===3?'RD':'TH');
 $('oeye').textContent={ffa:'FREE FOR ALL',tdm:'TEAM DEATHMATCH',ladder:'GUN LADDER'}[G.mode]+' · '+L.def.name+' · CPU '+D.n+' · '+(reason==='time'?'TIME UP':'LIMIT REACHED');
 $('orank').textContent=G.mode==='tdm'?(G.teamScore[0]+'–'+G.teamScore[1]):ord(place);$('orank').style.color=won?'#ffd04a':place<=3&&G.mode!=='tdm'?'#ff8a3d':'#8a93a6';$('ores').textContent=res;$('ores').style.color=won?'#ffd04a':'#ddd';$('ofs').textContent=pts.toLocaleString()+' PTS';
 const rows=(G.mode==='tdm'?list.slice().sort((a,b)=>a.team-b.team||b.stats.score-a.stats.score):list);
 $('stats').innerHTML=`<tr><th>#</th><th>FIGHTER</th><th>K</th><th>D</th><th>A</th><th>HS</th><th>${G.mode==='ladder'?'TIER':'BEST'}</th><th>SCORE</th></tr>`+rows.map((a,i)=>`<tr class="${a.isPlayer?'me ':''}${G.mode==='tdm'?'t'+a.team:''}"><td>${G.mode==='tdm'?(a.team?'TIDE':'EMBER'):i+1}</td><td style="text-align:left">${a.name}</td><td>${a.stats.k}</td><td>${a.stats.d}</td><td>${a.stats.a}</td><td>${a.stats.hs}</td><td>${G.mode==='ladder'?(a.ladder+1)+'/9':a.stats.best}</td><td>${a.stats.score}</td></tr>`).join('');
 const accp=s.shots?Math.round(s.hits/s.shots*100):0;$('mystats').innerHTML=[['K / D',s.k+' / '+s.d],['ACCURACY',accp+'%'],['HEADSHOTS',s.hs],['BEST STREAK',s.best],['DAMAGE',Math.round(s.dmg)],['ASSISTS',s.a]].map(([k,v])=>`<div><b>${v}</b><span>${k}</span></div>`).join('');
 const tok=award(pts,won,place);$('otok').textContent=`+${tok} TOKENS · BEST ${best().toLocaleString()} PTS`;$('over').hidden=false;snd.music(0);snd.sting(won);menuA=0;}
function award(pts,won,place){lastAward={pts,won,place,mode:G.mode,map:L.def.name,diff:DIFF[G.opt.diff].n,k:G.player.stats.k,d:G.player.stats.d,cls:CLASSES[G.opt.cls].name,team:G.mode==='tdm'?G.teamScore.join('-'):''};const tok=5+Math.min(60,pts/150|0);
 addRound(tok,won);saveBest('strike3d',pts);return tok;}
function best(){return bestScore('strike3d');}
function updateBest(){const b=best();$('best').textContent=b?'BEST · '+b.toLocaleString()+' PTS':'';}

/* ================= HUD + menus ================= */
const hud=new HUD(G);G.hud=hud;G.snd=snd;
function saveOpt(){try{localStorage.setItem('pxd_strike_opt',JSON.stringify(G.opt));}catch(e){}}
const seg=(id,key,num=true,cb)=>{const el=$(id);const set=(v,init)=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(num?+b.dataset.v:b.dataset.v)===String(v)));if(!init){saveOpt();snd.click&&snd.click();cb&&cb(v);}};set(G.opt[key],true);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(num?+b.dataset.v:b.dataset.v));};
const clsDesc=()=>{$('clsd').textContent=G.opt.mode==='ladder'?'GUN LADDER: everyone climbs the same 9 weapons — a kill moves you up, a knife kill wins.':CLASSES[G.opt.cls].desc;};
seg('o-mode','mode',false,clsDesc);seg('o-map','map',true,()=>{if(G.app==='menu')attractMode();});seg('o-cls','cls',true,clsDesc);seg('o-diff','diff');seg('o-len','len');
seg('o-sens','sens');seg('o-asens','asens');seg('o-fov','fov');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-mus','mus',true,v=>snd.setMusic(v));clsDesc();
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Strike Zone\nScore: ${a.pts||0}\nResult: ${a.won?'win':'loss'}${a.place?' · place '+a.place:''}${a.team?' · '+a.team:''}\nMode: ${a.mode||''} · Map: ${a.map||''} · CPU ${a.diff||''} · Class ${a.cls||''}\nKills: ${a.k||0} · Deaths: ${a.d||0}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore('strike3d',a.pts||0,body);};

/* ================= boot + loop ================= */
attractMode();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
const P_=()=>G.player;
window.STRIKE={get state(){return G.app;},get app(){return G.app;},G,get P(){return G.player;},get player(){return G.player;},get actors(){return G.actors;},get bots(){return G.actors.filter(a=>!a.isPlayer);},
 get monsters(){return G.actors.filter(a=>!a.isPlayer);},get enemies(){return G.actors.filter(a=>G.player&&G.enemies(G.player,a));},get wave(){return G.player?G.player.ladder:0;},get phase(){return G.app==='play'?(G.player&&G.player.alive?'fight':'dead'):G.app;},get L(){return L;},get mode(){return G.mode;},get killcam(){return G.kc;},get result(){return G.result;},
 step,render,start,toMenu,pause,deploy:o=>start(o),endRun:r=>endMatch(r||'time'),endMatch:(r,w)=>endMatch(r||'time',w),hud:()=>hud,fx:()=>fx,scene,cam,R:Rr,
 set matchT(v){G.clock=v;},setClock(s){G.clock=s;},setIdle(v=true){G.idle=v;},god(v=true){G.god=v;},setQuality:applyQuality,get gfx(){return gfx;},
 fire:()=>fire(P_()),melee:()=>melee(P_()),reload:()=>reload(P_()),frag:t=>throwFrag(P_(),t||null),ads(on=true){mouse.r=on;},equip(s){const P=P_();if(typeof s==='string'){const i=P.slots.findIndex(g=>g&&g.id===s);if(i>=0)switchTo(P,i);}else switchTo(P,s);},
 give(id){const P=P_();const g=newGun(id);if(id==='rl'){P.slots[2]=g;switchTo(P,2,true);}else{P.slots[0]=g;switchTo(P,0,true);}return g;},
 spawn(type,x,z,y){const b=G.actors.find(a=>!a.isPlayer&&G.player&&G.enemies(G.player,a)&&!a.alive)||G.actors.find(a=>!a.isPlayer&&G.player&&G.enemies(G.player,a));if(!b)return null;if(!b.alive)spawnActor(b);if(x!==undefined){b.pos.set(x,y??L.groundAt(x,z,40),z);b.vel.set(0,0,0);}b.spawnProt=0;return b;},
 killAll(){const P=P_();for(const a of G.actors)if(a.alive&&G.enemies(P,a)){a.spawnProt=0;damage(a,P,999,'body',P.gun().w,new V(0,0,1));}},clearWave(){this.killAll();},
 botKill(k,v,head=false){v.spawnProt=0;const g=k.gun();damage(v,k,999,head?'head':'body',g?g.w:WPN.ar,new V(0,0,1));},
 damagePlayer(n,by){const P=P_();P.spawnProt=0;damage(P,by||null,n,'body',by&&by.gun()?by.gun().w:{name:'TEST'},new V(0,0,1));},killPlayer(by){const P=P_();P.spawnProt=0;const b=by||G.actors.find(a=>!a.isPlayer&&a.alive&&G.enemies(P,a));damage(P,b,999,'body',b&&b.gun()?b.gun().w:{name:'TEST'},new V(0,0,1));},
 teleport(x,z,y){const P=P_();P.pos.set(x,y??L.groundAt(x,z,40),z);P.vel.set(0,0,0);},look(yaw,pitch=0){const P=P_();P.yaw=yaw;P.pitch=pitch;P.recoil.x=P.recoil.y=0;},
 aimAt(m){const P=P_();const t=new V(m.pos.x,m.pos.y+(m.headH?m.headH():1.2),m.pos.z);const dx=t.x-P.pos.x,dz=t.z-P.pos.z,dy=t.y-(P.pos.y+P.eyeH());P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(dy,Math.hypot(dx,dz));P.recoil.x=P.recoil.y=0;P.bloom=0;},
 stagger(m){if(m){m.stun=.8;return true;}return false;},nextArena(){const o={...G.opt,map:(G.opt.map+1)%MAPS.length};if(G.app==='play'||G.app==='over'){G.app='menu';start(o);}else{G.opt.map=o.map;attractMode();}},
 forceWin(){const P=P_();if(G.mode==='tdm'){G.teamScore[P.team]=G.limit-1;}P.stats.k=Math.max(P.stats.k,G.limit-1);if(G.mode==='ladder'){P.ladder=LADDER.length-1;}endMatch('limit',G.mode==='tdm'?undefined:P);},
 forceLose(){const P=P_();const b=G.actors.find(a=>!a.isPlayer&&G.enemies(P,a));if(G.mode==='tdm')G.teamScore[1-P.team]=G.limit;else{b.stats.k=G.limit;if(G.mode==='ladder')b.ladder=LADDER.length-1;}endMatch('limit',G.mode==='tdm'?undefined:b);},
 setScore(n){const P=P_();P.stats.k=n;},setTeamScore(a,b){G.teamScore=[a,b];},skipKillcam(){if(G.kc)G.kc.skip=true;},board(on=true){hud.board(on);},
 keys,mouse,input:{jump(){keys.Space=true;setTimeout(()=>keys.Space=false,60);},dash(){slideEdge=true;},slide(){slideEdge=true;}},MV,VM:()=>VM,snd,proj:()=>G.rockets,items:()=>G.pickups,world:()=>world,maps:MAPS,DIFF,CLASSES};
