// ORBIT LAB — an approachable rocket-science game where the maths is visible. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import * as P from './physics.js';
import {PARTS,CATS,UNLOCK,TEMPLATES,analyze,unlockedAt} from './parts.js';
import {Flight} from './flight.js';
import {Coach,WARPS,PLANS} from './coach.js';
import {MISSIONS,NOTEBOOK,DIAGRAMS,noteById} from './missions.js';
import * as MD from './models.js';
import {Sound} from './sound.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';

const $=id=>document.getElementById(id),V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a;
const {VERDA,LUNE,SUN}=P;const ID='orbitlab';
const nf=(x,d=0)=>(isFinite(x)?x:0).toLocaleString('en-US',{maximumFractionDigits:d,minimumFractionDigits:d});
const km=x=>isFinite(x)?nf(x/1000,1)+' km':'∞';
const tfmt=s=>{if(!isFinite(s))return'—';s=Math.max(0,s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=Math.floor(s%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${m}:${String(ss).padStart(2,'0')}`;};
const sci=x=>{if(!isFinite(x))return'∞';const e=Math.floor(Math.log10(Math.abs(x)||1));return e>=6||e<=-3?`${(x/10**e).toFixed(3)}×10${sup(e)}`:nf(x,x<10?2:0);};
const sup=n=>String(n).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)]??(c==='-'?'⁻':c)).join('');
const toV=a=>new V(a[0],a[1],a[2]);

/* ===================== renderer + scenes ===================== */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,logarithmicDepthBuffer:true,powerPreference:'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0);scene.environment=MD.makeEnv(R);
const cam=new THREE.PerspectiveCamera(60,1,.25,2e9);
const uni=new THREE.Group();scene.add(uni);
// VERDA
const pMat=MD.planetMaterial();const planet=new THREE.Mesh(new THREE.SphereGeometry(VERDA.R,384,192),pMat);uni.add(planet);
const cMat=MD.cloudMaterial();const clouds=new THREE.Mesh(new THREE.SphereGeometry(VERDA.R+4500,192,96),cMat);clouds.renderOrder=2;uni.add(clouds);
const aMat=MD.atmosphereMaterial();const atmo=new THREE.Mesh(new THREE.SphereGeometry(VERDA.R+VERDA.atm,128,64),aMat);atmo.renderOrder=3;uni.add(atmo);
// LUNE
const lune=new THREE.Group();uni.add(lune);const mMat=MD.moonMaterial();lune.add(new THREE.Mesh(new THREE.SphereGeometry(LUNE.R,256,128),mMat));
// high-resolution surface patches under the camera (vertices exactly on the sphere, positioned relative to the patch centre)
function makePatch(mat,parent,Rb){const N=96,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array((N+1)**2*3),3));const idx=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i;idx.push(a,a+N+1,a+1,a+1,a+N+1,a+N+2);}g.setIndex(idx);
 const m=mat.clone();m.uniforms=mat.uniforms;const off={value:new V()};m.uniforms=Object.assign({},mat.uniforms,{uOff:off});m.vertexShader=mat.vertexShader.replace('vP=position;','vP=position+uOff;').replace('varying vec3 vP;','varying vec3 vP;uniform vec3 uOff;');
 const mesh=new THREE.Mesh(g,m);mesh.visible=false;parent.add(mesh);return{mesh,N,R:Rb,c:null,off,half:.06};}
function fillPatch(pt,c,half){const{N,R:Rb}=pt;pt.c=c.slice();pt.half=half;let e1=P.norm(P.cross(c,Math.abs(c[1])<.9?[0,1,0]:[1,0,0])),e2=P.cross(c,e1);const pos=pt.mesh.geometry.attributes.position.array;const C=P.mul(c,Rb);
 for(let j=0;j<=N;j++)for(let i=0;i<=N;i++){const u=Math.tan((i/N*2-1)*half),v=Math.tan((j/N*2-1)*half);const d=P.norm(P.add(c,P.add(P.mul(e1,u),P.mul(e2,v))));const k=(j*(N+1)+i)*3;pos[k]=d[0]*Rb-C[0];pos[k+1]=d[1]*Rb-C[1];pos[k+2]=d[2]*Rb-C[2];}
 pt.mesh.position.set(C[0],C[1],C[2]);pt.off.value.set(C[0],C[1],C[2]);pt.mesh.geometry.attributes.position.needsUpdate=true;pt.mesh.geometry.computeBoundingSphere();}
const patchV=makePatch(pMat,uni,VERDA.R),patchL=makePatch(mMat,lune,LUNE.R);
// launch complex, station
const site=MD.makeLaunchSite();{const m=new THREE.Matrix4().makeBasis(new V(0,0,-1),new V(1,0,0),new V(0,-1,0));site.quaternion.setFromRotationMatrix(m);site.position.set(VERDA.R,0,0);}uni.add(site);
const station=MD.makeStation();uni.add(station);
// sky
const stars=MD.makeStars();scene.add(stars);const sun=MD.makeSun();scene.add(sun);
const sunL=new THREE.DirectionalLight(0xfff2e2,3.2);sunL.castShadow=true;sunL.shadow.mapSize.set(2048,2048);sunL.shadow.bias=-.0004;sunL.shadow.normalBias=.03;scene.add(sunL,sunL.target);
const hemi=new THREE.HemisphereLight(0x8fb4ff,0x1a2230,.35);scene.add(hemi);
const flashL=new THREE.PointLight(0xffa060,0,400,1.6);scene.add(flashL);
const parts=new MD.Particles(scene,6000);
// orbit ribbons
const RB={o:[0,1,2].map(i=>new MD.Ribbon(scene,260,[0x5fb4ff,0xb69cff,0x7fe3c0][i],.9)),n:[0,1,2].map(i=>new MD.Ribbon(scene,260,[0xff8a3d,0xffc06b,0xffe0a0][i],.85)),st:new MD.Ribbon(scene,200,0xffd166,.35),lu:new MD.Ribbon(scene,240,0x9aa0aa,.28)};
// VAB scene
const vscene=new THREE.Scene();vscene.background=new THREE.Color(0x07080c);vscene.environment=MD.makeEnv(R,true);vscene.fog=new THREE.Fog(0x07080c,60,140);
const vcam=new THREE.PerspectiveCamera(42,1,.1,400);const hangar=MD.makeHangar();vscene.add(hangar);
vscene.add(new THREE.HemisphereLight(0xc8d4ff,0x302820,.6));const vkey=new THREE.SpotLight(0xfff0e0,900,120,.6,.5,1.6);vkey.position.set(14,40,18);vkey.castShadow=true;vkey.shadow.mapSize.set(2048,2048);vkey.shadow.bias=-.0005;vscene.add(vkey,vkey.target);
const vrim=new THREE.SpotLight(0xff8a4d,400,100,.5,.6,1.6);vrim.position.set(-20,12,-16);vscene.add(vrim,vrim.target);const vfill=new THREE.PointLight(0x5fb4ff,60,60,1.5);vfill.position.set(-8,4,12);vscene.add(vfill);
let vRocket=null;const comMark=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.2,.2),depthTest:false}));comMark.renderOrder=20;
const copMark=new THREE.Mesh(new THREE.SphereGeometry(.28,16,12),new THREE.MeshBasicMaterial({color:new THREE.Color(.3,1.2,3),depthTest:false}));copMark.renderOrder=20;vscene.add(comMark,copMark);

/* ===================== state ===================== */
const snd=new Sound();
let opt={len:1800,easy:0,hints:1};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_orbitlab_opt'))||{});}catch(e){}
const CAREER0=()=>({funds:30000,done:[],notes:[],tier:0,flights:0,best:{}});
let career=CAREER0();try{const c=JSON.parse(localStorage.getItem('pxd_orbitlab_career'));if(c&&c.done)career=Object.assign(CAREER0(),c);}catch(e){}
let design=TEMPLATES.hopper.stack.slice();try{const d=JSON.parse(localStorage.getItem('pxd_orbitlab_design'));if(Array.isArray(d)&&d.every(id=>PARTS[id]))design=d;}catch(e){}
const save=()=>{try{localStorage.setItem('pxd_orbitlab_career',JSON.stringify(career));localStorage.setItem('pxd_orbitlab_design',JSON.stringify(design));localStorage.setItem('pxd_orbitlab_opt',JSON.stringify(opt));}catch(e){}};
let app='menu',paused=false,noteOpen=false,mode='career',sess=null,mission=MISSIONS[0],selMission=0,F=null,flightCost=0,skip=0,mapView=false,hohOpen=false,showMath=true,overlay=null,menuT=0,lastAward=null;
let vesMesh=null,plumes=[],plasma=null,debrisMeshes=new Map(),explosionT=0,flightDone=null,hintMsg='',lastHud=0,lastNav=0,camS={yaw:-.75,pitch:.08,dist:34,map:{yaw:2.3,pitch:.95,dist:2.6e6,focus:'ship'}};
const keys={},edge={};let mouse={x:0,y:0,down:false,moved:0,btn:0},drag=null;

/* ===================== session + career ===================== */
function newSession(m){mode=m;sess={len:opt.len,left:opt.len,pts:0,done:[],flights:0,crashes:0,maxAlt:0,maxV:0,coach:0,grant:0,t0:performance.now()};}
function tickSession(dt){if(!sess||!sess.len)return;if(app==='menu'||app==='results'||paused||noteOpen)return;sess.left-=dt;if(sess.left<=0){sess.left=0;endSession();}}
const unlocked=id=>mode==='free'||unlockedAt(id)<=career.tier;
function completeMission(m,silent){if(mode!=='career'||career.done.includes(m.id))return false;career.done.push(m.id);const i=MISSIONS.indexOf(m);career.tier=Math.max(career.tier,i+1);
 for(const n of m.notes)if(!career.notes.includes(n))career.notes.push(n);
 const k=(skip?.7:1),pk=(F&&F.coachUsed?.6:1)*(opt.easy?.75:1)*(skip?.7:1);const funds=Math.round(m.funds*k),pts=Math.round(m.pts*pk);career.funds+=funds;sess.pts+=pts;sess.done.push(m.id);save();
 snd.play('win');banner('MISSION COMPLETE',`${m.t} · +${nf(funds)} FUNDS · +${pts} PTS`,4);toast(`Unlocked: ${(UNLOCK[i+1]||[]).map(id=>PARTS[id].name).join(', ')||'—'} · Notebook +${m.notes.length}`,'good');
 if(!silent&&m===mission)setTimeout(()=>{if(app==='flight'&&F)showFlightOver('win',{m,funds,pts});},1800);return true;}
function endSession(){if(app==='results')return;if(F&&app==='flight')F=null;app='results';paused=false;showScreen('over');document.body.classList.remove('playing');
 const s=sess||{pts:0,done:[],flights:0};const tok=award(s);
 $('o-eye').textContent=s.len?`SESSION · ${s.len/60} MIN`:'SESSION · ENDLESS';$('o-res').textContent=s.done.length?`${s.done.length} MISSION${s.done.length>1?'S':''} FLOWN`:'FLIGHT REPORT';
 $('o-pts').textContent=`${nf(s.pts)} PTS`;
 $('o-stats').innerHTML=[['Missions completed',s.done.map(id=>MISSIONS.find(m=>m.id===id).t).join(', ')||'—'],['Flights launched',s.flights],['Vessels lost',s.crashes],['Highest altitude',km(s.maxAlt)],['Top speed',nf(s.maxV)+' m/s'],['Career progress',`${career.done.length} / ${MISSIONS.length}`],['Funds',nf(career.funds)],['Notebook formulas',`${career.notes.length} / ${NOTEBOOK.length}`]].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
 $('o-tok').textContent=`+${tok} TOKENS · BEST ${best()} PTS`;}
function award(s){const pts=s.pts;lastAward={pts,done:s.done.length,flights:s.flights,len:s.len,easy:opt.easy};const tok=5+Math.min(60,pts/20|0);
 addRound(tok,s.done.length);saveBest(ID,pts);return tok;}
function best(){return bestScore(ID);}

/* ===================== screens ===================== */
const SCREENS=['menu','keys','hub','vab','hud','fover','pause','over'];
function showScreen(...on){for(const s of SCREENS)$(s).hidden=!on.includes(s);}
function toMenu(){app='menu';F=null;paused=false;clearFlightVis();showScreen('menu','keys');document.body.classList.remove('playing');
 $('career-line').textContent=`CAREER: ${career.done.length}/${MISSIONS.length} missions · ${nf(career.funds)} funds · best session ${best()} pts`;}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o.opt||{});save();snd.init();
 if(o.reset)career=CAREER0();newSession(o.free?'free':'career');if(o.mission!=null)selMission=o.mission;else selMission=Math.min(MISSIONS.length-1,MISSIONS.findIndex(m=>!career.done.includes(m.id))<0?MISSIONS.length-1:MISSIONS.findIndex(m=>!career.done.includes(m.id)));
 mission=MISSIONS[selMission];document.body.classList.add('playing');if(mode==='free'){toVab();}else toHub();}
function toHub(){app='hub';F=null;clearFlightVis();paused=false;showScreen('hub');renderHub();}
function renderHub(){$('h-funds').textContent=nf(career.funds);$('h-score').textContent=nf(sess.pts);
 $('mlist').innerHTML=MISSIONS.map((m,i)=>{const done=career.done.includes(m.id),lock=i>career.tier;return`<div class="mc${i===selMission?' sel':''}${done?' done':''}${lock?' locked':''}" data-i="${i}"><span class="n">${m.n}</span><div><b>${m.t}</b><span>${m.sub}</span></div><span class="st">${done?'DONE':lock?'LOCKED':'OPEN'}</span></div>`;}).join('');
 $('mlist').querySelectorAll('.mc').forEach(el=>el.onclick=()=>{const i=+el.dataset.i;if(i>career.tier)return;selMission=i;snd.play('click');renderHub();});
 const m=MISSIONS[selMission];const i=selMission;
 $('brief').innerHTML=`<h2><small>MISSION ${m.n}${career.done.includes(m.id)?' · COMPLETED':''}</small>${m.t}</h2><p class="bsub">${m.sub}</p>
  <div class="bgrid"><div><p>${m.brief}</p><ul>${m.tips.map(t=>`<li>${t}</li>`).join('')}</ul>
   <div class="rew"><span>REWARD<b>${nf(m.funds)}</b></span><span>POINTS<b>${m.pts}</b></span><span>LEARN<b>${m.notes.length} FORMULA${m.notes.length>1?'S':''}</b></span></div>
   <p class="unl">Unlocks: ${(UNLOCK[i+1]||[]).map(id=>`<span>${PARTS[id].name}</span>`).join('')||'—'}</p>
   <div class="row"><button class="go" id="b-vab">TO THE ASSEMBLY HALL ▸</button><button class="ghost sm" id="b-note">FORMULAS</button></div></div>
   <div>${DIAGRAMS[m.d]||''}<p class="small">Coach-assisted flights earn 60% points. Skip-ascent starts pay 70%.</p></div></div>`;
 $('b-vab').onclick=()=>{mission=m;snd.play('click');toVab();};$('b-note').onclick=()=>openNote(m.notes[0]);}

/* ===================== VAB ===================== */
let vTab='command',vSel=-1,vStart=0,vYaw=.6,vDist=0,vAn=null;
function toVab(){app='vab';F=null;clearFlightVis();paused=false;showScreen('vab');if(mode==='free')mission=null;
 $('v-mission').textContent=mission?`MISSION ${mission.n} · ${mission.t} — ${mission.sub}`:'FREE FLIGHT · ALL PARTS';
 $('v-tabs').innerHTML=CATS.map(([k,n])=>`<button data-k="${k}" class="${k===vTab?'on':''}">${n}</button>`).join('');
 $('v-tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{vTab=b.dataset.k;snd.play('click');toVab();});
 const list=Object.entries(PARTS).filter(([id,p])=>p.cat===vTab);
 $('v-parts').innerHTML=list.map(([id,p])=>`<div class="pc${unlocked(id)?'':' lock'}" data-id="${id}"><canvas width="120" height="46"></canvas><b>${p.name}</b><span>${p.mass} t${p.fuel?` · fuel ${p.fuel} t`:''}${p.thrust?` · ${p.thrust} kN`:''} · ${nf(p.cost)}</span></div>`).join('');
 $('v-parts').querySelectorAll('.pc').forEach(el=>{const id=el.dataset.id;drawIcon(el.querySelector('canvas'),id);el.onmouseenter=()=>partInfo(id);el.onclick=()=>{if(!unlocked(id)){toast('Locked — complete earlier missions','bad');return;}addPart(id);};});
 $('v-tpl').innerHTML='<option value="">TEMPLATES…</option>'+Object.entries(TEMPLATES).map(([k,t])=>`<option value="${k}" ${t.stack.every(unlocked)?'':'disabled'}>${t.name}${t.stack.every(unlocked)?'':' (locked parts)'}</option>`).join('');
 $('v-tpl').onchange=e=>{const t=TEMPLATES[e.target.value];if(t){design=t.stack.slice();vSel=-1;snd.play('place');refreshVab();}e.target.value='';};
 partInfo(list[0]&&list[0][0]);refreshVab();}
function drawIcon(c,id){const x=c.getContext('2d'),p=PARTS[id],w=c.width,h=c.height;x.clearRect(0,0,w,h);const s=Math.min(28/(p.h||1),20);const d=(p.d??p.db??1.25)*s,dt=(p.d??p.dt??1.25)*s,hh=Math.max(6,(p.h||.4)*s);const cx=w/2,y0=h/2+hh/2;
 x.fillStyle=p.cat==='engine'?'#585c66':p.dec?'#f5c400':p.cat==='tank'?(p.size==='L'?'#d9733a':'#e9e9ec'):p.pod?'#dcdde2':p.chute?'#ff4d00':'#3a3d46';
 x.beginPath();x.moveTo(cx-d/2,y0);x.lineTo(cx+d/2,y0);x.lineTo(cx+dt/2,y0-hh);x.lineTo(cx-dt/2,y0-hh);x.fill();
 if(p.thrust){x.fillStyle='#22252b';x.beginPath();x.moveTo(cx-d*.18,y0-hh*.4);x.lineTo(cx+d*.18,y0-hh*.4);x.lineTo(cx+d*.38,y0);x.lineTo(cx-d*.38,y0);x.fill();x.fillStyle='#ff8a3d';x.fillRect(cx-d*.3,y0,d*.6,3);}
 if(p.fins){x.fillStyle='#ff4d00';x.beginPath();x.moveTo(cx-12,y0);x.lineTo(cx-24,y0+6);x.lineTo(cx-12,y0-hh-6);x.fill();x.beginPath();x.moveTo(cx+12,y0);x.lineTo(cx+24,y0+6);x.lineTo(cx+12,y0-hh-6);x.fill();}
 if(p.legs){x.strokeStyle='#aaa';x.lineWidth=2;x.beginPath();x.moveTo(cx-12,y0-hh/2);x.lineTo(cx-24,y0+8);x.moveTo(cx+12,y0-hh/2);x.lineTo(cx+24,y0+8);x.stroke();}
 if(p.solar){x.fillStyle='#1a3a8a';x.fillRect(cx-40,y0-hh/2-4,26,8);x.fillRect(cx+14,y0-hh/2-4,26,8);}}
function partInfo(id){if(!id)return;const p=PARTS[id];let s=`<b>${p.name}</b> — ${p.desc}<br>Mass ${p.mass} t${p.fuel?` + ${p.fuel} t fuel`:''} · Cost ${nf(p.cost)}${p.size&&p.size!=='any'?` · ${p.size==='L'?'2.5':p.size==='SL'?'1.25→2.5':'1.25'} m`:''}`;
 if(p.thrust)s+=`<br>Thrust ${p.thrust} kN (vac) · I<sub>sp</sub> ${p.isl} s sea level / ${p.ivac} s vacuum · ṁ = F/(I<sub>sp</sub>g₀) = ${(p.thrust*1000/(p.ivac*P.G0)).toFixed(1)} kg/s`;
 if(!unlocked(id))s+=`<br><span style="color:var(--warn)">Unlocks after mission ${MISSIONS[unlockedAt(id)-1]?.n||'—'}</span>`;$('v-pinfo').innerHTML=s;}
function addPart(id){const at=vSel>=0?vSel+1:design.length;if(PARTS[id].chute&&!design.length){design.push(id);}else if(PARTS[id].chute){design.unshift(id);}else design.splice(at,0,id);vSel=PARTS[id].chute?0:at;snd.play('place');refreshVab();}
function refreshVab(){save();const a=vAn=analyze(design,{vac:vStart===1});
 // stack list (top → bottom), colour-coded by stage
 const segOf=new Map();a.segs.forEach((s,i)=>s.forEach(p=>segOf.set(p,i)));const scol=['#ff4d00','#5fb4ff','#5fe38a','#ffc94d','#c9b6ff','#ff7aa2'];
 $('v-stack').innerHTML=a.ps.map((p,i)=>`<div class="si${i===vSel?' sel':''}${p.def.dec?' dec':''}" draggable="true" data-i="${i}"><span class="sw" style="background:${scol[segOf.get(p)%6]}"></span><span>${p.def.name}</span><span class="btns"><button data-a="up">▲</button><button data-a="dn">▼</button><button data-a="rm">✕</button></span></div>`).join('')||'<p class="small">Empty. Click parts on the left — they are added below the selected part.</p>';
 $('v-stack').querySelectorAll('.si').forEach(el=>{const i=+el.dataset.i;el.onclick=e=>{const b=e.target.dataset.a;if(b==='rm'){design.splice(i,1);vSel=Math.min(vSel,design.length-1);snd.play('remove');}else if(b==='up'&&i>0){[design[i-1],design[i]]=[design[i],design[i-1]];vSel=i-1;snd.play('click');}else if(b==='dn'&&i<design.length-1){[design[i+1],design[i]]=[design[i],design[i+1]];vSel=i+1;snd.play('click');}else vSel=vSel===i?-1:i;refreshVab();};
  el.ondragstart=e=>{e.dataTransfer.setData('text',i);el.classList.add('drag');};el.ondragend=()=>el.classList.remove('drag');el.ondragover=e=>{e.preventDefault();el.classList.add('over');};el.ondragleave=()=>el.classList.remove('over');
  el.ondrop=e=>{e.preventDefault();const from=+e.dataTransfer.getData('text');const [x]=design.splice(from,1);design.splice(i>from?i-1:i,0,x);vSel=i;refreshVab();};});
 $('v-clear').onclick=()=>{design=[];vSel=-1;refreshVab();};
 // stats with equations
 const g0='9.81';let h=`<div class="tot"><div><i>TOTAL Δv</i><b>${nf(a.dv)}</b> m/s</div><div><i>LAUNCH TWR</i><b style="color:${a.st[0]?.twr>=1.25?'var(--ok)':a.st[0]?.twr>=1?'var(--warn)':'var(--bad)'}">${(a.st[0]?.twr||0).toFixed(2)}</b></div><div><i>MASS</i><b>${nf(a.total/1000,2)}</b> t</div></div>`;
 h+=`<div class="eq"><small>MASS</small>m = Σ m<sub>parts</sub> = <span class="r">${nf(a.total)} kg</span> · height ${a.height.toFixed(1)} m</div>`;
 a.st.forEach((s,i)=>{const atm=s.atm;h+=`<div class="stg"><div class="hd"><span>STAGE ${i+1}${i===0?' · FIRES FIRST':''} ${atm?'· SEA LEVEL':'· VACUUM'}</span><b>${nf(s.dv)} m/s</b></div>`;
  if(s.eng.length&&s.fuel>0){h+=`<div class="eq"><small>Δv</small>I<sub>sp</sub>·g₀·ln(m₀/m<sub>f</sub>) = <span class="v">${s.isp.toFixed(0)}</span> × ${g0} × ln(<span class="v">${nf(s.m0/1000,2)}</span> / <span class="v">${nf(s.mf/1000,2)}</span>) = <span class="r">${nf(s.dv)} m/s</span></div>`;
   h+=`<div class="eq"><small>TWR</small>F/(m·g) = <span class="v">${nf(s.F/1000)} kN</span> / (<span class="v">${nf(s.m0/1000,2)} t</span> × ${i===0?'9.81':'9.81'}) = <span class="r" style="color:${s.twr>=1.25?'var(--ok)':s.twr>=1?'var(--warn)':i===0?'var(--bad)':'#fff'}">${s.twr.toFixed(2)}</span>${i>0?` <small>on LUNE ${s.twrLune.toFixed(2)}</small>`:''}</div>`;
   h+=`<div class="eq"><small>BURN</small>t = m<sub>p</sub>·I<sub>sp</sub>·g₀/F = ${nf(s.fuel)} × ${s.isp.toFixed(0)} × ${g0} / ${nf(s.F)} = <span class="r">${s.burn.toFixed(0)} s</span></div>`;}
  else h+=`<div class="eq" style="color:var(--mut)">${s.eng.length?'engine but no fuel':'no engine'} — ${s.parts.map(p=>p.def.name).join(', ')}</div>`;h+=`</div>`;});
 h+=`<div class="eq"><small>AERO</small>CoM <span class="v">${a.com.toFixed(1)} m</span> · CoP <span class="v">${a.cop.toFixed(1)} m</span> → <span class="r" style="color:${a.stable?'var(--ok)':'var(--warn)'}">${a.stable?'STABLE':'UNSTABLE'}</span></div>`;
 $('v-stats').innerHTML=h;
 const ok=a.warn.filter(w=>w[0]==='bad').length===0&&a.ps.length>0;
 $('v-warn').innerHTML=(a.warn.length?a.warn:[['ok','All checks passed — ready to fly.']]).map(([k,t])=>`<div class="w ${k}">${t}</div>`).join('');
 const noSkip=mode==='career'&&mission&&MISSIONS.indexOf(mission)<3;if(noSkip&&vStart===1){vStart=0;$('v-start').querySelectorAll('button').forEach(x=>x.classList.toggle('on',+x.dataset.v===0));}$('v-start').querySelector('[data-v="1"]').disabled=noSkip;$('v-start').querySelector('[data-v="1"]').title=noSkip?'Fly the ascent yourself for missions 1–3':'Start in an 80 km orbit — the ascent Δv is deducted from your stages';
 $('v-env').textContent=vStart===1?'ALL STAGES IN VACUUM':'STAGE 1 AT SEA LEVEL';
 const cost=a.cost;$('v-cost').textContent=nf(cost);$('v-funds').textContent=mode==='free'?'∞':nf(career.funds);
 const afford=mode==='free'||career.funds>=cost;$('v-launch').disabled=!ok||!afford;$('v-launch').textContent=!ok?'FIX DESIGN TO LAUNCH':!afford?'OVER BUDGET':`LAUNCH · ${nf(cost)}`;$('v-grant').hidden=afford||mode==='free';
 // 3-D preview
 if(vRocket){vscene.remove(vRocket);vRocket.traverse(o=>{if(o.geometry)o.geometry.dispose();});}vRocket=MD.buildStack(a.ps);vRocket.position.y=.6;vscene.add(vRocket);
 vRocket.userData.list.forEach(({m},i)=>{if(i===vSel)m.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.emissive=new THREE.Color(.6,.2,0);o.material.emissiveIntensity=.6;}});});
 comMark.position.set(1.2+a.dmax/2,a.com+.6,0);copMark.position.set(1.2+a.dmax/2,a.cop+.6,0);comMark.visible=copMark.visible=a.ps.length>1;
 vDist=Math.max(14,a.height*1.9+6);}
function vabLaunch(){const a=analyze(design);if(mode==='career'&&career.funds<a.cost)return;launch({skip:vStart===1});}

/* ===================== flight ===================== */
function clearFlightVis(){if(vesMesh){scene.remove(vesMesh);vesMesh=null;}for(const m of debrisMeshes.values())uni.remove(m);debrisMeshes.clear();plumes=[];parts.clear();RB.o.concat(RB.n,[RB.st,RB.lu]).forEach(r=>r.hide());$('labels').innerHTML='';$('handles').innerHTML='';flashL.intensity=0;}
function launch(o={}){snd.init();const a=analyze(design);skip=o.skip?1:0;flightCost=mode==='free'?0:a.cost;if(mode==='career'){career.funds-=flightCost;career.flights++;save();}sess.flights++;
 F=new Flight(design,{easy:!!opt.easy,target:mission?.target||null,orbit:skip?80000:null,t0:o.t0??(sess.flights*977%5000)});
 if(!F.ok){toast('This rocket can\'t reach orbit — not enough Δv to skip the ascent','bad');if(mode==='career'){career.funds+=flightCost;save();}F=null;return;}
 app='flight';paused=false;mapView=false;hohOpen=false;flightDone=null;explosionT=0;$('hoh').hidden=true;clearFlightVis();buildVessel();showScreen('hud');
 camS.yaw=.75;camS.pitch=skip?.25:.16;camS.dist=Math.max(18,F.ves.props().dmax*4+F.ves.ps[0].y1*1.3);camS.map.focus='ship';
 $('f-mn').textContent=mission?`MISSION ${mission.n} · ${mission.t}`:'FREE FLIGHT';$('f-obj').textContent=mission?mission.sub:'Go anywhere';
 buildSasButtons();if(o.coach)F.startCoach(planFor());hud(true);}
function planFor(){const v=F.ves;const base=(PLANS[mission?.plan||'orbit']||PLANS.orbit).slice();let plan=base;
 const orbiting=v.body==='verda'&&!v.landed&&v.orbit().rp-VERDA.R>70000;
 if(v.landedOn==='lune'){const i=plan.indexOf('liftlune');plan=i>=0?plan.slice(i):['liftlune'];}
 else if(v.body==='lune'){const i=plan.indexOf('capture');plan=i>=0?(v.orbit().e<1?plan.slice(plan.indexOf('landlune')):plan.slice(i)):['landlune'];}
 else if(orbiting){plan=plan.filter(p=>p!=='ascent');if(!plan.length)plan=['node'];}
 if(mission?.id==='home'&&v.stats.landedLuneOk&&v.body==='verda')plan=['landhome'];
 return plan;}
function buildVessel(){if(vesMesh)scene.remove(vesMesh);vesMesh=new THREE.Group();const st=MD.buildStack(F.ves.ps);vesMesh.add(st);vesMesh.userData.st=st;scene.add(vesMesh);
 plumes=[];for(const{p,m}of st.userData.list){if(!p.def.thrust)continue;for(const nz of m.userData.nozzles){const pl=MD.makePlume(m.userData.nr,new THREE.Color(m.userData.col).multiplyScalar(1.2));pl.position.copy(nz);m.add(pl);plumes.push({pl,p,m});}}
 if(!plasma){plasma=MD.makePlasma();scene.add(plasma);}st.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});}
function spawnDebris(d){const st=MD.buildStack(d.parts);const g=new THREE.Group();st.position.y=-d.yDrop/2;g.add(st);uni.add(g);debrisMeshes.set(d,g);}

/* ===================== input ===================== */
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;const c=e.code;if(!keys[c])edge[c]=true;keys[c]=true;
 if(['Space','Tab','ArrowUp','ArrowDown','Slash','Period','Comma'].includes(c)||(app==='flight'&&/^Digit/.test(c)))e.preventDefault();
 if(c==='Escape'){if(noteOpen){closeNote();return;}if(hohOpen){toggleHoh(false);return;}if(app==='flight'&&!flightDone)pause(!paused);}
 if(c==='KeyN'&&app!=='menu'){noteOpen?closeNote():openNote();}});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('mousedown',e=>{mouse.down=true;mouse.btn=e.button;mouse.x=e.clientX;mouse.y=e.clientY;mouse.moved=0;});
addEventListener('mousemove',e=>{const dx=e.clientX-mouse.x,dy=e.clientY-mouse.y;mouse.x=e.clientX;mouse.y=e.clientY;
 if(drag){dragHandle(dx,dy,e.shiftKey);return;}if(!mouse.down)return;mouse.moved+=Math.abs(dx)+Math.abs(dy);
 if(app==='vab'){vYaw-=dx*.008;return;}const s=mapView?camS.map:camS;s.yaw-=dx*.006;s.pitch=cl(s.pitch+dy*.005,mapView?-1.5:-1.3,mapView?1.55:1.45);});
addEventListener('mouseup',e=>{if(drag){drag=null;}else if(mouse.down&&mouse.moved<5&&app==='flight'&&mapView)mapClick(e.clientX,e.clientY);mouse.down=false;});
canvas.addEventListener('wheel',e=>{e.preventDefault();const k=Math.exp(e.deltaY*.0012);if(app==='vab'){vDist=cl(vDist*k,6,90);return;}if(mapView)camS.map.dist=cl(camS.map.dist*k,2e4,6e7);else camS.dist=cl(camS.dist*k,6,4000);},{passive:false});
function gp(){const l=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];return l[0]||null;}
let gpPrev={};
function readInput(dt){const g=gp();const ax=(i)=>g&&Math.abs(g.axes[i])>.15?g.axes[i]:0;const btn=(i)=>g&&g.buttons[i]&&g.buttons[i].pressed;const gpe=i=>{const b=btn(i),p=gpPrev[i];gpPrev[i]=b;return b&&!p;};
 const inp={pitch:(keys.KeyW?-1:0)+(keys.KeyS?1:0)+ax(1),yaw:(keys.KeyD?-1:0)+(keys.KeyA?1:0)-ax(0),roll:(keys.KeyQ?1:0)+(keys.KeyE?-1:0)+(btn(4)?1:0)-(btn(5)?1:0)};
 let thr=F.throttle;const tu=(keys.ShiftLeft||keys.ShiftRight?1:0)+(g?g.buttons[7]?.value||0:0),td=(keys.ControlLeft||keys.ControlRight?1:0)+(g?g.buttons[6]?.value||0:0);
 let tch=false;if(tu||td){thr=cl(thr+(tu-td)*dt*.8,0,1);tch=true;}if(edge.KeyZ){thr=1;tch=true;}if(edge.KeyX){thr=0;tch=true;}
 if(tch)inp.throttle=thr;inp.manual=!!(inp.pitch||inp.yaw||inp.roll||tch);
 inp.stage=edge.Space||gpe(0);inp.chute=edge.KeyP;inp.legs=edge.KeyL;inp.solar=edge.KeyU;
 if(gpe(2))setSas('pro');if(gpe(3))toggleMap();
 return inp;}

/* ===================== flight loop ===================== */
let lastStageT=-9;
function flightStep(dt){const v=F.ves;
 if(!flightDone&&!paused){
  if(edge.KeyM)toggleMap();if(edge.KeyH)toggleHoh();if(edge.KeyI){showMath=!showMath;$('fpanel').hidden=!showMath;}
  if(edge.KeyC){if(F.coach){F.stopCoach();toast('Autopilot off — you have control');}else{F.startCoach(planFor());sess.coach++;toast('AUTOPILOT COACH engaged — watch and learn (C to take over)','good');}}
  if(edge.KeyB&&F.node){F.coach=new Coach(['node']);F.events.push({type:'coach',on:true});toast('Executing maneuver node');}
  if(edge.Delete||edge.Backspace){F.setNode(null);}
  if(edge.KeyT)setSas(F.sas==='off'?'hold':'off');
  const SK=['hold','pro','retro','normal','anti','radout','radin','node','target','antitarget'];for(let i=0;i<10;i++)if(edge['Digit'+((i+1)%10)])setSas(SK[i]);
  if(edge.Period)setWarp(F.warpI+1);if(edge.Comma)setWarp(F.warpI-1);if(edge.Slash)setWarp(0);
  if(edge.Tab&&mapView){const fs=['ship','verda','lune'];camS.map.focus=fs[(fs.indexOf(camS.map.focus)+1)%3];camS.map.dist=camS.map.focus==='lune'?6e5:camS.map.focus==='verda'?2.6e6:1.2e6;}
  const inp=readInput(dt);if(inp.stage&&performance.now()-lastStageT<250)inp.stage=false;if(inp.stage)lastStageT=performance.now();
  if(inp.stage&&!v.ignited)F.throttle=Math.max(F.throttle,opt.easy?1:F.throttle);
  F.update(dt,inp);
  if(sess){sess.maxAlt=Math.max(sess.maxAlt,v.body==='verda'?v.alt:0);sess.maxV=Math.max(sess.maxV,P.len(v.v));}
  handleEvents();
  // missions: active one first, then any open earlier/later ones whose conditions are met (career only)
  if(mode==='career'&&!v.destroyed){for(const m of MISSIONS){const i=MISSIONS.indexOf(m);if(i>career.tier||career.done.includes(m.id)||(skip&&i<3))continue;if(m.target&&m!==mission&&m.target!==F.target)continue;try{if(m.check(F))completeMission(m,m!==mission);}catch(e){}}}
  if(v.destroyed&&!flightDone&&explosionT>2.2)showFlightOver('lost');
  if(v.landed&&v.landedOn==='verda'&&v.stats.flightT>5&&!flightDone&&v.ignited&&P.len(v.v)<.1&&v.thrustN===0){F._rest=(F._rest||0)+dt;if(F._rest>3.5&&(v.alt<200||v.chute)&&v.stats.maxAlt>200)showFlightOver('recover');}else if(F)F._rest=0;}
 else if(!paused){F.update(0,{});}
 explosionT+=dt;
 updateFlightVis(dt);}
function setSas(m){if(!F)return;const v=F.ves;if(m==='node'&&!F.node){toast('No maneuver node','bad');return;}if((m==='target'||m==='antitarget')&&!F.targetInfo()){toast('No target','bad');return;}F.sas=m;v.holdDir=v.nose;snd.play('click');buildSasButtons();}
function setWarp(i){const before=F.warpI;F.setWarp(Math.max(0,Math.min(WARPS.length-1,i)));if(F.warpI!==before)snd.play('beep');}
function toggleMap(){mapView=!mapView;snd.play('click');if(mapView){camS.map.focus=F.ves.body==='lune'?'lune':'verda';camS.map.dist=F.ves.body==='lune'?5e5:Math.max(1.3e6,(P.len(F.ves.uniPos(F.t)))*3.6);}}
function handleEvents(){for(const e of F.events){const v=F.ves;switch(e.type){
  case'ignite':snd.play('ignite');toast('IGNITION');if(v.body==='verda'&&v.alt<50){const up=P.norm(v.uniPos(F.t));for(let i=0;i<70;i++){const a=rnd(Math.PI*2),s=8+rnd(24);const e1=P.norm(P.cross(up,[0,1,0])),e2=P.cross(up,e1);const d=P.add(P.mul(e1,Math.cos(a)*s),P.mul(e2,Math.sin(a)*s));const p=P.add(v.uniPos(F.t),P.mul(up,-v.props().foot));parts.sm.emit(p[0],p[1],p[2],d[0],d[1]+rnd(2),d[2],.75+rnd(.2),9+rnd(8),6+rnd(5),.6);}}break;
  case'sep':{snd.play('sep');toast('STAGE SEPARATION');buildVessel();const d=F.debris[F.debris.length-1];if(d)spawnDebris(d);const p=v.uniPos(F.t),n=v.nose,y=P.add(p,P.mul(n,-v.props().com));const vv=v.uniVel(F.t);
   parts.burst(y,50,14,[new THREE.Color(3,2.4,1.4),new THREE.Color(2,2,2)],.5,.8,{v:vv,drag:2});for(let i=0;i<14;i++)parts.sm.emit(y[0],y[1],y[2],vv[0]+rnd(10)-5,vv[1]+rnd(10)-5,vv[2]+rnd(10)-5,.85,2.4,2.5,.5);break;}
  case'chute':snd.play('chute');toast('PARACHUTE DEPLOYED');break;case'torn':snd.play('fail');toast('Parachute torn — too fast! Open it below ~250 m/s','bad');break;
  case'legs':snd.play('legs');break;case'solar':snd.play('legs');toast(v.solarOpen?'Solar panels extended':'Solar panels retracted');break;
  case'flameout':toast('FLAMEOUT — stage empty. SPACE to separate');break;
  case'soi':toast(e.to==='lune'?`Entered LUNE's sphere of influence (r = ${km(LUNE.soi)})`:'Left LUNE — now orbiting VERDA','good');snd.play('beep');break;
  case'crash':snd.play('boom');boom();sess.crashes++;break;
  case'touch':snd.play(e.splash?'splash':'touch');toast(`${e.splash?'SPLASHDOWN':'TOUCHDOWN'} at ${e.v.toFixed(1)} m/s${v.body==='lune'?' on LUNE':''}`,'good');break;
  case'warpblock':toast(e.why==='thrust'?'Can\'t time-warp while thrusting':'Too low for faster warp',e.why==='thrust'?'bad':'');break;
  case'coachdone':toast('Coach programme complete');break;
  case'debriscrash':{const g=debrisMeshes.get(e.d);if(g){const p=e.d.body==='verda'?e.d.r:P.add(e.d.r,P.lunePos(F.t));parts.burst(p,30,20,[new THREE.Color(3,1.5,.4)],2,1.2,{drag:1});}break;}}}F.events.length=0;}
