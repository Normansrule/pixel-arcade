// PENGUIN PLAZA — a cosy snowy island hangout. Original game for Pixel Arcade.
import {THREE,V3,cl,lerp,rnd,ri,pick,damp,dampAng,sstep,$,makeEnv,Particles,disposeTree} from './util.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Sound} from './sound.js';
import {buildWorld,ROOMS,SPACE_ORIGIN} from './world.js';
import {Snowfall,Footprints,snowMaterial} from './env.js';
import {Actor,moveActor,makeNPCs,thinkNPC,arrive,LINES,EMOTES,SAFE,PSCALE} from './actors.js';
import {ALL,WEAR,BODY_COLORS,FURN,PETS,PARTIES,furnModel,wearModel,makePomlet} from './items.js';
import {Penguin} from './penguin.js';
import GAMES from './games/index.js';

const DAY_LEN=900,ID='penguinplaza',SAVE_KEY='pxd_plaza';
const DIFFN=['EASY','NORMAL','HARD'];

/* ================= renderer + world ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.environment=makeEnv(R);
const W=buildWorld(R,scene);
const cam=new THREE.PerspectiveCamera(38,1,.3,700);
const snow=new Snowfall(scene,2400,55),prints=new Footprints(scene,520);
const puffs=new Particles(scene,1600,'normal'),sparks=new Particles(scene,900,'add');
const snd=new Sound();

/* ================= save ================= */
function defSave(){return{v:1,name:'',colorId:'col_sky',wear:{hat:null,neck:'n_scarf_r',face:null},coins:150,owned:{col_sky:1,n_scarf_r:1,fu_rug:1,fu_stool:2,fu_plant:1},igloo:[{id:'fu_rug',x:0,z:0,r:0},{id:'fu_stool',x:-2.4,z:-1,r:0},{id:'fu_plant',x:5,z:-4,r:0}],pet:null,day:1,diff:1,best:{},medals:{},life:{earned:0,days:0}};}
let save=defSave();try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&s.v===1)save=Object.assign(defSave(),s);}catch(e){}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}}
const colorHex=id=>(BODY_COLORS.find(c=>c.id===id)||BODY_COLORS[0]).hex;
const owns=id=>(save.owned[id]||0)>0;

/* ================= actors ================= */
const player=new Actor({name:save.name||'You',color:colorHex(save.colorId),wear:save.wear,space:'out',x:0,z:9});scene.add(player.pg.group);player.isPlayer=true;
const npcs=makeNPCs(25,W,scene);const actors=[player,...npcs];
let menuPeng=null;
for(const a of actors)a.pg.onStep=(side)=>onStep(a,side);
function onStep(a,side){if(a.space!=='out'||W.onPlatform(a.pos.x,a.pos.z))return;if(a.pos.distanceToSquared(camFocus)>45*45)return;const s=side?1:-1,c=Math.cos(a.ry),sn=Math.sin(a.ry);
 prints.add(a.pos.x+c*.22*PSCALE*s,W.height(a.pos.x,a.pos.z),a.pos.z-sn*.22*PSCALE*s,a.ry,side);
 if(a===player){snd.play('step',.8);if(Math.random()<.5)puffs.emit(a.pos.x,a.pos.y+.1,a.pos.z,rnd(-.5,.5),rnd(.4,1),rnd(-.5,.5),.95,.97,1,.35,.5,2,2);}}

/* ================= state ================= */
let camPitch=.66,app='menu',time=0,day=null,pendingEnd=false,editing=false,held=null,uiOpen=null,camYaw=0,camYawT=0,camDist=24,camDistT=24,fadeT=0,fadeCb=null,lastRoom='',coinFlash=0;
const camFocus=new V3(0,2,9),camPos=new V3(30,30,40);let camSnap=true;
function newDay(){day={t:0,len:DAY_LEN,earned:0,spent:0,bought:[],games:[],flakes:0,thrown:0,hits:0,chats:new Set(),start:save.coins};W.resetCoins();W.setParty(PARTIES[(save.day-1)%PARTIES.length]);}
newDay();
const hour=()=>7+day.t/day.len*16.5;
function fmtHour(h){const H=Math.floor(h),m=Math.floor((h-H)*60/10)*10,ap=H>=12?'PM':'AM',hh=((H+11)%12)+1;return `${hh}:${String(m).padStart(2,'0')} ${ap}`;}

/* ================= helpers: bubbles, toasts, timers ================= */
const later=[];const after=(t,f)=>later.push({t,f});
function say(a,text,dur=3.2){if(!a.bubble){a.bubble={el:document.createElement('div')};a.bubble.el.className='bub';$('bubbles').appendChild(a.bubble.el);}const b=a.bubble;b.el.textContent=text;b.el.className='bub'+(a===player?' me':'')+(text.length<=2?' emo':'');b.t=dur;b.el.style.opacity=1;if(a.space===player.space&&a.pos.distanceTo(player.pos)<16)snd.play('bubble');}
const emote=(a,s)=>{say(a,s,2.4);a.pg.play('hop');};
function toast(t,gold){const d=document.createElement('div');d.textContent=t;if(gold)d.className='g';$('toasts').prepend(d);setTimeout(()=>d.remove(),3600);while($('toasts').children.length>5)$('toasts').lastChild.remove();}
function addCoins(n,why){if(n<=0)return;save.coins+=n;day.earned+=n;save.life.earned+=n;persist();coinFlash=1;$('coinw').classList.remove('pulse');void $('coinw').offsetWidth;$('coinw').classList.add('pulse');if(why)toast(`+${n} coins · ${why}`,true);snd.play(n>=20?'coins':'coin',Math.min(6,n/5|0));}
const tags=new Map();
function tagFor(a){let t=tags.get(a);if(!t){t=document.createElement('div');t.className='tag';t.textContent=a.name;$('bubbles').appendChild(t);tags.set(a,t);}return t;}

/* ================= snowballs ================= */
const balls=[];const ballGeo=new THREE.SphereGeometry(.22,12,8),ballMat=snowMaterial({vc:false,spark:0});
for(let i=0;i<40;i++){const m=new THREE.Mesh(ballGeo,ballMat);m.castShadow=true;m.visible=false;scene.add(m);balls.push({m,on:false,p:new V3(),v:new V3(),owner:null,space:'out'});}
function throwBall(from,target){const b=balls.find(b=>!b.on);if(!b)return;from.face(target.x,target.z);from.pg.play('throw');
 after(.22,()=>{const s=new V3(from.pos.x+Math.sin(from.ry)*.6,from.pos.y+1.9,from.pos.z+Math.cos(from.ry)*.6);const d=Math.hypot(target.x-s.x,target.z-s.z),T=cl(d/17,.3,1.05);
  b.v.set((target.x-s.x)/T,(target.y-s.y+9*T*T)/T,(target.z-s.z)/T);b.p.copy(s);b.on=true;b.m.visible=true;b.owner=from;b.space=from.space;b.life=3;if(from===player){day.thrown++;}snd.play('throw');});}
function throwAt(a,b){throwBall(a,b.pos.clone().add(new V3(rnd(-.4,.4),1.2,rnd(-.4,.4))));}
function updateBalls(dt){for(const b of balls){if(!b.on)continue;b.v.y-=18*dt;b.p.addScaledVector(b.v,dt);b.m.position.copy(b.p);b.life-=dt;
  for(const a of actors){if(a===b.owner||a.space!==b.space)continue;const dx=b.p.x-a.pos.x,dy=b.p.y-(a.pos.y+1.1),dz=b.p.z-a.pos.z;if(dx*dx+dy*dy*.5+dz*dz<1.05){splat(b);hitActor(a,b.owner);break;}}
  if(b.on&&(b.p.y<W.ground(b.space,b.p.x,b.p.z)+.1||b.life<0))splat(b);}}
