// TEMPEST FIST — full 3D one-on-one fighting game. Original game for Pixel Arcade.
// Modes: ARCADE (ladder of CPU rivals ending at the Monarch), VERSUS (2 players or vs CPU) and TRAINING (dummy + frame data).
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Fight,Fighter,blankIn} from './sim.js';
import {ROSTER,STAT_NAMES,BOSS} from './roster.js';
import {STAGES,buildStage} from './stages.js';
import {makeRig,animate} from './rig.js';
import {Particles,Trail,Shocks,Sparks,FX} from './fx.js';
import {think} from './ai.js';
import {Sound} from './sound.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,deadzone,gamepads,playerPad} from '../js/kit3d/input.js';
import {$,stored,pickers,postButton,toast} from '../js/kit3d/ui.js';

const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a,DT=1/60,ID='tempestfist';
const SIDE=['#ff4d3a','#3aa0ff'],css=c=>'#'+new THREE.Color(c).getHexString();
const SR=[[8.1,8.6],[7,7.35],[8,11],[7.2,10.4]];        // per stage: fight-ring radius, camera radius
const DIFF={easy:1,normal:1.5,hard:2.2};

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance',antialias:false});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const hemi=new THREE.HemisphereLight(0xffffff,0x222222,.6);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffffff,2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:1,far:60});key.shadow.bias=-.0005;key.shadow.normalBias=.03;scene.add(key,key.target);
const rim=new THREE.DirectionalLight(0xffffff,1);scene.add(rim);const rim2=new THREE.DirectionalLight(0xffffff,0);scene.add(rim2);
const flash=new THREE.PointLight(0xffffff,0,16,1.6);scene.add(flash);
const parts=new Particles(scene,5000),shocks=new Shocks(scene,12),sparks=new Sparks(scene,24);
const cam=new THREE.PerspectiveCamera(36,1,.1,1400);
const snd=new Sound();

/* ================= state ================= */
const opt={mode:'arcade',p1:0,p2:2,pl:1,cpu:'normal',rounds:2,time:60,stage:-1};const saveOpt=stored('pxd_fight_opt',opt);
let app='menu',phase='',world=null,FV=[],stageVis=null,stageIdx=-1,time=0,acc=0,timeScale=1,clock=60,phaseT=0,round=1,wins=[0,0],perfs=[0,0],roundLog=[];
let run=null,lastAward=null,result=null,dummy='stand',auto=false,manual=[null,null],hudCache={},ann=null,annT=0,lastSec=-1,winner=-1,kodSide=-1;
let shake=0,bloomKick=0,flashA=0,hype=0,fxPost=null,gfx=quality(),postOpts={},camSnap=true,camYaw=0,camDist=5,camPos=new V(0,1.6,5),camLook=new V(0,1,0),cineT=0,cineF=null,orbitT=0;
const lightBase={hemi:1,key:1,rim:1,rim2:1};

/* ================= portraits (head + full body) rendered once from the real rigs ================= */
const PORT=[],FULL=[];
function snap(def,w,h,camF){const rt=new THREE.WebGLRenderTarget(w,h);const ps=new THREE.Scene();ps.add(new THREE.HemisphereLight(0xffffff,0x40485e,1.6));const kl=new THREE.DirectionalLight(0xfff4e8,3.2);kl.position.set(2,4,5);ps.add(kl);const rl=new THREE.DirectionalLight(new THREE.Color(def.look.glow),3);rl.position.set(-4,2,-3);ps.add(rl);
 const rig=makeRig(def,0);ps.add(rig.root);const f={st:'idle',fx:0,fz:1,inp:{x:0},def,t:0,mt:0,y:0,vy:0,thrP:0};for(let k=0;k<30;k++)animate(rig,f,1/30,1+k/30);rig.root.updateMatrixWorld(true);
 const pc=new THREE.PerspectiveCamera(26,w/h,.05,50);camF(pc,def.H);const buf=new Uint8Array(w*h*4),cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d'),img=cx.createImageData(w,h);
 R.setRenderTarget(rt);R.setClearColor(0x000000,0);R.clear();R.render(ps,pc);R.readRenderTargetPixels(rt,0,0,w,h,buf);R.setRenderTarget(null);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const si=((h-1-y)*w+x)*4,di=(y*w+x)*4;for(let c=0;c<3;c++){const v=buf[si+c]/255;img.data[di+c]=Math.min(255,Math.pow(v/(1+v*.15)*1.15,1/2.2)*255);}img.data[di+3]=buf[si+3];}
 cx.putImageData(img,0,0);rt.dispose();rig.root.traverse(o=>{if(o.geometry)o.geometry.dispose();});return cv.toDataURL();}
function makePortraits(){try{ROSTER.forEach((d,i)=>{PORT[i]=snap(d,128,128,(pc,H)=>{pc.position.set(H*.1,H*.9,H*.62);pc.lookAt(0,H*.86,0);});FULL[i]=snap(d,200,280,(pc,H)=>{pc.fov=24;pc.aspect=200/280;pc.updateProjectionMatrix();pc.position.set(H*.5,H*.62,H*2.6);pc.lookAt(0,H*.5,0);});});R.setClearColor(0x000000,1);}catch(e){console.warn('portraits',e);}}

/* ================= stage ================= */
function loadStage(i){if(stageIdx===i&&stageVis)return;if(stageVis)stageVis.dispose();stageIdx=i;stageVis=buildStage(scene,R,i,gfx);const S=stageVis;
 scene.environment=S.env;scene.fog=new THREE.Fog(S.fog.c,S.fog.near,S.fog.far);scene.background=new THREE.Color(S.bg);
 const L=S.light;hemi.color.set(L.hemi[0]);hemi.groundColor.set(L.hemi[1]);lightBase.hemi=L.hemi[2];key.color.set(L.key[0]);lightBase.key=L.key[1];key.position.set(...L.key[2]);rim.color.set(L.rim[0]);lightBase.rim=L.rim[1];rim.position.set(...L.rim[2]);
 if(L.rim2){rim2.color.set(L.rim2[0]);lightBase.rim2=L.rim2[1];rim2.position.set(...L.rim2[2]);}else lightBase.rim2=0;
 postOpts={exposure:1,bloom:.5,bloomThreshold:.85,bloomRadius:.5,vignette:.35,saturation:1.1,grain:.025,ao:false,...S.post};fxPost=null;}
function makePost(){fxPost=cinematic(R,scene,cam,{...postOpts,quality:gfx});fxPost.w=0;}

/* ================= fighters ================= */
function clearFighters(){for(const v of FV){for(const o of[v.rig.root,v.swoosh.mesh,v.scarf&&v.scarf.mesh,v.ring])if(o){scene.remove(o);o.traverse(m=>{if(m.geometry&&m.geometry!==ringGeo)m.geometry.dispose();if(m.material)m.material.dispose();});}}FV=[];}
const ringGeo=new THREE.RingGeometry(.42,.56,40).rotateX(-Math.PI/2);
function addVis(f,alt){const rig=makeRig(f.def,alt);scene.add(rig.root);const glowC=new THREE.Color(alt?new THREE.Color(f.def.look.glow).offsetHSL(.4,0,0):f.def.look.glow);
 const swoosh=new Trail(scene,12,.2,new THREE.Color(1.5,1.5,1.6),{minD:.0015,taper:.05,soft:1});const scarf=rig.fx.scarfAnchor?new Trail(scene,18,.09,glowC.clone().multiplyScalar(.9),{minD:.003,taper:.35}):null;
 const ring=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(SIDE[f.side]).multiplyScalar(1.4),transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));ring.renderOrder=3;scene.add(ring);
 const v={f,rig,swoosh,scarf,ring,glowC,css:css(glowC),cb:0,cbT:0,cbD:0,lag:1,winPose:['w1','w2','bow'][rnd(3)|0]};FV[f.side]=v;f.vis=v;return v;}
function makeWorld(i1,i2,o={}){clearFighters();const boss2=o.boss;
 const a=new Fighter(ROSTER[i1],0,{human:auto?-1:0,lvl:opt.cpu}),b=new Fighter(ROSTER[i2],1,{human:o.p2human?1:-1,lvl:boss2?(opt.cpu==='easy'?'normal':'hard'):opt.cpu,hpMul:boss2?1.15:1,dmgMul:boss2?1.08:1});
 world=new Fight(a,b,{ev,training:o.training,radius:SR[stageIdx][0]});world.place(2.6);addVis(a,0);addVis(b,i1===i2?1:0);
 for(const s of[0,1]){const v=FV[s],f=v.f;$('nm'+s).textContent=f.def.name;$('tg'+s).textContent=f.human>=0?'P'+(f.human+1):o.training?'DUMMY':'CPU';$('por'+s).style.backgroundImage=`url(${PORT[ROSTER.indexOf(f.def)]||''})`;$('sml'+s).textContent=f.moves.sup.n;}
 return world;}

