// TIDEWAY COURIER — courier karts: model, driving physics (throttle, brake, steer, hop-drift with three charge tiers,
// boosts, walls you slide off, water you fall into), ordered checkpoints and lap counting, CPU driving.
import * as THREE from '../vendor/three.module.min.js';
import {cl,lerp,wrapA,M4,merge} from './util.js';
import {query,at,yawAt,ds,onPad,DEEP,SHOAL} from './track.js';
export const DRIFT_LV=[.75,1.6,2.6],BOOST_T=[0,.7,1.15,1.7],BOOST_POW=[1,1.26,1.32,1.4],TOP=27;
// difficulty: rival top speed, cornering, rubber band, whether they charge drifts
export const DIFF=[{n:'EASY',top:.86,corner:.86,rub:.05,drift:0,limit:160},{n:'NORMAL',top:.95,corner:.96,rub:.04,drift:.5,limit:130},{n:'HARD',top:1.02,corner:1.07,rub:.03,drift:1,limit:110}];
export const COURIERS=[{n:'YOU',c:0xffc531,c2:0x1f8fa8,num:7},{n:'MARLO',c:0xff6a4d,c2:0xfff0d8,num:3},{n:'PIP',c:0x46c9a0,c2:0x184a5a,num:5},{n:'SABLE',c:0x9a7cf0,c2:0xfff4c8,num:9}];

export function newRacer(d,o={}){return{d,name:d.n,human:!!o.human,ghost:!!o.ghost,p:new THREE.Vector3(),yaw:0,v:0,vl:0,vy:0,air:false,steerV:0,
 drift:{on:false,dir:0,t:0,lvl:0,arm:false},prevDrift:false,zipT:0,zipPow:1,boostLv:0,hop:0,q:{},idx:-1,
 lap:0,next:1,lastCp:0,fin:0,prog:0,place:1,fallT:0,fallen:false,bumpT:0,bumpN:0,stuckT:0,offT:0,wade:0,
 parcel:false,deliveries:0,boosts:0,walls:0,falls:0,resets:0,lapStart:0,lapTimes:[],bestLap:0,inp:{gas:0,brake:0,steer:0,drift:false},ai:{lane:0,dt:0,dHold:0},wrongT:0,squash:0};}

