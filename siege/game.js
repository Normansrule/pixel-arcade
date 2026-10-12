// FORTRESS BREACH — tactical 5v5 attack/defend with destructible walls, gadgets and a prep phase. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {Level,SITES,SPAWNS,FH,PEN,SND,STEP,CELL,BX0,BX1,BZ0,BZ1} from './level.js';
import {makeTextures} from './tex.js';
import {buildWorld,BAKE_U} from './world.js';
import {WPN,THR,GAD,ARM,OPS,ATK_OPS,DEF_OPS,DIFF} from './ops.js';
import {Rig,hitActor} from './actors.js';
import {FX} from './fx.js';
import {buildViewmodel} from './viewmodel.js';
import {Sound} from './sound.js';
import {initGadgets} from './gadgets.js';
import {planRound,teamTick,think,Brain} from './ai.js';
import {HUD} from './hud.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,D2R=Math.PI/180;
const END_T=5.5,PLANT_T=6,DISARM_T=6,DEFUSE_RUN=45,CAP_T=10,REIN_T=2.6,BAR_T=1.2,HREIN_T=2.2,GRAV=15,DT=1/60,REIN_POOL=10;
const NAMES=['ASHFORD','BRAKE','CORVID','DUNMORE','EMBER','FALLOW','GANNET','HARROW','INGRAM','JUNIPER','KESTREL','LOCKE','MERRIN','NOVAK','ORLA','PIKE','QUINCE','RUSK','SOLVEIG','TARN','UDALL','VESPER','WREN','YATES'];
export const SIDE={atk:{n:'ATTACKERS',s:'ATK',css:'#ff8a3d'},def:{n:'DEFENDERS',s:'DEF',css:'#4fb2ff'}};

/* ================= renderer ================= */
const canvas=$('c');const Rr=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});Rr.setPixelRatio(Math.min(devicePixelRatio,1.5));
Rr.shadowMap.enabled=true;Rr.shadowMap.type=THREE.PCFSoftShadowMap;Rr.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(74,1,.04,600);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(56,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xb8c4e0,0x2a2622,.6),vmKey=new THREE.DirectionalLight(0xffd8a8,1.1),vmRim=new THREE.DirectionalLight(0x9ab0ff,.7),vmFlash=new THREE.PointLight(0xffaa55,0,2.5,1.5);
vmKey.position.set(-1,2,1);vmRim.position.set(2,.6,-1.5);vmFlash.position.set(.12,-.06,-.75);vmScene.add(vmHemi,vmKey,vmRim,vmFlash);
const torch=new THREE.SpotLight(0xfff2dc,0,22,.46,.75,2);const torchT=new THREE.Object3D();scene.add(torch,torchT);torch.target=torchT;torch.shadow.mapSize.set(512,512);torch.shadow.bias=-.002;
const snd=new Sound();
let TX=null,world=null,L=null,fx=null,VM=null,GX=null,hud=null;

/* ================= state ================= */
const G={app:'loading',opt:{side:'atk',diff:1,len:1,mode:'secure',bans:1,sens:1,vol:.8,atkOp:'volt',defOp:'bastion',spawn:'street',site:'server',torch:1},
 agents:[],player:null,score:[0,0],round:0,phase:'prep',timer:45,endT:0,time:0,matchT:0,events:[],view:'body',camI:0,bans:{atk:[],def:[]},
 defuser:{state:'none'},cap:0,siteKnown:false,spotT:{atk:{},def:{}},rein:REIN_POOL,feedLog:[],history:[],attract:true,spec:null,mvpLast:null,scanHits:[],stats:{breaches:0}};
try{Object.assign(G.opt,JSON.parse(localStorage.getItem('pxd_siege_opt'))||{});}catch(e){}
const LEN=[{n:'QUICK',target:3,half:2,prep:30,act:150,limit:18*60},{n:'FULL',target:4,half:3,prep:45,act:180,limit:30*60}];
G.len=()=>LEN[G.opt.len]||LEN[1];
function sideOfSquad(s){const half=Math.floor(G.round/G.len().half)%2;let atk=s===0?G.startAtk:!G.startAtk;if(half)atk=!atk;return atk?'atk':'def';}
const side=a=>sideOfSquad(a.squad);G.side=side;G.squadOf=sd=>sideOfSquad(0)===sd?0:1;
const enemyOf=s=>s==='atk'?'def':'atk';

/* ================= agents ================= */
class Agent{constructor(id,name,squad,human){Object.assign(this,{id,name,squad,human,pos:new V(),vel:new V(),yaw:0,pitch:0,crouchV:0,proneV:0,leanV:0,onGround:true,hp:100,maxHp:100,alive:true,opId:null,op:null,
  slots:{1:null,2:null},gn:0,un:0,cur:1,prev:2,nextFire:0,reloadT:0,switchT:0,recoil:{x:0,y:0},sprayN:0,lastShot:-9,ads:0,blind:0,stunT:0,wireT:0,meleeT:0,eyeY:1.6,vault:null,
  act:null,actT:0,dmgBy:{},rk:0,ctl:{mx:0,mz:0,sprint:false,crouch:false,prone:false,lean:0,fire:false,ads:false,use:false,jump:false,melee:false,slot:null,reload:false,det:false},
  stats:{k:0,d:0,a:0,score:0,plant:0,breach:0},brain:null,rig:null,drone:null,variant:id%3,lastHurt:-9});if(!human)this.brain=new Brain(this);}
 get eye(){return 1.62-this.crouchV*.5-this.proneV*1.22;}
 gun(){return this.cur===1||this.cur===2?this.slots[this.cur]:null;}
 cls(){const g=this.gun();if(g)return g.def.cls==='dmr'?'dmr':g.def.cls;return this.cur===3?(this.op.gad==='scan'?'tablet':'gadget'):'nade';}}
G.Agent=Agent;
const newGun=id=>({id,def:WPN[id],mag:WPN[id].mag,res:WPN[id].res});
function loadout(a,opId){a.opId=opId;a.op=OPS[opId];a.slots[1]=newGun(a.op.pri);a.slots[2]=newGun(a.op.sec);a.gn=a.op.gn;a.un=a.op.un;a.maxHp=ARM[a.op.arm].hp;a.hp=a.maxHp;a.cur=1;a.prev=2;
 if(a.rig)scene.remove(a.rig.root);a.rig=new Rig(side(a),a.op,a.variant);scene.add(a.rig.root);a.rig.setGun(a.cls());applyShadowMode();}
const fwd=a=>new V(-Math.sin(a.yaw),0,-Math.cos(a.yaw));
const viewDir=(a,out=new V())=>{const y=a.yaw+a.recoil.x*D2R,p=a.pitch+a.recoil.y*D2R;return out.set(-Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p));};
const eyePos=a=>{const r=new V(Math.cos(a.yaw),0,-Math.sin(a.yaw));return new V(a.pos.x+r.x*a.leanV*.36,a.pos.y+a.eye,a.pos.z+r.z*a.leanV*.36);};

function roster(attract){for(const a of G.agents)if(a.rig)scene.remove(a.rig.root);G.agents=[];const names=NAMES.slice().sort(()=>R()-.5);let id=0;let user=userName();
 for(let s=0;s<2;s++)for(let i=0;i<5;i++){const human=!attract&&s===0&&i===0;G.agents.push(new Agent(id++,human?(user?user.toUpperCase().slice(0,10):'YOU'):names.pop(),s,human));}G.player=G.agents.find(a=>a.human)||null;}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);try{localStorage.setItem('pxd_siege_opt',JSON.stringify(G.opt));}catch(e){}snd.init();snd.setVol(G.opt.vol);
 G.attract=false;G.diff=DIFF[G.opt.diff];G.startAtk=G.opt.side==='atk';G.score=[0,0];G.round=0;G.matchT=0;G.feedLog=[];G.history=[];G.stats={breaches:0};G.limit=G.len().limit;roster(false);hud.clearFeed();
 ['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.add('playing');snd.ambience('dusk',true);
 G.bans={atk:[],def:[]};if(G.opt.bans&&!o.skipPick){G.app='ban';hud.showBan();}else{if(G.opt.bans)cpuBans();toPick();}}
// with only four operators a side, each side loses one: the player's ban, or the enemy team's if the player passed
function cpuBans(){if(!G.bans.atk.length)G.bans.atk.push(ATK_OPS[R()*4|0]);if(!G.bans.def.length)G.bans.def.push(DEF_OPS[R()*4|0]);}
G.ban=(atkId,defId)=>{if(atkId)G.bans.atk=[atkId];if(defId)G.bans.def=[defId];cpuBans();hud.toast2('BANNED · '+[...G.bans.atk,...G.bans.def].map(k=>OPS[k].n).join(' · '));toPick();};
function toPick(){if(G.opt.skipPick||G.attract){autoPick();startRound();return;}G.app='pick';unlock();hud.show(false);hud.showPick();}
G.available=sd=>(sd==='atk'?ATK_OPS:DEF_OPS).filter(k=>!G.bans[sd].includes(k));
function autoPick(){for(const s of[0,1]){const sd=sideOfSquad(s);const pool=G.available(sd).slice().sort(()=>R()-.5);const team=G.agents.filter(a=>a.squad===s);const taken=[];
  const me=team.find(a=>a.human);if(me){let want=sd==='atk'?G.opt.atkOp:G.opt.defOp;if(!pool.includes(want))want=pool[0]||(sd==='atk'?'recruitA':'recruitD');taken.push(want);if(me.opId!==want||!me.rig||me.rig.side!==sd)loadout(me,want);else loadout(me,want);}
  for(const a of team){if(a.human)continue;const k=pool.find(p=>!taken.includes(p))||(sd==='atk'?'recruitA':'recruitD');if(k!=='recruitA'&&k!=='recruitD')taken.push(k);loadout(a,k);}}}