function boom(){const v=F.ves,p=v.uniPos(F.t);vesMesh&&(vesMesh.visible=false);flashL.intensity=4e5;explosionT=0;
 parts.burst(p,260,60,[new THREE.Color(3,1.6,.4),new THREE.Color(3,2.6,1.4),new THREE.Color(2,.6,.1)],3,1.8,{drag:1.4});
 for(let i=0;i<60;i++){const d=[rnd(2)-1,rnd(2)-1,rnd(2)-1];parts.sm.emit(p[0],p[1],p[2],d[0]*25,d[1]*25,d[2]*25,.25+rnd(.2),6+rnd(6),5+rnd(4),.8);}}
function showFlightOver(kind,info={}){if(flightDone)return;flightDone=kind;const v=F.ves;let h='';const st=v.stats;
 const rows=[['Mission time',tfmt(F.t-F.t0)],['Max altitude',km(st.maxAlt)],['Max speed',nf(st.maxV)+' m/s'],['Max dynamic pressure',nf(st.maxQ/1000,1)+' kPa'],['Max g-load',st.maxG.toFixed(1)+' g'],['Δv spent',nf(v.dvUsed)+' m/s']];
 if(kind==='win'){h=`<p class="eye">MISSION ${info.m.n} COMPLETE</p><p class="res" style="color:var(--ok)">${info.m.t}<br>SUCCESS<em style="color:var(--o)">.</em></p><p>+${nf(info.funds)} funds · +${info.pts} points${F.coachUsed?' (coach-assisted)':''}. New formulas are in your MATH NOTEBOOK.</p>`;}
 else if(kind==='lost'){h=`<p class="eye">FLIGHT LOST · ${v.destroyed?.why||''}</p><p class="res" style="color:var(--bad)">RAPID<br>UNPLANNED<br>DISASSEMBLY</p><p>Impact at ${nf(v.destroyed?.v||0,1)} m/s — the limit was ${nf(v.destroyed?.tol||0,1)} m/s. ${v.hasLegs()?'Deploy legs (L) and':'Add landing legs or a parachute, and'} brake earlier: stopping distance d = v²/(2a).</p>`;}
 else{const ref=Math.round(analyze(F.ves.ids).cost*0)+Math.round(F.ves.ps.reduce((a,p)=>a+p.def.cost,0)*.6);if(mode==='career'){career.funds+=ref;save();}h=`<p class="eye">VESSEL RECOVERED</p><p class="res">${v.splashed?'SPLASH<br>DOWN':'TOUCH<br>DOWN'}<em style="color:var(--o)">.</em></p><p>Recovered parts refunded: +${nf(ref)} funds.</p>`;}
 h+=`<table>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</table><div class="row">${kind==='win'?'<button class="go" id="fo-cont">CONTINUE FLYING</button>':''}<button class="${kind==='win'?'ghost':'go'}" id="fo-hub">${mode==='free'?'BACK TO ASSEMBLY':'MISSION CONTROL'}</button>${kind!=='win'?'<button class="ghost" id="fo-rev">REVERT TO LAUNCH</button>':''}<button class="ghost" id="fo-vab">ASSEMBLY HALL</button></div>`;
 $('fover').innerHTML=h;$('fover').hidden=false;$('banner').classList.remove('on');bnT=0;if(kind==='lost')snd.play('fail');
 const c=$('fo-cont');if(c)c.onclick=()=>{flightDone=null;$('fover').hidden=true;};$('fo-hub').onclick=()=>{$('fover').hidden=true;mode==='free'?toVab():toHub();};
 const r=$('fo-rev');if(r)r.onclick=()=>{$('fover').hidden=true;revert();};$('fo-vab').onclick=()=>{$('fover').hidden=true;toVab();};}
