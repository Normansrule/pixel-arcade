// NOVA ARENA — fast sci-fi arena FPS vs CPU fighters. Original game for Pixel Arcade.
// Shields + health, jetpack, double jump, slide, sprint; six weapons on racks; frag + sticky plasma grenades; overshield, speed, camo;
// three arenas; Free-for-all, Team Slayer 4v4, King of the Hill; medals, streaks, results.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {V,cl,rnd,rr,wrapA,damp,fmt} from './util.js';
import {MAPS,buildMap} from './maps.js';
import {PHY} from './world.js';
import {buildScene} from './scene.js';
import {Fighter3D} from './actors.js';
import {WPN,NADE,SPAWN_KIT,gunModel,Viewmodel} from './weapons.js';
import {Particles,Beams,Shocks,Decals,LightPool} from './fx.js';
import {Sound} from './sound.js';
import {BOTDIFF,CALLSIGNS,newBrain,think} from './ai.js';
import {HUD,TEAMCSS} from './hud.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const $=id=>document.getElementById(id),C=(r,g,b)=>new THREE.Color(r,g,b);
const MODES={ffa:{n:'FREE-FOR-ALL',caps:[15,25,40],team:false,resp:3,ann:'Free for all'},team:{n:'TEAM SLAYER',caps:[30,50,75],team:true,resp:4,ann:'Team slayer'},koth:{n:'KING OF THE HILL',caps:[60,100,150],team:true,resp:4,ann:'King of the hill'}};
const TEAMS=[{n:'AZURE',armor:0x2a64c8,glow:0x58b8ff},{n:'EMBER',armor:0xc8401a,glow:0xff9a40}];
const FFAC=[[0xd8541a,0xff8a30,'#ff6a1a'],[0x2a64c8,0x58b8ff,'#5fa8ff'],[0x2f9e52,0x60ff9a,'#5fe08a'],[0xc8a020,0xffe060,'#ffd23f'],[0x7a3ec8,0xc890ff,'#c08aff'],[0xc83a7a,0xff70b0,'#ff6fae'],[0x2a9ea8,0x70f0ff,'#5fe0e8'],[0x8a8f9a,0xffffff,'#e0e0e0']];
const STREAKS={3:['IGNITION','#ffb040'],5:['HYPERDRIVE','#ff6a2a'],8:['SUPERNOVA','#ff3d7f'],12:['EVENT HORIZON','#c060ff'],16:['SINGULARITY','#5fd8ff']};
const MULTI=[null,null,'DOUBLE KILL','TRIPLE KILL','QUAD KILL','PENTA KILL','ARENA WIPE'];
const ITEM_T={health:25,nade:20,over:90,camo:75,speed:60};
const tv=new V(),tv2=new V(),tv3=new V(),UP=new V(0,1,0);

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(80,1,.06,9000);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xdfe8ff,0x202430,.55),vmKey=new THREE.DirectionalLight(0xffffff,1.1),vmRim=new THREE.DirectionalLight(0x6fb8ff,.7);vmKey.position.set(-1,2,1);vmRim.position.set(2,.5,-1.5);vmScene.add(vmHemi,vmKey,vmRim);
const VM=new Viewmodel(vmCam);const snd=new Sound();
const parts=new Particles(scene,5000),smoke=new Particles(scene,1400,true),beams=new Beams(scene,128),shocks=new Shocks(scene,10),decals=new Decals(scene,160),lights=new LightPool(scene,5);

/* ================= state ================= */
const G={app:'menu',phase:'countdown',opt:{mode:'ffa',map:0,diff:1,time:8,cap:1,sens:1,fov:100,vol:.8,mus:.6,ann:1},fighters:[],me:null,time:0,clock:480,cdT:3,goT:0,endT:0,teamScore:[0,0],cap:25,M:MODES.ffa,mode:'ffa',
 D:null,W:null,S:null,mapDef:MAPS[0],items:[],proj:[],noise:null,hillIdx:0,hillT:60,hillState:{owner:-1,contested:false},hillAcc:0,hurtFx:0,shake:0,attract:true,firstBlood:false,timeScale:1,lastLead:null,annQ:[],
 aimTarget:null,aimFoe:false,aimAlly:false,ann1min:false,ann30:false,results:null};
try{Object.assign(G.opt,JSON.parse(localStorage.getItem('pxd_novaarena_opt'))||{});}catch(e){}
G.enemy=(a,b)=>a!==b&&(!G.M.team||a.team!==b.team);G.hill=()=>G.mode==='koth'&&G.D?G.D.hills[G.hillIdx]:null;
G.inHill=f=>{const h=G.hill();return h&&f.alive&&Math.hypot(f.pos.x-h.p.x,f.pos.z-h.p.z)<h.r&&f.pos.y>h.p.y-1&&f.pos.y<h.p.y+3.5;};
const hud=new HUD(G);

/* ================= maps ================= */
const mapCache={};let hillMesh=null;
function loadMap(i){const def=MAPS[i];if(G.S)scene.remove(G.S.root);let m=mapCache[i];if(!m){const D=buildMap(def);const S=buildScene(D,R,gfx);m=mapCache[i]={D,S};S.floorMesh=S.solidMeshes.filter(o=>o.material.customProgramCacheKey&&o.material.customProgramCacheKey()==='refl');}
 m.S.sun.castShadow=gfx>0;m.S.mirror.on=gfx>0;m.S.mirror.scale=gfx>=2?.5:.33;G.D=m.D;G.W=m.D.W;G.S=m.S;G.mapDef=def;scene.add(m.S.root);scene.environment=m.S.env;vmScene.environment=m.S.env;scene.fog=m.S.fog;scene.background=m.S.bg;fxStack=null;R.shadowMap.needsUpdate=true;
 for(const it of G.items)if(it.mesh)scene.remove(it.mesh);G.items=[];buildItems();for(const p of G.proj)killProj(p);G.proj=[];parts.clear();smoke.clear();beams.clear();decals.clear();shocks.clear();lights.clear();
 if(!hillMesh){hillMesh=makeHill();scene.add(hillMesh);}hillMesh.visible=false;snd.ambience(def.theme);}
function makeHill(){const U={uT:{value:0},uC:{value:new THREE.Color(1,1,1)}};const m=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,48,1,true),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uT;uniform vec3 uC;varying vec2 vU;void main(){float s=fract(vU.y*4.-uT*.8);float a=pow(1.-vU.y,2.2)*.9+smoothstep(.0,.06,s)*smoothstep(.2,.06,s)*.35*(1.-vU.y);gl_FragColor=vec4(uC*a,1.);}'}));
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.012,6,64),new THREE.MeshBasicMaterial({color:0xffffff}));ring.rotation.x=Math.PI/2;ring.position.y=-.48;m.add(ring);m.userData={U,ring};return m;}

/* ================= items (racks, power-ups, health, grenades) ================= */
const pedGeo=new THREE.CylinderGeometry(.55,.7,.22,24),ringGeo=new THREE.TorusGeometry(.62,.035,6,40);
function itemMesh(kind,w){const g=new THREE.Group();const S=G.S;const col=kind==='rack'?WPN[w].col:{over:0xffc840,camo:0x9fd8ff,speed:0x60ff9a,health:0xffffff,nade:0xff8a30}[kind==='power'?w:kind];
 const ped=new THREE.Mesh(pedGeo,new THREE.MeshStandardMaterial({color:0x2a2f38,roughness:.35,metalness:.9}));ped.position.y=.11;ped.receiveShadow=true;g.add(ped);
 const rm=new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(2.2)});const ring=new THREE.Mesh(ringGeo,rm);ring.rotation.x=Math.PI/2;ring.position.y=.23;g.add(ring);
 const hold=new THREE.Group();hold.position.y=1;g.add(hold);let body;
 if(kind==='rack'){body=gunModel(w);body.scale.setScalar(1.25);body.rotation.y=Math.PI/2;}
 else if(kind==='power'){body=new THREE.Mesh(new THREE.IcosahedronGeometry(.36,2),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:1.6,roughness:.1,metalness:.3,transparent:true,opacity:.92}));
  const sh=new THREE.Mesh(new THREE.IcosahedronGeometry(.5,1),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(1.4),wireframe:true,transparent:true,opacity:.5,blending:THREE.AdditiveBlending}));body.add(sh);}
 else if(kind==='health'){body=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.3,metalness:.2});body.add(new THREE.Mesh(new THREE.BoxGeometry(.6,.4,.4),m));const cm=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.6,.5)});
  for(const s of[-1,1]){const a=new THREE.Mesh(new THREE.BoxGeometry(.32,.08,.02),cm);a.position.z=s*.21;body.add(a);const b=new THREE.Mesh(new THREE.BoxGeometry(.08,.32,.02),cm);b.position.z=s*.21;body.add(b);}}
 else{body=new THREE.Group();for(const[x,c]of[[-.16,0x3a3f48],[.16,0x2a6cff]]){const s=new THREE.Mesh(new THREE.SphereGeometry(.14,16,12),new THREE.MeshStandardMaterial({color:c,roughness:.3,metalness:.6,emissive:x>0?0x1a50ff:0x000000,emissiveIntensity:x>0?1.2:0}));s.position.x=x;body.add(s);}}
 hold.add(body);body.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.userData={hold,ring,rm,col};return g;}
function buildItems(){const D=G.D;
 for(const r of D.racks)G.items.push({kind:'rack',w:r.w,p:r.p,resp:r.t??(WPN[r.w].power?(r.w==='rail'||r.w==='plasma'||r.w==='blade'?60:45):20),ready:true,t:0});
 for(const r of D.powers)G.items.push({kind:'power',w:r.type,p:r.p,resp:ITEM_T[r.type],ready:true,t:0});
 for(const r of D.health)G.items.push({kind:'health',p:r.p,resp:ITEM_T.health,ready:true,t:0});for(const r of D.nades)G.items.push({kind:'nade',p:r.p,resp:ITEM_T.nade,ready:true,t:0});
 for(const it of G.items){it.mesh=itemMesh(it.kind,it.w);it.mesh.position.copy(it.p);scene.add(it.mesh);}}
function dropWeapon(f,w,p){if(!w||(w.mag+w.res<=0&&!WPN[w.id].noReload)||WPN[w.id].noReload&&w.mag<=0)return;const it={kind:'rack',w:w.id,p:p.clone(),drop:true,life:25,mag:w.mag,res:w.res,ready:true,t:0};
 const g=new THREE.Group();const b=gunModel(w.id);b.scale.setScalar(1.15);b.rotation.set(0,Math.random()*6,Math.PI/2);b.position.y=.12;g.add(b);g.position.copy(p);g.userData={hold:null};it.mesh=g;scene.add(g);G.items.push(it);}