G.confirmPick=()=>{$('pick').hidden=true;$('ban').hidden=true;if(hud)hud.pickT=0;autoPick();startRound();};
function siteForRound(){if(G.player&&side(G.player)==='def'&&!G.attract){return SITES.find(s=>s.id===G.opt.site)||SITES[0];}return SITES[R()*SITES.length|0];}
function startRound(){G.app=G.attract?'menu':'match';hud.show(!G.attract);if(!G.attract)lock();
 L.resetRound();world.resetRound();fx.clear();GX.clear();GX.initCams();G.events.length=0;G.spotT={atk:{},def:{}};G.scanHits=[];G.rein=REIN_POOL;G.cap=0;G.capT=0;G.ot=false;
 G.site=siteForRound();G.siteKnown=false;G.phase='prep';G.timer=G.attract?4:G.len().prep;G.endT=0;G.winner=null;G.view='body';G.spec=null;G.camI=0;
 const bySide={atk:[],def:[]};for(const a of G.agents)bySide[side(a)].push(a);
 // attackers: spawn points (player's choice; CPU split between the player's spawn and another)
 const spK=Object.keys(SPAWNS);const mySpawn=G.player&&side(G.player)==='atk'&&!G.attract?G.opt.spawn:spK[R()*3|0];const other=spK.filter(k=>k!==mySpawn)[R()*2|0];
 bySide.atk.forEach((a,i)=>{const k=a.human||i<3?mySpawn:other;const sp=SPAWNS[k];const c=sp.pts[i%5];place(a,c[0]+(R()-.5)*.6,c[1]+(R()-.5)*.6,0);a.spawnK=k;a.spawnP=new V(a.pos.x,0,a.pos.z);a.yaw=Math.atan2(a.pos.x,a.pos.z);});
 const hs=G.site.holds.slice().sort(()=>R()-.5);bySide.def.forEach((a,i)=>{const h=hs[i%hs.length];place(a,h[0]+(i>=hs.length?.8:0),h[1],G.site.f*FH);a.yaw=Math.atan2(-(h[2]-h[0]),-(h[3]-h[1]));});
 for(const a of G.agents){Object.assign(a,{alive:true,hp:a.maxHp,blind:0,stunT:0,wireT:0,reloadT:0,switchT:0,act:null,actT:0,dmgBy:{},rk:0,vault:null,ads:0,sprayN:0,crouchV:0,proneV:0,leanV:0,pitch:0,drone:null,lastHurt:-9,killer:null});
  a.recoil.x=a.recoil.y=0;a.vel.set(0,0,0);a.slots[1]=newGun(a.op.pri);a.slots[2]=newGun(a.op.sec);a.gn=a.op.gn;a.un=a.op.un;a.cur=1;a.prev=2;a.rig.die=0;a.rig.root.rotation.x=0;a.rig.root.visible=true;a.rig.setGun(a.cls());if(a.brain)a.brain.reset();
  if(side(a)==='atk')GX.spawnDrone(a);}
 const atk=bySide.atk;const car=atk.filter(a=>!a.human)[R()*Math.max(1,atk.length-1)|0]||atk[0];G.defuser={state:'carried',carrier:car,pos:new V(),t:0,planter:null,mesh:G.defuser.mesh};if(G.defuser.mesh)G.defuser.mesh.visible=false;
 planRound(G,C);if(G.player){equipVM(G.player);if(side(G.player)==='atk'&&!G.attract)enterView('drone');}
 hud.roundStart();if(!G.attract)snd.roundStart();Rr.shadowMap.needsUpdate=true;}
function place(a,x,z,y){a.pos.set(x,y,z);a.pos.y=L.groundAt(x,z,y+.3);}
const alive=sd=>G.agents.filter(a=>a.alive&&side(a)===sd);
function endRound(win,reason){if(G.phase==='end')return;G.phase='end';G.endT=G.attract?3:END_T;G.winner=win;const ws=G.squadOf(win);G.score[ws]++;
 const why={elim:win==='atk'?'ALL DEFENDERS ELIMINATED':'ALL ATTACKERS ELIMINATED',defuse:'DEFUSER COMPLETED · SERVERS SECURED',disarm:'DEFUSER DISABLED',time:'TIME EXPIRED · OBJECTIVE HELD',cap:'AREA SECURED'}[reason];
 const team=G.agents.filter(a=>side(a)===win);let mvp=reason==='defuse'&&G.defuser.planter?G.defuser.planter:reason==='disarm'&&G.defuser.disarmer?G.defuser.disarmer:team.slice().sort((p,q)=>q.rk-p.rk||q.stats.score-p.stats.score)[0];
 if(mvp){mvp.stats.score+=50;mvp.stats.mvp=(mvp.stats.mvp||0)+1;}G.mvpLast=mvp;for(const a of team)a.stats.score+=reason==='elim'?20:40;
 G.history.push({win,reason,squad:ws});hud.banner(SIDE[win].n+' WIN',why+(mvp?' · MVP '+mvp.name:''),SIDE[win].css,4.5);if(!G.attract)snd.sting(G.player?side(G.player)===win:true);
 if(G.view!=='body'&&G.view!=='spec')exitView();G.round++;}
function afterRound(){const t=G.len().target;const max=t*2-1;const done=G.score[0]>=t||G.score[1]>=t||G.round>=max||G.matchT>=G.limit;if(done&&!G.attract){endMatch();return;}
 if(G.attract&&(G.score[0]>=t||G.score[1]>=t)){G.score=[0,0];G.round=0;}
 if(G.round%G.len().half===0&&!G.attract)hud.banner('SWITCHING SIDES',`ROUND ${G.round+1}`,'#ff4d00',2.6);toPick();}

/* ================= interactions (hold F) ================= */
function interactTarget(a){const sd=side(a),d=G.defuser;
 if(sd==='def'&&d.state==='planted'&&a.pos.distanceTo(d.pos)<1.8&&G.phase==='post')return{kind:'disarm',T:DISARM_T,label:'DISABLING DEFUSER'};
 if(sd==='atk'&&d.state==='carried'&&d.carrier===a&&G.phase==='action'&&G.opt.mode==='secure'&&inSite(a.pos))return{kind:'plant',T:PLANT_T,label:'PLANTING DEFUSER'};
 if(sd!=='def'||G.phase==='end')return null;
 const s=GX.aimSurface(a,1.7);
 if(s&&s.kind==='panel'){const pn=s.pn;if(pn.kind==='bar'&&!pn.rein){}else if(pn.full&&!pn.rein&&(pn.kind==='soft'||pn.kind==='ext')&&G.rein>0&&pn.intact()>.92)return{kind:'rein',pn,side:s.side,T:REIN_T,label:'REINFORCING WALL'};}
 // barricade: nearest inactive door/window bar in reach
 const e=eyePos(a),dv=viewDir(a);let best=null,bd=1.8;for(const op of L.openings){if(!op.bar||op.bar.active)continue;const ax=op.axis==='x';const cx=ax?(op.a+op.b)/2:op.c,cz=ax?op.c:(op.a+op.b)/2,cy=(op.y0+op.y1)/2;const dd=Math.hypot(cx-e.x,cz-e.z);if(dd>bd||Math.abs(cy-e.y)>1.6)continue;
  const to=new V(cx-e.x,cy-e.y,cz-e.z).normalize();if(to.dot(dv)<.55)continue;bd=dd;best=op;}
 if(best)return{kind:'bar',op:best,T:BAR_T,label:'BARRICADING'};
 const h=GX.hatchUnder(a);if(h&&!h.rein&&G.rein>0&&a.pitch<-.6)return{kind:'hrein',h,T:HREIN_T,label:'REINFORCING HATCH'};
 return null;}
G.interactTarget=interactTarget;
function finishAct(a,t){if(t.kind==='rein'){t.pn.rein=true;t.pn.rside=t.side;t.pn.ver++;G.rein--;snd.reinforce();a.stats.score+=10;}
 else if(t.kind==='hrein'){t.h.rein=true;G.rein--;snd.reinforce();world.syncHatches();a.stats.score+=10;}
 else if(t.kind==='bar'){t.op.bar.active=true;t.op.bar.cells.fill(1);t.op.bar.ver++;L.dirtyPanel(t.op.bar);snd.hammer();}
 else if(t.kind==='plant')plantDefuser(a);else if(t.kind==='disarm')disarm(a);}
function inSite(p){const s=G.site;const f=p.y>FH-.8?1:0;return f===s.f&&p.x>s.r[0]&&p.x<s.r[1]&&p.z>s.r[2]&&p.z<s.r[3];}
G.inSite=inSite;
function plantDefuser(a){const d=G.defuser;d.state='planted';d.planter=a;d.pos.copy(a.pos);d.t=DEFUSE_RUN;G.phase='post';a.stats.score+=60;a.stats.plant++;G.siteKnown=true;
 if(!d.mesh){d.mesh=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.42,.3,.3),new THREE.MeshStandardMaterial({color:0x2a2e34,roughness:.5,metalness:.5}));b.position.y=.15;const s=new THREE.Mesh(new THREE.BoxGeometry(.3,.12,.02),new THREE.MeshBasicMaterial({color:0xff4d00}));s.position.set(0,.2,.16);
  const ant=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.5,6),new THREE.MeshStandardMaterial({color:0x111111}));ant.position.set(.14,.5,0);d.light=new THREE.PointLight(0xff4d00,3,4,2);d.light.position.y=.5;d.mesh.add(b,s,ant,d.light);scene.add(d.mesh);}
 d.mesh.position.copy(d.pos);d.mesh.visible=true;hud.banner('DEFUSER PLANTED',G.site.n+' · '+DEFUSE_RUN+' SECONDS',SIDE.atk.css,2.6);snd.planted();G.events.push({t:G.time,x:d.pos.x,y:d.pos.y,z:d.pos.z,kind:'plant',side:'atk'});}
