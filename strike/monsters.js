// STRIKE ZONE — original monsters: procedural rigs (cinder imp, ramhorn charger, gazer eye, ironclad brute, pyre colossus boss) + their AI.
import * as THREE from '../vendor/three.module.min.js';
import {CS} from './levels.js';
const V=THREE.Vector3,R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v,TAU=Math.PI*2;
const GRAV=22;

export const MON={
 imp:{name:'CINDER IMP',hp:70,r:.42,h:1.75,speed:6.8,climb:3.3,score:100,stagger:.32,col:0x3a2620,glow:0xff6a1a,ichor:0xff7a20,gib:10,gibS:.32},
 charger:{name:'RAMHORN',hp:280,r:.75,h:2.0,speed:5.2,climb:.6,score:250,stagger:.25,col:0x4a1a14,glow:0xff4010,ichor:0xff5a10,gib:16,gibS:.45},
 eye:{name:'GAZER',hp:110,r:.75,h:1.5,speed:5.5,fly:true,score:150,stagger:.3,col:0x4a2050,glow:0x60ff9a,ichor:0x80ff60,gib:10,gibS:.32},
 brute:{name:'IRONCLAD',hp:700,r:.8,h:3.1,speed:3.7,climb:.6,score:500,stagger:.16,col:0x2a2a30,glow:0xff8a20,ichor:0xffa030,gib:22,gibS:.55},
 boss:{name:'PYRE COLOSSUS',hp:4800,r:1.7,h:8.4,speed:2.6,climb:.6,score:5000,stagger:.05,col:0x1a1210,glow:0xff5a00,ichor:0xff7010,gib:60,gibS:1.1}};

/* ---------- shared monster textures ---------- */
let MT=null;function mtex(){if(MT)return MT;const mk=(draw)=>{const c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'),256);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;};
 const cracks=mk((x,w)=>{x.fillStyle='#000';x.fillRect(0,0,w,w);x.strokeStyle='#fff';x.shadowColor='#fff';x.shadowBlur=4;for(let i=0;i<18;i++){x.lineWidth=.8+R()*1.6;x.beginPath();let a=R()*w,b=R()*w;x.moveTo(a,b);for(let k=0;k<6;k++){a+=(R()-.5)*50;b+=(R()-.5)*50;x.lineTo(a,b);}x.stroke();}});
 const skin=mk((x,w)=>{x.fillStyle='#888';x.fillRect(0,0,w,w);for(let i=0;i<5000;i++){const v=R()*.25;x.fillStyle=R()<.5?`rgba(0,0,0,${v})`:`rgba(255,255,255,${v*.6})`;x.fillRect(R()*w,R()*w,2+R()*3,2+R()*3);}for(let i=0;i<40;i++){x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;x.beginPath();x.arc(R()*w,R()*w,4+R()*10,0,R()*6);x.stroke();}});
 skin.colorSpace=THREE.SRGBColorSpace;MT={cracks,skin};return MT;}

const g_=(o,p)=>{p&&p.add(o);return o;};
function mesh(geo,mat,x=0,y=0,z=0,p){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;return g_(m,p);}
function joint(x,y,z,p){const j=new THREE.Group();j.position.set(x,y,z);return g_(j,p);}
const cap=(r,l)=>new THREE.CapsuleGeometry(r,l,4,10);
const horn=(r,l,bend=.5)=>{const g=new THREE.ConeGeometry(r,l,8,4);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)+l/2;p.setZ(i,p.getZ(i)-Math.pow(y/l,2)*l*bend);}g.computeVertexNormals();return g;};

