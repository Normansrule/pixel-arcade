// NEON BAY — traffic signals, lane-following traffic AI, police heat (witnesses, pursuit, box-ins, roadblocks, busting).
import {THREE,cl,lerp,wrapA,rng,hash2} from './util.js';
import {RW,polyAt,FWY_Y} from './world.js';
import {Vehicle,aiDrive,trafficPaint} from './vehicles.js';

/* ================= signals ================= */
// per junction a 24 s cycle; N-S ('z' axis) then E-W ('x' axis)
export function lightState(node,axis,t){const c=((t+hash2(node.id,7)*24)%24+24)%24;if(axis==='z')return c<9?0:c<11?1:2;return c<12?2:c<21?0:c<23?1:2;}

const TYPES=[['pip',22],['cabby',13],['parcel',9],['hauler',13],['bruiser',7],['zephyr',4],['skipjack',7],['police',6]];
function pickType(R,bias){const list=TYPES.map(([k,w])=>[k,w*(bias&&bias[k]?bias[k]:1)]);const tot=list.reduce((s,[,w])=>s+w,0);let r=R()*tot;for(const[k,w]of list){if((r-=w)<=0)return k;}return'pip';}

export class Traffic{constructor(G){this.G=G;this.W=G.W;this.R=rng(4242);this.cars=[];this.t=0;this.lt=0;this.bias=null;}
 lanePoint(e,dir,s,off,o){const P=e.pts;const ss=dir>0?s:e.len-s;polyAt(P,ss,o);let tx=o.tx,tz=o.tz;if(dir<0){tx=-tx;tz=-tz;}o.x+=-tz*off;o.z+=tx*off;o.tx=tx;o.tz=tz;return o;}
 trim(n){return n.kind==='grid'||n.kind==='ramp'?RW+.5:n.kind==='summit'?4:6;}
 endNode(c){return this.W.nodes[c.dir>0?c.e.b:c.e.a];}
 spawnOne(px,pz,minD,maxD,force){const W=this.W,R=this.R;for(let tries=0;tries<10;tries++){const e=W.edges[R()*W.edges.length|0];const dir=R()<.5?1:-1;const lanes=e.lanes;const off=lanes[R()*lanes.length|0];
   const s=this.trim(W.nodes[dir>0?e.a:e.b])+R()*Math.max(1,e.len-2*RW-4);const p=this.lanePoint(e,dir,s,off,{});const d=Math.hypot(p.x-px,p.z-pz);if(!force&&(d<minD||d>maxD))continue;
   if(this.G.vehicles.some(v=>Math.hypot(v.x-p.x,v.z-p.z)<14))continue;
   // avoid spawning right in front of the camera
   const cam=this.G.cam;if(!force&&d<200){const cx=p.x-cam.position.x,cz=p.z-cam.position.z;const f=new THREE.Vector3();cam.getWorldDirection(f);if((cx*f.x+cz*f.z)/(Math.hypot(cx,cz)||1)>.5&&d<160)continue;}
   const type=pickType(R,this.bias);const v=new Vehicle(type,{paint:type==='police'||type==='cabby'||type==='parcel'?undefined:trafficPaint(R()),mode:'lane',driver:'npc'});v.attach(this.G.scene,this.G.U);
   v.lane={e,dir,s,off,turn:null,want:e.speed*(.82+R()*.3),wait:0};v.traffic=true;const y=p.y??0;v.x=p.x;v.z=p.z;v.y=e.kind==='fwy'?FWY_Y:W.groundAt(p.x,p.z,y+1.5);v.a=Math.atan2(p.tx,p.tz);v.npc={look:null};if(type==='police')v.cop={patrol:true};
   this.cars.push(v);this.G.vehicles.push(v);return v;}return null;}
 update(dt,px,pz,want){this.t+=dt;const W=this.W;
  for(let i=this.cars.length-1;i>=0;i--){const v=this.cars[i];if(v.keep)continue;const d=Math.hypot(v.x-px,v.z-pz);if(d>320||(v.mode!=='lane'&&d>230&&!v.cop?.chase)){this.remove(v);}}
  const live=this.cars.filter(c=>!c.keep&&c.mode==='lane').length;let n=0;while(live+n<want&&n<3){if(!this.spawnOne(px,pz,this.cars.length<want*.4?70:150,280))break;n++;}
  for(const v of this.cars)if(v.mode==='lane')this.drive(v,dt);
  if((this.lt-=dt)<=0){this.lt=.25;this.paintLights();}}
 remove(v){const i=this.cars.indexOf(v);if(i>=0)this.cars.splice(i,1);const j=this.G.vehicles.indexOf(v);if(j>=0)this.G.vehicles.splice(j,1);v.detach();}
 // lane-follow one car
 drive(v,dt){const W=this.W,L=v.lane,o=_o;let want=L.want;if(this.G.weatherRain>.3)want*=.85;
  // car ahead (any vehicle, plus the on-foot player)
  const sa=Math.sin(v.a),ca=Math.cos(v.a);let gap=1e9;for(const u of this.G.vehicles){if(u===v)continue;const dx=u.x-v.x,dz=u.z-v.z;const f=dx*sa+dz*ca;if(f<0||f>34)continue;if(Math.abs(u.y-v.y)>3)continue;const lat=Math.abs(dx*ca-dz*sa);if(lat>2.4)continue;gap=Math.min(gap,f-u.len/2-v.len/2);}
  const P=this.G.player;if(!P.veh){const dx=P.w.x-v.x,dz=P.w.z-v.z;const f=dx*sa+dz*ca;if(f>0&&f<20&&Math.abs(dx*ca-dz*sa)<2&&Math.abs(P.w.y-v.y)<2)gap=Math.min(gap,f-v.len/2-.5);}
  for(const c of this.G.peds.list){if(c.state==='walk'||c.state==='idle'||c.custom)continue;const dx=c.x-v.x,dz=c.z-v.z,f=dx*sa+dz*ca;if(f>0&&f<16&&Math.abs(dx*ca-dz*sa)<2.2)gap=Math.min(gap,f-v.len/2-1);}
  if(gap<1e8){want=Math.min(want,Math.max(0,(gap-3)*1.1));if(gap<3)want=0;}
  if(!L.turn){const end=this.endNode(L),stop=L.e.len-this.trim(end);
   if(end.light){const tx=o.tx;this.lanePoint(L.e,L.dir,Math.min(stop,L.e.len),L.off,o);const axis=Math.abs(o.tx)>Math.abs(o.tz)?'x':'z';const st=lightState(end,axis,this.t);const dist=stop-L.s-1;
    if(st===2&&dist>-.5||st===1&&dist>5){want=Math.min(want,dist<.3?0:Math.sqrt(2*7*Math.max(0,dist)));}}
   const cur=v.lspd??0;const acc=want>cur?4.5:12;v.lspd=cur+cl(want-cur,-acc*dt,acc*dt);L.s+=v.lspd*dt;
   if(L.s>=stop){this.planTurn(v,end);}else this.lanePoint(L.e,L.dir,L.s,L.off,o);}
  if(L.turn){const T=L.turn;const cur=v.lspd??0;const tw=Math.min(want,T.tight?9:want);v.lspd=cur+cl(tw-cur,-12*dt,4.5*dt);T.u+=v.lspd*dt/T.len;if(T.u>=1){L.e=T.ne;L.dir=T.nd;L.s=T.s0;L.off=T.off;L.turn=null;L.want=L.e.speed*(.82+this.R()*.3);this.lanePoint(L.e,L.dir,L.s,L.off,o);}
   else{const u=T.u,a=T.p0,b=T.p1,c=T.p2;o.x=(1-u)*(1-u)*a.x+2*(1-u)*u*b.x+u*u*c.x;o.z=(1-u)*(1-u)*a.z+2*(1-u)*u*b.z+u*u*c.z;o.tx=2*(1-u)*(b.x-a.x)+2*u*(c.x-b.x);o.tz=2*(1-u)*(b.z-a.z)+2*u*(c.z-b.z);}}
  const ox=v.x,oz=v.z,oy=v.y;v.x=o.x;v.z=o.z;const ref=L.e.kind==='fwy'||(L.turn&&L.turn.fwy)?FWY_Y:v.y;v.y=W.groundAt(v.x,v.z,ref+1.3);
  if(dt>0){v.vx=(v.x-ox)/dt;v.vz=(v.z-oz)/dt;const vy=(v.y-oy)/dt;v.pitch=lerp(v.pitch,-Math.atan2(vy,Math.max(2,v.lspd)),.2);v.roll*=.8;}
  const ta=Math.atan2(o.tx,o.tz);v.w=wrapA(ta-v.a)/Math.max(dt,1e-3);v.a=ta;v.ctrl.steer=cl(v.w*.35,-1,1);v.braking=v.lspd<want-1||want<v.lspd-1||v.lspd<.5;v.spin+=v.lspd*dt/.35;
  if(v.lspd<.3&&gap<6){L.wait+=dt;if(L.wait>2.5&&this.R()<dt*.8&&Math.hypot(v.x-this.G.player.x,v.z-this.G.player.z)<40){this.G.sfx3d('honk',v);L.wait=1.5;}}else L.wait=0;}
 planTurn(v,node){const W=this.W,L=v.lane,R=this.R;let opts=node.edges.map(id=>W.edges[id]).filter(e=>e!==L.e);
  if(L.e.kind==='fwy'){const f=opts.filter(e=>e.kind==='fwy');if(f.length&&R()<.82)opts=f;}
  let ne,nd;if(!opts.length){ne=L.e;nd=-L.dir;}else{// prefer straight-ish, avoid repeated sharp turns
   const o0=this.lanePoint(L.e,L.dir,L.e.len-.5,0,{});const w=opts.map(e=>{const d=e.a===node.id?1:-1;const p=this.lanePoint(e,d,.5,0,{});const dot=o0.tx*p.tx+o0.tz*p.tz;return dot>.7?3:dot>-.3?1.2:.2;});
   let tot=w.reduce((a,b)=>a+b,0),r=R()*tot,k=0;for(;k<opts.length-1;k++){if((r-=w[k])<=0)break;}ne=opts[k];nd=ne.a===node.id?1:-1;}
  const off=ne.lanes.includes(L.off)?L.off:ne.lanes[R()*ne.lanes.length|0];const s0=ne===L.e?this.trim(node):this.trim(node);
  const p0=this.lanePoint(L.e,L.dir,L.s,L.off,{}),p2=this.lanePoint(ne,nd,s0,off,{});
  // control point: intersection of the incoming and outgoing lane lines
  const d0x=p0.tx,d0z=p0.tz,d2x=p2.tx,d2z=p2.tz;const den=d0x*d2z-d0z*d2x;let p1;if(Math.abs(den)<.15){p1={x:(p0.x+p2.x)/2,z:(p0.z+p2.z)/2};if(ne===L.e){p1={x:node.x+(p0.x+p2.x-2*node.x)*.5+d0x*8,z:node.z+(p0.z+p2.z-2*node.z)*.5+d0z*8};}}
  else{const t=((p2.x-p0.x)*d2z-(p2.z-p0.z)*d2x)/den;p1={x:p0.x+d0x*t,z:p0.z+d0z*t};}
  let len=0,px=p0.x,pz=p0.z;for(let i=1;i<=8;i++){const u=i/8;const x=(1-u)*(1-u)*p0.x+2*(1-u)*u*p1.x+u*u*p2.x,z=(1-u)*(1-u)*p0.z+2*(1-u)*u*p1.z+u*u*p2.z;len+=Math.hypot(x-px,z-pz);px=x;pz=z;}
  L.turn={p0,p1,p2,len:Math.max(1,len),u:0,ne,nd,s0,off,tight:Math.abs(den)>.5||ne===L.e,fwy:node.kind==='fwy'};}
 // push traffic-light colours to the instanced lamps
 paintLights(){const sets=this.G.city.tl;if(!sets)return;const W=this.W;const on=[new THREE.Color(2.2,.15,.1),new THREE.Color(2.2,1.3,.1),new THREE.Color(.15,2,.6)],off=[new THREE.Color(.16,.02,.02),new THREE.Color(.16,.1,.02),new THREE.Color(.02,.14,.05)];
  W.tlights.forEach((tl,i)=>{const st=lightState(W.nodes[tl.node],tl.axis,this.t);for(let k=0;k<3;k++){const lit=(k===0&&st===2)||(k===1&&st===1)||(k===2&&st===0);const c=lit?on[k]:off[k];sets[k].cols[i*3]=c.r;sets[k].cols[i*3+1]=c.g;sets[k].cols[i*3+2]=c.b;}});
  const cp=this.G.cam.position;for(const s of sets)s.refresh(cp.x,cp.z,true);}}
