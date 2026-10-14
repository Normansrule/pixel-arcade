// AEONFALL — a 5v5 top-down battle arena in full 3D. Entry module: renderer, camera, input, views, HUD, menus, results.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls} from '../js/kit3d/input.js';
import {$,stored,pickers,postButton,toast} from '../js/kit3d/ui.js';
import * as MAP from './map.js';
import {Sim} from './sim.js';
import {Brains,DIFF} from './ai.js';
import {CHAMPS,CH} from './champs.js';
import {ITEMS,ITEM_IDS,SPELLS,priceOf,MON,ROLE_N,XPNEED,CAMP_NAME} from './data.js';
import {champModel,minionGeo,monsterModel,structModel,rubbleModel,wardModel,pose,MAT,TEAMC} from './models.js';
import {buildWorld,fogUpdate,fogU} from './world.js';
import {Particles,Decals,Shocks,Strips,LOOK} from './fx.js';
import {Sound} from './sound.js';
import {icon} from './icons.js';
import {cl,fmtT,pick} from './util.js';

const ID='aeonfall';
const opt={champ:'kaelen',role:'auto',diff:1,min:25,ctl:'classic',sp:'scorch',lvl:'auto'};const save=stored('aeonfall_opts',opt);
/* ================= renderer / scene ================= */
const canvas=$('c'),ov=$('ov'),ox=ov.getContext('2d');
const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});let gfx=quality();
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#0d1a14');scene.fog=new THREE.Fog('#16241c',120,260);
const camera=new THREE.PerspectiveCamera(36,1,1,600);
const hemi=new THREE.HemisphereLight(0xcfe2ff,0x3a4a2a,1.05);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,2.4);sun.castShadow=true;sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:5,far:200});scene.add(sun,sun.target);
let world=null,fxStack=null;
const POST={bloom:.6,bloomRadius:.5,bloomThreshold:.86,vignette:.32,saturation:1.12,grain:.02,exposure:1.05};
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));sun.castShadow=q>=1;const ms=q>=2?2048:1024;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}fxStack=null;resize();}
/* ================= effects ================= */
const parts=new Particles(scene,gfx>=1?5000:2500,true),smoke=new Particles(scene,1200,false),decals=new Decals(scene,64),shocks=new Shocks(scene,12),strips=new Strips(scene,64);
const flashL=[0,1,2].map(()=>{const l=new THREE.PointLight(0xffc070,0,18,1.6);scene.add(l);return{l,t:0};});let fli=0;
function flash(x,y,z,col,i=40,d=16){const L=flashL[fli++%3];L.l.position.set(x,y,z);L.l.color.set(col);L.l.intensity=i;L.l.distance=d;L.t=.3;}
const CC=s=>new THREE.Color(s);const colCache={};const col=s=>colCache[s]||(colCache[s]=new THREE.Color(s));
const snd=new Sound();
/* ================= state ================= */
let revealAll=false,noBars=false;let app='menu',S=null,B=null,me=null,pt=0,autopilot=false,paused=false,menuT=0,shake=0,lastAward=null,camLock=false;
const cam={x:-60,z:60,zoom:44,tx:-60,tz:60};
const views=new Map(),pviews=new Map(),floats=[];let unitRings=null,minionInst=null,portraits={},bannerT=0;
/* ================= world ================= */
world=buildWorld(scene,gfx);
// ally/enemy ground rings under units (instanced)
{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,40,64,64,62);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.7,'rgba(255,255,255,.15)');g.addColorStop(.86,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
 const tex=new THREE.CanvasTexture(c);const geo=new THREE.PlaneGeometry(2,2);geo.rotateX(-Math.PI/2);unitRings=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),400);unitRings.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(400*3),3);unitRings.count=0;unitRings.renderOrder=1;unitRings.frustumCulled=false;scene.add(unitRings);}
// minion instancing: [type][team] -> {s,g}
{minionInst={};for(const ty of['melee','caster','siege','super'])for(const t of[0,1]){const g=minionGeo(ty,t);const s=new THREE.InstancedMesh(g.s,MAT.body,70),gl=new THREE.InstancedMesh(g.g,MAT.glow,70);s.castShadow=true;s.count=gl.count=0;s.frustumCulled=gl.frustumCulled=false;scene.add(s,gl);minionInst[ty+t]={s,g:gl};}}
// shield bubble geometry/material
const bubbleGeo=new THREE.SphereGeometry(1,20,14),bubbleMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color('#bfe6ff')}},
 vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'uniform vec3 uC;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.5);gl_FragColor=vec4(uC*(f*.9+.04),1.);}'});
/* ================= portraits (rendered once from the models) ================= */
function makePortraits(){const rt=new THREE.WebGLRenderTarget(128,128,{samples:4});const ps=new THREE.Scene();ps.add(new THREE.HemisphereLight(0xffffff,0x445566,1.6));const dl=new THREE.DirectionalLight(0xffffff,2.6);dl.position.set(2,3,4);ps.add(dl);const rl=new THREE.DirectionalLight(0x88aaff,1.5);rl.position.set(-3,1,-2);ps.add(rl);
 const pc=new THREE.PerspectiveCamera(30,1,.1,50);const buf=new Uint8Array(128*128*4),c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const pr=R.getPixelRatio();R.setPixelRatio(1);
 for(const d of CHAMPS){const r=champModel(d);pose(r,{t:.4,mv:0,atk:0,cast:0});ps.add(r.root);r.root.rotation.y=.35;const hy=(d.look.body==='golem'?2.3:d.look.body==='beast'?2.1:2.05)*r.scale;pc.position.set(1.05,hy+.25,3.3);pc.lookAt(0,hy-.3,0);
  ps.background=new THREE.Color(d.col).multiplyScalar(.28);R.setRenderTarget(rt);R.render(ps,pc);R.readRenderTargetPixels(rt,0,0,128,128,buf);R.setRenderTarget(null);ps.remove(r.root);
  const img=x.createImageData(128,128);for(let j=0;j<128;j++)for(let i=0;i<128;i++){const s=((127-j)*128+i)*4,t=(j*128+i)*4;for(let k=0;k<4;k++)img.data[t+k]=buf[s+k];}x.putImageData(img,0,0);
  const g=x.createLinearGradient(0,70,0,128);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.45)');x.fillStyle=g;x.fillRect(0,0,128,128);portraits[d.id]=c.toDataURL('image/jpeg',.88);}
 R.setPixelRatio(pr);rt.dispose();}
const MON_ICON={azure:['sentinel','#5ab8ff'],crimson:['flame','#ff5a3a'],wolf:['claw','#a070ff'],pup:['claw','#a070ff'],beak:['hawk','#ffb030'],chick:['hawk','#ffb030'],krug:['rock','#c8a060'],krugling:['rock','#c8a060'],bog:['eye','#b0ff40'],drake:['flame','#ff8a2a'],warden:['nova','#a070ff']};
/* ================= menu ================= */
const seg=pickers(opt,save);
seg('o-role','role',false);seg('o-diff','diff');seg('o-min','min');seg('o-ctl','ctl',false);seg('o-sp','sp',false);
function buildMenu(){const pk=$('pick');pk.innerHTML='';for(const d of CHAMPS){const e=document.createElement('div');e.className='pc'+(opt.champ===d.id?' on':'');e.innerHTML=`<img src="${portraits[d.id]}" alt=""><b>${d.name.split(' ')[0]}</b><span>${d.role}</span>`;e.onclick=()=>{opt.champ=d.id;save();snd.init();snd.play('click');buildMenu();};e.onmouseenter=()=>showInfo(d);pk.appendChild(e);}
 showInfo(CH[opt.champ]);$('best').textContent=bestScore(ID)?'BEST '+bestScore(ID):'';}
function showInfo(d){const ab=['passive','Q','W','E','R'].map((k,i)=>{const a=d[k];return{k:i?k:'P',a,ic:icon(a.g,d.col)};});
 $('cinfo').innerHTML=`<h3>${d.name}<small>${d.title.toUpperCase()} · ${d.role} · ${d.pos.map(p=>ROLE_N[p]).join(' / ')}</small></h3><p class="lore">${d.lore}</p><div class="kit">${ab.map((x,i)=>`<div class="k" data-i="${i}"><img src="${x.ic}" alt=""><span>${x.k} · ${x.a.name}</span></div>`).join('')}</div><p class="desc" id="cdesc">${d.passive.name}: ${d.passive.d}</p>`;
 $('cinfo').querySelectorAll('.k').forEach(el=>el.onmouseenter=()=>{const x=ab[+el.dataset.i];$('cdesc').textContent=x.a.name+': '+x.a.d;});}
$('howb').onclick=()=>{$('keys').hidden=!$('keys').hidden;};
$('go').onclick=()=>{snd.init();start();};
$('again').onclick=()=>{start();};$('omenu').onclick=()=>toMenu();$('resume').onclick=()=>setPause(false);$('quit').onclick=()=>{setPause(false);toMenu();};
postButton($('post'),ID,()=>{const a=lastAward||{pts:0};return[a.pts,`Aeonfall: ${a.won?'VICTORY':'DEFEAT'} as ${a.champ} (${a.role}), ${a.kda} KDA, ${a.cs} CS, ${a.min} min match on ${a.diff}.`];});
function toMenu(){app='menu';$('over').hidden=true;$('hud').hidden=true;$('menu').hidden=false;$('pause').hidden=true;document.body.classList.remove('playing');snd.music(false);if(S){clearViews();}S=null;buildMenu();}
function setPause(p){if(app!=='play')return;paused=p;$('pause').hidden=!p;}
/* ================= team building ================= */
function teams(){const roles=['top','jungle','mid','bot','sup'];const my=CH[opt.champ];const myRole=opt.role==='auto'?my.pos[0]:opt.role;
 const left=CHAMPS.filter(c=>c.id!==my.id).map(c=>c.id).sort(()=>Math.random()-.5);const slots=[];for(const t of[0,1])for(const r of roles)if(!(t===0&&r===myRole))slots.push({t,r});
 // scarce roles first
 const order=['bot','sup','jungle','mid','top'];slots.sort((a,b)=>order.indexOf(a.r)-order.indexOf(b.r));const assign=[];
 for(const s of slots){let k=left.findIndex(id=>CH[id].pos[0]===s.r);if(k<0)k=left.findIndex(id=>CH[id].pos.includes(s.r));if(k<0)k=0;assign.push({...s,id:left.splice(k,1)[0]});}
 const T=[[],[]];T[0].push({id:my.id,role:myRole,bot:false,spells:['blink',myRole==='jungle'?'strike':opt.sp]});
 for(const a of assign)T[a.t].push({id:a.id,role:a.r,bot:true,spells:['blink',a.r==='jungle'?'strike':a.r==='sup'?pick(['mend','scorch']):a.r==='bot'?pick(['mend','barrier']):pick(['scorch','haste','barrier'])]});
 for(const t of T)t.sort((a,b)=>roles.indexOf(a.role)-roles.indexOf(b.role));return T;}
