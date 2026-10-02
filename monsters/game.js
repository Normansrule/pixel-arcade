// BLOCK BEASTS — main: island exploration, wild beasts, trainers, turn-based in-world battles, UI, saves.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import * as W from './world.js';
import {SPECIES,MOVES,TCOL,ITEMS,RECIPES,TOWERS,ROAMERS,STARTERS,HABITAT,MATS,eff,xpFor} from './data.js';
import {makeCreature,animate,makeHuman,animHuman,makeCube,template} from './models.js';
import {Battle,mkMon,stats,maxHp,nameOf,STATUS_N,setUid} from './battle.js';
import {Particles,Ring,iconSprite,PAL} from './fx.js';
import {Sound} from './sound.js';

const $=id=>document.getElementById(id);
const V3=THREE.Vector3;
const snd=new Sound();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const rnd=(a,b)=>a+Math.random()*(b-a);
const mmss=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};

/* ================= renderer / scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.25));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(62,1,.08,520);scene.add(cam);
W.attach(scene);const SKY=W.makeSky(scene,R);
const PARTS=new Particles(scene);const RING=new Ring(scene);
let gfx=quality(),fx=null;
const POST={exposure:.8,bloom:.5,bloomThreshold:1.7,bloomRadius:.4,vignette:.32,saturation:1.18,aoStrength:.75,grain:.02};
function resize(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();fx&&fx.setSize(innerWidth,innerHeight);}
function applyQuality(q){gfx=q;W.setRD(q===0?4:5);SKY.sun.castShadow=q>0;SKY.sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(SKY.sun.shadow.map){SKY.sun.shadow.map.dispose();SKY.sun.shadow.map=null;}fx=cinematic(R,scene,cam,{...POST,quality:q});resize();}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));addEventListener('resize',resize);
const LL=[];for(let i=0;i<4;i++){const l=new THREE.PointLight(0xffb060,0,16,1.5);scene.add(l);LL.push(l);}

/* ================= portraits (rendered once per species) ================= */
const PORT={};let pR=null,pS=null,pC=null;
function portrait(id,sil){const k=id;if(PORT[k])return PORT[k];
 if(!pR){const c=document.createElement('canvas');c.width=c.height=128;pR=new THREE.WebGLRenderer({canvas:c,alpha:true,preserveDrawingBuffer:true,antialias:true});pR.outputColorSpace=THREE.SRGBColorSpace;pR.toneMapping=THREE.ACESFilmicToneMapping;pR.toneMappingExposure=1.1;
  pS=new THREE.Scene();pS.add(new THREE.HemisphereLight(0xffffff,0x6a5a4a,1.6));const d=new THREE.DirectionalLight(0xffffff,2.4);d.position.set(2,3,4);pS.add(d);pC=new THREE.PerspectiveCamera(30,1,.1,50);}
 const m=makeCreature(id);animate(m,0,0);m.obj.rotation.y=-.55;pS.add(m.obj);const h=m.h,r=Math.max(m.r,h*.55);const dist=Math.max(h,r*1.6)*1.75+.45;pC.position.set(0,h*.62+dist*.18,dist);pC.lookAt(0,h*.48,0);pR.render(pS,pC);PORT[k]=pR.domElement.toDataURL();pS.remove(m.obj);return PORT[k];}
const imgOf=id=>`<img src="${portrait(id)}" alt="">`;
const pill=t=>`<span class="pill" style="background:${TCOL[t]}">${t}</span>`;

/* ================= game state ================= */
let opt={time:1200,diff:1};
let app='menu',timeLeft=1200,G=null;
function freshState(){return{party:[],box:[],bag:{cube:0,great:0,potion:0,super:0,remedy:0,revive:0},mats:{wood:0,stone:0,crystal:0},coins:150,badges:[],beaten:{},dex:{seen:{},caught:{}},starter:0,
 st:{caught:0,wild:0,trainers:0,blackouts:0,evolved:0,battles:0},dayT:.3,days:1,champion:false,throwSel:0,lead:0};}
G=freshState();
const P={x:.5,y:40,z:5.5,vx:0,vy:0,vz:0,yaw:0,pitch:-.18,on:false,inWater:false,mount:null,face:0,throwT:0,stepT:0,camD:5.2};
const avatar=makeHuman({shirt:'#e8662a',pants:'#2a3550',hat:'wide',hatCol:'#2a8a7a',band:'#ffcf3f',pack:'#7a5a3a',packTop:'#c86a2a',hair:'#5a3a22'});scene.add(avatar.obj);
const seen=id=>{if(!G.dex.seen[id]){G.dex.seen[id]=1;}};
const caught=id=>{G.dex.seen[id]=1;if(!G.dex.caught[id]){G.dex.caught[id]=1;}};
const lead=()=>G.party[0];
const healthy=()=>G.party.some(m=>m.hp>0);

/* ================= input ================= */
const keys={};let mouseL=false,locked=false,unlockOk=false;
const lockReq=()=>{try{const p=canvas.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(e){}};
const exitLock=()=>{unlockOk=true;try{document.exitPointerLock();}catch(e){}};
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;if(!locked&&app==='world'&&!uiOpen()&&!unlockOk)pause(true);if(locked)unlockOk=false;});
addEventListener('mousemove',e=>{if(!locked||app!=='world')return;P.yaw-=e.movementX*.0024;P.pitch=clamp(P.pitch-e.movementY*.0024,-1.3,1.2);});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('mousedown',e=>{snd.init();if(app==='battle'){skipMsg();return;}if(app!=='world'||uiOpen())return;if(!locked){lockReq();return;}if(e.button===0)mouseL=true;if(e.button===2)throwCube();});
addEventListener('mouseup',e=>{if(e.button===0)mouseL=false;});
addEventListener('wheel',e=>{if(app!=='world'||uiOpen())return;cycleThrow(e.deltaY>0?1:-1);});
addEventListener('keydown',e=>{if(['Tab','Space','ArrowUp','ArrowDown'].includes(e.code)&&app!=='menu'&&app!=='over')e.preventDefault();if(e.target.tagName==='INPUT')return;snd.init();
 const rep=e.repeat;keys[e.code]=true;if(rep&&!/^Arrow/.test(e.code))return;press(e.code);});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseL=false;});
function press(code){if(navKey(code))return;
 if(app==='battle'){if(code==='Enter'||code==='Space'||code==='KeyE')skipMsg();return;}
 if(app==='world'&&!uiOpen()){
  if(code==='KeyE')interact();else if(code==='KeyR')toggleMount();else if(code==='Tab')openPanel('party');else if(code==='KeyC')openPanel('dex');else if(code==='KeyQ')cycleThrow(1);else if(code==='KeyX')throwCube();
  else if(/^Digit[1-6]$/.test(code))setLead(+code.slice(5)-1);else if(code==='KeyM'){toast(snd.toggle()?'SOUND ON':'SOUND OFF');}else if(code==='Escape'&&!locked)pause(true);}
 else if(app==='paused'&&code==='Escape')pause(false);}

/* --- gamepad (left stick move, right stick look, A jump/ok, B back, X throw, Y talk, RB cycle, Start pause, Back party) --- */
const padPrev=[],padK={};function pollPad(dt){const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(!gp)return;const ax=gp.axes,bt=gp.buttons.map(b=>b.pressed);const dz=v=>Math.abs(v)<.18?0:v;
 padK.KeyW=dz(ax[1])<-.3;padK.KeyS=dz(ax[1])>.3;padK.KeyA=dz(ax[0])<-.3;padK.KeyD=dz(ax[0])>.3;padK.Space=bt[0]&&app==='world'&&!uiOpen();padK.ShiftLeft=bt[10]||bt[7];
 if(app==='world'&&!uiOpen()){P.yaw-=dz(ax[2]||0)*dt*2.6;P.pitch=clamp(P.pitch-dz(ax[3]||0)*dt*2,-1.3,1.2);}
 const map={0:'Enter',1:'Escape',2:'KeyX',3:'KeyE',5:'KeyQ',9:'Escape',8:'Tab',12:'ArrowUp',13:'ArrowDown',14:'ArrowLeft',15:'ArrowRight'};
 for(const i in map){if(bt[i]&&!padPrev[i]){const c=(i==0&&app==='world'&&!uiOpen())?null:map[i];if(c)press(c);}padPrev[i]=bt[i];}}

/* ================= menu nav (keyboard for every list of buttons) ================= */
let nav=null;
function setNav(root,cols=1,back=null,start=0){const items=[...root.querySelectorAll('[data-nav]')].filter(e=>!e.classList.contains('dis'));if(cols==='auto'){const t0=items[0]?items[0].getBoundingClientRect().top:0;cols=Math.max(1,items.filter(e=>Math.abs(e.getBoundingClientRect().top-t0)<4).length);}nav={root,items,cols,back,i:Math.min(start,Math.max(0,items.length-1))};items.forEach((el,i)=>el.onmouseenter=()=>{nav&&nav.items===items&&(nav.i=i,markNav());});markNav();}
function markNav(){if(!nav)return;nav.items.forEach((el,i)=>el.classList.toggle('sel',i===nav.i));const s=nav.items[nav.i];if(s&&s.scrollIntoView)s.scrollIntoView({block:'nearest'});}
function navKey(code){if(!nav||!nav.items.length&&!nav.back)return false;if(!document.body.contains(nav.root)||nav.root.closest('[hidden]')){nav=null;return false;}
 const n=nav.items.length,c=nav.cols;const mv=d=>{nav.i=clamp(nav.i+d,0,n-1);markNav();snd.play('blip');};
 if(code==='ArrowDown'||code==='KeyS'){mv(c);return true;}if(code==='ArrowUp'||code==='KeyW'){mv(-c);return true;}if(code==='ArrowRight'||code==='KeyD'){if(c>1)mv(1);return true;}if(code==='ArrowLeft'||code==='KeyA'){if(c>1)mv(-1);return true;}
 if(code==='Enter'||code==='Space'||code==='KeyE'){const el=nav.items[nav.i];if(el){snd.play('ok');el.click();}return true;}
 if(/^Digit[1-9]$/.test(code)){const k=+code.slice(5)-1;const el=nav.items.find(e=>e.dataset.k==k+1)||null;if(el){snd.play('ok');el.click();return true;}return false;}
 if(code==='Escape'||code==='Backspace'||code==='Tab'||code==='KeyC'){if(nav.back){snd.play('back');nav.back();}return true;}
 return false;}

/* ================= HUD helpers ================= */
let toastT=0;function toast(s,t=2.2){$('toast').textContent=s;$('toast').style.opacity=1;toastT=t;}
function flashWhite(t=.25,a=.55){$('fade').style.transition='none';$('fade').style.background='#fff';$('fade').style.opacity=a;setTimeout(()=>{$('fade').style.transition='opacity .5s';$('fade').style.opacity=0;},t*1000);}
const uiOpen=()=>!$('panel').hidden||!$('dlg').hidden;

/* ================= world population: NPCs ================= */
const npcs=[];const ICON={bang:null,q:null};
function addNpc(o){const m=makeHuman(o.look);scene.add(m.obj);const y=o.y??(W.terrain(Math.floor(o.x),Math.floor(o.z)).h+1);const n={yaw:o.yaw??0,cool:0,state:'idle',t:Math.random()*9,...o,y,hy:y,m,home:{x:o.x,z:o.z},vx:0,vz:0};n.icon=iconSprite('!','#ff4d00');n.icon.visible=false;scene.add(n.icon);npcs.push(n);return n;}
function buildNpcs(){const S=W.SITES,vy=S.villageY;
 addNpc({id:'prof',kind:'prof',name:'PROFESSOR QUILL',x:S.prof.x,z:S.prof.z,y:vy,yaw:0,look:{coat:'#f4f4f0',shirt:'#4a6a9a',hair:'#c8c8c8',beard:'#d8d8d8',glasses:1,pants:'#3a3a44'}});
 addNpc({id:'healer',kind:'healer',name:'MENDER SOL',x:S.healer.x,z:S.healer.z,y:vy,yaw:0,look:{shirt:'#e86a8a',coat:'#f8f0f4',hat:'band',hatCol:'#2fd6c8',hair:'#8a3a2a',pants:'#4a3a5a'}});
 addNpc({id:'shop',kind:'shop',name:'TRADER BEX',x:S.shop.x,z:S.shop.z-.5,y:vy,yaw:Math.PI,look:{shirt:'#3a8a5a',coat:'#e8d8b0',hat:'cap',hatCol:'#ff8a2a',hair:'#2a1a10',pants:'#3a3020'}});
 const tips=[['Wild beasts with a "?" are shy. Sneak up, or they bolt!','Bold ones chase you. If they reach you, it\'s a battle.'],['Asleep or frozen beasts are twice as easy to catch.','Spore Puff and Frost Stare are great for catching.'],['Mine logs, stone and glowing crystal.','The workbench by the plaza turns them into cubes.'],['Once your lead hits Lv 10 you can ride it. Press R!','Tide beasts swim fast, wind beasts glide.'],['After dark, strange beasts come out.','I once saw a moth that glowed like a lantern...']];
 const vlook=[{shirt:'#c84a4a',hat:'beanie',hatCol:'#4a8ac8'},{shirt:'#6a4ac8',hair:'#e8c860'},{shirt:'#4ac8a0',hat:'cap',hatCol:'#c84a8a'},{shirt:'#c8a04a',hair:'#1a1a1a'},{shirt:'#8a8a8a',hat:'wide',hatCol:'#6a4a2a'}];
 [[-26,6],[22,-4],[-4,-28],[-20,20],[28,18]].forEach(([x,z],i)=>addNpc({id:'v'+i,kind:'villager',name:['ODA','LIN','PIM','RUSS','NELL'][i],x,z,y:vy,lines:tips[i],look:vlook[i],wander:5}));
 const theme={leaf:{shirt:'#4a8a3a',pants:'#2a3a20',hatCol:'#7ad84a'},ember:{shirt:'#c84a20',pants:'#3a2018',hatCol:'#ffb030'},frost:{shirt:'#6aa8d8',pants:'#2a3a5a',hatCol:'#e8f8ff'}};
 TOWERS.forEach(t=>{const th=theme[t.theme];t.trainers.forEach((tr,i)=>{const s=t.spots[i];addNpc({id:t.id+'_t'+i,kind:'trainer',name:tr.n,x:s.x,z:s.z,y:s.y,yaw:i===0?0:Math.PI/2,team:tr.team,tower:t,ti:i,sight:7,look:{shirt:th.shirt,pants:th.pants,hat:i?'beanie':'cap',hatCol:th.hatCol}});});
  const s=t.spots[2];addNpc({id:t.id+'_L',kind:'leader',name:t.leader.n,x:s.x,z:s.z,y:s.y,yaw:Math.PI/2,team:t.leader.team,tower:t,ti:2,look:{shirt:th.shirt,pants:th.pants,hat:'crown',hatCol:t.col,cape:t.col,beard:t.theme==='frost'?'#f0f0f0':null,hair:t.theme==='frost'?'#f0f0f0':'#2a1a10'}});});
 const rl=[{shirt:'#3a7ac8',hat:'cap',hatCol:'#ffd23a'},{shirt:'#7a5a3a',hat:'wide',hatCol:'#4a6a2a'},{shirt:'#2ab8d8',hair:'#e8c860'},{shirt:'#d89a4a',hat:'wide',hatCol:'#c84a2a'},{shirt:'#6a6a6a',hat:'band',hatCol:'#ffd23a'},{shirt:'#e8f0f8',hat:'beanie',hatCol:'#c84a4a'},{shirt:'#3a2a5a',hat:'hood',hatCol:'#2a1a40'}];
 ROAMERS.forEach((r,i)=>addNpc({id:r.id,kind:'roamer',name:r.n,x:r.x+.5,z:r.z+.5,team:r.team,sight:8,wander:6,look:rl[i%rl.length],night:r.id==='r7'}));}