function splat(b){b.on=false;b.m.visible=false;puffs.burst(b.p,18,4,new THREE.Color(1,1,1),.5,.7,{up:true,grav:9,drag:2});if(b.p.distanceTo(player.pos)<30)snd.play('splat');}
function hitActor(a,from){a.pg.play('hit');if(from===player)day.hits++;
 if(a.npc){a.state='react';a.stT=1.2;if(a.seat){a.seat.taken=null;a.seat=null;}a.target=null;if(from)a.face(from.pos.x,from.pos.z);say(a,pick(LINES.hit),2);if(from&&Math.random()<.65)after(.6+rnd(.6),()=>{if(from.space===a.space&&from.pos.distanceTo(a.pos)<22)throwAt(a,from);});}
 else if(a===player){say(player,pick(['Brr!','Hey!','Ha!']),1.5);}}

/* ================= input ================= */
const keys={},edge={};const mouse={x:0,y:0,nx:0,ny:0,down:false,rdown:false,click:false,rclick:false,wheel:0};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Enter'].includes(e.code))e.preventDefault();onKey(e.code);});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
let downAt=null;
canvas.addEventListener('pointerdown',e=>{snd.init();if(e.button===2){mouse.rclick=true;mouse.rdown=true;return;}if(e.button===0){mouse.down=true;downAt=[e.clientX,e.clientY];}});
addEventListener('pointerup',e=>{if(e.button===2)mouse.rdown=false;if(e.button===0){mouse.down=false;if(downAt&&Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])<8&&e.target===canvas)mouse.click=true;downAt=null;}});
addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.nx=e.clientX/innerWidth*2-1;mouse.ny=-(e.clientY/innerHeight)*2+1;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{mouse.wheel+=Math.sign(e.deltaY);e.preventDefault();},{passive:false});
const padPrev={};
function pollPad(){const g=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(!g)return;const ax=g.axes,bt=g.buttons,dz=v=>Math.abs(v)>.3?v:0;
 const set=(code,on)=>{if(on&&!keys[code])edge[code]=true;keys[code]=on;};set('GpLeft',dz(ax[0])<0||bt[14]?.pressed);set('GpRight',dz(ax[0])>0||bt[15]?.pressed);set('GpUp',dz(ax[1])<0||bt[12]?.pressed);set('GpDown',dz(ax[1])>0||bt[13]?.pressed);
 keys.GpX=ax[0]||0;keys.GpY=ax[1]||0;for(const[i,c]of[[0,'PadA'],[1,'PadB'],[2,'PadX'],[3,'PadY'],[9,'PadStart'],[4,'PadLB'],[5,'PadRB']]){const p=!!bt[i]?.pressed;if(p&&!padPrev[c]){edge[c]=true;onKey(c);}keys[c]=p;padPrev[c]=p;}}
const ray=new THREE.Raycaster();
function groundHit(nx,ny,space){ray.setFromCamera({x:nx,y:ny},cam);const o=ray.ray.origin,d=ray.ray.direction;
 if(space!=='out'){if(d.y>=-1e-3)return null;const t=-o.y/d.y;return o.clone().addScaledVector(d,t);}
 let prev=0;for(let t=1;t<400;t+=.6){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<W.ground('out',x,z)){let a=prev,b=t;for(let i=0;i<10;i++){const m=(a+b)/2,yy=o.y+d.y*m;if(yy<W.ground('out',o.x+d.x*m,o.z+d.z*m))b=m;else a=m;}return o.clone().addScaledVector(d,b);}prev=t;}return null;}
function pickActor(px,py){let best=null,bd=46;for(const a of actors){if(a===player||a.space!==player.space)continue;const p=a.pos.clone();p.y+=1.1;const s=p.project(cam);if(s.z>1)continue;const x=(s.x*.5+.5)*innerWidth,y=(-s.y*.5+.5)*innerHeight,d=Math.hypot(x-px,y-py);if(d<bd){bd=d;best=a;}}return best;}

/* ================= key handling ================= */
function onKey(c){
 if(c==='KeyN'){snd.setMusic(!snd.musicOn);toast(snd.musicOn?'Music on':'Music off');}
 if(app==='intro'){if(c==='Enter'||c==='Space'||c==='PadA')beginGame(mg.id);else if(c==='Escape'||c==='PadB')closeIntro();return;}
 if(app==='res'){if(c==='Enter'||c==='PadA')beginGame(mg.id);else if(c==='Escape'||c==='PadB'||c==='Space')exitGame();return;}
 if(app==='game'){if(c==='Escape'||c==='PadStart')pause(true);return;}
 if(app==='paused'){if(c==='Escape'||c==='PadStart')pause(false);return;}
 if(app!=='play')return;
 if(c==='Escape'||c==='PadStart'){if(uiOpen)closeUI();else if(editing)endEdit();else pause(true);return;}
 if(editing){if(c==='KeyR'&&held){held.r+=Math.PI/4;}if((c==='Delete'||c==='Backspace'||c==='KeyX')&&held){W.iglooRoot.remove(held.m);held=null;renderEdInv();}return;}
 if(uiOpen==='chat'||uiOpen==='emote'){if(c==='Enter'||c==='KeyX')closeUI();return;}
 if(uiOpen){if((c==='KeyM'&&uiOpen==='map')||(c==='KeyB'&&uiOpen==='shop'))closeUI();return;}
 if(c==='Enter'){if(promptT&&promptT.kind==='game')openIntro(promptT.game);else openUI('chat');}
 else if(c==='Space'||c==='KeyF'||c==='PadA')interact();
 else if(c==='KeyX')openUI('emote');else if(c==='KeyM')openUI('map');else if(c==='KeyB')openUI('shop');else if(c==='KeyH')goHome();
 else if(c==='Digit1'||c==='PadY')doEmote('wave');else if(c==='Digit2'||c==='PadB')doEmote('dance');else if(c==='Digit3')doEmote('sit');
 else if(c==='KeyT'||c==='PadX')throwForward();else if(c==='KeyQ')camYawT+=Math.PI/4;else if(c==='KeyE')camYawT-=Math.PI/4;
 else if(c==='KeyI'&&player.space==='igloo')startEdit();}
function doEmote(k){if(k==='wave'){player.state='idle';player.pg.play('wave');for(const a of npcs)if(a.space===player.space&&a.pos.distanceTo(player.pos)<9&&a.state!=='chat'&&Math.random()<.8)after(.3+rnd(.6),()=>{a.face(player.pos.x,player.pos.z);a.pg.play('wave');say(a,pick(LINES.greet),2.6);day.chats.add(a.name);});}
 else if(k==='dance'){player.state=player.state==='dance'?'idle':'dance';player.target=null;player.pg.danceStyle=ri(4);if(player.state==='dance')for(const a of npcs)if(a.space===player.space&&a.pos.distanceTo(player.pos)<10&&a.state==='idle'&&Math.random()<.6){a.state='dance';a.stT=6+rnd(6);a.pg.danceStyle=ri(4);}}
 else if(k==='sit'){if(player.state==='sit'){player.state='idle';}else{player.target=null;player.state='sit';}}}
function throwForward(){const h=mouse.nx||mouse.ny?groundHit(mouse.nx,mouse.ny,player.space):null;let t=h&&h.distanceTo(player.pos)<30?h:player.pos.clone().add(new V3(Math.sin(player.ry)*10,0,Math.cos(player.ry)*10));
 const tgt=pickActor(mouse.x,mouse.y);if(tgt&&tgt.pos.distanceTo(player.pos)<30)t=tgt.pos.clone().add(new V3(0,1.1,0));else t.y=W.ground(player.space,t.x,t.z)+.4;player.state='idle';player.target=null;throwBall(player,t);}
let talkTo=null;
function interact(){if(promptT){promptAct();return;}const near=npcs.filter(a=>a.space===player.space).sort((a,b)=>a.pos.distanceTo(player.pos)-b.pos.distanceTo(player.pos))[0];if(near&&near.pos.distanceTo(player.pos)<5)talk(near);}
function talk(a){a.state='react';a.stT=3;a.target=null;if(a.seat){a.seat.taken=null;a.seat=null;}a.face(player.pos.x,player.pos.z);player.face(a.pos.x,player.pos.z===a.pos.z?a.pos.z+1:a.pos.z);a.pg.play('wave');
 const pool=Math.random()<.4?LINES.tips:Math.random()<.5?LINES.small:LINES.greet;let l=pick(pool);if(W.party&&Math.random()<.2)l=pick(LINES.party).replace('{party}',W.party.n);say(a,l,4);day.chats.add(a.name);}

