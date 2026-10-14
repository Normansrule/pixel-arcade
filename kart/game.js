// CRITTER KART — kart racer for Pixel Arcade (original game).
// Grand Prix (4 cups × 4 races, points table, podium), VS race, Time Trial with a ghost, and the Island Adventure
// (drive around Critter Island, open race doors with balloons, beat four bosses). 50/100/150cc, 1P or 2P split screen.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {ID,DRIVERS,THEMES,WORLDS,TRACKS,trackById,DOOR_REQ,ITEMS,rollItem,DIFF,CC,CUPS,POINTS,loadSave,writeSave,balloons} from './data.js';
import {buildCourse,buildTerrain,query,at,atK,yawAt,SEA} from './course.js';
import {buildWorld,hubDoor,balloonMesh} from './world.js';
import {makeVehicle,makeBossRig,makeCritter,poseCritter,ghostify} from './models.js';
import {newRacer,place,stepRacer,collide,pickups,hitRacer,slipstream} from './physics.js';
import {Items} from './items.js';
import {Hazards} from './hazards.js';
import {think} from './ai.js';
import {FX} from './fx.js';
import {Sound} from './sound.js';
import {HUD,icon,drawMini} from './hud.js';
import {V,cl,lerp,wrapA,ORD,fmtT,fmtClock,textSprite,sstep} from './util.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,deadzone} from '../js/kit3d/input.js';
import {postButton} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id);
const DT=1/60,LIMIT=180,BOSS_LIMIT=165,INTRO=5;
const HUB={id:'hub',n:'CRITTER ISLAND',hub:1,veh:'kart',laps:1,R:108,sx:1.15,sz:1,h:[[4,.06,0],[3,.05,1.2]],y:[2.5,[[2,1.2,0]]],wd:9,seed:7};
const VEHN={kart:'KART',hover:'HOVERCRAFT',plane:'PLANE'};

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
let opt={mode:'gp',humans:1,diff:save.diff??1,cc:1,picks:[save.driver||0,4],cup:0,group:0,track:'coconut'};
try{const o=JSON.parse(localStorage.getItem('pxd_critterkart_opt'))||{};if(typeof o.mode==='number')o.mode=o.mode===0?'adv':'vs';delete o.world;Object.assign(opt,o);}catch(e){}
let app='menu',phase='intro',C=null,TR=null,W=null,T=null,def=null,racers=[],views=[],items=null,haz=null,doors=[],hubDeco=null;
let raceT=0,clock=LIMIT,limit=LIMIT,introT=0,cdT=0,endT=0,time=0,acc=0,finishOrder=[],coinsOn=false,lastAward=null,raceMode='vs',banT=0,startPress=[],hubMsgT=0,gfx=quality(),autopilot=false,doorCool=0;
let curDiff=DIFF[1],curCC=CC[1],gp=null,ghost=null,rec=[],recT=0,podiumG=null,podT=0,shake=0;

/* ================= input ================= */
// keyboard only: no pointer lock, and the context menu stays available
const IN=controls(canvas,{canLock:()=>false,menu:()=>false,onKey:e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Slash','Enter'].includes(e.code)&&app!=='menu')e.preventDefault();
 if(e.code==='Escape'){if(app==='race')pause(true);else if(app==='paused')pause(false);else if(app==='hub')toMenu();}
 if(e.code==='KeyM'&&!e.repeat){snd.init();const on=snd.toggleMusic();flashTip('MUSIC · '+(on?'ON':'OFF'));if(on&&(app==='race'||app==='hub')&&!snd.mus)snd.startMusic(T?T.key:'hub');}
 snd.init();}});
const {keys,edge}=IN;
const MAP=[{f:['KeyW'],b:['KeyS'],l:['KeyA'],r:['KeyD'],d:['Space'],i:['KeyE','KeyF'],k:['KeyQ']},{f:['ArrowUp'],b:['ArrowDown'],l:['ArrowLeft'],r:['ArrowRight'],d:['Slash','ShiftRight'],i:['Enter','Period'],k:['Comma']}];
const any=a=>a.some(k=>keys[k]);
function pad(i){const g=navigator.getGamepads?navigator.getGamepads()[i]:null;if(!g)return null;const b=k=>g.buttons[k]&&(g.buttons[k].pressed||g.buttons[k].value>.3);
 return{gas:b(0)||b(7)?1:0,brake:b(1)||b(6)?1:0,x:deadzone(g.axes[0]),y:-deadzone(g.axes[1],.2),item:b(2),drift:b(5)||b(4),look:b(3),start:b(9)};}
function readInput(r){const h=r.human,m=MAP[h],I=r.inp,solo=humansN()===1;const kb=k=>any(m[k])||(solo&&any(MAP[1][k]));
 const eg=k=>m[k].some(c=>edge[c])||(solo&&MAP[1][k].some(c=>edge[c]));const gp_=pad(h);let gas=kb('f')?1:0,br=kb('b')?1:0,st=(kb('l')?1:0)-(kb('r')?1:0),dr=kb('d')||eg('d'),it=(kb('i')||eg('i'))&&app!=='hub';
 if(gp_){if(gp_.gas)gas=1;if(gp_.brake)br=1;if(gp_.x)st=-gp_.x;if(gp_.drift)dr=true;if(gp_.item)it=true;}
 if(r.veh==='plane'){I.pitch=(gas?1:0)-(br?1:0)+(gp_&&gp_.y?gp_.y:0);I.gas=1;I.brake=0;}else{I.gas=gas;I.brake=br;}
 I.steer=cl(st,-1,1);I.drift=dr;I.hop=r.veh==='hover'?dr&&Math.abs(I.steer)<.3:dr;I.item=it;r.lookBack=kb('k')||!!(gp_&&gp_.look);}
const humansN=()=>racers.filter(r=>r.human>=0).length;
let tipEl=null,tipT=0;function flashTip(s){if(!tipEl){tipEl=document.createElement('div');tipEl.className='tip';document.body.appendChild(tipEl);}tipEl.textContent=s;tipEl.style.opacity=1;clearTimeout(tipT);tipT=setTimeout(()=>tipEl.style.opacity=0,1300);}

/* ================= world loading ================= */
function clearWorld(){if(W){scene.remove(W.grp);W.grp.traverse(o=>{if(o.geometry)o.geometry.dispose();});}for(const r of racers)scene.remove(r.g);racers=[];if(items)items.clear();if(haz)haz.clear();haz=null;fx.clear();doors=[];hubDeco=null;
 if(ghost){scene.remove(ghost.g);ghost=null;}if(podiumG){scene.remove(podiumG);podiumG=null;}}
function loadWorld(d,themeKey,col){clearWorld();def=d;T={...THEMES[themeKey],key:themeKey};C=buildCourse(d);TR=buildTerrain(C,T);
 if(d.hub){C.berries=[];C.coins=[];C.pods=[];C.haz=[];}
 W=buildWorld(C,TR,T,{col,hub:!!d.hub});scene.add(W.grp);scene.environment=envFor(T);scene.fog=new THREE.FogExp2(T.fog,T.fogD*(d.veh==='plane'?.75:1));
 items=new Items(scene,C,TR,fx);haz=new Hazards(scene,C,TR,T,fx);applyQuality(gfx);}
function addRacer(d,veh,o){const r=newRacer(d,veh,o);r.g=o.boss?makeBossRig(o.bossDef):makeVehicle(veh,d);r.cc={top:curCC.top,acc:curCC.acc};scene.add(r.g);racers.push(r);return r;}