function updateItems(dt){for(let i=G.items.length-1;i>=0;i--){const it=G.items[i],m=it.mesh,u=m.userData;
  if(it.drop){it.life-=dt;if(it.life<=0||!it.ready){scene.remove(m);G.items.splice(i,1);continue;}}
  else if(!it.ready){it.t-=dt;if(it.t<=0){it.ready=true;if(it.kind==='power'||WPN[it.w]?.power)feedSys(it.kind==='power'?POWN[it.w]+' READY':WPN[it.w].name+' ONLINE');}}
  if(u.hold){u.hold.visible=it.ready;u.hold.rotation.y+=dt*1.2;u.hold.position.y=1+Math.sin(G.time*2+it.p.x)*.08;u.rm.color.set(u.col).multiplyScalar(it.ready?2.2+Math.sin(G.time*4)*.6:.25);}
  if(!it.ready)continue;
  for(const f of G.fighters){if(!f.alive)continue;const dx=f.pos.x-it.p.x,dz=f.pos.z-it.p.z,dy=f.pos.y-it.p.y;if(dx*dx+dz*dz>1.5||dy<-1||dy>1.8)continue;if(pickup(f,it))break;}}}
const POWN={over:'OVERSHIELD',camo:'ACTIVE CAMO',speed:'SPEED BOOST'};
function consume(it){if(it.drop){it.ready=false;return;}it.ready=false;it.t=it.resp;}
function pickup(f,it){const me=f===G.me;
 if(it.kind==='health'){if(f.health>=100)return false;f.health=100;consume(it);if(me){snd.play('pickup');hud.flash(.15);hudMsg('HEALTH RESTORED');}return true;}
 if(it.kind==='nade'){if(f.nades.frag>=3&&f.nades.plasma>=2)return false;f.nades.frag=Math.min(3,f.nades.frag+2);f.nades.plasma=Math.min(2,f.nades.plasma+1);consume(it);if(me)snd.play('pickup');return true;}
 if(it.kind==='power'){if(it.w==='over')f.over=100;else if(it.w==='camo')f.camoT=30;else f.speedT=20;consume(it);snd.play('power',f.pos);if(me){hud.banner(POWN[it.w],'',it.w==='over'?'#ffc840':it.w==='camo'?'#9fd8ff':'#60ff9a',1.6);ann(POWN[it.w].toLowerCase());}else feedSys(f.name+' · '+POWN[it.w]);return true;}
 const d=WPN[it.w],have=f.weapons.find(w=>w.id===it.w);
 if(have){if(d.noReload){if(have.mag>=d.mag)return false;have.mag=d.mag;}else{const cap=d.res+d.mag;if(have.res>=d.res)return false;have.res=Math.min(d.res,have.res+(it.drop?it.mag+it.res:d.res));}consume(it);if(me){snd.play('pickup');hudMsg(d.name+' AMMO');}return true;}
 const fresh={id:it.w,mag:it.drop?it.mag:d.mag,res:it.drop?it.res:d.noReload?0:Math.round(d.res*.5)};
 if(f.weapons.length<2){f.weapons.push(fresh);setWeapon(f,f.weapons.length-1);consume(it);if(me){snd.play('pickup');hudMsg(d.name);}return true;}
 // full: swap (player holds E, bots swap for better tiers)
 const cur=f.weapons[f.wi];if(me){f.near={it,name:d.name};if(f.inp.interact&&f.swapHold>.18){dropWeapon(f,cur,f.pos);f.weapons[f.wi]=fresh;setWeapon(f,f.wi);consume(it);snd.play('pickup');hudMsg(d.name);f.swapHold=-1;return true;}return false;}
 if(!f.human){const curTier=WPN[cur.id].tier-(cur.mag+cur.res===0?5:0),other=f.weapons[1-f.wi];const slot=WPN[other.id].tier<WPN[cur.id].tier||other.mag+other.res===0?1-f.wi:f.wi;
  if(d.tier>Math.min(WPN[f.weapons[0].id].tier,WPN[f.weapons[1].id].tier)||cur.mag+cur.res===0){dropWeapon(f,f.weapons[slot],f.pos);f.weapons[slot]=fresh;setWeapon(f,slot);consume(it);return true;}}
 return false;}

/* ================= fighters ================= */
const blankInput=()=>({fwd:0,side:0,jump:false,jumpEdge:false,sprint:false,slide:false,fire:false,zoom:false,reload:false,melee:false,nade:false,swap:false,interact:false});
function makeFighter(name,team,human,diff,ci){let armor,glow,css;if(G.M.team){armor=TEAMS[team].armor;glow=TEAMS[team].glow;css=TEAMCSS[team];}else{[armor,glow,css]=FFAC[ci%FFAC.length];}
 const f={name,team,human,css,pos:new V(),vel:new V(),yaw:0,pitch:0,r:PHY.r,h:PHY.h,onGround:false,inp:blankInput(),alive:false,respawnT:0,shield:100,health:100,over:0,shDelay:0,weapons:[],wi:0,nades:{frag:2,plasma:1},nadeSel:'frag',
  fuel:1,fuelDelay:0,dbl:false,jumpHeldT:0,coyote:0,slideT:0,slideCD:0,fireCD:0,burstLeft:0,burstT:0,reloadT:0,swapT:0,swapMid:false,meleeT:0,meleeCD:0,nadeCD:0,chargeT:0,zoom:0,spread:.01,speedT:0,camoT:0,camo:0,lastFire:-9,
  padCD:0,teleCD:0,airT:0,landDip:0,recoil:0,lunge:null,lastHitBy:null,lastHitT:-9,dmgBy:new Map(),swapHold:0,jetting:false,stepT:0,jetSndT:0,spawnT:0,
  stats:{kills:0,deaths:0,assists:0,score:0,shots:0,hits:0,heads:0,dmg:0,medals:{},best:0,hill:0,suicides:0},streak:0,multi:0,multiT:0,lastKiller:null,killedBy:null,killedWith:'',
  model:new Fighter3D(armor,glow),ai:human?null:newBrain(BOTDIFF[diff]),guns:{}};
 f.model.root.visible=false;scene.add(f.model.root);G.fighters.push(f);return f;}
function clearFighters(){for(const f of G.fighters){scene.remove(f.model.root);}G.fighters=[];G.me=null;}
function setWeapon(f,i){f.wi=i;f.reloadT=0;f.chargeT=0;f.burstLeft=0;f.zoom=0;const w=f.weapons[i];if(!w)return;if(!f.guns[w.id]){const g=gunModel(w.id);g.scale.setScalar(.85);f.guns[w.id]=g;}f.model.setGun(f.guns[w.id]);if(f.camoT>0)f.model.setCamo(f.model.camo+.001);
 if(f===G.me){VM.set(w.id);}}
function spawn(f){const D=G.D;let best=null,bs=-1e9;const cands=D.spawns.filter(s=>!G.M.team||s.team===f.team||s.team<0);
 for(const s of cands){let md=1e9,ally=1e9;for(const o of G.fighters){if(o===f||!o.alive)continue;const d=o.pos.distanceTo(s.p);if(G.enemy(f,o)){md=Math.min(md,d);}else ally=Math.min(ally,d);}
  let sc=Math.min(md,42)+rnd(10);if(G.M.team&&s.team===f.team)sc+=10;if(md<10)sc-=40;if(ally<1.5)sc-=30;if(sc>bs){bs=sc;best=s;}}
 f.pos.copy(best.p);f.vel.set(0,0,0);f.yaw=best.yaw;f.pitch=0;f.alive=true;f.shield=100;f.health=100;f.over=0;f.shDelay=0;f.fuel=1;f.slideT=0;f.h=PHY.h;f.speedT=0;f.camoT=0;f.camo=0;f.model.setCamo(0);f.lunge=null;f.recoil=0;
 f.weapons=SPAWN_KIT.map(id=>({id,mag:WPN[id].mag,res:WPN[id].mag*3}));f.nades={frag:2,plasma:1};f.dmgBy.clear();f.spawnT=.6;f.streak=0;f.zoom=0;f.reloadT=f.swapT=f.meleeT=0;setWeapon(f,0);
 f.model.revive();f.model.root.visible=f!==G.me;if(f.ai){f.ai.path=null;f.ai.target=null;f.ai.goalT=0;}
 parts.burst(tv.copy(f.pos).setY(f.pos.y+1),40,6,C(.6,1.4,2.8),.25,.6,{up:true,grav:-2});if(f===G.me){snd.play('spawn');hud.flash(.35);}else snd.play('spawn',f.pos,.6);}
const eyeOf=(f,o=new V())=>o.set(f.pos.x,f.pos.y+(f.slideT>0||f.h<1.5?PHY.eyeSlide:PHY.eye),f.pos.z);
const dirOf=(yaw,pitch,o=new V())=>o.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));

