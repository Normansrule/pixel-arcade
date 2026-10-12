// HARDFALL — arsenal: pilot weapons (VX rifle, Mauler shotgun, Seeker smart pistol), the grunt carbine, frame (mech) armaments,
// procedural gun models, the animated first-person viewmodel and the frame cockpit (frame struts, console, spinning chaingun).
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,ctex,merge,M4} from './util.js';

export const WPN={
 rifle:{name:'VX-7 RIFLE',mag:30,rate:.088,dmg:17,hs:1.5,spr:.011,sprMax:.045,sprAdd:.0042,range:110,fall:[26,70,.6],reload:1.8,zoom:1.45,col:0xffb860,tr:[2.6,1.6,.6],kick:.5,pref:[6,45],mech:.28,snd:'rifle'},
 shotgun:{name:'MAULER SHOTGUN',mag:8,rate:.6,pel:9,dmg:12,hs:1.25,spr:.068,range:36,fall:[7,20,.15],reload:2.3,zoom:1.15,col:0xff9040,tr:[2.8,1.3,.4],kick:1.5,pref:[0,9],mech:.3,snd:'shotgun'},
 seeker:{name:'SEEKER PISTOL',mag:12,rate:.15,dmg:13,lockDmg:36,hs:1.2,spr:.018,sprMax:.04,sprAdd:.006,range:45,lockR:32,lockCone:.33,reload:1.5,zoom:1.1,col:0x60e0ff,tr:[.6,1.8,3],kick:.6,pref:[0,22],mech:.15,snd:'seeker',smart:true},
 carbine:{name:'GRUNT CARBINE',mag:24,rate:.15,dmg:9,hs:1.4,spr:.024,sprMax:.05,sprAdd:.004,range:80,fall:[20,60,.6],reload:2.2,zoom:1,col:0xffc880,tr:[2.2,1.5,.6],kick:.4,pref:[4,40],mech:.25,snd:'carbine'}};
export const PILOT_KIT=['rifle','shotgun','seeker'];
export const NADE={fuse:2,dmg:120,r:5.4,push:12,mechDmg:420};
// BULWARK frame
export const MECH={hp:2600,sh:700,shDelay:4,shRate:180,walk:6.3,run:8.4,accel:6,r:1.5,h:6.4,eye:4.75,step:1.15,
 cg:{name:'XO-16 CHAINGUN',mag:160,rate:.064,dmg:22,mechDmg:34,spin:.4,spr:.014,sprMax:.03,range:150,reload:2.8},
 rk:{name:'SALVO ROCKETS',n:4,gap:.11,cd:7,speed:58,dmg:85,mechDmg:220,r:4.2},aegis:{dur:5.5,cd:14,absorb:1600},dash:{v:19,n:2,regen:4.2},punch:{cd:1.1,dmg:420,range:5.5}};

/* ---------- gun models ---------- */
let MS=null;
function mats(){if(MS)return MS;const std=o=>new THREE.MeshStandardMaterial(o);
 MS={body:std({color:0x4a4e55,roughness:.38,metalness:.55}),dark:std({color:0x24272c,roughness:.45,metalness:.5}),light:std({color:0x767a80,roughness:.35,metalness:.6}),
  grip:std({color:0x24262a,roughness:.85,metalness:.1}),tan:std({color:0x8a7a5e,roughness:.7,metalness:.15}),glove:std({color:0x2c2e30,roughness:.75,metalness:.2}),
  armor:std({color:0x4c5562,roughness:.35,metalness:.6})};for(const k in MS)MS[k].envMapIntensity=.9;return MS;}
const glowM=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.4)});
function build(parts){const g=new THREE.Group(),by=new Map();for(const[geo,mat,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1]of parts){let a=by.get(mat);if(!a)by.set(mat,a=[]);a.push([geo,M4(x,y,z,rx,ry,rz,sx,sy,sz)]);}
 for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);g.add(o);}return g;}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Cy=(r,l,s=12,r2)=>{const g=new THREE.CylinderGeometry(r,r2??r,l,s);g.rotateX(Math.PI/2);return g;};
