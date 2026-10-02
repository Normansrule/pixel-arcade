// BREACH POINT — first-person viewmodels: procedural guns per weapon, gloved arms, sway/bob/kick, equip/reload/inspect/throw/plant animations.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
const box=(w,h,d,m,x=0,y=0,z=0,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p&&p.add(o);return o;};
const cyl=(r,l,m,x=0,y=0,z=0,p,seg=12)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,seg),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);p&&p.add(o);return o;};

export function buildViewmodel(TX){const std=o=>new THREE.MeshStandardMaterial(o);
 const M={steel:std({color:0x2a2c30,roughness:.35,metalness:.85}),black:std({color:0x141518,roughness:.55,metalness:.4}),poly:std({color:0x1d1e21,roughness:.7,metalness:.1}),tan:std({color:0x9a8160,roughness:.75}),olive:std({color:0x4a5236,roughness:.7}),
  wood:std({map:TX.wood.map,color:0xa06a3c,roughness:.6}),silver:std({color:0xb8bcc2,roughness:.25,metalness:.95}),glass:std({color:0x203040,roughness:.05,metalness:.9,emissive:0x05101a}),red:std({color:0xff2a10,emissive:0xff2000,emissiveIntensity:2}),
  glove:std({color:0x24221e,roughness:.85}),sleeveA:std({color:0x5e5040,roughness:.92}),sleeveD:std({color:0x2a3446,roughness:.88}),blade:std({color:0xc8ccd0,roughness:.18,metalness:1}),grip:std({color:0x2a2620,roughness:.8}),
  frag:std({color:0x4b5530,roughness:.6,metalness:.2}),smoke:std({color:0x7a7d80,roughness:.5,metalness:.4}),flash:std({color:0xb8bab4,roughness:.4,metalness:.5}),inc:std({color:0x8a2a18,roughness:.5,metalness:.3}),bomb:std({color:0x5a3c24,roughness:.7}),led:std({color:0x30ff60,emissive:0x20ff40,emissiveIntensity:2})};
 const root=new THREE.Group();const hold=new THREE.Group();root.add(hold);
 const flashMat=new THREE.MeshBasicMaterial({map:TX.flash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(3,2.4,1.6),side:THREE.DoubleSide});
 const models={};
 // arms: forearm + hand, positioned per weapon via two anchor targets
 const arm=s=>{const g=new THREE.Group();const fa=new THREE.Mesh(new THREE.CylinderGeometry(.04,.056,.3,12),M.sleeveA);fa.rotation.x=Math.PI/2;fa.position.z=.19;const wr=new THREE.Mesh(new THREE.CylinderGeometry(.043,.043,.05,12),M.glove);wr.rotation.x=Math.PI/2;wr.position.z=.06;g.add(wr);g.add(fa);const h=box(.075,.06,.11,M.glove,0,0,0,g);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.044,.044,.05,10),M.glove);cuff.rotation.x=Math.PI/2;cuff.position.z=.045;g.add(cuff);const th=box(.025,.025,.06,M.glove,s*.035,.015,-.03,g);g.userData={fa};return g;};
 const armL=arm(-1),armR=arm(1);hold.add(armL,armR);
 function gun(id){const g=new THREE.Group();const P={mag:null,slide:null,pump:null,muzzle:new V(0,0,-.5),hand:[new V(0,-.06,.02),new V(0,-.04,-.2)]};
  if(id==='vanta'){box(.055,.085,.36,M.steel,0,0,-.05,g);cyl(.012,.3,M.black,0,.01,-.38,g);box(.05,.06,.22,M.wood,0,-.005,-.27,g);box(.045,.09,.2,M.wood,0,-.02,.22,g);box(.03,.09,.04,M.wood,0,-.08,.03,g);
   P.mag=box(.035,.15,.06,M.steel,0,-.11,-.1,g);P.mag.rotation.x=.25;box(.01,.03,.01,M.black,0,.06,-.38,g);box(.02,.03,.04,M.black,0,.055,.05,g);P.muzzle.set(0,.01,-.54);P.hand=[new V(0,-.07,.04),new V(0,-.04,-.25)];}
  else if(id==='sentry'||id==='lynx'){const L=id==='lynx'?.85:1;box(.05,.08,.34*L,M.black,0,0,-.04,g);cyl(.011,.28*L,M.steel,0,.01,-.34*L,g);box(.052,.062,.2*L,id==='lynx'?M.tan:M.poly,0,0,-.24*L,g);box(.04,.075,.2,id==='lynx'?M.tan:M.poly,0,-.015,.2,g);box(.03,.09,.04,M.poly,0,-.08,.04,g);
   P.mag=box(.032,.14,.055,M.black,0,-.1,-.08,g);P.mag.rotation.x=.12;box(.02,.012,.3*L,M.black,0,.047,-.08,g);
   if(id==='sentry'){const sc=new THREE.Group();sc.position.set(0,.075,-.02);g.add(sc);box(.04,.04,.07,M.black,0,0,0,sc);const d=box(.032,.032,.005,M.glass,0,0,-.036,sc);const dot=box(.004,.004,.002,M.red,0,0,.0,sc);dot.position.z=.03;}
   else{box(.01,.03,.01,M.black,0,.06,-.3,g);box(.02,.025,.02,M.black,0,.06,.04,g);}P.muzzle.set(0,.01,-.5*L);P.hand=[new V(0,-.07,.05),new V(0,-.04,-.22*L)];}
  else if(id==='mako'){box(.05,.08,.26,M.poly,0,0,-.02,g);cyl(.012,.12,M.steel,0,.012,-.2,g);box(.04,.06,.12,M.poly,0,-.005,-.13,g);P.mag=box(.028,.2,.04,M.black,0,-.13,-.07,g);box(.025,.08,.035,M.poly,0,-.07,.05,g);box(.02,.025,.16,M.steel,0,0,.16,g);box(.015,.03,.015,M.black,0,.055,-.14,g);P.muzzle.set(0,.012,-.28);P.hand=[new V(0,-.07,.05),new V(0,-.13,-.07)];}
  else if(id==='longbow'){box(.055,.085,.5,M.olive,0,0,-.05,g);cyl(.013,.48,M.steel,0,.012,-.5,g);box(.05,.1,.26,M.olive,0,-.01,.28,g);box(.03,.09,.04,M.olive,0,-.08,.06,g);P.mag=box(.035,.06,.08,M.black,0,-.06,-.02,g);
   const sc=new THREE.Group();sc.position.set(0,.09,-.06);g.add(sc);cyl(.026,.3,M.black,0,0,0,sc,16);cyl(.034,.06,M.black,0,0,-.15,sc,16);cyl(.03,.05,M.black,0,0,.14,sc,16);box(.03,.04,.03,M.black,0,-.035,0,sc);const lens=cyl(.03,.004,M.glass,0,0,-.18,sc,16);
   box(.012,.012,.05,M.steel,.04,.03,.12,g);P.muzzle.set(0,.012,-.74);P.hand=[new V(0,-.07,.08),new V(0,-.03,-.24)];}
  else if(id==='bulwark'){box(.055,.07,.3,M.black,0,0,0,g);cyl(.016,.42,M.steel,0,.018,-.34,g);cyl(.014,.34,M.black,0,-.016,-.3,g);P.pump=box(.05,.05,.14,M.wood,0,-.018,-.32,g);box(.045,.09,.24,M.wood,0,-.03,.26,g);box(.03,.09,.04,M.wood,0,-.08,.07,g);P.muzzle.set(0,.018,-.56);P.hand=[new V(0,-.07,.08),new V(0,-.05,-.32)];}
  else if(id==='kestrel'||id==='hawk'||id==='wasp'){const big=id==='hawk',m=big?M.silver:M.black;P.slide=box(.034,.04,big?.22:.18,m,0,.02,-.04,g);box(.032,.03,big?.18:.15,M.poly,0,-.01,-.03,g);const gr=box(.03,.1,.045,M.poly,0,-.06,.03,g);gr.rotation.x=.25;P.mag=box(.024,.06,.03,M.black,0,-.1,.045,g);
   if(id==='wasp'){P.mag.scale.y=2.6;P.mag.position.y=-.14;}P.muzzle.set(0,.02,big?-.16:-.14);P.hand=[new V(0,-.06,.04),new V(-.01,-.07,.04)];}
  else if(id==='knife'){const b=box(.006,.035,.2,M.blade,0,0,-.13,g);b.rotation.x=-.04;box(.02,.03,.1,M.grip,0,-.004,.0,g);box(.05,.012,.012,M.steel,0,0,-.05,g);P.hand=[new V(0,-.01,.0),new V(-.2,-.25,.2)];}
  else if(id==='bomb'){box(.18,.11,.14,M.bomb,0,0,-.04,g);box(.1,.012,.06,M.black,0,.06,-.02,g);const led=box(.015,.008,.015,M.led,.05,.066,-.05,g);P.led=led;box(.02,.02,.12,M.steel,-.07,.04,-.04,g);P.hand=[new V(.08,-.04,0),new V(-.08,-.04,0)];}
  else if(['frag','smoke','flash','inc'].includes(id)){let n;if(id==='frag'){n=new THREE.Mesh(new THREE.SphereGeometry(.035,14,10),M.frag);n.scale.y=1.2;}else{n=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.11,14),M[id]);}g.add(n);box(.012,.03,.012,M.steel,0,.06,0,g);const ring=new THREE.Mesh(new THREE.TorusGeometry(.016,.003,6,12),M.steel);ring.position.set(.02,.07,0);g.add(ring);P.hand=[new V(0,-.04,.02),new V(-.2,-.25,.2)];}
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(.16,.16),flashMat);fl.position.copy(P.muzzle);fl.visible=false;g.add(fl);const fl2=new THREE.Mesh(new THREE.PlaneGeometry(.16,.16),flashMat);fl2.rotation.y=Math.PI/2;fl.add(fl2);P.flash=fl;
  g.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});return{g,P};}
 const OFF={rifle:new V(.16,-.175,-.6),smg:new V(.15,-.16,-.52),sniper:new V(.16,-.18,-.66),shotgun:new V(.16,-.18,-.62),pistol:new V(.12,-.14,-.42),knife:new V(.15,-.15,-.36),nade:new V(.15,-.15,-.36),bomb:new V(.07,-.19,-.42)};
 const st={id:null,cls:'rifle',m:null,equip:0,equipDur:.6,reload:0,reloadDur:1,kick:0,kickR:0,swayX:0,swayY:0,bob:0,flashT:0,slash:0,throw:0,plant:0,inspect:0,pump:0,shell:0};
 function set(id,cls,side){st.id=id;st.cls=cls;if(!models[id]){models[id]=gun(id);hold.add(models[id].g);}for(const k in models)models[k].g.visible=k===id;st.m=models[id];st.equip=0;st.equipDur=cls==='sniper'?.9:cls==='knife'?.35:cls==='pistol'?.5:.7;st.reload=0;st.slash=0;st.throw=0;
  const sl=side==='atk'?M.sleeveA:M.sleeveD;armL.userData.fa.material=sl;armR.userData.fa.material=sl;}
 const tmp=new V(),tmp2=new V(),e=new THREE.Euler(),AR=new V(.3,-.62,.72),AL=new V(-.62,-.58,.53);
 // s: {dt, mdx, mdy, speed, crouch, onGround, aiming, t}
 function update(s){const dt=s.dt;if(!st.m)return;const P=st.m.P,g=st.m.g;st.equip=Math.min(1,st.equip+dt/st.equipDur);
  st.swayX+=(-s.mdx*.0009-st.swayX)*Math.min(1,dt*8);st.swayY+=(s.mdy*.0009-st.swayY)*Math.min(1,dt*8);st.swayX=Math.max(-.05,Math.min(.05,st.swayX));st.swayY=Math.max(-.05,Math.min(.05,st.swayY));
  st.bob+=dt*(s.speed>.4&&s.onGround?6+s.speed*1.4:0);const ba=Math.min(1,s.speed/5)*(s.onGround?1:.2)*.013;st.kick*=Math.exp(-dt*14);st.kickR*=Math.exp(-dt*10);st.flashT-=dt;
  const off=OFF[st.cls]||OFF.rifle;let x=off.x+st.swayX+Math.cos(st.bob)*ba,y=off.y+st.swayY-Math.abs(Math.sin(st.bob))*ba*.9-(s.crouch?.012:0),z=off.z+st.kick*.06;let rx=st.kickR*.12,ry=st.swayX*1.2,rz=st.swayX*1.5;
  if(s.aiming&&st.cls!=='sniper'){x=x*.25;y+=.03;}
  const eq=1-st.equip;const ee=eq*eq;y-=ee*.28;rx-=ee*.9;
  if(st.reload>0){const k=1-st.reload/st.reloadDur;st.reload=Math.max(0,st.reload-dt);
   if(P.shellR){const p=(k*8)%1;y-=.03;rx+=.15+Math.sin(p*Math.PI)*.08;}
   else{const dip=Math.sin(Math.min(1,k/.9)*Math.PI);rz+=dip*.45;rx+=dip*.18;y-=dip*.06;x-=dip*.03;if(P.mag){P.mag.visible=!(k>.25&&k<.55);P.mag.position.y=P.mag.userData.y0-(k>.55&&k<.7?(.7-k)*.6:0);}if(P.slide)P.slide.position.z=P.slide.userData.z0+(k>.8&&k<.9?.03:0);}}
  else if(P.mag){P.mag.visible=true;P.mag.position.y=P.mag.userData.y0;}
  if(P.slide)P.slide.position.z+=(P.slide.userData.z0-P.slide.position.z)*Math.min(1,dt*20);
  if(P.pump){st.pump=Math.max(0,st.pump-dt*2.2);P.pump.position.z=P.pump.userData.z0+Math.sin(Math.min(1,st.pump)*Math.PI)*.08;}
  if(st.slash>0){const k=1-st.slash;st.slash=Math.max(0,st.slash-dt*3.2);rz+=Math.sin(k*Math.PI)*-1.2;ry+=Math.sin(k*Math.PI)*.8;x-=Math.sin(k*Math.PI)*.12;z-=Math.sin(k*Math.PI)*.1;}
  if(st.throw>0){const k=1-st.throw;st.throw=Math.max(0,st.throw-dt*2.6);z-=Math.sin(k*Math.PI)*.25;y+=Math.sin(k*Math.PI)*.12;rx-=Math.sin(k*Math.PI)*.6;g.visible=k<.45;}
  else if(st.cls==='nade')g.visible=true;
  if(st.plant>0){y-=.06+Math.sin(st.plant*14)*.006;rx+=.5;}
  if(st.inspect>0){st.inspect=Math.max(0,st.inspect-dt*.5);const k=1-st.inspect;const a=Math.sin(Math.min(1,k*1.4)*Math.PI);ry+=a*.9;rz+=a*.5;x-=a*.08;y+=a*.02;}
  if(P.led)P.led.material.emissiveIntensity=(s.t%1)<.5?2.5:.3;
  g.position.set(x,y,z);g.rotation.set(rx,ry,rz);
  P.flash.visible=st.flashT>0;if(P.flash.visible){P.flash.rotation.z=Math.random()*6;const sc=.8+Math.random()*.6;P.flash.scale.set(sc,sc,sc);}
  // arms reach the gun's hand anchors
  for(const[a,h,d]of[[armR,P.hand[0],AR],[armL,P.hand[1],AL]]){tmp.copy(h).applyEuler(e.set(rx,ry,rz)).add(g.position);a.position.copy(tmp);tmp2.copy(tmp).add(d);a.lookAt(tmp2);}
  armL.visible=st.cls!=='pistol'||true;}
 function prep(){for(const k in models){const P=models[k].P;if(P.mag&&P.mag.userData.y0===undefined)P.mag.userData.y0=P.mag.position.y;if(P.slide&&P.slide.userData.z0===undefined)P.slide.userData.z0=P.slide.position.z;if(P.pump&&P.pump.userData.z0===undefined)P.pump.userData.z0=P.pump.position.z;}}
 return{root,M,
  set(id,cls,side){set(id,cls,side);prep();},update,
  fire(big=1,flash=true){st.kick=Math.min(1.6,st.kick+.6*big);st.kickR=Math.min(1.6,st.kickR+.5*big);if(flash)st.flashT=.045;const P=st.m&&st.m.P;if(P&&P.slide)P.slide.position.z=P.slide.userData.z0+.035;if(P&&P.pump)st.pump=1;},
  reload(d,shell){st.reload=d;st.reloadDur=d;if(st.m)st.m.P.shellR=!!shell;},cancelReload(){st.reload=0;},
  slash(){st.slash=1;},throwIt(){st.throw=1;},setPlant(v){st.plant=v;},inspect(){if(st.equip>=1&&st.reload<=0)st.inspect=1;},
  get busy(){return st.equip<1||st.reload>0;},st};}
