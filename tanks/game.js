// IRONCLAD — full 3D arcade tank combat. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {V3,cl,angDiff,wrapA,fmt} from './util.js';
import {MAPS,B,buildWorld,navGrid,breakOb,rayObs,rayTerrain,minimapLayer,clearAt} from './maps.js';
import {HULLS,TURRETS,PAINTS,Tank,TEAMC,UPCOST,MAXLV,G as GRAV} from './tanks.js';
import {FX} from './fx.js';
import {Ballistics,rayTanks} from './combat.js';
import {DIFF,initBot,botStep,canSee} from './ai.js';
import {Sound} from './sound.js';
import {HUD} from './hud.js';
import {crateTex} from './tex.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id),R=(a=1)=>Math.random()*a;
const DT=1/60;
const NAMES=['ANVIL','BRUTUS','COBALT','DRAKE','EMBER','FURY','GRIM','HAVOC','IRONSIDE','JAVELIN','KODIAK','LANCER','MARAUDER','NOMAD','ONYX','PALADIN','QUARRY','RAMPART','SABER','TUSK','URSA','VANDAL','WARDOG','XENON','YUKON','ZEALOT','CINDER','DOZER','FLINT','GRANITE','HUSK','MOLOCH'];
export const MODES={tdm:{n:'TEAM DEATHMATCH',goal:m=>({5:20,8:30,10:40})[m]||30,unit:'KILLS'},ctf:{n:'CAPTURE THE FLAG',goal:m=>m===5?3:5,unit:'CAPS'},cp:{n:'CONTROL POINT',goal:m=>({5:250,8:400,10:500})[m]||400,unit:'PTS'}};
const DROPK=[{k:'repair',n:'REPAIR KIT',c:0x2fbf5a,w:.35},{k:'dmg',n:'DOUBLE DAMAGE',c:0xff4d00,w:.25},{k:'speed',n:'SPEED BOOST',c:0xffcf3f,w:.2},{k:'armor',n:'ARMOUR PLATING',c:0x3d8bff,w:.2}];

/* ================= persistence ================= */
const GK='pxd_ironclad';
const garage={credits:600,own:{bulwark:1,talon:1},lv:{},hull:'bulwark',turret:'talon',paint:'olive'},saveGarage=stored(GK,garage);
const opt={mode:'tdm',map:'desert',diff:1,time:8,sens:1},saveOpt=stored(GK+'_opt',opt);

/* ================= renderer + scene ================= */
const canvas=$('c');const RR=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});RR.setPixelRatio(Math.min(devicePixelRatio,1.5));
RR.shadowMap.enabled=true;RR.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(62,1,.25,3200);
const hemi=new THREE.HemisphereLight(0xffffff,0x444444,1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,3);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0003;sun.shadow.normalBias=.06;Object.assign(sun.shadow.camera,{left:-75,right:75,top:75,bottom:-75,near:20,far:420});scene.add(sun,sun.target);
const fx=new FX(scene),snd=new Sound();

/* ================= game state ================= */
const G={time:0,tanks:[],fx,snd,W:null,nav:null,drops:[],score:[0,0],mode:'tdm',opt,player:null,flags:null,cps:null,spotT:[new Map(),new Map()],dustCol:[[.7,.6,.45]],shakeV:0};
let app='menu',phase='countdown',cdT=3,clock=480,endT=0,acc=0,timeScale=1,winner=-1,lastBeep=-1,goal=30,dropT=12,roleT=0,spotTimer=0,navT=0,miniT=0,lastAward=null,overT=0,streak=0,streakT=0,result=null;
const ball=new Ballistics(G);G.ball=ball;
const hud=new HUD(G);

/* ================= world ================= */
const POST={exposure:1,bloom:.3,bloomThreshold:.9,bloomRadius:.45,vignette:.32,saturation:1.06,grain:.018,aoStrength:.85};
let post=null,gfx=quality();
function dispose(o){o.traverse(c=>{if(c.geometry)c.geometry.dispose();});}
function loadMap(id){if(G.W){scene.remove(G.W.root);dispose(G.W.root);}fx.clear();ball.clear();clearObjectives();
 const W=G.W=buildWorld(RR,id,1);scene.add(W.root);scene.fog=W.fog;scene.environment=W.env;scene.background=new THREE.Color(W.T.hor);
 const T=W.T;hemi.color.set(T.hemi[0]);hemi.groundColor.set(T.hemi[1]);hemi.intensity=T.hemi[2];sun.color.set(T.sunCol);sun.intensity=T.sunI;G.sunDir=new V3(...T.sun).normalize();
 fx.setFog(T.fog,T.fogD);G.dustCol=id==='desert'?[[.82,.7,.52],[.74,.62,.46]]:id==='snow'?[[.93,.95,1],[.85,.9,.97]]:[[.55,.53,.5],[.48,.46,.44]];
 fx.setTrackColor(id==='desert'?[.45,.34,.22]:id==='snow'?[.55,.6,.68]:[.12,.12,.12]);
 G.nav=navGrid(W);G.mini=minimapLayer(W);POST.exposure=T.exp;post=null;RR.shadowMap.needsUpdate=true;}

/* ================= tanks ================= */
function clearTanks(){for(const t of G.tanks){scene.remove(t.model.root);}G.tanks=[];G.player=null;}
function botLoadout(team,diff){const hr=R(),tr=R();const hull=hr<.33?'kestrel':hr<.72?'bulwark':'behemoth',turret=tr<.4?'talon':tr<.72?'maul':'lance';const up=DIFF[diff].upg;
 const paints=team===0?['olive','urban','navy','sand']:['tiger','sand','urban','arctic','olive'];return{hull,turret,paint:paints[R(paints.length)|0],hl:Math.min(MAXLV,Math.round(R(up))),tl:Math.min(MAXLV,Math.round(R(up)))};}
function addTank(t){G.tanks.push(t);scene.add(t.model.root);t.model.root.traverse(o=>{if(o.isMesh)o.frustumCulled=true;});return t;}
function respawn(t){const sp=G.W.spawns[t.team];let best=sp[0],bs=-1e9;for(const s of sp){let sc=R(8);for(const o of G.tanks){if(!o.alive||o===t)continue;const d=Math.hypot(o.p.x-s.x,o.p.z-s.z);if(d<8)sc-=60;if(o.team!==t.team&&d<70)sc-=(70-d);}if(sc>bs){bs=sc;best=s;}}
 t.spawn(best.x+R(2)-1,best.z+R(2)-1,best.yaw,G.W);t.wreck=false;t.pop=null;t.burnT=0;fx.trackBreak(t.id+'L');fx.trackBreak(t.id+'R');
 if(!t.human&&t.ai){t.ai.path=null;t.ai.dest=null;t.ai.target=null;t.ai.cover=null;t.ai.flank=null;}
 fx.spark(new V3(t.p.x,t.p.y+1.5,t.p.z),40,6,t.team?[[1.6,.4,.3]]:[[.4,.9,1.8]],.9,.9,{up:true,grav:-2});
 if(t.human){camYaw=t.yaw;camPitch=.12;zoom=false;hud.dead(false);}}

/* ================= match flow ================= */
function start(o={}){G.aimOverride=null;if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);saveOpt();snd.init();
 loadMap(opt.map);clearTanks();G.time=0;G.score=[0,0];G.mode=opt.mode;goal=MODES[opt.mode].goal(opt.time);clock=opt.time*60;winner=-1;result=null;G.drops=[];dropT=10+R(4);streak=0;
 G.spotT=[new Map(),new Map()];
 const P=addTank(new Tank(0,'YOU',{hull:garage.hull,turret:garage.turret,paint:garage.paint,hl:garage.lv[garage.hull]||0,tl:garage.lv[garage.turret]||0},true));G.player=P;
 const names=NAMES.slice().sort(()=>Math.random()-.5);
 for(let i=0;i<4;i++){const t=addTank(new Tank(0,names.pop(),botLoadout(0,Math.max(0,opt.diff-(opt.diff===2?1:0)))));initBot(t,DIFF[opt.diff]);}
 for(let i=0;i<5;i++){const t=addTank(new Tank(1,names.pop(),botLoadout(1,opt.diff)));initBot(t,DIFF[opt.diff]);}
 // spawn: one tank per spawn slot
 for(const team of[0,1]){const list=G.tanks.filter(t=>t.team===team);list.forEach((t,i)=>{const s=G.W.spawns[team][(i+(team?0:2))%6];t.spawn(s.x,s.z,s.yaw,G.W);t.prot=4;});}
 setupObjectives();roleT=0;
 camYaw=P.yaw;camPitch=.14;camDist=11;zoom=false;phase='countdown';cdT=3.2;lastBeep=4;timeScale=1;
 app='match';$('menu').hidden=true;$('garage').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;hud.show(true);hud.reset();document.body.classList.add('playing');lock();
 hud.banner(MODES[opt.mode].n,`${G.W.name} · ${MODES[opt.mode].unit==='KILLS'?'FIRST TO '+goal+' KILLS':MODES[opt.mode].unit==='CAPS'?'FIRST TO '+goal+' CAPTURES':'FIRST TO '+goal+' POINTS'}`,'#fff',2.6);}
