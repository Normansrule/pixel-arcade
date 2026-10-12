// LONG SHOT — full 3D sniper game. Original game for Pixel Arcade.
// Fixed perches over living scenes; identify the target from intel clues, read drop + wind, take the shot.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {World,Particles,Weather,clamp,lerp} from './world.js';
import {Level} from './ai.js';
import {MISSIONS} from './missions.js';
import {RIFLES,SCOPES,BASE_FOV,stepBullet,zeroAngle,dropMils,driftAt,clampZero} from './ballistics.js';
import {HUD,fmt} from './hud.js';
import {Sound} from './sound.js';
import {sandbags} from './props.js';
import {textures} from './tex.js';
import {Rig,pose} from './actors.js';
import {addRound,postScore,saveBest,userName} from '../js/kit3d/score.js';

const V=THREE.Vector3,$=id=>document.getElementById(id);
const ID='longshot';
const DIFF=[{n:'RECRUIT',mul:.75,sway:.7,expo:.55,susp:.75},{n:'MARKSMAN',mul:1,sway:1,expo:1,susp:1},{n:'ELITE',mul:1.5,sway:1.2,expo:1.4,susp:1.3}];

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.5,6000);cam.rotation.order='YXZ';scene.add(cam);
const snd=new Sound(),hud=new HUD(),S=textures();
const add=new Particles(scene,2600,S.glow,true),smk=new Particles(scene,2600,S.puff,false);
const flash=new THREE.PointLight(0xffaa60,0,120,1.4);scene.add(flash);
const ring=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:S.ring,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0xffc890}));ring.visible=false;scene.add(ring);
// bullet (bullet-cam) + vapour traces
const bulletMesh=(()=>{const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0xc89040,metalness:1,roughness:.25,emissive:0x221100});const b=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.06,12),m);b.rotation.x=Math.PI/2;g.add(b);const t=new THREE.Mesh(new THREE.ConeGeometry(.018,.05,12),m);t.rotation.x=-Math.PI/2;t.position.z=-.055;g.add(t);g.visible=false;scene.add(g);return g;})();
const traces=[];function newTrace(){const g=new THREE.BufferGeometry();const a=new Float32Array(96*3);g.setAttribute('position',new THREE.BufferAttribute(a,3));g.setDrawRange(0,0);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xdde6ee,transparent:true,opacity:.4,depthWrite:false}));l.frustumCulled=false;scene.add(l);return{l,a,n:0,t:0};}

/* ================= save data ================= */
let save={stars:{},best:{},opt:{mission:0,rifle:0,scope:0,diff:1,bcam:1}};
try{const s=JSON.parse(localStorage.getItem('pxd_longshot'));if(s)save={...save,...s,opt:{...save.opt,...(s.opt||{})}};}catch(e){}
const persist=()=>{try{localStorage.setItem('pxd_longshot',JSON.stringify(save));}catch(e){}};
const totalStars=()=>Object.values(save.stars).reduce((a,b)=>a+b,0);

/* ================= game state ================= */
const G={app:'menu',phase:'live',M:null,mi:-1,W:null,L:null,perches:[],perch:0,yaw:0,pitch:0,yaw0:0,t:0,clock:0,susp:0,alarm:false,alarmEver:false,expo:0,
 rifle:RIFLES[0],scope:SCOPES[0],diff:1,zero:300,zoom:4,bzoom:8,scopeOn:false,scoped:0,binos:false,breath:100,holding:false,gasp:0,rec:0,recY:0,cycleT:0,reloadT:0,ammo:5,reserve:15,
 wind:new V(),range:0,dropAt:0,windMil:0,pred:null,par:{x:0,y:0},hitFx:null,look:null,lookTraits:[],pois:[],bullets:[],bc:null,
 shots:0,hits:0,kills:0,civKills:0,headshots:0,longest:0,items:[],sec:[],targets:[],departing:false,endT:0,result:null,swayOff:false,hint:'',flashRed:0,intel:false,lastEvt:-9,lastShotAt:-9,
 fx:null,snd,M_:null};
G.snd=snd;

/* ================= effects ================= */
const C=(h)=>new THREE.Color(h);
const fx={
 sparks(p,n=16){add.burst(p,n,10,[C(0xffc060).multiplyScalar(3),C(0xff8020).multiplyScalar(2.5)],.05,.4,{grav:9.8,drag:1.2});},
 smoke(p,size=1,dark=false){const c=dark?.12:.55;smk.emit(p.x+(Math.random()-.5)*.4,p.y,p.z+(Math.random()-.5)*.4,(Math.random()-.5)*.4,1+Math.random()*.6,(Math.random()-.5)*.4,c,c,c*1.02,size,3+Math.random()*1.5,{grow:size*.9,drag:.6,wind:.7,a:dark?.75:.45});},
 dust(p,col,n=14,s=.5){for(let i=0;i<n;i++)smk.emit(p.x,p.y,p.z,(Math.random()-.5)*2.4,Math.random()*2.6,(Math.random()-.5)*2.4,col.r,col.g,col.b,s*(.5+Math.random()),1+Math.random(),{grow:s*1.4,drag:2,grav:1.2,wind:.6,a:.8});},
 splash(p){for(let i=0;i<26;i++)smk.emit(p.x,p.y,p.z,(Math.random()-.5)*1.6,3+Math.random()*5,(Math.random()-.5)*1.6,.9,.95,1,.25+Math.random()*.3,.9+Math.random()*.4,{grav:9.8,drag:.6,a:.9});fx.ringAt(p,4,.6);},
 glass(p){add.burst(p,14,4,[C(0xc8e0ff).multiplyScalar(1.6)],.05,.6,{grav:9.8,drag:.8});},
 ringAt(p,size,dur){ring.position.copy(p).add(new V(0,.05,0));ring.rotation.set(-Math.PI/2,0,0);ring.scale.setScalar(.1);ring.visible=true;ring.userData={t:0,size,dur};},
 boom(p,r){const n=Math.min(260,60+r*14);add.burst(p,n,r*1.8,[C(0xffd080).multiplyScalar(4),C(0xff7a20).multiplyScalar(3),C(0xff3a10).multiplyScalar(2)],r*.35,.9,{drag:2.2,grav:-2,up:true,jit:r*.3});
  for(let i=0;i<40;i++)smk.emit(p.x+(Math.random()-.5)*r*.6,p.y+Math.random()*r*.3,p.z+(Math.random()-.5)*r*.6,(Math.random()-.5)*3,2+Math.random()*4,(Math.random()-.5)*3,.08,.07,.07,r*.4,4+Math.random()*3,{grow:r*.5,drag:.6,wind:.6,a:.85});
  add.burst(p,50,r*3,[C(0xffb040).multiplyScalar(3)],.09,1.3,{grav:9.8,drag:.5,up:true});flash.position.copy(p).add(new V(0,2,0));flash.intensity=2500+r*200;flash.distance=r*12;
  ring.position.copy(p);ring.lookAt(cam.position);ring.scale.setScalar(.1);ring.visible=true;ring.userData={t:0,size:r*4,dur:.45};}};
G.fx=fx;
const IMP={ground:null,stone:C(0xb0a898),wood:C(0x8a6a48),metal:null,glass:null,water:null,fabric:null};

/* ================= viewmodel rifle ================= */
let vm=null,vmFlash=null;
// the viewmodel sits inside the .5 m near plane: squeeze its depth into the front sliver of the buffer (never clipped, always in front), so the world keeps a 24-bit depth range without a log buffer
const vmDepth=s=>{s.vertexShader=s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngl_Position.z=gl_Position.w*(-1.+.0005*min(-mvPosition.z,2.));');};
function makeRifle(r){const g=new THREE.Group(),std=o=>new THREE.MeshStandardMaterial(o);const body=std({color:r.body,metalness:.75,roughness:.35}),stock=std({color:r.stock,roughness:.6,metalness:r.stock===r.body?.6:.05}),blk=std({color:0x0c0d0f,metalness:.6,roughness:.4}),lens=std({color:0x203848,metalness:.9,roughness:.05,emissive:0x061018});
 const box=(w,h,d,m,x,y,z,rx=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.x=rx;g.add(o);return o;},cyl=(r1,r2,l,m,x,y,z,s=14)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,l,s),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);g.add(o);return o;};
 const L=r.len;box(.07,.14,.34,stock,0,-.03,.12);box(.05,.05,.2,stock,0,.03,.08);box(.065,.075,.3,body,0,0,-.18);box(.07,.07,.34,r.id==='whisper'?body:stock,0,-.012,-.48);
 cyl(.012,.013,L*.62,body,0,.01,-.36-L*.31);if(r.can)cyl(.024,.024,.24,blk,0,.01,-.36-L*.62);else cyl(.018,.014,.05,blk,0,.01,-.36-L*.62+.02);
 box(.035,.1,.08,blk,0,-.08,-.2);const bolt=new THREE.Group();bolt.position.set(.045,.015,-.07);const bh=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.07,6),body);bh.rotation.z=Math.PI/2;bh.position.x=.03;bolt.add(bh);const bk=new THREE.Mesh(new THREE.SphereGeometry(.013,8,6),blk);bk.position.x=.065;bolt.add(bk);g.add(bolt);
 cyl(.021,.021,.34,blk,0,.075,-.2);cyl(.03,.022,.08,blk,0,.075,-.4);cyl(.026,.021,.07,blk,0,.075,-.01);const ln=new THREE.Mesh(new THREE.CircleGeometry(.027,16),lens);ln.position.set(0,.075,-.442);ln.rotation.y=Math.PI;g.add(ln);
 cyl(.012,.012,.03,blk,0,.105,-.2).rotation.x=0;const tw=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.03,10),blk);tw.rotation.z=Math.PI/2;tw.position.set(.035,.075,-.2);g.add(tw);
 for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,.2,5),blk);l.rotation.x=Math.PI/2-.05;l.position.set(s*.02,-.05,-.52);g.add(l);}
 const f=new THREE.Mesh(new THREE.PlaneGeometry(.3,.3),new THREE.MeshBasicMaterial({map:S.flare,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));f.position.set(0,.01,-.36-L*.62-(r.can?.15:.08));f.visible=false;g.add(f);
 g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.renderOrder=2;o.material.onBeforeCompile=vmDepth;}});g.userData={bolt,flash:f};return g;}