/* ================= chat / emote / map / shop UI ================= */
function openUI(k){closeUI();uiOpen=k;snd.play('ui');const b=document.querySelector(`#dock button[data-a="${k}"]`);if(b)b.classList.add('on');
 if(k==='chat'){const el=$('chatm');el.innerHTML=SAFE.map((c,i)=>`<div class="col"><h6>${c.n.toUpperCase()}</h6>${c.l.map((p,j)=>`<button data-c="${i}" data-p="${j}">${p[0]}</button>`).join('')}</div>`).join('');el.hidden=false;
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>{const p=SAFE[+b.dataset.c].l[+b.dataset.p];sayChat(p[0],p[1]);closeUI();});}
 else if(k==='emote'){const el=$('emotem');el.innerHTML=EMOTES.map(e=>`<button>${e}</button>`).join('');el.hidden=false;el.querySelectorAll('button').forEach(b=>b.onclick=()=>{emote(player,b.textContent);closeUI();});}
 else if(k==='map'){drawMap();$('mapw').hidden=false;}
 else if(k==='shop'){openShop(shopTab);}}
function closeUI(){uiOpen=null;['chatm','emotem','mapw','shopw'].forEach(i=>$(i).hidden=true);document.querySelectorAll('#dock button.on').forEach(b=>b.classList.remove('on'));}
function sayChat(text,kind){say(player,text,3.4);const near=npcs.filter(a=>a.space===player.space&&a.pos.distanceTo(player.pos)<12).sort(()=>Math.random()-.5).slice(0,kind==='bye'||kind==='greet'?3:2);
 near.forEach((a,i)=>after(.8+i*.9+rnd(.4),()=>{if(a.state==='chat')return;a.state='react';a.stT=2.5;a.target=null;a.face(player.pos.x,player.pos.z);day.chats.add(a.name);
  if(kind==='fight'){throwAt(a,player);say(a,pick(['You\'re on!','Snowball fight!','Incoming!']),2);a.cool=0;after(1.6,()=>throwAt(a,player));return;}
  if(kind==='dance'){a.state='dance';a.stT=8;a.pg.danceStyle=ri(4);say(a,pick(['Let\'s groove!','♪','Dance party!']),2.4);return;}
  if(kind==='party'){a.pg.play('cheer');say(a,W.party?pick(LINES.party).replace('{party}',W.party.n):'Woo!',3);return;}
  const pool=LINES[kind]||LINES.small;say(a,pick(pool),kind==='jokes'?5:3.2);a.pg.play(kind==='thanks'?'hop':kind==='jokes'?'laugh':'nod');}));}
// map
function drawMap(){const el=$('map'),X=x=>50+x/2.5,Y=z=>50+z/2.5;let s='';const pts=[];for(let i=0;i<72;i++){const a=i/72*Math.PI*2;let r=60;for(;r<130;r+=1.5)if(W.height(Math.cos(a)*r,Math.sin(a)*r)<.2)break;pts.push(`${X(Math.cos(a)*r).toFixed(1)},${Y(Math.sin(a)*r).toFixed(1)}`);}
 s+=`<defs><radialGradient id="mg" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfe4f8"/></radialGradient></defs><rect width="100" height="100" fill="#123a5c"/><polygon points="${pts.join(' ')}" fill="url(#mg)" stroke="#8ab8e0" stroke-width=".6"/>`;
 s+=`<circle cx="${X(0)}" cy="${Y(-90)}" r="8" fill="#e6eef8" stroke="#b8c8dc" stroke-width=".4"/><path d="M${X(-6)} ${Y(-84)} L${X(0)} ${Y(-98)} L${X(6)} ${Y(-84)}" fill="#fff" stroke="#9aa8bc" stroke-width=".3"/>`;
 for(const k in ROOMS){const r=ROOMS[k];const[mx,my]=r.map;const here=W.roomAt(player.space,player.pos.x,player.pos.z)===k;const inner=r.space!=='out';
  s+=`<g class="node" data-r="${k}"><circle class="d" cx="${mx}" cy="${my}" r="${inner?3:3.6}" fill="${here?'#ff4d00':inner?'#5a3a8a':'#1f6bd0'}" stroke="#fff" stroke-width=".6"/><text x="${mx}" y="${my+(inner?6.6:7.4)}" text-anchor="middle">${r.n.toUpperCase()}</text>${here?`<circle cx="${mx}" cy="${my}" r="5.4" fill="none" stroke="#ff4d00" stroke-width=".5"><animate attributeName="r" values="4;7;4" dur="1.6s" repeatCount="indefinite"/></circle>`:''}</g>`;}
 el.innerHTML=s;el.querySelectorAll('.node').forEach(n=>n.onclick=()=>{closeUI();travelTo(n.dataset.r);});}
// shop + thumbnails
let shopTab='hat';const thumbs={},thumbQ=[];
const TS=new THREE.Scene();TS.environment=scene.environment;TS.add(new THREE.HemisphereLight(0xdfe8ff,0x30384a,1.2));{const d=new THREE.DirectionalLight(0xffffff,2.2);d.position.set(2,4,5);TS.add(d);}
const TC=new THREE.PerspectiveCamera(30,1,.05,50),TRT=new THREE.WebGLRenderTarget(128,128,{samples:4});TRT.texture.colorSpace=THREE.SRGBColorSpace;
function makeThumb(id){const it=ALL[id];const g=new THREE.Group();let fy=1.3,fd=3.2,lx=0;
 if(it.kind==='wear'){const p=new Penguin({color:0x6a7a96,wear:{[it.slot]:id}});g.add(p.group);p.update(.016,0);if(it.slot==='hat'){fy=1.55;fd=3.1;}else if(it.slot==='neck'){fy=1.05;fd=2.6;}else{fy=1.25;fd=1.9;}}
 else if(it.kind==='furn'){const m=furnModel(id);g.add(m);const bb=new THREE.Box3().setFromObject(m),sz=bb.getSize(new V3());fy=bb.min.y+sz.y*.5;fd=Math.max(sz.x,sz.y,sz.z)*2.3+1;}
 else if(it.kind==='pet'){const m=makePomlet(it.c);g.add(m);fy=.4;fd=2;}
 TS.add(g);TC.position.set(lx+fd*.42,fy+fd*.22,fd);TC.lookAt(lx,fy,0);const prevT=R.getRenderTarget(),prevE=R.toneMappingExposure;R.setRenderTarget(TRT);R.setClearColor(0x1c2436,1);R.clear();R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1;R.render(TS,TC);
 const px=new Uint8Array(128*128*4);R.readRenderTargetPixels(TRT,0,0,128,128,px);R.setRenderTarget(prevT);R.toneMappingExposure=prevE;TS.remove(g);disposeTree(g);
 const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),im=x.createImageData(128,128);for(let y=0;y<128;y++)im.data.set(px.subarray((127-y)*512,(128-y)*512),y*512);x.putImageData(im,0,0);return c.toDataURL();}
