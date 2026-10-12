// SIDEWAYS — full 3D drift game. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {TRACKS,sampleTrack,frame,sdiff,nearest} from './trackdata.js';
import {Car,stepCar,buildParams,carCar,TICK} from './physics.js';
import {CARS,UPS,upPrice,ANGLE_MAX,TUNE,PAINTS,RIMS,RIM_STYLES,LIVERIES,MEDALS,medalFor,DIFFS,defaultOwn,loadSave,writeSave} from './data.js';
import {makeCar,setLook,disposeCar} from './models.js';
import {buildWorld,updateLamps} from './world.js';
import {Smoke,Sparks,Skids,Rain,makeFlame,NL} from './fx.js';
import {Lead,Bot} from './ai.js';
import {Scorer} from './score.js';
import {Sound} from './sound.js';
import {ctex,merge,M4,cl,lerp} from './util.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),rnd=(a=1)=>Math.random()*a;
const ID='sideways';
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
const num=n=>Math.round(n).toLocaleString('en-US');

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance',antialias:false});
let gfx=quality();R.setPixelRatio(Math.min(devicePixelRatio,gfx>=2?1.5:1));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(62,1,.1,6000);
const smoke=new Smoke(scene,3600),sparks=new Sparks(scene,1800),skids=new Skids(scene,7000);let rain=null;
const snd=new Sound();

/* ================= state ================= */
let save=loadSave(),autoOn=false;
let opt={mode:0,track:'pass',time:2,diff:1,assist:60,auto:1};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_sideways_opt'))||{});}catch(e){}
let app='menu',phase='cd',W=null,venue=null,car=null,carMesh=null,lead=null,leadMesh=null,attract=null,bot=null,botOn=false;
let autoP=null,clock=120,cdT=3,lastBeep=4,time=0,acc=0,endT=0,camMode=0,shake=0,lastAward=null,overT=0,wrongT=0,stuckT=0,menuA=0,garA=.6,garDrag=null;
const scorer=new Scorer();
const flame=makeFlame();scene.add(flame);const popLight=new THREE.PointLight(0xff8a30,0,10,2);scene.add(popLight);
const head=new THREE.SpotLight(0xfff0d8,0,110,.52,.55,1.8);head.castShadow=false;scene.add(head,head.target);
const tailL=new THREE.PointLight(0xff2010,0,6,2);scene.add(tailL);
const leadHead=new THREE.SpotLight(0xfff0d8,0,80,.52,.55,1.8);scene.add(leadHead,leadHead.target);
const clipVisit=[],inZone=[];

/* ================= venue ================= */
function loadVenue(id,force){if(venue===id&&W&&!force)return;const def=TRACKS.find(t=>t.id===id)||TRACKS[0];
 if(W){scene.remove(W.group);W.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});if(W.env)W.env.dispose();}
 W=buildWorld(R,def,gfx);venue=def.id;scene.add(W.group);scene.fog=W.fog;scene.environment=W.env;scene.background=new THREE.Color(W.time.fog);
 if(rain){scene.remove(rain.mesh);rain=null;}if(def.time==='rain'){rain=new Rain(scene,gfx>=2?6000:3000);}
 const a=W.time.smokeAmb;smoke.U.uAmb.value.setRGB(a[0],a[1],a[2]);smoke.U.uSunC.value.set(def.time==='sunset'?0x553322:0x000000);
 smoke.clear();skids.clear();sparks.clear();
 // lot: a figure-eight path for the showcase car
 W.path=W.B||sampleTrack({pts:[[-35,-17],[-53,0],[-35,17],[0,0],[35,-17],[53,0],[35,17],[0,0]],w:6,shoulder:0});
 W.track=W.B?TRACKS.find(t=>t.id===id):null;miniBase=null;fx=null;applyShadow();updateLamps(W,new V(W.spawn.x,0,W.spawn.z),0,true);}

/* ================= cars ================= */
function own(){return save.owned[save.sel];}
function spec(){return CARS.find(c=>c.id===save.sel)||CARS[0];}
function buildPlayer(){if(carMesh){scene.remove(carMesh);disposeCar(carMesh);}const sp=spec(),o=own();carMesh=makeCar(sp,o.look,7+CARS.indexOf(sp)*11);scene.add(carMesh);
 const p=buildParams(sp,o);if(!car)car=new Car(p);else car.p=p;car.assist=opt.assist/100;car.auto=!!opt.auto;car.cyl=sp.cyl;}
function buildLead(){if(leadMesh)return;const sp=CARS[3];leadMesh=makeCar(sp,{paint:'#2b3038',rims:'#d4a63a',rim:1,livery:2,liv:'#3de0ff'},1);scene.add(leadMesh);leadMesh.visible=false;}
buildLead();

/* ================= flow ================= */
function persistOpt(){try{localStorage.setItem('pxd_sideways_opt',JSON.stringify(opt));}catch(e){}}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);persistOpt();snd.init();
 const def=TRACKS.find(t=>t.id===opt.track)||TRACKS[0];if(!def.ribbon&&opt.mode===1)opt.mode=0;
 loadVenue(def.id);buildPlayer();scorer.reset();smoke.clear();skids.clear();sparks.clear();
 const s=W.spawn;car.reset(s.x,s.z,s.yaw,0);car.i=s.i;placeY(car);
 lead=null;leadMesh.visible=false;if(opt.mode===1&&W.B){lead=new Lead(W.B,DIFFS[opt.diff]);const f=frame(W.B,car.x,car.z,car.i,{});lead.reset((f.s+22)%W.B.len);leadMesh.visible=true;}
 attract=null;bot=botOn?new Bot(W.B||W.path):null;autoP=autoOn&&W.B?new Lead(W.B,{pace:.95,angle:1.15,gap:9}):null;if(autoP){const f=frame(W.B,car.x,car.z,car.i,{});autoP.reset(f.s);autoP.wait=false;}
 clock=opt.time*60;phase='cd';cdT=3;lastBeep=4;acc=0;wrongT=0;stuckT=0;endT=0;camSnap=true;for(const c of W.clips){c.hit=0;}clipVisit.length=0;inZone.length=0;
 resetCones();app='run';showOnly('hud');document.body.classList.add('playing');$('combo').className='';$('pops').innerHTML='';$('tandem').hidden=!lead;
 setTxt($('trk'),def.name+(lead?' · TANDEM':''),'trk');}
function placeY(c){if(W.B){const f=frame(W.B,c.x,c.z,c.i,{});c.i=f.i;c.y=f.y;}else c.y=0;}
function toMenu(){app='menu';showOnly('menu');document.body.classList.remove('playing','ingarage');snd.mute();
 loadVenue(opt.track);if(!carMesh)buildPlayer();startAttract();refreshMenu();}
function startAttract(){// the showcase lead car drifts the venue while the camera orbits
 attract=new Lead(W.path,{pace:.92,angle:1.1,gap:10});attract.reset(0);attract.wait=false;leadMesh.visible=true;if(carMesh)carMesh.visible=false;lead=null;}