function setRifle(r){if(vm){cam.remove(vm);}vm=makeRifle(r);cam.add(vm);vm.position.set(.17,-.2,-.3);vm.rotation.y=.05;}

/* ================= mission loading ================= */
let weather=[],fxPost=null,gfx=quality(),menuA=0;
function disposeMission(){if(G.L)G.L.dispose();if(G.W)G.W.dispose();for(const w of weather)scene.remove(w.mesh);weather=[];G.L=null;G.W=null;add.clear();smk.clear();for(const t of traces)t.l.visible=false;}
function loadMission(i){disposeMission();const M=MISSIONS[i];G.M=M;G.mi=i;if(M.reset)M.reset();const env=M.env;
 scene.fog=new THREE.FogExp2(env.fog.color,env.fog.density);
 const W=new World(scene,R,{height:M.H.bind(M),night:env.night||0});G.W=W;W.sky(env.sky);W.lights({...env.light,sunDir:env.sky.sunDir,center:env.center,shadowR:env.shadowR||110});
 W.terrain({color:M.tcol.bind(M),size:2200,cx:env.center.x,cz:env.center.z});
 if(M.water)M.water(W);else if(env.water)W.water({y:0,deep:env.waterC?env.waterC.deep:0x0a2a40,shallow:env.waterC?env.waterC.shallow:0x2a8a90,sunDir:env.sky.sunDir,sunCol:env.sky.sunCol,skyH:env.sky.hor,skyT:env.sky.top,cx:env.center.x,cz:env.center.z,range:700});
 if(W.waterU){W.waterU.sunDir.value.copy(env.sky.sunDir).normalize();W.waterU.sunCol.value.set(env.sky.sunCol);W.waterU.skyH.value.set(env.sky.hor);W.waterU.skyT.value.set(env.sky.top);}
 const b=M.build(W);G.perches=b.perches.map(p=>{const c=env.center,dx=c.x-p.p.x,dz=c.z-p.p.z,dy=c.y+1-p.p.y;return{...p,yaw:Math.atan2(-dx,-dz),pitch:Math.atan2(dy,Math.hypot(dx,dz))};});
 for(const p of G.perches){const c=env.center,D=Math.hypot(c.x-p.p.x,c.z-p.p.z),dx=(c.x-p.p.x)/D,dz=(c.z-p.p.z)/D;let need=p.p.y;
  for(const lat of[0,-12,12])for(let s=2;s<D-60;s+=s<90?2:5){const k=s/D,px=p.p.x+dx*s-dz*lat*k,pz=p.p.z+dz*s+dx*lat*k;const h=s<90?W.groundAt(px,pz,1e9):W.H(px,pz);const req=(h+1.4-s*c.y/D)/(1-s/D);if(req>need)need=req;}if(need>p.p.y+.25)console.log('perch lift',M.id,p.n,(need-p.p.y).toFixed(1));
  need=Math.min(need,p.p.y+14);if(need>p.p.y+.25){const top=need-1.6,base=W.H(p.p.x,p.p.z)-.3;for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.box(p.p.x+a*1.4,base,p.p.z+b*1.4,.22,top-base,.22,'wood',{collide:false});W.box(p.p.x,top-.25,p.p.z,3.4,.25,3.4,'wood',{matK:'wood'});p.p.y=need;
   p.pitch=Math.atan2(c.y+1-need,D);}
  sandbags(W,p.p,p.yaw);}
 // keep each perch's corridor to the action free of trees
 const _z=new THREE.Matrix4().makeScale(0,0,0);for(const im of W.instanced){const ins=im.userData.inst;if(!ins)continue;let ch=false;ins.forEach((t,k)=>{for(const p of G.perches){const c=env.center,ax=p.p.x,az=p.p.z,vx=c.x-ax,vz=c.z-az,L2=vx*vx+vz*vz;const u=((t.x-ax)*vx+(t.z-az)*vz)/L2;if(u<0||u>1)continue;
   const lat=Math.abs((t.x-ax)*vz-(t.z-az)*vx)/Math.sqrt(L2);const sy=p.p.y+(c.y-p.p.y)*u;if(lat<9+u*14&&t.top>sy-2.5){im.setMatrixAt(k,_z);if(t.col)t.col.on=false;ch=true;break;}}});if(ch){im.instanceMatrix.needsUpdate=true;im.computeBoundingSphere();}}
 W.finalize();const L=new Level(G,W,scene,7+i);G.L=L;M.cast(L);G.wind.set(Math.cos(M.wind.a),0,Math.sin(M.wind.a)).multiplyScalar(M.wind.base);W.update(0,0,G.wind);
 if(env.weather){const k=env.weather;weather=[new Weather(scene,k,k==='rain'?2200:k==='snow'?1600:500,k==='rain'?34:40),new Weather(scene,k,k==='rain'?1600:1200,40)];}
 fxPost=null;applyQuality(gfx);}

/* ================= quality ================= */
function applyQuality(q){gfx=q;fxPost=null;R.shadowMap.enabled=q>0;if(G.W&&G.W.sun){G.W.sun.castShadow=q>0;G.W.sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(G.W.sun.shadow.map){G.W.sun.shadow.map.dispose();G.W.sun.shadow.map=null;}}
 scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined&&o.isMesh)o.material.needsUpdate=true;});}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function post(){if(!fxPost){const e=G.M.env;fxPost=cinematic(R,scene,cam,{quality:gfx,exposure:e.exposure??1,bloom:e.bloom??.45,bloomThreshold:e.bloomThreshold??.9,bloomRadius:.45,vignette:.3,saturation:1.08,grain:.02,ao:false});fxPost.w=0;}
 const w=innerWidth,h=innerHeight;if(fxPost.w!==w*9999+h){fxPost.w=w*9999+h;fxPost.setSize(w,h);}return fxPost;}

/* ================= mission flow ================= */
function secState(s){return s.state;}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(save.opt,o);persist();snd.init();snd.resume();
 const oi=save.opt;G.diff=oi.diff;G.rifle=RIFLES[oi.rifle];G.scope=SCOPES[oi.scope];
 if(G.mi!==oi.mission||G.dirty||o.reload!==false)loadMission(oi.mission);G.dirty=true;const M=G.M;
 Object.assign(G,{app:'brief',phase:'live',t:0,clock:M.time,susp:0,alarm:false,alarmEver:false,expo:0,zero:clampZero(300),zoom:G.scope.min*1.5,bzoom:8,scopeOn:false,scoped:0,binos:false,breath:100,holding:false,gasp:0,rec:0,recY:0,cycleT:0,reloadT:0,
  ammo:G.rifle.mag,reserve:G.rifle.mag*3,shots:0,hits:0,kills:0,civKills:0,headshots:0,longest:0,items:[],bullets:[],bc:null,departing:false,endT:0,result:null,hitFx:null,look:null,intel:false,lastEvt:-9,flashRed:0,escaped:false,bodiesT:0,rangeT:0});
 $('bcam').hidden=true;document.body.classList.remove('bc');$('fade').classList.remove('on');cam.fov=BASE_FOV;G.relTo=null;G.shake=0;
 G.targets=M.targets.map(t=>G.L.byId(t.id));G.sec=M.sec.map(s=>({...s,state:'todo'}));G.pois=buildPois();setRifle(G.rifle);bulletMesh.visible=false;
 setPerch(0,true);$('menu').hidden=true;$('keys').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');hud.clearToasts();
 openIntel(true);updateObjectives();const amb=[];const id=M.id;if(id==='villa'||id==='island')amb.push('sea');if(id!=='city')amb.push('wind');if(M.env.weather==='rain')amb.push('rain');if(id==='city')amb.push('city');if(id==='villa')amb.push('party');snd.ambient(amb);
 if(o.skipBrief)begin();}
function begin(){if(G.app!=='brief')return;G.app='play';$('intel').hidden=true;G.intel=false;lock();snd.play('ui');hud.banner(G.M.n,G.M.loc,'#fff',2.6);}
function toMenu(){unlock();G.app='menu';$('menu').hidden=false;$('keys').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('intel').hidden=true;document.body.classList.remove('playing','bc');snd.stopAmbient();$('fade').classList.remove('on');bulletMesh.visible=false;
 if(G.mi!==save.opt.mission||G.dirty){loadMission(save.opt.mission);G.dirty=false;}buildMenu();}
function setPerch(i,snap){G.perch=i;const p=G.perches[i];G.yaw0=p.yaw;if(snap){G.yaw=p.yaw;G.pitch=p.pitch;}else{G.yaw=p.yaw;G.pitch=p.pitch;}cam.position.copy(p.p);G.expo=Math.max(0,G.expo-100);
 for(const q of G.L?G.L.people:[])if(q.state==='combat'){q.fireT=4+Math.random()*4;q.losT=0;}}
function relocate(i){if(G.app!=='play'||G.phase!=='live'||i===G.perch||i>=G.perches.length)return;G.phase='relocate';G.relT=0;G.relTo=i;G.scopeOn=false;G.binos=false;$('fadet').textContent='RELOCATING · '+G.perches[i].n;$('fade').classList.add('on');snd.play('ui');}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;document.body.classList.remove('playing');unlock();}else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}
function openIntel(brief){const M=G.M;G.intel=true;$('intel').hidden=false;$('iloc').textContent=M.loc+' · '+fmt(M.time)+' ON THE CLOCK';$('iname').textContent=M.n;$('ibrief').textContent=M.brief;
 $('itargets').innerHTML=M.targets.map(t=>{const p=G.L.byId(t.id);const st=!p.alive?'<small class="dead">ELIMINATED</small>':'<small>AT LARGE</small>';return`<div class="tg"><h3>${t.code}${st}</h3><div class="clues">${t.clues.map(c=>`<span class="${c.startsWith('NO ')?'neg':''}">${c}</span>`).join('')}</div><p>${t.note}</p></div>`;}).join('');
 $('isec').innerHTML=G.sec.map(s=>`<div class="${s.state==='done'?'done':s.state==='fail'?'fail':''}"><b>${s.n}</b> — ${s.d}</div>`).join('');$('begin').hidden=!brief;$('tabh').hidden=brief;if(brief)portrait();}