export function gunModel(id){const M=mats(),w=WPN[id],gl=glowM(w.col);const P=[];let muzzle=new V(0,0,-.6);
 if(id==='rifle'||id==='carbine'){const b=id==='rifle'?M.body:M.tan;P.push([B(.08,.13,.56),b,0,0,-.1],[B(.07,.05,.42),M.dark,0,.09,-.12],[Cy(.022,.3),M.dark,0,.02,-.52],[B(.06,.1,.2),b,0,-.0,-.42],[B(.04,.04,.06),M.dark,0,.02,-.68],
   [B(.06,.17,.08),M.grip,0,-.13,.05,.3],[B(.06,.2,.09),M.dark,0,-.15,-.13,-.18],[B(.07,.1,.24),b,0,.0,.26],[B(.05,.06,.1),M.dark,0,.14,-.05],[B(.083,.008,.2),gl,0,.03,-.26]);
  if(id==='rifle')P.push([Cy(.03,.12),M.dark,0,.14,-.12],[B(.02,.03,.03),gl,0,.155,-.05]);muzzle.set(0,.02,-.72);}
 else if(id==='shotgun'){P.push([B(.11,.14,.58),M.body,0,0,-.1],[Cy(.04,.44),M.dark,0,.03,-.48],[B(.12,.04,.32),M.light,0,.1,-.12],[B(.1,.1,.24),M.grip,0,-.07,-.42],
   [B(.08,.19,.1),M.grip,0,-.15,.08,.3],[B(.112,.01,.26),gl,0,-.03,-.2],[B(.1,.11,.2),M.body,0,0,.26],[B(.1,.12,.06),M.dark,.0,-.06,-.02]);muzzle.set(0,.03,-.72);}
 else if(id==='seeker'){P.push([B(.06,.09,.26),M.body,0,0,-.08],[B(.055,.05,.24),M.light,0,.06,-.09],[B(.05,.16,.07),M.grip,0,-.1,.04,.25],[Cy(.018,.05),M.dark,0,.03,-.23],
   [B(.08,.06,.07),M.dark,0,.12,-.03],[B(.07,.045,.005),gl,0,.12,-.068],[B(.062,.008,.18),gl,0,-.01,-.09]);muzzle.set(0,.03,-.26);}
 const g=build(P);g.userData={muzzle,glow:gl};return g;}

