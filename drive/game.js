// NIGHT DRIVE — open-city shift driving: fares, deliveries, races, getaways, stunts, police, radio, sunset-to-midnight rain. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {City,N,SP,HALF,WORLD,HY} from './city.js';
import {makeTextures} from './tex.js';
import {buildWorld,todAt} from './world.js';
import {CARS,Car,carModel} from './car.js';
import {Traffic,Peds,Police} from './traffic.js';
import {Jobs} from './missions.js';
import {Sound,STATIONS} from './sound.js';
import {HUD,mmss} from './hud.js';
const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,lerp=(a,b,t)=>a+(b-a)*t;
const DT=1/60;

/* ================= renderer / scene ================= */
const canvas=$('c');const Rr=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});Rr.setPixelRatio(Math.min(devicePixelRatio,1.5));Rr.shadowMap.enabled=true;Rr.shadowMap.type=THREE.PCFSoftShadowMap;Rr.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(62,1,.2,2600);
const city=new City(7);const T=makeTextures();const world=buildWorld(city,T,Rr);scene.add(world.group);scene.fog=world.fog;scene.environment=world.env;
const snd=new Sound();

/* ================= particles ================= */
class Points{constructor(n,additive){this.n=n;this.add=additive;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*4);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.gr=new Float32Array(n);this.al=new Float32Array(n);this.i=0;
  const geo=new THREE.BufferGeometry();const A=(a,k)=>new THREE.BufferAttribute(a,k).setUsage(THREE.DynamicDrawUsage);geo.setAttribute('position',A(this.p,3));geo.setAttribute('color',A(this.c,4));geo.setAttribute('size',A(this.s,1));this.geo=geo;this.U={uScale:{value:500},uTex:{value:T.puff}};
  this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,vertexShader:'attribute float size;attribute vec4 color;uniform float uScale;varying vec4 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color;gl_PointSize=min(512.,size*uScale/max(.1,-mv.z));gl_Position=projectionMatrix*mv;}',
   fragmentShader:additive?'varying vec4 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vC.rgb*a*vC.a,1.);}':'uniform sampler2D uTex;varying vec4 vC;void main(){vec4 t=texture2D(uTex,gl_PointCoord);gl_FragColor=vec4(vC.rgb,t.a*vC.a);}'}));this.pts.frustumCulled=false;scene.add(this.pts);}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,grow=0,alpha=1){const i=this.i;this.i=(i+1)%this.n;this.p.set([x,y,z],i*3);this.v.set([vx,vy,vz],i*3);this.oc.set([r,g,b],i*3);this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.gr[i]=grow;this.al[i]=alpha;}
 update(dt){const{p,v,c,oc,s,os,life,max,g,gr,al}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]);v[i*3+1]-=g[i]*dt;const dr=Math.exp(-dt*1.5);v[i*3]*=dr;v[i*3+2]*=dr;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;
  if(this.add){c[i*4]=oc[i*3]*k;c[i*4+1]=oc[i*3+1]*k;c[i*4+2]=oc[i*3+2]*k;c[i*4+3]=1;s[i]=os[i]*(.5+.5*k);}else{os[i]+=gr[i]*dt;s[i]=os[i];c[i*4]=oc[i*3];c[i*4+1]=oc[i*3+1];c[i*4+2]=oc[i*3+2];c[i*4+3]=al[i]*Math.min(1,k*2)*Math.min(1,(1-k)*6);}}
  const A=this.geo.attributes;A.position.needsUpdate=A.color.needsUpdate=A.size.needsUpdate=true;}}
const smoke=new Points(900,false),sparks=new Points(700,true);

/* ================= game state ================= */
const G={app:'menu',opt:{len:8,traffic:1,diff:1,car:'cab',vol:.8,rvol:.5,cam:0},city,cash:0,target:2500,shiftLen:480,shiftLeft:480,hour:17.25,rain:0,wet:0,time:0,wanted:0,heat:0,escapeT:0,bustT:0,stats:null,route:null,tunnel:false,station:0,attract:true};
try{Object.assign(G.opt,JSON.parse(localStorage.getItem('pxd_drive_opt'))||{});}catch(e){}
function career(){try{return Object.assign({total:0,best:0,shifts:0},JSON.parse(localStorage.getItem('pxd_drive_career'))||{});}catch(e){return{total:0,best:0,shifts:0};}}
function saveCareer(c){try{localStorage.setItem('pxd_drive_career',JSON.stringify(c));}catch(e){}}
const unlocked=s=>career().total>=s.unlock;
G.trafficK=1;G.copK=1;
const traffic=new Traffic(scene,city,34,12),peds=new Peds(scene,city,90),police=new Police(scene,city);G.traffic=traffic;G.police=police;
const jobs=new Jobs(scene,city,G);G.jobs=jobs;

