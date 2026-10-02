// FRONTLINE OPS — weapon stats, recoil patterns, attachments and the first-person viewmodel (gun + animated hands).
import * as THREE from '../vendor/three.module.min.js';
import {merge} from './world.js';
const V=THREE.Vector3,M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(r1,r2,h,s=12)=>new THREE.CylinderGeometry(r1,r2,h,s),ZC=(r,len,s=12)=>{const g=CY(r,r,len,s);g.rotateX(Math.PI/2);return g;};

// dmg [near, far] over range [start falloff, end falloff] (meters); spread in degrees; recoil [vertical, horizontal] degrees per shot
export const WEAPONS={
 ar:{id:'ar',name:'HAVOC-4',cls:'ASSAULT RIFLE',dmg:[31,23],range:[30,65],rpm:720,auto:1,mag:30,res:150,reload:2.0,reloadE:2.55,ads:.22,adsZoom:1.45,hip:3.2,adsSpr:.06,move:2.6,recoil:[.62,.24],kick:.03,speed:1,sway:.22,head:1.5,att:['reddot','grip','supp','ext'],snd:{f:1700,b:95,len:.16}},
 smg:{id:'smg',name:'WASP-9',cls:'SUBMACHINE GUN',dmg:[27,15],range:[12,32],rpm:920,auto:1,mag:32,res:192,reload:1.7,reloadE:2.1,ads:.17,adsZoom:1.3,hip:2.3,adsSpr:.14,move:1.4,recoil:[.44,.3],kick:.025,speed:1.08,sway:.18,head:1.4,att:['reddot','grip','supp','ext'],snd:{f:2300,b:120,len:.11}},
 sniper:{id:'sniper',name:'LONGBOW .338',cls:'SNIPER RIFLE',dmg:[110,96],range:[70,140],rpm:52,auto:0,bolt:1,mag:5,res:30,reload:2.7,reloadE:3.2,ads:.36,adsZoom:4.5,hip:7.5,adsSpr:0,move:6,recoil:[3.4,.7],kick:.09,speed:.93,sway:1.1,head:3,scope:1,att:['grip','supp','ext'],snd:{f:900,b:60,len:.42}},
 shotgun:{id:'shotgun',name:'BREACHER-12',cls:'SHOTGUN',dmg:[17,4],range:[7,22],rpm:78,auto:0,pump:1,pellets:9,mag:7,res:35,reload:.48,shell:1,ads:.2,adsZoom:1.2,hip:4.6,adsSpr:3.4,move:1,recoil:[2.8,.9],kick:.08,speed:.98,sway:.2,head:1.3,att:['reddot','grip','ext'],snd:{f:1100,b:70,len:.3}},
 pistol:{id:'pistol',name:'P-11',cls:'PISTOL',dmg:[34,21],range:[12,30],rpm:420,auto:0,mag:12,res:72,reload:1.45,reloadE:1.8,ads:.15,adsZoom:1.25,hip:2.2,adsSpr:.35,move:1.2,recoil:[1.3,.45],kick:.045,speed:1.1,sway:.15,head:1.6,att:['supp'],snd:{f:2000,b:110,len:.13}}};
export const PRIMARIES=['ar','smg','sniper','shotgun'];
export const ATT={reddot:{name:'RED DOT',rank:1,desc:'Reflex optic. Clean sight picture, tighter ADS zoom.'},grip:{name:'VERTICAL GRIP',rank:2,desc:'Foregrip. 25% less recoil and sway.'},
 supp:{name:'SUPPRESSOR',rank:3,desc:'Stay off enemy radar, no muzzle flash. 15% less range.'},ext:{name:'EXTENDED MAG',rank:4,desc:'50% more rounds per magazine, slightly slower reload.'}};
export const RANKS=['RECRUIT','PRIVATE','PRIVATE 1ST CLASS','SPECIALIST','CORPORAL','SERGEANT','STAFF SERGEANT','SERGEANT 1ST CLASS','MASTER SERGEANT','2ND LIEUTENANT','1ST LIEUTENANT','CAPTAIN','MAJOR','LT. COLONEL','COLONEL','BRIGADIER','COMMANDER'];
export const rankXP=r=>r<=0?0:Math.round(400*r+180*r*r);// total xp needed to reach rank r
export function rankOf(xp){let r=0;while(r<RANKS.length-1&&xp>=rankXP(r+1))r++;return r;}

