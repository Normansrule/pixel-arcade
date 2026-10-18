// HARBOR PALS — rescue the stranded Puffin before the tide comes in, with three helper creatures. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {buildWorld,ground,heightAt,setBridge,BRIDGE,SPOTS,STEP,onFar} from './world.js';
import {Pal,Trail,followStep,makeKid,animKid,SPECIES,ORDER} from './pals.js';
import {Particles,Arc,Rope,Marker,DOT,HEART} from './fx.js';
import {Sound} from './sound.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,toast as line} from '../js/kit3d/ui.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const ID='harborpals',SAVE='pxd_harborpals_v1';
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
// difficulty sets the tide clock, the hints and the hand-crank effort
const DIFF=[{n:'EASY',tide:360,hand:16,pen:5,hint:2,tok:2},{n:'NORMAL',tide:255,hand:21,pen:8,hint:1,tok:3},{n:'HARD',tide:180,hand:26,pen:12,hint:0,tok:4}];

/* ================= renderer / scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.25));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xc99a9e,60,200);
const cam=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,900);
const W=buildWorld(scene,R);
const hemi=new THREE.HemisphereLight(0xc4ccf4,0xa87a5a,2.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffb07a,3.1);sun.position.copy(W.sunDir).multiplyScalar(60);sun.target.position.set(0,0,0);sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:160});sun.shadow.bias=-.0005;sun.shadow.normalBias=.05;scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight(0xd8c0ff,1.5);fill.position.set(12,26,-40);scene.add(fill);
const lampL=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xffb060,0,13,1.5);scene.add(l);return l;});
const dust=new Particles(scene,900,DOT(),false),glow=new Particles(scene,700,DOT(),true),hearts=new Particles(scene,120,HEART(),false);
const arc=new Arc(scene),rope=new Rope(scene),marker=new Marker(scene);
const snd=new Sound();

/* ================= actors ================= */
const kid=makeKid();scene.add(kid.root);
const pals={};for(const id of ORDER){pals[id]=new Pal(id,scene);pals[id].initFade();}
const HOMES={mollo:SPOTS.beach,stilt:SPOTS.pier,fizz:SPOTS.shed};
const trail=new Trail();
const P={pos:new V(),vel:new V(),yaw:0,vy:0,grounded:true,lastSafe:new V(),splashT:0,stepT:0,spd:0,hidden:false};

/* ================= options, save ================= */
let app='menu',opt={diff:1,starter:'mollo',fx:0,vol:.8};const saveOpt=stored('pxd_harborpals_opt',opt);
let meta={met:[],awarded:[],run:null};
function loadMeta(){try{const s=JSON.parse(localStorage.getItem(SAVE));if(s&&typeof s==='object'){meta={met:Array.isArray(s.met)?s.met.filter(i=>ORDER.includes(i)):[],awarded:Array.isArray(s.awarded)?s.awarded.slice(-20):[],run:s.run&&s.run.active?s.run:null};}}catch(e){meta={met:[],awarded:[],run:null};}return meta;}
function writeMeta(){try{localStorage.setItem(SAVE,JSON.stringify(meta));}catch(e){}}
loadMeta();
let run=null,last=null,saveT=0;
function newRun(){const D=DIFF[opt.diff];return{active:true,id:Date.now().toString(36)+Math.floor(Math.random()*1e4),diff:opt.diff,len:D.tide,clock:D.tide,t:0,starter:opt.starter,sel:opt.starter,
 real:Math.floor(Math.random()*3),dug:[0,0,0],crank:'buried',rope:'winch',power:false,winch:0,uses:{dig:0,bridge:0,zap:0},used:{mollo:0,stilt:0,fizz:0},pets:0,falls:0,teleports:0,swaps:0,hand:0,pos:null,done:false,won:false,warned:0,stepT:0};}
// the authoritative save: met pals + the run in progress (bridge and a held line are transient and never saved)
function saveGame(){if(!run)return;meta.met=ORDER.filter(id=>pals[id].met);const r={...run,uses:{...run.uses},used:{...run.used},dug:[...run.dug]};
 const safe=onFar(P.lastSafe)?SPOTS.pierSafe:P.lastSafe;r.pos={x:+safe.x.toFixed(2),y:+safe.y.toFixed(2),z:+safe.z.toFixed(2)};if(r.rope==='held')r.rope='winch';r.bridged=false;meta.run=r.active?r:null;writeMeta();}

/* ================= world state from the run ================= */
function applyRun(){const r=run;
 W.mounds.forEach((m,i)=>{const dug=!!r.dug[i];m.mound.visible=!dug;m.pebbles.forEach(p=>p.visible=!dug);m.hole.visible=dug;m.pile.visible=dug;m.flag.visible=!dug&&i===r.real&&DIFF[r.diff].hint>=1;});
 W.winch.crank.visible=r.crank==='fitted';setPower(r.power,true);setBridge(false);
 placeBoat();for(const id of ORDER){const p=pals[id];p.mode=p.met?'follow':'wild';p.work=null;p.free=null;p.bridgeK=0;p.reactT=0;p.U.root.scale.setScalar(1);}}
function setPower(on,quiet){run.power=on;W.motor.bulbMat.color.setHex(on?0x7aff6a:0x552222);W.motor.bulbMat.emissive.setHex(on?0x4aff3a:0x220000);W.motor.bulbMat.emissiveIntensity=on?2.5:1;}
// boat path: stranded on the sandbar → off the bar → up the slipway
const BOATP=[new V(10.2,0,23.6),new V(8.6,0,19.5),new V(7,0,14),new V(7,0,8),SPOTS.boatHome];
const _b=new V(),_b2=new V();
function boatAt(s,out){s=cl(s,0,1)*(BOATP.length-1);const i=Math.min(BOATP.length-2,Math.floor(s)),t=s-i;return out.copy(BOATP[i]).lerp(BOATP[i+1],t);}
function placeBoat(t=0){const s=run?run.winch:0,g=W.boat.g;boatAt(s,_b);const slip=heightAt(_b.x,_b.z);let y=Math.max(W.level+.05,slip>-50?slip:-9);if(s<.02)y=.42;g.position.set(_b.x,y-.25,_b.z);
 boatAt(Math.min(1,s+.05),_b2);const dir=s<.02?Math.atan2(7-10.2,14-23.6):Math.atan2(_b.x-_b2.x,_b.z-_b2.z)+Math.PI;g.rotation.set(0,dir,0);
 const tf=run?1-run.clock/run.len:0,stuck=s<.02;W.boat.hull.rotation.z=stuck?.2+(tf>.8?Math.sin(t*3)*.06:0):Math.sin(t*1.6)*.04;W.boat.hull.rotation.x=stuck?-.06:(slip>W.level?-.12:Math.sin(t*1.2)*.03);
 if(run&&run.done&&!run.won){W.boat.g.position.y=Math.max(.17,W.level-.35);W.boat.hull.rotation.z=.42+Math.sin(t*2)*.04;}}

