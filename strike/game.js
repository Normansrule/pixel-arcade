import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey} from '../js/fx3d.js';


/* ================= map ================= */
const MAP=[
'########################',
'#P.....#........#......#',
'#......#..c..c..#...E..#',
'#..cc..#........#......#',
'#......####..####..cc..#',
'#...........c..........#',
'####..c..........c...###',
'#......##......##......#',
'#..E...##..cc..##...E..#',
'#......##......##......#',
'###..c..............c.##',
'#..........c..c........#',
'#..cc..####....####....#',
'#......#..........#..c.#',
'#..E...#...c..c...#....#',
'#......#..........#..E.#',
'#...c..................#',
'########################'];
const MW=MAP[0].length,MH=MAP.length,CS=2,CRATE=1.1;
const cellAt=(x,z)=>{const i=Math.floor(x/CS),j=Math.floor(z/CS);return(i<0||j<0||i>=MW||j>=MH)?'#':MAP[j][i];};
const blocked=(x,z,feet)=>{const c=cellAt(x,z);return c==='#'||(c==='c'&&feet<CRATE-.05);};
const groundAt=(x,z)=>cellAt(x,z)==='c'?CRATE:0;
const spawns=[],cellC=(i,j)=>new THREE.Vector3(i*CS+CS/2,0,j*CS+CS/2);let pSpawn;
MAP.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='E')spawns.push(cellC(i,j));if(ch==='P')pSpawn=cellC(i,j);}));

/* ================= renderer ================= */
const canvas=document.getElementById('c');
const R=new THREE.WebGLRenderer({canvas,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;R.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x1a1530);scene.fog=new THREE.FogExp2(0x1a1530,.028);
const cam=new THREE.PerspectiveCamera(75,1,.05,200);
const hemi=new THREE.HemisphereLight(0xa8b4ff,0x2a2030,.55);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe2c0,1.6);sun.position.set(30,40,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:120});sun.target.position.set(MW,0,MH);scene.add(sun,sun.target);