function processThumbs(){let n=0;while(thumbQ.length&&n++<3){const id=thumbQ.shift();if(thumbs[id])continue;try{thumbs[id]=makeThumb(id);}catch(e){thumbs[id]='x';}document.querySelectorAll(`img[data-th="${id}"]`).forEach(i=>i.src=thumbs[id]);}}
function openShop(tab){shopTab=tab;$('shopw').hidden=false;$('scoins').textContent=save.coins;document.querySelectorAll('#stabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
 let list=tab==='color'?BODY_COLORS.map(c=>({...c,kind:'color'})):tab==='furn'?FURN.map(f=>({...f,kind:'furn'})):tab==='pet'?PETS.map(p=>({...p,kind:'pet'})):[...WEAR.filter(w=>w.slot===tab),...PARTIES.map(p=>p.hat).filter(h=>h.slot===tab&&owns(h.id))].map(w=>({...w,kind:'wear'}));
 $('sgrid').innerHTML=list.map(it=>{const own=owns(it.id),n=save.owned[it.id]||0;let btn;
  if(it.kind==='wear'){const worn=save.wear[it.slot]===it.id;btn=own?`<button class="${worn?'worn':'own'}" data-a="wear" data-id="${it.id}">${worn?'WEARING ✓':'WEAR'}</button>`:`<button data-a="buy" data-id="${it.id}" ${save.coins<it.p?'disabled':''}>BUY · ${it.p}</button>`;}
  else if(it.kind==='color'){const on=save.colorId===it.id;btn=own?`<button class="${on?'worn':'own'}" data-a="use" data-id="${it.id}">${on?'IN USE ✓':'USE'}</button>`:`<button data-a="buy" data-id="${it.id}" ${save.coins<it.p?'disabled':''}>BUY · ${it.p}</button>`;}
  else if(it.kind==='furn')btn=`<button data-a="buy" data-id="${it.id}" ${save.coins<it.p?'disabled':''}>${n?`BUY ANOTHER · ${it.p}`:`BUY · ${it.p}`}</button>`;
  else{const on=save.pet===it.id;btn=own?`<button class="${on?'worn':'own'}" data-a="pet" data-id="${it.id}">${on?'WALKING ✓':'TAKE FOR A WALK'}</button>`:`<button data-a="buy" data-id="${it.id}" ${save.coins<it.p?'disabled':''}>ADOPT · ${it.p}</button>`;}
  const th=it.kind==='color'?`<div class="sw" style="background:#${new THREE.Color(it.hex).getHexString()}"></div>`:`<img data-th="${it.id}" src="${thumbs[it.id]||''}" alt="">`;if(it.kind!=='color'&&!thumbs[it.id])thumbQ.push(it.id);
  return `<div class="it${own?' owned':''}"><div class="th">${th}</div><b>${it.n}${it.kind==='furn'&&n?` <span style="color:#8fd">×${n}</span>`:''}${it.trait?`<br><span style="color:#8a8f9a;font-weight:400">${it.trait}</span>`:''}</b><span class="pr">${it.p?`❄ ${it.p}`:'PARTY FREEBIE'}</span>${btn}</div>`;}).join('');
 $('sgrid').querySelectorAll('button').forEach(b=>b.onclick=()=>{shopAct(b.dataset.a,b.dataset.id);});}
function shopAct(a,id){const it=ALL[id];
 if(a==='buy'){if(!buy(id))return;if(it.kind==='wear')wear(id);else if(it.kind==='color')useColor(id);else if(it.kind==='pet')walkPet(id);else if(it.kind==='furn')toast(`${it.n} sent to your igloo storage · press H to go home`);}
 else if(a==='wear')wear(save.wear[it.slot]===id?null:id,it.slot);else if(a==='use')useColor(id);else if(a==='pet')walkPet(save.pet===id?null:id);
 openShop(shopTab);}
function buy(id){const it=ALL[id];if(!it||save.coins<it.p)return false;save.coins-=it.p;day.spent+=it.p;day.bought.push(it.n);save.owned[id]=(save.owned[id]||0)+1;persist();snd.play('buy');sparks.burst(player.pos.clone().setY(player.pos.y+1.5),40,5,[new THREE.Color(2,1.6,.4),new THREE.Color(1.6,1.6,2)],.4,1,{up:true,grav:3});toast(`Bought ${it.n}!`);return true;}
function wear(id,slot){slot=slot||ALL[id].slot;save.wear[slot]=id;player.pg.setWear(save.wear);persist();if(id){player.pg.play('spin');}}
function useColor(id){save.colorId=id;player.pg.setColor(colorHex(id));persist();player.pg.play('hop');buildColorSeg();}
function walkPet(id){save.pet=id;persist();if(id){player.setPet(id,scene);player.pet.pos.copy(player.pos).add(new V3(1.5,0,1.5));snd.play('squeak');}else player.setPet(null,scene);}

/* ================= triggers + prompt ================= */
let promptT=null;const inTrig=new Set();
function checkTriggers(){if(fadeT>0)return;for(const t of W.triggers){if(t.space!==player.space)continue;const d=Math.hypot(player.pos.x-t.x,player.pos.z-t.z),inside=d<t.r;
  if(inside&&!inTrig.has(t)){inTrig.add(t);enterTrig(t);}else if(!inside&&d>t.r+.4&&inTrig.has(t)){inTrig.delete(t);if(promptT===t)hidePrompt();}}}
function armTriggers(){inTrig.clear();for(const t of W.triggers)if(t.space===player.space&&Math.hypot(player.pos.x-t.x,player.pos.z-t.z)<t.r+.4)inTrig.add(t);}
function enterTrig(t){if(t.kind==='door'){travel({space:ROOMS[t.to].space,room:t.to});}
 else if(t.kind==='exit'){const k={coffee:'coffee',club:'club',igloo:'igloo'}[t.space];const o=W.doorOut[k];travel({space:'out',x:o[0],z:o[1]+(k==='igloo'?0:0),face:0});}
 else showPrompt(t);}
function showPrompt(t){promptT=t;const el=$('prompt');let h='';
 if(t.kind==='game'){const g=GAMES[t.game];const best=save.best[t.game]||0,md=save.medals[t.game]||0;h=`<h4>★ ${g?g.name:t.label}<em>.</em></h4><p>${g?g.desc:'Coming soon'}</p><div class="row"><button class="go sm" id="pgo">PLAY <kbd>ENTER</kbd></button><small>BEST ${best} · ${['NO MEDAL','BRONZE','SILVER','GOLD'][md]} · ${g?g.time+'s':''}</small></div>`;}
 else if(t.kind==='party'){const p=W.party,got=owns(p.hat.id);h=`<h4>${p.n.toUpperCase()}<em>.</em></h4><p>${got?'You already have today\'s party hat. Come back tomorrow for the next party!':'Today\'s party gift: the '+p.hat.n+'. Free for everyone on the island!'}</p><div class="row">${got?'':'<button class="go sm" id="pgo">CLAIM HAT <kbd>SPACE</kbd></button>'}</div>`;}
 else if(t.kind==='shop'){h=`<h4>POMLET PETS<em>.</em></h4><p>Adopt a fluffy pomlet. It follows you everywhere, hops when you dance and naps when you sit.</p><div class="row"><button class="go sm" id="pgo">BROWSE PETS <kbd>SPACE</kbd></button></div>`;}
 el.innerHTML=h;el.hidden=false;const b=$('pgo');if(b)b.onclick=promptAct;}
function hidePrompt(){promptT=null;$('prompt').hidden=true;}
function promptAct(){const t=promptT;if(!t)return;if(t.kind==='game'){if(GAMES[t.game])openIntro(t.game);}else if(t.kind==='party'){const h=W.party.hat;if(!owns(h.id)){save.owned[h.id]=1;wear(h.id,'hat');toast(`Got the ${h.n}! It's in your catalog.`,true);snd.play('chime');sparks.burst(player.pos.clone().setY(player.pos.y+2.6),60,6,W.party.cols.map(c=>new THREE.Color(c).multiplyScalar(2)),.5,1.2,{up:true,grav:4});showPrompt(t);}}
 else if(t.kind==='shop'){openUI('shop');openShop('pet');}}

/* ================= travel ================= */
function travel(dest){if(fadeT>0)return;hidePrompt();snd.play('door');$('fade').classList.add('on');fadeT=.32;fadeCb=()=>{
 const space=dest.space;let p;if(dest.room){p=W.entryPos(dest.room);}else p=new V3(dest.x,0,dest.z);
 player.space=space;player.pos.set(p.x,W.ground(space,p.x,p.z),p.z);player.target=null;player.state='idle';player.ry=dest.face??(space==='out'?0:Math.PI);if(player.seat){player.seat=null;}
 if(player.pet){player.pet.pos.copy(player.pos).add(new V3(1.2,0,1.2));}W.setSpace(space);camSnap=true;armTriggers();if(editing)endEdit();
 snd.music(musicFor());};}
function travelTo(room){const r=ROOMS[room];travel({space:r.space,room});}
function goHome(){if(player.space==='igloo'){startEdit();return;}travelTo('igloo');}
function musicFor(){if(player.space==='club')return'club';if(player.space==='coffee')return'cozy';if(player.space==='igloo')return'cozy';return day&&hour()>20.5?'night':'island';}

/* ================= igloo furniture + editor ================= */
let iglooEmit=[];
function buildIgloo(){const root=W.iglooRoot;while(root.children.length){const c=root.children.pop();disposeTree(c);}const o=SPACE_ORIGIN.igloo;W.obst.igloo=[];W.emit=W.emit.filter(e=>!iglooEmit.includes(e));iglooEmit=[];
 for(const f of save.igloo){const m=furnModel(f.id);m.position.set(f.x,0,f.z);m.rotation.y=f.r;root.add(m);m.userData.f=f;if(ALL[f.id]?.m!=='rug')W.obst.igloo.push({x:o[0]+f.x,z:o[2]+f.z,r:m.userData.radius*.75});
  if(m.userData.light){const l=new V3(...m.userData.light).applyAxisAngle(new V3(0,1,0),f.r);const e={space:'igloo',x:o[0]+f.x+l.x,y:l.y,z:o[2]+f.z+l.z,col:m.userData.lightCol??0xffc080,i:18};W.emit.push(e);iglooEmit.push(e);}}}
function placedCount(id){return save.igloo.filter(f=>f.id===id).length;}
function startEdit(){if(player.space!=='igloo')return;closeUI();editing=true;held=null;$('editbar').hidden=false;$('edinv').hidden=false;$('dock').hidden=true;renderEdInv();toast('Igloo editor: place your furniture!');}
function endEdit(){if(held){W.iglooRoot.remove(held.m);held=null;}editing=false;$('editbar').hidden=true;$('edinv').hidden=true;$('dock').hidden=false;buildIgloo();persist();}
function renderEdInv(){const own=FURN.filter(f=>owns(f.id));$('edinv').innerHTML='<h5>STORAGE</h5>'+(own.length?own.map(f=>{const left=save.owned[f.id]-placedCount(f.id)-(held&&held.id===f.id&&held.isNew?1:0);if(!thumbs[f.id])thumbQ.push(f.id);
  return `<button data-id="${f.id}" ${left<=0?'disabled':''}><img data-th="${f.id}" src="${thumbs[f.id]||''}" alt="">${f.n}<br>×${left}</button>`;}).join(''):'<p style="grid-column:1/-1;font-size:.62rem;color:#8a8f9a">Buy furniture in the catalog (B).</p>');
 $('edinv').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(held){W.iglooRoot.remove(held.m);}const m=furnModel(b.dataset.id);W.iglooRoot.add(m);held={id:b.dataset.id,m,r:0,isNew:true};renderEdInv();});}
