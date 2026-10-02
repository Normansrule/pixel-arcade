// KART GRAND PRIX — original full-3D kart racer for Pixel Arcade.
// Grand Prix (2 cups × 4 courses), VS race, Time Trial with ghost, Balloon Battle; 1–2 players split-screen.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {CHARS,CLASS,BODIES,WHEELS,GLIDERS,STATS,statsOf,CC,DIFF,POINTS,ITEMS,THEMES,COURSES,CUPS,ARENA} from './data.js';
import {buildCourse,query,at,F,SURF} from './trackmath.js';
import {buildWorld,updateWorld,arenaHeight} from './world.js';
import {makeRacer,poseRacer,droneMesh,ghostify} from './models.js';
import {newKart,stepKart,collideKarts,maxSpeed,KMH,DRIFT_LV,placeAtSafe} from './physics.js';
import {Items} from './items.js';
import {thinkRace,thinkBattle} from './ai.js';
import {Sound} from './sound.js';
import {V,cl,lerp,wrapA,Particles,Skids,icon,rng} from './util.js';

const $=id=>document.getElementById(id),rnd=(a=1)=>Math.random()*a;
const LAPS=3,BATTLE_TIME=180,ID='kartgp';
const ORD=n=>n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const mainCam=new THREE.PerspectiveCamera(55,1,.3,6000);
const sparks=new Particles(scene,3500,true),dust=new Particles(scene,2500,false),skids=new Skids(scene);
const snd=new Sound();const drone=droneMesh();drone.visible=false;scene.add(drone);

/* ================= options ================= */
let opt={mode:'gp',players:1,cc:1,diff:1,cup:0,track:0,picks:[{ch:3,body:0,wheels:0,glider:0},{ch:1,body:1,wheels:3,glider:1}]};
try{const s=JSON.parse(localStorage.getItem('pxd_kartgp_opt'));if(s)opt={...opt,...s,picks:[{...opt.picks[0],...(s.picks||[])[0]},{...opt.picks[1],...(s.picks||[])[1]}]};}catch(e){}
const saveOpt=()=>{try{localStorage.setItem('pxd_kartgp_opt',JSON.stringify(opt));}catch(e){}};

/* ================= state ================= */
let app='boot',phase='countdown',W=null,C=null,A=null,T=null,courseIdx=-1,karts=[],views=[],items=null,G=null;
let raceT=0,cdT=0,clock=0,limit=0,introT=0,endT=0,time=0,acc=0,gfx=quality(),finishOrder=[],rec=[],recT=0,replay=null,ghost=null,ghostRec=[],tvCams=[],lastLapSound=0;
let gp=null,roster=[],menuStep='mode',editP=0,lastAward=null,podium=null,flash=0,autopilot=[false,false],bannerT=0;
const DT=1/60;

/* ================= world loading ================= */
function themeOf(k){return{...THEMES[k],key:k};}
function loadCourse(idx){// idx -1 → arena
 if(W){scene.remove(W.grp);W.grp.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
 if(idx<0){T=themeOf('arena');A={R:ARENA.r,cols:[]};const rr=rng(5);for(let k=0;k<8;k++){const a=k/8*Math.PI*2+Math.PI/8,r=k%2?36:56;A.cols.push({x:Math.cos(a)*r,z:Math.sin(a)*r,r:2.4+rr()*1.2,h:7+rr()*4});}
  C={arena:true,R:A.R,cols:A.cols,def:{feats:[]}};}
 else{const def=COURSES[idx];T=themeOf(def.theme);C=buildCourse(def,T);A=null;}
 courseIdx=idx;W=buildWorld(R,C,T,{quality:gfx,seed:idx+3});scene.add(W.grp);scene.environment=W.env;scene.fog=W.fog;scene.background=null;
 if(!A)makeTvCams();R.shadowMap.needsUpdate=true;fxAll=null;fxSplit=[];return W;}
function makeTvCams(){tvCams=[];const B=C.main;for(let f=0;f<1;f+=.05){const i=Math.round(f*B.n)%B.n,s=(Math.round(f*20)%2)?1:-1,u=s*(B.w[i]+B.sh[i]+6);tvCams.push(new V(B.x[i]+B.nx[i]*u,B.y[i]+5+rnd(4),B.z[i]+B.nz[i]*u));}}

/* ================= roster ================= */
function hueShift(c,d){const col=new THREE.Color(c),h={};col.getHSL(h);col.setHSL((h.h+d)%1,Math.min(1,h.s*.9+.1),h.l);return col.getHex();}
function buildRoster(n){const hum=opt.players,used=[];roster=[];
 for(let h=0;h<hum;h++){const p=opt.picks[h];roster.push({id:h,human:h,ch:p.ch,parts:{body:p.body,wheels:p.wheels,glider:p.glider},paint:h===1&&opt.picks[1].ch===opt.picks[0].ch?hueShift(CHARS[p.ch].kart,.5):null,name:hum>1?`P${h+1} ${CHARS[p.ch].n}`:CHARS[p.ch].n});used.push(p.ch);}
 const pool=CHARS.map((c,i)=>i).filter(i=>!used.includes(i)).sort(()=>Math.random()-.5),r2=rng(Date.now()%9999);
 let alt=0;while(roster.length<n){let ch,paint=null,name;if(pool.length){ch=pool.shift();name=CHARS[ch].n;}else{ch=(alt*3+1)%8;paint=hueShift(CHARS[ch].kart,.33+alt*.17);name=CHARS[ch].n+' II';alt++;}
  roster.push({id:roster.length,human:-1,ch,parts:{body:(r2()*4)|0,wheels:(r2()*4)|0,glider:(r2()*3)|0},paint,name,skill:.985+r2()*.03});}}
function spawnKarts(){for(const k of karts){scene.remove(k.model);if(k.ghostM)scene.remove(k.ghostM);}karts=[];
 for(const r of roster){const ch=CHARS[r.ch];const k=newKart({id:r.id,human:r.human,name:r.name,spec:r,ch});k.stats_=statsOf(ch,r.parts.body,r.parts.wheels,r.parts.glider);k.model=makeRacer(ch,r.parts,r.paint);k.color='#'+new THREE.Color(r.paint??ch.kart).getHexString();scene.add(k.model);k.vp=new V();karts.push(k);}}

/* ================= race setup ================= */
function gridOrder(){// GP: reverse of standings (humans start at the back for race 1); VS: humans at the back
 if(opt.mode==='gp'&&gp&&gp.race>0)return karts.slice().sort((a,b)=>(gp.pts[a.id]-gp.pts[b.id])||(b.id-a.id));
 return karts.slice().sort((a,b)=>(b.human<0?1:0)-(a.human<0?1:0)||a.id-b.id).reverse().reverse();}
function placeGrid(){const B=C.main,order=opt.mode==='gp'&&gp&&gp.race>0?gridOrder().reverse():[...karts.filter(k=>k.human<0),...karts.filter(k=>k.human>=0)];
 order.forEach((k,n)=>{const row=n>>1,col=n%2,back=7+row*5.2+(col?2.4:0),f=1-back/B.len,i=Math.round(f*B.n)%B.n,u=(col?-1:1)*B.w[i]*.42;
  at(B,f,u,k.p);k.p.y+=.3;k.yaw=Math.atan2(B.tx[i],B.tz[i]);resetKart(k);k.prog=f-1;k.lastF=f;k.lap=0;});
 if(opt.mode==='tt'){const k=karts[0],f=1-8/B.len,i=Math.round(f*B.n)%B.n;at(B,f,0,k.p);k.p.y+=.3;k.yaw=Math.atan2(B.tx[i],B.tz[i]);k.prog=f-1;k.lastF=f;}}
function resetKart(k){k.vel.set(0,0,0);k.spd=0;k.ground=false;k.gyPrev=k.p.y;k.drift=0;k.driftT=0;k.driftLv=0;k.boost=0;k.aura=0;k.shrink=0;k.spin=0;k.tumble=0;k.invuln=0;k.coins=0;k.item=null;k.itemN=0;k.roulette=0;k.orbs=0;k.finished=null;k.glide=false;k.respawn=0;k.out=false;k.rsStart=null;k.stall=0;k.wrongT=0;k.lapTimes=[];k.lapStart=0;k.safe=null;k.balloons=3;k.pops=0;k.trick=0;k.trickWin=0;k.vp.copy(k.p);k.model.visible=true;k.model.scale.setScalar(1);k.dnf=false;
 k.stats={items:0,hits:0,falls:0,mt:0,tricks:0};k.model.userData.celebrate=0;}
function placeArena(){karts.forEach((k,n)=>{const a=n/karts.length*Math.PI*2,r=A.R-14;k.p.set(Math.cos(a)*r,arenaHeight(Math.cos(a)*r,Math.sin(a)*r,A.R)+.3,Math.sin(a)*r);k.yaw=Math.atan2(-k.p.x,-k.p.z);resetKart(k);k.balloons=3;k.safe={x:k.p.x,z:k.p.z,yaw:k.yaw};});}

function startEvent(o={}){Object.assign(opt,o);saveOpt();snd.init();
 const n=opt.mode==='tt'?1:opt.mode==='battle'?8:12;if(opt.mode==='tt')opt.players=1;buildRoster(n);spawnKarts();
 gp=opt.mode==='gp'?{cup:opt.cup,race:0,pts:Object.fromEntries(karts.map(k=>[k.id,0])),last:{}}:null;
 startRace();}
function startRace(){showLoading(true);if(podium)scene.remove(podium);
 setTimeout(()=>{const idx=opt.mode==='battle'?-1:opt.mode==='gp'?CUPS[gp.cup].tracks[gp.race]:opt.track;if(idx!==courseIdx||!W)loadCourse(idx);
  items&&items.clear();items=new Items(scene,null);G=makeG();items.G=G;
  if(A)placeArena();else placeGrid();karts.forEach(k=>{k.model.visible=true;});
  // time trial: three turbo peppers, no item boxes, ghost
  if(opt.mode==='tt'){karts[0].item='pepper3';karts[0].itemN=3;W.boxes.forEach(b=>b.t=1e9);loadGhost();}
  setupViews();sparks.clear();dust.clear();skids.clear();rec=[];recT=0;replay=null;ghostRec=[];finishOrder=[];raceT=0;endT=0;
  limit=A?BATTLE_TIME:Math.round(LAPS*C.len/(CC[opt.cc].v*.58)+40);clock=limit;phase='countdown';cdT=3.2;app='intro';introT=0;lastBeep=4;
  $('menu').hidden=true;$('keys').hidden=true;$('results').hidden=true;$('pause').hidden=true;$('hud').hidden=false;$('podium').hidden=true;document.body.classList.add('playing');
  showCard();showLoading(false);snd.stopMusic();snd.play('whoosh');},30);}
function makeG(){const D=DIFF[opt.diff];return{C:A?null:C,A,W,cc:CC[opt.cc],diff:D,D2:DIFF[2],diffI:opt.diff,karts,items,fall:!!T.fall,ev,frozen:false,get time(){return raceT;}};}
let lastBeep=4;

/* ================= input ================= */
const keys={},edge={};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)&&app!=='menu')e.preventDefault();
 if(e.code==='Space'&&app==='menu'&&document.activeElement===document.body)e.preventDefault();
 if(e.code==='Escape'){if(app==='race'||app==='intro')pause(true);else if(app==='paused')pause(false);else if(app==='menu')menuBack();}
 if(e.code==='KeyM'){snd.music=!snd.music;if(!snd.music)snd.stopMusic();else if(app==='race')snd.startMusic(T.music);}});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const KB=[{f:['KeyW'],b:['KeyS'],l:['KeyA'],r:['KeyD'],d:['Space','ShiftLeft'],i:['KeyE','KeyF','ControlLeft'],lk:['KeyQ','KeyC']},
 {f:['ArrowUp'],b:['ArrowDown'],l:['ArrowLeft'],r:['ArrowRight'],d:['ShiftRight','Slash','Numpad0'],i:['Enter','Period','NumpadEnter'],lk:['Comma','Numpad1']}];
