// STARSHIP SUSPECTS — full 3D social deduction aboard a starship. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import * as M from './map.js';
import {Sim,C,CREW,WIN} from './sim.js';
import * as AI from './ai.js';
import {buildShip,drawFog,FOG,makeEnv,Particles,buildSpace} from './world.js';
import {makeCrew,animate,setGhost,makeBody,animateBody} from './crew.js';
import {TaskUI} from './tasks.js';
import {Sound} from './sound.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a;
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x04060b);scene.environment=makeEnv(R);
const hemi=new THREE.HemisphereLight(0x9fb4e6,0x1a1d26,.55);scene.add(hemi);
const key=new THREE.DirectionalLight(0xc6d4ff,.75);key.position.set(M.MW/2-14,42,M.MH/2+22);key.target.position.set(M.MW/2,0,M.MH/2);key.castShadow=true;
Object.assign(key.shadow.camera,{left:-44,right:44,top:34,bottom:-34,near:10,far:110});key.shadow.bias=-.0006;key.shadow.normalBias=.03;scene.add(key,key.target);
const lamp=new THREE.SpotLight(0xffe8cc,0,18,.75,.85,1.2);lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.bias=-.0008;lamp.shadow.camera.near=.3;scene.add(lamp,lamp.target);
const flash=new THREE.PointLight(0xff5a30,0,9,1.6);scene.add(flash);
const ship=buildShip(scene);const parts=new Particles(scene,2500);const space=buildSpace();
const cam=new THREE.PerspectiveCamera(36,1,.5,400);
const snd=new Sound(),tasks=new TaskUI(snd);

/* ================= state ================= */
let opt={role:0,sabs:2,diff:1,clock:720,conf:1,color:0};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_suspects_opt'))||{});}catch(e){}
let sim=null,app='menu',introT=0,overT=0,overShown=false,ffwd=false,time=0,mapOpen=false,shake=0,lastAward=null,banT=0,stepT=0,fogR=7,camLook=new V(),camPos=new V(),camSnap=true,menuT=0,ejectRig=null,ejectT=0,kills=[];
let rigs=[],labels=[],bodyRigs=new Map(),selT=null,lastSay=0,chatN=0,meetStage='',quickBuilt=false,winners=[];
const mouse={x:0,y:0,t:-99,wx:0,wz:0},ray=new THREE.Raycaster(),ground=new THREE.Plane(new V(0,1,0),-.6);

function buildRigs(){for(const r of rigs)scene.remove(r);for(const r of bodyRigs.values())scene.remove(r);bodyRigs.clear();rigs=[];$('labels').innerHTML='';labels=[];
 for(const c of sim.crew){const r=makeCrew(c.css);scene.add(r);rigs.push(r);const l=document.createElement('div');l.textContent=c.name;l.style.color=c.css;$('labels').appendChild(l);labels.push(l);}}
function newSim(o){sim=new Sim(o);buildRigs();camSnap=true;}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o.opt||{});try{localStorage.setItem('pxd_suspects_opt',JSON.stringify(opt));}catch(e){}snd.init();
 const role=o.role||(opt.role===2?(Math.random()<.22?'sab':'crew'):opt.role===1?'sab':'crew');
 newSim({role,sabs:opt.sabs,diff:opt.diff,clock:o.clock??opt.clock,confirm:!!opt.conf,color:opt.color,seed:o.seed??null,autopilot:!!o.autopilot,discuss:o.discuss,vote:o.vote});
 app='intro';introT=o.skipIntro?0:3.8;overShown=false;ffwd=false;mapOpen=false;$('map').hidden=true;tasks.close();kills=[];
 $('menu').hidden=$('keys').hidden=$('over').hidden=$('pause').hidden=$('meet').hidden=$('eject').hidden=true;$('hud').hidden=false;$('ghost').hidden=true;document.body.classList.add('playing');
 document.body.classList.toggle('sab',sim.player.sab);setupMap();showIntro();snd.play('role');snd.humLevel(.05);}
function showIntro(){const p=sim.player,mates=sim.crew.filter(c=>c.sab&&c!==p);$('intro').hidden=false;
 $('ieye').textContent=p.sab?'YOUR ROLE':`${sim.crew.filter(c=>c.sab).length} SABOTEUR${opt.sabs>1?'S':''} ABOARD`;$('irole').textContent=p.sab?'SABOTEUR':'CREWMATE';$('irole').style.color=p.sab?'#ff3b30':'#6cf7ff';
 $('idesc').textContent=p.sab?'Blend in. Fake tasks, kill when nobody is watching, vent to escape, sabotage the ship. Lie well in meetings: the crew remember where they saw you.':`Finish your ${p.tasks.length} tasks, watch your crewmates, report bodies and vote out the saboteurs before the clock runs out.`;
 $('imates').innerHTML=p.sab&&mates.length?mates.map(c=>`<span style="color:${c.css}">PARTNER · ${c.name}</span>`).join(''):`<span style="color:${p.css}">YOU ARE ${p.name}</span>`;}
function toMenu(){app='menu';tasks.close();mapOpen=false;$('map').hidden=true;newSim({autopilot:true,attract:true,sabs:2,diff:1,color:opt.color});
 $('menu').hidden=$('keys').hidden=false;$('over').hidden=$('pause').hidden=$('hud').hidden=$('meet').hidden=$('eject').hidden=$('intro').hidden=true;document.body.classList.remove('playing','sab');snd.alarm(false);menuStats();}
function pause(on){if(on&&app==='play'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');}else if(!on&&app==='paused'){app='play';$('pause').hidden=true;document.body.classList.add('playing');}}

/* ================= input ================= */
const keys={};
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'){if(e.code==='Escape')e.target.blur();return;}
 if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 const first=!keys[e.code];keys[e.code]=true;if(!first)return;
 if(e.code==='Escape'){if(mapOpen){toggleMap(false);return;}if(app==='play')pause(true);else if(app==='paused')pause(false);return;}
 if(app!=='play'||!sim||sim.phase!=='play'||tasks.active)return;
 const p=sim.player;
 if(p.vent){if(e.code==='KeyA'||e.code==='ArrowLeft')sim.ventMove(p,-1);else if(e.code==='KeyD'||e.code==='ArrowRight')sim.ventMove(p,1);}
 if(e.code==='KeyE'||e.code==='Space')act('use');else if(e.code==='KeyR')act('report');else if(e.code==='KeyQ')act('kill');else if(e.code==='KeyV')act('vent');else if(e.code==='Tab'||e.code==='KeyM')toggleMap();});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.t=time;});