/* ================= run start / resume / end ================= */
const timers=[];const after=(t,f)=>timers.push({t,f});
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();idleT=0;if(o.diff!=null)opt.diff=o.diff;if(o.starter)opt.starter=o.starter;saveOpt();snd.init();snd.setVol(opt.vol);
 timers.length=0;loadMeta();const resume=o.resume&&meta.run;run=resume?{...meta.run}:newRun();if(!resume)run.sel=run.starter;
 for(const id of ORDER)pals[id].met=meta.met.includes(id);if(!resume){pals[run.starter].met=true;}else if(!pals[run.sel].met)run.sel=ORDER.find(id=>pals[id].met)||run.starter;
 for(const id of ORDER){const p=pals[id];p.uses=run.used[id]||0;}
 dust.clear();glow.clear();hearts.clear();arc.set(null,null,false);applyRun();
 const sp=resume&&run.pos?new V(run.pos.x,run.pos.y,run.pos.z):SPOTS.start.clone();P.pos.copy(sp);P.pos.y=Math.max(heightAt(sp.x,sp.z),-1);P.vel.set(0,0,0);P.vy=0;P.yaw=0;P.lastSafe.copy(P.pos);P.splashT=0;P.hidden=false;kid.root.visible=true;held={E:0};
 for(const id of ORDER){const p=pals[id];if(!p.met)p.place(HOMES[id],id==='stilt'?Math.PI:0);}seedTrail();placeLine(false);
 camS.yaw=0;camS.snap=true;camS.dist=9;
 $('toasts').innerHTML='';document.body.classList.remove('ending');app='play';hideAll();$('hud').hidden=false;document.body.classList.add('playing');snd.run(true);saveGame();hudBuild();
 banner(resume?'WELCOME BACK':'RESCUE THE PUFFIN',resume?'Your progress was restored · the tide kept its place':'Winch the stranded boat ashore before the tide comes in','#ffd27a',3.4);if(!resume)after(1.2,()=>snd.play('horn'));}
function finish(won){if(!run||run.done)return;run.done=true;run.won=won;run.active=false;const D=DIFF[run.diff];
 const stars=[won,won&&run.clock/run.len>=.35,run.uses.dig>0&&run.uses.bridge>0&&run.uses.zap>0];const ns=stars.filter(Boolean).length;
 const steps=[run.crank!=='buried',run.rope==='hooked',run.crank==='fitted',run.power||run.winch>0,run.winch>=1].filter(Boolean).length;
 const pts=won?1000+Math.round(run.clock)*4+ns*300+run.diff*300:steps*120;const tokens=won?D.tok+ns:1;
 const first=!meta.awarded.includes(run.id);if(first){addRound(tokens,won);saveBest(ID,pts);meta.awarded.push(run.id);}
 last={won,pts,tokens,stars,ns,steps,diff:D.n,time:run.t,left:run.clock,falls:run.falls,teleports:run.teleports,uses:{...run.uses},used:{...run.used},pets:run.pets,awarded:first,id:run.id};
 saveGame();meta.run=null;writeMeta();snd.play(won?'win':'lose');if(!won){for(let i=0;i<30;i++)after(i*.05,()=>W.setTide(Math.min(.62,W.level+.03)));dust.burst(W.boat.g.position.clone().add(new V(0,.6,0)),opt.fx?10:30,3,0xeaf6ff,.5,1,{up:true,grav:6});}
 if(won){for(let i=0;i<6;i++)after(i*.25,()=>glow.burst(new V(W.boat.g.position.x+(Math.random()-.5)*3,W.boat.g.position.y+2.5,W.boat.g.position.z),opt.fx?6:16,5,new THREE.Color().setHSL(Math.random(),.8,.65),.5,1.4,{grav:4,drag:1}));for(const id of ORDER)if(pals[id].met)pals[id].poke('joy');}
 camS.yaw=Math.PI+.5;hudAll();document.body.classList.add('ending');banner(won?'PUFFIN SAVED!':'THE TIDE CAME IN',won?`${ns} / 3 stars`:'The Puffin is swamped',won?'#ffd27a':'#7ad8ff',2.6);app='ending';after(2.4,showResults);}
function showResults(){app='over';banT=0;$('banner').classList.remove('on');$('toasts').innerHTML='';document.body.classList.remove('ending');hideAll();$('over').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing');snd.run(false);const L=last;
 $('oeye').textContent=L.won?'THE PUFFIN IS SAFE IN THE HARBOR':'THE SANDBAR IS UNDER WATER';$('ores').textContent=L.won?'PUFFIN SAVED!':'THE TIDE CAME IN';$('ores').className='res '+(L.won?'win':'lose');
 $('ostars').innerHTML=L.stars.map(s=>`<b class="${s?'on':''}">${s?'★':'☆'}</b>`).join('')+`<span>${L.ns} / 3 STARS</span>`;
 const crit=['Rescued the Puffin','Tide to spare (35% or more left)','Used all three abilities: DIG, BRIDGE, ZAP'];$('ocrit').innerHTML=L.stars.map((s,i)=>`<li class="${s?'ok':''}"><i>${s?'✓':'✗'}</i>${crit[i]}</li>`).join('');
 $('ostats').innerHTML=[['TIME',fmt(L.time)],['TIDE LEFT',fmt(L.left)],['STEPS',L.steps+' / 5'],['FALLS',L.falls],['SCORE',L.pts.toLocaleString()]].map(([a,b])=>`<div><i>${a}</i><b>${b}</b></div>`).join('');
 $('opals').innerHTML=ORDER.map(id=>{const S=SPECIES[id],n=L.used[id]||0,met=pals[id].met;return`<div class="${n?'used':''}">${svg(id)}<b>${S.name}</b><span>${met?(n?`${S.abName} ×${n}`:'not used'):'not met'}</span></div>`;}).join('');
 $('otok').textContent=(L.awarded?`+${L.tokens} TOKENS`:'Already counted')+` · BEST ${bestScore(ID).toLocaleString()} · ${L.diff}`+(L.teleports?` · pal teleports ${L.teleports}`:'');menuBest();}
function hideAll(){for(const id of['menu','keys','over','pause'])$(id).hidden=true;}
function toMenu(){if(run&&!run.done)saveGame();run=null;menuScene();app='menu';hideAll();$('menu').hidden=false;$('keys').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing');snd.run(false);loadMeta();menuBest();}
function pause(on){if(on&&app==='play'){app='paused';$('pause').hidden=false;snd.run(false);saveGame();}else if(!on&&app==='paused'){app='play';$('pause').hidden=true;snd.run(true);}}
function menuBest(){const b=bestScore(ID);const met=meta.met.map(id=>SPECIES[id].name);$('mbest').textContent=(met.length?`PALS MET: ${met.join(' · ')}`:'NO PALS MET YET')+(b?` · BEST ${b.toLocaleString()}`:'');
 $('cont').hidden=!meta.run;if(meta.run)$('cont').textContent=`CONTINUE · ${DIFF[meta.run.diff].n} · TIDE ${fmt(meta.run.clock)}`;}

/* ================= feedback ================= */
let banT=0;
function banner(t,s,col,dur=2.4){$('bt').textContent=t;$('bt').style.color=col||'#fff';$('bs').textContent=s||'';$('bs').style.display=s?'':'none';$('banner').classList.add('on');banT=dur;}
function toast(t,cls=''){const h=$('toasts');for(const c of[...h.children])if(c.textContent===t)c.remove();const d=line(h,'',3200,3);d.textContent=t;if(cls)d.className=cls;}
function poof(p){dust.burst(new V(p.x,p.y+.5,p.z),opt.fx?6:16,2.6,0xfff4e0,.7,.7,{drag:3,grav:-.5});snd.play('poof');}
function hearts3(p){hearts.burst(new V(p.x,p.y+1.2,p.z),opt.fx?3:6,1.6,0xff6a8a,.42,1.1,{up:true,grav:-.6,drag:1.5});}

/* ================= input ================= */
let held={E:0};const I=controls(canvas,{canLock:()=>false,look:e=>drag.on,menu:()=>true,
 onKey:(e,first)=>{if(['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(!first)return;if(e.code==='Escape'||e.code==='KeyP'){if(app==='play')pause(true);else if(app==='paused')pause(false);}}});
const drag={on:false,x:0};canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){drag.on=true;}});addEventListener('pointerup',()=>drag.on=false);
addEventListener('blur',()=>pause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});
addEventListener('wheel',e=>{if(app==='play')camS.dist=cl(camS.dist+Math.sign(e.deltaY)*.8,6.5,15);},{passive:true});
// touch: a stick on the left, buttons on the right
const touch={x:0,y:0,id:null,E:false,eT:0};
{const st=$('stick'),kn=$('knob');const mv=e=>{const r=st.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2);const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m;}touch.x=dx;touch.y=dy;kn.style.transform=`translate(${dx*34}px,${dy*34}px)`;};
 st.addEventListener('pointerdown',e=>{touch.id=e.pointerId;st.setPointerCapture(e.pointerId);mv(e);});st.addEventListener('pointermove',e=>{if(e.pointerId===touch.id)mv(e);});
 const up=e=>{if(e.pointerId===touch.id){touch.id=null;touch.x=touch.y=0;kn.style.transform='';}};st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
 const btn=(id,down,upf)=>{const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();down();});if(upf){b.addEventListener('pointerup',upf);b.addEventListener('pointercancel',upf);b.addEventListener('pointerleave',upf);}};
 btn('tE',()=>{touch.E=true;act.E=true;},()=>touch.E=false);btn('tF',()=>act.F=true);btn('tPal',()=>act.cycle=true);btn('tCam',()=>{camS.yaw+=Math.PI/2;});btn('tPause',()=>pause(true));
 addEventListener('pointerdown',e=>{if(e.pointerType==='touch')document.body.classList.add('touch');},{capture:true});}