/* ================= race setup ================= */
function startRace(id,o={}){const t=trackById(id)||TRACKS[0];snd.init();raceMode=o.mode||raceMode;const wd=WORLDS[t.w];
 curDiff=DIFF[o.diff??opt.diff];curCC=CC[o.cc??(raceMode==='adventure'?1:opt.cc)];
 loadWorld(t,wd.theme,wd.col);const hum=raceMode==='tt'?1:o.humans??opt.humans,picks=o.picks||opt.picks;
 coinsOn=!!o.coins;C.coins.forEach(c=>c.got=0);W.cIM.visible=coinsOn;
 const grid=[];
 if(raceMode==='gp'&&gp){// fixed cup roster; grid by standings after race 1 (leader at the front)
  const ros=gp.roster.slice();if(gp.idx>0)ros.sort((a,b)=>gp.pts[a.key]-gp.pts[b.key]);
  for(const e of ros){const r=addRacer(e.d,t.veh,{human:e.human});r.key=e.key;r.personal=e.personal;grid.push(r);}}
 else{const used=new Set();const n=raceMode==='tt'?1:t.boss?1+hum:8;
  for(let h=0;h<hum;h++){const d=DRIVERS[picks[h]%8];used.add(d.id);grid.push(addRacer(d,t.veh,{human:h}));}
  if(t.boss&&raceMode!=='tt'){const b=wd.boss;const bd={id:'boss',n:b.n,sp:b.sp,c:b.c,c2:b.c2,kc:0x3a2a1a,spd:5,acc:4,han:4,wt:5};const r=addRacer(bd,b.veh==='plane'?'plane':t.veh,{boss:true,bossDef:b,name:b.n});r.bossHz=b.haz;r.personal=1;grid.unshift(r);}
  else{const pool=DRIVERS.filter(d=>!used.has(d.id));for(let k=0;grid.length<n;k++){const d=pool[k%pool.length];const r=addRacer(d,t.veh,{});r.personal=.95+Math.random()*.08;grid.unshift(r);}}}
 // grid slots behind the line, two abreast
 const B=C.B,plane=t.veh==='plane';grid.forEach((r,k)=>{const row=Math.floor(k/2),col=k%2?1:-1;const back=(6+row*(plane?9:6.5))/B.step;const u=col*B.w[0]*.42;place(C,r,B.n-back,u,plane?(k%2?2:-2):0);r.p.y+=plane?0:.1;r.lap=0;r.half=true;r.f=r.q.prog;r.prog=r.f-1;r.laneOff=(Math.random()-.5)*B.w[0]*.6;r.camYaw=r.yaw;});
 views=racers.filter(r=>r.human>=0).sort((a,b)=>a.human-b.human).map(r=>({r,cam:new THREE.PerspectiveCamera(62,1,.3,9000),cp:null,look:new V(),finT:0}));
 // time trial: no item boxes, three zips, ghost of the best run
 if(raceMode==='tt'){for(const p of C.pods){p.t=1e9;p.m.visible=false;}const me=views[0].r;me.item='zip3';me.itemN=3;loadGhost(t);rec=[];recT=0;}
 raceT=0;limit=t.boss?BOSS_LIMIT:LIMIT;clock=limit;introT=0;cdT=3;endT=0;finishOrder=[];startPress=[];phase='intro';app='race';
 hud.setViews(views.length,views.map(v=>v.r));document.body.classList.add('playing');$('hud').classList.toggle('splitmode',views.length>1);
 show('hud');snd.engines(views.length);snd.startMusic(T.key);
 const sub=raceMode==='gp'?`${CUPS[gp.cup].n} · RACE ${gp.idx+1}/4 · ${curCC.n}`:raceMode==='tt'?`TIME TRIAL · ${curCC.n}${ghost?' · GHOST '+fmtT(ghost.t):''}`:(t.boss?'BOSS RACE · ':'')+(coinsOn?'SILVER COIN CHALLENGE · ':'')+VEHN[t.veh]+' · '+t.laps+' LAPS · '+curCC.n;
 banner(t.n,sub,INTRO-.4);}
function show(which){for(const id of['menu','hud','hubhud','over','pause'])$(id).hidden=id!==which&&!(which==='pause'&&id==='hud');$('keys').hidden=which!=='menu';}

/* ================= Grand Prix ================= */
function startGP(cup,o={}){const hum=o.humans??opt.humans,picks=o.picks||opt.picks;const used=new Set(),roster=[];
 for(let h=0;h<hum;h++){const d=DRIVERS[picks[h]%8];used.add(d.id);roster.push({d,human:h,key:'h'+h,personal:1});}
 const pool=DRIVERS.filter(d=>!used.has(d.id));for(let k=0;roster.length<8;k++){const d=pool[k%pool.length];roster.push({d,human:-1,key:'c'+k,personal:.95+Math.random()*.08});}
 gp={cup,idx:0,roster,pts:Object.fromEntries(roster.map(e=>[e.key,0])),last:{},hist:[],diff:o.diff??opt.diff,cc:o.cc??opt.cc,humans:hum};
 raceMode='gp';startRace(CUPS[cup].tracks[0],{mode:'gp',diff:gp.diff,cc:gp.cc,humans:hum});}
function nextGP(){if(!gp)return;gp.idx++;if(gp.idx>=4){cupEnd();return;}fadeTo(()=>startRace(CUPS[gp.cup].tracks[gp.idx],{mode:'gp',diff:gp.diff,cc:gp.cc,humans:gp.humans}));}
function gpStandings(){return gp.roster.slice().sort((a,b)=>gp.pts[b.key]-gp.pts[a.key]||(gp.last[a.key]||9)-(gp.last[b.key]||9));}
function cupEnd(){const st=gpStandings(),cup=CUPS[gp.cup];const me=st.findIndex(e=>e.human===0)+1;const trophy=me<=3?me:0;
 const k=cup.id+'_'+gp.cc;if(trophy&&(!save.cups[k]||trophy<save.cups[k]))save.cups[k]=trophy;writeSave(save);
 // podium scene on the last track
 podium(st.slice(0,3));snd.play(trophy===1?'cup':trophy?'win':'lose');
 $('oeye').textContent=cup.n+' · '+CC[gp.cc].n+' · FINAL STANDINGS';
 $('ores').textContent=trophy===1?'GOLD TROPHY!':trophy===2?'SILVER TROPHY!':trophy===3?'BRONZE TROPHY!':ORD(me)+' OVERALL';$('ores').style.color=['#ff6a4a','#ffd23a','#e8eef8','#ffaa6a'][trophy];
 $('orew').textContent=trophy?'You stood on the podium of the '+cup.n+'.':'Finish in the top three to win a trophy.';
 $('otab').innerHTML='<tr><th>#</th><th>RACER</th>'+cup.tracks.map((t,i)=>`<th>R${i+1}</th>`).join('')+'<th>TOTAL</th></tr>'+st.map((e,k)=>`<tr class="${e.human>=0?'me':''}"><td>${k+1}</td><td><i style="background:#${e.d.kc.toString(16).padStart(6,'0')}"></i>${e.d.n}${e.human>=0?' (P'+(e.human+1)+')':''}</td>${gp.hist.map(h=>`<td>${h[e.key]??'—'}</td>`).join('')}${'<td>—</td>'.repeat(4-gp.hist.length)}<td><b>${gp.pts[e.key]}</b></td></tr>`).join('');
 $('otok').textContent=`CUP TOTAL ${gp.pts['h0']} PTS · BEST ${best()} PTS`;$('cont').textContent='MENU';$('again').textContent='RETRY CUP';$('again').hidden=false;$('omenu').hidden=true;
 app='podium';podT=0;gp.done=true;show('over');document.body.classList.remove('playing');document.body.classList.add('podium');}
function podium(top){if(podiumG)scene.remove(podiumG);const B=C.B,i=Math.round(B.n*.04)%B.n,q=at(C,i,0),yaw=yawAt(C,i);const g=new THREE.Group();g.position.copy(q);g.rotation.y=yaw;
 const col=[0xffd23a,0xd8dce8,0xe8a060],H=[2.6,1.8,1.2],X=[0,-3.6,3.6];
 for(let k=0;k<3;k++){const b=new THREE.Mesh(new THREE.BoxGeometry(3.4,H[k],3.4),new THREE.MeshStandardMaterial({color:col[k],metalness:.5,roughness:.3}));b.position.set(X[k],H[k]/2,0);b.castShadow=b.receiveShadow=true;g.add(b);
  const n=textSprite([{t:String(k+1),f:'150px Anton, Impact, sans-serif',c:'#111',y:128}],{w:256,h:256,sx:1.8,bg:'rgba(255,255,255,.0)'});n.position.set(X[k],H[k]*.5,1.75);g.add(n);}
 scene.add(g);podiumG=g;const ids=top.map(e=>e.key);
 for(const r of racers){const k=ids.indexOf(r.key);if(k<0){r.g.visible=false;continue;}r.g.visible=true;r.podium=k+1;const lp=new V(X[k],H[k],0).applyAxisAngle(new V(0,1,0),yaw).add(q);r.p.copy(lp);r.yaw=yaw;r.pitch=0;r.roll=0;r.v=0;r.fin=r.fin||1;r.finPlace=k+1;}
 views=[{r:racers.find(r=>r.key===ids[0])||racers[0],cam:new THREE.PerspectiveCamera(50,1,.3,9000),cp:null,look:new V(),finT:0}];podCenter=q.clone();podYaw=yaw;}
let podCenter=new V(),podYaw=0;

/* ================= time-trial ghost ================= */
const gKey=t=>'pxd_critterkart_ghost_'+t.id+'_'+curCC.n;
function loadGhost(t){ghost=null;let d=null;try{d=JSON.parse(localStorage.getItem(gKey(t)));}catch(e){}if(!d||!d.fr||!d.fr.length)return;
 const g=ghostify(makeVehicle(t.veh,DRIVERS[d.d%8]||DRIVERS[0]));scene.add(g);ghost={g,fr:d.fr,t:d.t,laps:d.laps||[],d:d.d};}
function saveGhost(me){if(!me.fin)return;if(ghost&&ghost.t<=me.fin)return false;const laps=[];let s=0;for(const l of me.lapTimes){s+=l;laps.push(+s.toFixed(3));}
 try{localStorage.setItem(gKey(def),JSON.stringify({t:me.fin,d:opt.picks[0],laps,fr:rec}));}catch(e){return false;}return true;}
function poseGhost(){if(!ghost)return;const fr=ghost.fr,k=Math.max(0,raceT*20),i=Math.min(fr.length-2,Math.floor(k)),f=Math.min(1,k-i);if(i<0)return;const a=fr[i],b=fr[i+1]||a;
 ghost.g.position.set(lerp(a[0],b[0],f),lerp(a[1],b[1],f),lerp(a[2],b[2],f));ghost.g.rotation.set(-a[4],a[3]+wrapA(b[3]-a[3])*f,a[5],'YXZ');ghost.g.visible=raceT*20<fr.length;}