function showOnly(id){for(const k of['menu','hud','over','pause','garage'])$(k).hidden=k!==id;$('keys').hidden=id!=='menu';}
function endRun(){phase='end';endT=0;snd.play('end');scorer.bank();popMsg('TIME!','info');}
function showOver(){app='over';showOnly('over');document.body.classList.remove('playing');snd.mute();overT=0;
 const pts=scorer.total,mins=opt.time,m=medalFor(pts,mins),bonus=[0,400,1000,2200,4000][m+1]*(mins/2)*(lead?1.25:1),earned=Math.round(pts/30+bonus);
 save.money+=earned;save.runs=(save.runs||0)+1;const bk=opt.track+'_'+opt.time+(lead?'_t':'');const pb=pts>(save.best[bk]||0);if(pb)save.best[bk]=pts;writeSave(save);
 $('oeye').textContent=`${(TRACKS.find(t=>t.id===opt.track)||{}).name} · ${opt.time} MIN${lead?' · TANDEM '+DIFFS[opt.diff].n:''}${pb&&pts>0?' · NEW BEST':''}`;
 $('ores').textContent=num(pts);
 $('medal').innerHTML=m>=0?`<i style="background:${MEDALS[m].c};color:${MEDALS[m].c}"><span style="color:#000">${'BSGP'[m]}</span></i><span style="color:${MEDALS[m].c}">${MEDALS[m].n} MEDAL</span>`:`<span style="color:var(--mut)">NO MEDAL · ${num(MEDALS[0].ppm*mins)} FOR BRONZE</span>`;
 if(m>=0)snd.play('medal');
 const rows=[['BEST COMBO',num(scorer.bestCombo)],['LONGEST DRIFT',scorer.longest.toFixed(1)+' s'],['MAX ANGLE',Math.round(scorer.maxAngle)+'°'],['TOP SPEED',Math.round(scorer.topKmh)+' km/h'],['DRIFTS',scorer.drifts],['CLIPS',scorer.clips],['TIME SIDEWAYS',Math.round(100*scorer.driftT/Math.max(1,scorer.driveT))+'%'],['COMBOS LOST',scorer.crashes]];
 if(lead)rows.push(['TANDEM TIME',scorer.tandemT.toFixed(1)+' s']);if(rows.length%2)rows.push(['','']);
 let h='';for(let i=0;i<rows.length;i+=2)h+=`<tr><td>${rows[i][0]}</td><td>${rows[i][1]}</td><td>${rows[i+1][0]}</td><td>${rows[i+1][1]}</td></tr>`;$('stats').innerHTML=h;
 const tok=award(pts,m>=0,m);$('otok').innerHTML=`<b>+$${num(earned)}</b> EARNED · BANK $${num(save.money)} · +${tok} TOKENS · BEST ${num(best())} PTS`;
 if(lead)leadMesh.visible=false;}
function award(pts,won,m){lastAward={pts,won,medal:m>=0?MEDALS[m].n:'none',combo:scorer.bestCombo,track:opt.track,time:opt.time,tandem:!!lead,car:spec().name};
 const tok=5+Math.min(60,pts/6000|0);addRound(tok,won);saveBest(ID,pts);return tok;}
function best(){return bestScore(ID);}
function pause(on){if(on&&app==='run'){app='paused';showOnly('pause');document.body.classList.remove('playing');snd.mute();}else if(!on&&app==='paused'){app='run';showOnly('hud');document.body.classList.add('playing');}}
function resetCar(){if(!car)return;scorer.lose('RESET');if(W.B){const B=W.B,i=(nearest(B,car.x,car.z,car.i)-4+B.n)%B.n;car.reset(B.x[i],B.z[i],Math.atan2(B.tx[i],B.tz[i]));car.i=i;}else{const s=W.spawn;car.reset(s.x,s.z,s.yaw);}placeY(car);camSnap=true;popMsg('RESET','info');}

/* ================= input ================= */
const keys={},edge={};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(app==='run')pause(true);else if(app==='paused')pause(false);else if(app==='garage')closeGarage();}
 if(app!=='run')return;
 if(e.code==='KeyC')cycleCam();if(e.code==='KeyR'&&phase==='drive')resetCar();
 if(e.code==='KeyM'){car.auto=!car.auto;opt.auto=car.auto?1:0;persistOpt();popMsg(car.auto?'AUTOMATIC':'MANUAL · Q/E SHIFT','info');}
 if(e.code==='KeyE'&&!car.auto)car.ctrl.up=1;if(e.code==='KeyQ'&&!car.auto)car.ctrl.dn=1;});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
const any=(...a)=>a.some(k=>keys[k]);let steerIn=0,thrIn=0,brkIn=0;const pp={};
function cycleCam(){camMode=(camMode+1)%3;camSnap=true;setTxt($('cam'),['CHASE','HOOD','BUMPER'][camMode],'cam');}
function readInput(dt){const k=car.ctrl;const l=any('KeyA','ArrowLeft'),r=any('KeyD','ArrowRight');const ts=(l?1:0)-(r?1:0);
 const rate=ts===0?6:Math.sign(ts)!==Math.sign(steerIn)&&steerIn!==0?7:3.4;steerIn+=cl(ts-steerIn,-rate*dt,rate*dt);
 thrIn+=cl((any('KeyW','ArrowUp')?1:0)-thrIn,-dt*10,dt*7);brkIn+=cl((any('KeyS','ArrowDown')?1:0)-brkIn,-dt*10,dt*8);
 k.steer=steerIn;k.thr=thrIn;k.brk=brkIn;k.hb=any('Space')?1:0;k.clutch=any('ShiftLeft','ShiftRight')?1:0;
 const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;
 if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.12?(v-Math.sign(v)*.12)/.88:0;const sx=dz(ax[0]||0);if(sx)k.steer=-Math.sign(sx)*Math.pow(Math.abs(sx),1.3);
  const rt=bt[7]?.value||0,lt=bt[6]?.value||0;if(rt>.03)k.thr=rt;if(lt>.03)k.brk=lt;if(bt[0]?.pressed)k.hb=1;if(bt[2]?.pressed)k.clutch=1;
  const ed=(i,n)=>{const p=!!bt[i]?.pressed,was=pp[n];pp[n]=p;return p&&!was;};
  if(ed(5,'rb')&&!car.auto)k.up=1;if(ed(4,'lb')&&!car.auto)k.dn=1;if(ed(3,'y'))cycleCam();if(ed(8,'bk')&&phase==='drive')resetCar();if(ed(9,'st'))pause(app==='run');}}
function padMenu(){const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(!gp)return;const bt=gp.buttons,ed=(i,n)=>{const p=!!bt[i]?.pressed,was=pp[n];pp[n]=p;return p&&!was;};
 if(app==='menu'&&ed(0,'ma'))start();else if(app==='over'&&ed(0,'oa'))start();else if(app==='paused'&&ed(9,'st'))pause(false);}

