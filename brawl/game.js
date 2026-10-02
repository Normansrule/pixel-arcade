// PLATFORM BRAWL — full 3D platform fighter. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {World,blankInput,DECAY} from './sim.js';
import {ROSTER,STAT_NAMES} from './fighters.js';
import {STAGES,cloneStage} from './stagedata.js';
import {buildStage} from './stages.js';
import {makeRig,animate} from './rig.js';
import {Particles,Trail,Shocks,Sparks,Beams,FX} from './fx.js';
import {think} from './ai.js';
import {Sound} from './sound.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a,DT=1/60;
const SLOT=['#ff4d4d','#3d8bff','#ffd23a','#4ade80'],SLOTC=SLOT.map(c=>new THREE.Color(c));
const css=c=>'#'+new THREE.Color(c).getHexString();
const ID='platformbrawl';

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance',antialias:false});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const hemi=new THREE.HemisphereLight(0xffffff,0x222222,.6);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffffff,2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-30,right:30,top:24,bottom:-14,near:1,far:120});key.shadow.bias=-.0004;key.shadow.normalBias=.03;scene.add(key,key.target);
const rim=new THREE.DirectionalLight(0xffffff,1);scene.add(rim);const rim2=new THREE.DirectionalLight(0xffffff,0);scene.add(rim2);
const flash=new THREE.PointLight(0xffffff,0,60,1.4);scene.add(flash);
const parts=new Particles(scene,6000),shocks=new Shocks(scene,12),sparks=new Sparks(scene,28),beams=new Beams(scene,4);
const cam=new THREE.PerspectiveCamera(30,1,.5,2600);
const snd=new Sound();

/* ================= state ================= */
let opt={mode:0,time:3,stock:3,n:4,humans:1,lv:5,stage:0,items:0,p1:0,p2:1};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_brawl_opt'))||{});}catch(e){}
let app='menu',phase='countdown',world=null,FV=[],stageVis=null,stageIdx=-1,time=0,acc=0,timeScale=1,clock=0,cdT=0,annT=0,endT=0,overT=0,attract=true,sudden=false,lastSec=-1;
let shake=0,bloomKick=0,zoomKick=0,finalHit=null,koOrder=[],result=null,lastAward=null,camPos=new V(0,6,40),camLook=new V(0,3,0),camDist=40,ambAcc=0,manual=[],paused=false,hudCache={};
let fxPost=null,gfx=quality(),postOpts={},camHold=0;let autoplay=false;

/* ================= stage ================= */
function loadStage(i){if(stageIdx===i&&stageVis)return;if(stageVis)stageVis.dispose();stageIdx=i;const S=cloneStage(i);stageVis=buildStage(scene,R,S,gfx);stageVis.data=S;
 scene.environment=stageVis.env;scene.fog=new THREE.Fog(stageVis.fog.c,stageVis.fog.near,stageVis.fog.far);scene.background=new THREE.Color(stageVis.bg);
 const L=stageVis.light;hemi.color.set(L.hemi[0]);hemi.groundColor.set(L.hemi[1]);hemi.intensity=L.hemi[2];key.color.set(L.key[0]);key.intensity=L.key[1];key.position.set(...L.key[2]);rim.color.set(L.rim[0]);rim.intensity=L.rim[1];rim.position.set(...L.rim[2]);
 if(L.rim2){rim2.color.set(L.rim2[0]);rim2.intensity=L.rim2[1];rim2.position.set(...L.rim2[2]);}else rim2.intensity=0;
 postOpts={exposure:1,bloom:.6,bloomThreshold:.85,bloomRadius:.5,vignette:.32,saturation:1.1,grain:.025,ao:false,...stageVis.post};fxPost=null;}
function makePost(){fxPost=cinematic(R,scene,cam,{...postOpts,quality:gfx});fxPost.w=0;}

/* ================= fighters ================= */
function clearFighters(){for(const v of FV){for(const o of [v.rig.root,v.trail.mesh,v.swoosh.mesh,v.scarf&&v.scarf.mesh,v.plat])if(o){scene.remove(o);o.traverse(m=>{if(m.geometry&&m.geometry!==platGeo&&m.geometry!==platRing)m.geometry.dispose();if(m.material)m.material.dispose();});}}FV=[];$('cards').innerHTML='';$('tags').innerHTML='';$('edges').innerHTML='';}
const platGeo=new THREE.CylinderGeometry(1.1,.7,.22,28),platRing=new THREE.TorusGeometry(1.15,.06,8,40).rotateX(Math.PI/2);
function addFighter(defIdx,o){const def=ROSTER[defIdx];const dup=world.f.filter(f=>f.def===def).length;const f=world.add(def,{...o,alt:dup%2});f.alt=dup%2;f.elimF=0;
 const rig=makeRig(def,f.alt);scene.add(rig.root);const glowC=new THREE.Color(f.alt?def.look.alt.glow:def.look.glow);
 const trail=new Trail(scene,28,.3,glowC.clone().multiplyScalar(.75),{minD:.04,taper:.1});const swoosh=new Trail(scene,9,.2,new THREE.Color(1.6,1.6,1.7),{minD:.002,taper:.05});
 const scarf=def.look.scarf?new Trail(scene,18,.12,glowC.clone().multiplyScalar(.9),{minD:.004,taper:.4}):null;
 const plat=new THREE.Group();plat.add(new THREE.Mesh(platGeo,new THREE.MeshStandardMaterial({color:0x101018,emissive:glowC,emissiveIntensity:.6,roughness:.3,metalness:.7})));plat.add(new THREE.Mesh(platRing,new THREE.MeshBasicMaterial({color:glowC.clone().multiplyScalar(2)})));plat.visible=false;scene.add(plat);
 const v={f,rig,trail,swoosh,scarf,plat,glowC,css:css(glowC),slot:f.slot,lastDmg:0,lastStocks:f.stocks,card:null,tag:null,edge:null,cmb:0,cmbT:0,pos:new V(),shakeT:0};FV.push(v);f.vis=v;return f;}
function hudFor(v){const f=v.f,c=SLOT[f.slot%4],lbl=f.human>=0?'P'+(f.human+1):'CPU';
 const card=document.createElement('div');card.className='dc';card.style.setProperty('--c',c);
 card.innerHTML=`<div class="por" style="background:radial-gradient(circle at 35% 30%,#fff5,transparent 60%),${v.css};box-shadow:0 0 18px ${v.css}">${f.def.name[0]}</div><div class="nm">${f.def.name}</div><div class="tg">${lbl}${f.human<0?' '+f.lvl:''}</div><div class="pc">0<small>%</small></div><div class="st"></div><div class="pw"></div><div class="cb"></div>`;$('cards').appendChild(card);
 v.card=card;v.pc=card.querySelector('.pc');v.st=card.querySelector('.st');v.pw=card.querySelector('.pw');v.cb=card.querySelector('.cb');
 const tag=document.createElement('div');tag.className='tagx';tag.style.setProperty('--c',c);tag.textContent=f.human>=0?'P'+(f.human+1):'CPU';$('tags').appendChild(tag);v.tag=tag;
 const e=document.createElement('div');e.className='edge';e.style.setProperty('--c',c);e.innerHTML=`${f.def.name[0]}<small>${Math.round(f.dmg)}%</small>`;e.hidden=true;$('edges').appendChild(e);v.edge=e;v.edgeS=e.querySelector('small');}

/* ================= match flow ================= */
function newWorld(o){world=new World(cloneStage(o.stage),{mode:o.mode,items:o.items,ev});stageVis.plats.forEach((m,i)=>m.userData.p=world.stage.plats[i]);for(const o of projVis.values()){disposeVis(o.g);if(o.tr)disposeVis(o.tr.mesh);}projVis.clear();for(const g of itemVis.values())disposeVis(g);itemVis.clear();}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);try{localStorage.setItem('pxd_brawl_opt',JSON.stringify(opt));}catch(e){}snd.init();
 attract=false;app='match';paused=false;loadStage(opt.stage);clearFighters();newWorld({stage:opt.stage,mode:opt.mode?'stock':'time',items:!!opt.items});
 const n=Math.max(opt.n,opt.humans);const picks=[opt.p1];if(opt.humans===2)picks.push(opt.p2);const pool=[...Array(8).keys()].filter(i=>!picks.includes(i)).sort(()=>Math.random()-.5);while(picks.length<n)picks.push(pool.pop());
 picks.forEach((p,i)=>{const pk=p<0?rnd(8)|0:p;const f=addFighter(pk,{human:i<opt.humans?i:-1,lvl:opt.lv,stocks:opt.mode?opt.stock:99,name:ROSTER[pk].name});f.name=i<opt.humans?(opt.humans===2?'P'+(i+1):'YOU'):ROSTER[pk].name;});
 for(const v of FV)hudFor(v);
 clock=opt.time*60;sudden=false;finalHit=null;koOrder=[];result=null;timeScale=1;acc=0;manual=[];lastSec=-1;hudCache={};
 phase='countdown';cdT=3.6;lastBeep=4;parts.clear();camSnap=true;
 $('menu').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;$('bars').classList.remove('on');document.body.classList.add('playing');$('feed').innerHTML='';$('pops').innerHTML='';
 $('mode').textContent=opt.mode?'STOCK · '+opt.stock:'TIME';announce('',0);}
