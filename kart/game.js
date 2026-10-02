// CRITTER KART — island adventure racer for Pixel Arcade (original game).
// Adventure: drive around Critter Island, open race doors with balloons, beat four worlds (kart / hovercraft / plane tracks)
// and their bosses, then chase silver coins. Quick Race: any track, 1P or 2P split-screen against CPU critters.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {ID,DRIVERS,THEMES,WORLDS,TRACKS,trackById,DOOR_REQ,ITEMS,rollItem,DIFF,loadSave,writeSave,balloons} from './data.js';
import {buildCourse,buildTerrain,query,at,yawAt,SEA} from './course.js';
import {buildWorld,hubDoor,balloonMesh} from './world.js';
import {makeVehicle,makeBossRig,makeCritter} from './models.js';
import {newRacer,place,stepRacer,collide,pickups,hitRacer} from './physics.js';
import {Items} from './items.js';
import {think} from './ai.js';
import {FX} from './fx.js';
import {Sound} from './sound.js';
import {HUD,icon,drawMini} from './hud.js';
import {V,cl,lerp,wrapA,ORD,fmtT,fmtClock,textSprite} from './util.js';

const $=id=>document.getElementById(id);
const DT=1/60,LIMIT=180,BOSS_LIMIT=165;
const HUB={id:'hub',n:'CRITTER ISLAND',hub:1,veh:'kart',laps:1,R:108,sx:1.15,sz:1,h:[[4,.06,0],[3,.05,1.2]],y:[2.5,[[2,1.2,0]]],wd:9,seed:7};

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const mainCam=new THREE.PerspectiveCamera(60,1,.3,9000);
const fx=new FX(scene),snd=new Sound(),hud=new HUD($('views'));const pmrem=new THREE.PMREMGenerator(R);
function envFor(T){const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,128);const h=n=>'#'+new THREE.Color(n).getHexString();
 g.addColorStop(0,h(T.sky[0]));g.addColorStop(.48,h(T.sky[1]));g.addColorStop(.52,h(T.ground[1]));g.addColorStop(1,'#202020');x.fillStyle=g;x.fillRect(0,0,256,128);
 const sx=(Math.atan2(T.sun[0],-T.sun[2])/(Math.PI*2)+.5)*256,sy=(.5-Math.asin(T.sun[1])/Math.PI)*128;const rg=x.createRadialGradient(sx,sy,0,sx,sy,30);rg.addColorStop(0,'#fff');rg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=rg;x.fillRect(0,0,256,128);
 const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;const e=pmrem.fromEquirectangular(t).texture;t.dispose();return e;}

/* ================= state ================= */
let save=loadSave();
let opt={mode:0,humans:1,diff:save.diff??1,picks:[save.driver||0,4],world:0,track:'driftwood'};
try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_critterkart_opt'))||{});}catch(e){}
let app='menu',phase='intro',C=null,TR=null,W=null,T=null,def=null,racers=[],views=[],items=null,doors=[],hubDeco=null;
let raceT=0,clock=LIMIT,limit=LIMIT,introT=0,cdT=0,endT=0,time=0,acc=0,finishOrder=[],coinsOn=false,lastAward=null,raceMode='quick',lastDoor=null,banT=0,startPress=[],hubMsgT=0,gfx=quality(),autopilot=false,doorCool=0;

/* ================= input ================= */
const keys={},edge={};addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Slash','Enter'].includes(e.code)&&app!=='menu')e.preventDefault();
 if(e.code==='Escape'){if(app==='race')pause(true);else if(app==='paused')pause(false);else if(app==='hub')toMenu();}snd.init();});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const MAP=[{f:['KeyW'],b:['KeyS'],l:['KeyA'],r:['KeyD'],d:['Space'],i:['KeyE','KeyF']},{f:['ArrowUp'],b:['ArrowDown'],l:['ArrowLeft'],r:['ArrowRight'],d:['Slash','ShiftRight'],i:['Enter','Period']}];
const any=a=>a.some(k=>keys[k]);
function pad(i){const g=navigator.getGamepads?navigator.getGamepads()[i]:null;if(!g)return null;const b=k=>g.buttons[k]&&(g.buttons[k].pressed||g.buttons[k].value>.3);
 return{gas:b(0)||b(7)?1:0,brake:b(1)||b(6)?1:0,x:Math.abs(g.axes[0])>.15?g.axes[0]:0,y:Math.abs(g.axes[1])>.2?-g.axes[1]:0,item:b(2),drift:b(5)||b(4),start:b(9)};}
function readInput(r){const h=r.human,m=MAP[h],I=r.inp,solo=humansN()===1;const kb=k=>any(m[k])||(solo&&any(MAP[1][k]));
 const eg=k=>m[k].some(c=>edge[c])||(solo&&MAP[1][k].some(c=>edge[c]));const gp=pad(h);let gas=kb('f')?1:0,br=kb('b')?1:0,st=(kb('l')?1:0)-(kb('r')?1:0),dr=kb('d')||eg('d'),it=(kb('i')||eg('i'))&&app!=='hub';
 if(gp){if(gp.gas)gas=1;if(gp.brake)br=1;if(gp.x)st=-gp.x;if(gp.drift)dr=true;if(gp.item)it=true;}
 if(r.veh==='plane'){I.pitch=(gas?1:0)-(br?1:0)+(gp&&gp.y?gp.y:0);I.gas=1;I.brake=0;}else{I.gas=gas;I.brake=br;}
 I.steer=cl(st,-1,1);I.drift=dr;I.hop=r.veh==='hover'?dr&&Math.abs(I.steer)<.3:dr;I.item=it;}
const humansN=()=>racers.filter(r=>r.human>=0).length;

/* ================= world loading ================= */
function clearWorld(){if(W){scene.remove(W.grp);W.grp.traverse(o=>{if(o.geometry)o.geometry.dispose();});}for(const r of racers)scene.remove(r.g);racers=[];if(items)items.clear();fx.clear();doors=[];hubDeco=null;}
function loadWorld(d,themeKey,col){clearWorld();def=d;T={...THEMES[themeKey],key:themeKey};C=buildCourse(d);TR=buildTerrain(C,T);
 if(d.hub){C.berries=[];C.coins=[];C.pods=[];}
 W=buildWorld(C,TR,T,{col,hub:!!d.hub});scene.add(W.grp);scene.environment=envFor(T);scene.fog=new THREE.FogExp2(T.fog,T.fogD*(d.veh==='plane'?.75:1));
 items=new Items(scene,C,TR,fx);applyQuality(gfx);}