document.querySelectorAll('#acts .a').forEach(b=>b.addEventListener('click',()=>act(b.dataset.a)));
const padPrev={};
function readInput(){const p=sim.player;let x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),z=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
 if(p.vent)x=z=0;let fx=null,fz=null;
 const g=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;
 if(g){const ax=g.axes,dz=v=>Math.abs(v)>.2?v:0;if(!p.vent){x+=dz(ax[0]||0);z+=dz(ax[1]||0);}const rx=dz(ax[2]||0),ry=dz(ax[3]||0);if(rx||ry){const l=Math.hypot(rx,ry);fx=rx/l;fz=ry/l;mouse.t=-99;}
  const bt=i=>g.buttons[i]&&g.buttons[i].pressed;const edge=(i,n)=>{const v=bt(i);const r=v&&!padPrev[n];padPrev[n]=v;return r;};
  if(app==='play'&&sim.phase==='play'&&!tasks.active){if(edge(0,'a'))act('use');if(edge(1,'b'))act('report');if(edge(2,'x'))act('kill');if(edge(3,'y'))toggleMap();if(edge(7,'rt'))act('vent');if(p.vent){if(edge(4,'lb'))sim.ventMove(p,-1);if(edge(5,'rb'))sim.ventMove(p,1);}}
  if(edge(9,'st')){if(app==='play')pause(true);else if(app==='paused')pause(false);}padPrev.hold=bt(0);}
 if(tasks.active||mapOpen||p.busy&&p.busy.kind!=='fake')x=z=0;
 const l=Math.hypot(x,z);if(l>1){x/=l;z/=l;}sim.input.x=x;sim.input.z=z;
 if(p.busy&&p.busy.kind==='fake'&&l>.1)p.busy=null;
 // aim the lamp at the mouse when it has moved recently
 if(fx==null&&time-mouse.t<2.5&&!p.vent){const nd=new THREE.Vector2(mouse.x/innerWidth*2-1,-(mouse.y/innerHeight)*2+1);ray.setFromCamera(nd,cam);const hit=new V();if(ray.ray.intersectPlane(ground,hit)){const dx=hit.x-p.x,dz=hit.z-p.z,d=Math.hypot(dx,dz);if(d>.4){fx=dx/d;fz=dz/d;}}}
 sim.input.fx=fx;sim.input.fz=fz;}
function holdingUse(){return keys.KeyE||keys.Space||padPrev.hold;}
function act(a){if(app!=='play'||!sim||sim.phase!=='play'||tasks.active)return;const p=sim.player,A=sim.actions();snd.init();
 if(a==='use'){if(A.fix){if(sim.sab.kind==='lights')openFix('lights',A.fix);else if(sim.sab.kind==='oxygen')openFix('keypad',A.fix);return;}
  if(A.button){sim.button(p);return;}
  if(A.use){const st=A.use.st;if(A.use.kind==='task'){sim.setBusy(p,st,'task');tasks.open(st.type,{room:M.placeName(st.x,st.z),id:p.name,onDone:()=>{p.busy=null;sim.completeTask(p,st.id);},onClose:()=>{p.busy=null;}});}else{sim.setBusy(p,st,'fake');}return;}
  if(A.vent&&p.sab)act('vent');return;}
 if(a==='report'&&A.report){sim.report(p,A.report);return;}
 if(a==='kill'&&A.kill){sim.kill(p,A.kill);return;}
 if(a==='vent'){if(p.vent){sim.ventExit(p);snd.play('vent');}else if(A.vent){sim.ventEnter(p,A.vent);snd.play('vent');}return;}
 if(a==='sab')toggleMap();}
function openFix(type,panel){const p=sim.player;tasks.open(type,{room:M.placeName(panel.x,panel.z),onDone:()=>sim.fixPanel(p,panel.id)});}

/* ================= map + sabotage ================= */
const mapBase=document.createElement('canvas');
function paintMap(g,s,full){g.clearRect(0,0,g.canvas.width,g.canvas.height);g.save();g.translate(s*1.5,s*1.5);
 for(const h of M.HALLS){g.fillStyle='#232a36';g.fillRect(h[0]*s,h[2]*s,(h[1]-h[0])*s,(h[3]-h[2])*s);}
 M.ROOMS.forEach(r=>{g.fillStyle='#2f3a4c';g.fillRect(r.r[0]*s,r.r[2]*s,(r.r[1]-r.r[0])*s,(r.r[3]-r.r[2])*s);g.strokeStyle='#6c7a92';g.lineWidth=Math.max(1,s*.12);g.strokeRect(r.r[0]*s,r.r[2]*s,(r.r[1]-r.r[0])*s,(r.r[3]-r.r[2])*s);
  if(full){g.fillStyle='#c8d2e2';g.font=`700 ${Math.round(s*.85)}px JetBrains Mono, monospace`;g.textAlign='center';g.fillText(r.n,r.cx*s,r.cz*s+s*.3);}});g.restore();}
function setupMap(){mapBase.width=840;mapBase.height=492;paintMap(mapBase.getContext('2d'),11.5,true);
 const host=$('sabs');host.innerHTML='';if(!sim.player.sab)return;
 for(const k of['lights','reactor','oxygen']){const b=document.createElement('button');b.dataset.k=k;b.textContent=k.toUpperCase();b.onclick=()=>{if(sim.sabotage(k,-1,sim.player))toggleMap(false);};host.appendChild(b);}}
