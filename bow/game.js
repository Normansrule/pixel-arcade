// LONGBOW KEEP — first-person medieval archery capture-the-flag, 5v5 against CPU soldiers. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {V,C,TEAMS,makeTextures,Particles} from './gfx.js';
import {MAPS,buildMap} from './maps.js';
import {EYE,PR} from './world.js';
import {Rig,Viewmodel,makeArrowMeshes,makeFlag,potMesh,buildGeos} from './actors.js';
import {DIFF,initBot,think,solveAim} from './ai.js';
import {bannerTex} from './gfx.js';
import {Sound} from './sound.js';
import {HUD,mmss} from './hud.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,toast} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=Math.random,TAU=Math.PI*2;
export const WPN={long:{n:'LONGBOW',draw:1.0,spd:[26,72],dmg:[20,70],head:2.2,g:13,ammo:16,zoom:.7,sway:1},
 short:{n:'SHORTBOW',draw:.48,spd:[24,56],dmg:[15,40],head:2.6,g:13,ammo:24,zoom:.84,sway:.65},
 cross:{n:'CROSSBOW',reload:1.7,spd:[95,95],dmg:[85,85],head:1.9,g:6,ammo:10,zoom:.62,sway:.3}};
const SWORD={dmg:36,reach:2.75,time:.5,hitAt:.3};
const BOMB={speed:21,g:17,radius:5.4,dmg:95,count:2};
const BUILD={planks:8,cap:10,wall:{cost:2,hp:110},ramp:{cost:3,hp:150},limit:30};
const MOVE={walk:5.7,sprint:8.2,draw:.55,block:.6,carry:.92,jump:7.3,climb:3.8,water:.55};
const RESPAWN=5,FLAG_RETURN=20,CAPS=3;
const NAMES=['ALDRIC','BRANWEN','CEDRIC','DAGNY','EDMUND','FENWICK','GWYN','HALVARD','ISOBEL','JOCELYN','KENRIC','LIESEL','MERRICK','NESSA','OSWIN','PERRIN','QUILLA','ROWAN','SIGRID','TAMSIN','ULRIC','VESNA','WYNN','YSOLDE'];

/* ================= renderer + scenes ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(70,1,.05,1400);cam.rotation.order='YXZ';
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(60,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xffffff,0x3a3020,1.2),vmKey=new THREE.DirectionalLight(0xfff2e0,1.8);vmKey.position.set(-1,2,1.2);vmScene.add(vmHemi,vmKey);
const sun=new THREE.DirectionalLight(0xffffff,2.5);sun.castShadow=true;sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;scene.add(sun,sun.target);
const hemi=new THREE.HemisphereLight(0xffffff,0x444444,1);scene.add(hemi);
const boomLight=new THREE.PointLight(0xffa040,0,26,1.6);scene.add(boomLight);
const T=makeTextures();
const parts=new Particles(scene,3000,true),dust=new Particles(scene,2600,false,T.puff),snow=new Particles(scene,1400,false);snow.U.uNear.value=2.5;
const arrowsM=makeArrowMeshes(scene);const BG=buildGeos();
const woodMat=new THREE.MeshStandardMaterial({map:T.wood,normalMap:T.woodN,vertexColors:true,roughness:.85,color:0xd8b080});
const ghostMat=new THREE.MeshBasicMaterial({color:0x60ff90,transparent:true,opacity:.22,depthWrite:false});
const ghost={wall:new THREE.Mesh(BG.wall,ghostMat),ramp:new THREE.Mesh(BG.ramp,ghostMat)};for(const k in ghost){ghost[k].visible=false;scene.add(ghost[k]);}
const snd=new Sound();

/* ================= state ================= */
const G={app:'menu',phase:'count',opt:{map:0,load:'long',diff:1,time:8,sens:1,vol:.8,fov:95},diff:DIFF[1],players:[],me:null,flags:[],caps:[0,0],clock:480,time:0,countT:3,liveT:0,endT:0,
 arrows:[],stuck:[],bombs:[],dyn:[],homes:[],spots:[{def:[],mid:[]},{def:[],mid:[]}],W:null,nav:null,attract:true,idleTeam:-1,timeScale:1,boardOn:false,buildType:'wall',buildRot:0,
 WPN,BOMB,BUILD,winner:-1,god:false,stuckI:0,bombArc:null,shake:0};
const saveOpt=stored('pxd_longbowkeep_opt',G.opt);
const hud=new HUD(G);let MAP=null,mapIdx=-1,VM=null,flagU={value:0};
G.dynNear=(p,r)=>{for(const b of G.dyn){if(b.dead)continue;const dx=Math.max(b.x0-p.x,0,p.x-b.x1),dz=Math.max(b.z0-p.z,0,p.z-b.z1);if(Math.hypot(dx,dz)<r)return b;}return null;};

/* ================= map loading ================= */
function loadMap(i){if(mapIdx===i&&MAP){clearDynamic();return;}
 if(MAP){scene.remove(MAP.group);MAP.group.traverse(o=>{if(o.geometry)o.geometry.dispose();});for(const f of G.flags)scene.remove(f.mesh);}
 MAP=buildMap(i,R,T);mapIdx=i;const d=MAP.def;G.W=MAP.W;G.nav=MAP.nav;G.homes=MAP.homes;scene.add(MAP.group);
 scene.environment=MAP.env;scene.fog=new THREE.Fog(d.fog[0],d.fog[1],d.fog[2]);scene.background=new C(d.fog[0]);
 sun.color.set(d.sun[0]);sun.intensity=d.sun[1];hemi.color.set(d.hemi[0]);hemi.groundColor.set(d.hemi[1]);hemi.intensity=d.hemi[2];vmHemi.color.set(d.hemi[0]);vmScene.environment=MAP.env;
 G.flags=[0,1].map(t=>{const m=makeFlag(t,flagU,bannerTex(t));scene.add(m);return{team:t,state:'home',home:MAP.homes[t].clone(),pos:MAP.homes[t].clone(),carrier:null,dropT:0,mesh:m};});
 // defend + midfield spots for the CPU
 for(const t of[0,1]){const c=MAP.castles[t],P=c.pt;const S=(u,y,v)=>{const p=P(u,y,v);return new V(p[0],p[1],p[2]);};
  G.spots[t].def=[S(-4,0,1),S(4,0,1),S(0,0,5),S(-3,7.6,14.4),S(3,7.6,14.4),S(-16.5,10.5,12.5),S(16.5,10.5,12.5),S(0,10,-9),S(-16.8,7,0),S(16.8,7,2),S(-9,0,8),S(9,0,8)];
  const f=t===0?1:-1;const mids=MAP.nav.nodes.filter(n=>n.tag==='g'&&n.c===MAP.nav.nearest(G.homes[0].x,G.homes[0].y,G.homes[0].z).c&&n.z*f>-34&&n.z*f<4&&Math.abs(n.x)<40);G.spots[t].mid=[];for(let k=0;k<14&&mids.length;k++)G.spots[t].mid.push(mids[(rnd()*mids.length)|0]);}
 // crossing lanes (left / centre / right) so attacks spread out
 const hc=MAP.nav.nearest(G.homes[0].x,G.homes[0].y,G.homes[0].z).c;G.navC=hc;const mid=MAP.nav.nodes.filter(n=>n.tag==='g'&&n.c===hc&&Math.abs(n.z)<7&&n.e.length>2);G.lanes=[];for(const[a,b]of[[-60,-14],[-6,6],[14,60]]){const L=mid.filter(n=>n.x>a&&n.x<b);if(L.length){L.sort((p,q)=>Math.abs(p.z)-Math.abs(q.z));G.lanes.push(L[(L.length*.25)|0]);}}
 fxStack=null;R.shadowMap.needsUpdate=true;}
function clearDynamic(){for(const b of G.dyn){G.W.removeBlock(b);scene.remove(b.mesh);}G.dyn.length=0;for(const a of G.bombs)scene.remove(a.mesh);G.bombs.length=0;G.arrows.length=0;
 const Z=new THREE.Matrix4().makeScale(0,0,0);for(let i=0;i<arrowsM.stuck.count;i++)arrowsM.stuck.setMatrixAt(i,Z);arrowsM.stuck.instanceMatrix.needsUpdate=true;G.stuck.length=0;G.stuckI=0;parts.clear();dust.clear();}

/* ================= players ================= */
function newPlayer(team,name,bot,loadout){const p={id:G.players.length,team,name,bot,loadout,nextLoadout:loadout,pos:new V(),vel:new V(),yaw:0,pitch:0,onGround:false,ladder:null,ground:0,
 alive:false,hp:100,respawnT:0,spawnProt:0,lastHurt:-99,weapon:'bow',prevWeapon:'sword',ammo:WPN[loadout].ammo,bombs:BOMB.count,planks:BUILD.planks,draw:0,drawing:false,holdT:0,loaded:true,reload:0,
 swing:0,block:false,throwT:0,bombAim:false,stun:0,swapT:0,carrying:null,inp:{f:0,s:0,jump:false,sprint:false,yaw:0,pitch:0,fire:false,alt:false,slot:null},prevFire:false,
 stats:{kills:0,deaths:0,caps:0,returns:0,score:0,heads:0,shots:0,hits:0,dmg:0},killer:null,killHow:'',stepT:0,supplyCD:0,wobY:0,wobP:0,aimADS:false,camY:0,dip:0};
 p.rig=new Rig(team,G.players.length*7+team);scene.add(p.rig.root);G.players.push(p);return p;}