// starter pedestals
const peds=[];function buildPeds(){W.SITES.ped.forEach((p,i)=>{const m=makeCreature(STARTERS[i]);m.obj.position.set(p.x,p.y,p.z);m.obj.rotation.y=0;scene.add(m.obj);peds.push(m);});}

/* ================= wild beasts ================= */
const wild=[];
const SPAWN={meadow:[[10,4],[18,4],[4,1.5],[7,1]],forest:[[7,4],[18,3],[10,1],[4,.6]],beach:[[4,5],[23,2]],desert:[[1,4],[23,3],[10,.6]],snow:[[16,5],[18,2]],highlands:[[13,5],[10,2],[18,1]]};
const NIGHT=[[21,5],[24,1.3]];
function pick(tab){let s=0;for(const t of tab)s+=t[1];let r=Math.random()*s;for(const t of tab){r-=t[1];if(r<=0)return t[0];}return tab[0][0];}
function wildLevel(x,z,biome){const d=Math.hypot(x,z);return clamp(Math.round(1+d/14+rnd(-1,1.2)+({snow:2,highlands:1,desert:1}[biome]||0)),2,30);}
function evolveTo(sp,lv){let s=sp;while(SPECIES[s].evo&&lv>=SPECIES[s].evo[1]+2)s=SPECIES[s].evo[0];return s;}
function spawnWild(sp,lv,x,z){const mon=mkMon(sp,lv);const m=makeCreature(sp);const y=W.ground(x,z,W.terrain(Math.floor(x),Math.floor(z)).h+2);m.obj.position.set(x,y,z);scene.add(m.obj);const w={mon,m,x,y,z,yaw:Math.random()*6.28,tyaw:0,state:'wander',t:rnd(0,3),spd:0,alert:0,icon:null,sp};
 w.icon=iconSprite(SPECIES[sp].tmp==='shy'?'?':'!',SPECIES[sp].tmp==='shy'?'#8be6ff':'#ff6a2a');w.icon.visible=false;scene.add(w.icon);w.tyaw=w.yaw;wild.push(w);return w;}
function removeWild(w){scene.remove(w.m.obj);scene.remove(w.icon);const i=wild.indexOf(w);if(i>=0)wild.splice(i,1);}
let spawnT=0;
function spawnTick(dt,night){if((spawnT-=dt)>0)return;spawnT=.5;const cap=night?12:11;if(wild.length>=cap)return;
 for(let tries=0;tries<6;tries++){const a=Math.random()*6.283,r=rnd(18,46),x=P.x+Math.cos(a)*r,z=P.z+Math.sin(a)*r;if(Math.hypot(x,z)<36)continue;const T=W.terrain(Math.floor(x),Math.floor(z));if(T.zone)continue;
  let tab=SPAWN[T.biome];if(!tab)continue;if(T.h<=W.SEA){if(Math.random()<.5)tab=[[4,1]];else continue;}
  if(night&&Math.random()<.4)tab=NIGHT;const sp0=pick(tab);if(SPECIES[sp0].night&&!night)continue;const lv=wildLevel(x,z,T.biome);const sp=evolveTo(sp0,lv);
  if(Math.abs(T.h+1-P.y)>14)continue;spawnWild(sp,lv,x,z);return;}}
function wildStep(w,dt,night){const S=SPECIES[w.sp];w.t-=dt;const dx=P.x-w.x,dz=P.z-w.z,d=Math.hypot(dx,dz);const fly=!!S.fly;let speed=0;
 const tmp=S.tmp,canAct=app==='world'&&!uiOpen()&&G.party.length>0;
 if(w.cool>0)w.cool-=dt;
 if(w.state==='wander'){if(w.t<=0){w.t=rnd(1.5,4);w.tyaw=Math.random()<.35?w.tyaw:Math.random()*6.283;w.idle=Math.random()<.4;}speed=w.idle?0:.9+S.b[3]/90;
  if(d<(tmp==='shy'?8:tmp==='bold'?10:0)&&!(w.cool>0)&&canAct&&!P.mount){w.state=tmp==='shy'?'flee':'chase';w.t=tmp==='shy'?3.5:6;w.alert=1.2;snd.play('alert');seen(w.sp);}
  if(d<6&&tmp==='calm'){w.tyaw=Math.atan2(dx,dz);speed=0;}
  if(d<10&&P.mount&&tmp==='shy'&&canAct){w.state='flee';w.t=3;w.alert=1;}}
 else if(w.state==='flee'){w.tyaw=Math.atan2(-dx,-dz);speed=4.2+S.b[3]/60;if(w.t<=0||d>26){w.state='wander';w.t=2;w.cool=4;}}
 else if(w.state==='chase'){w.tyaw=Math.atan2(dx,dz);speed=3+S.b[3]/70;if(w.t<=0||d>18){w.state='wander';w.t=2;w.cool=6;}
  if(d<1.6+w.m.r&&canAct&&Math.abs(P.y-w.y)<2.5){if(healthy()){startBattle({kind:'wild',w});return;}else{P.vx+=dx/d*6;P.vz+=dz/d*6;P.vy=5;w.state='wander';w.cool=5;toast('YOUR TEAM NEEDS HEALING!');}}}
 if(w.alert>0)w.alert-=dt;
 // turn + move with terrain checks
 let dy=w.tyaw-w.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));w.yaw+=dy*Math.min(1,dt*6);
 if(speed>0){const nx=w.x+Math.sin(w.yaw)*speed*dt,nz=w.z+Math.cos(w.yaw)*speed*dt;const T=W.terrain(Math.floor(nx),Math.floor(nz));const gy=W.ground(nx,nz,w.y+2.5);
  const water=gy%1!==0;const ok=!T.zone&&(fly||gy-w.y<1.3)&&(fly||!water||S.t==='TIDE')&&Math.hypot(nx,nz)>32;if(ok){w.x=nx;w.z=nz;}else{w.tyaw+=Math.PI*(.5+Math.random());w.t=Math.min(w.t,1);}}
 const gy=W.ground(w.x,w.z,w.y+2.5);const ty=fly?gy+1.1+Math.sin(w.m.t*2)*.25:gy;w.y+=(ty-w.y)*Math.min(1,dt*(fly?3:12));
 w.m.obj.position.set(w.x,w.y,w.z);w.m.obj.rotation.y=w.yaw;animate(w.m,dt,speed/2.2,fly);
 w.icon.visible=w.alert>0;if(w.icon.visible)w.icon.position.set(w.x,w.y+w.m.h+.55,w.z);}

/* ================= player ================= */
const W2=.3,PH=1.8;
function collides(x,y,z){for(let bx=Math.floor(x-W2);bx<=Math.floor(x+W2-1e-6);bx++)for(let by=Math.floor(y);by<=Math.floor(y+PH-1e-6);by++)for(let bz=Math.floor(z-W2);bz<=Math.floor(z+W2-1e-6);bz++)if(W.solid(W.get(bx,by,bz)))return true;return false;}
const look=()=>new V3(0,0,-1).applyEuler(new THREE.Euler(P.pitch,P.yaw,0,'YXZ'));
const seatH=()=>P.mount?P.mount.seat:0;
function movePlayer(dt){const k=new Proxy({},{get:(_,c)=>keys[c]||padK[c]}),ui=uiOpen();const sprint=k.ShiftLeft||k.ShiftRight;const f=ui?0:(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0),s=ui?0:(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0);
 const feet=W.get(Math.floor(P.x),Math.floor(P.y+.2),Math.floor(P.z)),head=W.get(Math.floor(P.x),Math.floor(P.y+1.5),Math.floor(P.z));P.inWater=!!(W.B[feet]?.liquid||W.B[head]?.liquid);
 const M=P.mount,mt=M?SPECIES[M.sp].t:null,surf=M&&mt==='TIDE'&&P.inWater;
 let sp=M?(surf?9:sprint?11:8.2):P.inWater?2.6:sprint?6.2:4.4;const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);let wx=-sy*f+cy*s,wz=-cy*f-sy*s;const wl=Math.hypot(wx,wz)||1;const mv=(f||s)?1:0;wx=wx/wl*sp*mv;wz=wz/wl*sp*mv;
 const acc=P.on||P.inWater?12:3.5;P.vx+=(wx-P.vx)*Math.min(1,acc*dt);P.vz+=(wz-P.vz)*Math.min(1,acc*dt);
 if(surf){const wl2=W.SEA+.9;P.vy=(wl2-P.y)*6;if(k.Space&&!ui)P.vy=8;}
 else if(P.inWater){P.vy=Math.max(-3,P.vy-8*dt);if(k.Space&&!ui)P.vy=Math.min(3.4,P.vy+20*dt);}
 else{P.vy-=26*dt;if(k.Space&&P.on&&!ui)P.vy=M?10.5:8.4;const glide=M&&(SPECIES[M.sp].fly||M.sp===12)&&k.Space&&P.vy<0;if(glide)P.vy=Math.max(P.vy,-2.2);}P.vy=Math.max(P.vy,-40);
 for(const ax of['x','z','y']){const v=P['v'+ax]*dt;if(!v)continue;const o=P[ax];P[ax]+=v;if(collides(P.x,P.y,P.z)){P[ax]=o;if(ax==='y'){if(P.vy<0)P.on=true;P.vy=0;}else{P['v'+ax]=0;
    if(P.on){const up=P.y+1.05;if(!collides(ax==='x'?o+v:P.x,up,ax==='z'?o+v:P.z)&&!collides(P.x,up,P.z)){P.y=up;P[ax]=o+v;}}}}else if(ax==='y')P.on=false;}
 if(P.y<-8){respawn();}
 const hs=Math.hypot(P.vx,P.vz);if(hs>.5){let tf=Math.atan2(P.vx,P.vz);let d=tf-P.face;d=Math.atan2(Math.sin(d),Math.cos(d));P.face+=d*Math.min(1,dt*10);if(P.on&&(P.stepT-=dt*hs)<=0){P.stepT=M?3.2:2.2;snd.play('step');}}
 if(P.throwT>0){let tf=P.yaw+Math.PI;let d=tf-P.face;d=Math.atan2(Math.sin(d),Math.cos(d));P.face+=d*Math.min(1,dt*14);P.throwT-=dt;}
 return hs;}
function respawn(){const S=W.SITES;P.x=S.healer.x;P.z=S.healer.z+3;P.y=S.villageY+.02;P.vx=P.vy=P.vz=0;}
function placeAvatar(dt,hs){const sh=seatH();avatar.obj.position.set(P.x,P.y+sh,P.z);avatar.obj.rotation.y=P.face;animHuman(avatar,dt,P.mount?0:hs/4.4,{throw:P.throwT>0?P.throwT/.45:0,ride:!!P.mount});
 if(P.mount){const m=P.mount.m;m.obj.position.set(P.x,P.y,P.z);m.obj.rotation.y=P.face;animate(m,dt,hs/5,!P.on&&(SPECIES[P.mount.sp].fly||P.mount.sp===12));}}
function toggleMount(){if(P.mount){scene.remove(P.mount.m.obj);P.mount=null;toast('DISMOUNTED');return;}const L=lead();if(!L){toast('NO BEAST TO RIDE');return;}if(L.hp<=0){toast(nameOf(L)+' NEEDS HEALING');return;}if(L.lv<10){toast('RIDE AT LV 10 · '+nameOf(L)+' IS LV '+L.lv);return;}
 const m=makeCreature(L.sp);const sc=clamp(1.35/m.h,1,2.6);m.obj.scale.setScalar(sc);scene.add(m.obj);P.mount={m,sp:L.sp,seat:m.h*sc*.78,uid:L.uid};snd.play('pop');PARTS.burst(new V3(P.x,P.y+.6,P.z),'CUBE',30,3);toast('RIDING '+nameOf(L));}

