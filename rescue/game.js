// BEACON RESCUE — a three-room rescue puzzle inside a storm-dark lighthouse. WICK, a small repair robot, carries batteries,
// plugs cables and sets counterweights to reach the lamp and light it before the storm clock runs out. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {makeTextures,plate} from './tex.js';
import {ROOMS,DOORS,SHUTTER,BOXES,Z0,Z1,roomAt,groundAt,levelData,SOLVED,buildWorld,buildExterior} from './world.js';
import {makeRobot,animRobot,makeKeeper,animKeeper,makeBattery,setCharge,makeWeight,makePlug,makeDock,makeCradle,makePan,makePortRing,outline,MAT} from './actors.js';
import {Sound} from './sound.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,toast,$} from '../js/kit3d/ui.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,ID='beaconrescue',SAVE='beaconrescue_save',PAID='beaconrescue_paid';
const mmss=s=>{s=Math.max(0,Math.ceil(s));return(s/60|0)+':'+String(s%60).padStart(2,'0');};
const angD=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
const DIFF=[{n:'EASY',clock:480,hint:2,mult:1,charge:1.0},{n:'NORMAL',clock:300,hint:1,mult:1.25,charge:1.6},{n:'HARD',clock:210,hint:0,mult:1.6,charge:2.2}];
const RAD=.32,SPEED=3.4,GALBOX=[33.5,37,Z0,Z1,-9,2.5];

/* ================= boot ================= */
try{await Promise.race([Promise.all([document.fonts.load('64px Anton'),document.fonts.load('20px "JetBrains Mono"')]),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
const canvas=$('c');const RR=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});RR.setPixelRatio(Math.min(devicePixelRatio,1.5));RR.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x05070c);
const cam=new THREE.PerspectiveCamera(50,1,.1,1200);
const T=makeTextures(),world=buildWorld(scene,T);let ext=null;
// a soft procedural environment so painted metal and brass catch light instead of going black
{const es=new THREE.Scene(),sky=new THREE.Mesh(new THREE.SphereGeometry(10,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){float y=normalize(vP).y;vec3 c=mix(vec3(.5,.32,.18),vec3(.16,.22,.36),smoothstep(-.3,.5,y));c+=vec3(1.,.7,.4)*smoothstep(.85,1.,normalize(vP).x)*.8;gl_FragColor=vec4(c,1.);}'}));es.add(sky);
 const pm=new THREE.PMREMGenerator(RR);scene.environment=pm.fromScene(es,.04).texture;pm.dispose();}
const snd=new Sound();
const G={app:'menu',mode:'play',view:'in',opt:{diff:1,vol:.8,fx:1},time:0,clock:300,clockMax:300,resets:0,hints:0,elapsed:0,room:0,latched:[false,false],run:'',flash:0,flashT:3,stuck:0,hintT:0,fin:0,result:null,route:'',vin:null,god:false,banner:0};
const saveOpt=stored('beaconrescue_opt',G.opt);

/* ================= the robot, the keeper, objects, devices ================= */
const robot=makeRobot();robot.scale.setScalar(1.12);robot.traverse(o=>{if(o.isMesh)o.castShadow=true;});outline(robot,1.08);scene.add(robot);
const blobM=new THREE.MeshBasicMaterial({map:T.blob,transparent:true,depthWrite:false});const blob=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1),blobM);blob.rotation.x=-Math.PI/2;scene.add(blob);
const keeper=outline(makeKeeper());keeper.position.set(36.3,3,1.7);keeper.rotation.y=-Math.PI/2-.3;scene.add(keeper);keeper.traverse(o=>{if(o.isMesh)o.castShadow=true;});
const P={pos:new V(),y:0,vy:0,yaw:Math.PI,vel:new V(),carry:null,speed:0,cheer:0};
const L=levelData(),TG={},OB={},CB={};
for(const t of L.T){const p=new V(...t.pos);let m;
 if(t.kind==='dock'){m=makeDock();m.position.set(p.x,p.y-.66,p.z);}else if(t.kind==='cradle'){m=makeCradle();m.position.set(p.x,p.y-.66,p.z);}
 else if(t.kind==='pan'){m=makePan();m.position.set(p.x,p.y-.08,p.z);}else{m=makePortRing(t.n);m.position.copy(p);m.lookAt(p.clone().add(new V(...t.n)));}
 scene.add(m);m.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});TG[t.id]=Object.assign({},t,{p,m,loaded:false});}
// small floating plates on the devices the world signs do not already name
for(const[id,txt,ic,dy]of[['K0','CELL','▣',.85],['D2','CHARGER','⚡',.85],['K2','LAMP CELL','▣',.85]]){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:plate(txt,ic),color:0xc8c0b0}));s.scale.set(.8,.4,1);s.position.copy(TG[id].p).add(new V(0,dy,0));scene.add(s);}
for(const o of L.O){const m=o.kind==='battery'?makeBattery():o.kind==='weight'?makeWeight():makePlug();m.traverse(q=>{if(q.isMesh)q.castShadow=true;});outline(m,1.08);scene.add(m);
 OB[o.id]=Object.assign({},o,{pos:new V(...o.spawn),in:null,carried:false,charge:0,vy:0,rec:0,yaw:Math.random()*6,m});}
// cables: a tube rebuilt in place each frame from a sagging curve between the two plugs
const CSEG=30,CRAD=7;
for(const c of L.C){const n=(CSEG+1)*(CRAD+1),pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),idx=[];
 for(let i=0;i<CSEG;i++)for(let j=0;j<CRAD;j++){const a=i*(CRAD+1)+j,b=a+CRAD+1;idx.push(a,b,a+1,b,b+1,a+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.setIndex(idx);
 const m=new THREE.Mesh(g,null);m.frustumCulled=false;m.castShadow=true;scene.add(m);CB[c.id]=Object.assign({},c,{ends:c.ends.map(e=>OB[e]),mesh:m,lit:false,strain:0});}
const cableDark=new THREE.MeshStandardMaterial({map:T.rubber,roughness:.6}),cableLit=new THREE.MeshStandardMaterial({map:T.pulse,emissiveMap:T.pulse,emissive:0xffffff,emissiveIntensity:1.6,roughness:.4});
// hint marker + interaction ring
const marker=new THREE.Mesh(new THREE.OctahedronGeometry(.18,0),new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,2,.5)}));marker.scale.y=1.5;scene.add(marker);
const ring=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshBasicMaterial({map:T.ring,color:new THREE.Color(1.6,1.5,1.2),transparent:true,depthWrite:false}));ring.rotation.x=-Math.PI/2;scene.add(ring);
// rain for the exterior
let rain=null;function makeRain(n){if(rain){scene.remove(rain);rain.geometry.dispose();}const g=new THREE.BufferGeometry(),p=new Float32Array(n*6);for(let i=0;i<n;i++){const x=(Math.random()-.5)*90,y=Math.random()*50,z=(Math.random()-.5)*90;p.set([x,y,z,x-.15,y-1.1,z],i*6);}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));rain=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x8a9cc0,transparent:true,opacity:.35,depthWrite:false}));rain.frustumCulled=false;rain.visible=false;scene.add(rain);}