/* procedural textures */
function tex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep[0],rep[1]);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const noise=(x,w,h,a,base)=>{x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<w*h/6;i++){const v=Math.random()*a|0;x.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},${v/255})`;x.fillRect(Math.random()*w|0,Math.random()*h|0,2,2);}};
const concrete=tex(256,256,(x,w,h)=>{noise(x,w,h,30,'#6e6a78');x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=3;x.strokeRect(2,2,w-4,h-4);x.beginPath();x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();for(let i=0;i<6;i++){x.fillStyle='rgba(0,0,0,.25)';x.beginPath();x.arc(20+i*40,h/2-10,3,0,7);x.fill();}x.fillStyle='rgba(255,207,63,.8)';x.fillRect(0,h-26,w,8);for(let i=0;i<w;i+=32){x.fillStyle='#111';x.beginPath();x.moveTo(i,h-26);x.lineTo(i+16,h-26);x.lineTo(i,h-18);x.fill();}});
const floor=tex(256,256,(x,w,h)=>{noise(x,w,h,25,'#3a3844');x.strokeStyle='rgba(0,0,0,.45)';x.lineWidth=2;for(let i=0;i<=w;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();x.beginPath();x.moveTo(0,i);x.lineTo(w,i);x.stroke();}},[MW,MH]);
const crateT=tex(128,128,(x,w,h)=>{noise(x,w,h,40,'#8a5c33');x.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<h;i+=21)x.fillRect(0,i,w,2);x.strokeStyle='#4a2f16';x.lineWidth=10;x.strokeRect(5,5,w-10,h-10);x.beginPath();x.moveTo(8,8);x.lineTo(w-8,h-8);x.moveTo(w-8,8);x.lineTo(8,h-8);x.stroke();});
const wallM=new THREE.MeshStandardMaterial({map:concrete,roughness:.92,metalness:.05});
const floorM=new THREE.MeshStandardMaterial({map:floor,roughness:.85,metalness:.1});
const crateM=new THREE.MeshStandardMaterial({map:crateT,roughness:.8});

/* world geometry (instanced) */
const walls=[],crates=[];MAP.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='#')walls.push([i,j]);if(ch==='c')crates.push([i,j]);}));
const WH=3.4;const wallMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(CS,WH,CS),wallM,walls.length);const m4=new THREE.Matrix4();
walls.forEach((w,k)=>{m4.makeTranslation(w[0]*CS+1,WH/2,w[1]*CS+1);wallMesh.setMatrixAt(k,m4);});wallMesh.castShadow=wallMesh.receiveShadow=true;scene.add(wallMesh);
const crateMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(CS*.92,CRATE,CS*.92),crateM,crates.length);crates.forEach((c,k)=>{m4.makeRotationY((k%3)*.08);m4.setPosition(c[0]*CS+1,CRATE/2,c[1]*CS+1);crateMesh.setMatrixAt(k,m4);});crateMesh.castShadow=crateMesh.receiveShadow=true;scene.add(crateMesh);
const fl=new THREE.Mesh(new THREE.PlaneGeometry(MW*CS,MH*CS),floorM);fl.rotation.x=-Math.PI/2;fl.position.set(MW,0,MH);fl.receiveShadow=true;scene.add(fl);
// neon strips + lamps for atmosphere
const stripM=[0x2fe8d0,0xff3f8e,0xffcf3f].map(c=>new THREE.MeshBasicMaterial({color:c}));
walls.forEach((w,k)=>{if(k%7)return;const s=new THREE.Mesh(new THREE.BoxGeometry(CS*1.01,.08,CS*1.01),stripM[k%3]);s.position.set(w[0]*CS+1,2.6,w[1]*CS+1);scene.add(s);});
[[6,5],[24,5],[40,5],[12,22],[36,22],[24,30]].forEach((p,k)=>{const l=new THREE.PointLight([0xff9a50,0x6ad8ff,0xff5aa0][k%3],18,16,1.6);l.position.set(p[0],2.8,p[1]);scene.add(l);});
const worldHit=[wallMesh,crateMesh,fl];

/* ================= audio ================= */
let AC=null;const sfx=(type)=>{try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime,g=AC.createGain();g.connect(AC.destination);
 if(type==='shot'||type==='eshot'){const len=type==='shot'?.12:.09,b=AC.createBuffer(1,AC.sampleRate*len,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);const s=AC.createBufferSource();s.buffer=b;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=type==='shot'?2400:1200;s.connect(f);f.connect(g);g.gain.value=type==='shot'?.35:.18;s.start(t);}
 else{const o=AC.createOscillator();o.type='square';const map={hit:[900,.05,.06],head:[1400,.08,.08],hurt:[140,.2,.12],reload:[500,.08,.05],pick:[880,.12,.06],wave:[330,.4,.08]}[type]||[440,.05,.05];o.frequency.setValueAtTime(map[0],t);o.frequency.exponentialRampToValueAtTime(map[0]*.6,t+map[1]);g.gain.setValueAtTime(map[2],t);g.gain.linearRampToValueAtTime(0,t+map[1]);o.connect(g);o.start(t);o.stop(t+map[1]);}}catch(e){}};

/* ================= player + weapon ================= */
const P={pos:new THREE.Vector3(),vel:new THREE.Vector3(),yaw:-Math.PI*.75,pitch:0,hp:100,ammo:30,mag:120,reload:0,cd:0,spread:0,crouch:false,onGround:true,kick:0,score:0,kills:0,heads:0,shots:0,hits:0};
const gun=new THREE.Group();cam.add(gun);scene.add(cam);
{const m=(c,r,me)=>new THREE.MeshStandardMaterial({color:c,roughness:r??.4,metalness:me??.6});
 const body=new THREE.Mesh(new THREE.BoxGeometry(.09,.11,.5),m(0x2a2a33));body.position.set(0,0,-.1);gun.add(body);
 const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.34,10),m(0x151518));barrel.rotation.x=Math.PI/2;barrel.position.set(0,.02,-.48);gun.add(barrel);
 const hand=new THREE.Mesh(new THREE.BoxGeometry(.07,.08,.16),m(0x1c1c22));hand.position.set(0,-.07,-.28);gun.add(hand);
 const magz=new THREE.Mesh(new THREE.BoxGeometry(.05,.14,.08),m(0x3a3a44));magz.position.set(0,-.11,-.12);magz.rotation.x=.2;gun.add(magz);gun.userData.mag=magz;
 const stock=new THREE.Mesh(new THREE.BoxGeometry(.07,.09,.18),m(0x202028));stock.position.set(0,-.02,.22);gun.add(stock);
 const sight=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.1),m(0x111111));sight.position.set(0,.08,-.08);gun.add(sight);
 const dot=new THREE.Mesh(new THREE.BoxGeometry(.012,.012,.012),new THREE.MeshBasicMaterial({color:0xff3f5a}));dot.position.set(0,.085,-.13);gun.add(dot);
 const glow=new THREE.Mesh(new THREE.BoxGeometry(.092,.012,.3),new THREE.MeshBasicMaterial({color:0x2fe8d0}));glow.position.set(0,.03,-.12);gun.add(glow);
 const arm=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.4),m(0x3a4a3a,.9,0));arm.position.set(.06,-.12,.05);arm.rotation.set(.2,-.2,0);gun.add(arm);}
gun.position.set(.2,-.2,-.35);gun.scale.setScalar(.85);
const flash=new THREE.Mesh(new THREE.PlaneGeometry(.22,.22),new THREE.MeshBasicMaterial({color:0xffd070,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));flash.position.set(0,.02,-.68);gun.add(flash);
const flashL=new THREE.PointLight(0xffb050,0,8,2);flashL.position.set(0,0,-.8);gun.add(flashL);

/* ================= enemies ================= */
const EG={body:new THREE.BoxGeometry(.6,.9,.4),head:new THREE.BoxGeometry(.38,.34,.36),leg:new THREE.BoxGeometry(.2,.7,.22),arm:new THREE.BoxGeometry(.16,.6,.16),gun:new THREE.BoxGeometry(.08,.1,.55),visor:new THREE.BoxGeometry(.3,.08,.02)};
const EM={body:new THREE.MeshStandardMaterial({color:0x5a2a3a,roughness:.6,metalness:.4}),dark:new THREE.MeshStandardMaterial({color:0x22202a,roughness:.7,metalness:.5}),visor:new THREE.MeshBasicMaterial({color:0xff3f5a}),hurt:new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff})};
let enemies=[];
function makeEnemy(pos,tier){const g=new THREE.Group();const add=(geo,mat,x,y,z,tag)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.userData.part=tag;g.add(o);return o;};
 const body=add(EG.body,EM.body,0,1.15,0,'body'),head=add(EG.head,EM.dark,0,1.8,0,'head');add(EG.visor,EM.visor,0,1.82,.19,'head');add(EG.leg,EM.dark,-.16,.35,0,'body');add(EG.leg,EM.dark,.16,.35,0,'body');const la=add(EG.arm,EM.body,-.4,1.2,.1,'body');const ra=add(EG.arm,EM.body,.4,1.2,.15,'body');ra.rotation.x=-1.2;add(EG.gun,EM.dark,.4,1.25,.45,'body');
 if(tier>0){const pad=add(new THREE.BoxGeometry(.7,.14,.46),new THREE.MeshStandardMaterial({color:0xffcf3f,metalness:.6,roughness:.3}),0,1.6,0,'body');}
 g.position.copy(pos);scene.add(g);const e={g,body,head,hp:tier?140:90,max:tier?140:90,tier,cd:1+Math.random()*1.5,state:'hunt',flash:0,dead:0,vx:0,vz:0,strafe:Math.random()<.5?1:-1,st:0,parts:g.children};g.children.forEach(c=>c.userData.e=e);enemies.push(e);return e;}

/* ================= fx ================= */
const fx=[];
const tracerM=new THREE.LineBasicMaterial({color:0xfff0a0,transparent:true,opacity:.9});
function tracer(a,b,col){const geo=new THREE.BufferGeometry().setFromPoints([a,b]);const l=new THREE.Line(geo,col?new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.9}):tracerM.clone());scene.add(l);fx.push({o:l,t:.07,k:'fade'});}
const sparkG=new THREE.BufferGeometry();
function sparks(p,col,n){const pos=new Float32Array((n||10)*3),vel=[];for(let i=0;i<(n||10);i++){pos.set([p.x,p.y,p.z],i*3);vel.push(new THREE.Vector3((Math.random()-.5)*4,Math.random()*3,(Math.random()-.5)*4));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));const pts=new THREE.Points(g,new THREE.PointsMaterial({color:col||0xffc060,size:.06,transparent:true}));scene.add(pts);fx.push({o:pts,t:.45,k:'sparks',vel});}
const decalM=new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.75,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4});const decals=[];
function decal(p,n){const d=new THREE.Mesh(new THREE.CircleGeometry(.05,8),decalM);d.position.copy(p).addScaledVector(n,.01);d.lookAt(p.clone().add(n));scene.add(d);decals.push(d);if(decals.length>80)scene.remove(decals.shift());}
const pickups=[];function drop(pos){const kind=Math.random()<.5?'hp':'ammo';const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:kind==='hp'?0x3dff8b:0xffcf3f,emissive:kind==='hp'?0x0a5a2a:0x6a4a00,roughness:.3});
 if(kind==='hp'){g.add(new THREE.Mesh(new THREE.BoxGeometry(.4,.12,.12),m));g.add(new THREE.Mesh(new THREE.BoxGeometry(.12,.4,.12),m));}else g.add(new THREE.Mesh(new THREE.BoxGeometry(.3,.2,.2),m));g.position.set(pos.x,.5,pos.z);scene.add(g);pickups.push({g,kind,t:20});}

/* ================= HUD ================= */
const $=id=>document.getElementById(id);const hud=$('hud');let hitT=0,dmgT=0,dirT=0,dirA=0,banT=0;
const mini=$('mini').getContext('2d');
function feed(t){const f=$('feed');const d=document.createElement('div');d.textContent=t;f.prepend(d);setTimeout(()=>d.remove(),3500);while(f.children.length>5)f.lastChild.remove();}
function banner(t){$('banner').textContent=t;banT=2;}

/* ================= game state ================= */
let state='menu',diff=1,wave=0,toSpawn=0,spawnT=0,breakT=0,time=0,flow=null,flowT=0;
const DIFF=[{acc:.35,dmg:7,rate:1.3},{acc:.5,dmg:9,rate:1},{acc:.65,dmg:12,rate:.8}];
function reset(){enemies.forEach(e=>scene.remove(e.g));enemies=[];pickups.forEach(p=>scene.remove(p.g));pickups.length=0;
 Object.assign(P,{hp:100,ammo:30,mag:120,reload:0,cd:0,spread:0,crouch:false,kick:0,score:0,kills:0,heads:0,shots:0,hits:0,yaw:-Math.PI*.75,pitch:0});P.pos.set(pSpawn.x,0,pSpawn.z);P.vel.set(0,0,0);wave=0;nextWave();time=0;}
function nextWave(){wave++;toSpawn=3+wave*2;spawnT=1.5;breakT=0;banner('WAVE '+wave);sfx('wave');}
function computeFlow(){const f=new Int16Array(MW*MH).fill(-1),pi=Math.floor(P.pos.x/CS),pj=Math.floor(P.pos.z/CS),q=[pj*MW+pi];f[q[0]]=0;
 while(q.length){const c=q.shift(),ci=c%MW,cj=(c/MW)|0;for(const d of[[1,0],[-1,0],[0,1],[0,-1]]){const ni=ci+d[0],nj=cj+d[1];if(ni<0||nj<0||ni>=MW||nj>=MH)continue;const k=nj*MW+ni;if(f[k]<0&&MAP[nj][ni]!=='#'&&MAP[nj][ni]!=='c'){f[k]=f[c]+1;q.push(k);}}}flow=f;}
function los(a,b,crouchCover){const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),n=Math.ceil(d/.25);for(let i=1;i<n;i++){const x=a.x+dx*i/n,z=a.z+dz*i/n,c=cellAt(x,z);if(c==='#')return false;if(crouchCover&&c==='c'&&Math.hypot(x-b.x,z-b.z)<3)return false;}return true;}

/* ================= input ================= */
const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')startReload();if(e.code==='KeyC')P.crouch=!P.crouch;if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();});addEventListener('keyup',e=>keys[e.code]=false);
let mouseDown=false,clickQ=0;
canvas.addEventListener('mousedown',e=>{if(state==='play'&&document.pointerLockElement!==canvas){canvas.requestPointerLock();return;}if(e.button===0){mouseDown=true;clickQ++;}});addEventListener('mouseup',e=>{if(e.button===0)mouseDown=false;});
addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||state!=='play')return;P.yaw-=e.movementX*.0022;P.pitch=Math.max(-1.45,Math.min(1.45,P.pitch-e.movementY*.0022));});
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&state==='play'){state='paused';$('menu').style.display='flex';$('go').textContent='CLICK TO RESUME';document.body.classList.remove('playing');}});
function startReload(){if(P.reload>0||P.ammo===30||P.mag<=0)return;P.reload=1.6;sfx('reload');}
document.querySelectorAll('#diff button').forEach(b=>b.onclick=()=>{diff=+b.dataset.d;document.querySelectorAll('#diff button').forEach(x=>x.classList.toggle('on',x===b));});
function deploy(noLock){if(state==='menu'||state==='over')reset();state='play';$('menu').style.display='none';$('over').hidden=true;hud.hidden=false;document.body.classList.add('playing');if(!noLock)canvas.requestPointerLock();}
$('go').onclick=()=>deploy();$('again').onclick=()=>deploy();
$('post').onclick=()=>{let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}const body=`Game: Strike Zone 3D\nScore: ${P.score}\nWave: ${wave}\nKills: ${P.kills} (${P.heads} headshots)\nDifficulty: ${['recruit','regular','veteran'][diff]}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] strike3d '+P.score)+'&body='+encodeURIComponent(body),'_blank');};

