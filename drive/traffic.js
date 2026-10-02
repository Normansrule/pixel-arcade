// NIGHT DRIVE — city life: lane-following traffic (with turn curves, yielding, wrecks), highway loop traffic, pedestrians that dodge
// (instanced rigs), and the police (pursuit AI, roadblocks, siren lights).
import * as THREE from '../vendor/three.module.min.js';
import {N,SP,HALF,WALK,HY,WORLD,rng} from './city.js';
import {carModel,Car,POLICE,aiInput} from './car.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,TAU=Math.PI*2;
const PAL=[0xd8d8e0,0x202028,0xb01818,0x1c4ab0,0xe0b020,0x1a7a4a,0x6a2a8a,0xff6a1a,0x8a8a92,0x3a2a1a,0x0a5a7a];
const SHAPES=['sedan','sedan','hatch','hatch','truck','sedan'];
const TSPEC={max:16,shape:'sedan'};
const bez=(p0,p1,p2,t,o)=>{const a=(1-t)*(1-t),b=2*(1-t)*t,c=t*t;o[0]=a*p0[0]+b*p1[0]+c*p2[0];o[1]=a*p0[1]+b*p1[1]+c*p2[1];return o;};

/* ================= traffic ================= */
export class Traffic{
 constructor(scene,city,count=34,hwyCount=12){this.scene=scene;this.city=city;this.cars=[];this.hwy=[];this.count=count;this.hwyCount=hwyCount;}
 clear(){for(const c of[...this.cars,...this.hwy])this.scene.remove(c.model);this.cars=[];this.hwy=[];}
 spawnAll(avoid){this.clear();for(let i=0;i<this.count;i++)this.spawn(avoid,true);for(let i=0;i<this.hwyCount;i++)this.spawnHwy();}
 newModel(){const shape=SHAPES[(R()*SHAPES.length)|0];const m=carModel({shape},PAL[(R()*PAL.length)|0],{noShadow:true});this.scene.add(m);return m;}
 spawn(avoid,any){const C=this.city;for(let t=0;t<40;t++){const e=C.edges[(R()*C.edges.length)|0];const A=C.nodes[e.a],B=C.nodes[e.b];if(!A.alive||!B.alive)continue;const fwd=R()<.5;const from=fwd?A:B,to=fwd?B:A;
   const s=HALF+3+R()*(SP-2*HALF-8);const lane=R()<.5?1.9:5.4;
   const c={model:this.newModel(),from,to,lane,want:10+R()*5,v:8,state:'drive',seg:null,s:0,x:0,z:0,y:0,a:0,vx:0,vz:0,w:0,honk:0,stuck:0};this.lineSeg(c,s);c.s=0;
   this.place(c);if(avoid&&!any&&Math.hypot(c.x-avoid.x,c.z-avoid.z)<120){this.scene.remove(c.model);continue;}if(avoid&&Math.hypot(c.x-avoid.x,c.z-avoid.z)<25){this.scene.remove(c.model);continue;}this.cars.push(c);return c;}}
 lineSeg(c,startAlong){const f=c.from,to=c.to,dx=Math.sign(to.x-f.x),dz=Math.sign(to.z-f.z);const L=Math.abs(to.x-f.x)+Math.abs(to.z-f.z);const a=startAlong??HALF+2,b=L-HALF-2;
  // drive on the right: right-hand normal of heading (dx,dz) is (-dz,dx)
  const ox=-dz*c.lane,oz=dx*c.lane;c.seg={type:'line',p0:[f.x+dx*a+ox,f.z+dz*a+oz],p1:[f.x+dx*b+ox,f.z+dz*b+oz],len:Math.max(.1,b-a)};c.s=0;}
 turnSeg(c){const C=this.city,B=c.to,A=c.from;const opts=B.nb.map(i=>C.nodes[i]).filter(n=>n!==A&&n.alive);const next=opts.length?opts[(R()*opts.length)|0]:A;
  const d1=[Math.sign(B.x-A.x),Math.sign(B.z-A.z)],d2=[Math.sign(next.x-B.x),Math.sign(next.z-B.z)];const o1=[-d1[1]*c.lane,d1[0]*c.lane],o2=[-d2[1]*c.lane,d2[0]*c.lane];
  const g=HALF+2;const p0=[B.x-d1[0]*g+o1[0],B.z-d1[1]*g+o1[1]],p2=[B.x+d2[0]*g+o2[0],B.z+d2[1]*g+o2[1]];
  let p1;if(d1[0]===d2[0]&&d1[1]===d2[1])p1=[(p0[0]+p2[0])/2,(p0[1]+p2[1])/2];else if(d1[0]===-d2[0]&&d1[1]===-d2[1])p1=[B.x+d1[0]*g,B.z+d1[1]*g];else p1=d1[0]?[p2[0],p0[1]]:[p0[0],p2[1]];
  const len=Math.hypot(p1[0]-p0[0],p1[1]-p0[1])+Math.hypot(p2[0]-p1[0],p2[1]-p1[1]);c.seg={type:'bez',p0,p1,p2,len:Math.max(1,len*.9)};c.s=0;c.from=B;c.to=next;}
 place(c){const sg=c.seg,t=cl(c.s/sg.len,0,1),o=[0,0];if(sg.type==='line'){o[0]=sg.p0[0]+(sg.p1[0]-sg.p0[0])*t;o[1]=sg.p0[1]+(sg.p1[1]-sg.p0[1])*t;}else bez(sg.p0,sg.p1,sg.p2,t,o);
  const dx=o[0]-c.x,dz=o[1]-c.z;if(dx*dx+dz*dz>1e-4)c.a=Math.atan2(dx,dz);c.x=o[0];c.z=o[1];c.y=this.city.heightAt(c.x,c.z,2);c.model.position.set(c.x,c.y,c.z);c.model.rotation.set(0,c.a,0);}
 spawnHwy(){const D=8;const dir=R()<.5?1:-1;const lane=dir>0?(R()<.5?2:5.5):-(R()<.5?2:5.5);const c={model:this.newModel(),hwy:true,dir,lane,p:R()*WORLD*4,v:18+R()*8,want:18+R()*8,state:'drive',x:0,z:0,y:HY,a:0,vx:0,vz:0,w:0};this.placeHwy(c);this.hwy.push(c);}
 placeHwy(c){const L=WORLD;let p=((c.p%(4*L))+4*L)%(4*L);let x,z,a;const off=c.lane;// loop: south edge z=0 going +x, east x=L going +z, north z=L going -x, west x=0 going -z
  if(p<L){x=p;z=off;a=Math.PI/2;}else if(p<2*L){x=L-off;z=p-L;a=0;}else if(p<3*L){x=3*L-p;z=L-off;a=-Math.PI/2;}else{x=off;z=4*L-p;a=Math.PI;}if(c.dir<0)a+=Math.PI;
  c.x=x;c.z=z;c.a=a;c.y=HY;c.model.position.set(x,HY,z);c.model.rotation.set(0,a,0);}
 update(dt,player,G){const P=player;for(const c of this.cars){if(c.state==='wreck'){this.wreckStep(c,dt);continue;}
   // yield: car ahead in lane or the player in front
   let want=c.want*(G.trafficK||1);const fx=Math.sin(c.a),fz=Math.cos(c.a);
   for(const o of this.cars){if(o===c)continue;const dx=o.x-c.x,dz=o.z-c.z;const ahead=dx*fx+dz*fz;if(ahead<=0||ahead>16)continue;const lat=Math.abs(dx*fz-dz*fx);if(lat>1.8)continue;want=Math.min(want,ahead<7?0:o.v*.9);}
   if(P){const dx=P.x-c.x,dz=P.z-c.z;const ahead=dx*fx+dz*fz;const lat=Math.abs(dx*fz-dz*fx);if(ahead>0&&ahead<18&&lat<2.6&&Math.abs(P.y-c.y)<3){want=Math.min(want,ahead<8?0:3);c.stuck+=dt;if(c.stuck>2.5&&c.honk<=0){c.honk=4;G.honk&&G.honk(c);}}else c.stuck=0;}
   c.honk-=dt;c.v+=(want-c.v)*Math.min(1,dt*(want<c.v?4:1.2));c.s+=c.v*dt;
   if(c.s>=c.seg.len){if(c.seg.type==='line')this.turnSeg(c);else this.lineSeg(c);}
   const ox=c.x,oz=c.z;this.place(c);c.vx=(c.x-ox)/Math.max(dt,1e-4);c.vz=(c.z-oz)/Math.max(dt,1e-4);}
  for(const c of this.hwy){if(c.state==='wreck'){this.wreckStep(c,dt);continue;}let want=c.want;const fx=Math.sin(c.a),fz=Math.cos(c.a);
   for(const o of[...this.hwy,P]){if(!o||o===c)continue;if(Math.abs(o.y-HY)>2)continue;const dx=o.x-c.x,dz=o.z-c.z;const ahead=dx*fx+dz*fz;if(ahead<=0||ahead>22)continue;if(Math.abs(dx*fz-dz*fx)>2)continue;want=Math.min(want,ahead<9?0:(o.v??Math.hypot(o.vx,o.vz))*.9);}
   c.v+=(want-c.v)*Math.min(1,dt*2);c.p+=c.v*c.dir*dt;const ox=c.x,oz=c.z;this.placeHwy(c);c.vx=(c.x-ox)/Math.max(dt,1e-4);c.vz=(c.z-oz)/Math.max(dt,1e-4);}
  // recycle far-away wrecks / respawn
  for(let i=this.cars.length-1;i>=0;i--){const c=this.cars[i];if(c.state==='wreck'&&c.wt>7&&(!P||Math.hypot(c.x-P.x,c.z-P.z)>60)){this.scene.remove(c.model);this.cars.splice(i,1);}}
  while(this.cars.length<this.count*(G.trafficK??1))if(!this.spawn(P,false))break;
  for(let i=this.hwy.length-1;i>=0;i--){const c=this.hwy[i];if(c.state==='wreck'&&c.wt>7){this.scene.remove(c.model);this.hwy.splice(i,1);this.spawnHwy();}}}
 knock(c,vx,vz,w){c.state='wreck';c.vx=vx;c.vz=vz;c.w=w;c.wt=0;}
 wreckStep(c,dt){c.wt+=dt;c.x+=c.vx*dt;c.z+=c.vz*dt;c.a+=c.w*dt;const k=Math.exp(-dt*1.6);c.vx*=k;c.vz*=k;c.w*=Math.exp(-dt*2);
  for(const s of this.city.near(c.x,c.z)){if(s.y1<c.y)continue;const qx=cl(c.x,s.x0,s.x1),qz=cl(c.z,s.z0,s.z1);const dx=c.x-qx,dz=c.z-qz,d=Math.hypot(dx,dz);if(d<1.6&&d>1e-3){c.x+=dx/d*(1.6-d);c.z+=dz/d*(1.6-d);const vn=c.vx*dx/d+c.vz*dz/d;if(vn<0){c.vx-=1.4*vn*dx/d;c.vz-=1.4*vn*dz/d;}}}
  c.model.position.set(c.x,c.y,c.z);c.model.rotation.set(0,c.a,0);}
 all(){return this.cars.concat(this.hwy);}}