/* ================= match flow ================= */
function pickStage(){return opt.stage>=0?opt.stage:rnd(3)|0;}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o.opt||{});if(o.mode)opt.mode=o.mode;for(const k of['p1','p2','pl','cpu','rounds','time','stage'])if(o[k]!==undefined)opt[k]=o[k];saveOpt();
 auto=!!o.auto;snd.init();snd.play('confirm');
 if(opt.mode==='arcade'){const pool=ROSTER.map((d,i)=>i).filter(i=>i!==opt.p1&&i!==BOSS).sort(()=>Math.random()-.5).slice(0,5);run={ladder:[...pool,BOSS],pos:0,pts:0,won:0,lost:0,perfects:0,maxCombo:0,dealt:0,supers:0,throws:0,tbonus:0,life:0,matches:0,conts:0};
  if(o.ladder)run.ladder=o.ladder;nextArcade();}
 else{run={ladder:[opt.p2],pos:0,pts:0,won:0,lost:0,perfects:0,maxCombo:0,dealt:0,supers:0,throws:0,tbonus:0,life:0,matches:0,conts:0};beginMatch(opt.p1,opt.p2,pickStage(),{p2human:opt.mode==='versus'&&opt.pl===2,training:opt.mode==='training'});}}
function nextArcade(){const opp=run.ladder[run.pos],boss=opp===BOSS;const st=boss?3:[0,1,2][run.pos%3];
 beginMatch(opt.p1,opp,st,{boss,vs:true});}
function beginMatch(i1,i2,st,o){app='match';loadStage(st);makeWorld(i1,i2,o);world.training=!!o.training;run.cur={i2,st,o};
 round=1;wins=[0,0];perfs=[0,0];roundLog=[];result=null;timeScale=1;acc=0;manual=[null,null];hudCache={};camSnap=true;camYaw=0;
 $('menu').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');$('pops').innerHTML='';
 $('train').hidden=!o.training;$('timer').style.visibility=o.training?'hidden':'';for(const s of[0,1])$('w'+s).innerHTML=o.training?'':Array.from({length:opt.rounds},()=>'<i></i>').join('');
 const lad=$('ladder');lad.hidden=opt.mode!=='arcade';if(opt.mode==='arcade')lad.innerHTML=run.ladder.map((d,i)=>`<i class="${i<run.pos?'done':i===run.pos?'cur':''} ${d===BOSS?'boss':''}" style="background-image:url(${PORT[d]})"></i>`).join('');
 snd.music(true,o.boss?2:0);
 if(o.vs){phase='vs';phaseT=0;$('vs').hidden=false;$('vsl').style.backgroundImage=`url(${FULL[i1]})`;$('vsr').style.backgroundImage=`url(${FULL[i2]})`;$('vsl').innerHTML=`<b>${ROSTER[i1].name}</b>`;$('vsr').innerHTML=`<b>${ROSTER[i2].name}</b>`;
  $('vss').textContent=o.boss?'FINAL STAGE':`STAGE ${run.pos+1} / ${run.ladder.length}`;$('vsst').textContent=STAGES[st].name;world.active=false;snd.say(o.boss?'Final stage. The Monarch awaits.':ROSTER[i1].name.toLowerCase()+' versus '+ROSTER[i2].name.toLowerCase());}
 else startRound();}
function startRound(){$('vs').hidden=true;const keepM=world.f.map(f=>f.meter);world.place(2.6);world.f.forEach((f,i)=>{f.meter=world.training?100:keepM[i];f.ai=null;});world.active=false;phase='intro';phaseT=0;clock=opt.time;lastSec=-1;winner=-1;kodSide=-1;camSnap=true;orbitT=0;
 for(const v of FV){v.swoosh.clear();if(v.scarf)v.scarf.clear();v.lag=1;}world.proj.length=0;
 if(world.training){phase='fight';world.active=true;announce('TRAINING','',1.2,'#3aa0ff');return;}
 const fin=wins[0]===opt.rounds-1&&wins[1]===opt.rounds-1;announce(fin?'FINAL ROUND':'ROUND '+round,STAGES[stageIdx].name,1.5,'#ffd23a');snd.say(fin?'Final round!':'Round '+round+'!',.95,.55);}
function endRound(w,how){phase=how==='ko'?'ko':'timeup';phaseT=0;winner=w;world.active=false;
 if(how==='time'){announce('TIME','',1.6,'#ffd23a');snd.say('Time!');}
 else if(how==='double'){announce('DOUBLE K.O.','',2,'#ff4d2a');snd.say('Double K O!');}
 else{announce('K.O.','',1.8,'#ff2a2a');snd.play('ko');snd.say('K O!',.8,.45);timeScale=.25;bloomKick=.6;flashA=.5;}}
function settleRound(){const w=winner;if(w>=0){wins[w]++;const f=world.f[w];const perfect=f.hp>=f.maxHp;if(perfect)perfs[w]++;roundLog.push({w,perfect,left:f.hp/f.maxHp,time:Math.max(0,Math.ceil(clock))});
  const pip=$('w'+w).children[wins[w]-1];if(pip)pip.className=perfect?'on pf':'on';
  if(perfect){announce('PERFECT','',1.6,'#9ad8ff');snd.say('Perfect!');}
  f.st='win';const o=world.f[1-w];if(!o.ko){o.st='lose';o.t=0;}}else{roundLog.push({w:-1});announce('DRAW','',1.4,'#ffffff');}
 phase='roundEnd';phaseT=0;}
function afterRound(){const need=opt.rounds;if(wins[0]>=need||wins[1]>=need){endMatch(wins[0]>=need?0:1);return;}round++;startRound();}
function endMatch(w){phase='matchEnd';phaseT=0;winner=w;const me=world.f[0],won=w===0;const s=me.stats;
 run.matches++;if(won)run.won++;else run.lost++;run.perfects+=perfs[0];run.maxCombo=Math.max(run.maxCombo,s.maxCombo);run.dealt+=Math.round(s.dealt);run.supers+=s.supers;run.throws+=s.throws;
 const tb=roundLog.filter(r=>r.w===0).reduce((a,r)=>a+r.time*15,0);run.tbonus+=tb;run.life+=roundLog.filter(r=>r.w===0).reduce((a,r)=>a+r.left,0);run.rw=(run.rw||0)+wins[0];run.rl=(run.rl||0)+wins[1];
 const mul=DIFF[opt.cpu]||1;const pts=Math.round((s.dealt+wins[0]*1000+perfs[0]*1500+s.maxCombo*60+tb+s.supers*200+(won?2000:0)+(won&&run.cur.i2===BOSS&&opt.mode==='arcade'?4000:0))*mul);run.pts+=pts;run.lastPts=pts;
 announce(won?(opt.mode==='versus'&&opt.pl===2?'P1 WINS':'YOU WIN'):(opt.mode==='versus'&&opt.pl===2?'P2 WINS':'YOU LOSE'),world.f[w].def.full,2.4,won?'#ffd23a':'#ff2a2a');snd.play('cheer');
 snd.say((won?'':'')+world.f[w].def.name.toLowerCase()+' wins!');hype=1;}
function afterMatch(){const won=winner===0;
 if(opt.mode==='arcade'&&won&&run.pos<run.ladder.length-1){run.pos++;nextArcade();return;}
 showOver(opt.mode==='arcade'?(won?'clear':'over'):'versus');}
function grade(){const rounds=(run.rw||0)+(run.rl||0)||1;const g=(run.rw||0)/rounds*50+Math.min(1,run.perfects/Math.max(1,run.rw||1)*2)*15+Math.min(1,run.life/Math.max(1,run.rw||1))*20+Math.min(15,run.maxCombo)/15*15-run.conts*8;
 return g>=85?'S':g>=70?'A':g>=55?'B':g>=40?'C':'D';}