/* ================= match ================= */
function start(o={}){Object.assign(opt,o.opt||{});clearViews();
 S=new Sim({minutes:o.minutes||opt.min,teams:o.teams||teams(),autoLvl:opt.lvl==='auto'||autopilot});me=S.player;pt=me.team;
 B=new Brains(S,opt.diff,1);app='play';paused=false;S.ev.length=0;
 for(const u of S.units)ensureView(u);
 cam.x=cam.tx=me.x+8;cam.z=cam.tz=me.z-8;cam.zoom=38;camLock=opt.ctl==='wasd';
 $('menu').hidden=true;$('over').hidden=true;$('keys').hidden=true;$('hud').hidden=false;$('board').hidden=true;$('shop').hidden=true;document.body.classList.add('playing');
 buildHud();snd.music(true,0);banner('WELCOME TO THE SUNDERED VALE','Minions spawn at 0:20 · break the enemy Aeon Heart','gold',4);snd.announce('Welcome to the Sundered Vale');
 decals.clear();shocks.clear();strips.clear();parts.clear();smoke.clear();floats.length=0;}
function clearViews(){for(const[u,v]of views)disposeView(v);views.clear();for(const[p,v]of pviews)scene.remove(v.m);pviews.clear();for(const k in minionInst){minionInst[k].s.count=minionInst[k].g.count=0;}}
function disposeView(v){if(v.rig)scene.remove(v.rig.root);if(v.rubble)scene.remove(v.rubble);if(v.bub)scene.remove(v.bub);}
function ensureView(u){if(views.has(u)||u.kind==='minion')return views.get(u);let v={u};
 if(u.kind==='champ'){v.rig=champModel(u.def);v.bub=new THREE.Mesh(bubbleGeo,bubbleMat);v.bub.visible=false;scene.add(v.bub);}
 else if(u.kind==='monster'){const m=MON[u.mtype];v.rig=monsterModel(m.m);v.rig.root.scale.setScalar(1.12);}
 else if(u.struct){v.rig=structModel(u.kind,u.team);v.rubble=rubbleModel(u.kind,u.team);v.rubble.position.set(u.x,MAP.height(u.x,u.z),u.z);v.rubble.visible=false;scene.add(v.rubble);}
 else if(u.kind==='ward'){v.rig=wardModel(u.team);}
 if(v.rig){scene.add(v.rig.root);v.rig.root.position.set(u.x,MAP.height(u.x,u.z),u.z);v.rig.root.rotation.y=u.yaw;}views.set(u,v);return v;}
const tmpO=new THREE.Object3D(),tmpC=new THREE.Color();
function updateViews(dt,t){const seenSet=new Set();let ri=0;const ringC=[col('#4aa8ff'),col('#ff4a5a'),col('#f0c45a'),col('#c8a8ff')];
 const ring=(x,z,r,c,a=1)=>{if(ri>=400)return;tmpO.position.set(x,MAP.height(x,z)+.07,z);tmpO.rotation.set(0,0,0);tmpO.scale.setScalar(r);tmpO.updateMatrix();unitRings.setMatrixAt(ri,tmpO.matrix);tmpC.copy(c).multiplyScalar(a);unitRings.setColorAt(ri,tmpC);ri++;};
 const mcount={};for(const k in minionInst)mcount[k]=0;
 for(const u of S.units){
  const vis=u.team===pt||u.struct||S.seen(pt,u)||(!u.alive&&u.kind!=='champ');
  if(u.kind==='minion'){const k=u.mtype+u.team,mi=minionInst[k];if(!vis||!mi)continue;let dead=0;if(!u.alive){dead=Math.min(1,(S.t-u.lastHit)/1);if(dead>=1)continue;}
   const n=mcount[k]++;if(n>=70)continue;const bob=u.moving?Math.abs(Math.sin(t*10+u.id))*.12:0,lunge=u.atkAnim>0?Math.sin(u.atkAnim/.4*Math.PI)*.35:0;const air=u.airT>0?Math.sin(u.airT/u.airD*Math.PI)*1.4:0;
   tmpO.position.set(u.x+Math.sin(u.yaw)*lunge,MAP.height(u.x,u.z)+bob+air-dead*.8,u.z+Math.cos(u.yaw)*lunge);tmpO.rotation.set(dead*-1.2,u.yaw,0);const sc=1.15*(u.mtype==='super'?1:u.mtype==='siege'?1:.95)*(u.emp?1.15:1)*(1-dead*.3);tmpO.scale.setScalar(sc);tmpO.updateMatrix();mi.s.setMatrixAt(n,tmpO.matrix);mi.g.setMatrixAt(n,tmpO.matrix);
   if(u.alive&&u.hitT>0&&Math.random()<.3)parts.emit(u.x,1,u.z,0,2,0,1,1,1,.3,.15);continue;}
  const v=ensureView(u);if(!v||!v.rig)continue;seenSet.add(u);const root=v.rig.root;
  if(u.struct){const alive=u.alive;root.visible=alive;v.rubble.visible=!alive;if(alive&&v.rig.P.gem){v.rig.P.gem.rotation.y=t*.8;v.rig.P.gem.position.y=(u.kind==='core'?7.4:u.kind==='inhib'?3.2:u.kind==='fountain'?3:6.9)+Math.sin(t*1.6+u.id)*.25;const prot=u.kind!=='fountain'&&!S.attackable(u);v.rig.P.gem.scale.setScalar(prot?.9:1);}
   if(alive&&u.kind==='tower'&&u.tgt&&u.tgt.alive){const tg=u.tgt;if(tg.kind==='champ'&&(tg===me||tg.team===pt||S.seen(pt,tg)))strips.add({x:u.x,y:6.4,z:u.z},{x:tg.x,y:1.2,z:tg.z},tg===me?'#ff3a3a':TEAMC[u.team],.05,.03);}
   continue;}
  let dead=0;if(!u.alive){if(u.kind==='champ'){dead=Math.min(1,(S.t-(v.deathT??=S.t))/1);if(S.t-v.deathT>3){root.visible=false;if(v.bub)v.bub.visible=false;continue;}}else{dead=Math.min(1,(S.t-u.lastHit)/1.2);if(dead>=1){root.visible=false;continue;}}}else v.deathT=undefined;
  root.visible=vis;if(v.bub)v.bub.visible=false;if(!vis)continue;
  const h=MAP.height(u.x,u.z);root.position.set(u.x,h,u.z);let dy=u.yaw-root.rotation.y;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;root.rotation.y+=dy*Math.min(1,dt*14);
  v.mv=(v.mv||0)+((u.moving?1:0)-(v.mv||0))*Math.min(1,dt*10);
  const air=u.airT>0?Math.sin(u.airT/u.airD*Math.PI):0;
  pose(v.rig,{t:t+u.id,mv:v.mv,atk:u.atkAnim/.4,cast:u.castAnim,air,dead,alt:u.id%2});
  if(u.kind==='champ'){const sc=v.rig.scale*(u.size||1);root.scale.setScalar(root.scale.x+(sc-root.scale.x)*Math.min(1,dt*6));root.position.y+=air*1.6;
   if(u.alive){ring(u.x,u.z,1.25*(u.size||1),u===me?ringC[2]:ringC[u.team===pt?0:1],u===me?1:.8);
    if(u.shield>1){v.bub.visible=true;v.bub.position.set(u.x,h+1.3,u.z);v.bub.scale.setScalar(1.5*(u.size||1));}
    buffFx(u,v,dt,t);}}
  else if(u.kind==='monster'&&u.alive){const m=MON[u.mtype];if(u.aggro||u.hitT>0)ring(u.x,u.z,u.r*1.1,ringC[3],.6);if(m.boss&&Math.random()<dt*20){const c=col(m.boss==='drake'?'#ff8a3a':'#b080ff');parts.emit(u.x+(Math.random()-.5)*4,1+Math.random()*4,u.z+(Math.random()-.5)*4,0,1.5,0,c.r,c.g,c.b,.5,1);}}
  else if(u.kind==='ward'&&u.alive){ring(u.x,u.z,1,ringC[u.team===pt?0:1],.6);}}
 for(const[u,v]of views){if(!seenSet.has(u)&&!S.units.includes(u)){disposeView(v);views.delete(u);}}
 for(const k in minionInst){const mi=minionInst[k];mi.s.count=mi.g.count=mcount[k];mi.s.instanceMatrix.needsUpdate=mi.g.instanceMatrix.needsUpdate=true;}
 unitRings.count=ri;unitRings.instanceMatrix.needsUpdate=true;if(unitRings.instanceColor)unitRings.instanceColor.needsUpdate=true;}
const BFX={bedrock:'#ffa53a',frenzy:'#ff4a2a',aeon:'#b080ff',overcharge:'#5af0ff',hawk:'#b8ff8a',chill:'#bfefff',ember:'#ff7a2a',haste:'#bfe8ff',veil:'#e04aff',azure:'#5ab8ff',crimson:'#ff4a2a',recall:'#7ac8ff'};
function buffFx(u,v,dt,t){if(gfx===0&&Math.random()<.5)return;const k=dt*30;
 for(const b of u.buffs){const f=b.fx;if(!f||Math.random()>k*.5)continue;const c=col(BFX[f]||'#fff');const a=Math.random()*6.28,r=f==='aeon'||f==='frenzy'?1.1:.8;
  if(f==='azure'||f==='crimson'){parts.emit(u.x+Math.cos(t*3)*.6,3.1,u.z+Math.sin(t*3)*.6,0,.3,0,c.r,c.g,c.b,.45,.4);continue;}
  parts.emit(u.x+Math.cos(a)*r,.3+Math.random()*1.8,u.z+Math.sin(a)*r,0,f==='chill'?-.5:1.4,0,c.r,c.g,c.b,f==='veil'?.8:.35,.6,0,1);}
 if(u.cc.stun||u.cc.air){for(let i=0;i<2;i++){const a=t*6+i*3.14;parts.emit(u.x+Math.cos(a)*.6,2.7,u.z+Math.sin(a)*.6,0,0,0,1,.95,.4,.35,.08);}}
 if(u.cc.root&&Math.random()<k*.5){const a=Math.random()*6.28;parts.emit(u.x+Math.cos(a)*.7,.3,u.z+Math.sin(a)*.7,0,1.2,0,.4,1,.4,.4,.4);}
 if(u.buffs.some(b=>b.slow)&&Math.random()<k*.2){parts.emit(u.x,.4,u.z,0,.3,0,.6,.7,1,.5,.5);}
 if(u.recall>0&&Math.random()<k){const a=Math.random()*6.28;const c=col('#7ac8ff');parts.emit(u.x+Math.cos(a)*1.2,.2,u.z+Math.sin(a)*1.2,-Math.cos(a)*.6,3+Math.random()*2,-Math.sin(a)*.6,c.r,c.g,c.b,.5,1);}
 if(u.stealth&&Math.random()<k*.4){const c=col('#a040c0');smoke.emit(u.x,1,u.z,0,.5,0,c.r,c.g,c.b,1.2,.8,0,1,1);}}
