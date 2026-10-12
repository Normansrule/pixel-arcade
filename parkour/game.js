// RUNLINE — first-person rooftop freerunning: momentum controller, 12 courses, medal times, rival + personal-best ghosts. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Runner,MV} from './physics.js';
import {LEVELS,DISTRICTS,PACE} from './levels.js';
import {buildLevel,setupDistrict,DPOST,HINT,Particles} from './world.js';
import {Figure,Viewmodel} from './rig.js';
import {Sound} from './sound.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,TAU=Math.PI*2,rnd=(a=1)=>Math.random()*a;
const DT=1/120,GHZ=20;
const TIERS=[{n:'ROOKIE',k:'bronze',who:'PIP'},{n:'RUNNER',k:'silver',who:'KESTREL'},{n:'PRO',k:'gold',who:'VANTA'},{n:'ELITE',k:'plat',who:'ZERO'}];
const MEDALS=[{n:'BRONZE',c:'#d08a4e',k:'bronze',pts:300,l:'B'},{n:'SILVER',c:'#d6dbe2',k:'silver',pts:600,l:'S'},{n:'GOLD',c:'#ffcf3f',k:'gold',pts:1000,l:'G'},{n:'PLATINUM',c:'#9eeaff',k:'plat',pts:1500,l:'P'}];
const STC={run:0,air:1,wall:2,slide:3,grap:4,mantle:5,roll:6};const STN=['r','j','w','s','g','m','s'];
const fmt=(t,d=2)=>{t=Math.max(0,t);const m=t/60|0,s=t-m*60;return m+':'+(s<10?'0':'')+s.toFixed(d);};const fmtS=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};

/* ================= renderer ================= */
const canvas=$('c');const Rr=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});Rr.setPixelRatio(Math.min(devicePixelRatio,1.5));Rr.shadowMap.enabled=true;Rr.shadowMap.type=THREE.PCFSoftShadowMap;Rr.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(80,1,.05,6000);cam.rotation.order='YXZ';
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(70,1,.01,20);vmCam.rotation.order='YXZ';vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xffffff,0x303038,1.1),vmKey=new THREE.DirectionalLight(0xfff2e0,1.6);vmKey.position.set(-1,2,1.5);vmScene.add(vmHemi,vmKey);
const snd=new Sound(),parts=new Particles(scene,2600),P=new Runner();
const VM=new Viewmodel(vmCam,vmScene);
const rivalFig=new Figure(0xff3b2a,'RIVAL'),ghostFig=new Figure(0x2fe0ff,'YOUR BEST');scene.add(rivalFig.g,ghostFig.g);
const rope=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,1,5,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(3,1.2,.3),toneMapped:false}));rope.visible=false;scene.add(rope);

/* ================= options + progress ================= */
const opt={sess:10,tier:1,ghost:1,sens:1,fov:100,vision:1,vol:.8,mus:.5};try{Object.assign(opt,JSON.parse(localStorage.getItem('runline_opt'))||{});}catch(e){}
function saveOpt(){try{localStorage.setItem('runline_opt',JSON.stringify(opt));}catch(e){}}
let prog={best:{}};try{prog=Object.assign(prog,JSON.parse(localStorage.getItem('runline_prog'))||{});}catch(e){}
function saveProg(){try{localStorage.setItem('runline_prog',JSON.stringify(prog));}catch(e){}}
let unlockAll=/[?&]all\b/.test(location.search);
const unlocked=i=>unlockAll||i%4===0||!!prog.best[LEVELS[i-1].id];

/* ================= state ================= */
let app='boot',LI=0,LV=null,WLD=null,DS=null,dCur=-1,run=null,sess=null,time=0,acc=0,shake=0,landDip=0,rollA=-1,fovKick=0,flashT=0,lastResult=null,attract=null,stepAcc=0,wallStepT=0,menuCam=null,vis=1;
let rivalPath=null,ghost=null,tipT=0,splitT=0,banT=0,deathT=0,hurtFx=0;
const AP={on:false,i:1,dashed:false,grap:false};

/* ================= levels ================= */
function loadLevel(i){LI=i;LV=LEVELS[i];if(WLD){WLD.dispose();WLD=null;}
 if(dCur!==LV.district){if(DS)DS.dispose();DS=setupDistrict(LV.district,Rr,scene);dCur=LV.district;fxStack=null;vmScene.environment=DS.env;
  vmHemi.color.set([0xfff4e8,0xb8b0ff,0xffe0cc][dCur]);vmHemi.groundColor.set([0x6a6258,0x201828,0x5a4a68][dCur]);vmKey.color.set([0xfff2de,0xff8ad8,0xffc49a][dCur]);vmKey.intensity=[1.7,1.2,1.6][dCur];}
 WLD=buildLevel(LV,Rr,scene,LV.district);if(DS.clouds)DS.clouds.position.y=LV.killY-5;rivalPath=makePath(LV);parts.clear();Rr.shadowMap.needsUpdate=true;
 let g=null;try{g=JSON.parse(localStorage.getItem('runline_ghost_'+LV.id));}catch(e){}ghost=g&&g.d&&g.d.length>10?g:null;}
// densified rival route with gold-pace timestamps
function makePath(L){const R=L.route,pts=[];let T=0;const add=(x,y,z,tag,side)=>{pts.push({x,y,z,tag,side,tm:T});};
 add(...R[0].p,'r',0);
 for(let i=1;i<R.length;i++){const a=R[i-1].p,b=R[i].p,tag=R[i].tag,side=R[i].side;const len=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),n=Math.max(1,Math.ceil(len/.6));const dy=b[1]-a[1];
  for(let k=1;k<=n;k++){const u=k/n;let y=a[1]+dy*u;if(tag==='j'||tag==='f')y+=(tag==='j'?1.15+Math.max(0,dy)*.4:.9)*4*u*(1-u);else if(tag==='m')y=a[1]+dy*Math.min(1,u*1.7);else if(tag==='v')y+=.7*4*u*(1-u);else if(tag==='g')y+=1.2*4*u*(1-u);
   const seg=len/n;T+=seg/PACE[tag];add(a[0]+(b[0]-a[0])*u,y,a[2]+(b[2]-a[2])*u,tag,side);}}
 return{pts,T};}
function pathAt(path,tm,out){const p=path.pts;tm=cl(tm,0,path.T);let lo=0,hi=p.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(p[m].tm<=tm)lo=m;else hi=m;}const a=p[lo],b=p[hi],u=b.tm>a.tm?(tm-a.tm)/(b.tm-a.tm):0;
 out.p.set(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,a.z+(b.z-a.z)*u);out.tag=b.tag;out.side=b.side;out.dx=b.x-a.x;out.dz=b.z-a.z;out.i=lo;return out;}
const tierTime=()=>LV[TIERS[opt.tier].k];

