// TIDEWAY COURIER — a delivery kart race for Pixel Arcade (original game).
// One harbor loop of little islands joined by bridges: three laps, ordered checkpoint gates, a parcel to pick up at the
// Breakwater Depot and drop at the Post House bay every lap, hop-drift boosts in three tiers, a start boost, three CPU
// rival couriers (EASY/NORMAL/HARD), a personal-best ghost lap, a race clock, mid-race save/resume and a results report.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,deadzone,playerPad} from '../js/kit3d/input.js';
import {postButton,stored,pickers} from '../js/kit3d/ui.js';
import {buildTrack,query,at,yawAt,ds,onPad} from './track.js';
import {buildWorld,SKY} from './world.js';
import {newRacer,makeKart,ghostify,poseKart,place,stepRacer,collide,think,DIFF,COURIERS,DRIFT_LV,TOP} from './kart.js';
import {Sound} from './sound.js';
import {V,cl,lerp,wrapA,Particles,fmtT,fmtClock,ORD} from './util.js';

const $=id=>document.getElementById(id);
const ID='tidewaycourier',DT=1/60,LAPS=3,COUNT=3.2,FINISH_HOLD=3.2;
const K_REC='pxd_tidewaycourier_rec',K_RUN='pxd_tidewaycourier_run',K_GHOST='pxd_tidewaycourier_ghost';
const TIER_PTS=[0,50,100,175],PLACE_PTS=[1500,1000,600,300],DELIVERY_PTS=500,DELIVERY_SECS=4;

/* ================= renderer + world ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(SKY.fog,SKY.fogD);
const cam=new THREE.PerspectiveCamera(62,1,.3,6000);
const T=buildTrack(),W=buildWorld(T);scene.add(W.grp);
{const pm=new THREE.PMREMGenerator(R),c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,'#4fa8ef');g.addColorStop(.48,'#d6f0ff');g.addColorStop(.52,'#7cc0c8');g.addColorStop(1,'#3a6a70');x.fillStyle=g;x.fillRect(0,0,256,128);
 const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;scene.environment=pm.fromEquirectangular(t).texture;scene.environmentIntensity=.45;t.dispose();}
const fxA=new Particles(scene,1600,true),fxS=new Particles(scene,1400,false);
const snd=new Sound();
const SPARK=[[0xffffff],[0x4ab8ff,0xbfe6ff],[0xff9a2a,0xffd070],[0xff5ad8,0xffb0f0]].map(a=>a.map(c=>new THREE.Color(c)));

/* ================= state ================= */
const opt={diff:1};const saveOpt=stored('pxd_tidewaycourier_opt',opt);opt.diff=cl(opt.diff|0,0,2);
function loadJ(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v&&typeof v==='object'?v:d;}catch(e){return d;}}
function saveJ(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
let rec=Object.assign({best:0,bestLap:0,deliveries:0,races:0,done:[]},loadJ(K_REC,{}));if(!Array.isArray(rec.done))rec.done=[];
let ghostRec=loadJ(K_GHOST,null);if(ghostRec&&!(Array.isArray(ghostRec.f)&&ghostRec.f.length>10&&ghostRec.t>0))ghostRec=null;

const racers=COURIERS.map((d,k)=>{const r=newRacer(d,{human:k===0});r.g=makeKart(d);scene.add(r.g);return r;});
const P=racers[0];
const ghostG=ghostify(makeKart(COURIERS[0]));ghostG.visible=false;scene.add(ghostG);
let app='menu',phase='count',raceT=0,clock=0,limit=0,cdT=0,acc=0,doneT=0,diff=DIFF[1],rid='',delivered=[],tiers=[0,0,0,0],result=null,gfx=quality();
let autoDrift=0,gasAt=-1,startRes='',stallT=0,frames=[],lapStart=0,lastSec=0,autopilot=false,override=null,menuT=0,msgT=0,camInit=false,lastGateFlash=null,gateFlashT=0,padHintT=0,saveT=0;

/* ================= input ================= */
const IN=controls(canvas,{canLock:()=>false,menu:()=>false,onKey:(e,first)=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&app!=='menu')e.preventDefault();
 if(!first)return;snd.init();
 if(e.code==='Escape'||e.code==='KeyP'){if(app==='race')pause(true);else if(app==='paused')pause(false);}
 if(e.code==='KeyM'){const on=snd.toggleMusic();tip('MUSIC · '+(on?'ON':'OFF'));if(on&&app==='race')snd.startMusic();}
 if(e.code==='KeyR'&&app==='race')resetToGate();
 if((e.code==='Enter'||e.code==='Space')&&app==='results'&&!$('over').hidden){e.preventDefault();$('again').click();}}});
const {keys}=IN;const any=a=>a.some(k=>keys[k]);
const touch={left:0,right:0,gas:0,brake:0,drift:0};
let padPrev={start:false,reset:false};
function readPad(){const g=playerPad(0,1);if(!g)return null;const b=k=>!!(g.buttons[k]&&(g.buttons[k].pressed||g.buttons[k].value>.3));
 return{gas:b(0)||b(7),brake:b(1)||b(6),drift:b(2)||b(5)||b(4),x:deadzone(g.axes[0]||0,.15),start:b(9),reset:b(3)||b(8)};}