if(matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');
const act={E:false,F:false,cycle:false,sel:null,R:false};let padPrev={};
function readInput(){const k=I.keys,e=I.edge;let mx=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0),mz=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0);
 if(touch.id!=null){mx=touch.x;mz=-touch.y;}let run2=k.ShiftLeft||k.ShiftRight,eHeld=!!k.KeyE||touch.E,rot=(k.KeyC?1:0)-(k.KeyZ?1:0);
 if(e.KeyE)act.E=true;if(e.KeyF||e.Space)act.F=true;if(e.Tab||e.KeyQ)act.cycle=true;if(e.Digit1)act.sel='mollo';if(e.Digit2)act.sel='stilt';if(e.Digit3)act.sel='fizz';if(e.KeyR)act.R=true;
 const gp=gamepad();if(gp){const ax=deadzone(gp.axes[0]||0,.18),ay=deadzone(gp.axes[1]||0,.18);if(ax||ay){mx=ax;mz=-ay;}rot+=deadzone(gp.axes[2]||0,.25)*1.4;const b=i=>gp.buttons[i]&&gp.buttons[i].pressed,ed=i=>b(i)&&!padPrev[i];
  if(ed(0))act.E=true;if(b(0))eHeld=true;if(ed(2))act.F=true;if(ed(5)||ed(3))act.cycle=true;if(ed(4))act.sel=prevPal();if(ed(9))app==='play'?pause(true):pause(false);if(b(7)||b(1))run2=true;padPrev={};gp.buttons.forEach((x,i)=>padPrev[i]=x.pressed);}
 if(drag.on){camS.yaw-=I.mouse.dx*.006;}I.mouse.dx=I.mouse.dy=0;
 I.flush();return{mx,mz,run:run2,eHeld,rot};}
function prevPal(){const m=ORDER.filter(id=>pals[id].met);const i=m.indexOf(run.sel);return m[(i-1+m.length)%m.length];}

/* ================= pals: selection, the line, jobs ================= */
function select(id,quiet){if(!run||!pals[id])return false;const p=pals[id];if(!p.met){if(!quiet){toast(`You haven't met ${p.S.name} yet. ${hintWhere(id)}`);snd.play('no');}return false;}
 if(run.sel===id)return true;run.sel=id;run.swaps++;if(!quiet){snd.play('whistle');p.poke('joy');snd.play(id);toast(`${p.S.name} leads now · ${p.S.abName} ready [F]`,'sel');}saveGame();hudPals();return true;}
function lineOrder(){const ids=[run.sel,...ORDER.filter(i=>i!==run.sel)];return ids.filter(i=>pals[i].met&&pals[i].mode==='follow');}
function hintWhere(id){return{mollo:'Mollo was seen digging on the beach.',stilt:'Stilt fishes off the pier.',fizz:'Fizz glows in the dark net shed.'}[id];}
function teleported(p){run.teleports++;poof(p.pos);}
// a fresh trail after a respawn: a few walkable crumbs behind the player so the line has somewhere to stand
function seedTrail(){const b=new V(-Math.sin(P.yaw),0,-Math.cos(P.yaw)),pts=[];let prev=P.pos.y;
 for(let k=1;k<=8;k++){const x=P.pos.x+b.x*k*.8,z=P.pos.z+b.z*k*.8,h=heightAt(x,z);if(h<-50||Math.abs(h-prev)>.5||h<W.level)break;prev=h;pts.unshift(new V(x,h,z));}trail.reset(P.pos,pts);}
function placeLine(fx){let g=0;for(const id of lineOrder()){const p=pals[id];g+=p.S.gap;p.free=null;p.bestD=1e9;p.stuckT=0;p.s=Math.max(trail.start,trail.end-g);trail.at(p.s,p.pos);p.pos.y=p.groundY(p.pos.x,p.pos.z);p.yaw=P.yaw;p.sync();if(fx)poof(p.pos);}}
// targets an ability can work on, nearest first
function abilityTargets(){const L=[];const pp=P.pos;
 W.mounds.forEach((m,i)=>{if(!run.dug[i])L.push({ab:'dig',i,p:new V(m.x,m.y,m.z),name:'sand mound',r:6});});
 if(!pals.stilt.bridgeK&&pals.stilt.mode!=='work'&&!(pals.stilt.mode==='bridge'))L.push({ab:'bridge',p:SPOTS.gap.clone(),name:'broken pier',r:5.5});
 if(!run.power)L.push({ab:'zap',p:SPOTS.motor.clone(),name:'winch motor',r:6});
 for(const t of L)t.d=Math.hypot(t.p.x-pp.x,t.p.z-pp.z);return L.filter(t=>t.d<t.r&&Math.abs(t.p.y-pp.y)<2.4).sort((a,b)=>a.d-b.d);}
function useAbility(){if(!run||app!=='play')return'none';const p=pals[run.sel],S=p.S;
 if(p.mode==='bridge'){if(onFar(P.pos)||P.pos.z>15.4&&P.pos.x>13){toast(`${S.name} is holding the bridge for you. Cross back first.`);snd.play('stilt');return'holding';}releaseBridge();return'release';}
 if(p.mode==='work'){toast(`${S.name} is busy.`);return'busy';}
 const T=abilityTargets();const mine=T.find(t=>t.ab===S.ab);
 if(mine){p.mode='work';p.work={kind:S.ab,tg:mine,t:0,go:true,stuck:0,best:1e9};p.free=null;snd.play(p.id);hudPals();
  return S.ab;}
 if(T.length){const need=ORDER.find(id=>SPECIES[id].ab===T[0].ab),N=SPECIES[need];p.poke('no');snd.play('no');
  toast(pals[need].met?`The ${T[0].name} needs ${N.abName}: switch to ${N.name} [${ORDER.indexOf(need)+1}]`:`The ${T[0].name} needs ${N.abName}. ${hintWhere(need)}`,'need');return'wrong';}
 // nothing to work on: a small idle demo of the ability
 p.poke(S.ab==='dig'?'sniff':'joy');snd.play(p.id);if(S.ab==='zap')glow.burst(new V(p.pos.x,p.pos.y+1.2,p.pos.z),opt.fx?6:14,2.5,0xd8ff8a,.35,.6,{drag:2});
 toast({dig:'Mollo sniffs around. Nothing buried here; look for sand mounds.',bridge:'Stilt stretches its long legs. Gaps and broken piers are its thing.',zap:'Fizz crackles happily. Point it at a machine that needs power.'}[S.ab]);return'idle';}