/* ---------- rigs ---------- */
// fresnel rim glow so monsters read against dark arenas
function rim(mat,col){mat.userData.rimU={value:col};mat.onBeforeCompile=sh=>{sh.uniforms.rimCol=mat.userData.rimU;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 rimCol;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float fr=1.-abs(dot(normal,normalize(vViewPosition)));totalEmissiveRadiance+=rimCol*pow(fr,2.6);}');};mat.customProgramCacheKey=()=>'rim';}
function mats(def,o={}){const T=mtex();const skin=new THREE.MeshStandardMaterial({color:def.col,map:T.skin,roughness:.78,metalness:.05,emissive:new THREE.Color(def.glow),emissiveMap:T.cracks,emissiveIntensity:o.crack??.7});
 rim(skin,new THREE.Color(def.glow).multiplyScalar(o.rim??.55));
 const bone=new THREE.MeshStandardMaterial({color:o.bone??0xc8b89a,roughness:.55,metalness:.05});rim(bone,new THREE.Color(def.glow).multiplyScalar(.3));const metal=new THREE.MeshStandardMaterial({color:o.metal??0x3a3a42,roughness:.32,metalness:.9});
 const eye=new THREE.MeshBasicMaterial({color:new THREE.Color(def.glow).multiplyScalar(3)});return{skin,bone,metal,eye};}

function rigImp(def){const M=mats(def),root=new THREE.Group(),J={};const hip=J.hip=joint(0,.95,0,root);
 J.torso=joint(0,.05,0,hip);mesh(cap(.2,.32),M.skin,0,.25,0,J.torso).scale.set(1.1,1,.85);const chest=mesh(new THREE.SphereGeometry(.27,12,10),M.skin,0,.5,.03,J.torso);chest.scale.set(1.15,.9,.8);
 for(let k=0;k<4;k++){const s=mesh(new THREE.ConeGeometry(.04,.16,6),M.bone,0,.62-k*.13,-.2+k*.01,J.torso);s.rotation.x=-.6;}
 J.head=joint(0,.72,.06,J.torso);const hd=mesh(new THREE.SphereGeometry(.17,14,12),M.skin,0,.08,.02,J.head);hd.scale.set(1,1.05,1.15);const jaw=J.jaw=mesh(new THREE.BoxGeometry(.2,.06,.16),M.skin,0,-.02,.1,J.head);
 for(const s of[-1,1]){const h=mesh(horn(.045,.32,.7),M.bone,s*.11,.2,-.02,J.head);h.rotation.set(-.5,0,s*-.45);mesh(new THREE.SphereGeometry(.035,8,6),M.eye,s*.065,.1,.16,J.head);
  for(let t=0;t<3;t++){const tt=mesh(new THREE.ConeGeometry(.012,.05,4),M.bone,s*(.03+t*.025),.03,.18,J.jaw);tt.rotation.x=Math.PI;}}
 for(const s of[-1,1]){const sh=J['sh'+s]=joint(s*.3,.52,0,J.torso);mesh(cap(.07,.3),M.skin,0,-.18,0,sh);const el=J['el'+s]=joint(0,-.38,0,sh);mesh(cap(.06,.3),M.skin,0,-.18,0,el);const hand=J['hand'+s]=joint(0,-.38,0,el);
  mesh(new THREE.SphereGeometry(.07,8,6),M.skin,0,0,0,hand);for(let f=-1;f<=1;f++){const c=mesh(new THREE.ConeGeometry(.018,.14,5),M.bone,f*.035,-.08,.03,hand);c.rotation.x=Math.PI+.4;}
  const th=J['th'+s]=joint(s*.13,0,0,hip);mesh(cap(.085,.3),M.skin,0,-.2,.04,th);const kn=J['kn'+s]=joint(0,-.42,.06,th);mesh(cap(.065,.32),M.skin,0,-.2,-.06,kn);const ft=J['ft'+s]=joint(0,-.42,-.08,kn);mesh(new THREE.BoxGeometry(.1,.06,.24),M.skin,0,.02,.08,ft);}
 const tail=J.tail=joint(0,-.05,-.15,hip);let t=tail;for(let k=0;k<4;k++){mesh(cap(.04-k*.007,.14),M.skin,0,0,-.1,t).rotation.x=Math.PI/2;t=joint(0,0,-.18,t);}J.tailEnd=t;
 const hit=[{o:J.torso,off:new V(0,.35,0),r:.38,part:'body',m:1},{o:J.head,off:new V(0,.08,.03),r:.2,part:'head',m:1.6},{o:hip,off:new V(0,-.45,0),r:.3,part:'body',m:1}];
 return{root,J,M,hit,eyeH:1.6};}

function rigCharger(def){const M=mats(def,{bone:0xd8c8a8}),root=new THREE.Group(),J={};const body=J.body=joint(0,1.25,0,root);
 const b=mesh(new THREE.SphereGeometry(.85,16,12),M.skin,0,0,0,body);b.scale.set(1,.85,1.35);const hump=mesh(new THREE.SphereGeometry(.7,14,10),M.skin,0,.42,.35,body);hump.scale.set(1.05,.8,1);
 const plate=mesh(new THREE.SphereGeometry(.75,12,8,0,TAU,0,1.2),M.bone,0,.3,.45,body);plate.scale.set(1.05,.7,1.1);
 J.head=joint(0,-.05,1.05,body);const hd=mesh(new THREE.BoxGeometry(.7,.6,.75),M.skin,0,-.15,.3,J.head);mesh(new THREE.BoxGeometry(.72,.22,.5),M.bone,0,.12,.25,J.head);J.jaw=mesh(new THREE.BoxGeometry(.6,.18,.55),M.skin,0,-.45,.35,J.head);
 for(const s of[-1,1]){const h=mesh(horn(.13,1.0,.9),M.bone,s*.36,.15,.25,J.head);h.rotation.set(1.2,0,s*-1.1);mesh(new THREE.SphereGeometry(.06,8,6),M.eye,s*.24,-.02,.66,J.head);}
 const legs=[[-.5,.75],[.5,.75],[-.5,-.75],[.5,-.75]];legs.forEach((p,k)=>{const th=J['leg'+k]=joint(p[0],-.25,p[1],body);mesh(cap(.17,.45),M.skin,0,-.3,0,th);const kn=J['kn'+k]=joint(0,-.62,0,th);mesh(cap(.13,.38),M.skin,0,-.22,0,kn);mesh(new THREE.CylinderGeometry(.16,.2,.16,8),M.bone,0,-.5,0,kn);});
 const tail=J.tail=joint(0,0,-1.1,body);mesh(cap(.07,.6),M.skin,0,0,-.3,tail).rotation.x=Math.PI/2.4;
 const hit=[{o:body,off:new V(0,0,0),r:1.0,part:'body',m:1},{o:J.head,off:new V(0,-.1,.35),r:.5,part:'head',m:1.3},{o:body,off:new V(0,-.1,-.8),r:.7,part:'rear',m:1.5}];
 return{root,J,M,hit,eyeH:1.4};}

function rigEye(def){const M=mats(def,{crack:.9}),root=new THREE.Group(),J={};const core=J.core=joint(0,0,0,root);
 const b=mesh(new THREE.SphereGeometry(.7,20,16),M.skin,0,0,0,core);b.scale.set(1,.92,1);
 const sclera=new THREE.MeshStandardMaterial({color:0xe8e0d0,roughness:.25,metalness:0});const iris=new THREE.MeshBasicMaterial({color:new THREE.Color(def.glow).multiplyScalar(2.2)});const pupil=new THREE.MeshBasicMaterial({color:0x000000});
 J.ball=joint(0,0,.28,core);mesh(new THREE.SphereGeometry(.5,20,16),sclera,0,0,0,J.ball);const ir=mesh(new THREE.CircleGeometry(.24,24),iris,0,0,.5,J.ball);ir.castShadow=false;const pu=mesh(new THREE.CircleGeometry(.1,16),pupil,0,0,.505,J.ball);pu.castShadow=false;J.pupil=pu;
 J.lidT=mesh(new THREE.SphereGeometry(.56,16,8,0,TAU,0,1.0),M.skin,0,0,.18,core);J.lidT.rotation.x=.25;J.lidB=mesh(new THREE.SphereGeometry(.56,16,8,0,TAU,2.1,1.0),M.skin,0,0,.18,core);J.lidB.rotation.x=-.2;
 for(const s of[-1,1]){const fin=mesh(new THREE.ConeGeometry(.28,.9,4),M.skin,s*.75,.15,-.1,core);fin.rotation.z=s*-1.9;fin.scale.z=.25;J['fin'+s]=fin;}
 J.tent=[];for(let k=0;k<5;k++){const a=k/5*TAU;let t=joint(Math.cos(a)*.35,-.5,Math.sin(a)*.35-.1,core);const ch=[t];for(let s=0;s<4;s++){mesh(cap(.06-s*.011,.16),M.skin,0,-.12,0,t);t=joint(0,-.24,0,t);ch.push(t);}J.tent.push(ch);}
 for(let k=0;k<6;k++){const sp=mesh(new THREE.ConeGeometry(.06,.3,6),M.bone,0,0,0,core);const a=k/6*TAU;sp.position.set(Math.cos(a)*.55,.45,Math.sin(a)*.5-.25);sp.lookAt(sp.position.clone().multiplyScalar(3));sp.rotateX(Math.PI/2);}
 const hit=[{o:core,off:new V(0,0,0),r:.78,part:'body',m:1},{o:J.ball,off:new V(0,0,.42),r:.3,part:'eye',m:2.2}];
 return{root,J,M,hit,eyeH:0};}

function rigBrute(def,boss){const M=mats(def,{metal:boss?0x221a18:0x4a4a52,crack:boss?2.4:1.2}),root=new THREE.Group(),J={};const hip=J.hip=joint(0,1.45,0,root);
 const coreM=new THREE.MeshBasicMaterial({color:new THREE.Color(def.glow).multiplyScalar(boss?3.2:2.6)});
 J.torso=joint(0,.1,0,hip);const belly=mesh(new THREE.SphereGeometry(.55,14,12),M.skin,0,.25,.05,J.torso);belly.scale.set(1.15,1,.9);const chest=mesh(new THREE.SphereGeometry(.75,16,12),M.skin,0,.95,0,J.torso);chest.scale.set(1.35,.95,.95);
 J.core=mesh(new THREE.SphereGeometry(.24,14,10),coreM,0,.85,.62,J.torso);J.core.castShadow=false;
 if(!boss){for(const s of[-1,1]){mesh(new THREE.BoxGeometry(.62,.55,.22),M.metal,s*.45,1.15,.62,J.torso).rotation.set(-.15,s*.25,0);}mesh(new THREE.BoxGeometry(.9,.3,.25),M.metal,0,.45,.62,J.torso);}
 else{for(let k=0;k<7;k++){const sp=mesh(horn(.1,.9,.3),M.bone,(k-3)*.28,1.55,-.2,J.torso);sp.rotation.x=-.5-Math.abs(k-3)*.1;}}
 J.head=joint(0,1.55,.25,J.torso);mesh(new THREE.SphereGeometry(.3,14,12),M.skin,0,.1,0,J.head).scale.set(1,.9,1.1);
 if(!boss){mesh(new THREE.SphereGeometry(.34,14,8,0,TAU,0,1.4),M.metal,0,.14,-.02,J.head);mesh(new THREE.BoxGeometry(.4,.06,.04),M.eye,0,.1,.3,J.head);}
 else{for(const s of[-1,1]){const h=mesh(horn(.12,1.1,1.1),M.bone,s*.25,.35,0,J.head);h.rotation.set(-.4,0,s*-.9);mesh(new THREE.SphereGeometry(.06,8,6),M.eye,s*.12,.13,.3,J.head);}for(let k=0;k<5;k++){const c=mesh(new THREE.ConeGeometry(.06,.4,6),M.bone,(k-2)*.12,.42,-.05,J.head);c.rotation.z=(k-2)*-.2;}}
 for(const s of[-1,1]){const sh=J['sh'+s]=joint(s*.95,1.15,0,J.torso);mesh(new THREE.SphereGeometry(.38,12,10),boss?M.skin:M.metal,0,0,0,sh);if(!boss){const pad=mesh(new THREE.SphereGeometry(.48,12,8,0,TAU,0,1.3),M.metal,s*.08,.12,0,sh);pad.rotation.z=s*-.4;}
  mesh(cap(.24,.55),M.skin,0,-.4,0,sh);const el=J['el'+s]=joint(0,-.85,0,sh);mesh(cap(.26,.5),M.skin,0,-.35,.05,el);const hand=J['hand'+s]=joint(0,-.78,.05,el);
  if(s===1&&!boss){mesh(new THREE.CylinderGeometry(.22,.26,.7,12),M.metal,0,-.1,0,hand);const mz=mesh(new THREE.CylinderGeometry(.14,.14,.12,12),coreM,0,-.47,0,hand);mz.castShadow=false;J.muzzle=joint(0,-.55,0,hand);}
  else{mesh(new THREE.SphereGeometry(.33,12,10),M.skin,0,-.1,.02,hand).scale.set(1.1,.95,1);for(let f=-1;f<=1;f++)mesh(new THREE.ConeGeometry(.06,.2,6),M.bone,f*.12,-.05,.3,hand).rotation.x=Math.PI/2;}
  const th=J['th'+s]=joint(s*.38,0,0,hip);mesh(cap(.24,.45),M.skin,0,-.35,0,th);const kn=J['kn'+s]=joint(0,-.72,0,th);mesh(cap(.21,.4),M.skin,0,-.3,0,kn);if(!boss)mesh(new THREE.BoxGeometry(.32,.4,.2),M.metal,0,-.15,.2,kn);const ft=J['ft'+s]=joint(0,-.68,0,kn);mesh(new THREE.BoxGeometry(.38,.18,.55),boss?M.skin:M.metal,0,-.02,.12,ft);}
 const hit=[{o:J.torso,off:new V(0,.75,0),r:1.0,part:'body',m:1},{o:J.head,off:new V(0,.1,0),r:.36,part:'head',m:1.5},{o:J.torso,off:new V(0,.85,.62),r:.3,part:'core',m:2.2},{o:hip,off:new V(0,-.7,0),r:.55,part:'body',m:1}];
 const S=boss?2.75:1;root.scale.setScalar(S);for(const h of hit)h.r*=1;
 return{root,J,M,hit,eyeH:2.8*S,coreM,scale:S};}

// merge the static meshes under each joint per material (far fewer draw calls); animated meshes are flagged keep
export function mergeRig(root,keep=new Set()){const groups=[];root.traverse(o=>{if(o.children&&o.children.some(c=>c.isMesh&&!keep.has(c)))groups.push(o);});
 for(const g of groups){const by=new Map();for(const c of g.children){if(!c.isMesh||keep.has(c))continue;if(!by.has(c.material))by.set(c.material,[]);by.get(c.material).push(c);}
  for(const[mat,list]of by){if(list.length<2)continue;let n=0;const parts=list.map(c=>{c.updateMatrix();const geo=(c.geometry.index?c.geometry.toNonIndexed():c.geometry.clone()).applyMatrix4(c.matrix);n+=geo.attributes.position.count;return geo;});
   const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);let o=0;for(const geo of parts){P.set(geo.attributes.position.array,o*3);N.set(geo.attributes.normal.array,o*3);if(geo.attributes.uv)U.set(geo.attributes.uv.array,o*2);o+=geo.attributes.position.count;geo.dispose();}
   const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.BufferAttribute(P,3));mg.setAttribute('normal',new THREE.BufferAttribute(N,3));mg.setAttribute('uv',new THREE.BufferAttribute(U,2));mg.computeBoundingSphere();
   const mesh=new THREE.Mesh(mg,mat);mesh.castShadow=list.some(c=>c.castShadow)&&mg.boundingSphere.radius>.18;for(const c of list)g.remove(c);g.add(mesh);}}}