function padButtons(){const gp=readPad();if(!gp)return;if(gp.start&&!padPrev.start){if(app==='race')pause(true);else if(app==='paused')pause(false);}if(gp.reset&&!padPrev.reset&&app==='race')resetToGate();padPrev={start:gp.start,reset:gp.reset};}
function readInput(){const I=P.inp,gp=readPad();
 if(override){Object.assign(I,{gas:0,brake:0,steer:0,drift:false},override);return;}
 let gas=any(['KeyW','ArrowUp'])||touch.gas?1:0,br=any(['KeyS','ArrowDown'])||touch.brake?1:0,st=(any(['KeyA','ArrowLeft'])||touch.left?1:0)-(any(['KeyD','ArrowRight'])||touch.right?1:0),dr=any(['Space','ShiftLeft','ShiftRight'])||!!touch.drift;
 if(gp){if(gp.gas)gas=1;if(gp.brake)br=1;if(gp.x)st=-gp.x;if(gp.drift)dr=true;}
 I.gas=gas;I.brake=br;I.steer=cl(st,-1,1);I.drift=dr;}
// touch buttons (shown on touch screens, or after the first touch)
function showTouch(){document.body.classList.add('touch');$('touch').hidden=!(app==='race'||app==='paused');}
if(matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch');
addEventListener('touchstart',()=>{if(!document.body.classList.contains('touch'))showTouch();},{passive:true});
document.querySelectorAll('#touch button[data-k]').forEach(b=>{const k=b.dataset.k,set=v=>{touch[k]=v;b.classList.toggle('on',!!v);};
 b.addEventListener('pointerdown',e=>{e.preventDefault();snd.init();try{b.setPointerCapture(e.pointerId);}catch(_){}set(1);});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>set(0)));});
$('tpause').onclick=()=>{if(app==='race')pause(true);};$('treset').onclick=()=>{if(app==='race')resetToGate();};
let tipT=0;function tip(s){const el=$('tip');el.textContent=s;el.style.opacity=1;clearTimeout(tipT);tipT=setTimeout(()=>el.style.opacity=0,1400);}

/* ================= race events ================= */
const env={frozen:false,cols:W.cols,
 hop:r=>{if(r===P)snd.play('hop');},
 driftLv:(r,lv)=>{if(r===P){snd.play('lv',lv);}},
 boost:(r,lv)=>{if(r===P){tiers[lv]++;snd.play('boost',lv);flash('BOOST '+['','I','II','III'][lv]+'!','+'+TIER_PTS[lv]+' PTS',.9);}},
 driftCancel:r=>{if(r===P&&r.drift.lvl>0)snd.play('cancel');},
 wall:(r,vn)=>{if(r===P){snd.play('wall',vn);shake=Math.min(.6,vn*.04);}const p=r.p;fxA.burst({x:p.x,y:p.y+.6,z:p.z},Math.min(14,4+vn|0),6,SPARK[2],.35,.35,{grav:14,up:true});},
 land:(r,imp)=>{if(r===P&&imp>5)shake=Math.min(.4,imp*.03);},
 splash:r=>{if(r===P){snd.play('splash');flash('SPLASH!','BACK TO GATE '+(r.lastCp||'START'),1.3);}for(let k=0;k<26;k++)fxS.emit(r.p.x+(Math.random()-.5)*2,.2,r.p.z+(Math.random()-.5)*2,(Math.random()-.5)*6,4+Math.random()*7,(Math.random()-.5)*6,.92,.97,1,1.4+Math.random(),1.2,12,.6,1.4);},
 respawn:r=>{if(r===P){snd.play('respawn');camInit=false;}},
 bump:(a,b)=>{if(a===P||b===P)snd.play('bump');},
 cp:(r,k)=>{if(r===P){snd.play('cp');const g=W.gates.find(g=>g.cp.k===k);if(g){lastGateFlash=g;gateFlashT=.8;}saveRun();}},
 lap:r=>{const t=raceT-(r===P?lapStart:r.lapStart);if(r===P)onPlayerLap(t);else{r.lapTimes.push(t);r.lapStart=raceT;if(r.lap>=LAPS&&!r.fin)r.fin=raceT;}},
 unlap:r=>{if(r===P)flash('WRONG WAY','THAT LAP DOES NOT COUNT',1);},
 pads:r=>{if(r!==P||phase!=='go')return;
  if(!r.parcel&&onPad(T,T.pick,r.q)){if(delivered[r.lap]){if(padHintT<=0){flash('DELIVERED THIS LAP','NEXT PARCEL AFTER THE LINE',1);snd.play('nope');padHintT=2;}}else{r.parcel=true;snd.play('pick');flash('PARCEL ON BOARD','DROP IT AT THE POST HOUSE BAY',1.2);sparkle(r.p,0xffd04a);saveRun();}}
  else if(r.parcel&&onPad(T,T.drop,r.q)){r.parcel=false;r.deliveries++;delivered[r.lap]=1;clock+=DELIVERY_SECS;r.zipT=Math.max(r.zipT,.8);r.zipPow=Math.max(r.zipPow,1.25);snd.play('drop');flash('DELIVERED!','+'+DELIVERY_PTS+' PTS · +'+DELIVERY_SECS+' S ON THE CLOCK',1.4);sparkle(r.p,0x46e0b0,40);saveRun();}}};
