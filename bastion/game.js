// BASTION LINE — a tower-defense game in full 3D. Entry module: renderer and diorama camera, mouse / touch / keyboard input
// (place, select, upgrade, hero orders, pan, pinch, rotate), tower / enemy / hero / projectile views, effects and sounds driven
// by sim events, the HUD (tower bar, upgrade panel, wave preview, boss bar), menus, results and the window.BASTION test hook.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls} from '../js/kit3d/input.js';
import {$,stored,pickers,postButton,toast} from '../js/kit3d/ui.js';
import {Sim} from './sim.js';
import {Autopilot} from './ai.js';
import {T,E,HEROES,HERO_XP,DIFF,MAPS,TOWER_LIST,KIND_N,tstats} from './data.js';
import {W,D,makeMap} from './map.js';
import {towerModel,enemyGeo,heroModel,MAT} from './models.js';
import {buildWorld} from './world.js';
import {Particles,Decals,Shocks,Strips,setHeight} from './fx.js';
import {Sound} from './sound.js';
import {cl,fmtT} from './util.js';

const ID='bastionline';
const opt={map:0,diff:1,waves:15,hero:'wren'};const save=stored('bastion_opts',opt);
/* ================= renderer / scene ================= */
const canvas=$('c'),ov=$('ov'),ox=ov.getContext('2d');
const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});let gfx=quality();
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(38,1,1,500);
function skyTex(a,b){const c=document.createElement('canvas');c.width=2;c.height=256;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,b);g.addColorStop(.55,a);g.addColorStop(1,'#1a140e');x.fillStyle=g;x.fillRect(0,0,2,256);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const hemi=new THREE.HemisphereLight(0xfff4e0,0x5a4a38,1.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,2.9);sun.position.set(-40,70,35);sun.castShadow=true;sun.shadow.bias=-.0005;sun.shadow.normalBias=.05;Object.assign(sun.shadow.camera,{left:-62,right:62,top:46,bottom:-46,near:10,far:200});scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight(0x9ab8ff,.55);fill.position.set(50,30,-40);scene.add(fill);
const POST={bloom:.5,bloomRadius:.45,bloomThreshold:.88,vignette:.32,saturation:1.12,grain:.015,exposure:1.05};
let world=null,worldMap=-1,fxStack=null;
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));sun.castShadow=q>=1;const ms=q>=2?4096:2048;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}fxStack=null;
 if(worldMap>=0){const m=worldMap;worldMap=-1;setWorld(m);}resize();}
/* ================= effects ================= */
const parts=new Particles(scene,5000,true),smoke=new Particles(scene,1600,false),decals=new Decals(scene,60),shocks=new Shocks(scene,20),strips=new Strips(scene,160);
const flashL=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xffc070,0,18,1.6);scene.add(l);return{l,t:0};});let fli=0;
function flash(x,y,z,c,i=40,d=16){if(gfx===0)return;const L=flashL[fli++%4];L.l.position.set(x,y,z);L.l.color.set(c);L.l.intensity=i;L.l.distance=d;L.t=.3;}
const colCache={};const col=s=>colCache[s]||(colCache[s]=new THREE.Color(s));
function burst(x,y,z,n,s,c,size,life,o){if(gfx===0)n=Math.ceil(n*.5);parts.burst(x,y,z,n,s,Array.isArray(c)?c.map(col):col(c),size,life,o);}
function puff(x,y,z,n,c,size=1.6,life=1.2,spread=1){const cc=col(c);for(let i=0;i<n;i++)smoke.emit(x+(Math.random()-.5)*spread,y,z+(Math.random()-.5)*spread,(Math.random()-.5)*1.6,.8+Math.random()*1.4,(Math.random()-.5)*1.6,cc.r,cc.g,cc.b,size,life,0,1,1.3);}
const snd=new Sound();
/* ================= state ================= */
let app='menu',S=null,auto=null,spd=1,paused=false,menuT=0,shake=0,lastAward=null,FAST=false,noHud=false;
let sel=null,placing=null,mx=-1,my=-1,mIn=false,ghostOK=false,ghostXZ=null,hoverT=null;
const cam={x:0,z:2,tx:0,tz:2,dist:84,td:84,yaw:0,tyaw:0};const floats=[];
let H=()=>0;
/* ================= world ================= */
function setWorld(idx){if(worldMap===idx&&world)return;if(world)for(const o of world.objs){scene.remove(o);o.traverse(n=>{if(n.geometry&&n.isInstancedMesh)n.dispose?.();});}
 worldMap=idx;const M=makeMap(idx);H=M.height;setHeight(M.height);world=buildWorld(scene,M,gfx);world.M=M;const Dm=MAPS[idx];
 scene.background=skyTex(Dm.sky[0],Dm.sky[1]);scene.fog=new THREE.Fog(new THREE.Color(Dm.sky[0]).lerp(new THREE.Color('#1a140e'),.35),150,320);
 if(Dm.city){hemi.color.set(0xe8e0f0);sun.color.set(0xffd8b8);sun.intensity=2.6;hemi.intensity=1.1;}else if(Dm.snow){hemi.color.set(0xf0f4ff);sun.color.set(0xfff4e8);sun.intensity=3;hemi.intensity=1.3;}else{hemi.color.set(0xfff4e0);sun.color.set(0xfff0d0);sun.intensity=2.9;hemi.intensity=1.25;}}
/* ================= views ================= */
const tviews=new Map();let heroV=null;
const rangeMat=new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color('#ffffff')},uT:{value:0}},transparent:true,depthWrite:false,depthTest:false,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform vec3 uC;uniform float uT;varying vec2 vUv;void main(){float r=length(vUv-.5)*2.;if(r>1.)discard;float e=smoothstep(.95,.985,r)*smoothstep(1.,.985,r);float d=step(.5,fract(atan(vUv.y-.5,vUv.x-.5)*9.55+uT*.25));gl_FragColor=vec4(uC,e*(.55+.45*d)+.1+.06*smoothstep(.6,1.,r));}'});
const rangeMesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2),rangeMat);rangeMesh.renderOrder=6;rangeMesh.visible=false;scene.add(rangeMesh);
const minRange=new THREE.Mesh(new THREE.PlaneGeometry(2,2).rotateX(-Math.PI/2),rangeMat.clone());minRange.material.uniforms.uC.value=new THREE.Color('#ff6a4a');minRange.renderOrder=6;minRange.visible=false;scene.add(minRange);
let ghost=null,ghostKey='';
function setGhost(type){const k=type||'';if(k===ghostKey)return;if(ghost){scene.remove(ghost.root);ghost=null;}ghostKey=k;if(!type)return;
 if(type==='hero'){const m=heroModel(opt.hero||'wren');m.root.traverse(o=>{if(o.isMesh)o.material=MAT.ghost;});ghost={root:m.root};}else ghost=towerModel(type,0,0,true);scene.add(ghost.root);}
function towerView(t){let v=tviews.get(t.id);if(v&&v.a===t.a&&v.b===t.b)return v;if(v)scene.remove(v.m.root);const m=towerModel(t.type,t.a,t.b);m.root.position.set(t.x,t.y,t.z);m.head.rotation.y=v?v.m.head.rotation.y:t.yaw;scene.add(m.root);
 v={m,a:t.a,b:t.b,born:v?menuT-.35:menuT,rec:0};tviews.set(t.id,v);return v;}
// enemy instancing: solid + glow + wings per type
const MAXI=160,EI={};const unitMat=MAT.unit;
function mkInst(geo,mat,shadow){const m=new THREE.InstancedMesh(geo,mat,MAXI);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(MAXI*3).fill(1),3);m.count=0;m.frustumCulled=false;m.castShadow=shadow;scene.add(m);return m;}
function einst(type){if(EI[type])return EI[type];const g=enemyGeo(type);return EI[type]={g,n:0,s:mkInst(g.s,unitMat,true),gl:g.g&&mkInst(g.g,MAT.glow,false),wl:g.wing&&mkInst(g.wing,unitMat,true),wr:g.wing&&mkInst(g.wing,unitMat,true)};}
const shieldMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,2),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
 vertexShader:'varying vec3 vN,vV;varying float vA;void main(){vA=instanceColor.r;vec4 mv=modelViewMatrix*instanceMatrix*vec4(position,1.);vN=normalize(normalMatrix*mat3(instanceMatrix)*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'varying vec3 vN,vV;varying float vA;void main(){float f=pow(1.-abs(dot(normalize(vN),vV)),2.2);gl_FragColor=vec4(vec3(.35,.7,1.)*(f*1.4+.08)*vA,1.);}'}),120);
shieldMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(360),3);shieldMesh.count=0;shieldMesh.frustumCulled=false;shieldMesh.renderOrder=4;scene.add(shieldMesh);
// projectiles
const PG={arrow:new THREE.CylinderGeometry(.04,.04,1,4).rotateX(Math.PI/2),ball:new THREE.IcosahedronGeometry(.26,1),shell:new THREE.IcosahedronGeometry(.4,1),bolt:new THREE.IcosahedronGeometry(.28,1)};
const PMAT={arrow:new THREE.MeshBasicMaterial({color:'#fff0c0'}),ball:new THREE.MeshStandardMaterial({color:'#2a2a2e',roughness:.4,metalness:.6}),shell:new THREE.MeshStandardMaterial({color:'#3a3632',roughness:.5,emissive:'#ff6a20',emissiveIntensity:.5}),bolt:new THREE.MeshBasicMaterial({color:new THREE.Color('#e0b0ff').multiplyScalar(2),toneMapped:false})};
const PI_={};for(const k in PG){const m=new THREE.InstancedMesh(PG[k],PMAT[k],200);m.count=0;m.frustumCulled=false;m.castShadow=k!=='bolt';scene.add(m);PI_[k]=m;}
const tO=new THREE.Object3D(),tO2=new THREE.Object3D(),tM=new THREE.Matrix4(),tC=new THREE.Color();
function updateViews(dt,t){if(!S)return;
 // towers
 const live=new Set();for(const tw of S.towers){live.add(tw.id);const v=towerView(tw),m=v.m;const age=menuT-v.born;const sc=age<.4?1-Math.pow(1-age/.4,3)*.6+Math.sin(age/.4*Math.PI)*.15:1;m.root.scale.setScalar(sc);
  let dy=tw.yaw-m.head.rotation.y;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;if(!m.d.spin&&!m.d.coin&&!m.d.orb)m.head.rotation.y+=dy*Math.min(1,dt*12);
  if(tw.fireT>.18&&v.lastN!==tw.n){v.lastN=tw.n;v.rec=1;}v.rec=Math.max(0,v.rec-dt*6);m.head.position.z=0;m.head.children.forEach(c=>{c.position.z=-v.rec*.25;});
  if(m.d.spin&&m.glow){m.glow.rotation.y=t*.8;m.glow.position.y=Math.sin(t*2+tw.id)*.15;}if(m.d.coin&&m.glow){m.glow.rotation.y=t*2;m.glow.position.y=m.d.headY+Math.sin(t*2)*.12;}
  if(m.d.orb&&m.glow){const k=1+Math.sin(t*9+tw.id)*.04+(tw.fireT>0?.15:0);m.glow.scale.set(1,1,1);m.glow.children;}
  if(tw.stunT>0&&Math.random()<dt*8)burst(tw.x,tw.y+3,tw.z,2,2,'#ffe060',.3,.4,{up:1});
  if(tw.buffT>0&&Math.random()<dt*5)burst(tw.x+(Math.random()-.5)*2,tw.y+.8,tw.z+(Math.random()-.5)*2,1,1.5,'#ffb040',.35,.6,{up:2,grav:-2});}
 for(const[id,v]of tviews)if(!live.has(id)){scene.remove(v.m.root);tviews.delete(id);}
 // enemies
 for(const k in EI)EI[k].n=0;let si=0;
 for(const e of S.enemies){if(!e.alive)continue;const I=einst(e.type);if(I.n>=MAXI)continue;const n=I.n++,g=I.g;const moving=S.factor(e)>0;const ph=(t*e.spd*2.4+e.id)*(moving?1:0);
  const bob=e.fly?0:Math.abs(Math.sin(ph))*.12*(e.d.boss?.5:1),sway=e.fly?0:Math.sin(ph)*.1;const age=Math.min(1,(S.t-e.born)*3);
  const sc=1.3*g.sc*(e.elite?1.12:1)*(.4+.6*age);tO.position.set(e.x,e.y+bob,e.z);tO.rotation.set(e.fly?.1:0,e.yaw,sway+(e.fly?Math.sin(t*1.5+e.id)*.1:0),'YXZ');tO.scale.setScalar(sc);tO.updateMatrix();I.s.setMatrixAt(n,tO.matrix);
  let r=1,gg=1,b=1;if(e.hitT>0){r=gg=b=2.4;}else if(e.frzT>0){r=.6;gg=.9;b=1.7;}else if(e.stunT>0){r=1.4;gg=1.3;b=.8;}else if(e.slowK>0){r=.8;gg=.95;b=1.3;}if(e.burnT>0&&e.hitT<=0){r*=1.4;gg*=.9;b*=.7;}if(e.elite){r*=1.1;gg*=1.05;}
  I.s.setColorAt(n,tC.setRGB(r,gg,b));if(I.gl){I.gl.setMatrixAt(n,tO.matrix);I.gl.setColorAt(n,tC.setRGB(1,1,1));}
  if(I.wl){const f=Math.sin(t*12+e.id)*.6;for(const[w,s]of[[I.wl,1],[I.wr,-1]]){tO2.position.set(0,g.wy,0);tO2.rotation.set(0,s<0?Math.PI:0,f*s*(s<0?-1:1));tO2.scale.setScalar(1);tO2.updateMatrix();tM.multiplyMatrices(tO.matrix,tO2.matrix);w.setMatrixAt(n,tM);w.setColorAt(n,tC.setRGB(r,gg,b));}}
  if(e.shield>0&&si<120){const rr=1.3*(e.d.r*2.1+.4)*(e.d.boss?2.2:1);tO2.position.set(e.x,e.y+rr*.7,e.z);tO2.rotation.set(0,t,0);tO2.scale.setScalar(rr);tO2.updateMatrix();shieldMesh.setMatrixAt(si,tO2.matrix);shieldMesh.setColorAt(si,tC.setRGB(.35+.65*e.shield/Math.max(1,e.mshield),0,0));si++;}
  if(gfx>0){if(e.burnT>0&&Math.random()<dt*14)parts.emit(e.x+(Math.random()-.5)*.6,e.y+.6+Math.random()*.8,e.z+(Math.random()-.5)*.6,0,1.5,0,1,.45+Math.random()*.3,.1,.5,.45);
   if(e.frzT>0&&Math.random()<dt*4)burst(e.x,e.y+1,e.z,1,1,'#bff4ff',.3,.6,{up:1});if(e.stunT>0&&Math.random()<dt*6)burst(e.x,e.y+1.8*sc,e.z,1,1.2,'#ffe080',.25,.5,{up:1});
   if(e.elite&&Math.random()<dt*3)burst(e.x,e.y+.4,e.z,1,.6,'#ffd050',.3,.6,{up:1});if(e.d.boss===2&&Math.random()<dt*3)puff(e.x,e.y+6,e.z,1,'#8a7a70',1.4,1,1.5);}}
 for(const k in EI){const I=EI[k];for(const m of[I.s,I.gl,I.wl,I.wr])if(m){m.count=I.n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}}
 shieldMesh.count=si;shieldMesh.instanceMatrix.needsUpdate=true;shieldMesh.instanceColor.needsUpdate=true;
 // projectiles
 const pc={arrow:0,ball:0,shell:0,bolt:0};for(const p of S.projs){const m=PI_[p.look];if(!m||pc[p.look]>=200)continue;const i=pc[p.look]++;tO.position.set(p.x,p.y,p.z);
  if(p.look==='arrow'||p.look==='bolt'){tO.lookAt(p.tx,p.ty,p.tz);tO.scale.set(1,1,p.look==='arrow'?1:1);}else{tO.rotation.set(t*7,t*5,0);tO.scale.setScalar(1);}tO.updateMatrix();m.setMatrixAt(i,tO.matrix);
  if(gfx>0){if(p.look==='shell'){if(Math.random()<.35)smoke.emit(p.x,p.y,p.z,0,.3,0,.6,.56,.52,.6,.6,0,1,1);if(p.s.burn)parts.emit(p.x,p.y,p.z,0,0,0,1,.5,.1,.5,.3);}else if(p.look==='bolt')parts.emit(p.x,p.y,p.z,0,0,0,.8,.5,1,.5,.25);else if(p.look==='ball'&&Math.random()<.4)smoke.emit(p.x,p.y,p.z,0,.2,0,.5,.48,.44,.5,.5,0,1,1);}}
 for(const k in PI_){PI_[k].count=pc[k];PI_[k].instanceMatrix.needsUpdate=true;}
 // hero
 const h=S.hero;if(h){if(!heroV||heroV.type!==h.type){if(heroV)scene.remove(heroV.m.root);heroV={type:h.type,m:heroModel(h.type),yaw:h.yaw,ph:0};scene.add(heroV.m.root);}
  const m=heroV.m;let dy=h.yaw-heroV.yaw;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;heroV.yaw+=dy*Math.min(1,dt*10);heroV.ph+=dt*(h.moving?10:0);
  m.root.position.set(h.x,h.y+(h.moving?Math.abs(Math.sin(heroV.ph))*.18:Math.sin(t*2)*.03),h.z);m.root.rotation.y=heroV.yaw;const atk=h.atkT>0?Math.sin(h.atkT/.35*Math.PI):0;m.arm.rotation.x=-atk*.6;m.arm.position.z=atk*.5;
  m.body.scale.setScalar(1.45+h.lv*.03);if(h.buffT>0&&Math.random()<dt*10)burst(h.x,h.y+1,h.z,1,2,'#ffb040',.4,.5,{up:2});if(Math.random()<dt*2)burst(h.x,h.y+.2,h.z,1,1,h.H.col,.35,.8,{up:2,grav:-1});}
 else if(heroV){scene.remove(heroV.m.root);heroV=null;}
 // portals & fires
 if(world){for(const p of world.portals)p.material.opacity=.55+Math.sin(t*3)*.2;if(gfx>0)for(const f of world.fires)if(Math.random()<dt*10){parts.emit(f[0]+(Math.random()-.5)*.3,f[1],f[2]+(Math.random()-.5)*.3,0,1.6+Math.random(),0,1,.5+Math.random()*.3,.1,.55,.6);if(Math.random()<.15)smoke.emit(f[0],f[1]+.8,f[2],0,1.2,0,.25,.23,.22,.6,1.2,0,1,1.2);}
  if(world.water)world.water.uT.value=t;}}
