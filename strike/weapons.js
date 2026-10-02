// STRIKE ZONE — arsenal: six weapon definitions, first-person viewmodels (gauntlets + guns + animations) and the projectile simulation.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v;

export const WPN={
 sg:{slot:1,name:'SCATTERGUN',ammo:'shells',use:1,rate:.8,pel:9,dmg:9.5,spr:.05,kick:1,col:0xffb050},
 ssg:{slot:2,name:'TWIN BORE',ammo:'shells',use:2,rate:1.15,pel:20,dmg:9,spr:.1,sprY:.045,kick:1.9,push:5,col:0xffa040},
 cg:{slot:3,name:'GRINDER',ammo:'bullets',use:1,rate:.052,dmg:11,spr:.018,sprMax:.055,spin:.32,kick:.18,col:0xffc060},
 pg:{slot:4,name:'ARC CASTER',ammo:'cells',use:1,rate:.08,proj:'plasma',dmg:16,speed:62,splash:1.3,sdmg:7,kick:.16,col:0x50d8ff},
 rl:{slot:5,name:'HELLFIST',ammo:'rockets',use:1,rate:.78,proj:'rocket',dmg:95,speed:34,splash:4.4,sdmg:100,kick:.9,col:0xff6a20},
 rg:{slot:6,name:'LANCE',ammo:'slugs',use:1,rate:1.3,dmg:170,pierce:true,kick:1.4,col:0x60ff90}};
export const ORDER=['sg','ssg','cg','pg','rl','rg'];
export const AMMO={shells:{max:60,pick:12,start:24},bullets:{max:300,pick:60,start:0},cells:{max:300,pick:60,start:0},rockets:{max:30,pick:6,start:0},slugs:{max:30,pick:6,start:0}};
export const GIVE={sg:{shells:12},ssg:{shells:10},cg:{bullets:120},pg:{cells:100},rl:{rockets:10},rg:{slugs:10}};

