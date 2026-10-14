// HALCYON HEIST — first-person co-op heist shooter: case the place, mask up, beat cameras/guards/pagers or go loud against police
// assault waves, drill the vault, bag the loot and get it to the van. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {MAPS,Level,MATS,STEP} from './level.js';
import {makeTextures} from './tex.js';
import {buildWorld} from './world.js';
import {Rig,hitActor,CREW,CHAR_AMB} from './actors.js';
import {FX} from './fx.js';
import {buildViewmodel} from './viewmodel.js';
import {Sound} from './sound.js';
import {DIFF,thinkCiv,thinkGuard,thinkCop,thinkCrew,goTo,yawTo} from './ai.js';
import {HUD,fmt,money} from './hud.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,D2R=Math.PI/180,GID='halcyonheist';
const GRAV=15,DT=1/60;
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d;};
/* ================= weapons ================= */
export const WPN={
 falco:{id:'falco',name:'FALCO AR',cls:'rifle',snd:'rifle',dmg:36,rate:.092,mag:30,res:180,rel:2.1,sp:1.3,ads:.22,kick:[.3,.6],auto:true,pen:1.2},
 kite:{id:'kite',name:'KITE SMG',cls:'smg',snd:'smg',dmg:25,rate:.068,mag:32,res:256,rel:1.7,sp:1.8,ads:.45,kick:[.3,.4],auto:true,pen:.6},
 mastiff:{id:'mastiff',name:'MASTIFF 12G',cls:'shotgun',snd:'shotgun',dmg:21,pellets:8,rate:.62,mag:6,res:54,rel:.42,shell:true,sp:3.6,ads:2.6,kick:[.6,2.4],auto:false,pen:.4},
 whisper:{id:'whisper',name:'WHISPER .45 · SUPPRESSED',cls:'pistol',snd:'silenced',dmg:46,rate:.15,mag:12,res:84,rel:1.4,sp:1.1,ads:.28,kick:[.25,1.2],auto:false,pen:.5,quiet:true}};
const NPCW={guard:{dmg:11,rate:.5,burst:2,snd:'pistol',cls:'pistol'},operator:{dmg:10,rate:.5,burst:2,snd:'pistol',cls:'pistol'},cop:{dmg:10,rate:.4,burst:3,snd:'pistol',cls:'pistol'},
 swat:{dmg:12,rate:.12,burst:4,snd:'rifle',cls:'rifle'},heavy:{dmg:8,pellets:5,rate:.95,burst:1,snd:'shotgun',cls:'shotgun'},shield:{dmg:10,rate:.42,burst:2,snd:'pistol',cls:'pistol'},crew:{dmg:30,rate:.13,burst:5,snd:'rifle',cls:'rifle'}};
const STATS={guard:{hp:60,dr:0,spd:4.2},operator:{hp:55,dr:0,spd:3.6},cop:{hp:70,dr:0,spd:4.6},swat:{hp:115,dr:.25,spd:4.4},heavy:{hp:340,dr:.45,spd:3},shield:{hp:110,dr:.2,spd:3.3},
 civ:{hp:30,dr:0,spd:4.3},staff:{hp:30,dr:0,spd:4.3},manager:{hp:30,dr:0,spd:4},crew:{hp:100,dr:0,spd:5.4},player:{hp:100,dr:0,spd:5.8}};
const LOOTV={cash:{v:42000,w:.82,label:'CASH'},gold:{v:88000,w:.62,label:'GOLD'},jewel:{v:9500,w:.92,label:'JEWELS'}};
const DMULT=[.75,1,1.45];// payout by difficulty

/* ================= renderer + scenes ================= */
const canvas=$('c');const Rr=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});Rr.setPixelRatio(Math.min(devicePixelRatio,1.5));
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(75,1,.05,600);cam.rotation.order='YXZ';
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xfff0e0,0x403630,1.5),vmKey=new THREE.DirectionalLight(0xffe8d0,2.2),vmRim=new THREE.DirectionalLight(0xbcd0ff,1.4),vmFlash=new THREE.PointLight(0xffaa55,0,2.5,1.5);
vmKey.position.set(-1,2,1);vmRim.position.set(2,.6,-1.5);vmFlash.position.set(.12,-.06,-.75);vmScene.add(vmHemi,vmKey,vmRim,vmFlash);
const snd=new Sound();
let TXC={},WC={},TX=null,world=null,L=null,fx=null,VM=null;

/* ================= state ================= */
const G={app:'menu',opt:{map:0,diff:1,gun:'falco',sens:1,vol:.8},agents:[],player:null,crew:[],time:0,loud:false,events:[],bags:[],drops:[],secured:[],loose:0,pagers:[],pagersUsed:0,pend:[],ties:4,hasCard:false,
 wave:{phase:'none',t:0,dur:1,n:0},stats:{kills:0,civKills:0,crewKills:0,downs:0,hs:0,shots:0,hits:0,pagers:0,ties:0},timeLeft:0,limit:0,drill:null,diff:DIFF[1],attract:true,camsOn:true,smallCash:[],keycard:null,ammoBag:3,docBag:4,orders:'standby'};
try{Object.assign(G.opt,JSON.parse(localStorage.getItem('pxd_heist_opt'))||{});}catch(e){}
G.WPN=WPN;

/* ================= agents ================= */
let AID=0;
class Agent{constructor(type,o={}){const S=STATS[type]||STATS.civ;Object.assign(this,{id:AID++,type,name:o.name||'',team:type==='player'||type==='crew'?'crew':['civ','staff','manager'].includes(type)?'civ':'law',pos:new V(),vel:new V(),yaw:0,pitch:0,crouchV:0,onGround:true,
  hp:S.hp,maxHp:S.hp,armor:type==='player'||type==='crew'?100:0,maxArmor:100,dr:S.dr,speed:S.spd,alive:true,down:false,custody:false,bleed:0,downs:0,masked:type!=='player'&&type!=='crew',maskId:o.maskId??-1,bag:null,
  ctl:{mx:0,mz:0,run:false,crouch:false,fire:false,aim:null,jump:false},brain:{path:null,pi:0,goal:null,repathT:0,stuckT:0,lastP:{x:0,z:0},wait:0,ri:0,tT:0,seeT:0,strafeT:0,sd:0},
  sus:new Map(),pose:'stand',nextFire:0,burst:0,rest:0,react:0,lastHurt:-9,armorT:0,flinch:0,stepAcc:0,eyeY:1.6,scale:type==='heavy'?1.12:1,crouch:false});
  this.slots=type==='player'?{1:newGun(o.gun||'falco'),2:newGun('whisper')}:null;this.cur=1;this.reloadT=0;this.switchT=0;this.recoil={x:0,y:0};this.sprayN=0;
  this.rig=new Rig(type==='player'?'crew':type==='manager'?'manager':type,o.look??(o.maskId>=0?o.maskId:this.id),{gun:o.gunCls||'none'});scene.add(this.rig.root);if(this.rig.mask)this.rig.setMask(this.masked);}
 gun(){return this.slots?this.slots[this.cur]:null;}
 setMask(on){this.masked=on;this.rig.setMask(on);if(this.type!=='player')this.rig.setGun(on?'rifle':'none');}
 get eye(){return this.down?.75:1.62-this.crouchV*.5;}
 headY(){return this.pos.y+(this.down?.75:1.67-this.crouchV*.6);}}
function newGun(id){const d=WPN[id];return{id,def:d,mag:d.mag,res:d.res};}
function addAgent(type,c,r,o={}){const a=new Agent(type,o);const p=L.P([c,r]);a.pos.set(p.x+(o.jit?(R()-.5)*o.jit:0),0,p.z+(o.jit?(R()-.5)*o.jit:0));a.yaw=o.yaw??R()*6.28;a.brain.lastP={x:a.pos.x,z:a.pos.z};G.agents.push(a);return a;}
function clearAgents(){for(const a of G.agents)scene.remove(a.rig.root);G.agents=[];G.crew=[];G.player=null;}

/* ================= map loading + reset ================= */
function loadMap(i){const def=MAPS[i];const mood=def.mood;if(world)scene.remove(world.group);
 if(!TXC[mood])TXC[mood]=makeTextures(mood);TX=TXC[mood];if(!WC[def.id]){const lv=new Level(def);WC[def.id]={L:lv,W:buildWorld(lv,TX,Rr,mood)};}
 L=WC[def.id].L;world=WC[def.id].W;G.L=L;G.def=def;if(mood==='night')CHAR_AMB.value.setRGB(.2,.21,.25);else CHAR_AMB.value.setRGB(.3,.28,.26);const vz=def.van.zone;G.vanZone={x0:L.X(vz[0]),x1:L.X(vz[2]+1),z0:L.Z(vz[1]),z1:L.Z(vz[3]+1)};scene.add(world.group);scene.fog=world.fog;scene.environment=world.env;vmScene.environment=world.env;
 if(!fx){fx=new FX(scene,TX);G.fx=fx;}fx.dustCol=new THREE.Color(.62,.58,.52);fxStack=null;}
function resetLevel(){for(const d of L.doors){d.open=false;d.ang=0;d.want=0;d.locked=d.kind==='L'||d.kind==='K';d.picked=0;L.setBox(d.box,true);d.mesh.rotation.y=0;if(d.led)d.led.material.color.setRGB(3,.2,.1);}
 for(const ge of L.glass){if(ge.broken){ge.broken=false;L.setBox(ge.box,true);const b=ge.box;const m4=new THREE.Matrix4().compose(new V((b.x0+b.x1)/2,(b.y0+b.y1)/2,(b.z0+b.z1)/2),new THREE.Quaternion(),new V(b.x1-b.x0,b.y1-b.y0,b.z1-b.z0));world.glassMesh.setMatrixAt(ge.ii,m4);if(ge.kind==='pane')L.setCell(ge.c,ge.r,true);}}
 world.glassMesh.instanceMatrix.needsUpdate=true;
 if(L.vault){L.vault.open=false;L.vault.ang=0;L.setBox(L.vault.box,true);for(const[c,r]of L.vault.cells)L.setCell(c,r,true);world.vaultG.piv.rotation.y=0;}
 if(world.safeG)world.safeG.piv.rotation.y=0;
 for(const lo of L.loot){lo.left=lo.init??(lo.init=lo.left);lo.left=lo.init;const ms=world.lootVis.get(lo);if(ms)ms.forEach(m=>{m.visible=true;if(Array.isArray(m))m.forEach(q=>q.visible=true);});}
 for(const c of world.cams){c.dead=false;c.root.visible=true;c.cone.visible=true;}
 for(const b of G.bags)scene.remove(b.mesh);G.bags=[];for(const d of G.drops)scene.remove(d.mesh);G.drops=[];for(const s of G.smallCash)scene.remove(s.mesh);G.smallCash=[];if(G.keycard)scene.remove(G.keycard.mesh);G.keycard=null;
 if(G.drill&&G.drill.mesh)scene.remove(G.drill.mesh);G.drill={state:'idle',p:0,total:1,jamT:0,speed:1};fx.clear();}

