// CRITTER KART — animated track hazards: scuttling crabs, rolling snowballs, lava geysers, swinging hammers,
// pinball bumpers and falling meteors. Each telegraphs itself, collides with racers and reports obstacles to the AI.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,lerp,merge,M4,rng} from './util.js';
import {at,atK,SEA} from './course.js';
import {hitRacer} from './physics.js';

const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:o.r??.6,metalness:o.m??0,emissive:o.e??0,emissiveIntensity:o.ei??1,vertexColors:!!o.vc,transparent:!!o.t,opacity:o.t??1,depthWrite:o.t?false:true,flatShading:!!o.flat});
const _a=new V();

function crabMesh(){const g=new THREE.Group();const red=0xe8442a,dk=0xa82a1a;
 const body=new THREE.Mesh(merge([[new THREE.SphereGeometry(.7,16,10),M4(0,.55,0,0,0,0,1,.55,.8),red],[new THREE.SphereGeometry(.5,12,8),M4(0,.7,-.05,0,0,0,1,.5,.7),0xff6a4a],
  [new THREE.CylinderGeometry(.05,.05,.35,6),M4(-.18,.95,.35),dk],[new THREE.CylinderGeometry(.05,.05,.35,6),M4(.18,.95,.35),dk],[new THREE.SphereGeometry(.11,10,8),M4(-.18,1.14,.37),0xffffff],[new THREE.SphereGeometry(.11,10,8),M4(.18,1.14,.37),0xffffff],
  [new THREE.SphereGeometry(.06,8,6),M4(-.18,1.15,.46),0x111111],[new THREE.SphereGeometry(.06,8,6),M4(.18,1.15,.46),0x111111]]),std(0xffffff,{vc:true,r:.35}));body.castShadow=true;g.add(body);
 const legs=[];for(const s of[-1,1])for(let k=0;k<3;k++){const l=new THREE.Mesh(new THREE.CylinderGeometry(.06,.04,.8,6),std(dk,{r:.5}));l.position.set(s*.6,.35,(k-1)*.28);l.rotation.z=s*1.0;l.castShadow=true;g.add(l);legs.push(l);}
 const claws=[];for(const s of[-1,1]){const c=new THREE.Group();c.position.set(s*.55,.7,.45);const arm=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.5,6),std(red));arm.rotation.x=Math.PI/2;arm.position.z=.2;c.add(arm);
  const p1=new THREE.Mesh(new THREE.SphereGeometry(.24,10,8),std(red,{r:.35}));p1.scale.set(.8,.6,1.2);p1.position.set(0,.08,.55);c.add(p1);const p2=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),std(dk,{r:.35}));p2.scale.set(.7,.5,1.1);p2.position.set(0,-.1,.52);c.add(p2);c.userData.p2=p2;g.add(c);claws.push(c);}
 g.userData={legs,claws,body};return g;}
