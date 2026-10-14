// HALCYON HEIST — first-person viewmodels: procedural guns, suit sleeves + gloves, sway/bob/kick, equip/reload/interact animations,
// and the mask-on move (the mask rises into view and over the camera).
import * as THREE from '../vendor/three.module.min.js';
import {makeMask} from './actors.js';
const V=THREE.Vector3;
const box=(w,h,d,m,x=0,y=0,z=0,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p&&p.add(o);return o;};
const cyl=(r,l,m,x=0,y=0,z=0,p,seg=12)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,seg),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);p&&p.add(o);return o;};

export function buildViewmodel(TX,crew){const std=o=>new THREE.MeshStandardMaterial(o);
 const M={steel:std({color:0x6a6f78,roughness:.32,metalness:.8}),black:std({color:0x34373d,roughness:.5,metalness:.35}),poly:std({color:0x3a3c41,roughness:.62,metalness:.1}),tan:std({color:0x9a8160,roughness:.75}),
  wood:std({map:TX.wood.map,color:0xb07a4c,roughness:.5}),glass:std({color:0x203040,roughness:.05,metalness:.9,emissive:0x05101a}),red:std({color:0xff2a10,emissive:0xff2000,emissiveIntensity:2}),
  glove:std({color:0x2e2c2a,roughness:.75}),sleeve:std({color:crew.suit,roughness:.85}),cuff:std({color:crew.shirt,roughness:.7}),brass:std({color:0xc8a050,roughness:.3,metalness:1})};
 const root=new THREE.Group();const hold=new THREE.Group();root.add(hold);
 const flashMat=new THREE.MeshBasicMaterial({map:TX.flash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(3,2.4,1.6),side:THREE.DoubleSide});
 const models={};
 const arm=s=>{const g=new THREE.Group();const fa=new THREE.Mesh(new THREE.CylinderGeometry(.042,.058,.32,12),M.sleeve);fa.rotation.x=Math.PI/2;fa.position.z=.2;g.add(fa);const cf=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.03,12),M.cuff);cf.rotation.x=Math.PI/2;cf.position.z=.05;g.add(cf);
  box(.075,.06,.11,M.glove,0,0,0,g);box(.025,.025,.06,M.glove,s*.035,.015,-.03,g);return g;};
 const armL=arm(-1),armR=arm(1);hold.add(armL,armR);
 function gun(id){const g=new THREE.Group();const P={mag:null,slide:null,pump:null,muzzle:new V(0,0,-.5),hand:[new V(0,-.06,.02),new V(0,-.04,-.2)]};
  if(id==='falco'){box(.055,.085,.36,M.steel,0,0,-.05,g);cyl(.012,.3,M.black,0,.01,-.38,g);box(.052,.064,.22,M.poly,0,-.002,-.26,g);box(.045,.09,.2,M.poly,0,-.02,.22,g);box(.03,.09,.04,M.poly,0,-.08,.04,g);
   P.mag=box(.035,.15,.06,M.steel,0,-.11,-.1,g);P.mag.rotation.x=.18;box(.02,.012,.3,M.black,0,.047,-.08,g);const sc=new THREE.Group();sc.position.set(0,.08,-.04);g.add(sc);box(.044,.044,.08,M.black,0,0,0,sc);box(.034,.034,.005,M.glass,0,0,-.041,sc);const dot=box(.004,.004,.002,M.red,0,0,.035,sc);
   P.muzzle.set(0,.01,-.54);P.hand=[new V(0,-.07,.05),new V(0,-.04,-.24)];}
  else if(id==='kite'){box(.05,.08,.26,M.poly,0,0,-.02,g);cyl(.012,.12,M.steel,0,.012,-.2,g);cyl(.022,.16,M.black,0,.012,-.32,g);box(.04,.06,.12,M.poly,0,-.005,-.13,g);P.mag=box(.028,.2,.04,M.black,0,-.13,-.07,g);box(.025,.08,.035,M.poly,0,-.07,.05,g);box(.02,.025,.16,M.steel,0,0,.16,g);
   box(.015,.03,.015,M.black,0,.055,-.14,g);P.muzzle.set(0,.012,-.4);P.hand=[new V(0,-.07,.05),new V(0,-.13,-.07)];}
  else if(id==='mastiff'){box(.055,.07,.3,M.black,0,0,0,g);cyl(.016,.42,M.steel,0,.018,-.34,g);cyl(.014,.34,M.black,0,-.016,-.3,g);P.pump=box(.05,.05,.14,M.wood,0,-.018,-.32,g);box(.045,.09,.24,M.wood,0,-.03,.26,g);box(.03,.09,.04,M.wood,0,-.08,.07,g);
   P.muzzle.set(0,.018,-.56);P.hand=[new V(0,-.07,.08),new V(0,-.05,-.32)];}
  else if(id==='whisper'){P.slide=box(.034,.04,.18,M.black,0,.02,-.04,g);box(.032,.03,.15,M.poly,0,-.01,-.03,g);const gr=box(.03,.1,.045,M.poly,0,-.06,.03,g);gr.rotation.x=.25;P.mag=box(.024,.06,.03,M.black,0,-.1,.045,g);cyl(.017,.17,M.steel,0,.02,-.215,g,14);
   P.muzzle.set(0,.02,-.31);P.hand=[new V(0,-.06,.04),new V(-.01,-.07,.04)];}
  else if(id==='hands'){P.hand=[new V(.06,-.3,.2),new V(-.06,-.3,.2)];}
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(.16,.16),flashMat);fl.position.copy(P.muzzle);fl.visible=false;g.add(fl);const fl2=new THREE.Mesh(new THREE.PlaneGeometry(.16,.16),flashMat);fl2.rotation.y=Math.PI/2;fl.add(fl2);P.flash=fl;
  g.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});return{g,P};}
 const OFF={rifle:new V(.16,-.175,-.6),smg:new V(.15,-.16,-.52),shotgun:new V(.16,-.18,-.62),pistol:new V(.12,-.14,-.42),hands:new V(0,-.3,-.4)};
 const st={id:null,cls:'rifle',m:null,equip:0,equipDur:.6,reload:0,reloadDur:1,kick:0,kickR:0,swayX:0,swayY:0,bob:0,flashT:0,pump:0,use:0,mask:0,ads:0,bag:0};
 // the crew member's own mask, lifted into view when masking up
 const maskG=makeMask(crew.mask);maskG.scale.setScalar(2.2);maskG.visible=false;root.add(maskG);maskG.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});
 function set(id,cls){st.id=id;st.cls=cls;if(!models[id]){models[id]=gun(id);hold.add(models[id].g);}for(const k in models)models[k].g.visible=k===id;st.m=models[id];st.equip=0;st.equipDur=cls==='pistol'?.45:.6;st.reload=0;
  const P=models[id].P;if(P.mag&&P.mag.userData.y0===undefined)P.mag.userData.y0=P.mag.position.y;if(P.slide&&P.slide.userData.z0===undefined)P.slide.userData.z0=P.slide.position.z;if(P.pump&&P.pump.userData.z0===undefined)P.pump.userData.z0=P.pump.position.z;}
 const tmp=new V(),tmp2=new V(),e=new THREE.Euler(),AR=new V(.3,-.62,.72),AL=new V(-.62,-.58,.53);
 function update(s){const dt=s.dt;if(!st.m)return;const P=st.m.P,g=st.m.g;st.equip=Math.min(1,st.equip+dt/st.equipDur);
  st.swayX+=(-s.mdx*.0009-st.swayX)*Math.min(1,dt*8);st.swayY+=(s.mdy*.0009-st.swayY)*Math.min(1,dt*8);st.swayX=Math.max(-.05,Math.min(.05,st.swayX));st.swayY=Math.max(-.05,Math.min(.05,st.swayY));
  st.bob+=dt*(s.speed>.4&&s.onGround?6+s.speed*1.4:0);const ba=Math.min(1,s.speed/5)*(s.onGround?1:.2)*(st.ads>.5?.3:1)*.014;st.kick*=Math.exp(-dt*14);st.kickR*=Math.exp(-dt*10);st.flashT-=dt;st.ads+=((s.aiming?1:0)-st.ads)*Math.min(1,dt*12);
  st.bag+=((s.bag?1:0)-st.bag)*Math.min(1,dt*6);
  const off=OFF[st.cls]||OFF.rifle;let x=off.x+st.swayX+Math.cos(st.bob)*ba,y=off.y+st.swayY-Math.abs(Math.sin(st.bob))*ba*.9-(s.crouch?.012:0),z=off.z+st.kick*.06;let rx=st.kickR*.12,ry=st.swayX*1.2,rz=st.swayX*1.5;
  if(st.ads>.01&&st.cls!=='hands'){const sightY=st.id==='falco'?-.1:st.cls==='pistol'?-.055:-.075;x+=(0-x)*st.ads;y+=(sightY-y)*st.ads;z+=.06*st.ads;ry*=1-st.ads*.8;rz*=1-st.ads*.8;}
  y-=st.bag*.05;rz+=st.bag*.12;
  const eq=1-st.equip;const ee=eq*eq;y-=ee*.28;rx-=ee*.9;
  if(st.reload>0){const k=1-st.reload/st.reloadDur;st.reload=Math.max(0,st.reload-dt);
   if(P.shellR){const p=(k*8)%1;y-=.03;rx+=.15+Math.sin(p*Math.PI)*.08;}
   else{const dip=Math.sin(Math.min(1,k/.9)*Math.PI);rz+=dip*.45;rx+=dip*.18;y-=dip*.06;x-=dip*.03;if(P.mag){P.mag.visible=!(k>.25&&k<.55);P.mag.position.y=P.mag.userData.y0-(k>.55&&k<.7?(.7-k)*.6:0);}if(P.slide)P.slide.position.z=P.slide.userData.z0+(k>.8&&k<.9?.03:0);}}
  else if(P.mag){P.mag.visible=true;P.mag.position.y=P.mag.userData.y0;}
  if(P.slide)P.slide.position.z+=(P.slide.userData.z0-P.slide.position.z)*Math.min(1,dt*20);
  if(P.pump){st.pump=Math.max(0,st.pump-dt*2.2);P.pump.position.z=P.pump.userData.z0+Math.sin(Math.min(1,st.pump)*Math.PI)*.08;}
  // interacting (drill, bagging, lockpick): lower the gun
  st.use+=((s.using?1:0)-st.use)*Math.min(1,dt*8);y-=st.use*.22;rx-=st.use*.6;x+=st.use*.05;
  g.position.set(x,y,z);g.rotation.set(rx,ry,rz);
  P.flash.visible=st.flashT>0;if(P.flash.visible){P.flash.rotation.z=Math.random()*6;const sc=.8+Math.random()*.6;P.flash.scale.set(sc,sc,sc);}
  for(const[a,h,d]of[[armR,P.hand[0],AR],[armL,P.hand[1],AL]]){tmp.copy(h).applyEuler(e.set(rx,ry,rz)).add(g.position);a.position.copy(tmp);tmp2.copy(tmp).add(d);a.lookAt(tmp2);}
  const hands=st.cls==='hands';armL.visible=armR.visible=!hands||st.mask>0;
  // mask-on: 0..1 progress
  if(st.mask>0){st.mask=Math.min(1.01,st.mask+dt/.85);const k=st.mask;maskG.visible=k<.98;const rise=Math.min(1,k/.6),put=Math.max(0,(k-.6)/.4);maskG.position.set(0,-.55+rise*.5-put*.02,-.6+put*.5);maskG.rotation.set(-.2+rise*.2,Math.PI,0);
   armL.position.set(-.18,-.3+rise*.2,-.42+put*.3);armR.position.set(.18,-.3+rise*.2,-.42+put*.3);armL.lookAt(0,-.8,.2);armR.lookAt(0,-.8,.2);armL.visible=armR.visible=k<.98;g.visible=k>.98||!hands;if(k>=1)st.mask=0;}
  else{maskG.visible=false;g.visible=!hands;}}
 return{root,M,set,update,
  fire(big=1,flash=true){st.kick=Math.min(1.6,st.kick+.6*big*(1-st.ads*.5));st.kickR=Math.min(1.6,st.kickR+.5*big*(1-st.ads*.5));if(flash)st.flashT=.045;const P=st.m&&st.m.P;if(P&&P.slide)P.slide.position.z=P.slide.userData.z0+.035;if(P&&P.pump)st.pump=1;},
  reload(d,shell){st.reload=d;st.reloadDur=d;if(st.m)st.m.P.shellR=!!shell;},cancelReload(){st.reload=0;},maskOn(){st.mask=.001;},
  get busy(){return st.equip<1||st.reload>0;},st};}
