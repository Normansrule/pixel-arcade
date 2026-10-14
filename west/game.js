// DUSTWATER — an open-world western bounty hunter. Original game for Pixel Arcade.
// Take a contract from the sheriff's bounty board, ride out on your horse (call, mount, blended gaits, stamina) across desert, canyon
// and river country, track the gang's hoof prints to their camp, fight CPU outlaws (EASY / NORMAL / HARD) with six-gun, lever rifle
// and Dead Eye, rope and hogtie the leader and bring him in alive (or dead for half), or call him out for a quick-draw duel.
// Day-to-dusk sky, a train on a loop, townsfolk, synth western score, results with bounty, accuracy and honour.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {ShaderPass} from '../vendor/jsm/postprocessing/ShaderPass.js';
import {V,cl,lerp,smooth,angDiff,rng,ctex,M,merge,fmt} from './util.js';
import {World,EXT,WATER,STATION} from './world.js';
import {makeRig,animRig,hold,muzzleWorld,makeHorse,animHorse,gaitOf,LOOKS,look,COATS} from './rig.js';
import {Particles,Tracers,Flashes} from './fx.js';
import {Sound} from './sound.js';
import {DIFF,newBrain,think,bName} from './ai.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,toast} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id),ID='dustwater';
export const CONTRACTS=[
 {leader:'SILAS "RATTLER" CRANE',short:'SILAS CRANE',gang:'THE CRANE GANG',camp:0,bounty:450,lk:0,crime:'Train robbery · murder of a mail clerk',area:'the canyon country north-east',rot:'-3deg'},
 {leader:'MERCY VANCE',short:'MERCY VANCE',gang:'THE HOLLOW CREEK BOYS',camp:1,bounty:380,lk:1,crime:'Cattle rustling · arson · horse theft',area:'the creek bottoms north-west',rot:'2deg'},
 {leader:'EZRA "TWO-BIT" HALE',short:'EZRA HALE',gang:'THE RED MESA RIDERS',camp:2,bounty:520,lk:2,crime:'Bank robbery · jailbreak',area:'the mesas south of town',rot:'-1.5deg'}];
const WPN={revolver:{n:'CATTLEMAN SIX',mag:6,res:36,rate:.34,min:.15,dmg:38,head:3,spread:[.02,.005],range:110,shell:.42,snd:'revolver'},
 rifle:{n:'LEVER RIFLE',mag:8,res:32,rate:.78,min:.6,dmg:64,head:2.5,spread:[.03,.0012],range:240,shell:.5,snd:'rifle',zoom:1.75},lasso:{n:'LASSO'}};
const WORDER=['revolver','rifle','lasso'];
const SKINS=[0xc99470,0xb07a58,0xd8a888,0x8a5a3e,0xe0b090];
const tv=new V(),tv2=new V(),tv3=new V(),UP=new V(0,1,0);

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xe0c8a0,220,1500);
const hemi=new THREE.HemisphereLight(0xc8d4f0,0x8a6040,1);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,2.6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-60,right:60,top:60,bottom:-60,near:10,far:700});sun.shadow.bias=-.0004;sun.shadow.normalBias=.06;scene.add(sun,sun.target);
const camera=new THREE.PerspectiveCamera(66,1,.1,5000);
const world=new World(7);world.build(scene);
const parts=new Particles(scene,3000,true),smoke=new Particles(scene,2400,false),tracers=new Tracers(scene,40),flashes=new Flashes(scene,8);
const snd=new Sound();
const charMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.02});
const horseMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.05});
const fireLight=new THREE.PointLight(0xff8a30,0,30,1.6);scene.add(fireLight);
const T0=world.townY;

/* ================= state ================= */
const G={app:'menu',opt:{diff:1,time:8,mus:.8,sens:1,vol:.8},time:0,clock:480,limit:480,contract:null,ci:0,D:DIFF[1],phase:'',noise:null,timeScale:1,shake:0,
 money:0,honour:50,stats:{},campFound:false,proof:false,result:null,rope:null,lassoFx:null,de:{on:false,marks:[],fireT:0,firing:false},duel:null,standoffT:0,duelOffered:0,deliver:false,peace:false,outcome:'',endT:0,dusk:0,annT:0};
const saveOpt=stored('pxd_dustwater_opt',G.opt);
let actors=[],bandits=[],townsfolk=[],P=null,horse=null,leader=null,campHorses=[],camp=null;

/* ================= actors ================= */
function newActor(kind,lk,o={}){const rig=makeRig(lk,charMat);scene.add(rig.root);
 const a={kind,rig,lk,pos:new V(),vel:new V(),yaw:0,pitch:0,hp:100,max:100,alive:true,ground:true,pose:'',hold:'',aim:false,fireVis:0,yOff:0,inp:{mx:0,mz:0,run:false,face:null,fire:false,aim:false},cd:0,mag:6,reloadT:0,stepT:0,state:'',hitT:-9,name:'',...o};actors.push(a);return a;}
function removeActor(a){scene.remove(a.rig.root);actors=actors.filter(x=>x!==a);}
function placeOnGround(a,x,z){a.pos.set(x,world.groundAt(x,z,99),z);a.vel.set(0,0,0);}
function makePlayer(){const a=newActor('player',look(LOOKS.player),{name:'YOU',wpn:'revolver',ammo:{revolver:{mag:6,res:36},rifle:{mag:8,res:32}},stam:1,de:1,mounted:null,carry:null,regenT:0,lassoCd:0,tieT:0,jumpCd:0});a.rig.lasso=true;return a;}
function makeHorseObj(coat){const h=makeHorse(coat,horseMat);scene.add(h.root);return{rig:h,pos:new V(),yaw:0,spd:0,stam:1,tired:false,state:'idle',rider:null,load:null,turn:0,hoofT:0,eatT:0,whinT:0,vy:0};}

/* ================= train ================= */
const train=(()=>{const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.35}),cars=[];const B=(w,h,d,x,y,z,c,rx=0,ry=0,rz=0)=>[new THREE.BoxGeometry(w,h,d),M(x,y,z,rx,ry,rz),c];const CY=(r0,r1,h,x,y,z,c,rx=0,rz=0,seg=16)=>[new THREE.CylinderGeometry(r0,r1,h,seg),M(x,y,z,rx,0,rz),c];
 const wheelG=new THREE.CylinderGeometry(1,1,.12,16);wheelG.rotateZ(Math.PI/2);const wheelM=new THREE.MeshStandardMaterial({color:0x6a1a12,roughness:.5,metalness:.6});const wheelK=new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:.5,metalness:.7});
 const car=(parts,len,wheels,ofs)=>{const g=new THREE.Group(),m=new THREE.Mesh(merge(parts),mat);m.castShadow=m.receiveShadow=true;g.add(m);const ws=[];for(const[z,r,red]of wheels)for(const s of[-1,1]){const w=new THREE.Mesh(wheelG,red?wheelM:wheelK);w.scale.set(1,r,r);w.position.set(s*.78,r,z);g.add(w);ws.push(w);}scene.add(g);cars.push({g,len,ws,off:ofs,rods:null});return cars[cars.length-1];};
 const BLK=0x1e1e22,RED=0x7a2418,BR=0xb08a3a,GRN=0x2e4a3a,WD=0x6a4428;
 const loco=[CY(.78,.78,5,0,2.05,.6,BLK,Math.PI/2),CY(.82,.82,.25,0,2.05,-.4,BR,Math.PI/2),CY(.82,.82,.25,0,2.05,1.9,BR,Math.PI/2),CY(.86,.86,.9,0,2.05,3.5,0x2a2a2e,Math.PI/2),[new THREE.CylinderGeometry(.62,.62,.06,18),M(0,2.05,3.97,Math.PI/2),0x3a3a3e],
  CY(.42,.2,1.2,0,3.2,3.4,BLK),CY(.55,.42,.35,0,3.95,3.4,BLK),CY(.3,.36,.55,0,3,1.6,BR),CY(.26,.3,.45,0,2.95,.4,BLK),B(2.4,2.4,2.4,0,2.6,-2.6,RED),B(2.6,.18,2.8,0,3.9,-2.6,BLK),B(.9,.7,.05,-1.21,2.9,-2.6,0x1b1712),B(.9,.7,.05,1.21,2.9,-2.6,0x1b1712),
  B(2.2,.35,8.8,0,.95,.2,BLK),B(2.4,.12,1.2,0,1.1,4.6,RED),[new THREE.ConeGeometry(1.1,1.3,4,1),M(0,.75,4.75,-Math.PI/2-.55,Math.PI/4,0,1,1,.6),BR],B(.5,.5,.5,0,3.1,4.15,BR),[new THREE.CylinderGeometry(.2,.2,.08,12),M(0,3.1,4.42,Math.PI/2),0xfff0c0],
  CY(.28,.28,1.2,-.95,1.4,3.1,BLK,Math.PI/2),CY(.28,.28,1.2,.95,1.4,3.1,BLK,Math.PI/2),B(.06,.2,4.2,-1.15,1.6,1,BR),B(.06,.2,4.2,1.15,1.6,1,BR),B(2.3,.1,.1,0,1.85,-1.35,BR)];
 car(loco,10,[[2.3,.85,1],[.6,.85,1],[-1.1,.85,1],[3.9,.42,0],[-3.4,.5,0]],0);
 car([B(2.4,1.5,5,0,1.8,0,BLK),B(2.2,.6,4.2,0,2.75,.3,0x141414),B(2.5,.15,5.2,0,1.05,0,RED),B(.06,.2,5,-1.22,2.3,0,BR),B(.06,.2,5,1.22,2.3,0,BR)],5.6,[[1.6,.45,0],[.7,.45,0],[-.8,.45,0],[-1.7,.45,0]],8.2);
 const coach=(c)=>{const p=[B(2.6,2.4,10.5,0,2.3,0,c),B(2.7,.2,10.7,0,1.05,0,0x2a2018),B(2.7,.12,10.6,0,3.55,0,0xd8c8a0),B(.4,.2,10.6,-1.2,3.1,0,0xd8b060),B(.4,.2,10.6,1.2,3.1,0,0xd8b060)];const rf=new THREE.CylinderGeometry(1.6,1.6,10.8,16,1,true,-Math.PI*.3,Math.PI*.6);rf.rotateX(Math.PI/2);p.push([rf,M(0,2.25,0,0,0,0,1,.5,1),0x3a3028]);
  for(let i=-4;i<=4;i++)for(const s of[-1,1])p.push(B(.05,.75,.7,s*1.31,2.65,i*1.1,0x2a2014));for(const s of[-1,1])p.push(B(2.4,.12,1.1,0,1.2,s*5.7,0x3a3028),B(.08,1,.08,-1,1.7,s*6.2,BR),B(.08,1,.08,1,1.7,s*6.2,BR));return p;};
 car(coach(GRN),12,[[4,.45,0],[3,.45,0],[-3,.45,0],[-4,.45,0]],8.2+5.6/2+.9+6);
 car(coach(0x5a2418),12,[[4,.45,0],[3,.45,0],[-3,.45,0],[-4,.45,0]],8.2+5.6/2+.9+6+12.9);
 car([B(2.5,2.4,6.4,0,2.3,0,RED),B(2.7,.2,6.8,0,3.55,0,0x2a2018),B(1.6,.9,2.2,0,4.05,0,RED),B(1.8,.15,2.4,0,4.55,0,0x2a2018),B(2.6,.2,6.6,0,1.05,0,0x2a2018),B(.05,.6,.6,-1.26,2.6,1.6,0xd8c070),B(.05,.6,.6,1.26,2.6,-1.6,0xd8c070)],7,[[2.2,.45,0],[1.3,.45,0],[-1.3,.45,0],[-2.2,.45,0]],8.2+5.6/2+.9+6+12.9+12.9/2+3.5+.8);
 const head=new THREE.SpotLight(0xffd8a0,0,140,.35,.5,1.2);head.castShadow=false;cars[0].g.add(head);head.position.set(0,3.1,4.5);head.target.position.set(0,1,30);cars[0].g.add(head.target);
 const T=world.track;let sSt=0,bd=1e9;for(let i=0;i<T.S;i++){const p=T.P[i],d=(p.x-STATION.x)**2+(p.z-(STATION.z-12))**2;if(d<bd){bd=d;sSt=i*T.step;}}
 return{cars,head,s:sSt+900,spd:12,dwell:0,sSt,chugT:0,whT:20,o:{p:new V()},stopped:false};})();
function stepTrain(dt){const T=world.track,tr=train;let ahead=((tr.sSt+9-tr.s)%T.len+T.len)%T.len;
 let target=13.5;if(tr.dwell>0){tr.dwell-=dt;target=0;if(tr.dwell<=0){tr.s+=.5;snd.play('trainWhistle',tr.cars[0].g.position);snd.play('bell',tr.cars[0].g.position);}}
 else if(ahead<170){target=Math.max(0,Math.sqrt(2*.55*Math.max(0,ahead-1)));if(ahead<1.2&&tr.spd<.6){tr.dwell=14;tr.spd=0;}}
 tr.spd+=cl(target-tr.spd,-1.1*dt,.7*dt);tr.s=(tr.s+tr.spd*dt)%T.len;
 for(const c of tr.cars){world.trackAt(tr.s-c.off,tr.o);c.g.position.copy(tr.o.p);c.g.position.y+=.08;c.g.rotation.set(0,tr.o.yaw,0);c.g.rotateX(-tr.o.pitch);for(const w of c.ws)w.rotation.x+=tr.spd*dt/w.scale.y;}
 const lp=tr.cars[0].g.position;tr.chugT-=dt*Math.max(.3,tr.spd*.35);if(tr.chugT<=0&&(tr.spd>.3||tr.dwell>0)){tr.chugT=1;snd.play('chug',lp,tr.dwell>0?.35:.9);}
 // smoke + steam
 const sx=lp.x+Math.sin(tr.cars[0].g.rotation.y)*3.4,sz=lp.z+Math.cos(tr.cars[0].g.rotation.y)*3.4;{const n=dt*(tr.spd>1?34:6)+Math.random();if(G.app!=='over')for(let q=0;q<(n|0);q++){const g=.3+Math.random()*.12;smoke.emit(sx+(Math.random()-.5)*.4,lp.y+4.3,sz+(Math.random()-.5)*.4,(Math.random()-.5)*.8-Math.sin(tr.cars[0].g.rotation.y)*tr.spd*.25,2.2+Math.random()*1.2,(Math.random()-.5)*.8-Math.cos(tr.cars[0].g.rotation.y)*tr.spd*.25,g,g*.95,g*.92,1.1+Math.random()*.6,4.2,-.15,.45,2.8);}}
 if(tr.dwell>0&&Math.random()<dt*6)smoke.emit(lp.x+(Math.random()-.5)*3,lp.y+.8,lp.z+(Math.random()-.5)*3,(Math.random()-.5)*2,.6,(Math.random()-.5)*2,.95,.95,.95,1,1.6,-.2,.6,2);
 tr.whT-=dt;if(tr.whT<=0&&P&&lp.distanceTo(P.pos)<220){tr.whT=40+Math.random()*30;snd.play('trainWhistle',lp);}
 tr.head.intensity=G.dusk>.5?(G.dusk-.5)*120:0;
 // knock aside anything on the line
 if(tr.spd>.5)for(const a of[P,horse,...townsfolk,...bandits]){if(!a||!a.pos)continue;for(const c of tr.cars){const g=c.g.position,fy=c.g.rotation.y,fx=Math.sin(fy),fz=Math.cos(fy),dx=a.pos.x-g.x,dz=a.pos.z-g.z,al=dx*fx+dz*fz,lt=dx*fz-dz*fx;
  if(Math.abs(al)<c.len/2&&Math.abs(lt)<1.7&&Math.abs(a.pos.y-g.y)<3){const s=Math.sign(lt)||1;a.pos.x+=fz*s*(1.8-Math.abs(lt));a.pos.z-=fx*s*(1.8-Math.abs(lt));if(a===P&&!P.mounted&&(P.trainT||0)<G.time-1.2&&tr.spd>3){P.trainT=G.time;damage(P,35,null,{});G.shake=1;}if(a===horse&&horse.rider&&tr.spd>3&&(horse.trainT||0)<G.time-1.2){horse.trainT=G.time;horse.spd=0;damage(P,25,null,{});G.shake=1;}}}}}

