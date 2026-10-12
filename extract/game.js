// EXFIL — first-person extraction shooter. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {ITEMS,WPN,AMMO,CAL,CONT,LOOT,GEAR,NAMES,DIFF,VARIANTS,RAID_MIN,AMMO_OF,QUESTS,RAR,money,mkItem,itemValue,itemKg,wstats,pick,levelOf} from './data.js';
import {makeTextures,makeSprites,iconFor} from './tex.js';
import {World,Nav,H,WATER,shoreX,NX0,NZ0,NW} from './world.js';
import {makeMats,buildMap,EXTRACTS,SPAWNS,POI} from './map.js';
import {buildTerrain,buildSea,buildSky,buildRain,buildGrass} from './env.js';
import {Viewmodel} from './weapons.js';
import {Rig,hitActor} from './actors.js';
import {Bot,hostile} from './ai.js';
import {FX} from './fx.js';
import {Sound} from './sound.js';
import {InvUI,newGrid,autoAdd,removeIt,loGrids,loItems,loKg,loValue,countId,takeId,walk,SLOTS,findGridOf} from './inv.js';
import {loadProfile,saveProfile,questRaid,initQuests,freeKit,level} from './profile.js';
import {UI} from './ui.js';
import {HUD,mmss} from './hud.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const $=id=>document.getElementById(id),V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,TAU=Math.PI*2,D2R=Math.PI/180;
const HPMAX={head:35,thorax:85,stomach:70,larm:60,rarm:60,lleg:65,rleg:65};
const EYE=1.62,CEYE=1.08,PH=1.75,PHC=1.2,PR=.33,EXT_T=7,KG_HEAVY=26,KG_MAX=48;

/* ================= renderer + scenes ================= */
const canvas=$('c');const Rr=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});Rr.setPixelRatio(Math.min(devicePixelRatio,1.5));
Rr.shadowMap.enabled=true;Rr.shadowMap.type=THREE.PCFSoftShadowMap;Rr.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x8f9aa4,.012);const cam=new THREE.PerspectiveCamera(70,1,.05,1400);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xc8d0d8,0x4a4640,1.6),vmKey=new THREE.DirectionalLight(0xfff0e0,2.2);vmKey.position.set(-1,2,1);vmScene.add(vmHemi,vmKey);

/* ================= world ================= */
const T=makeTextures(),SPR=makeSprites(),MATS=makeMats(T);const MAP=buildMap(MATS);scene.add(MAP.group);const W=MAP.W,nav=new Nav(W);
const terrain=buildTerrain(T,MAP.roads);scene.add(terrain);const sea=buildSea(T);scene.add(sea.mesh);const sky=buildSky();scene.add(sky.mesh);const rain=buildRain();scene.add(rain.mesh);
const grass=buildGrass(W,5200,MAP.roads,MAP.foot);scene.add(grass);const grassN=grass.count;
const hemi=new THREE.HemisphereLight(0xa8b4c0,0x4c4840,1.1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,1.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-46,right:46,top:46,bottom:-46,near:1,far:320});sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;scene.add(sun,sun.target);const sunDir=new V(.3,.85,.4).normalize();
const torch=new THREE.SpotLight(0xfff2dc,0,42,.48,.55,1.4);torch.position.set(.18,-.12,0);cam.add(torch);const torchT=new THREE.Object3D();torchT.position.set(0,0,-8);cam.add(torchT);torch.target=torchT;
const mlight=new THREE.PointLight(0xffb060,0,9,2);scene.add(mlight);
const fx=new FX(scene,SPR),snd=new Sound(),VM=new Viewmodel(SPR.flash);vmCam.add(VM.root);
const lootG=new THREE.Group();scene.add(lootG);
const heli=(()=>{const g=new THREE.Group(),m=(c,r=.5,mt=.3)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:mt});const body=m(0x3a4436),dark=m(0x15181a,.3,.6);const B=(w,h,d,mt,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mt);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;};
 B(2.4,2.2,5,body,0,0,0);B(2.2,1.2,1.6,dark,0,.3,-2.4);B(.6,.7,6,body,0,.4,5);B(.2,1.6,.9,body,0,1.1,7.8);B(.3,.3,.3,dark,0,1.25,0);B(.12,.12,4.4,dark,-1,-1.5,0);B(.12,.12,4.4,dark,1,-1.5,0);
 const rot=new THREE.Group();rot.position.y=1.45;g.add(rot);for(let k=0;k<4;k++){const bl=new THREE.Mesh(new THREE.BoxGeometry(.35,.05,6),dark);bl.rotation.y=k*Math.PI/2;bl.position.set(Math.sin(k*Math.PI/2)*3,0,Math.cos(k*Math.PI/2)*3);rot.add(bl);}
 const tr=new THREE.Group();tr.position.set(.2,1.1,7.8);g.add(tr);const tb=new THREE.Mesh(new THREE.BoxGeometry(.05,2.2,.2),dark);tr.add(tb);g.userData={rot,tr};g.visible=false;scene.add(g);return g;})();
const pmrem=new THREE.PMREMGenerator(Rr);const envScene=new THREE.Scene();envScene.add(new THREE.Mesh(sky.mesh.geometry,sky.mesh.material));let envRT=null;
function bakeEnv(){try{const rt=pmrem.fromScene(envScene,0,.1,1000);if(envRT)envRT.dispose();envRT=rt;scene.environment=rt.texture;vmScene.environment=rt.texture;}catch(e){}}

/* ================= state ================= */
const G={app:'menu',prof:loadProfile(),snd,time:0,diff:DIFF[1],visRange:120,bots:[],targets:[],bodies:[],noises:[],doors:MAP.doors,W,nav,extracts:EXTRACTS,keys:{},raid:null,P:null,loot:null,kg:0,KG_HEAVY,KG_MAX,ws:null,questLines:'',lowCpu:false,god:false};
const inv=new InvUI(snd);G.inv=inv;const ui=new UI(G);const hud=new HUD();
let P=null,variant=VARIANTS[1],ro={},shake=0,invOpen=false,interactT=null;
const loose=[];// {x,y,z,it,mesh}
const prof=()=>G.prof;

/* ================= conditions ================= */
function applyVariant(v){variant=v;scene.fog.color.set(v.fog);scene.fog.density=v.fogD;scene.background=new THREE.Color(v.fog);
 hemi.color.set(v.sky);hemi.groundColor.set(v.gnd);hemi.intensity=v.hemiI;sun.color.set(v.sunC);sun.intensity=v.sunI;sunDir.set(...v.sun).normalize();
 const U=sky.U;U.uTop.value.set(v.top);U.uHor.value.set(v.hor);U.uFog.value.set(v.fog);U.uSun.value.copy(sunDir);U.uSunC.value.set(v.sunC).multiplyScalar(v.cloud>.7?.35:.9);U.uCloud.value=v.cloud;
 sea.U.uSky.value.set(v.hor);sea.U.uSun.value.copy(sunDir);sea.U.uSunC.value.set(v.sunC).multiplyScalar(v.cloud>.7?.3:1);sea.U.uDeep.value.set(v.id==='golden'?0x1a2a34:0x16262c);
 rain.mesh.visible=!!v.rain;G.visRange=Math.min(170,1.5/v.fogD);vmHemi.color.set(v.sky);vmKey.color.set(v.sunC);fxStack=null;bakeEnv();}

/* ================= player ================= */
function newPlayer(sp){const lo=prof().lo;const y=W.groundAt(sp.x,sp.z,40,.3);
 return{pos:new V(sp.x,y,sp.z),vel:new V(),yaw:sp.yaw,pitch:0,onGround:true,crouch:0,crouchV:0,lean:0,leanV:0,sprinting:false,stamina:100,stamT:0,hp:{...HPMAX},max:HPMAX,bleed:{},frac:{},pain:0,stim:0,alive:true,
  ads:false,adsV:0,cur:lo.primary?'primary':'secondary',mode:{primary:0,secondary:0},fireT:0,shot:0,reload:0,reloadDur:0,reloadKind:'',recP:0,recY:0,lastShot:-9,use:null,light:false,swapT:0,airY:y,stepD:0,hurt:0,deathT:0,killer:null,speed:0,bob:0,punch:0,supp:0,leanOff:0};}
const PT={isPlayer:true,fac:'player',get pos(){return P.pos;},get alive(){return !!P&&P.alive&&G.app==='raid';},get crouchV(){return P.crouchV;},get speed(){return P.speed;},get light(){return P.light;},get yaw(){return P.yaw;},get leanV(){return P.leanV;},
 aimPoint(out,head){const s=1-P.crouchV*.36;return out.set(P.pos.x+Math.cos(P.yaw)*P.leanV*.3,P.pos.y+(head?1.63:1.25)*s,P.pos.z-Math.sin(P.yaw)*P.leanV*.3);}};
const wpn=()=>P&&prof().lo[P.cur]||null;G.wpn=wpn;
let wsKey='';function refreshWs(){const w=wpn();const k=w?w.u+Object.values(w.mods||{}).map(m=>m?m.id:'').join(','):'';if(k!==wsKey){wsKey=k;G.ws=w?wstats(w):null;VM.set(w);}return G.ws;}
const grids=()=>loGrids(prof().lo);
G.reserve=()=>{const w=wpn();return w?countId(grids(),w.at):0;};
function carriedKg(){return loKg(prof().lo);}

/* ================= raid setup ================= */
function genLoot(c){const C=CONT[c.type];const g=newGrid(C.g[0],C.g[1]);const n=C.picks[0]+((R()*(C.picks[1]-C.picks[0]+1))|0);const tab=LOOT[c.type];
 for(let i=0;i<n;i++){const e=pick(tab);const d=ITEMS[e[0]];const o={fir:true};if(d.stack)o.n=e[2]?e[2]+((R()*(e[3]-e[2]))|0):Math.min(d.stack,d.c==='ammo'?30:1);const it=mkItem(e[0],o);if(d.c==='weapon'){it.ammo=R()<.5?((R()*wstats(it).mag)|0):0;}if(d.c==='armor'||d.c==='helmet')it.dur=d.dur*(.45+R()*.55);autoAdd(g,it);}
 if(c.forced==='card'&&R()<.55)autoAdd(g,mkItem('card',{fir:true}));else if(c.forced&&c.forced!=='card')autoAdd(g,mkItem(c.forced,{fir:true}));
 return g;}