/* ================= events ================= */
const near=()=>true;const P3=(x,y,z)=>({x,y,z});
function boomFx(x,y,z,r,c,big,small){const h=y+.3;burst(x,h+.4,z,small?10:big?60:28,r*3.2,[c,'#ffd080','#ffffff'],small?.45:.7,.6,{up:1,drag:2});shocks.fire(x,h,z,c,r*1.15,.45);
 if(!small)decals.add({x,z,r:r*1.1,col:'#2a1a10',mode:2,life:5,fade:1});decals.add({x,z,r:r,col:c,mode:2,life:.4,fade:1,grow:1});puff(x,h+.5,z,small?2:big?9:5,'#8a7a68',big?2.2:1.4,1.1,r);flash(x,h+2,z,c,big?120:50,r*4);if(big)shake=Math.max(shake,.6);}
function float(x,y,z,text,c='#ffd860',size=14){floats.push({x,y,z,text,c,t:0,size});if(floats.length>60)floats.shift();}
function msg(text,cls='',ms=3200){toast($('msgs'),text,ms,4,false).className=cls;}
let bannerT=0;function banner(t,s,cls,dur=3){const b=$('banner');b.querySelector('b').textContent=t;b.querySelector('span').textContent=s||'';b.className='on '+(cls||'');bannerT=dur;}
const DIE_C={brood:['#c8ff60','#7a4a8a'],broodling:['#c8ff60','#7a4a8a'],mender:['#7aff9a','#3a7a5a'],harpy:['#9a8aba','#ffffff'],brute:['#9a9aa8','#ff8a50'],aegis:['#9ad8ff','#c8b070'],jugg:['#ff8a30','#5a5258'],colossus:['#ff6a20','#ffd080']};
let danger=0;
function handle(e){const p=e.t||e.h;switch(e.k){
 case'shot':{const a=e.a;if(e.look==='rifle'){strips.add(a,e.b,e.crit?'#ffd050':'#fff0c0',e.crit?.12:.06,.12);burst(a.x,a.y,a.z,4,3,'#ffd890',.3,.15);burst(e.b.x,e.b.y,e.b.z,e.crit?14:6,4,e.crit?'#ffd050':'#ffe0a0',.35,.25,{grav:4});if(e.crit)float(e.b.x,e.b.y+1.5,e.b.z,'CRIT','#ffd050',16);flash(a.x,a.y,a.z,'#ffd890',20,8);snd.play('rifle',a,.8);}
  else if(e.look==='ball'){burst(a.x,a.y,a.z,6,3,'#ffb060',.4,.2);puff(a.x,a.y,a.z,2,'#b0a698',.9,.6,.4);flash(a.x,a.y,a.z,'#ffa040',25,8);snd.play('ball',a,.7);}
  else if(e.look==='shell'){burst(a.x,a.y,a.z,10,4,'#ffa040',.5,.25,{up:1});puff(a.x,a.y,a.z,3,'#b0a698',1.1,.8,.6);flash(a.x,a.y,a.z,'#ffa040',40,10);snd.play('shell',a,.8);}
  else if(e.look==='arrow')snd.play('arrow',a,.6);else if(e.look==='bolt'){burst(a.x,a.y,a.z,4,2,'#e0b0ff',.35,.3);snd.play('bolt',a,.6);}break;}
 case'arc':{for(let i=0;i<e.pts.length-1;i++){strips.add(e.pts[i],e.pts[i+1],'#c8a0ff',.13,.18,6);strips.add(e.pts[i],e.pts[i+1],'#ffffff',.05,.1,4);}for(const q of e.pts.slice(1))burst(q.x,q.y,q.z,5,3,['#e0c0ff','#ffffff'],.3,.25);flash(e.pts[0].x,e.pts[0].y,e.pts[0].z,'#b080ff',35,10);snd.play('arc',e.pts[0],.7);break;}
 case'pulse':{const t=e.t;shocks.fire(t.x,t.y+.5,t.z,e.fz?'#5a8aa0':'#2a5a78',e.r,.55,.12);decals.add({x:t.x,z:t.z,r:e.r,col:e.fz?'#bff4ff':'#5ab8ff',mode:2,life:.5,fade:1,grow:1});if(gfx>0)for(let i=0;i<(e.fz?24:10);i++){const a=Math.random()*6.28,d=Math.random()*e.r;parts.emit(t.x+Math.cos(a)*d,t.y+.3+Math.random(),t.z+Math.sin(a)*d,0,.6,0,.75,.92,1,.35,.8,.5,1);}snd.play('pulse',t,.6);break;}
 case'hit':{const pp=e.p;if(pp.look==='bolt'){burst(e.x,e.y,e.z,8,3,['#e0b0ff','#ffffff'],.35,.25);}else burst(e.x,e.y,e.z,3,2.5,'#ffe0a0',.25,.18,{grav:4});if(pp.tgt&&pp.tgt.armor>.3&&pp.kind==='phys'&&Math.random()<.4)snd.play('clang',e,.5);else if(Math.random()<.15)snd.play('pop',e,.5);break;}
 case'boom':{const pp=e.p,fire=pp.s&&pp.s.burn;boomFx(e.x,e.y,e.z,e.r,fire?'#ff7a20':pp.look==='shell'?'#ffa040':'#ffc060',pp.look==='shell'&&!e.small,e.small);if(pp.s&&pp.s.patch&&!e.small)decals.add({x:e.x,z:e.z,r:e.r*.8,col:'#ff5a10',mode:1,life:4,fade:1});snd.play('boom',e,e.small?.4:.8);break;}
 case'die':{const u=e.e;const c=DIE_C[u.type]||['#c84a30','#8a6a50'];const big=u.d.boss;burst(u.x,u.y+.8,u.z,big?80:14,big?9:4,[...c,'#ffffff'],big?.8:.38,big?1.2:.5,{grav:7,up:1});if(big){boomFx(u.x,u.y,u.z,4,'#ff8a30',true);snd.play('roar',u,.6);}
  if(u.type==='brood'){decals.add({x:u.x,z:u.z,r:1.4,col:'#5a8a20',mode:2,life:3,fade:1});snd.play('squish',u);}else snd.play('die',u,.6);if(e.g)float(u.x,u.y+1.8,u.z,'+'+e.g,'#ffd860',big?20:13);if(e.g&&Math.random()<.35)snd.play('coin',null,.5);break;}
 case'leak':{const u=e.e;snd.play('leak');$('hLives').classList.remove('hurt');void $('hLives').offsetWidth;$('hLives').classList.add('hurt');msg(`${E[u.type].n} reached the keep · −${e.lk} ${e.lk>1?'lives':'life'}`,'bad',2400);if(world&&world.keep){const k=world.keep.position;burst(k.x,k.y+4,k.z,20,5,['#ff5040','#ffd080'],.5,.6,{up:1});}shake=Math.max(shake,.25);break;}
 case'heal':{for(const o of e.l){strips.add(P3(e.e.x,e.e.y+2,e.e.z),P3(o.x,o.y+1,o.z),'#7aff9a',.08,.3);burst(o.x,o.y+1.2,o.z,4,1.5,'#9affb0',.35,.6,{up:1});}decals.add({x:e.e.x,z:e.e.z,r:4.5,col:'#3aff7a',mode:2,life:.5,fade:1,grow:1});break;}
 case'shieldbreak':{const u=e.e;burst(u.x,u.y+1,u.z,u.d.boss?50:22,5,['#9ad8ff','#ffffff','#5aa8ff'],.4,.6,{grav:6});snd.play('shield',u,.7);float(u.x,u.y+2.2,u.z,'SHIELD BROKEN','#9ad8ff',12);break;}
 case'wave':{const p=e.plan;snd.play('horn');banner('WAVE '+e.w+(e.w===S.waves?' · FINAL':''),p.intel||(e.boss?'A BOSS APPROACHES':'Hold the road'),e.w===S.waves?'red':'',3.2);break;}
 case'waveEnd':{const parts=['+'+e.bonus+' wave bonus'];if(e.interest)parts.push('+'+e.interest+' interest');if(e.mint)parts.push('+'+e.mint+' mint');if(e.lives)parts.push('+'+e.lives+' lives');msg('Wave '+e.w+' cleared · '+parts.join(' · '),'good',4200);snd.play('wave');$('hGold').classList.remove('bump');void $('hGold').offsetWidth;$('hGold').classList.add('bump');break;}
 case'boss':{const u=e.e;banner(E[u.type].n.toUpperCase(),u.d.boss===2?'The final assault — it stuns towers and summons broods':'Armoured siege beast — heavy and piercing damage',  'red',4);snd.play('roar',null,.9);break;}
 case'stomp':{const u=e.e;shocks.fire(u.x,u.y+.3,u.z,'#ff8a40',e.r,.7,.15);decals.add({x:u.x,z:u.z,r:e.r,col:'#ff6a30',mode:2,life:.6,fade:1,grow:1});puff(u.x,u.y+.5,u.z,14,'#7a6a58',2.4,1.4,e.r);snd.play('stomp',u);shake=Math.max(shake,.5);if(e.n)msg(e.n+' tower'+(e.n>1?'s':'')+' stunned by the stomp','bad',2200);break;}
 case'roar':{const u=e.e;banner('THE COLOSSUS ROARS','Its shield rises and a brood pours out','red',3);snd.play('roar',u);shocks.fire(u.x,u.y+3,u.z,'#9ad8ff',8,.8,.6);break;}
 case'build':{const t=e.t;burst(t.x,t.y+.5,t.z,24,4,['#d8c8a0','#ffffff'],.5,.6,{up:1});puff(t.x,t.y+.3,t.z,8,'#a89a88',1.8,1,2);snd.play('build',t);break;}
 case'upgrade':{const t=e.t;burst(t.x,t.y+2,t.z,40,5,[e.p?'#ff7a5a':'#7ab8ff','#ffd860','#ffffff'],.5,.9,{up:1,grav:3});shocks.fire(t.x,t.y+.4,t.z,e.p?'#ff7a5a':'#7ab8ff',3,.5,.3);snd.play('upgrade',t);break;}
 case'sell':{const t=e.t;burst(t.x,t.y+1,t.z,20,4,['#ffd860','#ffffff'],.4,.7,{up:1});puff(t.x,t.y+.5,t.z,8,'#a89a88',2,1,2);float(t.x,t.y+3,t.z,'+'+e.v,'#ffd860',16);snd.play('sell',t);break;}
 case'hero':{const h=e.h;burst(h.x,h.y+1,h.z,30,4,[h.H.col,'#ffffff'],.5,.8,{up:1});shocks.fire(h.x,h.y+.2,h.z,h.H.col,3,.6,.2);snd.play('level',h);break;}
 case'herolvl':{const h=e.h;burst(h.x,h.y+1,h.z,40,5,['#ffd860','#ffffff',h.H.col],.5,1,{up:2});float(h.x,h.y+3,h.z,'LEVEL '+h.lv,'#9ad8ff',18);snd.play('level',h);const A=h.H.ab.find(a=>a.lv===h.lv);if(A)msg(h.H.n+' learned '+A.n+(A===h.H.ab[0]?' (R)':' (T)'),'good',4000);break;}
 case'warcry':{const h=e.h;shocks.fire(h.x,h.y+.5,h.z,'#ffb040',12,.8,.2);decals.add({x:h.x,z:h.z,r:12,col:'#ffb040',mode:2,life:.8,fade:1,grow:1});snd.play('warcry',h);break;}
 case'skyfall':{const y=H(e.x,e.z);strips.add(P3(e.x,y+30,e.z),P3(e.x,y,e.z),'#bfe8ff',.4,.35);boomFx(e.x,y,e.z,3.6,'#9ad8ff',true);snd.play('skyfall',P3(e.x,y,e.z));break;}
 case'nova':{const h=e.h;shocks.fire(h.x,h.y+.5,h.z,'#bff4ff',9,.8,.3);decals.add({x:h.x,z:h.z,r:9,col:'#9ae8ff',mode:2,life:.8,fade:1,grow:1});burst(h.x,h.y+1,h.z,60,10,['#bff4ff','#ffffff'],.5,.9,{flat:1});snd.play('nova',h);break;}
 case'tempest':snd.play('thunder');break;
 case'strike':{strips.add(P3(e.x+(Math.random()-.5)*3,e.y+24,e.z),P3(e.x,e.y+.5,e.z),'#e0c0ff',.25,.3,10);strips.add(P3(e.x,e.y+24,e.z),P3(e.x,e.y+.5,e.z),'#ffffff',.08,.2,8);burst(e.x,e.y+.5,e.z,16,5,['#e0c0ff','#ffffff'],.45,.4,{up:1});flash(e.x,e.y+2,e.z,'#c8a0ff',80,14);snd.play('thunder',e);break;}
 case'lance':{burst(e.x,e.y+.8,e.z,8,4,['#bfe8ff','#ffffff'],.35,.3,{grav:5});snd.play('lance',e,.7);break;}
 case'early':msg('+'+e.g+' gold for calling the wave early','good',2600);snd.play('coin');break;}}