function toMenu(){app='menu';unlock();clearTanks();ball.clear();if(!G.W||G.W.id!==opt.map)loadMap(opt.map);clearObjectives();G.drops.forEach(d=>removeDrop(d));G.drops=[];
 const lo={hull:garage.hull,turret:garage.turret,paint:garage.paint,hl:garage.lv[garage.hull]||0,tl:garage.lv[garage.turret]||0};const t=addTank(new Tank(0,'YOU',lo,true));G.player=t;const sp=showSpot();t.spawn(sp.x,sp.z,sp.yaw,G.W);t.prot=0;
 $('menu').hidden=false;$('garage').hidden=false;$('keys').hidden=false;$('over').hidden=true;$('pause').hidden=true;hud.show(false);document.body.classList.remove('playing');snd.mute();renderGarage();updateBest();}
function showSpot(){const p=G.W.points[1];return{x:p.x+(G.W.id==='port'?-8:0),z:p.z+(G.W.id==='desert'?5:0),yaw:Math.PI*.8};}
function endMatch(w,why){if(phase==='end')return;phase='end';endT=0;winner=w;timeScale=.4;const me=G.player;const won=w===me.team;
 hud.banner(w<0?'DRAW':won?'VICTORY':'DEFEAT',why,w<0?'#fff':won?'#39d47a':'#ff3b30',3);snd.play('horn');setTimeout(()=>snd.play(won?'win':'lose'),600);}
function showOver(){app='over';unlock();hud.show(false);document.body.classList.remove('playing');snd.mute();overT=0;
 const me=G.player,won=winner===me.team,draw=winner<0;
 $('oeye').textContent=`${MODES[G.mode].n} · ${G.W.name} · CPU ${DIFF[opt.diff].n}`;
 $('ores').textContent=draw?'DRAW':won?'VICTORY':'DEFEAT';$('ores').style.color=draw?'#fff':won?'#39d47a':'#ff3b30';
 $('ofs').innerHTML=`<span class="b">${G.score[0]|0}</span> — <span class="r">${G.score[1]|0}</span>`;
 const ranked=G.tanks.slice().sort((a,b)=>score(b)-score(a));const mvp=ranked.find(t=>t.team===(draw?ranked[0].team:winner))||ranked[0];
 const col=G.mode==='ctf'?'CAPS':G.mode==='cp'?'CAP PTS':'';
 $('stats').innerHTML=`<tr><th>COMMANDER</th><th>TANK</th><th>KILLS</th><th>DEATHS</th><th>K/D</th><th>DAMAGE</th>${col?`<th>${col}</th>`:''}<th>SCORE</th></tr>`+[0,1].map(tm=>ranked.filter(t=>t.team===tm).map(t=>`<tr class="t${tm}${t.human?' me':''}"><td>${t.name}${t===mvp?'<span class="mvp">MVP</span>':''}</td><td>${t.H.n}<small>${t.T.n}</small></td><td>${t.stats.k}</td><td>${t.stats.d}</td><td>${(t.stats.k/Math.max(1,t.stats.d)).toFixed(2)}</td><td>${Math.round(t.stats.dmg)}</td>${col?`<td>${G.mode==='ctf'?t.stats.caps:Math.round(t.stats.cp)}</td>`:''}<td>${score(t)}</td></tr>`).join('')).join('');
 const s=me.stats,mult=[.8,1,1.3][opt.diff];const parts=[['BASE',120],['DAMAGE',Math.round(s.dmg*.6)],['KILLS',s.k*70],['OBJECTIVE',s.caps*150+Math.round(s.cp*1.2)+s.ret*40],['RESULT',won?350:draw?150:0]];
 const cr=Math.round(parts.reduce((a,p)=>a+p[1],0)*mult);garage.credits+=cr;saveGarage();
 const tok=award(won);
 $('otok').innerHTML=`<b>+${cr} CREDITS</b> · ${parts.filter(p=>p[1]).map(p=>p[0]+' '+p[1]).join(' · ')} · ×${mult} CPU<br>+${tok} TOKENS · ${lastAward.pts} PTS · BEST ${best()} PTS · BANK ◆ ${garage.credits}`;
 $('over').hidden=false;result={won,draw,credits:cr,pts:lastAward.pts,score:[...G.score]};}
function score(t){return Math.round(t.stats.dmg+t.stats.k*100+t.stats.caps*300+t.stats.cp*2+t.stats.ret*50);}
function award(won){const me=G.player,s=me.stats;const pts=score(me)+(won?500:0);lastAward={pts,won,k:s.k,d:s.d,dmg:Math.round(s.dmg),score:G.score.map(x=>x|0).join('-'),mode:MODES[G.mode].n,map:G.W.name,diff:DIFF[opt.diff].n,tank:me.H.n+' / '+me.T.n};
 const tok=5+Math.min(60,pts/40|0);addRound(tok,won);saveBest('ironclad',pts);return tok;}
function best(){return bestScore('ironclad');}
function updateBest(){const b=best();$('best').textContent=b?`BEST ${b.toLocaleString()} PTS`:'';}

/* ================= objectives: flags & control points ================= */
const objRoot=new THREE.Group();scene.add(objRoot);
function clearObjectives(){while(objRoot.children.length){const c=objRoot.children.pop();dispose(c);}G.flags=null;G.cps=null;}
function clothGeo(){const g=new THREE.PlaneGeometry(2.2,1.4,12,6);g.translate(1.1,0,0);g.userData.base=g.attributes.position.array.slice();return g;}
function waveCloth(g,t,amp=1){const p=g.attributes.position,b=g.userData.base;for(let i=0;i<p.count;i++){const x=b[i*3];p.setZ(i,Math.sin(x*2.4-t*7)*.18*x*.45*amp+Math.sin(x*4-t*11)*.05*x*amp);p.setY(i,b[i*3+1]-x*x*.03*(1-amp*.5));}p.needsUpdate=true;if((g.userData.n=(g.userData.n||0)+1)%6===0)g.computeVertexNormals();}
function beacon(col,h=60,r=.6){const g=new THREE.CylinderGeometry(r,r*1.6,h,12,1,true);g.translate(0,h/2,0);return new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(.5),transparent:true,opacity:.15,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));}
function setupObjectives(){clearObjectives();const W=G.W;
 if(G.mode==='ctf'){G.flags=W.flags.map((f,team)=>{const gr=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,4.6,6),new THREE.MeshStandardMaterial({color:0xd8d8d8,metalness:.8,roughness:.3}));pole.position.y=2.3;gr.add(pole);
   const cg=clothGeo();const cloth=new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:TEAMC[team].css,emissive:TEAMC[team].css,emissiveIntensity:.35,side:THREE.DoubleSide,roughness:.8}));cloth.position.y=3.8;gr.add(cloth);
   const bc=beacon(TEAMC[team].css,50,.5);gr.add(bc);objRoot.add(gr);
   const base=new THREE.Mesh(new THREE.RingGeometry(4,4.6,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:new THREE.Color(TEAMC[team].css).multiplyScalar(1.6),transparent:true,opacity:.8,depthWrite:false}));base.position.set(f.x,W.terrain.height(f.x,f.z)+.15,f.z);objRoot.add(base);
   return{team,home:{x:f.x,z:f.z},x:f.x,z:f.z,state:'home',carrier:null,dropT:0,gr,cg,cloth};});}
 if(G.mode==='cp'){G.cps=W.points.map(p=>{const y=W.terrain.height(p.x,p.z);const gr=new THREE.Group();gr.position.set(p.x,y,p.z);
   const ring=new THREE.Mesh(new THREE.RingGeometry(11.4,12,64).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.75,depthWrite:false}));ring.position.y=.2;gr.add(ring);
   const fill=new THREE.Mesh(new THREE.CircleGeometry(11.4,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.08,depthWrite:false}));fill.position.y=.18;gr.add(fill);
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,7,6),new THREE.MeshStandardMaterial({color:0x9a9a9a,metalness:.8,roughness:.3}));pole.position.y=3.5;gr.add(pole);
   const cg=clothGeo();const cloth=new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:0xdddddd,emissive:0x888888,emissiveIntensity:.3,side:THREE.DoubleSide,roughness:.8}));cloth.position.y=6.2;gr.add(cloth);
   const bc=beacon(0xffffff,40,.4);gr.add(bc);objRoot.add(gr);
   // conform ring to terrain roughly by lifting
   return{...p,r:12,owner:-1,prog:0,gr,ring,fill,cloth,cg,bc,cnt:[0,0]};});}}