function looseMesh(it){const d=ITEMS[it.id];const g=new THREE.Group();let m;const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.2});
 if(d.c==='weapon')m=new THREE.Mesh(new THREE.BoxGeometry(.08,.1,d.w*.16),mat(0x222428));else if(d.c==='ammo')m=new THREE.Mesh(new THREE.BoxGeometry(.14,.07,.09),mat(0x8a6a3a));else if(d.c==='med')m=new THREE.Mesh(new THREE.BoxGeometry(.16,.07,.11),mat(0xe8e4dc));
 else if(d.r>=2)m=new THREE.Mesh(new THREE.BoxGeometry(.1*d.w,.06,.1*d.h),mat(0xb8903a));else m=new THREE.Mesh(new THREE.BoxGeometry(.11*d.w,.08,.11*d.h),mat(0x6a6458));
 m.position.y=.04;m.rotation.y=R()*3;m.castShadow=true;g.add(m);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:SPR.glow,color:new THREE.Color(RAR[d.r].c),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.5}));sp.scale.setScalar(.32);sp.position.y=.12;g.add(sp);g.userData.sp=sp;return g;}
function addLoose(x,y,z,it){const m=looseMesh(it);m.position.set(x,y,z);lootG.add(m);const L={x,y,z,it,mesh:m};loose.push(L);return L;}
function clearWorld(){for(const b of G.bots){scene.remove(b.rig.root);}G.bots.length=0;G.bodies.length=0;for(const l of loose)lootG.remove(l.mesh);loose.length=0;fx.clear();
 for(const d of MAP.doors){d.unlocked=!d.lock;const op=d.startOpen&&R()<.85;d.open=op;d.tgt=op?(R()<.5?1:-1)*1.45:0;d.ang=d.tgt;d.mesh.rotation.y=d.ang;W.on[d.box]=op?0:1;}
 W.on[W.gateBox]=1;MAP.gateMesh.position.x=31;G.gateOpen=false;heli.visible=false;
 nav.refresh(-128,-110,132,100);}
// gear for CPU operators
const DRIFT_TOPS=[0x4a4a3a,0x5a4a34,0x3a4048,0x6a5a48,0x2e3a2e,0x5a3a2e,0x4a4e54,0x6a6a5e],DRIFT_PANTS=[0x2a3448,0x4a4436,0x3a3a36,0x5a5040];const SKINS=[0xc89a78,0xa87858,0x7a5238,0xe0b896,0x5a3a28];
function spawnBot(fac,x,z,o={}){const D=G.diff,tier=D.gear,gt=GEAR[fac][tier];const wid=pick(gt.w)[0];const w=mkItem(wid,{fir:true});const s0=WPN[wid];
 if(fac==='patrol')for(const sl of s0.slots){if(R()>gt.mods)continue;const opts=Object.values(ITEMS).filter(d=>d.c==='mod'&&d.slot===sl&&d.fits.includes(wid));if(opts.length){const m=opts[(R()*opts.length)|0];w.mods[sl]=mkItem(m.id,{fir:true});}}
 w.at=AMMO_OF[s0.cal][R()<gt.ap?1:0];const st=wstats(w);w.ammo=st.mag;
 const ai=pick(gt.a)[0],hi=pick(gt.h)[0],bi=pick(gt.b)[0];const armor=ai?mkItem(ai,{fir:true}):null,helmet=hi?mkItem(hi,{fir:true}):null,bag=bi?mkItem(bi,{fir:true}):null;
 if(armor)armor.dur=ITEMS[ai].dur*(.6+R()*.4);if(helmet)helmet.dur=ITEMS[hi].dur*(.6+R()*.4);
 const invI=[];const lt=fac==='patrol'?LOOT.duffel:LOOT.jacket;for(let k=0,n=1+((R()*3)|0);k<n;k++){const e=pick(lt);const d=ITEMS[e[0]];const it=mkItem(e[0],{fir:true,...(d.stack?{n:e[2]?e[2]+((R()*(e[3]-e[2]))|0):1}:{})});invI.push(it);}
 invI.push(mkItem(w.at,{fir:true,n:Math.min(ITEMS[w.at].stack,st.mag*(1+((R()*2)|0)))}));if(R()<.5)invI.push(mkItem(R()<.6?'band':'kit',{fir:true}));if(fac==='patrol'&&R()<.25)invI.push(mkItem(pick([['watch',1],['chain',1],['docs',1],['hdd',2],['flare',.6]])[0],{fir:true}));
 const look=fac==='drifter'?{fac,top:DRIFT_TOPS[(R()*DRIFT_TOPS.length)|0],pants:DRIFT_PANTS[(R()*DRIFT_PANTS.length)|0],skin:SKINS[(R()*SKINS.length)|0],head:helmet?'helmet':pick([['beanie',3],['cap',2],['hood',2],['bare',1]])[0],hcol:pick([[0x2a2a2a,1],[0x4a3a2a,1],[0x6a2a22,1],[0x2a3a4a,1]])[0],mask:R()<.3,vest:armor?ITEMS[ai].cls:0,pack:bag?ITEMS[bi].r+1:0,packCol:0x4a4036}
  :{fac,top:R()<.5?0x2e3236:0x3a3e34,pants:0x2a2e30,skin:SKINS[(R()*SKINS.length)|0],head:helmet?'helmet':'cap',hcol:helmet?(ITEMS[hi].cls>=4?0x2e3236:0x4a5038):0x1a1c1e,visor:hi==='hlm5',mask:R()<.6,vest:armor?ITEMS[ai].cls:0,pack:bag?ITEMS[bi].r+1:0,packCol:0x2e3430};
 const rig=new Rig(look,wid,w.mods,SPR.flash);scene.add(rig.root);
 const ci=nav.nearestFree(x,z,10);const px=ci>=0?NX0+ci%NW+.5:x,pz=ci>=0?NZ0+((ci/NW)|0)+.5:z;const py=ci>=0?nav.g[ci]:H(x,z);
 const nm=NAMES[fac][(R()*NAMES[fac].length)|0];const b=new Bot(G,{fac,pos:new V(px,py+.05,pz),name:fac==='drifter'?`Drifter "${nm}"`:`Halyard ${nm}`,weapon:w,armor,helmet,bag,inv:invI,rig,spdMul:fac==='patrol'?1:.95,reserve:st.mag*3,...o});
 b.st=st;b.mag=w.ammo;G.bots.push(b);return b;}
function farPOIs(minD,from){return POI.filter(p=>Math.hypot(p.x-from.x,p.z-from.z)>minD).sort(()=>R()-.5);}
function spawnForces(sp){const D=G.diff;const far2=farPOIs(95,sp);const sq=[];for(let s=0;s<D.squads;s++){const p=far2[(s*3)%far2.length];sq.push(p);spawnSquad(p);}
 const far=farPOIs(70,sp).filter(p=>sq.every(q=>Math.hypot(p.x-q.x,p.z-q.z)>45));let n=0,i=0;
 while(n<D.drift&&far.length){const p=far[i++%far.length];const q=nav.randomNear(p.x,p.z,8)||[p.x,0,p.z];spawnBot('drifter',q[0],q[2]);n++;if(R()<.25&&n<D.drift){const q2=nav.randomNear(q[0],q[2],4)||q;spawnBot('drifter',q2[0],q2[2]);n++;}}
}
function spawnSquad(p){const route=POI.slice().sort(()=>R()-.5).slice(0,7);const sq={id:R()};let lead=null;for(let k=0;k<G.diff.ss;k++){const q=nav.randomNear(p.x,p.z,5)||[p.x,0,p.z];const b=spawnBot('patrol',q[0],q[2],{squad:sq,slot:k,route});if(!lead)lead=b;b.lead=lead;}return lead;}
function spawnWave(kind){const alive=G.bots.filter(b=>b.alive).length;if(alive>=16)return;const cand=[...POI,...SPAWNS.map(s=>({...s,w:1}))].filter(p=>Math.hypot(p.x-P.pos.x,p.z-P.pos.z)>85).sort(()=>R()-.5);if(!cand.length)return;const p=cand[0];
 if(kind==='patrol'){spawnSquad(p);hud.note('RADIO CHATTER · HALYARD PATROL ENTERING THE AREA','q');snd.radio(null);}else{for(let k=0;k<2;k++){const q=nav.randomNear(p.x,p.z,6)||[p.x,0,p.z];spawnBot('drifter',q[0],q[2]);}}}

/* ================= raid flow ================= */
function startRaid(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();const p=prof();for(const k of['var','time','diff','sens'])if(o[k]!==undefined)p.opt[k]=o[k];snd.init();
 const lo=p.lo;if(!lo.primary&&!lo.secondary&&!o.force){ui.raidPane();snd.err();return false;}
 const vi=p.opt.var<0?(R()*VARIANTS.length)|0:p.opt.var;applyVariant(VARIANTS[vi]);G.diff=DIFF[p.opt.diff];const mins=RAID_MIN[p.opt.time]??15;
 clearWorld();G.time=0;G.god=false;
 // containers
 for(const c of MAP.conts){c.grid=genLoot(c);c.searched=false;c.hidden=new Set(c.grid.items.map(e=>e.it));c.st=0;}
 for(const s of MAP.loose){if(R()<.6){const e=pick(LOOT.loose);const d=ITEMS[e[0]];const it=mkItem(e[0],{fir:true,...(d.stack?{n:e[2]?e[2]+((R()*(e[3]-e[2]))|0):1}:{})});addLoose(s.x,s.y,s.z,it);}}
 const sp=o.spawn!==undefined?SPAWNS[o.spawn]:SPAWNS[(R()*SPAWNS.length)|0];P=newPlayer(sp);G.P=P;wsKey='';refreshWs();
 const inU=new Set();for(const it of loItems(lo))inU.add(it.u);
 G.raid={t:0,clock:mins*60,dur:mins*60,spawn:sp,kills:[],shots:0,hits:0,heads:0,dmg:0,taken:0,inU,inValue:loValue(lo),extT:0,exIn:null,waves:[{t:.3,k:'drifter'},{t:.5,k:'patrol'},{t:.72,k:'drifter'}],warned:{},
  ex:{tunnel:{open:true,label:'OPEN'},boat:{open:false,cond:true,label:'PAY 6,000 CR'},gate:{open:false,cond:true,label:'KEYCARD'},flare:{open:false,cond:true,label:'FLARE',t:0,win:0}},result:null};
 spawnForces(sp);G.app='raid';invOpen=false;G.loot=null;$('inv').hidden=true;$('menu').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');
 G.blackV=-1;$('black').style.transition='none';$('black').style.opacity=1;setTimeout(()=>{$('black').style.transition='opacity 1.6s';$('black').style.opacity=0;},40);
 hud.banner('SALTCREST WORKS',`${variant.n} · ${variant.clock} · ${G.diff.n} · ${mins} MIN`,'#ecebe6',3.4);hud.showEx(9);questTrack();
 snd.horn();lock();G.time=0;return true;}
