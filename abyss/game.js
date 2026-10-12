// ABYSS DIVER — ocean survival on an alien sea. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {Sky} from '../vendor/jsm/objects/Sky.js';
import {ShaderPass} from '../vendor/jsm/postprocessing/ShaderPass.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {cl,lerp,sm,$,mmss} from './util.js';
import {U,installWaterFog,makeDome,makeSurface,makeRays,makeSnow,makePlankton,makeBubbles,LensShader} from './water.js';
import {buildWorld,heightAt,region,weights,RES,WRECK,RIBS,WORLD} from './world.js';
import {Life} from './life.js';
import {buildPod,buildSub,buildCockpit,buildViewmodel,buildRocket} from './gear.js';
import {ITEMS,RECIPES,SPECIES,DIFFS,DIVE,CARRY} from './data.js';
import {Sound} from './sound.js';
import {HUD,invHTML} from './hud.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const V=THREE.Vector3,TAU=Math.PI*2;
try{await Promise.race([Promise.all([document.fonts.load('64px Anton'),document.fonts.load('20px "JetBrains Mono"')]),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
installWaterFog();

/* ================= renderer + scene ================= */
const canvas=$('c');const RR=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});RR.setPixelRatio(Math.min(devicePixelRatio,1.25));
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(72,1,.05,700);cam.rotation.order='YXZ';scene.add(cam);
scene.fog=new THREE.Fog(0x1a8aa8,.018,1);
const sun=new THREE.DirectionalLight(0xd8f4ff,2.4);sun.position.set(30,100,22);scene.add(sun,sun.target);const hemi=new THREE.HemisphereLight(0x8adcff,0x0c2a36,1);scene.add(hemi);
const lamp=new THREE.SpotLight(0xeaf6ff,0,75,.46,.55,1.1);lamp.position.set(.1,.05,-1.1);cam.add(lamp,lamp.target);lamp.target.position.set(0,-.4,-10);
const flareL=new THREE.PointLight(0xff7040,0,45,1.4);scene.add(flareL);const ventL=[0,1].map(()=>{const l=new THREE.PointLight(0xff7a30,0,40,1.6);scene.add(l);return l;});
const sky=new Sky();sky.scale.setScalar(600);sky.visible=false;scene.add(sky);{const u=sky.material.uniforms;u.turbidity.value=4;u.rayleigh.value=1.6;u.mieCoefficient.value=.004;u.sunPosition.value.set(.35,.6,.25);}
const dome=makeDome();scene.add(dome);const surf=makeSurface();scene.add(surf);const rays=makeRays(40);scene.add(rays);
const snow=makeSnow();scene.add(snow);const plankton=makePlankton();scene.add(plankton);const bub=makeBubbles();scene.add(bub.pts);
const world=buildWorld(scene);
const G={app:'menu',ui:null,diff:DIFFS[1],opt:{diff:1,vol:.8,sens:1},time:0,safe:true,hurtT:0,shake:0,loc:'SUNLIT SHOALS',compassMarks:[],obj:null,tip:'',scanP:0,scanning:false,scanLab:'',noLoop:false,god:false};
try{Object.assign(G.opt,JSON.parse(localStorage.getItem('abyss_opt'))||{});}catch(e){}G.diff=DIFFS[G.opt.diff]||DIFFS[1];
const life=new Life(scene,G.diff);
const pod=buildPod();scene.add(pod);const subMesh=buildSub();subMesh.visible=false;scene.add(subMesh);const cockpit=buildCockpit();cam.add(cockpit);const vm=buildViewmodel();vm.scale.setScalar(.72);vm.position.set(.05,-.035,0);cam.add(vm);const rocket=buildRocket();scene.add(rocket);
const snd=new Sound();snd.setVol(G.opt.vol);const hud=new HUD();
const DOCK=new V(0,-8.6,0),HATCH=new V(0,-3.2,0);
const pingMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,fog:false,uniforms:{uA:{value:0},col:{value:new THREE.Color(.35,.95,1)}},
 vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform float uA;uniform vec3 col;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),3.);gl_FragColor=vec4(col*f*uA,1.);}'});
const pingMesh=new THREE.Mesh(new THREE.SphereGeometry(1,40,20),pingMat);pingMesh.visible=false;pingMesh.frustumCulled=false;scene.add(pingMesh);
const flareMesh=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:0xffc080,fog:false}));flareMesh.visible=false;scene.add(flareMesh);

/* ================= player + sub ================= */
const P={pos:new V(),vel:new V(),yaw:0,pitch:0,inv:{},locker:{},tools:{},scanned:new Set(),found:new Set()};
const S={built:false,pos:new V(),vel:new V(),yaw:0,pitch:0,roll:0,hull:100,power:100,pulseCD:0};
const beaconList=[],pings=[];let pingT=-1,sonarCD=0,flare=null,swingT=0,swingCD=0,breathT=2,scanT=0,objT=0,stillT=0,lowO2T=0,crushWarn=0,lastAlert=0;
const BCOL=['#ffd24a','#ff5ad2','#6fff9a','#6ab8ff','#ff8a4a'];
function reset(){Object.assign(P,{yaw:-.9,pitch:-.08,o2:45,o2max:45,hp:100,food:82,water:76,bat:100,rating:100,depth:0,maxD:0,light:false,lightAuto:false,inSub:false,under:true,score:0,diveT:DIVE,lastHurt:-99,deathBy:'',flasks:2,
  stats:{gathered:0,crafted:0,fish:0,eaten:0,scans:0,bites:0,repels:0}});P.inv={flare:2};P.locker={};P.tools={};P.scanned=new Set();P.found=new Set();P.pos.set(6,-4,10);P.vel.set(0,0,0);
 Object.assign(S,{built:false,hull:100,power:100,pulseCD:0,yaw:0,pitch:0,roll:0});S.vel.set(0,0,0);subMesh.visible=false;
 beaconList.splice(0).forEach(b=>scene.remove(b.g));pings.length=0;flare=null;flareMesh.visible=false;stillT=0;
 for(const pk of world.pickups)if(!pk.alive)world.show(pk);for(const k of world.kelp)k.cd=0;
 const m=life.maw;m.pos.set(200,-170,-60);m.state='roam';m.cd=20;m.trail.forEach((p,i)=>p.set(200,-170,-60-i*.6));
 for(const c of life.creatures)if(c.kind==='razorjaw'){c.pos.copy(c.home);c.state='patrol';c.scare=0;c.cd=0;}
 rocket.visible=false;}
const cargoN=()=>Object.values(P.inv).reduce((a,b)=>a+b,0);
const have=k=>(P.inv[k]||0)+(P.locker[k]||0);
function give(k,n=1){P.inv[k]=(P.inv[k]||0)+n;}
function take(k,n){const a=Math.min(n,P.inv[k]||0);P.inv[k]=(P.inv[k]||0)-a;n-=a;if(n>0)P.locker[k]=(P.locker[k]||0)-n;}

/* ================= input ================= */
const keys={},mouse={l:false,r:false};let padPrev={};
addEventListener('keydown',e=>{if(e.code==='Tab'||e.code==='Space')e.preventDefault();if(e.repeat)return;keys[e.code]=true;
 if(G.ui==='pod'){if(e.code==='KeyE'||e.code==='Escape')closePod();else if(/^Digit[1-9]$/.test(e.code)){const r=RECIPES[+e.code.slice(5)-1];if(r)craft(r.id);}return;}
 if(G.ui==='tablet'&&(e.code==='Tab'||e.code==='Escape')){closeTablet();return;}
 if(G.app!=='play')return;
 switch(e.code){case 'KeyE':use();break;case 'KeyF':doFlare();break;case 'KeyR':sonar();break;case 'KeyL':P.light=!P.light;P.lightAuto=true;snd.tone(P.light?900:600,.08,{vol:.05,wet:0});break;case 'KeyB':dropBeacon();break;case 'Tab':openTablet();break;
  case 'Digit1':eat();break;case 'Digit2':drink();break;case 'Digit3':medkit();break;}});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