function stepFighter(f,dt){const inp=f.inp;
 if(!f.alive){if(G.phase==='play'||G.attract){f.respawnT-=dt;if(f.respawnT<=0)spawn(f);}return;}
 const frozen=G.phase==='countdown'&&!G.attract;f.spawnT-=dt;
 // shields
 f.shDelay-=dt;if(f.shDelay<=0&&f.shield<100){if(f.shield<=0&&f===G.me)snd.play('recharge');f.shield=Math.min(100,f.shield+(f.shield<=0?60:45)*dt);}
 if(f.over>0)f.over=Math.max(0,f.over-dt*1.2);if(f.speedT>0)f.speedT-=dt;if(f.camoT>0){f.camoT-=dt;const k=f.lastFire>G.time-.8?.45:Math.min(1,.45+(G.time-f.lastFire-.8)*.8);f.model.setCamo(f.camoT>0?k:0);}
 // ---- movement ----
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);let wx=-sy*inp.fwd+cy*inp.side,wz=-cy*inp.fwd-sy*inp.side;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}if(frozen){wx=wz=0;}
 const firingRecently=f.lastFire>G.time-.25||f.chargeT>0;const sprint=inp.sprint&&inp.fwd>.3&&!firingRecently&&f.zoom<.3&&!f.reloadT;f.sprinting=sprint&&f.onGround;
 let spd=sprint?PHY.sprint:PHY.walk;if(f.speedT>0)spd*=1.32;if(f.zoom>.5)spd*=.82;
 const hs=Math.hypot(f.vel.x,f.vel.z);f.slideCD-=dt;
 if(inp.slide&&f.onGround&&hs>5.5&&f.slideCD<=0&&f.slideT<=0&&!frozen){f.slideT=PHY.slideT;f.slideCD=1;const k=Math.max(hs,PHY.slide)/hs;f.vel.x*=k;f.vel.z*=k;f.h=PHY.hSlide;snd.play('slide',f.pos,f===G.me?1:.6);}
 if(f.slideT>0){f.slideT-=dt;const fr=Math.exp(-PHY.slideFric*dt);f.vel.x*=fr;f.vel.z*=fr;f.vel.x+=wx*3*dt;f.vel.z+=wz*3*dt;
  if(f.slideT<=0||hs<3||!f.onGround&&f.slideT<PHY.slideT-.25){if(G.W.free(f.pos.x,f.pos.y+.02,f.pos.z,f.r,PHY.h)){f.slideT=0;f.h=PHY.h;}else f.slideT=Math.max(f.slideT,.05);}
  if(f.onGround&&Math.random()<dt*30)parts.emit(f.pos.x+rnd(.4)-.2,f.pos.y+.05,f.pos.z+rnd(.4)-.2,(Math.random()-.5),1+rnd(1),(Math.random()-.5),1.4,.9,.5,.08,.35,4);}
 else if(f.onGround){const k=Math.min(1,PHY.accel*dt);f.vel.x+=(wx*spd-f.vel.x)*k;f.vel.z+=(wz*spd-f.vel.z)*k;}
 else{const before=Math.hypot(f.vel.x,f.vel.z);f.vel.x+=wx*PHY.airAccel*spd*dt;f.vel.z+=wz*PHY.airAccel*spd*dt;const after=Math.hypot(f.vel.x,f.vel.z),lim=Math.max(before,spd*PHY.airMax);if(after>lim){f.vel.x*=lim/after;f.vel.z*=lim/after;}}
 // jump / double jump / jetpack
 if(f.onGround){f.coyote=.12;f.dbl=true;f.airT=0;}else{f.coyote-=dt;f.airT+=dt;}
 if(inp.jump)f.jumpHeldT+=dt;else f.jumpHeldT=0;
 if(inp.jumpEdge&&!frozen){if(f.coyote>0){f.vel.y=PHY.jump;f.coyote=0;f.onGround=false;f.jumpHeldT=0;if(f.slideT>0){f.slideT=0;f.h=PHY.h;}snd.play('jump',f.pos,f===G.me?1:.6);}
  else if(f.dbl){f.dbl=false;f.vel.y=Math.max(f.vel.y,PHY.djump);f.jumpHeldT=0;parts.burst(tv.copy(f.pos),14,4,C(.9,.9,1.2),.2,.4,{grav:-1});snd.play('jump',f.pos,f===G.me?1:.6);}}
 f.jetting=false;if(inp.jump&&!f.onGround&&f.fuel>.01&&f.jumpHeldT>.22&&!frozen){f.jetting=true;f.vel.y=Math.min(f.vel.y+PHY.jet*dt,Math.max(f.vel.y,PHY.jetMax));f.fuel=Math.max(0,f.fuel-PHY.fuelUse*dt);f.fuelDelay=PHY.fuelDelay;
  f.jetSndT-=dt;if(f!==G.me&&f.jetSndT<=0){f.jetSndT=.28;snd.play('jetPuff',f.pos,.7);}const back=tv.set(Math.sin(f.yaw)*.22,1.05,Math.cos(f.yaw)*.22).add(f.pos);
  for(let k=0;k<2;k++)parts.emit(back.x+rnd(.16)-.08,back.y,back.z+rnd(.16)-.08,rnd(1)-.5,-6-rnd(4),rnd(1)-.5,2.6,1.3,.45,.16,.25,0,1);if(Math.random()<dt*20)smoke.emit(back.x,back.y-.3,back.z,rnd(1)-.5,-2,rnd(1)-.5,.5,.5,.55,.5,.9,-1,1.2);}
 else{f.fuelDelay-=dt;if(f.fuelDelay<=0)f.fuel=Math.min(1,f.fuel+PHY.fuelRegen*dt*(f.onGround?1.6:1));}
 const g=PHY.g*G.W.gravAt(f.pos);f.vel.y-=g*dt;if(f.vel.y<-45)f.vel.y=-45;
 if(f.lunge){f.lunge.t-=dt;const tg=f.lunge.target;if(tg&&tg.alive){tv.subVectors(tg.pos,f.pos);const d=tv.length();tv.normalize();f.vel.x=tv.x*f.lunge.v;f.vel.z=tv.z*f.lunge.v;f.vel.y=Math.max(f.vel.y,tv.y*f.lunge.v);if(d<1.5||f.lunge.t<=0){meleeHit(f,tg,f.lunge.blade);f.lunge=null;}}else f.lunge=null;}
 const wasG=f.onGround;const vy0=f.vel.y;G.W.move(f,dt);
 if(f.onGround&&!wasG){const lv=-vy0;if(lv>6){f.landDip=Math.min(.35,lv*.018);snd.play('land',f.pos,f===G.me?1:.6,lv);}}
 if(f.onGround&&hs>2&&f.slideT<=0){f.stepT-=dt*hs*(f.sprinting?.32:.38);if(f.stepT<=0){f.stepT=1;snd.play('step',f.pos,f===G.me?.8:.5);}}
 // pads, teleporters, kill plane
 f.padCD-=dt;f.teleCD-=dt;
 if(f.padCD<=0)for(const p of G.D.pads){if(Math.hypot(f.pos.x-p.x,f.pos.z-p.z)<1.15&&Math.abs(f.pos.y-p.y)<.5){f.vel.set(p.vx,p.vy,p.vz);f.onGround=false;f.padCD=.8;f.dbl=true;f.slideT=0;f.h=PHY.h;snd.play('pad',f.pos);parts.burst(tv.set(p.x,p.y+.2,p.z),40,7,[C(3,1.2,.3),C(2,1.5,.8)],.22,.6,{up:true,grav:4});if(f.ai)f.ai.waitLand=1.8;break;}}
 if(f.teleCD<=0)for(const t of G.D.teles){if(Math.hypot(f.pos.x-t.x,f.pos.z-t.z)<1.05&&Math.abs(f.pos.y-t.y)<.6){const sp=Math.hypot(f.vel.x,f.vel.z);parts.burst(tv.copy(f.pos).setY(f.pos.y+1),50,5,C(.5,1.6,3),.25,.6,{});f.pos.set(t.tx,t.ty+.05,t.tz);f.yaw=t.yaw;f.vel.set(-Math.sin(t.yaw)*sp*.6,0,-Math.cos(t.yaw)*sp*.6);f.teleCD=1.2;
   snd.play('tele',f.pos);parts.burst(tv.copy(f.pos).setY(f.pos.y+1),50,5,C(.5,1.6,3),.25,.6,{});if(f===G.me){hud.flash(.6);G.snapCam=true;}if(f.ai){f.ai.path=null;f.ai.goalT=0;f.ai.waitLand=.3;}break;}}
 if(f.pos.y<G.W.killY){die(f,f.lastHitT>G.time-6?f.lastHitBy:null,{weapon:'fall',fall:true});return;}
 if(frozen)return;
 // ---- weapons ----
 const w=f.weapons[f.wi];if(!w)return;const d=WPN[w.id];
 f.fireCD-=dt;f.meleeCD-=dt;f.nadeCD-=dt;if(f.meleeT>0)f.meleeT-=dt;f.recoil*=Math.exp(-dt*10);
 f.spread=Math.max(d.spr||0,f.spread-dt*(d.sprMax||.02)*2.2);
 f.zoom=damp(f.zoom,inp.zoom&&!f.sprinting&&f.reloadT<=0&&f.swapT<=0&&d.zoom?1:0,16,dt);
 if(f.swapT>0){f.swapT-=dt;if(!f.swapMid&&f.swapT<.22){f.swapMid=true;setWeapon(f,1-f.wi);}if(f.swapT<=0)f.swapT=0;return;}
 if(inp.swap&&f.weapons.length>1&&f.meleeT<=0){f.swapT=.45;f.swapMid=false;f.reloadT=0;f.chargeT=0;f.burstLeft=0;if(f===G.me)snd.play('swap');return;}
 if(f.reloadT>0){f.reloadT-=dt;if(f.reloadT<=0){const take=Math.min(d.mag-w.mag,w.res);w.mag+=take;w.res-=take;f.reloadT=0;}}
 if(inp.reload&&!f.reloadT&&w.mag<d.mag&&w.res>0&&!d.noReload&&f.meleeT<=0){f.reloadT=d.reload;f.chargeT=0;f.burstLeft=0;snd.play('reload',f.pos,f===G.me?1:.6);}
 if(inp.melee&&f.meleeCD<=0&&f.reloadT<=0){melee(f);return;}
 if(inp.nade&&f.nadeCD<=0&&f.meleeT<=0){let k=f.nadeSel;if(f.nades[k]<=0)k=k==='frag'?'plasma':'frag';if(f.nades[k]>0){f.nades[k]--;f.nadeCD=.9;throwNade(f,k);f.lastFire=G.time;}}
 // burst continuation
 if(f.burstLeft>0){f.burstT-=dt;if(f.burstT<=0&&w.mag>0){shoot(f,w,d);f.burstLeft--;f.burstT=d.gap;}else if(w.mag<=0)f.burstLeft=0;}
 const canFire=f.reloadT<=0&&f.meleeT<=0&&!f.lunge&&f.spawnT<.3;
 if(d.noReload&&w.mag<=0&&!f.lunge&&f.meleeT<=0){f.weapons.splice(f.wi,1);setWeapon(f,0);return;}
 if(d.charge&&inp.fire&&canFire&&w.mag<=0&&f.fireCD<=0){if(w.res>0){f.reloadT=d.reload;snd.play('reload',f.pos,f===G.me?1:.6);}else{if(f===G.me)snd.play('empty');f.fireCD=.4;}}
 else if(d.charge){if(inp.fire&&canFire&&f.fireCD<=0&&w.mag>0){if(f.chargeT===0)snd.play('charge',f.pos,f===G.me?1:.7);f.chargeT+=dt;if(f.chargeT>=d.charge){shoot(f,w,d);f.chargeT=0;f.fireCD=d.rate;}}else f.chargeT=Math.max(0,f.chargeT-dt*3);}
 else if(inp.fire&&canFire&&f.fireCD<=0&&f.burstLeft<=0){
  if(w.mag<=0){if(w.res>0&&!d.noReload){f.reloadT=d.reload;snd.play('reload',f.pos,f===G.me?1:.6);}else{if(f===G.me)snd.play('empty');f.fireCD=.3;if(d.noReload){f.weapons.splice(f.wi,1);setWeapon(f,0);}}}
  else if(d.melee){f.fireCD=d.rate;bladeSwing(f,w);}
  else if(d.burst){f.burstLeft=d.burst;f.burstT=0;f.fireCD=d.rate;}else{shoot(f,w,d);f.fireCD=d.rate;}}
 if(w.mag<=0&&!d.noReload&&w.res>0&&!f.reloadT&&!inp.fire&&f.fireCD<0&&f.burstLeft<=0){f.reloadT=d.reload;snd.play('reload',f.pos,f===G.me?1:.6);}}