function showOver(kind){app='over';$('hud').hidden=true;$('vs').hidden=true;document.body.classList.remove('playing');$('bars').classList.remove('on');timeScale=1;snd.music(false);
 const two=opt.mode==='versus'&&opt.pl===2,won=winner===0;
 $('oeye').textContent=(opt.mode==='arcade'?'ARCADE':opt.mode==='versus'?(two?'VERSUS · 2 PLAYERS':'VERSUS · CPU'):'TRAINING')+' · '+opt.cpu.toUpperCase();
 $('ores').textContent=kind==='clear'?'ARCADE CLEAR':kind==='over'?'GAME OVER':two?(won?'P1 WINS':'P2 WINS'):won?'VICTORY':'DEFEAT';$('ores').style.color=kind==='over'||(!won&&!two)?'#ff4d3a':'#ffd23a';
 $('osub').textContent=kind==='clear'?`${ROSTER[opt.p1].full} DETHRONED THE MONARCH`:kind==='over'?`FELL TO ${ROSTER[run.cur.i2].full} · STAGE ${run.pos+1} OF ${run.ladder.length}`:`${world.f[winner].def.full} TAKES IT ON ${STAGES[stageIdx].name}`;
 const g=grade();const rows=[['WINS',`${run.won} MATCH${run.won===1?'':'ES'} · ${run.rw||0}–${run.rl||0} ROUNDS`],['PERFECTS',run.perfects],['MAX COMBO',run.maxCombo+' HITS'],['DAMAGE DEALT',run.dealt],['SUPERS',run.supers],['THROWS',run.throws],['TIME BONUS',run.tbonus],['SCORE',run.pts.toLocaleString()+' PTS']];
 $('stats').innerHTML=rows.map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('');$('ograde').textContent=g;$('ograde').className=g;
 const tok=award(kind,won,g);$('otok').textContent=`+${tok} TOKENS · ${run.pts.toLocaleString()} PTS · BEST ${bestScore(ID).toLocaleString()} PTS`;
 $('again').textContent=kind==='over'?'CONTINUE':kind==='clear'?'PLAY AGAIN':'REMATCH';$('over').hidden=false;
 for(const f of world.f){f.st=world.f.indexOf(f)===winner?'win':'lose';f.t=0;f.y=0;f.move=null;}const w=world.f[winner]||world.f[0];
 parts.burst(new V(w.x,1.5,w.z),160,8,[FV[w.side].glowC.clone().multiplyScalar(1.4),new THREE.Color(1.6,1.5,1.2)],.12,2.4,{up:true,grav:4,drag:.8,flat:1});}
function award(kind,won,g){const pts=run.pts;lastAward={pts,won:kind==='clear'||(kind==='versus'&&won),kind,fighter:ROSTER[opt.p1].full,mode:opt.mode,cpu:opt.cpu,wins:run.won,rounds:`${run.rw||0}-${run.rl||0}`,perfects:run.perfects,maxCombo:run.maxCombo,grade:g,stage:STAGES[stageIdx].name,two:opt.mode==='versus'&&opt.pl===2};
 const tok=5+Math.min(60,pts/500|0);if(!run.awarded){run.awarded=1;addRound(tok,lastAward.won);saveBest(ID,pts);}return tok;}
