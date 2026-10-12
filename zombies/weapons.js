// NIGHTFALL — arsenal: weapon stats, procedural gun models (wall-buys, crate, ally, first person), the forged (upgraded) look and the viewmodel animator.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,ZAX=new THREE.Vector3(0,0,1),R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v,TAU=Math.PI*2,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;

export const WPN={
 warden:{name:'WARDEN .45',up:'MIDNIGHT WARDEN',cost:500,dmg:45,hs:3,rate:.15,auto:false,mag:8,res:80,reload:1.45,spread:.016,ads:.004,recoil:1,kind:'pistol',adsFov:.85,move:1.05},
 hornet:{name:'HORNET SMG',up:'HIVE QUEEN',cost:1000,dmg:42,hs:2.6,rate:.068,auto:true,mag:32,res:192,reload:1.9,spread:.034,ads:.012,recoil:.42,kind:'smg',adsFov:.82,move:1.02},
 mule:{name:'MULE 12',up:'IRON MULE',cost:1200,dmg:58,pel:8,hs:1.6,rate:.78,auto:false,mag:6,res:48,reload:.48,shell:true,spread:.085,ads:.06,recoil:2.2,kind:'shotgun',adsFov:.86,move:.97},
 ranger:{name:'RANGER AR',up:'DAWN RANGER',cost:1400,dmg:95,hs:2.6,rate:.105,auto:true,mag:30,res:180,reload:2.2,spread:.026,ads:.004,recoil:.68,pen:1,kind:'rifle',adsFov:.7,move:.95},
 thresher:{name:'THRESHER LMG',up:'GRIM THRESHER',cost:2500,dmg:120,hs:2.3,rate:.085,auto:true,mag:100,res:400,reload:4.0,spread:.045,ads:.014,recoil:.72,pen:2,kind:'lmg',adsFov:.75,move:.86},
 cannon:{name:'HAND CANNON',up:'THUNDERCLAP',box:1,dmg:620,hs:3,rate:.42,auto:false,mag:6,res:48,reload:2.6,spread:.01,ads:.002,recoil:3,pen:2,kind:'revolver',adsFov:.8,move:1},
 coach:{name:'COACHGUN',up:'DEATH COACH',box:1,dmg:120,pel:10,hs:1.5,rate:.22,auto:false,mag:2,res:40,reload:2.0,spread:.11,ads:.085,recoil:3.2,kind:'double',adsFov:.88,move:.98},
 thumper:{name:'THUMPER',up:'HEARTQUAKE',box:1,proj:'shell',dmg:900,splash:4.6,rate:.8,auto:false,mag:1,res:24,reload:1.5,spread:0,ads:0,recoil:2.4,kind:'launcher',adsFov:.88,move:.95},
 volt:{name:'VOLT CASTER',up:'STORM CASTER',box:1,wonder:1,dmg:3200,chain:5,rate:.75,auto:false,mag:6,res:30,reload:2.5,spread:0,ads:0,recoil:1.6,kind:'volt',adsFov:.9,move:1}};
export const BOX_POOL=[['hornet',10],['mule',9],['ranger',9],['thresher',7],['cannon',9],['coach',9],['thumper',7],['volt',4],['warden',2]];
// stats after the forge
export function stats(id,up){const w=WPN[id];if(!up)return w;const u={...w,name:w.up,dmg:w.dmg*(w.pel?1.8:w.wonder?2:2.2),mag:w.kind==='double'?2:Math.round(w.mag*(w.kind==='launcher'?3:1.5)),res:Math.round(w.res*1.6),rate:w.rate*.9};
 if(id==='warden'){u.splash=2.2;u.sdmg=220;u.rate=.13;}if(id==='volt')u.chain=10;if(id==='thumper')u.splash=6;if(id==='mule')u.pel=10;if(id==='cannon')u.splash=1.6,u.sdmg=500;return u;}

/* ================= materials ================= */
let MAT=null;
function forgedTex(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,256,256);x.strokeStyle='#fff';x.shadowColor='#fff';x.shadowBlur=6;
 for(let i=0;i<26;i++){x.lineWidth=1+R()*2.2;x.beginPath();let a=R()*256,b=R()*256;x.moveTo(a,b);for(let k=0;k<7;k++){a+=(R()-.5)*60;b+=(R()-.5)*60;x.lineTo(a,b);}x.stroke();}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}