function clearPlayers(){for(const p of G.players)scene.remove(p.rig.root);G.players=[];G.me=null;}
function setupPlayers(attract){clearPlayers();const names=NAMES.slice().sort(()=>rnd()-.5);const pickLoad=()=>{const r=rnd();return r<.42?'long':r<.75?'short':'cross';};
 if(!attract)G.me=newPlayer(0,'YOU',false,G.opt.load);
 const roles=[['attack','defend','attack','mid','attack'],['attack','defend','attack','mid','attack']];
 for(const t of[0,1]){let k=0;while(G.players.filter(p=>p.team===t).length<5){const b=newPlayer(t,names.pop(),true,pickLoad());initBot(b,roles[t][k++%5]);}}
 for(const p of G.players)spawnPlayer(p,true);}
function chooseSpawn(team,first){const L=MAP.spawns[team];let best=null,bs=-1e9;for(const s of L){let m=1e9;for(const q of G.players)if(q.alive){const d=Math.hypot(q.pos.x-s.x,q.pos.z-s.z);m=Math.min(m,q.team===team?d*2+(first?0:6):d);}const sc=Math.min(m,30)+rnd()*6;if(sc>bs){bs=sc;best=s;}}return best;}
function spawnPlayer(p,first){const s=chooseSpawn(p.team,first);p.pos.set(s.x+(rnd()-.5)*.6,s.y+.05,s.z+(rnd()-.5)*.6);p.vel.set(0,0,0);p.yaw=s.yaw+(rnd()-.5)*.3;p.pitch=0;p.inp.yaw=p.yaw;p.inp.pitch=0;
 p.alive=true;p.hp=100;p.loadout=p.nextLoadout;p.ammo=WPN[p.loadout].ammo;p.loaded=true;p.reload=0;p.bombs=BOMB.count;p.planks=BUILD.planks;p.weapon='bow';p.draw=0;p.drawing=false;p.holdT=0;p.swing=0;p.block=false;p.bombAim=false;p.throwT=0;p.stun=0;
 p.spawnProt=first?0:2;p.onGround=false;p.ladder=null;p.carrying=null;p.lastHurt=-99;p.killer=null;p.camY=p.pos.y;p.rig.setWeapon('bow',p.loadout);p.rig.deadT=0;p.rig.root.visible=p!==G.me;
 if(p.bot&&p.ai){p.ai.path=null;p.ai.target=null;p.ai.goal=null;p.ai.spot=null;p.ai.chop=null;const r=rnd(),n=G.lanes.length;p.ai.lane=n?G.lanes[n===3?(r<.36?1:r<.68?0:2):(r*n|0)]:null;}if(p===G.me&&!first){snd.play('spawn');}}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);
 G.attract=false;G.app='play';G.diff=DIFF[G.opt.diff];loadMap(G.opt.map);clearDynamic();resetFlags();G.caps=[0,0];G.clock=G.opt.time*60;G.time=0;G.phase='count';G.countT=3;G.liveT=0;G.endT=0;G.timeScale=1;G.winner=-1;G.idleTeam=-1;
 setupPlayers(false);if(!VM||VM.team!==0){if(VM)vmCam.remove(VM.root);VM=new Viewmodel(0);vmCam.add(VM.root);}
 hud.show(true);hud.clear();['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.add('playing');lastBeep=4;
 hud.banner(MAPS[G.opt.map].name,'CAPTURE THE CRIMSON FLAG · FIRST TO '+CAPS,'#ffd04a',2.8);lock();}
function resetFlags(){for(const f of G.flags){f.state='home';f.pos.copy(f.home);f.carrier=null;f.dropT=0;}}
function attract(){G.attract=true;G.app='menu';G.diff=DIFF[1];loadMap(G.opt.map);clearDynamic();resetFlags();G.caps=[0,0];G.clock=600;G.phase='live';G.liveT=5;G.time=0;G.timeScale=1;G.idleTeam=-1;setupPlayers(true);updateBest();}
function toMenu(){unlock();G.app='menu';['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing');hud.show(false);G.boardOn=false;attract();}
function endMatch(reason){if(G.phase==='end')return;const k=t=>G.players.filter(p=>p.team===t).reduce((s,p)=>s+p.stats.kills,0);
 G.winner=G.caps[0]>G.caps[1]?0:G.caps[1]>G.caps[0]?1:k(0)>k(1)?0:k(1)>k(0)?1:-1;G.endReason=reason;G.phase='end';G.endT=0;
 if(G.attract)return;const me=G.me,won=G.winner===me.team;
 hud.banner(G.winner<0?'STALEMATE':won?'VICTORY':'DEFEAT',reason==='caps'?'THREE CAPTURES':G.caps[0]===G.caps[1]?'TIME · DECIDED ON KILLS':'TIME UP',G.winner<0?'#ddd':won?'#ffd04a':'#ff5a3a',3);snd.play(won?'win':'lost');snd.play('horn');}
function showOver(){G.app='over';unlock();hud.show(false);G.boardOn=false;document.body.classList.remove('playing');const me=G.me,won=G.winner===me.team,draw=G.winner<0;
 $('oeye').textContent=MAPS[G.opt.map].name+' · CPU '+G.diff.n+' · '+mmss(G.opt.time*60-G.clock)+(G.endReason==='caps'?' · CAPTURE LIMIT':' · CLOCK');
 $('ores').textContent=draw?'STALEMATE':won?'VICTORY':'DEFEAT';$('ores').style.color=draw?'#ddd':won?'#ffd04a':'#ff5a3a';
 const k=t=>G.players.filter(p=>p.team===t).reduce((s,p)=>s+p.stats.kills,0);
 $('ofs').innerHTML=`<span class="b">${G.caps[0]}</span> — <span class="r">${G.caps[1]}</span><small>KILLS ${k(0)} — ${k(1)}</small>`;
 const ranked=G.players.slice().sort((a,b)=>b.stats.score-a.stats.score);const mvp=ranked[0];
 $('ostats').innerHTML=[0,1].map(t=>`<table class="t${t}"><tr><th>${TEAMS[t].n}</th><th>K</th><th>D</th><th>HS</th><th>CAP</th><th>RET</th><th>SCORE</th></tr>`+ranked.filter(p=>p.team===t).map(p=>`<tr class="${p===me?'me':''}"><td>${p.name}${p===mvp?'<span class="mvp">MVP</span>':''}</td><td>${p.stats.kills}</td><td>${p.stats.deaths}</td><td>${p.stats.heads}</td><td>${p.stats.caps}</td><td>${p.stats.returns}</td><td>${p.stats.score}</td></tr>`).join('')+'</table>').join('');
 const tok=award(won,draw);$('otok').textContent=`+${tok} TOKENS · ${lastAward.pts} PTS · BEST ${best()} PTS`;$('over').hidden=false;overT=0;}
let lastAward=null,overT=0;
function award(won,draw){const me=G.me;const pts=me.stats.score+(won?300:draw?100:0);const acc=me.stats.shots?Math.round(me.stats.hits/me.stats.shots*100):0;
 lastAward={pts,won,draw,caps:me.stats.caps,kills:me.stats.kills,deaths:me.stats.deaths,heads:me.stats.heads,acc,score:`${G.caps[0]}-${G.caps[1]}`,map:MAPS[G.opt.map].name,diff:G.diff.n,load:WPN[G.opt.load].n};
 const tok=5+Math.min(60,pts/80|0);addRound(tok,won);saveBest('longbowkeep',pts);return tok;}
function best(){return bestScore('longbowkeep');}
function updateBest(){const b=best();$('best').textContent=b?'BEST · '+b.toLocaleString()+' PTS':'';}

/* ================= flags ================= */
const isMe=p=>p&&p===G.me&&!G.attract;
function rel(team,mine,theirs){return G.me&&G.me.team===team?mine:theirs;}
function takeFlag(p,f){f.state='carried';f.carrier=p;p.carrying=f;p.stats.score+=100;p.spawnProt=0;snd.play('horn');
 if(!G.attract){hud.feed(p.name,p.team,'⚑ TOOK THE '+TEAMS[f.team].n+' FLAG');if(f.team===G.me.team)hud.banner('FLAG TAKEN',p.name+' HAS YOUR BANNER · STOP THEM','#ff5a3a',2.4);else hud.banner(isMe(p)?'YOU HAVE THE FLAG':'FLAG TAKEN',isMe(p)?'RUN IT HOME':p.name+' HAS THE '+TEAMS[f.team].n+' FLAG · ESCORT','#ffd04a',2.4);}}
function dropFlag(p){const f=p.carrying;if(!f)return;p.carrying=null;f.carrier=null;const W=G.W;const y=W.groundAt(p.pos.x,p.pos.z,p.pos.y+1.2,.2);
 if(y<W.voidY+2||p.pos.y<W.voidY||W.waterAt(p.pos.x,p.pos.z)-y>1.3){returnFlag(f,null);return;}
 f.state='dropped';f.pos.set(p.pos.x,y,p.pos.z);f.dropT=FLAG_RETURN;if(!G.attract)hud.feed('',0,TEAMS[f.team].n+' FLAG DROPPED','',0);}