/* ================= simulation ================= */
const tv=new V(),tv2=new V();
function stepRun(dt){
 if(phase==='cd'){cdT-=dt;const n=Math.ceil(cdT);if(n!==lastBeep&&n>0){lastBeep=n;snd.play('beep',0);}
  if(cdT<=0){phase='drive';snd.play('beep',1);popMsg('GO!','info');}}
 else if(phase==='drive'){clock-=dt;if(clock<=0){clock=0;endRun();}}
 else if(phase==='end'){endT+=dt;if(endT>2.2){showOver();return;}}
 if(bot&&phase!=='cd')bot.drive(car,dt);else readInput(dt);
 if(phase==='cd'){car.ctrl.clutch=1;car.ctrl.hb=1;}
 if(phase==='end'){car.ctrl.thr=0;car.ctrl.brk=.6;car.ctrl.steer*=.9;}
 acc+=dt;let n=0;let hit=null;const pS=W.B?frame(W.B,car.x,car.z,car.i,{}).s:null;
 if(autoP){if(lead)lead.update(dt,pS,phase!=='cd',car.speed);if(lead)autoP.follow(dt,(lead.s-9+W.B.len)%W.B.len,lead.v);else autoP.update(dt,null,phase!=='cd',99);const A=autoP,c=car;c.x=A.x;c.z=A.z;c.y=A.y;c.yaw=A.yaw;c.vx=A.vx;c.vz=A.vz;c.speed=Math.hypot(A.vx,A.vz);c.beta=A.beta;c.u=c.speed*Math.cos(c.beta);c.w=c.speed*Math.sin(c.beta);c.wF=c.u/.32;c.wR=(c.u+(Math.abs(A.a)>8?9:0))/.32;c.steerA=c.beta*.85;c.i=A.i;c.rpm=Math.min(c.p.red,2500+c.speed*160);c.ctrl.thr=Math.abs(A.a)>8?.8:.5;c.wallL=c.wallR=4;acc=0;}
 while(!autoP&&acc>=TICK&&n<10){stepCar(car,W);if(car.hit&&(!hit||car.hit.vn>hit.vn))hit=car.hit;for(const e of car.events)carEvent(e);
  if(lead){lead.update(TICK,pS,phase!=='cd',car.speed);const imp=carCar(car,lead);if(imp>2.5)hit={vn:imp,vt:0,x:(car.x+lead.x)/2,z:(car.z+lead.z)/2,nx:0,nz:0,car:true};}
  acc-=TICK;n++;}if(n>=10)acc=0;
 if(hit)wallHit(hit);
 // wrong way + stuck
 let wrong=false;if(W.B&&car.speed>4){const i=car.i,dot=(car.vx*W.B.tx[i]+car.vz*W.B.tz[i])/car.speed;if(dot<-.35)wrongT+=dt;else wrongT=Math.max(0,wrongT-dt*2);wrong=wrongT>.8;}else wrongT=Math.max(0,wrongT-dt);
 if(phase==='drive'&&car.speed<1.5&&(car.ctrl.thr>.5||car.ctrl.brk>.5))stuckT+=dt;else stuckT=0;
 // scoring
 if(phase==='drive'){const ext=.9+1.3*Math.abs(Math.sin(car.beta));const o={wrongWay:wrong,wallDist:(W.B?Math.min(car.wallL,car.wallR):car.wallL+.9)-ext};
  if(lead){const gap=sdiff(W.B,lead.s,pS),dx=lead.x-car.x,dz=lead.z-car.z,d=Math.hypot(dx,dz);const ad=Math.abs(lead.beta-car.beta)*180/Math.PI;const both=Math.abs(lead.a)>10;
   o.lead={ok:gap>0&&d<DIFFS[opt.diff].gap+6&&both&&Math.sign(lead.beta)===Math.sign(car.beta),dist:d,max:DIFFS[opt.diff].gap+6,angDiff:ad,gap};tandemHud(o.lead);}
  scorer.update(dt,car,o);
  // clipping zones
  const rx=car.x-Math.sin(car.yaw)*1.4,rz=car.z-Math.cos(car.yaw)*1.4;
  W.clips.forEach((c,i)=>{const d=Math.hypot(rx-c.x,rz-c.z),inn=d<c.r+.6;if(inn&&!inZone[i]){clipVisit[i]=(clipVisit[i]||0)+1;if(scorer.clip(i+':'+clipVisit[i],c.kind)){c.hit=1;}}inZone[i]=inn;});
  for(const e of scorer.events)scoreEvent(e);
  setMsg(wrong?'WRONG WAY':stuckT>2.5?'PRESS R TO RESET':'',wrong);}
 else scorer.update(0,car,{});
 if(W.cones)stepCones(dt);}
function carEvent(e){if(e[0]==='pop'){if(Math.random()<.85){flameT=.07+rnd(.05);snd.play('pop',Math.min(1,e[1]));}}else if(e[0]==='bov')snd.play('bov',Math.min(1,e[1]+.3));else if(e[0]==='shift')snd.play('shift');}
let flameT=0;
function wallHit(h){const p=tv.set(h.x,car.y+.5,h.z);const big=h.vn>4.2;
 const n=Math.min(90,(h.vn*6+h.vt*1.5)|0);for(let i=0;i<n;i++){const s=3+rnd(9);sparks.emit(p.x,p.y-.2+rnd(.4),p.z,car.vx*.6+(rnd(2)-1)*s+h.nx*s*.5,1+rnd(5),car.vz*.6+(rnd(2)-1)*s+h.nz*s*.5,3.5,1.9,.7,.16+rnd(.12),.3+rnd(.5),11);}
 if(big){shake=Math.min(1,shake+h.vn*.06);snd.play('hit',h.vn);if(phase==='drive')scorer.lose(h.car?'CONTACT':'WALL');}
 else if(h.vt>3&&Math.random()<.5)snd.play('hit',1);scrapeT=.15;}
let scrapeT=0;
function scoreEvent(e){if(e[0]==='bank'){popMsg(`+${num(e[1])}`,'bank');snd.play('bank');$('combo').classList.remove('lost');}
 else if(e[0]==='lost'){popMsg(`${e[2]} · −${num(e[1])}`,'lost');snd.play('lost');const c=$('combo');c.classList.add('lost');lostT=1.2;lostVal=e[1];}
 else if(e[0]==='clip'){popMsg(`CLIP +${num(e[1])}`,'clip');snd.play('clip');}}
let lostT=0,lostVal=0;

/* ================= cones (lot) ================= */
function resetCones(){if(!W.cones)return;for(const c of W.cones)Object.assign(c,{x:c.hx,z:c.hz,y:0,vx:0,vy:0,vz:0,rx:0,rz:0,wr:0,down:false,t:0});}
const cm4=new THREE.Matrix4(),cq=new THREE.Quaternion(),ce=new THREE.Euler();
function stepCones(dt){const sy=Math.sin(car.yaw),cy=Math.cos(car.yaw);W.cones.forEach((c,i)=>{const dx=c.x-car.x,dz=c.z-car.z,lx=dx*sy+dz*cy,ly=dx*cy-dz*sy;
  if(!c.down&&Math.abs(lx)<2.3&&Math.abs(ly)<1.1){c.down=true;c.t=0;c.vx=car.vx*1.05+(rnd(2)-1)*2;c.vz=car.vz*1.05+(rnd(2)-1)*2;c.vy=2.5+car.speed*.12;c.wr=6+rnd(8);snd.play('cone');}
  if(c.down){c.t+=dt;c.vy-=9.8*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=c.vz*dt;c.rx+=c.wr*dt;if(c.y<0){c.y=0;c.vy*=-.3;c.vx*=.6;c.vz*=.6;c.wr*=.6;c.rx=Math.PI/2*Math.sign(Math.sin(c.rx)||1);}
   if(c.t>9)Object.assign(c,{x:c.hx,z:c.hz,y:0,vx:0,vy:0,vz:0,rx:0,down:false});}
  ce.set(c.rx,0,c.rz||0);cq.setFromEuler(ce);cm4.compose(tv.set(c.x,c.y,c.z),cq,tv2.set(1,1,1));W.coneMesh.setMatrixAt(i,cm4);});W.coneMesh.instanceMatrix.needsUpdate=true;}