/* ================= hoof-print trail ================= */
const printTex=ctex(64,64,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='rgba(40,24,12,.9)';x.beginPath();x.ellipse(32,30,17,20,0,0,7);x.fill();x.globalCompositeOperation='destination-out';x.beginPath();x.ellipse(32,34,9,13,0,0,7);x.fill();x.fillRect(26,40,12,30);},{clamp:true});
const prints=new THREE.InstancedMesh(new THREE.PlaneGeometry(.26,.3).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:printTex,transparent:true,depthWrite:false,opacity:.6,color:0x9a7050,polygonOffset:true,polygonOffsetFactor:-2}),700);prints.count=0;prints.frustumCulled=false;prints.renderOrder=1;scene.add(prints);
function layTrail(c){const r=rng(c.id*7+3),start=new V(c.x>0?118:-118,0,c.z>0?40:-70),pts=[start];const n=4;for(let i=1;i<n;i++){const t=i/n;pts.push(new V(lerp(start.x,c.x,t)+(r()-.5)*70,0,lerp(start.z,c.z,t)+(r()-.5)*70));}pts.push(new V(c.x,0,c.z));
 const cv=new THREE.CatmullRomCurve3(pts),L=cv.getLength();let k=0;const m=new THREE.Matrix4();for(let s=0;s<L-12&&k<prints.count+700;s+=1.15){const p=cv.getPointAt(s/L),t=cv.getTangentAt(s/L),yaw=Math.atan2(t.x,t.z);for(const side of[-1,1]){if(k>=700)break;const ox=Math.cos(yaw)*side*.35,oz=-Math.sin(yaw)*side*.35,x=p.x+ox+(r()-.5)*.15,z=p.z+oz+(s%2.3)*.1,y=world.heightAt(x,z);if(y<WATER+.1)continue;
  m.compose(tv.set(x,y+.03,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,yaw+(r()-.5)*.3,0)),tv2.set(1,1,1));prints.setMatrixAt(k++,m);}}prints.count=k;prints.instanceMatrix.needsUpdate=true;return cv;}

/* ================= tumbleweeds + ambient dust ================= */
const tumbles=[];{const r=rng(5);for(let i=0;i<6;i++){const p=[];for(let k=0;k<70;k++){const a=new V(r()-.5,r()-.5,r()-.5).normalize().multiplyScalar(.35+r()*.15),b=a.clone().add(new V(r()-.5,r()-.5,r()-.5).multiplyScalar(.45));p.push(a,b);}
 const g=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(p),new THREE.LineBasicMaterial({color:0x8a6a42}));g.scale.setScalar(.8+r()*.6);scene.add(g);tumbles.push({g,pos:new V(),v:2.5+r()*2,ph:r()*6,live:false});}}
const WIND=new V(.82,0,.35).normalize();
function stepAmbient(dt){const c=focusPos();if(!c)return;
 for(const t of tumbles){if(!t.live||t.pos.distanceTo(c)>80){const a=(Math.random()-.5)*2.2,d=40+Math.random()*25;t.pos.set(c.x-WIND.x*d+Math.cos(a)*-WIND.z*d*.6,0,c.z-WIND.z*d+Math.cos(a)*WIND.x*d*.6);t.live=world.heightAt(t.pos.x,t.pos.z)>WATER+.5&&!inTown(t.pos.x,t.pos.z,10);if(!t.live){t.g.visible=false;continue;}}
  t.ph+=dt*t.v*1.6;const gust=1+Math.sin(G.time*.4+t.v)*.5;t.pos.addScaledVector(WIND,t.v*gust*dt);world.collide(t.pos,.4,1,.2);const g=world.heightAt(t.pos.x,t.pos.z);t.g.visible=true;t.g.position.set(t.pos.x,g+.35*t.g.scale.x+Math.abs(Math.sin(t.ph*.8))*.6,t.pos.z);t.g.rotation.set(t.ph,Math.atan2(WIND.x,WIND.z),0,'YXZ');}
 // drifting dust motes and low gusts
 if(gfx>0&&Math.random()<dt*(gfx>=2?10:4)){const a=Math.random()*6.28,d=6+Math.random()*18;smoke.emit(c.x+Math.cos(a)*d,c.y+.2+Math.random()*3,c.z+Math.sin(a)*d,WIND.x*1.5,.15,WIND.z*1.5,.62,.52,.4,.05+Math.random()*.09,4,0,.2,1.05);}
 if(gfx>0&&Math.random()<dt*.5){const a=Math.random()*6.28,d=12+Math.random()*30,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d,y=world.heightAt(x,z);if(y>WATER+.5&&!inTown(x,z,0))for(let i=0;i<14;i++)smoke.emit(x+(Math.random()-.5)*3,y+.3+Math.random()*.6,z+(Math.random()-.5)*3,WIND.x*(5+Math.random()*3),.4+Math.random(),WIND.z*(5+Math.random()*3),.85,.66,.45,1.2+Math.random()*1.4,2.6,0,.4,2.2);}}
const inTown=(x,z,pad=0)=>x>-118-pad&&x<118+pad&&z>-80-pad&&z<46+pad;

/* ================= contract setup ================= */
function clearContract(){for(const b of bandits)removeActor(b);bandits=[];leader=null;for(const h of campHorses)scene.remove(h.rig.root);campHorses=[];G.rope=null;G.lassoFx=null;G.duel=null;prints.count=0;fireLight.intensity=0;camp=null;}
function setupContract(ci){clearContract();const C=CONTRACTS[ci];G.contract=C;G.ci=ci;camp=world.camps[C.camp];const D=G.D,r=rng(ci*13+G.opt.diff+(Math.random()*1e6|0));
 const lk=look({...LOOKS.leader[C.lk]});leader=newActor('leader',lk,{name:C.short,hp:200*(D.n==='HARD'?1.2:1),max:200*(D.n==='HARD'?1.2:1),wpn:'revolver',mag:6,camp,ai:newBrain(),state:'idle',lookout:false});
 leader.home={x:camp.x+2.4,z:camp.z+1.2,face:Math.atan2(-2.4,-1.2),sit:false};placeOnGround(leader,leader.home.x,leader.home.z);leader.yaw=leader.home.face;bandits.push(leader);
 const spots=camp.spots.slice().sort(()=>r()-.5);
 for(let i=0;i<D.count;i++){const b=LOOKS.bandit[i%6],lk2=look({...b,skin:SKINS[(i*3+ci)%SKINS.length],coat:i%3===0?0x5a4632:0,coatLen:i%3===0?.95:0,mask:i%2?1:0,stache:i%3===1?1:0,hair:[0x2a1a10,0x5a3a1a,0x1a1410,0x8a5a2a][i%4]});
  const lookout=i===0||i===3&&D.count>4;const a=newActor('bandit',lk2,{name:bName(ci*5+i),hp:D.hp,max:D.hp,wpn:lookout||i%4===2?'rifle':'revolver',mag:6,camp,ai:newBrain(),state:'idle',lookout});
  let home;if(lookout){if(camp.tower&&i===0)home={x:camp.tower.x,z:camp.tower.z,face:Math.atan2(-(camp.x-200),-(camp.z-0))};else{const c=camp.cover[(i*2)%camp.cover.length],ang=Math.atan2(c.z-camp.z,c.x-camp.x);home={x:c.x+Math.cos(ang)*(c.r+1),z:c.z+Math.sin(ang)*(c.r+1),face:Math.atan2(Math.cos(ang),Math.sin(ang))};}}
  else{const s=spots[i%spots.length];home={x:s.x+(i>=spots.length?1.2:0),z:s.z,face:s.face??Math.atan2(camp.x-s.x,camp.z-s.z),sit:!!s.sit};}
  a.home=home;a.mag=a.wpn==='rifle'?8:6;if(camp.tower&&i===0)a.pos.set(home.x,camp.tower.y,home.z);else placeOnGround(a,home.x,home.z);a.yaw=home.face;bandits.push(a);}
 // their horses at the hitching rail
 for(let i=0;i<2;i++){const h=makeHorseObj(COATS[(ci+i+1)%COATS.length]);const hc=camp.hitch,ox=Math.cos(hc.a+1.57)*(i*1.8-.9),oz=-Math.sin(hc.a+1.57)*(i*1.8-.9)*-1;h.pos.set(hc.x+ox+Math.cos(hc.a)*1.6,0,hc.z+oz+Math.sin(hc.a)*1.6);h.pos.y=world.heightAt(h.pos.x,h.pos.z);h.yaw=Math.atan2(-Math.cos(hc.a),-Math.sin(hc.a));h.eatT=i*3;h.rig.tack.visible=true;campHorses.push(h);}
 G.search={x:camp.x+(r()-.5)*90,z:camp.z+(r()-.5)*90,r:105};G.trail=layTrail(camp);G.campFound=false;G.proof=false;G.deliver=false;G.duelOffered=0;G.standoffT=0;
 const fire=world.fires[C.camp];fireLight.position.set(fire.x,fire.y+1,fire.z);fireLight.intensity=1;}

/* ================= combat ================= */
function rayActors(o,d,maxT,ignore){let best=null,bt=maxT;for(const a of actors){if(a===ignore||!a.alive&&a.state!=='dead'||a.state==='carried'||a.state==='draped'||a.hidden)continue;if(!a.alive)continue;
  const low=a.pose==='sit'?.45:a.pose==='tied'||a.pose==='roped'?1.2:0,yb=a.pos.y+a.yOff;
  if(a.pose==='tied'||a.pose==='roped'){const cx=a.pos.x-o.x,cy=a.pos.y+.25-o.y,cz=a.pos.z-o.z,tc=cx*d.x+cy*d.y+cz*d.z;if(tc>0&&tc<bt){const d2=cx*cx+cy*cy+cz*cz-tc*tc;if(d2<.5*.5){bt=tc;best={t:tc,a,head:false};}}continue;}
  // head sphere
  {const cx=a.pos.x-o.x,cy=yb+1.66-low-o.y,cz=a.pos.z-o.z,tc=cx*d.x+cy*d.y+cz*d.z;if(tc>0&&tc<bt+1){const d2=cx*cx+cy*cy+cz*cz-tc*tc;if(d2<.15*.15){const t=tc-Math.sqrt(.0225-d2);if(t>0&&t<bt){bt=t;best={t,a,head:true};}}}}
  // body capsule (vertical, r .3)
  const wx=o.x-a.pos.x,wz=o.z-a.pos.z,A=d.x*d.x+d.z*d.z;if(A<1e-6)continue;const Bq=wx*d.x+wz*d.z,Cq=wx*wx+wz*wz-.09,disc=Bq*Bq-A*Cq;if(disc<0)continue;const t=(-Bq-Math.sqrt(disc))/A;const y=o.y+d.y*t;if(t>0&&t<bt-.02&&y>yb+.1&&y<yb+1.5-low){bt=t;best={t,a,head:false};}}
 return best;}
function castShot(o,d,maxT,ignore){const w=world.ray(o,d,maxT),wt=w?w.t:maxT,h=rayActors(o,d,wt,ignore);if(h)return{t:h.t,kind:'actor',a:h.a,head:h.head};if(w)return{t:w.t,kind:w.k,n:w.n};return{t:maxT,kind:'none'};}
function los(a,b){const o=tv3.set(a.pos.x,a.pos.y+a.yOff+1.55,a.pos.z),d=new V(b.pos.x-o.x,b.pos.y+b.yOff+1.3-o.y,b.pos.z-o.z);const L=d.length();d.divideScalar(L);const w=world.ray(o,d,L);return !w||w.t>=L-.6;}
function spreadDir(d,s,out){out.copy(d);if(s<=0)return out;const u=tv2.set(0,1,0).cross(d);if(u.lengthSq()<1e-6)u.set(1,0,0);u.normalize();const w=new V().crossVectors(d,u);const r=Math.sqrt(Math.random())*s,a=Math.random()*Math.PI*2;return out.addScaledVector(u,Math.cos(a)*r).addScaledVector(w,Math.sin(a)*r).normalize();}
function impactFx(p,n,kind){const c=kind==='ground'?[.62,.48,.34]:kind==='rock'?[.66,.44,.32]:[.5,.38,.26];for(let i=0;i<6;i++)smoke.emit(p.x,p.y+.05,p.z,(n?n.x:0)*1.2+(Math.random()-.5)*1.4,.6+Math.random()*1.4,(n?n.z:0)*1.2+(Math.random()-.5)*1.4,c[0],c[1],c[2],.35+Math.random()*.3,.9,1.2,1.5,1.4);
 for(let i=0;i<5;i++)parts.emit(p.x,p.y+.05,p.z,(Math.random()-.5)*4,1+Math.random()*3,(Math.random()-.5)*4,2.2,1.4,.6,.05,.25,9,.5);snd.play(kind==='wall'||kind==='crate'||kind==='barrel'||kind==='porch'||kind==='post'||kind==='tent'||kind==='wagon'||kind==='tree'?'hitWood':Math.random()<.25&&kind!=='ground'?'ric':'hitDirt',p);}