function returnFlag(f,p){f.state='home';f.pos.copy(f.home);f.carrier=null;f.dropT=0;if(p){p.stats.returns++;p.stats.score+=150;}snd.play('return');
 if(!G.attract){if(p)hud.feed(p.name,p.team,'⚑ RETURNED THEIR FLAG');else hud.feed('',0,TEAMS[f.team].n+' FLAG RETURNED','',0);if(f.team===G.me.team)hud.msg('YOUR FLAG IS BACK HOME',2);}}
function capture(p){const f=p.carrying;p.carrying=null;f.state='home';f.pos.copy(f.home);f.carrier=null;G.caps[p.team]++;p.stats.caps++;p.stats.score+=500;snd.play('fanfare');
 const pos=G.homes[p.team];parts.burst(new V(pos.x,pos.y+1.5,pos.z),160,14,[TEAMS[p.team].glow,new C(2,1.7,.8)],.5,1.6,{up:true,grav:6,drag:1});boomLight.position.set(pos.x,pos.y+3,pos.z);boomLight.color.set(0xffd080);boomLight.intensity=60;
 if(!G.attract){hud.feed(p.name,p.team,'★ CAPTURED THE '+TEAMS[f.team].n+' FLAG');hud.banner(p.team===G.me.team?'CAPTURE!':'ENEMY CAPTURE',`${TEAMS[0].n} ${G.caps[0]} — ${G.caps[1]} ${TEAMS[1].n}`,p.team===G.me.team?'#ffd04a':'#ff5a3a',2.6);}
 if(G.caps[p.team]>=CAPS)endMatch('caps');}
function flagsTick(dt){for(const f of G.flags){if(f.state==='carried'){if(!f.carrier||!f.carrier.alive){if(f.carrier)dropFlag(f.carrier);else{f.state='dropped';f.dropT=FLAG_RETURN;}}else f.pos.copy(f.carrier.pos);}
  else if(f.state==='dropped'){f.dropT-=dt;if(f.dropT<=0)returnFlag(f,null);}}
 if(G.phase!=='live')return;
 for(const p of G.players){if(!p.alive)continue;for(const f of G.flags){if(f.state==='carried')continue;const d=Math.hypot(p.pos.x-f.pos.x,p.pos.z-f.pos.z);if(d>2||Math.abs(p.pos.y-f.pos.y)>2.4)continue;
   if(f.team!==p.team&&!p.carrying)takeFlag(p,f);else if(f.team===p.team&&f.state==='dropped')returnFlag(f,p);}
  if(p.carrying&&G.flags[p.team].state==='home'){const h=G.homes[p.team];if(Math.hypot(p.pos.x-h.x,p.pos.z-h.z)<2.6&&Math.abs(p.pos.y-h.y)<2.6)capture(p);}}}

/* ================= combat ================= */
const tv=new V(),tv2=new V(),tv3=new V(),ray={};
function aimDir(p,o=new V()){const y=p.yaw+(p.wobY||0),pt=p.pitch+(p.wobP||0);return o.set(-Math.sin(y)*Math.cos(pt),Math.sin(pt),-Math.cos(y)*Math.cos(pt));}
function eyePos(p,o=new V()){return isMe(p)&&p.alive?o.copy(cam.position):o.set(p.pos.x,p.pos.y+EYE,p.pos.z);}
function shoot(p){const w=WPN[p.loadout],cross=p.loadout==='cross';const f=cross?1:p.draw;const spd=w.spd[0]+(w.spd[1]-w.spd[0])*f;
 const d=aimDir(p,new V());const o=eyePos(p,new V()).addScaledVector(d,.3);
 G.arrows.push({p:o,v:d.clone().multiplyScalar(spd),owner:p,team:p.team,dmg:w.dmg[0]+(w.dmg[1]-w.dmg[0])*f,head:w.head,g:w.g,bolt:cross,t:0,wh:false});
 p.ammo--;if(cross)p.loaded=false;p.stats.shots++;p.spawnProt=0;snd.play(cross?'xbow':'twang',o,f>.8?2:1);if(isMe(p)){kick+=cross?.05:.025*f;if(VM)VM.kick=1;}}
function raySphere(o,d,c,r,maxT){const ox=o.x-c.x,oy=o.y-c.y,oz=o.z-c.z,b=ox*d.x+oy*d.y+oz*d.z,cc=ox*ox+oy*oy+oz*oz-r*r;if(cc>0&&b>0)return-1;const disc=b*b-cc;if(disc<0)return-1;const t=-b-Math.sqrt(disc);return t<0?(cc<0?0:-1):t<=maxT?t:-1;}
function rayCapsule(o,d,q,r,maxT){// vertical capsule around player q (feet .25 .. shoulders 1.42)
 const y0=q.pos.y+.3,y1=q.pos.y+1.42;const st=.12;for(let t=0;t<=maxT+st;t+=st){const tt=Math.min(t,maxT),x=o.x+d.x*tt,y=o.y+d.y*tt,z=o.z+d.z*tt;const cy=y<y0?y0:y>y1?y1:y;const dd=(x-q.pos.x)**2+(y-cy)**2+(z-q.pos.z)**2;if(dd<r*r)return tt;if(tt>=maxT)break;}return-1;}
function shieldHit(o,d,q,maxT){if(q.weapon!=='sword'||!q.block)return-1;const fx=-Math.sin(q.yaw),fz=-Math.cos(q.yaw);const dn=d.x*fx+d.z*fz;if(dn>-.15)return-1;
 const cx=q.pos.x+fx*.45,cy=q.pos.y+1.25,cz=q.pos.z+fz*.45;const t=((cx-o.x)*fx+(cz-o.z)*fz)/dn;if(t<0||t>maxT)return-1;const hx=o.x+d.x*t-cx,hy=o.y+d.y*t-cy,hz=o.z+d.z*t-cz;return hx*hx+hy*hy+hz*hz<.62*.62?t:-1;}
const Mtmp=new THREE.Matrix4(),Qtmp=new THREE.Quaternion(),Z3=new V(0,0,1),S1=new V(1,1,1);
function stickArrow(pos,dir,bolt){const i=G.stuckI;G.stuckI=(i+1)%arrowsM.stuck.count;Qtmp.setFromUnitVectors(Z3,dir);const s=bolt?tv3.set(1.5,1.5,.55):S1;Mtmp.compose(tv2.copy(pos).addScaledVector(dir,.1),Qtmp,s);arrowsM.stuck.setMatrixAt(i,Mtmp);arrowsM.stuck.instanceMatrix.needsUpdate=true;
 G.stuck[i]={x:pos.x,y:pos.y,z:pos.z,alive:true};}
function unstick(i){G.stuck[i].alive=false;Mtmp.makeScale(0,0,0);arrowsM.stuck.setMatrixAt(i,Mtmp);arrowsM.stuck.instanceMatrix.needsUpdate=true;}
function arrowsTick(dt){const W=G.W,me=G.me;for(let i=G.arrows.length-1;i>=0;i--){const a=G.arrows[i];a.t+=dt;a.v.y-=a.g*dt;const sp=a.v.length(),len=sp*dt;const d=tv.copy(a.v).divideScalar(sp);
  let best=len,hitP=null,part=null;
  for(const q of G.players){if(!q.alive||q.team===a.team)continue;const dx=q.pos.x-a.p.x,dz=q.pos.z-a.p.z;if(dx*dx+dz*dz>(len+2.5)**2)continue;
   let t=shieldHit(a.p,d,q,best);if(t>=0&&t<best){best=t;hitP=q;part='shield';}
   t=raySphere(a.p,d,tv2.set(q.pos.x,q.pos.y+1.66,q.pos.z),.23,best);if(t>=0&&t<best){best=t;hitP=q;part='head';}
   t=rayCapsule(a.p,d,q,.34,best);if(t>=0&&t<best){best=t;hitP=q;part='body';}}
  const r=W.ray(a.p,d,best,ray);
  if(me&&me.alive&&a.owner!==me&&!a.wh){const ex=cam.position;const px=ex.x-a.p.x,py=ex.y-a.p.y,pz=ex.z-a.p.z,tt=cl(px*d.x+py*d.y+pz*d.z,0,len);if(Math.hypot(px-d.x*tt,py-d.y*tt,pz-d.z*tt)<2.6){a.wh=true;snd.play('whoosh',ex,1);}}
  if(r.hit){const hp=tv2.copy(a.p).addScaledVector(d,r.t);const b=r.hit;stickArrow(hp,d,a.bolt);const kind=b==='terrain'?'thunkG':b.kind==='wood'?'thunkW':'thunkS';snd.play(kind,hp);
   dust.burst(hp,5,1.6,b==='terrain'?new C(.55,.5,.4):b.kind==='wood'?new C(.7,.55,.35):new C(.7,.7,.68),.35,.6,{dir:new V(r.nx,r.ny,r.nz),spread:1,grav:2,drag:3,alpha:.6,grow:1});
   if(b!=='terrain'&&b.dyn)damageDyn(b,a.dmg*.14,a.owner);G.arrows.splice(i,1);continue;}
  if(hitP){const at=tv2.copy(a.p).addScaledVector(d,best);G.arrows.splice(i,1);
   if(part==='shield'){snd.play('shield',at);parts.burst(at,14,4,new C(1.6,1.2,.6),.12,.35,{grav:8});if(isMe(a.owner))hud.hit('hit');if(isMe(hitP))hud.msg('BLOCKED',.8);continue;}
   const head=part==='head';hurt(hitP,a.dmg*(head?a.head:1),a.owner,a.bolt?'BOLT':a.dmg>45?'LONGBOW':'ARROW',head,d);continue;}
  const wy=W.waterAt(a.p.x,a.p.z);const ny=a.p.y+d.y*len;a.p.addScaledVector(d,len);
  if(a.p.y<wy&&a.p.y-d.y*len>=wy){snd.play('splash',a.p);dust.burst(a.p,10,2.5,new C(.85,.92,1),.3,.6,{up:true,grav:9,alpha:.7});G.arrows.splice(i,1);continue;}
  if(a.t>8||a.p.y<W.voidY-20)G.arrows.splice(i,1);}}