function releaseBridge(){const s=pals.stilt;setBridge(false);s.mode='follow';s.free=true;s.bestD=1e9;s.stuckT=0;run.bridged=false;toast('Stilt folds back up and follows you.');snd.play('stilt');hudPals();}
function updateWork(p,dt){const w=p.work,tg=w.tg;let ap=tg.p.clone();
 if(w.kind==='dig'){const dx=P.pos.x-tg.p.x,dz=P.pos.z-tg.p.z,d=Math.hypot(dx,dz)||1;ap.set(tg.p.x+dx/d*.9,0,tg.p.z+dz/d*.9);}
 if(w.kind==='bridge')ap.set(15.5,0,15.3);
 if(w.kind==='zap')ap.set(SPOTS.motor.x,0,SPOTS.motor.z+1.5);
 if(w.go){const ok=p.walkTo(ap,dt,p.S.speed*1.1);const d=Math.hypot(ap.x-p.pos.x,ap.z-p.pos.z);if(d<w.best-.05){w.best=d;w.stuck=0;}else w.stuck+=dt;
  if(w.stuck>1.4||!ok&&w.stuck>.5){p.pos.set(ap.x,p.groundY(ap.x,ap.z),ap.z);teleported(p);}
  if(Math.hypot(ap.x-p.pos.x,ap.z-p.pos.z)<.25){w.go=false;w.t=.001;p.face(tg.p.x-p.pos.x,tg.p.z-p.pos.z,1);
   if(w.kind==='dig')snd.play('dig');if(w.kind==='bridge')snd.play('creak');if(w.kind==='zap')snd.play('zap');}
  return;}
 w.t+=dt;
 if(w.kind==='dig'){if(Math.random()<dt*14)dust.burst(new V(tg.p.x,tg.p.y+.3,tg.p.z),2,2.4,0xcaa36a,.35,.6,{up:true,grav:7});if(w.t>2)digDone(p,tg.i);}
 if(w.kind==='zap'){p.pos.y=lerp(p.pos.y,SPOTS.motor.y+.4,dt*4);const a=new V(p.pos.x,p.pos.y+1.1,p.pos.z),b=SPOTS.motor.clone().add(new V(0,.8,0));arc.set(a,b,true);if(Math.random()<dt*20)glow.burst(b,3,3,0xf4ffb0,.3,.4,{drag:2});if(Math.random()<dt*6)snd.play('zap');if(w.t>1.4){arc.set(null,null,false);zapDone(p);}}
 if(w.kind==='bridge'){p.pos.lerp(new V(15.5,1,17.65),Math.min(1,dt*3));p.yaw=lerp(p.yaw,0,Math.min(1,dt*5));p.bridgeK=Math.min(1,p.bridgeK+dt*1.2);if(p.bridgeK>=1)bridgeDone(p);}}
function credit(p,ab){run.uses[ab]++;run.used[p.id]=(run.used[p.id]||0)+1;p.uses++;}
function digDone(p,i){const m=W.mounds[i];run.dug[i]=1;m.mound.visible=false;m.pebbles.forEach(x=>x.visible=false);m.flag.visible=false;m.hole.visible=true;m.pile.visible=true;credit(p,'dig');
 if(i===run.real){run.crank='carried';p.poke('joy');snd.play('find');snd.play('mollo');glow.burst(new V(m.x,m.y+.8,m.z),opt.fx?8:22,3,0xffd27a,.4,.9,{up:true,grav:3});banner('WINCH CRANK FOUND','Mollo dug it up · fit it to the winch at the slipway','#ffd27a',2.6);}
 else{p.poke('no');snd.play('junk');dust.burst(new V(m.x,m.y+.6,m.z),6,2,0x8a7a6a,.3,.6,{up:true,grav:5});toast(i%2?'Just an old boot. Try another mound.':'Only a clam shell. Try another mound.');}
 p.mode='follow';p.work=null;p.free=true;p.bestD=1e9;p.stuckT=0;saveGame();hudAll();}
function bridgeDone(p){p.mode='bridge';p.work=null;setBridge(true);run.bridged=true;credit(p,'bridge');snd.play('bridge');p.poke('pet');hearts3(p.pos);toast('Stilt made a bridge! Walk across to the sandbar.','good');saveGame();hudAll();}
function zapDone(p){setPower(true);credit(p,'zap');snd.play('power');p.poke('joy');p.mode='follow';p.work=null;p.free=true;p.bestD=1e9;p.stuckT=0;
 glow.burst(SPOTS.motor.clone().add(new V(0,1.2,0)),opt.fx?8:24,3,0x7aff6a,.4,.8,{up:true,grav:2});toast(run.crank==='fitted'&&run.rope==='hooked'?'The winch motor hums to life!':'The winch motor is charged. It will run once the crank and tow line are ready.','good');saveGame();hudAll();}

/* ================= interaction (E) ================= */
const BOW=new V();
function focus(){if(!run)return null;const pp=P.pos,d=(p)=>Math.hypot(p.x-pp.x,p.z-pp.z)+Math.abs(p.y-pp.y)*.5;const F=[];
 for(const id of ORDER){const p=pals[id];if(!p.met&&d(p.pos)<2.6)F.push({k:'befriend',id,d:d(p.pos),txt:`Make friends with ${p.S.name}`});}
 const wd=d(SPOTS.winch);if(wd<2.8){if(run.crank==='carried')F.push({k:'fit',d:wd,txt:'Fit the crank to the winch'});else if(run.rope==='winch')F.push({k:'takeline',d:wd,txt:'Take the tow line'});
  else if(ready()&&!run.power&&run.winch<1)F.push({k:'crank',d:wd,txt:'Hold to crank the winch by hand',hold:true});
  else if(run.rope==='hooked'&&run.crank!=='fitted')F.push({k:'info',d:wd,txt:'The winch needs its crank handle'});
  else if(ready()&&run.power)F.push({k:'info',d:wd,txt:'The motor is winching the Puffin in'});}
 W.boat.bow.getWorldPosition(BOW);const bd=Math.hypot(BOW.x-pp.x,BOW.z-pp.z);if(bd<2.8&&run.rope!=='hooked')F.push(run.rope==='held'?{k:'hook',d:bd,txt:'Hook the tow line to the Puffin'}:{k:'info',d:bd,txt:'Bring the tow line from the winch'});
 for(const id of ORDER){const p=pals[id];if(p.met&&p.mode!=='work'&&d(p.pos)<1.8)F.push({k:'pet',id,d:d(p.pos)+.6,txt:`Pet ${p.S.name}`});}
 F.sort((a,b)=>a.d-b.d);return F[0]||null;}
const ready=()=>run.crank==='fitted'&&run.rope==='hooked';
function interact(){const f=focus();if(!f)return'none';const pp=P.pos;
 if(f.k==='befriend'){const p=pals[f.id];p.met=true;p.mode='follow';p.free=true;p.bestD=1e9;p.s=trail.end-3;p.poke('joy');snd.play(f.id);snd.play('pick');hearts3(p.pos);
  banner(`${p.S.name} JOINED!`,`${p.S.abName}: ${p.S.verb} · press ${ORDER.indexOf(f.id)+1} to lead with it`,SPECIES[f.id].col,2.8);saveGame();hudAll();return'befriend';}
 if(f.k==='fit'){run.crank='fitted';W.winch.crank.visible=true;snd.play('hook');glow.burst(SPOTS.winch.clone().add(new V(-1.2,1,0)),10,2,0xffd27a,.3,.6);toast('Crank fitted.'+(run.rope!=='hooked'?' Now hook the tow line to the Puffin.':run.power?' The motor takes over!':' Now power the winch.'),'good');saveGame();hudAll();return'fit';}
 if(f.k==='takeline'){run.rope='held';snd.play('pick');toast('You have the tow line. Carry it to the stranded Puffin.','good');hudAll();return'takeline';}
 if(f.k==='hook'){run.rope='hooked';snd.play('hook');snd.play('horn');toast(run.crank!=='fitted'?'Hooked! The winch still needs its crank.':run.power?'Hooked! The motor starts winching the Puffin in.':'Hooked! Now power the winch: ZAP the motor, or hold E at the winch.','good');saveGame();hudAll();return'hook';}
 if(f.k==='pet'){const p=pals[f.id];p.poke('pet');snd.play(f.id);hearts3(p.pos);run.pets++;return'pet';}
 if(f.k==='crank'){return'crank';}
 toast(f.txt);return'info';}