/* ================= heist flow ================= */
function populate(attract){clearAgents();const def=G.def,df=G.diff;
 if(!attract){const user=userName();const P=addAgent('player',def.start[0],def.start[1],{name:user?user.toUpperCase().slice(0,10):'VEGA',maskId:0,gun:G.opt.gun,look:0,yaw:Math.PI});P.masked=false;P.rig.setMask(false);P.yaw=Math.PI*0;G.player=P;
  P.downs=0;CREW.slice(1).forEach((c,i)=>{const s=def.crew[i];const a=addAgent('crew',s[0],s[1],{name:c.name,maskId:c.mask,look:c.mask});a.standby=true;a.order='standby';a.home={x:a.pos.x,z:a.pos.z};a.homeYaw=yawTo(0,1)+(i-1)*.6;a.yaw=a.homeYaw;a.setMask(false);a.rig.setGun('none');a.masked=false;G.crew.push(a);});}
 const ng=def.guards.length+(df.guards?0:0);def.guards.forEach((gd,i)=>{const w=gd.route[0];const a=addAgent('guard',w[0],w[1],{gunCls:'pistol'});a.route=gd.route;a.wait=gd.wait;a.brain.ri=i;a.rig.setGun('pistol');});
 if(df.guards){const gd=def.guards[0];const w=gd.route[2];const a=addAgent('guard',w[0],w[1],{gunCls:'pistol'});a.route=gd.route.slice().reverse();a.wait=gd.wait;a.rig.setGun('pistol');}
 {const o=def.operator;const a=addAgent('operator',o[0],o[1],{yaw:o[2]*D2R+Math.PI});a.type='operator';a.rig.setGun('none');G.operator=a;}
 const [nl,nt,no]=def.civs.count;const pickN=(arr,n)=>arr.slice().sort(()=>R()-.5).slice(0,n);
 pickN(def.civs.lobby,nl).forEach(s=>{const a=addAgent('civ',s[0],s[1],{jit:.6});a.zone='lobby';a.cs='idle';a.brain.wait=R()*4;});
 pickN(def.civs.tellers,nt).forEach(s=>{const a=addAgent('staff',s[0],s[1],{yaw:0});a.zone='tellers';a.cs='idle';a.brain.wait=3+R()*6;});
 pickN(def.civs.office,no).forEach(s=>{const a=addAgent('staff',s[0],s[1]);a.zone='office';a.cs='idle';a.brain.wait=R()*5;});
 {const m=def.manager;const a=addAgent('manager',m[0],m[1]);a.zone='office';a.cs='idle';}
 for(const a of G.agents)if(a.team==='civ'){a.rig.setGun('none');}}
function spawnLoose(){// keycard + small cash + reset
 const kc=G.def.keycards[R()*G.def.keycards.length|0];const p=L.P(kc);const m=new THREE.Group();const card=new THREE.Mesh(new THREE.BoxGeometry(.09,.006,.055),new THREE.MeshStandardMaterial({color:0xf2f2f2,emissive:0x3a6aff,emissiveIntensity:.6,roughness:.4}));m.add(card);
 const st=new THREE.Mesh(new THREE.BoxGeometry(.06,.007,.012),new THREE.MeshBasicMaterial({color:new THREE.Color(.4,.8,2.4)}));st.position.set(0,.002,-.012);m.add(st);m.position.set(p.x+(R()-.5)*.3,kc[2]+.01,p.z+(R()-.5)*.2);m.rotation.y=R()*6;scene.add(m);G.keycard={mesh:m,pos:m.position};
 for(const c of G.def.cash){const p2=L.P(c);const s=world.cashStack(p2.x+(R()-.5)*.3,c[2]+.005,p2.z+(R()-.5)*.2,.16,.13,.08);s.rotation.y=R()*3;scene.add(s);G.smallCash.push({mesh:s,pos:s.position,v:1000+Math.round(R()*30)*100});}}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);try{localStorage.setItem('pxd_heist_opt',JSON.stringify(G.opt));}catch(e){}snd.init();snd.setVol(G.opt.vol);
 G.attract=false;G.app='play';G.diff=DIFF[G.opt.diff];loadMap(G.opt.map);resetLevel();
 Object.assign(G,{time:0,loud:false,events:[],secured:[],loose:0,pagers:[],pagersUsed:0,pend:[],ties:G.diff.ties,hasCard:false,stats:{kills:0,civKills:0,crewKills:0,downs:0,hs:0,shots:0,hits:0,pagers:0,ties:0},camsOn:true,ammoBag:3,docBag:4,orders:'standby',alarmMsg:'',endT:0});
 G.wave={phase:'none',t:0,dur:1,n:0};G.limit=G.timeLeft=G.def.limit[G.opt.diff];populate(false);spawnLoose();equipVM(G.player);
 hud.clear();hud.show(true);['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.add('playing');lock();snd.ambience(G.def.mood,true);snd.setMusic('stealth');snd.alarm(false);
 hud.banner(G.def.short,'CASE THE PLACE · HOLD M TO MASK UP','#f2d48a',4);}
function attractMode(){G.attract=true;G.app='menu';G.diff=DIFF[1];loadMap(G.opt.map);resetLevel();G.loud=false;G.wave={phase:'none',t:0,dur:1,n:0};populate(true);spawnLoose();hud.show(false);snd.setMusic(null);snd.alarm(false);menuA=0;}
function toMenu(){unlock();['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing');snd.ambience(null,false);attractMode();}

/* ================= alarm + loud phase ================= */
G.alarm=(msg)=>{if(G.loud||G.attract)return;G.loud=true;G.loudAt=G.time;G.alarmMsg=msg||'THE ALARM IS RAISED';snd.alarm(true);snd.setMusic('loud');hud.banner('ALARM',G.alarmMsg,'#ff4a3a',4,'alarm');hud.feed('<b class="r">ALARM</b> '+G.alarmMsg);
 G.wave={phase:'response',t:0,dur:G.diff.resp,n:0};G.pend.length=0;G.pagers.length=0;
 for(const a of G.agents){if(!a.alive)continue;if(a.team==='civ'&&a.cs!=='tied'&&a.cs!=='cower'){a.cs='panic';a.brain.exit=null;a.brain.path=null;}if(a.team==='law'){a.combat=true;a.rig.setGun('pistol');}
  if(a.type==='crew'){a.standby=false;a.setMask(true);if(a.order==='standby')a.order='follow';}}
 if(G.player&&!G.player.masked)maskUp(G.player,true);};
function stepWaves(dt){const w=G.wave;if(!G.loud)return;w.t+=dt;const final=G.timeLeft<120;
 if(w.phase==='response'&&w.t>=w.dur){startAssault(0);}
 else if(w.phase==='assault'){if(w.t>=w.dur&&!final){w.phase='regroup';w.t=0;w.dur=26;hud.banner('REGROUPING','THE POLICE PULL BACK · MOVE THE LOOT','#7fd0ff',3);snd.setMusic('loud');}
  w.spawnT=(w.spawnT||0)-dt;const alive=G.agents.filter(a=>a.alive&&!a.down&&['cop','swat','heavy','shield'].includes(a.type)).length;const cap=Math.min(22,G.diff.cap+w.n*2+(final?4:0));
  if(w.spawnT<=0&&alive<cap){w.spawnT=G.diff.spawn*(final?.6:1)*(.6+R()*.8);spawnCop(pickUnit(w.n));}}
 else if(w.phase==='regroup'&&w.t>=w.dur)startAssault(w.n+1);}
function startAssault(n){const w=G.wave;w.phase='assault';w.t=0;w.n=n;w.dur=70+n*15;w.spawnT=0;snd.assault();snd.setMusic('assault');hud.banner('POLICE ASSAULT','WAVE '+(n+1)+' · '+(n===0?'HOLD THE LINE':'THEY\'RE BRINGING HEAVIES'),'#ff4a3a',3.5,'assault');}
function pickUnit(n){const hard=G.opt.diff===2;const nt=t=>G.agents.filter(a=>a.alive&&a.type===t).length;const w={cop:Math.max(.5,5-n*1.6),swat:3+n,heavy:(n>=1||hard)&&nt('heavy')<Math.min(3,1+n+(hard?1:0)-1+ (n>=1?1:0))?.8+n*.4:0,shield:n>=1&&nt('shield')<2+n?1+n*.5:0};let t=0;for(const k in w)t+=w[k];let r=R()*t;for(const k in w){r-=w[k];if(r<=0)return k;}return'swat';}
function spawnCop(type){const P=G.player;const pts=G.def.police.map(s=>L.P(s)).sort((p,q)=>Math.hypot(q.x-P.pos.x,q.z-P.pos.z)-Math.hypot(p.x-P.pos.x,p.z-P.pos.z));const pt=pts[R()<.6?0:R()*pts.length|0];
 const a=new Agent(type,{gunCls:NPCW[type].cls});a.pos.set(pt.x+(R()-.5)*2,0,pt.z+(R()-.5)*2);if(!L.nfree(a.pos.x,a.pos.z)){a.pos.x=pt.x;a.pos.z=pt.z;}a.yaw=R()*6;a.brain.lastP={x:a.pos.x,z:a.pos.z};a.combat=true;a.hp=a.maxHp=a.maxHp*G.diff.hpMul;a.rig.setGun(NPCW[type].cls);G.agents.push(a);return a;}

/* ================= masks ================= */
function maskUp(a,instant){if(a.masked)return;if(a===G.player){a.masked=true;a.maskT=instant?0:.85;if(!instant&&VM){VM.maskOn();snd.mask();}equipVM(a);hud.toast('MASK ON · YOU ARE NOW A CRIMINAL','#ffcf6a');}else a.setMask(true);}

/* ================= weapons ================= */
function equipVM(a){if(!VM||a!==G.player)return;if(!a.masked){VM.set('hands','hands');return;}const g=a.gun();VM.set(g.id,g.def.cls);}
function switchTo(a,slot){if(!a.masked||a.down&&slot!==2||!a.slots[slot]||a.cur===slot)return;a.cur=slot;a.reloadT=0;a.switchT=.45;equipVM(a);snd.reload('draw');}
function startReload(a){const g=a.gun();if(!g||g.mag>=g.def.mag||g.res<=0||a.reloadT>0||a.switchT>0)return;a.reloadT=g.def.rel;if(a===G.player){VM.reload(g.def.rel,g.def.shell);snd.reload(g.def.shell?'shell':'out');}}
function finishReload(a){const g=a.gun();if(!g)return;if(g.def.shell){g.mag++;g.res--;snd.reload('shell');if(g.mag<g.def.mag&&g.res>0){a.reloadT=g.def.rel;VM.reload(g.def.rel,true);}else snd.reload('pump');return;}const take=Math.min(g.def.mag-g.mag,g.res);g.mag+=take;g.res-=take;snd.reload('in');}
const viewDir=(a,out=new V())=>{const y=a.yaw+a.recoil.x*D2R,p=a.pitch+a.recoil.y*D2R;return out.set(-Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p));};
const fwd=a=>new V(-Math.sin(a.yaw),0,-Math.cos(a.yaw));
function spreadOf(a){const g=a.gun();if(!g)return 0;const d=g.def;const mv=Math.min(1,Math.hypot(a.vel.x,a.vel.z)/5);const ads=a.ads?d.ads:d.sp;return(ads+mv*(a.ads?.6:1.6)+(a.onGround?0:2)+Math.min(2.5,a.sprayN*.18)*(a.ads?.4:1))*(a.crouchV>.5?.75:1)*(a.down?1.6:1);}
const tv=new V(),tv2=new V(),tv3=new V(),rayOut={t:0,i:0,exit:0,nx:0,ny:0,nz:0};
function fire(a){const g=a.gun();if(!g||a.reloadT>0||a.switchT>0||G.time<a.nextFire||!a.masked)return false;const d=g.def;
 if(g.mag<=0){a.nextFire=G.time+.25;snd.dry();if(g.res>0)startReload(a);return false;}
 g.mag--;a.nextFire=G.time+d.rate*(a.down?1.4:1);if(G.time-a.lastShot>d.rate*2.5)a.sprayN=0;G.stats.shots++;
 const eye=tv.set(a.pos.x,a.pos.y+a.eye,a.pos.z);const dir=viewDir(a,tv2.clone());const up=Math.abs(dir.y)>.95?new V(1,0,0):new V(0,1,0);const rt=new V().crossVectors(dir,up).normalize(),u2=new V().crossVectors(rt,dir).normalize();
 const sp=spreadOf(a)*D2R;const n=d.pellets||1;let hitAny=false;
 for(let i=0;i<n;i++){const r=sp*Math.sqrt(R())*(n>1?1:.6),th=R()*6.28;const dd=new V().copy(dir).addScaledVector(rt,Math.cos(th)*r).addScaledVector(u2,Math.sin(th)*r).normalize();if(trace(a,eye.clone(),dd,d,i===0))hitAny=true;}
 if(hitAny)G.stats.hits++;
 const k=d.kick;a.recoil.y+=k[1]*(a.ads?.6:1)*(a.crouchV>.5?.8:1);a.recoil.x+=(R()-.5)*k[0]*2;a.sprayN++;a.lastShot=G.time;
 const mz=muzzlePos(a);fx.muzzle(mz,dir,d.quiet?.35:d.cls==='shotgun'?1.6:1);VM.fire(d.cls==='shotgun'?2.2:d.cls==='pistol'?1.2:1,!d.quiet);vmFlash.intensity=d.quiet?.8:4;snd.shot(d.snd,0,0,true);shake=Math.max(shake,d.cls==='shotgun'?.25:.05);
 noise(a.pos,d.quiet?4:42,d.quiet?'shot-q':'shot',a);return true;}