function continueArcade(){run.conts++;run.pts=Math.round(run.pts*.7);run.awarded=0;beginMatch(opt.p1,run.ladder[run.pos],run.cur.st,run.cur.o);}
function pause(on){if(on&&app==='match'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');}else if(!on&&app==='paused'){app='match';$('pause').hidden=true;document.body.classList.add('playing');}}
function toMenu(){app='menu';phase='';run=null;loadStage(opt.stage>=0?opt.stage:0);makeWorld(opt.p1,opt.mode==='arcade'?(opt.p1===0?2:0):opt.p2,{});world.active=false;world.f.forEach(f=>f.st='idle');
 $('menu').hidden=false;$('keys').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('vs').hidden=true;$('bars').classList.remove('on');document.body.classList.remove('playing');snd.music(false);refreshMenu();camSnap=true;}

/* ================= simulation events → juice ================= */
const tv=new V(),tv2=new V();
function ev(type,a,b,c,d){if(!world||app==='menu')return;const quiet=app!=='match';
 switch(type){
  case 'hit':{const info=c,m=info.m,p=tv.set(info.pos.x,info.pos.y,info.pos.z),k=Math.min(1,info.dmg/110),fire=m.fx==='fire'||(a.def.id==='ryker'&&a.rage),dm=info.sup&&info.i<m.h.length-1?.4:1;
   const cc=fire?FX.fire:[a.vis.glowC.clone().multiplyScalar(1.6),new THREE.Color(2,1.8,1.4)];
   sparks.fire(p,(info.counter?new THREE.Color(2.4,.6,.3):cc[0]).clone().multiplyScalar(dm<1?.6:.8),(.7+k*1.3)*(dm<1?.6:1),.12+k*.08);sparks.fire(p,new THREE.Color(1.6,1.6,1.6).multiplyScalar(dm<1?.5:1),(.4+k*.5)*(dm<1?.5:1),.08);
   parts.burst(p,(8+(k*26|0))*dm|0,3+k*7,[cc[0],cc[1],new THREE.Color(1.4,1.4,1.4)],.05+k*.04,.18+k*.25,{drag:3,grav:5,flat:.8});
   if(info.heavy||info.launch||info.sup)shocks.fire(p,cc[0].clone().multiplyScalar(.3),.3+k*.6,.16+k*.06);
   shake=Math.max(shake,.1+k*.6+(info.sup?.3:0));bloomKick=Math.max(bloomKick,k*.3*dm);flash.position.copy(p).lerp(cam.position,.25);flash.position.y+=.3;flash.color.copy(cc[0]);const mc=Math.max(flash.color.r,flash.color.g,flash.color.b,1);flash.color.multiplyScalar(1/mc);flash.intensity=Math.max(flash.intensity,(1.5+k*5)*dm);
   if(!quiet){snd.play(/^f/.test(m.lb||'')?'kick':'hit',k,fire?'fire':null);if(info.sup&&info.i===m.h.length-1){snd.play('superHit');flashA=.35;}
    if(info.counter)pop(p,'COUNTER!','#ff5a3a',true);else if(info.launch&&!info.sup)pop(p,'LAUNCH!','#ffd23a');
    const v=a.vis;v.cb=b.combo;v.cbD=b.cdmg;v.cbT=1.6;if(b.combo>=2){const el=$('cb'+a.side);el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}
    if(a.side===0&&world.training)trainInfo(a,m,info);}
   hype=Math.min(1,hype+k*.25);break;}
  case 'block':{const p=tv.set(c.pos.x,c.pos.y,c.pos.z);sparks.fire(p,new THREE.Color(.6,1,1.8),.55,.1);parts.burst(p,6,3,new THREE.Color(.6,.9,1.6),.04,.15,{drag:4});shake=Math.max(shake,.06);if(!quiet)snd.play('block');if(a.side===0&&world.training)trainInfo(a,c.m,{...c,dmg:0,blocked:1});break;}
  case 'armor':{const p=tv.set(c.pos.x,c.pos.y,c.pos.z);sparks.fire(p,new THREE.Color(2,1.4,.6),.9,.14);if(!quiet){snd.play('block');pop(p,'ARMOR','#ffb04a');}break;}
  case 'move':{if(!quiet&&!c.sup&&!c.grab&&c.h.length)snd.play('whiff',Math.min(1,(c.h[0].d||30)/80));break;}
  case 'super':{const f=a;cineF=f;cineT=0;$('cinet').textContent=b.n;$('cinew').textContent=f.def.name+' · SUPER';$('cine').style.setProperty('--cc',f.vis.css);$('cine').classList.add('on');$('bars').classList.add('on');
   flashA=.35;bloomKick=.3;if(!quiet){snd.play('super');snd.say(b.n.toLowerCase(),1.05,.6);}parts.burst(tv.set(f.x,1.2,f.z),70,6,[f.vis.glowC.clone().multiplyScalar(1.6),new THREE.Color(1.3,1.3,1.3)],.06,.7,{drag:2.5});shocks.fire(tv.set(f.x,1.1,f.z),f.vis.glowC.clone().multiplyScalar(.7),1.7,.5,true);break;}
  case 'grab':if(!quiet)snd.play('grab');break;
  case 'break':{const p=tv.set((a.x+b.x)/2,1.3,(a.z+b.z)/2);sparks.fire(p,new THREE.Color(1.6,1.6,2),1.2,.2);shocks.fire(p,new THREE.Color(.5,.6,1),.9,.22);if(!quiet){snd.play('break');pop(p,'BREAK!','#9ad8ff',true);}break;}
  case 'throwTick':{const p=tv.set(b.x,1.1,b.z);sparks.fire(p,new THREE.Color(2,1.6,1),.8,.12);shake=Math.max(shake,c?.8:.25);if(!quiet)snd.play(c?'slam':'hit',.6);if(c)dust(b,30);break;}
  case 'throwHit':{dust(b,26);shake=Math.max(shake,.55);shocks.fire(tv.set(b.x,.3,b.z),new THREE.Color(.6,.5,.4),1.1,.3);if(!quiet){snd.play('slam');pop(tv.set(b.x,1.4,b.z),c.kind==='pile'?d+' DMG':a.def.throwN.toUpperCase()+'!','#ffb04a',true);}if(a.side===0&&world.training)trainInfo(a,{n:a.def.throwN,first:10},{dmg:d,adv:'KND'});break;}
  case 'parry':{const f=a;const p=tv.set(f.x+f.fx*.5,1.3,f.z+f.fz*.5);shocks.fire(p,new THREE.Color(1.2,1,1.6),1.1,.3,true);sparks.fire(p,new THREE.Color(2,2,2.4),1.6,.2);flashA=.25;if(!quiet){snd.play('parry');pop(p,'PARRY!','#ff9ad8',true);}break;}
  case 'wall':{const f=a;dust(f,18);shake=Math.max(shake,.5);shocks.fire(tv.set(f.x,1.1,f.z),new THREE.Color(.7,.6,.5),.9,.25);if(!quiet){snd.play('wall');pop(tv.set(f.x,1.8,f.z),'WALL SPLAT!','#ffb04a',true);}break;}
  case 'land':{const f=a;if(d){dust(f,14);shake=Math.max(shake,.12);if(!quiet)snd.play('land',.6);}else if(c<-.1){dust(f,6);if(!quiet&&f.human>=0)snd.play('land',-c);}break;}
  case 'quake':{const f=a;dust(f,40);shocks.fire(tv.set(f.x+f.fx*.6,.3,f.z+f.fz*.6),new THREE.Color(.7,.5,.3),1.5,.35);shake=Math.max(shake,.45);if(!quiet)snd.play('quake');break;}
  case 'tp':case 'flick':{const f=a;parts.burst(tv.set(f.x,1,f.z),40,3,[f.vis.glowC.clone().multiplyScalar(1.5),new THREE.Color(.2,.1,.3)],.08,.4,{drag:3});if(!quiet)snd.play('dash');break;}
  case 'proj':if(!quiet)snd.play('proj',b.kind==='orb'||b.kind==='quake'?1:0);break;
  case 'projHit':{const p=tv.set(a.x,a.y,a.z);sparks.fire(p,a.o.vis.glowC.clone().multiplyScalar(1.6),1.2,.18);parts.burst(p,24,5,[a.o.vis.glowC.clone().multiplyScalar(1.8),new THREE.Color(1.6,1.6,1.6)],.06,.35,{drag:3});break;}
  case 'clash':{const p=tv.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);sparks.fire(p,new THREE.Color(2,2,2),1.6,.2);shocks.fire(p,new THREE.Color(1.4,1.4,1.6),1.4,.25);if(!quiet)snd.play('clash');break;}
  case 'dash':case 'ss':{const f=a;dust(f,4);if(!quiet&&f.human>=0)snd.play('dash');break;}
  case 'ko':{kodSide=a.side;if(!quiet&&phase==='fight'){const other=world.f[1-a.side];endRound(other.ko?-1:other.side,other.ko?'double':'ko');}break;}
  case 'comboEnd':{const f=a,att=b;if(c>=3&&!quiet){const v=att.vis;v.cb=c;v.cbD=d;v.cbT=1.8;}if(att.side===0&&world.training&&c>=1)$('t-cb').textContent=`${c} HIT${c>1?'S':''} · ${d} DMG`;break;}
 }}
function dust(f,n){parts.burst(tv.set(f.x,.08,f.z),n,2.4,[new THREE.Color(.5,.47,.44),new THREE.Color(.38,.36,.34)],.16,.6,{drag:3,grav:-.4,flat:.3});}
function trainInfo(a,m,info){$('t-mv').textContent=m.n;$('t-su').textContent=(m.first||'—')+'f';$('t-dm').textContent=info.blocked?'BLOCKED':info.dmg;
 const adv=info.adv;const fmt=v=>typeof v==='number'?`<span class="${v>=0?'pos':'neg'}">${v>0?'+':''}${v}</span>`:v;$('t-adv').innerHTML=(info.blocked?'BLOCK ':'HIT ')+fmt(adv);}
function pop(p,txt,color,big){const s=project(p);if(!s)return;const e=document.createElement('div');e.className='pop'+(big?' big':'');e.textContent=txt;e.style.color=color;e.style.left=cl(s.x,90,innerWidth-90)+'px';e.style.top=cl(s.y-40,120,innerHeight-120)+'px';$('pops').appendChild(e);setTimeout(()=>e.remove(),950);}
function announce(t,s,dur,color){$('annt').textContent=t;$('anns').textContent=s||'';$('ann').style.setProperty('--ac',color||'#ff4d00');if(t){$('ann').classList.remove('on');void $('ann').offsetWidth;$('ann').classList.add('on');}else $('ann').classList.remove('on');annT=dur||0;}

/* ================= input ================= */
const GAMEK=new Set(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Slash','Quote','Semicolon','BracketRight','Comma','Period','KeyJ','KeyK','KeyL','KeyI','KeyU','KeyO','Tab','ShiftRight','Digit1','Digit2','Digit3','Digit4','Digit5','Digit0']);
const IN=controls(canvas,{canLock:()=>false,menu:()=>false,onKey:e=>{
 if((app==='match'||app==='paused')&&GAMEK.has(e.code))e.preventDefault();if(e.code==='Space'&&app!=='menu')e.preventDefault();
 if(e.code==='Escape'){if(app==='match'&&phase!=='vs')pause(true);else if(app==='paused')pause(false);}
 if(e.code==='KeyM'){snd.setOn(!snd.on);}
 if(app==='match'&&world&&world.training){const dm={Digit1:'stand',Digit2:'crouch',Digit3:'block',Digit4:'jump',Digit5:'cpu'}[e.code];if(dm){dummy=dm;segD.sync();}if(e.code==='Digit0'){world.place(2.6);world.f.forEach(f=>f.meter=100);}}
 if(e.code==='Enter'&&app==='menu'&&!e.repeat)start();}});
const {keys,edge}=IN;
const KB=[{l:['KeyA'],r:['KeyD'],u:['KeyW'],d:['KeyS'],P:['KeyJ'],K:['KeyK'],H:['KeyL'],T:['KeyU'],S:['KeyI'],U:['KeyO'],SS:['Space']},
 {l:['ArrowLeft'],r:['ArrowRight'],u:['ArrowUp'],d:['ArrowDown'],P:['Numpad1','Comma'],K:['Numpad2','Period'],H:['Numpad3','Slash'],T:['Numpad4','Semicolon'],S:['Numpad5','Quote'],U:['Numpad6','BracketRight'],SS:['Numpad0','ShiftRight']}];
const BT=['P','K','H','T','S','U','SS'],padPrev=[{},{}];
const camR=new V(),camF=new V(),relLock=[0,0];
// raw screen-space input → fighter-relative input (x +1 = toward the opponent, sidestep side from up/down)
function readHuman(f){const i=f.human,solo=!(world.f[1].human>=0),maps=solo?KB:[KB[i]];const on=n=>maps.some(m=>m[n].some(k=>keys[k])),pr=n=>maps.some(m=>m[n].some(k=>edge[k]));
 let sx=(on('r')?1:0)-(on('l')?1:0),sy=(on('u')?1:0)-(on('d')?1:0);const I=blankIn();for(const b of BT){I[b]=on(b);I[b+'p']=pr(b);}
 const g=playerPad(i,solo?1:2,1);
 if(g){const a=g.axes,b=g.buttons,P=padPrev[i],btn=k=>!!(b[k]&&b[k].pressed),edg=(k,n)=>btn(k)&&!P[n];
  const lx=deadzone(a[0]||0,.35)+(btn(15)?1:0)-(btn(14)?1:0),ly=-deadzone(a[1]||0,.45)+(btn(12)?1:0)-(btn(13)?1:0);if(lx)sx=Math.sign(lx);if(ly)sy=Math.sign(ly);
  const map=[['P',2],['K',0],['H',3],['S',1],['T',5],['U',7],['SS',4],['SS',6]];for(const[n,k]of map){if(btn(k))I[n]=true;if(edg(k,'b'+k))I[n+'p']=true;}
  if(edg(9,'st')){if(app==='match')pause(true);else if(app==='paused')pause(false);}
  for(const k of[0,1,2,3,4,5,6,7,9])P['b'+k]=btn(k);P.st=btn(9);}
 // screen right → toward/away from the opponent; the mapping holds while a direction is held so a camera swing never flips a guard
 const o=f.opp;const side=Math.sign((o.x-f.x)*camR.x+(o.z-f.z)*camR.z)||1;if(!sx||!relLock[i])relLock[i]=side;I.x=sx*relLock[i];I.y=sy;
 const lx=f.fz,lz=-f.fx,wx=camF.x*(sy<0?-1:1),wz=camF.z*(sy<0?-1:1);I.ss=Math.sign(lx*wx+lz*wz)||1;if(I.SS)I.y=0;return I;}
function menuPads(){for(let i=0;i<2;i++){const g=gamepads()[i];if(!g)continue;const b=g.buttons,P=padPrev[i];const st=!!(b[9]&&b[9].pressed),a=!!(b[0]&&b[0].pressed);if(st&&!P.st){if(app==='paused')pause(false);else if(app==='menu')start();else if(app==='over')$('again').click();}if(a&&!P.ma&&app==='menu')start();P.st=st;P.ma=a;}}
function mergeIn(prev,I){if(!prev)return I;for(const b of BT)I[b+'p']=I[b+'p']||prev[b+'p'];return I;}

/* ================= main step ================= */
function step(dt){dt=Math.min(dt,.1);time+=dt;
 if(app==='match'&&world){for(const f of world.f)if(f.human>=0&&!auto)f.inpNext=mergeIn(f.inpNext,readHuman(f));}else menuPads();
 IN.flush();
 if(app==='paused'){visuals(0,dt);return;}
 if(app==='match')flow(dt);
 // fixed 60 Hz simulation
 if(world&&(app==='match'||app==='menu'||app==='over')){acc+=dt*timeScale;let n=0;
  while(acc>=DT&&n<6){for(const f of world.f){if(manual[f.side])f.inp=manual[f.side];else if(world.active&&f.human>=0&&!auto){f.inp=f.inpNext||f.inp||blankIn();}
    else if(world.active)f.inp=think(f,world,world.training&&f.side===1?dummy:null);else f.inp=blankIn();}
   world.step();for(const f of world.f)if(f.inpNext)for(const b of BT)f.inpNext[b+'p']=false;if(world.training)for(const f of world.f)if(f.st!=='atk'||!f.move||!f.move.sup)f.meter=100;acc-=DT;n++;}if(n>=6)acc=0;
  if(app==='menu')menuShow(dt);}
 visuals(dt*timeScale,dt);}
let showT=2;function menuShow(dt){showT-=dt;if(showT<0){showT=1.6+rnd(1.2);const f=world.f[rnd(2)|0];if(f.st==='idle'){const list=['P','PP','K','KK','H','3H','6K','2H',...f.def.sp.map(s=>s.name)].filter(n=>!f.moves[n].proj&&!f.moves[n].tp);world.start(f,list[rnd(list.length)|0]);}}
 for(const f of world.f){if(f.st==='atk'&&f.move&&f.mt>=f.move.f){world.end(f,0);}f.x+=(f.side?1.3:-1.3)*.0-f.x*0+((f.side?1.3:-1.3)-f.x)*.05;f.z+=(0-f.z)*.05;world.face(f);}}
function flow(dt){phaseT+=dt;
 switch(phase){
  case 'vs':if(phaseT>2.6)startRound();break;
  case 'intro':if(phaseT>1.6&&phaseT-dt<=1.6){announce('FIGHT!','',.9,'#ff4d2a');snd.say('Fight!',1.1,.6);snd.play('beep',1);}if(phaseT>2.1){phase='fight';world.active=true;}break;
  case 'fight':if(world.training)break;clock-=dt;{const s=Math.ceil(clock);if(s!==lastSec){lastSec=s;if(s<=5&&s>0)snd.play('tick');}}
   if(clock<=0){clock=0;const[a,b]=world.f;const ra=a.hp/a.maxHp,rb=b.hp/b.maxHp;endRound(ra>rb?0:rb>ra?1:-1,'time');}break;
  case 'ko':if(phaseT>.9)timeScale=Math.min(1,timeScale+dt*1.5);if(phaseT>2.6){timeScale=1;settleRound();}break;
  case 'timeup':if(phaseT>1.6)settleRound();break;
  case 'roundEnd':if(phaseT>2.4)afterRound();break;
  case 'matchEnd':if(phaseT>3.2)afterMatch();break;}
 if(cineF&&world.freeze<=0){const m=cineF.move;if(!(m&&m.sup&&cineF.st==='atk')&&cineF.st!=='throw'){cineF=null;$('cine').classList.remove('on');$('bars').classList.remove('on');}}}

/* ================= visuals ================= */
const discProf=[[0,.032],[.042,.032],[.05,.02],[.14,.012],[.172,.02],[.198,.027],[.214,.021],[.226,0],[.214,-.021],[.198,-.027],[.172,-.02],[.14,-.012],[.05,-.02],[.042,-.032],[0,-.032]].map(([x,y])=>new THREE.Vector2(x,y));   // halo disc: thin web, bevelled rim, hub
const projVis=new Map();const PG={disc:new THREE.LatheGeometry(discProf,48),discIn:new THREE.RingGeometry(.118,.138,48).rotateX(-Math.PI/2),discRim:new THREE.TorusGeometry(.205,.005,6,64).rotateX(Math.PI/2),discHub:new THREE.CylinderGeometry(.026,.026,.07,16),
 discTooth:new THREE.BoxGeometry(.075,.012,.022),orb:new THREE.SphereGeometry(1,20,14),kunai:new THREE.ConeGeometry(.04,.32,6).rotateX(Math.PI/2),ring:new THREE.RingGeometry(.6,1,32).rotateX(-Math.PI/2),beam:new THREE.CylinderGeometry(1,1,1,20,1,true).rotateX(Math.PI/2).translate(0,0,.5),pillar:new THREE.CylinderGeometry(1,1,1,24,1,true)};
const shared=new Set(Object.values(PG));function disposeVis(o){scene.remove(o);o.traverse(m=>{if(m.geometry&&!shared.has(m.geometry))m.geometry.dispose();if(m.material)m.material.dispose();});}
const addM=c=>new THREE.MeshBasicMaterial({color:c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
function projMesh(p){const c=p.o.vis.glowC,g=new THREE.Group();
 if(p.kind==='disc'){const tilt=new THREE.Group(),sp=new THREE.Group();tilt.rotation.z=.55;tilt.add(sp);g.add(tilt);   // rolled toward the side camera so its face reads; sp spins
  const metal=new THREE.MeshStandardMaterial({color:0xdde4ee,metalness:.85,roughness:.22,emissive:c,emissiveIntensity:.1}),dark=new THREE.MeshStandardMaterial({color:0x26304a,metalness:.7,roughness:.35}),inl=addM(c.clone().multiplyScalar(1.6));
  sp.add(new THREE.Mesh(PG.disc,metal));for(const y of[1,-1]){const r=new THREE.Mesh(PG.discIn,inl);r.position.y=y*.0145;if(y<0)r.rotation.x=Math.PI;sp.add(r);const e=new THREE.Mesh(PG.discRim,inl);e.position.y=y*.025;sp.add(e);}
  const hub=new THREE.Mesh(PG.discHub,dark);sp.add(hub);const core=new THREE.Mesh(PG.orb,addM(c.clone().multiplyScalar(1.4)));core.scale.setScalar(.022);core.position.y=.036;sp.add(core);const core2=core.clone();core2.position.y=-.036;sp.add(core2);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,t=new THREE.Mesh(PG.discTooth,dark);t.position.set(Math.cos(a)*.232,0,Math.sin(a)*.232);t.rotation.y=-a-Math.PI/2+.5;sp.add(t);}
  const h=new THREE.Mesh(PG.orb,addM(c.clone().multiplyScalar(.1)));h.scale.setScalar(.28);g.add(h);}
 else if(p.kind==='kunai'){for(const a of[-.18,0,.18]){const k=new THREE.Mesh(PG.kunai,new THREE.MeshStandardMaterial({color:0x8890a0,metalness:.9,roughness:.25,emissive:c,emissiveIntensity:.8}));k.rotation.y=a;k.position.x=a*.6;g.add(k);}}
 else if(p.kind==='orb'){const o=new THREE.Mesh(PG.orb,addM(new THREE.Color(2.4,1.8,.8)));o.scale.setScalar(p.r*.6);g.add(o);const h=new THREE.Mesh(PG.orb,addM(c.clone().multiplyScalar(.6)));h.scale.setScalar(p.r*1.1);g.add(h);}
 else if(p.kind==='quake'){const r=new THREE.Mesh(PG.ring,addM(new THREE.Color(1.6,.9,.4)));r.scale.setScalar(.7);g.add(r);}
 g.userData.tr=p.kind!=='quake'?new Trail(scene,14,p.r*.7,c.clone().multiplyScalar(1.4),{minD:.004,soft:1}):null;scene.add(g);return g;}
const beamM=addM(new THREE.Color(1,1,1)),beam=new THREE.Mesh(PG.beam,beamM),beamCore=new THREE.Mesh(PG.beam,addM(new THREE.Color(2.5,2.5,2.5)));beam.add(beamCore);beamCore.scale.set(.4,.4,1);beam.visible=false;scene.add(beam);
const pillar=new THREE.Mesh(PG.pillar,addM(new THREE.Color(1,1,1)));pillar.visible=false;scene.add(pillar);
const tq=new V(),tq2=new V();let ambAcc=0;
function visuals(dt,rdt=dt){const t=time;
 if(world){const frozen=world.freeze>0;
  for(const v of FV){const f=v.f,rig=v.rig;const stop=world.stop>0&&(f.st==='hit'||f.st==='block'||f.st==='air'||f.st==='sup'||f.st==='wall'||f.st==='kd');
   const adt=frozen?(cineF===f?dt*.35:0):stop?0:dt;animate(rig,f,adt,t,{winPose:v.winPose});
   let sx=0,sz=0;if(world.stop>0&&(f.st==='hit'||f.st==='air'||f.st==='sup'||f.st==='kd'||f.st==='wall')){const a=.035;sx=(rnd()-.5)*a*2;sz=(rnd()-.5)*a*2;}
   rig.root.position.set(f.x+sx,f.y,f.z+sz);rig.root.visible=!(frozen&&cineF&&cineF!==f&&cineT<.9);
   v.ring.visible=app==='match'&&!world.training&&phase!=='vs';v.ring.position.set(f.x,.02,f.z);v.ring.material.opacity=.35+(f.meter>=100?.35+.25*Math.sin(t*8):0);
   // flashes: hit (capped, and tinted the attacker's colour while a super lands, so a flurry never bleaches the victim white), super-ready shimmer, rage
   const U=rig.U;if(f.flash>0){const lk=f.st==='sup'||f.mname==='sup',ls=f.opp&&f.opp.mname==='sup';if(ls)U.uFlC.value.copy(f.opp.vis.glowC);else U.uFlC.value.setRGB(1,1,1);U.uFl.value=lk||ls?Math.min(.28,f.flash/8):f.flash/6;}else if(cineF===f&&frozen){U.uFlC.value.copy(v.glowC);U.uFl.value=.5+.3*Math.sin(t*30);}else if(f.rage){U.uFlC.value.setRGB(1,.25,.1);U.uFl.value=.12+.08*Math.sin(t*9);}else U.uFl.value=0;
   U.uRimS.value=.38+(f.meter>=100?.35+.2*Math.sin(t*6):0);
   // swoosh on the striking limb (supers: saturated hue, capped brightness, so a flurry's overlapping streaks don't blow out to white)
   let swing=false;if(f.st==='atk'&&f.move)for(const h of f.move.h)if(f.mt>=h.s-1&&f.mt<=h.e+1)swing=true;rig.root.updateMatrixWorld(true);rig.limb(f.move&&f.move.lb||'hR').getWorldPosition(tq);
   const sm=f.move&&f.move.sup,sc=v.swoosh.col.copy(f.move&&f.move.fx==='fire'?new THREE.Color(2.4,1,.2):v.glowC);sc.multiplyScalar(sm?2.4/Math.max(sc.r,sc.g,sc.b,.05):1.2).addScalar(sm?0:.15);v.swoosh.w=sm?.36:.2;if(!swing&&v.swoosh.str<.05)v.swoosh.clear();v.swoosh.push(tq,swing&&!stop,adt||1e-3,26);
   if(v.scarf){rig.fx.scarfAnchor.getWorldPosition(tq);v.scarf.push(tq,true,rdt||1e-3,10);const P=v.scarf.pts;for(let i=1;i<P.length;i++){P[i].y-=rdt*.5*i*.06;P[i].x-=f.fx*rdt*.25;P[i].z-=f.fz*rdt*.25;}}
   if(f.rage&&rnd()<.4&&app==='match')parts.emit(f.x+rnd(.8)-.4,f.y+rnd(f.H),f.z+rnd(.8)-.4,0,1.4,0,2.2,.5,.15,.07,.5,0,1);
   if(f.meter>=100&&rnd()<.25&&app==='match')parts.emit(f.x+rnd(.7)-.35,f.y+rnd(f.H),f.z+rnd(.7)-.35,0,1.1,0,v.glowC.r*1.6,v.glowC.g*1.6,v.glowC.b*1.6,.05,.6,0,1);
   if(f.st==='atk'&&f.move&&f.move.fx==='fire'&&rnd()<.7){rig.limb(f.move.lb||'hR').getWorldPosition(tq);parts.emit(tq.x,tq.y,tq.z,(rnd()-.5)*.6,.8+rnd(),(rnd()-.5)*.6,2.6,1.1,.2,.08,.3,-1,2);}
   if(f.st==='dash'&&rnd()<.3)dust(f,1);}
  // projectiles
  const seen=new Set();for(const p of world.proj){seen.add(p.id);let g=projVis.get(p.id);if(!g){g=projMesh(p);projVis.set(p.id,g);}g.position.set(p.x,p.y,p.z);g.rotation.y=Math.atan2(p.vx,p.vz);
   if(p.kind==='disc')g.children[0].children[0].rotation.y+=dt*24;if(p.kind==='orb')g.children[1].scale.setScalar(p.r*(1.05+Math.sin(t*20)*.1));
   if(p.kind==='quake'){g.children[0].scale.setScalar(.6+Math.sin(t*30)*.1);if(rnd()<.9)parts.emit(p.x+(rnd()-.5)*.6,.05,p.z+(rnd()-.5)*.6,(rnd()-.5),2+rnd(2),(rnd()-.5),.6,.5,.4,.12,.5,8,1);if(rnd()<.5)parts.emit(p.x,.1,p.z,0,1,0,2.2,1,.3,.18,.25);}
   if(g.userData.tr)g.userData.tr.push(g.position,true,dt||1e-3,14);}
  for(const[id,g]of projVis){if(!seen.has(id)){if(g.userData.tr)disposeVis(g.userData.tr.mesh);disposeVis(g);projVis.delete(id);}}
  // super-specific visuals: Sera's prism beam, the Monarch's edict pillar (both in their hue at capped brightness: a white-hot core washed the target out)
  beam.visible=false;pillar.visible=false;
  for(const f of world.f){if(f.st!=='atk'||f.mname!=='sup')continue;const m=f.move;
   if(m.beam&&f.mt>=18&&f.mt<=76){beam.visible=true;f.vis.rig.limb('hR').getWorldPosition(tq);beam.position.set(tq.x,f.y+m.beam.y*f.H/1.8,tq.z);beam.rotation.set(0,Math.atan2(f.fx,f.fz),0);const w=.35*(f.mt<22?(f.mt-17)/5:f.mt>70?(77-f.mt)/7:1)*(1+Math.sin(t*50)*.08);beam.scale.set(w,w,m.beam.len);const gc=f.vis.glowC;beamM.color.copy(gc).multiplyScalar(.7);beamCore.material.color.copy(gc).multiplyScalar(1.7/Math.max(gc.r,gc.g,gc.b,.05)).addScalar(.2);
    if(rnd()<.8)parts.emit(tq.x+f.fx*rnd(8),beam.position.y+(rnd()-.5)*.4,tq.z+f.fz*rnd(8),(rnd()-.5)*2,(rnd()-.5)*2,(rnd()-.5)*2,f.vis.glowC.r*2,f.vis.glowC.g*2,f.vis.glowC.b*2,.06,.3);}
   if(f.def.id==='monarch'&&f.locked&&f.mt>=14&&f.mt<=82){const d=f.locked;pillar.visible=true;pillar.position.set(d.x,4,d.z);const w=.9+Math.sin(t*40)*.08;pillar.scale.set(w,8,w);pillar.material.color.set(f.mt<70?0x8a50ff:0xffc040).multiplyScalar(.8);if(rnd()<.8)parts.emit(d.x+(rnd()-.5),rnd(3),d.z+(rnd()-.5),0,4,0,2,1.6,.6,.08,.5);}}
  if(stageVis){stageVis.update(t,rdt,cam,hype);const A=stageVis.amb;if(A&&gfx>0){ambAcc+=rdt*A.n;while(ambAcc>1){ambAcc--;const a=rnd(Math.PI*2),r=A.flash?A.r+rnd(10):rnd(A.r);const c=A.col[rnd(A.col.length)|0];
    if(A.rain){const x=camLook.x+(rnd()-.5)*14,z=camLook.z+(rnd()-.5)*14;parts.emit(x,A.y0+rnd(A.y1-A.y0),z,A.v[0],A.v[1],A.v[2],c.r,c.g,c.b,A.size,A.life,0,0);}
    else parts.emit(Math.sin(a)*r,A.y0+rnd(A.y1-A.y0),Math.cos(a)*r,A.v[0]*(rnd()-.5)*2,A.v[1]*(.5+rnd()),A.v[2],c.r,c.g,c.b,A.size*(.6+rnd(.8)),A.life*(.5+rnd()),A.ember?-.3:0,A.ember?.3:0);}}}}
 parts.update(rdt>0?dt:0);shocks.update(dt,cam);sparks.update(dt);
 flash.intensity*=Math.exp(-rdt*8);if(flashA>0){flashA=Math.max(0,flashA-rdt*2);$('flashv').style.opacity=flashA.toFixed(3);}else $('flashv').style.opacity=0;bloomKick*=Math.exp(-rdt*2.6);hype=Math.max(0,hype-rdt*.12);
 if(snd.ac){snd.hype(app==='match'?.15+hype*.8:0);if(app==='match'||app==='paused')snd.tick();}
 // dim the arena while a super charges up
 const dim=world&&world.freeze>0?.25:1;const lk=1-Math.exp(-rdt*10);hemi.intensity+=(lightBase.hemi*dim-hemi.intensity)*lk;key.intensity+=(lightBase.key*(dim<1?.5:1)-key.intensity)*lk;rim.intensity+=(lightBase.rim*dim-rim.intensity)*lk;rim2.intensity+=(lightBase.rim2*dim-rim2.intensity)*lk;
 if(world)cameraUpdate(rdt);hud(rdt);}

/* ================= camera ================= */
const angD=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
function cameraUpdate(dt){const[a,b]=world.f;const aspect=innerWidth/innerHeight;cam.aspect=aspect;const CR=SR[stageIdx][1];
 const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,sep=Math.hypot(b.x-a.x,b.z-a.z);let ax=sep>.1?(b.x-a.x)/sep:1,az=sep>.1?(b.z-a.z)/sep:0;
 let pos=new V(),look=new V(mx,.95+Math.max(a.y,b.y)*.35,mz),fov=36,k=camSnap?1:1-Math.exp(-dt*4.5);
 if(app==='menu'){orbitT+=dt;const ang=Math.sin(orbitT*.18)*.5+.15,d=5.6;pos.set(mx+Math.sin(ang)*d,1.55,mz+Math.cos(ang)*d);look.set(mx,1.05,mz);fov=34;}
 else if(app==='over'||phase==='matchEnd'){const w=world.f[winner>=0?winner:0];orbitT+=dt;const ang=Math.atan2(w.fx,w.fz)+Math.sin(orbitT*.25)*.6+.5,d=app==='over'?3.6:3.1;pos.set(w.x+Math.sin(ang)*d,1.45,w.z+Math.cos(ang)*d);look.set(w.x,1.15*w.H/1.8,w.z);fov=32;}
 else if(cineF&&world.freeze>0){const f=cineF;cineT+=dt;const side=Math.sign(Math.sin(camYaw-Math.atan2(f.fx,f.fz)))||1;const ang=Math.atan2(f.fx,f.fz)+side*(.8-cineT*.4),d=2.3-cineT*.5;pos.set(f.x+Math.sin(ang)*d,f.y+1.45*f.H/1.8,f.z+Math.cos(ang)*d);
  if(Math.hypot(pos.x,pos.z)>CR){const ang2=Math.atan2(f.fx,f.fz)-side*(.8-cineT*.4);pos.set(f.x+Math.sin(ang2)*d,pos.y,f.z+Math.cos(ang2)*d);}look.set(f.x,f.y+1.35*f.H/1.8,f.z);fov=30;k=cineT<.05?1:1-Math.exp(-dt*12);}
 else{// side-on: the camera sits on the perpendicular of the fighters' axis, swinging round when a wall is in the way
  const n1=Math.atan2(-az,ax),n2=n1+Math.PI;let tgt=Math.abs(angD(camYaw,n1))<Math.abs(angD(camYaw,n2))?n1:n2;
  let dist=cl(sep*.75+3.7,4.6,9.6)*(1+Math.max(0,1-aspect)*.25);if(cineF&&cineF.locked){orbitT+=dt;dist=4.4;tgt=camYaw+dt*.8;}
  const out=y=>Math.hypot(mx+Math.sin(y)*dist,mz+Math.cos(y)*dist);if(out(tgt)>CR){const o2=tgt===n1?n2:n1;if(out(o2)<out(tgt)-.4)tgt=o2;}
  if(phase==='intro'){const s=Math.max(0,1-phaseT/1.8);tgt+=s*1.2;dist+=s*2.5;}
  camYaw+=angD(camYaw,tgt)*(camSnap?1:1-Math.exp(-dt*(cineF?2:3)));
  let d=dist;for(let i=0;i<12&&Math.hypot(mx+Math.sin(camYaw)*d,mz+Math.cos(camYaw)*d)>CR;i++)d*=.92;d=Math.max(d,2.6);
  camDist+=(d-camDist)*(camSnap?1:1-Math.exp(-dt*3));pos.set(mx+Math.sin(camYaw)*camDist,1.35+camDist*.07+Math.max(a.y,b.y)*.3,mz+Math.cos(camYaw)*camDist);
  if(phase==='ko'&&kodSide>=0){const v=world.f[kodSide];look.lerp(tq.set(v.x,.9,v.z),.35);}}
 const camSnap0=camSnap;camPos.lerp(pos,k);camLook.lerp(look,k);camSnap=false;
 shake=Math.max(0,shake-dt*2.6);const sa=shake*shake*.12;if(aspect<1.6)fov=Math.min(88,2*Math.atan(Math.tan(fov*Math.PI/360)*1.6/aspect)*180/Math.PI);   // narrow / portrait: keep the horizontal framing
 cam.fov+=(fov-cam.fov)*Math.min(1,camSnap0?1:dt*6);
 cam.position.set(camPos.x+(rnd()-.5)*sa,camPos.y+(rnd()-.5)*sa,camPos.z+(rnd()-.5)*sa);cam.lookAt(camLook);
 const W=innerWidth,H=innerHeight;if(app==='menu')cam.setViewOffset(W,H,-W*(W>1100?.22:.04),H*(W>1100?.06:0),W,H);else if(app==='over')cam.setViewOffset(W,H,-W*(W>900?.24:.03),0,W,H);else cam.clearViewOffset();cam.updateProjectionMatrix();
 cam.updateMatrixWorld();camR.setFromMatrixColumn(cam.matrixWorld,0);camR.y=0;camR.normalize();camF.set(camLook.x-cam.position.x,0,camLook.z-cam.position.z).normalize();
}
function project(p){tq2.set(p.x,p.y,p.z||0).project(cam);if(tq2.z>1)return null;return{x:(tq2.x*.5+.5)*innerWidth,y:(-tq2.y*.5+.5)*innerHeight};}

/* ================= HUD ================= */
function setT(el,v,c,k){if(c[k]!==v){c[k]=v;el.textContent=v;}}
function hud(dt){if(annT>0){annT-=dt;if(annT<=0)$('ann').classList.remove('on');}
 if(app!=='match'&&app!=='paused')return;const c=hudCache;
 setT($('clock'),String(Math.max(0,Math.ceil(clock))),c,'clk');$('timer').classList.toggle('low',phase==='fight'&&clock<=10);setT($('rnd'),'ROUND '+round,c,'rnd');
 for(const s of[0,1]){const v=FV[s],f=v.f,r=f.hp/f.maxHp;if(v.lag<r)v.lag=r;else if(f.combo===0||f.st==='down')v.lag=Math.max(r,v.lag-dt*.5);
  const kv=Math.round(r*1000),kl=Math.round(v.lag*1000);if(c['h'+s]!==kv){c['h'+s]=kv;$('hp'+s).style.transform=`scaleX(${r})`;$('hp'+s).parentNode.classList.toggle('low',r<.3);$('hp'+s).parentNode.classList.toggle('rage',f.rage);}
  if(c['l'+s]!==kl){c['l'+s]=kl;$('lag'+s).style.transform=`scaleX(${v.lag})`;}
  const m=Math.floor(f.meter);if(c['m'+s]!==m){c['m'+s]=m;$('sm'+s).style.width=m+'%';$('sm'+s).closest('.sm').classList.toggle('full',m>=100);}
  const el=$('cb'+s);if(v.cbT>0){v.cbT-=dt;if(v.cb>=2){el.classList.add('on');setT(el.firstChild,String(v.cb),c,'cb'+s);setT(el.lastChild,v.cbD+' DMG',c,'cd'+s);}}else el.classList.remove('on');}}

/* ================= rendering ================= */
function applyQuality(q){gfx=q;key.castShadow=q>0;R.shadowMap.enabled=q>0;key.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(key.shadow.map){key.shadow.map.dispose();key.shadow.map=null;}R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:1));fxPost=null;scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true;});}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){   // during a super, bloom is held back so the flurry keeps its shape and colour
 const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);if(fxPost)fxPost.w=0;}
 parts.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 for(const v of FV){v.swoosh.update(cam);if(v.scarf)v.scarf.update(cam);}for(const g of projVis.values())if(g.userData.tr)g.userData.tr.update(cam);
 if(!fxPost)makePost();if(fxPost.w!==w*9999+h){fxPost.w=w*9999+h;fxPost.setSize(w,h);}
 if(fxPost.bloom){const su=!!(cineF&&cineF.move&&cineF.move.sup);fxPost.bloom.strength=su?(postOpts.bloom??.5)*.55+bloomKick*.3:(postOpts.bloom??.5)+bloomKick;fxPost.bloom.threshold=Math.min(.97,(postOpts.bloomThreshold??.85)+(su?.08:0));}if(fxPost.grade){fxPost.grade.uniforms.ca.value=.0012+bloomKick*.004+(world&&world.freeze>0?.004:0);fxPost.grade.uniforms.sat.value=(postOpts.saturation??1.1)*(phase==='ko'&&timeScale<1?.5:1);}
 fxPost.render();}