function carrierOf(t){return G.flags?G.flags.find(f=>f.carrier===t):null;}G.carrierOf=carrierOf;
function dropFlag(t){const f=carrierOf(t);if(!f)return;f.carrier=null;f.state='dropped';f.dropT=25;f.x=t.p.x;f.z=t.p.z;msgFor(f.team===0?'YOUR FLAG WAS DROPPED':'ENEMY FLAG DROPPED',f.team===0?'#ff9a8a':'#9ec0ff');}
function returnFlag(f,by){f.state='home';f.carrier=null;f.x=f.home.x;f.z=f.home.z;if(by){by.stats.ret++;feed(`${by.name} RETURNED THE FLAG`,by.team,by.human);}snd.play('flag');}
function updateFlags(dt){for(const f of G.flags){const other=G.flags[1-f.team];
  if(f.state==='carried'){const c=f.carrier;if(!c.alive){dropFlag(c);continue;}f.x=c.p.x;f.z=c.p.z;
   // capture: carrier reaches own base while own flag is home
   if(other.state==='home'&&Math.hypot(c.p.x-other.home.x,c.p.z-other.home.z)<6){G.score[c.team]++;c.stats.caps++;returnFlag(f,null);feed(`${c.name} CAPTURED THE FLAG`,c.team,c.human);
    hud.banner('FLAG CAPTURED',`${TEAMC[c.team].n} ${G.score[c.team]} / ${goal}`,TEAMC[c.team].css,2);snd.play(c.team===0?'cap':'lost');G.shakeV=Math.max(G.shakeV,.2);}}
  else{for(const t of G.tanks){if(!t.alive)continue;if(Math.hypot(t.p.x-f.x,t.p.z-f.z)>4.2)continue;
    if(t.team!==f.team&&!carrierOf(t)){f.state='carried';f.carrier=t;feed(`${t.name} TOOK THE ${TEAMC[f.team].n} FLAG`,t.team,t.human);msgFor(f.team===0?'ENEMY HAS YOUR FLAG':t.human?'YOU HAVE THE FLAG · RETURN TO BASE':'WE HAVE THE ENEMY FLAG',f.team===0?'#ff9a8a':'#9ec0ff');snd.play('flag');break;}
    if(t.team===f.team&&f.state==='dropped'){returnFlag(f,t);break;}}
   if(f.state==='dropped'){f.dropT-=dt;if(f.dropT<=0){returnFlag(f,null);feed(`${TEAMC[f.team].n} FLAG RETURNED`,f.team,false);}}}}}
function updateCPs(dt){for(const c of G.cps){c.cnt=[0,0];for(const t of G.tanks)if(t.alive&&Math.hypot(t.p.x-c.x,t.p.z-c.z)<c.r)c.cnt[t.team]++;const[a,b]=c.cnt;
  if(a&&!b)c.prog=Math.min(1,c.prog+.09*Math.min(3,a)*dt);else if(b&&!a)c.prog=Math.max(-1,c.prog-.09*Math.min(3,b)*dt);
  const prev=c.owner;if(c.prog>=1)c.owner=0;else if(c.prog<=-1)c.owner=1;else if(c.owner===0&&c.prog<=0||c.owner===1&&c.prog>=0)c.owner=-1;
  if(prev!==c.owner){if(c.owner>=0){feed(`POINT ${c.n} CAPTURED BY ${TEAMC[c.owner].n}`,c.owner,false);msgFor(c.owner===0?`POINT ${c.n} SECURED`:`POINT ${c.n} LOST`,c.owner===0?'#9ec0ff':'#ff9a8a');snd.play(c.owner===0?'cap':'lost');
    for(const t of G.tanks)if(t.alive&&t.team===c.owner&&Math.hypot(t.p.x-c.x,t.p.z-c.z)<c.r)t.stats.cp+=25;}else msgFor(`POINT ${c.n} NEUTRALISED`,'#fff');}
  if((a&&!b)||(b&&!a))for(const t of G.tanks)if(t.alive&&Math.hypot(t.p.x-c.x,t.p.z-c.z)<c.r&&((t.team===0&&c.prog<1)||(t.team===1&&c.prog>-1)))t.stats.cp+=dt*2;
  if(c.owner>=0)G.score[c.owner]+=dt;}}
// bot objective per mode: [x,z,priority]
G.objective=t=>{const a=t.ai;
 if(G.mode==='ctf'&&G.flags){const mine=G.flags[t.team],theirs=G.flags[1-t.team];const cf=carrierOf(t);
  if(cf)return[mine.home.x,mine.home.z,3];
  if(mine.state==='carried'&&a.role==='hunt')return[mine.x,mine.z,2];
  if(mine.state==='dropped'&&a.role!=='attack')return[mine.x,mine.z,2];
  if(a.role==='attack'){if(theirs.state==='carried'){const c=theirs.carrier;return[c.p.x+Math.sin(t.id)*8,c.p.z+Math.cos(t.id)*8,1];}if(Math.abs(t.p.z-theirs.z)>58&&theirs.state==='home'){const ln=a.lane||0;return[ln*58,theirs.z*.42,2];}return[theirs.x,theirs.z,2];}
  const ang=t.id*2.1+G.time*.05;return[mine.home.x+Math.cos(ang)*14,mine.home.z-(t.team?-1:1)*12+Math.sin(ang)*8,0];}
 if(G.mode==='cp'&&G.cps){const c=G.cps[a.cp??1];const inside=Math.hypot(t.p.x-c.x,t.p.z-c.z)<c.r-2;const need=(t.team===0&&c.prog<1)||(t.team===1&&c.prog>-1);
  const j=((t.id*37)%10-5)*.8;return[c.x+j,c.z+((t.id*53)%10-5)*.8,need?2:0];}
 // TDM: roam toward hot zones, biased to the enemy half
 if(!a.roam||G.time>a.roamT||Math.hypot(a.roam[0]-t.p.x,a.roam[1]-t.p.z)<10){const pool=[...G.W.points.map(p=>[p.x,p.z]),...G.W.dropZones.map(p=>[p.x,p.z])];const s=t.team?1:-1;
  const cand=pool.filter(p=>p[1]*s>-30);const p=(cand.length?cand:pool)[R((cand.length?cand:pool).length)|0];a.roam=[p[0]+R(10)-5,p[1]+R(10)-5];a.roamT=G.time+18+R(10);}
 return[a.roam[0],a.roam[1],0];};
function assignRoles(){for(const team of[0,1]){const bots=G.tanks.filter(t=>t.team===team&&!t.human&&t.alive);
  if(G.mode==='ctf'){const mine=G.flags[team],theirs=G.flags[1-team];const ef=[theirs.x,theirs.z];bots.sort((a,b)=>Math.hypot(a.p.x-ef[0],a.p.z-ef[1])-Math.hypot(b.p.x-ef[0],b.p.z-ef[1]));
   bots.forEach((t,i)=>t.ai.role=i<Math.ceil(bots.length*.6)?'attack':'defend');
   if(mine.state==='carried'||mine.state==='dropped'){const near=bots.slice().sort((a,b)=>Math.hypot(a.p.x-mine.x,a.p.z-mine.z)-Math.hypot(b.p.x-mine.x,b.p.z-mine.z));near.slice(0,2).forEach(t=>t.ai.role='hunt');}}
  if(G.mode==='cp'){const cnt=[0,0,0];for(const t of bots){let bi=1,bs=1e9;G.cps.forEach((c,i)=>{const own=(team===0&&c.prog>=1)||(team===1&&c.prog<=-1);const contested=c.cnt[1-team]>0;let s=Math.hypot(c.x-t.p.x,c.z-t.p.z)+cnt[i]*55+(own&&!contested?90:0)-(contested?25:0)+(i===t.ai.cp?-15:0);if(s<bs){bs=s;bi=i;}});t.ai.cp=bi;cnt[bi]++;}}}}