function toggleMap(on=!mapOpen){if(on&&(app!=='play'||sim.phase!=='play'))return;mapOpen=on;$('map').hidden=!on;$('mtip').textContent=sim.player.sab&&sim.player.alive?'Click a room to seal its doors for 10s.':'Yellow: your tasks.';}
$('map').querySelector('.tx').onclick=()=>toggleMap(false);
$('bigmap').addEventListener('click',e=>{if(!sim||!sim.player.sab||!sim.player.alive)return;const r=e.target.getBoundingClientRect(),s=11.5,x=(e.clientX-r.left)/r.width*840/s-1.5,z=(e.clientY-r.top)/r.height*492/s-1.5;const room=M.roomAt(x,z);if(room>=0&&sim.sabotage('doors',room,sim.player)){}});
function drawMapDyn(g,s,full){const p=sim.player;g.save();g.translate(s*1.5,s*1.5);const t=time;
 if(!p.sab||full)for(const tk of p.tasks)if(!tk.done&&(!p.sab||full)){g.fillStyle=p.sab?'#8a8f9a':'#ffd23a';g.beginPath();g.arc(tk.st.x*s,tk.st.z*s,Math.max(2.5,s*.32),0,7);g.fill();}
 if(sim.sab.kind&&sim.sab.kind!=='doors'){for(const f of M.FIX[sim.sab.kind]){if(sim.sab.done[f.id])continue;g.fillStyle=`rgba(255,60,50,${.5+.5*Math.sin(t*8)})`;g.beginPath();g.arc(f.x*s,f.z*s,Math.max(4,s*.6),0,7);g.fill();}}
 M.DOORS.forEach((d,i)=>{if(d.closed>0){g.strokeStyle='#ff5a4d';g.lineWidth=2;const r=M.ROOMS[i].r;g.strokeRect(r[0]*s,r[2]*s,(r[1]-r[0])*s,(r[3]-r[2])*s);}});
 if(full&&p.sab){for(const v of M.VENTS){g.fillStyle='#7d8696';g.fillRect(v.x*s-3,v.z*s-2,6,4);}M.ROOMS.forEach((r,i)=>{const cd=sim.sab.doorCd[i];if(cd>0){g.fillStyle='#ff8a7a';g.font='700 11px JetBrains Mono, monospace';g.textAlign='center';g.fillText('DOORS '+Math.ceil(cd)+'s',r.cx*s,r.cz*s+16);}});}
 g.translate(p.x*s,p.z*s);g.rotate(Math.atan2(p.fz,p.fx));g.fillStyle=p.css;g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.moveTo(s*.9,0);g.lineTo(-s*.5,s*.55);g.lineTo(-s*.5,-s*.55);g.closePath();g.fill();g.stroke();g.restore();}
const mini=$('mini').getContext('2d'),miniBase=document.createElement('canvas');miniBase.width=232;miniBase.height=140;paintMap(miniBase.getContext('2d'),3.15,false);

/* ================= sim events -> sound, particles, UI ================= */
function events(){if(!sim)return;const p=sim.player;const live=app==='play';
 for(const e of sim.events.splice(0)){
  if(e.type==='kill'){const v=sim.crew[e.victim],k=sim.crew[e.killer];const br=makeBody(v.css,v.fx,v.fz);br.position.set(e.x,0,e.z);scene.add(br);const b=sim.bodies.find(b=>b.victim===e.victim);bodyRigs.set(b?b.id:'k'+e.victim,br);
   const seen=!live||!p.alive||p.sab&&k===p||sim.sees(p,e.x,e.z);if(seen){parts.burst(new V(e.x,.8,e.z),70,7,[new THREE.Color(2.6,.4,.2),new THREE.Color(2.4,2.2,1.8),new THREE.Color(1.4,.1,.05)],.22,.9,{grav:9});flash.position.set(e.x,1.2,e.z);flash.intensity=40;if(live)snd.play('kill');}
   if(live&&v===p){$('flash').style.opacity=1;setTimeout(()=>$('flash').style.opacity=0,900);banner('ELIMINATED',`${k.name} GOT YOU · YOU ARE NOW A GHOST`,'#ff3b30',3.2);tasks.close();toggleMap(false);shake=1;}
   else if(live&&k===p){shake=.6;}}
  else if(e.type==='vent'||e.type==='ventMove'){const vo=ship.vents.find(x=>x.v.id===e.vent);if(vo){vo.open=1;if(e.type==='vent'&&(!live||sim.sees(p,vo.v.x,vo.v.z)||e.who===p.id)){parts.burst(new V(vo.v.x,.2,vo.v.z),24,2.5,new THREE.Color(.5,.55,.6),.5,.8,{up:2});if(live)snd.play('vent');}}}
  else if(!live)continue;
  else if(e.type==='meeting'){tasks.close();toggleMap(false);snd.play(e.body?'body':'meeting');setTimeout(()=>snd.play('meeting'),e.body?700:0);openMeeting(e);}
  else if(e.type==='stage')meetingStage(e);
  else if(e.type==='resume'){$('eject').hidden=true;$('meet').hidden=true;for(const r of bodyRigs.values())scene.remove(r);bodyRigs.clear();if(ejectRig){space.scene.remove(ejectRig);ejectRig=null;}camSnap=true;snd.humLevel(.05);}
  else if(e.type==='sabotage'){const T={lights:['LIGHTS OUT','FIX THE BREAKERS IN ELECTRICAL','#ffd23a'],reactor:['REACTOR MELTDOWN','HOLD BOTH PANELS IN REACTOR AT ONCE','#ff3b30'],oxygen:['OXYGEN DEPLETING','ENTER CODES IN O2 GARDEN AND CAFETERIA','#ff3b30']}[e.kind];banner(T[0],T[1],T[2],2.4);snd.play(e.kind==='lights'?'lights':'body');}
  else if(e.type==='fixed'){snd.play('fixed');banner('SYSTEM RESTORED',e.kind.toUpperCase()+' BACK ONLINE','#5cff9d',1.6);}
  else if(e.type==='doors'){const r=M.ROOMS[e.room];if(Math.hypot(r.cx-p.x,r.cz-p.z)<16)snd.play('door');}
  else if(e.type==='task'){if(e.who===p.id)snd.play('done');}
  else if(e.type==='chat')snd.play('chat');
  else if(e.type==='vote')snd.play('vote');
  else if(e.type==='over'){const won=(e.side==='crew')!==p.sab;banner(e.side==='crew'?'CREW WINS':'SABOTEURS WIN',WIN[e.why],e.side==='crew'?'#6cf7ff':'#ff3b30',3);snd.play(won?'win':'lose');snd.alarm(false);overT=0;tasks.close();toggleMap(false);$('meet').hidden=true;$('eject').hidden=true;}}}