let pickT=0;
function pickupsTick(dt){pickT-=dt;if(pickT>0)return;pickT=.1;for(const p of G.players){if(!p.alive||p.ammo>=WPN[p.loadout].ammo)continue;
  for(let i=0;i<G.stuck.length;i++){const s=G.stuck[i];if(!s||!s.alive)continue;const dx=s.x-p.pos.x,dz=s.z-p.pos.z;if(dx*dx+dz*dz>1.5*1.5)continue;const dy=s.y-p.pos.y;if(dy<-.6||dy>2.3)continue;unstick(i);p.ammo++;if(isMe(p)){snd.play('pickup');hud.msg('+1 '+(p.loadout==='cross'?'BOLT':'ARROW'),.7);}if(p.ammo>=WPN[p.loadout].ammo)break;}}
 // supply racks
 for(const p of G.players){if(!p.alive)continue;p.supplyCD-=.1;if(p.supplyCD>0)continue;for(const s of MAP.supply[p.team]){if(Math.hypot(s.x-p.pos.x,s.z-p.pos.z)>2.5||Math.abs(s.y-p.pos.y)>2)continue;
   if(s.kind==='arrows'&&(p.ammo<WPN[p.loadout].ammo||p.bombs<BOMB.count)){p.ammo=WPN[p.loadout].ammo;p.bombs=BOMB.count;p.supplyCD=1.5;if(isMe(p)){snd.play('supply');hud.msg('QUIVER + FIRE POTS RESTOCKED',1.4);}}
   if(s.kind==='planks'&&p.planks<BUILD.cap){p.planks=BUILD.cap;p.supplyCD=1.5;if(isMe(p)){snd.play('supply');hud.msg('PLANKS RESTOCKED',1.4);}}}}}
function hurt(q,dmg,att,how,head,dir){if(!q.alive||q.spawnProt>0)return;if(G.god&&q===G.me)return;q.hp-=dmg;q.lastHurt=G.time;q.flinch=.25;
 if(att&&att!==q){att.stats.hits++;att.stats.dmg+=dmg;}
 const c=new V(q.pos.x,q.pos.y+(head?1.66:1.2),q.pos.z);dust.burst(c,head?12:7,2.2,[new C(.95,.95,.95),new C(TEAMS[q.team].col)],.25,.6,{grav:4,drag:3,alpha:.85,grow:.6});parts.burst(c,head?16:8,4,new C(2.2,.6,.3),.08,.35,{grav:9});
 if(isMe(q)){const ang=att?Math.atan2(att.pos.x-q.pos.x,-(att.pos.z-q.pos.z)):0;hud.hurt(ang);G.shake=Math.max(G.shake,Math.min(.6,dmg/80));snd.play('flesh');}
 if(isMe(att)){const k=q.hp<=0?'kill':head?'head':'hit';hud.hit(k);snd.play(head?'head':'hitmark');}else if(!isMe(q))snd.play(head?'head':'flesh',c);
 if(q.hp<=0)kill(q,att,how,head);}
function kill(q,att,how,head){if(!q.alive)return;q.alive=false;q.hp=0;q.respawnT=RESPAWN;q.stats.deaths++;q.killer=att&&att!==q?att:null;q.killHow=(how||'')+(head?' · HEADSHOT':'');const carried=!!q.carrying;
 q.drawing=false;q.draw=0;q.swing=0;q.block=false;q.bombAim=false;q.ladder=null;q.rig.deadT=0;q.rig.root.visible=true;
 if(q.carrying)dropFlag(q);
 if(att&&att!==q){att.stats.kills++;att.stats.score+=100+(head?50:0)+(carried?100:0);if(head)att.stats.heads++;}
 if(!G.attract){const glyph=how==='SWORD'?'⚔':how==='FIRE POT'?'✹':how==='FELL'?'☁':'➶';hud.feed(att&&att!==q?att.name:'',att?att.team:0,glyph+(head?' ◎':''),q.name,q.team);}
 if(isMe(q)){snd.play('death');deathCam.t=0;deathCam.p.copy(cam.position);}if(isMe(att))snd.play('kill');}
function meleeHit(p){const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);let best=null,bd=1e9;
 for(const q of G.players){if(!q.alive||q.team===p.team)continue;const dx=q.pos.x-p.pos.x,dz=q.pos.z-p.pos.z,dh=Math.hypot(dx,dz),dy=q.pos.y-p.pos.y;if(dh>SWORD.reach||Math.abs(dy)>1.6)continue;const dot=(dx*fx+dz*fz)/(dh||1);if(dot<.4&&dh>.9)continue;if(dh<bd){bd=dh;best=q;}}
 if(best){const bfx=-Math.sin(best.yaw),bfz=-Math.cos(best.yaw),tx=(p.pos.x-best.pos.x)/(bd||1),tz=(p.pos.z-best.pos.z)/(bd||1);const c=tv2.set(best.pos.x+tx*.4,best.pos.y+1.3,best.pos.z+tz*.4);
  if(best.weapon==='sword'&&best.block&&bfx*tx+bfz*tz>.25){snd.play('clang',c);parts.burst(c,26,6,[new C(3,2.2,1),new C(2,2,2)],.1,.35,{grav:10});p.stun=.55;p.swing=0;if(isMe(best))hud.msg('PARRIED',.7);if(isMe(p))hud.msg('BLOCKED',.7);return;}
  const back=bfx*-tx+bfz*-tz>.55;snd.play('cut',c);hurt(best,SWORD.dmg*(back?1.5:1),p,'SWORD',false,null);if(back&&isMe(p))hud.msg('BACKSTAB',.8);return;}
 const b=G.dynNear(tv2.set(p.pos.x+fx*1.3,p.pos.y,p.pos.z+fz*1.3),1.2);if(b){damageDyn(b,45,p);snd.play('thunkW',tv2);dust.burst(tv2.setY(p.pos.y+1.2),8,2,new C(.75,.58,.38),.25,.6,{grav:6,alpha:.8});}}
function throwBomb(p){const d=aimDir(p,new V());d.y+=.12;d.normalize();const o=eyePos(p,new V()).addScaledVector(d,.5);const m=potMesh();m.position.copy(o);scene.add(m);
 G.bombs.push({p:o,v:d.multiplyScalar(BOMB.speed).addScaledVector(p.vel,.4),owner:p,team:p.team,mesh:m,t:0,spin:new V(rnd()*8,rnd()*8,0)});p.bombs--;p.throwT=1;p.spawnProt=0;snd.play('throw',o);}
function bombsTick(dt){const W=G.W;for(let i=G.bombs.length-1;i>=0;i--){const b=G.bombs[i];b.t+=dt;b.v.y-=BOMB.g*dt;const sp=b.v.length(),len=sp*dt,d=tv.copy(b.v).divideScalar(sp);let best=len,hit=false;
  for(const q of G.players){if(!q.alive||q.team===b.team)continue;const t=rayCapsule(b.p,d,q,.42,best);if(t>=0&&t<best){best=t;hit=true;}}
  const r=W.ray(b.p,d,best,ray);if(r.hit){best=r.t;hit=true;}
  b.p.addScaledVector(d,hit?Math.max(0,best-.1):len);b.mesh.position.copy(b.p);b.mesh.rotation.x+=b.spin.x*dt;b.mesh.rotation.y+=b.spin.y*dt;
  if(rnd()<.6)parts.emit(b.p.x,b.p.y+.2,b.p.z,(rnd()-.5),1+rnd(),(rnd()-.5),3,1.6,.4,1,.12,.3,-2,1);
  const wy=W.waterAt(b.p.x,b.p.z);if(b.p.y<wy){snd.play('splash',b.p);scene.remove(b.mesh);G.bombs.splice(i,1);continue;}
  if(hit||b.t>5){explode(b.p.clone(),b.owner);scene.remove(b.mesh);G.bombs.splice(i,1);continue;}if(b.p.y<W.voidY-10){scene.remove(b.mesh);G.bombs.splice(i,1);}}}