function disarm(a){G.defuser.disarmer=a;a.stats.score+=60;snd.defused();G.defuser.state='disarmed';if(G.defuser.mesh)G.defuser.mesh.visible=false;endRound('def','disarm');}

/* ================= movement ================= */
function moveAgent(a,dt){const c=a.ctl;const busy=!!a.act||!!a.vault;
 if(a.vault){a.vault.t+=dt/.55;const k=Math.min(1,a.vault.t);a.pos.lerpVectors(a.vault.a,a.vault.b,k);a.pos.y+=Math.sin(k*Math.PI)*.5;a.crouchV=.8;if(k>=1){a.vault=null;a.pos.y=L.groundAt(a.pos.x,a.pos.z,a.pos.y+.3);}return;}
 const prone=c.prone&&!busy;a.proneV+=((prone?1:0)-a.proneV)*Math.min(1,dt*4);a.crouchV+=((c.crouch&&!prone?1:0)-a.crouchV)*Math.min(1,dt*9);
 const lean=c.sprint||a.proneV>.5?0:c.lean;a.leanV+=(lean-a.leanV)*Math.min(1,dt*10);
 const g=a.gun();let spd=3.8*ARM[a.op.arm].spd*(g?g.def.spd:1);const fwdIn=c.sprintOk;if(c.sprint&&fwdIn&&a.crouchV<.4&&a.proneV<.3)spd*=1.48;spd*=1-a.crouchV*.45;spd*=1-a.proneV*.74;if(a.ads>.5)spd*=.65;
 if(a.wireT>0){spd*=.28;a.wireT-=dt;}if(a.stunT>0)spd*=.5;if(busy)spd=0;if(a.scanning)spd*=.6;
 let wx=c.mx,wz=c.mz;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}const tx=wx*spd,tz=wz*spd;
 if(a.onGround){const k=Math.min(1,dt*(wl>.01?10:14));a.vel.x+=(tx-a.vel.x)*k;a.vel.z+=(tz-a.vel.z)*k;}else{a.vel.x+=(tx-a.vel.x)*Math.min(1,dt*1.2);a.vel.z+=(tz-a.vel.z)*Math.min(1,dt*1.2);}
 a.vel.y-=GRAV*dt;const p=a.pos,h=1.8-a.crouchV*.6-a.proneV*1.15;const ox=p.x,oz=p.z;
 p.x+=a.vel.x*dt;if(L.groundAt(p.x,p.z,p.y)>p.y+STEP){p.x=ox;a.vel.x=0;}p.z+=a.vel.z*dt;if(L.groundAt(p.x,p.z,p.y)>p.y+STEP){p.z=oz;a.vel.z=0;}
 // attackers stay near spawn during prep
 if(G.phase==='prep'&&side(a)==='atk'&&a.spawnP){const dx=p.x-a.spawnP.x,dz=p.z-a.spawnP.z,dd=Math.hypot(dx,dz);if(dd>6){p.x=a.spawnP.x+dx/dd*6;p.z=a.spawnP.z+dz/dd*6;}}
 L.collide(p,.3,h);
 p.y+=a.vel.y*dt;const gr=L.groundAt(p.x,p.z,p.y+(a.onGround?STEP:0)-.001);
 if(p.y<=gr+.001){const fall=-a.vel.y;if(!a.onGround&&fall>7){if(a===G.player)snd.land(Math.min(1,(fall-6)/6));if(fall>10.5)damage(a,null,(fall-10.5)*14,'legs',{id:'fall'});}p.y=gr;a.vel.y=0;a.onGround=true;}
 else if(a.onGround&&p.y-gr<STEP+.02&&a.vel.y<=0){p.y=gr;a.vel.y=0;}else a.onGround=false;
 const ce=L.ceilAt(p.x,p.z,p.y);if(p.y+h>ce){p.y=Math.max(gr,ce-h);a.vel.y=Math.min(0,a.vel.y);}
 if(p.y<-3)p.y=0;
 // footsteps
 const hs=Math.hypot(a.vel.x,a.vel.z);if(a.onGround&&hs>2.4&&a.crouchV<.5&&a.proneV<.5){a.stepAcc=(a.stepAcc||0)+hs*dt;if(a.stepAcc>(c.sprint?2.2:1.9)){a.stepAcc=0;G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'step',side:side(a),loud:c.sprint});
   const surf=L.inFoot(p.x,p.z)?'wood':'stone';if(a===G.player)snd.step(.45,0,surf);else{const[d,pan]=spatial(p);if(d<26)snd.step(snd.att(d,5)*(c.sprint?1.2:.7),pan,surf);}}}}
function separate(){const A=G.agents;for(let i=0;i<A.length;i++){const a=A[i];if(!a.alive)continue;for(let j=i+1;j<A.length;j++){const b=A[j];if(!b.alive)continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d2=dx*dx+dz*dz;if(d2>.45||d2<1e-6||Math.abs(a.pos.y-b.pos.y)>1.4)continue;const d=Math.sqrt(d2),push=(.67-d)*.5;a.pos.x-=dx/d*push;a.pos.z-=dz/d*push;b.pos.x+=dx/d*push;b.pos.z+=dz/d*push;}}}
// window vault: Space near an open (un-barricaded) window
function tryVault(a){for(const op of L.openings){if(op.kind!=='w')continue;const ax=op.axis==='x';const u=ax?a.pos.x:a.pos.z,v=ax?a.pos.z:a.pos.x;if(u<op.a+.15||u>op.b-.15||Math.abs(v-op.c)>1)continue;if(Math.abs(a.pos.y-(op.y0-1))>.5)continue;
  if(op.bar.active&&op.bar.intact()>.35)continue;if(op.panel.at(Math.floor((u-op.panel.u0)/CELL),Math.floor((op.y0+.3-op.panel.y0)/CELL))){/* still glass frame: ok */}
  const s=Math.sign(v-op.c)||1;const target=ax?new V(u,a.pos.y,op.c-s*.75):new V(op.c-s*.75,a.pos.y,u);target.y=L.groundAt(target.x,target.z,a.pos.y+.5);if(Math.abs(target.y-a.pos.y)>1.2)continue;
  if(!L.free(target.x,target.z,target.y,.28))continue;a.vault={a:a.pos.clone(),b:target,t:0};breakGlass(op,new V(target.x,op.y0+.6,target.z));if(a===G.player)snd.vault();return true;}return false;}
function breakGlass(op,p){const g=world.breakGlass(op);if(!g)return;const c=g.mesh.position;fx.sparks.burst(c,24,3,[new THREE.Color(1.2,1.3,1.5)],.04,.6,{grav:9,floor:L.groundAt(c.x,c.z,c.y),jx:1,jy:1});const[d,pan]=spatial(c);snd.glass(d,pan);}

/* ================= weapons ================= */
function equipTime(a){const c=a.cls();return c==='dmr'?.8:c==='rifle'?.65:c==='shotgun'||c==='smg'?.55:.45;}
function switchTo(a,slot,force){if(slot===3&&a.gn<=0&&a.op.gad!=='scan')return;if(slot===4&&a.un<=0)return;if(slot===a.cur&&!force)return;if(a.cur!==slot&&a.cur<=2)a.prev=a.cur;a.cur=slot;a.reloadT=0;a.ads=0;a.switchT=equipTime(a);a.rig.setGun(a.cls());if(a===G.player){equipVM(a);snd.reload('draw');}}
G.switchTo=switchTo;
function equipVM(a){if(!VM)return;const g=a.gun();let id;if(g)id=g.def.cls;else if(a.cur===3){const k=a.op.gad;id=k==='charge'?(GX.list.some(o=>o.alive&&o.owner===a&&o.type==='charge')&&a.gn<=0?'detonator':'charge'):k==='scan'?'scanner':k==='emp'?'emp':k;}else id=a.op.util;VM.set(id,side(a));}
function startReload(a){const g=a.gun();if(!g||g.mag>=g.def.mag||g.res<=0||a.reloadT>0||a.switchT>0)return;a.ads=0;a.reloadT=g.def.rel;if(a===G.player){VM.reload(g.def.rel,g.def.shell);snd.reload(g.def.shell?'shell':'out');}a.rig.poseArms(1);}
function finishReload(a){const g=a.gun();if(!g)return;if(g.def.shell){g.mag++;g.res--;if(a===G.player)snd.reload('shell');if(g.mag<g.def.mag&&g.res>0){a.reloadT=g.def.rel;if(a===G.player)VM.reload(g.def.rel,true);}else if(a===G.player)snd.reload('pump');return;}
 const take=Math.min(g.def.mag-g.mag,g.res);g.mag+=take;g.res-=take;if(a===G.player)snd.reload('in');}