/* ================= hub ================= */
function doorList(){const out=[];WORLDS.forEach((w,wi)=>{const tr=TRACKS.filter(t=>t.w===wi&&!t.circuit);tr.forEach((t,k)=>out.push({t,w:wi,f:wi/4+.045+k*.048}));});return out;}
function startHub(atDoor){snd.init();raceMode='adventure';curCC=CC[1];loadWorld(HUB,'hub','#ffb040');const d=DRIVERS[opt.picks[0]%8];const r=addRacer(d,'kart',{human:0});
 const B=C.B,n=B.n;doors=doorList().map(o=>{const i=Math.round(o.f*n)%n,u=B.w[i]+13,p=at(C,i,u);p.y=TR.h(p.x,p.z);const req=DOOR_REQ[o.t.id],open=balloons(save)>=req;
  const st=o.t.boss?(save.boss[o.w]?'BEATEN ♛':'BOSS'):save.coins[o.t.id]?'★ ALL DONE':save.won[o.t.id]?'★ COIN CHALLENGE':null;
  const g=hubDoor(o.t,req,open,st,WORLDS[o.w].col);g.position.copy(p);g.rotation.y=Math.atan2(-B.nx[i],-B.nz[i]);W.grp.add(g);return{...o,i,u,p,g,open,req};});
 WORLDS.forEach((w,wi)=>{const i=Math.round((wi/4+.115)*n)%n,p=at(C,i,B.w[i]+34);p.y=TR.h(p.x,p.z);const sg=textSprite([{t:w.n,f:'84px Anton, Impact, sans-serif',c:w.col,y:110},{t:'WORLD '+(wi+1),f:'40px JetBrains Mono, monospace',c:'#fff',y:190}],{w:768,h:256,sx:22,border:w.col});sg.position.set(p.x,p.y+22,p.z);W.grp.add(sg);});
 const tower=new THREE.Group();const ty=TR.h(0,0);tower.position.set(0,ty,0);const ped=new THREE.Mesh(new THREE.CylinderGeometry(6,8,6,10),new THREE.MeshStandardMaterial({color:0xd8c8a8,roughness:.8,flatShading:true}));ped.position.y=3;ped.castShadow=ped.receiveShadow=true;tower.add(ped);
 const nb=balloons(save),cols=[0xff3a6a,0xffd03a,0x3ac8ff,0x7aff4a,0xb06aff];const bl=[];for(let k=0;k<Math.max(1,nb);k++){const b=balloonMesh(cols[k%5]);const a=k*2.4,rr=1.5+Math.sqrt(k)*1.6;b.position.set(Math.cos(a)*rr,24+k*.55+Math.sin(k)*1.2,Math.sin(a)*rr);b.scale.setScalar(nb?1.4:.001);tower.add(b);bl.push(b);}
 WORLDS.forEach((w,wi)=>{const st=makeCritter({sp:w.boss.sp,c:save.boss[wi]?w.boss.c:0x6a6a70,c2:save.boss[wi]?w.boss.c2:0x9a9aa0,kc:0x6a6a70});const a=wi/4*Math.PI*2+Math.PI/4;st.position.set(Math.cos(a)*9,6,Math.sin(a)*9);st.rotation.y=-a+Math.PI/2;st.scale.multiplyScalar(2.2);tower.add(st);});
 tower.scale.setScalar(2.3);const spire=new THREE.Mesh(new THREE.CylinderGeometry(.6,1.6,14,8),new THREE.MeshStandardMaterial({color:0xfff0d8,roughness:.6,flatShading:true}));spire.position.y=13;spire.castShadow=true;tower.add(spire);
 const cap=new THREE.Mesh(new THREE.ConeGeometry(2.4,3.5,8),new THREE.MeshStandardMaterial({color:0xff4d00,roughness:.5,flatShading:true}));cap.position.y=21.5;tower.add(cap);
 const title=textSprite([{t:'CRITTER ISLAND',f:'92px Anton, Impact, sans-serif',c:'#ffd23a',y:100},{t:nb+' / 28 BALLOONS',f:'44px JetBrains Mono, monospace',c:'#fff',y:186}],{w:768,h:256,sx:14,border:'#ff4d00'});title.position.y=28;tower.add(title);
 W.grp.add(tower);hubDeco={tower,bl};
 let i0=0,u0=0;place(C,r,i0,u0);r.yaw=yawAt(C,i0);if(atDoor){const dd=doors.find(x=>x.t.id===atDoor);if(dd){r.p.set(dd.p.x-B.nx[dd.i]*12,0,dd.p.z-B.nz[dd.i]*12);r.p.y=TR.h(r.p.x,r.p.z);r.yaw=Math.atan2(-B.nx[dd.i],-B.nz[dd.i]);query(C,r.p.x,r.p.z,-1,r.q);r.idx=r.q.i;}}
 r.camYaw=r.yaw;views=[{r,cam:new THREE.PerspectiveCamera(62,1,.3,9000),cp:null,look:new V(),finT:0}];hud.setViews(1,[r]);app='hub';phase='free';doorCool=1;
 document.body.classList.add('playing');show('hubhud');updateHubHud();snd.engines(1);snd.startMusic('hub');
 if(balloons(save)===0&&!atDoor)hubMsg('WELCOME TO CRITTER ISLAND!',3);
 if(Object.keys(save.boss).length===4&&atDoor)hubMsg('ISLAND CHAMPION! ♛',4);}
function updateHubHud(){$('hb-ic').src=icon('balloon');$('hb-n').textContent=balloons(save);$('hb-keys').innerHTML=WORLDS.map((w,i)=>`<img src="${icon('key',48)}" class="${save.boss[i]?'on':''}" title="${w.boss.n}">`).join('');}
function hubMsg(s,t=2){$('hubmsg').textContent=s;$('hubmsg').classList.add('on');hubMsgT=t;}
let nearDoor=null;
function hubStep(dt){const r=racers[0];if(!autopilot)readInput(r);else think(C,r,racers,curDiff,{hazards:[],laps:1},dt);stepRacer(C,TR,r,dt,env);doorCool-=dt;
 nearDoor=null;let bd=1e9;for(const d of doors){const dist=Math.hypot(r.p.x-d.p.x,r.p.z-d.p.z);if(dist<18&&dist<bd){bd=dist;nearDoor=d;}
  if(dist<4.2&&doorCool<=0){if(d.open){enterDoor(d);return;}else{r.v=-8;doorCool=1;hubMsg('NEED '+d.req+' BALLOONS',1.6);snd.play('pop');}}}
 if(nearDoor&&(edge.Enter||(pad(0)||{}).start))enterDoor(nearDoor);
 const dp=$('door');if(nearDoor){dp.hidden=false;const d=nearDoor,t=d.t,wd=WORLDS[d.w];dp.style.borderLeftColor=wd.col;$('d-world').textContent=wd.n+(t.boss?' · BOSS':'');$('d-name').textContent=t.n;
  const won=save.won[t.id],coins=save.coins[t.id];$('d-info').innerHTML=!d.open?`Locked — collect <b>${d.req}</b> balloons to open this door. You have ${balloons(save)}.`:t.boss?`Race <b>${wd.boss.n}</b> one-on-one. ${wd.boss.d}`:
   `${{kart:'Kart',hover:'Hovercraft',plane:'Plane'}[t.veh]} race · ${t.laps} laps. `+(coins?'Both balloons won!':won?'<b>Silver coin challenge:</b> grab all 8 silver coins and win.':'Finish 1st to win a balloon.');
  $('d-best').textContent=save.best[t.id]?'BEST '+fmtT(save.best[t.id]):'';$('d-go').hidden=!d.open;}else dp.hidden=true;
 if(hubDeco){hubDeco.bl.forEach((b,k)=>{b.position.y+=Math.sin(time*1.5+k)*.004;b.rotation.y+=dt*.3;});}
 if(hubMsgT>0){hubMsgT-=dt;if(hubMsgT<=0)$('hubmsg').classList.remove('on');}}
function enterDoor(d){if(!d||!d.open)return;snd.play('door');const coins=!d.t.boss&&save.won[d.t.id]&&!save.coins[d.t.id];fadeTo(()=>startRace(d.t.id,{mode:'adventure',humans:1,coins,cc:1}));}
function fadeTo(fn){const f=$('fade');f.classList.add('on');app='fading';setTimeout(()=>{fn();setTimeout(()=>f.classList.remove('on'),60);},360);}