/* ================= run flow ================= */
function resetRun(){run={t:0,started:false,cp:-1,splits:[],orbs:0,deaths:0,rec:[],recAcc:0,tips:new Set(),done:false,prog:0};WLD.resetCrumbles();for(const o of WLD.orbs)o.got=false;for(const c of WLD.cps)c.got=false;for(const g of WLD.graps)g.cd=0;
 const s=LV.start;P.reset(new V(...s.p),s.yaw);P.pitch=-.06;AP.i=1;AP.dashed=false;rollA=-1;landDip=0;shake=0;rope.visible=false;parts.clear();setFlash(.6);tipT=0;$('tip').classList.remove('on');
 hudBuild();rivalFig.setLabel(TIERS[opt.tier].who+' · '+TIERS[opt.tier].n);snd.play('respawn');}
function startLevel(i,o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();snd.init();snd.setVol(opt.vol);snd.setMusic(opt.mus);
 if(!sess)newSession();if(i!==LI||!WLD)loadLevel(i);app='play';attract=null;resetRun();showScr(null);$('hud').hidden=false;document.body.classList.add('playing');snd.music(LV.district,true);if(!o.noLock)lock();}
function newSession(){sess={len:opt.sess*60,left:opt.sess*60,score:0,lv:{},runs:0,medals:[0,0,0,0],rivals:0};}
function respawn(why){run.lastDeath=why+'@'+P.pos.toArray().map(v=>v.toFixed(1)).join(',');const c=run.cp>=0?WLD.cps[run.cp]:null;const p=c?c.p:new V(...LV.start.p),yaw=c?c.yaw:LV.start.yaw;P.reset(p.clone(),yaw);P.pitch=-.05;run.deaths++;WLD.resetCrumbles();rope.visible=false;rollA=-1;
 setFlash(why==='zap'?.9:.55,why==='zap'?'#ff2a1a':'#fff');snd.play(why==='zap'?'zap':'respawn');if(why)hudTip(why==='zap'?'Zapped by a laser — back to the checkpoint':why==='fall'?'Too far to fall — back to the checkpoint':'Checkpoint',2.2);
 // autopilot: resume from the route point nearest to the checkpoint
 let bi=1,bd=1e9;LV.route.forEach((r,i)=>{const d=Math.hypot(r.p[0]-p.x,r.p[2]-p.z)+Math.abs(r.p[1]-p.y);if(i>0&&d<bd){bd=d;bi=i;}});AP.i=Math.min(LV.route.length-1,bi+(bd<3?1:0));}
function finishRun(){run.done=true;app='done';unlock();document.body.classList.remove('playing');const t=run.t;let m=-1;for(let k=3;k>=0;k--)if(t<=LV[MEDALS[k].k]){m=k;break;}
 const tt=tierTime(),beat=t<tt;const prev=prog.best[LV.id];const nb=!prev||t<prev.t;
 const sc=500+(m>=0?MEDALS[m].pts:0)+run.orbs*100+(beat?400:0)+Math.max(0,Math.floor((LV.par-t)*10));
 if(nb){prog.best[LV.id]={t,medal:Math.max(m,prev?prev.medal:-1),orbs:Math.max(run.orbs,prev?prev.orbs:0),splits:run.splits.slice()};try{localStorage.setItem('runline_ghost_'+LV.id,JSON.stringify({t,d:run.rec}));}catch(e){}ghost={t,d:run.rec};}
 else{prev.medal=Math.max(prev.medal,m);prev.orbs=Math.max(prev.orbs,run.orbs);}saveProg();
 const s=sess.lv[LV.id];if(!s||sc>s.score){sess.lv[LV.id]={t,medal:m,score:sc,beat,orbs:run.orbs};}sess.runs++;if(m>=0)sess.medals[m]++;if(beat)sess.rivals++;sess.score=Object.values(sess.lv).reduce((a,b)=>a+b.score,0);
 lastResult={t,m,beat,sc,nb,prev:prev?prev.t:null,tt};snd.play('finish');if(m>=0)setTimeout(()=>snd.play('medal'),450);
 parts.burst(P.pos.clone().add(new V(0,1.5,0)),140,9,[new THREE.Color(3,2,.6),new THREE.Color(2.5,2.5,2.5),new THREE.Color(.4,2,3)],.5,1.6,{up:true,grav:6,drag:1});
 // course-complete card
 const md=$('dmedal');if(m>=0){md.className='medal';md.style.background=`radial-gradient(circle at 35% 30%,#fff,${MEDALS[m].c} 45%,${MEDALS[m].c})`;md.innerHTML=`<b>${MEDALS[m].l}</b>`;}else{md.className='medal none';md.style.background='';md.innerHTML='<b>NO MEDAL</b>';}
 $('deye').textContent=`${LV.name} · ${m>=0?MEDALS[m].n+' MEDAL':'FINISHED'}${nb?' · NEW BEST':''}`;$('dtime').textContent=fmt(t);
 const tr=TIERS[opt.tier];$('dsub').innerHTML=beat?`<span class="g">YOU BEAT ${tr.who} (${tr.n}) BY ${(tt-t).toFixed(2)}s</span>`:`<span class="r">${tr.who} (${tr.n}) WINS BY ${(t-tt).toFixed(2)}s</span>`;
 const nx=MEDALS.map((M,k)=>`<span class="dot" style="background:${M.c}"></span>${fmt(LV[M.k])}`).reverse().join('&nbsp;&nbsp;');
 $('dstats').innerHTML=`<tr><td>Medal times</td><td>${nx}</td></tr><tr><td>Personal best</td><td>${nb?'<span class="g">NEW · '+fmt(t)+'</span>'+(prev?' (was '+fmt(prev.t)+')':''):fmt(prev.t)+' <span class="r">+'+(t-prev.t).toFixed(2)+'</span>'}</td></tr>
  <tr><td>Orbs · resets</td><td>${run.orbs}/${WLD.orbs.length} · ${run.deaths}</td></tr><tr><td>Score · session total</td><td><b>${sc}</b> · ${sess.score} pts</td></tr>`;
 $('dnext').hidden=!(LI<LEVELS.length-1&&unlocked(LI+1));showScr('done');}
function failRun(){app='done';unlock();document.body.classList.remove('playing');snd.play('fail');lastResult={fail:true};const md=$('dmedal');md.className='medal none';md.style.background='';md.innerHTML='<b>TIME UP</b>';
 $('deye').textContent=`${LV.name} · PAR CLOCK EXPIRED`;$('dtime').textContent=fmt(LV.par);$('dsub').innerHTML='<span class="r">The par clock ran out before the finish. Find a faster line.</span>';
 $('dstats').innerHTML=`<tr><td>Checkpoints reached</td><td>${run.cp+1}/${WLD.cps.length}</td></tr><tr><td>Bronze needs</td><td>${fmt(LV.bronze)}</td></tr>`;$('dnext').hidden=true;showScr('done');}