function spreadOf(a,g){const d=g.def,sp=d.sp;const spd=Math.hypot(a.vel.x,a.vel.z);let s=a.ads>.6?sp.ads:sp.hip;s+=sp.mv*Math.min(1,spd/3.5)*(a.ads>.6?.5:1);if(!a.onGround)s+=sp.air;s*=1-a.crouchV*.18-a.proneV*.35;if(d.auto)s+=Math.min(.03,a.sprayN*.0018);if(a.blind>0)s+=.03;return s;}
G.spreadOf=a=>{const g=a.gun();return g?spreadOf(a,g):0;};
const tv=new V(),tv2=new V();
function fire(a){const g=a.gun();if(!g||a.reloadT>0||a.switchT>0||G.time<a.nextFire||a.vault||a.act)return false;if(a.ctl.sprint&&a.ctl.sprintOk&&a.human)return false;const d=g.def;
 if(g.mag<=0){a.nextFire=G.time+.25;if(a===G.player)snd.dry();if(g.res>0)startReload(a);return false;}
 g.mag--;a.nextFire=G.time+d.rate;if(G.time-a.lastShot>d.rate*2.2+.2)a.sprayN=0;const inacc=spreadOf(a,g);const eye=eyePos(a);const dir=viewDir(a,tv2.set(0,0,0));
 const up=Math.abs(dir.y)>.95?new V(1,0,0):new V(0,1,0);const rt=new V().crossVectors(dir,up).normalize(),u2=new V().crossVectors(rt,dir).normalize();
 for(let i=0;i<(d.pellets||1);i++){const r=inacc*Math.sqrt(R()),th=R()*Math.PI*2;const dd=dir.clone().addScaledVector(rt,Math.cos(th)*r).addScaledVector(u2,Math.sin(th)*r).normalize();trace(a,eye,dd,d,i===0);}
 const k=(a.ads>.6?.78:1)*(1-a.crouchV*.15-a.proneV*.35);a.recoil.y+=d.rec.v*k*(a.human?1:.6);a.recoil.x+=(R()-.5)*2*d.rec.h*k;a.sprayN++;a.lastShot=G.time;
 const mz=muzzlePos(a);fx.muzzle(mz,dir,d.cls==='shotgun'?1.6:d.cls==='dmr'?1.3:1);a.rig.flinch=.25;
 if(a===G.player){VM.fire(d.cls==='shotgun'?2.2:d.cls==='dmr'?1.8:d.cls==='pistol'?1.2:1);vmFlash.intensity=4;snd.shot(d.snd,0,0,true);shake=Math.max(shake,d.cls==='shotgun'?.22:.05);}
 else{const[dist,pan]=spatial(mz);snd.shot(d.snd,dist,pan,false);}
 G.events.push({t:G.time,x:a.pos.x,y:a.pos.y,z:a.pos.z,kind:'shot',side:side(a)});spot(a,enemyOf(side(a)),.6);return true;}
function muzzlePos(a){if(a===G.player&&G.view==='body'){const f=viewDir(a,new V());return eyePos(a).add(new V(0,-.1,0)).addScaledVector(f,.6).add(new V(Math.cos(a.yaw)*.1,0,-Math.sin(a.yaw)*.1));}a.rig.root.updateMatrixWorld(true);return a.rig.muzzle.getWorldPosition(new V());}
// hitscan with destruction + penetration
function trace(a,o,dir,d,tracer){let power=d.pen,dmg=d.dmg,dist=0,ox=o.x,oy=o.y,oz=o.z;const skip=new Set();const sd=side(a);let endP=null;const T=GX.targets(sd);
 for(let pass=0;pass<5;pass++){const maxT=160-dist;const h=L.ray(ox,oy,oz,dir.x,dir.y,dir.z,maxT,skip);const tw=h?h.t:maxT;
  // glass on the way
  for(const gl of world.glass){if(gl.broken)continue;const op=gl.op,ax=op.axis==='x';const dn=ax?dir.z:dir.x;if(Math.abs(dn)<1e-6)continue;const t=(op.c-(ax?oz:ox))/dn;if(t<=0||t>tw)continue;const u=ax?ox+dir.x*t:oz+dir.z*t,y=oy+dir.y*t;if(u>op.a&&u<op.b&&y>op.y0&&y<op.y1)breakGlass(op,new V(ox+dir.x*t,y,oz+dir.z*t));}
  let hitA=null,hp=null;for(const e of G.agents){if(!e.alive||e===a||side(e)===sd)continue;const r=hitActor(e,ox,oy,oz,dir.x,dir.y,dir.z,tw);if(r&&(!hp||r.t<hp.t)){hp=r;hitA=e;}}
  let hitT=null,tt=hp?hp.t:tw;for(const t of T){const ex=t.p.x-ox,ey=t.p.y-oy,ez=t.p.z-oz,b=ex*dir.x+ey*dir.y+ez*dir.z,c=ex*ex+ey*ey+ez*ez-t.r*t.r,disc=b*b-c;if(disc<0)continue;const t0=b-Math.sqrt(disc);if(t0>0&&t0<tt){tt=t0;hitT=t;}}
  if(hitT){const p=new V(ox+dir.x*tt,oy+dir.y*tt,oz+dir.z*tt);GX.hitTarget(hitT,a);fx.sparks.burst(p,6,3,[new THREE.Color(2.4,1.8,1)],.04,.2,{grav:6});if(tracer)traceFx(a,p);if(a===G.player)hud.hitmark('body',false);return;}
  if(hitA){const total=dist+hp.t;const f=d.fall,fk=total<f[0]?1:total>f[1]?f[2]:1-(1-f[2])*(total-f[0])/(f[1]-f[0]);const p=new V(ox+dir.x*hp.t,oy+dir.y*hp.t,oz+dir.z*hp.t);fx.blood(p,dir);
   const mult=hp.part==='legs'?.75:1;damage(hitA,a,hp.part==='head'?999:dmg*fk*mult,hp.part,d,{wb:pass>0,dir:dir.clone()});if(tracer)traceFx(a,p);return;}
  if(!h){endP=new V(ox+dir.x*maxT,oy+dir.y*maxT,oz+dir.z*maxT);break;}
  const p=new V(ox+dir.x*tw,oy+dir.y*tw,oz+dir.z*tw);const nrm=new V(h.nx,h.ny,h.nz);const mat=h.mat;fx.impact(p,nrm,SND[mat]||'stone',d.pellets?.6:1,h.type==='panel'?h.obj:null);if(!endP)endP=p;
  if(pass===0)G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'impact',side:sd});
  // destruction
  if(h.type==='panel'&&!h.obj.rein){const pn=h.obj,u=pn.axis==='x'?p.x:p.z;if(d.brk&&dist+tw<11)GX.breakPanel(pn,u,p.y,pn.kind==='bar'?.24:.15,{jag:.5,force:.6});else if((pn.kind==='bar'&&R()<.5)||(pn.kind==='soft'&&R()<.14)||(pn.kind==='ext'&&R()<.06))GX.breakPanel(pn,u,p.y,.1,{jag:.2,force:.3});}
  if(h.type==='hatch'&&!h.obj.rein){h.obj.hp-=d.brk?.5:.12;if(h.obj.hp<=0)GX.breakHatch(h.obj,{});}
  const cost=PEN[mat]??1e9;if(cost>power||h.type==='ground'||h.type==='roof'||h.type==='slab')break;power-=cost;dmg*=Math.max(.3,1-cost*.75);
  const ex=Math.max(tw+.02,h.exit||tw+.2);if(h.type==='box'||h.type==='dyn')skip.add(h.obj);if(h.type==='panel')skip.add(h.obj);if(h.type==='hatch')skip.add(h.obj);
  dist+=ex;ox+=dir.x*(ex+.01);oy+=dir.y*(ex+.01);oz+=dir.z*(ex+.01);endP=null;}
 if(tracer&&endP)traceFx(a,endP);}
function traceFx(a,p){const m=muzzlePos(a);if(a!==G.player||R()<.3)fx.tracers.fire(m,p);}
function melee(a){if(G.time<a.meleeT)return;a.meleeT=G.time+.75;if(a===G.player){VM.melee();snd.kick();}a.rig.flinch=.6;const e=eyePos(a),dir=viewDir(a,new V());const sd=side(a);
 for(const v of G.agents){if(!v.alive||v===a||side(v)===sd)continue;const h=hitActor(v,e.x,e.y,e.z,dir.x,dir.y,dir.z,1.8);if(h){const back=fwd(v).dot(fwd(a))>.5;damage(v,a,back?140:65,'chest',{id:'melee'},{dir});return;}}
 const h=L.ray(e.x,e.y,e.z,dir.x,dir.y,dir.z,dir.y<-.6?2.05:1.8);if(!h)return;const p=new V(e.x+dir.x*h.t,e.y+dir.y*h.t,e.z+dir.z*h.t);
 if(h.type==='panel'&&!h.obj.rein){const pn=h.obj;GX.breakPanel(pn,pn.axis==='x'?p.x:p.z,p.y,pn.kind==='bar'?.55:pn.kind==='ext'?.24:.34,{jag:.4,force:1.2});}
 else if(h.type==='hatch'&&!h.obj.rein){h.obj.hp-=1.05;fx.impact(p,new V(0,1,0),'wood',1.2);if(h.obj.hp<=0)GX.breakHatch(h.obj,{});}
 else fx.impact(p,new V(h.nx,h.ny,h.nz),SND[h.mat]||'stone',.8);
 for(const gl of world.glass)if(!gl.broken&&gl.mesh.position.distanceTo(p)<.9)breakGlass(gl.op,p);G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'melee',side:sd});}
G.melee=melee;