/* ================= combat ================= */
// ray vs fighters: nearest hit before maxT (head sphere + body capsule)
function rayFighters(o,d,maxT,skip,all){const out=[];for(const f of G.fighters){if(f===skip||!f.alive)continue;const low=f.h<1.5;
  const hx=f.pos.x-o.x,hy=f.pos.y+(low?.9:1.62)-o.y,hz=f.pos.z-o.z;const tc=hx*d.x+hy*d.y+hz*d.z;if(tc<-1||tc>maxT+1)continue;const d2=hx*hx+hy*hy+hz*hz-tc*tc;let best=null;
  if(d2<.24*.24){const t=tc-Math.sqrt(.24*.24-d2);if(t>0&&t<maxT)best={f,t,head:true};}
  // capsule: segment a..b vertical
  const ay=f.pos.y+.25,by=f.pos.y+(low?.75:1.42),r=.42;const wx=o.x-f.pos.x,wz=o.z-f.pos.z;const A=d.x*d.x+d.z*d.z;if(A>1e-6){const B=wx*d.x+wz*d.z,Cc=wx*wx+wz*wz-r*r,D=B*B-A*Cc;if(D>=0){const t=(-B-Math.sqrt(D))/A;const y=o.y+d.y*t;if(t>0&&t<maxT&&y>ay-r*.5&&y<by+r*.4&&(!best||t<best.t-.04))best={f,t,head:false};}}
  if(best)out.push(best);}
 out.sort((a,b)=>a.t-b.t);return all?out:out.slice(0,1);}
function muzzleOf(f,o=new V()){if(f===G.me&&G.app!=='menu'&&VM.root.visible){const g=VM.guns[f.weapons[f.wi].id];const md=g?.userData.muzzle||new V(0,0,-.7);
  // viewmodel muzzle -> screen position (viewmodel camera) -> point 1.1 m along that screen ray in the world camera
  VM.root.updateWorldMatrix(true,true);o.copy(md).applyMatrix4(g.matrixWorld).applyMatrix4(vmCam.matrixWorldInverse).applyMatrix4(vmCam.projectionMatrix);o.z=.5;cam.updateMatrixWorld();o.unproject(cam).sub(cam.position).normalize().multiplyScalar(1.1).add(cam.position);return o;}
 if(f===G.me)return eyeOf(f,o).addScaledVector(dirOf(f.yaw,f.pitch,tv3),.8);
 f.model.gunMount.updateWorldMatrix(true,false);return o.set(0,.03,-.62).applyMatrix4(f.model.gunMount.matrixWorld);}
function shoot(f,w,d){w.mag--;f.lastFire=G.time;G.noise={p:f.pos.clone(),t:G.time,who:f};f.stats.shots++;const me=f===G.me;
 const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());const right=new V(Math.cos(f.yaw),0,-Math.sin(f.yaw)),up=new V().crossVectors(right,fw);
 const moving=Math.hypot(f.vel.x,f.vel.z)>2?1.3:1,air=f.onGround?1:1.6,zm=1-f.zoom*.55;const spr=(d.pel?d.spr:f.spread)*moving*air*zm*(d.pel?1:1);
 const mz=muzzleOf(f,new V());let hitAny=false;
 if(d.proj){const dir=fw.clone();const p=eye.clone().addScaledVector(fw,.6);spawnPlasma(f,p,dir,d);}
 else{const n=d.pel||1;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*spr;const dir=fw.clone().addScaledVector(right,Math.cos(a)*r).addScaledVector(up,Math.sin(a)*r).normalize();
   const ho={n:new V()};const wt=G.W.ray(eye,dir,d.range,ho);const hits=rayFighters(eye,dir,wt,f,d.pierce);let end=wt;
   for(const h of hits){const dist=h.t;let dmg=d.dmg;if(d.fall&&dist>d.fall[0])dmg*=1-(1-d.fall[2])*cl((dist-d.fall[0])/(d.fall[1]-d.fall[0]),0,1);
    let hm=1;if(h.head)hm=d.precision||d.scope?(h.f.shield>0?1.25:d.hs):d.hs;const hp=eye.clone().addScaledVector(dir,h.t);
    damage(h.f,dmg*hm,f,{head:h.head,weapon:w.id,point:hp,dir,dist});hitAny=true;if(!d.pierce){end=h.t;break;}}
   const ep=eye.clone().addScaledVector(dir,end);const tc=d.tr;
   if(d.scope){beams.beam(mz,ep,[tc[0]*1.2,tc[1]*1.2,tc[2]*1.2],.07,.9);beams.beam(mz,ep,[1.4,1.6,1.5],.018,.35);for(let k=0;k<26;k++){const t=Math.random();tv.lerpVectors(mz,ep,t);smoke.emit(tv.x,tv.y,tv.z,rnd(.4)-.2,rnd(.4),rnd(.4)-.2,.5,.85,.7,.18,1.2,-.3,.8);}lights.flash(mz,0x60ffb0,25,12,.15);}
   else if(i<3||Math.random()<.4)beams.tracer(mz,ep,tc,d.pel?.018:.026,d.pel?260:340,d.pel?4:7);
   if(end>=wt&&wt<d.range){impact(ep,ho.n,d,w.id);}}}
 if(hitAny)f.stats.hits++;
 if(d.spr!==undefined&&!d.pel)f.spread=Math.min(d.sprMax||d.spr,f.spread+(d.sprAdd||0));
 snd.play(w.id==='carbine'?'carbine':w.id==='scatter'?'scatter':w.id==='rail'?'rail':w.id==='plasma'?'plasma':'pulse',me?null:f.pos,me?.9:1);
 f.model.st.kick=1;if(me){VM.fire();f.recoil+=d.kick*.012;G.shake=Math.max(G.shake,d.kick*.08);VM.screen&&w.id==='pulse'&&VM.screen(w.mag,d.mag);}
 else if(!f.ai||Math.random()<.5){lights.flash(mz,d.col,d.scope?20:6,d.scope?10:5,.06);}
 if(f.camoT>0)f.model.setCamo(.45);}
function impact(p,n,d,id){const col=C(...d.tr);parts.burst(p,id==='scatter'?3:8,6,[col,C(2.2,1.8,1.2)],.07,.35,{dir:n,spread:.9,grav:14,drag:2,floor:p.y-2});decals.add(p,n,id==='rail'?.5:.18);
 if(Math.random()<.4)smoke.emit(p.x,p.y,p.z,n.x*.6,n.y*.6+.3,n.z*.6,.35,.35,.38,.4,.9,-.3,1);if(Math.random()<.35)snd.play('tink',p,.5);if(id==='rail'){shocks.fire(p,C(.4,1.8,1),1.6,.35);}}
function spawnPlasma(f,p,dir,d){const m=new THREE.Mesh(boltGeo,boltMat);m.position.copy(p);scene.add(m);const pr={kind:'bolt',pos:p.clone(),vel:dir.clone().multiplyScalar(d.speed).add(tv.copy(f.vel).multiplyScalar(.25)),owner:f,life:4,mesh:m,light:lights.grab(null,0xc060ff,12,9),d};G.proj.push(pr);}
const boltGeo=new THREE.SphereGeometry(.2,16,12),boltMat=new THREE.MeshBasicMaterial({color:C(3,1.2,4)}),fragGeo=new THREE.SphereGeometry(.11,12,10),fragMat=new THREE.MeshStandardMaterial({color:0x3a3f48,roughness:.4,metalness:.8,emissive:0xff4a10,emissiveIntensity:.4}),stickMat=new THREE.MeshBasicMaterial({color:C(.8,1.6,4)});
function throwNade(f,k){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch+.12,new V());const p=eye.addScaledVector(fw,.5);const v=fw.multiplyScalar(19).add(tv.copy(f.vel).multiplyScalar(.6));v.y+=2.5;
 const m=new THREE.Mesh(fragGeo,k==='frag'?fragMat:stickMat);m.position.copy(p);m.castShadow=true;scene.add(m);G.proj.push({kind:k,pos:p.clone(),vel:v,owner:f,life:NADE[k].fuse+(k==='plasma'?2.5:0),fuse:k==='frag'?NADE.frag.fuse:99,mesh:m,light:k==='plasma'?lights.grab(null,0x5fa8ff,6,6):null,stuck:null,bounces:0});
 snd.play('throw',f.pos,f===G.me?1:.7);if(f===G.me)VM.kick=.6;}
function killProj(p){scene.remove(p.mesh);if(p.light)lights.release(p.light);p.dead=true;}
function updateProj(dt){const ho={n:new V()};for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i];p.life-=dt;
  if(p.kind==='bolt'){const step=p.vel.length()*dt,dir=tv.copy(p.vel).normalize();const wt=G.W.ray(p.pos,dir,step,ho);const fh=rayFighters(p.pos,dir,wt+.2,p.life>3.85?p.owner:null);
   if(fh.length){p.pos.addScaledVector(dir,fh[0].t);damage(fh[0].f,p.d.dmg*.35,p.owner,{weapon:'plasma',point:p.pos.clone(),dir:dir.clone(),direct:true});explode(p.pos,p.owner,p.d.sdmg,p.d.splash,p.d.push,'plasma');killProj(p);G.proj.splice(i,1);continue;}
   if(wt<step||p.life<=0){p.pos.addScaledVector(dir,Math.max(0,wt-.15));explode(p.pos,p.owner,p.d.sdmg,p.d.splash,p.d.push,'plasma');killProj(p);G.proj.splice(i,1);continue;}
   p.pos.addScaledVector(dir,step);p.mesh.position.copy(p.pos);if(p.light)p.light.L.position.copy(p.pos);
   for(let k=0;k<3;k++)parts.emit(p.pos.x+rnd(.2)-.1,p.pos.y+rnd(.2)-.1,p.pos.z+rnd(.2)-.1,rnd(1)-.5,rnd(1)-.5,rnd(1)-.5,1.6,.6,2.6,.22,.3);continue;}
  // grenades
  if(p.stuck){if(p.stuck.f){if(!p.stuck.f.alive&&!p.stuck.f.model.dead){}p.pos.copy(p.stuck.f.pos).add(p.stuck.off);}}
  else{p.vel.y-=PHY.g*G.W.gravAt(p.pos)*dt;const step=p.vel.length()*dt;if(step>1e-4){const dir=tv.copy(p.vel).normalize();
    if(p.kind==='plasma'){const fh=rayFighters(p.pos,dir,step+.15,p.life>NADE.plasma.fuse+2.3?p.owner:null);if(fh.length&&fh[0].f!==p.owner){const tf=fh[0].f;p.stuck={f:tf,off:new V(0,1.1,0)};p.fuse=NADE.plasma.fuse;snd.play('stick',tf.pos);if(p.owner===G.me&&tf!==G.me)hudMsg('STUCK!');p.stuckOn=tf;continue;}}
    const wt=G.W.ray(p.pos,dir,step+.11,ho);if(wt<step+.11){p.pos.addScaledVector(dir,Math.max(0,wt-.11));if(p.kind==='plasma'){p.stuck={f:null};p.fuse=NADE.plasma.fuse;p.vel.set(0,0,0);snd.play('stick',p.pos,.6);}
     else{const vn=p.vel.dot(ho.n);p.vel.addScaledVector(ho.n,-1.45*vn).multiplyScalar(.62);if(Math.abs(vn)>3)snd.play('tink',p.pos,.6);if(ho.n.y>.6&&p.vel.length()<1.2)p.vel.set(0,0,0);}}
    else p.pos.addScaledVector(dir,step);}}
  p.fuse-=dt;p.mesh.position.copy(p.pos);if(p.light)p.light.L.position.copy(p.pos);p.mesh.rotation.x+=dt*8;
  if(p.kind==='frag'&&Math.random()<dt*12)parts.emit(p.pos.x,p.pos.y,p.pos.z,0,.5,0,2,.6,.15,.12,.2);if(p.kind==='plasma')parts.emit(p.pos.x,p.pos.y,p.pos.z,rnd(1)-.5,rnd(1)-.5,rnd(1)-.5,.6,1.2,3,.2,.25);
  if(p.fuse<=0||p.life<=0){const N=NADE[p.kind];explode(p.pos,p.owner,N.dmg,N.r,N.push,p.kind,p.stuckOn);killProj(p);G.proj.splice(i,1);}}}
