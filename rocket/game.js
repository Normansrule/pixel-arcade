// ROCKET ARENA — full 3D car soccer. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import * as PH from './physics.js';
import {W,L,GW,GH,GD,RB,CAR,SP} from './physics.js';
import {TEAM,makeEnv,buildArena,buildPads,makeCar,makeBall,Particles,Trail,Shocks,Mirror} from './models.js';
import {DIFF,assignRoles,think} from './ai.js';
import {Sound} from './sound.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a;
const NAMES=['VOLT','NOVA','RIFT','BLITZ','COMET','ZEPHYR','JINX','ORBIT','TORQUE','QUASAR','FLUX','RAVEN','EMBER','HALO','PISTON','SPARK','DYNAMO','KESTREL'];
const MATCH=300,DT=1/120,KMH=1.333;

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0a0c18,.0015);scene.environment=makeEnv(R);
scene.add(new THREE.HemisphereLight(0x8a9ad0,0x1c1a22,.6));
const key=new THREE.DirectionalLight(0xfff0dc,2.3);key.position.set(28,150,22);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,{left:-L-GD-6,right:L+GD+6,top:L+GD+6,bottom:-L-GD-6,near:60,far:260});key.shadow.bias=-.0005;key.shadow.normalBias=.04;scene.add(key,key.target);
const rim=new THREE.DirectionalLight(0x7aa0ff,.7);rim.position.set(-60,40,-90);scene.add(rim);
const mirror=new Mirror(.5);
const arena=buildArena(scene,mirror);
const pads=PH.makePads(),padVis=buildPads(scene,pads);
const ballG=makeBall();scene.add(ballG);const ballLight=new THREE.PointLight(0xd8e4ff,30,26,1.6);scene.add(ballLight);
const flash=new THREE.PointLight(0xffffff,0,140,1.2);scene.add(flash);
const parts=new Particles(scene,5000),shocks=new Shocks(scene),ballTrail=new Trail(scene,24,1.1,new THREE.Color(1.1,1.2,1.6));
const ball=new PH.Ball(),snd=new Sound();
const mainCam=new THREE.PerspectiveCamera(60,1,.3,2400);mainCam.layers.enable(1);

/* ================= game state ================= */
let opt={size:2,humans:1,diff:1};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_rocket_opt'))||{});}catch(e){}
let app='menu',phase='countdown',cars=[],views=[],score=[0,0],clock=MATCH,overtime=false,otT=0,cdT=3,goT=0,goalT=0,endT=0,time=0,acc=0,timeScale=1;
let hideBall=false,kickTouched=false,kickT=0,goalInfo=null,rec=[],recTick=0,replay=null,bloomKick=0,hype=0,freeplay=false,attract=true,lastBeep=-1,lastClockSec=-1;
let pred=[],preGoal=null,world=null,diff=DIFF[1],fpReset=0;

/* ================= cars ================= */
function newCar(team,human,name,style){const c=new PH.Car(team);c.human=human;c.name=name;c.style=style;c.mesh=makeCar(team,style);scene.add(c.mesh);
 c.trail=new Trail(scene,26,.32,TEAM[team].glow.clone().multiplyScalar(.5));c.stats={score:0,goals:0,assists:0,saves:0,shots:0,demos:0};c.vp=new V();c.vv=new V();c.idle=false;cars.push(c);return c;}
function clearCars(){for(const c of cars){scene.remove(c.mesh);scene.remove(c.trail.mesh);c.mesh.traverse(o=>{if(o.geometry)o.geometry.dispose();});}cars=[];}
function roster(o){clearCars();const names=NAMES.slice().sort(()=>Math.random()-.5);let st=0;
 if(o.attract){for(let t=0;t<2;t++)for(let i=0;i<2;i++)newCar(t,-1,names.pop(),st++);return;}
 const H2=o.humans===2;newCar(0,0,H2?'P1':'YOU',0);if(H2)newCar(1,1,'P2',1);
 if(o.freeplay)return;for(let t=0;t<2;t++){while(cars.filter(c=>c.team===t).length<o.size)newCar(t,-1,names.pop(),st++%2);}}

/* ================= views (one per human; split-screen for two) ================= */
function setupViews(){const host=$('views');host.innerHTML='';views=[];const hum=cars.filter(c=>c.human>=0).sort((a,b)=>a.human-b.human);
 hum.forEach((c,i)=>{const el=document.createElement('div');el.className='pv';const split=hum.length>1;el.style.top=split?(i*50)+'%':'0';el.style.height=split?'50%':'100%';
  el.innerHTML=`${split?`<div class="tag" style="color:${TEAM[c.team].css}">${c.name}</div>`:''}<div class="cd"></div><div class="msg"></div><div class="cam on">BALL CAM</div><div class="dial"><svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="45" stroke-dasharray="212 400"/><circle class="fg" cx="60" cy="60" r="45"/></svg><b>33</b><span>BOOST</span></div>`;
  host.appendChild(el);const cam=new THREE.PerspectiveCamera(74,1,.3,2400);cam.layers.enable(1);
  views.push({car:c,cam,ballCam:true,pos:new V(),look:new V(),shake:0,fov:74,snap:true,el,cd:el.querySelector('.cd'),msg:el.querySelector('.msg'),camEl:el.querySelector('.cam'),dial:el.querySelector('.dial'),dfg:el.querySelector('.fg'),dnum:el.querySelector('.dial b'),last:{}});});
 $('mini').hidden=hum.length>1;}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);try{localStorage.setItem('pxd_rocket_opt',JSON.stringify(opt));}catch(e){}snd.init();
 freeplay=opt.size===0;attract=false;app='match';diff=DIFF[opt.diff];roster({humans:opt.humans,size:opt.size,freeplay});cars.forEach(c=>c.inf=freeplay);
 score=[0,0];clock=MATCH;overtime=false;otT=0;rec=[];replay=null;pads.forEach(p=>p.t=0);setupViews();kickoff();
 $('menu').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');$('feed').innerHTML='';$('board').style.visibility=freeplay?'hidden':'';}