/* ================= supply drops ================= */
const crateGeo=new THREE.BoxGeometry(1.6,1.6,1.6),chuteGeo=new THREE.SphereGeometry(3.2,16,8,0,Math.PI*2,0,Math.PI*.42);
const crateMats={};function crateMat(k){return crateMats[k]||(crateMats[k]=new THREE.MeshStandardMaterial({map:crateTex(k),roughness:.6,metalness:.3,emissive:0xffffff,emissiveMap:crateTex(k),emissiveIntensity:.25}));}
function spawnDrop(){const zones=G.W.dropZones.filter(z=>!G.drops.some(d=>Math.hypot(d.x-z.x,d.z-z.z)<8));if(!zones.length)return;const z=zones[R(zones.length)|0];
 let r=R(),k=DROPK[0];for(const d of DROPK){if(r<d.w){k=d;break;}r-=d.w;}
 const gr=new THREE.Group();const crate=new THREE.Mesh(crateGeo,crateMat(k.k));crate.castShadow=true;gr.add(crate);
 const chute=new THREE.Mesh(chuteGeo,new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:.9,side:THREE.DoubleSide}));chute.position.y=5.2;chute.castShadow=true;gr.add(chute);
 const lines=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new V3(.7,.8,.7),new V3(2.6,5.4,2.6),new V3(-.7,.8,.7),new V3(-2.6,5.4,2.6),new V3(.7,.8,-.7),new V3(2.6,5.4,-2.6),new V3(-.7,.8,-.7),new V3(-2.6,5.4,-2.6)]),new THREE.LineBasicMaterial({color:0x333333}));gr.add(lines);
 const bc=beacon(k.c,45,.5);const gy=G.W.terrain.height(z.x,z.z);bc.position.set(z.x,gy,z.z);objRoot.add(bc);
 const ring=new THREE.Mesh(new THREE.RingGeometry(2.2,2.6,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:new THREE.Color(k.c).multiplyScalar(1.5),transparent:true,opacity:.8,depthWrite:false}));ring.position.set(z.x,gy+.15,z.z);objRoot.add(ring);
 gr.position.set(z.x,gy+60,z.z);objRoot.add(gr);const d={kind:k.k,n:k.n,x:z.x,z:z.z,gy,y:gy+60,state:'falling',t:0,gr,chute,lines,bc,ring};G.drops.push(d);
 if(app==='match')msgFor(`SUPPLY DROP INBOUND · ${k.n}`,'#'+new THREE.Color(k.c).getHexString());snd.play('drop');}
function removeDrop(d){objRoot.remove(d.gr);objRoot.remove(d.bc);objRoot.remove(d.ring);d.state='gone';}
function updateDrops(dt){dropT-=dt;if(dropT<=0&&G.drops.length<3){spawnDrop();dropT=17+R(9);}
 for(let i=G.drops.length-1;i>=0;i--){const d=G.drops[i];d.t+=dt;
  if(d.state==='falling'){d.y-=7*dt;d.gr.rotation.y+=dt*.4;d.gr.rotation.z=Math.sin(d.t*1.3)*.08;if(d.y<=d.gy+.8){d.y=d.gy+.8;d.state='ground';d.t=0;d.gr.rotation.z=0;fx.puff(new V3(d.x,d.gy+.3,d.z),12,5,G.dustCol,1,3,1.4,{flat:true,a:.5,grav:0});}}
  else if(d.state==='ground'){d.chute.scale.y=Math.max(.01,1-d.t*1.5);d.chute.position.y=5.2*Math.max(0,1-d.t*1.2)+.8;d.lines.visible=d.t<.6;d.gr.rotation.y+=dt*.8;
   for(const t of G.tanks){if(!t.alive||Math.hypot(t.p.x-d.x,t.p.z-d.z)>3.4)continue;pickup(t,d);break;}if(d.t>45&&d.state==='ground'){removeDrop(d);}}
  d.gr.position.set(d.x,d.y+(d.state==='ground'?Math.sin(d.t*2)*.15+.2:0),d.z);d.bc.material.opacity=.16+Math.sin(G.time*3)*.05;
  if(d.state==='gone')G.drops.splice(i,1);}}
function pickup(t,d){removeDrop(d);if(d.kind==='repair'){t.hp=Math.min(t.max,t.hp+t.max*.6);t.crit={track:0,turret:0,engine:0};}else t.buffs[d.kind]=15;
 fx.spark(new V3(d.x,d.gy+1.5,d.z),50,7,[[.6,2,.8],[2,2,2]],.9,.9,{up:true,grav:-3});if(t.human){snd.play('pickup');msgFor(d.n+(d.kind==='repair'?'':' · 15 S'),'#fff');}}

/* ================= combat events ================= */
G.fire=t=>ball.fire(t);
G.onFire=(t,mz,dir)=>{const T=t.T,big=t.lo.turret==='maul';fx.flash(mz,dir,big?2.4:t.lo.turret==='lance'?1.6:1.2);
 fx.spark(mz,big?24:10,big?14:8,[[4,2.4,1],[3.5,1.6,.5]],big?1.2:.6,.25,{dir,spread:.5,drag:5});fx.puff(mz,big?16:5,big?7:3,[[.6,.58,.55],[.75,.72,.68]],big?1.4:.6,big?4.5:2.2,big?2.2:1.2,{dir:new V3(dir.x*.6,dir.y*.6+.1,dir.z*.6),a:.45,grav:-.3});
 fx.light(mz,t.lo.turret==='lance'?(t.team?0xff6040:0x60c0ff):0xffb060,big?60:t.lo.turret==='lance'?40:18,big?26:16);
 if(big)fx.puff(new V3(t.p.x,t.p.y+.4,t.p.z),14,8,G.dustCol,1.4,3.6,1.6,{flat:true,a:.45,grav:0,jit:1.5});
 const a=audible(mz);snd.play(t.lo.turret,a.v,a.pan);if(t.human){G.shakeV=Math.max(G.shakeV,big?.35:.12);hud.fired();}};
function audible(p){const P=G.player;const d=cam.position.distanceTo(p);const v=Math.max(0,1-d/260)**1.5;const rx=Math.cos(camYaw),rz=-Math.sin(camYaw);const dx=(p.x-cam.position.x)/(d||1),dz=(p.z-cam.position.z)/(d||1);return{v:Math.max(v,d<4?1:0),pan:cl(-(dx*rx+dz*rz),-1,1)*.8};}
G.damage=(t,att,amt,info)=>{if(!t.alive||phase==='end'&&false)return;amt=Math.min(amt,t.hp);t.hp-=amt;t.hitT=G.time;if(att&&att.team!==t.team){t.lastHitBy=att;att.stats.dmg+=amt;att.stats.hits++;}
 const p=info.p;const small=info.kind==='talon';fx.spark(p,small?14:30,small?9:14,[[4,3,1.6],[3,1.4,.4]],small?.5:.9,.5,{dir:info.n?info.n:undefined,spread:1,grav:12,drag:2});
 fx.puff(p,small?3:8,2.5,[[.25,.23,.22]],small?.8:1.6,small?2:3.6,1.4,{a:.6});if(!small)fx.light(p,0xffa060,30,14);
 if(info.n&&!info.splash)fx.scorch(p,info.n,small?.7:1.3);
 const a=audible(p);snd.play('hit',a.v,a.pan);if(info.crit)fx.spark(p,24,10,[[4,4,4],[4,3,1]],.8,.6,{grav:8});
 if(att&&att.human&&t!==att){hud.dmgNum(p,amt,info.crit,t.hp<=0);hud.hit(info.crit?`CRITICAL · ${info.crit}`:info.face==='rear'?'REAR HIT':info.splash?'SPLASH':info.face==='side'?'SIDE HIT':info.face==='top'?'TOP HIT':'',info.crit?'#ffcf3f':'#fff');if(info.crit)snd.play('crit');}
 if(t.human){hud.hurt(att?att.p:p);G.shakeV=Math.max(G.shakeV,Math.min(.6,amt/80));snd.play('hurt',.6);if(info.crit)hud.hit(`CRITICAL · ${info.crit} DAMAGED`,'#ff6a50');}
 if(t.hp<=0)killTank(t,att);};
G.ricochet=(t,att,p,dir,n)=>{fx.spark(p,22,16,[[4,4,3.4],[4,3,1.6]],.35,.4,{dir:new V3().copy(dir).addScaledVector(n,-2*dir.dot(n)),spread:.4,grav:4,drag:1.5});const a=audible(p);snd.play('ric',a.v,a.pan);
 if(att&&att.human)hud.hit('RICOCHET','#9ec0ff');if(t.human)hud.hit('RICOCHET · NO DAMAGE','#39d47a');};
