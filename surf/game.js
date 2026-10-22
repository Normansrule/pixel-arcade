// SWELL GUARD — surf and lifeguard duty on one golden-hour shift. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {makeScene,SUN} from './scene.js';
import {Swell,C,TLIP,sandY} from './ocean.js';
import {groundY,ZONE,TOWER} from './world.js';
import {Rig,bodyMaterial,POSE,blendPose,makeBoard} from './rig.js';
import {Surfer,freshCtl} from './surfer.js';
import {Brain,AISKILL} from './ai.js';
import {Duty,EVENTS,best2} from './duty.js';
import {Spray,Rings} from './fx.js';
import {Sound} from './sound.js';
import {addRound,saveBest,bestScore} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {postButton,toast} from '../js/kit3d/ui.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,fmtN=n=>Math.round(n).toLocaleString('en-US'),wrap=a=>{while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;};
const ID='swellguard',SAVE='pxd_swellguard',SHIFT=[240,300,360],DIFFN=['EASY','NORMAL','HARD'];
const STARS=[[7000,16000,28000],[9000,22000,38000],[11000,28000,48000]];
const EVPTS={shark:900,jelly:700,gull:600,child:1000,bigset:800,heat:0,dolphins:700};
const RIVALS=[{name:'KAIA',look:{skin:'#c68a5e',hair:'#1a1a1a',shorts:'#1f8a6a',top:'suit',topC:'#1c3144',female:true,long:true},board:['#f6f2e8','#1f8a6a']},
 {name:'MOSS',look:{skin:'#f1c7a5',hair:'#c9a46a',shorts:'#2d5fa0',top:'none',topC:'#2d5fa0'},board:['#3dc7d6','#f6f2e8']},
 {name:'RENZO',look:{skin:'#9a633f',hair:'#2a1d15',shorts:'#f0b429',top:'tee',topC:'#222'},board:['#ff8a3d','#1c3144']}];

/* ================= save ================= */
function defSave(){return{opt:{diff:1,music:true,cam:0},career:{shifts:0,rescues:0,best:0,bestTrick:''},snap:null,awarded:[]};}
let save=defSave();try{const s=JSON.parse(localStorage.getItem(SAVE));if(s)save={...save,...s,opt:{...save.opt,...s.opt},career:{...save.career,...s.career},awarded:Array.isArray(s.awarded)?s.awarded:[]};}catch(e){}
const persist=()=>{try{localStorage.setItem(SAVE,JSON.stringify(save));}catch(e){}};

/* ================= renderer + scene ================= */
let gfx=quality();const canvas=$('c');const S=makeScene(canvas,gfx);const {R,scene,cam,ocean,world,sun}=S;
const bodyMat=bodyMaterial();const spray=new Spray(scene,gfx>=1?2600:1200),rings=new Rings(scene),snd=new Sound();
let rand=Math.random;
let sim=new Swell(save.opt.diff,rand);sim.prime();

/* ================= surfers ================= */
function makeVis(look,boardTex){const g=new THREE.Group();const board=makeBoard(boardTex);const rig=new Rig(look,bodyMat);g.add(board);g.add(rig.root);scene.add(g);return{g,board,rig,pose:null,bt:0};}
const playerLook={skin:'#d9a27a',hair:'#3a2a1a',shorts:'#c8261c',top:'vest',topC:'#d8261c',glasses:true};
const PV=makeVis(playerLook,S.T.board('#d8261c','#ffd21f',true));
const RV=RIVALS.map(r=>makeVis(r.look,S.T.board(r.board[0],r.board[1],false)));
let player=null,rivals=[],duty=null;
function newSurfers(){player=new Surfer(sim,{name:'YOU',ev:pev});player.reset(TOWER.x+6,-3,0,'foot');player.current=(x,z)=>duty?duty.current(x,z):[0,0];
 rivals=RIVALS.map((r,i)=>{const s=new Surfer(sim,{name:r.name,isAI:true,skill:save.opt.diff,ev:rev});const hx=-38+i*38,hz=sim.cfg.A[1]*9+47;s.reset(hx+(Math.random()-.5)*6,hz-4,0,'paddle');s.brain=new Brain(s,AISKILL[run?run.diff:save.opt.diff],{x:hx,z:hz},rand);s.vis=RV[i];return s;});player.vis=PV;}

/* ================= run state ================= */
let app='menu',run=null,time=0,introT=0,auto=false,camMode=save.opt.cam||0;
function newRun(diff){return{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),diff,clock:SHIFT[diff],phase:'intro',surf:0,duty:0,rep:70,rescues:0,missed:0,events:[],best:{pts:0,name:'—'},bestWave:0,wipeouts:0,tricks:0,lastT:0,endT:0,why:'',heatPlace:0,snapT:0,dolphinWave:false};}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();if(o.diff!==undefined)save.opt.diff=o.diff;persist();snd.init();snd.music=save.opt.music;
 const diff=save.opt.diff;rand=o.seed?seeded(o.seed):Math.random;
 if(duty)duty.dispose();sim=new Swell(diff,rand);sim.prime();sim.onBreak=w=>{const d=Math.hypot(w.x0-cam.position.x,w.zc-cam.position.z);snd.crash(cl(w.A*.25*(60/(d+20)),0,.6));};
 app='run';run=newRun(diff);if(o.resume)Object.assign(run,o.resume,{phase:'play'});
 newSurfers();duty=new Duty({scene,sim,mat:bodyMat,rnd:rand,diff,ev:dev,player:()=>player,world});
 spray.clear();rings.clear();toastClear();hc={};auto=!!o.auto;camSnap=true;introT=0;
 ['menu','keys','over','pause','careerCard'].forEach(id=>$(id).hidden=true);$('hud').hidden=false;document.body.classList.add('playing');
 $('diffTag').textContent=DIFFN[diff]+' SHIFT';
 if(o.resume){$('intro').hidden=true;pop('SHIFT RESUMED','ok');}else{$('intro').hidden=false;}
 setFlags();}
