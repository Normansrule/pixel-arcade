// STORM ROYALE — third-person battle royale vs 24 bots. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {V,cl,lerp,smooth,angDiff,fmt,rng,pick} from './util.js';
import {World,EXT,SUN,SKY,ISLAND} from './world.js';
import {Build,MATS,CELL,H as BH,COST} from './build.js';
import {RAR,GUNS,HEALS,AMMO,makeGun,makeHeal,itemName,itemRar,gunValue,rollGun,rollHeal,rollAmmo,ammoFor,itemMesh,chestMesh,ammoMesh} from './items.js';
import {OUTFITS,EMOTES,makeRig,animRig,hold,muzzleWorld,makeBus} from './actor.js';
import {Particles,Tracers,Flashes,Shocks,Debris,makeStorm} from './fx.js';
import {DIFF,initBot,planDrop,thinkBot} from './ai.js';
import {Sound} from './sound.js';

const $=id=>document.getElementById(id);
const BOTS=24,MATCH=600,RAD=.38,HT=1.8,STEP=.6,GRAV=26,MATMAX=500;
const NAMES=['NOVA','BRAMBLE','ZIGGY','KITE','MAVERICK','DUSTY','SPROCKET','JUNIPER','RAZZ','TOFU','BLAZE','CORAL','DYNAMO','ECHO','FROST','GADGET','HAVOC','INDIGO','JOLT','KOBALT','LUMEN','MOXIE','NIMBUS','ONYX','PEPPER','QUILL','ROOK','SABLE','TANGO','UMBRA','WISP','XENO','YUKON','ZEST','PICKLE','RUMBLE','SPUD','COMET'];
// storm phases: wait (s), shrink (s), radius after shrink, damage per second
const PH=[{wait:90,shrink:60,r:175,dps:1},{wait:60,shrink:50,r:112,dps:2},{wait:50,shrink:45,r:66,dps:4},{wait:40,shrink:40,r:36,dps:6},{wait:30,shrink:35,r:15,dps:8},{wait:25,shrink:30,r:0,dps:10}];

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(SKY.fog,150,950);
const hemi=new THREE.HemisphereLight(0xcfe8ff,0x6a8a4a,1.05);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,2.7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:10,far:420});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;scene.add(sun,sun.target);
{const es=new THREE.Scene();es.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{t:{value:SKY.top},h:{value:SKY.hor}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 t,h;varying vec3 vP;void main(){float y=normalize(vP).y;vec3 c=mix(h,t,clamp(y,0.,1.));c=mix(c,vec3(.35,.45,.3),smoothstep(0.,-.3,y));gl_FragColor=vec4(c,1.);}'})));
 const pm=new THREE.PMREMGenerator(R);scene.environment=pm.fromScene(es,.03).texture;pm.dispose();}
const world=new World(11);const vis=world.build(scene);
const build=new Build(scene,world);
const parts=new Particles(scene,5000,true),smoke=new Particles(scene,1600,false),tracers=new Tracers(scene),flashes=new Flashes(scene),shocks=new Shocks(scene),debris=new Debris(scene);debris.ground=(x,z)=>Math.max(world.heightAt(x,z),0);
const storm=makeStorm(scene);
const snd=new Sound();
const charMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:.05,envMapIntensity:.8});
const lootMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.25,emissive:0x222222});
const camera=new THREE.PerspectiveCamera(72,1,.1,3000);
const busMesh=makeBus();scene.add(busMesh);busMesh.visible=false;
const beamMats=RAR.map(r=>new THREE.MeshBasicMaterial({color:new THREE.Color(r.h).multiplyScalar(1.6),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
const beamGeo=new THREE.CylinderGeometry(.05,.16,3.2,6,1,true);beamGeo.translate(0,1.6,0);
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,220,120,.9)');g.addColorStop(1,'rgba(255,160,20,0)');x.fillStyle=g;x.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
const rocketGeo=new THREE.CylinderGeometry(.07,.09,.6,8);rocketGeo.rotateX(Math.PI/2);const rocketMat=new THREE.MeshStandardMaterial({color:0x5a6a4a,emissive:0x220800});

/* ================= state ================= */
let opt={diff:1,build:1};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_royale_opt'))||{});}catch(e){}
let app='menu',phase='bus',time=0,mt=0,actors=[],player=null,loot=[],containers=[],rockets=[],diff=DIFF[1],bus=null,busT=0,stormS=null,timeScale=1,endT=0,winner=null,spec=null,result=null,stormTick=0,lastStorm=0,buildOn=true,shake=0,camYaw=0,camPitch=0,menuT=0,lobby=[];
const tv=new V(),tv2=new V(),tv3=new V(),sup={h:0,p:null};

/* ================= actors ================= */
function newActor(i,isPlayer){const o=isPlayer?OUTFITS[0]:OUTFITS[1+(i%(OUTFITS.length-1))];const rig=makeRig(isPlayer?o:{...o,top:(i*7919%2)?o.top:o.bot,bot:(i*7919%2)?o.bot:o.top},charMat);scene.add(rig.root);
 const a={id:i,name:'',player:isPlayer,bot:!isPlayer,o,rig,pos:new V(),vel:new V(),yaw:0,pitch:0,hp:100,sh:0,alive:true,state:'bus',inv:[null,null,null,null,null],sel:0,mats:[0,0,0],ammo:{light:0,medium:0,heavy:0,shells:0,rockets:0},
  cd:0,jumpCd:0,reloadT:0,healing:null,swing:0,swingHit:false,support:null,ground:false,fallFrom:0,lastHurt:-99,lastHurtBy:null,kills:0,dmg:0,built:0,harvested:0,chests:0,heads:0,shots:0,hits:0,emote:-1,emoteT:0,bmode:false,piece:'wall',bmat:0,placeCd:0,bloom:0,fireVis:0,in:{mx:0,mz:0,sprint:false,jump:false,fire:false,firePress:false,aim:false},place:0,killer:null,cause:'',deadT:0,stepT:0,landT:0,inWater:false};
 return a;}
function resetActor(a){Object.assign(a,{god:false,frozen:false,hp:100,sh:0,alive:true,state:'bus',inv:[null,null,null,null,null],sel:0,mats:[0,0,0],ammo:{light:0,medium:0,heavy:0,shells:0,rockets:0},cd:0,reloadT:0,healing:null,swing:0,support:null,ground:false,lastHurt:-99,lastHurtBy:null,kills:0,dmg:0,built:0,harvested:0,chests:0,heads:0,shots:0,hits:0,emote:-1,bmode:false,place:0,killer:null,cause:'',deadT:0,bloom:0});
 a.vel.set(0,0,0);a.rig.root.visible=false;a.rig.die=0;a.rig.body.rotation.set(0,0,0);a.rig.root.scale.set(1,1,1);hold(a.rig,'none');}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);try{localStorage.setItem('pxd_royale_opt',JSON.stringify(opt));}catch(e){}snd.init();
 diff=DIFF[opt.diff];buildOn=!!opt.build;clearLobby();
 // world reset
 build.clear();world.reset();world.spawnStructures(build);clearLoot();parts.clear();smoke.clear();tracers.clear();debris.clear();rockets.forEach(r=>scene.remove(r.mesh));rockets=[];
 // actors
 if(!actors.length){actors.push(player=newActor(0,true));for(let i=1;i<=BOTS;i++)actors.push(newActor(i,false));}
 const names=NAMES.slice().sort(()=>Math.random()-.5);actors.forEach((a,i)=>{resetActor(a);a.name=a.player?'YOU':names[i%names.length];if(a.bot)initBot(a,G);});
 spawnContainers();
 // bus route across the island
 const ang=Math.random()*Math.PI*2,dir=new V(Math.cos(ang),0,Math.sin(ang)),perp=new V(-dir.z,0,dir.x),off=(Math.random()-.5)*150,L=430;
 bus={p0:new V().addScaledVector(dir,-L).addScaledVector(perp,off),dir,len:2*L,speed:34,alt:150,pos:new V()};bus.p0.y=bus.alt;busT=0;busMesh.visible=true;
 for(const a of actors)if(a.bot)planDrop(a,G,bus);
 // storm
 stormS={phase:0,count:PH.length,state:'wait',left:PH[0].wait,cur:{x:0,z:0,r:380},next:null,from:null,closedAt:0};stormS.next=nextCircle(stormS.cur,PH[0].r);lastStorm=0;stormTick=0;
 time=0;mt=0;phase='bus';timeScale=1;endT=0;winner=null;spec=null;result=null;camYaw=Math.atan2(dir.x,dir.z)+.7;camPitch=-.32;shake=0;player.emote=-1;
 app='match';$('menu').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;$('fullmap').hidden=true;document.body.classList.add('playing');$('feed').innerHTML='';
 banner('THE SKY BARGE IS AIRBORNE','PRESS SPACE TO JUMP',3);snd.play('storm');hudDirty=true;}
function toMenu(){app='menu';$('menu').hidden=false;$('keys').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('fullmap').hidden=true;document.body.classList.remove('playing');if(document.pointerLockElement)document.exitPointerLock();
 for(const a of actors){a.rig.root.visible=false;}busMesh.visible=false;storm.mesh.visible=false;build.showGhost(null);
 if(!build.all.size){world.spawnStructures(build);}setupLobby();snd.set('wind',0);snd.set('storm',0);snd.set('engine',0);}
function setupLobby(){clearLobby();const m=world.pois[5].mill,base=new V(m.x+12,0,m.z+1);const outs=[OUTFITS[0],OUTFITS[3],OUTFITS[1],OUTFITS[7]],offs=[[0,0],[-1.6,-1.5],[-1.2,1.6],[-3,.2]],em=[-1,0,1,2];
 outs.forEach((o,i)=>{const r=makeRig(o,charMat);const x=base.x+offs[i][0],z=base.z+offs[i][1];r.root.position.set(x,world.heightAt(x,z),z);r.root.rotation.y=Math.PI/2+(i===0?.1:(i-1.5)*.18);scene.add(r.root);if(i===0)hold(r,'pick');lobby.push({r,e:em[i],t:i*1.3});});lobby.base=base;}
function clearLobby(){for(const l of lobby)scene.remove(l.r.root);lobby=[];}
function nextCircle(c,r){for(let k=0;k<80;k++){const a=Math.random()*Math.PI*2,d=Math.sqrt(Math.random())*Math.max(0,c.r-r)*(c.r>300?.45:1),x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d;
  let land=0;for(let j=0;j<8;j++){const b=j/8*Math.PI*2;if(world.heightAt(x+Math.cos(b)*r*.6,z+Math.sin(b)*r*.6)>.5)land++;}if(world.heightAt(x,z)>1.5&&land>=5)return{x,z,r};}return{x:c.x,z:c.z,r};}
function aliveN(){let n=0;for(const a of actors)if(a.alive)n++;return n;}