function explode(pos,owner){const W=G.W;snd.play('pot',pos);snd.play('boom',pos);
 parts.burst(pos,140,13,[new C(3,1.5,.35),new C(2.6,.9,.2),new C(3,2.4,1)],.55,.9,{grav:-1,drag:2.4,jit:.6});parts.burst(pos,40,9,new C(2.5,1.2,.3),.15,1.3,{up:true,grav:12,drag:.6});
 dust.burst(pos,26,3,[new C(.3,.28,.26),new C(.45,.4,.36)],1.4,2.2,{up:true,grav:-1.2,drag:1.6,alpha:.75,grow:2.2,jit:1.2});
 boomLight.position.copy(pos).y+=1;boomLight.color.set(0xff9a40);boomLight.intensity=120;
 if(G.me&&G.me.alive){const dd=G.me.pos.distanceTo(pos);if(dd<25)G.shake=Math.max(G.shake,.7*(1-dd/25));}
 for(const q of G.players){if(!q.alive||(q.team===owner.team&&q!==owner))continue;const c=tv2.set(q.pos.x,q.pos.y+1,q.pos.z);const d=c.distanceTo(pos);if(d>BOMB.radius)continue;const k=1-d/BOMB.radius;
  let dmg=BOMB.dmg*(.25+.75*k);if(q===owner)dmg*=.35;if(!W.los(tv3.copy(pos).setY(pos.y+.4),c))dmg*=.4;const dir=c.clone().sub(pos).normalize();q.vel.addScaledVector(dir,9*k);q.vel.y+=5*k;q.onGround=false;q.ladder=null;hurt(q,dmg,owner,'FIRE POT',false,dir);}
 for(const b of G.dyn.slice()){const dx=Math.max(b.x0-pos.x,0,pos.x-b.x1),dz=Math.max(b.z0-pos.z,0,pos.z-b.z1);if(Math.hypot(dx,dz)<BOMB.radius*.8)damageDyn(b,170,owner);}}

/* ================= building ================= */
function placement(p){const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);let dx,dz;if(Math.abs(fx)>Math.abs(fz)){dx=Math.sign(fx);dz=0;}else{dx=0;dz=Math.sign(fz);}
 for(let k=0;k<(G.buildRot&3);k++){const t=dx;dx=-dz;dz=t;}const type=G.buildType,W=G.W;
 let x0,x1,z0,z1,cx,cz;if(type==='wall'){cx=p.pos.x+fx*2.6;cz=p.pos.z+fz*2.6;const hw=dx?.18:1.5,hd=dz?.18:1.5;x0=cx-hw;x1=cx+hw;z0=cz-hd;z1=cz+hd;}
 else{cx=p.pos.x+dx*3.6;cz=p.pos.z+dz*3.6;const hw=dx?BG.L/2:1.5,hd=dz?BG.L/2:1.5;x0=cx-hw;x1=cx+hw;z0=cz-hd;z1=cz+hd;}
 const y=W.groundAt(cx,cz,p.pos.y+1.4,.2);let ok=y>p.pos.y-2.5&&y<p.pos.y+1.4&&y>W.voidY+2;let lo=y,hi=y;
 for(const[x,z]of[[x0,z0],[x1,z0],[x0,z1],[x1,z1]]){const g=W.groundAt(x,z,y+1,.05);lo=Math.min(lo,g);hi=Math.max(hi,g);}if(hi-lo>1.2||lo<W.voidY+2)ok=false;
 const top=y+(type==='wall'?2.3:2.5);for(const b of W.near(x0+.05,z0+.05,x1-.05,z1-.05,[])){if(b.y0<top&&W.top(b,cl(cx,b.x0,b.x1),cl(cz,b.z0,b.z1))>y+.35){ok=false;break;}}
 for(const q of G.players){if(!q.alive)continue;if(q.pos.x>x0-.45&&q.pos.x<x1+.45&&q.pos.z>z0-.45&&q.pos.z<z1+.45&&q.pos.y<top&&q.pos.y+1.8>y){ok=false;break;}}
 for(const f of G.flags){if(Math.hypot(f.pos.x-cx,f.pos.z-cz)<4||Math.hypot(f.home.x-cx,f.home.z-cz)<4)ok=false;}
 if(p.planks<BUILD[type].cost)ok=false;return{ok,type,x0,x1,z0,z1,cx,cz,y,dx,dz};}
function placeBuild(p){const s=placement(p);if(!s.ok){snd.play('click');hud.msg(p.planks<BUILD[s.type].cost?'NOT ENOUGH PLANKS · RESTOCK AT THE PLANK PILE':'CAN\'T BUILD THERE',1.2);return false;}
 const W=G.W;let b;if(s.type==='wall')b=W.addBlock({x0:s.x0,x1:s.x1,z0:s.z0,z1:s.z1,y0:s.y-.2,y1:s.y+2.3,kind:'wood',dyn:true});
 else b=W.addBlock({x0:s.x0,x1:s.x1,z0:s.z0,z1:s.z1,y0:s.y-.15,y1:s.y+2.5,kind:'wood',dyn:true,ramp:{axis:s.dx?'x':'z',dir:s.dx||s.dz,lo:s.y+.05}});
 b.hp=BUILD[s.type].hp;b.team=p.team;const m=new THREE.Mesh(s.type==='wall'?BG.wall:BG.ramp,woodMat);m.castShadow=true;m.receiveShadow=true;m.position.set(s.cx,s.y,s.cz);m.rotation.y=Math.atan2(s.dx,s.dz);m.scale.set(1,.05,1);scene.add(m);b.mesh=m;b.grow=0;
 G.dyn.push(b);G.nav.block(b);p.planks-=BUILD[s.type].cost;snd.play('hammer',m.position);dust.burst(new V(s.cx,s.y+.3,s.cz),14,2,new C(.75,.68,.55),.6,.8,{up:true,grav:1,drag:2,alpha:.7,grow:1.4,jit:2});
 if(G.dyn.length>BUILD.limit)breakDyn(G.dyn[0],true);return true;}
function damageDyn(b,amt,by){if(b.dead)return;b.hp-=amt;if(b.mesh){b.mesh.position.x+=(rnd()-.5)*.04;}if(b.hp<=0)breakDyn(b);}
function breakDyn(b,quiet){if(b.dead)return;G.W.removeBlock(b);scene.remove(b.mesh);const i=G.dyn.indexOf(b);if(i>=0)G.dyn.splice(i,1);const c=new V((b.x0+b.x1)/2,(b.y0+b.y1)/2,(b.z0+b.z1)/2);
 if(!quiet){snd.play('break',c);dust.burst(c,24,4,[new C(.8,.6,.38),new C(.6,.45,.3)],.4,1.2,{grav:9,drag:1,alpha:.9,jit:2});}
 for(let i2=0;i2<G.stuck.length;i2++){const s=G.stuck[i2];if(s&&s.alive&&s.x>b.x0-.3&&s.x<b.x1+.3&&s.z>b.z0-.3&&s.z<b.z1+.3&&s.y>b.y0-.3&&s.y<b.y1+.5)unstick(i2);}}

/* ================= per-player simulation ================= */
function setWeapon(p,w){if(w===p.weapon)return;if(w==='bomb'&&p.bombs<=0){if(isMe(p))hud.msg('NO FIRE POTS · RESTOCK AT THE QUIVER RACK',1.2);return;}if(w==='build'&&p.bot)return;
 p.drawing=false;p.draw=0;p.holdT=0;p.swing=0;p.block=false;p.bombAim=false;p.prevWeapon=p.weapon;p.weapon=w;p.swapT=.28;p.rig.setWeapon(w,p.loadout);if(isMe(p))snd.play('click');}