let lastBeep=4,camSnap=true;
function toMenu(){app='menu';attract=true;paused=false;loadStage(opt.stage);clearFighters();newWorld({stage:opt.stage,mode:'time',items:false});
 const p1=opt.p1<0?rnd(8)|0:opt.p1;const mate=[...Array(8).keys()].filter(i=>i!==p1)[rnd(7)|0];addFighter(p1,{human:-1,lvl:9,stocks:99});addFighter(mate,{human:-1,lvl:3,stocks:99});
 phase='play';clock=1e9;timeScale=1;finalHit=null;camSnap=true;
 $('menu').hidden=false;$('keys').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('bars').classList.remove('on');document.body.classList.remove('playing');refreshMenu();}
function pause(on){if(on&&app==='match'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');}else if(!on&&app==='paused'){app='match';$('pause').hidden=true;document.body.classList.add('playing');}}
function standings(){const fs=world.f.slice();if(world.mode==='stock'){return fs.sort((a,b)=>{const ao=a.st==='out',bo=b.st==='out';if(ao!==bo)return ao?1:-1;if(ao)return b.elimF-a.elimF;return b.stocks-a.stocks||a.dmg-b.dmg;});}
 return fs.sort((a,b)=>b.score-a.score||a.stats.falls-b.stats.falls||b.stats.dealt-a.stats.dealt);}
function tiedTop(){const s=standings();const t=s[0];if(world.mode==='stock')return s.filter(f=>f.st!=='out'&&f.stocks===t.stocks);return s.filter(f=>f.score===t.score);}
function timeUp(){const tied=tiedTop();if(tied.length>1&&!sudden){startSudden(tied);return;}
 if(sudden){const al=world.f.filter(f=>f.st!=='out');al.sort((a,b)=>a.dmg-b.dmg);endGame(al[0],'TIME!');return;}endGame(standings()[0],'TIME!');}
function startSudden(tied){sudden=true;world.sudden=true;world.mode='stock';for(const f of world.f){if(tied.includes(f)){f.stocks=1;const sp=world.stage.spawns[tied.indexOf(f)%4];f.reset(sp[0],sp[1],sp[0]>0?-1:1);world.snapGround(f);f.st='idle';f.dmg=300;}else{f.st='out';f.elimF=-1;}}
 world.proj.length=0;world.items.length=0;clock=30;phase='countdown';cdT=5.6;lastBeep=6;announce('SUDDEN DEATH','EVERYONE AT 300% · ONE HIT ENDS IT',3,'#ff2a2a');snd.say('Sudden death!');}
function checkEnd(){if(attract||phase!=='play')return;const al=world.f.filter(f=>f.st!=='out');
 if(world.mode==='stock'){if(al.length<=1){endGame(al[0]||standings()[0],'GAME!');return;}if(!al.some(f=>f.human>=0)&&world.f.some(f=>f.human>=0)){endGame(standings()[0],'GAME!');}}}
function endGame(winner,word){if(phase==='game')return;phase='game';endT=0;result={winner,word,order:standings(),final:!!finalHit};if(winner&&winner.st!=='out'&&world.mode==='stock'){}announce(word,'',2.6,'#ff4d00');snd.say(word==='TIME!'?'Time!':'Game!');snd.play('cheer');hype=1;}
function showOver(){app='over';$('hud').hidden=true;document.body.classList.remove('playing');$('bars').classList.remove('on');timeScale=1;finalHit=null;
 const order=result.order;const w=result.winner||order[0];if(order[0]!==w){order.splice(order.indexOf(w),1);order.unshift(w);}
 // podium: winner front and centre, the rest behind
 const S=world.stage.solids[0];world.proj.length=0;world.items.length=0;
 order.forEach((f,i)=>{f.x=i===0?0:(i%2?-1:1)*(1.6+Math.floor((i-1)/2)*1.6);f.y=S.y;f.ground=S;f.vx=f.vy=f.kx=f.ky=0;f.hitlag=0;f.move=null;f.vanish=false;f.inv=0;f.st=i===0?'win':'lose';f.winPose=(rnd()<.5)|0;f.face=i===0?1:(f.x<0?1:-1);f.t=0;f.vis.zOff=i===0?1.2:-1.2;f.vis.plat.visible=false;f.vis.rig.shield.visible=false;f.vis.trail.clear();f.vis.swoosh.clear();});
 parts.burst(new V(0,3,0),220,14,[FV[w.slot].glowC.clone().multiplyScalar(1.4),new THREE.Color(1.6,1.5,1.2),new THREE.Color(1.2,.4,.9)],.4,3,{up:true,grav:5,drag:.6,flat:1});
 const me=world.f.find(f=>f.human===0),two=world.f.some(f=>f.human===1);const won=me&&w===me;
 $('oeye').textContent=(result.word==='TIME!'?'TIME':'GAME')+' · '+world.stage.name+(sudden?' · SUDDEN DEATH':'');
 $('ores').textContent=two?(w.human>=0?'P'+(w.human+1)+' WINS':w.def.name+' WINS'):won?'VICTORY':w.def.name+' WINS';$('ores').style.color=FV[w.slot].css;
 $('osub').textContent=two||won?`${w.def.name} TAKES IT ON ${world.stage.name}`:me?`YOU PLACED #${order.indexOf(me)+1} OF ${order.length}`:'';
 const head='<tr><th></th><th>FIGHTER</th><th>KOS</th><th>FALLS</th><th>SDS</th><th>DEALT</th><th>TAKEN</th><th>COMBO</th><th>BIG HIT</th><th>'+(world.mode==='stock'&&!sudden?'STOCKS':'SCORE')+'</th></tr>';
 $('stats').innerHTML=head+order.map((f,i)=>`<tr class="${f.human>=0?'me':''}" style="--c:${SLOT[f.slot%4]}"><td class="rk">${i+1}</td><td>${f.def.name}${f.human>=0?' · P'+(f.human+1):' · CPU '+f.lvl}</td><td>${f.stats.kos}</td><td>${f.stats.falls}</td><td>${f.stats.sds}</td><td>${Math.round(f.stats.dealt)}%</td><td>${Math.round(f.stats.taken)}%</td><td>${f.stats.maxCombo}</td><td>${f.stats.big}</td><td>${world.mode==='stock'&&!sudden?Math.max(0,f.stocks):(f.score>0?'+':'')+f.score}</td></tr>`).join('');
 const tok=award(me,won,order.indexOf(me)+1,order.length);$('otok').textContent=me?`+${tok} TOKENS · ${lastAward.pts} PTS · BEST ${best()} PTS`:'';
 $('over').hidden=false;overT=0;snd.say((w.human>=0&&!two?'Victory! ':'')+'The winner is '+w.def.name.toLowerCase()+'!',.95,.6);}
function award(me,won,rank,n){if(!me)return 0;const s=me.stats;const pts=Math.max(0,Math.round(s.kos*100+s.dealt-s.falls*40-s.sds*60+(won?500:0)+(n-rank)*60+s.maxCombo*10));
 lastAward={pts,won,kos:s.kos,falls:s.falls,dealt:Math.round(s.dealt),rank,n,fighter:me.def.name,stage:world.stage.name,mode:opt.mode?`stock ${opt.stock}`:`time ${opt.time}m`,lv:opt.lv,two:opt.humans===2};
 const tok=5+Math.min(60,pts/20|0);try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID;if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+ID)||0);}catch(e){return 0;}}