/* ================= throwing capture cubes ================= */
const THROWS=['lead','cube','great'];
function cycleThrow(d){G.throwSel=(G.throwSel+d+3)%3;drawThrow();snd.play('blip');}
const proj=[];
function aimTarget(maxD=40){const o=cam.position.clone(),d=look();let best=null,bt=maxD;for(const w of wild){const c=new V3(w.x,w.y+w.m.h*.5,w.z);const r=Math.max(.45,w.m.r*.8,w.m.h*.5);const oc=c.clone().sub(o);const t=oc.dot(d);if(t<0)continue;const dist2=oc.lengthSq()-t*t;if(dist2<r*r&&t<bt){const hit=W.raycast(o,d,t);if(!hit){bt=t;best=w;}}}return best?{w:best,t:bt}:null;}
function throwCube(){if(app!=='world'||uiOpen())return;if(!G.party.length){toast('GET A BEAST FROM PROFESSOR QUILL FIRST');return;}const kind=THROWS[G.throwSel];
 if(kind==='lead'&&!healthy()){toast('YOUR TEAM NEEDS HEALING!');return;}if(kind!=='lead'&&!(G.bag[kind]>0)){toast('NO '+ITEMS[kind].n+'S LEFT');return;}if(proj.length>2)return;
 const d=look();const hit=W.raycast(cam.position,d,50);const at=aimTarget(50);let tgt;if(at)tgt=cam.position.clone().addScaledVector(d,at.t);else if(hit)tgt=cam.position.clone().addScaledVector(d,hit.t);else tgt=cam.position.clone().addScaledVector(d,40);
 const from=new V3(P.x,P.y+seatH()+1.55,P.z).add(new V3(Math.cos(P.yaw),0,-Math.sin(P.yaw)).multiplyScalar(.35));const to=tgt.clone().sub(from);const dist=to.length();const T=clamp(dist/22,.18,1.4);
 const v=to.multiplyScalar(1/T);v.y+=.5*16*T;const m=makeCube(kind==='lead'?'cube':kind);m.obj.position.copy(from);scene.add(m.obj);proj.push({m,v,kind,t:0,land:0});if(kind!=='lead')G.bag[kind]--;P.throwT=.45;snd.play('throw');drawThrow();}
function stepProj(dt){for(const p of proj.slice()){if(!proj.includes(p))continue;p.t+=dt;const o=p.m.obj;if(p.land>0){p.land-=dt;if(p.land<=0){scene.remove(o);proj.splice(proj.indexOf(p),1);PARTS.burst(o.position,'CUBE',10,1.5);if(p.kind!=='lead'&&!p.used){G.bag[p.kind]++;drawThrow();}}continue;}
  p.v.y-=16*dt;const np=o.position.clone().addScaledVector(p.v,dt);o.rotation.x+=dt*9;o.rotation.y+=dt*5;
  for(const w of wild){const c=new V3(w.x,w.y+w.m.h*.5,w.z);if(c.distanceTo(np)<Math.max(.55,w.m.r*.8,w.m.h*.5)+.15){scene.remove(o);proj.splice(proj.indexOf(p),1);PARTS.burst(np,'CUBE',26,3);snd.play('pop');hitWild(w,p.kind);np.y=-999;break;}}
  if(np.y===-999)continue;
  if(W.solid(W.get(Math.floor(np.x),Math.floor(np.y),Math.floor(np.z)))||p.t>3){p.land=.7;o.position.y=Math.floor(np.y)+1.15;p.v.set(0,0,0);continue;}
  o.position.copy(np);}}
function hitWild(w,kind){seen(w.sp);if(kind==='lead'){if(!healthy()){toast('YOUR TEAM NEEDS HEALING!');return;}startBattle({kind:'wild',w});return;}
 // direct catch attempt in the world (full HP: low odds)
 const S=SPECIES[w.sp];const p=Math.min(1,S.cr*ITEMS[kind].ball*.22+.03),q=Math.pow(p,1/3);let shakes=0;while(shakes<3&&Math.random()<q)shakes++;worldCatch(w,kind,shakes);}
const wcatch=[];
function worldCatch(w,kind,shakes){const m=makeCube(kind);m.obj.position.set(w.x,w.y+.18,w.z);scene.add(m.obj);w.hidden=true;w.m.obj.visible=false;w.icon.visible=false;wcatch.push({w,m,kind,shakes,t:0});}
function stepWorldCatch(dt){for(const c of wcatch.slice()){c.t+=dt;const o=c.m.obj;const ph=c.t-.4;const i=Math.floor(ph/.6);if(ph>0&&i<c.shakes){const k=(ph%.6)/.6;o.rotation.z=Math.sin(k*Math.PI*2)*.4*(k<.6?1:0);if(k<dt/.6+.01)snd.play('shake');}
  if(ph>Math.max(c.shakes,1)*.6+.2){wcatch.splice(wcatch.indexOf(c),1);const w=c.w;if(c.shakes===3){scene.remove(o);PARTS.burst(o.position,c.kind==='great'?'GREAT':'CUBE',40,3);snd.play('catch');removeWild(w);addMon(w.mon);toast('CAUGHT '+nameOf(w.mon)+'!',2.6);}
   else{scene.remove(o);PARTS.burst(o.position,'CUBE',30,4);snd.play('break');w.hidden=false;w.m.obj.visible=true;toast(nameOf(w.mon)+' BROKE FREE!');if(SPECIES[w.sp].tmp==='shy'){w.state='flee';w.t=4;w.alert=1;}else if(healthy())startBattle({kind:'wild',w});}}}}
function addMon(mon){mon.status=null;caught(mon.sp);G.st.caught++;if(G.party.length<6){G.party.push(mon);drawParty();return'party';}G.box.push(mon);return'box';}

/* ================= interactions ================= */
let focusT=null;
function findInteract(){let best=null,bd=3.4;const fwd=new V3(-Math.sin(P.yaw),0,-Math.cos(P.yaw));
 for(const n of npcs){if(n.night&&!night)continue;const dx=n.x-P.x,dz=n.z-P.z,d=Math.hypot(dx,dz);if(d<bd&&Math.abs(n.y-P.y)<2.6){const dot=(dx*fwd.x+dz*fwd.z)/(d||1);if(dot>-.2||d<1.6){bd=d;best={npc:n,label:n.kind==='healer'?'HEAL WITH '+n.name:n.kind==='shop'?'SHOP WITH '+n.name:'TALK TO '+n.name};}}}
 for(const s of W.STATIONS){const dx=s.x+.5-P.x,dz=s.z+.5-P.z,d=Math.hypot(dx,dz);if(d<bd-.4&&Math.abs(s.y-P.y)<2.6){bd=d+.4;best={st:s,label:s.kind==='bench'?'CRAFT AT WORKBENCH':s.kind==='pc'?'OPEN PC BOX':'REST AT MEND CRYSTAL'};}}
 return best;}
function interact(){const f=findInteract();if(!f)return;if(f.st){const k=f.st.kind;if(k==='bench')openPanel('bench');else if(k==='pc')openPanel('pc');else{healAll();say('MEND CRYSTAL',['A warm glow washes over your team. They are fully healed!']);}return;}
 const n=f.npc;n.yaw=Math.atan2(P.x-n.x,P.z-n.z);talk(n);}
function healAll(){for(const m of G.party){m.hp=maxHp(m);m.status=null;}snd.play('heal');PARTS.burst(new V3(P.x,P.y+1,P.z),'HEAL',40,3,{lift:2});drawParty();}
function talk(n){const pn=n.name;
 if(n.kind==='prof'){if(!G.starter){say(pn,['Ah, a new face! Welcome to the island. I\'m Professor Quill.','Beasts roam every corner of it: meadows, forests, beaches, deserts, snowfields and caves.','Every trainer needs a partner. Choose one of these three!'],()=>openPanel('starter'));}
  else{const s=Object.keys(G.dex.seen).length,c=Object.keys(G.dex.caught).length;const lines=['Your dex: '+s+' seen, '+c+' caught out of 24. '+(c<6?'Keep going!':c<15?'Impressive!':'Astonishing work!')];if(G.bag.cube+G.bag.great<2){G.bag.cube+=5;lines.push('Running low on cubes? Take these 5 CAPTURE CUBES.');drawThrow();}lines.push(G.badges.length<3?'The spires: VERDANT to the west, KILN to the east, RIME up north in the snow.':'Three badges! You are the island\'s champion. Now fill that dex!');say(pn,lines);}return;}
 if(n.kind==='healer'){healAll();say(pn,['Let me patch your team up... There! Fully healed.','The PC terminal beside me stores beasts when your party is full.']);return;}
 if(n.kind==='shop'){say(pn,['Cubes, potions, remedies. Take a look!'],()=>openPanel('shop'));return;}
 if(n.kind==='villager'){say(n.name,n.lines);return;}
 if(n.kind==='trainer'||n.kind==='roamer'||n.kind==='leader'){if(G.beaten[n.id]){say(pn,[n.kind==='leader'?'You earned that badge. The island is lucky to have you.':'Good battle! I need to train harder.']);return;}
  if(n.kind==='leader'){const t=n.tower;const need=t.trainers.map((_,i)=>t.id+'_t'+i).filter(id=>!G.beaten[id]);if(need.length){say(pn,['Beat my two apprentices on the way up first.']);return;}if(!healthy()){say(pn,['Your team is exhausted. Rest at the mend crystal by the stairs.']);return;}
   say(pn,['So you climbed '+t.n+'. I am '+pn+'.','My '+t.type+' beasts have never lost here. Show me what you\'ve got!'],()=>startBattle({kind:'trainer',npc:n}));return;}
  if(!healthy()){say(pn,['Your team looks beaten up. Heal first, then we battle!']);return;}say(pn,[trainerLine(n)],()=>startBattle({kind:'trainer',npc:n}));}}
function trainerLine(n){return['Hey! Our eyes met. That means a battle!','You look strong. Let\'s test that!','My beasts are itching for a fight!','Halt! Nobody passes without a battle.'][n.id.length%4];}

/* ================= dialog ================= */
let dlg=null;
function say(who,lines,onEnd,choices){dlg={who,lines,i:0,onEnd,choices,shown:0};exitLockSoft();$('dlg').hidden=false;$('dwho').textContent=who;showLine();}
function exitLockSoft(){if(locked)exitLock();}
function showLine(){$('dtxt').textContent='';dlg.shown=0;const last=dlg.i===dlg.lines.length-1;$('dch').innerHTML='';nav=null;
 if(last&&dlg.choices){dlg.choices.forEach((c,i)=>{const b=document.createElement('button');b.textContent=c.t;b.dataset.nav=1;b.onclick=()=>{closeDlg(false);c.fn();};$('dch').appendChild(b);});setNav($('dch'),1,null);nav.cols=99;}
 else setNav($('dlg'),1,null),nav.items=[$('dlg')],$('dlg').onclick=advance,nav.i=0;}
function advance(){if(!dlg)return;const L=dlg.lines[dlg.i];if(dlg.shown<L.length){dlg.shown=L.length;return;}if(dlg.i<dlg.lines.length-1){dlg.i++;showLine();snd.play('blip');return;}if(dlg.choices)return;closeDlg(true);}
function closeDlg(run){const d=dlg;dlg=null;$('dlg').hidden=true;$('dlg').onclick=null;nav=null;if(run&&d&&d.onEnd)d.onEnd();else if(app==='world'&&!uiOpen())afterUi();}
function stepDlg(dt){if(!dlg)return;const L=dlg.lines[dlg.i];if(dlg.shown<L.length){dlg.shown=Math.min(L.length,dlg.shown+dt*70);$('dtxt').textContent=L.slice(0,Math.floor(dlg.shown));}}
function afterUi(){if(app==='world'&&!uiOpen()){$('lockHint').hidden=locked;if(!locked)lockReq();}}

/* ================= panels ================= */
let panel=null;
function openPanel(kind,o={}){panel={kind,...o};if(app==='world')exitLockSoft();$('panel').hidden=false;renderPanel();}
function closePanel(){const p=panel;panel=null;$('panel').hidden=true;nav=null;if(p&&p.onClose)p.onClose();if(app==='battle'&&BT&&!BT.busy)battleMenu(BT.menu==='moves'?'moves':'main');afterUi();}
$('pclose').onclick=()=>{if(panel&&panel.forced)return;closePanel();};
function monCard(m,i,extra=''){const S=SPECIES[m.sp],mh=maxHp(m),pc=m.hp/mh;const nx=xpFor(m.lv+1),px=xpFor(m.lv);
 return`<button class="mon${i===0&&panel.kind!=='pc'?' lead':''}${m.hp<=0?' ko':''}" data-nav data-i="${i}">${imgOf(m.sp)}<div class="i"><div class="n">${nameOf(m)}<small>LV ${m.lv}</small> ${pill(S.t)}${m.status?`<span class="st ${m.status}" style="margin-left:4px;font:700 .5rem var(--mono);padding:2px 5px;border-radius:4px">${STATUS_N[m.status]}</span>`:''}</div>
 <div class="hp"><i class="${pc<.25?'low':pc<.5?'mid':''}" style="width:${pc*100}%"></i></div><div style="display:flex;justify-content:space-between;font-size:.56rem;color:var(--mut);margin-top:3px"><span>HP ${m.hp}/${mh}</span><span>XP ${m.xp-px}/${nx-px}</span></div>
 <div class="mv">${m.moves.map(k=>{const M=MOVES[k];return`<span style="--tc:${TCOL[M.type]}">${M.n}${M.pow?' · '+M.pow:''}</span>`;}).join('')}</div></div>${extra}</button>`;}