/* ---------- model ---------- */
const mats={};function mat(c,o={}){const k=c+'_'+JSON.stringify(o);return mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color:c,roughness:o.r??.55,metalness:o.m??0,emissive:o.e??0,emissiveIntensity:o.ei??1,transparent:!!o.t,opacity:o.t??1,flatShading:!!o.flat}));}
export function makeKart(d){const g=new THREE.Group(),body=new THREE.Group();g.add(body);
 const vc=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.05});
 const C1=d.c,C2=d.c2,DK=0x2a2833;
 const shell=merge([[new THREE.BoxGeometry(1.5,.38,2.3),M4(0,.5,0),C1],[new THREE.BoxGeometry(1.3,.26,.5),M4(0,.52,1.25),DK],[new THREE.BoxGeometry(1.6,.16,.36),M4(0,.38,1.42),C2],
  [new THREE.BoxGeometry(1.2,.36,.7),M4(0,.82,.55,-.35,0,0),C1],[new THREE.BoxGeometry(1.0,.06,.42),M4(0,1.02,.42,-.35,0,0),0xbfe8ff],[new THREE.BoxGeometry(1.62,.14,2.0),M4(0,.32,-.05),DK],
  [new THREE.BoxGeometry(1.25,.5,.18),M4(0,.85,-.35),C2],[new THREE.CylinderGeometry(.09,.09,.22,8),M4(-.45,.55,-1.2,Math.PI/2),0x8a8a92],[new THREE.CylinderGeometry(.09,.09,.22,8),M4(.45,.55,-1.2,Math.PI/2),0x8a8a92],
  // cargo crate frame
  [new THREE.BoxGeometry(1.3,.08,.95),M4(0,.74,-.78),0x9a6a3a],[new THREE.BoxGeometry(.08,.5,.95),M4(-.62,1.0,-.78),0x9a6a3a],[new THREE.BoxGeometry(.08,.5,.95),M4(.62,1.0,-.78),0x9a6a3a],[new THREE.BoxGeometry(1.3,.5,.08),M4(0,1.0,-1.22),0x9a6a3a],
  // headlights
  [new THREE.SphereGeometry(.12,10,8),M4(-.5,.58,1.5),0xfff6c8],[new THREE.SphereGeometry(.12,10,8),M4(.5,.58,1.5),0xfff6c8]]);
 const sm=new THREE.Mesh(shell,vc);sm.castShadow=true;body.add(sm);
 // number board on the crate (readable, not colour-only)
 const nc=document.createElement('canvas');nc.width=128;nc.height=64;const x=nc.getContext('2d');x.fillStyle='#fff8e8';x.fillRect(0,0,128,64);x.fillStyle='#2a2833';x.font='bold 52px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(d.num),64,35);
 const nt=new THREE.CanvasTexture(nc);nt.colorSpace=THREE.SRGBColorSpace;const nb=new THREE.Mesh(new THREE.PlaneGeometry(.62,.31),new THREE.MeshStandardMaterial({map:nt,roughness:.6}));nb.position.set(0,1.02,-1.27);nb.rotation.y=Math.PI;body.add(nb);
 // driver: round helmet, visor, scarf
 const drv=merge([[new THREE.CapsuleGeometry(.3,.35,4,10),M4(0,1.12,.05),C2],[new THREE.SphereGeometry(.33,16,12),M4(0,1.66,.05),C1],[new THREE.SphereGeometry(.34,16,12,0,Math.PI*2,0,Math.PI*.5),M4(0,1.7,.05),0xfafafa],
  [new THREE.BoxGeometry(.48,.16,.1),M4(0,1.64,.36),0x23384a],[new THREE.TorusGeometry(.26,.07,6,14),M4(0,1.38,.05,Math.PI/2),0xff5a3a],[new THREE.CapsuleGeometry(.08,.3,3,6),M4(-.32,1.18,.35,-1.1,0,.3),C2],[new THREE.CapsuleGeometry(.08,.3,3,6),M4(.32,1.18,.35,-1.1,0,-.3),C2]]);
 const dm=new THREE.Mesh(drv,vc);dm.castShadow=true;body.add(dm);
 // parcel (shown while carrying)
 const pc=new THREE.Group();const box=new THREE.Mesh(merge([[new THREE.BoxGeometry(.9,.6,.7),M4(0,0,0),0xd9a25c],[new THREE.BoxGeometry(.92,.62,.14),M4(0,0,0),0xfff1c8],[new THREE.BoxGeometry(.14,.62,.72),M4(0,0,0),0xfff1c8]]),vc);box.castShadow=true;pc.add(box);pc.position.set(0,1.12,-.78);body.add(pc);pc.visible=false;
 // wheels
 const wg=merge([[new THREE.CylinderGeometry(.34,.34,.3,16),M4(0,0,0,0,0,Math.PI/2),0x26242c],[new THREE.CylinderGeometry(.2,.2,.32,10),M4(0,0,0,0,0,Math.PI/2),0xeae4d8]]);
 const wheels=[];for(const[wx,wz]of[[-.78,.85],[.78,.85],[-.8,-.8],[.8,-.8]]){const w=new THREE.Mesh(wg,vc);w.position.set(wx,.34,wz);w.castShadow=true;const piv=new THREE.Group();piv.position.copy(w.position);w.position.set(0,0,0);piv.add(w);body.add(piv);wheels.push(piv);}
 // little pennant on a whip antenna
 const ant=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.1,4),mat(0x333333));ant.position.set(.55,1.5,-1.15);body.add(ant);
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(.4,.24),new THREE.MeshStandardMaterial({color:C1,side:THREE.DoubleSide,roughness:.7}));fl.position.set(.75,1.95,-1.15);body.add(fl);
 const sh=new THREE.Mesh(new THREE.CircleGeometry(1.25,20),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.28,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.scale.set(.85,1.2,1);sh.position.y=.04;g.add(sh);
 g.userData={body,wheels,parcel:pc,flag:fl,drv:dm,shadow:sh};return g;}
