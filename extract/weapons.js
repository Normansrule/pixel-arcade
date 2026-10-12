// EXFIL — procedural gun models (shared by first-person viewmodel and third-person rigs), attachments, and the animated viewmodel.
import * as THREE from '../vendor/three.module.min.js';
import {WPN,ITEMS} from './data.js';
const V=THREE.Vector3;

let MAT=null;
export function gunMats(){if(MAT)return MAT;const std=o=>new THREE.MeshStandardMaterial(o);
 MAT={steel:std({color:0x3a3d42,roughness:.42,metalness:.6}),black:std({color:0x26282b,roughness:.55,metalness:.35}),poly:std({color:0x222326,roughness:.75,metalness:.1}),tan:std({color:0x8a7656,roughness:.75}),olive:std({color:0x4a5236,roughness:.7}),
  wood:std({color:0x6a3e22,roughness:.55}),brass:std({color:0xb8903a,roughness:.3,metalness:1}),glass:std({color:0x1a2a3a,roughness:.05,metalness:.9,emissive:0x050a12}),red:std({color:0xff2010,emissive:0xff1a08,emissiveIntensity:3}),
  glove:std({color:0x2a2724,roughness:.85}),sleeve:std({color:0x5a5c4c,roughness:.92}),shell:std({color:0xa02a1a,roughness:.5}),
  flash:new THREE.MeshBasicMaterial({transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(3,2.2,1.4),side:THREE.DoubleSide})};
 return MAT;}
const box=(w,h,d,m,x=0,y=0,z=0,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p&&p.add(o);return o;};
const cyl=(r,l,m,x=0,y=0,z=0,p,seg=12,r2)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r2??r,l,seg),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);p&&p.add(o);return o;};