function endSession(){if(app==='over')return;if(!sess)newSession();unlock();app='over';document.body.classList.remove('playing');snd.music(0,false);snd.play('finish');$('hud').hidden=true;
 const rows=LEVELS.map((L,i)=>{const s=sess.lv[L.id];if(!s)return'';return`<tr><td>${String(i+1).padStart(2,'0')} · ${L.name}</td><td>${fmt(s.t)}</td><td>${s.medal>=0?`<span class="dot" style="background:${MEDALS[s.medal].c}"></span>${MEDALS[s.medal].n}`:'—'}</td><td>${s.beat?'<span class="g">BEAT</span>':'<span class="r">LOST</span>'}</td><td>${s.score}</td></tr>`;}).join('');
 $('ostats').innerHTML=`<tr><th>COURSE</th><th>BEST</th><th>MEDAL</th><th>RIVAL</th><th>PTS</th></tr>`+(rows||'<tr><td colspan="5">No course finished this session.</td></tr>');
 $('oeye').textContent=`SESSION OVER · ${opt.sess} MIN · RIVAL ${TIERS[opt.tier].n}`;$('ores').textContent=sess.score.toLocaleString()+' PTS';
 startAttract(LI);const tok=award();$('otok').textContent=`+${tok} TOKENS · ${sess.medals.reduce((a,b)=>a+b,0)} MEDALS · ${sess.rivals} RIVAL WINS · BEST ${best().toLocaleString()} PTS`;showScr('over');}
let lastAward=null;
function award(){const pts=sess.score,won=sess.medals[2]+sess.medals[3]>0||sess.rivals>0;lastAward={pts,won,courses:Object.keys(sess.lv).length,medals:sess.medals.slice(),rivals:sess.rivals,len:opt.sess,tier:TIERS[opt.tier].n.toLowerCase()};
 const tok=5+Math.min(60,pts/150|0);addRound(tok,won);saveBest('runline',pts);return tok;}
function best(){return bestScore('runline');}

/* ================= screens ================= */
function showScr(id){for(const s of['menu','select','pause','done','over'])$(s).hidden=s!==id;$('keys').hidden=id!=='menu';if(id&&id!=='pause')$('hud').hidden=true;}
function toMenu(){unlock();app='menu';sess=null;snd.music(0,false);$('hud').hidden=true;document.body.classList.remove('playing');showScr('menu');startAttract(0);updateBest();}
function toSelect(){unlock();if(!sess)newSession();app='select';$('hud').hidden=true;document.body.classList.remove('playing');buildGrid();showScr('select');if(!attract)startAttract(LI);}
function startAttract(i){if(i!==LI||!WLD)loadLevel(i);attract={t:rnd(4),cam:new V(),look:new V(),init:false};rivalFig.g.visible=true;ghostFig.g.visible=false;}
function buildGrid(){$('seleye').textContent=`SESSION · ${fmtS(sess.left)} LEFT · RIVAL ${TIERS[opt.tier].n}`;$('selscore').textContent=sess.score.toLocaleString()+' PTS';
 $('grid').innerHTML=DISTRICTS.map((D,d)=>`<div class="dist"><h4 style="color:${D.col}">${D.name}</h4><p>${D.sub.toUpperCase()}</p>${LEVELS.map((L,i)=>{if(L.district!==d)return'';const b=prog.best[L.id],lk=!unlocked(i),s=sess.lv[L.id];
  return`<div class="lv${lk?' lock':''}" data-i="${i}"><span class="n">${String(i+1).padStart(2,'0')}</span><div class="t"><b>${L.name}</b><span>${lk?'LOCKED':b?'BEST '+fmt(b.t)+' · ORBS '+b.orbs+'/'+L.orbs.length:'PAR '+fmtS(L.par)+' · GOLD '+fmt(L.gold,1)}</span></div><div class="m">${MEDALS.map((M,k)=>`<i class="${b&&b.medal>=k?'on':''}" style="${b&&b.medal>=k?'background:'+M.c:''}" title="${M.n} ${fmt(L[M.k])}"></i>`).join('')}</div>${s?`<span class="s">+${s.score}</span>`:''}</div>`;}).join('')}</div>`).join('');
 $('grid').querySelectorAll('.lv').forEach(el=>el.onclick=()=>{const i=+el.dataset.i;if(!unlocked(i)){snd.play('click');return;}startLevel(i);});}
function updateBest(){const n=Object.keys(prog.best).length,b=best();$('best').textContent=(n?`${n}/12 COURSES CLEARED · `:'')+(b?`BEST SESSION ${b.toLocaleString()} PTS`:'');}
function pause(on){if(on&&app==='play'){app='paused';unlock();showScr('pause');document.body.classList.remove('playing');}else if(!on&&app==='paused'){app='play';showScr(null);$('hud').hidden=false;document.body.classList.add('playing');lock();}}

/* ================= input ================= */
const keys={},edge={},mouse={dx:0,dy:0,l:false,r:false};let locked=false;
function lock(){if(app!=='play'||AP.on)return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&app==='play')pause(true);});
canvas.addEventListener('mousedown',()=>{if(app==='play'&&!locked)lock();});
addEventListener('mousedown',e=>{if(app!=='play'||!locked)return;if(e.button===0)edge.dash=true;if(e.button===2)edge.grap=true;});
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(!locked)return;mouse.dx+=e.movementX;mouse.dy+=e.movementY;});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];keys[e.code]=true;if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ControlLeft','ControlRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(app==='paused')pause(false);else if(app==='play')pause(true);else if(app==='done')toSelect();return;}
 if(!first)return;
 if(app==='done'){if(e.code==='KeyR')startLevel(LI);else if((e.code==='Enter'||e.code==='Space')&&!$('dnext').hidden)startLevel(LI+1);else if(e.code==='Enter'||e.code==='Space')startLevel(LI);else if(e.code==='KeyL')toSelect();return;}
 if(app!=='play')return;
 if(e.code==='Space')edge.jump=true;if(e.code==='KeyC'||e.code==='ControlLeft'||e.code==='ControlRight')edge.slide=true;if(e.code==='KeyE')edge.dash=true;if(e.code==='KeyF')edge.grap=true;
 if(e.code==='KeyR')resetRun();if(e.code==='KeyQ'&&run.started)respawn('');if(e.code==='KeyV')setVision(!opt.vision);});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const padPrev={};
