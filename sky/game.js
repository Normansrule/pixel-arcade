// SKY LANCERS — full 3D arcade air combat over a procedural archipelago. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import * as W from './world.js';
import {AC,PLAYABLE,LIVERY,buildModel,buildCockpit,Plane,fly,instruct,GRAV} from './planes.js';
import {FX,Bullets,Ordnance,bombImpact} from './combat.js';
import {SKILL,think,hostile,leadPoint,gunnerAim} from './ai.js';
import {MISSIONS,DOGFIGHT,CARRIER_START,CARRIER_DIR,CARRIER_SPEED,PORT} from './missions.js';
import {HUD} from './hud.js';
import {Sound} from './sound.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const V=THREE.Vector3,Qt=THREE.Quaternion,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a,rs=(a=1)=>(Math.random()*2-1)*a;
const DT=1/60,ID='skylancers';
const ENEMY_NAMES=['MANTIS','JACKAL','COBALT','SABLE','WRAITH','RAZOR','MAKO','ONYX','VORTEX','CINDER','SCYTHE','BRAMBLE','HEX','GRIM','TALUS','QUILL','RUST','NETTLE'];
const ALLY_NAMES=['LANCER 2','LANCER 3','LANCER 4'];

/* ================= renderer + world ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance',antialias:false});
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const sun=new THREE.DirectionalLight(0xffffff,3);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:10,far:1600});sun.shadow.bias=-.0004;sun.shadow.normalBias=.06;scene.add(sun,sun.target);
const hemi=new THREE.HemisphereLight(0x99bbee,0x445544,1);scene.add(hemi);
const sky=W.makeSky(scene),ocean=W.makeOcean(scene);
const FANG=W.ISLANDS.find(i=>i.name==='FANG');W.keepClear(FANG.x,FANG.z,1500);
let gfx=quality();const DET=()=>gfx>=2?2:gfx;
let terrain=W.makeTerrain(scene,DET());
W.makeTown(scene,PORT.x,PORT.z,620,170,5);W.makeTown(scene,-8250,1100,380,45,6);W.makeTown(scene,1300,-8000,420,50,7);W.makeTown(scene,6350,4400,220,22,8);
let flora=W.makeFlora(scene,[1600,4200,7500][gfx]);
const carrierMesh=W.makeCarrier();scene.add(carrierMesh);
let clouds=null,env=null,curTOD=null,post=null,exposure=1;
const cam=new THREE.PerspectiveCamera(62,1,1,26000);
const fx=new FX(scene,gfx),bullets=new Bullets(3500),ord=new Ordnance(scene,fx),snd=new Sound(),hud=new HUD($('hudc'),$('radar'));
let cockpit=null;

/* ================= state ================= */
const opts={mode:'campaign',mi:0,plane:'wren',clock:300,diff:1,cpus:5,sens:1};
try{Object.assign(opts,JSON.parse(localStorage.getItem('pxd_skylancers_opt'))||{});}catch(e){}
let prog={stars:{},best:{}};try{prog=Object.assign(prog,JSON.parse(localStorage.getItem('pxd_skylancers_prog'))||{});}catch(e){}
const G={app:'menu',planes:[],sites:[],time:0,clock:0,mission:null,player:null,lives:0,stats:null,rng:Math.random,opts,attract:true,score:0,result:null,endT:0,ffa:false,landBonus:false};
const carrier={mesh:carrierMesh,p:new V(),dir:new V(),speed:CARRIER_SPEED,hp:100,max:100,target:null,ciwsT:[0,0,0,0]};
let playerDead=null,rigQ=new Qt(),look={yaw:0,pitch:0},camMode='chase',lockT=0,lockTgt=null,mslCd=0,shake=0,dmgFlash=0,bounds=0,hudTarget=null,ccip=null,ccipT=0,menuCamT=0,menuFocus=null,menuSwitch=0,slowmo=1,warnState=0,lastWarn='';
const world={planes:G.planes,ord,time:0,clouds:null,humanBias:250,targets:G.sites,deckHit:p=>{const l=deckLocal(p);return W.onDeck(l.x,l.z)&&p.y<W.DECK_Y+1;}};

/* ================= sky / time of day / post ================= */
function setTOD(name,cfg={}){const T=W.applyTOD(name,sun,hemi);exposure=T.exp;if(env)env.dispose();env=W.skyEnv(R);scene.environment=env.texture;curTOD=name;
 if(clouds)clouds.dispose(scene);const cc=Object.assign({count:[40,62,80][gfx],base:1300,spread:900,seed:3+(cfg.seed||0)},cfg);if(cc.count>0)cc.count=Math.round(cc.count*[.6,1,1.25][gfx]);clouds=new W.Clouds(scene,cc);world.clouds=clouds;
 fx.alpha.U.uLight.value.copy(SKY_LIGHT());post=null;}
const SKY_LIGHT=()=>new THREE.Color().copy(W.SKYU.uSunCol.value).multiplyScalar(.55).add(new THREE.Color().copy(W.SKYU.uZen.value).multiplyScalar(.35)).add(new THREE.Color().copy(W.SKYU.uHor.value).multiplyScalar(.45));
function applyQuality(q){const det=DET();gfx=q;if(DET()!==det||!terrain){scene.remove(terrain);terrain.traverse(o=>o.geometry&&o.geometry.dispose());terrain=W.makeTerrain(scene,DET());flora.forEach(f=>{scene.remove(f);f.geometry.dispose();});flora=W.makeFlora(scene,[1600,4200,7500][gfx]);}
 R.setPixelRatio(Math.min(devicePixelRatio,[1,1.25,1.5][q]));sun.castShadow=q>0;sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}ocean.U.uDetail.value=q>0?1:.5;post=null;}
bindQualityKey(()=>gfx,q=>applyQuality(q));R.setPixelRatio(Math.min(devicePixelRatio,[1,1.25,1.5][gfx]));sun.castShadow=gfx>0;if(gfx>=2)sun.shadow.mapSize.set(2048,2048);

/* ================= spawning ================= */
let nameI=0;
function livery(team,o){if(o.livery)return LIVERY[o.livery];if(team===0)return LIVERY.blue;if(team===-1&&o.ffa!==undefined){const t=LIVERY.ffa[o.ffa%LIVERY.ffa.length];return{top:t,bot:new THREE.Color(0x9a9a96),acc:new THREE.Color(0xe8e2d0)};}return LIVERY.red;}
function spawnPlane(type,team,pos,dir,speed,o={}){const pl=new Plane(type,team,{name:o.name||(team===1||team===-1&&!o.human?ENEMY_NAMES[nameI++%ENEMY_NAMES.length]:'LANCER'),human:o.human});
 pl.mesh=buildModel(type,livery(team,o));pl.livery=livery(team,o);scene.add(pl.mesh);pl.place(pos,dir,speed);pl.hpMul=o.hpMul||1;applyHpMul(pl);
 pl.ace=!!o.ace;pl.kills=0;pl.deaths=0;pl.ffa=o.ffa;pl.trails=null;pl.smokeAcc=0;
 if(!o.human)pl.ai={skill:o.skill??1,role:o.role||'fighter',t:rnd(.5),pref:o.pref,leash:o.leash,route:o.route,wi:0,loop:o.loop,leader:o.leader,slot:o.slot};
 if(type==='fortress'){pl.hpShow=true;}G.planes.push(pl);return pl;}
function applyHpMul(pl){const m=pl.hpMul||1;pl.hp*=m;for(const k in pl.parts)pl.parts[k].hp*=m;pl.maxHp=pl.hp;}
function addSite(kind,pos,o={}){const mesh=W.makeSite(kind);const y=W.height(pos.x,pos.z);mesh.position.set(pos.x,y,pos.z);mesh.rotation.y=rnd(6.28);scene.add(mesh);
 const HP={aa:70,sam:90,radar:100,fuel:120,hangar:160,bunker:200}[kind],R_={aa:11,sam:10,radar:10,fuel:19,hangar:17,bunker:12}[kind];
 const t={kind,p:new V(pos.x,y,pos.z),markP:new V(pos.x,y+12,pos.z),r:R_,hp:HP,max:HP,team:o.team??1,mesh,dead:false,gunT:rnd(2),cd:3+rnd(6),value:{aa:100,sam:130,radar:120,fuel:140,hangar:120,bunker:100}[kind],label:{aa:'AA',sam:'SAM',radar:'RADAR',fuel:'FUEL',hangar:'HANGAR',bunker:'BUNKER'}[kind],big:kind==='fuel'||kind==='hangar'};
 G.sites.push(t);return t;}
function addShip(pos,dir,speed,o={}){const mesh=W.makeDestroyer(true);scene.add(mesh);const d=dir.clone().normalize();const t={kind:'ship',p:pos.clone().setY(0),markP:new V(),dir:d,speed,r:34,hp:650,max:650,team:o.team??1,mesh,dead:false,gunT:0,cd:2,value:300,label:'DESTROYER',hpBar:true,big:true,ship:true};
 G.sites.push(t);return t;}
const callsignAlly=()=>ALLY_NAMES[G.planes.filter(p=>p.team===0&&!p.human).length%3];
Object.assign(G,{spawnPlane,addSite,addShip,carrier,
 skillFor:d=>cl(opts.diff+d,0,2),diffSkill:d=>cl(opts.diff+d,0,2),
 startAt(pos,dir){G.spawnPos=pos.clone();G.spawnDir=dir.clone().normalize();const pl=spawnPlane(opts.plane,G.ffa?-1:0,pos,dir,AC[opts.plane].vmax*.72,{human:true,name:'YOU'});G.player=pl;resetRig(pl);},
 allies(n,type){for(let i=0;i<n;i++){const p=G.spawnPos.clone().add(new V((i?1:-1)*160,-40-i*20,140+i*60).applyAxisAngle(new V(0,1,0),Math.atan2(-G.spawnDir.x,-G.spawnDir.z)));spawnPlane(type,0,p,G.spawnDir,AC[type].vmax*.72,{skill:1,name:callsignAlly()});}},
 setObj(t,cls=''){setTxt('obj',t);$('obj').className=cls;},feed,banner,
 townHit(p,by){for(let i=0;i<3;i++){const q=new V(p.x+rs(380),0,p.z+rs(380));q.y=Math.max(2,W.height(q.x,q.z));setTimeout(()=>{fx.groundBlast(q,1.2);fx.burning(q,25,1.2);sndAt('boom',q,1.3);},i*260);}},
 board:()=>G.planes.filter(p=>p.human||p.ffa!==undefined).sort((a,b)=>b.kills-a.kills||a.deaths-b.deaths)});

