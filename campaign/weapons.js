// STARFALL VANGUARD — arsenal: human ballistic weapons + Kyrr energy weapons (heat + battery, overheat vents),
// grenades, procedural gun models (first-person + world) and the animated viewmodel.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,ctex,merge,M4} from './util.js';

// energy weapons: heat per shot (0..1), vent seconds when overheated, battery % per shot; bolt=projectile speed
export const WPN={
 ar:{name:'MK7 ASSAULT RIFLE',mag:36,res:216,rate:.075,dmg:7.5,hs:1.3,spr:.013,sprMax:.055,sprAdd:.0045,range:95,fall:[28,75,.55],reload:1.9,zoom:1.25,auto:true,col:0xffb850,tr:[2.6,1.5,.5],kick:.45,pref:[0,30],tier:1,snd:'ar',human:1},
 br:{name:'VX-3 BATTLE RIFLE',mag:36,res:144,rate:.42,burst:3,gap:.065,dmg:11,hs:2.4,spr:.003,sprMax:.012,sprAdd:.0018,range:160,fall:[60,130,.8],reload:2.1,zoom:2.2,precision:true,col:0xffd070,tr:[2.6,1.8,.6],kick:.55,pref:[8,60],tier:2,snd:'br',human:1},
 shotgun:{name:'BREACHER-12 SHOTGUN',mag:8,res:24,rate:.85,pel:11,dmg:11,hs:1.1,spr:.08,range:40,fall:[6,20,.1],reload:2.6,zoom:1.12,col:0xff9a40,tr:[2.8,1.3,.4],kick:1.5,pref:[0,10],tier:3,snd:'shotgun',human:1},
 sniper:{name:'LONGBOW SR-9',mag:4,res:16,rate:.75,dmg:120,hs:3,spr:0,range:420,reload:2.5,zoom:5,scope:true,pierce:true,col:0x9fe8ff,tr:[1.6,2.6,3.2],kick:2.2,pref:[18,160],tier:3,snd:'sniper',human:1},
 rocket:{name:'HAMMER ROCKET LAUNCHER',mag:2,res:6,rate:1.1,proj:'rocket',speed:46,dmg:60,splash:6.5,sdmg:260,push:16,reload:3,zoom:1.5,col:0xff7a30,tr:[3,1.4,.4],kick:2.2,pref:[10,70],tier:4,snd:'rocket',human:1},
 spark:{name:'KYRR SPARK CASTER',energy:1,rate:.2,bolt:62,dmg:13,shieldX:1.6,hs:1.2,spr:.012,heat:.11,vent:1.7,bat:.9,range:120,zoom:1,col:0x6aff7a,tr:[.8,3.2,1],kick:.4,pref:[0,28],tier:1,snd:'spark'},
 ion:{name:'KYRR ION REPEATER',energy:1,auto:true,rate:.1,bolt:80,dmg:9,shieldX:1.5,hs:1.2,spr:.02,sprMax:.05,sprAdd:.004,heat:.065,vent:2.4,bat:.45,range:140,zoom:1.2,col:0x8a6aff,tr:[1.6,1.1,3.4],kick:.4,pref:[0,40],tier:2,snd:'ion'},
 mortar:{name:'KYRR FUSION MAUL',energy:1,rate:1.6,bolt:34,arc:1,dmg:40,splash:5,sdmg:110,push:12,heat:.34,vent:3,bat:5,range:80,zoom:1,col:0xff5ad0,tr:[3.2,.8,2.6],kick:2,pref:[6,60],tier:4,snd:'mortar'}};
export const PICKABLE=['ar','br','shotgun','sniper','rocket','spark','ion'];
export const NADE={frag:{name:'FRAG',fuse:2.1,dmg:130,r:5.6,push:13},stick:{name:'PULSE CHARGE',fuse:1.7,dmg:165,r:4.4,push:10,stick:1}};
export const freshWeapon=(id,full=1)=>{const d=WPN[id];return d.energy?{id,mag:0,res:0,bat:full?100:30+Math.random()*50,heat:0,vent:0}:{id,mag:d.mag,res:full?d.res:Math.round(d.res*.5)};};
export const ammoLeft=w=>WPN[w.id].energy?w.bat>0:w.mag+w.res>0;