function explode(pos,owner,dmg,radius,push,kind,stuckOn){const purple=kind==='plasma'&&dmg>=150&&radius>4.5,blue=kind==='plasma'&&!purple;const c1=purple?C(2.2,.7,3.2):blue?C(.6,1.3,3.4):C(3.2,1.5,.4),c2=purple?C(1.4,.5,2.4):blue?C(.4,.9,2.4):C(2.4,.6,.1);
 parts.burst(pos,120,15,[c1,c2,C(3,2.6,2)],.5,.7,{grav:3,drag:2.4});parts.burst(pos,40,22,[c1,C(2.6,2.2,1.6)],.1,.9,{grav:16,drag:1.2});for(let k=0;k<18;k++)smoke.emit(pos.x+rnd(1.6)-.8,pos.y+rnd(1.2)-.3,pos.z+rnd(1.6)-.8,rnd(2)-1,rnd(2),rnd(2)-1,.22,.2,.22,1.6+rnd(1),2+rnd(1.2),-.4,1.2);
 shocks.fire(pos,c1.clone().multiplyScalar(.5),radius*1.1,.45);lights.flash(pos,purple?0xc060ff:blue?0x60a0ff:0xff8a30,90,radius*4,.45);snd.play('boom',pos);
 const ho={n:new V()};const gd=G.W.ray(pos,tv.set(0,-1,0),3,ho);if(gd<3)decals.add(pos.clone().setY(pos.y-gd),ho.n,radius*.7);
 const mePos=G.me&&G.me.alive?G.me.pos:cam.position;const dd=mePos.distanceTo(pos);if(dd<radius*4)G.shake=Math.max(G.shake,cl(1-dd/(radius*4),0,1)*.9);
 let kills=0;for(const f of G.fighters){if(!f.alive)continue;const c=tv2.copy(f.pos);c.y+=.9;const d=c.distanceTo(pos);if(d>radius)continue;if(!G.W.los(pos,c)&&!G.W.los(pos,tv3.copy(f.pos).setY(f.pos.y+1.6)))continue;
  const k=1-d/radius,self=f===owner;tv3.subVectors(c,pos).normalize();tv3.y=Math.max(tv3.y,.35);f.vel.addScaledVector(tv3.normalize(),push*(.45+k*.55)*(self?1.25:1));if(self&&f.vel.y>4){f.onGround=false;}
  const am=f===stuckOn?dmg*1.6:dmg*Math.pow(k,.7)*(self?.45:1);const was=f.alive;damage(f,am,owner,{weapon:kind==='plasma'&&radius>4.5?'plasma':kind,point:pos.clone(),dir:tv3.clone(),splash:true,stuck:f===stuckOn});if(was&&!f.alive&&f!==owner)kills++;}
 if(owner&&kills>=2)medal(owner,'MULTI BLAST','#ff8a30','✸');}
function melee(f){f.meleeT=.35;f.meleeCD=.9;snd.play('melee',f.pos,f===G.me?1:.7);
 const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());let best=null,bd=4.4;
 for(const o of G.fighters){if(o===f||!o.alive||!G.enemy(f,o))continue;tv.copy(o.pos).setY(o.pos.y+1).sub(eye);const d=tv.length();if(d>bd)continue;tv.normalize();if(tv.dot(fw)<.55)continue;if(!G.W.los(eye,tv2.copy(o.pos).setY(o.pos.y+1)))continue;best=o;bd=d;}
 if(best){if(bd>1.8)f.lunge={target:best,t:.22,v:15,blade:false};else meleeHit(f,best,false);}}
function bladeSwing(f,w){f.meleeT=.4;snd.play('blade',f.pos,f===G.me?1:.8);const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());let best=null,bd=WPN.blade.lunge;
 for(const o of G.fighters){if(o===f||!o.alive||!G.enemy(f,o))continue;tv.copy(o.pos).setY(o.pos.y+1).sub(eye);const d=tv.length();if(d>bd)continue;tv.normalize();if(tv.dot(fw)<.88)continue;if(!G.W.los(eye,tv2.copy(o.pos).setY(o.pos.y+1)))continue;best=o;bd=d;}
 if(best){w.mag--;if(bd>1.6)f.lunge={target:best,t:.35,v:24,blade:true};else meleeHit(f,best,true);}}
function meleeHit(f,o,blade){if(!o.alive)return;tv.subVectors(o.pos,f.pos).normalize();const back=-Math.sin(o.yaw)*tv.x+-Math.cos(o.yaw)*tv.z>.45;
 const dmg=blade?999:back?999:72;damage(o,dmg,f,{weapon:blade?'blade':'melee',point:tv2.copy(o.pos).setY(o.pos.y+1.2),dir:tv.clone(),melee:true,back,blade});o.vel.addScaledVector(tv,blade?4:6);
 parts.burst(tv2,blade?40:16,blade?9:5,blade?[C(.5,1.8,3.4),C(2,2.6,3)]:[C(2.4,2,1.4)],.12,.4,{grav:6});if(f===G.me)G.shake=Math.max(G.shake,.35);snd.play(blade?'blade':'melee',o.pos);}

function damage(t,amount,att,o={}){if(!t.alive||amount<=0)return;if(att&&att!==t&&G.M.team&&att.team===t.team)return;if(t.spawnT>0&&att!==t)amount*=.3;
 if(att&&att!==t){t.dmgBy.set(att,G.time);t.lastHitBy=att;t.lastHitT=G.time;att.stats.dmg+=amount;}
 const hadShield=t.shield>0;let a=amount;if(t.over>0){const s=Math.min(t.over,a);t.over-=s;a-=s;}if(a>0&&t.shield>0){const s=Math.min(t.shield,a);t.shield-=s;a-=s;}if(a>0)t.health-=a;
 t.shDelay=4.2;const local=tv3.copy(o.point||t.pos).sub(t.pos);local.y-=.95;local.x/=.5;local.y/=1.02;local.z/=.42;local.applyAxisAngle(UP,-t.yaw);
 if(hadShield||t.over>0){t.model.hit(local.normalize(),Math.min(1,amount/40));if(o.point&&!o.splash)parts.burst(o.point,6,4,[C(.6,1.6,3),C(1.4,2.4,3)],.06,.3,{grav:4});snd.play('hitShield',t.pos,t===G.me?.6:.8);}
 else if(o.point&&!o.splash){parts.burst(o.point,8,4,[C(2.4,.7,.2),C(1.2,.2,.1)],.07,.4,{grav:10});snd.play('hitBody',t.pos,.7);}
 if(hadShield&&t.shield<=0&&t.alive){snd.play('shieldBreak',t.pos);parts.burst(tv.copy(t.pos).setY(t.pos.y+1),30,6,[C(.5,1.4,3),C(1.6,2.6,3.2)],.09,.5,{grav:5});if(t===G.me)hud.flash(.12);}
 if(t.ai){t.ai.flinch=.35;if(att&&att!==t&&(!t.ai.target||t.ai.lostT>.5)){t.ai.target=att;t.ai.lastPos.copy(att.pos);t.ai.lostT=0;t.ai.seenT=Math.min(t.ai.seenT,.1);}}
 if(t===G.me){G.hurtFx=Math.min(.7,G.hurtFx+amount/120);G.shake=Math.max(G.shake,Math.min(.4,amount/90));t.zoom=0;if(att&&att!==t){const dx=att.pos.x-t.pos.x,dz=att.pos.z-t.pos.z;hud.damageFrom(wrapA(Math.atan2(-dx,-dz)-t.yaw)*-1);}if(t.shield<=0&&t.health<40&&Math.random()<.3)snd.play('lowShield');}
 const killed=t.health<=0;if(att===G.me&&t!==G.me){hud.hit(killed?'k':o.head?'h':'');snd.play(o.head&&!hadShield||o.head&&killed?'headshot':'hitmark',null,1,killed?1:0);}
 if(killed){t.health=0;if(o.head)att&&att.stats.heads++;die(t,att,o);}}