/* ================= player car ================= */
let car=null,headL=null,tailL=null;const flameM=new THREE.MeshBasicMaterial({color:new THREE.Color(.6,1.6,4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});let flames=[];
function buildCar(id){const spec=CARS.find(c=>c.id===id)||CARS[0];if(car)scene.remove(car.model);const m=carModel(spec);scene.add(m);car=new Car(spec,m);G.car=car;
 headL=new THREE.SpotLight(0xfff0d8,0,90,.5,.55,1.4);headL.position.set(0,.9,2.0);m.add(headL);m.add(headL.target);headL.target.position.set(0,-.4,24);
 tailL=new THREE.PointLight(0xff2020,0,7,2);tailL.position.set(0,.7,-2.8);m.add(tailL);
 flames=[];for(const s of[-.45,.45]){const f=new THREE.Mesh(new THREE.ConeGeometry(.16,1.2,10).rotateX(-Math.PI/2),flameM);f.position.set(s,.42,-m.userData.L/2-.6);f.visible=false;m.add(f);flames.push(f);}
 return car;}
buildCar(G.opt.car);

/* ================= money ================= */
G.earn=(amt,cat,label)=>{amt=Math.round(amt);G.cash+=amt;if(G.stats){G.stats.cat[cat]=(G.stats.cat[cat]||0)+amt;}hud.cash(amt,label);if(amt>=50)snd.cash();};
G.toast=(t,col)=>hud.toast(t,col);G.pop=t=>hud.pop(t);G.sfx=k=>{if(snd[k])snd[k]();};
G.setWanted=(n,force)=>{const was=G.wanted;G.wanted=force?Math.max(G.wanted,n):cl(n,0,5);if(G.wanted>was){G.escapeT=0;hud.toast(G.wanted+'★ WANTED','#ffd040',1.6);}G.stats&&(G.stats.maxWanted=Math.max(G.stats.maxWanted,G.wanted));};
G.crime=(kind,x,z)=>{const near=police.cops.some(c=>Math.hypot(c.x-x,c.z-z)<75);const sev={ped:.6,cop:1,wreck:.35,speed:.5}[kind]||.3;if(G.wanted>0){G.heat+=sev;if(G.heat>=1.6){G.heat=0;G.setWanted(G.wanted+1);}}else if(near||kind==='cop'||R()<sev*.25){G.setWanted(1);G.heat=0;}};
G.honk=(c)=>{const dx=c.x-cam.position.x,dz=c.z-cam.position.z;snd.honkAt(Math.hypot(dx,dz),cl((dx*Math.cos(cam.rotation.y)-dz*Math.sin(cam.rotation.y))/30,-1,1));};
G.pedEvent=(k,p)=>{};

/* ================= shift flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setRadioVol(G.opt.rvol);
 const spec=CARS.find(c=>c.id===G.opt.car);if(!spec||!unlocked(spec))G.opt.car='cab';buildCar(G.opt.car);
 G.attract=false;G.app='play';G.cash=0;G.shiftLen=G.opt.len*60;G.shiftLeft=G.shiftLen;G.target=G.opt.len>=8?2200:1000;G.time=0;G.wanted=0;G.heat=0;G.escapeT=0;G.bustT=0;G.trafficK=[.6,1,1.45][G.opt.traffic];G.copK=[.88,1,1.1][G.opt.diff];G.patrols=[1,2,4][G.opt.diff];
 G.stats={cat:{},fares:0,deliveries:0,races:0,raceWins:0,getaways:0,jumps:0,uniq:0,tips:0,failed:0,crashes:0,peds:0,busted:0,wrecked:0,fines:0,repairs:0,maxWanted:0,topSpeed:0,drift:0,dist:0,nearMiss:0};
 const s=city.curbSpot(()=>.37,WORLD/2,WORLD/2,0,1e9);car.place(4*SP+HALF*0,3*SP+3.5,Math.PI/2,city);car.dmg=0;car.nitro=1;
 police.clear();traffic.spawnAll(car);jobs.reset();G.route=null;setTimeOfDay();hud.show(true);hud.job(null);['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.add('playing');
 snd.tune(G.station);hud.radio(STATIONS[G.station]);hud.toast('SHIFT STARTED','#ffd040',1.6);camSnap=true;}
function toMenu(){G.app='menu';G.attract=true;['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing');hud.show(false);jobs.cancel(true);police.clear();G.wanted=0;renderGarage();menuT=0;}
function endShift(why){if(G.app!=='play'&&G.app!=='paused')return;G.app='over';hud.show(false);document.body.classList.remove('playing');$('pause').hidden=true;jobs.cancel(true);
 const s=G.stats,won=G.cash>=G.target;const c=career();const before=CARS.filter(k=>c.total>=k.unlock).map(k=>k.id);c.total+=Math.max(0,G.cash);c.best=Math.max(c.best,G.cash);c.shifts++;saveCareer(c);const newly=CARS.filter(k=>c.total>=k.unlock&&!before.includes(k.id));
 $('oeye').textContent=(why==='quit'?'SHIFT ENDED EARLY':'SHIFT OVER')+' · '+mmss(G.shiftLen-G.shiftLeft)+' · '+car.spec.name;$('ores').textContent=won?'TARGET MET':'TARGET MISSED';$('ores').style.color=won?'#ffd040':'#8a93a6';$('ototal').textContent='$'+Math.round(G.cash).toLocaleString();
 const cat=s.cat;const rows=[['FARES',s.fares+' RIDES',cat.fares||0],['DELIVERIES',s.deliveries+' DROPS',cat.deliveries||0],['STREET RACES',s.raceWins+' WINS / '+s.races,cat.races||0],['GETAWAYS',s.getaways+' RUNS',cat.getaways||0],['STUNT JUMPS',s.jumps+' JUMPS · '+s.uniq+' UNIQUE',cat.stunt||0],['STREET CRED','NEAR MISSES · AIR',cat.street||0],['REPAIRS & FINES',s.busted+' BUSTED · '+s.wrecked+' TOTALED',-(s.fines+s.repairs)]];
 $('stats').innerHTML=rows.map(r=>`<tr class="${r[2]<0?'neg':''}"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]<0?'-':''}$${Math.abs(Math.round(r[2])).toLocaleString()}</td></tr>`).join('')+`<tr class="tot"><td>TAKE HOME</td><td>TARGET $${G.target.toLocaleString()} · TOP ${Math.round(s.topSpeed*3.6)} KM/H</td><td>$${Math.round(G.cash).toLocaleString()}</td></tr>`;
 const tok=award(won);$('otok').innerHTML=`+${tok} TOKENS · CAREER $${Math.round(c.total).toLocaleString()} · BEST SHIFT $${Math.round(c.best).toLocaleString()}`+(newly.length?` · <b>UNLOCKED ${newly.map(k=>k.name).join(', ')}</b>`:'');$('over').hidden=false;}
let lastAward=null;
function award(won){const pts=Math.max(0,Math.round(G.cash));lastAward={pts,won,car:car.spec.name,len:G.opt.len,fares:G.stats.fares,races:G.stats.raceWins};const tok=5+Math.min(50,pts/100|0);
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'drive3d';if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}

/* ================= time of day + weather ================= */
function setTimeOfDay(){const f=1-G.shiftLeft/G.shiftLen;G.hour=17.25+f*8.25;const h=G.hour;let rain=cl((h-19.9)/1.1,0,1);if(h>22.6&&h<23.6)rain*=.35;G.rain=rain;G.wet+=(Math.max(rain,G.wet*.995)-G.wet)*.02;if(G.wet<rain)G.wet=Math.min(rain,G.wet+.004);world.setTime(h,G.rain,G.wet);}

/* ================= input ================= */
const keys={};let camMode=0,lookBack=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const first=!keys[e.code];keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Backspace','Tab'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='play')pause(true);else if(G.app==='paused')pause(false);return;}if(G.app!=='play'||!first)return;
 if(e.code==='KeyC'){G.opt.cam=(G.opt.cam+1)%3;saveOpt();camSnap=true;}if(e.code==='KeyH')snd.horn();if(e.code==='KeyR'){G.station=(G.station+1)%STATIONS.length;snd.tune(G.station);hud.radio(STATIONS[G.station]);}
 if(e.code==='KeyX'&&jobs.active){jobs.fail('JOB CANCELLED');}if(e.code==='Backspace')resetCar('RESET');});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
