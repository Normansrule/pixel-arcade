// GLOSS RIOT — toon characters ("Gloopers"): an articulated rig with an ink-tank backpack whose fill shows the ink level,
// glossy team-colour hair, inverted-hull outlines, run / jump / aim / roll / flick / slam poses, and the swim form:
// a glossy ink blob that sinks into friendly paint. Also the three weapon models.
import * as THREE from '../vendor/three.module.min.js';
import {V,M4,merge,rbox,cap,cl} from './util.js';

const SKINS=[0xf3cfae,0xd9a77e,0xa86e4a,0xf6dcc4,0x7c4a32,0xe8b894];
const OUTFIT=[[0x2b2f3d,0xf2f2f2,0x3a3f52],[0xf4f1ea,0x2b2f3d,0xff6a7a],[0x3d3550,0xffd65a,0xeae6f2],[0x26404a,0xf0f0f0,0x2b2f3d],[0xece2d0,0x5a4a78,0x2b2f3d],[0x423038,0xf5f0e6,0x8fd0ff]];
let grad=null;function gradient(){if(grad)return grad;grad=new THREE.DataTexture(new Uint8Array([70,150,215,255]),4,1,THREE.RedFormat);grad.minFilter=grad.magFilter=THREE.NearestFilter;grad.needsUpdate=true;return grad;}
export const outlineMat=new THREE.MeshBasicMaterial({color:0x1d1426,side:THREE.BackSide});
outlineMat.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed+=normal*.018;');};
export const toonMat=()=>new THREE.MeshToonMaterial({vertexColors:true,gradientMap:gradient()});
export function inkMat(col){return new THREE.MeshStandardMaterial({color:col,roughness:.12,metalness:0,emissive:col,emissiveIntensity:.12});}

const RB=(w,h,d,x,y,z,c,r=.04,rx=0,ry=0,rz=0)=>[rbox(w,h,d,r,2),M4(x,y,z,rx,ry,rz),c];
const CP=(r,len,x,y,z,c,rx=0,rz=0)=>[cap(r,len,10),M4(x,y,z,rx,0,rz),c];
const SP=(r,x,y,z,c,sx=1,sy=1,sz=1,ws=16,hs=12)=>[new THREE.SphereGeometry(r,ws,hs),M4(x,y,z,0,0,0,sx,sy,sz),c];
const CY=(r0,r1,h,x,y,z,c,seg=12,rx=0,rz=0)=>[new THREE.CylinderGeometry(r0,r1,h,seg),M4(x,y,z,rx,0,rz),c];
const piv=(p,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};