function addRacer(d,veh,o){const r=newRacer(d,veh,o);r.g=o.boss?makeBossRig(o.bossDef):makeVehicle(veh,d);scene.add(r.g);racers.push(r);return r;}

/* ================= race setup ================= */
function startRace(id,o={}){const t=trackById(id)||TRACKS[0];snd.init();raceMode=o.mode||raceMode;const wd=WORLDS[t.w];
 loadWorld(t,wd.theme,wd.col);const hum=o.humans??opt.humans,picks=o.picks||opt.picks,diff=DIFF[o.diff??opt.diff];
 coinsOn=!!o.coins;C.coins.forEach(c=>c.got=0);W.cIM.visible=coinsOn;
 const used=new Set();const n=t.boss?1+hum:8;const grid=[];
 for(let h=0;h<hum;h++){const d=DRIVERS[picks[h]%8];used.add(d.id);grid.push(addRacer(d,t.veh,{human:h}));}
 if(t.boss){const b=wd.boss;const bd={id:'boss',n:b.n,sp:b.sp,c:b.c,c2:b.c2,kc:0x3a2a1a,spd:5,acc:4,han:4,wt:5};const r=addRacer(bd,b.veh==='plane'?'plane':t.veh,{boss:true,bossDef:b,name:b.n});r.bossHz=b.haz;r.personal=1;grid.unshift(r);}
 else{const pool=DRIVERS.filter(d=>!used.has(d.id));for(let k=0;grid.length<n;k++){const d=pool[k%pool.length];const r=addRacer(d,t.veh,{});r.personal=.92+Math.random()*.12;grid.unshift(r);}}
 // grid slots behind the line: humans start at the back like an adventure racer
 const B=C.B,plane=t.veh==='plane';grid.forEach((r,k)=>{const row=Math.floor(k/2),col=k%2?1:-1;const back=(6+row*(plane?9:6.5))/B.step;const u=col*B.w[0]*.42;place(C,r,B.n-back,u,plane?(k%2?2:-2):0);r.p.y+=plane?0:.1;r.lap=0;r.half=true;r.f=r.q.prog;r.prog=r.f-1;r.laneOff=(Math.random()-.5)*B.w[0]*.6;r.camYaw=r.yaw;});
 views=racers.filter(r=>r.human>=0).sort((a,b)=>a.human-b.human).map(r=>({r,cam:new THREE.PerspectiveCamera(62,1,.3,9000),cp:null,look:new V()}));
 raceT=0;limit=t.boss?BOSS_LIMIT:LIMIT;clock=limit;introT=0;cdT=3;endT=0;finishOrder=[];startPress=[];phase='intro';app='race';opt.diffObj=diff;curDiff=diff;
 hud.setViews(views.length,views.map(v=>v.r));document.body.classList.add('playing');$('hud').classList.toggle('splitmode',views.length>1);
 show('hud');snd.engines(views.length);banner(t.n,(t.boss?'BOSS RACE · ':'')+(coinsOn?'SILVER COIN CHALLENGE · ':'')+{kart:'KART',hover:'HOVERCRAFT',plane:'PLANE'}[t.veh]+' · '+t.laps+' LAPS',2.6);}
let curDiff=DIFF[1];
function show(which){for(const id of['menu','hud','hubhud','over','pause'])$(id).hidden=id!==which&&!(which==='pause'&&id==='hud');$('keys').hidden=which!=='menu';}