/* ================= player ================= */
function blocked(nx,nz){const g=ground(nx,nz),cur=ground(P.pos.x,P.pos.z);if(g.h>-50&&g.h-P.pos.y>STEP)return true;
 if(P.grounded&&cur.kind==='sand'&&(g.h<-50||g.h<W.level-.3))return true;// no wading off the beach
 return false;}
function movePlayer(inp,dt){const f=new V(Math.sin(camS.yaw),0,Math.cos(camS.yaw)),r=new V(-Math.cos(camS.yaw),0,Math.sin(camS.yaw));
 const want=f.multiplyScalar(inp.mz).add(r.multiplyScalar(inp.mx));const m=Math.min(1,want.length());if(m>.01)want.normalize().multiplyScalar(m*(inp.run?6.2:4.3));
 if(P.splashT>0)want.set(0,0,0);P.vel.x=lerp(P.vel.x,want.x,Math.min(1,dt*12));P.vel.z=lerp(P.vel.z,want.z,Math.min(1,dt*12));
 const nx=P.pos.x+P.vel.x*dt,nz=P.pos.z+P.vel.z*dt;if(!blocked(nx,nz)){P.pos.x=nx;P.pos.z=nz;}else if(!blocked(nx,P.pos.z)){P.pos.x=nx;P.vel.z*=.5;}else if(!blocked(P.pos.x,nz)){P.pos.z=nz;P.vel.x*=.5;}else P.vel.set(0,0,0);
 const g=ground(P.pos.x,P.pos.z);const gh=g.h<-50?-99:g.h;
 if(P.grounded&&gh>-50&&P.pos.y-gh<.45){P.pos.y=lerp(P.pos.y,gh,Math.min(1,dt*18));if(Math.abs(P.pos.y-gh)<.01)P.pos.y=gh;P.vy=0;}
 else{P.grounded=false;P.vy-=22*dt;P.pos.y+=P.vy*dt;if(gh>-50&&P.pos.y<=gh){P.pos.y=gh;P.vy=0;P.grounded=true;dust.burst(new V(P.pos.x,gh+.05,P.pos.z),5,1.4,0xe8d8c0,.4,.4,{up:true,grav:3,drag:3});snd.play('step');}}
 P.spd=Math.hypot(P.vel.x,P.vel.z);if(P.spd>.3)P.yaw=Math.atan2(P.vel.x,P.vel.z);
 // safe spot: grounded, not on the (temporary) bridge, solid ground on all sides
 if(P.grounded&&g.r!==BRIDGE&&gh>W.level){let ok=true;for(const[a,b]of[[.7,0],[-.7,0],[0,.7],[0,-.7]]){const h=heightAt(P.pos.x+a,P.pos.z+b);if(h<-50||h<W.level-.2){ok=false;break;}}if(ok)P.lastSafe.copy(P.pos);}
 // fell into the sea
 if(P.splashT<=0&&(gh<-50||gh<W.level-.3)&&P.pos.y<W.level+.1){P.splashT=1.1;snd.play('splash');dust.burst(new V(P.pos.x,W.level+.1,P.pos.z),opt.fx?10:30,4,0xeaf6ff,.5,.8,{up:true,grav:9,drag:.6});kid.root.visible=false;}
 if(P.splashT>0){P.splashT-=dt;if(P.splashT<=0)recover('splash');}
 if(P.grounded&&P.spd>1){P.stepT-=dt*P.spd;if(P.stepT<=0){P.stepT=1.25;snd.play(g.kind==='wood'?'stepw':'step',.7);}}
 trail.push(P.pos);}
// back to safe ground (after a splash, or the R reset) — costs some tide; a held line slips back to the winch
function recover(why){const D=DIFF[run.diff];run.clock=Math.max(1,run.clock-D.pen);if(why==='splash')run.falls++;
 const to=why==='post'?SPOTS.start.clone():P.lastSafe.clone();if(onFar(to)&&!run.bridged)to.copy(SPOTS.pierSafe);P.pos.copy(to);P.pos.y=heightAt(to.x,to.z);P.vel.set(0,0,0);P.vy=0;P.grounded=true;kid.root.visible=true;
 if(run.rope==='held'){run.rope='winch';toast('The tow line slipped back to the winch.');}
 seedTrail();placeLine(true);
 camS.snap=true;dust.burst(new V(P.pos.x,P.pos.y+.4,P.pos.z),12,2,0xfff4e0,.6,.6,{drag:3});
 toast(why==='post'?`Back at the Pal Post · −${D.pen}s of tide`:`Splash! Back on dry land · −${D.pen}s of tide`,'warn');saveGame();hudAll();}

/* ================= camera ================= */
const camS={yaw:0,dist:9,snap:true,pos:new V(),look:new V()};
function updateCam(dt,rot){camS.yaw+=rot*dt*1.8;const f=new V(Math.sin(camS.yaw),0,Math.cos(camS.yaw));const tgt=app==='ending'?W.boat.g.position.clone().add(new V(0,1.4,0)):P.pos.clone().add(new V(0,1.2,0)).addScaledVector(f,2.2);
 const h=camS.dist*.7;let want=tgt.clone().addScaledVector(f,-camS.dist).add(new V(0,h,0));
 // pull in when a wall, house or the cliff sits between the player and the camera
 for(let i=4;i<=16;i++){const t=i/16,q=tgt.clone().lerp(want,t);const gh=heightAt(q.x,q.z);if(gh>q.y-.25){want=tgt.clone().lerp(want,Math.max(.35,(i-1)/16));want.y=Math.max(want.y,gh+1);break;}}
 if(camS.snap){camS.pos.copy(want);camS.look.copy(tgt);camS.snap=false;}else{camS.pos.lerp(want,Math.min(1,dt*5));camS.look.lerp(tgt,Math.min(1,dt*8));}
 cam.position.copy(camS.pos);cam.lookAt(camS.look);}