function toMenu(){app='menu';run=null;if(duty){duty.dispose();duty=null;}auto=true;sim=new Swell(save.opt.diff);sim.prime();newSurfers();player.reset(-6,64,0,'paddle');player.brain=new Brain(player,AISKILL[2],{x:-6,z:sim.cfg.A[1]*9+46});
 ['menu','keys','careerCard'].forEach(id=>$(id).hidden=false);['over','pause','hud'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing');menuUI();camSnap=true;toastClear();}
function pause(on){if(on&&app==='run'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');pausedUI();}else if(!on&&app==='paused'){app='run';$('pause').hidden=true;document.body.classList.add('playing');}}
function seeded(s){return()=>{s=(s*16807)%2147483647;return s/2147483647;};}
addEventListener('blur',()=>{if(app==='run'&&!navigator.webdriver)pause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&app==='run')pause(true);});

/* ================= events ================= */
let wipeMsg=0;
function pev(type,s,a){if(!run&&app!=='menu')return;const me=app==='run';
 switch(type){
  case'trick':if(!me)break;run.tricks++;trickName(a.name,a.big);snd.play('trick');if(a.spray)sprayRail(s,1);break;
  case'pop':if(me){snd.play('pop');pop('UP AND RIDING','ok');}break;
  case'launch':if(me)snd.play('pop');break;
  case'land':if(me){snd.play('land');shake=Math.max(shake,.15);}spray.splash(s.x,s.y,s.z,16,3);break;
  case'rideEnd':{if(!me)break;const b=a.bank;if(b&&b.t>0){const pts=Math.round(b.t*(duty?duty.mult:1));run.surf+=pts;comboFlash('bank',pts);snd.play('bank');if(pts>run.best.pts)run.best={pts,name:b.names.slice(-3).join(' + ')};
    run.bestWave=Math.max(run.bestWave,pts);const h=heat();if(h){(h.scores.YOU=h.scores.YOU||[]).push(pts);}if(pts>8000)snd.play('cheer',1);
    if(a.why==='kick')pop('KICK OUT','ok','+'+fmtN(pts));else if(a.why==='shore')pop('RODE IT IN','ok','+'+fmtN(pts));}
   if(s.tow&&a.why==='shore'){}break;}
  case'wipe':spray.splash(s.x,s.y+.3,s.z,50,6);if(!me)break;run.wipeouts++;snd.play('wipe');shake=.7;comboFlash('bail',a.lost);pop({lip:'CAUGHT BY THE LIP',whitewater:'BURIED IN WHITEWATER',grab:'HELD THE GRAB',flip:'OVER-ROTATED',land:'BAD LANDING',swimmer:'COLLISION!',shark:'BUMPED!'}[a.why]||'WIPEOUT','bad','MASH SPACE TO SURFACE');
   if(s.tow)duty.drop(s);break;
  case'surface':if(me)pop('BACK ON THE BOARD','ok');break;
  case'duck':if(me)snd.play('duck');spray.splash(s.x,s.y,s.z,10,2);break;
  case'whitewater':if(me){snd.play('splash',.6);if(s.tow&&a.a>1.4&&a.ab<TLIP+2){duty.drop(s);}}spray.splash(s.x,s.y,s.z,24,4);break;
  case'beach':if(me&&s.tow)duty.deliver(s);break;
  case'enterWater':if(me)snd.play('splash',.4);break;}}
function rev(type,s,a){if(type==='rideEnd'&&a.bank){const h=heat();if(h){(h.scores[s.name]=h.scores[s.name]||[]).push(Math.round(a.bank.t*(.55+run.diff*.18)));}}
 if(type==='wipe')spray.splash(s.x,s.y+.3,s.z,30,5);if(type==='trick'&&a.spray)sprayRail(s,.8);}
const heat=()=>duty&&duty.events.find(e=>e.type==='heat'&&e.phase!=='done');
function dev(type,a){if(!run)return;
 switch(type){
  case'incident':{const k={rip:'RIP CURRENT',board:'BODYBOARDER CRAMPING OUT THE BACK',float:'KID ON AN INFLATABLE DRIFTING OUT',shark:'PANICKED SWIMMER',sting:'STUNG SWIMMER',tumble:'SWIMMER ROLLED BY THE SET'}[a.vtype];alert('SWIMMER IN TROUBLE',k+' · GET TO THEM (E TO GRAB)','help');snd.play('help');snd.play('alarm');break;}
  case'grab':pop('GOT YOU!','ok','PADDLE THEM TO THE SAND');snd.play('grab');break;
  case'drop':pop('LOST YOUR GRIP','bad','GO BACK FOR THEM');break;
  case'rescue':run.duty+=a.pts;run.rescues++;repUp(8,'RESCUE');pop('RESCUE!','big','+'+fmtN(a.pts)+(a.v.surfIn?' · SURFED THEM IN':''));snd.play('rescue');break;
  case'missed':run.missed++;run.duty=Math.max(0,run.duty-600);repUp(-12,'MISSED RESCUE');pop('MISSED RESCUE','bad','YOUR PARTNER TOOK OVER · −600');snd.play('miss');break;
  case'event':{const e=a;alert(e.name,e.goal,e.type);snd.play('event');if(e.type==='shark'||e.type==='jelly')snd.play('alarm');setFlags();break;}
  case'eventEnd':{const e=a;let pts=e.ok?EVPTS[e.type]:0;if(e.type==='heat'){pts=[2500,1200,500,0][e.place-1];run.heatPlace=e.place;}if(e.type==='dolphins'&&e.waveRide)pts+=800;
   run.duty+=pts;run.events.push({type:e.type,ok:e.ok,why:e.why,pts});if(e.ok)repUp(['heat','dolphins','gull'].includes(e.type)?2:6,e.name);else if(!['heat','dolphins','gull'].includes(e.type))repUp(-6,e.name);
   pop(e.why,e.ok?'big':'bad',pts?'+'+fmtN(pts):'');snd.play(e.ok?'rescue':'miss');setFlags();break;}
  case'hitSwimmer':if(player.state==='ride'||player.state==='air'){player.wipe('swimmer');repUp(-8,'HIT A SWIMMER');}break;
  case'falseAlarm':repUp(-2,'FALSE ALARM');pop('FALSE ALARM','bad','NO HAZARD · SWIMMERS ANNOYED');break;
  case'cleared':run.duty+=60*a;pop('WATER CLEARED','ok',a+' SWIMMER'+(a>1?'S':'')+' OUT · +'+60*a);break;
  case'scare':pop('SHARK SCARE!','bad');break;case'sting':pop('SWIMMER STUNG','bad');snd.play('sting');break;case'tumble':pop('SWIMMER ROLLED','bad');break;
  case'stungMe':pop('STUNG!','bad','PADDLING SLOWED');snd.play('sting');break;case'bump':pop('FIN BUMP!','bad');snd.play('bump');shake=.5;break;
  case'kid':pop('HOLD MY HAND','ok','FIND THE SEARCHING PARENT');snd.play('grab');break;
  case'dolphinWave':pop('DOLPHIN WAVE!','big');snd.play('cheer',1);break;
  case'note':pop(a,'ok');break;}}
function repUp(d,why){run.rep=cl(run.rep+d,0,100);const el=toast($('repFeed'),`${d>0?'+':''}${d} REP · ${why}`,2600,3);el.className=d>0?'up':'down';
 if(run.rep<=0&&run.phase==='play'){run.why='RELIEVED OF DUTY';run.clock=0;run.phase='end';run.endT=0;}}
function setFlags(){const w=world,ev=duty?duty.events.filter(e=>e.phase!=='done').map(e=>e.type):[];const row=ev.includes('bigset')?4:ev.includes('shark')||ev.includes('jelly')?2:0;w.setFlag(w.towerFlag,row);for(const f of w.zoneFlags)w.setFlag(f,row===4?1:0);}

/* ================= UI helpers ================= */
const pops=$('pops');function pop(text,cls,sub){toast(pops,text+(sub?`<small>${sub}</small>`:''),2100,3,false).className='pop '+(cls||'');}
function alert(title,sub,kind){const el=toast($('alerts'),`<b>${title}</b><span>${sub}</span>`,7000,3);el.className='alert '+kind;}
function toastClear(){for(const id of['pops','alerts','repFeed'])$(id).innerHTML='';}
function trickName(n,big){const el=$('tname');el.textContent=n;el.className='';void el.offsetWidth;el.className='on'+(big?' big':'');}
let comboShow=0,comboKind='',comboPts=0;function comboFlash(k,p){comboKind=k;comboPts=p;comboShow=1.6;}
function sprayRail(s,k){spray.rail(s.x,s.y,s.z,Math.sin(s.yaw),Math.cos(s.yaw),Math.sign(s.lean||1),k);}

/* ================= input ================= */
let shake=0;
const I=controls(canvas,{canLock:()=>false,menu:()=>false,onKey:(e,first)=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(app==='run')pause(true);else if(app==='paused')pause(false);}
 if(!first)return;if(e.code==='KeyC'){camMode=(camMode+1)%2;save.opt.cam=camMode;persist();}
 if(e.code==='KeyN'){save.opt.music=!save.opt.music;snd.music=save.opt.music;persist();}
 if(e.code==='KeyM')$('radar').classList.toggle('big');}});
const {keys,edge}=I;const any=a=>a.some(k=>keys[k]);let padPrev={},whistleCd=0;
const touch={x:0,y:0,act:false,e:false,f:false,on:false};
function readPlayer(){const c=player.ctl,st=player.state;Object.assign(c,freshCtl());
 let x=(any(['KeyD','ArrowRight'])?1:0)-(any(['KeyA','ArrowLeft'])?1:0),y=(any(['KeyW','ArrowUp'])?1:0)-(any(['KeyS','ArrowDown'])?1:0);
 let act=!!keys.Space,actE=!!(edge.Space),eK=!!edge.KeyE,fK=!!edge.KeyF,grab=keys.KeyJ?'rail':keys.KeyK?'tail':keys.KeyL?'superman':null,crouch=any(['ShiftLeft','ShiftRight']),stall=!!keys.KeyQ;
 const g=gamepad();if(g){const ax=g.axes,bt=g.buttons,dz=v=>deadzone(v,.22);if(dz(ax[0]||0))x=dz(ax[0]);if(dz(ax[1]||0))y=-dz(ax[1]);if(bt[12]?.pressed)y=1;if(bt[13]?.pressed)y=-1;if(bt[14]?.pressed)x=-1;if(bt[15]?.pressed)x=1;
  const p=n=>!!bt[n]?.pressed;if(p(0)){act=true;if(!padPrev.a)actE=true;}if(p(2)&&!padPrev.x)eK=true;if(p(3)&&!padPrev.y)fK=true;if(p(1))grab='rail';if(p(4))grab='tail';if(p(5))grab='superman';if((bt[7]?.value||0)>.4)crouch=true;if((bt[6]?.value||0)>.4)stall=true;
  if(p(9)&&!padPrev.st)pause(true);padPrev={a:p(0),x:p(2),y:p(3),st:p(9)};}
 if(touch.on){if(touch.x||touch.y){x=touch.x;y=touch.y;}if(touch.act){act=true;if(!touch.actP)actE=true;}touch.actP=touch.act;if(touch.e){eK=true;touch.e=false;}if(touch.f){fK=true;touch.f=false;}}
 c.x=x;c.y=y;c.paddle=y>.3;c.pop=actE;c.duck=actE;c.jump=actE;c.mash=actE;c.grab=st==='air'?grab:null;c.crouch=crouch;c.stall=stall;c.autoPop=run&&run.diff===0;
 // screen-relative direction for riding and running
 if(x||y){const f=new V();cam.getWorldDirection(f);f.y=0;f.normalize();const r=new V(-f.z,0,f.x);const dx=f.x*y+r.x*x,dz=f.z*y+r.z*x,l=Math.hypot(dx,dz)||1;
  if(st==='ride'){c.has=true;c.dx=dx/l;c.dz=dz/l;}else if(st==='foot'){c.mx=dx/l*Math.min(1,Math.hypot(x,y));c.mz=dz/l*Math.min(1,Math.hypot(x,y));}}
 if(eK)actionE();if(fK)whistle();}
function actionE(){if(!duty||!run)return;if(player.state==='foot'&&duty.interact(player))return;if(!player.tow)duty.tryGrab(player);}
function whistle(){if(!duty||whistleCd>0)return;whistleCd=1.1;snd.play('whistle');rings.add(player.x,player.y,player.z,26,0xfff3c0);const r=duty.whistle(player.x,player.z);}

/* ================= player autopilot (also the menu attract mode) ================= */
const autoB={brain:null,wCd:0};
function autoPlayer(dt){const P=player,c=P.ctl;if(!autoB.brain||autoB.brain.S!==P)autoB.brain=new Brain(P,AISKILL[2],{x:0,z:sim.cfg.A[1]*9+44},rand);const B=autoB.brain;autoB.wCd-=dt;
 let goal=null,act=null;// duty first
 if(duty){const vs=duty.victims.filter(v=>v.state==='victim');const ch=duty.events.find(e=>e.type==='child'&&e.phase==='on');const hz=duty.events.find(e=>['shark','jelly','bigset'].includes(e.type)&&e.phase==='on');const gull=duty.events.find(e=>e.type==='gull'&&e.phase==='fly');const pod=duty.events.find(e=>e.type==='dolphins'&&e.phase==='on');
  if(P.tow)goal={x:P.x*.9,z:-2,why:'tow'};
  else if(vs.length){vs.sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z));goal={x:vs[0].x,z:vs[0].z,why:'victim'};if(Math.hypot(vs[0].x-P.x,vs[0].z-P.z)<3)act='grab';}
  else if(ch){const k=duty.kid,p=duty.parent;if(k&&p){const t=ch.follow?p:k;goal={x:t.x,z:t.z,why:'child',land:true};if(Math.hypot(t.x-P.x,t.z-P.z)<2.2&&P.state==='foot')act='interact';}}
  else if(hz){const sw=duty.people.filter(p=>p.state==='swim');if(sw.length){sw.sort((a,b)=>Math.hypot(a.x-P.x,a.z-P.z)-Math.hypot(b.x-P.x,b.z-P.z));goal={x:sw[0].x,z:sw[0].z+4,why:'clear'};if(Math.hypot(sw[0].x-P.x,sw[0].z-P.z)<18)act='whistle';}}
  else if(gull){const g=duty.gull.position;goal={x:g.x,z:g.z,why:'gull'};if(Math.hypot(g.x-P.x,g.z-P.z)<13)act='whistle';}
  else if(pod){goal={x:pod.x+pod.dir*4,z:pod.z,why:'pod'};}}
 if(!goal||(P.state==='ride'&&goal.why==='pod')){B.update(dt);if(P.state==='foot'){c.mx=0;c.mz=1;}return;}
 Object.assign(c,freshCtl());
 if(P.state==='ride'){B.maxRide=0;B.update(dt);return;}if(P.state==='air'||P.state==='wipe'){B.update(dt);return;}
 const dx=goal.x-P.x,dz=goal.z-P.z,d=Math.hypot(dx,dz);
 if(P.state==='foot'){if(goal.land||goal.z<0||goal.why==='tow'){c.mx=dx/d;c.mz=dz/d;if(d<1.2)c.mx=c.mz=0;}else{c.mx=dx/d;c.mz=Math.max(.6,dz/d);}}
 else{B.steerTo(goal.land?goal.x:goal.x,goal.land?-3:goal.z,dt);c.paddle=d>1.5;const o=sim.sample(P.x,P.z+2.5,{});if(o.w&&o.br>.5&&o.u>-o.wf*1.6&&o.u<0&&!P.tow)c.duck=true;}
 if(act==='grab'&&!P.tow)duty.tryGrab(P);if(act==='interact')duty.interact(P);if(act==='whistle'&&autoB.wCd<=0){autoB.wCd=2;whistle();}}