function die(f,k,o={}){if(!f.alive)return;f.alive=false;f.respawnT=G.M.resp;f.stats.deaths++;f.jetting=false;f.lunge=null;const wname=o.weapon==='fall'?'FELL':o.weapon==='melee'?(o.back?'ASSASSINATED':'BEATDOWN'):o.weapon==='blade'?'ARC BLADE':o.weapon==='frag'?'FRAG GRENADE':o.weapon==='plasma'&&o.stuck?'PLASMA STICK':WPN[o.weapon]?.name||o.weapon?.toUpperCase?.()||'';
 // drop weapon
 const w=f.weapons[f.wi];if(w&&(WPN[w.id].power||Math.random()<.35))dropWeapon(f,w,tv.copy(f.pos).setY(f.pos.y+.05));
 const dir=o.dir?tv.copy(o.dir).setY(0).normalize():tv.set(0,0,1);f.model.kill(dir,o.splash?8:o.melee?6:3);parts.burst(tv2.copy(f.pos).setY(f.pos.y+1),30,5,[C(.6,1.2,2.4),C(2,.8,.3)],.1,.6,{grav:8});snd.play('death',f.pos);
 f.killedBy=k&&k!==f?k:null;f.killedWith=wname;if(f.streak>=5&&k&&k!==f)medal(k,'SHUTDOWN','#ff3d7f','✕');f.streak=0;
 const suicide=!k||k===f;if(suicide){f.stats.score-=1;f.stats.suicides++;if(G.M.team&&G.mode==='team')G.teamScore[f.team]=Math.max(0,G.teamScore[f.team]-1);hud.feed(null,f,o.fall?'FELL':'SELF-DESTRUCT',false,f===G.me);}
 else{k.stats.kills++;k.stats.score++;if(G.mode==='team')G.teamScore[k.team]++;k.streak++;k.stats.best=Math.max(k.stats.best,k.streak);
  // assists
  for(const[a,t]of f.dmgBy)if(a!==k&&a.alive!==undefined&&G.time-t<6&&G.enemy(a,f)){a.stats.assists++;if(a===G.me)hudMsg('ASSIST · '+f.name);}
  // medals
  if(!G.firstBlood){G.firstBlood=true;medal(k,'FIRST STRIKE','#ff4d00','1');}
  if(o.head&&(WPN[o.weapon]?.precision||WPN[o.weapon]?.scope))medal(k,'HEADSHOT','#ffcf3f','◉');
  if(o.weapon==='melee')medal(k,o.back?'ASSASSIN':'BEATDOWN',o.back?'#c060ff':'#ffffff',o.back?'✦':'✊');if(o.blade)medal(k,'CLEAVE','#4ad8ff','⟋');if(o.stuck)medal(k,'TAGGED','#5fa8ff','●');
  if(o.dist>48&&(o.weapon==='rail'||o.weapon==='carbine'))medal(k,'LONGSHOT','#60ffb0','⌖');if(k.lastKiller===f)medal(k,'REVENGE','#ff5a2a','↺'),k.lastKiller=null;
  if(!k.onGround&&k.airT>.4)medal(k,'SKYFALL','#9fd8ff','▲');if(k.alive&&k.health<25)medal(k,'CLOSE CALL','#ff8a30','!');
  if(G.time-k.multiT<4.2)k.multi++;else k.multi=1;k.multiT=G.time;if(k.multi>=2)medal(k,MULTI[Math.min(6,k.multi)],'#ff4d00','×'+k.multi,true);
  if(STREAKS[k.streak]){const[s,c]=STREAKS[k.streak];k.stats.medals[s]=(k.stats.medals[s]||0)+1;if(k===G.me){hud.banner(s,k.streak+' KILLS WITHOUT DYING',c,2.4);snd.play('streak');ann(s.toLowerCase());}else if(k.streak>=8)feedSys(k.name+' · '+s);}
  hud.feed(k,f,wname,o.head,k===G.me||f===G.me);if(k===G.me){snd.play('kill');}f.lastKiller=k;}
 if(f===G.me){G.hurtFx=.8;f.zoom=0;f.model.root.visible=true;camPos.copy(cam.position);}
 checkCap();}
function medal(f,name,col,glyph,multi){if(!f)return;f.stats.medals[name]=(f.stats.medals[name]||0)+1;if(f===G.me){hud.medal(name,col,glyph);snd.play('medal');if(multi||name==='FIRST STRIKE'||name==='HEADSHOT'&&Math.random()<.3||name==='ASSASSIN'||name==='SHUTDOWN')ann(name.toLowerCase());}}
function feedSys(t){const d=document.createElement('div');d.innerHTML=`<span class="w" style="margin:0">${t}</span>`;$('feed').prepend(d);setTimeout(()=>d.remove(),4200);}
let msgT=0;function hudMsg(t){hud.prompt(`<span style="color:#9fe8ff">${t}</span>`);msgT=1.2;}
function ann(t){if(G.attract)return;G.annQ.push(t);}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setMusic(G.opt.mus);snd.annOn=!!G.opt.ann;
 G.attract=false;G.app='play';setupMatch(G.opt.mode,G.opt.map,G.opt.diff,true);G.clock=G.opt.time*60;G.cap=G.M.caps[G.opt.cap];
 $('menu').hidden=$('keys').hidden=$('over').hidden=$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');hud.reset();$('lock').hidden=false;lock();snd.music(G.opt.mus>0,0);ann(G.M.ann);}
function setupMatch(mode,mapI,diff,human){G.mode=mode;G.M=MODES[mode];clearFighters();loadMap(mapI);G.teamScore=[0,0];G.time=0;G.firstBlood=false;G.hillIdx=0;G.hillT=G.M.hillT||60;G.hillState={owner:-1,contested:false};G.hillAcc=0;
 G.ann1min=G.ann30=false;G.lastLead=null;G.annQ=[];G.results=null;G.noise=null;G.timeScale=1;G.endT=0;
 const names=CALLSIGNS.slice().sort(()=>Math.random()-.5);const n=human?8:6;
 for(let i=0;i<n;i++){const team=G.M.team?i%2:i;const isMe=human&&i===0;const f=makeFighter(isMe?'YOU':names.pop(),G.M.team?i%2:i,isMe,diff,i);if(isMe)G.me=f;}
 if(!human)G.me=null;for(const f of G.fighters)spawn(f);
 if(mode==='koth'){hillMesh.visible=true;placeHill();}else hillMesh.visible=false;
 G.phase=human?'countdown':'play';G.cdT=3;G.goT=0;G.lastBeep=4;if(G.me){VM.set(G.me.weapons[0].id);G.snapCam=true;}}
