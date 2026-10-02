// STORM ROYALE — procedural characters (articulated rig with run / strafe / jump / skydive / glide / emote / death poses),
// gliders and the Sky Barge drop airship.
import * as THREE from '../vendor/three.module.min.js';
import {V,M,merge,cl,lerp} from './util.js';
import {gunMesh,pickaxeMesh,healMesh,MUZZLE} from './items.js';

export const OUTFITS=[
 {skin:0xf2c7a0,hair:0x3a2416,top:0xff6a1a,bot:0x2a3040,acc:0xffd24a,shoe:0x1e1e22,glide:[0xff6a1a,0xfff1d0]},
 {skin:0xc98e62,hair:0x15110e,top:0x3a7bd5,bot:0xe8e0d0,acc:0xff4d6d,shoe:0xffffff,glide:[0x3a7bd5,0xffffff]},
 {skin:0xf5d2b4,hair:0xe8c070,top:0x58c46a,bot:0x37474f,acc:0xfff176,shoe:0x5d4037,glide:[0x58c46a,0x204030]},
 {skin:0x8d5a3c,hair:0x1a1a1a,top:0xb04cff,bot:0x22202e,acc:0x40e0d0,shoe:0x40e0d0,glide:[0xb04cff,0x40e0d0]},
 {skin:0xe8b48c,hair:0xc0392b,top:0xf5f5f5,bot:0x2e86c1,acc:0xe74c3c,shoe:0xe74c3c,glide:[0xe74c3c,0xf5f5f5]},
 {skin:0xd9a37a,hair:0x6d4c41,top:0xffc93c,bot:0x4e342e,acc:0x2b2b2b,shoe:0x2b2b2b,glide:[0xffc93c,0x2b2b2b]},
 {skin:0xf1c27d,hair:0x0d47a1,top:0x263238,bot:0x455a64,acc:0x00e5ff,shoe:0x00e5ff,glide:[0x00e5ff,0x263238]},
 {skin:0xa66b4a,hair:0x2d1b10,top:0xe91e63,bot:0x1b1b2f,acc:0xffeb3b,shoe:0xffffff,glide:[0xe91e63,0xffeb3b]},
 {skin:0xffd7b5,hair:0xf5f5f5,top:0x2e7d32,bot:0x8d6e63,acc:0xff8f00,shoe:0x3e2723,glide:[0xff8f00,0x2e7d32]},
 {skin:0x7a4a32,hair:0xff7043,top:0x5c6bc0,bot:0xffffff,acc:0xff7043,shoe:0x5c6bc0,glide:[0x5c6bc0,0xff7043]}];
export const EMOTES=['GROOVE','JUMPING JACKS','ROBOT'];

const B=(w,h,d,x,y,z,c,rx=0,ry=0,rz=0)=>[new THREE.BoxGeometry(w,h,d),M(x,y,z,rx,ry,rz),c];
const S=(r,x,y,z,c,sx=1,sy=1,sz=1)=>[new THREE.SphereGeometry(r,12,9),M(x,y,z,0,0,0,sx,sy,sz),c];
const CY=(r0,r1,h,x,y,z,c,seg=8)=>[new THREE.CylinderGeometry(r0,r1,h,seg),M(x,y,z),c];
const piv=(parent,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};
const mesh=(parent,parts,mat)=>{const m=new THREE.Mesh(merge(parts),mat);m.castShadow=true;parent.add(m);return m;};