function revert(){if(mode==='career'){career.funds+=flightCost;save();}sess.flights--;launch({skip});}
function pause(on){paused=on;$('pause').hidden=!on;}

/* ===================== flight visuals ===================== */
const tmpQ=new THREE.Quaternion(),tmpV=new V(),tmpV2=new V();let origin=[0,0,0],tAcc=0;
function updateFlightVis(dt){const v=F.ves,t=F.t;origin=v.uniPos(t);const up=P.norm(v.r);tAcc+=dt;
 placeWorld(origin,t);
 if(vesMesh){vesMesh.position.set(0,0,0);vesMesh.quaternion.set(...v.q4);vesMesh.userData.st.position.y=-v.props().com;vesMesh.visible=!v.destroyed;
  MD.animateParts(vesMesh.userData.st,{legs:v.legs,solar:v.solarOpen,chute:v.chute,chuteOpen:v.chuteOpen,thr:v.throttle,hot:v.thrustN>0,time:t},dt);}
 // plumes + exhaust particles
 const B=v.B,pr=P.pressureRatio(B,v.alt);const T=v.thrustInfo(pr);const thr=T.live&&!v.destroyed?v.throttle:0;const warpK=F.warp>10?0:1;
 for(const pl of plumes){const live=v.bottomSeg().includes(pl.p);const L=(pl.m.userData.nr*2)*(6+9*(1-pr))*(.5+.7*thr);pl.pl.userData.set(live?thr*warpK:0,pr,tAcc,L);}
 if(thr>0&&warpK&&!v.destroyed){const vv=v.uniVel(t),n=v.nose,base=P.add(origin,P.mul(n,-v.props().com));const ex=P.mul(n,-1);const q=quality();
  const k=thr*(q===0?1:q===1?2:3);
  if(pr>.02){for(let i=0;i<k;i++){const s=40+rnd(30);const jit=[rnd(2)-1,rnd(2)-1,rnd(2)-1];const pp=P.add(base,P.mul(ex,2+rnd(6)));parts.sm.emit(pp[0],pp[1],pp[2],vv[0]*.6+ex[0]*s+jit[0]*4,vv[1]*.6+ex[1]*s+jit[1]*4,vv[2]*.6+ex[2]*s+jit[2]*4,.86+rnd(.12),2.6+rnd(2.5)+(1-pr)*2,4+rnd(5)*pr,.5*pr+.15);parts.sm.emit(pp[0],pp[1],pp[2],vv[0]*.6+ex[0]*s,vv[1]*.6+ex[1]*s,vv[2]*.6+ex[2]*s,.9,2+rnd(2),3+rnd(3)*pr,.4*pr+.1);}
   if(v.alt<v.props().foot+60){const e1=P.norm(P.cross(up,[0,1,0])),e2=P.cross(up,e1);for(let i=0;i<k*2;i++){const a=rnd(Math.PI*2),s=15+rnd(30);const d=P.add(P.mul(e1,Math.cos(a)*s),P.mul(e2,Math.sin(a)*s));const gp2=P.add(origin,P.mul(up,-v.alt+.5));parts.sm.emit(gp2[0],gp2[1],gp2[2],d[0],d[1]+rnd(3),d[2],.78+rnd(.15),4+rnd(6),5+rnd(4),.55);}}}
  for(let i=0;i<k;i++){const s=60+rnd(40);const pp=P.add(base,P.mul(ex,.5+rnd(2)));parts.emit(pp[0],pp[1],pp[2],vv[0]+ex[0]*s+rnd(6)-3,vv[1]+ex[1]*s+rnd(6)-3,vv[2]+ex[2]*s+rnd(6)-3,2.4,1.3,.5,.5+rnd(.5),.18+rnd(.15),2);}}
 // reentry plasma + sparks
 const heat=v.destroyed?0:Math.max(0,v.heat-.22)*1.3;plasma.visible=heat>.02&&warpK;if(plasma.visible){const vv=P.norm(v.v);const s=v.props();plasma.position.set(vv[0]*s.foot*.3,vv[1]*s.foot*.3,vv[2]*s.foot*.3);plasma.quaternion.setFromUnitVectors(new V(0,1,0),toV(vv));
  plasma.scale.set(s.dmax*.9,Math.max(2,s.foot*1.4),s.dmax*.9);plasma.material.uniforms.uI.value=Math.min(1.4,heat);plasma.material.uniforms.uT.value=tAcc;
  const uv=v.uniVel(t);for(let i=0;i<heat*6;i++){const pp=P.add(origin,P.add(P.mul(vv,s.dmax*.6),[rnd(2)-1,rnd(2)-1,rnd(2)-1]));parts.emit(pp[0],pp[1],pp[2],uv[0]*.97-vv[0]*80+rnd(20)-10,uv[1]*.97-vv[1]*80+rnd(20)-10,uv[2]*.97-vv[2]*80+rnd(20)-10,3,1.4,.6,.3+rnd(.5),.4,1);}}
 // debris
 for(const[d,g]of debrisMeshes){if(!F.debris.includes(d)){uni.remove(g);debrisMeshes.delete(d);continue;}const p=d.body==='verda'?d.r:P.add(d.r,P.lunePos(t));g.position.set(p[0],p[1],p[2]);g.quaternion.set(...d.q4);}
 flashL.position.set(0,0,0);flashL.intensity*=Math.exp(-dt*3);
 parts.update(dt*Math.min(F.warp,4),origin);
 // sound
 snd.set(thr,pr,v.q,heat,F.warp);
 // camera
 if(mapView)mapCamera();else chaseCamera(up);
 orbitLines();if(app==='flight')hud();}