/* ---------- gun models ---------- */
let MS=null;
function mats(){if(MS)return MS;const std=o=>new THREE.MeshStandardMaterial(o);
 MS={body:std({color:0x3a4034,roughness:.45,metalness:.7}),dark:std({color:0x15171a,roughness:.55,metalness:.6}),light:std({color:0x6c7462,roughness:.4,metalness:.75}),
  grip:std({color:0x1e2020,roughness:.85,metalness:.1}),olive:std({color:0x4c5a36,roughness:.6,metalness:.35}),glove:std({color:0x2a2c28,roughness:.75,metalness:.2}),
  armor:std({color:0x4f5e3c,roughness:.42,metalness:.55}),alien:std({color:0x3a2a5a,roughness:.18,metalness:.85}),alien2:std({color:0x5a4a7e,roughness:.22,metalness:.9}),alienG:std({color:0x24563e,roughness:.2,metalness:.85})};
 for(const k in MS)MS[k].envMapIntensity=.25;return MS;}
const glowM=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.6)});
function build(parts){const g=new THREE.Group(),by=new Map();for(const[geo,mat,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1]of parts){let a=by.get(mat);if(!a)by.set(mat,a=[]);a.push([geo,M4(x,y,z,rx,ry,rz,sx,sy,sz)]);}
 for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);g.add(o);}return g;}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Cy=(r,l,s=12,r2)=>{const g=new THREE.CylinderGeometry(r,r2??r,l,s);g.rotateX(Math.PI/2);return g;},Sp=(r,ws=14,hs=10)=>new THREE.SphereGeometry(r,ws,hs);
export function gunModel(id){const M=mats(),w=WPN[id],gl=glowM(w.col);const P=[];let muzzle=new V(0,0,-.6);
 if(id==='ar'){P.push([B(.1,.15,.56),M.olive,0,0,-.1],[B(.11,.07,.5),M.dark,0,.1,-.12],[B(.08,.06,.3),M.dark,0,.15,-.06],[Cy(.03,.3),M.dark,0,.01,-.5],[B(.12,.12,.26),M.olive,0,-.005,-.46],
   [B(.07,.2,.09),M.grip,0,-.15,.04,.25],[B(.075,.22,.12),M.dark,0,-.16,-.18,-.2],[B(.1,.11,.16),M.dark,0,.0,.22],[B(.112,.01,.22),gl,0,.035,-.3]);muzzle.set(0,.01,-.68);}
 else if(id==='br'){P.push([B(.09,.13,.8),M.body,0,0,-.18],[B(.06,.07,.5),M.dark,0,-.08,-.2],[Cy(.025,.26),M.dark,0,.015,-.7],[Cy(.04,.26),M.dark,0,.13,-.08],[Cy(.045,.02),gl,0,.13,-.21],
   [B(.07,.18,.09),M.grip,0,-.14,.08,.3],[B(.07,.17,.08),M.dark,0,-.14,-.08,-.15],[B(.08,.1,.22),M.body,0,.01,.28],[B(.092,.008,.4),gl,0,.0,-.3]);muzzle.set(0,.015,-.84);}
 else if(id==='shotgun'){P.push([B(.13,.15,.62),M.dark,0,0,-.1],[Cy(.045,.5),M.light,0,.04,-.48],[Cy(.04,.44),M.dark,0,-.05,-.44],[B(.14,.1,.24),M.grip,0,-.06,-.42],
   [B(.08,.2,.1),M.grip,0,-.15,.08,.3],[B(.12,.13,.22),M.dark,0,0,.26],[B(.135,.01,.2),gl,0,.075,-.1]);muzzle.set(0,.04,-.74);}
 else if(id==='sniper'){P.push([B(.08,.12,1.05),M.dark,0,0,-.3],[Cy(.028,.6),M.light,0,.02,-.98],[B(.07,.18,.1),M.grip,0,-.14,.08,.3],[Cy(.05,.36),M.dark,0,.14,-.12],[Cy(.058,.03),gl,0,.14,-.31],[Cy(.058,.03),M.dark,0,.14,.07],
   [B(.08,.11,.26),M.dark,0,0,.32],[B(.03,.12,.03),M.light,0,-.09,-.62,.4]);muzzle.set(0,.02,-1.3);}
 else if(id==='rocket'){P.push([Cy(.12,1.1,16),M.olive,0,.02,-.15],[Cy(.135,.12,16),M.dark,0,.02,-.7],[Cy(.135,.12,16),M.dark,0,.02,.4],[B(.08,.2,.1),M.grip,0,-.17,.02,.25],[B(.07,.16,.08),M.grip,0,-.15,-.32],[B(.06,.08,.2),M.dark,-.13,.08,-.2],
   [Cy(.105,.02,16),gl,0,.02,-.77]);muzzle.set(0,.02,-.8);}
 else if(id==='spark'){P.push([Sp(.1),M.alienG,0,0,-.12,0,0,0,1,.7,1.8],[Sp(.07),M.alienG,0,-.02,.08,0,0,0,1,1,1.4],[B(.05,.15,.07),M.alien,0,-.1,.05,.3],[Sp(.045),gl,0,.02,-.3,0,0,0,1,1,.8],[new THREE.TorusGeometry(.07,.012,6,16),gl,0,0,-.22]);muzzle.set(0,.01,-.36);}
 else if(id==='ion'){P.push([Sp(.11),M.alien,0,0,-.18,0,0,0,1,.75,2.6],[Sp(.08),M.alien2,0,.06,.06,0,0,0,1,.8,1.6],[B(.05,.16,.08),M.alien,0,-.12,.06,.3],[Sp(.04),gl,-.07,.02,-.4],[Sp(.04),gl,.07,.02,-.4],
   [new THREE.TorusGeometry(.09,.014,6,18),gl,0,.0,-.3],[B(.012,.012,.32),gl,0,.1,-.15]);muzzle.set(0,.02,-.52);}
 else if(id==='mortar'){P.push([Sp(.2),M.alien,0,0,-.2,0,0,0,1,.8,2.4],[Sp(.12),gl,0,0,-.62],[new THREE.TorusGeometry(.17,.03,8,20),M.alien2,0,0,-.5]);muzzle.set(0,0,-.72);}
 const g=build(P);g.userData={muzzle,glow:gl};return g;}

