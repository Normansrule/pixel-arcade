// STARFALL VANGUARD — drivable vehicles: the JACKRABBIT all-terrain buggy (driver + turret gunner + passenger) and the
// BASTION hover tank (cannon + coaxial gun). Procedural models, arcade terrain physics (suspension, air time, slip, hover spring).
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,wrapA,merge,M4,ctex} from './util.js';

export const VSPEC={
 buggy:{name:'JACKRABBIT LRV',hp:650,r:1.9,max:27,acc:15,rev:8,turn:1.9,grip:5.5,mass:1,seats:[{k:'driver',p:[-.45,.95,-.15]},{k:'gunner',p:[0,1.75,1.55]},{k:'passenger',p:[.48,.95,-.15]}],cam:[8.5,2.6]},
 tank:{name:'BASTION HOVER TANK',hp:2400,r:3.1,max:15,acc:9,rev:8,turn:1.05,grip:3.2,mass:3,hover:1.15,seats:[{k:'driver',p:[0,1.9,0]}],cam:[13,4.2]}};

let MS=null;
function mats(){if(MS)return MS;const std=o=>new THREE.MeshStandardMaterial(o);
 const camo=ctex(256,256,(x,w,h)=>{x.fillStyle='#55603f';x.fillRect(0,0,w,h);for(let i=0;i<60;i++){x.fillStyle=['#3f4a2e','#6a7250','#48523a'][i%3];x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,10+Math.random()*30,6+Math.random()*16,Math.random()*3,0,7);x.fill();}
  x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;for(let i=0;i<5;i++){x.beginPath();x.moveTo(0,i*52+10);x.lineTo(w,i*52+10);x.stroke();}x.fillStyle='rgba(255,255,255,.7)';x.font='bold 22px "JetBrains Mono",monospace';x.fillText('VG-07',150,240);});
 const tread=ctex(128,32,(x,w,h)=>{x.fillStyle='#161616';x.fillRect(0,0,w,h);x.fillStyle='#2c2c2c';for(let i=0;i<w;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i+8,h/2);x.lineTo(i,h);x.lineTo(i+6,h);x.lineTo(i+14,h/2);x.lineTo(i+6,0);x.fill();}});tread.repeat.set(3,1);
 MS={paint:std({color:0xffffff,map:camo,roughness:.55,metalness:.35}),dark:std({color:0x1a1c1e,roughness:.6,metalness:.6}),steel:std({color:0x7a8088,roughness:.35,metalness:.9}),
  tire:std({color:0x222222,map:tread,roughness:.95,metalness:0}),hub:std({color:0x8a8f78,roughness:.4,metalness:.8}),seat:std({color:0x30302a,roughness:.9}),glass:std({color:0x203040,roughness:.05,metalness:1,transparent:true,opacity:.5}),
  glowB:new THREE.MeshBasicMaterial({color:new THREE.Color(.5,1.6,3.4)}),glowA:new THREE.MeshBasicMaterial({color:new THREE.Color(3,1.8,.5)}),glowR:new THREE.MeshBasicMaterial({color:new THREE.Color(3,.3,.2)})};return MS;}
function build(parts){const g=new THREE.Group(),by=new Map();for(const[geo,mat,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1]of parts){let a=by.get(mat);if(!a)by.set(mat,a=[]);a.push([geo,M4(x,y,z,rx,ry,rz,sx,sy,sz)]);}
 for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);o.castShadow=true;o.receiveShadow=true;g.add(o);}return g;}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Cy=(r,l,s=14,r2)=>new THREE.CylinderGeometry(r,r2??r,l,s);
const CyX=(r,l,s=14)=>{const g=Cy(r,l,s);g.rotateZ(Math.PI/2);return g;},CyZ=(r,l,s=12)=>{const g=Cy(r,l,s);g.rotateX(Math.PI/2);return g;};