const RIGS0={imp:rigImp,charger:rigCharger,eye:rigEye,brute:d=>rigBrute(d,false),boss:d=>rigBrute(d,true)};
const RIGS={};for(const k in RIGS0)RIGS[k]=d=>{const r=RIGS0[k](d);const J=r.J;const keep=new Set([J.jaw,J.lidT,J.lidB,J['fin-1'],J.fin1,J.core,J.pupil].filter(Boolean));mergeRig(r.root,keep);return r;};

/* ---------- monster ---------- */
let NID=0;
export class Monster{
 constructor(type,pos,G){this.id=NID++;this.type=type;this.def=MON[type];const d=this.def;this.rig=RIGS[type](d);this.root=this.rig.root;this.g=this.root;// .g kept for older test hooks
  this.pos=new V(pos.x,pos.y,pos.z);this.vel=new V();this.yaw=R()*TAU;this.hpMax=d.hp*(G?G.diff.hp:1);this.hp=this.hpMax;this.state='spawn';this.st=0;this.cd=1+R()*1.5;this.alive=true;this.dead=0;this.onGround=!d.fly;this.flash=0;this.walk=R()*6;this.stagger=0;this.staggered=false;this.hurtT=0;
  this.strafe=R()<.5?1:-1;this.strafeT=0;this.alt=3.5+R()*2.5;this.lastSeen=0;this.burst=0;this.phase=0;this.summoned=0;this.ai=G?G.diff:null;this.knock=new V();
  this.root.position.copy(this.pos);this.root.scale.multiplyScalar(.01);this.spawnT=0;this.tmp=new V();}
 get r(){return this.def.r*(this.type==='boss'?1:1);}
 // world positions of hit spheres
 spheres(){const out=this._sp||(this._sp=this.rig.hit.map(h=>({p:new V(),r:h.r*(this.rig.scale||1),part:h.part,m:h.m})));this.root.updateMatrixWorld(true);this.rig.hit.forEach((h,k)=>{out[k].p.copy(h.off);h.o.localToWorld(out[k].p);});return out;}
 center(out=new V()){return out.set(this.pos.x,this.pos.y+(this.def.fly?0:this.def.h*.55),this.pos.z);}
 headPos(out=new V()){return out.set(this.pos.x,this.pos.y+(this.def.fly?0:this.def.h*.9),this.pos.z);}
 face(tx,tz,dt,rate=8){const want=Math.atan2(tx-this.pos.x,tz-this.pos.z);let d=((want-this.yaw+Math.PI*3)%TAU)-Math.PI;this.yaw+=cl(d,-rate*dt,rate*dt);return Math.abs(d);}