// deterministic recoil pattern (learnable): returns [up, side] multipliers for shot i
export function pattern(id,i){if(id==='ar'){const H=[0,.3,.6,.8,.5,.1,-.4,-.9,-1.1,-.8,-.3,.3,.8,1.1,.9,.4,-.2,-.7,-1,-.6];return[1+(i<4?.25:0)-(i>14?.25:0),H[i%H.length]];}
 if(id==='smg')return[.9+Math.sin(i*.7)*.15,Math.sin(i*.55+.3)*1.1+Math.sin(i*1.9)*.35];return[1,Math.sin(i*2.3)*.6];}
export function dmgAt(w,d,o){const r0=w.range[0]*(o&&o.supp?.85:1),r1=w.range[1]*(o&&o.supp?.85:1);const k=d<=r0?0:d>=r1?1:(d-r0)/(r1-r0);return w.dmg[0]+(w.dmg[1]-w.dmg[0])*k;}

/* ================= viewmodel ================= */
export function buildViewmodel(TX){const std=o=>new THREE.MeshStandardMaterial(o);
 const M={metal:std({color:0x3c4046,roughness:.38,metalness:.55}),poly:std({color:0x2b2d31,roughness:.55,metalness:.12}),tan:std({color:0x9a8866,roughness:.7,metalness:.05}),wood:std({map:TX.wood.map,color:0x9a6a40,roughness:.6}),
  glove:std({color:0x3a352c,roughness:.85}),sleeve:std({map:TX.camoA,roughness:.95}),skin:std({color:0xa87a5a,roughness:.7}),steel:std({color:0xb8bcc0,roughness:.18,metalness:1}),olive:std({color:0x4a5034,roughness:.6}),
  lens:std({color:0x10202a,roughness:.05,metalness:.9,transparent:true,opacity:.35}),dot:new THREE.MeshBasicMaterial({color:new THREE.Color(8,.4,.3)}),flash:new THREE.MeshBasicMaterial({map:TX.flash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(2.2,1.8,1.3),side:THREE.DoubleSide})};
 const root=new THREE.Group();
 const add=(p,geo,m,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);p.add(o);return o;};
 const parts=(p,list)=>{for(const[m,geos]of list)add(p,merge(geos),m);};
 const guns={};
 const mkGun=(id,fn)=>{const g=new THREE.Group();g.visible=false;root.add(g);const u={slots:{}};fn(g,u);u.muzzle=u.muzzle||new THREE.Object3D();g.add(u.muzzle);
  const fl=add(u.muzzle,new THREE.PlaneGeometry(.22,.22),M.flash);const f2=add(fl,new THREE.PlaneGeometry(.22,.22),M.flash,0,0,0,0,Math.PI/2);const f3=add(u.muzzle,new THREE.PlaneGeometry(.12,.12),M.flash,0,0,-.02,Math.PI/2);fl.visible=false;u.flash=fl;u.flash2=f3;f3.visible=false;g.userData=u;guns[id]=g;};
 // shared attachment builders
 const redDot=(p,y,z)=>{const r=new THREE.Group();r.position.set(0,y,z);p.add(r);parts(r,[[M.poly,[{geo:BX(.034,.012,.07),m:M4(0,.006,0)},{geo:BX(.005,.042,.066),m:M4(.0175,.031,0)},{geo:BX(.005,.042,.066),m:M4(-.0175,.031,0)},{geo:BX(.04,.006,.066),m:M4(0,.053,0)},{geo:BX(.012,.008,.03),m:M4(.022,.03,.01)}]]]);
  add(r,new THREE.PlaneGeometry(.026,.03),M.lens,0,.03,-.028);add(r,new THREE.SphereGeometry(.0016,6,4),M.dot,0,.03,-.03);return r;};
 const supp=(p,z,r=.02,len=.17)=>{const s=new THREE.Group();s.position.set(0,0,z);p.add(s);add(s,ZC(r,len,14),M.poly,0,0,-len/2);add(s,ZC(r*1.08,.012,14),M.metal,0,0,-.005);return s;};
 const grip=(p,y,z)=>{const s=new THREE.Group();s.position.set(0,y,z);p.add(s);add(s,CY(.014,.016,.085,10),M.poly,0,-.045,0);return s;};
 // ---- HAVOC-4 assault rifle
 mkGun('ar',(g,u)=>{parts(g,[[M.metal,[{geo:BX(.052,.06,.3),m:M4(0,.01,-.06)},{geo:BX(.024,.008,.36),m:M4(0,.047,-.08)},{geo:ZC(.011,.22),m:M4(0,.02,-.42)},{geo:ZC(.016,.04),m:M4(0,.02,-.52)}]],
   [M.tan,[{geo:BX(.056,.056,.22),m:M4(0,.018,-.29)},{geo:BX(.034,.095,.042),m:M4(0,-.045,.06,.3)},{geo:BX(.044,.055,.2),m:M4(0,-.022,.2)},{geo:BX(.046,.1,.03),m:M4(0,-.03,.3)}]],
   [M.poly,[{geo:BX(.06,.008,.18),m:M4(0,-.012,-.29)},{geo:BX(.012,.03,.06),m:M4(0,.02,.1)},...Array.from({length:12},(_,i)=>({geo:BX(.028,.006,.012),m:M4(0,.053,.06-i*.026)})),...Array.from({length:5},(_,i)=>({geo:BX(.058,.012,.02),m:M4(0,.022,-.21-i*.038)})),{geo:BX(.004,.022,.05),m:M4(.027,.018,-.01)},{geo:BX(.03,.006,.05),m:M4(0,-.03,.03)},{geo:BX(.016,.012,.03),m:M4(0,.05,.1)}]]]);
  u.mag=add(g,merge([{geo:BX(.034,.13,.07),m:M4(0,-.065,0,.12)},{geo:BX(.036,.03,.075),m:M4(0,-.135,.012,.16)}]),M.poly,0,-.02,-.1);u.magY=-.02;
  u.ext=add(u.mag,BX(.034,.06,.07),M.poly,0,-.17,.02,.2);
  u.slots.iron=new THREE.Group();g.add(u.slots.iron);parts(u.slots.iron,[[M.metal,[{geo:BX(.024,.026,.02),m:M4(0,.062,.06)},{geo:BX(.005,.012,.016),m:M4(.009,.081,.06)},{geo:BX(.005,.012,.016),m:M4(-.009,.081,.06)},{geo:BX(.016,.04,.012),m:M4(0,.07,-.38)},{geo:BX(.003,.018,.003),m:M4(0,.094,-.38)}]]]);
  u.slots.reddot=redDot(g,.051,-.04);u.slots.supp=supp(g,-.54);u.slots.fh=add(g,ZC(.014,.035),M.metal,0,.02,-.555);u.slots.grip=grip(g,-.04,-.3);
  u.sight={iron:.0855,reddot:.081};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.02,-.6);u.hand=[new V(0,-.07,.07),new V(0,-.03,-.3)];u.bolt=add(g,BX(.012,.012,.03),M.steel,-.03,.03,-.02);});
 // ---- WASP-9 SMG
 mkGun('smg',(g,u)=>{parts(g,[[M.poly,[{geo:BX(.05,.07,.26),m:M4(0,.0,-.08)},{geo:BX(.034,.09,.04),m:M4(0,-.06,.04,.25)},{geo:BX(.05,.03,.12),m:M4(0,-.035,-.15)},{geo:BX(.01,.01,.17),m:M4(.018,-.005,.13)},{geo:BX(.01,.01,.17),m:M4(-.018,-.005,.13)},{geo:BX(.045,.06,.012),m:M4(0,-.01,.22)}]],
   [M.metal,[{geo:BX(.02,.008,.24),m:M4(0,.038,-.08)},{geo:ZC(.01,.1),m:M4(0,.01,-.25)}]]]);
  u.mag=add(g,BX(.028,.16,.045),M.metal,0,-.1,-.12);u.magY=-.1;u.ext=add(u.mag,BX(.028,.07,.045),M.metal,0,-.11,0);
  u.slots.iron=new THREE.Group();g.add(u.slots.iron);parts(u.slots.iron,[[M.metal,[{geo:BX(.007,.02,.015),m:M4(.008,.05,.02)},{geo:BX(.007,.02,.015),m:M4(-.008,.05,.02)},{geo:BX(.004,.026,.01),m:M4(0,.055,-.19)}]]]);parts(g,[[M.metal,[{geo:BX(.004,.03,.08),m:M4(.026,.01,-.05)},{geo:BX(.052,.004,.24),m:M4(0,.036,-.08)}]]]);
  u.slots.reddot=redDot(g,.042,-.07);u.slots.supp=supp(g,-.3,.019,.16);u.slots.fh=add(g,ZC(.012,.025),M.metal,0,.01,-.31);u.slots.grip=grip(g,-.05,-.17);
  u.sight={iron:.067,reddot:.072};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.01,-.34);u.hand=[new V(0,-.08,.05),new V(0,-.05,-.16)];});
 // ---- LONGBOW sniper
 mkGun('sniper',(g,u)=>{parts(g,[[M.olive,[{geo:BX(.05,.07,.3),m:M4(0,0,0)},{geo:BX(.05,.06,.3),m:M4(0,-.005,-.28)},{geo:BX(.044,.08,.26),m:M4(0,-.035,.27)},{geo:BX(.046,.12,.03),m:M4(0,-.035,.4)},{geo:BX(.03,.03,.12),m:M4(0,.015,.24)},{geo:BX(.034,.09,.04),m:M4(0,-.06,.1,.3)}]],
   [M.metal,[{geo:ZC(.012,.6),m:M4(0,.015,-.6)},{geo:ZC(.017,.06),m:M4(0,.015,-.92)},{geo:ZC(.021,.27),m:M4(0,.085,-.04)},{geo:CY(.03,.021,.06,14).rotateX(Math.PI/2),m:M4(0,.085,-.2)},{geo:CY(.021,.027,.05,14).rotateX(Math.PI/2),m:M4(0,.085,.11)},{geo:BX(.012,.04,.012),m:M4(0,.055,-.08)},{geo:BX(.012,.04,.012),m:M4(0,.055,.04)},{geo:ZC(.012,.03),m:M4(.03,.085,-.03,0,Math.PI/2)}]]]);
  add(g,new THREE.CircleGeometry(.026,16),M.lens,0,.085,.136);
  u.mag=add(g,BX(.034,.06,.08),M.metal,0,-.06,-.04);u.magY=-.06;u.ext=add(u.mag,BX(.034,.04,.08),M.metal,0,-.05,0);
  u.bolt=add(g,merge([{geo:CY(.006,.006,.05,8),m:M4(-.04,.02,.05,0,0,Math.PI/2)},{geo:new THREE.SphereGeometry(.012,8,6),m:M4(-.068,.02,.05)}]),M.steel);
  u.slots.supp=supp(g,-.95,.022,.2);u.slots.grip=grip(g,-.04,-.3);u.sight={scope:.085};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.015,-.97);u.hand=[new V(0,-.07,.08),new V(0,-.04,-.3)];});
 // ---- BREACHER-12 shotgun
 mkGun('shotgun',(g,u)=>{parts(g,[[M.metal,[{geo:BX(.05,.07,.24),m:M4(0,0,-.02)},{geo:ZC(.016,.56),m:M4(0,.02,-.42)},{geo:ZC(.013,.44),m:M4(0,-.018,-.36)},{geo:BX(.008,.012,.008),m:M4(0,.04,-.69)}]],
   [M.wood,[{geo:BX(.044,.075,.24),m:M4(0,-.02,.22,.06)},{geo:BX(.034,.09,.04),m:M4(0,-.05,.08,.3)}]]]);
  u.pump=add(g,BX(.05,.05,.15),M.wood,0,-.018,-.3);u.mag=null;
  u.slots.iron=new THREE.Group();g.add(u.slots.iron);parts(u.slots.iron,[[M.metal,[{geo:BX(.006,.012,.006),m:M4(0,.048,-.66)},{geo:BX(.02,.012,.02),m:M4(0,.042,.06)}]]]);
  u.slots.reddot=redDot(g,.035,-.05);u.slots.grip=grip(g,-.05,-.32);u.slots.extTube=add(g,ZC(.013,.12),M.metal,0,-.018,-.64);
  u.sight={iron:.052,reddot:.065};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.02,-.71);u.hand=[new V(0,-.07,.08),new V(0,-.05,-.3)];u.shellAnchor=new V(.03,-.02,-.02);});
 // ---- P-11 pistol
 mkGun('pistol',(g,u)=>{u.slide=add(g,merge([{geo:BX(.032,.034,.17),m:M4(0,.02,-.05)},{geo:BX(.006,.01,.006),m:M4(0,.042,-.125)},{geo:BX(.02,.01,.008),m:M4(0,.042,.025)}]),M.metal);
  parts(g,[[M.poly,[{geo:BX(.03,.022,.15),m:M4(0,-.005,-.045)},{geo:BX(.03,.1,.045),m:M4(0,-.06,.02,.22)},{geo:BX(.008,.02,.03),m:M4(0,-.025,-.01)}]]]);
  u.mag=add(g,BX(.024,.08,.035),M.metal,0,-.07,.022);u.magY=-.07;u.magR=.22;u.mag.rotation.x=.22;u.slots.supp=supp(g,-.14,.016,.12);u.slots.supp.position.y=.02;
  u.sight={iron:.047};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.02,-.15);u.hand=[new V(0,-.07,.03),new V(-.012,-.07,.035)];});
 // ---- knife + grenade (left/right hand props)
 const knife=new THREE.Group();knife.visible=false;root.add(knife);parts(knife,[[M.steel,[{geo:BX(.004,.032,.17),m:M4(0,.005,-.13)}]],[M.poly,[{geo:BX(.022,.03,.1),m:M4(0,0,0)},{geo:BX(.03,.01,.012),m:M4(0,0,-.05)}]]]);
 const nade=new THREE.Group();nade.visible=false;root.add(nade);parts(nade,[[M.olive,[{geo:new THREE.SphereGeometry(.032,12,10),m:M4(0,0,0,0,0,0,1,1.2,1)}]],[M.metal,[{geo:BX(.012,.05,.01),m:M4(.03,.01,0)},{geo:new THREE.TorusGeometry(.012,.002,6,12),m:M4(0,.045,0)}]]]);
 // ---- arms: forearm sleeve + glove, re-oriented between points each frame
 const unitCyl=r=>{const g=CY(r*.92,r,1,10);g.translate(0,.5,0);return g;};
 const mkArm=()=>{const a=new THREE.Group();root.add(a);const fore=add(a,unitCyl(.034),M.sleeve),upper=add(a,unitCyl(.045),M.sleeve),hand=add(a,merge([{geo:BX(.05,.055,.075),m:M4(0,0,0)},{geo:BX(.045,.02,.06),m:M4(0,-.03,-.03,.4)},{geo:BX(.018,.045,.02),m:M4(.03,.01,-.02,0,0,-.5)}]),M.glove),
  watch=add(a,BX(.042,.016,.03),M.poly),cuff=add(a,unitCyl(.038),M.glove);return{a,fore,upper,hand,watch,cuff};};
 const arms=[mkArm(),mkArm()];
 const q=new THREE.Quaternion(),up=new V(0,1,0),d=new V();
 const seg=(m,a,b)=>{d.subVectors(b,a);const l=d.length();m.position.copy(a);m.quaternion.setFromUnitVectors(up,d.multiplyScalar(1/l));m.scale.set(1,l,1);};
 // place arm: hand position, elbow, shoulder (all in viewmodel root space)
 const pose=(arm,hand,elbow,shoulder,handRot)=>{seg(arm.fore,hand,elbow);seg(arm.upper,elbow,shoulder);arm.hand.position.copy(hand);arm.hand.quaternion.copy(handRot||q.identity());
  const w=new V().lerpVectors(hand,elbow,.12);seg(arm.cuff,hand,w);arm.watch.position.copy(w);arm.watch.quaternion.copy(arm.fore.quaternion);};
 for(const k in guns){const u=guns[k].userData;for(const s in u.slots)u.slots[s].visible=false;}
 return{root,guns,knife,nade,arms,pose,M};}

// toggle attachment meshes for a weapon + loadout attachments
export function applyAttachments(g,id,att){const u=g.userData,s=u.slots;for(const k in s)s[k].visible=false;
 if(s.iron)s.iron.visible=!att.reddot;if(s.reddot)s.reddot.visible=!!att.reddot;if(s.supp)s.supp.visible=!!att.supp;if(s.fh)s.fh.visible=!att.supp;if(s.grip)s.grip.visible=!!att.grip;if(s.extTube)s.extTube.visible=!!att.ext;if(u.ext)u.ext.visible=!!att.ext;
 u.sightY=u.sight.scope??(att.reddot?u.sight.reddot:u.sight.iron);u.muzzle.position.z=u.muzzle.userData.z0??(u.muzzle.userData.z0=u.muzzle.position.z);if(att.supp&&s.supp)u.muzzle.position.z-=.17;}