/* ---------- projectiles ---------- */
const PG={orb:new THREE.IcosahedronGeometry(.5,1),shard:new THREE.OctahedronGeometry(.5,0),arrow:new THREE.CylinderGeometry(.06,.06,1.6,6),star:new THREE.CylinderGeometry(.6,.6,.08,4),rock:new THREE.DodecahedronGeometry(.6,0),wave:new THREE.CylinderGeometry(1,1,1,16,1,true,-.9,1.8),hook:new THREE.TorusGeometry(.35,.1,6,12,Math.PI)};
PG.arrow.rotateX(Math.PI/2);PG.shard.scale(1,1,2.2);PG.wave.rotateY(Math.PI/2);
const pmatCache={};function pmat(c,solid){const k=c+(solid?1:0);return pmatCache[k]||(pmatCache[k]=solid?new THREE.MeshStandardMaterial({color:c,roughness:.6,emissive:c,emissiveIntensity:.25,flatShading:true}):new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.6),toneMapped:false,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));}
function updateProjs(dt,t){const live=new Set(S.projs);
 for(const m of S.projs){let v=pviews.get(m);const L=LOOK[m.look]||LOOK.shot;const vis=m.team===pt||S.vis[pt][((m.z+100)>>1)*100+((m.x+100)>>1)];
  if(!v){let lc=L.c;if(m.look==='tower'||m.look==='mshot')lc=m.team===0?'#9ad0ff':m.team===1?'#ff9a8a':'#fff';const g=PG[L.shape==='hook'?'hook':L.shape]||PG.orb;const mesh=new THREE.Mesh(g,pmat(lc,L.shape==='rock'));const s=L.s*(L.shape==='orb'?1.2:1);mesh.scale.setScalar(s);if(L.shape==='wave')mesh.scale.set(L.s,1.6,L.s*.6);scene.add(mesh);v={m:mesh,L,c:col(L.trail||lc),lc};pviews.set(m,v);}
  v.m.visible=!!vis;if(!vis)continue;const y=m.homing?(m.y||1.3):(L.shape==='wave'?.6:1.3);v.m.position.set(m.x,y+MAP.height(m.x,m.z)*.5,m.z);const yaw=Math.atan2(m.dx||0,m.dz||1);v.m.rotation.set(0,yaw,0);if(L.shape==='star'){v.m.rotation.y=t*25;}if(L.shape==='rock'){v.m.rotation.x=t*8;}
  if(L.trail&&(gfx>0||Math.random()<.5)){const n=L.shape==='wave'?4:m.look==='tower'?2:1;for(let i=0;i<n;i++)parts.emit(m.x+(Math.random()-.5)*(L.shape==='wave'?3:.2),y+(Math.random()-.5)*.2,m.z+(Math.random()-.5)*(L.shape==='wave'?3:.2),(Math.random()-.5)*.8,.3+Math.random()*.6,(Math.random()-.5)*.8,v.c.r,v.c.g,v.c.b,L.s*.9,.3+Math.random()*.25);}
  if(m.tether&&m.src.alive)strips.add({x:m.src.x,y:1.4,z:m.src.z},{x:m.x,y:1.3,z:m.z},'#5ff0e0',.08,.03);
  if(m.look==='rail')strips.add({x:m.x-m.dx*6,y:1.3,z:m.z-m.dz*6},{x:m.x,y:1.3,z:m.z},'#9af8ff',.25,.12);}
 for(const[m,v]of pviews)if(!live.has(m)){scene.remove(v.m);pviews.delete(m);}}
/* ================= events -> effects, sounds, feed ================= */
const ELEM={brakka:['rock','rock','rock','rock'],oriel:['water','shield','water','water'],kaelen:['fire','shield','fire','fire'],ruusk:['heavy','roar','heavy','roar'],lyra:['star','star','star','star'],morrow:['ice','ice','blink','ice'],nyra:['wind','wind','wind','wind'],dex:['zap','zap','gun','zap'],elowen:['nature','heal','nature','nature'],kiro:['shadow','shadow','blink','shadow']};
const near=(x,z,r=60)=>Math.hypot(x-cam.x,z-cam.z)<r;
function burstAt(x,y,z,n,spd,c,size,life,o){if(gfx===0)n=Math.ceil(n*.5);parts.burst(x,y,z,n,spd,col(c),size,life,o);}
function boomFx(x,z,r,c,big){const h=MAP.height(x,z)+.3;burstAt(x,h+.5,z,big?60:28,r*3.2,c,.7,.7,{up:1,drag:2});burstAt(x,h+.3,z,big?30:14,r*2,'#ffffff',.4,.4,{up:1});shocks.fire(x,h,z,c,r*1.15,.5);
 decals.add({x,z,r:r*1.1,col:c,mode:2,life:.5,fade:1,grow:1});const cc=col(c);for(let i=0;i<(big?14:6);i++)smoke.emit(x+(Math.random()-.5)*r,h+.5,z+(Math.random()-.5)*r,(Math.random()-.5)*2,1+Math.random()*1.5,(Math.random()-.5)*2,cc.r*.4+.3,cc.g*.4+.3,cc.b*.4+.3,1.6,1.2,0,1,1.5);
 flash(x,h+2,z,c,big?120:50,r*4);if(near(x,z,30))shake=Math.max(shake,big?.9:.35);}