/* ================= env callbacks (physics → fx/sfx/rules) ================= */
const H=r=>r.human>=0;const say=(r,m,t=1)=>{if(H(r)){r.vmsg=m;r.vmsgT=t;}};
const env={t:0,frozen:false,
 lap(r){if(app!=='race')return;if(r.lap>=2){const lt=raceT-r.lapStart;r.lapTimes.push(lt);r.bestLap=Math.min(r.bestLap,lt);}r.lapStart=raceT;
  if(H(r)&&raceMode==='tt'&&ghost&&r.lap>=2){const g=ghost.laps[r.lap-2];if(g!==undefined){const dd=raceT-g;r.delta=(dd<0?'-':'+')+Math.abs(dd).toFixed(2);r.deltaT=3.5;}}
  if(r.lap>def.laps&&!r.fin){r.fin=raceT;finishOrder.push(r);r.finPlace=finishOrder.length;if(H(r)){r.vmsg=raceMode==='tt'?fmtT(r.fin):ORD(r.finPlace)+'!';r.vmsgT=99;snd.play(r.finPlace===1||raceMode==='tt'?'win':r.finPlace<=3?'lap':'lose');fx.confetti(r.p);}}
  else if(H(r)&&r.lap===def.laps&&def.laps>1){say(r,'FINAL LAP',1.6);snd.play('final');}else if(H(r)&&r.lap>1){say(r,'LAP '+r.lap,1);snd.play('lap');}},
 pod(r){if(H(r))snd.play('pod');},podEmpty(){},berry(r,b){if(H(r)){snd.play('berry');fx.sparkle(b.p,0xff4a7a,8);}},coin(r,c){snd.play('coin');fx.sparkle(c.p,0xdfe8ff,24);say(r,r.coins+' / 8',.9);},
 hurt(r,lost,k,by){if(H(r)){snd.play('hit');say(r,lost?'-'+lost+' BERRIES':'',.8);shakeFor(r,.35);}if(k!=='storm'&&k!=='frenzy')fx.boom(r.p,k);if(k==='frenzy'&&by&&H(by))snd.play('bumper');},pop(r){snd.play('pop');fx.sparkle(r.p,0x9af0ff,30);},
 splash(r){for(let k=0;k<20;k++)fx.spray(r.p,30);if(H(r)){snd.play('splash');say(r,'SPLASH!',1);}},fall(r){if(H(r)){snd.play('fall');say(r,'WHOOPS!',1.2);}},respawn(r){if(H(r))snd.play('pop');},
 jump(r){if(H(r)){snd.play('hop');if(!r.trickDone)say(r,'HOP FOR A TRICK!',.5);}},land(r,v){if(v>6.5)fx.ringDust(r.p,T.snow?0xffffff:T.ground[0],v>10?14:7);if(H(r)&&v>9)shakeFor(r,.12);},
 hop(r){if(H(r))snd.play('hop');},trick(r){fx.stars(r.p.clone().setY(r.p.y+1));if(H(r)){snd.play('trick');say(r,['FLIP!','SPIN!','TWIRL!'][r.trickK%3],.7);}},trickBoost(r){if(H(r))snd.play('mt2');},
 mt(r,l){if(H(r)){snd.play('mt'+l);say(r,['','MINI TURBO','SUPER TURBO','ULTRA TURBO'][l],.7);}},driftLv(r,l){if(H(r))snd.play('lv');},pad(r){if(H(r))snd.play('pad');},
 draft(r){if(H(r)){snd.play('draft');say(r,'SLIPSTREAM!',.8);}},
 ring(r,g){if(H(r)){snd.play('ring');fx.sparkle(g.p,g.gold?0xffd03a:0xff6aa0,30);}},barrel(r){r.barrelDir=r.inp.steer>=0?1:-1;},scrape(r){if(Math.random()<.3)fx.dust(r.p,0xaaaaaa);},
 bump(a,b,ov){if((H(a)||H(b))&&ov>.3)snd.blip(140,.08,'square',.06);},sfx(k,r){if(H(r)||Math.random()<.4)snd.play(k);},
 frenzy(r){say(r,'WILD FRENZY!',1.2);},storm(r,n){snd.play('storm');for(const v of views){v.flash=1;}say(r,n?'ZAPPED '+n+'!':'THUNDER!',1.2);},
 hazHit(r,k){if(k==='geyser'&&H(r))snd.play('geyser');},bumper(r){if(H(r)){snd.play('bumper');shakeFor(r,.15);}},quake(p){snd.play('boom');for(const v of views)if(v.r.p.distanceTo(p)<40)v.shake=Math.max(v.shake||0,.4);}};
function shakeFor(r,s){for(const v of views)if(v.r===r)v.shake=Math.max(v.shake||0,s);}

/* ================= race step ================= */
function ranks(){const ord=racers.slice().sort((a,b)=>(a.fin&&b.fin)?a.fin-b.fin:a.fin?-1:b.fin?1:b.prog-a.prog);ord.forEach((r,k)=>r.place=k+1);return ord;}
function raceStep(dt){time+=dt;env.t=time;
 if(phase==='intro'){introT+=dt;env.frozen=true;if(introT>INTRO||edge.Enter||edge.Space||edge.KeyE){phase='count';cdT=3;$('banner').classList.remove('on');}}
 if(phase==='count'){const before=Math.ceil(cdT);cdT-=dt;env.frozen=true;if(Math.ceil(cdT)!==before&&cdT>0)snd.play('beep');
  for(const r of racers)if(r.human>=0){readInput(r);if((r.veh==='plane'?keys.KeyW||keys.ArrowUp:r.inp.gas>0)&&startPress[r.human]===undefined)startPress[r.human]=cdT;}
  if(cdT<=0){phase='go';snd.play('go');env.frozen=false;for(const r of racers)if(r.human>=0){const sp=startPress[r.human];if(sp!==undefined&&sp<.55&&sp>.05){r.zipT=1.4;r.zipPow=1.4;say(r,'ROCKET START!',1.2);}else if(sp!==undefined&&sp>=1.4){r.spinT=.6;say(r,'TOO EARLY!',1);}}
   for(const r of racers)if(r.human<0&&Math.random()<curDiff.skill*.6)r.zipT=1;}}
 if(phase==='go'||phase==='done'){raceT+=dt;if(app==='race')clock-=dt;}
 const ctx={hazards:items.list,obs:haz?haz.obs:null,laps:def.laps,finishedHumans:racers.every(r=>r.human<0||r.fin),hazard:(b,h)=>{items.hazard(b.bossHz,b,h);if(b.bossHz==='bolt')snd.play('bolt');}};
 const leadProg=Math.max(...racers.map(r=>r.prog));
 for(const r of racers){if(r.human>=0&&!r.fin&&!autopilot&&app==='race')readInput(r);else{think(C,r,racers,curDiff,ctx,dt);if(r.fin){r.inp.item=false;r.inp.gas=.75;}}
  if(phase==='intro'||phase==='count'){r.inp.item=false;}
  stepRacer(C,TR,r,dt,env);
  if(r.roll_>0){r.roll_-=dt;if(r.roll_<=0){r.item=rollItem(r.place,racers.length,Math.random,(leadProg-r.prog)*C.len,items.storms);r.itemN=r.item==='zip3'?3:1;if(H(r))snd.play('pod');}}
  if(r.inp.item&&!r.prevItem&&r.item&&r.roll_<=0&&phase==='go')items.use(r,racers,env);r.prevItem=r.inp.item;
  if(phase==='go')pickups(C,r,env,coinsOn);
  if(r.vmsgT>0){r.vmsgT-=dt;if(r.vmsgT<=0&&!r.fin)r.vmsg='';}if(r.deltaT>0){r.deltaT-=dt;if(r.deltaT<=0)r.delta='';}
  if(r.human>=0&&!r.fin){const dot=Math.sin(r.yaw)*r.q.tx+Math.cos(r.yaw)*r.q.tz;r.wrongT=dot<-.35&&r.v>4&&r.spinT<=0&&!r.air?(r.wrongT||0)+dt:0;r.wrong=r.wrongT>1;
   if(r.offT>5||(r.q&&Math.abs(r.q.u)>r.q.w+24&&r.v<3&&phase==='go'))r.stuckT=(r.stuckT||0)+dt;else r.stuckT=0;if(r.stuckT>4){r.rescueT=1;r.stuckT=0;}}
  if(r.human<0&&phase==='go'){if(Math.abs(r.q.u)>r.q.w+10&&r.v<6)r.stuckT=(r.stuckT||0)+dt;else r.stuckT=0;if(r.stuckT>3){r.rescueT=.8;r.stuckT=0;}
   // watchdog: a CPU that makes no progress for 6 s gets put back on the racing line
   if(!r.fin&&r.rescueT<=0){if(r.wdProg===undefined||r.prog>r.wdProg+.012){r.wdProg=r.prog;r.wdT=0;}else if((r.wdT=(r.wdT||0)+dt)>6){r.rescueT=.8;r.rescueTo=(r.idx+6)%C.B.n;r.wdT=0;r.wdProg=r.prog;}}}}
 if(phase==='go'||phase==='done'){collide(racers,env);slipstream(racers,dt,env);}
 items.update(dt,racers,env);haz.update(dt,racers,env,env.frozen);ranks();
 // ghost recording (time trial)
 if(raceMode==='tt'&&phase==='go'){const me=views[0].r;if(!me.fin){recT+=dt;while(recT>=.05){recT-=.05;rec.push([+me.p.x.toFixed(2),+me.p.y.toFixed(2),+me.p.z.toFixed(2),+me.yaw.toFixed(3),+me.pitch.toFixed(3),+me.roll.toFixed(3)]);}}}
 // end conditions
 if(phase==='go'&&app==='race'){const hum=racers.filter(r=>r.human>=0);if(hum.every(r=>r.fin)){endT+=dt;if(endT>3.2)endRace(false);}else if(clock<=0)endRace(true);}}

