// ZENITH PROTOCOL — primary weapons (one per hero), procedural gun models (first-person + world) and the animated viewmodel.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,ctex,merge,M4,rbox} from './util.js';

export const WPN={
 rivet:{name:'RIVET CANNON',mag:60,rate:.085,dmg:9,hs:1.5,spr:.026,sprMax:.045,sprAdd:.0018,range:42,fall:[16,32,.5],reload:2.3,col:0xffb040,tr:[3,1.6,.4],kick:.5,pref:[0,14],auto:1},
 scrap:{name:'SCRAP CANNON',mag:6,rate:.8,pel:10,dmg:8,hs:1.5,spr:.085,range:32,fall:[8,20,.3],reload:1.9,col:0x6fe8e0,tr:[.5,2.4,2.4],kick:1.4,pref:[0,8]},
 arc:{name:'ARC CARBINE',mag:34,rate:.08,dmg:7,hs:2,spr:.007,sprMax:.028,sprAdd:.0028,range:80,fall:[22,45,.5],reload:1.4,col:0x60d8ff,tr:[.5,1.8,3.4],kick:.35,pref:[4,22],auto:1},
 longbow:{name:'LONGBOW RAIL',mag:6,rate:.8,dmg:35,charged:125,charge:1.1,hs:2.5,spr:.012,range:220,reload:1.6,scope:1,zoom:3.4,col:0xd070ff,tr:[2.4,.6,3],kick:1.6,pref:[16,70],precision:1},
 ember:{name:'EMBER LAUNCHER',mag:6,rate:.75,proj:1,speed:30,grav:3,dmg:55,sdmg:45,splash:3,push:7,reload:1.7,col:0xff8a30,tr:[3,1.3,.3],kick:1.3,pref:[5,22]},
 beam:{name:'MENDING BEAM',beam:1,range:16,heal:60,dmg:24,col:0xffd27a,tr:[3,2.3,1.1],mag:0,pref:[3,11],kick:0},
 dart:{name:'BIO-DART RIFLE',mag:12,rate:.5,dmg:45,heal:60,hs:1.5,spr:.002,range:100,reload:1.5,col:0x7dff70,tr:[1.2,3.2,.6],kick:.8,pref:[8,28],ally:1,precision:1}};

/* ---------- gun models ---------- */
let MS=null;
function mats(){if(MS)return MS;const std=o=>new THREE.MeshStandardMaterial(o);
 MS={body:std({color:0x3c424e,roughness:.35,metalness:.8}),dark:std({color:0x17191e,roughness:.5,metalness:.6}),light:std({color:0x7a8190,roughness:.3,metalness:.85}),
  grip:std({color:0x24262c,roughness:.85,metalness:.1}),white:std({color:0xe8e6e0,roughness:.35,metalness:.15}),gold:std({color:0xd8a840,roughness:.28,metalness:.9}),
  violet:std({color:0x4a2e78,roughness:.3,metalness:.6}),orange:std({color:0xd85a26,roughness:.4,metalness:.4}),teal:std({color:0x26a890,roughness:.35,metalness:.5}),
  bronze:std({color:0x8a5a3a,roughness:.4,metalness:.7}),yellow:std({color:0xf0cc30,roughness:.35,metalness:.3})};for(const k in MS)MS[k].envMapIntensity=.6;return MS;}
const glowM=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.6)});
function build(parts){const g=new THREE.Group(),by=new Map();for(const[geo,mat,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1]of parts){let a=by.get(mat);if(!a)by.set(mat,a=[]);a.push([geo,M4(x,y,z,rx,ry,rz,sx,sy,sz)]);}
 for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);g.add(o);}return g;}