function stepPlayer(p,dt){const W=G.W;
 if(!p.alive){if(G.phase!=='end'&&!(G.attract&&false)){p.respawnT-=dt;if(p.respawnT<=0)spawnPlayer(p);}return;}
 const i=p.inp,frozen=G.phase==='count'||G.phase==='end'&&!G.attract;p.yaw=i.yaw;p.pitch=cl(i.pitch,-1.45,1.45);
 p.spawnProt=Math.max(0,p.spawnProt-dt);p.swapT=Math.max(0,p.swapT-dt);p.stun=Math.max(0,p.stun-dt);p.throwT=Math.max(0,p.throwT-dt*2.5);
 if(i.slot&&i.slot!==p.weapon)setWeapon(p,i.slot);
 // ---- movement ----
 const fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw),rx=Math.cos(p.yaw),rz=-Math.sin(p.yaw);let wx=fx*i.f+rx*i.s,wz=fz*i.f+rz*i.s;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}
 let speed=MOVE.walk;if(p.drawing||p.bombAim||p.aimADS)speed*=MOVE.draw;if(p.block)speed*=MOVE.block;if(p.carrying)speed*=MOVE.carry;
 if(i.sprint&&!p.drawing&&!p.block&&!p.bombAim&&i.f>.3)speed=MOVE.sprint*(p.carrying?MOVE.carry:1);
 const wy=W.waterAt(p.pos.x,p.pos.z),inWater=wy>p.pos.y+.35;if(inWater)speed*=MOVE.water;if(frozen)speed=0;
 const L=W.ladderAt(p.pos.x,p.pos.y+.1,p.pos.z);
 if(p.ladder){if(!L||i.jump){if(i.jump){p.vel.set(p.ladder.nx*4,4.5,p.ladder.nz*4);}p.ladder=null;}}
 else if(L&&!frozen){const toward=-(fx*L.nx+fz*L.nz);if((i.f>.1&&toward>.25)||(i.f<-.1&&!p.onGround&&toward>-.5)){p.ladder=L;p.vel.set(0,0,0);}}
 if(p.ladder){const l=p.ladder,up=frozen?0:i.f;p.vel.y=up*MOVE.climb;const dx=p.pos.x-l.x,dz=p.pos.z-l.z,out=dx*l.nx+dz*l.nz,al=dx*l.tx+dz*l.tz;
  p.vel.x=(l.nx*(.48-out)-l.tx*al)*8;p.vel.z=(l.nz*(.48-out)-l.tz*al)*8;
  if(p.pos.y>=l.y1-.08&&up>0){p.pos.y=l.y1+.06;p.pos.x-=l.nx*1.3;p.pos.z-=l.nz*1.3;p.vel.set(0,0,0);p.ladder=null;p.onGround=true;}
  else if(up<0&&p.pos.y<=l.y0+.05){p.ladder=null;}}
 else{const onIce=W.ice&&p.onGround&&Math.hypot((p.pos.x-W.ice.x)/W.ice.rx,(p.pos.z-W.ice.z)/W.ice.rz)<1&&p.pos.y<.4;const r=p.onGround?(onIce?1.4:14):2;const k=Math.min(1,r*dt);
  p.vel.x+=(wx*speed-p.vel.x)*k;p.vel.z+=(wz*speed-p.vel.z)*k;
  if(i.jump&&p.onGround&&!frozen&&!(inWater&&wy>p.pos.y+1.1)){p.vel.y=MOVE.jump;p.onGround=false;if(isMe(p))snd.play('jump');}}
 const vy0=p.vel.y,res=W.move(p,dt);
 if(res.landed&&res.impact>4){if(isMe(p)){snd.play('land',null,res.impact/4);p.dip=Math.min(.3,res.impact*.02);}dust.burst(tv.set(p.pos.x,p.pos.y+.05,p.pos.z),4,1.2,new C(.7,.66,.6),.3,.5,{up:true,alpha:.45,grow:1});}
 if(p.onGround&&!frozen){const hs=Math.hypot(p.vel.x,p.vel.z);p.stepT+=hs*dt;if(p.stepT>2.3){p.stepT=0;if(isMe(p))snd.play('step',null,hs>7?1.6:1);else if(G.me&&p.pos.distanceTo(G.me.pos)<16)snd.play('step',p.pos,1);}}
 if(p.pos.y<W.voidY){const a=p.lastHurt>G.time-6?p.lastAtt:null;kill(p,a&&a!==p?a:null,'FELL',false);return;}
 if(inWater&&p.carrying&&wy-p.pos.y>1.6)dropFlag(p);
 // ---- weapons ----
 const w=WPN[p.loadout];p.aimADS=false;
 if(p.weapon==='bow'&&p.loadout!=='cross'){const can=!frozen&&p.swapT<=0&&!p.ladder&&p.ammo>0;
  if(i.fire&&can&&!(p.drawing===false&&p.prevFire&&p.cancelled)){if(!p.drawing){p.drawing=true;p.draw=0;p.holdT=0;}p.draw=Math.min(1,p.draw+dt/w.draw);if(p.draw>=1)p.holdT+=dt;}
  if(!i.fire)p.cancelled=false;
  if(p.drawing&&(i.alt||!can)){p.drawing=false;p.draw=0;p.holdT=0;p.cancelled=!!i.fire;}
  else if(p.drawing&&!i.fire){if(p.draw>.12)shoot(p);p.drawing=false;p.draw=0;p.holdT=0;}}
 else if(p.weapon==='bow'){if(!p.loaded&&p.ammo>0&&!p.ladder&&!frozen){if(p.reload===0&&isMe(p))snd.play('crank');p.reload+=dt/w.reload;if(p.reload>=1){p.loaded=true;p.reload=0;if(isMe(p))snd.play('click');}}
  p.aimADS=i.alt&&!frozen&&!p.ladder;if(i.fire&&!p.prevFire&&p.loaded&&p.ammo>0&&p.swapT<=0&&!frozen&&!p.ladder)shoot(p);}
 if(p.weapon==='sword'){p.block=i.alt&&p.swing<=0&&!frozen&&!p.ladder&&p.stun<=0;
  if(p.swing>0){const pr=p.swing;p.swing+=dt/SWORD.time;if(pr<SWORD.hitAt&&p.swing>=SWORD.hitAt)meleeHit(p);if(p.swing>=1)p.swing=0;}
  else if(i.fire&&!p.prevFire&&!p.block&&p.swapT<=0&&!frozen&&p.stun<=0&&!p.ladder){p.swing=.001;p.spawnProt=0;snd.play('swing',isMe(p)?null:p.pos);}}else p.block=false;
 if(p.weapon==='bomb'){if(p.bombs<=0){if(p.throwT<=.05)setWeapon(p,'bow');}else if(i.fire&&p.swapT<=0&&!frozen&&!p.ladder)p.bombAim=true;else if(p.bombAim&&!i.fire){p.bombAim=false;throwBomb(p);}}
 if(p.weapon==='build'&&i.fire&&!p.prevFire&&!frozen)placeBuild(p);
 p.prevFire=i.fire;
 if(p.hp<100&&G.time-p.lastHurt>5)p.hp=Math.min(100,p.hp+14*dt);}

/* ================= input ================= */
const I=controls(canvas,{canLock:()=>G.app==='play',onLock:(on,was)=>{if(was&&!on&&G.app==='play')pause(true);},onDown:()=>G.app!=='play'||!I.locked,
 onWheel:e=>{if(G.app!=='play'||!I.locked)return;cycle(e.deltaY>0?1:-1);},onKey,onKeyUp:e=>{if(e.code==='Tab')G.boardOn=false;}});
const {keys,mouse,lock,unlock}=I;let jumpEdge=false,slotReq=null,kick=0;addEventListener('blur',()=>{G.boardOn=false;});
const SLOTS=['bow','sword','bomb','build'];
function cycle(d){const me=G.me;if(!me||!me.alive)return;let k=SLOTS.indexOf(me.weapon);for(let n=0;n<4;n++){k=(k+d+4)%4;if(SLOTS[k]==='bomb'&&me.bombs<=0)continue;slotReq=SLOTS[k];return;}}
function onKey(e,first){if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='paused')pause(false);else if(G.app==='play')pause(true);return;}if(G.app!=='play'||!first)return;const me=G.me;
 if(e.code==='Tab')G.boardOn=true;
 if(!me.alive){const m={Digit1:'long',Digit2:'short',Digit3:'cross'}[e.code];if(m)me.nextLoadout=m;return;}
 if(e.code==='Space')jumpEdge=true;
 if(e.code.startsWith('Digit')){const n=+e.code.slice(5);if(n>=1&&n<=4)slotReq=SLOTS[n-1];}
 if(e.code==='KeyQ')slotReq=me.prevWeapon;if(e.code==='KeyB')slotReq=me.weapon==='build'?me.prevWeapon:'build';
 if(me.weapon==='build'){if(e.code==='KeyR')G.buildRot=(G.buildRot+1)&3;if(e.code==='KeyF'){G.buildType=G.buildType==='wall'?'ramp':'wall';snd.play('click');}}}
let padPrev={};
function readHuman(){const me=G.me,i=me.inp;const sens=.0022*G.opt.sens*(me.drawing?(1-(1-WPN[me.loadout].zoom)*me.draw*.7):me.aimADS?.7:1);
 if(I.locked){me.yaw-=mouse.dx*sens;me.pitch=cl(me.pitch-mouse.dy*sens,-1.45,1.45);}VMmd.x=mouse.dx;VMmd.y=mouse.dy;mouse.dx=mouse.dy=0;
 i.f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);i.s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);i.sprint=!!(keys.ShiftLeft||keys.ShiftRight);
 i.fire=I.fire()&&I.locked||!!G.autoFire;i.alt=mouse.r&&I.locked;i.jump=jumpEdge;i.slot=slotReq;jumpEdge=false;slotReq=null;
 const gp=gamepad();if(gp){const ax=gp.axes,bt=gp.buttons,dz=v=>deadzone(v,.18),btn=k=>bt[k]&&(bt[k].pressed||bt[k].value>.4);const lx=dz(ax[0]||0),ly=dz(ax[1]||0),rx=dz(ax[2]||0),ry=dz(ax[3]||0);
  if(lx||ly){i.f=-ly;i.s=lx;}me.yaw-=rx*.05*G.opt.sens;me.pitch=cl(me.pitch-ry*.04*G.opt.sens,-1.45,1.45);if(btn(7))i.fire=true;if(btn(6))i.alt=true;if(btn(10))i.sprint=true;
  if(btn(0)&&!padPrev.a)i.jump=true;if(btn(5)&&!padPrev.rb)cycle(1),i.slot=slotReq,slotReq=null;if(btn(4)&&!padPrev.lb)i.slot='bomb';if(btn(3)&&!padPrev.y)i.slot=me.weapon==='build'?me.prevWeapon:'build';if(btn(2)&&!padPrev.x&&me.weapon==='build')G.buildType=G.buildType==='wall'?'ramp':'wall';
  if(btn(9)&&!padPrev.st)pause(true);G.boardOn=btn(8)||!!keys.Tab;padPrev={a:btn(0),rb:btn(5),lb:btn(4),y:btn(3),x:btn(2),st:btn(9)};}
 i.yaw=me.yaw;i.pitch=me.pitch;}