canvas.addEventListener('mousedown',e=>{if(G.app==='play'&&!G.ui&&document.pointerLockElement!==canvas){lock();return;}if(e.button===0){mouse.l=true;if(G.app==='play')swipe();}if(e.button===2)mouse.r=true;});
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||G.app!=='play'||G.ui)return;const k=.0021*G.opt.sens;if(P.inSub){S.yaw-=e.movementX*k*.8;S.pitch=cl(S.pitch-e.movementY*k*.8,-1.1,1.1);}else{P.yaw-=e.movementX*k;P.pitch=cl(P.pitch-e.movementY*k,-1.52,1.52);}});
function lock(){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}}
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&G.app==='play'&&!G.ui&&!G.noPause)pause(true);});
function pollPad(dt){const gp=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g&&g.connected):null;G.pad=null;if(!gp)return;const ax=i=>Math.abs(gp.axes[i]||0)>.15?gp.axes[i]:0,b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed);
 const pad={mx:ax(0),my:-ax(1),lx:ax(2),ly:ax(3),up:b(0),dn:b(1),use:b(2),log:b(3),boost:b(4),scan:b(5),flare:b(6),knife:b(7),sonar:b(12),start:b(9),eat:b(14),drink:b(15)};G.pad=pad;
 const k=2.6*dt*G.opt.sens;if(P.inSub){S.yaw-=pad.lx*k*.8;S.pitch=cl(S.pitch-pad.ly*k*.8,-1.1,1.1);}else{P.yaw-=pad.lx*k;P.pitch=cl(P.pitch-pad.ly*k,-1.52,1.52);}
 const edge=n=>pad[n]&&!padPrev[n];if(edge('use'))use();if(edge('flare'))doFlare();if(edge('knife'))swipe();if(edge('sonar'))sonar();if(edge('log'))G.ui==='tablet'?closeTablet():openTablet();if(edge('eat'))eat();if(edge('drink'))drink();if(edge('start'))pause(true);padPrev=pad;}

/* ================= helpers ================= */
const _e=new THREE.Euler(),_f=new V(),_r=new V(),_t=new V(),_t2=new V();
function lookDir(out=_f){return out.set(0,0,-1).applyEuler(_e.set(P.inSub?S.pitch:P.pitch,P.inSub?S.yaw:P.yaw,0,'YXZ'));}
function feedItem(k,n){hud.feed(`${ITEMS[k].n} <span style="opacity:.7">×${n}</span>`,ITEMS[k].c,'+'+n);}
function hint(s,dur=3.2){G.tipT=dur;G.tipMsg=s;}
G.hurt=(n,src,from,big)=>{if(G.app!=='play'||G.god||G.ui==='pod')return;P.lastHurt=G.time;P.stats.bites+=src==='HOLLOWMAW'||src==='RAZORJAW'?1:0;G.shake=Math.max(G.shake,big?1:.45);if(big)snd.bite();else snd.hurt();
 if(P.inSub&&src!=='O2'&&src!=='CRUSH'){S.hull-=n;G.hurtT=.5;hud.feed(`HULL DAMAGE −${Math.round(n)}`,'#ff6a5a','⬢');if(S.hull<=0){S.hull=0;subLost();}return;}
 P.hp-=n;G.hurtT=Math.min(1,G.hurtT+.35+n/80);if(P.hp<=0){P.hp=0;P.deathBy=src;end('dead');}};
G.alert=(name)=>{if(G.time-lastAlert<6)return;lastAlert=G.time;hud.alert('PREDATOR CLOSING',name+' · FLARES OR KNIFE DRIVE IT OFF',2.4);snd.warn();};
G.roar=(pos,close)=>{const d=pos.distanceTo(P.pos);snd.roar(close||d<60?1:0);if(!close){hud.alert('LEVIATHAN-CLASS SIGNAL',`HOLLOWMAW · ${Math.round(d)} M · LEAVE THE DROP OR LIGHT A FLARE`,4.5);G.shake=Math.max(G.shake,.25);}else hud.alert('IT IS CHARGING','FLARE (F) OR SHOCK PULSE NOW',2.5);};
function subLost(){hud.banner('MINNOW DESTROYED','The hull gave way. You are back in the water.',4,'#ff7a5a');exitSub(true);S.built=false;delete P.tools.sub;subMesh.visible=false;objT=0;}

/* ================= actions ================= */
function use(){if(G.app!=='play'||G.ui)return;const c=G.cand;if(!c){if(P.inSub){exitSub();return;}snd.deny();return;}
 if(c.t==='pod'){openPod();return;}if(c.t==='sub'){enterSub();return;}if(c.t==='exit'){exitSub();return;}
 if(c.t==='beacon'){scene.remove(c.b.g);beaconList.splice(beaconList.indexOf(c.b),1);snd.pick();hud.feed('BEACON RECOVERED','#ffd24a','◆');return;}
 if(cargoN()>=CARRY&&c.t!=='beacon'){hud.banner('CARGO FULL','Store materials in the lifepod locker',2.4,'#ffb04a');snd.deny();return;}
 if(c.t==='res'){const pk=c.pk,r=RES[pk.k],k=r.as||pk.k;world.hide(pk);const n=r.give;give(k,n);P.stats.gathered+=n;P.score+=10*n;feedItem(k,n);snd.pick();
  if(!P.found.has(k)){P.found.add(k);P.score+=40;hud.banner(ITEMS[k].n,'New material logged',2.2,ITEMS[k].c);}objT=0;return;}
 if(c.t==='kelp'){if(!P.tools.knife){hint('You need a SURVIVAL KNIFE to cut kelp fiber. Print one at the lifepod.');snd.deny();return;}cutKelp(c.k);return;}
 if(c.t==='fish'){const kind=life.catchFish(P.pos,lookDir(_t));if(kind){give('rawfish');P.stats.fish++;P.score+=15;hud.feed(`RAW ${SPECIES[kind].n}`,'#ffb48a','+1');snd.pick();}return;}}
function cutKelp(k){k.cd=G.time+50;give('fiber');P.stats.gathered++;P.score+=10;feedItem('fiber',1);snd.swipe();if(!P.found.has('fiber')){P.found.add('fiber');hud.banner('KELP FIBER','New material logged',2.2,ITEMS.fiber.c);}objT=0;}
function swipe(){if(G.app!=='play'||G.ui||P.inSub||swingCD>0)return;if(!P.tools.knife){if((G.tipT||0)<=0)hint('No knife yet: print a SURVIVAL KNIFE at the lifepod (2 titanium).');return;}swingCD=.42;swingT=.36;snd.swipe();
 const dir=lookDir(_t);for(const c of life.creatures){if(c.kind!=='razorjaw')continue;const v=_t2.copy(c.pos).sub(P.pos);const d=v.length();if(d<3.8&&v.normalize().dot(dir)>.4){c.scare=7;c.state='flee';P.score+=25;P.stats.repels++;hud.feed('RAZORJAW DRIVEN OFF','#ff9a6a','✕');}}
 const c=G.cand;if(c&&c.t==='kelp'&&cargoN()<CARRY)cutKelp(c.k);}
function doFlare(){if(G.app!=='play'||G.ui)return;if(P.inSub){if(S.pulseCD>0||S.power<12){snd.deny();hud.feed('PULSE CHARGING','#ffe04a','⚡');return;}S.pulseCD=9;S.power-=12;snd.pulse();pingT=0;pingMat.uniforms.col.value.setRGB(.6,.5,1);pingMesh.position.copy(S.pos);
  const n=life.scare(S.pos,32,9,true);if(n){P.stats.repels+=n;hud.feed('SHOCK PULSE · PREDATORS REPELLED','#a890ff','⚡');P.score+=40*n;}return;}
 if(!(P.inv.flare>0)){hud.feed('NO FLARES · PRINT MORE AT THE LIFEPOD','#ffb050','✦');snd.deny();return;}P.inv.flare--;snd.flare();const d=lookDir(_t);flare={pos:P.pos.clone().addScaledVector(d,1.2),vel:d.clone().multiplyScalar(9),t:14};flareMesh.visible=true;
 const n=life.scare(P.pos,36,9,true);if(n){P.stats.repels+=n;P.score+=30*n;hud.feed('PREDATORS SCATTER','#ffb050','✦');}}