/* ================= rules: power, holds, charging ================= */
const holder=id=>{for(const k in OB){const o=OB[k];if(o.in===id)return o;}return null;};
const cellFull=id=>{const b=holder(id);return!!(b&&b.kind==='battery'&&b.charge>=1);};
function live(t){return t.src==='gen'||(t.src&&cellFull(t.src));}
let PW={sinks:new Set(),lamp:false,door:[false,false,false],held:[false,false,false],pan:{}};
function evalPower(){const sinks=new Set();
 for(const k in CB){const c=CB[k],a=c.ends[0].in&&TG[c.ends[0].in],b=c.ends[1].in&&TG[c.ends[1].in];const la=a&&a.kind==='port'&&live(a),lb=b&&b.kind==='port'&&live(b);c.lit=!!(la||lb);
  if(la&&b&&b.sink)sinks.add(b.id);if(lb&&a&&a.sink)sinks.add(a.id);}
 for(const id of['P1','P2']){const t=TG[id],w=holder(id);const bot=P.y<.3&&Math.hypot(P.pos.x-t.p.x,P.pos.z-t.p.z)<.75&&G.mode==='play';t.loaded=!!(w&&w.kind==='weight')||bot;t.by=w?'weight':bot?'robot':'';}
 const lamp=sinks.has('L2s')||cellFull('K2');
 PW={sinks,lamp,door:[sinks.has('D0s')||G.latched[0],TG.P1.loaded||G.latched[1],sinks.has('S2s')||TG.P2.loaded],held:[G.latched[0]&&!sinks.has('D0s'),!G.latched[1]&&TG.P1.loaded||G.latched[1],!sinks.has('S2s')&&TG.P2.loaded]};}
// door state machines: open 0..1; holds close only after a short grace so a load can be swapped
const DS=[{open:0,want:false,grace:0,x:7.5},{open:0,want:false,grace:0,x:22.5},{open:0,want:false,grace:0,x:27}];
const doorBox=i=>i<2?[DOORS[i].x0,DOORS[i].x1,DOORS[i].z0,DOORS[i].z1,-9,99]:[SHUTTER.x0,SHUTTER.x1,SHUTTER.z0,SHUTTER.z1,-9,99];
let prevSt=null;
function updateMechs(dt){evalPower();
 const st=PW.door.map((w,i)=>w);for(let i=0;i<3;i++){const d=DS[i];if(st[i]){d.grace=.3;d.want=true;}else{d.grace-=dt;if(d.grace<=0)d.want=false;}
  const was=d.open;d.open=cl(d.open+(d.want?1.7:-2.6)*dt,0,1);if(was<.05&&d.open>=.05)snd.play('open');if(was>.02&&d.open<=.02)snd.play('close');
  const g=world.doors[i];g.position.y=d.open*(i===2?2.3:2.45);
  if(d.open<.85){const b=doorBox(i);if(overlap(P.pos.x,P.pos.z,b)){const mid=(b[0]+b[1])/2;P.pos.x=P.pos.x<mid?b[0]-RAD-.02:b[1]+RAD+.02;}}}
 // status discs: shape + colour
 const S=world.ST;const sd=(i,on,held)=>world.status[i].material.map=on?(held?S.hold:S.on):S.off;
 sd(0,PW.door[0],false);sd(1,PW.door[1],true);sd(2,PW.door[2],PW.held[2]);sd(3,PW.lamp,false);
 // messages on state edges
 const cur=[PW.door[0],PW.door[1],PW.door[2],PW.lamp,TG.P1.loaded,TG.P2.loaded,CB.C0.lit,CB.C2.lit];
 if(prevSt&&G.mode==='play'){const say=(i,on,off)=>{if(cur[i]!==prevSt[i]){const m=cur[i]?on:off;if(m)note(m);if(cur[i])G.stuck=0;}};
  if(!G.latched[0])say(0,'⚡ DOOR POWERED · OPENING','✕ DOOR LOST POWER');
  if(!G.latched[1])say(1,'▲ GATE HELD OPEN BY THE PAN','✕ PAN EMPTY · GATE DROPS');
  say(2,PW.sinks.has('S2s')?'⚡ SHUTTER POWERED · OPEN':'▲ SHUTTER HELD OPEN BY THE PAN','✕ STAIR SHUTTER CLOSED');
  if(cur[6]&&!prevSt[6])snd.play('zap');if(cur[7]&&!prevSt[7])snd.play('zap');if(cur[4]!==prevSt[4]||cur[5]!==prevSt[5])snd.play('pan');}
 prevSt=cur;let livePorts=0;for(const k in CB)if(CB[k].lit)livePorts++;snd.power(livePorts+(PW.lamp?2:0));}

/* ================= collision ================= */
function overlap(x,z,b,r=RAD){const cx=cl(x,b[0],b[1]),cz=cl(z,b[2],b[3]);return(x-cx)**2+(z-cz)**2<r*r;}
function blocked(x,z,y=P.y){for(const b of BOXES)if(y>=b[4]&&y<=b[5]&&overlap(x,z,b))return true;if(y>=GALBOX[4]&&y<=GALBOX[5]&&overlap(x,z,GALBOX))return true;
 for(let i=0;i<3;i++)if(DS[i].open<.85&&overlap(x,z,doorBox(i)))return true;const h=groundAt(x,z);return h>y+.4;}
const pointInBox=(x,z,y)=>{for(const b of BOXES)if(b!==BOXES[8]&&y+.2>=b[4]&&y<=b[5]&&x>b[0]&&x<b[1]&&z>b[2]&&z<b[3])return true;return y<2.5&&x>GALBOX[0]&&z>GALBOX[2]&&z<GALBOX[3]&&groundAt(x,z)>y+.4;};

/* ================= objects: carry, place, drop, recover ================= */
const fwd=()=>new V(-Math.sin(P.yaw),0,-Math.cos(P.yaw));
const holdPos=()=>new V(P.pos.x,P.y+1.5,P.pos.z).addScaledVector(fwd(),.05);
const accepts=(t,o)=>t.room===o.room&&(t.kind==='port'?o.kind==='plug':t.kind==='pan'?o.kind==='weight':o.kind==='battery');
function snapPos(o,t){if(t.kind==='port')return t.p.clone().addScaledVector(new V(...t.n),.14).add(new V(0,-.1,0));if(t.kind==='pan')return t.p.clone().add(new V(0,.06,0));return t.p.clone().add(new V(0,-.02,0));}
const bars=o=>Math.floor(o.charge*3+.001);
function cableEnd(o){const c=CB[o.cable];return c.ends[o.end===0?1:0];}
function plugAttach(o){const q=new V(0,.1,.16).applyQuaternion(o.m.quaternion);return o.m.position.clone().add(q);}
function findAction(){const f=holdPos().setY(P.y).addScaledVector(fwd(),.4),c=P.carry;let best=null,bd=1.55;
 const near=(p,dy)=>{const d=Math.hypot(p.x-f.x,p.z-f.z);return Math.abs(dy)<1.6?d:99;};
 if(c){for(const k in TG){const t=TG[k];if(!accepts(t,c)||holder(t.id))continue;const d=near(t.p,t.p.y-(P.y+.7));if(d<bd){bd=d;best={kind:'place',t};}}
  if(!best){const wrong=Object.values(TG).find(t=>t.room!==c.room&&near(t.p,t.p.y-(P.y+.7))<1.3&&(t.kind==='pan'?c.kind==='weight':t.kind==='port'?c.kind==='plug':c.kind==='battery'));
   return{kind:'drop',wrong};}return best;}
 for(const k in OB){const o=OB[k];if(o.carried||o.rec)continue;const d=near(o.pos,o.pos.y-P.y-.4)+(o.in&&o.kind==='plug'?.25:o.in?0:-.05);if(d<bd){bd=d;best={kind:'pick',o};}}return best;}