/* ================= session flow ================= */
function clearWorld(){for(const pl of G.planes){scene.remove(pl.mesh);if(pl.trails)pl.trails.forEach(r=>r.orphan=.01);}G.planes.length=0;for(const s of G.sites){scene.remove(s.mesh);}G.sites.length=0;
 ord.clear();bullets.clear();fx.clear();playerDead=null;G.player=null;lockT=0;lockTgt=null;if(cockpit){cockpit.removeFromParent();}}
function resetCarrier(){carrier.p.copy(CARRIER_START);carrier.dir.copy(CARRIER_DIR);carrier.hp=carrier.max=100;carrier.target={kind:'carrier',p:new V(),markP:new V(),r:70,team:0,dead:false,hp:100,max:100,label:'CV-07',hpBar:true,big:true,carrier:true};G.sites.push(carrier.target);updCarrier(0);}
function attract(){clearWorld();G.app='menu';G.attract=true;G.mission=null;G.ffa=true;resetCarrier();setTOD('day',{seed:0});
 const c=new V(1600,0,2400);for(let i=0;i<5;i++){const a=i/5*6.28;const p=new V(c.x+Math.cos(a)*1400,900+i*120,c.z+Math.sin(a)*1400);spawnPlane(PLAYABLE[i%3],-1,p,new V(-Math.sin(a),0,Math.cos(a)),200,{skill:2,ffa:i});}
 menuFocus=G.planes[0];menuSwitch=9;}
function brief(){const M=opts.mode==='ffa'?DOGFIGHT:MISSIONS[opts.mi];clearWorld();G.attract=false;G.mission=M;G.ffa=!!M.ffa;G.time=0;world.time=0;G.result=null;G.endT=0;slowmo=1;G.landBonus=false;nameI=(rnd(ENEMY_NAMES.length))|0;
 G.stats={kills:0,ground:0,assists:0,shots:0,hits:0,deaths:0,landings:0,mslFired:0,dmg:0,score:0,bonus:0};G.score=0;G.lives=M.lives||0;G.clock=opts.clock;G.opts=opts;
 resetCarrier();setTOD(M.tod,M.clouds||{});if(M.carrierHP===undefined&&!G.ffa){}M.init.call(M,G);$('feed').innerHTML='';$('toasts').innerHTML='';
 G.app='brief';showPanel('brief');$('b-tag').textContent=(M.tag||'')+(opts.mode==='campaign'?` · MISSION ${opts.mi+1}/${MISSIONS.length}`:'');$('b-name').innerHTML=M.name+'<em>.</em>';$('b-text').textContent=M.brief;
 $('b-obj').innerHTML=`<b>OBJECTIVE</b> ${M.obj}<br><b>AIRCRAFT</b> ${AC[opts.plane].name}<br><b>TIME LIMIT</b> ${fmt(opts.clock)}${M.lives?` · <b>AIRFRAMES</b> ${M.lives}`:' · <b>RESPAWNS</b> unlimited'}${G.ffa?`<br><b>OPPONENTS</b> ${opts.cpus} · ${SKILL[opts.diff].n}`:''}`;
 menuCamT=0;}
function launch(){if(G.app!=='brief')return;snd.init();G.app='play';showPanel(null);$('hud').hidden=false;document.body.classList.add('playing');lock();banner(G.mission.name,G.mission.obj.toUpperCase(),2.6);snd.play('banner');resetRig(G.player);}
function start(o={}){Object.assign(opts,o);saveOpts();brief();launch();}
function toMenu(){unlock();attract();showPanel('menu');$('hud').hidden=true;document.body.classList.remove('playing');snd.off();renderMenu();}
function showPanel(id){for(const p of['menu','brief','pause','over'])$(p).hidden=p!==id;$('keys').hidden=id!=='menu';}
function pause(on){if(on&&G.app==='play'){G.app='paused';showPanel('pause');unlock();snd.suspend(true);}else if(!on&&G.app==='paused'){G.app='play';showPanel(null);lock();snd.suspend(false);}}
function endSortie(res){if(G.result)return;G.result=res;G.endT=0;slowmo=.35;const M=G.mission;
 if(res==='win'){G.stats.bonus=G.ffa?300:1000+Math.round(G.clock*2)+G.lives*150;addScore(G.stats.bonus,null);snd.play('win');}else snd.play('lose');
 banner(res==='win'?(G.ffa?'VICTORY':'MISSION COMPLETE'):G.clock<=0&&!G.ffa?'TIME UP':G.ffa?'DEFEAT':'MISSION FAILED',res==='win'?'RETURNING TO BASE':'',3,res==='win'?'#5dff9a':'#ff3b30');}