function blood(p,d){for(let i=0;i<8;i++)smoke.emit(p.x,p.y,p.z,d.x*2+(Math.random()-.5)*1.4,(Math.random()-.2)*1.4,d.z*2+(Math.random()-.5)*1.4,.42,.06,.04,.18+Math.random()*.15,.5,3,2,1);}
// fire a shot from actor a along dir d (origin o); returns the hit
function shoot(a,o,d,w,dmg){const h=castShot(o,d,w.range||150,a),hp=new V().copy(o).addScaledVector(d,h.t);const mz=muzzleWorld(a.rig,new V());if(a===P&&G.camPos){}
 {let e=hp;if(a!==P){const c=camera.position,sd=tv.copy(hp).sub(mz),L=sd.length();sd.divideScalar(L||1);const tc=cl(tv2.copy(c).sub(mz).dot(sd),0,L);if(tv2.copy(mz).addScaledVector(sd,tc).distanceTo(c)<2.5)e=tv2.copy(mz).addScaledVector(sd,Math.max(0,tc-4));}if(e.distanceTo(mz)>.5)tracers.add(mz,e,new THREE.Color(2.4,1.7,.9),a===P?.022:.016,.07);}flashes.fire(mz,a===P?.55:.45,true);for(let i=0;i<4;i++)smoke.emit(mz.x+d.x*.4,mz.y,mz.z+d.z*.4,d.x*2.2+(Math.random()-.5)*.6,.4+Math.random()*.4,d.z*2.2+(Math.random()-.5)*.6,.7,.67,.62,.14+Math.random()*.12,1,-.3,1.6,1.4);
 snd.play(w.snd,a===P?null:a.pos);G.noise={p:a.pos.clone(),t:G.time,who:a};a.fireVis=1;
 if(h.kind==='actor'){damage(h.a,dmg*(h.head?w.head:1),a,{head:h.head,dir:d,point:hp});}else if(h.kind!=='none')impactFx(hp,h.n,h.kind);
 // near miss on the player
 if(a!==P&&P&&P.alive&&h.a!==P){const e=tv.set(P.pos.x,P.pos.y+P.yOff+1.4,P.pos.z).sub(o),tc=e.dot(d);if(tc>0&&tc<h.t&&e.lengthSq()-tc*tc<6)snd.play('whiz');}
 return h;}
function damage(v,dmg,src,o={}){if(!v||!v.alive||dmg<=0)return;if(src&&src!==P&&(src.kind==='bandit'||src.kind==='leader')&&(v.kind==='bandit'||v.kind==='leader'))return;const was=v.state;v.hp-=dmg;v.rig.hit=1;v.hitT=G.time;if(o.point&&o.dir)blood(o.point,o.dir);
 if(src===P){G.stats.hits++;if(o.head)G.stats.heads++;hitMarker(o.head);if(G.de.on||G.de.firing)G.stats.deHits=(G.stats.deHits||0)+1;P.de=Math.min(1,P.de+.035);}
 if(v===P){G.stats.taken=(G.stats.taken||0)+dmg;snd.play('hurt');P.regenT=4;G.hurt=Math.min(1,(G.hurt||0)+dmg/40);G.shake=Math.min(1,G.shake+.35);if(P.hp<=0){P.hp=0;playerDown();}return;}
 snd.play('hitBody',v.pos);snd.play('grunt',v.pos);
 if(v.kind==='town'){if(src===P){G.honour-=v.hp<=0?18:8;feed(v.hp<=0?'A TOWNSFOLK WAS KILLED · HONOUR LOST':'YOU SHOT A CIVILIAN · HONOUR LOST','bad');}panicTown(v.pos);}
 if(v.kind==='bandit'||v.kind==='leader'){if(src===P&&(was==='hands'||was==='tied'||was==='roped')){G.honour-=was==='hands'?14:10;feed('SHOOTING A HELPLESS OUTLAW · HONOUR LOST','bad');}
  if(was==='idle'||was==='alert'||was==='standoff')alarm(v,src?src.pos:v.pos);
  if(v===leader&&v.hp>0&&v.hp<v.max*.3&&(was==='fight'||was==='idle'||was==='alert'||was==='standoff')&&!o.head){surrender(v);return;}}
 if(v.hp<=0)kill(v,src,o);}
function kill(v,src,o={}){v.alive=false;v.hp=0;const was=v.state;v.state='dead';v.pose='';v.ai&&(v.ai.state='dead');if(G.rope&&G.rope.a===v)G.rope=null;
 if(v.kind==='bandit'||v.kind==='leader'){if(src===P){G.stats.kills++;if(G.de.on||G.de.firing)G.stats.deKills++;P.de=Math.min(1,P.de+.1);}
  if(v===leader){feed(`${G.contract.short} IS DEAD`,'bad');leaderDown('dead');}else{const pay=Math.round(15*G.D.bounty);G.gangPay+=pay;feed(`${v.name} KILLED · <span class="cash">+$${pay}</span>`);}
  checkGang();}
 if(v.kind==='town'&&src===P)G.stats.civ++;}
function surrender(v){v.state='hands';v.pose='hands';v.ai.state='hands';v.hold='';banner(`${G.contract.short} SURRENDERS`,'HOGTIE HIM — PRESS E UP CLOSE','#e8b45a',2.6);snd.play('anvil');}
function alarm(a,p){if(G.peace)return;for(const b of bandits){if(!b.alive||!b.ai||['hands','roped','tied','carried','draped','dead','standoff','duel'].includes(b.state))continue;if(b.state!=='fight'){b.state='fight';b.ai.state='fight';b.ai.react=G.D.react+Math.random()*.6;b.ai.lastSeen=p?p.clone():P.pos.clone();b.ai.goal=null;b.ai.coverT=0;}}
 if(!G.campFound)campFound();snd.setMode('combat');G.combatT=G.time;}
function campFound(){if(G.campFound)return;G.campFound=true;banner(camp.n,`${G.contract.gang} · ${bandits.filter(b=>b.alive).length} GUNS`,'#f2e4c4',3);}
function checkGang(){const gang=bandits.filter(b=>b!==leader),free=gang.filter(b=>b.alive&&b.state!=='tied');if(!free.length&&leader&&leader.alive&&!['hands','roped','tied','carried','draped'].includes(leader.state)&&!G.duelOffered){G.duelOffered=1;G.standoffT=.01;}}
function leaderDown(how){G.deliver=true;if(how==='dead'){banner('DEAD OR ALIVE','TAKE PROOF FROM THE BODY · E','#e8b45a',3);}else{banner('OUTLAW HOGTIED','CARRY HIM TO YOUR HORSE · DELIVER TO THE SHERIFF','#e8b45a',3.2);}snd.setMode('explore');snd.play('strum',null,1,1);for(const b of bandits)if(b.alive&&b.state==='fight'&&b!==leader){}}
let hmT=0;function hitMarker(head){const h=$('hitm');h.className=head?'on head':'on';hmT=.14;}

/* ================= player ================= */
function readInput(dt){const k=I.keys,ed=I.edge,m=I.mouse,inp=P.inp;inp.f=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0);inp.s=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0);
 inp.sprint=!!(k.ShiftLeft||k.ShiftRight);inp.walk=!!(k.KeyC||k.ControlLeft);inp.jump=!!ed.Space;inp.aim=m.r;inp.fireHeld=m.l;inp.click=m.le;m.le=false;inp.use=!!ed.KeyE;inp.dead=!!ed.KeyQ;inp.reload=!!ed.KeyR;inp.call=!!ed.KeyH;inp.duel=!!ed.KeyF;
 if(ed.Digit1)setWeapon('revolver');if(ed.Digit2)setWeapon('rifle');if(ed.Digit3)setWeapon('lasso');if(m.wheel){const i=WORDER.indexOf(P.wpn);setWeapon(WORDER[(i+(m.wheel>0?1:2))%3]);m.wheel=0;}
 if(ed.KeyM)$('fullmap').hidden=!$('fullmap').hidden;
 const sens=G.opt.sens*.0023*(inp.aim?(P.wpn==='rifle'?.55:.75):1);if(I.locked){camYaw-=m.dx*sens;camPitch=cl(camPitch-m.dy*sens,-1.2,.9);}m.dx=m.dy=0;
 const gp=gamepad();if(gp){const a=gp.axes,b=gp.buttons,dz=deadzone,pr=padPrev,Pd=n=>b[n]&&b[n].pressed;if(dz(a[1])||dz(a[0])){inp.f=-dz(a[1]);inp.s=dz(a[0]);}const lx=dz(a[2]||0),ly=dz(a[3]||0);camYaw-=lx*Math.abs(lx)*3*G.opt.sens*dt;camPitch=cl(camPitch-ly*Math.abs(ly)*2.2*G.opt.sens*dt,-1.2,.9);
  if(Pd(0)&&!pr[0])inp.jump=true;if((b[7]?.value||0)>.3){inp.fireHeld=true;if(!pr.rt)inp.click=true;}pr.rt=(b[7]?.value||0)>.3;if((b[6]?.value||0)>.3)inp.aim=true;if(Pd(2)&&!pr[2])inp.use=true;if(Pd(3)&&!pr[3])inp.call=true;if(Pd(5)&&!pr[5])inp.dead=true;if(Pd(1)&&!pr[1])inp.reload=true;if(Pd(10))inp.sprint=true;if(Pd(4)&&!pr[4]){const i=WORDER.indexOf(P.wpn);setWeapon(WORDER[(i+1)%3]);}if(Pd(9)&&!pr[9])pause(true);for(let q=0;q<17;q++)pr[q]=Pd(q);}
 if(G.inOv)Object.assign(inp,G.inOv);if(G.inOnce){Object.assign(inp,G.inOnce);G.inOnce=null;}I.flush();}
const padPrev={};
function setWeapon(w){if(!P||P.wpn===w||P.carry)return;P.wpn=w;P.reloadT=0;P.cd=Math.max(P.cd,.25);snd.play(w==='lasso'?'lassoSpin':'cock');hudDirty=true;}
function camFwd(out){const cp=Math.cos(camPitch);return out.set(Math.sin(camYaw)*cp,Math.sin(camPitch),Math.cos(camYaw)*cp);}
function stepPlayer(dt){const inp=P.inp;if(!P.alive)return;P.cd-=dt;P.lassoCd-=dt;P.jumpCd-=dt;P.fireVis=Math.max(0,P.fireVis-dt*6);
 P.regenT-=dt;if(P.regenT<=0&&P.hp<100)P.hp=Math.min(100,P.hp+dt*6);P.de=Math.min(1,P.de+dt*(G.de.on?0:.006));
 if(G.duel){stepDuelPlayer(dt);return;}
 const fx=Math.sin(camYaw),fz=Math.cos(camYaw),rx=-Math.cos(camYaw),rz=Math.sin(camYaw);let mx=fx*inp.f+rx*inp.s,mz=fz*inp.f+rz*inp.s;const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}
 P.aim=inp.aim&&!P.carry;
 if(P.mounted)stepRide(dt,mx,mz,ml);else{
  const sprint=inp.sprint&&ml>.2&&!P.aim&&!P.carry&&P.stam>.02&&!P.tired;let sp=P.aim?2.3:P.carry?2.2:sprint?6.6:4.1;if(inp.walk)sp=1.7;const wd=WATER-world.heightAt(P.pos.x,P.pos.z);if(wd>.5)sp*=.55;
  if(sprint){P.stam=Math.max(0,P.stam-dt*.14);if(P.stam<=0)P.tired=true;}else{P.stam=Math.min(1,P.stam+dt*.12);if(P.stam>.3)P.tired=false;}
  const acc=P.ground?10:2;P.vel.x+=(mx*sp-P.vel.x)*Math.min(1,dt*acc);P.vel.z+=(mz*sp-P.vel.z)*Math.min(1,dt*acc);
  if(P.aim)P.yaw+=angDiff(P.yaw,camYaw)*Math.min(1,dt*18);else if(ml>.1)P.yaw+=angDiff(P.yaw,Math.atan2(mx,mz))*Math.min(1,dt*10);
  if(inp.jump&&P.ground&&P.jumpCd<=0&&!P.carry){P.vel.y=6.2;P.ground=false;P.jumpCd=.5;}
  physics(P,dt);P.pitch=camPitch;
  const sp2=Math.hypot(P.vel.x,P.vel.z);if(P.ground&&sp2>1){P.stepT-=dt*sp2;if(P.stepT<=0){P.stepT=sp2>5?1.9:1.6;snd.play(inTown(P.pos.x,P.pos.z,-6)&&world.support(P.pos.x,P.pos.z,P.pos.y,.2,.2)>-1e8?'board':'step',null,.8);}}}
 // weapons
 if(P.carry)return;const w=P.wpn,d=WPN[w];
 if(P.reloadT>0&&w!=='lasso'){P.reloadT-=dt;if(P.reloadT<=0){const am=P.ammo[w];if(am.res>0&&am.mag<d.mag){am.mag++;am.res--;snd.play('shell');hudDirty=true;if(am.mag<d.mag&&am.res>0)P.reloadT=d.shell;else snd.play('cock');}}}
 if(inp.reload&&w!=='lasso')startReload();
 if(inp.dead)toggleDeadEye();
 if(G.de.on){if(inp.click||inp.fireHeld&&G.de.paintT<=0)paintMark();G.de.paintT-=dt/Math.max(.05,G.timeScale);return;}
 if(G.de.firing)return;
 if(w==='lasso'){if(inp.click&&P.lassoCd<=0&&!G.rope)throwLasso();P.spinT=(P.spinT||0)-dt;if(P.aim&&P.spinT<=0){P.spinT=.55;snd.play('lassoSpin');}return;}
 const want=inp.click||inp.fireHeld;if(want){const am=P.ammo[w];const ready=P.cd<=0||inp.click&&P.cd<=d.rate-d.min;
  if(ready){if(am.mag<=0){if(am.res>0)startReload();else if(P.cd<=0){snd.play('empty');P.cd=.35;}}
   else{P.reloadT=0;am.mag--;P.cd=d.rate;G.stats.shots++;hudDirty=true;const o=camera.position.clone(),f=camFwd(new V());const piv=tv.set(P.pos.x,P.pos.y+P.yOff+1.5,P.pos.z),kk=Math.max(0,tv2.subVectors(piv,o).dot(f));o.addScaledVector(f,kk);
    const mv=P.mounted?Math.min(1,P.mounted.spd/10):Math.min(1,Math.hypot(P.vel.x,P.vel.z)/5);const s=(P.aim?d.spread[1]:d.spread[0])+mv*(P.mounted?.025:.015);shoot(P,o,spreadDir(f,s,new V()),d,d.dmg);
    recoil+=w==='rifle'?.045:.03;G.shake=Math.min(1,G.shake+(w==='rifle'?.25:.15));if(w==='rifle'){P.cd=d.rate;setTimeout(()=>snd.play('lever'),0);}}}}}
function startReload(){const w=P.wpn;if(w==='lasso')return;const am=P.ammo[w];if(P.reloadT>0||am.mag>=WPN[w].mag||am.res<=0)return;P.reloadT=WPN[w].shell+.15;snd.play(w==='revolver'?'spin':'cock');}
function physics(a,dt){const Pp=a.pos,Vv=a.vel;Vv.y-=24*dt;const ox=Pp.x,oz=Pp.z;Pp.x+=Vv.x*dt;Pp.z+=Vv.z*dt;
 const g0=world.heightAt(ox,oz),g1=world.heightAt(Pp.x,Pp.z);if(g1-g0>Math.hypot(Pp.x-ox,Pp.z-oz)*1.5+.06&&g1>Pp.y+.5){Pp.x=ox;Pp.z=oz;Vv.x*=.3;Vv.z*=.3;}
 world.collide(Pp,.34,1.8,.55);Pp.y+=Vv.y*dt;const g=world.groundAt(Pp.x,Pp.z,Pp.y+.55);
 if(Pp.y<=g){Pp.y=g;Vv.y=0;a.ground=true;}else if(a.ground&&Pp.y-g<.55&&Vv.y<=0){Pp.y=g;Vv.y=0;}else a.ground=false;
 const lim=EXT-10;if(Math.abs(Pp.x)>lim||Math.abs(Pp.z)>lim){Pp.x=cl(Pp.x,-lim,lim);Pp.z=cl(Pp.z,-lim,lim);if(a===P)prompt('THE FRONTIER ENDS HERE — TURN BACK',1);}}