function feed(html,mine){const d=toast($('feed'),html,7000,6,false);if(!mine)d.classList.add('en');}
function banner(t,s,cls,dur=3){const b=$('banner');b.querySelector('b').textContent=t;b.querySelector('span').textContent=s||'';b.className='on '+(cls||'');bannerT=dur;}
const por=u=>u.kind==='champ'?`<img src="${portraits[u.def.id]}" alt="">`:'';
function floatTxt(x,y,z,txt,c,size=14,life=.9){if(floats.length>40)floats.shift();floats.push({x:x+(Math.random()-.5)*.8,y,z,txt,c,size,t:0,life,vx:(Math.random()-.5)*1.6});}
function processEvents(){for(const e of S.ev){try{handle(e);}catch(err){console.error(err);}}S.ev.length=0;}
function handle(e){const u=e.u;switch(e.k){
 case'atk':{if(u.kind==='champ'){if(!near(u.x,u.z))break;const w=u.def.look.weapon;snd.play(w==='bow'?'bow':w==='gun'?'gun':u.ranged?'magic':(w==='greatsword'||w==='anchor'||w==='fists')?'heavy':'swing',{x:u.x,y:0,z:u.z},.8);
   if(!u.ranged&&(gfx>0||Math.random()<.5)){const t=e.t,c=col(u.def.col);setTimeout(()=>{if(t&&t.alive)parts.burst(t.x,1.2,t.z,6,4,c,.35,.25);},140);}}
  else if(u.kind==='tower'){snd.play('tower',{x:u.x,y:0,z:u.z});flash(u.x,6.4,u.z,TEAMC[u.team],30,12);}
  else if(u.kind==='minion'&&Math.random()<.25&&near(u.x,u.z,30))snd.play(u.ranged?'mshot':'mhit',{x:u.x,y:0,z:u.z},.6);
  else if(u.kind==='monster'&&MON[u.mtype].boss&&near(u.x,u.z))snd.play(u.mtype==='drake'?'fire':'rock',{x:u.x,y:0,z:u.z},.6);break;}
 case'hit':{const L=LOOK[e.look]||LOOK.shot;const c=e.look==='tower'||e.look==='mshot'?(e.team===0?'#9ad0ff':'#ff9a8a'):L.c;if(!S.vis[pt][((e.z+100)>>1)*100+((e.x+100)>>1)])break;burstAt(e.x,1.2,e.z,e.look==='tower'?16:e.look==='mshot'?3:8,e.look==='tower'?6:4,c,e.look==='tower'?.6:.4,.3);if(e.look==='tower'){snd.play('towerhit',{x:e.x,y:0,z:e.z});flash(e.x,1.5,e.z,c,30,10);}break;}
 case'cast':{const s=ELEM[u.def.id][e.i];if(near(u.x,u.z))snd.play(s,{x:u.x,y:0,z:u.z});const c=col(u.def.col);if(u.team===pt||S.seen(pt,u)){burstAt(u.x,1.6,u.z,10,3,u.def.col,.45,.4,{up:1});flash(u.x,2,u.z,u.def.col,20,8);}if(u===me)hud.pulse=e.i;break;}
 case'cone':{const ang=Math.atan2(e.dx,e.dz);decals.add({x:e.x,z:e.z,r:e.r,col:e.col,mode:3,half:e.half,rot:ang,life:.35,fade:1});const c=col(e.col);for(let i=0;i<24;i++){const a=ang+(Math.random()*2-1)*e.half,rr=Math.random()*e.r;parts.emit(e.x+Math.sin(a)*rr,1+Math.random(),e.z+Math.cos(a)*rr,Math.sin(a)*3,1,Math.cos(a)*3,c.r,c.g,c.b,.5,.4);}break;}
 case'nova':boomFx(e.x,e.z,e.r,e.col,false);break;
 case'quake':boomFx(e.x,e.z,e.r,e.col,false);burstAt(e.x,.4,e.z,20,6,'#8a7a60',.5,.9,{up:1,grav:9});break;
 case'zone':{const z=e.z;const tc=z.col||'#fff';if(z.delay>0)decals.add({x:z.x,z:z.z,r:z.r,col:z.team===pt?tc:(z.team===2?'#ff8a5a':'#ff5a5a'),mode:0,life:z.delay,prog:()=>Math.min(1,z.t/z.delay)});
  if(z.dur>0)decals.add({x:z.x,z:z.z,r:z.r,col:tc,mode:1,life:99,follow:z.follow?()=>z.follow.alive?z.follow:null:null,alive:()=>S.zones.includes(z)&&(!z.delay||z.fired),pulse:1});
  if(z.lob&&z.src){const s=z.src;strips.add({x:s.x,y:1.5,z:s.z},{x:z.x,y:.5,z:z.z},tc,.06,.3);}break;}
 case'boom':{const z=e.z;if(!z.dur||z.delay){const big=z.look==='supernova'||z.look==='quake'&&z.r>4;boomFx(z.x,z.z,z.r,z.col||'#fff',big);snd.play(big?'big':'boom',{x:z.x,y:0,z:z.z},big?1:.7);
   if(z.look==='star'||z.look==='supernova'){strips.add({x:z.x,y:22,z:z.z-6},{x:z.x,y:.5,z:z.z},'#ffe8b0',big?1.2:.5,.25);}}break;}
 case'blink':{for(const[x,z]of[[e.x0,e.z0],[e.x1,e.z1]])burstAt(x,1.2,z,22,5,e.col||'#ffe08a',.5,.4);strips.add({x:e.x0,y:1.2,z:e.z0},{x:e.x1,y:1.2,z:e.z1},e.col||'#ffe08a',.3,.2);if(near(e.x1,e.z1))snd.play('blink',{x:e.x1,y:0,z:e.z1});break;}
 case'dash':{if(e.trail||e.arc)burstAt(u.x,1,u.z,10,3,e.trail==='fire'?'#ff7a2a':e.trail==='wind'?'#c8ffb0':'#c8c8c8',.5,.4);break;}
 case'heal':{if(e.n>15&&(u.team===pt||S.seen(pt,u))){burstAt(u.x,1,u.z,8,2,'#7dff9a',.4,.7,{up:2});if(u===me||u.team===pt)floatTxt(u.x,2.6,u.z,'+'+Math.round(e.n),'#7dff9a',13);}break;}
 case'ring':case'bloom':{shocks.fire(u.x,MAP.height(u.x,u.z),u.z,e.col,2.2,.5,1);burstAt(u.x,1.2,u.z,16,3,e.col,.45,.6,{up:1});if(near(u.x,u.z))snd.play(e.k==='bloom'?'heal':'shield',{x:u.x,y:0,z:u.z});break;}
 case'splash':case'starhit':case'hitbig':burstAt(e.x,1.2,e.z,e.k==='hitbig'?14:18,5,e.col,.55,.4);if(e.k==='starhit')strips.add({x:e.x,y:12,z:e.z},{x:e.x,y:.5,z:e.z},e.col,.3,.2);break;
 case'zap':strips.add({x:e.x0,y:1.5,z:e.z0},{x:e.x1,y:1.2,z:e.z1},e.col,.12,.18,6);if(near(e.x1,e.z1))snd.play('zap',{x:e.x1,y:0,z:e.z1},.5);break;
 case'verdict':strips.add({x:e.x,y:16,z:e.z},{x:e.x,y:0,z:e.z},'#ffb050',.9,.35);boomFx(e.x,e.z,2.5,e.col,true);snd.play('fire',{x:e.x,y:0,z:e.z});break;
 case'smoke':{const c=col(e.col);for(let i=0;i<20;i++)smoke.emit(e.x+(Math.random()-.5)*2,.8+Math.random(),e.z+(Math.random()-.5)*2,(Math.random()-.5)*2,.6,(Math.random()-.5)*2,c.r*.5,c.g*.5,c.b*.5,1.8,1,0,1,1);break;}
 case'cc':if(e.k2)break;if(u.kind==='champ'&&near(u.x,u.z,35))snd.play('stun',{x:u.x,y:0,z:u.z},.5);break;
 case'strike':strips.add({x:e.x,y:14,z:e.z},{x:e.x,y:.5,z:e.z},'#ffb21e',.6,.25,5);boomFx(e.x,e.z,1.5,'#ffb21e',false);snd.play('zap',{x:e.x,y:0,z:e.z});break;
 case'spell':if(e.id==='haste'&&near(u.x,u.z))snd.play('wind',{x:u.x,y:0,z:u.z});break;
 case'dmg':{const t=u;if(!(e.src===me||t===me&&e.src&&(e.src.kind==='champ'||e.src.kind==='tower'||e.src.boss)))break;if(e.n<4||t===me&&e.n<20)break;const c=t===me?'#ff6a6a':e.type==='m'?'#9ab8ff':e.type==='t'?'#ffffff':(e.crit?'#ff9a2a':'#ffe0a0');floatTxt(t.x,2.4,t.z,Math.round(e.n)+(e.crit?'!':''),c,e.crit?16:t===me?12:13,.7);break;}
 case'gold':if(u===me){floatTxt(e.x,2.8,e.z,'+'+Math.round(e.n)+'g','#f0c45a',14,1.1);snd.play('gold',null,.6);}break;
 case'lvl':{if(u.team===pt||S.seen(pt,u)){const c=col('#ffe08a');for(let i=0;i<30;i++){const a=i/30*6.28;parts.emit(u.x+Math.cos(a)*1,.3,u.z+Math.sin(a)*1,0,3+Math.random()*3,0,c.r,c.g,c.b,.45,.8);}}if(u===me){snd.play('lvl');floatTxt(u.x,3.2,u.z,'LEVEL '+u.lvl,'#ffe08a',18,1.4);}break;}
 case'kill':{const k=e.killer,v=e.victim,mine=v.team!==pt;const kn=k?`${por(k)}<span>${k.name}</span>`:'<span>Execution</span>';
  feed(`${kn}<span class="x">⚔</span>${por(v)}<span>${v.name}</span>${e.assists.length?`<span class="n">+${e.assists.length}</span>`:''}`,mine);
  burstAt(v.x,1.2,v.z,40,6,mine?'#9ad0ff':'#ff6a6a',.6,.8,{up:1});if(near(v.x,v.z))snd.play('die',{x:v.x,y:0,z:v.z});
  if(v===me){banner('YOU HAVE BEEN SLAIN',k?'by '+k.name:'','red',3);snd.play('dead');snd.announce('You have been slain');}
  else if(k===me){const m=e.multi>=5?'PENTA KILL':e.multi===4?'QUADRA KILL':e.multi===3?'TRIPLE KILL':e.multi===2?'DOUBLE KILL':'ENEMY SLAIN';banner(m,v.name,'gold',2.5);snd.play('kill');snd.announce(m.toLowerCase());}
  else if(e.multi>=2&&k){banner((e.multi>=3?'TRIPLE':'DOUBLE')+' KILL',k.name,mine?'blue':'red',2.2);}
  else if(mine){if(Math.random()<.5)snd.announce('Enemy slain');}else{if(Math.random()<.5)snd.announce('An ally has been slain');}
  if(e.assists.includes(me))floatTxt(v.x,3,v.z,'ASSIST','#9ad0ff',15,1.2);break;}
 case'first':banner('FIRST BLOOD',e.u.name,e.u.team===pt?'gold':'red',3);snd.announce('First blood');break;
 case'struct':{const mine=u.team!==pt;const nm=u.kind==='core'?'AEON HEART':u.kind==='inhib'?'INHIBITOR':'TOWER';boomFx(u.x,u.z,u.kind==='core'?8:4,TEAMC[u.team],true);burstAt(u.x,3,u.z,50,9,'#a09a8c',.8,1.4,{up:1,grav:10});snd.play('big',{x:u.x,y:0,z:u.z},1);
  feed(`<span>${mine?'ENEMY':'ALLIED'} ${nm} DESTROYED</span><span class="n">${u.lane&&u.lane!=='core'?u.lane.toUpperCase():''}</span>`,mine);if(u.kind!=='core'){banner(mine?'ENEMY '+nm+' DESTROYED':'YOUR '+nm+' HAS FALLEN','',mine?'blue':'red',2.5);snd.announce(mine?'Enemy '+nm.toLowerCase()+' destroyed':'Your '+nm.toLowerCase()+' has been destroyed');}break;}
 case'inhibup':feed(`<span>${u.team===pt?'ALLIED':'ENEMY'} INHIBITOR RESPAWNED</span>`,u.team===pt);break;
 case'boss':{const nm=e.boss==='drake'?'EMBER DRAKE':'AEON WARDEN',mine=e.team===pt;banner((mine?'YOUR TEAM':'ENEMY TEAM')+' SLEW THE '+nm,e.boss==='drake'?'+6% damage for the whole team':'Aeon Mantle: +30 AD, +45 AP, empowered minions',mine?'gold':'red',3.5);snd.play('roar',null,.7);snd.announce((mine?'Your team':'The enemy')+' has slain the '+nm.toLowerCase());feed(`<span>${mine?'ALLIES':'ENEMIES'} SLEW THE ${nm}</span>`,mine);break;}
 case'bossup':{const nm=e.boss==='drake'?'EMBER DRAKE':'AEON WARDEN';banner('THE '+nm+' HAS AWAKENED',e.boss==='drake'?'Lower river · southeast':'Upper river · northwest','gold',3);snd.play('roar',null,.5);break;}
 case'recall':if(u===me)snd.play('recall');break;
 case'recalled':burstAt(u.x,1,u.z,30,5,'#7ac8ff',.5,.8,{up:2});break;
 case'buy':if(u===me)snd.play('buy');break;
 case'respawn':if(u===me){banner('RESPAWNED','','blue',1.5);}break;
 case'wave':if(e.n===1){banner('MINIONS HAVE SPAWNED','','gold',2.5);snd.announce('Minions have spawned');snd.play('horn');}break;
 case'mdie':if(u.kind==='monster'&&MON[u.mtype].boss){boomFx(u.x,u.z,6,MON[u.mtype].boss==='drake'?'#ff8a2a':'#b080ff',true);}break;
 case'aggro':if(e.t===me){floatTxt(me.x,3.4,me.z,'TOWER TARGETING YOU','#ff5a5a',13,1.2);snd.play('deny',null,.6);}break;
 case'end':break;}}
/* ================= input ================= */
const I=controls(canvas,{canLock:()=>false,menu:()=>true,onKey:(e,first)=>{if(app!=='play')return;if(['Tab','Space','KeyQ','KeyW','KeyE','KeyR','KeyD','KeyF'].includes(e.code)||e.code.startsWith('Digit'))e.preventDefault();if(first)keyDown(e);}});
let mx=innerWidth/2,my=innerHeight/2,mIn=true,aArm=false,rHoldT=0,hover=null,gx=0,gz=0,wasdMoving=false;
addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;mIn=true;});document.addEventListener('mouseleave',()=>mIn=false);
addEventListener('wheel',e=>{if(app==='play'&&e.target===canvas)cam.zoom=cl(cam.zoom+Math.sign(e.deltaY)*3,24,56);},{passive:true});
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitP=new THREE.Vector3(),prj=new THREE.Vector3();
function groundAt(px,py){ndc.set(px/innerWidth*2-1,-(py/innerHeight)*2+1);ray.setFromCamera(ndc,camera);if(!ray.ray.intersectPlane(plane,hitP))return null;return[hitP.x,hitP.z];}
function scr(x,y,z){prj.set(x,y,z).project(camera);return[(prj.x*.5+.5)*innerWidth,(-prj.y*.5+.5)*innerHeight,prj.z];}
function pickUnit(px,py,f){let best=null,bd=1e9;for(const u of S.units){if(!u.alive||u.untarget||u.kind==='fountain')continue;if(f&&!f(u))continue;if(u.team!==pt&&!S.seen(pt,u))continue;const hh=u.struct?(u.kind==='core'?5:u.kind==='inhib'?2.5:4):u.kind==='champ'?1.2:u.kind==='ward'?.8:Math.max(.8,u.r);
 const[sx,sy]=scr(u.x,hh,u.z);const[ex,ey]=scr(u.x+Math.max(1,u.r*1.2),hh,u.z);const rr=Math.max(18,Math.abs(ex-sx)*(u.struct?1.6:1.4));const d=Math.hypot(sx-px,sy-py);if(d<rr&&d<bd){bd=d;best=u;}}return best;}