function showOver(){G.app='over';unlock();$('hud').hidden=true;document.body.classList.remove('playing');snd.off();const M=G.mission,s=G.stats,won=G.result==='win';
 const stars=won?1+(G.score>=M.stars[0]?1:0)+(G.score>=M.stars[1]?1:0):0;G.stars=stars;
 if(!G.ffa&&won){prog.stars[M.id]=Math.max(prog.stars[M.id]||0,stars);}prog.best[M.id]=Math.max(prog.best[M.id]||0,G.score);try{localStorage.setItem('pxd_skylancers_prog',JSON.stringify(prog));}catch(e){}
 $('o-eye').textContent=`${M.tag} · ${M.name}${G.ffa?` · ${SKILL[opts.diff].n}`:''}`;$('o-res').textContent=won?(G.ffa?'VICTORY':'MISSION COMPLETE'):(G.ffa?'DEFEAT':G.failWhy==='time'?'TIME UP':'MISSION FAILED');$('o-res').style.color=won?'#5dff9a':'#ff5a4a';
 $('o-stars').innerHTML=[0,1,2].map(i=>`<i class="${i<stars?'on':''}">★</i>`).join('');
 const acc=s.shots?Math.round(s.hits/s.shots*100):0;
 const rows=[['SCORE',G.score],['AIR KILLS',s.kills],['GROUND / NAVAL',s.ground],['ASSISTS',s.assists],['ACCURACY',acc+'%'],['MISSILES FIRED',s.mslFired],['AIRFRAMES LOST',s.deaths],['CARRIER LANDINGS',s.landings],['MISSION BONUS',s.bonus]];
 $('o-stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
 if(G.ffa){$('o-board').innerHTML='<tr><th>PILOT</th><th>KILLS</th><th>DEATHS</th></tr>'+G.board().map((p,i)=>`<tr class="${p.human?'me':''}"><td>${i+1}. ${p.name}</td><td>${p.kills}</td><td>${p.deaths}</td></tr>`).join('');$('o-board').hidden=false;}else $('o-board').hidden=true;
 const tok=award(G.score,won);$('o-tok').textContent=`+${tok} TOKENS · BEST ${best()} PTS`;
 const next=opts.mode==='campaign'&&won&&opts.mi<MISSIONS.length-1;$('o-next').hidden=!next;showPanel('over');}
let lastAward=null;
function award(pts,won){lastAward={pts,won,mission:G.mission.name,stars:G.stars,kills:G.stats.kills,plane:AC[opts.plane].name,clock:opts.clock};const tok=5+Math.min(60,pts/60|0);
 addRound(tok,won);saveBest(ID,pts);return tok;}
function best(){return bestScore(ID);}
function saveOpts(){try{localStorage.setItem('pxd_skylancers_opt',JSON.stringify(opts));}catch(e){}}

/* ================= scoring + damage ================= */
function addScore(n,why,pos){G.score+=n;G.stats.score=G.score;if(why)toast((n>0?'+':'')+n+' '+why,n<0);}
function damage(pl,part,dmg,by,point,instant){if(!pl.alive||pl.doomed&&!instant)return;if(pl.landed&&!instant)return;
 if(pl.human&&G.attract)return;const prt=pl.parts[part]||pl.parts.body;prt.hp-=dmg;pl.hp-=dmg*(part==='wingL'||part==='wingR'||part==='tail'?.7:part.startsWith('eng')&&pl.s.kind==='wing'?.05:1);
 if(by&&by!==pl){pl.dmgBy.set(by,(pl.dmgBy.get(by)||0)+dmg);pl.lastHit=by;pl.lastHitT=G.time;}
 if(pl.human){G.stats.dmg+=dmg;dmgFlash=Math.min(1,dmgFlash+dmg/40);shake=Math.max(shake,Math.min(.8,dmg/30));snd.play('hurt');}
 if(by&&by.human&&!pl.human){G.stats.hits++;hud.hit(false);snd.play('hit');}
 if(point&&pl.p.distanceToSquared(cam.position)<4e6)fx.hitSpark(point,pl.v);
 if((part==='engine'||part.startsWith('eng'))&&prt.hp<pl.s.hp*.25*(pl.hpMul||1)&&!pl.fire&&Math.random()<.25)pl.fire=6+rnd(6);
 if(prt.hp<=0&&!pl.lost[part]){if(part==='wingL'||part==='wingR'||part==='tail'){loseP(pl,part);doom(pl,by);return;}
  if(part==='engine'){pl.lost.engine=true;pl.fire=pl.fire||8;}
  if(part.startsWith('eng')){pl.lost[part]=true;pl.fire=Math.max(pl.fire,4);if(pl.s.kind==='wing'){const pod=pl.mesh.userData.pods[+part.slice(3)];if(pod){pod.children.forEach(c=>{if(c.material&&c.material.color&&c.geometry.type==='CircleGeometry')c.visible=false;});}const fl=pl.mesh.userData.flames[+part.slice(3)];if(fl)fl.visible=false;
    fx.explode(pod?pod.getWorldPosition(new V()):pl.p,1.3,{vel:pl.v,debris:true});sndAt('boom',pl.p,1);if(by&&by.human){addScore(150,'ENGINE DESTROYED');}feed(`${pl.name} ENGINE ${(+part.slice(3))+1} DOWN`,by&&by.human?'good':'');
    const n=Object.keys(pl.lost).filter(k=>k.startsWith('eng')).length;if(n>=4){doom(pl,by);return;}}
   else if(pl.engineFactor()<=.25){doom(pl,by);return;}}}
 if(pl.hp<=0){if(instant||dmg>60)destroy(pl,by,true);else doom(pl,by);}}
function loseP(pl,part){pl.lost[part]=true;const m=pl.mesh.userData.parts[part];if(m)fx.detach(m,pl.v,new V(rs(4),rs(4),rs(8)));fx.explode(pl.p,.6,{vel:pl.v,debris:false});}
function credit(pl,by){const killer=by&&G.time-pl.lastHitT<15?by:pl.lastHit&&G.time-pl.lastHitT<15?pl.lastHit:null;return killer;}
function doom(pl,by){if(pl.doomed)return;pl.doomed=.001;pl.fire=Math.max(pl.fire,20);const k=credit(pl,by);registerKill(pl,k);}
function registerKill(pl,k){pl.deaths++;if(k&&k!==pl&&k.kills!==undefined)k.kills++;
 const val=pl.ace?600:pl.s.kind==='wing'?1500:pl.s.kind==='prop4'?150:100;
 if(k&&k.human){G.stats.kills++;addScore(val,(pl.ace?'ACE DOWN · ':pl.s.kind==='wing'?'FORTRESS DOWN · ':'SPLASH · ')+pl.name);hud.hit(true);snd.play('kill');}
 for(const [p,d] of pl.dmgBy)if(p!==k&&p.human&&d>pl.maxHp*.2){G.stats.assists++;addScore(40,'ASSIST');}
 if(pl.human){G.stats.deaths++;if(!G.attract)addScore(G.ffa?-50:-100,'AIRFRAME LOST');}
 feed(k?`${k.name} ✕ ${pl.name}`:`${pl.name} CRASHED`,k&&k.human?'good':pl.human?'bad':pl.team===0?'ally':'');
 // pilot bails out of fighters
 if(pl.s.kind!=='wing'&&!pl.ejected&&Math.random()<(pl.human?0:.7)){pl.ejected=true;fx.chute(pl.p.clone().add(new V(0,3,0)),pl.v,pl.team);}}
function destroy(pl,by,inAir){if(!pl.alive)return;if(!pl.doomed){pl.doomed=.001;registerKill(pl,credit(pl,by));}pl.alive=false;const size=pl.s.rad/8;
 fx.explode(pl.p,Math.min(4,size*(inAir?1:1.3)),{vel:inAir?pl.v:null});sndAt('boom',pl.p,size);pl.mesh.visible=false;if(pl.trails)pl.trails.forEach(r=>r.orphan=6);pl.trails=null;
 if(pl.human){playerDead={t:0,pos:pl.p.clone(),chute:pl.chute||null};lockT=0;}else pl.respawnT=G.ffa?4:-1;}
function crash(pl,water){if(!pl.alive)return;if(water){fx.splash(pl.p,pl.s.rad/5);sndAt('splash',pl.p,1);}if(!pl.doomed){pl.doomed=.001;registerKill(pl,credit(pl,null));}destroy(pl,null,!water);if(water)fx.explode(pl.p,pl.s.rad/10,{debris:false});}
function siteHit(t,dmg,by){if(t.dead)return;if(t.carrier){if(by&&by.team===0)return;carrier.hp=Math.max(0,carrier.hp-dmg*.02);t.hp=carrier.hp;return;}
 t.hp-=dmg;if(by&&by.human){G.stats.hits++;hud.hit(false);}if(t.hp<=0){t.dead=true;const big=t.big?1.8:1.1;fx.groundBlast(t.p.clone().setY(t.p.y+2),big);fx.burning(t.p.clone().setY(t.p.y+1),t.kind==='fuel'?45:28,t.kind==='fuel'?2:1.1);sndAt('boom',t.p,1.5);
  if(t.kind==='fuel'){setTimeout(()=>{fx.groundBlast(t.p.clone().add(new V(8,4,0)),2.2);sndAt('boom',t.p,2);},300);}
  if(t.ship){t.sinking=0;}else{t.mesh.scale.y=.35;t.mesh.rotation.z=rs(.15);t.mesh.traverse(o=>{if(o.isMesh){o.material=o.material.clone();if(o.material.color)o.material.color.multiplyScalar(.25);}});}
  if(by&&by.human){G.stats.ground++;addScore(t.value,t.label+' DESTROYED');hud.hit(true);snd.play('kill');}feed(`${by?by.name:'?'} ✕ ${t.label}`,by&&by.human?'good':'');}}
function onBullet(tgt,part,dmg,by,point){if(tgt.kind)siteHit(tgt,dmg,by);else{if(tgt.human&&by)dmg*=by.ai?[.32,.62,1][by.ai.skill??1]:[.5,.75,1][opts.diff];damage(tgt,part,dmg,by,point);}}
function onOrd(type,a,p,b){if(type==='missile'){const m=a,own=m.owner;
  for(const pl of G.planes){if(!pl.alive||pl===own||own&&own.team===pl.team&&pl.team>=0)continue;const d=pl.p.distanceTo(p);const r=pl.s.rad+20;if(pl===b||d<r){const f=pl===b?1:Math.max(0,1-(d-pl.s.rad*.5)/r);if(f<=0)continue;
   // missiles shred the closest parts of big aircraft, and are lethal to fighters
   if(pl.s.kind==='wing'||pl.s.kind==='prop4'){let bp='body',bd=1e9;for(const h of pl.mesh.userData.hit){if(pl.lost[h[4]])continue;const w=new V(h[0],h[1],h[2]).applyQuaternion(pl.q).add(pl.p);const dd=w.distanceTo(p);if(dd<bd){bd=dd;bp=h[4];}}damage(pl,bp,(m.kind==='sam'?200:170)*f,own,p,true);}
   else damage(pl,['body','engine','wingL','wingR','tail'][Math.random()*5|0],((m.kind==='sam'?120:115)*f+20)*(pl.human?(own&&own.ai?[.5,.68,.85][own.ai.skill??1]:.75):1),own,p,true);if(own&&own.human)hud.hit(false);}}
  for(const t of G.sites){if(t.dead||own&&own.team===t.team)continue;const d=t.p.distanceTo(p);if(d<t.r+22)siteHit(t,(m.kind==='agm'?160:70)*(1-d/(t.r+30)),own);}
  sndAt('boom',p,.8);}
 else if(type==='bomb'){const own=a;for(const t of G.sites){if(t.dead||own&&own.team===t.team)continue;const d=Math.hypot(t.p.x-p.x,t.p.z-p.z);if(t.carrier){const l=deckLocal(p);if(W.onDeck(l.x,l.z)||d<60){carrier.hp=Math.max(0,carrier.hp-7);t.hp=carrier.hp;fx.burning(p,15,.8);feed('CARRIER HIT','bad');}continue;}
   if(d<t.r+40)siteHit(t,280*Math.max(.15,1-d/(t.r+45)),own);}
  for(const pl of G.planes){if(pl.alive&&pl.p.distanceTo(p)<40&&pl!==own)damage(pl,'body',60,own,p);}sndAt('boom',p,1.4);}}

/* ================= carrier ================= */
const _yaw=new Qt(),_iy=new Qt();
function updCarrier(dt){carrier.p.addScaledVector(carrier.dir,carrier.speed*dt);const yaw=Math.atan2(-carrier.dir.x,-carrier.dir.z);carrierMesh.position.copy(carrier.p);carrierMesh.rotation.set(0,yaw,0);_yaw.setFromAxisAngle(new V(0,1,0),yaw);_iy.copy(_yaw).invert();
 if(carrier.target){carrier.target.p.set(carrier.p.x,W.DECK_Y,carrier.p.z);carrier.target.markP.set(carrier.p.x,W.DECK_Y+60,carrier.p.z);carrier.target.dead=carrier.hp<=0;carrier.target.hp=carrier.hp;}}
function deckLocal(p){return p.clone().sub(carrier.p).applyQuaternion(_iy);}
function deckWorld(l){return l.clone().applyQuaternion(_yaw).add(carrier.p);}

/* ================= input ================= */
const keys={},edge={};let mouseL=false,mouseR=false,padMode=false,mdx=0,mdy=0,locked=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='play')pause(true);else if(G.app==='paused')pause(false);}
 if(e.code==='Enter'&&G.app==='brief')launch();
 if(G.app!=='play')return;if(e.code==='KeyV')toggleCam();if(e.code==='KeyM'){snd.on=!snd.on;toast(snd.on?'SOUND ON':'SOUND OFF');}if(e.code==='KeyL'&&G.player)G.player.gearManual=!G.player.gearManual;});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseL=mouseR=false;});
