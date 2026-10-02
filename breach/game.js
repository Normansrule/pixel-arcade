// BREACH POINT — tactical round-based 5v5 shooter. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {MAPS,Level,MATS,STEP} from './maps.js';
import {makeTextures} from './tex.js';
import {buildWorld} from './world.js';
import {WPN,NADE,NADE_ORDER,NADE_MAX,GEAR,HIT,ECON,newGun,armorDamage,gunValue} from './weapons.js';
import {Rig,hitActor} from './actors.js';
import {FX} from './fx.js';
import {buildViewmodel} from './viewmodel.js';
import {Sound} from './sound.js';
import {DIFF,Brain,planRound,botBuy,think,teamTick} from './ai.js';
import {HUD} from './hud.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,D2R=Math.PI/180;
const ROUND_T=115,FREEZE_T=10,END_T=5.5,FUSE=40,PLANT_T=3,GRAV=15,BUY_WINDOW=20,DT=1/60;
const NAMES=['ASH','BRAMBLE','CINDER','DRAKE','ECHO','FLINT','GRIT','HOLLOW','IVORY','JUNO','KILO','LARK','MOSS','NOMAD','ONYX','PIKE','QUILL','ROOK','SABLE','TALLY','UMBRA','VEX','WREN','ZED'];
const SIDE={atk:{n:'ATTACKERS',s:'ATK',css:'#ff8a3d'},def:{n:'DEFENDERS',s:'DEF',css:'#4fb2ff'}};

/* ================= renderer + scenes ================= */
const canvas=$('c');const Rr=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});Rr.setPixelRatio(Math.min(devicePixelRatio,1.5));
Rr.shadowMap.enabled=true;Rr.shadowMap.type=THREE.PCFSoftShadowMap;Rr.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(72,1,.05,700);cam.rotation.order='YXZ';
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xffffff,0x332a22,.9),vmKey=new THREE.DirectionalLight(0xfff2e0,1.6),vmRim=new THREE.DirectionalLight(0xbcd0ff,.9),vmFlash=new THREE.PointLight(0xffaa55,0,2.5,1.5);
vmKey.position.set(-1,2,1);vmRim.position.set(2,.6,-1.5);vmFlash.position.set(.12,-.06,-.75);vmScene.add(vmHemi,vmKey,vmRim,vmFlash);
const snd=new Sound();
let TXC={},WC={},TX=null,world=null,L=null,fx=null,VM=null;

/* ================= game state ================= */
const G={app:'menu',opt:{map:0,side:'atk',diff:1,len:1,ot:1,sens:1,vol:.8},agents:[],player:null,score:[0,0],half:0,round:0,roundInHalf:0,phase:'freeze',timer:ROUND_T,freezeT:FREEZE_T,endT:0,time:0,matchT:0,
 bomb:{state:'none',carrier:null,pos:new V(),fuse:FUSE,site:null,beepT:0,planter:null,defuser:null},events:[],nades:[],drops:[],plan:null,diff:DIFF[1],lossStreak:[0,0],ot:false,target:7,halfRounds:6,maxRounds:12,limit:40*60,
 feedLog:[],util:{},attract:true,spec:null,winner:null,history:[],mvpLast:null,roundsWon:[0,0]};
try{Object.assign(G.opt,JSON.parse(localStorage.getItem('pxd_breach_opt'))||{});}catch(e){}
G.side=a=>sideOfSquad(a.squad);
function sideOfSquad(s){const startAtk=G.startAtk;let atk=s===0?startAtk:!startAtk;if(G.half%2===1)atk=!atk;return atk?'atk':'def';}
G.squadOf=side=>sideOfSquad(0)===side?0:1;
G.spot=(e,side)=>{e.spotT[side]=G.time;};
const radioT={};G.radio=(a,txt,key)=>{if(G.attract||!G.player||G.side(a)!==G.side(G.player)||!a.alive)return;if(radioT[key]&&G.time-radioT[key]<8)return;radioT[key]=G.time;hud.radio(a.name,txt);};

/* ================= agents ================= */
const KNIFE=()=>({id:'knife',def:WPN.knife,mag:1,res:0});
class Agent{constructor(id,name,squad,human){Object.assign(this,{id,name,squad,human,pos:new V(),vel:new V(),yaw:0,pitch:0,crouchV:0,onGround:true,hp:100,armor:0,helmet:false,kit:false,money:ECON.start,alive:true,
  slots:{1:null,2:newGun('kestrel'),3:KNIFE()},nades:{frag:0,smoke:0,flash:0,inc:0},nadeSel:'frag',hasBomb:false,cur:2,prev:3,nextFire:0,sprayN:0,lastShot:-9,reloadT:0,switchT:0,recoil:{x:0,y:0},blind:0,blindMax:1,
  planting:false,plantT:0,defusing:false,defuseT:0,stepAcc:0,eyeY:1.62,dmgBy:{},rk:0,spotT:{atk:-9,def:-9},ctl:{mx:0,mz:0,walk:false,crouch:false,jump:false,fire:false,reload:false,use:false,slot:null,throwKind:null,throwTarget:null},
  stats:{k:0,d:0,a:0,dmg:0,hs:0,mvp:0,score:0},brain:null,rig:null,flinch:0,airT:0,lastHurt:-9,killer:null,variant:id%3,zoom:0});if(!human)this.brain=new Brain(this);}
 headY(){return this.pos.y+1.67-this.crouchV*.44;}get eye(){return 1.62-this.crouchV*.46;}
 gun(){return this.cur===1?this.slots[1]:this.cur===2?this.slots[2]:this.cur===3?this.slots[3]:null;}
 cls(){const g=this.gun();return g?g.def.cls:this.cur===4?'nade':this.cur===5?'bomb':'pistol';}}
function makeRig(a){if(a.rig)scene.remove(a.rig.root);a.rig=new Rig(G.side(a),a.variant);scene.add(a.rig.root);a.rig.setGun(a.cls());a.rig.root.visible=true;}