function sonar(){if(G.app!=='play'||G.ui)return;if(sonarCD>0){snd.deny();return;}sonarCD=P.inSub?4:6;pingT=0;pingMat.uniforms.col.value.setRGB(.35,.95,1);pingMesh.position.copy(P.pos);snd.ping();pings.length=0;const R=P.inSub?160:95;
 for(const pk of world.pickups){if(!pk.alive)continue;const d=pk.pos.distanceTo(P.pos);if(d<R)pings.push({p:pk.pos,l:RES[pk.k].label,c:'#'+new THREE.Color(RES[pk.k].col).getHexString(),delay:d/50,res:1});}
 for(const c of life.creatures){const p=c.pos||c.g.position;const d=p.distanceTo(P.pos);if(d<R*1.4&&c.kind!=='jelly'&&c.kind!=='crab'||d<40)pings.push({p,l:P.scanned.has(c.kind)?SPECIES[c.kind].n:'UNKNOWN LIFEFORM',c:SPECIES[c.kind].danger?'#ff5a4a':'#e8fbff',delay:d/50,danger:SPECIES[c.kind].danger});}
 pings.forEach(p=>p.t=8+p.delay);if(pings.length>40){pings.sort((a,b)=>a.delay-b.delay);pings.length=40;}hud.feed(`SONAR · ${pings.filter(p=>p.res).length} DEPOSITS · ${pings.filter(p=>p.danger).length} HOSTILE`,'#56e8ff','◎');}
function dropBeacon(){if(G.app!=='play'||G.ui)return;if(beaconList.length>=4){hud.feed('ALL BEACONS PLACED · E TO PICK ONE UP','#ffd24a','◆');return;}const col=BCOL[beaconList.length%BCOL.length],g=new THREE.Group();
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,1.4,8),new THREE.MeshStandardMaterial({color:0x2a3a44,roughness:.4,metalness:.6}));pole.position.y=.7;g.add(pole);
 const l=new THREE.Mesh(new THREE.SphereGeometry(.22,14,10),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:4}));l.position.y=1.5;g.add(l);
 const y=Math.max(heightAt(P.pos.x,P.pos.z),P.pos.y-1.6);g.position.set(P.pos.x,y,P.pos.z);scene.add(g);const b={g,lamp:l,c:col,n:'BEACON '+(beaconList.length+1),d:Math.round(P.depth)};beaconList.push(b);snd.pick();hud.feed(`${b.n} · ${b.d} M`,col,'◆');}
function eat(){if(G.app!=='play')return;const k=P.inv.cookedfish>0?'cookedfish':P.inv.rawfish>0?'rawfish':null;if(!k){hud.feed('NO FOOD · CATCH FISH WITH E','#ffc04a','◗');snd.deny();return;}P.inv[k]--;const it=ITEMS[k];P.food=Math.min(100,P.food+it.food);P.water=cl(P.water+(it.water||0),0,100);P.stats.eaten++;snd.eat();hud.feed(`ATE ${it.n} +${it.food}`,'#ffc04a','◗');}
function drink(){if(G.app!=='play')return;const k=P.inv.flask>0?'flask':P.inv.bulb>0?'bulb':null;if(!k){hud.feed('NO WATER · BRINE BULBS OR THE POD STILL','#4ab0ff','●');snd.deny();return;}P.inv[k]--;const it=ITEMS[k];P.water=Math.min(100,P.water+it.water);P.food=Math.min(100,P.food+(it.food||0));snd.eat();hud.feed(`DRANK ${it.n} +${it.water}`,'#4ab0ff','●');}
function medkit(){if(G.app!=='play')return;if(!(P.inv.medkit>0)){hud.feed('NO MEDKIT','#ff6a6a','✚');snd.deny();return;}if(P.hp>=100){snd.deny();return;}P.inv.medkit--;P.hp=Math.min(100,P.hp+ITEMS.medkit.heal);snd.craft();hud.feed('MEDKIT +55','#ff6a6a','✚');}
function enterSub(){if(!S.built)return;P.inSub=true;S.yaw=P.yaw;S.pitch=cl(P.pitch,-1,1);snd.tone(300,.4,{type:'triangle',vol:.08,slide:2});hud.banner('MINNOW','Mouse steers · Space/C climb/dive · Shift boost · F shock pulse · E exit',3.4);}
function exitSub(forced){if(!P.inSub)return;P.inSub=false;P.yaw=S.yaw;P.pitch=S.pitch*.5;P.pos.copy(S.pos).add(new V(0,2.4,0));P.vel.set(0,1,0);if(!forced)snd.tone(500,.3,{type:'triangle',vol:.06,slide:.5});}

/* ================= lifepod printer ================= */
function canCraft(r){if(P.tools[r.id]&&!r.repeat)return false;if(r.needs&&!P.tools[r.needs])return false;for(const[k,n]of Object.entries(r.cost))if(have(k)<n)return false;return true;}
function craft(id){const r=RECIPES.find(x=>x.id===id);if(!r||G.ui!=='pod'||!canCraft(r)){snd.deny();return false;}for(const[k,n]of Object.entries(r.cost))take(k,n);P.stats.crafted++;snd.craft();
 if(r.repeat){if(id==='medkit')give('medkit');if(id==='flare')give('flare',3);P.score+=30;}
 else{P.tools[id]=true;P.score+=150;if(id==='tank')P.o2max=90*G.diff.o2;if(id==='tank2')P.o2max=150*G.diff.o2;if(id==='suit')P.rating=250;if(id==='jet')P.bat=100;
  if(id==='sub'){S.built=true;S.pos.copy(DOCK);S.vel.set(0,0,0);S.hull=100;S.power=100;S.yaw=0;subMesh.visible=true;hud.banner('MINNOW PRINTED','Docked under the lifepod. Swim down and press E to board.',4);}
  if(id==='beacon'){closePod();startWin();return true;}}
 P.o2=P.o2max;hud.feed(`PRINTED ${r.n}`,'#56e8ff','▣');objT=0;renderPod();return true;}
function openPod(){if(G.app!=='play')return;G.ui='pod';G.noPause=true;unlock();setTimeout(()=>G.noPause=false,200);$('pod').hidden=false;P.vel.set(0,0,0);snd.tone(420,.3,{type:'triangle',vol:.06,slide:1.5});
 renderPod();}
function closePod(){if(G.ui!=='pod')return;G.ui=null;$('pod').hidden=true;if(G.app==='play')lock();}
function renderPod(){if(G.ui!=='pod')return;const tier=P.tools.sub?3:P.tools.suit||P.tools.jet?2:1;
 $('recipes').innerHTML=RECIPES.map((r,i)=>{const done=P.tools[r.id]&&!r.repeat;const ok=canCraft(r);const cost=Object.entries(r.cost).map(([k,n])=>`<span class="${have(k)>=n?'ok':''}">${ITEMS[k].n} ${Math.min(have(k),n)}/${n}</span>`).join('');
  return `<div class="rc ${done?'done':''} ${r.id==='beacon'?'win':''}"><b>${i+1} · ${r.n}</b><p>${r.d}${r.needs&&!P.tools[r.needs]?' <span style="color:#ffb04a">Needs '+RECIPES.find(x=>x.id===r.needs).n+'.</span>':''}</p><div class="cost">${cost}</div><button data-id="${r.id}" ${ok?'':'disabled'}>${done?'PRINTED ✓':ok?'PRINT':'MISSING'}</button></div>`;}).join('');
 $('recipes').querySelectorAll('button[data-id]').forEach(b=>b.onclick=()=>craft(b.dataset.id));
 $('supplies').innerHTML=`<button id="pw">▮ TAKE FRESH WATER (${P.flasks} IN STILL)</button><button id="pc">◗ COOK ALL RAW FISH (${P.inv.rawfish||0})</button><button id="ps">⇩ STORE MATERIALS IN LOCKER</button><button id="pe">EAT / DRINK NOW (1 / 2)</button>`;
 $('pw').disabled=!P.flasks;$('pc').disabled=!P.inv.rawfish;$('pw').onclick=()=>{if(cargoN()>=CARRY){snd.deny();return;}give('flask',P.flasks);P.flasks=0;snd.pick();renderPod();};$('pc').onclick=()=>{give('cookedfish',P.inv.rawfish);P.inv.rawfish=0;snd.craft();renderPod();};
 $('ps').onclick=()=>{for(const k of['titanium','copper','quartz','fiber','lithium','gel','ember']){if(P.inv[k]){P.locker[k]=(P.locker[k]||0)+P.inv[k];P.inv[k]=0;}}snd.pick();renderPod();};$('pe').onclick=()=>{if(P.food<P.water)eat();else drink();renderPod();};
 $('cargo').innerHTML=invHTML(P.inv);$('locker').innerHTML=invHTML(P.locker);$('cargoN').textContent=cargoN()+'/'+CARRY;}