function questTrack(){const p=prof();const lines=[];for(const q of QUESTS){const s=p.quests[q.id];if(s.s!=='active'||q.type==='hand')continue;let n=s.n;if(G.raid&&q.type==='kill'){for(const k of G.raid.kills){if(q.fac!=='*'&&k.fac!==q.fac)continue;if(q.cls&&k.cls!==q.cls)continue;if(q.head&&!k.head)continue;n++;}}
  const lbl=q.type==='kill'?`${Math.min(n,q.n_)}/${q.n_}`:q.type==='streak'?`${n}/${q.n_} RAIDS`:q.type==='carry'?(countId(grids(),q.item)?'CARRYING':'FIND IT'):'EXTRACT';lines.push(`<div class="${n>=q.n_?'done':''}">${q.n.toUpperCase()} · ${lbl}</div>`);if(lines.length>=3)break;}G.questLines=lines.join('');}
function endRaid(kind,info={}){if(G.app!=='raid')return;const raid=G.raid,p=prof(),lo=p.lo;G.app='over';closeInv(true);unlock();document.body.classList.remove('playing');$('hud').hidden=true;$('scope').hidden=true;$('hurt').style.opacity=0;
 const survived=kind==='extracted';raid.result=kind;
 // found-in-raid value carried
 let found=0;const foundItems=[];for(const it of loItems(lo)){if(!raid.inU.has(it.u)){found+=itemValue(it);foundItems.push(it);}}
 const outValue=survived?loValue(lo):0;const kills=raid.kills.length,heads=raid.kills.filter(k=>k.head).length;
 // xp
 const xk=raid.kills.reduce((a,k)=>a+(k.fac==='patrol'?350:150)*(k.head?1.5:1),0);const st=p.stats;const streak=survived?st.streak+1:0;const xs=survived?Math.round(800*(1+Math.min(5,st.streak)*.15)):0;const xl=survived?Math.round(found/350):0;const xt=Math.round(raid.t/6);const xp=Math.round(xk+xs+xl+xt);
 const lv0=levelOf(p.xp);p.xp+=xp;const lv1=levelOf(p.xp);
 st.raids++;if(survived){st.survived++;st.streak++;st.best=Math.max(st.best,st.streak);st.extracted+=outValue;st.bestRaid=Math.max(st.bestRaid,found);st.found+=found;}else{st.streak=0;if(kind==='kia')st.kia++;else st.mia++;}
 for(const k of raid.kills){st.kills[k.fac]=(st.kills[k.fac]||0)+1;if(k.head)st.heads++;}
 const carried=new Set();for(const it of loItems(lo))carried.add(it.id);const qs=questRaid(p,{kills:raid.kills,ex:info.ex||null,survived,carried});
 if(!survived){const pouch=lo.pouch;p.lo={primary:null,secondary:null,helmet:null,armor:null,bag:null,pockets:newGrid(4,1),pouch};}
 // score + award
 const pts=Math.round(found/100+kills*40+heads*20+(survived?250:0));award(pts,survived,{kills,found,kind,ex:info.ex,streak});initQuests(p);saveProfile(p);
 // results screen
 const RES={extracted:['EXTRACTED','var(--ok)'],kia:['KILLED IN ACTION','var(--bad)'],mia:['MISSING IN ACTION','var(--warn)']}[kind];
 $('oeye').textContent=`SALTCREST WORKS · ${variant.n} · ${G.diff.n} · ${mmss(raid.t)} IN RAID`;$('ores').textContent=RES[0];$('ores').style.color=RES[1];
 $('ofs').textContent=survived?`+${money(found)} FOUND · ${money(outValue)} CARRIED OUT`:kind==='kia'?`ALL GEAR LOST · POUCH KEPT`:`THE CLOCK RAN OUT · GEAR LOST`;
 const acc=raid.shots?Math.round(raid.hits/raid.shots*100):0;const ex=info.ex?EXTRACTS.find(e=>e.id===info.ex).n:'—';
 const rows=[[survived?'EXTRACTION':'CAUSE',survived?ex:kind==='kia'?(info.by||'Unknown')+(info.part?' · '+info.part.toUpperCase():''):info.abandon?'Abandoned raid':'Raid timer expired'],['TIME IN RAID',mmss(raid.t)],['KILLS',`${kills}  (${raid.kills.filter(k=>k.fac==='drifter').length} drifters · ${raid.kills.filter(k=>k.fac==='patrol').length} patrol)`],['HEADSHOTS',heads],['ACCURACY',acc+'%  ('+raid.hits+'/'+raid.shots+')'],['DAMAGE DEALT',Math.round(raid.dmg)],
  ['LOOT FOUND',money(found)+(survived?'':' · LOST')],['EXTRACTED VALUE',money(outValue)],['SURVIVAL STREAK',survived?streak+(streak>1?' RAIDS':' RAID'):'RESET']];
 $('stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')+`<tr class="xpr"><td>XP GAINED</td><td>+${xp}  (kills ${Math.round(xk)} · survival ${xs} · loot ${xl} · time ${xt})</td></tr>`+(lv1>lv0?`<tr class="xpr"><td>LEVEL UP</td><td>LEVEL ${lv1} · NEW TRADER STOCK</td></tr>`:'')+qs.map(q=>`<tr class="xpr"><td>TASK</td><td>${q.q.n} · ${q.ready?'COMPLETE · CLAIM IN TASKS':q.n+'/'+q.q.n_}</td></tr>`).join('');
 const ol=$('oloot');ol.innerHTML='';if(survived)for(const it of foundItems.sort((a,b)=>itemValue(b)-itemValue(a)).slice(0,24)){const e=inv.itemEl(it,false,{});e.style.position='relative';ol.appendChild(e);}
 $('otok').textContent=`+${lastAward.tok} TOKENS · BEST ${best().toLocaleString()} PTS · RAID SCORE ${pts.toLocaleString()}`;$('over').hidden=false;
 if(survived)snd.extracted();}
let lastAward={tok:0};
function award(pts,won,info){let tok=5+Math.min(60,pts/40|0);lastAward={pts,won,tok,...info,diff:G.diff.n,cond:variant.n};
 addRound(tok,won);saveBest('exfil',pts);return tok;}
function best(){return bestScore('exfil');}
function toMenu(){G.app='menu';unlock();closeInv(true);$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('menu').hidden=false;$('scope').hidden=true;document.body.classList.remove('playing');
 clearWorld();for(const c of MAP.conts){c.grid=null;}menuT=0;applyVariant(VARIANTS[SHOTS[menuShot%SHOTS.length].v]);P=null;G.P=null;G.raid=null;ui.show(ui.tab==='raid'?'raid':ui.tab);torch.intensity=0;mlight.intensity=0;}

/* ================= damage model ================= */
function armorCalc(it,pen,dmg){if(!it||it.dur<=0)return{dmg,blocked:false,armor:false};const d=ITEMS[it.id];const df=it.dur/d.dur;const eff=d.cls*10*(.55+.45*df);const ch=cl(.5+(pen-eff)/16,.02,.98);
 if(R()<ch){it.dur=Math.max(0,it.dur-dmg*.05*(1+d.cls*.1));return{dmg:dmg*(1-d.cls*.035),blocked:false,armor:true};}it.dur=Math.max(0,it.dur-dmg*.11);return{dmg:dmg*(.12+.03*(6-d.cls)),blocked:true,armor:true};}
function partHit(part){if(part==='arm')return R()<.5?'larm':'rarm';if(part==='leg')return R()<.5?'lleg':'rleg';return part;}
function hurtPlayer(part,dmg,pen,from,dir){if(!P||!P.alive||G.god||G.app!=='raid')return;const lo=prof().lo;const k=partHit(part);const arm=k==='head'?lo.helmet:k==='thorax'||k==='stomach'?lo.armor:null;
 const res=armorCalc(arm,pen,dmg);applyDmg(k,res.dmg);G.raid.taken+=res.dmg;if(!res.blocked&&res.dmg>8&&k!=='head'){if(R()<.32)P.bleed[k]=res.dmg>45&&R()<.4?2.2:.9;if((k.includes('leg')||k.includes('arm'))&&res.dmg>30&&R()<.22)P.frac[k]=1;}
 P.hurt=Math.min(1,P.hurt+res.dmg/45);shake=Math.max(shake,Math.min(.6,res.dmg/80));P.punch+=Math.min(3,res.dmg*.05);snd.hurt(res.armor,k==='head');
 if(from&&from.pos){hud.hurtDir(Math.atan2(from.pos.x-P.pos.x,-(from.pos.z-P.pos.z))+P.yaw);}
 if(res.blocked)hud.note(k==='head'?'HELMET STOPPED A ROUND':'ARMOUR STOPPED A ROUND','');
 if(P.hp.head<=0||P.hp.thorax<=0)playerDie(from,k);}
function applyDmg(k,dmg){const hp=P.hp;if(hp[k]>0){hp[k]-=dmg;if(hp[k]<0){const o=-hp[k];hp[k]=0;spread(o*.7,k);}}else spread(dmg*.7,k);}
function spread(d,skip){const alive=Object.keys(P.hp).filter(x=>x!==skip&&P.hp[x]>0);if(!alive.length)return;for(const x of alive)P.hp[x]-=d/alive.length;}
function playerDie(from,part){if(!P.alive)return;P.alive=false;P.deathT=0;P.killer={by:from&&from.name?from.name:'Unknown',part};snd.death();P.use=null;P.reload=0;closeInv(true);hud.banner('KILLED IN ACTION',(P.killer.by)+' · '+(part||'').toUpperCase(),'#ff4a3a',3);}
function hitBot(b,part,ammo,dir,pt,src,cls,mult=1){const dmg0=ammo.dmg*mult*(src==='player'?1:G.diff.dmg*.35);const arm=part==='head'?b.helmet:part==='thorax'||part==='stomach'?b.armor:null;const res=armorCalc(arm,ammo.pen,dmg0);
 if(res.blocked)fx.armorSpark(pt,dir);else fx.hitPuff(pt,dir);snd.bodyHit(pt,res.blocked);const was=b.alive;const killed=b.damage(part,res.dmg);
 // the victim learns where the fire came from
 const att=src==='player'?PT:src;if(att&&att.alive!==false){b.target=att;b.lastSeen.copy(att.pos);if(!b.seen)b.seenT=G.time-1.2;b.state='combat';}
 if(src==='player'){G.raid.hits++;G.raid.dmg+=res.dmg;hud.hit(killed?'kill':part==='head'?'head':res.blocked?'arm':'');snd.hitmark(killed?'kill':part==='head'?'head':'');}
 if(killed&&was)killBot(b,src,part==='head',cls);}