function roster(attract){for(const a of G.agents)if(a.rig)scene.remove(a.rig.root);G.agents=[];const names=NAMES.slice().sort(()=>R()-.5);let id=0;
 let user='';try{user=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 for(let s=0;s<2;s++)for(let i=0;i<5;i++){const human=!attract&&s===0&&i===0;G.agents.push(new Agent(id++,human?(user?user.toUpperCase().slice(0,10):'YOU'):names.pop(),s,human));}
 G.player=G.agents.find(a=>a.human)||null;for(const a of G.agents)makeRig(a);}

/* ================= map loading ================= */
function loadMap(i){const def=MAPS[i];const mood=def.mood;if(world)scene.remove(world.group);
 if(!TXC[mood])TXC[mood]=makeTextures(mood);TX=TXC[mood];if(!WC[def.id]){const lv=new Level(def);WC[def.id]={L:lv,W:buildWorld(lv,TX,mood,Rr)};}
 L=WC[def.id].L;world=WC[def.id].W;G.L=L;scene.add(world.group);scene.fog=world.fog;scene.environment=world.env;vmScene.environment=world.env;
 vmHemi.color.set(mood==='noon'?0xfff4e4:0xb8c4e0);vmHemi.intensity=mood==='noon'?1.1:.7;vmKey.color.set(mood==='noon'?0xfff0d8:0xffb070);vmKey.intensity=mood==='noon'?1.8:1.1;
 if(!fx){fx=new FX(scene,TX);G.fx=fx;}fx.dustCol=mood==='noon'?new THREE.Color(.72,.6,.44):new THREE.Color(.45,.46,.48);
 if(!VM){VM=buildViewmodel(TX);vmCam.add(VM.root);}
 hud.buildMini(L);fxStack=null;Rr.shadowMap.needsUpdate=true;applyShadowMode();}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);try{localStorage.setItem('pxd_breach_opt',JSON.stringify(G.opt));}catch(e){}snd.init();snd.setVol(G.opt.vol);
 G.attract=false;G.app='match';G.diff=DIFF[G.opt.diff];G.startAtk=G.opt.side==='atk';const quick=G.opt.len===0;G.target=quick?4:7;G.halfRounds=quick?3:6;G.maxRounds=quick?6:12;G.limit=(quick?20:40)*60;
 loadMap(G.opt.map);setupMatch(false);hud.show(true);['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.add('playing');lock();snd.ambience(MAPS[G.opt.map].mood,true);}
function setupMatch(attract){roster(attract);G.score=[0,0];G.half=0;G.round=0;G.roundInHalf=0;G.matchT=0;G.lossStreak=[0,0];G.ot=false;G.feedLog=[];G.history=[];G.roundsWon=[0,0];hud.clearFeed();startRound(true);}
function attractMode(){G.attract=true;G.app='menu';G.diff=DIFF[2];G.startAtk=R()<.5;G.target=99;G.halfRounds=99;G.maxRounds=999;G.limit=1e9;loadMap(G.opt.map);setupMatch(true);hud.show(false);}
function toMenu(){unlock();['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing');hud.closeBuy();hud.board(false);snd.ambience(null,false);attractMode();}

function spawnAgent(a,k){const sp=L.def.spawns[G.side(a)];const c=sp[k%sp.length];const p=L.P(c);a.pos.set(p.x+(R()-.5)*1.2,0,p.z+(R()-.5)*1.2);a.pos.y=L.ground(a.pos.x,a.pos.z,3);
 const ctr=L.P([L.W/2,L.H/2]);a.yaw=Math.atan2(-(ctr.x-a.pos.x),-(ctr.z-a.pos.z));a.pitch=0;a.vel.set(0,0,0);}
function startRound(newHalf){G.phase='freeze';const firstOfHalf=newHalf||G.roundInHalf===0;G.freezeT=G.attract?3:firstOfHalf?12:FREEZE_T;G.timer=ROUND_T;G.endT=0;G.winner=null;G.events.length=0;
 for(const n of G.nades)scene.remove(n.mesh);G.nades.length=0;for(const d of G.drops)scene.remove(d.mesh);G.drops.length=0;fx.clear();
 const bySide={atk:[],def:[]};for(const a of G.agents)bySide[G.side(a)].push(a);
 for(const s of['atk','def'])bySide[s].sort(()=>R()-.5).forEach((a,k)=>{
  if(!a.alive||newHalf||G.ot){a.slots[1]=null;a.slots[2]=newGun('kestrel');a.nades={frag:0,smoke:0,flash:0,inc:0};a.armor=0;a.helmet=false;a.kit=false;}
  if(G.side(a)!=='def')a.kit=false;if(a.slots[1]&&a.slots[1].def.side&&a.slots[1].def.side!==G.side(a)){}
  a.alive=true;a.hp=100;a.hasBomb=false;a.planting=a.defusing=false;a.plantT=a.defuseT=0;a.blind=0;a.recoil.x=a.recoil.y=0;a.sprayN=0;a.reloadT=0;a.switchT=0;a.crouchV=0;a.zoom=0;a.dmgBy={};a.rk=0;a.roundDmg=0;a.spotT={atk:-9,def:-9};a.killer=null;a.lastHurt=-9;
  a.cur=a.slots[1]?1:2;a.prev=3;spawnAgent(a,k);a.rig.die=0;a.rig.root.rotation.x=0;a.rig.root.visible=true;a.rig.setGun(a.cls());if(a.brain)a.brain.reset();});
 if(newHalf){for(const a of G.agents){a.money=ECON.start;makeRig(a);}G.lossStreak=[0,0];}
 if(G.ot){for(const a of G.agents){a.money=10000;}}
 const atk=bySide.atk.filter(a=>a.alive);const carrier=atk[R()*atk.length|0];if(carrier){carrier.hasBomb=true;}const ob=G.bomb||{};if(ob.mesh)ob.mesh.visible=false;if(ob.light)ob.light.intensity=0;G.bomb={state:carrier?'carried':'none',carrier,pos:new V(),fuse:FUSE,site:null,beepT:0,planter:null,defuser:null,mesh:ob.mesh,led:ob.led,light:ob.light};
 for(const a of G.agents)a.rig.pack.visible=a.hasBomb;
 planRound(G);for(const a of G.agents)if(!a.human)botBuy(a,G);for(const a of G.agents){a.cur=a.slots[1]?1:2;a.rig.setGun(a.cls());}
 if(G.player){equipVM(G.player);G.spec=null;}
 hud.roundStart();if(!G.attract)snd.roundStart();}
function aliveOf(side){return G.agents.filter(a=>a.alive&&G.side(a)===side);}
function endRound(win,reason){if(G.phase==='end')return;G.phase='end';G.endT=G.attract?3:END_T;G.winner=win;const lose=win==='atk'?'def':'atk';const ws=G.squadOf(win),ls=G.squadOf(lose);G.score[ws]++;G.roundsWon[ws]++;
 const amt=reason==='bomb'?ECON.winBomb:reason==='defuse'?ECON.winDefuse:reason==='time'?ECON.winTime:ECON.winElim;const lb=ECON.loss[Math.min(4,G.lossStreak[ls])];
 for(const a of G.agents){if(G.side(a)===win)pay(a,amt,'ROUND WIN');else{pay(a,lb,'LOSS BONUS');if(win==='def'&&G.bomb.state!=='carried'&&G.bomb.state!=='dropped'&&G.bomb.state!=='none'&&G.side(a)==='atk')pay(a,ECON.plantBonus,'PLANT BONUS');}}
 G.lossStreak[ls]++;G.lossStreak[ws]=Math.max(0,G.lossStreak[ws]-1);
 // MVP
 let mvp=null;const team=G.agents.filter(a=>G.side(a)===win);if(reason==='bomb'&&G.bomb.planter&&G.side(G.bomb.planter)===win)mvp=G.bomb.planter;else if(reason==='defuse'&&G.bomb.defuser)mvp=G.bomb.defuser;else mvp=team.slice().sort((p,q)=>q.rk-p.rk||((q.roundDmg||0)-(p.roundDmg||0)))[0];
 if(mvp){mvp.stats.mvp++;mvp.stats.score+=50;}G.mvpLast=mvp;
 const why={elim:win==='atk'?'ALL DEFENDERS ELIMINATED':'ALL ATTACKERS ELIMINATED',bomb:'CHARGE DETONATED',defuse:'CHARGE DEFUSED',time:'TIME EXPIRED · SITES HELD'}[reason];
 G.history.push({win,reason,squad:ws});const meWin=G.player?G.side(G.player)===win:true;
 hud.banner(SIDE[win].n+' WIN',why+(mvp?' · MVP '+mvp.name:''),SIDE[win].css,4.5);if(!G.attract)snd.sting(meWin);G.round++;G.roundInHalf++;}
function afterRound(){// decide match end / half / ot / next round
 const t=G.target;const done=G.score[0]>=t||G.score[1]>=t||G.matchT>=G.limit;
 if(done&&!(G.ot&&G.score[0]===G.score[1])){endMatch();return;}
 if(!G.ot&&G.round>=G.maxRounds){if(G.score[0]===G.score[1]&&G.opt.ot&&!G.attract){G.ot=true;G.target=G.score[0]+1;G.half++;G.roundInHalf=0;hud.banner('OVERTIME','SUDDEN DEATH · $10,000 EACH · SIDES SWAP','#ff4d00',3.5);for(const a of G.agents)makeRig(a);startRound(false);return;}endMatch();return;}
 if(G.ot){G.half++;G.roundInHalf=0;for(const a of G.agents)makeRig(a);startRound(false);return;}
 if(G.round===G.halfRounds){G.half=1;G.roundInHalf=0;hud.banner('HALF TIME','SWITCHING SIDES','#ff4d00',3.2);startRound(true);return;}
 startRound(false);}
function pay(a,n,why){const before=a.money;a.money=Math.min(ECON.max,a.money+n);if(a===G.player&&a.money!==before)hud.cash(a.money-before,why);}

/* ================= economy: buying ================= */
G.inBuyZone=a=>{const sp=L.def.spawns[G.side(a)].map(c=>L.P(c));return sp.some(p=>Math.hypot(p.x-a.pos.x,p.z-a.pos.z)<11);};
G.canBuy=a=>a&&a.alive&&(G.phase==='freeze'||(G.phase==='live'&&ROUND_T-G.timer<BUY_WINDOW))&&G.inBuyZone(a);
G.buy=(a,id,silent)=>{const side=G.side(a);let price=0,ok=false;
 if(WPN[id]){const d=WPN[id];if(d.side&&d.side!==side)return false;price=d.price;if(id==='kestrel'&&a.slots[2]&&a.slots[2].id==='kestrel')return false;if(a.money<price)return deny(a,silent);
  if(a.slots[d.slot]&&a.slots[d.slot].id===id)return deny(a,silent);if(a.slots[d.slot])dropGun(a,d.slot,true);a.slots[d.slot]=newGun(id);a.money-=price;if(a===G.player||!silent){}switchTo(a,d.slot,true);ok=true;}
 else if(NADE[id]){const n=NADE[id];const tot=NADE_ORDER.reduce((s,k)=>s+a.nades[k],0);if(a.nades[id]>=n.max||tot>=NADE_MAX)return deny(a,silent);if(a.money<n.price)return deny(a,silent);a.money-=n.price;a.nades[id]++;ok=true;}
 else if(GEAR[id]){const g=GEAR[id];if(g.side&&g.side!==side)return deny(a,silent);
  if(id==='vest'){if(a.armor>=100)return deny(a,silent);price=650;}else if(id==='helm'){if(a.armor>=100&&a.helmet)return deny(a,silent);price=a.armor>=100?350:1000;}else if(id==='kit'){if(a.kit)return deny(a,silent);price=400;}
  if(a.money<price)return deny(a,silent);a.money-=price;if(id==='vest')a.armor=100;if(id==='helm'){a.armor=100;a.helmet=true;}if(id==='kit')a.kit=true;ok=true;}
 if(ok&&a===G.player){snd.buy(true);hud.refreshBuy();}return ok;};
function deny(a,silent){if(a===G.player&&!silent)snd.buy(false);return false;}
G.priceOf=(a,id)=>{if(WPN[id])return WPN[id].price;if(NADE[id])return NADE[id].price;if(id==='helm')return a&&a.armor>=100?350:1000;return GEAR[id].price;};

/* ================= weapons: switching, reloading, dropping ================= */
function equipTime(a){const c=a.cls();return c==='sniper'?.95:c==='rifle'?.7:c==='shotgun'||c==='smg'?.6:c==='knife'?.3:c==='nade'?.45:c==='bomb'?.5:.45;}
function switchTo(a,slot,force){if(slot===4&&!NADE_ORDER.some(k=>a.nades[k]>0))return;if(slot===5&&!a.hasBomb)return;if(slot<=3&&!a.slots[slot])return;
 if(slot===4&&a.cur===4&&!force){// cycle grenades
  const have=NADE_ORDER.filter(k=>a.nades[k]>0);const i=have.indexOf(a.nadeSel);a.nadeSel=have[(i+1)%have.length];a.switchT=.3;if(a===G.player)equipVM(a);return;}
 if(slot===a.cur&&!force)return;if(slot===4&&a.nades[a.nadeSel]<=0)a.nadeSel=NADE_ORDER.find(k=>a.nades[k]>0);
 if(a.cur!==slot)a.prev=a.cur;a.cur=slot;a.reloadT=0;a.zoom=0;a.switchT=equipTime(a);a.rig.setGun(a.cls());if(a===G.player){equipVM(a);snd.reload('draw');}}
function equipVM(a){if(!VM)return;const g=a.gun();const id=g?g.id:a.cur===4?a.nadeSel:'bomb';VM.set(id,a.cls(),G.side(a));}
function startReload(a){const g=a.gun();if(!g||!g.def.mag||g.mag>=g.def.mag||g.res<=0||a.reloadT>0||a.switchT>0)return;a.zoom=0;a.reloadT=g.def.rel;if(a===G.player){VM.reload(g.def.rel,g.def.shell);snd.reload(g.def.shell?'shell':'out');}a.rig.poseArms(1);}
function finishReload(a){const g=a.gun();if(!g)return;if(g.def.shell){g.mag++;g.res--;if(a===G.player)snd.reload('shell');if(g.mag<g.def.mag&&g.res>0){a.reloadT=g.def.rel;if(a===G.player)VM.reload(g.def.rel,true);}else if(a===G.player)snd.reload('pump');return;}
 const need=g.def.mag-g.mag,take=Math.min(need,g.res);g.mag+=take;g.res-=take;if(a===G.player)snd.reload(g.def.cls==='sniper'?'bolt':'in');}
const dropGeo={};function gunMesh(id){const d=WPN[id];const cls=id==='bomb'?'bomb':d.cls;const k=cls;if(!dropGeo[k]){const L2={rifle:.9,smg:.6,sniper:1.15,shotgun:.95,pistol:.28,bomb:.25}[k]||.6;dropGeo[k]=new THREE.BoxGeometry(L2*.1+.04,.1,L2);}
 const m=new THREE.Mesh(dropGeo[k],id==='bomb'?new THREE.MeshStandardMaterial({color:0x6a4426,roughness:.5}):DROPMAT);m.castShadow=true;return m;}const DROPMAT=new THREE.MeshStandardMaterial({color:0x1c1d20,roughness:.5,metalness:.6});
function dropGun(a,slot,quiet){const g=a.slots[slot];if(!g)return;a.slots[slot]=null;const f=fwd(a);const d={gun:g,owner:a,pos:new V(a.pos.x+f.x*.7,0,a.pos.z+f.z*.7),mesh:gunMesh(g.id),t:G.time,vel:quiet?new V():new V(f.x*3,2,f.z*3)};d.pos.y=a.pos.y+1.1;d.mesh.position.copy(d.pos);d.mesh.rotation.y=a.yaw+Math.PI/2;scene.add(d.mesh);G.drops.push(d);
 if(a.cur===slot)switchTo(a,a.slots[1]?1:a.slots[2]?2:3,true);}
function dropBomb(a,toss){if(!a.hasBomb)return;a.hasBomb=false;a.rig.pack.visible=false;a.planting=false;const f=fwd(a);const p=new V(a.pos.x+(toss?f.x*.8:0),a.pos.y+(toss?1.1:.1),a.pos.z+(toss?f.z*.8:0));const m=gunMesh('bomb');m.material.emissive=new THREE.Color(.3,0,0);m.position.copy(p);scene.add(m);
 const d={gun:{id:'bomb'},owner:a,pos:p,mesh:m,t:G.time,vel:toss?new V(f.x*3,2,f.z*3):new V(),bomb:true};G.drops.push(d);G.bomb.state='dropped';G.bomb.carrier=null;G.bomb.pos.copy(p);if(a.cur===5)switchTo(a,a.slots[1]?1:2,true);if(a===G.player||G.player&&G.side(G.player)==='atk')hud.toast('CHARGE DROPPED');}
function pickups(a){for(let i=G.drops.length-1;i>=0;i--){const d=G.drops[i];if(G.time-d.t<2&&d.owner===a)continue;if(Math.hypot(d.pos.x-a.pos.x,d.pos.z-a.pos.z)>1.1||Math.abs(d.pos.y-a.pos.y)>1.6)continue;
  if(d.bomb){if(G.side(a)!=='atk')continue;a.hasBomb=true;a.rig.pack.visible=true;G.bomb.state='carried';G.bomb.carrier=a;scene.remove(d.mesh);G.drops.splice(i,1);if(a===G.player)hud.toast('YOU PICKED UP THE CHARGE');continue;}
  const sl=d.gun.def.slot;const better=!a.human&&a.slots[sl]&&gunValue(d.gun.id)>gunValue(a.slots[sl].id)+1&&!(a.brain&&a.brain.tgt);if(a.slots[sl]&&!better)continue;if(better)dropGun(a,sl,true);
  a.slots[sl]=d.gun;scene.remove(d.mesh);G.drops.splice(i,1);if(a===G.player){snd.reload('draw');hud.toast('PICKED UP '+d.gun.def.name);}if(!a.human&&sl===1)switchTo(a,1,true);}}
function useDrop(a){// E near a weapon: swap
 let best=null,bd=1.8;for(const d of G.drops){if(d.bomb)continue;const dd=Math.hypot(d.pos.x-a.pos.x,d.pos.z-a.pos.z);if(dd<bd){bd=dd;best=d;}}if(!best)return false;const sl=best.gun.def.slot;if(a.slots[sl])dropGun(a,sl,false);a.slots[sl]=best.gun;scene.remove(best.mesh);G.drops.splice(G.drops.indexOf(best),1);switchTo(a,sl,true);snd.reload('draw');return true;}
const fwd=a=>new V(-Math.sin(a.yaw),0,-Math.cos(a.yaw));
function viewDir(a,out=new V()){const y=a.yaw+a.recoil.x*D2R,p=a.pitch+a.recoil.y*D2R;return out.set(-Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p));}