let shake=0;
function sparkle(p,c,n=24){const C=new THREE.Color(c);fxA.burst({x:p.x,y:p.y+1.2,z:p.z},n,8,[C,new THREE.Color(0xffffff),new THREE.Color(0xff6a4d)],.6,.9,{grav:6,up:true,drag:1.5});}
function flash(a,b='',t=1){const m=$('msg');m.innerHTML=a+(b?'<small>'+b+'</small>':'');m.classList.add('on');msgT=t;}
function onPlayerLap(t){P.lapTimes.push(t);lapStart=raceT;
 const newBest=!P.bestLap||t<P.bestLap;if(newBest)P.bestLap=t;
 if(frames&&frames.length>10&&(!ghostRec||t<ghostRec.t)){ghostRec={t:Math.round(t*100)/100,f:frames};saveJ(K_GHOST,ghostRec);}
 frames=[];if(!rec.bestLap||t<rec.bestLap){rec.bestLap=t;saveJ(K_REC,rec);}
 if(P.lap>=LAPS){P.fin=raceT;phase='done';doneT=FINISH_HOLD;P.parcel=false;snd.play('win');const place=1+racers.filter(r=>r!==P&&r.fin&&r.fin<P.fin).length;flash(ORD(place).toUpperCase()+'!','FINISHED · '+fmtT(raceT),2.5);autopilot=true;saveJ(K_RUN,null);return;}
 if(P.lap===LAPS-1){snd.play('final');flash('FINAL LAP',newBest?'LAP '+fmtT(t)+' · NEW BEST':'LAP '+fmtT(t),1.4);}else{snd.play('lap');flash('LAP '+(P.lap+1)+' / '+LAPS,newBest?'LAP '+fmtT(t)+' · NEW BEST':'LAP '+fmtT(t),1.4);}
 saveRun();}
function resetToGate(){if(phase!=='go'||P.fallT>0)return;P.fallT=.6;P.fallen=false;P.drift.on=false;P.resets=(P.resets||0)+1;flash('BACK TO GATE '+(P.lastCp||'START'),'',.8);}

/* ================= race setup ================= */
function gridSlot(k){return{i:T.B.n-4-k*3.5,u:(k%2?-3:3)};}
function resetRacer(r,k){const keep={g:r.g,d:r.d,human:r.human};Object.assign(r,newRacer(r.d,{human:r.human}),keep);const s=gridSlot(k);place(T,r,s.i,s.u);r.lap=0;r.next=1;r.lastCp=0;
 if(!r.human){r.topMul=diff.top;r.accMul=.9+diff.top*.1;r.ai.lane=(k-1.5)*.25;}r.lapStart=0;}
function newRid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function startRace(o={}){snd.init();diff=DIFF[o.diff??opt.diff];limit=diff.limit;const sv=o.resume||null;
 const order=[1,2,3,0];racers.forEach(r=>resetRacer(r,order.indexOf(racers.indexOf(r))));
 rid=sv?sv.rid:newRid();raceT=0;clock=limit;delivered=[];tiers=[0,0,0,0];result=null;frames=[];lapStart=0;lastSec=0;autopilot=false;override=null;stallT=0;gasAt=-1;startRes='';doneT=0;padHintT=0;
 fxA.clear();fxS.clear();
 if(sv){// restore the saved run at the player's last gate; rewards already earned stay earned, never doubled
  raceT=sv.raceT;clock=sv.clock;delivered=sv.delivered||[];frames=null;// a resumed lap is not recorded as a ghost (its start is not in this session)
  tiers=sv.tiers||[0,0,0,0];lapStart=sv.lapStart||0;
  const rs=[P,...racers.slice(1)];sv.racers.forEach((s,k)=>{const r=rs[k];if(!r)return;Object.assign(r,{lap:s.lap,next:s.next,lastCp:s.lastCp,lapTimes:s.lapTimes||[],bestLap:s.bestLap||0,lapStart:s.lapStart||0,fin:s.fin||0});
   const cp=T.cps[r.lastCp];place(T,r,cp.i+2+(k?-2-k*2:0),k?(k%2?-3:3):T.B.line[cp.i]*.5);r.lap=s.lap;r.next=s.next;r.lastCp=s.lastCp;});
  Object.assign(P,{parcel:!!sv.p.parcel,deliveries:sv.p.deliveries|0,boosts:sv.p.boosts|0,falls:sv.p.falls|0,walls:sv.p.walls|0,resets:sv.p.resets|0});}
 app='race';phase='count';cdT=COUNT;env.frozen=true;camInit=false;menuT=0;
 $('menu').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;$('touch').hidden=!document.body.classList.contains('touch');document.body.classList.add('racing');
 $('startm').hidden=false;$('msg').classList.remove('on');if(sv)flash('RACE RESUMED','GATE '+(P.lastCp||'START')+' · LAP '+(P.lap+1),2);
 snd.resume();if(snd.music)snd.startMusic();saveRun();}
function saveRun(){if(app!=='race'&&app!=='paused')return;if(phase==='done'||P.fin)return;
 saveJ(K_RUN,{v:1,rid,diff:DIFF.indexOf(diff),raceT:Math.round(raceT*100)/100,clock:Math.round(clock*100)/100,lapStart,delivered,tiers,
  p:{parcel:P.parcel,deliveries:P.deliveries,boosts:P.boosts,falls:P.falls,walls:P.walls,resets:P.resets||0},
  racers:racers.map(r=>({lap:r.lap,next:r.next,lastCp:r.lastCp,lapTimes:r.lapTimes,bestLap:r.bestLap,lapStart:r.lapStart,fin:r.fin}))});}
function savedRun(){const s=loadJ(K_RUN,null);if(!s||s.v!==1||!s.rid||rec.done.includes(s.rid)||!Array.isArray(s.racers)||s.racers.length!==4||!s.p)return null;return s;}