export function gunMats(){if(MAT)return MAT;const std=(o,e=.6)=>{const m=new THREE.MeshStandardMaterial(o);m.envMapIntensity=e;return m;};
 const ft=forgedTex();
 MAT={metal:std({color:0x3a3c40,roughness:.32,metalness:.9},.9),dark:std({color:0x18191b,roughness:.45,metalness:.6},.7),poly:std({color:0x222420,roughness:.7,metalness:.05}),
  wood:std({color:0x6a3a1c,roughness:.5,metalness:.05},.5),brass:std({color:0xc09040,roughness:.3,metalness:1},1),olive:std({color:0x3e4630,roughness:.7}),tan:std({color:0x8a7650,roughness:.65}),
  copper:std({color:0xc06a30,roughness:.3,metalness:1},1),glass:new THREE.MeshBasicMaterial({color:new THREE.Color(.4,1.6,3.2)}),red:new THREE.MeshBasicMaterial({color:new THREE.Color(3,.25,.1)}),
  forged:std({color:0x2a1830,roughness:.25,metalness:.85,emissive:new THREE.Color(1.6,.45,.9),emissiveMap:ft,emissiveIntensity:1.4},1),forgedTrim:std({color:0x5a2a10,roughness:.3,metalness:1,emissive:new THREE.Color(1,.35,.05),emissiveIntensity:.5},1),
  glove:std({color:0x221c18,roughness:.85},.2),sleeve:std({color:0x262c1c,roughness:.95},.2),skin:std({color:0xb88a6a,roughness:.7})};
 MAT.forgedTex=ft;return MAT;}

const box=(g,w,h,d,m,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o);return o;};
const cyl=(g,r,l,m,x=0,y=0,z=0,seg=14,r2,ax='z')=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r2??r,l,seg),m);if(ax==='z')o.rotation.x=Math.PI/2;else if(ax==='x')o.rotation.z=Math.PI/2;o.position.set(x,y,z);g.add(o);return o;};