function readInput(){const k=keys;let thr=(k.KeyW||k.ArrowUp)?1:0,brk=(k.KeyS||k.ArrowDown)?1:0,steer=((k.KeyA||k.ArrowLeft)?1:0)-((k.KeyD||k.ArrowRight)?1:0),hb=!!k.Space,nitro=!!(k.ShiftLeft||k.ShiftRight);lookBack=!!k.KeyB;
 const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>Math.abs(v)>.15?v:0;const sx=dz(ax[0]||0);if(sx)steer=-sx;const rt=bt[7]?bt[7].value:0,lt=bt[6]?bt[6].value:0;if(rt>.05)thr=rt;if(lt>.05)brk=lt;if(bt[0]&&bt[0].pressed)hb=true;if(bt[2]&&bt[2].pressed)nitro=true;if(bt[3]&&bt[3].pressed)lookBack=true;
  const pr=G.pad||{};if(bt[1]&&bt[1].pressed&&!pr.b)snd.horn();if(bt[5]&&bt[5].pressed&&!pr.rb){G.station=(G.station+1)%STATIONS.length;snd.tune(G.station);hud.radio(STATIONS[G.station]);}if(bt[4]&&bt[4].pressed&&!pr.lb){G.opt.cam=(G.opt.cam+1)%3;camSnap=true;}if(bt[9]&&bt[9].pressed&&!pr.st)pause(true);
  G.pad={b:bt[1]&&bt[1].pressed,rb:bt[5]&&bt[5].pressed,lb:bt[4]&&bt[4].pressed,st:bt[9]&&bt[9].pressed};}
 if(G.ai)return G.ai;return{thr,brk,steer,hb,nitro};}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');}else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');}}