function muzzlePos(a){if(a===G.player){const f=viewDir(a,new V());return new V(a.pos.x,a.pos.y+a.eye-.12,a.pos.z).addScaledVector(f,.7).add(new V(Math.cos(a.yaw)*.1,0,-Math.sin(a.yaw)*.1));}a.rig.root.updateMatrixWorld(true);return a.rig.muzzle.getWorldPosition(new V());}
// player hitscan: breaks glass, punches through soft cover, stops at walls; shield fronts block
function trace(a,o,dir,d,tracer){let dmg=d.dmg,power=d.pen,ox=o.x,oy=o.y,oz=o.z,skip=-1,dist=0,endP=null;
 for(let pass=0;pass<6;pass++){const maxT=160-dist;L.ray(ox,oy,oz,dir.x,dir.y,dir.z,maxT,rayOut,skip);const tw=rayOut.t;
  // cameras are small targets
  let hitA=null,hp=null;for(const e of G.agents){if(!e.alive||e===a||e.team==='crew'||e.custody)continue;const h=hitActor(e,ox,oy,oz,dir.x,dir.y,dir.z,Math.min(tw,maxT));if(h&&(!hp||h.t<hp.t)){hp=h;hitA=e;}}
  for(const c of world.cams){if(c.dead)continue;const cx=c.x-ox,cy=c.y-.1-oy,cz=c.z-oz,b=cx*dir.x+cy*dir.y+cz*dir.z;if(b<0||b>Math.min(tw,maxT)||(hp&&b>hp.t))continue;const dd=cx*cx+cy*cy+cz*cz-b*b;if(dd<.06){killCam(c,a);if(tracer)traceFx(a,new V(c.x,c.y,c.z));return true;}}
  if(hitA){const p=new V(ox+dir.x*hp.t,oy+dir.y*hp.t,oz+dir.z*hp.t);
   if(hitA.type==='shield'&&hp.part!=='legs'&&hitA.alive&&!hitA.down){const f=fwd(hitA);if(f.x*dir.x+f.z*dir.z<-.35){fx.impact(p,dir.clone().negate(),'metal',1);snd.hit('shield');if(tracer)traceFx(a,p);return false;}}
   const mult=hp.part==='head'?(hitA.type==='heavy'?2:3.2):hp.part==='legs'?.75:1;fx.blood(p,dir);damage(hitA,a,dmg*mult,hp.part,{dir:dir.clone()});if(tracer)traceFx(a,p);return true;}
  if(rayOut.i===-1||tw>=maxT){endP=new V(ox+dir.x*maxT,oy+dir.y*maxT,oz+dir.z*maxT);break;}
  const p=new V(ox+dir.x*tw,oy+dir.y*tw,oz+dir.z*tw);const b=rayOut.i>=0?L.boxes[rayOut.i]:null;const mat=b?b.mat:'floor';
  if(b&&b.mat==='glass'){breakGlass(b.ent,p,a);dist+=tw+.02;ox=p.x+dir.x*.02;oy=p.y+dir.y*.02;oz=p.z+dir.z*.02;skip=rayOut.i;continue;}
  fx.impact(p,new V(rayOut.nx,rayOut.ny,rayOut.nz),MATS[mat].snd,1);if(!endP)endP=p;if(pass===0)G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'impact'});
  if(rayOut.i<0)break;const thick=rayOut.exit-tw,cost=L.pen[rayOut.i]*thick;if(cost>power||thick>1.2)break;power-=cost;dmg*=.6;const ex=new V(ox+dir.x*rayOut.exit,oy+dir.y*rayOut.exit,oz+dir.z*rayOut.exit);dist+=rayOut.exit+.01;ox=ex.x+dir.x*.01;oy=ex.y+dir.y*.01;oz=ex.z+dir.z*.01;skip=rayOut.i;endP=null;}
 if(tracer&&endP)traceFx(a,endP);return false;}
function traceFx(a,p){const m=muzzlePos(a);if(a!==G.player||R()<.4)fx.tracers.fire(m,p);}
function breakGlass(ge,p,by){if(!ge||ge.broken)return;ge.broken=true;L.setBox(ge.box,false);world.breakGlass(ge);const b=ge.box;const c=new V((b.x0+b.x1)/2,(b.y0+b.y1)/2,(b.z0+b.z1)/2);fx.glass(p||c,ge.kind==='window'?1.6:ge.kind==='case'?.7:1.1);
 const[d,pan]=spatial(c);snd.glass(d,pan,ge.kind==='case'?.7:1);if(ge.kind==='pane')L.setCell(ge.c,ge.r,false);noise(c,ge.kind==='case'?9:14,'glass',by);}
function killCam(c,by){if(c.dead)return;c.dead=true;c.root.visible=false;fx.sparks.burst(new V(c.x,c.y,c.z),20,4,[new THREE.Color(3,2,1)],.05,.4,{grav:9});const[d,pan]=spatial(new V(c.x,c.y,c.z));snd.glass(d,pan,.4);
 if(!G.loud&&G.camsOn&&G.operator&&G.operator.alive){G.operator.brain.inv={x:c.x,z:c.z};G.operator.brain.invGo=false;hud.toast('CAMERA DESTROYED · THE OPERATOR NOTICED','#ffb060');}}

/* ================= NPC fire ================= */
function npcFire(a,t){const w=a.team==='crew'?NPCW.crew:NPCW[a.type]||NPCW.cop;if(!t||!t.alive||G.time<a.nextFire)return;
 if(a.rest>0)return;if(a.react>G.time)return;if(a.burst<=0){a.burst=1+(R()*w.burst|0);a.rest=.35+R()*.9;return;}a.burst--;a.nextFire=G.time+w.rate*(.85+R()*.3);
 const mz=muzzlePos(a);const tp=new V(t.pos.x,t.pos.y+(t.down?.6:1.25-t.crouchV*.4),t.pos.z);const d=mz.distanceTo(tp);
 let p=a.team==='crew'?.5*G.diff.crewAcc:.5*G.diff.acc;p*=cl(1.3-d/26,.25,1.15);const ts=Math.hypot(t.vel.x,t.vel.z);if(ts>3)p*=.72;if(t.crouchV>.5)p*=.85;if(t.down)p*=.75;if(a.blindT>0)p*=.4;
 // crew rounds stop on a shield's front
 const n=w.pellets||1;let hit=false;for(let k=0;k<n;k++){const ok=R()<p*(n>1?.7:1);const aim=tp.clone();if(!ok){aim.x+=(R()-.5)*1.4;aim.y+=(R()-.3)*1;aim.z+=(R()-.5)*1.4;}
  if(ok){if(t.type==='shield'&&!t.down){const f=fwd(t);const dx=(t.pos.x-a.pos.x)/d,dz=(t.pos.z-a.pos.z)/d;if(f.x*dx+f.z*dz<-.35&&R()<.85){fx.impact(aim,new V(-dx,0,-dz),'metal',.6);continue;}}
   hit=true;const part=R()<.1?'head':R()<.25?'legs':'chest';let dm=w.dmg*(part==='head'&&a.team==='crew'?2.5:1);if(a.team==='law')dm*=G.diff.dmg;damage(t,a,dm,part,{dir:new V().subVectors(tp,mz).normalize(),npc:true});}
  else{// miss: impact where it lands
   const dir=new V().subVectors(aim,mz).normalize();L.ray(mz.x,mz.y,mz.z,dir.x,dir.y,dir.z,60,rayOut);if(rayOut.t<60){const ip=new V(mz.x+dir.x*rayOut.t,mz.y+dir.y*rayOut.t,mz.z+dir.z*rayOut.t);const b=rayOut.i>=0?L.boxes[rayOut.i]:null;if(b&&b.mat==='glass'){breakGlass(b.ent,ip,a);}else fx.impact(ip,new V(rayOut.nx,rayOut.ny,rayOut.nz),b?MATS[b.mat].snd:'stone',.8);if(k===0)fx.tracers.fire(mz,ip);}}}
 if(hit)fx.tracers.fire(mz,tp);fx.muzzle(mz,new V().subVectors(tp,mz).normalize(),w.cls==='shotgun'?1.4:.9);a.rig.flinch=.2;const[dd,pan]=spatial(mz);snd.shot(w.snd,dd,pan,false);noise(a.pos,40,'shot',a);}

/* ================= damage, downs, deaths ================= */
function damage(v,a,amount,part,o={}){if(!v.alive||v.custody)return;if(v.down&&!o.execute){if(v.team==='crew'){return;}}
 v.lastHurt=G.time;v.flinch=1;v.rig.flinch=1;
 if(v.team==='crew'){if(G.time<(v.graceT||0))return;let left=amount;if(v.armor>0){const ab=Math.min(v.armor,left*.85);v.armor-=ab;left-=ab;if(v.armor<=0&&v===G.player)snd.armorBreak();}v.hp-=left;v.armorT=3;
  if(v===G.player){const src=a?a.pos:null;if(src)hud.hurt(Math.atan2(src.x-v.pos.x,src.z-v.pos.z),amount);snd.hurt(Math.min(1,amount/25));v.punch=(v.punch||0)+Math.min(2,amount*.08);}
  if(v.hp<=0)goDown(v);return;}
 const real=amount*(1-(part==='head'?v.dr*.4:v.dr));v.hp-=real;if(a===G.player){hud.hitmark(part==='head'?'hs':'body',v.hp<=0);snd.hit(part==='head'?'hs':v.dr>0?'armor':'body');}
 // a wounded guard knows something is up
 if(!G.loud&&v.team==='law'&&v.hp>0&&a){v.sus.set(a,1);}
 if(v.team==='civ'&&v.hp>0&&v.cs!=='tied'){v.cs='panic';v.brain.exit=null;}
 if(v.hp<=0)kill(v,a,part==='head',o.dir);}
function goDown(v){if(v.down)return;const lim=G.diff.downs;v.hp=0;v.armor=0;v.vel.set(0,0,0);if(v.bag)dropBag(v,false);
 if(v===G.player){G.stats.downs++;if(v.downs>=lim){custody(v);return;}v.downs++;v.down=true;v.bleed=G.diff.bleed;if(v.cur!==2){v.cur=2;v.reloadT=0;equipVM(v);}hud.feed('<b class="r">YOU ARE DOWN</b> HOLD ON — YOUR CREW IS COMING');}
 else{v.down=true;v.bleed=G.diff.bleed+10;v.downs++;hud.feed(`<b class="r">${v.name}</b> IS DOWN`);}}
G.revive=(v,by)=>{if(!v.down||v.custody)return;v.down=false;v.hp=v.maxHp*(G.opt.diff===0?.6:.4);v.armor=0;v.armorT=1;v.bleed=0;v.graceT=G.time+(G.opt.diff===2?2:3);hud.feed(`<b>${by.name}</b> REVIVED <b>${v.name}</b>`);if(v===G.player)snd.secured();};
function custody(v){v.down=false;v.custody=true;v.alive=false;v.rig.root.visible=false;if(v.bag)dropBag(v,false);hud.feed(`<b class="r">${v.name}</b> WAS TAKEN INTO CUSTODY`);if(v===G.player)endHeist(false,'custody');}
function kill(v,a,hs,dir){v.alive=false;v.hp=0;v.rig.dieDir=dir?(fwd(v).dot(dir)>0?-1:1):1;v.diedAt=G.time;const byCrew=a&&a.team==='crew';
 if(v.team==='civ'){if(byCrew){G.stats.civKills++;hud.feed(`<b class="r">CIVILIAN KILLED</b> −${money(civPenalty())} CLEANER COSTS`);}}
 else if(byCrew){if(a===G.player){G.stats.kills++;if(hs)G.stats.hs++;snd.hit('kill');}else G.stats.crewKills++;
  if(R()<.35&&G.loud)dropAmmo(v.pos);}
 if(a===G.player)hud.feed(`<b>${a.name}</b> <i>${a.gun()?a.gun().def.name.split(' ')[0]:''}${hs?' ◉':''}</i> ${v.type.toUpperCase()}`,'me');
 fx.pools.add(new V(v.pos.x,.012,v.pos.z),new V(0,1,0),.8+R()*.5);
 // stealth: guards carry pagers; deaths are noisy evidence
 if(!G.loud&&(v.type==='guard'||v.type==='operator')&&byCrew){G.pagers.push({body:v,t:G.time+2.2,ring:0,answer:0,done:false});}
 if(v===G.operator&&!G.loud){G.camsOn=false;hud.toast('CAMERA OPERATOR DOWN · CAMERAS OFFLINE','#9be27a');}
 if(!G.loud)noise(v.pos,v.type==='civ'||v.type==='staff'||v.type==='manager'?7:5,'death',a);
 if(v.bag)dropBag(v,false);}