function processEvents(){for(const e of S.ev){try{handle(e);}catch(err){console.error(err);}}S.ev.length=0;}
/* ================= portraits ================= */
const portraits={};let prt=null;
function portrait(key,build,dist,hy){if(portraits[key])return portraits[key];const N=128;
 if(!prt){const ps=new THREE.Scene();ps.add(new THREE.HemisphereLight(0xffffff,0x8a7a68,2.4));const dl=new THREE.DirectionalLight(0xfff0e0,3.6);dl.position.set(3,6,4);ps.add(dl);const rl=new THREE.DirectionalLight(0xa8c0ff,1.8);rl.position.set(-4,2,-3);ps.add(rl);
  prt={ps,rt:new THREE.WebGLRenderTarget(N,N,{samples:4}),pc:new THREE.PerspectiveCamera(30,1,.1,200),buf:new Uint8Array(N*N*4),cv:document.createElement('canvas')};prt.cv.width=prt.cv.height=N;}
 const{ps,rt,pc,buf,cv}=prt;const grp=build();grp.rotation.y=.6;ps.add(grp);pc.position.set(dist*.42,hy+dist*.4,dist*.85);pc.lookAt(0,hy,0);
 const pr=R.getPixelRatio(),tm=R.toneMapping;R.setPixelRatio(1);R.setRenderTarget(rt);R.setClearColor(0x000000,0);R.clear();R.render(ps,pc);R.readRenderTargetPixels(rt,0,0,N,N,buf);R.setRenderTarget(null);R.setPixelRatio(pr);R.setClearColor(0x000000,1);ps.remove(grp);
 const x=cv.getContext('2d'),img=x.createImageData(N,N);for(let j=0;j<N;j++)for(let i=0;i<N;i++){const s=((N-1-j)*N+i)*4,t=(j*N+i)*4;const a=buf[s+3];for(let k=0;k<3;k++){const v=a?buf[s+k]/a:0;img.data[t+k]=Math.min(255,Math.pow(v,1/2.2)*255*1.05);}img.data[t+3]=a;}
 x.clearRect(0,0,N,N);x.putImageData(img,0,0);return portraits[key]=cv.toDataURL('image/png');}
const tPort=(type,a=0,b=0)=>portrait('t'+type+a+b,()=>towerModel(type,a,b).root,type==='sniper'?13:type==='tesla'?11:10,type==='sniper'?2.8:type==='mortar'?1:2);
const ePort=type=>portrait('e'+type,()=>{const g=enemyGeo(type),grp=new THREE.Group();grp.add(new THREE.Mesh(g.s,unitMat));if(g.g)grp.add(new THREE.Mesh(g.g,MAT.glow));if(g.wing){const a=new THREE.Mesh(g.wing,unitMat);a.position.y=g.wy;const b=a.clone();b.rotation.y=Math.PI;grp.add(a,b);}return grp;},type==='colossus'?17:type==='jugg'?9:4.6,type==='colossus'?3.4:type==='jugg'?1.4:type==='harpy'?1:.9);
const hPort=type=>portrait('h'+type,()=>heroModel(type).root,6.5,1.6);
/* ================= input ================= */
const I=controls(canvas,{canLock:()=>false,menu:()=>true,onKey:(e,first)=>{if(app!=='play')return;if(['Tab','Space','Backspace','Delete'].includes(e.code))e.preventDefault();if(first)keyDown(e);}});
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitP=new THREE.Vector3(),prj=new THREE.Vector3();
function groundAt(px,py){ndc.set(px/innerWidth*2-1,-(py/innerHeight)*2+1);ray.setFromCamera(ndc,camera);let y=0;for(let k=0;k<3;k++){plane.constant=-y;if(!ray.ray.intersectPlane(plane,hitP))return null;y=H(hitP.x,hitP.z);}return[hitP.x,hitP.z];}
function scr(x,y,z){prj.set(x,y,z).project(camera);return[(prj.x*.5+.5)*innerWidth,(-prj.y*.5+.5)*innerHeight,prj.z];}
function pickAt(px,py){if(!S)return null;let best=null,bd=1e9;const cand=[...S.towers];if(S.hero)cand.push(S.hero);for(const t of cand){const y=t.y??H(t.x,t.z);for(const hy of[.8,2.2]){const[sx,sy,sz]=scr(t.x,y+hy,t.z);if(sz>1)continue;const d=Math.hypot(sx-px,sy-py);if(d<34&&d<bd){bd=d;best=t;}}}return best;}
const ptrs=new Map();let drag=null,pinch=null;
canvas.addEventListener('pointerdown',e=>{snd.init();if(app!=='play')return;canvas.setPointerCapture?.(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t:performance.now(),btn:e.button,type:e.pointerType});mx=e.clientX;my=e.clientY;mIn=true;
 if(e.button===2){cancel();return;}if(ptrs.size===2){const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),dist:cam.td};drag=null;}else drag={moved:false,cx:cam.tx,cz:cam.tz};});
