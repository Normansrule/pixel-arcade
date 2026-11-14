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
 MS={body:std({color:0x3a4034,roughness:.45,metalness:.7}),dark:std({color:0x24272b,roughness:.48,metalness:.6}),light:std({color:0x6c7462,roughness:.4,metalness:.75}),
  grip:std({color:0x1e2020,roughness:.85,metalness:.1}),olive:std({color:0x4c5a36,roughness:.6,metalness:.35}),glove:std({color:0x2a2c28,roughness:.75,metalness:.2}),
  armor:std({color:0x4f5e3c,roughness:.42,metalness:.55}),alien:std({color:0x3a2a5a,roughness:.18,metalness:.85}),alien2:std({color:0x5a4a7e,roughness:.22,metalness:.9}),alienG:std({color:0x24563e,roughness:.2,metalness:.85}),
  lens:std({color:0x1a3a4a,roughness:.05,metalness:.9,emissive:0x0a3040,emissiveIntensity:.8})};
 for(const k in MS)MS[k].envMapIntensity=.6;return MS;}
const glowM=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.6)});
// parts: [geometry, material, x,y,z, rx,ry,rz, sx,sy,sz]; merged per material. The merged geometry is cached per gun id
// (bots and pickups all reuse it); the glow material stays per-instance because the viewmodel tints it with heat.
const GEO=new Map();
function build(id,parts,gl){let list=GEO.get(id);
 if(!list){const by=new Map();for(const[geo,mat,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1]of parts){const k=mat===gl?'GL':mat;let a=by.get(k);if(!a)by.set(k,a=[]);a.push([geo,M4(x,y,z,rx,ry,rz,sx,sy,sz)]);}
  list=[];for(const[k,a]of by)list.push([merge(a),k]);GEO.set(id,list);}
 const g=new THREE.Group();for(const[geo,k]of list)g.add(new THREE.Mesh(geo,k==='GL'?gl:k));return g;}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Cy=(r,l,s=12,r2)=>{const g=new THREE.CylinderGeometry(r,r2??r,l,s);g.rotateX(Math.PI/2);return g;},Sp=(r,ws=14,hs=10)=>new THREE.SphereGeometry(r,ws,hs);
// rounded box: a rounded-rectangle profile extruded along z with a small bevel, so edges catch the light
const RB=(w,h,d,r)=>{const s=new THREE.Shape(),x=-w/2+r,y=-h/2+r,W=w-2*r,H=h-2*r;s.moveTo(x,y-r);s.lineTo(x+W,y-r);s.quadraticCurveTo(x+W+r,y-r,x+W+r,y);s.lineTo(x+W+r,y+H);s.quadraticCurveTo(x+W+r,y+H+r,x+W,y+H+r);s.lineTo(x,y+H+r);s.quadraticCurveTo(x-r,y+H+r,x-r,y+H);s.lineTo(x-r,y);s.quadraticCurveTo(x-r,y-r,x,y-r);
 const b=Math.min(r*.6,d*.2);const g=new THREE.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b*.8,bevelSegments:2,curveSegments:3});g.translate(0,0,-(d-2*b)/2);g.deleteAttribute('uv');g.computeVertexNormals();return g;};