const VMmd={x:0,y:0};
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlock();G.boardOn=false;}else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= main step ================= */
let lastBeep=4;
function step(dt){dt=Math.min(dt,.1);if(G.app==='paused'){visuals(0);return;}
 if(G.app==='play'&&G.me){if(G.me.alive)readHuman();else{const i=G.me.inp;i.fire=false;i.alt=false;mouse.dx=mouse.dy=0;}}
 const sdt=dt*G.timeScale;
 if(G.app==='play'||G.app==='menu'){const n=Math.max(1,Math.ceil(sdt/(1/60)));const h=sdt/n;for(let k=0;k<n;k++){tick(h);if(k===0&&G.me){G.me.inp.jump=false;G.me.inp.slot=null;}}}
 else if(G.app==='over'){overT+=dt;for(const p of G.players){p.inp.f=p.inp.s=0;p.inp.fire=false;}}
 visuals(dt);}
function tick(h){G.time+=h;flagU.value=G.time;
 if(G.phase==='count'){G.countT-=h;const n=Math.ceil(G.countT);if(n!==lastBeep&&n>0){lastBeep=n;snd.play('beep',null,0);}if(G.countT<=0){G.phase='live';G.liveT=0;snd.play('beep',null,1);snd.play('horn');}}
 else if(G.phase==='live'){G.liveT+=h;if(!G.attract){G.clock-=h;if(G.clock<=0){G.clock=0;endMatch('clock');}}}
 else if(G.phase==='end'){G.endT+=h/Math.max(.05,G.timeScale);G.timeScale=G.endT<2.6?.35:1;if(G.endT>2.6){G.timeScale=1;if(G.attract){attract();return;}showOver();return;}}
 for(const p of G.players){if(p.bot)think(p,G,h);stepPlayer(p,h);}
 arrowsTick(h);bombsTick(h);flagsTick(h);pickupsTick(h);
 for(const b of G.dyn){if(b.mesh&&b.grow<1){b.grow=Math.min(1,b.grow+h*5);b.mesh.scale.y=.05+.95*b.grow;}}
 if(G.attract&&G.caps.some(c=>c>=CAPS)&&G.phase!=='end')endMatch('caps');}

/* ================= visuals ================= */
const deathCam={t:0,p:new V()};let orbitA=0,camY=0;
function visuals(dt){const d=MAP.def;G.shake=Math.max(0,G.shake-dt*1.8);kick*=Math.exp(-dt*10);boomLight.intensity*=Math.exp(-dt*6);
 // rigs
 for(const p of G.players){const r=p.rig;if(isMe(p)&&p.alive){r.root.visible=false;continue;}r.root.visible=true;r.root.position.copy(p.pos);r.root.rotation.y=p.yaw;
  if(!p.alive&&r.deadT>4.5){r.root.visible=false;continue;}
  r.animate({spd:Math.hypot(p.vel.x,p.vel.z),ground:p.onGround,pitch:p.pitch,weapon:p.weapon,load:p.loadout,draw:p.loadout==='cross'?(p.loaded?1:0):p.draw,aiming:p.loadout==='cross'?true:p.drawing,swing:p.swing,block:p.block,climb:!!p.ladder,dead:!p.alive,t:G.time,ammo:p.ammo,throwT:p.throwT},dt);
  if(p.spawnProt>0)r.root.visible=Math.sin(G.time*30)>-.3;}
 // flags
 for(const f of G.flags){const m=f.mesh,u=m.userData;u.ring.visible=f.state!=='carried';u.beam.visible=true;u.ring.rotation.y+=dt;u.ring.scale.setScalar(1+.08*Math.sin(G.time*3));
  if(f.state==='carried'&&f.carrier){const c=f.carrier;if(isMe(c)&&c.alive){m.visible=false;continue;}m.visible=true;m.position.set(c.pos.x+Math.sin(c.yaw)*.32,c.pos.y+.55,c.pos.z+Math.cos(c.yaw)*.32);m.rotation.set(0,c.yaw,0);m.rotateX(.32);m.scale.setScalar(.85);u.beam.visible=false;}
  else{m.visible=true;m.position.copy(f.pos);m.rotation.set(f.state==='dropped'?.25:0,f.state==='dropped'?G.time*.3:0,0);m.scale.setScalar(1);}
  u.beam.material.opacity=f.state==='home'?.5:.9;}
 // flying arrows
 const fly=arrowsM.fly;let n=0;for(const a of G.arrows){if(n>=fly.instanceMatrix.count)break;tv.copy(a.v).normalize();Qtmp.setFromUnitVectors(Z3,tv);Mtmp.compose(a.p,Qtmp,a.bolt?tv3.set(1.5,1.5,.55):S1);fly.setMatrixAt(n++,Mtmp);
  if(rnd()<.5)parts.emit(a.p.x,a.p.y,a.p.z,0,0,0,.5,.5,.55,.5,.05,.18,0,0);}fly.count=n;fly.instanceMatrix.needsUpdate=true;
 // ambient snow
 if(d.snow&&G.app!=='paused'){for(let k=0;k<Math.ceil(dt*220);k++){const x=cam.position.x+(rnd()-.5)*60,z=cam.position.z+(rnd()-.5)*60;snow.emit(x,cam.position.y+12+rnd()*8,z,(rnd()-.5)*.6+.6,-2.2-rnd(),(rnd()-.5)*.6,1,1,1,.9,.09+rnd()*.06,8,0,0);}}
 parts.update(dt);dust.update(dt,(x,z)=>G.W.terrain(x,z));snow.update(dt);
 cameraUpdate(dt);MAP.update(G.time,dt,cam);
 // build ghost
 for(const k in ghost)ghost[k].visible=false;
 if(G.app==='play'&&G.me&&G.me.alive&&G.me.weapon==='build'){const s=placement(G.me);const g=ghost[s.type];g.visible=true;g.position.set(s.cx,s.y,s.cz);g.rotation.y=Math.atan2(s.dx,s.dz);ghostMat.color.set(s.ok?0x60ff90:0xff5040);}
 // bomb arc preview
 G.bombArc=null;if(G.app==='play'&&G.me&&G.me.alive&&G.me.weapon==='bomb'&&G.me.bombAim){const p=G.me,dd=aimDir(p,new V());dd.y+=.12;dd.normalize();const v=dd.multiplyScalar(BOMB.speed).addScaledVector(p.vel,.4),o=cam.position.clone().addScaledVector(dd.clone().normalize(),.5);G.bombArc=[];
  for(let k=0;k<40;k++){o.addScaledVector(v,.05);v.y-=BOMB.g*.05;G.bombArc.push(o.clone());if(G.W.solidAt(o.x,o.y,o.z))break;}}
 // audio listener + draw creak
 if(G.me&&G.app==='play'){snd.listener(cam.position.x,cam.position.y,cam.position.z,G.me.yaw);snd.setDraw(G.me.draw,G.me.drawing&&G.me.alive);}else{snd.listener(cam.position.x,cam.position.y,cam.position.z,0);snd.setDraw(0,false);}
 if(G.app==='play')hud.update(dt,cam);}