const anyK=a=>a.some(k=>keys[k]);const padPrev=[{},{}],latch=[{},{}];
addEventListener('keydown',e=>{if(e.repeat)return;KB.forEach((m,i)=>{if(m.i.includes(e.code))latch[i].i=1;if(m.d.includes(e.code))latch[i].d=1;});});
function gpad(i){const l=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];return opt.players===2?l[i]:i===0?l[0]:null;}
function readHuman(k){const c=k.ctrl,i=k.human,solo=opt.players===1;const maps=solo?[KB[0],KB[1]]:[KB[i]];const on=n=>maps.some(m=>anyK(m[n]));
 c.thr=on('f')?1:0;c.brake=on('b')?1:0;c.steer=(on('l')?1:0)-(on('r')?1:0);c.drift=on('d');c.itemBtn=on('i');c.back=on('b');c.look=on('lk');
 const g=gpad(i);if(g){const ax=g.axes,bt=g.buttons,dz=v=>Math.abs(v)>.18?v:0,sx=dz(ax[0]||0),rt=bt[7]?.value||0,lt=bt[6]?.value||0;
  if(sx)c.steer=-sx;if(bt[0]?.pressed||rt>.1)c.thr=Math.max(c.thr,bt[0]?.pressed?1:rt);if(bt[1]?.pressed||lt>.3){c.brake=1;c.back=true;}if(dz(ax[1]||0)>.6)c.back=true;
  if(bt[5]?.pressed||bt[2]?.pressed)c.drift=true;if(bt[4]?.pressed)c.itemBtn=true;if(bt[3]?.pressed)c.look=true;
  const pr=padPrev[i];if(bt[9]?.pressed&&!pr.st)pause(app!=='paused');if(bt[0]?.pressed&&!pr.a)edge.PadA=true;pr.st=bt[9]?.pressed;pr.a=bt[0]?.pressed;}
 const L=solo?[latch[0],latch[1]]:[latch[i]];if(L.some(l=>l.i))c.itemBtn=true;if(L.some(l=>l.d)&&!k.pDrift)c.drift=true;L.forEach(l=>{l.i=0;l.d=0;});
 c.item=c.itemBtn;}