function openTablet(){if(G.ui)return;G.ui='tablet';$('tablet').hidden=false;const kinds=Object.keys(SPECIES);
 const sp=kinds.map(k=>P.scanned.has(k)?`<div class="s ${SPECIES[k].danger?'dg':''}"><b>${SPECIES[k].n}</b>${SPECIES[k].info}</div>`:`<div class="s no"><b>UNSCANNED</b>Hold Q / RMB on an unknown lifeform to scan it.</div>`).join('');
 const tl=Object.entries(P.tools).map(([k])=>RECIPES.find(r=>r.id===k).n).join(' · ')||'NONE YET';
 $('tabbody').innerHTML=`<div><p class="k">SPECIES ${P.scanned.size}/${kinds.length}</p><div class="sp">${sp}</div></div><div class="side"><p class="k">OBJECTIVE</p><div class="it">${G.obj?G.obj.title:''}</div><p class="k">GEAR</p><div class="it">${tl}</div><p class="k">CARGO ${cargoN()}/${CARRY}</p>${invHTML(P.inv)}<p class="k">LOCKER</p>${invHTML(P.locker)}<p class="k">DEEPEST</p><div class="it">${Math.round(P.maxD)} M</div></div>`;}
function closeTablet(){G.ui=null;$('tablet').hidden=true;}
$('podx').onclick=closePod;$('tabx').onclick=closeTablet;

/* ================= objectives ================= */
const SPOTS={kelp:new V(-115,-30,10),plat:new V(0,-90,165),pit:new V(-125,-150,-140),drop:new V(235,-380,20),pod:new V(0,-2,0)};
function nearestRes(k){let best=null,bd=1e9;for(const pk of world.pickups){if(!pk.alive||(RES[pk.k].as||pk.k)!==k)continue;const d=pk.pos.distanceToSquared(P.pos);if(d<bd){bd=d;best=pk;}}return best;}
function objective(){const T=P.tools;const chip=(k,n)=>({t:`${ITEMS[k].n} ${Math.min(have(k),n)}/${n}`,ok:have(k)>=n});
 const step=(id,n,title,where)=>{const r=RECIPES.find(x=>x.id===id);const chips=Object.entries(r.cost).map(([k,c])=>chip(k,c));const ready=chips.every(c=>c.ok);
  if(ready)return{key:id+'r',n,title:`Return to the lifepod and print the ${r.n}`,chips,target:{p:SPOTS.pod,l:'LIFEPOD',c:'#ff7a2a'}};
  const miss=Object.entries(r.cost).find(([k,c])=>have(k)<c)[0];let tgt=null;const w=where[miss];if(w)tgt={p:w,l:ITEMS[miss].n,c:ITEMS[miss].c};else{const pk=nearestRes(miss);if(pk&&pk.pos.distanceTo(P.pos)<140)tgt={p:pk.pos,l:ITEMS[miss].n,c:ITEMS[miss].c};}
  return{key:id+miss+chips.map(c=>c.t).join(),n,title,chips,target:tgt};};
 if(!T.knife)return step('knife','1/6','Gather TITANIUM from metal outcrops near the pod',{});
 if(!T.tank)return step('tank','2/6','Find QUARTZ crystals and print an O2 TANK',{});
 if(!T.suit)return step('suit','3/6','Cut KELP FIBER (west) and dig LITHIUM below 70 m (south)',{fiber:SPOTS.kelp,lithium:SPOTS.plat});
 if(!T.sub)return step('sub','4/6','Harvest LUMEN GEL in the glowing Lumen Hollow (north-west)',{gel:SPOTS.pit});
 return step('beacon',T.sub?'5/6':'5/6','Pilot the MINNOW down the Drop (east) for EMBERSTONE',{ember:SPOTS.drop});}
function tips(){const t=[];if(P.food<30)t.push('HUNGRY · catch fish with E, cook them at the pod');if(P.water<30)t.push('THIRSTY · pick brine bulbs or take water from the pod still');if(P.hp<40&&P.inv.medkit)t.push('Press 3 to use a medkit');if(cargoN()>=CARRY-2)t.push('Cargo almost full · store materials in the pod locker');
 if(!P.tools.jet&&P.tools.tank&&have('copper')<1&&!P.tools.sub)t.push('Tip: the HYDROJET (copper) makes long swims much faster');return G.tipT>0?G.tipMsg:t[0]||'';}

/* ================= scanning ================= */
function stepScan(dt){G.scanning=keys.KeyQ||mouse.r||(G.pad&&G.pad.scan);G.scanLab='';let tgt=null;const dir=lookDir(_t);
 if(G.scanning||true){let bd=1e9;for(const c of life.targets()){const v=_t2.copy(c.pos).sub(P.pos);const d=v.length();if(d>22+c.size*2)continue;const a=v.normalize().angleTo(dir);if(a<.16+Math.atan(c.size/Math.max(d,1))*.8&&d<bd){bd=d;tgt=c;}}}
 G.lookAt=tgt;
 if(!G.scanning||!tgt){scanT=Math.max(0,scanT-dt*3);G.scanP=scanT/2;if(tgt&&P.scanned.has(tgt.kind))G.scanLab=SPECIES[tgt.kind].n;vm.userData.beam.visible=false;return;}
 vm.userData.beam.visible=!P.inSub;if(P.scanned.has(tgt.kind)){G.scanLab=SPECIES[tgt.kind].n+' · ALREADY SCANNED';scanT=0;G.scanP=0;return;}
 const need=SPECIES[tgt.kind].pts>=300?2.6:1.6;scanT+=dt;G.scanP=Math.min(1,scanT/need);G.scanLab=`SCANNING · UNKNOWN LIFEFORM ${Math.round(G.scanP*100)}%`;if((G.time*8|0)%2===0&&((G.time-dt)*8|0)%2===1)snd.scanTick();
 if(scanT>=need){scanT=0;G.scanP=0;P.scanned.add(tgt.kind);const s=SPECIES[tgt.kind];P.score+=s.pts;P.stats.scans++;snd.scanDone();hud.banner(s.n,s.info,4.2,s.danger?'#ff8a6a':'#9af4ff');hud.feed(`SCANNED ${s.n} +${s.pts}`,'#9af4ff','◎');}}

/* ================= main step ================= */
const ghost={pos:new V(),depth:20,inSub:false,light:false};
function step(dt){G.time+=dt;U.uTime.value=G.time;if(G.hurtT>0)G.hurtT=Math.max(0,G.hurtT-dt*1.4);G.shake=Math.max(0,G.shake-dt*1.6);if(G.tipT>0)G.tipT-=dt;
 if(G.app==='menu'||G.app==='over'||G.app==='paused'){if(G.app!=='paused'){ghost.pos.copy(cam.position);ghost.depth=-cam.position.y;G.safe=true;life.step(dt,ghost,G);}bub.step(dt);return;}
 if(G.app==='win'){winStep(dt);life.step(dt,P,G);bub.step(dt);return;}
 // ---- play ----
 pollPad(dt);
 P.diveT-=dt;if(P.diveT<=0){P.diveT=0;end('time');return;}
 if(P.diveT<=60&&Math.floor(P.diveT)!==Math.floor(P.diveT+dt)&&Math.floor(P.diveT)%15===0){hud.banner(Math.floor(P.diveT)+' SECONDS','Rescue window closing',2.4,'#ff8a6a');snd.warn();}
 G.safe=G.ui==='pod';
 if(G.ui!=='pod'){if(P.inSub)stepSub(dt);else stepSwim(dt);}
 P.depth=-P.pos.y;P.under=P.pos.y<-.35;if(P.depth>P.maxD+.5){const m0=Math.floor(P.maxD/50);P.maxD=P.depth;if(Math.floor(P.maxD/50)>m0&&P.maxD>=50){P.score+=60;hud.feed(`NEW DEPTH RECORD ${Math.floor(P.maxD/50)*50} M`,'#56e8ff','▼');}}
 survival(dt);
 if(G.ui!=='pod')stepScan(dt);else{G.scanP=0;G.scanLab='';}
 candidates();
 life.step(dt,P,G);
 // flare
 if(flare){flare.t-=dt;flare.vel.multiplyScalar(Math.exp(-dt*2.2));flare.vel.y-=dt*.6;flare.pos.addScaledVector(flare.vel,dt);const fy=heightAt(flare.pos.x,flare.pos.z)+.15;if(flare.pos.y<fy)flare.pos.y=fy;flareMesh.position.copy(flare.pos);if(Math.random()<dt*20)bub.emit(flare.pos.x,flare.pos.y,flare.pos.z,1,.1,.6);
  if(flare.t<=0){flare=null;flareMesh.visible=false;}}
 if(sonarCD>0)sonarCD-=dt;if(S.pulseCD>0)S.pulseCD-=dt;if(swingCD>0)swingCD-=dt;if(swingT>0)swingT-=dt;
 // pod water still
 stillT+=dt;if(stillT>70){stillT=0;if(P.flasks<3)P.flasks++;}
 // breathing bubbles
 if(P.under&&!P.inSub&&G.ui!=='pod'){breathT-=dt;if(breathT<=0){breathT=2.8+Math.random();const f=lookDir(_t);bub.emit(P.pos.x+f.x*.55,P.pos.y-.32,P.pos.z+f.z*.55,6,.1,.32);snd.breath();}}
 bub.step(dt);
 objT-=dt;if(objT<=0){objT=.5;G.obj=objective();G.tip=tips();G.loc=region(P.pos.x,P.pos.z,P.depth);
  G.compassMarks=[{x:0,z:0,c:'#ff7a2a',l:'▼POD'}];if(S.built&&!P.inSub)G.compassMarks.push({x:S.pos.x,z:S.pos.z,c:'#56e8ff',l:'▼SUB'});for(const b of beaconList)G.compassMarks.push({x:b.g.position.x,z:b.g.position.z,c:b.c,l:'◆'});if(G.obj&&G.obj.target&&G.obj.target.l!=='LIFEPOD')G.compassMarks.push({x:G.obj.target.p.x,z:G.obj.target.p.z,c:G.obj.target.c,l:'◇'});}
 // auto light when it gets dark
 if(P.depth>55&&!P.light&&!P.lightAuto){P.light=true;P.lightAuto=true;hud.feed('HEADLAMP ON · L TO TOGGLE','#eaf6ff','☀');}
 snd.jet(G.jetOn?(P.inSub?2:1):0);}