/* ================= main step ================= */
let gT=0,hintStep=-1,hintT=0;
function step(dt){dt=Math.min(dt,.05);gT+=dt;
 for(let i=timers.length-1;i>=0;i--){const t=timers[i];t.t-=dt;if(t.t<=0){timers.splice(i,1);t.f();}}
 W.update(dt,gT);
 if(app==='play'&&run){const inp=readInput();run.t+=dt;
  if(act.cycle){const m=ORDER.filter(id=>pals[id].met);if(m.length>1)select(m[(m.indexOf(run.sel)+1)%m.length]);act.cycle=false;}
  if(act.sel){select(act.sel);act.sel=null;}
  if(act.F){useAbility();act.F=false;}
  const fc=focus();
  if(act.E){if(fc&&fc.k==='crank')held.E=1;else interact();act.E=false;}
  if(act.R){if(rArm>0){recover('post');rArm=0;}else{rArm=2.2;toast('Press R again to return to the Pal Post (costs some tide).');}act.R=false;}if(rArm>0)rArm-=dt;
  movePlayer(inp,dt);
  // the tide
  run.clock-=dt;const tf=1-run.clock/run.len;W.setTide(-.5+.8*cl(tf,0,1));snd.urg=cl((tf-.6)/.4,0,1);
  if(run.clock<60&&run.warned<1){run.warned=1;snd.play('warn');toast('One minute until the tide covers the sandbar!','warn');}
  if(run.clock<20&&run.warned<2){run.warned=2;snd.play('warn');banner('TIDE NEARLY IN','20 seconds left','#7ad8ff',1.8);}
  // winching
  const winching=ready()&&run.winch<1&&(run.power||(inp.eHeld&&fc&&fc.k==='crank'));
  if(winching){const rate=run.power?1/7:1/DIFF[run.diff].hand;run.winch=Math.min(1,run.winch+rate*dt);if(!run.power)run.hand+=dt;W.winch.drum.rotation.x-=dt*(run.power?6:3.5);W.winch.crank.rotation.x-=dt*(run.power?6:3.5);
   if(Math.random()<dt*(run.power?10:6))snd.play('winch');if(Math.random()<dt*8)dust.burst(W.boat.g.position.clone().add(new V(0,.2,0)),2,1.5,0xeaf6ff,.4,.5,{up:true,grav:5});
   if(run.winch>=1)finish(true);}
  if(!inp.eHeld)held.E=0;
  // pals: jobs, the line, wild idlers, sniffing
  const order=lineOrder(),gapOf={};let gap=0;for(const id of order){gap+=pals[id].S.gap;gapOf[id]=gap;}
  for(const id of ORDER){const p=pals[id];
   if(p.mode==='work')updateWork(p,dt);
   else if(p.mode==='bridge'){p.pos.set(15.5,1,17.65);p.yaw=0;p.bridgeK=1;if(!onFar(P.pos)&&Math.hypot(P.pos.x-15.5,P.pos.z-15.5)>16)releaseBridge();}
   else if(p.mode==='follow'){followStep(p,trail,P.pos,dt,gapOf[id]||1.5,teleported,order.indexOf(id)%2?-1:1);if(p.bridgeK>0)p.bridgeK=Math.max(0,p.bridgeK-dt*2);}
   else{p.spd=0;const dx=P.pos.x-p.pos.x,dz=P.pos.z-p.pos.z;if(Math.hypot(dx,dz)<7)p.face(dx,dz,dt*.6);}
   p.sync();p.anim(dt,1);p.setFade(p.mode==='follow'&&occludes(p)?.35:1,dt);}
  if(pals.mollo.met&&pals.mollo.mode==='follow'&&run.crank==='buried'){const m=W.mounds[run.real];if(Math.hypot(m.x-pals.mollo.pos.x,m.z-pals.mollo.pos.z)<3.2&&!sniffed){sniffed=true;pals.mollo.poke('sniff');snd.play('mollo');toast('Mollo sniffs at that mound. Something is buried there!','good');}}
  else if(run.crank!=='buried')sniffed=true;
  idleLife(dt);
  if(run.clock<=0){run.clock=0;finish(false);}
  saveT+=dt;if(saveT>4){saveT=0;saveGame();}
  hud(dt,fc);
 }else if(app==='ending'||app==='over'||app==='menu'){for(const id of ORDER){const p=pals[id];if(app==='menu'){p.spd=0;}p.sync();p.anim(dt,1);}if(app==='menu')menuCam(dt);hud2(dt);}
 // the kid
 kid.root.position.copy(P.pos);{const ry=kid.root.rotation.y;kid.root.rotation.y=ry+Math.atan2(Math.sin(P.yaw-ry),Math.cos(P.yaw-ry))*Math.min(1,dt*12);}
 animKid(kid,gT,app==='play'?P.spd:0,dt,run&&run.rope==='held');
 if(run){placeBoat(gT);rope.set(...ropeEnds(),run.rope!=='winch');}
 if(app==='play'||app==='ending')updateCam(dt,app==='play'?readRot():0);
 // lamps: the 4 nearest the camera's focus get real lights
 const lf=camS.look;const near=W.lamps.slice().sort((a,b)=>a.distanceToSquared(lf)-b.distanceToSquared(lf));lampL.forEach((l,i)=>{l.position.copy(near[i]);l.intensity=gfx>0?5.5:0;});
 dust.update(dt,ptScale());glow.update(dt,ptScale());hearts.update(dt,ptScale());
 if(run&&app==='play'){marker.set(...markerTarget(dt),gT);}else marker.set(null,false);}
let sniffed=false,rArm=0,camFree=false,idleT=0;
// when the player stands still the pals find something to do: one emote every few seconds, each in its own way
function idleLife(dt){idleT=P.spd<.2?idleT+dt:0;if(idleT<3.5)return;idleT=1.2+Math.random()*1.5;const L=lineOrder();if(!L.length)return;const p=pals[L[Math.floor(Math.random()*L.length)]];
 p.poke(p.id==='fizz'?'joy':'pet');snd.play(p.id);if(p.id==='fizz')glow.burst(new V(p.pos.x,p.pos.y+1.1,p.pos.z),opt.fx?3:8,1.4,0xd8ff8a,.25,.6,{drag:2});if(p.id==='mollo')dust.burst(new V(p.pos.x,p.pos.y+.1,p.pos.z+.3),4,1.2,0xcaa36a,.3,.5,{up:true,grav:5});}
// does this pal stand between the camera and the player (or right under the lens)?
const _o1=new V(),_o2=new V();
function occludes(p){_o1.copy(P.pos).add(new V(0,.8,0)).sub(cam.position);_o2.copy(p.pos).add(new V(0,p.id==='stilt'?1.4:p.id==='fizz'?1.1:.45,0)).sub(cam.position);const dp=_o1.length(),dq=_o2.length();if(dq<3.2)return true;if(dq>dp-.4)return false;
 const ang=_o1.angleTo(_o2),r=(p.id==='stilt'?1.1:.75)/dq;return ang<r+.9/dp;}
function readRot(){const k=I.keys;return(k.KeyC?1:0)-(k.KeyZ?1:0)+((gamepad()&&deadzone(gamepad().axes[2]||0,.25))||0);}
const _r1=new V(),_r2=new V();
function ropeEnds(){W.winch.drum.getWorldPosition(_r1);_r1.y+=.42;if(run.rope==='held'){kid.hand.getWorldPosition(_r2);return[_r1,_r2,.35];}W.boat.bow.getWorldPosition(_r2);const d=_r1.distanceTo(_r2);return[_r1,_r2,run.winch>0||run.power?.05:Math.min(1.2,d*.05)];}
function ptScale(){return innerHeight*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));}
function menuCam(dt){if(camFree)return;const t=gT*.06;cam.position.set(2.2+Math.sin(t)*1.2,4.6+Math.sin(t*.7)*.3,15.4+Math.cos(t)*1);cam.lookAt(13.2,1.5,20.6);}

/* ================= objective + hints ================= */
const STEPS=[{k:'crank',t:'Dig up the winch crank',ab:'DIG'},{k:'line',t:'Hook the tow line to the Puffin',ab:'BRIDGE'},{k:'fit',t:'Fit the crank to the winch',ab:''},{k:'power',t:'Power the winch, or crank it by hand',ab:'ZAP'},{k:'home',t:'Winch the Puffin home',ab:''}];
function stepDone(k){return k==='crank'?run.crank!=='buried':k==='line'?run.rope==='hooked':k==='fit'?run.crank==='fitted':k==='power'?run.power||run.winch>0:run.winch>=1;}
function curStep(){if(run.rope==='held')return 1;for(let i=0;i<STEPS.length;i++)if(!stepDone(STEPS[i].k))return i;return 4;}
function goal(){const s=curStep(),h=DIFF[run.diff].hint;const met=id=>pals[id].met;
 if(s===0){if(!met('mollo'))return[pals.mollo.pos,'Find a digger: '+hintWhere('mollo')];const m=W.mounds[run.real];return[new V(m.x,m.y,m.z),h>=1?'Mollo can dig up the flagged mound [F]':'One of the beach mounds hides the crank. Watch Mollo sniff.'];}
 if(s===1){if(run.rope==='winch')return[SPOTS.winch,'Take the tow line from the winch [E]'];if(!pals.stilt.bridgeK&&pals.stilt.mode!=='bridge')return met('stilt')?[SPOTS.gap,'The pier is broken: Stilt can BRIDGE the gap [F]']:[pals.stilt.pos,'The pier is broken. '+hintWhere('stilt')];
  W.boat.bow.getWorldPosition(BOW);return[BOW.clone(),'Hook the line to the Puffin\'s bow [E]'];}
 if(s===2)return[SPOTS.winch,'Fit the crank to the winch [E]'];
 if(s===3)return met('fizz')?[SPOTS.motor,'ZAP the motor with Fizz [F], or hold [E] at the winch to crank by hand']:[SPOTS.winch,'Hold [E] at the winch to crank by hand. '+hintWhere('fizz')+' It could power the motor.'];
 return[SPOTS.winch,run.power?'The motor is winching the Puffin home!':'Keep cranking! Hold [E]'];}