function editUpdate(dt){const h=groundHit(mouse.nx,mouse.ny,'igloo');const o=SPACE_ORIGIN.igloo;
 if(mouse.wheel&&held){held.r+=Math.sign(mouse.wheel)*Math.PI/8;mouse.wheel=0;}
 if(held&&h){let lx=h.x-o[0],lz=h.z-o[2];const d=Math.hypot(lx,lz),mx=7.6;if(d>mx){lx*=mx/d;lz*=mx/d;}held.m.position.set(lx,.15+Math.sin(time*6)*.05,lz);held.m.rotation.y=damp(held.m.rotation.y,held.r,14,dt);held.lx=lx;held.lz=lz;}
 if(mouse.click){mouse.click=false;if(held&&held.lx!==undefined){save.igloo.push({id:held.id,x:+held.lx.toFixed(2),z:+held.lz.toFixed(2),r:held.r});W.iglooRoot.remove(held.m);held=null;buildIgloo();renderEdInv();snd.play('pop');persist();sparks.burst(new V3(o[0]+save.igloo.at(-1).x,.5,o[2]+save.igloo.at(-1).z),24,4,new THREE.Color(1.6,1.4,1),.35,.7,{up:true,grav:4});}
  else if(!held){ray.setFromCamera({x:mouse.nx,y:mouse.ny},cam);const hit=ray.intersectObjects(W.iglooRoot.children,true)[0];if(hit){let n=hit.object;while(n.parent&&n.parent!==W.iglooRoot)n=n.parent;const f=n.userData.f;if(f){save.igloo.splice(save.igloo.indexOf(f),1);buildIgloo();const m=furnModel(f.id);W.iglooRoot.add(m);held={id:f.id,m,r:f.r};snd.play('ui');renderEdInv();}}}}}

/* ================= minigames ================= */
let mg=null;const mgFx={};
function openIntro(id){const g=GAMES[id];if(!g)return;hidePrompt();closeUI();app='intro';mg={id,def:g};player.target=null;
 $('mgititle').innerHTML=g.name.replace(/ (\S+)$/,'<br>$1')+'<em>.</em>';$('mgieye').textContent=`MINIGAME · ${ROOMS[g.room]?.n.toUpperCase()||''} · ${g.time}S · CPU ${DIFFN[save.diff]}`;$('mgidesc').textContent=g.long||g.desc;
 $('mgikeys').innerHTML=g.keys.map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('')+`<tr><td>Medals</td><td>${g.medalText||`Bronze ${g.medals[0]} · Silver ${g.medals[1]} · Gold ${g.medals[2]} points`}</td></tr>`;
 $('mgintro').hidden=false;$('hud').hidden=true;document.body.classList.add('playing');}
function closeIntro(){$('mgintro').hidden=true;app='play';$('hud').hidden=false;mg=null;}
const gctx={THREE,R,snd,get diff(){return save.diff;},get look(){return{color:colorHex(save.colorId),wear:{...save.wear}};},get name(){return save.name||'You';},hud:$('mgx'),
 msg(t,col='#fff',dur=1.2){const m=$('mgmsg');m.textContent=t;m.style.color=col;m.classList.add('on');clearTimeout(m._t);m._t=setTimeout(()=>m.classList.remove('on'),dur*1000);},
 get tLeft(){return mg?mg.tLeft:0;},set tLeft(v){if(mg)mg.tLeft=v;},get petColor(){const p=PETS.find(x=>x.id===save.pet);return p?p.c:null;}};
function beginGame(id){const g=GAMES[id];$('mgintro').hidden=true;$('mgres').hidden=true;snd.init();
 if(mg&&mg.inst){disposeGame();}
 mg={id,def:g,inst:null,phase:'count',cdT:3.2,tLeft:g.time,endT:0,lastBeep:4};$('mgx').innerHTML='';
 mg.inst=g.create(gctx);app='game';$('hud').hidden=true;$('mghud').hidden=false;$('mgname').textContent=g.name;$('bubbles').style.display='none';document.body.classList.add('playing');snd.music(g.music===undefined?'game':g.music);}
function disposeGame(){const i=mg.inst;if(!i)return;if(i.dispose)i.dispose();disposeTree(i.scene);const f=mgFx[i.scene.uuid];if(f&&f.composer)f.composer.dispose();delete mgFx[i.scene.uuid];mg.inst=null;$('mgx').innerHTML='';}
function finishGame(reason){if(mg.phase!=='play')return;mg.phase='end';mg.endT=0;if(mg.inst.finish)mg.inst.finish(reason);gctx.msg(reason==='time'?'TIME UP!':mg.inst.endText||'FINISH!',reason==='time'?'#ffb38a':'#ffe09a',1.6);snd.play('beep',1);}
function showResults(){const g=mg.def,res=mg.inst.result();mg.res=res;app='res';mg.phase='res';const prev=save.best[mg.id]||0;const isBest=res.score>prev;if(isBest)save.best[mg.id]=res.score;save.medals[mg.id]=Math.max(save.medals[mg.id]||0,res.medal);
 addCoins(res.coins,null);day.games.push({id:mg.id,score:res.score,medal:res.medal,coins:res.coins});persist();snd.play(res.medal>0?'win':'lose');
 $('mgreye').textContent=g.name+' · '+(res.sub||'RESULTS');$('mgrres').textContent=res.title||(['NICE TRY','BRONZE!','SILVER!','GOLD!'][res.medal]);$('mgrres').style.color=['#c8ccd8','#e8a060','#e8eef8','#ffc83a'][res.medal];
 $('medal').className='m'+res.medal;$('medal').textContent=['–','★','★★','★★★'][res.medal];
 $('mgrstats').innerHTML=[['Score',res.score+(isBest?' · NEW BEST!':'')],...res.stats,['Best',Math.max(prev,res.score)]].map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('');
 $('mgrcoins').textContent=`+${res.coins} COINS · YOU HAVE ${save.coins}`;$('mgres').hidden=false;$('mghud').hidden=true;}