/* ================= events ================= */
function resetCar(why,x,z){const n=city.nearestNode(x??car.x,z??car.z);const o=city.nodes[n.nb[0]];car.place(n.x,n.z,Math.atan2(o.x-n.x,o.z-n.z),city);car.water=0;camSnap=true;if(why)hud.toast(why,'#ffd040',1.2);}
function nearestShop(){let b=null,bd=1e9;for(const s of city.shops){const d=Math.hypot(s.x-car.x,s.z-car.z);if(d<bd){bd=d;b=s;}}return b;}
function totaled(){G.stats.wrecked++;const fee=200;G.cash-=fee;G.stats.repairs+=fee;hud.cash(-fee,'TOW + REPAIR');hud.toast('TOTALED','#ff5040',2);if(jobs.active)jobs.fail('JOB LOST');const s=nearestShop();resetCar(null,s.x,s.z);car.place(s.x,s.z+(s.a===0?6:0),s.a===0?Math.PI/2:0,city);car.dmg=0;G.setWanted(0);G.wanted=0;snd.crash(30);}
function busted(){G.stats.busted++;const fine=Math.max(250,Math.round(G.cash*.12));G.cash-=fine;G.stats.fines+=fine;hud.cash(-fine,'FINE');hud.toast('BUSTED','#3070ff',2.4);snd.busted();if(jobs.active&&jobs.active.type==='getaway')jobs.fail('CREW ARRESTED');G.wanted=0;G.heat=0;G.bustT=0;}
let shopCD=0;
function checkShops(dt){shopCD-=dt;for(const s of city.shops){const d=Math.hypot(s.x-car.x,s.z-car.z);if(s.mesh)s.mesh.material.color.setRGB(1.6,.8,.25).multiplyScalar(d<5?2:1);if(d<5.5&&car.speed<5&&shopCD<=0&&(car.dmg>2||G.wanted>0)){const cost=Math.max(40,Math.round(car.dmg*3+G.wanted*120));
  if(G.cash>=cost||car.dmg>60){G.cash-=cost;G.stats.repairs+=cost;hud.cash(-cost,'PATCH & PAINT');car.dmg=0;const lost=G.wanted>0;G.wanted=0;G.heat=0;hud.toast(lost?'NEW PAINT · HEAT LOST':'GOOD AS NEW','#ffb050',1.8);snd.cash();shopCD=4;}else{hud.toast('NOT ENOUGH CASH · $'+cost,'#ff6a50',1.4);shopCD=3;}}}}
// player vs other cars (traffic, cops, rivals)
const nmT=new Map();
function carContacts(dt){const others=[];for(const c of traffic.all())others.push({o:c,kin:true});for(const c of police.cops)others.push({o:c,cop:true});for(const r of jobs.rivals)others.push({o:r.car,rival:true});
 const fx=Math.sin(car.a),fz=Math.cos(car.a);for(const e of others){const o=e.o;if(Math.abs(o.y-car.y)>2.2)continue;const dx=o.x-car.x,dz=o.z-car.z;const d=Math.hypot(dx,dz);if(d>9)continue;
  // two circles each
  const ofx=Math.sin(o.a),ofz=Math.cos(o.a);let hit=null;for(const a of[1.3,-1.3])for(const b of[1.3,-1.3]){const px=car.x+fx*a,pz=car.z+fz*a,qx=o.x+ofx*b,qz=o.z+ofz*b;const ex=px-qx,ez=pz-qz,ed=Math.hypot(ex,ez);if(ed<2.15&&(!hit||ed<hit.d))hit={d:ed,nx:ex/(ed||1),nz:ez/(ed||1)};}
  if(hit){const pen=2.15-hit.d;const ovx=o.vx||0,ovz=o.vz||0;const rv=(car.vx-ovx)*hit.nx+(car.vz-ovz)*hit.nz;const mA=car.spec.mass,mB=e.kin?1.1:o.spec.mass;const share=mB/(mA+mB);car.x+=hit.nx*pen*share;car.z+=hit.nz*pen*share;
   if(rv<0){const imp=-rv;const j=(1.35*imp)/(1/mA+1/mB);car.vx+=hit.nx*j/mA;car.vz+=hit.nz*j/mA;if(e.kin){if(imp>4||o.state==='wreck')traffic.knock(o,ovx-hit.nx*j/mB,ovz-hit.nz*j/mB,(R()-.5)*3);}else{o.vx-=hit.nx*j/mB;o.vz-=hit.nz*j/mB;o.x-=hit.nx*pen*(1-share);o.z-=hit.nz*pen*(1-share);}
    if(imp>3){const mine=-(car.vx*hit.nx+car.vz*hit.nz);const dmg=imp*1.1*car.spec.dur*(e.cop&&mine<6?.45:1);car.dmg+=dmg;G.stats.crashes++;jobs.onCrash(imp);hitFx(car.x+fx*1.5,car.y+.8,car.z+fz*1.5,imp);if(e.cop){if(mine>6)G.crime('cop',car.x,car.z);if(G.wanted>0)G.bustT+=.3;}else if(e.kin&&imp>8&&mine>6)G.crime('wreck',car.x,car.z);}}}
  else if(e.kin&&o.state!=='wreck'){// near miss
   const rel=Math.hypot(car.vx-(o.vx||0),car.vz-(o.vz||0));if(d<3.6&&rel>14&&car.speed>12){const k=nmT.get(o)||0;if(G.time-k>3){nmT.set(o,G.time);G.stats.nearMiss++;car.nitro=Math.min(1,car.nitro+.08);jobs.onNearMiss();}}}}}