/* ================= simulation ================= */
function step(dt){dt=Math.min(dt,.1);time+=dt;whistleCd-=dt;const skip=edge.Space||edge.Enter;
 if(app==='paused'){I.flush();visuals(0);return;}
 if(app==='run'){const r=run;
  if(r.phase==='intro'){introT+=dt;if((skip&&introT>.3)||introT>6||auto){r.phase='play';$('intro').hidden=true;snd.play('horn');pop('SHIFT START','big',DIFFN[r.diff]+' · '+fmtT(r.clock));}}
  else if(r.phase==='play'){r.clock-=dt;const s=Math.ceil(r.clock);if(s<=10&&s>0&&s!==r.lastT){r.lastT=s;snd.play('beep',0);}if(r.clock<=0){r.clock=0;r.phase='end';r.endT=0;r.why=r.why||'END OF SHIFT';snd.play('horn');if(duty)duty.finish(rivals);}
   r.snapT-=dt;if(r.snapT<=0){r.snapT=3;snapshot();}}
  else if(r.phase==='end'){r.endT+=dt;if(r.endT>1.6){showOver();I.flush();return;}}}
 const live=app==='menu'||(app==='run'&&run.phase!=='intro');
 if(live){if(app==='run'&&run.phase==='play'){if(auto)autoPlayer(dt);else readPlayer();}else if(app==='menu'){autoPlayer(dt);}else Object.assign(player.ctl,freshCtl());
  sim.update(dt);const n=Math.ceil(dt/(1/90));for(let i=0;i<n;i++){player.step(dt/n);for(const rv of rivals){if(i===0)rv.brain.update(dt);rv.step(dt/n);}}
  if(duty&&run&&run.phase==='play'){duty.update(dt,player,rivals,run.clock);
   // in the flagged swim zone, surfing is not allowed: reputation drains while you ride there
   if((player.state==='ride'||player.state==='air')&&player.x>ZONE[0]&&player.x<ZONE[1]&&player.z<24){run.zoneT=(run.zoneT||0)+dt;if(run.zoneT>1.5){run.rep=Math.max(0,run.rep-dt*2.5);if(!hc.zw){hc.zw=1;pop('SURFING IN THE SWIM ZONE','bad','KICK OUT · REP DRAINING');}}}else{run.zoneT=0;hc.zw=0;}}
  if(player.state==='foot'&&player.tow)duty.deliver(player);}
 I.flush();visuals(dt);}