export function ghostify(g){g.traverse(o=>{if(o.isMesh){o.material=new THREE.MeshBasicMaterial({color:0x9ef3ff,transparent:true,opacity:.28,depthWrite:false});o.castShadow=false;}});g.userData.shadow.visible=false;return g;}

export function poseKart(r,dt,t){const g=r.g,u=g.userData;g.position.set(r.p.x,r.p.y,r.p.z);g.rotation.y=r.yaw;
 const dr=r.drift.on?r.drift.dir:0;u.body.rotation.y=lerp(u.body.rotation.y,dr*.38,Math.min(1,dt*8));u.body.rotation.z=lerp(u.body.rotation.z,-r.steerV*.06*cl(r.v/20,0,1)-dr*.06,Math.min(1,dt*6));
 const sq=r.squash;u.body.scale.set(1+sq*.12,1-sq*.18,1+sq*.06);u.body.position.y=r.fallT>0?-Math.min(1.4,(1.4-r.fallT)*1.2):0;
 r.spin=(r.spin||0)+r.v*dt/.34;for(let k=0;k<4;k++){const w=u.wheels[k];w.children[0].rotation.x=r.spin;if(k<2)w.rotation.y=r.steerV*.45;}
 u.parcel.visible=r.parcel;u.flag.rotation.y=Math.sin(t*9+r.d.num)*.4-.3;u.flag.position.y=1.95+Math.sin(t*7)*.02;}

/* ---------- physics ---------- */
const HALF=1.25;
export function place(T,r,i,u=0){at(T,i,u,r.p);r.yaw=yawAt(T,i);r.idx=((Math.round(i)%T.B.n)+T.B.n)%T.B.n;r.v=0;r.vl=0;r.vy=0;r.air=false;r.drift.on=false;r.drift.arm=false;r.zipT=0;query(T,r.p.x,r.p.z,r.idx,r.q);r.sPrev=r.q.s;}
export function topSpeed(r){return TOP*(r.human?1:r.topMul||1);}