function stepSwim(dt){const k=keys,pd=G.pad||{};const fw=cl((k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0)+(pd.my||0),-1,1),st=cl((k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0)+(pd.mx||0),-1,1),up=(k.Space||pd.up?1:0)-(k.KeyC||k.ControlLeft||pd.dn?1:0);
 const moving=fw||st||up;const shift=(k.ShiftLeft||k.ShiftRight||pd.boost)&&moving;const jet=shift&&P.tools.jet&&P.bat>0;G.jetOn=jet;G.sprint=shift&&!jet;
 const f=lookDir(_f),r=_r.set(1,0,0).applyEuler(_e.set(0,P.yaw,0));const want=_t.set(0,0,0).addScaledVector(f,fw).addScaledVector(r,st);want.y+=up;if(want.lengthSq()>1)want.normalize();
 let sp=4.3*(P.tools.fins?1.25:1);if(jet){sp=11.5;P.bat=Math.max(0,P.bat-dt*.72);if(P.bat===0)hud.feed('HYDROJET FLAT · RECHARGE AT THE POD','#ffe04a','⚡');if(Math.random()<dt*16){const b=_t2.copy(P.pos).addScaledVector(f,-.4);bub.emit(b.x,b.y-.3,b.z,1,.3,.7);}}else if(G.sprint)sp*=1.4;
 const surf=P.pos.y>-.6;if(surf&&want.y>0&&P.pos.y>-.4)want.y=0;
 P.vel.lerp(want.multiplyScalar(sp),Math.min(1,dt*(jet?2.4:2.6)));if(!moving)P.vel.y+=(surf?(-.2-P.pos.y)*2:-.08)*dt;
 P.pos.addScaledVector(P.vel,dt);collide(P.pos,P.vel,.9,.35);}
function stepSub(dt){const k=keys,pd=G.pad||{};const fw=cl((k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0)+(pd.my||0),-1,1),st=cl((k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0)+(pd.mx||0),-1,1),up=(k.Space||pd.up?1:0)-(k.KeyC||k.ControlLeft||pd.dn?1:0);
 const boost=(k.ShiftLeft||k.ShiftRight||pd.boost)&&fw>0&&S.power>5;G.jetOn=!!(fw||st||up);const f=lookDir(_f),r=_r.set(1,0,0).applyEuler(_e.set(0,S.yaw,0));
 const want=_t.set(0,0,0).addScaledVector(f,fw).addScaledVector(r,st*.6);want.y+=up*.8;if(want.lengthSq()>1)want.normalize();const sp=S.power>0?(boost?19:12.5):2;
 S.vel.lerp(want.multiplyScalar(sp),Math.min(1,dt*1.25));S.pos.addScaledVector(S.vel,dt);collide(S.pos,S.vel,2,1.6,true);
 S.power=Math.max(0,S.power-dt*(.12+(fw||st||up?.28:0)+(boost?.5:0)+(P.light?.05:0)));if(S.power===0&&!S.flatWarn){S.flatWarn=1;hud.banner('MINNOW POWER DEPLETED','Crawl home to the dock under the lifepod',3.5,'#ffe04a');}if(S.power>5)S.flatWarn=0;
 S.roll=lerp(S.roll,-st*.18-(G.pad?G.pad.lx*.1:0),dt*3);P.pos.copy(S.pos);P.vel.copy(S.vel);
 if(Math.random()<dt*(fw?18:4)){const b=_t2.copy(S.pos).addScaledVector(f,-2.6);bub.emit(b.x-1.5*Math.cos(S.yaw),b.y-.3,b.z+1.5*Math.sin(S.yaw),1,.3,1);bub.emit(b.x+1.5*Math.cos(S.yaw),b.y-.3,b.z-1.5*Math.sin(S.yaw),1,.3,1);}}
function collide(p,v,r,top,isSub){const fy=heightAt(p.x,p.z)+r;if(p.y<fy){p.y=fy;if(v.y<0)v.y=0;}if(p.y>top&&!isSub&&p.y>.35){p.y=.35;if(v.y>0)v.y=0;}if(isSub&&p.y>-top){p.y=-top;if(v.y>0)v.y=0;}
 const L=WORLD-6;if(Math.abs(p.x)>L||Math.abs(p.z)>L){p.x=cl(p.x,-L,L);p.z=cl(p.z,-L,L);}
 for(const c of world.cols){const dx=p.x-c.x,dz=p.z-c.z,d=Math.hypot(dx,dz),rr=c.r+r*.7;if(d<rr&&p.y>c.y0&&p.y<c.y1){p.x=c.x+dx/d*rr;p.z=c.z+dz/d*rr;}}
 for(const b of world.balls){const dx=p.x-b.x,dz=p.z-b.z;if(Math.abs(dx)>b.r+3||Math.abs(dz)>b.r+3)continue;const dy=(p.y-b.y)*b.r/b.ry,d=Math.hypot(dx,dy,dz),rr=b.r+r*.6;if(d<rr&&d>1e-3){const k=rr/d;p.x=b.x+dx*k;p.z=b.z+dz*k;p.y=b.y+dy*k*b.ry/b.r;}}
 {const dx=p.x,dz=p.z,d=Math.hypot(dx,dz),rr=3.2+r*.6;if(d<rr&&p.y>-3.7-r*.5&&p.y<1.5&&d>1e-3){p.x=dx/d*rr;p.z=dz/d*rr;}}
 if(S.built&&!isSub){const d=p.distanceTo(S.pos);if(d<2.6&&d>1e-3){p.sub(S.pos).setLength(2.6).add(S.pos);}}}