function snapshot(){if(!run||run.phase!=='play')return;const r=run;save.snap={id:r.id,diff:r.diff,clock:r.clock,surf:r.surf,duty:r.duty,rep:r.rep,rescues:r.rescues,missed:r.missed,events:r.events,best:r.best,bestWave:r.bestWave,wipeouts:r.wipeouts,tricks:r.tricks,heatPlace:r.heatPlace};persist();}

/* ================= visuals ================= */
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_e=new THREE.Euler(),UP=new V(0,1,0),_n=new V();
function poseFor(s,v,dt){const st=s.state,t=time;
 if(st==='foot')return Math.hypot(s.vx,s.vz)>.5?POSE.run(t,Math.hypot(s.vx,s.vz)):POSE.stand(t);
 if(st==='paddle'){if(s.sit)return POSE.sit(t);return POSE.paddle(s.stroke>0?s.stroke+t*.02:t*.15,s.stroke>0?1:.15);}
 if(st==='wipe')return POSE.tumble(s.wipeT);
 const c=st==='air'?.25+(s.grab?.6:0):s.crouch*.7+.2+(s.inBarrel?.35:0),arms=Math.min(1,Math.abs(s.lean));
 const P=POSE.surf(Math.min(1,c),s.lean*.6,s.lean*.5,arms,t);
 if(st==='air'&&s.grab==='rail'){P.e.shL=[-1.3,0,.25];P.e.elL=[-.1,0,0];P.e.spine=[1.0,0,0];P.rootY=.6;}
 if(st==='air'&&s.grab==='tail'){P.e.shR=[1.2,0,-.2];P.e.elR=[-.1,0,0];P.e.spine=[.8,.3,0];P.rootY=.62;}
 if(st==='air'&&s.grab==='superman'){return{rootY:.5,root:[1.35,Math.PI/2,0],e:{spine:[-.2,0,0],head:[-.7,0,0],shL:[-2.9,0,.25],shR:[-2.9,0,-.25],elL:[0,0,0],elR:[0,0,0],hipL:[.2,0,.15],hipR:[.3,0,-.15],knL:[.2,0,0],knR:[.4,0,0]}};}
 return P;}