function renderPanel(){const p=panel,b=$('pbody');$('psub').textContent='';let back=()=>closePanel(),cols=1,start=p.sel||0;$('pclose').style.display=p.forced?'none':'';
 if(p.kind==='party'||p.kind==='switch'||p.kind==='target'){
  $('ptitle').textContent=p.kind==='switch'?(p.forced?'CHOOSE NEXT BEAST':'SWITCH BEAST'):p.kind==='target'?'USE '+ITEMS[p.item].n+' ON...':'PARTY';$('psub').textContent=p.kind==='party'?'Click a beast for options · 1-6 sets your lead':'';
  b.innerHTML='<div class="grid">'+G.party.map((m,i)=>monCard(m,i,BT&&BT.b.me===i&&app==='battle'?'<span class="tagl">IN BATTLE</span>':i===0?'<span class="tagl">LEAD</span>':'')).join('')+'</div><div class="acts" id="pacts"></div>';cols='auto';
  if(!G.party.length)b.innerHTML='<p style="color:var(--mut)">No beasts yet. Visit Professor Quill in the village.</p>';
  b.querySelectorAll('.mon').forEach(el=>el.onclick=()=>{const i=+el.dataset.i,m=G.party[i];
   if(p.kind==='switch'){if(m.hp<=0||(BT&&BT.b.me===i)){snd.play('back');return;}const forced=p.forced;panel.onClose=null;closePanel();battleAct(forced?{t:'force',i}:{t:'switch',i});return;}
   if(p.kind==='target'){const it=ITEMS[p.item];const okT=it.revive?m.hp<=0:it.cure?m.status&&m.hp>0:m.hp>0&&m.hp<maxHp(m);if(!okT){toast('IT WON\'T HAVE ANY EFFECT');return;}if(p.inBattle){panel.onClose=null;closePanel();battleAct({t:'item',k:p.item,i});}else{useItemField(p.item,m);renderPanel();}return;}
   // party options
   p.sel=i;const acts=$('pacts');acts.innerHTML=`<b style="font:400 1.1rem var(--disp);margin-right:8px;align-self:center">${nameOf(m)}</b>`+(i?`<button class="pbtn" data-nav data-a="lead">MAKE LEAD</button>`:'')+['potion','super','remedy','revive'].map(k=>`<button class="pbtn${G.bag[k]>0?'':' dis'}" data-nav data-a="${k}">${ITEMS[k].n} ×${G.bag[k]}</button>`).join('')+(i>0?`<button class="pbtn" data-nav data-a="up">MOVE UP</button>`:'')+`<button class="pbtn" data-nav data-a="x">BACK</button>`;
   acts.querySelectorAll('button').forEach(bb=>bb.onclick=()=>{const a=bb.dataset.a;if(a==='lead')setLead(i);else if(a==='up'){[G.party[i-1],G.party[i]]=[G.party[i],G.party[i-1]];p.sel=i-1;drawParty();}else if(a!=='x'){const it=ITEMS[a];const okT=it.revive?m.hp<=0:it.cure?m.status&&m.hp>0:m.hp>0&&m.hp<maxHp(m);if(okT)useItemField(a,m);else toast('IT WON\'T HAVE ANY EFFECT');}renderPanel();});
   setNav(acts,99,()=>renderPanel());});
  if(p.forced)back=null;else if(p.kind!=='party')back=()=>closePanel();}
 else if(p.kind==='dex'){$('ptitle').textContent='BEAST DEX';const s=Object.keys(G.dex.seen).length,c=Object.keys(G.dex.caught).length;$('psub').textContent=`SEEN ${s} · CAUGHT ${c} / 24`;
  const sel=p.sel??1;b.innerHTML='<div class="dex">'+SPECIES.slice(1).map((S,i)=>{const id=i+1,st=G.dex.caught[id]?'caught':G.dex.seen[id]?'seen':'unseen';return`<button class="dx ${st}" data-nav data-id="${id}"><img src="${portrait(id)}" alt=""><span class="no">#${String(id).padStart(2,'0')}</span> ${st==='unseen'?'???':S.n}</button>`;}).join('')+'</div><div id="dexd"></div>';cols='auto';
  const show=id=>{const S=SPECIES[id],st=G.dex.caught[id]?2:G.dex.seen[id]?1:0;const chain=[];let r=id;while(Object.entries(SPECIES).some(([k,s])=>s&&s.evo&&s.evo[0]===r)){r=+Object.entries(SPECIES).find(([k,s])=>s&&s.evo&&s.evo[0]===r)[0];}let q=r;while(q){chain.push(q);q=SPECIES[q].evo?SPECIES[q].evo[0]:0;}
   $('dexd').innerHTML=`<div class="dexd"><img src="${portrait(id)}" style="${st?'':'filter:brightness(0) opacity(.6)'}"><div><h3>#${String(id).padStart(2,'0')} ${st?S.n:'???'} ${st?pill(S.t):''}</h3>${st?`<p>${st===2?S.dex:'Catch one to learn more about it.'}</p><p style="color:var(--mut)">HABITAT · ${S.home.map(h=>HABITAT[h]).join(', ')||'Evolution only'}${S.night?' · NIGHT ONLY':''}${chain.length>1?' · LINE: '+chain.map(c=>G.dex.seen[c]?SPECIES[c].n:'???').join(' → ')+(SPECIES[id].evo?' (LV '+SPECIES[id].evo[1]+')':''):''}</p>`:'<p>Not seen yet.</p>'}
   ${st===2?`<div class="sb">${['HP','ATK','DEF','SPD'].map((n,j)=>`<span>${n}</span><i style="width:${S.b[j]/1.3}%"></i><span>${S.b[j]}</span>`).join('')}</div>`:''}</div></div>`;};
  b.querySelectorAll('.dx').forEach(el=>{el.onclick=()=>{p.sel=+el.dataset.id;show(p.sel);};el.addEventListener('mouseenter',()=>show(+el.dataset.id));});show(sel);start=sel-1;}
 else if(p.kind==='pc'){$('ptitle').textContent='PC BOX';$('psub').textContent='Click to move beasts between your party and the box';
  const mini=(m,i,w)=>`<button class="mini" data-nav data-w="${w}" data-i="${i}"><img src="${portrait(m.sp)}"><b>${nameOf(m)}</b> ${pill(SPECIES[m.sp].t)}<small>LV ${m.lv} · ${m.hp}/${maxHp(m)}</small></button>`;
  b.innerHTML=`<div class="cols"><div><h4>PARTY ${G.party.length}/6</h4>${G.party.map((m,i)=>mini(m,i,'p')).join('')}</div><div><h4>BOX ${G.box.length}</h4>${G.box.map((m,i)=>mini(m,i,'b')).join('')||'<p style="color:var(--mut);font-size:.7rem">Empty. Extra beasts you catch land here.</p>'}</div></div>`;
  b.querySelectorAll('.mini').forEach(el=>el.onclick=()=>{const i=+el.dataset.i;if(el.dataset.w==='p'){if(G.party.length<=1){toast('KEEP AT LEAST ONE BEAST');return;}G.box.push(G.party.splice(i,1)[0]);}else{if(G.party.length>=6){toast('PARTY IS FULL');return;}const m=G.box.splice(i,1)[0];m.hp=maxHp(m);m.status=null;G.party.push(m);}snd.play('ok');drawParty();renderPanel();});}
 else if(p.kind==='shop'){$('ptitle').textContent='TRADER BEX';$('psub').textContent=`COINS ${G.coins}`;
  b.innerHTML='<div class="shop">'+Object.entries(ITEMS).map(([k,it])=>`<div class="it"><b>${it.n}</b><p>${it.d}</p><span class="pr">◆ ${it.price}</span> · <span style="font-size:.62rem;color:var(--mut)">HAVE ${G.bag[k]}</span><div class="acts"><button class="pbtn${G.coins>=it.price?'':' dis'}" data-nav data-k2="${k}" data-n="1">BUY 1</button><button class="pbtn${G.coins>=it.price*5?'':' dis'}" data-nav data-k2="${k}" data-n="5">BUY 5</button></div></div>`).join('')+'</div>';cols='auto';
  b.querySelectorAll('[data-k2]').forEach(el=>el.onclick=()=>{const k=el.dataset.k2,n=+el.dataset.n,c=ITEMS[k].price*n;if(G.coins<c){toast('NOT ENOUGH COINS');return;}G.coins-=c;G.bag[k]+=n;snd.play('coin');drawThrow();p.sel=nav?nav.i:0;renderPanel();});}
 else if(p.kind==='bench'){$('ptitle').textContent='WORKBENCH';$('psub').textContent=`WOOD ${G.mats.wood} · STONE ${G.mats.stone} · CRYSTAL ${G.mats.crystal}  —  hold left click on logs, stone and glowing crystal to mine`;
  b.innerHTML='<div class="shop">'+RECIPES.map((r,i)=>{const ok=Object.entries(r.in).every(([k,n])=>G.mats[k]>=n);return`<div class="it"><b>${r.n>1?r.n+'× ':''}${ITEMS[r.out].n}</b><p>${Object.entries(r.in).map(([k,n])=>n+' '+MATS[k]).join(' + ')}</p><div class="acts"><button class="pbtn${ok?'':' dis'}" data-nav data-r="${i}">CRAFT</button></div></div>`;}).join('')+'</div>';cols='auto';
  b.querySelectorAll('[data-r]').forEach(el=>el.onclick=()=>{const r=RECIPES[+el.dataset.r];if(!Object.entries(r.in).every(([k,n])=>G.mats[k]>=n))return;for(const[k,n]of Object.entries(r.in))G.mats[k]-=n;G.bag[r.out]+=r.n;snd.play('ok');PARTS.burst(new V3(P.x,P.y+1.2,P.z),'CUBE',20,2);drawThrow();renderPanel();});}
 else if(p.kind==='bag'){$('ptitle').textContent='BAG';$('psub').textContent='';
  b.innerHTML='<div class="shop">'+Object.entries(ITEMS).map(([k,it])=>`<div class="it"><b>${it.n}</b><p>${it.d}</p><span style="font-size:.7rem">×${G.bag[k]}</span><div class="acts"><button class="pbtn${G.bag[k]>0?'':' dis'}" data-nav data-k3="${k}">USE</button></div></div>`).join('')+'</div>';cols='auto';
  b.querySelectorAll('[data-k3]').forEach(el=>el.onclick=()=>{const k=el.dataset.k3,it=ITEMS[k];if(it.ball){panel.onClose=null;closePanel();battleAct({t:'item',k});}else openPanel('target',{item:k,inBattle:true});});}
 else if(p.kind==='starter'){$('ptitle').textContent='CHOOSE YOUR PARTNER';$('psub').textContent='';back=null;$('pclose').style.display='none';
  b.innerHTML='<div class="grid">'+STARTERS.map((id,i)=>{const S=SPECIES[id];return`<button class="mon" data-nav data-id="${id}">${imgOf(id)}<div class="i"><div class="n">${S.n} ${pill(S.t)}</div><p style="font-size:.62rem;color:#c8cad2;line-height:1.5;margin:6px 0 0">${S.dex}</p><p style="font-size:.58rem;color:var(--mut);margin:4px 0 0">${['Strong vs LEAF & FROST','Strong vs EMBER & STONE','Strong vs TIDE & STONE'][i]}</p></div></button>`;}).join('')+'</div>';cols='auto';
  b.querySelectorAll('.mon').forEach(el=>el.onclick=()=>chooseStarter(+el.dataset.id));}
 setNav(b,cols,back,start);if(back===null&&p.kind!=='starter'&&!p.forced)nav.back=()=>closePanel();}
function useItemField(k,m){const it=ITEMS[k];if(!(G.bag[k]>0))return;G.bag[k]--;if(it.revive)m.hp=Math.floor(maxHp(m)/2);else if(it.heal)m.hp=Math.min(maxHp(m),m.hp+it.heal);else if(it.cure)m.status=null;snd.play('heal');drawParty();}
function setLead(i){if(!G.party[i]||i===0)return;const m=G.party.splice(i,1)[0];G.party.unshift(m);if(P.mount)toggleMount();snd.play('ok');toast(nameOf(m)+' LEADS');drawParty();if(panel&&panel.kind==='party'){panel.sel=0;renderPanel();}}
function chooseStarter(id){const S=SPECIES[id];say('PROFESSOR QUILL',[S.n+', the '+S.t+' beast. Is that your pick?'],null,[{t:'YES, '+S.n+'!',fn:()=>{closePanel();G.starter=id;const m=mkMon(id,5);G.party.push(m);caught(id);G.bag.cube+=5;G.bag.potion+=3;
  const pi=STARTERS.indexOf(id);const pm=peds[pi];if(pm){PARTS.burst(pm.obj.position.clone().add(new V3(0,.4,0)),'CUBE',40,3);scene.remove(pm.obj);}snd.play('catch');drawParty();drawThrow();
  say('PROFESSOR QUILL',[S.n+' is all yours! I\'ve added 5 CAPTURE CUBES and 3 POTIONS to your bag.','RIGHT CLICK throws your partner\'s cube. Hit a wild beast with it to start a battle.','Weaken it, then pick BAG → CAPTURE CUBE. Wild beasts are just outside the village!','When you feel strong, take on the spires: VERDANT (west), KILN (east) and RIME (north).']);}},{t:'LET ME LOOK AGAIN',fn:()=>openPanel('starter')}]);}
$('panel').addEventListener('mousedown',e=>{if(e.target.id==='panel'&&panel&&!panel.forced&&panel.kind!=='starter')closePanel();});

/* ================= HUD ================= */
function drawParty(){const el=$('partyStrip');el.innerHTML=G.party.map((m,i)=>{const pc=m.hp/maxHp(m);return`<div class="ps${i===0?' lead':''}${m.hp<=0?' ko':''}"><img src="${portrait(m.sp)}"><b>LV${m.lv}</b><span class="k">${i+1}</span><div class="hp"><i class="${pc<.25?'low':pc<.5?'mid':''}" style="width:${pc*100}%"></i></div></div>`;}).join('');drawThrow();}
function drawThrow(){const L=lead();const sel=G.throwSel;$('throwBar').innerHTML=[`<div class="tb${sel===0?' on':''}"><small>RIGHT CLICK</small>${L?'⟐ '+nameOf(L):'NO BEAST'}</div>`,`<div class="tb${sel===1?' on':''}"><small>CAPTURE</small><span class="cb" style="background:#22b8ac"></span>×${G.bag.cube}</div>`,`<div class="tb${sel===2?' on':''}"><small>GREAT</small><span class="cb" style="background:#8a5ad8"></span>×${G.bag.great}</div>`,`<div class="mats">WOOD ${G.mats.wood}<br>STONE ${G.mats.stone}<br>CRYSTAL ${G.mats.crystal}</div>`].join('');}
function drawBadges(){$('badges').innerHTML=TOWERS.map(t=>`<i class="${G.badges.includes(t.id)?'on':''}" style="color:${t.col};${G.badges.includes(t.id)?'background:'+t.col:''}" title="${t.badge}"></i>`).join('');}
const MAP=W.islandMap(150,440);const mctx=$('mini').getContext('2d');let mapT=0;
const m2=(x,z)=>[(x/MAP.span+.5)*MAP.size,(z/MAP.span+.5)*MAP.size];
function drawMap(){const x=mctx;x.clearRect(0,0,150,150);x.drawImage(MAP.canvas,0,0);x.fillStyle='rgba(0,0,0,.1)';x.fillRect(0,0,150,150);
 const[vx,vz]=m2(0,0);x.fillStyle='#fff';x.fillRect(vx-3,vz-3,6,6);
 for(const t of TOWERS){const[a,b]=m2(t.cx,t.cz);x.save();x.translate(a,b);x.rotate(Math.PI/4);x.fillStyle=G.badges.includes(t.id)?t.col:'rgba(10,10,14,.8)';x.strokeStyle=t.col;x.lineWidth=2;x.fillRect(-4,-4,8,8);x.strokeRect(-4,-4,8,8);x.restore();}
 for(const n of npcs)if(n.kind==='roamer'&&!G.beaten[n.id]&&(!n.night||night)){const[a,b]=m2(n.x,n.z);x.fillStyle='#ff4d00';x.beginPath();x.arc(a,b,2.2,0,7);x.fill();}
 const o=objective();if(o.at){const[a,b]=m2(o.at.x,o.at.z);const r=5+Math.sin(performance.now()/200)*1.5;x.strokeStyle='#ffcf3f';x.lineWidth=1.5;x.beginPath();x.arc(a,b,r,0,7);x.stroke();}
 const[px,pz]=m2(P.x,P.z);x.save();x.translate(px,pz);x.rotate(-P.yaw);x.fillStyle='#ff4d00';x.strokeStyle='#000';x.lineWidth=1;x.beginPath();x.moveTo(0,-6);x.lineTo(4,4);x.lineTo(0,2);x.lineTo(-4,4);x.closePath();x.fill();x.stroke();x.restore();}