function survival(dt){const D=G.diff,inPod=G.ui==='pod';
 P.food=Math.max(0,P.food-dt*(100/430)*D.drain*(inPod?.5:1));P.water=Math.max(0,P.water-dt*(100/330)*D.drain*(inPod?.5:1));
 const docked=S.built&&S.pos.distanceTo(DOCK)<9;if(docked){S.power=Math.min(100,S.power+dt*6);S.hull=Math.min(100,S.hull+dt*3);}
 const surfaced=P.pos.y>-.45;
 if(inPod||P.inSub||surfaced){P.o2=Math.min(P.o2max,P.o2+dt*(inPod?60:28));lowO2T=0;}
 else{P.o2-=dt*(G.sprint?1.6*(P.tools.fins?.75:1):1);if(P.o2<=0){P.o2=0;G.hurt(9*dt,'O2');}}
 if(inPod){P.bat=Math.min(100,P.bat+dt*12);P.hp=Math.min(100,P.hp+dt*3);}
 const o2p=P.o2/P.o2max;if(!surfaced&&!P.inSub&&!inPod&&o2p<.25){lowO2T-=dt;if(lowO2T<=0){lowO2T=1.2;snd.heart();if(o2p<.25&&o2p>.2)hud.banner('OXYGEN LOW','Surface or reach the lifepod',2.2,'#ff8a6a');}}
 const rate=P.inSub?500:P.rating;if(P.depth>rate){const ex=(P.depth-rate)/40;if(P.inSub){S.hull-=dt*4*(1+ex);if(S.hull<=0){S.hull=0;subLost();}}else G.hurt(dt*7*(1+ex),'CRUSH');crushWarn-=dt;if(crushWarn<=0){crushWarn=2;snd.warn();hud.alert('CRUSH DEPTH',(P.inSub?'HULL':'SUIT')+' RATED '+rate+' M · ASCEND',2);}}
 if(P.food<=0)G.hurt(dt*.7,'STARVATION');if(P.water<=0)G.hurt(dt*.9,'DEHYDRATION');
 if(P.food>20&&P.water>20&&P.o2>0&&G.time-P.lastHurt>6&&P.depth<=rate)P.hp=Math.min(100,P.hp+dt*1.4);}
function candidates(){G.cand=null;let txt='';if(G.ui)return hud.prompt('');const dir=lookDir(_t);
 if(P.inSub){G.cand={t:'exit'};const docked=S.pos.distanceTo(DOCK)<9;hud.prompt(docked?'<b>E</b>EXIT · DOCKED, RECHARGING':'');return;}
 const dSub=S.built?P.pos.distanceTo(S.pos):1e9,dPod=P.pos.distanceTo(HATCH);
 if(dSub<4.8&&dSub<dPod){G.cand={t:'sub'};return hud.prompt('<b>E</b>BOARD THE MINNOW');}
 if(dPod<6||(P.pos.y>-1.2&&Math.hypot(P.pos.x,P.pos.z)<5.5)){G.cand={t:'pod'};return hud.prompt('<b>E</b>ENTER LIFEPOD · PRINT · REFILL');}
 const bn=beaconList.find(b=>b.g.position.distanceTo(P.pos)<3);if(bn){G.cand={t:'beacon',b:bn};return hud.prompt('<b>E</b>PICK UP '+bn.n);}
 let best=null,bd=9;for(const pk of world.pickups){if(!pk.alive)continue;const v=_t2.copy(pk.pos).sub(P.pos);const d2=v.lengthSq();if(d2>12)continue;const d=Math.sqrt(d2);const dot=v.normalize().dot(dir);const sc=d*(1.6-dot);if((dot>.35||d<1.7)&&sc<bd){bd=sc;best=pk;}}
 if(best){G.cand={t:'res',pk:best};return hud.prompt(`<b>E</b>${RES[best.k].label}${RES[best.k].as?' · TITANIUM':''}`);}
 for(const kp of world.kelp){if(kp.cd>G.time)continue;const dx=P.pos.x-kp.x,dz=P.pos.z-kp.z;if(dx*dx+dz*dz<4.8&&P.pos.y>kp.y&&P.pos.y<kp.y+kp.h){G.cand={t:'kelp',k:kp};return hud.prompt(P.tools.knife?'<b>E</b>CUT KELP FIBER':'<b>E</b>KELP · NEEDS A KNIFE');}}
 for(const s of life.schools){if(s.dist>12||!SPECIES[s.kind].edible)continue;for(const f of s.f){if(f.gone)continue;const v=_t2.copy(f.p).sub(P.pos);const d=v.length();if(d<2.6&&v.normalize().dot(dir)>.5){G.cand={t:'fish'};return hud.prompt('<b>E</b>CATCH '+SPECIES[s.kind].n);}}}
 hud.prompt('');}

/* ================= win cinematic ================= */
function startWin(){G.app='win';G.winT=0;$('hud').classList.add('cine');rocket.visible=true;rocket.position.set(0,1.6,0);hud.banner('DISTRESS BEACON AWAY','Signal locked · rescue inbound',6,'#ffb050');snd.flare();snd.pulse();P.inSub=false;unlock();}
function winStep(dt){G.winT+=dt;const t=G.winT;const y=t<1?1.6:1.6+Math.pow(t-1,2)*7;rocket.position.y=y;rocket.rotation.z=Math.sin(t*3)*.02;rocket.userData.light.intensity=t>.6?120:0;rocket.userData.flame.scale.setScalar(t>.6?1+Math.sin(t*40)*.15:0);
 if(y<0)bub.emit(0,y-2,0,3,.4,1.4);if(t>6.5)end('win');}

/* ================= flow ================= */
function start(){$('hud').classList.remove('cine');G.diff=DIFFS[G.opt.diff]||DIFFS[1];life.diff=G.diff;reset();P.o2=P.o2max=45*G.diff.o2;G.app='play';G.ui=null;$('pod').hidden=true;$('tablet').hidden=true;$('menu').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');
 snd.init();snd.setVol(G.opt.vol);lock();G.obj=objective();objT=0;hud.last={};hud.banner('THE HALCYON IS GONE','You survived the crash. Gather, print gear at the lifepod, and launch a distress beacon within 15 minutes.',6);}