G.shieldHit=(t,p)=>{fx.spark(p,20,6,t.team?[[1.8,.5,.4]]:[[.5,1.2,2.2]],.6,.5,{});if(G.player&&G.player===t)hud.hit('SPAWN SHIELD','#9ec0ff');};
G.groundHit=(p,dir,kind)=>{const big=kind==='maul',rail=kind==='rail';const n=G.W.terrain.normal(p.x,p.z,new V3());
 fx.puff(p,big?22:rail?10:6,big?9:5,G.dustCol,big?1.6:.9,big?5:2.6,big?2.6:1.5,{dir:n,spread:.9,a:.7,grav:2.5,drag:1.8});fx.spark(p,big?10:5,8,[[3,1.8,.6]],.5,.35,{dir:n,grav:10});
 if(!big)fx.debris(p,3,5,G.W.id==='snow'?[new THREE.Color(.95,.97,1)]:[new THREE.Color(.45,.38,.3)],.18,{ground:(x,z)=>G.W.terrain.height(x,z)});
 fx.scorch(p,n,big?3.2:1.2);const a=audible(p);snd.play(big?'small':'dirt',a.v*.8,a.pan);};
const MATC={wood:[new THREE.Color(.45,.3,.18),new THREE.Color(.6,.42,.25)],stone:[new THREE.Color(.62,.56,.48),new THREE.Color(.75,.68,.58),new THREE.Color(.5,.45,.4)],metal:[new THREE.Color(.45,.47,.5),new THREE.Color(.3,.31,.33)]};
G.hurtOb=(o,dmg,p,dir,att,n)=>{if(p){fx.spark(p,8,9,[[3.6,2.4,1]],.45,.35,{dir:n||undefined,grav:10});fx.puff(p,6,3,o.mat==='stone'?[[.7,.64,.56]]:[[.4,.38,.36]],.9,2.8,1.6,{dir:n||undefined,a:.6});if(n)fx.scorch(p,n,1.1);const a=audible(p);snd.play(o.mat==='wood'?'wood':'dirt',a.v,a.pan);}
 if(o.hp===Infinity)return;o.hp-=dmg;if(o.hp<=0)G.knock(o,att,dir||new V3(1,0,0));};
G.knock=(o,by,dir)=>{if(!o.alive)return;breakOb(G.W,o,dir);const cy=o.y0+o.h*.4,p=new V3(o.x,cy,o.z);const gnd=(x,z)=>G.W.terrain.height(x,z);const a=audible(p);
 if(o.kind==='house'){const[w,h,d]=o.dims;for(let i=0;i<5;i++)fx.puff(new V3(o.x+R(w)-w/2,o.y0+R(h),o.z+R(d)-d/2),10,7,o.mat==='wood'?[[.5,.45,.4],[.62,.58,.52]]:[[.78,.7,.6],[.66,.6,.52]],2.5,8,4,{a:.7,grav:-.2,jit:2});
  fx.debris(p,60,11,MATC[o.mat==='wood'?'wood':o.mat],.9,{ground:gnd,jit:Math.max(w,d)*.6});snd.play('crash',a.v,a.pan);G.shake(p,1,60);RR.shadowMap.needsUpdate=true;if(by&&by.human)hud.hit('BUILDING DESTROYED','#ffcf3f');}
 else if(o.kind==='tree'){fx.puff(new V3(o.x,o.y0+6,o.z),10,3,G.W.id==='snow'?[[.95,.97,1]]:[[.35,.5,.3]],1,2.6,2,{a:.6,grav:1});snd.play('wood',a.v,a.pan);}
 else if(o.kind==='fence'){fx.debris(p,8,5,MATC[o.mat==='metal'?'metal':'wood'],.3,{ground:gnd,dir,jit:3});snd.play('wood',a.v*.8,a.pan);}
 else{fx.debris(p,22,8,MATC[o.mat]||MATC.stone,.5,{ground:gnd,dir,jit:3});fx.puff(p,10,4,[[.7,.64,.56]],1.4,4,2.6,{a:.6,jit:1.5});snd.play('crash',a.v*.7,a.pan);}};
G.bump=(t,sp,o)=>{if(t.human&&G.time-(t.bumpT||0)>.6){t.bumpT=G.time;snd.play('dirt',.7);G.shakeV=Math.max(G.shakeV,Math.min(.35,sp*.03));}};
G.ram=(a,b,rel)=>{if(G.time-(a.ramT||0)<.6)return;a.ramT=G.time;const d=(rel-7)*a.H.mass*3.2;if(a.team!==b.team)G.damage(b,a,d,{p:b.p.clone().setY(b.p.y+1.2),face:'side',part:'hull',kind:'ram'});const p=new V3().lerpVectors(a.p,b.p,.5);p.y+=1;fx.spark(p,20,8,[[4,3,1.5]],.5,.4,{grav:10});snd.play('hit',audible(p).v);};
G.shake=(p,str,range)=>{const d=cam.position.distanceTo(p);if(d<range)G.shakeV=Math.max(G.shakeV,str*(1-d/range));};
function killTank(t,att){if(!t.alive)return;dropFlag(t);t.kill();t.stats.d++;t.respawnT=G.mode==='tdm'?5:6;t.burnT=7;t.killer=att;
 if(att&&att.team!==t.team){att.stats.k++;if(G.mode==='tdm')G.score[att.team]++;}
 const p=new V3(t.p.x,t.p.y+1.4,t.p.z);fx.explosion(p,2.6,{dust:G.dustCol,cols:[new THREE.Color(.15,.13,.12),new THREE.Color(.3,.28,.25)]});fx.shock(p,new THREE.Color(1.8,.9,.3),12,.7);fx.light(p,0xff8040,160,40);
 fx.debris(p,16,10,[new THREE.Color(.12,.11,.1),new THREE.Color(.25,.22,.2)],.4,{ground:(x,z)=>G.W.terrain.height(x,z)});fx.scorch(new V3(t.p.x,G.W.terrain.height(t.p.x,t.p.z),t.p.z),new V3(0,1,0),6);
 t.pop={y:t.d.turY,vy:8+R(5),x:0,z:t.d.turZ,vx:R(3)-1.5,vz:R(3)-1.5,rx:0,rz:0,wx:R(6)-3,wz:R(6)-3,wy:R(4)-2,done:false};
 const a=audible(p);snd.play('boom',a.v,a.pan);G.shake(p,1.4,50);
 feed(`${att?att.name:'?'}<em>✸</em>${t.name}`,att?att.team:t.team,t.human||(att&&att.human),true);
 if(att&&att.human&&t!==att){streak=G.time-streakT<5?streak+1:1;streakT=G.time;snd.play('kill');hud.hit(streak>=3?'TRIPLE KILL':streak===2?'DOUBLE KILL':'TANK DESTROYED','#ff4d00');if(streak>=2)msgFor(['','','DOUBLE KILL','TRIPLE KILL','QUAD KILL','UNSTOPPABLE'][Math.min(5,streak)],'#ffcf3f');}
 if(t.human){hud.dead(true,att);zoom=false;}}
G.spot=(team,e)=>{G.spotT[team].set(e.id,G.time);};
G.isSpotted=(team,e)=>G.time-(G.spotT[team].get(e.id)??-99)<1.2;
G.focusCount=(team,e)=>{let n=0;for(const t of G.tanks)if(t.team===team&&t.ai&&t.ai.target===e)n++;return n;};
function feed(html,team,me,raw){hud.feed(html,team,me,raw);}
function msgFor(txt,col){hud.msg(txt,col);}

