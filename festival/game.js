// LANTERN STREET — entry module: renderer and follow camera, the quest state machine (neighbours, parts, costume, beam, battle,
// relight, parade), dialogue, battle presentation (timing rings, floats, poses), HUD, save/load, menus, results and the
// window.LANTERN test hook. The authoritative state is S (serialisable); everything on screen is derived from it.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {$,stored,pickers,postButton,toast} from '../js/kit3d/ui.js';
import {V3,cl,lerp,damp,dampAng,angDiff,sstep,fmtT,rnd,Particles} from './util.js';
import {DIFF,PARTS,PART_ORDER,RES,RES_ORDER,MOVES} from './data.js';
import {buildWorld,ground,setRestore,updateWorld,litCount,LOFT,KNOT,BENCH,BELL,START} from './world.js';
import {makeWren,makeKnight,makeFern,makeTeo,makeJuno,makePuffkin,makeBellows,animPuffkin,animBellows,pose} from './chars.js';
import {Battle} from './battle.js';
import {Sound} from './sound.js';

const ID='lanternstreet',SAVE='lanternstreet_save',DONE='lanternstreet_done';
const opt={diff:1,assist:0,fx:1};const saveOpt=stored('lanternstreet_opts',opt);
/* ================= renderer / scene ================= */
const canvas=$('c'),ov=$('ov'),ox=ov.getContext('2d');
const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});let gfx=quality();
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x1c1530,.017);scene.background=new THREE.Color(0x0c0a18);
const camera=new THREE.PerspectiveCamera(46,1,.3,400);
const hemi=new THREE.HemisphereLight(0x8a94d8,0x3a2838,1.15);scene.add(hemi);
const moon=new THREE.DirectionalLight(0xa8b8ff,1.05);moon.position.set(-14,30,-8);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.bias=-.0006;moon.shadow.normalBias=.04;
Object.assign(moon.shadow.camera,{left:-22,right:22,top:22,bottom:-22,near:1,far:90});scene.add(moon,moon.target);
const LIGHTS=[];for(let i=0;i<6;i++){const l=new THREE.PointLight(0xffa050,0,11,1.4);scene.add(l);LIGHTS.push(l);}
const plight=new THREE.PointLight(0xffa860,3.2,7.5,1.4);scene.add(plight);
const spot=new THREE.SpotLight(0xfff0c0,0,18,.36,.5,1.1);scene.add(spot,spot.target);
const POST={bloom:.75,bloomRadius:.55,bloomThreshold:.7,vignette:.4,saturation:1.14,grain:.018,exposure:1.02};
let fxStack=null;
const W=buildWorld(scene,gfx);
const parts=new Particles(scene,3000,'add'),smoke=new Particles(scene,900,'alpha');
const colC={};const col=s=>colC[s]||(colC[s]=new THREE.Color(s));
const snd=new Sound();
/* ================= characters ================= */
const wren=makeWren();scene.add(wren.root);
const knight=makeKnight();knight.root.visible=false;scene.add(knight.root);
const NPC={fern:{r:makeFern(),x:0,z:0,ry:0,st:'idle',spd:0,wp:0,wt:0},teo:{r:makeTeo(),x:0,z:0,ry:0,st:'idle',spd:0,wp:0,wt:0},juno:{r:makeJuno(),x:0,z:0,ry:0,st:'idle',spd:0,wp:0,wt:0}};
for(const k in NPC)scene.add(NPC[k].r.root);
const FOE_HOME=[new V3(12,4.5,-17.9),new V3(14.1,4.5,-19.6),new V3(12.9,4.5,-21.9)];
const foeM=[makePuffkin(0),makeBellows(),makePuffkin(2)];foeM.forEach((f,i)=>{f.position.copy(FOE_HOME[i]);if(i!==1)f.scale.setScalar(1.25);scene.add(f);f.userData.pos=FOE_HOME[i].clone();f.userData.flee=0;});
const HERO_HOME=new V3(9.3,4.5,-23.4),HERO_RY=Math.atan2(13-9.3,-19.8+23.4);
// lighthouse beam (cone + spotlight) attached to Wren
const beamM=new THREE.MeshBasicMaterial({color:0xfff0b0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
const beamMesh=new THREE.Mesh(new THREE.ConeGeometry(1.5,7.5,24,1,true).translate(0,-3.75,0).rotateX(-Math.PI/2),beamM);beamMesh.position.set(0,1.75,.2);beamMesh.rotation.x=.1;beamMesh.renderOrder=4;wren.root.add(beamMesh);
/* ================= state ================= */
let app='menu',S=null,B=null,paused=false,dlg=null,cine=null,lastAward=null,FAST=false,noHud=false,shake=0,saveT=0,menuT=0,lastDt=1/60;
const P={x:START.x,z:START.z,y:0,ry:Math.PI,spd:0,beam:false,stepT:0};
let near=null,floats=[],battleSel=0,tgt=0,act=null,noticeSig='';
function freshState(diff,assist){return{v:1,run:Date.now().toString(36)+Math.floor(Math.random()*1e4),diff,assist:assist?1:0,phase:'street',t:0,limit:DIFF[diff].clock,
 parts:{helm:0,body:0,shield:0},hint:{helm:0,body:0,shield:0},met:{fern:0,teo:0,juno:0},talk:{fern:[0,0,0],teo:[0,0,0],juno:[0,0,0]},
 blueprint:0,costume:0,knot:0,gate:0,won:0,tries:0,grade:null,gsc:0,bell:0,pos:{x:START.x,z:START.z,ry:Math.PI},awarded:0,lastBattle:null};}
const D=()=>DIFF[S.diff];
const nParts=()=>PART_ORDER.filter(k=>S.parts[k]).length,nMet=()=>RES_ORDER.filter(k=>S.met[k]).length;
const ph=()=>S.won?2:S.costume?1:0;
/* ================= input ================= */
const I=controls(canvas,{canLock:()=>false,onKey:(e,first)=>onKey(e,first)});
const touch={x:0,z:0,id:null,act:false,beam:false};let padPrev={};
function onKey(e,first){if(!first)return;snd.init();if(app==='menu'||app==='over')return;
 if(e.code==='Escape'||e.code==='KeyP'){if($('lose').hidden)togglePause();return;}
 if(paused){if(e.code==='KeyR')unstuck();return;}
 if(dlg){if(['KeyE','Space','Enter','NumpadEnter'].includes(e.code)){e.preventDefault();advance();}return;}
 if(S&&S.phase==='battle'&&B){battleKey(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();return;}
 if(['KeyE','Space','Enter'].includes(e.code)){e.preventDefault();interact();}}
function battleKey(c){if(B.ring&&!B.ring.res){if(['Space','KeyE','Enter','NumpadEnter','KeyF'].includes(c))doPress();return;}
 if(B.phase!=='menu')return;const n=['Digit1','Digit2','Digit3','Digit4'].indexOf(c);if(n>=0){doMove(n);return;}
 if(c==='ArrowLeft'||c==='KeyA')cycleT(-1);else if(c==='ArrowRight'||c==='KeyD'||c==='Tab')cycleT(1);else if(c==='ArrowUp'||c==='KeyW'){battleSel=(battleSel+2)%4;menuSig='';}else if(c==='ArrowDown'||c==='KeyS'){battleSel=(battleSel+2)%4;menuSig='';}
 else if(c==='Space'||c==='Enter'||c==='KeyE')doMove(battleSel);}
function pollPad(){const g=gamepad();if(!g)return null;const b=i=>!!(g.buttons[i]&&g.buttons[i].pressed),e=i=>b(i)&&!padPrev[i];
 const out={x:deadzone(g.axes[0]||0),z:deadzone(g.axes[1]||0),beam:b(2)};
 if(e(9))togglePause();else if(app==='play'&&!paused){if(dlg){if(e(0))advance();}else if(S&&S.phase==='battle'&&B){if(e(0))battleKey('Space');if(e(14))battleKey('ArrowLeft');if(e(15))battleKey('ArrowRight');if(e(12)||e(13))battleKey('ArrowUp');}else if(e(0))interact();}
 padPrev={};g.buttons.forEach((x,i)=>padPrev[i]=x.pressed);return out;}
// touch: stick + ACT + BEAM
{const st=$('stick'),knob=st.querySelector('i');const mv=e=>{const r=st.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width/2),dz=(e.clientY-r.top-r.height/2)/(r.height/2),l=Math.hypot(dx,dz),k=l>1?1/l:1;touch.x=dx*k;touch.z=dz*k;knob.style.transform=`translate(${touch.x*36}px,${touch.z*36}px)`;};
 st.addEventListener('pointerdown',e=>{touch.id=e.pointerId;st.setPointerCapture(e.pointerId);mv(e);snd.init();});st.addEventListener('pointermove',e=>{if(e.pointerId===touch.id)mv(e);});
 const up=e=>{if(e.pointerId!==touch.id)return;touch.id=null;touch.x=touch.z=0;knob.style.transform='';};st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
 $('bAct').addEventListener('pointerdown',e=>{e.preventDefault();snd.init();if(dlg)advance();else if(S&&S.phase==='battle'&&B)battleKey('Space');else interact();});
 const bb=$('bBeam');bb.addEventListener('pointerdown',e=>{e.preventDefault();touch.beam=true;bb.classList.add('on');});const bu=()=>{touch.beam=false;bb.classList.remove('on');};bb.addEventListener('pointerup',bu);bb.addEventListener('pointercancel',bu);bb.addEventListener('pointerleave',bu);
 addEventListener('touchstart',()=>document.body.classList.add('touch'),{passive:true});if(matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');}
canvas.addEventListener('pointerdown',()=>{snd.init();if(app!=='play'||paused)return;if(dlg){advance();return;}if(S&&S.phase==='battle'&&B&&B.ring&&!B.ring.res)doPress();});
$('dlg').addEventListener('pointerdown',e=>{e.stopPropagation();advance();});
/* ================= movement & collision ================= */
function blocked(x,z,y){const g=ground(x,z);if(g===null||Math.abs(g-y)>.8)return true;return false;}
function colliders(){const L=W.colliders.slice();if(!S||!S.gate)L.push({x:KNOT.x,z:KNOT.z,r:1.25});for(const k in NPC)L.push({x:NPC[k].x,z:NPC[k].z,r:.45,y:NPC[k].y||0});return L;}
function movePlayer(dt,mx,mz,spd){let nx=P.x+mx*spd*dt,nz=P.z+mz*spd*dt;
 for(const c of colliders()){if(Math.abs((c.y||0)-P.y)>2)continue;const dx=nx-c.x,dz=nz-c.z,d=Math.hypot(dx,dz),rr=c.r+.35;if(d<rr&&d>1e-4){nx=c.x+dx/d*rr;nz=c.z+dz/d*rr;}}
 if(!blocked(nx,nz,P.y)){P.x=nx;P.z=nz;}else if(!blocked(nx,P.z,P.y))P.x=nx;else if(!blocked(P.x,nz,P.y))P.z=nz;
 const g=ground(P.x,P.z);if(g!==null)P.y=damp(P.y,g,18,dt);}
/* ================= interactions ================= */
function targets(){const L=[];if(!S)return L;const won=S.won;
 for(const id of RES_ORDER){const n=NPC[id];L.push({k:'res',id,x:n.x,z:n.z,y:n.y||0,r:2.3,label:'TALK · '+RES[id].n});}
 for(const k of PART_ORDER)if(!S.parts[k]){const[x,z]=PARTS[k].pos;L.push({k:'part',id:k,x,z,y:ground(x,z),r:1.8,label:'PICK UP · '+PARTS[k].n});}
 if(!S.costume){const ok=S.blueprint&&nParts()===3;L.push({k:'bench',x:BENCH.x,z:BENCH.z,y:0,r:2.5,deny:!ok,label:ok?'BUILD THE LIGHTHOUSE COSTUME':!S.blueprint?'WORKBENCH · ASK TEODOR FOR THE PLAN':'WORKBENCH · NEED 3 PARTS ('+nParts()+'/3)'});}
 if(!S.gate)L.push({k:'knot',x:KNOT.x,z:KNOT.z,y:0,r:3.6,deny:!S.costume,label:S.costume?'HOLD Q / BEAM · SHINE ON THE GLOOM KNOT':'A GLOOM KNOT BLOCKS THE STAIRS · YOU NEED A REAL LIGHT'});
 L.push({k:'bell',x:BELL.x,z:BELL.z,y:0,r:2.6,deny:!won,label:won?'RING THE PARADE BELL':'PARADE BELL · LIGHT THE STREET FIRST'});return L;}
function findNear(){let best=null,bd=1e9;for(const t of targets()){const d=Math.hypot(t.x-P.x,t.z-P.z);if(d<t.r&&Math.abs((t.y||0)-P.y)<1.6&&d+(t.k==='res'?.8:0)<bd){bd=d+(t.k==='res'?.8:0);best=t;}}return best;}
function interact(){if(!S||S.phase!=='street'||cine||dlg)return;const t=near;if(!t)return;
 if(t.k==='res')talk(t.id);
 else if(t.k==='part')pickPart(t.id);
 else if(t.k==='bench'){if(t.deny){note(t.label.replace('WORKBENCH · ',''),'bad');snd.play('deny');}else assemble();}
 else if(t.k==='knot'){if(t.deny){note('Too dark to untie. Teodor will know what to do.','bad');snd.play('deny');}else note('Hold Q (or BEAM) and face the knot','');}
 else if(t.k==='bell'){if(t.deny){note('The bell waits for a lit street.','bad');snd.play('deny');}else ringBell();}}
function pickPart(k){if(S.parts[k])return;S.parts[k]=1;const m=W.partMesh[k];m.g.visible=false;const p=m.g.position;burst(p.x,p.y+.8,p.z,40,3,['#ffd27a','#fff0c0','#ff9a40'],.5,1);snd.play('pickup');
 banner(PARTS[k].n,`${PARTS[k].d.toUpperCase()} · PARTS ${nParts()}/3`);if(nParts()===3)note(S.blueprint?'All three parts! Take them to Teodor\'s workbench.':'All three parts! Teodor will know how to put them together.','good');save();}
function assemble(){cine={kind:'assemble',t:0,dur:FAST?.4:2.8,step:0};snd.play('tape');P.ry=Math.PI/2;}
function ringBell(){S.bell=1;snd.play('bell');snd.play('cheer');cine={kind:'parade',t:0,dur:FAST?.3:5.5};banner('THE PARADE BEGINS','THE WHOLE STREET COMES OUT');snd.music('fest');}
function unstuck(){if(!S||S.phase!=='street')return;P.x=START.x;P.z=START.z;P.y=0;P.ry=Math.PI;togglePause();note('Back at the festival gate.','');}
/* ================= dialogue ================= */
function talk(id){const r=RES[id];let lines,first=!S.met[id];if(first)lines=r.meet;else{const p=ph(),L=r.lines[p],i=Math.min(S.talk[id][p],L.length-1);lines=[L[i]];S.talk[id][p]=Math.min(L.length,S.talk[id][p]+1);}
 if(first)S.met[id]=1;dlg={id,lines,i:0,shown:0,full:lines[0][0]};applyEff(lines[0]);$('dlg').hidden=false;$('dlgN').textContent=r.n;$('dlgR').textContent=r.role;$('dlg').querySelector('.who').style.background=r.col;$('dlgT').textContent='';snd.play('talk',RES_ORDER.indexOf(id));}
function applyEff(l){const e=l[1];if(!e)return;if(e==='blueprint'&&!S.blueprint){S.blueprint=1;setTimeout(()=>note('Got Teodor\'s plan: a box helm, a tower tube, a lid shield.','good'),10);}else if(e.startsWith('hint:')){const k=e.slice(5);if(!S.hint[k]){S.hint[k]=1;}}}
function advance(){if(!dlg)return;if(dlg.shown<dlg.full.length){dlg.shown=dlg.full.length;return;}dlg.i++;if(dlg.i>=dlg.lines.length){const id=dlg.id;dlg=null;$('dlg').hidden=true;save();if(id==='fern'&&nMet()===1)note('Find Teodor in the workshop with the purple sofa.','');return;}
 dlg.full=dlg.lines[dlg.i][0];dlg.shown=0;applyEff(dlg.lines[dlg.i]);snd.play('talk',RES_ORDER.indexOf(dlg.id));}
/* ================= effects / messages ================= */
function burst(x,y,z,n,s,c,size,life,o={}){if(!opt.fx)n=Math.ceil(n*.35);parts.burst(new V3(x,y,z),n,s,Array.isArray(c)?c.map(col):col(c),size,life,o);}
function puff(x,y,z,n,c='#8a80a8',size=1.4,life=1.4){if(!opt.fx)n=Math.ceil(n*.4);const cc=col(c);for(let i=0;i<n;i++)smoke.emit(x+rnd(-.4,.4),y+rnd(-.2,.3),z+rnd(-.4,.4),rnd(-1,1),rnd(.3,1.4),rnd(-1,1),cc.r,cc.g,cc.b,size,life,0,1.4);}
function note(t,cls){const d=toast($('toasts'),t,3800,3,false);if(cls)d.className=cls;}
let bannerT=0;function banner(a,b,dur=2.6){const e=$('banner');e.querySelector('b').textContent=a;e.querySelector('span').textContent=b||'';e.classList.add('on');bannerT=dur;}
function flash(){if(FAST)return;const f=$('fade');f.style.transition='none';f.style.opacity=opt.fx?.85:.4;requestAnimationFrame(()=>{f.style.transition='opacity .5s';f.style.opacity=0;});setTimeout(()=>{f.style.transition='opacity .5s';f.style.opacity=0;},30);}
function float(x,y,z,text,c='#fff',big=false){floats.push({p:new V3(x,y,z),text,c,t:0,big});}
/* ================= battle ================= */
function startBattle(){S.phase='battle';S.tries++;B=new Battle(D(),S.assist);tgt=0;battleSel=0;act=null;menuSig='';
 wren.root.visible=false;knight.root.visible=true;knight.root.position.copy(HERO_HOME);knight.root.rotation.y=HERO_RY;foeM.forEach((f,i)=>{f.visible=true;f.userData.pos.copy(FOE_HOME[i]);f.position.copy(FOE_HOME[i]);f.rotation.y=HERO_RY+Math.PI;f.userData.flee=0;f.scale.setScalar(i===1?1:1.25);});
 flash();snd.play('transform');snd.music('fight');burst(HERO_HOME.x,HERO_HOME.y+1.5,HERO_HOME.z,70,5,['#fff0a0','#ffd060','#ffffff'],.6,1.2);
 banner('LIGHTHOUSE KNIGHT!','THE CARDBOARD BECOMES THE REAL THING',1.6);$('bhud').hidden=noHud;$('hud').hidden=true;$('assistTag').hidden=!S.assist;save();}
function cycleT(d){const al=B.foes.filter(f=>f.alive);if(!al.length)return;let i=al.findIndex(f=>f.i===tgt);i=(i+d+al.length)%al.length;tgt=al[i].i;menuSig='';}
function doMove(i){if(!B||B.phase!=='menu')return;if(!B.can(i)){snd.play('deny');$('bmsg').textContent=MOVES[i].cost>B.hero.glow?'NOT ENOUGH GLOW':'ALREADY AT FULL HP';return;}battleSel=i;
 if(!B.foes[tgt]||!B.foes[tgt].alive)cycleT(1);B.choose(i,tgt);snd.play('ui');menuSig='';}
function doPress(){if(!B||!B.ring||B.ring.res)return;B.press();}
const foePos=i=>foeM[i].position;
function battleEvents(){for(const e of B.ev){switch(e.e){
 case'menu':$('bmsg').textContent='CHOOSE A MOVE';menuSig='';break;
 case'use':$('bmsg').textContent=e.n+'!';act={k:e.move,t:0,tgt:e.tgt};break;
 case'ring':snd.play('ring');break;
 case'timing':{const p=e.kind==='atk'?(act&&act.tgt>=0?foePos(act.tgt):knight.root.position):knight.root.position;float(p.x,p.y+2.6,p.z,e.res+(e.res==='GREAT'?'!':''),e.res==='GREAT'?'#fff0a0':e.res==='GOOD'?'#9af0b0':'#ff9a8a',true);snd.play(e.res==='GREAT'?'great':e.res==='GOOD'?'good':'miss');break;}
 case'hit':{const p=foePos(e.i);float(p.x,p.y+1.8,p.z,'-'+e.amt,'#ffffff');burst(p.x,p.y+1,p.z,e.res==='GREAT'?40:20,4,['#fff0a0','#ffb040'],.4,.7);snd.play('hit',e.res==='GREAT'?2:1);if(opt.fx)shake=Math.max(shake,e.res==='GREAT'?.35:.18);foeM[e.i].userData.hurt=.4;break;}
 case'faint':{const p=foePos(e.i);puff(p.x,p.y+1,p.z,24,'#b0a8d0',1.6,1.6);snd.play('faint');foeM[e.i].userData.flee=.01;note(e.s,'good');break;}
 case'glow':break;
 case'guard':$('bmsg').textContent='KEEPER\'S WALL · '+e.res+' · +'+e.g+' GLOW';burst(knight.root.position.x+.6,5.6,knight.root.position.z,30,3,['#9ad8ff','#ffffff'],.4,.8);break;
 case'heal':{const p=knight.root.position;float(p.x,p.y+3,p.z,'+'+e.amt+' HP','#9af0b0');burst(p.x,p.y+2,p.z,40,2.5,['#fff0a0','#9af0b0'],.5,1);snd.play('heal');break;}
 case'inhale':$('bmsg').textContent=e.s;snd.play('inhale');foeM[1].userData.inhale=1;break;
 case'fatk':$('bmsg').textContent=e.s+(B.assist?'':' · PRESS WHEN THE RING CLOSES');act={k:'foe',i:e.i,t:0,move:e.move};if(e.i===1)foeM[1].userData.inhale=0;break;
 case'block':{const p=knight.root.position;float(p.x,p.y+3,p.z,'BLOCKED','#9ad8ff');snd.play('block');burst(p.x+.8,p.y+1.6,p.z,25,3,['#9ad8ff','#ffffff'],.4,.6);break;}
 case'hurt':{const p=knight.root.position;float(p.x,p.y+3,p.z,'-'+e.amt+(e.res==='GOOD'?' (HALVED)':''),'#ff9a8a');snd.play('hurt');puff(p.x+.6,p.y+1.6,p.z,10,'#a098c0',1.2,1);if(opt.fx)shake=Math.max(shake,.3);knight.hurt=.4;break;}
 case'msg':note(e.s,'');break;
 case'win':onWin();break;
 case'lose':onLose();break;}}B.ev.length=0;}
function onWin(){const g=B.grade(S.tries);S.won=1;S.grade=g.g;S.gsc=g.sc;S.lastBattle={...B.st};snd.play('win');
 $('bmsg').textContent='';banner('THE PUFFKINS SCATTER!','BATTLE GRADE '+g.g,2.4);foeM.forEach(f=>{if(!f.userData.flee)f.userData.flee=.01;});cine={kind:'victory',t:0,dur:FAST?.05:1.8};save();}
function endVictory(){S.phase='street';B=null;$('bhud').hidden=true;$('hud').hidden=noHud;knight.root.visible=false;wren.root.visible=true;P.x=HERO_HOME.x;P.z=HERO_HOME.z;P.y=4.5;P.ry=-Math.PI/2;foeM.forEach(f=>f.visible=false);
 cine={kind:'relight',t:0,dur:FAST?.5:7.5};snd.music('fest');save();}
function onLose(){snd.play('lose');snd.music(null);$('lose').hidden=false;$('bhud').hidden=true;}
function retry(){$('lose').hidden=true;startBattle();}
function stepBack(){$('lose').hidden=true;B=null;S.phase='street';knight.root.visible=false;wren.root.visible=true;P.x=7.7;P.z=-9.4;P.y=ground(7.7,-9.4);P.ry=0;$('bhud').hidden=true;$('hud').hidden=noHud;
 foeM.forEach((f,i)=>{f.visible=true;f.userData.pos.copy(FOE_HOME[i]);f.userData.flee=0;});snd.music('night');note('Catch your breath. The loft roof is up the stairs when you\'re ready.','');save();}
/* ================= save / load ================= */
function save(){if(!S||app!=='play'||S.phase==='over')return;const o=JSON.parse(JSON.stringify(S));o.pos={x:P.x,z:P.z,ry:P.ry};if(S.phase==='battle'){o.phase='street';o.pos={x:7.7,z:-9.4,ry:0};}
 try{localStorage.setItem(SAVE,JSON.stringify(o));}catch(e){}}
function loadSave(){try{const o=JSON.parse(localStorage.getItem(SAVE));if(!o||o.v!==1||isDone(o.run))return null;return o;}catch(e){return null;}}
function clearSave(){try{localStorage.removeItem(SAVE);}catch(e){}}
function isDone(run){try{return(JSON.parse(localStorage.getItem(DONE))||[]).includes(run);}catch(e){return false;}}
function markDone(run){try{const l=JSON.parse(localStorage.getItem(DONE))||[];l.push(run);localStorage.setItem(DONE,JSON.stringify(l.slice(-20)));}catch(e){}}
/* ================= round ================= */
function applyState(){// world objects follow S
 for(const k of PART_ORDER)W.partMesh[k].g.visible=!S.parts[k];W.knot.visible=!S.gate;setRestore(W,S.won?1:0);
 wren.setCostume(S.costume?{helm:1,body:1,shield:1}:{});wren.root.visible=true;knight.root.visible=false;
 foeM.forEach((f,i)=>{f.visible=!S.won;f.userData.pos.copy(FOE_HOME[i]);f.position.copy(FOE_HOME[i]);f.userData.flee=0;});
 for(const k in NPC){const n=NPC[k];n.wp=0;n.wt=0;placeNPC(k,true);}}
function start(o={}){snd.init();const sv=o.cont?loadSave():null;
 S=sv||freshState(o.diff??opt.diff,o.assist??opt.assist);if(!sv&&o.fresh!==false)clearSave();B=null;dlg=null;cine=null;lastAward=null;paused=false;floats.length=0;act=null;shake=0;
 P.x=S.pos.x;P.z=S.pos.z;P.y=ground(P.x,P.z)??0;P.ry=S.pos.ry;P.beam=false;parts.clear();smoke.clear();applyState();
 app='play';['menu','over','keys','pause','lose','dlg','bhud'].forEach(id=>$(id).hidden=true);$('hud').hidden=noHud;document.body.classList.add('playing');camSnap=true;
 snd.music(S.won?'fest':'night');
 if(sv)banner('WELCOME BACK',`${DIFF[S.diff].n} · ${fmtT(S.limit-S.t)} UNTIL THE PARADE`);else banner('LANTERN STREET','EVERY LANTERN IS OUT · THE PARADE STARTS AT THE BELL',3.4);
 if(!sv)setTimeout(()=>{if(S&&!S.met.fern&&app==='play')note('Walk with WASD / arrows. Granny Fern is at the dumpling stall ahead.','');},FAST?0:3000);
 save();}
function togglePause(){if(app!=='play'||!$('lose').hidden)return;paused=!paused;$('pause').hidden=!paused;if(paused)save();}
function toMenu(){save();app='menu';paused=false;S=null;B=null;dlg=null;cine=null;['pause','over','hud','lose','dlg','bhud'].forEach(id=>$(id).hidden=true);$('menu').hidden=false;document.body.classList.remove('playing');snd.music(null);buildMenu();menuScene();}
function menuScene(){setRestore(W,1);for(const k in PART_ORDER)void k;PART_ORDER.forEach(k=>W.partMesh[k].g.visible=false);W.knot.visible=false;foeM.forEach(f=>f.visible=false);wren.setCostume({helm:1,body:1,shield:1});wren.root.visible=true;knight.root.visible=false;P.x=-1.2;P.z=8;P.y=0;P.ry=.6;
 for(const k in NPC){NPC[k].wp=0;placeNPC(k,true,true);}}
function finish(why){if(!S||S.phase==='over')return;const won=why==='win';S.phase='over';cine=null;dlg=null;$('dlg').hidden=true;
 const Df=D(),left=Math.max(0,S.limit-S.t),pc=nParts(),mc=nMet(),lit=litCount(W),gp={S:1500,A:1000,B:600,C:300}[S.grade]||0;
 const stars=won?1+(S.grade==='S'||S.grade==='A'?1:0)+(left>=S.limit*.3?1:0):0;
 const pts=Math.round((pc*300+mc*200+(S.costume?400:0)+(S.gate?300:0)+(S.won?2000:0)+gp+(won?Math.round(left)*8:0))*Df.pts);const tok=3+stars*3+(won?2:0);
 if(!S.awarded&&!isDone(S.run)){S.awarded=1;addRound(tok,won);saveBest(ID,pts);markDone(S.run);}clearSave();
 lastAward={pts,won,stars,why,time:fmtT(S.t),limit:fmtT(S.limit),left:fmtT(left),parts:pc,met:mc,grade:S.grade||'-',lit,diff:Df.n,tok,tries:S.tries,assist:S.assist};
 setTimeout(()=>{if(!S||S.phase!=='over')return;app='over';const L=lastAward;$('hud').hidden=true;$('bhud').hidden=true;$('lose').hidden=true;document.body.classList.remove('playing');
  $('ores').textContent=won?'THE PARADE BEGINS':'THE BELL RANG IN THE DARK';$('ores').className='res '+(won?'w':'l');$('oeye').textContent=`FESTIVAL NIGHT · ${L.diff}${L.assist?' · AUTO-TIMING':''}`;
  $('owhy').textContent=won?(stars===3?'A PERFECT FESTIVAL NIGHT':stars===2?'A LOVELY FESTIVAL NIGHT':'THE STREET GLOWS AGAIN'):'THE CLOCK RAN OUT BEFORE THE STREET WAS LIT';
  document.querySelectorAll('#ostars i').forEach((s,i)=>s.className=i<stars?'on':'');const cell=(v,l,hl)=>`<div class="${hl?'hl':''}"><b>${v}</b><span>${l}</span></div>`;
  $('otable').innerHTML=cell(L.time,'TIME USED · OF '+L.limit,1)+cell(L.parts+'/3','PARTS FOUND',L.parts===3)+cell(L.met+'/3','NEIGHBOURS MET')+cell(L.grade,'BATTLE GRADE',L.grade==='S'||L.grade==='A')+cell(L.lit+'/14','LANTERNS LIT');
  $('otok').innerHTML=`POINTS <b>${L.pts}</b> · ${'★'.repeat(stars)||'NO STARS'} (${stars}/3) · +${L.tok} TOKENS · BEST ${bestScore(ID)}`;$('over').hidden=false;snd.play(won?'win':'lose');},FAST?0:won?600:900);}
/* ================= residents ================= */
const ROUT={
 fern:{pre:[{x:-3.5,z:11.2,st:'worry',w:4}],post:[{x:-3.7,z:12.6,st:'ladle',w:4},{x:-3.6,z:14.9,st:'wave',w:3}]},
 teo:{pre:[{x:8.3,z:7.4,st:'idle',w:3},{x:8.1,z:4.2,st:'worry',w:3}],post:[{x:13.4,z:-16.3,st:'play',w:6,y:4.5},{x:13.8,z:-17.4,st:'play',w:5,y:4.5}]},
 juno:{pre:[{x:3.75,z:-5.2,st:'sit',w:9,y:.5,ry:-Math.PI/2}],post:[{x:-1.5,z:-3,st:'cheer',w:1.2},{x:1.8,z:-7.5,st:'cheer',w:1},{x:-1.8,z:-9,st:'dance',w:2},{x:2.2,z:-2.5,st:'cheer',w:1}]}};
let npcPost=false;
function placeNPC(k,snap,post){const n=NPC[k],R=ROUT[k][(post??npcPost)?'post':'pre'],w=R[n.wp%R.length];if(snap){n.x=w.x;n.z=w.z;n.y=w.y??ground(w.x,w.z)??0;n.ry=w.ry??-Math.PI/2*Math.sign(w.x||1);}}
function updateNPC(dt){const post=app==='menu'?true:!!(S&&S.won&&W.restore>.25);if(post!==npcPost){npcPost=post;for(const k in NPC){NPC[k].wp=0;placeNPC(k,true);}}
 for(const k in NPC){const n=NPC[k],r=n.r,R=ROUT[k][npcPost?'post':'pre'],w=R[n.wp%R.length];let st=w.st,spd=0;
  const talking=dlg&&dlg.id===k;if(talking){n.ry=dampAng(n.ry,Math.atan2(P.x-n.x,P.z-n.z),8,dt);st='talk';}
  else{const dx=w.x-n.x,dz=w.z-n.z,d=Math.hypot(dx,dz);if(d>.15){const sp=k==='juno'&&npcPost?2.8:1.4;n.x+=dx/d*Math.min(d,sp*dt);n.z+=dz/d*Math.min(d,sp*dt);n.ry=dampAng(n.ry,Math.atan2(dx,dz),8,dt);spd=sp;n.wt=0;}
   else{n.wt+=dt;if(w.ry!==undefined)n.ry=dampAng(n.ry,w.ry,6,dt);else if(st!=='sit'){const fp=Math.hypot(P.x-n.x,P.z-n.z)<5&&app==='play';n.ry=dampAng(n.ry,fp?Math.atan2(P.x-n.x,P.z-n.z):(n.x<0?Math.PI/2:-Math.PI/2),3,dt);}if(n.wt>w.w&&R.length>1){n.wp++;n.wt=0;}}}
  const gy=w.y??ground(n.x,n.z)??0;n.y=damp(n.y??gy,st==='sit'&&spd===0?gy:(ground(n.x,n.z)??gy),10,dt);if(st==='sit'&&spd===0)n.y=gy;
  r.root.position.set(n.x,n.y,n.z);r.root.rotation.y=n.ry;pose(r,dt,spd>0?'walk':st,spd,{hold:k==='juno'||k==='fern'});
  if(k==='teo')r.box.visible=npcPost&&st==='play'&&!talking;if(k==='juno'){r.fishMat.emissiveIntensity=npcPost?1.8:.05;r.fish.rotation.z=Math.sin(r.t*3)*.15;}}}
/* ================= cinematics ================= */
function updateCine(dt){const c=cine;c.t+=dt;const k=c.t/c.dur;
 if(c.kind==='assemble'){const steps=[['helm',.25],['body',.5],['shield',.75]];const on={};for(const[p,t]of steps){if(k>=t)on[p]=1;if(k>=t&&c.step<steps.findIndex(s=>s[0]===p)+1){c.step++;burst(P.x,P.y+1.4,P.z,30,3,['#ffd27a','#c79a62','#ffffff'],.4,.8);snd.play('whoosh');}}wren.setCostume(on);
  if(k>=1){cine=null;S.costume=1;wren.setCostume({helm:1,body:1,shield:1});flash();snd.play('assemble');banner('LIGHTHOUSE KNIGHT','NEW ABILITY · HOLD Q / BEAM TO SHINE',3.2);note('The beam can untie the gloom knot on the loft stairs.','good');save();}}
 else if(c.kind==='victory'){if(k>=1){cine=null;endVictory();}}
 else if(c.kind==='relight'){setRestore(W,sstep(.08,.92,k));const n=litCount(W);if(n!==c.n){if(c.n!==undefined)snd.play('relight',n%5);c.n=n;}
  if(k>=1){cine=null;setRestore(W,1);note('The street is lit! Neighbours are celebrating. Ring the parade bell in the plaza.','good');banner('THE STREET GLOWS','RING THE PARADE BELL IN THE PLAZA',3);save();}}
 else if(c.kind==='parade'){if(opt.fx&&Math.random()<dt*14){const x=rnd(-6,4),z=rnd(-34,-26);burst(x,rnd(4,8),z,8,3,['#ff6a5a','#ffd040','#6ae0ff','#ff9ad8'],.35,1.4,{grav:2});}
  if(k>=1){cine=null;finish('win');}}}
/* ================= camera ================= */
let camSnap=true,camFix=null;const camOff=new V3(0,8,8.4);const camPos=new V3(),camLook=new V3(),tmpV=new V3();
function cameraUpdate(dt){let pos,look;const portrait=camera.aspect<1,far=portrait?1.45:1;
 if(camFix){pos=camFix[0];look=camFix[1];}
 else if(app==='menu'){const t=menuT*.05;pos=new V3(Math.sin(t)*2.5,9.5,24-((menuT*1.1)%46));look=new V3(0,1.5,pos.z-14);}
 else if(S&&S.phase==='battle'){pos=portrait?new V3(0,15,-19.6):new V3(1.4,11.6,-22.4);look=new V3(12.4,4.9,-20.4);}
 else if(cine&&cine.kind==='relight'){const k=cine.t/cine.dur;pos=new V3(lerp(14,2,k),lerp(13,15,k),lerp(-12,16,k)*1);look=new V3(lerp(10,0,k),lerp(4,1,k),lerp(-24,-4,k));}
 else if(cine&&cine.kind==='parade'){const k=cine.t/cine.dur;pos=new V3(lerp(4,1,k),lerp(7,10,k),-18+k*3);look=new V3(-3,2.5,-31);}
 else if(cine&&cine.kind==='assemble'){const a=-Math.PI/2+Math.sin(cine.t*1.3)*.5;pos=new V3(P.x+Math.sin(a)*4.4,P.y+2.3,P.z+Math.cos(a)*4.4+.5);look=new V3(P.x,P.y+1.1,P.z);}
 else{const zoom=dlg?.8:1,side=P.x<-6.3?1:P.x>6.3||P.y>1.2?-1:0,plaza=P.z<-26.2&&side===0?1:0;
  camOff.x=damp(camOff.x,side*6.6,2.2,dt);camOff.y=damp(camOff.y,side?10:plaza?10.5:8,2.2,dt);camOff.z=damp(camOff.z,side?1:plaza?7.5:8.4,2.2,dt);
  pos=new V3(P.x*(side?1:.75)+camOff.x*far*zoom,P.y+camOff.y*far*zoom,P.z+camOff.z*far*zoom);look=new V3(P.x*(side?1:.88),P.y+1,P.z-(side?.4:2.2));}
 if(camSnap){camPos.copy(pos);camLook.copy(look);camSnap=false;}else{const k=1-Math.exp(-dt*(S&&S.phase==='battle'?3:5));camPos.lerp(pos,k);camLook.lerp(look,k);}
 camera.position.copy(camPos);if(shake>0){camera.position.x+=rnd(-1,1)*shake*.3;camera.position.y+=rnd(-1,1)*shake*.3;shake=Math.max(0,shake-dt*1.6);}camera.lookAt(camLook);
 const fov=portrait?58:46;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
 moon.target.position.set(camLook.x,0,camLook.z);moon.position.set(camLook.x-14,30,camLook.z-8);}
/* ================= lights: pick the strongest lit sources near the focus ================= */
const SRC=[];W.L.forEach((l,i)=>{if(l.post||l.stall)SRC.push({p:new V3(l.x,l.y-.2,l.z),f:()=>Math.max(W.lan.litArr[i],l.stall&&l.x<0?.35:0),c:l.stall?0xffb050:0xff9a48,I:l.stall?10:9});});
SRC.push({p:new V3(8.8,2.7,5.5),f:()=>1,c:0xffc080,I:16},{p:W.firePit.clone().add(new V3(0,.6,0)),f:()=>W.restore>0?1:0,c:0xff8a40,I:12},{p:new V3(-4.5,3.6,-32),f:()=>W.whaleM.emissiveIntensity>.4?1:0,c:0x80c0ff,I:12},
 {p:new V3(0,1.6,0),f:()=>npcPost?1:0,c:0xff8a40,I:5,juno:1});
function assignLights(){const fx=camLook.x,fz=camLook.z;for(const s of SRC){if(s.juno){const n=NPC.juno,f=n.r.fish.getWorldPosition(tmpV);s.p.copy(f);}s.v=s.f()*s.I/(1+((s.p.x-fx)**2+(s.p.z-fz)**2)/260);}
 const top=SRC.filter(s=>s.v>.02).sort((a,b)=>b.v-a.v).slice(0,LIGHTS.length);LIGHTS.forEach((l,i)=>{const s=top[i];if(!s){l.intensity=0;return;}l.position.copy(s.p);l.color.setHex(s.c);l.intensity=s.f()*s.I*(opt.fx?1+Math.sin(W.t*9+i*2)*.04:1);});}
/* ================= per-frame street update ================= */
function updateStreet(dt,pad){if(cine||dlg){P.beam=false;return;}
 let mx=0,mz=0;const k=I.keys;if(k.KeyW||k.ArrowUp)mz-=1;if(k.KeyS||k.ArrowDown)mz+=1;if(k.KeyA||k.ArrowLeft)mx-=1;if(k.KeyD||k.ArrowRight)mx+=1;mx+=touch.x;mz+=touch.z;if(pad){mx+=pad.x;mz+=pad.z;}
 const l=Math.hypot(mx,mz);if(l>1){mx/=l;mz/=l;}
 P.beam=!!S.costume&&!!(k.KeyQ||k.KeyF||touch.beam||(pad&&pad.beam));const spd=(P.beam?2.2:5.2)*Math.min(1,l);
 if(l>.08){movePlayer(dt,mx,mz,spd/Math.max(.01,Math.min(1,l)));P.ry=dampAng(P.ry,Math.atan2(mx,mz),P.beam?5:14,dt);P.spd=spd;P.stepT+=dt*spd;if(P.stepT>1.6){P.stepT=0;snd.play('step');}}else{P.spd=0;const g=ground(P.x,P.z);if(g!==null)P.y=damp(P.y,g,18,dt);}
 // beam on the knot
 if(P.beam&&!S.gate){const dx=KNOT.x-P.x,dz=KNOT.z-P.z,d=Math.hypot(dx,dz),a=Math.abs(angDiff(P.ry,Math.atan2(dx,dz)));if(d<8.5&&a<1.1&&P.y<1.5)P.ry=dampAng(P.ry,Math.atan2(dx,dz),3,dt);
  if(d<8&&a<.6&&P.y<1.5){S.knot=Math.min(1,S.knot+dt/D().knot);if(Math.random()<dt*8)snd.play('knot');if(Math.random()<dt*30)burst(KNOT.x+rnd(-.6,.6),1.2+rnd(-.5,.5),KNOT.z+rnd(-.6,.6),2,2,['#d8a0ff','#fff0a0'],.3,.6);
   if(S.knot>=1){S.gate=1;W.knot.visible=false;puff(KNOT.x,1,KNOT.z,30,'#5a3a8a',2,1.6);burst(KNOT.x,1.2,KNOT.z,80,5,['#fff0a0','#d8a0ff','#ffffff'],.5,1.2);snd.play('untie');banner('THE KNOT IS UNTIED','THE LOFT STAIRS ARE OPEN',2.6);note('Climb the stairs to the loft roof. The Puffkins are waiting.','good');save();}}
  else S.knot=Math.max(0,S.knot-dt*.25);}else if(!S.gate)S.knot=Math.max(0,S.knot-dt*.25);
 // reaching the loft roof starts the battle
 if(S.gate&&S.costume&&!S.won&&P.y>3.9&&P.z<-15.2)startBattle();
 near=findNear();}
/* ================= battle frame update ================= */
function updateBattle(dt){if(!B)return;B.step(dt);battleEvents();if(!B)return;
 // hero motion: dash toward the target during a bash ring
 const kr=knight.root,ring=B.ring;let goal=HERO_HOME.clone();
 if(act&&act.k==='bash'&&act.tgt>=0&&(B.phase==='act'||(ring&&ring.kind==='atk'))){const tp=foePos(act.tgt);const k=ring?Math.min(1,ring.t/ring.dur*1.25):1,dv=tp.clone().sub(HERO_HOME).setY(0).normalize();goal.lerpVectors(HERO_HOME,tp.clone().addScaledVector(dv,-1.7),k);}
 kr.position.x=damp(kr.position.x,goal.x,10,dt);kr.position.z=damp(kr.position.z,goal.z,10,dt);kr.position.y=4.5;
 const beamOn=act&&act.k==='sweep'&&ring&&ring.kind==='atk';knight.beam.opacity=damp(knight.beam.opacity,beamOn?.55:0,8,dt);if(beamOn)knight.lance.rotation.y=Math.sin(ring.t*4)*.5;
 knight.t+=dt;const bob=Math.sin(knight.t*2.4)*.04;knight.body.position.y=bob;knight.aL.rotation.x=damp(knight.aL.rotation.x,act&&act.k==='wall'?-1.4:B.phase==='foe'?-1:-.2,10,dt);knight.aR.rotation.x=damp(knight.aR.rotation.x,act&&(act.k==='bash'||act.k==='sweep')&&ring?-1.6:-.3,10,dt);
 knight.glass.emissiveIntensity=2.4+B.hero.glow*.4+Math.sin(knight.t*5)*.2;knight.lamp.intensity=4+B.hero.glow;if(knight.hurt>0){knight.hurt-=dt;knight.body.rotation.z=Math.sin(knight.hurt*40)*.08;}else knight.body.rotation.z=0;
 // foes: the attacker drifts toward the hero during its ring
 foeM.forEach((f,i)=>{const u=f.userData;let g=FOE_HOME[i];if(act&&act.k==='foe'&&act.i===i&&(B.phase==='foe'||B.phase==='windup'||(ring&&ring.kind==='def')))g=HERO_HOME.clone().addScaledVector(FOE_HOME[i].clone().sub(HERO_HOME).setY(0).normalize(),2.1);
  if(u.flee>0){u.flee+=dt;u.pos.y+=dt*3;u.pos.x+=dt*4;}else{u.pos.x=damp(u.pos.x,g.x,6,dt);u.pos.z=damp(u.pos.z,g.z,6,dt);u.pos.y=g.y;}
  f.position.set(u.pos.x,u.pos.y+(i===1?0:1),u.pos.z);const blow=act&&act.k==='foe'&&act.i===i&&ring&&ring.kind==='def';if(u.hurt>0){u.hurt-=dt;f.position.x+=Math.sin(u.hurt*50)*.08;}
  if(i===1)animBellows(f,dt,{inhale:u.inhale,blow});else animPuffkin(f,dt,{blow});if(blow&&Math.random()<dt*20)puff(f.position.x-.6,f.position.y+.6,f.position.z,1,'#c0b8d8',.9,.8);
  if(u.flee>2.5)f.visible=false;});}
function ambientFoes(dt){foeM.forEach((f,i)=>{const u=f.userData;if(!f.visible)return;if(u.flee>0){u.flee+=dt;f.position.y+=dt*3;f.position.x+=dt*5;f.rotation.y+=dt*4;if(u.flee>3)f.visible=false;return;}
 const t=W.t+i*2;f.position.set(FOE_HOME[i].x+Math.sin(t*.5)*.8,FOE_HOME[i].y+(i===1?0:1.2+Math.sin(t*.9)*.3),FOE_HOME[i].z+Math.cos(t*.4)*.6);f.rotation.y=Math.atan2(P.x-f.position.x,P.z-f.position.z);
 if(i===1)animBellows(f,dt,{blow:Math.sin(t*.7)>.8});else animPuffkin(f,dt,{blow:Math.sin(t*.8+i)>.85});});}
/* ================= HUD ================= */
let hudSig='',menuSig='';
function objective(){if(!S.met.fern)return['Talk to Granny Fern at the dumpling stall','fern'];if(!S.blueprint)return['Ask Teodor in his workshop for a plan','teo'];
 if(nParts()<3)return['Find the cardboard costume parts ('+nParts()+'/3)','part'];if(!S.costume)return['Build the costume at Teodor\'s workbench','bench'];if(!S.gate)return['Shine your beam on the gloom knot by the loft stairs','knot'];
 if(!S.won)return['Climb to the loft roof and chase off the Puffkins','loft'];return['Ring the parade bell in the plaza','bell'];}
function markerTarget(){const[,k]=objective(),m=D().marker;if(m===0)return null;
 if(k==='part'){let best=null,bd=1e9;for(const p of PART_ORDER){if(S.parts[p]||(m===1&&!S.hint[p]))continue;const[x,z]=PARTS[p].pos,d=Math.hypot(x-P.x,z-P.z);if(d<bd){bd=d;best={x,y:(ground(x,z)??0)+1.8,z,l:PARTS[p].n};}}return best;}
 if(k==='fern'||k==='teo'){const n=NPC[k];return{x:n.x,y:(n.y||0)+(k==='teo'?2.8:2),z:n.z,l:RES[k].n};}
 if(k==='bench')return{x:BENCH.x,y:2,z:BENCH.z,l:'WORKBENCH'};if(k==='knot')return{x:KNOT.x,y:2.6,z:KNOT.z,l:'GLOOM KNOT'};if(k==='loft')return{x:11.6,y:6.5,z:-19,l:'LOFT ROOF'};if(k==='bell')return{x:BELL.x,y:4.3,z:BELL.z,l:'PARADE BELL'};return null;}
function hud(){if(!S)return;const left=S.limit-S.t;$('clock').textContent=fmtT(left);$('clockBar').style.width=(cl(left/S.limit,0,1)*100).toFixed(1)+'%';$('clockw').classList.toggle('warn',left<60&&!S.won);
 const sig=[nParts(),nMet(),S.blueprint,S.costume,S.gate,S.won,litCount(W),S.hint.helm+S.hint.body+S.hint.shield].join();if(sig!==hudSig){hudSig=sig;const[o]=objective();$('objMain').textContent=o;
  $('lanterns').textContent='LANTERNS '+litCount(W)+'/14';$('partsInv').innerHTML=PART_ORDER.map(k=>`<i class="${S.parts[k]?'on':''}" title="${PARTS[k].n}">${PARTS[k].icon}${S.parts[k]?'✓':''}</i>`).join('');
  const it=[['Meet the neighbours ('+nMet()+'/3)',nMet()===3],['Get Teodor\'s plan',S.blueprint],['Find 3 cardboard parts ('+nParts()+'/3)',nParts()===3],['Build the costume',S.costume],['Untie the gloom knot',S.gate],['Chase off the Puffkins',S.won],['Ring the parade bell',S.bell]];
  let cur=false;$('objList').innerHTML=it.map(([t,d])=>{let c=d?'done':'';if(!d&&!cur&&t.indexOf('neighbours')<0){cur=true;c='cur';}return`<li class="${c}">${d?'✓':'○'} ${t}</li>`;}).join('');$('bBeam').hidden=!S.costume;}
 const pr=$('prompt');if(near&&!dlg&&!cine&&S.phase==='street'){const t=(near.deny?'':'<kbd>E</kbd>')+near.label;if(pr.innerHTML!==t)pr.innerHTML=t;pr.hidden=false;pr.classList.toggle('no',!!near.deny);}else pr.hidden=true;
 const bw=$('beamw');if(!S.gate&&S.costume&&(P.beam||S.knot>0)&&S.phase==='street'){bw.hidden=false;$('beamBar').style.width=(S.knot*100).toFixed(0)+'%';$('beamL').textContent=S.knot>0?'UNTYING THE KNOT · '+Math.round(S.knot*100)+'%':'AIM AT THE GLOOM KNOT';}else bw.hidden=true;}
function battleHud(){if(!B)return;const H=B.hero;$('heroHpT').textContent=H.hp+'/'+H.max+' HP';const hp=$('heroHp');hp.style.width=(H.hp/H.max*100)+'%';hp.classList.toggle('low',H.hp<H.max*.3);
 $('glowPips').innerHTML=Array.from({length:6},(_,i)=>`<i class="${i<H.glow?'on':''}"></i>`).join('');$('glowT').textContent=H.glow+'/6';
 const sig=[B.phase,H.glow,H.hp,tgt,battleSel,B.foes.map(f=>f.alive).join()].join();if(sig!==menuSig){menuSig=sig;
  $('moves').classList.toggle('wait',B.phase!=='menu');const tf=B.foes[tgt];$('tgtL').textContent=B.phase==='menu'?'TARGET: '+(tf&&tf.alive?tf.n:'-')+' · ◀ ▶ OR CLICK A FOE':B.ring?(B.assist?'AUTO-TIMING WILL PRESS FOR YOU':'PRESS SPACE / TAP WHEN THE RING CLOSES'):'...';
  $('mlist').innerHTML=MOVES.map((m,i)=>`<button data-i="${i}" class="${B.can(i)?'':'no'} ${i===battleSel?'sel':''}"><kbd>${i+1}</kbd><b>${m.n}</b><em>${m.cost?m.cost+' GLOW':'FREE'}</em><span>${m.d}</span></button>`).join('');
  $('mlist').querySelectorAll('button').forEach(b=>b.onclick=()=>{snd.init();doMove(+b.dataset.i);});}
 // foe tags follow the creatures on screen
 const tg=$('tags');if(tg.children.length!==3){tg.innerHTML=B.foes.map(f=>`<div data-i="${f.i}"><b></b><div class="hp"><i></i></div><span class="t"></span><div class="warn"></div></div>`).join('');tg.querySelectorAll('div[data-i]').forEach(d=>d.onclick=()=>{const i=+d.dataset.i;if(B&&B.foes[i].alive){tgt=i;menuSig='';snd.play('ui');}});}
 B.foes.forEach((f,i)=>{const d=tg.children[i],p=foeM[i].position.clone();p.y+=i===1?2.9:2.1;p.project(camera);d.style.left=((p.x+1)/2*innerWidth)+'px';d.style.top=((1-p.y)/2*innerHeight)+'px';
  d.querySelector('b').textContent=f.n;d.querySelector('.hp i').style.width=(f.hp/f.max*100)+'%';d.querySelector('.t').textContent=f.alive?f.hp+'/'+f.max:'GONE';d.className=(f.alive?'':'out')+(i===tgt&&f.alive?' tg':'');d.querySelector('.warn').textContent=f.charged?'INHALING · NEXT: BIG HUFF':'';});}
/* ================= overlay: markers, name tags, timing rings, floats ================= */
function proj(x,y,z){const v=tmpV.set(x,y,z).project(camera);return{x:(v.x+1)/2*innerWidth,y:(1-v.y)/2*innerHeight,in:v.z<1&&v.z>-1};}
function overlay(dt){const dpr=ov.width/innerWidth;ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,innerWidth,innerHeight);if(app!=='play'||noHud)return;ox.textAlign='center';ox.textBaseline='middle';
 if(S&&S.phase==='street'&&!cine){// name tags with a "!" when a neighbour has something new to say
  for(const id of RES_ORDER){const n=NPC[id],d=Math.hypot(n.x-P.x,n.z-P.z);if(d>10||(dlg&&dlg.id===id))continue;const p=proj(n.x,(n.y||0)+(id==='teo'?2.6:id==='juno'?1.9:1.9),n.z);if(!p.in)continue;const a=cl((10-d)/3,0,1);
   const p2=ph(),fresh=!S.met[id]||S.talk[id][p2]<RES[id].lines[p2].length;ox.globalAlpha=a;ox.font='400 15px Anton, Impact, sans-serif';const tw=ox.measureText(RES[id].n).width+18+(fresh?18:0);
   ox.fillStyle='rgba(20,14,26,.78)';ox.beginPath();ox.roundRect(p.x-tw/2,p.y-12,tw,24,12);ox.fill();ox.fillStyle=RES[id].col;ox.fillRect(p.x-tw/2+8,p.y-1,4,4);ox.fillStyle='#fff';ox.fillText(RES[id].n,p.x+(fresh?-6:2),p.y+1);
   if(fresh){ox.fillStyle='#ffb347';ox.beginPath();ox.arc(p.x+tw/2-13,p.y,8,0,6.283);ox.fill();ox.fillStyle='#1e1408';ox.font='700 12px JetBrains Mono, monospace';ox.fillText('!',p.x+tw/2-13,p.y+1);}ox.globalAlpha=1;}
  // part sparkle labels when close
  for(const k of PART_ORDER){if(S.parts[k])continue;const[x,z]=PARTS[k].pos,d=Math.hypot(x-P.x,z-P.z);if(d>6)continue;const p=proj(x,(ground(x,z)??0)+1.6,z);if(!p.in)continue;ox.globalAlpha=cl((6-d)/2,0,1);ox.font='400 13px Anton, Impact, sans-serif';ox.fillStyle='#ffd27a';ox.fillText('✦ '+PARTS[k].n+' ✦',p.x,p.y);ox.globalAlpha=1;}
  // objective marker
  const m=markerTarget();if(m){const bobY=Math.sin(W.t*3)*6;const v=tmpV.set(m.x,m.y,m.z).project(camera);let sx=(v.x+1)/2*innerWidth,sy=(1-v.y)/2*innerHeight;const behind=v.z>1,off=behind||sx<30||sx>innerWidth-30||sy<70||sy>innerHeight-40;
   const d=Math.hypot(m.x-P.x,m.z-P.z);if(off){if(behind){sx=innerWidth-sx;sy=innerHeight-30;}sx=cl(sx,36,innerWidth-36);sy=cl(sy,90,innerHeight-50);const a=Math.atan2(sy-innerHeight/2,sx-innerWidth/2);
    ox.save();ox.translate(sx,sy);ox.rotate(a);ox.fillStyle='#ffb347';ox.beginPath();ox.moveTo(16,0);ox.lineTo(-6,-11);ox.lineTo(-6,11);ox.closePath();ox.fill();ox.restore();ox.font='600 11px JetBrains Mono, monospace';ox.fillStyle='#fff';ox.fillText(m.l+' '+Math.round(d)+'m',sx,sy+22);}
   else if(d>2.2){ox.fillStyle='#ffb347';ox.strokeStyle='#1e1408';ox.lineWidth=2;ox.beginPath();ox.moveTo(sx,sy+bobY+10);ox.lineTo(sx-9,sy+bobY-4);ox.lineTo(sx-4,sy+bobY-4);ox.lineTo(sx-4,sy+bobY-14);ox.lineTo(sx+4,sy+bobY-14);ox.lineTo(sx+4,sy+bobY-4);ox.lineTo(sx+9,sy+bobY-4);ox.closePath();ox.stroke();ox.fill();
    ox.font='600 11px JetBrains Mono, monospace';ox.fillStyle='rgba(20,14,26,.75)';const tt=m.l+' · '+Math.round(d)+'m',tw=ox.measureText(tt).width+12;ox.fillRect(sx-tw/2,sy+bobY-34,tw,16);ox.fillStyle='#ffe8c0';ox.fillText(tt,sx,sy+bobY-26);}}}
 // timing ring
 if(B&&B.ring&&S.phase==='battle'){const r=B.ring;let tp=knight.root.position;if(r.kind==='atk'&&act&&act.tgt>=0)tp=foePos(act.tgt);const p=proj(tp.x,tp.y+(r.kind==='atk'&&act&&act.tgt===1?1.3:1.4),tp.z);const r0=Math.min(46,innerHeight*.07);
  const k=r.t/r.dur,rad=r.res?r0:k<1?r0*(1+2.4*(1-k)):r0*Math.max(.3,1-(r.t-r.dur)/r.good*.6);const inWin=Math.abs(r.t-r.dur)<=r.good;
  ox.lineWidth=4;ox.strokeStyle='rgba(255,255,255,.85)';ox.beginPath();ox.arc(p.x,p.y,r0,0,6.283);ox.stroke();ox.lineWidth=2;ox.strokeStyle='rgba(255,255,255,.35)';ox.beginPath();ox.arc(p.x,p.y,r0+r0*r.good/r.dur*2.4,0,6.283);ox.stroke();
  if(!r.res){ox.lineWidth=6;ox.strokeStyle=inWin?'#ffe080':r.kind==='def'?'#ff9a8a':'#9ad8ff';ox.beginPath();ox.arc(p.x,p.y,rad,0,6.283);ox.stroke();ox.font='600 12px JetBrains Mono, monospace';ox.fillStyle='#fff';
   ox.fillText(B.assist?'AUTO':inWin?'NOW!':r.kind==='def'?'BLOCK':'STRIKE',p.x,p.y);ox.fillText(B.assist?'':'SPACE / TAP',p.x,p.y+r0+18);}}
 // floating texts
 for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.t+=dt;if(f.t>1.4){floats.splice(i,1);continue;}const p=proj(f.p.x,f.p.y+f.t*.8,f.p.z);if(!p.in)continue;ox.globalAlpha=cl((1.4-f.t)*2,0,1);ox.font=f.big?'400 34px Anton, Impact, sans-serif':'400 24px Anton, Impact, sans-serif';
  ox.lineWidth=5;ox.strokeStyle='rgba(20,10,20,.85)';ox.strokeText(f.text,p.x,p.y);ox.fillStyle=f.c;ox.fillText(f.text,p.x,p.y);ox.globalAlpha=1;}}
/* ================= main step ================= */
function wrenUpdate(dt){wren.root.position.set(P.x,P.y,P.z);wren.root.rotation.y=P.ry;const st=cine&&cine.kind==='parade'?'cheer':cine&&cine.kind==='relight'?'cheer':dlg?'talk':P.spd>0?'walk':'idle';pose(wren,dt,P.spd>0?'walk':st,P.spd,{hold:!!S&&!S.costume});
 if(P.beam){wren.aR.rotation.x=-1.3;}beamM.opacity=damp(beamM.opacity,P.beam?(.22+Math.sin(W.t*20)*.02):0,10,dt);beamMesh.visible=beamM.opacity>.01;snd.beam&&snd.ac&&snd.beam(P.beam);
 const hp=new V3(0,1.75,.25).applyMatrix4(wren.root.matrixWorld);spot.position.copy(hp);spot.target.position.set(P.x+Math.sin(P.ry)*8,P.y,P.z+Math.cos(P.ry)*8);spot.intensity=P.beam?60:0;
 const lp=S&&S.costume?hp.clone().add(new V3(0,.4,0)):new V3(P.x+Math.sin(P.ry+.5)*.6,P.y+1,P.z+Math.cos(P.ry+.5)*.6);plight.position.copy(lp);plight.intensity=wren.root.visible?(S&&S.costume?4:3.2)*(opt.fx?1+Math.sin(W.t*11)*.06:1):0;
 wren.paper.emissiveIntensity=1.5+(opt.fx?Math.sin(W.t*9)*.15:0);}
function step(dt){dt=Math.min(dt,.1);menuT+=dt;lastDt=dt;const pad=pollPad();
 if(app==='play'&&S&&!paused&&$('lose').hidden){if(!cine&&!dlg&&S.phase!=='over'){S.t+=dt;if(S.t>=S.limit){S.t=S.limit;finish('time');}}
  if(S.phase==='street')updateStreet(dt,pad);else if(S.phase==='battle')updateBattle(dt);if(cine)updateCine(dt);
  if(dlg&&dlg.shown<dlg.full.length){dlg.shown=Math.min(dlg.full.length,dlg.shown+dt*(FAST?999:48));$('dlgT').textContent=dlg.full.slice(0,Math.floor(dlg.shown));}
  if(S.phase==='street')ambientFoes(dt);
  saveT+=dt;if(saveT>8){saveT=0;save();}}
 const g=paused?0:dt;updateNPC(g);wrenUpdate(g);
 updateWorld(W,g,{knot:S?S.knot:0,parade:cine&&cine.kind==='parade'?sstep(0,1,cine.t/cine.dur):0,bell:cine&&cine.kind==='parade'?Math.max(0,1-cine.t/2):0,clockFrac:S?cl(1-(S.limit-S.t)/S.limit,0,1):.75});
 parts.update(g);smoke.update(g);cameraUpdate(dt);assignLights();
 if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').classList.remove('on');}
 if(app==='play'&&S){if(S.phase==='battle')battleHud();else hud();}snd.tick();I.flush();}
function noAO(st){if(!st.ao||st.ao._vfx)return;const ao=st.ao,orig=ao.render.bind(ao);ao._vfx=1;ao.render=(...a)=>{const hid=[];scene.traverse(o=>{const m=o.material;if(o.visible&&m&&!Array.isArray(m)&&(o.isPoints||m.blending===THREE.AdditiveBlending||(m.transparent&&m.depthWrite===false))){o.visible=false;hid.push(o);}});orig(...a);for(const o of hid)o.visible=true;};}
function render(){if(!fxStack){fxStack=cinematic(R,scene,camera,{...POST,quality:gfx});fxStack.setSize(innerWidth,innerHeight);noAO(fxStack);}fxStack.render();overlay(paused?0:lastDt);}
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const dpr=Math.min(devicePixelRatio,2);ov.width=w*dpr;ov.height=h*dpr;
 parts.U.uScale.value=smoke.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));if(fxStack)fxStack.setSize(w,h);}