/* ================= simulation events → juice ================= */
let hype=0;const tv=new V(),tv2=new V();
function col(fx,i=0){const c=FX[fx]||FX.impact;return c[i%c.length];}
function ev(type,a,b,c){if(!world)return;const quiet=attract;
 switch(type){
  case 'hit':{const v=b,info=c,kb=info.kb||0,p=tv.set(info.x,info.y,0);const k=Math.min(1,kb/200);
   sparks.fire(p,col(info.fx).clone().multiplyScalar(info.lk?.3:.5),info.lk?.6:Math.min(1.7,.7+k*1.2+(info.d||0)*.02),.12+k*.08);
   parts.burst(p,(info.lk?4:8)+(kb*.25|0),4+k*14,[col(info.fx,0),col(info.fx,1),new THREE.Color(1.2,1.2,1.2)],.13+k*.1,.22+k*.3,{drag:3,grav:6,flat:.3});
   if(kb>80)shocks.fire(p,col(info.fx).clone().multiplyScalar(.6),.8+k*1.6,.2+k*.1);if(kb>150)shocks.fire(p,col(info.fx).clone().multiplyScalar(.35),.8+k*1.1,.25,true);
   shake=Math.max(shake,Math.min(1,.06+k*.8));if(!quiet)snd.play(info.lk?'light':'hit',kb||8,info.fx);
   const fv=v.vis;if(fv){fv.card&&(fv.card.classList.remove('hit'),void fv.card.offsetWidth,fv.card.classList.add('hit'));if(info.combo>=3&&!info.lk){fv.cmb=info.combo;fv.cmbT=1.4;}}
   if(!quiet&&kb>0){const pk=predictKO(v);const deciding=pk&&isDeciding(v);
    if(deciding&&!finalHit){finalHit={v,t:0};timeScale=.1;v.hitlag+=10;if(a)a.hitlag+=10;$('bars').classList.add('on');bloomKick=.6;zoomKick=1;snd.play('star');pop(p,'FINAL HIT!','#ffd23a',true);}
    else if(pk){v.hitlag+=6;if(a&&!info.proj)a.hitlag+=6;zoomKick=Math.max(zoomKick,.55);bloomKick=Math.max(bloomKick,.25);flashScreen(.18);if(rnd()<.6)pop(p,['SMASH!','LAUNCHED!','BYE-BYE!','WHAM!'][rnd(4)|0],'#ff8a3a',true);}
    else if(kb>140)pop(p,'CRUSHING!','#ffb04a');else if(info.combo>=4&&!info.lk)pop(p,info.combo+' HIT COMBO','#ffd23a');
    if(kb>40&&v.ky<-.2&&!v.ground)pop(p,'SPIKE!','#7ad8ff',true);hype=Math.min(1,hype+k*.5);}
   flash.position.set(p.x,p.y,2);flash.color.copy(col(info.fx));flash.intensity=Math.max(flash.intensity,10+kb*.3);break;}
  case 'shieldhit':{const p=tv.set(c.x,c.y,0);sparks.fire(p,new THREE.Color(.7,.9,1.4),.8,.12);if(!quiet)snd.play('shield');break;}
  case 'shieldbreak':{const p=tv.set(a.x,a.y+a.H*.5,0);parts.burst(p,90,12,[a.vis.glowC,new THREE.Color(1.5,1.5,1.5)],.25,.8,{drag:2,grav:4});shocks.fire(p,a.vis.glowC,4,.5,true);if(!quiet){snd.play('break');pop(p,'SHIELD BREAK!','#ff5a5a',true);}shake=Math.max(shake,.5);break;}
  case 'armor':{const p=tv.set(c.x,c.y,0);sparks.fire(p,new THREE.Color(1.6,1.2,.6),1.1,.14);if(!quiet)snd.play('shield');break;}
  case 'counter':{const p=tv.set(a.x,a.y+a.H*.5,0);shocks.fire(p,a.vis.glowC.clone().multiplyScalar(1.4),3,.35,true);sparks.fire(p,new THREE.Color(1.6,1.6,1.8),3,.3);if(!quiet){snd.play('counter');pop(p,'COUNTER!','#7ef6ff',true);}break;}
  case 'reflect':{const p=tv.set(a.x,a.y+a.H*.5,0);shocks.fire(p,a.vis.glowC,2.4,.25);if(!quiet)snd.play('reflect');break;}
  case 'grab':if(!quiet)snd.play('grab');break;
  case 'throw':if(!quiet)snd.play('throw');break;
  case 'pummel':{const v=b;sparks.fire(tv.set(v.x,v.y+v.H*.6,0),new THREE.Color(1.4,1.2,.8),.7,.1);if(!quiet)snd.play('light');break;}
  case 'proj':if(!quiet)snd.play('proj',b.t0==='bolt'?1:0);break;
  case 'boom':{const p=tv.set(a.x,a.y,0),R=b;parts.burst(p,90,10+R*4,[new THREE.Color(2.6,1.2,.3),new THREE.Color(2,.5,.1),new THREE.Color(1.2,1.2,1.2)],.4,.7,{drag:2.4,grav:2});parts.burst(p,24,3,new THREE.Color(.25,.22,.2),.9,1.4,{up:true,drag:1,grav:-1.5});
   shocks.fire(p,new THREE.Color(1.2,.55,.15),R*1.2,.35,true);sparks.fire(p,new THREE.Color(2,1.4,.6),R*2.2,.25);flash.position.set(p.x,p.y,2);flash.color.setRGB(1,.6,.3);flash.intensity=160;shake=Math.max(shake,.45);if(!quiet)snd.play('boom');break;}
  case 'clash':{const p=tv.set((a.x+b.x)/2,(a.y+b.y)/2,0);sparks.fire(p,new THREE.Color(1.6,1.6,1.6),1.4,.15);if(!quiet)snd.play('shield');break;}
  case 'jump':case 'djump':{const f=a;if(type==='djump'){f.vis.rig.state.djT=.45;parts.burst(tv.set(f.x,f.y,0),12,3,f.vis.glowC.clone().multiplyScalar(.6),.25,.35,{drag:3,flat:.2});}else dust(f,10);f.vis.rig.squash(type==='jump'?-.12:-.08);if(!quiet&&f.human>=0)snd.play(type);break;}
  case 'land':{const f=a;if(b<-.15){dust(f,8+(Math.min(1,-b*2)*10|0));f.vis.rig.squash(Math.min(.3,-b*.6));if(!quiet&&f.human>=0)snd.play('land',-b);}break;}
  case 'knockdown':case 'bounce':{const f=a;dust(f,16);f.vis.rig.squash(.25);shake=Math.max(shake,.15);if(!quiet)snd.play('land',.6);break;}
  case 'wallbounce':shake=Math.max(shake,.2);break;
  case 'tech':{const f=a;parts.burst(tv.set(f.x,f.y+.3,0),20,5,new THREE.Color(1.4,1.4,1.6),.2,.3,{drag:3});if(!quiet){snd.play('shield');pop(tv.set(f.x,f.y+f.H,0),'TECH!','#9ad8ff');}break;}
  case 'move':{const f=a,m=f.move;if(!quiet&&m&&f.human>=0||(!quiet&&rnd()<.5))snd.play('swing',m&&m.ai?Math.min(1,m.ai.d/16):.3);break;}
  case 'ledge':{const f=a;if(f.ledge)sparks.fire(tv.set(f.ledge.ex,f.ledge.ey,0),f.vis.glowC.clone(),.6,.12);break;}
  case 'quake':{const f=a;dust(f,30);shocks.fire(tv.set(f.x,f.y+.2,0),new THREE.Color(1.2,1,.8),3,.35);shake=Math.max(shake,.35);if(!quiet)snd.play('boom');break;}
  case 'vanish':case 'appear':{const f=a;parts.burst(tv.set(f.x,f.y+f.H*.5,0),24,4,[f.vis.glowC,new THREE.Color(.3,.2,.5)],.3,.4,{drag:3});break;}
  case 'dodge':break;
  case 'item':break;
  case 'pickup':if(!quiet)snd.play('grab');break;
  case 'toss':if(!quiet)snd.play('throw');break;
  case 'collect':{const f=a,it=b;parts.burst(tv.set(f.x,f.y+f.H*.5,0),40,5,it.type==='heal'?new THREE.Color(.4,2,.6):new THREE.Color(2.2,1.7,.4),.25,.7,{up:true,drag:2});if(!quiet){snd.play(it.type==='heal'?'heal':'power');pop(tv.set(f.x,f.y+f.H+.5,0),it.type==='heal'?'-30%':'POWER UP!',it.type==='heal'?'#6aff8a':'#ffd23a');}break;}
  case 'hazwarn':if(stageVis.haz)stageVis.haz.warn(a);if(!quiet){snd.play('warn');}break;
  case 'hazon':if(stageVis.haz)stageVis.haz.on(a);if(!quiet)snd.play(world.stage.hazard.kind==='laser'?'proj':'boom',1);shake=Math.max(shake,.3);break;
  case 'hazoff':if(stageVis.haz)stageVis.haz.off(a);break;
  case 'ko':koFx(a,b,c);break;
  case 'revive':{const f=a;parts.burst(tv.set(f.x,f.y+1,0),40,4,[f.vis.glowC,new THREE.Color(1.5,1.5,1.5)],.25,.8,{drag:2});break;}
  case 'trump':break;
 }}