function exitGame(){$('mgres').hidden=true;$('mghud').hidden=true;$('fade').classList.add('on');fadeT=.3;fadeCb=()=>{disposeGame();mg=null;app='play';$('hud').hidden=false;$('bubbles').style.display='';camSnap=true;snd.music(musicFor());if(pendingEnd)endDay();};}
function stepGame(dt){const i=mg.inst;if(!i)return;
 const inp={k:c=>!!keys[c],e:c=>!!edge[c],any:(...c)=>c.some(k=>keys[k]),ae:(...c)=>c.some(k=>edge[k]),left:()=>keys.KeyA||keys.ArrowLeft||keys.GpLeft,right:()=>keys.KeyD||keys.ArrowRight||keys.GpRight,up:()=>keys.KeyW||keys.ArrowUp||keys.GpUp,down:()=>keys.KeyS||keys.ArrowDown||keys.GpDown,
  act:()=>edge.Space||edge.PadA,mouse,ax:keys.GpX||0,ay:keys.GpY||0,ray:(cm)=>{ray.setFromCamera({x:mouse.nx,y:mouse.ny},cm||i.camera);return ray.ray;}};
 if(mg.phase==='count'){mg.cdT-=dt;const n=Math.ceil(mg.cdT);if(n!==mg.lastBeep&&n>0&&n<=3){mg.lastBeep=n;snd.play('beep',0);}const cd=$('mgcd');if(mg.cdT>0&&mg.cdT<=3){cd.textContent=n;cd.style.opacity=Math.min(1,(mg.cdT%1)*3);}
  if(mg.cdT<=0){mg.phase='play';cd.textContent='GO!';cd.style.opacity=1;setTimeout(()=>cd.style.opacity=0,500);snd.play('beep',1);if(i.start)i.start();}if(i.idle)i.idle(dt);}
 else if(mg.phase==='play'){i.update(dt,inp);if(!i.ownClock)mg.tLeft-=dt;if(i.done)finishGame(i.doneReason||'done');else if(mg.tLeft<=0){mg.tLeft=0;finishGame('time');}}
 else if(mg.phase==='end'){mg.endT+=dt;if(i.idle)i.idle(dt);else i.update(dt*.3,{k:()=>0,e:()=>0,any:()=>0,ae:()=>0,left:()=>0,right:()=>0,up:()=>0,down:()=>0,act:()=>0,mouse,ax:0,ay:0,ray:inp.ray});if(mg.endT>1.8)showResults();}
 else if(app==='res'){if(i.idle)i.idle(dt);}
 // hud
 const tl=Math.max(0,mg.tLeft);setT('mgtime',fmtSec(tl));$('mgtime').classList.toggle('low',tl<10);$('mgtbar').style.width=(tl/mg.def.time*100)+'%';$('mgscore').textContent=Math.round(i.score||0);
 if(i.hud)i.hud(dt);}
const fmtSec=t=>{t=Math.ceil(t);return (t/60|0)+':'+String(t%60).padStart(2,'0');};

/* ================= day end / award ================= */
let lastAward=null;
function endDay(){pendingEnd=false;app='summary';closeUI();if(editing)endEdit();hidePrompt();$('hud').hidden=true;document.body.classList.remove('playing');
 const medals=[0,0,0,0];day.games.forEach(g=>medals[g.medal]++);const flakes=day.flakes;
 $('oeye').textContent=`END OF DAY ${save.day} · ${W.party.n.toUpperCase()}`;
 $('stats').innerHTML=[['Coins earned',day.earned],['Coins spent',day.spent],['Items bought',day.bought.length?day.bought.slice(0,4).join(', ')+(day.bought.length>4?` +${day.bought.length-4}`:''):'none'],['Minigames played',day.games.length],['Medals','🥇 '+medals[3]+' · 🥈 '+medals[2]+' · 🥉 '+medals[1]],['Golden snowflakes',`${flakes} / ${W.coins.length}`],['Snowballs thrown · hits',`${day.thrown} · ${day.hits}`],['Penguins chatted with',day.chats.size],['Coins in the bank',save.coins]].map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('');
 const tok=award();$('otok').textContent=`+${tok} TOKENS · BEST DAY ${best()} COINS`;$('over').hidden=false;snd.play('chime');snd.music('night');save.day++;save.life.days++;persist();}
function award(){const pts=day.earned,won=pts>=100;lastAward={pts,won,day:save.day,games:day.games.length,party:W.party.n};const tok=5+Math.min(60,pts/20|0);
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID;if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID)||0);}catch(e){return 0;}}

/* ================= app flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();snd.init();
 if(o.diff!==undefined)save.diff=o.diff;const nm=$('o-name').value.trim();if(nm)save.name=nm;if(o.name)save.name=o.name;player.name=save.name||'You';const tg=tags.get(player);if(tg)tg.textContent=player.name;persist();
 if(o.newDay||!day||app==='summary')newDay();if(o.dayLen)day.len=o.dayLen;
 app='play';$('menu').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;$('dock').hidden=false;document.body.classList.add('playing');
 if(menuPeng){menuPeng=null;}player.pg.group.visible=true;if(player.space!=='out'||o.newDay||o.spawn){player.space='out';W.setSpace('out');}if(o.spawn!==false&&(o.newDay||o.spawn)){const p=W.entryPos('town');player.pos.set(p.x,W.ground('out',p.x,p.z),p.z);}
 player.state='idle';player.target=null;camSnap=true;armTriggers();if(save.pet&&!player.pet)walkPet(save.pet);snd.music(musicFor());
 const r=W.roomAt(player.space,player.pos.x,player.pos.z);lastRoom='';void r;toast(`Day ${save.day}: ${W.party.n}! Claim your free party hat at the board.`,true);}
function toMenu(){app='menu';closeUI();if(editing)endEdit();hidePrompt();if(mg){if(mg.inst)disposeGame();mg=null;}$('menu').hidden=false;$('keys').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('mghud').hidden=true;$('mgres').hidden=true;$('mgintro').hidden=true;$('bubbles').style.display='';
 document.body.classList.remove('playing');player.space='out';W.setSpace('out');player.pos.set(-2.5,2,9.5);player.ry=.3;player.target=null;player.state='idle';$('msave').textContent=`DAY ${save.day} · ${save.coins} COINS · ${Object.keys(save.owned).length} ITEMS OWNED`;snd.music('island');}
function pause(on){if(on&&(app==='play'||app==='game')){pause.prev=app;app='paused';$('pause').hidden=false;document.body.classList.remove('playing');}else if(!on&&app==='paused'){app=pause.prev||'play';$('pause').hidden=true;document.body.classList.add('playing');}}

/* ================= simulation ================= */
const npcCtx={W,actors,player,say,emote,throwAt,get party(){return W.party;},get night(){return W.pal?W.pal.night:0;},snd};
let wasdT=0;
function step(dt){dt=Math.min(dt,.1);time+=dt;pollPad();
 for(let i=later.length-1;i>=0;i--){later[i].t-=dt;if(later[i].t<=0){const f=later[i].f;later.splice(i,1);f();}}
 if(fadeT>0){fadeT-=dt;if(fadeT<=0){if(fadeCb){const f=fadeCb;fadeCb=null;f();}setTimeout(()=>$('fade').classList.remove('on'),40);}}
 if(app==='game'||app==='res'||(app==='paused'&&pause.prev==='game')){if(app!=='paused'){stepGame(dt);day.t=Math.min(day.len,day.t+dt);if(day.t>=day.len)pendingEnd=true;}clearEdges();snd.tick();return;}
 if(app==='paused'||app==='summary'){clearEdges();visuals(dt);return;}
 if(app==='play'){day.t+=dt;if(day.t>=day.len){day.t=day.len;if(!pendingEnd){pendingEnd=true;}}
  if(pendingEnd&&fadeT<=0){endDay();clearEdges();return;}
  if(editing)editUpdate(dt);else controlPlayer(dt);
  checkTriggers();
  // golden snowflakes
  if(player.space==='out')for(const c of W.coins){if(!c.got&&Math.hypot(player.pos.x-c.x,player.pos.z-c.z)<1.8&&Math.abs(player.pos.y+1-c.y)<3){c.got=true;day.flakes++;addCoins(5,'golden snowflake '+day.flakes+'/'+W.coins.length);sparks.burst(new V3(c.x,c.y,c.z),50,6,[new THREE.Color(2.4,1.8,.4),new THREE.Color(2,2,2)],.45,1,{grav:2});}}}
 // actors
 for(const a of npcs){thinkNPC(a,dt,npcCtx);arrive(a);if(a.greet&&a.state==='walk'&&!a.target){a.greet=false;if(player.space===a.space&&a.pos.distanceTo(player.pos)<6){a.face(player.pos.x,player.pos.z);a.pg.play('wave');say(a,pick(LINES.greet),2.6);}}}
 for(const a of actors){if(a===player&&app==='menu'){player.pg.update(dt,0);player.pg.group.position.copy(player.pos);player.pg.group.rotation.y=player.ry;continue;}moveActor(a,dt,W);if(a.bubble&&a.bubble.t>0)a.bubble.t-=dt;}
 updateBalls(dt);clearEdges();visuals(dt);snd.tick();if(snd.ac)snd.ambience(app==='play'&&player.space==='out'?1:0);}