export function stepRacer(T,r,dt,env){const I=r.inp,q=r.q,B=T.B;
 r.zipT=Math.max(0,r.zipT-dt);r.bumpT=Math.max(0,r.bumpT-dt);r.squash=Math.max(0,r.squash-dt*3);
 if(r.fallT>0){r.fallT-=dt;r.v*=Math.pow(.05,dt);r.p.x+=Math.sin(r.yaw)*r.v*dt;r.p.z+=Math.cos(r.yaw)*r.v*dt;
  if(r.fallT<=.5&&!r.fallen){r.fallen=true;respawn(T,r);env.respawn&&env.respawn(r);}
  if(r.fallT<=0){r.fallT=0;r.fallen=false;r.bumpT=1;}return;}
 const frozen=env.frozen;let top=topSpeed(r),acc=19*(r.human?1:r.accMul||1);
 const off=Math.abs(q.u)>q.w+.3,ground=off?T.H.h(r.p.x,r.p.z):0,wading=off&&ground<.05;r.wade=wading?1:0;
 let surf=1;if(off&&!r.air){surf=wading?.5:.68;}
 if(r.zipT>0){top*=r.zipPow;acc*=2.6;surf=Math.max(surf,.85);}top*=surf;
 // speed
 const gas=frozen?0:I.gas,br=frozen?0:I.brake;
 if(gas>0&&r.v<top)r.v=Math.min(top,r.v+acc*gas*dt*(1-.5*cl(r.v/top,0,1))+(r.v<6?5*dt:0));
 else if(br>0){r.v=Math.max(-8,r.v-(r.v>0?34:10)*br*dt);}
 else{r.v-=r.v*.6*dt;if(Math.abs(r.v)<.2&&!gas)r.v=0;}
 if(r.v>top)r.v=Math.max(top,r.v-(r.v-top)*(wading?4:2.2)*dt);
 // steering + drift (hop on press; once airborne-hop lands with a held direction the drift charges)
 const sf=cl(Math.abs(r.v)/7,0,1)*(1-.22*cl(r.v/TOP,0,1.2));let turn=0;
 r.steerV+=((I.steer||0)-r.steerV)*Math.min(1,dt*(Math.abs(I.steer)>Math.abs(r.steerV)?9:13));
 const dPress=I.drift&&!r.prevDrift,dRel=!I.drift&&r.prevDrift;
 if(!frozen){
  if(dPress&&!r.air&&r.v>4){r.vy=3.6;r.air=true;r.hop=1;r.drift.arm=true;env.hop&&env.hop(r);}
  if(!I.drift)r.drift.arm=false;
  if(r.drift.arm&&!r.air&&!r.drift.on&&Math.abs(I.steer)>.25&&r.v>10&&!wading){r.drift.on=true;r.drift.dir=Math.sign(I.steer);r.drift.t=0;r.drift.lvl=0;env.driftStart&&env.driftStart(r);}
  if(r.drift.on){if(!I.drift||r.v<7||wading||r.bumpT>.5){const lv=r.drift.lvl;if(lv>0&&I.drift===false&&!wading&&r.bumpT<=.5){r.zipT=Math.max(r.zipT,BOOST_T[lv]);r.zipPow=BOOST_POW[lv];r.boostLv=lv;r.boosts++;env.boost&&env.boost(r,lv);}else env.driftCancel&&env.driftCancel(r);r.drift.on=false;}
   else{const inner=I.steer*r.drift.dir;if(!r.air){r.drift.t+=dt*(.7+.8*Math.max(0,inner));const lv=r.drift.t>=DRIFT_LV[2]?3:r.drift.t>=DRIFT_LV[1]?2:r.drift.t>=DRIFT_LV[0]?1:0;if(lv>r.drift.lvl){r.drift.lvl=lv;env.driftLv&&env.driftLv(r,lv);}}
    turn=r.drift.dir*(.62+.5*inner)*2.0*sf;}}
  if(!r.drift.on)turn=r.steerV*2.05*sf;if(r.air)turn*=.6;r.yaw+=turn*dt*(r.v<0?-1:1);}
 r.prevDrift=I.drift;r.turn=turn;
 // move: forward speed + lateral slip (outward while drifting)
 const fx=Math.sin(r.yaw),fz=Math.cos(r.yaw);let grip=r.drift.on?4.2:11;if(r.air)grip=.6;r.vl*=Math.exp(-grip*dt);if(r.drift.on&&!r.air)r.vl+=-r.drift.dir*Math.min(r.v,30)*.38*dt;
 r.p.x+=(fx*r.v+fz*r.vl)*dt;r.p.z+=(fz*r.v-fx*r.vl)*dt;
 query(T,r.p.x,r.p.z,r.idx,q);r.idx=q.i;
 // quay walls and bridge rails: slide along, lose the speed going into the wall, turn toward the road
 if(q.wall>0){const lim=q.w+q.wall-.75;if(Math.abs(q.u)>lim){const s=Math.sign(q.u),over=Math.abs(q.u)-lim;r.p.x-=q.nx*s*over;r.p.z-=q.nz*s*over;
  const vx=fx*r.v+fz*r.vl,vz=fz*r.v-fx*r.vl,vn=(vx*q.nx+vz*q.nz)*s;
  if(vn>.5){const hit=vn/Math.max(4,Math.abs(r.v));r.v*=1-cl(hit*.75,.06,.7);r.vl*=.2;if(r.drift.on&&hit>.35){r.drift.on=false;env.driftCancel&&env.driftCancel(r);}
   let ty=Math.atan2(q.tx,q.tz);if(Math.cos(ty-r.yaw)<0)ty+=Math.PI;r.yaw+=wrapA(ty-r.yaw)*cl(hit*1.2,.12,.6);r.bumpT=.35;r.walls++;r.squash=Math.min(1,hit*1.5);env.wall&&env.wall(r,vn);}}}
 // static props (trees, lamps, the lighthouse)
 if(env.cols){for(const c of env.cols(r.p.x,r.p.z)){const dx=r.p.x-c.x,dz=r.p.z-c.z,d=Math.hypot(dx,dz),R=c.r+HALF*.8;if(d<R&&d>1e-4){const nx=dx/d,nz=dz/d;r.p.x+=nx*(R-d);r.p.z+=nz*(R-d);
  const vn=-(fx*nx+fz*nz)*r.v;if(vn>.5){r.v*=.55;r.bumpT=.35;r.walls++;env.wall&&env.wall(r,vn);}{let ty=Math.atan2(q.tx,q.tz);if(Math.cos(ty-r.yaw)<0)ty+=Math.PI;r.yaw+=wrapA(ty-r.yaw)*.1;}}}}
 // vertical
 const on=Math.abs(q.u)<=q.w+.3||q.bridge&&Math.abs(q.u)<=q.w+q.wall;let gy=on?q.roadY:Math.max(T.H.h(r.p.x,r.p.z),SHOAL);
 if(!on&&!q.bridge&&T.H.h(r.p.x,r.p.z)<DEEP&&!r.air){r.fallT=1.3;r.falls++;r.drift.on=false;r.zipT=0;env.splash&&env.splash(r);return;}
 if(r.air||r.p.y>gy+.15){if(!r.air){r.air=true;}r.vy-=28*dt;r.p.y+=r.vy*dt;if(r.p.y<=gy){r.p.y=gy;const imp=-r.vy;r.vy=0;r.air=false;r.hop=0;if(imp>2.5){r.squash=Math.min(1,imp/9);env.land&&env.land(r,imp);}}}
 else r.p.y=lerp(r.p.y,gy,Math.min(1,dt*20));
 if(r.p.y<gy-.3)r.p.y=gy;
 r.offT=off&&!r.air?r.offT+dt:0;
 // stuck against something with the throttle down: the HUD offers a reset after a while
 r.stuckT=gas>0&&Math.abs(r.v)<2&&!frozen?r.stuckT+dt:0;
 progress(T,r,env);
 if(env.pads)env.pads(r);}