function dust(f,n){parts.burst(tv.set(f.x,f.y+.08,0),n,3.2,[new THREE.Color(.55,.52,.5),new THREE.Color(.4,.38,.36)],.4,.5,{drag:3.5,grav:-.6,flat:.6});}
function predictKO(v){let x=v.x,y=v.y+v.H*.5,kx=v.kx,ky=v.ky,vy=0;const B=world.stage.blast,g=v.def.grav,F=v.def.fall;
 for(let i=0;i<200;i++){const km=Math.hypot(kx,ky);if(km>0){const nm=Math.max(0,km-DECAY);kx*=nm/km;ky*=nm/km;}vy=Math.max(vy-g,-F);x+=kx;y+=ky+vy;if(x<B.l||x>B.r||y>B.t)return true;if(km<.01&&i>v.hitstun)return false;}return false;}
function isDeciding(v){if(sudden)return true;if(world.mode==='stock'){const al=world.f.filter(f=>f.st!=='out');return v.stocks<=1&&al.length===2;}return false;}
function koFx(f,killer,p){const S=world.stage;const vis=FV[f.slot];
 // pin the blast to the visible edge of the screen and fire it back toward the stage
 const s0=S.solids[0],hh=Math.tan(cam.fov*Math.PI/360)*camDist,hw=hh*cam.aspect;const ox=cl(cl(p.x,camPos.x-hw+1.2,camPos.x+hw-1.2),s0.x0-7,s0.x1+7),oy=cl(cl(p.y,camLook.y-hh+1.2,camLook.y+hh-1.2),s0.y-3,s0.y+15);const o=tv.set(ox,oy,0);camHold=.55;
 const dir=tv2.set(-ox*.4+(0-ox),3-oy,0).normalize();const c=vis.glowC.clone().multiplyScalar(1.3);
 beams.fire(o,dir,c.clone().multiplyScalar(1.1),Math.max(hw,hh)*1.5,Math.max(2.6,hh*.24),1.1);beams.fire(o,dir,new THREE.Color(.9,.9,.9),Math.max(hw,hh)*1.1,Math.max(.8,hh*.07),.7);
 parts.burst(o,180,22,[c,new THREE.Color(1.6,1.5,1.3),c.clone().multiplyScalar(.5)],.5,1.1,{dir,spread:1.2,drag:1.6,grav:2,flat:.4});shocks.fire(o,c,6,.5,true);shocks.fire(o,new THREE.Color(1,1,1),9,.7);
 flash.position.set(o.x,o.y,3);flash.color.copy(vis.glowC);flash.intensity=260;bloomKick=Math.max(bloomKick,.5);shake=Math.max(shake,1);vis.trail.clear();vis.swoosh.clear();
 if(attract)return;snd.play('ko');snd.play('cheer');hype=1;flashScreen(.12);edgeBlast(o,vis.css);
 const fe=document.createElement('div');fe.innerHTML=killer?`<b style="color:${SLOT[killer.slot%4]}">${killer.def.name}</b> ✸ <b style="color:${SLOT[f.slot%4]}">${f.def.name}</b>`:`<b style="color:${SLOT[f.slot%4]}">${f.def.name}</b> SELF-DESTRUCT`;$('feed').prepend(fe);setTimeout(()=>fe.remove(),4500);while($('feed').children.length>5)$('feed').lastChild.remove();
 if(f.st==='out'){f.elimF=world.frame;pop(o,f.def.name+' IS OUT','#ff5a5a',true);}
 if(finalHit&&finalHit.v===f){finalHit=null;timeScale=.35;}
 checkEnd();}
let flashA=0;function edgeBlast(o,c){const s=project(o);if(!s)return;const e=document.createElement('div');e.className='kob';e.style.background=`radial-gradient(ellipse at ${s.x}px ${s.y}px, ${c} 0%, ${c}99 12%, transparent 46%)`;$('pops').appendChild(e);setTimeout(()=>e.remove(),1100);}
function flashScreen(a){flashA=Math.max(flashA,a);}
function pop(p,txt,color,big){if(attract)return;const s=project(p);if(!s)return;const e=document.createElement('div');e.className='pop'+(big?' big':'');e.textContent=txt;e.style.color=color;e.style.left=cl(s.x,80,innerWidth-80)+'px';e.style.top=cl(s.y,80,innerHeight-140)+'px';$('pops').appendChild(e);setTimeout(()=>e.remove(),950);}
function announce(t,s,dur,color){$('annt').textContent=t;$('anns').textContent=s||'';$('ann').style.setProperty('--ac',color||'#ff4d00');if(t){$('ann').classList.remove('on');void $('ann').offsetWidth;$('ann').classList.add('on');}else $('ann').classList.remove('on');annT=dur||0;}

/* ================= input ================= */
const keys={},edge={};
const GAMEK=new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Slash','Quote','Enter','Comma','Period','KeyJ','KeyK','KeyL','KeyI','KeyU','Tab']);
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(app==='match'&&GAMEK.has(e.code))e.preventDefault();if(e.code==='Space'&&app!=='menu')e.preventDefault();
 if(e.code==='Escape'){if(app==='match')pause(true);else if(app==='paused')pause(false);}
 if(e.code==='KeyM'){snd.on=!snd.on;snd.voice=snd.on;if(!snd.on&&window.speechSynthesis)speechSynthesis.cancel();}
 if(e.code==='Enter'&&app==='menu'&&!e.repeat)start();});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const KB=[{l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],jump:['Space'],atk:['KeyJ'],spc:['KeyK'],smash:['KeyL'],shield:['KeyI','ShiftLeft'],grab:['KeyU']},
 {l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],jump:['Numpad0'],atk:['Comma','Numpad1'],spc:['Period','Numpad2'],smash:['Slash','Numpad3'],shield:['ShiftRight','NumpadDecimal'],grab:['Enter','NumpadEnter']}];
const padPrev=[{},{}],PK=['jumpP','atkP','spcP','smashP','shieldP','grabP'];
function mergeIn(prev,I){if(!prev)return I;for(const k of PK)I[k]=I[k]||prev[k];if(prev.smashP&&!I.sx&&!I.sy){I.sx=prev.sx;I.sy=prev.sy;}return I;}
function pads(){return navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];}
function readHuman(i){const solo=opt.humans===1,maps=solo?KB:[KB[i]];const on=n=>maps.some(m=>m[n].some(k=>keys[k])),pr=n=>maps.some(m=>m[n].some(k=>edge[k]));
 const I=blankInput();I.x=(on('r')?1:0)-(on('l')?1:0);I.y=(on('u')?1:0)-(on('d')?1:0);I.jump=on('jump');I.jumpP=pr('jump');I.atk=on('atk');I.atkP=pr('atk');I.spc=on('spc');I.spcP=pr('spc');I.smash=on('smash');I.smashP=pr('smash');I.shield=on('shield');I.shieldP=pr('shield');I.grabP=pr('grab');
 const list=pads(),g=solo?list[0]:list.length===1?(i===1?list[0]:null):list[i];if(g){const a=g.axes,b=g.buttons,P=padPrev[i],dz=v=>Math.abs(v)>.24?v:0,btn=k=>!!(b[k]&&b[k].pressed),edg=(k,n)=>btn(k)&&!P[n];
  const lx=dz(a[0]||0)+(btn(15)?1:0)-(btn(14)?1:0),ly=-dz(a[1]||0)+(btn(12)?1:0)-(btn(13)?1:0);if(lx)I.x=cl(lx,-1,1);if(ly)I.y=cl(ly,-1,1);
  const rx=a[2]||0,ry=-(a[3]||0),rm=Math.hypot(rx,ry);if(rm>.6){I.smash=true;if(!P.rs){I.smashP=true;I.sx=rx;I.sy=ry;}}
  if(btn(0))I.atk=true;if(edg(0,'a'))I.atkP=true;if(btn(1))I.spc=true;if(edg(1,'b'))I.spcP=true;if(btn(2)||btn(3))I.jump=true;if(edg(2,'x')||edg(3,'y'))I.jumpP=true;
  if(btn(5)||btn(6)||btn(7))I.shield=true;if(edg(5,'rb')||edg(6,'lt')||edg(7,'rt'))I.shieldP=true;if(edg(4,'lb'))I.grabP=true;
  if(edg(9,'st')){if(app==='match')pause(true);else if(app==='paused')pause(false);else if(app==='menu'||app==='over')start();}
  Object.assign(P,{a:btn(0),b:btn(1),x:btn(2),y:btn(3),rb:btn(5),lt:btn(6),rt:btn(7),lb:btn(4),st:btn(9),rs:rm>.6});}
 return I;}