function closeIntel(){G.intel=false;$('intel').hidden=true;lock();}

/* ================= surveillance photo for the dossier ================= */
const pScene=new THREE.Scene();pScene.add(new THREE.HemisphereLight(0xffffff,0x444444,1.6));const pKey=new THREE.DirectionalLight(0xffffff,2.2);pKey.position.set(1.5,2.5,2);pScene.add(pKey);const pCam=new THREE.PerspectiveCamera(26,220/260,.1,20);const pRT=new THREE.WebGLRenderTarget(220,260);
function portrait(){const t=G.targets[0];if(!t)return;const rig=new Rig(t.o,1);pose(rig,'idle',0,0,0,{headY:.25});rig.apply(-1);pScene.add(rig.root);rig.root.rotation.y=-.35;pCam.position.set(.1,1.62,1.25);pCam.lookAt(0,1.5,0);
 const tm=R.toneMapping;R.toneMapping=THREE.NoToneMapping;R.setRenderTarget(pRT);R.setClearColor(0x6a6e72,1);R.clear();R.render(pScene,pCam);const px=new Uint8Array(220*260*4);R.readRenderTargetPixels(pRT,0,0,220,260,px);R.setRenderTarget(null);R.toneMapping=tm;pScene.remove(rig.root);rig.mesh.geometry.dispose();
 const c=$('photo'),x=c.getContext('2d'),im=x.createImageData(220,260);for(let j=0;j<260;j++)for(let i=0;i<220;i++){const s=((259-j)*220+i)*4,d=(j*220+i)*4;let l=(px[s]*.3+px[s+1]*.59+px[s+2]*.11);l=(l-128)*1.25+120+(Math.random()-.5)*46;if(j%3===0)l*=.9;im.data[d]=im.data[d+1]=im.data[d+2]=clamp(l,0,255);im.data[d+3]=255;}
 x.putImageData(im,0,0);x.fillStyle='rgba(255,77,0,.9)';x.font='700 11px "JetBrains Mono",monospace';x.fillText('CAM 04 · '+G.M.targets[0].code,8,250);x.strokeStyle='rgba(255,255,255,.5)';x.strokeRect(60,40,100,120);}

/* ================= points of interest (binocular overlay) ================= */
function buildPois(){const L=G.L,out=[];const HN={gas:'PROPANE TANK',tank:'FUEL TANK',barrels:'FUEL DEPOT',load:'CRANE HOOK',charge:'AVALANCHE CHARGE',gen:'GENERATOR'};
 for(const h of L.hazards)out.push({n:HN[h.kind]||'HAZARD',get p(){return h.kind==='load'?h.hook.position:h.p.clone().add(new V(0,1.4,0));},done:()=>h.used});
 for(const o of L.objs)out.push({n:o.s.kind==='relay'?'RELAY':'LIFT MOTOR',get p(){return o.p.clone().add(new V(0,1.2,0));},done:()=>!o.alive});
 for(const s of G.sec)if(s.type==='disable'){const v=L.byId(s.vehicle);out.push({n:'ENGINE',get p(){return v.local(v.eng.ox,v.eng.oy+.4,v.eng.oz);},done:()=>v.disabled||v.gone});}
 const tk=L.byId('tanker');if(tk)out.push({n:'FUEL TANKER',get p(){return tk.local(tk.fuel.ox,tk.fuel.oy+1.4,tk.fuel.oz);},done:()=>!tk.alive});return out;}

/* ================= objectives ================= */
function updateObjectives(){const list=[{h:'PRIMARY'}];for(const t of G.M.targets){const p=G.L.byId(t.id);list.push({n:'ELIMINATE '+t.code,state:p.alive?'':'done',pri:true});}list.push({h:'SECONDARY'});for(const s of G.sec)list.push({n:s.n,state:s.state==='done'?'done':s.state==='fail'?'fail':''});hud.objectives(list);}
function secDone(s,why){if(s.state!=='todo')return;s.state='done';snd.play('star',2);hud.toast(`SECONDARY COMPLETE · <b>${s.n}</b>`,'k');updateObjectives();}
function secFail(s,why){if(s.state!=='todo')return;s.state='fail';hud.toast(`SECONDARY FAILED · ${why||s.n}`,'bad');updateObjectives();}
G.handoff=(c,t)=>{const s=G.sec.find(s=>s.type==='courier'&&s.person===c.id);if(s){secFail(s,'THE HANDOFF WENT THROUGH');hud.banner('HANDOFF COMPLETE','THE COURIER DELIVERED THE PACKAGE','#ff8a5a',2.4);}};
G.vehicleDisabled=v=>{const s=G.sec.find(s=>s.type==='disable'&&s.vehicle===v.id);if(s)secDone(s);if(G.app==='play')hud.toast(v.destroyed?'VEHICLE DESTROYED':'VEHICLE DISABLED','k');};
G.objDestroyed=o=>{for(const s of G.sec)if(s.type==='destroy'&&s.objs.includes(o.id)&&s.objs.every(id=>!G.L.byId(id).alive))secDone(s);if(s=>0)hud.toast((o.s.kind==='relay'?'RELAY':'MOTOR')+' DESTROYED','k');addSusp(6);};
G.perchPos=()=>G.perches[G.perch].p;
G.scream=p=>{const d=p.distanceTo(cam.position);snd.play('scream',Math.max(.2,1-d/600),d/340);};

/* ================= suspicion / alarm / exposure ================= */
function addSusp(n,why){if(G.alarm||G.app!=='play')return;const spot=G.L.people.some(p=>p.s.spotter&&p.alive);G.susp+=n*DIFF[G.diff].susp*(spot?1.35:1);G.lastEvt=G.t;if(why)hud.toast(why,'bad',2.4);if(G.susp>=100)raiseAlarm();}
function raiseAlarm(){if(G.alarm)return;G.alarm=G.alarmEver=true;G.susp=100;snd.play('alarm');hud.banner('ALARM RAISED','GUARDS RETURN FIRE · TARGETS RUN FOR THEIR RIDE','#ff4040',3);
 const c=G.M.env.center;for(const p of G.L.people){if(!p.alive||p.gone)continue;if(p.isTarget)G.L.flee(p);else if(p.role==='guard'||p.role==='hostile')p.engage();else if(p.role==='courier')p.panic(c);else p.panic(c);}}
G.guardFire=g=>{if(G.app!=='play'||G.phase==='end')return;const d=g.eye.distanceTo(cam.position);const e=g.eye.clone().add(new V(Math.sin(g.yaw)*.8,-.05,Math.cos(g.yaw)*.8));add.burst(e,8,3,[C(0xffd080).multiplyScalar(3)],.25,.08,{drag:5});
 snd.play('distshot',Math.max(.15,1-d/900),Math.min(1.6,d/340));G.expo+=3.6*DIFF[G.diff].expo;G.lastShotAt=G.t;
 setTimeout(()=>{if(G.app!=='play')return;snd.play('whiz',.6);const f=new V(-Math.sin(G.yaw),0,-Math.cos(G.yaw));const p=cam.position.clone().addScaledVector(f,1.3+Math.random()*.8).add(new V((Math.random()-.5)*1.4,-.7,(Math.random()-.5)*1.4));fx.dust(p,C(0x8a7a5a),10,.25);G.shake=Math.max(G.shake||0,.4);G.flashRed=.25;},Math.min(1600,d/340*1000)+120);};

/* ================= kills + scoring ================= */
function item(n,pts){G.items.push({n,pts});}
G.onKill=(p,info)=>{if(p.counted)return;p.counted=true;G.kills++;const d=Math.round(info.dist||0);let tot=0;const parts=[];const head=info.part==='head';
 const shooter=info.by==='shot';if(shooter&&d>G.longest)G.longest=d;if(head)G.headshots++;
 if(p.isTarget){tot+=2000;parts.push('TARGET');if(d){tot+=d*3;}if(head){tot+=500;parts.push('HEADSHOT');}if(info.moving){tot+=400;parts.push('MOVING TARGET');}if(info.accident){tot+=1500;parts.push('ACCIDENT');}
  item((G.M.targets.find(t=>t.id===p.id)||{}).code||'TARGET',2000);if(d)item(`DISTANCE ${d} M`,d*3);if(head)item('HEADSHOT',500);if(info.moving)item('MOVING TARGET',400);if(info.accident)item('ACCIDENT KILL',1500);
  for(const s of G.sec)if(s.type==='accident'&&info.accident)secDone(s);hud.banner(G.targets.every(t=>!t.alive)?'TARGET ELIMINATED':'TARGET DOWN',`${(G.M.targets.find(t=>t.id===p.id)||{}).code} · ${d?d+' M':info.accident?'ACCIDENT':''}`,'#ff4d00',2.2);}
 else if(p.hostile){tot=200+Math.round(d*.5)+(head?100:0)+(info.moving?100:0)+(info.accident?200:0);item(p.role==='courier'?'COURIER':'HOSTILE',tot);parts.push(p.role==='courier'?'COURIER':p.role==='guard'?'GUARD':'HOSTILE');if(head)parts.push('HEADSHOT');if(info.accident)parts.push('ACCIDENT');}
 else{tot=-1000;G.civKills++;item('CIVILIAN CASUALTY',-1000);hud.toast(`CIVILIAN CASUALTY · ${G.civKills}/3 · <b>−1000</b>`,'bad');}
 if(tot>0)hud.toast(`${parts.join(' · ')}${d?` · ${d} M`:''} · <b>+${tot}</b>`,'k');snd.play('kill');
 for(const s of G.sec){if(s.type==='courier'&&s.person===p.id&&s.state==='todo')secDone(s);if(s.type==='kill'&&s.ids.includes(p.id)&&s.ids.every(id=>!G.L.byId(id).alive))secDone(s);}
 updateObjectives();if(G.civKills>=3)fail('TOO MANY CIVILIAN CASUALTIES');else if(G.targets.every(t=>!t.alive))win();};