/* ================= visuals ================= */
const fwdV=new V(),leftV=new V(),wp=new V();let lastSkid=[null,null,null,null];
function poseMesh(m,x,y,z,yaw,pitchSlope,rollV,pitchV,steer,spinF,spinR,dt){const u=m.userData;m.position.set(x,y,z);m.rotation.set(-Math.atan(pitchSlope),yaw,0,'YXZ');
 u.body.rotation.set(pitchV,0,rollV);u.body.position.y=Math.max(-.03,Math.min(.03,pitchV*.2));
 for(const w of u.wheels){if(w.front)w.piv.rotation.y=steer;const a=w.front?spinF:spinR;w.spin.rotation.x=w.right?-a:a;}}
let spinF=0,spinR=0,lspin=0;
function carVisuals(dt){const c=car,m=carMesh,u=m.userData;spinF+=c.wF*dt;spinR+=c.wR*dt;
 const sl=(c.pgx*Math.sin(c.yaw)+c.pgz*Math.cos(c.yaw));
 poseMesh(m,c.x,c.y,c.z,c.yaw,sl,c.roll,c.pitch,c.steerA,spinF,spinR,dt);
 // brake / reverse lights, headlights
 u.tail.emissiveIntensity=1.4+c.ctrl.brk*4+(c.gear<0?2:0);u.head.emissiveIntensity=W.time.headI>.5?2.4:1.2;
 fwdV.set(Math.sin(c.yaw),0,Math.cos(c.yaw));leftV.set(Math.cos(c.yaw),0,-Math.sin(c.yaw));
 head.position.set(c.x,c.y+.75,c.z).addScaledVector(fwdV,u.zF-.1);head.target.position.copy(head.position).addScaledVector(fwdV,20).add(tv.set(0,-1.4,0));head.intensity=80*W.time.headI;
 tailL.position.set(c.x,c.y+.6,c.z).addScaledVector(fwdV,u.zR-.4);tailL.intensity=(.35+c.ctrl.brk*1.4)*(W.time.headI>.5?1:.3);
 // exhaust flame
 if(flameT>0){flameT-=dt;flame.visible=true;const ep=tv.copy(u.exhaust).applyEuler(m.rotation).add(m.position);flame.position.copy(ep);flame.rotation.set(0,c.yaw,0);flame.scale.setScalar(.7+rnd(.8));popLight.position.copy(ep);popLight.intensity=60+rnd(60);
  if(Math.random()<.5)sparks.emit(ep.x,ep.y,ep.z,-fwdV.x*6+rnd(2)-1,rnd(1.5),-fwdV.z*6+rnd(2)-1,3,1.2,.3,.12,.25,2);}
 else{flame.visible=false;popLight.intensity*=.5;}
 // tyre smoke + skids from each wheel: slip speed at the contact patch
 const p=c.p,R=.32,rearLat=c.w-c.r*p.b,frontLat=c.w+c.r*p.a;const rs=Math.hypot(c.wR*R-c.u,rearLat),fs=Math.hypot(c.wF*R-c.u,frontLat*Math.abs(Math.sin(c.slipF))*1.2);
 const tint=W.def.time==='sunset'?[1,.95,.9]:W.def.time==='rain'?[1.15,1.15,1.2]:[1,1,1.1];
 for(let k=0;k<4;k++){const front=k<2,side=k%2?-1:1,ss=front?fs*.6:rs;const lx=side*u.tw,lz=front?p.a:-p.b;wp.set(c.x+fwdV.x*lz+leftV.x*lx,c.y+.03,c.z+fwdV.z*lz+leftV.z*lx);
  const amt=ss-3;if(amt>0&&c.speed>1.5||(!front&&c.wR*R-c.u>4)){const nE=Math.min(5,amt*dt*(W.def.time==='rain'?1.5:3.2)*(gfx>=1?1:.5))+(Math.random()<(amt*dt*3%1)?1:0);
   for(let e=0;e<nE;e++)smoke.emit(wp.x+rnd(.4)-.2,wp.y+.25,wp.z+rnd(.4)-.2,c.vx*.25+rnd(2)-1,.4+rnd(.8),c.vz*.25+rnd(2)-1,.9+rnd(.5),4.5+rnd(3)+Math.min(4,amt*.15),2+rnd(2.2),W.def.time==='rain'?.3:.4,tint[0],tint[1],tint[2]);}
  const sk=front?(Math.abs(c.slipF)>.22&&c.speed>5?.35:0):amt>1?Math.min(.6,amt*.06):0;const last=lastSkid[k];
  if(sk>0){if(last)skids.add(last.x,last.y,last.z,wp.x,wp.y,wp.z,.11,last.a,sk);lastSkid[k]={x:wp.x,y:wp.y,z:wp.z,a:sk};}else lastSkid[k]=null;}
 skids.flush();
 // sound
 if(snd.ac){snd.engine(0,c.rpm,c.ctrl.thr*(c.shiftT>0?0:1),c.boost/Math.max(.01,c.p.boostMax||1)*(c.p.boostMax>0?1:0),c.cyl||4,app==='run',c.rpm>c.p.red);
  snd.tyres(cl((rs-3)/9,0,1)*(app==='run'?1:0),scrapeT>0?car.speed:0,c.speed,false,W.def.time==='rain'&&app==='run');}scrapeT-=dt;}
function leadVisuals(L,dt){const m=leadMesh;lspin+=L.v/.32*dt;poseMesh(m,L.x,L.y,L.z,L.yaw,0,Math.sin(time*7)*.004+cl(L.a*.0015,-.05,.05),0,L.steer*.55,lspin,lspin*1.3,dt);
 const u=m.userData;u.head.emissiveIntensity=W.time.headI>.5?2.4:1.2;u.tail.emissiveIntensity=1.6;
 fwdV.set(Math.sin(L.yaw),0,Math.cos(L.yaw));leftV.set(Math.cos(L.yaw),0,-Math.sin(L.yaw));
 leadHead.position.set(L.x,L.y+.75,L.z).addScaledVector(fwdV,2);leadHead.target.position.copy(leadHead.position).addScaledVector(fwdV,20).add(tv.set(0,-1.4,0));leadHead.intensity=70*W.time.headI;
 const amt=Math.abs(L.a)>8&&L.v>6?Math.abs(L.a)/40*L.v*.35:0;
 for(const side of[1,-1]){wp.set(L.x-fwdV.x*1.3+leftV.x*side*.78,L.y+.03,L.z-fwdV.z*1.3+leftV.z*side*.78);const nE=Math.min(4,amt*dt*3)+(Math.random()<(amt*dt*3%1)?1:0);
  for(let e=0;e<nE;e++)smoke.emit(wp.x,wp.y+.25,wp.z,L.vx*.25+rnd(2)-1,.4+rnd(.8),L.vz*.25+rnd(2)-1,.9,5+rnd(3),2.2+rnd(2),.32,1,1,1.08);
  const k=side>0?2:3,last=lastLeadSkid[k];if(amt>3){if(last)skids.add(last.x,last.y,last.z,wp.x,wp.y,wp.z,.11,.4,.4);lastLeadSkid[k]={x:wp.x,y:wp.y,z:wp.z};}else lastLeadSkid[k]=null;}
 if(snd.ac)snd.engine(1,2500+L.v*150+Math.abs(L.a)*60,.7,0,6,app==='run'&&!!lead,false);}
const lastLeadSkid=[];

