// NIGHT DRIVE — car models (merged geometry: paint + glow) and arcade car physics with drift, handbrake, ramps, air time, collisions, damage.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v;

export const CARS=[
 {id:'cab',name:'CHECKER CAB',blurb:'The company car. Balanced, honest, yellow.',unlock:0,max:47,acc:15,brake:30,grip:7.5,drift:1.6,steer:2.2,dur:1,mass:1,paint:0xffc21a,shape:'cab'},
 {id:'mule',name:'MULE VAN',blurb:'Tanky box on wheels. +30% delivery pay, shrugs off crashes.',unlock:1500,max:40,acc:11,brake:26,grip:7,drift:1.8,steer:1.9,dur:.55,mass:1.5,paint:0x2ab0a0,shape:'van'},
 {id:'viper',name:'VIPER V8',blurb:'Muscle. Huge torque, loose rear end.',unlock:4000,max:58,acc:19,brake:30,grip:6,drift:1.3,steer:2.15,dur:.9,mass:1.2,paint:0xd0201a,shape:'muscle'},
 {id:'kitsune',name:'KITSUNE GT',blurb:'Drift coupe. Slides forever, drift tips ×1.5.',unlock:8000,max:54,acc:17,brake:32,grip:6.5,drift:1.05,steer:2.5,dur:.95,mass:.95,paint:0xc020ff,shape:'coupe'},
 {id:'phantom',name:'PHANTOM RS',blurb:'Hypercar. Brutal speed and grip, glass jaw.',unlock:15000,max:70,acc:24,brake:38,grip:8.5,drift:1.5,steer:2.3,dur:1.35,mass:.9,paint:0x18181c,shape:'super'}];
export const POLICE={id:'police',name:'INTERCEPTOR',max:56,acc:19,brake:34,grip:8,drift:1.6,steer:2.3,dur:.7,mass:1.3,paint:0x101418,shape:'police'};
export const RIVAL={id:'rival',max:53,acc:17,brake:32,grip:7.8,drift:1.6,steer:2.3,dur:.8,mass:1,shape:'coupe'};

/* ================= models ================= */
function geoBox(w,h,d,x,y,z,taper=0,tz=0){const g=new THREE.BoxGeometry(w,h,d);const p=g.attributes.position;for(let i=0;i<p.count;i++){if(p.getY(i)>0){p.setX(i,p.getX(i)*(1-taper));p.setZ(i,p.getZ(i)*(1-taper*.6)+tz);}}g.translate(x,y,z);return g;}
function colorize(g,c){const n=g.attributes.position.count,a=new Float32Array(n*3);const col=new THREE.Color(c);for(let i=0;i<n;i++){a[i*3]=col.r;a[i*3+1]=col.g;a[i*3+2]=col.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
function merge(list){// list of [geo,color] -> one indexed geometry
 let vc=0,ic=0;for(const[g]of list){vc+=g.attributes.position.count;ic+=g.index?g.index.count:g.attributes.position.count;}
 const P=new Float32Array(vc*3),N=new Float32Array(vc*3),C=new Float32Array(vc*3),UV=new Float32Array(vc*2),I=new Uint32Array(ic);let vo=0,io=0;
 for(const[g,c]of list){colorize(g,c);const n=g.attributes.position.count;P.set(g.attributes.position.array,vo*3);N.set(g.attributes.normal.array,vo*3);C.set(g.attributes.color.array,vo*3);if(g.attributes.uv)UV.set(g.attributes.uv.array,vo*2);
  if(g.index){const a=g.index.array;for(let k=0;k<a.length;k++)I[io+k]=a[k]+vo;io+=a.length;}else{for(let k=0;k<n;k++)I[io+k]=vo+k;io+=n;}vo+=n;}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));out.setAttribute('normal',new THREE.BufferAttribute(N,3));out.setAttribute('color',new THREE.BufferAttribute(C,3));out.setAttribute('uv',new THREE.BufferAttribute(UV,2));out.setIndex(new THREE.BufferAttribute(I,1));out.computeBoundingSphere();return out;}