const isFoe=u=>u.team!==pt&&!u.struct||u.team!==pt&&u.struct&&u.kind!=='fountain'&&S.attackable(u);
function marker(x,z,c){decals.add({x,z,r:.9,col:c,mode:2,life:.35,fade:1,grow:1});}
function keyDown(e){const c=e.code;
 if(c==='Escape'){if(!$('shop').hidden){$('shop').hidden=true;return;}setPause(!paused);return;}
 if(paused)return;if(c==='KeyP'){toggleShop();return;}if(c==='KeyY'){camLock=!camLock;hint(camLock?'CAMERA LOCKED':'CAMERA FREE');return;}
 const wasd=opt.ctl==='wasd';
 const abil=wasd?{Digit1:0,Digit2:1,Digit3:2,Digit4:3}:{KeyQ:0,KeyW:1,KeyE:2,KeyR:3};const sp=wasd?{KeyZ:0,KeyX:1}:{KeyD:0,KeyF:1};
 if(c in abil){const i=abil[c];if(e.ctrlKey||e.altKey){if(S.levelUp(me,i))snd.play('lvl',null,.4);return;}castAt(i);return;}
 if(c in sp){spellAt(sp[c]);return;}
 if(c===(wasd?'KeyC':'Digit4')){if(S.ward(me,gx,gz))snd.play('click');return;}
 if(c==='KeyB'){S.recallStart(me);return;}
 if(!wasd&&c==='KeyS'){S.order(me,null);return;}if(!wasd&&c==='KeyA'){aArm=true;document.body.classList.add('aim');return;}}
function hint(t){const h=$('hint');h.textContent=t;h.classList.add('on');clearTimeout(hint.tm);hint.tm=setTimeout(()=>h.classList.remove('on'),1400);}
function castAt(i){const a=S.abil(me,i);if(!me.alive)return;if(!me.ab[i]){hint('Ability not learned yet');snd.play('deny');return;}
 if(me.cd[i]>0){hint(a.name+' is on cooldown');snd.play('deny');return;}if(me.mp<a.cost[me.ab[i]-1]){hint('Not enough mana');snd.play('deny');return;}
 let t=null;if(a.type==='target'){t=hover&&hover.alive&&!hover.struct&&(a.any||hover.team!==pt)&&hover!==me?hover:nearestTo(gx,gz,4,u=>u.team!==pt&&u.kind==='champ')||nearestTo(gx,gz,2.5,u=>u.team!==pt&&!u.struct);if(!t){hint('Select a target');snd.play('deny');return;}}
 if(a.type==='ally'){t=hover&&hover.team===pt&&hover.kind==='champ'?hover:nearestTo(gx,gz,3,u=>u.team===pt&&u.kind==='champ')||me;}
 const r=S.cast(me,i,gx,gz,t);if(!r){snd.play('deny');}}
function spellAt(k){const s=me.spells[k];if(!s||!me.alive)return;let t=null;
 if(s.id==='strike')t=hover&&(hover.kind==='monster'||hover.kind==='minion')&&hover.team!==pt?hover:nearestTo(me.x,me.z,6.5,u=>u.kind==='monster')||nearestTo(gx,gz,3,u=>u.kind==='minion'&&u.team!==pt);
 if(s.id==='scorch')t=hover&&hover.kind==='champ'&&hover.team!==pt?hover:nearestTo(me.x,me.z,7.5,u=>u.kind==='champ'&&u.team!==pt);
 if(!S.spell(me,k,gx,gz,t)){snd.play('deny');hint(s.cd>0?SPELLS[s.id].n+' is on cooldown':'No valid target');}}
function nearestTo(x,z,r,f){let b=null,bd=r*r;for(const u of S.units){if(!u.alive||u.untarget||u.struct||!f(u))continue;if(u.team!==pt&&!S.seen(pt,u))continue;const d=(u.x-x)**2+(u.z-z)**2;if(d<bd){bd=d;b=u;}}return b;}
function input(dt){const m=I.mouse,K=I.keys;const g=groundAt(mx,my);if(g){gx=g[0];gz=g[1];}
 hover=mIn?pickUnit(mx,my):null;document.body.classList.toggle('foe',!!(hover&&hover.team!==pt&&isFoe(hover)));
 if(paused||!me){m.le=m.re=false;I.flush();return;}
 const wasd=opt.ctl==='wasd';
 if(wasd){let dx=(K.KeyD?1:0)-(K.KeyA?1:0),dz=(K.KeyS?1:0)-(K.KeyW?1:0);if(me.alive&&(dx||dz)){const l=Math.hypot(dx,dz);const tx=me.x+dx/l*3,tz=me.z+dz/l*3;S.order(me,{k:'move',x:tx,z:tz});wasdMoving=true;}else if(wasdMoving){wasdMoving=false;if(me.ord&&me.ord.k==='move')S.order(me,null);}
  if(m.le){m.le=false;if(hover&&isFoe(hover))S.order(me,{k:'atk',t:hover});else{S.order(me,{k:'amove',x:gx,z:gz});marker(gx,gz,'#ff6a5a');}}if(m.re){m.re=false;S.order(me,{k:'move',x:gx,z:gz});marker(gx,gz,'#7dff9a');}}
 else{if(m.le){m.le=false;if(aArm){aArm=false;document.body.classList.remove('aim');if(hover&&isFoe(hover))S.order(me,{k:'atk',t:hover});else{S.order(me,{k:'amove',x:gx,z:gz});marker(gx,gz,'#ff6a5a');}}}
  if(m.re){m.re=false;rHoldT=.15;aArm=false;document.body.classList.remove('aim');if(hover&&isFoe(hover)){S.order(me,{k:'atk',t:hover});decals.add({x:hover.x,z:hover.z,r:hover.r+.8,col:'#ff4a3a',mode:2,life:.3,fade:1});}else{S.order(me,{k:'move',x:gx,z:gz});marker(gx,gz,'#7dff9a');}}
  else if(m.r&&me.alive){rHoldT-=dt;if(rHoldT<=0){rHoldT=.12;if(!(me.ord&&me.ord.k==='atk'))S.order(me,{k:'move',x:gx,z:gz});}}}
 board(K.Tab);I.flush();}
/* ================= camera ================= */
function cameraUpdate(dt){if(app==='menu'||!S){const a=menuT*.05;cam.x=Math.sin(a)*40;cam.z=Math.cos(a*.7)*30;cam.zoom=70;}
 else{const follow=camLock||I.keys.Space||(app==='play'&&opt.ctl==='wasd');
  if(follow&&me){cam.tx=me.x;cam.tz=me.z;}
  else if(app==='play'&&mIn&&!paused&&document.hasFocus()){const e=16,sp=48*dt*(cam.zoom/44);if(mx<e)cam.tx-=sp;if(mx>innerWidth-e)cam.tx+=sp;if(my<e)cam.tz-=sp;if(my>innerHeight-e)cam.tz+=sp;}
  if(app==='over'&&S.over){const c=S.units.find(u=>u.kind==='core'&&u.team!==S.over.win);if(c){cam.tx=c.x;cam.tz=c.z;}}
  cam.tx=cl(cam.tx,-95,95);cam.tz=cl(cam.tz,-92,98);const k=1-Math.exp(-dt*(follow?12:20));cam.x+=(cam.tx-cam.x)*k;cam.z+=(cam.tz-cam.z)*k;}
 const pitch=56*Math.PI/180,D=cam.zoom;camera.position.set(cam.x,D*Math.sin(pitch),cam.z+D*Math.cos(pitch));camera.lookAt(cam.x,0,cam.z);
 if(shake>0){shake=Math.max(0,shake-dt*2.2);const s=shake*shake*.5;camera.position.x+=(Math.random()-.5)*s;camera.position.z+=(Math.random()-.5)*s;}
 sun.position.set(cam.x-30,70,cam.z+18);sun.target.position.set(cam.x,0,cam.z-4);snd.listener(cam.x,0,cam.z,0);}
/* ================= HUD ================= */
const hud={t:0,pulse:-1};
function buildHud(){const d=me.def;$('mePor').src=portraits[d.id];
 const ab=$('abs');ab.innerHTML='';const wasd=opt.ctl==='wasd';const keys=wasd?['1','2','3','4']:['Q','W','E','R'],sk=wasd?['Z','X']:['D','F'];
 const mk=(cls,img,key)=>{const e=document.createElement('div');e.className='ab '+cls;e.style.backgroundImage=`url(${img})`;e.innerHTML=`<div class="cd"></div><div class="t"></div>${key?`<kbd>${key}</kbd>`:''}<div class="pips"></div><span class="mc"></span><span class="ch"></span>`;ab.appendChild(e);return e;};
 hud.pas=mk('pas',icon(d.passive.g,d.col),'');hud.pas.title=d.passive.name+': '+d.passive.d;
 hud.ab=['Q','W','E','R'].map((k,i)=>{const e=mk('',icon(d[k].g,d.col),keys[i]);e.title=d[k].name+': '+d[k].d;const p=e.querySelector('.pips');for(let j=0;j<(i===3?3:5);j++)p.appendChild(document.createElement('i'));return e;});
 ab.appendChild(Object.assign(document.createElement('div'),{className:'gap'}));
 hud.sp=me.spells.map((s,k)=>{const e=mk('sm',icon(SPELLS[s.id].g,SPELLS[s.id].col),sk[k]);e.title=SPELLS[s.id].n+': '+SPELLS[s.id].d;return e;});
 hud.ward=mk('sm',icon('eye','#f0c45a'),wasd?'C':'4');hud.ward.title='Warding Totem: place a ward that reveals the area for 90 s.';
 const al=$('allies');al.innerHTML='';hud.allies=S.champs.filter(c=>c.team===pt&&c!==me).map(c=>{const e=document.createElement('div');e.className='ally';e.innerHTML=`<img src="${portraits[c.def.id]}" alt=""><b>1</b><em></em><div class="hb"><i></i></div>`;e.title=c.name+' · '+ROLE_N[c.role];al.appendChild(e);return{c,e};});
 hud.itemsSig='';hud.t=0;}