/* ================= simulation ================= */
function ranks(){const list=racers.slice().sort((a,b)=>(a.fin&&b.fin)?a.fin-b.fin:a.fin?-1:b.fin?1:b.prog-a.prog);list.forEach((r,k)=>r.place=k+1);}
function tick(dt){
 if(app==='menu'){attract(dt);return;}
 if(app!=='race')return;
 readInput();
 if(phase==='count'){cdT-=dt;const g=P.inp.gas>0;if(g&&gasAt<0)gasAt=cdT;if(!g)gasAt=-1;
  const sec=Math.ceil(cdT);if(sec!==lastSec&&sec>0&&sec<=3){lastSec=sec;snd.play('beep');}
  if(cdT<=0){phase='go';env.frozen=false;snd.play('go');$('startm').hidden=true;
   if(g&&gasAt<=1.0){P.zipT=1.3;P.zipPow=1.35;startRes='PERFECT';snd.play('perfect');flash('PERFECT START!','BOOST',1);}
   else if(g&&gasAt>1.8){stallT=.9;startRes='EARLY';snd.play('stall');flash('TOO EARLY','ENGINE BOGGED',1);}
   else startRes=g?'GOOD':'LATE';
   for(const r of racers)if(!r.human&&Math.random()<[.2,.45,.75][DIFF.indexOf(diff)]){r.zipT=1;r.zipPow=1.3;}}
  for(const r of racers){if(!r.human)think(T,r,dt,diff,P);stepRacer(T,r,dt,env);}return;}
 raceT+=dt;padHintT=Math.max(0,padHintT-dt);
 if(phase==='go'){clock-=dt;if(clock<=10&&Math.ceil(clock)!==Math.ceil(clock+dt))snd.play('warn');if(clock<=0){clock=0;endRace(true);return;}}
 if(stallT>0){stallT-=dt;P.inp.gas=0;}
 if(autopilot||phase==='done'){P.topMul=phase==='done'?.8:1;// test/finish autopilot: steer onto the parcel pads when one is due
  const pad=P.parcel?T.drop:!delivered[P.lap]?T.pick:null;P.ai.forceU=null;if(pad&&phase==='go'){let d=ds(T,P.q.s,T.B.s[pad.i]);if(d>-pad.len*T.B.step&&d<90)P.ai.forceU=pad.side*(pad.u0+T.B.w[pad.i])/2;}
  think(T,P,dt,{...DIFF[1],drift:autoDrift},null);}
 for(const r of racers){if(!r.human)think(T,r,dt,diff,P);stepRacer(T,r,dt,env);}
 collide(racers,env);ranks();
 // ghost: record the player's lap at 10 Hz
 if(phase==='go'&&frames){const k=Math.floor((raceT-lapStart)*10);if(k>=frames.length&&k<1200)frames.push([+P.p.x.toFixed(2),+P.p.y.toFixed(2),+P.p.z.toFixed(2),+P.yaw.toFixed(3)]);}
 if(phase==='done'){doneT-=dt;if(doneT<=0)endRace(false);}
 saveT+=dt;if(saveT>5){saveT=0;saveRun();}}
function attract(dt){menuT+=dt;for(const r of racers){think(T,r,dt,DIFF[1],null);if(r.human)r.topMul=.95;stepRacer(T,r,dt,{...env,pads:null,boost:null,wall:null,splash:null,respawn:null,cp:null,lap:null,hop:null,driftLv:null,bump:null});}collide(racers,{});}

function endRace(timeUp){if(app!=='race')return;ranks();const fin=!!P.fin&&!timeUp;
 // CPU couriers still out on the course get a projected time from their remaining distance
 for(const r of racers)if(!r.fin&&r!==P&&fin){const left=(LAPS*T.cps.length-r.prog)*T.B.len/T.cps.length;r.fin=raceT+Math.max(.5,left/Math.max(12,TOP*(r.topMul||.9)*.8));}
 ranks();const place=fin?1+racers.filter(r=>r!==P&&r.fin&&r.fin<P.fin).length:P.place;
 const drift=tiers.reduce((s,n,k)=>s+n*TIER_PTS[k],0),del=P.deliveries*DELIVERY_PTS,pb=fin?PLACE_PTS[place-1]:0,tb=fin?Math.round(clock)*10:0,pts=del+drift+pb+tb;
 const won=fin&&place===1;let tok=0,fresh=!rec.done.includes(rid);
 if(fresh){tok=5+Math.min(60,pts/100|0);addRound(tok,won);saveBest(ID,pts);rec.done=[...rec.done.slice(-30),rid];rec.races++;rec.deliveries+=P.deliveries;if(pts>rec.best)rec.best=pts;saveJ(K_REC,rec);}
 saveJ(K_RUN,null);
 result={fin,timeUp:!fin,place,time:fin?P.fin:raceT,best:P.bestLap,laps:P.lap,deliveries:P.deliveries,boosts:tiers.slice(),drift,del,pb,tb,pts,tok,won,fresh,diff:diff.n,start:startRes,falls:P.falls,walls:P.walls};
 app='results';snd.stop();snd.play(won?'win':fin?'lap':'lose');showResults();}