/* ================= cameras ================= */
const cpos=new V(),clook=new V(),want=new V(),look=new V();let camSnap=true,fov=62;
function camRun(dt){const c=car,u=carMesh.userData;
 if(camMode===0){const vh=c.speed>3?Math.atan2(c.vx,c.vz):c.yaw;let d=vh-c.yaw;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;const yaw=c.yaw+d*.62;
  const dist=6.4+u.len*.18+c.speed*.03,hgt=2.15+c.speed*.006;want.set(c.x-Math.sin(yaw)*dist,c.y+hgt,c.z-Math.cos(yaw)*dist);look.set(c.x+Math.sin(yaw)*3,c.y+1,c.z+Math.cos(yaw)*3);
  if(W.B){const f=frame(W.B,want.x,want.z,c.i,{});want.y=Math.max(want.y,f.y+1.2);}
  const k=1-Math.exp(-dt*(camSnap?999:7)),kl=1-Math.exp(-dt*(camSnap?999:12));cpos.lerp(want,k);clook.lerp(look,kl);if(camSnap){cpos.copy(want);clook.copy(look);}
  cam.position.copy(cpos);cam.lookAt(clook);fov+=(60+c.speed*.28-fov)*Math.min(1,dt*3);}
 else{const local=camMode===1?tv.set(0,1.22,.25):tv.set(0,.58,u.zF+.05);carMesh.updateMatrixWorld();u.body.updateMatrixWorld();const wpos=local.applyMatrix4(u.body.matrixWorld);cam.position.copy(wpos);
  const tgt=tv2.set(0,camMode===1?1.05:.55,40).applyMatrix4(u.body.matrixWorld);cam.lookAt(tgt);fov+=((camMode===1?68:72)+c.speed*.2-fov)*Math.min(1,dt*3);cpos.copy(cam.position);clook.copy(tgt);}
 camSnap=false;cam.fov=fov;
 shake=Math.max(0,shake-dt*1.8);const s=shake*shake*.35+(car.speed>25?Math.min(.025,(car.speed-25)*.0008):0)*(camMode===0?1:.5);cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.position.z+=(Math.random()-.5)*s;}
const orbOff=new V(0,3,-8);
function camOrbit(dt,p,yaw,r,h,side=0){menuA+=dt*.12;const a=yaw+Math.PI*.8+Math.sin(menuA)*.9;tv.set(-Math.sin(a)*r,h,-Math.cos(a)*r);const k=1-Math.exp(-dt*(camSnap?999:1.5));orbOff.lerp(tv,k).setLength(Math.hypot(r,h));
 want.copy(p).add(orbOff);if(W.B){const f=frame(W.B,want.x,want.z,null,{});want.y=Math.max(want.y,f.y+1.4);}cpos.copy(want);look.set(p.x+Math.cos(a)*side,p.y+.8,p.z-Math.sin(a)*side);clook.copy(look);camSnap=false;cam.position.copy(cpos);cam.lookAt(clook);cam.fov=46;}

/* ================= HUD ================= */
const hc={};function setTxt(el,v,key){if(hc[key]!==v){hc[key]=v;el.textContent=v;}}
function popMsg(t,cls){const d=document.createElement('div');d.className=cls;d.textContent=t;$('pops').prepend(d);setTimeout(()=>d.remove(),1800);while($('pops').children.length>3)$('pops').lastChild.remove();}
function setMsg(t,warn){setTxt($('msg'),t,'msg');$('msg').classList.toggle('warn',!!warn&&!!t);}
function tandemHud(t){const close=t.ok?cl(1-(t.dist-3)/(t.max-3),0,1):0;$('tandb').style.width=(close*100).toFixed(0)+'%';setTxt($('tandd'),t.gap<0?'YOU ARE AHEAD — FALL BACK':t.dist>t.max?'CLOSE THE GAP · '+Math.round(t.dist)+' M':t.ok?Math.round(t.dist)+' M · '+(t.angDiff<12?'ANGLE MATCHED':'MATCH ANGLE'):'DRIFT WITH THE LEAD','tand');}
function hud(dt){const c=car;
 setTxt($('clock'),phase==='cd'?fmt(opt.time*60):fmt(clock),'clk');$('tl').firstElementChild.classList.toggle('low',clock<=15&&phase==='drive');
 setTxt($('total'),num(scorer.total),'tot');setTxt($('bestc'),'BEST COMBO '+num(scorer.bestCombo),'bc');
 const live=scorer.live,on=scorer.chain>0;const cb=$('combo');if(lostT>0){lostT-=dt;setTxt($('chain'),num(lostVal),'ch');if(lostT<=0)cb.classList.remove('lost');}else setTxt($('chain'),num(live),'ch');
 cb.classList.toggle('on',on||lostT>0);setTxt($('mult'),'×'+scorer.mult.toFixed(1),'mu');$('grace').style.width=(on?(1-scorer.grace/1.4)*100:0).toFixed(0)+'%';
 const tg=Object.keys(scorer.tags).join();if(hc.tags!==tg){hc.tags=tg;$('tags').innerHTML=Object.keys(scorer.tags).map(t=>`<span class="${t==='TANDEM'?'t':t==='PROXIMITY'?'p':t==='CLIP'?'c':'a'}">${t}</span>`).join('');}
 const ang=Math.min(90,Math.abs(c.beta)*180/Math.PI*(c.speed>3?1:0));setTxt($('angle'),Math.round(ang)+'°','an');$('angarc').style.strokeDasharray=(ang/90*270).toFixed(1)+' 400';
 setTxt($('kmh'),Math.round(c.speed*3.6),'kmh');setTxt($('gear'),c.gear<0?'R':c.gear===0||c.ctrl.clutch>.5?'N':c.gear,'gear');setTxt($('trans'),c.auto?'AUTO':'MANUAL','tr');
 const rf=Math.min(1,c.rpm/(c.p.red*1.05));$('rpm').style.strokeDasharray=(396*rf).toFixed(1)+' 600';$('red').style.strokeDasharray=`0 ${(396*c.p.red*.95/(c.p.red*1.05)).toFixed(1)} ${(396*(1-.95/1.05)).toFixed(1)} 600`;
 $('gauge').classList.toggle('lim',c.rpm>c.p.red*.97);$('boost').style.width=(c.p.boostMax>0?c.boost/c.p.boostMax*100:0).toFixed(0)+'%';
 let cd='';if(phase==='cd')cd=Math.max(1,Math.ceil(cdT));setTxt($('cd'),cd,'cd');$('cd').style.opacity=cd?Math.min(1,(cdT%1)*3+.2):0;
 drawMini();}