canvas.addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;mIn=true;const p=ptrs.get(e.pointerId);if(!p)return;p.x=e.clientX;p.y=e.clientY;
 if(pinch&&ptrs.size>=2){const[a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);cam.td=cl(pinch.dist*pinch.d/Math.max(20,d),28,110);return;}
 if(drag&&(p.btn===0||p.type==='touch')){const dd=Math.hypot(p.x-p.x0,p.y-p.y0);if(dd>9&&!(placing&&p.type!=='touch'))drag.moved=true;if(drag.moved){const k=cam.dist/innerHeight*1.15,dx=p.x-p.x0,dy=p.y-p.y0,c=Math.cos(cam.yaw),s=Math.sin(cam.yaw);
   cam.tx=cl(drag.cx-(dx*c+dy*s*1.25)*k,-W,W);cam.tz=cl(drag.cz-(-dx*s+dy*c*1.25)*k,-D,D);}}});
const up=e=>{const p=ptrs.get(e.pointerId);ptrs.delete(e.pointerId);if(!p||app!=='play')return;if(pinch){if(ptrs.size<2)pinch=null;drag=null;return;}const moved=drag&&drag.moved;drag=null;if(p.btn!==0&&p.type!=='touch')return;if(!moved&&!paused)tap(p.x,p.y,e.shiftKey);};
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);drag=null;pinch=null;});canvas.addEventListener('pointerleave',()=>{mIn=false;});
addEventListener('wheel',e=>{if(app==='play'&&e.target===canvas)cam.td=cl(cam.td+Math.sign(e.deltaY)*6,28,110);},{passive:true});
function tap(px,py,shift){const g=groundAt(px,py);
 if(placing&&placing!=='move'){if(!g)return;const[x,z]=g;if(placing==='hero'){const why=S.placeHero(x,z);if(why){deny(why);return;}setPlacing(null);select(S.hero);return;}
  const r=S.build(placing,x,z);if(typeof r==='string'){deny(r);return;}if(!shift)setPlacing(null);select(shift?null:r);return;}
 if(placing==='move'){if(!g)return;const why=S.moveHero(g[0],g[1]);if(why){deny(why);return;}decals.add({x:g[0],z:g[1],r:1,col:'#9ad8ff',mode:2,life:.4,fade:1,grow:1});snd.play('click');setPlacing(null);return;}
 const t=pickAt(px,py);if(t){select(t);snd.play('click');return;}
 if(sel===S.hero&&S.hero&&g&&!S.moveHero(g[0],g[1])){decals.add({x:g[0],z:g[1],r:1,col:'#9ad8ff',mode:2,life:.4,fade:1,grow:1});snd.play('click');return;}select(null);}
function deny(why){msg(why,'bad',1800);snd.play('deny');}
function cancel(){if(placing){setPlacing(null);return;}select(null);}
function setPlacing(p){placing=p;document.body.classList.toggle('place',!!p);setGhost(p&&p!=='move'?p:null);if(p&&p!=='move')select(null,true);towerSig='';}
function select(t,keepPlace){sel=t;if(!keepPlace&&placing&&t)setPlacing(null);panelSig='';}
function startPlace(type){if(!S||S.over)return;if(placing===type){setPlacing(null);return;}if(type!=='hero'&&S.gold<T[type].c){deny('Not enough gold for '+T[type].n.toLowerCase());return;}setPlacing(type);snd.play('click');}
function heroKey(){if(!S)return;if(!S.hero)startPlace('hero');else{select(sel===S.hero?null:S.hero);if(sel){cam.tx=S.hero.x;cam.tz=S.hero.z;}}}
function doUp(t,p){const why=S.upgrade(t,p);if(why)deny(why);panelSig='';}
function setSpd(v){spd=v;const b=$('spd');b.querySelector('b').textContent='x'+v;b.className='pill'+(v>1?' x'+v:'');}
function keyDown(e){const c=e.code;
 if(c==='Escape'||c==='KeyP'){if(c==='Escape'&&(placing||sel)){cancel();return;}togglePause();return;}if(paused)return;
 if(c.startsWith('Digit')){const i=+c.slice(5)-1;if(TOWER_LIST[i])startPlace(TOWER_LIST[i]);return;}
 if(c==='Space'){callWave();return;}if(c==='KeyF'){setSpd(spd%3+1);return;}if(c==='KeyH'){heroKey();return;}if(c==='KeyC'){fitCam();return;}
 if(c==='KeyR'||c==='KeyT'){const why=S.ability(c==='KeyR'?0:1);if(why)deny(why);panelSig='';return;}
 if(sel&&sel!==S.hero&&S.towers.includes(sel)){if(c==='KeyZ'||c==='Comma')doUp(sel,0);else if(c==='KeyX'||c==='Period')doUp(sel,1);else if(c==='Tab'){S.cycle(sel,e.shiftKey?-1:1);panelSig='';snd.play('click');}else if(c==='Delete'||c==='Backspace'){S.sell(sel);select(null);}}
 if(sel===S.hero&&c==='KeyM')setPlacing('move');}
function callWave(){if(!S||S.over)return;if(S.callWave())snd.play('click');else deny(S.wave>=S.waves?'That was the last wave':'Wave already marching');}
/* ================= camera ================= */
function fitCam(){const asp=innerWidth/innerHeight;const port=asp<.95;cam.tyaw=port?Math.PI/2:0;const hw=(port?D:W)+3,hd=(port?W:D)+4;const tv=Math.tan(camera.fov*Math.PI/360),th=tv*Math.max(asp,.3);
 cam.td=cl(Math.max(hw/th,hd*.82/tv)*1.16,40,160);cam.tx=0;cam.tz=port?0:3;}
function cameraUpdate(dt){if(app==='play'&&!paused){const k=dt*cam.dist*.9;let dx=0,dz=0;if(I.keys.KeyW||I.keys.ArrowUp)dz-=1;if(I.keys.KeyS||I.keys.ArrowDown)dz+=1;if(I.keys.KeyA||I.keys.ArrowLeft)dx-=1;if(I.keys.KeyD||I.keys.ArrowRight)dx+=1;
  if(I.keys.KeyQ)cam.tyaw-=dt*1.6;if(I.keys.KeyE)cam.tyaw+=dt*1.6;const c=Math.cos(cam.yaw),s=Math.sin(cam.yaw);cam.tx=cl(cam.tx+(dx*c+dz*s)*k,-W,W);cam.tz=cl(cam.tz+(-dx*s+dz*c)*k,-D,D);}
 else if(app==='menu'){cam.tyaw=Math.sin(menuT*.05)*.35;cam.tx=6;cam.tz=2;cam.td=Math.max(60,cam.td);}
 const f=Math.min(1,dt*8);cam.x+=(cam.tx-cam.x)*f;cam.z+=(cam.tz-cam.z)*f;cam.dist+=(cam.td-cam.dist)*f;cam.yaw+=(cam.tyaw-cam.yaw)*Math.min(1,dt*5);
 const pitch=(50+cl((cam.dist-40)/70,0,1)*8)*Math.PI/180;camera.position.set(cam.x+Math.sin(cam.yaw)*Math.cos(pitch)*cam.dist,Math.sin(pitch)*cam.dist,cam.z+Math.cos(cam.yaw)*Math.cos(pitch)*cam.dist);camera.lookAt(cam.x,0,cam.z);
 if(shake>0){shake=Math.max(0,shake-dt*2.2);const s=shake*shake*.6;camera.position.x+=(Math.random()-.5)*s;camera.position.y+=(Math.random()-.5)*s;}
 snd.listener(cam.x,10,cam.z,cam.yaw);}
function ghostUpdate(){rangeMesh.visible=minRange.visible=false;if(app!=='play'||!S)return;rangeMat.uniforms.uT.value=menuT;
 const ring=(x,z,r,c,m=rangeMesh)=>{m.visible=true;m.position.set(x,H(x,z)+.2,z);m.scale.setScalar(r);m.material.uniforms.uC.value.set(c);};
 if(placing&&placing!=='move'&&ghost){const g=mIn?groundAt(mx,my):null;ghost.root.visible=!!g;if(!g)return;const[x,z]=g;ghostXZ=g;const why=placing==='hero'?S.M.canBuild(x,z,S.towers,null):S.M.canBuild(x,z,S.towers,S.hero);ghostOK=!why&&(placing==='hero'||S.gold>=T[placing].c);
  ghost.root.position.set(x,H(x,z),z);MAT.ghost.color.set(ghostOK?'#9affb0':'#ff6a5a');const s=placing==='hero'?HEROES[S.heroType].s:tstats(placing,0,0);if(s.range)ring(x,z,s.range,ghostOK?'#ffffff':'#ff6a5a');if(s.min)ring(x,z,s.min,'#ff6a4a',minRange);return;}
 if(placing==='move'&&S.hero){ring(S.hero.x,S.hero.z,S.hero.s.range,'#9ad8ff');return;}
 if(sel){if(sel===S.hero){ring(sel.x,sel.z,sel.s.range,'#9ad8ff');}else if(S.towers.includes(sel)){if(sel.s.range)ring(sel.x,sel.z,sel.s.range,'#ffe9a8');if(sel.s.min)ring(sel.x,sel.z,sel.s.min,'#ff6a4a',minRange);}else sel=null;}}