function showResults(){const r=result;$('hud').hidden=true;$('touch').hidden=true;$('over').hidden=false;document.body.classList.remove('racing');
 $('oeye').textContent='DELIVERY REPORT · '+r.diff+' RIVALS';
 $('ores').textContent=r.timeUp?'TIME UP · '+ORD(r.place).toUpperCase()+' ON THE ROAD':r.won?'1ST PLACE!':ORD(r.place).toUpperCase()+' PLACE';
 const row=(a,b,c='')=>`<tr class="${c}"><td>${a}</td><td>${b}</td></tr>`;
 $('otab').innerHTML='<table>'+row('RACE','','h')+row('POSITION',r.timeUp?ORD(r.place)+' (did not finish)':ORD(r.place)+' of 4')+row('TOTAL TIME',fmtT(r.time)+(r.timeUp?' · laps '+r.laps+'/'+LAPS:''))+row('BEST LAP',r.best?fmtT(r.best):'—')
  +row('DELIVERIES',r.deliveries+' / '+LAPS)+row('DRIFT BOOSTS',(r.boosts[1]+r.boosts[2]+r.boosts[3])+' (I×'+r.boosts[1]+' II×'+r.boosts[2]+' III×'+r.boosts[3]+')')+row('START',r.start||'—')
  +'</table><table>'+row('SCORE','','h')+row('Deliveries',r.del)+row('Drift boosts',r.drift)+row('Finish position',r.pb)+row('Time left bonus',r.tb)+row('TOTAL',r.pts,'tot')+'</table>';
 $('otok').textContent=(r.fresh?'+'+r.tok+' TOKENS':'Already counted')+' · BEST '+Math.max(bestScore(ID),rec.best)+(rec.bestLap?' · BEST LAP '+fmtT(rec.bestLap):'');
 setTimeout(()=>{try{$('again').focus();}catch(e){}},50);}

/* ================= pause / menu ================= */
function pause(on){if(on&&app==='race'){app='paused';saveRun();$('pause').hidden=false;$('touch').hidden=true;snd.suspend();$('pinfo').textContent=phase==='done'?'':'Race saved at gate '+(P.lastCp||'START')+', lap '+(P.lap+1)+'. Reloading the page can resume it.';}
 else if(!on&&app==='paused'){app='race';$('pause').hidden=true;$('touch').hidden=!document.body.classList.contains('touch');snd.resume();}}
addEventListener('blur',()=>{if(app==='race')pause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&app==='race')pause(true);});
function toMenu(){app='menu';snd.stop();$('menu').hidden=false;$('hud').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('touch').hidden=true;document.body.classList.remove('racing');
 racers.forEach((r,k)=>{resetRacer(r,k);r.topMul=.95;});diff=DIFF[1];env.frozen=false;ghostG.visible=false;fxA.clear();fxS.clear();refreshMenu();}
const seg=pickers(opt,saveOpt);seg('o-diff','diff',true,()=>refreshMenu());
function refreshMenu(){const d=DIFF[opt.diff];$('dinfo').textContent=['Gentle rivals and a roomy clock: learn the corners and the drift.','Rivals race a clean line and drift sometimes.','Rivals drift every long corner and the clock is tight.'][opt.diff]+' Time limit '+fmtClock(d.limit)+'.';
 const s=savedRun();$('resume').hidden=!s;if(s)$('resume').textContent='RESUME SAVED RACE · LAP '+(s.racers[0].lap+1)+' · '+DIFF[s.diff].n;
 $('rec').textContent=(rec.best||bestScore(ID))?`BEST SCORE ${Math.max(rec.best,bestScore(ID))} · BEST LAP ${rec.bestLap?fmtT(rec.bestLap):'—'} · ${rec.deliveries} PARCELS DELIVERED · GHOST ${ghostRec?'READY':'NOT YET'}`:'No records yet. Finish a lap to save your ghost.';}
$('go').onclick=()=>{saveJ(K_RUN,null);startRace({diff:opt.diff});};
$('resume').onclick=()=>{const s=savedRun();if(s)startRace({diff:s.diff,resume:s});};
$('reset').onclick=()=>{if(confirm('Reset Tideway Courier records and ghost lap?')){rec={best:0,bestLap:0,deliveries:0,races:0,done:rec.done};saveJ(K_REC,rec);ghostRec=null;saveJ(K_GHOST,null);saveJ(K_RUN,null);refreshMenu();}};
$('bres').onclick=()=>pause(false);$('bretry').onclick=()=>{saveJ(K_RUN,null);startRace({diff:DIFF.indexOf(diff)});};$('bquit').onclick=()=>{saveRun();toMenu();};
$('again').onclick=()=>startRace({diff:opt.diff});$('omenu').onclick=toMenu;
postButton($('post'),ID,()=>{const r=result||{};return[r.pts||0,`Game: Tideway Courier\nPoints: ${r.pts||0}\nResult: ${r.timeUp?'time up':ORD(r.place||4)} · ${r.diff||''} rivals\nTime: ${r.time?fmtT(r.time):'—'} · best lap ${r.best?fmtT(r.best):'—'}\nDeliveries: ${r.deliveries||0}/${LAPS} · drift boosts ${r.boosts?r.boosts[1]+r.boosts[2]+r.boosts[3]:0}`];});