let miniBase=null;const mini=$('mini').getContext('2d');
function drawMini(){const w=300,h=300;let bx0,bx1,bz0,bz1;if(!miniBase){miniBase=document.createElement('canvas');miniBase.width=w;miniBase.height=h;const x=miniBase.getContext('2d');
  if(W.B){const B=W.B;bx0=Math.min(...B.x)-20;bx1=Math.max(...B.x)+20;bz0=Math.min(...B.z)-20;bz1=Math.max(...B.z)+20;}else{bx0=-W.lot.W;bx1=W.lot.W;bz0=-W.lot.L;bz1=W.lot.L;}
  const s=Math.min((w-30)/(bx1-bx0),(h-30)/(bz1-bz0)),ox=w/2-(bx0+bx1)/2*s,oz=h/2+(bz0+bz1)/2*s;miniBase.P=(X,Z)=>[w-(X*s+ox),oz-Z*s];// mirrored so left is left when looking north
  const P=miniBase.P;x.lineCap=x.lineJoin='round';
  if(W.B){const B=W.B;for(const[wd,col]of[[9,'rgba(255,255,255,.18)'],[4,'rgba(255,255,255,.75)']]){x.strokeStyle=col;x.lineWidth=wd;x.beginPath();for(let i=0;i<=B.n;i+=2){const[a,b]=P(B.x[i%B.n],B.z[i%B.n]);i?x.lineTo(a,b):x.moveTo(a,b);}x.closePath();x.stroke();}
   const[a,b]=P(B.x[0],B.z[0]);x.fillStyle='#ff4d00';x.fillRect(a-4,b-4,8,8);}
  else{x.strokeStyle='rgba(255,255,255,.6)';x.lineWidth=2;const[a,b]=P(-W.lot.W,-W.lot.L),[c2,d]=P(W.lot.W,W.lot.L);x.strokeRect(Math.min(a,c2),Math.min(b,d),Math.abs(c2-a),Math.abs(d-b));x.fillStyle='rgba(255,255,255,.5)';for(const o of W.lot.circles){const[p,q]=P(o.x,o.z);x.beginPath();x.arc(p,q,o.kind==='pillar'?4:1.5,0,7);x.fill();}}
  x.fillStyle='rgba(255,170,40,.8)';for(const c of W.clips){const[p,q]=P(c.x,c.z);x.beginPath();x.arc(p,q,2.5,0,7);x.fill();}}
 mini.clearRect(0,0,w,h);mini.drawImage(miniBase,0,0);const P=miniBase.P;
 const dot=(X,Z,yaw,col)=>{const[a,b]=P(X,Z);mini.save();mini.translate(a,b);mini.rotate(Math.PI-yaw);mini.fillStyle=col;mini.beginPath();mini.moveTo(0,-9);mini.lineTo(6,7);mini.lineTo(-6,7);mini.closePath();mini.fill();mini.restore();};
 if(lead)dot(lead.x,lead.z,lead.yaw,'#3de0ff');dot(car.x,car.z,car.yaw,'#ff4d00');}

/* ================= garage ================= */
let garage=null,gTab='cars',buyArm=null;
function buildGarage(){const g=new THREE.Group();
 const fl=new THREE.Mesh(new THREE.CircleGeometry(40,64),new THREE.MeshStandardMaterial({color:0x1a1b1e,roughness:.32,metalness:.2}));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
 const tt=new THREE.Mesh(new THREE.CylinderGeometry(4.2,4.3,.12,64),new THREE.MeshStandardMaterial({color:0x2a2c30,roughness:.25,metalness:.7}));tt.position.y=.06;tt.receiveShadow=true;g.add(tt);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(4.3,.03,6,96),new THREE.MeshBasicMaterial({color:new THREE.Color(3,.9,.2)}));ring.rotation.x=Math.PI/2;ring.position.y=.12;g.add(ring);
 const wall=new THREE.Mesh(new THREE.CylinderGeometry(22,22,12,48,1,true),new THREE.MeshStandardMaterial({color:0x101114,roughness:.8,side:THREE.BackSide}));wall.position.y=6;g.add(wall);
 const strips=[];for(let i=0;i<9;i++){const a=i/9*Math.PI*2;strips.push([new THREE.BoxGeometry(.18,9,.18),M4(Math.cos(a)*21.6,5.5,Math.sin(a)*21.6)]);}
 for(let i=0;i<4;i++)strips.push([new THREE.BoxGeometry(14,.12,.5),M4(0,9,-6+i*4)]);
 g.add(new THREE.Mesh(merge(strips),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,1.6,1.8)})));
 const k=new THREE.SpotLight(0xffffff,90,40,.6,.6,1.5);k.position.set(5,12,6);k.castShadow=true;k.shadow.mapSize.set(1024,1024);g.add(k,k.target);
 const r2=new THREE.SpotLight(0xff8a50,50,40,.7,.8,1.5);r2.position.set(-8,6,-6);g.add(r2,r2.target);
 g.add(new THREE.HemisphereLight(0x8090b0,0x202020,.35));
 const s=new THREE.Scene();s.add(new THREE.Mesh(new THREE.SphereGeometry(50,16,8),new THREE.MeshBasicMaterial({color:0x08090c,side:THREE.BackSide})));
 for(let i=0;i<6;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(30,2),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,1.6,1.8),side:THREE.DoubleSide}));m.position.set(0,20,-15+i*6);m.rotation.x=Math.PI/2;s.add(m);}
 for(let i=0;i<8;i++){const a=i/8*6.28,m=new THREE.Mesh(new THREE.PlaneGeometry(2,14),new THREE.MeshBasicMaterial({color:new THREE.Color(.9,.9,1),side:THREE.DoubleSide}));m.position.set(Math.cos(a)*30,6,Math.sin(a)*30);m.lookAt(0,6,0);s.add(m);}
 const pm=new THREE.PMREMGenerator(R);g.userData.env=pm.fromScene(s,.02).texture;pm.dispose();g.visible=false;scene.add(g);return g;}
function openGarage(){if(!garage)garage=buildGarage();app='garage';showOnly('garage');document.body.classList.add('ingarage');document.body.classList.remove('playing');snd.mute();
 if(!carMesh)buildPlayer();W.group.visible=false;garage.visible=true;scene.environment=garage.userData.env;scene.fog=null;scene.background=new THREE.Color(0x07080a);leadMesh.visible=false;carMesh.visible=true;
 smoke.clear();skids.clear();sparks.clear();if(rain)rain.mesh.visible=false;head.intensity=0;tailL.intensity=0;leadHead.intensity=0;camSnap=true;gTab='cars';buyArm=null;renderGarage();}