function killBot(b,src,head,cls){b.alive=false;b.state='dead';b.reloadT=0;const g=newGrid(7,9);
 if(b.weapon){b.weapon.ammo=Math.max(0,b.mag);autoAdd(g,b.weapon);}for(const it of[b.armor,b.helmet,b.bag,...b.inv])if(it)autoAdd(g,it);
 const body={type:'body',x:b.pos.x,y:b.pos.y,z:b.pos.z,top:b.pos.y+.5,grid:g,name:b.name,hidden:null,bot:b,searched:true};G.bodies.push(body);
 if(src==='player'){G.raid.kills.push({fac:b.fac,cls,head,name:b.name});if(head)G.raid.heads++;hud.note(`NEUTRALISED ${b.name}${head?' · HEADSHOT':''}`,'k');questTrack();}
 else if(src&&src.kills!==undefined){src.kills++;G.kstat=G.kstat||{tgt:0,ff:0};if(src.target===b)G.kstat.tgt++;else G.kstat.ff++;}}

/* ================= shooting ================= */
const tv=new V(),tv2=new V(),tv3=new V();
function viewDir(out,yaw,pitch){return out.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));}
function cone(base,rad,out){if(rad<=0)return out.copy(base);const up=Math.abs(base.y)>.95?tv3.set(1,0,0):tv3.set(0,1,0);const rt=new V().crossVectors(base,up).normalize(),u2=new V().crossVectors(rt,base).normalize();const a=R()*TAU,r=Math.sqrt(R())*rad;return out.copy(base).addScaledVector(rt,Math.cos(a)*r).addScaledVector(u2,Math.sin(a)*r).normalize();}
function muzzleWorld(out){const d=viewDir(tv2,P.yaw+P.recY,P.pitch+P.recP);const rt=new V(Math.cos(P.yaw),0,-Math.sin(P.yaw));return out.copy(cam.position).addScaledVector(d,.7).addScaledVector(rt,.13*(1-P.adsV)).add(new V(0,-.1*(1-P.adsV)-.03,0));}
function playerFire(){const w=wpn(),s=G.ws;const ammo=AMMO[w.at];w.ammo--;P.fireT=60/s.rpm;P.lastShot=G.time;P.shot++;G.raid.shots++;P.sprinting=false;
 const eye=cam.position.clone();const base=viewDir(new V(),P.yaw+P.recY,P.pitch+P.recP);const mv=Math.min(1.6,P.speed/3.2);
 let spr=(s.hip+(s.ads-s.hip)*P.adsV)+(ammo.pel?0:mv*(1-P.adsV*.6)*1.3);spr*=P.crouchV>.5?.8:1;if(P.hp.larm<=0||P.hp.rarm<=0)spr*=1.5;
 const pel=ammo.pel||1;const end=new V();let hitAny=false;
 for(let k=0;k<pel;k++){const d=pel>1?cone(cone(base,(1-P.adsV)*1.2*D2R,new V()),s.ads*D2R,new V()):cone(base,spr*D2R,new V());
  const t=shootRay(eye,d,'player',ammo,s.cls,1,k===0);if(k===0)end.copy(eye).addScaledVector(d,Math.min(t,260));}
 const mz=muzzleWorld(new V());if(!s.sup&&P.shot%2===1)fx.tracer(mz,end);fx.muzzle(mz,base,s.sup);if(!s.sup){mlight.position.copy(mz);mlight.intensity=6;}
 VM.fire(s.cls==='SHOTGUN'?1.4:s.cls==='MARKSMAN'?1.1:s.cls==='PISTOL'?.6:.45);snd.shot(ITEMS[w.id].wid,null,s.sup);noise(P.pos,s.loud,'shot',PT);
 // recoil
 const rk=s.kick*s.rec*(P.adsV>.5?.85:1)*(P.crouchV>.5?.85:1)*(P.hp.larm<=0||P.hp.rarm<=0||P.frac.larm||P.frac.rarm?1.4:1);const idx=Math.min(s.pat.length-1,P.burst||0);P.burst=(P.burst||0)+1;
 P.recP+=rk*D2R*(.8+R()*.4);P.recY+=s.pat[idx]*s.hk*s.rec*D2R*1.4+(R()-.5)*s.hk*.3*D2R;shake=Math.max(shake,s.cls==='SHOTGUN'?.12:.03);
 if(s.tube){P.pumpT=.45;}if(w.ammo===0)hud.note('MAGAZINE EMPTY · R TO RELOAD','');}
// returns hit distance
function shootRay(o,d,src,ammo,cls,mult,primary){const maxT=320;W.ray(o.x,o.y,o.z,d.x,d.y,d.z,maxT,2,ro);const wallT=ro.t;const surf=ro.mat,n=new V(ro.nx||0,ro.ny||1,ro.nz||0);
 let best=null;for(const b of G.bots){if(!b.alive||b===src)continue;const lim=Math.min(wallT,best?best.t:1e9);if(Math.abs(b.pos.x-o.x)>lim+2||Math.abs(b.pos.z-o.z)>lim+2)continue;const h=hitActor(b,o.x,o.y,o.z,d.x,d.y,d.z,lim);if(h&&(!best||h.t<best.t))best={...h,b};}
 if(src!=='player'&&P&&P.alive){const lim=Math.min(wallT,best?best.t:1e9);const h=hitActor(PT,o.x,o.y,o.z,d.x,d.y,d.z,lim);if(h&&(!best||h.t<best.t))best={...h,b:null,player:true};}
 const t=best?best.t:wallT;
 if(best&&best.player){hurtPlayer(best.part,ammo.dmg*mult*G.diff.dmg,ammo.pen,src,d);}
 else if(best){const pt=o.clone().addScaledVector(d,best.t);hitBot(best.b,best.part,ammo,d,pt,src,cls,mult);}
 else if(wallT<maxT){const pt=o.clone().addScaledVector(d,wallT);if(primary||R()<.4){fx.impact(pt,n,surf,primary?1:.5);snd.impact(surf,pt);}}
 // near misses: suppress bots / crack past the player
 if(src==='player'){for(const b of G.bots){if(!b.alive||best&&best.b===b)continue;const e=b.eye;const s=(e.x-o.x)*d.x+(e.y-o.y)*d.y+(e.z-o.z)*d.z;if(s<0||s>t)continue;const cx=o.x+d.x*s-e.x,cy=o.y+d.y*s-e.y,cz=o.z+d.z*s-e.z;if(cx*cx+cy*cy+cz*cz<6){b.suppress=Math.min(1.5,b.suppress+.35);if(b.state!=='combat'){b.state='combat';b.target=PT;b.lastSeen.copy(P.pos);b.seenT=G.time-1.5;b.alert=1;}}}}
 else if(P&&P.alive&&!(best&&best.player)){const e=cam.position;const s=(e.x-o.x)*d.x+(e.y-o.y)*d.y+(e.z-o.z)*d.z;if(s>0&&s<t){const cx=o.x+d.x*s-e.x,cy=o.y+d.y*s-e.y,cz=o.z+d.z*s-e.z;const dd=cx*cx+cy*cy+cz*cz;if(dd<4){snd.crack(new V(e.x+cx,e.y+cy,e.z+cz));P.supp=Math.min(1,P.supp+.35);}}}
 return t;}
G.botFire=(b,aim,vis)=>{const s=b.st,w=b.weapon,ammo=AMMO[w.at];const o=b.eye.clone();const base=new V().subVectors(aim,o).normalize();
 const err=b.aimErr+b.suppress*.03+(b.spd>.6?.04:0)+(vis?0:.045)+(G.P&&G.P.alive&&b.target===PT?P.speed*.004:0);const pel=ammo.pel||1;
 const dir0=cone(base,err,new V());let end=null;for(let k=0;k<pel;k++){const d=pel>1?cone(dir0,s.ads*D2R,new V()):dir0;const t=shootRay(o,d,b,ammo,s.cls,1,k===0);if(k===0)end=o.clone().addScaledVector(d,Math.min(t,250));}
 b.rig.flash();b.rig.root.updateMatrixWorld();const mz=b.rig.muzzleWorld(new V());fx.muzzle(mz,base,s.sup);if(!s.sup&&R()<.45)fx.tracer(mz,end,[1,.8,.5]);snd.shot(ITEMS[w.id].wid,b.pos,s.sup);noise(b.pos,s.loud,'shot',b);};
G.botStep=b=>{if(!P)return;const d=b.pos.distanceTo(P.pos);if(d>38)return;snd.step(W.surfAt(b.pos.x,b.pos.z,b.pos.y),b.pos,b.spd>4?1.3:.8);};
G.botLoot=(b,body)=>{let best=null;for(const e of body.grid.items){const d=ITEMS[e.it.id];if(d.c==='weapon'||d.c==='armor')continue;if(!best||itemValue(e.it)>itemValue(best))best=e.it;}if(best){removeIt(body.grid,best);b.inv.push(best);}};
function noise(p,r,kind,src){const n={p:p.clone(),r,kind,src};for(const b of G.bots)if(b.alive&&b!==src)b.hear(n);}

/* ================= doors + interaction ================= */
G.toggleDoor=(d,by)=>{if(d.lock&&!d.unlocked)return false;d.open=!d.open;if(d.open){const ox=by.pos.x,oz=by.pos.z;const s=d.ax==='x'?(oz>d.at?1:-1):(ox<d.at?1:-1);d.tgt=s*1.5;W.on[d.box]=0;}else{d.tgt=0;W.on[d.box]=1;}snd.door(d.open);if(by!==PT)noise(new V(d.x,d.y,d.z),6,'door',by);return true;};
function keyFor(d){return Object.values(ITEMS).find(x=>x.c==='key'&&x.door===d.lock);}
function interactables(){const out=[];const lo=prof().lo;
 for(const c of MAP.conts)out.push({k:'cont',c,x:c.x,y:c.top+.05,z:c.z,r:2.3});for(const b of G.bodies)out.push({k:'cont',c:b,x:b.x,y:b.y+.35,z:b.z,r:2.4});
 for(const l of loose)out.push({k:'loose',l,x:l.x,y:l.y+.1,z:l.z,r:2.2});for(const d of MAP.doors)out.push({k:'door',d,x:d.x,y:d.y+1.1,z:d.z,r:2.2});
 for(const n of MAP.named){if(n.id==='panel')out.push({k:'panel',x:n.x,y:n.y,z:n.z,r:2.2});if(n.id==='beacon')out.push({k:'beacon',x:n.x,y:n.y,z:n.z,r:2.6});}
 out.push({k:'boat',x:121,y:1.4,z:16,r:2.4});return out;}