function civPenalty(){return[3000,5000,8000][G.opt.diff];}
function dropAmmo(p){const m=new THREE.Mesh(new THREE.BoxGeometry(.3,.16,.2),new THREE.MeshStandardMaterial({color:0x3a4a2a,roughness:.6}));m.position.set(p.x,.08,p.z);m.rotation.y=R()*3;const s=new THREE.Mesh(new THREE.BoxGeometry(.31,.03,.21),new THREE.MeshBasicMaterial({color:new THREE.Color(2,1.6,.4)}));s.position.y=.06;m.add(s);scene.add(m);G.drops.push({mesh:m,pos:m.position,t:G.time});}

/* ================= noise + detection ================= */
function noise(p,r,kind,by){G.events.push({t:G.time,x:p.x,z:p.z,r,kind,by});if(G.loud)return;
 for(const o of G.agents){if(!o.alive||o.down||o.team==='crew'||o===by)continue;const d=Math.hypot(o.pos.x-p.x,o.pos.z-p.z);if(d>r)continue;
  if(kind==='shot'){if(o.team==='law'){o.combat=true;pendAlarm(o,'A GUARD HEARD GUNFIRE',1.8);}else if(o.cs==='idle'||o.cs==='sit'){o.cs='panic';o.brain.exit=null;}}
  else if(o.team==='law'&&o.type!=='operator'||o.type==='operator'&&d<5){o.brain.inv={x:p.x,z:p.z,hurry:kind==='glass'||kind==='death'};o.brain.invGo=false;bump(o,by,kind==='glass'?.5:.3);}
  else if(o.team==='civ'&&(kind==='glass'||kind==='death'||kind==='shot-q')&&d<r*.8&&(o.cs==='idle'||o.cs==='sit')){o.cs='panic';o.brain.exit=null;}}}
function bump(o,t,v){if(!t)return;o.sus.set(t,Math.min(.95,(o.sus.get(t)||0)+v));}
function pendAlarm(by,msg,t){if(G.loud||G.pend.some(p=>p.by===by))return;G.pend.push({by,msg,t:G.time+t});if(by.team==='law')by.rig.setGun('pistol');}
// can a sees b (eyes to head/chest), glass is transparent
G.canSee=(a,b)=>{const ex=a.pos.x,ey=a.pos.y+a.eye,ez=a.pos.z;for(const h of[b.headY(),b.pos.y+1.1-b.crouchV*.4]){if(L.los(ex,ey,ez,b.pos.x,h,b.pos.z))return true;}return false;};
// how suspicious target t looks to an observer kind (0 = not at all)
function lookOf(t,kind){if(t.custody||!t.alive)return 0;if(t.masked)return 1;const pub=L.isPublic(t.pos.x,t.pos.z);if(t.bag)return .7;if(pub)return 0;return kind==='cam'?.45:kind==='civ'?.25:.55;}
let detT=0;
function stepDetection(dt){if(G.loud||G.attract)return;detT-=dt;if(detT>0)return;const step=.1-detT;detT=.1;const df=G.diff;
 const targets=[G.player,...G.crew].filter(t=>t&&t.alive&&!t.custody&&!t.standby);
 const bodies=G.agents.filter(a=>!a.alive&&!a.custody&&a.team!=='crew'&&G.time-a.diedAt>.3);
 for(const o of G.agents){if(!o.alive||o.down||o.team==='crew')continue;const civ=o.team==='civ';if(civ&&(o.cs==='tied'||o.cs==='cower'||o.cs==='panic'))continue;if(o.type==='operator')continue;
  const range=civ?13:20,fovC=Math.cos((civ?70:65)*D2R);const f=fwd(o);
  for(const t of targets){const w=lookOf(t,civ?'civ':'guard');let s=o.sus.get(t)||0;let seen=false;
   if(w>0){const dx=t.pos.x-o.pos.x,dz=t.pos.z-o.pos.z,d=Math.hypot(dx,dz);if(d<range&&(d<1.6||(dx*f.x+dz*f.z)/d>fovC)&&G.canSee(o,t)){seen=true;const rate=w*df.det*(1.7-d/range*1.3)*(t.crouchV>.5?.6:1)*(civ?.8:1.1);s+=rate*step;o.lastSeen={x:t.pos.x,z:t.pos.z};}}
   if(!seen)s=Math.max(0,s-.2*step);if(s>0)o.sus.set(t,Math.min(1.05,s));else o.sus.delete(t);
   if(s>=1&&!o.spotted){o.spotted=true;snd.detected();if(civ){o.cs='panic';o.brain.exit=null;o.brain.callT=0;snd.scream(...spatial(o.pos));hud.toast(o.type==='staff'?'A TELLER SPOTTED YOU':'A CIVILIAN SPOTTED YOU','#ff8a5a');}
    else{o.combat=true;pendAlarm(o,'A GUARD RAISED THE ALARM',2.2);hud.toast('GUARD ALERTED · TAKE HIM DOWN BEFORE HE RADIOS','#ff5a3a');}}
   else if(!civ&&s>.45&&o.lastSeen&&!o.combat){o.brain.inv={x:o.lastSeen.x,z:o.lastSeen.z};o.brain.invGo=o.brain.invGo&&o.brain.inv;}}
  // bodies
  for(const b of bodies){const d=Math.hypot(b.pos.x-o.pos.x,b.pos.z-o.pos.z);if(d>11)continue;const dx=b.pos.x-o.pos.x,dz=b.pos.z-o.pos.z;if(d>1.5&&(dx*f.x+dz*f.z)/d<fovC)continue;if(!L.los(o.pos.x,o.pos.y+o.eye,o.pos.z,b.pos.x,.4,b.pos.z))continue;
   o.bodyT=(o.bodyT||0)+step*(1.6-d/11);if(o.bodyT>.9){if(civ){o.cs='panic';o.brain.exit=null;snd.scream(...spatial(o.pos));}else{o.combat=true;pendAlarm(o,'A GUARD FOUND A BODY',1.5);}break;}}
  // the drill in plain view
  const dr=G.drill;if(dr.state==='run'&&!civ&&dr.pos){const d=Math.hypot(dr.pos.x-o.pos.x,dr.pos.z-o.pos.z);if(d<9&&L.los(o.pos.x,o.pos.y+o.eye,o.pos.z,dr.pos.x,dr.pos.y+.4,dr.pos.z)){o.drillT=(o.drillT||0)+step;if(o.drillT>1.2){o.combat=true;pendAlarm(o,'A GUARD FOUND THE DRILL',1.5);}}}}
 // cameras
 G.camsOn=!!(G.operator&&G.operator.alive&&G.operator.cs!=='tied');
 for(const c of world.cams){if(c.dead||!G.camsOn){c.sus=0;c.cone.visible=!c.dead&&G.camsOn;continue;}const yaw=c.yaw0+Math.sin(G.time*.45+c.ph)*c.sweep;const dir=new V(-Math.sin(yaw)*Math.cos(.42),-Math.sin(.42),-Math.cos(yaw)*Math.cos(.42));c.dir=dir;
  let best=0;for(const t of targets){const w=lookOf(t,'cam');if(w<=0)continue;const tx=t.pos.x-c.x,ty=t.pos.y+1.2-c.y,tz=t.pos.z-c.z,d=Math.hypot(tx,ty,tz);if(d>16)continue;if((tx*dir.x+ty*dir.y+tz*dir.z)/d<Math.cos(.5))continue;if(!L.los(c.x+dir.x*.4,c.y+dir.y*.4,c.z+dir.z*.4,t.pos.x,t.pos.y+1.2,t.pos.z))continue;best=Math.max(best,w*(1.6-d/16)*df.det*.85);}
  c.sus=best>0?Math.min(1.05,(c.sus||0)+best*step):Math.max(0,(c.sus||0)-.25*step);c.seeing=best>0;if(c.sus>=1){G.alarm('A CAMERA SPOTTED YOU');}}
 // pending radio calls
 for(let i=G.pend.length-1;i>=0;i--){const p=G.pend[i];if(!p.by.alive||p.by.down||p.by.cs==='tied'){G.pend.splice(i,1);continue;}if(G.time>=p.t){G.alarm(p.msg);break;}}
 // pagers
 for(const pg of G.pagers){if(pg.done)continue;if(G.time>=pg.t&&!pg.ring){pg.ring=G.time;hud.toast('PAGER! ANSWER IT (HOLD E ON THE BODY)','#ffcf3a');}if(pg.ring&&G.time-pg.ring>12&&!pg.answering){pg.done=true;G.alarm('A PAGER WENT UNANSWERED');}}}

/* ================= bags + loot ================= */
const bagGeo=(()=>{const g=new THREE.CylinderGeometry(.19,.19,.66,14);g.rotateZ(Math.PI/2);return g;})();
const BAGM={cash:new THREE.MeshStandardMaterial({color:0x2a2c30,roughness:.85}),gold:new THREE.MeshStandardMaterial({color:0x3a3220,roughness:.8}),jewel:new THREE.MeshStandardMaterial({color:0x2a1e34,roughness:.85})};
const TAGM={cash:new THREE.MeshBasicMaterial({color:new THREE.Color(.5,1.6,.5)}),gold:new THREE.MeshBasicMaterial({color:new THREE.Color(2,1.5,.3)}),jewel:new THREE.MeshBasicMaterial({color:new THREE.Color(1.4,.5,2)})};
function makeBag(kind,p){const m=new THREE.Group();const b=new THREE.Mesh(bagGeo,BAGM[kind]);b.castShadow=true;m.add(b);for(const s of[-.14,.14]){const st=new THREE.Mesh(new THREE.TorusGeometry(.12,.015,6,12,Math.PI),BAGM[kind]);st.position.set(s,.15,0);st.rotation.y=Math.PI/2;m.add(st);}
 const tag=new THREE.Mesh(new THREE.BoxGeometry(.08,.05,.01),TAGM[kind]);tag.position.set(.2,.05,.19);m.add(tag);const z=new THREE.Mesh(new THREE.BoxGeometry(.5,.01,.02),new THREE.MeshStandardMaterial({color:0x888888,metalness:1,roughness:.3}));z.position.y=.19;m.add(z);
 m.position.copy(p);scene.add(m);const bag={kind,value:LOOTV[kind].v*DMULT[G.opt.diff],w:LOOTV[kind].w,mesh:m,pos:m.position,vel:new V(),carrier:null,secured:false,rest:true};G.bags.push(bag);return bag;}
G.takeLoot=(a,lo)=>{if(!lo||lo.left<=0||a.bag)return null;lo.left--;const ms=world.lootVis.get(lo);if(ms){const k=lo.init-lo.left-1;const m=ms[Math.min(k,ms.length-1)];if(Array.isArray(m))m.forEach(q=>q.visible=false);else if(m&&lo.left<=0||ms.length>1)(ms[k]||m).visible=false;if(lo.left<=0)ms.forEach(q=>{if(Array.isArray(q))q.forEach(x=>x.visible=false);else q.visible=false;});}
 const bag=makeBag(lo.kind==='jewel'?'jewel':lo.kind,new V(a.pos.x,1,a.pos.z));G.pickBag(a,bag);if(a===G.player){snd.bag();hud.toast(LOOTV[bag.kind].label+' BAGGED · '+money(bag.value),'#9be27a');}return bag;};