function actionText(a){if(!a)return'';const c=P.carry;
 if(a.kind==='place'){const t=a.t;return t.kind==='dock'?'CHARGE ON THE '+t.label:t.kind==='cradle'?'SET IN THE '+t.label:t.kind==='pan'?'SET ON THE '+t.label:'PLUG INTO '+t.label;}
 if(a.kind==='drop')return a.wrong?'DROP · THAT BELONGS IN ANOTHER ROOM':'DROP '+c.name;
 const o=a.o;if(o.in){const t=TG[o.in];return o.kind==='plug'?'UNPLUG FROM '+t.label:o.kind==='weight'?'LIFT OFF THE '+t.label:'TAKE BATTERY ('+bars(o)+'/3)';}
 return'PICK UP '+o.name+(o.kind==='battery'?' ('+bars(o)+'/3)':'');}
function use(){if(G.app!=='play'||G.mode!=='play')return null;const a=findAction();if(!a)return null;
 if(a.kind==='pick'){const o=a.o,was=o.in;o.in=null;o.carried=true;P.carry=o;snd.play(o.kind==='plug'&&was?'unplug':'pick');if(o.kind==='weight')snd.play('heavy');robot.userData.squash=.6;}
 else if(a.kind==='place'){const o=P.carry,t=a.t;o.carried=false;o.in=t.id;o.pos.copy(snapPos(o,t));P.carry=null;robot.userData.squash=.6;snd.play(t.kind==='port'?'plug':o.kind==='weight'?'heavy':'drop');G.stuck=0;
  if(t.kind==='dock'&&o.charge<1)note('⚡ CHARGING… WAIT FOR THREE BARS');}
 else{const o=P.carry;let p=new V(P.pos.x,0,P.pos.z).addScaledVector(fwd(),.75);if(pointInBox(p.x,p.z,P.y))p=new V(P.pos.x,0,P.pos.z).addScaledVector(fwd(),.3);if(pointInBox(p.x,p.z,P.y))p.set(P.pos.x,0,P.pos.z);
  o.pos.set(p.x,P.y+.9,p.z);o.vy=0;o.carried=false;o.in=null;P.carry=null;snd.play(o.kind==='weight'?'heavy':'drop');}
 return a.kind;}
function recover(o,why){o.rec=.8;if(P.carry===o)P.carry=null;o.carried=false;o.in=null;note('↺ '+o.name+' '+why+' · BACK AT ITS SPOT');snd.play('recover');}
function updateObjects(dt){
 for(const k in OB){const o=OB[k];
  if(o.rec){o.rec-=dt;o.m.position.y-=dt*1.2;o.m.scale.setScalar(Math.max(.05,o.rec/.8));if(o.rec<=0){o.rec=0;o.pos.set(...o.spawn);o.vy=0;o.m.scale.setScalar(1);}else continue;}
  if(o.carried){const h=holdPos();o.pos.copy(h);o.m.position.set(h.x,h.y-(o.kind==='plug'?.05:o.kind==='weight'?.08:.02),h.z);o.m.rotation.set(0,P.yaw,0);}
  else if(o.in){const t=TG[o.in];o.pos.copy(snapPos(o,t));o.m.position.copy(o.pos);if(t.kind==='port'){o.m.lookAt(o.pos.clone().add(new V(...t.n)));}else o.m.rotation.set(0,o.yaw*.1,0);}
  else{const g=groundAt(o.pos.x,o.pos.z,true);if(o.pos.y>g){o.vy-=22*dt;o.pos.y=Math.max(g,o.pos.y+o.vy*dt);if(o.pos.y===g){if(o.vy<-4)snd.play(o.kind==='weight'?'heavy':'drop');o.vy=0;}}else o.pos.y=g;
   if(o.pos.y<-.4){recover(o,'FELL IN THE SLIP');continue;}
   if(roomAt(o.pos.x)!==o.room||o.pos.z<Z0-.2||o.pos.z>Z1+.2){recover(o,'LEFT ITS ROOM');continue;}
   o.m.position.copy(o.pos);o.m.rotation.set(0,o.yaw,0);}
  // charging on a live dock
  if(o.kind==='battery'){if(o.in&&TG[o.in].kind==='dock'&&o.charge<1&&G.mode==='play'){const was=o.charge;o.charge=Math.min(1,o.charge+dt/DIFF[G.opt.diff].charge);if((o.charge*3|0)>(was*3|0)&&o.charge<1)snd.play('charge');if(o.charge>=1){snd.play('charged');note('▣ BATTERY CHARGED · 3/3');G.stuck=0;}}
   setCharge(o.m,o.charge,G.time);}}
 // plug tether: carry one end and the other end is dragged, or (if plugged in) holds you back
 for(const k in CB){const c=CB[k],a=c.ends[0],b=c.ends[1];c.strain=Math.max(0,c.strain-dt);
  for(const[p,q]of[[a,b],[b,a]]){if(!p.carried||q.rec)continue;const h=holdPos(),qa=q.in?q.pos:q.pos.clone().setY(q.pos.y+.1),d=h.distanceTo(qa);
   if(d>c.len){if(q.in){const dir=new V(P.pos.x-qa.x,0,P.pos.z-qa.z),hor=dir.length(),dy=h.y-qa.y,maxH=Math.sqrt(Math.max(0,c.len*c.len-dy*dy))-.02;if(hor>maxH&&hor>0){dir.multiplyScalar(maxH/hor);P.pos.x=qa.x+dir.x;P.pos.z=qa.z+dir.z;P.vel.multiplyScalar(.3);
      if(c.strain<=0){note('⟷ CABLE AT FULL LENGTH ('+c.len+' m)');snd.play('strain');}c.strain=1.5;}}
    else{const dir=new V(q.pos.x-h.x,0,q.pos.z-h.z).normalize();const nx=h.x+dir.x*(c.len-.05),nz=h.z+dir.z*(c.len-.05);if(!pointInBox(nx,nz,q.pos.y)){q.pos.x=nx;q.pos.z=nz;}q.yaw=Math.atan2(dir.x,dir.z);}}}}
 // devices
 for(const id of['D0','D2'])TG[id].m.userData.ringM.color.setRGB(...(holder(id)&&holder(id).charge<1?[.6+Math.sin(G.time*10)*.4,2.2,2.4]:[.4,1.6,1.8]));
 for(const id of['K0','K2'])TG[id].m.userData.ledM.color.setRGB(...(cellFull(id)?[.4,2.4,2.6]:holder(id)?[1.6,1.1,.2]:[.5,.12,.08]));
 for(const k in TG){const t=TG[k];if(t.kind==='port'){const on=t.sink?PW.sinks.has(t.id):live(t);t.m.userData.ledM.color.setRGB(...(on?[.4,2.4,2.6]:[.6,.14,.08]));}
  if(t.kind==='pan'){const u=t.m.userData,tgt=t.loaded?.03:.1;u.dish.position.y+=(tgt-u.dish.position.y)*Math.min(1,dt*10);u.needle.rotation.z+=((t.loaded?-1.4:.9)-u.needle.rotation.z)*Math.min(1,dt*8);}}
 for(const k in OB){const o=OB[k];if(o.kind==='plug'){const c=CB[o.cable];o.m.userData.tip.color.setRGB(...(c.lit?[.4,2.4,2.6]:[.15,.15,.15]));}}
 for(const k in CB)buildCable(CB[k]);}