function menuPads(){for(let i=0;i<2;i++){const g=pads()[i];if(!g)continue;const b=g.buttons,P=padPrev[i];const st=!!(b[9]&&b[9].pressed);if(st&&!P.st){if(app==='paused')pause(false);else if(app==='menu'||app==='over')start();}P.st=st;}}

/* ================= main step ================= */
let lastClockAnn=-1;
function step(dt){dt=Math.min(dt,.1);time+=dt;
 if(app==='match'){for(const f of world.f)if(f.human>=0)f.inpNext=mergeIn(f.inpNext,readHuman(f.human));}else menuPads();
 for(const k in edge)delete edge[k];
 if(app==='paused'){visuals(0);return;}
 if(app==='over'){overT+=dt;visuals(dt);return;}
 // flow
 if(app==='match'){
  if(phase==='countdown'){cdT-=dt;const n=Math.ceil(cdT-.6);if(n!==lastBeep&&n>0&&n<=3){lastBeep=n;announce(String(n),'',1,'#ffffff');snd.play('beep',0);}if(cdT<=.6&&lastBeep!==0){lastBeep=0;announce('GO!','',.9,'#ff4d00');snd.play('beep',1);snd.say('Go!',1.1,.8);}if(cdT<=0)phase='play';}
  else if(phase==='play'){clock-=dt;const s=Math.ceil(clock);
   if(s!==lastClockAnn){lastClockAnn=s;if(!sudden&&s===60&&opt.time>1){announce('1 MINUTE','',1.6,'#ffd23a');snd.say('One minute remaining');}if(!sudden&&s===30){announce('30 SECONDS','',1.4,'#ffd23a');}if(s<=10&&s>0){announce(String(s),'',.8,'#ff4d00');snd.play('tick');}}
   if(clock<=0){clock=0;timeUp();}else checkEnd();}
  else if(phase==='game'){endT+=dt;timeScale=endT<1?.3:1;if(endT>2.8){showOver();return;}}
  if(finalHit){finalHit.t+=dt;if(finalHit.t>1.5){timeScale=.6;}if(finalHit.t>3){finalHit=null;timeScale=1;$('bars').classList.remove('on');}}
  else if(phase==='play'&&timeScale<1)timeScale=Math.min(1,timeScale+dt*2);
 }
 // fixed simulation
 const run=app==='match'?phase!=='countdown':true;acc+=dt*timeScale;let n=0;
 while(acc>=DT&&n<8){if(run){for(const f of world.f){if(manual[f.slot])f.inp=manual[f.slot];else if(f.human>=0&&!attract&&!autoplay){f.inp=f.inpNext||blankInput();}else think(f,world);}world.step();for(const f of world.f)if(f.inpNext)for(const k of PK)f.inpNext[k]=false;}acc-=DT;n++;}if(n>=8)acc=0;
 if(phase==='countdown'&&app==='match'){for(const f of world.f)f.inp=blankInput();}
 visuals(dt*(phase==='countdown'?1:timeScale),dt);}

/* ================= visuals ================= */
const projVis=new Map(),itemVis=new Map();const PG={sph:new THREE.SphereGeometry(1,18,12),cap:new THREE.CapsuleGeometry(.5,1.2,4,10),star:(()=>{const s=new THREE.Shape();for(let i=0;i<8;i++){const r=i%2?.38:1,a=i/8*Math.PI*2;s[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}return new THREE.ExtrudeGeometry(s,{depth:.12,bevelEnabled:false}).center();})(),
 star5:(()=>{const s=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?.45:1,a=i/10*Math.PI*2+Math.PI/2;s[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r);}return new THREE.ExtrudeGeometry(s,{depth:.25,bevelEnabled:true,bevelSize:.06,bevelThickness:.06}).center();})(),
 wave:new THREE.TorusGeometry(.8,.22,8,20,Math.PI),pillar:new THREE.CylinderGeometry(.9,1.1,1,18,1,true),disc:new THREE.CylinderGeometry(.5,.55,.22,16),missile:new THREE.CylinderGeometry(.16,.2,.9,10).rotateZ(Math.PI/2),cross:new THREE.BoxGeometry(.7,.22,.22)};
const shared=new Set(Object.values(PG));function disposeVis(o){scene.remove(o);o.traverse(m=>{if(m.geometry&&!shared.has(m.geometry))m.geometry.dispose();if(m.material)m.material.dispose();});}
function glowMat(c,i=2.5){return new THREE.MeshStandardMaterial({color:0x0a0a0a,emissive:c,emissiveIntensity:i,roughness:.4});}
function projMesh(p){const o=p.owner,c=o?o.vis.glowC:new THREE.Color(1,1,1);const g=new THREE.Group();let core;
 switch(p.t0){case 'bolt':core=new THREE.Mesh(PG.cap,glowMat(new THREE.Color(1,.85,.25),4));core.rotation.z=Math.PI/2;core.scale.set(p.r*1.2,p.r*1.6,p.r*1.2);break;
  case 'star4':core=new THREE.Mesh(PG.star,new THREE.MeshStandardMaterial({color:0x404050,metalness:.9,roughness:.25,emissive:c,emissiveIntensity:.8}));core.scale.setScalar(p.r*1.3);break;
  case 'orb':core=new THREE.Mesh(PG.sph,glowMat(c,3.5));core.scale.setScalar(p.r);const sh=new THREE.Mesh(PG.sph,new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(.5),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));sh.scale.setScalar(1.6);core.add(sh);break;
  case 'star':core=new THREE.Mesh(PG.star5,glowMat(new THREE.Color(1,.9,.5),3));core.scale.setScalar(p.r*1.1);break;
  case 'wave':core=new THREE.Mesh(PG.wave,new THREE.MeshStandardMaterial({color:0x40e0e0,emissive:c,emissiveIntensity:1.2,transparent:true,opacity:.8,roughness:.1,metalness:.2}));core.scale.setScalar(p.r*1.6);break;
  case 'pillar':core=new THREE.Mesh(PG.pillar,new THREE.MeshStandardMaterial({color:0x60f0ff,emissive:c,emissiveIntensity:1.4,transparent:true,opacity:.7,roughness:.05,side:THREE.DoubleSide,depthWrite:false}));core.scale.set(p.r*1.1,p.pillar.h,p.r*1.1);core.position.y=p.pillar.h/2;break;
  case 'mine':core=new THREE.Mesh(PG.disc,new THREE.MeshStandardMaterial({color:0x2a2a30,metalness:.8,roughness:.3}));const lt=new THREE.Mesh(PG.sph,glowMat(c,3));lt.scale.setScalar(.14);lt.position.y=.15;core.add(lt);core.userData.lt=lt;break;
  case 'bomb':core=new THREE.Mesh(PG.sph,new THREE.MeshStandardMaterial({color:0x22242a,metalness:.6,roughness:.3}));core.scale.setScalar(p.r);const fz=new THREE.Mesh(PG.sph,glowMat(new THREE.Color(1,.6,.2),4));fz.scale.setScalar(.25);fz.position.set(.4,.8,0);core.add(fz);const band=new THREE.Mesh(new THREE.TorusGeometry(1,.12,6,20),glowMat(c,2));band.rotation.x=Math.PI/2;core.add(band);break;
  case 'missile':core=new THREE.Mesh(PG.missile,new THREE.MeshStandardMaterial({color:0xd8dce4,metalness:.7,roughness:.3}));const nose=new THREE.Mesh(new THREE.ConeGeometry(.16,.35,10).rotateZ(-Math.PI/2),glowMat(c,2.5));nose.position.x=.6;core.add(nose);break;
  default:core=new THREE.Mesh(PG.sph,glowMat(c,3));core.scale.setScalar(p.r);}
 g.add(core);g.userData.core=core;const tr=['bolt','star','orb','missile','star4'].includes(p.t0)?new Trail(scene,14,p.r*.8,(p.t0==='bolt'?new THREE.Color(1.4,1.1,.3):c.clone()).multiplyScalar(1.2),{minD:.01}):null;scene.add(g);return{g,tr,p};}