function readInput(){const I={f:0,s:0,jump:false,jumpE:false,slide:false,slideE:false,dashE:false,grapE:false,sprint:true};const k=c=>keys[c];
 I.f=(k('KeyW')||k('ArrowUp')?1:0)-(k('KeyS')||k('ArrowDown')?1:0);I.s=(k('KeyD')||k('ArrowRight')?1:0)-(k('KeyA')||k('ArrowLeft')?1:0);
 I.jump=!!k('Space');I.slide=!!(k('KeyC')||k('ControlLeft')||k('ControlRight'));I.sprint=!(k('ShiftLeft')||k('ShiftRight'));
 I.jumpE=!!edge.jump;I.slideE=!!edge.slide;I.dashE=!!edge.dash;I.grapE=!!edge.grap;
 const gps=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];const g=gps[0];
 if(g){const ax=g.axes,bt=g.buttons,dz=v=>Math.abs(v)>.18?v:0,pr=padPrev;const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);if(lx||ly){I.s=lx;I.f=-ly;}
  P.yaw-=rx*3.2*opt.sens*(1/60);P.pitch=cl(P.pitch-ry*2.4*opt.sens*(1/60),-1.5,1.5);
  const b=i=>!!(bt[i]&&bt[i].pressed);if(b(0)){I.jump=true;if(!pr.a)I.jumpE=true;}if(b(1)){I.slide=true;if(!pr.b)I.slideE=true;}if(b(2)&&!pr.x)I.dashE=true;if((bt[7]?.value||0)>.5&&!pr.rt)I.grapE=true;
  if(b(4)&&!pr.lb&&run&&run.started)respawn('');if(b(8)&&!pr.bk)resetRun();if(b(9)&&!pr.st)pause(true);if(b(3)&&!pr.y)setVision(!opt.vision);
  pr.a=b(0);pr.b=b(1);pr.x=b(2);pr.rt=(bt[7]?.value||0)>.5;pr.lb=b(4);pr.bk=b(8);pr.st=b(9);pr.y=b(3);}
 for(const e in edge)delete edge[e];return I;}
function setVision(on){opt.vision=on?1:0;saveOpt();segSet('o-vision',opt.vision);if(app==='play')hudTip(on?'Runner vision ON — red marks useful surfaces':'Runner vision OFF',1.6);}

/* ================= autopilot (tests + attract) ================= */
function apInput(){const I={f:1,s:0,jump:false,jumpE:false,slide:false,slideE:false,dashE:false,grapE:false,sprint:true};const R=LV.route;
 for(let n=0;n<4&&AP.i<R.length-1;n++){const a=R[AP.i-1].p,b=R[AP.i].p;const abx=b[0]-a[0],abz=b[2]-a[2],l2=abx*abx+abz*abz||1;const u=((P.pos.x-a[0])*abx+(P.pos.z-a[2])*abz)/l2;
  if(u>.985||Math.hypot(P.pos.x-b[0],P.pos.z-b[2])<1.1&&Math.abs(P.pos.y-b[1])<2.6){AP.i++;AP.dashed=false;AP.grap=false;const t=R[AP.i].tag,pv=R[AP.i-1];if(P.state==='wall'){if(!(t==='w'&&R[AP.i].side===pv.side))I.jumpE=true;}else if('jfmwug'.includes(t)&&(P.ground||P.coy>0))I.jumpE=true;}else break;}
 const tg=R[AP.i],b=tg.p;let dx=b[0]-P.pos.x,dz=b[2]-P.pos.z;const want=Math.atan2(-dx,-dz);let da=want-P.yaw;da=Math.atan2(Math.sin(da),Math.cos(da));P.yaw+=da*Math.min(1,DT*14);
 if(tg.tag==='s'){I.slide=true;if(P.state!=='slide'&&P.ground)I.slideE=true;}
 // lasers ahead: time the crossing (jump low beams, slide high ones, brake in between)
 if(P.ground){const fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);let bl=null,bd=7;for(const l of WLD.lasers){const cx=(l.A.x+l.B.x)/2-P.pos.x,cz=(l.A.z+l.B.z)/2-P.pos.z,al=cx*fx+cz*fz;if(al>-1.2&&al<bd&&Math.abs(l.A.y-P.pos.y)<3){bd=al;bl=l;}}
  if(bl){const tc=bd/Math.max(P.hs,4);const yl=(bl.mode==='sweep'?bl.y0+Math.sin((time+tc+.15)*bl.speed+bl.ph)*bl.amp:bl.y0)-P.pos.y;
   if(yl>1.25){I.jumpE=false;I.slide=true;if(P.state!=='slide'&&bd<4.5)I.slideE=true;}else if(yl<.62){I.slide=false;I.slideE=false;I.jumpE=bd<2.3&&bd>1.2;if(bd<=1.2)I.jumpE=true;}else{I.jumpE=false;I.f=-.4;}}}
 if(tg.tag==='u'&&!P.ground&&P.surf){I.s=-(tg.side||0);}
 if(tg.tag==='g'&&!AP.grap){let best=null,bd=1e9;for(const g of WLD.graps){const d=g.p.distanceTo(P.pos);if(d<bd){bd=d;best=g;}}
  if(best){const ex=best.p.x-P.pos.x,ey=best.p.y-(P.pos.y+P.eyeH),ez=best.p.z-P.pos.z;P.yaw=Math.atan2(-ex,-ez);P.pitch=Math.atan2(ey,Math.hypot(ex,ez));if(P.grapTarget){I.grapE=true;AP.grap=true;}}}
 else if(P.state!=='grap')P.pitch+=(-.08-P.pitch)*Math.min(1,DT*6);
 const hd=Math.hypot(dx,dz);if(!P.ground&&P.state==='air'&&!AP.dashed&&P.vel.y<1&&'jfm'.includes(tg.tag)&&P.dashN>0){const ty=b[1]-(tg.tag==='m'?1.6:0),h=P.pos.y-ty,vy=P.vel.y,disc=vy*vy+2*MV.g*h;const tl=disc>0?(vy+Math.sqrt(disc))/MV.g:0;if(P.hs*tl<hd-1.2&&!WLD.W.ray(_v.set(P.pos.x,P.pos.y+.2,P.pos.z),_w.set(0,-1,0),6)){I.dashE=true;AP.dashed=true;}}
 if(P.state==='grap'&&P.grap&&P.grap.dist<6)I.f=1;
 return I;}

/* ================= simulation ================= */
const _v=new V(),_w=new V(),ray=new THREE.Raycaster();
function ev(type,a){
 if(type==='jump'){snd.play('jump');dust(4);}
 else if(type==='land'){snd.play('land',a);if(a<-8)dust(10);landDip=Math.max(landDip,Math.min(.22,-a*.012));VM.land=Math.min(1,-a/14);}
 else if(type==='hard'){snd.play('hard');shake=Math.max(shake,.55);landDip=.5;dust(18);hudTip('HARD LANDING — press C just before touchdown to ROLL',2.4);}
 else if(type==='roll'){snd.play('roll');rollA=0;dust(10);}
 else if(type==='die'){respawn('fall');}
 else if(type==='slide'){snd.play('slide');}
 else if(type==='wallrun'){snd.play('wallrun');}
 else if(type==='walljump'){snd.play('walljump');}
 else if(type==='climb'){snd.play('climb');}
 else if(type==='mantle'||type==='vault'){snd.play(type);}
 else if(type==='dash'){snd.play('dash');VM.dash=1;fovKick=1;}
 else if(type==='grap'){snd.play('grap');}
 else if(type==='grapRel'){snd.play('grapRel');}}