/* ================= meeting UI ================= */
function openMeeting(e){const m=sim.meeting,c=sim.crew[e.caller];selT=null;banTimer=0;$('banner').classList.remove('on');chatN=0;meetStage='intro';quickBuilt=false;
 $('meet').hidden=false;$('meet').classList.toggle('dead',!sim.player.alive);$('chat').innerHTML='';
 $('mtitle').textContent=e.body?'BODY REPORTED':'EMERGENCY MEETING';$('mtitle').style.color=e.body?'#ff3b30':'#ffd23a';
 $('msub').textContent=e.body?`${c.name} FOUND ${sim.crew[m.victim].name} IN ${M.placeName(m.body.x,m.body.z)}`:`CALLED BY ${c.name}`;
 sys(e.body?`${c.name} reported ${sim.crew[m.victim].name}'s body in ${M.prettyPlace(m.body.k)}.`:`${c.name} pressed the emergency button.`);
 if(!sim.player.alive)sys('You are dead. Ghosts can watch but not speak or vote.');
 const t=$('tiles');t.innerHTML='';for(const x of sim.crew){const d=document.createElement('div');d.className='tile'+(x.alive?'':' dead')+(x===sim.player?' me':'')+(sim.player.sab&&x.sab&&x!==sim.player?' sab':'');d.dataset.id=x.id;
  d.innerHTML=`<div class="hd" style="background:${x.css}"></div><div><span class="nm">${x.name}</span><span class="st">${x.alive?(x.id===e.caller?(e.body?'📣 REPORTED':'📣 CALLED'):'&nbsp;'):x.ejected?'EJECTED':'DEAD'}</span></div><span class="vd" hidden>VOTED</span><span class="vs"></span>`;
  d.onclick=()=>{if(!x.alive||x===sim.player)return;selT=x.id;document.querySelectorAll('.tile').forEach(q=>q.classList.toggle('sel',+q.dataset.id===selT));updTarget();};t.appendChild(d);}
 const cs=$('claim');cs.innerHTML='<option value="">CLAIM A ROOM…</option>'+M.ROOMS.map((r,i)=>`<option value="${i}">I WAS IN ${r.n}</option>`).join('');
 $('skips').innerHTML='';updTarget();$('quick').innerHTML='';}
function sys(t){const d=document.createElement('div');d.className='sys';d.textContent='— '+t;$('chat').appendChild(d);$('chat').scrollTop=1e9;}
function updTarget(){const m=sim.meeting;if(!m)return;const can=sim.player.alive&&(m.stage==='discuss'||m.stage==='vote'),voted=m.votes.has(sim.player.id),ok=selT!=null&&sim.crew[selT].alive;
 $('tname').textContent=ok?'▸ '+sim.crew[selT].name:'Select a crewmate';$('tname').style.color=ok?sim.crew[selT].css:'';
 document.querySelectorAll('#tgt button').forEach(b=>b.disabled=!can||!ok||(b.dataset.t==='vote'&&(m.stage!=='vote'||voted)));
 $('vskip').disabled=!can||m.stage!=='vote'||voted;$('say').querySelectorAll('input,select,button').forEach(b=>b.disabled=!can);}
function buildQuick(){const q=$('quick');q.innerHTML='';for(const l of AI.quickLines(sim)){const b=document.createElement('button');b.className='sm';b.textContent=l.label;b.onclick=()=>say(l.st);q.appendChild(b);}quickBuilt=true;}
function say(st){if(time-lastSay<1)return;if(sim.say(sim.player,st))lastSay=time;}
document.querySelectorAll('#tgt button').forEach(b=>b.onclick=()=>{if(selT==null)return;const t=b.dataset.t;
 if(t==='vote'){if(sim.castVote(sim.player,selT))updTarget();return;}
 if(t==='accuse')say({kind:'accuse',target:selT,conf:.7,why:''});else if(t==='clear')say({kind:'clear',target:selT});
 else{const s=sim.player.mem.seen[selT],e=s[s.length-1];say(e?{kind:sim.crew[selT].alive?'saw':'lastseen',target:selT,k:e.k,t:e.t1,task:e.task}:{kind:'chat',text:`I haven't seen ${sim.crew[selT].name} at all.`});}});
$('vskip').onclick=()=>{if(sim.castVote(sim.player,-1))updTarget();};
$('claim').onchange=e=>{const v=e.target.value;if(v!==''){say(AI.claimRoom(sim,+v));e.target.value='';}};
$('say').onsubmit=e=>{e.preventDefault();const i=$('msg'),v=i.value.trim();if(!v)return;say(AI.parseText(sim,v));i.value='';};
function meetingStage(e){meetStage=e.stage;const m=sim.meeting;if(!m)return;
 if(e.stage==='discuss'){sys('Discussion open. Share what you saw.');if(sim.player.alive)buildQuick();}
 if(e.stage==='vote')sys('Voting is open. Click a crewmate, then VOTE, or SKIP.');
 if(e.stage==='reveal'){const counts=m.counts;sys(m.ejected!=null?`${sim.crew[m.ejected].name} received the most votes.`:m.tie?'The vote is tied. Nobody is ejected.':'Most crew skipped. Nobody is ejected.');
  for(const[v,t]of m.votes){const chip=`<i style="background:${sim.crew[v].css}" title="${sim.crew[v].name}"></i>`;if(t===-1)$('skips').insertAdjacentHTML('beforeend',chip);else{const tile=document.querySelector(`.tile[data-id="${t}"] .vs`);if(tile)tile.insertAdjacentHTML('beforeend',chip);}}}
 if(e.stage==='eject'){$('meet').hidden=true;$('eject').hidden=false;ejectT=0;const ej=e.ejected!=null?sim.crew[e.ejected]:null;
  if(ej){if(ejectRig)space.scene.remove(ejectRig);ejectRig=makeCrew(ej.css);space.scene.add(ejectRig);snd.play('eject');}
  const sabsLeft=sim.crew.filter(c=>c.sab&&c.alive&&c!==ej).length;
  $('etext').dataset.full=ej?(sim.o.confirm?`${ej.name} was ${ej.sab?'a saboteur.':'not a saboteur.'}`:`${ej.name} was ejected.`):'No one was ejected.';
  $('esub').dataset.full=ej?(sim.o.confirm?`${sabsLeft} saboteur${sabsLeft===1?'':'s'} remain${sabsLeft===1?'s':''}.`:''):(m.tie?'(TIED VOTE)':'(SKIPPED)');$('etext').textContent='';$('esub').textContent='';snd.humLevel(.012);}
 updTarget();}
function meetingUI(){const m=sim.meeting;if(!m||$('meet').hidden)return;
 const lim=m.stage==='discuss'?sim.o.discuss:m.stage==='vote'?sim.o.vote:0;$('mclock').textContent=m.stage==='intro'?'…':m.stage==='reveal'?'RESULTS':(m.stage==='vote'?'VOTE ':'TALK ')+fmt(lim-m.t);$('mclock').className=m.stage==='vote'?'vote':'';
 while(chatN<m.chat.length){const l=m.chat[chatN++],c=sim.crew[l.who];const d=document.createElement('div');d.className='ln'+(c===sim.player?' me':'');
  d.innerHTML=`<i style="background:${c.css}"></i><div><b style="color:${c.css}">${c.name}${c===sim.player?' (YOU)':''}</b>${esc(l.text)}${l.kind==='accuse'&&l.conf?`<em>${Math.round(l.conf*100)}% SURE</em>`:''}</div>`;$('chat').appendChild(d);$('chat').scrollTop=1e9;}
 for(const[v]of m.votes){const el=document.querySelector(`.tile[data-id="${v}"] .vd`);if(el&&el.hidden)el.hidden=false;}
 if(m.stage==='discuss'&&!quickBuilt&&sim.player.alive)buildQuick();}