function toMenu(){app='menu';attract=true;freeplay=false;diff=DIFF[2];roster({attract:true});views=[];$('views').innerHTML='';kickoff();
 $('menu').hidden=false;$('keys').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('bars').classList.remove('on');document.body.classList.remove('playing');}
function kickoff(){ball.reset();hideBall=false;ballTrail.clear();timeScale=1;goalInfo=null;replay=null;$('replay').hidden=true;$('bars').classList.remove('on');
 const spots=PH.KICK.map((s,i)=>i).sort(()=>Math.random()-.5);
 for(const t of[0,1]){const team=cars.filter(c=>c.team===t),s=t?-1:1;team.forEach((c,i)=>{let[x,z]=PH.KICK[spots[i%5]];if(freeplay){x=t?0:0;z=-L*.45;}c.place(x*s,z*s,Math.atan2(-x*s,-z*s));c.boost=c.inf?100:33;c.demoT=0;c.kick=false;c.ai=null;c.mesh.visible=true;c.trail.clear();c.vp.copy(c.p);c.vv.set(0,0,0);});
  const taker=team.slice().sort((a,b)=>(a.p.x**2+a.p.z**2)-(b.p.x**2+b.p.z**2)||a.p.x*s-b.p.x*s)[0];if(taker)taker.kick=true;}
 kickTouched=false;kickT=0;views.forEach(v=>v.snap=true);
 if(freeplay){phase='play';goT=0;}else{phase='countdown';cdT=3;lastBeep=4;}}
function scoreGoal(side){const team=side>0?0:1;const sc=ball.touch&&ball.touch.team===team?ball.touch:null;
 let as=null;if(sc&&ball.prevTouch&&ball.prevTouch.team===team&&ball.prevTouch!==sc&&time-ball.prevTouchT<7)as=ball.prevTouch;
 const kmh=Math.round(ball.v.length()*KMH);goalInfo={team,side,p:ball.p.clone(),scorer:sc,kmh};
 if(!attract&&!freeplay){score[team]++;if(sc){sc.stats.goals++;sc.stats.score+=100;}if(as){as.stats.assists++;as.stats.score+=50;}
  feed(`${sc?sc.name:'OWN GOAL'} SCORED${as?' · ASSIST '+as.name:''}`,team);$('board').classList.remove('flash');void $('board').offsetWidth;$('board').classList.add('flash');}
 if(!attract)banner('GOAL!',`${sc?sc.name:'OWN GOAL'} · ${kmh} KM/H`,TEAM[team].css,2.6);
 goalBoom(ball.p.clone(),team,true);hideBall=true;ball.v.set(0,0,0);
 replay=!attract&&!freeplay&&rec.length>90?{frames:rec.slice(-Math.round(4.4*60)),t:0,end:0}:null;
 phase='goal';goalT=0;}
function endMatch(){phase='end';endT=0;snd.play('horn');banner(overtime?'GOLDEN GOAL':'FULL TIME',`${score[0]} — ${score[1]}`,score[0]>score[1]?TEAM[0].css:TEAM[1].css,2.4);}
function showOver(){app='over';$('hud').hidden=true;document.body.classList.remove('playing');$('bars').classList.remove('on');
 const win=score[0]>score[1]?0:1,me=cars.find(c=>c.human===0);const two=cars.some(c=>c.human===1);
 const ranked=cars.slice().sort((a,b)=>b.stats.score-a.stats.score);const mvp=ranked.find(c=>c.team===win)||ranked[0];overMvp=mvp;
 for(const c of cars){if(c===mvp){c.place(0,0,Math.PI*.75);c.demoT=0;c.mesh.visible=true;}else{c.place(c.p.x,c.p.z,0);c.mesh.visible=false;}c.trail.clear();c.boosting=false;c.super=false;c.vp.copy(c.p);c.vv.set(0,0,0);}
 hideBall=true;hype=1;parts.burst(new V(0,1,0),160,24,[TEAM[win].glow,new THREE.Color(1.8,1.6,1.2)],.8,2.2,{up:true,grav:8,drag:.8});
 $('oeye').textContent=overtime?'GOLDEN GOAL · OVERTIME '+fmt(otT):'FULL TIME';
 $('ores').textContent=two?TEAM[win].n+' WINS':me&&me.team===win?'VICTORY':'DEFEAT';$('ores').style.color=TEAM[win].css;
 $('ofs').innerHTML=`<span class="b">${score[0]}</span> — <span class="o">${score[1]}</span>`;
 $('stats').innerHTML='<tr><th>PLAYER</th><th>SCORE</th><th>GOALS</th><th>ASSISTS</th><th>SAVES</th><th>SHOTS</th><th>DEMOS</th></tr>'+[0,1].map(t=>ranked.filter(c=>c.team===t).map(c=>`<tr class="t${t}${c.human>=0?' me':''}"><td>${c.name}${c===mvp?'<span class="mvp">MVP</span>':''}</td><td>${c.stats.score}</td><td>${c.stats.goals}</td><td>${c.stats.assists}</td><td>${c.stats.saves}</td><td>${c.stats.shots}</td><td>${c.stats.demos}</td></tr>`).join('')).join('');
 const tok=award(me,me&&me.team===win);$('otok').textContent=me?`+${tok} TOKENS · BEST ${best()} PTS`:'';$('over').hidden=false;overT=0;}