const paintCache=new Map();
function paintMat(){if(!paintCache.has('p'))paintCache.set('p',new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.36,metalness:.35,clearcoat:.7,clearcoatRoughness:.12,envMapIntensity:.55}));return paintCache.get('p');}
const glowMat=new THREE.MeshBasicMaterial({vertexColors:true});
const wheelGeo=new THREE.CylinderGeometry(.38,.38,.3,16);wheelGeo.rotateZ(Math.PI/2);
const rimGeo=new THREE.CylinderGeometry(.22,.22,.32,10);rimGeo.rotateZ(Math.PI/2);
const tireMat=new THREE.MeshStandardMaterial({color:0x0c0c0e,roughness:.9}),rimMat=new THREE.MeshStandardMaterial({color:0xb8bcc4,roughness:.25,metalness:1});
const DARK=0x15161a,GLASS=0x0a1420,CHROME=0xc8ccd4,HEAD=0xffffff,TAIL=0xff1020;
export function carModel(spec,paint,o={}){const s=spec.shape,P=paint??spec.paint;const body=[],glow=[];const b=(w,h,d,x,y,z,c,t,tz)=>body.push([geoBox(w,h,d,x,y,z,t,tz),c]);const gl=(w,h,d,x,y,z,c)=>glow.push([geoBox(w,h,d,x,y,z),c]);
 let L=4.5,W=1.95,wb=1.4,wy=.38,hl=.72;
 if(s==='cab'||s==='sedan'||s==='police'){b(W,.55,L,0,.62,0,P,.04);b(W+.04,.22,L+.06,0,.42,0,DARK);b(1.72,.5,2.25,0,1.13,-.2,GLASS,.18,-.05);b(1.66,.07,1.85,0,1.4,-.26,s==='police'?0xf0f0f0:P);
  if(s==='cab'){b(W+.02,.12,L-.6,0,.75,0,0x111111);for(let k=0;k<8;k++)b(.12,.13,.22,W/2+.01,.75,-1.6+k*.46,k%2?0xffffff:0x111111);gl(.8,.26,.32,0,1.58,-.25,0xffe060);}
  if(s==='police'){b(W+.02,.5,1.6,0,.66,.2,0xf0f0f0);gl(.55,.14,.28,-.32,1.5,-.25,0x3050ff);gl(.55,.14,.28,.32,1.5,-.25,0xff2030);b(1.3,.08,.34,0,1.43,-.25,DARK);}}
 else if(s==='van'){L=5.1;W=2.05;wb=1.65;b(W,1.25,L,0,1.05,0,P,.02);b(W+.04,.24,L+.06,0,.42,0,DARK);b(1.9,.55,.9,0,1.42,1.95,GLASS,.1,.05);b(W+.01,.12,L-1.2,0,1.3,-.4,0xffffff);b(W-.1,.1,L-.4,0,1.72,-.2,DARK);hl=.85;}
 else if(s==='muscle'){L=4.8;W=2.02;wb=1.5;b(W,.5,L,0,.58,0,P,.03);b(W+.04,.2,L+.06,0,.4,0,DARK);b(1.66,.42,1.9,0,1.03,-.35,GLASS,.2,-.1);b(1.6,.06,1.5,0,1.25,-.42,P);b(.6,.16,1.1,0,.9,1.2,DARK);b(.36,.03,L+.02,-.2,.84,0,0xffffff);b(.36,.03,L+.02,.2,.84,0,0xffffff);b(W,.08,.4,0,1.05,-2.25,DARK);}
 else if(s==='coupe'){L=4.4;W=1.92;wb=1.35;b(W,.48,L,0,.56,0,P,.06);b(W+.04,.18,L+.04,0,.38,0,DARK);b(1.6,.4,1.75,0,.98,-.3,GLASS,.26,-.12);b(1.5,.05,1.2,0,1.18,-.38,P);b(1.7,.06,.36,0,1.0,-2.1,P);gl(W+.06,.04,L-.4,0,.28,0,0xff30d0);}
 else if(s==='super'){L=4.6;W=2.04;wb=1.45;b(W,.42,L,0,.5,0,P,.08);b(W+.04,.16,L+.04,0,.33,0,DARK);b(1.5,.34,1.7,0,.88,-.25,GLASS,.32,-.15);b(1.9,.05,.5,0,1.02,-2.05,DARK);b(.06,.25,.3,-.7,.86,-2.05,DARK);b(.06,.25,.3,.7,.86,-2.05,DARK);
  gl(W+.04,.03,.08,0,.62,2.29,0x30e0ff);gl(W-.2,.04,.06,0,.66,-2.3,0xff2030);}
 else if(s==='hatch'){L=4.0;W=1.85;wb=1.25;b(W,.6,L,0,.64,0,P,.05);b(W+.04,.2,L+.06,0,.42,0,DARK);b(1.7,.55,2.1,0,1.2,-.35,GLASS,.12,-.05);b(1.64,.07,1.9,0,1.48,-.38,P);}
 else if(s==='truck'){L=6.4;W=2.2;wb=2.1;b(W,1.0,1.9,0,1.05,2.1,P,.04);b(1.9,.45,.5,0,1.5,2.75,GLASS,.05);b(W+.1,2.2,4.2,0,1.75,-.95,0xe8e8e8);b(W+.04,.25,L,0,.45,0,DARK);hl=.9;}
 // lights + chrome common
 const fz=L/2+.01,rz=-L/2-.01,hw=W/2-.28;
 if(s!=='truck'){for(const sd of[-1,1]){b(.03,.36,.03,sd*(W/2+.005),.62,.25,DARK);b(.03,.04,L*.62,sd*(W/2+.006),.78,-.05,DARK);b(.16,.1,.08,sd*(W/2+.06),s==='van'?1.5:1.08,s==='van'?1.6:.62,DARK);}
  b(W*.62,.06,.04,0,hl+.16,fz+.005,CHROME);b(W-.06,.12,.12,0,.36,rz-.03,DARK);gl(W*.7,.03,.03,0,hl-.02,rz-.02,0x5a0000);}
 gl(.42,.14,.04,-hw,hl,fz,HEAD);gl(.42,.14,.04,hw,hl,fz,HEAD);gl(.46,.12,.04,-hw,hl+.04,rz,TAIL);gl(.46,.12,.04,hw,hl+.04,rz,TAIL);
 b(W*.5,.16,.05,0,hl-.12,fz,DARK);b(W-.1,.05,.05,0,.5,fz+.02,CHROME);
 const g=new THREE.Group();const bm=new THREE.Mesh(merge(body),paintMat());bm.castShadow=!o.noShadow;bm.receiveShadow=false;g.add(bm);const gm=new THREE.Mesh(merge(glow),glowMat);g.add(gm);
 const wheels=[];for(const[x,z]of[[-W/2+.12,wb],[W/2-.12,wb],[-W/2+.12,-wb],[W/2-.12,-wb]]){const pivot=new THREE.Group();pivot.position.set(x,wy,z);const w=new THREE.Mesh(wheelGeo,tireMat);const r=new THREE.Mesh(rimGeo,rimMat);w.add(r);w.castShadow=!o.noShadow;pivot.add(w);g.add(pivot);wheels.push({pivot,w,front:z>0});}
 g.userData={body:bm,glow:gm,wheels,L,W};return g;}