G.pickBag=(a,bag)=>{if(a.bag||bag.carrier||bag.secured)return;bag.carrier=a;a.bag=bag;bag.mesh.visible=false;if(a===G.player)snd.bag();};
function dropBag(a,throwIt){const bag=a.bag;if(!bag)return;a.bag=null;bag.carrier=null;bag.mesh.visible=true;const f=a===G.player?viewDir(a,new V()):fwd(a);bag.pos.set(a.pos.x+f.x*.5,a.pos.y+(a.down?.5:1.2),a.pos.z+f.z*.5);
 bag.vel.set(throwIt?f.x*8.5:f.x*1.5,throwIt?f.y*8.5+2.6:1,throwIt?f.z*8.5:f.z*1.5);bag.rest=false;if(throwIt)snd.throwIt();}
G.secureBag=(bag,a)=>{if(bag.secured)return;if(bag.carrier){bag.carrier.bag=null;bag.carrier=null;}bag.secured=true;bag.mesh.visible=false;G.secured.push(bag);snd.secured();hud.toast(LOOTV[bag.kind].label+' SECURED · '+money(bag.value),'#9be27a');hud.feed(`<b class="g">SECURED</b> ${LOOTV[bag.kind].label} ${money(bag.value)}${a&&a!==G.player?' · '+a.name:''}`);};
G.inVan=(x,z)=>{const v=G.vanZone;return x>v.x0&&x<v.x1&&z>v.z0&&z<v.z1;};
G.lootOpen=lo=>lo.left>0&&(lo.need==='vault'?L.vault&&L.vault.open:lo.need==='safe'?G.drill.state==='done':lo.need==='case'?lo.prop.glass.broken:true);
G.findLootJob=a=>{let best=null,bd=1e9;for(const b of G.bags){if(b.carrier||b.secured||G.inVan(b.pos.x,b.pos.z))continue;const d=Math.hypot(b.pos.x-a.pos.x,b.pos.z-a.pos.z);if(d<bd){bd=d;best={x:b.pos.x,z:b.pos.z,bag:b};}}
 for(const lo of L.loot){if(lo.kind==='box'||!G.lootOpen(lo))continue;const d=Math.hypot(lo.x-a.pos.x,lo.z-a.pos.z)+4;if(d<bd){bd=d;const sp=L.nfree(lo.x,lo.z+.9)?{x:lo.x,z:lo.z+.9}:L.nfree(lo.x,lo.z-.9)?{x:lo.x,z:lo.z-.9}:L.nfree(lo.x+.9,lo.z)?{x:lo.x+.9,z:lo.z}:{x:lo.x-.9,z:lo.z};best={x:sp.x,z:sp.z,loot:lo};}}return best;};
function stepBags(dt){for(const b of G.bags){if(b.carrier||b.secured||b.rest)continue;b.vel.y-=GRAV*dt;const np=b.pos.clone().addScaledVector(b.vel,dt);
  if(L.inside3(np.x,np.y,np.z)>=0){const ix=L.inside3(np.x,b.pos.y,b.pos.z)>=0,iz=L.inside3(b.pos.x,b.pos.y,np.z)>=0;if(ix)b.vel.x*=-.3;if(iz)b.vel.z*=-.3;if(!ix&&!iz)b.vel.y=Math.max(0,b.vel.y*-.2);np.copy(b.pos);}
  const gnd=L.ground(np.x,np.z,b.pos.y,.15)+.19;if(np.y<gnd){np.y=gnd;b.vel.y=0;b.vel.x*=.7;b.vel.z*=.7;if(Math.hypot(b.vel.x,b.vel.z)<.3){b.rest=true;const[d,pan]=spatial(np);snd.thud(d,pan);}}
  b.pos.copy(np);b.mesh.rotation.y+=dt*b.vel.length()*.5;if(G.inVan(b.pos.x,b.pos.z))G.secureBag(b,null);}}

/* ================= drill ================= */
function drillSite(){if(L.vault){const v=L.vault;return{x:v.x,y:0,z:v.z+1.05,yaw:0};}const s=L.safe;const fr=world.safeG.front;return{x:s.x,y:0,z:fr>0?s.z1+.55:s.z0-.55,yaw:fr>0?0:Math.PI};}
function placeDrill(){const d=G.drill;const s=drillSite();d.state='run';d.p=0;d.total=G.def.drill.t[G.opt.diff];d.pos=new V(s.x,0,s.z);d.speed=1;d.jamT=G.time+G.diff.jam[0]+R()*(G.diff.jam[1]-G.diff.jam[0]);
 if(!d.mesh){const m=new THREE.Group();const met=new THREE.MeshStandardMaterial({color:0xd8a020,roughness:.4,metalness:.3}),blk=new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:.5,metalness:.5});
  const body=new THREE.Mesh(new THREE.BoxGeometry(.5,.42,.7),met);body.position.set(0,1.4,.1);m.add(body);const motor=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.5,14),blk);motor.rotation.x=Math.PI/2;motor.position.set(0,1.4,.6);m.add(motor);
  const bit=new THREE.Mesh(new THREE.CylinderGeometry(.04,.02,.45,8),new THREE.MeshStandardMaterial({color:0xb0b4b8,metalness:1,roughness:.2}));bit.rotation.x=Math.PI/2;bit.position.set(0,1.4,-.4);m.add(bit);d.bit=bit;
  for(const sx of[-.3,.3]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.05,1.4,.05),blk);leg.position.set(sx,.7,.3);leg.rotation.x=.2;m.add(leg);}const scr=new THREE.Mesh(new THREE.PlaneGeometry(.3,.16),new THREE.MeshBasicMaterial({color:new THREE.Color(.4,2,.6)}));scr.position.set(0,1.62,.452);m.add(scr);d.scr=scr;d.mesh=m;}
 d.mesh.position.set(s.x,0,s.z);d.mesh.rotation.y=s.yaw;scene.add(d.mesh);snd.click();hud.toast('DRILL RUNNING · '+fmt(d.total),'#ffcf6a');}
function stepDrill(dt){const d=G.drill;if(d.state==='run'){d.p+=dt*d.speed;d.bit.rotation.z+=dt*30;if(R()<dt*12)fx.sparks.burst(new V(d.pos.x+Math.sin(d.mesh.rotation.y)*-.0,1.4,d.pos.z-(Math.cos(d.mesh.rotation.y))*.62),3,3,[new THREE.Color(3,2,.8)],.04,.3,{grav:9});
  const[dd,pan]=spatial(d.pos);snd.drill(true,dd,pan);d.scr.material.color.setRGB(.4,2,.6);
  if(G.time>d.jamT&&d.p<d.total-3){d.state='jam';snd.drill(false);snd.drillJam();hud.toast('THE DRILL JAMMED · FIX IT','#ff6a3a');d.scr.material.color.setRGB(2.4,.3,.2);}
  if(!G.loud&&R()<dt*.6)noise(d.pos,6,'drill',null);
  if(d.p>=d.total){d.state='done';snd.drill(false);snd.drillDone();openVault();}}
 else snd.drill(false);}
function openVault(){if(L.vault){const v=L.vault;v.open=true;L.setBox(v.box,false);for(const[c,r]of v.cells)L.setCell(c,r,false);snd.vault();hud.banner('VAULT OPEN','BAG THE CASH AND GOLD','#ffd46a',3);}
 else{snd.vault();hud.banner('SAFE CRACKED','BAG THE CONTENTS','#ffd46a',3);}if(G.drill.mesh)setTimeout(()=>{if(G.drill.mesh)scene.remove(G.drill.mesh);},2500);}

/* ================= doors ================= */
function openDoor(d,by){if(d.open)return;d.open=true;L.setBox(d.box,false);const f=by?Math.sign(d.hor?(by.pos.z-d.z):(by.pos.x-d.x))||1:1;d.want=(d.hor?-1:1)*f*d.hinge*Math.PI/2*.95;if(d.kind==='E')d.want=d.want;const[dd,pan]=spatial(new V(d.x,1,d.z));if(dd<25)snd.door(true);if(d.led)d.led.material.color.setRGB(.2,3,.4);}
function closeDoor(d){if(!d.open)return;// don't close on someone
 for(const a of G.agents)if(a.alive&&Math.abs(a.pos.x-d.x)<.85&&Math.abs(a.pos.z-d.z)<.85)return;d.open=false;d.want=0;L.setBox(d.box,true);snd.door(false);}
G.openNear=(a,r=1.4)=>{for(const d of L.doors){if(d.open)continue;if(Math.hypot(d.x-a.pos.x,d.z-a.pos.z)>r)continue;const may=a.team==='law'&&(G.loud||!d.locked||a.type==='guard')||a.team==='crew'&&(!d.locked||G.loud&&a.type!=='player')||a.team==='civ'&&!d.locked;
  if(may){if(d.locked&&G.loud&&a.team!=='civ'){d.locked=false;}if(!d.locked)openDoor(d,a);}}};
function stepDoors(dt){for(const d of L.doors){d.ang+=(d.want-d.ang)*Math.min(1,dt*6);d.mesh.rotation.y=d.ang;}if(L.vault&&L.vault.open){const v=world.vaultG;v.piv.rotation.y+=(-1.75-v.piv.rotation.y)*Math.min(1,dt*.7);v.wheel.rotation.z+=dt*.8*Math.max(0,1+v.piv.rotation.y/1.75);}
 if(world.safeG&&G.drill.state==='done'){const s=world.safeG;s.piv.rotation.y+=(-1.9*s.front-s.piv.rotation.y)*Math.min(1,dt*1.5);}}

