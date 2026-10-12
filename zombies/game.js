// NIGHTFALL — round-based undead survival until dawn. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {makeTextures,labelTex,DISP,MONO} from './tex.js';
import {GameMap,W,H,PERKS,AREAS} from './map.js';
import {setGrime} from './rig.js';
import {Zombie} from './undead.js';
import {Ally,ALLY_SKILL} from './ally.js';
import {WPN,BOX_POOL,stats,gunModel,ViewModel,gunMats} from './weapons.js';
import {FX} from './fx.js';
import {Sound} from './sound.js';
import {HUD,mmss,PUP} from './hud.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,TAU=Math.PI*2,smooth=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const DIFFS=[{n:'CASUAL',hp:.75,dmg:.6,count:.8,spd:.92,run:.7,alive:16,spawn:1.25,start:750,boss:.75},{n:'SURVIVOR',hp:1,dmg:1,count:1,spd:1,run:1,alive:22,spawn:1,start:500,boss:1},{n:'NIGHTMARE',hp:1.3,dmg:1.35,count:1.2,spd:1.07,run:1.35,alive:26,spawn:.8,start:500,boss:1.35}];
const MV={walk:4.4,sprint:6.7,ads:2.7,down:.8,accel:12,jump:5.4,grav:16,eye:1.62,r:.3,step:.45,mantle:.5,head:1.8};
const ZDMG=45,CRATE_COST=950,FORGE_COST=5000;

/* ================= boot ================= */
try{await Promise.race([Promise.all([document.fonts.load('64px Anton'),document.fonts.load('20px "JetBrains Mono"')]),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
const canvas=$('c');const RR=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});RR.setPixelRatio(Math.min(devicePixelRatio,1.5));RR.shadowMap.enabled=true;RR.shadowMap.type=THREE.PCFSoftShadowMap;RR.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(75,1,.05,900);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(56,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0x8090c0,0x201814,.6),vmKey=new THREE.DirectionalLight(0xc8d4ff,.9),vmFill=new THREE.DirectionalLight(0xffd8b0,.45),vmFlash=new THREE.PointLight(0xffaa55,0,3,1.5);
vmKey.position.set(-1,2,.5);vmFill.position.set(1,-.5,1);vmFlash.position.set(.1,-.05,-.7);vmScene.add(vmHemi,vmKey,vmFill,vmFlash);
const T=makeTextures();setGrime(T.grime);
const map=new GameMap();map.build(scene,T,gunModel,RR);
function makeEnv(bright){const pm=new THREE.PMREMGenerator(RR);const s=new THREE.Scene();const mat=new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{b:{value:bright}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float b;varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.02,.02,.025),vec3(.1,.13,.24),smoothstep(-.2,.7,h));gl_FragColor=vec4(c*b,1.);}'});s.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),mat));
 for(const[x,y,z,c]of[[0,6,-6,[1.4,1.3,1.2]],[-6,3,3,[.6,.7,1.2]],[6,2,4,[1.4,.8,.4]]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(4,2),new THREE.MeshBasicMaterial({color:new THREE.Color(...c).multiplyScalar(bright)}));p.position.set(x,y,z);p.lookAt(0,0,0);s.add(p);}
 const rt=pm.fromScene(s,.04);pm.dispose();return rt.texture;}
scene.environment=makeEnv(1);vmScene.environment=makeEnv(1.4);
scene.fog=new THREE.FogExp2(0x070a14,.03);scene.background=new THREE.Color(0x05070d);