/* ================= hub ================= */
function doorList(){const out=[];WORLDS.forEach((w,wi)=>{const tr=TRACKS.filter(t=>t.w===wi);tr.forEach((t,k)=>out.push({t,w:wi,f:wi/4+.045+k*.048}));});return out;}
function startHub(atDoor){snd.init();raceMode='adventure';loadWorld(HUB,'hub','#ffb040');const d=DRIVERS[opt.picks[0]%8];const r=addRacer(d,'kart',{human:0});
 const B=C.B,n=B.n;doors=doorList().map(o=>{const i=Math.round(o.f*n)%n,u=B.w[i]+13,p=at(C,i,u);p.y=TR.h(p.x,p.z);const req=DOOR_REQ[o.t.id],open=balloons(save)>=req;
  const st=o.t.boss?(save.boss[o.w]?'BEATEN ♛':'BOSS'):save.coins[o.t.id]?'★ ALL DONE':save.won[o.t.id]?'★ COIN CHALLENGE':null;
  const g=hubDoor(o.t,req,open,st,WORLDS[o.w].col);g.position.copy(p);g.rotation.y=Math.atan2(-B.nx[i],-B.nz[i]);W.grp.add(g);return{...o,i,u,p,g,open,req};});
 // world gate signs + balloon tower + boss statues
 WORLDS.forEach((w,wi)=>{const i=Math.round((wi/4+.115)*n)%n,p=at(C,i,B.w[i]+34);p.y=TR.h(p.x,p.z);const sg=textSprite([{t:w.n,f:'84px Anton, Impact, sans-serif',c:w.col,y:110},{t:'WORLD '+(wi+1),f:'40px JetBrains Mono, monospace',c:'#fff',y:190}],{w:768,h:256,sx:22,border:w.col});sg.position.set(p.x,p.y+22,p.z);W.grp.add(sg);});
 const tower=new THREE.Group();const ty=TR.h(0,0);tower.position.set(0,ty,0);const ped=new THREE.Mesh(new THREE.CylinderGeometry(6,8,6,10),new THREE.MeshStandardMaterial({color:0xd8c8a8,roughness:.8,flatShading:true}));ped.position.y=3;ped.castShadow=ped.receiveShadow=true;tower.add(ped);
 const nb=balloons(save),cols=[0xff3a6a,0xffd03a,0x3ac8ff,0x7aff4a,0xb06aff];const bl=[];for(let k=0;k<Math.max(1,nb);k++){const b=balloonMesh(cols[k%5]);const a=k*2.4,rr=1.5+Math.sqrt(k)*1.6;b.position.set(Math.cos(a)*rr,12+k*.55+Math.sin(k)*1.2,Math.sin(a)*rr);b.scale.setScalar(nb?1.4:.001);tower.add(b);bl.push(b);}
 WORLDS.forEach((w,wi)=>{const st=makeCritter({sp:w.boss.sp,c:save.boss[wi]?w.boss.c:0x6a6a70,c2:save.boss[wi]?w.boss.c2:0x9a9aa0,kc:0});const a=wi/4*Math.PI*2+Math.PI/4;st.position.set(Math.cos(a)*9,6,Math.sin(a)*9);st.rotation.y=-a+Math.PI/2;st.scale.multiplyScalar(2.2);tower.add(st);});
 tower.scale.setScalar(2.3);const spire=new THREE.Mesh(new THREE.CylinderGeometry(.6,1.6,14,8),new THREE.MeshStandardMaterial({color:0xfff0d8,roughness:.6,flatShading:true}));spire.position.y=13;spire.castShadow=true;tower.add(spire);
 const cap=new THREE.Mesh(new THREE.ConeGeometry(2.4,3.5,8),new THREE.MeshStandardMaterial({color:0xff4d00,roughness:.5,flatShading:true}));cap.position.y=21.5;tower.add(cap);
 const title=textSprite([{t:'CRITTER ISLAND',f:'92px Anton, Impact, sans-serif',c:'#ffd23a',y:100},{t:nb+' / 28 BALLOONS',f:'44px JetBrains Mono, monospace',c:'#fff',y:186}],{w:768,h:256,sx:14,border:'#ff4d00'});title.position.y=28;tower.add(title);
 bl.forEach((b,k)=>{b.position.y+=12;});
 W.grp.add(tower);hubDeco={tower,bl};
 let i0=0,u0=0;if(atDoor){const dd=doors.find(x=>x.t.id===atDoor);if(dd){i0=dd.i-6;u0=B.w[dd.i]*.4;}}
 place(C,r,i0,u0);r.yaw=yawAt(C,i0);if(atDoor){const dd=doors.find(x=>x.t.id===atDoor);if(dd){r.p.set(dd.p.x-B.nx[dd.i]*12,0,dd.p.z-B.nz[dd.i]*12);r.p.y=TR.h(r.p.x,r.p.z);r.yaw=Math.atan2(-B.nx[dd.i],-B.nz[dd.i]);query(C,r.p.x,r.p.z,-1,r.q);r.idx=r.q.i;}}
 r.camYaw=r.yaw;views=[{r,cam:new THREE.PerspectiveCamera(62,1,.3,9000),cp:null,look:new V()}];hud.setViews(1,[r]);app='hub';phase='free';doorCool=1;
 document.body.classList.add('playing');show('hubhud');updateHubHud();snd.engines(1);
 if(balloons(save)===0&&!atDoor)hubMsg('WELCOME TO CRITTER ISLAND!',3);
 if(Object.keys(save.boss).length===4&&atDoor)hubMsg('ISLAND CHAMPION! ♛',4);}
function updateHubHud(){$('hb-ic').src=icon('balloon');$('hb-n').textContent=balloons(save);$('hb-keys').innerHTML=WORLDS.map((w,i)=>`<img src="${icon('key',48)}" class="${save.boss[i]?'on':''}" title="${w.boss.n}">`).join('');}
function hubMsg(s,t=2){$('hubmsg').textContent=s;$('hubmsg').classList.add('on');hubMsgT=t;}
let nearDoor=null;
function hubStep(dt){const r=racers[0];if(!autopilot)readInput(r);else think(C,r,racers,curDiff,{hazards:[]},dt);stepRacer(C,TR,r,dt,env);doorCool-=dt;
 nearDoor=null;let bd=1e9;for(const d of doors){const dist=Math.hypot(r.p.x-d.p.x,r.p.z-d.p.z);if(dist<18&&dist<bd){bd=dist;nearDoor=d;}
  if(dist<4.2&&doorCool<=0){if(d.open){enterDoor(d);return;}else{r.v=-8;doorCool=1;hubMsg('NEED '+d.req+' BALLOONS',1.6);snd.play('pop');}}}
 if(nearDoor&&(edge.Enter||(pad(0)||{}).start))enterDoor(nearDoor);
 const dp=$('door');if(nearDoor){dp.hidden=false;const d=nearDoor,t=d.t,wd=WORLDS[d.w];dp.style.borderLeftColor=wd.col;$('d-world').textContent=wd.n+(t.boss?' · BOSS':'');$('d-name').textContent=t.n;
  const won=save.won[t.id],coins=save.coins[t.id];$('d-info').innerHTML=!d.open?`Locked — collect <b>${d.req}</b> balloons to open this door. You have ${balloons(save)}.`:t.boss?`Race <b>${wd.boss.n}</b> one-on-one. ${wd.boss.d}`:
   `${{kart:'Kart',hover:'Hovercraft',plane:'Plane'}[t.veh]} race · ${t.laps} laps. `+(coins?'Both balloons won!':won?'<b>Silver coin challenge:</b> grab all 8 silver coins and win.':'Finish 1st to win a balloon.');
  $('d-best').textContent=save.best[t.id]?'BEST '+fmtT(save.best[t.id]):'';$('d-go').hidden=!d.open;}else dp.hidden=true;
 if(hubDeco){hubDeco.bl.forEach((b,k)=>{b.position.y+=Math.sin(time*1.5+k)*.004;b.rotation.y+=dt*.3;});}
 if(hubMsgT>0){hubMsgT-=dt;if(hubMsgT<=0)$('hubmsg').classList.remove('on');}}
function enterDoor(d){if(!d||!d.open)return;snd.play('door');lastDoor=d.t.id;const coins=!d.t.boss&&save.won[d.t.id]&&!save.coins[d.t.id];fadeTo(()=>startRace(d.t.id,{mode:'adventure',humans:1,coins}));}
function fadeTo(fn){const f=$('fade');f.classList.add('on');app='fading';setTimeout(()=>{fn();setTimeout(()=>f.classList.remove('on'),60);},360);}