// put a racer back at its last checkpoint, on the racing line, pointing the right way
export function respawn(T,r){const cp=T.cps[r.lastCp];place(T,r,cp.i+2,T.B.line[cp.i]*.5);r.p.y+=.2;}

// checkpoint gates: crossing gate k forward (in order) moves r.next on; crossing the start line with every gate done counts a lap.
// Going backwards over the last gate you passed un-passes it, so reversing over the line can never add a lap.
export function progress(T,r,env){const s=r.q.s,sp=r.sPrev??s;r.sPrev=s;const d=ds(T,sp,s);if(Math.abs(d)>25)return;const L=T.B.len,N=T.cps.length;
 const crossed=g=>{const a=sp,b=sp+d;return d>0?(a<g&&b>=g)||(a<g+L&&b>=g+L)||(a<g-L&&b>=g-L):(a>=g&&b<g)||(a>=g+L&&b<g+L)||(a>=g-L&&b<g-L);};
 const tgt=r.next%N,cp=T.cps[tgt];
 if(d>0&&crossed(cp.s)){if(tgt===0){r.lap++;r.next=1;r.lastCp=0;env.lap&&env.lap(r);}else{r.next++;r.lastCp=tgt;env.cp&&env.cp(r,tgt);}}
 else if(d<0){const prev=(r.next-1+N)%N,pc=T.cps[prev];if(crossed(pc.s)){if(prev===0){if(r.lap>0){r.lap--;r.next=N;r.lastCp=N-1;env.unlap&&env.unlap(r);}}else{r.next--;r.lastCp=(r.next-1+N)%N;}}}
 // race progress for ranking: completed laps + gates + distance toward the next gate
 const nx=T.cps[r.next%N],prv=T.cps[(r.next-1+N)%N];let seg=ds(T,prv.s,nx.s);if(seg<=0)seg+=L;const into=cl(ds(T,prv.s,s),-10,seg);
 r.prog=r.lap*N+(r.next-1)+into/seg;
 // wrong-way: facing against the road for a while
 const fwd=Math.sin(r.yaw)*r.q.tx+Math.cos(r.yaw)*r.q.tz;r.wrongT=fwd<-.3&&Math.abs(r.v)>3?r.wrongT+1/60:Math.max(0,r.wrongT-1/30);}

