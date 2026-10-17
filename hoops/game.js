// COURT KINGS — full 3D basketball. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {C,CT,hoopOf} from './physics.js';
import {TEAMS,DIFF,logo,roster} from './data.js';
import {Squad,animate,act,NP,VIS} from './rig.js';
import {buildArena,buildStreet,makeEnv,ctex} from './world.js';
import {S,setup,fixed,clockText,periodText,nextPeriod,setCtl,give,dHoop,reach} from './match.js';
import {Sound} from './sound.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,toast} from '../js/kit3d/ui.js';
const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=Math.random,hyp=Math.hypot;
const DT=1/60,ID='courtkings';
/* ================= renderer ================= */
const Rd=new THREE.WebGLRenderer({canvas:$('c'),powerPreference:'high-performance'});Rd.setPixelRatio(Math.min(devicePixelRatio,1.5));Rd.shadowMap.enabled=true;Rd.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,16/9,.3,4000);scene.background=new THREE.Color(0x05060a);
const squad=new Squad(scene,24),snd=new Sound(),hiddenPose=new Float32Array(NP);
const envs={};const env=n=>envs[n]||(envs[n]=makeEnv(Rd,n));
let world=null,gfx=quality(),fxp=null,worldKey='';
/* ball: pebbled orange leather with black channels */
const ballTex=ctex(512,256,(x,w,h)=>{x.fillStyle='#c8561c';x.fillRect(0,0,w,h);const id=x.getImageData(0,0,w,h);for(let i=0;i<id.data.length;i+=4){const n=(Math.random()-.5)*34;id.data[i]+=n;id.data[i+1]+=n*.6;id.data[i+2]+=n*.4;}x.putImageData(id,0,0);
 for(let i=0;i<2600;i++){x.fillStyle=`rgba(${Math.random()<.5?'60,20,5':'255,170,110'},.18)`;x.beginPath();x.arc(Math.random()*w,Math.random()*h,1.2,0,7);x.fill();}
 x.strokeStyle='#1a0e08';x.lineWidth=5;x.beginPath();x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();for(const u of[0,.5]){x.beginPath();x.moveTo(u*w,0);x.lineTo(u*w,h);x.stroke();}
 for(const c of[.25,.75]){x.beginPath();for(let v=0;v<=h;v+=4){const u=c*w+Math.sin(v/h*Math.PI)*w*.11*(c<.5?1:-1)*Math.cos((v/h-.5)*Math.PI*0);v?x.lineTo(u,v):x.moveTo(u,v);}x.stroke();}});
const ballMat=new THREE.MeshStandardMaterial({map:ballTex,roughness:.62,metalness:0,envMapIntensity:.6});
const ballMesh=new THREE.Mesh(new THREE.SphereGeometry(C.BR,32,20),ballMat);ballMesh.castShadow=true;scene.add(ballMesh);
/* contact shadows under everyone (keeps players grounded even on LOW) */
const blobT=ctex(64,64,(x)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.6,'rgba(0,0,0,.25)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);},{clamp:true});
const blobs=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:blobT,transparent:true,depthWrite:false}),24);blobs.renderOrder=2;blobs.frustumCulled=false;scene.add(blobs);
/* markers: controlled-player rings + arrows, pass target ring */
const ringTex=ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=9;x.beginPath();x.arc(64,64,50,0,7);x.stroke();x.fillStyle='#fff';x.beginPath();x.moveTo(64,2);x.lineTo(54,20);x.lineTo(74,20);x.fill();},{clamp:true});
const mkRing=(col,s)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:ringTex,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));m.renderOrder=5;m.visible=false;scene.add(m);return m;};
const PCOL=[new THREE.Color(2.4,.9,.2),new THREE.Color(.3,1.6,2.4)];
const rings=[mkRing(PCOL[0],1.3),mkRing(PCOL[1],1.3)],arrows=[0,1].map(i=>{const m=new THREE.Mesh(new THREE.ConeGeometry(.13,.3,4).rotateX(Math.PI),new THREE.MeshBasicMaterial({color:PCOL[i]}));m.visible=false;scene.add(m);return m;});
class Parts{constructor(n=900){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*3);this.l=new Float32Array(n);this.i=0;const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));this.g=g;
  this.m=new THREE.Points(g,new THREE.PointsMaterial({size:.09,vertexColors:true,transparent:true,depthWrite:false}));this.m.frustumCulled=false;scene.add(this.m);for(let i=0;i<n;i++)this.p[i*3+1]=-99;}
 emit(x,y,z,vx,vy,vz,col,life){const i=this.i;this.i=(i+1)%this.n;this.p.set([x,y,z],i*3);this.v.set([vx,vy,vz],i*3);this.c.set([col.r,col.g,col.b],i*3);this.l[i]=life;}
 update(dt){for(let i=0;i<this.n;i++){if(this.l[i]<=0){if(this.p[i*3+1]>-50)this.p[i*3+1]=-99;continue;}this.l[i]-=dt;const j=i*3;this.v[j+1]-=3*dt;this.v[j]*=.99;this.v[j+2]*=.99;this.p[j]+=this.v[j]*dt;this.p[j+1]+=this.v[j+1]*dt;this.p[j+2]+=this.v[j+2]*dt;if(this.p[j+1]<.02){this.p[j+1]=.02;this.v[j]=this.v[j+2]=this.v[j+1]=0;}}
  this.g.attributes.position.needsUpdate=this.g.attributes.color.needsUpdate=true;}}
const confetti=new Parts(1400);
/* ================= options ================= */
const LENS=[[60,120,180],[180,300,420]];
let opt={mode:0,humans:1,team:0,opp:1,diff:1,len:0};const saveOpt=stored('pxd_courtkings_opt',opt);
let rimT=-9,app='menu',attract=true,acc=0,camMode=0,lastAward=null,replay=null,rec=[],recT=0,hype=0,flash=0,pendRep=null,lastRepT=-99,shake=0;
/* ================= world ================= */
function applyQuality(q){const was=gfx;gfx=q;Rd.setPixelRatio(Math.min(devicePixelRatio,q===0?1:1.5));if(world&&world.key){const s=q===2?4096:q===1?2048:1024;if(world.key.shadow.mapSize.x!==s){world.key.shadow.mapSize.set(s,s);if(world.key.shadow.map){world.key.shadow.map.dispose();world.key.shadow.map=null;}}}
 fxp=null;if(world&&(was===0)!==(q===0)&&S.teams[0]){worldKey='';rebuildWorld();}}