/* ================= camera ================= */
const camP=new V(),camL=new V(),_a={x:0,y:0,z:0};let camYaw=0;
function chaseCam(dt,snap){const r=P,boost=r.zipT>0;let target=r.yaw+(r.v<-1?Math.PI:0);if(r.drift.on)target-=r.drift.dir*.22;
 if(snap||!camInit){camYaw=target;camInit=true;}else camYaw+=wrapA(target-camYaw)*Math.min(1,dt*(r.drift.on?3.2:4.5));
 const dist=6.6+cl(r.v,0,40)*.05+(boost?.8:0),h=2.7+cl(r.v,0,40)*.02;
 // look a little into the coming corner: blend toward the road 16 m ahead
 at(T,(r.q.i+8)%T.B.n,T.B.line[(r.q.i+8)%T.B.n]*.5,_a);const fx=Math.sin(r.yaw),fz=Math.cos(r.yaw);
 const lx=r.p.x+fx*5*.7+(_a.x-r.p.x)*.3,lz=r.p.z+fz*5*.7+(_a.z-r.p.z)*.3;
 const px=r.p.x-Math.sin(camYaw)*dist,pz=r.p.z-Math.cos(camYaw)*dist;let py=r.p.y+h;const gh=Math.max(T.H.h(px,pz),0)+1.2;if(py<gh)py=gh;
 if(snap||!camP.lengthSq()){camP.set(px,py,pz);camL.set(lx,r.p.y+1.1,lz);}else{const k=Math.min(1,dt*10);camP.x+=(px-camP.x)*k;camP.y+=(py-camP.y)*Math.min(1,dt*5);camP.z+=(pz-camP.z)*k;camL.x+=(lx-camL.x)*k;camL.y+=(r.p.y+1.1-camL.y)*k;camL.z+=(lz-camL.z)*k;}
 cam.position.copy(camP);if(shake>0){cam.position.x+=(Math.random()-.5)*shake;cam.position.y+=(Math.random()-.5)*shake;}cam.lookAt(camL);
 const fov=62+cl(r.v/TOP,0,1.3)*8+(boost?6:0)+(cam.aspect<1?(1-cam.aspect)*24:0);cam.fov+=(fov-cam.fov)*Math.min(1,dt*4);cam.updateProjectionMatrix();}
function introCam(dt){const k=1-cl(cdT/COUNT,0,1),e=k*k*(3-2*k);chaseCam(dt,true);const from=new V(P.p.x+Math.sin(P.yaw+2.4)*26,P.p.y+16,P.p.z+Math.cos(P.yaw+2.4)*26);cam.position.lerpVectors(from,camP,e);cam.lookAt(camL);camInit=true;}
function menuCam(dt){const r=racers[1],a=menuT*.18;const cx=r.p.x+Math.sin(a)*16,cz=r.p.z+Math.cos(a)*16;cam.position.set(cx,Math.max(T.H.h(cx,cz),0)+5.5,cz);cam.lookAt(r.p.x,r.p.y+1.2,r.p.z);cam.fov=52;cam.updateProjectionMatrix();}

/* ================= per-frame visuals + HUD ================= */
const mini=$('mini'),mx=mini.getContext('2d');let mb=null;
function miniMap(){if(!mb){let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<T.B.n;i++){x0=Math.min(x0,T.B.x[i]);x1=Math.max(x1,T.B.x[i]);z0=Math.min(z0,T.B.z[i]);z1=Math.max(z1,T.B.z[i]);}const s=150/Math.max(x1-x0,z1-z0);mb={x0,z0,s,ox:(180-(x1-x0)*s)/2,oz:(180-(z1-z0)*s)/2};}
 const S=(x,z)=>[mb.ox+(x-mb.x0)*mb.s,mb.oz+(z-mb.z0)*mb.s];mx.clearRect(0,0,180,180);mx.lineJoin='round';
 mx.beginPath();for(let i=0;i<=T.B.n;i++){const k=i%T.B.n,[a,b]=S(T.B.x[k],T.B.z[k]);i?mx.lineTo(a,b):mx.moveTo(a,b);}mx.strokeStyle='rgba(255,250,240,.9)';mx.lineWidth=7;mx.stroke();mx.strokeStyle='rgba(60,70,80,.9)';mx.lineWidth=4;mx.stroke();
 for(let i=0;i<T.B.n;i++)if(T.B.bridge[i]){const[a,b]=S(T.B.x[i],T.B.z[i]);mx.fillStyle='#c89060';mx.fillRect(a-2,b-2,4,4);}
 const pin=(pad,c,t,on)=>{const[a,b]=S(T.B.x[pad.i],T.B.z[pad.i]);mx.globalAlpha=on?1:.35;mx.fillStyle=c;mx.beginPath();mx.arc(a,b,8,0,7);mx.fill();mx.fillStyle='#1f1d29';mx.font='bold 10px sans-serif';mx.textAlign='center';mx.textBaseline='middle';mx.fillText(t,a,b+1);mx.globalAlpha=1;};
 pin(T.pick,'#ffd04a','P',W.pads.pick.on);pin(T.drop,'#46e0b0','D',W.pads.drop.on);
 {const[a,b]=S(T.B.x[0],T.B.z[0]);mx.fillStyle='#fff';mx.fillRect(a-1.5,b-6,3,12);}
 for(let k=racers.length-1;k>=0;k--){const r=racers[k],[a,b]=S(r.p.x,r.p.z);mx.fillStyle='#'+new THREE.Color(r.d.c).getHexString();mx.beginPath();mx.arc(a,b,k?4:6,0,7);mx.fill();if(!k){mx.strokeStyle='#fff';mx.lineWidth=2;mx.stroke();}}}