const _t=new V(),_n=new V(),_b=new V(),UP=new V(0,1,0);
function buildCable(c){const a=plugAttach(c.ends[0]),b=plugAttach(c.ends[1]);if(c.ends[0].rec||c.ends[1].rec||G.view!=='in'){c.mesh.visible=false;return;}c.mesh.visible=true;c.mesh.material=c.lit?cableLit:cableDark;
 const d=a.distanceTo(b),sag=cl((c.len-d)*.35,.05,1.4),pts=[];for(let i=0;i<=CSEG;i++){const t=i/CSEG,p=a.clone().lerp(b,t);p.y-=sag*4*t*(1-t);
  const g=groundAt(p.x,p.z)+.05;if(p.y<g)p.y=g;pts.push(p);}
 const pos=c.mesh.geometry.attributes.position.array,nor=c.mesh.geometry.attributes.normal.array,uv=c.mesh.geometry.attributes.uv.array;let acc=0;
 for(let i=0;i<=CSEG;i++){const p=pts[i];_t.subVectors(pts[Math.min(CSEG,i+1)],pts[Math.max(0,i-1)]).normalize();_n.crossVectors(_t,UP);if(_n.lengthSq()<1e-4)_n.set(1,0,0);_n.normalize();_b.crossVectors(_n,_t);if(i)acc+=p.distanceTo(pts[i-1]);
  for(let j=0;j<=CRAD;j++){const an=j/CRAD*Math.PI*2,cs=Math.cos(an),sn=Math.sin(an),k=i*(CRAD+1)+j,nx=_n.x*cs+_b.x*sn,ny=_n.y*cs+_b.y*sn,nz=_n.z*cs+_b.z*sn;
   pos[k*3]=p.x+nx*.045;pos[k*3+1]=p.y+ny*.045;pos[k*3+2]=p.z+nz*.045;nor[k*3]=nx;nor[k*3+1]=ny;nor[k*3+2]=nz;uv[k*2]=acc/1.2;uv[k*2+1]=j/CRAD;}}
 c.mesh.geometry.attributes.position.needsUpdate=c.mesh.geometry.attributes.normal.needsUpdate=c.mesh.geometry.attributes.uv.needsUpdate=true;}

/* ================= the player ================= */
function updatePlayer(dt,inp){let mx=inp.x,mz=inp.z;const cy=CAM.yaw,f=new V(-Math.sin(cy),0,-Math.cos(cy)),r=new V(Math.cos(cy),0,-Math.sin(cy));
 let want=new V().addScaledVector(r,mx).addScaledVector(f,-mz);if(G.vin){want.set(G.vin.x,0,G.vin.z);}const m=Math.min(1,want.length());if(m>0)want.normalize().multiplyScalar(m);
 const sp=SPEED*(P.carry?P.carry.kind==='weight'?.62:.9:1);P.vel.lerp(want.multiplyScalar(sp),Math.min(1,dt*12));
 const nx=P.pos.x+P.vel.x*dt,nz=P.pos.z+P.vel.z*dt;if(!blocked(nx,P.pos.z))P.pos.x=nx;else P.vel.x*=.2;if(!blocked(P.pos.x,nz))P.pos.z=nz;else P.vel.z*=.2;
 P.speed=Math.hypot(P.vel.x,P.vel.z);if(P.speed>.25)P.yaw+=angD(P.yaw,Math.atan2(-P.vel.x,-P.vel.z))*Math.min(1,dt*12);
 const g=groundAt(P.pos.x,P.pos.z);if(g<P.y-.05){P.vy-=22*dt;P.y+=P.vy*dt;if(P.y<=g){if(P.vy<-6){robot.userData.squash=1;snd.play('heavy');}P.y=g;P.vy=0;}}else{P.y=g;P.vy=0;}
 if(P.y<-1||P.pos.x<-7.5||P.pos.x>37.5){const e=ROOMS[G.room].entry;P.pos.set(e[0],0,e[1]);P.y=0;}
 // latch a door once WICK is through it: that checkpoint can't be undone
 const rm=roomAt(P.pos.x);if(rm>G.room&&P.pos.x>DOORS[rm-1].x1+.5){for(let k=G.room;k<rm;k++)G.latched[k]=true;G.room=rm;onRoom();}
 snd.motor(P.speed,P.carry&&P.carry.kind);}
function onRoom(){snd.play('room');showBanner();saveCheckpoint();G.stuck=0;note('✓ CHECKPOINT SAVED · '+ROOMS[G.room].name);}

/* ================= hints: the next step, worked out from the live state ================= */
function nextStep(){const r=G.room,c=P.carry;const at=o=>o.carried?null:o.pos.clone(),tp=id=>TG[id].p.clone();
 if(r===0){if(PW.door[0])return{t:'The door is open. Roll through to the storeroom.',p:new V(8.6,0,1.5)};
  const b=OB.B0,cab=CB.C0,ok=cellFull('K0'),wired=cab.ends.some(e=>e.in==='K0p')&&cab.ends.some(e=>e.in==='D0s');
  if(!ok){if(b.charge<1){if(b.in==='D0')return{t:'Charging… the battery fills its three bars on the dock.',p:tp('D0')};return c===b?{t:'Set the flat battery on the CHARGER dock by the generator.',p:tp('D0')}:{t:'Pick up the flat battery. The generator\'s CHARGER dock can fill it.',p:at(b)||tp('D0')};}
   return c===b?{t:'Carry the charged battery to the CELL cradle.',p:tp('K0')}:{t:'The battery is full. Take it to the CELL cradle in the middle of the room.',p:at(b)||tp('K0')};}
  if(!wired){if(c&&c.kind==='plug'){const other=cableEnd(c);const need=other.in==='K0p'?'D0s':other.in==='D0s'?'K0p':'K0p';return{t:need==='D0s'?'Plug this end into the DOOR socket. Watch the cable light up.':'Plug this end into the CRADLE PORT on the cell cradle.',p:tp(need)};}
   const e=cab.ends.find(e=>e.in!=='K0p'&&e.in!=='D0s');return{t:'Run the cable: one plug in the CRADLE PORT, the other in the DOOR socket.',p:e?at(e)||e.pos.clone():tp('D0s')};}
  return{t:'Power flows from the cell to the door.',p:tp('D0s')};}
 if(r===1){if(PW.door[1]&&(OB.W1.in==='P1'||G.latched[1]))return{t:'The pan holds the gate open. Go through.',p:new V(23.6,0,1.5)};
  const w=OB.W1;if(c===w)return{t:'Set the counterweight on the GATE PAN. It will hold the gate open.',p:tp('P1')};
  if(TG.P1.by==='robot')return{t:'The gate opens only while the pan is loaded. Leave something heavy on it instead.',p:at(w)};
  return{t:'The GATE PAN lifts the gate while it is loaded. The counterweight is heavy enough to hold it.',p:at(w)||tp('P1')};}
 const up=P.y>.2||(P.pos.x>27.05&&P.pos.z<-3.2);
 if(!PW.door[2]&&!up){if(c&&c.kind==='weight')return{t:'Hold route: set the counterweight on the SHUTTER PAN.',p:tp('P2')};
  if(c&&c.kind==='plug'){const o=cableEnd(c);return o.in==='G2p'?{t:'Power route: plug into the SHUTTER SOCKET, or carry this live end up to the lamp later.',p:tp('S2s')}:{t:'Plug this end into the GENERATOR.',p:tp('G2p')};}
  return{t:'Open the stair shutter: hold it with the counterweight on its PAN, or power its SOCKET with the cable.',p:at(OB.W2)||tp('P2')};}
 const live2=CB.C2.ends.find(e=>e.in==='G2p'),free=live2&&cableEnd(live2);
 if(c&&c.kind==='plug'&&free===c)return{t:'Carry the live plug up the stair into the LAMP SOCKET.',p:tp('L2s')};
 if(c&&c.kind==='battery')return c.charge>=1?{t:'Set the charged battery in the LAMP CELL cradle.',p:tp('K2')}:{t:'Charge it on the CHARGER dock first.',p:tp('D2')};
 if(free&&free.in!=='S2s'&&!free.rec)return{t:'The cable is live. Bring its free plug up to the LAMP SOCKET.',p:at(free)};
 const b=OB.B2;if(b.charge>=1&&b.in!=='K2')return{t:'Carry the charged battery up to the LAMP CELL cradle.',p:at(b)||tp('K2')};
 if(b.in==='D2')return{t:'Charging…',p:tp('D2')};
 return{t:'The lamp needs power: a charged battery in its cradle, or the generator cable in its socket.',p:CB.C2.ends.some(e=>e.in==='S2s')?at(b)||tp('D2'):(live2?at(free):at(CB.C2.ends[0]))||tp('L2s')};}