/* ================= containers + loot ================= */
function clearLoot(){for(const l of loot){scene.remove(l.mesh);if(l.beam)scene.remove(l.beam);}loot=[];for(const c of containers)scene.remove(c.g);containers=[];}
function spawnContainers(){const r=Math.random;for(const s of world.spots){
  if(s.kind==='chest'||s.kind==='ammo'){if(r()>(s.kind==='chest'?.92:.8))continue;const g=s.kind==='chest'?chestMesh(lootMat):ammoMesh('x',lootMat);g.position.set(s.x,s.y,s.z);g.rotation.y=s.face;scene.add(g);
   let glow=null;if(s.kind==='chest'){glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,color:new THREE.Color(1.6,1.2,.5)}));glow.scale.setScalar(2.6);glow.position.y=.5;g.add(glow);}
   containers.push({kind:s.kind,p:new V(s.x,s.y,s.z),g,glow,opened:false,house:s.house,claim:null});}
  else if(r()<.85){const p=new V(s.x+(r()-.5),s.y,s.z+(r()-.5)),roll=r();if(roll<.6){const it=rollGun('floor');dropItem(it,p,null,true);dropItem(ammoFor(it),tv.copy(p).add(new V(.7,0,.3)),null,true);}else if(roll<.85)dropItem(rollHeal(),p,null,true);else dropItem(rollAmmo(),p,null,true);}}}
function dropItem(it,p,vel,settle){if(!it)return null;const mesh=itemMesh(it,lootMat);mesh.position.copy(p);scene.add(mesh);let beam=null;
 if(it.kind==='gun'||it.kind==='heal'){beam=new THREE.Mesh(beamGeo,beamMats[itemRar(it)]);beam.position.copy(p);if(itemRar(it)>=3)beam.scale.set(1.6,1.5,1.6);scene.add(beam);}
 const l={it,p:p.clone(),v:vel?vel.clone():new V(),mesh,beam,settled:!!settle,spin:Math.random()*6,age:0};if(settle)l.p.y=surfaceAt(l.p.x,l.p.z,l.p.y+1)+.05;loot.push(l);return l;}
function removeLoot(l){const i=loot.indexOf(l);if(i>=0)loot.splice(i,1);scene.remove(l.mesh);if(l.beam)scene.remove(l.beam);}
function surfaceAt(x,z,y){let h=Math.max(world.heightAt(x,z),-.2);build.support(x,z,y,.5,.2,sup);if(sup.h>h)h=sup.h;const o=world.support(x,z,y,.5,.2);if(o>h)h=o;return h;}
function openContainer(a,c){if(c.opened)return;c.opened=true;a.chests++;const p=c.p.clone();p.y+=.6;const fwd=new V(Math.sin(c.g.rotation.y),0,Math.cos(c.g.rotation.y));
 const toss=k=>new V(fwd.x*2.5+Math.cos(k*2.1)*1.6,4.5+Math.random()*1.5,fwd.z*2.5+Math.sin(k*2.1)*1.6);
 if(c.kind==='chest'){const it=rollGun('chest');dropItem(it,p,toss(0));dropItem(ammoFor(it),p,toss(1));dropItem(rollHeal(),p,toss(2));if(Math.random()<.5)dropItem(rollAmmo(),p,toss(3));dropItem({kind:'mats',t:Math.random()*3|0,n:30},p,toss(4));
  if(c.g.userData.lid)c.g.userData.lid.rotation.x=-1.9;if(c.glow)c.glow.visible=false;parts.burst(p,40,6,[new THREE.Color(2.5,2,.6),new THREE.Color(2,1.4,.3)],.35,.9,{up:true,grav:4});}
 else{dropItem(rollAmmo(),p,toss(0));dropItem(rollAmmo(),p,toss(1));c.g.visible=false;}
 if(a.player)snd.play('chest');else snd.play('chest',vol(c.p)*.5);}
function pickupItem(a,l){const it=l.it;
 if(it.kind==='ammo'){a.ammo[it.t]=Math.min(AMMO[it.t].max,a.ammo[it.t]+it.n);removeLoot(l);if(a.player){snd.play('pickup');toast('+'+it.n+' '+AMMO[it.t].n+' AMMO');}return true;}
 if(it.kind==='mats'){a.mats[it.t]=Math.min(MATMAX,a.mats[it.t]+it.n);removeLoot(l);if(a.player){snd.play('pickup');}return true;}
 if(it.kind==='heal'){for(const s of a.inv)if(s&&s.kind==='heal'&&s.t===it.t&&s.n<HEALS[it.t].max){const m=Math.min(it.n,HEALS[it.t].max-s.n);s.n+=m;it.n-=m;}if(it.n<=0){removeLoot(l);if(a.player)snd.play('pickup');hudDirty=true;return true;}}
 const free=a.inv.indexOf(null);if(free>=0){a.inv[free]=it;removeLoot(l);if(a.player){snd.play('pickup');if(a.sel===0&&it.kind==='gun')select(a,free+1);}else if(it.kind==='gun')select(a,free+1);hudDirty=true;return true;}
 // swap with the held slot (or slot 1 when holding the pickaxe)
 const si=a.sel>0?a.sel-1:0;const old=a.inv[si];a.inv[si]=it;removeLoot(l);if(old)dropItem(old,a.pos.clone().add(new V(0,.8,0)),new V(Math.sin(a.yaw)*2,3,Math.cos(a.yaw)*2));select(a,si+1,true);if(a.player)snd.play('pickup');hudDirty=true;return true;}
function interact(a,target){if(!a.alive||a.state!=='ground')return;if(target){if(target.g)openContainer(a,target);else if(loot.includes(target))pickupItem(a,target);return;}const t=nearInteract(a);if(t)interact(a,t.ref);}
function nearInteract(a){let best=null,bd=1e9;const fx=Math.sin(camYaw),fz=Math.cos(camYaw),isP=a.player;
 const consider=(p,ref,kind)=>{const dx=p.x-a.pos.x,dz=p.z-a.pos.z,dy=p.y-a.pos.y,d=Math.hypot(dx,dz);if(d>2.6||dy<-1.4||dy>2)return;let s=d;if(isP&&d>.8){const dot=(dx*fx+dz*fz)/d;if(dot<.2)return;s=d*(1.6-dot);}if(s<bd){bd=s;best={ref,kind};}};
 for(const c of containers)if(!c.opened)consider(c.p,c,c.kind);for(const l of loot)if(l.settled&&l.it.kind!=='ammo'&&l.it.kind!=='mats')consider(l.p,l,'item');return best;}

/* ================= inventory actions ================= */
function select(a,s,force){if(s===a.sel&&!force)return;if(s>0&&!a.inv[s-1])return;a.sel=s;a.reloadT=0;if(a.healing)a.healing=null;a.cd=Math.max(a.cd,.18);a.swing=0;a.bmode=false;a.emote=-1;if(a.player){hudDirty=true;build.showGhost(null);}}
function reload(a){const it=a.sel>0?a.inv[a.sel-1]:null;if(!it||it.kind!=='gun'||a.reloadT>0)return;const g=GUNS[it.t];if(it.mag>=g.mag||a.ammo[g.ammo]<=0)return;a.reloadT=g.reload;if(a.player)snd.play('reload');}
function finishReload(a){const it=a.sel>0?a.inv[a.sel-1]:null;if(!it||it.kind!=='gun')return;const g=GUNS[it.t],take=Math.min(g.mag-it.mag,a.ammo[g.ammo]);it.mag+=take;a.ammo[g.ammo]-=take;hudDirty=true;}
function placePiece(a,type){if(!buildOn||!a.alive||a.state!=='ground')return null;if(a.placeCd>0)return null;const pl=build.plan(a,type);if(!pl.ok)return null;
 let m=a.mats[a.bmat]>=COST?a.bmat:[0,1,2].find(i=>a.mats[i]>=COST);if(m==null){if(a.player)toast('NOT ENOUGH MATERIALS',1);return null;}
 const p=build.place(type,m,pl.ix,pl.iz,pl.dir,pl.base,{owner:a});if(!p)return null;a.mats[m]-=COST;a.built++;a.placeCd=.09;a.emote=-1;
 if(a.player){snd.play('build');hudDirty=true;}else snd.play('build',vol(a.pos)*.6);return p;}
function jump(a){if(a.state!=='bus')return;a.state='fall';a.pos.copy(bus.pos).add(new V((Math.random()-.5)*3,-7,(Math.random()-.5)*3));a.vel.copy(bus.dir).multiplyScalar(bus.speed*.4);a.vel.y=-4;a.rig.root.visible=true;a.yaw=Math.atan2(bus.dir.x,bus.dir.z);
 if(a.player){phase='drop';snd.play('drop');camYaw=a.yaw;banT=.01;}}

/* ================= physics ================= */
function moveActor(a,dt){const I=a.in,P=a.pos,Vv=a.vel;
 if(a.state==='bus'){P.copy(bus.pos);return;}
 const fx=Math.sin(a.yaw),fz=Math.cos(a.yaw),rx=-Math.cos(a.yaw),rz=Math.sin(a.yaw);let wx=fx*I.mz+rx*I.mx,wz=fz*I.mz+rz*I.mx;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}
 const gh=world.heightAt(P.x,P.z);
 if(a.state==='fall'){const dive=a.pitch<-.6&&I.mz>0;const hs=dive?9:16;Vv.x+=(wx*hs-Vv.x)*Math.min(1,dt*2.2);Vv.z+=(wz*hs-Vv.z)*Math.min(1,dt*2.2);Vv.y+=((dive?-46:-32)-Vv.y)*Math.min(1,dt*2);
  P.addScaledVector(Vv,dt);if(P.y-gh<52||(I.jump&&P.y-gh<120&&a.player)){a.state='glide';if(a.player)snd.play('glider');}}
 else if(a.state==='glide'){Vv.x+=(wx*14-Vv.x)*Math.min(1,dt*1.8);Vv.z+=(wz*14-Vv.z)*Math.min(1,dt*1.8);Vv.y+=(-7.5-Vv.y)*Math.min(1,dt*3);P.addScaledVector(Vv,dt);}
 else if(a.state==='ground'){const ads=I.aim&&a.sel>0&&a.inv[a.sel-1]&&a.inv[a.sel-1].kind==='gun';let sp=ads?3.4:(I.sprint&&I.mz>.3&&!a.healing?8.1:6);if(a.healing)sp*=.5;if(a.inWater)sp*=.55;if(a.emote>=0&&wl>.1)a.emote=-1;
  const acc=a.ground?16:2.5;Vv.x+=(wx*sp-Vv.x)*Math.min(1,dt*acc);Vv.z+=(wz*sp-Vv.z)*Math.min(1,dt*acc);
  if(I.jump&&(a.ground||a.inWater)&&a.jumpCd<=0){Vv.y=a.inWater?5:8.6;a.ground=false;a.support=null;a.jumpCd=.25;if(a.player)snd.play('jump');a.emote=-1;}
  Vv.y-=GRAV*dt;if(Vv.y<-50)Vv.y=-50;const n=Math.max(1,Math.ceil(Math.hypot(Vv.x,Vv.y,Vv.z)*dt/.3));for(let k=0;k<n;k++){P.addScaledVector(Vv,dt/n);collideStatic(a);}}
 if(a.state==='glide'||a.state==='fall')collideStatic(a);
 // ceiling (build pieces)
 if(Vv.y>0){const c=build.ceiling(P.x,P.z,P.y+.5,RAD);if(P.y+HT>c){P.y=c-HT;Vv.y=0;}}
 // ground
 let g=world.heightAt(P.x,P.z),sp=null;build.support(P.x,P.z,P.y,STEP,RAD,sup);if(sup.h>g){g=sup.h;sp=sup.p;}const os=world.support(P.x,P.z,P.y,STEP,RAD);if(os>g){g=os;sp=null;}
 if((a.state==='fall'||a.state==='glide')&&g<-1.1&&P.y<=-1.1){a.state='ground';a.rig.sq=.6;a.fallFrom=P.y;Vv.y=0;if(a.player){phase='play';hudDirty=true;snd.play('land');}}
 a.inWater=g<-1.1&&P.y<-.9;if(a.inWater&&a.state==='ground'){if(P.y<-1.1){P.y=-1.1;if(Vv.y<0)Vv.y=0;}a.ground=false;a.support=null;}
 if(P.y<=g+.02&&Vv.y<=0){if(a.state==='fall'||a.state==='glide'){a.state='ground';a.rig.sq=1;a.fallFrom=P.y;if(a.player){snd.play('land');hudDirty=true;phase='play';}}
  if(!a.ground&&a.state==='ground'){const drop=a.fallFrom-P.y;a.rig.sq=Math.min(1,drop*.12+.3);if(drop>9.5&&!a.inWater)hurt(a,Math.round((drop-9.5)*7),null,{fall:true});if(a.player&&drop>1.2)snd.play('land');}
  P.y=g;Vv.y=0;a.ground=true;a.support=sp;}
 else if(a.ground&&a.state==='ground'&&P.y-g<STEP&&Vv.y<=0){P.y=g;Vv.y=0;a.support=sp;}
 else if(a.state==='ground'&&!a.inWater){a.ground=false;a.support=null;}
 if(a.ground||a.inWater)a.fallFrom=P.y;else a.fallFrom=Math.max(a.fallFrom,P.y);
 if(a.support){a.lastSup=a.support;a.lastSupT=time;}a.coyote=a.lastSup&&a.lastSup.alive&&time-a.lastSupT<.5?a.lastSup:null;
 const lim=EXT-6;P.x=cl(P.x,-lim,lim);P.z=cl(P.z,-lim,lim);}