function objective(){if(!G.starter)return{s:'Talk to PROFESSOR QUILL in the village',at:W.SITES.prof};if(G.st.caught<1)return{s:'Throw your cube (RIGHT CLICK) at a wild beast, weaken it, then catch it with BAG → CAPTURE CUBE',at:null};
 for(const t of TOWERS)if(!G.badges.includes(t.id)){const lv=t.leader.team.reduce((a,b)=>Math.max(a,b[1]),0);return{s:`Earn the ${t.badge} at ${t.n} · leader LV ${lv}`,at:{x:t.cx,z:t.cz}};}
 return{s:'ISLAND CHAMPION · fill your dex ('+Object.keys(G.dex.caught).length+'/24 caught)',at:null};}
const labels=new Map(),_cv=new V3();function label(key,txt,pos,col){let el=labels.get(key);if(!el){el=document.createElement('div');el.className='lbl';$('labels').appendChild(el);labels.set(key,el);}if(_cv.copy(pos).applyMatrix4(cam.matrixWorldInverse).z>-.5){el.style.display='none';return;}const v=pos.clone().project(cam);if(v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1){el.style.display='none';return;}el.style.display='';el.style.left=(v.x*.5+.5)*innerWidth+'px';el.style.top=(-v.y*.5+.5)*innerHeight+'px';if(el._t!==txt){el.textContent=txt;el._t=txt;}el.style.color=col||'#fff';el._u=1;}
function sweepLabels(){for(const[k,el]of labels){if(!el._u)el.style.display='none';el._u=0;}}
const dmgEls=[];function floatText(txt,pos,col){const el=document.createElement('div');el.className='dmg';el.textContent=txt;el.style.color=col;$('labels').appendChild(el);dmgEls.push({el,pos:pos.clone(),t:0});}
function stepFloat(dt){for(const d of dmgEls.slice()){d.t+=dt;d.pos.y+=dt*.8;const v=d.pos.clone().project(cam);d.el.style.left=(v.x*.5+.5)*innerWidth+'px';d.el.style.top=(-v.y*.5+.5)*innerHeight+'px';d.el.style.opacity=Math.min(1,(1.2-d.t)*3);if(d.t>1.2){d.el.remove();dmgEls.splice(dmgEls.indexOf(d),1);}}}
let hudT=0;
function hud(dt){if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').style.opacity=0;}if(app!=='world'||$('hud').hidden)return;
 const c=$('clock');c.textContent=opt.time?mmss(timeLeft):'∞';c.classList.toggle('low',!!opt.time&&timeLeft<60);const hr=((G.dayT*24+6)%24);$('daytime').textContent=`DAY ${G.days} · ${String(hr|0).padStart(2,'0')}:${String((hr%1)*60|0).padStart(2,'0')}${night?' · NIGHT':''}`;$('coins').textContent=G.coins;
 if((hudT-=dt)<=0){hudT=.3;const o=objective();$('obj').innerHTML='<b>GOAL</b>'+o.s;drawMap();}
 // aim tag + interact prompt
 const at=aimTarget(30);$('cross').classList.toggle('on',!!at);if(at){const w=at.w,S=SPECIES[w.sp];$('tag').hidden=false;$('tag').innerHTML=`${G.dex.seen[w.sp]?S.n:'???'} <small>LV ${w.mon.lv}</small> ${pill(S.t)}${G.dex.caught[w.sp]?' <span class="cb" style="display:inline-block;width:9px;height:9px;border-radius:2px;background:#2fd6c8;margin-left:4px"></span>':''}`;seen(w.sp);}else $('tag').hidden=true;
 const f=uiOpen()?null:findInteract();$('prompt').hidden=!f;if(f)$('prompt').innerHTML='<kbd>E</kbd>'+f.label;
 if(!f&&P.mount===null&&lead()&&lead().lv>=10&&!uiOpen()&&P.on&&Math.hypot(P.vx,P.vz)>5){$('prompt').hidden=false;$('prompt').innerHTML='<kbd>R</kbd>RIDE '+nameOf(lead());}
 $('lockHint').hidden=locked||uiOpen();
 // npc labels
 for(const n of npcs){if(n.night&&!night)continue;const d=Math.hypot(n.x-P.x,n.z-P.z);if(d<18){const tr=n.kind==='trainer'||n.kind==='roamer'||n.kind==='leader';label('n'+n.id,(n.kind==='leader'?'★ ':'')+n.name+(tr&&G.beaten[n.id]?' ✓':''),new V3(n.x,n.y+2.25,n.z),tr&&!G.beaten[n.id]?(n.kind==='leader'?n.tower.col:'#ffb38a'):'#fff');}}
 if(!G.starter)for(let i=0;i<3;i++){const p=W.SITES.ped[i];if(Math.hypot(p.x-P.x,p.z-P.z)<12)label('ped'+i,SPECIES[STARTERS[i]].n,new V3(p.x,p.y+1.2,p.z),TCOL[SPECIES[STARTERS[i]].t]);}}

/* ================= mining ================= */
const MINE={b:null,t:0};
function stepMine(dt){if(!mouseL||app!=='world'||uiOpen()){MINE.b=null;$('mine').style.opacity=0;return;}const h=W.raycast(cam.position,look(),P.camD+5.5);
 if(!h||!W.B[h.id].mine||Math.hypot(h.x+.5-P.x,h.y+.5-P.y-1,h.z+.5-P.z)>5.5){MINE.b=null;$('mine').style.opacity=0;return;}
 const T=W.terrain(h.x,h.z);if(T.zone){if(!MINE.warn){toast('NO MINING IN TOWN OR AT THE SPIRES');MINE.warn=1;setTimeout(()=>MINE.warn=0,2500);}return;}
 const k=h.x+','+h.y+','+h.z;if(MINE.b!==k){MINE.b=k;MINE.t=0;}MINE.t+=dt;const need=W.B[h.id].mine[1];if(Math.random()<dt*8){PARTS.add(new V3(h.x+.5+rnd(-.4,.4),h.y+1.02,h.z+.5+rnd(-.4,.4)),new V3(rnd(-1,1),rnd(1,3),rnd(-1,1)),{col:h.id===11?'#8af0ff':h.id===6?'#8a6a40':'#8a8a90',life:.5,size:.08,g:12,glow:h.id===11?1:0});snd.play('mine');}
 P.throwT=.3;$('mine').style.opacity=1;$('mine').style.background=`conic-gradient(#ff4d00 ${MINE.t/need*360}deg, rgba(255,255,255,.15) 0)`;
 if(MINE.t>=need){const mat=W.B[h.id].mine[0];W.set(h.x,h.y,h.z,0);G.mats[mat]++;for(let i=0;i<12;i++)PARTS.add(new V3(h.x+.5,h.y+.5,h.z+.5),new V3(rnd(-2,2),rnd(1,4),rnd(-2,2)),{col:mat==='crystal'?'#8af0ff':mat==='wood'?'#8a6a40':'#8a8a90',life:.9,size:.14,g:16,glow:mat==='crystal'?1:0});snd.play('break2');toast('+1 '+MATS[mat],1.2);MINE.b=null;drawThrow();saveSoon();}}

/* ================= NPC behaviour ================= */
let night=false;
function npcStep(n,dt){if(n.night&&!night){n.m.obj.visible=false;n.icon.visible=false;return;}const far=Math.abs(n.x-P.x)>72||Math.abs(n.z-P.z)>72;n.m.obj.visible=!far;if(far)return;let speed=0;n.t-=dt;if(n.cool>0)n.cool-=dt;
 const tr=(n.kind==='trainer'||n.kind==='roamer')&&!G.beaten[n.id];const dx=P.x-n.x,dz=P.z-n.z,d=Math.hypot(dx,dz);
 if(n.state==='approach'){n.yaw=Math.atan2(dx,dz);speed=3.4;if(d<2.2||n.t<=0){n.state='idle';n.icon.visible=false;if(app==='world'){say(n.name,[trainerLine(n)],()=>startBattle({kind:'trainer',npc:n}));}}}
 else{if(tr&&app==='world'&&!uiOpen()&&!(n.cool>0)&&d<(n.sight||7)&&Math.abs(P.y-n.y)<3&&G.party.length&&healthy()){const fx=Math.sin(n.yaw),fz=Math.cos(n.yaw);if((dx*fx+dz*fz)/d>.2||d<3.5){const e=new V3(n.x,n.y+1.6,n.z),dir=new V3(dx,P.y-n.y,dz).normalize();if(!W.raycast(e,dir,d)){n.state='approach';n.t=4;n.icon.visible=true;snd.play('alert');n.cool=8;}}}
  if(n.wander&&n.state==='idle'){if(n.t<=0){n.t=rnd(2,5);n.walk=Math.random()<.55;n.tyaw=Math.random()*6.283;const hx=n.home.x-n.x,hz=n.home.z-n.z;if(Math.hypot(hx,hz)>n.wander)n.tyaw=Math.atan2(hx,hz);}if(n.walk){let dy=n.tyaw-n.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));n.yaw+=dy*Math.min(1,dt*4);speed=1.3;}}
  if(!n.wander&&d<5&&n.kind!=='trainer'&&n.kind!=='leader'){let dy=Math.atan2(dx,dz)-n.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));n.yaw+=dy*Math.min(1,dt*3);}}
 if(speed>0){const nx=n.x+Math.sin(n.yaw)*speed*dt,nz=n.z+Math.cos(n.yaw)*speed*dt;const gy=W.ground(nx,nz,n.y+2);if(gy-n.y<1.2&&gy%1===0&&!collidesNpc(nx,gy,nz)){n.x=nx;n.z=nz;n.y+=(gy-n.y)*Math.min(1,dt*10);}else{n.tyaw=n.yaw+Math.PI;n.yaw+=Math.PI*.5;}}
 n.m.obj.position.set(n.x,n.y,n.z);n.m.obj.rotation.y=n.yaw;animHuman(n.m,dt,speed/3,{look:n.state==='approach'?0:undefined});if(n.icon.visible)n.icon.position.set(n.x,n.y+2.5,n.z);}
function collidesNpc(x,y,z){return W.solid(W.get(Math.floor(x),Math.floor(y),Math.floor(z)))||W.solid(W.get(Math.floor(x),Math.floor(y+1),Math.floor(z)));}

/* ================= coroutines + tweens (battle presentation) ================= */
let co=null,coWait=0,skipReq=false;const tweens=[];
function runCo(g){co=g;coWait=0;}
function stepCo(dt){if(!co)return;coWait-=dt;if(skipReq){coWait=Math.min(coWait,.05);skipReq=false;}let guard=0;while(co&&coWait<=0&&guard++<50){const r=co.next();if(r.done){co=null;break;}coWait+=(r.value??0);}}
function skipMsg(){if(BT&&BT.busy)skipReq=true;}
function tw(d,f,end){tweens.push({t:0,d,f,end});}
function stepTweens(dt){for(const t of tweens.slice()){t.t+=dt;const k=Math.min(1,t.t/t.d);t.f(k,dt);if(k>=1){tweens.splice(tweens.indexOf(t),1);t.end&&t.end();}}}