/* ================= gunplay ================= */
function inaccuracy(a,g){const d=g.def,sp=d.sp;if(!sp)return 0;const spd=Math.hypot(a.vel.x,a.vel.z),max=d.speed;const mv=cl((spd-max*.52)/(max*.48),0,1);
 let base=a.crouchV>.6?sp.cr:sp.st;if(d.scope){base=a.zoom>0?d.scopeSp:sp.st;}return base+sp.mv*mv+(a.onGround?0:sp.air)+Math.min(sp.max,sp.spr*a.sprayN);}
G.inaccuracy=a=>{const g=a.gun();return g&&g.def.sp?inaccuracy(a,g):0;};
const tv=new V(),tv2=new V(),tv3=new V(),rayOut={t:0,i:0,exit:0,nx:0,ny:0,nz:0};
function fire(a){const g=a.gun();if(!g||a.reloadT>0||a.switchT>0||G.time<a.nextFire)return false;const d=g.def;
 if(d.cls==='knife'){a.nextFire=G.time+d.rate;knife(a,false);return true;}
 if(g.mag<=0){a.nextFire=G.time+.25;if(a===G.player)snd.dry();if(g.res>0)startReload(a);return false;}
 g.mag--;a.nextFire=G.time+d.rate;if(G.time-a.lastShot>d.rate*2.2+.25)a.sprayN=0;
 const inacc=inaccuracy(a,g);const eye=tv.set(a.pos.x,a.pos.y+a.eye,a.pos.z);const dir=viewDir(a,tv2);
 // basis for spread
 const up=Math.abs(dir.y)>.95?new V(1,0,0):new V(0,1,0);const rt=new V().crossVectors(dir,up).normalize(),u2=new V().crossVectors(rt,dir).normalize();
 const n=d.pellets||1;let anyHit=false;
 for(let i=0;i<n;i++){const r=inacc*Math.sqrt(R())*(n>1?1:1),th=R()*Math.PI*2;const sx=Math.cos(th)*r,sy=Math.sin(th)*r;const dd=tv3.copy(dir).addScaledVector(rt,sx).addScaledVector(u2,sy).normalize();
  const res=trace(a,eye,dd,d,i===0);anyHit=anyHit||res;}
 // recoil kick from the pattern
 const pi=Math.min(d.pat.length-1,Math.floor(a.sprayN));const k=d.pat[pi];const crouchK=a.crouchV>.6?.82:1;a.recoil.x+=k[0]*crouchK;a.recoil.y+=k[1]*crouchK;a.sprayN+=1;a.lastShot=G.time;
 if(d.scope&&a.zoom>0&&a.human){a.rezoomTo=a.zoom;a.zoom=0;a.rezoom=G.time+d.rate*.85;}
 // fx + sound + events
 const mz=muzzlePos(a);fx.muzzle(mz,dir,d.cls==='shotgun'||d.cls==='sniper'?1.6:1);a.rig.flinch=.25;
 if(a===G.player){VM.fire(d.cls==='sniper'?2:d.cls==='shotgun'?2.2:d.cls==='pistol'?1.2:1,true);vmFlash.intensity=4;snd.shot(d.snd,0,0,true);shake=Math.max(shake,d.cls==='sniper'||d.cls==='shotgun'?.25:.06);}
 else{const[dist,pan]=spatial(mz);snd.shot(d.snd,dist,pan,false);}
 G.events.push({t:G.time,x:a.pos.x,y:a.pos.y,z:a.pos.z,kind:'shot',side:G.side(a)});a.spotT[G.side(a)==='atk'?'def':'atk']=Math.max(a.spotT[G.side(a)==='atk'?'def':'atk'],G.time-1.2);
 return true;}
function muzzlePos(a){if(a===G.player&&!a.thirdP){const f=viewDir(a,new V());return new V(a.pos.x,a.pos.y+a.eye-.12,a.pos.z).addScaledVector(f,.7).add(new V(Math.cos(a.yaw)*.12,0,-Math.sin(a.yaw)*.12));}
 a.rig.root.updateMatrixWorld(true);return a.rig.muzzle.getWorldPosition(new V());}