const IA=interactables();
function scanInteract(){if(!P.alive||invOpen)return null;const e=new V(P.pos.x+Math.cos(P.yaw)*(P.leanOff||0),P.pos.y+EYE-(EYE-CEYE)*P.crouchV,P.pos.z-Math.sin(P.yaw)*(P.leanOff||0)),f=viewDir(tv,P.yaw,P.pitch);let best=null,bs=.72;
 const list=IA.concat(G.bodies.map(b=>({k:'cont',c:b,x:b.x,y:b.y+.35,z:b.z,r:2.4})),loose.map(l=>({k:'loose',l,x:l.x,y:l.y+.1,z:l.z,r:2.2})));
 for(const o of list){if(o.k==='cont'&&o.c.type==='body'&&!G.bodies.includes(o.c))continue;const dx=o.x-e.x,dy=o.y-e.y,dz=o.z-e.z,d=Math.hypot(dx,dy,dz);if(d>o.r)continue;const dot=(dx*f.x+dy*f.y+dz*f.z)/d;const sc=dot+(d<1?.15:0);if(sc<bs)continue;
  if(!W.los(e.x,e.y,e.z,e.x+dx*(1-.3/d),e.y+dy*(1-.3/d),e.z+dz*(1-.3/d)))continue;bs=sc;best=o;}
 if(best&&best.k==='cont'&&best.c.type!=='body'&&!best.c.grid)return null;return best;}
function promptFor(o){if(!o)return'';const raid=G.raid;
 if(o.k==='cont'){const c=o.c;const nm=c.type==='body'?c.name:CONT[c.type].n;return `<kbd>F</kbd>${c.type==='body'?'LOOT ':c.searched?'OPEN ':'SEARCH '}${nm.toUpperCase()}${c.searched&&c.grid&&!c.grid.items.length?'<span class="sub">EMPTY</span>':''}`;}
 if(o.k==='loose'){const d=ITEMS[o.l.it.id];return `<kbd>F</kbd>PICK UP <span style="color:${RAR[d.r].c}">${d.n.toUpperCase()}</span>${d.stack?' ×'+Math.round(o.l.it.n).toLocaleString():''}`;}
 if(o.k==='door'){const d=o.d;if(d.lock&&!d.unlocked){const k=keyFor(d);const has=countId(grids(),k.id)>0;return has?`<kbd>F</kbd>UNLOCK · ${k.n.toUpperCase()}`:`<span class="lk">LOCKED</span><span class="sub">NEEDS ${k.n.toUpperCase()}</span>`;}return `<kbd>F</kbd>${d.open?'CLOSE':'OPEN'} DOOR`;}
 if(o.k==='panel')return raid.ex.gate.open?'GATE OPEN · EXTRACT BEYOND THE BARRIER':countId(grids(),'card')?'<kbd>F</kbd>SWIPE BLUE KEYCARD':'<span class="lk">KEYCARD READER</span><span class="sub">NEEDS A BLUE GATE KEYCARD</span>';
 if(o.k==='beacon'){const f=raid.ex.flare;if(f.open)return 'PICKUP WAITING ON THE PAD';if(f.t>0)return 'PICKUP INBOUND · '+mmss(f.t);return countId(grids(),'flare')?'<kbd>F</kbd>FIRE GREEN FLARE':'<span class="lk">SIGNAL BEACON</span><span class="sub">NEEDS A GREEN SIGNAL FLARE</span>';}
 if(o.k==='boat'){const b=raid.ex.boat;if(b.open)return 'BOATMAN PAID · BOARD AT THE PIER END';const c=countId(grids(),'cash');return c>=6000?'<kbd>F</kbd>RADIO BOATMAN · PAY 6,000 CR':`<span class="lk">BOATMAN WANTS 6,000 CR CASH</span><span class="sub">YOU CARRY ${c.toLocaleString()} CR</span>`;}
 return '';}
function interact(o){if(!o||!P.alive)return;const raid=G.raid;
 if(o.k==='cont'){openLoot(o.c);return;}
 if(o.k==='loose'){const it=o.l.it;if(pickUp(it)){lootG.remove(o.l.mesh);loose.splice(loose.indexOf(o.l),1);}return;}
 if(o.k==='door'){const d=o.d;if(d.lock&&!d.unlocked){const k=keyFor(d);if(countId(grids(),k.id)>0){d.unlocked=true;snd.unlock();hud.note('UNLOCKED · '+k.n.toUpperCase(),'q');nav.refresh(Math.min(d.x,d.x)-2,d.z-2,d.x+2,d.z+2);}else{snd.locked();hud.note('LOCKED · NEEDS '+k.n.toUpperCase(),'k');}return;}G.toggleDoor(d,PT);return;}
 if(o.k==='panel'){if(raid.ex.gate.open)return;if(takeId(grids(),'card',1)===0){openGate();}else{snd.err();hud.note('NO KEYCARD','k');}return;}
 if(o.k==='beacon'){const f=raid.ex.flare;if(f.open||f.t>0)return;if(takeId(grids(),'flare',1)===0){f.t=45;f.label='INBOUND';snd.flare();fx.flare(new V(o.x,o.y+.4,o.z));noise(new V(o.x,o.y,o.z),170,'shot',PT);hud.banner('FLARE AWAY','PICKUP IN 0:45 · HOLD THE HELIPAD','#6fe08a',3);}else{snd.err();hud.note('NO FLARE','k');}return;}
 if(o.k==='boat'){const b=raid.ex.boat;if(b.open)return;if(countId(grids(),'cash')>=6000){takeId(grids(),'cash',6000);b.open=true;b.cond=false;b.label='PAID';snd.buy();snd.horn();hud.banner('BOATMAN PAID','BOARD AT THE END OF THE PIER','#6fe08a',2.6);}else{snd.err();hud.note('NOT ENOUGH CASH','k');}return;}}
function openGate(){const raid=G.raid;raid.ex.gate.open=true;raid.ex.gate.cond=false;raid.ex.gate.label='OPEN';W.on[W.gateBox]=0;G.gateOpen=true;snd.unlock();snd.horn();hud.banner('GATE OPENING','THE GATEHOUSE EXTRACT IS LIVE','#6fe08a',2.6);nav.refresh(29,-99,41,-95);}
function pickUp(it){const lo=prof().lo;const d=ITEMS[it.id];for(const s of SLOTS)if(!lo[s]&&s!=='secondary'&&(s==='primary'?d.c==='weapon':s==='helmet'?d.c==='helmet':s==='armor'?d.c==='armor':s==='bag'?d.c==='bag':false)){lo[s]=it;G.picked(it);return true;}
 if(autoAdd(lo.pockets,it,'pockets')||(lo.bag&&autoAdd(lo.bag.g,it,'bag'))){G.picked(it);return true;}hud.note('NO SPACE','k');snd.err();return false;}
G.picked=it=>{const d=ITEMS[it.id];snd.pick();hud.note('+ '+d.n+(d.stack?' ×'+Math.round(it.n).toLocaleString():''),'r'+d.r);refreshWs();questTrack();};
G.dropItem=(it)=>{if(!P)return false;const f=viewDir(tv,P.yaw,0);const x=P.pos.x+f.x*.8,z=P.pos.z+f.z*.8;addLoose(x,W.groundAt(x,z,P.pos.y+1,.1),z,it);snd.pick();refreshWs();return true;};
G.note=(t,c)=>hud.note(t,c);G.toast=t=>hud.note(t,'k');
G.onInvChange=()=>{ui.weightLine();ui.bodyHp();refreshWs();};
function openLoot(c){if(c.type!=='body'&&!c.grid)return;const L={type:c.type,name:c.name,grid:c.grid,c,hidden:c.hidden,prog:it=>{if(!c.hidden||!c.hidden.size)return null;const first=[...c.hidden][0];return it===first?c.st/searchPer(c):0;}};G.loot=L;if(!c.searched)snd.zip();openInv();}
const searchPer=c=>Math.max(.55,CONT[c.type].t/Math.max(1,c.grid.items.length));
function openInv(){if(G.app!=='raid'||!P.alive)return;invOpen=true;P.ads=false;mouse.l=false;$('inv').hidden=false;unlock();ui.raidInv();}
function closeInv(silent){if(!invOpen)return;invOpen=false;$('inv').hidden=true;G.loot=null;inv.views.clear();inv.tip.hidden=true;inv.menuEl.hidden=true;if(!silent&&G.app==='raid')lock();}

/* ================= meds ================= */
function useItem(it){if(!P||!P.alive||P.use)return;const d=ITEMS[it.id];if(d.c!=='med')return;P.use={it,t:0,dur:d.t*(P.stim>0?.8:1)};P.ads=false;P.reload=0;snd.heal();if(invOpen)closeInv();}
G.useItem=useItem;
function smartHeal(){const lo=prof().lo;const meds=[...walk(lo.pockets),...(lo.bag?[...walk(lo.bag.g)]:[]),...walk(lo.pouch)].filter(it=>ITEMS[it.id].c==='med');const has=m=>meds.find(it=>ITEMS[it.id].med===m);
 const bleeding=Object.values(P.bleed).some(Boolean),frac=Object.values(P.frac).some(Boolean),dead=Object.keys(P.hp).some(k=>P.hp[k]<=0&&k!=='head'&&k!=='thorax');let missing=0;for(const k in P.hp)missing+=Math.max(0,P.max[k]-P.hp[k]);
 const it=bleeding&&(has('band')||has('kit'))||frac&&has('splint')||dead&&has('surg')||missing>20&&has('kit')||frac&&has('pills');if(it)useItem(it);else{hud.note(missing<1&&!bleeding&&!frac?'NOTHING TO TREAT':'NO SUITABLE MEDS','');snd.err();}}