/* ================= damage ================= */
function damage(v,a,amount,part,d,o={}){if(!v.alive||G.phase==='prep'&&a&&a!==v)return;const real=Math.min(v.hp,amount);v.hp-=amount;v.lastHurt=G.time;v.rig.flinch=1;
 if(v.brain&&a){v.brain.heard(a.pos,G.time,true);}if(a&&a!==v){a.stats.dmg=(a.stats.dmg||0)+real;v.dmgBy[a.id]=(v.dmgBy[a.id]||0)+real;}
 if(v===G.player){const src=a?a.pos:o.from;if(src){hud.hurt(Math.atan2(src.x-v.pos.x,src.z-v.pos.z),v.yaw,real);}snd.hurt(Math.min(1,real/40));v.punch=(v.punch||0)+Math.min(3,real*.06);}
 if(a===G.player&&v!==G.player){hud.hitmark(part==='head'?'hs':'body',v.hp<=0);snd.hit(part==='head'?'hs':'body');}
 if(v.hp<=0)kill(v,a,d&&d.n?d.n:(d&&d.id)||'',part==='head',!!o.wb,o.dir);}
function kill(v,a,wn,hs,wb,dir){v.alive=false;v.hp=0;v.stats.d++;v.act=null;v.killer=a;v.rig.dieDir=dir?(fwd(v).dot(dir)>0?-1:1):1;
 if(a&&a!==v&&side(a)!==side(v)){a.stats.k++;a.rk++;a.stats.score+=100+(hs?25:0);if(hs)a.stats.hs=(a.stats.hs||0)+1;if(a===G.player)snd.hit('kill');}
 for(const id in v.dmgBy){const as=G.agents[id];if(as&&as!==a&&v.dmgBy[id]>=30&&side(as)!==side(v)){as.stats.a++;as.stats.score+=40;}}
 if(G.defuser.state==='carried'&&G.defuser.carrier===v){G.defuser.state='dropped';G.defuser.carrier=null;G.defuser.pos.copy(v.pos);}
 const nm={trap:'SHOCK TRAP',frag:'FRAG',impact:'IMPACT',charge:'BREACH CHARGE',melee:'MELEE',fall:'FALL'}[wn]||wn||'WORLD';
 const ent={k:a&&a!==v?a.name:'',ks:a?side(a):null,v:v.name,vs:side(v),w:nm,hs,wb,me:(a===G.player||v===G.player),at:L.callout(v.pos.x,v.pos.z,v.pos.y),from:a?L.callout(a.pos.x,a.pos.z,a.pos.y):'',dist:a?Math.round(a.pos.distanceTo(v.pos)):0};hud.feed(ent);G.feedLog.push(ent);
 if(a)for(const t of G.agents)if(t.alive&&t.brain&&side(t)===side(v)&&t.pos.distanceTo(v.pos)<20)t.brain.heard(a.pos,G.time,true);
 if(v===G.player){if(G.view!=='body')exitView();G.spec=null;specNext(1);hud.died(a,nm,hs);VM.root.visible=false;}}

/* ================= spotting ================= */
function spot(e,bySide,dur=3){if(!e||!e.alive)return;const t=G.spotT[bySide];t[e.id]=Math.max(t[e.id]||0,G.time+dur);}
G.spotted=(e,bySide)=>(G.spotT[bySide][e.id]||0)>G.time;G.spot=spot;
// manual ping from eye along dir: mark enemy near the crosshair
function ping(a,eye,dir,bySide){let best=null,bd=.12;for(const e of G.agents){if(!e.alive||side(e)===bySide)continue;const c=new V(e.pos.x,e.pos.y+(e.proneV>.5?.3:1.2),e.pos.z);const to=c.clone().sub(eye);const dd=to.length();if(dd>32)continue;to.divideScalar(dd);const ang=Math.acos(cl(to.dot(dir),-1,1));if(ang>bd)continue;if(!L.los(eye.x,eye.y,eye.z,c.x,c.y,c.z))continue;bd=ang;best=e;}
 if(best){spot(best,bySide,5);if(a===G.player||G.player&&side(G.player)===bySide){snd.ping();hud.toast(best.name+' SPOTTED · '+L.callout(best.pos.x,best.pos.z,best.pos.y));}a.stats.score+=10;return best;}return null;}
G.ping=ping;

/* ================= views: body / drone / cams / spectate ================= */
function enterView(v){const P=G.player;if(!P)return;if(v==='drone'){if(side(P)!=='atk'||!P.drone||!P.drone.alive){hud.toast('NO DRONE');return;}G.view='drone';}
 else if(v==='cam'){if(side(P)!=='def'||!GX.cams.some(c=>c.alive)){hud.toast('NO CAMERAS LEFT');return;}G.view='cam';if(!GX.cams[G.camI]||!GX.cams[G.camI].alive)camNext(1);}
 VM.root.visible=false;snd.drone(0);}
function exitView(){G.view=G.player&&G.player.alive?'body':'spec';snd.drone(0);if(G.player&&G.player.alive)equipVM(G.player);}
function camNext(dir){const n=GX.cams.length;for(let i=1;i<=n;i++){const k=(G.camI+dir*i+n*4)%n;if(GX.cams[k].alive){G.camI=k;return;}}exitView();}
function specNext(dir){const me=G.player;const pool=G.agents.filter(a=>a.alive&&a!==me&&(!me||side(a)===side(me)));const all=pool.length?pool:G.agents.filter(a=>a.alive&&a!==me);if(!all.length){G.spec=null;return;}let i=all.indexOf(G.spec);i=(i+dir+all.length)%all.length;G.spec=all[i];}

/* ================= per-agent update ================= */
function updateAgent(a,dt){const c=a.ctl;a.blind=Math.max(0,a.blind-dt);a.stunT=Math.max(0,a.stunT-dt);
 if(a.switchT>0)a.switchT-=dt;if(a.reloadT>0){a.reloadT-=dt;if(a.reloadT<=0){a.reloadT=0;finishReload(a);}}
 const g=a.gun();if(g&&G.time-a.lastShot>g.def.rate*1.4){a.sprayN=Math.max(0,a.sprayN-dt*10);const k=Math.exp(-dt*(a.human?6:9));a.recoil.x*=k;a.recoil.y*=k;}
 a.ads+=((c.ads&&g&&a.reloadT<=0&&a.switchT<=0&&!(c.sprint&&c.sprintOk)?1:0)-a.ads)*Math.min(1,dt*12);
 if(G.phase==='end'||a.vault)return;
 if(c.slot&&c.slot!==a.cur)switchTo(a,c.slot);if(c.reload)startReload(a);if(c.melee){melee(a);c.melee=false;}
 if(c.det){if(GX.detonate(a))switchTo(a,a.prev||1,true);c.det=false;}
 if(c.jump&&a.onGround&&!a.act){if(!tryVault(a)&&a.proneV<.3){a.vel.y=3.3;a.onGround=false;}c.jump=false;}
 // fire / use gadget / throw
 a.scanning=false;
 if(c.fire){if(a.cur<=2)fire(a);else if(a.cur===3&&a.switchT<=0){if(a.op.gad==='scan'){a.scanning=true;}else if(!c.fireLock){c.fireLock=true;if(GX.deploy(a,c.gadOpt||{})){if(a.gn<=0&&a.op.gad!=='charge')switchTo(a,a.prev||1,true);else equipVM(a);}}}
  else if(a.cur===4&&a.switchT<=0&&!c.fireLock&&a.un>0){c.fireLock=true;GX.throwNade(a,a.op.util,c.throwTarget,false);a.un--;c.throwTarget=null;setTimeout(()=>{if(a.cur===4)switchTo(a,a.un>0?4:a.prev||1,true);},380);}}
 else c.fireLock=false;
 // scanner
 if(a.scanning){a.scanT=(a.scanT||0)-dt;if(a.scanT<=0){a.scanT=1.1;const hits=[];const e=eyePos(a),dv=viewDir(a);for(const v of G.agents){if(!v.alive||side(v)===side(a))continue;const to=new V(v.pos.x-e.x,v.pos.y+1-e.y,v.pos.z-e.z);const dd=to.length();if(dd>15)continue;to.divideScalar(dd);if(to.dot(dv)<.55)continue;hits.push(v);spot(v,side(a),2.6);}
   if(a===G.player){G.scanHits=hits.map(v=>({v,t:G.time}));snd.scan();}}}
 // hold-F interactions
 const it=c.use&&a.onGround&&!a.vault?interactTarget(a):null;
 if(it){if(!a.act||a.act.kind!==it.kind||a.act.obj!==(it.pn||it.op||it.h)){a.act={kind:it.kind,obj:it.pn||it.op||it.h,T:it.T,label:it.label,t:0,tgt:it};}a.act.t+=dt;if(a===G.player&&it.kind==='bar'&&(a.act.t%.3)<dt)snd.hammer();if(a.act.t>=a.act.T){finishAct(a,a.act.tgt);a.act=null;c.use=a.human?c.use:false;if(a.human)a.useLock=true;}}
 else a.act=null;
 // defuser pickup
 const d=G.defuser;if(d.state==='dropped'&&side(a)==='atk'&&a.pos.distanceTo(d.pos)<1.2){d.state='carried';d.carrier=a;if(a===G.player)hud.toast('YOU PICKED UP THE DEFUSER');}}