function win(){if(G.phase==='end')return;G.phase='end';G.endT=0;G.result={won:true};snd.play('win');}
function fail(why){if(G.phase==='end'||G.app!=='play')return;G.phase='end';G.endT=0;G.result={won:false,why};hud.banner('MISSION FAILED',why,'#ff4040',3);snd.play('fail');}

/* ================= explosions + accidents ================= */
G.explode=(p,r,o={})=>{if(o.src&&o.src.exploded)return;if(o.src)o.src.exploded=true;fx.boom(p,r);const d=p.distanceTo(cam.position);snd.play('explode',Math.max(.25,1-d/900),G.phase==='bulletcam'?0:Math.min(1.2,d/340));G.shake=Math.max(G.shake||0,Math.max(.3,1.4-d/400));
 const L=G.L;for(const q of L.people){if(!q.alive||q.gone)continue;const c=q.vehicle?q.pos:q.pos.clone().add(new V(0,1,0));const dd=c.distanceTo(p);if(dd<r){const dir=c.clone().sub(p).normalize();q.kill({dir,force:14*(1-dd/r)+4,lift:6*(1-dd/r)+2,part:'torso'});G.onKill(q,{by:'explosion',accident:!!o.accident,dist:Math.round(p.distanceTo(cam.position))});}else if(dd<r*3)q.panic(p);}
 for(const v of L.vehicles){if(v.gone||v===o.src)continue;if(v.pos.distanceTo(p)<r*.8&&!v.destroyed){v.disable(G,true);if(!v.exploded&&v.type!=='chair')L.timers.push({t:.35,f:()=>G.explode(v.local(v.fuel.ox,v.fuel.oy,v.fuel.oz),v.type==='truck'?14:7,{accident:!!o.accident,src:v})});}}
 if(o.src&&o.src.disable)o.src.disable(G,true);
 for(const h of L.hazards)if(!h.used&&h!==o.src&&h.p.distanceTo(p)<r*.75)L.timers.push({t:.25,f:()=>h.trigger(G)});
 for(const ob of L.objs)if(ob.alive&&ob.p.distanceTo(p)<r*.7){ob.hp=1;ob.damage(G);}
 if(!o.quiet)addSusp(o.accident?14:30);};
G.crush=(h,p,r)=>{fx.dust(p.clone().add(new V(0,.5,0)),C(0x9a9890),40,1.2);snd.play('crash');G.shake=Math.max(G.shake||0,.4);for(const q of G.L.people){if(!q.alive||q.gone||q.vehicle)continue;const d=Math.hypot(q.pos.x-p.x,q.pos.z-p.z);if(d<r&&Math.abs(q.pos.y-p.y)<2.5){q.kill({dir:new V(q.pos.x-p.x,0,q.pos.z-p.z).normalize(),force:4,lift:-2,part:'head'});G.onKill(q,{by:'crush',accident:true,dist:Math.round(p.distanceTo(cam.position))});}else if(d<r*4)q.panic(p);}addSusp(10);};
G.avalanche=h=>{const z=G.M.avalanche;snd.play('rumble');hud.toast('AVALANCHE!','k');let k=0;const run=()=>{k++;for(let i=0;i<40;i++){const x=lerp(z.x0,z.x1,Math.random()),zz=lerp(z.z0,z.z1,Math.min(1,k/14)*.9+Math.random()*.1);const y=G.W.H(x,zz);smk.emit(x,y+Math.random()*3,zz,(Math.random()-.5)*3,1+Math.random()*2,8+Math.random()*6,.95,.97,1,4+Math.random()*5,3+Math.random()*2,{grow:5,drag:.4,a:.85});}if(k<18)G.L.timers.push({t:.12,f:run});};run();
 G.L.timers.push({t:1.4,f:()=>{for(const q of G.L.people){if(!q.alive||q.gone||q.vehicle)continue;if(q.pos.x>z.x0&&q.pos.x<z.x1&&q.pos.z>z.z0&&q.pos.z<z.z1){q.kill({dir:new V(0,-.2,1),force:10,lift:2,part:'torso'});G.onKill(q,{by:'avalanche',accident:true,dist:Math.round(q.pos.distanceTo(cam.position))});}}}});G.shake=.6;addSusp(12);};

/* ================= bullets ================= */
const SUB=1/240;
function collide(b,a,c){// nearest hit along a→c for bullet b
 let best=null;const L=G.L;
 for(const p of L.people){if(!p.alive||p.gone)continue;const h=p.hit(a,c);if(h&&(!best||h.t<best.t))best={t:h.t,type:'person',p,part:h.part};}
 for(const v of L.vehicles){if(v.gone||v.type==='chair')continue;const h=v.hit(a,c);if(h&&!b.pass.has(h.col)&&(!best||h.t<best.t))best={t:h.t,type:'vehicle',v,part:h.part,col:h.col};}
 const s=G.W.segment(a.x,a.y,a.z,c.x,c.y,c.z,{skip:col=>b.pass.has(col)});if(s&&(!best||s.t<best.t))best={t:s.t,type:'world',kind:s.kind,col:s.col,n:s.n};
 if(best)best.pos=new V().lerpVectors(a,c,best.t);return best;}
function penetrates(b,h){if(h.type==='world')return h.kind==='fabric'||h.kind==='glass'||(b.r.power>=4&&h.kind==='wood');if(h.type==='vehicle')return h.part==='cabin'||(b.r.power>=4&&h.part==='body');return false;}
function newBullet(p,v,r,cam){return{p:p.clone(),v:v.clone(),r,w:G.wind.clone(),t:0,from:p.clone(),pass:new Set(),done:false,trace:null,cam};}
// fly a copy of the shot through a frozen world (bullet-cam decision + aim solver)
function predict(p,v,r,maxT=3){const b=newBullet(p,v,r);const a=new V();for(let i=0;i<maxT/SUB;i++){a.copy(b.p);stepBullet(b.p,b.v,r.k,b.w,SUB);b.t+=SUB;let h=collide(b,a,b.p),guard=0;while(h&&penetrates(b,h)&&guard++<4){b.pass.add(h.col);h=collide(b,a,b.p);}if(h)return{...h,t:b.t,dist:h.pos.distanceTo(p)};}return null;}
function fireShot(o={}){if(G.app!=='play'||G.phase==='end'&&!o.force||G.phase==='relocate')return false;if(G.reloadT>0||G.cycleT>0&&!o.force)return false;if(G.ammo<=0){snd.play('dry');G.hint='R · RELOAD';return false;}
 G.ammo--;G.shots++;const r=G.rifle;const f=new V(0,0,-1).applyQuaternion(cam.quaternion),up=new V(0,1,0).applyQuaternion(cam.quaternion);const za=zeroAngle(r,G.zero);const dir=f.clone().multiplyScalar(Math.cos(za)).addScaledVector(up,Math.sin(za)).normalize();
 if(G.scoped<.5&&!G.binos){const sp=.012;dir.x+=(Math.random()-.5)*sp;dir.y+=(Math.random()-.5)*sp;dir.z+=(Math.random()-.5)*sp;dir.normalize();}
 const p0=cam.position.clone().addScaledVector(f,.6);const b=newBullet(p0,dir.clone().multiplyScalar(r.v0),r);G.bullets.push(b);b.trace=traces.find(t=>!t.l.visible&&t.t<=0)||(traces.length<8?(traces.push(newTrace()),traces[traces.length-1]):traces[0]);b.trace.n=0;b.trace.t=0;b.trace.l.visible=true;b.trace.l.material.opacity=.42;
 const noise=r.noise*(G.M.noise??1);snd.play(r.can?'shotS':'shot',r.can?1:Math.min(1.2,.7+r.noise*.3));if(r.cycle>.6)setTimeout(()=>{if(G.app==='play')snd.play('bolt',r.cycle);},280);else snd.play('semi');
 G.rec+=.022+r.power*.006;G.recY+=(Math.random()-.5)*.008;G.cycleT=r.cycle;if(vm){vm.userData.flash.visible=true;vm.userData.flash.rotation.z=Math.random()*3;vm.userData.ft=.05;}if(G.scoped<.5)add.burst(p0,10,2,[C(0xffc070).multiplyScalar(2)],.12,.1,{drag:6});
 // the report carries: everyone hears it, guards look toward the hills
 addSusp(noise*5.5);for(const q of G.L.people)if(q.alive&&!q.gone&&q.role==='guard'&&noise>.8&&Math.random()<.4)q.lookP=G.perchPos().clone();
 // bullet cam?
 const mode=save.opt.bcam;if(mode&&G.phase==='live'&&!o.noCam){const h=predict(p0,b.v,r,2.5);if(h&&h.type==='person'&&!h.p.vehicle&&(h.p.isTarget||mode===1&&h.dist>=280)&&(h.part!=='arm'&&h.part!=='leg'||r.power>=3)){startBulletCam(b,h);}}
 if(G.ammo===0&&G.reserve>0)G.hint='R · RELOAD';return true;}