/* ================= horse ================= */
function stepRide(dt,mx,mz,ml){const h=P.mounted,inp=P.inp;let target=0;
 if(ml>.1){const want=Math.atan2(mx,mz),da=angDiff(h.yaw,want),rate=lerp(2.7,1.25,cl(h.spd/14,0,1));h.turn=cl(da*2,-1,1);h.yaw+=cl(da,-rate*dt,rate*dt);
  const gal=inp.sprint&&!h.tired;target=inp.walk?2.2:gal?14:8.2;if(Math.abs(da)>1.9)target=Math.min(target,2.5);if(P.aim)target=Math.min(target,inp.sprint?8.2:5);}
 else{h.turn=0;}
 if(target>11){h.stam=Math.max(0,h.stam-dt*.075);if(h.stam<=0){h.tired=true;prompt('YOUR HORSE IS SPENT — EASE OFF',1.6);snd.play('snort',h.pos);}}else{h.stam=Math.min(1,h.stam+dt*(target<3?.08:.045));if(h.stam>.3)h.tired=false;}
 const wd=WATER-world.heightAt(h.pos.x,h.pos.z);if(wd>.7)target=Math.min(target,3.8);
 h.spd+=cl(target-h.spd,-9*dt,(target>9?3.2:4.6)*dt);moveHorse(h,dt);P.pos.copy(h.pos);P.vel.set(Math.sin(h.yaw)*h.spd,0,Math.cos(h.yaw)*h.spd);P.yaw=P.aim?camYaw:h.yaw;P.pitch=camPitch;}
function moveHorse(h,dt){const ox=h.pos.x,oz=h.pos.z;h.pos.x+=Math.sin(h.yaw)*h.spd*dt;h.pos.z+=Math.cos(h.yaw)*h.spd*dt;
 const g0=world.heightAt(ox,oz),g1=world.heightAt(h.pos.x,h.pos.z);if(g1-g0>Math.hypot(h.pos.x-ox,h.pos.z-oz)*1.25+.05&&g1-g0>.08){h.pos.x=ox;h.pos.z=oz;if(h.spd>6&&h.rider){h.spd*=.4;snd.play('whinny',h.pos);G.shake=.4;}else h.spd*=.6;}
 const bx=h.pos.x,bz=h.pos.z;let hit=world.collide(h.pos,.75,2.2,.65);tv.set(h.pos.x+Math.sin(h.yaw)*1.1,0,h.pos.z+Math.cos(h.yaw)*1.1);if(world.collide(tv,.55,2.2,.65)){h.pos.x+=tv.x-(bx+Math.sin(h.yaw)*1.1)+(h.pos.x-bx)*0;h.pos.z+=tv.z-(bz+Math.cos(h.yaw)*1.1);hit=true;}
 if(hit&&h.spd>9&&h.rider){h.spd*=.35;snd.play('whinny',h.pos);G.shake=.5;}
 const lim=EXT-10;h.pos.x=cl(h.pos.x,-lim,lim);h.pos.z=cl(h.pos.z,-lim,lim);const gy=world.groundAt(h.pos.x,h.pos.z,h.pos.y+.6);h.vy-=24*dt;h.pos.y+=h.vy*dt;if(h.pos.y<=gy||h.pos.y-gy<.6){h.pos.y=gy;h.vy=0;}
 const hf=world.heightAt(h.pos.x+Math.sin(h.yaw)*1.2,h.pos.z+Math.cos(h.yaw)*1.2),hb=world.heightAt(h.pos.x-Math.sin(h.yaw)*1.2,h.pos.z-Math.cos(h.yaw)*1.2);h.slope=-Math.atan2(hf-hb,2.4)*.8;
 // hooves + dust + splashes
 if(h.spd>.6){h.hoofT-=dt*h.spd/(h.spd<3.6?1.7:h.spd<6.6?2.6:h.spd<11?3.6:5.4)*4;if(h.hoofT<=0){h.hoofT=1;const town=inTown(h.pos.x,h.pos.z,-4)&&Math.abs(h.pos.z)<14;snd.play(town?'clop':'hoof',h.pos,1,cl(h.spd/14,0,1));
   const wet=WATER-world.heightAt(h.pos.x,h.pos.z)>.15;if(wet){snd.play('splash',h.pos);for(let i=0;i<6;i++)parts.emit(h.pos.x+(Math.random()-.5),WATER+.1,h.pos.z+(Math.random()-.5),(Math.random()-.5)*2,2+Math.random()*2,(Math.random()-.5)*2,1.6,1.7,1.7,.08,.5,12,.5);}
   else if(gfx>0&&h.spd>4)for(let i=0;i<(h.spd>10?4:2);i++)smoke.emit(h.pos.x-Math.sin(h.yaw)*(.8+Math.random())+(Math.random()-.5)*.8,h.pos.y+.15,h.pos.z-Math.cos(h.yaw)*(.8+Math.random())+(Math.random()-.5)*.8,(Math.random()-.5)*1.2,.5+Math.random()*.6,(Math.random()-.5)*1.2,.46,.36,.26,.45+Math.random()*.4,1.3+h.spd*.05,0,.8,1.5);}}}
function stepHorse(h,dt){if(h.rider)return;h.whinT-=dt;
 if(h.state==='come'&&P){const dx=P.pos.x-h.pos.x,dz=P.pos.z-h.pos.z,d=Math.hypot(dx,dz);if(d>230){const k=110/d;h.pos.set(P.pos.x-dx*k,0,P.pos.z-dz*k);h.pos.y=world.groundAt(h.pos.x,h.pos.z,99);}
  const want=Math.atan2(dx,dz);h.yaw+=cl(angDiff(h.yaw,want),-2.4*dt,2.4*dt);const target=d>45?13:d>14?8:d>4.5?3:0;h.spd+=cl(target-h.spd,-8*dt,4*dt);if(d<4.2&&h.spd<.5){h.state='idle';snd.play('snort',h.pos);}}
 else{h.spd=Math.max(0,h.spd-dt*6);h.turn=0;}
 moveHorse(h,dt);}
function callHorse(){if(!horse||P.mounted)return;snd.play('whistle');const d=horse.pos.distanceTo(P.pos);if(d<5){prompt('YOUR HORSE IS RIGHT HERE',1);return;}horse.state='come';setTimeout(()=>snd.play('whinny',horse.pos),500);prompt('YOU WHISTLE FOR YOUR HORSE',1.2);}
function mount(){if(!horse||P.carry)return;P.mounted=horse;horse.rider=P;horse.state='ridden';P.vel.set(0,0,0);P.yOff=1.05;snd.play('snort',horse.pos);document.body.classList.add('mounted');}
function dismount(){const h=P.mounted;if(!h)return;if(h.spd>4){prompt('SLOW DOWN TO DISMOUNT',1);return;}P.mounted=null;h.rider=null;h.state='idle';h.spd=0;P.yOff=0;const rx=-Math.cos(h.yaw),rz=Math.sin(h.yaw);let x=h.pos.x-rx*1.3,z=h.pos.z-rz*1.3;placeOnGround(P,x,z);world.collide(P.pos,.4,1.8,.5);document.body.classList.remove('mounted');}

/* ================= lasso + hogtie + carry ================= */
function throwLasso(){P.lassoCd=1.1;snd.play('lassoThrow');const o=camera.position.clone(),f=camFwd(new V());let best=null,bs=1e9;
 for(const a of bandits){if(!a.alive||['tied','roped','carried','draped'].includes(a.state))continue;const e=tv.set(a.pos.x,a.pos.y+1.1,a.pos.z).sub(o),t=e.dot(f);if(t<=0)continue;const off=Math.sqrt(Math.max(0,e.lengthSq()-t*t)),dd=a.pos.distanceTo(P.pos);if(dd>22||off>1.2+dd*.04)continue;if(!los(P,a))continue;const sc=off+dd*.02;if(sc<bs){bs=sc;best=a;}}
 const to=best?best.pos.clone().setY(best.pos.y+1.2):o.clone().addScaledVector(f,16);G.lassoFx={t:0,to,a:best};P.fireVis=1;G.noise=null;}
function stepLasso(dt){const L=G.lassoFx;if(L){L.t+=dt;if(L.t>=.32){G.lassoFx=null;if(L.a&&L.a.alive){const a=L.a;if(a.state==='hands'||a.state==='standoff'||a.state==='duel'||a.state==='fight'||a.state==='idle'||a.state==='alert'){G.rope={a,t:0};a.state='roped';a.pose='roped';a.hold='';if(a.ai)a.ai.state='roped';snd.play('rope',a.pos);if(a!==leader)alarm(a,P.pos);if(G.duel&&G.duel.a===a)endDuel();}}}}
 const r=G.rope;if(!r)return;const a=r.a;if(!a.alive){G.rope=null;return;}r.t+=dt;const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,d=Math.hypot(dx,dz);
 if(d>13){const k=(d-13)/d;a.pos.x+=dx*k;a.pos.z+=dz*k;a.pos.y=world.groundAt(a.pos.x,a.pos.z,a.pos.y+1);if(P.mounted&&P.mounted.spd>6&&Math.random()<dt*8)smoke.emit(a.pos.x,a.pos.y+.2,a.pos.z,0,.6,0,.8,.65,.5,.8,1.4,0,.8,1.6);if(d>16&&!P.mounted){P.pos.x-=dx/d*(d-16);P.pos.z-=dz/d*(d-16);}}
 if(r.t>(a===leader?16:9)&&!P.tieT){G.rope=null;a.state='fight';a.pose='';if(a.ai){a.ai.state='fight';a.ai.react=.8;}feed(`${a.name} BROKE FREE`,'bad');}}
function hogtie(a){P.tieT=1;P.tieA=a;snd.play('tie');}
function finishTie(a){P.tieT=0;if(!a.alive)return;a.state='tied';a.pose='tied';if(a.ai)a.ai.state='tied';if(G.rope&&G.rope.a===a)G.rope=null;G.stats.ties++;
 if(a===leader){G.honour+=8;leaderDown('alive');}else{const pay=Math.round(35*G.D.bounty);G.gangPay+=pay;G.honour+=2;feed(`${a.name} HOGTIED · <span class="cash">+$${pay}</span>`);checkGang();}}

/* ================= Dead Eye ================= */
function toggleDeadEye(){const de=G.de;if(de.firing)return;if(de.on){exitDeadEye(true);return;}if(P.wpn==='lasso'||P.de<.12){if(P.de<.12)prompt('DEAD EYE IS SPENT',1);return;}
 de.on=true;de.marks=[];de.paintT=0;G.timeScale=.22;snd.play('deIn');snd.setLP(800);$('de').style.opacity=1;}
function paintMark(){const de=G.de,am=P.ammo[P.wpn];if(de.marks.length>=am.mag){if(!am.mag)prompt('NO ROUNDS LOADED',1);return;}de.paintT=.12;
 const o=camera.position.clone(),f=camFwd(new V()),h=castShot(o,f,WPN[P.wpn].range,P);if(h.kind!=='actor'||!h.a||h.a.kind==='town'&&false)return;const hp=o.clone().addScaledVector(f,h.t);
 de.marks.push({a:h.a,off:hp.sub(h.a.pos),head:h.head});snd.play('mark');if(de.marks.length>=am.mag)exitDeadEye(true);}
function exitDeadEye(fire){const de=G.de;de.on=false;G.timeScale=1;snd.setLP(20000);$('de').style.opacity=0;if(fire&&de.marks.length){de.firing=true;de.fireT=.05;G.timeScale=.35;snd.play('deOut');}else{snd.play('deOut');de.marks=[];}}
function stepDeadEye(rdt){const de=G.de;if(de.on){P.de-=rdt*.11;if(P.de<=0){P.de=0;exitDeadEye(true);}}
 if(de.firing){de.fireT-=rdt;if(de.fireT<=0){const m=de.marks.shift();if(!m){de.firing=false;G.timeScale=1;return;}de.fireT=.16;const am=P.ammo[P.wpn];if(am.mag<=0||!m.a.alive){if(!de.marks.length){de.firing=false;G.timeScale=1;}return;}
   const tgt=m.a.pos.clone().add(m.off);camYaw=Math.atan2(tgt.x-camera.position.x,tgt.z-camera.position.z);camPitch=cl(Math.atan2(tgt.y-camera.position.y,Math.hypot(tgt.x-camera.position.x,tgt.z-camera.position.z)),-1.2,.9);P.yaw=camYaw;
   am.mag--;G.stats.shots++;hudDirty=true;const mz=muzzleWorld(P.rig,new V()),d=tgt.clone().sub(camera.position).normalize();const blocked=world.ray(camera.position,d,tgt.distanceTo(camera.position)-.3);
   if(blocked){shoot(P,camera.position.clone(),d,WPN[P.wpn],WPN[P.wpn].dmg);}else{tracers.add(mz,tgt,new THREE.Color(2.6,1.6,.7),.03,.09);flashes.fire(mz,.6,true);snd.play(WPN[P.wpn].snd);G.noise={p:P.pos.clone(),t:G.time,who:P};P.fireVis=1;damage(m.a,WPN[P.wpn].dmg*(m.head?WPN[P.wpn].head:1.6),P,{head:m.head,dir:d,point:tgt});}
   G.shake=Math.min(1,G.shake+.2);if(!de.marks.length){de.fireT=.35;}}}}

/* ================= duel ================= */
function startDuel(){const a=leader;if(!a||!a.alive||G.duel)return;if(P.mounted){P.mounted.spd=0;dismount();}if(P.carry)return;
 const dx=a.pos.x-P.pos.x,dz=a.pos.z-P.pos.z,d=Math.hypot(dx,dz)||1;placeOnGround(a,P.pos.x+dx/d*12.5,P.pos.z+dz/d*12.5);world.collide(a.pos,.4,1.8,.5);a.state='duel';a.pose='duel';a.hold='';a.vel.set(0,0,0);
 a.yaw=Math.atan2(-dx,-dz);P.yaw=Math.atan2(dx,dz);P.vel.set(0,0,0);camYaw=P.yaw;camPitch=-.03;P.wpn='revolver';P.ammo.revolver.mag=Math.max(1,P.ammo.revolver.mag);exitDeadEyeQuiet();
 G.duel={a,stage:'setup',t:0,react:G.D.duel*(.9+Math.random()*.25),wait:1.8+Math.random()*1.8,early:false,hb:0};snd.setMode('duel');snd.play('anvil');banner('DUEL',`${G.contract.short} · WAIT FOR THE SIGNAL, THEN DRAW`,'#f2e4c4',2.2);
 document.body.classList.add('cine');$('duelui').hidden=false;$('duelui').className='';$('duelt').textContent='STEADY…';}