/* ================= results / scoring ================= */
function endRace(timeUp){phase='done';const ord=ranks();
 const est=r=>{if(r.fin)return r.fin;const avg=raceT/Math.max(.2,r.prog);return raceT+(def.laps+1-r.prog)*avg;};
 const me=racers.find(r=>r.human===0);const finished=!!me.fin,place=me.place;
 let rew=[];let newBalloon=false;
 if(raceMode==='adventure'&&finished&&place===1){const t=def;if(t.boss){if(!save.boss[t.w]){save.boss[t.w]=1;newBalloon=true;rew.push('BOSS BEATEN! +1 BALLOON + TROPHY KEY');}else rew.push('BOSS BEATEN AGAIN!');}
  else if(coinsOn){if(me.coins>=8){if(!save.coins[t.id]){save.coins[t.id]=1;newBalloon=true;rew.push('SILVER COIN CHALLENGE COMPLETE! +1 BALLOON');}}else rew.push('WON — BUT ONLY '+me.coins+'/8 SILVER COINS');}
  else if(!save.won[t.id]){save.won[t.id]=1;newBalloon=true;rew.push('+1 BALLOON!');}else rew.push('1ST PLACE AGAIN!');}
 else if(raceMode==='adventure'&&finished)rew.push(def.boss?(WORLDS[def.w].boss.n+' WINS THIS TIME. TRY AGAIN!'):'FINISH 1ST TO WIN THE BALLOON');
 if(raceMode==='tt'&&finished){const nb=saveGhost(me);rew.push(nb?(ghost?'NEW RECORD! GHOST SAVED — BEAT IT NEXT TIME':'GHOST SAVED — RACE IT NEXT TIME'):'GHOST TIME '+fmtT(ghost.t)+' · '+((me.fin-ghost.t)>=0?'+':'')+(me.fin-ghost.t).toFixed(2));}
 if(finished&&(!save.best[def.id]||me.fin<save.best[def.id])){if(save.best[def.id])rew.push('TRACK RECORD!');save.best[def.id]=me.fin;}
 save.driver=opt.picks[0];save.diff=opt.diff;writeSave(save);
 if(newBalloon){snd.play('balloon');if(Object.keys(save.boss).length===4&&def.boss)rew.push('ISLAND CHAMPION — ALL FOUR BOSSES BEATEN!');}
 // Grand Prix points
 let gpCols='';if(raceMode==='gp'&&gp){const h={};ord.forEach((r,k)=>{const pts=POINTS[k]||0;gp.pts[r.key]+=pts;gp.last[r.key]=k+1;h[r.key]=pts;r.gpAdd=pts;});gp.hist.push(h);gpCols='<th>PTS</th><th>TOTAL</th>';}
 const pts=award(me,timeUp);
 $('oeye').textContent=(timeUp?'TIME UP · ':'')+def.n+' · '+(raceMode==='gp'?CUPS[gp.cup].n+' RACE '+(gp.idx+1)+'/4':raceMode==='tt'?'TIME TRIAL':WORLDS[def.w].n)+' · '+curCC.n;
 $('ores').textContent=raceMode==='tt'?(finished?fmtT(me.fin):'TIME UP'):finished?(place===1?'1ST PLACE!':ORD(place)+' PLACE'):'TIME UP';$('ores').style.color=finished&&(place===1||raceMode==='tt')?'#ffd23a':finished?'#fff':'#ff6a4a';
 $('orew').textContent=rew.join(' · ')||(finished?(raceMode==='gp'?'+'+me.gpAdd+' CUP POINTS':''):'The race clock ran out before you crossed the line.');
 const lapsDone=r=>r.fin?'—':'LAP '+Math.max(1,Math.min(def.laps,r.lap));
 $('otab').innerHTML='<tr><th>#</th><th>RACER</th><th>TIME</th><th>BEST LAP</th><th>BERRIES</th><th>HITS</th>'+gpCols+'</tr>'+ord.map((r,k)=>`<tr class="${r.human>=0?'me':r.boss?'boss':''}"><td>${k+1}</td><td><i style="background:#${(r.boss?0xff3a3a:r.d.kc).toString(16).padStart(6,'0')}"></i>${r.name}${r.human>=0?' (P'+(r.human+1)+')':''}</td><td>${r.fin?fmtT(r.fin):timeUp?'DNF · '+lapsDone(r):'~'+fmtT(est(r))}</td><td>${r.bestLap<1e8?fmtT(r.bestLap):'—'}</td><td>${r.berries}</td><td>${r.stats.landed||0}</td>${gpCols?`<td>+${r.gpAdd}</td><td><b>${gp.pts[r.key]}</b></td>`:''}</tr>`).join('');
 $('otok').textContent=`${pts.pts} PTS · +${pts.tok} TOKENS · BEST ${best()} PTS`;
 $('cont').textContent=raceMode==='adventure'?'BACK TO ISLAND':raceMode==='gp'?(gp.idx<3?'NEXT RACE ▸':'CUP RESULTS ▸'):'MENU';$('again').textContent='RETRY';$('again').hidden=raceMode==='gp';$('omenu').hidden=raceMode!=='adventure'&&raceMode!=='gp';
 app='results';for(const v of views)v.finT=v.finT||0;snd.stopMusic();if(!(finished&&(place===1||raceMode==='tt')))snd.play('lose');setTimeout(()=>{if(app==='results'){show('over');document.body.classList.remove('playing');}},timeUp?200:700);
 window.dispatchEvent(new Event('critterkart:end'));}
function award(me,timeUp){const n=racers.length,place=me.place,fin=!!me.fin;const table=n<=2?[1500,300]:[1000,800,650,500,400,300,200,100];
 const pts=Math.round((fin?(n<=1?800:table[place-1]||100):50)+me.berries*20+me.coins*50+(fin?Math.max(0,limit-me.fin)*4:0)+(me.stats.rings||0)*10+(me.stats.tricks||0)*15+(me.stats.mt||0)*5);
 const won=fin&&place===1;lastAward={pts,won,place,track:def.n,time:me.fin,driver:me.d.n,veh:def.veh,mode:raceMode,split:humansN()>1,diff:curDiff.n,cc:curCC.n};
 const tok=5+Math.min(60,pts/60|0);addRound(tok,won);saveBest(ID,pts);return{pts,tok};}
function best(){return bestScore(ID);}

function pause(on){if(on&&app==='race'){app='paused';$('pause').hidden=false;snd.stop();}else if(!on&&app==='paused'){app='race';$('pause').hidden=true;snd.startMusic(T.key);}}
function toMenu(){clearWorld();gp=null;app='menu';views=[];document.body.classList.remove('playing','podium');show('menu');snd.stop();refreshMenu();menuScene();}

/* ================= visuals per frame ================= */
const _f=new V(),_t=new V(),_w=new V();
function poseRacer(r,dt){const g=r.g,U=g.userData;g.position.copy(r.p);g.visible=true;
 if(r.rescueT>0){if(!r.rescued){r.sink=(r.sink||0)+dt;g.position.y-=r.sink*r.sink*14;g.visible=r.sink<.75;}else{r.sink=0;g.position.y+=r.rescueT*12;}}else r.sink=0;
 g.rotation.set(-r.pitch,r.yaw,r.roll,'YXZ');const st=r.inp.steer||0;
 // tricks: flip / spin / twirl the whole kart; suspension bob and squash on landings
 if(U.root&&U.type!=='boss'){const tk=r.trickT>0?1-r.trickT/.5:0,a=tk*Math.PI*2;U.root.rotation.set(r.trickK===0?-a:0,r.trickK===1?a:0,r.trickK===2?a:0);
  const sq=r.squash||0;U.root.scale.set(1+sq*.12,1-sq*.18,1+sq*.08);U.root.position.y=(r.air?0:Math.sin(time*23+r.d.spd)*.015*Math.min(1,r.v/20))+(r.offT>0&&!r.air?Math.sin(time*31)*.04:0);}
 if(U.wheels)U.wheels.forEach((w,k)=>{w.rotation.x+=r.v*dt/.3;if(k<2&&U.type==='kart')w.rotation.y=st*.4+(r.drift.on?r.drift.dir*.25:0);});if(U.sw)U.sw.rotation.z=-st*1.4;if(U.fan)U.fan.rotation.z+=dt*(8+Math.abs(r.v));if(U.prop)U.prop.rotation.z+=dt*(20+r.v);
 const acc=(r.v-(r.lastV??r.v))/Math.max(dt,1e-3);r.lastV=r.v;
 const mood=r.podium?(r.podium===1?'cheer':'cheer'):r.fin?(r.finPlace<=3||raceMode==='tt'?'cheer':'sad'):'race';
 let look=0;if(!r.fin&&r.human>=0){if(items.list.some(h=>h.k==='hornet'&&h.target===r&&h.p.distanceTo(r.p)<30))look=1;else if(r.lookBack)look=1;}
 else if(!r.fin&&racers.some(o=>o!==r&&o.place===r.place+1&&o.p.distanceTo(r.p)<5))look=.6;
 if(U.crit)poseCritter(U.crit,{t:time+r.d.spd*3,dt,steer:st,v:Math.abs(r.v),air:r.air,spin:r.spinT,boost:r.zipT>0||r.frenzyT>0,mood,look:look*(r.drift.dir||1)*-1,squash:r.squash,drift:r.drift.on?r.drift.dir:0,trick:r.trickT>0,accel:acc});
 if(U.bubble)U.bubble.visible=r.shield>0;if(U.aura){U.aura.visible=r.frenzyT>0;if(r.frenzyT>0){U.aura.material.color.setHSL((time*1.5)%1,1,.6);U.aura.scale.set(1.5+Math.sin(time*20)*.08,1.2,2);}}
 const boost=r.zipT>0||r.frenzyT>0;if(U.fl)U.fl.forEach(f=>{f.visible=boost;if(boost){f.scale.set(.15,.6+Math.random()*.6,.15);f.material.color.setHex([0xffa040,0x8ad8ff,0xffa040,0xff70ff,0xffe080,0xff8a30,0xc8f0ff][r.driftBoost||0]);}});
 // particles
 const fxv=_f.set(Math.sin(r.yaw),0,Math.cos(r.yaw)),side=_w.set(Math.cos(r.yaw),0,-Math.sin(r.yaw));if(r.rescueT>0)return;
 if(r.drift.on&&r.veh==='kart'&&!r.air){for(const s of[-1,1]){_t.set(r.p.x-fxv.x*.8+side.x*s*.78,r.p.y+.12,r.p.z-fxv.z*.8+side.z*s*.78);fx.spark(_t,r.drift.lvl,{x:-fxv.x*.6+side.x*s*.3,y:.6,z:-fxv.z*.6+side.z*s*.3});
   const key='sk'+s;if(r[key]&&(H(r)||r.drift.lvl>0))fx.skids.add(r[key],_t,H(r)?.26:.2);r[key]=(r[key]||new V()).copy(_t);}if(Math.random()<(H(r)?.1:.035))fx.smoke(_t,T.snow?0xdfe6f2:T.night?0x7a7aa0:0xa89e92,.45);}else{r.sk1=r['sk-1']=null;}
 if(boost){_t.set(r.p.x-fxv.x*1.4,r.p.y+.6,r.p.z-fxv.z*1.4);fx.flame(_t,_f.clone().multiplyScalar(-1),r.frenzyT>0?4:r.driftBoost===3?3:r.driftBoost===1?1:r.driftBoost===4?4:0);}
 if(r.frenzyT>0&&Math.random()<.8)fx.rainbow(r.p,time);
 if(r.draft>.3&&H(r))fx.wind(r.p,r.yaw);
 if(r.veh==='hover'&&r.water&&r.v>4&&!r.air){_t.set(r.p.x-fxv.x*1.5,SEA+.2,r.p.z-fxv.z*1.5);if(Math.random()<.7)fx.spray(_t,r.v,T.night?0x8ad0ff:0xf0faff);}
 if(r.veh==='kart'&&(r.offT>0||r.q.offSurf)&&r.v>8&&Math.random()<(H(r)?.4:.15))fx.dust(r.p,T.snow?0xffffff:T.ground[0]);
 if(r.veh==='plane'&&r.v>24&&Math.random()<.35){for(const s of[-1,1]){_t.set(r.p.x+Math.cos(r.yaw)*s*2.1-fxv.x*.8,r.p.y+.62,r.p.z-Math.sin(r.yaw)*s*2.1-fxv.z*.8);fx.add.emit(_t.x,_t.y,_t.z,0,0,0,.28,.3,.36,.18,.3);}}}