function reload(){if(G.reloadT>0||G.ammo>=G.rifle.mag||G.reserve<=0||G.app!=='play')return;G.reloadT=G.rifle.reload;snd.play('reload');}
function updateBullets(dt){const a=new V();for(const b of G.bullets){if(b.done)continue;let steps=Math.max(1,Math.ceil(dt/SUB));const h0=dt/steps;
  for(let s=0;s<steps&&!b.done;s++){a.copy(b.p);stepBullet(b.p,b.v,b.r.k,b.w,h0);b.t+=h0;let h=collide(b,a,b.p),guard=0;
   while(h&&penetrates(b,h)&&guard++<4){b.pass.add(h.col);if(h.type==='vehicle'||h.kind==='glass'){fx.glass(h.pos);snd.play('impact',.5,'glass');}h=collide(b,a,b.p);}
   if(h){b.p.copy(h.pos);impact(b,h);b.done=true;}if(b.t>4||b.p.y<-80)b.done=true;}
  const tr=b.trace;if(tr&&tr.n<96){tr.a[tr.n*3]=b.p.x;tr.a[tr.n*3+1]=b.p.y;tr.a[tr.n*3+2]=b.p.z;tr.n++;tr.l.geometry.attributes.position.needsUpdate=true;tr.l.geometry.setDrawRange(0,tr.n);tr.l.geometry.computeBoundingSphere();}
  else if(tr){tr.a.copyWithin(0,3);tr.a[95*3]=b.p.x;tr.a[95*3+1]=b.p.y;tr.a[95*3+2]=b.p.z;tr.l.geometry.attributes.position.needsUpdate=true;}
  if(b.done&&tr)tr.t=1.4;}
 G.bullets=G.bullets.filter(b=>!b.done||b===(G.bc&&G.bc.b));}
function impact(b,h){const dist=Math.round(h.pos.distanceTo(b.from));const dir=b.v.clone().normalize();
 if(h.type==='person'){const p=h.p;G.hits++;const kill=h.part==='head'||h.part==='torso'||b.r.power>=3||p.wounded;fx.dust(h.pos,C(0xc8c0b8),8,.12);snd.play('hit',Math.max(.2,1-dist/700),G.phase==='bulletcam'?0:Math.min(1.2,dist/340));
  if(kill){const moving=p.vehicle?p.vehicle.spd>2:(p.spd>2||p.ski);p.kill({dir,force:2+b.r.power*1.1,part:h.part,lift:.4});G.onKill(p,{by:'shot',part:h.part,dist,moving});G.hitFx={t:.4,kill:true};}
  else{p.wounded=true;G.hitFx={t:.4,kill:false};hud.toast('WOUNDED — FINISH IT','bad',2);if(p.isTarget)G.L.flee(p);else if(p.role==='guard')p.startle(p.pos,1.5);else p.panic(p.pos);addSusp(25);}
  alertNear(h.pos,8,.9,p);return;}
 if(h.type==='vehicle'){G.hits++;h.v.damage(h.part,b.r.power,G);fx.sparks(h.pos,12);snd.play('impact',.6,'metal');G.hitFx={t:.3,kill:false};for(const q of h.v.occ)if(q.alive&&q.role!=='civ'&&!q.isTarget)q.lookP=G.perchPos().clone();alertNear(h.pos,8,1.2);if(h.v.occ.some(q=>q.isTarget&&q.alive))addSusp(15);return;}
 const k=h.kind,o=h.col&&h.col.owner;if(o&&o.trigger){G.hits++;o.trigger(G);G.hitFx={t:.3,kill:false};}else if(o&&o.damage&&!o.trigger){G.hits++;o.damage(G);G.hitFx={t:.3,kill:false};snd.play('impact',.7,'metal');}
 if(k==='water'){fx.splash(h.pos);snd.play('impact',.5,'water');}else if(k==='metal'){fx.sparks(h.pos,10);snd.play('impact',.5,'metal');}
 else{const env=G.M.id;const col=k==='ground'?(env==='ski'?C(0xf4f8ff):env==='desert'?C(0xd8b888):env==='city'?C(0x5a5a5a):C(0x9a8a6a)):IMP[k]||C(0xa8a49a);fx.dust(h.pos,col,14,.3);snd.play('impact',.4,k);}
 alertNear(h.pos,7,1);}
function alertNear(p,r,str,skip){let n=0;for(const q of G.L.people){if(!q.alive||q.gone||q===skip||q.hidden)continue;const d=q.pos.distanceTo(p);if(d<r){n++;const s=d<2.6?1.5:str;if(q.isTarget&&s>1.2)G.L.flee(q);else q.startle(p.clone(),s);}}if(n)addSusp(5+n*2.5,n>1?'SHOT SPOOKED THE CROWD':'');}

/* ================= bullet cam ================= */
function startBulletCam(b,h){G.phase='bulletcam';G.bc={b,h,ph:'fly',t:0,cp:cam.position.clone(),cq:cam.quaternion.clone(),cf:cam.fov,T:h.t,pos:b.p.clone(),dir:b.v.clone().normalize(),side:new V()};b.cam=true;
 G.bc.side.crossVectors(G.bc.dir,new V(0,1,0)).normalize();if(Math.random()<.5)G.bc.side.negate();bulletMesh.visible=true;document.body.classList.add('bc');$('bcam').hidden=false;snd.play('slowmo');}
function bcScale(){const bc=G.bc;if(!bc)return 1;if(bc.ph==='impact')return .28;const left=bc.b.done?0:Math.max(0,(bc.T-bc.b.t)*bc.b.v.length());const base=clamp(bc.T/2.4,.025,.35);return left<14?base*.3:base;}
function updateBulletCam(dt){const bc=G.bc;if(!bc)return;bc.t+=dt;const b=bc.b;const dir=b.v.clone().normalize();
 if(bc.ph==='fly'){if(b.done){bc.ph='impact';bc.t=0;bc.at=b.p.clone();bc.cpos=cam.position.clone();snd.play('hit',1);}
  else{const want=b.p.clone().addScaledVector(dir,-1.5).addScaledVector(bc.side,.38).add(new V(0,.18,0));cam.position.lerp(want,bc.t<.05?1:Math.min(1,dt*30));cam.fov=46;cam.updateProjectionMatrix();const look=b.p.clone().addScaledVector(dir,5);cam.lookAt(look);
   bulletMesh.position.copy(b.p);bulletMesh.lookAt(b.p.clone().add(dir));bulletMesh.rotateZ(bc.t*40);bulletMesh.scale.setScalar(1.5);if(Math.random()<.8)smk.emit(b.p.x-dir.x*.3,b.p.y-dir.y*.3,b.p.z-dir.z*.3,0,0,0,.9,.92,.95,.05,.25,{grow:.5,a:.35,drag:3});
   $('bcd').textContent=Math.round(b.p.distanceTo(b.from))+' M';}}
 if(bc.ph==='impact'){bulletMesh.visible=false;const tgt=bc.h.p&&bc.h.p.rig.rag?bc.h.p.rig.rag.pts[3]:bc.at;const ang=bc.t*.35;const off=bc.side.clone().multiplyScalar(2.6).add(dir.clone().multiplyScalar(-2.8)).applyAxisAngle(new V(0,1,0),ang).add(new V(0,1.1,0));
  cam.position.lerp(tgt.clone().add(off),Math.min(1,dt*3));cam.lookAt(tgt);if(bc.t>1.9)endBulletCam();}}
function endBulletCam(){if(!G.bc)return;const bc=G.bc;G.bc=null;G.phase=G.result?'end':'live';bulletMesh.visible=false;document.body.classList.remove('bc');$('bcam').hidden=true;cam.position.copy(G.perches[G.perch].p);cam.fov=bc.cf;cam.updateProjectionMatrix();if(!bc.b.done){bc.b.cam=false;}}
function skipBulletCam(){const bc=G.bc;if(!bc)return;if(bc.ph==='fly'){let g=0;while(!bc.b.done&&g++<2000)updateBullets(SUB*4);}endBulletCam();}

/* ================= perception: bodies get found ================= */
function perception(){const L=G.L;const bodies=L.people.filter(p=>!p.alive&&!p.found&&!p.hidden&&!p.gone);if(!bodies.length)return;
 for(const b of bodies){const bp=b.rig.rag?b.rig.rag.pts[3]:b.pos.clone().add(new V(0,1,0));for(const q of L.people){if(!q.alive||q.gone||q.hidden||q.vehicle&&q.vehicle.type==='chair'||q.state==='panic'&&q.act==='cower')continue;const e=q.eye;const d=e.distanceTo(bp);if(d>24)continue;
   const fx_=Math.sin(q.yaw),fz=Math.cos(q.yaw),dx=bp.x-q.pos.x,dz=bp.z-q.pos.z,dl=Math.hypot(dx,dz)||1;if((fx_*dx+fz*dz)/dl<-.25&&d>5)continue;if(!G.W.los(e,bp.clone().add(new V(0,.25,0))))continue;
   b.found=true;bodyFound(b,q,bp);break;}}}
function bodyFound(b,q,bp){const acc=b.deathInfo&&(b.deathInfo.accident||b.deathInfo.by!=='shot');addSusp(acc?8:q.role==='guard'?42:30,acc?'':'BODY FOUND');if(q.role==='guard'||q.role==='hostile')q.startle(bp,1.5);else{q.panic(bp);}
 for(const o of G.L.people)if(o.alive&&!o.gone&&o!==q&&(o.role==='civ'||o.role==='staff')&&o.pos.distanceTo(bp)<12&&!acc)o.panic(bp);}

/* ================= input ================= */
const keys={},edge={};let locked=false,mouseDX=0,mouseDY=0;
function lock(){if(G.app!=='play'||G.intel)return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function unlock(){if(document.pointerLockElement)document.exitPointerLock();}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='play'&&!G.intel&&G.phase!=='end')pause(true);});
addEventListener('mousemove',e=>{if(locked||e.buttons&4){mouseDX+=e.movementX;mouseDY+=e.movementY;}});
canvas.addEventListener('mousedown',e=>{snd.resume();if(G.app==='brief'){return;}if(G.app!=='play')return;if(!locked&&e.button===0&&!G.intel){lock();return;}
 if(e.button===0){if(G.phase==='bulletcam'){skipBulletCam();return;}if(G.binos)tag();else fireShot();}else if(e.button===2){if(G.binos){G.binos=false;}G.scopeOn=!G.scopeOn;snd.play('zoom');}});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('wheel',e=>{if(G.app!=='play')return;zoomBy(e.deltaY>0?-1:1);},{passive:true});