// hitscan with wall penetration; returns true if it hit an agent
function trace(a,o,dir,d,tracer){let power=d.pen,dmg=d.dmg,dist=0,ox=o.x,oy=o.y,oz=o.z,skip=-1,wb=false;const side=G.side(a);let endP=null;
 for(let pass=0;pass<4;pass++){const maxT=220-dist;L.ray(ox,oy,oz,dir.x,dir.y,dir.z,maxT,rayOut,skip);const tw=rayOut.t;
  let hitA=null,hp=null;for(const e of G.agents){if(!e.alive||e===a||G.side(e)===side)continue;const h=hitActor(e,ox,oy,oz,dir.x,dir.y,dir.z,Math.min(tw,maxT));if(h&&(!hp||h.t<hp.t)){hp=h;hitA=e;}}
  if(hitA){const total=dist+hp.t;const fall=Math.pow(d.rm,total/10);const p=new V(ox+dir.x*hp.t,oy+dir.y*hp.t,oz+dir.z*hp.t);fx.blood(p,dir);damage(hitA,a,dmg*fall*HIT[hp.part],hp.part,d,{wb,dir:dir.clone()});if(tracer)traceFx(a,p);return true;}
  if(rayOut.i===-1||tw>=maxT){endP=new V(ox+dir.x*maxT,oy+dir.y*maxT,oz+dir.z*maxT);break;}
  const p=new V(ox+dir.x*tw,oy+dir.y*tw,oz+dir.z*tw);const nrm=new V(rayOut.nx,rayOut.ny,rayOut.nz);const mat=rayOut.i===-2?'floor':L.boxes[rayOut.i].mat;fx.impact(p,nrm,MATS[mat].snd,1);if(!endP)endP=p;
  if(pass===0)G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'impact',side});
  if(rayOut.i<0)break;const thick=rayOut.exit-tw,cost=L.pen[rayOut.i]*thick;if(cost>power||thick>2.6)break;power-=cost;dmg*=Math.max(.25,1-cost/(d.pen*1.25));wb=true;
  const ex=new V(ox+dir.x*rayOut.exit,oy+dir.y*rayOut.exit,oz+dir.z*rayOut.exit);fx.impact(ex,dir.clone(),MATS[mat].snd,.7);dist+=rayOut.exit+.01;ox=ex.x+dir.x*.01;oy=ex.y+dir.y*.01;oz=ex.z+dir.z*.01;skip=rayOut.i;endP=null;}
 if(tracer&&endP)traceFx(a,endP);return false;}
function traceFx(a,p){const m=muzzlePos(a);if(a!==G.player||R()<.34)fx.tracers.fire(m,p);}
function knife(a,heavy){const d=WPN.knife;if(a===G.player){VM.slash();snd.knife(false);}const eye=new V(a.pos.x,a.pos.y+a.eye,a.pos.z),dir=viewDir(a,new V());const side=G.side(a);
 for(const e of G.agents){if(!e.alive||e===a||G.side(e)===side)continue;const h=hitActor(e,eye.x,eye.y,eye.z,dir.x,dir.y,dir.z,d.range);if(h){const back=fwd(e).dot(fwd(a))>.5;damage(e,a,(heavy?d.heavy:d.dmg)*(back?2.6:1),h.part==='head'?'chest':h.part,d,{dir});if(a===G.player)snd.knife(true);return;}}
 L.ray(eye.x,eye.y,eye.z,dir.x,dir.y,dir.z,d.range,rayOut);if(rayOut.t<d.range){fx.impact(new V(eye.x+dir.x*rayOut.t,eye.y+dir.y*rayOut.t,eye.z+dir.z*rayOut.t),new V(rayOut.nx,rayOut.ny,rayOut.nz),'stone',.5);if(a===G.player)snd.knife(true);}}

function damage(v,a,amount,part,d,o={}){if(!v.alive||G.phase==='end'&&G.endT<1.5&&false)return;const[hpL,arL]=armorDamage(amount,d.ap??.5,part,v.armor,v.helmet);const real=Math.min(v.hp,hpL);v.hp-=hpL;v.armor=Math.max(0,v.armor-arL);
 v.lastHurt=G.time;v.flinch=1;v.rig.flinch=1;if(v.brain&&a){v.brain.last={x:a.pos.x,z:a.pos.z,y:a.pos.y};v.brain.lastT=G.time;v.brain.lastHurtT=G.time;}
 if(a){a.stats.dmg+=real;a.roundDmg=(a.roundDmg||0)+real;v.dmgBy[a.id]=(v.dmgBy[a.id]||0)+real;}
 if(v===G.player){const src=a?a.pos:o.from;if(src){const ang=Math.atan2(src.x-v.pos.x,src.z-v.pos.z);hud.hurt(ang,v.yaw,real);}snd.hurt(Math.min(1,real/40));v.punch=(v.punch||0)+Math.min(3,real*.06);
  // aim punch (tagging): slows you
  v.vel.multiplyScalar(.55);}
 if(a===G.player&&v!==G.player){hud.hitmark(part==='head'?'hs':'body',v.hp<=0);snd.hit(part==='head'?(v.helmet?'hs':'hs'):v.armor>0&&part!=='legs'?'armor':'body');}
 if(v.hp<=0)kill(v,a,d.id||d,part==='head',!!o.wb,o.dir);}
function kill(v,a,wid,hs,wb,dir){v.alive=false;v.hp=0;v.stats.d++;v.killer=a;v.planting=v.defusing=false;v.rig.dieDir=dir?(fwd(v).dot(dir)>0?-1:1):1;
 if(a&&a!==v&&G.side(a)!==G.side(v)){a.stats.k++;a.rk++;a.stats.score+=100+(hs?20:0);if(hs)a.stats.hs++;const kr=wid&&WPN[wid]?WPN[wid].kill:wid&&NADE[wid]?NADE[wid].kill||300:300;pay(a,kr,'KILL · '+(WPN[wid]?WPN[wid].name:NADE[wid]?NADE[wid].name:''));if(a===G.player)snd.hit('kill');}
 for(const id in v.dmgBy){const as=G.agents[id];if(as&&as!==a&&v.dmgBy[id]>=40&&G.side(as)!==G.side(v)){as.stats.a++;as.stats.score+=40;}}
 // drop the best weapon + the charge
 if(v.slots[1])dropGun(v,1,false);else if(v.slots[2]&&v.slots[2].id!=='kestrel')dropGun(v,2,false);if(v.hasBomb)dropBomb(v,false);
 const ent={k:a?a.name:'',ks:a?G.side(a):null,v:v.name,vs:G.side(v),w:wid&&WPN[wid]?WPN[wid].name:wid&&NADE[wid]?NADE[wid].name:wid==='bomb'?'CHARGE':'WORLD',hs,wb,me:(a===G.player||v===G.player)};hud.feed(ent);G.feedLog.push(ent);
 // trading info for teammates of the victim
 if(a)for(const t of G.agents){if(t.alive&&t.brain&&G.side(t)===G.side(v)&&Math.hypot(t.pos.x-v.pos.x,t.pos.z-v.pos.z)<22){t.brain.last={x:a.pos.x,z:a.pos.z,y:a.pos.y};t.brain.lastT=G.time;}}
 if(v===G.player){G.spec=null;specNext(1);hud.died(a,wid,hs);VM.root.visible=false;$('scope').hidden=true;}}

/* ================= grenades ================= */
const nadeGeo={frag:new THREE.SphereGeometry(.05,10,8),smoke:new THREE.CylinderGeometry(.035,.035,.12,10),flash:new THREE.CylinderGeometry(.035,.035,.12,10),inc:new THREE.CylinderGeometry(.035,.035,.12,10)};
const nadeMat={frag:new THREE.MeshStandardMaterial({color:0x4b5530,roughness:.6}),smoke:new THREE.MeshStandardMaterial({color:0x7a7d80,metalness:.5,roughness:.4}),flash:new THREE.MeshStandardMaterial({color:0xc8cac4,metalness:.5,roughness:.4}),inc:new THREE.MeshStandardMaterial({color:0x8a2a18,roughness:.5})};
function throwNade(a,kind,target,under){if(a.nades[kind]<=0)return;a.nades[kind]--;G.util[kind]=(G.util[kind]||0)+1;const eye=new V(a.pos.x,a.pos.y+a.eye-.05,a.pos.z);let vel;
 if(target){const T=cl(Math.hypot(target.x-eye.x,target.z-eye.z)/12,.55,1.7);vel=new V((target.x-eye.x)/T,(target.y+.2-eye.y)/T+.5*12*T,(target.z-eye.z)/T);if(vel.length()>20)vel.setLength(20);}
 else{const d=viewDir(a,new V());vel=d.multiplyScalar(under?7:15.5);vel.y+=under?1.2:2.2;vel.add(a.vel.clone().multiplyScalar(.6));}
 const m=new THREE.Mesh(nadeGeo[kind],nadeMat[kind]);m.castShadow=true;m.position.copy(eye);scene.add(m);
 G.nades.push({kind,owner:a,pos:eye.clone().addScaledVector(vel.clone().normalize(),.3),vel,t:0,mesh:m,fuse:kind==='frag'?1.7:kind==='flash'?1.45:kind==='smoke'?2.2:2.4,still:0,done:false});
 a.rig.throwT=1;if(a===G.player){VM.throwIt();snd.throwIt();}G.events.push({t:G.time,x:a.pos.x,y:a.pos.y,z:a.pos.z,kind:'nade',side:G.side(a)});
 if(a.nades[kind]<=0){const nx=NADE_ORDER.find(k=>a.nades[k]>0);if(nx){a.nadeSel=nx;if(a===G.player)setTimeout(()=>{if(a.cur===4)equipVM(a);},350);}else setTimeout(()=>{if(a.cur===4)switchTo(a,a.prev&&a.prev!==4&&(a.prev<=3?a.slots[a.prev]:a.prev===5&&a.hasBomb)?a.prev:a.slots[1]?1:2,true);},380);}}