bindQualityKey(()=>gfx,q=>applyQuality(q));
function post(){return S.street?{exposure:.98,bloom:.4,bloomThreshold:.88,bloomRadius:.5,vignette:.32,saturation:1.14,grain:.02,ao:gfx>=2,aoStrength:.6}:{exposure:1.0,bloom:.5,bloomThreshold:.9,bloomRadius:.45,vignette:.34,saturation:1.1,grain:.018,ao:gfx>=2,aoStrength:.5};}
let mirrorMeshes=[],ballMirror=null;
function rebuildWorld(){const key=[S.street,S.teams[0].ti,S.teams[1].ti,S.teams[0].kit.c1,S.teams[1].kit.c1,gfx===0].join();if(key===worldKey&&world)return;worldKey=key;
 if(world)world.dispose();mirrorMeshes=[];ballMirror=null;
 const o={home:S.teams[0].ti,away:S.teams[1].ti,kits:[S.teams[0].kit,S.teams[1].kit],q:gfx,crowd:[.55,.8,1][gfx]};
 world=S.street?buildStreet(scene,o):buildArena(scene,o);scene.environment=env(S.street?'street':'arena');snd.setVenue(S.street);
 scene.fog=S.street?new THREE.FogExp2(0x9a7a6a,.006):null;scene.background=new THREE.Color(S.street?0x6a7aa0:0x05060a);
 if(world.mirror){mirrorMeshes=squad.mirror(world.mirror);ballMirror=new THREE.Mesh(ballMesh.geometry,ballMat);ballMirror.userData.keep=true;world.mirror.add(ballMirror);}
 applyQuality(gfx);drawLogos();scrKey='';}
/* ================= matches ================= */
function diffFor(t,o){const hum=o.humans===2||(o.humans===1&&t===0);return hum?DIFF[1]:DIFF[o.diff];}
function begin(o){const hum=o.humans;setup({home:o.team,away:o.opp===o.team?(o.team+1)%TEAMS.length:o.opp,street:o.mode===1,humans:hum,diff:[diffFor(0,o),diffFor(1,o)],qLen:LENS[o.mode][o.len],attract:!!o.attract,boost:[hum?0:[-3,0,3][o.diff],hum===2?0:[-4,0,4][o.diff]]});
 rebuildWorld();for(let i=0;i<24;i++){const e=S.ents[i];if(e)squad.setLook(i,e.look);else squad.pose(i,hiddenPose);}squad.commit();
 rec=[];replay=null;pendRep=null;hype=0;$('feed').innerHTML='';hudCache={};C0.init=false;drawLogos();}
function attractMatch(){const a=opt.team,b=opt.opp===a?(a+1)%TEAMS.length:opt.opp;begin({team:a,opp:b,mode:opt.mode,humans:0,diff:2,len:2,attract:true});S.feedOn=false;}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);saveOpt();snd.init();snd.play('ui',1);
 begin({...opt,attract:false});S.feedOn=true;attract=false;app='match';for(const id of['menu','keys','over','pause'])$(id).hidden=true;$('hud').hidden=false;document.body.classList.add('playing');
 banner(S.street?'CHECK BALL':'TIP OFF',`${TEAMS[S.teams[0].ti].n.toUpperCase()} VS ${TEAMS[S.teams[1].ti].n.toUpperCase()}`,'#fff',2);}