function collideStatic(a){world.collide(a.pos,RAD,HT,STEP);build.collide(a.pos,RAD,HT,STEP);}

/* ================= combat ================= */
const hitRes={t:0,kind:'',ref:null,head:false,n:new V()};
function raySphere(o,d,cx,cy,cz,r,maxT){const ox=o.x-cx,oy=o.y-cy,oz=o.z-cz,b=ox*d.x+oy*d.y+oz*d.z,c=ox*ox+oy*oy+oz*oz-r*r,disc=b*b-c;if(disc<0)return -1;const t=-b-Math.sqrt(disc);return t>=0&&t<=maxT?t:-1;}
function rayActors(o,d,maxT,ignore){let best=null,bt=maxT;for(const b of actors){if(!b.alive||b===ignore||b.state==='bus')continue;
  const cx=b.pos.x,cy=b.pos.y+(b.state==='fall'?1.2:.95),cz=b.pos.z,tx=cx-o.x,ty=cy-o.y,tz=cz-o.z,tc=tx*d.x+ty*d.y+tz*d.z;if(tc<-1||tc>bt+1.5)continue;if(tx*tx+ty*ty+tz*tz-tc*tc>2.6)continue;
  if(b.state==='fall'||b.state==='glide'){const t=raySphere(o,d,cx,cy,cz,.75,bt);if(t>=0&&t<bt){bt=t;best={b,t,head:false};}continue;}
  const th=raySphere(o,d,cx,b.pos.y+1.63,cz,.25,bt);if(th>=0&&th<bt){bt=th;best={b,t:th,head:true};}
  for(const y of[.4,.8,1.2]){const t=raySphere(o,d,cx,b.pos.y+y,cz,.4,bt);if(t>=0&&t<bt){bt=t;best={b,t,head:false};}}}return best;}
function castShot(o,d,maxT,ignore,noActors){let t=maxT,kind='none',ref=null,head=false,n=null;
 const tt=world.rayTerrain(o,d,t);if(tt>=0&&tt<t){t=tt;kind='terrain';}
 if(d.y<0&&o.y>0){const tw=-o.y/d.y;if(tw<t){t=tw;kind='water';}}
 const ob=world.rayObs(o,d,t);if(ob&&ob.t<t){t=ob.t;kind='obs';ref=ob.obs;n=ob.n;}
 const bp=build.ray(o,d,t);if(bp&&bp.t<t){t=bp.t;kind='piece';ref=bp.p;n=bp.n;}
 if(!noActors){const ac=rayActors(o,d,t,ignore);if(ac&&ac.t<t){t=ac.t;kind='actor';ref=ac.b;head=ac.head;}}
 hitRes.t=t;hitRes.kind=kind;hitRes.ref=ref;hitRes.head=head;if(n)hitRes.n.copy(n);else if(kind==='terrain')world.normalAt(o.x+d.x*t,o.z+d.z*t,hitRes.n);else hitRes.n.set(0,1,0);return hitRes;}
function los(a,b){const o=tv3.set(a.pos.x,a.pos.y+1.5,a.pos.z),d=new V(b.pos.x-o.x,b.pos.y+1.1-o.y,b.pos.z-o.z);const L=d.length();d.divideScalar(L);const h=castShot(o,d,L,a,true);return h.kind==='none'||h.t>=L-.3;}
function vol(p){const c=camera.position;const d=Math.hypot(p.x-c.x,p.y-c.y,p.z-c.z);return cl(1-d/220,0,1)**1.6;}
const _o=new V(),_d=new V(),_m=new V(),_aim=new V();
function aimRay(a,o,d){if(a.player&&!a.bot){o.copy(camera.position);camera.getWorldDirection(d);// start past the character
  const toP=tv.subVectors(a.pos,o),along=toP.dot(d);if(along>0)o.addScaledVector(d,along*.95);return;}
 o.set(a.pos.x,a.pos.y+1.5,a.pos.z);d.set(Math.sin(a.yaw)*Math.cos(a.pitch),Math.sin(a.pitch),Math.cos(a.yaw)*Math.cos(a.pitch));}
function muzzle(a,out){const far=camera.position.distanceToSquared(a.pos)>180*180;if(!far&&a.rig.root.visible)return muzzleWorld(a.rig,out);return out.set(a.pos.x-Math.cos(a.yaw)*.25+Math.sin(a.yaw)*.8,a.pos.y+1.42,a.pos.z+Math.sin(a.yaw)*.25+Math.cos(a.yaw)*.8);}
function spreadDir(d,s,out){out.copy(d);if(s<=0)return out;const u=tv2.set(0,1,0).cross(d);if(u.lengthSq()<1e-6)u.set(1,0,0);u.normalize();const w=new V().crossVectors(d,u);const r=Math.sqrt(Math.random())*s,a=Math.random()*Math.PI*2;return out.addScaledVector(u,Math.cos(a)*r).addScaledVector(w,Math.sin(a)*r).normalize();}
function fireGun(a,it){const g=GUNS[it.t];it.mag--;a.cd=1/g.rate;a.shots++;a.fireVis=1;hudDirty=a.player||hudDirty;
 aimRay(a,_o,_d);
 // aim point from camera/eye, then the bullet travels from the muzzle to it
 const moving=Math.hypot(a.vel.x,a.vel.z)>1.5,air=!a.ground;const base=g.spread[a.in.aim?1:0]+(moving?g.move:0)+(air?.05:0)+a.bloom;
 const m=muzzle(a,_m);const v=a.player?1:vol(a.pos);snd.play(it.t,v);flashes.fire(m,it.t==='sg'?1:it.t==='sn'?1.1:.6,v>.05);
 if(g.auto)a.bloom=Math.min(.022,a.bloom+.004);
 // alert bots nearby
 for(const b of actors)if(b.bot&&b.alive&&b!==a&&b.ai&&!b.ai.enemy){const dd=b.pos.distanceToSquared(a.pos);if(dd<90*90)b.ai.heard={x:a.pos.x,z:a.pos.z,t:time};}
 if(g.proj){const d=spreadDir(_d,base,new V());const tp=castShot(_o,d,g.range[1],a);const aimP=new V().copy(_o).addScaledVector(d,tp.t);const dir=aimP.sub(m).normalize();
  const mesh=new THREE.Mesh(rocketGeo,rocketMat);mesh.position.copy(m);mesh.lookAt(tv.copy(m).add(dir));scene.add(mesh);rockets.push({p:m.clone(),v:dir.multiplyScalar(g.proj),owner:a,dmg:g.dmg[it.r]*(a.bot?diff.dmg:1),bdmg:400,life:6,mesh});if(a.player)shake=Math.max(shake,.25);return;}
 const pel=g.pellets||1;let hitAny=false,headAny=false,tot=0;
 for(let k=0;k<pel;k++){const d=spreadDir(_d,base,new V());const ap=castShot(_o,d,g.range[1],a);const aimP=tv3.copy(_o).addScaledVector(d,ap.t);
  // from muzzle
  const bd=new V().subVectors(aimP,m);const L=bd.length();if(L<.01)continue;bd.divideScalar(L);const h=castShot(m,bd,L+.05,a);const hp=new V().copy(m).addScaledVector(bd,h.t);
  if(k<3||k%3===0)tracers.add(m,hp,it.t==='sn'?new THREE.Color(1.6,1.8,2.4):new THREE.Color(2.4,1.9,1.1),it.t==='sn'?.06:.035,it.t==='sn'?.25:.09);
  const dist=h.t;let dmg=g.dmg[it.r]*(dist>g.range[0]?lerp(1,.5,cl((dist-g.range[0])/(g.range[1]-g.range[0]),0,1)):1)*(a.bot?diff.dmg:1);
  const r=impact(a,h,hp,bd,dmg,g.bdmg,it.t);if(r){hitAny=true;tot+=r.d;if(r.head)headAny=true;}}
 if(a.player){shake=Math.max(shake,it.t==='sg'?.3:it.t==='sn'?.4:.08);recoil+=it.t==='sn'?.06:it.t==='sg'?.05:.012;if(hitAny){a.hits++;hitMarker(headAny);}}}
// apply a bullet hit; returns {d,head} when an actor was damaged
function impact(a,h,hp,dir,dmg,bmul,wt){
 if(h.kind==='actor'){const v=h.ref,hd=h.head;const d=dmg*(hd?GUNS[wt].head:1)*(a.bot&&v.bot?.45:1);const r=hurt(v,d,a,{head:hd,wt});parts.burst(hp,8,5,v.sh>0?new THREE.Color(.6,1.4,2.6):new THREE.Color(2.4,2.2,1.8),.16,.25,{dir:dir.clone().negate(),spread:1});return r?{d:r,head:hd}:null;}
 if(h.kind==='piece'){build.damage(h.ref,dmg*bmul,a);const c=[0xb27a44,0x9a9ea6,0xb8c0c8,0xe8e0d0,0xd06040,0x8a5a36][h.ref.mat];debris.spawn(hp,c,2,.12,4,{dir:h.n});if(h.ref.mat===2)parts.burst(hp,6,6,new THREE.Color(2.5,2,1.2),.12,.2,{dir:h.n,spread:.8,grav:10});return null;}
 if(h.kind==='obs'){world.hitObs(h.ref,dmg*.5);const k=h.ref.k;debris.spawn(hp,k==='tree'?0x8a5a2e:k==='rock'?0x9a958c:0xb0b8c0,2,.12,4,{dir:h.n});return null;}
 if(h.kind==='terrain'){smoke.emit(hp.x,hp.y+.1,hp.z,0,1,0,.62,.55,.42,.6,.6,0,1,2);debris.spawn(hp,0x7a6a4a,2,.08,3,{dir:h.n});return null;}
 if(h.kind==='water'){for(let i=0;i<6;i++)parts.emit(hp.x,0,hp.z,(Math.random()-.5)*2,3+Math.random()*3,(Math.random()-.5)*2,1.2,1.5,1.7,.15,.5,10,0);}return null;}