function exitDeadEyeQuiet(){G.de.on=false;G.de.firing=false;G.de.marks=[];G.timeScale=1;$('de').style.opacity=0;}
function stepDuelPlayer(dt){P.aim=G.duel.stage==='draw';P.vel.set(0,0,0);}
function stepDuel(rdt){const D=G.duel;if(!D)return;D.t+=rdt;const a=D.a,inp=P.inp;
 if(!a.alive||a.state!=='duel'){endDuel(a.alive?'other':'kill');return;}
 if(D.stage==='setup'){if(D.t>1.6){D.stage='wait';D.t=0;}}
 else if(D.stage==='wait'){D.hb-=rdt;if(D.hb<=0){D.hb=.75-D.t*.08;snd.play('heart');}
  if(inp.click){D.early=true;D.react=.28;prompt('TOO EARLY!',1.2);}
  if(D.t>D.wait||D.early){D.stage='draw';D.t=0;G.timeScale=.3;snd.play('draw');$('duelui').className='draw';$('duelt').textContent='DRAW!';camYaw+=(Math.random()<.5?-1:1)*(.07+Math.random()*.07);camPitch+=(Math.random()-.5)*.08;inp.click=false;}}
 else if(D.stage==='draw'){a.hold=D.t>D.react*.45?'revolver':'';a.aim=D.t>D.react*.45;
  if(inp.click&&!D.shot){D.shot=true;const am=P.ammo.revolver;am.mag=Math.max(0,am.mag-1);G.stats.shots++;hudDirty=true;const o=camera.position.clone(),f=camFwd(new V());
   const hand=a.rig.handR.getWorldPosition(new V()),e=hand.clone().sub(o),t=e.dot(f),off=Math.sqrt(Math.max(0,e.lengthSq()-t*t));
   const mz=muzzleWorld(P.rig,new V());snd.play('revolver');flashes.fire(mz,.6,true);P.fireVis=1;G.noise={p:P.pos.clone(),t:G.time,who:P};
   if(t>0&&off<.24){tracers.add(mz,hand,new THREE.Color(2.6,1.6,.7),.03,.1);G.stats.hits++;parts.burst(hand,14,4,new THREE.Color(2.4,1.6,.6),.06,.3,{grav:6});snd.play('ric',hand);a.hp=Math.min(a.hp,a.max*.3);G.honour+=10;G.stats.disarm=1;endDuel('disarm');return;}
   const h=castShot(o,f,120,P);const hp=o.clone().addScaledVector(f,h.t);tracers.add(mz,hp,new THREE.Color(2.6,1.6,.7),.03,.1);
   if(h.kind==='actor'&&h.a===a){G.stats.hits++;if(h.head)G.stats.heads++;hitMarker(h.head);blood(hp,f);G.honour+=3;kill(a,P,{head:h.head});endDuel('kill');return;}else if(h.kind==='actor')damage(h.a,40,P,{});else impactFx(hp,h.n,h.kind);}
  if(D.t>=D.react){const mz=muzzleWorld(a.rig,new V()),tg=new V(P.pos.x,P.pos.y+1.3,P.pos.z);tracers.add(mz,tg,new THREE.Color(2.6,1.6,.7),.03,.1);flashes.fire(mz,.6,true);snd.play('revolver',a.pos);a.fireVis=1;
   damage(P,G.D.n==='EASY'?45:G.D.n==='NORMAL'?60:80,a,{point:tg,dir:tg.clone().sub(mz).normalize()});if(P.alive){feed(`${G.contract.short} OUTDREW YOU`,'bad');endDuel('lost');}else endDuel('dead');}}}
function endDuel(res){const D=G.duel;if(!D)return;G.duel=null;G.timeScale=1;document.body.classList.remove('cine');$('duelui').hidden=true;const a=D.a;
 if(res==='disarm'){surrender(a);feed('DISARMED HIM · <span class="cash">HONOUR +</span>');snd.setMode('explore');}
 else if(res==='kill'){banner('FASTEST GUN IN DUSTWATER','',  '#e8b45a',2.2);snd.setMode('explore');}
 else if(res==='lost'&&a.alive){a.state='fight';a.ai.state='fight';a.ai.react=.4;a.pose='';snd.setMode('combat');}
 else if(res==='other'){snd.setMode('combat');}}

/* ================= outlaws + townsfolk ================= */
const GB={get player(){return P;},get diff(){return G.D;},get time(){return G.time;},get noise(){return G.noise;},get peace(){return G.peace;},los,alarm,coverTaken:(c,a)=>bandits.some(b=>b!==a&&b.alive&&b.ai&&b.ai.cover===c)};
function stepBandits(dt){for(const a of bandits){a.fireVis=Math.max(0,a.fireVis-dt*6);if(!a.alive)continue;a.cd-=dt;
  if(a.reloadT>0){a.reloadT-=dt;if(a.reloadT<=0)a.mag=a.wpn==='rifle'?8:6;}
  const st=a.state;a.hold=st==='hands'||st==='roped'||st==='tied'||st==='carried'||st==='draped'?'':st==='duel'?a.hold:a.wpn;
  if(['roped','tied','hands','carried','draped','duel'].includes(st)){a.vel.set(0,0,0);a.aim=false;if(st==='hands')a.yaw+=angDiff(a.yaw,Math.atan2(P.pos.x-a.pos.x,P.pos.z-a.pos.z))*Math.min(1,dt*2);if(st==='roped'||st==='hands'||st==='tied')physics(a,dt);continue;}
  if(st==='standoff'){a.hold='';a.aim=false;const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z,d=Math.hypot(dx,dz);a.yaw+=angDiff(a.yaw,Math.atan2(dx,dz))*Math.min(1,dt*4);const sp=d>15?2.2:0;a.vel.x=dx/d*sp;a.vel.z=dz/d*sp;physics(a,dt);G.standoffT+=dt;
   if(G.standoffT>12||d>60){a.state='fight';a.ai.state='fight';a.ai.react=.3;G.standoffT=0;feed(`${G.contract.short} WON'T WAIT ALL DAY`,'bad');}continue;}
  a.ai.state=st;think(a,GB,dt);a.state=a.ai.state;
  if(a===leader&&a.state==='fight'&&G.standoffT>0&&!G.duel&&G.duelOffered===1){G.duelOffered=2;a.state='standoff';a.ai.state='standoff';G.standoffT=.01;banner(`"JUST YOU AND ME NOW."`,`${G.contract.short} CALLS YOU OUT · PRESS F TO DUEL`,'#f2e4c4',3);snd.play('anvil');continue;}
  const I=a.inp,sp=I.run?5.1:2.4,ml=Math.min(1,Math.hypot(I.mx,I.mz));const tx=ml>.01?I.mx/Math.max(ml,1e-3)*sp*ml:0,tz=ml>.01?I.mz/Math.max(ml,1e-3)*sp*ml:0;
  a.vel.x+=(tx-a.vel.x)*Math.min(1,dt*7);a.vel.z+=(tz-a.vel.z)*Math.min(1,dt*7);if(I.face!=null)a.yaw+=angDiff(a.yaw,I.face)*Math.min(1,dt*7);else if(ml>.1)a.yaw+=angDiff(a.yaw,Math.atan2(I.mx,I.mz))*Math.min(1,dt*6);
  physics(a,dt);a.aim=I.aim;if(a.aim){const dx=P.pos.x-a.pos.x,dz=P.pos.z-a.pos.z;a.pitch=Math.atan2(P.pos.y+P.yOff-a.pos.y,Math.hypot(dx,dz));}else a.pitch=0;
  if(I.fire&&a.cd<=0&&a.mag>0&&P.alive)banditFire(a);}}
function banditFire(a){const W=a.wpn==='rifle'?WPN.rifle:WPN.revolver;a.mag--;a.cd=G.D.cd*(a.wpn==='rifle'?1.5:1)*(.7+Math.random()*.6);
 const o=muzzleWorld(a.rig,new V());if(o.distanceTo(a.pos)>3)o.set(a.pos.x,a.pos.y+1.45,a.pos.z);const tg=new V(P.pos.x,P.pos.y+P.yOff+1.15,P.pos.z),d=tg.sub(o).normalize();
 const mv=P.mounted?Math.min(1,P.mounted.spd/9)*.9:Math.hypot(P.vel.x,P.vel.z)/6*.6;const s=G.D.spread*(1+mv)*(1+Math.max(0,a.pos.distanceTo(P.pos)-28)/55)*(a.wpn==='rifle'?.8:1);
 shoot(a,o,spreadDir(d,s,new V()),W,G.D.dmg*(a.wpn==='rifle'?1.45:1));}
function spawnTown(){for(const t of townsfolk)removeActor(t);townsfolk=[];const r=rng(3),doors=Object.values(world.town.doors);
 for(let i=0;i<7;i++){const L=LOOKS.town[i%5],lk=look({...L,mask:0,coatLen:0,stache:i%2,hair:L.hair||[0x3a2618,0x6a4a2a,0x1a1410][i%3]});const a=newActor('town',lk,{name:'TOWNSFOLK',hp:60,max:60,state:'walk',goal:null,waitT:r()*4});a.rig.lasso=false;const b=doors[(i*3+1)%doors.length];placeOnGround(a,b.door.x+(r()-.5)*4,b.door.z);townsfolk.push(a);}
 const sh=world.town.sheriff;const s=newActor('town',look({skin:0xc08a68,hat:0xd8ccb0,band:0x3a2414,shirt:0xe8e0d0,vest:0x1e1e22,pants:0x3a3430,kerch:0x2a2a2a,mask:0,stache:1,hair:0x8a8a88}),{name:'SHERIFF',hp:100,max:100,state:'stand',sheriff:true});s.rig.lasso=false;
 placeOnGround(s,sh.x+2.2,sh.door.z-(sh.s)*1.9);s.yaw=sh.s>0?0:Math.PI;townsfolk.push(s);G.sheriff=s;}
function panicTown(p){for(const t of townsfolk){if(!t.alive||t.sheriff||t.pos.distanceTo(p)>70)continue;t.state='panic';let bd=1e9;for(const b of Object.values(world.town.doors)){const d=Math.hypot(b.door.x-t.pos.x,b.door.z-t.pos.z);if(d<bd){bd=d;t.goal=new V(b.door.x,0,b.door.z);}}}}
function stepTown(dt){for(const t of townsfolk){if(!t.alive)continue;if(t.hidden){t.hideT-=dt;if(t.hideT<=0){t.hidden=false;t.rig.root.visible=true;t.state='walk';}continue;}
  if(t.sheriff){const dx=P.pos.x-t.pos.x,dz=P.pos.z-t.pos.z;if(Math.hypot(dx,dz)<14)t.yaw+=angDiff(t.yaw,Math.atan2(dx,dz))*Math.min(1,dt*3);t.vel.set(0,0,0);physics(t,dt);continue;}
  if(!t.goal){t.waitT-=dt;if(t.waitT<=0){const doors=Object.values(world.town.doors);if(Math.random()<.5){const b=doors[Math.random()*doors.length|0];t.goal=new V(b.door.x+(Math.random()-.5)*3,0,b.door.z);}else t.goal=new V((Math.random()-.5)*130,0,(Math.random()-.5)*8);}}
  let mx=0,mz=0;if(t.goal){const gx=t.goal.x-t.pos.x,gz=t.goal.z-t.pos.z,gd=Math.hypot(gx,gz);if(gd<.8){t.goal=null;t.waitT=3+Math.random()*6;if(t.state==='panic'){t.hidden=true;t.hideT=25;t.rig.root.visible=false;}}else{mx=gx/gd;mz=gz/gd;}}
  const sp=t.state==='panic'?5:1.5;t.vel.x+=(mx*sp-t.vel.x)*Math.min(1,dt*6);t.vel.z+=(mz*sp-t.vel.z)*Math.min(1,dt*6);if(mx||mz)t.yaw+=angDiff(t.yaw,Math.atan2(mx,mz))*Math.min(1,dt*6);physics(t,dt);}}

/* ================= interaction (E) ================= */
function nearHorse(r=3.4){return horse&&!P.mounted&&horse.pos.distanceTo(P.pos)<r;}
function interact(){const inp=P.inp;let txt='',act=null;if(G.phase==='end'){$('prompt').style.opacity=0;return;}
 if(P.tieT>0){txt='HOGTYING…';}
 else if(G.app==='play'&&G.deliver&&!G.duel){const sd=Math.hypot(world.town.sheriff.door.x-P.pos.x,world.town.sheriff.door.z-P.pos.z);const onHorse=horse&&horse.load===leader&&horse.pos.distanceTo(P.pos)<20;
  if(sd<11&&(P.carry===leader||onHorse)){txt='<kbd>E</kbd> HAND OVER '+G.contract.short;act=()=>complete('alive');}
  else if(sd<11&&G.proof){txt='<kbd>E</kbd> CLAIM THE BOUNTY';act=()=>complete('dead');}}
 if(!act&&!txt&&!G.duel){
  if(P.carry){if(nearHorse(3.6)&&!horse.load){txt='<kbd>E</kbd> PUT HIM ON YOUR HORSE';act=()=>{horse.load=P.carry;P.carry.state='draped';P.carry.pose='draped';P.carry=null;snd.play('tie');P.wpn=P.prevW||'revolver';};}else{txt='<kbd>E</kbd> DROP';act=()=>{const a=P.carry;P.carry=null;a.state='tied';a.pose='tied';placeOnGround(a,P.pos.x+Math.sin(P.yaw)*.9,P.pos.z+Math.cos(P.yaw)*.9);P.wpn=P.prevW||'revolver';};}}
  else if(P.mounted){if(P.mounted.spd<4){txt=G.deliver||leader&&leader.alive?'':'';}act=()=>dismount();txt=P.mounted.spd<4?'<kbd>E</kbd> DISMOUNT':'';if(!txt)act=null;}
  else{let best=null,bd=3;for(const a of bandits){const d=a.pos.distanceTo(P.pos);if(d>=bd)continue;if(a.alive&&(a.state==='roped'||a.state==='hands')){best={a,k:'tie'};bd=d;}else if(a.alive&&a.state==='tied'&&a===leader){best={a,k:'carry'};bd=d;}else if(!a.alive&&a===leader&&!G.proof){best={a,k:'proof'};bd=d;}}
   if(horse&&horse.load&&horse.pos.distanceTo(P.pos)<3.4&&!best){}
   if(best){const a=best.a;if(best.k==='tie'){txt=`<kbd>E</kbd> HOGTIE ${a.name}`;act=()=>hogtie(a);}else if(best.k==='carry'){txt=`<kbd>E</kbd> PICK UP ${a.name}`;act=()=>{P.carry=a;a.state='carried';a.pose='carried';P.prevW=P.wpn;snd.play('tie');};}else{txt='<kbd>E</kbd> TAKE PROOF OF DEATH';act=()=>{G.proof=true;snd.play('pickup');feed(`${G.contract.short}'S HAT TAKEN AS PROOF`);banner('PROOF TAKEN','RIDE BACK TO THE SHERIFF IN DUSTWATER','#e8b45a',2.6);};}}
   else if(nearHorse()){txt='<kbd>E</kbd> MOUNT';act=()=>mount();}
   else if(G.app==='play'&&leader&&leader.state==='standoff'&&leader.pos.distanceTo(P.pos)<35){txt='<kbd>F</kbd> DUEL '+G.contract.short;}}}
 if(leader&&leader.state==='standoff'&&inp.duel&&leader.pos.distanceTo(P.pos)<40)startDuel();
 if(act&&inp.use&&!P.tieT)act();if(msgT<=0)$('prompt').innerHTML=txt,$('prompt').style.opacity=txt?1:0;}