/* ================= camera ================= */
const CAM={yaw:0,dist:8.6,pitch:.92,focus:new V(),pos:new V(),look:new V(),snap:true};
function updateCamera(dt,step){const asp=innerWidth/innerHeight,narrow=asp<1?1+(1-asp)*.9:1;let f=new V(P.pos.x,P.y+.7,P.pos.z);
 if(step&&step.p){const d=step.p.clone().sub(P.pos);d.y=0;const l=d.length();if(l>.1)f.addScaledVector(d.normalize(),Math.min(3.2,l*.38));}
 const r=ROOMS[roomAt(P.pos.x)];f.x=cl(f.x,r.x0+2.2,r.x1-2.2);
 if(CAM.snap){CAM.focus.copy(f);}else CAM.focus.lerp(f,Math.min(1,dt*3.5));const pit=Math.min(1.25,CAM.pitch+(narrow-1)*.45),dd=CAM.dist*narrow,cp=Math.cos(pit);
 const tp=new V(CAM.focus.x+Math.sin(CAM.yaw)*cp*dd,CAM.focus.y+Math.sin(pit)*dd,CAM.focus.z+Math.cos(CAM.yaw)*cp*dd);if(CAM.snap)CAM.pos.copy(tp);else CAM.pos.lerp(tp,Math.min(1,dt*5));CAM.snap=false;
 cam.position.copy(CAM.pos);cam.lookAt(CAM.focus);
 // fade any divider standing between the camera and WICK
 for(const g of world.dividers){const x=g.userData.x,hide=(cam.position.x-x)*(P.pos.x-x)<0;for(const m of g.userData.mats){m.opacity+=((hide?.15:1)-m.opacity)*Math.min(1,dt*8);m.depthWrite=m.opacity>.9;}}}

/* ================= HUD ================= */
let lastAct=null,curStep=null;
function note(t){toast($('toasts'),t,2800,3);}
function showBanner(){const r=ROOMS[G.room];$('bRoom').textContent='ROOM '+(G.room+1)+' / 3';$('bName').textContent=r.name;$('bRule').textContent=r.rule;$('bTeach').textContent=r.teach;$('banner').classList.add('on');G.banner=5;}
function hintVisible(){const h=DIFF[G.opt.diff].hint;return h===2||G.hintT>0||(h===1&&G.stuck>25);}
function updateHUD(dt){const r=G.room;$('room').textContent=(r+1)+'/3 · '+ROOMS[r].name;$('rule').textContent=ROOMS[r].rule;
 $('obj').textContent=['Power the door to the storeroom.','Get through the iron gate.','Light the beacon lamp up on the gallery.'][r];
 const hv=hintVisible();$('hint').textContent=hv&&curStep?'▸ '+curStep.t:DIFF[G.opt.diff].hint===0?'[H] HINT COSTS 0:10':'[H] HINT';$('hint').classList.toggle('dim',!hv);
 $('clock').textContent=mmss(G.clock);$('clock').classList.toggle('low',G.clock<30);$('cbar').style.width=(G.clock/G.clockMax*100)+'%';$('rs').textContent='↺ '+G.resets+' RESET'+(G.resets===1?'':'S');
 const a=lastAct;$('prompt').innerHTML=a?'<kbd>E</kbd>'+actionText(a):'';$('prompt').classList.toggle('on',!!a);$('bUse').textContent=a?(a.kind==='pick'?(a.o.in?'TAKE':'PICK UP'):a.kind==='place'?'PLACE':'DROP'):'USE';
 const c=P.carry;let ch='';if(c){ch='CARRYING · '+c.name;if(c.kind==='plug'){const cb=CB[c.cable],o=cableEnd(c),d=holdPos().distanceTo(o.pos);ch+=` · ${d.toFixed(1)} / ${cb.len} m`+(cb.lit?' · ⚡ LIVE':' · DARK');}
  if(c.kind==='battery')ch+=' · '+(c.charge>=1?'▣ FULL':Math.floor(c.charge*3+.001)+'/3');}$('carry').textContent=ch;$('carry').classList.toggle('on',!!c);
 const L=[],st=(on,y,n)=>on?y:n;
 if(r===0){const b=holder('K0');L.push('CELL CRADLE '+(b?b.charge>=1?'⚡ LIVE':'▣ '+Math.floor(b.charge*3+.001)+'/3 · NEEDS A FULL CELL':'▢ EMPTY'));L.push('CABLE '+st(CB.C0.lit,'⚡ LIVE','✕ DARK'));L.push('DOOR '+(G.latched[0]?'▲ LATCHED OPEN':st(PW.door[0],'⚡ POWERED','✕ NO POWER')));}
 else if(r===1){L.push('GATE PAN '+(TG.P1.loaded?'▲ LOADED ('+(TG.P1.by==='robot'?'WICK':'COUNTERWEIGHT')+')':'▽ EMPTY'));L.push('GATE '+(G.latched[1]?'▲ LATCHED OPEN':st(PW.door[1],'▲ HELD OPEN','✕ SHUT')));}
 else{L.push('SHUTTER '+(PW.door[2]?PW.sinks.has('S2s')?'⚡ POWERED OPEN':'▲ HELD OPEN':'✕ SHUT'));L.push('CABLE '+st(CB.C2.lit,'⚡ LIVE','✕ DARK'));L.push('BATTERY '+(OB.B2.charge>=1?'▣ FULL':Math.floor(OB.B2.charge*3+.001)+'/3'));L.push('LAMP '+st(PW.lamp,'✦ LIT','✕ DARK'));}
 $('dev').innerHTML=L.map(l=>'<p>'+l+'</p>').join('');$('dev').style.top=($('tl').offsetHeight+22)+'px';
 if(G.banner>0){G.banner-=dt*(P.speed>.5&&G.banner<4?2.5:1);if(G.banner<=0)$('banner').classList.remove('on');}}

/* ================= save / load (checkpoint per room) ================= */
const rd=k=>{try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}},wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}},rm=k=>{try{localStorage.removeItem(k);}catch(e){}};
function saveCheckpoint(){wr(SAVE,{v:1,run:G.run,diff:G.opt.diff,room:G.room,clock:G.clock,clockMax:G.clockMax,resets:G.resets,hints:G.hints,elapsed:G.elapsed});}
function loadSave(){const s=rd(SAVE);return s&&s.v===1&&s.room>=1&&s.room<=2&&s.clock>0?s:null;}
function updateContinue(){const s=loadSave();$('cont').hidden=!s;if(s)$('cont').textContent='CONTINUE · ROOM '+(s.room+1)+' · '+mmss(s.clock)+' LEFT';}