function pause(on){if(on&&(app==='race'||app==='intro')){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');snd.silence();}else if(!on&&app==='paused'){app=phase==='intro'?'intro':'race';$('pause').hidden=true;document.body.classList.add('playing');}}

/* ================= events → sound, particles, HUD ================= */
const BOOSTC=[null,[.3,.7,3],[3,1.3,.2],[2,.5,3],[2.8,1.2,.25],[1.8,2.6,.8]];
const tv=new V(),tv2=new V();
function viewOf(k){return views.find(v=>v.k===k);}
function msg(k,t,cls='',dur=1.2){const v=viewOf(k);if(!v)return;v.msgEl.textContent=t;v.msgEl.className='msg on '+cls;v.msgT=dur;}
function ev(type,a,b,c){const hum=a&&a.human>=0;
 switch(type){
  case'hop':if(hum)snd.play('hop');break;
  case'trick':if(hum)snd.play('trick');a.trickKind=Math.random()<.5?0:1;break;
  case'trickboost':if(hum){snd.play('boost');msg(a,'TRICK!','good',.8);}sparks.burst(tv.copy(a.p).setY(a.p.y+.5),24,8,new THREE.Color(1.8,2.6,.8),.5,.5,{up:true});break;
  case'mt':if(hum){snd.play('mt',b);msg(a,['','MINI-TURBO','SUPER TURBO','ULTRA TURBO'][b],'lv'+b,.9);}{const col=BOOSTC[b];sparks.burst(tv.copy(a.p).setY(a.p.y+.4),14+b*6,9,new THREE.Color(...col),.3,.4,{grav:6});}break;
  case'driftlv':if(hum)snd.play('lv',b);break;
  case'pad':if(hum)snd.play('pad');break;
  case'spring':if(hum)snd.play('spring');sparks.burst(tv.copy(a.p),30,8,new THREE.Color(.4,1.4,3),.6,.5,{up:true});break;
  case'glide':if(hum){snd.play('whoosh');msg(a,'GLIDE!','good',1);}break;
  case'land':if(hum)snd.play('land',b);if(b>6){const col=landCol(a);for(let n=0;n<10;n++)dust.emit(a.p.x+rnd(2)-1,a.p.y+.2,a.p.z+rnd(2)-1,rnd(6)-3,rnd(2),rnd(6)-3,col.r,col.g,col.b,1.4,.8,0,2,2);}break;
  case'wall':if(hum)snd.play('wall',b);sparks.burst(tv.copy(a.p).setY(a.p.y+.5),Math.min(30,b*2|0),8,new THREE.Color(2.6,2,1),.3,.35,{grav:20});{const v=viewOf(a);if(v)v.shake=Math.max(v.shake,Math.min(.4,b*.02));}break;
  case'bump':{if(c>5){if(a.human>=0||b.human>=0)snd.play('bump');sparks.burst(tv.addVectors(a.p,b.p).multiplyScalar(.5).setY(a.p.y+.7),12,9,new THREE.Color(2.6,2,1.2),.35,.35,{grav:18});}
   for(const[x,y]of[[a,b],[b,a]]){if(x.aura>0&&y.aura<=0){if(items.tumble(y,x)&&A)battleHit(y,x);}else if(x.shrink<=0&&y.shrink>0&&y.squish<=0&&y.invuln<=0){y.squish=2;items.spin(y,.8,x);if(A)battleHit(y,x);}
    else if(A&&x.boost>0&&x.boostPow>=1.45&&y.invuln<=0&&y.aura<=0&&y.balloons>0&&x.balloons>0){y.invuln=1.5;y.balloons--;x.balloons=Math.min(5,x.balloons+1);x.pops++;snd.play('balloon');feed(`${x.name} STOLE A BALLOON FROM ${y.name}`);if(y.balloons<=0)eliminate(y,x);}}
   const v=viewOf(a)||viewOf(b);if(v&&c>5)v.shake=Math.max(v.shake,.25);break;}
  case'box':if(hum)snd.play('box');sparks.burst(b,26,10,[new THREE.Color(2.4,1.2,2.6),new THREE.Color(.6,2.2,2.6),new THREE.Color(2.6,2.2,.6)],.5,.6,{grav:4});break;
  case'coin':if(hum)snd.play('coin');sparks.burst(tv.copy(b).setY(b.y+.6),10,5,new THREE.Color(2.8,2,.4),.4,.4,{up:true});break;
  case'gotitem':if(hum)snd.play('got');break;
  case'throw':if(hum||nearHuman(a.p,40))snd.play('throw');break;
  case'pepper':if(hum||nearHuman(a.p,30))snd.play('boost');break;
  case'aura':if(hum)snd.play('aura');break;
  case'bolt':snd.play('bolt');flash=1;feed(`${a.name} USED THE SHRINK BOLT`);for(const o of karts)if(o!==a&&o.human>=0&&o.aura<=0)msg(o,'SHRUNK!','bad',1.4);break;
  case'hit':{const k=a;k.stats.hits++;if(k.human>=0){snd.play('hit');const v=viewOf(k);if(v)v.shake=.6;msg(k,c==='tumble'?'OUCH!':'SPIN OUT!','bad',1);}else if(nearHuman(k.p,30))snd.play('hit');
   sparks.burst(tv.copy(k.p).setY(k.p.y+1),40,12,[new THREE.Color(3,2.4,.6),new THREE.Color(3,3,3)],.5,.5,{grav:10});for(let n=0;n<Math.min(3,k.coins+2);n++)sparks.emit(k.p.x,k.p.y+1,k.p.z,rnd(10)-5,8+rnd(4),rnd(10)-5,2.8,2,.3,.9,1,20,.5);
   if(b&&b!==k&&b.human>=0)msg(b,'HIT!','good',.8);if(A)battleHit(k,b);break;}
  case'boom':{const p=a;snd.play('boom');sparks.burst(p,160,26,[new THREE.Color(3,1.6,.3),new THREE.Color(3,2.6,1.2),new THREE.Color(2.4,.6,.1)],1.2,.9,{grav:4,drag:2});for(let n=0;n<40;n++)dust.emit(p.x+rnd(4)-2,p.y+rnd(2),p.z+rnd(4)-2,rnd(8)-4,4+rnd(6),rnd(8)-4,.2,.18,.18,3,1.8,-1,1.2,2);views.forEach(v=>{const d=v.k.p.distanceTo(p);if(d<40)v.shake=Math.max(v.shake,.9*(1-d/40));});break;}
  case'pop':snd.play('pop');sparks.burst(a,20,8,new THREE.Color(2.6,2.6,2.6),.35,.35,{});break;
  case'block':if(a.human>=0)snd.play('pop');sparks.burst(b,24,8,new THREE.Color(.4,3,1.4),.4,.4,{});break;
  case'bounce':break;
  case'fall':if(hum){snd.play('fall');msg(a,'','',0);}break;
  case'respawn':if(hum)snd.play('drone');break;}}
function nearHuman(p,r){return views.some(v=>v.k.p.distanceToSquared(p)<r*r);}
const _lc=new THREE.Color();function landCol(k){const s=k.surf;if(s===SURF.sand)return{r:.9,g:.8,b:.55};if(s===SURF.mud)return{r:.35,g:.25,b:.15};if(T.key==='snow')return{r:.95,g:.97,b:1};_lc.set(T.ground).multiplyScalar(T.night?.6:1.05);return{r:_lc.r,g:_lc.g,b:_lc.b};}
function battleHit(k,by){if(!A||k.out)return;k.balloons=Math.max(0,k.balloons-1);snd.play('balloon');sparks.burst(tv.copy(k.p).setY(k.p.y+2.6),30,8,new THREE.Color(...[2.6,.6,1.4]),.5,.4,{});
 if(by&&by!==k){by.pops++;feed(`${by.name} POPPED ${k.name}`);}if(k.balloons<=0)eliminate(k,by);}
function eliminate(k,by){k.out=true;k.outT=raceT;k.spd=0;k.vel.set(0,0,0);feed(`${k.name} IS OUT!`);if(k.human>=0)msg(k,'OUT OF BALLOONS','bad',3);}

/* ================= views + HUD ================= */
function setupViews(){const host=$('views');host.innerHTML='';views=[];const hum=karts.filter(k=>k.human>=0).sort((a,b)=>a.human-b.human),split=hum.length>1;
 hum.forEach((k,i)=>{const el=document.createElement('div');el.className='pv'+(split?' split':'');el.style.top=split?(i*50)+'%':'0';el.style.height=split?'50%':'100%';
  el.innerHTML=`<div class="uw"></div><div class="place"><b>1</b><i>st</i></div><div class="lap"></div><div class="slot"><img alt=""><span class="n"></span></div><div class="coins"><img src="${icon('coin',48)}" alt=""><b>0</b></div>
   <div class="spd"><b>0</b><i>KM/H</i><div class="drift"><span></span></div></div><canvas class="mini" width="170" height="170"></canvas><div class="cd"></div><div class="msg"></div><div class="wrong">WRONG WAY</div>
   <div class="ttbox"></div><div class="bal"></div>${split?`<div class="tag" style="color:${k.color}">P${i+1}</div>`:''}`;
  host.appendChild(el);const cam=new THREE.PerspectiveCamera(70,1,.3,6000);
  views.push({k,cam,el,pos:new V(),look:new V(),fov:70,snap:true,shake:0,msgT:0,placeEl:el.querySelector('.place b'),placeSf:el.querySelector('.place i'),lapEl:el.querySelector('.lap'),slot:el.querySelector('.slot'),slotImg:el.querySelector('.slot img'),slotN:el.querySelector('.slot .n'),coinEl:el.querySelector('.coins b'),spdEl:el.querySelector('.spd b'),driftEl:el.querySelector('.drift span'),
   mini:el.querySelector('.mini'),cdEl:el.querySelector('.cd'),msgEl:el.querySelector('.msg'),wrongEl:el.querySelector('.wrong'),ttEl:el.querySelector('.ttbox'),uwEl:el.querySelector('.uw'),balEl:el.querySelector('.bal'),last:{},rollT:0});});
 $('ranks').hidden=split||opt.mode==='tt';$('clock').hidden=false;drawMiniBase();}
let miniBase=null,miniXf=null;
function drawMiniBase(){const c=document.createElement('canvas');c.width=c.height=340;const x=c.getContext('2d');let x0,x1,z0,z1;
 if(A){x0=z0=-A.R-6;x1=z1=A.R+6;}else{[x0,z0,x1,z1]=C.bbox;}const s=300/Math.max(x1-x0,z1-z0),ox=170-(x0+x1)/2*s,oz=170-(z0+z1)/2*s;miniXf={s,ox,oz};const P=(x,z)=>[ox+x*s,oz+z*s];
 x.lineCap=x.lineJoin='round';
 if(A){x.fillStyle='rgba(255,255,255,.12)';x.beginPath();x.arc(170,170,A.R*s,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.6)';x.lineWidth=3;x.stroke();x.fillStyle='rgba(255,255,255,.5)';for(const p of A.cols){const[a,b]=P(p.x,p.z);x.beginPath();x.arc(a,b,p.r*s,0,7);x.fill();}}
 else{for(const pass of[0,1])for(const B of C.branches){x.strokeStyle=pass?(B.kind==='cut'?'rgba(255,190,90,.75)':'rgba(255,255,255,.92)'):'rgba(0,0,0,.55)';x.lineWidth=(B.kind==='cut'?5:9)+(pass?0:5);x.beginPath();for(let i=0;i<=B.n-(B.closed?0:1);i++){const k=i%B.n;if(B.flag[k]&F.gap){x.stroke();x.beginPath();continue;}const[a,b]=P(B.x[k],B.z[k]);i?x.lineTo(a,b):x.moveTo(a,b);}x.stroke();}
  const B=C.main,[a,b]=P(B.x[0],B.z[0]);x.fillStyle='#fff';x.save();x.translate(a,b);x.rotate(Math.atan2(B.tz[0],B.tx[0]));x.fillRect(-2,-9,4,18);x.restore();
  for(const ft of C.def.feats){if(ft.t==='gap'){const i=Math.round(ft.s*B.n)%B.n,j=(i+Math.round(ft.len/B.step))%B.n;const[a1,b1]=P(B.x[i],B.z[i]),[a2,b2]=P(B.x[j],B.z[j]);x.strokeStyle='rgba(120,220,255,.9)';x.setLineDash([4,5]);x.lineWidth=3;x.beginPath();x.moveTo(a1,b1);x.lineTo(a2,b2);x.stroke();x.setLineDash([]);}}}
 miniBase=c;}
function drawMini(v){const x=v.mini.getContext('2d'),w=v.mini.width;x.clearRect(0,0,w,w);if(!miniBase)return;x.drawImage(miniBase,0,0,w,w);const s=w/340,{s:ms,ox,oz}=miniXf;
 const order=karts.slice().sort((a,b)=>(a.human>=0)-(b.human>=0));
 for(const k of order){if(k.out)continue;const px=(ox+k.p.x*ms)*s,pz=(oz+k.p.z*ms)*s,me=k===v.k;x.fillStyle=k.color;x.strokeStyle=k.human>=0?'#fff':'rgba(0,0,0,.7)';x.lineWidth=k.human>=0?2.4:1.4;x.beginPath();x.arc(px,pz,me?6:k.human>=0?5:3.6,0,7);x.fill();x.stroke();
  if(me){x.fillStyle='#fff';x.beginPath();const a=k.yaw;x.moveTo(px+Math.sin(a)*11,pz+Math.cos(a)*11);x.lineTo(px+Math.sin(a+2.5)*6,pz+Math.cos(a+2.5)*6);x.lineTo(px+Math.sin(a-2.5)*6,pz+Math.cos(a-2.5)*6);x.fill();}}
 if(ghost&&ghost.m.visible){const p=ghost.m.position;x.fillStyle='rgba(140,220,255,.8)';x.beginPath();x.arc((ox+p.x*ms)*s,(oz+p.z*ms)*s,4,0,7);x.fill();}
 for(const p of items.list){if(p.type!=='seeker'&&p.type!=='bomb')continue;x.fillStyle=p.type==='seeker'?'#ff3a3a':'#222';x.beginPath();x.arc((ox+p.p.x*ms)*s,(oz+p.p.z*ms)*s,3,0,7);x.fill();}}
const fmt=t=>{t=Math.max(0,t);const m=t/60|0,s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(2);};
const fmtC=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
function setT(el,v,o,k){if(o[k]!==v){o[k]=v;el.textContent=v;}}
function hud(dt){if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('card').classList.remove('on');}
 flash=Math.max(0,flash-dt*2);$('flash').style.opacity=flash*.7;
 $('hud').classList.toggle('intro',app==='intro');
 if(app!=='race'&&app!=='paused'&&app!=='intro')return;
 const cl2=$('clock'),el=A?fmtC(clock):fmt(phase==='countdown'?0:raceT).slice(0,-1),lim=A?'TIME LEFT':clock<=60?'LIMIT '+fmtC(clock):'TIME';if(hudC.clk!==el+lim){hudC.clk=el+lim;cl2.innerHTML=`<small>${lim}</small>${el}`;}cl2.classList.toggle('low',clock<=(A?30:60)&&phase==='race');
 for(const v of views){const k=v.k,o=v.last;
  if(A){setT(v.placeEl,k.place,o,'pl');setT(v.placeSf,ORD(k.place).slice(-2),o,'sf');setT(v.lapEl,`POPS ${k.pops} · ${karts.filter(x=>!x.out).length} LEFT`,o,'lap');if(o.bal!==k.balloons){o.bal=k.balloons;v.balEl.innerHTML=k.out?'<b>OUT</b>':('<img src="'+icon('balloon',40)+'">').repeat(k.balloons);}}
  else{v.placeEl.parentNode.style.visibility=opt.mode==='tt'?'hidden':'';setT(v.placeEl,k.place,o,'pl');setT(v.placeSf,ORD(k.place).slice(-2),o,'sf');v.placeEl.parentNode.style.color=k.place===1?'#ffd23a':k.place<=3?'#fff':'#bfc4d0';setT(v.lapEl,opt.mode==='tt'?`LAP ${Math.min(LAPS,k.lap||1)}/${LAPS}`:`LAP ${Math.min(LAPS,Math.max(1,k.lap||1))}/${LAPS}`,o,'lap');}
  // item slot / roulette
  let im=null,n='';if(k.roulette>0){v.rollT-=dt;if(v.rollT<=0){v.rollT=.07;v.rollI=((v.rollI||0)+1)%8;snd.play('roll');}im=['coin','peel','orb','seeker','bomb','pepper','bolt','aura'][v.rollI||0];}else if(k.orbs>0){im='orb';n=k.orbs>1?'×'+k.orbs:'';}else if(k.item){im=k.item;n=k.itemN>1?'×'+k.itemN:'';}
  if(o.im!==im){o.im=im;v.slotImg.src=im?icon(im,96):'';v.slotImg.style.visibility=im?'visible':'hidden';v.slot.classList.toggle('rolling',k.roulette>0);}setT(v.slotN,n,o,'n');v.slot.classList.toggle('rolling',k.roulette>0);
  setT(v.coinEl,k.coins,o,'c');setT(v.spdEl,Math.round(Math.abs(k.spd)*KMH),o,'s');
  const dl=k.drift?k.driftLv:0,dp=k.drift?Math.min(1,k.driftT/DRIFT_LV[2]):0;v.driftEl.style.width=(dp*100).toFixed(0)+'%';v.driftEl.className='lv'+dl;
  // countdown
  let cd='';if(phase==='countdown'&&app==='race')cd=cdT>2?'3':cdT>1?'2':cdT>0?'1':'';else if(phase==='race'&&raceT<1)cd='GO!';setT(v.cdEl,cd,o,'cd');v.cdEl.className='cd'+(cd?' on':'')+(cd==='GO!'?' go':'');
  if(v.msgT>0){v.msgT-=dt;if(v.msgT<=0)v.msgEl.className='msg';}
  v.wrongEl.classList.toggle('on',k.wrongT>1.2&&!k.finished);
  const uw=W&&W.waterY!==undefined&&v.cam.position.y<W.waterY;if(o.uw!==uw){o.uw=uw;v.uwEl.classList.toggle('on',uw);}
  if(opt.mode==='tt')v.ttEl.innerHTML=(k.lapTimes||[]).map((t,i)=>`<div>LAP ${i+1} <b>${fmt(t)}</b></div>`).join('')+`<div class="cur">TIME <b>${fmt(k.finished??(phase==='race'?raceT:0))}</b></div>`+(ghost?`<div class="gh">GHOST <b>${fmt(ghost.t)}</b></div>`:'<div class="gh">NO GHOST YET</div>');
  if((v.miniT=(v.miniT||0)-dt)<=0){v.miniT=1/20;drawMini(v);}}
 if(!$('ranks').hidden&&(hudC.rk=(hudC.rk||0)-dt)<=0){hudC.rk=.25;const list=A?karts.slice().sort((a,b)=>(b.balloons-a.balloons)||(b.pops-a.pops)):karts.slice().sort((a,b)=>a.place-b.place);
  $('ranks').innerHTML=list.map((k,i)=>`<div class="${k.human>=0?'me':''}${k.out?' out':''}"><i style="background:${k.color}"></i><b>${A?k.balloons:i+1}</b>${k.name}${A?'':k.finished?' ✓':''}</div>`).join('');}}
const hudC={};
function showCard(){const c=$('card');let t,s;if(A){t=ARENA.n;s='BALLOON BATTLE · 3 MINUTES';}else{const d=COURSES[courseIdx];t=d.n;s=opt.mode==='gp'?`${CUPS[gp.cup].n} · RACE ${gp.race+1} OF 4`:opt.mode==='tt'?'TIME TRIAL':'VS RACE';s+=` · ${CC[opt.cc].n}`;}
 $('ct').textContent=t;$('cs').textContent=s;c.classList.add('on');bannerT=5.5;$('skip').hidden=false;}
function feed(t){const d=document.createElement('div');d.textContent=t;$('feed').prepend(d);setTimeout(()=>d.remove(),3800);while($('feed').children.length>4)$('feed').lastChild.remove();}
function showLoading(on){$('loading').hidden=!on;}

/* ================= simulation ================= */
function fixed(dt){
 const racing=phase==='race';G.frozen=!racing;
 for(const k of karts){if(k.human>=0&&!autopilot[k.human]&&!k.finished)readHuman(k);else if(!k.out){if(A)thinkBattle(k,G,dt);else thinkRace(k,G,dt);}
  if(phase==='countdown'){if(k.ctrl.thr>0){if(k.rsStart==null)k.rsStart=cdT;}else k.rsStart=null;}}
 if(phase==='countdown'){for(const k of karts){k.revv=(k.revv||0)+((k.ctrl.thr>0?1:0)-(k.revv||0))*Math.min(1,dt*5);}return;}
 // rubber band
 if(!A&&opt.mode!=='tt'){const lead=Math.max(...karts.filter(k=>k.human>=0).map(k=>k.prog));for(const k of karts){if(k.human>=0&&!autopilot[k.human]&&!k.finished)continue;const gap=(lead-k.prog)*C.len,D=G.diff;k.rb=G.cc.ai*D.skill*(k.spec.skill||1)*(1+cl(gap/70,-1,1)*(gap>0?D.rubber:D.rubber*1.05));if(k.finished)k.rb=.85;}}
 for(const k of karts){if(k.stall>0){k.stall-=dt;k.ctrl.thr=0;}
  // item edge
  const ip=k.ctrl.item&&!k.pItem;k.pItem=k.ctrl.item;if(ip&&racing&&!k.finished)items.use(k,k.ctrl.back);
  stepKart(k,G,dt);items.pickups(k,dt);}
 for(let i=0;i<karts.length;i++)for(let j=i+1;j<karts.length;j++)collideKarts(karts[i],karts[j],ev);
 // hazards
 for(const h of W.haz){if(!h.active)continue;for(const k of karts){if(k.respawn>0||k.out)continue;const dx=k.p.x-h.p.x,dz=k.p.z-h.p.z,dy=k.p.y-h.p.y;if(dx*dx+dz*dz<(h.r+1.1)**2&&Math.abs(dy)<h.r+2){if(k.aura>0)continue;if(h.launch)items.tumble(k,null);else items.spin(k,1,null);}}}
 items.update(dt);
 // progress, laps, places
 if(!A){for(const k of karts){const q=k.q;if(!q.ok||!q.B||k.respawn>0)continue;let f=((q.prog%1)+1)%1,d=f-k.lastF;if(d>.5)d-=1;if(d<-.5)d+=1;if(Math.abs(d)<.2)k.prog+=d;k.lastF=f;
   const lap=Math.floor(k.prog)+1;if(lap!==k.lap){if(lap>k.lap&&k.lap>=1&&k.human>=0&&!k.finished){k.lapTimes.push(raceT-k.lapStart);k.lapStart=raceT;if(lap<=LAPS){msg(k,lap===LAPS?'FINAL LAP':'LAP '+lap,lap===LAPS?'final':'',1.6);snd.play(lap===LAPS?'final':'lap');if(lap===LAPS&&opt.players===1){snd.startMusic(T.music,true);}}}
    else if(lap>k.lap&&k.lap>=1&&!k.finished){k.lapTimes.push(raceT-k.lapStart);k.lapStart=raceT;}k.lap=lap;}
   if(!k.finished&&k.prog>=LAPS){k.finished=raceT;finishOrder.push(k);if(k.human>=0){snd.play('finish');msg(k,ORD(finishOrder.length).toUpperCase()+'!',finishOrder.length===1?'final':'good',3);k.model.userData.celebrate=1;}else k.model.userData.celebrate=1;}
   // wrong way
   const dot=Math.sin(k.yaw)*q.tx+Math.cos(k.yaw)*q.tz;k.wrongT=dot<-.3&&k.spd>4?(k.wrongT||0)+dt:0;}
  const ord=karts.slice().sort((a,b)=>(a.finished!=null&&b.finished!=null)?a.finished-b.finished:(a.finished!=null?-1:b.finished!=null?1:b.prog-a.prog));ord.forEach((k,i)=>k.place=i+1);}
 else{const ord=karts.slice().sort((a,b)=>(b.balloons-a.balloons)||(b.pops-a.pops));ord.forEach((k,i)=>k.place=i+1);}
 // record (replay + ghost)
 recT+=dt;if(recT>=.05){recT-=.05;rec.push(karts.map(k=>[k.p.x,k.p.y,k.p.z,k.yaw+(k.drift?k.drift*.3:0),k.steerV,k.boost>0?(k.boostCol||1):0,k.glide?1:0,k.aura>0?1:0,k.respawn>0||k.out?0:1,k.spd,k.drift?k.driftLv:-1]));if(rec.length>20*60*6)rec.shift();
  if(opt.mode==='tt'&&!karts[0].finished){const k=karts[0];ghostRec.push(+k.p.x.toFixed(2),+k.p.y.toFixed(2),+k.p.z.toFixed(2),+(k.yaw+(k.drift?k.drift*.3:0)).toFixed(3));}}}

function step(dt){dt=Math.min(dt,.1);time+=dt;
 const skip=edge.Enter||edge.Space||edge.PadA||edge.click;for(const k in edge)delete edge[k];
 if(app==='menu'||app==='boot'){menuVis(dt);visuals(dt);return;}
 if(app==='paused'){visuals(0);return;}
 if(app==='results'||app==='podium'){if(app==='podium')podiumStep(dt);else replayStep(dt);visuals(dt);return;}
 if(app==='intro'){introT+=dt;if(introT>6.2||(skip&&introT>.4)){app='race';$('skip').hidden=true;$('card').classList.remove('on');bannerT=0;snd.play('uigo');if(snd.music)snd.startMusic(T.music);}visuals(dt);return;}
 // race
 if(phase==='countdown'){const pc=cdT;cdT-=dt;const n=Math.ceil(cdT);if(n!==lastBeep&&n>0&&n<=3){lastBeep=n;snd.play('beep',0);}
  if(W.lamps)W.lamps.forEach((l,i)=>l.material.color.set(cdT<=0?0x20ff60:(3-cdT)>i+.001?0xff2020:0x220808).multiplyScalar(cdT<=0||(3-cdT)>i?3:1));
  if(cdT<=0){phase='race';raceT=0;snd.play('beep',1);
   for(const k of karts){const rs=k.human>=0?k.rsStart:(Math.random()<[.25,.55,.8][opt.diff]?1.2:k.rsStart);
    if(rs!=null&&rs<=1.6&&rs>=.85){k.boost=1.5;k.boostPow=1.45;k.boostCol=4;if(k.human>=0){msg(k,'ROCKET START!','good',1.4);snd.play('rocket');}}
    else if(rs!=null&&rs>2.15){k.stall=1;if(k.human>=0){msg(k,'ENGINE STALL','bad',1.2);snd.play('stall');}}}}}
 else if(phase==='race'){raceT+=dt;clock-=dt;
  if(A){const alive=karts.filter(k=>!k.out),hum=karts.filter(k=>k.human>=0&&!k.out);if(clock<=0||alive.length<=1||(!hum.length&&endT===0)){clock=Math.max(0,clock);phase='done';endT=0;}}
  else{const hum=karts.filter(k=>k.human>=0);if(hum.every(k=>k.finished!=null)&&!hum.some(k=>autopilot[k.human]&&false)){phase='done';endT=0;}
   if(clock<=0){clock=0;phase='done';endT=0;for(const k of karts)if(k.finished==null)k.dnf=true;feed('TIME LIMIT — UNFINISHED RACERS DNF');}}}
 else if(phase==='done'){raceT+=dt;endT+=dt;if(endT>3.2){finishRace();return;}}
 acc+=dt;let n=0;while(acc>=DT&&n<8){fixed(DT);acc-=DT;n++;}if(n>=8)acc=0;
 visuals(dt);}

/* ================= race end, points, results ================= */
function finishRace(){snd.stopMusic();
 if(!A){// estimate finishing times for those still racing (unless the clock ran out)
  const rest=karts.filter(k=>k.finished==null&&!k.dnf).sort((a,b)=>b.prog-a.prog);const base=Math.max(raceT,...finishOrder.map(k=>k.finished));
  rest.forEach((k,i)=>{const left=(LAPS-k.prog)*C.len,v=Math.max(12,G.cc.v*.8);k.finished=Math.max(base+.3*(i+1),raceT+left/v);});
  const ord=karts.slice().sort((a,b)=>(a.dnf-b.dnf)||((a.finished??1e9)-(b.finished??1e9))||(b.prog-a.prog));ord.forEach((k,i)=>k.place=i+1);
  if(gp){for(const k of karts){const p=k.dnf?0:POINTS[k.place-1]||0;gp.last[k.id]=p;gp.pts[k.id]+=p;}gp.race++;}}
 else{const ord=karts.slice().sort((a,b)=>(b.balloons-a.balloons)||((b.outT??1e9)-(a.outT??1e9))||(b.pops-a.pops));ord.forEach((k,i)=>k.place=i+1);}
 // ghost save
 if(opt.mode==='tt'){const k=karts[0];if(k.finished!=null&&!k.dnf)saveGhost(k.finished);}
 showResults();}
function showResults(){app='results';$('hud').hidden=true;document.body.classList.remove('playing');snd.silence();
 replay={t:0,cut:0,cam:0,camT:0};
 const me=karts.find(k=>k.human===0),list=karts.slice().sort((a,b)=>a.place-b.place);let html='',title='',eye='';
 if(A){eye=`${ARENA.n} · BALLOON BATTLE`;const win=list[0];title=opt.players>1?(win.human>=0?`P${win.human+1} WINS`:win.name+' WINS'):me.place===1?'VICTORY':me.out?'POPPED':ORD(me.place).toUpperCase();
  html='<tr><th>#</th><th>DRIVER</th><th>BALLOONS</th><th>POPS</th></tr>'+list.map(k=>`<tr class="${k.human>=0?'me':''}"><td>${k.place}</td><td><i style="background:${k.color}"></i>${k.name}</td><td>${k.balloons}</td><td>${k.pops}</td></tr>`).join('');}
 else{const d=COURSES[courseIdx];eye=`${d.n} · ${opt.mode==='gp'?CUPS[gp.cup].n+' RACE '+gp.race+'/4':opt.mode==='tt'?'TIME TRIAL':'VS RACE'} · ${CC[opt.cc].n}`;const p2=karts.find(k=>k.human===1);title=me.dnf?'DNF':opt.mode==='tt'?fmt(me.finished):p2?`P1 ${ORD(me.place).toUpperCase()} · P2 ${p2.dnf?'DNF':ORD(p2.place).toUpperCase()}`:ORD(me.place).toUpperCase()+' PLACE';
  html=`<tr><th>#</th><th>DRIVER</th><th>TIME</th>${gp?'<th>PTS</th><th>TOTAL</th>':''}</tr>`+list.map(k=>`<tr class="${k.human>=0?'me':''}"><td>${k.dnf?'—':k.place}</td><td><i style="background:${k.color}"></i>${k.name}</td><td>${k.dnf?'DNF':fmt(k.finished)}</td>${gp?`<td>+${gp.last[k.id]}</td><td>${gp.pts[k.id]}</td>`:''}</tr>`).join('');
  if(opt.mode==='tt'){html=`<tr><th>LAP</th><th>TIME</th></tr>`+me.lapTimes.map((t,i)=>`<tr class="me"><td>${i+1}</td><td>${fmt(t)}</td></tr>`).join('')+`<tr><td>BEST</td><td>${ghostBest()?fmt(ghostBest()):'—'}</td></tr>`;}}
 $('reye').textContent=eye;$('rtitle').textContent=title;$('rtitle').style.color=me.place===1&&!me.dnf?'#ffd23a':'';$('rtable').innerHTML=html;
 const next=gp&&gp.race<4;$('rnext').textContent=gp?(next?'NEXT RACE':'TROPHY CEREMONY'):'RACE AGAIN';$('rstand').hidden=!gp;$('rpost').hidden=!!gp;$('rtok').textContent='';
 if(!gp){const pts=scoreFor(me);const tok=award(pts,me.place===1&&!me.dnf);$('rtok').textContent=`${pts} PTS · +${tok} TOKENS · BEST ${best()}`;}
 $('results').hidden=false;$('standings').hidden=true;}
function showStandings(){const list=karts.slice().sort((a,b)=>gp.pts[b.id]-gp.pts[a.id]);$('stitle').textContent=CUPS[gp.cup].n;
 $('stable').innerHTML='<tr><th>#</th><th>DRIVER</th><th>LAST</th><th>TOTAL</th></tr>'+list.map((k,i)=>`<tr class="${k.human>=0?'me':''}"><td>${i+1}</td><td><i style="background:${k.color}"></i>${k.name}</td><td>+${gp.last[k.id]}</td><td><b>${gp.pts[k.id]}</b></td></tr>`).join('');
 $('standings').hidden=false;}
function scoreFor(me){const ccM=[1,1.5,2][opt.cc];if(A)return Math.round((me.pops*60+(me.place===1?250:0)+me.balloons*30)*ccM);
 if(opt.mode==='tt')return me.dnf?0:Math.max(0,Math.round(60000/Math.max(1,me.finished)*ccM));
 if(opt.mode==='gp'){const pts=gp.pts[me.id],rank=karts.slice().sort((a,b)=>gp.pts[b.id]-gp.pts[a.id]).indexOf(me)+1;return Math.round((pts*10+[300,200,100][rank-1]||0)*ccM);}
 return me.dnf?0:Math.round(((POINTS[me.place-1]||0)*10+(me.place===1?100:0))*ccM);}
function award(pts,won){lastAward={pts,won,mode:opt.mode,cc:CC[opt.cc].n,track:A?ARENA.n:COURSES[courseIdx].n,place:karts.find(k=>k.human===0).place};const tok=5+Math.min(60,pts/20|0);
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID;if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID)||0);}catch(e){return 0;}}
function nextFromResults(){if(gp){if(gp.race<4){$('results').hidden=true;$('standings').hidden=true;startRace();}else startPodium();}else{startEvent();}}