canvas.addEventListener('mousedown',e=>{if(G.app!=='play')return;if(!locked)lock();if(e.button===0)mouseL=true;if(e.button===2){mouseR=true;edge.Fire2=true;}if(e.button===1){e.preventDefault();}});
addEventListener('mouseup',e=>{if(e.button===0)mouseL=false;if(e.button===2)mouseR=false;});addEventListener('contextmenu',e=>{if(G.app==='play')e.preventDefault();});
addEventListener('mousemove',e=>{if(G.app!=='play')return;mdx+=e.movementX||0;mdy+=e.movementY||0;if(Math.abs(e.movementX)+Math.abs(e.movementY)>2)padMode=false;});
function lock(){if(G.app!=='play')return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='play')pause(true);});
const padPrev={};
function readPad(){const gp=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean)[0]:null;if(!gp)return null;const a=gp.axes,b=gp.buttons,dz=v=>Math.abs(v)>.15?(v-Math.sign(v)*.15)/.85:0;
 const P={lx:dz(a[0]||0),ly:dz(a[1]||0),rx:dz(a[2]||0),ry:dz(a[3]||0),rt:b[7]?.value||0,lt:b[6]?.value||0,A:b[0]?.pressed,B:b[1]?.pressed,X:b[2]?.pressed,Y:b[3]?.pressed,LB:b[4]?.pressed,RB:b[5]?.pressed,back:b[8]?.pressed,start:b[9]?.pressed,up:b[12]?.pressed,down:b[13]?.pressed};
 const ed=k=>P[k]&&!padPrev[k];P.e={};for(const k of['A','B','X','Y','back','start','up','down'])P.e[k]=ed(k);for(const k of['A','B','X','Y','back','start','up','down'])padPrev[k]=P[k];P.e.LT=P.lt>.5&&!padPrev.LT;padPrev.LT=P.lt>.5;
 if(Math.abs(P.lx)+Math.abs(P.ly)>.05)padMode=true;return P;}

/* ================= camera rig (mouse aim) ================= */
const _m=new THREE.Matrix4(),UPW=new V(0,1,0),_f=new V(),_u=new V(),_r=new V(),_t=new V(),_t2=new V(),_qa=new Qt(),_qb=new Qt();
function resetRig(pl){if(!pl)return;const f=pl.fwd(new V());_m.lookAt(new V(),f,Math.abs(f.y)<.9?UPW:pl.up(new V()));rigQ.setFromRotationMatrix(_m);look.yaw=look.pitch=0;}
const aimDir=()=>_t.set(0,0,-1).applyQuaternion(rigQ);
function rotateRig(dx,dy){const up=_u.set(0,1,0).applyQuaternion(rigQ),rt=_r.set(1,0,0).applyQuaternion(rigQ);_qa.setFromAxisAngle(up,-dx);_qb.setFromAxisAngle(rt,-dy);rigQ.premultiply(_qa).premultiply(_qb).normalize();
 const f=_f.set(0,0,-1).applyQuaternion(rigQ);_m.lookAt(new V(),f,Math.abs(f.y)<.92?UPW:up);rigQ.setFromRotationMatrix(_m);}
function toggleCam(){camMode=camMode==='chase'?'cockpit':'chase';const pl=G.player;if(!pl)return;if(camMode==='cockpit'){if(!cockpit)cockpit=buildCockpit();pl.mesh.add(cockpit);cockpit.position.copy(pl.mesh.userData.eye);if(pl.mesh.userData.canopy)pl.mesh.userData.canopy.visible=false;pl.mesh.userData.parts.body.visible=false;}
 else{if(cockpit)cockpit.removeFromParent();if(pl.mesh.userData.canopy)pl.mesh.userData.canopy.visible=true;pl.mesh.userData.parts.body.visible=true;}}

/* ================= player control ================= */
let thrSet=.85;
function playerInput(pl,dt,P){const c=pl.ctrl;
 if(padMode&&P){c.pitch=-P.ly;c.roll=P.lx;c.yaw=(P.RB?1:0)-(P.LB?1:0);}
 else instruct(pl,aimDir(),c);
 if(keys.KeyA||keys.KeyD)c.roll=(keys.KeyD?1:0)-(keys.KeyA?1:0);if(keys.KeyQ||keys.KeyE)c.yaw=(keys.KeyE?1:0)-(keys.KeyQ?1:0);
 if(keys.ArrowLeft||keys.ArrowRight)c.roll=(keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0);if(keys.ArrowUp||keys.ArrowDown)c.pitch=(keys.ArrowDown?1:0)-(keys.ArrowUp?.6:0);
 if(keys.KeyW)thrSet=Math.min(1,thrSet+dt*.7);if(keys.KeyS)thrSet=Math.max(0,thrSet-dt*.7);if(P&&P.up)thrSet=Math.min(1,thrSet+dt*.7);if(P&&P.down)thrSet=Math.max(0,thrSet-dt*.7);
 c.thr=thrSet;c.ab=!!(keys.ShiftLeft||keys.ShiftRight||P&&P.A);c.brake=!!(keys.ControlLeft||keys.ControlRight||P&&P.lt>.5&&!P.X);
 c.fire=mouseL||!!keys.KeyK||!!(P&&P.rt>.3);c.flare=!!(keys.KeyF||keys.KeyX||P&&P.B);c.bomb=!!(edge.Space||P&&P.e.X);c.mslPress=!!(edge.Fire2||edge.KeyR||P&&P.e.Y);
 if((edge.KeyJ||P&&P.e.back)&&pl.alive&&!pl.doomed&&!pl.landed)eject(pl);}
function eject(pl){pl.ejected=true;pl.chute=fx.chute(pl.p.clone().add(new V(0,4,0)),pl.v,0);snd.play('eject');if(pl.mesh.userData.canopy)pl.mesh.userData.canopy.visible=false;doom(pl,null);toast('EJECTED',true);}

/* ================= weapons ================= */
const COL={0:[2.4,1.5,.45],1:[2.6,.5,.35],ffa:[2.2,1.9,.9],turret:[2.4,.6,.4]};
function weapons(pl,dt){const s=pl.s,c=pl.ctrl;pl.gunT-=dt;pl.flareT-=dt;pl.bombT-=dt;pl.mslT-=dt;
 if(s.gun){const firing=c.fire&&pl.ammo>0&&!pl.overheat&&!pl.doomed&&!pl.landed;if(firing){const g=s.gun,f=pl.fwd(_f),ud=pl.mesh.userData;let n=0;while(pl.gunT<=0&&n<4){pl.gunT+=1/g.rof;n++;const gp=ud.gun[(pl.gunI=(pl.gunI||0)+1)%ud.gun.length];
    const o=_t2.copy(gp).applyQuaternion(pl.q).add(pl.p);const v=_t.copy(f).add(new V(rs(g.spread),rs(g.spread),rs(g.spread))).normalize().multiplyScalar(g.spd).add(pl.v);
    bullets.fire(pl,o,v,g.dmg,pl.human?g.tr:pl.team===0?[1.5,1.6,2.2]:pl.team<0?COL.ffa:COL[1]);pl.ammo--;pl.heat+=g.heat;if(pl.human){G.stats.shots++;}
    if(pl.p.distanceToSquared(cam.position)<1e6)fx.add.emit(o.x+f.x*1.5,o.y+f.y*1.5,o.z+f.z*1.5,pl.v.x,pl.v.y,pl.v.z,3,2,.8,s.kind==='prop'?.9:1.5,.2,.05,{drag:0});}
   if(pl.human&&n){snd.play(s.kind==='prop'?'mg':s.id==='anvil'?'heavy':'cannon');shake=Math.max(shake,s.id==='anvil'?.18:.08);}else if(n&&!pl.human){const d=pl.p.distanceTo(cam.position);if(d<900&&Math.random()<.4)snd.play('enemyGun',1-d/900);}
   if(pl.heat>=1){pl.overheat=true;if(pl.human)toast('GUNS OVERHEATED',true);}}
  else{pl.gunT=Math.max(pl.gunT,0);}pl.heat=Math.max(0,pl.heat-s.gun.cool*dt*(c.fire?.25:1));if(pl.overheat&&pl.heat<.35)pl.overheat=false;}
 if(c.flare&&pl.flareT<=0&&pl.flares>0&&!pl.doomed){pl.flareT=pl.human?.45:.6;pl.flares--;ord.dropFlares(pl);if(pl.human||pl.p.distanceToSquared(cam.position)<6e5)snd.play('flare');}
 if(c.bomb&&pl.bombT<=0&&pl.bombs>0&&!pl.doomed&&!pl.landed){pl.bombT=.25;pl.bombs--;ord.dropBomb(pl);if(pl.human)snd.play('bomb');}
 if(c.msl&&pl.msl>0&&pl.mslT<=0){pl.mslT=1;pl.msl--;ord.launch(pl,c.msl,'ir');sndAt('msl',pl.p,.8);}
 if(pl.human&&c.mslPress&&pl.msl>0&&mslCd<=0&&!pl.landed&&!pl.doomed){mslCd=.6;pl.msl--;G.stats.mslFired++;const tg=lockT>=1?lockTgt:null;ord.launch(pl,tg,tg&&tg.kind?'agm':'ir');snd.play('msl');if(!tg)toast('NO LOCK · DUMBFIRE',true);}}