function stepNades(dt){const g=12.5;for(let i=G.nades.length-1;i>=0;i--){const n=G.nades[i];n.t+=dt;if(n.done){continue;}
  const sub=3;for(let s=0;s<sub;s++){const h=dt/sub;n.vel.y-=g*h;const sp=n.vel.length();if(sp<1e-4)continue;const dx=n.vel.x/sp,dy=n.vel.y/sp,dz=n.vel.z/sp;L.ray(n.pos.x,n.pos.y,n.pos.z,dx,dy,dz,sp*h+.06,rayOut);
   const fl=L.floorH(n.pos.x,n.pos.z);if(rayOut.t<sp*h+.06||n.pos.y+n.vel.y*h<fl+.05){let nx=rayOut.nx,ny=rayOut.ny,nz=rayOut.nz;if(!(rayOut.t<sp*h+.06)){nx=0;ny=1;nz=0;}else n.pos.addScaledVector(n.vel,Math.max(0,rayOut.t-.06)/sp);
    const vn=n.vel.x*nx+n.vel.y*ny+n.vel.z*nz;n.vel.x-=1.5*vn*nx;n.vel.y-=1.5*vn*ny;n.vel.z-=1.5*vn*nz;n.vel.multiplyScalar(ny>.7?.55:.7);if(ny>.7&&n.pos.y<fl+.06)n.pos.y=fl+.06;
    if(Math.abs(vn)>2){const[d2,p2]=spatial(n.pos);snd.bounce(d2,p2);}if(n.kind==='inc'&&ny>.7){n.t=n.fuse;}}
   else n.pos.addScaledVector(n.vel,h);}
  if(n.pos.y<L.floorH(n.pos.x,n.pos.z)+.05)n.pos.y=L.floorH(n.pos.x,n.pos.z)+.05;
  n.mesh.position.copy(n.pos);n.mesh.rotation.x+=dt*n.vel.length()*2;n.mesh.rotation.z+=dt*n.vel.length();
  if(n.vel.length()<.4)n.still+=dt;if(n.t>=n.fuse||(n.kind==='smoke'&&n.still>.6))detonate(n,i);}}
function detonate(n,i){const p=n.pos.clone(),a=n.owner;const[dd,pan]=spatial(p);scene.remove(n.mesh);G.nades.splice(i,1);
 if(n.kind==='frag'){fx.explosion(p);snd.boom(dd,pan,.8);shakeAt(p,10,.6);for(const e of G.agents){if(!e.alive)continue;const d=e.pos.distanceTo(tv.set(p.x,p.y-.5,p.z));if(d>9.5)continue;if(!L.los(p.x,p.y+.3,p.z,e.pos.x,e.pos.y+1.1,e.pos.z))continue;const friendly=G.side(e)===G.side(a)&&e!==a;const dmg=110*Math.pow(1-d/9.5,1.3)*(friendly?.3:1);if(dmg>1)damage(e,a,dmg,'chest',{id:'frag',ap:.55},{from:p});}G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'boom',side:G.side(a)});}
 else if(n.kind==='flash'){fx.sparks.burst(p,40,10,[new THREE.Color(4,4,4)],.25,.2);fx.flash(p,0xffffff,220,30);snd.bang(dd,pan);
  for(const e of G.agents){if(!e.alive)continue;const eye=tv.set(e.pos.x,e.pos.y+e.eye,e.pos.z);const d=eye.distanceTo(p);if(d>38)continue;if(!L.los(p.x,p.y+.15,p.z,eye.x,eye.y,eye.z)||fx.smokeBlocks(p.x,p.y,p.z,eye.x,eye.y,eye.z))continue;
   const to=tv2.subVectors(p,eye).normalize();const f=viewDir(e,tv3).dot(to);let k=f>.6?1:f>.2?.65:f>-.3?.3:.12;k*=Math.pow(1-d/38,.6);if(e===a)k*=.35;else if(G.side(e)===G.side(a))k*=.7;const dur=4.6*k;if(dur<.25)continue;e.blind=Math.max(e.blind,dur);e.blindMax=e.blind;
   if(e===G.player){snd.tinnitus(k);hud.flash(k);}if(e.brain&&k>.4){e.brain.tgt=null;}}}
 else if(n.kind==='smoke'){fx.smokeCloud(p,18,TX&&MAPS[G.opt.map].mood==='dusk'?new THREE.Color(.62,.64,.68):null);snd.smoke(dd,pan);for(let k=fx.fires.length-1;k>=0;k--){const f=fx.fires[k];if(Math.hypot(f.x-p.x,f.z-p.z)<5)fx.fires.splice(k,1);}}
 else if(n.kind==='inc'){const fy=L.floorH(p.x,p.z);if(p.y-fy>1.2){fx.sparks.burst(p,30,6,[new THREE.Color(3,1.4,.3)],.2,.6,{grav:8});return;}const f=fx.fire(new V(p.x,fy,p.z),7);f.owner=a;snd.ignite(dd,pan);}}

/* ================= bomb ================= */
function plantBomb(a){a.planting=false;a.hasBomb=false;a.rig.pack.visible=false;const b=G.bomb;b.state='planted';b.carrier=null;b.planter=a;b.site=L.site(a.pos.x,a.pos.z)||L.nearSite(a.pos.x,a.pos.z)||'A';b.fuse=FUSE;b.beepT=0;
 b.pos.set(a.pos.x,a.pos.y,a.pos.z);if(!b.mesh){b.mesh=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(.36,.16,.26),new THREE.MeshStandardMaterial({color:0x5a3c24,roughness:.7}));body.position.y=.08;const pad=new THREE.Mesh(new THREE.BoxGeometry(.16,.02,.1),new THREE.MeshStandardMaterial({color:0x111111}));pad.position.set(.05,.17,0);
  const led=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(6,.3,.2)}));led.position.set(-.1,.18,.06);b.led=led;b.mesh.add(body,pad,led);b.mesh.traverse(o=>{if(o.isMesh)o.castShadow=true;});b.light=new THREE.PointLight(0xff2010,0,4,2);b.light.position.y=.35;b.mesh.add(b.light);}
 b.mesh.position.copy(b.pos);b.mesh.rotation.y=a.yaw;scene.add(b.mesh);b.mesh.visible=true;
 G.phase='planted';a.stats.score+=50;pay(a,ECON.plant,'PLANT');G.events.push({t:G.time,x:b.pos.x,y:b.pos.y,z:b.pos.z,kind:'plant',side:'atk'});
 hud.banner('CHARGE PLANTED','SITE '+b.site+' · 40 SECONDS',SIDE.atk.css,2.4);snd.planted();if(a===G.player)switchTo(a,a.slots[1]?1:2,true);}
function defuseBomb(a){const b=G.bomb;b.state='defused';b.defuser=a;a.defusing=false;a.stats.score+=50;pay(a,ECON.defuse,'DEFUSE');snd.defused();if(b.light)b.light.intensity=0;endRound('def','defuse');}
function explodeBomb(){const b=G.bomb;b.state='exploded';const p=b.pos.clone().add(new V(0,.4,0));fx.explosion(p);fx.explosion(p.clone().add(new V(1,.5,0)));fx.sparks.burst(p,160,34,[new THREE.Color(3.4,2.2,.8),new THREE.Color(3,1.2,.3)],.7,.9,{drag:1.4,grav:4});
 fx.smoke.burst(p,40,9,[new THREE.Color(.25,.22,.2),new THREE.Color(.35,.3,.27)],2.4,4.5,{up:true,drag:1.2,grow:2,alpha:.8});fx.flash(p,0xffa040,400,60);const[dd,pan]=spatial(p);snd.boom(dd*.5,pan,1.6);shakeAt(p,40,1.4);b.mesh.visible=false;
 for(const e of G.agents){if(!e.alive)continue;const d=e.pos.distanceTo(b.pos);if(d<22){const dmg=520*Math.pow(1-d/22,1.6);if(dmg>1)damage(e,b.planter,dmg,'chest',{id:'bomb',ap:1},{from:b.pos});}}
 if(G.phase!=='end')endRound('atk','bomb');}

/* ================= movement ================= */
function weaponSpeed(a){const g=a.gun();return g?g.def.speed:5.3;}
function moveAgent(a,dt){const c=a.ctl;const crouch=c.crouch||a.defusing;a.crouchV+=((crouch?1:0)-a.crouchV)*Math.min(1,dt*9);
 let spd=weaponSpeed(a)*(c.walk?.52:1)*(a.crouchV>.5?.36:1)*(a.zoom>0?.55:1);if(a.planting||a.defusing||G.phase==='freeze')spd=0;if(a.flinch>0){spd*=1-a.flinch*.45;a.flinch=Math.max(0,a.flinch-dt*2.5);}
 let wx=c.mx,wz=c.mz;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}const tx=wx*spd,tz=wz*spd;
 if(a.onGround){const k=Math.min(1,dt*(wl>0.01?9:13));a.vel.x+=(tx-a.vel.x)*k;a.vel.z+=(tz-a.vel.z)*k;if(c.jump&&a.crouchV<.5&&G.phase!=='freeze'){a.vel.y=4.85;a.onGround=false;a.airT=0;}}
 else{a.vel.x+=(tx-a.vel.x)*Math.min(1,dt*1.2);a.vel.z+=(tz-a.vel.z)*Math.min(1,dt*1.2);a.airT+=dt;}
 a.vel.y-=GRAV*dt;const p=a.pos,h=1.8-a.crouchV*.5;
 // horizontal with heightfield step guard
 const ox=p.x,oz=p.z;p.x+=a.vel.x*dt;if(L.floorH(p.x,p.z)>p.y+STEP){p.x=ox;a.vel.x=0;}p.z+=a.vel.z*dt;if(L.floorH(p.x,p.z)>p.y+STEP){p.z=oz;a.vel.z=0;}
 L.collide(p,.36,h);
 p.y+=a.vel.y*dt;const g=L.ground(p.x,p.z,p.y+(a.onGround?STEP:0)-.001,.3);
 if(p.y<=g+.001){const fall=-a.vel.y;if(!a.onGround&&fall>6.5){if(a===G.player)snd.land(Math.min(1,(fall-6)/6));if(fall>11){damage(a,null,(fall-11)*12,'legs',{id:'fall',ap:1});}}p.y=g;a.vel.y=0;a.onGround=true;}
 else if(a.onGround&&p.y-g<STEP+.02&&a.vel.y<=0){p.y=g;a.vel.y=0;}else a.onGround=false;
 const ce=L.ceil(p.x,p.z,p.y);if(p.y+h>ce){p.y=Math.max(g,ce-h);a.vel.y=Math.min(0,a.vel.y);}
 if(p.y<-5){p.y=0;}
 // footsteps (running only)
 const hs=Math.hypot(a.vel.x,a.vel.z);if(a.onGround&&hs>3.2&&!c.walk&&a.crouchV<.5){a.stepAcc+=hs*dt;if(a.stepAcc>2.1){a.stepAcc=0;G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'step',side:G.side(a)});
   const surf=L.chAt(p.x,p.z)==='k'?'metal':'stone';if(a===G.player)snd.step(.55,0,surf);else{const[d,pan]=spatial(p);if(d<28)snd.step(snd.att(d,5)*1.1,pan,surf);}}}else if(hs<.5)a.stepAcc=1.4;}