/* ================= viewmodels ================= */
const box=(w,h,d,m,x=0,y=0,z=0,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);p&&p.add(o);return o;};
const cyl=(r,l,m,x=0,y=0,z=0,p,seg=14,r2)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r2??r,l,seg),m);o.rotation.x=Math.PI/2;o.position.set(x,y,z);p&&p.add(o);return o;};
export function buildViewmodel(TX){const std=o=>new THREE.MeshStandardMaterial(o);
 const M={gun:std({color:0x5a5450,roughness:.3,metalness:.85}),dark:std({color:0x2a2a2e,roughness:.45,metalness:.7}),brass:std({color:0xb08a4a,roughness:.3,metalness:1}),wood:std({color:0x5a3018,roughness:.55,metalness:.1}),
  plate:std({color:0x6a5a4e,roughness:.3,metalness:.85}),glove:std({color:0x2c2622,roughness:.7,metalness:.3}),
  hot:std({color:0x220800,emissive:0xff5a10,emissiveIntensity:1}),cyan:std({color:0x0a2a3a,emissive:0x40d8ff,emissiveIntensity:.8,metalness:.6,roughness:.3}),green:std({color:0x021a08,emissive:0x40ff80,emissiveIntensity:1.3}),red:std({color:0x1a0200,emissive:0xff2a10,emissiveIntensity:1.4})};
 for(const k in M)M[k].envMapIntensity=.32;
 const root=new THREE.Group(),hold=new THREE.Group();hold.scale.setScalar(.62);root.add(hold);
 // armoured gauntlets
 const arm=(s)=>{const g=new THREE.Group();const fa=cyl(.055,.36,M.plate,0,0,.22,g,10,.07);const cuff=cyl(.075,.08,M.hot,0,0,.06,g,10);cuff.scale.set(1,1,.5);box(.1,.075,.13,M.glove,0,0,-.03,g);box(.11,.03,.1,M.plate,0,.045,-.02,g);box(.03,.03,.07,M.glove,s*.05,.015,-.06,g);for(let k=0;k<3;k++)box(.026,.024,.06,M.glove,-.03+k*.03,-.02,-.1,g);return g;};
 const armL=arm(-1),armR=arm(1);hold.add(armL,armR);
 const flashMat=new THREE.MeshBasicMaterial({map:TX.flash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,color:new THREE.Color(3,2.2,1.4)});
 const models={};
 function make(id){const g=new THREE.Group(),P={muzzle:new V(0,0,-.6),hands:[new V(.0,-.06,.08),new V(0,-.06,-.25)],parts:{}};
  if(id==='sg'){box(.07,.09,.42,M.gun,0,0,-.05,g);cyl(.022,.48,M.dark,0,.025,-.42,g);cyl(.019,.42,M.dark,0,-.018,-.38,g);P.parts.pump=box(.075,.06,.18,M.wood,0,-.03,-.34,g);box(.06,.1,.22,M.wood,0,-.03,.24,g);
   for(let k=0;k<4;k++){const sh=cyl(.012,.04,k<4?M.hot:M.dark,.04,-.02,-.12+k*.045,g,8);sh.rotation.z=Math.PI/2;sh.rotation.x=0;P.parts['sh'+k]=sh;}box(.01,.02,.03,M.brass,0,.055,-.62,g);P.muzzle.set(0,.025,-.68);P.hands=[new V(0,-.07,.12),new V(0,-.06,-.34)];}
  else if(id==='ssg'){const br=new THREE.Group();br.position.set(0,0,-.06);g.add(br);cyl(.026,.5,M.gun,-.027,.02,-.28,br);cyl(.026,.5,M.gun,.027,.02,-.28,br);box(.1,.03,.42,M.dark,0,-.012,-.26,br);box(.11,.05,.06,M.brass,0,.02,-.02,br);
   const ring=cyl(.012,.004,M.hot,-.027,.02,-.535,br);const ring2=cyl(.012,.004,M.hot,.027,.02,-.535,br);P.parts.br=br;box(.09,.1,.14,M.gun,0,-.01,.03,g);box(.07,.12,.24,M.wood,0,-.05,.2,g).rotation.x=.25;box(.03,.02,.05,M.brass,0,-.065,.03,g);P.muzzle.set(0,.02,-.62);P.hands=[new V(0,-.08,.1),new V(0,-.04,-.28)];}
  else if(id==='cg'){const rot=new THREE.Group();rot.position.set(0,.01,-.3);g.add(rot);for(let k=0;k<4;k++){const a=k/4*Math.PI*2;cyl(.017,.52,M.dark,Math.cos(a)*.04,Math.sin(a)*.04,-.05,rot,8);}cyl(.07,.04,M.gun,0,0,-.28,rot,12);cyl(.07,.04,M.gun,0,0,.15,rot,12);P.parts.rot=rot;
   box(.13,.13,.3,M.gun,0,0,.08,g);const hc=cyl(.03,.16,M.hot,.068,.0,.05,g,10);box(.06,.08,.14,M.dark,.0,-.11,.08,g);box(.05,.18,.05,M.plate,0,-.16,.2,g).rotation.x=-.3;for(let k=0;k<5;k++)box(.02,.03,.03,M.brass,.075,-.05+k*.0,.12-k*.035,g);
   P.muzzle.set(0,.01,-.62);P.hands=[new V(0,-.13,.2),new V(-.03,-.07,-.12)];}
  else if(id==='pg'){box(.1,.11,.36,M.gun,0,0,0,g);for(let k=0;k<3;k++){const c=new THREE.Mesh(new THREE.TorusGeometry(.065,.016,8,18),M.cyan);c.position.set(0,.0,-.2-k*.07);g.add(c);P.parts['coil'+k]=c;}cyl(.03,.32,M.dark,0,0,-.33,g);box(.018,.02,.22,M.cyan,0,.062,-.02,g);box(.06,.14,.08,M.dark,0,-.1,.08,g).rotation.x=-.2;const cell=box(.06,.06,.12,M.cyan,.07,-.01,.08,g);P.parts.cell=cell;
   P.muzzle.set(0,0,-.52);P.hands=[new V(0,-.13,.1),new V(0,-.08,-.18)];}
  else if(id==='rl'){cyl(.07,.62,M.gun,0,.02,-.12,g,16);cyl(.078,.08,M.dark,0,.02,-.43,g,16);cyl(.075,.1,M.dark,0,.02,.2,g,16);const tip=new THREE.Mesh(new THREE.ConeGeometry(.045,.1,10),M.red);tip.rotation.x=-Math.PI/2;tip.position.set(0,.02,-.43);g.add(tip);P.parts.tip=tip;
   box(.05,.16,.08,M.dark,0,-.1,.0,g).rotation.x=-.25;box(.012,.03,.2,M.hot,.072,.03,-.1,g);box(.11,.04,.06,M.brass,0,.1,-.25,g);P.muzzle.set(0,.02,-.5);P.hands=[new V(0,-.1,.02),new V(0,-.05,-.3)];}
  else if(id==='rg'){box(.08,.1,.38,M.gun,0,0,.04,g);for(const s of[-1,1]){box(.016,.05,.62,M.dark,s*.045,.01,-.36,g);box(.006,.02,.58,M.green,s*.03,.01,-.36,g);}cyl(.024,.6,M.plate,0,-.01,-.36,g,10);box(.06,.14,.08,M.dark,0,-.1,.12,g).rotation.x=-.2;
   const core=box(.022,.02,.14,M.green,0,.058,.02,g);P.parts.core=core;P.muzzle.set(0,0,-.7);P.hands=[new V(0,-.11,.14),new V(0,-.04,-.3)];}
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(.34,.34),flashMat.clone());fl.position.copy(P.muzzle);fl.visible=false;g.add(fl);const fl2=fl.clone();fl2.rotation.y=Math.PI/2;g.add(fl2);P.flash=[fl,fl2];
  g.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});g.visible=false;hold.add(g);return{g,P};}
 for(const id of['sg','ssg','cg','pg','rl','rg'])models[id]=make(id);
 let cur=null,curId=null,kick=0,swX=0,swY=0,bobT=0,sw=0,swDir=0,flashT=0,spin=0,spinV=0,lastShot=-9,punchT=0,glory=0,inspect=0,rel=0;
 const base=new V(.21,-.2,-.44);
 function setArms(P){// forearm points back from the hand anchor toward the camera edges
  const place=(a,h,side)=>{a.position.copy(h);const tgt=new V(side*.2,-.62,.3);const dir=tgt.sub(h).normalize();a.lookAt(a.position.clone().add(dir));};
  place(armR,P.hands[0],1);place(armL,P.hands[1],-1);}
 return{root,M,
  set(id){if(curId===id)return;if(cur)cur.g.visible=false;curId=id;cur=models[id];cur.g.visible=true;setArms(cur.P);sw=1;swDir=-1;},
  get id(){return curId;},
  fire(k=1,t=0){kick=Math.min(2.2,kick+k);flashT=.05;lastShot=t;for(const f of cur.P.flash){f.visible=true;f.rotation.z=R()*6;f.scale.setScalar(.8+R()*.6*k);}},
  spinUp(v){spinV=v;},
  punch(g){punchT=.32;glory=g?1:0;},
  update(o){const dt=o.dt;kick=Math.max(0,kick-dt*(curId==='cg'?14:7));flashT-=dt;if(flashT<=0&&cur)for(const f of cur.P.flash)f.visible=false;
   swX+=(cl(-o.mdx*.0009,-.05,.05)-swX)*Math.min(1,dt*10);swY+=(cl(o.mdy*.0009,-.05,.05)-swY)*Math.min(1,dt*10);
   const spd=o.onGround?Math.min(1,o.speed/9):0;bobT+=dt*(4+o.speed*.7);const bx=Math.sin(bobT)*.012*spd,by=-Math.abs(Math.cos(bobT))*.012*spd;
   if(sw>0){sw=Math.max(0,sw-dt*7);}const swk=sw*sw;
   punchT=Math.max(0,punchT-dt);const pk=punchT>0?Math.sin((1-punchT/.32)*Math.PI):0;
   hold.position.set(base.x+bx+swX,base.y+by+swY-swk*.3-(o.airborne?.015:0)+(o.vy?cl(-o.vy*.002,-.03,.03):0),base.z+kick*.05);hold.rotation.set(kick*.16-swk*.8+.03,swX*2+.03,o.strafe*.04+swX*.6);
   // left arm punch for melee / glory kills
   armL.visible=pk>0;if(pk>0){armL.position.set(-.12+pk*.08,-.05+pk*.06,-.05-pk*.4);armL.rotation.set(0,0,0);}else if(cur)setArms(cur.P);
   if(!cur)return;const P=cur.P;
   if(curId==='cg'){spin+=(spinV-spin)*Math.min(1,dt*(spinV>spin?5:2));P.parts.rot.rotation.z+=spin*dt*40;}
   if(curId==='sg'){const t=o.t-lastShot;const pk2=t>.12&&t<.5?Math.sin((t-.12)/.38*Math.PI):0;P.parts.pump.position.z=-.34+pk2*.1;for(let k=0;k<4;k++)P.parts['sh'+k].material=k<o.ammoFrac*4?M.hot:M.dark;}
   if(curId==='ssg'){const t=o.t-lastShot;const br=t>.15&&t<1.0?Math.sin((t-.15)/.85*Math.PI):0;P.parts.br.rotation.x=br*.7;hold.rotation.x+=br*.25;}
   if(curId==='pg'){for(let k=0;k<3;k++)P.parts['coil'+k].rotation.z+=dt*(3+k);M.cyan.emissiveIntensity=.7+Math.sin(o.t*8)*.2+(o.t-lastShot<.1?.8:0);}
   if(curId==='rg'){const t=o.t-lastShot;M.green.emissiveIntensity=t<1.3?.2+t*.9:1.4+Math.sin(o.t*6)*.25;}
   if(curId==='rl'){const t=o.t-lastShot;P.parts.tip.visible=t>.45;}
   root.visible=o.visible;}};}