export function makeRig(o,mat){const root=new THREE.Group(),body=piv(root,0,0,0),hips=piv(body,0,.93,0);const r={root,body,hips,o,mat};
 mesh(hips,[B(.38,.2,.24,0,0,0,o.bot),B(.4,.06,.26,0,.1,0,0x2a2a2a),B(.08,.07,.03,0,.1,.14,o.acc)],mat);
 for(const s of[-1,1]){const th=piv(hips,s*.11,-.06,0);mesh(th,[B(.16,.44,.18,0,-.21,0,o.bot)],mat);const kn=piv(th,0,-.42,0);mesh(kn,[B(.14,.42,.16,0,-.2,0,o.bot),B(.16,.1,.28,0,-.43,.05,o.shoe),B(.15,.05,.16,0,-.1,.0,o.acc)],mat);r[s<0?'thR':'thL']=th;r[s<0?'knR':'knL']=kn;}
 const sp=piv(hips,0,.08,0);r.spine=sp;mesh(sp,[B(.44,.5,.26,0,.26,0,o.top),B(.46,.08,.28,0,.5,0,o.top),B(.3,.38,.16,0,.28,-.2,o.acc),B(.26,.3,.04,0,.3,.14,o.acc),B(.5,.05,.28,0,.04,0,o.bot)],mat);
 const nk=piv(sp,0,.54,0);r.neck=nk;mesh(nk,[CY(.07,.08,.1,0,.04,0,o.skin),S(.21,0,.24,.01,o.skin,1,1.05,1),S(.22,0,.31,-.02,o.hair,1.02,.75,1.04),B(.05,.05,.03,-.075,.25,.19,0x1a1a22),B(.05,.05,.03,.075,.25,.19,0x1a1a22),B(.03,.04,.04,0,.2,.21,o.skin)],mat);
 for(const s of[-1,1]){const sh=piv(sp,s*.28,.45,0);mesh(sh,[S(.1,0,0,0,o.top),B(.12,.32,.13,0,-.17,0,o.top)],mat);const el=piv(sh,0,-.33,0);mesh(el,[B(.11,.28,.12,0,-.14,0,o.skin),B(.13,.08,.14,0,-.02,0,o.acc),S(.07,0,-.31,0,0x2b2b2b)],mat);r[s<0?'shR':'shL']=sh;r[s<0?'elR':'elL']=el;}
 // held items: gun on an aim pivot at the right shoulder, pickaxe in right hand
 r.aim=piv(sp,-.17,.38,.12);r.aim.rotation.order='YXZ';r.handR=piv(r.elR,0,-.31,0);r.held=null;r.heldKey='';
 // glider
 const gl=new THREE.Group();gl.position.y=2.5;root.add(gl);gl.visible=false;r.glider=gl;
 {const g=new THREE.CylinderGeometry(2.4,2.4,1.5,18,1,true,-.95,1.9).toNonIndexed();g.rotateX(-Math.PI/2);const p=g.attributes.position,col=new Float32Array(p.count*3),a=new THREE.Color(o.glide[0]),b=new THREE.Color(o.glide[1]);
  for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,c=(Math.floor((x+2.4)/.56)%2)?a:b;for(let j=0;j<3;j++){col[(i+j)*3]=c.r;col[(i+j)*3+1]=c.g;col[(i+j)*3+2]=c.b;}}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));g.translate(0,-1.75,0);g.computeVertexNormals();const cm=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,side:THREE.DoubleSide}));cm.castShadow=true;gl.add(cm);
  const tip=2.4*Math.sin(.95),ty=2.4*Math.cos(.95)-1.75;const lines=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new V(-tip,ty,0),new V(-.28,-.35,.1),new V(tip,ty,0),new V(.28,-.35,.1),new V(-1.2,.45,0),new V(-.28,-.35,.1),new V(1.2,.45,0),new V(.28,-.35,.1)]),new THREE.LineBasicMaterial({color:0x222222}));gl.add(lines);}
 r.ph=0;r.sq=0;r.emT=0;r.die=0;r.lean=0;r.tw=0;return r;}

export function hold(r,kind,item){const key=kind+(item?item.t+item.r:'');if(r.heldKey===key)return;r.heldKey=key;if(r.held){r.held.parent.remove(r.held);r.held=null;}
 if(kind==='gun'){const g=gunMesh(item.t,item.r,r.mat);r.aim.add(g);r.held=g;r.muz=new V(0,.08,MUZZLE[item.t]);}
 else if(kind==='pick'){const p=pickaxeMesh(r.mat);p.rotation.set(Math.PI/2,0,0);p.position.set(0,0,.05);r.handR.add(p);r.held=p;}
 else if(kind==='heal'){const h=healMesh(item.t,r.mat);h.position.set(.16,-.05,.32);r.aim.add(h);r.held=h;}}
export function muzzleWorld(r,out){if(r.held&&r.muz){r.held.updateWorldMatrix(true,false);return out.copy(r.muz).applyMatrix4(r.held.matrixWorld);}return r.aim.getWorldPosition(out);}