function itemMesh(it){const g=new THREE.Group();let core;if(it.type==='heal'){core=new THREE.Group();const a=new THREE.Mesh(PG.cross,glowMat(new THREE.Color(.3,1.6,.5),3)),b=a.clone();b.rotation.z=Math.PI/2;core.add(a,b);const bub=new THREE.Mesh(PG.sph,new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.25,roughness:.05,metalness:.2,depthWrite:false}));bub.scale.setScalar(.6);core.add(bub);}
 else if(it.type==='power'){core=new THREE.Mesh(PG.star5,glowMat(new THREE.Color(1.6,1.2,.2),2.5));core.scale.setScalar(.5);}
 else{core=new THREE.Mesh(PG.sph,new THREE.MeshStandardMaterial({color:0x1a1a1e,metalness:.5,roughness:.35}));core.scale.setScalar(.42);const fz=new THREE.Mesh(PG.sph,glowMat(new THREE.Color(1,.4,.1),4));fz.scale.setScalar(.3);fz.position.set(.3,.95,0);core.add(fz);const sk=new THREE.Mesh(new THREE.TorusGeometry(1,.1,6,20),new THREE.MeshStandardMaterial({color:0xd03030,roughness:.5}));sk.rotation.x=Math.PI/2;core.add(sk);}
 core.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.add(core);g.userData.core=core;scene.add(g);return g;}
const tq=new V(),ampV=new V();
function visuals(dt,rdt=dt){const t=time;
 if(world){
  // fighters
  for(const v of FV){const f=v.f,rig=v.rig;const show=!['dead','out'].includes(f.st)&&!f.vanish;rig.root.visible=show;
   v.plat.visible=f.st==='revive';if(v.plat.visible){v.plat.position.set(f.x,f.y-.12,0);v.plat.rotation.y=t*.8;}
   if(!show){v.trail.push(tq.set(f.x,f.y+f.H*.5,0),false,dt);v.swoosh.push(tq,false,dt);if(v.scarf)v.scarf.clear();continue;}
   const frozen=f.hitlag>0;animate(rig,f,frozen?0:dt,t);
   let sx=0,sy=0;if(frozen&&(f.st==='stun'||f.st==='tumble'||f.st==='held')){const a=.07+Math.min(.18,(f.lastKb||0)*.0008);sx=(rnd()-.5)*a*2;sy=(rnd()-.5)*a;}
   rig.root.position.set(f.x+sx,f.y+sy,(app==='over'?(v.zOff||0):0));
   // fades: dodges, invincibility, respawn blink
   let fade=1;if(['dodge','roll','adodge'].includes(f.st)&&f.inv>0)fade=.42;else if(f.inv>0&&f.st!=='ledge'&&f.st!=='lget'&&app==='match'&&f.inv>20)fade=.6+.4*Math.sin(t*30);rig.setFade(fade);
   // emissive pulses: hurt flash, smash charge, power-up
   const U=rig.rimU;if(f.flash>0){U.uFlC.value.setRGB(1,1,1);U.uFl.value=f.flash/6;}else if(f.charging){U.uFlC.value.setRGB(1,.8,.25);U.uFl.value=.25+.25*Math.sin(t*40);}else if(f.power>0){U.uFlC.value.copy(v.glowC);U.uFl.value=.18+.1*Math.sin(t*10);}else if(f.st==='dizzy'){U.uFlC.value.setRGB(1,.9,.2);U.uFl.value=.15+.15*Math.sin(t*12);}else U.uFl.value=0;
   U.uRimS.value=f.st==='helpless'?.15:.55;
   rig.mats.glow.emissiveIntensity=f.st==='helpless'?.6:2.4+(f.charging?Math.sin(t*40)*1.5:0);
   // shield bubble
   const sh=rig.shield;sh.visible=f.st==='shield'||f.st==='sstun';if(sh.visible){const k=Math.max(.15,f.shield/50);sh.scale.setScalar(.45+.55*k);sh.material.uniforms.uA.value=.6+.4*k+(f.st==='sstun'?.6:0);sh.material.uniforms.uC.value.copy(v.glowC).lerp(new THREE.Color(1,.2,.2),1-k);}
   // launch trail + smoke
   const sp=Math.hypot(f.kx,f.ky);const launched=(f.st==='tumble'||f.st==='stun')&&sp>.2;v.trail.push(tq.set(f.x,f.y+f.H*.5,0),launched,dt,8);
   if(launched&&rnd()<sp*3*dt*60*.25){parts.emit(f.x+rnd(.4)-.2,f.y+f.H*.5+rnd(.4)-.2,rnd(.4)-.2,(rnd()-.5)*.6,(rnd()-.5)*.6,0,.32,.3,.3,.7,.8,-.5,1.2);if(sp>.45)parts.emit(f.x,f.y+f.H*.5,0,0,0,0,v.glowC.r*.8,v.glowC.g*.8,v.glowC.b*.8,.5,.35);}
   // limb swoosh during active frames
   let swing=false;if(f.st==='atk'&&f.move&&f.move.h.length){const mv=f.move;for(const h of mv.h)if(f.mt>=h.s-1&&f.mt<=h.e+1&&!h.grab)swing=true;}
   rig.root.updateMatrixWorld(true);if(f.move&&f.move.lb)rig.limb(f.move.lb).getWorldPosition(tq);else rig.limb('hR').getWorldPosition(tq);v.swoosh.col.copy(v.glowC).multiplyScalar(.9).addScalar(.35);if(!swing&&v.swoosh.str<.05)v.swoosh.clear();v.swoosh.push(tq,swing&&!frozen,dt,22);
   if(v.scarf){rig.fx.scarfAnchor.getWorldPosition(tq);tq.x-=f.face*.05;v.scarf.push(tq,true,dt,10);const P=v.scarf.pts;for(let i=1;i<P.length;i++){P[i].y-=dt*.6*i*.08;P[i].x-=f.face*dt*.3;}}
   // per-fighter particle accents
   if(f.def.id==='ember'&&rnd()<.35){rig.joints.head.getWorldPosition(tq);parts.emit(tq.x+rnd(.3)-.15,tq.y+.25,tq.z,(rnd()-.5)*.3,1.2+rnd(),0,2.4,.9,.15,.18,.35,-1,1);}
   if(f.st==='atk'&&f.mname==='uspec'&&f.def.id==='cog'){for(const n of rig.fx.nozzles){n.getWorldPosition(tq);parts.emit(tq.x,tq.y,tq.z,(rnd()-.5)*.8,-5-rnd(3),0,2.4,1.4,.4,.3,.25,0,2);}}
   if(f.st==='atk'&&f.mname==='nspec'&&f.move&&f.move.sp&&f.move.sp.kind==='breath'&&f.mt>=f.move.sp.a&&f.mt<f.move.sp.a+f.move.sp.max){rig.joints.head.getWorldPosition(tq);for(let i=0;i<3;i++)parts.emit(tq.x+f.face*.3,tq.y-.1,tq.z,f.face*(8+rnd(5)),(rnd()-.5)*2.5,(rnd()-.5)*1.5,2.6,.9+rnd(.6),.15,.35+rnd(.3),.28,-2,2);}
   if(f.charging&&rnd()<.5){parts.emit(f.x+rnd(1.6)-.8,f.y+rnd(f.H),0,0,1.5,0,v.glowC.r,v.glowC.g,v.glowC.b,.18,.4,0,1);}
   if(f.power>0&&rnd()<.3)parts.emit(f.x+rnd(1)-.5,f.y+rnd(f.H),0,0,1.2,0,2,1.6,.4,.16,.5,0,1);
   if(f.st==='dizzy'&&rnd()<.25){parts.emit(f.x+Math.cos(t*6)*.5,f.y+f.H+.25,Math.sin(t*6)*.5,0,0,0,1.8,1.6,.4,.22,.3);}
   if(f.st==='run'&&rnd()<.08)dust(f,1);
   if(stageVis.water!==undefined&&stageVis.water!==null&&!f.ground&&v.pos.y>stageVis.water&&f.y<=stageVis.water&&f.x>world.stage.blast.l){parts.burst(tq.set(f.x,stageVis.water,0),40,7,[new THREE.Color(.8,1.1,1.3),new THREE.Color(1.2,1.3,1.4)],.3,.8,{up:true,grav:14,drag:.5});}
   v.pos.set(f.x,f.y,0);}
  // projectiles
  const seen=new Set();for(const p of world.proj){seen.add(p.id);let o=projVis.get(p.id);if(!o){o=projMesh(p);projVis.set(p.id,o);}const core=o.g.userData.core;o.g.position.set(p.x,p.y,0);
   if(p.t0==='star4'||p.t0==='star')core.rotation.z+=dt*(p.t0==='star4'?30:6);if(p.t0==='missile'||p.t0==='bolt'){o.g.rotation.z=Math.atan2(p.vy,p.vx)-(p.t0==='bolt'?0:0);if(p.t0==='missile'&&rnd()<.8)parts.emit(p.x-Math.cos(o.g.rotation.z)*.5,p.y-Math.sin(o.g.rotation.z)*.5,0,(rnd()-.5),(rnd()-.5),0,2.4,1.2,.3,.25,.3,0,2);}
   if(p.t0==='wave'){o.g.rotation.z=p.vx>0?0:Math.PI;o.g.position.y=p.y-.45;core.scale.setScalar(p.r*1.6*(1+Math.sin(t*20)*.08));if(rnd()<.6)parts.emit(p.x+(rnd()-.5),p.y-.3,(rnd()-.5)*.8,(rnd()-.5)*2,2+rnd(2),0,.5,1.4,1.6,.18,.5,6,1);}
   if(p.t0==='pillar'){const k=Math.min(1,p.t/4)*(p.t>p.life-5?(p.life-p.t)/5:1);core.scale.set(p.r*1.1*k+.01,p.pillar.h*Math.min(1,p.t/3),p.r*1.1*k+.01);if(rnd()<.8)parts.emit(p.x+(rnd()-.5)*1.4,p.y+rnd(p.pillar.h),(rnd()-.5),0,4,0,.6,1.6,1.8,.22,.4,8,1);}
   if(p.t0==='mine'&&core.userData.lt)core.userData.lt.material.emissiveIntensity=p.armed?(Math.sin(t*14)>0?6:.5):.8;
   if(p.t0==='bomb'){core.rotation.z-=p.vx*dt*30;}
   if(p.t0==='orb'){core.scale.setScalar(p.r*(1+Math.sin(t*25)*.06));if(rnd()<.5)parts.emit(p.x,p.y,0,(rnd()-.5),(rnd()-.5),0,p.owner.vis.glowC.r,p.owner.vis.glowC.g,p.owner.vis.glowC.b,p.r*.6,.3);}
   if(o.tr)o.tr.push(o.g.position,true,dt,12);}
  for(const[id,o]of projVis){if(!seen.has(id)){disposeVis(o.g);if(o.tr)disposeVis(o.tr.mesh);projVis.delete(id);}}
  const seenI=new Set();for(const it of world.items){seenI.add(it.id);let g=itemVis.get(it.id);if(!g){g=itemMesh(it);itemVis.set(it.id,g);}g.position.set(it.x,it.y+(it.held?0:.45+Math.sin(t*3)*.08*(it.ground?1:0)),it.held?.4:0);g.userData.core.rotation.y=t*2;if(it.type!=='bomb'&&rnd()<.2)parts.emit(it.x+rnd(.6)-.3,it.y+.5+rnd(.4),0,0,.8,0,it.type==='heal'?.4:2,it.type==='heal'?1.8:1.6,it.type==='heal'?.6:.3,.15,.6);if(it.type==='bomb'&&rnd()<.6)parts.emit(it.x+.13,it.y+.85,0,(rnd()-.5)*.5,1,0,2.4,1.2,.3,.12,.3,0,2);}
  for(const[id,g]of itemVis){if(!seenI.has(id)){disposeVis(g);itemVis.delete(id);}}
  if(stageVis){stageVis.update(t,dt,world,cam);if(stageVis.haz&&stageVis.haz.tick)stageVis.haz.tick(t,world.haz,world);
   const A=stageVis.amb;if(A){ambAcc+=dt*A.n;while(ambAcc>1){ambAcc--;const c=A.col[rnd(A.col.length)|0];parts.emit(A.area[0]+rnd(A.area[1]-A.area[0]),A.area[2]+rnd(A.area[3]-A.area[2]),-6+rnd(10),A.vx*(.5+rnd()),A.vy*(.5+rnd()),0,c.r,c.g,c.b,A.size*(.6+rnd(.8)),A.rain?1.4:5+rnd(4),0,0);}}}
 }
 parts.update(dt);shocks.update(dt,cam);sparks.update(dt);beams.update(dt);
 flash.intensity*=Math.exp(-rdt*7);if(flashA>0){flashA=Math.max(0,flashA-rdt*1.6);$('flashv').style.opacity=flashA.toFixed(3);}bloomKick*=Math.exp(-rdt*2.4);zoomKick*=Math.exp(-rdt*3);hype=Math.max(0,hype-rdt*.2);if(snd.ac)snd.hype(app==='match'?.25+hype*.7:0);
 cameraUpdate(rdt);hud(rdt);}