/* ================= HUD ================= */
let banTimer=0;function banner(t,s,c,d){$('banner').querySelector('b').textContent=t;$('banner').querySelector('b').style.color=c;$('banner').querySelector('span').textContent=s;$('banner').classList.add('on');banTimer=d;}
const hc={};const setT=(id,v)=>{if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}};
function hud(dt){if(banTimer>0){banTimer-=dt;if(banTimer<=0)$('banner').classList.remove('on');}
 if(app!=='play'&&app!=='paused')return;const p=sim.player,S=sim.sab;
 $('bar').querySelector('i').style.width=(100*sim.taskDone/sim.taskTotal).toFixed(1)+'%';
 setT('clock',fmt(sim.clock));$('clock').classList.toggle('low',sim.clock<60);
 const al=sim.crew.filter(c=>c.alive).length;setT('alive',`${al} ALIVE · ${sim.meetings} MEETING${sim.meetings===1?'':'S'}`);
 const roleTxt=p.sab?`<span style="color:#ff3b30">SABOTEUR</span><small>${p.alive?'FAKE TASKS · KILL · SABOTAGE':'GHOST · WATCHING'}</small>`:`<span style="color:#6cf7ff">CREWMATE</span><small>${p.alive?'DO TASKS · FIND THE SABOTEURS':'GHOST · KEEP DOING TASKS'}</small>`;if(hc.role!==roleTxt){hc.role=roleTxt;$('role').innerHTML=roleTxt;}
 let list=p.tasks.map(t=>`<li class="${t.done&&!p.sab?'done':''}"><b>${M.placeName(t.st.x,t.st.z)}:</b> ${M.TASK_TYPES[t.st.type].n}</li>`).join('');
 if(S.kind&&S.kind!=='doors')list=`<li class="fix">${S.kind==='lights'?'FIX LIGHTS · ELECTRICAL':S.kind==='reactor'?'REACTOR · HOLD BOTH PANELS':'OXYGEN · O2 GARDEN + CAFETERIA'}</li>`+list;if(p.sab)list=`<li class="fix">${p.alive?(p.killCd>0?`KILL READY IN ${Math.ceil(p.killCd)}s`:'KILL READY'):'YOU WERE CAUGHT'}${S.cd>0&&p.alive?` · SABOTAGE ${Math.ceil(S.cd)}s`:''}</li>`+list;
 if(hc.list!==list){hc.list=list;$('tasks').innerHTML=list;}
 // alert
 const at=S.kind==='reactor'||S.kind==='oxygen'?`⚠ ${S.kind==='reactor'?'REACTOR MELTDOWN':'OXYGEN DEPLETED'} IN ${Math.ceil(S.t)}s`+(S.kind==='oxygen'?` · ${Object.keys(S.done).length}/2 CODES`:''):S.kind==='lights'?'LIGHTS OUT · RESTORE THE BREAKERS IN ELECTRICAL':'';
 $('alert').hidden=!at;if(at){setT('alert',at);$('alert').classList.toggle('lights',S.kind==='lights');}
 // actions
 const A=sim.phase==='play'?sim.actions():{};const setA=(k,on,lab)=>{const b=document.querySelector(`.a[data-a="${k}"]`);b.classList.toggle('on',!!on);b.classList.toggle('off',!on);if(lab&&b.firstChild.textContent!==lab)b.firstChild.textContent=lab;};
 const useLab=A.fix?(S.kind==='reactor'?'HOLD':'FIX'):A.button?'BUTTON':A.use?(A.use.kind==='fake'?'FAKE':M.TASK_TYPES[A.use.st.type].n.split(' ')[0]):(A.vent&&p.sab?'VENT':'USE');
 setA('use',A.fix||A.button||A.use||(A.vent&&p.sab),useLab);setA('report',A.report);setA('kill',A.kill&&p.killCd<=0);setA('vent',A.vent);setA('sab',p.sab&&p.alive&&(S.cd<=0&&!S.kind));
 const ke=document.querySelector('.a.k em');const kt=p.sab&&p.alive&&p.killCd>0?String(Math.ceil(p.killCd)):'';if(ke.textContent!==kt)ke.textContent=kt;
 let pr='';if(sim.phase==='play'){if(p.vent)pr='IN VENT · A / D TO TRAVEL · V TO EXIT';else if(A.report)pr=`R · REPORT ${sim.crew[A.report.victim].name}'S BODY`;else if(A.kill&&p.killCd<=0)pr=`Q · KILL ${A.kill.name}`;else if(A.fix)pr=S.kind==='reactor'?'HOLD E · KEEP YOUR HAND ON THE PANEL':'E · REPAIR';else if(A.button)pr=`E · EMERGENCY MEETING (${p.emergency} LEFT)`;else if(A.use)pr=`E · ${A.use.kind==='fake'?'PRETEND TO ':''}${M.TASK_TYPES[A.use.st.type].n}`;else if(A.vent&&p.sab)pr='V · ENTER VENT';
  else if(Math.hypot(p.x-M.BUTTON.x,p.z-M.BUTTON.z)<M.BUTTON.r&&p.alive&&p.emergency>0&&!sim.canButton(p))pr=S.kind==='reactor'||S.kind==='oxygen'?'NO MEETINGS DURING A CRISIS':`BUTTON READY IN ${Math.ceil(C.meetCd-(sim.pt-sim.lastMeet))}s`;}
 setT('prompt',pr);$('prompt').classList.toggle('on',!!pr);
 // progress (fake task / reactor hold)
 let pv=-1,pl='';if(p.busy&&p.busy.kind==='fake'){pv=p.busy.t/p.busy.dur;pl='PRETENDING · '+M.TASK_TYPES[p.busy.st.type].n;}else if(S.kind==='reactor'&&A.fix&&holdingUse()){const other=M.FIX.reactor.find(f=>f.id!==A.fix.id);pv=S.hold[other.id]>0?Math.min(1,S.holdT/.6):.5;pl=S.hold[other.id]>0?'BOTH PANELS HELD':'HOLDING · WAITING FOR THE OTHER PANEL';}
 $('prog').hidden=pv<0;if(pv>=0){$('prog').querySelector('i').style.width=(pv*100)+'%';$('prog').querySelector('span').textContent=pl;}
 $('ghost').hidden=p.alive||sim.phase!=='play';$('ff').classList.toggle('on',ffwd);
 // minimap
 mini.clearRect(0,0,232,140);mini.drawImage(miniBase,0,0);drawMapDyn(mini,3.15,false);
 if(mapOpen){const g=$('bigmap').getContext('2d');g.clearRect(0,0,840,492);g.drawImage(mapBase,0,0);drawMapDyn(g,11.5,true);
  document.querySelectorAll('#sabs button').forEach(b=>b.disabled=!sim.canSabotage(b.dataset.k)||!p.alive);}}