/* ================= turrets: bomber/fortress gunners, carrier CIWS, AA + SAM sites, destroyer ================= */
const turretOwner=team=>({team,name:team===0?'CV-07':'GUNNER',human:false,alive:true,p:new V(),kills:undefined});
const TO={0:turretOwner(0),1:turretOwner(1)};const _ga=new V(),_gb=new V();
function gunners(dt){for(const pl of G.planes){if(!pl.alive||pl.doomed||!pl.mesh.userData.turrets.length)continue;const ud=pl.mesh.userData;pl.turT=(pl.turT||0)-dt;if(pl.turT>0)continue;pl.turT=pl.s.kind==='wing'?.07:.1;
  const range=pl.s.kind==='wing'?1100:750;for(const t of ud.turrets){t.getWorldPosition(_ga);const tgt=gunnerAim(_ga,world,pl.team,range,_gb);if(!tgt)continue;t.lookAt(_gb);t.rotateY(Math.PI);
   if(Math.random()<.55){const sp=.022*(1.6-.5*(G.opts.diff));const d=_t.subVectors(_gb,_ga).normalize().add(new V(rs(sp),rs(sp),rs(sp))).normalize().multiplyScalar(850).add(pl.v);bullets.fire(TO[pl.team===0?0:1],_ga,d,2.6,COL.turret,1.6);}}}
 // carrier CIWS
 if(carrier.target&&carrier.hp>0&&!G.ffa)carrierMesh.userData.ciws.forEach((c,i)=>{carrier.ciwsT[i]-=dt;if(carrier.ciwsT[i]>0)return;carrier.ciwsT[i]=.05;c.getWorldPosition(_ga);_ga.y+=2;const tgt=gunnerAim(_ga,world,0,1500,_gb);if(!tgt)return;c.lookAt(_gb.x,_ga.y,_gb.z);c.rotateY(Math.PI);
  const d=_t.subVectors(_gb,_ga).normalize().add(new V(rs(.012),rs(.012),rs(.012))).normalize().multiplyScalar(1100);bullets.fire(TO[0],_ga,d,1.6,[1.8,1.2,.5],1.5);});
 // ground sites + ships
 for(const t of G.sites){if(t.dead){if(t.ship&&t.sinking!==undefined&&t.sinking<30){t.sinking+=dt;t.mesh.position.y-=dt*.45;t.mesh.rotation.z+=dt*.012;}continue;}
  if(t.ship){t.p.addScaledVector(t.dir,t.speed*dt);t.mesh.position.copy(t.p);t.mesh.rotation.y=Math.atan2(-t.dir.x,-t.dir.z);t.markP.set(t.p.x,40,t.p.z);}
  if(t.kind==='radar'&&t.mesh.userData.spin)t.mesh.userData.spin.rotation.y+=dt*1.2;
  const radarUp=G.sites.some(s=>s.kind==='radar'&&!s.dead&&s.team===t.team);
  if(t.kind==='aa'||t.ship){t.gunT-=dt;if(t.gunT>0)continue;t.gunT=(t.ship?.8:1.15)*(radarUp?1:1.6)*(1.25-G.opts.diff*.15);
   _ga.copy(t.p);_ga.y+=t.ship?14:4;const tgt=gunnerAim(_ga,world,t.team,t.ship?2600:3000,_gb);if(!tgt||tgt.p.y<60)continue;const tu=t.mesh.userData.turret;if(tu){_t.subVectors(_gb,_ga);tu.rotation.y=Math.atan2(-_t.x,-_t.z)-t.mesh.rotation.y;if(t.mesh.userData.pitch)t.mesh.userData.pitch.rotation.x=Math.atan2(_t.y,Math.hypot(_t.x,_t.z));}
   if(t.ship)for(const tt of t.mesh.userData.turrets){tt.lookAt(_gb.x,tt.getWorldPosition(_t2).y,_gb.z);tt.rotateY(Math.PI);}
   const dist=_ga.distanceTo(_gb),err=(28+dist*.016)*(radarUp?1:1.5)*(tgt.human?1:1.4);const burst=_gb.clone().add(new V(rs(err),rs(err),rs(err)));
   const flight=dist/700;setTimeout(()=>{if(G.app!=='play'&&G.app!=='menu')return;fx.flak(burst);sndAt('flak',burst,.7);for(const pl of G.planes){if(!pl.alive||pl.team===t.team&&pl.team>=0)continue;const d=pl.p.distanceTo(burst);if(d<30)damage(pl,['body','wingL','wingR','tail','engine'][Math.random()*5|0],26*(1-d/30),null,burst);}},flight*1000);
   if(t.ship&&tgt.p.distanceTo(_ga)<1400){for(let k=0;k<6;k++){const d=_t.subVectors(tgt.p,_ga).normalize().add(new V(rs(.02),rs(.02),rs(.02))).normalize().multiplyScalar(900);bullets.fire(TO[1],_ga,d,2,COL.turret,1.8);}}}
  if(t.kind==='sam'){t.cd-=dt;if(t.cd>0)continue;_ga.copy(t.p);_ga.y+=4;let tgt=null,bd=5200;for(const pl of G.planes){if(!pl.alive||pl.doomed||pl.team===t.team||pl.p.y<120)continue;const d=pl.p.distanceTo(_ga);if(d<bd&&(pl.human?1:Math.random()<.4)){bd=d;tgt=pl;}}
   if(!tgt){t.cd=1;continue;}t.cd=(radarUp?13:20)-G.opts.diff*2;const src={team:t.team,p:_ga.clone(),v:null,q:new Qt(),name:'SAM SITE',mesh:null,alive:true};ord.launch(src,tgt,'sam');sndAt('msl',_ga,1.2);if(tgt.human)toast('SAM LAUNCH!',true);}}}

/* ================= simulation step ================= */
function collide(pl,dt){if(!pl.alive||pl.landed)return;const p=pl.p;
 // carrier deck
 if(carrier.target&&p.y<W.DECK_Y+12&&p.y>W.DECK_Y-6){const l=deckLocal(p);if(W.onDeck(l.x,l.z)){const gh=pl.mesh.userData.gearH||1.2;if(p.y<W.DECK_Y+gh){touchDeck(pl,l);return;}}}
 if(p.y<1.2){crash(pl,true);return;}
 if(p.y<1500){const h=W.height(p.x,p.z);if(p.y<h+1.2){crash(pl,false);return;}}
 if(carrier.target){const l=deckLocal(p);if(Math.abs(l.x)<20&&Math.abs(l.z)<150&&p.y<W.DECK_Y-1){crash(pl,false);}}}
function touchDeck(pl,l){const rel=pl.v.clone().addScaledVector(carrier.dir,-carrier.speed),s=pl.s;const up=pl.up(_u),f=pl.fwd(_f);const roll=Math.abs(Math.asin(cl(pl.right(_r).y,-1,1))),pitch=Math.asin(cl(f.y,-1,1));
 const ok=pl.gear&&rel.length()<(s.kind==='prop'?95:120)&&pl.v.y>-11&&roll<.4&&pitch>-.2&&pitch<.4&&up.y>.7&&!pl.doomed;
 if(!ok){fx.explode(pl.p,1.2);crash(pl,false);if(pl.human)toast(pl.gear?'TOO FAST / TOO STEEP':'GEAR UP!',true);return;}
 const yaw=Math.atan2(-f.x,-f.z)-Math.atan2(-carrier.dir.x,-carrier.dir.z);pl.landed={lx:l.x,lz:l.z,yaw,sp:rel.length(),trap:l.z>30&&l.z<140,t:0,done:false,cat:false};
 snd.play('land');shake=.6;if(pl.landed.trap){snd.play('trap');toast('TRAPPED · WIRE 3');}else toast('TOUCHDOWN');}
function deckRoll(pl,dt){const L=pl.landed;L.t+=dt;const yaw=Math.atan2(-carrier.dir.x,-carrier.dir.z)+L.yaw;const fwdL=new V(-Math.sin(L.yaw),0,-Math.cos(L.yaw));
 if(L.cat){L.sp+=dt*(pl.s.kind==='prop'?28:45);L.lx+=fwdL.x*L.sp*dt;L.lz+=fwdL.z*L.sp*dt;if(L.lz<-150||!W.onDeck(L.lx,L.lz)){const d=new V(-Math.sin(yaw),.08,-Math.cos(yaw)).normalize();pl.landed=null;pl.v.copy(d).multiplyScalar(L.sp).addScaledVector(carrier.dir,carrier.speed);pl.sp=pl.v.length();pl.p.y=W.DECK_Y+4;pl.w.set(0,0,0);toast('LAUNCH!');snd.play('msl');resetRig(pl);return;}}
 else{L.sp=Math.max(0,L.sp-dt*(L.trap?28:14));L.lx+=fwdL.x*L.sp*dt;L.lz+=fwdL.z*L.sp*dt;if(!W.onDeck(L.lx,L.lz)){pl.landed=null;pl.p.y=W.DECK_Y+1;return;}}
 const wp=deckWorld(new V(L.lx,W.DECK_Y+(pl.mesh.userData.gearH||1.2),L.lz));pl.p.copy(wp);pl.q.setFromEuler(new THREE.Euler(.03,yaw,0,'YXZ'));pl.v.copy(carrier.dir).multiplyScalar(carrier.speed).add(fwdL.clone().applyQuaternion(_yaw).multiplyScalar(L.sp));pl.sp=pl.v.length();pl.g=1;pl.w.set(0,0,0);
 if(!L.done&&L.sp<1.5){L.done=true;pl.hp=pl.maxHp;const s=pl.s;pl.reset();applyHpMul(pl);pl.landed=L;if(Object.keys(pl.lost).length)rebuild(pl);pl.gear=true;
  if(pl.human){G.stats.landings++;if(!G.landBonus){G.landBonus=true;addScore(300,'CARRIER LANDING BONUS');}else toast('REARMED · REPAIRED');}}
 if(L.done&&pl.ctrl.thr>.92&&!L.cat){L.cat=true;L.sp=2;toast('CATAPULT');}}
