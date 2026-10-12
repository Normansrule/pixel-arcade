// NEON BAY — people: procedural articulated rig rendered with instancing (player, pedestrians, riders),
// the on-foot player controller, and sidewalk pedestrian AI that dives out of the way of reckless drivers.
import {THREE,cl,lerp,wrapA,rng} from './util.js';
import {WL,SLAB} from './world.js';
const V=THREE.Vector3,M4=THREE.Matrix4;

const SKIN=[0xf1c9a5,0xe0ac82,0xc68863,0x8d5a3b,0x5e3a24,0xf5d6c0];const HAIR=[0x1a1410,0x3a2616,0x6a4320,0xc9a25a,0x8a8a8a,0x101010,0xb0502a];
const SHIRT=[0xff5a6e,0x34c3d8,0xffd23f,0xffffff,0x7b5cff,0xff8a3d,0x2f7d5a,0xe8e8e8,0x2a5bd7,0xff4fa3,0x9ad34a,0x1a1a1a];const PANTS=[0x2a3550,0x1a1a1e,0xd8c8a8,0x3a4a3a,0x6a7aa0,0xe8e8e8,0x5a3a2a];
export function randLook(R=Math.random){const p=a=>a[R()*a.length|0];return{skin:p(SKIN),hair:p(HAIR),shirt:p(SHIRT),pants:p(PANTS),sc:.92+R()*.16,bald:R()<.12,cap:R()<.18};}
export const PLAYER_LOOK={skin:0xe0ac82,hair:0x1a1410,shirt:0x1fd1c4,pants:0x2a3550,sc:1,cap:false};

/* ---------- instanced renderer ---------- */
const PARTS=['pelvis','torso','head','hair','uarm','farm','thigh','shin'];
function partGeo(){const C=(r,l,cs=4,rs=8)=>new THREE.CapsuleGeometry(r,l,cs,rs);const g={};
 g.pelvis=new THREE.BoxGeometry(.34,.2,.21);g.pelvis.translate(0,-.02,0);
 g.torso=C(.165,.3);g.torso.scale(1.18,1,.74);g.torso.translate(0,.3,0);
 g.head=new THREE.SphereGeometry(.118,12,10);g.head.scale(.92,1.08,1);g.head.translate(0,.14,.01);{const n=new THREE.CylinderGeometry(.05,.06,.08,8);n.translate(0,.02,0);g.head=mergeG(g.head,n);}
 g.hair=new THREE.SphereGeometry(.126,12,8,0,Math.PI*2,0,Math.PI*.55);g.hair.translate(0,.16,-.005);
 g.uarm=C(.058,.2);g.uarm.translate(0,-.15,0);g.farm=C(.05,.2);g.farm.translate(0,-.13,0);{const h=new THREE.SphereGeometry(.055,8,6);h.translate(0,-.29,0);g.farm=mergeG(g.farm,h);}
 g.thigh=C(.082,.3);g.thigh.translate(0,-.2,0);g.shin=C(.066,.3);g.shin.translate(0,-.2,0);{const s=new THREE.BoxGeometry(.11,.08,.25);s.translate(0,-.43,.05);const sc=new Float32Array(s.attributes.position.count*3).fill(.18);s.setAttribute('color',new THREE.BufferAttribute(sc,3));
  const sh=g.shin;sh.setAttribute('color',new THREE.BufferAttribute(new Float32Array(sh.attributes.position.count*3).fill(1),3));g.shin=mergeG(sh.index?sh.toNonIndexed():sh,s.toNonIndexed(),true);}
 return g;}
function mergeG(a,b,col){a=a.index?a.toNonIndexed():a;b=b.index?b.toNonIndexed():b;const out=new THREE.BufferGeometry();for(const k of['position','normal','uv'].concat(col?['color']:[])){const A=a.attributes[k],Bb=b.attributes[k];if(!A||!Bb)continue;const arr=new Float32Array(A.array.length+Bb.array.length);arr.set(A.array);arr.set(Bb.array,A.array.length);out.setAttribute(k,new THREE.BufferAttribute(arr,A.itemSize));}return out;}