function pause(on){if(on){if(G.app!=='play')return;G.app='paused';unlock();$('pause').hidden=false;document.body.classList.remove('playing');snd.jet(0);}else{if(G.app!=='paused')return;G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}
function toMenu(){G.app='menu';G.ui=null;unlock();['hud','pause','over','pod','tablet'].forEach(i=>$(i).hidden=true);$('menu').hidden=false;$('keys').hidden=false;document.body.classList.remove('playing');updateBest();snd.jet(0);}
let lastAward=null;
function end(reason){if(G.app!=='play'&&G.app!=='win')return;const won=reason==='win';G.app='over';G.ui=null;unlock();['hud','pod','tablet','pause'].forEach(i=>$(i).hidden=true);document.body.classList.remove('playing');snd.jet(0);
 const timeBonus=won?Math.round(P.diveT*3):0;const score=Math.round(P.score+P.maxD*2+(won?3000+timeBonus:0));G.result={reason,won,score};G.overT=0;
 $('oeye').textContent=`DIVE LOG · ${G.diff.n} · 15-MINUTE WINDOW`;$('ores').textContent=won?'RESCUED':reason==='time'?'STRANDED':'LOST AT SEA';$('ores').style.color=won?'#ffb050':reason==='time'?'#9af4ff':'#ff6a5a';
 $('ocause').textContent=won?`Beacon launched with ${mmss(P.diveT)} to spare · +${3000+timeBonus} rescue bonus`:reason==='time'?'The rescue window closed before a beacon was launched.':`Killed by ${({O2:'drowning',CRUSH:'crush depth',STARVATION:'starvation',DEHYDRATION:'dehydration'})[P.deathBy]||P.deathBy.toLowerCase()} at ${Math.round(P.depth)} m.`;
 $('ofs').textContent=score.toLocaleString()+' PTS';const st=P.stats;
 const cells=[['DEEPEST',Math.round(P.maxD)+' M'],['SPECIES',P.scanned.size+'/'+Object.keys(SPECIES).length],['GEAR PRINTED',Object.keys(P.tools).length+'/8'],['GATHERED',st.gathered],['FISH CAUGHT',st.fish],['TIME',mmss(DIVE-P.diveT)]];
 $('mystats').innerHTML=cells.map(c=>`<div><b>${c[1]}</b><span>${c[0]}</span></div>`).join('');const tok=awardTokens(score,won);$('otok').textContent=`+${tok} TOKENS · BEST ${best().toLocaleString()} PTS`;$('over').hidden=false;}
function awardTokens(pts,won){lastAward={pts,won,depth:Math.round(P.maxD),species:P.scanned.size,diff:G.diff.n,reason:G.result.reason};const tok=5+Math.min(60,pts/150|0);
 addRound(tok,won);saveBest('abyss3d',pts);return tok;}
function best(){return bestScore('abyss3d');}
function updateBest(){const b=best();$('best').textContent=b?'BEST · '+b.toLocaleString()+' PTS':'';}

/* ================= visuals ================= */
const FOGS=[[0,new THREE.Color(.1,.55,.66)],[30,new THREE.Color(.05,.36,.52)],[90,new THREE.Color(.02,.16,.3)],[180,new THREE.Color(.01,.065,.14)],[320,new THREE.Color(.006,.032,.07)],[999,new THREE.Color(.005,.026,.058)]];
const fc=new THREE.Color(),c2=new THREE.Color(),KELPC=new THREE.Color(.06,.42,.36),PITC=new THREE.Color(.05,.04,.16),SKYC=new THREE.Color(.62,.8,.92);
function fogAt(d,out){if(d<=0)return out.copy(FOGS[0][1]);for(let i=1;i<FOGS.length;i++)if(d<FOGS[i][0]){const a=FOGS[i-1],b=FOGS[i];return out.copy(a[1]).lerp(b[1],(d-a[0])/(b[0]-a[0]));}return out.copy(FOGS[FOGS.length-1][1]);}
let menuA=0;
function placeCamera(dt){if(G.app==='menu'){menuA+=dt*.03;const a=menuA+2.2;const cx=52+Math.cos(a)*30,cz=-50+Math.sin(a)*30;const fy=Math.max(heightAt(cx,cz),heightAt(cx+4,cz),heightAt(cx,cz+4));cam.position.set(cx,Math.min(fy+10,-5)+Math.sin(a*1.7)*.8,cz);
  const lx=52+Math.cos(a+1.3)*10,lz=-50+Math.sin(a+1.3)*10;cam.lookAt(lx,Math.min(heightAt(lx,lz)+3,-6),lz);cam.rotation.z+=Math.sin(a*1.3)*.02;return;}
 if(G.app==='over'){G.overT=(G.overT||0)+dt;const a=G.overT*.06;const c=G.result&&G.result.won?new V(0,-2,0):P.pos;cam.position.set(c.x+Math.cos(a)*14,Math.min(c.y+3,-1.5),c.z+Math.sin(a)*14);cam.lookAt(c.x,c.y,c.z);return;}
 if(G.app==='win'){const t=G.winT;cam.position.set(16,1.8,22);cam.lookAt(0,Math.max(4,rocket.position.y*.85),0);return;}
 const sh=G.shake*G.shake*.15;
 if(P.inSub){const f=lookDir(_t);cam.position.copy(S.pos).addScaledVector(f,1.2);cam.position.y+=.25;cam.rotation.set(S.pitch+(Math.random()-.5)*sh,S.yaw+(Math.random()-.5)*sh,S.roll);return;}
 const sp=P.vel.length();const bob=Math.sin(G.time*2.2)*.05*(P.under?1:2);cam.position.copy(P.pos);cam.position.y+=bob;cam.rotation.set(P.pitch+(Math.random()-.5)*sh,P.yaw+(Math.random()-.5)*sh,Math.sin(G.time*.9)*.012+(Math.random()-.5)*sh*.5);}
function visuals(dt){placeCamera(dt);world.cull(cam,cam.position.y<-60?115:140);(world.meshes.grass||[]).forEach(g=>{if(g.userData.off)g.visible=false;});const cy=cam.position.y,d=-cy,under=cy<-.05;U.uCamY.value=cy;
 const w=weights(cam.position.x,cam.position.z);fogAt(d,fc);fc.lerp(c2.copy(KELPC).multiplyScalar(fc.g/.42),w.kelp*sm(5,60,d)*.35);fc.lerp(c2.copy(PITC),w.pit*sm(60,160,d)*.5);
 if(under){scene.fog.color.copy(fc);scene.fog.near=lerp(.0155,.024,sm(0,160,d));scene.fog.far=1;}else{scene.fog.color.copy(SKYC);scene.fog.near=.0028;scene.fog.far=0;}
 dome.visible=under;sky.visible=!under;dome.material.uniforms.fc.value.copy(fc);dome.position.copy(cam.position);RR.setClearColor(under?fc:SKYC);
 surf.material.uniforms.fc.value.copy(fogAt(Math.max(0,d),c2));surf.material.uniforms.dens.value=scene.fog.near;surf.position.set(Math.round(cam.position.x/10)*10,0,Math.round(cam.position.z/10)*10);
 const sunI=under?Math.exp(-d/62):1;U.uSun.value=under?sunI:1;sun.intensity=1.7*sunI+.02;hemi.intensity=.22+.56*sunI;hemi.color.setRGB(.55+.3*sunI,.85,1);hemi.groundColor.copy(fc).multiplyScalar(.9).lerp(c2.setRGB(.02,.12,.14),sm(150,350,d)*.6);
 rays.userData.update(cam);rays.userData.mat.uniforms.uI.value=under?Math.exp(-d/34):0;rays.visible=under&&d<160;
 snow.material.uniforms.uCam.value.copy(cam.position);snow.material.uniforms.uCol.value.copy(fc).multiplyScalar(1+sunI);snow.material.uniforms.uLamp.value=lamp.intensity>0?1:0;snow.visible=under;
 const pu=plankton.userData.u;pu.uCam.value.copy(cam.position);const spd=P.inSub?S.vel.length():P.vel.length();pu.uStir.value+=((G.app==='play'?Math.min(1,spd/6):.3)-pu.uStir.value)*Math.min(1,dt*3);pu.uDeep.value=under?cl((d-40)/60,0,1):0;
 // lights
 const lampOn=G.app==='play'&&under&&(P.light||P.inSub&&d>30)&&G.ui!=='pod';lamp.intensity=lampOn?(P.inSub?22:14):0;lamp.angle=P.inSub?.6:.46;lamp.distance=P.inSub?90:65;lamp.decay=P.inSub?1.25:1.1;
 flareL.intensity=flare?70*Math.min(1,flare.t/3):0;if(flare)flareL.position.copy(flare.pos);
 const vs=world.vents.map(v=>[v,v.distanceToSquared(cam.position)]).sort((a,b)=>a[1]-b[1]);ventL.forEach((l,i)=>{const v=vs[i];if(v&&v[1]<90*90){l.position.copy(v[0]);l.position.y+=1.5;l.intensity=26*(.85+.15*Math.sin(G.time*7+i*3));}else l.intensity=0;});
 if(Math.random()<dt*30){for(const v of vs.slice(0,3))if(v[1]<120*120)bub.emit(v[0].x+(Math.random()-.5),v[0].y,v[0].z+(Math.random()-.5),1,.6,1.3);}
 // pod + sub animation
 pod.position.y=Math.sin(G.time*.8)*.18;pod.rotation.z=Math.sin(G.time*.6)*.025;pod.rotation.x=Math.cos(G.time*.5)*.02;const pu2=pod.userData;pu2.beacon.visible=Math.sin(G.time*3)>0;pu2.lamps.forEach((l,i)=>l.material.emissiveIntensity=2+1.5*Math.sin(G.time*2+i));pu2.bl.intensity=under&&d<60?14:4;
 if(S.built){subMesh.visible=!P.inSub||G.app!=='play';subMesh.position.copy(S.pos);subMesh.rotation.set(-S.pitch*.7,S.yaw+Math.PI,0,'YXZ');subMesh.rotation.z=S.roll;subMesh.userData.rings.forEach(r=>r.material.emissiveIntensity=2+(G.jetOn&&P.inSub?2:0)+Math.sin(G.time*6));
  if(!P.inSub&&S.pos.distanceTo(DOCK)<9){S.pos.lerp(DOCK,dt*.5);S.yaw=lerp(S.yaw,0,dt*.5);}}
 cockpit.visible=!!(P.inSub&&G.app==="play");
 // viewmodel
 const showVM=G.app==='play'&&!P.inSub&&G.ui!=='pod';vm.visible=showVM;if(showVM){const u=vm.userData;const t=G.time,mv=Math.min(1,P.vel.length()/5);u.R.position.set(.26+Math.sin(t*2.2)*.008*mv,-.24+Math.sin(t*4.4)*.006*mv+(G.scanning?.04:0),-.48+(G.scanning?-.05:0));u.R.rotation.set(G.scanning?.12:0,0,0);
  u.scr.material.emissiveIntensity=G.scanning?2.6+Math.sin(t*20):1.4;u.beam.material.opacity=.08+.05*Math.sin(t*30);
  const sw=swingT>0?1-swingT/.36:0;u.L.visible=!!P.tools.knife&&swingT>0;if(u.L.visible){u.L.position.set(-.3+Math.sin(sw*Math.PI)*.42,-.28+Math.sin(sw*Math.PI)*.12,-.5-Math.sin(sw*Math.PI)*.18);u.L.rotation.set(-.3,Math.sin(sw*Math.PI)*.8-.4,-Math.sin(sw*Math.PI)*1.1);}
  u.jet.visible=!!G.jetOn;G.scanShow=G.scanning?Math.min(1,(G.scanShow||0)+dt*5):Math.max(0,(G.scanShow||0)-dt*4);u.R.visible=!G.jetOn&&G.scanShow>0;u.R.position.y-=(1-G.scanShow)*.25;if(G.jetOn)u.prop.rotation.z+=dt*40;}
 // markers + ping
 drawMarks(dt);
 for(const b of beaconList)b.lamp.material.emissiveIntensity=2.5+2*Math.sin(G.time*4);
 snd.update(dt,Math.max(0,d),under,G.app==='play');}
function drawMarks(dt){if(pingT>=0){pingT+=dt;const r=pingT*50;pingMesh.visible=pingT<2.6;pingMesh.scale.setScalar(Math.max(.1,r));pingMat.uniforms.uA.value=Math.max(0,1-pingT/2.6)*.9;if(pingT>2.6)pingT=-1;}
 if(G.app!=='play'||G.ui){$('marks').innerHTML='';return;}let h='';
 for(const p of pings){p.t-=dt;if(p.t<=0||p.t>8)continue;h+=hud.marker(cam,p.p,p.l,p.c,Math.round(p.p.distanceTo(P.pos))+' M',Math.min(1,p.t/1.5));}
 for(const b of beaconList)h+=hud.marker(cam,_t.copy(b.g.position).setY(b.g.position.y+2),b.n,b.c,Math.round(b.g.position.distanceTo(P.pos))+' M · '+b.d+' M DEEP');
 const pd=Math.hypot(P.pos.x,P.pos.z,P.pos.y+2);if(pd>16)h+=hud.marker(cam,_t.set(0,3.5,0),'LIFEPOD','#ff7a2a',Math.round(pd)+' M',pd>120?.5:.9);
 if(S.built&&!P.inSub){const sd=S.pos.distanceTo(P.pos);if(sd>10)h+=hud.marker(cam,_t.copy(S.pos).setY(S.pos.y+2.5),'MINNOW','#56e8ff',Math.round(sd)+' M');}
 const o=G.obj;if(o&&o.target&&o.target.l!=='LIFEPOD'){const td=o.target.p.distanceTo(P.pos);if(td>8)h+=hud.marker(cam,o.target.p,o.target.l,o.target.c,Math.round(td)+' M',.85);}
 if(G.lookAt&&G.lookAt.kind==='maw'||life.maw.state==='charge'&&life.maw.pos.distanceTo(P.pos)<80){h+=hud.marker(cam,life.maw.pos,'!','#ff4a3a',Math.round(life.maw.pos.distanceTo(P.pos))+' M');}
 $('marks').innerHTML=h;}

/* ================= rendering ================= */
let gfx=quality(),fxStack=null,fxSize='',lens=null;
function applyQuality(q){gfx=q;RR.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.8));fxStack=null;fxSize='';(world.meshes.grass||[]).forEach(g=>g.userData.off=q<1);snow.material.uniforms.uA.value=q>=1?1:.7;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(RR.domElement.width!==Math.floor(w*RR.getPixelRatio())||RR.domElement.height!==Math.floor(h*RR.getPixelRatio()))RR.setSize(w,h,false);
 cam.aspect=w/h;cam.fov=w/h<1?84:72;cam.updateProjectionMatrix();const sc=h*RR.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));snow.material.uniforms.uScale.value=sc;bub.mat.uniforms.uScale.value=sc;
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(RR,scene,cam,{exposure:.95,bloom:.6,bloomThreshold:.85,bloomRadius:.55,saturation:1.08,vignette:.32,grain:.03,aoStrength:.45,quality:gfx});lens=null;if(fxStack.composer){lens=new ShaderPass(LensShader);if(fxStack.ao){/* keep billboards, particles and glass out of the ambient-occlusion depth/normal pass */const fxl=[];scene.traverse(o=>{if(o.isPoints||o.material&&(o.material.isShaderMaterial||o.material.transparent))fxl.push(o);});
   const hide=new Pass(),show=new Pass();hide.needsSwap=show.needsSwap=false;hide.render=()=>{for(const o of fxl){o.userData._v=o.visible;o.visible=false;}};show.render=()=>{for(const o of fxl)if(o.userData._v!==undefined){o.visible=o.userData._v;delete o.userData._v;}};
   fxStack.composer.insertPass(hide,1);fxStack.composer.insertPass(show,3);fxStack.composer.insertPass(lens,4);}else fxStack.composer.insertPass(lens,1);}fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(lens){const u=lens.uniforms;u.uTime.value=G.time;u.uAmt.value=cam.position.y<0?1:0;u.uHurt.value=Math.min(1,G.hurtT);u.uVisor.value=G.app==='play'&&!P.inSub?1:.25;}
 if(fxStack.grade){const hp=G.app==='play'?Math.min(1,P.hp/60):1;fxStack.grade.uniforms.sat.value=1.08*(.4+.6*hp);}
 fxStack.render();}