function markerTarget(dt){const[p]=goal(),h=DIFF[run.diff].hint;const s=curStep();if(s!==hintStep){hintStep=s;hintT=0;}hintT+=dt;
 const d=Math.hypot(p.x-P.pos.x,p.z-P.pos.z);const on=h===2||(h===1&&(d<18||hintT>25));const q=p.clone();q.y=Math.max(heightAt(q.x,q.z),q.y-.5);if(q.y<-50)q.y=p.y;return[q,on&&!(run.winch>0&&run.power)];}

/* ================= HUD ================= */
const hc={};function setTxt(id,v){if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}}
const SVG={mollo:'<path d="M5 33 Q5 15 24 14 Q43 15 43 33 Z"/><path d="M24 14 L24 7"/><ellipse cx="19" cy="7" rx="5" ry="2.2" transform="rotate(-25 19 7)"/><ellipse cx="29" cy="6.5" rx="5" ry="2.2" transform="rotate(25 29 6.5)"/><ellipse cx="9" cy="33" rx="6" ry="2.6"/><ellipse cx="39" cy="33" rx="6" ry="2.6"/>',
 stilt:'<ellipse cx="22" cy="15" rx="11" ry="4.5"/><path d="M30 13 Q34 6 36 3" stroke-width="3" fill="none"/><ellipse cx="37" cy="3.5" rx="3.4" ry="2.6"/><path d="M38 4 L46 5 L38 6 Z"/><path d="M18 18 L16 28 L19 38" stroke-width="2.2" fill="none"/><path d="M26 18 L28 28 L25 38" stroke-width="2.2" fill="none"/>',
 fizz:'<path d="M10 20 Q10 6 24 6 Q38 6 38 20 Z"/><path d="M24 6 L24 1"/><circle cx="24" cy="1.5" r="2"/><path d="M13 21 Q11 28 14 35 M19 21 Q18 29 20 37 M24 21 Q25 30 23 38 M29 21 Q31 29 28 37 M35 21 Q37 28 34 35" stroke-width="2" fill="none"/>'};
function svg(id){return`<svg viewBox="0 0 48 40" class="sil sil-${id}" aria-hidden="true"><g fill="currentColor" stroke="currentColor" stroke-linecap="round">${SVG[id]}</g></svg>`;}
function hudBuild(){$('pals').innerHTML=ORDER.map((id,i)=>`<div class="pal" id="ps-${id}" style="--pc:${SPECIES[id].col}"><kbd>${i+1}</kbd>${svg(id)}<div><b>${SPECIES[id].name}</b><span class="ab">${SPECIES[id].abName}</span><span class="st" id="pst-${id}"></span></div></div>`).join('');
 ORDER.forEach(id=>$('ps-'+id).onclick=()=>select(id));for(const k in hc)delete hc[k];hudAll();}
function palStatus(id){const p=pals[id];if(!p.met)return'NOT MET';if(p.mode==='bridge')return'BRIDGING';if(p.mode==='work')return{dig:'DIGGING',zap:'ZAPPING',bridge:'STRETCHING'}[p.work.kind];return id===run.sel?'LEADING':'FOLLOWING';}
function hudPals(){for(const id of ORDER){const el=$('ps-'+id);if(!el)continue;el.classList.toggle('on',id===run.sel);el.classList.toggle('locked',!pals[id].met);setTxt('pst-'+id,(id===run.sel?'▲ ACTIVE · ':'')+palStatus(id));}
 const p=pals[run.sel];setTxt('abl',`[F] ${p.S.abName} · ${p.S.name}`);}
function hudAll(){if(!run)return;const s=curStep();$('stepn').textContent=`STEP ${Math.min(5,s+1)} OF 5 · `;$('steps').innerHTML=STEPS.map((S,i)=>{const d=stepDone(S.k);return`<li class="${d?'done':i===s?'cur':''}"><i>${d?'✓':i===s?'▶':'○'}</i>${S.t}${S.ab&&!d?` <em>${S.ab}</em>`:''}</li>`;}).join('');hudPals();document.documentElement.style.setProperty('--objh',$('obj').offsetHeight+'px');}
let lastFocus='';
function hud(dt,fc){const tf=1-run.clock/run.len;setTxt('tclock',fmt(run.clock));setTxt('tpct',`TIDE ${Math.round(tf*100)}% IN`);$('tfill').style.transform=`scaleX(${cl(tf,0,1)})`;$('tide').classList.toggle('warn',run.clock<60);
 const g=goal();setTxt('hint',g[1]);const fk=fc?fc.k+fc.txt:'';if(fk!==lastFocus){lastFocus=fk;$('pE').hidden=!fc;if(fc)setTxt('pEt',fc.txt);}
 const T=abilityTargets(),p=pals[run.sel],mine=T.find(t=>t.ab===p.S.ab);setTxt('pFt',p.mode==='bridge'?`${p.S.name} is holding the bridge`+(onFar(P.pos)?'':' · [F] fold up'):mine?`${p.S.abName} the ${mine.name}`:T.length?`The ${T[0].name} needs ${SPECIES[ORDER.find(id=>SPECIES[id].ab===T[0].ab)].abName}`:`${p.S.abName} · nothing nearby`);
 $('pF').classList.toggle('ok',!!mine||p.mode==='bridge');$('pF').classList.toggle('need',!mine&&T.length>0&&p.mode!=='bridge');
 const wr=$('winchbar');const showW=ready()&&run.winch<1;wr.hidden=!showW&&!(run.winch>0&&run.winch<1);if(!wr.hidden){$('wfill').style.transform=`scaleX(${run.winch})`;setTxt('wlbl',run.power?'MOTOR WINCHING':'HAND CRANK · HOLD E');}
 for(const id of ORDER)setTxt('pst-'+id,(id===run.sel?'▲ ACTIVE · ':'')+palStatus(id));
 tags();if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}}
function hud2(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}tags();}
// floating tags: a "NEW PAL" bubble over pals not met yet, a "!" when Mollo sniffs, names over the line
const _t=new V();function tags(){const host=$('tags');if(app!=='play'){host.innerHTML='';return;}let h='';const w=innerWidth,hh=innerHeight;
 for(const id of ORDER){const p=pals[id];_t.copy(p.pos);_t.y+=id==='stilt'?2.7:id==='fizz'?2.1:1.4;if(Math.hypot(p.pos.x-P.pos.x,p.pos.z-P.pos.z)>22)continue;_t.project(cam);if(_t.z>1)continue;const x=(_t.x*.5+.5)*w,y=(-_t.y*.5+.5)*hh;
  const lab=!p.met?`<b class="new">? NEW PAL</b>`:p.react==='sniff'&&p.reactT>0?`<b class="bang">!</b>`:id===run.sel?`<b class="lead">▲ ${p.S.name}</b>`:'';if(!lab)continue;h+=`<div class="tag" style="left:${x|0}px;top:${y|0}px;--pc:${p.S.col}">${lab}</div>`;}
 host.innerHTML=h;}