const B=(w,h,d)=>Math.min(w,h,d)>.02?rbox(w,h,d,Math.min(w,h,d)*.3):new THREE.BoxGeometry(w,h,d),Cy=(r,l,s=12,r2)=>{const g=new THREE.CylinderGeometry(r,r2??r,l,s);g.rotateX(Math.PI/2);return g;},S=(r)=>new THREE.SphereGeometry(r,16,12),T=(r,t)=>new THREE.TorusGeometry(r,t,6,20);
export function gunModel(id){const M=mats(),w=WPN[id],gl=glowM(w.col);const P=[];let muzzle=new V(0,0,-.6);
 if(id==='rivet'){P.push([B(.2,.2,.6),M.gold,0,0,-.1],[B(.16,.08,.5),M.dark,0,.13,-.08],[Cy(.12,.14,16),M.dark,0,-.03,-.42],[B(.12,.22,.12),M.grip,0,-.17,.08,.25],[Cy(.12,.12,20),M.body,0,-.16,-.12,0,0,Math.PI/2],
   [B(.21,.012,.4),gl,0,.03,-.12],[B(.18,.18,.2),M.body,0,0,.28]);for(let i=0;i<3;i++){const a=i/3*Math.PI*2;P.push([Cy(.032,.42),M.light,Math.cos(a)*.06,Math.sin(a)*.06-.02,-.62]);}P.push([Cy(.11,.03,16),gl,0,-.02,-.5]);muzzle.set(0,-.02,-.86);}
 else if(id==='scrap'){P.push([B(.22,.17,.56),M.bronze,0,0,-.08],[Cy(.06,.46),M.dark,-.06,.03,-.5],[Cy(.06,.46),M.dark,.06,.03,-.5],[B(.26,.06,.3),M.white,0,.11,-.1],[B(.18,.12,.24),M.grip,0,-.08,-.42],
   [B(.1,.22,.12),M.grip,0,-.16,.1,.3],[B(.225,.012,.34),gl,0,-.03,-.16],[Cy(.065,.02),gl,-.06,.03,-.72],[Cy(.065,.02),gl,.06,.03,-.72],[B(.2,.16,.2),M.bronze,0,0,.28]);muzzle.set(0,.03,-.76);}
 else if(id==='arc'){P.push([B(.09,.13,.66),M.yellow,0,0,-.14],[B(.1,.05,.5),M.white,0,.09,-.12],[Cy(.026,.32),M.dark,0,.01,-.6],[B(.07,.18,.09),M.grip,0,-.14,.06,.25],[B(.07,.16,.1),M.dark,0,-.12,-.2,-.15],[B(.08,.1,.2),M.white,0,.02,.24]);
  for(let i=0;i<4;i++)P.push([T(.05,.01),gl,0,.01,-.36-i*.07]);P.push([B(.092,.008,.4),gl,0,-.03,-.2]);muzzle.set(0,.01,-.78);}
 else if(id==='longbow'){P.push([B(.08,.12,.96),M.violet,0,0,-.26],[Cy(.026,.62),M.dark,0,.02,-.86],[B(.07,.18,.1),M.grip,0,-.14,.08,.3],[B(.08,.07,.24),M.dark,0,-.08,-.25],[Cy(.04,.36),M.dark,0,.13,-.14],[Cy(.048,.03),gl,0,.13,-.33],[B(.08,.1,.26),M.violet,0,0,.32],
   [B(.012,.16,.5),M.light,-.045,.05,-.4],[B(.012,.16,.5),M.light,.045,.05,-.4],[B(.082,.008,.6),gl,0,-.01,-.36]);muzzle.set(0,.02,-1.18);}
 else if(id==='ember'){P.push([Cy(.1,.68,16),M.orange,0,0,-.18],[Cy(.12,.12,16),M.dark,0,0,-.54],[Cy(.12,.1,16),M.dark,0,0,.12],[B(.08,.2,.1),M.grip,0,-.16,0,.25],[B(.07,.16,.08),M.grip,0,-.16,-.3],[B(.05,.06,.3),M.light,0,.13,-.18],
   [Cy(.075,.04,16),gl,0,0,-.61],[Cy(.105,.02,16),gl,0,0,-.4],[Cy(.105,.02,16),gl,0,0,-.05],[Cy(.035,.2,8),M.dark,.1,.02,-.15]);muzzle.set(0,0,-.64);}
 else if(id==='beam'){P.push([Cy(.03,.62,10),M.white,0,0,-.08],[B(.07,.06,.16),M.gold,0,-.02,.18],[Cy(.05,.1,12),M.gold,0,0,-.4],[T(.08,.012),M.gold,0,0,-.47],[B(.06,.16,.08),M.grip,0,-.1,.08,.2],[Cy(.04,.05,12,.02),M.gold,0,0,-.52]);
  P.push([S(.045),gl,0,0,-.54],[T(.11,.008),gl,0,0,-.5],[B(.012,.012,.3),gl,0,.035,-.12]);muzzle.set(0,0,-.56);}
 else if(id==='dart'){P.push([B(.08,.13,.6),M.teal,0,0,-.12],[B(.085,.05,.44),M.white,0,.09,-.1],[Cy(.022,.3),M.dark,0,.02,-.55],[B(.07,.18,.09),M.grip,0,-.14,.08,.25],[Cy(.035,.14,10),M.light,0,.14,-.06],
   [Cy(.04,.16,10),gl,0,-.1,-.24,0,0,0],[B(.082,.008,.36),gl,0,-.02,-.2],[B(.08,.1,.2),M.teal,0,.01,.24]);muzzle.set(0,.02,-.72);}
 const g=build(P);g.userData={muzzle,glow:gl};return g;}