function rebuild(pl){const vis=pl.mesh.visible;scene.remove(pl.mesh);pl.mesh=buildModel(pl.type,pl.livery);pl.mesh.visible=vis;scene.add(pl.mesh);if(pl.human&&camMode==='cockpit'){camMode='chase';toggleCam();}}
function sim(dt){G.time+=dt;world.time=G.time;updCarrier(dt);const P=G.app==='play'?readPad():null;if(P&&P.e.start)pause(true);mslCd-=dt;
 for(const pl of G.planes){if(!pl.alive){continue;}
  if(pl.doomed){pl.doomed+=dt;const c=pl.ctrl;c.fire=c.flare=c.bomb=false;c.msl=null;c.mslPress=false;if(!pl.lost.wingL&&!pl.lost.wingR){c.pitch=Math.sin(pl.doomed*.7+pl.id)*.3-.25;c.roll=pl.id%2?.6:-.6;}c.thr=pl.lost.engine?0:.4;if(pl.doomed>(pl.s.kind==='wing'?25:9))destroy(pl,null,true);continue;}
  if(pl.human){if(G.app==='play'&&!G.result)playerInput(pl,dt,P);else{instruct(pl,aimDir(),pl.ctrl);pl.ctrl.fire=false;pl.ctrl.mslPress=false;}}
  else think(pl,world,dt);}
 for(const pl of G.planes){if(!pl.alive)continue;weapons(pl,dt);
  // auto gear near the carrier, slow and low
  if(pl.human){const near=carrier.target&&pl.p.distanceTo(carrier.p)<3500&&pl.p.y<450&&pl.sp<(pl.s.kind==='prop'?120:150);pl.gear=!!pl.landed||(pl.gearManual!==undefined&&pl.gearManual)||near;}
  if(pl.landed)deckRoll(pl,dt);else fly(pl,dt);
  if(pl.fire>0){pl.fire-=dt;damage(pl,'body',dt*(pl.s.kind==='wing'?2:3.2),null,null,false);}
  collide(pl,dt);}
 bullets.update(dt,G.planes,G.sites,fx,onBullet,cam);ord.update(dt,world,onOrd);gunners(dt);
 // respawns (dogfight CPUs) + cleanup
 for(let i=G.planes.length-1;i>=0;i--){const pl=G.planes[i];if(pl.alive||pl.human)continue;if(pl.respawnT>0){pl.respawnT-=dt;if(pl.respawnT<=0)respawnCPU(pl);}else if(pl.respawnT<0){scene.remove(pl.mesh);G.planes.splice(i,1);}}}
function farSpot(minD=2500){const c=new V(1200,0,600);for(let k=0;k<20;k++){const a=rnd(6.28),r=1800+rnd(2400);const p=new V(c.x+Math.cos(a)*r,1200+rnd(1200),c.z+Math.sin(a)*r);if(G.planes.every(o=>!o.alive||o.p.distanceTo(p)>minD))return p;}return new V(c.x+rs(3000),1600,c.z+rs(3000));}
function respawnCPU(pl){pl.reset();applyHpMul(pl);pl.ejected=false;pl.lastHit=null;pl.dmgBy.clear();rebuild(pl);pl.mesh.visible=true;const p=farSpot();pl.place(p,new V(1200-p.x,0,600-p.z),220);pl.ai.t=0;pl.ai.tgt=null;}
function respawnPlayer(){const pl=G.player;pl.reset();applyHpMul(pl);pl.ejected=false;pl.chute=null;pl.lastHit=null;pl.dmgBy.clear();rebuild(pl);pl.mesh.visible=true;
 if(G.ffa){const p=farSpot(2000);pl.place(p,new V(1200-p.x,0,600-p.z),pl.s.vmax*.75);}else{const p=carrier.p.clone().add(new V(0,900,0)).addScaledVector(carrier.dir,-1200);pl.place(p,carrier.dir,pl.s.vmax*.75);}
 thrSet=.85;resetRig(pl);playerDead=null;banner(G.ffa?'RESPAWN':'NEW AIRFRAME',G.ffa?'':`${G.lives} AIRFRAME${G.lives>1?'S':''} REMAINING`,1.6);}

/* ================= per-frame update ================= */
function frame(dt){const playing=G.app==='play'||G.app==='brief'||G.app==='menu';
 if(G.app==='play'||G.app==='menu'){
  const sdt=dt*slowmo;G.acc=(G.acc||0)+sdt;let n=0;while(G.acc>=DT&&n<6){sim(DT);G.acc-=DT;n++;}if(n>=6)G.acc=0;
  if(G.app==='play'){flow(dt);}else{menuDirector(dt);}}
 // mouse aim
 if(G.app==='play'&&G.player){const sens=.0021*(opts.sens||1);if(keys.KeyC){look.yaw-=mdx*sens*1.4;look.pitch=cl(look.pitch-mdy*sens*1.4,-1.2,1.2);}else{if(!padMode)rotateRig(mdx*sens,mdy*sens);look.yaw*=Math.exp(-dt*6);look.pitch*=Math.exp(-dt*6);}
  if(padMode&&G.player.alive){const f=G.player.fwd(_f);_m.lookAt(new V(),f,Math.abs(f.y)<.92?UPW:_u.set(0,1,0).applyQuaternion(rigQ));_qa.setFromRotationMatrix(_m);rigQ.slerp(_qa,Math.min(1,dt*5));}}
 mdx=mdy=0;for(const k in edge)delete edge[k];
 visuals(dt);camera(dt);hudUpdate(dt);}
function flow(dt){const M=G.mission,pl=G.player;
 if(!G.result){G.clock-=dt;if(G.clock<=0){G.clock=0;const r=M.clockEnd(G);G.failWhy='time';endSortie(r);}else{const r=M.tick(G,dt);if(r){G.failWhy=r==='lose'?'obj':'';endSortie(r);}}}
 if(G.result){G.endT+=dt;slowmo=G.endT<2.2?.35:1;if(G.endT>3.6){slowmo=1;showOver();return;}}
 // player death + respawn
 if(playerDead){playerDead.t+=dt;if(playerDead.t>4&&!G.result){if(G.ffa||G.lives>1){if(!G.ffa)G.lives--;respawnPlayer();}else{G.lives=0;G.failWhy='lives';endSortie('lose');}}}
 else if(pl&&!pl.alive&&!playerDead){playerDead={t:0,pos:pl.p.clone(),chute:pl.chute};}
 else if(pl&&pl.doomed&&!playerDead&&pl.doomed>(pl.ejected?3.5:6)){destroy(pl,null,true);}
 // combat area
 if(pl&&pl.alive&&!pl.doomed){const out=Math.abs(pl.p.x)>W.WORLD||Math.abs(pl.p.z)>W.WORLD||pl.p.y>9500;bounds=out?bounds+dt:Math.max(0,bounds-dt*2);if(bounds>10){bounds=0;doom(pl,null);destroy(pl,null,true);toast('LEFT THE COMBAT AREA',true);}}}
// menu: cinematic cameras on the CPU dogfight
function menuDirector(dt){menuSwitch-=dt;if(!menuFocus||!menuFocus.alive||menuSwitch<=0){const al=G.planes.filter(p=>p.alive&&!p.doomed);menuFocus=al[(Math.random()*al.length)|0]||null;menuSwitch=8+rnd(4);menuCamT=0;}}

/* ================= visuals ================= */
const _pv=new V(),_iq=new Qt(),_w=new V();
function planeVis(pl,dt){const m=pl.mesh,ud=m.userData;if(!pl.alive){return;}m.position.copy(pl.p);m.quaternion.copy(pl.q);const near=pl.p.distanceToSquared(cam.position);
 for(const pr of ud.props){const on=!pl.lost.engine;const rpm=on?(18+pl.thr*40):Math.max(0,(pr.rpm||0)-dt*20);pr.rpm=rpm;pr.bl.rotation.z+=rpm*dt;pr.disc.visible=rpm>25;pr.bl.visible=rpm<45||near<900;}
 ud.flames.forEach((f,i)=>{if(!f.visible&&pl.s.kind==='wing')return;const on=pl.engineFactor()>0;const k=on?Math.pow(pl.thr,1.4):0;f.material.uniforms.uP.value=k;f.material.uniforms.uAB.value=pl.ab?1:0;f.material.uniforms.uT.value=G.time;f.scale.set(1,1,(.35+k*.65)*(pl.ab?1.7:1)*(.92+rnd(.16)));const g=ud.glows[i];if(g)g.material.opacity=on?.25+k*.5+(pl.ab?.4:0):0;});
 if(ud.gear)ud.gear.visible=!!pl.gear;if(ud.strobe)ud.strobe.visible=(G.time*1.1+pl.id*.37)%1<.06;
 // trails: wingtip vortices when pulling G, engine contrails up high, missile-like smoke when damaged
 const far=near>36e6;if(!pl.trails&&!far){pl.trails=[fx.ribbon(40,.3,new THREE.Color(1,1,1),.38,1.4),fx.ribbon(40,.3,new THREE.Color(1,1,1),.38,1.4),fx.ribbon(70,1.1,new THREE.Color(1,1,1),.38,12)];}
 if(pl.trails){const vort=Math.abs(pl.g)>4.2&&pl.sp>90&&!pl.doomed;for(let i=0;i<2;i++){_w.copy(ud.tips[i]).applyQuaternion(pl.q).add(pl.p);pl.trails[i].push(_w,vort&&!pl.lost[i?'wingR':'wingL'],dt,2.5);}
  const ce=ud.engines[0]?_w.copy(ud.engines[0]).applyQuaternion(pl.q).add(pl.p):pl.p;pl.trails[2].push(ce,pl.p.y>4000,dt,6);}
 // damage smoke + fire
 if(near<64e6){pl.smokeAcc+=dt;const hpk=pl.hp/pl.maxHp;const rate=pl.doomed?.012:pl.fire>0?.02:hpk<.3?.03:hpk<.6?.06:0;
  if(rate){while(pl.smokeAcc>rate){pl.smokeAcc-=rate;const e=ud.engines[(Math.random()*ud.engines.length)|0];const ep=e?_w.copy(e).applyQuaternion(pl.q).add(pl.p):pl.p;fx.smokePuff(ep,pl.v,pl.fire>0||pl.doomed?.9:hpk<.3?.6:.25,pl.s.rad>15?2:1);if(pl.fire>0||pl.doomed)fx.firePuff(ep,pl.v);}}else pl.smokeAcc=0;
  if(pl.s.kind==='wing')for(const [k,v] of Object.entries(pl.lost))if(k.startsWith('eng')&&v&&Math.random()<.5){const pod=ud.pods[+k.slice(3)];pod.getWorldPosition(_w);fx.smokePuff(_w,pl.v,.9,2.5);fx.firePuff(_w,pl.v);}}}