/* ================= shooting ================= */
const ray=new THREE.Raycaster(),tmpV=new THREE.Vector3(),tmpV2=new THREE.Vector3();
function fire(){scene.updateMatrixWorld();if(P.reload>0)return;if(P.ammo<=0){startReload();return;}P.ammo--;P.cd=.1;P.shots++;P.kick=Math.min(1,P.kick+.35);sfx('shot');flash.material.opacity=1;flash.rotation.z=Math.random()*6;flashL.intensity=6;
 const moving=Math.hypot(P.vel.x,P.vel.z)>.5,spr=(.004+P.spread*.03+(moving?.012:0)+(P.onGround?0:.03))*(P.crouch?.6:1);P.spread=Math.min(1,P.spread+.18);
 const dir=new THREE.Vector3(0,0,-1).applyQuaternion(cam.quaternion);dir.x+=(Math.random()-.5)*spr*2;dir.y+=(Math.random()-.5)*spr*2;dir.z+=(Math.random()-.5)*spr*2;dir.normalize();
 cam.getWorldPosition(tmpV);ray.set(tmpV,dir);ray.far=120;const targets=[...worldHit];enemies.forEach(e=>{if(!e.dead)targets.push(...e.parts);});
 const hit=ray.intersectObjects(targets,false)[0];const muzzle=new THREE.Vector3(0,.02,-.7);gun.localToWorld(muzzle);const end=hit?hit.point:tmpV.clone().addScaledVector(dir,80);tracer(muzzle,end);
 if(!hit)return;const e=hit.object.userData.e;if(e){const head=hit.object.userData.part==='head';const dmg=head?100:34;e.hp-=dmg;e.flash=.08;P.hits++;hitT=.15;$('hitm').className=head?'head':'';sfx(head?'head':'hit');sparks(hit.point,head?0xff3f5a:0xffa040,head?16:8);e.state='hunt';
  if(e.hp<=0){e.dead=1;P.kills++;if(head)P.heads++;const pts=(e.tier?150:100)+(head?50:0);P.score+=pts;feed((head?'HEADSHOT ':'')+'+'+pts);if(Math.random()<.35)drop(e.g.position);}}
 else{sparks(hit.point,0xffd080,6);if(hit.face){const n=hit.face.normal.clone();if(hit.object.isInstancedMesh){}decal(hit.point,n.transformDirection(hit.object.matrixWorld));}}}