function zoomBy(s){if(G.binos){G.bzoom=clamp(G.bzoom*(s>0?1.15:1/1.15),4,24);snd.play('zoom');}else if(G.scopeOn){G.zoom=clamp(G.zoom*(s>0?1.12:1/1.12),G.scope.min,G.scope.max);snd.play('zoom');}}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(G.app==='play'&&G.intel){closeIntel();return;}if(G.app==='play')pause(true);else if(G.app==='paused')pause(false);return;}
 if(G.app==='brief'&&(e.code==='Space'||e.code==='Enter')){begin();return;}
 if(G.app==='over'&&e.code==='Enter'){$('next').click();return;}
 if(G.app!=='play')return;
 if(e.code==='Tab'){if(G.intel)closeIntel();else{unlock();openIntel(false);}return;}
 if(G.intel)return;
 if(G.phase==='bulletcam'&&(e.code==='Space'||e.code==='Enter')){skipBulletCam();return;}
 if(e.code==='KeyC'){G.binos=false;G.scopeOn=!G.scopeOn;snd.play('zoom');}
 if(e.code==='KeyB'){G.binos=!G.binos;if(G.binos)G.scopeOn=false;snd.play('zoom');}
 if(e.code==='KeyF')tag();
 if(e.code==='KeyR')reload();
 if(e.code==='KeyQ')zoomBy(-1);if(e.code==='KeyE')zoomBy(1);
 if(e.code==='KeyW'||e.code==='ArrowUp'){G.zero=clampZero(G.zero+25);snd.play('zoom');}if(e.code==='KeyS'||e.code==='ArrowDown'){G.zero=clampZero(G.zero-25);snd.play('zoom');}
 if(e.code==='KeyZ'){if(G.diff<2&&G.range>0){G.zero=clampZero(G.range);snd.play('ui');}else hud.toast('NO RANGEFINDER ON ELITE — USE THE MIL-DOTS','bad',2);}
 if(e.code==='Digit1'||e.code==='Digit2'||e.code==='Digit3')relocate(+e.code.slice(5)-1);
 if(e.code==='KeyP')relocate((G.perch+1)%G.perches.length);});
addEventListener('keyup',e=>{keys[e.code]=false;});addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
function tag(){const p=G.look;if(!p)return;p.tag=!p.tag;snd.play('tag');if(p.tag)hud.toast('TAGGED','',1.2);}
const padPrev={};
function readPad(dt){const gp=navigator.getGamepads?[...navigator.getGamepads()].find(Boolean):null;if(!gp)return;const ax=gp.axes,bt=gp.buttons,pr=padPrev,dz=v=>Math.abs(v)>.15?v:0;const on=i=>bt[i]&&bt[i].pressed,eg=i=>on(i)&&!pr[i];
 if(G.app==='play'&&!G.intel){const k=1.9*dt*(cam.fov/60);G.yaw-=dz(ax[2]||0)*k;G.pitch-=dz(ax[3]||0)*k;const lt=(bt[6]?.value||0)>.4;if(lt!==pr.lt){G.scopeOn=lt;if(lt)G.binos=false;}pr.lt=lt;
  if(eg(7)){if(G.phase==='bulletcam')skipBulletCam();else if(G.binos)tag();else fireShot();}if(on(4))zoomBy(-dt*3>0?-1:-1),G.zoom=clamp(G.zoom/Math.pow(1.6,dt),G.scope.min,G.scope.max);if(on(5))G.zoom=clamp(G.zoom*Math.pow(1.6,dt),G.scope.min,G.scope.max);
  G.padBreath=on(0);if(eg(3)){G.binos=!G.binos;if(G.binos)G.scopeOn=false;}if(eg(2))tag();if(eg(1))reload();if(eg(12))G.zero=clampZero(G.zero+25);if(eg(13))G.zero=clampZero(G.zero-25);if(eg(11))relocate((G.perch+1)%G.perches.length);
  if(eg(8)){unlock();openIntel(false);}}
 else if(G.app==='brief'&&eg(0))begin();
 if(eg(9)){if(G.app==='play')pause(true);else if(G.app==='paused')pause(false);}for(let i=0;i<17;i++)pr[i]=on(i);}

/* ================= aim + sway ================= */
function aim(dt){const sens=.0021*(cam.fov/60);G.yaw-=mouseDX*sens;G.pitch-=mouseDY*sens;mouseDX=mouseDY=0;
 G.yaw=G.yaw0+clamp(((G.yaw-G.yaw0+Math.PI*3)%(Math.PI*2))-Math.PI,-1.35,1.35);G.pitch=clamp(G.pitch,-1.05,.6);
 const want=(keys.ShiftLeft||keys.ShiftRight||G.padBreath)&&G.scoped>.5&&!G.binos;if(want&&G.breath>0&&G.gasp<=0){if(!G.holding){G.holding=true;snd.play('inhale');}G.breath-=20*dt;G.hbT=(G.hbT||0)-dt;if(G.hbT<=0){G.hbT=.78;snd.play('heart');}if(G.breath<=0){G.breath=0;G.gasp=3;G.holding=false;snd.play('gasp');}}
 else{if(G.holding){G.holding=false;snd.play('exhale');}G.breath=Math.min(100,G.breath+(G.gasp>0?9:17)*dt);}G.gasp=Math.max(0,G.gasp-dt);
 const r=G.rifle,t=G.t*1+G.swayPh;const A=G.swayOff?0:(1.55-r.stab)*1.25e-3*DIFF[G.diff].sway*(G.holding?.12:1)*(G.gasp>0?2.3:1)*(G.binos?.35:G.scoped>.5?1:.7);
 G.sx=A*(Math.sin(1.07*t)*.62+Math.sin(2.31*t+1.3)*.24+Math.sin(.37*t+.5)*.5);G.sy=A*(Math.sin(.83*t+2)*.55+Math.sin(1.93*t)*.3+Math.sin(.29*t+1)*.4)+(G.holding?0:A*.5*Math.sin(t*1.5));
 G.rec*=Math.exp(-dt*5);G.recY*=Math.exp(-dt*5);G.shake=Math.max(0,(G.shake||0)-dt*1.5);const sh=(G.shake||0)**2*.01;
 cam.rotation.set(G.pitch+G.sy+G.rec+(Math.random()-.5)*sh,G.yaw+G.sx+G.recY+(Math.random()-.5)*sh,0);
 G.par.x=lerp(G.par.x,-(G.sx-(G.psx||0))/Math.max(dt,1e-3)*900,.2);G.par.y=lerp(G.par.y,(G.sy-(G.psy||0))/Math.max(dt,1e-3)*900+G.rec*900,.2);G.par.x=clamp(G.par.x,-24,24);G.par.y=clamp(G.par.y,-24,40);G.psx=G.sx;G.psy=G.sy;
 // scope / binocular field of view + viewmodel pose
 G.scoped+=((G.scopeOn&&!G.binos?1:0)-G.scoped)*Math.min(1,dt*9);const fovS=BASE_FOV/G.zoom,fovB=BASE_FOV/G.bzoom;const e=G.scoped*G.scoped;cam.fov=G.binos?fovB:lerp(BASE_FOV,fovS,e>.9?1:e*.25);cam.updateProjectionMatrix();
 if(vm){vm.visible=G.scoped<.85&&!G.binos;const k=G.scoped;vm.position.set(lerp(.17,0,k),lerp(-.2,-.075,k)-G.rec*.6,lerp(-.3,.05,k)+G.rec*1.5);vm.rotation.set(G.rec*2,.05*(1-k),0);
  const bt=G.cycleT>0&&G.rifle.cycle>.6?1-G.cycleT/G.rifle.cycle:1;vm.userData.bolt.rotation.x=bt<.25?-bt*5:bt<.75?-1.25:-(1-bt)*5;vm.userData.bolt.position.z=-.07+(bt>.25&&bt<.75?.08*Math.sin((bt-.25)*2*Math.PI):0);
  if(vm.userData.ft>0){vm.userData.ft-=dt;if(vm.userData.ft<=0)vm.userData.flash.visible=false;}}}

/* ================= rangefinder + ballistic readouts ================= */
const _f=new V();
function rangefind(){_f.set(0,0,-1).applyQuaternion(cam.quaternion);const a=cam.position.clone().addScaledVector(_f,1),b=cam.position.clone().addScaledVector(_f,1600);
 let best=G.W.segment(a.x,a.y,a.z,b.x,b.y,b.z,{coarse:false});let t=best?best.t:2;for(const p of G.L.people){if(p.gone)continue;const h=p.hit(a,b);if(h&&h.t<t)t=h.t;}for(const v of G.L.vehicles){if(v.gone||v.type==='chair')continue;const h=v.hit(a,b);if(h&&h.t<t)t=h.t;}
 G.range=t<=1?t*1599+1:0;
 // look target for binoculars: nearest person to the reticle centre
 G.look=null;if(G.binos){let bd=.012*(60/cam.fov)**0;const fov=cam.fov*Math.PI/180;let best2=null,bs=1e9;for(const p of G.L.people){if(p.gone||p.hidden)continue;const c=p.rig.rag?p.rig.rag.pts[3]:p.pos.clone().add(new V(0,1.2,0));const d=c.clone().sub(cam.position);const z=d.dot(_f);if(z<2)continue;const off=d.clone().addScaledVector(_f,-z).length()/z;if(off<fov*.06&&off<bs){bs=off;best2=p;}}
  G.look=best2;if(best2){const tr=best2.traits.slice();if(best2.alive&&best2.act==='phone'&&!best2.path.length)tr.push('ON THE PHONE');if(best2.alive&&best2.act==='smoke'&&!best2.path.length)tr.push('SMOKING');if(best2.ski)tr.push('SKIING');
   const clues=[...new Set(G.M.targets.flatMap(t=>t.clues))];G.lookTraits=tr.map(t=>({t,m:G.diff===0?(clues.includes(t)?1:0):0}));if(G.diff===0)for(const c of clues)if(c.startsWith('NO ')&&tr.includes(c.slice(3)))G.lookTraits.push({t:c,m:-1});else if(c.startsWith('NO ')&&!tr.includes(c.slice(3)))G.lookTraits.push({t:c,m:1});}}
 const rr=G.range>5?Math.round(G.range/10)*10:0;G.dropAt=rr?dropMils(G.rifle,G.zero,rr):0;const rx=Math.cos(G.yaw),rz=-Math.sin(G.yaw);const cross=G.wind.x*rx+G.wind.z*rz;G.windMil=rr?driftAt(G.rifle,rr,cross)/rr*1000:0;
 if(G.diff===0&&G.scoped>.5&&rr){const H=hud.ov.height,W=hud.ov.width,ppm=(H/2)/Math.tan(cam.fov*Math.PI/360)*.001;G.pred={x:W/2+G.windMil*ppm,y:H/2+G.dropAt*ppm};}else G.pred=null;}