export function buggyModel(){const M=mats(),root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const P=[[B(2.1,.5,4.2),M.paint,0,.85,0],[B(1.9,.35,1.4),M.paint,0,1.15,-1.55,-.15],[B(2.2,.12,1.2),M.paint,0,1.12,-1.75],[B(2.2,.25,.3),M.dark,0,.75,-2.2],[B(1.6,.18,.2),M.steel,0,.72,-2.38],
  [B(.5,.5,.6),M.seat,-.45,1.2,.1],[B(.5,.5,.6),M.seat,.48,1.2,.1],[B(.5,.7,.15),M.seat,-.45,1.5,.38],[B(.5,.7,.15),M.seat,.48,1.5,.38],[B(2,.35,1.6),M.paint,0,1.15,1.45],[B(2.25,.12,.9),M.paint,0,1.05,1.95],
  [Cy(.06,1.2),M.dark,-.95,1.6,-.6,0,0,0],[Cy(.06,1.2),M.dark,.95,1.6,-.6],[CyX(.06,1.9),M.dark,0,2.2,-.6],[Cy(.06,1.4),M.dark,-.95,1.7,.6,.2],[Cy(.06,1.4),M.dark,.95,1.7,.6,.2],[CyX(.06,1.9),M.dark,0,2.35,.75],
  [B(.08,.05,1.4),M.dark,-.95,2.3,.1],[B(.08,.05,1.4),M.dark,.95,2.3,.1],[B(.1,.5,.06),M.glass,-.45,1.75,-.75,-.3],[Cy(.12,.3),M.dark,0,1.35,1.55],
  [B(.32,.12,.06),M.glowA,-.75,1.0,-2.12],[B(.32,.12,.06),M.glowA,.75,1.0,-2.12],[B(.3,.1,.06),M.glowR,-.8,1.05,2.4],[B(.3,.1,.06),M.glowR,.8,1.05,2.4]];
 body.add(build(P));
 // steering wheel
 const sw=new THREE.Mesh(new THREE.TorusGeometry(.17,.025,6,16),M.dark);sw.position.set(-.45,1.55,-.45);sw.rotation.x=-1.1;body.add(sw);
 // turret: post + yaw ring + triple-barrel gun
 const tY=new THREE.Group();tY.position.set(0,1.55,1.55);body.add(tY);const tP=new THREE.Group();tP.position.y=.55;tY.add(tP);
 tY.add(build([[Cy(.22,.5),M.dark,0,.25,0],[B(1.0,.5,.08),M.steel,0,.75,-.45]]));tP.add(build([[B(.4,.36,.9),M.dark,0,0,-.2],[B(.1,.3,.5),M.paint,-.28,0,.0],[B(.1,.3,.5),M.paint,.28,0,0],[CyZ(.2,.12),M.steel,0,0,-.7]]));
 const spin=new THREE.Group();spin.position.set(0,0,-.75);tP.add(spin);spin.add(build([[CyZ(.05,1.1),M.steel,.09,0,-.55],[CyZ(.05,1.1),M.steel,-.09,0,-.55],[CyZ(.05,1.1),M.steel,0,.11,-.55],[CyZ(.16,.08),M.dark,0,.03,-1.05]]));
 // wheels
 const wheels=[];for(const[x,z]of[[-1.15,-1.45],[1.15,-1.45],[-1.15,1.45],[1.15,1.45]]){const w=new THREE.Group();w.position.set(x,.55,z);const t=build([[CyX(.55,.5,18),M.tire,0,0,0],[CyX(.3,.52,10),M.hub,0,0,0]]);w.add(t);root.add(w);wheels.push({g:w,t,x,z,y:.55});}
 const lights=[];return{root,body,tY,tP,spin,wheels,muzzle:new V(0,0,-1.9)};}

export function tankModel(){const M=mats(),root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const P=[[B(3.6,.9,6.2),M.paint,0,1.35,0],[B(3.0,.55,5.2),M.paint,0,2.0,.1],[B(3.8,.35,1.8),M.paint,0,1.25,-3.1,.35],[B(3.8,.35,1.4),M.paint,0,1.35,3.2,-.3],[B(.5,.6,5.6),M.dark,-2.05,1.3,0],[B(.5,.6,5.6),M.dark,2.05,1.3,0],
  [B(.4,.12,.06),M.glowA,-1.4,1.55,-3.85],[B(.4,.12,.06),M.glowA,1.4,1.55,-3.85],[B(1.2,.3,.6),M.dark,0,2.2,2.4],[B(.3,.15,.08),M.glowR,-1.5,1.6,3.9],[B(.3,.15,.08),M.glowR,1.5,1.6,3.9]];
 for(const[x,z]of[[-1.6,-2.2],[1.6,-2.2],[-1.6,2.2],[1.6,2.2]]){P.push([Cy(.75,.5,18),M.dark,x,.75,z],[Cy(.6,.08,18),M.glowB,x,.48,z]);}
 body.add(build(P));
 const tY=new THREE.Group();tY.position.set(0,2.3,.2);body.add(tY);tY.add(build([[Cy(1.4,.6,8),M.paint,0,.3,0],[B(2.2,.7,2.6),M.paint,0,.55,.2],[B(.6,.3,.5),M.dark,-.7,1.0,.8],[B(.08,.06,.6),M.glowB,.9,.7,-1.12],[B(.08,.06,.6),M.glowB,-.9,.7,-1.12]]));
 const tP=new THREE.Group();tP.position.set(0,.55,-1);tY.add(tP);tP.add(build([[CyZ(.2,4.2),M.steel,0,0,-2.1],[CyZ(.3,.9),M.dark,0,0,-.3],[CyZ(.26,.6),M.dark,0,0,-4.1],[CyZ(.07,1.2),M.dark,.6,-.15,-.4]]));
 return{root,body,tY,tP,wheels:[],muzzle:new V(0,0,-4.5),mg:new V(.6,-.15,-1.1)};}