function toMenu(){app='menu';attract=true;attractMatch();for(const id of['over','pause','hud','qcard'])$(id).hidden=true;$('menu').hidden=false;$('keys').hidden=false;$('bars').classList.remove('on');document.body.classList.remove('playing');replay=null;}
function pause(on){if(on&&app==='match'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');}else if(!on&&app==='paused'){app='match';$('pause').hidden=true;document.body.classList.add('playing');}}
/* ================= simulation events → sound, HUD, camera ================= */
const tv=new V(),tv2=new V();const live=()=>app==='match';
const tName=t=>TEAMS[S.teams[t].ti].n.toUpperCase();
S.fx=(k,a,b,c,d)=>{if(!world)return;const L=live();
 switch(k){
  case'squeak':if(rnd()<.5)snd.play('squeak',.7);break;
  case'catch':if(b==='steal'||b==='loose'||b==='rebound'){}snd.play('catch');break;
  case'pass':snd.play('pass');break;
  case'rim':if(a>.45&&Math.abs(S.time-rimT)>.08){rimT=S.time;snd.play('rim',a);hype=Math.max(hype,.45);}break;
  case'board':snd.play('board');break;
  case'floor':snd.play('floor',a);break;
  case'land':if(b>3)snd.play('dribble',.6);break;
  case'release':{const p=a,gr=b;if(gr){showGrade(p,gr);if(gr==='green')snd.play('green');}hype=Math.max(hype,.4);break;}
  case'score':{const[team,pts,by,sh]=[a,b,c,d];const swish=sh&&!sh.dunk&&!S.ball.rimmed;snd.play(S.street?'chain':'swish');if(sh&&sh.ft){snd.play('cheer');break;}
   hype=Math.max(hype,pts===3?1:.75);flash=pts===3?.8:.4;world[team===0?'hypeH':'hypeA'].value=1;if(team===0||S.street)snd.play('roar');else snd.play('groan');
   if(L||attract){const big=sh&&sh.dunk?'SLAM!':pts===3?(swish?'SPLASH!':'THREE!'):swish?'SWISH':'BUCKET';if(sh&&sh.dunk||pts===3)banner(big,`${by?by.short.toUpperCase()+' · ':''}${tName(team)} ${S.score[team]}`,'#ffffff',1.8,S.teams[team].kit.c1);
    if(L)feed(`${by?by.short:''} ${sh&&sh.dunk?'dunk':pts===3?'three':sh&&sh.lay?'layup':'jumper'} · ${S.score[0]}-${S.score[1]}`,team);}
   $('sb').classList.remove('flash');void $('sb').offsetWidth;$('sb').classList.add('flash');
   if(pts===3&&L)confettiBurst(sh.hoop,S.teams[team].kit);break;}
  case'slam':{const p=a,contact=b;snd.play('slam');shake=contact?.5:.3;hype=1;if(contact&&L)prompt('POSTER!',1.4);
   if(!attract&&app==='match'&&(contact||rnd()<.6)&&S.time-lastRepT>25){pendRep={t:S.time,i:rec.length,H:hoopOf(p.team),p};}break;}
  case'block':snd.play('block');snd.play('ooh');hype=Math.max(hype,.85);if(L)banner(c?'REJECTED!':'BLOCKED!',a.short.toUpperCase(),'#9fe3ff',1.2);break;
  case'steal':snd.play('ooh');hype=Math.max(hype,.6);if(L)prompt((c?'PICKED OFF · ':'STOLEN · ')+a.short.toUpperCase(),1.3);break;
  case'ankles':snd.play('ooh');if(c)snd.play('roar');hype=Math.max(hype,c?.9:.5);if(L&&c)banner('ANKLES!',`${a.short.toUpperCase()} DROPS ${b.short.toUpperCase()}`,'#ffd23f',1.5);break;
  case'move':snd.play('dribble',1);snd.play('squeak',1);break;
  case'foul':{snd.play('whistle',1);refWhistle();if(L){banner('FOUL',`${a.short.toUpperCase()} · ${(c||'').toUpperCase()}`,'#ffd23f',1.5);}break;}
  case'andone':snd.play('whistle',1);snd.play('roar');refWhistle();if(L)banner('AND ONE!',b.short.toUpperCase()+' ON '+a.short.toUpperCase(),'#ffd23f',1.8);break;
  case'ft':if(L)prompt(`FREE THROWS · ${a.short.toUpperCase()} · ${b}`,1.6);break;
  case'ftmiss':snd.play('groan');break;
  case'turnover':snd.play('whistle',1);break;
  case'horn':snd.play('horn');if(L)banner('SHOT CLOCK','VIOLATION','#ff5050',1.4);break;
  case'out':snd.play('whistle',1);break;
  case'buzzer':snd.play('buzzer',1.1);break;
  case'period':{if(L)showQ(a);break;}
  case'qstart':$('qcard').hidden=true;snd.play('horn');if(L)prompt(periodText()+' QUARTER',1.6);break;
  case'final':snd.play('buzzer',1.3);hype=1;if(L){const w=a;banner('FINAL',`${tName(0)} ${S.score[0]} – ${S.score[1]} ${tName(1)}`,'#fff',3);if(w>=0)confettiBurst(null,S.teams[w].kit,true);}break;
  case'tipwin':snd.play('catch');break;case'toss':snd.play('whistle',1);break;
  case'inbound':break;case'check':if(L&&!b)prompt('CHECK · '+tName(a),1.2);break;
  case'takeback':if(L)banner('NO GOOD','TAKE IT BACK BEHIND THE ARC','#ffd23f',1.6);snd.play('groan');break;
  case'sudden':if(L)banner('NEXT BUCKET','WINS IT','#ff6a13',2.2);break;
  case'pick':snd.play('ui');if(L)prompt('PICK · '+a.short.toUpperCase(),1);break;
  case'screen':break;case'switch':break;
  case'assist':break;
  case'rebound':break;
  case'feed':if(S.feedOn&&L)feed(a,b);break;}};
function refWhistle(){for(const r of S.refs)act(r,'whistle',1.2);}
function confettiBurst(H,kit,big){const cols=[new THREE.Color(kit.c1),new THREE.Color(kit.c2),new THREE.Color(1.6,1.3,.3),new THREE.Color(1,1,1)];const n=big?900:160;
 for(let i=0;i<n;i++){const x=H?H.x+(rnd()-.5)*4:(rnd()-.5)*C.L*1.6,z=H?(rnd()-.5)*4:(rnd()-.5)*C.W*1.8,y=big?14+rnd()*6:5+rnd()*2;confetti.emit(x,y,z,(rnd()-.5)*2,-rnd(),(rnd()-.5)*2,cols[rnd()*4|0],5+rnd()*3);}}
/* ================= replays (big dunks) ================= */
function record(dt){if(!['live','dead','inbound'].includes(S.phase))return;recT+=dt;if(recT<1/30)return;recT=0;const n=S.ents.length,f=new Float32Array(7+n*NP);const b=ballMesh;
 f[0]=b.position.x;f[1]=b.position.y;f[2]=b.position.z;f[3]=b.quaternion.x;f[4]=b.quaternion.y;f[5]=b.quaternion.z;f[6]=b.quaternion.w;for(let i=0;i<n;i++)f.set(S.ents[i].pose,7+i*NP);rec.push(f);
 if(rec.length>200){rec.shift();if(pendRep)pendRep.i--;}}
function startReplay(){const r=pendRep;pendRep=null;const a=Math.max(0,r.i-80),e=Math.min(rec.length,r.i+30);if(e-a<40)return;lastRepT=S.time;
 replay={frames:rec.slice(a,e),gi:r.i-a,t:0,H:r.H,side:r.p.p.z>0?-1:1,snap:true};$('replay').hidden=false;$('bars').classList.add('on');snd.play('roar');}
function replayStep(dt){const r=replay,N=r.frames.length,fi=r.t*30,near=Math.abs(fi-r.gi)<22;r.t+=dt*(near?.35:.9);if(r.t*30>=N-1.01)endReplay();}
function endReplay(){replay=null;$('replay').hidden=true;$('bars').classList.remove('on');}
const rq=new THREE.Quaternion(),rq2=new THREE.Quaternion(),rpose=new Float32Array(NP);
function replayPose(){const r=replay,N=r.frames.length,fi=Math.min(N-1.001,r.t*30),i=Math.floor(fi),f=fi-i,A=r.frames[i],B=r.frames[i+1];
 ballMesh.position.set(A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f,A[2]+(B[2]-A[2])*f);rq.set(A[3],A[4],A[5],A[6]);rq2.set(B[3],B[4],B[5],B[6]);ballMesh.quaternion.copy(rq.slerp(rq2,f));
 const n=(A.length-7)/NP;for(let k=0;k<n;k++){const o=7+k*NP;for(let j=0;j<NP;j++){let a=A[o+j],b=B[o+j];if(j===3){let d=b-a;d=Math.atan2(Math.sin(d),Math.cos(d));b=a+d;}rpose[j]=a+(b-a)*f;}if(!B[o+VIS])rpose[VIS]=0;squad.pose(k,rpose);}}
/* ================= input ================= */
const I=controls(Rd.domElement,{canLock:()=>false,menu:()=>false,onKey:e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Slash','Quote'].includes(e.code)&&app==='match')e.preventDefault();
 if(e.code==='Escape'){if(app==='match')pause(true);else if(app==='paused')pause(false);}
 if(app==='match'&&e.code==='KeyC'){camMode=(camMode+1)%3;prompt((S.street?['CAMERA · PARK','CAMERA · BROADCAST','CAMERA · HIGH']:['CAMERA · BROADCAST','CAMERA · CLOSE','CAMERA · HIGH'])[camMode],1);}
 if(app==='match'&&e.code==='KeyM'){snd.on=!snd.on;prompt(snd.on?'SOUND ON':'SOUND OFF',1);}}});
const {keys,edge:edgeK}=I;
const KB=[{u:['KeyW'],d:['KeyS'],l:['KeyA'],r:['KeyD'],spr:['ShiftLeft'],shoot:['Space','KeyJ'],pass:['KeyF','KeyK'],move:['KeyE','KeyL'],lob:['KeyR','KeyI'],sw:['KeyQ','KeyU']},
 {u:['ArrowUp'],d:['ArrowDown'],l:['ArrowLeft'],r:['ArrowRight'],spr:['ShiftRight','NumpadAdd'],shoot:['Slash','Numpad2'],pass:['Period','Numpad1'],move:['Comma','Numpad4'],lob:['Semicolon','Numpad5'],sw:['Enter','Numpad0']}];
const SOLO_EXTRA={u:['ArrowUp'],d:['ArrowDown'],l:['ArrowLeft'],r:['ArrowRight']};
const any=a=>a.some(k=>keys[k]);let padPrevA=[false,false];
function pads(){const a=gamepad();if(!a)return[];const b=[...navigator.getGamepads()].find(g=>g&&g!==a);return b?[a,b]:[a];}
const cr=new V(),cf=new V();const BTN=['shoot','pass','move','lob','sw'];
function readInputs(){cr.set(1,0,0).applyQuaternion(cam.quaternion);cr.y=0;cr.normalize();cf.set(0,0,-1).applyQuaternion(cam.quaternion);cf.y=0;if(cf.lengthSq()<1e-4)cf.set(cr.z,0,-cr.x);cf.normalize();
 const solo=S.humans.length===1,gl=pads();
 for(const h of S.humans){const maps=solo?[KB[0],{...KB[1],...SOLO_EXTRA}]:[KB[h.i]],on=n=>maps.some(m=>m[n]&&any(m[n]));let sx=(on('r')?1:0)-(on('l')?1:0),sy=(on('u')?1:0)-(on('d')?1:0);
  const o={spr:on('spr')};for(const k of BTN)o[k]=on(k);let rs=null;
  const g=solo?gl[0]:gl[h.i];if(g){const ax=g.axes,bt=g.buttons,dz=v=>deadzone(v,.2);const gx=dz(ax[0]||0),gy=dz(ax[1]||0);if(gx||gy){sx=gx;sy=-gy;}
   const B=i=>bt[i]&&bt[i].pressed;if(B(2))o.shoot=true;if(B(0))o.pass=true;if(B(1))o.move=true;if(B(3))o.lob=true;if(B(4)||B(5))o.sw=true;if((bt[7]&&bt[7].value>.3)||B(10))o.spr=true;
   const rx=dz(ax[2]||0),ry=dz(ax[3]||0);if(hyp(rx,ry)>.6&&!h.rsHeld){rs={x:cr.x*rx-cf.x*ry,z:cr.z*rx-cf.z*ry};h.rsHeld=true;}else if(hyp(rx,ry)<.3)h.rsHeld=false;
   if(B(9)&&!h.padSt){pause(app==='match');}h.padSt=B(9);}
  const l=hyp(sx,sy);if(l>1){sx/=l;sy/=l;}o.x=cr.x*sx+cf.x*sy;o.z=cr.z*sx+cf.z*sy;
  for(const k of BTN)if(o[k]&&!h.prev[k])h.edge[k]=true;if(rs){h.edge.rs=true;h.rs=rs;}h.prev={...o};h.inp=o;}}
function skipPressed(){let s=edgeK.Space||edgeK.Enter||edgeK.NumpadEnter;const gl=pads();gl.forEach((g,i)=>{const a=g.buttons[0]&&g.buttons[0].pressed;if(a&&!padPrevA[i])s=true;padPrevA[i]=a;});return s;}
/* ================= step ================= */
function step(dt){dt=Math.min(dt,.1);if(app==='match')readInputs();const skip=skipPressed();I.flush();
 if(app==='paused'){visuals(0);return;}
 if(replay){if(skip&&replay.t>.4)replay.t=1e9;replayStep(dt);}
 else{if(pendRep&&S.time-pendRep.t>1.05)startReplay();
  if(S.phase==='qbreak'&&skip&&app==='match'&&S.breakT>.5)nextPeriod();
  acc+=dt;let n=0;while(acc>=DT&&n<10){fixed(DT);acc-=DT;n++;}if(n>=10)acc=0;}
 if(app==='match'&&S.phase==='end'&&S.endT>3.2)showOver();
 if(app==='menu'&&S.phase==='end'&&S.endT>3)attractMatch();
 visuals(dt);if(!replay)record(dt);}
/* ================= visuals ================= */
const hp=new V(),hq=new V(),m4=new THREE.Matrix4(),qy=new THREE.Quaternion(),one=new V(1,1,1);let dribPrev=new Map();
function visuals(dt){const rp=!!replay;
 if(rp)replayPose();else{for(const e of S.ents){if(e.role==='REF'||e.role==='BENCH'){e.sprint=false;}animate(e,dt);squad.pose(e.idx,e.pose);}ballVisual(dt);}
 squad.commit();if(ballMirror){ballMirror.position.copy(ballMesh.position);ballMirror.quaternion.copy(ballMesh.quaternion);}
 // contact shadows
 let k=0;for(const e of S.pl.concat(S.refs)){const y=rp?0:e.p.y;const s=.95*(e.h||1)*(1-Math.min(.6,y*.35));m4.compose(tv.set(e.p.x,.008,e.p.z),qy,tv2.set(s,1,s*1.1));blobs.setMatrixAt(k++,m4);}
 if(!rp){m4.compose(tv.set(ballMesh.position.x,.009,ballMesh.position.z),qy,tv2.setScalar(Math.max(.05,.42-ballMesh.position.y*.06)));blobs.setMatrixAt(k++,m4);}
 blobs.count=k;blobs.instanceMatrix.needsUpdate=true;
 if(world){world.update(dt);hype=Math.max(.1,hype-dt*.12);world.hype.value=hype;world.hypeH.value=Math.max(0,world.hypeH.value-dt*.1);world.hypeA.value=Math.max(0,world.hypeA.value-dt*.1);if(snd.ac)snd.hype(hype);}
 confetti.update(dt);flash=Math.max(0,flash-dt*1.5);shake=Math.max(0,shake-dt*1.2);
 markers(rp);cameraUpdate(dt);hud(dt);drawScreens();}
// the ball follows the hands: dribble bounce, two-hand hold, set point, one-hand finish
function ballVisual(dt){const b=S.ball,o=b.owner;if(!o){ballMesh.position.copy(b.p);ballMesh.quaternion.copy(b.q);dribPrev.clear();return;}
 const i=o.idx,an=o.anim.act;squad.hand(i,0,hp);squad.hand(i,1,hq);let x,y,z;const f=Math.sin(o.face),g=Math.cos(o.face);
 if(an==='shoot'||an==='ft'||an==='lob'||an==='pass'||an==='bpass'||o.hold||an==='catch'||an==='dunk'&&o.anim.v===0||an==='tip'){x=(hp.x+hq.x)/2+f*.1;y=(hp.y+hq.y)/2+(an==='shoot'||an==='ft'||an==='dunk'?.06:0);z=(hp.z+hq.z)/2+g*.1;}
 else if(an==='layup'||an==='dunk'){x=hq.x+f*.05;y=hq.y+.1;z=hq.z+g*.05;}
 else{const R=o.drib>=0,H=R?hq:hp,u=o.anim.dph%1,s=Math.abs(1-2*u),yy=C.BR+(H.y-.1-C.BR)*(1-(1-s)*(1-s));
  let hx=H.x,hz=H.z;if(an==='cross'||an==='spin'){const t=cl(o.anim.t/o.anim.dur,0,1),A=R?hp:hq,Bh=R?hq:hp;hx=A.x+(Bh.x-A.x)*t;hz=A.z+(Bh.z-A.z)*t;}
  x=hx+f*.12;y=Math.max(C.BR,yy);z=hz+g*.12;const pu=dribPrev.get(o);if(pu!=null&&pu<.5&&u>=.5){snd.play('dribble',.8+Math.min(1,hyp(o.v.x,o.v.z)/6)*.4);}dribPrev.set(o,u);}
 ballMesh.position.set(x,y,z);b.hp.set(x,y,z);b.hpO=o;const sp=hyp(o.v.x,o.v.z);if(sp>.1){qy.setFromAxisAngle(tv.set(g,0,-f).normalize(),sp*dt/C.BR*.5);ballMesh.quaternion.premultiply(qy);qy.identity();}b.p.set(x,y,z);}
function markers(rp){const show=app==='match'&&!rp&&['live','inbound','check','dead','tip'].includes(S.phase);
 rings.forEach((m,i)=>{const h=S.humans[i],p=h&&h.pl;const vis=show&&p;m.visible=!!vis;arrows[i].visible=!!vis;if(!vis)return;m.position.set(p.p.x,.02,p.p.z);m.rotation.y=p.face;
  arrows[i].position.set(p.p.x,p.p.y+2.45*p.h+Math.sin(S.time*6)*.05,p.p.z);arrows[i].rotation.y=S.time*2;});}
/* ================= cameras ================= */
const C0={p:new V(0,10,25),l:new V(),f:new V(),fov:30,init:false};let orbitA=0;
function cameraUpdate(dt){const b=S.ball,asp=innerWidth/innerHeight;let fov=30;const k=1-Math.exp(-dt*2.4),kl=1-Math.exp(-dt*3.2);const L=C.L,W=C.W;
 const o=b.owner,bx=o?o.p.x+o.v.x*.4:ballMesh.position.x,bz=o?o.p.z:ballMesh.position.z;
 if(replay){const r=replay,H=r.H,bp=ballMesh.position,sn=r.snap?1:0;r.snap=false;C0.p.lerp(tv.set(H.x-H.s*3.4,1.25,r.side*3.8),sn||1-Math.exp(-dt*2));C0.l.lerp(tv2.set(H.x-H.s*.6,2.2,0).lerp(bp,.4),sn||1-Math.exp(-dt*5));fov=44;}
 else if(app==='over'){orbitA+=dt*.05;const cx=S.street?L*.55:0;C0.p.set(cx+Math.cos(orbitA)*13,3.6,Math.sin(orbitA)*11);C0.l.set(cx,1.4,0);fov=46;}
 else if(app==='menu'&&!S.street){orbitA+=dt*.035;C0.p.set(Math.cos(orbitA)*24,9+Math.sin(orbitA*.6)*3,Math.sin(orbitA)*17);C0.l.set(0,1.5,0);fov=46;}
 else if(app==='menu'){orbitA+=dt*.035;C0.p.set(L*.5+Math.cos(orbitA)*17,6+Math.sin(orbitA*.6)*2,Math.sin(orbitA)*15);C0.l.set(L*.55,1.5,0);fov=50;}
 else if(S.phase==='ft'&&S.ft){const p=S.ft.p,H=hoopOf(p.team);C0.p.lerp(tv.set(p.p.x-H.s*5.2,3.3,p.p.z+1.2),k*2);C0.l.lerp(tv2.set(H.x,2.6,0),kl*2);fov=36;}
 else if(S.street&&camMode===0){const H=CT.hoops[0];C0.f.lerp(tv.set(bx,0,bz),C0.init?1-Math.exp(-dt*2):1);const fx=cl(C0.f.x,1,L);
  C0.p.lerp(tv.set(H.x-H.s*(15.8-(fx-4)*.18),6.4,C0.f.z*.32),C0.init?k:1);C0.l.lerp(tv2.set(H.x-H.s*(6.4-(fx-4)*.25),1.0,C0.f.z*.55),C0.init?kl:1);fov=44;}
 else{C0.f.lerp(tv.set(bx,0,bz),C0.init?1-Math.exp(-dt*2.2):1);const lim=S.street?[C.L*.35,C.L*.62]:[-L+6.2,L-6.2],fx=cl(C0.f.x,lim[0],lim[1]);
  const mode=S.street?camMode-1:camMode,cfg=[[9.2,W+15.5,27],[5.6,W+10.5,30],[17,W+16,31]][Math.max(0,mode)];
  C0.p.lerp(tv.set(fx*.93,cfg[0],cfg[1]),C0.init?k:1);C0.l.lerp(tv2.set(fx,.6,C0.f.z*.25-1.2),C0.init?kl:1);fov=cfg[2];
  if(S.phase==='tip')fov*=.82;if(S.phase==='end')fov*=.85;}
 if(asp<1.6)fov=2*Math.atan(Math.tan(fov*Math.PI/360)*1.6/asp)*180/Math.PI;
 C0.init=true;C0.fov+=(fov-C0.fov)*Math.min(1,dt*3);cam.fov=Math.min(80,C0.fov);cam.position.copy(C0.p);if(shake>0)cam.position.y+=Math.sin(performance.now()*.07)*shake*.06;cam.lookAt(C0.l);
}
/* ================= HUD ================= */
let hudCache={},banT=0,promT=0;
function setT(id,v){if(hudCache[id]!==v){hudCache[id]=v;$(id).textContent=v;}}
function banner(t,s,col,dur,glow){$('bt').textContent=t;$('bt').style.color=col;$('bt').style.textShadow=glow?`0 0 34px ${glow},0 0 2px ${glow},0 6px 0 rgba(0,0,0,.35)`:'';$('bs').textContent=s;$('banner').classList.add('on');banT=dur;}
function prompt(t,dur){$('prompt').textContent=t;$('prompt').classList.add('on');promT=dur;}
function feed(html,team){const d=toast($('feed'),html,6000,5);if(team>=0&&S.teams[team])d.style.borderLeftColor=S.teams[team].kit.c1;}
const lum=h=>{const c=new THREE.Color(h);return c.r*.3+c.g*.59+c.b*.11;};
function drawLogos(){if(!S.teams[0])return;for(const t of[0,1]){const c=$('lg'+t),x=c.getContext('2d');x.clearRect(0,0,64,64);logo(x,S.teams[t].ti,64);$('n'+t).textContent=TEAMS[S.teams[t].ti].s;const el=$('t'+t);el.style.setProperty('--k',S.teams[t].kit.c1);el.style.setProperty('--kt',lum(S.teams[t].kit.c1)>.62?'#0b0d12':'#fff');}}
function showGrade(p,gr){const h=S.humans.find(h=>h.pl===p);if(!h)return;const el=$('labels').children[h.i];if(!el)return;const cls=gr==='green'?'green':gr==='good'?'good':'bad';
 const mt=el.querySelector('.mt'),em=el.querySelector('em');mt.className='mt on '+cls;em.className='on '+cls;em.textContent=gr==='green'?'GREEN!':gr==='good'?'EXCELLENT':gr.toUpperCase();el.dataset.hold=1.1;}
function hud(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}if(promT>0){promT-=dt;if(promT<=0)$('prompt').classList.remove('on');}
 if(app!=='match'&&app!=='paused')return;
 setT('s0',String(S.score[0]));setT('s1',String(S.score[1]));setT('clk',clockText());setT('per',periodText());
 const sc=Math.ceil(Math.max(0,S.sc));setT('scl',S.phase==='ft'||S.sudden&&false?'—':String(sc));$('scl').classList.toggle('low',sc<=5&&S.phase==='live');
 for(const t of[0,1]){$('t'+t).classList.toggle('poss',S.poss===t&&S.phase!=='qbreak');const fv=S.street?'':Math.min(5,S.tf[t])+'';if(hudCache['f'+t]!==fv){hudCache['f'+t]=fv;$('f'+t).innerHTML=S.street?'':[0,1,2,3,4].map(i=>`<s class="${i<S.tf[t]?'on':''}"></s>`).join('');}}
 $('tb').hidden=!(S.street&&S.ball.owner&&S.clear[S.ball.owner.team]&&S.phase==='live');
 // controlled player card
 const h0=S.humans[0],p=h0&&h0.pl;const cap=p?`<b style="color:${S.teams[p.team].kit.c1}">${p.num}</b><div>${p.name.toUpperCase()}<small>${p.pos} · ${p.ovr} OVR · ${p.st.pts} PTS ${p.st.reb} REB ${p.st.ast} AST</small></div>`:'';
 if(hudCache.cap!==cap){hudCache.cap=cap;$('cap').innerHTML=cap;$('cap').style.setProperty('--k',p?S.teams[p.team].kit.c1:'#888');$('cap').classList.toggle('on',!!cap);}
 labels(dt);
 let pr='';if(S.phase==='qbreak')pr='SPACE / A TO CONTINUE';else if(S.phase==='ft'&&S.ft&&S.humans.some(h=>h.pl===S.ft.p))pr='HOLD SHOOT · RELEASE AT THE TOP';else if(S.phase==='inbound'&&S.inb&&S.humans.some(h=>h.pl===S.inb.by))pr='INBOUND · AIM + PASS';
 else if(S.phase==='tip'&&S.humans.length)pr='TIP-OFF · PRESS SHOOT TO JUMP';setT('help',pr);}