/* ================= simulation step ================= */
function windUpdate(t){const w=G.M.wind;const g=Math.sin(t*.21)*.5+Math.sin(t*.53+1.3)*.3+Math.sin(t*1.7)*.2;const s=Math.max(.3,w.base+w.gust*g);const a=w.a+Math.sin(t*.031)*.22+Math.sin(t*.13)*.05;G.wind.set(Math.cos(a)*s,0,Math.sin(a)*s);}
function sim(dt){const M=G.M,L=G.L;G.t+=dt;windUpdate(G.t);
 if(G.phase!=='end'){G.clock-=dt;}
 L.update(dt,G.t);if(M.script)M.script(G,L,dt,G.t);updateBullets(dt);
 G.bodiesT-=dt;if(G.bodiesT<=0){G.bodiesT=.3;perception();}
 if(!G.alarm&&G.t-G.lastEvt>5)G.susp=Math.max(0,G.susp-1.1*dt);if(G.t-G.lastShotAt>2.5)G.expo=Math.max(0,G.expo-5*dt);
 if(G.phase==='end')return;
 if(G.expo>=100)return fail('COMPROMISED — PINNED DOWN BY RETURN FIRE');
 if(!G.departing&&G.clock<=M.depart){G.departing=true;for(const t of G.targets)if(t.alive)L.depart(t);hud.banner('TARGET IS LEAVING','STOP HIM BEFORE THE CLOCK RUNS OUT','#ffd040',2.4);}
 for(const t of G.targets){if(!t.alive)continue;const v=t.vehicle;if(v&&(v.gone||v.departing&&v.pos.distanceTo(M.env.center)>430))return fail('THE TARGET ESCAPED');}
 if(G.clock<=0){G.clock=0;return fail('TARGET LEFT THE AREA');}
 if(G.ammo<=0&&G.reserve<=0&&G.reloadT<=0&&!G.bullets.length)return fail('OUT OF AMMUNITION');}
function step(dt){dt=Math.min(dt,.1);readPad(dt);if(hud.banT>0&&G.app!=='play')hud.update(G,0);
 if(G.app==='menu'){menuA+=dt;if(G.L){G.t+=dt;windUpdate(G.t);G.L.update(dt,G.t);if(G.M.script)G.M.script(G,G.L,dt,G.t);}visuals(dt,dt);menuCam(dt);return;}
 if(G.app==='over'){overCam(dt);visuals(dt,dt*.3);if(G.L)G.L.update(dt*.3,G.t+=dt*.3);return;}
 if(G.app!=='play'||G.intel){visuals(dt,0);if(G.app==='brief'||G.intel){aim(dt);}hud.update(G,dt);return;}
 // play
 let ts=1;if(G.phase==='bulletcam')ts=bcScale();else if(G.phase==='end')ts=G.bc?bcScale():.45;
 if(G.phase==='relocate'){G.relT+=dt;if(G.relT>.55&&G.relTo!==null){setPerch(G.relTo);G.relTo=null;}if(G.relT>1.5){G.phase='live';$('fade').classList.remove('on');}}
 const sdt=dt*ts;sim(sdt);
 G.cycleT=Math.max(0,G.cycleT-dt);if(G.reloadT>0){G.reloadT-=dt;if(G.reloadT<=0){const n=Math.min(G.rifle.mag-G.ammo,G.reserve);G.ammo+=n;G.reserve-=n;G.hint='';}}
 if(G.ammo===0&&G.reserve>0&&G.reloadT<=0&&G.cycleT<=0&&G.autoR!==false)reload();
 if(G.hitFx)G.hitFx.t-=dt;G.flashRed=Math.max(0,G.flashRed-dt*1.5);
 if(G.bc){updateBulletCam(dt);}else if(G.phase!=='relocate'||true){if(!G.bc)aim(dt);}
 if(G.phase==='end'&&!G.bc){G.endT+=dt;if(G.endT>2.6)showOver();}
 G.rangeT-=dt;if(G.rangeT<=0&&!G.bc){G.rangeT=.1;rangefind();}
 if(!G.hint||G.hint.startsWith('RMB')||G.hint.startsWith('SHIFT')||G.hint.startsWith('CLICK'))G.hint=!locked?'CLICK TO AIM':G.binos?'':G.scoped>.5?'SHIFT · HOLD BREATH    W/S · RANGE DIAL    Z · AUTO-ZERO':'RMB · SCOPE    B · BINOCULARS    TAB · INTEL';
 visuals(dt,sdt);hud.update(G,dt);}
function visuals(dt,sdt){const W=G.W;if(!W)return;W.update(sdt,G.t,G.wind);add.update(sdt,G.wind);smk.update(sdt,G.wind);flash.intensity*=Math.exp(-sdt*7);
 if(ring.visible){const u=ring.userData;u.t+=sdt;const k=u.t/u.dur;ring.scale.setScalar(.1+k*u.size);ring.material.opacity=Math.max(0,1-k);if(k>=1)ring.visible=false;}
 for(const t of traces){if(t.t>0){t.t-=dt;t.l.material.opacity=.42*Math.min(1,t.t);if(t.t<=0)t.l.visible=false;}}
 if(weather.length){_f.set(0,0,-1).applyQuaternion(cam.quaternion);const foc=cam.position.clone().addScaledVector(_f,clamp(G.range||200,40,700));weather[0].update(sdt,G.wind,cam.position,1);weather[1].update(sdt,G.wind,foc,1);}
 snd.update(dt,{wind:G.wind.length(),slow:G.phase==='bulletcam'||G.phase==='end'&&!!G.bc,muffle:G.app==='paused'||G.intel,music:G.M&&G.M.id==='villa',musicVol:G.app==='menu'?.25:.5,birds:G.M&&(G.M.id==='island'||G.M.id==='villa')});}
function menuCam(dt){const c=G.M.env.center;const a=menuA*.035+G.mi;const r=95;cam.position.set(c.x+Math.cos(a)*r,c.y+26+Math.sin(menuA*.05)*4,c.z+Math.sin(a)*r);cam.fov=55;cam.updateProjectionMatrix();cam.lookAt(c.x,c.y+2,c.z);if(vm)vm.visible=false;}
function overCam(dt){const t=G.targets.find(t=>t.rig.rag)||G.targets[0];const c=t&&t.rig.rag?t.rig.rag.pts[0]:t?t.pos:G.M.env.center;G.oa=(G.oa||0)+dt*.12;cam.position.set(c.x+Math.cos(G.oa)*7,c.y+3.2,c.z+Math.sin(G.oa)*7);cam.fov=50;cam.updateProjectionMatrix();cam.lookAt(c.x,c.y+.6,c.z);if(vm)vm.visible=false;}