function visuals(dt){for(const pl of G.planes)planeVis(pl,dt);fx.update(dt,cam);if(clouds)clouds.update(cam);ocean.update(cam);sky.position.copy(cam.position);W.SKYU.uTime.value=performance.now()/1000%10000;
 carrierMesh.userData.radar.rotation.y+=dt*1.4;
 const ships=[carrier.target?{p:carrier.p,d:carrier.dir,L:300}:null,...G.sites.filter(s=>s.ship&&!s.dead).map(s=>({p:s.p,d:s.dir,L:120}))].filter(Boolean);ocean.U.uShips.value.forEach((v,i)=>{const s=ships[i];if(s){v.set(s.p.x,s.p.z,s.d.x,s.d.z);ocean.U.uShipL.value[i]=s.L;}else ocean.U.uShipL.value[i]=0;});
 const fc=G.player&&G.player.alive?G.player.p:cam.position;const sd=W.SKYU.uSun.value;sun.position.copy(fc).addScaledVector(sd,800);sun.target.position.copy(fc);}

/* ================= camera ================= */
let camShakeV=new V(),fovNow=62;
function camera(dt){const pl=G.player;let fov=62;
 if(G.app==='menu'||G.app==='brief'&&!pl){const f=menuFocus||G.planes[0];menuCamT+=dt;if(f){const fw=f.fwd(_f),side=_r.set(-fw.z,0,fw.x).normalize();const ph=menuCamT*.12;const off=_t.copy(side).multiplyScalar(Math.cos(ph)*38).addScaledVector(fw,-30+Math.sin(ph)*44).add(_u.set(0,9+Math.sin(ph*.7)*5,0));
   const want=_t2.copy(f.p).add(off);if(menuCamT<.05)cam.position.copy(want);else cam.position.lerp(want,1-Math.exp(-dt*3));cam.lookAt(f.p);}fov=48;}
 else if(G.app==='brief'&&pl){menuCamT+=dt;const fw=pl.fwd(_f),side=_r.set(-fw.z,0,fw.x).normalize();const a=menuCamT*.18;const off=_t.copy(side).multiplyScalar(Math.cos(a)*24).addScaledVector(fw,Math.sin(a)*30+6).add(_u.set(0,6,0));cam.position.copy(pl.p).add(off);cam.lookAt(pl.p);fov=42;}
 else if(pl){if(playerDead||!pl.alive||pl.ejected&&pl.chute){const tgt=pl.chute?pl.chute.g.position:playerDead?playerDead.pos:pl.p;const a=G.time*.25;const want=_t2.set(tgt.x+Math.cos(a)*60,tgt.y+25,tgt.z+Math.sin(a)*60);cam.position.lerp(want,1-Math.exp(-dt*2));cam.lookAt(tgt);fov=55;}
  else if(camMode==='cockpit'&&!pl.landed){cam.position.copy(pl.mesh.userData.eye).applyQuaternion(pl.q).add(pl.p);cam.quaternion.copy(pl.q);if(look.yaw||look.pitch){_qa.setFromEuler(new THREE.Euler(look.pitch,look.yaw,0,'YXZ'));cam.quaternion.multiply(_qa);}fov=74;}
  else{const dist=pl.s.rad*2.3+9,hgt=pl.s.rad*.45+2.6;const q=_qb.copy(rigQ);if(look.yaw||look.pitch){_qa.setFromEuler(new THREE.Euler(look.pitch,look.yaw,0,'YXZ'));q.multiply(_qa);}
   const back=_t.set(0,0,-1).applyQuaternion(q),up=_u.set(0,1,0).applyQuaternion(q);cam.position.copy(pl.p).addScaledVector(back,-dist).addScaledVector(up,hgt);cam.quaternion.copy(q);
   // keep above water / terrain
   const gh=Math.max(W.hAt(cam.position.x,cam.position.z),0)+3;if(cam.position.y<gh)cam.position.y=gh;fov=62+cl((pl.sp-150)/250,0,1)*8+(pl.ab?3:0);}
  shake=Math.max(0,shake-dt*2.2)+(pl.alive&&!pl.doomed?(pl.over?.15:0)+(pl.stall>.4?.08:0)+(pl.ab?.04:0):0)*dt*4;}
 fovNow+=(fov-fovNow)*Math.min(1,dt*3);cam.fov=fovNow;cam.near=camMode==='cockpit'&&G.app==='play'?.25:1;cam.updateProjectionMatrix();
 if(shake>0.001){const s=shake*shake*.6;cam.position.x+=rs(s);cam.position.y+=rs(s);cam.position.z+=rs(s);_qa.setFromEuler(new THREE.Euler(rs(s*.01),rs(s*.01),rs(s*.01)));cam.quaternion.multiply(_qa);}}

/* ================= HUD ================= */
const ovc={};function ov(id,v){v=Math.round(v*50)/50;if(ovc[id]===v)return;ovc[id]=v;const e=$(id);e.style.display=v>0?'block':'none';e.style.opacity=v;}
const hc={};function setTxt(id,v){if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}}
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
function feed(t,cls=''){const d=document.createElement('div');d.textContent=t;d.className=cls;$('feed').prepend(d);setTimeout(()=>d.remove(),5000);while($('feed').children.length>6)$('feed').lastChild.remove();}
let banT=0;function banner(t,s,dur=2.4,col){$('bt').textContent=t;$('bt').style.color=col||'';$('bs').textContent=s||'';$('bs').hidden=!s;$('banner').classList.add('on');banT=dur;if(G.app==='play')snd.play('banner');}
function toast(t,bad){const d=document.createElement('div');d.textContent=t;if(bad)d.className='bad';$('toasts').appendChild(d);setTimeout(()=>d.remove(),1800);while($('toasts').children.length>4)$('toasts').firstChild.remove();}
function sndAt(k,p,a=1){const d=p.distanceTo(cam.position);if(d<6000)snd.play(k,a*Math.min(1,500/(d+150)));}
const SEEK=.21;
function hudUpdate(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}
 const pl=G.player,playing=G.app==='play'&&pl;
 if(!playing){hud.draw({hidden:true});ov('gfx',0);ov('dmg',0);ov('cloudfx',clouds?Math.min(.85,clouds.density(cam.position)*1.6):0);return;}
 const alive=pl.alive&&!pl.doomed,f=pl.fwd(new V());
 // missile seeker: candidate closest to the nose
 let cand=null,ca=SEEK;if(alive&&pl.msl>0){for(const o of G.planes){if(!hostile(pl,o)||o.doomed)continue;const d=o.p.distanceTo(pl.p);if(d>4200||d<200)continue;const a=f.angleTo(_t.subVectors(o.p,pl.p));if(a<ca&&!(clouds&&clouds.density(o.p)>.45)){ca=a;cand=o;}}
  if(pl.s.agm)for(const t of G.sites){if(t.dead||t.team===pl.team||t.carrier)continue;const d=t.p.distanceTo(pl.p);if(d>5500||d<250)continue;const a=f.angleTo(_t.subVectors(t.p,pl.p));if(a<ca){ca=a;cand=t;}}}
 if(cand&&cand===lockTgt)lockT=Math.min(1,lockT+dt/1.05);else{lockTgt=cand;lockT=cand?.0:0;}
 // gun target + lead pipper
 let gt=null,ga=.45;for(const o of G.planes){if(!hostile(pl,o)||o.doomed)continue;const d=o.p.distanceTo(pl.p);if(d>1600)continue;const a=f.angleTo(_t.subVectors(o.p,pl.p));if(a<ga){ga=a;gt=o;}}if(!gt&&lockTgt&&!lockTgt.kind)gt=lockTgt;hudTarget=gt;
 let lead=null,leadIn=false;if(gt&&pl.s.gun){lead=leadPoint(pl,gt,pl.s.gun.spd,new V());const ld=_t.subVectors(lead,pl.p).normalize();leadIn=f.angleTo(ld)<Math.atan2(gt.s.rad*.7,gt.p.distanceTo(pl.p))+.008;}
 // bombs: CCIP when nose low
 ccipT-=dt;if(pl.bombs>0&&alive&&pl.p.y<3000&&(f.y<-.22||f.y<-.06&&pl.p.y-Math.max(0,W.hAt(pl.p.x,pl.p.z))<1300)){if(ccipT<=0){ccipT=.08;const r=bombImpact(pl.p,pl.v);ccip=r?r.p:null;}}else ccip=null;
 const incoming=ord.missiles.filter(m=>m.target===pl&&m.seek);const nearM=incoming.reduce((a,m)=>Math.min(a,m.p.distanceTo(pl.p)),1e9);
 // terrain warning
 let pullUp=false;if(alive&&!pl.landed&&pl.v.y<-5){const t=Math.min(4,(pl.p.y)/Math.max(1,-pl.v.y));const q=_t2.copy(pl.p).addScaledVector(pl.v,Math.min(3.5,t));if(q.y<Math.max(0,W.hAt(q.x,q.z))+20)pullUp=true;}
 // landing guide
 let landing=null;if(alive&&carrier.target&&pl.p.distanceTo(carrier.p)<4000&&pl.p.y<600){const ok=pl.gear&&pl.sp<(pl.s.kind==='prop'?95:118);landing={p:deckWorld(new V(-4,W.DECK_Y+2,40)),ok,msg:pl.landed?(pl.landed.done?'W = LAUNCH':'BRAKING'):!pl.gear?'SLOW BELOW '+((pl.s.kind==='prop'?120:150)*3.6|0)+' KM/H':ok?'GEAR DOWN · GOOD SPEED':'TOO FAST'};}
 const aimPt=_t2.copy(pl.p).addScaledVector(aimDir(),1500).clone();
 hud.draw({cam,pl,dt,time:G.time,planes:G.planes,sites:G.sites.filter(s=>!s.carrier||G.mission&&!G.ffa),hostile,target:gt,lead,leadIn,seeker:alive&&pl.msl>0?{center:pl.p.clone().addScaledVector(f,1000),r:Math.tan(SEEK)/Math.tan(cam.fov*Math.PI/360)*innerHeight/2}:null,lockTgt,lockT,
  ccip,incoming,landing,gunPt:pl.p.clone().addScaledVector(f,700),aimPt:camMode==='chase'||!padMode?aimPt:null,missiles:ord.missiles,carrier:carrier.target&&!G.ffa?carrier:null,pullUp,radarRange:6000});
 // warnings
 let warn='',wl=0;if(alive){if(incoming.length){warn='MISSILE';wl=nearM<1500?2:1;}else if(pullUp){warn='PULL UP';wl=1;}else if(pl.stall>.35){warn='STALL';wl=1;}else if(pl.over){warn='OVERSPEED';}else if(bounds>0){warn='RETURN TO COMBAT AREA '+Math.ceil(10-bounds);wl=1;}else if(pl.fire>0){warn='FIRE';}else if(pl.overheat){warn='GUNS OVERHEATED';}}
 else if(playerDead||pl.doomed){warn=pl.ejected?'EJECTED':'AIRFRAME LOST';if(!G.result)warn+=G.ffa||G.lives>1?' · RESPAWN '+Math.max(0,Math.ceil(4-(playerDead?playerDead.t:0))):' · NO AIRFRAMES LEFT';}
 setTxt('warn',warn);$('warn').className=wl===2?'hot':wl?'on':warn?'soft':'';
 snd.engine({on:alive||pl.landed,kind:pl.s.kind==='prop'?'prop':'jet',speed:pl.sp,thr:pl.thr,boost:pl.ab,g:pl.g,shake:shake,lock:alive&&lockTgt?(lockT>=1?2:1):0,warn:wl});
 // weapons + status panel
 const s=pl.s;setTxt('w-gun',s.gun?pl.ammo:'—');$('w-heat').style.width=(pl.heat*100).toFixed(0)+'%';$('w-heat').className=pl.overheat?'hot':'';setTxt('w-msl',pl.msl+(s.agm?' · AGM':''));setTxt('w-flr',pl.flares);setTxt('w-bmb',pl.bombs);
 $('w-msl-row').className=lockT>=1?'lock':lockTgt?'seek':'';setTxt('w-plane',s.name);
 for(const k of['body','engine','wingL','wingR','tail']){const pr=pl.parts[k],mx=pl.s.hp*({body:.9,engine:.55,wingL:.5,wingR:.5,tail:.45}[k])*(pl.hpMul||1);const r=pl.lost[k]?-1:cl(pr.hp/mx,0,1);const el=$('d-'+k);const c=r<0?'#000':r>.66?'rgba(255,255,255,.75)':r>.33?'#ffd166':'#ff3b30';if(el.dataset.c!==c){el.dataset.c=c;el.setAttribute('fill',c);}}
 setTxt('hp',Math.max(0,Math.round(pl.hp/pl.maxHp*100))+'%');
 setTxt('clock',fmt(G.clock));$('clock').className=G.clock<=30?'low':'';setTxt('score',G.score);setTxt('kills',G.ffa?`${pl.kills} K · ${pl.deaths} D`:`${G.stats.kills} AIR · ${G.stats.ground} GND`);
 setTxt('lives',G.ffa?'':'✈'.repeat(Math.max(0,G.lives))+(G.lives?'':'—'));$('gear').hidden=!pl.gear;
 // fullscreen overlays: G-vignette / redout, damage flash, cloud
 const bo=pl.blackout,red=pl.gs<-2.5;ov('gfx',cl(bo*1.1+(alive&&pl.gs>7?(pl.gs-7)*.08:0),0,1));$('gfx').className=red?'red':'';dmgFlash=Math.max(0,dmgFlash-dt*1.8);ov('dmg',dmgFlash);
 ov('cloudfx',clouds?Math.min(.85,clouds.density(cam.position)*1.6):0);
 if(G.ffa&&keys.Tab){$('board').hidden=false;$('board').innerHTML='<tr><th>PILOT</th><th>K</th><th>D</th></tr>'+G.board().map(p=>`<tr class="${p.human?'me':''}"><td>${p.name}</td><td>${p.kills}</td><td>${p.deaths}</td></tr>`).join('');}else $('board').hidden=true;}

