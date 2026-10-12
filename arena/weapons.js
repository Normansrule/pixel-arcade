// NOVA ARENA — arsenal: weapon + grenade definitions, procedural gun models (first-person + world), the animated viewmodel.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,ctex,merge,M4} from './util.js';
import {glowTex} from './tex.js';

export const WPN={
 pulse:{name:'PULSE RIFLE',mag:36,res:216,rate:.085,dmg:8,hs:1.4,spr:.011,sprMax:.05,sprAdd:.0045,range:95,fall:[26,70,.55],reload:1.9,zoom:1.3,auto:true,col:0x5fd8ff,tr:[.4,1.3,2.8],kick:.45,pref:[0,26],tier:1},
 carbine:{name:'BURST CARBINE',mag:24,res:120,rate:.46,burst:3,gap:.07,dmg:13,hs:2.5,spr:.0032,sprMax:.012,sprAdd:.0018,range:150,fall:[55,120,.8],reload:2.1,zoom:2.3,precision:true,col:0xffc850,tr:[2.6,1.7,.45],kick:.55,pref:[8,48],tier:1},
 scatter:{name:'SCATTER BLASTER',mag:6,res:18,rate:.82,pel:11,dmg:11,hs:1.1,spr:.075,range:40,fall:[6,18,.1],reload:2.4,zoom:1.15,col:0xff8a30,tr:[2.8,1.1,.35],kick:1.5,pref:[0,9],power:1,tier:3},
 rail:{name:'RAIL LANCE',mag:4,res:8,rate:1.15,charge:.42,dmg:135,hs:2.7,spr:0,range:320,reload:2.6,zoom:4.4,scope:true,pierce:true,col:0x60ffb0,tr:[.6,3.4,1.7],kick:2.4,pref:[12,140],power:1,tier:3},
 plasma:{name:'PLASMA LAUNCHER',mag:2,res:4,rate:1,proj:1,speed:42,dmg:150,splash:4.8,sdmg:150,push:15,reload:2.7,zoom:1.4,col:0xc060ff,tr:[2.2,.7,3.2],kick:1.9,pref:[5,42],power:1,tier:3},
 blade:{name:'ARC BLADE',mag:10,res:0,rate:.72,melee:1,lunge:7.2,dmg:999,col:0x4ad8ff,tr:[.5,1.8,3.4],kick:1,pref:[0,6.5],power:1,tier:3,noReload:1}};
export const WORDER=['pulse','carbine','scatter','rail','plasma','blade'];
export const NADE={frag:{name:'FRAG',fuse:2.1,dmg:130,r:5.6,push:13,col:[3,1.4,.3]},plasma:{name:'PLASMA',fuse:1.7,dmg:165,r:4.4,push:10,stick:1,col:[.6,1.2,3.4]}};
export const SPAWN_KIT=['pulse','carbine'];

/* ---------- gun models ---------- */
let MS=null;
function mats(){if(MS)return MS;const std=o=>new THREE.MeshStandardMaterial(o);
 MS={body:std({color:0x3c424e,roughness:.35,metalness:.85}),dark:std({color:0x16181d,roughness:.5,metalness:.6}),light:std({color:0x6a7180,roughness:.35,metalness:.85}),
  grip:std({color:0x1f2228,roughness:.85,metalness:.1}),white:std({color:0xb8bcc6,roughness:.4,metalness:.3}),glove:std({color:0x2a2d33,roughness:.75,metalness:.2}),
  armor:std({color:0x50607a,roughness:.32,metalness:.6})};for(const k in MS)MS[k].envMapIntensity=.2;return MS;}
const glowM=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.15)});
// part list -> merged meshes per material; returns group
function build(parts){const g=new THREE.Group(),by=new Map();for(const[geo,mat,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1]of parts){let a=by.get(mat);if(!a)by.set(mat,a=[]);a.push([geo,M4(x,y,z,rx,ry,rz,sx,sy,sz)]);}
 for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);g.add(o);}return g;}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Cy=(r,l,s=12,r2)=>{const g=new THREE.CylinderGeometry(r,r2??r,l,s);g.rotateX(Math.PI/2);return g;};