/* ================= podium ================= */
function startPodium(){app='podium';$('results').hidden=true;$('standings').hidden=true;const list=karts.slice().sort((a,b)=>gp.pts[b.id]-gp.pts[a.id]);const me=karts.find(k=>k.human===0),rank=list.indexOf(me)+1;
 const B=C.main,i=Math.round(.03*B.n),base=new V(B.x[i],B.y[i],B.z[i]),yaw=Math.atan2(B.tx[i],B.tz[i]);
 if(!podium){const g=new THREE.Group(),m=new THREE.MeshPhysicalMaterial({color:0xf4f2ee,roughness:.35,clearcoat:.6}),gm=new THREE.MeshStandardMaterial({color:0xffc21a,metalness:1,roughness:.25});
  [[0,3.2],[-4.6,2.2],[4.6,1.4]].forEach(([x,h],j)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(4.2,h,4.2),m);b.position.set(x,h/2,0);b.castShadow=b.receiveShadow=true;g.add(b);const s=new THREE.Mesh(new THREE.BoxGeometry(4.25,.3,4.25),j?new THREE.MeshStandardMaterial({color:j===1?0xc8ccd8:0xc87a3a,metalness:1,roughness:.3}):gm);s.position.set(x,h-.4,0);g.add(s);});
  const cup=new THREE.Group();const cm=new THREE.MeshStandardMaterial({color:0xffc21a,metalness:1,roughness:.18});const bowl=new THREE.Mesh(new THREE.CylinderGeometry(1.1,.4,1.4,24,1,true),cm);bowl.material.side=THREE.DoubleSide;bowl.position.y=1.9;cup.add(bowl);const st=new THREE.Mesh(new THREE.CylinderGeometry(.18,.5,1.1,16),cm);st.position.y=.75;cup.add(st);for(const s of[-1,1]){const h=new THREE.Mesh(new THREE.TorusGeometry(.45,.08,8,16,Math.PI),cm);h.position.set(s*1.1,2,0);h.rotation.z=s*Math.PI/2;cup.add(h);}
  cup.position.set(0,3.2,-3.6);g.add(cup);g.userData.cup=cup;podium=g;}
 podium.position.copy(base);podium.rotation.y=yaw+Math.PI/2;scene.add(podium);
 for(const k of karts){k.model.visible=false;}
 list.slice(0,3).forEach((k,j)=>{const x=[0,-4.6,4.6][j],h=[3.2,2.2,1.4][j];tv.set(x,h,0).applyAxisAngle(new V(0,1,0),podium.rotation.y).add(base);k.p.copy(tv);k.yaw=podium.rotation.y;k.model.visible=true;k.model.userData.celebrate=1;k.spd=0;k.vel.set(0,0,0);k.ground=true;k.drift=0;k.boost=0;k.glide=false;k.aura=0;k.respawn=0;k.out=false;k.shrink=0;k.spin=0;k.tumble=0;});
 podium.userData.t=0;podium.userData.base=base;
 const pts=scoreFor(me),won=rank===1,tok=award(pts,won);
 $('ptitle').textContent=rank<=3?['GOLD','SILVER','BRONZE'][rank-1]+' CUP':ORD(rank).toUpperCase()+' OVERALL';$('ptitle').style.color=['#ffd23a','#dfe3ee','#e09050'][rank-1]||'#fff';$('peye').textContent=`${CUPS[gp.cup].n} · ${CC[opt.cc].n} · FINAL STANDINGS`;
 $('ptable').innerHTML=list.map((k,i)=>`<tr class="${k.human>=0?'me':''}"><td>${i+1}</td><td><i style="background:${k.color}"></i>${k.name}</td><td><b>${gp.pts[k.id]}</b></td></tr>`).join('');
 $('ptok').textContent=`${pts} PTS · +${tok} TOKENS · BEST ${best()}`;$('podium').hidden=false;snd.play('finish');}