let overMvp=null,overT=0,lastAward=null;
function award(me,won){if(!me)return 0;const pts=me.stats.score+(won?50:0);lastAward={pts,won,goals:me.stats.goals,saves:me.stats.saves,score:`${score[0]}-${score[1]}`,mode:`${opt.size}v${opt.size}`,diff:DIFF[opt.diff].n.toLowerCase(),split:opt.humans===2};
 const tok=5+Math.min(60,pts/20|0);try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'rocket3d';if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'rocket3d')||0);}catch(e){return 0;}}

/* ================= events from physics ================= */
const tv=new V(),tv2=new V(),tq=new THREE.Quaternion();
function ev(type,a,b,c,d,e){
 if(type==='hit'){const car=a,str=b;if(ball.touch!==car){ball.prevTouch=ball.touch;ball.prevTouchT=ball.touchT;}ball.touch=car;ball.touchT=time;if(phase==='play')kickTouched=true;
  if(str>6){const n=Math.min(70,str*1.3|0);parts.burst(c,n,14+str*.6,[new THREE.Color(3,2.6,1.6),new THREE.Color(3,3,3),new THREE.Color(2.5,1.2,.3)],.42,.5,{dir:d,spread:1.1,grav:22,drag:1.8});
   if(str>30)shocks.fire(c,new THREE.Color(1.4,1.5,2),6,.35);snd.play('hit',str);const hv=views.find(v=>v.car===car);if(hv)hv.shake=Math.max(hv.shake,Math.min(.5,str*.008));}
  if(app==='match'&&phase==='play'&&!freeplay){const post=PH.predict(ball,3,1/60,null),opp=car.team===0?1:-1;
   if(post&&post.side===opp&&!(preGoal&&preGoal.side===opp)){car.stats.shots++;car.stats.score+=20;}
   if(preGoal&&preGoal.side===-opp&&preGoal.t<2.5&&!(post&&post.side===-opp)){car.stats.saves++;car.stats.score+=50;feed(`${car.name} SAVE!`,car.team);}}}
 else if(type==='demo'){const att=a,vic=b;if(vic.demoT>0)return;vic.demoT=3;demoBoom(vic);if(phase!=='play')return;att.stats.demos++;att.stats.score+=10;feed(`${att.name} ✸ ${vic.name}`,att.team);}
 else if(type==='bump'){if(c>20){parts.burst(tv.addVectors(a.p,b.p).multiplyScalar(.5),20,18,new THREE.Color(2.5,2,1.2),.4,.4,{grav:20});snd.play('bump');}}
 else if(type==='pad'){if(a.human>=0)snd.play('pad',b.big?2:1);parts.burst(tv.set(b.x,.6,b.z),b.big?40:10,b.big?14:7,new THREE.Color(3,1.6,.3),b.big?.8:.45,.6,{up:true,grav:-4});}
 else if(type==='jump'||type==='dodge'){if(a.human>=0)snd.play('jump');if(a.ground===false&&a.p.y<2)parts.burst(tv.copy(a.p).setY(.3),8,5,new THREE.Color(.6,.6,.7),.8,.5,{up:true});}
 else if(type==='land'){if(a.human>=0)snd.play('land',b);}}
function onBounce(v,n,p){if(v>9){snd.play('bounce',v);if(Math.abs(p.z)>L-1&&Math.abs(p.x)<GW+2&&p.y<GH+2){const net=arena.nets.find(x=>x.side===Math.sign(p.z));if(net&&Math.abs(p.z)>L+2){net.U.uHit.value.copy(p);net.U.uT.value=0;net.U.uAmp.value=Math.min(2.2,v*.04);}}}}
function goalBoom(p,team,real){const col=TEAM[team].glow;parts.burst(p,220,70,[col.clone().multiplyScalar(.55),col.clone().multiplyScalar(.35),new THREE.Color(1,.95,.9)],1.1,1.6,{drag:1.7,grav:5});
 parts.burst(p,110,30,[new THREE.Color(1.3,.9,.35),col.clone().multiplyScalar(.45)],.55,2.4,{drag:.9,grav:10,up:true});
 shocks.fire(p,col.clone().multiplyScalar(.6),34,1.1);shocks.fire(p,new THREE.Color(.9,.9,1),16,.55);flash.position.copy(p);{const m=Math.max(col.r,col.g,col.b);flash.color.setRGB(col.r/m,col.g/m,col.b/m);}flash.intensity=900;bloomKick=.45;hype=1;snd.play('goal');
 views.forEach(v=>v.shake=1.2);const net=arena.nets.find(x=>x.side===Math.sign(p.z));if(net){net.U.uHit.value.copy(p);net.U.uT.value=0;net.U.uAmp.value=3;}
 if(real)for(const c of cars){if(c.demoT>0)continue;tv.subVectors(c.p,p);const d=tv.length();if(d<34){tv.normalize();tv.y=Math.max(.35,tv.y);c.v.addScaledVector(tv.normalize(),(34-d)*1.5);c.ground=false;c.jumpT=0;c.airT=2;c.dbl=true;}}}