const k=(a,b,t)=>a+(b-a)*t;
// st: {mode,speed,lvx,lvz,ground,pitch,hold,swing,fire,emote,dead,vy,build}
export function animRig(r,st,dt,time){const sm=1-Math.exp(-dt*14),sm2=1-Math.exp(-dt*8);const run=cl(st.speed/6.5,0,1.4);
 // targets
 let thL=0,thR=0,knL=0,knR=0,shLx=0,shLz=.12,shRx=0,shRz=-.12,elL=-.15,elR=-.15,spX=0,spY=0,nkX=0,bodyX=0,bodyY=0,bodyZ=0,hipY=0,lift=0;
 if(st.dead){r.die=Math.min(1,r.die+dt*2.2);const d=r.die;bodyX=-1.45*d*d;lift=-.0;thL=thR=-.3*d;knL=knR=.4*d;shLx=shRx=-2.6*d;elL=elR=-.4;r.glider.visible=false;}
 else if(st.mode==='fall'){bodyX=1.25;thL=thR=.35;knL=knR=.7;shLx=shRx=-.5;shLz=1.25;shRz=-1.25;elL=elR=-.3;nkX=-.9;const w=Math.sin(time*9)*.08;shLz+=w;shRz-=w;thL+=w;thR-=w;r.glider.visible=false;}
 else if(st.mode==='glide'){r.glider.visible=true;shLx=shRx=-2.9;shLz=.35;shRz=-.35;elL=elR=-.2;thL=.25+Math.sin(time*3)*.12;thR=.25-Math.sin(time*3)*.12;knL=knR=.4;bodyX=.08;lift=.0;r.glider.rotation.z=cl(-st.turn*.5,-.4,.4);r.glider.rotation.x=-.12;}
 else if(st.mode==='bus'){r.glider.visible=false;}
 else{r.glider.visible=false;
  if(st.ground){r.ph+=dt*(4+st.speed*1.65);}
  const fwdv=st.lvz,side=st.lvx;let hy=0;if(st.speed>.5){hy=cl(Math.atan2(side,Math.abs(fwdv)+.01),-1.1,1.1)*(fwdv<-.3?-1:1);}
  hipY=hy*.8;const dirS=fwdv<-.3?-1:1,s=Math.sin(r.ph)*dirS,c=Math.cos(r.ph);
  if(st.ground){thL=s*.75*run;thR=-s*.75*run;knL=Math.max(0,-c)*1.1*run+.05;knR=Math.max(0,c)*1.1*run+.05;lift=Math.abs(Math.sin(r.ph))*.06*run;spX=.12*run;}
  else{thL=-.5;thR=.35;knL=.9;knR=.3;if(st.vy<-2){thL=-.2;thR=.1;knL=knR=.5;}}
  shLx=-s*.6*run;shRx=s*.6*run;elL=elR=-.3-.4*run;
  // upper body: weapon / tool poses
  const p=st.pitch||0;
  if(st.hold==='gun'){shRx=-1.35-p;shRz=.1;elR=-.75;shLx=-1.5-p;shLz=-.62;elL=-.5;spY=-.25;nkX=0;spX=-p*.25;}
  else if(st.hold==='pick'){const sw=st.swing;const a=sw>0?(sw<.35?k(-.9,-2.9,sw/.35):k(-2.9,-.4,(sw-.35)/.65)):-.6;shRx=a-p*.3;shRz=-.2;elR=sw>0?-.5:-.9;spX=sw>0&&sw>.35?.18:0;shLx=-.4;elL=-.6;}
  else if(st.hold==='heal'){shRx=-1.1;shLx=-1.1;shRz=.35;shLz=-.35;elR=elL=-1.2;}
  else if(st.hold==='build'){shRx=-1.25-p*.5;elR=-.3;shRz=-.1;}
  if(st.fire>0){shRx+=st.fire*.25;shLx+=st.fire*.2;spX-=st.fire*.08;}
  if(st.emote>=0){r.emT+=dt;const t=r.emT;hipY=0;
   if(st.emote===0){const b=Math.sin(t*7);lift=Math.abs(b)*.08;bodyZ=b*.12;spY=Math.sin(t*3.5)*.4;shRx=Math.sin(t*7)>0?-2.8:-.4;shLx=Math.sin(t*7)>0?-.4:-2.8;shRz=-.4;shLz=.4;elR=elL=-.3;thL=Math.max(0,b)*.5;thR=Math.max(0,-b)*.5;knL=thL*1.4;knR=thR*1.4;nkX=Math.sin(t*14)*.12;}
   else if(st.emote===1){const b=Math.abs(Math.sin(t*5));lift=b*.45;shLz=.2+b*2.6;shRz=-.2-b*2.6;shLx=shRx=0;elL=elR=-.1;thL=-b*.0;r.thL.rotation.z=b*.35;r.thR.rotation.z=-b*.35;knL=knR=.15;}
   else{const q=Math.floor(t*4);const R=x=>Math.sin(q*12.9898+x)*43758.5453%1;shRx=-1.57*(q%2);elR=-1.57*((q>>1)%2);shLx=-1.57*((q+1)%2);elL=-1.57*((q>>2)%2);spY=(q%3-1)*.4;nkX=(q%2)*.2;lift=(q%2)*.03;}}
  else{r.emT=0;}
  if(st.emote!==1){r.thL.rotation.z=k(r.thL.rotation.z,0,sm);r.thR.rotation.z=k(r.thR.rotation.z,0,sm);}
  r.tw+=(hy-r.tw)*sm2;}
 // land squash
 r.sq=Math.max(0,r.sq-dt*4);const sq=Math.sin(r.sq*Math.PI)*.16;
 const R=r;R.thL.rotation.x=k(R.thL.rotation.x,-thL,sm);R.thR.rotation.x=k(R.thR.rotation.x,-thR,sm);R.knL.rotation.x=k(R.knL.rotation.x,knL,sm);R.knR.rotation.x=k(R.knR.rotation.x,knR,sm);
 R.shL.rotation.x=k(R.shL.rotation.x,shLx,sm);R.shR.rotation.x=k(R.shR.rotation.x,shRx,sm);R.shL.rotation.z=k(R.shL.rotation.z,shLz,sm);R.shR.rotation.z=k(R.shR.rotation.z,shRz,sm);
 R.elL.rotation.x=k(R.elL.rotation.x,elL,sm);R.elR.rotation.x=k(R.elR.rotation.x,elR,sm);R.spine.rotation.x=k(R.spine.rotation.x,spX,sm);R.spine.rotation.y=k(R.spine.rotation.y,spY-R.tw*.6,sm);R.neck.rotation.x=k(R.neck.rotation.x,nkX-(st.hold==='gun'?(st.pitch||0)*.4:0),sm);
 R.hips.rotation.y=R.tw*.9;{const cy=-(R.hips.rotation.y+R.spine.rotation.y);R.aim.rotation.y=cy;R.neck.rotation.y=cy*.8;}R.aim.rotation.x=k(R.aim.rotation.x,-(st.pitch||0)-R.spine.rotation.x+(st.fire||0)*-.15,sm);
 R.body.rotation.x=k(R.body.rotation.x,bodyX,st.dead?1:sm2);R.body.rotation.z=k(R.body.rotation.z,bodyZ,sm);R.body.position.y=k(R.body.position.y,lift+(st.mode==='fall'?.9:0),sm);
 if(st.mode==='fall')R.body.position.z=k(R.body.position.z,-.6,sm);else R.body.position.z=k(R.body.position.z,0,sm);
 R.root.scale.set(1+sq*.5,1-sq,1+sq*.5);}