function podiumStep(dt){const u=podium.userData;u.t+=dt;u.cup.rotation.y+=dt;if(Math.random()<dt*30){const p=u.base;for(let n=0;n<6;n++){const c=new THREE.Color().setHSL(Math.random(),.9,.6).multiplyScalar(2);sparks.emit(p.x+rnd(16)-8,p.y+14,p.z+rnd(16)-8,rnd(2)-1,-2-rnd(2),rnd(2)-1,c.r,c.g,c.b,.4,3.5,1.5,.6);}}}

/* ================= replay (results background) ================= */
function replayStep(dt){if(!rec.length||A)return;const r=replay;r.t+=dt;const n=rec.length,fi=Math.min(n-1.001,(r.t*20)%(n-1)),i=Math.floor(fi),f=fi-i,a=rec[i],b=rec[i+1];
 karts.forEach((k,j)=>{const A0=a[j],B0=b[j];k.p.set(lerp(A0[0],B0[0],f),lerp(A0[1],B0[1],f),lerp(A0[2],B0[2],f));k.yaw=A0[3]+wrapA(B0[3]-A0[3])*f;k.repl=A0;});}

/* ================= visuals ================= */
const qv=new THREE.Quaternion(),ev3=new THREE.Euler(),up=new V(0,1,0);
function kartVis(k,dt){const m=k.model,u=m.userData;let visible=!k.out||A;
 if(app==='results'&&k.repl){const r=k.repl;m.visible=!!r[8];m.position.copy(k.p);m.rotation.set(0,r[3],0);const s={steer:r[4],spd:r[9],spdF:Math.min(1,Math.abs(r[9])/25),accel:0,boost:r[5]>0,boostCol:BOOSTC[r[5]|0]||null,glide:!!r[6],aura:r[7],driftDir:r[10]>=0?1:0,air:false,hurt:0,trick:0};poseRacer(m,s,dt,time);if(r[10]>=0)driftSparks(k,r[10],dt);return;}
 if(k.respawn>0){// carried back by the rescue drone
  const t=k.respawn;if(t>.95){m.visible=false;}else{m.visible=true;const s=k.safe;if(s){if(s.B){const B=s.B,i=B.closed?(s.i-1+B.n)%B.n:Math.max(0,s.i-1);m.position.set(B.x[i]+B.nx[i]*(s.u||0),B.y[i]+.5+t*7,B.z[i]+B.nz[i]*(s.u||0));m.rotation.set(0,Math.atan2(B.tx[i],B.tz[i]),0);}else{m.position.set(s.x,arenaHeight(s.x,s.z,A.R)+.5+t*7,s.z);m.rotation.set(0,s.yaw,0);}}}
  if(t<=.95&&(k.human>=0||nearHuman(m.position,60))){drone.visible=true;drone.position.copy(m.position).add(tv.set(0,3.4,0));drone.userData.props.forEach(p=>p.rotation.y+=dt*40);}
  return;}
 m.visible=visible&&!(k.invuln>0&&k.spin<=0&&k.tumble<=0&&Math.floor(time*16)%2===0&&k.invuln<1.9);
 m.position.copy(k.p);
 // pitch from the ground slope along the heading, roll on banking/air
 const q=k.q;let pitch=0;if(k.ground&&q.ok){let sl=q.slope||0;if(q.tx!==undefined)sl*=Math.sin(k.yaw)*q.tx+Math.cos(k.yaw)*q.tz;if(q.ramp)sl+=q.ramp.h/q.ramp.len*1.3;pitch=-Math.atan(sl);}else pitch=-Math.atan2(k.vel.y,Math.max(4,Math.hypot(k.vel.x,k.vel.z)))*.6;
 u.pitch=(u.pitch||0)+(pitch-(u.pitch||0))*Math.min(1,dt*10);
 let yaw=k.yaw+(k.drift?k.drift*.32:0),roll=0,pitchX=u.pitch;
 if(k.trick>0){const f=1-k.trick/.5;if(k.trickKind)roll=f*Math.PI*2;else yaw+=f*Math.PI*2;}
 if(k.tumble>0){pitchX-=(1-k.tumble/1.3)*Math.PI*2;}
 u.yawV=yaw;m.rotation.set(pitchX,yaw,roll,'YXZ');
 const sc=k.shrink>0?.5:1;u.scl=(u.scl??1)+(sc-(u.scl??1))*Math.min(1,dt*6);m.scale.set(u.scl,u.scl*(k.squish>0?.35:1),u.scl);
 if(k.out&&A){m.traverse(o=>{if(o.isMesh&&o.material&&!o.material.userData.ghost){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.3;o.material.userData.ghost=1;}});}
 const st={steer:k.drift?k.drift*.6+k.steerV*.4:k.steerV,spd:k.spd,spdF:Math.min(1,Math.abs(k.spd)/25),accel:cl(k.accelVis/30,-1,1),idle:Math.abs(k.spd)<1&&!k.finished,driftDir:k.drift,boost:k.boost>0||(phase==='countdown'&&k.revv>.5),boostLvl:k.boost>0?1.2:.4,boostCol:k.boost>0?BOOSTC[k.boostCol||1]:[2,1,.3],glide:k.glide||(app==='menu'&&menuStep==='driver'),aura:k.aura,trick:k.trick>0,hurt:k.spin+k.tumble,lookBack:k.ctrl.look&&k.human>=0,look:0,air:!k.ground,land:k.land,balloons:A?k.balloons:undefined};k.land=0;
 poseRacer(m,st,dt,time);
 // effects: drift sparks, boost, dust, bubbles, aura glitter, skid marks
 if(k.drift&&k.ground)driftSparks(k,k.driftLv,dt);
 const fx=Math.sin(k.yaw),fz=Math.cos(k.yaw),rx=Math.cos(k.yaw),rz=-Math.sin(k.yaw),sp=Math.abs(k.spd);
 if(k.boost>0&&Math.random()<.7){const c=BOOSTC[k.boostCol||1];sparks.emit(k.p.x-fx*2.2+rnd(.4)-.2,k.p.y+.85,k.p.z-fz*2.2+rnd(.4)-.2,-fx*8+rnd(2)-1,rnd(2),-fz*8+rnd(2)-1,c[0]*.6,c[1]*.6,c[2]*.6,.45,.25);}
 if(k.ground&&sp>8&&(k.surf===SURF.off||k.surf===SURF.sand||k.surf===SURF.mud||(T.key==='snow'&&k.surf!==SURF.road))&&Math.random()<sp/70){const c=landCol(k);dust.emit(k.p.x-fx*1.6+rnd(1.6)-.8,k.p.y+.3,k.p.z-fz*1.6+rnd(1.6)-.8,-fx*3+rnd(2)-1,.6+rnd(1.4),-fz*3+rnd(2)-1,c.r,c.g,c.b,.8,.6,-.3,1.5,1.4);}
 if(k.under&&Math.random()<.4)sparks.emit(k.p.x+rnd(2)-1,k.p.y+1,k.p.z+rnd(2)-1,0,3+rnd(2),0,.35,.6,.9,.16,1.1,-2,.5);
 if(k.aura>0&&Math.random()<.8){const c=new THREE.Color().setHSL((time*1.5+Math.random()*.3)%1,1,.6).multiplyScalar(2.5);sparks.emit(k.p.x+rnd(3)-1.5,k.p.y+rnd(2.4),k.p.z+rnd(3)-1.5,0,1,0,c.r,c.g,c.b,.4,.5);}
 if(k.ground&&(k.drift||(k.spin>0&&sp>4))&&k.surf!==SURF.off){for(const s of[-1,1]){const w=tv.set(k.p.x-fx*1+rx*s*.85,k.p.y,k.p.z-fz*1+rz*s*.85);const key=s<0?'skL':'skR';if(k[key])skids.add(0,0,k[key],w,.18,.8);k[key]=(k[key]||new V()).copy(w);}}else{k.skL=null;k.skR=null;}
 if(k.ground&&T.key==='snow'&&sp>10&&Math.random()<.3)dust.emit(k.p.x-fx*1.5,k.p.y+.2,k.p.z-fz*1.5,-fx*2+rnd(2)-1,2,-fz*2+rnd(2)-1,1,1,1,.8,.6,-.4,1,1.5);}