export class Glooper{
 constructor(team,col,seed,outline=true){this.root=new THREE.Group();this.human=new THREE.Group();this.root.add(this.human);this.outline=outline;this.mats=[];
  const tm=toonMat(),im=inkMat(col);this.ink=im;this.tm=tm;const sk=SKINS[seed%SKINS.length],[jk,sh,pt]=OUTFIT[(seed*7+team)%OUTFIT.length];
  const mesh=(p,parts,m=tm,o=true)=>{const g=merge(parts);const ms=new THREE.Mesh(g,m);ms.castShadow=true;p.add(ms);if(o&&this.outline){const ol=new THREE.Mesh(g,outlineMat);p.add(ol);}return ms;};
  const H=this.human,hips=piv(H,0,.6,0);this.hips=hips;
  mesh(hips,[RB(.3,.17,.21,0,0,0,pt,.06),RB(.32,.05,.22,0,.07,0,0x2a2a2a,.02)]);
  for(const s of[-1,1]){const th=piv(hips,s*.09,-.05,0);mesh(th,[CP(.07,.16,0,0,0,pt)]);const kn=piv(th,0,-.29,0);
   mesh(kn,[CP(.06,.14,0,0,0,sk),RB(.13,.1,.25,0,-.27,-.04,sh,.045),RB(.14,.035,.26,0,-.32,-.04,0x2a2a32,.015),RB(.135,.04,.08,0,-.24,-.1,col===0?0xffffff:0xffffff,.015)]);
   this[s<0?'thL':'thR']=th;this[s<0?'knL':'knR']=kn;}
  const sp=piv(hips,0,.06,0);this.spine=sp;
  mesh(sp,[RB(.34,.36,.23,0,.2,0,jk,.09),RB(.36,.08,.24,0,.37,0,jk,.04),RB(.02,.28,.02,0,.2,-.12,0x1a1a1a,.008),RB(.08,.07,.02,.09,.24,-.12,sh,.02),RB(.05,.36,.03,-.1,.22,.12,0x2b2b2b,.012),RB(.05,.36,.03,.1,.22,.12,0x2b2b2b,.012)]);
  // backpack ink tank: frame + glass + ink column (scaled by fill)
  const tank=piv(sp,0,.2,.2);mesh(tank,[CY(.12,.12,.04,0,.2,0,0x3a3f52,14),CY(.12,.12,.04,0,-.2,0,0x3a3f52,14),RB(.05,.42,.05,-.12,0,0,0x3a3f52,.02),RB(.05,.42,.05,.12,0,0,0x3a3f52,.02)]);
  const glass=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.36,16),new THREE.MeshStandardMaterial({color:0xdff4ff,roughness:.05,metalness:0,transparent:true,opacity:.35}));tank.add(glass);
  const inkCol=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.34,14).translate(0,.17,0),im);inkCol.position.y=-.17;tank.add(inkCol);this.inkCol=inkCol;
  const nk=piv(sp,0,.41,0);this.neck=nk;
  mesh(nk,[CY(.06,.07,.08,0,.03,0,sk),SP(.2,0,.22,0,sk,1,1,1.02,20,16),SP(.04,-.2,.22,0,sk,.6,1,1,8,6),SP(.04,.2,.22,0,sk,.6,1,1,8,6),
   RB(.34,.085,.06,0,.24,-.165,0x1d1426,.03),SP(.052,-.075,.245,-.19,0xffffff,1,1.25,.45,12,10),SP(.052,.075,.245,-.19,0xffffff,1,1.25,.45,12,10),SP(.028,-.07,.24,-.212,0x1a1a26,1,1.2,.4,8,6),SP(.028,.07,.24,-.212,0x1a1a26,1,1.2,.4,8,6),
   SP(.011,-.06,.255,-.222,0xffffff,1,1,.4,6,5),SP(.011,.08,.255,-.222,0xffffff,1,1,.4,6,5),RB(.06,.014,.02,0,.13,-.19,0xa04a4a,.006)]);
  // glossy ink hair: cap, swoop over the brow, two drip tails
  const hair=mesh(nk,[SP(.215,0,.27,.02,0,1.04,.8,1.08,20,14),[cap(.07,.14,10),M4(.08,.43,-.12,1.9,0,-.5),0],[cap(.065,.12,10),M4(-.1,.42,-.13,1.95,0,.6),0],[cap(.06,.2,10),M4(-.17,.26,.1,.25,0,.35),0],[cap(.06,.2,10),M4(.17,.26,.1,.25,0,-.35),0],
   SP(.065,-.2,.02,.16,0,1,1.2,1,10,8),SP(.065,.2,.02,.16,0,1,1.2,1,10,8)],im);
  for(const s of[-1,1]){const shd=piv(sp,s*.21,.33,0);mesh(shd,[SP(.075,0,0,0,jk,1,1,1,12,9),CP(.055,.13,0,-.02,0,jk)]);const el=piv(shd,0,-.22,0);
   mesh(el,[CP(.05,.12,0,0,0,sk),SP(.065,0,-.21,0,0xf4f4f4,1,1.05,1,10,8),CY(.06,.06,.05,0,-.15,0,col===0?0xffffff:0xf4f4f4,10)]);this[s<0?'shL':'shR']=shd;this[s<0?'elL':'elR']=el;}
  this.aim=piv(sp,.13,.28,-.06);this.aim.rotation.order='YXZ';this.held=null;
  // swim form: glossy blob with eyes + tail fin
  const blob=new THREE.Group();this.root.add(blob);blob.visible=false;this.blob=blob;
  const bm=new THREE.Mesh(new THREE.SphereGeometry(.34,24,16).scale(1,.62,1.35),im);bm.position.y=.2;bm.castShadow=true;blob.add(bm);this.blobBody=bm;
  const bf=new THREE.Mesh(merge([SP(.06,-.1,.29,-.32,0xffffff,1,1.2,.6,10,8),SP(.06,.1,.29,-.32,0xffffff,1,1.2,.6,10,8),SP(.03,-.1,.29,-.37,0x1a1a26,1,1.2,.5,8,6),SP(.03,.1,.29,-.37,0x1a1a26,1,1.2,.5,8,6)]),tm);blob.add(bf);
  const fin=new THREE.Mesh(new THREE.ConeGeometry(.16,.4,4).rotateX(-Math.PI/2).scale(1.6,.35,1),im);fin.position.set(0,.2,.5);blob.add(fin);this.fin=fin;
  if(this.outline){const ol=new THREE.Mesh(bm.geometry,outlineMat);ol.position.y=.2;blob.add(ol);}
  this.ph=0;this.sq=0;this.form=0;this.die=0;this.flick=0;this.kick=0;this.swimT=0;}
 setColor(col){this.ink.color.set(col);this.ink.emissive.set(col);}
 hold(m){if(this.held)this.aim.remove(this.held);this.held=m;if(m)this.aim.add(m);}
 // st: {speed,lvx,lvz,ground,pitch,swim,sub,vy,fire,roll,flick,charge,ink,dead,slam,wpn}
 pose(st,dt,t){const sm=1-Math.exp(-dt*14),k=(a,b)=>a+(b-a)*sm;
  // morph between forms
  this.form+=((st.swim?1:0)-this.form)*Math.min(1,dt*16);const sw=this.form>.5;this.human.visible=!sw||st.dead;this.blob.visible=sw&&!st.dead;
  if(this.blob.visible){this.swimT+=dt*(2+st.speed*1.4);const sub=st.sub;const s=1+Math.sin(this.swimT)*.06;this.blob.scale.set(s,sub?.55:1,sub?1.15:1/s);this.blob.position.y=sub?-.17:0;this.fin.rotation.y=Math.sin(this.swimT*1.3)*.4;
   this.blob.rotation.x=cl(-st.vy*.05,-.6,.6);this.blobBody.material=this.ink;}
  if(st.dead){this.die=Math.min(1,this.die+dt*3);}else this.die=0;
  const run=cl(st.speed/6,0,1.3);if(st.ground)this.ph+=dt*(4+st.speed*1.9);
  const s=Math.sin(this.ph),c=Math.cos(this.ph);let thL=0,thR=0,knL=0,knR=0,lift=0,spX=0,spY=0,nkX=0,shLx=.1,shRx=.1,shLz=.1,shRz=-.1,elL=.3,elR=.3,bodyX=0;
  if(st.ground){thL=s*.8*run;thR=-s*.8*run;knL=-Math.max(0,c)*1.1*run-.05;knR=-Math.max(0,-c)*1.1*run-.05;lift=Math.abs(s)*.05*run;spX=.1*run;}
  else{thL=.6;thR=-.3;knL=-1;knR=-.4;}
  const p=st.pitch||0;
  if(st.wpn==='roller'){if(st.flick>0){const f=st.flick;const a=f<.4?-2.6*(f/.4):-2.6+3.8*((f-.4)/.6);shRx=shLx=-a;elR=elL=.2;spX=f>.4?.3:-.15;}
   else if(st.roll){shRx=shLx=.55;shRz=-.05;shLz=.05;elR=elL=.35;spX=.25;}else{shRx=.9;shLx=.75;elR=elL=.6;shLz=-.2;}}
  else{shRx=1.4+p;shRz=-.05;elR=.55;shLx=1.45+p;shLz=.55;elL=.6;spY=.22;spX=p*-.15;if(st.wpn==='charger'){shLx=1.55+p;shLz=.25;elL=.25;}}
  if(st.fire>0){shRx-=st.fire*.2;shLx-=st.fire*.15;}
  if(st.slam){thL=thR=.9;knL=knR=-1.6;shLx=shRx=2.8;shLz=.5;shRz=-.5;elL=elR=.2;spX=.4;}
  this.thL.rotation.x=k(this.thL.rotation.x,thL);this.thR.rotation.x=k(this.thR.rotation.x,thR);this.knL.rotation.x=k(this.knL.rotation.x,knL);this.knR.rotation.x=k(this.knR.rotation.x,knR);
  this.shL.rotation.x=k(this.shL.rotation.x,shLx);this.shR.rotation.x=k(this.shR.rotation.x,shRx);this.shL.rotation.z=k(this.shL.rotation.z,shLz);this.shR.rotation.z=k(this.shR.rotation.z,shRz);
  this.elL.rotation.x=k(this.elL.rotation.x,elL);this.elR.rotation.x=k(this.elR.rotation.x,elR);this.spine.rotation.x=k(this.spine.rotation.x,spX);this.spine.rotation.y=k(this.spine.rotation.y,spY);
  this.neck.rotation.x=k(this.neck.rotation.x,nkX-(st.wpn==='roller'?0:p*.45));this.neck.rotation.y=k(this.neck.rotation.y,-spY*.8);
  this.aim.rotation.y=-this.spine.rotation.y;this.aim.rotation.x=k(this.aim.rotation.x,(st.wpn==='roller'?(st.roll?-.62:st.flick>0?1.3-st.flick*2.1:-.4):p)-this.spine.rotation.x);
  if(st.wpn==='roller'){this.aim.position.set(0,.18,-.12);}else this.aim.position.set(.13,.28,-.06);
  this.kick=Math.max(0,this.kick-dt*8);if(this.held)this.held.position.z=this.kick*.06;
  this.hips.position.y=k(this.hips.position.y,.6+lift);this.sq=Math.max(0,this.sq-dt*4);const q=Math.sin(this.sq*Math.PI)*.18;
  const d=this.die;this.human.rotation.x=d*-1.3;this.human.position.y=-d*.3;this.root.scale.set((1+q*.5)*(1+d*.2),(1-q)*(1-d*.55),(1+q*.5)*(1+d*.2));
  this.inkCol.scale.y=Math.max(.02,st.ink/100);}
}