function labels(dt){const host=$('labels'),W=innerWidth,H=innerHeight;S.humans.forEach((h,i)=>{let el=host.children[i];if(!el){el=document.createElement('div');el.className='lb p'+i;el.innerHTML='<b></b><span class="mt"><s></s><i></i></span><em></em>';host.appendChild(el);}
  const p=h.pl;const show=p&&!replay&&['live','dead','inbound','check','ft','tip'].includes(S.phase);el.style.display=show?'':'none';if(!show)return;hp.set(p.p.x,p.p.y+2.35*p.h,p.p.z).project(cam);
  el.style.transform=`translate(${(hp.x*.5+.5)*W}px,${(-hp.y*.5+.5)*H}px)`;const nm=(S.humans.length>1?'P'+(i+1)+' · ':'')+p.last;if(el.dataset.n!==nm){el.dataset.n=nm;el.firstChild.textContent=nm;}
  const mt=el.querySelector('.mt'),em=el.querySelector('em'),a=p.act;let hold=+(el.dataset.hold||0);
  if(a&&a.k==='shoot'&&a.human&&!a.rel){const m=a.t/a.T;mt.className='mt on';mt.firstChild.style.height=(Math.min(1.15,m)/1.15*100).toFixed(1)+'%';mt.lastChild.style.bottom=(1/1.15*100-2).toFixed(1)+'%';em.className='';el.dataset.hold=0;}
  else if(hold>0){hold-=dt;el.dataset.hold=hold;if(hold<=0){mt.className='mt';em.className='';}}else{mt.className='mt';}});
 while(host.children.length>S.humans.length)host.lastChild.remove();}