function driftSparks(k,lv,dt){const fx=Math.sin(k.yaw),fz=Math.cos(k.yaw),rx=Math.cos(k.yaw),rz=-Math.sin(k.yaw);const c=lv>0?BOOSTC[lv]:[2.2,2,1.4],n=lv>0?3:1;
 for(let j=0;j<n;j++)for(const s of[-1,1]){if(Math.random()>(lv>0?.9:.35))continue;const x=k.p.x-fx*1.1+rx*s*.9,z=k.p.z-fz*1.1+rz*s*.9;sparks.emit(x,k.p.y+.15,z,-fx*4+rnd(6)-3+rx*s*2,2+rnd(4),-fz*4+rnd(6)-3+rz*s*2,c[0],c[1],c[2],lv>0?.42+lv*.06:.2,.3,18,1);}}
function visuals(dt){drone.visible=false;
 if(W)updateWorld(W,time,dt);
 for(const k of karts)kartVis(k,dt);
 if(ghost)ghostVis();
 sparks.update(dt);dust.update(dt);skids.update();
 cameras(dt);hud(dt);
 // engine sound
 if(snd.ac){views.forEach((v,i)=>{const k=v.k,on=(app==='race'||app==='intro')&&k.respawn<=0&&!k.out;snd.engine(i,phase==='countdown'?(k.revv||0)*20:k.spd,G?G.cc.v:30,on,k.drift?k.driftLv+1:0,k.boost>0);});if(app!=='race'&&app!=='intro')snd.silence();}}

/* ================= cameras ================= */
const want=new V(),look=new V();let menuA=0;
function camFor(v,dt){const k=v.k,cam=v.cam;let kp=1-Math.exp(-dt*7.5),kl=1-Math.exp(-dt*12);
 const fx=Math.sin(k.yaw),fz=Math.cos(k.yaw);
 if(k.respawn<=0)v.rsSnap=false;
 if(k.respawn>0&&k.respawn<.95){if(!v.rsSnap){v.rsSnap=true;v.snap=true;}const my=k.model.rotation.y;want.copy(k.model.position).add(tv.set(-Math.sin(my)*9,4,-Math.cos(my)*9));look.copy(k.model.position);}
 else if(k.respawn>0){want.copy(v.pos);look.copy(v.look).lerp(k.p,.05);}
 else if(app==='intro'){introCam(v);return;}
 else if(k.finished!=null&&phase!=='countdown'){const a=time*.35+k.id;want.set(k.p.x+Math.cos(a)*9,k.p.y+3.4,k.p.z+Math.sin(a)*9);look.copy(k.p).add(tv.set(0,1,0));kp=1-Math.exp(-dt*3);}
 else{const back=k.ctrl.look&&k.human>=0&&!autopilot[k.human];const dy=k.drift?k.drift*.18:0;
  if(v.cy===undefined||v.snap)v.cy=k.yaw;if(k.spin<=0&&k.tumble<=0){const mv=Math.hypot(k.vel.x,k.vel.z);let tgt=k.yaw+dy;if(k.spd<-2)tgt=k.yaw;v.cy+=wrapA(tgt-v.cy)*Math.min(1,dt*(k.drift?5:7));}
  const cy=v.cy+(back?Math.PI:0),bx=Math.sin(cy),bz=Math.cos(cy);
  const sp2=views.length>1,dist=(sp2?5.4:6.3)+(k.boost>0?.8:0),h=(k.glide?3.8:2.65)*(sp2?.88:1);want.set(k.p.x-bx*dist,k.p.y+h,k.p.z-bz*dist);look.set(k.p.x+bx*5.5,k.p.y+1.25,k.p.z+bz*5.5);
  if(!k.ground&&!k.glide)kp=1-Math.exp(-dt*4);if(back){kp=1;}
  // keep the camera above the road surface
  if(!A){const q=query(C,want.x,want.z,want.y);if(q.ok&&q.inside&&!q.gap&&want.y<q.y+1.6)want.y=q.y+1.6;}else{const gy=arenaHeight(want.x,want.z,A.R)+1.6;if(want.y<gy)want.y=gy;}}
 if(v.snap){v.pos.copy(want);v.look.copy(look);v.snap=false;}else{v.pos.lerp(want,kp);v.look.lerp(look,kl);}
 let fovT=(views.length>1?56:70)+(k.boost>0?9:0)+cl(Math.abs(k.spd)/G.cc.v,0,1.4)*4;if(k.aura>0)fovT+=4;v.fov+=(fovT-v.fov)*Math.min(1,dt*4);cam.fov=v.fov;
 cam.position.copy(v.pos);v.shake=Math.max(0,v.shake-dt*1.8);const s=v.shake*v.shake*.6;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.position.z+=(Math.random()-.5)*s;cam.lookAt(v.look);}