/* ---------- racer contact ---------- */
export function collide(rs,env){for(let a=0;a<rs.length;a++)for(let b=a+1;b<rs.length;b++){const A=rs[a],B=rs[b];if(A.fallT>0||B.fallT>0)continue;
 const dx=B.p.x-A.p.x,dz=B.p.z-A.p.z,d=Math.hypot(dx,dz),R=HALF*2;if(d<R&&d>1e-4){const nx=dx/d,nz=dz/d,ov=(R-d)/2;A.p.x-=nx*ov;A.p.z-=nz*ov;B.p.x+=nx*ov;B.p.z+=nz*ov;
  const sa=nx*Math.cos(A.yaw)-nz*Math.sin(A.yaw),sb=nx*Math.cos(B.yaw)-nz*Math.sin(B.yaw);A.vl-=sa*3;B.vl+=sb*3;const dv=B.v-A.v;A.v+=dv*.1;B.v-=dv*.1;env.bump&&env.bump(A,B,ov);}}}

/* ---------- CPU couriers ---------- */
export function think(T,r,dt,diff,player){const B=T.B,n=B.n,q=r.q,I=r.inp,a=r.ai;a.dt-=dt;
 if(a.dt<=0){a.dt=1.5+Math.random()*2;a.lane=(Math.random()-.5)*.4;}
 const look=Math.round(a.forceU!=null?3+r.v*.16:5+r.v*.32),i=(q.i+look)%n,tu=a.forceU!=null?a.forceU:cl(B.line[i]+a.lane*B.w[i],-B.w[i]+1.6,B.w[i]-1.6);const tp=at(T,i,tu);
 const want=Math.atan2(tp.x-r.p.x,tp.z-r.p.z);let e=wrapA(want-r.yaw);
 // back on course after a respawn or a spin: steer hard toward the line
 I.steer=cl(e*2.4,-1,1);
 let vm=Infinity;for(let k=2;k<16;k++)vm=Math.min(vm,B.vmax[(q.i+k)%n]);let tgt=Math.min(TOP*r.topMul,vm*diff.corner);
 // rubber band toward the player (never past the player's own top speed)
 if(player&&!player.fin){const gap=(player.prog-r.prog)*T.B.len/T.cps.length;r.topMul=diff.top*(1+cl(gap/60,-1,1)*diff.rub);}
 if(Math.abs(q.u)>q.w)tgt*=.85;
 I.gas=r.v<tgt?1:0;I.brake=r.v>tgt+3?1:0;
 // drifting: hard couriers charge drifts through the long corners
 let c=1;for(let k=2;k<12;k+=3)c=Math.min(c,Math.abs(B.curv[(q.i+k)%n]));if(diff.drift&&a.forceU==null&&!a.dHold&&c>.022&&r.v>14&&Math.random()<diff.drift*dt*3){a.dHold=1.1+diff.drift*1.4;}
 // let go early when the slide carries the kart toward the outside edge
 const wide=r.drift.on&&Math.abs(q.u)>q.w-2.2;
 if(a.dHold>0){a.dHold-=dt;I.drift=true;if(a.dHold<=0||wide||Math.abs(B.curv[(q.i+3)%n])<.008){a.dHold=0;I.drift=false;}}else I.drift=false;
 if(r.stuckT>1.5){I.gas=0;I.brake=1;I.steer=-I.steer;if(r.stuckT>3)r.stuckT=0;}}