function camFollow(v,dt,snap){const r=v.r,cam=v.cam;
 if(r.rescueT>0&&!r.rescued&&v.cp){cam.position.copy(v.cp);cam.lookAt(r.g.position.x,r.g.position.y+1,r.g.position.z);return;}const plane=r.veh==='plane';r.camYaw=r.spinT>0||r.barrelT>0?r.camYaw:r.camYaw+wrapA(r.yaw-r.camYaw)*Math.min(1,dt*(plane?3:r.drift.on?3.2:5));
 const back=plane?11:r.veh==='hover'?8.2:7.2,up=plane?3.2:3.35;const cp=Math.cos(plane?r.pitch*.6:0);const lb=r.lookBack&&!plane?-1:1;
 const dl=r.drift.on?-r.drift.dir*1.1:0;const sx=Math.cos(r.camYaw),sz=-Math.sin(r.camYaw);
 const tx=r.p.x-Math.sin(r.camYaw)*back*cp*lb+sx*dl,tz=r.p.z-Math.cos(r.camYaw)*back*cp*lb+sz*dl,ty=r.p.y+up-(plane?Math.sin(r.pitch*.6)*back:0);
 let gy=TR?TR.h(tx,tz)+1.2:0;if(!plane)gy=Math.max(gy,SEA+1);const want=new V(tx,Math.max(ty,gy),tz);if(!v.cp||snap||v.lb!==lb){v.cp=want.clone();}else v.cp.lerp(want,1-Math.exp(-dt*(plane?12:10)));v.lb=lb;
 cam.position.copy(v.cp);if(v.shake>0){v.shake=Math.max(0,v.shake-dt);const s=v.shake*.6;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.position.z+=(Math.random()-.5)*s;}
 v.look.set(r.p.x+Math.sin(r.camYaw)*6*lb,r.p.y+1.45+(plane?Math.sin(r.pitch)*5:0),r.p.z+Math.cos(r.camYaw)*6*lb);cam.lookAt(v.look);
 if(plane)cam.rotateZ(r.roll*.18);const f=62+(r.zipT>0?10:0)+(r.frenzyT>0?6:0)+cl(r.v/40,0,1)*6;cam.fov=lerp(cam.fov,f,Math.min(1,dt*4));cam.updateProjectionMatrix();}
// finish camera: swing round to the front of the kart and watch the critter celebrate (or sulk)
function finishCam(v,dt){const r=v.r,cam=v.cam;v.finT=(v.finT||0)+dt;const d=r.veh==='plane'?12:6.2,h=r.veh==='plane'?3:1.8;
 // orbit in kart-relative polar coordinates so a moving kart never outruns the camera
 if(v.fa===undefined){v.fa=Math.atan2(cam.position.x-r.p.x,cam.position.z-r.p.z)-r.yaw;v.fd=Math.max(4,Math.hypot(cam.position.x-r.p.x,cam.position.z-r.p.z));v.fh=cam.position.y-r.p.y;}
 const tgt=.45+Math.min(v.finT,16)*.14;v.fa+=wrapA(tgt-v.fa)*Math.min(1,dt*2.2);v.fd=lerp(v.fd,d,Math.min(1,dt*2));v.fh=lerp(v.fh,h,Math.min(1,dt*2));const a=r.yaw+v.fa;
 const want=new V(r.p.x+Math.sin(a)*v.fd,r.p.y+v.fh,r.p.z+Math.cos(a)*v.fd);if(r.veh!=='plane')want.y=Math.max(want.y,TR.h(want.x,want.z)+1,SEA+1.2);cam.position.copy(want);cam.lookAt(r.p.x,r.p.y+1.1,r.p.z);cam.fov=lerp(cam.fov,48,Math.min(1,dt*2));cam.updateProjectionMatrix();}
// intro flyover: establishing orbit round a landmark / hazard → swoop down the home straight → crane round to the grid
function introCam(v,dt){const r=v.r,cam=v.cam,k=introT/INTRO,B=C.B,n=B.n;
 if(k<.34){const s=k/.34;const fh=C.haz[0]?C.haz[0].i:Math.round(n*.3);const c=at(C,fh,0);const a=s*1.1+fh;const d=34-s*6;cam.position.set(c.x+Math.sin(a)*d,c.y+16-s*6,c.z+Math.cos(a)*d);cam.lookAt(c.x,c.y+1,c.z);cam.fov=55;}
 else if(k<.68){const s=(k-.34)/.34;const i=(n*.86+s*n*.11)%n;const p=at(C,i,B.line[Math.floor(i)%n]*.5),q=at(C,i+14,0);cam.position.set(p.x,p.y+5.5-s*2,p.z);cam.lookAt(q.x,q.y+1,q.z);cam.fov=60;}
 else{const s=sstep(0,1,(k-.68)/.32);const a=r.yaw+lerp(0,Math.PI,s),d=lerp(11,7,s),h=lerp(4.5,2.9,s);cam.position.set(r.p.x+Math.sin(a)*d,r.p.y+h,r.p.z+Math.cos(a)*d);cam.lookAt(r.p.x+Math.sin(r.yaw)*6*s,r.p.y+1.1+.2*s,r.p.z+Math.cos(r.yaw)*6*s);cam.fov=lerp(50,62,s);}
 cam.updateProjectionMatrix();v.cp=null;r.camYaw=r.yaw;}
function podiumCam(v,dt){podT+=dt;const cam=v.cam,a=podYaw+Math.sin(podT*.25)*.3,d=17;cam.position.set(podCenter.x+Math.sin(a)*d,podCenter.y+5,podCenter.z+Math.cos(a)*d);const wide=innerWidth>760?6.5:0;cam.lookAt(podCenter.x-Math.cos(a)*wide,podCenter.y+2.4,podCenter.z+Math.sin(a)*wide);cam.fov=46;cam.updateProjectionMatrix();
 if(Math.random()<dt*3){const p=podCenter.clone();p.x+=(Math.random()-.5)*8;p.y+=8;p.z+=(Math.random()-.5)*8;fx.confetti(p);}}

/* ================= main step ================= */
function step(dt){
 if(app==='race'||app==='results')raceStep(dt);else if(app==='hub'){time+=dt;env.t=time;hubStep(dt);}else if(app==='menu'||app==='podium'){time+=dt;}
 IN.flush();}