/* ================= update ================= */
function hurt(dmg,from){P.hp-=dmg;dmgT=.35;sfx('hurt');const a=Math.atan2(from.x-P.pos.x,from.z-P.pos.z);dirA=a;dirT=.8;if(P.hp<=0){P.hp=0;gameOver();}}
function gameOver(){state='over';document.exitPointerLock&&document.exitPointerLock();document.body.classList.remove('playing');hud.hidden=true;$('over').hidden=false;const acc=P.shots?Math.round(P.hits/P.shots*100):0;$('ostats').innerHTML=`SCORE ${P.score}<br>WAVE ${wave} · ${P.kills} KILLS · ${P.heads} HEADSHOTS<br>ACCURACY ${acc}%`;
 try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=5+Math.min(40,P.kills*2);localStorage.setItem('pxd_profile',JSON.stringify(pr));const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'strike3d';if(+(localStorage.getItem(k)||0)<P.score)localStorage.setItem(k,P.score);}catch(e){}}
function step(dt){time+=dt;
 // fx always
 for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t-=dt;if(f.k==='fade')f.o.material.opacity=Math.max(0,f.t/.07);if(f.k==='sparks'){const a=f.o.geometry.attributes.position;f.vel.forEach((v,j)=>{v.y-=9*dt;a.array[j*3]+=v.x*dt;a.array[j*3+1]+=v.y*dt;a.array[j*3+2]+=v.z*dt;});a.needsUpdate=true;f.o.material.opacity=f.t/.45;}if(f.t<=0){scene.remove(f.o);f.o.geometry.dispose();fx.splice(i,1);}}
 flash.material.opacity*=.5;flashL.intensity*=.4;
 if(state!=='play')return;
 // movement
 const sprint=keys.ShiftLeft&&!P.crouch,spd=P.crouch?2.4:sprint?7:4.6;const fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),str=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
 const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);let wx=(-sy*fwd+cy*str),wz=(-cy*fwd-sy*str);const wl=Math.hypot(wx,wz)||1;wx=wx/wl*spd*(fwd||str?1:0);wz=wz/wl*spd*(fwd||str?1:0);
 const accel=P.onGround?12:3;P.vel.x+=(wx-P.vel.x)*Math.min(1,accel*dt);P.vel.z+=(wz-P.vel.z)*Math.min(1,accel*dt);
 if(keys.Space&&P.onGround){P.vel.y=6.2;P.onGround=false;}P.vel.y-=18*dt;
 const r=.32,tryMove=(nx,nz)=>![[r,r],[r,-r],[-r,r],[-r,-r]].some(o=>blocked(nx+o[0],nz+o[1],P.pos.y));
 if(tryMove(P.pos.x+P.vel.x*dt,P.pos.z))P.pos.x+=P.vel.x*dt;else P.vel.x=0;if(tryMove(P.pos.x,P.pos.z+P.vel.z*dt))P.pos.z+=P.vel.z*dt;else P.vel.z=0;
 P.pos.y+=P.vel.y*dt;const gh=Math.max(...[[r,r],[r,-r],[-r,r],[-r,-r]].map(o=>groundAt(P.pos.x+o[0],P.pos.z+o[1])).filter(h=>h<=P.pos.y+.35),0);if(P.pos.y<=gh){P.pos.y=gh;P.vel.y=0;P.onGround=true;}else P.onGround=P.pos.y-gh<.02;
 // aim + weapon
 P.cd-=dt;P.spread=Math.max(0,P.spread-dt*2.2);P.kick=Math.max(0,P.kick-dt*6);
 if(P.reload>0){P.reload-=dt;if(P.reload<=0){const need=30-P.ammo,take=Math.min(need,P.mag);P.ammo+=take;P.mag-=take;}}
 while(clickQ>0){clickQ--;if(P.cd<=.05)fire();}if(mouseDown&&P.cd<=0)fire();
 // camera
 const eye=P.crouch?1.05:1.6,bob=P.onGround?Math.sin(time*(sprint?13:9))*Math.min(1,Math.hypot(P.vel.x,P.vel.z)/5)*.04:0;
 cam.position.set(P.pos.x,P.pos.y+eye+bob,P.pos.z);cam.rotation.order='YXZ';cam.rotation.set(P.pitch+P.kick*.05,P.yaw,0);
 const rl=P.reload>0?Math.sin(Math.min(1,(1.6-P.reload)/1.6)*Math.PI):0;gun.position.set(.2+bob*.5,-.2-rl*.25+bob,-.35+P.kick*.06);gun.rotation.set(P.kick*.12-rl*.6,0,rl*.3);
 // spawns / waves
 if(toSpawn>0){spawnT-=dt;if(spawnT<=0){spawnT=Math.max(.6,2.4-wave*.15);const far=spawns.filter(s=>s.distanceTo(P.pos)>12);const s=(far.length?far:spawns)[Math.random()*(far.length||spawns.length)|0];makeEnemy(s.clone(),wave>2&&Math.random()<.25?1:0);toSpawn--;}}
 else if(!enemies.some(e=>!e.dead)){if(breakT===0){breakT=4;P.score+=wave*100;banner('WAVE CLEAR');P.hp=Math.min(100,P.hp+25);P.mag+=30;}breakT-=dt;if(breakT<=0)nextWave();}
 // enemies
 flowT-=dt;if(flowT<=0||!flow){computeFlow();flowT=.3;}
 const D=DIFF[diff];const eyeP=new THREE.Vector3(P.pos.x,P.pos.y+eye,P.pos.z);
 for(const e of enemies){const g=e.g;if(e.flash>0){e.flash-=dt;e.body.material=e.flash>0?EM.hurt:EM.body;}
  if(e.dead){e.dead+=dt;g.rotation.x=Math.min(Math.PI/2,e.dead*4)*-1;g.position.y=-Math.max(0,e.dead-1.2)*.8;if(e.dead>2.4){scene.remove(g);e.gone=1;}continue;}
  const dx=P.pos.x-g.position.x,dz=P.pos.z-g.position.z,d=Math.hypot(dx,dz);const head=g.position.clone();head.y=1.75;const see=los(head,eyeP,P.crouch);
  g.rotation.y=Math.atan2(dx,dz);let mx=0,mz=0;
  if(see&&d<16){e.st-=dt;if(e.st<=0){e.st=1+Math.random()*1.5;e.strafe*=-1;}mx=Math.cos(g.rotation.y)*e.strafe*.9;mz=-Math.sin(g.rotation.y)*e.strafe*.9;if(d>9){mx+=dx/d*1.4;mz+=dz/d*1.4;}if(d<4){mx-=dx/d;mz-=dz/d;}
   e.cd-=dt;if(e.cd<=0){e.cd=(1+Math.random()*.8)*D.rate*(e.tier?.8:1);const hitC=D.acc*(1-Math.min(.8,d/28))*(Math.hypot(P.vel.x,P.vel.z)>4?.6:1)*(P.crouch?.8:1);const mz_=g.position.clone();mz_.y=1.25;const aim=eyeP.clone();aim.y-=.3;
    if(Math.random()<hitC){hurt(D.dmg*(e.tier?1.4:1),g.position);tracer(mz_,aim,0xff5a6a);}else{aim.x+=(Math.random()-.5)*2;aim.y+=(Math.random()-.3);aim.z+=(Math.random()-.5)*2;tracer(mz_,aim,0xff5a6a);}sfx('eshot');}}
  else if(flow){const ci=Math.floor(g.position.x/CS),cj=Math.floor(g.position.z/CS);let best=flow[cj*MW+ci],bi=ci,bj=cj;for(const o of[[1,0],[-1,0],[0,1],[0,-1]]){const v=flow[(cj+o[1])*MW+ci+o[0]];if(v>=0&&(best<0||v<best)){best=v;bi=ci+o[0];bj=cj+o[1];}}const tx=bi*CS+1-g.position.x,tz=bj*CS+1-g.position.z,tl=Math.hypot(tx,tz)||1;mx=tx/tl*2.6;mz=tz/tl*2.6;e.cd=Math.max(e.cd,.5);}
  for(const o of enemies)if(o!==e&&!o.dead){const ox=g.position.x-o.g.position.x,oz=g.position.z-o.g.position.z,od=Math.hypot(ox,oz);if(od<1&&od>0){mx+=ox/od*1.5;mz+=oz/od*1.5;}}
  e.vx+=(mx-e.vx)*Math.min(1,6*dt);e.vz+=(mz-e.vz)*Math.min(1,6*dt);const nx=g.position.x+e.vx*dt,nz=g.position.z+e.vz*dt,er=.35;
  if(![[er,er],[er,-er],[-er,er],[-er,-er]].some(o=>blocked(nx+o[0],g.position.z+o[1],0)))g.position.x=nx;if(![[er,er],[er,-er],[-er,er],[-er,-er]].some(o=>blocked(g.position.x+o[0],nz+o[1],0)))g.position.z=nz;
  const walk=Math.hypot(e.vx,e.vz);g.children[3].rotation.x=Math.sin(time*8)*walk*.15;g.children[4].rotation.x=-Math.sin(time*8)*walk*.15;}
 enemies=enemies.filter(e=>!e.gone);
 for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.t-=dt;p.g.rotation.y+=dt*2;p.g.position.y=.5+Math.sin(time*3)*.1;if(p.g.position.distanceTo(new THREE.Vector3(P.pos.x,.5,P.pos.z))<1.1){if(p.kind==='hp')P.hp=Math.min(100,P.hp+35);else P.mag+=45;sfx('pick');feed(p.kind==='hp'?'+35 HEALTH':'+45 AMMO');scene.remove(p.g);pickups.splice(i,1);}else if(p.t<=0){scene.remove(p.g);pickups.splice(i,1);}}
 sun.position.set(P.pos.x+20,40,P.pos.z+10);sun.target.position.set(P.pos.x,0,P.pos.z);
 hitT-=dt;dmgT-=dt;dirT-=dt;banT-=dt;}