const Tor=(r,t,s=18)=>new THREE.TorusGeometry(r,t,6,s);
// shared bits: picatinny rail teeth, side vent slots, curved magazine, ribbed grip, optic lens
const rail=(P,M,y,z0,n,w=.044)=>{for(let i=0;i<n;i++)P.push([B(w,.008,.009),M.dark,0,y,z0-i*.021]);};
const vents=(P,M,x,y,z0,n,gap=.045)=>{for(const sx of[-1,1])for(let i=0;i<n;i++)P.push([RB(.006,.026,.03,.004),M.dark,sx*x,y,z0-i*gap]);};
const mag=(P,M,y,z,n=3,w=.052)=>{for(let i=0;i<n;i++)P.push([RB(w,.075,.085,.01),M.dark,0,y-i*.06,z-i*.022,-.18-i*.12]);};
const grip=(P,M,y,z)=>{P.push([RB(.058,.17,.078,.014),M.grip,0,y,z,.32]);for(let i=0;i<3;i++)P.push([B(.061,.006,.072),M.dark,0,y+.02-i*.04,z+.005+i*.012,.32]);P.push([B(.012,.012,.1),M.dark,0,y+.05,z-.08],[B(.012,.05,.012),M.dark,0,y+.025,z-.13]);};
export function gunModel(id){const M=mats(),w=WPN[id],gl=glowM(w.col);const P=[];let muzzle=new V(0,0,-.6);
 if(id==='ar'){// MK7: armoured receiver, vented shroud, reflex sight, curved mag, ported brake
  P.push([RB(.1,.13,.42,.018),M.olive,0,0,-.08],[RB(.092,.05,.46,.014),M.dark,0,.085,-.12],[RB(.112,.11,.26,.022),M.olive,0,-.005,-.44],[RB(.116,.03,.2,.008),M.dark,0,-.07,-.44]);
  vents(P,M,.057,.01,-.36,5);rail(P,M,.114,.06,9);
  P.push([Cy(.017,.2,12),M.dark,0,.015,-.64],[Cy(.03,.085,14),M.dark,0,.015,-.77],[B(.064,.012,.018),M.grip,0,.015,-.785],[B(.064,.012,.018),M.grip,0,.015,-.755]);
  mag(P,M,-.1,-.15);grip(P,M,-.12,.06);
  P.push([RB(.1,.11,.16,.02),M.dark,0,-.005,.22],[RB(.104,.13,.035,.012),M.grip,0,-.01,.31],[B(.02,.018,.04),M.light,.055,.05,.04]);
  // reflex sight: hood, glass, red dot; housing under the ammo screen
  P.push([RB(.06,.012,.06,.004),M.dark,0,.14,-.2],[RB(.012,.05,.06,.004),M.dark,-.026,.12,-.2],[RB(.012,.05,.06,.004),M.dark,.026,.12,-.2],[B(.04,.036,.004),M.lens,0,.122,-.2],[B(.006,.006,.004),gl,0,.124,-.196],
   [RB(.086,.04,.09,.01),M.dark,0,.155,-.02],[B(.114,.01,.2),gl,0,.03,-.3]);muzzle.set(0,.015,-.82);}
 else if(id==='br'){// VX-3: long receiver, 3x scope with bells and turrets, bipod-ready rail
  P.push([RB(.088,.12,.56,.016),M.body,0,0,-.14],[RB(.08,.045,.6,.012),M.light,0,.075,-.17],[RB(.096,.09,.3,.02),M.body,0,.005,-.56]);
  vents(P,M,.049,.01,-.46,6,.04);rail(P,M,.102,.06,12,.04);
  P.push([Cy(.016,.24,12),M.dark,0,.015,-.82],[Cy(.026,.07,14),M.dark,0,.015,-.95]);mag(P,M,-.1,-.14,2,.048);grip(P,M,-.12,.1);
  P.push([Cy(.024,.24,16),M.dark,0,.15,-.1],[Cy(.034,.07,18,.024),M.dark,0,.15,-.25],[Cy(.03,.05,18,.024),M.dark,0,.15,.04],[Cy(.013,.03,10),M.light,0,.182,-.1,-Math.PI/2],[Cy(.012,.028,10),M.light,.032,.15,-.1,0,Math.PI/2],
   [RB(.05,.035,.025,.006),M.dark,0,.118,-.18],[RB(.05,.035,.025,.006),M.dark,0,.118,-.02],[Cy(.03,.004,18),M.lens,0,.15,-.286],[Cy(.025,.004,18),M.lens,0,.15,.066]);
  P.push([RB(.08,.1,.22,.018),M.body,0,0,.3],[RB(.084,.12,.03,.01),M.grip,0,-.01,.42],[RB(.03,.03,.16,.008),M.dark,0,.07,.28],[B(.092,.008,.4),gl,0,.0,-.3]);muzzle.set(0,.015,-.99);}
 else if(id==='shotgun'){// BREACHER-12: boxy receiver, heat-shielded barrel over a mag tube, ribbed pump
  P.push([RB(.12,.15,.4,.02),M.dark,0,0,-.04],[RB(.124,.04,.34,.01),M.light,0,.085,-.04],[Cy(.034,.5),M.dark,0,.045,-.48],[Cy(.03,.46),M.dark,0,-.03,-.44]);
  P.push([RB(.088,.036,.42,.012),M.light,0,.085,-.5]);for(let i=0;i<6;i++)P.push([B(.06,.008,.02),M.dark,0,.105,-.33-i*.06]);
  for(let i=0;i<6;i++)P.push([RB(.11,.09,.025,.012),M.grip,0,-.03,-.34-i*.032]);P.push([Cy(.04,.03,14),M.dark,0,.045,-.74],[RB(.13,.08,.04,.012),M.dark,0,.0,-.2]);
  grip(P,M,-.13,.1);P.push([RB(.11,.12,.2,.02),M.dark,0,-.01,.26],[RB(.114,.14,.035,.012),M.grip,0,-.015,.37],[B(.13,.01,.2),gl,0,.06,-.06],[RB(.03,.03,.04,.006),M.light,0,.125,-.1]);muzzle.set(0,.045,-.78);}
 else if(id==='sniper'){// LONGBOW: fluted heavy barrel, big objective, bolt, cheek riser, folded bipod
  P.push([RB(.08,.12,.62,.016),M.dark,0,0,-.1],[RB(.09,.1,.36,.02),M.olive,0,.0,-.56],[Cy(.026,.66,14),M.dark,0,.02,-1.02],[Cy(.034,.1,14),M.dark,0,.02,-1.38]);
  for(let i=0;i<6;i++)P.push([Cy(.03,.012,14),M.light,0,.02,-.82-i*.08]);for(const sx of[-1,1])P.push([Cy(.007,.32,6),M.light,sx*.03,-.06,-.6]);
  P.push([Cy(.032,.38,16),M.dark,0,.16,-.14],[Cy(.052,.1,20,.032),M.dark,0,.16,-.36],[Cy(.04,.06,18,.032),M.dark,0,.16,.08],[Cy(.048,.004,20),M.lens,0,.16,-.412],[Cy(.034,.004,18),M.lens,0,.16,.112],
   [Cy(.016,.04,10),M.light,0,.205,-.14,-Math.PI/2],[Cy(.016,.034,10),M.light,.042,.16,-.14,0,Math.PI/2],[RB(.06,.06,.03,.008),M.dark,0,.11,-.24],[RB(.06,.06,.03,.008),M.dark,0,.11,-.04]);
  P.push([Cy(.012,.06,8),M.light,.06,.04,.04,0,Math.PI/2],[Sp(.018,10,8),M.light,.095,.04,.04]);mag(P,M,-.09,-.1,1,.05);grip(P,M,-.12,.1);
  P.push([RB(.075,.12,.3,.02),M.olive,0,-.01,.34],[RB(.05,.04,.16,.01),M.dark,0,.075,.3],[RB(.08,.15,.035,.012),M.grip,0,-.015,.5],[B(.082,.008,.5),gl,0,.0,-.2]);muzzle.set(0,.02,-1.44);}
 else if(id==='rocket'){// HAMMER: ribbed tube, flared backblast, sight box, two grips, warhead visible in the bore
  P.push([Cy(.12,1.0,18),M.olive,0,.02,-.15],[Cy(.14,.14,18,.125),M.dark,0,.02,-.68],[Cy(.16,.16,18,.12),M.dark,0,.02,.42]);for(let i=0;i<4;i++)P.push([Cy(.128,.025,18),M.dark,0,.02,-.42+i*.2]);
  P.push([Cy(.06,.08,14),gl,0,.02,-.74],[RB(.07,.09,.18,.012),M.dark,-.15,.08,-.2],[B(.05,.04,.004),M.lens,-.15,.08,-.292],[RB(.025,.06,.03,.006),M.dark,-.11,.05,-.2]);
  grip(P,M,-.16,.02);P.push([RB(.06,.15,.07,.012),M.grip,0,-.16,-.32,-.1],[RB(.24,.03,.12,.01),M.dark,0,-.11,.1],[B(.012,.012,.6),gl,.125,.05,-.15]);muzzle.set(0,.02,-.8);}
 else if(id==='spark'){P.push([Sp(.1),M.alienG,0,0,-.12,0,0,0,1,.7,1.8],[Sp(.07),M.alienG,0,-.02,.08,0,0,0,1,1,1.4],[RB(.05,.15,.07,.016),M.alien,0,-.1,.05,.3],[Sp(.045),gl,0,.02,-.3,0,0,0,1,1,.8],[Tor(.07,.012),gl,0,0,-.22],
   [Sp(.05),M.alien2,0,.07,-.06,0,0,0,.6,.5,1.6],[Tor(.085,.008),M.alien2,0,0,-.1],[B(.006,.06,.16),gl,0,.07,-.08]);for(const sx of[-1,1])P.push([Sp(.04),M.alien2,sx*.08,-.01,-.1,0,0,sx*.4,.4,.8,1.8]);muzzle.set(0,.01,-.36);}
 else if(id==='ion'){P.push([Sp(.11),M.alien,0,0,-.18,0,0,0,1,.75,2.6],[Sp(.08),M.alien2,0,.06,.06,0,0,0,1,.8,1.6],[RB(.05,.16,.08,.016),M.alien,0,-.12,.06,.3],[Sp(.04),gl,-.07,.02,-.4],[Sp(.04),gl,.07,.02,-.4],
   [Tor(.09,.014),gl,0,.0,-.3],[B(.012,.012,.32),gl,0,.1,-.15],[Tor(.105,.01),M.alien2,0,0,-.14],[Tor(.1,.01),M.alien2,0,0,-.04]);for(const sx of[-1,1])P.push([Sp(.05),M.alien2,sx*.1,0,-.22,0,0,0,.35,.6,2.2],[Sp(.02),gl,sx*.11,.03,-.08]);muzzle.set(0,.02,-.52);}
 else if(id==='mortar'){P.push([Sp(.2),M.alien,0,0,-.2,0,0,0,1,.8,2.4],[Sp(.12),gl,0,0,-.62],[Tor(.17,.03,20),M.alien2,0,0,-.5],[Tor(.2,.02,22),M.alien2,0,0,-.25]);for(let i=0;i<3;i++)P.push([Sp(.06),M.alien2,0,.16,-.05-i*.15,0,0,0,.5,.5,1.2]);muzzle.set(0,0,-.72);}
 const g=build(id,P,gl);g.userData={muzzle,glow:gl};return g;}

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