function dust(n){const c=[new THREE.Color(.5,.48,.45),new THREE.Color(.35,.34,.33)];parts.burst(_v.copy(P.pos).add(new V(0,.1,0)),n,2.6,c,.5,.7,{flat:true,up:true,grav:-.3,drag:2.2});}
function fixed(dt,I){
 if(!run.started&&(I.f||I.s||I.jumpE||I.dashE||I.slideE)){run.started=true;snd.play('beep',1);}
 if(run.started){run.t+=dt;if(sess)sess.left-=dt;}
 P.step(dt,run.started?I:{f:0,s:0,sprint:true},WLD.W,ev);
 if(app!=='play')return;
 const eye=_v.set(P.pos.x,P.pos.y+1,P.pos.z);
 // checkpoints / orbs / finish
 WLD.cps.forEach((c,i)=>{if(i>run.cp&&Math.hypot(c.p.x-P.pos.x,c.p.z-P.pos.z)<3.6&&Math.abs(c.p.y-P.pos.y)<4.5){for(let k=run.cp+1;k<=i;k++)WLD.cps[k].got=true;run.cp=i;run.splits[i]=run.t;cpHit(i);}});
 for(const o of WLD.orbs){if(!o.got&&o.p.distanceTo(eye)<1.45){o.got=true;run.orbs++;snd.play('orb');parts.burst(o.p,40,5,[new THREE.Color(3,2.2,.6),new THREE.Color(3,3,3)],.35,.7,{drag:2.5});hudOrbs();}}
 const f=WLD.finish;if(Math.hypot(f.p.x-P.pos.x,f.p.z-P.pos.z)<4.2&&P.pos.y>f.p.y-2&&P.pos.y<f.p.y+5.5){finishRun();return;}
 // hazards
 for(const l of WLD.lasers){if(!l.on)continue;const a=_w.copy(l.A),yoff=l.g.position.y-l.y0;a.y+=yoff;const b=l.B;const d=segSeg(a.x,a.y,a.z,b.x,b.y+yoff,b.z,P.pos.x,P.pos.y+.35,P.pos.z,P.pos.x,P.pos.y+(P.crouch?.9:1.45),P.pos.z);if(d<.42){respawn('zap');return;}}
 for(const dr of WLD.drones){if(dr.cd>0)continue;const dx=P.pos.x-dr.p.x,dz=P.pos.z-dr.p.z,dy=P.pos.y+.9-dr.p.y;if(dx*dx+dz*dz<1.6*1.6&&Math.abs(dy)<1.4){let l=Math.hypot(dx,dz);let nx=dx/(l||1),nz=dz/(l||1);if(l<.05){nx=Math.sin(P.yaw);nz=Math.cos(P.yaw);}
  P.vel.set(nx*12,7,nz*12);P.state='air';P.ground=false;P.wasG=false;P.grap=null;P.knockT=.45;dr.cd=1.2;shake=Math.max(shake,.5);snd.play('knock');parts.burst(dr.p,30,6,new THREE.Color(3,.5,.2),.3,.4,{drag:3});}}
 if(P.ground&&P.gBox&&P.gBox.o.crumble){const c=WLD.crumbles.find(c=>c.box===P.gBox);if(c&&c.t<0){c.t=0;snd.play('crack');}}
 // kill height relative to the nearest part of the course
 let ny=1e9,nd=1e9;for(const r of LV.route){const d=Math.hypot(r.p[0]-P.pos.x,r.p[2]-P.pos.z);if(d<nd){nd=d;ny=r.p[1];}}if(P.pos.y<Math.min(ny-16,ny-16)||P.pos.y<LV.killY){respawn('fall');return;}
 // par + session clocks
 if(run.t>LV.par){failRun();return;}
 if(sess&&sess.left<=0){sess.left=0;endSession();return;}
 // ghost recording
 if(run.started){run.recAcc+=dt;if(run.recAcc>=1/GHZ){run.recAcc-=1/GHZ;const sc=STC[P.state]??1;run.rec.push(+P.pos.x.toFixed(2),+P.pos.y.toFixed(2),+P.pos.z.toFixed(2),+P.yaw.toFixed(2),sc===2?2*(P.wallSide||1):sc);}}
 // tips
 for(const tp of LV.tips){if(!run.tips.has(tp)&&Math.hypot(tp.p[0]-P.pos.x,tp.p[2]-P.pos.z)<tp.r&&Math.abs(tp.p[1]-P.pos.y)<5){run.tips.add(tp);hudTip(tp.text,4.2);}}}
function segSeg(ax,ay,az,bx,by,bz,cx,cy,cz,dx,dy,dz){// distance between segments AB and CD
 const ux=bx-ax,uy=by-ay,uz=bz-az,vx=dx-cx,vy=dy-cy,vz=dz-cz,wx=ax-cx,wy=ay-cy,wz=az-cz;const a=ux*ux+uy*uy+uz*uz,b=ux*vx+uy*vy+uz*vz,c=vx*vx+vy*vy+vz*vz,d=ux*wx+uy*wy+uz*wz,e=vx*wx+vy*wy+vz*wz;
 const D=a*c-b*b;let s=D>1e-8?cl((b*e-c*d)/D,0,1):0,t=c>1e-8?(b*s+e)/c:0;if(t<0){t=0;s=cl(-d/a,0,1);}else if(t>1){t=1;s=cl((b-d)/a,0,1);}
 const px=wx+ux*s-vx*t,py=wy+uy*s-vy*t,pz=wz+uz*s-vz*t;return Math.hypot(px,py,pz);}
function cpHit(i){snd.play('cp');const c=WLD.cps[i];parts.burst(c.p.clone().add(new V(0,1.7,0)),60,6,[new THREE.Color(.5,3,1.6),new THREE.Color(2.5,2.5,2.5)],.35,.8,{drag:2});
 const b=prog.best[LV.id],bs=b&&b.splits?b.splits[i]:null;const d=bs!=null?run.t-bs:null;
 $('split').innerHTML=`CP ${i+1} · ${fmt(run.t)}${d!=null?` <span class="${d<=0?'g':'r'}">${d<=0?'−':'+'}${Math.abs(d).toFixed(2)}</span>`:''}`;$('split').classList.add('on');splitT=2.4;hudCp();}