/* ================= round flow ================= */
function placeObj(o,spawn=true){o.in=null;o.carried=false;o.rec=0;o.vy=0;o.charge=0;o.pos.set(...o.spawn);o.m.scale.setScalar(1);}
function layoutRoom(k,solved){for(const id in OB){const o=OB[id];if(o.room!==k)continue;placeObj(o);if(solved&&SOLVED[k]&&SOLVED[k][id]){o.in=SOLVED[k][id];o.pos.copy(snapPos(o,TG[o.in]));}if(solved&&SOLVED[k]&&SOLVED[k].charge&&SOLVED[k].charge[id])o.charge=1;}}
function putPlayer(k){const e=ROOMS[k].entry;P.pos.set(e[0],0,e[1]);P.y=0;P.vy=0;P.vel.set(0,0,0);P.yaw=ROOMS[k].yaw;P.carry=null;CAM.snap=true;}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();const cont=o.cont?loadSave():null;if(o.diff!==undefined)G.opt.diff=o.diff;if(cont)G.opt.diff=cont.diff;saveOpt();
 snd.init();snd.setVol(G.opt.vol);snd.ambience(true);snd.urgent=0;
 G.app='play';G.mode='play';G.result=null;G.time=0;G.stuck=0;G.hintT=0;G.fin=0;G.route='';G.vin=null;G.flash=0;
 G.clockMax=cont?cont.clockMax:DIFF[G.opt.diff].clock;G.clock=cont?cont.clock:G.clockMax;G.resets=cont?cont.resets:0;G.hints=cont?cont.hints:0;G.elapsed=cont?cont.elapsed:0;G.run=cont?cont.run:Date.now().toString(36)+Math.random().toString(36).slice(2,6);
 G.room=cont?cont.room:0;G.latched=[G.room>0,G.room>1];for(let k=0;k<3;k++)layoutRoom(k,k<G.room);for(const d of DS){d.open=0;d.want=false;d.grace=0;}evalPower();for(let i=0;i<2;i++)if(G.latched[i])DS[i].open=1;prevSt=null;
 putPlayer(G.room);CAM.yaw=0;P.cheer=0;keeper.userData.t=0;setView('in');world.lens.material.emissive.setHex(0);world.core.material.color.setHex(0x2a2a2a);world.lampLight.intensity=0;
 ['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);$('hud').hidden=false;$('touch').hidden=!touchUI;document.body.classList.add('playing');$('toasts').innerHTML='';
 if(!cont)saveCheckpoint0();showBanner();if(cont)note('✓ RESUMED AT ROOM '+(G.room+1)+' CHECKPOINT');}
function saveCheckpoint0(){rm(SAVE);} // a new rescue replaces any older checkpoint
function resetRoom(){if(G.app!=='play'||G.mode!=='play')return;const k=G.room;if(P.carry){const c=P.carry;c.carried=false;}layoutRoom(k,false);putPlayer(k);G.resets++;snd.play('reset');note('↺ ROOM '+(k+1)+' RESET · OBJECTS BACK IN PLACE');G.stuck=0;}
function pause(on){if(on){if(G.app!=='play'||G.mode!=='play')return;G.app='paused';$('pause').hidden=false;$('hud').hidden=true;$('touch').hidden=true;snd.ambience(false);}
 else{if(G.app!=='paused')return;G.app='play';$('pause').hidden=true;$('hud').hidden=false;$('touch').hidden=!touchUI;snd.ambience(true);}}
function toMenu(){G.app='menu';G.mode='play';['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause','hud','touch'].forEach(id=>$(id).hidden=true);document.body.classList.remove('playing');snd.ambience(false);setView('out');G.lit=0;updateBest();updateContinue();}
function win(){G.mode='finale';G.fin=0;P.carry=null;$('hud').hidden=true;$('touch').hidden=true;const held=TG.P2.loaded&&!PW.sinks.has('S2s'),byCable=PW.sinks.has('L2s');G.route=(held?'HOLD':'POWER')+' ROUTE · LAMP BY '+(byCable?'CABLE':'BATTERY');snd.play('lamp');note('✦ THE BEACON IS LIT');}
function endGame(won){if(G.app!=='play')return;G.app='over';$('hud').hidden=true;$('touch').hidden=true;document.body.classList.remove('playing');snd.ambience(false);snd.urgent=0;if(!won)snd.play('lose');
 const D=DIFF[G.opt.diff],left=Math.max(0,G.clock),pct=left/G.clockMax;const stars=won?1+(pct>=.4?1:0)+(G.resets===0?1:0):0;const solved=G.latched.filter(Boolean).length;
 const score=won?Math.round((1000+left*4+stars*400-G.resets*60)*D.mult):solved*150;const tokens=won?8+stars*4:2+solved;
 // rewards are paid once per run id: a reload or a second results screen for the same run pays nothing
 const paid=rd(PAID)||[];const fresh=!paid.includes(G.run);if(fresh){paid.push(G.run);wr(PAID,paid.slice(-30));addRound(tokens,won);saveBest(ID,score);}rm(SAVE);
 G.result={won,score,stars,tokens:fresh?tokens:0,time:G.elapsed,left,resets:G.resets,hints:G.hints,route:G.route,diff:D.n,paid:fresh};
 $('ores').textContent=won?'BEACON LIT':'THE STORM WON';$('osub').textContent=won?'The lamp sweeps the sea again. The lifeboat has a light to steer by, and the keeper is going home.':'The storm clock ran out before the lamp was lit. Each room you cleared still counts.';
 $('ostars').innerHTML=[0,1,2].map(i=>`<i class="${i<stars?'on':''}">${i<stars?'★':'☆'}</i>`).join('')+`<span>${stars} / 3 STARS</span>`;
 const rows=[['TIME',mmss(G.elapsed)],['STORM CLOCK LEFT',mmss(left)+' · '+Math.round(pct*100)+'%'],['ROOM RESETS',G.resets],['ROOMS CLEARED',(won?3:solved)+' / 3'],['ROUTE',won?G.route:'-'],['HINTS BOUGHT',G.hints],['STORM',D.n]];
 $('stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');$('ofs').textContent=score.toLocaleString()+' PTS';
 $('otok').textContent=fresh?'+'+tokens+' TOKENS'+(score>=bestScore(ID)&&score>0?' · NEW BEST':''):'REWARD ALREADY PAID FOR THIS RUN';
 $('ostarkey').textContent='★ BEACON LIT  ★ 40%+ OF THE STORM CLOCK LEFT  ★ NO ROOM RESETS';
 $('over').hidden=false;setView('out');G.lit=won?1:0;G.extT=0;}
function updateBest(){const b=bestScore(ID);$('best').textContent=b?'BEST · '+b.toLocaleString()+' PTS':'';}

/* ================= views: inside the rooms / outside on the rock ================= */
function setView(v){G.view=v;if(v==='out'&&!ext){ext=buildExterior(scene,T,gfx===0);makeRain(gfx>=2?1600:gfx===1?900:400);}
 const inn=v==='in';world.W.visible=inn;robot.visible=blob.visible=keeper.visible=inn;for(const k in OB)OB[k].m.visible=inn;for(const k in TG)TG[k].m.visible=inn;for(const k in CB)CB[k].mesh.visible=inn;
 scene.traverse(o=>{if(o.isSprite&&o.parent===scene)o.visible=inn;});marker.visible=ring.visible=false;
 for(const l of world.lamps)l.intensity=inn?22:0;world.lampLight.intensity=0;if(ext){ext.X.visible=!inn;rain.visible=!inn;ext.lampL.intensity=0;}
 scene.fog=inn?null:new THREE.FogExp2(0x070b14,.0045);world.hemi.intensity=inn?.9:.5;CAM.snap=true;}