const hud={};['place','lap','ltime','lbest','clock','pn','pbox','score','obj','objic','objt','drift','dlabel','spd','cd','msg','warn','sfill','startm'].forEach(k=>hud[k]=$(k));
const segs=[...document.querySelectorAll('#drift span')];
function liveScore(){return P.deliveries*DELIVERY_PTS+tiers.reduce((s,n,k)=>s+n*TIER_PTS[k],0);}
let hudT=0;
function updHud(dt){hudT-=dt;
 if(msgT>0){msgT-=dt;if(msgT<=0)hud.msg.classList.remove('on');}
 if(phase==='count'){const n=Math.ceil(cdT);hud.cd.textContent=n>0&&n<=3?n:'';hud.cd.style.opacity=n<=3?1:0;hud.cd.classList.remove('go');
  const f=cl((COUNT-cdT)/COUNT,0,1);hud.sfill.style.width=(f*100)+'%';const g=P.inp.gas>0;hud.sfill.style.background=g?(gasAt>1.8?'#ff8a6a':gasAt<=1?'#46e0b0':'#ffd04a'):'rgba(255,255,255,.6)';
  hud.startm.querySelector('p').innerHTML=g&&gasAt>1.8?'TOO EARLY · LET GO AND <b>WAIT FOR 1</b>':g&&gasAt<=1?'<b>BOOST READY</b> · KEEP HOLDING':'HOLD GAS WHEN <b>1</b> SHOWS';}
 else if(phase==='go'&&raceT<.8){hud.cd.textContent='GO!';hud.cd.classList.add('go');hud.cd.style.opacity=1-raceT/.8;}else hud.cd.style.opacity=0;
 if(hudT>0)return;hudT=.1;
 const pl=P.fin?1+racers.filter(r=>r!==P&&r.fin&&r.fin<P.fin).length:P.place;hud.place.innerHTML=pl+'<i>'+ORD(pl).slice(-2).toUpperCase()+'</i><small>/4</small>';hud.place.className=pl===1?'p1':'';
 hud.lap.textContent='LAP '+Math.min(LAPS,P.lap+1)+'/'+LAPS+' · GATE '+(P.next%T.cps.length===0?'FINISH':P.next%T.cps.length);
 hud.ltime.textContent='LAP '+fmtT(phase==='count'?0:raceT-lapStart);hud.lbest.textContent='BEST '+(P.bestLap?fmtT(P.bestLap):ghostRec?fmtT(ghostRec.t)+' (GHOST)':'—');
 hud.clock.querySelector('b').textContent=fmtClock(clock);hud.clock.classList.toggle('low',clock<=20&&phase==='go');
 hud.pn.textContent=P.deliveries+'/'+LAPS;hud.pbox.className='box'+(P.parcel?' full':'');hud.score.textContent='SCORE '+liveScore();
 // objective line: always says what to do next and where (words + icon, not colour alone)
 let ic,tx,cls;const dist=pad=>{let d=ds(T,P.q.s,T.B.s[pad.i]);if(d<0)d+=T.B.len;return Math.round(d);};
 if(phase==='done'){ic='✓';tx='FINISHED · WELL DRIVEN';cls='done';}
 else if(P.parcel){ic='D';tx='DELIVER TO POST HOUSE BAY · RIGHT SIDE · '+dist(T.drop)+' M';cls='drop';}
 else if(delivered[P.lap]){ic='✓';tx='PARCEL DELIVERED THIS LAP · RACE TO THE LINE';cls='done';}
 else{ic='P';tx='PICK UP AT BREAKWATER DEPOT · RIGHT SIDE · '+dist(T.pick)+' M';cls='';}
 hud.objic.textContent=ic;hud.objt.textContent=tx;hud.obj.className=cls;
 // drift meter: three labelled segments + label text (the tier is also heard as the whine pitch)
 const d=P.drift,t=d.on?d.t:0;hud.drift.classList.toggle('on',d.on);
 segs.forEach((s,k)=>{const a=k?DRIFT_LV[k-1]:0,b=DRIFT_LV[k],f=cl((t-a)/(b-a),0,1);s.firstChild.style.width=(f*100)+'%';s.classList.toggle('full',d.on&&d.lvl>k);});
 hud.dlabel.textContent=d.on?(d.lvl?'DRIFT '+['','I','II','III'][d.lvl]+' · LET GO TO BOOST':'DRIFTING · KEEP HOLDING'):P.zipT>0?'BOOST!':document.body.classList.contains('touch')?'HOLD DRIFT IN A TURN':'HOLD SPACE IN A TURN TO DRIFT';
 hud.spd.querySelector('b').textContent=Math.round(Math.abs(P.v)*3.6);
 // warnings
 let w='';if(phase==='go'){if(P.wrongT>1.2)w='WRONG WAY<small>TURN AROUND</small>';else if(P.stuckT>2.5||P.offT>7)w='STUCK?<small>PRESS R (OR Y) FOR THE LAST GATE</small>';}
 hud.warn.innerHTML=w;hud.warn.classList.toggle('on',!!w);
 miniMap();}