function hurt(v,dmg,src,o={}){if(!v.alive||dmg<=0||v.god&&!o.force)return 0;let d=Math.round(dmg);let toSh=0;if(!o.storm&&!o.fall&&v.sh>0){toSh=Math.min(v.sh,d);v.sh-=toSh;}const toHp=d-toSh;v.hp-=toHp;
 v.lastHurt=time;if(src&&src!==v)v.lastHurtBy=src;v.emote=-1;
 if(src&&src!==v){src.dmg+=d;if(o.head)src.heads++;}
 if(src&&src.player&&src!==v){dmgNum(v,d,o.head,toSh>0&&v.sh>=0&&toHp===0);if(toSh>0&&v.sh===0)snd.play('shieldbreak');else snd.play(o.head?'head':toSh>0?'shieldhit':'hit');}
 if(v.player){hurtFlash=Math.min(1,hurtFlash+d/40);if(src&&src!==v){hurtDir=Math.atan2(src.pos.x-v.pos.x,src.pos.z-v.pos.z);hurtDirT=1.4;}snd.play(o.storm?'click':'hurt');hudDirty=true;shake=Math.max(shake,Math.min(.4,d/80));}
 if(v.hp<=0){v.hp=0;kill(v,src,o);}return d;}
function kill(v,k,o={}){v.alive=false;v.place=aliveN()+1;v.killer=k&&k!==v?k:null;v.cause=o.storm?'storm':o.fall?'fall':'';v.deadT=time;v.deadMt=mt;v.healing=null;v.emote=-1;
 if(v.killer)v.killer.kills++;
 // drop inventory
 const p=v.pos.clone().add(new V(0,.6,0));let k2=0;const toss=()=>{k2++;return new V(Math.cos(k2*2.4)*2.2,4,Math.sin(k2*2.4)*2.2);};
 for(const it of v.inv)if(it)dropItem(it,p,toss());for(const t in v.ammo)if(v.ammo[t]>0)dropItem({kind:'ammo',t,n:v.ammo[t]},p,toss());v.mats.forEach((n,i)=>{if(n>0)dropItem({kind:'mats',t:i,n:Math.min(n,200)},p,toss());});
 v.inv=[null,null,null,null,null];
 parts.burst(tv.copy(v.pos).add(new V(0,1,0)),60,6,[new THREE.Color(.6,1.5,2.6),new THREE.Color(1.8,1.8,2.4)],.22,1.2,{up:true,grav:-2,drag:1.2});
 const killer=v.killer;const wn=o.wt?GUNS[o.wt].s:o.pick?'PICKAXE':o.blast?'ROCKET':'';v.why=wn||v.cause||'?';
 feed(v.cause==='storm'?`${v.name} was lost in the storm`:v.cause==='fall'?`${v.name} fell to their doom`:killer?`${killer.name} ⟶ ${v.name}${wn?' · '+wn:''}`:`${v.name} was eliminated`,killer&&killer.player?'me':v.player?'bad':'');
 if(killer&&killer.player){snd.play('elim');banner('ELIMINATED',v.name+' · '+(aliveN())+' LEFT',1.8,'#ff4d00');}
 if(killer&&killer.bot&&Math.random()<.35)killer.ai.emoteAt=time+1.2;
 if(v.player){snd.play('lose');spec=killer&&killer.alive?killer:null;phase='spec';build.showGhost(null);if(document.pointerLockElement){/* keep lock for spectating */}
  banner(`#${v.place}`,v.cause==='storm'?'LOST IN THE STORM':killer?'ELIMINATED BY '+killer.name:'ELIMINATED',3,'#ff4d6d');}
 checkEnd();}
function explode(p,owner,dmg,bdmg){const R=5.5;snd.play('boom',Math.max(.25,vol(p)));flashes.boom(p,900,70);shocks.fire(p,new THREE.Color(2.5,1.4,.5),R*1.4,.45);
 parts.burst(p,120,16,[new THREE.Color(3,1.8,.5),new THREE.Color(2.6,1,.2),new THREE.Color(3,2.6,1.6)],.7,.7,{drag:2.4,grav:-2});for(let i=0;i<16;i++)smoke.emit(p.x+(Math.random()-.5)*3,p.y+Math.random()*2,p.z+(Math.random()-.5)*3,(Math.random()-.5)*5,1+Math.random()*3,(Math.random()-.5)*5,.36,.34,.34,1.5,1.8+Math.random(),-.6,1.1,2);
 debris.spawn(p,0x6a5a4a,10,.18,10);
 for(const v of actors){if(!v.alive||v.state==='bus')continue;const d=v.pos.distanceTo(tv.copy(p).setY(p.y-.9));if(d<R){const f=1-d/R*.65;hurt(v,dmg*f*(v===owner?.5:1),owner,{blast:true});}}
 build.near([p.x-R,0,p.z-R,p.x+R,0,p.z+R],0,q=>{const b=q.aabb,cx=cl(p.x,b[0],b[3]),cy=cl(p.y,b[1],b[4]),cz=cl(p.z,b[2],b[5]),d=Math.hypot(cx-p.x,cy-p.y,cz-p.z);if(d<R)build.damage(q,bdmg*(1-d/R*.5),owner);});
 world.obsNear(p.x-R,p.z-R,p.x+R,p.z+R,o=>{const d=Math.hypot(o.x-p.x,o.z-p.z);if(d<R+(o.r||2))world.hitObs(o,200);});
 const cd=camera.position.distanceTo(p);shake=Math.max(shake,cl(1.2-cd/40,0,1));}
function stepRockets(dt){for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];r.life-=dt;const L=r.v.length()*dt,d=tv.copy(r.v).normalize();const h=castShot(r.p,d,L,r.owner);
  if(h.kind!=='none'||r.life<=0){const p=r.p.clone().addScaledVector(d,Math.max(0,h.t-.3));scene.remove(r.mesh);rockets.splice(i,1);explode(p,r.owner,r.dmg,r.bdmg);continue;}
  r.p.addScaledVector(r.v,dt);r.mesh.position.copy(r.p);for(let k=0;k<3;k++)parts.emit(r.p.x-d.x*k*.3,r.p.y-d.y*k*.3,r.p.z-d.z*k*.3,(Math.random()-.5),(Math.random()-.5),(Math.random()-.5),2.8,1.4,.4,.35,.25,0,2);if(Math.random()<.6)smoke.emit(r.p.x,r.p.y,r.p.z,0,.5,0,.7,.7,.72,.6,1.2,0,1,3);}}
function swingHit(a){aimRay(a,_o,_d);if(a.player){const e=tv.set(a.pos.x,a.pos.y+1.4,a.pos.z);const k=Math.max(0,tv2.subVectors(e,_o).dot(_d));_o.addScaledVector(_d,k-.6);}const h=castShot(_o,_d,a.player?3.4:2.8,a);if(h.kind==='none'||h.kind==='water')return;const hp=new V().copy(_o).addScaledVector(_d,h.t);
 if(h.kind==='actor'){hurt(h.ref,20,a,{pick:true});if(a.player)hitMarker(false);return;}
 let y=-1,n=0,mat=0;if(h.kind==='piece'){const p=h.ref;y=MATS[p.mat].yield;n=5;build.damage(p,50,a);mat=p.mat;snd.play(['wood','stone','metal','wood','wood','wood'][p.mat],a.player?1:vol(a.pos));
  debris.spawn(hp,[0xb27a44,0x9a9ea6,0xb8c0c8,0xe8e0d0,0xd06040,0x8a5a36][p.mat],5,.16,5,{dir:h.n,flat:p.mat===0||p.mat===5});}
 else if(h.kind==='obs'){const o=h.ref;if(o.k==='prop')return;y=o.yield;n=o.k==='metal'?6:8;const broke=world.hitObs(o,50);if(broke)n+=12;snd.play(['wood','stone','metal'][y],a.player?1:vol(a.pos));debris.spawn(hp,o.k==='tree'?0x8a5a2e:o.k==='rock'?0x9a958c:0xc0c8d0,6,.16,5,{dir:h.n,flat:o.k==='tree'});if(o.k==='tree')for(let i=0;i<5;i++)parts.emit(hp.x,hp.y+2+Math.random()*2,hp.z,(Math.random()-.5)*3,1,(Math.random()-.5)*3,.3,.9,.2,.2,1,3,1);}
 else if(h.kind==='terrain'){smoke.emit(hp.x,hp.y,hp.z,0,1,0,.6,.55,.42,.4,.5,0,1,2);snd.play('stone',.4);}
 if(y>=0&&n>0){a.mats[y]=Math.min(MATMAX,a.mats[y]+n);a.harvested+=n;if(a.player){hudDirty=true;matPop(y,n);if(a.player)hitMarker(false,true);}}
 if(a.player)shake=Math.max(shake,.08);}
function startHeal(a,it){const h=HEALS[it.t];if(h.sh&&a.sh>=h.cap||h.hp&&a.hp>=h.cap){if(a.player)toast(h.sh?'SHIELD FULL':'HEALTH FULL',1);return;}a.healing={it,t:0,max:h.time};}
function finishHeal(a){const it=a.healing.it,h=HEALS[it.t];a.healing=null;if(h.sh)a.sh=h.cap===50?Math.max(a.sh,Math.min(50,a.sh+h.sh)):Math.min(100,a.sh+h.sh);if(h.hp)a.hp=Math.max(a.hp,Math.min(h.cap,a.hp+h.hp));
 it.n--;if(it.n<=0){const i=a.inv.indexOf(it);if(i>=0)a.inv[i]=null;a.sel=0;}if(a.player){snd.play(h.sh?'shield':'heal');hudDirty=true;}else snd.play(h.sh?'shield':'heal',vol(a.pos)*.6);}

/* ================= per-actor update ================= */
function actorStep(a,dt){if(!a.alive){a.rig.root.visible=a.rig.die<1||time-a.deadT<1.6;return;}
 a.cd-=dt;a.placeCd-=dt;a.jumpCd=(a.jumpCd||0)-dt;a.bloom=Math.max(0,a.bloom-dt*.09);a.fireVis=Math.max(0,a.fireVis-dt*8);
 if(a.bot){if(a.frozen){a.in.mx=a.in.mz=0;a.in.fire=a.in.jump=false;}else thinkBot(a,G,dt);}
 if(a.bot&&a.ai.emoteAt&&time>a.ai.emoteAt&&a.state==='ground'&&!a.ai.enemy){a.ai.emoteAt=0;a.emote=Math.random()*3|0;a.emoteT=2.5;}
 if(a.emote>=0&&a.bot){a.emoteT-=dt;if(a.emoteT<=0||a.ai.enemy)a.emote=-1;}
 moveActor(a,dt);
 if(a.state!=='ground'){a.healing=null;return;}
 // auto-pickup ammo / mats
 for(let i=loot.length-1;i>=0;i--){const l=loot[i];if(!l.settled||(l.it.kind!=='ammo'&&l.it.kind!=='mats'))continue;if(Math.abs(l.p.x-a.pos.x)<1.5&&Math.abs(l.p.z-a.pos.z)<1.5&&Math.abs(l.p.y-a.pos.y)<2)pickupItem(a,l);}
 // reload / heal / swing / fire
 if(a.reloadT>0){a.reloadT-=dt;if(a.reloadT<=0){a.reloadT=0;finishReload(a);}}
 if(a.healing){a.healing.t+=dt;if(a.healing.t>=a.healing.max)finishHeal(a);return;}
 if(a.bmode&&a.player){if(a.in.fire&&a.placeCd<=0)placePiece(a,a.piece);return;}
 const it=a.sel>0?a.inv[a.sel-1]:null;
 if(!it){if(a.swing>0){const p=a.swing;a.swing+=dt/.5;if(p<.4&&a.swing>=.4)swingHit(a);if(a.swing>=1)a.swing=0;}if(a.swing===0&&a.in.fire&&a.cd<=0){a.swing=.001;a.cd=.5;a.emote=-1;if(a.player)snd.play('swing');}return;}
 if(it.kind==='heal'){if(a.in.fire&&!a.healing)startHeal(a,it);return;}
 const g=GUNS[it.t];if(a.reloadT>0)return;
 if(it.mag<=0&&a.ammo[g.ammo]>0&&a.cd<=0){reload(a);return;}
 const want=g.auto?a.in.fire:a.in.firePress||(a.bot&&a.in.fire);
 if(want&&a.cd<=0){if(it.mag>0){a.emote=-1;fireGun(a,it);if(it.mag===0&&a.ammo[g.ammo]>0)a.cd=Math.max(a.cd,.25);}else if(a.player&&a.in.firePress){snd.play('empty');toast('NO AMMO',.8);}}}