function placeWorld(o,t){uni.position.set(-o[0],-o[1],-o[2]);const L=P.lunePos(t);lune.position.set(L[0],L[1],L[2]);const S=P.stationState(t);station.position.set(S.r[0],S.r[1],S.r[2]);
 station.quaternion.setFromUnitVectors(new V(1,0,0),toV(P.norm(S.v)));if(station.userData.blink){station.userData.blink.visible=(t%1.6)<.15;station.userData.blink2.visible=((t+.8)%1.6)<.15;}
 cMat.uniforms.uTime.value=t;}
function chaseCamera(up){const v=F.ves;let u=toV(up);const n=new V(0,1,0).addScaledVector(u,-u.y);if(n.lengthSq()<1e-6)n.set(0,0,1);n.normalize();const e=new V().crossVectors(n,u);
 const s=camS,cp=Math.cos(s.pitch);const off=new V().addScaledVector(n,-cp*Math.cos(s.yaw)).addScaledVector(e,cp*Math.sin(s.yaw)).addScaledVector(u,Math.sin(s.pitch));
 let d=s.dist;const tgt=new V(0,0,0);
 cam.position.copy(off.multiplyScalar(d));const alt=v.alt;if(v.body==='verda'||v.body==='lune'){const camAlt=alt+cam.position.dot(u);if(camAlt<2){cam.position.addScaledVector(u,2-camAlt);}}
 cam.up.copy(u);cam.lookAt(tgt);cam.near=.25;cam.updateProjectionMatrix();}