function clearEdges(){for(const k in edge)delete edge[k];mouse.click=false;mouse.rclick=false;mouse.wheel=0;}
function controlPlayer(dt){const p=player;
 if(mouse.wheel&&!uiOpen){camDistT=cl(camDistT+mouse.wheel*2.5,12,44);}
 if(mouse.rclick&&!uiOpen)throwForward();
 if(mouse.click&&!uiOpen){const a=pickActor(mouse.x,mouse.y);if(a){p.target=a.pos.clone().add(a.pos.clone().sub(p.pos).setY(0).normalize().multiplyScalar(-2.2));p.state='walk';talkTo=a;}
  else{const h=groundHit(mouse.nx,mouse.ny,p.space);if(h){p.target=h;p.state='walk';talkTo=null;if(p.seat)p.seat=null;sparks.burst(h.clone().setY(h.y+.15),10,2.4,new THREE.Color(1.4,1.2,.8),.25,.4,{up:true});}}}
 // keyboard / stick walking (camera relative)
 let ix=(keys.KeyD||keys.ArrowRight||keys.GpRight?1:0)-(keys.KeyA||keys.ArrowLeft||keys.GpLeft?1:0),iz=(keys.KeyS||keys.ArrowDown||keys.GpDown?1:0)-(keys.KeyW||keys.ArrowUp||keys.GpUp?1:0);
 if(Math.abs(keys.GpX||0)>.3)ix=keys.GpX;if(Math.abs(keys.GpY||0)>.3)iz=keys.GpY;
 if((ix||iz)&&!uiOpen){const c=Math.cos(camYaw),s=Math.sin(camYaw),dx=ix*c+iz*s,dz=-ix*s+iz*c,l=Math.hypot(dx,dz);p.target=p.pos.clone().add(new V3(dx/l*1.6,0,dz/l*1.6));p.state='walk';talkTo=null;wasdT=.1;}
 else if(wasdT>0){wasdT-=dt;if(wasdT<=0&&p.state==='walk'){p.target=null;}}
 if(p.state==='walk'&&!p.target){p.state='idle';if(talkTo&&talkTo.pos.distanceTo(p.pos)<4.5){talk(talkTo);}talkTo=null;}
 if(p.state==='sit'&&p.target)p.state='walk';if(p.state==='dance'&&p.target)p.state='walk';
 // auto-sit when stopping on a free seat
 if(p.state==='idle'&&!p.target){const room=W.roomAt(p.space,p.pos.x,p.pos.z);const s=(W.seats[room]||[]).find(s=>!s.taken&&Math.hypot(s.x-p.pos.x,s.z-p.pos.z)<.7);if(s){p.state='sit';p.ry=s.ry;p.pos.x=s.x;p.pos.z=s.z;}}
 const ns=p.state==='sit'?(W.seats[W.roomAt(p.space,p.pos.x,p.pos.z)]||[]).find(s=>Math.hypot(s.x-p.pos.x,s.z-p.pos.z)<.3)||null:null;if(p.seat&&p.seat!==ns&&p.seat.taken===p)p.seat.taken=null;p.seat=ns;if(ns)ns.taken=p;}

/* ================= visuals: camera, bubbles, hud ================= */
const tv=new V3(),tv2=new V3();let menuA=0;
function visuals(dt){const pl=player;
 W.update(dt,time,day?hour():11,pl.space==='out'||app==='menu'?pl.pos:pl.pos,cam);
 const out=W.space==='out';snow.pts.visible=out;snow.U.uA.value=.85;snow.update(dt,camFocus,cam,innerHeight,R.getPixelRatio());snow.U.uCol.value.setScalar(W.pal?1-W.pal.night*.55:1);
 prints.update(dt);puffs.update(dt,out?-1e9:0);sparks.update(dt);if(W.smoke&&out&&Math.random()<dt*8)for(const s of W.smoke)puffs.emit(s.x+rnd(-.2,.2),s.y,s.z+rnd(-.2,.2),rnd(-.2,.4),rnd(1,1.6),rnd(-.2,.2),.75,.75,.78,1.1,3.5,-.15,.2);
 // slide puffs
 for(const a of actors)if(a.slide>.5&&a.speed>3&&a.space===W.space&&Math.random()<.6)puffs.emit(a.pos.x+rnd(-.4,.4),a.pos.y+.2,a.pos.z+rnd(-.4,.4),rnd(-1,1),rnd(1,2.4),rnd(-1,1),1,1,1,.45,.6,6,2);
 coinFlash=Math.max(0,coinFlash-dt);
 cameraUpdate(dt);bubbles();hud();
 if(uiOpen==='shop'||editing)processThumbs();}
function cameraUpdate(dt){
 if(app==='menu'){menuA+=dt*.05;camFocus.set(0,3.2,4);const r=30;tv.set(Math.cos(menuA)*r,15+Math.sin(menuA*.7)*3,Math.sin(menuA)*r+4);if(camSnap){camPos.copy(tv);camSnap=false;}camPos.lerp(tv,1-Math.exp(-dt*2));cam.position.copy(camPos);cam.fov=44;cam.lookAt(camFocus);return;}
 if(app==='summary'||app==='intro'){camYawT+=dt*.08;}
 const inside=player.space!=='out';let pitch=inside?.92:camPitch,dist=inside?Math.min(camDistT,22):camDistT;if(editing){pitch=1.12;dist=21;}
 camYaw=damp(camYaw,inside?Math.round(camYawT/(Math.PI*2))*Math.PI*2:camYawT,6,dt);camDist=damp(camDist,dist,6,dt);
 const fy=player.pos.y+1.4;tv2.set(player.pos.x,fy,player.pos.z);if(inside){const o=SPACE_ORIGIN[player.space];tv2.x=lerp(o[0],player.pos.x,.45);tv2.z=lerp(o[2],player.pos.z,.45);tv2.y=1.2;}
 if(camSnap)camFocus.copy(tv2);else camFocus.lerp(tv2,1-Math.exp(-dt*7));
 tv.set(Math.sin(camYaw)*Math.cos(pitch)*camDist,Math.sin(pitch)*camDist,Math.cos(camYaw)*Math.cos(pitch)*camDist).add(camFocus);
 if(!inside){const gy=W.height(tv.x,tv.z)+3;if(tv.y<gy)tv.y=gy;}
 if(camSnap){camPos.copy(tv);camSnap=false;}else camPos.lerp(tv,1-Math.exp(-dt*8));cam.position.copy(camPos);cam.fov=inside?40:38;cam.lookAt(camFocus);}