function introCam(v){const cam=v.cam,t=introT;if(A){const a=t*.25;cam.position.set(Math.cos(a)*(110-t*8),40-t*4,Math.sin(a)*(110-t*8));cam.lookAt(0,0,0);cam.fov=55;v.snap=true;return;}
 const B=C.main,cx=(C.bbox[0]+C.bbox[2])/2,cz=(C.bbox[1]+C.bbox[3])/2,rad=Math.max(C.bbox[2]-C.bbox[0],C.bbox[3]-C.bbox[1])*.55;
 if(t<2.2){const a=t*.18+.6;cam.position.set(cx+Math.cos(a)*rad,170+t*6,cz+Math.sin(a)*rad);cam.lookAt(cx,0,cz);cam.fov=55;}
 else if(t<4.4){const f=.35+(t-2.2)*.035,p=at(B,f,0,tv),q2=at(B,f+.03,0,tv2);cam.position.set(p.x,p.y+7,p.z);cam.lookAt(q2.x,q2.y+2,q2.z);cam.fov=62;}
 else{const f=(t-4.4)/1.8,k=v.k,fx=Math.sin(k.yaw),fz=Math.cos(k.yaw),e=f*f*(3-2*f);want.set(k.p.x+fx*30,k.p.y+16,k.p.z+fz*30).lerp(tv.set(k.p.x-fx*6.3,k.p.y+2.65,k.p.z-fz*6.3),e);cam.position.copy(want);look.set(k.p.x,k.p.y+1.25,k.p.z).add(tv.set(fx*5.5*e,0,fz*5.5*e));cam.lookAt(look);cam.fov=70;v.pos.copy(want);v.look.copy(look);}
 v.snap=t<4.4;}
function cameras(dt){if(app==='race'||app==='paused'||app==='intro'){views.forEach(v=>camFor(v,dt));return;}
 if(app==='results'&&!A&&rec.length){// TV cameras following the player
  const me=karts.find(k=>k.human===0);let best=null,bd=1e9;for(const c of tvCams){const d=c.distanceToSquared(me.p);if(d<bd){bd=d;best=c;}}
  replay.camT-=dt;if(replay.camT<=0||best!==replay.cam){replay.cam=best;replay.camT=3;replay.chase=Math.random()<.3;}
  if(replay.chase){const fx=Math.sin(me.yaw),fz=Math.cos(me.yaw);mainCam.position.set(me.p.x-fx*8,me.p.y+3.4,me.p.z-fz*8);mainCam.fov=62;}else{mainCam.position.copy(best);mainCam.fov=Math.max(18,Math.min(55,900/Math.sqrt(bd+1)*2.2));}
  mainCam.lookAt(me.p.x,me.p.y+1,me.p.z);return;}
 if(app==='results'&&A){const a=time*.12;mainCam.position.set(Math.cos(a)*70,24,Math.sin(a)*70);mainCam.fov=50;mainCam.lookAt(0,0,0);return;}
 if(app==='podium'){const u=podium.userData,b=u.base,a=Math.sin(u.t*.2)*.45+podium.rotation.y;mainCam.position.set(b.x+Math.sin(a)*17,b.y+6.5,b.z+Math.cos(a)*17);mainCam.fov=46;tv.set(b.x-mainCam.position.x,0,b.z-mainCam.position.z).normalize();tv2.crossVectors(tv,up).normalize();mainCam.lookAt(b.x-tv2.x*7,b.y+3.2,b.z-tv2.z*7);return;}
 // menu showroom: orbit the kart, framed on the right half of the screen
 const k=karts[0];if(!k)return;menuA+=dt*.16;const a=k.yaw+.9+Math.sin(menuA)*.7;mainCam.position.set(k.p.x+Math.sin(a)*7.6,k.p.y+2.5,k.p.z+Math.cos(a)*7.6);mainCam.fov=38;
 tv.set(k.p.x-mainCam.position.x,0,k.p.z-mainCam.position.z).normalize();tv2.crossVectors(tv,up).normalize();mainCam.lookAt(k.p.x-tv2.x*2.5,k.p.y+.9,k.p.z-tv2.z*2.5);}

/* ================= ghost (time trial) ================= */
function ghostKey(){return'pxd_kartgp_ghost_'+COURSES[opt.track].id+'_'+opt.cc;}
function ghostBest(){try{const g=JSON.parse(localStorage.getItem(ghostKey()));return g?g.t:0;}catch(e){return 0;}}
function loadGhost(){if(ghost){scene.remove(ghost.m);ghost=null;}try{const g=JSON.parse(localStorage.getItem(ghostKey()));if(!g||!g.f)return;const m=ghostify(makeRacer(CHARS[g.ch],g.parts));scene.add(m);ghost={...g,m};}catch(e){}}
function saveGhost(t){const best=ghostBest();if(best&&best<=t)return;try{localStorage.setItem(ghostKey(),JSON.stringify({t,ch:opt.picks[0].ch,parts:{body:opt.picks[0].body,wheels:opt.picks[0].wheels,glider:opt.picks[0].glider},f:ghostRec}));msg(karts[0],'NEW RECORD!','final',3);}catch(e){}}
function ghostVis(){const g=ghost,n=g.f.length/4;if(app!=='race'&&app!=='intro'||phase==='countdown'){g.m.visible=app==='race'||app==='intro';if(n){g.m.position.set(g.f[0],g.f[1],g.f[2]);g.m.rotation.y=g.f[3];}return;}
 const fi=Math.min(n-1.001,raceT*20),i=Math.floor(fi),f=fi-i;if(i>=n-1){g.m.visible=false;return;}g.m.visible=true;const o=i*4,o2=o+4;g.m.position.set(lerp(g.f[o],g.f[o2],f),lerp(g.f[o+1],g.f[o2+1],f),lerp(g.f[o+2],g.f[o2+2],f));g.m.rotation.y=g.f[o+3]+wrapA(g.f[o2+3]-g.f[o+3])*f;}

/* ================= rendering ================= */
let fxAll=null,fxSplit=[];const POST=()=>({ao:false,exposure:T?T.exp:1,bloom:T&&T.night?.7:.42,bloomThreshold:T&&T.night?.8:.92,bloomRadius:.5,vignette:.3,saturation:1.12,grain:.02,aoStrength:.7});
function applyQuality(q){gfx=q;W&&W.sun&&(W.sun.castShadow=q>0);R.shadowMap.needsUpdate=true;fxAll=null;fxSplit=[];R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function getFx(i,w,h,cam){const o=POST();if(i<0){if(!fxAll||fxAll.cam!==cam){fxAll=cinematic(R,scene,cam,{...o,quality:gfx});fxAll.cam=cam;fxAll.w=0;}if(fxAll.w!==w*9999+h){fxAll.w=w*9999+h;fxAll.setSize(w,h);}return fxAll;}
 let f=fxSplit[i];if(!f||f.cam!==cam){f=fxSplit[i]=cinematic(R,scene,cam,{...o,ao:false,quality:Math.min(gfx,1)});f.cam=cam;f.w=0;}if(f.w!==w*9999+h){f.w=w*9999+h;f.setSize(w,h);}return f;}
function renderView(cam,x,y,w,h,fi,focus){cam.aspect=w/h;cam.updateProjectionMatrix();sparks.U.uScale.value=dust.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 if(W){const t=focus||cam.position;W.sun.target.position.copy(t);W.sun.position.copy(t).addScaledVector(W.sunDir,160);W.sun.updateMatrixWorld();W.sun.target.updateMatrixWorld();R.shadowMap.needsUpdate=true;
  // underwater tint
  const uw=W.waterY!==undefined&&cam.position.y<W.waterY;scene.fog.color.copy(uw?new THREE.Color(0x0a5a7a):W.fogC);scene.fog.density=uw?.03:W.fogD;}
 R.setViewport(x,y,w,h);R.setScissor(x,y,w,h);getFx(fi,w,h,cam).render();}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);
 if(!W)return;const live=app==='race'||app==='paused'||app==='intro';
 if(live&&views.length===2){R.setScissorTest(true);renderView(views[0].cam,0,h/2,w,h/2,0,views[0].k.p);renderView(views[1].cam,0,0,w,h/2,1,views[1].k.p);R.setScissorTest(false);}
 else{R.setScissorTest(false);const cam=live?views[0].cam:mainCam;const focus=live?views[0].k.p:app==='podium'?podium.userData.base:karts[0]?karts[0].p:null;renderView(cam,0,0,w,h,-1,focus);}}
addEventListener('resize',()=>{fxAll&&(fxAll.w=0);fxSplit.forEach(f=>f&&(f.w=0));});

/* ================= menus ================= */
function menuVis(dt){if(!karts.length)return;const k=karts[0];k.spd=0;k.steerV=Math.sin(time*.8)*.3;k.ctrl.look=false;}
function showcase(){// park the edited player's kart on the grid of the current background course
 const p=opt.picks[editP];roster=[{id:0,human:0,ch:p.ch,parts:{body:p.body,wheels:p.wheels,glider:p.glider},paint:null,name:CHARS[p.ch].n}];spawnKarts();
 const k=karts[0],B=C.main,i=Math.round(.06*B.n);at(B,.06,0,k.p);k.yaw=Math.atan2(B.tx[i],B.tz[i]);k.q={ok:false};resetKart(k);k.ground=true;k.model.userData.celebrate=0;}
function toMenu(){app='menu';snd.stopMusic();snd.silence();gp=null;views=[];$('views').innerHTML='';items&&items.clear();if(ghost){scene.remove(ghost.m);ghost=null;}if(podium)scene.remove(podium);
 if(courseIdx<0||!W)loadCourse(opt.mode==='battle'?0:opt.mode==='gp'?CUPS[opt.cup].tracks[0]:opt.track);showcase();items=new Items(scene,null);G=makeG();items.G=G;
 $('menu').hidden=false;$('keys').hidden=false;$('skip').hidden=true;$('card').classList.remove('on');$('results').hidden=true;$('standings').hidden=true;$('podium').hidden=true;$('pause').hidden=true;$('hud').hidden=true;document.body.classList.remove('playing');setStep('mode');}