/* ================= interaction ================= */
let use={key:null,t:0};
function interactables(P){const out=[];const eye=new V(P.pos.x,P.pos.y+P.eye,P.pos.z);const f=viewDir(P,new V());const near=(x,y,z,r=1.9)=>{const dx=x-eye.x,dy=y-eye.y,dz=z-eye.z,d=Math.hypot(dx,dy,dz);if(d>r)return -1;const dot=(dx*f.x+dy*f.y+dz*f.z)/d;return dot>.55||d<.9&&dot>.2?d-dot:-1;};
 const add=(o,score)=>{if(score>=0)out.push({...o,score});};const masked=P.masked;
 if(P.down)return out;
 // teammates down
 for(const c of G.crew)if(c.down&&!c.custody)add({key:'rev'+c.id,t:'REVIVE '+c.name,hold:3,act:()=>G.revive(c,P)},near(c.pos.x,.6,c.pos.z,2.2));
 // pagers
 for(const pg of G.pagers)if(pg.ring&&!pg.done)add({key:'pg'+pg.body.id,t:'ANSWER PAGER ("ALL CLEAR, OVER")',hold:4.5,start:()=>pg.answering=true,cancel:()=>{pg.answering=false;},act:()=>{pg.done=true;G.pagersUsed++;G.stats.pagers++;if(G.pagersUsed>G.diff.pagers)G.alarm('THE DISPATCHER DIDN\'T BUY IT');else hud.toast('PAGER ANSWERED · '+(G.diff.pagers-G.pagersUsed)+' LEFT','#9be27a');}},near(pg.body.pos.x,.5,pg.body.pos.z,2.2));
 // bags on the floor
 for(const b of G.bags)if(!b.carrier&&!b.secured&&!P.bag)add({key:'bag',t:'PICK UP '+LOOTV[b.kind].label+' BAG',hold:0,act:()=>G.pickBag(P,b)},near(b.pos.x,b.pos.y,b.pos.z,2));
 // keycard + small cash + ammo
 if(G.keycard)add({key:'kc',t:'TAKE KEYCARD',hold:0,act:()=>{scene.remove(G.keycard.mesh);G.keycard=null;G.hasCard=true;snd.card(true);hud.toast('KEYCARD ACQUIRED','#7fd0ff');}},near(G.keycard.pos.x,G.keycard.pos.y,G.keycard.pos.z,1.8));
 for(const s of G.smallCash)add({key:'sc',t:'GRAB CASH '+money(s.v),hold:masked?0:.6,act:()=>{scene.remove(s.mesh);G.smallCash.splice(G.smallCash.indexOf(s),1);G.loose+=s.v*DMULT[G.opt.diff];snd.cash();}},near(s.pos.x,s.pos.y,s.pos.z,1.8));
 // doors
 for(const d of L.doors){const s=near(d.x,1.1,d.z,2);if(s<0)continue;if(d.open){add({key:'dc'+d.c+d.r,t:'CLOSE DOOR',hold:0,act:()=>closeDoor(d)},s+.3);continue;}
  if(!d.locked)add({key:'do'+d.c+d.r,t:'OPEN DOOR',hold:0,act:()=>openDoor(d,P)},s+.3);
  else if(d.kind==='K'){if(G.hasCard)add({key:'kd'+d.c,t:'USE KEYCARD',hold:0,act:()=>{for(const q of L.doors)if(q.kind==='K'){q.locked=false;}openDoor(d,P);snd.card(true);}},s);else if(masked)add({key:'hk'+d.c,t:'HACK THE CARD READER',hold:12,act:()=>{for(const q of L.doors)if(q.kind==='K')q.locked=false;openDoor(d,P);snd.card(true);},tick:i=>snd.pick(i)},s);else add({key:'kx',t:'KEYCARD REQUIRED',bad:1},s);}
  else if(masked)add({key:'lp'+d.c+d.r,t:'PICK THE LOCK',hold:G.loud?3:5,act:()=>{d.locked=false;openDoor(d,P);},tick:i=>snd.pick(i)},s);else add({key:'lx',t:'LOCKED · MASK UP TO PICK IT',bad:1},s);}
 // glass cases + loot spots
 for(const lo of L.loot){const s=near(lo.x,lo.y,lo.z,2.1);if(s<0)continue;
  if(lo.need==='case'&&!lo.prop.glass.broken){if(masked)add({key:'sm'+lo.x,t:'SMASH THE CASE',hold:0,act:()=>breakGlass(lo.prop.glass,null,P)},s);continue;}
  if(!G.lootOpen(lo))continue;if(!masked){add({key:'nm',t:'MASK UP FIRST',bad:1},s);continue;}
  if(lo.kind==='box')add({key:'bx'+lo.cell,t:'CRACK DEPOSIT BOX',hold:2.5,act:()=>{lo.left=0;const v=(1500+Math.round(R()*40)*150)*DMULT[G.opt.diff];G.loose+=v;snd.cash();hud.toast('DEPOSIT BOX · '+money(v),'#9be27a');},tick:i=>snd.pick(i)},s);
  else if(P.bag)add({key:'full',t:'HANDS FULL · Q TO THROW YOUR BAG',bad:1},s);else add({key:'lt'+lo.x+lo.z+lo.kind,t:'BAG THE '+LOOTV[lo.kind].label+(lo.left>1?' ('+lo.left+')':''),hold:lo.kind==='gold'?2.4:lo.kind==='jewel'?1.2:2,act:()=>G.takeLoot(P,lo),tick:()=>{}},s);}
 // drill
 const dr=G.drill;if((L.vault&&!L.vault.open||L.safe)&&dr.state!=='done'){const s=drillSite();const sc=near(s.x,1.3,s.z,2.4);if(sc>=0){if(dr.state==='idle'){if(masked)add({key:'dr',t:'PLACE THE DRILL ON THE '+G.def.drill.label,hold:2,act:placeDrill},sc);}else if(dr.state==='jam')add({key:'fx',t:'FIX THE DRILL',hold:G.opt.diff===2?3:2.2,act:()=>{dr.state='run';dr.jamT=G.time+G.diff.jam[0]+R()*(G.diff.jam[1]-G.diff.jam[0]);snd.click();}},sc);}}
 // civilians: tie the cowering
 for(const a of G.agents)if(a.alive&&a.team==='civ'&&a.cs==='cower'&&masked&&G.ties>0)add({key:'tie'+a.id,t:'TIE UP ('+G.ties+' TIES)',hold:1.4,act:()=>{a.cs='tied';G.ties--;G.stats.ties++;snd.tie();}},near(a.pos.x,.7,a.pos.z,1.9));
 // the van: escape, heal, ammo
 const vd=L.P(G.def.van.door);const vs=near(vd.x,1.2,vd.z,2.6);if(vs>=0){if(G.secured.length>=G.def.minBags)add({key:'esc',t:'ESCAPE WITH '+G.secured.length+' BAG'+(G.secured.length>1?'S':''),hold:2,act:()=>endHeist(true,'escape')},vs);
  else add({key:'escx',t:'SECURE '+G.def.minBags+' BAGS TO ESCAPE ('+G.secured.length+')',bad:1},vs+.5);
  if(P.hp<P.maxHp&&G.docBag>0)add({key:'doc',t:'MEDIC BAG ('+G.docBag+')',hold:1.2,act:()=>{P.hp=P.maxHp;G.docBag--;snd.secured();}},vs+.1);
  if(masked&&G.ammoBag>0&&(P.slots[1].res<P.slots[1].def.res||P.slots[2].res<P.slots[2].def.res))add({key:'amm',t:'AMMO BAG ('+G.ammoBag+')',hold:1,act:()=>{for(const k of[1,2])P.slots[k].res=P.slots[k].def.res;G.ammoBag--;snd.reload('in');}},vs+.2);}
 out.sort((a,b)=>a.score-b.score);return out;}
let curPrompt=null;
function stepUse(P,dt){const list=interactables(P);const it=list[0]||null;curPrompt=it?{t:it.t+(it.bad?'':it.hold?' <kbd>HOLD E</kbd>':' <kbd>E</kbd>'),p:0,hold:!!it.hold,bad:it.bad}:null;
 const down=keys.KeyE||padUse;if(!it||it.bad||!down){if(use.key&&use.cancel)use.cancel();use={key:null,t:0};if(!down)use.fresh=true;return;}
 if(!it.hold){if(use.fresh){use.fresh=false;it.act();}return;}
 if(use.key!==it.key){if(use.cancel)use.cancel();use={key:it.key,t:0,cancel:it.cancel,fresh:false};if(it.start)it.start();}
 use.t+=dt;if(it.tick&&Math.floor(use.t*4)!==Math.floor((use.t-dt)*4))it.tick(Math.floor(use.t*4));curPrompt.p=Math.min(1,use.t/it.hold);
 if(use.t>=it.hold){use={key:null,t:0,fresh:false};it.act();}}
G.usingNow=()=>!!use.key;

/* ================= orders + shout ================= */
function order(mode){G.orders=mode;const P=G.player;for(const c of G.crew){if(c.custody)continue;c.order=mode;if(mode==='hold')c.holdP={x:c.pos.x,z:c.pos.z};c.brain.path=null;c.brain.lj=null;}
 const t={follow:'CREW · FOLLOW ME',hold:'CREW · HOLD POSITION',loot:'CREW · MOVE THE LOOT TO THE VAN'}[mode];hud.toast(t,'#7fd0ff');snd.radio();if(!G.loud&&mode!=='hold')for(const c of G.crew)if(c.standby){c.standby=false;c.setMask(true);}}
function shout(){const P=G.player;if(!P.masked||P.down)return;snd.shout();const f=viewDir(P,new V());let n=0;
 for(const a of G.agents){if(!a.alive||a.team!=='civ'||a.cs==='tied')continue;const dx=a.pos.x-P.pos.x,dz=a.pos.z-P.pos.z,d=Math.hypot(dx,dz);if(d>15)continue;if(d>2&&(dx*f.x+dz*f.z)/d<.55)continue;if(!G.canSee(P,a))continue;
  a.cs='cower';a.brain.t=(G.opt.diff===0?45:30)+R()*10;a.brain.path=null;a.rig.setGun('none');n++;a.sus.clear();a.spotted=false;}
 if(n)hud.toast(n>1?n+' CIVILIANS ON THE GROUND':'CIVILIAN ON THE GROUND','#ffcf6a');}

/* ================= movement ================= */
function moveAgent(a,dt){const c=a.ctl,P=a===G.player;const crouch=c.crouch||a.crouch;a.crouchV+=((crouch?1:0)-a.crouchV)*Math.min(1,dt*9);if(a.down){a.vel.x*=.8;a.vel.z*=.8;}
 let spd;if(P){const bagW=a.bag?a.bag.w:1;spd=(c.run&&!a.ads&&a.crouchV<.5&&!(a.bag&&a.bag.kind==='gold')?5.8:3.7)*bagW*(a.crouchV>.5?.6:1)*(a.ads?.6:1);if(a.down||use.key)spd=0;}
 else{spd=a.speed*(a.bag?a.bag.w:1)*(a.crouchV>.5?.55:1);if(a.down||a.pose==='cower'||a.pose==='tied'||a.pose==='sit')spd=0;}
 if(a.flinch>0){spd*=1-a.flinch*.35;a.flinch=Math.max(0,a.flinch-dt*3);}
 let wx=c.mx,wz=c.mz;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}const tx=wx*spd,tz=wz*spd;
 if(a.onGround){const k=Math.min(1,dt*(wl>.01?10:14));a.vel.x+=(tx-a.vel.x)*k;a.vel.z+=(tz-a.vel.z)*k;if(c.jump&&a.crouchV<.5&&!a.down&&!(a.bag&&a.bag.kind==='gold')){a.vel.y=4.6;a.onGround=false;}}
 else{a.vel.x+=(tx-a.vel.x)*Math.min(1,dt*1.5);a.vel.z+=(tz-a.vel.z)*Math.min(1,dt*1.5);}
 a.vel.y-=GRAV*dt;const p=a.pos,h=1.8-a.crouchV*.5;p.x+=a.vel.x*dt;p.z+=a.vel.z*dt;const hit=L.collide(p,.32,h);
 if(hit&&hit.kind==='leaf'&&!P)G.openNear(a,1.5);
 p.y+=a.vel.y*dt;const g=L.ground(p.x,p.z,p.y+(a.onGround?STEP:0)-.001,.28);
 if(p.y<=g+.001){if(!a.onGround&&-a.vel.y>6.5&&P)snd.land(.6);p.y=g;a.vel.y=0;a.onGround=true;}else if(a.onGround&&p.y-g<STEP+.02&&a.vel.y<=0){p.y=g;a.vel.y=0;}else a.onGround=false;
 const ce=L.ceil(p.x,p.z,p.y);if(p.y+h>ce){p.y=Math.max(g,ce-h);a.vel.y=Math.min(0,a.vel.y);}
 const hs=Math.hypot(a.vel.x,a.vel.z);if(a.onGround&&hs>2.2&&a.crouchV<.5){a.stepAcc+=hs*dt;if(a.stepAcc>(hs>4.5?2.2:1.6)){a.stepAcc=0;const f=L.fkAt(p.x,p.z);const surf=f==='k'?'carpet':f==='v'?'metal':f==='x'?'wood':'stone';
   if(P)snd.step(.5,0,surf);else{const[d,pan]=spatial(p);if(d<22)snd.step(snd.att(d,4)*.9,pan,surf);}if(P&&hs>4.5)noise(p,4,'step',a);}}else if(hs<.4)a.stepAcc=1.2;}
function separate(){const A=G.agents;for(let i=0;i<A.length;i++){const a=A[i];if(!a.alive)continue;for(let j=i+1;j<A.length;j++){const b=A[j];if(!b.alive)continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d2=dx*dx+dz*dz;if(d2>.42||d2<1e-6)continue;const d=Math.sqrt(d2),push=(.65-d)*.5;
  const wa=a===G.player?.2:1,wb=b===G.player?.2:1;a.pos.x-=dx/d*push*wa;a.pos.z-=dz/d*push*wa;b.pos.x+=dx/d*push*wb;b.pos.z+=dz/d*push*wb;}}}

/* ================= target picking (law <-> crew) ================= */
G.pickTarget=a=>{let best=null,bd=1e9;for(const t of[G.player,...G.crew]){if(!t||!t.alive||t.custody||t.standby&&!G.loud)continue;const d=Math.hypot(t.pos.x-a.pos.x,t.pos.z-a.pos.z)+(t.down?14:0)+(t===G.player?-3:0);if(d<bd){bd=d;best=t;}}return best;};
G.pickFoe=(a,range)=>{let best=null,bd=range;for(const e of G.agents){if(!e.alive||e.team!=='law'||e.down)continue;const d=Math.hypot(e.pos.x-a.pos.x,e.pos.z-a.pos.z);if(d<bd&&G.canSee(a,e)){bd=d;best=e;}}return best;};
G.exitFor=a=>{const ents=L.doors.filter(d=>d.kind==='E');const e=ents[R()*ents.length|0]||L.doors[0];const out=L.P([e.c,e.r+3]);return{x:out.x+(R()-.5)*3,z:out.z+1+R()*2};};
G.despawn=a=>{a.alive=false;a.custody=true;a.rig.root.visible=false;};