function step(dt){dt=Math.min(dt,.1);time+=dt;
 if(app==='play'){const sens=.0022*opt.sens;P.yaw-=mouse.dx*sens;P.pitch=cl(P.pitch-mouse.dy*sens,-1.52,1.52);mouse.dx=mouse.dy=0;
  let I=AP.on?apInput():readInput();acc+=dt;let n=0,first=true;while(acc>=DT&&n<12){if(!first){I={...I,jumpE:false,slideE:false,dashE:false,grapE:false};}first=false;if(AP.on&&n>0)I=apInput();
   grapTarget();fixed(DT,I);acc-=DT;n++;if(app!=='play')break;}if(n>=12)acc=0;}
 else{mouse.dx=mouse.dy=0;for(const e in edge)delete edge[e];}
 visuals(dt);}
function grapTarget(){P.grapTarget=null;let best=null,bc=Math.cos(.24);const e=_v.set(P.pos.x,P.pos.y+P.eyeH,P.pos.z);const fx=-Math.sin(P.yaw)*Math.cos(P.pitch),fy=Math.sin(P.pitch),fz=-Math.cos(P.yaw)*Math.cos(P.pitch);
 for(const g of WLD.graps){g.hot=Math.max(0,g.hot-.02);if(g.cd>0||P.grap&&P.grap.pt===g)continue;const dx=g.p.x-e.x,dy=g.p.y-e.y,dz=g.p.z-e.z,d=Math.hypot(dx,dy,dz);if(d>MV.grapR||d<3)continue;const c=(dx*fx+dy*fy+dz*fz)/d;if(c<bc)continue;
  _w.set(dx/d,dy/d,dz/d);if(WLD.W.ray(e,_w,d-1.2))continue;bc=c;best=g;}
 if(best){best.hot=1;P.grapTarget=best;}}

/* ================= visuals ================= */
const tmpA={p:new V()},tmpB={p:new V()};let speedLines=0;const lc=$('lines'),lx=lc.getContext('2d');
function visuals(dt){
 if(!WLD)return;WLD.update(time,dt);parts.update(dt);
 // menu / select attract: rival runs the course at gold pace, camera chases
 if(attract&&(app==='menu'||app==='select'||app==='over')){attract.t+=dt;const T=rivalPath.T+2.5,tm=attract.t%T;const r=pathAt(rivalPath,Math.min(tm,rivalPath.T),tmpA);const h=Math.atan2(r.dx,r.dz);
  rivalFig.g.visible=true;ghostFig.g.visible=false;rivalFig.g.position.copy(r.p);rivalFig.g.rotation.y=h+Math.PI;rivalFig.pose(tm>rivalPath.T?'idle':r.tag,tm>rivalPath.T?0:10,0,r.side,dt,time);if(rivalFig.tag)rivalFig.tag.visible=false;
  const fx=Math.sin(h),fz=Math.cos(h);const sw=Math.sin(attract.t*.21);_v.set(r.p.x-fx*5.2+fz*2.6*sw,r.p.y+2.7,r.p.z-fz*5.2-fx*2.6*sw);if(!attract.init){attract.cam.copy(_v);attract.look.copy(r.p);attract.init=true;}
  attract.cam.lerp(_v,Math.min(1,dt*2.6));attract.look.lerp(_w.copy(r.p).add(new V(fx*2.5,1.15,fz*2.5)),Math.min(1,dt*5));cam.position.copy(attract.cam);cam.lookAt(attract.look);cam.fov=62;cam.updateProjectionMatrix();
  DS.update(time,cam,r.p);VM.legsG.visible=false;VM.arms.forEach(a=>a.root.visible=false);rope.visible=false;snd.move(0,false,false,false,false);drawLines(0);return;}
 VM.arms.forEach(a=>a.root.visible=true);if(rivalFig.tag)rivalFig.tag.visible=true;
 // camera
 shake=Math.max(0,shake-dt*1.8);landDip=Math.max(0,landDip-dt*1.4);fovKick=Math.max(0,fovKick-dt*2.5);
 const sp=P.hs,sp3=P.vel.length();const bob=P.ground&&P.state==='run'?Math.sin(VM.ph*2)*.03*Math.min(1,sp/9):0;
 let roll=0;if(P.state==='wall')roll=P.wallSide*.2;else{const strafe=(P.vel.x*Math.cos(P.yaw)-P.vel.z*Math.sin(P.yaw));roll=cl(-strafe*.004,-.03,.03);}
 camRoll+=(roll-camRoll)*Math.min(1,dt*8);
 let pitchAdd=0;if(rollA>=0){rollA+=dt/.55;if(rollA>=1)rollA=-1;else pitchAdd=-TAU*(rollA<.5?2*rollA*rollA:1-Math.pow(-2*rollA+2,2)/2);}
 const s=shake*shake*.25;cam.position.set(P.pos.x+(rnd()-.5)*s,P.pos.y+P.eyeH-P.stepDip-landDip+bob+(rollA>=0?-.5*Math.sin(rollA*Math.PI):0),P.pos.z+(rnd()-.5)*s);
 cam.rotation.set(P.pitch+pitchAdd+(rnd()-.5)*s*.3,P.yaw,camRoll);
 const aspect=innerWidth/innerHeight;const kick=cl((sp3-10)*1.05,0,22)+fovKick*7;const hf=opt.fov+kick;cam.fov=2*Math.atan(Math.tan(hf*Math.PI/360)/aspect)*180/Math.PI;cam.updateProjectionMatrix();
 vmCam.rotation.set(P.pitch+pitchAdd*.0,0,camRoll*.6);VM.update(dt,P);
 DS.update(time,cam,P.pos);
 // rope
 if(P.grap){const g=P.grap.pt.p;const hand=_v.set(-.18,-.12,-.4).applyEuler(cam.rotation).add(cam.position);const d=_w.subVectors(g,hand);const L=d.length();rope.visible=true;rope.position.copy(hand).addScaledVector(d,.5);rope.scale.set(1,L,1);rope.quaternion.setFromUnitVectors(new V(0,1,0),d.normalize());}else rope.visible=false;
 // rival + ghost
 const started=run&&run.started,rt=run?run.t:0;
 if(rivalPath){const k=rivalPath.T/tierTime();const r=pathAt(rivalPath,started?rt*k:0,tmpA);rivalFig.g.visible=true;rivalFig.g.position.copy(r.p);const h=Math.atan2(r.dx,r.dz);rivalFig.g.rotation.y=h+Math.PI;
  const fin=started&&rt*k>=rivalPath.T;rivalFig.pose(!started||fin?'idle':r.tag,!started||fin?0:PACE[r.tag]/k,0,r.side,dt,time);
  // live delta vs rival: compare progress along the route
  if(started){let bi=run.prog,bd=1e9;const pts=rivalPath.pts;for(let i=Math.max(0,run.prog-30);i<Math.min(pts.length,run.prog+60);i++){const q=pts[i];const d=(q.x-P.pos.x)**2+(q.y-P.pos.y)**2*.3+(q.z-P.pos.z)**2;if(d<bd){bd=d;bi=i;}}if(bd<60)run.prog=bi;
   const myT=rivalPath.pts[run.prog].tm/k,delta=myT-rt;run.delta=delta;}}
 if(ghost&&opt.ghost&&app!=='menu'){const d=ghost.d,n=d.length/5;const fi=cl((started?rt:0)*GHZ,0,n-1.001),i=Math.floor(fi),u=fi-i,o=i*5,o2=Math.min(n-1,i+1)*5;
  ghostFig.g.visible=true;ghostFig.g.position.set(d[o]+(d[o2]-d[o])*u,d[o+1]+(d[o2+1]-d[o+1])*u,d[o+2]+(d[o2+2]-d[o+2])*u);ghostFig.g.rotation.y=d[o+3];const sc=d[o+4],gs=Math.hypot(d[o2]-d[o],d[o2+2]-d[o+2])*GHZ;
  ghostFig.pose(!started?'idle':Math.abs(sc)===2?'w':STN[sc]||'r',started?gs:0,(d[o2+1]-d[o+1])*GHZ,Math.sign(sc)||1,dt,time);const near=ghostFig.g.position.distanceTo(P.pos);ghostFig.mat.uniforms.uA.value=cl((near-1.2)/4,0,1);}
 else ghostFig.g.visible=false;
 {const near=rivalFig.g.position.distanceTo(P.pos);rivalFig.mat.uniforms.uA.value=cl((near-1.2)/4,0,1);}
 // vent steam (neon yards)
 for(const a of WLD.anim){if(a.k==='steam'&&Math.random()<.35&&a.p.distanceToSquared(cam.position)<3600)parts.emit(a.p.x+rnd(.3)-.15,a.p.y,a.p.z+rnd(.3)-.15,rnd(.4)-.2,1.2+rnd(.8),rnd(.4)-.2,.16,.15,.2,.9,2.2,-.15,.4);}
 // footsteps + slide sparks + speed dust
 if(app==='play'){if(P.ground&&P.state==='run'&&sp>1){stepAcc+=sp*dt;if(stepAcc>2.3){stepAcc=0;snd.play('step',Math.min(1,sp/11));}}
  if(P.state==='wall'){wallStepT-=dt;if(wallStepT<=0){wallStepT=.11;snd.play('wstep');}}
  if(P.state==='slide'&&sp>4&&Math.random()<.6){const c=LV.district===1?new THREE.Color(3,1.6,.5):new THREE.Color(.55,.52,.5);parts.emit(P.pos.x+rnd(.6)-.3,P.pos.y+.05,P.pos.z+rnd(.6)-.3,-P.vel.x*.2+rnd(2)-1,rnd(1.5),-P.vel.z*.2+rnd(2)-1,c.r,c.g,c.b,.12,.4,6,1);}
  if(sp3>14&&Math.random()<(sp3-14)*.08){const a=rnd(TAU),r=1.5+rnd(2);const fx=P.vel.x/sp3,fy=P.vel.y/sp3,fz=P.vel.z/sp3;parts.emit(cam.position.x+fx*12+Math.cos(a)*r,cam.position.y+fy*12+Math.sin(a)*r*.7,cam.position.z+fz*12+Math.sin(a)*r,-P.vel.x*.6,-P.vel.y*.6,-P.vel.z*.6,.9,.9,.95,.05,.6,0,0);}
  snd.move(sp3,P.state==='slide',P.state==='wall',!P.ground,true);}
 speedLines+=((app==='play'?cl((sp3-12)/14,0,1):0)+fovKick*.5-speedLines)*Math.min(1,dt*6);drawLines(speedLines);
 HINT.value+=((opt.vision?1:0)-HINT.value)*Math.min(1,dt*6);
 if(app==='play'||app==='paused')hud(dt);}