function mapCamera(){const t=F.t,f=camS.map;const fp=f.focus==='ship'?origin:f.focus==='lune'?P.lunePos(t):[0,0,0];const c=new V(fp[0]-origin[0],fp[1]-origin[1],fp[2]-origin[2]);
 const cp=Math.cos(f.pitch);cam.position.set(c.x+f.dist*cp*Math.sin(f.yaw),c.y+f.dist*Math.sin(f.pitch),c.z+f.dist*cp*Math.cos(f.yaw));cam.up.set(0,1,0);cam.lookAt(c);cam.near=50;cam.updateProjectionMatrix();}
// sample a conic segment into universe-coordinate points (+ apsis markers)
function segPts(seg,tNow,N=220){const el=seg.el,B=P.BODY[seg.body];const off=seg.body==='lune'?P.lunePos(tNow):[0,0,0];const nu0=el.nu;let nu1;
 if(seg.tEnd!=null){const s=P.kepler(seg.r0,seg.v0,seg.tEnd-seg.t0,B.mu);nu1=Math.atan2(P.dot(s.r,el.Q),P.dot(s.r,el.P));if(el.e<1){while(nu1<=nu0+1e-6)nu1+=Math.PI*2;}}
 else if(el.e<1)nu1=nu0+Math.PI*2;else nu1=Math.acos(-1/el.e)*.97;
 const lim=seg.body==='lune'?LUNE.soi:LUNE.a*3;const pts=[];for(let i=0;i<=N;i++){const nu=nu0+(nu1-nu0)*i/N;const rr=el.p/(1+el.e*Math.cos(nu));if(rr<0||rr>lim)continue;const p=P.posAt(el,nu);pts.push([p[0]+off[0],p[1]+off[1],p[2]+off[2]]);}
 const inRange=nu=>{let x=nu;while(x<nu0)x+=Math.PI*2;return x<=nu1;};const mk=[];
 if(el.e<1&&el.ra<lim&&inRange(Math.PI)){const p=P.posAt(el,Math.PI);mk.push({k:'ap',p:P.add(p,off),txt:`Ap ${km(el.ra-B.R)}`});}
 if(inRange(0)&&el.rp>B.R*.2){const p=P.posAt(el,0);mk.push({k:'pe',p:P.add(p,off),txt:`Pe ${el.rp<B.R?'below surface':km(el.rp-B.R)}`});}
 return{pts,mk,nu0,nu1};}
let lineCache={t:-1};
function orbitLines(){const v=F.ves,t=F.t,show=mapView||camS.dist>600;const labels=[];
 if(!show||v.landed&&!mapView){RB.o.concat(RB.n,[RB.st,RB.lu]).forEach(r=>r.hide());if(!mapView){$('labels').innerHTML='';$('handles').innerHTML='';}else drawLabels(labels);return;}
 const px=mapView?2.2:1.4;
 // current trajectory (patched conics)
 const pr=F.pred||[];lineCache.segs=[];pr.forEach((s,i)=>{if(i>2)return;const sp=segPts(s,t);lineCache.segs.push({s,sp});RB.o[i].set(sp.pts,cam,origin,px,i>0);for(const m of sp.mk)labels.push(m);
  if(s.end==='enc'&&s.next){const L=P.lunePos(t);}if(s.end==='impact'&&s.tEnd){const e=P.kepler(s.r0,s.v0,s.tEnd-s.t0,P.BODY[s.body].mu);labels.push({k:'ca',p:s.body==='lune'?P.add(e.r,P.lunePos(t)):e.r,txt:'IMPACT'});}});
 for(let i=pr.length;i<3;i++)RB.o[i].hide();
 const s0=pr[0];if(s0&&s0.end==='enc'&&pr[1])labels.push({k:'en',p:P.add(pr[1].r0,P.lunePos(t)),txt:`LUNE encounter · Pe ${km(pr[1].el.rp-LUNE.R)}`});
 else if(s0&&s0.closest&&isFinite(s0.closest.d)&&s0.closest.d<LUNE.soi*6&&v.body==='verda'){const e=P.kepler(s0.r0,s0.v0,s0.closest.t-s0.t0,VERDA.mu);labels.push({k:'ca',p:e.r,txt:`closest to LUNE ${km(s0.closest.d)}`});}
 // maneuver node prediction
 if(F.node&&F.node.pred){F.node.pred.forEach((s,i)=>{if(i>2)return;const sp=segPts(s,t);RB.n[i].set(sp.pts,cam,origin,px,true);for(const m of sp.mk)labels.push({...m,txt:'→ '+m.txt});});for(let i=F.node.pred.length;i<3;i++)RB.n[i].hide();
  const pre=F.node.pred[0];labels.push({k:'nd',p:pre.body==='lune'?P.add(pre.r0,P.lunePos(t)):pre.r0,txt:`NODE Δv ${nf(F.node.dv,1)} m/s · T−${tfmt(F.node.t-t)}`,node:true});}
 else RB.n.forEach(r=>r.hide());
 // station + LUNE orbits (faint) in map view
 if(mapView){const sp=[];for(let i=0;i<=120;i++){const a=i/120*Math.PI*2;sp.push([P.STATION.r*Math.cos(a),0,-P.STATION.r*Math.sin(a)]);}if(F.target==='station')RB.st.set(sp,cam,origin,1.2);else RB.st.hide();
  const lp=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;lp.push([LUNE.a*Math.cos(a),0,-LUNE.a*Math.sin(a)]);}RB.lu.set(lp,cam,origin,1.2);
  labels.push({k:'body',p:[0,0,0],txt:'VERDA',off:VERDA.R},{k:'body',p:P.lunePos(t),txt:'LUNE',off:LUNE.R},{k:'ship',p:origin,txt:'▲'});
  if(F.target==='station'){const S=P.stationState(t);labels.push({k:'ca',p:S.r,txt:'STATION'});if(v.body==='verda'&&!v.landed){if(!F._ca||F.real-F._caT>1){F._ca=P.closestApproach(v.r,v.v,t,Math.min(v.orbit().T||6000,9000),P.stationState);F._caT=F.real;}
    const e=P.kepler(v.r,v.v,F._ca.t-t,VERDA.mu);labels.push({k:'ca',p:e.r,txt:`closest ${km(F._ca.d)} in ${tfmt(F._ca.t-t)}`});}}}
 else{RB.st.hide();RB.lu.hide();}
 drawLabels(labels);}
const proj=(p)=>{tmpV.set(p[0]-origin[0],p[1]-origin[1],p[2]-origin[2]).project(cam);return tmpV.z<1&&tmpV.z>-1?{x:(tmpV.x+1)/2*innerWidth,y:(1-tmpV.y)/2*innerHeight}:null;};
function drawLabels(list){let h='';let nodeScr=null;for(const l of list){const s=proj(l.p);if(!s)continue;if(l.node)nodeScr=s;h+=`<div class="lb ${l.k}" style="left:${s.x|0}px;top:${s.y|0}px">${l.txt}</div>`;}$('labels').innerHTML=h;drawHandles(nodeScr);}
// maneuver handles: positioned along the real prograde / normal / radial directions on screen
const HD=[['pro','+','pro',1],['ret','−','pro',-1],['nrm','N','nrm',1],['ant','A','nrm',-1],['rad','R','rad',1],['rin','r','rad',-1]];
function drawHandles(ns){const host=$('handles');if(!F.node||!ns||!mapView){host.innerHTML='';return;}const pre=F.node.pred[0];const nb=pre.body==='lune'?P.add(pre.r0,P.lunePos(F.t)):pre.r0;
 const st=P.kepler(F.ves.r,F.ves.v,F.node.t-F.t,F.ves.B.mu);const fr=P.orbitFrame(st.r,st.v);const dist=Math.hypot(nb[0]-origin[0]-cam.position.x,nb[1]-origin[1]-cam.position.y,nb[2]-origin[2]-cam.position.z);const L=dist*.07;
 if(!host.children.length)host.innerHTML=HD.map(([c,t])=>`<div class="hdl ${c}" data-c="${c}">${t}</div>`).join('');
 [...host.children].forEach((el,i)=>{const[,,comp,sg]=HD[i];const dir=fr[comp];const s=proj(P.add(nb,P.mul(dir,L*sg)));if(!s){el.style.display='none';return;}let dx=s.x-ns.x,dy=s.y-ns.y;const l=Math.hypot(dx,dy)||1;const r=Math.max(34,Math.min(70,l));
  el.style.display='';el.style.left=(ns.x+dx/l*r)+'px';el.style.top=(ns.y+dy/l*r)+'px';el._dir=[dx/l,dy/l];el._comp=comp;el._sg=sg;
  el.onmousedown=ev=>{ev.preventDefault();ev.stopPropagation();drag={el};};});}
function dragHandle(dx,dy,fine){const el=drag.el;const d=(dx*el._dir[0]+dy*el._dir[1])*(fine?.05:.5)*el._sg;const n=F.node;n[el._comp]+=d;F.setNode({t:n.t,pro:n.pro,nrm:n.nrm,rad:n.rad});}
function mapClick(x,y){const ls=lineCache.segs&&lineCache.segs[0];if(!ls)return;const s=ls.s,el=s.el;let best=null;
 for(let i=0;i<=300;i++){const nu=ls.sp.nu0+(ls.sp.nu1-ls.sp.nu0)*i/300;const rr=el.p/(1+el.e*Math.cos(nu));if(rr<0)continue;const p=P.posAt(el,nu);const pp=s.body==='lune'?P.add(p,P.lunePos(F.t)):p;const q=proj(pp);if(!q)continue;const d=Math.hypot(q.x-x,q.y-y);if(!best||d<best.d)best={d,nu};}
 if(!best||best.d>24)return;let dt=P.timeFromPe(best.nu,el.e,el.a,el.mu)-P.timeFromPe(el.nu,el.e,el.a,el.mu);if(el.e<1)dt=((dt%el.T)+el.T)%el.T;if(dt<0)return;
 F.setNode({t:F.t+Math.max(5,dt),pro:0,nrm:0,rad:0});snd.play('place');toast('Maneuver node placed — drag the handles (Shift = fine)');}

/* ===================== HUD ===================== */
function buildSasButtons(){const M=[['off','OFF'],['hold','HOLD'],['pro','PRO'],['retro','RETRO'],['normal','NRM'],['anti','A-NRM'],['radout','RAD+'],['radin','RAD−'],['node','NODE'],['target','TGT'],['antitarget','A-TGT']];
 $('sas').innerHTML=M.map(([k,n])=>`<button data-k="${k}" class="${F.sas===k?'on':''}${(k==='node'&&!F.node)||((k==='target'||k==='antitarget')&&!F.target)?' x':''}">${n}</button>`).join('');
 $('sas').querySelectorAll('button').forEach(b=>b.onclick=()=>setSas(b.dataset.k));}