/* ---------------- weapons ---------------- */
// held models point down local -z; userData.muzzle is the nozzle in model space
export function weaponModel(id,col){const tm=toonMat(),im=inkMat(col);const g=new THREE.Group();const add=(parts,m=tm,o=true)=>{const gg=merge(parts);const ms=new THREE.Mesh(gg,m);ms.castShadow=true;g.add(ms);if(o){g.add(new THREE.Mesh(gg,outlineMat));}return ms;};
 if(id==='splatter'){add([RB(.11,.13,.34,0,0,-.08,0xf2f2f2,.04),RB(.07,.15,.08,0,-.11,.02,0x3a3f52,.025,-.25),CY(.035,.045,.22,0,.015,-.33,0x3a3f52,10,Math.PI/2),RB(.05,.03,.12,0,.08,-.1,0x3a3f52,.012)]);
  add([SP(.07,0,.1,.03,0,1,1,1,14,10),CY(.04,.04,.12,0,.04,-.24,0,10,Math.PI/2)],im,false);g.userData.muzzle=new V(0,.015,-.46);}
 else if(id==='charger'){add([RB(.08,.11,.62,0,0,-.18,0xf2f2f2,.035),CY(.025,.03,.5,0,.02,-.72,0x2b2f3d,10,Math.PI/2),RB(.06,.14,.07,0,-.1,.04,0x3a3f52,.02,-.3),CY(.035,.035,.2,0,.1,-.18,0x2b2f3d,10,Math.PI/2),RB(.07,.06,.18,0,-.02,.18,0x3a3f52,.02)]);
  add([CY(.04,.04,.24,0,0,.0,0,10,Math.PI/2),SP(.035,0,.1,-.3,0,1,1,1,10,8)],im,false);g.userData.muzzle=new V(0,.02,-.98);}
 else{// roller: handle + wide drum on a frame, drum faces forward on the floor
  add([CY(.025,.025,.95,0,0,-.42,0x3a3f52,8,Math.PI/2),RB(.06,.06,.16,0,0,.06,0x2b2f3d,.02),RB(.9,.05,.05,0,-.04,-.88,0x3a3f52,.02),RB(.05,.12,.05,-.43,-.1,-.88,0x3a3f52,.02),RB(.05,.12,.05,.43,-.1,-.88,0x3a3f52,.02)]);
  const drum=add([CY(.13,.13,.82,0,0,0,0xf4f4f4,18,0,Math.PI/2)]);drum.position.set(0,-.19,-.92);g.children[g.children.length-1].position.copy(drum.position);
  const band=add([CY(.135,.135,.7,0,0,0,0,18,0,Math.PI/2)],im,false);band.position.copy(drum.position);g.userData.drum=[drum,band];g.userData.muzzle=new V(0,-.2,-.95);}
 return g;}