/* ---------- first-person viewmodel (pilot) ---------- */
export class Viewmodel{
 constructor(cam){this.root=new THREE.Group();cam.add(this.root);this.hold=new THREE.Group();this.hold.scale.setScalar(.7);this.root.add(this.hold);this.guns={};const M=mats();
  for(const id of['rifle','shotgun','seeker']){const g=gunModel(id);g.visible=false;this.hold.add(g);this.guns[id]=g;}
  const hand=(sx)=>{const g=new THREE.Group();const a=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.32,4,10),M.armor);a.rotation.x=Math.PI/2;a.position.set(0,0,.24);const h=new THREE.Mesh(new THREE.BoxGeometry(.085,.07,.11),M.glove);g.add(a,h);
   const st=new THREE.Mesh(new THREE.BoxGeometry(.09,.012,.12),glowM(0x60c8ff));st.position.set(0,.04,.25);g.add(st);return g;};
  this.handR=hand(1);this.handL=hand(-1);this.hold.add(this.handR,this.handL);
  const fm=new THREE.MeshBasicMaterial({map:flashTex(),color:new THREE.Color(3,2.2,1.3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.3,.3),fm);this.flash.visible=false;this.hold.add(this.flash);this.flashSide=this.flash.clone();this.flashSide.rotation.y=Math.PI/2;this.flash.add(this.flashSide);
  this.light=new THREE.PointLight(0xffb070,0,4,1.6);this.root.add(this.light);
  this.cur=null;this.sw={x:0,y:0};this.t=0;this.kick=0;this.flashT=0;this.bobP=0;this.base=new V(.16,-.16,-.3);this.pos=new V();}
 set(id){if(this.cur)this.guns[this.cur].visible=false;this.cur=id;if(!id)return;const g=this.guns[id];g.visible=true;const w=WPN[id];
  this.flash.material.color.set(w.col).lerp(new THREE.Color(1,1,1),.4).multiplyScalar(3);this.light.color.set(w.col);
  const hp={rifle:[[0,-.12,.08],[0,-.06,-.4]],shotgun:[[0,-.13,.1],[0,-.06,-.42]],seeker:[[0,-.1,.05],[-.02,-.12,.02]]}[id];
  this.handR.position.set(...hp[0]);this.handR.rotation.set(-.15,.05,0);this.handL.position.set(...hp[1]);this.handL.rotation.set(-.1,.25,.4);this.handL.position.x-=.04;this.handL.visible=id!=='seeker';
  this.base.set(id==='seeker'?.14:.16,id==='seeker'?-.15:-.16,id==='seeker'?-.34:-.3);}
 fire(){this.kick=1;this.flashT=.045;this.flash.rotation.z=Math.random()*3;}
 // o: {dt,mdx,mdy,speed,ground,sprint,slide,air,wall,reload,swap,melee,zoom}
 update(o){const dt=o.dt;this.t+=dt;const g=this.cur&&this.guns[this.cur];if(!g)return;
  this.sw.x=damp(this.sw.x,cl(-o.mdx*.0016,-.06,.06),9,dt);this.sw.y=damp(this.sw.y,cl(o.mdy*.0016,-.05,.05),9,dt);
  if((o.ground||o.wall)&&o.speed>.5)this.bobP+=dt*o.speed*(o.sprint?1.15:1.35);const bA=o.ground||o.wall?Math.min(1,o.speed/8)*(o.sprint?1.6:1):0;
  this.kick=Math.max(0,this.kick-dt*(this.cur==='shotgun'?5:12));const k=this.kick*(WPN[this.cur].kick||1);
  const z=o.zoom,sp=o.sprint&&!o.slide?1:0;this.spr=damp(this.spr||0,sp,8,dt);this.sld=damp(this.sld||0,o.slide?1:0,10,dt);this.air=damp(this.air||0,o.air?1:0,6,dt);this.wl=damp(this.wl||0,o.wall||0,8,dt);
  const p=this.pos.copy(this.base);p.x+=this.sw.x-z*(this.cur==='seeker'?.14:.16)+Math.cos(this.bobP)*.012*bA-this.spr*.04;p.y+=this.sw.y+Math.abs(Math.sin(this.bobP))*.012*bA+z*.06-this.spr*.05-this.air*.025-this.sld*.03;p.z+=k*.06+z*.06;
  let rx=k*.12+this.spr*.4-this.air*.06,ry=this.sw.x*2+this.spr*.75,rz=Math.cos(this.bobP)*.02*bA+this.sld*.35+this.spr*.2+this.wl*.25;
  if(o.reload>=0){const r=o.reload,dip=Math.sin(Math.min(1,r)*Math.PI);p.y-=dip*.12;rx-=dip*.5;rz+=dip*.6;}
  if(o.swap>0){p.y-=o.swap*.35;rx-=o.swap*.9;}
  if(o.melee>0){const m=Math.sin(o.melee*Math.PI);p.y-=.18*m;rx-=.6*m;}
  this.hold.position.copy(p);this.hold.rotation.set(rx,ry,rz);
  if(g.userData.glow){g.userData.glow.color.set(WPN[this.cur].col).multiplyScalar(1.4+(o.lock||0)*1.6);}
  this.flashT-=dt;const fv=this.flashT>0;this.flash.visible=fv;if(fv){const m=g.userData.muzzle;this.flash.position.copy(m);this.flash.scale.setScalar(this.cur==='shotgun'?1.7:this.cur==='seeker'?.8:1);}
  this.light.intensity=fv?1.8:0;this.light.position.set(p.x,p.y,p.z-.6);}}