$('ff').onclick=()=>{ffwd=!ffwd;};

/* ================= visuals ================= */
const tmp=new V(),tmp2=new V(),ALARM=new THREE.Color(1,.12,.06);
function shown(c){const p=sim.player;if(app==='menu')return c.alive;if(c===p)return!c.vent&&(c.alive||!p.alive);
 if(!c.alive)return!p.alive&&!c.ejected;if(c.vent)return false;if(!p.alive||sim.phase!=='play'||app==='over')return true;return sim.sees(p,c.x,c.z,1.03);}
function visuals(dt){time+=dt;FOG.U.uTime.value=time;const p=sim.player,m=sim.meeting,S=sim.sab;
 const meetPose=m&&m.stage!=='eject',overPose=app==='over';
 // crew rigs
 const live=sim.crew.filter(c=>c.alive);
 sim.crew.forEach((c,i)=>{const r=rigs[i],u=r.userData;let vis=shown(c),x=c.x,z=c.z,fx=c.fx,fz=c.fz,sp=Math.hypot(c.vx,c.vz)/C.speed,busy=!!c.busy;
  if(meetPose){vis=c.alive;const k=live.indexOf(c),a=k/live.length*Math.PI*2+.6;x=M.BUTTON.x+Math.cos(a)*2.4;z=M.BUTTON.z+Math.sin(a)*2.4;fx=-Math.cos(a);fz=-Math.sin(a);sp=0;busy=false;}
  if(overPose){const k=winners.indexOf(c);vis=k>=0;x=M.BUTTON.x-(winners.length-1)*.55+k*1.1;z=M.BUTTON.z+2.6;fx=0;fz=1;sp=0;busy=false;}
  r.visible=vis;if(!vis){labels[i].style.display='none';return;}
  setGhost(r,!c.alive&&!overPose);r.position.set(x,0,z);r.rotation.y=Math.atan2(fx,fz);animate(r,dt,{speed:cl(sp,0,1.2),busy,ghost:!c.alive&&!overPose});
  // name label
  tmp.set(x,c.alive?1.78:2.05,z).project(cam);const L=labels[i];if(tmp.z<1&&app!=='menu'&&app!=='over'&&!m){L.style.display='';L.style.left=((tmp.x+1)/2*innerWidth).toFixed(1)+'px';L.style.top=((1-tmp.y)/2*innerHeight).toFixed(1)+'px';L.className=(p.sab&&c.sab&&c!==p?'sab':'')+(c.alive?'':' gh');}else L.style.display='none';
  // footsteps
  if(c===p&&c.alive&&sp>.3&&app==='play'&&(stepT-=dt)<=0){stepT=.3;snd.play('step');}});
 for(const[id,br]of bodyRigs){const b=sim.bodies.find(b=>b.id===id);br.visible=!meetPose&&!!b&&(app==='menu'||!p.alive||sim.sees(p,b.x,b.z,1.05));animateBody(br,dt);if(br.visible&&Math.random()<dt*3)parts.emit(br.position.x+rnd(.4)-.2,.35,br.position.z+rnd(.4)-.2,rnd(2)-1,2+rnd(2),rnd(2)-1,2.6,1.8,.8,.08,.35,9);}
 // doors / vents
 for(const d of ship.doors){const want=M.DOORS[d.room].closed>0?1:0;d.k+=(want-d.k)*Math.min(1,dt*(want?9:5));const vis=d.k>.01;
  for(const h of d.halves){h.m.visible=vis;const off=d.len/4+(1-d.k)*d.len/2;h.m.position.set(d.cx+(d.vert?0:h.sg*off),.78,d.cz+(d.vert?h.sg*off:0));}}
 for(const v of ship.vents){v.open=Math.max(0,v.open-dt*1.6);v.piv.rotation.x=-Math.sin(Math.min(1,v.open)*Math.PI)*1.1;}
 // lights: sabotage dims rooms, crises pulse red
 const crit=S.kind==='reactor'||S.kind==='oxygen',dark=S.kind==='lights'&&app!=='menu';FOG.U.uAlarm.value+=((crit?1:0)-FOG.U.uAlarm.value)*Math.min(1,dt*3);const al=FOG.U.uAlarm.value,pulse=.5+.5*Math.sin(time*5);
 for(const L of ship.roomLights){const want=L.userData.base*(dark?.07:1)*(1-al*.35*pulse);L.intensity+=(want-L.intensity)*Math.min(1,dt*(dark?2:4));L.color.copy(L.userData.col).lerp(ALARM,al*.75*pulse);}
 hemi.intensity+=((dark?.08:.5)-hemi.intensity)*Math.min(1,dt*2);key.intensity=dark?.12:.75;ship.trim.color.setRGB(dark?.3:2.2*(1-al*.4)+al*2.4*pulse,dark?.3:2.2*(1-al*.7),dark?.3:2.2*(1-al*.7));
 if(ship.buttonLight)ship.buttonLight.intensity=2.5+Math.sin(time*3)*1.5;if(ship.coreLight){ship.coreLight.color.setRGB(.37+al*.6,.78-al*.6,1-al*.85);ship.coreLight.intensity=10+al*8*pulse;}
 for(const f of ship.anim)f(time);
 // console screens: fix panels flash during a sabotage, task chevrons over my stations
 for(const fs of ship.fixScreens)if(fs.screen)fs.screen.material.color.setScalar(S.kind&&S.kind!=='doors'?.6+1.6*pulse:.5);
 const mine=new Set();if(app==='play'&&!p.sab)for(const t of p.tasks)if(!t.done)mine.add(t.st.id);if(app==='play'&&S.kind&&S.kind!=='doors'&&p.alive)for(const f of M.FIX[S.kind])if(!S.done[f.id])mine.add(f.id);
 for(const[id,mk]of ship.taskMarks){mk.visible=mine.has(id)&&!meetPose;if(mk.visible){mk.position.y=ship.consoles.get(id).pos.y+.8+Math.sin(time*3+mk.position.x)*.12;mk.rotation.y=time*1.5;}}
 // player's lamp + fog of war
 const fogOn=app==='play'&&p.alive&&sim.phase==='play'&&!overPose;
 fogR+=(sim.visR(p)-fogR)*Math.min(1,dt*2.5);
 if(fogOn){drawFog(p.x,p.z,fogR,p.fx,p.fz,p.vent?null:C.coneCos,C.coneNear,true);FOG.U.uFogDim.value=dark?.06:.13;}else drawFog(0,0,1,0,1,null,1,false);
 lamp.intensity+=((fogOn&&!p.vent?(dark?14:5):0)-lamp.intensity)*Math.min(1,dt*6);lamp.position.set(p.x-p.fx*1.2,4.2,p.z-p.fz*1.2);lamp.target.position.set(p.x+p.fx*5,0,p.z+p.fz*5);lamp.target.updateMatrixWorld();
 flash.intensity*=Math.exp(-dt*5);parts.update(dt);
 cameraUpdate(dt);hud(dt);if(m)meetingUI();const hh=app==='play'&&!!m;if(hc.hh!==hh){hc.hh=hh;$('hud').style.visibility=hh?'hidden':'';}
 // eject cinematic
 if(m&&m.stage==='eject'){ejectT+=dt;const k=Math.min(1,ejectT/2.2);for(const id of['etext','esub']){const el=$(id),f=el.dataset.full||'';const n=Math.floor(f.length*(id==='etext'?k:Math.max(0,(ejectT-2.4)/1)));if(el.textContent.length!==Math.min(n,f.length))el.textContent=f.slice(0,n);}
  if(ejectRig){ejectRig.position.set(-9+ejectT*3.6,Math.sin(ejectT*.6)*.6,-2-ejectT*.9);ejectRig.rotation.set(ejectT*1.3,ejectT*.7,ejectT*.9);animate(ejectRig,dt,{speed:0,busy:false});}
  space.stars.rotation.y=ejectT*.01;space.cam.position.set(Math.sin(ejectT*.1)*1.2,.8,9);space.cam.lookAt(1.5,0,-3);}}