function demoBoom(c){const p=c.p;const col=TEAM[c.team].glow;parts.burst(p,150,40,[new THREE.Color(2.4,1.1,.25),new THREE.Color(1.6,1.5,1.4),col.clone().multiplyScalar(.6)],1.1,1.1,{grav:14,drag:1.4});parts.burst(p,40,10,new THREE.Color(.5,.4,.35),2.4,1.6,{up:true,grav:-3,drag:1});
 shocks.fire(p,new THREE.Color(3,1.4,.3),12,.55);flash.position.copy(p);flash.color.setRGB(1,.55,.25);flash.intensity=Math.max(flash.intensity,500);snd.play('demo');c.mesh.visible=false;c.trail.clear();
 views.forEach(v=>{const d=v.car.p.distanceTo(p);if(d<40)v.shake=Math.max(v.shake,.8*(1-d/40));});}
function respawn(c){const[x,z]=PH.RESPAWN[Math.random()*4|0],s=c.team?-1:1;c.place(x*s,z*s,s>0?0:Math.PI);c.boost=c.inf?100:33;c.mesh.visible=true;c.trail.clear();c.vp.copy(c.p);c.vv.set(0,0,0);c.ai=null;
 parts.burst(tv.copy(c.p),40,10,TEAM[c.team].glow,.9,.7,{up:true});const v=views.find(v=>v.car===c);if(v)v.snap=true;}

/* ================= input ================= */
const keys={},edge={};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)||(app==='match'&&e.code==='Slash'))e.preventDefault();
 if(e.code==='Escape'){if(app==='match')pause(true);else if(app==='paused')pause(false);}
 if(app!=='match')return;
 if(e.code==='KeyC'&&views[0])views[0].ballCam=!views[0].ballCam;
 if((e.code==='Backslash'||e.code==='Numpad1')&&views[1])views[1].ballCam=!views[1].ballCam;
 if(e.code==='KeyR'&&freeplay)fpReset=1;});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const KB=[{f:['KeyW'],b:['KeyS'],l:['KeyA'],r:['KeyD'],j:['Space'],bo:['ShiftLeft'],hb:['ControlLeft','KeyB'],rl:['KeyQ'],rr:['KeyE']},
 {f:['ArrowUp'],b:['ArrowDown'],l:['ArrowLeft'],r:['ArrowRight'],j:['Enter','Slash','Numpad0'],bo:['Period','ShiftRight','NumpadDecimal'],hb:['Comma','ControlRight'],rl:['Semicolon'],rr:['Quote']}];
const any=a=>a.some(k=>keys[k]);const padPrev=[{},{}];
function gp(i){const list=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];return opt.humans===2?list[i]:i===0?list[0]:null;}
function readHuman(c){const k=c.ctrl,i=c.human,solo=cars.filter(x=>x.human>=0).length===1;const maps=solo?[KB[0],KB[1]]:[KB[i]];
 const on=n=>maps.some(m=>any(m[n]));k.thr=(on('f')?1:0)-(on('b')?1:0);k.steer=(on('l')?1:0)-(on('r')?1:0);k.jump=on('j');k.boost=on('bo');k.hb=on('hb');k.roll=(on('rr')?1:0)-(on('rl')?1:0);

 const g=gp(i);if(g){const ax=g.axes,bt=g.buttons,pr=padPrev[i],dz=v=>Math.abs(v)>.18?v:0;const sx=dz(ax[0]||0),sy=dz(ax[1]||0),rt=bt[7]?.value||0,lt=bt[6]?.value||0;
  if(sx)k.steer=-sx;if(!c.ground){if(sy)k.thr=-sy;}else if(rt>.05||lt>.05)k.thr=rt-lt;
  if(bt[0]?.pressed)k.jump=true;if(bt[1]?.pressed)k.boost=true;if(bt[2]?.pressed)k.hb=true;if(bt[4]?.pressed)k.roll=-1;if(bt[5]?.pressed)k.roll=1;
  const v=views.find(v=>v.car===c);if(bt[3]?.pressed&&!pr.y&&v)v.ballCam=!v.ballCam;if(bt[9]?.pressed&&!pr.st)pause(app==='match');if(bt[8]?.pressed&&!pr.bk&&freeplay)fpReset=1;
  if(bt[0]?.pressed&&!pr.a)edge.PadA=true;pr.y=bt[3]?.pressed;pr.st=bt[9]?.pressed;pr.bk=bt[8]?.pressed;pr.a=bt[0]?.pressed;}}