function eq(label,body){return`<div class="fm"><div class="eq"><small>${label}</small>${body}</div></div>`;}
function hud(force){const now=performance.now();const v=F.ves,t=F.t;if(now-lastNav>33||force){lastNav=now;drawNavball();}
 if(!force&&now-lastHud<110)return;lastHud=now;const B=v.B,el=v.landed?null:v.orbit(),rr=P.len(v.r),alt=rr-B.R,vs=P.len(v.v),up=P.norm(v.r),vz=P.dot(v.v,up);
 const pr=P.pressureRatio(B,alt),T=v.thrustInfo(pr),m=v.props().m,g=B.mu/rr/rr;const ds=v.dvStages(pr),dvT=ds.reduce((a,s)=>a+s.dv,0);
 $('f-met').textContent=tfmt(t-F.t0);$('f-clock').textContent=sess.len?tfmt(sess.left):'∞';$('f-warp').textContent=F.warp+'×';$('f-warp').classList.toggle('on',F.warp>1);
 $('f-status').textContent=flightDone==='win'||(mission&&career.done.includes(mission.id))?'✓ COMPLETE — keep flying or recover':v.destroyed?'VESSEL LOST':`${B.name} · ${v.landed?(v.splashed?'SPLASHED':'LANDED'):alt<(B.atm||0)?'ATMOSPHERE':el&&el.rp>B.R+(B.atm||0)?'ORBITING':el&&el.e>=1?'ESCAPING':'SUB-ORBITAL'}`;
 // flight math panel
 if(showMath){let h='';const mu=B.mu,muS=sci(mu);
  h+=`<div class="fm"><i>ALTITUDE</i><b>${alt<10000?nf(alt)+' m':km(alt)}</b></div>${eq('h','= |r| − R = '+nf(rr/1000,1)+' − '+nf(B.R/1000)+' km')}`;
  h+=`<div class="fm"><i>SPEED</i><b>${nf(vs,vs<100?1:0)} m/s</b></div><div class="fm"><i>VERTICAL</i><b>${vz>=0?'+':''}${nf(vz,1)} m/s</b></div>`;
  if(el){const a=el.a;const ap=el.e<1?km(el.ra-B.R):'∞ (escape)',pe=el.rp<B.R?'below surface':km(el.rp-B.R);
   h+=`<div class="fm"><i>APOAPSIS</i><b>${ap}${el.e<1?' · T−'+tfmt(el.toAp):''}</b></div><div class="fm"><i>PERIAPSIS</i><b>${pe}${el.toPe>0&&isFinite(el.toPe)?' · T−'+tfmt(el.toPe):''}</b></div>`;
   if(el.e<1){h+=eq('a','= (r<sub>Pe</sub> + r<sub>Ap</sub>)/2 = <span class="r">'+km(a)+'</span>');h+=eq('T','= 2π√(a³/μ) = 2π√(('+nf(a/1000)+' km)³ / '+muS+') = <span class="r">'+tfmt(el.T)+'</span>');}
   else h+=eq('a',' = −μ/(2ε) = <span class="r">'+km(a)+'</span> (negative: hyperbolic, escaping)');
   const vv=P.visViva(mu,rr,a);h+=eq('VIS-VIVA','v = √(μ(2/r − 1/a)) = √('+muS+' × (2/'+nf(rr/1000,1)+'k − 1/'+nf(a/1000,1)+'k)) = <span class="r">'+nf(vv)+' m/s</span>');
   if(el.e<1&&el.rp>B.R)h+=eq('CIRCLE','v<sub>c</sub> = √(μ/r) = <span class="r">'+nf(P.vCirc(mu,rr))+' m/s</span> here');}
  const twr=T.F/(m*g);h+=`<div class="fm"><i>TWR</i><b>${T.live?twr.toFixed(2):'—'}</b></div>`+(T.F?eq('TWR','F/(m·g) = '+nf(T.F/1000)+' kN / ('+nf(m/1000,2)+' t × '+g.toFixed(2)+') = <span class="r">'+twr.toFixed(2)+'</span>'):'');
  const s0=ds[0];h+=`<div class="fm"><i>Δv LEFT</i><b>${nf(s0?.dv||0)} / ${nf(dvT)} m/s</b></div>`+(s0&&s0.dv?eq('STAGE Δv','I<sub>sp</sub>g₀ ln(m₀/m<sub>f</sub>) = '+nf(s0.isp)+' × 9.81 × ln('+nf(s0.m0/1000,2)+'/'+nf(s0.mf/1000,2)+')'):'');
  if(B.atm&&alt<B.atm){const rho=P.density(B,alt);h+=eq('DRAG','q = ½ρv² = ½ × '+rho.toFixed(4)+' × '+nf(vs)+'² = <span class="r">'+nf(v.q/1000,1)+' kPa</span>');}
  h+=`<div class="fm"><i>POWER</i><b>${nf(v.ec)} / ${nf(v.ecMax)} EC</b></div>`;$('f-math').innerHTML=h;}
 // stages
 $('f-stages').innerHTML=`<b style="font:400 1rem var(--disp);letter-spacing:.06em">STAGES</b>`+ds.map((s,i)=>`<div class="fs${i===0?' act':''}"><span>${i===0?'▶ ':''}STAGE ${i+1}</span><b>${nf(s.dv)} m/s</b><span>${s.F?`TWR ${(s.F/(s.m0*g)).toFixed(2)} · ${nf(s.fuel)} kg`:'no engine'}</span><span>${nf(s.m0/1000,2)} t</span></div>`).join('')+
  `<div class="fs"><span>PARACHUTE</span><b>${v.hasChute()?(v.chuteTorn?'TORN':v.chute?'OPEN':'READY'):'—'}</b></div><div class="fs"><span>LEGS · SOLAR</span><b>${v.hasLegs()?(v.legs?'DOWN':'UP'):'—'} · ${v.hasSolar()?(v.solarOpen?'OPEN':'SHUT'):'—'}</b></div>`;
 // target
 const ti=F.targetInfo();$('f-target').hidden=!ti||ti.name!=='STATION';if(ti&&ti.name==='STATION')$('f-target').innerHTML=`<b>STATION</b><div class="fs"><span>DISTANCE</span><b>${ti.d<10000?nf(ti.d)+' m':km(ti.d)}</b></div><div class="fs"><span>REL. SPEED |v−v<sub>t</sub>|</span><b>${nf(ti.vr,1)} m/s</b></div><div class="fs"><span>CLOSING</span><b>${nf(ti.closing,1)} m/s</b></div>`;
 // Δv box
 $('dvbox').innerHTML=`<i>THROTTLE</i><b>${Math.round(v.throttle*100)}%</b><i>SAS · ${F.coach?'AUTOPILOT':F.sas.toUpperCase()}</i><div class="ecbar"><div style="width:${v.ecMax?v.ec/v.ecMax*100:0}%"></div></div>
  <div class="tg"><button class="${F.coach?'on':''}" data-a="C">COACH C</button><button class="${mapView?'on':''}" data-a="M">MAP M</button><button class="${hohOpen?'on':''}" data-a="H">HOHMANN H</button><button data-a="N">NOTEBOOK N</button></div>`;
 $('dvbox').querySelectorAll('button').forEach(b=>b.onclick=()=>{edge['Key'+b.dataset.a]=true;if(b.dataset.a==='N')openNote();});
 $('thr-f').style.height=(v.throttle*100)+'%';
 // coach / hints
 const c=F.coach;$('coach').hidden=(!c&&!(opt.hints&&hintText()))||(!c&&!!F.node&&!hohOpen);if(c){$('c-who').textContent='AUTOPILOT COACH · C TO TAKE OVER';$('c-title').textContent=c.title||'…';$('c-text').innerHTML=c.text||'';}
 else if(opt.hints){const h=hintText();if(h){$('c-who').textContent='COACH TIP';$('c-title').textContent=h[0];$('c-text').innerHTML=h[1];}}
 // suicide burn gauge
 const showSB=!v.landed&&vz<-3&&alt<(B.atm?6000:25000)&&!(v.chute&&v.chuteOpen>.5);$('sb').hidden=!showSB;
 if(showSB){const Tv=v.thrustInfo(pr);const aB=Tv.F/m-g;const hc=alt-v.props().foot;const d=P.stopDistance(-vz,aB);const sc=Math.max(hc,d)*1.3||1;$('sb-d').style.width=Math.min(100,d/sc*100)+'%';$('sb-h').style.left=Math.min(99,hc/sc*100)+'%';
  const burn=d>hc*.85;$('sb').classList.toggle('burn',burn&&isFinite(d));$('sb-t').innerHTML=aB>0?`d = v²/(2a) = ${nf(-vz)}² / (2 × ${aB.toFixed(2)}) = <b>${nf(d)} m</b> · height ${nf(hc)} m ${burn?'— <b style="color:var(--bad)">BURN NOW</b>':''}`:'a = F/m − g ≤ 0 — this stage can\'t stop you!';}
 if(hohOpen)renderHoh(false);renderNodePanel();
 if(F.sas==='node'&&!F.node||((F.sas==='target'||F.sas==='antitarget')&&!ti)){F.sas='hold';buildSasButtons();}
 $('sas').querySelectorAll('button').forEach(b=>b.classList.toggle('on',(F.coach?'':F.sas)===b.dataset.k));}
function hintText(){const v=F.ves,el=v.landed?null:v.orbit(),B=v.B,alt=v.alt,T=v.thrustInfo(P.pressureRatio(B,alt));
 if(v.destroyed)return null;
 if(v.landed&&v.landedOn==='verda'&&!v.ignited)return['READY FOR LAUNCH','Press <b>Z</b> for full throttle, then <b>SPACE</b> to ignite. Or press <b>C</b> and let the coach fly a demonstration gravity turn.'];
 if(v.landed&&v.ignited&&v.throttle===0&&v.segFuel()>0)return['THROTTLE UP','<b>Shift</b> raises throttle, <b>Z</b> = 100%. Lift-off needs F > m·g.'];
 if(v.landed&&T.live&&T.F<v.props().m*B.g)return['TOO HEAVY','Thrust '+nf(T.F/1000)+' kN < weight '+nf(v.props().m*B.g/1000)+' kN. TWR < 1 — back to the assembly hall.'];
 if(v.ignited&&!T.live&&v.segs().length>1)return['STAGE EMPTY','Press <b>SPACE</b> to drop the empty stage and light the next one — a lighter m₀ makes ln(m₀/m<sub>f</sub>) work for you again.'];
 if(B.atm&&alt<B.atm&&v.q>8000&&v.aoa>.17)return['ANGLE OF ATTACK!','The airflow is '+Math.round(v.aoa*57.3)+'° off the nose at q = '+nf(v.q/1000,1)+' kPa. Steer toward prograde (SAS <b>2</b>) or drag will flip you.'];
 if(mission&&['orbit','hohmann','rendezvous','flyby','land','home'].includes(mission.id)&&B.atm&&alt>1000&&alt<12000&&!v.landed&&P.angleBetween(v.nose,P.norm(v.r))<.06&&v.throttle>0)return['GRAVITY TURN','Tip about 10° east with <b>D</b>, then select SAS <b>PRO</b> (2) and let gravity curve the path.'];
 if(el&&B.atm&&alt<B.atm&&el.ra-B.R>75000&&v.throttle>0&&el.rp<B.R)return['APOAPSIS IS HIGH ENOUGH','Cut throttle (<b>X</b>) and coast. At Ap burn prograde: you need v<sub>c</sub> = √(μ/r) ≈ '+nf(P.vCirc(B.mu,el.ra))+' m/s.'];
 if(el&&alt>B.atm&&el.rp<B.R+B.atm&&el.e<1&&el.toAp<90&&v.throttle===0&&B===VERDA&&!(mission&&mission.id==='space'))return['CIRCULARISE','Apoapsis in '+Math.round(el.toAp)+' s: point PRO (2) and burn (Z) until Pe > 70 km.'];
 if(el&&el.rp>B.R+(B.atm||0)&&!F.node&&!hohOpen&&mission&&['hohmann','rendezvous','flyby','land','home'].includes(mission.id))return['IN ORBIT','Open the <b>HOHMANN HELPER</b> (H) to plan the next burn, or the map (M) and click your orbit to place a node.'];
 if(F.node&&F.sas!=='node'&&!F.coach)return['NODE PLANNED','SAS <b>NODE</b> (8) points at the burn; burn half the burn time before the node. Or press <b>B</b> to let the coach execute it.'];
 if(B.atm&&!v.landed&&alt<12000&&P.dot(v.v,P.norm(v.r))<-20&&v.hasChute()&&!v.chute)return['PARACHUTE','Open the chute with <b>P</b> once speed is below ~250 m/s.'];
 return null;}