function cameraUpdate(dt){const p=sim.player,m=sim.meeting;let pos,look,k=1-Math.exp(-dt*7);
 if(app==='menu'){menuT+=dt;const tx=35+Math.sin(menuT*.045)*20,tz=21+Math.sin(menuT*.06)*9;look=tmp.set(tx,0,tz);pos=tmp2.set(tx+Math.sin(menuT*.03)*6,30,tz+15);k=1-Math.exp(-dt*1.5);}
 else if(app==='over'){overT+=dt;const a=overT*.18;look=tmp.set(M.BUTTON.x,.9,M.BUTTON.z+2.6);pos=tmp2.set(M.BUTTON.x+Math.sin(a)*6.5,3.2,M.BUTTON.z+2.6+Math.cos(a)*6.5);k=1-Math.exp(-dt*3);}
 else if(m&&m.stage!=='eject'){const a=time*.12;look=tmp.set(M.BUTTON.x,.8,M.BUTTON.z);pos=tmp2.set(M.BUTTON.x+Math.cos(a)*7.5,6,M.BUTTON.z+Math.sin(a)*7.5);k=1-Math.exp(-dt*2);}
 else if(app==='intro'){const f=cl(1-introT/3.8,0,1);look=tmp.set(p.x,.9,p.z);pos=tmp2.set(p.x,3+f*14,p.z+4+f*4);k=1-Math.exp(-dt*4);}
 else{const lead=p.alive?1.2:0;look=tmp.set(p.x+p.fx*lead,0,p.z+p.fz*lead);pos=tmp2.copy(look).add(new V(0,17,8.6));}
 if(camSnap){camPos.copy(pos);camLook.copy(look);camSnap=false;}else{camPos.lerp(pos,k);camLook.lerp(look,k);}
 cam.position.copy(camPos);shake=Math.max(0,shake-dt*1.5);const s=shake*shake*.4;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.lookAt(camLook);}

/* ================= results ================= */
function showOver(){app='over';$('hud').hidden=true;document.body.classList.remove('playing');$('meet').hidden=$('eject').hidden=true;
 const p=sim.player,won=(sim.winner==='crew')!==p.sab;winners=sim.crew.filter(c=>(sim.winner==='sab')===c.sab);
 $('oeye').textContent=`${p.sab?'SABOTEUR':'CREWMATE'} · ${AI.DIFF[sim.o.diff].n} BOTS · ${fmt(sim.o.clock-sim.clock)} ELAPSED`;
 $('ores').textContent=won?'VICTORY':'DEFEAT';$('ores').style.color=won?'#5cff9d':'#ff3b30';$('owhy').textContent=(sim.winner==='crew'?'CREW WIN · ':'SABOTEURS WIN · ')+WIN[sim.reason];
 $('roster').innerHTML=sim.crew.map(c=>`<div class="${c.sab?'sab':''}${c===p?' me':''}" style="border-color:${c.css}">${c.name}${c===p?' (YOU)':''}<small>${c.sab?'SABOTEUR':'CREW'} · ${c.alive?'ALIVE':c.ejected?'EJECTED':'KILLED'}${c.sab?` · ${c.stats.kills} KILLS`:` · ${c.stats.tasks} TASKS`}</small></div>`).join('');
 const a=award(won);$('otok').textContent=`${a.pts} PTS · +${a.tok} TOKENS · BEST ${best()} PTS`+(p.sab?` · ${p.stats.kills} KILLS`:` · ${p.stats.tasks} TASKS · ${p.stats.right} CORRECT VOTES`);
 $('over').hidden=false;overT=0;menuStats();}