function pause(on){if(on&&app==='match'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');}else if(!on&&app==='paused'){app='match';$('pause').hidden=true;document.body.classList.add('playing');}}

/* ================= simulation ================= */
function fixed(dt){time+=dt;
 for(const c of cars){if(c.demoT>0){c.demoT-=dt;if(c.demoT<=0)respawn(c);continue;}
  if(phase==='countdown'){const k=c.ctrl;k.thr=k.steer=k.roll=0;k.jump=k.boost=k.hb=false;continue;}
  if(c.script)c.script(c,ball,world,dt);else if(c.human<0||attract)think(c,world,dt);}
 if(phase==='countdown')return;
 for(const c of cars)PH.stepCar(c,dt,ev);
 for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++)PH.carCar(cars[i],cars[j],ev);
 if(!hideBall){for(const c of cars)PH.carBall(c,ball,ev);PH.stepBall(ball,dt,onBounce);}
 for(const p of pads)if(p.t>0)p.t-=dt;for(const c of cars)PH.padPickup(pads,c,dt,ev);
 if(phase==='play'&&!hideBall){const s=PH.goalSide(ball.p);if(s)scoreGoal(s);}
 if(phase==='play'&&(++recTick%2===0)){rec.push({b:[ball.p.x,ball.p.y,ball.p.z,ball.q.x,ball.q.y,ball.q.z,ball.q.w],c:cars.map(c=>[c.p.x,c.p.y,c.p.z,c.q.x,c.q.y,c.q.z,c.q.w,c.boosting?1:0,c.demoT>0?0:1,c.steerVis,c.super?1:0,c.wheelRot])});if(rec.length>420)rec.splice(0,60);}}
function makeWorld(){const pg=PH.predict(ball,3,1/30,pred);preGoal=pg;const threat=[null,null];if(pg){threat[pg.side>0?1:0]=pg;}
 world={ball,cars,pred,pads,diff,threat,size:Math.max(1,...[0,1].map(t=>cars.filter(c=>c.team===t).length)),time,kickT,kickoff:phase==='play'&&!kickTouched&&kickT<5};}
let roleT=0;
function step(dt){dt=Math.min(dt,.1);
 // per-frame input
 if(app==='match'){for(const c of cars)if(c.human>=0)readHuman(c);}
 const skip=edge.Space||edge.Enter||edge.PadA;for(const k in edge)delete edge[k];
 if(app==='paused'||app==='over'){if(app==='over')overT+=dt;visuals(dt);return;}
 // state machine
 if(phase==='countdown'){cdT-=dt;const n=Math.ceil(cdT);if(n!==lastBeep&&n>0){lastBeep=n;if(!attract)snd.play('beep',0);}if(cdT<=0){phase='play';goT=1;if(!attract)snd.play('beep',1);}}
 else if(phase==='play'){kickT+=dt;goT-=dt;if(!attract&&!freeplay){if(!overtime){clock-=dt;if(clock<=0){clock=0;if(score[0]===score[1]){overtime=true;otT=0;banner('OVERTIME','NEXT GOAL WINS','#ff4d00',2.4);snd.play('horn');kickoff();}else endMatch();}}else otT+=dt;}
  if(freeplay&&fpReset){fpReset=0;kickoff();}}
 else if(phase==='goal'){goalT+=dt;timeScale=goalT<.8?.3:1;if(goalT>2.9){if(replay){phase='replay';replay.t=0;$('replay').hidden=false;$('bars').classList.add('on');}else if(freeplay){kickoff();}else if(attract)kickoff();else if(overtime)endMatch();else kickoff();}}
 else if(phase==='replay'){const r=replay,dur=(r.frames.length-1)/60;if(!r.end){r.t+=dt*.5;if(skip&&r.t>.3)r.t=dur;if(r.t>=dur){r.t=dur;r.end=.001;goalBoom(goalInfo.p,goalInfo.team,false);}}else{r.end+=dt;if(r.end>1.6||skip&&r.end>.2){$('replay').hidden=true;$('bars').classList.remove('on');if(overtime)endMatch();else kickoff();}}}
 else if(phase==='end'){endT+=dt;timeScale=.5;if(endT>2.6){timeScale=1;showOver();return;}}
 if(phase==='countdown')timeScale=1;
 // physics
 if(phase!=='replay'){if((roleT-=dt)<=0){makeWorld();assignRoles(cars,ball,pred);roleT=.2;}makeWorld();acc+=dt*timeScale;let n=0;while(acc>=DT&&n<16){fixed(DT);acc-=DT;n++;}if(n>=16)acc=0;}
 visuals(dt);}

/* ================= visuals ================= */
const acc3=new V(),iq=new THREE.Quaternion(),rearL=new V(),rearR=new V(),fwd=new V();
function carVis(c,p,q,boosting,vis,steer,sup,wr,dt){const m=c.mesh,u=m.userData;m.visible=vis;if(!vis){c.trail.push(p,false,dt);return;}
 m.position.copy(p);m.quaternion.copy(q);
 if(dt>0){tv.subVectors(p,c.vp).divideScalar(dt);acc3.subVectors(tv,c.vv).divideScalar(dt);c.vv.copy(tv);c.vp.copy(p);if(acc3.lengthSq()>250000)acc3.set(0,0,0);
  iq.copy(q).invert();acc3.applyQuaternion(iq);const r=Math.min(1,dt*7);u.pitch+=(cl(acc3.z*.0016,-.06,.06)-u.pitch)*r;u.roll+=(cl(-acc3.x*.0013,-.07,.07)-u.roll)*r;
  u.suspV+=(-u.susp*240-u.suspV*14-cl(acc3.y,-300,300)*.02)*dt;u.susp=cl(u.susp+u.suspV*dt,-.2,.14);}
 u.body.position.y=-CAR.ride+u.susp;u.body.rotation.set(u.pitch,0,u.roll);
 for(const w of u.wheels){if(w.front)w.piv.rotation.y=steer*.42;w.spin.rotation.x=wr;w.piv.position.y=w.base+Math.max(0,u.susp*.4);}
 u.flame.visible=boosting;if(boosting){u.fm.uniforms.uS.value=.8+Math.random()*.4;u.fm.uniforms.uT.value=time;u.flame.scale.set(1,1,.8+Math.random()*.5);
  fwd.set(0,0,1).applyQuaternion(q);rearL.set(.42,.5-CAR.ride,-2.2).applyQuaternion(q).add(p);rearR.set(-.42,.5-CAR.ride,-2.2).applyQuaternion(q).add(p);const gc=TEAM[c.team].glow;
  for(const r of[rearL,rearR])parts.emit(r.x,r.y,r.z,-fwd.x*14+rnd(4)-2,-fwd.y*14+rnd(4)-2,-fwd.z*14+rnd(4)-2,gc.r*.45+.35,gc.g*.45+.25,gc.b*.45+.1,.32,.22,0,3);}
 tv.set(0,.1-CAR.ride*.2,-2).applyQuaternion(q).add(p);c.trail.push(tv,!!sup,dt);
 if(sup&&Math.random()<.6)parts.emit(tv.x+rnd(1)-.5,tv.y+rnd(1)-.5,tv.z+rnd(1)-.5,0,0,0,2.4,2.2,1.8,.35,.4);}
function visuals(dt){const live=!(phase==='replay'&&replay),vt=time;
 if(live){for(const c of cars)carVis(c,c.p,c.q,c.boosting&&c.demoT<=0,c.demoT<=0,c.steerVis,c.super,c.wheelRot,dt);ballG.position.copy(ball.p);ballG.quaternion.copy(ball.q);}
 else{const r=replay,fi=Math.min(r.frames.length-1.001,r.t*60),i=Math.floor(fi),f=fi-i,A=r.frames[i],B=r.frames[i+1];
  const lerpQ=(a,b,o)=>tq.set(a[o],a[o+1],a[o+2],a[o+3]).slerp(new THREE.Quaternion(b[o],b[o+1],b[o+2],b[o+3]),f);
  cars.forEach((c,k)=>{const a=A.c[k],b=B.c[k];if(!a||!b)return;tv2.set(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f);const qq=lerpQ(a,b,3).clone();carVis(c,tv2,qq,!!a[7],!!a[8],a[9],!!a[10],a[11]+(b[11]-a[11])*f,dt*.5);});
  ballG.position.set(A.b[0]+(B.b[0]-A.b[0])*f,A.b[1]+(B.b[1]-A.b[1])*f,A.b[2]+(B.b[2]-A.b[2])*f);ballG.quaternion.copy(lerpQ(A.b,B.b,3));}
 const bv=!(hideBall&&live)&&!(replay&&replay.end>0&&!live);ballG.visible=bv;ballLight.visible=bv;ballLight.position.copy(ballG.position);
 ballTrail.push(ballG.position,bv&&(live?ball.v.length()>48:true)&&!(phase==='countdown'),dt);
 ballG.userData.halo.material.opacity=.55+Math.sin(vt*3)*.1;
 parts.update(dt);shocks.update(dt);padVis(vt);if(arena.ads)arena.ads.offset.x=(vt*.012)%1;arena.time.value=vt;hype=Math.max(0,hype-dt*.25);arena.hype.value=hype;snd.hype&&snd.ac&&snd.hype(hype);
 for(const n of arena.nets){n.U.uT.value+=dt;}
 flash.intensity*=Math.exp(-dt*3.2);bloomKick*=Math.exp(-dt*1.8);
 // engine audio
 views.forEach((v,i)=>{if(snd.ac)snd.engine(i,v.car.v.length(),v.car.boosting,app==='match'&&v.car.demoT<=0&&phase!=='replay');});if(app!=='match'&&snd.ac)snd.engines.forEach((e,i)=>snd.engine(i,0,false,false));
 cameras(dt);hud(dt);}

/* ================= cameras ================= */
const want=new V(),look=new V(),Qc=PH.mkQ();let menuA=0;
function keepIn(p,m){PH.query(p,Qc);if(Qc.d<m)p.addScaledVector(Qc.n,m-Qc.d);}
function camFor(v,dt){const c=v.car,cam=v.cam;let k=1-Math.exp(-dt*9),kl=1-Math.exp(-dt*14);
 if(phase==='replay'&&replay){// follow the scorer's view of the play, slightly wider
  const fr=replay.frames,fi=Math.min(fr.length-1,replay.t*60|0),idx=cars.indexOf(goalInfo.scorer||c),cp=fr[fi].c[idx]||fr[fi].c[0],bp=ballG.position;
  tv.set(cp[0],cp[1],cp[2]);tv2.set(bp.x-tv.x,0,bp.z-tv.z);if(tv2.lengthSq()<1)tv2.set(0,0,goalInfo.side);tv2.normalize();want.copy(tv).addScaledVector(tv2,-13).add(new V(0,5.5,0));look.copy(tv).lerp(bp,.72);look.y+=1;k=1-Math.exp(-dt*5);kl=1-Math.exp(-dt*7);v.fovT=64;}
 else if(c.demoT>0){want.copy(v.pos);look.copy(c.p);}
 else if(v.ballCam&&!hideBall){tv2.set(ball.p.x-c.p.x,0,ball.p.z-c.p.z);if(tv2.lengthSq()<1)c.fwd(tv2).setY(0);tv2.normalize();const dist=ball.p.distanceTo(c.p);
  want.copy(c.p).addScaledVector(tv2,-11).add(tv.set(0,3.7+Math.min(3,Math.max(0,ball.p.y-c.p.y-6)*.12),0));look.copy(c.p).add(tv.set(0,1.6,0)).lerp(ball.p,dist<10?.4:.66);v.fovT=74;}
 else{c.fwd(tv2);tv2.y*=.25;if(!c.ground&&c.v.lengthSq()>100){tv.copy(c.v).normalize();tv.y*=.3;tv2.lerp(tv,.5);}tv2.normalize();want.copy(c.p).addScaledVector(tv2,-10.5).add(tv.set(0,3.4,0));look.copy(c.p).addScaledVector(tv2,5).add(tv.set(0,1.3,0));v.fovT=74;}
 if(c.super)v.fovT+=7;else if(c.boosting)v.fovT+=3;
 if(v.snap){v.pos.copy(want);v.look.copy(look);v.snap=false;}else{v.pos.lerp(want,k);v.look.lerp(look,kl);}keepIn(v.pos,1.6);
 v.fov+=(v.fovT-v.fov)*Math.min(1,dt*4);cam.fov=v.fov;cam.position.copy(v.pos);v.shake=Math.max(0,v.shake-dt*1.6);const s=v.shake*v.shake*.9;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.position.z+=(Math.random()-.5)*s;cam.lookAt(v.look);}
function cameras(dt){if(app==='match'||app==='paused'){views.forEach(v=>camFor(v,dt));return;}
 if(app==='over'&&overMvp){const a=overT*.3+2.2,p=overMvp.mesh.position;mainCam.position.set(p.x+Math.cos(a)*8.5,p.y+1.7,p.z+Math.sin(a)*8.5);mainCam.fov=44;mainCam.lookAt(p.x-Math.sin(a)*3.4,p.y+.6,p.z+Math.cos(a)*3.4);return;}
 menuA+=dt*.045;const r=1;mainCam.position.set(Math.cos(menuA)*96*r,38+Math.sin(menuA*.7)*8,Math.sin(menuA)*118*r);keepIn(mainCam.position,4);mainCam.fov=56;want.copy(ball.p).multiplyScalar(.55);want.y=6;mainCam.lookAt(want);}

/* ================= HUD ================= */
let feedEl=$('feed'),banT=0;const mini=$('mini').getContext('2d');
function feed(t,team){const d=document.createElement('div');d.textContent=t;d.className=team===0?'b':team===1?'o':'';feedEl.prepend(d);setTimeout(()=>d.remove(),4200);while(feedEl.children.length>5)feedEl.lastChild.remove();}
function banner(t,s,col,dur){$('bt').textContent=t;$('bt').style.color=col;$('bs').textContent=s;$('banner').classList.add('on');banT=dur;}
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
function setTxt(el,v,cache,key){if(cache[key]!==v){cache[key]=v;el.textContent=v;}}
const hc={};
function hud(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}
 if(app!=='match'&&app!=='paused')return;
 setTxt($('s0'),score[0],hc,'s0');setTxt($('s1'),score[1],hc,'s1');setTxt($('clock'),freeplay?'∞':overtime?'+'+fmt(otT):fmt(clock),hc,'clk');setTxt($('ot'),freeplay?'FREEPLAY':overtime?'OVERTIME':'',hc,'ot');
 $('clock').style.color=!overtime&&!freeplay&&clock<=30?'#ff4d00':'';
 for(const v of views){const c=v.car;const b=Math.round(c.boost);setTxt(v.dnum,c.inf?'∞':b,v.last,'b');const arc=(212*c.boost/100).toFixed(1);if(v.last.arc!==arc){v.last.arc=arc;v.dfg.setAttribute('stroke-dasharray',arc+' 400');}
  v.dial.classList.toggle('ss',!!c.super);v.camEl.classList.toggle('on',v.ballCam);
  let cd='';if(phase==='countdown')cd=Math.max(1,Math.ceil(cdT));else if(phase==='play'&&goT>0&&!freeplay)cd='GO!';setTxt(v.cd,cd,v.last,'cd');v.cd.classList.toggle('go',cd==='GO!');
  const fr=phase==='countdown'?cdT%1:goT;v.cd.style.opacity=cd?Math.min(1,fr*3+.2):0;v.cd.style.transform=`scale(${1+fr*.35})`;
  setTxt(v.msg,c.demoT>0?`DEMOLISHED · RESPAWN ${Math.ceil(c.demoT)}`:freeplay?'R / BACK · RESET':'',v.last,'msg');}
 if(!$('mini').hidden)drawMini();
 const sec=Math.ceil(clock);if(sec!==lastClockSec||hc.js!==score.join()){lastClockSec=sec;hc.js=score.join();drawJumbo();}}