function placeVis(s,dt){const v=s.vis,g=v.g,st=s.state;g.visible=true;
 g.position.set(s.x,s.y,s.z);
 // board: yaw, aligned to the water surface, rail lean, flips
 const [gx,gz]=st==='foot'?[0,0]:sim.grad(s.x,s.z,.35);_n.set(-gx,1,-gz).normalize();if(st==='air')_n.set(0,1,0);
 _q.setFromUnitVectors(UP,_n);_e.set(st==='air'?s.flip:0,s.yaw,0,'YXZ');_q2.setFromEuler(_e);_q.multiply(_q2);_e.set(0,0,s.roll*(st==='ride'?1:.5),'YXZ');_q.multiply(_q2.setFromEuler(_e));
 g.quaternion.slerp(_q,st==='air'?1:Math.min(1,dt*14));
 const b=v.board,rg=v.rig;
 if(st==='foot'){b.position.set(.3,1.0,.05);b.rotation.set(0,0,Math.PI/2);rg.root.position.set(0,0,0);rg.root.rotation.set(0,0,0);}
 else if(st==='wipe'){b.position.set(1.4*Math.sin(s.wipeT*3),.2-s.y+sim.height(s.x+1,s.z+1),1.2);b.rotation.set(s.wipeT*4,s.wipeT*2,0);rg.root.position.set(0,0,0);rg.root.rotation.set(0,0,0);}
 else{b.position.set(0,0,0);b.rotation.set(0,0,0);if(st==='paddle'){rg.root.position.set(0,.04,0);rg.root.rotation.set(0,0,0);}else{rg.root.position.set(0,.05,0);rg.root.rotation.set(0,-Math.PI/2,0);}}
 const want=poseFor(s,v,dt);if(!v.pose||v.st!==st){v.pose=want;v.st=st;}else{v.pose=blendPose(v.pose,want,Math.min(1,dt*12));}
 rg.apply(v.pose);}
function visuals(dt){if(!player)return;for(const s of[player,...rivals])placeVis(s,dt);
 // spray, wake, crest mist and lip explosions
 for(const s of[player,...rivals]){if(s.state==='ride'){if(Math.random()<dt*30)spray.wake(s.x-Math.sin(s.yaw)*.9,s.y,s.z-Math.cos(s.yaw)*.9);const turn=Math.abs(s.yawRate)*s.speed;if(turn>9&&Math.random()<dt*28)spray.rail(s.x,s.y,s.z,Math.sin(s.yaw),Math.cos(s.yaw),Math.sign(s.lean||1),Math.min(1,turn/30));}
  if(s.state==='paddle'&&s.stroke>0&&Math.random()<dt*5)spray.paddle(s.x+Math.cos(s.yaw)*.5*(Math.random()<.5?1:-1),s.y,s.z);}
 const lim=gfx>=1?1:.5;for(const w of sim.waves){if(!w.broke||w.zc<4)continue;for(const side of[-1,1]){const sp=(w.mode===0||w.mode===side)?w.ps:w.ps*.45,px=sim.peelX(w,side),lx=px-side*sp*TLIP;
   if(Math.abs(lx-cam.position.x)>90)continue;const o=sim.sampleWave(w,lx,w.zc,_so);if(o.a<.6)continue;if(Math.random()<dt*22*lim)spray.crash(lx+side*(Math.random()*3),o.h*.35,w.zc-o.a*1.2,o.a,side);
   if(Math.random()<dt*16*lim){const mx=px-side*Math.random()*sp*(TLIP+3);const o2=sim.sampleWave(w,mx,w.zc,_so);spray.mist(mx,o2.h,w.zc,o2.a);}
   if(Math.random()<dt*10*lim){const fx=px+side*Math.random()*8;const o3=sim.sampleWave(w,fx,w.zc,_so);if(o3.a>1)spray.mist(fx,o3.h+.1,w.zc+.2,o3.a*.6);}}}
 spray.update(dt,(x,z)=>sim.height(x,z));rings.update(dt,(x,z)=>sim.height(x,z));if(duty)duty.animate(time);world.update(time);
 cameraUpdate(dt);hud(dt);
 const roar=sim.waves.reduce((a,w)=>w.broke?a+w.A*w.fade*30/(Math.abs(w.zc-cam.position.z)+Math.abs(sim.peelX(w,1)-cam.position.x)*.2+25):a,0);
 snd.update(dt,{roar:cl(roar,0,1),speed:player.speed,carve:player.state==='ride'?cl(Math.abs(player.yawRate)*player.speed/25,0,1):0,under:player.state==='wipe'&&app==='run',paused:app==='paused'});
 const f=new V(player.x,0,player.z);sun.target.position.copy(f);sun.position.copy(f).addScaledVector(SUN,120);
 $('under').classList.toggle('on',app==='run'&&player.state==='wipe');}
const _so={};

/* ================= camera ================= */
const cpos=new V(),clook=new V();let camSnap=true,camYaw=0,orbit=0;
function cameraUpdate(dt){const s=player,st=s.state;let want=new V(),look=new V();s.barrelCam=s.inBarrel?.6:Math.max(0,(s.barrelCam||0)-dt);
 if(app==='run'&&run.phase==='intro'){const k=introT/6;const a=-1.1+k*1.4;want.set(TOWER.x+Math.sin(a)*40,9-k*4,TOWER.z+30+Math.cos(a)*30);look.set(0,1.5,40-k*20);camSnap=true;}
 else if(app==='menu'){orbit+=dt*.05;const P=new V(s.x,s.y,s.z);if(st==='ride'||st==='air'){want.set(P.x+s.dir*6,P.y+2.2,P.z-10);look.set(P.x-s.dir*3,P.y+.8,P.z+2);}else{want.set(P.x+Math.sin(orbit)*16,4.5,P.z-18);look.set(P.x,1.6,P.z+10);}}
 else if(st==='ride'||st==='air'){const P=new V(s.x,s.y,s.z),d=s.dir||1;
  if(camMode===0){if(s.inBarrel||s.barrelCam>0){// tube shot: from the opening ahead, looking back in at the rider under the lip
    const a=s.w?s.w.A:2;want.set(P.x+d*5.5,P.y+a*.12,P.z-a*.55);look.set(P.x-d*2,P.y+a*.25,P.z+a*.15);}
   else{want.set(P.x+d*5.2,Math.max(P.y+1.6,sim.height(P.x,P.z-7)+.9),P.z-8.5);look.set(P.x-d*2.2,P.y+.7,P.z+1.2);}}
  else{const hx=Math.sin(s.yaw),hz=Math.cos(s.yaw);want.set(P.x-hx*6,P.y+2.6,P.z-hz*6-C*.2);look.set(P.x+hx*4,P.y+.8,P.z+hz*4);}
  if(st==='air'){want.y+=1;look.y=s.y+.5;}}
 else if(st==='wipe'){const P=new V(s.x,sim.height(s.x,s.z),s.z);want.set(P.x+3,P.y+1.8,P.z-4.5);look.set(P.x,P.y-.4,P.z);}
 else{// chase: paddle / foot
  const hx=Math.sin(s.yaw),hz=Math.cos(s.yaw);if(st==='paddle'||Math.hypot(s.vx,s.vz)>.6)camYaw+=wrap(s.yaw-camYaw)*Math.min(1,dt*(st==='paddle'?2.2:3));
  const cx=Math.sin(camYaw),cz=Math.cos(camYaw),dist=st==='foot'?5.2:6.2,hgt=st==='foot'?2.4:2.6;want.set(s.x-cx*dist,s.y+hgt,s.z-cz*dist);look.set(s.x+cx*4,s.y+.9,s.z+cz*4);
  const gh=Math.max(groundY(want.x,want.z),sim.height(want.x,want.z));if(want.y<gh+1.2)want.y=gh+1.2;}
 if(camSnap){cpos.copy(want);clook.copy(look);camSnap=false;}else{const k=1-Math.exp(-dt*(st==='ride'||st==='air'?4.5:5)),kl=1-Math.exp(-dt*8);cpos.lerp(want,k);clook.lerp(look,kl);}
 const wh=sim.height(cpos.x,cpos.z);if(cpos.y<wh+.45)cpos.y=wh+.45;
 cam.position.copy(cpos);shake=Math.max(0,shake-dt*1.6);if(shake>0){const k=shake*shake*.3;cam.position.x+=(Math.random()-.5)*k;cam.position.y+=(Math.random()-.5)*k;}
 cam.lookAt(clook);const fv=(st==='ride'||st==='air')?58+Math.min(12,s.speed*.6)+(s.inBarrel?8:0):58;cam.fov+=(fv-cam.fov)*Math.min(1,dt*3);cam.updateProjectionMatrix();}