function extUpdate(dt,lit,t){if(!ext)return;const u=ext.seaU;u.uT.value=G.time;ext.skyU.uT.value=G.time;ext.skyU.uFlash.value=u.uFlash.value=G.flash;
 ext.beam.rotation.y-=dt*.55*Math.min(1,lit*1.5);const a=ext.beam.rotation.y;u.uBeam.value.set(Math.cos(a),-Math.sin(a));u.uLit.value=lit;ext.bm.uniforms.uO.value=.6*lit;ext.lampL.intensity=lit*60;
 ext.coreM.color.setRGB(.2+lit*4,.2+lit*3.4,.2+lit*2.2);ext.glass.material.emissive.setRGB(lit*.8,lit*.65,lit*.35);u.uCam.value.copy(cam.position);
 const b=ext.boat;b.visible=lit>0;if(lit>0){const k=Math.min(1,t/14),bx=70-58*k,bz=95-78*k;b.position.set(bx,Math.sin(G.time*1.3)*.4-.3,bz);b.rotation.y=Math.atan2(-58,-78);b.rotation.z=Math.sin(G.time*1.1)*.08;}
 rain.position.set(cam.position.x,0,cam.position.z);rain.position.y=-((G.time*28)%22);}
function attractCam(dt,t,lit){const a=t*.06+(lit?.8:0),r=lit?48:52;cam.position.set(Math.sin(a)*r,9+Math.sin(t*.2)*2,Math.cos(a)*r);cam.lookAt(0,lit?11:13,0);}
function finaleUpdate(dt){G.fin+=dt;const t=G.fin;P.cheer=1;
 if(t<2.4){const k=Math.min(1,t/1.6);world.lampLight.intensity=k*9;world.lens.material.emissive.setRGB(k*.9,k*.75,k*.45);world.core.material.color.setRGB(1+k*2,1+k*1.7,1+k*1);
  const L=world.lens.position;CAM.focus.lerp(new V(L.x-.6,L.y-.6,L.z+1),Math.min(1,dt*2.2));const tp=new V(L.x-6,L.y+2.6,L.z+6.5);CAM.pos.lerp(tp,Math.min(1,dt*1.6));cam.position.copy(CAM.pos);cam.lookAt(CAM.focus);}
 else{if(G.view!=='out'){setView('out');G.extT=0;}G.extT+=dt;const k=Math.min(1,(t-2.4)/2.5),e=1-Math.pow(1-Math.min(1,(t-2.4)/5),3);G.lit=k;
  const a=.9+e*.9,r=8+e*44;cam.position.set(Math.sin(a)*r,22-e*12,Math.cos(a)*r);cam.lookAt(0,21-e*10,0);extUpdate(dt,k,G.extT);if(t>8.6)endGame(true);}}

/* ================= input ================= */
const I=controls(canvas,{canLock:()=>false});const touchUI=matchMedia('(pointer:coarse)').matches;if(touchUI)document.body.classList.add('touch');let drag=null;
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;drag={x:e.clientX};});addEventListener('pointerup',()=>drag=null);
addEventListener('pointermove',e=>{if(drag&&G.app==='play'){CAM.yaw=cl(CAM.yaw-(e.clientX-drag.x)*.006,-.8,.8);drag.x=e.clientX;}});
addEventListener('wheel',e=>{if(G.app==='play')CAM.dist=cl(CAM.dist+Math.sign(e.deltaY)*.6,7,13);},{passive:true});
// touch: left half = stick, right half = drag to orbit; buttons
const TS={id:null,ox:0,oy:0,x:0,y:0,orbit:null};
canvas.addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(t.clientX<innerWidth*.5&&TS.id===null){TS.id=t.identifier;TS.ox=t.clientX;TS.oy=t.clientY;TS.x=TS.y=0;$('stick').style.cssText=`display:block;left:${t.clientX-50}px;top:${t.clientY-50}px`;}else TS.orbit={id:t.identifier,x:t.clientX};}e.preventDefault();},{passive:false});
canvas.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===TS.id){TS.x=cl((t.clientX-TS.ox)/45,-1,1);TS.y=cl((t.clientY-TS.oy)/45,-1,1);$('knob').style.transform=`translate(${TS.x*30}px,${TS.y*30}px)`;}
 else if(TS.orbit&&t.identifier===TS.orbit.id){CAM.yaw=cl(CAM.yaw-(t.clientX-TS.orbit.x)*.008,-.8,.8);TS.orbit.x=t.clientX;}}e.preventDefault();},{passive:false});
const tend=e=>{for(const t of e.changedTouches){if(t.identifier===TS.id){TS.id=null;TS.x=TS.y=0;$('stick').style.display='none';$('knob').style.transform='';}if(TS.orbit&&t.identifier===TS.orbit.id)TS.orbit=null;}};canvas.addEventListener('touchend',tend);canvas.addEventListener('touchcancel',tend);
const tap=(id,f)=>{$(id).addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();f();});};
tap('bUse',()=>doUse());tap('bReset',()=>resetRoom());tap('bHint',()=>askHint());tap('bPause',()=>pause(true));
let padPrev=[];
function doUse(){const r=use();if(r===null&&P.carry===null&&G.mode==='play'&&G.app==='play')snd.play('deny');}
function askHint(){if(G.app!=='play'||G.mode!=='play')return;const D=DIFF[G.opt.diff];if(D.hint===0){G.clock=Math.max(1,G.clock-10);G.hints++;note('✦ HINT · −0:10 FROM THE STORM CLOCK');}G.hintT=10;snd.play('hint');}
function readInput(){const k=I.keys;let x=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0),z=(k.KeyS||k.ArrowDown?1:0)-(k.KeyW||k.ArrowUp?1:0);
 if(TS.id!==null){x=TS.x;z=TS.y;}const gp=gamepad();if(gp){const ax=deadzone(gp.axes[0]||0),az=deadzone(gp.axes[1]||0);if(ax||az){x=ax;z=az;}const rx=deadzone(gp.axes[2]||0);if(rx)CAM.yaw=cl(CAM.yaw-rx*.04,-.8,.8);
  const b=gp.buttons.map(q=>q.pressed);const ed=i=>b[i]&&!padPrev[i];if(ed(0))doUse();if(ed(3))resetRoom();if(ed(2))askHint();if(ed(9))pause(G.app==='play');padPrev=b;}
 if(k.KeyZ)CAM.yaw=cl(CAM.yaw+.03,-.8,.8);if(k.KeyX)CAM.yaw=cl(CAM.yaw-.03,-.8,.8);
 const e=I.edge;if(e.KeyE||e.Space||e.Enter)doUse();if(e.KeyR)resetRoom();if(e.KeyH)askHint();I.flush();return{x,z};}
addEventListener('keydown',e=>{if(e.code==='Escape'||e.code==='KeyP'){if(G.app==='play')pause(true);else if(G.app==='paused')pause(false);}if(e.code==='Space'&&G.app==='play')e.preventDefault();});
addEventListener('blur',()=>pause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});

/* ================= the frame ================= */
function lightning(dt){G.flashT-=dt;const urgency=G.app==='play'?1-G.clock/G.clockMax:.3;if(G.flashT<=0){G.flashT=(4+Math.random()*9)*(1-urgency*.6);if(G.opt.fx)G.flash=.7+Math.random()*.5;snd.thunder(.4+Math.random()*.4);}G.flash=Math.max(0,G.flash-dt*(G.flash>.5?6:2.5));
 const f=G.flash;world.moon.intensity=.5+f*3;world.winMat.color.setRGB(.55+f*2,.62+f*2,.8+f*2.2);}