function hitFx(x,y,z,imp){const n=Math.min(40,imp*2|0);for(let i=0;i<n;i++)sparks.emit(x,y,z,(R()-.5)*imp*.6,R()*imp*.4,(R()-.5)*imp*.6,3,2,1,.18,.4+R()*.4,14);for(let i=0;i<4;i++)smoke.emit(x,y,z,(R()-.5)*2,1+R(),(R()-.5)*2,.4,.4,.42,1.2,1.4,0,1.5,.5);snd.crash(imp);G.hitFx=Math.min(1,imp/18);shake=Math.max(shake,Math.min(.6,imp/30));}

/* ================= main step ================= */
let acc=0,shake=0,camSnap=true,menuT=0,airStart=null,driftT=0,driftCash=0;
function step(dt){dt=Math.min(dt,.1);G.time+=dt;
 if(G.app==='play')play(dt);
 else if(G.app==='menu'){menuT+=dt;traffic.update(dt,null,G);peds.update(dt,null,G);G.hour=17.6+((menuT*.02)%3.4);G.rain=cl((G.hour-19.9)/1.1,0,1);G.wet=G.rain;world.setTime(G.hour,G.rain,G.wet);}
 smoke.update(dt);sparks.update(dt);G.hitFx=Math.max(0,(G.hitFx||0)-dt*2.5);
 cameraUpdate(dt);world.update(dt,cam,G.app==='menu'?menuFocus:car);
 if(G.app==='play'||G.app==='paused')hud.update(G.app==='play'?dt:0);}