/* ================= battles ================= */
let BT=null;const camBase={pos:new V3(),look:new V3()};let camShake=0;const curLook=new V3();
function startBattle(o){if(app!=='world'||BT)return;const isW=o.kind==='wild';let foes,name='',npc=o.npc,w=o.w;
 if(isW){foes=[w.mon];seen(w.sp);}else{const tough=opt.diff===2?2:opt.diff===0?-1:0;foes=npc.team.map(([sp,lv])=>mkMon(sp,Math.max(2,lv+tough)));name=npc.name;foes.forEach(f=>seen(f.sp));}
 if(P.mount)toggleMount();for(const p of proj.splice(0)){scene.remove(p.m.obj);}
 const smart=isW?0:(npc.kind==='leader'?[.6,.9,1][opt.diff]:[.35,.6,.85][opt.diff]);
 const b=new Battle(G.party,foes,G.bag,{kind:o.kind,name,leader:npc&&npc.kind==='leader',smart});
 // arena placement
 const Pp=new V3(P.x,P.y,P.z);let F=isW?new V3(w.x,w.y,w.z):new V3(npc.x,npc.y,npc.z);let d=new V3(F.x-Pp.x,0,F.z-Pp.z);if(d.length()<.5)d.set(-Math.sin(P.yaw),0,-Math.cos(P.yaw));d.normalize();
 const gfn=(x,z,y)=>W.ground(x,z,y);const top=Math.max(Pp.y,F.y)+3;let myPos,foePos,center;
 // pick the arena axis with the flattest, driest footing (rotating around the foe / the midpoint)
 {const mid0=Pp.clone().add(F).multiplyScalar(.5);let bestS=1e9;const base=Math.atan2(d.x,d.z);for(const da of[0,.45,-.45,.9,-.9,1.4,-1.4,2,-2,Math.PI]){const a=base+da,dd=new V3(Math.sin(a),0,Math.cos(a));
   const fp=isW?F.clone():mid0.clone().addScaledVector(dd,2.7),mp=isW?F.clone().addScaledVector(dd,-5.4):mid0.clone().addScaledVector(dd,-2.7);const fy=isW&&SPECIES[w.sp].fly?F.y:gfn(fp.x,fp.z,top),my=gfn(mp.x,mp.z,top);const cy=gfn((fp.x+mp.x)/2,(fp.z+mp.z)/2,top);
   let sc=Math.abs(fy-my)*2+Math.abs(cy-(fy+my)/2)*1.5+Math.abs(da)*.35+(my%1?6:0)+(fy%1&&!(isW&&SPECIES[w.sp].fly)&&SPECIES[b.F.sp].t!=='TIDE'?3:0);
   for(const k of[.25,.5,.75]){const q=fp.clone().lerp(mp,k);if(Math.abs(gfn(q.x,q.z,top)-(fy+my)/2)>1.2)sc+=1.5;}
   if(sc<bestS){bestS=sc;d=dd;foePos=fp;myPos=mp;foePos.y=fy;myPos.y=my;}}}
 center=myPos.clone().add(foePos).multiplyScalar(.5);center.y=gfn(center.x,center.z,top);
 const side=new V3(d.z,0,-d.x);
 // player + trainer stand behind their beasts
 const ps=myPos.clone().addScaledVector(d,-2.4);P.x=ps.x;P.z=ps.z;P.y=gfn(ps.x,ps.z,top);P.vx=P.vy=P.vz=0;P.face=Math.atan2(d.x,d.z);
 if(npc){const ts=foePos.clone().addScaledVector(d,2.2).addScaledVector(side,-1.1);npc.x=ts.x;npc.z=ts.z;npc.y=gfn(ts.x,ts.z,top);npc.yaw=Math.atan2(-d.x,-d.z);npc.state='idle';npc.icon.visible=false;}
 // camera side with the clearest view
 const size=Math.max(template(b.F.sp).h,template(b.A.sp).h*.8);const sf=clamp(size*.55+.7,1,2.2);let best=null;const tgt=center.clone().add(new V3(0,.8*sf,0));
 for(const s of[1,-1,.45,-.45])for(const h of[0,1.6,3.2]){const back=Math.abs(s)<1?3.2:1.3;const cp=center.clone().addScaledVector(d,-back*sf).addScaledVector(side,s*6.2*sf).add(new V3(0,1.7+.9*sf+h,0));const dir=cp.clone().sub(tgt);const L=dir.length();dir.normalize();const hit=W.raycast(tgt,dir,L,false,true);const free=hit&&!hit.miss?hit.t:L+5;const fol=hit?hit.fol:0;
  const fh=W.raycast(cp,foePos.clone().add(new V3(0,.5,0)).sub(cp).normalize(),cp.distanceTo(foePos),false,true);const mh=W.raycast(cp,myPos.clone().add(new V3(0,.5,0)).sub(cp).normalize(),cp.distanceTo(myPos),false,true);const fb=(fh&&!fh.miss?3:0)+(mh&&!mh.miss?3:0)+(mh?mh.fol*.8:0);const sc=Math.min(free,L)-fol*1.2-fb-(fh?fh.fol:0)*.8-h*.35-(Math.abs(s)<1?.8:0);if(!best||sc>best.sc+.2)best={free,cp,s,L,sc};}
 const cp=best.cp;if(best.free<best.L){const dir=cp.clone().sub(tgt).normalize();cp.copy(tgt).addScaledVector(dir,Math.max(2.5,best.free-.6));}
 camBase.pos.copy(cp);camBase.look.copy(center).add(new V3(0,.25*sf,0)).addScaledVector(d,.25*sf);curLook.copy(cam.position).add(look().multiplyScalar(10));
 {const off=side.clone().multiplyScalar(-Math.sign(best.s)*1.4);P.x+=off.x;P.z+=off.z;P.y=gfn(P.x,P.z,top);}
 {const c2=cam.clone();c2.position.copy(cp);c2.lookAt(camBase.look);c2.updateMatrixWorld();const a=myPos.clone().project(c2),f2=foePos.clone().project(c2);$('bui').classList.toggle('flip',a.x>f2.x);}
 // models
 let foeM;if(isW){foeM=w.m;w.icon.visible=false;const i=wild.indexOf(w);if(i>=0)wild.splice(i,1);}else{foeM=makeCreature(b.F.sp);foeM.obj.visible=false;scene.add(foeM.obj);}
 foeM.obj.position.copy(foePos);foeM.obj.rotation.y=Math.atan2(-d.x,-d.z);
 BT={b,kind:o.kind,w,npc,d,side,center,myPos,foePos,my:{m:null,yaw:Math.atan2(d.x,d.z),pos:myPos},foe:{m:foeM,yaw:Math.atan2(-d.x,-d.z),pos:foePos},menu:'wait',busy:true,camT:0,disp:{me:0,foe:b.F.hp},focus:null,camS:best.s};
 for(const n of npcs){n.icon.visible=false;if(n.state==='approach'&&n!==npc){n.state='idle';n.cool=6;}}W.WU.uClear.value.set(center.x,center.y,center.z,6.5);
 RING.show(center,4.4,isW?TCOL[SPECIES[w.sp].t]:npc.tower?npc.tower.col:'#ff8a3a',gfn);
 app='battle';G.st.battles++;exitLockSoft();mouseL=false;$('hud').hidden=true;$('bui').hidden=false;$('prompt').hidden=true;$('labels').querySelectorAll('.lbl').forEach(e=>e.style.display='none');
 snd.setMusic('battle');snd.play(isW?'roar':'alert');renderCards();setMsg('');battleMenu('wait');runCo(introCo());}
function setMsg(s){$('bmsg').textContent=s;}
function* msg(s,t=1){if(!s)return;setMsg(s);yield t;}
function sideObj(side){return side==='me'?BT.my:BT.foe;}
function mid(o,f=.55){const m=o.m;return o.m.obj.position.clone().add(new V3(0,m.h*f*(o.m.obj.scale.y||1),0));}
function* popOut(side){const o=sideObj(side),b=BT.b;const mon=side==='me'?b.A:b.F;if(side==='me'||!o.m||o.m.id!==mon.sp){if(o.m)scene.remove(o.m.obj);o.m=makeCreature(mon.sp);scene.add(o.m.obj);}
 const m=o.m;m.obj.position.copy(o.pos);m.obj.rotation.y=o.yaw;m.obj.visible=false;m.obj.scale.setScalar(1);
 // cube arc from the thrower
 const from=side==='me'?new V3(P.x,P.y+1.5,P.z):BT.npc?new V3(BT.npc.x,BT.npc.y+1.5,BT.npc.z):o.pos.clone();const to=o.pos.clone().add(new V3(0,.4,0));const cube=makeCube('cube');scene.add(cube.obj);snd.play('throw');
 if(side==='me')P.throwT=.45;
 tw(.45,k=>{cube.obj.position.lerpVectors(from,to,k);cube.obj.position.y+=Math.sin(k*Math.PI)*1.6;cube.obj.rotation.x=k*9;},()=>{scene.remove(cube.obj);});yield .45;
 PARTS.burst(to,'CUBE',40,3.5);snd.play('pop');m.obj.visible=true;m.obj.scale.setScalar(.01);tw(.35,k=>{const s=k<.7?k/.7*1.15:1.15-(k-.7)/.3*.15;m.obj.scale.setScalar(Math.max(.01,s));});seen(mon.sp);renderCards();yield .45;}
function* introCo(){const b=BT.b;BT.camT=0;
 if(BT.kind==='wild'){yield .5;yield* msg('A WILD '+SPECIES[b.F.sp].n+' APPEARED!',1.2);}
 else{yield .4;yield* msg(BT.b.tname+' WANTS TO BATTLE!',1.1);yield* popOut('foe');yield* msg(BT.b.tname+' SENT OUT '+nameOf(b.F)+'!',.7);}
 yield* popOut('me');yield* msg('GO, '+nameOf(b.A)+'!',.6);BT.disp.me=b.A.hp;BT.busy=false;battleMenu('main');}
function battleMenu(mode){if(!BT)return;BT.menu=mode;const el=$('bmenu');el.classList.toggle('wait',mode==='wait');const b=BT.b;
 if(mode==='wait'){nav=null;el.querySelectorAll('button').forEach(x=>x.classList.remove('sel'));return;}
 if(mode==='main'){setMsg('WHAT WILL '+nameOf(b.A)+' DO?');el.innerHTML=[['FIGHT','MOVES'],['PARTY','SWITCH'],['BAG','ITEMS & CUBES'],['RUN',BT.kind==='wild'?'ESCAPE':'NOT VS TRAINERS']].map(([t,s],i)=>`<button data-nav data-k="${i+1}" data-a="${t}">${t}<small>${s}</small><span class="k">${i+1}</span></button>`).join('');
  el.querySelectorAll('button').forEach(x=>x.onclick=()=>{const a=x.dataset.a;if(BT.busy)return;if(a==='FIGHT')battleMenu('moves');else if(a==='PARTY')openPanel('switch');else if(a==='BAG')openPanel('bag');else battleAct({t:'run'});});setNav(el,2,null);}
 if(mode==='moves'){const ft=SPECIES[b.F.sp].t;el.innerHTML=b.A.moves.map((k,i)=>{const M=MOVES[k];const e=M.pow?eff(M.type,ft):1;return`<button class="mv" data-nav data-k="${i+1}" data-i="${i}" style="--tc:${TCOL[M.type]}">${M.n}<small>${M.type} · ${M.pow?'POW '+M.pow:'STATUS'} · ACC ${M.acc}</small>${M.pow&&G.dex.seen[b.F.sp]&&e!==1?`<span class="ef ${e>1?'s':'w'}">${e>1?'SUPER':'WEAK'}</span>`:''}<span class="k">${i+1}</span></button>`;}).join('')+(b.A.moves.length%2?'<span></span>':'');
  el.querySelectorAll('button').forEach(x=>x.onclick=()=>{if(BT.busy)return;battleAct({t:'move',i:+x.dataset.i});});setNav(el,2,()=>battleMenu('main'));}}
function battleAct(a){if(!BT||BT.busy)return;let ev;if(a.t==='force')ev=BT.b.forceSwitch(a.i);else ev=BT.b.turn(a);if(!ev.length){toast('YOU CAN\'T DO THAT');battleMenu('main');return;}BT.busy=true;battleMenu('wait');runCo(present(ev));}
const TSND={EMBER:'ember',TIDE:'tide',SPARK:'spark',FROST:'frost',WIND:'whoosh',LEAF:'whoosh',STONE:'hit',SHADE:'whoosh',BASIC:'whoosh'};
function* animMove(side,k){const M=MOVES[k],A=sideObj(side),D=sideObj(side==='me'?'foe':'me');if(!A.m||!D.m)return;const a=mid(A.m?A:A,.6),bp=mid(D,.5),type=M.type;BT.focus=side;snd.play(TSND[type]||'whoosh');
 if(M.anim==='lunge'){const o=A.m.obj,base=o.position.clone(),dir=bp.clone().sub(a);dir.y=0;const L=dir.length();dir.normalize();tw(.42,k=>{const s=Math.sin(k*Math.PI);o.position.copy(base).addScaledVector(dir,s*Math.max(0,L-1.2)*.8);o.position.y=base.y+s*.35;});yield .22;PARTS.burst(bp,type,30,4);yield .24;}
 else if(M.anim==='shot'){for(let i=0;i<3;i++){const st=i*.09;tw(.38,k=>{const kk=clamp(k*1.25-st*2.6,0,1);if(kk>0&&kk<1)PARTS.stream(a,bp,type,kk,2,{arc:.6,size:.16});});}yield .5;PARTS.burst(bp,type,26,3.5);}
 else if(M.anim==='beam'){tw(.65,k=>{for(let j=0;j<3;j++)PARTS.stream(a,bp,type,Math.min(1,k*1.6)*Math.random(),2,{spread:.25,size:.2,life:.3});});yield .4;PARTS.burst(bp,type,40,5);camShake=.25;yield .3;}
 else if(M.anim==='rain'){tw(.7,(k,dt)=>{for(let j=0;j<3;j++){const p=bp.clone().add(new V3(rnd(-1.4,1.4),4+rnd(0,1.5),rnd(-1.4,1.4)));PARTS.add(p,new V3(0,-9,0),{col:PAL[type][j%3],life:.55,size:type==='STONE'?.32:.16,g:type==='STONE'?14:4,glow:type==='STONE'?0:1});}});yield .62;PARTS.burst(bp,type,24,3);camShake=.2;}
 else if(M.anim==='bolt'){for(let n=0;n<2;n++){const pts=[bp.clone().add(new V3(rnd(-1,1),7,rnd(-1,1)))];for(let i=1;i<7;i++){const t=i/6;pts.push(pts[0].clone().lerp(bp,t).add(new V3(rnd(-.5,.5),0,rnd(-.5,.5))));}
   tw(.25,()=>{for(let i=0;i<6;i++)for(let j=0;j<4;j++){const q=pts[i].clone().lerp(pts[i+1],Math.random());PARTS.add(q,new V3(0,0,0),{col:j%2?'#ffffff':'#fff27a',life:.12,size:.16,g:0,glow:1.6});}});yield .18;}PARTS.burst(bp,'SPARK',30,4);camShake=.3;flashWhite(.05);yield .2;}
 else if(M.anim==='aura'){const c=A.m.obj.position;tw(.6,k=>{for(let j=0;j<3;j++){const ang=k*14+j*2.1,r=.7+A.m.r*.5;PARTS.add(new V3(c.x+Math.cos(ang)*r,c.y+k*A.m.h*1.4,c.z+Math.sin(ang)*r),new V3(0,1.5,0),{col:PAL[type][j],life:.5,size:.12,g:-1,glow:1});}});yield .65;}
 else if(M.anim==='cloud'){tw(.4,k=>PARTS.stream(a,bp,type,k,3,{arc:.4,spread:.4,size:.2,life:.5}));yield .4;const c=D.m.obj.position;tw(.45,k=>{for(let j=0;j<3;j++){const ang=k*10+j*2.1;PARTS.add(new V3(c.x+Math.cos(ang)*.9,c.y+.3+k*D.m.h,c.z+Math.sin(ang)*.9),new V3(0,.5,0),{col:PAL[type][j],life:.6,size:.18,g:0,glow:1});}});yield .45;}
 BT.focus=null;}