/* ================= HUD draw ================= */
function drawHUD(){if(hud.hidden)return;$('hp').textContent=Math.ceil(P.hp);$('hpbar').firstChild.style.width=P.hp+'%';$('hpbar').firstChild.style.background=P.hp<30?'#ff3f5a':'';$('ammo').textContent=P.reload>0?'··':P.ammo;$('ammo').style.color=P.ammo<8?'#ff3f5a':'';$('mag').textContent='/ '+P.mag;$('score').textContent=P.score;$('wave').textContent='WAVE '+wave;
 $('left').textContent=(enemies.filter(e=>!e.dead).length+toSpawn)+' HOSTILES';$('cross').style.setProperty('--s',(8+P.spread*18+Math.hypot(P.vel.x,P.vel.z)*1.5)+'px');$('hitm').style.opacity=Math.max(0,hitT/.15);$('dmg').style.opacity=Math.max(0,dmgT/.35)+(P.hp<30?.35:0);
 $('dir').style.opacity=Math.max(0,dirT);$('dir').style.transform=`rotate(${(P.yaw-dirA+Math.PI)}rad)`;$('banner').style.opacity=banT>0?1:0;
 const s=160/(MW*CS)*1;mini.clearRect(0,0,160,136);mini.fillStyle='rgba(255,255,255,.18)';MAP.forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='#'){mini.fillStyle='rgba(180,170,230,.45)';mini.fillRect(i*CS*s,j*CS*s,CS*s,CS*s);}else if(ch==='c'){mini.fillStyle='rgba(181,101,29,.6)';mini.fillRect(i*CS*s+1,j*CS*s+1,CS*s-2,CS*s-2);}}));
 enemies.forEach(e=>{if(e.dead)return;mini.fillStyle='#ff3f5a';mini.fillRect(e.g.position.x*s-2,e.g.position.z*s-2,4,4);});pickups.forEach(p=>{mini.fillStyle=p.kind==='hp'?'#3dff8b':'#ffcf3f';mini.fillRect(p.g.position.x*s-1.5,p.g.position.z*s-1.5,3,3);});
 mini.save();mini.translate(P.pos.x*s,P.pos.z*s);mini.rotate(-P.yaw+Math.PI);mini.fillStyle='#2fe8d0';mini.beginPath();mini.moveTo(0,5);mini.lineTo(-4,-4);mini.lineTo(4,-4);mini.fill();mini.restore();}