function drawMini(){const w=112,h=156,s=Math.min(100/(2*W),144/(2*(L+GD))),cx=w/2,cy=h/2;const me=views[0]&&views[0].car,flip=me&&me.team===1?-1:1;mini.clearRect(0,0,w,h);
 mini.strokeStyle='rgba(255,255,255,.35)';mini.lineWidth=1;mini.beginPath();mini.roundRect(cx-W*s,cy-L*s,2*W*s,2*L*s,14*s);mini.stroke();mini.beginPath();mini.moveTo(cx-W*s,cy);mini.lineTo(cx+W*s,cy);mini.stroke();
 for(const t of[0,1]){const z=(t?L:-L)*flip;mini.fillStyle=TEAM[t].css;mini.fillRect(cx-GW*s,cy-z*s-(z>0?GD*s:0),2*GW*s,GD*s);}
 const P=(x,z)=>[cx-x*s*flip,cy-z*s*flip];
 for(const c of cars){if(c.demoT>0)continue;const[x,y]=P(c.p.x,c.p.z);mini.fillStyle=TEAM[c.team].css;mini.beginPath();mini.arc(x,y,c.human>=0?4:3,0,7);mini.fill();if(c.human>=0){mini.strokeStyle='#fff';mini.lineWidth=1.5;mini.stroke();}}
 if(!hideBall){const[x,y]=P(ball.p.x,ball.p.z);mini.fillStyle='#fff';mini.beginPath();mini.arc(x,y,3.2,0,7);mini.fill();}}