/* ================= env callbacks (physics → fx/sfx/rules) ================= */
const env={t:0,frozen:false,
 lap(r){if(app!=='race')return;if(r.lap>=2){const lt=raceT-r.lapStart;r.lapTimes.push(lt);r.bestLap=Math.min(r.bestLap,lt);}r.lapStart=raceT;
  if(r.lap>def.laps&&!r.fin){r.fin=raceT;finishOrder.push(r);r.finPlace=finishOrder.length;if(r.human>=0){r.vmsg=ORD(r.finPlace)+'!';snd.play(r.finPlace===1?'win':'lap');fx.confetti(r.p);}}
  else if(r.human>=0&&r.lap===def.laps&&def.laps>1){r.vmsg='FINAL LAP';r.vmsgT=1.6;snd.play('lap');}else if(r.human>=0&&r.lap>1){r.vmsg='LAP '+r.lap;r.vmsgT=1;snd.play('lap');}},
 pod(r){if(r.human>=0)snd.play('pod');},berry(r,b){if(r.human>=0){snd.play('berry');fx.sparkle(b.p,0xff4a7a,8);}},coin(r,c){snd.play('coin');fx.sparkle(c.p,0xdfe8ff,24);r.vmsg=r.coins+' / 8';r.vmsgT=.9;},
 hurt(r,lost,k){if(r.human>=0){snd.play('hit');r.vmsg=lost?'-'+lost+' BERRIES':'';r.vmsgT=.8;}fx.boom(r.p,k);},pop(r){snd.play('pop');fx.sparkle(r.p,0x9af0ff,30);},
 splash(r){fx.spray(r.p,30);for(let k=0;k<20;k++)fx.spray(r.p,30);if(r.human>=0){snd.play('splash');r.vmsg='SPLASH!';r.vmsgT=1;}},jump(r){if(r.human>=0)snd.blip&&snd.play('zip');},land(r,v){for(let k=0;k<8;k++)fx.dust(r.p);},
 ring(r,g){if(r.human>=0){snd.play('ring');fx.sparkle(g.p,g.gold?0xffd03a:0xff6aa0,30);}},barrel(r){r.barrelDir=r.inp.steer>=0?1:-1;},scrape(r){if(Math.random()<.3)fx.dust(r.p,0xaaaaaa);},
 bump(a,b,ov){if((a.human>=0||b.human>=0)&&ov>.3)snd.blip(140,.08,'square',.06);},sfx(k,r){if(r.human>=0||Math.random()<.4)snd.play(k);}};

/* ================= race step ================= */
function ranks(){const ord=racers.slice().sort((a,b)=>(a.fin&&b.fin)?a.fin-b.fin:a.fin?-1:b.fin?1:b.prog-a.prog);ord.forEach((r,k)=>r.place=k+1);return ord;}
function raceStep(dt){time+=dt;env.t=time;
 if(phase==='intro'){introT+=dt;env.frozen=true;if(introT>2.4||edge.Enter||edge.Space){phase='count';cdT=3;}}
 if(phase==='count'){const before=Math.ceil(cdT);cdT-=dt;env.frozen=true;if(Math.ceil(cdT)!==before&&cdT>0)snd.play('beep');
  for(const r of racers)if(r.human>=0){readInput(r);if((r.veh==='plane'?keys.KeyW||keys.ArrowUp:r.inp.gas>0)&&startPress[r.human]===undefined)startPress[r.human]=cdT;}
  if(cdT<=0){phase='go';snd.play('go');env.frozen=false;for(const r of racers)if(r.human>=0){const sp=startPress[r.human];if(sp!==undefined&&sp<.55){r.zipT=1.4;r.vmsg='ROCKET START!';r.vmsgT=1.2;}}
   for(const r of racers)if(r.human<0&&Math.random()<curDiff.skill*.6)r.zipT=1;}}
 if(phase==='go'||phase==='done'){raceT+=dt;clock-=dt;}
 const ctx={hazards:items.list,finishedHumans:false,hazard:(b,h)=>{items.hazard(b.bossHz,b,h);if(b.bossHz==='bolt')snd.play('bolt');}};
 for(const r of racers){if(r.human>=0&&!r.fin&&!autopilot)readInput(r);else{think(C,r,racers,curDiff,ctx,dt);if(r.fin){r.inp.item=false;}}
  if(phase==='intro'||phase==='count'){r.inp.item=false;}
  stepRacer(C,TR,r,dt,env);
  if(r.roll_>0){r.roll_-=dt;if(r.roll_<=0)r.item=rollItem(r.place,racers.length);}
  if(r.inp.item&&!r.prevItem&&r.item&&r.roll_<=0&&phase==='go')items.use(r,racers,env);r.prevItem=r.inp.item;
  if(phase==='go')pickups(C,r,env,coinsOn);
  if(r.vmsgT>0){r.vmsgT-=dt;if(r.vmsgT<=0&&!r.fin)r.vmsg='';}
  if(r.human>=0&&!r.fin){const tx=C.B.tx[r.q.i],tz=C.B.tz[r.q.i];const dot=Math.sin(r.yaw)*tx+Math.cos(r.yaw)*tz;r.wrongT=dot<-.35&&r.v>4?(r.wrongT||0)+dt:0;r.wrong=r.wrongT>1;
   if(r.offT>5||(r.q&&Math.abs(r.q.u)>r.q.w+24&&r.v<3&&phase==='go'))r.stuckT=(r.stuckT||0)+dt;else r.stuckT=0;if(r.stuckT>4){r.rescueT=1;r.stuckT=0;}}
  if(r.human<0&&phase==='go'){if(Math.abs(r.q.u)>r.q.w+10&&r.v<6)r.stuckT=(r.stuckT||0)+dt;else r.stuckT=0;if(r.stuckT>3){r.rescueT=.8;r.stuckT=0;}}}
 if(phase==='go')collide(racers,env);items.update(dt,racers,env);ranks();
 // end conditions
 if(phase==='go'){const hum=racers.filter(r=>r.human>=0);if(hum.every(r=>r.fin)){endT+=dt;if(endT>2.6)endRace(false);}else if(clock<=0)endRace(true);}}