/* ================= pedestrians (instanced) ================= */
const SKIN=[0xf0c8a0,0xd8a070,0xa86a40,0x6a4228,0xf8d8c0];const SHIRT=[0xd03030,0x3060d0,0xf0f0f0,0x202020,0x30a050,0xe0a020,0x8040c0,0xff6080,0x40c0c0,0x707070];
export class Peds{
 constructor(scene,city,count=80){this.scene=scene;this.city=city;this.n=count;this.list=[];const std=o=>new THREE.MeshStandardMaterial(o);
  const mk=(geo)=>{const m=new THREE.InstancedMesh(geo,std({color:0xffffff,roughness:.8}),count);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(count*3),3);m.castShadow=true;m.frustumCulled=false;scene.add(m);return m;};
  this.torso=mk(new THREE.BoxGeometry(.46,.62,.26));this.head=mk(new THREE.SphereGeometry(.15,10,8));this.legL=mk(new THREE.BoxGeometry(.17,.8,.18).translate(0,-.4,0));this.legR=mk(new THREE.BoxGeometry(.17,.8,.18).translate(0,-.4,0));
  this.armL=mk(new THREE.BoxGeometry(.12,.62,.13).translate(0,-.3,0));this.armR=mk(new THREE.BoxGeometry(.12,.62,.13).translate(0,-.3,0));
  this.m4=new THREE.Matrix4();this.q=new THREE.Quaternion();this.q2=new THREE.Quaternion();this.e=new THREE.Euler();this.v=new V();this.s=new V(1,1,1);this.c=new THREE.Color();
  const blocks=city.blocks.filter(b=>b.d!=='river'&&b.d!=='hill');for(let i=0;i<count;i++){const b=blocks[(R()*blocks.length)|0];this.list.push(this.make(b,i));}}
 make(b,i){const ins=WALK*.5;const x0=b.x0+ins,z0=b.z0+ins,x1=b.x1-ins,z1=b.z1-ins;const per=2*((x1-x0)+(z1-z0));const p={b,x0,z0,x1,z1,per,s:R()*per,dir:R()<.5?1:-1,sp:1.1+R()*.7,state:'walk',t:0,x:0,y:0,z:0,a:0,vx:0,vy:0,vz:0,ph:R()*6,spin:0,i,
  skin:SKIN[(R()*5)|0],shirt:SHIRT[(R()*SHIRT.length)|0],pants:[0x202430,0x3a3a40,0x2a4060,0x504030][(R()*4)|0],h:.92+R()*.16};this.loopPos(p);return p;}
 loopPos(p){let s=((p.s%p.per)+p.per)%p.per;const w=p.x1-p.x0,d=p.z1-p.z0;let x,z,a;if(s<w){x=p.x0+s;z=p.z0;a=Math.PI/2;}else if(s<w+d){x=p.x1;z=p.z0+s-w;a=0;}else if(s<2*w+d){x=p.x1-(s-w-d);z=p.z1;a=-Math.PI/2;}else{x=p.x0;z=p.z1-(s-2*w-d);a=Math.PI;}if(p.dir<0)a+=Math.PI;return[x,z,a];}
 // car: {x,z,vx,vz,speed}; returns list of peds hit this frame
 update(dt,car,G){const hits=[];const sp=car?Math.hypot(car.vx,car.vz):0;
  for(const p of this.list){p.t+=dt;
   if(p.state==='walk'||p.state==='flee'){p.s+=p.sp*p.dir*dt*(p.state==='flee'?2.6:1);const[x,z,a]=this.loopPos(p);p.x=x;p.z=z;p.a=a;p.y=.18;p.ph+=dt*p.sp*(p.state==='flee'?9:5.5);if(p.state==='flee'&&p.t>3)p.state='walk';
    // danger check: car heading at us
    if(car&&sp>6&&Math.abs(car.y-p.y)<2){const dx=p.x-car.x,dz=p.z-car.z,d=Math.hypot(dx,dz);if(d<14){const fx=car.vx/sp,fz=car.vz/sp;const ahead=dx*fx+dz*fz,lat=dx*fz-dz*fx;const tti=ahead/sp;
      if(ahead>0&&Math.abs(lat)<2.4&&tti<.9){// dive sideways away from the car's path
       const side=lat>=0?1:-1;p.state='dive';p.t=0;p.vx=fz*side*6.5;p.vz=-fx*side*6.5;p.vy=4.2;p.a=Math.atan2(p.vx,p.vz);G&&G.pedEvent&&G.pedEvent('dive',p);}
      else if(d<6&&p.state==='walk'){p.state='flee';p.t=0;}}}}
   else if(p.state==='dive'||p.state==='fly'){p.vy-=20*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;p.y+=p.vy*dt;if(p.state==='fly')p.spin+=dt*8;const g=this.city.heightAt(p.x,p.z,p.y+.5)+.05;if(p.y<=g&&p.vy<0){p.y=g;p.vy=0;p.vx*=.3;p.vz*=.3;p.state='down';p.t=0;}
    for(const s of this.city.near(p.x,p.z)){if(s.kind!=='bld'&&s.kind!=='hill')continue;if(p.x>s.x0&&p.x<s.x1&&p.z>s.z0&&p.z<s.z1){p.vx*=-.3;p.vz*=-.3;p.x+=p.vx*dt*3;p.z+=p.vz*dt*3;}}}
   else if(p.state==='down'){p.x+=p.vx*dt;p.z+=p.vz*dt;p.vx*=.9;p.vz*=.9;if(p.t>(p.wasHit?2.2:.7)){p.state='return';p.t=0;p.wasHit=false;p.spin=0;}}
   else if(p.state==='return'){const[x,z]=this.loopPos(p);const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.3){p.state='walk';}else{p.x+=dx/d*1.6*dt;p.z+=dz/d*1.6*dt;p.a=Math.atan2(dx,dz);p.ph+=dt*8;}p.y=Math.max(this.city.heightAt(p.x,p.z,2),0)+.05;}
   else if(p.state==='wave'){p.ph+=dt*6;}
   // hit by the car?
   if(car&&sp>4&&p.state!=='fly'&&p.state!=='down'&&Math.abs(car.y-p.y)<2){const dx=p.x-car.x,dz=p.z-car.z;const fx=Math.sin(car.a),fz=Math.cos(car.a);const along=dx*fx+dz*fz,lat=dx*fz-dz*fx;if(Math.abs(along)<2.5&&Math.abs(lat)<1.25){p.state='fly';p.t=0;p.wasHit=true;p.vx=car.vx*.7+(R()-.5)*3;p.vz=car.vz*.7+(R()-.5)*3;p.vy=3+sp*.18;hits.push(p);}}}
  this.draw();return hits;}
 draw(){const{m4,q,q2,e,v,s,c}=this;for(const p of this.list){const lying=p.state==='down'?1:0;const diving=p.state==='dive'||p.state==='fly';const sw=p.state==='walk'||p.state==='flee'||p.state==='return'?Math.sin(p.ph):0;
   e.set(lying?-Math.PI/2:diving?-1.1:0,p.a,p.spin,'YXZ');q.setFromEuler(e);const base=v.set(p.x,p.y,p.z);const H=p.h;
   const put=(im,ox,oy,oz,rx,col,sc=1)=>{const off=new V(ox,oy,oz).multiplyScalar(H).applyQuaternion(q);q2.setFromEuler(new THREE.Euler(rx,0,0));const qq=q.clone().multiply(q2);m4.compose(off.add(base),qq,s.set(sc,sc,sc));im.setMatrixAt(p.i,m4);c.setHex(col);im.setColorAt(p.i,c);};
   const wave=p.state==='wave'?Math.sin(p.ph)*.5:0;
   put(this.torso,0,lying?.25:1.2,0,0,p.shirt);put(this.head,0,lying?.25:1.66,lying?.7:0,0,p.skin);put(this.legL,-.11,lying?.25:.9,0,sw*.6,p.pants);put(this.legR,.11,lying?.25:.9,0,-sw*.6,p.pants);
   put(this.armL,-.31,lying?.25:1.48,0,diving?-2.6:-sw*.5,p.shirt);put(this.armR,.31,lying?.25:1.48,0,diving?-2.6:p.state==='wave'?-2.5+wave:sw*.5,p.shirt);}
  for(const im of[this.torso,this.head,this.legL,this.legR,this.armL,this.armR]){im.instanceMatrix.needsUpdate=true;im.instanceColor.needsUpdate=true;}}}