/* ================= camera ================= */
function cameraUpdate(dt){const S=world.stage,B=S.blast,s0=S.solids[0];const aspect=innerWidth/innerHeight;cam.aspect=aspect;
 let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,n=0;
 if(app==='over'&&result){const w=result.winner||result.order[0];const a=Math.sin(overT*.22)*.5+.15;const d=10;camPos.set(w.x+Math.sin(a)*d,w.y+2.6+Math.sin(overT*.4)*.3,Math.cos(a)*d+1.2);camLook.set(w.x,w.y+1.3,0);cam.fov=34;cam.position.copy(camPos);cam.lookAt(camLook);const W=innerWidth,H=innerHeight;cam.setViewOffset(W,H,-W*(W>900?.27:.05),0,W,H);cam.updateProjectionMatrix();return;}
 for(const f of world.f){if(f.st==='dead'||f.st==='out')continue;if(app==='menu'&&f.slot>0&&Math.abs(f.x-world.f[0].x)>9)continue;const px=cl(f.x,B.l+6,B.r-6),py=cl(f.y,B.b+6,B.t-4);x0=Math.min(x0,px-1.6);x1=Math.max(x1,px+1.6);y0=Math.min(y0,py-.5);y1=Math.max(y1,py+f.H+1.2);n++;}
 if(!n){x0=s0.x0;x1=s0.x1;y0=s0.y-2;y1=s0.y+6;}
 // always keep a bit of stage in shot
 x0=Math.min(x0,cl((x0+x1)/2-4,s0.x0,s0.x1));x1=Math.max(x1,cl((x0+x1)/2+4,s0.x0,s0.x1));y0=Math.min(y0,s0.y-1.5)-(app==='match'?2.2:0);
 let cx=(x0+x1)/2,cy=(y0+y1)/2;const w=Math.max(16,x1-x0+4),h=Math.max(9,y1-y0+3);const tf=Math.tan(cam.fov*Math.PI/360);let dist=Math.max(h/2/tf,w/2/tf/aspect)*1.04;
 if(finalHit){const v=finalHit.v;cx=v.x;cy=v.y+v.H*.5;dist=11;}
 if(window.BRAWL&&BRAWL.camOverride){const o=BRAWL.camOverride;cx=o.x;cy=o.y;dist=o.dist;camSnap=true;}
 dist=cl(dist*(1-zoomKick*.18),12,app==='menu'?24:68);if(app==='menu'){dist=Math.max(dist,13.5);}
 if(camHold>0){camHold-=dt;dist=camDist;cx=camLook.x;cy=camLook.y-.4;}
 const k=camSnap?1:1-Math.exp(-dt*(finalHit?6:3.2));camSnap=false;camDist+=(dist-camDist)*k;camLook.x+=(cx-camLook.x)*k;camLook.y+=(cy+.4-camLook.y)*k;
 camPos.set(camLook.x*.92,camLook.y+camDist*.13+.8,camDist);
 shake=Math.max(0,shake-dt*2.2);const sa=shake*shake*.6;cam.fov=30;cam.position.set(camPos.x+(rnd()-.5)*sa,camPos.y+(rnd()-.5)*sa,camPos.z);cam.lookAt(camLook.x,camLook.y,0);
 if(app==='menu'){const W=innerWidth,H=innerHeight;cam.setViewOffset(W,H,-W*(W>1100?.25:.06),H*(W>1100?.13:0),W,H);}else cam.clearViewOffset();cam.updateProjectionMatrix();}
function project(p){tq.set(p.x,p.y,p.z||0).project(cam);if(tq.z>1)return null;return{x:(tq.x*.5+.5)*innerWidth,y:(-tq.y*.5+.5)*innerHeight,in:Math.abs(tq.x)<1&&Math.abs(tq.y)<1,nx:tq.x,ny:tq.y};}