let camRoll=0;
function drawLines(k){const w=innerWidth,h=innerHeight;if(lc.width!==w||lc.height!==h){lc.width=w;lc.height=h;}lx.clearRect(0,0,w,h);if(k<.02)return;const cx=w/2,cy=h/2,R=Math.hypot(cx,cy);lx.lineCap='round';
 for(let i=0;i<46;i++){const a=rnd(TAU),r0=R*(.42+rnd(.3)),r1=r0+R*(.12+rnd(.35))*k;lx.strokeStyle=`rgba(255,255,255,${(.05+rnd(.18))*k})`;lx.lineWidth=1+rnd(2.2);lx.beginPath();lx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0);lx.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);lx.stroke();}
 const g=lx.createRadialGradient(cx,cy,R*.5,cx,cy,R);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,`rgba(255,240,230,${.08*k})`);lx.fillStyle=g;lx.fillRect(0,0,w,h);}

/* ================= HUD ================= */
const hc={};function setTxt(id,v){if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}}
function hudBuild(){setTxt('lvname',String(LI+1).padStart(2,'0')+' · '+LV.name);setTxt('lvsub',DISTRICTS[LV.district].name);hudCp();hudOrbs();
 $('targets').innerHTML=MEDALS.map((M,k)=>`<span id="tg${k}"><i style="background:${M.c}"></i>${M.n}</span><span id="tt${k}">${fmt(LV[M.k])}</span>`).reverse().join('')+`<span id="tgr" style="color:#ff6a5a">◆ ${TIERS[opt.tier].who}</span><span>${fmt(tierTime())}</span>`;}