/* ================= loop ================= */
const POST={exposure:1.05,bloom:.5,bloomThreshold:.8,vignette:.38,saturation:1.08,aoStrength:.9};let post=cinematic(R,scene,cam,POST);bindQualityKey(()=>post.q,()=>{post=cinematic(R,scene,cam,POST);post.setSize(innerWidth,innerHeight);});
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();post.setSize(w,h);}addEventListener('resize',resize);resize();
reset();state='menu';cam.position.set(24,6,34);cam.lookAt(24,0,16);
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);gun.visible=state==='play';if(state==='menu'){const t=now*.00008;cam.position.set(MW+Math.sin(t)*16,7,MH+Math.cos(t)*14);cam.lookAt(MW,1,MH);}drawHUD();post.render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
window.STRIKE={step,P,get enemies(){return enemies;},get state(){return state;},get wave(){return wave;},deploy,fire,aimAt(e){const t=e.g.position.clone();t.y=1.8;const dx=t.x-P.pos.x,dz=t.z-P.pos.z,dy=t.y-(P.pos.y+1.6);P.yaw=Math.atan2(-dx,-dz);P.pitch=Math.atan2(dy,Math.hypot(dx,dz));cam.rotation.set(P.pitch,P.yaw,0);cam.updateMatrixWorld();}};