function closeGarage(to='menu'){garage.visible=false;W.group.visible=true;scene.environment=W.env;scene.fog=W.fog;scene.background=new THREE.Color(W.time.fog);if(rain)rain.mesh.visible=true;document.body.classList.remove('ingarage');if(to==='run')start();else toMenu();}
function hp(sp,o){const p=buildParams(sp,o);return Math.round(p.T*(1+p.boostMax)*Math.min(p.red,p.peak+1500)/7120);}
function renderGarage(){const sp=spec(),o=own();$('gname').textContent=sp.name;$('gtag').textContent=sp.tag;$('gmoney').textContent='$'+num(save.money);
 document.querySelectorAll('#gtabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===gTab));let h='';
 if(gTab==='cars'){for(const c of CARS){const ow=!!save.owned[c.id],sel=save.sel===c.id;h+=`<div class="citem${sel?' sel':''}" data-car="${c.id}"><b>${c.name}</b><span class="pr ${ow?'own':save.money>=c.price?'buy':'no'}">${sel?'DRIVING':ow?'OWNED':buyArm===c.id?'CONFIRM $'+num(c.price):'$'+num(c.price)}</span><small>${c.tag} · ${hp(c,defaultOwn(c))} HP · ${c.mass} KG</small><p>${c.blurb}</p></div>`;}}
 else if(gTab==='ups'){for(const u of UPS){const l=o.up[u.k],pr=l<u.max?upPrice(sp,u,l):0;h+=`<div class="up"><b>${u.n}</b><small>${u.d}</small><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div><button data-up="${u.k}" ${l>=u.max||save.money<pr?'disabled':''}>${l>=u.max?'MAXED':'$'+num(pr)}</button></div>`;}}
 else if(gTab==='tune'){for(const t of TUNE){const ctx={up:o.up,spec:sp},mn=typeof t.min==='function'?t.min(ctx):t.min,mx=t.max(ctx);let v=cl(o.tune[t.k],mn,mx);o.tune[t.k]=v;
   h+=`<div class="tn"><label>${t.n}</label><input type="range" data-tune="${t.k}" min="${mn}" max="${mx}" step="${t.step}" value="${v}"><b id="tv-${t.k}">${t.fmt?t.fmt(v):v+t.u}</b></div>`;}
  h+=`<p class="tnote">More <b>steering angle</b> holds bigger slides (buy the ANGLE KIT for more lock). <b>Front camber</b> adds front grip, <b>rear camber</b> and <b>high rear pressure</b> make the tail looser. <b>Stiffer suspension</b> snaps weight across faster. A <b>shorter final drive</b> (higher number) keeps you in the power band.</p><button class="ghost" id="treset">RESET TUNE</button>`;}
 else{h+=`<p class="ph">PAINT</p><div class="sw">${PAINTS.map(c=>`<button data-paint="${c}" class="${o.look.paint===c?'on':''}" style="background:${c}"></button>`).join('')}</div>
  <p class="ph">LIVERY</p><div class="seg">${LIVERIES.map((n,i)=>`<button data-liv="${i}" class="${o.look.livery===i?'on':''}">${n}</button>`).join('')}</div>
  <p class="ph">LIVERY COLOUR</p><div class="sw">${PAINTS.map(c=>`<button data-livc="${c}" class="${o.look.liv===c?'on':''}" style="background:${c}"></button>`).join('')}</div>
  <p class="ph">RIMS</p><div class="seg">${RIM_STYLES.map((n,i)=>`<button data-rim="${i}" class="${o.look.rim===i?'on':''}">${n}</button>`).join('')}</div>
  <div class="sw">${RIMS.map(c=>`<button data-rimc="${c}" class="${o.look.rims===c?'on':''}" style="background:${c}"></button>`).join('')}</div>`;}
 $('gpanel').innerHTML=h;
 const p=buildParams(sp,o),bars=[['POWER',hp(sp,o),700,' HP'],['GRIP',Math.round(p.muR*100),130,''],['ANGLE',Math.round(o.tune.steer),66,'°'],['WEIGHT',Math.round(p.mass),1600,' KG']];
 $('gstats').innerHTML=bars.map(([n,v,mx,u])=>`<div><span>${n}</span><div class="bar"><i style="width:${Math.min(100,v/mx*100)}%"></i></div><b>${v}${u}</b></div>`).join('');}
$('gpanel').addEventListener('click',e=>{const t=e.target.closest('[data-car],[data-up],[data-paint],[data-liv],[data-livc],[data-rim],[data-rimc],#treset');if(!t)return;snd.init();snd.play('click');const o=own();
 if(t.dataset.car){const c=CARS.find(x=>x.id===t.dataset.car);if(save.owned[c.id]){save.sel=c.id;buildPlayer();}else if(save.money>=c.price){if(buyArm===c.id){save.money-=c.price;save.owned[c.id]=defaultOwn(c);save.sel=c.id;buyArm=null;snd.play('cash');buildPlayer();}else buyArm=c.id;}}
 else if(t.dataset.up){const u=UPS.find(x=>x.k===t.dataset.up),l=o.up[u.k],pr=upPrice(spec(),u,l);if(l<u.max&&save.money>=pr){save.money-=pr;o.up[u.k]++;snd.play('cash');if(u.k==='angle')o.tune.steer=Math.max(o.tune.steer,ANGLE_MAX[o.up.angle]-4);buildPlayer();}}
 else if(t.dataset.paint){o.look.paint=t.dataset.paint;setLook(carMesh,o.look);}else if(t.dataset.livc){o.look.liv=t.dataset.livc;setLook(carMesh,o.look);}
 else if(t.dataset.liv){o.look.livery=+t.dataset.liv;setLook(carMesh,o.look);}else if(t.dataset.rimc){o.look.rims=t.dataset.rimc;setLook(carMesh,o.look);}
 else if(t.dataset.rim){o.look.rim=+t.dataset.rim;buildPlayer();}
 else if(t.id==='treset'){o.tune=defaultOwn(spec()).tune;}
 writeSave(save);renderGarage();});
$('gpanel').addEventListener('input',e=>{const k=e.target.dataset.tune;if(!k)return;const t=TUNE.find(x=>x.k===k),v=+e.target.value;own().tune[k]=v;$('tv-'+k).textContent=t.fmt?t.fmt(v):v+t.u;writeSave(save);buildPlayer();
 const sp=spec(),p=buildParams(sp,own());});
$('gtabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;gTab=b.dataset.t;buyArm=null;snd.init();snd.play('click');renderGarage();});
canvas.addEventListener('pointerdown',e=>{if(app==='garage')garDrag=e.clientX;});addEventListener('pointerup',()=>garDrag=null);
addEventListener('pointermove',e=>{if(garDrag!=null){garA+=(e.clientX-garDrag)*.008;garDrag=e.clientX;}});

/* ================= main step ================= */
function step(dt){dt=Math.min(dt,.1);time+=dt;padMenu();for(const k in edge)delete edge[k];
 if(app==='run'){stepRun(dt);if(app!=='run'&&app!=='over'){}}
 if(app==='menu'||(app==='over'&&false)){if(attract){attract.update(dt,null,true);}}
 visuals(dt);}
function visuals(dt){
 if(app==='garage'){garA+=dt*.18;carMesh.position.set(0,.12,0);carMesh.rotation.set(0,garA,0);carMesh.userData.body.rotation.set(0,0,0);for(const w of carMesh.userData.wheels){if(w.front)w.piv.rotation.y=.35;}
  carMesh.userData.head.emissiveIntensity=.9;carMesh.userData.tail.emissiveIntensity=.8;
  const ca=.78,cr=10.5;cam.position.set(Math.sin(ca)*cr,2.6,Math.cos(ca)*cr);const rx=Math.cos(ca),rz=-Math.sin(ca),off=innerWidth>900?2.3:0;cam.lookAt(-rx*off,.75,-rz*off);cam.fov=34;smoke.update(dt);return;}
 if(app==='run'||app==='paused'||app==='over'){if(app!=='paused'){carVisuals(app==='over'?0:dt);if(lead)leadVisuals(lead,dt);}
  if(app==='over'){overT+=dt;camOrbit(dt,carMesh.position,car.yaw,8.5,1.9,innerWidth>900?2.6:0);}else camRun(dt);}
 else if(app==='menu'&&attract){leadVisuals(attract,dt);camOrbit(dt,leadMesh.position,attract.yaw,8.5+Math.sin(time*.2)*1.5,2.1,innerWidth>1180?1.3:innerWidth>900?2.2:0);}
 if(app!=='paused'){smoke.update(dt,W.def.time==='rain'?null:tv.set(.4,0,.2));sparks.update(dt);}
 if(rain)rain.update(dt,cam,car&&app==='run'?tv.set(car.vx,0,car.vz):null);
 if(W.blink)W.blink.color.setScalar(Math.sin(time*3)>.6?6:.2).setRGB(Math.sin(time*3)>.6?6:.25,.2,.15);
 const focus=app==='menu'&&attract?leadMesh.position:car?tv2.set(car.x,car.y,car.z):cam.position;updateLamps(W,focus,dt);
 // smoke lighting uniforms
 const L=W.nearLamps||[];for(let i=0;i<NL;i++){const l=L[i];if(l){smoke.U.uLP.value[i].set(l.x,l.y,l.z);smoke.U.uLC.value[i].set(l.col||W.time.lampCol).multiplyScalar((l.I||300)/300*.32);}else{smoke.U.uLP.value[i].set(0,-999,0);smoke.U.uLC.value[i].setRGB(0,0,0);}}
 const hl=app==='menu'?leadHead:head;smoke.U.uHP.value.copy(hl.position);smoke.U.uHD.value.subVectors(hl.target.position,hl.position).normalize();smoke.U.uHC.value.setScalar(W.time.headI>.5?1:.3);
 smoke.U.uTP.value.copy(app==='menu'?leadMesh.position:tailL.position);
 // sun shadow follows the action
 const fp=app==='menu'?leadMesh.position:car?tv.set(car.x,car.y,car.z):cam.position;W.sun.target.position.copy(fp);W.sun.position.copy(fp).add(W.sunOff);
 if(app==='run'||app==='paused')hud(dt);}

/* ================= rendering ================= */
const POST={bloom:.62,bloomThreshold:.82,bloomRadius:.55,vignette:.4,saturation:1.12,grain:.035,aoStrength:.8};
let fx=null,fxW=0,fxH=0,oldFx=null;
function applyShadow(){R.shadowMap.enabled=gfx>0;if(W){W.sun.castShadow=gfx>0;W.sun.shadow.mapSize.set(gfx>=2?2048:1024,gfx>=2?2048:1024);if(W.sun.shadow.map){W.sun.shadow.map.dispose();W.sun.shadow.map=null;}}}
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:1));fx=null;applyShadow();scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true;});}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);fx=null;}
 cam.aspect=w/h;cam.updateProjectionMatrix();const pr=R.getPixelRatio();smoke.U.uScale.value=h*pr/(2*Math.tan(cam.fov*Math.PI/360));sparks.U.uScale.value=smoke.U.uScale.value;smoke.U.uMax.value=Math.min(1024,h*pr*.9);
 if(!fx||fx.garage!==(app==='garage')){if(oldFx&&oldFx.composer){oldFx.composer.dispose();}const gar=app==='garage',ex=gar?.85:W.time.exposure;fx=cinematic(R,scene,cam,{...POST,exposure:ex,quality:gfx,ao:gfx>=2,bloom:gar?.3:POST.bloom,bloomThreshold:gar?.95:POST.bloomThreshold,grain:gar?.015:POST.grain});fx.garage=gar;oldFx=fx;fx.setSize(w,h);fxW=w;fxH=h;}
 const showRefl=W.mirror&&gfx>0&&app!=='garage';if(W.mirror){W.mirror.on=showRefl;W.mirror.scale=gfx>=2?.5:.33;if(showRefl){smoke.pts.visible=false;W.mirror.render(R,scene,cam,w*pr,h*pr,W.hideRefl);smoke.pts.visible=true;}}
 fx.render();}