function separate(){const A=G.agents;for(let i=0;i<A.length;i++){const a=A[i];if(!a.alive)continue;for(let j=i+1;j<A.length;j++){const b=A[j];if(!b.alive)continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d2=dx*dx+dz*dz;if(d2>.5||d2<1e-6||Math.abs(a.pos.y-b.pos.y)>1.5)continue;const d=Math.sqrt(d2),push=(.71-d)*.5;a.pos.x-=dx/d*push;a.pos.z-=dz/d*push;b.pos.x+=dx/d*push;b.pos.z+=dz/d*push;}}}

/* ================= per-agent update ================= */
function updateAgent(a,dt){const c=a.ctl;a.blind=Math.max(0,a.blind-dt);
 // timers
 if(a.switchT>0)a.switchT-=dt;if(a.reloadT>0){a.reloadT-=dt;if(a.reloadT<=0){a.reloadT=0;finishReload(a);}}
 const g=a.gun();if(g&&g.def.pat&&G.time-a.lastShot>g.def.rate*1.15){a.sprayN=Math.max(0,a.sprayN-dt*(g.def.cls==='rifle'?9:11));const k=Math.exp(-dt*(a.human?7:9));a.recoil.x*=k;a.recoil.y*=k;}
 if(a.rezoom&&G.time>a.rezoom){a.rezoom=0;const gg=a.gun();if(a===G.player&&gg&&gg.def.scope&&a.reloadT<=0)a.zoom=a.rezoomTo||1;}
 if(G.phase==='freeze'||G.phase==='end'&&!a.alive)return;
 // slot changes
 if(c.slot&&c.slot!==a.cur)switchTo(a,c.slot);
 if(c.reload)startReload(a);
 // throws
 if(c.throwKind&&a.switchT<=0){throwNade(a,c.throwKind,c.throwTarget,false);c.throwKind=null;}
 // fire
 if(c.fire&&G.phase!=='freeze'){if(a.cur===4){if(a.switchT<=0&&a.nades[a.nadeSel]>0&&!a.human)throwNade(a,a.nadeSel,null,false);}else if(a.cur===5){c.use=true;}else{const fired=fire(a);if(a.human&&g&&g.def.semi&&fired)mouse.semiLock=true;}}
 // plant / defuse
 const b=G.bomb;const onSite=L.site(a.pos.x,a.pos.z);
 if(c.use&&a.hasBomb&&G.phase==='live'&&onSite&&a.onGround){if(!a.planting){a.planting=true;a.plantT=0;if(a.cur!==5){a.prev=a.cur;a.cur=5;a.rig.setGun('bomb');if(a===G.player)equipVM(a);}}a.plantT+=dt;if(Math.floor(a.plantT*5)!==Math.floor((a.plantT-dt)*5)&&a===G.player)snd.keypad(Math.floor(a.plantT*5));if(a.plantT>=PLANT_T)plantBomb(a);}
 else if(a.planting){a.planting=false;a.plantT=0;}
 if(c.use&&G.side(a)==='def'&&b.state==='planted'&&a.pos.distanceTo(b.pos)<1.7&&a.onGround&&G.phase==='planted'){if(!a.defusing){a.defusing=true;a.defuseT=0;G.events.push({t:G.time,x:b.pos.x,y:b.pos.y,z:b.pos.z,kind:'defuse',side:'def'});if(a===G.player)snd.defuseTick();}a.defuseT+=dt;if(Math.floor(a.defuseT*2)!==Math.floor((a.defuseT-dt)*2)){const[d,p]=spatial(b.pos);if(d<20)snd.defuseTick();}if(a.defuseT>=(a.kit?5:10))defuseBomb(a);}
 else if(a.defusing){a.defusing=false;a.defuseT=0;}
 pickups(a);
 // fire damage
 const f=fx.inFire(a.pos.x,a.pos.z,a.pos.y);if(f){a.fireAcc=(a.fireAcc||0)+dt;if(a.fireAcc>.25){a.fireAcc=0;damage(a,f.owner&&G.side(f.owner)!==G.side(a)?f.owner:f.owner===a?a:null,10,'legs',{id:'inc',ap:1},{from:new V(f.x,f.y,f.z)});}}}

/* ================= player input ================= */
const keys={},mouse={l:false,r:false,semiLock:false,dx:0,dy:0};let locked=false;
function lock(){if(G.app!=='match')return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='match'&&!hud.buyOpen)pause(true);});
canvas.addEventListener('mousedown',e=>{if(G.app==='match'&&!locked&&!hud.buyOpen){lock();return;}});
addEventListener('mousedown',e=>{if(G.app!=='match'||!locked)return;if(e.button===0)mouse.l=true;if(e.button===2){mouse.r=true;altFire();}if(G.player&&!G.player.alive&&(e.button===0||e.button===2))specNext(e.button===0?1:-1);});
addEventListener('mouseup',e=>{if(e.button===0){mouse.l=false;mouse.semiLock=false;}if(e.button===2)mouse.r=false;});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(!locked)return;mouse.dx+=e.movementX;mouse.dy+=e.movementY;});
addEventListener('wheel',e=>{if(G.app!=='match'||!locked||!G.player||!G.player.alive)return;const P=G.player;const order=[1,2,3,4,5].filter(s=>s<=3?P.slots[s]:s===4?NADE_ORDER.some(k=>P.nades[k]>0):P.hasBomb);let i=order.indexOf(P.cur);i=(i+(e.deltaY>0?1:-1)+order.length)%order.length;switchTo(P,order[i]);},{passive:true});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];keys[e.code]=true;if(['Space','Tab','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(hud.buyOpen){hud.closeBuy();lock();return;}if(G.app==='match')pause(true);else if(G.app==='paused')pause(false);return;}
 if(G.app!=='match'||!first)return;const P=G.player;if(!P)return;
 if(e.code==='Tab')hud.board(true);
 if(e.code==='KeyB'){if(hud.buyOpen){hud.closeBuy();lock();}else if(G.canBuy(P)){hud.openBuy();unlock();}else hud.toast(P.alive?'NOT IN BUY ZONE / BUY TIME OVER':'');}
 if(!P.alive){if(e.code==='Space')specNext(1);return;}
 if(e.code.startsWith('Digit')){const n=+e.code.slice(5);if(n>=1&&n<=5)switchTo(P,n);}
 if(e.code==='KeyQ')switchTo(P,P.prev&&(P.prev<=3?P.slots[P.prev]:P.prev===4?NADE_ORDER.some(k=>P.nades[k]>0):P.hasBomb)?P.prev:P.cur===1?2:1);
 if(e.code==='KeyR')startReload(P);
 if(e.code==='KeyX'){if(P.cur===5||P.cur===4&&false)dropBomb(P,true);else if(P.cur===1||P.cur===2){dropGun(P,P.cur,false);}}
 if(e.code==='KeyF'&&VM)VM.inspect();
 if(e.code==='KeyE'){if(!(P.hasBomb&&L.site(P.pos.x,P.pos.z))&&!(G.side(P)==='def'&&G.bomb.state==='planted'&&P.pos.distanceTo(G.bomb.pos)<1.7))useDrop(P);}});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Tab')hud.board(false);});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
function altFire(){const P=G.player;if(!P||!P.alive)return;const g=P.gun();if(g&&g.def.scope&&P.switchT<=0&&P.reloadT<=0){P.zoom=(P.zoom+1)%3;snd.reload('draw');return;}if(g&&g.def.cls==='knife'&&G.time>=P.nextFire){P.nextFire=G.time+1;knife(P,true);return;}
 if(P.cur===4&&P.switchT<=0&&P.nades[P.nadeSel]>0)throwNade(P,P.nadeSel,null,true);}
function readPlayer(dt){const P=G.player,c=P.ctl;const sens=.0022*G.opt.sens*(P.zoom===1?.42:P.zoom===2?.2:1);
 if(locked&&P.alive){P.yaw-=mouse.dx*sens;P.pitch-=mouse.dy*sens;P.pitch=cl(P.pitch,-1.45,1.45);}VM&&(VM.mdx=mouse.dx,VM.mdy=mouse.dy);
 const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);c.mx=-sy*f+cy*s;c.mz=-cy*f-sy*s;
 c.walk=!!keys.ShiftLeft||!!keys.ShiftRight;c.crouch=!!keys.ControlLeft||!!keys.KeyC||!!keys.ControlRight;c.jump=!!keys.Space;c.use=!!keys.KeyE;c.reload=false;c.slot=null;
 const g=P.gun();c.fire=mouse.l&&locked&&!(g&&g.def.semi&&mouse.semiLock)&&!hud.buyOpen;if(P.cur===4)c.fire=false;
 // grenade: throw on click (overhand)
 if(P.cur===4&&mouse.l&&locked&&P.switchT<=0&&!mouse.semiLock){mouse.semiLock=true;throwNade(P,P.nadeSel,null,false);}
 // gamepad (basic)
 const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.18?v:0;const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);
  if(lx||ly){c.mx=-sy*(-ly)+cy*lx;c.mz=-cy*(-ly)-sy*lx;}P.yaw-=rx*dt*2.6*G.opt.sens;P.pitch=cl(P.pitch-ry*dt*2,-1.45,1.45);if(bt[7]&&bt[7].value>.4)c.fire=true;if(bt[0]&&bt[0].pressed)c.jump=true;if(bt[1]&&bt[1].pressed)c.crouch=true;if(bt[2]&&bt[2].pressed){c.use=true;}
  const pr=G.padPrev||{};if(bt[3]&&bt[3].pressed&&!pr.y)switchTo(P,P.cur===1?2:1);if(bt[6]&&bt[6].value>.4&&!pr.lt)altFire();if(bt[4]&&bt[4].pressed&&!pr.lb)startReload(P);if(bt[5]&&bt[5].pressed&&!pr.rb)switchTo(P,4);if(bt[9]&&bt[9].pressed&&!pr.st)pause(true);
  G.padPrev={y:bt[3]&&bt[3].pressed,lt:bt[6]&&bt[6].value>.4,lb:bt[4]&&bt[4].pressed,rb:bt[5]&&bt[5].pressed,st:bt[9]&&bt[9].pressed};}
 mouse.dx=mouse.dy=0;}