function hudUpdate(dt){hud.t-=dt;if(hud.t>0)return;hud.t=.1;const u=me,st=u.st;
 $('kA').textContent=S.kills[0];$('kB').textContent=S.kills[1];$('tA').textContent=S.towersK[0];$('tB').textContent=S.towersK[1];$('dA').textContent=S.drakes[0]?'◆'.repeat(S.drakes[0]):'';$('dB').textContent=S.drakes[1]?'◆'.repeat(S.drakes[1]):'';
 $('clock').textContent=fmtT(S.t);const left=S.len-S.t;$('left').textContent=left<60?'FINAL MINUTE · '+Math.ceil(left)+'s':fmtT(left)+' LEFT';
 $('myKDA').textContent=`${u.k}/${u.d}/${u.a}`;$('myCS').textContent=u.cs;
 $('hpFill').style.width=(u.hp/st.hp*100)+'%';const sh=u.shield;$('hpShield').style.left=(u.hp/st.hp*100)+'%';$('hpShield').style.width=Math.min(100-u.hp/st.hp*100,sh/st.hp*100)+'%';$('hpTxt').textContent=`${Math.ceil(u.hp)} / ${Math.round(st.hp)}`+(sh>1?` (+${Math.round(sh)})`:'');
 $('mpFill').style.width=(u.mp/st.mp*100)+'%';$('mpTxt').textContent=`${Math.floor(u.mp)} / ${Math.round(st.mp)}`;
 $('meLvl').textContent=u.lvl;$('xpRing').style.strokeDasharray=`${(u.lvl>=18?1:u.xp/XPNEED(u.lvl))*289} 300`;
 $('gold').textContent=Math.floor(u.gold);
 $('stats').innerHTML=`<span>AD</span><b>${Math.round(st.ad)}</b><span>AP</span><b>${Math.round(st.ap)}</b><span>ARM</span><b>${Math.round(st.ar)}</b><span>MR</span><b>${Math.round(st.mr)}</b><span>AS</span><b>${st.as.toFixed(2)}</b><span>MS</span><b>${Math.round(st.ms*75)}</b><span>CDR</span><b>${Math.round(st.cdr*100)}%</b><span>RNG</span><b>${Math.round(st.rng*75)}</b>`;
 hud.ab.forEach((e,i)=>{const a=S.abil(u,i),r=u.ab[i],cd=u.cd[i],max=r?a.cd[r-1]*(1-st.cdr):1;e.querySelector('.cd').style.setProperty('--p',cd>0?(cd/max*100)+'%':'0%');e.querySelector('.t').textContent=cd>0?(cd<1?cd.toFixed(1):Math.ceil(cd)):'';
  e.classList.toggle('off',!r);e.classList.toggle('nomp',r&&u.mp<a.cost[r-1]);e.classList.toggle('up',S.canLevel(u,i)&&!S.o.autoLvl);e.querySelectorAll('.pips i').forEach((p,j)=>p.classList.toggle('on',j<r));e.querySelector('.mc').textContent=r?a.cost[r-1]:'';});
 hud.sp.forEach((e,k)=>{const s=u.spells[k],max=SPELLS[s.id].cd/Math.sqrt(S.T);const cd=s.id==='strike'?(s.ch>0?0:50/S.T-(s.rt||0)):s.cd;e.querySelector('.cd').style.setProperty('--p',cd>0?(cd/(s.id==='strike'?50/S.T:max)*100)+'%':'0%');e.querySelector('.t').textContent=cd>0?Math.ceil(cd):'';e.querySelector('.ch').textContent=s.id==='strike'?s.ch:'';});
 hud.ward.querySelector('.ch').textContent=u.wards;hud.ward.classList.toggle('off',!u.wards);
 const sig=u.items.join();if(sig!==hud.itemsSig){hud.itemsSig=sig;const it=$('items');it.innerHTML='';for(let k=0;k<6;k++){const id=u.items[k];const e=document.createElement('div');e.className='it';if(id){e.style.backgroundImage=`url(${icon(ITEMS[id].g,ITEMS[id].col)})`;e.title=ITEMS[id].n;}it.appendChild(e);}}
 for(const{c,e}of hud.allies){e.classList.toggle('dead',!c.alive);e.querySelector('b').textContent=c.lvl;e.querySelector('em').textContent=c.alive?'':Math.ceil(c.respawn);e.querySelector('.hb i').style.width=(c.alive?c.hp/c.st.hp*100:0)+'%';let uu=e.querySelector('.u');const ready=c.ab[3]>0&&c.cd[3]<=0;if(ready&&!uu){uu=document.createElement('i');uu.className='u';e.appendChild(uu);}else if(!ready&&uu)uu.remove();}
 $('dead').hidden=u.alive;if(!u.alive)$('rsp').textContent=Math.ceil(u.respawn);
 $('recallbar').hidden=!u.recall;if(u.recall)$('recallFill').style.width=((1-u.recall/u.recallMax)*100)+'%';
 // target info: hovered unit
 const t=hover&&hover!==me?hover:null;$('tinfo').hidden=!t;if(t){let nm,sub,img='';if(t.kind==='champ'){nm=t.name;sub=`LEVEL ${t.lvl} · ${t.def.role} · ${t.team===pt?'ALLY':'ENEMY'}`;img=portraits[t.def.id];}else if(t.kind==='monster'){const m=MON[t.mtype];nm=m.n;sub='NEUTRAL MONSTER';const mi=MON_ICON[t.mtype];img=icon(mi[0],mi[1]);}
  else if(t.kind==='minion'){nm=t.mtype.toUpperCase()+' MINION';sub=t.team===pt?'ALLY':'ENEMY';img=icon(t.mtype==='caster'?'orb':t.mtype==='siege'?'grenade':'sword',TEAMC[t.team]);}else{nm=t.kind==='core'?'AEON HEART':t.kind.toUpperCase();sub=(S.attackable(t)?'':'INVULNERABLE · ')+(t.team===pt?'ALLIED':'ENEMY')+' STRUCTURE';img=icon('shield',TEAMC[t.team]);}
  $('tiName').textContent=nm;$('tiSub').textContent=sub;$('tiPor').src=img;$('tiHp').style.width=(t.hp/(t.st.hp||1)*100)+'%';$('tiHp').style.background=t.team===pt?'#4ad46a':'#e84a4a';
  $('tiStats').textContent=t.kind==='champ'?`HP ${Math.ceil(t.hp)}/${Math.round(t.st.hp)} · AD ${Math.round(t.st.ad)} · AP ${Math.round(t.st.ap)} · ARM ${Math.round(t.st.ar)} · MR ${Math.round(t.st.mr)} · ${t.k}/${t.d}/${t.a}`:`HP ${Math.ceil(t.hp)} / ${Math.round(t.st.hp)}`+(t.st.ad?` · AD ${Math.round(t.st.ad)}`:'');}
 if(!$('shop').hidden)shopRefresh();
 snd.music(true,Math.min(1,S.champs.filter(c=>c.alive&&S.t-c.lastFight<3&&Math.hypot(c.x-cam.x,c.z-cam.z)<30).length/4));}
/* ---------- overlay: health bars, names, floating text ---------- */
function overlay(dt){const W=innerWidth,H=innerHeight,dpr=ov.width/W;ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,W,H);if(!S||app==='menu'||noBars)return;
 const k=cl(40/cam.zoom,.85,1.25);
 for(const u of S.units){if(!u.alive||u.kind==='fountain')continue;if(u.team!==pt&&!S.seen(pt,u))continue;
  const hh=u.kind==='champ'?3.6*(u.size||1)*(u.def.look.body==='golem'?1.1:1):u.kind==='minion'?(u.mtype==='super'?3.4:u.mtype==='siege'?2.4:2):u.kind==='monster'?(u.boss?u.r*2.6+1:u.r*2+1):u.kind==='tower'?8.6:u.kind==='inhib'?5.6:u.kind==='core'?11:u.kind==='ward'?1.8:2;
  const[sx,sy,sz]=scr(u.x,MAP.height(u.x,u.z)+hh,u.z);if(sz>1||sx<-80||sx>W+80||sy<-40||sy>H+40)continue;
  const f=u.hp/(u.st.hp||1),ally=u.team===pt;let w,h=5;
  if(u.kind==='champ'){w=96*k;h=9*k;const x0=sx-w/2,y0=sy;ox.fillStyle='rgba(6,8,14,.85)';ox.fillRect(x0-2-18*k,y0-2,w+4+18*k,h+4+5*k);ox.fillStyle=u===me?'#5ae07a':ally?'#4aa8ff':'#e8444a';ox.fillRect(x0,y0,w*f,h);
   const s=u.shield;if(s>1)ox.fillStyle='rgba(255,255,255,.85)',ox.fillRect(x0+w*f,y0,Math.min(w*(1-f),w*s/u.st.hp),h);
   ox.strokeStyle='rgba(0,0,0,.55)';ox.lineWidth=1;for(let hp=100;hp<u.st.hp;hp+=100){const xx=x0+w*hp/u.st.hp;ox.beginPath();ox.moveTo(xx,y0);ox.lineTo(xx,y0+(hp%1000?h*.5:h));ox.stroke();}
   ox.fillStyle='#2a6ad8';ox.fillRect(x0,y0+h+1,w*(u.mp/(u.st.mp||1)),3*k);
   ox.fillStyle='#0b0f18';ox.fillRect(x0-18*k,y0-1,16*k,h+2+4*k);ox.fillStyle='#f0c45a';ox.font=`700 ${Math.round(10*k)}px JetBrains Mono,monospace`;ox.textAlign='center';ox.textBaseline='middle';ox.fillText(u.lvl,x0-10*k,y0+h/2+2*k);
   ox.font=`700 ${Math.round(10*k)}px JetBrains Mono,monospace`;ox.textBaseline='alphabetic';ox.fillStyle=u===me?'#f0c45a':ally?'#bfe0ff':'#ffc0c0';ox.shadowColor='#000';ox.shadowBlur=3;ox.fillText(u.name,sx,y0-5*k);ox.shadowBlur=0;
   if(u.recall>0){ox.fillStyle='#7ac8ff';ox.fillRect(x0,y0-15*k,w*(1-u.recall/u.recallMax),3);}
   const ccs=u.cc.stun||u.cc.air?'STUNNED':u.cc.root?'ROOTED':u.cc.silence?'SILENCED':'';if(ccs){ox.fillStyle='#ffe08a';ox.font=`700 ${Math.round(9*k)}px JetBrains Mono,monospace`;ox.fillText(ccs,sx,y0+h+16*k);}continue;}
  if(u.kind==='minion'){if(f>=1&&!(hover===u))continue;w=(u.mtype==='super'||u.mtype==='siege'?44:32)*k;h=4*k;}else if(u.kind==='monster'){if(f>=1&&!u.aggro&&hover!==u)continue;w=(u.boss?150:60)*k;h=(u.boss?8:5)*k;}else if(u.struct){w=110*k;h=7*k;}else{w=24*k;h=4*k;}
  const x0=sx-w/2;ox.fillStyle='rgba(6,8,14,.85)';ox.fillRect(x0-1,sy-1,w+2,h+2);ox.fillStyle=u.team===2?'#e8a03a':ally?(u.kind==='minion'?'#5aa8ff':'#4aa8ff'):'#e8444a';ox.fillRect(x0,sy,w*f,h);
  if(u.kind==='minion'&&!ally&&me.alive&&u.hp<me.st.ad*(100/(100+Math.max(0,u.st.ar)))){ox.strokeStyle='#fff';ox.lineWidth=1.5;ox.strokeRect(x0-1.5,sy-1.5,w+3,h+3);}
  if(u.struct&&!S.attackable(u)){ox.fillStyle='rgba(240,196,90,.9)';ox.font=`700 ${Math.round(9*k)}px JetBrains Mono,monospace`;ox.textAlign='center';ox.fillText('◆ PROTECTED',sx,sy-4);}
  if(u.kind==='monster'&&u.boss){ox.fillStyle='#ffe0b0';ox.font=`700 ${Math.round(11*k)}px JetBrains Mono,monospace`;ox.textAlign='center';ox.fillText(MON[u.mtype].n.toUpperCase(),sx,sy-5);}}
 // floating numbers
 ox.textAlign='center';for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.t+=dt;if(f.t>f.life){floats.splice(i,1);continue;}const[sx,sy,sz]=scr(f.x+f.vx*f.t,f.y+f.t*1.6,f.z);if(sz>1)continue;const a=Math.min(1,(f.life-f.t)*3),pop=1+Math.max(0,.15-f.t)*3;
  ox.globalAlpha=a;ox.font=`700 ${Math.round(f.size*pop*k)}px JetBrains Mono,monospace`;ox.lineWidth=3;ox.strokeStyle='rgba(0,0,0,.8)';ox.strokeText(f.txt,sx,sy);ox.fillStyle=f.c;ox.fillText(f.txt,sx,sy);}ox.globalAlpha=1;}