/* ================= results ================= */
let lastAward=null;
function showOver(){unlock();G.app='over';G.oa=0;$('hud').hidden=true;document.body.classList.remove('playing','bc');$('fade').classList.remove('on');const r=G.result||{won:false,why:'ABORTED'};const M=G.M;
 for(const s of G.sec)if(s.state==='todo')s.state='fail';let pts=0;const rows=[];
 if(r.won){for(const it of G.items){pts+=it.pts;rows.push([it.n,it.pts]);}const sd=G.sec.filter(s=>s.state==='done').length;if(sd){pts+=sd*1000;rows.push([`SECONDARIES ${sd}/${G.sec.length}`,sd*1000]);}
  if(!G.alarmEver){pts+=1500;rows.push(['NO ALARM RAISED',1500]);}if(!G.civKills){pts+=500;rows.push(['NO CIVILIAN CASUALTIES',500]);}const tb=Math.round(G.clock*4);if(tb){pts+=tb;rows.push([`TIME BONUS ${fmt(G.clock)}`,tb]);}
  const mul=DIFF[G.diff].mul;pts=Math.max(0,Math.round(pts*mul));rows.push([`${DIFF[G.diff].n} ×${mul}`,null]);}
 else rows.push([r.why,null]);
 let stars=0;if(r.won){stars=1;const sd=G.sec.filter(s=>s.state==='done').length;if(sd>=1&&!G.civKills)stars=2;if(sd===G.sec.length&&!G.alarmEver&&!G.civKills)stars=3;}
 const before=totalStars();if(stars>(save.stars[M.id]||0))save.stars[M.id]=stars;if(pts>(save.best[M.id]||0))save.best[M.id]=pts;persist();const after=totalStars();
 const unl=[...RIFLES,...SCOPES].filter(x=>x.unlock>before&&x.unlock<=after).map(x=>x.n);
 $('oeye').textContent=r.won?'MISSION COMPLETE · '+M.n:'MISSION FAILED · '+M.n;$('ores').textContent=r.won?(stars===3?'SILENT ASSASSIN':'TARGET DOWN'):'FAILED';$('ores').style.color=r.won?'#fff':'#ff4040';
 $('obreak').innerHTML=rows.map(([n,p])=>`<tr><td>${n}</td><td class="${p<0?'neg':''}">${p===null?'':(p>0?'+':'')+p.toLocaleString()}</td></tr>`).join('')+(r.won?`<tr class="tot"><td>TOTAL</td><td>${pts.toLocaleString()}</td></tr>`:'');
 const acc=G.shots?Math.round(G.hits/G.shots*100):0;$('ostats').innerHTML=[['ACCURACY',acc+'%'],['LONGEST SHOT',G.longest+' M'],['HEADSHOTS',G.headshots],['TIME',fmt(M.time-G.clock)],['SHOTS FIRED',G.shots],['CIVILIANS',G.civKills]].map(([a,b])=>`<div><b>${b}</b><span>${a}</span></div>`).join('');
 const st=[...$('stars').children];st.forEach(s=>s.classList.remove('on'));st.forEach((s,i)=>{if(i<stars)setTimeout(()=>{s.classList.add('on');snd.play('star',i);},500+i*350);});
 let shown=0;const cnt=()=>{shown=Math.min(pts,shown+Math.max(37,pts/40|0));$('ofs').textContent=shown.toLocaleString()+' PTS';if(shown<pts)requestAnimationFrame(cnt);};$('ofs').textContent='0 PTS';cnt();
 const tok=award(pts,r.won,stars);$('otok').innerHTML=`+${tok} TOKENS · BEST ${(save.best[M.id]||0).toLocaleString()} · ★ ${after}/18`+(unl.length?` · <b>UNLOCKED: ${unl.join(', ')}</b>`:'');
 $('next').hidden=!r.won||G.mi>=MISSIONS.length-1;$('over').hidden=false;}
function award(pts,won,stars){lastAward={pts,won,stars,mission:G.M.n,diff:DIFF[G.diff].n.toLowerCase(),rifle:G.rifle.n,longest:G.longest,acc:G.shots?Math.round(G.hits/G.shots*100):0};
 const tok=5+Math.min(60,pts/250|0);addRound(tok,won);saveBest(ID,pts);return tok;}

/* ================= menu ================= */
function buildMenu(){const o=save.opt,ts=totalStars();
 $('missions').innerHTML=MISSIONS.map((m,i)=>{const s=save.stars[m.id]||0;return`<button class="mc${i===o.mission?' on':''}" data-i="${i}"><span class="st">${'<i>★</i>'.repeat(s)}${'★'.repeat(3-s)}</span><b>${m.n}</b><span>${m.loc}</span><em>${m.targets.map(t=>t.code).join(' + ')} · ${fmt(m.time)}${save.best[m.id]?' · BEST '+save.best[m.id].toLocaleString():''}</em></button>`;}).join('');
 $('missions').querySelectorAll('.mc').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(i===save.opt.mission)return;save.opt.mission=i;persist();snd.play('ui');buildMenu();clearTimeout(G.lt);G.lt=setTimeout(()=>{if(G.app==='menu'){loadMission(i);G.dirty=false;}},120);});
 if(RIFLES[o.rifle].unlock>ts)o.rifle=0;if(SCOPES[o.scope].unlock>ts)o.scope=0;
 $('o-rifle').innerHTML=RIFLES.map((r,i)=>`<button data-v="${i}" class="${i===o.rifle?'on':''}${r.unlock>ts?' lock':''}" data-req="${r.unlock}">${r.n}</button>`).join('');
 $('o-scope').innerHTML=SCOPES.map((r,i)=>`<button data-v="${i}" class="${i===o.scope?'on':''}${r.unlock>ts?' lock':''}" data-req="${r.unlock}">${r.n}</button>`).join('');
 $('o-rifle').querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=+b.dataset.v;if(RIFLES[i].unlock>ts){snd.play('dry');return;}save.opt.rifle=i;persist();snd.play('ui');buildMenu();});
 $('o-scope').querySelectorAll('button').forEach(b=>b.onclick=()=>{const i=+b.dataset.v;if(SCOPES[i].unlock>ts){snd.play('dry');return;}save.opt.scope=i;persist();snd.play('ui');buildMenu();});
 for(const[id,k]of[['o-diff','diff'],['o-bcam','bcam']]){const el=$(id);el.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',+b.dataset.v===o[k]);b.onclick=()=>{save.opt[k]=+b.dataset.v;persist();snd.play('ui');buildMenu();};});}
 const r=RIFLES[o.rifle],sc=SCOPES[o.scope];const bar=(n,v)=>`<div>${n}<i><b style="width:${Math.round(clamp(v,0,1)*100)}%"></b></i></div>`;
 $('lstats').innerHTML=bar('VELOCITY',(r.v0-450)/500)+bar('STEADINESS',r.stab)+bar('POWER',r.power/4)+bar('STEALTH',1-r.noise/1.8)+bar('FOLLOW-UP',1-r.cycle/1.9)+`<p>${r.cls} · ${r.d} <br>${sc.n}: ${sc.d}</p>`;
 $('tot').innerHTML=`<b>★ ${ts}</b> / 18 STARS`;}
$('go').onclick=()=>start({reload:true});$('begin').onclick=()=>begin();$('again').onclick=()=>start({reload:true});$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{G.app='play';toMenu();};$('restart').onclick=()=>start({reload:true});
$('next').onclick=()=>{if(G.mi<MISSIONS.length-1){save.opt.mission=G.mi+1;persist();start({reload:true});}else toMenu();};
$('post').onclick=()=>{const a=lastAward||{};const u=userName();
 const body=`Game: Long Shot\nPoints: ${a.pts||0}\nMission: ${a.mission||''} · ${a.won?'complete':'failed'} · ${a.stars||0} stars\nDifficulty: ${a.diff||''} · Rifle: ${a.rifle||''}\nLongest shot: ${a.longest||0} m · Accuracy: ${a.acc||0}%\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 postScore(ID,a.pts||0,body);};

/* ================= render ================= */
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
 const sc=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));add.U.uScale.value=sc;smk.U.uScale.value=sc;
 if(G.W&&G.W.skyMesh)G.W.skyMesh.position.copy(cam.position);
 if(G.W)post().render();hud.draw(G,cam);}

/* ================= boot ================= */
G.swayPh=Math.random()*100;
loadMission(save.opt.mission);G.dirty=false;buildMenu();G.app='menu';
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
setTimeout(()=>$('loading').classList.add('off'),300);

/* ================= test hooks ================= */
function solveAim(target,o={}){// returns {yaw,pitch} that puts the bullet on a world point with current zero + wind (no sway)
 const r=G.rifle,p0=cam.position.clone();let yaw=G.yaw,pitch=G.pitch;const t=target.clone();const d0=t.clone().sub(p0);yaw=Math.atan2(-d0.x,-d0.z);pitch=Math.atan2(d0.y,Math.hypot(d0.x,d0.z));
 for(let it=0;it<6;it++){const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));const f=new V(0,0,-1).applyQuaternion(q),up=new V(0,1,0).applyQuaternion(q);const za=zeroAngle(r,G.zero);const dir=f.clone().multiplyScalar(Math.cos(za)).addScaledVector(up,Math.sin(za)).normalize();
  const p=p0.clone().addScaledVector(f,.6),v=dir.multiplyScalar(r.v0),w=G.wind.clone();const D=t.distanceTo(p0);let prev=p.clone();for(let i=0;i<4000;i++){prev.copy(p);stepBullet(p,v,r.k,w,SUB);if(p.distanceTo(p0)>=D)break;}
  const miss=t.clone().sub(p);const right=new V(1,0,0).applyQuaternion(q),upv=new V(0,1,0).applyQuaternion(q);yaw-=miss.dot(right)/D;pitch+=miss.dot(upv)/D;}return{yaw,pitch};}
function aimAt(target,part='torso'){let p=target;if(target&&target.rig){const hv=target.hitVolumes();p=part==='head'?hv.head.clone():hv.chest.clone().lerp(hv.hips,.4);}const s=solveAim(p);G.yaw=s.yaw;G.pitch=s.pitch;G.yaw0=G.yaw0;G.rec=0;G.recY=0;G.swayOff=true;aim(0);return s;}
window.LONGSHOT={get state(){return G.app==='play'?G.phase:G.app;},get app(){return G.app;},get phase(){return G.phase;},G,step,render,start,begin,toMenu,pause,relocate,
 get clock(){return G.clock;},setClock(s){G.clock=s;},get M(){return G.M;},get L(){return G.L;},get people(){return G.L.people;},targets:()=>G.targets,byId:id=>G.L.byId(id),
 aimAt,solveAim,fire:(o={})=>{G.cycleT=0;return fireShot({noCam:o.noCam!==false?true:false,force:true,...o});},scope:on=>{G.scopeOn=on;G.scoped=on?1:0;},setZoom:z=>{G.zoom=z;},skip:()=>skipBulletCam(),
 forceAlarm:()=>{addSusp(200);},setDiff:d=>{G.diff=d;},MISSIONS,RIFLES,SCOPES,cam,scene,R,setQuality:applyQuality,save:()=>save,get result(){return G.result;},openIntel,closeIntel,tag,
 setPerch:i=>setPerch(i),get bullets(){return G.bullets;},rangefind,predict:()=>{const f=new V(0,0,-1).applyQuaternion(cam.quaternion),up=new V(0,1,0).applyQuaternion(cam.quaternion),za=zeroAngle(G.rifle,G.zero);const dir=f.clone().multiplyScalar(Math.cos(za)).addScaledVector(up,Math.sin(za)).normalize();return predict(cam.position.clone().addScaledVector(f,.6),dir.multiplyScalar(G.rifle.v0),G.rifle,3);}};