function snowballMesh(r){const g=new THREE.Group();const geo=new THREE.IcosahedronGeometry(r,3);const p=geo.attributes.position;const rr=rng(7);for(let i=0;i<p.count;i++){const v=_a.fromBufferAttribute(p,i);v.multiplyScalar(1+(Math.sin(v.x*3.1)+Math.sin(v.y*2.7+v.z*1.9))*.03);p.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();
 const m=new THREE.Mesh(geo,std(0xf6faff,{r:.85}));m.castShadow=true;g.add(m);for(let k=0;k<6;k++){const s=new THREE.Mesh(new THREE.DodecahedronGeometry(.25+rr()*.2,0),std(0x6a6a7a,{flat:true}));const a=rr()*6.28,b=rr()*3.14;s.position.set(Math.cos(a)*Math.sin(b)*r*.98,Math.cos(b)*r*.98,Math.sin(a)*Math.sin(b)*r*.98);m.add(s);}
 g.userData={ball:m};return g;}
function frameMesh(w,H,look){const g=new THREE.Group();const post=look==='palm'?0x8a6238:look==='icicle'?0xa8c8e8:0x8a7a62;const L=[];
 for(const s of[-1,1]){L.push([new THREE.BoxGeometry(1.2,H,1.2),M4(s*(w+1.5),H/2,0),post],[new THREE.BoxGeometry(1.6,.6,1.6),M4(s*(w+1.5),H+.3,0),look==='icicle'?0xe8f4ff:0x6a5a48]);}
 L.push([new THREE.BoxGeometry(2*w+4.2,1,1.2),M4(0,H+.2,0),look==='palm'?0x6a4a2a:post]);
 const m=new THREE.Mesh(merge(L),std(0xffffff,{vc:true,r:.8,flat:true}));m.castShadow=m.receiveShadow=true;g.add(m);return g;}
function hammerMesh(L,look){const g=new THREE.Group();const rope=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,L,6),std(look==='icicle'?0xcfe8ff:0x6a5030,{r:.9}));rope.position.y=-L/2;g.add(rope);
 let head;if(look==='icicle'){head=new THREE.Mesh(new THREE.ConeGeometry(1.3,4.2,7),std(0xbfe8ff,{r:.15,m:.1,e:0x2a6aa0,ei:.5,flat:true}));head.rotation.x=Math.PI;head.position.y=-L-1.2;}
 else if(look==='palm'){head=new THREE.Mesh(merge([[new THREE.CylinderGeometry(1,1,4.4,10),M4(0,0,0,0,0,Math.PI/2),0x8a6238],[new THREE.CylinderGeometry(1.02,1.02,.3,10),M4(-1.6,0,0,0,0,Math.PI/2),0x5a3a20],[new THREE.CylinderGeometry(1.02,1.02,.3,10),M4(1.6,0,0,0,0,Math.PI/2),0x5a3a20],[new THREE.CircleGeometry(.95,10),M4(2.21,0,0,0,Math.PI/2,0),0xd8b080],[new THREE.CircleGeometry(.95,10),M4(-2.21,0,0,0,-Math.PI/2,0),0xd8b080]]),std(0xffffff,{vc:true,r:.85}));head.position.y=-L;}
 else{head=new THREE.Mesh(merge([[new THREE.BoxGeometry(2.2,2.2,2.2),M4(0,0,0),0x9a8a6a],[new THREE.BoxGeometry(2.4,.5,2.4),M4(0,.6,0),0x6a5a48],[new THREE.BoxGeometry(.5,.5,.3),M4(-.45,.1,1.12),0xff5a1a],[new THREE.BoxGeometry(.5,.5,.3),M4(.45,.1,1.12),0xff5a1a],[new THREE.BoxGeometry(1.2,.3,.3),M4(0,-.55,1.12),0x2a1a10]]),std(0xffffff,{vc:true,r:.85,flat:true,e:0x000000}));head.position.y=-L;}
 head.castShadow=true;g.add(head);g.userData={head};return g;}
function bumperMesh(){const g=new THREE.Group();const base=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.7,.5,24),std(0x2a2a48,{r:.4,m:.4}));base.position.y=.25;g.add(base);
 const col=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.3,1.6,24),std(0xff3aa0,{r:.25,m:.2,e:0xff2a90,ei:.6}));col.position.y=1.2;col.castShadow=true;g.add(col);
 const top=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.25,.35,24),std(0xffffff,{r:.2,e:0xfff0ff,ei:.3}));top.position.y=2.15;g.add(top);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.55,.12,8,32),new THREE.MeshBasicMaterial({color:0xffe04a}));ring.rotation.x=Math.PI/2;ring.position.y=1.2;g.add(ring);g.userData={col,ring,top};return g;}
function geyserMesh(){const g=new THREE.Group();const crack=new THREE.Mesh(new THREE.CircleGeometry(1.6,20),new THREE.MeshBasicMaterial({color:0xff6a10,transparent:true,opacity:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));crack.rotation.x=-Math.PI/2;crack.position.y=.12;g.add(crack);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.7,.35,6,16),std(0x3a2a24,{r:.9,flat:true}));rim.rotation.x=Math.PI/2;rim.position.y=.12;rim.scale.z=.5;g.add(rim);
 const col=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.4,1,14,1,true),new THREE.MeshBasicMaterial({color:0xffa030,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));col.position.y=.5;col.visible=false;g.add(col);
 g.userData={crack,col};return g;}