/* ---------------- the Sky Barge (drop airship) ---------------- */
export function makeBus(){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.1});
 const env=new THREE.SphereGeometry(1,40,20).toNonIndexed();env.scale(7,6.2,17);const p=env.attributes.position,col=new Float32Array(p.count*3),a=new THREE.Color(0xff6a1a),b=new THREE.Color(0xfff2dc),cc=new THREE.Color(0x2a6fd8);
 for(let i=0;i<p.count;i+=3){const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3,z=(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,an=Math.atan2(y,x);let c=(Math.floor((an+Math.PI)/(Math.PI/6))%2)?a:b;if(Math.abs(z)>14.5)c=cc;
  for(let j=0;j<3;j++){col[(i+j)*3]=c.r;col[(i+j)*3+1]=c.g;col[(i+j)*3+2]=c.b;}}env.setAttribute('color',new THREE.BufferAttribute(col,3));env.computeVertexNormals();
 const e=new THREE.Mesh(env,mat);e.position.y=6;e.castShadow=true;g.add(e);
 const parts=[B(4.6,2.4,10,0,-3,0,0xf4efe6),B(4.8,.35,10.2,0,-1.7,0,0x2a6fd8),B(4.8,.5,10.2,0,-4.25,0,0x6a4428),B(4.7,.9,1.6,0,-2.8,4.5,0x88c8ff),B(.1,.9,7,2.35,-2.8,-.6,0x26394d),B(.1,.9,7,-2.35,-2.8,-.6,0x26394d),
  B(1.4,.2,3.2,0,-5,0,0x444a52)];for(const s of[-1,1])for(const z of[-3.5,0,3.5])parts.push([new THREE.CylinderGeometry(.06,.06,4.6,4),M(s*2,-.2,z,0,0,s*.25),0x333333]);
 for(const s of[-1,1]){parts.push(B(.25,4.2,3.5,s*0,6+s*5.2,-15.5,0x2a6fd8,0,0,0));parts.push(B(4.4,.25,3.5,s*4.6,6,-15.5,0x2a6fd8));parts.push(B(1.8,.5,.5,s*3.2,-3,-4.6,0x555b63));}
 const body=new THREE.Mesh(merge(parts),mat);body.castShadow=true;g.add(body);
 g.userData.props=[];for(const s of[-1,1]){const pg=new THREE.Group();pg.position.set(s*4.1,-3,-5);const bl=new THREE.Mesh(merge([B(.25,3.2,.12,0,0,0,0x222222),B(3.2,.25,.12,0,0,0,0x222222),[new THREE.SphereGeometry(.35,8,6),null,0xffb12e]]),mat);pg.add(bl);g.add(pg);g.userData.props.push(bl);}
 const glow=new THREE.Mesh(new THREE.CircleGeometry(1.2,16),new THREE.MeshBasicMaterial({color:new THREE.Color(3,1.6,.6)}));glow.position.set(0,-3,-5.05);glow.rotation.y=Math.PI;g.add(glow);
 return g;}