/* ================= player input ================= */
const keys={},mouse={l:false,r:false,dx:0,dy:0};let locked=false;
function lock(){if(G.app!=='match')return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='match')pause(true);});
canvas.addEventListener('mousedown',()=>{if(G.app==='match'&&!locked)lock();});
addEventListener('mousedown',e=>{if(G.app!=='match'||!locked)return;if(e.button===0)mouse.l=true;if(e.button===2)mouse.r=true;const P=G.player;if(!P)return;
 if(G.view==='drone'&&e.button===0){const d=P.drone;if(d&&d.alive&&!d.jammed){const yaw=d.yaw,p=d.pitch;ping(P,GX.droneEye(d),new V(-Math.sin(yaw)*Math.cos(p),Math.sin(p),-Math.cos(yaw)*Math.cos(p)),'atk');}}
 else if(G.view==='cam'){const c=GX.cams[G.camI];if(e.button===0&&c&&c.dis<=0)ping(P,c.pos,new V(-Math.sin(c.yaw)*Math.cos(c.pitch),Math.sin(c.pitch),-Math.cos(c.yaw)*Math.cos(c.pitch)),'def');if(e.button===2)camNext(1);}
 else if(!P.alive)specNext(e.button===0?1:-1);});
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(!locked)return;mouse.dx+=e.movementX;mouse.dy+=e.movementY;});
addEventListener('wheel',e=>{if(G.app!=='match'||!locked||!G.player||!G.player.alive||G.view!=='body')return;const P=G.player;const order=[1,2,3,4].filter(s=>s<=2||s===3&&(P.gn>0||P.op.gad==='scan'||GX.list.some(o=>o.alive&&o.owner===P&&o.type==='charge'))||s===4&&P.un>0);let i=order.indexOf(P.cur);i=(i+(e.deltaY>0?1:-1)+order.length)%order.length;switchTo(P,order[i]);},{passive:true});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];keys[e.code]=true;if(['Space','Tab','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='match'){if(G.view==='drone'||G.view==='cam'){exitView();return;}pause(true);}else if(G.app==='paused')pause(false);return;}
 if(G.app==='pick'&&e.code==='Enter'){G.confirmPick();return;}
 if(G.app!=='match'||!first)return;const P=G.player;if(!P)return;
 if(e.code==='Tab')hud.board(true);
 if(e.code==='Digit5'||e.code==='KeyB'){if(G.view==='drone'||G.view==='cam')exitView();else enterView(side(P)==='atk'?'drone':'cam');return;}
 if(G.view==='cam'){if(e.code==='KeyA'||e.code==='ArrowLeft')camNext(-1);if(e.code==='KeyD'||e.code==='ArrowRight')camNext(1);return;}
 if(G.view==='drone')return;
 if(!P.alive){if(e.code==='Space')specNext(1);return;}
 if(e.code.startsWith('Digit')){const n=+e.code.slice(5);if(n>=1&&n<=4)switchTo(P,n);}
 if(e.code==='KeyR')startReload(P);if(e.code==='KeyV')P.ctl.melee=true;if(e.code==='KeyX')P.ctl.det=true;if(e.code==='Space')P.ctl.jump=true;
 if(e.code==='KeyC'){P.ctl.crouchT=!P.ctl.crouchT;P.ctl.proneT=false;}if(e.code==='KeyZ'){P.ctl.proneT=!P.ctl.proneT;P.ctl.crouchT=false;}
 if(e.code==='KeyT'){G.opt.torch=G.opt.torch?0:1;snd.reload('draw');}if(e.code==='KeyF')P.useLock=false;});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='Tab')hud.board(false);if(e.code==='KeyF'&&G.player)G.player.useLock=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
function readPlayer(dt){const P=G.player,c=P.ctl;const sens=.0021*G.opt.sens*(P.ads>.5?(P.gun()&&P.gun().def.scope?.42:.7):1);
 const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);
 if(G.view==='drone'){const d=P.drone;c.mx=c.mz=0;c.fire=false;c.use=false;if(d&&d.alive){if(locked){d.yaw-=mouse.dx*sens;d.pitch=cl(d.pitch-mouse.dy*sens,-.9,.7);}d.ctl.mx=s;d.ctl.mz=f;d.ctl.jump=!!keys.Space;d.ctl.world=false;if(G.forceCtl&&G.forceCtl.drone)Object.assign(d.ctl,G.forceCtl.drone);snd.drone(Math.min(1,(d.speed||0)/4));}else exitView();mouse.dx=mouse.dy=0;return;}
 if(G.view==='cam'){const cm=GX.cams[G.camI];c.mx=c.mz=0;c.fire=false;c.use=false;if(cm&&locked){cm.yaw=cl(cm.yaw-mouse.dx*sens*.7,cm.yaw0-1.1,cm.yaw0+1.1);cm.pitch=cl(cm.pitch-mouse.dy*sens*.7,cm.pitch0-.6,cm.pitch0+.5);}mouse.dx=mouse.dy=0;return;}
 if(P.drone&&P.drone.alive){P.drone.ctl.mx=P.drone.ctl.mz=0;P.drone.ctl.jump=false;}
 if(locked&&P.alive){P.yaw-=mouse.dx*sens;P.pitch=cl(P.pitch-mouse.dy*sens,-1.5,1.5);}VM&&(VM.mdx=mouse.dx,VM.mdy=mouse.dy);
 const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);c.mx=-sy*f+cy*s;c.mz=-cy*f-sy*s;c.sprint=!!(keys.ShiftLeft||keys.ShiftRight);c.sprintOk=f>0;
 c.crouch=!!(keys.ControlLeft||keys.ControlRight)||!!c.crouchT;c.prone=!!c.proneT;c.lean=(keys.KeyE?1:0)-(keys.KeyQ?1:0);c.use=!!keys.KeyF&&!P.useLock;c.ads=mouse.r&&locked;c.fire=mouse.l&&locked;
 const g=P.gun();if(g&&g.def.semi&&c.fire){if(mouse.semi)c.fire=false;else mouse.semi=true;}if(!mouse.l)mouse.semi=false;c.slot=null;c.reload=false;
 const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.18?v:0;const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);
  if(lx||ly){c.mx=-sy*(-ly)+cy*lx;c.mz=-cy*(-ly)-sy*lx;c.sprintOk=ly<-.5;}P.yaw-=rx*dt*2.6*G.opt.sens;P.pitch=cl(P.pitch-ry*dt*2,-1.5,1.5);if(bt[7]&&bt[7].value>.4)c.fire=true;if(bt[6]&&bt[6].value>.4)c.ads=true;if(bt[0]&&bt[0].pressed)c.jump=true;if(bt[1]&&bt[1].pressed)c.crouch=true;if(bt[2]&&bt[2].pressed)c.use=true;if(bt[10]&&bt[10].pressed)c.sprint=true;
  const pr=G.padPrev||{};if(bt[3]&&bt[3].pressed&&!pr.y)switchTo(P,P.cur===1?2:1);if(bt[4]&&bt[4].pressed&&!pr.lb)c.lean=-1;if(bt[5]&&bt[5].pressed)c.lean=1;if(bt[11]&&bt[11].pressed&&!pr.rs)c.melee=true;if(bt[9]&&bt[9].pressed&&!pr.st)pause(true);
  G.padPrev={y:bt[3]&&bt[3].pressed,lb:bt[4]&&bt[4].pressed,rs:bt[11]&&bt[11].pressed,st:bt[9]&&bt[9].pressed};}
 if(G.forceCtl)Object.assign(c,G.forceCtl);
 mouse.dx=mouse.dy=0;}