function setStep(s){menuStep=s;document.querySelectorAll('.step').forEach(e=>e.hidden=e.dataset.step!==s);if(s==='driver')buildDriverUI();if(s==='course')buildCourseUI();$('keys').hidden=s!=='mode';}
function menuBack(){if(menuStep==='driver')setStep('mode');else if(menuStep==='course')setStep('driver');}
const seg=(id,key,cb)=>{const el=$(id);const set=v=>{opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',(isNaN(+b.dataset.v)?b.dataset.v:+b.dataset.v)===v));cb&&cb(v);saveOpt();};set(opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>{snd.init();snd.play('ui');set(isNaN(+b.dataset.v)?b.dataset.v:+b.dataset.v);});};
seg('o-mode','mode',v=>{$('o-pl').querySelector('[data-v="2"]').disabled=v==='tt';if(v==='tt'&&opt.players===2){opt.players=1;$('o-pl').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v==='1'));}$('modeinfo').textContent={gp:'Four races, points for every finish. Highest total lifts the cup.',vs:'One race on any course with your own rules.',tt:'Solo against the clock with three turbo peppers. Beat your ghost.',battle:'Arena brawl: three balloons each, three minutes. Last one floating wins.'}[v];});
seg('o-pl','players');seg('o-cc','cc');seg('o-diff','diff');
// driver select thumbnails (rendered once)
const thumbs=[];{const tr=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});tr.setSize(150,120,false);tr.outputColorSpace=THREE.SRGBColorSpace;tr.toneMapping=THREE.ACESFilmicToneMapping;
 const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xffffff,0x445066,1.6));const l=new THREE.DirectionalLight(0xffffff,2.4);l.position.set(2,4,3);s.add(l);const cam=new THREE.PerspectiveCamera(30,150/120,.1,50);
 CHARS.forEach((ch,i)=>{const m=makeRacer(ch);m.rotation.y=-.75;s.add(m);const h=m.userData.drv.headY+1;cam.position.set(3.4,2.1,4.4);cam.lookAt(0,.95,0);poseRacer(m,{steer:0,spd:0,spdF:0,accel:0},0,0);tr.render(s,cam);thumbs[i]=tr.domElement.toDataURL();s.remove(m);});tr.dispose();tr.forceContextLoss&&tr.forceContextLoss();}
function buildDriverUI(){const p=opt.picks[editP];$('ptabs').hidden=opt.players<2;$('ptabs').querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('on',i===editP);b.onclick=()=>{editP=i;snd.play('ui');buildDriverUI();showcase();};});
 $('chars').innerHTML=CHARS.map((c,i)=>`<button class="ch${i===p.ch?' on':''}${opt.players>1&&i===opt.picks[1-editP].ch?' other':''}" data-i="${i}"><img src="${thumbs[i]}" alt=""><b>${c.n}</b><i>${CLASS[c.cls].n}</i></button>`).join('');
 $('chars').querySelectorAll('.ch').forEach(b=>b.onclick=()=>{p.ch=+b.dataset.i;snd.play('ui');saveOpt();buildDriverUI();showcase();});
 const part=(id,list,key)=>{$(id).querySelector('b').textContent=list[p[key]].n;$(id).querySelectorAll('button').forEach(b=>b.onclick=()=>{p[key]=(p[key]+(+b.dataset.d)+list.length)%list.length;snd.play('ui');saveOpt();buildDriverUI();showcase();});};
 part('pb-body',BODIES,'body');part('pb-wheel',WHEELS,'wheels');part('pb-glider',GLIDERS,'glider');
 const st=statsOf(CHARS[p.ch],p.body,p.wheels,p.glider);$('stats').innerHTML=STATS.map(([k,n])=>`<div><span>${n}</span><i><em style="width:${(st[k]/6*100).toFixed(0)}%"></em></i></div>`).join('');
 $('blurb').textContent=CHARS[p.ch].blurb;}
function buildCourseUI(){const host=$('courses');let html='';
 if(opt.mode==='gp')html=CUPS.map((c,i)=>`<button class="cup${i===opt.cup?' on':''}" data-i="${i}"><b style="color:${c.c}">${c.ic} ${c.n}</b>${c.tracks.map(t=>`<span>${COURSES[t].n}</span>`).join('')}</button>`).join('');
 else if(opt.mode==='battle')html=`<button class="cup on"><b style="color:#ff8a3a">◎ ${ARENA.n}</b><span>Ring arena · 8 pillars · 20 prism boxes</span><span>3 balloons each · 3:00</span></button>`;
 else html=COURSES.map((c,i)=>`<button class="trk${i===opt.track?' on':''}" data-i="${i}"><canvas width="120" height="90" data-i="${i}"></canvas><b>${c.n}</b>${opt.mode==='tt'&&bestTT(i)?`<i>BEST ${fmt(bestTT(i))}</i>`:`<i>${THEMES[c.theme]===undefined?'':c.theme.toUpperCase()}</i>`}</button>`).join('');
 host.innerHTML=html;host.className=opt.mode==='gp'||opt.mode==='battle'?'cups':'tracks';
 host.querySelectorAll('canvas').forEach(cv=>drawThumb(cv,+cv.dataset.i));
 host.querySelectorAll('button').forEach(b=>b.onclick=()=>{snd.play('ui');if(opt.mode==='gp')opt.cup=+b.dataset.i;else if(opt.mode!=='battle')opt.track=+b.dataset.i;saveOpt();buildCourseUI();});}
function bestTT(i){try{const g=JSON.parse(localStorage.getItem('pxd_kartgp_ghost_'+COURSES[i].id+'_'+opt.cc));return g?g.t:0;}catch(e){return 0;}}
const thumbCache={};function drawThumb(cv,i){const x=cv.getContext('2d');const C2=thumbCache[i]||(thumbCache[i]=buildCourse(COURSES[i],THEMES[COURSES[i].theme]));const[x0,z0,x1,z1]=C2.bbox,s=Math.min(104/(x1-x0),76/(z1-z0)),ox=60-(x0+x1)/2*s,oz=45-(z0+z1)/2*s;
 const th=THEMES[COURSES[i].theme];const g=x.createLinearGradient(0,0,0,90);g.addColorStop(0,'#'+new THREE.Color(th.sky[0]).getHexString());g.addColorStop(1,'#'+new THREE.Color(th.sky[1]).getHexString());x.fillStyle=g;x.fillRect(0,0,120,90);
 for(const pass of[0,1])for(const B of C2.branches){x.strokeStyle=pass?(B.kind==='cut'?'#ffb84a':'#fff'):'rgba(0,0,0,.5)';x.lineWidth=pass?3:6;x.lineJoin='round';x.beginPath();for(let k=0;k<=B.n-(B.closed?0:1);k++){const j=k%B.n;const px=ox+B.x[j]*s,pz=oz+B.z[j]*s;k?x.lineTo(px,pz):x.moveTo(px,pz);}x.stroke();}}
$('go1').onclick=()=>{snd.init();snd.play('uigo');setStep('driver');};$('go2').onclick=()=>{snd.play('uigo');setStep('course');};$('back2').onclick=()=>{snd.play('ui');setStep('mode');};$('back3').onclick=()=>{snd.play('ui');setStep('driver');};
$('go3').onclick=()=>{snd.play('uigo');startEvent();};
$('rnext').onclick=()=>{snd.play('uigo');nextFromResults();};$('rmenu').onclick=toMenu;$('rstand').onclick=()=>{snd.play('ui');showStandings();};$('sclose').onclick=()=>{$('standings').hidden=true;};
$('pmenu').onclick=toMenu;$('pagain').onclick=()=>{startEvent();};$('resume').onclick=()=>pause(false);$('restart').onclick=()=>{$('pause').hidden=true;if(gp)gp.race=Math.max(0,gp.race);startRace();};$('quit').onclick=toMenu;
const post=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Kart Grand Prix\nPoints: ${a.pts||0}\nMode: ${({gp:'Grand Prix',vs:'VS race',tt:'Time trial',battle:'Balloon battle'})[a.mode]||''} · ${a.cc||''}\nCourse: ${a.track||''}\nPlace: ${a.place||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] '+ID+' '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};
$('rpost').onclick=post;$('ppost').onclick=post;
canvas.addEventListener('pointerdown',()=>{edge.click=true;});

/* ================= loop ================= */
console.time&&0;const _t0=performance.now();toMenu();window.__kgpBoot=performance.now()-_t0;
let last=performance.now(),manual=!!window.__KGP_MANUAL;function loop(now){if(manual)return;const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.KARTGP={get state(){return app==='race'?phase:app;},get app(){return app;},get phase(){return phase;},step,render,start:startEvent,startRace,toMenu,
 get karts(){return karts;},get course(){return C;},get world(){return W;},get raceT(){return raceT;},get clock(){return clock;},setClock(s){clock=s;},get opt(){return opt;},get gp(){return gp;},get items(){return items;},
 skipIntro(){if(app==='intro'){app='race';$('skip').hidden=true;$('card').classList.remove('on');bannerT=0;}},manual(on=true){manual=on;if(!on){last=performance.now();requestAnimationFrame(loop);}},
 autopilot(i,on=true){autopilot[i]=on;},setQuality:applyQuality,
 // put a racer at a fraction of a lap (e.g. 2.97 = nearly finished) to script wins and losses
 warp(k,prog,u=0){k=typeof k==='number'?karts[k]:k;const B=C.main,f=((prog%1)+1)%1,i=Math.round(f*B.n)%B.n;at(B,f,u,k.p);k.p.y+=.3;k.yaw=Math.atan2(B.tx[i],B.tz[i]);k.vel.set(Math.sin(k.yaw)*20,0,Math.cos(k.yaw)*20);k.prog=prog;k.lastF=f;k.lap=Math.floor(prog)+1;k.gyPrev=k.p.y;k.respawn=0;},
 give(k,item){k=typeof k==='number'?karts[k]:k;k.item=item;k.itemN=item==='pepper3'?3:1;if(item==='orb'){k.orbs=3;k.item=null;}},
 next:nextFromResults,showStandings,get results(){return karts.map(k=>({name:k.name,human:k.human,place:k.place,finished:k.finished,dnf:k.dnf,balloons:k.balloons,pops:k.pops,prog:k.prog}));},
 get lastAward(){return lastAward;},keys,edge,scene,R,get views(){return views;},cam:()=>views[0]?views[0].cam:mainCam,sparks};