function placeHill(){const h=G.hill();hillMesh.position.set(h.p.x,h.p.y+1.5,h.p.z);hillMesh.scale.set(h.r,3,h.r);}
function attractMode(){G.app='menu';G.attract=true;setupMatch('ffa',G.opt.map,2,false);$('menu').hidden=$('keys').hidden=false;$('over').hidden=$('pause').hidden=$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');snd.music(false);showBest();}
function toMenu(){unlock();attractMode();}
function checkCap(){if(G.attract||G.phase!=='play')return;if(G.M.team){if(G.teamScore[0]>=G.cap||G.teamScore[1]>=G.cap)endMatch();}else if(G.fighters.some(f=>f.stats.score>=G.cap))endMatch();}
function endMatch(){if(G.phase==='end')return;G.phase='end';G.endT=0;snd.play('horn');const win=winner();hud.banner('GAME OVER',win.text,'#ff4d00',3);ann('game over');setTimeout(()=>ann(win.me?'victory':'defeat'),1300);snd.music(false);}
function winner(){if(G.M.team){const[a,b]=G.teamScore;const t=a===b?-1:a>b?0:1;return{team:t,me:G.me&&t===G.me.team,draw:t<0,text:t<0?'DRAW':TEAMS[t].n+' WINS'};}
 const r=G.fighters.slice().sort((a,b)=>b.stats.score-a.stats.score||(b.stats.kills-b.stats.deaths)-(a.stats.kills-a.stats.deaths));const tie=r[1]&&r[0].stats.score===r[1].stats.score&&r[0]!==G.me&&r[1]===G.me;
 return{f:r[0],me:r[0]===G.me,text:r[0].name+' WINS',ranked:r};}
function showOver(){G.app='over';unlock();if(G.me&&G.me.alive){G.me.model.root.visible=true;}$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');const me=G.me,win=winner();
 const ranked=G.fighters.slice().sort((a,b)=>b.stats.score-a.stats.score||(b.stats.kills-b.stats.deaths)-(a.stats.kills-a.stats.deaths));const place=ranked.indexOf(me)+1;
 const ord=n=>n+(['TH','ST','ND','RD'][n%10>3||Math.floor(n%100/10)===1?0:n%10]);
 $('oeye').textContent=`${G.M.n} · ${G.mapDef.name} · ${BOTDIFF[G.opt.diff].n} BOTS`;
 if(G.M.team){$('oplace').textContent=win.draw?'=':win.me?'W':'L';$('ores').textContent=win.draw?'DRAW':win.me?'VICTORY':'DEFEAT';$('ofs').innerHTML=`<span style="color:${TEAMCSS[0]}">AZURE ${Math.floor(G.teamScore[0])}</span> — <span style="color:${TEAMCSS[1]}">EMBER ${Math.floor(G.teamScore[1])}</span> · YOU PLACED ${ord(ranked.filter(f=>f.team===me.team).indexOf(me)+1)} ON YOUR TEAM`;}
 else{$('oplace').textContent=ord(place);$('ores').textContent=place===1?'VICTORY':place<=3?'PODIUM':'DEFEAT';$('ofs').textContent=`${me.stats.score} KILLS · ${place===1?'TOP OF THE ARENA':'WINNER '+ranked[0].name+' · '+ranked[0].stats.score}`;}
 $('oplace').style.color=(G.M.team?win.me:place===1)?'#ff4d00':'#8a8f9a';
 const acc=s=>s.shots?Math.round(s.hits/s.shots*100)+'%':'—';const kd=s=>(s.kills/Math.max(1,s.deaths)).toFixed(2);
 $('stats').innerHTML=`<tr><th>#</th><th>FIGHTER</th><th>SCORE</th><th>KILLS</th><th>DEATHS</th><th>ASSISTS</th><th>K/D</th><th>ACCURACY</th><th>HEADSHOTS</th>${G.mode==='koth'?'<th>HILL</th>':''}<th>BEST STREAK</th><th>MEDALS</th></tr>`+
  ranked.map((f,i)=>`<tr class="${f===me?'me ':''}${G.M.team?'t'+f.team:''}"><td>${i+1}</td><td style="color:${G.M.team?TEAMCSS[f.team]:f.css}">${f.name}</td><td>${f.stats.score}</td><td>${f.stats.kills}</td><td>${f.stats.deaths}</td><td>${f.stats.assists}</td><td>${kd(f.stats)}</td><td>${acc(f.stats)}</td><td>${f.stats.heads}</td>${G.mode==='koth'?`<td>${Math.floor(f.stats.hill)}s</td>`:''}<td>${f.stats.best}</td><td>${Object.values(f.stats.medals).reduce((a,b)=>a+b,0)}</td></tr>`).join('').replace(/<tr><th>#<\/th>/,'<tr><th>#</th>');
 const ms=Object.entries(me.stats.medals).sort((a,b)=>b[1]-a[1]).slice(0,12);$('omedals').innerHTML=ms.length?ms.map(([n,c])=>`<div class="medal"><i>${c}</i><span>${n} <b>×${c}</b></span></div>`).join(''):'<p class="tok" style="margin:0">No medals this match — go get some.</p>';
 const won=G.M.team?win.me:place===1;const tok=award(me,won,place);$('otok').textContent=`+${tok} TOKENS · ${lastAward.pts} PTS · BEST ${best()} PTS`;$('over').hidden=false;G.results={place,won,stats:{...me.stats},team:G.teamScore.slice(),pts:lastAward.pts};}
let lastAward=null;
function award(me,won,place){const s=me.stats,mc=Object.values(s.medals).reduce((a,b)=>a+b,0);const pts=Math.max(0,s.kills*100+s.assists*40+mc*20-s.deaths*10+(won?300:0)+Math.floor(s.hill)*4+(G.M.team?0:Math.max(0,(5-place))*40));
 lastAward={pts,won,place,kills:s.kills,deaths:s.deaths,mode:G.mode,map:G.mapDef.name,diff:BOTDIFF[G.opt.diff].n.toLowerCase(),team:G.teamScore.map(Math.floor).join('-')};
 const tok=5+Math.min(60,pts/40|0);addRound(tok,won);saveBest('novaarena',pts);return tok;}
function best(){return bestScore('novaarena');}
function showBest(){if(typeof segSync!=='undefined')segSync.forEach(f=>f());const b=best();$('best').textContent=b?`YOUR BEST · ${b} PTS`:'';$('mapdesc').textContent=MAPS[G.opt.map].sub+' — '+MAPS[G.opt.map].desc;}

/* ================= game loop ================= */
function stepMatch(dt){
 if(G.phase==='countdown'){G.cdT-=dt;const n=Math.ceil(G.cdT);if(n!==G.lastBeep&&n>0){G.lastBeep=n;snd.play('beep',null,1,0);}if(G.cdT<=0){G.phase='play';G.goT=1.2;snd.play('beep',null,1,1);}}
 else if(G.phase==='play'){G.goT-=dt;if(!G.attract){G.clock-=dt;if(G.clock<=60&&!G.ann1min){G.ann1min=true;ann('one minute remaining');snd.music(G.opt.mus>0,.8);}if(G.clock<=30&&!G.ann30){G.ann30=true;ann('thirty seconds');}if(G.clock<=0){G.clock=0;endMatch();}}
  if(G.mode==='koth')stepHill(dt);leadCheck();}
 else if(G.phase==='end'){G.endT+=dt;G.timeScale=G.endT<1.5?.35:1;if(G.endT>3.2){G.timeScale=1;showOver();}}}
function stepHill(dt){const h=G.hill();G.hillT-=dt;if(G.hillT<=0){G.hillIdx=(G.hillIdx+1+(Math.random()*(G.D.hills.length-1)|0))%G.D.hills.length;G.hillT=G.M.hillT;placeHill();snd.play('hill');ann('hill moved');hud.banner('HILL MOVED','','#ffffff',1.4);return;}
 const inT=[0,0];for(const f of G.fighters)if(G.inHill(f)){inT[f.team]++;f.stats.hill+=dt;}const owner=inT[0]&&!inT[1]?0:inT[1]&&!inT[0]?1:-1;const contested=inT[0]&&inT[1];
 if(owner!==G.hillState.owner&&owner>=0&&!G.attract&&G.me){ann(owner===G.me.team?'hill controlled':'hill contested');}G.hillState={owner,contested:!!contested};
 if(owner>=0){G.teamScore[owner]+=dt;checkCap();}const U=hillMesh.userData.U;U.uC.value.set(owner<0?(contested?0xffcf3f:0xffffff):owner?0xff5a2a:0x3d9bff).multiplyScalar(owner<0?.8:1.4);hillMesh.userData.ring.material.color.copy(U.uC.value).multiplyScalar(1.6);}
function leadCheck(){if(G.attract||!G.me)return;let lead;if(G.M.team){lead=G.teamScore[0]===G.teamScore[1]?null:G.teamScore[0]>G.teamScore[1]?0:1;if(lead!==null&&lead!==G.lastLead&&Math.floor(Math.max(...G.teamScore))>0){ann(lead===G.me.team?'your team has the lead':'your team lost the lead');}}
 else{const r=G.fighters.slice().sort((a,b)=>b.stats.score-a.stats.score);lead=r[0].stats.score>r[1].stats.score?r[0]:null;if(lead&&lead!==G.lastLead&&lead.stats.score>1){if(lead===G.me)ann('you have taken the lead');else if(G.lastLead===G.me)ann('you have lost the lead');}}if(lead!==null&&lead!==undefined)G.lastLead=lead;}
let annT=0;function stepAnn(dt){annT-=dt;if(annT<=0&&G.annQ.length){const t=G.annQ.shift();snd.announce(t);annT=1.1;}}
function step(dt){dt=Math.min(dt,.05);if(G.app==='paused'){visuals(0);return;}
 if(G.app==='over'){G.time+=dt;visuals(dt);return;}
 const sdt=dt*G.timeScale;G.time+=sdt;readInput(dt);
 if(G.app==='play'||G.app==='menu'){stepMatch(dt);
  for(const f of G.fighters){if(f.ai&&f.alive&&(G.phase==='play'||G.attract)&&!G.botsFrozen&&!f.ai.idle)think(f,G,sdt);else if(f.ai)Object.assign(f.inp,blankInput());}
  for(const f of G.fighters)stepFighter(f,sdt);updateProj(sdt);updateItems(sdt);}
 stepAnn(dt);visuals(sdt);}

/* ================= visuals: camera, viewmodel, fx ================= */
let orbitA=0;const camPos=new V();
function visuals(dt){parts.update(dt);smoke.update(dt);beams.update(dt);shocks.update(dt);decals.update(dt);lights.update(dt);if(G.S)G.S.update(G.time);
 if(hillMesh&&hillMesh.visible){hillMesh.userData.U.uT.value=G.time;}
 for(const f of G.fighters){if(f===G.me&&f.alive&&G.app!=='over')continue;f.model.vis=true;if(f.alive||f.model.dead)f.model.pose(f,dt,G.time);}
 G.shake=Math.max(0,G.shake-dt*2.4);G.hurtFx=Math.max(0,G.hurtFx-dt*.9);
 const me=G.me;const aspect=innerWidth/innerHeight;
 if((G.app==='play'||G.app==='paused')&&me){
  if(me.alive){me.landDip=Math.max(0,me.landDip-dt*1.4);const sp=Math.hypot(me.vel.x,me.vel.z);const bob=me.onGround&&me.slideT<=0?Math.sin(G.time*sp*1.1)*Math.min(1,sp/9)*.03:0;
   const eyeT=(me.slideT>0||me.h<1.5?PHY.eyeSlide:PHY.eye);me.eyeH=G.snapCam?eyeT:damp(me.eyeH||eyeT,eyeT,14,dt);G.snapCam=false;
   cam.position.set(me.pos.x,me.pos.y+me.eyeH-me.landDip+bob,me.pos.z);const s=G.shake*G.shake*.05;const strafe=(me.vel.x*Math.cos(me.yaw)-me.vel.z*Math.sin(me.yaw));me.roll=damp(me.roll||0,cl(-strafe*.004,-.03,.03)+(me.slideT>0?.05:0),8,dt);
   cam.rotation.set(me.pitch+me.recoil+(Math.random()-.5)*s,me.yaw+(Math.random()-.5)*s,me.roll);const w=me.weapons[me.wi],d=w&&WPN[w.id];
   const hf=G.opt.fov+(me.sprinting?6:0)+(me.slideT>0?8:0)+(me.speedT>0?4:0);const vf=2*Math.atan(Math.tan(hf*Math.PI/360)/aspect)*180/Math.PI;const zf=d?1+(d.zoom-1)*me.zoom:1;
   cam.fov=damp(cam.fov,2*Math.atan(Math.tan(vf*Math.PI/360)/zf)*180/Math.PI,18,dt);
   if(w){VM.update({dt,mdx:mouseVis.dx,mdy:mouseVis.dy,speed:sp,ground:me.onGround,sprint:me.sprinting,slide:me.slideT>0,air:!me.onGround,reload:me.reloadT>0?1-me.reloadT/d.reload:-1,swap:me.swapT>0?(me.swapT>.22?(.45-me.swapT)/.23:me.swapT/.22):0,melee:me.meleeT>0?1-me.meleeT/(d.melee?.4:.35):0,zoom:me.zoom,charge:d.charge?me.chargeT/d.charge:0,scope:d.scope});if(w.id==='pulse')VM.screen(w.mag,d.mag);}
   VM.root.visible=VM.root.visible&&G.phase!=='end';mouseVis.dx*=.5;mouseVis.dy*=.5;}
  else{// death cam: rise over the body, watch the killer
   const k=me.killedBy;tv.copy(me.pos).add(tv2.set(Math.sin(me.yaw)*4,3.4,Math.cos(me.yaw)*4));camPos.lerp(tv,1-Math.exp(-dt*3));if(camPos.distanceTo(tv)>12)camPos.copy(tv);cam.position.copy(camPos);
   const tgt=k&&k.alive?tv2.copy(k.pos).setY(k.pos.y+1.2):tv2.copy(me.pos).setY(me.pos.y+.5);const m=new THREE.Matrix4().lookAt(cam.position,tgt,UP);const q=new THREE.Quaternion().setFromRotationMatrix(m);cam.quaternion.slerp(q,1-Math.exp(-dt*4));VM.root.visible=false;
   cam.fov=damp(cam.fov,70,4,dt);}
  snd.listener(cam.position.x,cam.position.y,cam.position.z,me.alive?me.yaw:Math.atan2(-(tv2.x-cam.position.x),-(tv2.z-cam.position.z)));snd.jet(me.jetting&&G.app==='play');
  // what is under the crosshair
  const eye=cam.position,fw=dirOf(me.yaw,me.pitch,new V());const wt=G.W.ray(eye,fw,150);const h=me.alive?rayFighters(eye,fw,wt,me)[0]:null;G.aimTarget=h?h.f:null;G.aimFoe=!!(h&&G.enemy(me,h.f));G.aimAlly=!!(h&&!G.enemy(me,h.f));}
 else if(G.app==='menu'||G.app==='over'){VM.root.visible=false;orbitA+=dt*.05;const b=G.mapDef.bounds,rx=(b[1]-b[0])*.36,rz=(b[3]-b[2])*.36;cam.position.set(Math.cos(orbitA)*rx,10+Math.sin(orbitA*.7)*3,Math.sin(orbitA)*rz);cam.lookAt(0,2,0);
  cam.fov=G.app==='over'?55:62;snd.listener(cam.position.x,cam.position.y,cam.position.z,0);snd.jet(false);}
 cam.aspect=aspect;cam.updateProjectionMatrix();
 if(msgT>0){msgT-=dt;if(msgT<=0)hud.prompt('');}
 if(G.app==='play'&&me){if(msgT<=0){const n=me.alive&&me.near;if(n){const w=WPN[n.it.w];hud.prompt(me.weapons.some(x=>x.id===n.it.w)?'':`HOLD <kbd>E</kbd> TO SWAP FOR ${w.name}`);}else hud.prompt('');}me.near=null;cam.updateMatrixWorld();hud.update(dt,cam);hud.board(keys.Tab||padBoard);}}

/* ================= input ================= */
const keys={},edge={},mouse={dx:0,dy:0,l:false,r:false,wheel:0},mouseVis={dx:0,dy:0};let locked=false,padBoard=false;
function lock(){if(G.app!=='play')return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;$('lock').hidden=locked||G.app!=='play';if(was&&!locked&&G.app==='play')pause(true);});
canvas.addEventListener('mousedown',e=>{if(G.app==='play'&&!locked){lock();return;}if(e.button===0)mouse.l=true;if(e.button===2)mouse.r=true;});
$('lock').onclick=()=>lock();
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});
addEventListener('contextmenu',e=>{if(G.app==='play')e.preventDefault();});
addEventListener('mousemove',e=>{if(!locked)return;mouse.dx+=e.movementX;mouse.dy+=e.movementY;});
addEventListener('wheel',e=>{if(G.app==='play'&&locked)mouse.wheel+=Math.sign(e.deltaY);},{passive:true});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','Tab','ControlLeft','KeyQ'].includes(e.code)&&G.app==='play')e.preventDefault();
 if(e.code==='Escape'&&G.app==='paused'){pause(false);}});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