addEventListener('resize',()=>{if(fxPost)fxPost.w=0;});

/* ================= menu ================= */
const pick=pickers(opt,saveOpt);
const HOW={arcade:'Fight up a ladder of five rivals, then face the Monarch on the Gilded Sanctum. Lose and you can continue, at a price.',versus:'Pick two fighters and a stage. Play a friend on one keyboard (or keyboard + gamepad), or set the CPU loose.',training:'Endless health and meter against a dummy you control. Frame data, damage and combo readouts on the left.'};
function chips(id,keyN){const el=$(id);el.innerHTML=ROSTER.map((d,i)=>`<button data-v="${i}" class="${d.boss?'boss':''}" style="--c:${css(d.look.glow)}" title="${d.name} · ${d.style}"><img src="${PORT[i]||''}" alt=""><span>${d.name}</span></button>`).join('');
 el.querySelectorAll('button').forEach(b=>{b.onclick=()=>{opt[keyN]=+b.dataset.v;saveOpt();snd.init();snd.play('select');refreshMenu();toMenuShow();};b.onmouseenter=()=>showInfo(+b.dataset.v);b.onmouseleave=()=>showInfo(opt.p1);});}
function showInfo(i){const el=$('info'),d=ROSTER[i];el.style.setProperty('--c',css(d.look.glow));const ms=d.moves;
 const nm=s=>({qcf:'↓↘→',qcb:'↓↙←',dp:'→↓↘',hcf:'←↓→'}[s.m]+s.b);
 el.innerHTML=`<div><h4>${d.full}<span>${d.style}</span></h4><p>${d.desc}</p><p style="color:var(--mut);font-size:.6rem;margin-top:4px">${d.sp.map(s=>`${ms[s.name].n} <b style="color:#fff">${nm(s)}</b>`).join(' · ')} · SUPER ${ms.sup.n}</p></div><div class="bars">${STAT_NAMES.map((n,k)=>`<div class="bar">${n}<u style="--v:${d.stats[k]*20}%"></u></div>`).join('')}</div>`;}