function pause(on){if(on&&G.app==='match'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlock();}else if(!on&&G.app==='paused'){G.app='match';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= simulation step ================= */
let acc=0,teamT=0,shake=0,camSpotT=0;
function shakeAt(p,r,s){const d=cam.position.distanceTo(p);if(d<r)shake=Math.max(shake,s*(1-d/r));}
function spatial(p){const c=cam.position;const dx=p.x-c.x,dy=p.y-c.y,dz=p.z-c.z;const d=Math.hypot(dx,dy,dz)||1;const rx=Math.cos(cam.rotation.y),rz=-Math.sin(cam.rotation.y);return[d,(dx*rx+dz*rz)/d];}
function step(dt){dt=Math.min(dt,.1);if(!(G.app==='match'||G.attract&&G.app==='menu')){visuals(dt);return;}
 G.time+=dt;if(!G.attract)G.matchT+=dt;if(G.player)readPlayer(dt);
 // phases + objective
 if(G.phase==='prep'){G.timer-=dt;if(G.timer<=0){G.phase='action';G.timer=G.attract?90:G.len().act;hud.banner('ACTION PHASE','BREACH AND SECURE',G.player?SIDE[side(G.player)].css:'#fff',1.6);if(!G.attract)snd.beep(true);if(G.view==='drone')exitView();for(const a of G.agents)if(a.brain)a.brain.phaseChange=true;}}
 else if(G.phase==='action'){G.timer-=dt;if(G.timer<=0&&!(G.opt.mode==='capture'&&alive('atk').some(a=>inSite(a.pos)))){endRound('def','time');}}
 else if(G.phase==='post'){const d=G.defuser;d.t-=dt;if(d.light)d.light.intensity=2+Math.sin(G.time*8)*1.5;if(d.t<=0){d.state='done';endRound('atk','defuse');}}
 if(G.opt.mode==='capture'&&G.phase==='action'){const atkIn=alive('atk').filter(a=>inSite(a.pos)).length,defIn=alive('def').filter(a=>inSite(a.pos)).length;G.contested=atkIn>0&&defIn>0;if(atkIn&&!defIn){G.cap+=dt/CAP_T;if(G.cap>=1)endRound('atk','cap');}}
 if(G.defuser.state==='carried'&&G.defuser.carrier)G.defuser.pos.copy(G.defuser.carrier.pos);
 // objective discovery (attackers see the site)
 if(!G.siteKnown&&(G.phase!=='prep'||true)){const s=G.site,cy=s.f*FH+1;const eyes=[];for(const a of alive('atk'))eyes.push(eyePos(a));for(const d of GX.drones)if(d.alive)eyes.push(GX.droneEye(d));
  for(const e of eyes){if(Math.hypot(e.x-s.c[0],e.z-s.c[1])<9&&L.los(e.x,e.y,e.z,s.c[0],cy,s.c[1])){G.siteKnown=true;if(G.player&&side(G.player)==='atk')hud.toast('OBJECTIVE LOCATED · '+s.n);break;}}
  if(G.phase==='action'&&G.len().act-G.timer>35)G.siteKnown=true;}
 // security cameras give defenders intel
 if((camSpotT-=dt)<=0){camSpotT=.5;for(const c of GX.cams){if(!c.alive||c.dis>0)continue;const dv=new V(-Math.sin(c.yaw)*Math.cos(c.pitch),Math.sin(c.pitch),-Math.cos(c.yaw)*Math.cos(c.pitch));for(const a of alive('atk')){const to=new V(a.pos.x-c.pos.x,a.pos.y+1.2-c.pos.y,a.pos.z-c.pos.z);const dd=to.length();if(dd>22)continue;if(to.divideScalar(dd).dot(dv)<.55)continue;if(L.los(c.pos.x,c.pos.y-.1,c.pos.z,a.pos.x,a.pos.y+1.2,a.pos.z)&&G.diff.n!=='EASY')spot(a,'def',1.2);}}}
 // AI
 if((teamT-=dt)<=0){teamT=.4;teamTick(G,C);}
 for(const a of G.agents){if(!a.alive||a.human)continue;if(G.idle){a.ctl.mx=a.ctl.mz=0;a.ctl.fire=false;a.ctl.use=false;continue;}think(G,C,a,dt);}
 acc+=dt;let n=0;while(acc>=DT&&n<5){for(const a of G.agents)if(a.alive)moveAgent(a,DT);separate();acc-=DT;n++;}if(n>=5)acc=0;
 for(const a of G.agents)if(a.alive)updateAgent(a,dt);
 GX.update(dt);L.flushNav();
 // round end checks
 if(G.phase==='action'||G.phase==='post'){const na=alive('atk').length,nd=alive('def').length;if(nd===0)endRound('atk','elim');else if(na===0&&G.phase==='action')endRound('def','elim');}
 else if(G.phase==='prep'){if(alive('atk').length===0)endRound('def','elim');else if(alive('def').length===0)endRound('atk','elim');}
 if(G.phase==='end'){G.endT-=dt;if(G.endT<=0)afterRound();}
 if(G.events.length>90)G.events.splice(0,G.events.length-90);
 if(G.player&&!G.player.alive&&G.view==='spec'&&(!G.spec||!G.spec.alive))specNext(1);
 snd.tick(dt);visuals(dt);}

/* ================= visuals + cameras ================= */
let menuA=0,specCam=new V(),specInit=false;
function visuals(dt){for(const a of G.agents){if(!a.rig)continue;const r=a.rig;r.root.position.copy(a.pos);r.root.rotation.y=a.yaw+Math.PI;const hide=a===G.player&&a.alive&&G.view==='body'&&G.app!=='menu'&&G.app!=='over';r.root.visible=!hide;
  if(r.root.visible)r.update(dt,{speed:Math.hypot(a.vel.x,a.vel.z),crouch:a.crouchV,prone:a.alive?a.proneV:0,lean:a.leanV,pitch:a.pitch+a.recoil.y*D2R,dead:!a.alive,reload:a.reloadT>0?G.time:0,kneel:a.act?1:0});}
 if(fx){const f=world.flash;fx.update(dt,scene.fog,null);world.update(dt,cam);}cameras(dt);hud&&hud.update(dt);}
function keepCam(p,h=1.6){const c=cam.position;const d=new V().subVectors(c,new V(p.x,p.y+h,p.z));const l=d.length();d.normalize();const r=L.ray(p.x,p.y+h,p.z,d.x,d.y,d.z,l+.2);if(r&&r.t<l+.2)c.set(p.x,p.y+h,p.z).addScaledVector(d,Math.max(.4,r.t-.3));}
function cameras(dt){cameras0(dt);cam.updateMatrixWorld();}
function cameras0(dt){shake=Math.max(0,shake-dt*1.8);const P=G.player;vmFlash.intensity*=Math.exp(-dt*30);torch.intensity=0;if(GX)for(const d of GX.drones)d.mesh.visible=!(G.view==='drone'&&P&&d===P.drone&&G.app==='match');
 if(G.app==='loading')return;
 if(G.app==='over'){menuA+=dt*.16;const m=G.mvpMatch||G.agents[0];if(!m)return;const p=m.pos;cam.position.set(p.x+Math.cos(menuA)*4.2,p.y+2,p.z+Math.sin(menuA)*4.2);keepCam(p);cam.lookAt(p.x,p.y+1.1,p.z);cam.fov=50;cam.updateProjectionMatrix();VM.root.visible=false;return;}
 if(G.attract||G.app==='menu'||G.app==='pick'||G.app==='ban'){menuA+=dt;if(!G.menuTgt||!G.menuTgt.alive||menuA>10){const al=G.agents.filter(a=>a.alive);if(al.length){G.menuTgt=al[(R()*al.length)|0];menuA=0;specInit=false;}}
  const s=G.menuTgt;VM.root.visible=false;if(!s){cam.position.set(18,9,22);cam.lookAt(0,2,0);return;}const f=fwd(s);const sd=new V(Math.cos(s.yaw),0,-Math.sin(s.yaw));const head=new V(s.pos.x,s.pos.y+1.65,s.pos.z);
  const want=head.clone().addScaledVector(f,-3.2).addScaledVector(sd,-1.3).add(new V(0,.35,0));const dir=want.clone().sub(head);const dl=dir.length();dir.normalize();const r=L.ray(head.x,head.y,head.z,dir.x,dir.y,dir.z,dl+.3);if(r&&r.t<dl+.3)want.copy(head).addScaledVector(dir,Math.max(.35,r.t-.3));
  if(!specInit){specCam.copy(want);specInit=true;}specCam.lerp(want,Math.min(1,dt*3));cam.position.copy(specCam);cam.lookAt(head.x+f.x*8-sd.x*2.5,head.y-.4,head.z+f.z*8-sd.z*2.5);cam.fov=64;cam.updateProjectionMatrix();return;}
 if(G.view==='drone'&&P&&P.drone&&P.drone.alive){const d=P.drone;const e=GX.droneEye(d);cam.position.copy(e);cam.rotation.set(d.pitch,d.yaw,0);cam.fov=84;cam.updateProjectionMatrix();VM.root.visible=false;return;}
 if(G.view==='cam'){const c=GX.cams[G.camI];if(c){cam.position.copy(c.pos).add(new V(0,-.12,0));cam.rotation.set(c.pitch,c.yaw,0);cam.fov=82;cam.updateProjectionMatrix();}VM.root.visible=false;return;}
 if(P&&P.alive){const e=eyePos(P);P.eyeY=P.eyeY===undefined||Math.abs(P.eyeY-e.y)>1.2?e.y:P.eyeY+(e.y-P.eyeY)*Math.min(1,dt*16);
  // lean must not clip through walls
  const base=new V(P.pos.x,P.eyeY,P.pos.z),off=new V(e.x-P.pos.x,0,e.z-P.pos.z);const ol=off.length();if(ol>.02){const r=L.ray(base.x,base.y,base.z,off.x/ol,0,off.z/ol,ol+.2);if(r&&r.t<ol+.2)off.multiplyScalar(Math.max(0,(r.t-.2)/ol));}
  cam.position.copy(base).add(off);P.punch=(P.punch||0)*Math.exp(-dt*8);const s=shake*shake*.25;
  cam.rotation.set(P.pitch+P.recoil.y*D2R+(R()-.5)*s+P.punch*.01,P.yaw+P.recoil.x*D2R+(R()-.5)*s,-P.leanV*.17);
  const g=P.gun();const zf=g&&P.ads>.5?(g.def.scope?40:58):74;cam.fov+=(zf-cam.fov)*Math.min(1,dt*14);cam.updateProjectionMatrix();
  VM.root.visible=!(g&&g.def.scope&&P.ads>.8);$('scope').hidden=!(g&&g.def.scope&&P.ads>.8);
  VM.update({dt,mdx:VM.mdx||0,mdy:VM.mdy||0,speed:Math.hypot(P.vel.x,P.vel.z),crouch:P.crouchV>.5,prone:P.proneV>.5,onGround:P.onGround,ads:P.ads>.5,sprint:P.ctl.sprint&&P.ctl.sprintOk&&Math.hypot(P.vel.x,P.vel.z)>3,lean:P.leanV,t:G.time,cutting:false});
  if(G.opt.torch){torch.intensity=G.attract?0:7;torch.position.copy(cam.position).add(new V(Math.cos(P.yaw)*.15,-.12,-Math.sin(P.yaw)*.15));torchT.position.copy(cam.position).addScaledVector(viewDir(P,new V()),6);}return;}
 // spectate
 VM.root.visible=false;$('scope').hidden=true;const s=G.spec||G.agents.find(a=>a.alive);if(!s)return;const f=viewDir(s,new V());const head=new V(s.pos.x,s.pos.y+s.eye+.25,s.pos.z);let back=2.6;const bd=new V(-f.x,-f.y*.3+.25,-f.z).normalize();const r=L.ray(head.x,head.y,head.z,bd.x,bd.y,bd.z,3);if(r&&r.t<back+.3)back=Math.max(.3,r.t-.3);
 const want=head.clone().addScaledVector(bd,back);if(!specInit||specCam.distanceTo(want)>8){specCam.copy(want);specInit=true;}specCam.lerp(want,Math.min(1,dt*10));cam.position.copy(specCam);cam.lookAt(head.x+f.x*6,head.y+f.y*6,head.z+f.z*6);cam.fov=72;cam.updateProjectionMatrix();}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM||!VM.root.visible)return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyShadowMode(){if(!world)return;const s=world.moon;s.castShadow=gfx>=1;const ms=gfx>=2?2048:1024;if(s.shadow.mapSize.x!==ms){if(s.shadow.map){s.shadow.map.dispose();s.shadow.map=null;}s.shadow.mapSize.set(ms,ms);}torch.castShadow=gfx>=2;
 for(const a of G.agents)a.rig&&a.rig.root.traverse(o=>{if(o.isMesh&&o!==a.rig.blob)o.castShadow=gfx>=1;});Rr.shadowMap.needsUpdate=true;}
function applyQuality(q){gfx=q;Rr.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.15:.85));fxStack=null;applyShadowMode();}
function render(){if(!world)return;const w=innerWidth,h=innerHeight;if(Rr.domElement.width!==Math.floor(w*Rr.getPixelRatio())||Rr.domElement.height!==Math.floor(h*Rr.getPixelRatio()))Rr.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();const sc=h*Rr.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));fx.sparks.U.uScale.value=fx.smoke.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%3===0)||frameN<3)Rr.shadowMap.needsUpdate=true;
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(Rr,scene,cam,{exposure:1.18,bloom:.62,bloomThreshold:.86,bloomRadius:.45,saturation:1.04,tint:0xe4e9ff,vignette:.38,grain:.035,aoStrength:.8,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade){const P=G.player;const hp=P&&G.app==='match'&&P.alive?P.hp/P.maxHp:1;fxStack.grade.uniforms.sat.value=1.04*(.35+.65*Math.min(1,hp*2));}
 if(fxStack.composer)fxStack.render();else{Rr.autoClear=true;Rr.render(scene,cam);if(VM&&VM.root.visible){Rr.autoClear=false;Rr.clearDepth();Rr.render(vmScene,vmCam);Rr.autoClear=true;}}}