function step(dt){dt=Math.min(dt,.1);G.time+=dt;lightning(dt);
 if(G.app==='play'){if(G.mode==='play'){G.elapsed+=dt;G.clock-=dt;G.stuck+=dt;if(G.hintT>0)G.hintT-=dt;const inp=readInput();updatePlayer(dt,inp);
   if(G.clock<=30&&!snd.urgent)snd.urgent=1;if(G.clock<=10&&Math.ceil(G.clock)!==Math.ceil(G.clock+dt))snd.play('tick');
   if(G.clock<=0){G.clock=0;endGame(false);return;}}
  else{I.flush();P.vel.set(0,0,0);P.speed=0;}
  updateMechs(dt);updateObjects(dt);if(G.mode==='play'&&PW.lamp){win();}
  animRobot(robot,dt,{speed:P.speed,carry:P.carry&&P.carry.kind,cheer:P.cheer,lit:P.carry&&P.carry.kind==='plug'&&CB[P.carry.cable].lit});robot.position.set(P.pos.x,P.y,P.pos.z);robot.rotation.y=P.yaw;
  blob.position.set(P.pos.x,groundAt(P.pos.x,P.pos.z)+.02,P.pos.z);animKeeper(keeper,dt,G.mode==='finale'||PW.lamp?'wave':'sit');world.water.position.y=-.55+Math.sin(G.time*1.4)*.04;world.water.material.uniforms.uT.value=G.time;world.water.material.uniforms.uF.value=G.flash;
  if(G.mode==='play'){lastAct=findAction();curStep=nextStep();updateCamera(dt,curStep);updateHUD(dt);
   const showM=hintVisible()&&curStep&&curStep.p;marker.visible=!!showM;if(showM){marker.position.set(curStep.p.x,Math.max(curStep.p.y,groundAt(curStep.p.x,curStep.p.z))+1.1+Math.sin(G.time*4)*.12,curStep.p.z);marker.rotation.y+=dt*2;}
   const tgt=lastAct&&(lastAct.kind==='place'?lastAct.t.p:lastAct.kind==='pick'?lastAct.o.pos:null);ring.visible=!!tgt;if(tgt){ring.position.set(tgt.x,groundAt(tgt.x,tgt.z)+.04,tgt.z);if(lastAct.kind==='place'&&lastAct.t.kind==='port')ring.position.set(tgt.x+lastAct.t.n[0]*.6,groundAt(tgt.x,tgt.z)+.04,tgt.z+lastAct.t.n[2]*.6);ring.rotation.z+=dt;ring.scale.setScalar(1+Math.sin(G.time*6)*.06);}}
  else{marker.visible=ring.visible=false;finaleUpdate(dt);}
  if(G.mode==='play'){cableLit.map.offset.x-=dt*1.6;}}
 else if(G.app==='over'||G.app==='menu'){if(G.view!=='out')setView('out');G.extT=(G.extT||0)+dt;attractCam(dt,G.time,G.lit||0);extUpdate(dt,G.lit||0,G.extT);}
 cableLit.map.offset.x-=dt*.4;}

/* ================= rendering ================= */
let gfx=quality(),fxStack=null,fxSize='';
function applyQuality(q){gfx=q;RR.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.75));fxStack=null;fxSize='';RR.shadowMap.enabled=q>=1;world.moon.castShadow=q>=1;world.moon.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);
 if(world.moon.shadow.map){world.moon.shadow.map.dispose();world.moon.shadow.map=null;}if(rain)makeRain(q>=2?1600:q===1?900:400);scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true;});}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(RR.domElement.width!==Math.floor(w*RR.getPixelRatio())||RR.domElement.height!==Math.floor(h*RR.getPixelRatio()))RR.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();const key=w+'x'+h;
 if(!fxStack){fxStack=cinematic(RR,scene,cam,{exposure:1.05,bloom:.75,bloomThreshold:.72,bloomRadius:.55,saturation:1.08,tint:0xfff2e4,vignette:.5,grain:.035,aoStrength:.9,quality:gfx});fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}fxStack.render();}

/* ================= menus ================= */
const seg=pickers(G.opt,saveOpt);seg('o-diff','diff');seg('o-fx','fx');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-vol2','vol',true,v=>{snd.setVol(v);seg.sync();});
$('go').onclick=()=>start({});$('cont').onclick=()=>start({cont:true});$('again').onclick=()=>start({});$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('preset').onclick=()=>{pause(false);resetRoom();};$('quit').onclick=()=>{G.app='menu';toMenu();};
postButton($('post'),ID,()=>{const r=G.result||{};return[r.score||0,`Game: Beacon Rescue\nScore: ${r.score||0}\nResult: ${r.won?'beacon lit':'storm won'} · ${r.stars||0}/3 stars\nTime: ${mmss(r.time||0)} · resets ${r.resets||0} · ${r.route||''}\nStorm: ${r.diff||''}`];});

/* ================= loop ================= */
toMenu();$('loading').classList.add('done');
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hook ================= */
function entityPos(id){if(TG[id])return TG[id].p;if(OB[id])return OB[id].pos;return null;}
function standFor(p){let best=null,bd=1e9;const lvl=groundAt(p.x,p.z)>2.5||p.y>2.5?3:0;for(let i=0;i<24;i++){const a=i/24*Math.PI*2;for(const r of[.95,1.2]){const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r,g=groundAt(x,z);if(Math.abs(g-lvl)>.6||blocked(x,z,g))continue;const d=Math.hypot(x-P.pos.x,z-P.pos.z);if(d<bd){bd=d;best=[x,z,g];}}}return best;}
window.BEACON={get state(){return G.app;},get mode(){return G.mode;},get score(){return G.result?G.result.score:0;},get result(){return G.result;},get power(){return PW;},get doors(){return DS.map(d=>+d.open.toFixed(2));},
 get room(){return G.room;},get clock(){return G.clock;},get carry(){return P.carry&&P.carry.id;},get action(){const a=findAction();return a?actionText(a):null;},get hint(){return curStep&&curStep.t;},get gfx(){return gfx;},
 G,P,OB,TG,CB,CAM,scene,cam,step,render,start,toMenu,pause,resetRoom,endGame,use,setQuality:applyQuality,loadSave,saveCheckpoint,askHint,
 pos(){return{x:+P.pos.x.toFixed(2),y:+P.y.toFixed(2),z:+P.pos.z.toFixed(2)};},setClock(s){G.clock=s;},
 teleport(x,z,yaw){P.pos.set(x,0,z);P.y=groundAt(x,z);P.vel.set(0,0,0);if(yaw!==undefined)P.yaw=yaw;CAM.snap=true;},
 stand(id){const s=standFor(entityPos(id));return s&&[+s[0].toFixed(2),+s[1].toFixed(2)];},
 face(id){const p=entityPos(id);P.yaw=Math.atan2(-(p.x-P.pos.x),-(p.z-P.pos.z));},
 goto(id){const p=entityPos(id);const s=p&&standFor(p);if(!s)return false;P.pos.set(s[0],0,s[1]);P.y=s[2];P.vel.set(0,0,0);this.face(id);CAM.snap=true;return true;},
 // drive WICK with real movement + collision toward (x,z); returns the distance left
 drive(x,z,maxT=12,dt=1/30){let t=0;while(t<maxT&&G.app==='play'&&G.mode==='play'){const dx=x-P.pos.x,dz=z-P.pos.z,d=Math.hypot(dx,dz);if(d<.25)break;G.vin={x:dx/d*Math.min(1,d*2),z:dz/d*Math.min(1,d*2)};step(dt);t+=dt;}G.vin=null;return Math.hypot(x-P.pos.x,z-P.pos.z);},
 wait(s,dt=1/30){for(let t=0;t<s;t+=dt)step(dt);},
 act(id){this.goto(id);return use();}};