// returns {g, P:{sight, muzzle, hands:[grip,guard], mag, pump, slide, rail}}; gun points down -Z, origin at the trigger
export function gunModel(wid,mods={},flashTex){const M=gunMats();const g=new THREE.Group();const P={sight:new V(0,.07,0),muzzle:new V(0,.03,-.4),hands:[new V(0,-.05,.05),new V(0,-.03,-.2)],mag:null,pump:null,slide:null,rail:new V(0,.05,-.05),parts:{}};
 if(wid==='p9'){P.slide=box(.032,.034,.2,M.steel,0,.045,-.04,g);box(.03,.03,.17,M.poly,0,.016,-.03,g);const gr=box(.03,.11,.048,M.poly,0,-.045,.04,g);gr.rotation.x=.22;box(.006,.03,.04,M.poly,0,-.006,-.015,g);
  box(.006,.008,.006,M.black,0,.066,-.13,g);box(.02,.008,.006,M.black,0,.066,.05,g);P.mag=box(.024,.012,.04,M.black,0,-.105,.055,g);P.sight.set(0,.07,0);P.muzzle.set(0,.045,-.15);P.hands=[new V(0,-.05,.05),new V(-.012,-.055,.05)];P.rail.set(0,.065,-.03);P.mzl=new V(0,.045,-.14);}
 else if(wid==='vx9'){box(.05,.07,.3,M.black,0,.01,-.04,g);cyl(.022,.18,M.steel,0,.012,-.27,g);box(.054,.05,.16,M.poly,0,0,-.2,g);const gr=box(.035,.1,.045,M.poly,0,-.07,.05,g);gr.rotation.x=.2;
  box(.012,.012,.2,M.steel,-.02,.01,.2,g);box(.012,.012,.2,M.steel,.02,.01,.2,g);box(.05,.07,.015,M.poly,0,-.005,.3,g);box(.016,.014,.25,M.black,0,.052,-.05,g);box(.006,.02,.006,M.black,0,.07,-.24,g);box(.016,.016,.01,M.black,0,.068,.06,g);
  P.mag=box(.03,.17,.04,M.black,0,-.1,-.06,g);P.mag.rotation.x=.08;P.sight.set(0,.073,0);P.muzzle.set(0,.012,-.37);P.hands=[new V(0,-.06,.055),new V(0,-.03,-.19)];P.rail.set(0,.06,-.03);P.mzl=new V(0,.012,-.36);}
 else if(wid==='ark'){box(.05,.075,.32,M.black,0,.01,-.02,g);box(.056,.064,.3,M.olive,0,.01,-.32,g);cyl(.012,.24,M.steel,0,.015,-.58,g);box(.016,.016,.06,M.black,0,.03,-.48,g);box(.016,.022,.36,M.black,0,.058,-.08,g);
  const st=box(.045,.08,.26,M.olive,0,-.005,.29,g);box(.04,.11,.03,M.poly,0,-.01,.42,g);const gr=box(.034,.1,.046,M.poly,0,-.075,.07,g);gr.rotation.x=.28;box(.006,.03,.006,M.black,0,.08,-.44,g);box(.02,.022,.012,M.black,0,.08,.08,g);
  const mag=new THREE.Group();mag.position.set(0,-.04,-.1);g.add(mag);box(.026,.12,.06,M.black,0,-.06,0,mag);const m2=box(.026,.1,.058,M.black,0,-.15,.025,mag);m2.rotation.x=-.3;P.mag=mag;
  P.sight.set(0,.087,0);P.muzzle.set(0,.015,-.7);P.hands=[new V(0,-.065,.07),new V(0,-.025,-.32)];P.rail.set(0,.069,-.06);P.mzl=new V(0,.015,-.7);}
 else if(wid==='hrn'){box(.052,.08,.36,M.steel,0,.012,-.04,g);box(.06,.07,.38,M.wood,0,.005,-.38,g);cyl(.014,.36,M.steel,0,.02,-.74,g);box(.05,.1,.36,M.wood,0,-.01,.34,g).rotation.x=.04;box(.044,.12,.03,M.poly,0,-.02,.53,g);
  const gr=box(.036,.1,.05,M.wood,0,-.075,.09,g);gr.rotation.x=.3;box(.016,.02,.3,M.black,0,.062,-.06,g);box(.006,.028,.006,M.black,0,.085,-.56,g);box(.02,.02,.012,M.black,0,.083,.08,g);
  P.mag=box(.03,.09,.07,M.black,0,-.075,-.1,g);P.sight.set(0,.09,0);P.muzzle.set(0,.02,-.92);P.hands=[new V(0,-.07,.09),new V(0,-.03,-.36)];P.rail.set(0,.072,-.06);P.mzl=new V(0,.02,-.92);}
 else if(wid==='stk'){box(.055,.075,.24,M.black,0,.01,0,g);cyl(.016,.56,M.steel,0,.03,-.4,g);cyl(.015,.44,M.black,0,-.008,-.34,g);P.pump=box(.06,.055,.17,M.wood,0,-.01,-.34,g);box(.05,.1,.3,M.wood,0,-.01,.27,g).rotation.x=.05;box(.044,.12,.025,M.poly,0,-.01,.43,g);
  const gr=box(.034,.09,.045,M.wood,0,-.065,.08,g);gr.rotation.x=.3;box(.006,.012,.006,M.brass,0,.05,-.66,g);for(let k=0;k<4;k++){const s=cyl(.009,.03,M.shell,.03,-.005,-.02+k*.03,g,8);s.rotation.set(0,0,Math.PI/2);}
  P.sight.set(0,.056,0);P.muzzle.set(0,.03,-.69);P.hands=[new V(0,-.06,.07),new V(0,-.035,-.34)];P.rail.set(0,.05,-.02);P.mzl=new V(0,.03,-.68);P.mag=null;}
 const o=mods.optic&&mods.optic.id;
 // iron sights: rear aperture + front post on the rail line
 const IR={p9:[.05,-.13],vx9:[.06,-.24],ark:[.08,-.44],hrn:[.08,-.56]}[wid];
 if(IR&&!o){const r=P.rail.y,sy=r+.03;for(const sx of[-1,1])box(.005,.034,.008,M.black,sx*.0075,r+.017,IR[0],g);box(.024,.008,.01,M.black,0,r+.004,IR[0],g);box(.004,.03,.004,M.black,0,r+.015,IR[1],g);box(.02,.006,.008,M.black,0,r+.003,IR[1],g);P.sight.set(0,sy,0);}
 // attachments
 const mz=mods.muzzle&&mods.muzzle.id,gp=mods.grip&&mods.grip.id,mg=mods.mag&&mods.mag.id;
 if(o==='dot'){const r=P.rail;const h=new THREE.Group();h.position.copy(r);g.add(h);box(.03,.012,.05,M.black,0,.006,0,h);box(.032,.034,.012,M.black,0,.03,-.02,h);box(.032,.034,.01,M.black,0,.03,.02,h);box(.006,.03,.04,M.black,-.014,.03,0,h);box(.006,.03,.04,M.black,.014,.03,0,h);
  const lens=box(.022,.022,.002,M.glass,0,.03,-.02,h);lens.material=lens.material.clone();lens.material.transparent=true;lens.material.opacity=.25;const dot=new THREE.Mesh(new THREE.SphereGeometry(.0012,6,4),M.red);dot.position.set(0,.03,-.019);h.add(dot);P.sight.set(0,r.y+.03,0);P.dotMesh=dot;}
 else if(o==='x4'){const r=P.rail;const h=new THREE.Group();h.position.copy(r);g.add(h);box(.02,.02,.03,M.black,0,.01,.04,h);box(.02,.02,.03,M.black,0,.01,-.05,h);cyl(.016,.2,M.black,0,.04,0,h,14);cyl(.022,.05,M.black,0,.04,-.12,h,14,.016);cyl(.02,.04,M.black,0,.04,.1,h,14);
  const ln=cyl(.019,.003,M.glass,0,.04,-.146,h,14);P.sight.set(0,r.y+.04,0);P.scope=true;}
 if(mz&&mz.startsWith('sup')){const L=mz==='sup9'?.15:.2;cyl(.021,L,M.black,P.muzzle.x,P.muzzle.y,P.muzzle.z-L/2,g,14);P.muzzle.z-=L;P.mzl.z-=L;}
 else if(mz==='comp'){cyl(.016,.05,M.steel,P.muzzle.x,P.muzzle.y,P.muzzle.z-.025,g,10);P.muzzle.z-=.05;P.mzl.z-=.05;}
 if(gp==='grip'){const v=box(.024,.08,.03,M.poly,0,P.hands[1].y-.03,P.hands[1].z,g);P.hands[1].y-=.07;}
 if(mg==='ark60'&&P.mag){P.mag.scale.set(1.6,1.25,1);}if(mg==='vx50'&&P.mag){P.mag.visible=false;const d=cyl(.06,.05,M.black,0,-.1,-.06,g,16);d.rotation.set(0,Math.PI/2,0);P.mag=d;}if((mg==='hrn20'||mg==='p9x')&&P.mag){P.mag.scale.y=1.7;P.mag.position.y-=.02;}
 // muzzle flash
 if(flashTex){const f=new THREE.Group();f.position.copy(P.muzzle);const m=M.flash.clone();m.map=flashTex;for(let k=0;k<2;k++){const pl=new THREE.Mesh(new THREE.PlaneGeometry(.22,.22),m);pl.rotation.y=k*Math.PI/2;f.add(pl);}const fr=new THREE.Mesh(new THREE.PlaneGeometry(.16,.16),m);fr.position.z=-.01;f.add(fr);f.visible=false;g.add(f);P.flash=f;}
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;}});return{g,P};}