function hpFlash(side,amt,ef,crit,type){const o=sideObj(side);if(!o.m)return;o.m.flash=.3;const base=o.m.obj.position.clone(),dir=side==='me'?BT.d.clone().negate():BT.d.clone();tw(.3,k=>{o.m.obj.position.copy(base).addScaledVector(dir,Math.sin(k*Math.PI)*.35);});
 floatText((crit?'CRIT ':'')+'-'+amt,mid(o,1.05),ef>1?'#ffcf3f':ef<1?'#a8b0c0':'#ffffff');camShake=Math.max(camShake,ef>1?.35:.18);snd.play(ef>1?'super':ef<1?'weak':'hit');}
function* present(ev){const b=BT.b;
 for(const e of ev){switch(e.e){
  case'msg':yield* msg(e.s,.85);break;
  case'use':setMsg(e.s);yield .25;yield* animMove(e.side,e.move);yield .15;break;
  case'miss':snd.play('miss');yield* msg(e.s,.7);break;
  case'dmg':hpFlash(e.side,e.amt,e.ef,e.crit,e.type);yield .55;break;
  case'heal':{const o=sideObj(e.side);if(o.m)PARTS.burst(mid(o,.4),'HEAL',30,2.5,{lift:2});snd.play('heal');if(e.s)yield* msg(e.s,.8);else yield .5;break;}
  case'status':{const o=sideObj(e.side);if(o.m)PARTS.burst(mid(o),{burn:'EMBER',freeze:'FROST',sleep:'SHADE',para:'SPARK'}[e.st],34,2.5);snd.play('status');renderCards();yield* msg(e.s,.9);break;}
  case'stat':{const o=sideObj(e.side);if(o.m){const c=o.m.obj.position;for(let i=0;i<20;i++)PARTS.add(new V3(c.x+rnd(-.6,.6),c.y+(e.n>0?0:o.m.h),c.z+rnd(-.6,.6)),new V3(0,e.n>0?3:-3,0),{col:e.n>0?'#ffcf3f':'#6a8aff',life:.6,size:.1,g:0,glow:1});}snd.play('stat');yield* msg(e.s,.8);break;}
  case'statusdmg':{const o=sideObj(e.side);if(o.m){o.m.flash=.2;PARTS.burst(mid(o),'EMBER',20,2);}snd.play('ember');yield* msg(e.s,.8);break;}
  case'cant':{const o=sideObj(e.side);if(o.m)PARTS.burst(mid(o,1),{freeze:'FROST',sleep:'SHADE',para:'SPARK'}[e.st]||'BASIC',16,1.5);yield* msg(e.s,.9);break;}
  case'cure':renderCards();if(e.s)yield* msg(e.s,.7);break;
  case'faint':{const o=sideObj(e.side);snd.play('faint');if(o.m){const m=o.m,y0=m.obj.position.y;tw(.8,k=>{m.obj.scale.set(1,Math.max(.02,1-k),1);m.obj.position.y=y0-k*.2;m.mat.opacity=1;},()=>{m.obj.visible=false;});}setMsg(e.s);yield 1.1;break;}
  case'xp':{if(e.uid===b.A.uid)yield .35;break;}
  case'lvl':{snd.play('level');if(e.uid===b.A.uid&&BT.my.m)PARTS.burst(mid(BT.my,.3),'HEAL',30,2,{lift:3});renderCards();yield* msg(e.name+' GREW TO LV '+e.lv+'!',1.1);break;}
  case'learn':yield* msg(e.name+' LEARNED '+MOVES[e.move].n+'!'+(e.forgot?' (FORGOT '+MOVES[e.forgot].n+')':''),1.2);break;
  case'recall':{const o=BT.my;if(o.m){const m=o.m;PARTS.burst(mid(o),'CUBE',20,2);tw(.3,k=>m.obj.scale.setScalar(Math.max(.01,1-k)),()=>{scene.remove(m.obj);});o.m=null;}yield* msg(e.s,.5);break;}
  case'switch':{if(e.side==='me'){BT.disp.me=b.A.hp;yield* popOut('me');}else{const o=BT.foe;if(o.m)scene.remove(o.m.obj);o.m=null;BT.disp.foe=b.F.hp;yield* popOut('foe');}renderCards();yield* msg(e.s,.8);break;}
  case'item':yield* msg(e.s,.9);renderCards();break;
  case'cube':yield* catchCo(e);break;
  case'run':yield* msg(e.s,.8);break;
  case'need':break;
  case'end':break;}
  renderCards();}
 if(b.over){yield* endCo();return;}
 if(b.need){BT.busy=false;openPanel('switch',{forced:true});return;}
 BT.busy=false;battleMenu('main');}
function* catchCo(e){const o=BT.foe,m=o.m;setMsg(e.s);P.throwT=.45;const from=new V3(P.x,P.y+1.5,P.z),to=mid(o,.6);const cube=makeCube(e.k);scene.add(cube.obj);snd.play('throw');
 tw(.55,k=>{cube.obj.position.lerpVectors(from,to,k);cube.obj.position.y+=Math.sin(k*Math.PI)*2;cube.obj.rotation.x=k*10;cube.obj.rotation.y=k*6;});yield .55;
 flashWhite(.05);PARTS.burst(to,e.k==='great'?'GREAT':'CUBE',40,3);snd.play('pop');const sc0=m.obj.scale.x;tw(.35,k=>{m.obj.scale.setScalar(Math.max(.01,sc0*(1-k)));m.flash=.3;},()=>{m.obj.visible=false;});yield .4;
 const gy=o.pos.y+.16;tw(.3,k=>{cube.obj.position.y=lerp(to.y,gy,k*k);cube.obj.rotation.set(0,cube.obj.rotation.y,0);});yield .45;
 for(let i=0;i<e.shakes;i++){snd.play('shake');tw(.5,k=>{cube.obj.rotation.z=Math.sin(k*Math.PI*2)*.45;});setMsg('.'.repeat(i+1));yield .75;}
 if(e.ok){PARTS.burst(cube.obj.position.clone().add(new V3(0,.3,0)),'GREAT',50,3,{lift:2});snd.play('catch');tw(1,()=>{});yield .4;BT.caughtCube=cube;}
 else{scene.remove(cube.obj);PARTS.burst(cube.obj.position,'CUBE',40,4);snd.play('break');m.obj.visible=true;tw(.3,k=>m.obj.scale.setScalar(Math.max(.01,sc0*k)));yield .4;}}
function* endCo(){const b=BT.b,r=b.over;
 if(r==='win'){if(BT.kind==='wild'){G.st.wild++;}G.coins+=b.coins||0;snd.play('coin');yield* msg((b.kind==='trainer'?'YOU DEFEATED '+b.tname+'! ':'')+'+'+b.coins+' COINS',1.3);
  if(BT.npc){const n=BT.npc;G.beaten[n.id]=1;G.st.trainers++;if(n.kind==='leader'){const t=n.tower;if(!G.badges.includes(t.id)){G.badges.push(t.id);drawBadges();yield* badgeCo(t);}}}}
 if(r==='caught'){const mon=b.F;const where=addMon(mon);yield* msg(nameOf(mon)+(where==='party'?' JOINED YOUR PARTY!':' WAS SENT TO THE PC BOX.'),1.3);if(BT.w)BT.w.caught=true;}
 if(r==='lose'){yield* msg('YOU BLACKED OUT...',1.4);}
 if(r==='run'){}
 // evolutions
 for(let i=0;i<G.party.length;i++){const m=G.party[i];if(m.evolve&&m.hp>0&&r!=='lose')yield* evolveCo(m,i);}
 yield* endBattle(r);}
function* badgeCo(t){snd.play('badge');const el=$('badgeFx');el.hidden=false;el.style.color=t.col;el.querySelector('b').textContent=t.badge;el.querySelector('span').textContent=G.badges.length+' / 3 BADGES';el.querySelector('.bd').style.background=t.col;yield 2.6;el.hidden=true;}
function* evolveCo(m,i){const from=m.sp,to=m.evolve;delete m.evolve;const o=BT.my;if(o.m)scene.remove(o.m.obj);let mm=makeCreature(from);mm.obj.position.copy(o.pos);mm.obj.rotation.y=o.yaw;scene.add(mm.obj);o.m=mm;BT.focus='me';
 yield* msg('WHAT? '+nameOf(m)+' IS EVOLVING!',1);snd.play('evolve');
 tw(2.4,(k,dt)=>{const f=.5+Math.sin(k*k*60)*.5;o.m.flash=.25*f+.05;o.m.mat.emissive.setRGB(f*2,f*2,f*2);o.m.obj.rotation.y=o.yaw+k*k*12;const c=o.m.obj.position;for(let j=0;j<2;j++){const ang=Math.random()*6.28;PARTS.add(new V3(c.x+Math.cos(ang)*1.4,c.y+Math.random()*2,c.z+Math.sin(ang)*1.4),new V3(-Math.cos(ang)*2,1,-Math.sin(ang)*2),{col:'#ffffff',life:.5,size:.1,g:0,glow:1.5});}});
 yield 2.4;flashWhite(.2);scene.remove(o.m.obj);const oldName=nameOf(m);m.sp=to;const oldMax=m.hp;m.hp=Math.min(maxHp(m),m.hp+Math.max(0,maxHp(m)-oldMax));o.m=makeCreature(to);o.m.obj.position.copy(o.pos);o.m.obj.rotation.y=o.yaw;scene.add(o.m.obj);caught(to);G.st.evolved++;
 PARTS.burst(mid(o),'GREAT',60,4,{lift:2});snd.play('catch');yield* msg('CONGRATULATIONS! '+oldName+' EVOLVED INTO '+SPECIES[to].n+'!',1.8);BT.focus=null;}
function* endBattle(r){RING.hide();W.WU.uClear.value.w=0;BT.focus=null;yield .4;
 // tear down models
 if(BT.my.m)scene.remove(BT.my.m.obj);if(BT.caughtCube)scene.remove(BT.caughtCube.obj);
 if(BT.kind==='wild'){const w=BT.w;if(r==='run'&&w){w.m.obj.visible=true;w.m.obj.scale.setScalar(1);w.state='flee';w.t=3;w.cool=8;w.x=BT.foe.pos.x;w.z=BT.foe.pos.z;wild.push(w);}else if(r==='lose'&&w){w.m.obj.visible=true;w.m.obj.scale.setScalar(1);w.state='wander';w.cool=10;wild.push(w);}else if(w){scene.remove(w.m.obj);scene.remove(w.icon);}}
 else if(BT.foe.m)scene.remove(BT.foe.m.obj);
 if(BT.npc){const n=BT.npc;n.cool=12;if(n.kind!=='roamer'){n.x=n.home.x;n.z=n.home.z;n.y=n.hy;}}
 G.party.forEach(m=>{if(m.hp<=0)m.status=null;});
 const lost=r==='lose';BT=null;app='world';$('bui').hidden=true;$('hud').hidden=false;snd.setMusic(night?'night':'field');drawParty();
 if(lost){G.st.blackouts++;const loss=Math.floor(G.coins*.15);G.coins-=loss;respawn();for(const m of G.party){m.hp=maxHp(m);m.status=null;}drawParty();say('MENDER SOL',['You blacked out and were carried back to the village.','I healed your team.'+(loss?' You dropped '+loss+' coins on the way.':'')]);}
 checkChampion();save();}
function checkChampion(){if(G.badges.length>=3&&!G.champion){G.champion=true;setTimeout(()=>{if(app==='world')gameOver('champion');},400);}}
function renderCards(){if(!BT)return;const b=BT.b;const F=b.F,A=b.A,SF=SPECIES[F.sp],SA=SPECIES[A.sp];
 $('foeCard').innerHTML=`<div class="nm">${SF.n} ${pill(SF.t)}${G.dex.caught[F.sp]&&BT.kind==='wild'?'<span class="own" title="caught before"></span>':''}${F.status?`<span class="st ${F.status}">${STATUS_N[F.status]}</span>`:''}<span class="lv">LV ${F.lv}</span></div><div class="bar"><i id="fhp"></i></div>${BT.kind==='trainer'?`<div class="nums"><span>${b.tname}</span><span>${'●'.repeat(b.foes.filter(f=>f.hp>0).length)}${'○'.repeat(b.foes.filter(f=>f.hp<=0).length)}</span></div>`:''}`;
 $('meCard').innerHTML=`<div class="nm">${nameOf(A)} ${pill(SA.t)}${A.status?`<span class="st ${A.status}">${STATUS_N[A.status]}</span>`:''}<span class="lv">LV ${A.lv}</span></div><div class="bar"><i id="mhp"></i></div><div class="nums"><span id="mhpn"></span><span>${'●'.repeat(G.party.filter(m=>m.hp>0).length)}${'○'.repeat(G.party.filter(m=>m.hp<=0).length)}</span></div><div class="xp"><i style="width:${clamp((A.xp-xpFor(A.lv))/(xpFor(A.lv+1)-xpFor(A.lv)),0,1)*100}%"></i></div>`;updBars(0);}
function updBars(dt){if(!BT)return;const b=BT.b;const D=BT.disp;D.me+=(b.A.hp-D.me)*Math.min(1,dt*5);D.foe+=(b.F.hp-D.foe)*Math.min(1,dt*5);if(dt===0){}const set=(id,v,mx)=>{const el=$(id);if(!el)return;const pc=clamp(v/mx,0,1);el.style.width=pc*100+'%';el.className=pc<.25?'low':pc<.5?'mid':'';};set('mhp',D.me,maxHp(b.A));set('fhp',D.foe,maxHp(b.F));const n=$('mhpn');if(n)n.textContent='HP '+Math.round(D.me)+' / '+maxHp(b.A);}
function stepBattle(dt){if(!BT)return;BT.camT+=dt;if(cam.fov!==50){cam.fov=50;cam.updateProjectionMatrix();}const b=BT.b;
 // camera: ease into the side view, gentle drift, focus nudge, shake
 const t=performance.now()/1000;const k=Math.min(1,dt*2.4);const drift=new V3(Math.sin(t*.25)*.6,Math.sin(t*.31)*.2,Math.cos(t*.21)*.4);const want=camBase.pos.clone().add(drift);
 const lk=camBase.look.clone();if(BT.focus){const o=sideObj(BT.focus);if(o.m)lk.lerp(o.m.obj.position.clone().add(new V3(0,.1,0)),.25);}
 cam.position.lerp(want,k);curLook.lerp(lk,k);if(camShake>0){camShake=Math.max(0,camShake-dt);const a=camShake*camShake*1.4;cam.position.add(new V3(rnd(-a,a),rnd(-a,a),rnd(-a,a)));}cam.lookAt(curLook);
 for(const s of['my','foe']){const o=BT[s];if(o.m&&o.m.obj.visible){const sp=o===BT.foe?b.F:b.A;animate(o.m,dt,0,!!SPECIES[o.m.id].fly&&o===BT.foe);const st=sp.status;if(st&&Math.random()<dt*6){const c=o.m.obj.position;PARTS.add(new V3(c.x+rnd(-.4,.4),c.y+o.m.h*rnd(.3,1.1),c.z+rnd(-.4,.4)),new V3(0,st==='sleep'?.6:1.2,0),{col:{burn:'#ff8a20',freeze:'#bff4ff',sleep:'#c8c8ff',para:'#fff27a'}[st],life:.6,size:.08,g:-.5,glow:1});}if(st==='freeze')o.m.mat.emissive.setRGB(.05,.15,.25);}}
 updBars(dt);
 // trainer + player idle
 avatar.obj.position.set(P.x,P.y,P.z);avatar.obj.rotation.y=P.face;animHuman(avatar,dt,0,{throw:P.throwT>0?P.throwT/.45:0});if(P.throwT>0)P.throwT-=dt;}