/* ================= physics ================= */
export class Car{
 constructor(spec,model){this.spec=spec;this.model=model;this.x=0;this.y=0;this.z=0;this.a=0;this.vx=0;this.vz=0;this.vy=0;this.w=0;this.onGround=true;this.air=0;this.dmg=0;this.slip=0;this.rampVy=0;this.surf=null;this.pitch=0;this.roll=0;this.spin=0;this.steerVis=0;this.nitro=1;this.nitroOn=false;this.hits=[];this.landed=0;this.lastImpact=0;this.water=0;}
 get speed(){return Math.hypot(this.vx,this.vz);}
 get fwdSpeed(){return this.vx*Math.sin(this.a)+this.vz*Math.cos(this.a);}
 place(x,z,a,city,y=.5){this.x=x;this.z=z;this.a=a;this.vx=this.vz=this.vy=this.w=0;this.y=city?city.heightAt(x,z,y):0;this.onGround=true;this.air=0;}
 step(inp,dt,city,opt={}){const S=this.spec,c=this;this.hits.length=0;const sa=Math.sin(c.a),ca=Math.cos(c.a);let vf=c.vx*sa+c.vz*ca,vr=c.vx*ca-c.vz*sa;
  const dmgK=1-Math.min(.45,c.dmg/220);const surfGrip=opt.grip??1;const wet=opt.wet||0;
  if(c.onGround){const top=S.max*dmgK*(c.nitroOn?1.22:1)*(opt.topK||1);
   if(inp.thr>0){if(vf<-.5)vf+=S.brake*inp.thr*dt;else{const k=1-Math.max(0,vf)/top;vf+=S.acc*inp.thr*Math.max(k<0?k*2:.06,k)*(c.nitroOn?1.5:1)*dt;}}
   if(inp.brk>0){if(vf>.5)vf-=S.brake*inp.brk*dt;else vf=Math.max(-13,vf-S.acc*.55*inp.brk*dt);}
   vf-=vf*(.08+(inp.thr||inp.brk?0:.32))*dt;if(Math.abs(vf)<.05&&!inp.thr&&!inp.brk)vf=0;
   if(inp.hb){vf-=Math.sign(vf)*Math.min(Math.abs(vf),2.4*dt);}
   const grip=(inp.hb?S.drift:S.grip*2.4*(1-wet*.25))*surfGrip;const lat0=vr;vr-=vr*Math.min(1,grip*dt);vf-=Math.sign(vf)*Math.min(Math.abs(vf),Math.abs(lat0-vr)*.14);
   const sp=Math.abs(vf);const steerK=Math.min(1,sp/5)/(1+sp*.022);let target=inp.steer*S.steer*steerK*(vf<-.3?-1:1)*(inp.hb?1.45:1);
   // counter-steer assist + slide yaw: lateral slip feeds yaw so drifts hold
   target+=cl(vr*.035,-.6,.6)*(inp.hb||Math.abs(vr)>3?1:0)*-Math.sign(vf||1)*0;
   c.w+=(target-c.w)*Math.min(1,dt*(inp.hb?6:9));}
  else{vf-=vf*.015*dt;c.w+=(inp.steer*.9-c.w)*Math.min(1,dt*1.5);}
  // velocity stays in world space; the body yaws underneath it (that is what makes slides and drifts)
  c.vx=sa*vf+ca*vr;c.vz=ca*vf-sa*vr;c.a+=c.w*dt;const sb=Math.sin(c.a),cb=Math.cos(c.a);c.slip=Math.abs(vr);c.vf=vf;
  // water: heavy drag
  if(c.water>0){c.vx*=Math.exp(-dt*2.2);c.vz*=Math.exp(-dt*2.2);}
  // move with walled-surface edges
  let nx=c.x+c.vx*dt,nz=c.z+c.vz*dt;
  if(c.onGround&&c.surf&&c.surf.walled){const gh=city.heightAt(nx,nz,c.y);if(gh<c.y-1.1){const s=c.surf;let n=null;if(nx<s.x0&&c.x>=s.x0)n=[1,0];else if(nx>s.x1&&c.x<=s.x1)n=[-1,0];else if(nz<s.z0&&c.z>=s.z0)n=[0,1];else if(nz>s.z1&&c.z<=s.z1)n=[0,-1];
    if(n){const vn=c.vx*n[0]+c.vz*n[1];if(vn<0){c.vx-=1.35*vn*n[0];c.vz-=1.35*vn*n[1];c.hits.push({imp:-vn,n,kind:'rail',x:c.x,z:c.z});}c.vx*=.92;c.vz*=.92;nx=c.x+c.vx*dt;nz=c.z+c.vz*dt;if(city.heightAt(nx,nz,c.y)<c.y-1.1){nx=c.x;nz=c.z;}}}}
  c.x=nx;c.z=nz;
  // vertical
  const g=city.heightAt(c.x,c.z,c.y);c.surf=city._sf;
  if(c.onGround){if(g<c.y-.7){c.onGround=false;c.vy=c.rampVy*1.2;c.air=0;}else{const rv=(g-c.y)/Math.max(dt,1e-3);c.rampVy=c.rampVy*.6+rv*.4;c.y=g;c.vy=0;}}
  else{c.vy-=21*dt;c.y+=c.vy*dt;c.air+=dt;const g2=city.heightAt(c.x,c.z,c.y+.6);if(c.y<=g2){c.lastImpact=-c.vy;c.y=g2;c.vy=0;c.onGround=true;c.landed=c.air;c.rampVy=0;}}
  c.water=city.baseGround(c.x,c.z)<-.5&&c.y<-.3?1:0;
  // solids: two circles along the body
  const L=(c.model&&c.model.userData.L||4.5)*.3,r=1.05;for(const off of[L,-L]){const px=c.x+sb*off,pz=c.z+cb*off;for(const s of city.near(px,pz)){if(s.y0>c.y+1.6||s.y1<c.y+.2)continue;
    const qx=cl(px,s.x0,s.x1),qz=cl(pz,s.z0,s.z1);let dx=px-qx,dz=pz-qz,d=Math.hypot(dx,dz);if(d>=r)continue;if(d<1e-4){const ex=[px-s.x0,s.x1-px,pz-s.z0,s.z1-pz];const m=Math.min(...ex);const k=ex.indexOf(m);dx=k===0?-1:k===1?1:0;dz=k===2?-1:k===3?1:0;d=0;}else{dx/=d;dz/=d;}
    const pen=r-d;c.x+=dx*pen;c.z+=dz*pen;const vn=c.vx*dx+c.vz*dz;if(vn<0){c.vx-=1.3*vn*dx;c.vz-=1.3*vn*dz;c.vx*=.8;c.vz*=.8;c.w+=(off>0?1:-1)*vn*.02*(Math.random()<.5?1:-1);c.hits.push({imp:-vn,n:[dx,dz],kind:s.kind,x:px,z:pz,solid:s});}}}
  // visuals
  const sp=c.speed;c.spin+=(c.vf||0)*dt/.38;c.steerVis+=(inp.steer*.45-c.steerVis)*Math.min(1,dt*10);
  const wantPitch=c.onGround?cl(-(inp.thr-inp.brk)*.02*Math.min(1,sp/8),-.04,.04)+(c.rampVy?cl(-c.rampVy/Math.max(sp,4),-.3,.3):0):cl(-c.vy*.02,-.35,.35);c.pitch+=(wantPitch-c.pitch)*Math.min(1,dt*6);
  c.roll+=(cl(-c.w*sp*.006,-.09,.09)-c.roll)*Math.min(1,dt*6);
  const m=c.model;if(m){m.position.set(c.x,c.y,c.z);m.rotation.set(0,c.a,0);m.rotateX(c.pitch);m.rotateZ(c.roll);const W=m.userData.wheels;for(const w of W){w.w.rotation.x=c.spin;if(w.front)w.pivot.rotation.y=c.steerVis;}}}}

// steer an AI car toward a point at a desired speed; returns an input object
export function aiInput(c,tx,tz,want,o={}){const dx=tx-c.x,dz=tz-c.z;const ang=Math.atan2(dx,dz);let d=((ang-c.a+Math.PI*3)%(Math.PI*2))-Math.PI;const sp=c.fwdSpeed;
 const steer=cl(d*2.4,-1,1);const sharp=Math.abs(d);let thr=sp<want?1:0,brk=sp>want+3?1:0;if(sharp>.9&&sp>12){thr=0;brk=.6;}if(o.reverse){return{thr:0,brk:1,steer:-steer,hb:false};}
 return{thr,brk,steer,hb:sharp>1.1&&sp>16&&o.drift};}