/* ================= results / scoring ================= */
function endRace(timeUp){phase='done';const ord=ranks();const n=racers.length,lapLen=C.len;
 // estimate finish for racers still on course
 const est=r=>{if(r.fin)return r.fin;const avg=raceT/Math.max(.2,r.prog);return raceT+(def.laps+1-r.prog)*avg;};
 const me=racers.find(r=>r.human===0);const finished=!!me.fin,place=me.place;
 let rew=[];let newBalloon=false;
 if(raceMode==='adventure'&&finished&&place===1){const t=def;if(t.boss){if(!save.boss[t.w]){save.boss[t.w]=1;newBalloon=true;rew.push('BOSS BEATEN! +1 BALLOON + TROPHY KEY');}else rew.push('BOSS BEATEN AGAIN!');}
  else if(coinsOn){if(me.coins>=8){if(!save.coins[t.id]){save.coins[t.id]=1;newBalloon=true;rew.push('SILVER COIN CHALLENGE COMPLETE! +1 BALLOON');}}else rew.push('WON — BUT ONLY '+me.coins+'/8 SILVER COINS');}
  else if(!save.won[t.id]){save.won[t.id]=1;newBalloon=true;rew.push('+1 BALLOON!');}else rew.push('1ST PLACE AGAIN!');}
 else if(raceMode==='adventure'&&finished)rew.push(def.boss?(WORLDS[def.w].boss.n+' WINS THIS TIME. TRY AGAIN!'):'FINISH 1ST TO WIN THE BALLOON');
 if(finished&&(!save.best[def.id]||me.fin<save.best[def.id]))save.best[def.id]=me.fin;
 save.driver=opt.picks[0];save.diff=opt.diff;writeSave(save);
 if(newBalloon){snd.play('balloon');if(Object.keys(save.boss).length===4&&def.boss)rew.push('ISLAND CHAMPION — ALL FOUR BOSSES BEATEN!');}
 const pts=award(me,timeUp);
 $('oeye').textContent=(timeUp?'TIME UP · ':'')+def.n+' · '+WORLDS[def.w].n;
 $('ores').textContent=finished?(place===1?'1ST PLACE!':ORD(place)+' PLACE'):'TIME UP';$('ores').style.color=finished&&place===1?'#ffd23a':finished?'#fff':'#ff6a4a';
 $('orew').textContent=rew.join(' · ')||(finished?'':'The race clock ran out before you crossed the line.');
 const lapsDone=r=>r.fin?'—':'LAP '+Math.max(1,Math.min(def.laps,r.lap));
 $('otab').innerHTML='<tr><th>#</th><th>RACER</th><th>TIME</th><th>BEST LAP</th><th>BERRIES</th><th>HITS</th></tr>'+ord.map((r,k)=>`<tr class="${r.human>=0?'me':r.boss?'boss':''}"><td>${k+1}</td><td><i style="background:#${(r.boss?0xff3a3a:r.d.kc).toString(16).padStart(6,'0')}"></i>${r.name}${r.human>=0?' (P'+(r.human+1)+')':''}</td><td>${r.fin?fmtT(r.fin):timeUp?'DNF · '+lapsDone(r):'~'+fmtT(est(r))}</td><td>${r.bestLap<1e8?fmtT(r.bestLap):'—'}</td><td>${r.berries}</td><td>${r.stats.landed||0}</td></tr>`).join('');
 $('otok').textContent=`${pts.pts} PTS · +${pts.tok} TOKENS · BEST ${best()} PTS`;
 $('cont').textContent=raceMode==='adventure'?'BACK TO ISLAND':'MENU';$('omenu').hidden=raceMode!=='adventure';
 app='results';snd.stop();if(!(finished&&place===1))snd.play('lose');setTimeout(()=>{if(app==='results'){show('over');document.body.classList.remove('playing');}},timeUp?200:900);
 window.dispatchEvent(new Event('critterkart:end'));}
function award(me,timeUp){const n=racers.length,place=me.place,fin=!!me.fin;const table=n<=2?[1500,300]:[1000,800,650,500,400,300,200,100];
 const pts=Math.round((fin?table[place-1]||100:50)+me.berries*20+me.coins*50+(fin?Math.max(0,limit-me.fin)*4:0)+(me.stats.rings||0)*10);
 const won=fin&&place===1;lastAward={pts,won,place,track:def.n,time:me.fin,driver:me.d.n,veh:def.veh,mode:raceMode,split:humansN()>1,diff:curDiff.n};
 const tok=5+Math.min(60,pts/60|0);try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID;if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return{pts,tok};}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID)||0);}catch(e){return 0;}}

function pause(on){if(on&&app==='race'){app='paused';$('pause').hidden=false;snd.stop();}else if(!on&&app==='paused'){app='race';$('pause').hidden=true;}}
function toMenu(){clearWorld();app='menu';views=[];document.body.classList.remove('playing');show('menu');snd.stop();refreshMenu();menuScene();}