function award(won){const p=sim.player;const pts=p.sab?p.stats.kills*80+p.stats.sabotages*10+(p.alive?60:0)+(won?300:0):p.stats.tasks*25+p.stats.right*60+p.stats.reports*20+(p.alive?50:0)+(won?250:0);
 const tok=5+Math.min(60,pts/20|0);lastAward={pts,won,role:p.sab?'saboteur':'crew',kills:p.stats.kills,tasks:p.stats.tasks,right:p.stats.right,why:sim.reason,diff:AI.DIFF[sim.o.diff].n.toLowerCase(),sabs:sim.o.sabs};
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
  const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'suspects';if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}
 try{const s=JSON.parse(localStorage.getItem('pxd_suspects_stats'))||{};s.played=(s.played||0)+1;const r=p.sab?'sab':'crew';s[r]=(s[r]||0)+1;if(won)s[r+'Wins']=(s[r+'Wins']||0)+1;s.kills=(s.kills||0)+p.stats.kills;s.tasks=(s.tasks||0)+p.stats.tasks;s.right=(s.right||0)+p.stats.right;s.best=Math.max(s.best||0,pts);localStorage.setItem('pxd_suspects_stats',JSON.stringify(s));}catch(e){}
 return{pts,tok};}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'suspects')||0);}catch(e){return 0;}}
function menuStats(){let s={};try{s=JSON.parse(localStorage.getItem('pxd_suspects_stats'))||{};}catch(e){}$('mstats').innerHTML=s.played?`${s.played} GAMES · CREW ${s.crewWins||0}/${s.crew||0} WON · SABOTEUR ${s.sabWins||0}/${s.sab||0} WON<br>${s.tasks||0} TASKS · ${s.kills||0} KILLS · ${s.right||0} CORRECT VOTES · BEST ${s.best||0} PTS`:'';}

/* ================= main loop ================= */
function step(dt){dt=Math.min(dt,.1);if(!sim)return;
 if(app==='play'||app==='intro')readInput();
 if(app==='intro'){introT-=dt;if(introT<=0){app='play';$('intro').hidden=true;}}
 else if(app==='play'||app==='menu'){const n=ffwd&&!sim.player.alive&&sim.phase==='play'?5:1;for(let i=0;i<n;i++)sim.step(dt);
  const p=sim.player,S=sim.sab;if(app==='play'&&S.kind==='reactor'&&p.alive&&holdingUse()&&!tasks.active){const A=sim.actions();if(A.fix)sim.hold(p,A.fix.id);}
  if(app==='play'&&sim.phase==='over'&&!overShown){overT+=dt;if(overT>3.2){overShown=true;showOver();}}
  snd.alarm(app==='play'&&(S.kind==='reactor'||S.kind==='oxygen'));}
 events();if(app!=='paused')tasks.update(dt);visuals(app==='paused'?0:dt);}
const POST={exposure:1.12,bloom:.6,bloomThreshold:.88,bloomRadius:.5,vignette:.42,saturation:1.08,grain:.028};
let fxMain=null,fxSpace=null,gfx=quality(),fxW=0;
function applyQuality(q){gfx=q;fxMain=fxSpace=null;R.setPixelRatio(q===0?1:Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=q>0;key.castShadow=q>0;lamp.castShadow=q>0;key.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(key.shadow.map){key.shadow.map.dispose();key.shadow.map=null;}scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true;});}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight,pr=R.getPixelRatio();if(R.domElement.width!==Math.floor(w*pr)||R.domElement.height!==Math.floor(h*pr)){R.setSize(w,h,false);fxW=0;}
 const ej=sim&&sim.meeting&&sim.meeting.stage==='eject';
 if(ej){space.cam.aspect=w/h;space.cam.updateProjectionMatrix();if(!fxSpace)fxSpace=cinematic(R,space.scene,space.cam,{...POST,ao:false,bloom:.8,bloomThreshold:.7});if(fxSpace.w!==w*9999+h){fxSpace.w=w*9999+h;fxSpace.setSize(w,h);}fxSpace.render();return;}
 cam.aspect=w/h;cam.fov=w/h<1?52:36;cam.updateProjectionMatrix();parts.U.uScale.value=h*pr/(2*Math.tan(cam.fov*Math.PI/360));
 if(!fxMain)fxMain=cinematic(R,scene,cam,POST);if(fxW!==w*9999+h){fxW=w*9999+h;fxMain.setSize(w,h);}fxMain.render();}
addEventListener('resize',()=>{fxW=0;if(fxSpace)fxSpace.w=0;});

/* ================= menu wiring ================= */
const seg=(id,k)=>{const el=$(id);const set=v=>{opt[k]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));if(k==='color'&&sim&&app==='menu'){}};set(opt[k]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>set(+b.dataset.v));};
$('o-color').innerHTML=CREW.map((c,i)=>`<button data-v="${i}" title="${c.n}" style="background:${c.css}"></button>`).join('');
seg('o-role','role');seg('o-sabs','sabs');seg('o-diff','diff');seg('o-clock','clock');seg('o-conf','conf');seg('o-color','color');
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Starship Suspects\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'} as ${a.role||''} (${WIN[a.why]||''})\n${a.role==='saboteur'?`Kills: ${a.kills||0}`:`Tasks: ${a.tasks||0} · Correct votes: ${a.right||0}`}\nBots: ${a.diff||''} · Saboteurs: ${a.sabs||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] suspects '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

toMenu();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.SUSPECTS={get state(){return app==='play'&&sim?sim.phase:app;},get app(){return app;},get sim(){return sim;},get player(){return sim&&sim.player;},step,render,start,toMenu,pause,M,AI,tasks,
 setClock(s){sim.clock=s;},get clock(){return sim.clock;},get winner(){return sim&&sim.winner;},get reason(){return sim&&sim.reason;},
 finishTasks(n=1e9){for(const c of sim.crew){if(c.sab)continue;for(const t of c.tasks){if(n<=0)return;if(!t.done){sim.completeTask(c,t.st.id);n--;}}}},
 teleport(x,z,i=0){const c=sim.crew[i];c.x=x;c.z=z;c.vx=c.vz=0;camSnap=true;},kill(k,v){const a=sim.crew[k],b=sim.crew[v];a.killCd=0;a.x=b.x+.5;a.z=b.z;return sim.kill(a,b);},
 meeting(i=1){sim.callMeeting(sim.crew[i],null);},vote(t){return sim.castVote(sim.player,t);},say(text){return sim.say(sim.player,AI.parseText(sim,text));},
 skipStage(){const m=sim.meeting;if(m)m.t=1e3;},sabotage(k,room=-1){sim.sab.cd=0;return sim.sabotage(k,room);},act,toggleMap,setQuality:applyQuality,
 get overShown(){return overShown;},cam:()=>cam,scene,R,get rigs(){return rigs;},set ffwd(v){ffwd=v;}};