/* ================= lantern lights ================= */
let llT=0,llSet=[];function lanternLights(dt,nightF){if((llT-=dt)<=0){llT=.4;llSet=W.LANTERNS.map(v=>[v.distanceToSquared(cam.position),v]).sort((a,b)=>a[0]-b[0]).slice(0,4).map(a=>a[1]);}const f=performance.now()/1000;
 for(let i=0;i<4;i++){const v=llSet[i];if(!v||nightF<.02){LL[i].intensity=0;continue;}LL[i].position.copy(v);LL[i].intensity=10*nightF*(1+.06*Math.sin(f*11+i*2));}}

/* ================= save / load ================= */
const SKEY='blockbeasts_save';let saveT=0;const saveSoon=()=>{saveT=2;};
function save(){if(!G||!G.starter&&!G.party.length)return;try{localStorage.setItem(SKEY,JSON.stringify({v:1,G,P:{x:P.x,y:P.y,z:P.z,yaw:P.yaw},edits:W.edits,uid:Math.max(0,...G.party.concat(G.box).map(m=>m.uid))+1}));}catch(e){}}
function load(){try{return JSON.parse(localStorage.getItem(SKEY));}catch(e){return null;}}

/* ================= session flow ================= */
function clearWorld(){for(const w of wild.slice())removeWild(w);for(const p of proj.splice(0))scene.remove(p.m.obj);if(P.mount){scene.remove(P.mount.m.obj);P.mount=null;}PARTS.clear();RING.hide();}
function begin(){app='world';document.body.classList.remove('ended');timeLeft=opt.time;$('menu').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;$('bui').hidden=true;document.body.classList.add('playing');drawParty();drawBadges();drawThrow();snd.setMusic(night?'night':'field');lockReq();
 for(const n of npcs){n.x=n.home.x;n.z=n.home.z;n.y=n.hy;n.state='idle';n.cool=0;n.icon.visible=false;}peds.forEach((m,i)=>m.obj.visible=!G.starter);
 if(!G.starter)toast('TALK TO PROFESSOR QUILL',3);}
function newGame(){clearWorld();G=freshState();W.setEdits({});const S=W.SITES;P.x=S.spawn.x;P.z=S.spawn.z;P.y=S.villageY+.02;P.vx=P.vy=P.vz=0;P.yaw=Math.atan2(-(S.prof.x-P.x),-(S.prof.z-P.z));P.pitch=-.12;P.face=P.yaw+Math.PI;night=false;begin();save();}
function contGame(){const s=load();if(!s){newGame();return;}clearWorld();G={...freshState(),...s.G};W.setEdits(s.edits||{});setUid(s.uid||1);P.x=s.P.x;P.y=s.P.y+.3;P.z=s.P.z;P.yaw=s.P.yaw||0;P.vx=P.vy=P.vz=0;begin();}
function pause(on){if(on){if(app!=='world')return;app='paused';$('pause').hidden=false;document.body.classList.remove('playing');save();setNav($('pause'),2,()=>pause(false));}else{if(app!=='paused')return;app='world';$('pause').hidden=true;document.body.classList.add('playing');nav=null;lockReq();}}
function toMenu(){save();app='menu';document.body.classList.remove('ended');Object.assign(menuOrbit,{x:-8,y:W.SITES.villageY+1,z:-4});exitLock();$('menu').hidden=false;$('hud').hidden=true;$('bui').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('panel').hidden=true;$('dlg').hidden=true;dlg=null;panel=null;document.body.classList.remove('playing');$('cont').style.display=load()?'':'none';showBest();snd.setMusic('');setNav($('menu'),99,null);}
let lastAward=null;
function score(){const c=Object.keys(G.dex.caught).length,s=Object.keys(G.dex.seen).length,top=Math.max(0,...G.party.concat(G.box).map(m=>m.lv));return G.badges.length*1000+c*120+s*25+G.st.trainers*80+top*10+G.st.wild*15+(G.champion?1500:0);}
function gameOver(kind){if(BT)return;app='over';exitLock();save();document.body.classList.remove('playing');document.body.classList.add('ended');menuOrbit.x=P.x;menuOrbit.y=P.y;menuOrbit.z=P.z;$('hud').hidden=true;$('panel').hidden=true;$('dlg').hidden=true;dlg=null;panel=null;snd.setMusic('');
 const sc=score(),c=Object.keys(G.dex.caught).length,s=Object.keys(G.dex.seen).length,top=Math.max(0,...G.party.concat(G.box).map(m=>m.lv));const won=kind==='champion';
 $('oeye').textContent=won?'ALL THREE BADGES':'TIME UP';$('ores').innerHTML=won?'ISLAND<br>CHAMPION':'ADVENTURE<br>OVER';$('ofs').textContent=sc.toLocaleString()+' PTS';
 $('stats').innerHTML=[['BADGES',G.badges.length+' / 3'],['BEASTS CAUGHT',G.st.caught+' ('+c+' species)'],['DEX SEEN',s+' / 24'],['TOP LEVEL','LV '+top],['TRAINERS BEATEN',G.st.trainers],['WILD WINS',G.st.wild],['EVOLUTIONS',G.st.evolved],['COINS',G.coins]].map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('');
 $('oteam').innerHTML=G.party.map(m=>`<img src="${portrait(m.sp)}" title="${nameOf(m)} LV ${m.lv}">`).join('');
 const tok=award(sc,won,c);$('otok').textContent=`+${tok} TOKENS · BEST ${best()} PTS`;$('keep').style.display=won||!opt.time?'':'none';$('over').hidden=false;setNav($('over'),99,null);snd.play(won?'badge':'faint');}
function award(pts,won,c){lastAward={pts,won,badges:G.badges.length,caught:c,top:Math.max(0,...G.party.map(m=>m.lv)),time:opt.time};const tok=5+Math.min(60,pts/80|0);
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'blockbeasts';if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'blockbeasts')||0);}catch(e){return 0;}}
function showBest(){const b=best();$('best').textContent=b?'BEST · '+b.toLocaleString()+' PTS':'';}
// menu wiring
const seg=(id,key)=>{const el=$(id);const set=v=>{opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));};set(opt[key]);el.querySelectorAll('button').forEach(b=>{b.dataset.nav=1;b.onclick=()=>set(+b.dataset.v);});};
seg('o-time','time');seg('o-diff','diff');
$('go').dataset.nav=1;$('cont').dataset.nav=1;
$('go').onclick=()=>{snd.init();newGame();};$('cont').onclick=()=>{snd.init();contGame();};
$('again').onclick=()=>{newGame();};$('keep').onclick=()=>{opt.time=0;begin();};$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
['again','keep','omenu','post','resume','quit'].forEach(i=>$(i).dataset.nav=1);
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Block Beasts\nPoints: ${a.pts||0}\nResult: ${a.won?'island champion':'time up'}\nBadges: ${a.badges||0}/3 · Species caught: ${a.caught||0}/24 · Top level: ${a.top||0}\nTime: ${a.time?a.time/60+' min':'endless'}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] blockbeasts '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= update ================= */
function step(dt){dt=Math.min(dt,.05);W.WU.uTime.value=(W.WU.uTime.value+dt)%1000;
 if(app==='world'||app==='battle'){if(opt.time){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;if(app==='world'&&!uiOpen()){gameOver('time');}else if(app==='world'){closePanelForce();gameOver('time');}}}
  const wasN=night;const el=Math.sin(G.dayT*Math.PI*2);G.dayT=(G.dayT+dt/(el<0?220:400))%1;if(G.dayT<dt/400)G.days++;}
 const L=SKY.update(dt,app==='menu'?.035:G.dayT,app==='battle'&&BT?{x:BT.center.x,y:BT.center.y,z:BT.center.z}:P,false);const wasNight=night;night=L.night;
 if(app==='world'&&night!==wasNight){toast(night?'NIGHT FALLS · RARE BEASTS STIR':'A NEW DAY',2.4);snd.setMusic(night?'night':'field');}
 lanternLights(dt,1-L.day);
 stepCo(dt);stepTweens(dt);stepDlg(dt);
 if(app==='world'){pollPad(dt);const hs=movePlayer(dt);placeAvatar(dt,hs);stepMine(dt);stepProj(dt);stepWorldCatch(dt);spawnTick(dt,night);
  for(const w of wild.slice()){if(w.hidden)continue;if(Math.hypot(w.x-P.x,w.z-P.z)>75){removeWild(w);continue;}wildStep(w,dt,night);if(app!=='world')break;}
  for(const n of npcs)npcStep(n,dt);if(!G.starter)peds.forEach((m,i)=>{animate(m,dt,0);m.obj.rotation.y=Math.sin(m.t*.4)*.3;});
  if((saveT-=dt)<=0&&saveT>-1){saveT=-2;save();}if((autoT-=dt)<=0){autoT=20;save();}}
 else if(app==='battle'){pollPad(dt);stepBattle(dt);for(const n of npcs)if(BT&&n===BT.npc){n.m.obj.position.set(n.x,n.y,n.z);n.m.obj.rotation.y=n.yaw;animHuman(n.m,dt,0);}}
 else if(app==='menu'||app==='over'){for(const n of npcs)animHuman(n.m,dt,0);}
 PARTS.update(dt);RING.update(dt);stepFloat(dt);snd.tick();hud(dt);}
let autoT=20;
function closePanelForce(){if(panel){panel=null;$('panel').hidden=true;}if(dlg){dlg=null;$('dlg').hidden=true;}nav=null;}
const fwdTmp=new V3();
function placeCamera(dt){if(app==='battle')return;if(cam.fov!==62){cam.fov=62;cam.updateProjectionMatrix();}
 if(app==='world'||app==='paused'||app==='over'&&!menuOrbit){const f=look();const head=new V3(P.x,P.y+seatH()+1.6,P.z);const right=new V3(Math.cos(P.yaw),0,-Math.sin(P.yaw));const dist=P.mount?6.4:P.camD;
  const want=head.clone().addScaledVector(f,-dist).addScaledVector(right,.6).add(new V3(0,.3,0));const dir=want.clone().sub(head);const L=dir.length();dir.normalize();const hit0=W.raycast(head,dir,L+.3,false,true);const hit=hit0&&!hit0.miss?hit0:null;const d=hit?Math.max(.4,hit.t-.35):L;
  cam.position.copy(head).addScaledVector(dir,d);cam.rotation.set(P.pitch,P.yaw,0,'YXZ');
  const cid=W.get(Math.floor(cam.position.x),Math.floor(cam.position.y),Math.floor(cam.position.z));avatar.obj.visible=d>.9;}
 else{menuA+=dt*.04;const c=menuOrbit,R0=app==='over'?16:34;cam.position.set(c.x+Math.cos(menuA)*R0,c.y+(app==='over'?7:16),c.z+Math.sin(menuA)*R0);cam.lookAt(c.x,c.y+1,c.z);}}
let menuA=0;const menuOrbit={x:-8,y:W.SITES.villageY+1,z:-4};
function render(){placeCamera(0);if(app!=='battle'){}const und=W.waterAt(cam.position.x,cam.position.y,cam.position.z);if(und){scene.fog.near=1;scene.fog.far=18;}
 const lp=app==='battle'&&BT?BT.center:app==='menu'?menuOrbit:P;W.stream(lp.x,lp.z,app==='menu'?3:2);
 if(app==='world')sweepLabels();else{for(const[,el]of labels)el.style.display='none';}
 fx.render();}

/* ================= boot ================= */
buildNpcs();buildPeds();
P.x=W.SITES.spawn.x;P.z=W.SITES.spawn.z;P.y=W.SITES.villageY;
toMenu();setNav($('menu'),99,null,6);
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);placeCamera(dt);render();requestAnimationFrame(loop);}
requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.BEASTS={setMouse:v=>{mouseL=v;},aimAt:(x,y,z)=>{placeCamera(0);const d=new V3(x,y,z).sub(cam.position).normalize();P.yaw=Math.atan2(-d.x,-d.z);P.pitch=Math.asin(d.y);placeCamera(0);},get state(){return app;},get G(){return G;},P,step:(dt=1/60)=>{step(dt);placeCamera(dt);},render,start:(o={})=>{if(o.time!==undefined)opt.time=o.time;if(o.diff!==undefined)opt.diff=o.diff;if(o.cont)contGame();else newGame();},newGame,toMenu,
 get wild(){return wild;},npcs,spawnWild,startBattle,get BT(){return BT;},battleAct,get busy(){return !!(BT&&BT.busy);},get menu(){return BT&&BT.menu;},finishCo:()=>{let g=0;while(co&&g++<2000){step(.1);}},
 setClock:s=>{timeLeft=s;},get clock(){return timeLeft;},set dayT(v){G.dayT=v;},opt,talk,interact,openPanel,closePanel,chooseStarter,get dlg(){return dlg;},advance,press,get panel(){return panel;},
 mkMon,addMon,healAll,toggleMount,throwCube,setLead,keys,look,W,cam,scene,R,PARTS,RING,SKY,save,load,score,gameOver,get night(){return night;},setQuality:applyQuality,portrait,checkChampion,stream:(n=20)=>W.stream(P.x,P.z,n)};