/* ================= visuals per frame ================= */
const _f=new V(),_t=new V();
function poseRacer(r,dt){const g=r.g,U=g.userData;g.position.copy(r.p);if(r.rescueT>0){g.position.y+=r.rescueT*6;}g.visible=!(r.rescueT>0&&r.rescueT<.25);
 g.rotation.set(-r.pitch,r.yaw,r.roll,'YXZ');const st=r.inp.steer||0;
 if(U.wheels)U.wheels.forEach((w,k)=>{w.rotation.x+=r.v*dt/.3;if(k<2&&U.type==='kart')w.rotation.y=st*.4;});if(U.sw)U.sw.rotation.z=-st*1.4;if(U.fan)U.fan.rotation.z+=dt*(8+Math.abs(r.v));if(U.prop)U.prop.rotation.z+=dt*(20+r.v);
 const cr=U.crit;if(cr){const D=cr.userData;D.head.rotation.y=lerp(D.head.rotation.y,st*.45+(r.spinT>0?Math.sin(time*20)*.5:0),Math.min(1,dt*8));D.head.position.y=.78+Math.sin(time*10+r.d.spd)*.015*Math.min(1,r.v/10);
  D.arms.forEach((a,k)=>{a.rotation.z=st*.35*(k?1:-1)*-1;a.rotation.x=r.fin&&r.finPlace<=3?-2.2+Math.sin(time*8+k)*.3:0;});if(D.tail)D.tail.rotation.y=Math.sin(time*6)*.4;if(D.ears)D.ears.forEach((e,k)=>e.rotation.x=-.3-Math.min(1,r.v/30)*.8);if(D.wings)D.wings.forEach((w,k)=>w.rotation.z=Math.sin(time*(U.type==='boss'?9:3))*.5*(k?1:-1));
  D.body.rotation.x=-(r.zipT>0?.18:0);}
 if(U.bubble)U.bubble.visible=r.shield>0;
 const boost=r.zipT>0;if(U.fl)U.fl.forEach(f=>{f.visible=boost;if(boost){f.scale.set(.15,.6+Math.random()*.6,.15);f.material.color.setHex(r.driftBoost===2?0xffa040:0x8ad8ff);}});
 // particles
 const fxv=_f.set(Math.sin(r.yaw),0,Math.cos(r.yaw));if(r.rescueT>0)return;
 if(r.drift.on&&r.veh==='kart'){for(const s of[-1,1]){_t.set(r.p.x-fxv.x*1+fxv.z*s*.75,r.p.y+.2,r.p.z-fxv.z*1-fxv.x*s*.75);fx.spark(_t,r.drift.lvl);}}
 if(boost){_t.set(r.p.x-fxv.x*1.4,r.p.y+.6,r.p.z-fxv.z*1.4);fx.flame(_t,_f.clone().multiplyScalar(-1),r.driftBoost===1);}
 if(r.veh==='hover'&&r.water&&r.v>4&&!r.air){_t.set(r.p.x-fxv.x*1.5,SEA+.2,r.p.z-fxv.z*1.5);if(Math.random()<.7)fx.spray(_t,r.v,T.night?0x8ad0ff:0xf0faff);}
 if(r.veh==='kart'&&r.offT>0&&r.v>8&&Math.random()<.5)fx.dust(r.p,T.snow?0xffffff:T.ground[0]);
 if(r.veh==='plane'&&r.v>24&&Math.random()<.35){for(const s of[-1,1]){_t.set(r.p.x+Math.cos(r.yaw)*s*2.1-fxv.x*.8,r.p.y+.62,r.p.z-Math.sin(r.yaw)*s*2.1-fxv.z*.8);fx.add.emit(_t.x,_t.y,_t.z,0,0,0,.28,.3,.36,.18,.3);}}}
function camFollow(v,dt,snap){const r=v.r,cam=v.cam;const plane=r.veh==='plane';r.camYaw=r.spinT>0||r.barrelT>0?r.camYaw:r.camYaw+wrapA(r.yaw-r.camYaw)*Math.min(1,dt*(plane?3:5));
 const back=plane?11:r.veh==='hover'?8.2:7.2,up=plane?3.2:3.1;const cp=Math.cos(plane?r.pitch*.6:0);const tx=r.p.x-Math.sin(r.camYaw)*back*cp,tz=r.p.z-Math.cos(r.camYaw)*back*cp,ty=r.p.y+up-(plane?Math.sin(r.pitch*.6)*back:0);
 let gy=TR?TR.h(tx,tz)+1.2:0;if(!plane)gy=Math.max(gy,SEA+1);const want=new V(tx,Math.max(ty,gy),tz);if(!v.cp||snap){v.cp=want.clone();}else v.cp.lerp(want,1-Math.exp(-dt*(plane?12:10)));
 cam.position.copy(v.cp);v.look.set(r.p.x+Math.sin(r.camYaw)*6,r.p.y+1.3+(plane?Math.sin(r.pitch)*5:0),r.p.z+Math.cos(r.camYaw)*6);cam.lookAt(v.look);
 if(plane)cam.rotateZ(r.roll*.18);const f=62+(r.zipT>0?9:0)+cl(r.v/40,0,1)*6;cam.fov=lerp(cam.fov,f,Math.min(1,dt*4));cam.updateProjectionMatrix();}
function orbitCam(v,dt){const r=v.r,cam=v.cam,a=time*.25+r.yaw;const d=r.veh==='plane'?13:8.5;const want=new V(r.p.x+Math.sin(a)*d,r.p.y+3.2,r.p.z+Math.cos(a)*d);if(r.veh!=='plane')want.y=Math.max(want.y,TR.h(want.x,want.z)+1.5,SEA+1.5);cam.position.lerp(want,v.cp?Math.min(1,dt*3):1);v.cp=cam.position.clone();cam.lookAt(r.p.x,r.p.y+1.1,r.p.z);}
function introCam(v,dt){const r=v.r,k=introT/2.4,cam=v.cam;const a=r.yaw+Math.PI*(1-k)*.9+Math.PI*.15;const d=lerp(26,9,k),h=lerp(14,3.4,k);cam.position.set(r.p.x+Math.sin(a)*d,r.p.y+h,r.p.z+Math.cos(a)*d);cam.lookAt(r.p.x,r.p.y+1,r.p.z);cam.fov=60;cam.updateProjectionMatrix();v.cp=null;}

/* ================= main step ================= */
function step(dt){time+=0;
 if(app==='race')raceStep(dt);else if(app==='hub'){time+=dt;env.t=time;hubStep(dt);}else if(app==='menu'||app==='results'){time+=dt;if(app==='results'){for(const r of racers){if(r.fin||phase==='done'){r.inp.gas=r.fin?.3:r.inp.gas;}}}}
 for(const k in edge)edge[k]=false;}
function frame(dt){if(app!=='paused')fx.update(dt);
 if(app==='race'||app==='hub'||app==='results'||app==='paused'||app==='fading'){if(app==='race'||app==='hub'||app==='results')for(const r of racers)poseRacer(r,dt);
  for(const v of views){if(app==='race'&&phase==='intro')introCam(v,dt);else if(app==='results')orbitCam(v,dt);else camFollow(v,dt);}
  W&&W.update(dt,views[0]?views[0].r.p:null);
  if(app==='race'){updateRaceHud(dt);views.forEach((v,k)=>snd.engine(k,Math.abs(v.r.v),v.r.veh,phase!=='intro'));}
  if(app==='hub'){hud.update(views,{n:1,laps:1,hub:true,t:time,raceT:0,coinsOn:false});snd.engine(0,Math.abs(views[0].r.v),'kart',true);}}
 else if(app==='menu'){W&&W.update(dt,null);menuCam(dt);}}