/* ================= HUD ================= */
let towerSig='',panelSig='',prevSig='';
function buildBar(){const host=$('towers');host.innerHTML='';const hc=document.createElement('div');hc.className='tc hero';hc.id='heroCard';hc.innerHTML=`<kbd>H</kbd><img alt=""><b></b><span class="c"></span><div class="xp"><i></i></div>`;hc.onclick=()=>{snd.init();heroKey();};host.appendChild(hc);
 const sp=document.createElement('div');sp.className='sep';host.appendChild(sp);
 TOWER_LIST.forEach((k,i)=>{const d=document.createElement('div');d.className='tc';d.dataset.k=k;d.innerHTML=`<kbd>${i+1}</kbd><img alt="" src="${tPort(k)}"><b>${T[k].n.split(' ').slice(-1)[0]}</b><span class="c">${T[k].c}</span>`;
  d.onclick=()=>{snd.init();startPlace(k);};d.onmouseenter=()=>tip(d,`<h4>${T[k].n}</h4><p class="c">${T[k].c} gold · ${T[k].role}</p><p>${T[k].desc}</p>`);d.onmouseleave=()=>tip(null);host.appendChild(d);});}
function tip(el,html){const t=$('tip');if(!el){t.hidden=true;return;}t.innerHTML=html;t.hidden=false;const r=el.getBoundingClientRect();t.style.left=cl(r.left+r.width/2-130,6,innerWidth-270)+'px';t.style.top=(r.top-t.offsetHeight-10)+'px';}
function hudUpdate(){const g=Math.floor(S.gold);$('hLives').textContent=S.lives;$('hGold').textContent=g;$('hWave').textContent=Math.min(S.wave,S.waves)+'/'+S.waves;const left=S.len-S.t;$('hClock').textContent=fmtT(left);$('hClock').style.color=left<60?'#ff7a6a':'';
 const sig=g+'|'+placing+'|'+(S.hero?S.hero.lv+':'+Math.floor(S.hero.xp):'');if(sig!==towerSig){towerSig=sig;document.querySelectorAll('#towers .tc[data-k]').forEach(d=>{const k=d.dataset.k;d.classList.toggle('no',S.gold<T[k].c);d.classList.toggle('on',placing===k);});
  const hc=$('heroCard');if(hc){const H0=HEROES[S.heroType],h=S.hero;hc.querySelector('img').src=hPort(S.heroType);hc.querySelector('b').textContent=H0.n;hc.querySelector('.c').textContent=h?'LV '+h.lv:'PLACE';hc.classList.toggle('want',!h);hc.classList.toggle('on',placing==='hero'||sel===h&&!!h);
   hc.querySelector('.xp i').style.width=h?(h.lv>=10?100:cl((h.xp-HERO_XP[h.lv-1])/(HERO_XP[h.lv]-HERO_XP[h.lv-1])*100,0,100))+'%':'0';}}
 // next wave button
 const nb=$('nextB');if(S.wave>=S.waves){nb.className='next busy';$('nextL').textContent='FINAL WAVE';$('nextT').textContent=S.enemies.some(e=>e.alive)?'hold the line':'';}
 else if(S.next==null){nb.className='next busy';$('nextL').textContent='WAVE '+S.wave+' MARCHING';$('nextT').textContent='';}
 else{nb.className='next'+(S.wave===0?' pulse':'');$('nextL').textContent=(S.wave===0?'START ':'CALL ')+'WAVE '+(S.wave+1);$('nextT').textContent=S.wave===0?'auto in '+Math.ceil(S.next)+'s':'in '+Math.ceil(S.next)+'s · early bonus +'+Math.round(S.next*2.2);}
 // wave preview
 const p=S.plan;const psig=S.wave>=S.waves?'none':p.w+':'+(S.next==null?0:1);if(psig!==prevSig){prevSig=psig;const host=$('preview');if(S.wave>=S.waves||S.next==null&&S.wave>0&&p.w===S.wave){host.innerHTML='';}
  else{host.innerHTML=`<div class="lab">NEXT · WAVE ${p.w}</div>`+Object.entries(p.counts).sort((a,b)=>(E[b[0]].boss||0)-(E[a[0]].boss||0)||b[1]-a[1]).map(([k,n])=>`<div class="ch ${E[k].fly?'fly':''} ${E[k].boss?'boss':''}" title="${E[k].n}: ${E[k].d}"><img alt="" src="${ePort(k)}">${n}</div>`).join('')+(p.intel?`<div class="intel">${p.intel}</div>`:'');}}
 // boss bar
 const boss=S.enemies.find(e=>e.alive&&e.d.boss);$('boss').hidden=!boss;if(boss){$('bossN').textContent=E[boss.type].n.toUpperCase()+(boss.elite?' · ELITE':'');$('bossHp').style.width=(boss.hp/boss.mhp*100)+'%';$('bossSh').style.width=(boss.mshield?boss.shield/boss.mshield*100:0)+'%';}
 panelUpdate();}
function panelUpdate(){const pn=$('panel');if(!sel||!S||(sel!==S.hero&&!S.towers.includes(sel))){if(!pn.hidden)pn.hidden=true;return;}pn.hidden=false;
 if(sel===S.hero){const h=sel;const sig='h'+h.lv+'|'+h.ab.map(a=>Math.ceil(a)).join()+'|'+Math.floor(h.xp/10)+h.kills+'|'+placing;if(sig===panelSig)return;panelSig=sig;const Hd=h.H,nx=h.lv>=10?1:(h.xp-HERO_XP[h.lv-1])/(HERO_XP[h.lv]-HERO_XP[h.lv-1]);
  pn.innerHTML=`<div class="hd"><img alt="" src="${hPort(h.type)}"><div><h3>${Hd.n}</h3><div class="role">${Hd.t.toUpperCase()} · LEVEL ${h.lv}${h.lv>=10?' · MAX':''}</div></div><button class="x" id="px">✕</button></div>
  <div class="xpb"><i style="width:${cl(nx,0,1)*100}%"></i></div><div class="sts"><span>DMG <b>${Math.round(h.s.dmg)}</b></span><span>RATE <b>${h.s.rate.toFixed(2)}/s</b></span><span>RANGE <b>${h.s.range.toFixed(1)}</b></span><span>${KIND_N[h.s.kind]}</span><span>${h.s.air?'HITS FLYERS':'GROUND ONLY'}</span><span>KILLS <b>${h.kills}</b></span></div>
  <div class="ab">${Hd.ab.map((a,i)=>{const lock=h.lv<a.lv,cd=h.ab[i]>0;return`<button data-ab="${i}" class="${lock?'lock':cd?'cd':''}"><kbd>${i?'T':'R'}</kbd><div><b>${a.n}</b> ${lock?'· LV '+a.lv:cd?'· '+Math.ceil(h.ab[i])+'s':'· READY'}<br><span>${a.d}</span></div>${cd&&!lock?`<i style="width:${(1-h.ab[i]/a.cd)*100}%"></i>`:''}</button>`;}).join('')}</div>
  <div class="prow"><button id="pmove">${placing==='move'?'CLICK THE GROUND…':'MOVE HERO'} <kbd>M</kbd></button></div>`;
  pn.querySelectorAll('[data-ab]').forEach(b=>b.onclick=()=>{const why=S.ability(+b.dataset.ab);if(why)deny(why);panelSig='';});$('pmove').onclick=()=>setPlacing(placing==='move'?null:'move');$('px').onclick=()=>select(null);return;}
 const t=sel,d=T[t.type],s=t.s;const sig=t.id+'|'+t.a+t.b+'|'+t.mode+'|'+Math.floor(S.gold/10)+'|'+t.kills;if(sig===panelSig)return;panelSig=sig;
 const path=p=>{const tier=p?t.b:t.a,why=S.canUp(t,p),u=d.p[p][tier];const pips=[0,1,2].map(i=>`<i class="${i<tier?'on':''}"></i>`).join('');
  if(!u)return`<div class="path ${p?'B':'A'}"><div class="pips">${pips}</div><div class="nm">${d.p[p][2].n}</div><p>Path complete.</p><button class="lock">MAXED</button></div>`;
  const cost=u.c,ok=!why&&S.gold>=cost;return`<div class="path ${p?'B':'A'}"><div class="pips">${pips}</div><div class="nm">${u.n}</div><p>${why&&why!=='Path complete'?'<span style="color:#ff9a8a">Locked: the other path is specialised.</span>':u.d}</p><button data-up="${p}" class="${why?'lock':ok?'':'no'}">${why?'LOCKED':cost+' GOLD'}<kbd>${p?'X':'Z'}</kbd></button></div>`;};
 const st=s.eco?`<span>GOLD / WAVE <b>${s.gold}</b></span>${s.cap?`<span>INTEREST CAP <b>+${s.cap}</b></span>`:''}${s.lives?`<span>LIVES / WAVE <b>+${s.lives}</b></span>`:''}`:
  `<span>DMG <b>${Math.round(s.dmg)}</b>${s.shots>1?' ×'+s.shots:''}${s.chain?' ×'+s.chain+' jumps':''}</span><span>RATE <b>${s.rate.toFixed(2)}/s</b></span><span>RANGE <b>${s.range}</b></span><span>${KIND_N[s.kind]}</span><span>${s.air?'HITS FLYERS':'GROUND ONLY'}</span>${s.splash?`<span>SPLASH <b>${s.splash.toFixed(1)}</b></span>`:''}<span>KILLS <b>${t.kills}</b></span><span>DMG DEALT <b>${Math.round(t.dmg)}</b></span>`;
 pn.innerHTML=`<div class="hd"><img alt="" src="${tPort(t.type,t.a,t.b)}"><div><h3>${d.n}</h3><div class="role">${d.role.toUpperCase()} · ${t.a}-${t.b}</div></div><button class="x" id="px">✕</button></div><div class="sts">${st}</div>
  ${s.eco?'':`<div class="tgt">${['first','last','strong','close'].map(m=>`<button data-m="${m}" class="${t.mode===m?'on':''}">${m.toUpperCase()}</button>`).join('')}</div>`}
  <div class="paths">${path(0)}${path(1)}</div><div class="prow"><button class="sell" id="psell">SELL +${S.sellValue(t)} <kbd>DEL</kbd></button>${s.eco?'':'<button id="pcyc">TARGET <kbd>TAB</kbd></button>'}</div>`;
 pn.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>doUp(t,+b.dataset.up));pn.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{t.mode=b.dataset.m;panelSig='';snd.play('click');});
 $('psell').onclick=()=>{S.sell(t);select(null);};if($('pcyc'))$('pcyc').onclick=()=>{S.cycle(t);panelSig='';};$('px').onclick=()=>select(null);}