function finishUse(){const it=P.use.it,d=ITEMS[it.id];P.use=null;let used=true;
 if(d.med==='band'){const k=Object.keys(P.bleed).find(x=>P.bleed[x]);if(k){delete P.bleed[k];hud.note('BLEEDING STOPPED','q');}else used=false;if(used)it.uses--;}
 else if(d.med==='kit'){for(const k in P.bleed)delete P.bleed[k];let pool=Math.min(it.hp,d.id==='trauma'?260:140);const spent0=pool;const parts=Object.keys(P.hp).filter(k=>P.hp[k]>0&&P.hp[k]<P.max[k]).sort((a,b)=>P.hp[a]/P.max[a]-P.hp[b]/P.max[b]);for(const k of parts){const n=Math.min(pool,P.max[k]-P.hp[k]);P.hp[k]+=n;pool-=n;if(pool<=0)break;}it.hp-=spent0-pool;hud.note('HEALED '+Math.round(spent0-pool)+' HP','q');}
 else if(d.med==='splint'){const k=Object.keys(P.frac).find(x=>P.frac[x]);if(k){delete P.frac[k];it.uses--;hud.note('FRACTURE SET','q');}}
 else if(d.med==='pills'){P.pain=90;it.uses--;}
 else if(d.med==='stim'){P.stim=45;P.stamina=100;it.uses--;}
 else if(d.med==='surg'){const k=Object.keys(P.hp).find(x=>P.hp[x]<=0&&x!=='head'&&x!=='thorax');if(k){P.hp[k]=1;P.max[k]=P.max[k];it.uses--;hud.note('LIMB RESTORED','q');}}
 if((d.u&&it.uses<=0)||(d.hp&&it.hp<=1)){const g=findGridOf(grids(),it);if(g)removeIt(g,it);}}

/* ================= input ================= */
const keys=G.keys,mouse={l:false,r:false,lEdge:false,dx:0,dy:0};let locked=false;
function lock(){if(G.app!=='raid'||invOpen)return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='raid'&&!invOpen)pause(true);});
canvas.addEventListener('mousedown',e=>{if(G.app==='raid'&&!locked&&!invOpen)lock();});
addEventListener('mousedown',e=>{if(G.app!=='raid'||!locked)return;if(e.button===0){mouse.l=true;mouse.lEdge=true;}if(e.button===2)mouse.r=true;});
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});
addEventListener('contextmenu',e=>{if(G.app==='raid')e.preventDefault();});
addEventListener('mousemove',e=>{if(!locked)return;mouse.dx+=e.movementX;mouse.dy+=e.movementY;});
addEventListener('wheel',e=>{if(G.app!=='raid'||!locked||!P)return;swapTo(P.cur==='primary'?'secondary':'primary');},{passive:true});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];keys[e.code]=true;if(['Space','Tab','ArrowUp','ArrowDown'].includes(e.code)||(G.app==='raid'&&(e.code==='KeyQ'||e.code==='KeyE'||e.code.startsWith('Control'))))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='paused')pause(false);else if(G.app==='raid'){if(invOpen)closeInv();else pause(true);}return;}
 if(G.app!=='raid'||!first||!P||!P.alive)return;
 if(e.code==='Tab'){if(invOpen)closeInv();else{G.loot=null;openInv();}return;}
 if(invOpen){if(e.code==='KeyF'||e.code==='KeyI')closeInv();return;}
 if(e.code==='KeyF')interact(interactT);if(e.code==='KeyR')startReload();if(e.code==='KeyB')cycleMode();if(e.code==='KeyT')cycleAmmo();if(e.code==='KeyH')smartHeal();if(e.code==='KeyO')hud.showEx(6);
 if(e.code==='KeyL'){P.light=!P.light;snd.click();}if(e.code==='Digit1')swapTo('primary');if(e.code==='Digit2')swapTo('secondary');
 if(e.code==='KeyC')P.crouch=P.crouch?0:1;if(e.code==='Space')P.jump=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
function pause(on){if(on&&G.app==='raid'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlock();}else if(!on&&G.app==='paused'){G.app='raid';$('pause').hidden=true;document.body.classList.add('playing');lock();}}
function swapTo(s){if(!P||P.cur===s||!prof().lo[s])return;P.cur=s;P.swapT=.45;P.reload=0;P.ads=false;P.burst=0;refreshWs();snd.swap();}
function cycleMode(){const s=G.ws;if(!s||s.modes.length<2)return;P.mode[P.cur]=(P.mode[P.cur]+1)%s.modes.length;snd.click();hud.note('FIRE MODE · '+s.modes[P.mode[P.cur]].toUpperCase(),'');}
function ammoTypes(){const w=wpn();if(!w)return[];const cal=WPN[ITEMS[w.id].wid].cal;return AMMO_OF[cal].filter(a=>countId(grids(),a)>0);}
function cycleAmmo(){const w=wpn();if(!w)return;const types=ammoTypes().filter(a=>a!==w.at);if(!types.length){hud.note('NO OTHER AMMO TYPE','');return;}P.nextType=types[0];startReload(true);}
function startReload(force){const w=wpn();if(!w||P.reload>0||P.use||!P.alive)return;const s=G.ws;const type=P.nextType||w.at;const have=countId(grids(),type)+(P.nextType?0:0);
 if(!force&&w.ammo>=s.mag)return;if(have<=0){const other=ammoTypes()[0];if(other&&other!==w.at){P.nextType=other;}else{hud.note('NO '+CAL[s.cal]+' AMMO','k');snd.dry();return;}}
 P.reloadKind=s.tube?'tube':'mag';P.reloadDur=s.tube?s.reload:s.reload*(w.ammo===0?1.15:1);P.reload=.0001;P.ads=false;if(!s.tube)snd.magOut();}
function reloadStep(dt){const w=wpn(),s=G.ws;if(!w){P.reload=0;return;}P.reload+=dt/P.reloadDur;
 if(P.reload>=1){const type=P.nextType||w.at;if(P.nextType&&P.nextType!==w.at&&w.ammo>0){const back=mkItem(w.at,{n:w.ammo});w.ammo=0;if(!autoAdd(prof().lo.pockets,back,'pockets')&&!(prof().lo.bag&&autoAdd(prof().lo.bag.g,back,'bag')))hud.note('DROPPED LOOSE ROUNDS','');}
  w.at=type;P.nextType=null;if(s.tube){const left=takeId(grids(),type,1);if(left===0){w.ammo++;snd.shellIn();}if(w.ammo<s.mag&&countId(grids(),type)>0&&!mouse.l){P.reload=.0001;return;}P.reload=0;snd.pump();}
  else{const need=s.mag-w.ammo;const left=takeId(grids(),type,need);w.ammo+=need-left;P.reload=0;snd.magIn();setTimeout(()=>snd.rack(),120);}}}

/* ================= main simulation ================= */
let acc=0;
function step(dt){dt=Math.min(dt,.1);G.time+=dt;
 if(G.app==='menu'||G.app==='over'){menuCam(dt);fx.update(dt);ambient(dt);animDoors(dt);return;}
 if(G.app==='paused'){return;}
 const raid=G.raid;raid.t+=dt;
 raidStep(dt);if(G.app!=='raid')return;
 const vis=Math.min(170,G.visRange*1.25+10);for(const b of G.bots){b.update(dt);const d=b.pos.distanceTo(cam.position);b.rig.root.visible=d<vis;}
 G.targets=[PT,...G.bots.filter(b=>b.alive)];
 fx.update(dt);animDoors(dt);ambient(dt);
 // loose glints
 for(const l of loose){const s=l.mesh.userData.sp;s.material.opacity=.25+.25*Math.sin(G.time*3+l.x);}
 if(MAP.gateMesh.position.x<39&&G.gateOpen)MAP.gateMesh.position.x=Math.min(39,MAP.gateMesh.position.x+dt*2.2);
 visuals(dt);hud.update(G,dt);}