/* ================= per-agent update ================= */
function updateAgent(a,dt){if(a.down){a.bleed-=dt;if(a.bleed<=0)custody(a);return;}
 if(a.team==='crew'&&a.armorT>0){a.armorT-=dt;}else if(a.team==='crew'&&a.armor<a.maxArmor)a.armor=Math.min(a.maxArmor,a.armor+dt*35);
 if(a.rest>0)a.rest-=dt;
 if(a!==G.player){const c=a.ctl;if(c.fire&&c.aim&&a.alive){if(a.brain.lastAim!==c.aim){a.brain.lastAim=c.aim;a.react=G.time+(a.team==='crew'?.3:[.75,.5,.32][G.opt.diff])*(.7+R()*.6);}npcFire(a,c.aim);}c.fire=false;return;}
 if(a.switchT>0)a.switchT-=dt;if(a.reloadT>0){a.reloadT-=dt;if(a.reloadT<=0){a.reloadT=0;finishReload(a);}}
 const g=a.gun();if(G.time-a.lastShot>.12){const k=Math.exp(-dt*6);a.recoil.x*=k;a.recoil.y*=k;a.sprayN=Math.max(0,a.sprayN-dt*8);}
 if(a.ctl.fire){const fired=fire(a);if(g&&!g.def.auto&&fired)mouse.semiLock=true;}
 // ammo drops
 for(let i=G.drops.length-1;i>=0;i--){const d=G.drops[i];if(Math.hypot(d.pos.x-a.pos.x,d.pos.z-a.pos.z)<1.1){for(const k of[1,2]){const s=a.slots[k];s.res=Math.min(s.def.res,s.res+Math.ceil(s.def.mag*(k===1?.6:.5)));}scene.remove(d.mesh);G.drops.splice(i,1);snd.reload('in');}}
 // secure a carried bag by walking it into the van zone
 if(a.bag&&G.inVan(a.pos.x,a.pos.z))G.secureBag(a.bag,a);}

/* ================= player input ================= */
const keys={},mouse={l:false,r:false,semiLock:false,dx:0,dy:0};let locked=false,padUse=false;
function lock(){if(G.app!=='play')return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='play')pause(true);});
canvas.addEventListener('mousedown',()=>{if(G.app==='play'&&!locked)lock();});
addEventListener('mousedown',e=>{if(G.app!=='play'||!locked)return;if(e.button===0)mouse.l=true;if(e.button===2)mouse.r=true;});
addEventListener('mouseup',e=>{if(e.button===0){mouse.l=false;mouse.semiLock=false;}if(e.button===2)mouse.r=false;});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(!locked)return;mouse.dx+=e.movementX;mouse.dy+=e.movementY;});
addEventListener('wheel',e=>{if(G.app==='play'&&locked&&G.player)switchTo(G.player,G.player.cur===1?2:1);},{passive:true});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];keys[e.code]=true;if(['Space','Tab'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='play')pause(true);else if(G.app==='paused')pause(false);return;}
 if(G.app!=='play'||!first)return;const P=G.player;if(!P||!P.alive)return;
 if(e.code==='KeyM'&&!P.masked)maskUp(P);
 if(P.down){if(e.code==='KeyR')startReload(P);return;}
 if(e.code==='Digit1')switchTo(P,1);if(e.code==='Digit2')switchTo(P,2);if(e.code==='KeyR')startReload(P);
 if(e.code==='KeyQ'&&P.bag)dropBag(P,true);if(e.code==='KeyF')shout();
 if(e.code==='KeyZ')order('follow');if(e.code==='KeyX')order('hold');if(e.code==='KeyV')order('loot');if(e.code==='Tab')$('hud').classList.add('tab');});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Tab')$('hud').classList.remove('tab');});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
function readPlayer(dt){const P=G.player,c=P.ctl;P.ads=mouse.r&&P.masked&&!P.down&&P.reloadT<=0&&!(c.run&&false);const sens=.0022*G.opt.sens*(P.ads?.6:1);
 if(locked){P.yaw-=mouse.dx*sens;P.pitch-=mouse.dy*sens;P.pitch=cl(P.pitch,-1.45,1.45);}if(VM){VM.mdx=mouse.dx;VM.mdy=mouse.dy;}
 const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);c.mx=-sy*f+cy*s;c.mz=-cy*f-sy*s;
 c.run=!!(keys.ShiftLeft||keys.ShiftRight)&&f>0;c.crouch=!!(keys.ControlLeft||keys.KeyC||keys.ControlRight);c.jump=!!keys.Space;const g=P.gun();c.fire=mouse.l&&locked&&P.masked&&!(g&&!g.def.auto&&mouse.semiLock)&&!(c.run&&Math.hypot(P.vel.x,P.vel.z)>4.6);
 padUse=false;const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.18?v:0;const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);
  if(lx||ly){c.mx=-sy*(-ly)+cy*lx;c.mz=-cy*(-ly)-sy*lx;}P.yaw-=rx*dt*2.6*G.opt.sens;P.pitch=cl(P.pitch-ry*dt*2,-1.45,1.45);if(bt[7]&&bt[7].value>.4&&P.masked)c.fire=true;if(bt[6]&&bt[6].value>.4)P.ads=P.masked;if(bt[0]&&bt[0].pressed)c.jump=true;if(bt[1]&&bt[1].pressed)c.crouch=true;if(bt[2]&&bt[2].pressed)padUse=true;if(bt[10]&&bt[10].pressed)c.run=true;
  const pr=G.padPrev||{};if(bt[3]&&bt[3].pressed&&!pr.y)switchTo(P,P.cur===1?2:1);if(bt[4]&&bt[4].pressed&&!pr.lb)startReload(P);if(bt[5]&&bt[5].pressed&&!pr.rb){if(!P.masked)maskUp(P);else if(P.bag)dropBag(P,true);else shout();}if(bt[9]&&bt[9].pressed&&!pr.st)pause(true);
  G.padPrev={y:bt[3]&&bt[3].pressed,lb:bt[4]&&bt[4].pressed,rb:bt[5]&&bt[5].pressed,st:bt[9]&&bt[9].pressed};}
 if(P.down){c.mx=c.mz=0;c.run=false;c.jump=false;}mouse.dx=mouse.dy=0;}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlock();}else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= simulation step ================= */
let acc=0,shake=0,menuA=0;
function shakeAt(p,r,s){const d=cam.position.distanceTo(p);if(d<r)shake=Math.max(shake,s*(1-d/r));}
function spatial(p){const c=cam.position;const dx=p.x-c.x,dy=p.y-c.y,dz=p.z-c.z;const d=Math.hypot(dx,dy,dz)||1;const rx=Math.cos(cam.rotation.y),rz=-Math.sin(cam.rotation.y);return[d,(dx*rx+dz*rz)/d];}
function step(dt){dt=Math.min(dt,.1);if(G.app==='paused'||G.app==='over'){visuals(dt);return;}
 G.time+=dt;const P=G.player;
 if(G.app==='play'){G.timeLeft-=dt;if(G.timeLeft<=0){G.timeLeft=0;endHeist(false,'time');}readPlayer(dt);if(P.maskT>0)P.maskT-=dt;}
 // AI
 for(const a of G.agents){if(!a.alive||a===P||a.down)continue;if(G.idle){a.ctl.mx=a.ctl.mz=0;a.ctl.fire=false;continue;}
  if(a.team==='civ')thinkCiv(G,a,dt);else if(a.type==='guard'||a.type==='operator')thinkGuard(G,a,dt);else if(a.type==='crew')thinkCrew(G,a,dt);else thinkCop(G,a,dt);}
 acc+=dt;let n=0;while(acc>=DT&&n<5){for(const a of G.agents)if(a.alive)moveAgent(a,DT);separate();acc-=DT;n++;}if(n>=5)acc=0;
 for(const a of G.agents)if(a.alive)updateAgent(a,dt);
 if(G.app==='play'){stepUse(P,dt);stepDetection(dt);stepWaves(dt);stepDrill(dt);}
 stepBags(dt);stepDoors(dt);
 for(let i=G.agents.length-1;i>=0;i--){const a=G.agents[i];if(!a.alive&&a.team==='law'&&G.time-a.diedAt>25&&G.loud){scene.remove(a.rig.root);G.agents.splice(i,1);}}
 if(G.events.length>60)G.events.splice(0,G.events.length-60);
 G.policeNear=G.loud&&G.wave.phase==='assault';snd.tick(dt,G);visuals(dt);}

/* ================= visuals ================= */
function visuals(dt){for(const a of G.agents){const r=a.rig;if(!a.custody){r.root.position.copy(a.pos);r.root.rotation.y=a.yaw+Math.PI;}const hide=a===G.player&&G.app!=='menu'&&G.app!=='over';r.root.visible=!hide&&!a.custody;
  if(r.root.visible)r.update(dt,{speed:Math.hypot(a.vel.x,a.vel.z),crouch:a.crouchV,pitch:a.team==='civ'?0:a.pitch,dead:!a.alive,reload:0,pose:a.down?'down':a.pose,bag:!!a.bag});}
 for(const c of world.cams){if(c.dead)continue;const yaw=c.yaw0+Math.sin(G.time*.45+c.ph)*c.sweep;c.piv.rotation.y=yaw;const k=c.sus||0;c.cone.material.opacity=.06+k*.2;c.cone.material.color.setRGB(1,.6-k*.4,.4-k*.3);}
 for(const b of G.bags)if(!b.carrier&&!b.secured&&b.rest)b.mesh.position.y=b.pos.y;
 if(G.keycard)G.keycard.mesh.rotation.y+=dt;
 fx.update(dt,scene.fog);world.update(dt,cam,(x,y,z)=>fx.sparks.emit(x,y,z,(R()-.5)*.6,1+R(),(R()-.5)*.6,.6,.65,.75,.03,.15,9,1));cameras(dt);if(G.app!=='menu'&&G.player)hud.update(dt,HX);}
let specCam=new V(),specInit=false;
function cameras(dt){shake=Math.max(0,shake-dt*1.8);vmFlash.intensity*=Math.exp(-dt*30);const P=G.player;
 if(G.app==='menu'||!P){// slow dolly through the main hall
  menuA+=dt*.05;const c=G.def.ceil[0];const x0=L.X(c[0])+2,x1=L.X(c[2]+1)-2,z0=L.Z(c[1])+2,z1=L.Z(c[3]+1)-2;const t=(Math.sin(menuA)+1)/2;const px=x0+(x1-x0)*t,pz=z1-1.5+Math.sin(menuA*1.7)*1.2;
  cam.position.set(px,2.1+Math.sin(menuA*2.3)*.3,pz);cam.lookAt((x0+x1)/2+Math.sin(menuA*.8)*4,1.6,z0-2);cam.fov=62;cam.updateProjectionMatrix();if(VM)VM.root.visible=false;return;}
 if(G.app==='over'){menuA+=dt*.12;const vz=L.P(G.def.van.door);const r=6;cam.position.set(vz.x+2.2+Math.sin(menuA)*1.6,1.9,vz.z+6.2+Math.cos(menuA*.7)*.6);cam.lookAt(vz.x-.6,1.15,vz.z+.6);cam.fov=50;cam.updateProjectionMatrix();VM.root.visible=false;return;}
 const eyeT=P.pos.y+P.eye;P.eyeY=P.eyeY===undefined||Math.abs(P.eyeY-eyeT)>1.2?eyeT:P.eyeY+(eyeT-P.eyeY)*Math.min(1,dt*14);
 cam.position.set(P.pos.x,P.eyeY,P.pos.z);P.punch=(P.punch||0)*Math.exp(-dt*8);const s=shake*shake*.25;
 cam.rotation.set(P.pitch+P.recoil.y*D2R+(R()-.5)*s+P.punch*.012,P.yaw+P.recoil.x*D2R+(R()-.5)*s,P.down?.12:0);
 const g=P.gun();const zf=P.ads?(g&&g.def.cls==='rifle'?52:60):75;cam.fov+=(zf-cam.fov)*Math.min(1,dt*14);cam.updateProjectionMatrix();
 VM.root.visible=true;VM.update({dt,mdx:VM.mdx||0,mdy:VM.mdy||0,speed:Math.hypot(P.vel.x,P.vel.z),crouch:P.crouchV>.5,onGround:P.onGround,aiming:P.ads,using:!!use.key&&use.t>0||P.down,bag:!!P.bag,t:G.time});}