/* ================= input ================= */
let camYaw=0,camPitch=.14,camDist=11,zoom=false,zoomLv=1,tabOn=false;const ZOOMS=[2.5,5,9];
const I=controls(canvas,{canLock:()=>app==='match',clickThrough:true,menu:()=>app==='match'||app==='paused',onLock:(on,was)=>{if(was&&!on&&app==='match')pause(true);},
 onDown:e=>{if(app==='paused'){pause(false);return true;}if(app!=='match')return true;if(e.button===2){toggleZoom();return true;}},
 look:e=>{if(app!=='match')return false;if(!I.locked&&!(e.buttons&1))return false;const z=zoom?ZOOMS[zoomLv]:1,s=[.0012,.0021,.0034][opt.sens]/Math.pow(z,.85);camYaw-=e.movementX*s;camPitch=cl(camPitch+e.movementY*s,-.55,.62);return false;},
 onWheel:e=>{if(app!=='match')return;if(zoom){zoomLv=cl(zoomLv+(e.deltaY<0?1:-1),-1,2);if(zoomLv<0){zoom=false;zoomLv=0;camDist=7;}hud.zoom(zoom,ZOOMS[zoomLv]);}else{camDist=cl(camDist+e.deltaY*.01,6,22);if(e.deltaY<0&&camDist<=6.01){zoom=true;zoomLv=0;hud.zoom(true,ZOOMS[0]);}}},
 onKey:e=>{if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&app!=='menu')e.preventDefault();
 if(e.code==='Escape'){if(app==='match')pause(true);else if(app==='paused')pause(false);}
 if(app==='match'&&(e.code==='ShiftLeft'||e.code==='ShiftRight')&&!e.repeat)toggleZoom();
 if(app==='match'&&e.code==='KeyM'){snd.on=!snd.on;msgFor(snd.on?'SOUND ON':'SOUND OFF','#fff');}}});
const {keys,edge,mouse}=I,{lock,unlock}=I;
for(const ev of['pointerdown','keydown'])addEventListener(ev,()=>{snd.init();snd.resume();},{capture:true});
function toggleZoom(){if(!G.player||!G.player.alive)return;zoom=!zoom;if(zoom)zoomLv=Math.max(0,Math.min(zoomLv,2));hud.zoom(zoom,ZOOMS[zoomLv]);snd.play('click');}
function pause(on){if(on&&app==='match'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');snd.mute();unlock();}else if(!on&&app==='paused'){app='match';$('pause').hidden=true;document.body.classList.add('playing');lock();}}
const padPrev={};
function readInput(dt){const P=G.player,c=P.ctrl;const k=n=>n.some(x=>keys[x]);
 let thr=(k(['KeyW','ArrowUp'])?1:0)-(k(['KeyS','ArrowDown'])?1:0),steer=(k(['KeyA','ArrowLeft'])?1:0)-(k(['KeyD','ArrowRight'])?1:0);let fire=mouse.l||keys.Space;
 const gp=gamepad();
 if(gp){const ax=gp.axes,bt=gp.buttons,dz=deadzone;if(dz(ax[1]||0))thr=-ax[1];if(dz(ax[0]||0))steer=-ax[0];const rx=dz(ax[2]||0),ry=dz(ax[3]||0);const z=zoom?ZOOMS[zoomLv]:1;camYaw-=rx*dt*2.4/z;camPitch=cl(camPitch+ry*dt*1.6/z,-.55,.62);
  if((bt[7]?.value||0)>.3)fire=true;const lt=(bt[6]?.value||0)>.4;if(lt!==!!padPrev.lt){if(lt!==zoom)toggleZoom();}padPrev.lt=lt;if(bt[5]?.pressed&&!padPrev.rb&&zoom){zoomLv=Math.min(2,zoomLv+1);hud.zoom(true,ZOOMS[zoomLv]);}if(bt[4]?.pressed&&!padPrev.lb&&zoom){zoomLv=Math.max(0,zoomLv-1);hud.zoom(true,ZOOMS[zoomLv]);}
  if(bt[9]?.pressed&&!padPrev.st)pause(true);tabOn=!!bt[8]?.pressed;padPrev.rb=bt[5]?.pressed;padPrev.lb=bt[4]?.pressed;padPrev.st=bt[9]?.pressed;}
 c.thr=thr;c.steer=steer;c.fire=fire&&phase==='play';}

/* ================= aim ray ================= */
const look=new V3(),aimP=new V3(),_p0=new V3(),_p1=new V3();
function aimRay(){const P=G.player;look.set(Math.sin(camYaw)*Math.cos(camPitch),-Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch));
 // start where the view ray passes the tank, so cover behind the camera is ignored
 const piv=P.pivot(_p1);const t0=Math.max(0,_p0.subVectors(piv,cam.position).dot(look));_p0.copy(cam.position).addScaledVector(look,zoom?0:t0*.85);_p1.copy(_p0).addScaledVector(look,700);
 let best=1;const tt=rayTerrain(G.W,_p0,_p1);if(tt>=0)best=tt;const o=rayObs(G.W,_p0,_p1,true);if(o&&o.t<best)best=o.t;const end=new V3().lerpVectors(_p0,_p1,best);const h=rayTanks(G.tanks,_p0,end,P);if(h)best*=h.t;
 aimP.lerpVectors(_p0,_p1,best);return aimP;}

/* ================= simulation ================= */
function fixed(dt){G.time+=dt;const P=G.player;
 for(const t of G.tanks){if(!t.alive){if(t.respawnT>0&&phase!=='end'){t.respawnT-=dt;if(t.respawnT<=0)respawn(t);}continue;}
  if(!t.human){if(t.frozen){t.ctrl.thr=t.ctrl.steer=0;t.ctrl.fire=false;}else botStep(G,t,dt);}if(phase==='countdown'){t.ctrl.thr=t.ctrl.steer=0;t.ctrl.fire=false;}}
 for(const t of G.tanks)t.step(dt,G.W,G.tanks,G);
 ball.update(dt);
 if(phase==='play'){if(G.flags)updateFlags(dt);if(G.cps)updateCPs(dt);updateDrops(dt);}
 // the player's own spotting
 if((spotTimer-=dt)<=0){spotTimer=.25;if(P.alive)for(const e of G.tanks)if(e.alive&&e.team!==P.team&&canSee(G,P,e))G.spot(P.team,e);for(const t of G.tanks)if(carrierOf(t))G.spot(1-t.team,t);}
 if((roleT-=dt)<=0){roleT=2.5;assignRoles();}
 if((navT-=dt)<=0&&G.W.navDirty){navT=1;G.W.navDirty=false;navGrid(G.W,G.nav);}}
function step(dt){dt=Math.min(dt,.1);
 if(app==='match'){readInput(dt);}I.flush();
 if(app==='paused'){visuals(0);return;}
 if(app==='over'){overT+=dt;visuals(dt);return;}
 if(app==='menu'){G.time+=dt;const t=G.player;if(t){t.ctrl.thr=t.ctrl.steer=0;t.ctrl.fire=false;t.ctrl.aim.set(t.p.x+Math.sin(G.time*.4)*30,t.p.y+3,t.p.z+Math.cos(G.time*.4)*30);t.step(dt,G.W,G.tanks,G);}visuals(dt);return;}
 // match
 if(phase==='countdown'){cdT-=dt;const n=Math.ceil(cdT);if(n!==lastBeep&&n>0&&n<=3){lastBeep=n;snd.play('beep',1);}if(cdT<=0){phase='play';snd.play('beep',2);hud.go();}}
 else if(phase==='play'){clock-=dt;if(clock<=0){clock=0;const w=G.score[0]>G.score[1]?0:G.score[1]>G.score[0]?1:-1;endMatch(w,'TIME UP · '+(G.score[0]|0)+' — '+(G.score[1]|0));}
  else if(G.score[0]>=goal)endMatch(0,`${TEAMC[0].n} REACHED ${goal} ${MODES[G.mode].unit}`);else if(G.score[1]>=goal)endMatch(1,`${TEAMC[1].n} REACHED ${goal} ${MODES[G.mode].unit}`);}
 else if(phase==='end'){endT+=dt;if(endT>3.2){timeScale=1;showOver();return;}}
 if(G.player.alive){if(G.aimOverride)G.player.ctrl.aim.copy(G.aimOverride);else G.player.ctrl.aim.copy(aimRay());}
 acc+=dt*timeScale;let n=0;while(acc>=DT&&n<8){fixed(DT);acc-=DT;n++;}if(n>=8)acc=0;
 visuals(dt);}

/* ================= visuals ================= */
const tv=new V3(),tv2=new V3();
function visuals(dt){const time=G.time;G.W.update(dt,cam);
 for(const t of G.tanks){t.sync(dt,time);const md=t.model;
  if(t.alive&&app!=='menu'){const sp=Math.abs(t.v);const f=t.fwd(tv);const lx=f.z,lz=-f.x;
   for(let s=0;s<2;s++){const sg=s?-1:1;const x=t.p.x-f.x*t.d.L*.38+lx*t.d.tx*sg,z=t.p.z-f.z*t.d.L*.38+lz*t.d.tx*sg;const y=G.W.terrain.height(x,z);
    fx.track(t.id+(s?'R':'L'),x,y,z,f.x,f.z,t.d.tw*.95,G.W.id==='snow'?.55:.42);
    if(sp>2&&Math.random()<sp*.035*dt*60){const c=G.dustCol[R(G.dustCol.length)|0];fx.smk.emit(x+R(1)-.5,y+.3,z+R(1)-.5,-f.x*sp*.15+R(1)-.5,.6+R(.8),-f.z*sp*.15+R(1)-.5,c[0],c[1],c[2],.42,.8,2.6+sp*.12,1.2+R(.8),-.2,1.2);}}
   // exhaust
   if(Math.random()<(.15+Math.abs(t.ctrl.thr)*.25)*dt*30){const ex=t.p.x-f.x*(t.d.L/2+.2),ez=t.p.z-f.z*(t.d.L/2+.2);fx.smk.emit(ex,t.p.y+t.d.y1-.2,ez,-f.x*1.5,.8,-f.z*1.5,.22,.21,.2,.28,.3,1.2,.9,-.4,1);}
   // damage smoke & fire
   const hf=t.hp/t.max;if(hf<.4&&Math.random()<(1-hf)*dt*20){const ex=t.p.x-f.x*t.d.L*.25,ez=t.p.z-f.z*t.d.L*.25;fx.smk.emit(ex,t.p.y+t.d.y1+.2,ez,R(.6)-.3,2+R(1.5),R(.6)-.3,.1,.09,.09,.6,.6,3,2.2,-.5,.6);
    if(hf<.18&&Math.random()<.6)fx.glow.emit(ex,t.p.y+t.d.y1+.3,ez,R(.6)-.3,1.5+R(1),R(.6)-.3,4,1.6,.4,1,.9,.3,.5,-.5,1);}}
  else if(!t.alive&&t.wreck){fx.trackBreak(t.id+'L');fx.trackBreak(t.id+'R');
   if(t.pop&&!t.pop.done){const p=t.pop;p.vy-=22*dt;p.y+=p.vy*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.rx+=p.wx*dt;p.rz+=p.wz*dt;if(p.y<.6&&p.vy<0){p.y=.6;p.done=true;}md.tur.position.set(p.x,p.y,p.z);md.tur.rotation.set(p.rx,md.tur.rotation.y+p.wy*dt,p.rz);}
   if(t.burnT>0){t.burnT-=dt;if(Math.random()<dt*40)fx.glow.emit(t.p.x+R(2)-1,t.p.y+t.d.y1+.2,t.p.z+R(2)-1,R(.6)-.3,2+R(2),R(.6)-.3,4,1.7,.5,1,1.4,.4,.6,-1,1);}
   if(Math.random()<dt*14)fx.smk.emit(t.p.x+R(1)-.5,t.p.y+t.d.y1+.4,t.p.z+R(1)-.5,R(.4)-.2+.3,2.4+R(1),R(.4)-.2,.08,.08,.08,.65,1,5,3.5,-.4,.5);}}
 // carried flags follow the carrier
 if(G.flags)for(const f of G.flags){const y=f.state==='carried'?f.carrier.p.y+f.carrier.d.y1+1.2:G.W.terrain.height(f.x,f.z);f.gr.position.set(f.x,f.state==='carried'?y-2:y,f.z);waveCloth(f.cg,time+f.team,f.state==='carried'?1.4:1);f.gr.children[2].visible=f.state!=='carried';}
 if(G.cps)for(const c of G.cps){const col=c.owner===0?TEAMC[0].css:c.owner===1?TEAMC[1].css:'#dddddd';c.ring.material.color.set(col).multiplyScalar(1.6);c.fill.material.color.set(col);c.cloth.material.color.set(col);c.cloth.material.emissive.set(col);c.bc.material.color.set(col).multiplyScalar(.5);
  const h=Math.abs(c.prog);c.cloth.position.y=1.2+h*5;waveCloth(c.cg,time+c.x,1);c.fill.material.opacity=.06+(c.cnt[0]&&c.cnt[1]?.08+Math.sin(time*8)*.05:0);}
 const P=G.player;fx.update(dt,cam,innerHeight*Math.min(devicePixelRatio,1.5)/(2*Math.tan(cam.fov*Math.PI/360)));
 cameras(dt);
 if(app==='match'||app==='paused'){const pr=P.alive?ball.predict(P):null;hud.update(dt,{phase,cdT,clock,goal,zoom,zoomLv:ZOOMS[zoomLv],pred:pr,tab:tabOn||keys.Tab,camYaw,cam,locked:I.locked});}
 if(snd.ac&&app==='match'&&P.alive)snd.engine(P.v,P.H.speed,P.ctrl.thr||P.ctrl.steer,P.travV||0,true);else if(snd.ac)snd.mute();}

/* ================= camera ================= */
let menuA=0;const want=new V3();
function cameras(dt){const P=G.player;
 if(app==='menu'){menuA+=dt*.1;const p=P.p;const asp=innerWidth/innerHeight;cam.fov=36;const r=15+(asp<1.4?6:0);want.set(p.x+Math.cos(menuA)*r,p.y+4.2+Math.sin(menuA*.7)*.5,p.z+Math.sin(menuA)*r);cam.position.copy(want);
  // frame the tank between the menu (left) and the garage card (right)
  const rx=-Math.sin(menuA),rz=Math.cos(menuA),off=innerWidth>1000?1.3:0;cam.lookAt(p.x+rx*off,p.y+.9,p.z+rz*off);cam.updateProjectionMatrix();return;}
 if(app==='over'){const a=overT*.18+1,p=P.p;cam.fov=46;cam.position.set(p.x+Math.cos(a)*16,p.y+6,p.z+Math.sin(a)*16);const gy=G.W.terrain.height(cam.position.x,cam.position.z)+2;if(cam.position.y<gy)cam.position.y=gy;cam.lookAt(p.x,p.y+1,p.z);cam.updateProjectionMatrix();return;}
 let fov=62;
 if(!P.alive){// death cam: orbit the wreck
  const a=G.time*.25,p=P.p;want.set(p.x+Math.cos(a)*16,p.y+7,p.z+Math.sin(a)*16);cam.position.lerp(want,1-Math.exp(-dt*3));const gy=G.W.terrain.height(cam.position.x,cam.position.z)+2;if(cam.position.y<gy)cam.position.y=gy;cam.lookAt(p.x,p.y+1,p.z);}
 else{look.set(Math.sin(camYaw)*Math.cos(camPitch),-Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch));
  if(zoom){const pv=P.pivot(want);pv.y+=.9;cam.position.copy(pv).addScaledVector(look,1.2);fov=62/ZOOMS[zoomLv];P.model.root.visible=false;}
  else{P.model.root.visible=true;const pv=tv.set(P.p.x,P.p.y+P.d.y1+1.9+camDist*.08,P.p.z);want.copy(pv).addScaledVector(look,-camDist);want.y+=.4;
   // keep the camera out of walls and the ground
   const h=rayObs(G.W,pv,want,true,.3);if(h)want.lerpVectors(pv,want,Math.max(.15,h.t-.05));const gy=G.W.terrain.height(want.x,want.z)+.8;if(want.y<gy)want.y=gy;
   cam.position.lerp(want,1-Math.exp(-dt*25));}
  tv2.copy(cam.position).add(look);cam.lookAt(tv2);}
 G.shakeV=Math.max(0,G.shakeV-dt*1.8);if(G.shakeV>0){const s=G.shakeV*G.shakeV*.5;cam.position.x+=(R()-.5)*s;cam.position.y+=(R()-.5)*s;cam.position.z+=(R()-.5)*s;}
 cam.fov+=(fov-cam.fov)*Math.min(1,dt*14);cam.updateProjectionMatrix();}