/* ================= HUD ================= */
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
function setT(el,v,c,k){if(c[k]!==v){c[k]=v;el.textContent=v;}}
function dmgColor(p){const k=Math.min(1,p/150);const r=255,g=Math.round(255-k*200),b=Math.round(255-Math.min(1,p/60)*235);return p>200?'#9a1010':`rgb(${r},${g},${b})`;}
function hud(dt){if(annT>0){annT-=dt;if(annT<=0)$('ann').classList.remove('on');}
 if(app!=='match'&&app!=='paused')return;
 setT($('clock'),fmt(clock),hudCache,'clk');$('clockw').classList.toggle('low',phase==='play'&&clock<=10);
 for(const v of FV){const f=v.f,c=v.cache||(v.cache={});const d=Math.round(f.dmg);if(c.d!==d){c.d=d;v.pc.innerHTML=`${d}<small>%</small>`;v.pc.style.color=dmgColor(d);}
  const stk=world.mode==='stock'?Math.max(0,f.stocks):null;const sk=stk===null?`KO ${f.stats.kos} · FALL ${f.stats.falls}`:'s'+stk;
  if(c.sk!==sk){c.sk=sk;if(stk===null)v.st.textContent=sk;else{const tot=sudden?1:opt.stock;v.st.innerHTML=Array.from({length:Math.min(tot,6)},(_,i)=>`<i class="${i<stk?'':'gone'}"></i>`).join('');}}
  v.card.classList.toggle('out',f.st==='out');setT(v.pw,f.power>0?'POWER':'',c,'pw');
  if(v.cmbT>0){v.cmbT-=dt;setT(v.cb,v.cmb+' HIT!',c,'cb');v.cb.classList.add('on');}else v.cb.classList.remove('on');
  // overhead tag + off-screen bubble
  const show=!['dead','out'].includes(f.st)&&!f.vanish;const s=show?project(tq.set(f.x,f.y+f.H+.55,0)):null;
  if(s&&s.in){v.tag.style.display='';v.tag.style.transform=`translate(${s.x}px,${s.y}px) translate(-50%,-100%)`;v.tag.style.left='0';v.tag.style.top='0';v.edge.hidden=true;}
  else{v.tag.style.display='none';if(show&&s){const ex=cl((s.nx*.5+.5)*innerWidth,40,innerWidth-40),ey=cl((-s.ny*.5+.5)*innerHeight,40,innerHeight-130);v.edge.hidden=false;v.edge.style.left=ex+'px';v.edge.style.top=ey+'px';setT(v.edgeS,d+'%',c,'ed');}else v.edge.hidden=true;}}}

/* ================= rendering ================= */
function applyQuality(q){gfx=q;key.castShadow=q>0;R.shadowMap.enabled=q>0;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:1));fxPost=null;scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true;});}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);if(fxPost)fxPost.w=0;}
 cam.aspect=w/h;cam.updateProjectionMatrix();parts.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 for(const v of FV){v.trail.update(cam);v.swoosh.update(cam);if(v.scarf)v.scarf.update(cam);}for(const o of projVis.values())if(o.tr)o.tr.update(cam);
 if(!fxPost)makePost();if(fxPost.w!==w*9999+h){fxPost.w=w*9999+h;fxPost.setSize(w,h);}
 if(fxPost.bloom)fxPost.bloom.strength=(postOpts.bloom??.6)+bloomKick;if(fxPost.grade){fxPost.grade.uniforms.ca.value=.0012+zoomKick*.004+(finalHit?.003:0);fxPost.grade.uniforms.sat.value=(postOpts.saturation??1.1)*(finalHit?.55:1);}
 fxPost.render();}
addEventListener('resize',()=>{if(fxPost)fxPost.w=0;});

/* ================= menu ================= */
function seg(id,keyN,list,label){const el=$(id);if(list)el.innerHTML=list.map((t,i)=>`<button data-v="${i}">${t}</button>`).join('');const set=v=>{opt[keyN]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));onOpt(keyN);};
 el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(+b.dataset.v));el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===opt[keyN]));}
function chips(id,keyN){const el=$(id);el.innerHTML=ROSTER.map((d,i)=>`<button data-v="${i}" style="--c:${css(d.look.glow)}"><i></i>${d.name}</button>`).join('')+`<button data-v="-1" style="--c:#aaa"><i></i>RANDOM</button>`;
 el.querySelectorAll('button').forEach(b=>{b.onclick=()=>{opt[keyN]=+b.dataset.v;refreshMenu();onOpt(keyN);};b.onmouseenter=()=>showInfo(+b.dataset.v);b.onmouseleave=()=>showInfo(opt.p1);});}
function showInfo(i){const el=$('info');if(i<0){el.style.setProperty('--c','#ccc');el.innerHTML='<div><h4>RANDOM<span>?</span></h4><p>Let fate pick your fighter.</p></div><div class="bars"></div>';return;}const d=ROSTER[i];el.style.setProperty('--c',css(d.look.glow));
 const sp={bolt:'Spark shot · Volt dash · Thunder rise · Counter',granite:'Charged haymaker · Armoured shoulder · Rocket fist · Boulder drop',vex:'Shuriken · Blink slash · Shadow step · Mirror veil',nova:'Charge orb · Homing star · Starlight float · Prism reflector',riptide:'Tidal wave · Trident spin · Water spout · Geyser',ember:'Flame breath · Blaze kick · Fire tornado · Ember trap',kodiak:'Bear hug · Lariat · Leaping climb · Belly flop',cog:'Bouncing bomb · Homing rocket · Jetpack · Drill mine'}[d.id];
 el.innerHTML=`<div><h4>${d.name}<span>${d.type}</span></h4><p>${d.desc}</p><p style="color:var(--mut);font-size:.62rem;margin-top:4px">SPECIALS · ${sp}</p></div><div class="bars">${STAT_NAMES.map((n,k)=>`<div class="bar">${n}<u style="--v:${d.stats[k]*20}%"></u></div>`).join('')}</div>`;}
function refreshMenu(){for(const[id,k]of[['r1','p1'],['r2','p2']])$(id).querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===opt[k]));const two=opt.humans===2;$('r2').hidden=!two;$('r2l').hidden=!two;showInfo(opt.p1);
 const b=best();$('best').textContent=b?'BEST '+b+' PTS':'';}
function onOpt(k){try{localStorage.setItem('pxd_brawl_opt',JSON.stringify(opt));}catch(e){}if(app!=='menu')return;if(k==='humans')refreshMenu();if(k==='stage'||k==='p1')toMenu();}
chips('r1','p1');chips('r2','p2');
$('o-lv').innerHTML=Array.from({length:9},(_,i)=>`<button data-v="${i+1}">${i+1}</button>`).join('');
$('o-st').innerHTML=STAGES.map((s,i)=>`<button data-v="${i}">${s.name}</button>`).join('');
seg('o-mode','mode');seg('o-time','time');seg('o-stock','stock');seg('o-n','n');seg('o-pl','humans');seg('o-lv','lv');seg('o-st','stage');seg('o-it','items');
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Platform Brawl\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'} (#${a.rank||'?'} of ${a.n||'?'})\nFighter: ${a.fighter||''} · Stage: ${a.stage||''}\nKOs: ${a.kos||0} · Falls: ${a.falls||0} · Damage dealt: ${a.dealt||0}%\nMode: ${a.mode||''} · CPU level ${a.lv||''}${a.two?' · 2P local':''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] '+ID+' '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= loop ================= */
toMenu();$('loading').style.opacity=0;
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.BRAWL={get state(){return app==='match'?phase:app;},get app(){return app;},get phase(){return phase;},step,render,start,toMenu,pause,
 get world(){return world;},get fighters(){return world?world.f:[];},get clock(){return clock;},setClock(s){clock=s;},get result(){return result;},get timeScale(){return timeScale;},get finalHit(){return finalHit;},
 setDamage(i,p){world.f[i].dmg=p;},ko(i){world.ko(world.f[i]);},setInput(i,inp){manual[i]=inp?Object.assign(blankInput(),inp):null;},setLevel(i,l){world.f[i].lvl=l;world.f[i].lvlP=null;},
 get stats(){return world.f.map(f=>({name:f.def.name,human:f.human,dmg:f.dmg,stocks:f.stocks,score:f.score,...f.stats}));},setQuality:applyQuality,cam:()=>cam,parts,scene,R,keys,get award(){return lastAward;},
 set autoplay(v){autoplay=!!v;},get autoplay(){return autoplay;},
 skipCountdown(){if(phase==='countdown'){cdT=0;}},finish(){endGame(standings()[0],'GAME!');},get stage(){return stageVis;}};