function animDoors(dt){for(const d of MAP.doors){if(Math.abs(d.ang-d.tgt)>.001){d.ang+=(d.tgt-d.ang)*Math.min(1,dt*7);d.mesh.rotation.y=d.ang;}}}
function raidStep(dt){const raid=G.raid,p=prof();
 // clock
 raid.clock-=dt;if(raid.clock<=0){raid.clock=0;endRaid('mia');return;}
 for(const[t,msg]of[[300,'FIVE MINUTES LEFT'],[60,'ONE MINUTE · GET OUT']])if(raid.clock<t&&!raid.warned[t]){raid.warned[t]=1;hud.banner(msg,'REACH AN OPEN EXTRACT','#ff4d00',2.4);snd.horn();hud.showEx(6);}
 for(const w of raid.waves)if(!w.done&&raid.t>raid.dur*w.t){w.done=true;spawnWave(w.k);}
 // flare pickup timer
 const fl=raid.ex.flare;if(fl.t>0){fl.t-=dt;fl.label='INBOUND '+mmss(fl.t);if(fl.t<=0){fl.t=0;fl.open=true;fl.cond=false;fl.win=60;fl.label='WAITING';hud.banner('PICKUP ON THE PAD','TOWER FLARE EXTRACT OPEN FOR 60 S','#6fe08a',2.6);snd.horn();}}
 else if(fl.open){fl.win-=dt;fl.label='OPEN '+mmss(fl.win);if(fl.win<=0){fl.open=false;fl.cond=true;fl.label='FLARE';hud.note('THE PICKUP LEFT THE PAD','k');}}
 {const n=MAP.named.find(q=>q.id==='beacon');const want=fl.open?n.y+5.5:fl.t>0&&fl.t<12?n.y+5.5+fl.t*4:n.y+70;if(fl.open||fl.t>0&&fl.t<12||heli.visible){if(!heli.visible){heli.visible=true;heli.position.set(n.x-4,n.y+70,n.z);}heli.position.y+=(want-heli.position.y)*Math.min(1,dt*.8);heli.rotation.y=-1.2+Math.sin(G.time*.4)*.08;heli.userData.rot.rotation.y+=dt*24;heli.userData.tr.rotation.x+=dt*30;if(!fl.open&&fl.t<=0&&heli.position.y>n.y+60)heli.visible=false;if(R()<dt*8)snd._n(.12,180,90,.6,.12*Math.min(1,30/(1+heli.position.distanceTo(P.pos))),'lowpass');}}
 if(!P.alive){P.deathT+=dt;P.vel.set(0,P.vel.y-20*dt,0);W.move(P.pos,P.vel,dt,PR,1,P.onGround);$('black').style.opacity=Math.min(1,Math.max(0,(P.deathT-1.4)/1.2));if(P.deathT>2.8){endRaid('kia',P.killer);$('black').style.opacity=0;}return;}
 // input
 readPad();const sens=.0021*(p.opt.sens||1)*(P.adsV>.5?1/Math.max(1,(G.ws?G.ws.zoom:1)*.7):1);if(locked&&!invOpen){P.yaw-=mouse.dx*sens;P.pitch=cl(P.pitch-mouse.dy*sens,-1.5,1.5);}VM.mdx=mouse.dx;VM.mdy=mouse.dy;mouse.dx=mouse.dy=0;
 const s=refreshWs();G.kg=carriedKg();
 // status effects
 P.pain=Math.max(0,P.pain-dt);P.stim=Math.max(0,P.stim-dt);P.hurt=Math.max(0,P.hurt-dt*.8);P.supp=Math.max(0,P.supp-dt*.8);P.punch*=Math.exp(-dt*8);
 for(const k in P.bleed){if(!P.bleed[k])continue;applyDmg(k,P.bleed[k]*dt);if(P.hp.head<=0||P.hp.thorax<=0){playerDie({name:'Blood loss'},k);return;}}
 // use (heal)
 if(P.use){P.use.t+=dt;if(P.use.t>=P.use.dur)finishUse();}
 if(P.reload>0)reloadStep(dt);P.swapT=Math.max(0,P.swapT-dt);P.fireT-=dt;if(P.pumpT>0){P.pumpT-=dt;if(P.pumpT<=0)snd.pump();}
 // movement intent
 const block=invOpen;const fwd=block?0:(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+(G.pad?G.pad.f:0),str=block?0:(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+(G.pad?G.pad.s:0);
 if(!block&&(keys.ControlLeft||keys.ControlRight)){P.crouchHold=true;}else P.crouchHold=false;const crouch=P.crouch||P.crouchHold?1:0;
 const legsBad=(P.frac.lleg||P.frac.rleg||P.hp.lleg<=0||P.hp.rleg<=0)&&P.pain<=0;const heavy=G.kg>KG_HEAVY,over=G.kg>KG_MAX;
 const wantSprint=!block&&(keys.ShiftLeft||keys.ShiftRight||(G.pad&&G.pad.sprint))&&fwd>0&&!legsBad&&!over&&P.stamina>1&&!P.ads&&!P.use;
 P.sprinting=wantSprint&&(P.sprinting||P.stamina>8);if(P.sprinting){P.crouch=0;}
 P.ads=!block&&(mouse.r||(G.pad&&G.pad.ads))&&!P.sprinting&&P.reload<=0&&!P.use&&P.swapT<=0&&!!wpn();
 let sp=P.sprinting?5.7:3.3;if(crouch&&!P.sprinting)sp=1.65;if(P.adsV>.5)sp*=.72;if(P.use)sp*=.55;if(legsBad)sp*=.62;if(heavy)sp*=Math.max(.6,1-(G.kg-KG_HEAVY)*.012);if(over)sp*=.6;if(P.stim>0)sp*=1.1;
 const ml=Math.hypot(fwd,str);let wx=0,wz=0;if(ml>0){const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);wx=(-sy*fwd+cy*str)/ml;wz=(-cy*fwd-sy*str)/ml;}
 const accel=P.onGround?12:2.5;P.vel.x+=(wx*sp-P.vel.x)*Math.min(1,dt*accel);P.vel.z+=(wz*sp-P.vel.z)*Math.min(1,dt*accel);
 if(P.jump){P.jump=false;if(P.onGround&&P.stamina>=10&&!legsBad&&!over){P.vel.y=4.5;P.onGround=false;P.stamina-=12;P.crouch=0;P.stamT=1;}}
 // stamina
 if(P.sprinting&&ml>0){P.stamina=Math.max(0,P.stamina-dt*(P.stim>0?0:13*(1+Math.max(0,G.kg-KG_HEAVY)*.03)));P.stamT=.9;}else{P.stamT-=dt;if(P.stamT<=0)P.stamina=Math.min(100,P.stamina+dt*(heavy?11:19));}
 if(P.stamina<1)P.sprinting=false;
 // lean
 P.lean=block||P.sprinting?0:(keys.KeyE?1:0)-(keys.KeyQ?1:0);
 // physics
 P.vel.y-=20*dt;const wasG=P.onGround;const h=PH-(PH-PHC)*P.crouchV;const res=W.move(P.pos,P.vel,dt,PR,h,P.onGround);P.onGround=res.ground;
 if(!wasG){P.airY=Math.max(P.airY,P.pos.y);}if(P.onGround&&!wasG){const fall=P.airY-P.pos.y;if(fall>3.2){applyDmg(R()<.5?'lleg':'rleg',(fall-3)*14);if(fall>4.5)P.frac[R()<.5?'lleg':'rleg']=1;snd.land(1);hud.note('FALL DAMAGE','k');}else if(fall>.6)snd.land(.4);P.airY=P.pos.y;}if(P.onGround)P.airY=P.pos.y;
 P.speed=Math.hypot(P.vel.x,P.vel.z);P.crouchV+=((crouch&&!P.sprinting?1:0)-P.crouchV)*Math.min(1,dt*9);P.adsV+=((P.ads?1:0)-P.adsV)*Math.min(1,dt/Math.max(.08,s?s.ergo:.2)*2.2);P.leanV+=(P.lean-P.leanV)*Math.min(1,dt*9);
 // footsteps + noise
 if(P.onGround&&P.speed>.6){P.stepD+=P.speed*dt;const stride=P.sprinting?2.1:crouch?1.1:1.6;if(P.stepD>stride){P.stepD=0;const surf=W.surfAt(P.pos.x,P.pos.z,P.pos.y);snd.step(surf,null,P.sprinting?.9:crouch?.25:.55);const r=(P.sprinting?28:crouch?4:13)*(surf===1?1.35:surf===3?.75:1);noise(P.pos,r,'step',PT);}}
 // weapon
 if(s&&!block){if(mouse.lEdge&&P.reload>0&&s.tube&&wpn().ammo>0)P.reload=0;const mode=s.modes[(P.mode[P.cur]||0)%s.modes.length];const want=mode==='auto'?(mouse.l||(G.pad&&G.pad.fire)):(mouse.lEdge||(G.pad&&G.pad.fireEdge));
  if(want&&P.fireT<=0&&P.reload<=0&&!P.use&&P.swapT<=0&&!(P.pumpT>0)){const w=wpn();if(w.ammo>0)playerFire();else if(mouse.lEdge||G.pad&&G.pad.fireEdge){snd.dry();P.fireT=.3;startReload();}}}
 if(!mouse.l)P.burst=0;mouse.lEdge=false;if(G.pad)G.pad.fireEdge=false;
 // recoil recovery
 const rec=G.time-P.lastShot>.1?1:0;P.recP*=Math.exp(-dt*(rec?7:1.2));P.recY*=Math.exp(-dt*(rec?7:1.2));
 // interaction
 interactT=scanInteract();$('prompt').innerHTML=promptFor(interactT);
 // loot search progress
 if(invOpen&&G.loot&&G.loot.c&&G.loot.c.type!=='body'){const c=G.loot.c;if(Math.hypot(c.x-P.pos.x,c.z-P.pos.z)>3.2){closeInv();}else if(!c.searched){c.st+=dt;if(R()<dt*5)snd.rummage();const per=searchPer(c);if(c.st>=per||!c.hidden.size){c.st=0;const first=[...c.hidden][0];if(first)c.hidden.delete(first);if(!c.hidden.size){c.searched=true;}inv.refresh();G.invRT=0;}else if((G.invRT=(G.invRT||0)+dt)>.12){G.invRT=0;inv.refresh();}}}
 if(invOpen&&G.loot&&G.loot.c&&G.loot.c.type==='body'&&Math.hypot(G.loot.c.x-P.pos.x,G.loot.c.z-P.pos.z)>3.2)closeInv();
 // extraction zones
 let inZ=null;for(const e of EXTRACTS){if(!raid.ex[e.id].open)continue;if(Math.hypot(e.x-P.pos.x,e.z-P.pos.z)<e.r)inZ=e;}
 if(inZ){if(raid.exIn!==inZ){raid.exIn=inZ;raid.extT=0;snd.beep(false);}raid.extT+=dt;const left=EXT_T-raid.extT;if(Math.ceil(left)!==Math.ceil(left+dt))snd.beep(left<1.5);$('extbar').hidden=false;$('extn').textContent='EXTRACTING · '+inZ.n;$('extt').textContent=Math.max(0,left).toFixed(1);$('extf').style.width=(raid.extT/EXT_T*100)+'%';if(raid.extT>=EXT_T){endRaid('extracted',{ex:inZ.id});return;}}
 else{raid.exIn=null;raid.extT=0;$('extbar').hidden=true;}
 // low hp heartbeat
 const tot=Object.values(P.hp).reduce((a,b)=>a+Math.max(0,b),0);G.hpFrac=tot/440;if(G.hpFrac<.35||P.hp.thorax<25||P.hp.head<12){G.hbT=(G.hbT||0)-dt;if(G.hbT<=0){G.hbT=.9;snd.heart(.7);}}
 if(P.stamina<15){G.brT=(G.brT||0)-dt;if(G.brT<=0){G.brT=1.4;snd.breath(.8);}}
 const hv=Math.round(Math.min(.9,P.hurt*.8+(1-Math.min(1,G.hpFrac/.4))*.35+(Object.values(P.bleed).some(Boolean)?.08+.06*Math.sin(G.time*4):0))*40)/40;if(hv!==G.hurtV){G.hurtV=hv;$('hurt').style.opacity=hv;$('hurt').style.display=hv>0?'':'none';}
 if(G.raid.t%1<dt)questTrack();}
function ambient(dt){const sd=P?Math.abs((P.pos.x)-shoreX(P.pos.z)):Math.abs(cam.position.x-80);const ind=P?W.groundAt(P.pos.x,P.pos.z,P.pos.y+5,.1)>P.pos.y+2.4:false;snd.ambient(dt,{on:G.app==='raid'||G.app==='menu',seaD:sd,rain:variant.rain,indoor:ind,high:P?Math.max(0,P.pos.y/12):.5});}
// gamepad
function readPad(){const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(!gp){G.pad=null;return;}const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.17?v:0;const pr=G.padPrev||{};const btn=i=>!!bt[i]&&(bt[i].pressed||bt[i].value>.4);
 const pad={f:-dz(ax[1]||0),s:dz(ax[0]||0),ads:btn(6),fire:btn(7),sprint:btn(10),fireEdge:btn(7)&&!pr[7]};P.yaw-=dz(ax[2]||0)*.05*(prof().opt.sens||1);P.pitch=cl(P.pitch-dz(ax[3]||0)*.04*(prof().opt.sens||1),-1.5,1.5);
 const ed=i=>btn(i)&&!pr[i];if(ed(2))startReload();if(ed(0))P.jump=true;if(ed(1))P.crouch=P.crouch?0:1;if(ed(3))swapTo(P.cur==='primary'?'secondary':'primary');if(ed(5))interact(interactT);if(ed(4))smartHeal();if(ed(8)){if(invOpen)closeInv();else openInv();}if(ed(9))pause(true);if(ed(12))hud.showEx(6);
 G.padPrev=bt.map(b=>b.pressed);G.pad=pad;}

/* ================= camera + viewmodel ================= */
let menuShot=0,menuT=0;const SHOTS=[{a:[98,5,-34],b:[90,6,26],l:[52,5,-6],v:1},{a:[-96,2,-1.5],b:[-44,2.3,-1.5],l:[20,3,0],v:0},{a:[-6,28,-22],b:[-22,24,-40],l:[-46,22,-82],v:2},{a:[24,3.2,48],b:[6,3.4,40],l:[-36,4,58],v:3},{a:[130,4,40],b:[112,5,20],l:[70,10,10],v:1}];
function menuCam(dt){menuT+=dt;const S=SHOTS[menuShot%SHOTS.length],L=14;const k=Math.min(1,menuT/L),e=k*k*(3-2*k);cam.position.set(S.a[0]+(S.b[0]-S.a[0])*e,S.a[1]+(S.b[1]-S.a[1])*e,S.a[2]+(S.b[2]-S.a[2])*e);cam.lookAt(S.l[0],S.l[1],S.l[2]);cam.fov=55;cam.updateProjectionMatrix();
 const fade=Math.max(0,1-menuT/1.2,(menuT-L+1.2)/1.2);if(G.app==='menu'){const bv=Math.round(fade*.9*25)/25;if(bv!==G.blackV){G.blackV=bv;$('black').style.opacity=bv;}}if(menuT>L){menuT=0;menuShot++;if(G.app==='menu')applyVariant(VARIANTS[SHOTS[menuShot%SHOTS.length].v]);}VM.root.visible=false;sky.mesh.position.copy(cam.position);snd.listener(cam.position.x,cam.position.y,cam.position.z,0);}
function visuals(dt){if(!P)return;shake=Math.max(0,shake-dt*2.5);P.bob+=dt*P.speed*(P.sprinting?1.25:1.7)*(P.onGround?1:0);
 const s=G.ws;const eyeY=P.pos.y+(EYE-(EYE-CEYE)*P.crouchV)+(P.alive?Math.sin(P.bob*2)*.025*Math.min(1,P.speed/3)*(1-P.adsV*.8):-1.2*Math.min(1,P.deathT));
 // lean with wall check
 const rt=tv.set(Math.cos(P.yaw),0,-Math.sin(P.yaw));let lo=P.leanV*.38;if(Math.abs(lo)>.01){const t=W.ray(P.pos.x,eyeY,P.pos.z,rt.x*Math.sign(lo),0,rt.z*Math.sign(lo),Math.abs(lo)+.25,1);if(t!==Infinity)lo=Math.sign(lo)*Math.max(0,t-.25);}P.leanOff=lo;
 cam.position.set(P.pos.x+rt.x*lo,eyeY,P.pos.z+rt.z*lo);const sk=shake*shake*.25+P.supp*.004;
 cam.rotation.set(P.pitch+P.recP+P.punch*.01+(R()-.5)*sk,P.yaw+P.recY+(R()-.5)*sk,-P.leanV*.2+(P.alive?0:Math.min(1,P.deathT)*.9));
 const zoom=s?(1+(s.zoom-1)*P.adsV):1;const aspect=innerWidth/innerHeight;const hf=86/zoom+(P.sprinting?4:0);cam.fov=2*Math.atan(Math.tan(hf*D2R/2)/aspect)/D2R;cam.updateProjectionMatrix();
 const scoped=s&&s.scope&&P.adsV>.92;$('scope').hidden=!scoped;
 sky.mesh.position.copy(cam.position);snd.listener(cam.position.x,cam.position.y,cam.position.z,P.yaw);
 torch.intensity=P.light?14:0;mlight.intensity*=Math.exp(-dt*40);
 VM.root.visible=P.alive&&!scoped&&!invOpen;if(s&&wpn())VM.update({dt,ads:P.ads?1:0,adsSpeed:1/Math.max(.08,s.ergo)*2.2,sprint:P.sprinting&&P.speed>3,speed:P.speed,mdx:VM.mdx||0,mdy:VM.mdy||0,reload:P.reload>0?(P.reloadKind==='tube'?(P.reload%1):P.reload):-1,low:P.use?1:0,lean:P.leanV,eyeZ:WPN[ITEMS[wpn().id].wid].eyeZ,onGround:P.onGround,medItem:!!P.use});
 // progress ring for meds
 if(P.use){$('prog').hidden=false;$('progc').setAttribute('stroke-dasharray',(P.use.t/P.use.dur*163).toFixed(1)+' 200');$('progt').textContent='USING '+ITEMS[P.use.it.id].s;}else $('prog').hidden=true;
 // rain follows camera
 rain.U.uT.value=G.time;rain.U.uC.value.copy(cam.position);}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible||G.app!=='raid'&&G.app!=='paused')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;Rr.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.8));fxStack=null;fxSize='';sun.castShadow=q>0;const ms=q>=2?2048:1024;sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}Rr.shadowMap.needsUpdate=true;
 grass.visible=q>0;grass.count=q>=2?grassN:Math.floor(grassN*.55);}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(Rr.domElement.width!==Math.floor(w*Rr.getPixelRatio())||Rr.domElement.height!==Math.floor(h*Rr.getPixelRatio()))Rr.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();
 const sc=h*Rr.getPixelRatio()/(2*Math.tan(cam.fov*D2R/2));fx.dust.U.uScale.value=fx.spark.U.uScale.value=sc;sea.U.uT.value=G.time;sky.U.uT.value=G.time;
 // shadow camera follows the view, snapped to texels
 const c=P&&G.app!=='menu'?P.pos:cam.position;const S=46,ms=sun.shadow.mapSize.x,tex=2*S/ms;sun.target.position.set(Math.round(c.x/tex)*tex,0,Math.round(c.z/tex)*tex);sun.position.copy(sun.target.position).addScaledVector(sunDir,160);sun.target.updateMatrixWorld();
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<4)Rr.shadowMap.needsUpdate=true;
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(Rr,scene,cam,{exposure:variant.exp,bloom:.32,bloomThreshold:.92,bloomRadius:.4,saturation:.96,tint:variant.id==='golden'?0xfff0e0:0xf2f4f8,vignette:.42,grain:.035,aoStrength:.9,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade){const hf=G.app==='raid'&&P&&P.alive?Math.min(1,(G.hpFrac??1)/.45):1;fxStack.grade.uniforms.sat.value=.96*(.35+.65*hf);}
 if(fxStack.composer)fxStack.render();else{Rr.autoClear=true;Rr.render(scene,cam);if(VM.root.visible&&(G.app==='raid')){Rr.autoClear=false;Rr.clearDepth();Rr.render(vmScene,vmCam);Rr.autoClear=true;}}}