let padPrev={};
function readInput(dt){const me=G.me;const ed=k=>edge[k];
 if(me&&G.app==='play'){const i=me.inp;const sens=G.opt.sens*.0022*(1/(1+(me.zoom*((WPN[me.weapons[me.wi]?.id]?.zoom||1)-1))));
  i.fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);i.side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  i.jump=!!keys.Space;i.jumpEdge=!!ed('Space');i.sprint=!!(keys.ShiftLeft||keys.ShiftRight);i.slide=!!(ed('KeyC')||ed('ControlLeft'));i.fire=mouse.l;i.zoom=mouse.r;
  i.reload=!!ed('KeyR');i.melee=!!(ed('KeyF')||ed('KeyV'));i.nade=!!ed('KeyQ');i.swap=!!(ed('Digit1')&&me.wi!==0||ed('Digit2')&&me.wi!==1||mouse.wheel!==0);mouse.wheel=0;i.interact=!!keys.KeyE;
  if(ed('KeyX'))me.nadeSel=me.nadeSel==='frag'?'plasma':'frag';
  if(locked&&me.alive){me.yaw-=mouse.dx*sens;me.pitch=cl(me.pitch-mouse.dy*sens,-1.5,1.5);}mouseVis.dx+=mouse.dx;mouseVis.dy+=mouse.dy;mouse.dx=mouse.dy=0;
  // gamepad
  const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(gp){const a=gp.axes,b=gp.buttons,dz=v=>Math.abs(v)>.15?v:0,pr=padPrev;const P=n=>b[n]&&b[n].pressed;
   if(dz(a[1])||dz(a[0])){i.fwd=-dz(a[1]);i.side=dz(a[0]);}const lx=dz(a[2]||0),ly=dz(a[3]||0),zf=1+me.zoom*2;me.yaw-=lx*Math.abs(lx)*3.4*G.opt.sens*dt/zf;me.pitch=cl(me.pitch-ly*Math.abs(ly)*2.6*G.opt.sens*dt/zf,-1.5,1.5);
   if(P(0))i.jump=true;if(P(0)&&!pr[0])i.jumpEdge=true;if((b[7]?.value||0)>.3)i.fire=true;if((b[6]?.value||0)>.3)i.zoom=true;if(P(1)&&!pr[1])i.slide=true;if(P(10))i.sprint=true;
   if(P(2)&&!pr[2])i.reload=true;if(P(2))i.interact=true;if(P(3)&&!pr[3])i.swap=true;if(P(5)&&!pr[5])i.nade=true;if(P(4)&&!pr[4])me.nadeSel=me.nadeSel==='frag'?'plasma':'frag';if(P(11)&&!pr[11])i.melee=true;
   if(P(9)&&!pr[9])pause(true);padBoard=!!P(8);for(let k=0;k<17;k++)pr[k]=P(k);}
  if(G.inOv)Object.assign(i,G.inOv);if(G.inOnce){Object.assign(i,G.inOnce);G.inOnce=null;}
  if(i.interact)me.swapHold+=dt;else me.swapHold=0;}
 else if(G.app==='paused'){const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(gp&&gp.buttons[9]?.pressed&&!padPrev[9])pause(false);if(gp)padPrev[9]=gp.buttons[9]?.pressed;}
 for(const k in edge)delete edge[k];}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;$('lock').hidden=true;document.body.classList.remove('playing');unlock();snd.jet(false);}
 else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible||G.app!=='play'&&G.app!=='paused')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.85));fxStack=null;fxSize='';for(const k in mapCache){const S=mapCache[k].S;S.sun.castShadow=q>0;S.mirror.on=q>0;S.mirror.scale=q>=2?.5:.33;}R.shadowMap.needsUpdate=true;}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);if(!G.S)return;
 vmCam.aspect=w/h;vmCam.updateProjectionMatrix();const pr=R.getPixelRatio();const sc=h*pr/(2*Math.tan(cam.fov*Math.PI/360));parts.U.uScale.value=smoke.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<3)R.shadowMap.needsUpdate=true;
 const T=G.S.theme;if(!fxStack){fxStack=cinematic(R,scene,cam,{exposure:T.exp,bloom:T.bloom,bloomThreshold:T.thr,bloomRadius:.5,saturation:T.sat,tint:T.tint,vignette:.38,grain:.025,aoStrength:.7,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 const key=w+'x'+h;if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade&&G.me){const m=G.me;const hp=G.app==='play'&&m.alive?Math.min(1,(m.health+m.shield)/120):1;fxStack.grade.uniforms.sat.value=T.sat*(.5+.5*hp);}
 cam.updateMatrixWorld();if(G.S.mirror.on)G.S.mirror.render(R,scene,cam,w*pr,h*pr,G.S.floorMesh);
 if(fxStack.composer)fxStack.render();else{R.autoClear=true;R.render(scene,cam);if(VM.root.visible&&G.app==='play'){R.autoClear=false;R.clearDepth();R.render(vmScene,vmCam);R.autoClear=true;}}}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));

/* ================= menus ================= */
function saveOpt(){try{localStorage.setItem('pxd_novaarena_opt',JSON.stringify(G.opt));}catch(e){}}
const segSync=[];const seg=(id,key,num=true,cb)=>{const el=$(id);segSync.push(()=>el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(num?+b.dataset.v:b.dataset.v)===String(G.opt[key]))));const set=(v,init)=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(num?+b.dataset.v:b.dataset.v)===String(v)));if(!init){saveOpt();cb&&cb(v);}};set(G.opt[key],true);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(num?+b.dataset.v:b.dataset.v));};
seg('o-mode','mode',false);seg('o-map','map',true,()=>{if(G.app==='menu')attractMode();});seg('o-diff','diff');seg('o-time','time');seg('o-cap','cap');
seg('o-sens','sens');seg('o-fov','fov');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-mus','mus',true,v=>{snd.setMusic(v);snd.music(v>0&&G.app!=='menu',0);});seg('o-ann','ann',true,v=>snd.annOn=!!v);
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Nova Arena\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'}${a.mode==='ffa'?' · place '+(a.place||'-'):' · '+(a.team||'')}\nKills: ${a.kills||0} · Deaths: ${a.deaths||0}\nMode: ${(MODES[a.mode]||{}).n||''} · ${a.map||''} · ${a.diff||''} bots\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore('novaarena',a.pts||0,body);};

/* ================= boot ================= */
attractMode();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.NOVAARENA={visuals:dt=>visuals(dt),get state(){return G.app==='play'?G.phase:G.app;},get app(){return G.app;},get phase(){return G.phase;},G,step,render,start,toMenu,pause,endMatch,
 get me(){return G.me;},get fighters(){return G.fighters;},get bots(){return G.fighters.filter(f=>f.ai);},get clock(){return G.clock;},setClock(s){G.clock=s;},get score(){return G.M.team?G.teamScore.slice():G.fighters.map(f=>f.stats.score);},get cap(){return G.cap;},
 get results(){return G.results;},get W(){return G.W;},get D(){return G.D;},get items(){return G.items;},get proj(){return G.proj;},scene,cam,R,VM,snd,setQuality:applyQuality,get gfx(){return gfx;},
 skipCountdown(){if(G.phase==='countdown'){G.cdT=0;}},kill(victim,killer=null,o={weapon:'pulse'}){const v=typeof victim==='number'?G.fighters[victim]:victim,k=typeof killer==='number'?G.fighters[killer]:killer;if(v&&v.alive)damage(v,9999,k,{...o,point:v.pos.clone().setY(v.pos.y+1)});},
 damage(victim,n,killer){const v=typeof victim==='number'?G.fighters[victim]:victim;damage(v,n,killer?(typeof killer==='number'?G.fighters[killer]:killer):null,{weapon:'pulse'});},
 teleport(x,y,z,f){f=f||G.me;f.pos.set(x,y,z);f.vel.set(0,0,0);G.snapCam=true;},look(yaw,pitch=0){G.me.yaw=yaw;G.me.pitch=pitch;},
 aimAt(t){const me=G.me,e=eyeOf(me,new V()),p=t.pos.clone().setY(t.pos.y+1.2);const dx=p.x-e.x,dz=p.z-e.z;me.yaw=Math.atan2(-dx,-dz);me.pitch=Math.atan2(p.y-e.y,Math.hypot(dx,dz));},
 give(id){const me=G.me;const d=WPN[id];if(me.weapons.find(w=>w.id===id))return;const w={id,mag:d.mag,res:d.res};if(me.weapons.length<2)me.weapons.push(w);else me.weapons[me.wi]=w;setWeapon(me,me.weapons.indexOf(w));},
 input:o=>{G.inOv=o&&Object.keys(o).length?o:null;},press:o=>{G.inOnce=o;},keys,mouse,setIdle(on=true){G.fighters.forEach(f=>{if(f.ai)f.ai.idle=on;});},freezeBots(on=true){G.botsFrozen=on;},
 nav:()=>({nodes:G.W.nodes.length,roam:G.W.roam.length})};