// gun model: barrel along -z, origin at the grip. userData: muzzle, parts, hands[grip,fore], sightY
export function gunModel(id,up=false,wall=false){const M=gunMats();const g=new THREE.Group();const m=up?M.forged:M.metal,dk=up?M.forgedTrim:M.dark,wd=up?M.forged:M.wood;const P={};let muzzle=new V(0,0,-.5),hands=[new V(0,-.06,.02),new V(0,-.04,-.25)],sightY=.06;
 if(id==='warden'){P.slide=new THREE.Group();g.add(P.slide);box(P.slide,.034,.034,.2,m,0,.045,-.06);box(P.slide,.012,.012,.012,dk,0,.067,-.15);box(P.slide,.02,.012,.012,dk,0,.067,.02);
  box(g,.03,.025,.18,dk,0,.018,-.055);box(g,.03,.1,.045,M.poly,0,-.04,.02,-.25);box(g,.01,.03,.04,dk,0,-.0,-.03);P.mag=box(g,.022,.06,.03,dk,0,-.08,.03,-.25);
  muzzle.set(0,.045,-.17);hands=[new V(0,-.05,.03),new V(-.012,-.05,.02)];sightY=.074;}
 else if(id==='hornet'){box(g,.045,.07,.26,m,0,.02,-.06);cyl(g,.022,.16,dk,0,.025,-.26,10);cyl(g,.012,.08,dk,0,.025,-.38,8);box(g,.04,.02,.2,dk,0,.065,-.06);box(g,.015,.025,.02,dk,0,.085,-.14);box(g,.015,.02,.02,dk,0,.085,.04);
  box(g,.036,.09,.04,M.poly,0,-.045,.02,-.2);P.mag=box(g,.03,.16,.04,dk,0,-.08,-.07,.1);box(g,.03,.07,.03,M.poly,0,-.03,-.2);for(const s of[-1,1])box(g,.006,.006,.2,dk,s*.018,.01,.14);box(g,.04,.05,.01,dk,0,.01,.24);
  muzzle.set(0,.025,-.43);hands=[new V(0,-.05,.03),new V(0,-.05,-.2)];sightY=.097;}
 else if(id==='mule'){cyl(g,.019,.62,m,0,.035,-.32,12);cyl(g,.017,.5,dk,0,.0,-.28,12);box(g,.05,.07,.22,m,0,.02,-.0);P.pump=new THREE.Group();g.add(P.pump);cyl(P.pump,.03,.17,wd,0,.0,-.3,12);
  box(g,.045,.1,.26,wd,0,-.03,.2,.18);box(g,.035,.06,.04,dk,0,-.05,.05);box(g,.01,.012,.01,M.brass,0,.058,-.62);muzzle.set(0,.035,-.64);hands=[new V(0,-.05,.06),new V(0,-.02,-.3)];sightY=.065;}
 else if(id==='ranger'){box(g,.05,.08,.3,m,0,.025,-.04);box(g,.052,.06,.22,dk,0,.025,-.29);cyl(g,.012,.24,dk,0,.03,-.5,10);cyl(g,.018,.05,dk,0,.03,-.63,10);
  box(g,.03,.03,.32,dk,0,.08,-.08);const sc=new THREE.Group();g.add(sc);cyl(sc,.022,.12,M.dark,0,.115,-.06,12);cyl(sc,.026,.02,dk,0,.115,-.12,12);cyl(sc,.026,.02,dk,0,.115,0,12);box(sc,.012,.03,.02,dk,0,.095,-.06);
  P.mag=new THREE.Group();g.add(P.mag);box(P.mag,.032,.15,.055,dk,0,-.08,-.1,.25);box(g,.036,.09,.04,M.poly,0,-.04,.04,-.25);box(g,.04,.08,.2,M.poly,0,-.0,.22);box(g,.044,.12,.05,M.poly,0,-.03,.33);
  muzzle.set(0,.03,-.66);hands=[new V(0,-.05,.05),new V(0,-.02,-.3)];sightY=.115;}
 else if(id==='thresher'){box(g,.07,.1,.36,m,0,.03,-.02);cyl(g,.04,.32,dk,0,.04,-.36,12);cyl(g,.016,.3,dk,0,.04,-.62,10);for(let k=0;k<6;k++)cyl(g,.042,.01,M.metal,0,.04,-.24-k*.045,12);
  box(g,.03,.05,.12,dk,0,.12,-.1);box(g,.012,.04,.012,dk,0,.1,-.28);P.mag=new THREE.Group();g.add(P.mag);box(P.mag,.1,.12,.12,M.olive,.07,-.04,-.04);box(P.mag,.04,.04,.06,dk,.03,.02,-.04);
  box(g,.04,.1,.045,M.poly,0,-.05,.06,-.25);box(g,.05,.09,.24,M.poly,0,.0,.25);for(const s of[-1,1])box(g,.01,.01,.2,dk,s*.015,-.02,-.5,.1,0,s*.08);
  muzzle.set(0,.04,-.78);hands=[new V(0,-.06,.07),new V(0,-.02,-.3)];sightY=.13;}
 else if(id==='cannon'){cyl(g,.022,.3,m,0,.04,-.2,12);box(g,.03,.014,.22,m,0,.065,-.2);P.cyl=new THREE.Group();P.cyl.position.set(0,.03,-.02);g.add(P.cyl);cyl(P.cyl,.04,.07,m,0,0,0,7);
  for(let k=0;k<6;k++){const a=k/6*TAU;cyl(P.cyl,.009,.072,dk,Math.cos(a)*.024,Math.sin(a)*.024,0,6);}box(g,.036,.05,.1,m,0,.025,.05);box(g,.034,.11,.05,wd,0,-.05,.08,-.35);box(g,.01,.02,.01,M.red,0,.075,-.34);
  muzzle.set(0,.04,-.36);hands=[new V(0,-.06,.09),new V(-.01,-.06,.08)];sightY=.08;}
 else if(id==='coach'){P.br=new THREE.Group();P.br.position.set(0,.02,-.06);g.add(P.br);for(const s of[-1,1])cyl(P.br,.022,.55,m,s*.022,.0,-.27,12);box(P.br,.07,.025,.4,dk,0,-.022,-.22);
  box(g,.06,.06,.12,m,0,.01,.0);box(g,.05,.1,.28,wd,0,-.04,.17,.2);box(g,.054,.03,.14,wd,0,-.015,-.22);muzzle.set(0,.02,-.6);hands=[new V(0,-.06,.07),new V(0,-.03,-.25)];sightY=.05;}
 else if(id==='thumper'){P.br=new THREE.Group();P.br.position.set(0,.03,-.05);g.add(P.br);cyl(P.br,.048,.36,m,0,0,-.17,16);cyl(P.br,.052,.04,dk,0,0,-.35,16);
  box(g,.06,.07,.14,m,0,.01,.02);box(g,.05,.09,.24,wd,0,-.04,.2,.18);box(g,.035,.09,.04,M.poly,0,-.06,.05,-.25);box(g,.04,.06,.05,dk,0,.08,-.08);muzzle.set(0,.03,-.4);hands=[new V(0,-.06,.06),new V(0,-.03,-.22)];sightY=.11;}
 else if(id==='volt'){box(g,.07,.09,.26,up?M.forged:M.copper,0,.02,-.02);cyl(g,.035,.24,M.glass,0,.03,-.17,12);P.coils=[];for(let k=0;k<4;k++){const c=new THREE.Mesh(new THREE.TorusGeometry(.05,.012,8,18),up?M.forgedTrim:M.copper);c.position.set(0,.03,-.08-k*.07);g.add(c);P.coils.push(c);}
  for(const s of[-1,1]){const pr=box(g,.012,.012,.16,dk,s*.03,.06,-.38,0,s*.2);}const tip=new THREE.Mesh(new THREE.SphereGeometry(.025,10,8),M.glass);tip.position.set(0,.03,-.34);g.add(tip);P.tip=tip;
  box(g,.035,.1,.045,M.poly,0,-.05,.05,-.25);box(g,.05,.07,.18,M.dark,0,.0,.18);box(g,.02,.03,.06,M.glass,0,.085,-.0);muzzle.set(0,.03,-.4);hands=[new V(0,-.06,.06),new V(0,-.03,-.2)];sightY=.1;}
 g.traverse(o=>{if(o.isMesh){o.castShadow=!wall;}});
 g.userData={muzzle,P,hands,sightY,id,up};return g;}