const _q=new THREE.Quaternion();
function visuals(dt){const t=W.t;
 for(const r of racers){poseKart(r,dt,t);
  if(r.fallT>0)continue;const fx=Math.sin(r.yaw),fz=Math.cos(r.yaw),rx=Math.cos(r.yaw),rz=-Math.sin(r.yaw);
  if(r.drift.on&&!r.air){const c=SPARK[r.drift.lvl];for(const s of[-1,1]){const p={x:r.p.x-fx*1+rx*s*.8,y:r.p.y+.2,z:r.p.z-fz*1+rz*s*.8};if(Math.random()<(r.drift.lvl?.9:.4))fxA.burst(p,r.drift.lvl?3:1,r.drift.lvl?7:3,c,r.drift.lvl?.5:.24,.3,{up:true,grav:16,drag:.8});}}
  if(r.zipT>0){const c=[new THREE.Color(0xffd070),new THREE.Color(0xff8a3a)];for(const s of[-1,1])fxA.emit(r.p.x-fx*1.35+rx*s*.45,r.p.y+.55,r.p.z-fz*1.35+rz*s*.45,-fx*6+(Math.random()-.5),Math.random(),-fz*6+(Math.random()-.5),c[0].r,c[0].g,c[0].b,.6,.18);}
  if(Math.abs(r.v)>6&&!r.air){if(r.wade){if(Math.random()<.8)fxS.emit(r.p.x+(Math.random()-.5)*2,.1,r.p.z+(Math.random()-.5)*2,(Math.random()-.5)*3,2+Math.random()*3,(Math.random()-.5)*3,.9,.97,1,1+Math.random(),.6,9,.6,1.5);}
   else if(Math.abs(r.q.u)>r.q.w+.3&&Math.random()<.5)fxS.emit(r.p.x-fx,r.p.y+.2,r.p.z-fz,(Math.random()-.5),.8+Math.random(),(Math.random()-.5),.86,.78,.6,.9,.6,0,1.2,1.8);}}
 // ghost lap
 const gOn=app!=='menu'&&ghostRec&&phase!=='count';ghostG.visible=false;
 if(gOn){const f=(raceT-lapStart)*10,k=Math.floor(f),F=ghostRec.f;if(k>=0&&k<F.length-1){const a=F[k],b=F[k+1],u=f-k;ghostG.visible=true;ghostG.position.set(lerp(a[0],b[0],u),lerp(a[1],b[1],u),lerp(a[2],b[2],u));ghostG.rotation.y=a[3]+wrapA(b[3]-a[3])*u;}}
 // pads follow the player's state; gate flags flash when passed, the next gate glows
 W.pads.pick.on=app==='menu'||(!P.parcel&&!delivered[P.lap]&&phase!=='done');W.pads.drop.on=app==='menu'||P.parcel;
 for(const g of W.gates){const nxt=app!=='menu'&&g.cp.k===P.next%T.cps.length;g.flagM.emissive.setHex(nxt?0xffa020:0);g.flagM.emissiveIntensity=nxt?.5+Math.sin(t*6)*.3:0;}
 if(gateFlashT>0&&lastGateFlash){gateFlashT-=dt;lastGateFlash.flagM.emissive.setHex(0x46e0b0);lastGateFlash.flagM.emissiveIntensity=gateFlashT*2;}
 fxA.update(dt);fxS.update(dt);shake=Math.max(0,shake-dt*2);
 // engine audio
 if(app==='race')snd.engine(P.v,phase!=='count'||P.inp.gas>0,P.drift.on,P.drift.lvl,P.zipT>0,P.wade);
 if(app==='race'&&Math.random()<dt*.05)snd.play('gull');}
function frame(dt){W.update(dt,app==='menu'?racers[1].p:P.p);visuals(dt);
 if(app==='menu')menuCam(dt);else if(app==='race'||app==='paused'||app==='results'){if(phase==='count')introCam(dt);else chaseCam(dt,false);}
 if(app==='race'||app==='paused')updHud(dt);
 const h=innerHeight*R.getPixelRatio();fxA.U.uScale.value=fxS.U.uScale.value=h/(2*Math.tan(cam.fov*Math.PI/360));}

/* ================= rendering ================= */
const POST={exposure:.95,bloom:.25,bloomThreshold:.9,bloomRadius:.4,vignette:.22,saturation:1.18,grain:.01,aoStrength:.8};
let post=null;
function applyQuality(q){gfx=q;W.sun.castShadow=q>0;W.sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(W.sun.shadow.map){W.sun.shadow.map.dispose();W.sun.shadow.map=null;}
 R.shadowMap.enabled=q>0;scene.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);});
 R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));post=null;}
bindQualityKey(()=>gfx,q=>applyQuality(q));applyQuality(gfx);
function render(){const w=innerWidth,h=innerHeight;if(!post||post.w!==w||post.h!==h||post.dpr!==R.getPixelRatio()){R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();post=cinematic(R,scene,cam,{...POST,quality:gfx,ao:gfx>=2});post.w=w;post.h=h;post.dpr=R.getPixelRatio();post.setSize(w,h);}
 post.render();}

/* ================= loop ================= */
function step(dt){padButtons();acc+=dt;let n=0;while(acc>=DT&&n<240){if(app!=='paused')tick(DT);acc-=DT;n++;}if(n>=240)acc=0;frame(Math.min(dt,.1));}
toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hook ================= */
window.COURIER={get state(){return app==='race'?phase:app;},get app(){return app;},get phase(){return phase;},
 get score(){return result?result.pts:liveScore();},get result(){return result;},step,render,
 start(o={}){if(o.resume){const s=savedRun();if(s)return startRace({diff:s.diff,resume:s});}saveJ(K_RUN,null);if(o.diff!=null)opt.diff=o.diff;startRace({diff:o.diff??opt.diff});},
 skipCount(boost=false){if(phase==='count'){if(boost){P.inp.gas=1;gasAt=.5;cdT=DT/2;override={gas:1};tick(DT);override=null;}else{cdT=DT/2;tick(DT);}}},
 setInput(o){override=o?{...o}:null;},autopilot(on=true,drift=0){autopilot=on;autoDrift=drift;},pause,toMenu,resetToGate,
 get player(){return P;},get racers(){return racers;},get rivals(){return racers.slice(1);},get clock(){return clock;},setClock(s){clock=s;},get raceT(){return raceT;},
 get lap(){return P.lap;},get next(){return P.next;},get delivered(){return delivered.slice();},get tiers(){return tiers.slice();},get ghost(){return ghostRec;},get rec(){return rec;},
 get saved(){return savedRun();},get ghostVisible(){return ghostG.visible;},saveRun,warp(i,u=0,v=20){place(T,P,i,u);P.v=v;P.sPrev=P.q.s;},warpRival(k,i,u=0){const r=racers[k];place(T,r,i,u);r.sPrev=r.q.s;},
 endNow(timeUp=true){endRace(timeUp);},setQuality:applyQuality,get quality(){return gfx;},T,W,scene,cam,R,keys,touch,DIFF,LAPS};