/* ================= flow ================= */
function resetPlayer(){if(!P){P=makePlayer();horse=makeHorseObj(COATS[0]);}Object.assign(P,{alive:true,hp:100,stam:1,de:1,mounted:null,carry:null,wpn:'revolver',yOff:0,cd:0,reloadT:0,tieT:0,tired:false,regenT:0,state:''});P.ammo={revolver:{mag:6,res:36},rifle:{mag:8,res:32}};P.rig.die=0;
 const b=world.town.board;placeOnGround(P,b.x+.4,b.z+3.2);P.yaw=.75;camYaw=.75;camPitch=-.06;document.body.classList.remove('mounted');
 horse.rider=null;horse.load=null;horse.state='idle';horse.spd=0;horse.stam=1;const sh=world.town.sheriff;horse.pos.set(sh.x+4.5,0,sh.door.z+2);horse.pos.y=world.groundAt(horse.pos.x,horse.pos.z,99);horse.yaw=Math.PI/2;}
function setupRun(){G.D=DIFF[G.opt.diff];G.limit=G.opt.time*60;G.clock=G.limit;G.time=0;G.stats={shots:0,hits:0,heads:0,kills:0,ties:0,deKills:0,civ:0,disarm:0};G.gangPay=0;G.honour=50;G.outcome='';G.phase='';G.peace=false;G.de={on:false,marks:[],firing:false,fireT:0};G.timeScale=1;G.result=null;G.hurt=0;
 clearContract();resetPlayer();spawnTown();hudDirty=true;}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);delete G.opt.contract;saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setMusic(G.opt.mus);
 setupRun();$('menu').hidden=$('keys').hidden=$('over').hidden=$('pause').hidden=true;document.body.classList.remove('over');document.body.classList.add('playing');
 if(o.contract!=null)chooseContract(o.contract);else{G.app='board';$('board').hidden=false;I.unlock();drawPosters();}}
function chooseContract(ci){setupContract(ci);G.app='play';$('board').hidden=true;$('hud').hidden=false;$('lock').hidden=false;I.lock();snd.music(G.opt.mus>0);snd.setMode('explore');snd.play('click');
 banner('CONTRACT ACCEPTED',`${G.contract.leader} · LAST SEEN IN ${G.contract.area.toUpperCase()}`,'#f2e4c4',3.4);setTimeout(()=>snd.play('money'),200);hudDirty=true;}
function complete(outcome){if(G.app!=='play'||G.phase==='end')return;G.outcome=outcome;G.phase='end';G.endT=0;if(G.de.on||G.de.firing)exitDeadEyeQuiet();if(G.duel)endDuel('other');
 const ok=outcome==='alive'||outcome==='dead';if(ok){snd.play('money');snd.play('strum',null,1,1);banner(outcome==='alive'?'BOUNTY COLLECTED':'BOUNTY CLAIMED',outcome==='alive'?`${G.contract.short} BROUGHT IN ALIVE`:`${G.contract.short} · DEAD`,'#e8b45a',3);if(outcome==='alive'&&leader){leader.hidden=true;leader.rig.root.visible=false;if(horse.load===leader)horse.load=null;if(P.carry===leader)P.carry=null;}}
 else{snd.play('fail');banner(outcome==='time'?'SUNDOWN':'YOU DIED',outcome==='time'?'THE CONTRACT EXPIRED':'THE FRONTIER CLAIMS ANOTHER','#d9572b',3);}snd.music(false);}
function playerDown(){P.alive=false;P.state='dead';if(P.mounted){const h=P.mounted;P.mounted=null;h.rider=null;h.spd=0;h.state='idle';P.yOff=0;placeOnGround(P,h.pos.x-Math.cos(h.yaw)*1.4,h.pos.z+Math.sin(h.yaw)*1.4);}complete('died');}
let lastAward=null;
function showOver(){G.app='over';I.unlock();$('hud').hidden=true;$('lock').hidden=true;$('fullmap').hidden=true;document.body.classList.remove('playing','cine','mounted');document.body.classList.add('over');
 const o=G.outcome,ok=o==='alive'||o==='dead',C=G.contract,D=G.D,s=G.stats;const bounty=ok?Math.round(C.bounty*D.bounty*(o==='alive'?1:.5)):0,gang=G.gangPay,hon=cl(Math.round(G.honour),0,100);
 const honB=ok?Math.round((hon-50)*1.6):0,timeB=ok?Math.round(G.clock*.25):0,total=Math.max(0,bounty+gang+honB+timeB);
 const acc=s.shots?Math.round(s.hits/s.shots*100):0;const won=ok;const tok=5+Math.min(60,total/20|0);addRound(tok,won);saveBest(ID,total);
 lastAward={pts:total,outcome:o,bounty,gang,acc,honour:hon,diff:D.n.toLowerCase(),contract:C.leader,kills:s.kills,ties:s.ties};G.result=lastAward;G.money=total;
 $('oeye').textContent=`${C.gang} · ${D.n} OUTLAWS · ${G.opt.time} MIN`;$('ores').textContent=o==='alive'?'BOUNTY COLLECTED · ALIVE':o==='dead'?'BOUNTY CLAIMED · DEAD':o==='time'?'SUNDOWN · CONTRACT EXPIRED':'YOU DIED';
 $('ocash').textContent='$'+total;const used=G.limit-G.clock;
 $('ostats').innerHTML=[['BOUNTY','$'+bounty],['GANG PAY','$'+gang],['HONOUR BONUS',(honB>=0?'+$':'-$')+Math.abs(honB)],['ACCURACY',acc+'%'],['HEADSHOTS',s.heads],['DEAD EYE KILLS',s.deKills],['OUTLAWS KILLED',s.kills],['OUTLAWS HOGTIED',s.ties],['TIME',fmt(used)]].map(([k,v])=>`<div><span>${k}</span><b>${v}</b></div>`).join('');
 $('ohoni').style.left=hon+'%';$('ohonn').textContent=hon>=80?'HONOURABLE':hon>=60?'GOOD':hon>=40?'NEUTRAL':hon>=20?'SHADY':'OUTLAW';$('otok').textContent=`+${tok} TOKENS · ${total} PTS · BEST ${bestScore(ID)} PTS${s.civ?' · '+s.civ+' CIVILIAN'+(s.civ>1?'S':'')+' HARMED':''}`;
 const lead=o==='alive'?'CAPTURED':o==='dead'?'DECEASED':'AT LARGE';$('opost').innerHTML='';$('opost').appendChild(posterEl(G.ci,lead));$('over').hidden=false;}
function toMenu(){G.app='menu';I.unlock();clearContract();setupRun();$('menu').hidden=$('keys').hidden=false;$('over').hidden=$('pause').hidden=$('hud').hidden=$('board').hidden=$('lock').hidden=true;$('fullmap').hidden=true;
 document.body.classList.remove('playing','over','cine','mounted');snd.music(false);showBest();
 // attract: rider by the saloon at golden hour
 placeOnGround(P,-30,3.6);P.yaw=-Math.PI/2+.4;horse.pos.set(-27.5,0,4.6);horse.pos.y=world.groundAt(horse.pos.x,horse.pos.z,99);horse.yaw=-Math.PI/2-.1;P.wpn='revolver';}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;$('lock').hidden=true;document.body.classList.remove('playing');I.unlock();}else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');I.lock();}}
function best(){return bestScore(ID);}
function showBest(){seg.sync();const b=best();$('best').textContent=b?`YOUR BEST · ${b} PTS`:'';}

/* ================= posters ================= */
function portrait(ci,cv){const C=CONTRACTS[ci],o=look({...LOOKS.leader[C.lk]}),x=cv.getContext('2d'),w=cv.width,h=cv.height,hex=c=>'#'+new THREE.Color(c).getHexString();
 const g=x.createRadialGradient(w/2,h*.4,10,w/2,h*.5,w*.8);g.addColorStop(0,'#d8c49a');g.addColorStop(1,'#8a6a44');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.fillStyle=hex(o.coat||o.shirt);x.beginPath();x.moveTo(w*.08,h);x.quadraticCurveTo(w*.1,h*.7,w*.32,h*.66);x.lineTo(w*.68,h*.66);x.quadraticCurveTo(w*.9,h*.7,w*.92,h);x.fill();if(o.poncho){x.fillStyle=hex(o.poncho);x.beginPath();x.moveTo(w*.06,h);x.lineTo(w*.5,h*.62);x.lineTo(w*.94,h);x.fill();x.strokeStyle='#e0c890';x.lineWidth=4;for(let i=0;i<3;i++){x.beginPath();x.moveTo(w*(.18+i*.02),h*(.95-i*.04));x.lineTo(w*(.82-i*.02),h*(.95-i*.04));x.stroke();}}
 x.fillStyle=hex(o.shirt);x.beginPath();x.moveTo(w*.4,h*.66);x.lineTo(w*.5,h*.86);x.lineTo(w*.6,h*.66);x.fill();x.fillStyle=hex(o.kerch);x.beginPath();x.moveTo(w*.38,h*.64);x.lineTo(w*.62,h*.64);x.lineTo(w*.5,h*.78);x.fill();
 x.fillStyle=hex(o.skin);x.fillRect(w*.43,h*.52,w*.14,h*.14);x.beginPath();x.ellipse(w*.5,h*.44,w*.15,h*.17,0,0,7);x.fill();
 if(o.long){x.fillStyle=hex(o.hair);x.beginPath();x.ellipse(w*.5,h*.5,w*.2,h*.2,0,Math.PI*1.05,Math.PI*1.95,true);x.fill();}
 x.fillStyle='#1a120c';for(const s of[-1,1]){x.beginPath();x.ellipse(w*(.5+s*.06),h*.43,w*.018,h*.012,0,0,7);x.fill();x.fillRect(w*(.5+s*.06)-w*.035,h*.395,w*.07,h*.012);}
 x.fillStyle='rgba(60,30,20,.5)';x.fillRect(w*.47,h*.47,w*.06,h*.04);if(o.stache){x.fillStyle=hex(o.hair);x.beginPath();x.ellipse(w*.5,h*.515,w*.07,h*.016,0,0,7);x.fill();}x.fillStyle='#3a1a10';x.fillRect(w*.46,h*.54,w*.08,h*.008);
 x.fillStyle=hex(o.hat);x.beginPath();x.ellipse(w*.5,h*.3,w*.33,h*.05,0,0,7);x.fill();x.beginPath();x.moveTo(w*.34,h*.3);x.quadraticCurveTo(w*.33,h*.12,w*.43,h*.12);x.quadraticCurveTo(w*.5,h*.16,w*.57,h*.12);x.quadraticCurveTo(w*.67,h*.12,w*.66,h*.3);x.fill();x.fillStyle=hex(o.band);x.fillRect(w*.345,h*.255,w*.31,h*.03);
 const im=x.getImageData(0,0,w,h),d=im.data;for(let i=0;i<d.length;i+=4){const n=(Math.random()-.5)*26;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}x.putImageData(im,0,0);}
function posterEl(ci,stamp){const C=CONTRACTS[ci],D=DIFF[G.opt.diff],el=document.createElement('div');el.className='poster';el.style.setProperty('--r',C.rot);const cv=document.createElement('canvas');cv.width=208;cv.height=190;portrait(ci,cv);
 el.innerHTML=`<h4>WANTED</h4><p class="da">DEAD OR ALIVE</p>`;el.appendChild(cv);el.insertAdjacentHTML('beforeend',`<p class="nm">${C.leader}</p><p class="gg">${C.gang}</p><p class="rw">$${Math.round(C.bounty*D.bounty)}</p><p class="cr">${C.crime}</p><p class="lc">LAST SEEN · ${C.area.toUpperCase()}</p>${stamp?`<div class="stamp">${stamp}</div>`:''}`);return el;}
function drawPosters(){const host=$('posters');host.innerHTML='';CONTRACTS.forEach((c,i)=>{const el=posterEl(i);el.onclick=()=>chooseContract(i);host.appendChild(el);});}

/* ================= main step ================= */
let recoil=0,hudDirty=true,msgT=0,banT=0;
function step(dt){dt=Math.min(dt,.05);
 if(G.app==='paused'||G.app==='over'||G.app==='menu'||G.app==='board'){I.flush();if(G.app!=='paused'){G.time+=dt;stepTrain(dt);stepTown(dt);if(horse)stepHorse(horse,dt);}visuals(dt);return;}
 readInput(dt);const sdt=dt*G.timeScale;G.time+=sdt;
 if(G.phase!=='end'){G.clock-=dt;if(G.clock<=0){G.clock=0;complete('time');}}
 if(P.alive&&G.phase!=='end'){if(P.inp.call)callHorse();interact();stepPlayer(sdt);}
 if(P.tieT>0){P.tieT-=dt;if(P.tieT<=0)finishTie(P.tieA);}
 stepDuel(dt);stepDeadEye(dt);stepLasso(sdt);stepBandits(sdt);stepTown(sdt);if(horse&&!horse.rider)stepHorse(horse,sdt);stepTrain(sdt);
 if(camp&&!G.campFound&&Math.hypot(P.pos.x-camp.x,P.pos.z-camp.z)<95)campFound();
 if(G.combatT&&G.time-G.combatT>14&&!bandits.some(b=>b.alive&&b.state==='fight'&&b.ai&&b.ai.sees)){G.combatT=0;if(!G.duel)snd.setMode('explore');}
 if(G.phase==='end'){G.endT+=dt;G.timeScale=G.endT<1.6&&G.outcome==='died'?.35:1;if(G.endT>3.4){G.timeScale=1;showOver();}}
 visuals(sdt,dt);}