/* ---------- first-person viewmodel ---------- */
export class Viewmodel{
 constructor(cam){this.root=new THREE.Group();cam.add(this.root);this.hold=new THREE.Group();this.hold.scale.setScalar(.6);this.root.add(this.hold);this.guns={};const M=mats();
  for(const id of PICKABLE){const g=gunModel(id);g.visible=false;this.hold.add(g);this.guns[id]=g;}
  // ammo counter screen on the rifle
  this.scr=document.createElement('canvas');this.scr.width=64;this.scr.height=32;this.scrTex=new THREE.CanvasTexture(this.scr);
  const sm=new THREE.Mesh(new THREE.PlaneGeometry(.075,.04),new THREE.MeshBasicMaterial({map:this.scrTex}));sm.position.set(0,.185,-.02);sm.rotation.x=-1.25;this.guns.ar.add(sm);
  const hand=()=>{const g=new THREE.Group();const a=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.32,4,10),M.armor);a.rotation.x=Math.PI/2;a.position.set(0,0,.24);const h=new THREE.Mesh(new THREE.BoxGeometry(.09,.075,.115),M.glove);g.add(a,h);
   const st=new THREE.Mesh(new THREE.BoxGeometry(.095,.012,.12),glowM(0x6fd0ff));st.position.set(0,.045,.25);g.add(st);return g;};
  this.handR=hand();this.handL=hand();this.hold.add(this.handR,this.handL);
  const fm=new THREE.MeshBasicMaterial({map:flashTex(),color:new THREE.Color(3,2.4,1.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.32,.32),fm);this.flash.visible=false;this.hold.add(this.flash);this.flashSide=this.flash.clone();this.flashSide.rotation.y=Math.PI/2;this.flash.add(this.flashSide);
  this.light=new THREE.PointLight(0xffc080,0,4,1.6);this.root.add(this.light);
  this.cur=null;this.sw={x:0,y:0};this.t=0;this.kick=0;this.flashT=0;this.bobP=0;this.base=new V(.17,-.19,-.4);this.pos=new V();this.lastAmmo=-1;}
 set(id){if(this.cur&&this.guns[this.cur])this.guns[this.cur].visible=false;this.cur=id;if(!id||!this.guns[id])return;const g=this.guns[id];g.visible=true;const w=WPN[id];
  this.light.color.set(w.col);this.flash.material.color.set(w.col).lerp(new THREE.Color(1,1,1),.4).multiplyScalar(3);
  const hp={ar:[[0,-.13,.06],[0,-.06,-.42]],br:[[0,-.12,.1],[0,-.06,-.36]],shotgun:[[0,-.13,.1],[0,-.07,-.42]],sniper:[[0,-.12,.1],[0,-.06,-.42]],rocket:[[0,-.15,.04],[0,-.14,-.3]],spark:[[0,-.1,.05],[-.03,-.12,-.05]],ion:[[0,-.12,.06],[0,-.06,-.3]]}[id];
  this.handR.position.set(...hp[0]);this.handR.rotation.set(-.15,.05,0);this.handL.position.set(...hp[1]);this.handL.rotation.set(-.1,.25,.4);this.handL.position.x-=.04;this.handL.visible=id!=='spark';}
 fire(){this.kick=1;this.flashT=.05;this.flash.rotation.z=Math.random()*3;}
 screen(n,max){if(n===this.lastAmmo)return;this.lastAmmo=n;const x=this.scr.getContext('2d');x.fillStyle='#0a1206';x.fillRect(0,0,64,32);x.fillStyle=n/max<.25?'#ff5a3a':'#9fff7a';x.font='bold 24px "JetBrains Mono",monospace';x.textAlign='center';x.fillText(String(n).padStart(2,'0'),32,25);this.scrTex.needsUpdate=true;}
 update(o){const dt=o.dt;this.t+=dt;const g=this.cur&&this.guns[this.cur];if(!g)return;
  this.sw.x=damp(this.sw.x,cl(-o.mdx*.0016,-.06,.06),9,dt);this.sw.y=damp(this.sw.y,cl(o.mdy*.0016,-.05,.05),9,dt);
  if(o.ground&&o.speed>.5)this.bobP+=dt*o.speed*(o.sprint?1.15:1.35);const bA=o.ground?Math.min(1,o.speed/8)*(o.sprint?1.6:1):0;
  this.kick=Math.max(0,this.kick-dt*(this.cur==='sniper'||this.cur==='rocket'?4:11));const k=this.kick*(WPN[this.cur].kick||1);
  const z=o.zoom*(o.scope?0:1),sp=o.sprint?1:0;this.spr=damp(this.spr||0,sp,8,dt);this.air=damp(this.air||0,o.air?1:0,6,dt);
  const p=this.pos.copy(this.base);p.x+=this.sw.x-z*.2+Math.cos(this.bobP)*.012*bA-this.spr*.04;p.y+=this.sw.y+Math.abs(Math.sin(this.bobP))*.012*bA+z*.07-this.spr*.05-this.air*.02;p.z+=k*.06+z*.08;
  let rx=.04+k*.12+this.spr*.4-this.air*.05,ry=.07+this.sw.x*2+this.spr*.75,rz=Math.cos(this.bobP)*.02*bA+this.spr*.2;
  if(o.reload>=0){const r=o.reload,dip=Math.sin(Math.min(1,r)*Math.PI);p.y-=dip*.12;rx-=dip*.5;rz+=dip*.6;}
  if(o.vent>0){const dip=Math.sin(Math.min(1,o.vent)*Math.PI);rz+=dip*.9;p.x+=dip*.05;ry-=dip*.3;}
  if(o.swap>0){p.y-=o.swap*.35;rx-=o.swap*.9;}
  if(o.melee>0){const m=Math.sin(o.melee*Math.PI);p.z-=.22*m;rx+=.25*m;rz-=.6*m;p.x-=.08*m;}
  this.hold.position.copy(p);this.hold.rotation.set(rx,ry,rz);this.root.visible=!(o.scope&&o.zoom>.6);
  if(g.userData.glow){const c=new THREE.Color(WPN[this.cur].col);const h=o.heat||0;g.userData.glow.color.copy(c).multiplyScalar(1.4+Math.sin(this.t*4)*.3).lerp(new THREE.Color(3,.6,.2),h*h);}
  this.flashT-=dt;const fv=this.flashT>0;this.flash.visible=fv;if(fv){const m=g.userData.muzzle;this.flash.position.copy(m);this.flash.scale.setScalar(this.cur==='shotgun'||this.cur==='rocket'?1.6:1);}
  this.light.intensity=fv?1.6:0;this.light.position.set(p.x,p.y,p.z-.6);}}
function flashTex(){return ctex(128,128,(x,w,h)=>{x.translate(w/2,h/2);for(let i=0;i<6;i++){x.rotate(Math.PI/3);const g=x.createLinearGradient(0,0,0,-h/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.beginPath();x.moveTo(-7,0);x.lineTo(0,-h/2+4);x.lineTo(7,0);x.fill();}
 const r=x.createRadialGradient(0,0,0,0,0,w/3);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,180,90,0)');x.fillStyle=r;x.beginPath();x.arc(0,0,w/3,0,7);x.fill();},{clamp:true});}