addEventListener('resize',resize);
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));R.shadowMap.enabled=q>=1;moon.castShadow=q>=1;moon.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(moon.shadow.map){moon.shadow.map.dispose();moon.shadow.map=null;}
 LIGHTS.forEach((l,i)=>l.visible=q>0||i<3);scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);});fxStack=null;resize();}
// pause when the tab or window loses focus
addEventListener('blur',()=>{if(app==='play'&&!paused&&$('lose').hidden&&!navigator.webdriver)togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&app==='play'&&!paused&&$('lose').hidden)togglePause();});
let last=performance.now();function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(frame);}
/* ================= menu ================= */
const seg=pickers(opt,saveOpt);
function buildMenu(){const sv=loadSave();$('cont').hidden=!sv;if(sv)$('cont').textContent='CONTINUE · '+DIFF[sv.diff].n+' · '+fmtT(sv.limit-sv.t);
 const Df=DIFF[opt.diff];$('dd').innerHTML=`<b>${Df.n}</b>: ${fmtT(Df.clock)} until the parade, ${Df.marker===2?'markers point to every objective':Df.marker===1?'markers show story goals and parts a neighbour told you about':'no markers: listen to the neighbours and look for sparkles'}, Puffkins at ${Math.round(Df.hp*100)}% strength, ${Df.great<.06?'tight':Df.great<.08?'fair':'generous'} timing windows. ${opt.assist?'Auto-timing presses every ring for you (always GOOD).':''}`;
 $('best').textContent='BEST '+bestScore(ID);}