export function gunModel(id){const M=mats(),w=WPN[id],gl=glowM(w.col);const P=[];let muzzle=new V(0,0,-.6),extra={};
 if(id==='pulse'){P.push([B(.11,.14,.62),M.body,0,0,-.12],[B(.12,.06,.5),M.dark,0,.095,-.1],[B(.09,.05,.28),M.dark,0,.13,-.08],[Cy(.035,.34),M.dark,0,.01,-.55],[B(.1,.1,.24),M.body,0,-.01,-.48],
   [B(.08,.2,.1),M.grip,0,-.14,.04,.25],[B(.09,.18,.13),M.dark,0,-.12,-.22,-.15],[B(.113,.008,.3),gl,0,.03,-.35],[B(.113,.008,.12),gl,0,-.05,-.5],[B(.1,.12,.2),M.body,0,.02,.26]);muzzle.set(0,.01,-.74);}
 else if(id==='carbine'){P.push([B(.08,.12,.78),M.white,0,0,-.18],[B(.06,.07,.5),M.dark,0,-.07,-.2],[Cy(.026,.3),M.dark,0,.02,-.7],[Cy(.04,.24),M.dark,0,.13,-.1],[B(.03,.06,.04),M.dark,0,.07,-.1],
   [Cy(.045,.02),gl,0,.13,-.225],[B(.07,.18,.09),M.grip,0,-.14,.08,.3],[B(.07,.15,.08),M.dark,0,-.13,-.12,-.2],[B(.083,.008,.4),gl,0,.0,-.32],[B(.07,.1,.22),M.white,0,.01,.28]);muzzle.set(0,.02,-.86);}
 else if(id==='scatter'){P.push([B(.16,.15,.6),M.body,0,0,-.1],[Cy(.045,.42),M.dark,-.04,.03,-.5],[Cy(.045,.42),M.dark,.04,.03,-.5],[B(.18,.05,.36),M.light,0,.1,-.12],[B(.15,.12,.22),M.grip,0,-.08,-.45],
   [B(.09,.2,.11),M.grip,0,-.15,.08,.3],[B(.163,.01,.3),gl,0,-.03,-.2],[B(.163,.01,.02),gl,0,.06,-.38],[B(.13,.12,.18),M.body,0,0,.26]);muzzle.set(0,.03,-.72);}
 else if(id==='rail'){P.push([B(.09,.13,.9),M.body,0,0,-.25],[Cy(.03,.6),M.light,0,.02,-.78],[B(.07,.18,.1),M.grip,0,-.14,.08,.3],[B(.08,.08,.24),M.dark,0,-.09,-.25],[Cy(.045,.32),M.dark,0,.14,-.12],[Cy(.05,.03),M.dark,0,.14,-.29],[B(.08,.1,.24),M.body,0,0,.3]);
  for(let i=0;i<5;i++)P.push([new THREE.TorusGeometry(.065,.012,6,18),gl,0,.02,-.5-i*.08]);P.push([B(.093,.008,.5),gl,0,-.02,-.3]);muzzle.set(0,.02,-1.1);}
 else if(id==='plasma'){P.push([Cy(.11,.72,16),M.body,0,0,-.2],[Cy(.125,.1,16),M.dark,0,0,-.56],[Cy(.125,.1,16),M.dark,0,0,.12],[B(.08,.2,.1),M.grip,0,-.17,.0,.25],[B(.07,.16,.08),M.grip,0,-.16,-.32],[B(.05,.06,.3),M.light,0,.14,-.2],
   [Cy(.08,.3,16),gl,0,0,-.22],[Cy(.135,.02,16),gl,0,0,-.42],[Cy(.135,.02,16),gl,0,0,.02]);muzzle.set(0,0,-.64);}
 else if(id==='blade'){P.push([Cy(.04,.3,10),M.light,0,-.05,.0,0,0,0],[B(.12,.05,.06),M.dark,0,-.05,-.17],[B(.06,.05,.05),M.dark,0,-.05,.17]);
  const bl=new THREE.MeshBasicMaterial({color:new THREE.Color(w.col).multiplyScalar(3),transparent:true,opacity:.92,blending:THREE.AdditiveBlending,depthWrite:false});
  const prong=s=>{const g=new THREE.ConeGeometry(.035,.75,4);g.rotateX(-Math.PI/2);g.scale(1,.5,1);return g;};const g=build(P);
  for(const s of[-1,1]){const p=new THREE.Mesh(prong(),bl);p.position.set(s*.04,-.05,-.55);p.rotation.y=s*.05;g.add(p);}extra.blade=bl;g.userData={muzzle:new V(0,-.05,-.8),...extra,glow:bl};return g;}
 const g=build(P);g.userData={muzzle,glow:gl,...extra};return g;}