// navball: sky/ground sphere centred on the nose, with prograde/normal/radial/node/target markers
const nbC=$('navball'),nbX=nbC.getContext('2d'),nbImg=nbX.createImageData(180,180);
function drawNavball(){const v=F.ves,q=v.q4,W=180,r=86,cx=90,cy=90;const nose=v.nose,right=P.qrot(q,[1,0,0]),top=P.qrot(q,[0,0,1]);const up=P.norm(v.r);let north=P.sub([0,1,0],P.mul(up,up[1]));north=P.len(north)<1e-6?[0,0,1]:P.norm(north);const east=P.cross(north,up);
 const D=nbImg.data;for(let y=0;y<W;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;const sx=(x-cx)/r,sy=-(y-cy)/r,rr=sx*sx+sy*sy;if(rr>1){D[i+3]=0;continue;}const z=Math.sqrt(1-rr);
  const d0=right[0]*sx+top[0]*sy+nose[0]*z,d1=right[1]*sx+top[1]*sy+nose[1]*z,d2=right[2]*sx+top[2]*sy+nose[2]*z;const el=d0*up[0]+d1*up[1]+d2*up[2];
  const hz=d0*north[0]+d1*north[1]+d2*north[2],he=d0*east[0]+d1*east[1]+d2*east[2];const az=Math.atan2(he,hz);const lat=Math.asin(Math.max(-1,Math.min(1,el)));
  let R0,G0,B0;if(el>0){R0=40+60*(1-el);G0=110+60*(1-el);B0=190+40*(1-el);}else{R0=150+30*el;G0=95+20*el;B0=45;}
  const latL=Math.abs(lat/(Math.PI/12)-Math.round(lat/(Math.PI/12)))<.04*(1+(1-z)),azL=Math.abs(az/(Math.PI/4)-Math.round(az/(Math.PI/4)))<.012/Math.max(.2,Math.cos(lat));
  if(Math.abs(el)<.012){R0=G0=B0=255;}else if(latL||azL){R0*=.75;G0*=.75;B0*=.75;}const sh=.55+.45*z;D[i]=R0*sh;D[i+1]=G0*sh;D[i+2]=B0*sh;D[i+3]=255;}
 nbX.putImageData(nbImg,0,0);
 const mk=(dir,draw)=>{if(!dir)return;const bx=P.dot(dir,right),by=P.dot(dir,top),bz=P.dot(dir,nose);if(bz<0)return;draw(cx+bx*r,cy-by*r);};
 const ring=(c,x,y,cross)=>{nbX.strokeStyle=c;nbX.lineWidth=2.5;nbX.beginPath();nbX.arc(x,y,7,0,Math.PI*2);nbX.stroke();if(cross){nbX.beginPath();nbX.moveTo(x-5,y-5);nbX.lineTo(x+5,y+5);nbX.moveTo(x+5,y-5);nbX.lineTo(x-5,y+5);nbX.stroke();}else{nbX.beginPath();nbX.moveTo(x,y-7);nbX.lineTo(x,y-13);nbX.moveTo(x-7,y);nbX.lineTo(x-13,y);nbX.moveTo(x+7,y);nbX.lineTo(x+13,y);nbX.stroke();}};
 const tri=(c,x,y,inv)=>{nbX.strokeStyle=c;nbX.lineWidth=2.5;nbX.beginPath();const s=inv?-1:1;nbX.moveTo(x,y-8*s);nbX.lineTo(x+7,y+5*s);nbX.lineTo(x-7,y+5*s);nbX.closePath();nbX.stroke();};
 if(!v.landed&&P.len(v.v)>.5){mk(v.sasDir('pro'),(x,y)=>ring('#ffd166',x,y));mk(v.sasDir('retro'),(x,y)=>ring('#ffd166',x,y,true));mk(v.sasDir('normal'),(x,y)=>tri('#d07bff',x,y));mk(v.sasDir('anti'),(x,y)=>tri('#d07bff',x,y,true));
  mk(v.sasDir('radout'),(x,y)=>{nbX.strokeStyle='#5fe3e3';nbX.lineWidth=2.5;nbX.beginPath();nbX.arc(x,y,6,0,Math.PI*2);nbX.stroke();nbX.fillStyle='#5fe3e3';nbX.fillRect(x-1.5,y-1.5,3,3);});mk(v.sasDir('radin'),(x,y)=>{nbX.strokeStyle='#5fe3e3';nbX.lineWidth=2.5;nbX.beginPath();nbX.arc(x,y,6,0,Math.PI*2);nbX.stroke();});}
 if(F.node)mk(P.norm(F.node.dvW),(x,y)=>{nbX.fillStyle='#3d8bff';nbX.beginPath();nbX.arc(x,y,7,0,Math.PI*2);nbX.fill();nbX.strokeStyle='#fff';nbX.lineWidth=1.5;nbX.stroke();});
 const ti=F.targetInfo();if(ti){mk(ti.dir,(x,y)=>{nbX.strokeStyle='#ff5ad1';nbX.lineWidth=2.5;nbX.strokeRect(x-6,y-6,12,12);});if(ti.vr>.3&&ti.name==='STATION')mk(P.norm(ti.vrel),(x,y)=>{nbX.strokeStyle='#ff5ad1';nbX.beginPath();nbX.arc(x,y,5,0,Math.PI*2);nbX.stroke();});}
 nbX.strokeStyle='#ff4d00';nbX.lineWidth=3;nbX.beginPath();nbX.moveTo(cx-18,cy);nbX.lineTo(cx-7,cy);nbX.lineTo(cx,cy+7);nbX.lineTo(cx+7,cy);nbX.lineTo(cx+18,cy);nbX.stroke();
 nbX.strokeStyle='rgba(255,255,255,.25)';nbX.lineWidth=2;nbX.beginPath();nbX.arc(cx,cy,r,0,Math.PI*2);nbX.stroke();
 const hdg=((Math.atan2(P.dot(nose,east),P.dot(nose,north))*180/Math.PI)+360)%360,pit=Math.asin(cl(P.dot(nose,up),-1,1))*180/Math.PI;$('nb-hdg').textContent=`HDG ${hdg.toFixed(0)}° · PITCH ${pit.toFixed(0)}°`;}
function renderNodePanel(){const n=F.node,el=$('node');if(!n||hohOpen||F.coach){el.hidden=true;return;}el.hidden=false;const v=F.ves,m=v.props().m,T=v.thrustInfo(0);const bt=T.F?P.burnTimeForDv(n.dv,m,T.isp,T.F):Infinity;const p0=n.pred[0],p1=n.pred[1];
 const res=p0.end==='enc'&&p1?`LUNE encounter · Pe ${km(p1.el.rp-LUNE.R)}`:p0.end==='exit'&&p1?`escape LUNE → VERDA Pe ${km(p1.el.rp-VERDA.R)}`:`Ap ${p0.el.e<1?km(p0.el.ra-P.BODY[p0.body].R):'∞'} · Pe ${km(p0.el.rp-P.BODY[p0.body].R)}`;
 const row=(k,lab)=>`<div class="nrow"><span>${lab}</span><b>${nf(n[k],1)} m/s</b><span class="bs"><button data-k="${k}" data-d="-10">−10</button><button data-k="${k}" data-d="-1">−1</button><button data-k="${k}" data-d="1">+1</button><button data-k="${k}" data-d="10">+10</button></span></div>`;
 const html=`<h5>MANEUVER NODE</h5>${row('pro','PROGRADE')}${row('nrm','NORMAL')}${row('rad','RADIAL')}
  <div class="nrow"><span>TIME</span><b>T−${tfmt(n.t-F.t)}</b><span class="bs"><button data-t="-60">−60</button><button data-t="-10">−10</button><button data-t="10">+10</button><button data-t="60">+60</button></span></div>
  <div class="nrow"><span></span><span></span><span class="bs"><button data-t="ap">AT AP</button><button data-t="pe">AT PE</button></span></div>
  <div class="eq">|Δv| = <b>${nf(n.dv,1)} m/s</b> · burn t = (m₀I<sub>sp</sub>g₀/F)(1 − e<sup>−Δv/I<sub>sp</sub>g₀</sup>) = <b>${isFinite(bt)?bt.toFixed(1)+' s':'no thrust'}</b></div>
  <div class="eq" style="color:var(--blue)">→ ${res}</div><div class="row tight"><button class="ghost xs" data-x="exec">EXECUTE (B)</button><button class="ghost xs" data-x="del">DELETE (Del)</button></div>`;
 if(el._h!==html){el._h=html;el.innerHTML=html;el.querySelectorAll('button').forEach(b=>b.onmousedown=e=>{e.stopPropagation();const nn=F.node;if(!nn)return;
  if(b.dataset.k)nn[b.dataset.k]+=+b.dataset.d;else if(b.dataset.t){const eo=P.elements(...(()=>{const s=P.kepler(v.r,v.v,0,v.B.mu);return[s.r,s.v];})(),v.B.mu);if(b.dataset.t==='ap'){if(eo.e<1)nn.t=F.t+eo.toAp;}else if(b.dataset.t==='pe')nn.t=F.t+eo.toPe;else nn.t=Math.max(F.t+5,nn.t+ +b.dataset.t);}
  else if(b.dataset.x==='exec'){edge.KeyB=true;return;}else if(b.dataset.x==='del'){F.setNode(null);return;}F.setNode({t:nn.t,pro:nn.pro,nrm:nn.nrm,rad:nn.rad});snd.play('click');});}}
// HOHMANN HELPER: the transfer worked out step by step with the live numbers
let hohTarget='alt',hohAlt=250;
function toggleHoh(on){hohOpen=on??!hohOpen;$('hoh').hidden=!hohOpen;snd.play('click');if(hohOpen){if(mission?.target==='station')hohTarget='station';else if(mission?.target==='lune')hohTarget=F.ves.body==='lune'?'return':'lune';renderHoh(true);}}
function renderHoh(force){const v=F.ves,el=$('hoh');if(!force&&el._t&&performance.now()-el._t<500)return;el._t=performance.now();const B=v.B,mu=B.mu;
 if(v.landed){el.innerHTML='<h5>HOHMANN HELPER</h5><p class="small">Get into orbit first — a transfer starts from an orbit.</p>';return;}
 const o=v.orbit();const r1=o.e<1?o.a:P.len(v.r);let r2,tgtName;
 if(hohTarget==='station'){r2=P.STATION.r;tgtName='STATION';}else if(hohTarget==='lune'){r2=LUNE.a;tgtName='LUNE';}else if(hohTarget==='return'){r2=VERDA.R+32000;tgtName='VERDA (from LUNE)';}else{r2=VERDA.R+hohAlt*1000;tgtName=`${hohAlt} km ORBIT`;}
 const tabs=`<div class="seg" style="margin-bottom:8px">${[['alt','ALTITUDE'],['station','STATION'],['lune','LUNE'],['return','RETURN HOME']].map(([k,n])=>`<button data-h="${k}" class="${hohTarget===k?'on':''}">${n}</button>`).join('')}</div>`;
 let s='';const st=(i,t,body)=>`<div class="step"><span>${i}</span><div><p>${t}</p><div class="eq">${body}</div></div></div>`;
 if(hohTarget==='return'){if(v.body!=='lune'){s='<p class="small">Use this from orbit around LUNE.</p>';}else{s+=st(1,'Escape LUNE <b>backwards</b>',`Leaving LUNE against its orbital motion (v<sub>LUNE</sub> = √(μ<sub>V</sub>/a) = ${nf(P.vCirc(VERDA.mu,LUNE.a))} m/s) leaves us slower than LUNE around VERDA.`);
   const at=(LUNE.a+r2)/2,vA=P.visViva(VERDA.mu,LUNE.a,at);s+=st(2,'Speed needed at LUNE\'s distance',`v<sub>apo</sub> = √(μ(2/r − 1/a)) with a = (${km(LUNE.a)} + ${km(r2)})/2 → <b>${nf(vA)} m/s</b>`);
   s+=st(3,'Excess speed relative to LUNE',`v<sub>∞</sub> = v<sub>LUNE</sub> − v<sub>apo</sub> = <b>${nf(P.vCirc(VERDA.mu,LUNE.a)-vA)} m/s</b>; the optimiser finds the burn that gives Pe ≈ 32 km at VERDA.`);
   s+=`<div class="row tight"><button class="go" data-p="returnplan">CREATE RETURN NODE</button></div>`;}}
 else if(v.body==='lune'&&hohTarget!=='return'){s='<p class="small">You are orbiting LUNE — use RETURN HOME, or CAPTURE to circularise.</p><div class="row tight"><button class="ghost xs" data-p="capture">CIRCULARISE AT PE</button></div>';}
 else{const H=P.hohmann(mu,r1,r2);
  s+=st(1,'Where we are and where we\'re going',`r₁ = ${km(r1)} (your orbit's a) → r₂ = ${km(r2)} (${tgtName}) · transfer orbit a<sub>t</sub> = (r₁ + r₂)/2 = <b>${km(H.at)}</b>`);
  s+=st(2,'First burn (prograde) — stretch the orbit',`Δv₁ = √(μ/r₁)·(√(2r₂/(r₁+r₂)) − 1) = ${nf(P.vCirc(mu,r1))} × (√(${(2*r2/(r1+r2)).toFixed(4)}) − 1) = <b>${nf(H.dv1,1)} m/s</b>`);
  s+=st(3,'Coast half an ellipse',`t = π√(a<sub>t</sub>³/μ) = π√((${nf(H.at/1000)} km)³ / ${sci(mu)}) = <b>${tfmt(H.t)}</b>`);
  s+=st(4,'Second burn — round it off',`Δv₂ = √(μ/r₂)·(1 − √(2r₁/(r₁+r₂))) = ${nf(P.vCirc(mu,r2))} × (1 − √(${(2*r1/(r1+r2)).toFixed(4)})) = <b>${nf(H.dv2,1)} m/s</b> · total <b>${nf(H.total,1)} m/s</b>`);
  if(hohTarget!=='alt'){const n2=Math.sqrt(mu/r2**3);const lead=P.wrap((hohTarget==='lune'?LUNE.theta0+LUNE.n*F.t:P.STATION.theta0+P.STATION.n*F.t)-P.phaseAngle(v.r));
   s+=st(5,'Timing — the phase angle',`The target moves n₂·t = ${(n2*H.t*180/Math.PI).toFixed(1)}° while we coast, so burn when it leads by φ = π − n₂t = <b>${(P.wrap(H.phase)*180/Math.PI).toFixed(1)}°</b>. It leads by <b>${(lead*180/Math.PI).toFixed(1)}°</b> now.`);}
  if(hohTarget==='alt')s+=`<div class="row tight"><span class="small">TARGET ALT</span><input id="h-alt" type="number" min="75" max="3500" value="${hohAlt}"> km<button class="go" data-p="raise">CREATE NODE (Δv₁)</button><button class="ghost xs" data-p="circap">CIRCULARISE AT AP</button></div>`;
  else if(hohTarget==='station')s+=`<div class="row tight"><button class="go" data-p="window">CREATE TIMED NODE</button><button class="ghost xs" data-p="match">MATCH VELOCITY (COACH)</button></div>`;
  else s+=`<div class="row tight"><button class="go" data-p="moonplan">CREATE OPTIMISED NODE</button><button class="ghost xs" data-p="capture">CAPTURE AT LUNE PE</button></div>`;}
 const html=`<h5>HOHMANN HELPER <small style="font:.55rem var(--mono);color:var(--mut)">H TO CLOSE</small></h5>${tabs}${s}`;if(el._h===html)return;el._h=html;el.innerHTML=html;
 el.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>{hohTarget=b.dataset.h;renderHoh(true);});const inp=$('h-alt');if(inp)inp.onchange=()=>{hohAlt=cl(+inp.value||250,75,3500);renderHoh(true);};
 el.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{const prog=b.dataset.p;F.o.targetAlt=hohAlt*1000;if(prog==='match'){F.coach=new Coach(['match']);toggleHoh(false);return;}const c=new Coach([prog]);c.update(F);toast(c.title||'Node created','good');snd.play('place');toggleHoh(false);if(!mapView)toggleMap();});}