/* ================= projectiles ================= */
const PK={
 rocket:{r:.12,speed:34,life:5,geo:()=>{const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.42,10),new THREE.MeshStandardMaterial({color:0x3a3634,metalness:.8,roughness:.4}));b.rotation.x=Math.PI/2;g.add(b);const t=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),new THREE.MeshBasicMaterial({color:new THREE.Color(4,1.6,.4)}));t.position.z=-.24;g.add(t);return g;}},
 plasma:{r:.15,speed:62,life:2,col:[.4,1.6,2.6],size:.26,halo:.15},
 fireball:{r:.28,speed:17,life:6,col:[4,1.5,.3],size:.55,grav:0},
 bolt:{r:.16,speed:27,life:4,col:[.8,4,1.4],size:.35},
 cannon:{r:.42,speed:15,life:6,col:[4,1.8,.4],size:.95,grav:3},
 meteor:{r:.6,speed:30,life:4,col:[4,1.4,.2],size:1.4}};
const spriteGeo=new THREE.SphereGeometry(1,12,10);
export class Projectiles{
 constructor(scene){this.scene=scene;this.list=[];this.mats={};}
 mat(kind){if(!this.mats[kind]){const c=PK[kind].col||[3,2,1];this.mats[kind]=new THREE.MeshBasicMaterial({color:new THREE.Color(...c)});}return this.mats[kind];}
 add(kind,owner,pos,vel,o={}){const k=PK[kind];let mesh;if(k.geo)mesh=k.geo();else{mesh=new THREE.Mesh(spriteGeo,this.mat(kind));mesh.scale.setScalar(k.size*.45);const halo=new THREE.Mesh(spriteGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(...k.col).multiplyScalar(k.halo??.3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.setScalar(1.9);mesh.add(halo);}
  mesh.position.copy(pos);this.scene.add(mesh);const p={kind,owner,pos:pos.clone(),vel:vel.clone(),mesh,t:0,life:k.life,r:k.r,dmg:o.dmg||10,splash:o.splash||0,sdmg:o.sdmg||0,src:o.src||null,grav:k.grav||0,col:k.col,quad:o.quad||1,target:o.target||null};
  if(kind==='rocket')mesh.lookAt(pos.clone().add(vel));this.list.push(p);return p;}
 // hit(p, kind:'world'|'monster'|'player', data) returns true to remove
 update(dt,L,fx,hitTest){for(let i=this.list.length-1;i>=0;i--){const p=this.list[i];p.t+=dt;if(p.t>p.life){this.kill(i);continue;}
   p.vel.y-=p.grav*dt;const sp=p.vel.length();const steps=Math.max(1,Math.ceil(sp*dt/.6));let dead=false;
   for(let s=0;s<steps&&!dead;s++){const h=dt/steps;const len=sp*h,dx=p.vel.x/sp,dy=p.vel.y/sp,dz=p.vel.z/sp;
    const o=L.ray(p.pos.x,p.pos.y,p.pos.z,dx,dy,dz,len+p.r*.5,this._o||(this._o={}));
    const hit=hitTest(p,dx,dy,dz,Math.min(len,o.t));if(hit){p.pos.addScaledVector(p.vel,h*Math.min(1,hit.t/len));dead=hit.done!==false;if(dead)break;}
    if(o.t<=len+p.r*.5){p.pos.addScaledVector(p.vel,Math.max(0,o.t-p.r*.4)/sp);p.hitN=new V(o.nx,o.ny,o.nz);p.hitCell=o.i;hitTest(p,0,0,0,0,'world');dead=true;break;}
    p.pos.addScaledVector(p.vel,h);if(p.pos.y<-40){dead=true;}}
   if(dead){this.kill(i);continue;}
   p.mesh.position.copy(p.pos);if(p.kind==='rocket'){p.mesh.lookAt(p.pos.clone().add(p.vel));if(R()<.9)fx.smoke.emit(p.pos.x-p.vel.x*.012,p.pos.y-p.vel.y*.012,p.pos.z-p.vel.z*.012,(R()-.5)*.4,(R()-.5)*.4+.2,(R()-.5)*.4,.55,.52,.5,.28,1.1,0,1.5,.9,.55);fx.sparks.emit(p.pos.x,p.pos.y,p.pos.z,(R()-.5)*2,(R()-.5)*2,(R()-.5)*2,4,1.6,.4,.16,.12,0,2);}
   else{const c=p.col;if(R()<(p.kind==='plasma'?.5:.95))fx.sparks.emit(p.pos.x+(R()-.5)*p.r,p.pos.y+(R()-.5)*p.r,p.pos.z+(R()-.5)*p.r,(R()-.5)*.6,(R()-.5)*.6+(p.kind==='fireball'||p.kind==='cannon'||p.kind==='meteor'?.8:0),(R()-.5)*.6,c[0]*.6,c[1]*.6,c[2]*.6,p.r*1.6,p.kind==='meteor'?.6:.3,0,1);
    p.mesh.scale.setScalar(PK[p.kind].size*.45*(1+Math.sin(p.t*30)*.08));}}}
 kill(i){const p=this.list[i];this.scene.remove(p.mesh);this.list.splice(i,1);}
 clear(){for(const p of this.list)this.scene.remove(p.mesh);this.list.length=0;}}
export const PROJ=PK;