function frame(dt){if(app!=='paused')fx.update(dt);
 if(app==='race'||app==='hub'||app==='results'||app==='paused'||app==='fading'||app==='podium'){if(app!=='paused'&&app!=='fading')for(const r of racers)poseRacer(r,dt);
  if(app==='podium'){for(const r of racers)if(r.podium){r.g.position.copy(r.p);r.g.rotation.set(0,r.yaw,0);}}
  for(const v of views){if(app==='podium')podiumCam(v,dt);else if(app==='race'&&phase==='intro')introCam(v,dt);else if((app==='results'||v.r.fin)&&app!=='hub')finishCam(v,dt);else camFollow(v,dt);}
  W&&W.update(dt,views[0]?views[0].r.p:null);if(app==='race'||app==='results')poseGhost();
  if(app==='race'){updateRaceHud(dt);views.forEach((v,k)=>snd.engine(k,Math.abs(v.r.v),v.r.veh,phase!=='intro',v.r.drift.on?v.r.drift.lvl+1:0,v.r.zipT>0));}
  if(app==='hub'){hud.update(views,{n:1,laps:1,hub:true,t:time,raceT:0,coinsOn:false});snd.engine(0,Math.abs(views[0].r.v),'kart',true,views[0].r.drift.on?1:0,views[0].r.zipT>0);}}
 else if(app==='menu'){W&&W.update(dt,null);menuCam(dt);}}
function updateRaceHud(dt){const tag=raceMode==='gp'&&gp?`${CUPS[gp.cup].n} · ${gp.idx+1}/4`:raceMode==='tt'?'TIME TRIAL'+(ghost?' · GHOST '+fmtT(ghost.t):''):curCC.n+' · '+curDiff.n;
 hud.update(views,{n:racers.length,laps:def.laps,t:time,raceT,coinsOn,tag,noItems:raceMode==='tt'&&!views[0].r.item,delta:r=>r.delta||''});
 const cl_=$('clock');cl_.querySelector('b').textContent=fmtClock(clock);cl_.classList.toggle('low',clock<20&&phase==='go');
 const cd=$('cd');if(phase==='count'){cd.textContent=Math.ceil(cdT);cd.className='';cd.style.opacity=1;cd.style.transform=`scale(${1+(cdT%1)*.4})`;}else if(phase==='go'&&raceT<.9){cd.textContent='GO!';cd.className='go';cd.style.opacity=1-raceT;cd.style.transform=`scale(${1+raceT})`;}else cd.style.opacity=0;
 $('hud').classList.toggle('intro',phase==='intro');
 let fl=0;for(const v of views){if(v.flash>0){v.flash-=dt*2;fl=Math.max(fl,v.flash);}}$('flash').style.opacity=fl*.7;
 if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}
 if(views.length===1){drawMini($('mini'),C,ghost?[...racers,{ghost:true,p:ghost.g.position,d:{kc:0},human:-1,rescueT:0}]:racers,views[0].r);const ord=racers.slice().sort((a,b)=>a.place-b.place);const st=$('stand');const html=racers.length>1?ord.map(r=>`<li class="${r.human>=0?'me':r.boss?'boss':''}">${r.place}. ${r.name}<i style="background:#${(r.boss?0xff3a3a:r.d.kc).toString(16).padStart(6,'0')}"></i></li>`).join(''):'';if(st._h!==html){st.innerHTML=html;st._h=html;}}
 else drawMini($('mini'),C,racers,null);}
function banner(t,s,d=2){$('banner').querySelector('b').textContent=t;$('banner').querySelector('span').textContent=s;$('banner').classList.add('on');banT=d;}

/* ================= menu backdrop ================= */
let menuT=0;function menuScene(){loadWorld(trackById('coconut'),'shores','#2ad0c8');views=[];
 // a few CPU karts lapping behind the menu
 curCC=CC[1];curDiff=DIFF[2];DRIVERS.slice(0,4).forEach((d,k)=>{const r=addRacer(d,'kart',{});place(C,r,k*30,(k%2?1:-1)*3);r.personal=1;r.lap=1;});}
function menuCam(dt){menuT+=dt;if(!C)return;
 if(racers.length){const ctx={hazards:items.list,obs:haz.obs,laps:3,finishedHumans:true};for(const r of racers){think(C,r,racers,curDiff,ctx,dt);stepRacer(C,TR,r,dt,env);poseRacer(r,dt);}haz.update(dt,racers,env,false);
  const r=racers[0],a=r.yaw+Math.PI*.78+Math.sin(menuT*.15)*.4;mainCam.position.set(r.p.x+Math.sin(a)*10,r.p.y+3.4,r.p.z+Math.cos(a)*10);const sx=Math.cos(a),sz=-Math.sin(a);mainCam.lookAt(r.p.x-sx*4.2,r.p.y+1.4,r.p.z-sz*4.2);mainCam.fov=50;mainCam.updateProjectionMatrix();return;}
 const B=C.B,f=(menuT*.012)%1,i=f*B.n;const p=at(C,i,0),q=at(C,i+40,0);mainCam.position.set(p.x-B.nx[Math.floor(i)%B.n]*12,p.y+26+Math.sin(menuT*.2)*4,p.z-B.nz[Math.floor(i)%B.n]*12);mainCam.lookAt(q.x,q.y+2,q.z);mainCam.fov=55;mainCam.updateProjectionMatrix();}

/* ================= rendering ================= */
const POST={exposure:1.0,bloom:.32,bloomThreshold:.92,bloomRadius:.45,vignette:.26,saturation:1.1,grain:.012,aoStrength:.8};
let fxFull=null,fxSplit=[];
function applyQuality(q){gfx=q;R.shadowMap.enabled=true;if(W){W.sun.castShadow=q>0;W.sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(W.sun.shadow.map){W.sun.shadow.map.dispose();W.sun.shadow.map=null;}}R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));fxFull=null;fxSplit=[];}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function getFx(i,w,h,cam){const exp=(T&&T.exp)||1;if(i<0){if(!fxFull||fxFull.cam!==cam){fxFull=cinematic(R,scene,cam,{...POST,exposure:exp,ao:gfx>=2});fxFull.cam=cam;fxFull.w=0;}if(fxFull.w!==w*9999+h){fxFull.w=w*9999+h;fxFull.setSize(w,h);}return fxFull;}
 let f=fxSplit[i];if(!f||f.cam!==cam){f=fxSplit[i]=cinematic(R,scene,cam,{...POST,exposure:exp,ao:false,bloom:.28});f.cam=cam;f.w=0;}if(f.w!==w*9999+h){f.w=w*9999+h;f.setSize(w,h);}return f;}
function renderView(cam,x,y,w,h,i){cam.aspect=w/h;cam.updateProjectionMatrix();fx.scale(cam,h*R.getPixelRatio());R.setViewport(x,y,w,h);R.setScissor(x,y,w,h);getFx(i,w,h,cam).render();}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);fxFull&&(fxFull.w=0);fxSplit.forEach(f=>f&&(f.w=0));}
 if(views.length===2&&app!=='podium'){R.setScissorTest(true);renderView(views[0].cam,0,h/2,w,h/2,0);renderView(views[1].cam,0,0,w,h/2,1);R.setScissorTest(false);}
 else{R.setScissorTest(false);renderView(views[0]?views[0].cam:mainCam,0,0,w,h,-1);}}