export class Crowd{constructor(scene,n=90){const G=partGeo();this.meshes={};this.n=n;const mat=new THREE.MeshStandardMaterial({roughness:.75});const matV=new THREE.MeshStandardMaterial({roughness:.75,vertexColors:true});
  for(const k of PARTS){const cnt=(k==='uarm'||k==='farm'||k==='thigh'||k==='shin')?n*2:n;const m=new THREE.InstancedMesh(G[k],k==='shin'?matV:mat,cnt);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cnt*3),3);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;m.count=0;scene.add(m);this.meshes[k]=m;}
  this.c=new THREE.Color();this.k={};}
 begin(){for(const k of PARTS)this.k[k]=0;}
 put(part,m,col){const me=this.meshes[part],i=this.k[part]++;if(i>=me.instanceMatrix.count)return;me.setMatrixAt(i,m);this.c.set(col);me.setColorAt(i,this.c);}
 end(){for(const k of PARTS){const m=this.meshes[k];m.count=this.k[k];m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;}}
 // draw one character from its pose
 draw(ch){const P=ch.pose,L=ch.look,s=L.sc;const root=_root.compose(_v.set(ch.x,ch.y+(P.dy||0),ch.z),_q.setFromEuler(_e.set(P.rx||0,ch.yaw,P.rz||0,'YXZ')),_sv.set(s,s,s));
  const pel=_pel.copy(root).multiply(T(0,.93+(P.bob||0),0,P.lean*.3,P.twist*.4,0));this.put('pelvis',pel,L.pants);
  const tor=_tor.copy(pel).multiply(T(0,.06,0,P.lean,P.twist,P.tilt||0));this.put('torso',tor,L.shirt);
  const hd=_hd.copy(tor).multiply(T(0,.62,0,P.headX||0,P.headY||0,0));this.put('head',hd,L.skin);if(!L.bald)this.put('hair',hd,L.cap?0xff4d00:L.hair);
  for(const sd of[-1,1]){const A=sd<0?P.al:P.ar;const ua=_ua.copy(tor).multiply(T(sd*.215,.52,0,A[0],0,sd*(.1+A[1])));this.put('uarm',ua,L.shirt);const fa=_fa.copy(ua).multiply(T(0,-.3,0,-A[2],0,0));this.put('farm',fa,L.skin);
   const Lg=sd<0?P.ll:P.lr;const th=_th.copy(pel).multiply(T(sd*.095,-.06,0,Lg[0],0,sd*(.04+Lg[1])));this.put('thigh',th,L.pants);const sh=_sh.copy(th).multiply(T(0,-.42,0,Lg[2],0,0));this.put('shin',sh,L.pants);}}}