/* ================= menus ================= */
const seg=(id,key,cb)=>{const el=$(id);const set=(v,init)=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===+v));if(!init){try{localStorage.setItem('abyss_opt',JSON.stringify(G.opt));}catch(e){}cb&&cb(v);}};set(G.opt[key],true);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(+b.dataset.v));};
seg('o-diff','diff',v=>{$('dhint').textContent=DIFFS[v].hint;});seg('o-vol','vol',v=>{snd.init();snd.setVol(v);});seg('o-sens','sens');$('dhint').textContent=DIFFS[G.opt.diff].hint;
$('go').onclick=start;$('again').onclick=start;$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{G.app='over';toMenu();};
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Abyss Diver\nScore: ${a.pts||0}\nResult: ${a.won?'rescued':a.reason==='time'?'stranded (time up)':'lost at sea'}\nDeepest: ${a.depth||0}m\nSpecies: ${a.species||0}/${Object.keys(SPECIES).length}\nMode: ${a.diff||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore('abyss3d',a.pts||0,body);};
updateBest();

/* ================= loop ================= */
function frame(dt){step(dt);visuals(dt);if(G.app==='play'||G.app==='paused'){if(G.app==='play')hud.update(G,P,S,dt);}render();}
$('loading').classList.add('done');
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;if(!G.noLoop){try{frame(dt);}catch(e){console.error(e);}}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.ABYSS={get state(){return G.app;},get app(){return G.app;},get ui(){return G.ui;},G,P,S,life,world,scene,cam,R:RR,hud,snd,keys,mouse,pod,
 get creatures(){return life.creatures;},get schools(){return life.schools;},get nodes(){return world.pickups;},get pickups(){return world.pickups;},beaconList,pings,
 plU:plankton.userData.u,heightAt,region,step,visuals,render:()=>render(),frame(dt=1/60){frame(dt);},manual(v=true){G.noLoop=v;},
 start,end,toMenu,pause,use,flare:doFlare,sonar,dropBeacon,openPda:openTablet,openTablet,closeTablet,openPod,closePod,craft,swipe,eat,drink,medkit,enterSub,exitSub,
 bank(){openPod();P.o2=P.o2max;closePod();},emitBubbles(n=5,s=.12){bub.emit(P.pos.x,P.pos.y-.2,P.pos.z,n,s,1);},stepBubbles:dt=>bub.step(dt),drawMarks,
 give(k,n=1){give(k,n);},tool(id){P.tools[id]=true;if(id==='tank')P.o2max=90;if(id==='suit')P.rating=250;if(id==='sub'){S.built=true;S.pos.copy(DOCK);subMesh.visible=true;}},
 teleport(x,y,z){P.pos.set(x,y,z);P.vel.set(0,0,0);if(P.inSub)S.pos.set(x,y,z);},look(yaw,pitch){P.yaw=yaw;P.pitch=pitch;S.yaw=yaw;S.pitch=pitch;},setClock(s){P.diveT=s;},god(v=true){G.god=v;},setQuality:applyQuality,get gfx(){return gfx;},
 get objective(){return G.obj;},get cand(){return G.cand;},scan(kind){P.scanned.add(kind);}};