/* ================= match end + scoring ================= */
let lastAward=null;
function endMatch(){G.app='over';unlock();$('pick').hidden=true;$('ban').hidden=true;hud.board(false);hud.show(false);document.body.classList.remove('playing');snd.ambience(null,false);snd.drone(0);
 const won=G.score[0]>G.score[1],draw=G.score[0]===G.score[1];
 $('oeye').textContent=(G.matchT>=G.limit?'MATCH TIME LIMIT · ':'')+'HALVORSEN EMBASSY · '+G.round+' ROUNDS · '+(G.opt.mode==='secure'?'SECURE':'CAPTURE');$('ores').textContent=draw?'DRAW':won?'VICTORY':'DEFEAT';$('ores').style.color=draw?'#ddd':won?'#ff8a3d':'#8a93a6';
 $('ofs').innerHTML=`<span class="m">${G.score[0]}</span> — <span class="t">${G.score[1]}</span>`;
 const rows=s=>G.agents.filter(a=>a.squad===s).sort((p,q)=>q.stats.score-p.stats.score);const mvp=G.agents.slice().sort((p,q)=>(q.stats.mvp||0)-(p.stats.mvp||0)||q.stats.score-p.stats.score)[0];
 $('stats').innerHTML='<tr><th>OPERATOR</th><th>K</th><th>D</th><th>A</th><th>BREACH</th><th>PLANT</th><th>SCORE</th></tr>'+[0,1].map(s=>rows(s).map(a=>`<tr class="s${s}${a.human?' me':''}"><td>${a.name}<i>${a.op?a.op.n:''}</i>${a===mvp?'<span class="mvp">MVP</span>':''}</td><td>${a.stats.k}</td><td>${a.stats.d}</td><td>${a.stats.a}</td><td>${a.stats.breach||0}</td><td>${a.stats.plant||0}</td><td>${a.stats.score}</td></tr>`).join('')).join('');
 G.mvpMatch=mvp;menuA=0;const tok=award(G.player,won);$('otok').textContent=G.player?`+${tok} TOKENS · BEST ${best()} PTS`:'';$('over').hidden=false;}
function award(me,won){if(!me)return 0;const s=me.stats;const pts=s.score+G.score[0]*120+(won?500:0);lastAward={pts,won,score:`${G.score[0]}-${G.score[1]}`,k:s.k,d:s.d,diff:DIFF[G.opt.diff].n.toLowerCase(),mode:G.opt.mode};
 const tok=5+Math.min(60,pts/40|0);addRound(tok,won);saveBest('fortbreach',pts);return tok;}
function best(){return bestScore('fortbreach');}
function toMenu(){unlock();['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause','pick','ban'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing');hud.board(false);snd.ambience(null,false);snd.drone(0);attractMode();}
function attractMode(){G.attract=true;G.diff=DIFF[2];G.startAtk=R()<.5;G.score=[0,0];G.round=0;G.opt.skipPick=false;roster(true);autoPick();startRound();G.app='menu';hud.show(false);}

/* ================= context for gadgets / AI / HUD ================= */
const C={G,get L(){return L;},get fx(){return fx;},snd,scene,get world(){return world;},get VM(){return VM;},get hud(){return hud;},cam,damage,spatial,shakeAt,eyePos,viewDir,fwd,side,spot,ping,
 toast:(a,m)=>{if(a===G.player)hud.toast(m);},breakGlass,exitView,camNext,switchTo,fire,melee,interactTarget,inSite,startReload,get GX(){return GX;},enemyOf,alive};

/* ================= boot ================= */
function boot(){TX=makeTextures();L=new Level();L.dyn=[];world=buildWorld(L,TX,Rr);scene.add(world.group);scene.fog=world.fog;scene.environment=world.env;vmScene.environment=world.env;
 fx=new FX(scene,TX,L);VM=buildViewmodel(TX);vmCam.add(VM.root);GX=initGadgets(C);world.onThunder=()=>{if(G.app==='match'||G.app==='menu')setTimeout(()=>snd.thunder(),400+R()*1500);};
 hud=new HUD(G,C,{SIDE,OPS,ATK_OPS,DEF_OPS,GAD,WPN,THR,SITES,SPAWNS,L});G.hud=hud;
 applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));$('loading').hidden=true;attractMode();}
const seg=(id,key,num=true)=>{const el=$(id);if(!el)return;const set=v=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',(num?+b.dataset.v:b.dataset.v)===v));};set(G.opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(num?+b.dataset.v:b.dataset.v));};
seg('o-side','side',false);seg('o-diff','diff');seg('o-len','len');seg('o-mode','mode',false);seg('o-bans','bans');seg('o-sens','sens');seg('o-vol','vol');
$('o-vol').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>snd.setVol(G.opt.vol)));
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Fortress Breach\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'} ${a.score||''}\nKills: ${a.k||0} · Deaths: ${a.d||0}\nMode: ${a.mode||''} · CPU ${a.diff||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore('fortbreach',a.pts||0,body);};
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{if(world){step(dt);render();}}catch(e){console.error(e);}if(!window.__manual)requestAnimationFrame(loop);}
setTimeout(()=>{boot();requestAnimationFrame(loop);},30);

/* ================= test hooks ================= */
window.SIEGE={get state(){return G.app==='match'?G.phase:G.app;},get app(){return G.app;},get phase(){return G.phase;},G,C,step,render,start,toMenu,pause,
 get player(){return G.player;},get agents(){return G.agents;},get L(){return L;},get GX(){return GX;},get world(){return world;},get fx(){return fx;},get score(){return G.score;},scene,cam,R:Rr,
 ready:()=>G.confirmPick(),ban:(a,d)=>G.ban(a,d),setPrep(s){G.timer=s;},skipPrep(){if(G.phase==='prep')G.timer=0;},setClock(s){G.timer=s;},setMatchClock(s){G.matchT=G.limit-s;},setIdle(v=true){G.idle=v;},
 killSide(sd){for(const a of G.agents)if(a.alive&&side(a)===sd)damage(a,null,999,'chest',{id:'world'});},killAgent(a,by){damage(a,by||null,999,'head',by&&by.gun()?by.gun().def:{id:'world'});},
 forceWin(sd){endRound(sd,'elim');},finishRound(){G.endT=0;},
 plant(){const c=G.defuser.carrier||alive('atk')[0];if(!c)return false;const p=G.site.plant[0];place(c,p[0],p[1],G.site.f*FH);G.phase='action';plantDefuser(c);return true;},
 setDefuse(s){G.defuser.t=s;},disarm(){const d=alive('def')[0];if(d&&G.defuser.state==='planted')disarm(d);},
 teleport(x,z,y=0){const P=G.player;place(P,x,z,y);},look(yaw,pitch){if(G.player){G.player.yaw=yaw;G.player.pitch=pitch;}},
 fire:a=>fire(a||G.player),melee:a=>melee(a||G.player),deploy:(a,o)=>GX.deploy(a||G.player,o),detonate:a=>GX.detonate(a||G.player),equip:(a,s)=>switchTo(a||G.player,s,true),
 interact:a=>interactTarget(a||G.player),input(o){G.forceCtl=o||null;},finishAct:(a,t)=>finishAct(a,t),setQuality:applyQuality,get gfx(){return gfx;},view:v=>v==='body'?exitView():enterView(v),hud:()=>hud,snd};