/* ================= rendering ================= */
let gfx=quality(),fxStack=null,fxSize='';
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.15:.85));fxStack=null;fxSize='';sun.castShadow=q>0;sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
 for(const id of ORDER)if(pals[id].U.light)pals[id].U.light.visible=true;lampL.forEach(l=>l.visible=q>0);W.M.stone.bumpMap=q>0?W.T.cob:null;W.M.stone.needsUpdate=true;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
 if(!fxStack){fxStack=cinematic(R,scene,cam,{quality:gfx,bloom:opt.fx?.35:.55,bloomRadius:.55,bloomThreshold:.86,exposure:1.02,saturation:1.08,vignette:.3,grain:opt.fx?0:.02,aoStrength:.75});fxSize='';}
 const key=w+'x'+h;if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}fxStack.render();}

/* ================= menus ================= */
const pick=pickers(opt,saveOpt);pick('o-diff','diff',true,()=>snd.play('click'));pick('o-pal','starter',false,v=>{snd.init();snd.play(v);menuPal();});pick('o-fx','fx',true,()=>{fxStack=null;});
function menuPal(){const S=SPECIES[opt.starter];$('mpal').textContent=`${S.name} · ${S.abName}: ${S.verb}. Body: ${S.body}.`;}
document.querySelectorAll('#o-pal button').forEach(b=>{const id=b.dataset.v;b.innerHTML=`${svg(id)}<b>${SPECIES[id].name}</b><span>${SPECIES[id].abName}</span>`;b.style.setProperty('--pc',SPECIES[id].col);});
menuPal();
$('go').onclick=()=>{snd.init();start({});};$('cont').onclick=()=>{snd.init();start({resume:true});};
$('wipe').onclick=()=>{if($('wipe').dataset.arm){try{localStorage.removeItem(SAVE);}catch(e){}loadMeta();for(const id of ORDER)pals[id].met=false;menuBest();$('wipe').textContent='SAVE CLEARED';delete $('wipe').dataset.arm;}else{$('wipe').dataset.arm=1;$('wipe').textContent='CLICK AGAIN TO CLEAR';}};
$('resume').onclick=()=>pause(false);$('pmenu').onclick=()=>{saveGame();toMenu();};$('prestart').onclick=()=>{$('pause').hidden=true;start({});};
$('again').onclick=()=>start({});$('omenu').onclick=toMenu;
postButton($('post'),ID,()=>{const L=last||{};return[L.pts||0,`Game: Harbor Pals\nScore: ${L.pts||0}\n${L.won?'Puffin saved':'Tide came in'} · ${L.ns||0}/3 stars · ${L.diff||''}\nTime ${fmt(L.time||0)} · tide left ${fmt(L.left||0)} · uses DIG ${L.uses?.dig||0} BRIDGE ${L.uses?.bridge||0} ZAP ${L.uses?.zap||0}`];});

/* ================= boot + loop ================= */
let lastT=performance.now();
function loop(now){const dt=Math.max(0,Math.min(.05,(now-lastT)/1000));lastT=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}
async function boot(){try{await Promise.race([Promise.all([document.fonts.load("400 80px Anton"),document.fonts.load("700 30px 'JetBrains Mono'")]),new Promise(r=>setTimeout(r,1500))]);}catch(e){}
 toMenu();requestAnimationFrame(loop);}
function menuScene(){for(const id of ORDER){const p=pals[id];p.mode='wild';p.work=null;p.bridgeK=0;p.met=meta.met.includes(id);}setBridge(false);arc.set(null,null,false);rope.set(null,null,0,false);
 const fy=(x,z)=>Math.atan2(3.2-x,16.5-z);pals.mollo.place(new V(12.2,0,20.6),fy(12.2,20.6)+.3);pals.stilt.place(new V(10.4,0,22.2),fy(10.4,22.2)+.5);pals.fizz.place(new V(13.3,0,21.9),fy(13.3,21.9));P.pos.set(11.3,.42,21.2);P.yaw=fy(11.5,21.3);kid.root.rotation.y=P.yaw;kid.root.visible=true;W.winch.crank.visible=false;
 W.mounds.forEach(m=>{m.mound.visible=true;m.pebbles.forEach(x=>x.visible=true);m.hole.visible=false;m.pile.visible=false;m.flag.visible=false;});W.motor.bulbMat.color.setHex(0x552222);W.motor.bulbMat.emissive.setHex(0x220000);placeBoat0();}
function placeBoat0(){const g=W.boat.g;g.position.set(10.2,.17,23.6);g.rotation.set(0,Math.atan2(7-10.2,14-23.6),0);W.boat.hull.rotation.z=.2;W.setTide(-.35);}
boot();

/* ================= test hook ================= */
window.HARBOR={get state(){return app;},get app(){return app;},step,render,
 start:(o={})=>start(o),continue:()=>start({resume:true}),restart:()=>start({}),toMenu,pause,
 get run(){return run;},get last(){return last;},get score(){return last?last.pts:0;},get meta(){return loadMeta();},P,pals,trail,W,SPOTS,ground,heightAt,cam,camS,
 get level(){return W.level;},get focus(){return focus();},targets:()=>abilityTargets(),goal:()=>{const g=goal();return{p:g[0].clone(),text:g[1],step:curStep()};},
 select:id=>select(id),cycle:()=>{act.cycle=true;},ability:()=>useAbility(),interact:()=>interact(),reset:()=>recover('post'),
 hold(on=true){touch.E=on;},key(code,down=true){I.keys[code]=down;if(down)I.edge[code]=true;},
 stick(x,z){touch.id=(x||z)?-1:null;touch.x=x;touch.y=-z;},
 // walk toward (x,z) by steering the virtual stick each step; returns true on arrival
 walk(x,z,maxT=30,tol=.5){const dt=1/30;for(let t=0;t<maxT;t+=dt){const dx=x-P.pos.x,dz=z-P.pos.z,d=Math.hypot(dx,dz);if(d<tol){this.stick(0,0);step(dt);return true;}
  const f=new V(Math.sin(camS.yaw),0,Math.cos(camS.yaw)),r=new V(-Math.cos(camS.yaw),0,Math.sin(camS.yaw));const k=Math.min(1,d/1.2);this.stick((dx*r.x+dz*r.z)/d*k,(dx*f.x+dz*f.z)/d*k);step(dt);if(app!=='play')break;}this.stick(0,0);return false;},
 walkPath(pts,maxT=40){for(const[x,z]of pts)if(!this.walk(x,z,maxT))return false;return true;},
 wait(sec,dt=1/30){for(let t=0;t<sec;t+=dt)step(dt);},
 teleport(x,z,yaw){P.pos.set(x,heightAt(x,z),z);if(yaw!=null)P.yaw=yaw;P.lastSafe.copy(P.pos);P.grounded=true;P.vy=0;seedTrail();placeLine(false);camS.snap=true;},
 setClock(s){if(run)run.clock=s;},saveNow:()=>saveGame(),
 sync(){const sel=run&&run.sel,lead=run?lineOrder()[0]:null,dom=document.querySelector('#pals .pal.on');let saved=null;try{saved=JSON.parse(localStorage.getItem(SAVE)).run?.sel??null;}catch(e){}
  return{sel,leader:lead,leaderMode:sel?pals[sel].mode:null,hudActive:dom?dom.id.slice(3):null,abilityLabel:$('abl').textContent,saved,menuPick:opt.starter};},
 // push a pal off its trail behind a wall to check the stuck → teleport recovery
 strand(id,x,z){const p=pals[id];p.pos.set(x,heightAt(x,z),z);p.free=true;p.bestD=1e9;p.stuckT=0;},
 get info(){const i=R.info.render;return{calls:i.calls,tris:i.triangles,progs:R.info.programs.length};},setQuality:q=>applyQuality(q),freeCam(on=true){camFree=on;},get gfx(){return gfx;},opt,snd,DIFF};
