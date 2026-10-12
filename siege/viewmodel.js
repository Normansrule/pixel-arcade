// FORTRESS BREACH — first-person viewmodels: procedural guns + gadgets, gloved arms, ADS, sway/bob, recoil kick,
// equip / reload / melee / throw / deploy animations, weapon flashlight.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
const box=(w,h,d,m,x=0,y=0,z=0,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p&&p.add(o);return o;};
const cyl=(r,l,m,x=0,y=0,z=0,p,seg=12,r2)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r2??r,l,seg),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);p&&p.add(o);return o;};
export function buildViewmodel(TX){const std=o=>new THREE.MeshStandardMaterial(o);
 const M={steel:std({color:0x2a2c30,roughness:.35,metalness:.85}),black:std({color:0x141518,roughness:.55,metalness:.4}),poly:std({color:0x1d1e21,roughness:.7,metalness:.1}),tan:std({color:0x8a7558,roughness:.75}),olive:std({color:0x3e4630,roughness:.7}),
  wood:std({map:TX.wood.map,color:0xa06a3c,roughness:.6}),glass:std({color:0x203040,roughness:.05,metalness:.9,emissive:0x05101a}),red:std({color:0xff2a10,emissive:0xff2000,emissiveIntensity:2}),green:std({color:0x30ff60,emissive:0x20ff40,emissiveIntensity:2}),
  blue:std({color:0x40a0ff,emissive:0x2080ff,emissiveIntensity:2}),glove:std({color:0x24221e,roughness:.85}),sleeveA:std({color:0x4e463a,roughness:.92}),sleeveD:std({color:0x252c38,roughness:.88}),
  brick:std({color:0x6a4a2a,roughness:.7}),putty:std({color:0xc8b890,roughness:.8}),orange:std({color:0xff6a1a,roughness:.5}),yellow:std({color:0xd8b020,roughness:.5}),
  screen:new THREE.MeshBasicMaterial({color:0x30ff90}),lens:new THREE.MeshBasicMaterial({color:new THREE.Color(2,2.2,2.6)})};
 const root=new THREE.Group();const hold=new THREE.Group();root.add(hold);
 const flashMat=new THREE.MeshBasicMaterial({map:TX.flash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(3,2.4,1.6),side:THREE.DoubleSide});
 const arm=s=>{const g=new THREE.Group();const fa=new THREE.Mesh(new THREE.CylinderGeometry(.04,.056,.32,12),M.sleeveA);fa.rotation.x=Math.PI/2;fa.position.z=.2;g.add(fa);box(.075,.06,.11,M.glove,0,0,0,g);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.046,.046,.06,10),M.glove);cuff.rotation.x=Math.PI/2;cuff.position.z=.05;g.add(cuff);box(.025,.025,.06,M.glove,s*.035,.015,-.03,g);g.userData={fa};return g;};
 const armL=arm(-1),armR=arm(1);hold.add(armL,armR);
 const models={};
 // P: parts {mag, pump, slide, muzzle, hand:[right, left], sight: height of sight line above group origin}
 function make(id){const g=new THREE.Group();const P={muzzle:new V(0,0,-.5),hand:[new V(0,-.06,.03),new V(0,-.04,-.2)],sight:.06};
  if(id==='rifle'){box(.055,.085,.36,M.black,0,0,-.05,g);cyl(.012,.3,M.steel,0,.01,-.38,g);box(.052,.06,.22,M.tan,0,-.005,-.27,g);box(.045,.085,.2,M.tan,0,-.02,.22,g);box(.03,.09,.04,M.poly,0,-.08,.03,g);
   P.mag=box(.035,.15,.06,M.black,0,-.11,-.1,g);P.mag.rotation.x=.18;box(.02,.012,.3,M.black,0,.048,-.08,g);const sc=new THREE.Group();sc.position.set(0,.078,-.04);g.add(sc);box(.042,.042,.075,M.black,0,0,0,sc);box(.034,.034,.004,M.glass,0,0,-.038,sc);const dot=box(.004,.004,.002,M.red,0,0,.03,sc);
   P.muzzle.set(0,.01,-.54);P.hand=[new V(0,-.07,.05),new V(0,-.04,-.25)];P.sight=.078;}
  else if(id==='smg'){box(.05,.08,.28,M.poly,0,0,-.02,g);cyl(.012,.14,M.steel,0,.012,-.22,g);box(.045,.06,.14,M.black,0,-.005,-.14,g);P.mag=box(.03,.18,.045,M.black,0,-.12,-.06,g);box(.03,.08,.035,M.poly,0,-.07,.06,g);box(.02,.03,.18,M.steel,0,0,.17,g);
   const sc=new THREE.Group();sc.position.set(0,.066,-.02);g.add(sc);box(.036,.03,.05,M.black,0,0,0,sc);box(.004,.004,.002,M.green,0,0,.026,sc);P.muzzle.set(0,.012,-.3);P.hand=[new V(0,-.07,.06),new V(0,-.12,-.06)];P.sight=.066;}
  else if(id==='dmr'){box(.055,.085,.46,M.olive,0,0,-.05,g);cyl(.013,.4,M.steel,0,.012,-.46,g);box(.05,.1,.24,M.olive,0,-.01,.26,g);box(.03,.09,.04,M.olive,0,-.08,.05,g);P.mag=box(.035,.1,.07,M.black,0,-.08,-.06,g);
   const sc=new THREE.Group();sc.position.set(0,.088,-.05);g.add(sc);cyl(.024,.26,M.black,0,0,0,sc,16);cyl(.032,.05,M.black,0,0,-.13,sc,16);cyl(.03,.04,M.black,0,0,.12,sc,16);cyl(.028,.004,M.glass,0,0,-.155,sc,16);P.muzzle.set(0,.012,-.68);P.hand=[new V(0,-.07,.08),new V(0,-.03,-.24)];P.sight=.088;}
  else if(id==='shotgun'){box(.055,.07,.3,M.black,0,0,0,g);cyl(.017,.44,M.steel,0,.02,-.36,g);cyl(.014,.34,M.black,0,-.016,-.3,g);P.pump=box(.05,.05,.14,M.poly,0,-.018,-.32,g);box(.045,.09,.24,M.poly,0,-.03,.26,g);box(.03,.09,.04,M.poly,0,-.08,.07,g);box(.008,.016,.01,M.orange,0,.045,-.56,g);
   P.muzzle.set(0,.02,-.58);P.hand=[new V(0,-.07,.08),new V(0,-.05,-.32)];P.sight=.045;}
  else if(id==='pistol'){P.slide=box(.034,.042,.2,M.black,0,.02,-.04,g);box(.032,.03,.16,M.poly,0,-.01,-.03,g);const gr=box(.03,.1,.045,M.poly,0,-.06,.03,g);gr.rotation.x=.25;P.mag=box(.024,.06,.03,M.black,0,-.1,.045,g);box(.006,.012,.006,M.green,0,.047,-.13,g);
   P.muzzle.set(0,.02,-.15);P.hand=[new V(0,-.06,.04),new V(-.01,-.07,.04)];P.sight=.047;}
  else if(id==='charge'){box(.2,.12,.05,M.putty,0,0,-.02,g);box(.21,.02,.06,M.black,0,.04,-.02,g);box(.04,.03,.02,M.red,.06,.0,-.05,g);cyl(.003,.12,M.orange,-.05,.03,.02,g,6);P.hand=[new V(.08,-.04,.02),new V(-.08,-.04,.0)];}
  else if(id==='detonator'){box(.05,.1,.03,M.yellow,0,0,0,g);box(.03,.02,.02,M.red,0,.055,0,g);cyl(.004,.08,M.black,.015,.07,0,g,6).rotation.set(0,0,0);P.hand=[new V(0,-.04,.02),new V(-.2,-.25,.2)];}
  else if(id==='cutter'){cyl(.03,.34,M.steel,0,0,-.12,g,12);cyl(.045,.12,M.orange,0,0,.08,g,12);box(.04,.1,.05,M.black,0,-.07,.06,g);cyl(.012,.06,M.black,0,0,-.31,g,8);const tip=box(.012,.012,.012,M.red,0,0,-.345,g);P.tip=tip;P.muzzle.set(0,0,-.35);P.hand=[new V(0,-.07,.06),new V(0,-.03,-.16)];}
  else if(id==='scanner'||id==='tablet'){box(.2,.13,.02,M.black,0,0,0,g);const sc=box(.18,.11,.002,M.screen,0,0,-.011,g);sc.rotation.y=Math.PI;P.screen=sc;g.rotation.x=-.75;P.hand=[new V(.1,-.05,0),new V(-.1,-.05,0)];}
  else if(id==='shield'){box(.36,.24,.05,M.black,0,0,-.04,g);box(.12,.03,.052,M.glass,0,.05,-.04,g);P.hand=[new V(.14,-.08,0),new V(-.14,-.08,0)];}
  else if(id==='wire'){const t=new THREE.Mesh(new THREE.TorusGeometry(.09,.025,8,18),M.steel);t.position.z=-.05;g.add(t);P.hand=[new V(.07,-.05,0),new V(-.07,-.05,0)];}
  else if(id==='trap'){box(.18,.03,.18,M.black,0,0,-.03,g);box(.05,.012,.05,M.blue,0,.02,-.03,g);P.hand=[new V(.08,-.03,.02),new V(-.08,-.03,.02)];}
  else if(id==='jammer'){box(.14,.08,.1,M.olive,0,0,-.02,g);cyl(.004,.16,M.black,.04,.1,-.02,g,6).rotation.set(0,0,0);box(.03,.012,.004,M.red,-.02,.02,-.071,g);P.hand=[new V(.07,-.05,.02),new V(-.07,-.05,.02)];}
  else{// throwables
   const col={frag:M.olive,smoke:M.steel,flash:M.steel,impact:M.black,emp:M.blue}[id]||M.olive;if(id==='frag'){const s=new THREE.Mesh(new THREE.SphereGeometry(.035,12,10),col);g.add(s);}else cyl(.028,.1,col,0,0,0,g,12).rotation.set(0,0,0);box(.012,.03,.012,M.steel,0,.05,0,g);P.hand=[new V(0,-.04,.02),new V(-.2,-.25,.2)];}
  g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.frustumCulled=false;}});const fl=new THREE.Mesh(new THREE.PlaneGeometry(.22,.22),flashMat);fl.position.copy(P.muzzle);fl.visible=false;g.add(fl);P.flash=fl;g.userData=P;g.visible=false;hold.add(g);return g;}
 for(const id of['rifle','smg','dmr','shotgun','pistol','charge','detonator','cutter','scanner','tablet','shield','wire','trap','jammer','frag','smoke','flash','impact','emp'])models[id]=make(id);
 // weapon light
 const torch=new THREE.SpotLight(0xfff0d8,0,26,.42,.55,1.6);torch.position.set(0,0,0);const tt=new THREE.Object3D();tt.position.set(0,0,-1);
 let cur=null,P=null,kick=0,kickR=0,eq=0,rel=0,relT=1,shell=false,sw=new V(),bob=0,melee=0,throwT=0,ads=0,deploy=0,inspect=0;
 const api={root,torch,torchTarget:tt,models,M,mdx:0,mdy:0,
  set(id,side){if(cur)cur.visible=false;cur=models[id]||models.pistol;cur.visible=true;P=cur.userData;eq=1;rel=0;melee=0;throwT=0;deploy=0;for(const a of[armL,armR])a.userData.fa.material=side==='def'?M.sleeveD:M.sleeveA;api.id=id;},
  fire(k=1){kick=Math.min(1.6,kick+.55*k);kickR=(Math.random()-.5)*.6*k;if(P&&P.flash){P.flash.visible=true;P.flash.rotation.z=Math.random()*6;P.flash.scale.setScalar(.8+Math.random()*.6);}if(P&&P.pump)P.pump.userData.t=.5;},
  reload(t,sh){rel=t;relT=t;shell=sh;},melee(){melee=1;},throwIt(){throwT=1;},deploy(){deploy=1;},inspect(){inspect=2.4;},
  update(o){const dt=o.dt;eq=Math.max(0,eq-dt*3.5);kick*=Math.exp(-dt*14);melee=Math.max(0,melee-dt*2.6);throwT=Math.max(0,throwT-dt*2.4);deploy=Math.max(0,deploy-dt*2);inspect=Math.max(0,inspect-dt);
   ads+=((o.ads?1:0)-ads)*Math.min(1,dt*(o.ads?13:10));if(P&&P.flash&&P.flash.visible&&Math.random()<.6)P.flash.visible=false;
   if(rel>0)rel=Math.max(0,rel-dt);
   sw.x+=(-o.mdx*.0009-sw.x)*Math.min(1,dt*10);sw.y+=(o.mdy*.0009-sw.y)*Math.min(1,dt*10);const sp=Math.min(1,o.speed/5);bob+=dt*(4+sp*6)*(o.onGround?1:.2);const ba=sp*(1-ads*.85)*(o.crouch?.6:1);
   const hip=new V(.17,-.175,-.43),ad=new V(0,-(P?P.sight:.06),-.3);const pos=hip.lerp(ad,ads);
   // sprint: lower + tilt
   const spr=o.sprint?1:0;api.spr=(api.spr||0)+(spr-(api.spr||0))*Math.min(1,dt*8);
   hold.position.set(pos.x+Math.sin(bob)*.012*ba+sw.x*(1-ads*.8)+api.spr*.05,pos.y-Math.abs(Math.cos(bob))*.01*ba+sw.y*(1-ads*.8)-eq*.25-api.spr*.06-(o.prone?.02:0),pos.z+kick*.035);
   const rp=rel>0?Math.sin(Math.min(1,(1-rel/relT))*Math.PI):0;
   hold.rotation.set(kick*.07+rp*.5-eq*.6+melee*-.4+api.spr*-.25+(o.lean||0)*0,kickR*.05+rp*.2+api.spr*.7+inspect*.4*Math.sin(Math.min(1,inspect)*Math.PI),rp*.45-eq*.2+api.spr*.15+(o.lean||0)*-.18);
   if(melee>0){hold.position.z-=Math.sin(melee*Math.PI)*.18;hold.position.x-=Math.sin(melee*Math.PI)*.06;}
   if(throwT>0){hold.position.y-=Math.sin(throwT*Math.PI)*.1;hold.rotation.x+=Math.sin(throwT*Math.PI)*.8;}
   if(deploy>0){hold.position.y-=Math.sin(deploy*Math.PI)*.12;hold.position.z-=Math.sin(deploy*Math.PI)*.14;}
   if(P){if(P.mag){P.mag.position.y=(P.mag.userData.y??(P.mag.userData.y=P.mag.position.y))-(rel>0&&!shell?Math.sin(Math.min(1,(1-rel/relT)*1.6)*Math.PI)*.12:0);}
    if(P.pump){const t=P.pump.userData.t||0;P.pump.userData.t=Math.max(0,t-dt*2.5);P.pump.position.z=-.32+Math.sin(t*Math.PI*2)*.05;}
    if(P.screen){P.screen.material.color.setRGB(.2,1,.55).multiplyScalar(.7+.3*Math.sin(o.t*6));}
    if(P.tip)P.tip.material.emissiveIntensity=o.cutting?4+Math.random()*4:1;
    // hands
    const h=P.hand;armR.position.copy(cur.position).add(h[0]);armR.rotation.set(-.1,0,0);armL.position.copy(cur.position).add(h[1]);armL.rotation.set(-.2,.25,0);armL.visible=h[1].y>-.2;}
   torch.position.set(hold.position.x,hold.position.y+.03,hold.position.z-.3);
  }};
 root.add(torch,tt);torch.target=tt;return api;}