function bubbles(){const w=innerWidth,h=innerHeight,show=app==='play'||app==='menu'||app==='intro';
 for(const a of actors){const tg=tagFor(a),same=a.space===player.space&&show;let vis=same&&a.pos.distanceToSquared(camFocus)<32*32&&!(app==='menu'&&a===player);
  if(vis){tv.copy(a.pos);tv.y-=.1;tv.project(cam);if(tv.z>1)vis=false;else{tg.style.transform=`translate(${(tv.x*.5+.5)*w}px,${(-tv.y*.5+.5)*h+4}px) translate(-50%,0)`;tg.style.left='0';tg.style.top='0';}}
  tg.style.display=vis&&app!=='menu'?'':'none';
  const b=a.bubble;if(b){const on=same&&b.t>0&&a.pos.distanceToSquared(camFocus)<40*40;if(on){tv.copy(a.pos);tv.y+=2.5*PSCALE;tv.project(cam);if(tv.z<1){b.el.style.transform=`translate(${(tv.x*.5+.5)*w}px,${(-tv.y*.5+.5)*h}px) translate(-50%,-100%)`;b.el.style.display='';b.el.style.opacity=Math.min(1,b.t*2);}else b.el.style.display='none';}else b.el.style.display='none';}}}
const hc={};const setT=(id,v)=>{if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}};
function hud(){if(app!=='play'&&app!=='intro')return;const h=hour();setT('clock',fmtHour(h));$('daybar').style.width=(day.t/day.len*100).toFixed(1)+'%';$('sunico').className=h>19.6||h<6.6?'moon':'';$('clockw').classList.toggle('late',day.len-day.t<60);
 setT('dayn',`DAY ${save.day}`);setT('coins',save.coins);setT('party','★ '+W.party.n.toUpperCase());const room=W.roomAt(player.space,player.pos.x,player.pos.z);if(room!==lastRoom){lastRoom=room;setT('room',ROOMS[room].n.toUpperCase());}
 setT('tip',player.space==='igloo'&&!editing?'Press I or the IGLOO button to decorate your igloo.':day.len-day.t<60?'The island day is ending soon...':'');}

/* ================= rendering ================= */
const POST={exposure:.8,bloom:.42,bloomThreshold:2,bloomRadius:.5,vignette:.28,saturation:1.16,grain:.012,ao:false};
let fxMain=null,gfx=quality();
function applyQuality(q){gfx=q;W.setShadowQuality(q);R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));fxMain=null;for(const k in mgFx){if(mgFx[k].composer)mgFx[k].composer.dispose();delete mgFx[k];}}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function getFx(sc,cm,post){const key=sc.uuid;let f=sc===scene?fxMain:mgFx[key];if(!f||f.cam!==cm){f=cinematic(R,sc,cm,{...post,quality:gfx});f.cam=cm;f.w=0;if(sc===scene)fxMain=f;else mgFx[key]=f;}
 const w=innerWidth,h=innerHeight;if(f.w!==w*9999+h){f.w=w*9999+h;f.setSize(w,h);}return f;}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);
 const gm=(app==='game'||app==='res'||(app==='paused'&&pause.prev==='game'))&&mg&&mg.inst;
 if(gm){const i=mg.inst,c=i.camera;c.aspect=w/h;c.updateProjectionMatrix();if(i.particles)for(const p of i.particles)p.setScale(c,h,R.getPixelRatio());const f=getFx(i.scene,c,{...POST,...(i.post||{})});if(i.preRender)i.preRender(R);f.render();return;}
 cam.aspect=w/h;cam.updateProjectionMatrix();puffs.setScale(cam,h,R.getPixelRatio());sparks.setScale(cam,h,R.getPixelRatio());
 const f=getFx(scene,cam,POST);const n=W.pal?W.pal.night:0,inside=W.space!=='out';R.toneMappingExposure=inside?.92:.8+n*.12;if(f.bloom){f.bloom.threshold=inside?1.3:lerp(2,1.25,n);f.bloom.strength=inside?.45:.38+n*.14;}f.render();}
addEventListener('resize',()=>{fxMain&&(fxMain.w=0);for(const k in mgFx)mgFx[k].w=0;});

/* ================= menu wiring ================= */
function buildColorSeg(){const el=$('o-col');el.innerHTML=BODY_COLORS.filter(c=>owns(c.id)).map(c=>`<button data-c="${c.id}" class="${save.colorId===c.id?'on':''}" style="background:#${new THREE.Color(c.hex).getHexString()}" title="${c.n}"></button>`).join('')+'<span style="font-size:.6rem;color:#8a8f9a;align-self:center;margin-left:6px">more colours in the catalog</span>';
 el.querySelectorAll('button').forEach(b=>b.onclick=()=>{useColor(b.dataset.c);});}
buildColorSeg();$('o-name').value=save.name||'';
{const el=$('o-diff');const set=v=>{save.diff=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));persist();};set(save.diff);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(+b.dataset.v));}
$('go').onclick=()=>start({spawn:true});$('reset').onclick=()=>{if(!confirm('Start a brand new save? Your coins, items and igloo will be reset.'))return;save=defSave();persist();player.pg.setWear(save.wear);player.pg.setColor(colorHex(save.colorId));player.setPet(null,scene);buildIgloo();buildColorSeg();$('o-name').value='';newDay();toMenu();};
$('again').onclick=()=>start({newDay:true,spawn:true});$('omenu').onclick=()=>{newDay();toMenu();};$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{if(pause.prev==='game'&&mg){disposeGame();mg=null;}toMenu();};
$('mgigo').onclick=()=>beginGame(mg.id);$('mgiback').onclick=closeIntro;$('mgragain').onclick=()=>beginGame(mg.id);$('mgrback').onclick=exitGame;
$('shopx').onclick=closeUI;$('mapw').onclick=e=>{if(e.target.id==='mapw')closeUI();};$('shopw').onclick=e=>{if(e.target.id==='shopw')closeUI();};$('editdone').onclick=endEdit;
document.querySelectorAll('#stabs button').forEach(b=>b.onclick=()=>openShop(b.dataset.t));
document.querySelectorAll('#dock button').forEach(b=>b.onclick=()=>{snd.init();const a=b.dataset.a;if(uiOpen===a){closeUI();return;}if(a==='map'||a==='chat'||a==='emote'||a==='shop')openUI(a);else if(a==='home')goHome();else if(a==='throw')throwForward();else doEmote(a);});
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Penguin Plaza\nPoints: ${a.pts||0} coins earned in one island day\nDay: ${a.day||1} · ${a.party||''}\nMinigames played: ${a.games||0}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] '+ID+' '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= loop ================= */
buildIgloo();toMenu();camSnap=true;
let last=performance.now(),manual=!!window.__PLAZA_MANUAL;function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!manual){step(dt);render();}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.PLAZA={get state(){return app;},get app(){return app;},start,toMenu,step,render,set manual(v){manual=v;},get manual(){return manual;},
 get clock(){return day.len-day.t;},setClock(s){day.t=day.len-s;},get day(){return day;},get save(){return save;},get coins(){return save.coins;},give(n){addCoins(n,'test');},
 player,npcs,actors,W,ROOMS,GAMES,travelTo,travel,get space(){return player.space;},walkTo(x,z){player.target=new V3(x,0,z);player.state='walk';},
 openIntro,beginGame,get mg(){return mg;},get inst(){return mg&&mg.inst;},finishGame,showResults,exitGame,endDay,
 buy,wear,useColor,walkPet,openShop:(t)=>{openUI('shop');openShop(t||'hat');},closeUI,openUI,get uiOpen(){return uiOpen;},startEdit,endEdit,get editing(){return editing;},placeFurniture(id,x,z,r=0){save.igloo.push({id,x,z,r});buildIgloo();persist();},buildIgloo,
 sayChat,emote:(s)=>emote(player,s),doEmote,throwAt:(x,z)=>throwBall(player,new V3(x,W.ground(player.space,x,z)+.5,z)),get balls(){return balls.filter(b=>b.on).length;},
 keys,edge,mouse,press(code){edge[code]=true;keys[code]=true;onKey(code);},release(code){keys[code]=false;},interact,get prompt(){return promptT;},cam,scene,R,setQuality:applyQuality,
 hour,setHour(h){day.t=(h-7)/16.5*day.len;},thumbs,setCam(o){if(o.yaw!==undefined)camYawT=camYaw=o.yaw;if(o.dist!==undefined)camDistT=camDist=o.dist;if(o.pitch!==undefined)camPitch=o.pitch;camSnap=true;}};