/* ================= first-person viewmodel ================= */
export class ViewModel{
 constructor(flashTex){const M=gunMats();this.root=new THREE.Group();this.hold=new THREE.Group();this.root.add(this.hold);this.models={};this.cur=null;this.id=null;this.up=false;
  const fm=new THREE.MeshBasicMaterial({map:flashTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,color:new THREE.Color(3,2.3,1.5)});this.fm=fm;
  this.flash=new THREE.Group();for(let k=0;k<3;k++){const p=new THREE.Mesh(new THREE.PlaneGeometry(.22,.22),fm);p.rotation.y=k*Math.PI/3;this.flash.add(p);}const fr=new THREE.Mesh(new THREE.PlaneGeometry(.26,.26),fm);this.flash.add(fr);this.flash.visible=false;
  const arm=(s)=>{const g=new THREE.Group();const fa=cyl(g,.04,.42,M.sleeve,0,0,.22,10,.05);const cuff=cyl(g,.043,.05,M.olive,0,0,.02,10);const hand=box(g,.075,.06,.1,M.glove,0,0,-.04);box(g,.075,.025,.07,M.glove,0,-.03,-.1);box(g,.025,.025,.06,M.glove,s*.045,.01,-.05,0,s*.4);return g;};
  this.armR=arm(1);this.armL=arm(-1);this.hold.add(this.armR,this.armL);
  // knife + grenade props
  this.knife=new THREE.Group();box(this.knife,.012,.03,.2,M.metal,0,0,-.12);box(this.knife,.02,.035,.1,M.poly,0,-.005,.03);box(this.knife,.05,.012,.012,M.dark,0,0,-.02);this.knife.visible=false;this.root.add(this.knife);
  this.nade=new THREE.Group();const nb=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),M.olive);nb.scale.set(1,1.2,1);this.nade.add(nb);cyl(this.nade,.012,.03,M.dark,0,.045,0,6,undefined,'y');this.nade.visible=false;this.root.add(this.nade);
  this.base=new V(.15,-.16,-.36);this.t=0;this.kick=0;this.kickR=0;this.swX=0;this.swY=0;this.bob=0;this.ads=0;this.sprint=0;this.swap=0;this.swapDir=0;this.rel=null;this.knifeT=0;this.throwT=0;this.flashT=0;this.lastShot=-9;this.lower=0;this.scale=1;}
 set(id,up){const key=id+(up?'+':'');if(this.key===key)return;if(this.cur)this.cur.visible=false;if(!this.models[key]){const m=gunModel(id,up);m.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=false;}});this.hold.add(m);this.models[key]=m;}
  this.cur=this.models[key];this.cur.visible=true;this.key=key;this.id=id;this.up=up;const u=this.cur.userData;this.cur.add(this.flash);this.flash.position.copy(u.muzzle);this.flash.position.z-=.05;this.rel=null;}
 // arms reach from hand anchors towards the bottom corners of the screen
 placeArms(lp){const u=this.cur.userData;const h0=u.hands[0].clone(),h1=u.hands[1].clone().add(lp);const place=(a,h,s)=>{a.position.copy(h);const tgt=new V(s*.25,-.55,.35);a.quaternion.setFromUnitVectors(ZAX,tgt.sub(h).normalize());};
  place(this.armR,h0,1);place(this.armL,h1,-1);}
 fire(k=1,t=0,volt=false){this.kick=Math.min(2.2,this.kick+k);this.kickR=(R()-.5)*k;this.flashT=.05;this.lastShot=t;this.flash.visible=true;this.flash.rotation.z=R()*6;this.flash.scale.setScalar((.8+R()*.5)*Math.min(1.6,.6+k*.4));
  this.fm.color.set(volt?new THREE.Color(1.2,2.4,4):new THREE.Color(3,2.3,1.5));}
 startReload(dur,shell){this.rel={t:0,dur,shell};}
 update(o){const dt=o.dt;this.t+=dt;const M=gunMats();if(!this.cur)return;const u=this.cur.userData,P=u.P;
  this.kick=Math.max(0,this.kick-dt*(o.auto?12:7));this.kickR*=Math.exp(-dt*10);this.flashT-=dt;if(this.flashT<=0)this.flash.visible=false;
  this.swX+=(cl(-o.mdx*.0007,-.04,.04)-this.swX)*Math.min(1,dt*10);this.swY+=(cl(o.mdy*.0007,-.04,.04)-this.swY)*Math.min(1,dt*10);
  this.ads+=((o.ads?1:0)-this.ads)*Math.min(1,dt*(o.ads?11:9));this.sprint+=((o.sprint?1:0)-this.sprint)*Math.min(1,dt*8);this.lower+=((o.lower?1:0)-this.lower)*Math.min(1,dt*6);
  const sp=o.onGround?Math.min(1.3,o.speed/4.2):0;this.bob+=dt*(5+o.speed*1.15)*(this.sprint>.5?1.25:1);const bA=(1-this.ads*.85)*sp;const bx=Math.sin(this.bob)*.011*bA*(1+this.sprint),by=-Math.abs(Math.cos(this.bob))*.012*bA*(1+this.sprint*.8);
  if(this.swap>0)this.swap=Math.max(0,this.swap-dt*4.2);const sw=this.swap*this.swap;
  // reload pose
  let rx=0,ry=0,rz=0,ly=0,lp=new V(),magY=0,brk=0,cylOut=0;if(this.rel){const r=this.rel;r.t+=dt/r.dur;const t=Math.min(1,r.t);
   if(r.shell){const w=Math.sin(Math.min(1,t)*Math.PI);rz=.35*Math.min(1,this.relIn=(this.relIn||0)+dt*6);rx=-.15;ly=-.03;lp.set(.02,-.05-Math.abs(Math.sin(t*Math.PI))*.05,.14*w);}
   else{const tilt=Math.sin(Math.min(1,t)*Math.PI);rz=.45*tilt;rx=-.12*tilt;ly=-.04*tilt;
    if(this.id==='coach'||this.id==='thumper'){brk=Math.sin(cl((t-.1)/.8,0,1)*Math.PI);lp.set(0,-.08*brk,.1*brk);}
    else if(this.id==='cannon'){cylOut=Math.sin(cl((t-.1)/.8,0,1)*Math.PI);lp.set(.02,-.04*cylOut,.18*cylOut);}
    else{const out=cl((t-.15)/.25,0,1),inn=cl((t-.5)/.25,0,1);magY=-.4*(out-inn)*(out>0?1:0);if(t>.15&&t<.75)lp.set(.01,magY*.6-.03,.12);if(t>.78&&t<.9){this.kick=Math.max(this.kick,.3);}}}
   if(r.t>=1&&!r.shell)this.rel=null;}else this.relIn=0;
  if(P.mag&&P.mag.isObject3D){P.mag.position.y=(P.mag.userData.y0??(P.mag.userData.y0=P.mag.position.y))+magY;}
  if(P.br)P.br.rotation.x=brk*.7;if(P.cyl){P.cyl.position.x=cylOut*.05;P.cyl.rotation.z+=(o.cylSpin||0);}
  if(P.slide){const t=o.t-this.lastShot;P.slide.position.z=t<.1?Math.sin(t/.1*Math.PI)*.04:(o.empty?.04:0);}
  if(P.pump){const t=o.t-this.lastShot;const k=t>.14&&t<.55?Math.sin((t-.14)/.41*Math.PI):0;P.pump.position.z=k*.09;lp.z+=k*.09;}
  if(P.coils){for(let k=0;k<P.coils.length;k++)P.coils[k].rotation.z+=dt*(2+k);M.glass.color.setRGB(.4+.3*Math.sin(o.t*9),1.4+.4*Math.sin(o.t*9),3);}
  if(this.up){M.forgedTex.offset.x+=dt*.05;M.forgedTex.offset.y+=dt*.031;M.forged.emissiveIntensity=1.2+Math.sin(o.t*3)*.3;}
  // knife / grenade overlays
  let kdip=0;if(this.knifeT>0){this.knifeT=Math.max(0,this.knifeT-dt);const k=1-this.knifeT/.38;kdip=Math.sin(Math.min(1,k*1.3)*Math.PI);this.knife.visible=true;const a=-1.1+k*2.6;this.knife.position.set(.22-k*.42,-.12+Math.sin(k*Math.PI)*.06,-.32-Math.sin(k*Math.PI)*.12);this.knife.rotation.set(-.2,a,-.6+k*.4);}else this.knife.visible=false;
  if(this.throwT>0){this.throwT=Math.max(0,this.throwT-dt);const k=1-this.throwT/.5;kdip=Math.max(kdip,Math.sin(Math.min(1,k*1.2)*Math.PI)*.8);this.nade.visible=k<.62;this.nade.position.set(-.18+k*.12,-.2+Math.sin(k*Math.PI)*.22,-.3-k*.25);}else this.nade.visible=false;
  // compose
  const sc=.62;this.hold.scale.setScalar(sc);
  const adsPos=new V(0,-u.sightY*sc,-.24),hip=this.base;const a=ease(this.ads);
  const px=hip.x+(adsPos.x-hip.x)*a+bx+this.swX*(1-a*.7)+this.sprint*.04,py=hip.y+(adsPos.y-hip.y)*a+by+this.swY*(1-a*.7)-sw*.35-ly-this.sprint*.03-kdip*.25-this.lower*.3-(o.airborne?.012:0),pz=hip.z+(adsPos.z-hip.z)*a+this.kick*(.045-a*.02);
  this.hold.position.set(px,py,pz);
  this.hold.rotation.set(this.kick*(.09-a*.05)+rx-sw*.9+this.sprint*-.25+cl(-o.vy*.003,-.03,.03),this.swX*1.5+this.kickR*.04+ry+this.sprint*.7,o.strafe*.03*(1-a)+rz+this.sprint*.35+this.kickR*.05);
  this.placeArms(lp);this.root.visible=o.visible;}
}