/* ---------- minimap ---------- */
const mini=$('mini'),mx2=mini.getContext('2d');let miniBg=null,miniT=0;const fogC=document.createElement('canvas');fogC.width=fogC.height=100;const fogX=fogC.getContext('2d'),fogImg=fogX.createImageData(100,100);
function miniBackground(){const c=document.createElement('canvas');c.width=c.height=220;const x=c.getContext('2d'),img=x.createImageData(220,220);
 for(let j=0;j<220;j++)for(let i=0;i<220;i++){const wx=(i/220)*200-100,wz=(j/220)*200-100,f=MAP.field(wx,wz),lk=MAP.laneK(wx,wz),rk=MAP.riverK(wx,wz);let r=58,g=98,b=56;if(lk>0){r+=(150-r)*lk;g+=(120-g)*lk;b+=(80-b)*lk;}if(rk>.3){r=40;g=100;b=120;}
  for(let t=0;t<2;t++){const d=Math.hypot(wx-MAP.CORE[t][0],wz-MAP.CORE[t][1]);if(d<MAP.BASE_R){r=t?130:100;g=t?100:110;b=t?100:140;}}if(f>0){const k=Math.min(1,f/2);r=r*(1-k)+22*k;g=g*(1-k)+46*k;b=b*(1-k)+30*k;}const o=(j*220+i)*4;img.data[o]=r;img.data[o+1]=g;img.data[o+2]=b;img.data[o+3]=255;}
 x.putImageData(img,0,0);return c;}
const portImg={};function pimg(id){if(!portImg[id]){const im=new Image();im.src=portraits[id];portImg[id]=im;}return portImg[id];}
function minimap(dt){miniT-=dt;if(miniT>0)return;miniT=.1;if(!miniBg)miniBg=miniBackground();const W=mini.width,s=W/200,P=(x,z)=>[(x+100)*s,(z+100)*s];
 mx2.drawImage(miniBg,0,0,W,W);const v=S.vis[pt];for(let i=0;i<10000;i++){fogImg.data[i*4]=6;fogImg.data[i*4+1]=8;fogImg.data[i*4+2]=14;fogImg.data[i*4+3]=v[i]?0:150;}fogX.putImageData(fogImg,0,0);mx2.imageSmoothingEnabled=true;mx2.drawImage(fogC,0,0,W,W);
 for(const u of S.units){if(!u.struct||u.kind==='fountain')continue;const[x,z]=P(u.x,u.z);mx2.fillStyle=u.alive?TEAMC[u.team]:'#444';mx2.strokeStyle='#000';mx2.lineWidth=2;if(u.kind==='tower'){mx2.beginPath();mx2.rect(x-6,z-6,12,12);mx2.fill();mx2.stroke();}else{mx2.beginPath();mx2.arc(x,z,u.kind==='core'?13:8,0,7);mx2.fill();mx2.stroke();}}
 for(const u of S.units){if(!u.alive)continue;if(u.kind==='minion'){if(u.team!==pt&&!S.seen(pt,u))continue;const[x,z]=P(u.x,u.z);mx2.fillStyle=u.team===pt?'#8ac8ff':'#ff8a8a';mx2.fillRect(x-2.5,z-2.5,5,5);}
  else if(u.kind==='monster'){if(!S.seen(pt,u))continue;const[x,z]=P(u.x,u.z);mx2.fillStyle=u.boss?'#ffb040':'#e8c070';mx2.beginPath();mx2.arc(x,z,u.boss?9:4,0,7);mx2.fill();}
  else if(u.kind==='ward'&&u.team===pt){const[x,z]=P(u.x,u.z);mx2.fillStyle='#f0c45a';mx2.fillRect(x-3,z-3,6,6);}}
 for(const cp of S.camps){if(cp.units.some(m=>m.alive))continue;const[x,z]=P(cp.x,cp.z);if(cp.at){mx2.fillStyle='rgba(255,255,255,.5)';mx2.font='bold 15px JetBrains Mono,monospace';mx2.textAlign='center';mx2.fillText(Math.max(0,Math.ceil(cp.at-S.t)),x,z+5);}}
 for(const k in S.bosses){const b=S.bosses[k];if(!b.u&&b.at){const[x,z]=P(b.x,b.z);mx2.fillStyle='#ffb040';mx2.font='bold 16px JetBrains Mono,monospace';mx2.textAlign='center';mx2.fillText(fmtT(b.at-S.t),x,z+5);}}
 for(const u of S.champs){if(!u.alive||(u.team!==pt&&!S.seen(pt,u)))continue;const[x,z]=P(u.x,u.z);const r=u===me?17:14;mx2.save();mx2.beginPath();mx2.arc(x,z,r,0,7);mx2.closePath();mx2.fillStyle='#000';mx2.fill();mx2.clip();const im=pimg(u.def.id);if(im.complete)mx2.drawImage(im,x-r,z-r,r*2,r*2);mx2.restore();mx2.lineWidth=3;mx2.strokeStyle=u===me?'#f0c45a':u.team===pt?'#4aa8ff':'#ff4a5a';mx2.beginPath();mx2.arc(x,z,r,0,7);mx2.stroke();}
 // camera footprint
 const pts=[[0,0],[innerWidth,0],[innerWidth,innerHeight],[0,innerHeight]].map(([a,b])=>groundAt(a,b)).filter(Boolean);if(pts.length===4){mx2.strokeStyle='rgba(255,255,255,.8)';mx2.lineWidth=2;mx2.beginPath();pts.forEach(([x,z],i)=>{const[px,pz]=P(x,z);i?mx2.lineTo(px,pz):mx2.moveTo(px,pz);});mx2.closePath();mx2.stroke();}}
{let drag=false;const mm=e=>{const r=mini.getBoundingClientRect();return[(e.clientX-r.left)/r.width*200-100,(e.clientY-r.top)/r.height*200-100];};
 mini.addEventListener('mousedown',e=>{if(app!=='play')return;e.stopPropagation();const[x,z]=mm(e);if(e.button===2){if(me&&me.alive){S.order(me,{k:'move',x,z});marker(x,z,'#7dff9a');}return;}drag=true;camLock=false;cam.tx=x;cam.tz=z;});
 addEventListener('mousemove',e=>{if(drag){const[x,z]=mm(e);cam.tx=x;cam.tz=z;}});addEventListener('mouseup',()=>drag=false);mini.addEventListener('contextmenu',e=>e.preventDefault());}
/* ---------- scoreboard (Tab) ---------- */
let boardT=0;
function itemsHtml(u){return u.items.map(id=>`<img src="${icon(ITEMS[id].g,ITEMS[id].col)}" title="${ITEMS[id].n}" alt="">`).join('');}
function board(on){const b=$('board');if(!on||app!=='play'){b.hidden=true;return;}b.hidden=false;boardT-=1/60;if(boardT>0)return;boardT=.4;
 const row=u=>`<tr class="${u===me?'me':''} ${u.alive?'':'dd'}"><td><img src="${portraits[u.def.id]}" alt=""> ${u.name}</td><td>${ROLE_N[u.role]}</td><td>LV ${u.lvl}</td><td>${u.k} / ${u.d} / ${u.a}</td><td>${u.cs} CS</td><td>${Math.round(u.goldEarned/100)/10}k</td><td class="its">${itemsHtml(u)}</td><td>${u.alive?'':'⟳ '+Math.ceil(u.respawn)}</td></tr>`;
 b.innerHTML=`<h3><span class="a">DAWN · ${S.kills[0]} KILLS · ${S.towersK[0]} TOWERS · SCORE ${S.score(0)}</span><span>${fmtT(S.t)}</span><span class="b">SCORE ${S.score(1)} · ${S.towersK[1]} TOWERS · ${S.kills[1]} KILLS · DUSK</span></h3>`+[0,1].map(t=>`<table>${S.champs.filter(c=>c.team===t).map(row).join('')}</table>`).join('');}