/* ================= storm ================= */
function stormStep(dt){const s=stormS;s.left-=dt;
 if(s.state==='wait'&&s.left<=0){s.state='shrink';s.from={...s.cur};s.left=PH[s.phase].shrink;snd.play('storm');if(phase!=='spec')banner('THE STORM IS CLOSING','PHASE '+(s.phase+1)+' · MOVE INSIDE THE CIRCLE',2.4,'#c070ff');}
 else if(s.state==='shrink'){const k=1-Math.max(0,s.left)/PH[s.phase].shrink;s.cur.x=lerp(s.from.x,s.next.x,k);s.cur.z=lerp(s.from.z,s.next.z,k);s.cur.r=lerp(s.from.r,s.next.r,k);
  if(s.left<=0){s.cur={...s.next};s.phase++;if(s.phase<s.count){s.state='wait';s.left=PH[s.phase].wait;s.next=nextCircle(s.cur,PH[s.phase].r);}else{s.state='closed';s.left=0;s.closedAt=mt;}}}
 s.dps=s.state==='closed'?10+Math.floor((mt-s.closedAt)/5)*2:PH[Math.min(s.phase,s.count-1)].dps;
 stormTick+=dt;if(stormTick>=1){stormTick-=1;for(const a of actors){if(!a.alive||a.state!=='ground')continue;const d=Math.hypot(a.pos.x-s.cur.x,a.pos.z-s.cur.z);if(d>s.cur.r)hurt(a,s.dps,null,{storm:true});}}}
function inStorm(p){return Math.hypot(p.x-stormS.cur.x,p.z-stormS.cur.z)>stormS.cur.r;}

/* ================= end of match ================= */
function checkEnd(){if(app!=='match'||phase==='won'||phase==='end')return;const al=actors.filter(a=>a.alive);
 if(al.length<=1){winner=al[0]||null;finish();}}
function finish(byClock){if(byClock){const al=actors.filter(a=>a.alive).sort((a,b)=>(b.hp+b.sh)-(a.hp+a.sh)||b.kills-a.kills||b.dmg-a.dmg);winner=al[0]||null;al.forEach((a,i)=>a.place=i+1);}
 if(winner)winner.place=1;
 if(winner&&winner.player){phase='won';endT=0;timeScale=.35;player.emote=0;player.emoteT=99;snd.play('win');banner('#1','STORM CHAMPION',4,'#ffcf3f');}
 else{phase='end';endT=0;if(player.alive)snd.play('lose');banner(byClock?'TIME!':'MATCH OVER',winner?winner.name+' WINS':'',2.5,'#ff4d00');}
 for(const a of actors)if(a.bot)a.in.fire=false;}