function cameraUpdate(dt){const me=G.me;const aspect=innerWidth/innerHeight;
 if(G.freeCam){cam.position.copy(G.freeCam.p);cam.lookAt(G.freeCam.l);cam.fov=G.freeCam.fov||50;cam.updateProjectionMatrix();if(VM)VM.root.visible=false;return;}
 if(G.app==='play'||G.app==='paused'){if(me.alive){const w=WPN[me.loadout];
   let wob=0;if(me.weapon==='bow'&&me.loadout!=='cross'&&me.drawing)wob=Math.min(1.5,w.sway*(.15*me.draw+Math.max(0,me.holdT-1.8)*.6));me.wobY=(Math.sin(G.time*1.7)*.6+Math.sin(G.time*3.1+1)*.4)*wob*.012;me.wobP=(Math.sin(G.time*2.3+2)*.6+Math.sin(G.time*4.1)*.4)*wob*.01;
   me.dip=Math.max(0,me.dip-dt*1.2);const ty=me.pos.y+EYE;me.camY=me.camY<ty-.8||me.camY>ty+.8?ty:me.camY+(ty-me.camY)*Math.min(1,dt*18);const sp=Math.hypot(me.vel.x,me.vel.z);const bob=me.onGround?Math.sin(G.time*sp*1.25)*Math.min(1,sp/7)*.03:0;
   cam.position.set(me.pos.x,me.camY-me.dip+bob,me.pos.z);const s=G.shake*G.shake*.15;cam.rotation.set(me.pitch+me.wobP+kick+(rnd()-.5)*s,me.yaw+me.wobY+(rnd()-.5)*s,(rnd()-.5)*s*.5);
   let z=1;if(me.weapon==='bow'&&me.loadout!=='cross')z=1-(1-w.zoom)*me.draw*me.draw;else if(me.aimADS)z=w.zoom;me.zoomS=(me.zoomS||1)+(z-(me.zoomS||1))*Math.min(1,dt*12);
   const hf=G.opt.fov*me.zoomS+(Math.hypot(me.vel.x,me.vel.z)>7.5?4:0);cam.fov=2*Math.atan(Math.tan(hf*Math.PI/360)/aspect)*180/Math.PI;}
  else{// death cam: rise above the body and look at the killer
   deathCam.t+=dt;const k=me.killer&&me.killer.alive?me.killer.pos:me.pos;const back=tv.set(me.pos.x-k.x,0,me.pos.z-k.z);if(back.lengthSq()<1)back.set(Math.sin(me.yaw),0,Math.cos(me.yaw));back.normalize();
   const want=tv2.set(me.pos.x+back.x*4.5,Math.max(me.pos.y,G.W.groundAt(me.pos.x,me.pos.z,me.pos.y+5))+3.4,me.pos.z+back.z*4.5);cam.position.lerp(want,Math.min(1,dt*3));cam.lookAt(tv3.set(k.x,k.y+1.2,k.z));cam.fov=60;}
  if(VM){VM.root.visible=me.alive&&G.app!=='over';VM.update({kind:me.weapon==='bow'?me.loadout:me.weapon,draw:me.draw,loaded:me.loadout==='cross'?me.loaded&&me.ammo>0:me.weapon==='bomb'?me.bombs>0:me.ammo>0,reload:me.reload,swing:me.swing,block:me.block,aim:me.weapon==='bomb'?me.bombAim:me.aimADS,
   speed:Math.hypot(me.vel.x,me.vel.z),ground:me.onGround,t:G.time,mdx:VMmd.x,mdy:VMmd.y,wobble:me.holdT>1.8?Math.min(1.5,me.holdT-1.8):0,throwT:me.throwT},dt);}
  cam.updateProjectionMatrix();return;}
 if(VM)VM.root.visible=false;
 if(G.app==='over'){overT+=0;const h=G.homes[G.winner<0?0:G.winner]||G.homes[0];const a=G.time*.12;cam.position.set(h.x+Math.cos(a)*30,h.y+16,h.z+Math.sin(a)*30);cam.lookAt(h.x,h.y+5,h.z);cam.fov=50;cam.updateProjectionMatrix();return;}
 // attract: drift between castles over the battlefield
 orbitA+=dt*.035;const z=Math.sin(orbitA)*62,x=Math.cos(orbitA*1.3)*34+18;const gy=G.W.groundAt(x,z,80);cam.position.set(x,Math.max(gy,0)+17+Math.sin(orbitA*2)*3,z);cam.lookAt(x*.3-10,4,z*.6+Math.cos(orbitA)*14);cam.fov=55;cam.updateProjectionMatrix();}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM||!VM.root.visible||G.app!=='play'&&G.app!=='paused')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.15:.85));fxStack=null;fxSize='';sun.castShadow=q>0;const s=q>=2?2048:1024;sun.shadow.mapSize.set(s,s);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}
 const e=q>=2?55:45;Object.assign(sun.shadow.camera,{left:-e,right:e,top:e,bottom:-e,near:1,far:260});sun.shadow.camera.updateProjectionMatrix();R.shadowMap.needsUpdate=true;}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.fov=58;vmCam.updateProjectionMatrix();const sc=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));parts.U.uScale.value=dust.U.uScale.value=snow.U.uScale.value=sc;
 // shadow frustum follows the view
 const d=MAP.def,sd=tv.set(...d.sky.sun).normalize();const f=tv2.set(-Math.sin(cam.rotation.y),0,-Math.cos(cam.rotation.y)).multiplyScalar(G.app==='play'?18:30).add(cam.position);sun.target.position.copy(f);sun.position.copy(f).addScaledVector(sd,140);sun.target.updateMatrixWorld();
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<3)R.shadowMap.needsUpdate=true;
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(R,scene,cam,{exposure:d.exp,bloom:.32,bloomThreshold:.92,bloomRadius:.5,saturation:1.1,vignette:.3,grain:.018,aoStrength:.7,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.bloom)fxStack.bloom.strength=.32+Math.min(.5,boomLight.intensity/240);
 if(fxStack.composer)fxStack.render();else{R.autoClear=true;R.render(scene,cam);if(VM&&VM.root.visible&&G.app==='play'){R.autoClear=false;R.clearDepth();R.render(vmScene,vmCam);R.autoClear=true;}}}

/* ================= menus ================= */
const seg=pickers(G.opt,saveOpt);
seg('o-map','map',true,()=>{if(G.app==='menu')attract();});seg('o-load','load',false);seg('o-diff','diff');seg('o-time','time');seg('o-sens','sens');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-fov','fov');
document.querySelectorAll('#dload button').forEach(b=>b.onclick=e=>{if(G.me){G.me.nextLoadout=b.dataset.v;G.opt.load=b.dataset.v;saveOpt();}e.stopPropagation();});
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
postButton($('post'),'longbowkeep',()=>{const a=lastAward||{};
 return[a.pts||0,`Game: Longbow Keep\nPoints: ${a.pts||0}\nResult: ${a.won?'win':a.draw?'draw':'loss'} ${a.score||''} (captures)\nKills: ${a.kills||0} · Deaths: ${a.deaths||0} · Headshots: ${a.heads||0} · Accuracy: ${a.acc||0}%\nCaptures: ${a.caps||0}\nField: ${a.map||''} · ${a.load||''} · CPU ${a.diff||''}`];});

/* ================= boot + loop ================= */
attract();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.LONGBOWKEEP={get state(){return G.app;},get app(){return G.app;},get phase(){return G.phase;},G,get me(){return G.me;},get players(){return G.players;},get flags(){return G.flags;},get caps(){return G.caps;},get score(){return G.caps;},
 get clock(){return G.clock;},setClock(s){G.clock=s;},step,render,start,toMenu,pause,endMatch,showOver,scene,cam,R,get W(){return G.W;},get nav(){return G.nav;},get map(){return MAP;},WPN,
 setQuality:applyQuality,get gfx(){return gfx;},setIdle(team=2){G.idleTeam=team;},god(v=true){G.god=v;},skipCount(){if(G.phase==='count'){G.countT=0;}},
 capture(team){const p=G.players.find(q=>q.team===team&&q.alive)||G.players.find(q=>q.team===team);const f=G.flags[1-team];if(!p.alive)spawnPlayer(p);if(f.state==='carried'&&f.carrier)f.carrier.carrying=null;f.state='carried';f.carrier=p;p.carrying=f;G.flags[team].state='home';G.flags[team].pos.copy(G.flags[team].home);G.flags[team].carrier=null;for(const q of G.players)if(q.carrying===G.flags[team])q.carrying=null;capture(p);},
 kill(p,by){kill(p,by||null,'TEST',false);},hurt(p,n,by,head){hurt(p,n,by||null,'TEST',!!head,null);},
 teleport(x,z,y,p=G.me){p.pos.set(x,y??G.W.groundAt(x,z,200),z);p.vel.set(0,0,0);p.camY=p.pos.y+EYE;},look(yaw,pitch=0){G.me.yaw=yaw;G.me.pitch=pitch;G.me.inp.yaw=yaw;G.me.inp.pitch=pitch;},
 aimAt(t,head){const me=G.me,e=new V(me.pos.x,me.pos.y+EYE,me.pos.z),w=WPN[me.loadout];const s=solveAim(e,{x:t.pos.x,y:t.pos.y+(head?1.66:1.2),z:t.pos.z},{x:0,y:0,z:0},w.spd[1],w.g,0);this.look(s.yaw,s.pitch);},
 fire(draw=1){const me=G.me;me.weapon='bow';if(me.loadout==='cross'){me.loaded=true;}else me.draw=draw;cam.position.set(me.pos.x,me.pos.y+EYE,me.pos.z);shoot(me);},
 swing(){const me=G.me;setWeapon(me,'sword');meleeHit(me);},bomb(){const me=G.me;me.bombs=Math.max(1,me.bombs);throwBomb(me);},build(type='wall'){G.buildType=type;const me=G.me;setWeapon(me,'build');return placeBuild(me);},
 set autoFire(v){G.autoFire=v;},keys,mouse,input:{jump(){jumpEdge=true;},slot(s){slotReq=s;}},snd,hud,get arrows(){return G.arrows;},get stuck(){return G.stuck.filter(s=>s&&s.alive);},get dyn(){return G.dyn;},get bombs(){return G.bombs;},
 spawn(p){spawnPlayer(p,false);},freeCam(p,l,fov){G.freeCam=p?{p:new V(...p),l:new V(...l),fov}:null;},setLoadout(l){G.me.nextLoadout=G.me.loadout=l;G.me.ammo=WPN[l].ammo;G.me.loaded=true;G.me.rig.setWeapon('bow',l);},VM:()=>VM,parts,dust};