/* ================= menu wiring ================= */
const MODES={gp:'Four races, points for every finish (15-12-10-8-6-4-2-1). Top three overall win a trophy.',vs:'One race on any track, with your own engine class and CPU level.',tt:'Race alone against the clock with three zips. Your best run is saved as a ghost to chase.',adv:'Explore Critter Island. Win balloons to open race doors and beat the four bosses.'};
const GROUPS=[...CUPS.map(c=>({n:c.n,tracks:c.tracks})),{n:'BOSSES',tracks:TRACKS.filter(t=>t.boss).map(t=>t.id)}];
function seg(id,key,cb,num=true){const el=$(id);const set=v=>{opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',(num?+b.dataset.v:b.dataset.v)===v));cb&&cb(v);saveOpt();};set(opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(num?+b.dataset.v:b.dataset.v));return set;}
function saveOpt(){try{localStorage.setItem('pxd_critterkart_opt',JSON.stringify({mode:opt.mode,humans:opt.humans,diff:opt.diff,cc:opt.cc,picks:opt.picks,cup:opt.cup,group:opt.group,track:opt.track}));}catch(e){}}
let setMode,setPl;
setMode=seg('o-mode','mode',v=>{if((v==='adv'||v==='tt')&&opt.humans===2&&setPl)setPl(1);refreshMenu();},false);
setPl=seg('o-pl','humans',v=>{if(v===2&&(opt.mode==='adv'||opt.mode==='tt'))setMode('vs');refreshMenu();});seg('o-diff','diff');seg('o-cc','cc',()=>refreshMenu());
$('o-group').innerHTML=GROUPS.map((g,i)=>`<button data-v="${i}">${g.n.replace(' CUP','')}</button>`).join('');seg('o-group','group',()=>refreshTracks());
function refreshTracks(){const tr=GROUPS[opt.group].tracks.map(trackById);if(!tr.some(t=>t.id===opt.track))opt.track=tr[0].id;
 $('tracks').innerHTML=tr.map(t=>`<button data-id="${t.id}" class="${t.id===opt.track?'on':''}">${t.n}<small>${t.boss?'BOSS · ':''}${VEHN[t.veh]}${t.circuit?' · NEW':''}${save.best[t.id]?' · BEST '+fmtT(save.best[t.id]):''}</small></button>`).join('');
 $('tracks').querySelectorAll('button').forEach(b=>b.onclick=()=>{opt.track=b.dataset.id;saveOpt();refreshTracks();});}
function refreshCups(){$('cups').innerHTML=CUPS.map((c,i)=>{const tr=save.cups[c.id+'_'+opt.cc];return `<button data-i="${i}" class="cup${i===opt.cup?' on':''}" style="--cc:${c.col}"><b>${c.n}</b><small>${c.tracks.map(id=>trackById(id).n).join(' · ')}</small><em class="t${tr||0}">${tr?['','GOLD','SILVER','BRONZE'][tr]:'—'}</em></button>`;}).join('');
 $('cups').querySelectorAll('button').forEach(b=>b.onclick=()=>{opt.cup=+b.dataset.i;saveOpt();refreshCups();});}
function refreshMenu(){refreshTracks();refreshCups();const m=opt.mode,nb=balloons(save);$('modeinfo').textContent=MODES[m];
 $('cuppick').hidden=m!=='gp';$('trackpick').hidden=m!=='vs'&&m!=='tt';$('r-cc').hidden=$('o-cc').hidden=m==='adv';$('r-diff').hidden=$('o-diff').hidden=m==='tt';$('r-pl').hidden=$('o-pl').hidden=m==='tt'||m==='adv';
 $('advprog').textContent=m==='adv'?`ISLAND PROGRESS · ${nb} / 28 BALLOONS · ${Object.keys(save.boss).length} / 4 BOSSES`:opt.humans===2?'P1 CLICK · P2 SHIFT+CLICK OR RIGHT-CLICK A CRITTER':'';
 $('go').textContent=m==='adv'?(nb?'CONTINUE ADVENTURE ▸':'START ADVENTURE ▸'):m==='gp'?'START '+CUPS[opt.cup].n+' ▸':m==='tt'?'START TIME TRIAL ▸':'START RACE ▸';$('pickhint').textContent=opt.humans===2?'PICK YOUR CRITTERS (P2: SHIFT/RIGHT-CLICK)':'PICK YOUR CRITTER';
 [...$('chars').children].forEach((d,i)=>d.className='ch'+(i===opt.picks[0]?' p1':opt.humans===2&&i===opt.picks[1]?' p2':''));}
function portraits(){const tr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});tr.setSize(200,150,false);tr.setClearColor(0,0);tr.toneMapping=THREE.ACESFilmicToneMapping;tr.outputColorSpace=THREE.SRGBColorSpace;
 const out=DRIVERS.map(d=>{const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xffffff,0x554466,1.6));const l=new THREE.DirectionalLight(0xffffff,2.4);l.position.set(3,5,4);s.add(l);const k=makeVehicle('kart',d);k.rotation.y=-.55;s.add(k);
  for(let f=0;f<30;f++)poseCritter(k.userData.crit,{t:f/30,dt:1/30,steer:0,v:0,air:false,spin:0,boost:false,mood:'cheer',look:0,squash:0,drift:0});
  const c=new THREE.PerspectiveCamera(30,4/3,.1,50);c.position.set(2.6,2.4,4.4);c.lookAt(0,1.05,0);tr.render(s,c);return tr.domElement.toDataURL();});tr.dispose();tr.forceContextLoss&&tr.forceContextLoss();return out;}
const bar=(l,v)=>`<span>${l}</span><s style="--w:${v*20}%"></s>`;
(function buildChars(){const imgs=portraits();$('chars').innerHTML=DRIVERS.map((d,i)=>`<div class="ch" data-i="${i}"><img src="${imgs[i]}" alt="${d.n}"><b>${d.n}</b><div class="bars">${bar('SPD',d.spd)}${bar('ACC',d.acc)}${bar('HDL',d.han)}${bar('WGT',d.wt)}</div><p>${d.d}</p></div>`).join('');
 $('chars').querySelectorAll('.ch').forEach(el=>{const i=+el.dataset.i;el.onclick=e=>{if(e.shiftKey&&opt.humans===2){if(i!==opt.picks[0])opt.picks[1]=i;}else{opt.picks[0]=i;if(opt.picks[1]===i)opt.picks[1]=(i+1)%8;}saveOpt();refreshMenu();};
  el.oncontextmenu=e=>{e.preventDefault();if(opt.humans===2&&i!==opt.picks[0]){opt.picks[1]=i;saveOpt();refreshMenu();}};});})();
$('go').onclick=()=>{if(document.activeElement)document.activeElement.blur();snd.init();if(opt.mode==='adv')startHub();else if(opt.mode==='gp')startGP(opt.cup);else startRace(opt.track,{mode:opt.mode,humans:opt.mode==='tt'?1:opt.humans});};
$('reset').onclick=()=>{if(confirm('Reset all Critter Kart progress (balloons, trophies, records)?')){save={won:{},coins:{},boss:{},best:{},cups:{},driver:opt.picks[0],diff:opt.diff};writeSave(save);refreshMenu();}};
$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{$('pause').hidden=true;if(raceMode==='adventure')startHub(def.id);else toMenu();};$('retry2').onclick=()=>{$('pause').hidden=true;retry();};
function retry(){if(raceMode==='gp'&&gp){const g=gp;g.idx=0;startGP(g.cup,{diff:g.diff,cc:g.cc,humans:g.humans});return;}startRace(def.id,{mode:raceMode,humans:raceMode==='adventure'||raceMode==='tt'?1:opt.humans,coins:coinsOn,cc:raceMode==='adventure'?1:opt.cc});}
$('cont').onclick=()=>{document.body.classList.remove('podium');if(app==='podium'){toMenu();return;}if(raceMode==='adventure')startHub(def.id);else if(raceMode==='gp'&&gp)nextGP();else toMenu();};
$('again').onclick=()=>{document.body.classList.remove('podium');if(app==='podium'&&gp){startGP(gp.cup,{diff:gp.diff,cc:gp.cc,humans:gp.humans});return;}retry();};$('omenu').onclick=toMenu;
$('d-go').onclick=()=>enterDoor(nearDoor);
postButton($('post'),ID,()=>{const a=lastAward||{};
 return[a.pts||0,`Game: Critter Kart\nPoints: ${a.pts||0}\nTrack: ${a.track||''} (${a.veh||''})\nPlace: ${a.place?ORD(a.place):''}${a.time?' · '+fmtT(a.time):''}\nDriver: ${a.driver||''} · ${a.mode||''}${a.split?' split-screen':''} · ${a.cc||''} · CPU ${a.diff||''}`];});
addEventListener('keydown',e=>{if((app==='results'||app==='podium')&&!$('over').hidden&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();$('cont').click();}});

/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;if(app!=='paused'){acc+=dt;let n=0;while(acc>=DT&&n<4){step(DT);acc-=DT;n++;}if(n===4)acc=0;}frame(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.KART={get state(){return app==='race'?phase:app;},get app(){return app;},get phase(){return phase;},step,render,frame,
 start(o={}){const m=o.mode==='quick'?'vs':o.mode||'vs';if(m==='adventure'&&!o.track)return startHub(o.at);if(m==='gp'){opt.cc=o.cc??opt.cc;return startGP(o.cup??0,{humans:o.humans??1,picks:o.picks,diff:o.diff,cc:o.cc});}
  startRace(o.track||'driftwood',{mode:m,humans:o.humans??1,picks:o.picks,diff:o.diff,coins:o.coins,cc:o.cc});},
 startRace(id,o){startRace(id||'driftwood',o||{});},startHub,toMenu,startGP,nextRace:()=>{$('cont').click();},enterDoor:id=>enterDoor(doors.find(d=>d.t.id===id)),get doors(){return doors;},
 get racers(){return racers;},get karts(){return racers;},set humans(v){opt.humans=v;},get clock(){return clock;},setClock(s){clock=s;},set raceT(v){raceT=v;},get raceT(){return raceT;},
 skipIntro(){if(app==='race'){phase='go';cdT=0;env.frozen=false;$('banner').classList.remove('on');}},autopilot(on=true){autopilot=on;},
 forceFinish(order){/* order: array of racer indices, finishing in that order now */order.forEach((k,j)=>{const r=racers[k];if(!r.fin){r.fin=Math.max(.01,raceT-(order.length-j)*.05);r.lap=def.laps+1;finishOrder.push(r);r.finPlace=finishOrder.length;}});ranks();},
 warp(k,prog){const r=racers[k];const lap=Math.floor(prog),f=prog-lap;place(C,r,f*C.B.n,0);r.lap=lap;r.half=true;r.f=r.q.prog;r.prog=r.lap+r.f;r.v=25;},
 endNow(timeUp=false){endRace(timeUp);},get save(){return save;},resetSave(){save={won:{},coins:{},boss:{},best:{},cups:{},driver:0,diff:1};writeSave(save);},giveBalloons(n){for(let k=0;k<n;k++)save.won['x'+k]=1;writeSave(save);},
 get C(){return C;},get W(){return W;},get items(){return items;},get hazards(){return haz;},get gp(){return gp;},get ghost(){return ghost;},get award(){return lastAward;},get mode(){return raceMode;},get cc(){return curCC;},
 setQuality:applyQuality,scene,R,cam:()=>views[0]?views[0].cam:mainCam,keys,edge,TRACKS,CUPS,get coinsOn(){return coinsOn;},nearDoor:()=>nearDoor,opt};