export class Vehicle{
 constructor(kind,scene){this.kind=kind;this.S=VSPEC[kind];this.m=kind==='buggy'?buggyModel():tankModel();scene.add(this.m.root);this.pos=new V();this.vel=new V();this.yaw=0;this.pitch=0;this.roll=0;
  this.hp=this.S.hp;this.dead=false;this.air=0;this.vy=0;this.ground=true;this.seats={};this.tYaw=0;this.tPitch=0;this.spin=0;this.fireCD=0;this.mgCD=0;this.heat=0;this.boostT=0;this.engine=0;this.hitT=0;this.ph=0;this.grip=1;}
 place(x,y,z,yaw){this.pos.set(x,y,z);this.yaw=yaw;this.vel.set(0,0,0);this.vy=0;this.tYaw=yaw;this.ground=true;}
 fwd(o=new V()){return o.set(-Math.sin(this.yaw),0,-Math.cos(this.yaw));}
 // inp: {thr -1..1, steer -1..1, aimYaw (camera), aimPitch, handbrake}
 step(dt,inp,W){const S=this.S,f=this.fwd(new V()),rt=new V(Math.cos(this.yaw),0,-Math.sin(this.yaw));let vf=this.vel.dot(f),vs=this.vel.dot(rt);
  if(this.dead){inp={thr:0,steer:0};}
  if(this.kind==='buggy'){let steer=inp.steer||0;
   // Halo-style: throttle steers toward the camera heading
   if(inp.aimYaw!==undefined&&Math.abs(inp.thr)>.1&&!steer){const d=wrapA(inp.aimYaw-this.yaw);steer=cl(-d*1.8,-1,1);if(vf<0)steer=-steer;}
   if(this.ground){const acc=inp.thr>0?S.acc*inp.thr*(vf<0?1.8:1):inp.thr<0?(vf>1?-S.acc*1.6:-S.acc*.6):0;vf+=acc*dt;vf*=Math.exp(-(inp.thr?.15:.9)*dt);vf=cl(vf,-S.rev,S.max*(1+(this.boostT>0?.3:0)));
    const grip=inp.handbrake?1.2:S.grip;vs*=Math.exp(-grip*dt);const sp=Math.abs(vf);this.yaw-=steer*S.turn*cl(sp/6,0,1)*Math.sign(vf||1)*dt*(1-cl((sp-20)/30,0,.35));
    // gravity along slope
    const n=W.normal(this.pos.x,this.pos.z);vf+=(n.x*f.x+n.z*f.z)*14*dt;}
   this.slip=Math.abs(vs);this.steerV=damp(this.steerV||0,steer,8,dt);}
  else{// hover tank: WASD relative to camera, hull turns toward travel
   const ay=inp.aimYaw??this.yaw;const cf=new V(-Math.sin(ay),0,-Math.cos(ay)),cr=new V(Math.cos(ay),0,-Math.sin(ay));const want=new V().addScaledVector(cf,inp.thr||0).addScaledVector(cr,inp.steer||0);const wl=want.length();
   if(wl>.1){want.divideScalar(wl);let ty=Math.atan2(-want.x,-want.z);let dd=wrapA(ty-this.yaw);let rev=false;if(Math.abs(dd)>Math.PI*.6&&(inp.thr||0)<0){dd=wrapA(dd+Math.PI);rev=true;}this.yaw+=cl(dd,-S.turn*dt,S.turn*dt);
    const tgt=(rev?-S.rev:S.max)*Math.max(.25,Math.cos(Math.min(1.5,Math.abs(dd))));vf=damp(vf,tgt,S.acc/S.max*1.6,dt);}else vf=damp(vf,0,1.4,dt);vs*=Math.exp(-S.grip*dt);}
  this.vel.copy(f).multiplyScalar(vf).addScaledVector(rt,vs);
  const ox=this.pos.x,oz=this.pos.z;this.pos.x+=this.vel.x*dt;this.pos.z+=this.vel.z*dt;
  // obstacles
  const hit=W.pushOut(this.pos,S.r,this.pos.y,this.pos.y+2.5);if(hit){const vn=this.vel.x*hit.x+this.vel.z*hit.z;if(vn<0){this.vel.x-=hit.x*vn*1.3;this.vel.z-=hit.z*vn*1.3;this.impact=-vn;}}else this.impact=0;
  // cliffs: refuse to climb walls
  const h0=W.H(ox,oz),h1=W.H(this.pos.x,this.pos.z),dd=Math.hypot(this.pos.x-ox,this.pos.z-oz);const nS=W.normal(this.pos.x,this.pos.z);if(dd>1e-3&&((h1-h0)/dd>1.1&&h1>this.pos.y+.3||nS.y<.68&&h1>h0+.01)){this.pos.x=ox;this.pos.z=oz;const n=W.normal(ox,oz);const vn=this.vel.x*n.x+this.vel.z*n.z;if(vn<0){this.vel.x-=n.x*vn*1.4;this.vel.z-=n.z*vn*1.4;}this.impact=Math.max(this.impact,-vn);}
  const b=W.bounds;this.pos.x=cl(this.pos.x,b[0]+3,b[1]-3);this.pos.z=cl(this.pos.z,b[2]+3,b[3]-3);
  // vertical
  const gh=this._groundH(W);if(this.kind==='tank'){const tgt=gh+S.hover+Math.sin(this.ph+=dt*2)*.06;this.vy+=((tgt-this.pos.y)*18-this.vy*5)*dt;this.pos.y+=this.vy*dt;if(this.pos.y<gh+.3){this.pos.y=gh+.3;this.vy=Math.max(0,this.vy);}this.ground=true;}
  else{if(this.ground){if(gh<this.pos.y-.35&&vf>8){this.ground=false;this.vy=Math.max(this.vy,0);}else{this.vy=cl((gh-this.pos.y)/Math.max(dt,1e-3),-30,30);this.pos.y=gh;}}
   if(!this.ground){this.vy-=22*dt;this.pos.y+=this.vy*dt;this.air+=dt;if(this.pos.y<=gh){this.landV=-this.vy;this.pos.y=gh;this.vy=0;this.ground=true;this.air=0;}}}
  // orientation from terrain
  const n=W.normal(this.pos.x,this.pos.z),cy=Math.cos(this.yaw),sy=Math.sin(this.yaw);const tp=Math.atan2(-(n.x*-sy+n.z*-cy),n.y),tr=Math.atan2(n.x*cy-n.z*sy,n.y);
  if(this.ground){this.pitch=damp(this.pitch,cl(-tp,-.55,.55),8,dt);this.roll=damp(this.roll,cl(-tr,-.5,.5)+(this.kind==='buggy'?-(this.steerV||0)*Math.min(1,Math.abs(vf)/20)*.06:0),8,dt);}else{this.pitch=damp(this.pitch,-.08,1.5,dt);}
  this.speed=Math.abs(vf);this.vf=vf;this.boostT-=dt;this.fireCD-=dt;this.mgCD-=dt;this.heat=Math.max(0,this.heat-dt*.35);this.hitT-=dt;}
 _groundH(W){if(this.kind==='tank'){let m=-1e9;for(const[x,z]of[[-1.6,-2.4],[1.6,-2.4],[-1.6,2.4],[1.6,2.4],[0,0]]){const p=this.local(x,0,z);m=Math.max(m,W.H(p.x,p.z));}return m;}return W.H(this.pos.x,this.pos.z);}
 local(x,y,z,o=new V()){const cy=Math.cos(this.yaw),sy=Math.sin(this.yaw);return o.set(this.pos.x+x*cy+z*sy,this.pos.y+y,this.pos.z-x*sy+z*cy);}
 // world position of a seat
 seatPos(k,o=new V()){const s=this.S.seats.find(s=>s.k===k);const p=s.p;this.m.root.updateMatrixWorld(true);return o.set(p[0],p[1],p[2]).applyMatrix4(this.m.body.matrixWorld);}
 muzzleWorld(o=new V(),mg=false){this.m.root.updateMatrixWorld(true);return o.copy(mg?this.m.mg:this.m.muzzle).applyMatrix4(this.m.tP.matrixWorld);}
 visuals(dt,W){const m=this.m;m.root.position.copy(this.pos);m.root.rotation.set(0,this.yaw,0);m.body.rotation.set(this.pitch,0,this.roll,'YXZ');
  // turret aims (local)
  m.tY.rotation.y=wrapA(this.tYaw-this.yaw);m.tP.rotation.x=this.tPitch;if(m.spin){m.spin.rotation.z+=dt*this.spin;this.spin=Math.max(0,this.spin-dt*30);}
  for(const w of m.wheels){const p=this.local(w.x,0,w.z);const gh=W.H(p.x,p.z);const tilt=-w.z*Math.sin(this.pitch)+w.x*Math.sin(this.roll);const rel=cl(gh-this.pos.y-tilt,-.3,.3);w.y=damp(w.y,.55+tilt+(this.ground?rel:-.25),18,dt);w.g.position.y=w.y;w.t.rotation.x-=(this.vf||0)*dt/.55;if(w.z<0)w.g.rotation.y=-(this.steerV||0)*.45;}}
 dispose(scene){scene.remove(this.m.root);}
}