/* ================= HUD ================= */
let hc={};const setT=(id,v)=>{if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}};
const fmtT=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
function hud(dt){if(app!=='run'&&app!=='paused')return;const r=run,s=player,c=s.combo;
 setT('surf',fmtN(r.surf));setT('duty',fmtN(r.duty));setT('clock',fmtT(r.clock));$('clockW').classList.toggle('low',r.phase==='play'&&r.clock<=20);
 const rp=Math.round(r.rep);if(hc.rp!==rp){hc.rp=rp;$('repF').style.width=rp+'%';$('repN').textContent=rp;$('rep').className=rp<30?'low':rp<55?'mid':'';}
 setT('resc',`${r.rescues} SAVED · ${r.missed} MISSED`);
 // combo
 const el=$('combo');comboShow=Math.max(0,comboShow-dt);
 if(c.active){const txt=c.list.slice(-5).map(e=>e.name).join(' + ');if(hc.ct!==txt){hc.ct=txt;$('ctricks').textContent=(c.list.length>5?'… + ':'')+txt;}const sx=`${fmtN(c.base)}<small>×</small>${c.mult}${duty&&duty.mult>1?'<small> BIG SET ×1.5</small>':''}`;if(hc.cs!==sx){hc.cs=sx;$('cscore').innerHTML=sx;}el.className='on';hc.kind='';}
 else if(comboShow>0){if(hc.kind!==comboKind){hc.kind=comboKind;$('cscore').innerHTML=(comboKind==='bail'?'LOST ':'+')+fmtN(comboPts);$('ctricks').textContent=comboKind==='bail'?'WIPEOUT':'BANKED';hc.cs='';hc.ct='';}el.className='on '+comboKind;}
 else{el.className='';hc.kind='';}
 // context prompt
 let pr='';const st=s.state;
 if(s.canPop&&st==='paddle')pr='<kbd>SPACE</kbd> STAND UP';else if(st==='paddle'&&s.tow)pr='PADDLE TO THE SAND · RIDE THE WHITEWATER IN';
 else if(st==='paddle'&&duty&&duty.victims.some(v=>v.state==='victim'&&Math.hypot(v.x-s.x,v.z-s.z)<3.2))pr='<kbd>E</kbd> GRAB THEM ONTO THE BOARD';
 else if(st==='foot'&&duty){const e=duty.events.find(e=>e.type==='child'&&e.phase==='on');if(e&&!e.follow&&duty.kid&&Math.hypot(duty.kid.x-s.x,duty.kid.z-s.z)<2.6)pr='<kbd>E</kbd> TAKE THE KID\'S HAND';else if(e&&e.follow&&duty.parent&&Math.hypot(duty.parent.x-s.x,duty.parent.z-s.z)<3)pr='<kbd>E</kbd> REUNITE';else if(s.z<0&&s.z>-6)pr='<kbd>W</kbd> RUN INTO THE SURF';}
 else if(st==='wipe')pr='<kbd>SPACE</kbd> MASH TO SURFACE';else if(st==='paddle'&&!s.tow&&s.z>30&&!s.canPop)pr='FACE THE BEACH + <kbd>W</kbd> PADDLE AS A WAVE LIFTS YOU · <kbd>SPACE</kbd> DUCK-DIVE WHITEWATER';
 if(hc.pr!==pr){hc.pr=pr;$('prompt').innerHTML=pr;$('prompt').classList.toggle('on',!!pr);}
 // event cards
 const evs=duty?duty.events.filter(e=>e.phase!=='done'):[];const key=evs.map(e=>e.type+Math.ceil((e.dur||0)-e.t)+(e.podT|0)+(e.follow?1:0)).join();
 if(hc.ev!==key){hc.ev=key;$('events').innerHTML=evs.map(e=>{let extra='';if(e.type==='heat'){const rk=[{n:'YOU',s:best2(e.scores.YOU)},...rivals.map(rv=>({n:rv.name,s:best2(e.scores[rv.name])}))].sort((a,b)=>b.s-a.s);extra='<ol>'+rk.map(x=>`<li class="${x.n==='YOU'?'me':''}">${x.n} <b>${fmtN(x.s)}</b></li>`).join('')+'</ol>';}
   if(e.type==='dolphins')extra=`<i>WITH THE POD ${Math.min(5,e.podT).toFixed(1)} / 5s</i>`;if(e.type==='bigset'&&e.t<e.warn)extra='<i>INCOMING IN '+Math.ceil(e.warn-e.t)+'s</i>';if(e.type==='child')extra=`<i>${e.follow?'TAKE THEM TO THE PARENT':'FIND THE CRYING KID AT THE SHORELINE'}</i>`;
   return`<div class="ev ${e.type}"><b>${e.name}</b><span>${e.goal}</span>${extra}<em style="width:${cl(100-e.t/e.dur*100,0,100)}%"></em><u>${Math.max(0,Math.ceil(e.dur-e.t))}s</u></div>`;}).join('');}
 markersUI();radar();}