/* ===================== notebook ===================== */
function openNote(focus){noteOpen=true;$('note').hidden=false;const have=n=>mode==='free'||career.notes.includes(n.id);
 $('n-count').textContent=`${NOTEBOOK.filter(have).length} / ${NOTEBOOK.length} UNLOCKED`;
 $('n-list').innerHTML=NOTEBOOK.map(n=>{const ok=have(n);return`<div class="ne${ok?'':' lock'}" id="ne-${n.id}"><h6>${n.t}</h6><div class="fo">${ok?n.f:'? ? ?'}</div>${ok?`<p>${n.x}</p>${DIAGRAMS[n.d]||''}<div class="cv">${n.v.map(([k,l,,u,val,mn,mx])=>`<label>${l}${u?` (${u})`:''} <b data-o="${k}">${val}</b><input type="range" data-k="${k}" min="${mn}" max="${mx}" step="${(mx-mn)/200}" value="${val}"></label><span></span>`).join('')}</div><div class="out"></div>`:`<p>Complete mission ${MISSIONS.find(m=>m.notes.includes(n.id))?.n||''} to learn this.</p>`}</div>`;}).join('');
 NOTEBOOK.forEach(n=>{const box=$('ne-'+n.id);if(!box||!have(n))return;const calc=()=>{const o={};box.querySelectorAll('input').forEach(i=>{o[i.dataset.k]=+(+i.value).toPrecision(4);box.querySelector(`[data-o="${i.dataset.k}"]`).textContent=o[i.dataset.k];});box.querySelector('.out').innerHTML=n.calc(o);};box.querySelectorAll('input').forEach(i=>i.oninput=calc);calc();});
 if(focus){const el=$('ne-'+focus);if(el)el.scrollIntoView({block:'center'});}}
function closeNote(){noteOpen=false;$('note').hidden=true;}

/* ===================== toasts + banner ===================== */
function toast(t,k=''){const el=document.createElement('div');el.className=k;el.innerHTML=t;$('toast').appendChild(el);setTimeout(()=>el.remove(),3600);while($('toast').children.length>4)$('toast').firstChild.remove();}
let bnT=0;function banner(t,s,d=3){$('bn-t').textContent=t;$('bn-s').textContent=s;$('banner').classList.add('on');bnT=d;}

/* ===================== rendering ===================== */
const POST={exposure:1.0,bloom:.5,bloomThreshold:.9,bloomRadius:.5,vignette:.32,saturation:1.1,grain:.02,ao:false};
let gfx=quality(),fxS=null,fxV=null;
function applyQuality(q){gfx=q;fxS=null;fxV=null;sunL.castShadow=q>0;vkey.castShadow=q>0;const pr=Math.min(devicePixelRatio,q===2?1.5:1);R.setPixelRatio(pr);parts.U.uScale.value=300;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function getFx(which){const w=innerWidth,h=innerHeight;if(which==='v'){if(!fxV){fxV=cinematic(R,vscene,vcam,{...POST,exposure:1.05,bloomThreshold:.95});fxV.w=0;}if(fxV.w!==w*1e4+h){fxV.w=w*1e4+h;fxV.setSize(w,h);}return fxV;}
 if(!fxS){fxS=cinematic(R,scene,cam,POST);fxS.w=0;}if(fxS.w!==w*1e4+h){fxS.w=w*1e4+h;fxS.setSize(w,h);}return fxS;}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);
 if(app==='vab'){vcam.aspect=w/h;vcam.updateProjectionMatrix();getFx('v').render();return;}
 cam.aspect=w/h;cam.updateProjectionMatrix();prepSpace();parts.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));getFx('s').render();}
// per-frame uniforms + lights for the space scene (camera already placed)
function prepSpace(){cam.updateMatrixWorld();const cw=cam.position.clone();const camU=[cw.x+origin[0],cw.y+origin[1],cw.z+origin[2]];
 const vU=new V(camU[0],camU[1],camU[2]);pMat.uniforms.uCam.value.copy(vU);cMat.uniforms.uCam.value.copy(vU);aMat.uniforms.uCam.value.copy(vU);
 const Lp=P.lunePos(F?F.t:menuT*40);mMat.uniforms.uCam.value.set(camU[0]-Lp[0],camU[1]-Lp[1],camU[2]-Lp[2]);
 const pix=2*Math.tan(cam.fov*Math.PI/360)/innerHeight;pMat.uniforms.uPix.value=pix;mMat.uniforms.uPix.value=pix;
 const camAltV=vU.length()-VERDA.R;atmo.material.side=camAltV<VERDA.atm?THREE.BackSide:THREE.FrontSide;
 stars.position.copy(cw);sun.position.copy(cw).addScaledVector(toV(SUN),8e8);sun.scale.setScalar(8e8*.06);
 // star fade in daylight sky
 const upC=vU.clone().normalize();const day=cl(upC.dot(toV(SUN))*3+.3,0,1)*cl(1-camAltV/VERDA.atm,0,1);stars.material.uniforms.uFade.value=1-day*.97;
 // surface patches near the camera
 updPatch(patchV,camU,[0,0,0],VERDA.R,40000);updPatch(patchL,camU,Lp,LUNE.R,30000);
 // lights: sun follows the vessel, dark in planet shadow
 mMat.uniforms.uPl.value.set(-Lp[0],-Lp[1],-Lp[2]).normalize();const vp=F?F.ves.uniPos(F.t):camU;const s=P.dot(vp,SUN);const lr=P.sub(vp,Lp),sl=P.dot(lr,SUN);const inSh=(s<0&&P.len(P.sub(vp,P.mul(SUN,s)))<VERDA.R)||(sl<0&&P.len(P.sub(lr,P.mul(SUN,sl)))<LUNE.R);sunL.intensity=inSh?0:3.2;sunL.position.set(SUN[0]*400,SUN[1]*400,SUN[2]*400);sunL.target.position.set(0,0,0);
 const sz=F?Math.max(30,F.ves.ps[0]?.y1*1.2||30):60;Object.assign(sunL.shadow.camera,{left:-sz,right:sz,top:sz,bottom:-sz,near:1,far:900});sunL.shadow.camera.updateProjectionMatrix();
 const alt=P.len(vp)-VERDA.R;hemi.intensity=.12+.3*cl(1-alt/400000,0,1)*(inSh?.3:1);hemi.color.setRGB(.45,.62,1);hemi.groundColor.setRGB(.12,.14,.18);
 site.visible=P.len(P.sub(camU,[VERDA.R,0,0]))<60000;station.visible=P.len(P.sub(camU,P.stationState(F?F.t:0).r))<80000;}
function updPatch(pt,camU,center,Rb,lim){const rel=P.sub(camU,center),d=P.len(rel),alt=d-Rb;if(alt>lim){pt.mesh.visible=false;return;}const c=P.norm(rel);const half=cl((alt+3000)/Rb*1.6,.012,.2);
 if(!pt.c||P.len(P.sub(pt.c,c))>half*.25||Math.abs(pt.half-half)/half>.4)fillPatch(pt,c,half);pt.mesh.visible=true;}

/* ===================== menu + VAB cameras ===================== */
function menuStep(dt){menuT+=dt;const t=menuT*40;origin=[0,0,0];placeWorld([0,0,0],t);const a=-.62+Math.sin(menuT*.05)*.35;
 const L=P.lunePos(t);cam.position.set(Math.cos(a)*VERDA.R*2.9,VERDA.R*.5,Math.sin(a)*VERDA.R*2.9);cam.up.set(0,1,0);const rt=new V(-Math.sin(a),0,Math.cos(a));cam.lookAt(rt.multiplyScalar(VERDA.R*.95));cam.near=100;cam.updateProjectionMatrix();RB.o.concat(RB.n,[RB.st,RB.lu]).forEach(r=>r.hide());}
function vabStep(dt){vYaw+=dt*.08;const a=vAn,h=a?a.height:6;const d=vDist||20;vcam.position.set(Math.sin(vYaw)*d,h*.5+d*.22,Math.cos(vYaw)*d);vcam.lookAt(0,h*.45+.6,0);
 vkey.target.position.set(0,h*.4,0);vrim.target.position.set(0,h*.5,0);$('v-clock').textContent=sess&&sess.len?tfmt(sess.left):'∞';}

/* ===================== main loop ===================== */
function step(dt){dt=Math.min(.05,dt);
 if(app==='menu'||app==='results'||app==='hub')menuStep(dt);
 else if(app==='vab')vabStep(dt);
 else if(app==='flight'&&F){if(!paused&&!noteOpen)flightStep(dt);else{origin=F.ves.uniPos(F.t);placeWorld(origin,F.t);mapView?mapCamera():chaseCamera(P.norm(F.ves.r));}}
 if(app==='hub'){$('h-clock').textContent=sess&&sess.len?tfmt(sess.left):'∞';$('h-funds').textContent=nf(career.funds);}
 tickSession(dt);if(bnT>0){bnT-=dt;if(bnT<=0)$('banner').classList.remove('on');}
 for(const k in edge)edge[k]=false;}

/* ===================== wiring ===================== */
const seg=(id,key)=>{const el=$(id);const set=v=>{opt[key]=v;el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v));save();};set(opt[key]);el.querySelectorAll('button').forEach(b=>b.onclick=()=>{set(+b.dataset.v);snd.play('click');});};
seg('o-len','len');seg('o-easy','easy');seg('o-hints','hints');
{const el=$('v-start');el.querySelectorAll('button').forEach(b=>b.onclick=()=>{vStart=+b.dataset.v;el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));refreshVab();});}
$('go').onclick=()=>start();$('free').onclick=()=>start({free:true});$('mnote').onclick=()=>openNote();$('n-close').onclick=closeNote;
$('h-note').onclick=()=>openNote();$('h-end').onclick=()=>endSession();$('v-back').onclick=()=>mode==='free'?toMenu():toHub();$('v-launch').onclick=vabLaunch;
$('v-grant').onclick=()=>{career.funds+=15000;sess.pts=Math.max(0,sess.pts-100);sess.grant++;save();refreshVab();toast('Emergency grant received (−100 pts)');};
$('p-resume').onclick=()=>pause(false);$('p-revert').onclick=()=>{pause(false);revert();};$('p-vab').onclick=()=>{pause(false);toVab();};$('p-hub').onclick=()=>{pause(false);mode==='free'?toVab():toHub();};$('p-quit').onclick=()=>{pause(false);endSession();};
$('o-again').onclick=()=>start();$('o-menu').onclick=toMenu;
$('o-post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Orbit Lab\nPoints: ${a.pts||0}\nMissions this session: ${a.done||0}\nFlights: ${a.flights||0}\nSession: ${a.len?a.len/60+' min':'endless'}${a.easy?' · easy physics':''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore(ID,a.pts||0,body);};
addEventListener('resize',()=>{fxS&&(fxS.w=0);fxV&&(fxV.w=0);});

toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ===================== test hooks ===================== */
window.ORBIT={get state(){return app==='flight'?(flightDone||(paused?'paused':'flying')):app;},get app(){return app;},step,render,start,toMenu,toHub,toVab,launch,
 get F(){return F;},get career(){return career;},get sess(){return sess;},get design(){return design;},set design(d){design=d.slice();if(app==='vab')refreshVab();},
 setClock(s){if(sess){sess.len=sess.len||s;sess.left=s;}},get clock(){return sess?sess.left:0;},
 setMission(i){selMission=i;mission=MISSIONS[i];},get mission(){return mission;},keys,edge,P,MISSIONS,
 setMap(on){if(mapView!==on)toggleMap();},hoh(on){toggleHoh(on);},pause,openNote,closeNote,setCam(o){Object.assign(camS,o);},get camS(){return camS;},
 vis:{atmo,clouds,planet,aMat,cMat,pMat},complete(id){return completeMission(MISSIONS.find(m=>m.id===id));},setQuality:applyQuality,scene,R,cam};