function hudCp(){$('cpline').innerHTML=WLD.cps.map((c,i)=>`<i class="${i<=run.cp?'on':''}"></i>`).join('')+'<i class="fin"></i>';}
function hudOrbs(){setTxt('orbs',WLD.orbs.length?`◆ ${run.orbs} / ${WLD.orbs.length} ORBS`:'');}
function hudTip(t,d){$('tip').textContent=t;$('tip').classList.add('on');tipT=d;}
function banner(t,s,c,d){$('bt').textContent=t;$('bt').style.color=c||'#fff';$('bs').textContent=s||'';$('banner').classList.add('on');banT=d;}
function setFlash(a,c='#fff'){const f=$('flash');f.style.transition='none';f.style.background=c;f.style.opacity=a;void f.offsetWidth;f.style.transition='opacity .45s';f.style.opacity=0;}
function hud(dt){if(!run)return;setTxt('timer',fmt(run.t));const left=LV.par-run.t;$('parfill').style.transform=`scaleX(${cl(left/LV.par,0,1)})`;$('parfill').style.background=left<10?'#ff2a1a':'';
 setTxt('parlbl',`PAR ${fmt(Math.max(0,left),1)} LEFT`);$('parlbl').classList.toggle('warn',left<10);
 if(sess){setTxt('sess',fmtS(sess.left));$('sess').classList.toggle('warn',sess.left<60);setTxt('sscore',sess.score.toLocaleString()+' PTS');}
 for(let k=0;k<4;k++){const gone=run.t>LV[MEDALS[k].k];$('tg'+k).className=gone?'gone':'';$('tt'+k).className=gone?'gone':'';}
 let nxt=-1;for(let k=3;k>=0;k--){if(run.t<=LV[MEDALS[k].k]){nxt=k;break;}}if(nxt>=0){$('tg'+nxt).className='next';$('tt'+nxt).className='next';}
 const d=run.delta;if(run.started&&d!=null){setTxt('rivald',`${TIERS[opt.tier].who} ${d<=0?'BEHIND YOU':'AHEAD'} · ${Math.abs(d).toFixed(1)}s`);$('rivald').className=d<=0?'ah':'bh';}else setTxt('rivald',`RIVAL ${TIERS[opt.tier].who} · ${TIERS[opt.tier].n}`);
 const kmh=Math.round(P.hs*3.6);setTxt('kmh',String(kmh));$('spdbar').firstChild.style.width=cl(kmh/90*100,0,100)+'%';
 setTxt('mstate',{wall:'WALL-RUN',slide:'SLIDE',grap:'GRAPPLE',mantle:P.mantle&&P.mantle.kind==='vault'?'VAULT':'MANTLE',roll:'ROLL'}[P.state]||(P.surf?'SURF':P.dashT>0?'DASH':''));
 $('dashpip').classList.toggle('empty',!(P.dashN>0&&P.dashCD<=0));$('ready').classList.toggle('on',!run.started);
 if(tipT>0){tipT-=dt;if(tipT<=0)$('tip').classList.remove('on');}if(splitT>0){splitT-=dt;if(splitT<=0)$('split').classList.remove('on');}if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}
 // grapple reticle
 const rt=$('reticle');if(P.grapTarget&&!P.grap){_v.copy(P.grapTarget.p).project(cam);if(_v.z<1){rt.style.transform=`translate(${(_v.x*.5+.5)*innerWidth}px,${(-_v.y*.5+.5)*innerHeight}px)`;rt.classList.add('on');}else rt.classList.remove('on');}else rt.classList.remove('on');}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(app!=='play'&&app!=='paused'&&app!=='done')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;Rr.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.8));fxStack=null;fxSize='';if(DS&&DS.sun){DS.sun.castShadow=q>0;DS.sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(DS.sun.shadow.map){DS.sun.shadow.map.dispose();DS.sun.shadow.map=null;}}Rr.shadowMap.needsUpdate=true;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){if(!DS)return;const w=innerWidth,h=innerHeight;if(Rr.domElement.width!==Math.floor(w*Rr.getPixelRatio())||Rr.domElement.height!==Math.floor(h*Rr.getPixelRatio()))Rr.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();parts.U.uScale.value=h*Rr.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 frameN++;if(DS.sun.castShadow&&(gfx>=2||frameN%2===0||frameN<3))Rr.shadowMap.needsUpdate=true;
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(Rr,scene,cam,{...DPOST[dCur],grain:.025,aoStrength:.7,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.bloom)fxStack.bloom.strength=DPOST[dCur].bloom+speedLines*.15;
 if(fxStack.composer)fxStack.render();else{Rr.autoClear=true;Rr.render(scene,cam);if(app==='play'||app==='paused'){Rr.autoClear=false;Rr.clearDepth();Rr.render(vmScene,vmCam);Rr.autoClear=true;}}}

/* ================= menus ================= */
function segSet(id,v){const el=$(id);if(!el)return;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(+b.dataset.v)===String(v)));}
const seg=(id,key,cb)=>{const el=$(id);segSet(id,opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>{opt[key]=+b.dataset.v;segSet(id,opt[key]);saveOpt();snd.play('click');cb&&cb(opt[key]);});};
seg('o-sess','sess');seg('o-tier','tier');seg('o-ghost','ghost');seg('o-sens','sens');seg('o-fov','fov');seg('o-vision','vision');seg('o-vol','vol',v=>snd.setVol(v));seg('o-mus','mus',v=>snd.setMusic(v));
$('go').onclick=()=>{snd.init();newSession();toSelect();};$('endsess').onclick=()=>endSession();$('selmenu').onclick=toMenu;
$('resume').onclick=()=>pause(false);$('prestart').onclick=()=>{pause(false);resetRun();};$('plevels').onclick=()=>toSelect();
$('dnext').onclick=()=>startLevel(LI+1);$('dretry').onclick=()=>startLevel(LI);$('dlevels').onclick=()=>toSelect();
$('again').onclick=()=>{newSession();toSelect();};$('omenu').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const m=a.medals||[0,0,0,0];const body=`Game: Runline\nScore: ${a.pts||0}\nCourses finished: ${a.courses||0} · Medals P${m[3]} G${m[2]} S${m[1]} B${m[0]} · Rival wins: ${a.rivals||0}\nSession: ${a.len||''} min · Rival ${a.tier||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore('runline',a.pts||0,body);};

/* ================= boot + loop ================= */
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}
async function boot(){try{await Promise.race([Promise.all([document.fonts.load("400 80px Anton"),document.fonts.load("700 30px 'JetBrains Mono'")]),new Promise(r=>setTimeout(r,1500))]);}catch(e){}
 toMenu();requestAnimationFrame(loop);}
boot();

/* ================= test hooks ================= */
window.RUNLINE={get state(){return app;},get app(){return app;},step,render,start:(o={})=>{if(o.sess)opt.sess=o.sess;if(o.tier!=null)opt.tier=o.tier;newSession();startLevel(o.level??0,{noLock:true});},startLevel:(i)=>startLevel(i,{noLock:true}),
 toMenu,toSelect,endSession,resetRun,respawn,pause,P,MV,get LV(){return LV;},get LI(){return LI;},LEVELS,get W(){return WLD;},get run(){return run;},get sess(){return sess;},get prog(){return prog;},get ghost(){return ghost;},get rivalPath(){return rivalPath;},get lastResult(){return lastResult;},
 setClock(s){if(sess)sess.left=s;},setPar(s){if(LV)LV.par=s;},setRunTime(t){if(run){run.t=t;run.started=true;}},unlockAll(){unlockAll=true;},autopilot(on=true){AP.on=on;},AP,keys,edge,input:{jump(){edge.jump=true;},slide(){edge.slide=true;},dash(){edge.dash=true;},grap(){edge.grap=true;}},
 teleport(x,y,z,yaw){P.reset(new V(x,y,z),yaw??P.yaw);},finish(){const f=WLD.finish;P.reset(f.p.clone().add(new V(0,.2,0)),f.yaw);run.started=true;},setQuality:applyQuality,get gfx(){return gfx;},scene,cam,R:Rr,snd,parts,setVision,opt,
 rival:()=>rivalFig,ghostFig:()=>ghostFig,tierTime};