function drawJumbo(){const{c,t}=arena.jumbo,x=c.getContext('2d'),w=c.width,h=c.height;x.fillStyle='#05070d';x.fillRect(0,0,w,h);
 const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#1546d0');g.addColorStop(.38,'#0a1640');g.addColorStop(.62,'#401a08');g.addColorStop(1,'#e05000');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<h;i+=3)x.fillRect(0,i,w,1);x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.font='92px Anton, Impact, sans-serif';
 const sc=app==='menu'?['ROCKET','ARENA']:[score[0],score[1]];if(app==='menu'){x.font='70px Anton, Impact, sans-serif';x.fillText('ROCKET ARENA',w/2,h/2);}else{x.fillText(sc[0],w*.16,h/2+4);x.fillText(sc[1],w*.84,h/2+4);x.font='54px Anton, Impact, sans-serif';x.fillText(freeplay?'FREEPLAY':overtime?'+'+fmt(otT):fmt(clock),w/2,h/2+4);}
 t.needsUpdate=true;}

/* ================= rendering ================= */
const POST={exposure:1.05,bloom:.62,bloomThreshold:.86,bloomRadius:.55,vignette:.36,saturation:1.1,grain:.025,ao:false};
let fxFull=null,fxSplit=[],gfx=quality();
function applyQuality(q){gfx=q;mirror.on=q>0;mirror.scale=q>=2?.6:.42;mirror.U.uReflStr.value=q>0?.42:0;key.castShadow=q>0;R.shadowMap.needsUpdate=true;fxFull=null;fxSplit=[];}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function getFx(i,w,h,cam){if(i<0){if(!fxFull||fxFull.cam!==cam){fxFull=cinematic(R,scene,cam,POST);fxFull.cam=cam;fxFull.w=0;}if(fxFull.w!==w*9999+h){fxFull.w=w*9999+h;fxFull.setSize(w,h);}return fxFull;}
 let f=fxSplit[i];if(!f||f.cam!==cam){f=fxSplit[i]=cinematic(R,scene,cam,{...POST,bloom:.5});f.cam=cam;f.w=0;}if(f.w!==w*9999+h){f.w=w*9999+h;f.setSize(w,h);}return f;}