/* ================= rendering ================= */
function applyQuality(q){gfx=q;sun.castShadow=q>0;const ms=q>=2?2048:1024;if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}sun.shadow.mapSize.set(ms,ms);RR.setPixelRatio(q===0?1:Math.min(devicePixelRatio,1.5));post=null;lastW=0;}
bindQualityKey(()=>gfx,q=>applyQuality(q));
let lastW=0,lastH=0;
function render(){const w=innerWidth,h=innerHeight;if(w!==lastW||h!==lastH){RR.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();lastW=w;lastH=h;if(post)post.setSize(w,h);}
 const P=G.player;const f=P?P.p:new V3();sun.position.set(f.x+G.sunDir.x*200,f.y+G.sunDir.y*200,f.z+G.sunDir.z*200);sun.target.position.copy(f);sun.target.updateMatrixWorld();
 if(!post){post=cinematic(RR,scene,cam,{...POST,quality:gfx});post.setSize(w,h);}post.render();}
addEventListener('resize',()=>{lastW=0;});

/* ================= garage UI ================= */
let gSel={type:'hull',id:garage.hull};
function renderGarage(){$('credits').textContent=garage.credits.toLocaleString();
 const tile=(it,type)=>{const own=garage.own[it.id],eq=(type==='hull'?garage.hull:garage.turret)===it.id,sel=gSel.id===it.id,lv=garage.lv[it.id]||0;return`<button data-t="${type}" data-id="${it.id}" class="${eq?'eq':''} ${sel?'sel':''} ${own?'':'lock'}">${it.n}<small>${it.cls}</small>${own&&lv?`<span class="lv">MK ${['I','II','III','IV','V'][lv]}</span>`:''}</button>`;};
 $('g-hull').innerHTML=HULLS.map(h=>tile(h,'hull')).join('');$('g-tur').innerHTML=TURRETS.map(t=>tile(t,'tur')).join('');
 const it=(gSel.type==='hull'?HULLS:TURRETS).find(x=>x.id===gSel.id),own=garage.own[it.id],lv=garage.lv[it.id]||0;
 const bar=(n,v,mx,nv,txt)=>`<div class="bar">${n}<i><b style="width:${Math.min(100,v/mx*100)}%"></b>${nv>v?`<u style="left:${Math.min(100,v/mx*100)}%;width:${Math.min(100,(nv-v)/mx*100)}%"></u>`:''}</i><em>${txt}</em></div>`;
 let bars='';if(gSel.type==='hull'){const s=hs(it,lv),n=hs(it,Math.min(MAXLV,lv+1));bars=bar('ARMOUR',s.hp,420,n.hp,s.hp+' HP')+bar('SPEED',s.speed,22,n.speed,Math.round(s.speed*3.6)+' KM/H')+bar('AGILITY',s.turn,2.3,n.turn,Math.round(s.turn*57)+'°/S')+bar('PLATING',s.armor+.05,.45,n.armor+.05,Math.round(s.armor*100)+'%');}
 else{const s=ts(it,lv),n=ts(it,Math.min(MAXLV,lv+1));const dps=t=>t.dmg*t.mag/((t.mag-1)*t.rof+t.reload+(t.charge||0));bars=bar('DAMAGE',s.dmg,110,n.dmg,Math.round(s.dmg)+(s.mag>1?' ×'+s.mag:''))+bar('FIREPOWER',dps(s),36,dps(n),dps(s).toFixed(1)+' DPS')+bar('RELOAD',6-s.reload,5,6-n.reload,s.reload.toFixed(1)+' S')+bar('TRAVERSE',s.trav,2.4,n.trav,Math.round(s.trav*57)+'°/S')+bar('ACCURACY',.03-s.disp,.03,.03-n.disp,s.speed?Math.round(s.speed*3.6)+' KM/H':'INSTANT');}
 const eq=(gSel.type==='hull'?garage.hull:garage.turret)===it.id,cost=UPCOST(lv);
 $('g-info').innerHTML=`<div class="t"><b>${it.n}${own?` · MK ${['I','II','III','IV','V'][lv]}`:''}</b><span>${it.cls}</span></div><p>${it.d}</p>${bars}<div class="act">${own?(eq?'<button class="up" disabled>EQUIPPED</button>':'<button class="up" data-a="eq">EQUIP</button>')+(lv<MAXLV?`<button class="buy" data-a="up" ${garage.credits<cost?'disabled':''}>UPGRADE ◆ ${cost}</button>`:'<button class="up" disabled>MAX LEVEL</button>'):`<button class="buy" data-a="buy" ${garage.credits<it.cost?'disabled':''}>UNLOCK ◆ ${it.cost.toLocaleString()}</button>`}</div>`;
 $('g-paint').innerHTML=PAINTS.map(p=>`<button data-p="${p.id}" class="${garage.paint===p.id?'on':''}" title="${p.n}" style="background:linear-gradient(135deg,${p.c[0]} 50%,${p.c[1]} 50%)"></button>`).join('');}