function refreshMenu(){for(const[id,k]of[['r1','p1'],['r2','p2']])$(id).querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===opt[k]));
 const ar=opt.mode==='arcade',tr=opt.mode==='training';$('r2').hidden=ar;$('r2l').hidden=ar;$('o-pl').hidden=opt.mode!=='versus';$('l-pl').hidden=opt.mode!=='versus';$('o-stage').hidden=ar;$('l-st').hidden=ar;
 $('o-rounds').style.visibility=tr?'hidden':'';$('o-time').style.visibility=tr?'hidden':'';$('how').textContent=HOW[opt.mode];showInfo(opt.p1);
 $('go').textContent=ar?'START ARCADE':tr?'ENTER TRAINING':'FIGHT!';const b=bestScore(ID);$('best').textContent=b?'BEST '+b.toLocaleString()+' PTS':'';pick.sync&&pick.sync();}
function toMenuShow(){if(app!=='menu')return;const st=opt.mode==='arcade'?0:opt.stage>=0?opt.stage:0;loadStage(st);makeWorld(opt.p1,opt.mode==='arcade'?(opt.p1===0?2:0):opt.p2,{});world.active=false;camSnap=true;}
$('o-stage').innerHTML=STAGES.map((s,i)=>`<button data-v="${i}">${s.name}</button>`).join('')+'<button data-v="-1">RANDOM</button>';
const dOpt={get d(){return dummy;},set d(v){dummy=v;}},segD=pickers(dOpt,null);segD('o-dummy','d',false);
function initMenu(){makePortraits();chips('r1','p1');chips('r2','p2');
 pick('o-mode','mode',false,()=>{refreshMenu();toMenuShow();});pick('o-pl','pl');pick('o-cpu','cpu',false);pick('o-rounds','rounds');pick('o-time','time');pick('o-stage','stage',true,()=>toMenuShow());
 $('go').onclick=()=>start();$('again').onclick=()=>{if($('again').textContent==='CONTINUE')continueArcade();else start();};$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
 postButton($('post'),ID,()=>{const a=lastAward||{};return[a.pts||0,`Game: Tempest Fist\nPoints: ${a.pts||0}\nResult: ${a.kind||''} · grade ${a.grade||'-'}\nFighter: ${a.fighter||''} · Mode: ${a.mode||''} · CPU ${a.cpu||''}${a.two?' · 2P local':''}\nMatches won: ${a.wins||0} · Rounds ${a.rounds||''} · Perfects ${a.perfects||0} · Max combo ${a.maxCombo||0}`];});}

/* ================= loop ================= */
initMenu();toMenu();$('loading').style.opacity=0;
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hook ================= */
window.FIGHT={start,step,render,toMenu,pause,
 get state(){return app==='match'?phase:app;},get app(){return app;},get phase(){return phase;},get world(){return world;},get fighters(){return world?world.f:[];},
 get player(){return world&&world.f[0];},get bots(){return world?world.f.filter(f=>f.human<0):[];},
 get round(){return{round,wins:[...wins],clock,perfects:[...perfs],log:roundLog};},get run(){return run;},get score(){return run?run.pts:0;},get award(){return lastAward;},
 setClock(s){clock=s;},setInput(i,inp){manual[i]=inp?Object.assign(blankIn(),inp):null;},set auto(v){auto=!!v;if(world)world.f[0].human=auto?-1:0;},get auto(){return auto;},
 set dummy(v){dummy=v;},skip(){if(phase==='vs')phaseT=9;if(phase==='intro')phaseT=9;},ko(i){world.f[i].hp=1;},setQuality:applyQuality,get quality(){return gfx;},cam:()=>cam,scene,R,parts,
 get stage(){return stageIdx;},loadStage};