addEventListener('resize',()=>{fx=null;});

/* ================= menu wiring ================= */
function seg(id,key,cb){const el=$(id);const set=v=>{opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',(isNaN(+b.dataset.v)?b.dataset.v:+b.dataset.v)===v));persistOpt();cb&&cb(v);};set(opt[key]);
 el.querySelectorAll('button').forEach(b=>b.onclick=()=>{snd.init();snd.play('click');set(isNaN(+b.dataset.v)?b.dataset.v:+b.dataset.v);});}
$('o-track').innerHTML=TRACKS.map(t=>`<button data-v="${t.id}">${t.name}<small>${t.sub}</small></button>`).join('');
function refreshMenu(){const t=TRACKS.find(x=>x.id===opt.track)||TRACKS[0];const bk=opt.track+'_'+opt.time+(opt.mode===1?'_t':'');
 $('tinfo').innerHTML=`<b>${t.name}</b> — ${t.blurb} ${save.best[bk]?`· BEST <b>${num(save.best[bk])}</b>`:''} · BRONZE ${num(MEDALS[0].ppm*opt.time)} · GOLD ${num(MEDALS[2].ppm*opt.time)}`;
 $('mmoney').textContent='$'+num(save.money);const tandemOk=t.ribbon;$('o-mode').querySelector('[data-v="1"]').disabled=!tandemOk;if(!tandemOk&&opt.mode===1){opt.mode=0;$('o-mode').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v==='0'));}
 $('o-diff').style.opacity=opt.mode===1?1:.4;}
seg('o-mode','mode',()=>refreshMenu());seg('o-track','track',v=>{if(app==='menu'){$('loadt').textContent='LOADING '+(TRACKS.find(t=>t.id===v)||{}).name;loadVenue(v);startAttract();camSnap=true;}refreshMenu();});
seg('o-time','time',()=>refreshMenu());seg('o-diff','diff');seg('o-trans','auto');
$('o-assist').value=opt.assist;$('o-assistv').textContent=opt.assist+'%';$('o-assist').oninput=e=>{opt.assist=+e.target.value;$('o-assistv').textContent=opt.assist+'%';persistOpt();if(car)car.assist=opt.assist/100;};
$('go').onclick=()=>start();$('gar').onclick=()=>{snd.init();openGarage();};$('gback').onclick=()=>closeGarage();$('gdrive').onclick=()=>closeGarage('run');
$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('ogar').onclick=()=>openGarage();$('resume').onclick=()=>pause(false);$('restart').onclick=()=>start();$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Sideways\nPoints: ${a.pts||0}\nMedal: ${a.medal||'none'} · Best combo: ${a.combo||0}\nTrack: ${a.track||''} · ${a.time||''} min${a.tandem?' · tandem':''}\nCar: ${a.car||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore(ID,a.pts||0,body);};

/* ================= boot + loop ================= */
loadVenue(opt.track);buildPlayer();toMenu();setTimeout(()=>$('load').classList.add('off'),60);
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.SIDEWAYS={get state(){return app==='run'?phase:app;},get app(){return app;},get phase(){return phase;},step,render,start,toMenu,openGarage,closeGarage,
 get car(){return car;},autopilot(on=true){autoOn=on;},get lead(){return lead;},get attract(){return attract;},get scorer(){return scorer;},get world(){return W;},get save(){return save;},get clock(){return clock;},setClock(s){clock=s;},
 keys,setQuality:applyQuality,get quality(){return gfx;},cam,scene,R,TRACKS,CARS,bot(on=true){botOn=on;bot=on&&W?new Bot(W.B||W.path):null;},
 addMoney(n){save.money+=n;writeSave(save);},resetSave(){save=loadSave.call(null);localStorage.removeItem('pxd_sideways_save');save=loadSave();buildPlayer();},
 crash(){scorer.lose('TEST');},addPoints(n){scorer.total+=n;},get lastAward(){return lastAward;},cycleCam,pause,resetCar,get camMode(){return camMode;},
 teleport(i){if(!W.B)return;const B=W.B;car.reset(B.x[i],B.z[i],Math.atan2(B.tx[i],B.tz[i]));car.i=i;placeY(car);camSnap=true;},get smoke(){return smoke;},get skids(){return skids;}};