/* ================= overlay: health bars and floating text ================= */
function overlay(dt){const dpr=ov.width/innerWidth;ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,innerWidth,innerHeight);if(!S||app==='menu'||noHud)return;
 for(const e of S.enemies){if(!e.alive)continue;const boss=e.d.boss;if(e.hp>=e.mhp&&!e.shield&&!e.elite&&!boss)continue;const hh=(e.d.r*3.3+1.2)*(boss===2?3.6:boss?2:1)*(e.elite?1.12:1);const[sx,sy,sz]=scr(e.x,e.y+hh,e.z);if(sz>1||sx<-40||sx>innerWidth+40)continue;
  const w=boss?70:e.d.r>.55?34:26,h=boss?7:4;ox.fillStyle='rgba(0,0,0,.6)';ox.fillRect(sx-w/2-1,sy-1,w+2,h+2);const f=e.hp/e.mhp;ox.fillStyle=f>.5?'#6ae07a':f>.25?'#f0c040':'#ff5040';ox.fillRect(sx-w/2,sy,w*f,h);
  if(e.shield>0){ox.fillStyle='#8ad0ff';ox.fillRect(sx-w/2,sy-3,w*e.shield/Math.max(1,e.mshield),2.5);}if(e.elite){ox.strokeStyle='#ffd050';ox.lineWidth=1;ox.strokeRect(sx-w/2-1.5,sy-1.5,w+3,h+3);}
  if(e.d.armor&&e.armor>0){ox.fillStyle=e.sundT>0?'#ff8a50':'#c8c8d0';ox.beginPath();ox.moveTo(sx-w/2-7,sy-1);ox.lineTo(sx-w/2-2,sy-1);ox.lineTo(sx-w/2-2,sy+3);ox.lineTo(sx-w/2-4.5,sy+6);ox.lineTo(sx-w/2-7,sy+3);ox.fill();}}
 ox.textAlign='center';for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.t+=dt;if(f.t>1.1){floats.splice(i,1);continue;}const[sx,sy,sz]=scr(f.x,f.y+f.t*1.6,f.z);if(sz>1)continue;ox.globalAlpha=Math.min(1,(1.1-f.t)*3);
  ox.font=`400 ${f.size}px Anton, Impact, sans-serif`;ox.lineWidth=3;ox.strokeStyle='rgba(0,0,0,.7)';ox.strokeText(f.text,sx,sy);ox.fillStyle=f.c;ox.fillText(f.text,sx,sy);}ox.globalAlpha=1;}
/* ================= menu ================= */
function mapThumb(i){const c=document.createElement('canvas');c.width=320;c.height=180;const x=c.getContext('2d');const M=makeMap(i),Dm=MAPS[i];const sx=v=>(v+W)/(W*2)*320,sz=v=>(v+D)/(D*2)*180;
 const g=x.createLinearGradient(0,0,0,180);g.addColorStop(0,Dm.snow?'#7a8a6a':Dm.city?'#6a6450':'#5a8a48');g.addColorStop(1,Dm.snow?'#4a6a3a':Dm.city?'#4a4438':'#3a6a30');x.fillStyle=g;x.fillRect(0,0,320,180);
 for(let j=0;j<60;j++)for(let k=0;k<106;k++){const wx=-W+k,wz=-D+j;const h=M.height(wx,wz);if(h>1.4){x.fillStyle=h>3.4&&Dm.snow?'rgba(240,244,250,.9)':'rgba(130,124,112,.75)';x.fillRect(sx(wx),sz(wz),3.2,3.2);}if(M.water!=null&&M.riverD(wx,wz)<3.6){x.fillStyle='#3a8a9a';x.fillRect(sx(wx),sz(wz),3.2,3.2);}}
 for(const b of M.blocks){x.fillStyle='#8a7e6e';x.fillRect(sx(b.x-b.w/2),sz(b.z-b.d/2),b.w*3,b.d*2.8);}
 for(const P of M.paths){x.strokeStyle='rgba(60,40,20,.6)';x.lineWidth=9;x.lineJoin=x.lineCap='round';x.beginPath();for(let k=0;k<P.n;k+=2)k?x.lineTo(sx(P.X[k]),sz(P.Z[k])):x.moveTo(sx(P.X[k]),sz(P.Z[k]));x.stroke();x.strokeStyle='#d8c090';x.lineWidth=5;x.stroke();}
 for(const s of M.start){x.fillStyle='#ff4a20';x.beginPath();x.arc(sx(s[0]),sz(s[1]),7,0,7);x.fill();}const e=M.end[0];x.fillStyle='#4a8aff';x.fillRect(sx(e[0])-9,sz(e[1])-9,18,18);x.strokeStyle='#fff';x.lineWidth=2;x.strokeRect(sx(e[0])-9,sz(e[1])-9,18,18);return c.toDataURL('image/jpeg',.85);}
function buildMenu(){const host=$('maps');host.innerHTML='';MAPS.forEach((m,i)=>{const b=document.createElement('button');b.className='mapc'+(opt.map===i?' on':'');const best=bestScore(ID+'_'+m.id);
  b.innerHTML=`<img alt="" src="${mapThumb(i)}"><div><h3>${m.n}${best?`<span class="st3">BEST ${best}</span>`:''}</h3><p>${m.d}</p></div>`;b.onclick=()=>{opt.map=i;save();buildMenu();demo();snd.init();};host.appendChild(b);});
 $('o-hero').innerHTML=Object.entries(HEROES).map(([k,h])=>`<button data-v="${k}">${h.n} · ${h.t.toUpperCase()}</button>`).join('');
 const seg=pickers(opt,save);seg('o-diff','diff',true,descr);seg('o-waves','waves',true,descr);seg('o-hero','hero',false,descr);descr();$('best').textContent=bestScore(ID)?'BEST '+bestScore(ID):'';}
function descr(){const Df=DIFF[opt.diff],Hh=HEROES[opt.hero]||HEROES.wren;$('mapd').innerHTML=`<b>${Df.n}</b>: ${Df.lives} lives, ${Df.gold} gold to start${Df.adapt?', the warlord adapts to your defences'+(opt.diff===2?' and sends elites with healers':''):', the warlord sends plain waves'}. ${opt.waves} waves, the last one a boss. <b>${Hh.n}</b>: ${Hh.d}`;}
function demo(){S=new Sim({map:opt.map,diff:0,waves:12,hero:opt.hero});auto=new Autopilot(S,3);setWorld(opt.map);clearViews();for(let i=0;i<(FAST?60:30)*(FAST?6:40);i++){auto.update(1/30);S.step(1/30);S.ev.length=0;}fitCam();cam.x=cam.tx;cam.z=cam.tz;cam.dist=cam.td;}
function clearViews(){for(const[,v]of tviews)scene.remove(v.m.root);tviews.clear();if(heroV){scene.remove(heroV.m.root);heroV=null;}parts.clear();smoke.clear();decals.clear();shocks.clear();strips.clear();floats.length=0;setGhost(null);}
/* ================= round ================= */
function start(o={}){snd.init();const map=o.map??opt.map,diff=o.diff??opt.diff,waves=o.waves??opt.waves,hero=o.hero??opt.hero;
 S=new Sim({map,diff,waves,hero});auto=o.autopilot?new Autopilot(S,o.skill||2):null;app='play';paused=false;lastAward=null;sel=null;setPlacing(null);setSpd(o.spd||1);setWorld(map);clearViews();towerSig=panelSig=prevSig='';
 fitCam();cam.x=cam.tx;cam.z=cam.tz;cam.dist=cam.td;cam.yaw=cam.tyaw;$('menu').hidden=true;$('over').hidden=true;$('keys').hidden=true;$('pause').hidden=true;$('hud').hidden=noHud;document.body.classList.add('playing');buildBar();
 snd.music(true,0);snd.play('horn');banner(MAPS[map].n,`${DIFF[diff].n} · ${waves} WAVES · place towers beside the road`,'',4);setTimeout(()=>{if(app==='play'&&!S.hero&&S.wave===0)msg('Tip: press H (or tap the hero card) to place '+HEROES[hero].n+' for free','info',6000);},4200);}