/* ---------- shop (P) ---------- */
let shopSel=null,shopSig='';
function toggleShop(){const s=$('shop');s.hidden=!s.hidden;if(!s.hidden){shopSig='';shopSel=shopSel||me.def.build.find(id=>!me.items.includes(id))||'blade';shopRefresh();}}
$('shopX').onclick=()=>{$('shop').hidden=true;};
function shopRefresh(){const can=S.canShop(me),sig=[Math.floor(me.gold),me.items.join(),shopSel,can].join('|');if(sig===shopSig)return;shopSig=sig;
 $('shopGold').textContent=Math.floor(me.gold)+' GOLD';$('shopNote').textContent=can?'':'Return to your fountain (B to recall) to buy';
 const cell=id=>{const it=ITEMS[id],{c}=priceOf(id,me.items);return`<div class="si ${me.gold<c||!can?'no':''} ${me.items.includes(id)?'own':''} ${shopSel===id?'sel':''}" data-id="${id}"><img src="${icon(it.g,it.col)}" alt="">${c}</div>`;};
 $('shopRec').innerHTML=`<div class="sh-grid">${[...new Set(me.def.build)].map(cell).join('')}</div>`;
 const cats=[['COMPONENTS',ITEM_IDS.filter(id=>!ITEMS[id].from&&ITEMS[id].cat!=='move')],['BOOTS',ITEM_IDS.filter(id=>ITEMS[id].cat==='move')],['ATTACK',ITEM_IDS.filter(id=>ITEMS[id].from&&ITEMS[id].cat==='atk')],['MAGIC',ITEM_IDS.filter(id=>ITEMS[id].from&&ITEMS[id].cat==='mag')],['DEFENCE',ITEM_IDS.filter(id=>ITEMS[id].from&&ITEMS[id].cat==='def')]];
 $('shopCats').innerHTML=cats.map(([n,l])=>`<p>${n}</p><div class="sh-grid">${l.map(cell).join('')}</div>`).join('');
 const it=ITEMS[shopSel],{c}=priceOf(shopSel,me.items);const stats=[['ad','Attack damage'],['ap','Ability power'],['hp','Health'],['mp','Mana'],['ar','Armour'],['mr','Magic resist'],['as','Attack speed',1],['ms','Move speed',2],['cdr','Cooldown reduction',1],['ls','Life steal',1],['pen','Armour penetration',1],['mpen','Magic penetration',1],['lethal','Lethality'],['mpr','Mana regen /s'],['hp5','Health regen /s'],['healPow','Heal & shield power',1]].filter(([k])=>it[k]).map(([k,n,f])=>`+${f===1?Math.round(it[k]*100)+'%':f===2?Math.round(it[k]*75):it[k]} ${n}`).join('<br>');
 $('shopInfo').innerHTML=`<h4>${it.n}</h4><div class="st">${stats}</div>${it.d?`<p class="pas">${it.d}</p>`:''}${it.from?`<p>Built from: ${it.from.map(f=>ITEMS[f].n).join(' + ')}</p>`:''}<p>Cost: <b style="color:var(--o)">${c}</b>${c!==it.c?` (full ${it.c})`:''}</p><button class="go" id="buyB" ${me.gold<c||!can?'disabled':''}>BUY</button>`;
 $('shopInfo').querySelector('#buyB').onclick=()=>{if(!S.buy(me,shopSel)){snd.play('deny');}shopSig='';shopRefresh();};
 $('shop').querySelectorAll('.si').forEach(e=>{e.onclick=()=>{shopSel=e.dataset.id;shopSig='';shopRefresh();};e.ondblclick=e.oncontextmenu=ev=>{ev.preventDefault();shopSel=e.dataset.id;if(!S.buy(me,shopSel))snd.play('deny');shopSig='';shopRefresh();};});
 $('shopInv').innerHTML=me.items.map((id,k)=>`<div class="it" data-k="${k}" title="${ITEMS[id].n} (sell ${Math.round(ITEMS[id].c*.6)})" style="background-image:url(${icon(ITEMS[id].g,ITEMS[id].col)})"></div>`).join('');
 $('shopInv').querySelectorAll('.it').forEach(e=>e.oncontextmenu=ev=>{ev.preventDefault();if(S.sell(me,+e.dataset.k))snd.play('gold');shopSig='';shopRefresh();});}
$('gold').parentElement.style.pointerEvents='auto';$('gold').parentElement.onclick=()=>toggleShop();
/* ================= results ================= */
function finish(){if(app!=='play')return;app='over';const o=S.over,won=o.win===pt;$('shop').hidden=true;$('board').hidden=true;
 const u=me,pts=Math.max(0,Math.round((won?1500:300)+u.k*150+u.a*75+u.cs*4+S.towersK[pt]*60+u.dmgDealt/40-u.d*40+(opt.diff===2?400:opt.diff===0?-200:0)));
 const tok=6+(won?12:0)+Math.min(24,pts/250|0);addRound(tok,won);saveBest(ID,pts);
 lastAward={pts,won,champ:u.name,role:ROLE_N[u.role],kda:`${u.k}/${u.d}/${u.a}`,cs:u.cs,min:S.o.minutes,diff:DIFF[opt.diff].name,tok};
 setTimeout(()=>{if(app!=='over')return;snd.play(won?'win':'lose');snd.announce(won?'Victory':'Defeat');
  $('ores').textContent=won?'VICTORY':'DEFEAT';$('ores').className='res '+(won?'w':'l');$('oeye').textContent='MATCH COMPLETE · '+fmtT(S.t)+' · '+DIFF[opt.diff].name;
  $('owhy').textContent=o.why==='core'?(won?'THE ENEMY AEON HEART HAS SHATTERED':'YOUR AEON HEART HAS SHATTERED'):`TIME · SCORE ${S.score(0)} – ${S.score(1)}${S.score(0)===S.score(1)?' · DECIDED ON GOLD':''}`;
  const mvp=[...S.champs].sort((a,b)=>(b.k*3+b.a*1.5-b.d+b.cs/30)-(a.k*3+a.a*1.5-a.d+a.cs/30))[0];
  const row=c=>`<tr class="${c===me?'me':''}"><td><img src="${portraits[c.def.id]}" alt=""> ${c.name}${c===mvp?' <b style="color:var(--o)">MVP</b>':''}</td><td>${ROLE_N[c.role]}</td><td>${c.lvl}</td><td>${c.k} / ${c.d} / ${c.a}</td><td>${c.cs}</td><td>${Math.round(c.goldEarned)}</td><td>${Math.round(c.dmgDealt)}</td><td class="its">${itemsHtml(c)}</td></tr>`;
  $('otable').innerHTML=[0,1].map(t=>`<table><colgroup><col style="width:27%"><col style="width:11%"><col style="width:6%"><col style="width:12%"><col style="width:7%"><col style="width:8%"><col style="width:8%"><col></colgroup><tr><th class="tl ${t?'b':'a'}" colspan="2">${t?'DUSK':'DAWN'} · ${S.kills[t]} KILLS · ${S.towersK[t]} TOWERS · ${S.drakes[t]} DRAKES · SCORE ${S.score(t)}</th><th>LV</th><th>K / D / A</th><th>CS</th><th>GOLD</th><th>DMG</th><th>ITEMS</th></tr>${S.champs.filter(c=>c.team===t).map(row).join('')}</table>`).join('');
  $('otok').innerHTML=`SCORE <b>${pts}</b> · +${tok} TOKENS · BEST ${bestScore(ID)}`;$('over').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing');},MOBA_FAST?0:3000);}
let MOBA_FAST=false;
/* ================= loop ================= */
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const dpr=Math.min(devicePixelRatio,2);ov.width=w*dpr;ov.height=h*dpr;
 parts.U.uScale.value=smoke.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));if(fxStack)fxStack.setSize(w,h);}
addEventListener('resize',resize);
function step(dt){dt=Math.min(dt,.1);menuT+=dt;
 if(app==='play'&&S){input(dt);if(!paused){let left=dt;while(left>1e-4){const h=Math.min(left,1/30);B.update(h,autopilot);S.step(h);processEvents();left-=h;if(S.over)break;}if(S.over)finish();}}
 else if(app==='over'&&S){I.flush();}
 cameraUpdate(dt);
 if(S&&revealAll)S.vis[pt].fill(1);if(S){fogUpdate(S.vis[pt],dt);fogU.uFogOn.value=1;}else fogU.uFogOn.value=0;
 if(!paused){parts.update(dt);smoke.update(dt);decals.update(dt,menuT);shocks.update(dt);strips.update(dt,camera);for(const L of flashL)if(L.t>0){L.t-=dt;L.l.intensity*=Math.exp(-dt*10);if(L.t<=0)L.l.intensity=0;}
  world.water.uT.value=menuT;for(const m of world.animated)m.rotation.z=menuT*.1;
  if(S&&revealAll)S.vis[pt].fill(1);if(S){updateViews(dt,menuT);updateProjs(dt,menuT);}}
 if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').classList.remove('on');}
 if(app==='play'&&S){hudUpdate(dt);minimap(dt);}}
function noAO(st){// keep see-through VFX (beams, shells, decals) out of the ambient-occlusion depth pass, or they stamp black shapes
 if(!st.ao||st.ao._vfx)return;const ao=st.ao,orig=ao.render.bind(ao);ao._vfx=1;ao.render=(...a)=>{const hid=[];scene.traverse(o=>{const m=o.material;if(o.visible&&m&&!Array.isArray(m)&&m.transparent&&m.depthWrite===false){o.visible=false;hid.push(o);}});orig(...a);for(const o of hid)o.visible=true;};}
function render(){if(!fxStack){fxStack=cinematic(R,scene,camera,{...POST,quality:gfx});fxStack.setSize(innerWidth,innerHeight);noAO(fxStack);}fxStack.render();overlay(1/60);}
let last=performance.now();
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(frame);}
/* ================= boot ================= */
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));resize();
makePortraits();buildMenu();
requestAnimationFrame(frame);
/* ================= test hook ================= */
window.MOBA={
 start(o={}){if(o.diff!=null)opt.diff=o.diff;if(o.champ)opt.champ=o.champ;if(o.role)opt.role=o.role;if(o.ctl)opt.ctl=o.ctl;autopilot=!!o.autopilot;MOBA_FAST=!!o.fast;start({minutes:o.minutes});return this.state;},
 step(dt=1/60,n=1){for(let i=0;i<n;i++)step(dt);},
 // run the simulation only (no views) for long scripted matches
 simulate(secs,dt=1/30){const n=Math.round(secs/dt);for(let i=0;i<n&&app==='play';i++){B.update(dt,autopilot);S.step(dt);processEvents();if(S.over){finish();break;}}floats.length=0;parts.clear();smoke.clear();decals.clear();$('feed').innerHTML='';step(1/60);},
 render(){render();},
 get state(){return S?{app,t:S.t,len:S.len,over:S.over,kills:[...S.kills],towers:[...S.towersK],inhibs:[...S.inhibK],drakes:[...S.drakes],wardens:[...S.wardens],score:[S.score(0),S.score(1)]}:{app};},
 get score(){return lastAward?lastAward.pts:0;},get result(){return lastAward;},
 get player(){return me;},get bots(){return S?S.champs.filter(c=>c.bot):[];},get sim(){return S;},get champs(){return S?S.champs:[];},
 set reveal(v){revealAll=!!v;},get reveal(){return revealAll;},
 set autopilot(v){autopilot=v;if(S)S.o.autoLvl=S.o.autoLvl||v;},get autopilot(){return autopilot;},
 cam(x,z,zoom){cam.x=cam.tx=x;cam.z=cam.tz=z;if(zoom)cam.zoom=zoom;camLock=false;},lock(v){camLock=v;},
 order(o){S.order(me,o);},cast(i,x,z,t){return S.cast(me,i,x,z,t);},buy(id){return S.buy(me,id);},
 setQuality:applyQuality,get quality(){return gfx;},toMenu,toggleShop,board:v=>board(v),hud:v=>{$('hud').hidden=!v;},bars:v=>{noBars=!v;},views,scene,camera,R,
 finish(){if(S&&!S.over){S.t=S.len;S.step(1/30);finish();}}};