function updateRaceHud(dt){hud.update(views,{n:racers.length,laps:def.laps,t:time,raceT,coinsOn});
 const cl_=$('clock');cl_.querySelector('b').textContent=fmtClock(clock);cl_.classList.toggle('low',clock<20&&phase==='go');
 const cd=$('cd');if(phase==='count'){cd.textContent=Math.ceil(cdT);cd.className='';cd.style.opacity=1;cd.style.transform=`scale(${1+(cdT%1)*.4})`;}else if(phase==='go'&&raceT<.9){cd.textContent='GO!';cd.className='go';cd.style.opacity=1-raceT;cd.style.transform=`scale(${1+raceT})`;}else cd.style.opacity=0;
 if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}
 if(views.length===1){drawMini($('mini'),C,racers,views[0].r);const ord=racers.slice().sort((a,b)=>a.place-b.place);const st=$('stand');const html=ord.map(r=>`<li class="${r.human>=0?'me':r.boss?'boss':''}">${r.place}. ${r.name}<i style="background:#${(r.boss?0xff3a3a:r.d.kc).toString(16).padStart(6,'0')}"></i></li>`).join('');if(st._h!==html){st.innerHTML=html;st._h=html;}}
 else drawMini($('mini'),C,racers,null);}
function banner(t,s,d=2){$('banner').querySelector('b').textContent=t;$('banner').querySelector('span').textContent=s;$('banner').classList.add('on');banT=d;}

/* ================= menu backdrop ================= */
let menuT=0;function menuScene(){if(W&&def&&def.hub)return;loadWorld(HUB,'hub','#ffb040');views=[];}
function menuCam(dt){menuT+=dt;if(!C)return;const B=C.B,f=(menuT*.012)%1,i=f*B.n;const p=at(C,i,0),q=at(C,i+40,0);mainCam.position.set(p.x-B.nx[Math.floor(i)%B.n]*12,p.y+26+Math.sin(menuT*.2)*4,p.z-B.nz[Math.floor(i)%B.n]*12);mainCam.lookAt(q.x,q.y+2,q.z);mainCam.fov=55;mainCam.updateProjectionMatrix();}

/* ================= rendering ================= */
const POST={exposure:1.0,bloom:.38,bloomThreshold:.9,bloomRadius:.5,vignette:.28,saturation:1.12,grain:.015,aoStrength:.8};
let fxFull=null,fxSplit=[];
function applyQuality(q){gfx=q;R.shadowMap.enabled=true;if(W){W.sun.castShadow=q>0;W.sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(W.sun.shadow.map){W.sun.shadow.map.dispose();W.sun.shadow.map=null;}}R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));fxFull=null;fxSplit=[];}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function getFx(i,w,h,cam){const exp=(T&&T.exp)||1;if(i<0){if(!fxFull||fxFull.cam!==cam){fxFull=cinematic(R,scene,cam,{...POST,exposure:exp,ao:gfx>=2});fxFull.cam=cam;fxFull.w=0;}if(fxFull.w!==w*9999+h){fxFull.w=w*9999+h;fxFull.setSize(w,h);}return fxFull;}
 let f=fxSplit[i];if(!f||f.cam!==cam){f=fxSplit[i]=cinematic(R,scene,cam,{...POST,exposure:exp,ao:false,bloom:.32});f.cam=cam;f.w=0;}if(f.w!==w*9999+h){f.w=w*9999+h;f.setSize(w,h);}return f;}
function renderView(cam,x,y,w,h,i){cam.aspect=w/h;cam.updateProjectionMatrix();fx.scale(cam,h*R.getPixelRatio());R.setViewport(x,y,w,h);R.setScissor(x,y,w,h);getFx(i,w,h,cam).render();}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);fxFull&&(fxFull.w=0);fxSplit.forEach(f=>f&&(f.w=0));}
 if(views.length===2){R.setScissorTest(true);renderView(views[0].cam,0,h/2,w,h/2,0);renderView(views[1].cam,0,0,w,h/2,1);R.setScissorTest(false);}
 else{R.setScissorTest(false);renderView(views[0]?views[0].cam:mainCam,0,0,w,h,-1);}}

/* ================= menu wiring ================= */
const seg=(id,key,cb)=>{const el=$(id);const set=v=>{opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));cb&&cb(v);saveOpt();};set(opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(+b.dataset.v));return set;};
function saveOpt(){try{localStorage.setItem('pxd_critterkart_opt',JSON.stringify({mode:opt.mode,humans:opt.humans,diff:opt.diff,picks:opt.picks,world:opt.world,track:opt.track}));}catch(e){}}
let setMode,setPl;
setMode=seg('o-mode','mode',v=>{$('trackpick').hidden=v!==1;if(v===0&&opt.humans===2&&setPl)setPl(1);refreshMenu();});
setPl=seg('o-pl','humans',v=>{if(v===2&&opt.mode===0)setMode(1);refreshMenu();});seg('o-diff','diff');
$('o-world').innerHTML=WORLDS.map((w,i)=>`<button data-v="${i}">${w.n}</button>`).join('');seg('o-world','world',()=>refreshTracks());
function refreshTracks(){const tr=TRACKS.filter(t=>t.w===opt.world);if(!tr.some(t=>t.id===opt.track))opt.track=tr[0].id;
 $('tracks').innerHTML=tr.map(t=>`<button data-id="${t.id}" class="${t.id===opt.track?'on':''}">${t.n}<small>${t.boss?'BOSS · ':''}${{kart:'KART',hover:'HOVERCRAFT',plane:'PLANE'}[t.veh]}${save.best[t.id]?' · BEST '+fmtT(save.best[t.id]):''}</small></button>`).join('');
 $('tracks').querySelectorAll('button').forEach(b=>b.onclick=()=>{opt.track=b.dataset.id;saveOpt();refreshTracks();});}