/* ---------- first-person viewmodel ---------- */
export class Viewmodel{
 constructor(cam){this.root=new THREE.Group();cam.add(this.root);this.hold=new THREE.Group();this.hold.scale.setScalar(.7);this.root.add(this.hold);this.guns={};
  for(const id of Object.keys(WPN)){const g=gunModel(id);g.visible=false;this.hold.add(g);this.guns[id]=g;}
  this.armM=new THREE.MeshStandardMaterial({color:0x50607a,roughness:.35,metalness:.5,envMapIntensity:.6});this.gloveM=new THREE.MeshStandardMaterial({color:0x2a2d33,roughness:.75,metalness:.2});this.stripM=new THREE.MeshBasicMaterial({color:0x5fd8ff});
  const hand=()=>{const g=new THREE.Group();const a=new THREE.Mesh(new THREE.CapsuleGeometry(.05,.3,4,10),this.armM);a.rotation.x=Math.PI/2;a.position.set(0,0,.24);const h=new THREE.Mesh(new THREE.BoxGeometry(.09,.075,.11),this.gloveM);
   const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.062,.062,.06,12),this.gloveM);cuff.rotation.x=Math.PI/2;cuff.position.z=.1;const st=new THREE.Mesh(new THREE.BoxGeometry(.1,.012,.12),this.stripM);st.position.set(0,.048,.26);g.add(a,h,cuff,st);return g;};
  this.handR=hand();this.handL=hand();this.hold.add(this.handR,this.handL);
  const fm=new THREE.MeshBasicMaterial({map:flashTex(),color:new THREE.Color(3,2.4,1.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.32,.32),fm);this.flash.visible=false;this.hold.add(this.flash);this.flashSide=this.flash.clone();this.flashSide.rotation.y=Math.PI/2;this.flash.add(this.flashSide);
  this.light=new THREE.PointLight(0xffc080,0,4,1.6);this.root.add(this.light);
  this.cur=null;this.sw={x:0,y:0};this.t=0;this.kick=0;this.flashT=0;this.bobP=0;this.base=new V(.25,-.25,-.6);this.pos=new V();this.abil=0;}
 set(id,look,teamGlow){if(this.cur)this.guns[this.cur].visible=false;this.cur=id;if(!id)return;const g=this.guns[id];g.visible=true;const w=WPN[id];
  if(look){this.armM.color.set(look.armor);this.gloveM.color.set(look.trim).multiplyScalar(.6);}if(teamGlow)this.stripM.color.copy(teamGlow);
  this.light.color.set(w.col);this.flash.material.color.set(w.col).lerp(new THREE.Color(1,1,1),.4).multiplyScalar(3);
  const hp={rivet:[[0,-.15,.1],[0,-.08,-.4]],scrap:[[0,-.14,.1],[0,-.07,-.42]],arc:[[0,-.12,.06],[0,-.04,-.4]],longbow:[[0,-.12,.1],[0,-.06,-.34]],ember:[[0,-.14,.02],[0,-.13,-.3]],beam:[[0,-.08,.1],[-.02,-.02,-.3]],dart:[[0,-.12,.1],[0,-.06,-.36]]}[id];
  this.hold.scale.setScalar(id==='rivet'||id==='scrap'?.66:.6);
  this.handR.position.set(...hp[0]);this.handR.rotation.set(-.15,.05,0);this.handL.position.set(...hp[1]);this.handL.rotation.set(-.1,.25,.4);this.handL.position.x-=.04;}
 fire(){this.kick=1;this.flashT=this.cur==='beam'?0:.05;this.flash.rotation.z=Math.random()*3;}
 cast(){this.abil=1;}
 // o: {dt,mdx,mdy,speed,ground,air,reload(0..1|-1),melee(0..1),zoom(0..1),charge(0..1),scope,beam}
 update(o){const dt=o.dt;this.t+=dt;const g=this.cur&&this.guns[this.cur];if(!g)return;
  this.sw.x=damp(this.sw.x,cl(-o.mdx*.0016,-.06,.06),9,dt);this.sw.y=damp(this.sw.y,cl(o.mdy*.0016,-.05,.05),9,dt);
  if(o.ground&&o.speed>.5)this.bobP+=dt*o.speed*1.6;const bA=o.ground?Math.min(1,o.speed/6):0;
  this.kick=Math.max(0,this.kick-dt*(this.cur==='longbow'||this.cur==='ember'?4:11));const k=this.kick*(WPN[this.cur].kick||1);this.abil=Math.max(0,this.abil-dt*3);
  this.air=damp(this.air||0,o.air?1:0,6,dt);const p=this.pos.copy(this.base);
  p.x+=this.sw.x+Math.cos(this.bobP)*.012*bA;p.y+=this.sw.y+Math.abs(Math.sin(this.bobP))*.012*bA-this.air*.02;p.z+=k*.06;
  let rx=k*.12-this.air*.05,ry=this.sw.x*2,rz=Math.cos(this.bobP)*.02*bA;
  if(o.reload>=0){const r=o.reload,dip=Math.sin(Math.min(1,r)*Math.PI);p.y-=dip*.12;rx-=dip*.5;rz+=dip*.6;}
  if(o.melee>0){const m=Math.sin(o.melee*Math.PI);p.z-=.22*m;rx+=.25*m;rz-=.6*m;p.x-=.08*m;}
  if(this.abil>0){const a=Math.sin(this.abil*Math.PI);p.y-=a*.08;rz+=a*.4;}
  if(o.beam){p.x+=Math.sin(this.t*31)*.002;p.y+=Math.sin(this.t*27)*.002;}
  this.hold.position.copy(p);this.hold.rotation.set(rx,ry,rz);this.root.visible=!(o.scope&&o.zoom>.6);
  if(g.userData.glow){const c=new THREE.Color(WPN[this.cur].col);const pulse=this.cur==='longbow'?.8+o.charge*2.6:this.cur==='beam'?(o.beam?3.2+Math.sin(this.t*12)*.6:1.6):this.cur==='ember'?1.6+Math.sin(this.t*4)*.4:2;g.userData.glow.color.copy(c).multiplyScalar(pulse);}
  this.flashT-=dt;const fv=this.flashT>0;this.flash.visible=fv;if(fv){const m=g.userData.muzzle;this.flash.position.copy(m);this.flash.scale.setScalar(this.cur==='scrap'||this.cur==='ember'||this.cur==='rivet'?1.5:1);}
  this.light.intensity=fv?1.6:o.beam?.8:0;this.light.position.set(p.x,p.y,p.z-.6);}}
function flashTex(){return ctex(128,128,(x,w,h)=>{x.translate(w/2,h/2);for(let i=0;i<6;i++){x.rotate(Math.PI/3);const g=x.createLinearGradient(0,0,0,-h/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.beginPath();x.moveTo(-7,0);x.lineTo(0,-h/2+4);x.lineTo(7,0);x.fill();}
 const r=x.createRadialGradient(0,0,0,0,0,w/3);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,180,90,0)');x.fillStyle=r;x.beginPath();x.arc(0,0,w/3,0,7);x.fill();},{clamp:true});}