 update(dt,G){const d=this.def,P=G.player;this.flash=Math.max(0,this.flash-dt);this.hurtT=Math.max(0,this.hurtT-dt);
  if(!this.alive){this.dead+=dt;this.animDeath(dt,G);return;}
  if(this.state==='spawn'){this.spawnT+=dt;const k=Math.min(1,this.spawnT/.55);this.root.scale.setScalar((this.rig.scale||1)*(.2+.8*(1-Math.pow(1-k,3))));if(k>=1){this.state='chase';}this.root.position.copy(this.pos);this.root.rotation.y=this.yaw;this.anim(dt,G,0);return;}
  if(this.staggered){this.stagger-=dt;if(this.stagger<=0){this.staggered=false;this.state='chase';}}
  const eye=P.eye,dx=eye.x-this.pos.x,dz=eye.z-this.pos.z,dist=Math.hypot(dx,dz);
  this.losT=(this.losT||0)-dt;if(this.losT<=0){this.losT=.2+R()*.1;const h=this.headPos(this.tmp);this.see=G.attract?false:G.L.los(h.x,h.y,h.z,eye.x,eye.y,eye.z);if(this.see)this.lastSeen=G.time;}
  let mx=0,mz=0,speed=d.speed*(G.diff.spd||1)*(this.enraged?1.35:1);
  if(!this.staggered&&!G.attract)this.think(dt,G,dist,dx,dz);
  if(G.attract)this.wander(dt,G);
  // movement intent from state
  if(!d.fly&&!G.attract){const s=this.staggered?'stagger':this.state;let goal=null;
   if(s==='chase'||s==='strafe'||s==='hold'){if(this.see&&Math.abs(P.pos.y-this.pos.y)<1.2){goal=[P.pos.x,P.pos.z];}else goal=this.flowStep(G);
    if(goal){const gx=goal[0]-this.pos.x,gz=goal[1]-this.pos.z,gl=Math.hypot(gx,gz)||1;mx=gx/gl;mz=gz/gl;}
    if(s==='strafe'&&this.see){const px=-dz/(dist||1),pz=dx/(dist||1);mx=mx*.35+px*this.strafe;mz=mz*.35+pz*this.strafe;}
    if(s==='hold'){mx*=.2;mz*=.2;}
    const keep=this.type==='imp'?5:this.type==='brute'?3.2:this.type==='boss'?7:1.4;if(this.see&&dist<keep&&this.type!=='charger'){mx*=-.4;mz*=-.4;}}
   else if(s==='charge'){mx=this.cdir.x;mz=this.cdir.z;speed=d.speed*4.2*(G.diff.spd||1);}
   else{mx=0;mz=0;}
   // separation
   for(const o of G.monsters){if(o===this||!o.alive||o.def.fly)continue;const ox=this.pos.x-o.pos.x,oz=this.pos.z-o.pos.z,od=Math.hypot(ox,oz),min=this.r+o.r;if(od<min&&od>1e-3){mx+=ox/od*1.2;mz+=oz/od*1.2;}}
   const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}
   const acc=this.onGround?10:1.5;this.vel.x+=(mx*speed-this.vel.x)*Math.min(1,acc*dt);this.vel.z+=(mz*speed-this.vel.z)*Math.min(1,acc*dt);
   this.vel.x+=this.knock.x;this.vel.z+=this.knock.z;this.vel.y+=this.knock.y;this.knock.set(0,0,0);
   this.vel.y-=GRAV*dt;const res=G.L.move(this.pos,this.vel,dt,Math.min(this.r,.75),this.onGround,.56);
   if(res.landed)this.onGround=true;else if(this.vel.y<-1)this.onGround=false;
   if((res.hitX||res.hitZ)&&this.state==='charge'){this.wallSlam(G);}
   else if((res.hitX||res.hitZ)&&this.onGround&&d.climb>1){// imps leap up ledges
    this.vel.y=Math.sqrt(2*GRAV*Math.min(d.climb+.6,3.9));this.onGround=false;this.vel.x=mx*speed;this.vel.z=mz*speed;}
   if(this.pos.y<-12){this.pos.y=-60;this.die(G,null,'fall');return;}
   if(G.L.isLava(this.pos.x,this.pos.z)&&this.pos.y<.1){this.lavaT=(this.lavaT||0)+dt;if(this.lavaT>.5){this.lavaT=0;this.damage(G,8,null,'body','lava');}}
   if(Math.hypot(mx,mz)>.1&&this.state!=='charge'){this.face(this.pos.x+mx,this.pos.z+mz,dt,this.see&&dist<20?3:7);if(this.see&&this.state!=='charge')this.face(P.pos.x,P.pos.z,dt,6);}
   else if(this.see&&this.state!=='charge')this.face(P.pos.x,P.pos.z,dt,5);}
  else if(d.fly&&!G.attract){this.flyMove(dt,G,dist,dx,dz);}
  this.root.position.copy(this.pos);this.root.rotation.y=this.yaw;
  this.anim(dt,G,Math.hypot(this.vel.x,this.vel.z));}

 flowStep(G){const L=G.L,f=this.def.climb>1?G.flowLeap:G.flowWalk;if(!f)return null;const i=Math.floor(this.pos.x/CS),j=Math.floor(this.pos.z/CS),W=L.W;if(i<0||j<0||i>=W||j>=L.H)return null;
  let best=f[j*W+i],bi=-1,bj=-1;if(best<0)best=1e9;for(let k=0;k<8;k++){const di=[1,-1,0,0,1,1,-1,-1][k],dj=[0,0,1,-1,1,-1,1,-1][k];const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=W||nj>=L.H)continue;const v=f[nj*W+ni];if(v>=0&&v<best){best=v;bi=ni;bj=nj;}}
  if(bi<0){if(f[j*W+i]<0){const P=G.player;return[P.pos.x,P.pos.z];}return null;}return[(bi+.5)*CS,(bj+.5)*CS];}

 wander(dt,G){this.wt=(this.wt||0)-dt;if(this.wt<=0||!this.wgoal){this.wt=2+R()*3;const a=R()*TAU,r=2+R()*6;this.wgoal=[this.pos.x+Math.cos(a)*r,this.pos.z+Math.sin(a)*r];}
  if(this.def.fly){const t=G.time*.4+this.id;this.pos.x+=Math.cos(t)*dt*1.5;this.pos.z+=Math.sin(t)*dt*1.5;this.pos.y+=(G.L.groundAt(this.pos.x,this.pos.z)+this.alt-this.pos.y)*Math.min(1,dt);this.yaw+=dt*.3;this.root.position.copy(this.pos);return;}
  const gx=this.wgoal[0]-this.pos.x,gz=this.wgoal[1]-this.pos.z,gl=Math.hypot(gx,gz);const sp=gl>.5?this.def.speed*.3:0;this.vel.x=gx/(gl||1)*sp;this.vel.z=gz/(gl||1)*sp;this.vel.y-=GRAV*dt;const res=G.L.move(this.pos,this.vel,dt,Math.min(this.r,.75),this.onGround);if(res.landed)this.onGround=true;if(res.hitX||res.hitZ)this.wt=0;if(G.L.isLava(this.pos.x,this.pos.z)||this.pos.y<-2){this.wt=0;this.pos.y=Math.max(this.pos.y,0);}if(sp)this.face(this.wgoal[0],this.wgoal[1],dt,3);}

 flyMove(dt,G,dist,dx,dz){const P=G.player,L=G.L;let want=new V();if(this.staggered){this.vel.multiplyScalar(Math.exp(-dt*4));this.vel.y-=2*dt;}
  else{const ideal=this.type==='eye'?12:8;const rx=dx/(dist||1),rz=dz/(dist||1);const radial=dist>ideal+3?1:dist<ideal-3?-1:0;this.strafeT-=dt;if(this.strafeT<=0){this.strafeT=1.5+R()*2;this.strafe*=-1;this.alt=3+R()*3.5;}
   want.set(rx*radial-rz*this.strafe*.8,0,rz*radial+rx*this.strafe*.8);const tgtY=Math.max(P.pos.y+this.alt,L.groundAt(this.pos.x,this.pos.z)+2.2);want.y=cl((tgtY-this.pos.y)*.6,-1,1);
   for(const o of G.monsters){if(o===this||!o.alive||!o.def.fly)continue;const ox=this.pos.x-o.pos.x,oz=this.pos.z-o.pos.z,oy=this.pos.y-o.pos.y,od=Math.hypot(ox,oy,oz);if(od<2.2&&od>1e-3){want.x+=ox/od;want.y+=oy/od*.5;want.z+=oz/od;}}
   if(!this.see&&G.time-this.lastSeen>1.5){want.x+=rx*.8;want.z+=rz*.8;}
   const sp=this.def.speed*(G.diff.spd||1);this.vel.x+=(want.x*sp-this.vel.x)*Math.min(1,dt*2.5);this.vel.y+=(want.y*sp-this.vel.y)*Math.min(1,dt*2.5);this.vel.z+=(want.z*sp-this.vel.z)*Math.min(1,dt*2.5);}
  this.vel.add(this.knock);this.knock.set(0,0,0);
  const nx=this.pos.x+this.vel.x*dt,nz=this.pos.z+this.vel.z*dt,ny=this.pos.y+this.vel.y*dt;
  if(L.cellTop(nx,this.pos.z)<this.pos.y-.8)this.pos.x=nx;else this.vel.x*=-.5;if(L.cellTop(this.pos.x,nz)<this.pos.y-.8)this.pos.z=nz;else this.vel.z*=-.5;
  const fl=L.groundAt(this.pos.x,this.pos.z,this.pos.y);this.pos.y=Math.max(fl+1.2,Math.min(ny,14));
  const ar=L.W*CS,ah=L.H*CS;this.pos.x=cl(this.pos.x,2.5,ar-2.5);this.pos.z=cl(this.pos.z,2.5,ah-2.5);
  if(this.see||G.attract)this.face(P.pos.x,P.pos.z,dt,4);else this.face(this.pos.x+this.vel.x,this.pos.z+this.vel.z,dt,3);}

 /* ---------- decisions per type ---------- */
 think(dt,G,dist,dx,dz){const d=this.def,P=G.player,D=G.diff;this.cd-=dt*(D.agg||1);this.st+=dt;const s=this.state;
  if(this.type==='imp'){
   if(s==='chase'||s==='strafe'){if(this.see&&dist<30&&this.cd<=0){this.state='throw';this.st=0;}else if(this.see&&dist<14&&R()<dt*.6){this.state=s==='strafe'?'chase':'strafe';this.strafe*=-1;}
    if(dist<1.9&&Math.abs(P.pos.y-this.pos.y)<1.5&&this.cd<.8){this.state='claw';this.st=0;}}
   else if(s==='throw'){if(this.st>.45&&!this.thrown){this.thrown=true;const h=this.rig.J.hand1;const p=new V();h.getWorldPosition(p);G.enemyShot('fireball',p,P,D.lead);G.snd&&G.snd.monster('throw',this.pos);}if(this.st>.75){this.thrown=false;this.state=R()<.5?'strafe':'chase';this.cd=(1.4+R()*1.6)*D.rate;}}
   else if(s==='claw'){if(this.st>.25&&!this.clawed){this.clawed=true;if(dist<2.4&&Math.abs(P.pos.y-this.pos.y)<1.6)G.hurtPlayer(12*D.dmg,this.pos,'claw');}if(this.st>.6){this.clawed=false;this.state='chase';this.cd=.8;}}}
  else if(this.type==='charger'){
   if(s==='chase'){if(this.see&&dist<20&&dist>3.5&&this.cd<=0&&Math.abs(P.pos.y-this.pos.y)<1.5){this.state='windup';this.st=0;G.snd&&G.snd.monster('roar',this.pos);}
    if(dist<2.4&&this.cd<.6&&Math.abs(P.pos.y-this.pos.y)<1.6){this.state='gore';this.st=0;}}
   else if(s==='windup'){this.face(P.pos.x,P.pos.z,dt,10);if(this.st>.85*D.rate){this.state='charge';this.st=0;const l=Math.hypot(P.pos.x-this.pos.x,P.pos.z-this.pos.z)||1;this.cdir=new V((P.pos.x-this.pos.x)/l,0,(P.pos.z-this.pos.z)/l);this.hitP=false;}}
   else if(s==='charge'){if(D.home){const l=Math.hypot(P.pos.x-this.pos.x,P.pos.z-this.pos.z)||1;const want=new V((P.pos.x-this.pos.x)/l,0,(P.pos.z-this.pos.z)/l);this.cdir.lerp(want,Math.min(1,dt*D.home)).normalize();}
    this.yaw=Math.atan2(this.cdir.x,this.cdir.z);if(G.time%.08<dt)G.fx.smoke.emit(this.pos.x,this.pos.y+.2,this.pos.z,(R()-.5),.5,(R()-.5),.35,.3,.28,.8,.8,0,2,1,.5);
    if(!this.hitP&&Math.hypot(P.pos.x-this.pos.x,P.pos.z-this.pos.z)<this.r+.9&&Math.abs(P.pos.y-this.pos.y)<1.6){this.hitP=true;G.hurtPlayer(30*D.dmg,this.pos,'gore');G.knockPlayer(this.cdir.x*16,6,this.cdir.z*16);}
    if(this.st>1.7){this.state='recover';this.st=0;}}
   else if(s==='recover'){if(this.st>.7){this.state='chase';this.cd=(2+R()*1.5)*D.rate;}}
   else if(s==='stunned'){if(this.st>1.8){this.state='chase';this.cd=1.5;}}
   else if(s==='gore'){if(this.st>.3&&!this.clawed){this.clawed=true;if(dist<3)G.hurtPlayer(18*D.dmg,this.pos,'gore');}if(this.st>.8){this.clawed=false;this.state='chase';this.cd=1;}}}
  else if(this.type==='eye'){
   if(this.see&&this.cd<=0&&dist<34){this.burst=3;this.cd=(2.2+R()*1.2)*D.rate;this.bt=0;}
   if(this.burst>0){this.bt-=dt;if(this.bt<=0){this.bt=.16;this.burst--;const p=new V();this.rig.J.ball.getWorldPosition(p);const f=new V(Math.sin(this.yaw),0,Math.cos(this.yaw));p.addScaledVector(f,.6);G.enemyShot('bolt',p,P,D.lead*.7);}}}
  else if(this.type==='brute'){
   if(s==='chase'){if(dist<5.5&&this.cd<=0&&Math.abs(P.pos.y-this.pos.y)<2){this.state='slam';this.st=0;G.snd&&G.snd.monster('roar',this.pos);}else if(this.see&&dist>7&&dist<34&&this.cd<=0){this.state='cannon';this.st=0;}}
   else if(s==='slam'){if(this.st>.85&&!this.slammed){this.slammed=true;G.shockwave(this.pos,13,1.0,26*D.dmg,this);}if(this.st>1.4){this.slammed=false;this.state='chase';this.cd=(2.2+R())*D.rate;}}
   else if(s==='cannon'){this.face(P.pos.x,P.pos.z,dt,4);if(this.st>.7&&!this.shot1){this.shot1=true;this.fireCannon(G);}if(this.st>1.15&&!this.shot2){this.shot2=true;this.fireCannon(G);}if(this.st>1.6){this.shot1=this.shot2=false;this.state='chase';this.cd=(2.4+R()*1.4)*D.rate;}}}
  else if(this.type==='boss')this.bossThink(dt,G,dist);}
 fireCannon(G){const p=new V();(this.rig.J.muzzle||this.rig.J.hand1).getWorldPosition(p);G.enemyShot('cannon',p,G.player,G.diff.lead);G.snd&&G.snd.monster('cannon',this.pos);}
 bossThink(dt,G,dist){const P=G.player,D=G.diff,k=this.hp/this.hpMax;const s=this.state;this.enraged=k<.33;
  if(k<.66&&this.summoned<1||k<.33&&this.summoned<2){this.summoned++;this.state='summon';this.st=0;G.banner('THE COLOSSUS CALLS ITS BROOD','',1.6);}
  if(s==='chase'){if(this.cd<=0){const r=R();this.state=dist<9&&r<.5?'slam':r<.45?'volley':r<.75?'meteor':'slam';this.st=0;G.snd&&G.snd.monster('bossroar',this.pos);}}
  else if(s==='volley'){this.face(P.pos.x,P.pos.z,dt,3);const n=this.enraged?3:2;for(let w=0;w<n;w++){const tt=.6+w*.55;if(this.st>tt&&(this.vk||0)<=w){this.vk=w+1;const p=new V();this.rig.J.hand1.getWorldPosition(p);const base=Math.atan2(P.pos.x-p.x,P.pos.z-p.z);for(let i=-3;i<=3;i++){const a=base+i*.13+(w%2?.065:0);G.enemyShot('fireball',p,null,0,new V(Math.sin(a),-.05,Math.cos(a)),18);}}}if(this.st>.8+n*.55){this.vk=0;this.state='chase';this.cd=(2.2+R()*1.2)*D.rate*(this.enraged?.7:1);}}
  else if(s==='slam'){if(this.st>1.0&&!this.slammed){this.slammed=true;G.shockwave(this.pos,26,1.6,30*D.dmg,this);G.shake(.8);}if(this.enraged&&this.st>1.7&&!this.slam2){this.slam2=true;G.shockwave(this.pos,26,1.6,30*D.dmg,this);}if(this.st>2.2){this.slammed=this.slam2=false;this.state='chase';this.cd=(2+R())*D.rate;}}
  else if(s==='meteor'){if(this.st>.5&&!this.met){this.met=true;const n=this.enraged?9:6;for(let i=0;i<n;i++){const a=R()*TAU,r=i===0?0:2+R()*9;G.meteor(new V(P.pos.x+Math.cos(a)*r,0,P.pos.z+Math.sin(a)*r),1.2+i*.12);}}if(this.st>1.6){this.met=false;this.state='chase';this.cd=(1.8+R())*D.rate;}}
  else if(s==='summon'){if(this.st>.8&&!this.sum){this.sum=true;for(let i=0;i<3+(this.enraged?1:0);i++)G.spawnNear(this.pos,i%3===2?'eye':'imp');}if(this.st>1.6){this.sum=false;this.state='chase';this.cd=1.5;}}}
 wallSlam(G){this.state='stunned';this.st=0;this.vel.set(0,0,0);G.shake(.35);G.fx.explosion(this.center(new V()).add(new V(this.cdir.x,0,this.cdir.z)),.4,0xffd090);G.snd&&G.snd.monster('thud',this.pos);this.damage(G,30,null,'body','wall');}

 /* ---------- damage ---------- */
 damage(G,amt,src,part,kind,dir){if(!this.alive)return 0;let m=1;if(this.type==='brute'&&part==='body'&&dir){const f=new V(Math.sin(this.yaw),0,Math.cos(this.yaw));if(-dir.x*f.x-dir.z*f.z>.35)m=.6;}
  if(this.state==='stunned')m*=1.5;const real=amt*m;this.hp-=real;this.flash=.07;this.hurtT=.25;
  if(this.type==='eye'&&kind!=='lava'){this.knock.add(dir?new V(dir.x*2,.5,dir.z*2):new V());}
  if(this.hp<=0){this.die(G,src,kind,-this.hp>this.hpMax*.3||kind==='rocket'||kind==='glory'||kind==='ssg'&&real>this.hpMax*.6||kind==='rail');return real;}
  if(!this.staggered&&!this.wasStaggered&&this.hp<=this.hpMax*this.def.stagger&&kind!=='lava'){this.staggered=true;this.wasStaggered=true;this.stagger=this.type==='boss'?6:3.2;this.state='stagger';this.vel.set(0,this.vel.y,0);G.onStagger&&G.onStagger(this);}
  return real;}
 die(G,src,kind,gib=false){if(!this.alive)return;this.alive=false;this.dead=0;this.killKind=kind;this.gibbed=gib||this.def.fly;G.onKill(this,kind,this.gibbed);
  if(this.gibbed)this.explode(G);}
 explode(G){const c=this.center(new V());G.fx.gibs.spawn(c,this.vel,this.def.col,new THREE.Color(this.def.glow).multiplyScalar(2.5),this.def.gib,this.def.gibS,G.L);G.fx.blood(c,new V(0,1,0),this.def.ichor);G.fx.sparks.burst(c,40,9,[new THREE.Color(this.def.glow).multiplyScalar(3)],.18,.7,{grav:6,drag:1.2});G.fx.smoke.burst(c,6,2,new THREE.Color(.2,.16,.14),1,1.4,{up:true,grow:1,alpha:.6});this.root.visible=false;}
 animDeath(dt,G){if(this.gibbed){if(this.dead>.1)this.gone=true;return;}const k=Math.min(1,this.dead/.6);this.root.rotation.x=-k*Math.PI/2*(this.def.fly?0:1)*.95;this.pos.y-=this.def.fly?dt*8:0;this.root.position.copy(this.pos);
  if(this.dead>1.1){const s=Math.max(0,1-(this.dead-1.1)/.6);this.root.scale.setScalar((this.rig.scale||1)*s);if(R()<.6){const c=this.center(new V());G.fx.sparks.emit(c.x+(R()-.5),c.y-.6+R()*.5,c.z+(R()-.5),0,1.5,0,2.5,.8,.2,.15,.6,-1,.5);}}
  if(this.dead>1.8)this.gone=true;}

 /* ---------- procedural animation ---------- */
 anim(dt,G,sp){const J=this.rig.J,t=G.time,M=this.rig.M;this.walk+=dt*sp*(this.type==='charger'?1.6:this.type==='boss'?.8:this.type==='brute'?1.2:2.2);const w=this.walk,amp=Math.min(1,sp/3);
  const glow=this.staggered?(1.4+Math.sin(t*16)*1.1):(this.type==='boss'?1.6:this.type==='brute'?.7:this.type==='eye'?.5:.75);M.skin.emissiveIntensity=glow+this.flash*20;
  if(this.staggered)M.skin.emissive.setRGB(1,.55,.1);else M.skin.emissive.set(this.def.glow);
  if(this.rig.coreM)this.rig.coreM.color.setRGB(...new THREE.Color(this.def.glow).multiplyScalar((this.type==='boss'?3:2.4)*(1+.35*Math.sin(t*6))).toArray());
  const shake=this.staggered?Math.sin(t*40)*.05:0;
  if(this.type==='imp'){const s=this.state;J.hip.position.y=.95+Math.abs(Math.sin(w))*.06*amp-(s==='throw'?.05:0);J.hip.rotation.z=shake;J.torso.rotation.x=.35+amp*.15+(this.staggered?.5:0);
   for(const k of[-1,1]){J['th'+k].rotation.x=Math.sin(w+(k>0?0:Math.PI))*.9*amp-(this.onGround?0:.7);J['kn'+k].rotation.x=Math.max(0,-Math.sin(w+(k>0?0:Math.PI)))*1.1*amp+.25;J['sh'+k].rotation.x=-Math.sin(w+(k>0?0:Math.PI))*.7*amp+.3;J['el'+k].rotation.x=-.6;J['sh'+k].rotation.z=k*.25;}
   if(s==='throw'){const k=this.st/.45;J.sh1.rotation.x=k<1?-2.6*k:-2.6+(k-1)*8;J.el1.rotation.x=-.4;}if(s==='claw'){J.sh1.rotation.x=-1.6+Math.sin(this.st*12)*.8;J['sh-1'].rotation.x=-1.6-Math.sin(this.st*12)*.8;}
   J.jaw.rotation.x=(s==='throw'||s==='claw')?.5:.1+Math.sin(t*3)*.05;J.head.rotation.x=-.35+shake;J.tail.rotation.y=Math.sin(t*3+this.id)*.5;J.tail.rotation.x=-.3;}
  else if(this.type==='charger'){const s=this.state;const run=s==='charge'?1.6:1;J.body.position.y=1.25+Math.abs(Math.sin(w*run))*.08*amp;J.body.rotation.z=shake;
   for(let k=0;k<4;k++){const ph=w*run+(k===0||k===3?0:Math.PI);J['leg'+k].rotation.x=Math.sin(ph)*.7*amp*run;J['kn'+k].rotation.x=Math.max(0,Math.sin(ph+1))*.8*amp;}
   J.head.rotation.x=s==='windup'?.35+Math.sin(this.st*20)*.08:s==='charge'?.45:s==='stunned'?-.2+Math.sin(t*9)*.2:.1+Math.sin(t*2)*.05;J.jaw.rotation.x=s==='windup'?.4:.05;J.body.rotation.x=s==='windup'?.12:0;
   if(s==='windup'){J.leg0.rotation.x=Math.sin(this.st*18)*.6;}J.tail.rotation.y=Math.sin(t*4)*.4;}
  else if(this.type==='eye'){J.core.position.y=Math.sin(t*2.2+this.id)*.12;J.core.rotation.z=Math.sin(t*1.3+this.id)*.15+shake*3;const blink=(t+this.id*1.7)%4<.12?1:0;J.lidT.rotation.x=.25+blink*.9+(this.staggered?.6:0);J.lidB.rotation.x=-.2-blink*.6;
   J.ball.rotation.x=this.burst>0?Math.sin(t*30)*.04:0;for(const s of[-1,1])J['fin'+s].rotation.x=Math.sin(t*6+s)*.3;
   J.tent.forEach((ch,k)=>ch.forEach((j,n)=>{if(n===0)return;j.rotation.x=Math.sin(t*3+k+n*.8)*.35;j.rotation.z=Math.cos(t*2.4+k*2+n)*.3;}));}
  else{const s=this.state;const B=this.type==='boss';J.hip.position.y=1.45+Math.abs(Math.sin(w))*.08*amp;J.hip.rotation.z=shake;J.torso.rotation.x=.12+(this.staggered?.4:0);J.torso.rotation.y=Math.sin(w)*.12*amp;
   for(const k of[-1,1]){const ph=w+(k>0?0:Math.PI);J['th'+k].rotation.x=Math.sin(ph)*.6*amp;J['kn'+k].rotation.x=Math.max(0,-Math.sin(ph))*.8*amp;J['sh'+k].rotation.x=-Math.sin(ph)*.4*amp;J['sh'+k].rotation.z=k*.15;J['el'+k].rotation.x=-.35;}
   if(s==='slam'){const k=this.st/(B?1:.85);const up=k<1?k:Math.max(0,1-(k-1)*4);for(const q of[-1,1]){J['sh'+q].rotation.x=-2.8*up+(k>=1?.6:0);J['el'+q].rotation.x=-.3;}J.torso.rotation.x=.12-up*.25+(k>=1?.4:0);J.hip.position.y=1.45-(k>=1?.3:0);}
   if(s==='cannon'){J.sh1.rotation.x=-1.45;J.el1.rotation.x=-.1;J.torso.rotation.y=-.25;}
   if(s==='volley'||s==='meteor'||s==='summon'){J.sh1.rotation.x=-2.2+Math.sin(this.st*8)*.4;J['sh-1'].rotation.x=-2.2-Math.sin(this.st*8)*.4;J.head.rotation.x=-.4;}else J.head.rotation.x=0;}
  // hit flinch
  if(this.hurtT>0&&!this.def.fly){this.root.rotation.x=-this.hurtT*.25;}else if(this.alive)this.root.rotation.x=0;}
}