/* ---------- first-person viewmodel ---------- */
export class Viewmodel{
 constructor(cam){this.root=new THREE.Group();cam.add(this.root);this.hold=new THREE.Group();this.hold.scale.setScalar(.7);this.root.add(this.hold);this.guns={};const M=mats();
  for(const id of Object.keys(WPN)){const g=gunModel(id);g.visible=false;this.hold.add(g);this.guns[id]=g;}
  // ammo screen on the pulse rifle
  this.scr=document.createElement('canvas');this.scr.width=64;this.scr.height=32;this.scrTex=new THREE.CanvasTexture(this.scr);
  const sm=new THREE.Mesh(new THREE.PlaneGeometry(.085,.042),new THREE.MeshBasicMaterial({map:this.scrTex,color:new THREE.Color(.9,.9,.9)}));sm.position.set(0,.138,.06);sm.rotation.x=-1.2;this.guns.pulse.add(sm);
  // gloved hands + forearms
  const hand=(sx)=>{const g=new THREE.Group();const a=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.32,4,10),M.armor);a.rotation.x=Math.PI/2;a.position.set(0,0,.24);const h=new THREE.Mesh(new THREE.BoxGeometry(.085,.07,.11),M.glove);g.add(a,h);
   const st=new THREE.Mesh(new THREE.BoxGeometry(.09,.012,.12),glowM(0x5fd8ff));st.position.set(0,.04,.25);g.add(st);return g;};
  this.handR=hand(1);this.handL=hand(-1);this.hold.add(this.handR,this.handL);
  // muzzle flash + light
  const fm=new THREE.MeshBasicMaterial({map:flashTex(),color:new THREE.Color(3,2.4,1.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.32,.32),fm);this.flash.visible=false;this.hold.add(this.flash);this.flashSide=this.flash.clone();this.flashSide.rotation.y=Math.PI/2;this.flash.add(this.flashSide);
  this.light=new THREE.PointLight(0xffc080,0,4,1.6);this.root.add(this.light);
  this.cur=null;this.sw={x:0,y:0};this.t=0;this.kick=0;this.flashT=0;this.bobP=0;this.base=new V(.16,-.16,-.3);this.pos=new V();this.lastAmmo=-1;}
 set(id){if(this.cur)this.guns[this.cur].visible=false;this.cur=id;if(!id)return;const g=this.guns[id];g.visible=true;const w=WPN[id];
  this.light.color.set(w.col);this.flash.material.color.set(w.col).lerp(new THREE.Color(1,1,1),.4).multiplyScalar(3);
  // hand placement per weapon
  const hp={pulse:[[0,-.12,.06],[0,-.04,-.42]],carbine:[[0,-.12,.1],[0,-.06,-.36]],scatter:[[0,-.13,.1],[0,-.06,-.44]],rail:[[0,-.12,.1],[0,-.06,-.34]],plasma:[[0,-.14,.02],[0,-.13,-.32]],blade:[[0,-.06,.02],[-.05,-.06,.1]]}[id];
  this.handR.position.set(...hp[0]);this.handR.rotation.set(-.15,.05,0);this.handL.position.set(...hp[1]);this.handL.rotation.set(-.1,.25,.4);this.handL.position.x-=.04;this.handL.visible=id!=='blade';}
 fire(){this.kick=1;this.flashT=.05;this.flash.rotation.z=Math.random()*3;}
 screen(n,max){if(n===this.lastAmmo)return;this.lastAmmo=n;const x=this.scr.getContext('2d');x.fillStyle='#02121a';x.fillRect(0,0,64,32);x.fillStyle=n/max<.25?'#ff5a3a':'#7fe8ff';x.font='bold 24px "JetBrains Mono",monospace';x.textAlign='center';x.fillText(String(n).padStart(2,'0'),32,25);this.scrTex.needsUpdate=true;}
 // o: {dt,mdx,mdy,speed,ground,sprint,slide,air,reload(0..1|-1),swap(0..1 lowering/raising),melee(0..1),zoom(0..1),charge(0..1),scope}
 update(o){const dt=o.dt;this.t+=dt;const g=this.cur&&this.guns[this.cur];if(!g)return;
  this.sw.x=damp(this.sw.x,cl(-o.mdx*.0016,-.06,.06),9,dt);this.sw.y=damp(this.sw.y,cl(o.mdy*.0016,-.05,.05),9,dt);
  if(o.ground&&o.speed>.5)this.bobP+=dt*o.speed*(o.sprint?1.15:1.35);const bA=o.ground?Math.min(1,o.speed/8)*(o.sprint?1.6:1):0;
  this.kick=Math.max(0,this.kick-dt*(this.cur==='rail'||this.cur==='plasma'?4:11));const k=this.kick*(WPN[this.cur].kick||1);
  const z=o.zoom*(this.cur==='rail'?0:1),sp=o.sprint&&!o.slide?1:0;this.spr=damp(this.spr||0,sp,8,dt);this.sld=damp(this.sld||0,o.slide?1:0,10,dt);this.air=damp(this.air||0,o.air?1:0,6,dt);
  const p=this.pos.copy(this.base);p.x+=this.sw.x-z*.2+Math.cos(this.bobP)*.012*bA-this.spr*.04;p.y+=this.sw.y+Math.abs(Math.sin(this.bobP))*.012*bA+z*.07-this.spr*.05-this.air*.02-this.sld*.03;p.z+=k*.06+z*.08;
  let rx=k*.12+this.spr*.4-this.air*.05,ry=this.sw.x*2+this.spr*.75,rz=Math.cos(this.bobP)*.02*bA+this.sld*.35+this.spr*.2;
  if(o.reload>=0){const r=o.reload,dip=Math.sin(Math.min(1,r)*Math.PI);p.y-=dip*.12;rx-=dip*.5;rz+=dip*.6;}
  if(o.swap>0){p.y-=o.swap*.35;rx-=o.swap*.9;}
  if(o.melee>0){const m=Math.sin(o.melee*Math.PI);if(this.cur==='blade'){ry+=-1.2*m+.6;rx+=-.4*m;p.x-=.15*m;p.z-=.18*m;rz+=1.1*m;}else{p.z-=.22*m;rx+=.25*m;rz-=.6*m;p.x-=.08*m;}}
  this.hold.position.copy(p);this.hold.rotation.set(rx,ry,rz);this.root.visible=!(o.scope&&o.zoom>.6);
  // weapon glow: rail charge, blade pulse, plasma breath
  if(g.userData.glow){const c=new THREE.Color(WPN[this.cur].col);const pulse=this.cur==='rail'?.6+o.charge*3:this.cur==='plasma'?1.6+Math.sin(this.t*4)*.5:this.cur==='blade'?2.6+Math.sin(this.t*9)*.4:2.2;g.userData.glow.color.copy(c).multiplyScalar(pulse);}
  this.flashT-=dt;const fv=this.flashT>0&&this.cur!=='blade';this.flash.visible=fv;if(fv){const m=g.userData.muzzle;this.flash.position.copy(m);this.flash.scale.setScalar(this.cur==='scatter'||this.cur==='plasma'?1.6:1);}
  this.light.intensity=fv?1.6:0;this.light.position.set(p.x,p.y,p.z-.6);}}
function flashTex(){return ctex(128,128,(x,w,h)=>{x.translate(w/2,h/2);for(let i=0;i<6;i++){x.rotate(Math.PI/3);const g=x.createLinearGradient(0,0,0,-h/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.beginPath();x.moveTo(-7,0);x.lineTo(0,-h/2+4);x.lineTo(7,0);x.fill();}
 const r=x.createRadialGradient(0,0,0,0,0,w/3);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,180,90,0)');x.fillStyle=r;x.beginPath();x.arc(0,0,w/3,0,7);x.fill();},{clamp:true});}