// off-screen and on-screen markers for victims, the kid, the parent, the fin...
const mk=$('marks');const _p=new V();
function markersUI(){if(!duty){mk.innerHTML='';return;}const L=duty.markers(),w=innerWidth,h=innerHeight;while(mk.children.length<L.length)mk.appendChild(document.createElement('div'));while(mk.children.length>L.length)mk.lastChild.remove();
 L.forEach((m,i)=>{const el=mk.children[i];_p.set(m.x,m.y,m.z).project(cam);let x=(_p.x*.5+.5)*w,y=(-_p.y*.5+.5)*h;const behind=_p.z>1;let off=behind||x<20||x>w-20||y<60||y>h-30;
  if(behind){x=w-x;y=h-30;}x=cl(x,26,w-26);y=cl(y,70,h-40);const d=Math.hypot(m.x-player.x,m.z-player.z)|0;
  const html=`<b>${m.label}</b>${m.t!==undefined?`<i>${Math.ceil(m.t)}s</i>`:''}<span>${d}m</span>`;if(el._h!==html){el._h=html;el.innerHTML=html;}el.className='mk '+m.kind+(off?' off':'')+(m.k!==undefined&&m.k<.3?' urgent':'');el.style.transform=`translate(${x|0}px,${y|0}px)`;});}
// radar: the bay from above
const rc=$('radar'),rx=rc.getContext('2d');
function radar(){const W=rc.width,H=rc.height,X=x=>(x+130)/260*W,Z=z=>H-(z+30)/150*H;rx.clearRect(0,0,W,H);
 rx.fillStyle='rgba(16,58,82,.82)';rx.fillRect(0,0,W,Z(0));rx.fillStyle='rgba(214,190,140,.85)';rx.fillRect(0,Z(0),W,H-Z(0));
 // rip channel
 if(duty){rx.fillStyle='rgba(6,24,40,.6)';rx.fillRect(X(duty.rip.x-duty.rip.w),Z(70),X(duty.rip.x+duty.rip.w)-X(duty.rip.x-duty.rip.w),Z(0)-Z(70));}
 // wave crests, whitewater where broken
 for(const w of sim.waves){if(w.zc>118)continue;rx.lineWidth=Math.max(1,w.A*.9);rx.strokeStyle='rgba(120,210,220,.65)';rx.beginPath();rx.moveTo(X(w.x0-130),Z(w.zc));rx.lineTo(X(w.x0+130),Z(w.zc));rx.stroke();
  if(w.broke){rx.strokeStyle='#fff';rx.beginPath();rx.moveTo(X(sim.peelX(w,-1)),Z(w.zc));rx.lineTo(X(sim.peelX(w,1)),Z(w.zc));rx.stroke();}}
 rx.fillStyle='#ffd21f';for(const x of ZONE)rx.fillRect(X(x)-1.5,Z(0)-1,3,7);rx.fillStyle='#d8261c';rx.fillRect(X(TOWER.x)-4,Z(TOWER.z)-4,8,8);
 const dot=(x,z,r,c)=>{rx.fillStyle=c;rx.beginPath();rx.arc(X(x),Z(z),r,0,7);rx.fill();};
 if(duty){for(const p of duty.people)if(duty.inWater(p))dot(p.x,p.z,1.8,'#f2f2f2');
  for(const e of duty.events){if(e.phase==='done')continue;if(e.type==='shark'){rx.fillStyle='#ff5a3c';rx.beginPath();rx.moveTo(X(e.x),Z(e.z)-6);rx.lineTo(X(e.x)-4,Z(e.z)+3);rx.lineTo(X(e.x)+4,Z(e.z)+3);rx.fill();}
   if(e.type==='jelly'){rx.fillStyle='rgba(215,140,255,.55)';rx.beginPath();rx.arc(X(e.x),Z(e.z),11/260*W,0,7);rx.fill();}if(e.type==='dolphins')dot(e.x,e.z,3.5,'#9fb3c8');if(e.type==='gull')dot(duty.gull.position.x,duty.gull.position.z,3,'#fff6c0');
   if(e.type==='child'){if(duty.kid)dot(duty.kid.x,duty.kid.z,3,'#ffba08');if(duty.parent&&e.follow)dot(duty.parent.x,duty.parent.z,3.5,'#5dff9a');}}
  const pulse=3+Math.sin(time*8)*1.5;for(const v of duty.victims)if(v.state==='victim'){rx.strokeStyle='#ff3f5a';rx.lineWidth=2;rx.beginPath();rx.arc(X(v.x),Z(v.z),pulse+2,0,7);rx.stroke();dot(v.x,v.z,2.5,'#ff3f5a');}}
 for(const rv of rivals)dot(rv.x,rv.z,2.2,'#3dd6ff');
 rx.save();rx.translate(X(player.x),Z(player.z));rx.rotate(player.yaw);rx.fillStyle='#ffd21f';rx.beginPath();rx.moveTo(0,-6);rx.lineTo(4,4);rx.lineTo(-4,4);rx.fill();rx.restore();}

/* ================= results ================= */
let lastAward=null;
function showOver(){app='over';$('hud').hidden=true;document.body.classList.remove('playing');const r=run;const total=r.surf+r.duty,T=STARS[r.diff];
 let stars=total>=T[2]?3:total>=T[1]?2:total>=T[0]?1:0;if(r.missed>0||r.rep<60)stars=Math.min(stars,2);if(r.rep<35)stars=Math.min(stars,1);if(r.why==='RELIEVED OF DUTY')stars=0;
 const already=save.awarded.includes(r.id);let tok=0;
 if(!already){save.awarded.push(r.id);save.awarded=save.awarded.slice(-20);save.snap=null;tok=5+Math.min(60,total/1500|0)+stars*5;save.career.shifts++;save.career.rescues+=r.rescues;if(total>save.career.best)save.career.best=total;if(r.best.pts>0&&(!save.career.bestTrickPts||r.best.pts>save.career.bestTrickPts)){save.career.bestTrick=r.best.name;save.career.bestTrickPts=r.best.pts;}persist();addRound(tok,stars>=2);saveBest(ID,total);}
 lastAward={total,stars,r};
 $('oeye').textContent=`${r.why||'END OF SHIFT'} · ${DIFFN[r.diff]}`;$('ores').textContent=r.why==='RELIEVED OF DUTY'?'RELIEVED OF DUTY':stars===3?'LEGEND OF THE BAY':stars===2?'SOLID SHIFT':stars===1?'SHIFT COMPLETE':'ROUGH SHIFT';
 $('ostars').innerHTML=[0,1,2].map(i=>`<i class="${i<stars?'on':''}">★</i>`).join('')+`<span>${stars} / 3 STARS</span>`;$('ofs').textContent=fmtN(total);
 const evl=r.events.map(e=>`<li class="${e.ok?'done':''}">${EVENTS[e.type].name} — ${e.why}${e.pts?' · +'+fmtN(e.pts):''}</li>`).join('')||'<li>No beach events this shift</li>';
 $('stats').innerHTML=[['Surf score',fmtN(r.surf)],['Duty score',fmtN(r.duty)],['Rescues made',r.rescues],['Rescues missed',r.missed],['Events handled',`${r.events.filter(e=>e.ok).length} / ${r.events.length}`],['Best trick',r.best.pts?`${r.best.name} · ${fmtN(r.best.pts)}`:'—'],['Best wave',fmtN(r.bestWave)],['Reputation',Math.round(r.rep)],['Wipeouts',r.wipeouts],['Heat',r.heatPlace?['WON','2ND','3RD','4TH'][r.heatPlace-1]:'—']].map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join('');
 $('oEvents').innerHTML=evl;$('otok').textContent=(already?'ALREADY AWARDED':`+${tok} TOKENS`)+` · BEST ${fmtN(bestScore(ID))}`;$('over').hidden=false;}