/* ================= menu wiring ================= */
function seg(id,key,num=true){const el=$(id);const set=(v,init)=>{prof().opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(num?+b.dataset.v:b.dataset.v)===String(v)));if(!init){saveProfile(prof());snd.click();}};set(prof().opt[key],true);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(num?+b.dataset.v:b.dataset.v));}
seg('o-var','var');seg('o-time','time');seg('o-diff','diff');seg('o-sens','sens');
$('go').onclick=()=>{snd.init();startRaid();};$('freekit').onclick=()=>{freeKit(prof());saveProfile(prof());snd.buy();ui.raidPane();};
$('again').onclick=()=>{snd.click();toMenu();};$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{G.app='raid';$('pause').hidden=true;endRaid('mia',{abandon:true});};
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: EXFIL\nRaid score: ${a.pts||0}\nResult: ${a.kind||''}${a.ex?' via '+a.ex:''}\nKills: ${a.kills||0} · Loot found: ${a.found||0} CR\nSurvival streak: ${a.streak||0}\nHostiles: ${a.diff||''} · ${a.cond||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore('exfil',a.pts||0,body);};
addEventListener('pointerdown',()=>snd.init(),{once:true});

/* ================= boot + loop ================= */
applyVariant(VARIANTS[1]);toMenu();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.EXFIL={get state(){return G.app;},get app(){return G.app;},G,get P(){return P;},get player(){return P;},get bots(){return G.bots;},get raid(){return G.raid;},get prof(){return prof();},MAP,W,nav,scene,cam,R:Rr,
 step,render,start:o=>startRaid(o||{}),toMenu,endRaid,pause,setQuality:applyQuality,get gfx(){return gfx;},
 setClock(s){if(G.raid)G.raid.clock=s;},god(v=true){G.god=v;},
 teleport(x,z,y){P.pos.set(x,y??W.groundAt(x,z,60,.3),z);P.vel.set(0,0,0);P.airY=P.pos.y;},look(yaw,pitch=0){P.yaw=yaw;P.pitch=pitch;},
 aimAt(t){const tp=t.aimPoint?t.aimPoint(new V(),false):t;const e=new V(P.pos.x,P.pos.y+EYE-(EYE-CEYE)*P.crouchV,P.pos.z);const dx=tp.x-e.x,dz=tp.z-e.z,dy=tp.y-e.y;P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(dy,Math.hypot(dx,dz));P.recP=P.recY=0;},
 fire(){if(!G.ws||wpn().ammo<=0)return false;P.fireT=0;playerFire();return true;},
 killAll(){for(const b of G.bots)if(b.alive){b.hp.thorax=0;killBot(b,'player',false,'RIFLE');}},
 damagePlayer(n,part='thorax'){hurtPlayer(part,n,100,{name:'Test'},null);},
 extract(id){const e=EXTRACTS.find(x=>x.id===(id||'tunnel'));G.raid.ex[e.id].open=true;P.pos.set(e.x,W.groundAt(e.x,e.z,40,.3),e.z);},
 openGate,interact:()=>interact(interactT),get target(){return interactT;},openLoot,closeInv,
 give(id,n){const d=ITEMS[id];const it=mkItem(id,d.stack?{n:n||d.stack}:{});return pickUp(it)?it:null;},
 searchAll(){for(const c of MAP.conts){if(c.hidden)c.hidden.clear();c.searched=true;}},
 spawnBot:(fac,x,z)=>spawnBot(fac,x,z),noise,mouse,keys,inv,ui,hud,fx,snd,VM,startReload,smartHeal,useItem,swapTo,applyVariant,VARIANTS,EXTRACTS,SPAWNS,
 get loose(){return loose;},get conts(){return MAP.conts;},get bodies(){return G.bodies;}};