function togglePause(){if(app!=='play')return;paused=!paused;$('pause').hidden=!paused;}
function toMenu(){app='menu';paused=false;$('pause').hidden=true;$('over').hidden=true;$('hud').hidden=true;$('menu').hidden=false;document.body.classList.remove('playing');snd.music(false);sel=null;setPlacing(null);buildMenu();demo();}
function finish(){if(app!=='play')return;app='over';const o=S.over,st=S.st,won=o.win===1;const survived=won?S.waves:Math.max(0,o.why==='time'?st.cleared:S.wave-1);const lf=S.lives/S.lives0;
 const stars=won?(lf>=.9?3:lf>=.5?2:1):0;const Df=DIFF[S.diff];const pts=Math.round((survived*400+st.kills*4+S.lives*20+stars*1500+(won?3000:0))*Df.pts*(S.waves/25*.6+.4));
 const tok=4+stars*4+Math.floor(survived/3);addRound(tok,won);saveBest(ID,pts);saveBest(ID+'_'+S.M.id,pts);
 const mvp=S.towers.slice().sort((a,b)=>b.dmg-a.dmg)[0];
 lastAward={pts,won,stars,survived,waves:S.waves,leaks:st.leaks,lives:S.lives,built:st.built,upg:st.upg,kills:st.kills,earned:st.earned,hero:S.hero?S.hero.lv:0,map:MAPS[S.M.idx].n,diff:Df.n,why:o.why,time:fmtT(S.t),tok,mvp:mvp?T[mvp.type].n:'-'};
 snd.music(false);setTimeout(()=>{if(app!=='over')return;snd.play(won?'win':'lose');const L=lastAward;
  $('ores').textContent=won?'BASTION HELD':o.why==='time'?'TIME RAN OUT':'BASTION FALLEN';$('ores').className='res '+(won?'w':o.why==='time'?'d':'l');$('oeye').textContent=`${L.map} · ${L.diff} · ${L.waves} WAVES · ${L.time}`;
  $('owhy').textContent=won?(stars===3?'FLAWLESS DEFENCE':stars===2?'THE WALLS HELD':'BARELY HELD'):o.why==='time'?`THE ROUND CLOCK EXPIRED ON WAVE ${S.wave}`:`OVERRUN ON WAVE ${S.wave}`;
  document.querySelectorAll('#ostars i').forEach((s,i)=>s.className=i<stars?'on':'');
  const cell=(v,l,hl)=>`<div class="${hl?'hl':''}"><b>${v}</b><span>${l}</span></div>`;
  $('otable').innerHTML=cell(L.survived+'/'+L.waves,'WAVES SURVIVED',1)+cell(L.leaks,'LEAKS')+cell(L.lives,'LIVES LEFT')+cell(L.built,'TOWERS BUILT')+cell(L.upg,'UPGRADES')+cell(L.kills,'ENEMIES SLAIN')+cell(L.earned,'GOLD EARNED')+cell('LV '+L.hero,'HERO');
  $('otok').innerHTML=`POINTS <b>${pts}</b> · ${'★'.repeat(stars)||'NO STARS'} · MVP <b>${L.mvp}</b> · +${tok} TOKENS · BEST ${bestScore(ID)}`;$('over').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing');},FAST?0:2200);}
/* ================= loop ================= */
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const dpr=Math.min(devicePixelRatio,2);ov.width=w*dpr;ov.height=h*dpr;
 parts.U.uScale.value=smoke.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));if(fxStack)fxStack.setSize(w,h);if(app==='play'&&S&&S.t<1)fitCam();}
addEventListener('resize',resize);
function simStep(dt){let left=dt;while(left>1e-4){const h=Math.min(left,1/30);if(auto)auto.update(h);S.step(h);if(app==='play'||app==='menu')processEvents();else S.ev.length=0;left-=h;if(S.over)break;}}
function step(dt){dt=Math.min(dt,.1);menuT+=dt;const g=paused?0:dt*(app==='play'?spd:1);
 if(app==='play'&&S){if(!paused){simStep(dt*spd);if(S.over)finish();}I.flush();danger=S?Math.min(1,S.enemies.filter(e=>e.alive&&S.rem(e)<S.M.paths[e.pi].len*.35).length/8+(S.enemies.some(e=>e.alive&&e.d.boss)?.5:0)):0;snd.music(true,danger);}
 else if(app==='menu'&&S){simStep(dt);if(S.over)demo();I.flush();}else I.flush();
 cameraUpdate(dt);ghostUpdate();
 if(S&&g>0){parts.update(g);smoke.update(g);decals.update(g,menuT);shocks.update(g);strips.update(g,camera);for(const L of flashL)if(L.t>0){L.t-=g;L.l.intensity*=Math.exp(-g*10);if(L.t<=0)L.l.intensity=0;}}
 if(S)updateViews(g,menuT);
 if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').classList.remove('on');}
 if(app==='play'&&S){hudUpdate();}lastDt=dt;}
let lastDt=1/60;
function noAO(st){if(!st.ao||st.ao._vfx)return;const ao=st.ao,orig=ao.render.bind(ao);ao._vfx=1;ao.render=(...a)=>{const hid=[];scene.traverse(o=>{const m=o.material;if(o.visible&&m&&!Array.isArray(m)&&m.transparent&&m.depthWrite===false){o.visible=false;hid.push(o);}});orig(...a);for(const o of hid)o.visible=true;};}
function render(){if(!fxStack){fxStack=cinematic(R,scene,camera,{...POST,quality:gfx});fxStack.setSize(innerWidth,innerHeight);noAO(fxStack);}fxStack.render();overlay(lastDt*(paused?0:spd));}
let last=performance.now();
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(frame);}
/* ================= boot ================= */
$('go').onclick=()=>start();$('howb').onclick=()=>{$('keys').hidden=!$('keys').hidden;};$('keys').onclick=()=>{$('keys').hidden=true;};
$('resume').onclick=togglePause;$('quit').onclick=toMenu;$('restart').onclick=()=>{paused=false;start({map:S.M.idx,diff:S.diff,waves:S.waves,hero:S.heroType});};
$('again').onclick=()=>start({map:S.M.idx,diff:S.diff,waves:S.waves,hero:S.heroType});$('omenu').onclick=toMenu;
$('spd').onclick=()=>setSpd(spd%3+1);$('nextB').onclick=()=>{snd.init();callWave();};$('pauseB').onclick=togglePause;
postButton($('post'),ID,()=>{const L=lastAward||{pts:0};return[L.pts,`BASTION LINE · ${L.map} · ${L.diff} · ${L.survived}/${L.waves} waves · ${L.stars} stars · ${L.leaks} leaks · ${L.built} towers · ${L.kills} kills`];});
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));if(navigator.webdriver)FAST=true;resize();buildMenu();demo();requestAnimationFrame(frame);
/* ================= test hook ================= */
window.BASTION={
 start(o={}){FAST=o.fast!==false;start(o);return this.state;},
 step(dt=1/60,n=1){for(let i=0;i<n;i++)step(dt);},
 // simulation only (no views) for long scripted rounds
 simulate(secs,dt=1/15){const n=Math.round(secs/dt);for(let i=0;i<n&&app==='play';i++){simStep(dt);if(S.over){finish();break;}}floats.length=0;$('msgs').innerHTML='';step(1/60);},
 render(){render();},
 get state(){return S?{app,t:S.t,len:S.len,wave:S.wave,waves:S.waves,lives:S.lives,gold:Math.floor(S.gold),over:S.over,towers:S.towers.length,enemies:S.enemies.filter(e=>e.alive).length,hero:S.hero?{lv:S.hero.lv,xp:S.hero.xp,kills:S.hero.kills}:null,st:{...S.st},next:S.next,plan:S.plan&&{w:S.plan.w,counts:S.plan.counts,intel:S.plan.intel}}:{app};},
 get score(){return lastAward?lastAward.pts:0;},get result(){return lastAward;},
 get sim(){return S;},get player(){return S&&{gold:S.gold,lives:S.lives,hero:S.hero,towers:S.towers};},get bots(){return S?S.enemies.filter(e=>e.alive):[];},get director(){return S&&S.dir;},
 build(type,x,z){return S.build(type,x,z);},upgrade(t,p){return S.upgrade(t,p);},placeHero(x,z){return S.placeHero(x,z);},ability(i){return S.ability(i);},callWave(){return S.callWave();},
 autopilot(on=true,skill=2){auto=on?new Autopilot(S,skill):null;},select(t){select(t);},place(type){startPlace(type);},tap(x,y,shift){tap(x,y,shift);},mouse(x,y){mx=x;my=y;mIn=true;},key(code,mods={}){keyDown({code,...mods});},
 cam(x,z,dist,yaw){cam.x=cam.tx=x;cam.z=cam.tz=z;if(dist)cam.dist=cam.td=dist;if(yaw!=null)cam.yaw=cam.tyaw=yaw;},fit(){fitCam();cam.x=cam.tx;cam.z=cam.tz;cam.dist=cam.td;cam.yaw=cam.tyaw;},
 setSpeed:setSpd,setQuality:applyQuality,get quality(){return gfx;},toMenu,hud(v){noHud=!v;$('hud').hidden=!v||app!=='play';if(!v){bannerT=0;$('banner').classList.remove('on');}},scr,groundAt,
 finish(){if(S&&!S.over){S.end(S.lives>0?0:-1,'time');finish();}}};