const hs=(h,lv)=>({hp:Math.round(h.hp*(1+.08*lv)),speed:h.speed*(1+.03*lv),turn:h.turn*(1+.03*lv),armor:Math.min(.4,h.armor+.02*lv)});
const ts=(t,lv)=>({...t,dmg:t.dmg*(1+.07*lv),reload:t.reload*(1-.05*lv),trav:t.trav*(1+.06*lv)});
function refreshShowcase(){if(app!=='menu')return;const old=G.player;const lo={hull:garage.hull,turret:garage.turret,paint:garage.paint,hl:garage.lv[garage.hull]||0,tl:garage.lv[garage.turret]||0};old.setLoadout(lo);scene.add(old.model.root);const sp=showSpot();old.spawn(sp.x,sp.z,sp.yaw,G.W);old.prot=0;}
$('garage').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;snd.init();snd.play('click');
 if(b.dataset.id){gSel={type:b.dataset.t==='hull'?'hull':'tur',id:b.dataset.id};if(garage.own[b.dataset.id]){if(gSel.type==='hull')garage.hull=b.dataset.id;else garage.turret=b.dataset.id;saveGarage();refreshShowcase();}}
 else if(b.dataset.a==='eq'){if(gSel.type==='hull')garage.hull=gSel.id;else garage.turret=gSel.id;saveGarage();refreshShowcase();}
 else if(b.dataset.a==='buy'){const it=(gSel.type==='hull'?HULLS:TURRETS).find(x=>x.id===gSel.id);if(garage.credits>=it.cost){garage.credits-=it.cost;garage.own[it.id]=1;if(gSel.type==='hull')garage.hull=it.id;else garage.turret=it.id;saveGarage();snd.play('cap');refreshShowcase();}}
 else if(b.dataset.a==='up'){const lv=garage.lv[gSel.id]||0,c=UPCOST(lv);if(garage.credits>=c&&lv<MAXLV){garage.credits-=c;garage.lv[gSel.id]=lv+1;saveGarage();snd.play('pickup');refreshShowcase();}}
 else if(b.dataset.p){garage.paint=b.dataset.p;saveGarage();refreshShowcase();}
 renderGarage();});

/* ================= menu wiring ================= */
const pick=pickers(opt,saveOpt),seg=(id,key,num,cb)=>pick(id,key,num,v=>{snd.init();snd.play('click');cb&&cb(v);});
seg('o-mode','mode',false);seg('o-diff','diff',true);seg('o-time','time',true);seg('o-sens','sens',true);
seg('o-map','map',false,v=>{if(app==='menu'&&G.W&&G.W.id!==v){loadMap(v);toMenu();}});
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
postButton($('post'),'ironclad',()=>{const a=lastAward||{};
 return[a.pts||0,`Game: Ironclad\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'} ${a.score||''}\nKills: ${a.k||0} · Deaths: ${a.d||0} · Damage: ${a.dmg||0}\nMode: ${a.mode||''} · Map: ${a.map||''} · CPU ${a.diff||''}\nTank: ${a.tank||''}`];});

/* ================= loop ================= */
loadMap(opt.map);toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.IRONCLAD={get state(){return app==='match'?phase:app;},get app(){return app;},get phase(){return phase;},step,render,start,toMenu,pause,
 get tanks(){return G.tanks;},get player(){return G.player;},get score(){return G.score;},get clock(){return clock;},setClock(s){clock=s;},get goal(){return goal;},
 get world(){return G.W;},G,garage,saveGarage,renderGarage,get result(){return result;},get lastAward(){return lastAward;},
 skipCountdown(){cdT=0;},setScore(team,n){G.score[team]=n;},kill(t,by){G.damage(t,by||null,t.hp+1,{p:t.p.clone().setY(t.p.y+1),face:'side',part:'hull',kind:'test'});},
 aim(x,y,z){if(x==null){G.aimOverride=null;return;}camYaw=Math.atan2(x-G.player.p.x,z-G.player.p.z);G.aimOverride=(G.aimOverride||new V3()).set(x,y,z);G.player.ctrl.aim.set(x,y,z);},setCam(yaw,pitch,dist){camYaw=yaw;if(pitch!=null)camPitch=pitch;if(dist!=null)camDist=dist;},
 setZoom(on,lv=1){zoom=on;zoomLv=lv;hud.zoom(on,ZOOMS[lv]);},keys,setMouse(on){mouse.l=on;},setQuality:applyQuality,spawnDrop,get drops(){return G.drops;},get flags(){return G.flags;},get cps(){return G.cps;},
 freeze(team,on=true){G.tanks.forEach(t=>{if(t.team===team&&!t.human)t.frozen=on;});},scene,cam,RR,fx,ball,MODES,DIFF};