function pause(on){if(on&&G.app==='match'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlock();hud.closeBuy();}else if(!on&&G.app==='paused'){G.app='match';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= spectating ================= */
function specNext(dir){const me=G.player;const pool=G.agents.filter(a=>a.alive&&a!==me&&(!me||G.side(a)===G.side(me)));const all=pool.length?pool:G.agents.filter(a=>a.alive&&a!==me);if(!all.length){G.spec=null;return;}let i=all.indexOf(G.spec);i=(i+dir+all.length)%all.length;G.spec=all[i];}

/* ================= simulation step ================= */
let acc=0,teamT=0,shake=0,beepAcc=0;
function shakeAt(p,r,s){const c=cam.position;const d=c.distanceTo(p);if(d<r)shake=Math.max(shake,s*(1-d/r));}
function spatial(p){const c=cam.position;const dx=p.x-c.x,dy=p.y-c.y,dz=p.z-c.z;const d=Math.hypot(dx,dy,dz)||1;const rx=Math.cos(cam.rotation.y),rz=-Math.sin(cam.rotation.y);return[d,(dx*rx+dz*rz)/d];}
function step(dt){dt=Math.min(dt,.1);if(G.app==='paused'||G.app==='over'){visuals(dt);return;}
 G.time+=dt;if(G.app==='match')G.matchT+=dt;
 if(G.player&&G.app==='match')readPlayer(dt);
 // phases
 if(G.phase==='freeze'){G.freezeT-=dt;if(G.freezeT<=0){G.phase='live';hud.banner('GO','',G.player?SIDE[G.side(G.player)].css:'#fff',1);if(!G.attract)snd.beep(true);}}
 else if(G.phase==='live'){G.timer-=dt;}
 else if(G.phase==='planted'){}
 const b=G.bomb;if(b.state==='planted'){b.fuse-=dt;const rate=b.fuse>20?1:b.fuse>10?.55:b.fuse>5?.3:.15;b.beepT-=dt;if(b.beepT<=0){b.beepT=rate;const[d,p]=spatial(b.pos);snd.bombBeep(d,p,b.fuse<5?1.15:1);if(b.led)b.led.visible=true;b.blink=.08;if(b.light)b.light.intensity=3;}if(b.blink>0){b.blink-=dt;if(b.blink<=0&&b.led){b.led.visible=false;if(b.light)b.light.intensity=0;}}if(b.fuse<=0)explodeBomb();}
 if(b.state==='carried'&&b.carrier)b.pos.copy(b.carrier.pos);
 // AI
 if((teamT-=dt)<=0){teamT=.25;if(G.phase==='live'||G.phase==='planted')teamTick(G);}
 for(const a of G.agents){if(!a.alive||a.human)continue;if(G.idle){a.ctl.mx=a.ctl.mz=0;a.ctl.fire=false;a.ctl.use=false;continue;}think(G,a,dt);}
 // fixed-step physics
 acc+=dt;let n=0;while(acc>=DT&&n<5){for(const a of G.agents)if(a.alive)moveAgent(a,DT);separate();acc-=DT;n++;}if(n>=5)acc=0;
 for(const a of G.agents)if(a.alive)updateAgent(a,dt);
 stepNades(dt);stepDrops(dt);
 // round end checks
 if(G.phase==='live'||G.phase==='planted'){const atk=aliveOf('atk').length,def=aliveOf('def').length;
  if(def===0)endRound('atk','elim');else if(G.phase==='live'&&atk===0)endRound('def','elim');else if(G.phase==='live'&&G.timer<=0)endRound('def','time');}
 else if(G.phase==='end'){G.endT-=dt;if(G.endT<=0)afterRound();}
 if(G.events.length>80)G.events.splice(0,G.events.length-80);
 if(G.player&&!G.player.alive&&(!G.spec||!G.spec.alive))specNext(1);
 snd.tick(dt);visuals(dt);}
function stepDrops(dt){for(const d of G.drops){if(d.vel.lengthSq()>0||d.pos.y>L.floorH(d.pos.x,d.pos.z)+.06){d.vel.y-=GRAV*dt;const np=d.pos.clone().addScaledVector(d.vel,dt);const g=L.ground(np.x,np.z,d.pos.y+.3,.05);if(L.inside(np.x,np.y,np.z)>=0){d.vel.x*=-.3;d.vel.z*=-.3;np.x=d.pos.x;np.z=d.pos.z;}if(np.y<g+.05){np.y=g+.05;d.vel.set(0,0,0);}d.pos.copy(np);d.mesh.position.copy(d.pos);}if(d.bomb)G.bomb.pos.copy(d.pos);}}

/* ================= visuals: rigs, camera, viewmodel ================= */
let menuA=0,specCam=new V(),specInit=false;
function visuals(dt){for(const a of G.agents){const r=a.rig;r.root.position.copy(a.pos);r.root.rotation.y=a.yaw+Math.PI;const hide=a===G.player&&a.alive&&G.app!=='menu';r.root.visible=!hide;
  if(r.root.visible)r.update(dt,{speed:Math.hypot(a.vel.x,a.vel.z),crouch:a.crouchV,pitch:a.pitch+a.recoil.y*D2R,dead:!a.alive,reload:a.reloadT>0?G.time:0,kneel:a.planting||a.defusing?1:0});}
 fx.update(dt,scene.fog);world.update(dt,cam,(x,y,z)=>fx.sparks.emit(x,y,z,(R()-.5)*.6,1.2+R(),(R()-.5)*.6,.6,.65,.75,.04,.18,9,1));
 if(G.bomb.mesh&&G.bomb.state!=='planted'&&G.bomb.state!=='defused')G.bomb.mesh.visible=false;
 for(const d of G.drops)if(d.bomb&&d.mesh.material.emissive)d.mesh.material.emissive.setRGB((G.time%1)<.5?.4:0,0,0);
 cameras(dt);hud.update(dt);}
function keepCam(p){const c=cam.position;const d=new V().subVectors(c,new V(p.x,p.y+1.6,p.z));const l=d.length();d.normalize();L.ray(p.x,p.y+1.6,p.z,d.x,d.y,d.z,l+.2,rayOut);if(rayOut.t<l+.2)c.set(p.x,p.y+1.6,p.z).addScaledVector(d,Math.max(.5,rayOut.t-.3));}
function cameras(dt){shake=Math.max(0,shake-dt*1.8);const P=G.player;vmFlash.intensity*=Math.exp(-dt*30);
 if(G.app==='over'){// slow orbit around the match MVP
  menuA+=dt*.18;const m=G.mvpMatch||G.agents[0];const p=m.pos;const r=4.2;cam.position.set(p.x+Math.cos(menuA)*r,p.y+2.1,p.z+Math.sin(menuA)*r);keepCam(p);cam.lookAt(p.x,p.y+1.1,p.z);cam.fov=50;cam.updateProjectionMatrix();if(VM)VM.root.visible=false;return;}
 if(G.app==='menu'||G.attract){// cinematic chase of a live CPU operator
  menuA+=dt;if(!G.menuTgt||!G.menuTgt.alive||menuA>9){const al=G.agents.filter(a=>a.alive);if(al.length){G.menuTgt=al[(Math.random()*al.length)|0];menuA=0;specInit=false;}}
  const s=G.menuTgt;if(VM)VM.root.visible=false;if(!s)return;const f=fwd(s);const side=new V(Math.cos(s.yaw),0,-Math.sin(s.yaw));const head=new V(s.pos.x,s.pos.y+1.7,s.pos.z);
  const want=head.clone().addScaledVector(f,-4).addScaledVector(side,-1.7).add(new V(0,.6,0));const dir=want.clone().sub(head);const dl=dir.length();dir.normalize();L.ray(head.x,head.y,head.z,dir.x,dir.y,dir.z,dl+.3,rayOut);if(rayOut.t<dl+.3)want.copy(head).addScaledVector(dir,Math.max(.4,rayOut.t-.35));
  if(!specInit){specCam.copy(want);specInit=true;}specCam.lerp(want,Math.min(1,dt*3));cam.position.copy(specCam);cam.lookAt(head.x+f.x*8-side.x*3.2,head.y-.5,head.z+f.z*8-side.z*3.2);cam.fov=62;cam.updateProjectionMatrix();return;}
 if(P&&P.alive){const eyeT=P.pos.y+P.eye;P.eyeY=P.eyeY===undefined||Math.abs(P.eyeY-eyeT)>1.2?eyeT:P.eyeY+(eyeT-P.eyeY)*Math.min(1,dt*18);
  cam.position.set(P.pos.x,P.eyeY,P.pos.z);P.punch=(P.punch||0)*Math.exp(-dt*8);const s=shake*shake*.25;
  cam.rotation.set(P.pitch+P.recoil.y*D2R+(R()-.5)*s+P.punch*.01,P.yaw+P.recoil.x*D2R+(R()-.5)*s,0);
  const g=P.gun();const zf=g&&g.def.scope&&P.zoom>0?g.def.scope[P.zoom-1]:72;cam.fov+=(zf-cam.fov)*Math.min(1,dt*(P.zoom?30:14));cam.updateProjectionMatrix();
  VM.root.visible=!(P.zoom>0);$('scope').hidden=!(P.zoom>0);
  VM.update({dt,mdx:VM.mdx||0,mdy:VM.mdy||0,speed:Math.hypot(P.vel.x,P.vel.z),crouch:P.crouchV>.5,onGround:P.onGround,aiming:false,t:G.time});VM.setPlant(P.planting||P.defusing?1:0);return;}
 // spectating (third person over the shoulder)
 if(VM)VM.root.visible=false;$('scope').hidden=true;const s=G.spec||G.agents.find(a=>a.alive);if(!s){return;}
 const f=viewDir(s,new V());const head=new V(s.pos.x,s.pos.y+s.eye+.25,s.pos.z);let back=2.8;L.ray(head.x,head.y,head.z,-f.x,-f.y*.3+.25,-f.z,3.2,rayOut);if(rayOut.t<back+.3)back=Math.max(.3,rayOut.t-.3);
 const want=head.clone().addScaledVector(new V(-f.x,-f.y*.3+.25,-f.z).normalize(),back);if(!specInit||specCam.distanceTo(want)>8){specCam.copy(want);specInit=true;}specCam.lerp(want,Math.min(1,dt*10));cam.position.copy(specCam);
 cam.lookAt(head.x+f.x*6,head.y+f.y*6,head.z+f.z*6);cam.fov=70;cam.updateProjectionMatrix();}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM||!VM.root.visible)return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyShadowMode(){if(!world)return;const s=world.sun;s.castShadow=true;const ms=gfx>=2?2048:gfx===1?2048:1024;if(s.shadow.mapSize.x!==ms){if(s.shadow.map){s.shadow.map.dispose();s.shadow.map=null;}s.shadow.mapSize.set(ms,ms);}
 for(const a of G.agents)a.rig&&a.rig.root.traverse(o=>{if(o.isMesh&&o!==a.rig.blob)o.castShadow=gfx>=1;});Rr.shadowMap.needsUpdate=true;}
function applyQuality(q){gfx=q;Rr.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.2:.9));fxStack=null;applyShadowMode();}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(Rr.domElement.width!==Math.floor(w*Rr.getPixelRatio())||Rr.domElement.height!==Math.floor(h*Rr.getPixelRatio()))Rr.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();const sc=h*Rr.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));fx.sparks.U.uScale.value=fx.smoke.U.uScale.value=sc;
 // shadows: static bake on low, dynamic otherwise (every other frame on medium)
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0))Rr.shadowMap.needsUpdate=true;
 const M=world.M;const key=w+'x'+h;if(!fxStack){fxStack=cinematic(Rr,scene,cam,{exposure:M.exp,bloom:M.bloom,bloomThreshold:M.thr,bloomRadius:.5,saturation:M.sat,tint:M.tint,vignette:.34,grain:.03,aoStrength:.9,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade){const P=G.player;const hp=P&&G.app!=='menu'&&P.alive?P.hp/100:1;fxStack.grade.uniforms.sat.value=M.sat*(.4+.6*Math.min(1,hp*2));}
 if(fxStack.composer)fxStack.render();else{Rr.autoClear=true;Rr.render(scene,cam);if(VM&&VM.root.visible){Rr.autoClear=false;Rr.clearDepth();Rr.render(vmScene,vmCam);Rr.autoClear=true;}}}

/* ================= match end + scoring ================= */
let lastAward=null;
function endMatch(){G.app='over';unlock();hud.closeBuy();hud.board(false);hud.show(false);document.body.classList.remove('playing');snd.ambience(null,false);
 const me=G.player;const my=0,their=1;const won=G.score[my]>G.score[their],draw=G.score[my]===G.score[their];
 $('oeye').textContent=(G.matchT>=G.limit?'TIME LIMIT · ':'')+MAPS[G.opt.map].name+' · '+(G.round)+' ROUNDS'+(G.ot?' · OVERTIME':'');$('ores').textContent=draw?'DRAW':won?'VICTORY':'DEFEAT';$('ores').style.color=draw?'#ddd':won?'#ff8a3d':'#8a93a6';
 $('ofs').innerHTML=`<span class="m">${G.score[0]}</span> — <span class="t">${G.score[1]}</span>`;
 const rows=s=>G.agents.filter(a=>a.squad===s).sort((p,q)=>q.stats.score-p.stats.score);const mvp=G.agents.slice().sort((p,q)=>q.stats.mvp-p.stats.mvp||q.stats.score-p.stats.score)[0];
 $('stats').innerHTML='<tr><th>OPERATOR</th><th>K</th><th>D</th><th>A</th><th>ADR</th><th>HS%</th><th>★</th><th>SCORE</th></tr>'+[0,1].map(s=>rows(s).map(a=>`<tr class="s${s}${a.human?' me':''}"><td>${a.name}${a===mvp?'<span class="mvp">MVP</span>':''}</td><td>${a.stats.k}</td><td>${a.stats.d}</td><td>${a.stats.a}</td><td>${Math.round(a.stats.dmg/Math.max(1,G.round))}</td><td>${a.stats.k?Math.round(a.stats.hs/a.stats.k*100):0}</td><td>${a.stats.mvp}</td><td>${a.stats.score}</td></tr>`).join('')).join('');
 G.mvpMatch=mvp;menuA=0; const tok=award(me,won);$('otok').textContent=me?`+${tok} TOKENS · BEST ${best()} PTS`:'';$('over').hidden=false;}
function award(me,won){if(!me)return 0;const s=me.stats;const pts=s.k*100+s.a*40+s.mvp*150+s.hs*20+G.roundsWon[0]*25+(won?500:0);lastAward={pts,won,score:`${G.score[0]}-${G.score[1]}`,k:s.k,d:s.d,map:MAPS[G.opt.map].name,diff:DIFF[G.opt.diff].n.toLowerCase(),side:G.opt.side};
 const tok=5+Math.min(60,pts/40|0);try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'breachpoint';if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'breachpoint')||0);}catch(e){return 0;}}