seg('o-diff','diff',true,buildMenu);seg('o-assist','assist',true,buildMenu);seg('o-fx','fx',true,()=>{});
$('go').onclick=()=>start({fresh:true});$('cont').onclick=()=>start({cont:true});$('howb').onclick=()=>{$('keys').hidden=!$('keys').hidden;};$('keys').onclick=()=>{$('keys').hidden=true;};
$('resume').onclick=togglePause;$('quit').onclick=toMenu;$('restart').onclick=()=>{paused=false;const d=S.diff,a=S.assist;clearSave();start({diff:d,assist:a,fresh:true});};$('unstuck').onclick=unstuck;$('pauseB').onclick=togglePause;
$('retry').onclick=retry;$('stepback').onclick=stepBack;$('again').onclick=()=>start({diff:S?S.diff:opt.diff,assist:S?S.assist:opt.assist,fresh:true});$('omenu').onclick=toMenu;
postButton($('post'),ID,()=>{const L=lastAward||{pts:0};return[L.pts,`LANTERN STREET · ${L.diff} · ${L.won?'parade started':'time ran out'} · ${L.stars} stars · parts ${L.parts}/3 · neighbours ${L.met}/3 · battle ${L.grade} · time ${L.time}`];});
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));if(navigator.webdriver)FAST=true;resize();buildMenu();menuScene();requestAnimationFrame(frame);
/* ================= test hook ================= */
const SPOT={fern:()=>({x:NPC.fern.x+1.4,z:NPC.fern.z}),teo:()=>({x:NPC.teo.x-1.4,z:NPC.teo.z}),juno:()=>({x:NPC.juno.x-1.4,z:NPC.juno.z}),helm:()=>({x:-7.4,z:19.4}),body:()=>({x:-11.4,z:4.4}),shield:()=>({x:-10.4,z:-18.6}),
 bench:()=>({x:8.4,z:BENCH.z}),knot:()=>({x:4.6,z:-9}),stairs:()=>({x:7.7,z:-9.6}),loft:()=>({x:9.4,z:-16}),bell:()=>({x:BELL.x,z:BELL.z+1.8}),gate:()=>START};