function meteorMesh(){const g=new THREE.Group();const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(1.3,1),std(0x5a4a6a,{r:.8,e:0xff5a20,ei:.9,flat:true}));rock.castShadow=true;g.add(rock);
 const glow=new THREE.Mesh(new THREE.SphereGeometry(1.9,16,10),new THREE.MeshBasicMaterial({color:0xff8a3a,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));g.add(glow);g.userData={rock};return g;}
function ringMark(col,r=2.4){const m=new THREE.Mesh(new THREE.RingGeometry(r*.82,r,32),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));m.rotation.x=-Math.PI/2;return m;}

export class Hazards{
 constructor(scene,C,TR,T,fx){this.scene=scene;this.C=C;this.TR=TR;this.fx=fx;this.grp=new THREE.Group();scene.add(this.grp);this.list=[];this.obs=[];this.t=0;const B=C.B,r=rng((C.def.seed||1)*13);
  const mk=(h,o)=>{this.list.push({...o,k:h.k,src:h});};
  for(const h of C.haz){const i=h.i,w=B.w[i],yaw=Math.atan2(B.tx[i],B.tz[i]);
   if(h.k==='crab'){for(let k=0;k<(h.n||2);k++){const ii=(i+k*4)%B.n,m=crabMesh();this.grp.add(m);mk(h,{i:ii,m,ph:r()*6.28,sp:.55+r()*.35,amp:B.w[ii]*.9,rad:1.2});}}
   else if(h.k==='snowball'){const m=snowballMesh(2.4);this.grp.add(m);const sh=ringMark(0x5a6aa0,2.6);sh.material.opacity=.35;this.grp.add(sh);mk(h,{i,m,sh,ph:r()*5,per:5.5+r()*1.5,dir:r()<.5?-1:1,rad:2.6});}
   else if(h.k==='geyser'){for(let k=0;k<(h.n||2);k++){const u=((k+.5)/(h.n||2)-.5)*w*1.5,ii=(i+k*2)%B.n,m=geyserMesh();this.grp.add(m);mk(h,{i:ii,u,m,ph:k*1.3+r()*2,per:4.4,rad:1.9});}}
   else if(h.k==='pendulum'){const H=11,Ln=8,look=h.look||(T.snow?'icicle':'stone');const fr=frameMesh(w,H,look);const q=at(C,i,0);fr.position.copy(q);fr.rotation.y=yaw;this.grp.add(fr);
    const piv=new THREE.Group();piv.position.set(q.x,q.y+H,q.z);piv.rotation.y=yaw;this.grp.add(piv);const hm=hammerMesh(Ln,look);piv.add(hm);const sh=ringMark(0x000000,2);sh.material.opacity=.3;this.grp.add(sh);
    mk(h,{i,m:fr,piv,hm,sh,H,Ln,ph:r()*6.28,per:3.2+r()*.6,amp:1.05,rad:2.1,yaw});}
   else if(h.k==='bumper'){for(let k=0;k<(h.n||3);k++){const ii=(i+k*5)%B.n,u=(k%2?1:-1)*w*(.25+.35*((k*7)%3)/2),m=bumperMesh();this.grp.add(m);mk(h,{i:ii,u,u0:u,m,ph:r()*6,moving:k%2===0,rad:1.6,flash:0});}}
   else if(h.k==='meteor'){const m=meteorMesh();m.visible=false;this.grp.add(m);const mark=ringMark(0xff6a20,3.2);mark.visible=false;this.grp.add(mark);mk(h,{i,m,mark,t:1+r()*3,state:0,rad:3.6,u:0});}}
  // bumpers lining the bumper shortcut
  for(const K of C.cuts)if(K.def.bumpers){for(let k=0;k<4;k++){const ci=Math.round(K.n*(.25+k*.15)),u=(k%2?1:-1)*K.w[ci]*.45,m=bumperMesh();this.grp.add(m);this.list.push({k:'bumper',cut:K,i:ci,u,u0:u,m,ph:k,moving:false,rad:1.6,flash:0});}}
  this.place();}
 pos(h,u,o){return h.cut?atK(h.cut,h.i,u,o):at(this.C,h.i,u,o);}
 place(){for(const h of this.list){if(h.k==='crab'||h.k==='bumper'||h.k==='geyser'){const q=this.pos(h,h.u||0,new V());h.m.position.copy(q);h.base=q.clone();const B=h.cut||this.C.B;h.yaw=Math.atan2(B.tx[h.i],B.tz[h.i]);h.m.rotation.y=h.yaw;}}}
 clear(){this.scene.remove(this.grp);this.grp.traverse(o=>{if(o.geometry)o.geometry.dispose();});this.list=[];}
 update(dt,rs,env,frozen){this.t+=dt;const t=this.t,B=this.C.B,obs=this.obs;obs.length=0;
  for(const h of this.list){
   if(h.k==='crab'){const w=B.w[h.i],u=Math.sin(t*h.sp+h.ph)*h.amp,du=Math.cos(t*h.sp+h.ph);const q=at(this.C,h.i,u,_a);h.m.position.set(q.x,q.y+.05+Math.abs(Math.sin(t*14))*.06,q.z);h.m.rotation.y=h.yaw+Math.sin(t*3+h.ph)*.2;
    h.m.userData.legs.forEach((l,k)=>l.rotation.x=Math.sin(t*16+k*1.7)*.5*Math.sign(du));h.m.userData.claws.forEach((c,k)=>{c.rotation.x=-.3+Math.sin(t*5+k)*.25;c.userData.p2.rotation.x=Math.max(0,Math.sin(t*9+k*2))*.5;});
    h.p=h.m.position;obs.push({p:h.p,r:1.4});this.hit(h,rs,env,'crab');}
   else if(h.k==='snowball'){const k=((t+h.ph)%h.per)/h.per;const w=B.w[h.i],span=w+20,u=h.dir*lerp(span,-span,k);const q=at(this.C,h.i,u,_a);const gy=Math.max(this.TR.h(q.x,q.z),Math.abs(u)<w+.6?q.y:-99);
    h.m.position.set(q.x,gy+2.4,q.z);h.m.userData.ball.rotation.set(0,0,0);h.m.rotation.y=Math.atan2(B.nx[h.i],B.nz[h.i]);h.m.userData.ball.rotation.x=-u/2.4*h.dir;h.sh.position.set(q.x,gy+.15,q.z);
    // telegraph: a shadow ring slides across ahead of the ball
    if(Math.abs(u)<w+3&&Math.random()<.5)this.fx.dust(h.m.position.clone().setY(gy+.3),0xffffff);h.p=h.m.position;obs.push({p:h.p,r:3});this.hit(h,rs,env,'snowball');}
   else if(h.k==='geyser'){const k=((t+h.ph)%h.per);const warn=k>2.2&&k<3,erupt=k>=3&&k<4.3;h.state=erupt?2:warn?1:0;const U=h.m.userData;
    U.crack.material.color.setHex(erupt?0xffe0a0:warn?0xff9a30:0xff5a10);U.crack.material.opacity=warn?.6+.4*Math.sin(t*30):.85;U.crack.scale.setScalar(warn?1+.15*Math.sin(t*24):1);
    U.col.visible=erupt;if(erupt){const e=Math.min(1,(k-3)*5)*(1-cl((k-4)*5,0,1));U.col.scale.set(1,1+e*13,1);U.col.position.y=(1+e*13)/2;if(Math.random()<.9)this.fx.lava(h.base,e);}
    if(warn&&Math.random()<.4)this.fx.ember(h.base);h.p=h.base;if(h.state>0)obs.push({p:h.p,r:2.6});if(erupt)this.hit(h,rs,env,'geyser');}
   else if(h.k==='pendulum'){const a=Math.sin(t*Math.PI*2/h.per+h.ph)*h.amp;h.piv.rotation.z=a;const lat=Math.sin(a)*h.Ln,yy=h.H-Math.cos(a)*h.Ln;const q=at(this.C,h.i,lat,_a);
    h.p=(h.p||new V()).set(q.x,q.y+yy,q.z);h.sh.position.set(q.x,q.y+.12,q.z);h.sh.scale.setScalar(1-cl((yy-2)/8,0,.6));obs.push({p:h.p,r:3});this.hit(h,rs,env,'hammer');}
   else if(h.k==='bumper'){const U=h.m.userData;if(h.moving&&!h.cut){h.u=h.u0+Math.sin(t*1.1+h.ph)*B.w[h.i]*.5;const q=at(this.C,h.i,h.u,_a);h.m.position.copy(q);}
    h.flash=Math.max(0,h.flash-dt*3);U.col.material.emissiveIntensity=.6+h.flash*3;U.ring.scale.setScalar(1+h.flash*.4);U.top.position.y=2.15-h.flash*.3;h.p=h.m.position;obs.push({p:h.p,r:2.2});this.bump(h,rs,env);}
   else if(h.k==='meteor'){h.t-=dt;if(h.state===0&&h.t<=0){h.state=1;h.t=1.5;h.u=(Math.random()-.5)*B.w[h.i]*1.4;const q=at(this.C,h.i,h.u,new V());h.target=q;h.mark.position.set(q.x,q.y+.15,q.z);h.mark.visible=true;h.m.visible=true;}
    if(h.state===1){const k=1-h.t/1.5;h.m.position.set(h.target.x+(1-k)*30,h.target.y+(1-k)*70+1.2,h.target.z-(1-k)*10);h.m.rotation.x+=dt*4;h.mark.material.opacity=.4+.5*Math.abs(Math.sin(t*12));h.mark.scale.setScalar(1.2-k*.2);
     if(Math.random()<.8)this.fx.trail(h.m.position,0xff8a3a,2);obs.push({p:h.target,r:4});
     if(h.t<=0){h.state=2;h.t=.6;this.fx.boom(h.target,'fire');env.quake&&env.quake(h.target);h.m.visible=false;for(const r of rs)if(r.p.distanceTo(h.target)<h.rad+1)hitRacer(r,env,'meteor');}}
    else if(h.state===2){h.mark.material.opacity=Math.max(0,h.mark.material.opacity-dt*1.5);if(h.t<=0){h.state=0;h.t=2.5+Math.random()*2.5;h.mark.visible=false;}}}}}
 hit(h,rs,env,kind){const P=h.p;for(const r of rs){if(r.rescueT>0||r.ghost)continue;const dy=r.p.y+.6-P.y;if(Math.abs(dy)>(kind==='hammer'?2.4:kind==='geyser'?14:2.6))continue;const dx=r.p.x-P.x,dz=r.p.z-P.z;if(dx*dx+dz*dz<(h.rad+1)**2){if(hitRacer(r,env,kind))env.hazHit&&env.hazHit(r,kind);}}}
 bump(h,rs,env){const P=h.p;for(const r of rs){if(r.rescueT>0||r.ghost||r.air)continue;const dx=r.p.x-P.x,dz=r.p.z-P.z,d=Math.hypot(dx,dz),R=h.rad+1.2;if(d<R&&d>1e-3){const nx=dx/d,nz=dz/d;r.p.x+=nx*(R-d);r.p.z+=nz*(R-d);
   const fx=Math.sin(r.yaw),fz=Math.cos(r.yaw),into=-(fx*nx+fz*nz);r.v*=into>.5?.55:.8;r.vl+=(nx*Math.cos(r.yaw)-nz*Math.sin(r.yaw))*10;r.yaw+=(nx*fz-nz*fx)*.25;h.flash=1;env.bumper&&env.bumper(r,h);}}}}