function play(dt){const inp=readInput();G.shiftLeft-=dt;if(G.shiftLeft<=0){G.shiftLeft=0;endShift('time');return;}setTimeOfDay();
 // nitro
 car.nitroOn=inp.nitro&&car.nitro>0&&car.onGround&&inp.thr>0;if(car.nitroOn){car.nitro=Math.max(0,car.nitro-dt/4.5);if(!G.nitroWas)snd.nitro();}else car.nitro=Math.min(1,car.nitro+dt/60);G.nitroWas=car.nitroOn;for(const f of flames){f.visible=car.nitroOn;f.scale.set(1,1,.7+R()*.6);}
 const race=jobs.active&&jobs.active.type==='race'&&jobs.active.stage==='count';const ci=race?{thr:0,brk:1,steer:0,hb:false}:inp;
 const surfGrip=city.park&&car.x>city.park.x0&&car.x<city.park.x1&&car.z>city.park.z0&&car.z<city.park.z1&&!city.onRoad(car.x,car.z)?.7:1;
 acc+=dt;let n=0;while(acc>=DT&&n<6){car.step(ci,DT,city,{wet:G.wet,grip:surfGrip});acc-=DT;n++;
  for(const h of car.hits){if(h.imp>4){const dmg=h.imp*(h.kind==='tree'||h.kind==='lamp'?.5:1.25)*car.spec.dur;car.dmg+=dmg;G.stats.crashes++;jobs.onCrash(h.imp);hitFx(h.x,car.y+.8,h.z,h.imp);}}}
 if(n>=6)acc=0;
 const sp=car.speed;G.stats.topSpeed=Math.max(G.stats.topSpeed,sp);G.stats.dist+=sp*dt;G.tunnel=Math.abs(car.z-city.hill.tz)<HALF+1&&car.x>city.hill.x0&&car.x<city.hill.x1;
 // air time + stunts
 if(!car.onGround&&!airStart){airStart={x:car.x,z:car.z,t:G.time,kick:car.surf&&car.surf.kind==='kicker'?car.surf.k:lastKick};}
 if(car.onGround){lastKick=car.surf&&car.surf.kind==='kicker'?car.surf.k:null;if(airStart){const air=G.time-airStart.t,dist=Math.hypot(car.x-airStart.x,car.z-airStart.z);if(air>.35){car.nitro=Math.min(1,car.nitro+air*.15);jobs.onAir(air,dist,airStart.kick&&air>.5?airStart.kick:null);if(air>.6)hud.pop('AIR '+air.toFixed(1)+'s · '+Math.round(dist)+' M');}
   if(car.lastImpact>9){snd.land(car.lastImpact);car.dmg+=Math.max(0,car.lastImpact-12)*.8*car.spec.dur;shake=Math.max(shake,.25);}airStart=null;}}
 // drift chain
 if(car.onGround&&car.slip>4.5&&sp>10){driftT+=dt;car.nitro=Math.min(1,car.nitro+dt*.05);G.stats.drift+=dt;if(R()<.6)for(const s of[-1,1]){const bx=car.x-Math.sin(car.a)*1.4+Math.cos(car.a)*s*.9,bz=car.z-Math.cos(car.a)*1.4-Math.sin(car.a)*s*.9;smoke.emit(bx,car.y+.3,bz,(R()-.5)*1.5,.6+R()*.5,(R()-.5)*1.5,.6,.6,.63,1,1.8,-.2,2.4,.16);}if(driftT>.6)hud.pop('DRIFT '+driftT.toFixed(1)+'s'+(driftT>1.5?' · +$'+Math.round(driftT*4):''));}
 else if(driftT>0){if(driftT>1.5){const k=car.spec.id==='kitsune'?1.5:1;const pay=Math.round(driftT*4*k);if(!(jobs.active&&jobs.active.type==='fare'))G.earn(pay,'street','DRIFT');}driftT=0;}
 if(car.dmg>55&&R()<dt*car.dmg*.12){const fx=Math.sin(car.a),fz=Math.cos(car.a);smoke.emit(car.x+fx*1.8,car.y+1.1,car.z+fz*1.8,(R()-.5)*.5,1.5+R(),(R()-.5)*.5,car.dmg>80?.12:.4,car.dmg>80?.1:.4,car.dmg>80?.1:.42,.9,1.8,-.3,1.2,.5);if(car.dmg>85)sparks.emit(car.x+fx*1.8,car.y+.9,car.z+fz*1.8,(R()-.5),2,(R()-.5),3,1.2,.2,.3,.3,-2);}
 if(car.dmg>=100){totaled();return;}
 if(car.water){G.waterT=(G.waterT||0)+dt;if(G.waterT<dt*1.5){snd.splash();for(let i=0;i<30;i++)smoke.emit(car.x+(R()-.5)*3,car.y+.3,car.z+(R()-.5)*3,(R()-.5)*4,3+R()*3,(R()-.5)*4,.7,.75,.8,.8,1.2,6,1,.6);}if(G.waterT>1.6&&car.y<-1){G.waterT=0;const fee=100;G.cash-=fee;G.stats.repairs+=fee;hud.cash(-fee,'TOW');resetCar('FISHED OUT OF THE WATER');}}else G.waterT=0;
 // world systems
 traffic.update(dt,car,G);const hits=peds.update(dt,car,G);for(const p of hits){G.stats.peds++;G.cash-=40;G.stats.fines+=40;hud.cash(-40,'JAYWALKER');snd.thump();G.crime('ped',car.x,car.z);if(jobs.active&&jobs.active.pax)jobs.onCrash(15);}
 carContacts(dt);const pol=police.update(dt,car,G);
 if(G.wanted>0){if(pol.seen)G.escapeT=0;else{G.escapeT+=dt;if(G.escapeT>9){G.wanted=0;G.heat=0;hud.toast('LOST THEM','#9be27a',1.8);G.earn(60,'street','EVADED');}}
  if(pol.near>0&&sp<5)G.bustT+=dt*Math.min(2,pol.near);else G.bustT=Math.max(0,G.bustT-dt*.6);if(G.bustT>2.5)busted();}else G.bustT=0;
 // speeding past a patrol
 if(G.wanted===0&&sp>31){for(const c of police.cops){if(Math.hypot(c.x-car.x,c.z-car.z)<22){G.crime('speed',car.x,car.z);break;}}}
 jobs.update(dt,G);checkShops(dt);
 // GPS route to the active target (or nearest offer)
 G.routeT=(G.routeT||0)-dt;if(G.routeT<=0){G.routeT=.8;let tg=jobs.target();if(!tg&&!jobs.active){const dist=o=>Math.hypot(o.x-car.x,o.z-car.z);const o=jobs.offers.slice().sort((p,q)=>dist(p)-dist(q))[0];let cur=G.gpsOffer&&jobs.offers.includes(G.gpsOffer)?G.gpsOffer:null;if(!cur||(o&&dist(o)<dist(cur)*.6))cur=o;G.gpsOffer=cur;if(cur)tg={x:cur.x,z:cur.z};}G.route=tg?city.route(car.x,car.z,tg.x,tg.z).pts:null;buildRibbon(G.route);}
 // lights
 const night=world.state.night;headL.intensity=night>.25?lerp(0,140,cl((night-.25)*2,0,1)):0;tailL.intensity=night>.3?(inp.brk?6:2):0;
 // audio
 const cop=police.cops.reduce((b,c)=>Math.min(b,Math.hypot(c.x-car.x,c.z-car.z)),999);snd.car({on:true,speed:sp,thr:ci.thr,slip:car.slip,ground:car.onGround,rain:G.rain,tunnel:G.tunnel,siren:G.wanted,sirenD:cop});
 $('hitov').style.opacity=G.hitFx;$('nitroov').style.opacity=car.nitroOn?.8:0;
 hud.prompt(!jobs.active&&jobs.offers.some(o=>Math.hypot(o.x-car.x,o.z-car.z)<16)?'STOP IN THE BEACON TO TAKE THE JOB':car.y<-.5&&car.water?'':null);}
let lastKick=null;