function flashTex(){return ctex(128,128,(x,w,h)=>{x.translate(w/2,h/2);for(let i=0;i<6;i++){x.rotate(Math.PI/3);const g=x.createLinearGradient(0,0,0,-h/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.beginPath();x.moveTo(-7,0);x.lineTo(0,-h/2+4);x.lineTo(7,0);x.fill();}
 const r=x.createRadialGradient(0,0,0,0,0,w/3);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,180,90,0)');x.fillStyle=r;x.beginPath();x.arc(0,0,w/3,0,7);x.fill();},{clamp:true});}

/* ---------- frame cockpit (first person inside the mech) ---------- */
export class Cockpit{
 constructor(cam){const M=mats();this.root=new THREE.Group();this.root.visible=false;cam.add(this.root);const fr=new THREE.Group();this.frame=fr;this.root.add(fr);
  const dark=new THREE.MeshStandardMaterial({color:0x1b1d21,roughness:.55,metalness:.7}),mid=new THREE.MeshStandardMaterial({color:0x3a3f46,roughness:.4,metalness:.8});
  this.glow=new THREE.MeshBasicMaterial({color:new THREE.Color(.4,1.4,2.6)});const warn=new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,1.2,.25)});
  const P=[];// struts: top bar, angled pillars, lower console
  P.push([B(1.6,.09,.2),dark,0,.36,-.62],[B(.09,.95,.16),dark,-.6,0,-.6,0,0,-.22],[B(.09,.95,.16),dark,.6,0,-.6,0,0,.22],[B(1.5,.16,.4),dark,0,-.38,-.55,-.4],[B(.6,.06,.3),mid,0,-.3,-.62,-.5]);
  for(const s of[-1,1])P.push([B(.04,.6,.05),mid,s*.53,.02,-.66,0,0,s*.22],[B(.35,.1,.25),mid,s*.42,.33,-.6,0,0,s*.1]);
  fr.add(build(P));const L=[];L.push([B(1.3,.006,.01),this.glow,0,.31,-.6],[B(.006,.7,.01),this.glow,-.55,.0,-.58,0,0,-.22],[B(.006,.7,.01),this.glow,.55,.0,-.58,0,0,.22],[B(.5,.005,.01),warn,0,-.27,-.6]);fr.add(build(L));
  // console screens
  this.scr=document.createElement('canvas');this.scr.width=256;this.scr.height=64;this.scrTex=new THREE.CanvasTexture(this.scr);
  const sm=new THREE.Mesh(new THREE.PlaneGeometry(.36,.09),new THREE.MeshBasicMaterial({map:this.scrTex,color:new THREE.Color(1.3,1.3,1.3)}));sm.position.set(0,-.29,-.57);sm.rotation.x=-.6;fr.add(sm);
  // chaingun (lower right) + barrels
  const gun=this.gun=new THREE.Group();gun.position.set(.42,-.36,-.85);this.root.add(gun);
  gun.add(build([[B(.24,.24,.6),dark,0,0,.1],[Cy(.12,.25,16),mid,0,0,-.3],[B(.06,.08,.5),this.glow,.13,.04,.1],[B(.18,.1,.3),mid,0,-.16,.15]]));
  const br=this.barrels=new THREE.Group();br.position.z=-.45;gun.add(br);const bp=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2;bp.push([Cy(.024,.75,8),M.light,Math.cos(a)*.065,Math.sin(a)*.065,-.35]);}bp.push([Cy(.1,.05,14),dark,0,0,-.68],[Cy(.1,.05,14),dark,0,0,-.1]);br.add(build(bp));
  const fm=new THREE.MeshBasicMaterial({map:flashTex(),color:new THREE.Color(3,2,1.1),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),fm);this.flash.position.z=-.8;this.flash.visible=false;br.add(this.flash);
  this.light=new THREE.PointLight(0xffb060,0,6,1.6);this.light.position.set(.3,-.2,-1.2);this.root.add(this.light);
  this.spin=0;this.kick=0;this.t=0;this.sw={x:0,y:0};this.flashT=0;this.last='';}
 fire(){this.kick=1;this.flashT=.04;this.flash.rotation.z=Math.random()*3;}
 screen(lines){const s=lines.join('|');if(s===this.last)return;this.last=s;const x=this.scr.getContext('2d');x.fillStyle='#03101a';x.fillRect(0,0,256,64);x.font='bold 15px "JetBrains Mono",monospace';
  lines.forEach((l,i)=>{x.fillStyle=l.startsWith('!')?'#ffb040':'#7fe8ff';x.fillText(l.replace('!',''),8,18+i*16);});this.scrTex.needsUpdate=true;}
 // o: {dt,mdx,mdy,speed,spin,dash,step,shield}
 update(o){const dt=o.dt;this.t+=dt;this.spin+=dt*o.spin*42;this.barrels.rotation.z=this.spin;this.kick=Math.max(0,this.kick-dt*14);
  this.sw.x=damp(this.sw.x,cl(-o.mdx*.0009,-.04,.04),6,dt);this.sw.y=damp(this.sw.y,cl(o.mdy*.0009,-.03,.03),6,dt);
  const bob=Math.sin(o.step*Math.PI)*.012*Math.min(1,o.speed/6);this.root.position.set(this.sw.x*.5,-Math.abs(bob)+this.sw.y*.5,0);
  this.gun.position.set(.42+this.sw.x,-.36+this.sw.y-Math.abs(bob)*1.5+this.kick*.008*(Math.random()-.5),-.85+this.kick*.03);this.gun.rotation.set(o.punch?-.2:0,this.sw.x*2,0);
  this.flashT-=dt;const fv=this.flashT>0;this.flash.visible=fv;this.light.intensity=fv?2.5:0;
  this.glow.color.setRGB(.4,1.4,2.6).multiplyScalar(o.alarm?(Math.sin(this.t*12)>0?1.6:.4):1);}}