/* ================= sky ================= */
const skyU={uDawn:{value:0},uMoon:{value:new V(-.45,.55,-.7).normalize()},uSun:{value:new V(.85,.02,.5).normalize()},uT:{value:0}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(450,40,20),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform float uDawn,uT;uniform vec3 uMoon,uSun;varying vec3 vD;float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
 void main(){vec3 d=normalize(vD);float y=d.y;vec3 zen=mix(vec3(.003,.006,.018),vec3(.07,.13,.32),uDawn);
  float side=pow(max(0.,dot(normalize(vec3(d.x,0.,d.z)+1e-4),normalize(vec3(uSun.x,0.,uSun.z)))*.5+.5),3.);
  vec3 hor=mix(vec3(.028,.04,.075),mix(vec3(.45,.3,.35),vec3(1.,.48,.2),side),uDawn);
  vec3 c=mix(hor,zen,pow(clamp(y,0.,1.),.42));if(y<0.)c=mix(hor*.6,vec3(.008,.01,.016),clamp(-y*5.,0.,1.));
  float cl=sin(d.x*7.+uT*.01)*sin(d.z*9.-uT*.013)*.5+.5;c*=1.-.25*smoothstep(.1,.35,y)*cl*(1.-uDawn*.5);
  vec3 sp=floor(d*380.);float s=h(sp);float st=step(.9972,s)*(.55+.45*sin(uT*2.3+s*90.))*(1.-uDawn)*smoothstep(.02,.3,y);c+=vec3(.9,.95,1.)*st*1.4;
  float md=dot(d,normalize(uMoon));float disc=smoothstep(.99925,.99955,md);float crat=.85+.15*sin(d.x*900.)*sin(d.y*800.);c+=vec3(.85,.9,1.)*disc*2.6*crat*(1.-uDawn*.5);c+=vec3(.25,.32,.6)*pow(max(md,0.),350.)*.9+vec3(.05,.07,.15)*pow(max(md,0.),10.)*.5;
  float sd=dot(d,normalize(uSun));c+=vec3(1.,.5,.2)*pow(max(sd,0.),30.)*uDawn*1.6+vec3(1.4,1.,.6)*smoothstep(.9988,.9993,sd)*uDawn*4.;
  gl_FragColor=vec4(c,1.);}`}));sky.renderOrder=-10;sky.frustumCulled=false;scene.add(sky);

/* ================= lights ================= */
const moon=new THREE.DirectionalLight(0x8aa4ff,.75);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-38,right:38,top:38,bottom:-38,near:1,far:180});moon.shadow.bias=-.0004;moon.shadow.normalBias=.035;
const MC=new V(W/2,0,H/2);moon.position.copy(MC).addScaledVector(skyU.uMoon.value,80);moon.target.position.copy(MC);scene.add(moon,moon.target);
const hemi=new THREE.HemisphereLight(0x34446c,0x0c0a08,.6);scene.add(hemi);
const flashlight=new THREE.SpotLight(0xfff0dc,0,34,.46,.55,1.5);flashlight.position.set(.18,-.12,0);flashlight.target.position.set(0,-.2,-6);cam.add(flashlight,flashlight.target);flashlight.shadow.mapSize.set(1024,1024);flashlight.shadow.bias=-.0006;flashlight.shadow.camera.near=.3;
// point lights are the expensive part of the frame: 4 area + 2 braziers + 1 effect flash + 1 crate. Everything else glows through emissive + bloom.
const crateLight=new THREE.PointLight(0xffc070,0,12,1.6);scene.add(crateLight);const dummyL=()=>({intensity:0,position:new V(),color:new THREE.Color()});const bossLight=dummyL(),forgeLight=dummyL(),pupLight=dummyL();

/* ================= systems ================= */
const fx=new FX(scene,T),snd=new Sound(),hud=new HUD();const vm=new ViewModel(T.flash);vmCam.add(vm.root);
const G={app:'loading',opt:{len:12,diff:1,ally:1,sens:1,vol:.8,fov:90},diff:DIFFS[1],round:0,phase:'pre',phaseT:0,toSpawn:[],spawnT:0,zombies:[],clock:720,nightLen:720,time:0,player:null,ally:null,solo:false,fieldP:new Int16Array(W*H).fill(-1),fieldA:new Int16Array(W*H).fill(-1),fieldT:0,
 pup:{double:0,insta:0},drops:[],dropsRound:0,killsSinceDrop:0,projs:[],power:false,stats:null,hurtFx:0,attract:true,map,fx,snd,hud,shake:0,god:false,areaName:'',crossSpread:0,result:null,endT:0,repairPts:0};
try{Object.assign(G.opt,JSON.parse(localStorage.getItem('pxd_nightfall_opt'))||{});}catch(e){}
G.targets=()=>G.attract?[]:[G.player,G.solo?null:G.ally];
G.wstats=w=>stats(w.id,w.up);
G.reviveTime=byAlly=>byAlly?(G.player.perks.has('wind')?1.6:3):(G.player.perks.has('wind')?1.5:3);
G.speedMul=1;G.allySkill=ALLY_SKILL[1];G.timers=[];G.after=(t,f)=>G.timers.push({t,f});G.noLoop=!!window.__NF_MANUAL;
function newStats(){return{kills:0,heads:0,knife:0,shots:0,hits:0,earned:0,downs:0,revivesGiven:0,revivedBy:0,doors:0,perks:0,boards:0,boxes:0,time:0,allyKills:0,bosses:0,maxRound:0};}
function newPlayer(){return{pos:map.start.clone(),vel:new V(),y:0,vy:0,onGround:true,yaw:map.yaw0,pitch:0,hp:100,maxHp:100,regenT:9,downed:false,dead:false,bleed:0,selfRevive:0,invuln:0,
 weapons:[newWeapon('warden')],cur:0,nextFire:0,trigPrev:false,reload:null,swapT:0,ads:false,sprint:false,sprintLock:0,bloom:0,recoil:0,grenades:2,knifeT:0,knifeCD:0,nadeT:0,drinkT:0,drinkPerk:null,perks:new Set(),points:500,flashOn:true,lastStand:null,useHold:0,landDip:0,stepS:0};}
function newWeapon(id,up=false){const s=stats(id,up);return{id,up,mag:s.mag,res:s.res};}
G.player=newPlayer();const P=()=>G.player;

/* ================= the mystery crate ================= */
const crate={spot:2,state:'idle',t:0,uses:0,wid:null,opener:null,leave:false,cycle:0,cyT:0};
{const g=new THREE.Group();const wood=new THREE.MeshStandardMaterial({map:T.boards,color:0x8a6040,roughness:.75});wood.envMapIntensity=.4;const iron=new THREE.MeshStandardMaterial({color:0x2a2622,roughness:.4,metalness:.9});
 const body=new THREE.Mesh(new THREE.BoxGeometry(1.7,.6,.72),wood);body.position.y=.3;body.castShadow=true;body.receiveShadow=true;g.add(body);for(const x of[-.6,0,.6]){const b=new THREE.Mesh(new THREE.BoxGeometry(.06,.62,.74),iron);b.position.set(x,.3,0);g.add(b);}
 const glyph=labelTex(256,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='rgba(255,200,90,1)';x.font=`96px ${DISP}`;x.textAlign='center';x.textBaseline='middle';x.shadowColor='#ffa040';x.shadowBlur=18;x.fillText('?',w/2-60,h/2+6);x.fillText('?',w/2+60,h/2+6);});
 const gm=new THREE.MeshBasicMaterial({map:glyph,transparent:true,color:new THREE.Color(2.2,1.6,.8),depthWrite:false});for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(1,.5),gm);p.position.set(0,.32,s*.365);if(s<0)p.rotation.y=Math.PI;g.add(p);}
 const lid=new THREE.Group();lid.position.set(0,.6,-.36);const lt=new THREE.Mesh(new THREE.BoxGeometry(1.72,.16,.74),wood);lt.position.set(0,.08,.36);lt.castShadow=true;lid.add(lt);const lb=new THREE.Mesh(new THREE.BoxGeometry(.06,.17,.76),iron);lb.position.set(0,.08,.36);lid.add(lb);g.add(lid);
 const inner=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.55),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.2,1)}));inner.rotation.x=-Math.PI/2;inner.position.y=.55;inner.visible=false;g.add(inner);
 const disp=new THREE.Group();disp.position.y=.7;g.add(disp);
 const beamM=new THREE.MeshBasicMaterial({map:T.beam,color:new THREE.Color(.55,.4,.18),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});const beam=new THREE.Mesh(new THREE.CylinderGeometry(.45,.55,46,16,1,true),beamM);beam.position.y=23;beam.renderOrder=5;
 const owl=new THREE.Group();const om=new THREE.MeshStandardMaterial({color:0x6a6a70,roughness:.6,emissive:0x101830});const ob=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),om);ob.scale.set(1,1.3,.9);owl.add(ob);for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.4,.4)}));e.position.set(s*.08,.12,.15);owl.add(e);const ear=new THREE.Mesh(new THREE.ConeGeometry(.05,.14,6),om);ear.position.set(s*.11,.3,0);owl.add(ear);}owl.visible=false;disp.add(owl);
 scene.add(g,beam);Object.assign(crate,{g,lid,inner,disp,beam,beamM,owl,models:{}});}
function crateModel(id){if(!crate.models[id]){const m=gunModel(id,false,true);m.scale.setScalar(1.7);m.rotation.y=Math.PI/2;crate.disp.add(m);m.visible=false;crate.models[id]=m;}return crate.models[id];}
function placeCrate(i){crate.spot=i;const s=map.crateSpots[i];const it=map.items.find(t=>t.type==='crate'&&t.spot===s);crate.item=it;crate.g.position.set(s.pos.x,0,s.pos.z);crate.g.rotation.y=Math.atan2(s.fx,s.fz)+(s.hz?0:0);if(!s.hz)crate.g.rotation.y=Math.atan2(s.fx,s.fz);
 crate.beam.position.set(s.pos.x,23,s.pos.z);for(const t of map.items)if(t.type==='crate')t.tarp.visible=t.spot!==s;crate.state='idle';crate.lid.rotation.x=0;crate.g.position.y=0;crate.g.visible=true;crate.beam.visible=true;for(const k in crate.models)crate.models[k].visible=false;crate.owl.visible=false;crate.inner.visible=false;}
placeCrate(2);
function crateUse(){const p=P();if(crate.state==='idle'){if(!spend(CRATE_COST))return;crate.state='spin';crate.t=0;crate.uses++;crate.opener=p;crate.cyT=0;G.stats.boxes++;snd.crateOpen();snd.boxTune();
  const own=new Set(p.weapons.map(w=>w.id));const pool=BOX_POOL.filter(([id])=>!own.has(id));let tot=pool.reduce((a,b)=>a+b[1],0),r=R()*tot;crate.wid=pool[0][0];for(const[id,wt]of pool){r-=wt;if(r<=0){crate.wid=id;break;}}
  crate.leave=crate.uses>3&&R()<.28;}
 else if(crate.state==='ready'&&crate.opener===p){giveWeapon(crate.wid,false);crate.state='closing';crate.t=0;for(const k in crate.models)crate.models[k].visible=false;}}
function updateCrate(dt){const c=crate;c.t+=dt;const spot=map.crateSpots[c.spot];crateLight.position.set(spot.pos.x,1.4,spot.pos.z);c.beamM.opacity=.22+Math.sin(G.time*2)*.05;
 if(c.state==='idle'){c.lid.rotation.x+=(0-c.lid.rotation.x)*Math.min(1,dt*6);crateLight.intensity=4;c.inner.visible=false;}
 else if(c.state==='spin'){c.lid.rotation.x+=(-1.9-c.lid.rotation.x)*Math.min(1,dt*7);c.inner.visible=true;crateLight.intensity=14+Math.sin(c.t*20)*3;const k=c.t/4.2;c.disp.position.y=.65+k*.75;c.disp.rotation.y+=dt*.6;
  c.cyT-=dt;if(c.cyT<=0){c.cyT=.05+k*k*.32;for(const id in c.models)c.models[id].visible=false;const ids=BOX_POOL.map(b=>b[0]);crateModel(ids[(R()*ids.length)|0]).visible=true;snd.points();}
  if(c.t>=4.2){for(const id in c.models)c.models[id].visible=false;if(c.leave){c.state='leave';c.t=0;c.owl.visible=true;snd.crateBye();hud.feed('THE CRATE GROWS RESTLESS…','y');}else{crateModel(c.wid).visible=true;c.state='ready';c.t=0;}}}
 else if(c.state==='ready'){crateLight.intensity=12;c.disp.position.y=1.4+Math.sin(G.time*3)*.04;c.disp.rotation.y=Math.sin(G.time*.8)*.4;if(c.t>9){c.state='closing';c.t=0;for(const id in c.models)c.models[id].visible=false;}}
 else if(c.state==='closing'){c.lid.rotation.x+=(0-c.lid.rotation.x)*Math.min(1,dt*6);crateLight.intensity=Math.max(4,12-c.t*12);if(c.t>.8){c.state='idle';c.inner.visible=false;c.disp.position.y=.65;}}
 else if(c.state==='leave'){c.disp.position.y=1.4+Math.min(.6,c.t*.3);c.owl.rotation.y+=dt*3;if(c.t>2.2){c.owl.visible=false;c.g.position.y+=dt*(c.t-2)*4;c.g.rotation.y+=dt*(c.t-2)*3;crateLight.intensity=20;if(R()<.5)fx.sparks.emit(c.g.position.x+(R()-.5),c.g.position.y,c.g.position.z+(R()-.5),0,-2,0,3,2,.8,.12,.8,4);}
  if(c.t>5){if(c.opener){c.opener.points+=CRATE_COST;hud.points(CRATE_COST);}const others=map.crateSpots.map((s,i)=>i).filter(i=>i!==c.spot);placeCrate(others[(R()*others.length)|0]);c.uses=0;const a=map.areas[map.crateSpots[crate.spot].area];hud.feed('THE CRATE MOVED · '+a.name,'y');fx.dirt(new V(map.crateSpots[c.spot].pos.x,.3,map.crateSpots[c.spot].pos.z),16);}}}

/* ================= flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);
 G.attract=false;G.app='play';G.timers.length=0;G.diff=DIFFS[G.opt.diff];G.allySkill=ALLY_SKILL[G.opt.diff];G.solo=!G.opt.ally;G.nightLen=G.clock=G.opt.len*60;G.time=0;G.round=0;G.phase='pre';G.phaseT=3.2;G.toSpawn=[];G.result=null;G.endT=0;
 G.stats=newStats();G.player=newPlayer();G.player.points=G.diff.start;G.pup.double=G.pup.insta=0;G.repairPts=0;
 clearZombies();clearDrops();clearProjs();fx.clear();resetWorld();
 if(!G.ally)G.ally=new Ally(scene,map.allyStart);G.ally.reset(map.allyStart);G.ally.root.visible=!G.solo;if(G.solo)G.ally.dead=true;
 hud.show(true);['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.add('playing');vm.set('warden',false);vm.swap=1;lock();snd.ambience(true,0,0);snd.muffle(false);
 hud.banner('NIGHTFALL',G.opt.len+' MINUTES UNTIL DAWN · '+G.diff.n,'#ff6a2a',3);computeFields(true);}
function resetWorld(){for(const d of map.doors){if(d.open){d.open=false;for(const i of d.cells){map.solid[i]=1;map.oLo[i]=0;map.oHi[i]=0;}}if(!d.mesh.parent)map.group.add(d.mesh);d.parts.forEach((p,k)=>{if(p.parent!==d.mesh){if(p.parent)p.parent.remove(p);d.mesh.add(p);}p.position.copy(p.userData.p0||(p.userData.p0=p.position.clone()));p.quaternion.copy(p.userData.q0||(p.userData.q0=p.quaternion.clone()));p.scale.set(1,1,1);});d.mesh.visible=true;}
 map.areas.forEach((a,i)=>a.open=i===0);map.resetBoards();for(const w of map.windows)w.busy=null;setPower(false,true);placeCrate(2);crate.uses=0;G.forge=null;}
function toMenu(){unlock();G.app='menu';['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing');hud.show(false);attract();}
function attract(){G.attract=true;G.app='menu';clearZombies();clearDrops();clearProjs();fx.clear();resetWorld();setPower(true,true);if(G.ally)G.ally.root.visible=false;
 for(let k=0;k<7;k++){const p=map.randomFloor([0]);const z=new Zombie(k%3===0?'runner':'walker',{hp:100,speed:1.1,pos:p,state:'chase',gait:k%3===0?1:0},G);scene.add(z.root);G.zombies.push(z);}
 snd.ambience(true,.1,0);updateBest();G.clock=G.nightLen=G.opt.len*60;}
function clearZombies(){for(const z of G.zombies){scene.remove(z.root);z.dispose();}G.zombies.length=0;}
function clearDrops(){for(const d of G.drops)scene.remove(d.mesh);G.drops.length=0;}
function clearProjs(){for(const p of G.projs)scene.remove(p.mesh);G.projs.length=0;}
function saveOpt(){try{localStorage.setItem('pxd_nightfall_opt',JSON.stringify(G.opt));}catch(e){}}

/* ================= rounds ================= */
function roundHp(n){return(n<=9?150+100*(n-1):950*Math.pow(1.1,n-9))*G.diff.hp;}
function roundCount(n){const b=n<=5?[6,8,11,14,17][n-1]:17+(n-5)*3.2;return Math.max(4,Math.round(b*G.diff.count*(G.solo?1:1.15)));}
function startRound(){G.round++;const n=G.round,D=G.diff;const boss=n%5===0;let cnt=roundCount(n);if(boss)cnt=Math.round(cnt*.55);const list=[];
 const brutes=n>=4?Math.min(6,Math.floor((n-2)/2)):0;for(let i=0;i<cnt;i++){const r=R();const sp=cl((n-3)*.1,0,.65)*D.run,jg=cl((n-1)*.15,0,.55);list.push(i<brutes?{t:'brute'}:r<sp?{t:'runner',g:2}:r<sp+jg?{t:'walker',g:1}:{t:'walker',g:0});}
 list.sort(()=>R()-.5);if(boss)list.splice(Math.min(3,list.length),0,{t:'boss'});G.toSpawn=list;G.spawnT=1.2;G.phase='fight';G.dropsRound=0;G.repairPts=0;G.stats.maxRound=n;
 const p=P();p.grenades=Math.min(4,p.grenades+2);if(G.ally&&!G.solo&&G.ally.dead){G.ally.reset(map.randomFloor(map.areas.filter(a=>a.open).map(a=>a.id),p.pos,0).lerp(p.pos,.6));const q=G.ally.pos;q.copy(p.pos).add(new V(1,0,1));map.collide(q,.3);hud.feed('ROOK IS BACK','g');}
 hud.banner('ROUND '+n,boss?'THE GRAVEKEEPER STIRS':n===1?'HOLD THE WINDOWS':cnt+' OF THE DEAD','#c4281a',3);snd.roundStart(n);}
function spawnOne(e){const n=G.round,D=G.diff,p=P();let z;
 if(e.t==='boss'){const areas=map.areas.filter(a=>a.open).map(a=>a.id);let pos=map.randomFloor(areas.filter(i=>!map.areas[i].roof).length?areas.filter(i=>!map.areas[i].roof):areas,p.pos,10);
  z=new Zombie('boss',{hp:(3200+n*650)*D.boss*(G.solo?1:1.3),speed:1.75*D.spd,dmg:70*D.dmg,pos,state:'rise'},G);hud.banner('THE GRAVEKEEPER','RISES FROM THE EARTH','#ffb040',3);snd.bossRoar(pos);G.shake=Math.max(G.shake,.5);fx.dirt(new V(pos.x,.2,pos.z),40);}
 else{const ws=map.windows.filter(w=>map.areas[w.area].open&&w.spawns.length);const pa=map.areaAt(p.pos.x,p.pos.z);let tot=0;const wt=ws.map(w=>{const d=Math.hypot(w.pos.x-p.pos.x,w.pos.z-p.pos.z);const v=(w.area===pa?3:1)/(1+d/10);tot+=v;return v;});let r=R()*tot,win=ws[0];for(let i=0;i<ws.length;i++){r-=wt[i];if(r<=0){win=ws[i];break;}}
  const c=win.spawns[(R()*win.spawns.length)|0];const pos=new V(c%W+.5+(R()-.5)*.4,0,(c/W|0)+.5+(R()-.5)*.4);
  const hp=roundHp(n)*(e.t==='brute'?3.2:1);const g=e.t==='runner'?2:e.g||0;const speed=(e.t==='brute'?1.55:g===2?4.1+R()*.5:g===1?2.3+R()*.4:1.0+R()*.35)*D.spd;
  z=new Zombie(e.t,{hp,speed,dmg:ZDMG*D.dmg,pos,win,gait:e.t==='brute'?0:g,state:'rise'},G);}
 z.root.traverse(o=>{if(o.isMesh)o.castShadow=gfx>=1;});scene.add(z.root);G.zombies.push(z);return z;}

/* ================= points ================= */
function award(n){const p=P();const v=n*(G.pup.double>0?2:1);p.points+=v;G.stats.earned+=v;hud.points(v);}
function spend(n){const p=P();if(p.points<n){snd.deny();hud.feed('NOT ENOUGH POINTS','r');return false;}p.points-=n;hud.points(-n);snd.buy();return true;}

/* ================= combat ================= */
const tv=new V(),tv2=new V(),ro={};
function aimDir(out=new V()){const p=P();const pt=p.pitch+p.recoil;return out.set(-Math.sin(p.yaw)*Math.cos(pt),Math.sin(pt),-Math.cos(p.yaw)*Math.cos(pt));}
function muzzleWorld(){const p=P();const d=aimDir(new V());const r=new V(Math.cos(p.yaw),0,-Math.sin(p.yaw));const a=vm.ads;return cam.position.clone().addScaledVector(d,.55).addScaledVector(r,.12*(1-a)).add(new V(0,-.1*(1-a)-.03,0));}
function raySphere(o,d,c,r,maxT){const ox=o.x-c.x,oy=o.y-c.y,oz=o.z-c.z;const b=ox*d.x+oy*d.y+oz*d.z,cc=ox*ox+oy*oy+oz*oz-r*r;if(cc>0&&b>0)return-1;const disc=b*b-cc;if(disc<0)return-1;const t=-b-Math.sqrt(disc);return t<0?(cc<0?0:-1):t<=maxT?t:-1;}
function traceZombies(o,d,maxT){const hits=[];for(const z of G.zombies){if(!z.alive||z.state==='rise'&&z.root.position.y<-1)continue;const c=z.center(tv2);const big=1.4*z.rig.scale;if(raySphere(o,d,c,big,maxT)<0)continue;let best=null;
  for(const s of z.spheres()){const t=raySphere(o,d,s.p,s.r,maxT);if(t>=0&&(!best||t<best.t-.05||(Math.abs(t-best.t)<.05&&s.part==='head')))best={t,z,part:s.part};}if(best)hits.push(best);}
 hits.sort((a,b)=>a.t-b.t);return hits;}
function hitZombie(z,dmg,part,kind,dir,pt,owner='p'){const p=P();if(owner==='p'&&p.perks.has('fang')&&kind==='bullet')dmg*=2;if(G.pup.insta>0&&z.type!=='boss')dmg=z.hp+1;
 const res=z.damage(G,dmg,part,kind,dir);if(pt)fx.ashHit(pt,dir?dir.clone().negate():new V(0,1,0),part==='head'||res.killed);if(res.armorHit&&pt)fx.sparks.burst(pt,10,5,[new THREE.Color(3,2.4,1.4)],.05,.3,{grav:9});
 if(owner!=='p'){if(res.killed){G.stats.allyKills++;if(G.ally)G.ally.kills++;}return res;}
 if(res.killed){G.stats.kills++;if(part==='head')G.stats.heads++;if(kind==='knife')G.stats.knife++;award(kind==='knife'?130:part==='head'&&kind==='bullet'?100:kind==='bullet'?60:50);hud.hitmark('kill');snd.hitmark('kill');}
 else{award(10);hud.hitmark(res.armorHit?'armor':part==='head'?'head':'');snd.hitmark(res.armorHit?'armor':part==='head'?'head':'');}
 return res;}
function fire(){const p=P(),w=p.weapons[p.cur];if(!w||w.forging)return false;const s=G.wstats(w);
 if(w.mag<=0){snd.dry();p.nextFire=G.time+.25;if(w.res>0)startReload();return false;}
 if(p.reload){if(p.reload.shell&&w.mag>0)p.reload=null;else return false;}
 w.mag--;const rate=s.rate*(p.perks.has('fang')?.75:1);p.nextFire=G.time+rate;G.stats.shots++;p.sprintLock=.35;
 const eye=cam.position.clone(),dir=aimDir(new V());const up=Math.abs(dir.y)>.95?new V(1,0,0):new V(0,1,0);const rt=new V().crossVectors(dir,up).normalize(),u2=new V().crossVectors(rt,dir).normalize();
 const moving=Math.min(1,Math.hypot(p.vel.x,p.vel.z)/4);const spr=(p.ads?s.ads:s.spread*(1+moving*.6))+p.bloom*(p.ads?.3:1);const mz=muzzleWorld();let hitAny=false;
 if(s.kind==='volt'){voltShot(eye,dir,s,mz);}
 else if(s.proj){const v=dir.clone().multiplyScalar(34);v.y+=1.2;launch('shell',mz,v,{dmg:s.dmg,splash:s.splash});}
 else{const n=s.pel||1;const acc=new Map();for(let i=0;i<n;i++){const a=R()*TAU,r=Math.sqrt(R());const d=dir.clone().addScaledVector(rt,Math.cos(a)*r*spr).addScaledVector(u2,Math.sin(a)*r*spr).normalize();
   map.ray(eye.x,eye.y,eye.z,d.x,d.y,d.z,140,ro);const wallT=ro.t;const hits=traceZombies(eye,d,wallT);let pen=s.pen||0;let endT=wallT;
   for(const h of hits){const fall=s.pel?Math.max(.3,1-Math.max(0,h.t-5)/16):Math.max(.6,1-Math.max(0,h.t-30)/80);const e=acc.get(h.z)||{dmg:0,part:'body',t:h.t,pt:null,dir:d};e.dmg+=s.dmg*fall*(h.part==='head'?s.hs:h.part==='leg'?.85:1);if(h.part==='head')e.part='head';e.pt=eye.clone().addScaledVector(d,h.t);acc.set(h.z,e);if(pen--<=0){endT=h.t;break;}}
   const end=eye.clone().addScaledVector(d,endT);if(endT===wallT&&wallT<140){fx.impact(end,new V(ro.nx||0,ro.ny||0,ro.nz||0),ro.kind);}
   if(i<3)fx.streaks.fire(mz,end,p.weapons[p.cur].up?0xe090ff:0xffd890,{speed:260,len:s.kind==='lmg'?3.4:2.4,w:.018});}
  for(const[z,e]of acc){if(!z.alive)continue;hitZombie(z,e.dmg,e.part,'bullet',e.dir,e.pt);hitAny=true;if(s.splash)explode(e.pt,s.sdmg,s.splash,'p',.4);}}
 if(hitAny)G.stats.hits++;
 vm.fire(Math.min(2.2,s.recoil*.7+.3),G.time,s.kind==='volt');vmFlash.intensity=s.kind==='volt'?3:7;vmFlash.color.set(s.kind==='volt'?0x80c0ff:w.up?0xd080ff:0xffaa55);fx.flash(mz,s.kind==='volt'?0x80b0ff:0xffa050,s.pel?90:50,9,.06);
 snd.shot(s.kind,w.up);p.recoil+=s.recoil*.0075*(p.ads?.55:1);p.yaw+=(R()-.5)*s.recoil*.004;p.bloom=Math.min(.08,p.bloom+s.recoil*.004);G.shake=Math.max(G.shake,s.pel||s.kind==='revolver'?.16:.04);
 if(s.kind==='revolver')vm.cylSpin=1;if(w.mag===0&&w.res>0)G.after(Math.max(.08,rate),()=>{if(P().weapons[P().cur]===w&&w.mag===0)startReload();});return true;}
function voltShot(eye,dir,s,mz){map.ray(eye.x,eye.y,eye.z,dir.x,dir.y,dir.z,40,ro);let first=traceZombies(eye,dir,ro.t)[0];let target=first?first.z:null;
 if(!target){let best=null,bd=.22;for(const z of G.zombies){if(!z.alive||z.state==='rise')continue;const c=z.center(new V());const to=c.clone().sub(eye);const d=to.length();if(d>30)continue;const ang=Math.acos(cl(to.normalize().dot(dir),-1,1));if(ang<bd&&map.los(eye.x,eye.y,eye.z,c.x,c.y,c.z)){bd=ang;best=z;}}target=best;}
 const end=target?target.center(new V()):eye.clone().addScaledVector(dir,Math.min(ro.t,30));fx.bolts.add(mz,end,.25,.5);fx.bolts.add(mz,end,.18,.35);snd.zap(end);
 if(!target){fx.impact(end,new V(ro.nx||0,ro.ny||0,ro.nz||0),'M');return;}
 const hit=new Set();let cur=target,from=end.clone(),dmg=s.dmg;for(let k=0;k<s.chain&&cur;k++){hit.add(cur);const c=cur.center(new V());if(k>0)fx.bolts.add(from,c,.3,.4);fx.sparks.burst(c,18,4,[new THREE.Color(1.2,2.4,4),new THREE.Color(2.5,3,4)],.06,.4,{grav:2});hitZombie(cur,dmg,'body','volt',dir,c);
  from=c;dmg*=.85;let nb=null,nd=7;for(const z of G.zombies){if(!z.alive||hit.has(z)||z.state==='rise')continue;const d=z.center(new V()).distanceTo(c);if(d<nd){nd=d;nb=z;}}cur=nb;}
 G.stats.hits++;}
function explode(p,dmg,radius,owner='p',selfK=1){fx.explosion(p,Math.min(1.4,radius/4));snd.explode(p,Math.min(1.3,radius/4));let kill=false,hit=false;
 for(const z of G.zombies){if(!z.alive)continue;const c=z.center(new V());const d=Math.max(0,c.distanceTo(p)-z.def.r);if(d>radius)continue;const k=1-d/radius;const dir=c.clone().sub(p).normalize();const r=hitZombie(z,dmg*(.3+.7*k),'body','splash',dir,c,owner);hit=true;if(r.killed)kill=true;}
 const pl=P();const d=new V(pl.pos.x,pl.y+1,pl.pos.z).distanceTo(p);if(owner==='p'&&d<radius*.8&&!pl.downed&&selfK>0){hurtPlayer(25*(1-d/(radius*.8))*selfK,p,true);}G.shake=Math.max(G.shake,cl(1.2-d/12,0,.9));if(hit)G.stats.hits++;}
function launch(kind,pos,vel,o={}){const m=new THREE.Mesh(new THREE.SphereGeometry(kind==='shell'?.06:.07,10,8),new THREE.MeshStandardMaterial({color:kind==='shell'?0x8a7a30:0x3e4630,roughness:.5,metalness:.4,emissive:kind==='shell'?0x301000:0}));m.position.copy(pos);scene.add(m);
 G.projs.push({kind,pos:pos.clone(),vel:vel.clone(),t:0,fuse:kind==='nade'?2.2:6,mesh:m,dmg:o.dmg,splash:o.splash,bounce:0});}
function updateProjs(dt){for(let i=G.projs.length-1;i>=0;i--){const p=G.projs[i];p.t+=dt;p.vel.y-=14*dt;const np=p.pos.clone().addScaledVector(p.vel,dt);let boom=false;
  if(p.kind==='shell'){if(np.y<.05)boom=true;const cx=Math.floor(np.x),cz=Math.floor(np.z);const i2=map.idx(np.x,np.z);if(i2<0||map.hgt[i2]>0&&np.y<map.hgt[i2]&&!(map.oHi[i2]>0&&np.y>map.oLo[i2]&&np.y<map.oHi[i2]))boom=true;const rf=i2>=0?map.roof[i2]:0;if(rf&&np.y>rf)boom=true;
   if(!boom&&p.t>.06){for(const z of G.zombies){if(!z.alive)continue;if(z.center(tv).distanceTo(np)<.7*z.rig.scale){boom=true;break;}}}if(R()<.8)fx.smoke.emit(np.x,np.y,np.z,0,.2,0,.4,.38,.36,.18,.6,-.1,1,.3,.5);}
  else{if(np.y<.07){np.y=.07;if(p.vel.y<-1.5)snd.thud(np);p.vel.y*=-.38;p.vel.x*=.62;p.vel.z*=.62;}const i2=map.idx(np.x,p.pos.z);if(i2<0||map.solid[i2]&&np.y<map.hgt[i2]){np.x=p.pos.x;p.vel.x*=-.45;}const i3=map.idx(np.x,np.z);if(i3<0||map.solid[i3]&&np.y<map.hgt[i3]){np.z=p.pos.z;p.vel.z*=-.45;}const rf=map.roof[map.idx(np.x,np.z)]||0;if(rf&&np.y>rf-.1){np.y=rf-.1;p.vel.y=-Math.abs(p.vel.y)*.3;}
   if(p.t>=p.fuse)boom=true;if(R()<.3)fx.sparks.emit(np.x,np.y+.05,np.z,0,.5,0,2,1,.3,.03,.2);}
  p.pos.copy(np);p.mesh.position.copy(np);p.mesh.rotation.x+=dt*8;if(boom||p.t>8){scene.remove(p.mesh);G.projs.splice(i,1);
   if(p.kind==='shell')explode(p.pos.clone().setY(Math.max(.2,p.pos.y)),p.dmg,p.splash,'p',.6);else explode(p.pos.clone().setY(Math.max(.2,p.pos.y)),300*(1+G.round*.18),4.8,'p',1);}}}
function throwNade(){const p=P();if(p.grenades<=0||p.nadeT>0||p.downed||p.drinkT>0)return;p.grenades--;p.nadeT=.5;vm.throwT=.5;snd.pin();
 G.after(.22,()=>{const d=aimDir(new V());const v=d.clone().multiplyScalar(14).add(new V(0,3,0)).add(new V(P().vel.x*.5,0,P().vel.z*.5));launch('nade',cam.position.clone().addScaledVector(d,.4).add(new V(0,-.15,0)),v);snd.throw();});}
function knife(){const p=P();if(p.knifeCD>0||p.drinkT>0||p.nadeT>0)return;p.knifeCD=.62;p.knifeT=.38;vm.knifeT=.38;p.reload=null;
 const eye=cam.position.clone(),d=aimDir(new V());let best=null,bd=3.2;for(const z of G.zombies){if(!z.alive||z.state==='rise')continue;const c=z.center(new V());const to=c.clone().sub(eye);const dist=Math.hypot(to.x,to.z);if(dist>bd)continue;to.y=0;const f=new V(d.x,0,d.z).normalize();if(to.normalize().dot(f)<.55)continue;bd=dist;best=z;}
 G.after(.12,()=>{let hit=false;if(best&&best.alive){const dist=Math.hypot(best.pos.x-p.pos.x,best.pos.z-p.pos.z);if(dist<2.1+(best.def.r)){const c=best.center(new V());if(dist>1.2){const k=(dist-1)/dist;p.pos.x+=(best.pos.x-p.pos.x)*k*.6;p.pos.z+=(best.pos.z-p.pos.z)*k*.6;map.collide(p.pos,MV.r,p.y+MV.step);}
     hitZombie(best,150*(1+G.round*.05),'body','knife',d,c);hit=true;G.shake=Math.max(G.shake,.15);}}snd.knife(hit);});}
function startReload(){const p=P(),w=p.weapons[p.cur];if(!w||w.forging||p.reload)return;const s=G.wstats(w);if(w.mag>=s.mag||w.res<=0)return;const k=p.perks.has('hand')?.5:1;
 if(s.shell){p.reload={shell:true,t:s.reload*k*1.3,step:s.reload*k};vm.startReload(s.reload*k,true);}else{p.reload={shell:false,t:s.reload*k,dur:s.reload*k,stage:0};vm.startReload(s.reload*k,false);}snd.reload(0);p.ads=false;}
function updateReload(dt){const p=P(),w=p.weapons[p.cur];const r=p.reload;if(!r||!w)return;const s=G.wstats(w);r.t-=dt;
 if(r.shell){if(r.t<=0){if(w.mag<s.mag&&w.res>0){w.mag++;w.res--;snd.reload(1);r.t=r.step;}if(w.mag>=s.mag||w.res<=0){p.reload=null;vm.rel=null;snd.reload(2);}}}
 else{const f=1-r.t/r.dur;if(r.stage===0&&f>.35){r.stage=1;snd.reload(1);}if(r.stage===1&&f>.8){r.stage=2;snd.reload(2);}if(r.t<=0){const need=s.mag-w.mag,take=Math.min(need,w.res);w.mag+=take;w.res-=take;p.reload=null;}}}
function giveWeapon(id,up){const p=P();const has=p.weapons.findIndex(w=>w.id===id);if(has>=0){p.weapons[has]=newWeapon(id,up||p.weapons[has].up);equip(has);return;}
 const nw=newWeapon(id,up);if(p.weapons.length<2){p.weapons.push(nw);equip(p.weapons.length-1);}else{if(p.weapons[p.cur].forging){const o=1-p.cur;p.weapons[o]=nw;equip(o);}else{p.weapons[p.cur]=nw;equip(p.cur,true);}}hud.feed(stats(id,up).name,'y');}
function equip(i,force){const p=P();if(!p.weapons[i])return;if(i===p.cur&&!force)return;p.cur=i;p.reload=null;p.swapT=.35;vm.swap=1;const w=p.weapons[i];vm.set(w.id,w.up);snd.swap();p.ads=false;}
function swapWeapon(dir=1){const p=P();if(p.weapons.length<2||p.downed||p.drinkT>0)return;equip((p.cur+dir+p.weapons.length)%p.weapons.length);}

/* ================= damage to survivors ================= */
G.hurt=(t,dmg,z)=>{if(t===G.player)hurtPlayer(dmg,z?z.pos:null);else if(t===G.ally&&!G.solo){G.ally.hurt(G,dmg*.75);snd.swipe();}};
function hurtPlayer(dmg,from,self){const p=P();if(p.downed||p.invuln>0||G.god||G.app!=='play'||G.phase==='dawn')return;p.hp-=dmg;p.regenT=0;G.hurtFx=Math.min(1,G.hurtFx+dmg/45);G.shake=Math.max(G.shake,Math.min(.6,dmg/70));
 if(from&&!self){const ang=Math.atan2(from.x-p.pos.x,from.z-p.pos.z);hud.hurt(-(ang-(p.yaw+Math.PI)));snd.swipe();}snd.hurt(Math.min(1,dmg/50));if(p.hp<=0)goDown();}
function goDown(){const p=P();p.hp=0;p.downed=true;G.stats.downs++;const wind=p.perks.has('wind');p.perks.clear();p.maxHp=100;p.reload=null;p.ads=false;p.drinkT=0;
 const allyOK=!G.solo&&G.ally&&!G.ally.downed&&!G.ally.dead;p.selfRevive=0;
 if(allyOK)p.bleed=30;else if(G.solo&&wind){p.selfRevive=1;p.bleed=4;}else{p.bleed=2.6;p.dying=true;}
 // last stand: the pistol (borrowed if you sold it)
 p.lastStand={cur:p.cur};let wi=p.weapons.findIndex(w=>w.id==='warden');if(wi<0){p.borrow=newWeapon('warden');p.borrow.res=24;p.weapons.push(p.borrow);wi=p.weapons.length-1;}equip(wi,true);
 snd.down();snd.muffle(true);hud.feed(p.dying?'YOU WENT DOWN':'YOU ARE DOWN · HOLD ON','r');}
G.revivePlayer=(by)=>{const p=P();if(!p.downed)return;p.downed=false;p.dying=false;p.hp=p.maxHp*.5;p.invuln=2.5;p.selfRevive=0;if(p.borrow){p.weapons.splice(p.weapons.indexOf(p.borrow),1);p.borrow=null;}const c=p.lastStand?Math.min(p.lastStand.cur,p.weapons.length-1):0;p.lastStand=null;equip(c,true);
 snd.revive();snd.muffle(false);if(by){G.stats.revivedBy++;hud.feed('ROOK REVIVED YOU','g');}else hud.feed('SECOND WIND!','b');};
G.onAllyDown=()=>{hud.feed('ROOK IS DOWN · REVIVE HIM','r');const p=P();if(p.downed&&!p.dying){p.dying=true;p.bleed=Math.min(p.bleed,2.6);}};
G.onAllyDead=()=>{hud.feed('ROOK BLED OUT','r');};
G.allyHit=(z,part,pt,a)=>{const dmg=(30+G.round*26)*(part==='head'?2.4:1);const dir=new V(z.pos.x-a.pos.x,0,z.pos.z-a.pos.z).normalize();hitZombie(z,dmg,part,'ally',dir,pt,'a');};
G.tearBoard=(w,z)=>{const k=map.tearBoard(w);if(k<0)return;snd.tear(w.pos);fx.smoke.burst(new V(w.pos.x,1.4,w.pos.z),5,1,[new THREE.Color(.4,.34,.28)],.3,.8,{grav:-.1,drag:3,grow:.4,alpha:.6,jit:.4});fx.sparks.burst(new V(w.pos.x,1.4,w.pos.z),4,3,[new THREE.Color(1.6,1,.5)],.03,.3,{grav:8});};
G.bossSlam=(z)=>{const c=new V(z.pos.x+Math.sin(z.yaw)*1.6,0,z.pos.z+Math.cos(z.yaw)*1.6);fx.rings.add(c,new THREE.Color(1.6,1,.5),.5,5.5,.6);fx.dirt(new V(c.x,.2,c.z),30);fx.sparks.burst(new V(c.x,.3,c.z),40,8,[new THREE.Color(2.4,1.4,.5)],.08,.6,{up:true,grav:10});snd.slam(c);
 for(const t of G.targets()){if(!t||t.downed||t.dead)continue;const d=Math.hypot(t.pos.x-c.x,t.pos.z-c.z);if(d<4.6){G.hurt(t,z.dmg*(1-d/6),z);if(t===G.player){const p=P();p.vel.x+=(p.pos.x-c.x)/(d||1)*7;p.vel.z+=(p.pos.z-c.z)/(d||1)*7;p.vy=3;p.onGround=false;}}}
 const pd=Math.hypot(P().pos.x-c.x,P().pos.z-c.z);G.shake=Math.max(G.shake,cl(1-pd/18,0,.9));};
G.onBossEnrage=z=>{hud.feed('THE GRAVEKEEPER IS ENRAGED','r');snd.bossRoar(z.pos);};
G.onZombieDeath=(z,kind,part)=>{if(G.attract)return;snd.thud(z.pos);
 if(z.type==='boss'){G.stats.bosses++;award(500);hud.banner('GRAVEKEEPER SLAIN','+500 · THE EARTH QUIETS','#ffd04a',3);dropPowerup(z.pos,'ammo');G.shake=Math.max(G.shake,.6);fx.explosion(z.center(new V()),1.2);return;}
 if(kind==='nuke'||kind==='dawn')return;G.killsSinceDrop++;const ch=G.dropsRound<4&&(R()<.022||G.killsSinceDrop>=26+(R()*12|0));if(ch&&!z.win)dropPowerup(z.pos);else if(ch&&z.win&&z.state!=='approach'){dropPowerup(z.win.inPos);}};

/* ================= power-ups ================= */
const PU_TEX={};function puTex(k){if(PU_TEX[k])return PU_TEX[k];const col=PUP[k].c;PU_TEX[k]=labelTex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);const g=x.createRadialGradient(w/2,h/2,10,w/2,h/2,w/2);g.addColorStop(0,col);g.addColorStop(.7,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.beginPath();x.arc(w/2,h/2,w/2-2,0,TAU);x.fill();x.strokeStyle='#fff';x.lineWidth=5;x.beginPath();x.arc(w/2,h/2,44,0,TAU);x.stroke();x.fillStyle='#fff';x.strokeStyle='#fff';x.lineWidth=7;x.lineCap='round';x.save();x.translate(w/2,h/2);
 if(k==='ammo'){for(const dx of[-16,0,16]){x.fillRect(dx-5,-14,10,30);x.beginPath();x.arc(dx,-14,5,Math.PI,0);x.fill();}}else if(k==='double'){x.font=`54px ${DISP}`;x.textAlign='center';x.textBaseline='middle';x.fillText('×2',0,3);}
 else if(k==='insta'){x.beginPath();x.arc(0,-6,20,0,TAU);x.fill();x.fillRect(-12,8,24,14);x.fillStyle=col;x.beginPath();x.arc(-8,-6,6,0,TAU);x.arc(8,-6,6,0,TAU);x.fill();}
 else if(k==='nuke'){x.beginPath();x.arc(0,0,12,0,TAU);x.fill();for(let i=0;i<8;i++){const a=i/8*TAU;x.beginPath();x.moveTo(Math.cos(a)*18,Math.sin(a)*18);x.lineTo(Math.cos(a)*30,Math.sin(a)*30);x.stroke();}}
 else{x.rotate(-.6);x.fillRect(-4,-4,8,34);x.fillRect(-18,-20,36,14);}x.restore();});return PU_TEX[k];}
function dropPowerup(pos,kind){const kinds=['ammo','double','insta','nuke','board'];const k=kind||kinds[(R()*kinds.length)|0];G.dropsRound++;G.killsSinceDrop=0;
 const g=new THREE.Group();const m=new THREE.MeshBasicMaterial({map:puTex(k),transparent:true,side:THREE.DoubleSide,depthWrite:false,color:new THREE.Color(1.8,1.8,1.8)});const disc=new THREE.Mesh(new THREE.PlaneGeometry(.75,.75),m);g.add(disc);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(.4,.025,8,32),new THREE.MeshBasicMaterial({color:new THREE.Color(PUP[k].c).multiplyScalar(2.2)}));g.add(rim);g.position.set(pos.x,1.0,pos.z);scene.add(g);G.drops.push({kind:k,pos:g.position,t:0,mesh:g,mat:m});snd.powerup();hud.feed(PUP[k].n+' DROPPED','y');}
function updateDrops(dt){const p=P();let near=null,nd=1e9;for(let i=G.drops.length-1;i>=0;i--){const d=G.drops[i];d.t+=dt;d.mesh.rotation.y+=dt*1.6;d.mesh.position.y=1+Math.sin(d.t*2.5)*.12;const bl=d.t>20?(Math.sin(d.t*(d.t>24?30:14))>0?1:0):1;d.mesh.visible=!!bl;
  if(R()<.3)fx.sparks.emit(d.pos.x+(R()-.5)*.6,d.pos.y-.3,d.pos.z+(R()-.5)*.6,0,.6,0,.6,1.6,.5,.06,.7);const dist=Math.hypot(p.pos.x-d.pos.x,p.pos.z-d.pos.z);if(dist<nd){nd=dist;near=d;}
  if(dist<1.3&&!p.downed){applyPowerup(d.kind);scene.remove(d.mesh);G.drops.splice(i,1);continue;}if(d.t>26){scene.remove(d.mesh);G.drops.splice(i,1);}}
 if(near&&G.drops.includes(near)){pupLight.position.copy(near.pos);pupLight.intensity=6;pupLight.color.set(PUP[near.kind].c);}else pupLight.intensity=0;}
function applyPowerup(k){const p=P();snd.pickup(k);hud.banner(PUP[k].n,{ammo:'ALL WEAPONS + GRENADES REFILLED',double:'DOUBLE POINTS · 30 SECONDS',insta:'EVERY HIT KILLS · 30 SECONDS',nuke:'THE DEAD BURN · +400',board:'EVERY WINDOW BOARDED · +200'}[k],PUP[k].c,2);
 if(k==='ammo'){for(const w of p.weapons){const s=G.wstats(w);w.res=s.res;}p.grenades=4;}else if(k==='double')G.pup.double=30;else if(k==='insta')G.pup.insta=30;
 else if(k==='nuke'){$('flashov').style.transition='none';$('flashov').style.opacity=.9;requestAnimationFrame(()=>{$('flashov').style.transition='opacity 1.6s';$('flashov').style.opacity=0;});for(const z of G.zombies){if(!z.alive)continue;if(z.type==='boss'){z.damage(G,z.hpMax*.2,'body','nuke');continue;}G.after(R()*.9,()=>{if(z.alive){z.die(G,'nuke','body');G.stats.kills++;}});}award(400);G.shake=.7;}
 else if(k==='board'){for(const w of map.windows)while(w.boards<6)map.addBoard(w);award(200);}}

/* ================= power, perks, forge, doors ================= */
function setPower(on,quiet){G.power=on;map.power.on=on;map.setPower(on);const it=map.power;it.lever.rotation.x=on?-.9:.9;it.lampM.color.set(on?new THREE.Color(.2,3,.4):new THREE.Color(.3,.03,0));
 for(const t of map.items)if(t.type==='perk'){const pw=on;t.fm.emissiveIntensity=pw?1.1:.05;t.signM.color.copy(t.colv).multiplyScalar(pw?3:.15);}
 map.forge.glowM.color.set(on?new THREE.Color(3,.9,.2):new THREE.Color(.25,.06,.02));forgeLight.intensity=on?8:0;
 if(on&&!quiet){snd.power();hud.banner('POWER RESTORED','PERKS AND THE FORGE ARE AWAKE','#7ac8ff',3);fx.bolts.add(new V(it.x-.1,1.6,it.z+.5),new V(it.x-.1,3.6,it.z+.5),.5,.4);for(let k=0;k<6;k++)fx.bolts.add(new V(it.x-.2,1.5,it.z+.5),new V(it.x-1-R()*2,R()*3,it.z+(R()-.5)*3),.3,.5);G.shake=.3;}}
function buyPerk(it){const p=P();if(p.perks.has(it.id)||p.drinkT>0)return;if(!G.power&&it.id!=='wind'){snd.deny();hud.feed('NO POWER · FIND THE MAIN SWITCH','r');return;}const cost=G.solo&&it.id==='wind'?it.soloCost:it.cost;if(!spend(cost))return;
 p.drinkT=1.4;p.drinkPerk=it.id;p.reload=null;p.ads=false;snd.perk(it.id);G.after(.5,()=>snd.gulp());G.stats.perks++;}
function finishDrink(){const p=P();const id=p.drinkPerk;p.drinkPerk=null;if(!id)return;p.perks.add(id);if(id==='hide'){p.maxHp=250;p.hp=250;}const it=Object.values(PERKS).find(x=>x.id===id);hud.feed(it.name,'y');}
function useForge(){const p=P(),w=p.weapons[p.cur];if(!G.power){snd.deny();hud.feed('THE FORGE IS COLD · NO POWER','r');return;}if(G.forge){snd.deny();return;}if(!w||w.up||w.forging||p.downed){snd.deny();hud.feed(w&&w.up?'ALREADY FORGED':'NOTHING TO FORGE','r');return;}
 if(!spend(FORGE_COST))return;w.forging=true;p.reload=null;G.forge={w,t:0};snd.forge();hud.feed('FORGING '+WPN[w.id].name+'…','y');if(p.weapons.length>1)equip(1-p.cur);}
function updateForge(dt){const f=G.forge;const it=map.forge;if(!f){if(G.power)forgeLight.intensity=7+Math.sin(G.time*7)*1.2;return;}f.t+=dt;forgeLight.intensity=20+Math.sin(G.time*40)*6;if(R()<.6)fx.sparks.burst(new V(it.pos.x,1.4,it.pos.z),3,4,[new THREE.Color(3,1.5,.4),new THREE.Color(3,2.5,1.2)],.04,.6,{up:true,grav:9});
 if(f.t>3.4){const w=f.w;w.up=true;w.forging=false;const s=stats(w.id,true);w.mag=s.mag;w.res=s.res;G.forge=null;snd.buy();hud.banner(s.name,'FORGED · DAMAGE ×2','#e080ff',2.2);const p=P();const i=p.weapons.indexOf(w);if(i>=0)equip(i,true);fx.explosion(new V(it.pos.x,1.2,it.pos.z),.3);}}
function openDoor(d){if(!spend(d.cost))return;map.openDoor(d);G.stats.doors++;snd.door();const p=P();const away=new V(d.pos.x-p.pos.x,0,d.pos.z-p.pos.z).normalize();
 for(const part of d.parts){fx.debris.add(part,new V(away.x*(3+R()*3)+(R()-.5)*2,2+R()*3,away.z*(3+R()*3)+(R()-.5)*2),new V(R()*8,R()*8,R()*8),2.4,{r:.1});}d.mesh.visible=false;fx.dirt(new V(d.pos.x,.5,d.pos.z),24);
 const names=d.areas.filter(a=>a>=0).map(a=>map.areas[a].name);hud.feed(names.join(' ⇄ ')+' OPENED','y');computeFields(true);G.shake=Math.max(G.shake,.2);}

/* ================= interaction ================= */
function findUse(){const p=P();if(p.downed)return null;const f=new V(-Math.sin(p.yaw),0,-Math.cos(p.yaw));const cand=[];const add=(o,d,pos)=>{if(pos&&d>1.1){const to=new V(pos.x-p.pos.x,0,pos.z-p.pos.z).normalize();if(to.dot(f)<.15)return;}cand.push({...o,d});};
 if(!G.solo&&G.ally&&G.ally.downed){const d=Math.hypot(G.ally.pos.x-p.pos.x,G.ally.pos.z-p.pos.z);if(d<1.8)add({k:'revive',t:'HOLD [E] REVIVE ROOK',hold:true},d-1);}
 for(const dr of map.doors){if(dr.open)continue;const d=Math.hypot(dr.pos.x-p.pos.x,dr.pos.z-p.pos.z);if(d<2.4)add({k:'door',t:'[E] CLEAR THE BARRICADE',cost:dr.cost,o:dr},d,dr.pos);}
 for(const w of map.windows){if(w.boards>=6||!map.areas[w.area].open)continue;const d=Math.hypot(w.inPos.x-p.pos.x,w.inPos.z-p.pos.z);if(d<1.6)add({k:'win',t:'HOLD [E] REBUILD BARRIER',hold:true,o:w},d+.3);}
 for(const it of map.items){let d,pos=it.pos;if(it.type==='perk'){pos=new V(it.x+.5+it.fx*.8,0,it.z+.5+it.fz*.8);d=Math.hypot(pos.x-p.pos.x,pos.z-p.pos.z);if(d>1.3)continue;const own=p.perks.has(it.id);if(own)continue;const cost=G.solo&&it.id==='wind'?it.soloCost:it.cost;
   add({k:'perk',t:(G.power||it.id==='wind'?'[E] ':'NO POWER · ')+it.name,cost,o:it},d);}
  else if(it.type==='wall'){d=Math.hypot(pos.x-p.pos.x,pos.z-p.pos.z);if(d>1.7)continue;const own=p.weapons.find(w=>w.id===it.w);const s=WPN[it.w];if(own){const ss=G.wstats(own);if(own.res>=ss.res&&own.mag>=ss.mag)add({k:'none',t:s.name+' · AMMO FULL'},d,pos);else add({k:'ammo',t:'[E] '+(own.up?'FORGED ':'')+'AMMO',cost:own.up?2500:Math.round(s.cost/2),o:it},d,pos);}else add({k:'wall',t:'[E] BUY '+s.name,cost:s.cost,o:it},d,pos);}
  else if(it.type==='crate'&&it===crate.item){d=Math.hypot(pos.x-p.pos.x,pos.z-p.pos.z);if(d>2.2)continue;if(crate.state==='idle')add({k:'crate',t:'[E] OPEN THE MYSTERY CRATE',cost:CRATE_COST},d,pos);else if(crate.state==='ready'&&crate.opener===p)add({k:'crate',t:'[E] TAKE '+WPN[crate.wid].name},d,pos);}
  else if(it.type==='forge'){d=Math.hypot(pos.x-p.pos.x,pos.z-p.pos.z);if(d>2.2)continue;const w=p.weapons[p.cur];if(G.forge)add({k:'none',t:'THE FORGE IS WORKING…'},d,pos);else if(!G.power)add({k:'none',t:'THE FORGE IS COLD · NO POWER'},d,pos);else if(w&&!w.up&&!w.forging)add({k:'forge',t:'[E] FORGE '+WPN[w.id].name,cost:FORGE_COST},d,pos);else add({k:'none',t:'ALREADY FORGED'},d,pos);}
  else if(it.type==='power'&&!G.power){d=Math.hypot(pos.x-p.pos.x,pos.z-p.pos.z);if(d<1.9)add({k:'power',t:'[E] THROW THE MAIN POWER'},d,pos);}}
 cand.sort((a,b)=>a.d-b.d);return cand[0]||null;}
let useCur=null;
function doUse(u,edge,dt){const p=P();if(!u)return;
 if(u.k==='win'){if(!keys.KeyE&&!padUse)return;p.useHold+=dt;const w=u.o;const rate=p.perks.has('hand')?.42:.68;if(p.useHold>=rate){p.useHold=0;if(map.addBoard(w)>=0){snd.board(w.pos);G.stats.boards++;if(G.repairPts<500){award(10);G.repairPts+=10;}fx.smoke.burst(new V(w.pos.x,1.3,w.pos.z),3,.6,[new THREE.Color(.4,.35,.3)],.25,.6,{grav:-.1,drag:3,grow:.3,alpha:.5,jit:.4});}}return;}
 if(u.k==='revive'){if(!keys.KeyE&&!padUse){p.reviveT=0;return;}p.reviveT=(p.reviveT||0)+dt;hud.bar(p.reviveT/G.reviveTime(false));if(p.reviveT>=G.reviveTime(false)){p.reviveT=0;const A=G.ally;A.downed=false;A.hp=A.hpMax*.5;G.stats.revivesGiven++;snd.revive();hud.feed('YOU REVIVED ROOK','g');award(50);}return;}
 if(!edge)return;
 if(u.k==='door')openDoor(u.o);else if(u.k==='wall'){if(spend(u.cost))giveWeapon(u.o.w,false);}else if(u.k==='ammo'){if(spend(u.cost)){const w=p.weapons.find(w=>w.id===u.o.w);const s=G.wstats(w);w.res=s.res;w.mag=Math.max(w.mag,0);hud.feed('AMMO','y');}}
 else if(u.k==='perk')buyPerk(u.o);else if(u.k==='crate')crateUse();else if(u.k==='forge')useForge();else if(u.k==='power')setPower(true);}

/* ================= input ================= */
const keys={},mouse={l:false,r:false,dx:0,dy:0};let locked=false,useEdge=false,jumpEdge=false,padUse=false;
function lock(){if(G.app!=='play')return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='play')pause(true);});
canvas.addEventListener('mousedown',()=>{if(G.app==='play'&&!locked)lock();});
addEventListener('mousedown',e=>{if(G.app!=='play'||!locked)return;if(e.button===0)mouse.l=true;if(e.button===2)mouse.r=true;if(e.button===1){e.preventDefault();swapWeapon(1);}});
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(!locked)return;mouse.dx+=e.movementX;mouse.dy+=e.movementY;});
addEventListener('wheel',e=>{if(G.app!=='play'||!locked)return;swapWeapon(e.deltaY>0?1:-1);},{passive:true});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];keys[e.code]=true;if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='paused')pause(false);else if(G.app==='play')pause(true);return;}if(G.app!=='play'||!first)return;
 if(e.code==='Space')jumpEdge=true;if(e.code==='KeyE')useEdge=true;if(e.code==='KeyR')startReload();if(e.code==='KeyV')knife();if(e.code==='KeyQ')throwNade();if(e.code==='KeyF'){P().flashOn=!P().flashOn;snd.dry();}
 if(e.code==='Digit1')equip(0);if(e.code==='Digit2')equip(1);if(e.code==='Tab')swapWeapon(1);});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyE')P().useHold=0;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlock();mouse.l=mouse.r=false;}else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}
let padPrev={};
function readInput(){const p=P();const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
 const inp={f,s,sprint:!!(keys.ShiftLeft||keys.ShiftRight),jump:jumpEdge,use:useEdge,fire:mouse.l&&locked,ads:mouse.r&&locked};jumpEdge=false;useEdge=false;
 const sens=.0022*G.opt.sens*(p.ads?.7:1);if(locked){p.yaw-=mouse.dx*sens;p.pitch=cl(p.pitch-mouse.dy*sens,-1.45,1.45);}vm.mdx=mouse.dx;vm.mdy=mouse.dy;mouse.dx=mouse.dy=0;
 const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;padUse=false;
 if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.18?v:0;const b=i=>bt[i]&&(bt[i].pressed||bt[i].value>.4);const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);if(lx||ly){inp.f=-ly;inp.s=lx;}
  p.yaw-=rx*.05*G.opt.sens*(p.ads?.55:1);p.pitch=cl(p.pitch-ry*.04*G.opt.sens*(p.ads?.55:1),-1.45,1.45);if(b(7))inp.fire=true;if(b(6))inp.ads=true;if(b(10))inp.sprint=true;if(b(0)&&!padPrev.a)inp.jump=true;
  if(b(2)){padUse=true;if(!padPrev.x){inp.use=true;if(!useCur)startReload();}}if(b(1)&&!padPrev.b)knife();if(b(5)&&!padPrev.rb)throwNade();if(b(3)&&!padPrev.y)swapWeapon(1);if(b(9)&&!padPrev.st)pause(true);
  padPrev={a:b(0),x:b(2),b:b(1),rb:b(5),y:b(3),st:b(9)};}
 if(G.autoFire)inp.fire=true;if(G.autoUse)padUse=true;return inp;}

/* ================= player ================= */
function movePlayer(dt,inp){const p=P();const v=p.vel;const sy=Math.sin(p.yaw),cy=Math.cos(p.yaw);let wx=-sy*inp.f+cy*inp.s,wz=-cy*inp.f-sy*inp.s;const wl=Math.hypot(wx,wz);if(wl>0){wx/=wl;wz/=wl;}
 const w=p.weapons[p.cur];const wm=w?WPN[w.id].move:1;p.sprint=inp.sprint&&inp.f>0&&!p.downed&&!p.ads&&p.sprintLock<=0&&!p.reload&&p.drinkT<=0;
 const max=(p.downed?MV.down:p.ads?MV.ads:p.sprint?MV.sprint:MV.walk)*wm;const acc=p.onGround?MV.accel:2.5;v.x+=(wx*max-v.x)*Math.min(1,dt*acc);v.z+=(wz*max-v.z)*Math.min(1,dt*acc);
 if(inp.jump&&p.onGround&&!p.downed){p.vy=MV.jump;p.onGround=false;}
 p.pos.x+=v.x*dt;p.pos.z+=v.z*dt;
 // the dead body-block you
 for(const z of G.zombies){if(!z.alive||z.state==='rise'||z.state==='climb'||z.win&&z.state!=='attack')continue;const dx=p.pos.x-z.pos.x,dz=p.pos.z-z.pos.z,d=Math.hypot(dx,dz),m=MV.r+z.def.r;if(d<m&&d>1e-4&&Math.abs(p.y-z.pos.y)<1){const o=(m-d);p.pos.x+=dx/d*o*.6;p.pos.z+=dz/d*o*.6;z.pos.x-=dx/d*o*.4;z.pos.z-=dz/d*o*.4;}}
 if(G.ally&&!G.solo&&!G.ally.dead){const A=G.ally;const dx=p.pos.x-A.pos.x,dz=p.pos.z-A.pos.z,d=Math.hypot(dx,dz);if(d<.6&&d>1e-4){p.pos.x+=dx/d*(.6-d)*.5;p.pos.z+=dz/d*(.6-d)*.5;A.pos.x-=dx/d*(.6-d)*.5;A.pos.z-=dz/d*(.6-d)*.5;}}
 map.collide(p.pos,MV.r,p.y+(p.onGround?MV.step:MV.mantle));vertical(p,dt);}
// real vertical body: gravity, landing on prop tops, step-up/mantle (eased via stepS), walking off edges, head vs ceilings
function vertical(p,dt){const gy=map.floorAt(p.pos.x,p.pos.z,MV.r*.6);p.stepS*=Math.exp(-dt*12);
 if(p.onGround&&gy<p.y-.02){p.onGround=false;p.vy=Math.min(p.vy,0);}
 if(!p.onGround){p.vy-=MV.grav*dt;p.y+=p.vy*dt;const rf=map.roof[map.idx(p.pos.x,p.pos.z)]||0;if(rf&&p.y+MV.head>rf){p.y=rf-MV.head;p.vy=Math.min(p.vy,0);}
  if(p.y<=gy){if(p.vy<-4)p.landDip=Math.min(.12,-p.vy*.015);p.stepS+=Math.max(0,gy-p.y);p.y=gy;p.vy=0;p.onGround=true;}}
 else if(gy>p.y){p.stepS+=gy-p.y;p.y=gy;p.vy=0;}}
function crowd(){const zs=G.zombies;for(let i=0;i<zs.length;i++){const a=zs[i];if(!a.alive||a.state==='climb'||a.state==='rise')continue;for(let j=i+1;j<zs.length;j++){const b=zs[j];if(!b.alive||b.state==='climb'||b.state==='rise')continue;const dx=a.pos.x-b.pos.x,dz=a.pos.z-b.pos.z;const m=a.def.r+b.def.r;if(Math.abs(dx)>m||Math.abs(dz)>m)continue;const d=Math.hypot(dx,dz);if(d<m&&d>1e-4){const o=(m-d)*.5;const ka=b.type==='boss'?1.6:a.type==='boss'?.2:1,kb=2-ka;a.pos.x+=dx/d*o*ka;a.pos.z+=dz/d*o*ka;b.pos.x-=dx/d*o*kb;b.pos.z-=dz/d*o*kb;}}
  if(G.ally&&!G.solo&&!G.ally.dead&&!G.ally.downed){const A=G.ally;const dx=A.pos.x-a.pos.x,dz=A.pos.z-a.pos.z,d=Math.hypot(dx,dz),m=.3+a.def.r;if(d<m&&d>1e-4){A.pos.x+=dx/d*(m-d)*.6;A.pos.z+=dz/d*(m-d)*.6;a.pos.x-=dx/d*(m-d)*.4;a.pos.z-=dz/d*(m-d)*.4;}}}}
function computeFields(force){G.fieldT-=force?99:0;const p=P();map.bfs(Math.floor(p.pos.x),Math.floor(p.pos.z),false,G.fieldP);if(G.ally&&!G.solo&&!G.ally.dead)map.bfs(Math.floor(G.ally.pos.x),Math.floor(G.ally.pos.z),false,G.fieldA);else G.fieldA.fill(-1);G.fieldT=.25;}

/* ================= main step ================= */
function step(dt){dt=Math.min(dt,.1);G.time+=dt;skyU.uT.value=G.time;
 if(G.app==='play')playStep(dt);else if(G.app==='menu'){for(const z of G.zombies)z.update(dt,G);crowd();}else if(G.app==='over'){for(const z of G.zombies)if(!z.alive)z.update(dt,G);}
 if(G.app!=='paused'){fx.update(dt,scene.fog,G.app==='play'?P().pos:cam.position);map.updateBoards(dt);map.updateLights(dt,G.time);updateCrate(dt);updateForge(dt);for(let i=G.zombies.length-1;i>=0;i--)if(G.zombies[i].gone){scene.remove(G.zombies[i].root);G.zombies[i].dispose();G.zombies.splice(i,1);}}
 visuals(dt);}
function playStep(dt){const p=P();const inp=readInput();const S=G.stats;S.time+=dt;
 // the night clock
 if(G.phase!=='dawn'&&G.phase!=='overrun'){G.clock-=dt;if(G.clock<=0){G.clock=0;beginDawn();}}
 if(G.phase==='dawn'||G.phase==='overrun'){G.endT+=dt;if(G.endT>(G.phase==='dawn'?4.5:3.2)){endGame(G.phase==='dawn'?'dawn':'dead');return;}}
 for(let i=G.timers.length-1;i>=0;i--){const t=G.timers[i];t.t-=dt;if(t.t<=0){G.timers.splice(i,1);t.f();}}
 p.invuln=Math.max(0,p.invuln-dt);p.swapT=Math.max(0,p.swapT-dt);p.knifeCD=Math.max(0,p.knifeCD-dt);p.knifeT=Math.max(0,p.knifeT-dt);p.nadeT=Math.max(0,p.nadeT-dt);p.sprintLock=Math.max(0,p.sprintLock-dt);p.bloom=Math.max(0,p.bloom-dt*.12);p.recoil*=Math.exp(-dt*5.5);p.landDip=Math.max(0,p.landDip-dt*.6);
 if(p.drinkT>0){p.drinkT-=dt;if(p.drinkT<=0)finishDrink();}G.hurtFx=Math.max(0,G.hurtFx-dt*1.4);G.shake=Math.max(0,G.shake-dt*1.8);for(const k in G.pup)G.pup[k]=Math.max(0,G.pup[k]-dt);
 // health
 if(!p.downed){p.regenT+=dt;if(p.regenT>2.6)p.hp=Math.min(p.maxHp,p.hp+dt*(p.maxHp*.7));}
 else{p.bleed-=dt;if(p.selfRevive&&p.bleed<=0)G.revivePlayer(null);else if(p.bleed<=0&&G.phase!=='overrun'){G.phase='overrun';G.endT=0;p.dead=true;hud.banner('OVERRUN','THE NIGHT TAKES YOU · ROUND '+G.round,'#ff3a2a',3);snd.lose();}
  if(!p.dying&&(!G.ally||G.ally.downed||G.ally.dead)&&!p.selfRevive){p.dying=true;p.bleed=Math.min(p.bleed,2.6);}}
 if(G.phase!=='overrun')movePlayer(dt,inp);
 // weapons
 const w=p.weapons[p.cur];p.ads=inp.ads&&!p.sprint&&!(p.reload&&!p.reload.shell)&&p.drinkT<=0&&p.knifeT<=0&&!!w&&!w.forging;
 if(G.phase!=='overrun'&&G.phase!=='dawn'){updateReload(dt);const busy=p.swapT>0||p.knifeT>0||p.nadeT>0||p.drinkT>0;
  if(inp.fire&&!busy&&w&&!w.forging){const s=G.wstats(w);const edge=!p.trigPrev;if(G.time>=p.nextFire&&(s.auto||edge||G.time>=p.nextFire+s.rate*.55))fire();}p.trigPrev=inp.fire;}
 G.crossSpread=w?(p.ads?G.wstats(w).ads:G.wstats(w).spread*(1+Math.min(1,Math.hypot(p.vel.x,p.vel.z)/4)*.6))+p.bloom:0;
 // interaction
 useCur=G.phase==='fight'||G.phase==='break'||G.phase==='pre'?findUse():null;if(useCur){const can=!useCur.cost||p.points>=useCur.cost;hud.prompt(useCur.t,useCur.cost,can);doUse(useCur,inp.use,dt);}else{hud.prompt('');p.useHold=0;}
 if(!useCur||useCur.k!=='revive'){if(!(p.downed&&G.ally&&G.ally.reviving>0))hud.bar(null);}
 if(p.downed&&G.ally&&G.ally.reviving>0)hud.bar(G.ally.reviving/G.reviveTime(true));
 // area name
 const ai=map.areaAt(p.pos.x,p.pos.z);if(ai>=0)G.areaName=map.areas[ai].name;
 // rounds
 G.phaseT-=dt;if(G.phase==='pre'&&G.phaseT<=0)startRound();
 else if(G.phase==='fight'){G.spawnT-=dt;const alive=G.zombies.filter(z=>z.alive).length;const maxA=G.diff.alive+(G.solo?0:2);
  if(G.toSpawn.length&&G.spawnT<=0&&alive<maxA){G.spawnT=Math.max(.35,2.0-G.round*.15)*G.diff.spawn*(.6+R()*.8);spawnOne(G.toSpawn.shift());}
  if(!G.toSpawn.length&&alive===0){G.phase='break';G.phaseT=9;snd.roundEnd();hud.banner('ROUND '+G.round+' SURVIVED','CATCH YOUR BREATH','#9be24a',2.4);}}
 else if(G.phase==='break'&&G.phaseT<=0)startRound();
 // flow fields + undead
 G.fieldT-=dt;if(G.fieldT<=0)computeFields();
 for(const z of G.zombies){z.update(dt,G);if(z.alive&&z.type!=='boss'){// recycle zombies that wandered off and lost everyone
   const near=Math.min(Math.hypot(z.pos.x-p.pos.x,z.pos.z-p.pos.z),G.ally&&!G.solo&&!G.ally.dead?Math.hypot(z.pos.x-G.ally.pos.x,z.pos.z-G.ally.pos.z):1e9);z.lost=near>22&&z.state!=='tear'&&z.state!=='attack'?(z.lost||0)+dt:0;
   if(z.lost>20&&G.phase==='fight'){z.alive=false;z.gone=true;G.toSpawn.push({t:z.type,g:z.gait});}}}
 crowd();if(G.ally&&!G.solo)G.ally.update(dt,G);
 updateProjs(dt);updateDrops(dt);
 // boss lantern light
 const boss=G.zombies.find(z=>z.type==='boss'&&z.alive);if(boss&&boss.lantern){boss.lantern.getWorldPosition(bossLight.position);bossLight.intensity=10+Math.sin(G.time*9)*2;}else bossLight.intensity=0;
 // dawn burn
 if(G.phase==='dawn'){for(const z of G.zombies)if(z.alive&&R()<dt*1.5){z.die(G,'dawn','body');fx.sparks.burst(z.center(new V()),20,3,[new THREE.Color(3,1.4,.3)],.08,.8,{up:true,grav:-2});}}
 // audio bed
 const alive=G.zombies.filter(z=>z.alive).length;snd.ambience(true,Math.min(1,alive/14),dawnK());if(p.hp<p.maxHp*.35&&!p.downed&&((G.time*1.3)%1)<dt*1.3)snd.heartbeat();}
function beginDawn(){G.phase='dawn';G.endT=0;G.toSpawn.length=0;hud.banner('DAWN BREAKS','YOU SURVIVED THE NIGHT · ROUND '+G.round,'#ffd070',4);snd.dawnRise();const p=P();if(p.downed&&!p.dying)G.revivePlayer(null);}
const dawnK=()=>G.app==='menu'?0:G.phase==='dawn'?Math.min(1,.55+G.endT*.15):Math.pow(smooth(.7,1,1-G.clock/G.nightLen),1.3)*.55;

/* ================= end + scoring ================= */
let lastAward=null;
function endGame(reason){if(G.app!=='play')return;G.app='over';unlock();hud.show(false);document.body.classList.remove('playing');snd.muffle(false);snd.ambience(true,0,reason==='dawn'?1:0);
 const S=G.stats,won=reason==='dawn';const score=Math.round(S.earned+(won?1000+G.round*250:0));G.result={reason,won,score,round:G.round};
 $('oeye').textContent=`${G.opt.len}-MINUTE NIGHT · ${G.diff.n} · ${G.solo?'SOLO':'WITH ROOK'}`;$('ores').textContent=won?'DAWN BREAKS':'OVERRUN';$('ores').style.color=won?'#ffd070':'#ff4a3a';$('ofs').textContent=score.toLocaleString()+' PTS';
 const acc=S.shots?Math.round(Math.min(1,S.hits/S.shots)*100):0;
 const rows=[['ROUND REACHED',G.round],['KILLS',S.kills+(S.heads?` · ${S.heads} HEADSHOTS`:'')+(S.knife?` · ${S.knife} KNIFE`:'')],['POINTS EARNED',Math.round(S.earned).toLocaleString()],['ACCURACY',acc+'%'],['TIME SURVIVED',mmss(S.time)],['DOORS · PERKS · CRATE SPINS',`${S.doors} · ${S.perks} · ${S.boxes}`],['BOARDS REBUILT',S.boards],['DOWNS',S.downs+(G.solo?'':` · ROOK REVIVED YOU ${S.revivedBy}×`)],...(G.solo?[]:[['ROOK',`${S.allyKills} KILLS · YOU REVIVED HIM ${S.revivesGiven}×`]]),...(S.bosses?[['GRAVEKEEPERS SLAIN',S.bosses]]:[]),...(won?[['DAWN BONUS','+'+(1000+G.round*250).toLocaleString()]]:[])];
 $('stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');const tok=awardTokens(score,won);$('otok').textContent=`+${tok} TOKENS · BEST ${best().toLocaleString()} PTS`;$('over').hidden=false;}
function awardTokens(pts,won){lastAward={pts,won,round:G.round,kills:G.stats.kills,heads:G.stats.heads,len:G.opt.len,diff:G.diff.n,solo:G.solo};const tok=5+Math.min(60,pts/400|0);
 addRound(tok,won);saveBest('nightfall',pts);return tok;}
function best(){return bestScore('nightfall');}
function updateBest(){const b=best();$('best').textContent=b?'BEST · '+b.toLocaleString()+' PTS':'';}

/* ================= visuals ================= */
let menuA=0;const MOONC=new THREE.Color(0x8aa4ff),SUNC=new THREE.Color(0xffa060),FOGN=new THREE.Color(0x070a14),FOGD=new THREE.Color(0x4a3a3e),HSKY=new THREE.Color(0x34446c),HSKYD=new THREE.Color(0x8a7a90);
function visuals(dt){const p=P();const dk=dawnK();skyU.uDawn.value=dk;
 moon.color.copy(MOONC).lerp(SUNC,dk);moon.intensity=.75+dk*1.2;const ld=skyU.uMoon.value.clone().lerp(skyU.uSun.value.clone().setY(.25),dk).normalize();moon.position.copy(MC).addScaledVector(ld,80);
 scene.fog.color.copy(FOGN).lerp(FOGD,dk);scene.fog.density=.03-dk*.012;hemi.color.copy(HSKY).lerp(HSKYD,dk);hemi.intensity=.6+dk*.6;
 if(G.app==='menu'||G.app==='over'&&!G.result){menuA+=dt*.05;const a=menuA;cam.position.set(34+Math.cos(a)*9,2.4+Math.sin(a*.7)*.5,32+Math.sin(a)*7);cam.lookAt(28+Math.cos(a+1.2)*5,1.4,30+Math.sin(a+1.2)*6);fovFor(66);vm.root.visible=false;flashlight.intensity=0;snd.listener(cam.position.x,cam.position.y,cam.position.z,0);return;}
 if(G.app==='over'){menuA+=dt*.04;const c=p.pos;cam.position.set(c.x+Math.cos(menuA)*6,3.2,c.z+Math.sin(menuA)*6);cam.lookAt(c.x,1,c.z);fovFor(60);vm.root.visible=false;flashlight.intensity=0;return;}
 const sp=Math.hypot(p.vel.x,p.vel.z);const bob=p.onGround?Math.sin(G.time*(p.sprint?13:9.5))*Math.min(1,sp/4.4)*(p.sprint?.045:.025)*(1-vm.ads*.8):0;
 const eyeH=p.downed?.55:MV.eye;const dead=G.phase==='overrun';const s=G.shake*G.shake*.12;
 cam.position.set(p.pos.x,p.y+eyeH-p.landDip-p.stepS+bob-(dead?Math.min(.4,G.endT*.3):0),p.pos.z);cam.rotation.set(p.pitch+p.recoil+(R()-.5)*s,p.yaw+(R()-.5)*s,(p.downed?.18:0)+(dead?G.endT*.15:0)+(R()-.5)*s*.5);
 const w=p.weapons[p.cur];const adsF=w?G.wstats(w).adsFov:1;fovFor(G.opt.fov*(1-vm.ads*(1-adsF))+(p.sprint?6:0));
 snd.listener(cam.position.x,cam.position.y,cam.position.z,p.yaw);
 flashlight.intensity=p.flashOn&&!dead?(55*(1-dk*.8)):0;
 vm.update({dt,mdx:vm.mdx||0,mdy:vm.mdy||0,speed:sp,onGround:p.onGround,airborne:!p.onGround,vy:p.vy,strafe:(p.vel.x*Math.cos(p.yaw)-p.vel.z*Math.sin(p.yaw))/6,t:G.time,ads:p.ads,sprint:p.sprint,auto:w&&WPN[w.id].auto,
  lower:p.drinkT>0||(w&&w.forging)||G.phase==='dawn',visible:!dead&&!!w,empty:w&&w.mag===0,cylSpin:vm.cylSpin?(vm.cylSpin=0,1.05):0});
 vmFlash.intensity*=Math.exp(-dt*30);vmHemi.intensity=.55+dk*.6;
 // markers
 const A=G.ally;if(A&&!G.solo&&!A.dead){const mp=new V(A.pos.x,2.15,A.pos.z).project(cam);const on=mp.z<1&&Math.abs(mp.x)<1.1&&Math.abs(mp.y)<1.1;const dist=Math.hypot(A.pos.x-p.pos.x,A.pos.z-p.pos.z);
  hud.marker('ally',on&&(A.downed||dist>5),(mp.x*.5+.5)*innerWidth,(-mp.y*.5+.5)*innerHeight,A.downed?`REVIVE ROOK · ${Math.ceil(A.bleed)}s<i></i>`:`ROOK · ${dist.toFixed(0)}M<i></i>`,A.downed?'down':'');}else hud.marker('ally',false);
 {const sp2=map.crateSpots[crate.spot].pos;const mp=new V(sp2.x,1.6,sp2.z).project(cam);const dist=Math.hypot(sp2.x-p.pos.x,sp2.z-p.pos.z);const on=mp.z<1&&Math.abs(mp.x)<1&&Math.abs(mp.y)<1&&dist>6&&dist<26&&map.areas[map.crateSpots[crate.spot].area].open;hud.marker('crate',on,(mp.x*.5+.5)*innerWidth,(-mp.y*.5+.5)*innerHeight,'CRATE<i></i>','crate');}}
function fovFor(h){const aspect=innerWidth/innerHeight;cam.fov=cl(2*Math.atan(Math.tan(h*Math.PI/360)/aspect)*180/Math.PI,30,100);cam.updateProjectionMatrix();}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!vm.root.visible||G.app!=='play'&&G.app!=='paused')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;RR.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.8));fxStack=null;fxSize='';moon.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(moon.shadow.map){moon.shadow.map.dispose();moon.shadow.map=null;}
 flashlight.castShadow=q>=2;moon.castShadow=q>=1;RR.shadowMap.needsUpdate=true;for(const z of G.zombies)z.root.traverse(o=>{if(o.isMesh)o.castShadow=q>=1;});scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined&&o.isMesh)o.material.needsUpdate=true;});}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(RR.domElement.width!==Math.floor(w*RR.getPixelRatio())||RR.domElement.height!==Math.floor(h*RR.getPixelRatio()))RR.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();sky.position.copy(cam.position);const sc=h*RR.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));fx.sparks.U.uScale.value=fx.smoke.U.uScale.value=fx.mist.U.uScale.value=sc;
 frameN++;if(gfx>=2||frameN%2===0||frameN<4)RR.shadowMap.needsUpdate=true;
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(RR,scene,cam,{exposure:1.25,bloom:.8,bloomThreshold:.62,bloomRadius:.55,saturation:.92,tint:0xdfe6ff,vignette:.5,grain:.045,aoStrength:.9,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade){const p=P();const hp=G.app==='play'?(p.downed?0:Math.min(1,p.hp/(p.maxHp*.6))):1;fxStack.grade.uniforms.sat.value=.92*(.35+.65*hp)+dawnK()*.15;}
 if(fxStack.composer)fxStack.render();else{RR.autoClear=true;RR.render(scene,cam);if(vm.root.visible&&G.app==='play'){RR.autoClear=false;RR.clearDepth();RR.render(vmScene,vmCam);RR.autoClear=true;}}}

/* ================= menus ================= */
const seg=(id,key,cb)=>{const el=$(id);const set=(v,init)=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===+v));if(!init){saveOpt();cb&&cb(v);}};set(G.opt[key],true);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(+b.dataset.v));};
seg('o-len','len');seg('o-diff','diff');seg('o-ally','ally');seg('o-sens','sens');seg('o-vol','vol',v=>snd.setVol(v));seg('o-fov','fov');
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{G.app='menu';toMenu();};
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Nightfall\nScore: ${a.pts||0}\nResult: ${a.won?'survived until dawn':'overrun'} · round ${a.round||0}\nKills: ${a.kills||0} (${a.heads||0} headshots)\nNight: ${a.len||0} min · ${a.diff||''} · ${a.solo?'solo':'with Rook'}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore('nightfall',a.pts||0,body);};

/* ================= loop ================= */
attract();$('loading').classList.add('done');
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(G.noLoop){requestAnimationFrame(loop);return;}try{step(dt);if(G.app==='play'||G.app==='paused')hud.update(G,dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.NIGHTFALL={get state(){return G.app;},manual(v=true){G.noLoop=v;},frame(dt=1/60){step(dt);if(G.app==='play'||G.app==='paused')hud.update(G,dt);render();},get app(){return G.app;},get phase(){return G.phase;},G,get player(){return G.player;},get zombies(){return G.zombies;},get ally(){return G.ally;},get round(){return G.round;},map,crate,scene,cam,R:RR,vm,fx,snd,hud,
 step,render,start,toMenu,pause,endGame,setQuality:applyQuality,get gfx(){return gfx;},
 setClock(s){G.clock=s;},get clock(){return G.clock;},god(v=true){G.god=v;},points(n){P().points+=n;},give(id,up=false){giveWeapon(id,up);},fire:()=>fire(),knife,throwNade,reload:startReload,use(){useEdge=true;},hold(v=true){G.autoUse=v;},
 autoFire(v=true){G.autoFire=v;},keys,mouse,
 spawn(type='walker',x,z,o={}){const pos=x!==undefined?new V(x,0,z):map.randomFloor([0],P().pos,6);const zz=new Zombie(type==='boss'?'boss':type,{hp:o.hp??roundHp(Math.max(1,G.round)),speed:o.speed??1.2,dmg:ZDMG*G.diff.dmg,pos,state:o.state||'chase',gait:type==='runner'?2:0},G);scene.add(zz.root);G.zombies.push(zz);return zz;},
 killAll(){for(const z of G.zombies)if(z.alive){z.die(G,'nuke','body');}G.toSpawn.length=0;},clearRound(){G.toSpawn.length=0;for(const z of G.zombies)if(z.alive)z.die(G,'nuke','body');},
 nextRound(){G.toSpawn.length=0;for(const z of G.zombies)if(z.alive)z.die(G,'nuke','body');G.phase='break';G.phaseT=0;},
 down(){hurtPlayer(9999,null,true);},hurt(n){hurtPlayer(n,null,true);},teleport(x,z){const p=P();p.pos.set(x,0,z);p.vel.set(0,0,0);computeFields(true);},look(yaw,pitch=0){const p=P();p.yaw=yaw;p.pitch=pitch;},
 aimAt(z){const p=P();const t=z.center?z.center(new V()):z;const dx=t.x-p.pos.x,dz=t.z-p.pos.z,dy=t.y-(p.y+MV.eye);p.yaw=Math.atan2(-dx,-dz);p.pitch=Math.atan2(dy,Math.hypot(dx,dz));p.recoil=0;cam.position.set(p.pos.x,p.y+MV.eye,p.pos.z);cam.rotation.set(p.pitch,p.yaw,0);cam.updateMatrixWorld();},
 openAll(){for(const d of map.doors)if(!d.open){P().points+=d.cost;openDoor(d);}},power(){setPower(true);},drop(k){dropPowerup(P().pos.clone().add(new V(0,0,-2)),k);},perk(id){P().perks.add(id);if(id==='hide'){P().maxHp=250;P().hp=250;}},
 findUse:()=>findUse(),get useCur(){return useCur;},crateState:()=>crate.state,forgeState:()=>G.forge,get stats(){return G.stats;},get result(){return G.result;},MV};