/* ================= HUD + menus ================= */
const hud=new HUD(G,{SIDE,WPN,NADE,GEAR,NADE_ORDER,MAPS,ECON,ROUND_T,BUY_WINDOW,buy:(id)=>{if(G.player&&G.canBuy(G.player))G.buy(G.player,id);},autobuy:()=>{const P=G.player;if(!P||!G.canBuy(P))return;botBuy(P,G);hud.refreshBuy();snd.buy(true);}});
G.hud=hud;
const seg=(id,key,num=true)=>{const el=$(id);const set=(v,init)=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',(num?+b.dataset.v:b.dataset.v)===v));if(key==='map'&&G.app==='menu'&&!init){attractMode();}};set(G.opt[key],true);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(num?+b.dataset.v:b.dataset.v));};
seg('o-map','map');seg('o-side','side',false);seg('o-diff','diff');seg('o-len','len');seg('o-ot','ot');seg('o-sens','sens');seg('o-vol','vol');
$('o-vol').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>snd.setVol(G.opt.vol)));
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Breach Point\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'} ${a.score||''}\nKills: ${a.k||0} · Deaths: ${a.d||0}\nMap: ${a.map||''} · Side: ${a.side||''} · CPU ${a.diff||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] breachpoint '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= loop ================= */
attractMode();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.BREACH={get state(){return G.app==='match'?G.phase:G.app;},get app(){return G.app;},get phase(){return G.phase;},G,step,render,start,toMenu,pause,
 get player(){return G.player;},get agents(){return G.agents;},get L(){return L;},get score(){return G.score;},get bomb(){return G.bomb;},fx:()=>fx,scene,cam,R:Rr,
 setClock(s){G.timer=s;},setMatchClock(s){G.matchT=G.limit-s;},skipFreeze(){G.freezeT=0;},setIdle(v=true){G.idle=v;},
 killSide(side){for(const a of G.agents)if(a.alive&&G.side(a)===side)damage(a,null,999,'chest',{id:'world',ap:1});},
 killAgent(a,by){damage(a,by||null,999,'head',by&&by.gun()?by.gun().def:{id:'world',ap:1});},
 forceWin(side){endRound(side,'elim');},finishRound(){G.endT=0;},
 plant(site='A'){const c=G.agents.find(a=>a.alive&&a.hasBomb)||aliveOf('atk')[0];if(!c)return false;const p=L.P(L.def.sites[site].plant[0]);c.pos.set(p.x,L.floorH(p.x,p.z),p.z);if(!c.hasBomb){if(G.bomb.carrier)G.bomb.carrier.hasBomb=false;c.hasBomb=true;}G.phase='live';plantBomb(c);return true;},
 setFuse(s){G.bomb.fuse=s;},defuse(){const d=aliveOf('def')[0];if(d&&G.bomb.state==='planted'){d.kit=true;d.pos.copy(G.bomb.pos);defuseBomb(d);}},
 give(id){const P=G.player;if(!P)return;if(WPN[id]){P.slots[WPN[id].slot]=newGun(id);switchTo(P,WPN[id].slot,true);}else if(NADE[id])P.nades[id]++;},
 throwNade:(a,k,t)=>throwNade(a,k,t),fire:a=>fire(a),setQuality:applyQuality,get gfx(){return gfx;},hud,VM:()=>VM,snd,equip:switchTo,
 look(yaw,pitch){if(G.player){G.player.yaw=yaw;G.player.pitch=pitch;}},teleport(x,z){const P=G.player;P.pos.set(x,L.floorH(x,z),z);}};