/* ================= rendering ================= */
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);post=null;}
 cam.aspect=w/h;cam.updateProjectionMatrix();fx.add.U.uScale.value=fx.alpha.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 if(!post){post=cinematic(R,scene,cam,{exposure,bloom:.45,bloomThreshold:.93,bloomRadius:.55,vignette:.28,saturation:1.2,grain:.018,ao:false,quality:gfx});post.setSize(w,h);}
 R.toneMappingExposure=exposure;post.render();}
addEventListener('resize',()=>{post=null;});

/* ================= menu UI ================= */
const unlocked=id=>{const u=AC[id].unlock;return!u||(prog.stars[MISSIONS[u-1].id]||0)>0;};
const mUnlocked=i=>i===0||(prog.stars[MISSIONS[i-1].id]||0)>0;
function renderMenu(){if(!unlocked(opts.plane))opts.plane='wren';if(!mUnlocked(opts.mi))opts.mi=0;
 $('o-mode').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===opts.mode));$('campaign').hidden=opts.mode!=='campaign';$('dogfight').hidden=opts.mode!=='ffa';
 $('missions').innerHTML=MISSIONS.map((m,i)=>{const st=prog.stars[m.id]||0,ok=mUnlocked(i);return`<button data-i="${i}" class="${i===opts.mi?'on':''} ${ok?'':'locked'}"><small>${String(i+1).padStart(2,'0')} · ${m.tag}</small><b>${m.name}</b><span>${ok?[0,1,2].map(k=>`<i class="${k<st?'on':''}">★</i>`).join(''):'LOCKED'}</span></button>`;}).join('');
 $('missions').querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(!mUnlocked(i)){snd.init();return;}opts.mi=i;const rec=MISSIONS[i].plane;if(unlocked(rec))opts.plane=rec;saveOpts();renderMenu();});
 const M=MISSIONS[opts.mi];$('m-brief').innerHTML=opts.mode==='campaign'?`<b>${M.name}</b> — ${M.brief} <em>Recommended: ${AC[M.plane].name}</em>`:DOGFIGHT.brief;
 $('planes').innerHTML=PLAYABLE.map(id=>{const a=AC[id],ok=unlocked(id);return`<button data-id="${id}" class="${id===opts.plane?'on':''} ${ok?'':'locked'}"><small>${a.role}</small><b>${a.name}</b>${Object.entries(a.stats).map(([k,v])=>`<div class="bar"><span>${k}</span><i style="--v:${v}"></i></div>`).join('')}<p>${ok?a.blurb:'CLEAR MISSION '+a.unlock+' TO UNLOCK'}</p></button>`;}).join('');
 $('planes').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!unlocked(b.dataset.id))return;opts.plane=b.dataset.id;saveOpts();renderMenu();});
 const seg=(id,key,num=true)=>$(id).querySelectorAll('button').forEach(b=>{const v=num?+b.dataset.v:b.dataset.v;b.classList.toggle('on',opts[key]===v);b.onclick=()=>{opts[key]=v;saveOpts();renderMenu();};});
 seg('o-clock','clock');seg('o-diff','diff');seg('o-cpus','cpus');seg('o-mode','mode',false);seg('o-sens','sens');
 $('go').textContent=opts.mode==='campaign'?'FLY MISSION '+(opts.mi+1):'START DOGFIGHT';}
$('go').onclick=()=>{snd.init();snd.play('ui');brief();};$('launch').onclick=()=>launch();$('b-back').onclick=()=>toMenu();
$('resume').onclick=()=>pause(false);$('quit').onclick=()=>toMenu();$('again').onclick=()=>{brief();};$('o-menu').onclick=()=>toMenu();
$('o-next').onclick=()=>{opts.mi=Math.min(MISSIONS.length-1,opts.mi+1);const rec=MISSIONS[opts.mi].plane;if(unlocked(rec))opts.plane=rec;saveOpts();brief();};
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Sky Lancers\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'} · ${a.mission||''} · ${'★'.repeat(a.stars||0)}\nAir kills: ${a.kills||0}\nAircraft: ${a.plane||''} · Time limit ${fmt(a.clock||0)}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore(ID,a.pts||0,body);};

/* ================= loop ================= */
attract();renderMenu();showPanel('menu');
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;frame(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.SKYLANCERS={get state(){return G.app;},G,opts,step:frame,render,start(o={}){start(o);},brief(o={}){Object.assign(opts,o);brief();},launch,toMenu,pause,
 get player(){return G.player;},get planes(){return G.planes;},get sites(){return G.sites;},carrier,get mission(){return G.mission;},get stats(){return G.stats;},get score(){return G.score;},get result(){return G.result;},
 setClock(s){G.clock=s;},get clock(){return G.clock;},keys,edge,setMouse(l,r){mouseL=l;if(r&&!mouseR)edge.Fire2=true;mouseR=r;},aim(dx,dy){mdx+=dx;mdy+=dy;},setAim(dir){const f=dir.clone().normalize();_m.lookAt(new V(),f,UPW);rigQ.setFromRotationMatrix(_m);},
 killAll(team=1){for(const p of G.planes)if(p.alive&&(team===null||p.team===team||team===-1&&!p.human&&p.team===-1))destroy(p,G.player,true);},killSites(){for(const s of G.sites)if(!s.dead&&s.team===1)siteHit(s,9999,G.player);},
 killPlayer(){if(G.player&&G.player.alive){doom(G.player,null);destroy(G.player,null,true);}},win(){endSortie('win');},lose(){endSortie('lose');},
 unlockAll(){MISSIONS.forEach(m=>prog.stars[m.id]=Math.max(1,prog.stars[m.id]||0));renderMenu();},get prog(){return prog;},setQuality:applyQuality,toggleCam,get camMode(){return camMode;},
 scene,R,cam,fx,ord,bullets,W,AC,MISSIONS,damage,get lockT(){return lockT;},get ccip(){return ccip;},get lockTgt(){return lockTgt;},deckLocal,deckWorld,eject:()=>eject(G.player),THREE};