function showQ(q){const T=S.teams,half=q===2;$('qcard').innerHTML=`<h2>${half?'HALFTIME':'END OF '+(q>4?'OT':['','1ST','2ND','3RD','4TH'][q])}<em>.</em></h2>${lineTable()}<p class="eye">SPACE / A TO CONTINUE</p>`;$('qcard').hidden=false;}
function lineTable(){const T=S.teams,n=S.lines[0].length;let h='<table class="ls"><tr><th></th>';for(let i=0;i<n;i++)h+=`<th>${i<4?i+1:'OT'+(i>4?i-3:'')}</th>`;h+='<th>T</th></tr>';
 for(const t of[0,1])h+=`<tr><td style="color:${T[t].kit.c1}">${TEAMS[T[t].ti].s}</td>${S.lines[t].map(v=>`<td>${v}</td>`).join('')}<td>${S.score[t]}</td></tr>`;return S.street?'':h+'</table>';}
/* ---- jumbotron + shot clocks ---- */
let scrKey='';function drawScreens(force){if(!world||!S.teams[0])return;
 for(const H of CT.hoops){if(!H.sc)continue;const v=S.phase==='ft'?'':String(Math.ceil(Math.max(0,S.sc)));if(H.sc.last!==v){H.sc.last=v;const x=H.sc.c.getContext('2d');x.fillStyle='#050505';x.fillRect(0,0,128,64);x.fillStyle=+v<=5&&v!==''?'#ff3020':'#ffb020';x.font='52px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(v,64,34);H.sc.t.needsUpdate=true;}}
 if(!world.screen)return;const key=S.score.join()+clockText()+periodText()+(replay?'r':'')+app;if(!force&&key===scrKey)return;scrKey=key;const{c,t}=world.screen,x=c.getContext('2d'),w=c.width,h=c.height;
 x.fillStyle='#05070d';x.fillRect(0,0,w,h);const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,S.teams[0].kit.c1);g.addColorStop(.32,'#0a0d18');g.addColorStop(.68,'#0a0d18');g.addColorStop(1,S.teams[1].kit.c1);x.fillStyle=g;x.globalAlpha=.55;x.fillRect(0,0,w,h);x.globalAlpha=1;
 x.save();x.translate(26,h/2-70);logo(x,S.teams[0].ti,100);x.restore();x.save();x.translate(w-126,h/2-70);logo(x,S.teams[1].ti,100);x.restore();
 x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='96px Anton, Impact, sans-serif';x.fillText(replay?'REPLAY':`${S.score[0]}  ${S.score[1]}`,w/2,h/2-16);
 x.font='34px Anton, Impact, sans-serif';x.fillStyle='#ff6a13';x.fillText(attract?'COURT KINGS':periodText()+'  '+clockText(),w/2,h-40);x.fillStyle='rgba(0,0,0,.28)';for(let i=0;i<h;i+=3)x.fillRect(0,i,w,1);t.needsUpdate=true;}
/* ================= results ================= */
const gameScore=p=>p.st.pts+.4*p.st.fgm-.7*p.st.fga-.4*(p.st.fta-p.st.ftm)+.7*p.st.oreb+.3*(p.st.reb-p.st.oreb)+p.st.stl+.7*p.st.ast+.7*p.st.blk-p.st.to;
function boxTable(t,mvp){const T=S.teams[t],k=T.kit;const r=(p)=>{const s=p.st;return`<tr><td><small>${p.pos}</small>${p.short}</td><td class="${p===mvp?'hi':''}">${s.pts}</td><td>${s.reb}</td><td>${s.ast}</td><td>${s.stl}</td><td>${s.blk}</td><td>${s.fgm}-${s.fga}</td><td>${s.tpm}-${s.tpa}</td><td>${s.ftm}-${s.fta}</td><td>${s.to}</td></tr>`;};
 const tot=T.pl.reduce((a,p)=>{for(const x in p.st)a[x]=(a[x]||0)+p.st[x];return a;},{});
 return`<table class="bx"><caption style="color:${lum(k.c1)<.08?'#fff':k.c1}">${TEAMS[T.ti].city.toUpperCase()} ${TEAMS[T.ti].n.toUpperCase()}</caption><tr><th>PLAYER</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>FG</th><th>3P</th><th>FT</th><th>TO</th></tr>${T.pl.map(r).join('')}
  <tr class="tot"><td>TEAM</td><td>${tot.pts}</td><td>${tot.reb}</td><td>${tot.ast}</td><td>${tot.stl}</td><td>${tot.blk}</td><td>${tot.fgm}-${tot.fga}</td><td>${tot.tpm}-${tot.tpa}</td><td>${tot.ftm}-${tot.fta}</td><td>${tot.to}</td></tr></table>`;}
function showOver(){app='over';$('hud').hidden=true;$('qcard').hidden=true;document.body.classList.remove('playing');$('bars').classList.remove('on');
 const two=S.humans.length>1,w=S.winner,T=S.teams;
 $('oeye').textContent=(S.street?'STREET 3V3 · ':'5V5 · ')+(S.q>4?'FINAL / OT':'FINAL')+' · CPU '+DIFF[opt.diff].n;
 const wn=w>=0?TEAMS[T[w].ti].n.toUpperCase():'';$('ores').textContent=two||!S.humans.length?(w<0?'TIE GAME':wn+' WIN'):w===0?'VICTORY':w<0?'TIE GAME':'DEFEAT';$('ores').style.color=w<0?'#fff':(w===0||two||!S.humans.length)?(lum(T[w].kit.c1)<.08?'#fff':T[w].kit.c1):'#ff5050';
 const L=t=>{const c=document.createElement('canvas');c.width=c.height=88;logo(c.getContext('2d'),T[t].ti,88);return`<img src="${c.toDataURL()}" width="44" height="44" alt="">`;};
 $('ofs').innerHTML=`${L(0)}<span>${TEAMS[T[0].ti].n.toUpperCase()}</span><b>${S.score[0]} – ${S.score[1]}</b><span>${TEAMS[T[1].ti].n.toUpperCase()}</span>${L(1)}<div class="ls">${lineTable()}</div>`;
 $('lines').innerHTML='';
 const all=S.pl.slice().sort((a,b)=>gameScore(b)+(b.team===w?3:0)-gameScore(a)-(a.team===w?3:0));const mvp=all[0];
 $('box').innerHTML=boxTable(0,mvp)+boxTable(1,mvp);
 $('mvp').innerHTML=mvp?`<span>PLAYER OF THE GAME</span><b>${mvp.name.toUpperCase()}</b><i>${TEAMS[T[mvp.team].ti].s} · #${mvp.num} · ${mvp.st.pts} PTS · ${mvp.st.reb} REB · ${mvp.st.ast} AST</i>`:'';
 const tok=award(w);$('otok').textContent=S.humans.length?`+${tok} TOKENS · ${lastAward.pts} PTS · BEST ${bestScore(ID)} PTS`:`EXHIBITION · CPU VS CPU · NO TOKENS AWARDED`;$('post').hidden=!S.humans.length;$('over').hidden=false;}
function award(w){const won=w===0,pts=Math.max(0,S.score[0]*10+(won?400:0)+(won?(S.score[0]-S.score[1])*15:0)+(won&&S.humans.length===1?opt.diff*200:0)+S.teams[0].pl.reduce((a,p)=>a+p.st.dnk*25+p.st.blk*15+p.st.stl*10,0));
 lastAward={pts,won,score:`${S.score[0]}-${S.score[1]}`,team:TEAMS[S.teams[0].ti].n,opp:TEAMS[S.teams[1].ti].n,mode:S.street?'3v3 street':'5v5 arena',diff:DIFF[opt.diff].n.toLowerCase(),two:S.humans.length>1};
 if(!S.humans.length)return 0;const tok=5+Math.min(60,pts/25|0);addRound(tok,won);saveBest(ID,pts);return tok;}
/* ================= rendering ================= */
function render(){const w=innerWidth,h=innerHeight;if(Rd.domElement.width!==Math.floor(w*Rd.getPixelRatio())||Rd.domElement.height!==Math.floor(h*Rd.getPixelRatio())){Rd.setSize(w,h,false);fxp&&(fxp.w=0);}
 cam.aspect=w/h;cam.updateProjectionMatrix();if(!fxp||fxp.street!==S.street){fxp=cinematic(Rd,scene,cam,{...post(),quality:gfx});fxp.street=S.street;fxp.w=0;}if(fxp.w!==w*9999+h){fxp.w=w*9999+h;fxp.setSize(w,h);}
 if(fxp.bloom)fxp.bloom.strength=post().bloom+flash*.3;fxp.render();}
addEventListener('resize',()=>{fxp&&(fxp.w=0);});
/* ================= menu ================= */
const pick=pickers(opt,saveOpt),seg=(id,key)=>pick(id,key,true,()=>{snd.init();snd.play('ui');menuVis();refreshAttract();});
let attrT=0;function refreshAttract(){clearTimeout(attrT);attrT=setTimeout(()=>{if(app==='menu')attractMatch();},250);}
function picker(id,key){const el=$(id);const draw=()=>{const T=TEAMS[opt[key]],cv=el.querySelector('canvas'),x=cv.getContext('2d');x.clearRect(0,0,cv.width,cv.height);logo(x,opt[key],cv.width);el.querySelector('b').textContent=(T.city+' '+T.n).toUpperCase();
  const st=Math.round((T.r-72)/4);el.querySelector('span').textContent='★'.repeat(cl(st,1,5))+'☆'.repeat(5-cl(st,1,5))+' · '+T.r+' OVR';};
 const n=TEAMS.length,shift=d=>{opt[key]=(opt[key]+d+n)%n;if(key==='opp'&&opt.opp===opt.team)opt.opp=(opt.opp+d+n)%n;if(key==='team'&&opt.opp===opt.team)opt.opp=(opt.opp+1)%n;draw();if(key==='team')$('p-opp').redraw();saveOpt();snd.init();snd.play('ui');refreshAttract();};
 el.querySelector('.l').onclick=()=>shift(-1);el.querySelector('.r').onclick=()=>shift(1);draw();el.redraw=draw;}
function menuVis(){$('l-opp').textContent=opt.humans===2?'P2 TEAM':'OPPONENT';$('l-len').textContent=opt.mode===1?'GAME':'QUARTERS';
 const ls=$('o-len').querySelectorAll('button');const lab=opt.mode===1?['3 MIN','5 MIN','7 MIN']:['1 MIN','2 MIN','3 MIN'];ls.forEach((b,i)=>b.textContent=lab[i]);$('go').textContent=opt.mode===1?'CHECK BALL':'TIP OFF';}
picker('p-opp','opp');picker('p-team','team');seg('o-mode','mode');seg('o-pl','humans');seg('o-diff','diff');seg('o-len','len');menuVis();
$('go').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;$('again').onclick=()=>start();
postButton($('post'),ID,()=>{const a=lastAward||{};return[a.pts||0,`Game: COURT KINGS\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'no win'} ${a.score||''} · ${a.team||''} vs ${a.opp||''}\nMode: ${a.mode||''}${a.two?' 2P versus':''} · CPU ${a.diff||''}`];});
/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;step(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
/* ================= test hook ================= */
window.COURTKINGS={get state(){return app==='match'?S.phase:app;},get app(){return app;},get phase(){return S.phase;},step,render,start,toMenu,pause,S,get ball(){return S.ball;},get players(){return S.pl;},get teams(){return S.teams;},
 get score(){return S.score;},get quarter(){return S.q;},get clock(){return S.clock;},setClock(s){S.clock=s;},get humans(){return S.humans;},get replay(){return replay;},get opt(){return opt;},get world(){return world;},keys,
 setQuality:applyQuality,cam:()=>cam,info:()=>({...Rd.info.render,geos:Rd.info.memory.geometries,tex:Rd.info.memory.textures,crowd:world&&world.crowdN}),give,nextPeriod,
 skip(){edgeK.Space=true;},press(k,on=true){keys[k]=on;if(on)edgeK[k]=true;},setCam(m){camMode=m;}};