window.LANTERN={
 start(o={}){FAST=o.fast!==false;start({fresh:!o.cont,cont:!!o.cont,diff:o.diff,assist:o.assist});if(o.fx!==undefined)opt.fx=o.fx;return this.state;},
 step(dt=1/60,n=1){for(let i=0;i<n;i++)step(dt);},render(){render();},
 get state(){return S?{app,phase:S.phase,t:+S.t.toFixed(2),left:+(S.limit-S.t).toFixed(1),diff:S.diff,assist:S.assist,parts:{...S.parts},hint:{...S.hint},met:{...S.met},talk:JSON.parse(JSON.stringify(S.talk)),blueprint:S.blueprint,costume:S.costume,knot:+S.knot.toFixed(2),gate:S.gate,won:S.won,tries:S.tries,grade:S.grade,bell:S.bell,lit:litCount(W),restore:W.restore,
  pos:{x:+P.x.toFixed(2),y:+P.y.toFixed(2),z:+P.z.toFixed(2)},near:near&&near.label,dlg:dlg&&{id:dlg.id,line:dlg.full},cine:cine&&cine.kind,objective:objective()[0],paused,lose:!$('lose').hidden,stalls:W.stalls.map(s=>+s.open.toFixed(2)),npc:Object.fromEntries(Object.entries(NPC).map(([k,n])=>[k,{x:+n.x.toFixed(1),z:+n.z.toFixed(1)}]))}:{app};},
 get score(){return lastAward?lastAward.pts:0;},get result(){return lastAward;},
 get battle(){return B&&{phase:B.phase,ring:B.ring&&{...B.ring},hero:{...B.hero},foes:B.foes.map(f=>({n:f.n,hp:f.hp,alive:f.alive,charged:f.charged})),st:{...B.st},over:B.over};},
 tp(x,z,ry){P.x=x;P.z=z;P.y=ground(x,z)??P.y;if(ry!==undefined)P.ry=ry;camSnap=true;near=findNear();},goto(name){const s=SPOT[name]();this.tp(s.x,s.z);if(name==='knot')P.ry=Math.atan2(KNOT.x-P.x,KNOT.z-P.z);return this.state.near;},
 walk(dx,dz,secs){touch.x=dx;touch.z=dz;this.step(1/30,Math.round(secs*30));touch.x=touch.z=0;},
 act(){interact();return this.state;},adv(){let n=0;while(dlg&&n++<20)advance(),advance();return this.state;},
 talk(id){this.goto(id);interact();return this.adv();},
 beam(on=true){touch.beam=on;},key(code){onKey({code,preventDefault(){}},true);},
 choose(i,t){if(t!==undefined)tgt=t;doMove(i);return this.battle;},press(){doPress();return B&&B.ring&&B.ring.res;},
 // step until the active ring reaches its close (offset in seconds: <0 early), then press
 timed(offset=0){let n=0;while(B&&B.ring&&!B.ring.res&&B.ring.t<B.ring.dur+offset-1/120&&n++<600)step(1/120);return this.press();},
 waitMenu(max=20){let n=0;while(B&&B.phase!=='menu'&&!B.over&&n++<max*60){if(B.ring&&!B.ring.res&&!B.assist)this.timed(0);else step(1/60);}return this.battle;},
 retry,stepBack,save,toMenu,finish(){finish('time');},pause(){togglePause();},
 setQuality(q){applyQuality(q);},get quality(){return gfx;},hud(v){noHud=!v;$('hud').hidden=!v||app!=='play'||(S&&S.phase==='battle');$('bhud').hidden=!v||!(S&&S.phase==='battle');$('banner').classList.remove('on');bannerT=0;$('toasts').innerHTML='';document.querySelector('.back').hidden=!v;},
 cam(px,py,pz,lx,ly,lz){if(px===undefined){camFix=null;return;}camFix=[new V3(px,py,pz),new V3(lx,ly,lz)];camSnap=true;},
 get world(){return W;},restore(r){setRestore(W,r);}};