/* ================= camera ================= */
let camYaw=0,camPitch=0,curFov=66,camInit=true;const camPos=new V(),camLook=new V();
function focusPos(){return G.app==='menu'?tv3.set(-20,T0,3):P?P.pos:null;}
function camBlock(from,to){const d=tv2.subVectors(to,from);const L=d.length();if(L<.01)return to;d.divideScalar(L);const h=world.ray(from,d,L);if(h&&h.t<L){to.copy(from).addScaledVector(d,Math.max(.3,h.t-.3));}return to;}
function cameras(dt){let fov=66;const k=1-Math.exp(-dt*10);
 if(G.app==='menu'){const t=G.time*.04;camera.position.set(32+Math.sin(t)*5,T0+2.1+Math.sin(t*.7)*.25,1.2+Math.sin(t*.5)*1.2);camera.lookAt(-40,T0+3.4,1.5+Math.sin(t*.3)*2);camera.fov=46;camera.updateProjectionMatrix();return;}
 if(G.app==='board'){const b=world.town.board;camera.position.set(b.x+.6,b.y+.5,b.z+4.8);camera.lookAt(b.x,b.y,b.z);camera.fov=50;camera.updateProjectionMatrix();return;}
 if(!P)return;const D=G.duel;
 if(D&&D.stage==='setup'){const a=D.a,mx=(P.pos.x+a.pos.x)/2,mz=(P.pos.z+a.pos.z)/2,dx=a.pos.x-P.pos.x,dz=a.pos.z-P.pos.z,d=Math.hypot(dx,dz),sx=-dz/d,sz=dx/d;camera.position.set(mx+sx*9,P.pos.y+1.2,mz+sz*9);camera.lookAt(mx,P.pos.y+1.3,mz);camera.fov=lerp(55,38,cl(D.t/1.6,0,1));camera.updateProjectionMatrix();camInit=true;return;}
 const ads=P.aim&&P.alive;let dist,sh,up,pv=1.55;if(P.mounted){dist=ads?3.3:6.2;sh=ads?.75:.35;up=ads?.25:.7;pv=2.5;fov=ads?(P.wpn==='rifle'?40:52):66+cl(P.mounted.spd-8,0,6);}else{dist=ads?(P.wpn==='rifle'?1.5:1.9):3.5;sh=ads?.62:.55;up=ads?.12:.28;fov=ads?(P.wpn==='rifle'?36:50):66;if(P.carry){dist=3.9;sh=.8;}}
 if(D&&D.stage!=='setup'){dist=D.stage==='draw'?1.7:2.4;sh=.62;up=.08;fov=D.stage==='draw'?44:50;}
 if(!P.alive){dist=5;sh=0;up=1.5;}
 const cy=Math.cos(camPitch),fwd=tv.set(Math.sin(camYaw)*cy,Math.sin(camPitch),Math.cos(camYaw)*cy),right=tv3.set(-Math.cos(camYaw),0,Math.sin(camYaw));
 const base=P.mounted?P.mounted.pos:P.pos,pivot=new V(base.x,base.y+pv,base.z).addScaledVector(right,sh*.4);const want=new V().copy(pivot).addScaledVector(fwd,-dist).addScaledVector(right,sh*.6);want.y+=up;
 camBlock(pivot,want);const wg=world.heightAt(want.x,want.z)+.4;if(want.y<wg)want.y=wg;
 if(camInit){camPos.copy(want);camInit=false;}else camPos.lerp(want,P.mounted?Math.min(1,dt*14):1);camera.position.copy(camPos);camLook.copy(camPos).addScaledVector(fwd,10);camera.lookAt(camLook);
 if(!P.mounted&&P.inp.sprint&&Math.hypot(P.vel.x,P.vel.z)>5)fov+=5;
 if(recoil>0){camPitch+=recoil*.5;recoil*=Math.exp(-dt*16);if(recoil<.001)recoil=0;}
 G.shake=Math.max(0,G.shake-dt*2);if(G.shake>0){const s=G.shake*G.shake*.12;camera.position.x+=(Math.random()-.5)*s;camera.position.y+=(Math.random()-.5)*s;camera.position.z+=(Math.random()-.5)*s;}
 curFov+=(fov-curFov)*Math.min(1,dt*10);camera.fov=curFov;camera.updateProjectionMatrix();}

/* ================= visuals ================= */
const FARC=new THREE.Color(.55,.42,.5).convertSRGBToLinear();const SUNC=[new THREE.Color(1,.9,.76),new THREE.Color(1,.52,.26)],SKYC=[new THREE.Color(.78,.84,.98),new THREE.Color(.62,.5,.62)],GRC=[new THREE.Color(.62,.44,.3),new THREE.Color(.42,.26,.2)],HOR=[new THREE.Color(.93,.8,.62).convertSRGBToLinear().multiplyScalar(1.25),new THREE.Color(1,.56,.3).convertSRGBToLinear().multiplyScalar(1.25)],TOP=[new THREE.Color(.19,.39,.72),new THREE.Color(.17,.2,.42)];
const sunDir=new V(),_c=new THREE.Color();
function lighting(){const u=G.app==='menu'||G.app==='board'?.6:cl(.06+(1-G.clock/G.limit)*.9,0,1);G.dusk=u;world.setTime(u);const el=lerp(.46,.06,u),az=-2.7+u*.25;sunDir.set(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az)).normalize();
 world.skyU.uSun.value.copy(sunDir);world.skyU.uDusk.value=u;world.waterU.uSun.value.copy(sunDir);sun.color.copy(SUNC[0]).lerp(SUNC[1],u);sun.intensity=lerp(2.7,1.7,u*u);hemi.color.copy(SKYC[0]).lerp(SKYC[1],u);hemi.groundColor.copy(GRC[0]).lerp(GRC[1],u);hemi.intensity=lerp(1.05,.62,u);
 const hor=_c.copy(HOR[0]).lerp(HOR[1],u);scene.fog.color.copy(hor).multiplyScalar(.92);scene.fog.near=lerp(240,160,u);scene.fog.far=lerp(1600,1100,u);world.waterU.uFogC.value.copy(scene.fog.color);world.waterU.uFogN.value=scene.fog.near;world.waterU.uFogF.value=scene.fog.far;world.waterU.uHor.value.copy(hor);world.waterU.uSky.value.copy(TOP[0]).lerp(TOP[1],u);
 world.farU.uC.value.copy(hor).lerp(FARC,.35+u*.2);world.farU.uC2.value.copy(hor).multiplyScalar(.9);
 const f=focusPos()||tv3.set(0,T0,0);sun.target.position.set(f.x,f.y,f.z);sun.position.copy(f).addScaledVector(sunDir,320);if(fxStack&&fxStack.grade){fxStack.grade.uniforms.tint.value.setRGB(1.03+u*.04,.99-u*.02,.92-u*.06);}}
const ropeGeo=new THREE.BufferGeometry().setFromPoints(Array.from({length:16},()=>new V())),rope=new THREE.Line(ropeGeo,new THREE.LineBasicMaterial({color:0xc8a870}));rope.frustumCulled=false;rope.visible=false;scene.add(rope);
const loopM=new THREE.Mesh(new THREE.TorusGeometry(.7,.025,5,24),new THREE.MeshStandardMaterial({color:0xc8a870,roughness:.8}));loopM.visible=false;scene.add(loopM);
function animActor(a,dt){const r=a.rig;if(a.hidden){r.root.visible=false;return;}r.root.visible=true;
 if(a.state==='carried'&&a===P?.carry){const s=P.rig.spine.getWorldPosition(tv),cy=Math.cos(P.yaw),sy=Math.sin(P.yaw);r.root.position.set(s.x-cy*.95-sy*.22,s.y+.42,s.z+sy*.95-cy*.22);r.root.rotation.y=P.yaw+Math.PI/2;}
 else if(a.state==='draped'&&horse&&horse.load===a){horse.rig.back.getWorldPosition(tv);const cy=Math.cos(horse.yaw),sy=Math.sin(horse.yaw);r.root.position.set(tv.x-cy*.95,tv.y+.12,tv.z+sy*.95);r.root.rotation.y=horse.yaw+Math.PI/2;r.root.rotation.x=0;}
 else if(a===P&&P.mounted){const h=P.mounted.rig;h.seat.getWorldPosition(tv);r.root.position.set(tv.x,tv.y-.93,tv.z);r.root.rotation.y=P.mounted.yaw;}
 else{r.root.position.copy(a.pos);r.root.rotation.y=a.yaw;}
 const fx=Math.sin(a.yaw),fz=Math.cos(a.yaw),lvz=a.vel.x*fx+a.vel.z*fz,lvx=-(a.vel.x*-fz+a.vel.z*fx);
 let hk=a.hold;if(a===P){hk=P.carry?'carry':P.wpn;}if(a.kind==='town')hk='';const pose=a===P?(P.mounted?'ride':G.duel?'duel':''):a.pose;
 const st={pose,speed:a===P&&P.mounted?0:Math.hypot(a.vel.x,a.vel.z),lvx,lvz,pitch:a.pitch,hold:hk==='carry'?'carry':hk,fire:a.fireVis,aim:a===P?(P.aim||G.de.on||G.de.firing||G.duel&&G.duel.stage==='draw'):a.aim,dead:!a.alive,ground:a.ground,bounce:a===P&&P.mounted?P.mounted.rig.bounce:0,twist:a===P&&P.mounted&&P.aim?cl(angDiff(P.mounted.yaw,camYaw),-1.4,1.4):0};
 if(a===P&&G.duel&&G.duel.stage!=='draw'){st.hold='';st.aim=false;}
 if(a===P&&!P.aim&&!G.de.on&&P.wpn!=='lasso'&&!P.carry&&P.cd<-.8&&!G.duel)st.hold='';
 hold(r,st.hold==='revolver'||st.hold==='rifle'||st.hold==='lasso'?st.hold:'');animRig(r,st,dt,G.time);
 if(!a.alive&&r.die>=1&&a!==P&&G.time-a.hitT>30)r.root.visible=a.pos.distanceTo(camera.position)<120;
 if(a.alive&&a.ground&&st.speed>2.5&&a!==P){a.stepT-=dt*st.speed;if(a.stepT<=0){a.stepT=1.8;snd.play('step',a.pos,.7);}}}
function visuals(dt,rdt=dt){lighting();world.update(dt,G.time,camera.position);parts.update(dt);smoke.update(dt);tracers.update(dt,camera);flashes.update(dt);
 for(const a of actors)animActor(a,dt);
 for(const h of[horse,...campHorses]){if(!h)continue;h.rig.root.position.copy(h.pos);h.rig.root.rotation.y=h.yaw;{const c=camera.position;h.rig.root.visible=h.rider===P||Math.hypot(c.x-h.pos.x,c.z-h.pos.z)>2.1||c.y>h.pos.y+2.4;}if(!h.rider&&h.spd<.2){h.eatT-=dt;}animHorse(h.rig,{speed:h.spd,turn:h.turn||0,eat:!h.rider&&h.spd<.2&&Math.sin(G.time*.15+h.eatT)>.3,slope:h.slope||0},dt,G.time);}
 // campfire, embers, smoke column
 if(camp){const f=world.fires[G.contract.camp],d=Math.hypot(f.x-camera.position.x,f.z-camera.position.z);fireLight.intensity=(G.dusk*30+12)*(.85+Math.random()*.3)*(d<160?1:0);
  if(d<220&&Math.random()<dt*40)parts.emit(f.x+(Math.random()-.5)*.6,f.y-.1,f.z+(Math.random()-.5)*.6,(Math.random()-.5)*.4,1.4+Math.random()*1.6,(Math.random()-.5)*.4,2.6,1.1,.3,.35+Math.random()*.3,.5+Math.random()*.4,-.5,1);
  if(d<220&&Math.random()<dt*6)parts.emit(f.x,f.y,f.z,(Math.random()-.5),3+Math.random()*3,(Math.random()-.5),2.6,1.4,.4,.05,1.6,1,.3);
  if(Math.random()<dt*(d<700?7:2))smoke.emit(f.x+(Math.random()-.5)*.6,f.y+1.2,f.z+(Math.random()-.5)*.6,WIND.x*.6+(Math.random()-.5)*.4,2.2+Math.random(),WIND.z*.6+(Math.random()-.5)*.4,.5,.46,.44,1.2,11,-.05,.15,4.5);
  if(d<300&&Math.random()<dt*2)snd.play('pop',f);}
 // rope + flying loop
 const L=G.lassoFx,rp=G.rope;if(rp||L){const from=P.rig.handR.getWorldPosition(new V());let to;if(rp){to=rp.a.rig.spine.getWorldPosition(new V());}else{const k=Math.min(1,L.t/.32);to=from.clone().lerp(L.to,k);to.y+=Math.sin(k*Math.PI)*1.2;loopM.visible=true;loopM.position.copy(to);loopM.rotation.set(Math.PI/2,0,G.time*20);}
  const pa=ropeGeo.attributes.position,dd=from.distanceTo(to),sag=rp?Math.max(0,13-dd)*.12:0;for(let i=0;i<16;i++){const t=i/15;tv.lerpVectors(from,to,t);tv.y-=Math.sin(t*Math.PI)*sag;pa.setXYZ(i,tv.x,tv.y,tv.z);}pa.needsUpdate=true;rope.visible=true;if(!L)loopM.visible=false;}else{rope.visible=false;loopM.visible=false;}
 prints.visible=!!camp&&G.app==='play';
 stepAmbient(rdt);cameras(rdt);
 if(snd.ac){const f=focusPos()||camera.position;const[dr]=[Math.abs(world.heightAt(f.x,f.z)-WATER)];const near=WATER-world.heightAt(f.x+3,f.z)>-1.5||WATER-world.heightAt(f.x-3,f.z)>-1.5||WATER-world.heightAt(f.x,f.z+3)>-1.5;
  const fd=camp?Math.hypot(world.fires[G.contract.camp].x-f.x,world.fires[G.contract.camp].z-f.z):999;snd.amb(G.app==='menu'?.4:.6+Math.sin(G.time*.2)*.3,near?1:0,cl(1-fd/30,0,1),smooth(.55,.9,G.dusk));snd.listener(camera.position.x,camera.position.y,camera.position.z,Math.atan2(-(camLook.x-camera.position.x),-(camLook.z-camera.position.z))*0+camYaw+Math.PI);snd.tick();}
 hud(rdt);}