/* ================= police ================= */
export class Police{
 constructor(scene,city){this.scene=scene;this.city=city;this.cops=[];this.blocks=[];this.lightR=new THREE.MeshBasicMaterial({color:new THREE.Color(4,.2,.3)});this.lightB=new THREE.MeshBasicMaterial({color:new THREE.Color(.3,.6,4)});}
 clear(){for(const c of this.cops)this.scene.remove(c.model);for(const b of this.blocks)for(const m of b.meshes)this.scene.remove(m);this.cops=[];this.blocks=[];}
 makeCop(x,z,a,parked){const m=carModel(POLICE,null,{noShadow:false});const r=new THREE.Mesh(new THREE.BoxGeometry(.62,.2,.36),this.lightR),b=new THREE.Mesh(new THREE.BoxGeometry(.62,.2,.36),this.lightB);r.position.set(-.32,1.52,-.25);b.position.set(.32,1.52,-.25);m.add(r,b);
  const car=new Car(POLICE,m);car.place(x,z,a,this.city);car.lr=r;car.lb=b;car.parked=parked;car.route=null;car.routeT=0;car.wp=0;car.stuckT=0;this.scene.add(m);return car;}
 spawn(player){const C=this.city;for(let t=0;t<30;t++){const n=C.nodes[(R()*C.nodes.length)|0];if(!n.alive||!n.nb.length)continue;const d=Math.hypot(n.x-player.x,n.z-player.z);if(d<90||d>200)continue;const o=C.nodes[n.nb[0]];const a=Math.atan2(o.x-n.x,o.z-n.z);const c=this.makeCop(n.x,n.z,a,false);this.cops.push(c);return c;}return null;}
 roadblock(player,G){// across the road ~130 m ahead of the player's heading
  const C=this.city;const fx=Math.sin(player.a),fz=Math.cos(player.a);let best=null,bd=1e9;for(const n of C.nodes){if(!n.alive||!n.nb.length)continue;const dx=n.x-player.x,dz=n.z-player.z;const ahead=dx*fx+dz*fz,d=Math.hypot(dx,dz);if(ahead<90||d>200)continue;const sc=Math.abs(d-140)+Math.abs(dx*fz-dz*fx)*1.5;if(sc<bd){bd=sc;best=n;}}
  if(!best)return;const ax=Math.abs(fx)>Math.abs(fz)?'x':'z';const meshes=[];const cars=[];for(const off of[-3.5,3.5]){const x=ax==='x'?best.x:best.x+off,z=ax==='x'?best.z+off:best.z;const c=this.makeCop(x,z,(ax==='x'?0:Math.PI/2)+(off>0?.3:-.3),true);cars.push(c);this.cops.push(c);}
  const bar=new THREE.Mesh(new THREE.BoxGeometry(ax==='x'?.4:12,1,ax==='x'?12:.4),new THREE.MeshStandardMaterial({color:0xff6a00,emissive:0xff4000,emissiveIntensity:.4}));bar.position.set(best.x+(ax==='x'?-4:0),.5,best.z+(ax==='x'?0:-4)*0);this.scene.add(bar);meshes.push(bar);
  this.blocks.push({t:0,meshes,cars,x:best.x,z:best.z});G&&G.toast&&G.toast('ROADBLOCK AHEAD');}
 update(dt,player,G){const C=this.city;const want=G.wanted;const target=Math.min(6,Math.ceil(want*1.4));const chasing=this.cops.filter(c=>!c.parked&&!c.dead);
  if(want>0&&chasing.length<target){this.spawnT=(this.spawnT||0)-dt;if(this.spawnT<=0){this.spawnT=2.5;this.spawn(player);}}
  if(want===0&&chasing.length<(G.patrols??2)){this.spawnT=(this.spawnT||0)-dt;if(this.spawnT<=0){this.spawnT=4;const c=this.spawn(player);if(c)c.patrol=true;}}
  if(want>=2&&player.speed>14){this.blockT=(this.blockT||14)-dt;if(this.blockT<=0){this.blockT=Math.max(14,30-want*4);this.roadblock(player,G);}}
  let seen=false,near=0;
  for(const c of this.cops){const flash=Math.sin(G.time*14+(c.x*.1))>0;c.lr.visible=flash;c.lb.visible=!flash;if(!want){c.lr.visible=c.lb.visible=false;}
   if(c.parked){c.step({thr:0,brk:1,steer:0,hb:false},dt,C,{});}
   else if(want>0){c.routeT-=dt;const dx=player.x-c.x,dz=player.z-c.z,d=Math.hypot(dx,dz);
    let tx=player.x+player.vx*Math.min(1.2,d/30),tz=player.z+player.vz*Math.min(1.2,d/30);
    if(d>55||Math.abs(player.y-c.y)>4){if(c.routeT<=0||!c.route){c.routeT=1.2;c.route=C.route(c.x,c.z,player.x,player.z).pts;c.wp=1;}const w=c.route[Math.min(c.wp,c.route.length-1)];if(w){tx=w[0];tz=w[1];if(Math.hypot(w[0]-c.x,w[1]-c.z)<9&&c.wp<c.route.length-1)c.wp++;}}
    const inp=aiInput(c,tx,tz,c.spec.max*(G.copK||1)*(d<25?1.1:1),{drift:true});if(d<7.5&&player.speed<4){inp.thr=0;inp.brk=c.fwdSpeed>.5?1:0;inp.hb=false;}if(c.stuckT>1.2){inp.thr=0;inp.brk=1;inp.steer*=-1;if(c.stuckT>2.4)c.stuckT=0;}
    c.step(inp,dt,C,{wet:G.wet});if(c.speed<1.5&&inp.thr>0)c.stuckT+=dt;else if(c.stuckT<1.2)c.stuckT=Math.max(0,c.stuckT-dt);
    if(d<65)seen=true;if(d<8)near++;}
   else{// patrol: cruise between random intersections
    if(!c.route||c.wp>=c.route.length-1){const n=C.nodes[(R()*C.nodes.length)|0];if(n.alive&&n.nb.length){c.route=C.route(c.x,c.z,n.x,n.z).pts;c.wp=1;}}
    const w=c.route&&c.route[Math.min(c.wp,c.route.length-1)];if(w){if(Math.hypot(w[0]-c.x,w[1]-c.z)<9&&c.wp<c.route.length-1)c.wp++;const inp=aiInput(c,w[0],w[1],12,{});if(c.stuckT>1.2){inp.thr=0;inp.brk=1;inp.steer*=-1;if(c.stuckT>2.4)c.stuckT=0;}c.step(inp,dt,C,{wet:G.wet});if(c.speed<1&&inp.thr>0)c.stuckT+=dt;else c.stuckT=Math.max(0,c.stuckT-dt);}else c.step({thr:0,brk:1,steer:0,hb:false},dt,C,{});}}
  // despawn far / idle cops
  for(let i=this.cops.length-1;i>=0;i--){const c=this.cops[i];const d=Math.hypot(player.x-c.x,player.z-c.z);if(d>340||(want===0&&!c.patrol&&d>90)){this.scene.remove(c.model);this.cops.splice(i,1);}}
  for(let i=this.blocks.length-1;i>=0;i--){const b=this.blocks[i];b.t+=dt;const d=Math.hypot(player.x-b.x,player.z-b.z);if(b.t>45&&d>80||want===0&&d>60){for(const m of b.meshes)this.scene.remove(m);for(const c of b.cars){const k=this.cops.indexOf(c);if(k>=0){this.scene.remove(c.model);this.cops.splice(k,1);}}this.blocks.splice(i,1);}}
  return{seen,near};}}