/* ================= GPS ribbon ================= */
const ribMat=new THREE.MeshBasicMaterial({map:T.arrow,color:new THREE.Color(.4,1.4,.8),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});T.arrow.wrapT=THREE.RepeatWrapping;
let ribbon=null;
function buildRibbon(pts){if(ribbon){scene.remove(ribbon);ribbon.geometry.dispose();ribbon=null;}if(!pts||pts.length<2)return;const P=[],U=[],I=[];let L=0,k=0;const maxL=260;
 for(let i=1;i<pts.length&&L<maxL;i++){const[a0,b0]=pts[i-1],[a1,b1]=pts[i];const len=Math.hypot(a1-a0,b1-b0);if(len<.1)continue;const nx=-(b1-b0)/len*.55,nz=(a1-a0)/len*.55;const n=Math.ceil(len/4);for(let s=0;s<n&&L<maxL;s++){const t0=s/n,t1=(s+1)/n;const x0=a0+(a1-a0)*t0,z0=b0+(b1-b0)*t0,x1=a0+(a1-a0)*t1,z1=b0+(b1-b0)*t1;const y0=city.heightAt(x0,z0,car.y+1)+.14,y1=city.heightAt(x1,z1,car.y+1)+.14;
   P.push(x0+nx,y0,z0+nz,x0-nx,y0,z0-nz,x1-nx,y1,z1-nz,x1+nx,y1,z1+nz);const u0=L/2,u1=(L+len/n)/2;U.push(0,u0,1,u0,1,u1,0,u1);I.push(k,k+1,k+2,k,k+2,k+3);k+=4;L+=len/n;}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);ribbon=new THREE.Mesh(g,ribMat);ribbon.renderOrder=3;scene.add(ribbon);
 const a=jobs.active;const c=new THREE.Color(a?(a.type==='fare'?0x40ff90:a.type==='delivery'?0x40c0ff:a.type==='race'?0xc050ff:0xffe040):0xffc21a);ribMat.color.copy(c).multiplyScalar(1.2);}

/* ================= camera ================= */
const camPos=new V(),camLook=new V(),menuFocus=new V(WORLD/2,0,WORLD/2);
function cameraUpdate(dt){if(G.app==='menu'||G.app==='over'&&false){const a=menuT*.035;const r=260;menuFocus.set(WORLD/2+Math.cos(a*.7)*60,0,WORLD/2+Math.sin(a*.7)*60);cam.position.set(WORLD/2+Math.cos(a)*r,95+Math.sin(a*.6)*25,WORLD/2+Math.sin(a)*r);cam.lookAt(menuFocus.x,20,menuFocus.z);cam.fov=55;cam.updateProjectionMatrix();snd.car&&G.app==='menu'&&snd.ac&&snd.car({on:false,speed:0,thr:0,slip:0,ground:true,rain:G.rain,siren:0,sirenD:999});return;}
 if(G.app==='over'){const a=G.time*.1;cam.position.set(car.x+Math.cos(a)*14,car.y+5,car.z+Math.sin(a)*14);cam.lookAt(car.x,car.y+1,car.z);return;}
 const fx=Math.sin(car.a),fz=Math.cos(car.a);const sp=car.speed;const mode=G.opt.cam;shake=Math.max(0,shake-dt*1.5);
 // follow velocity direction a little when drifting
 const vdir=sp>4?Math.atan2(car.vx,car.vz):car.a;let d=((vdir-car.a+Math.PI*3)%(Math.PI*2))-Math.PI;const ca=car.a+d*.35;const cfx=Math.sin(ca),cfz=Math.cos(ca);
 let want,look;if(mode===2){want=new V(car.x+fx*.4,car.y+1.35,car.z+fz*.4);look=new V(car.x+fx*20,car.y+1.1,car.z+fz*20);}
 else{const back=(mode===1?12.5:7.2)+Math.min(3,sp*.05),up=(mode===1?5.2:2.7)+Math.min(1,sp*.015);want=new V(car.x-cfx*back,car.y+up,car.z-cfz*back);look=new V(car.x+fx*6,car.y+1.2,car.z+fz*6);}
 if(lookBack&&mode!==2){want=new V(car.x+fx*7,car.y+2.6,car.z+fz*7);look=new V(car.x-fx*6,car.y+1.2,car.z-fz*6);}
 // keep the camera out of buildings
 if(mode!==2){const dx=want.x-car.x,dz=want.z-car.z;const L=Math.hypot(dx,dz);for(let s=1;s<=10;s++){const t=s/10;const px=car.x+dx*t,pz=car.z+dz*t;let blocked=false;for(const o of city.near(px,pz)){if(o.kind!=='bld'&&o.kind!=='hill')continue;if(px>o.x0-.5&&px<o.x1+.5&&pz>o.z0-.5&&pz<o.z1+.5&&want.y<o.y1){blocked=true;break;}}if(blocked){want.x=car.x+dx*(t-.12);want.z=car.z+dz*(t-.12);want.y+=1.5*(1-t);break;}}
  if(G.tunnel)want.y=Math.min(want.y,car.y+5.5);}
 if(camSnap){camPos.copy(want);camLook.copy(look);camSnap=false;}else{camPos.lerp(want,Math.min(1,dt*(mode===2?30:6)));camLook.lerp(look,Math.min(1,dt*10));}
 const s=shake*shake;cam.position.set(camPos.x+(R()-.5)*s,camPos.y+(R()-.5)*s,camPos.z+(R()-.5)*s);cam.lookAt(camLook);cam.fov=62+Math.min(20,sp*.3)+(car.nitroOn?6:0);cam.updateProjectionMatrix();}