const _root=new M4(),_pel=new M4(),_tor=new M4(),_hd=new M4(),_ua=new M4(),_fa=new M4(),_th=new M4(),_sh=new M4(),_t=new M4(),_v=new V(),_sv=new V(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_q2=new THREE.Quaternion(),_e2=new THREE.Euler(),_v2=new V(),_one=new V(1,1,1);
function T(x,y,z,rx,ry,rz){return _t.compose(_v2.set(x,y,z),_q2.setFromEuler(_e2.set(rx,ry,rz,'YXZ')),_one);}

/* ---------- pose / animation ---------- */
export function newPose(){return{lean:0,twist:0,tilt:0,bob:0,dy:0,rx:0,rz:0,headX:0,headY:0,al:[0,0,.1],ar:[0,0,.1],ll:[0,0,0],lr:[0,0,0]};}
const blend=(P,Q,k)=>{for(const key of['lean','twist','tilt','bob','dy','rx','rz','headX','headY'])P[key]+=(Q[key]-P[key])*k;for(const key of['al','ar','ll','lr'])for(let i=0;i<3;i++)P[key][i]+=(Q[key][i]-P[key][i])*k;};
const TP=newPose();
// target pose from the character's state; ph = gait phase
export function animate(ch,dt){const st=ch.state,s=ch.spd||0,t=ch.t||0;const Q=TP;Object.assign(Q,{lean:0,twist:0,tilt:0,bob:0,dy:0,rx:0,rz:0,headX:0,headY:0});Q.al=[0,.05,.15];Q.ar=[0,.05,.15];Q.ll=[0,0,0];Q.lr=[0,0,0];let k=Math.min(1,dt*12);
 if(st==='walk'||st==='run'||st==='idle'||st==='swim'){const run=cl((s-2.6)/4,0,1),walk=cl(s/2.2,0,1);ch.ph=(ch.ph||0)+dt*(s*2.3/(1+run*.35)+.2);const p=ch.ph,A=(.42+run*.5)*walk,sp=Math.sin(p),cp=Math.cos(p);
  Q.ll=[sp*A,0,Math.max(0,-cp)*(.35+run*1.1)*walk+.05];Q.lr=[-sp*A,0,Math.max(0,cp)*(.35+run*1.1)*walk+.05];Q.al=[-sp*A*(.8+run*.4),.06,.2+run*1.1];Q.ar=[sp*A*(.8+run*.4),.06,.2+run*1.1];
  Q.lean=.04+run*.22;Q.bob=-Math.abs(sp)*(.02+run*.05)*walk;Q.twist=sp*.12*walk;if(s<.3){const b=Math.sin(t*1.8);Q.al=[.02,.06+b*.01,.12];Q.ar=[.02,.06-b*.01,.12];Q.bob=b*.006;Q.headY=Math.sin(t*.4+ch.seed)*.4;}
  if(st==='swim'){Q.rx=1.2;Q.dy=.2;Q.al=[-3+Math.sin(p)*1.2,.2,.3];Q.ar=[-3-Math.sin(p)*1.2,.2,.3];Q.ll=[Math.sin(p*2)*.3,0,.2];Q.lr=[-Math.sin(p*2)*.3,0,.2];Q.headX=-1;}}
 else if(st==='air'){Q.ll=[-.7,0,1.1];Q.lr=[-.2,0,.4];Q.al=[-.6,.5,.6];Q.ar=[-.4,.5,.5];Q.lean=.1;k=Math.min(1,dt*8);}
 else if(st==='climb'){const p=ch.climbT||0;Q.al=[-2.8+p*1.6,.2,.4];Q.ar=[-2.8+p*1.6,.2,.4];Q.ll=[-1.2*(1-p),0,1.4*(1-p)];Q.lr=[-.4,0,.6];Q.lean=.4-p*.3;k=Math.min(1,dt*14);}
 else if(st==='dive'){Q.rx=1.25;Q.dy=.35;Q.al=[-2.9,.2,.1];Q.ar=[-2.9,.2,.1];Q.ll=[.25,0,.3];Q.lr=[.15,.1,.4];k=Math.min(1,dt*9);}
 else if(st==='prone'||st==='tumble'){Q.rx=ch.flip?1.45:-1.45;Q.dy=.16;Q.al=[-2.2,.6,.4];Q.ar=[-.4,.7,.2];Q.ll=[.1,.15,.2];Q.lr=[.2,.05,.5];if(st==='tumble'){Q.rx=ch.spinX||0;Q.rz=ch.spinZ||0;Q.dy=.5;Q.al=[-2.4,1,.3];Q.ar=[-1.4,1.2,.2];Q.ll=[-.6,.4,.6];Q.lr=[.4,.3,.2];k=1;}}
 else if(st==='getup'){const p=cl(ch.getT||0,0,1);Q.rx=(ch.flip?1.45:-1.45)*(1-p)*(1-p);Q.dy=.16*(1-p);Q.ll=[-1*(1-p),0,1.6*(1-p)];Q.lr=[-1*(1-p),0,1.6*(1-p)];Q.al=[-.5*(1-p),.3,.5];Q.ar=[-.5*(1-p),.3,.5];k=Math.min(1,dt*10);}
 else if(st==='ride'){Q.lean=.55+(ch.rideLean||0);Q.ll=[-1.35,.18,1.55];Q.lr=[-1.35,.18,1.55];Q.al=[-1.25,.18,.45];Q.ar=[-1.25,.18,.45];Q.dy=0;k=1;}
 else if(st==='sit'){Q.ll=[-1.5,.05,1.5];Q.lr=[-1.5,.05,1.5];Q.al=[-1,.1,.6];Q.ar=[-1,.1,.6];}
 else if(st==='wave'){const w=Math.sin(t*9);Q.ar=[-2.6,.5+w*.25,.6+w*.3];Q.al=[0,.06,.15];Q.headY=.2;}
 else if(st==='cheer'){const w=Math.sin(t*10);Q.al=[-2.9,.35+w*.1,.3];Q.ar=[-2.9,.35-w*.1,.3];Q.bob=Math.abs(w)*.06;}
 else if(st==='photo'){Q.al=[-1.5,-.15,1.1];Q.ar=[-1.5,-.15,1.1];Q.headX=.15;}
 else if(st==='fist'){const w=Math.sin(t*12);Q.ar=[-2.5,.2,1.4+w*.4];Q.al=[0,.1,.2];Q.lean=-.05;}
 blend(ch.pose,Q,k);}

/* ---------- on-foot player controller ---------- */
export class Walker{constructor(){this.x=0;this.y=0;this.z=0;this.vx=0;this.vy=0;this.vz=0;this.yaw=0;this.onG=true;this.state='idle';this.t=0;this.pose=newPose();this.look=PLAYER_LOOK;this.spd=0;this.seed=1;this.climbT=0;this.swim=false;this.lock=0;}
 place(x,z,W,yaw=0){this.x=x;this.z=z;this.y=W.groundAt(x,z,W.terrainH(x,z)+3);this.vx=this.vz=this.vy=0;this.yaw=yaw;this.state='idle';this.onG=true;}
 update(dt,inp,camYaw,W,vehicles,ev){this.t+=dt;if(this.state==='tumble'||this.state==='prone'||this.state==='getup'){this.ragdoll(dt,W);animate(this,dt);return;}
  if(this.state==='climb'){this.climbT+=dt/.55;const c=this.climb;const p=Math.min(1,this.climbT);this.x=lerp(c.x0,c.x1,p);this.z=lerp(c.z0,c.z1,p);this.y=lerp(c.y0,c.top,Math.min(1,p*1.6));if(p>=1){this.state='idle';this.y=c.top;}animate(this,dt);return;}
  if(this.lock>0){this.lock-=dt;inp={mx:0,mz:0};}
  const fx=Math.sin(camYaw),fz=Math.cos(camYaw),rx=-fz,rz=fx;let dx=fx*inp.mz+rx*inp.mx,dz=fz*inp.mz+rz*inp.mx;const l=Math.hypot(dx,dz);if(l>1){dx/=l;dz/=l;}
  const max=this.swim?1.9:inp.walk?2:inp.sprint?7.6:4.7;const tvx=dx*max,tvz=dz*max;const acc=this.onG||this.swim?11:2.5;this.vx+=(tvx-this.vx)*Math.min(1,dt*acc);this.vz+=(tvz-this.vz)*Math.min(1,dt*acc);
  if(l>.1){const ty=Math.atan2(dx,dz);this.yaw+=wrapA(ty-this.yaw)*Math.min(1,dt*12);}
  // jump / climb
  if(inp.jump&&(this.onG||this.swim)){const c=this.probeClimb(W);if(c){this.state='climb';this.climb=c;this.climbT=0;this.vx=this.vz=this.vy=0;ev&&ev('climb');animate(this,dt);return;}if(!this.swim){this.vy=5.4;this.onG=false;ev&&ev('jump');}}
  this.x+=this.vx*dt;this.z+=this.vz*dt;
  // world collisions
  W.collide(this.x,this.z,.34,this.y+.45,this.y+1.75,_c);if(_c.hit){this.x+=_c.px;this.z+=_c.pz;}
  for(const v of vehicles){if(!v.group)continue;const sa=Math.sin(v.a),ca=Math.cos(v.a);const dx2=this.x-v.x,dz2=this.z-v.z;if(dx2*dx2+dz2*dz2>40)continue;if(this.y>v.y+1.6)continue;
   const lx=dx2*ca-dz2*sa,lz=dx2*sa+dz2*ca;const hw=v.wid/2+.3,hl=v.len/2+.3;if(Math.abs(lx)<hw&&Math.abs(lz)<hl){const px=hw-Math.abs(lx),pz=hl-Math.abs(lz);if(px<pz){const s=Math.sign(lx)*px;this.x+=s*ca;this.z+=-s*sa;}else{const s=Math.sign(lz)*pz;this.x+=s*sa;this.z+=s*ca;}
    if(v.speed>5&&!v.bike){ev&&ev('hitbycar',v);}}}
  // ground + gravity
  const g=Math.max(W.groundAt(this.x,this.z,this.y+.5),W.topUnder(this.x,this.z,this.y));const water=WL-1.15;
  if(g<water-.1&&this.y<=water+.05){this.swim=true;this.y=water;this.vy=0;this.onG=false;}else this.swim=false;
  if(!this.swim){this.vy-=19*dt;this.y+=this.vy*dt;if(this.y<=g){if(!this.onG&&this.vy<-4)ev&&ev('land');this.y=g;this.vy=0;this.onG=true;}else if(this.y>g+.25)this.onG=false;}
  this.spd=Math.hypot(this.vx,this.vz);this.state=this.swim?'swim':this.onG?(this.spd>.3?'walk':'idle'):'air';if(inp.pose&&this.spd<.5&&this.onG)this.state=inp.pose;animate(this,dt);}
 probeClimb(W){const fx=Math.sin(this.yaw),fz=Math.cos(this.yaw);for(const d of[.55,.85]){const px=this.x+fx*d,pz=this.z+fz*d;let top=-1e9;for(const s of W.sHash.at(px,pz)){if(px<s.x0-.05||px>s.x1+.05||pz<s.z0-.05||pz>s.z1+.05)continue;if(s.y1>this.y+.5&&s.y1<=this.y+2.5&&s.kind!=='pole'&&s.kind!=='palm')top=Math.max(top,s.y1);}
   const gg=W.groundAt(px+fx*.5,pz+fz*.5,this.y+2.5);if(gg>this.y+.5&&gg<=this.y+2.5)top=Math.max(top,gg);
   if(top>-1e8){// make sure there is room on top
    const tx=this.x+fx*(d+.55),tz=this.z+fz*(d+.55);W.collide(tx,tz,.3,top+.1,top+1.7,_c);if(_c.hit)continue;return{x0:this.x,z0:this.z,y0:this.y,x1:tx,z1:tz,top};}}return null;}
 // thrown off a bike / hit: ballistic tumble, then lie, then get up
 knock(vx,vy,vz){this.state='tumble';this.vx=vx;this.vy=vy;this.vz=vz;this.onG=false;this.spinX=0;this.spinZ=0;this.flip=Math.random()<.5;this.pt=0;}
 ragdoll(dt,W){if(this.state==='tumble'){this.vy-=19*dt;this.x+=this.vx*dt;this.z+=this.vz*dt;this.y+=this.vy*dt;this.spinX+=dt*9;this.spinZ+=dt*3;W.collide(this.x,this.z,.34,this.y+.3,this.y+1.4,_c);if(_c.hit){this.x+=_c.px;this.z+=_c.pz;this.vx*=-.3;this.vz*=-.3;}
   const g=W.groundAt(this.x,this.z,this.y+.5);if(this.y<=g&&this.vy<0){this.y=g;if(Math.hypot(this.vx,this.vz)>3){this.vy=Math.abs(this.vy)*.3;this.vx*=.55;this.vz*=.55;}else{this.state='prone';this.pt=0;}}if(this.y<WL-1.2){this.y=WL-1.15;this.state='getup';this.getT=0;}}
  else if(this.state==='prone'){this.pt+=dt;if(this.pt>1.1){this.state='getup';this.getT=0;}}
  else if(this.state==='getup'){this.getT+=dt/.8;if(this.getT>=1)this.state='idle';}}}
const _c={};

/* ---------- pedestrians ---------- */
export class Peds{constructor(W,crowd){this.W=W;this.crowd=crowd;this.list=[];this.R=rng(99);this.walks=W.blocks.filter(b=>b.x1-b.x0>12&&b.z1-b.z0>4).map(b=>({b,x0:b.x0+2.4,x1:b.x1-2.4,z0:b.z0+2.4,z1:b.walk?b.z0+2.4:b.z1-2.4}));}
 perim(w){return 2*((w.x1-w.x0)+(w.z1-w.z0));}
 at(w,t,o){const W=w.x1-w.x0,D=w.z1-w.z0;t=((t%(2*(W+D)))+2*(W+D))%(2*(W+D));if(t<W){o.x=w.x0+t;o.z=w.z0;o.a=Math.PI/2;}else if(t<W+D){o.x=w.x1;o.z=w.z0+t-W;o.a=0;}else if(t<2*W+D){o.x=w.x1-(t-W-D);o.z=w.z1;o.a=-Math.PI/2;}else{o.x=w.x0;o.z=w.z1-(t-2*W-D);o.a=Math.PI;}return o;}
 spawn(px,pz,minD,maxD){const R=this.R;for(let tries=0;tries<12;tries++){const w=this.walks[R()*this.walks.length|0];const t=R()*this.perim(w);const p=this.at(w,t,{});const d=Math.hypot(p.x-px,p.z-pz);if(d<minD||d>maxD)continue;
   const ch={kind:'ped',w,t,dir:R()<.5?1:-1,x:p.x,z:p.z,y:this.W.groundAt(p.x,p.z,2),yaw:p.a,look:randLook(R),pose:newPose(),state:'walk',spd:0,base:.95+R()*.6,seed:R()*10,idle:0,flee:0,t0:0,vx:0,vy:0,vz:0};this.list.push(ch);return ch;}return null;}
 update(dt,px,pz,count,vehicles,ev){const W=this.W;// maintain population around the player
  for(let i=this.list.length-1;i>=0;i--){const c=this.list[i];if(c.keep)continue;if(Math.hypot(c.x-px,c.z-pz)>170){this.list.splice(i,1);}}
  let n=0;while(this.list.filter(c=>!c.keep).length<count&&n++<4)this.spawn(px,pz,this.list.length<count*.5?20:90,150);
  const tmp={};for(const c of this.list){c.t0=(c.t0||0)+dt;c.tt=(c.tt||0)+dt;c.t=c.t;if(c.custom){c.custom(c,dt);animate(c,dt);continue;}
   if(c.state==='tumble'||c.state==='prone'||c.state==='getup'||c.state==='dive'){this.ragdoll(c,dt);animate(c,dt);continue;}
   // threat check: speeding vehicle heading at us -> dive aside
   for(const v of vehicles){const sp=v.speed;if(sp<6.5||v.wrecked)continue;const dx=c.x-v.x,dz=c.z-v.z;if(dx*dx+dz*dz>26*26)continue;if(Math.abs(c.y-v.y)>2.5)continue;
    const T=.9,ex=v.x+v.vx*T,ez=v.z+v.vz*T;const sx=ex-v.x,sz=ez-v.z,L2=sx*sx+sz*sz;let u=((c.x-v.x)*sx+(c.z-v.z)*sz)/L2;u=cl(u,0,1);const qx=v.x+sx*u-c.x,qz=v.z+sz*u-c.z;const d=Math.hypot(qx,qz);
    if(d<v.wid/2+1.4){const hitNow=Math.hypot(dx,dz)<v.r+.6&&u<.15;if(hitNow){this.knock(c,v);ev('pedhit',c,v);}else{this.dive(c,v);ev('peddive',c,v);}break;}}
   if(c.state!=='walk'&&c.state!=='idle'&&c.state!=='wave'&&c.state!=='fist'&&c.state!=='run'){animate(c,dt);continue;}
   if(c.flee>0){c.flee-=dt;}
   if(c.idle>0){c.idle-=dt;c.spd*=Math.exp(-dt*6);c.state=c.fistT>0?'fist':'idle';if(c.fistT>0)c.fistT-=dt;}else{if(this.R()<dt*.025)c.idle=1.5+this.R()*4;
    const sp=c.flee>0?5.2:c.base;c.spd+=(sp-c.spd)*Math.min(1,dt*4);c.t+=c.dir*c.spd*dt;const p=this.at(c.w,c.t,tmp);const ox=c.x,oz=c.z;const kk=Math.min(1,dt*5);c.x+=(p.x-c.x)*kk;c.z+=(p.z-c.z)*kk;const dd=Math.hypot(c.x-ox,c.z-oz);if(dd>1e-3)c.yaw+=wrapA(Math.atan2(c.x-ox,c.z-oz)-c.yaw)*Math.min(1,dt*8);c.state='walk';
    // side-step around the on-foot player
    c.y=W.groundAt(c.x,c.z,c.y+.6);}
   animate(c,dt);}}
 dive(c,v){const vx=v.vx,vz=v.vz,l=Math.hypot(vx,vz)||1;let px=-vz/l,pz=vx/l;const side=Math.sign((c.x-v.x)*px+(c.z-v.z)*pz)||1;c.state='dive';c.vx=px*side*5.2;c.vz=pz*side*5.2;c.vy=3;c.yaw=Math.atan2(c.vx,c.vz);c.dt=0;c.flee=4;}
 knock(c,v){c.state='tumble';c.vx=v.vx*.55+(Math.random()-.5)*3;c.vz=v.vz*.55+(Math.random()-.5)*3;c.vy=4+v.speed*.12;c.spinX=0;c.spinZ=0;c.flip=Math.random()<.5;c.dt=0;c.flee=5;}
 ragdoll(c,dt){const W=this.W;c.dt=(c.dt||0)+dt;if(c.state==='dive'||c.state==='tumble'){c.vy-=18*dt;c.x+=c.vx*dt;c.z+=c.vz*dt;c.y+=c.vy*dt;if(c.state==='tumble'){c.spinX+=dt*10;c.spinZ+=dt*4;}
   W.collide(c.x,c.z,.3,c.y+.3,c.y+1.4,_c);if(_c.hit){c.x+=_c.px;c.z+=_c.pz;c.vx*=-.2;c.vz*=-.2;}const g=W.groundAt(c.x,c.z,c.y+.6);
   if(c.y<=g&&c.vy<0){c.y=g;c.vx*=.4;c.vz*=.4;if(Math.hypot(c.vx,c.vz)<1.2||c.dt>1.6){c.state='prone';c.dt=0;}else c.vy=1.5;}}
  else if(c.state==='prone'){c.dt+=0;if(c.dt>(c.hard?1.6:.7)){c.state='getup';c.getT=0;}}
  else if(c.state==='getup'){c.getT+=dt/.8;if(c.getT>=1){c.state='walk';c.idle=.6;c.fistT=.6+Math.random();c.y=W.groundAt(c.x,c.z,c.y+1);// rejoin the nearest point of our sidewalk loop
    const w=c.w;const W2=w.x1-w.x0,D=w.z1-w.z0;let best=c.t,bd=1e9;for(let t=0;t<2*(W2+D);t+=2){const p=this.at(w,t,{});const d=Math.hypot(p.x-c.x,p.z-c.z);if(d<bd){bd=d;best=t;}}c.t=best;}}}
 draw(crowd){for(const c of this.list)crowd.draw(c);}}