function refreshMenu(){refreshTracks();const nb=balloons(save);$('advprog').textContent=opt.mode===0?`ISLAND PROGRESS · ${nb} / 28 BALLOONS · ${Object.keys(save.boss).length} / 4 BOSSES`:opt.humans===2?'P1 CLICK · P2 SHIFT+CLICK OR RIGHT-CLICK A CRITTER':'';
 $('go').textContent=opt.mode===0?(nb?'CONTINUE ADVENTURE ▸':'START ADVENTURE ▸'):'START RACE ▸';$('pickhint').textContent=opt.humans===2?'PICK YOUR CRITTERS (P2: SHIFT/RIGHT-CLICK)':'PICK YOUR CRITTER';
 [...$('chars').children].forEach((d,i)=>d.className='ch'+(i===opt.picks[0]?' p1':opt.humans===2&&i===opt.picks[1]?' p2':''));}
function portraits(){const tr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});tr.setSize(200,150,false);tr.setClearColor(0,0);tr.toneMapping=THREE.ACESFilmicToneMapping;tr.outputColorSpace=THREE.SRGBColorSpace;
 const out=DRIVERS.map(d=>{const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xffffff,0x554466,1.6));const l=new THREE.DirectionalLight(0xffffff,2.4);l.position.set(3,5,4);s.add(l);const k=makeVehicle('kart',d);k.rotation.y=-.55;s.add(k);const c=new THREE.PerspectiveCamera(34,4/3,.1,50);c.position.set(2.6,2.2,4.2);c.lookAt(0,.9,0);tr.render(s,c);return tr.domElement.toDataURL();});tr.dispose();tr.forceContextLoss&&tr.forceContextLoss();return out;}
const bar=(l,v)=>`<span>${l}</span><s style="--w:${v*20}%"></s>`;
(function buildChars(){const imgs=portraits();$('chars').innerHTML=DRIVERS.map((d,i)=>`<div class="ch" data-i="${i}"><img src="${imgs[i]}" alt="${d.n}"><b>${d.n}</b><div class="bars">${bar('SPD',d.spd)}${bar('ACC',d.acc)}${bar('HDL',d.han)}${bar('WGT',d.wt)}</div><p>${d.d}</p></div>`).join('');
 $('chars').querySelectorAll('.ch').forEach(el=>{const i=+el.dataset.i;el.onclick=e=>{if(e.shiftKey&&opt.humans===2){if(i!==opt.picks[0])opt.picks[1]=i;}else{opt.picks[0]=i;if(opt.picks[1]===i)opt.picks[1]=(i+1)%8;}saveOpt();refreshMenu();};
  el.oncontextmenu=e=>{e.preventDefault();if(opt.humans===2&&i!==opt.picks[0]){opt.picks[1]=i;saveOpt();refreshMenu();}};});})();
$('go').onclick=()=>{if(document.activeElement)document.activeElement.blur();if(opt.mode===0)startHub();else startRace(opt.track,{mode:'quick',humans:opt.humans});};
$('reset').onclick=()=>{if(confirm('Reset all Critter Kart adventure progress?')){save={won:{},coins:{},boss:{},best:{},driver:opt.picks[0],diff:opt.diff};writeSave(save);refreshMenu();}};
$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{$('pause').hidden=true;if(raceMode==='adventure')startHub(def.id);else toMenu();};$('retry2').onclick=()=>{$('pause').hidden=true;retry();};
function retry(){startRace(def.id,{mode:raceMode,humans:raceMode==='adventure'?1:opt.humans,coins:coinsOn});}
$('cont').onclick=()=>{if(raceMode==='adventure')startHub(def.id);else toMenu();};$('again').onclick=retry;$('omenu').onclick=toMenu;
$('d-go').onclick=()=>enterDoor(nearDoor);
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Critter Kart\nPoints: ${a.pts||0}\nTrack: ${a.track||''} (${a.veh||''})\nPlace: ${a.place?ORD(a.place):''}${a.time?' · '+fmtT(a.time):''}\nDriver: ${a.driver||''} · ${a.mode||''}${a.split?' split-screen':''} · CPU ${a.diff||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] '+ID+' '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};
addEventListener('keydown',e=>{if(app==='results'&&!$('over').hidden&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();$('cont').click();}});

/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(app!=='paused'){acc+=dt;let n=0;while(acc>=DT&&n<4){step(DT);acc-=DT;n++;}if(n===4)acc=0;}frame(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.KART={get state(){return app==='race'?phase:app;},get app(){return app;},get phase(){return phase;},step,render,frame,
 start(o={}){if(o.mode==='adventure'&&!o.track)return startHub(o.at);startRace(o.track||'driftwood',{mode:o.mode||'quick',humans:o.humans??1,picks:o.picks,diff:o.diff,coins:o.coins});},
 startRace(id,o){startRace(id||'driftwood',o||{});},startHub,toMenu,enterDoor:id=>enterDoor(doors.find(d=>d.t.id===id)),get doors(){return doors;},
 get racers(){return racers;},get karts(){return racers;},set humans(v){opt.humans=v;},get clock(){return clock;},setClock(s){clock=s;},set raceT(v){raceT=v;},get raceT(){return raceT;},
 skipIntro(){if(app==='race'){phase='go';cdT=0;env.frozen=false;}},autopilot(on=true){autopilot=on;},
 forceFinish(order){/* order: array of racer indices, finishing in that order now */order.forEach((k,j)=>{const r=racers[k];if(!r.fin){r.fin=raceT+.01+j*.5;r.lap=def.laps+1;finishOrder.push(r);r.finPlace=finishOrder.length;}});ranks();},
 endNow(timeUp=false){endRace(timeUp);},get save(){return save;},resetSave(){save={won:{},coins:{},boss:{},best:{},driver:0,diff:1};writeSave(save);},giveBalloons(n){for(let k=0;k<n;k++)save.won['x'+k]=1;writeSave(save);},
 get C(){return C;},get W(){return W;},get items(){return items;},get award(){return lastAward;},setQuality:applyQuality,scene,R,cam:()=>views[0]?views[0].cam:mainCam,keys,edge,TRACKS,get coinsOn(){return coinsOn;},nearDoor:()=>nearDoor};