/* ================= HUD ================= */
const mini=$('mini').getContext('2d'),fullC=$('fullmapc'),full=fullC.getContext('2d');let hudT=0,feedT=0;
function banner(t,s,col='#f2e4c4',dur=2.5){$('bt').textContent=t;$('bt').style.color=col;$('bs').textContent=s||'';$('bs').style.display=s?'':'none';$('banner').classList.add('on');banT=dur;}
function prompt(t,dur=1.4){$('prompt').innerHTML=t;$('prompt').style.opacity=1;msgT=dur;}
function feed(t,cls){const d=toast($('feed'),t,5000,5,false);if(cls)d.className=cls;}
const core=(id,v,low)=>{const e=$(id);e.querySelector('.v').style.strokeDashoffset=100.5*(1-cl(v,0,1));e.classList.toggle('low',!!low);};
function hud(dt){if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}if(msgT>0)msgT-=dt;if(hmT>0){hmT-=dt;if(hmT<=0)$('hitm').className='';}
 G.hurt=Math.max(0,(G.hurt||0)-dt*.8);$('dmg').style.opacity=G.app==='play'?Math.max(G.hurt,P&&P.alive&&P.hp<35?(1-P.hp/35)*.6*(.7+.3*Math.sin(G.time*5)):0):0;
 if(G.app!=='play'&&G.app!=='paused')return;
 // crosshair
 const cr=$('cross');let foe=false;if(P.alive){const o=camera.position,f=camFwd(new V()),h=rayActors(o,f,P.wpn==='lasso'?24:160,P);foe=!!(h&&h.a.kind!=='town'&&h.a.alive);G.aimFoe=foe;}
 cr.className=(foe?'foe ':'')+(P.aim?'aim ':'')+(P.wpn==='lasso'?'lasso ':'')+(P.mounted&&!P.aim&&!G.de.on?'':'')+(G.duel&&G.duel.stage!=='draw'?'off':'');
 // dead eye marks
 const mk=$('marks');if(G.de.marks.length||mk.childElementCount){let html='';for(const m of G.de.marks){tv.copy(m.a.pos).add(m.off).project(camera);if(tv.z<1)html+=`<i style="left:${(tv.x*.5+.5)*100}%;top:${(-tv.y*.5+.5)*100}%"></i>`;}mk.innerHTML=html;}
 hudT-=dt;if(hudT>0&&!hudDirty)return;hudT=.1;hudDirty=false;
 const t=Math.ceil(G.clock);$('clock').textContent=fmt(t);$('clockw').classList.toggle('warn',t<=60);
 core('cH',P.hp/100,P.hp<35);core('cS',P.mounted?P.stam:P.stam,P.tired);core('cD',P.de,P.de<.12);if(horse)core('cHS',horse.stam,horse.tired);
 $('honi').style.left=cl(G.honour,0,100)+'%';$('money').textContent='$'+(G.gangPay||0);
 // weapon
 const w=P.wpn,d=WPN[w];$('wname').textContent=P.carry?'CARRYING':d.n;document.querySelectorAll('#wsel span').forEach(s=>s.classList.toggle('on',s.dataset.w===w));
 if(w==='lasso'){$('mag').textContent='∞';$('res').textContent='';$('cyl').innerHTML='';}else{const am=P.ammo[w];$('mag').textContent=am.mag;$('res').textContent='/ '+am.res;let s='<circle class="rim" cx="30" cy="30" r="26"/>';const n=d.mag;for(let i=0;i<n;i++){const a=i/n*Math.PI*2-Math.PI/2,R=n>6?20:16;s+=`<circle class="${i<am.mag?'full':''}" cx="${30+Math.cos(a)*R}" cy="${30+Math.sin(a)*R}" r="${n>6?4.5:6}"/>`;}$('cyl').innerHTML=s;}
 $('gait').textContent=P.mounted?gaitOf(P.mounted.spd)+(P.mounted.tired?' · WINDED':''):'';
 // contract card
 const C=G.contract;if(C){$('jgang').textContent=C.gang;$('jlead').textContent=C.leader;let obj;const gang=bandits.filter(b=>b!==leader),left=gang.filter(b=>b.alive&&b.state!=='tied').length;
  if(G.phase==='end')obj='';else if(G.deliver)obj=leader&&!leader.alive?(G.proof?'Ride back to Dustwater and claim the bounty from the sheriff.':`Take proof from ${C.short}'s body.`):(P.carry===leader?'Put him on your horse — or carry him to the sheriff.':horse&&horse.load===leader?'Deliver him to the sheriff\'s office in Dustwater.':`${C.short} is hogtied — pick him up.`);
  else if(!G.campFound)obj=`Track the gang to ${C.area}. Follow the hoof prints out of town — or look for campfire smoke.`;else if(leader.state==='standoff')obj=`${C.short} wants a duel. Press F — or take him by force.`;else if(leader.state==='hands'||leader.state==='roped')obj=`${C.short} is helpless — hogtie him (E).`;else obj=left?`Take down the gang: ${left} gun${left>1?'s':''} left. ${C.short} pays double alive.`:`Bring in ${C.short}. Alive pays $${Math.round(C.bounty*G.D.bounty)}, dead half.`;
  $('jobj').textContent=obj;$('jcount').innerHTML=bandits.map(b=>`<i class="${b===leader?'L ':''}${!b.alive?'k':b.state==='tied'?'t':''}"></i>`).join('');}
 drawMini();}
function drawMini(){const c=mini,S=220,W=world,sc=W.mapScale,z=1.5;c.save();c.clearRect(0,0,S,S);c.beginPath();c.arc(S/2,S/2,S/2,0,7);c.clip();c.fillStyle='#7a5a3a';c.fillRect(0,0,S,S);
 c.translate(S/2,S/2);c.rotate(camYaw+Math.PI);const px=(P.pos.x+EXT)*sc,pz=(P.pos.z+EXT)*sc;c.scale(z,z);c.drawImage(W.map,-px,-pz);
 const M2=(x,y)=>[(x+EXT)*sc-px,(y+EXT)*sc-pz];c.lineWidth=1.2/z;
 if(camp&&!G.deliver){if(G.campFound){const[x,y]=M2(camp.x,camp.z);c.fillStyle='#d8301a';c.beginPath();c.arc(x,y,4,0,7);c.fill();}else{const[x,y]=M2(G.search.x,G.search.z);c.fillStyle='rgba(216,60,26,.18)';c.strokeStyle='rgba(216,60,26,.8)';c.beginPath();c.arc(x,y,G.search.r*sc,0,7);c.fill();c.stroke();}}
 if(G.deliver||G.proof){const sh=world.town.sheriff;const[x,y]=M2(sh.x,sh.door.z);c.fillStyle='#ffd23f';c.beginPath();for(let i=0;i<10;i++){const a=i/10*6.283,r=i%2?2.4:6;c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}c.fill();}
 for(const b of bandits){if(!b.alive||b.state==='carried'||b.state==='draped')continue;if(b.state!=='fight'&&b.state!=='standoff'&&b.pos.distanceTo(P.pos)>40)continue;const[x,y]=M2(b.pos.x,b.pos.z);c.fillStyle=b===leader?'#ff6a1a':'#e02a1a';c.beginPath();c.arc(x,y,2.4,0,7);c.fill();}
 if(horse&&!P.mounted){const[x,y]=M2(horse.pos.x,horse.pos.z);c.fillStyle='#f2e4c4';c.strokeStyle='#2a1a10';c.beginPath();c.arc(x,y,3,0,7);c.fill();c.stroke();}
 {const t=train.cars[0].g.position,[x,y]=M2(t.x,t.z);c.fillStyle='#1a1a1a';c.fillRect(x-2.5,y-2.5,5,5);}
 c.restore();c.save();c.translate(S/2,S/2);c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=1.5;c.rotate(-(P.mounted?P.mounted.yaw:P.yaw)+camYaw);c.beginPath();c.moveTo(0,-8);c.lineTo(5.5,6);c.lineTo(0,3);c.lineTo(-5.5,6);c.closePath();c.fill();c.stroke();c.restore();
 // compass N
 c.save();c.translate(S/2,S/2);c.rotate(camYaw+Math.PI);c.fillStyle='#f2e4c4';c.font='700 13px JetBrains Mono, monospace';c.textAlign='center';c.textBaseline='middle';c.fillText('N',0,-S/2+12);c.restore();}
function drawFull(){const c=full,S=fullC.width,W=world;c.clearRect(0,0,S,S);c.drawImage(W.map,0,0,S,S);const k=S/(2*EXT),P2=(x,z)=>[(x+EXT)*k,(z+EXT)*k];
 c.font='400 15px Anton, Impact, sans-serif';c.textAlign='center';c.fillStyle='rgba(40,20,10,.9)';c.fillText('DUSTWATER',...P2(0,-24));
 if(camp){if(G.campFound){const[x,y]=P2(camp.x,camp.z);c.fillStyle='#d8301a';c.beginPath();c.arc(x,y,6,0,7);c.fill();c.fillStyle='rgba(40,20,10,.9)';c.fillText(camp.n,x,y-12);}else{const[x,y]=P2(G.search.x,G.search.z);c.strokeStyle='rgba(216,60,26,.9)';c.fillStyle='rgba(216,60,26,.15)';c.lineWidth=2;c.beginPath();c.arc(x,y,G.search.r*k,0,7);c.fill();c.stroke();}}
 if(horse){const[x,y]=P2(horse.pos.x,horse.pos.z);c.fillStyle='#f2e4c4';c.beginPath();c.arc(x,y,4,0,7);c.fill();}
 const[x,y]=P2(P.pos.x,P.pos.z);c.fillStyle='#ff4d00';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.arc(x,y,6,0,7);c.fill();c.stroke();}
setInterval(()=>{if(!$('fullmap').hidden&&G.app==='play')drawFull();},400);

/* ================= rendering ================= */
const WestShader={uniforms:{tDiffuse:{value:null},uDE:{value:0},uT:{value:0},uHaze:{value:0},uHor:{value:.5}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uDE,uT,uHaze,uHor;varying vec2 vUv;
 void main(){vec2 uv=vUv;float hb=exp(-pow((uv.y-uHor)*16.,2.))*uHaze;uv.x+=(sin(uv.y*240.+uT*7.)*.0008+sin(uv.y*83.-uT*4.3)*.0005)*hb;uv.y+=sin(uv.x*130.+uT*5.)*.0004*hb;
  vec3 c=texture2D(tDiffuse,uv).rgb;float l=dot(c,vec3(.3,.59,.11));c=mix(c,c*vec3(1.05,1.,.9)+vec3(.015,.008,0.),.55);c=mix(vec3(l),c,1.04);
  if(uDE>0.){vec3 sep=vec3(l*1.2,l*.93,l*.6);vec2 d=vUv-.5;float v=smoothstep(.15,.75,length(d)*1.25);sep*=1.-v*.55;sep=mix(sep,sep*vec3(1.25,.6,.3),v*.7);float scan=.96+.04*sin(vUv.y*900.);c=mix(c,sep*scan,uDE*.9);}
  gl_FragColor=vec4(c,1.);}`};
const POST={exposure:1.0,bloom:.42,bloomThreshold:.86,bloomRadius:.5,vignette:.34,saturation:1.06,grain:.045,aoStrength:.75};
let fxStack=null,gfx=quality(),westPass=null,deK=0;
function applyQuality(q){gfx=q;fxStack=null;world.setQuality(q);sun.castShadow=q>0;sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}const s=q>=2?60:45;Object.assign(sun.shadow.camera,{left:-s,right:s,top:s,bottom:-s});sun.shadow.camera.updateProjectionMatrix();R.setPixelRatio(Math.min(devicePixelRatio,q===0?.85:q===1?1.1:1.5));}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio())){R.setSize(w,h,false);if(fxStack)fxStack.setSize(w,h);}
 camera.aspect=w/h;camera.updateProjectionMatrix();parts.U.uScale.value=smoke.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));
 if(!fxStack){fxStack=cinematic(R,scene,camera,{...POST,quality:gfx});westPass=null;if(fxStack.composer){westPass=new ShaderPass(WestShader);const ps=fxStack.composer.passes;fxStack.composer.insertPass(westPass,ps.indexOf(fxStack.grade)+1);}fxStack.setSize(w,h);const ao=fxStack.ao;if(ao&&world.field){const o=ao.overrideVisibility.bind(ao);ao.overrideVisibility=()=>{o();world.field.visible=false;};}}
 deK+=((G.de.on||G.de.firing?1:0)-deK)*.15;if(westPass){const U=westPass.uniforms;U.uDE.value=deK;U.uT.value=G.time;U.uHaze.value=(1-G.dusk*.8)*(gfx>=1?1:0)*cl((Math.hypot(camera.position.x,camera.position.z)-70)/80,0,1);camera.updateMatrixWorld();tv.set(camera.position.x+Math.sin(camYaw)*800,camera.position.y,camera.position.z+Math.cos(camYaw)*800).project(camera);U.uHor.value=cl(tv.y*.5+.5,-1,2);canvas.style.filter='';}
 else canvas.style.filter=deK>.05?`sepia(${(deK*.85).toFixed(2)}) contrast(1.1)`:'';
 fxStack.render();}
addEventListener('resize',()=>{if(fxStack)fxStack.setSize(innerWidth,innerHeight);fullC.width=fullC.height=Math.min(700,innerHeight*.86|0);});fullC.width=fullC.height=Math.min(700,innerHeight*.86|0);

/* ================= input + menus ================= */
const I=controls(canvas,{canLock:()=>G.app==='play',overlay:$('lock'),menu:()=>G.app==='play',onLock:(on,was)=>{if(was&&!on&&G.app==='play')pause(true);},
 onKey:e=>{if(['Space','Tab','KeyQ','KeyF','KeyM','KeyH'].includes(e.code)&&G.app==='play')e.preventDefault();if(e.code==='Escape'&&G.app==='paused')pause(false);if(e.code==='Escape'&&G.app==='board'){$('board').hidden=true;toMenu();}}});
const seg=pickers(G.opt,saveOpt),click=()=>{snd.init();snd.play('click');};
seg('o-diff','diff',true,click);seg('o-time','time',true,click);seg('o-mus','mus',true,v=>{click();snd.setMusic(v);});seg('o-sens','sens');seg('o-vol','vol',true,v=>snd.setVol(v));
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{pause(false);toMenu();};
postButton($('post'),ID,()=>{const a=lastAward||{};return[a.pts||0,`Game: Dustwater\nPoints: ${a.pts||0}\nContract: ${a.contract||''} · ${a.outcome||''}\nBounty: $${a.bounty||0} · Gang: $${a.gang||0}\nAccuracy: ${a.acc||0}% · Honour: ${a.honour||0}\nOutlaws: ${a.diff||''} · killed ${a.kills||0} · hogtied ${a.ties||0}`];});

/* ================= boot ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.DUSTWATER={get state(){return G.app==='play'?(G.phase||'play'):G.app;},get app(){return G.app;},step,render,start,toMenu,pause,chooseContract,G,world,scene,camera,R,snd,train,
 get player(){return P;},get horse(){return horse;},get bots(){return bandits;},get bandits(){return bandits;},get leader(){return leader;},get townsfolk(){return townsfolk;},get actors(){return actors;},get camp(){return camp;},get contract(){return G.contract;},
 get score(){return G.result?G.result.pts:G.gangPay||0;},get clock(){return G.clock;},setClock(s){G.clock=s;},get results(){return G.result;},get gfx(){return gfx;},setQuality:applyQuality,
 tp(x,z){if(P.mounted){P.mounted.pos.set(x,world.groundAt(x,z,99),z);}placeOnGround(P,x,z);camInit=true;},tpHorse(x,z){horse.pos.set(x,world.groundAt(x,z,99),z);},
 look(yaw,pitch=0){camYaw=yaw;camPitch=pitch;if(P)P.yaw=yaw;},aimAt(p,dy=0){for(let i=0;i<4;i++){cameras(0);const c=camera.position;const t=p.pos?new V(p.pos.x,p.pos.y+(p.yOff||0)+1.2+dy,p.pos.z):p;camYaw=Math.atan2(t.x-c.x,t.z-c.z);camPitch=Math.atan2(t.y-c.y,Math.hypot(t.x-c.x,t.z-c.z));P.yaw=camYaw;}cameras(0);camera.updateMatrixWorld();},
 input(o){G.inOv=o&&Object.keys(o).length?o:null;},press(o){G.inOnce=o;},mount,dismount,callHorse,startDuel,complete,setWeapon,toggleDeadEye,
 kill(a){if(a&&a.alive)damage(a,9999,P,{});},damage(a,n,src){damage(a,n,src===undefined?P:src,{});},freeze(on=true){G.peace=on;},alarm:()=>alarm(bandits[0],P.pos),
 lasso(a){G.rope={a,t:0};a.state='roped';a.pose='roped';if(a.ai)a.ai.state='roped';},tie(a){finishTie(a);},get rope(){return G.rope;},get duel(){return G.duel;},get de(){return G.de;}};