/* ================= HUD bridge ================= */
const prj=new V();
const HX={
 objectives(){const d=G.def,P=G.player,o=[];const vault=!!L.vault;o.push({t:P.masked?'MASKED UP':'CASE THE PLACE · <kbd>M</kbd> TO MASK UP',done:P.masked});
  if(vault){o.push({t:G.hasCard||!L.doors.some(q=>q.kind==='K'&&q.locked)?'VAULT ANTECHAMBER OPEN':'FIND THE MANAGER\'S KEYCARD (OR HACK THE READER)',done:G.hasCard||!L.doors.some(q=>q.kind==='K'&&q.locked)});}
  else{const cases=L.loot.filter(l=>l.kind==='jewel');const left=cases.filter(l=>l.left>0).length;o.push({t:'BAG THE JEWELLERY ('+(cases.length-left)+'/'+cases.length+')',done:left===0});o.push({t:G.hasCard||!L.doors.some(q=>q.kind==='K'&&q.locked)?'STRONG ROOM OPEN':'GET INTO THE STRONG ROOM (KEYCARD)',done:G.hasCard||!L.doors.some(q=>q.kind==='K'&&q.locked)});}
  const dr=G.drill;o.push({t:dr.state==='done'?d.drill.label+' OPEN':dr.state==='idle'?'DRILL THE '+d.drill.label:dr.state==='jam'?'FIX THE DRILL':'DRILLING · '+fmt((dr.total-dr.p)),done:dr.state==='done'});
  o.push({t:'SECURE LOOT AT THE VAN · '+G.secured.length+'/'+d.minBags+' MINIMUM',done:G.secured.length>=d.minBags});o.push({t:'ESCAPE IN THE VAN',done:false});return o;},
 spread(){const P=G.player;return P?spreadOf(P):0;},ads(){return G.player&&G.player.ads;},prompt(){return curPrompt;},
 detection(){const out=[];if(G.loud||!G.player)return out;const w=innerWidth,h=innerHeight;const add=(x,y,z,v,kind)=>{prj.set(x,y,z).project(cam);let sx=(prj.x*.5+.5)*w,sy=(-prj.y*.5+.5)*h;const behind=prj.z>1;let rot=0;
   if(behind||sx<30||sx>w-30||sy<30||sy>h-30){let dx=sx-w/2,dy=sy-h/2;if(behind){dx=-dx;dy=-dy;}const a=Math.atan2(dy,dx);rot=a*180/Math.PI+90;sx=w/2+Math.cos(a)*Math.min(w,h)*.22;sy=h/2+Math.sin(a)*Math.min(w,h)*.22;kind+=' edge';}out.push({x:sx,y:sy,v,kind,rot});};
  for(const o of G.agents){if(!o.alive||o.team==='crew')continue;let v=0;for(const s of o.sus.values())v=Math.max(v,s);if(o.cs==='panic'&&o.brain.callT>0)v=Math.max(v,1);if(G.pend.some(p=>p.by===o))v=1;if(v<.03)continue;add(o.pos.x,o.pos.y+2.1,o.pos.z,v,o.team==='civ'?'civ':'guard');}
  for(const c of world.cams)if(!c.dead&&c.sus>.03)add(c.x,c.y+.4,c.z,c.sus,'cam');
  for(const pg of G.pagers)if(pg.ring&&!pg.done)add(pg.body.pos.x,.9,pg.body.pos.z,(G.time-pg.ring)/12,'pager');
  return out;}};

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM||!VM.root.visible)return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='';
function applyQuality(q){gfx=q;Rr.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.2:.85));fxStack=null;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const lo=$('lockov');if(lo){const h=G.app!=='play'||locked||G.idle||G.attract;if(lo.hidden!==h)lo.hidden=h;}const w=innerWidth,h=innerHeight;if(Rr.domElement.width!==Math.floor(w*Rr.getPixelRatio())||Rr.domElement.height!==Math.floor(h*Rr.getPixelRatio()))Rr.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();const sc=h*Rr.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));fx.sparks.U.uScale.value=fx.smoke.U.uScale.value=sc;
 const M=world.M;const key=w+'x'+h;if(!fxStack){fxStack=cinematic(Rr,scene,cam,{exposure:M.exp,bloom:M.bloom,bloomThreshold:M.thr,bloomRadius:.55,saturation:M.sat,tint:M.tint,vignette:.32,grain:.025,aoStrength:.8,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade){const P=G.player;const hp=P&&G.app==='play'?(P.down?.15:P.hp/P.maxHp):1;fxStack.grade.uniforms.sat.value=M.sat*(.35+.65*Math.min(1,hp*1.6));}
 if(fxStack.composer)fxStack.render();else{Rr.autoClear=true;Rr.render(scene,cam);if(VM&&VM.root.visible){Rr.autoClear=false;Rr.clearDepth();Rr.render(vmScene,vmCam);Rr.autoClear=true;}}}

/* ================= end + scoring ================= */
let lastAward=null;
function endHeist(won,why){if(G.app!=='play')return;G.app='over';G.endWhy=why;unlock();hud.show(false);document.body.classList.remove('playing');snd.alarm(false);snd.setMusic(null);snd.drill(false);snd.sting(won);
 const d=G.def;const bags=won?G.secured.reduce((s,b)=>s+b.value,0):0;const loose=won?G.loose:0;const stealth=won&&!G.loud;const bonus=stealth?Math.round((bags+loose)*.3):0;const pen=G.stats.civKills*civPenalty();
 const pay=Math.max(0,bags+loose+bonus-(won?pen:0));
 // grade from the share of the possible take, stealth, collateral, time
 const potential=L.loot.filter(l=>l.kind!=='box').reduce((s,l)=>s+(l.init??l.left)*LOOTV[l.kind==='jewel'?'jewel':l.kind].v*DMULT[G.opt.diff],0);
 let sc=won?Math.min(100,(bags/Math.max(1,potential))*85+(stealth?20:0)+(G.timeLeft/G.limit)*10-G.stats.civKills*12-G.stats.downs*3):0;const grade=!won?'F':sc>=92?'S':sc>=75?'A':sc>=55?'B':sc>=35?'C':'D';
 $('oeye').textContent=d.name+' · '+G.diff.n+' · '+fmt(G.limit-G.timeLeft);
 $('ores').textContent=won?(stealth?'CLEAN GETAWAY':'GOT AWAY'):why==='custody'?'IN CUSTODY':'BUSTED';$('ores').className='res '+(won?'w':'l');
 $('ograde').textContent=grade;$('ograde').className='grade g'+grade;
 const row=(k,v,c='')=>`<tr class="${c}"><td>${k}</td><td>${v}</td></tr>`;
 $('stats').innerHTML=row('BAGS SECURED',G.secured.length+' · '+money(bags))+row('LOOSE CASH',money(loose))+row('STEALTH BONUS',stealth?'+'+money(bonus):'—',stealth?'g':'')+row('CIVILIAN CASUALTIES',G.stats.civKills?G.stats.civKills+' · −'+money(pen):'0',G.stats.civKills?'r':'')+
  row('KILLS',G.stats.kills+(G.stats.hs?' · '+G.stats.hs+' HEADSHOTS':'')+' · CREW '+G.stats.crewKills)+row('ACCURACY',G.stats.shots?Math.round(G.stats.hits/G.stats.shots*100)+'%':'—')+row('DOWNS · PAGERS · TIES',G.stats.downs+' · '+G.stats.pagers+' · '+G.stats.ties)+row('ALARM',G.loud?G.alarmMsg:'NEVER RAISED')+row('TOTAL TAKE',money(pay),'tot');
 const tok=award(pay,won,grade);$('otok').textContent=`+${tok} TOKENS · BEST ${money(bestScore(GID))}`;$('over').hidden=false;menuA=0;
 for(const a of G.agents)if(a.team!=='crew'){a.rig.root.visible=false;}const vz=L.P(d.van.door);[G.player,...G.crew].forEach((a,i)=>{if(!a.custody){a.alive=true;a.down=false;a.pos.set(vz.x-1.5+i,0,vz.z+1.6);a.yaw=Math.PI;a.vel.set(0,0,0);a.setMask&&a.rig.setMask(true);a.rig.setGun('rifle');a.pose='stand';}});}
function award(pay,won,grade){lastAward={pts:Math.round(pay),won,grade,map:G.def.short,diff:G.diff.n,kills:G.stats.kills,bags:G.secured.length,stealth:won&&!G.loud};const tok=4+Math.min(60,pay/12000|0)+(grade==='S'?10:0);addRound(tok,won);if(won)saveBest(GID,Math.round(pay));return tok;}

/* ================= menus ================= */
const hud=new HUD(G);G.hud=hud;
const seg=(id,key,num=true)=>{const el=$(id);const set=(v,init)=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',(num?+b.dataset.v:b.dataset.v)===v));if(key==='map'&&G.app==='menu'&&!init)attractMode();if(key==='map')$('brief').textContent=MAPS[G.opt.map].brief;};set(G.opt[key],true);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(num?+b.dataset.v:b.dataset.v));};
seg('o-map','map');seg('o-diff','diff');seg('o-gun','gun',false);seg('o-sens','sens');seg('o-vol','vol');
$('o-vol').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>snd.setVol(G.opt.vol)));
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};const u=userName();const body=`Game: Halcyon Heist\nTake: $${a.pts||0}\nResult: ${a.won?'escaped':'busted'} · grade ${a.grade||'F'}${a.stealth?' · stealth':''}\nBags: ${a.bags||0} · Kills: ${a.kills||0}\nSite: ${a.map||''} · ${a.diff||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;postScore(GID,a.pts||0,body);};

/* ================= loop ================= */
attractMode();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.HEIST={get state(){return G.app==='play'?(G.loud?'loud':'stealth'):G.app;},G,step,render,start,toMenu,pause,scene,cam,R:Rr,
 get player(){return G.player;},get crew(){return G.crew;},get agents(){return G.agents;},get bots(){return G.agents.filter(a=>a!==G.player);},get L(){return L;},get world(){return world;},
 get score(){return lastAward?lastAward.pts:G.secured.reduce((s,b)=>s+b.value,0)+G.loose;},get round(){return{time:G.time,left:G.timeLeft,loud:G.loud,wave:G.wave,bags:G.secured.length,drill:G.drill.state,app:G.app};},
 setIdle(v=true){G.idle=v;},alarm:m=>G.alarm(m||'TEST'),maskUp:()=>maskUp(G.player,true),order,shout,fire:()=>fire(G.player),setClock(s){G.timeLeft=s;},
 teleport(x,z){const P=G.player;P.pos.set(x,0,z);},look(yaw,pitch){G.player.yaw=yaw;G.player.pitch=pitch;},openVault:()=>{G.drill.state='done';openVault();},placeDrill,setDrill(p){G.drill.p=p;},
 giveCard(){G.hasCard=true;},takeLoot:(lo)=>G.takeLoot(G.player,lo),throwBag:()=>dropBag(G.player,true),secureAll(){for(const c of[G.player,...G.crew])if(c.bag)G.secureBag(c.bag,c);},
 escape:()=>endHeist(true,'escape'),end:(won=false)=>endHeist(won,'test'),setQuality:applyQuality,get gfx(){return gfx;},hud,snd,VM:()=>VM,breakGlass,interact:()=>interactables(G.player),
 drillSite:()=>drillSite(),killAgent(a,by){damage(a,by===undefined?G.player:by,999,'head',{});},spawnCop:t=>spawnCop(t||'swat'),startAssault};
VM=buildViewmodel(TXC[MAPS[G.opt.map].mood]||makeTextures('dusk'),CREW[0]);vmCam.add(VM.root);VM.set('hands','hands');
