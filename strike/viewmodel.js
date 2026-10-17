// STRIKE ZONE — first-person viewmodel: nine procedural weapons with moving parts, gloved arms that follow the parts,
// hip/ADS poses aligned to each sight, sway, bob, slide tilt, recoil kick, equip, mag / shell / bolt / cylinder reloads, melee and throws.
import * as THREE from '../vendor/three.module.min.js';
import {surf} from './tex.js';
const V=THREE.Vector3,R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,bump=(k,a,b)=>k<a||k>b?0:Math.sin((k-a)/(b-a)*Math.PI);

export function buildViewmodel(accent=0xff5a14){const std=o=>new THREE.MeshStandardMaterial(o);
 const sT=surf('steel');const tx=o=>std({normalMap:sT.normalMap,roughnessMap:sT.roughnessMap,...o});
 const M={poly:tx({color:0x34373d,roughness:.7,metalness:.15}),gun:tx({color:0x5a6068,roughness:.55,metalness:.8}),dark:tx({color:0x2a2c31,roughness:.6,metalness:.55}),tan:std({color:0xa08a64,roughness:.7,metalness:.05}),
  olive:std({color:0x4c5536,roughness:.72}),wood:std({color:0x6a3e22,roughness:.5,metalness:.05}),chrome:std({color:0xd0d4da,roughness:.16,metalness:1}),accent:std({color:accent,roughness:.4,metalness:.3,emissive:accent,emissiveIntensity:.25}),
  lens:std({color:0x10202a,roughness:.04,metalness:.9}),dot:new THREE.MeshBasicMaterial({color:new THREE.Color(4,.2,.1)}),glove:std({color:0x1f1e1c,roughness:.75}),knuckle:std({color:0x3c3a36,roughness:.45,metalness:.4}),
  sleeve:std({color:0x5e5844,roughness:.95}),band:std({color:accent,roughness:.6,emissive:accent,emissiveIntensity:.15}),blade:std({color:0xc8ccd2,roughness:.15,metalness:1}),brass:std({color:0xc8963a,roughness:.3,metalness:1}),
  warhead:std({color:0x8a2a1a,roughness:.5,metalness:.3}),frag:std({color:0x4b5530,roughness:.6})};
 const root=new THREE.Group(),hold=new THREE.Group();root.add(hold);
 const flashMat=new THREE.MeshBasicMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(3,2.3,1.5),side:THREE.DoubleSide});
 (()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.translate(64,64);for(let i=0;i<8;i++){x.rotate(Math.PI/4+R()*.2);const g=x.createLinearGradient(0,0,60,0);g.addColorStop(0,'rgba(255,245,210,1)');g.addColorStop(1,'rgba(255,130,30,0)');x.fillStyle=g;x.beginPath();x.moveTo(0,-6);x.lineTo(58,0);x.lineTo(0,6);x.fill();}
  const g=x.createRadialGradient(0,0,0,0,0,28);g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(1,'rgba(255,170,60,0)');x.fillStyle=g;x.fillRect(-64,-64,128,128);flashMat.map=new THREE.CanvasTexture(c);flashMat.map.colorSpace=THREE.SRGBColorSpace;})();
 const B=(w,h,d,m,x,y,z,p,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);p.add(o);return o;};
 const C=(r,l,m,x,y,z,p,seg=14,r2)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r2??r,l,seg),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);p.add(o);return o;};
 const G=()=>new THREE.Group();
 // ---------- guns: P.sight = eye-line point, P.hR/P.hL = hand anchors, moving parts by name
 function gun(id){const g=G(),P={muzzle:new V(0,0,-.5),sight:new V(0,.08,0),hR:new V(0,-.07,.06),hL:new V(0,-.04,-.3),eject:new V(.04,.03,-.02),adsD:.26};
  if(id==='ar'){B(.058,.085,.34,M.gun,0,0,-.05,g);B(.036,.018,.34,M.dark,0,.052,-.06,g);const hg=B(.06,.07,.26,M.poly,0,-.004,-.34,g);for(let i=0;i<4;i++)B(.062,.012,.03,M.dark,0,.012,-.25-i*.055,g);B(.064,.012,.2,M.accent,0,-.026,-.34,g);
   C(.012,.18,M.dark,0,.01,-.55,g);C(.019,.06,M.gun,0,.01,-.64,g,8);B(.046,.085,.22,M.poly,0,-.012,.25,g);B(.05,.1,.03,M.dark,0,-.02,.36,g);B(.036,.1,.045,M.poly,0,-.085,.07,g,.32);
   P.mag=B(.032,.16,.064,M.dark,0,-.12,-.09,g,.22);P.bolt=B(.02,.014,.05,M.gun,0,.06,.1,g);const sh=G();sh.position.set(0,.082,-.03);g.add(sh);B(.03,.014,.06,M.dark,0,-.02,0,sh);const tube=new THREE.Mesh(new THREE.CylinderGeometry(.021,.021,.065,18,1,true),new THREE.MeshStandardMaterial({color:0x2a2c31,roughness:.5,metalness:.6,side:THREE.DoubleSide}));tube.rotation.x=Math.PI/2;tube.position.set(0,.006,0);sh.add(tube);const lens=new THREE.Mesh(new THREE.CircleGeometry(.02,18),new THREE.MeshStandardMaterial({color:0x60a0ff,roughness:.05,metalness:.9,transparent:true,opacity:.18,depthWrite:false}));lens.position.set(0,.006,-.03);sh.add(lens);const dot=new THREE.Mesh(new THREE.SphereGeometry(.0018,6,4),M.dot);dot.position.set(0,.006,-.03);sh.add(dot);
   P.sight.set(0,.088,0);P.muzzle.set(0,.01,-.68);P.hR.set(0,-.08,.08);P.hL.set(0,-.045,-.35);P.adsD=.24;}
  else if(id==='smg'){B(.054,.08,.26,M.poly,0,0,-.02,g);B(.03,.016,.24,M.dark,0,.048,-.03,g);B(.05,.06,.14,M.poly,0,-.005,-.21,g);C(.016,.12,M.dark,0,.012,-.32,g,10);C(.022,.05,M.gun,0,.012,-.39,g,8);
   P.mag=B(.028,.21,.04,M.dark,0,-.14,-.07,g);B(.03,.09,.04,M.poly,0,-.08,.06,g,.28);B(.012,.012,.2,M.gun,.02,.0,.19,g);B(.012,.012,.2,M.gun,-.02,.0,.19,g);B(.05,.06,.02,M.dark,0,-.01,.29,g);B(.03,.08,.03,M.poly,0,-.07,-.21,g,-.1);
   const holo=G();holo.position.set(0,.078,-.02);g.add(holo);B(.04,.008,.06,M.dark,0,-.012,0,holo);for(const s of[-1,1])B(.006,.04,.06,M.dark,s*.02,.008,0,holo);B(.04,.006,.06,M.dark,0,.028,0,holo);const ring=new THREE.Mesh(new THREE.TorusGeometry(.008,.0012,6,16),M.dot);ring.position.set(0,.006,-.02);holo.add(ring);
   B(.056,.01,.12,M.accent,0,-.032,-.2,g);P.bolt=B(.016,.014,.04,M.gun,.03,.03,.03,g);P.sight.set(0,.084,0);P.muzzle.set(0,.012,-.42);P.hR.set(0,-.075,.07);P.hL.set(0,-.11,-.21);P.adsD=.22;}
  else if(id==='shotgun'){B(.056,.078,.27,M.gun,0,0,0,g);C(.017,.52,M.dark,0,.02,-.38,g);C(.014,.42,M.gun,0,-.016,-.34,g);P.pump=B(.058,.056,.16,M.poly,0,-.016,-.36,g);for(let i=0;i<5;i++)B(.06,.006,.012,M.dark,0,-.016,-.3-i*.028,g);
   B(.05,.095,.26,M.wood,0,-.03,.26,g,-.06);B(.034,.1,.045,M.wood,0,-.08,.08,g,.3);const bead=new THREE.Mesh(new THREE.SphereGeometry(.005,6,4),M.chrome);bead.position.set(0,.04,-.63);g.add(bead);B(.008,.012,.04,M.dark,0,.044,.08,g);B(.058,.012,.08,M.accent,0,.043,-.02,g);
   P.sight.set(0,.045,0);P.muzzle.set(0,.02,-.65);P.hR.set(0,-.075,.1);P.hL.set(0,-.05,-.36);P.eject.set(.04,.02,-.04);P.adsD=.3;}
  else if(id==='sniper'){B(.058,.08,.4,M.olive,0,0,-.02,g);C(.016,.62,M.dark,0,.012,-.5,g);C(.026,.07,M.gun,0,.012,-.83,g,8);B(.05,.1,.3,M.olive,0,-.02,.3,g);B(.04,.035,.14,M.olive,0,.04,.3,g);B(.035,.1,.045,M.olive,0,-.08,.08,g,.32);
   P.mag=B(.034,.07,.09,M.dark,0,-.07,-.04,g);const sc=G();sc.position.set(0,.09,-.06);g.add(sc);C(.024,.32,M.dark,0,0,0,sc,18);C(.034,.08,M.dark,0,0,-.17,sc,18,.026);C(.03,.06,M.dark,0,0,.15,sc,18,.025);C(.031,.004,M.lens,0,0,-.212,sc,18);for(const z of[-.06,.06])B(.026,.04,.025,M.dark,0,-.04,z,sc);
   B(.018,.03,.03,M.dark,0,.034,0,sc);P.bolt=G();P.bolt.position.set(.035,.02,.1);g.add(P.bolt);const bh=B(.07,.012,.012,M.chrome,.03,0,0,P.bolt);const kn=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),M.dark);kn.position.set(.065,0,0);P.bolt.add(kn);
   B(.06,.012,.08,M.accent,0,.045,-.3,g);P.sight.set(0,.09,0);P.muzzle.set(0,.012,-.88);P.hR.set(0,-.08,.1);P.hL.set(0,-.04,-.32);P.adsD=.2;}
  else if(id==='lmg'){B(.078,.105,.42,M.gun,0,0,-.03,g);B(.07,.03,.3,M.dark,0,.065,-.03,g);C(.019,.36,M.dark,0,.01,-.42,g);C(.026,.07,M.gun,0,.01,-.62,g,8);B(.06,.08,.18,M.poly,0,-.012,-.33,g);
   P.mag=G();P.mag.position.set(-.07,-.07,-.06);g.add(P.mag);B(.08,.13,.14,M.olive,0,0,0,P.mag);B(.084,.02,.144,M.dark,0,.05,0,P.mag);B(.055,.09,.24,M.poly,0,-.015,.29,g);B(.036,.1,.05,M.poly,0,-.09,.08,g,.3);
   const ch=B(.016,.05,.16,M.dark,0,.11,-.08,g);B(.016,.016,.12,M.dark,0,.135,-.08,g);B(.006,.03,.006,M.dark,0,.085,-.55,g);B(.03,.02,.02,M.dark,0,.088,.1,g);B(.08,.012,.14,M.accent,0,-.055,-.33,g);P.bolt=B(.02,.03,.04,M.gun,.045,.02,.05,g);
   P.sight.set(0,.098,0);P.muzzle.set(0,.01,-.66);P.hR.set(0,-.095,.08);P.hL.set(0,-.06,-.32);P.adsD=.26;}
  else if(id==='pistol'){P.slide=B(.032,.038,.19,M.gun,0,.02,-.04,g);B(.03,.03,.16,M.poly,0,-.012,-.03,g);B(.03,.11,.048,M.poly,0,-.07,.04,g,.26);B(.034,.012,.05,M.dark,0,-.125,.055,g,.26);B(.006,.01,.008,M.dark,0,.044,-.12,g);B(.016,.008,.01,M.dark,0,.044,.04,g);
   B(.034,.006,.12,M.accent,0,.002,-.05,g);P.mag=B(.024,.08,.03,M.dark,0,-.09,.045,g,.26);P.sight.set(0,.046,0);P.muzzle.set(0,.02,-.15);P.hR.set(0,-.06,.04);P.hL.set(-.012,-.08,.03);P.adsD=.3;P.one=true;}
  else if(id==='revolver'){C(.013,.2,M.chrome,0,.02,-.15,g);B(.012,.01,.2,M.gun,0,.035,-.15,g);P.cyl=G();P.cyl.position.set(0,.012,-.02);g.add(P.cyl);const cy=C(.032,.065,M.gun,0,0,0,P.cyl,6);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;C(.006,.066,M.dark,Math.cos(a)*.019,Math.sin(a)*.019,0,P.cyl,6);}
   B(.034,.05,.1,M.gun,0,.0,.02,g);B(.034,.11,.045,M.wood,0,-.07,.07,g,.3);P.hammer=B(.008,.02,.012,M.dark,0,.04,.07,g);B(.006,.012,.006,M.dark,0,.046,-.245,g);B(.036,.006,.06,M.accent,0,-.02,.03,g);
   P.sight.set(0,.052,0);P.muzzle.set(0,.02,-.26);P.hR.set(0,-.07,.07);P.hL.set(-.012,-.085,.06);P.adsD=.32;P.one=true;}
  else if(id==='rl'){C(.06,.9,M.olive,0,0,-.18,g,16);C(.072,.08,M.dark,0,0,-.64,g,16);C(.07,.1,M.dark,0,0,.29,g,16,.08);B(.035,.11,.05,M.poly,0,-.1,.0,g,.3);B(.035,.09,.05,M.poly,0,-.09,-.28,g);
   const sb=B(.03,.06,.1,M.dark,-.075,.05,-.18,g);B(.12,.02,.02,M.accent,0,.065,-.18,g);P.rocket=G();P.rocket.position.set(0,0,-.66);g.add(P.rocket);const wh=new THREE.Mesh(new THREE.ConeGeometry(.045,.16,12),M.warhead);wh.rotation.x=-Math.PI/2;wh.position.z=-.08;P.rocket.add(wh);
   P.sight.set(-.075,.09,0);P.muzzle.set(0,0,-.7);P.hR.set(0,-.12,.0);P.hL.set(0,-.1,-.28);P.adsD=.3;}
  else if(id==='knife'){const bl=new THREE.Shape();bl.moveTo(0,0);bl.lineTo(.2,.012);bl.lineTo(.23,0);bl.lineTo(.2,-.02);bl.lineTo(0,-.018);const bg=new THREE.ExtrudeGeometry(bl,{depth:.004,bevelEnabled:false});const b=new THREE.Mesh(bg,M.blade);b.rotation.y=Math.PI/2;b.position.set(-.002,.01,-.04);g.add(b);
   B(.026,.032,.11,M.dark,0,0,.05,g);B(.05,.01,.014,M.gun,0,0,-.01,g);B(.028,.006,.06,M.accent,0,.017,.05,g);P.hR.set(0,-.01,.04);P.hL.set(-.25,-.3,.15);P.knife=true;P.sight.set(0,.05,0);P.muzzle.set(0,0,-.2);}
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(.17,.17),flashMat);fl.position.copy(P.muzzle);fl.visible=false;g.add(fl);const fl2=new THREE.Mesh(new THREE.PlaneGeometry(.1,.26),flashMat);fl2.rotation.y=Math.PI/2;fl2.position.z=-.06;fl.add(fl2);P.flash=fl;
  g.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});for(const k of['mag','slide','pump','bolt','cyl','rocket','hammer'])if(P[k]){P[k].userData.p0=P[k].position.clone();P[k].userData.r0=P[k].rotation.clone();}return{g,P};}
 // ---------- arms
 function arm(side){const g=G();const hand=G();g.add(hand);B(.082,.05,.1,M.glove,0,0,0,hand);B(.084,.03,.04,M.knuckle,0,.02,-.045,hand);for(let i=0;i<4;i++)B(.017,.022,.05,M.glove,-.03+i*.02,-.012,-.07,hand,.4);B(.024,.024,.06,M.glove,side*.045,.0,-.02,hand,0,side*.6);
  const fa=new THREE.Mesh(new THREE.CylinderGeometry(.036,.044,.32,12),M.sleeve);fa.geometry.translate(0,.16,0);g.add(fa);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.046,.046,.05,12),M.glove);cuff.geometry.translate(0,.03,0);g.add(cuff);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.053,.053,.035,12),M.band);band.geometry.translate(0,.2,0);g.add(band);const ua=new THREE.Mesh(new THREE.CylinderGeometry(.055,.06,.34,12),M.sleeve);ua.geometry.translate(0,.17,0);g.add(ua);
  g.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});return{g,hand,fa,cuff,band,ua};}
 const armR=arm(1),armL=arm(-1);root.add(armR.g,armL.g);
 const grenade=new THREE.Mesh(new THREE.SphereGeometry(.035,12,10),M.frag);grenade.scale.y=1.2;root.add(grenade);grenade.visible=false;
 const HIP={rifle:new V(.19,-.2,-.36),smg:new V(.18,-.19,-.33),shotgun:new V(.19,-.205,-.36),sniper:new V(.19,-.205,-.37),lmg:new V(.2,-.225,-.38),pistol:new V(.15,-.17,-.36),revolver:new V(.15,-.175,-.36),rl:new V(.23,-.21,-.32),knife:new V(.18,-.2,-.32)};
 const models={};const st={id:null,cls:'rifle',m:null,equip:1,equipDur:.5,reload:0,reloadDur:1,rk:'mag',kick:0,kickR:0,kickX:0,sx:0,sy:0,px:0,py:0,bob:0,ads:0,flashT:0,melee:0,throwT:0,pump:0,bolt:0,boltDur:.6,land:0,roll:0,air:0,shell:0,spin:0,time:0,empty:false,hide:0};
 function set(id,cls){if(!models[id]){models[id]=gun(id);hold.add(models[id].g);}for(const k in models)models[k].g.visible=k===id;st.id=id;st.cls=cls;st.m=models[id];st.equip=0;st.equipDur=cls==='sniper'||cls==='lmg'||cls==='rl'?.65:cls==='knife'?.3:cls==='pistol'||cls==='revolver'?.38:.5;st.reload=0;st.pump=0;st.bolt=0;st.melee=0;
  const P=st.m.P;for(const k of['mag','slide','pump','bolt','cyl','rocket','hammer'])if(P[k]){P[k].position.copy(P[k].userData.p0);P[k].rotation.copy(P[k].userData.r0);P[k].visible=true;}}
 const tmp=new V(),tmp2=new V(),eu=new THREE.Euler(),mx=new THREE.Matrix4(),q=new THREE.Quaternion(),SH_R=new V(.32,-.5,.18),SH_L=new V(-.34,-.52,.08);
 function placeArm(a,hw,sh,side,hide){a.g.visible=!hide;if(hide)return;a.hand.position.copy(hw);// forearm: wrist -> elbow (toward a point between hand and shoulder, pushed down/out), upper arm: elbow -> shoulder
  const elbow=tmp.copy(hw).lerp(sh,.55).add(tmp2.set(side*.06,-.12,0));const dir=new V().subVectors(elbow,hw);const len=dir.length();dir.normalize();q.setFromUnitVectors(new V(0,1,0),dir);
  a.fa.position.copy(hw);a.fa.quaternion.copy(q);a.fa.scale.set(1,len/.32,1);a.cuff.position.copy(hw);a.cuff.quaternion.copy(q);a.band.position.copy(hw);a.band.quaternion.copy(q);a.band.scale.set(1,len/.32,1);
  const d2=new V().subVectors(sh,elbow);const l2=d2.length();d2.normalize();a.ua.position.copy(elbow);a.ua.quaternion.setFromUnitVectors(new V(0,1,0),d2);a.ua.scale.set(1,l2/.34,1);
  a.hand.quaternion.copy(hold.quaternion).multiply(st.m.g.quaternion);}
 // s: {dt, mdx, mdy, speed, onGround, vy, strafe, slide, aiming, t, crouch}
 function update(s){const dt=s.dt;if(!st.m)return;st.time+=dt;const P=st.m.P,g=st.m.g,cls=st.cls;st.equip=Math.min(1,st.equip+dt/st.equipDur);
  const adsT=(s.adsTime||.2);st.ads=cl(st.ads+(s.aiming&&st.equip>.7&&st.reload<=0&&!P.knife&&st.melee<=0?1:-1)*dt/adsT,0,1);const A=ease(st.ads);
  // sway (lagged mouse) + bob + breathing
  const swayK=1-A*.75;st.sx+=(cl(-s.mdx*.0011,-.06,.06)-st.sx)*Math.min(1,dt*9);st.sy+=(cl(s.mdy*.0011,-.06,.06)-st.sy)*Math.min(1,dt*9);
  const mv=Math.min(1,s.speed/7)*(s.onGround&&!s.slide?1:0);st.bob+=dt*(4+s.speed*1.15)*(mv>.05?1:0);const bA=mv*(.016-A*.012);
  st.air+=((s.onGround?0:1)-st.air)*Math.min(1,dt*8);st.land=Math.max(0,st.land-dt*3);st.roll+=(((s.slide?-.28:0)+cl(-s.strafe*.035,-.05,.05))-st.roll)*Math.min(1,dt*8);
  st.kick*=Math.exp(-dt*(A>.5?18:13));st.kickR*=Math.exp(-dt*11);st.kickX*=Math.exp(-dt*12);st.flashT-=dt;
  const hip=HIP[cls]||HIP.rifle;const SC=.82;hold.scale.setScalar(SC);const ads=tmp.set(-P.sight.x*SC,-P.sight.y*SC,-P.adsD*.92);
  let x=hip.x+(ads.x-hip.x)*A,y=hip.y+(ads.y-hip.y)*A,z=hip.z+(ads.z-hip.z)*A;let rx=0,ry=0,rz=0;
  const br=Math.sin(st.time*1.6)*(1-A*.6);x+=st.sx*swayK+Math.cos(st.bob)*bA;y+=st.sy*swayK-Math.abs(Math.sin(st.bob))*bA*.8+br*.0025-st.air*.02*swayK-st.land*.05;ry+=st.sx*1.4*swayK;rx+=st.sy*1.2*swayK+br*.004+st.air*.06*swayK;rz+=st.sx*1.6*swayK+st.roll*(1-A*.7);
  if(s.slide){x-=.02*(1-A);y-=.015;}
  // recoil
  z+=st.kick*(A>.5?.035:.06);rx+=st.kickR*(A>.5?.05:.11);ry+=st.kickX*.02;y+=st.kick*.006;
  // equip raise
  const e=1-ease(st.equip);y-=e*.3;rx-=e*1.1;rz+=e*.3;
  // reloads
  let lhTo=null;const k=st.reload>0?1-st.reload/st.reloadDur:0;
  if(st.reload>0){st.reload=Math.max(0,st.reload-dt);
   if(st.rk==='mag'){const tilt=bump(k,0,1);rz+=tilt*.55;rx+=tilt*.22;y-=tilt*.03;x-=tilt*.04;if(P.mag){const out=k>.15&&k<.38,away=k>=.38&&k<.5;const p0=P.mag.userData.p0;
     if(k<.15)P.mag.position.copy(p0);else if(out){P.mag.position.set(p0.x,p0.y-(k-.15)/.23*.3,p0.z);}else if(away){P.mag.visible=false;}else if(k<.7){P.mag.visible=true;const t=(k-.5)/.2;P.mag.position.set(p0.x,p0.y-(1-t)*.25,p0.z+(1-t)*.03);}else{P.mag.position.set(p0.x,p0.y+bump(k,.7,.78)*.01,p0.z);}
     if(k>.12&&k<.78){lhTo=tmp2.copy(P.mag.position).add(new V(0,-.05,0));if(!P.mag.visible)lhTo.set(-.12,-.38,.05);}}
    if(st.empty&&k>.78&&k<.95){const b=bump(k,.78,.95);if(P.bolt&&P.bolt.userData.p0)P.bolt.position.z=P.bolt.userData.p0.z+b*.06;if(P.slide)P.slide.position.z=P.slide.userData.p0.z+b*.04;rz+=b*.15;if(P.bolt)lhTo=tmp2.copy(P.bolt.position).add(new V(.03,.01,0));}}
   else if(st.rk==='shell'){const ph=(st.time*1)%1;rz+=.32;rx+=.12;y-=.02;const t=1-st.reload/st.reloadDur;lhTo=tmp2.set(0,-.07-bump(t,0,1)*.06,-.02-t*.08);}
   else if(st.rk==='cyl'){const b=bump(k,0,1);rx+=b*.9;rz+=b*.4;y+=b*.05;if(P.cyl){const o=bump(k,.08,.92);P.cyl.position.x=P.cyl.userData.p0.x-o*.045;P.cyl.rotation.z=k*8;}lhTo=k>.25&&k<.8?tmp2.set(-.05,-.02,-.02):null;}
   else if(st.rk==='rocket'){const b=bump(k,0,1);rx-=b*.25;rz+=b*.2;y-=b*.05;if(P.rocket){P.rocket.visible=k>.35;P.rocket.position.z=P.rocket.userData.p0.z-(k<.75?(1-(k-.35)/.4)*.25:0);}lhTo=k>.2&&k<.8?tmp2.copy(P.rocket.position).add(new V(0,-.03,-.06)):null;}}
  else{if(P.mag&&!P.mag.visible)P.mag.visible=true;if(P.cyl)P.cyl.position.x+=(P.cyl.userData.p0.x-P.cyl.position.x)*Math.min(1,dt*20);}
  // pump / bolt cycling
  if(st.pump>0){st.pump=Math.max(0,st.pump-dt/.42);const b=bump(1-st.pump,0,1);if(P.pump)P.pump.position.z=P.pump.userData.p0.z+b*.08;lhTo=tmp2.copy(P.pump.position).add(new V(0,-.04,0));rx+=b*.05;}
  if(st.bolt>0){st.bolt=Math.max(0,st.bolt-dt/st.boltDur);const t=1-st.bolt;if(P.bolt){const up=bump(t,0,1);P.bolt.rotation.z=-Math.min(1,up*1.6)*1.1;P.bolt.position.z=P.bolt.userData.p0.z+bump(t,.2,.8)*.07;}rz+=bump(t,0,1)*.18*(1-A*.5);lhTo=lhTo;}
  if(P.slide&&st.reload<=0)P.slide.position.z+=(P.slide.userData.p0.z-P.slide.position.z)*Math.min(1,dt*22);
  if(P.hammer)P.hammer.rotation.x=st.flashT>-.15?.6:0;
  // melee / throw
  let hideL=false;if(st.melee>0){const t=1-st.melee;st.melee=Math.max(0,st.melee-dt*(P.knife?3.2:3));const b=Math.sin(t*Math.PI);if(P.knife){x-=b*.2;z-=b*.12;ry+=b*.9;rz-=b*1.2;rx-=b*.3;}else{x-=b*.1;z-=b*.18;ry+=b*.5;rz-=b*.6;y+=b*.04;}}
  if(st.throwT>0){const t=1-st.throwT;st.throwT=Math.max(0,st.throwT-dt*2.4);y-=Math.sin(t*Math.PI)*.12;rx-=Math.sin(t*Math.PI)*.3;}
  y-=st.hide*.4;
  hold.position.set(x,y,z);hold.rotation.set(rx,ry,rz,'YXZ');g.position.set(0,0,0);g.rotation.set(0,0,0);
  // muzzle flash
  P.flash.visible=st.flashT>0;if(P.flash.visible){P.flash.rotation.z=R()*6;const sc=.75+R()*.6;P.flash.scale.set(sc,sc,sc);}
  // arms: hand anchors in camera space
  hold.updateMatrix();mx.copy(hold.matrix);const hR=new V().copy(P.hR).applyMatrix4(mx);let hL=new V().copy(P.hL).applyMatrix4(mx);
  if(lhTo)hL.copy(lhTo).applyMatrix4(mx);
  if(st.throwT>0){const t=1-st.throwT;hL.set(-.22+t*.2,-.25+Math.sin(t*Math.PI)*.25,-.3-t*.2);grenade.visible=t<.55;grenade.position.copy(hL).add(new V(0,.04,-.03));hideL=false;}else grenade.visible=false;
  const oneHand=P.one||P.knife;if(P.knife&&st.throwT<=0)hideL=true;
  placeArm(armR,hR,SH_R,1,false);placeArm(armL,hL,oneHand&&!P.knife?SH_R.clone().add(new V(-.12,0,0)):SH_L,-1,hideL||st.hide>.5);if(st.hide>.5)armR.g.visible=false;}
 function muzzleCam(out=new V()){if(!st.m)return out.set(.15,-.1,-.6);hold.updateMatrix();return out.copy(st.m.P.muzzle).applyMatrix4(hold.matrix);}
 function ejectCam(out=new V()){if(!st.m)return out.set(.15,-.1,-.4);hold.updateMatrix();return out.copy(st.m.P.eject).applyMatrix4(hold.matrix);}
 return{root,M,st,set,update,muzzleCam,ejectCam,
  fire(power=1){st.kick=Math.min(1.8,st.kick+.55*power);st.kickR=Math.min(2,st.kickR+.5*power);st.kickX+=(R()-.5)*power*.8;st.flashT=.04;const P=st.m&&st.m.P;if(P&&P.slide)P.slide.position.z=P.slide.userData.p0.z+.04;if(P&&P.cyl)P.cyl.rotation.z+=Math.PI/3;if(P&&P.rocket)P.rocket.visible=false;},
  reload(dur,kind,empty){st.reload=dur;st.reloadDur=dur;st.rk=kind;st.empty=!!empty;},cancelReload(){st.reload=0;if(st.m&&st.m.P.mag){st.m.P.mag.visible=true;st.m.P.mag.position.copy(st.m.P.mag.userData.p0);}},
  pump(){st.pump=1;},bolt(d=.6){st.bolt=1;st.boltDur=d;},melee(){st.melee=1;},throwIt(){st.throwT=1;},land(v){st.land=Math.min(1,st.land+v);},
  get ads(){return st.ads;},get busy(){return st.equip<1||st.reload>0;},setHide(v){st.hide=v;}};}