function renderView(cam,x,y,w,h,fxi){cam.aspect=w/h;cam.updateProjectionMatrix();parts.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 for(const c of cars)c.trail.update(cam);ballTrail.update(cam);
 mirror.render(R,scene,cam,w*R.getPixelRatio(),h*R.getPixelRatio(),[arena.pitch]);
 R.setViewport(x,y,w,h);R.setScissor(x,y,w,h);const f=getFx(fxi,w,h,cam);if(f.bloom)f.bloom.strength=(fxi<0?POST.bloom:.5)+bloomKick+(views.some(v=>v.car.super)?.08:0);f.render();}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);
 R.shadowMap.needsUpdate=true;
 if((app==='match'||app==='paused')&&views.length===2){R.setScissorTest(true);renderView(views[0].cam,0,h/2,w,h/2,0);renderView(views[1].cam,0,0,w,h/2,1);R.setScissorTest(false);}
 else{R.setScissorTest(false);renderView(app==='match'||app==='paused'?views[0].cam:mainCam,0,0,w,h,-1);}}
addEventListener('resize',()=>{fxFull&&(fxFull.w=0);fxSplit.forEach(f=>f&&(f.w=0));});

/* ================= menu wiring ================= */
const seg=(id,key)=>{const el=$(id);const set=v=>{opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));};set(opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(+b.dataset.v));};
seg('o-mode','size');seg('o-pl','humans');seg('o-diff','diff');
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Rocket Arena\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'} ${a.score||''}\nGoals: ${a.goals||0} · Saves: ${a.saves||0}\nMode: ${a.mode||''}${a.split?' split-screen':''} · CPU ${a.diff||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] rocket3d '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= loop ================= */
toMenu();drawJumbo();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.ROCKET={get state(){return app==='match'?phase:app;},get app(){return app;},get phase(){return phase;},step,render,start,toMenu,ball,get cars(){return cars;},get score(){return score;},pads,
 setClock(s){clock=s;},get clock(){return clock;},get overtime(){return overtime;},get replay(){return replay;},get goalInfo(){return goalInfo;},
 setIdle(team,on=true){cars.forEach(c=>{if(c.team===team)c.idle=on;});},skip(){edge.Enter=true;},keys,PH,scene,R,get views(){return views;},get time(){return time;},get rec(){return rec;},kickoff,pause,
 setQuality:applyQuality,clearTrails(){cars.forEach(c=>c.trail.clear());ballTrail.clear();},get stats(){return cars.map(c=>({name:c.name,team:c.team,...c.stats}));},parts,cam:()=>views[0]?views[0].cam:mainCam};