const _o={};

/* ================= police / heat ================= */
export const ESCAPE=[0,7,9,12,15,18];
export class Police{constructor(G){this.G=G;this.heat=0;this.lostT=0;this.bustT=0;this.cops=[];this.blocks=[];this.rbT=20;this.seen=false;this.maxStars=0;this.flash=0;this.spawnT=0;this.R=rng(911);}
 get stars(){return Math.min(5,Math.floor(this.heat+1e-6));}
 witness(x,z){for(const v of this.G.vehicles){if(!v.cop||v.wrecked)continue;const d=Math.hypot(v.x-x,v.z-z);if(d<26||(d<80&&this.G.W.los(v.x,v.z,x,z,2)))return v;}return null;}
 crime(kind,x,z,amt,force){if(this.G.app!=='play')return false;const w=force?true:this.witness(x,z);if(!w)return false;const before=this.stars;this.heat=cl(Math.max(this.heat+amt,1),0,5.2);this.lostT=0;
  if(this.stars>before){this.G.onStars(this.stars,kind);}this.maxStars=Math.max(this.maxStars,this.stars);if(w.cop&&w.cop.patrol)this.enlist(w);return true;}
 set(n){this.heat=n;this.lostT=0;if(n>0)this.maxStars=Math.max(this.maxStars,this.stars);}
 clear(){this.heat=0;this.lostT=0;this.bustT=0;for(const c of this.cops){c.cop.chase=false;c.siren=false;c.cop.leave=true;}this.cops=[];for(const b of this.blocks)b.forEach(v=>{v.keep=false;});this.blocks=[];}
 enlist(v){if(v.cop.chase)return;v.cop.chase=true;v.cop.patrol=false;v.mode='chase';v.siren=true;v.keep=true;v.cop.role=this.cops.length%3;v.cop.rt=0;v.stuck=0;this.cops.push(v);}
 spawnCop(){const G=this.G,P=G.player;const px=P.x,pz=P.z;for(let k=0;k<14;k++){const a=this.R()*Math.PI*2,d=130+this.R()*80;const tx=px+Math.cos(a)*d,tz=pz+Math.sin(a)*d;const ne=G.W.nearestEdge(tx,tz,60);if(!ne)continue;const p=polyAt(ne.e.pts,ne.s,{});
   if(G.vehicles.some(v=>Math.hypot(v.x-p.x,v.z-p.z)<10))continue;if(G.W.los(p.x,p.z,px,pz,2)&&d<170)continue;
   const v=new Vehicle('police',{mode:'chase',driver:'npc'});v.attach(G.scene,G.U);v.x=p.x;v.z=p.z;v.y=G.W.groundAt(p.x,p.z,(p.y||0)+2);v.a=Math.atan2(px-p.x,pz-p.z);v.cop={patrol:false};v.traffic=true;G.traffic.cars.push(v);G.vehicles.push(v);this.enlist(v);return v;}return null;}
 roadblock(){const G=this.G,P=G.player,W=G.W;const v=P.veh;if(!v||v.speed<8)return;const sa=Math.sin(v.a),ca=Math.cos(v.a);const ahead=W.nearestEdge(P.x+sa*130,P.z+ca*130,50);if(!ahead)return;
  const p=polyAt(ahead.e.pts,ahead.s,{});if(Math.hypot(p.x-P.x,p.z-P.z)<80||W.los(p.x,p.z,P.x,P.z,2)&&Math.hypot(p.x-P.x,p.z-P.z)<100)return;const a=Math.atan2(p.tx,p.tz);const cars=[];
  for(const[off,rot]of[[-3.2,1.2],[3.2,-1.2]]){const x=p.x-p.tz*off,z=p.z+p.tx*off;const c=new Vehicle('police',{mode:'parked',driver:'npc'});c.attach(G.scene,G.U);c.place(x,z,a+rot,W,(p.y||0)+1);c.cop={block:true};c.siren=true;c.keep=true;c.traffic=true;G.traffic.cars.push(c);G.vehicles.push(c);cars.push(c);}
  this.blocks.push(cars);G.hud.toast('ROADBLOCK AHEAD');}
 update(dt){const G=this.G,P=G.player,diff=G.opt.cops;const st=this.stars;this.flash+=dt;
  // release cops that are no longer needed
  for(const v of G.vehicles){if(!v.cop)continue;if(v.cop.leave&&Math.hypot(v.x-P.x,v.z-P.z)>140&&!v.keep){G.traffic.remove(v);}}
  if(st===0){if(this.cops.length)this.clear();this.bustT=Math.max(0,this.bustT-dt);return;}
  this.cops=this.cops.filter(c=>G.vehicles.includes(c)&&!c.wrecked);
  const want=[0,1,2,3,5,6][st]+(diff===2?1:0)-(diff===0&&st>1?1:0);if((this.spawnT-=dt)<=0&&this.cops.length<want){this.spawnT=diff===2?2.5:4.5;this.spawnCop();}
  // sight
  this.seen=false;for(const c of this.cops.concat(...this.blocks)){const d=Math.hypot(c.x-P.x,c.z-P.z);if(d<30||(d<125&&G.W.los(c.x,c.z,P.x,P.z,2.2))){this.seen=true;break;}}
  if(this.seen)this.lostT=0;else{this.lostT+=dt;if(this.lostT>ESCAPE[st]*(diff===2?1.25:diff===0?.75:1)){G.onEscape(st);this.clear();return;}}
  // busted
  const pv=P.veh;const slow=pv?pv.speed<2.8:P.w.spd<2.5||P.w.state==='prone';let near=false;for(const c of this.cops.concat(...this.blocks)){if(Math.hypot(c.x-P.x,c.z-P.z)<(pv?7.5:6.5)&&c.speed<10)near=true;}
  if(slow&&near&&!(pv&&pv.water)){this.bustT+=dt;if(this.bustT>2.4){this.bustT=0;G.onBusted();return;}}else this.bustT=Math.max(0,this.bustT-dt*1.4);
  // roadblocks
  if(st>=(diff===2?2:3)){if((this.rbT-=dt)<=0){this.rbT=diff===2?18:28;this.roadblock();}}
  for(const b of this.blocks.slice()){if(b.every(c=>Math.hypot(c.x-P.x,c.z-P.z)>260)){b.forEach(c=>{c.keep=false;G.traffic.remove(c);});this.blocks.splice(this.blocks.indexOf(b),1);}}
  for(const c of this.cops)this.chase(c,dt,st,diff);}
 // pursuit AI for one cruiser
 chase(c,dt,st,diff){const G=this.G,P=G.player,W=G.W;const pv=P.veh;const tx0=P.x,tz0=P.z;const pvx=pv?pv.vx:0,pvz=pv?pv.vz:0;const d=Math.hypot(tx0-c.x,tz0-c.z);
  // too far behind: respawn closer
  if(d>320){c.keep=false;G.traffic.remove(c);return;}
  let tx,tz,want=(diff===2?60:diff===0?40:50)*(st>=3?1.05:.95);const los=d<90&&W.los(c.x,c.z,tx0,tz0,2);
  if(los||d<35){const lead=Math.min(1.1,d/28);tx=tx0+pvx*lead;tz=tz0+pvz*lead;
   if(c.cop.role===1&&st>=2&&pv&&pv.speed>12){const sa=Math.sin(pv.a),ca=Math.cos(pv.a);tx=tx0+sa*22;tz=tz0+ca*22;const ahead=(c.x-tx0)*sa+(c.z-tz0)*ca;if(ahead>4&&ahead<26&&Math.abs((c.x-tx0)*ca-(c.z-tz0)*sa)<5){tx=tx0+sa*60;tz=tz0+ca*60;want=Math.max(4,pv.speed*.55);}}
   if(c.cop.role===2&&st>=3&&d<14&&pv){tx=tx0-pvx*.1;tz=tz0-pvz*.1;want+=8;}
   if(d<12&&(!pv||pv.speed<6))want=Math.min(want,Math.max(0,d-5.5)*1.4);else if(d<10)want=Math.min(want,(pv?pv.speed:0)*.9+Math.max(0,d-6));c.route=null;}
  else{// follow a road route toward the player
   c.cop.rt-=dt;if(!c.route||c.cop.rt<=0){c.cop.rt=1.4;const r=W.route(c.x,c.z,tx0,tz0);c.route=r.pts;c.ri=0;}
   const R=c.route;let best=c.ri,bd=1e9;for(let i=c.ri;i<Math.min(R.length,c.ri+30);i++){const q=R[i];const dd=Math.hypot(q.x-c.x,q.z-c.z);if(dd<bd){bd=dd;best=i;}}c.ri=best;let acc=0,k=best;while(k<R.length-1&&acc<16){acc+=Math.hypot(R[k+1].x-R[k].x,R[k+1].z-R[k].z);k++;}tx=R[k].x;tz=R[k].z;
   // look further ahead to slow for corners
   let k2=k,acc2=0;while(k2<R.length-1&&acc2<30){acc2+=Math.hypot(R[k2+1].x-R[k2].x,R[k2+1].z-R[k2].z);k2++;}const a1=Math.atan2(tx-c.x,tz-c.z),a2=Math.atan2(R[k2].x-tx,R[k2].z-tz);if(Math.abs(wrapA(a2-a1))>.9)want=Math.min(want,17);}
  if(c.speed<1.4&&c.ctrl.thr>0)c.stuck=(c.stuck||0)+dt;else if(c.stuck>0&&c.stuck<1.3)c.stuck=Math.max(0,c.stuck-dt*2);
  if(c.stuck>1.3){c.ctrl.thr=-1;c.ctrl.steer=c.ctrl.steer>0?-1:1;c.stuck+=dt;if(c.stuck>2.6)c.stuck=0;return;}
  aiDrive(c,tx,tz,want,{dt});}}