/* ================= rendering ================= */
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;Rr.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.4:q===1?1.1:.85));fxStack=null;fxSize='';const ms=q>=2?2048:1024;world.sun.shadow.mapSize.set(ms,ms);if(world.sun.shadow.map){world.sun.shadow.map.dispose();world.sun.shadow.map=null;}Rr.shadowMap.enabled=q>=1;world.sun.castShadow=q>=1;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(Rr.domElement.width!==Math.floor(w*Rr.getPixelRatio())||Rr.domElement.height!==Math.floor(h*Rr.getPixelRatio()))Rr.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
 const sc=h*Rr.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));smoke.U.uScale.value=sparks.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<3)Rr.shadowMap.needsUpdate=true;
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(Rr,scene,cam,{exposure:1,bloom:.85,bloomThreshold:.82,bloomRadius:.6,saturation:1.12,vignette:.38,grain:.03,ao:false,quality:gfx});fxSize='';}if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 Rr.toneMappingExposure=(world.state.exp||1);if(scene.environment!==world.state.env)scene.environment=world.state.env;if(fxStack.bloom){const n=world.state.night;fxStack.bloom.strength=lerp(.4,.75,n);fxStack.bloom.threshold=lerp(.92,.86,n);}
 fxStack.render();}

/* ================= menus ================= */
const hud=new HUD(G,city);G.hud=hud;
function saveOpt(){try{localStorage.setItem('pxd_drive_opt',JSON.stringify(G.opt));}catch(e){}}
const seg=(id,key,num=true,cb)=>{const el=$(id);const set=(v,init)=>{G.opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',String(num?+b.dataset.v:b.dataset.v)===String(v)));if(!init){saveOpt();cb&&cb(v);}};set(G.opt[key],true);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(num?+b.dataset.v:b.dataset.v));};
seg('o-len','len');seg('o-traffic','traffic');seg('o-diff','diff');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-rvol','rvol',true,v=>snd.setRadioVol(v));seg('o-cam','cam',true,()=>{camSnap=true;});
function renderGarage(){const c=career();$('garage').innerHTML=CARS.map(s=>{const ok=c.total>=s.unlock;const st=[['SPEED',s.max/70],['ACCEL',s.acc/24],['GRIP',s.grip/8.5],['TOUGH',.55/s.dur]];return`<button data-id="${s.id}" class="${s.id===G.opt.car?'on':''} ${ok?'':'lock'}"><b>${s.name}</b><i style="background:#${s.paint.toString(16).padStart(6,'0')}"></i><span>${s.blurb}</span>${ok?'':`<em>UNLOCK AT $${s.unlock.toLocaleString()} CAREER</em>`}<div class="st">${st.map(r=>`${r[0]}<u style="--v:${Math.round(Math.min(1,r[1])*100)}%"></u>`).join('')}</div></button>`;}).join('');
 $('garage').querySelectorAll('button').forEach(b=>b.onclick=()=>{const s=CARS.find(k=>k.id===b.dataset.id);if(c.total<s.unlock)return;G.opt.car=s.id;saveOpt();buildCar(s.id);car.place(WORLD/2,WORLD/2,0,city);renderGarage();});
 $('career').textContent=`CAREER $${Math.round(c.total).toLocaleString()} · BEST SHIFT $${Math.round(c.best).toLocaleString()} · ${c.shifts} SHIFTS`;}
renderGarage();
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>endShift('quit');
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Night Drive\nEarnings: $${a.pts||0}\nResult: ${a.won?'target met':'target missed'} · ${a.len||8} min shift\nCar: ${a.car||''} · Fares: ${a.fares||0} · Race wins: ${a.races||0}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] drive3d '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= boot ================= */
traffic.spawnAll(null);jobs.reset();car.place(WORLD/2,WORLD/2,0,city);world.setTime(17.6,0,0);
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.DRIVE={get state(){return G.app;},G,R:Rr,scene,cam,get P(){return car;},get car(){return car;},step,render,start,toMenu,pause,endShift,updateCam:cameraUpdate,keys,city,world,hud,snd,
 get mode(){return jobs.active?jobs.active.type+':'+jobs.active.stage:'free';},get target(){return jobs.target();},get traffic(){return traffic.cars;},get jobs(){return jobs;},get police(){return police;},get peds(){return peds;},
 setClock(s){G.shiftLeft=s;},setHour(h){G.shiftLeft=G.shiftLen*(1-(h-17.25)/8.25);setTimeOfDay();},setInput(o){G.ai=o;},teleport(x,z,a=0){car.place(x,z,a,city);camSnap=true;},
 earn:(n)=>G.earn(n,'street','TEST'),setWanted:n=>{G.wanted=n;},damage:n=>{car.dmg+=n;},setQuality:applyQuality,get gfx(){return gfx;},CARS,
 acceptNearest(type){const o=jobs.offers.filter(j=>!type||j.type===type).sort((p,q)=>Math.hypot(p.x-car.x,p.z-car.z)-Math.hypot(q.x-car.x,q.z-car.z))[0];if(!o)return null;car.place(o.x,o.z,car.a,city);jobs.accept(o);return o.type;},
 arrive(){const a=jobs.active;if(!a)return false;if(a.type==='race'){for(const c of jobs.cp){car.place(c.x,c.z,car.a,city);step(1/60);}return true;}car.place(a.dx,a.dz,car.a,city);car.vx=car.vz=0;return true;}};