/* ================= rendering ================= */
const POST={exposure:.78,bloom:.36,bloomThreshold:.9,bloomRadius:.5,vignette:.28,saturation:1.1,grain:.018};
let fx=null;
function applyQuality(q){gfx=q;R.shadowMap.enabled=q>0;sun.castShadow=q>0;ocean.setQuality(q);world.sandMat.userData.wetR=q>=1?.07:.55;world.sandMat.needsUpdate=true;
 const ms=q>=2?2048:1024;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}scene.traverse(o=>{if(o.isMesh&&o.material&&!o.material.isShaderMaterial)o.material.needsUpdate=true;});fx=null;}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);fx=null;}
 cam.aspect=w/h;cam.updateProjectionMatrix();spray.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 ocean.update(sim,cam,new V(cam.position.x,0,cam.position.z).addScaledVector(cam.getWorldDirection(new V()).setY(0).normalize(),14),time);
 if(!fx){fx=cinematic(R,scene,cam,{...POST,quality:gfx,ao:false});fx.setSize(w,h);}fx.render();}

/* ================= menu ================= */
function menuUI(){const o=save.opt;$('o-diff').querySelectorAll('button').forEach(b=>{b.classList.toggle('on',+b.dataset.v===o.diff);b.onclick=()=>{o.diff=+b.dataset.v;persist();menuUI();};});
 $('shiftLen').textContent=`${fmtT(SHIFT[o.diff])} SHIFT · ${['1–1.5 m waves, slow CPU surfers, few incidents','1.5–2 m waves, steady incidents','2.5–3 m bombs, sharp rivals, busy beach'][o.diff]}`;
 const sn=save.snap;$('resume').hidden=!sn;if(sn)$('resume').textContent=`RESUME ${DIFFN[sn.diff]} SHIFT · ${fmtT(sn.clock)} LEFT`;
 const c=save.career;$('career').innerHTML=`<tr><td>Shifts worked</td><td>${c.shifts}</td></tr><tr><td>Lives saved</td><td>${c.rescues}</td></tr><tr><td>Best shift</td><td>${fmtN(Math.max(c.best,bestScore(ID)))}</td></tr><tr><td>Best trick</td><td>${c.bestTrick||'—'}</td></tr>`;}
function pausedUI(){const r=run;$('pInfo').innerHTML=`SURF ${fmtN(r.surf)} · DUTY ${fmtN(r.duty)} · REP ${Math.round(r.rep)} · ${fmtT(r.clock)} LEFT`;}
$('go').onclick=()=>{save.snap=null;persist();start();};$('resume').onclick=()=>{const sn=save.snap;if(!sn)return;start({diff:sn.diff,resume:sn});};
$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resumeB').onclick=()=>pause(false);$('quit').onclick=()=>{snapshot();toMenu();};$('restart').onclick=()=>{save.snap=null;persist();start();};
postButton($('post'),ID,()=>{const a=lastAward||{r:{}};const r=a.r;return[a.total||0,`Game: Swell Guard\nPoints: ${a.total||0}\nShift: ${DIFFN[r.diff]||''}\nSurf: ${r.surf||0} · Duty: ${r.duty||0}\nRescues: ${r.rescues||0} (missed ${r.missed||0})\nBest trick: ${r.best?r.best.name:''}\nStars: ${a.stars||0}/3`];});
// touch: left half drags a stick, three buttons on the right
if(matchMedia('(pointer:coarse)').matches){document.body.classList.add('touch');touch.on=true;const pad=$('tpad');let id=null,ox=0,oy=0;
 pad.addEventListener('pointerdown',e=>{id=e.pointerId;ox=e.clientX;oy=e.clientY;pad.setPointerCapture(id);});pad.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;touch.x=cl((e.clientX-ox)/50,-1,1);touch.y=cl(-(e.clientY-oy)/50,-1,1);});
 const up=()=>{id=null;touch.x=touch.y=0;};pad.addEventListener('pointerup',up);pad.addEventListener('pointercancel',up);
 $('tAct').addEventListener('pointerdown',()=>touch.act=true);$('tAct').addEventListener('pointerup',()=>touch.act=false);$('tE').addEventListener('pointerdown',()=>touch.e=true);$('tF').addEventListener('pointerdown',()=>touch.f=true);}

/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hook ================= */
window.SWELL={step,render,start,toMenu,pause,
 get state(){return app==='run'?run.phase:app;},get app(){return app;},get score(){return run?Math.round(run.surf+run.duty):lastAward?lastAward.total:0;},
 get run(){return run;},get player(){return player;},get rivals(){return rivals;},get duty(){return duty;},get sim(){return sim;},get save(){return save;},get last(){return lastAward;},
 autopilot(on=true){auto=on;},setClock(s){if(run){run.clock=s;if(run.phase==='intro'){run.phase='play';$('intro').hidden=true;}}},endShift(){if(run){run.clock=0;run.phase='end';run.endT=0;}},
 skipIntro(){if(run&&run.phase==='intro'){run.phase='play';$('intro').hidden=true;}},
 teleport(x,z,state='paddle',yaw=0){player.reset(x,z,yaw,state);camSnap=true;},
 grab(){return duty?duty.tryGrab(player):null;},whistle,interact(){return duty?duty.interact(player):false;},
 incident(t){return duty?duty.incident(t):null;},event(t){return duty?duty.startEvent(t):null;},setRep(v){if(run)run.rep=v;},
 rideWave(){// drop the player onto the nearest breaking face (test helper)
  const w=sim.waves.filter(w=>w.broke&&w.zc>20).sort((a,b)=>b.A-a.A)[0];if(!w)return false;const d=w.mode||1,px=sim.peelX(w,d);player.reset(px+d*4,w.zc-w.A*.6,0,'paddle');const s=sim.sampleWave(w,player.x,player.z,{});player.popUp(s);camSnap=true;return true;},
 resetSave(){save=defSave();persist();menuUI();},setQuality:applyQuality,get gfx(){return gfx;},R,scene,cam,keys,
 get camInfo(){return{p:cam.position.toArray().map(v=>+v.toFixed(1)),l:clook.toArray().map(v=>+v.toFixed(1))};},setCam(m){camMode=m;}};