function showOver(){app='over';phase='done';document.body.classList.remove('playing');if(document.pointerLockElement)document.exitPointerLock();$('hud').hidden=true;$('fullmap').hidden=true;build.showGhost(null);
 const me=player,place=me.place||1,won=place===1;const surv=me.alive||won?mt:me.deadMt;
 $('oeye').textContent=won?'MATCH COMPLETE · '+fmt(mt):'MATCH COMPLETE · '+fmt(mt)+' · '+(winner?winner.name+' TOOK #1':'');
 $('oplace').innerHTML=`#${place}<small>/${BOTS+1}</small>`;$('oplace').style.color=won?'#ffcf3f':place<=5?'#ff4d00':'#f2f2f2';
 $('ores').textContent=won?'STORM CHAMPION':me.cause==='storm'?'LOST IN THE STORM':me.killer?'ELIMINATED BY '+me.killer.name:place<=5?'SO CLOSE':'ELIMINATED';
 const pts=Math.round((BOTS+2-place)*20+me.kills*100+me.dmg*.5+(won?500:0));
 const acc=me.shots?Math.round(me.hits/me.shots*100):0;
 $('stats').innerHTML=[['PLACEMENT','#'+place],['ELIMINATIONS',me.kills],['DAMAGE DEALT',me.dmg],['ACCURACY',acc+'%'],['HEADSHOTS',me.heads],['MATERIALS',me.harvested],['BUILDS',me.built],['CHESTS',me.chests],['SURVIVED',fmt(surv)]].map(r=>`<div><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
 const top=actors.slice().sort((a,b)=>b.kills-a.kills||a.place-b.place).slice(0,5);$('top').innerHTML='<p>MOST ELIMINATIONS</p>'+top.map(a=>`<div class="${a.player?'me':''}"><span>${a.name}${a===winner?' <em>#1</em>':''}</span><b>${a.kills}</b></div>`).join('');
 const tok=award(pts,won,place,me.kills);$('otok').textContent=`${pts} PTS · +${tok} TOKENS · BEST ${best()} PTS`;$('over').hidden=false;}
let lastAward=null;
function award(pts,won,place,kills){lastAward={pts,won,place,kills,diff:diff.n.toLowerCase(),mode:buildOn?'build':'no-build'};const tok=5+Math.min(60,pts/20|0);
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'stormroyale';if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'stormroyale')||0);}catch(e){return 0;}}

/* ================= input ================= */
const keys={},edge={};let mouseL=false,mouseR=false,mouseEdge=false,wheel=0,recoil=0,locked=false,wasLocked=false,sens=.0024,ffwd=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','Tab','KeyM'].includes(e.code)&&app==='match')e.preventDefault();
 if(e.code==='Escape'){if(app==='match'&&!document.pointerLockElement)pause(true);else if(app==='paused')pause(false);}});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseL=mouseR=false;});
canvas.addEventListener('mousedown',e=>{if(app!=='match')return;if(!document.pointerLockElement){try{canvas.requestPointerLock();}catch(err){}}if(e.button===0){mouseL=true;mouseEdge=true;}if(e.button===2)mouseR=true;});
addEventListener('mouseup',e=>{if(e.button===0)mouseL=false;if(e.button===2)mouseR=false;});
addEventListener('contextmenu',e=>{if(app==='match')e.preventDefault();});
addEventListener('wheel',e=>{if(app==='match')wheel+=Math.sign(e.deltaY);},{passive:true});
addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||app!=='match')return;const s=sens*(isAds()?.55/(scopeZoom()>2?2.2:1):1);camYaw-=e.movementX*s;camPitch=cl(camPitch-e.movementY*s,-1.45,1.35);});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;if(locked)wasLocked=true;else if(app==='match'&&wasLocked)pause(true);});
function pause(on){if(on&&app==='match'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');mouseL=mouseR=false;}else if(!on&&app==='paused'){app='match';$('pause').hidden=true;document.body.classList.add('playing');try{canvas.requestPointerLock();}catch(e){}}}
function isAds(){const a=player;if(!a||!a.alive||a.state!=='ground')return false;const it=a.sel>0?a.inv[a.sel-1]:null;return a.in.aim&&it&&it.kind==='gun';}
function scopeZoom(){const it=player&&player.sel>0?player.inv[player.sel-1]:null;return it&&it.kind==='gun'?GUNS[it.t].zoom:1;}
const padPrev={};
function readPlayer(dt){const a=player,I=a.in,k=keys;const ed=c=>{const v=edge[c];return v;};
 I.mz=(k.KeyW?1:0)-(k.KeyS?1:0);I.mx=(k.KeyD?1:0)-(k.KeyA?1:0);I.sprint=!!(k.ShiftLeft||k.ShiftRight);I.jump=!!k.Space;I.fire=mouseL;I.firePress=mouseEdge;I.aim=mouseR;
 let slotEdge=-1,build_=null,interact_=!!ed('KeyE'),reload_=!!ed('KeyR'),emote_=!!ed('KeyB'),mat_=!!ed('KeyZ'),map_=!!ed('KeyM')||!!ed('Tab');
 for(let i=1;i<=5;i++)if(ed('Digit'+i))slotEdge=i;if(ed('KeyX')||ed('Digit0')||ed('Backquote'))slotEdge=0;
 if(ed('KeyQ'))build_='wall';if(ed('KeyF'))build_='floor';if(ed('KeyC'))build_='ramp';if(ed('KeyV'))build_='roof';
 // gamepad
 const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.16?v:0,pr=padPrev,b=i=>bt[i]&&bt[i].pressed,eb=i=>b(i)&&!pr[i];
  if(dz(ax[0])||dz(ax[1])){I.mx=dz(ax[0]);I.mz=-dz(ax[1]);}const lx=dz(ax[2]||0),ly=dz(ax[3]||0),s=(isAds()?1.3:2.8)*dt;camYaw-=lx*Math.abs(lx)*s*1.2;camPitch=cl(camPitch-ly*Math.abs(ly)*s,-1.45,1.35);
  if(b(7)){I.fire=true;if(!pr[7])I.firePress=true;}if(b(6))I.aim=true;if(b(0))I.jump=true;if(b(10))I.sprint=true;
  if(eb(2)){if(nearInteract(a))interact_=true;else reload_=true;}if(eb(1)){if(a.bmode)slotEdge=a.sel||0;else build_=a.piece;}if(eb(3))slotEdge=0;if(eb(8))emote_=true;if(eb(12))map_=true;if(eb(9))pause(true);if(eb(11))mat_=true;
  if(eb(5)){if(a.bmode)build_=['wall','floor','ramp','roof'][(['wall','floor','ramp','roof'].indexOf(a.piece)+1)%4];else wheel++;}if(eb(4)){if(a.bmode)build_=['wall','floor','ramp','roof'][(['wall','floor','ramp','roof'].indexOf(a.piece)+3)%4];else wheel--;}
  for(let i=0;i<16;i++)pr[i]=b(i);}
 mouseEdge=false;
 if(map_){$('fullmap').hidden=!$('fullmap').hidden;if(!$('fullmap').hidden)drawFull();}
 if(phase==='bus'){if(I.jump&&busT>1)jump(a);I.jump=false;return;}
 if(phase==='spec'||phase==='end'||phase==='won')return;
 a.yaw=camYaw;a.pitch=camPitch;if(a.emote>=0){a.yaw=a.emYaw;}
 if(a.state!=='ground')return;
 if(wheel){const order=[0,1,2,3,4,5].filter(s=>s===0||a.inv[s-1]);let i=order.indexOf(a.sel);i=(i+(wheel>0?1:-1)+order.length)%order.length;select(a,order[i]);wheel=0;}
 if(slotEdge>=0)select(a,slotEdge,true);
 if(build_&&buildOn){a.piece=build_;a.bmode=true;a.healing=null;a.reloadT=0;a.emote=-1;placePiece(a,build_);hudDirty=true;}else if(build_&&!buildOn)toast('BUILDING IS OFF IN THIS MODE',1);
 if(mat_){a.bmat=(a.bmat+1)%3;hudDirty=true;snd.play('click');}
 if(interact_)interact(a);if(reload_)reload(a);
 if(emote_){a.emote=(a.emote+1)%3;a.emYaw=a.yaw;a.healing=null;a.bmode=false;snd.play('emote');toast('EMOTE · '+EMOTES[a.emote],1.2);}}

/* ================= main step ================= */
let hurtFlash=0,hurtDir=0,hurtDirT=0,hudDirty=true;
function step(dt){dt=Math.min(dt,.05);
 for(const k in edge){}// (edges consumed in readPlayer)
 if(app==='paused'||app==='over'||app==='menu'){for(const k in edge)delete edge[k];if(app==='menu')menuStep(dt);visuals(dt);return;}
 const sdt=dt*timeScale*(phase==='spec'&&(keys.KeyF||ffwd)?4:1);
 const n=sdt>.034?Math.ceil(sdt/.034):1;
 if(app==='match')readPlayer(dt);for(const k in edge)delete edge[k];
 for(let i=0;i<n;i++)sim(sdt/n);
 if(phase==='won'||phase==='end'){endT+=dt;if(endT>(phase==='won'?4.2:2.6)){timeScale=1;showOver();}}
 visuals(dt);}
function sim(dt){time+=dt;mt+=dt;
 // bus
 if(bus&&busT*bus.speed<bus.len+60){busT+=dt;bus.pos.copy(bus.p0).addScaledVector(bus.dir,busT*bus.speed);busMesh.position.copy(bus.pos);busMesh.rotation.y=Math.atan2(bus.dir.x,bus.dir.z);busMesh.userData.props.forEach(p=>p.rotation.z+=dt*20);
  if(busT*bus.speed>=bus.len){for(const a of actors)if(a.state==='bus')jump(a);}}else busMesh.visible=false;
 stormStep(dt);
 for(const a of actors)actorStep(a,dt);
 stepRockets(dt);stepLoot(dt);build.update(dt);
 if(mt>=MATCH&&phase!=='won'&&phase!=='end'&&phase!=='done')finish(true);}
function stepLoot(dt){for(const l of loot){l.age+=dt;if(!l.settled){l.v.y-=20*dt;l.p.addScaledVector(l.v,dt);const g=surfaceAt(l.p.x,l.p.z,l.p.y+.3);if(l.p.y<=g+.05){l.p.y=g+.05;l.v.set(0,0,0);l.settled=true;}}}}
function menuStep(dt){menuT+=dt;}

/* ================= visuals ================= */
const stCol=new THREE.Color(),fogBase=new THREE.Color(SKY.fog),fogStorm=new THREE.Color(0x6a3aa0);let stormK=0,frame=0;
function visuals(dt){frame++;const vt=time;
 world.update(dt,app==='menu'?menuT:time);parts.update(dt);smoke.update(dt);flashes.update(dt);shocks.update(dt);debris.update(dt);tracers.update(dt,camera);
 // actors
 const cp=camera.position;
 for(const a of actors){const r=a.rig;if(app==='menu'){r.root.visible=false;continue;}if(a.state==='bus'){r.root.visible=false;continue;}
  if(a.alive)r.root.visible=true;const d2=cp.distanceToSquared(a.pos);if(d2>260*260){r.root.visible=false;continue;}
  if(d2>90*90&&(frame+a.id)%3)continue;
  r.root.position.copy(a.pos);r.root.rotation.y=a.yaw;
  const it=a.sel>0?a.inv[a.sel-1]:null;let h=null;if(a.healing)h='heal';else if(a.bmode)h='build';else if(it&&it.kind==='gun')h='gun';else if(!it)h='pick';else if(it.kind==='heal')h='heal';
  if(a.state!=='ground'||!a.alive||a.emote>=0)hold(r,'none');else if(h==='gun')hold(r,'gun',it);else if(h==='pick')hold(r,'pick');else if(h==='heal')hold(r,'heal',a.healing?a.healing.it:it);else hold(r,'none');
  const fx=Math.sin(a.yaw),fz=Math.cos(a.yaw);const lvz=a.vel.x*fx+a.vel.z*fz,lvx=-(a.vel.x*-fz+a.vel.z*fx);
  const st={mode:a.state,speed:Math.hypot(a.vel.x,a.vel.z),lvx,lvz,ground:a.ground||a.inWater,pitch:a.pitch,hold:h,swing:a.swing,fire:a.fireVis,emote:a.alive&&a.state==='ground'?a.emote:-1,dead:!a.alive,vy:a.vel.y,turn:0};
  animRig(r,st,d2>90*90?dt*3:dt,vt);
  if(a.alive&&a.ground&&st.speed>3&&a.state==='ground'){a.stepT-=dt*st.speed;if(a.stepT<=0){a.stepT=2.2;if(d2<40*40)snd.play('step',cl(1-Math.sqrt(d2)/40,0,1)*(a.player?.6:1));}}
  if(!a.alive&&r.die>=1){const k=cl((time-a.deadT-.9)/.7,0,1);r.root.scale.setScalar(1-k);if(k>0&&k<1&&Math.random()<.5)parts.emit(a.pos.x+(Math.random()-.5),a.pos.y+Math.random()*.6,a.pos.z+(Math.random()-.5),0,2,0,.6,1.4,2.6,.18,.6,-1,1);}
  if((a.state==='fall'||a.state==='glide')&&Math.random()<.5){const hx=a.pos.x,hy=a.pos.y+1,hz=a.pos.z;parts.emit(hx+(Math.random()-.5)*1.4,hy,hz+(Math.random()-.5)*1.4,0,4,0,.8,.9,1.1,.12,.4,0,1);}}
 if(player&&app==='match'&&(isAds()&&scopeZoom()>2||camClose)&&phase!=='spec')player.rig.root.visible=false;
 // loot + containers (cull far)
 for(const l of loot){const d2=cp.distanceToSquared(l.p);const v=d2<80*80;l.mesh.visible=v;if(l.beam)l.beam.visible=v&&l.settled;if(!v)continue;l.spin+=dt*1.4;l.mesh.position.set(l.p.x,l.p.y+.35+(l.settled?Math.sin(l.spin*1.3)*.08:0),l.p.z);l.mesh.rotation.y=l.spin;if(l.beam)l.beam.position.copy(l.p);}
 for(const c of containers){const d2=cp.distanceToSquared(c.p);c.g.visible=d2<110*110&&!(c.kind==='ammo'&&c.opened);if(c.glow&&!c.opened){c.glow.material.opacity=.55+Math.sin(vt*4+c.p.x)*.25;if(d2<30*30&&Math.random()<dt*6)parts.emit(c.p.x+(Math.random()-.5)*1.2,c.p.y+.3+Math.random()*.6,c.p.z+(Math.random()-.5)*1.2,0,1.2,0,2.4,1.9,.6,.12,.9,0,1);}}
 // storm wall
 if(stormS&&app!=='menu'){const s=stormS.cur;storm.mesh.visible=s.r>.5&&s.r<330;storm.mesh.position.set(s.x,-40,s.z);storm.mesh.scale.set(Math.max(.5,s.r),1,Math.max(.5,s.r));storm.U.uR.value=Math.max(1,s.r);storm.U.uT.value=vt;}else storm.mesh.visible=false;
 // camera + storm tint
 cameras(dt);
 const focus=camFocus();stormK+=(((stormS&&app!=='menu'&&focus&&focus.state!=='bus'&&stormS.cur.r<330&&inStorm(focus.pos))?1:0)-stormK)*Math.min(1,dt*3);
 scene.fog.color.copy(fogBase).lerp(fogStorm,stormK);scene.fog.far=lerp(950,170,stormK);scene.fog.near=lerp(150,6,stormK);if(fxStack&&fxStack.grade)fxStack.grade.uniforms.tint.value.setRGB(1-stormK*.12,1-stormK*.25,1+stormK*.05);
 if(vis.water)world.waterU.uFogC.value.copy(scene.fog.color),world.waterU.uFogN.value=scene.fog.near,world.waterU.uFogF.value=scene.fog.far;
 // shadow follows the view
 const ft=focus?focus.pos:menuFocus;sun.target.position.set(ft.x,ft.y,ft.z);sun.position.copy(sun.target.position).addScaledVector(SUN,220);
 // ambient audio
 if(snd.ac){const f=focus;const alt=f&&(f.state==='fall'||f.state==='glide')?1:0;snd.set('wind',alt?(f.state==='fall'?.12:.06):.012,alt?1400:500);snd.set('storm',app==='match'||app==='paused'?(.02+stormK*.2):0,180+stormK*200);snd.set('engine',phase==='bus'&&app==='match'?.05:0);}
 hud(dt);}

/* ================= camera ================= */
const camPos=new V(),camLook=new V(),menuFocus=new V();let camClose=false;let camInit=true,curFov=72;
function camFocus(){if(app!=='match'&&app!=='paused'&&app!=='over')return null;if(phase==='spec'||(phase==='end'&&!player.alive)){if(!spec||!spec.alive){spec=actors.filter(a=>a.alive).sort((a,b)=>b.kills-a.kills)[0]||null;}return spec||player;}return player;}
function camBlock(from,to){const d=tv2.subVectors(to,from);const L=d.length();if(L<.01)return to;d.divideScalar(L);const h=castShot(from,d,L,null,true);if(h.kind!=='none'&&h.t<L){to.copy(from).addScaledVector(d,Math.max(.25,h.t-.25));}return to;}
function cameras(dt){const k=1-Math.exp(-dt*14);let fov=72;
 if(app==='menu'||!stormS){const lb=lobby.base||new V(0,10,0);const gy=world.heightAt(lb.x,lb.z);menuFocus.set(lb.x,gy+1.2,lb.z);
  for(const l of lobby){l.t+=dt;const st={mode:'ground',speed:0,lvx:0,lvz:0,ground:true,pitch:-.05,hold:l.e<0?'pick':null,swing:0,fire:0,emote:l.e,dead:false,vy:0};animRig(l.r,st,dt,menuT+l.t);}
  const a=menuT*.06;camera.position.set(lb.x+6.5+Math.sin(a)*.5,gy+1.7+Math.sin(a*.7)*.15,lb.z+Math.sin(a*.5)*.6);camera.lookAt(lb.x-3.4,gy+1.5,lb.z+.85);camera.fov=50;camera.updateProjectionMatrix();return;}
 const f=camFocus();if(!f)return;
 if(phase==='bus'&&player.state==='bus'){const bp=bus.pos;const d=36;camPos.set(bp.x-Math.sin(camYaw)*Math.cos(camPitch)*d,bp.y+6-Math.sin(camPitch)*d,bp.z-Math.cos(camYaw)*Math.cos(camPitch)*d);camLook.copy(bp).add(tv.set(0,2,0));camera.position.copy(camPos);camera.lookAt(camLook);fov=70;}
 else{const isMe=f===player&&phase!=='spec';let yaw=isMe?camYaw:f.yaw,pitch=isMe?camPitch:cl(f.pitch*.5-.15,-.6,.5);
  if(!isMe){camYaw=lerpAng(camYaw,yaw,Math.min(1,dt*4));camPitch+=(pitch-camPitch)*Math.min(1,dt*3);yaw=camYaw;pitch=camPitch;}
  let dist=3.7,sh=.75,up=.45;const ads=isMe&&isAds();if(f.state==='fall'||f.state==='glide'){dist=f.state==='fall'?6:7;sh=0;up=f.state==='fall'?3.2:1.4;if(f.state==='fall')pitch=Math.min(pitch,-.15)-.38;}if(ads){dist=2.1;sh=.68;up=.32;fov=72/scopeZoom();if(scopeZoom()>2){dist=.0;sh=0;up=.15;}}
  if(isMe&&f.emote>=0&&f.state==='ground'){dist=4.2;sh=0;up=.2;}if(phase==='won'){const t=endT*.5;yaw=f.yaw+Math.PI+Math.sin(t)*.6;pitch=-.12;dist=4.6;sh=0;}
  const cy=Math.cos(pitch),fwd=tv.set(Math.sin(yaw)*cy,Math.sin(pitch),Math.cos(yaw)*cy),right=tv3.set(-Math.cos(yaw),0,Math.sin(yaw));
  const pivot=new V(f.pos.x,f.pos.y+1.55+(f.state==='fall'?.5:0),f.pos.z).addScaledVector(right,sh*.35);
  const want=new V().copy(pivot).addScaledVector(fwd,-dist).addScaledVector(right,sh*.65).add(new V(0,up,0));
  if(f.state==='ground')camBlock(pivot,want);camClose=want.distanceTo(pivot)<1.15&&f===player;
  const wg=world.heightAt(want.x,want.z)+.35;if(want.y<wg)want.y=wg;
  if(camInit){camPos.copy(want);camInit=false;}else camPos.lerp(want,f===player&&phase!=='spec'?1:k);
  camera.position.copy(camPos);camLook.copy(camPos).addScaledVector(fwd,10);if(phase==='won'){camLook.set(f.pos.x,f.pos.y+1.1,f.pos.z);}camera.lookAt(camLook);
  if(f.state==='ground'&&isMe&&f.in.sprint&&f.in.mz>0&&!ads)fov+=6;if(f.state==='fall')fov=82;
  // recoil kick
  if(isMe&&recoil>0){camPitch+=recoil*.5;recoil*=Math.exp(-dt*18);if(recoil<.001)recoil=0;}}
 shake=Math.max(0,shake-dt*1.8);if(shake>0){const s=shake*shake*.35;camera.position.x+=(Math.random()-.5)*s;camera.position.y+=(Math.random()-.5)*s;camera.position.z+=(Math.random()-.5)*s;}
 curFov+=(fov-curFov)*Math.min(1,dt*12);camera.fov=curFov;camera.updateProjectionMatrix();}
function lerpAng(a,b,t){return a+angDiff(a,b)*t;}

/* ================= HUD ================= */
const mini=$('mini').getContext('2d'),fullC=$('fullmapc'),full=fullC.getContext('2d');let banT=0,toastT=0,hudT=0,dnums=[];
function banner(t,s,dur,col='#fff'){$('bt').textContent=t;$('bt').style.color=col;$('bs').textContent=s||'';$('banner').classList.add('on');banT=dur;}
function toast(t,dur=1.6){$('toast').textContent=t;$('toast').classList.add('on');toastT=dur;}
function feed(t,cls){const d=document.createElement('div');d.textContent=t;if(cls)d.className=cls;$('feed').prepend(d);setTimeout(()=>d.remove(),6000);while($('feed').children.length>6)$('feed').lastChild.remove();}
function hitMarker(head,harvest){const h=$('hitm');h.className=head?'on head':harvest?'on harv':'on';clearTimeout(h._t);h._t=setTimeout(()=>h.className='',140);}
function matPop(t,n){const el=$('m'+t);if(!el)return;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}
function dmgNum(v,d,head,shieldOnly){const el=document.createElement('div');el.className='dn'+(head?' head':shieldOnly||v.sh>0?' sh':'');el.textContent=d;$('dnums').appendChild(el);dnums.push({el,p:new V(v.pos.x+(Math.random()-.5)*.6,v.pos.y+1.9,v.pos.z+(Math.random()-.5)*.6),t:0});}
const prj=new V();
function hud(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on');}
 // damage numbers
 for(let i=dnums.length-1;i>=0;i--){const n=dnums[i];n.t+=dt;n.p.y+=dt*.9;if(n.t>.9){n.el.remove();dnums.splice(i,1);continue;}prj.copy(n.p).project(camera);if(prj.z>1){n.el.style.opacity=0;continue;}n.el.style.transform=`translate(${(prj.x*.5+.5)*innerWidth}px,${(-prj.y*.5+.5)*innerHeight}px) translate(-50%,-50%) scale(${1+Math.max(0,.25-n.t)*2})`;n.el.style.opacity=1-Math.max(0,n.t-.6)/.3;}
 if(app!=='match'&&app!=='paused')return;const a=player,f=camFocus()||a;
 hurtFlash=Math.max(0,hurtFlash-dt*1.5);$('dmg').style.opacity=hurtFlash;hurtDirT=Math.max(0,hurtDirT-dt);$('hdir').style.opacity=Math.min(1,hurtDirT);$('hdir').style.transform=`rotate(${-angDiff(camYaw,hurtDir)}rad)`;
 $('stormfx').style.opacity=stormK*.9;
 // crosshair + build ghost + prompt (every frame)
 const it=a.sel>0?a.inv[a.sel-1]:null,alive=a.alive&&a.state==='ground'&&phase!=='spec';
 const ads=isAds(),scope=ads&&scopeZoom()>2;$('scope').hidden=!scope;$('cross').hidden=!alive||scope||a.bmode;
 if(alive&&it&&it.kind==='gun'){const g=GUNS[it.t];const s=(g.spread[ads?1:0]+(Math.hypot(a.vel.x,a.vel.z)>1.5?g.move:0)+(a.ground?0:.05)+a.bloom)*innerHeight/(2*Math.tan(camera.fov*Math.PI/360))+4;$('cross').style.setProperty('--s',Math.min(80,s).toFixed(1)+'px');$('cross').className=it.t==='sg'?'sg':'';}else{$('cross').style.setProperty('--s','4px');$('cross').className='dot';}
 if(alive&&a.bmode&&buildOn){const pl=build.plan(a,a.piece);const ok=pl.ok&&a.mats.some(m=>m>=COST);build.showGhost(pl,ok);}else build.showGhost(null);
 let prompt='';if(alive){const t=nearInteract(a);if(t){if(t.kind==='chest')prompt='<kbd>E</kbd> OPEN CHEST';else if(t.kind==='ammo')prompt='<kbd>E</kbd> OPEN AMMO BOX';else{const l=t.ref;prompt=`<kbd>E</kbd> PICK UP <b style="color:${RAR[itemRar(l.it)].c}">${itemName(l.it)}</b>`;}}}
 if(phase==='bus')prompt=player.state==='bus'?'<kbd>SPACE</kbd> JUMP FROM THE SKY BARGE':'';if(a.state==='fall')prompt='<kbd>SPACE</kbd> DEPLOY GLIDER';
 if(hc.prompt!==prompt){hc.prompt=prompt;$('prompt').innerHTML=prompt;$('prompt').style.opacity=prompt?1:0;}
 // heal / reload progress
 const prog=a.healing?{t:'USING '+HEALS[a.healing.it.t].n,k:a.healing.t/a.healing.max,r:a.healing.max-a.healing.t}:a.reloadT>0&&it?{t:'RELOADING',k:1-a.reloadT/GUNS[it.t].reload,r:a.reloadT}:null;
 $('use').style.opacity=prog&&alive?1:0;if(prog){$('uset').textContent=prog.t+' · '+prog.r.toFixed(1)+'s';$('usei').style.width=(prog.k*100).toFixed(1)+'%';}
 // spectate
 $('spec').hidden=!(phase==='spec'||phase==='end'&&!player.alive);$('hud').classList.toggle('specm',!$('spec').hidden);if(!$('spec').hidden)$('specn').textContent=f&&f!==player?f.name+' · '+f.kills+' ELIMS · '+Math.ceil(f.hp)+' HP':'—';
 if(phase==='spec'){if(edgeSpec()){const al=actors.filter(x=>x.alive);if(al.length){const i=al.indexOf(spec);spec=al[(i+1)%al.length];}}if(keys.Enter&&app==='match'){keys.Enter=false;finishSpectate();}}
 drawMini();
 hudT-=dt;if(hudT>0&&!hudDirty)return;hudT=.1;hudDirty=false;
 // bars
 const set=(id,v)=>{if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}};
 set('hpn',Math.ceil(a.hp));set('shn',Math.ceil(a.sh));$('hpi').style.width=a.hp+'%';$('shi').style.width=a.sh+'%';
 set('alive',aliveN());set('kills',a.kills);
 const s=stormS;let stt='';if(s.state==='wait')stt=(s.phase===0?'STORM FORMS ':'STORM SHRINKS ')+'IN '+fmt(s.left);else if(s.state==='shrink')stt='STORM SHRINKING · '+fmt(s.left);else stt='FINAL STORM';if(a.alive&&a.state==='ground'&&inStorm(a.pos))stt='IN THE STORM · −'+s.dps+' HP/S · '+Math.round(Math.hypot(a.pos.x-s.cur.x,a.pos.z-s.cur.z)-s.cur.r)+'M TO SAFETY';set('stormt',stt);$('stormt').classList.toggle('warn',stt.startsWith('IN THE'));set('clock',fmt(MATCH-mt));$('clock').style.color=MATCH-mt<60?'#ff4d00':'';
 // hotbar
 const hb=[{n:'PICK',sub:'HARVEST',r:-1,on:a.sel===0&&!a.bmode}];for(let i=0;i<5;i++){const x=a.inv[i];hb.push(x?{n:x.kind==='gun'?GUNS[x.t].s:HEALS[x.t].n.split(' ')[0],sub:x.kind==='gun'?x.mag+'/'+a.ammo[GUNS[x.t].ammo]:'×'+x.n,r:itemRar(x),on:a.sel===i+1&&!a.bmode}:{n:'',sub:'',r:-2,on:false});}
 const key=JSON.stringify(hb);if(hc.hb!==key){hc.hb=key;$('hotbar').innerHTML=hb.map((h,i)=>`<div class="sl${h.on?' on':''}${h.r===-2?' empty':''}" style="--rc:${h.r>=0?RAR[h.r].c:h.r===-1?'#ff4d00':'#444'}"><i>${i===0?'X':i}</i><b>${h.n}</b><span>${h.sub}</span></div>`).join('');}
 set('m0',a.mats[0]);set('m1',a.mats[1]);set('m2',a.mats[2]);for(let i=0;i<3;i++)$('m'+i).parentElement.classList.toggle('sel',a.bmat===i&&a.bmode);
 $('buildbar').hidden=!a.bmode||!buildOn;if(a.bmode)for(const p of['wall','floor','ramp','roof'])$('bp-'+p).classList.toggle('on',a.piece===p);set('bmat',['WOOD','STONE','METAL'][a.bmat]);
 if(it&&it.kind==='gun'&&!a.bmode){set('ammo',it.mag);set('ammor','/ '+a.ammo[GUNS[it.t].ammo]+' '+AMMO[GUNS[it.t].ammo].n);$('wname').textContent=RAR[it.r].n+' '+GUNS[it.t].n;$('wname').style.color=RAR[it.r].c;$('ammobox').hidden=false;}else $('ammobox').hidden=true;}
let specPrev=false;function edgeSpec(){const on=!!(keys.Space||mouseL);const r=on&&!specPrev;specPrev=on;return r;}
function finishSpectate(){if(phase!=='spec')return;// fast-forward: resolve the rest of the match instantly
 showOver();}
const hc={};
function drawMini(){const c=mini,W=200,f=camFocus()||player,S=world.mapScale,span=240,sc=W/span;c.clearRect(0,0,W,W);c.save();c.beginPath();c.arc(W/2,W/2,W/2-2,0,7);c.clip();
 const mx=(f.pos.x+EXT)*S,mz=(f.pos.z+EXT)*S,sp=span*S;c.fillStyle='#1d5b8a';c.fillRect(0,0,W,W);c.drawImage(world.map,mx-sp/2,mz-sp/2,sp,sp,0,0,W,W);
 const P=(x,z)=>[W/2+(x-f.pos.x)*sc,W/2+(z-f.pos.z)*sc];
 if(stormS){const s=stormS.cur;const[cx,cy]=P(s.x,s.z);c.fillStyle='rgba(110,40,190,.45)';c.beginPath();c.rect(0,0,W,W);c.arc(cx,cy,Math.max(0,s.r*sc),0,Math.PI*2,true);c.fill('evenodd');
  c.strokeStyle='#c27cff';c.lineWidth=2;c.beginPath();c.arc(cx,cy,Math.max(0,s.r*sc),0,7);c.stroke();if(stormS.state==='wait'&&stormS.next){const n=stormS.next,[nx,ny]=P(n.x,n.z);c.strokeStyle='#fff';c.lineWidth=1.5;c.setLineDash([4,3]);c.beginPath();c.arc(nx,ny,n.r*sc,0,7);c.stroke();c.setLineDash([]);}}
 if(phase==='bus'&&bus){const[a1,b1]=P(bus.p0.x,bus.p0.z),[a2,b2]=P(bus.p0.x+bus.dir.x*bus.len,bus.p0.z+bus.dir.z*bus.len);c.strokeStyle='rgba(255,255,255,.8)';c.setLineDash([6,4]);c.lineWidth=2;c.beginPath();c.moveTo(a1,b1);c.lineTo(a2,b2);c.stroke();c.setLineDash([]);const[bx,by]=P(bus.pos.x,bus.pos.z);c.fillStyle='#ff4d00';c.beginPath();c.arc(bx,by,5,0,7);c.fill();}
 if(stormS&&f.state==='ground'){const n=stormS.state==='wait'&&stormS.next?stormS.next:stormS.cur,dx=n.x-f.pos.x,dz=n.z-f.pos.z,d=Math.hypot(dx,dz);if(d>n.r&&d>1){const k=(d-n.r)/d;c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2;c.setLineDash([3,3]);c.beginPath();c.moveTo(W/2,W/2);c.lineTo(W/2+dx*k*sc,W/2+dz*k*sc);c.stroke();c.setLineDash([]);}}
 c.font='700 9px "JetBrains Mono",monospace';c.textAlign='center';for(const p of world.pois){const[x,y]=P(p.x,p.z);if(x>10&&x<W-10&&y>10&&y<W-10){c.fillStyle='rgba(0,0,0,.6)';c.fillText(p.n,x+1,y+1);c.fillStyle='#fff';c.fillText(p.n,x,y);}}
 c.restore();c.save();c.translate(W/2,W/2);c.rotate(-(f===player?camYaw:f.yaw)+Math.PI);c.fillStyle=f===player?'#ff4d00':'#fff';c.strokeStyle='#000';c.lineWidth=1.5;c.beginPath();c.moveTo(0,-8);c.lineTo(5.5,6);c.lineTo(0,3);c.lineTo(-5.5,6);c.closePath();c.fill();c.stroke();c.restore();
 c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.beginPath();c.arc(W/2,W/2,W/2-2,0,7);c.stroke();c.fillStyle='#fff';c.font='700 11px "JetBrains Mono",monospace';c.fillText('N',W/2,14);}
function drawFull(){const c=full,W=fullC.width,s=W/(2*EXT),P=(x,z)=>[(x+EXT)*s,(z+EXT)*s];c.drawImage(world.map,0,0,W,W);
 if(stormS){const st=stormS.cur,[cx,cy]=P(st.x,st.z);c.fillStyle='rgba(110,40,190,.4)';c.beginPath();c.rect(0,0,W,W);c.arc(cx,cy,st.r*s,0,Math.PI*2,true);c.fill('evenodd');c.strokeStyle='#c27cff';c.lineWidth=2;c.beginPath();c.arc(cx,cy,st.r*s,0,7);c.stroke();
  if(stormS.state==='wait'&&stormS.next){const n=stormS.next,[nx,ny]=P(n.x,n.z);c.strokeStyle='#fff';c.setLineDash([6,4]);c.beginPath();c.arc(nx,ny,n.r*s,0,7);c.stroke();c.setLineDash([]);}}
 if(bus&&phase==='bus'){const[a1,b1]=P(bus.p0.x,bus.p0.z),[a2,b2]=P(bus.p0.x+bus.dir.x*bus.len,bus.p0.z+bus.dir.z*bus.len);c.strokeStyle='#fff';c.lineWidth=3;c.setLineDash([10,6]);c.beginPath();c.moveTo(a1,b1);c.lineTo(a2,b2);c.stroke();c.setLineDash([]);}
 c.textAlign='center';c.font='400 15px Anton,Impact,sans-serif';world.pois.forEach((p,i)=>{const[x,y0]=P(p.x,p.z),y=y0+(p.lab||0);c.fillStyle='rgba(0,0,0,.65)';c.fillText(p.n,x+1.5,y+1.5);c.fillStyle='#fff';c.fillText(p.n,x,y);});
 const f=camFocus()||player;if(f&&f.state!=='bus'||bus){const pp=f&&f.state!=='bus'?f.pos:bus.pos;const[x,y]=P(pp.x,pp.z);c.fillStyle='#ff4d00';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.arc(x,y,6,0,7);c.fill();c.stroke();}}
setInterval(()=>{if(!$('fullmap').hidden&&app==='match')drawFull();},500);

/* ================= rendering ================= */
const POST={exposure:1.0,bloom:.32,bloomThreshold:.94,bloomRadius:.45,vignette:.28,saturation:1.12,grain:.02,aoStrength:.8};
let fxStack=null,gfx=quality();
function applyQuality(q){gfx=q;fxStack=null;sun.castShadow=q>0;sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}R.setPixelRatio(Math.min(devicePixelRatio,q===0?1:1.5));}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);if(fxStack)fxStack.setSize(w,h);}
 camera.aspect=w/h;camera.updateProjectionMatrix();parts.U.uScale.value=smoke.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));
 if(!fxStack){fxStack=cinematic(R,scene,camera,{...POST,quality:gfx});fxStack.setSize(w,h);}fxStack.render();}
addEventListener('resize',()=>{if(fxStack)fxStack.setSize(innerWidth,innerHeight);fullC.width=fullC.height=Math.min(700,innerHeight*.86|0);});fullC.width=fullC.height=Math.min(700,innerHeight*.86|0);

/* ================= menu wiring ================= */
const seg=(id,key)=>{const el=$(id);const set=v=>{opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));};set(opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>{set(+b.dataset.v);snd.init();snd.play('click');});};
seg('o-diff','diff');seg('o-build','build');
$('go').onclick=()=>{start();try{canvas.requestPointerLock();}catch(e){}};$('again').onclick=()=>{start();try{canvas.requestPointerLock();}catch(e){}};$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{pause(false);toMenu();};$('specres').onclick=()=>finishSpectate();
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Storm Royale\nPoints: ${a.pts||0}\nPlacement: #${a.place||'?'} of ${BOTS+1}\nEliminations: ${a.kills||0}\nBots: ${a.diff||''} · Mode: ${a.mode||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] stormroyale '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= context for the bots ================= */
const G={world,build,get actors(){return actors;},get loot(){return loot;},get containers(){return containers;},get storm(){const s=stormS;return{state:s.state,phase:s.phase,count:s.count,cur:s.cur,next:s.next||s.cur,left:s.left};},get time(){return time;},get diff(){return diff;},get busT(){return busT;},get buildOn(){return buildOn;},
 los,select,reload,placePiece,interact,jump};

/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.ROYALE={get state(){return app==='match'?phase:app;},get app(){return app;},get phase(){return phase;},step,render,start,toMenu,pause,
 get player(){return player;},get actors(){return actors;},get bots(){return actors.filter(a=>a.bot);},get alive(){return aliveN();},get storm(){return stormS;},get bus(){return bus;},get loot(){return loot;},get containers(){return containers;},
 get clock(){return MATCH-mt;},setClock(s){mt=MATCH-s;},get time(){return mt;},world,build,scene,R,camera,G,keys,
 jump(){jump(player);},drop(x,z){if(player.state==='bus')jump(player);player.pos.set(x,world.heightAt(x,z)+.2,z);player.state='ground';player.ground=true;player.vel.set(0,0,0);phase='play';banT=.01;},
 teleport(a,x,z){a.pos.set(x,world.heightAt(x,z)+.2,z);a.state='ground';a.vel.set(0,0,0);if(a===player&&phase==='bus')phase='play';},
 dropAll(){for(const a of actors)if(a.state==='bus')jump(a);},land(){for(const a of actors){if(a.state==='bus')jump(a);if(a.state!=='ground'){const t=a.bot?a.ai.dropTo:{x:a.pos.x,z:a.pos.z};a.pos.set(t.x,world.heightAt(t.x,t.z)+.3,t.z);a.state='ground';a.vel.set(0,0,0);}}if(phase==='bus'||phase==='drop')phase='play';},
 give(a,it){const i=a.inv.indexOf(null);if(i>=0){a.inv[i]=it;select(a,i+1,true);}return it;},makeGun,makeHeal,
 kill(a,by){if(a.alive)hurt(a,999,by||null,{force:true});},killBots(n){let k=0;for(const a of actors)if(a.bot&&a.alive&&(n==null||k<n)){hurt(a,999,null,{force:true});k++;}},god(on=true){player.god=on;},
 damage(a,n,by){return hurt(a,n,by||null,{});},fire(a){if(a.inv[a.sel-1]&&a.inv[a.sel-1].kind==='gun')fireGun(a,a.inv[a.sel-1]);},place:placePiece,interact,select,reload,
 aim(yaw,pitch){camYaw=yaw;camPitch=pitch;player.yaw=yaw;player.pitch=pitch;},
 aimAt(x,y,z){for(let i=0;i<4;i++){cameras(0);const c=camera.position;camYaw=Math.atan2(x-c.x,z-c.z);camPitch=Math.atan2(y-c.y,Math.hypot(x-c.x,z-c.z));player.yaw=camYaw;player.pitch=camPitch;}cameras(0);camera.updateMatrixWorld();},setQuality:applyQuality,get spec(){return spec;},finishSpectate,get result(){return lastAward;},parts,
 press(code){edge[code]=true;},
 mouse(l,r=false){if(l&&!mouseL)mouseEdge=true;mouseL=!!l;mouseR=!!r;},
 freezeBots(on=true){for(const a of actors)if(a.bot)a.frozen=on;},castShot,los};
// frozen bots (tests): skip their brains
{const orig=thinkBot;}