/* ================= first-person viewmodel ================= */
export class Viewmodel{
 constructor(flashTex){const M=gunMats();this.root=new THREE.Group();this.hold=new THREE.Group();this.root.add(this.hold);this.flashTex=flashTex;this.gun=null;this.key='';
  const arm=()=>{const g=new THREE.Group();const fa=new THREE.Mesh(new THREE.CylinderGeometry(.036,.048,.34,10),M.sleeve);fa.position.y=.19;g.add(fa);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.038,.038,.06,10),M.glove);cuff.position.y=.03;g.add(cuff);
   const hand=box(.07,.05,.1,M.glove,0,-.01,0,g);hand.rotation.x=Math.PI/2;return g;};
  this.armR=arm();this.armL=arm();this.root.add(this.armR,this.armL);
  this.s={ads:0,sprint:0,kick:0,kickR:0,kickX:0,swayX:0,swayY:0,bob:0,reload:0,pump:0,low:0,equip:1,lean:0,t:0,flashT:0};this.tq=new THREE.Quaternion();this._v=new V();this._w=new V();this._m=new THREE.Matrix4();
  this.medItem=box(.08,.05,.12,new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:.6}),0,0,0,this.root);this.medItem.visible=false;}
 set(it){const key=it?it.id+Object.values(it.mods||{}).map(m=>m?m.id:'').join(','):'';if(key===this.key)return;this.key=key;if(this.gun){this.hold.remove(this.gun.g);}this.gun=null;if(!it)return;
  this.gun=gunModel(ITEMS[it.id].wid,it.mods||{},this.flashTex);this.gun.g.traverse(o=>{if(o.isMesh)o.castShadow=false;});this.hold.add(this.gun.g);this.wid=ITEMS[it.id].wid;this.s.equip=1;}
 fire(k){this.s.kick=Math.min(1.6,this.s.kick+k);this.s.kickX=(Math.random()-.5)*k;if(this.gun&&this.gun.P.flash){const f=this.gun.P.flash;f.visible=true;f.rotation.z=Math.random()*6;f.scale.setScalar(.8+Math.random()*.5);this.s.flashT=.045;}if(this.wid==='stk')this.s.pump=1;}
 // st: {dt, ads, sprint, speed, mdx, mdy, reload(0..1 or -1), low(0..1), lean, eyeZ, onGround, crouch, flash}
 update(st){const s=this.s,dt=st.dt;s.t+=dt;const k=n=>1-Math.exp(-dt*n);
  s.ads+=(st.ads-s.ads)*k(st.adsSpeed||14);s.sprint+=((st.sprint?1:0)-s.sprint)*k(8);s.low+=(st.low-s.low)*k(8);s.equip=Math.max(0,s.equip-dt*3.2);s.lean+=(st.lean-s.lean)*k(10);
  s.swayX+=(-st.mdx*.0009-s.swayX)*k(9);s.swayY+=(-st.mdy*.0009-s.swayY)*k(9);s.swayX=Math.max(-.06,Math.min(.06,s.swayX));s.swayY=Math.max(-.06,Math.min(.06,s.swayY));
  s.kick*=Math.exp(-dt*14);s.kickX*=Math.exp(-dt*10);s.pump=Math.max(0,s.pump-dt*2.4);if(s.flashT>0){s.flashT-=dt;if(s.flashT<=0&&this.gun&&this.gun.P.flash)this.gun.P.flash.visible=false;}
  if(st.speed>.3&&st.onGround)s.bob+=dt*st.speed*(st.sprint?1.6:2.1);const bobA=Math.min(1,st.speed/4)*(1-s.ads*.85);
  if(!this.gun){this.root.visible=false;return;}this.root.visible=true;const P=this.gun.P,a=s.ads;
  // hip pose -> ads pose (sight on the optical axis)
  const eyeZ=st.eyeZ||.36;const hipX=.13,hipY=-.065-P.sight.y,hipZ=-.4;const adsX=0,adsY=-P.sight.y,adsZ=-eyeZ;
  let x=hipX+(adsX-hipX)*a,y=hipY+(adsY-hipY)*a,z=hipZ+(adsZ-hipZ)*a;
  x+=Math.sin(s.bob)*.012*bobA+s.swayX*(1-a*.7);y+=-Math.abs(Math.cos(s.bob))*.012*bobA+s.swayY*(1-a*.7)-(1-a)*.004*Math.sin(s.t*1.6);z+=s.kick*.045*(1-a*.4);
  let rx=s.kick*.09*(1-a*.5)+s.swayY*1.2,ry=s.swayX*1.5+s.kickX*.04,rz=s.kickX*.05-s.lean*.15;
  // sprint
  x+=s.sprint*.04;y-=s.sprint*.06;rx-=s.sprint*.35;ry+=s.sprint*.6;rz+=s.sprint*.25;
  // lowered (healing / swapping / interacting)
  const lw=Math.max(s.low,s.equip);y-=lw*.35;rx-=lw*.6;
  // reload
  const r=st.reload;if(r>=0){const e=Math.sin(Math.min(1,r)*Math.PI);rz+=e*.5;rx+=e*.18;y-=e*.03;x-=e*.02;
   if(P.mag&&this.wid!=='stk'){const base=P.mag.userData.base||(P.mag.userData.base=P.mag.position.clone());const d=r<.45?Math.min(1,r/.2)*-.3:r<.75?-.3+(r-.45)/.3*.3:0;P.mag.position.copy(base);P.mag.position.y+=d;P.mag.visible=!(r>.25&&r<.5);}}
  else if(P.mag&&P.mag.userData.base){P.mag.position.copy(P.mag.userData.base);P.mag.visible=true;}
  if(P.pump){const pd=s.pump>0?Math.sin(s.pump*Math.PI)*.08:r>=0?Math.max(0,Math.sin(r*Math.PI*2))*.03:0;P.pump.position.z=-.34+pd;}
  if(P.slide){P.slide.position.z=-.04+Math.min(.03,s.kick*.04);}
  this.hold.position.set(x,y,z);this.hold.rotation.set(rx,ry,rz);
  // arms: hands follow grip + guard
  this.hold.updateMatrix();const m=this.hold.matrix;
  const place=(armG,hand,elb)=>{const hp=this._v.copy(hand).applyMatrix4(m);armG.position.copy(hp);const dir=this._w.copy(elb).normalize();armG.quaternion.setFromUnitVectors(new V(0,1,0),dir);};
  const hl=(r>=0&&this.wid!=='stk'&&r>.15&&r<.8)?new V(P.hands[1].x,P.hands[1].y-.12,P.hands[1].z+.15):P.hands[1];
  place(this.armR,P.hands[0],new V(.45,-.55,.7));place(this.armL,hl,new V(-.5,-.5,.6));
  this.medItem.visible=s.low>.5&&!!st.medItem;if(this.medItem.visible){this.medItem.position.set(-.1,-.15+(1-s.low)*.2,-.35);this.medItem.rotation.set(.4,.3,0);}}
}
