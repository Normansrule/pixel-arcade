// IRONCLAD — hulls, turrets, procedural tank models (animated tracks/wheels/antenna) and tank driving physics.
import * as THREE from '../vendor/three.module.min.js';
import {V3,cl,lerp,angDiff,wrapA,merge,M} from './util.js';
import {camoTex,treadTex,wheelTex,PAINTS} from './tex.js';
import {obbPush,breakOb,B} from './maps.js';

export const HULLS=[
 {id:'kestrel',n:'KESTREL',cls:'LIGHT HULL',hp:150,speed:18.5,acc:22,turn:2.0,armor:0,L:5.0,W:2.9,H:.82,r:.4,wheels:5,mass:1,cost:1200,d:'Fast scout. Flanks, steals flags, dodges shells.'},
 {id:'bulwark',n:'BULWARK',cls:'MEDIUM HULL',hp:230,speed:13.5,acc:14,turn:1.45,armor:.12,L:6.0,W:3.3,H:1.0,r:.46,wheels:6,mass:1.6,cost:0,d:'Balanced all-rounder. Holds a line, still moves.'},
 {id:'behemoth',n:'BEHEMOTH',cls:'HEAVY HULL',hp:340,speed:9.6,acc:8.5,turn:.98,armor:.24,L:7.0,W:3.7,H:1.2,r:.52,wheels:7,mass:2.6,cost:2500,d:'Rolling fortress. Angle the front plate and tank hits.'}];
export const TURRETS=[
 {id:'talon',n:'TALON-30',cls:'RAPID CANNON',dmg:19,reload:2.8,mag:5,rof:.2,speed:150,trav:1.9,disp:.010,bloom:.007,aim:1.0,splash:0,cost:0,d:'Five-round autocannon bursts. Hold fire to empty the drum.'},
 {id:'maul',n:'MAUL-125',cls:'HEAVY CANNON',dmg:80,reload:3.6,mag:1,rof:0,speed:108,trav:.95,disp:.008,bloom:.022,aim:1.6,splash:5,cost:1800,d:'Huge HE-AP shell with blast splash. Lobs over walls.'},
 {id:'lance',n:'LANCE-9',cls:'COILGUN',dmg:94,reload:4.2,mag:1,rof:0,charge:.7,speed:0,trav:1.25,disp:.0025,bloom:.014,aim:2.0,splash:0,pierce:true,cost:3000,d:'Charged hyper-velocity slug. Pierces fences and tanks.'}];
export const MAXLV=4;
export const UPCOST=lv=>350+lv*300;
export function hullStats(h,lv=0){return{...h,hp:Math.round(h.hp*(1+.08*lv)),speed:h.speed*(1+.03*lv),turn:h.turn*(1+.03*lv),armor:Math.min(.4,h.armor+.02*lv)};}
export function turretStats(t,lv=0){return{...t,dmg:t.dmg*(1+.07*lv),reload:t.reload*(1-.05*lv),trav:t.trav*(1+.06*lv)};}
export const TEAMC=[{n:'BLUE',css:'#3d8bff',c:new THREE.Color(.25,.55,1.6)},{n:'RED',css:'#ff3b30',c:new THREE.Color(1.7,.25,.18)}];
export const G=15.5; // shell gravity

/* ---------------- shared materials ---------------- */
const MAT={};
function mats(){if(MAT.dark)return MAT;
 MAT.dark=new THREE.MeshStandardMaterial({color:0x2b2b2a,roughness:.55,metalness:.6});
 MAT.steel=new THREE.MeshStandardMaterial({color:0x4a4b4a,roughness:.4,metalness:.75});
 MAT.rubber=new THREE.MeshStandardMaterial({color:0x1d1c1b,roughness:.85,metalness:.1});
 MAT.lamp=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xfff2d0,emissiveIntensity:1.6,roughness:.2});
 MAT.wreck=new THREE.MeshStandardMaterial({color:0x1b1816,roughness:1,metalness:.25});
 MAT.glass=new THREE.MeshStandardMaterial({color:0x10202a,roughness:.1,metalness:.8});
 return MAT;}
export function wreckMat(){return mats().wreck;}
const paintCache={};
function paintMat(pid){return paintCache[pid]||(paintCache[pid]=new THREE.MeshStandardMaterial({map:camoTex(pid),roughness:.62,metalness:.35,envMapIntensity:.85}));}

/* ---------------- geometry builders ---------------- */
function beltGeo(a,R,tw,thk){// stadium loop: centres at z=±a, y=R
 const pts=[];const N1=10,N2=14;const add=(z,y,nz,ny)=>pts.push([z,y,nz,ny]);
 for(let i=0;i<N1;i++){const t=i/N1;add(-a+2*a*t,0,0,-1);}for(let i=0;i<N2;i++){const q=-Math.PI/2+i/N2*Math.PI;add(a+Math.cos(q)*R,R+Math.sin(q)*R,Math.cos(q),Math.sin(q));}
 for(let i=0;i<N1;i++){const t=i/N1;add(a-2*a*t,2*R,0,1);}for(let i=0;i<N2;i++){const q=Math.PI/2+i/N2*Math.PI;add(-a+Math.cos(q)*R,R+Math.sin(q)*R,Math.cos(q),Math.sin(q));}
 pts.push(pts[0]);let s=0;const S=[0];for(let i=1;i<pts.length;i++){s+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);S.push(s);}
 const pos=[],nor=[],uv=[],idx=[];const n=pts.length;
 // outer surface: 2 verts per point
 for(let i=0;i<n;i++){const[z,y,nz,ny]=pts[i];for(const x of[-tw/2,tw/2]){pos.push(x,y,z);nor.push(0,ny,nz);uv.push(x>0?1:0,S[i]);}}
 for(let i=0;i<n-1;i++){const a0=i*2,b0=a0+2;idx.push(a0,b0,a0+1,a0+1,b0,b0+1);}
 const g1=idx.length;
 // inner + side walls
 const base=pos.length/3;for(let i=0;i<n;i++){const[z,y,nz,ny]=pts[i];const zi=z-nz*thk,yi=y-ny*thk;
  pos.push(-tw/2,y,z,-tw/2,yi,zi,tw/2,y,z,tw/2,yi,zi);nor.push(-1,0,0,-1,0,0,1,0,0,1,0,0);uv.push(0,0,0,0,0,0,0,0);}
 for(let i=0;i<n-1;i++){const a0=base+i*4,b0=a0+4;idx.push(a0,a0+1,b0,a0+1,b0+1,b0);idx.push(a0+2,b0+2,a0+3,a0+3,b0+2,b0+3);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
 g.addGroup(0,g1,0);g.addGroup(g1,idx.length-g1,1);return g;}
function extrudeSide(pts,depth,bevel=.05){// pts: [z,y] profile, extruded across x (centred)
 const sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);
 const g=new THREE.ExtrudeGeometry(sh,{depth:depth-bevel*2,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1});g.translate(0,0,-(depth-bevel*2)/2);g.rotateY(-Math.PI/2);scaleUV(g,.22);return g;}
function extrudeTop(pts,h,bevel=.06){// pts: [x,z] outline, extruded upward
 const sh=new THREE.Shape();sh.moveTo(pts[0][0],-pts[0][1]);for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],-pts[i][1]);
 const g=new THREE.ExtrudeGeometry(sh,{depth:h-bevel*2,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});g.translate(0,0,bevel);g.rotateX(-Math.PI/2);scaleUV(g,.22);return g;}
function scaleUV(g,k){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*k,uv.getY(i)*k);}
const sym=a=>[...a,...a.slice().reverse().map(([x,z])=>[-x,z])];

/* ---------------- tank model ---------------- */
export function makeTankModel(hid,tid,pid,team){const H=HULLS.find(h=>h.id===hid),T=TURRETS.find(t=>t.id===tid),m=mats(),paint=paintMat(pid);
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const L=H.L,W=H.W,R=H.r+.06,tw=W*.25,a=L*.47-R,tx=W/2-tw/2,y0=2*R*.92,y1=y0+H.H;
 const teamM=new THREE.MeshStandardMaterial({color:0x111111,emissive:TEAMC[team].c,emissiveIntensity:1.1,roughness:.4});
 const parts=[];// paint parts merged
 // upper hull (full width, sloped glacis + rear)
 const gl=H.H*1.25;parts.push([extrudeSide([[-L/2,y0-.02],[-L/2,y1-.28],[-L/2+.3,y1],[L/2-gl,y1],[L/2,y0+.3],[L/2-.18,y0-.02]],W,.06)]);
 // lower hull between the tracks
 parts.push([new THREE.BoxGeometry(W-2*tw-.04,y0-.3,L*.86),M(0,(y0+.3)/2,0)]);
 // engine deck plate + hatches
 parts.push([new THREE.BoxGeometry(W*.62,.08,L*.3),M(0,y1+.04,-L*.3)]);
 parts.push([new THREE.CylinderGeometry(.28,.3,.12,12),M(W*.22,y1+.06,L/2-gl-.4)]);
 // stowage boxes on fenders
 for(const s of[-1,1])parts.push([new THREE.BoxGeometry(tw*.8,.38,L*.22),M(s*(W/2-tw*.45),y1-.12,-L*.18)],[new THREE.BoxGeometry(tw*.7,.3,L*.12),M(s*(W/2-tw*.45),y1-.16,L*.08)]);
 if(hid==='behemoth')for(const s of[-1,1])parts.push([new THREE.BoxGeometry(.08,R*1.2,L*.86),M(s*(W/2+.02),y0-R*.45,-.05)]);
 if(hid==='kestrel')parts.push([new THREE.BoxGeometry(W*.9,.06,.5),M(0,y0+.2,L/2+.05,-.6,0,0)]);
 const hullMesh=new THREE.Mesh(merge(parts),paint);hullMesh.castShadow=true;hullMesh.receiveShadow=true;body.add(hullMesh);
 // dark bits: exhausts, tow hooks, spare tracks, headlights housing
 const dk=[];for(const s of[-1,1]){dk.push([new THREE.CylinderGeometry(.11,.13,.5,8),M(s*W*.28,y1-.3,-L/2-.12,Math.PI/2,0,0)],[new THREE.BoxGeometry(.18,.18,.3),M(s*W*.32,y0+.05,L/2+.02)],[new THREE.CylinderGeometry(.13,.13,.18,10),M(s*W*.36,y0+.48,L/2-.12,Math.PI/2-.5,0,0)]);}
 dk.push([new THREE.BoxGeometry(W*.5,.12,.5),M(0,y0+.42,L/2-.32,-.95,0,0)]);
 const dkMesh=new THREE.Mesh(merge(dk),m.dark);dkMesh.castShadow=true;body.add(dkMesh);
 const lamps=[];for(const s of[-1,1])lamps.push([new THREE.CircleGeometry(.1,10),M(s*W*.36,y0+.48+Math.sin(.5)*.09*0,L/2-.12+.1,-.5,0,0)]);const lampMesh=new THREE.Mesh(merge(lamps),m.lamp);body.add(lampMesh);
 // tracks
 const tracks=[],caps=[];const tt=treadTex();
 for(const s of[-1,1]){const tm=new THREE.MeshStandardMaterial({map:tt.clone(),roughness:.8,metalness:.5,color:0xb8b4ac});tm.map.needsUpdate=true;
  const belt=new THREE.Mesh(beltGeo(a,R,tw,.1),[tm,m.dark]);belt.position.x=s*tx;belt.castShadow=true;belt.receiveShadow=true;root.add(belt);tracks.push(tm);
  const tires=[],cp=[];const rw=R-.1,n=H.wheels;
  for(let i=0;i<n;i++){const z=-a+.15+(2*a-.3)*i/(n-1);tires.push([new THREE.CylinderGeometry(rw,rw,tw*.78,18,1,true),M(s*tx,rw+.06,z,0,0,Math.PI/2)]);cp.push([new THREE.CircleGeometry(rw*.97,18),M(s*(tx+tw*.39),rw+.06,z,0,s*Math.PI/2,0)]);}
  for(const z of[-a,a]){tires.push([new THREE.CylinderGeometry(R*.82,R*.82,tw*.6,14,1,true),M(s*tx,R,z,0,0,Math.PI/2)]);cp.push([new THREE.CircleGeometry(R*.8,14),M(s*(tx+tw*.3),R,z,0,s*Math.PI/2,0)]);}
  for(let i=0;i<3;i++)tires.push([new THREE.CylinderGeometry(.12,.12,tw*.5,8),M(s*tx,2*R-.16,-a*.6+a*.6*i,0,0,Math.PI/2)]);
  const tm2=new THREE.Mesh(merge(tires),m.rubber);tm2.castShadow=true;root.add(tm2);
  const cm=new THREE.MeshStandardMaterial({map:wheelTex().clone(),roughness:.6,metalness:.5});cm.map.needsUpdate=true;const cmesh=new THREE.Mesh(merge(cp),cm);root.add(cmesh);caps.push(cm);}
 // turret
 const sc={kestrel:.86,bulwark:1,behemoth:1.14}[hid];const tur=new THREE.Group();tur.position.set(0,y1,-L*.04+(tid==='maul'?-.1:0));tur.scale.setScalar(sc);body.add(tur);
 const gun=new THREE.Group(),barrel=new THREE.Group(),muzzle=new THREE.Object3D();gun.add(barrel);
 const tp=[],tdk=[],glow=[];let coilM=null,len=0,ty=0;
 if(tid==='talon'){tp.push([extrudeTop(sym([[.5,1.05],[.95,.35],[.95,-.85],[.6,-1.25]]),.62,.08)]);tp.push([new THREE.CylinderGeometry(.3,.32,.22,14),M(-.38,.72,-.35)]);
  tp.push([new THREE.BoxGeometry(.36,.34,.7),M(.78,.36,-.2)]);gun.position.set(0,.33,.95);
  tdk.push([new THREE.BoxGeometry(.72,.46,.42),M(0,0,.1)]);for(const s of[-1,1]){barrel.add(mk(new THREE.CylinderGeometry(.075,.085,2.3,10),m.steel,s*.17,.0,1.35,Math.PI/2));barrel.add(mk(new THREE.BoxGeometry(.2,.16,.34),m.dark,s*.17,0,2.5));barrel.add(mk(new THREE.CylinderGeometry(.13,.13,.7,10),m.dark,s*.17,0,.6,Math.PI/2));}
  len=2.7;ty=.33;}
 else if(tid==='maul'){tp.push([extrudeTop(sym([[.7,1.45],[1.25,.6],[1.32,-.75],[1.05,-1.95]]),.86,.1)]);tp.push([new THREE.CylinderGeometry(.34,.36,.26,14),M(-.5,.98,-.5)],[new THREE.BoxGeometry(1.6,.45,.7),M(0,.42,-2.0)]);
  gun.position.set(0,.45,1.38);tdk.push([new THREE.BoxGeometry(1.0,.62,.5),M(0,0,.12)]);
  barrel.add(mk(new THREE.CylinderGeometry(.13,.17,4.2,14),m.steel,0,0,2.3,Math.PI/2));barrel.add(mk(new THREE.CylinderGeometry(.22,.22,.7,14),paint,0,0,2.9,Math.PI/2));barrel.add(mk(new THREE.BoxGeometry(.48,.3,.5),m.dark,0,0,4.45));barrel.add(mk(new THREE.CylinderGeometry(.26,.26,.6,14),paint,0,0,.55,Math.PI/2));
  len=4.75;ty=.45;}
 else{tp.push([extrudeTop(sym([[.55,1.3],[1.15,.5],[1.15,-1.05],[.7,-1.6]]),.7,.04)]);tp.push([extrudeTop(sym([[.4,.6],[.8,.1],[.8,-1.0],[.5,-1.3]]),.28,.03),M(0,.7,0)]);
  gun.position.set(0,.38,1.2);tdk.push([new THREE.BoxGeometry(.8,.5,.5),M(0,0,.1)]);coilM=new THREE.MeshStandardMaterial({color:0x101418,emissive:TEAMC[team].c.clone().lerp(new THREE.Color(.4,1.4,1.8),.5),emissiveIntensity:.6,roughness:.3,metalness:.6});
  for(const s of[-1,1]){barrel.add(mk(new THREE.BoxGeometry(.11,.26,3.9),m.steel,s*.17,0,2.1));barrel.add(mk(new THREE.BoxGeometry(.03,.12,3.7),coilM,s*.11,0,2.15));}
  for(let i=0;i<5;i++){const r=mk(new THREE.TorusGeometry(.3,.055,8,16),coilM,0,0,.8+i*.75);barrel.add(r);}barrel.add(mk(new THREE.BoxGeometry(.6,.14,.2),m.dark,0,.2,4.0));
  len=4.15;ty=.38;}
 // team stripe + antenna
 const tMesh=new THREE.Mesh(merge(tp),paint);tMesh.castShadow=true;tMesh.receiveShadow=true;tur.add(tMesh);const tdMesh=new THREE.Mesh(merge(tdk),m.dark);tdMesh.castShadow=true;gun.add(tdMesh);
 barrel.traverse(o=>{if(o.isMesh)o.castShadow=true;});muzzle.position.set(0,0,len);barrel.add(muzzle);tur.add(gun);
 const band=new THREE.Mesh(new THREE.BoxGeometry(tid==='maul'?2.68:tid==='lance'?2.34:1.94,.08,.9),teamM);band.position.set(0,tid==='maul'?.62:.46,-.3);tur.add(band);
 const ant=new THREE.Group();ant.position.set(.55,tid==='maul'?.86:.66,-.9);const rod=mk(new THREE.CylinderGeometry(.012,.02,2.4,4),m.dark,0,1.2,0);ant.add(rod);const tip=mk(new THREE.SphereGeometry(.06,8,6),teamM,0,2.42,0);ant.add(tip);tur.add(ant);
 // collect paint/dark meshes for wreck swap
 const all=[];root.traverse(o=>{if(o.isMesh)all.push([o,o.material]);});
 return{root,body,tur,gun,barrel,muzzle,tracks,caps,ant,coilM,teamM,all,dims:{L,W,R,tw,tx,a,y0,y1,len,turY:y1,turZ:tur.position.z,sc,gunY:y1+ty*sc,gunZ:tur.position.z+gun.position.z*sc,tlen:len*sc}};}
function mk(g,mat,x=0,y=0,z=0,rx=0){const o=new THREE.Mesh(g,mat);o.position.set(x,y,z);o.rotation.x=rx;return o;}

/* ---------------- tank entity ---------------- */
let NID=0;
const _f=new V3(),_v=new V3(),_a=new V3(),_q=new THREE.Quaternion(),_e=new THREE.Euler(0,0,0,'YXZ');
export class Tank{
 constructor(team,name,lo,human=false){this.id=NID++;this.team=team;this.name=name;this.human=human;this.lo={...lo};this.p=new V3();this.vel=new V3();this.slip=new V3();this.yaw=0;this.v=0;this.w=0;
  this.tRel=0;this.gun=0;this.pitch=0;this.roll=0;this.alive=false;this.ctrl={thr:0,steer:0,aim:new V3(),fire:false};this.stats={k:0,d:0,dmg:0,caps:0,cp:0,ret:0,shots:0,hits:0,score:0};
  this.buffs={dmg:0,speed:0,armor:0};this.crit={track:0,turret:0,engine:0};this.respawnT=0;this.lastFire=-9;this.hitT=-9;this.lastHitBy=null;this.prot=0;this.trackD=[0,0];this.wheelA=[0,0];
  this.setLoadout(lo);}
 setLoadout(lo){this.lo={...lo};this.H=hullStats(HULLS.find(h=>h.id===lo.hull),lo.hl||0);this.T=turretStats(TURRETS.find(t=>t.id===lo.turret),lo.tl||0);this.max=this.H.hp;this.hp=this.max;
  if(this.model){this.model.root.parent&&this.model.root.parent.remove(this.model.root);}this.model=makeTankModel(lo.hull,lo.turret,lo.paint||'olive',this.team);this.d=this.model.dims;this.hx=this.d.W/2;this.hz=this.d.L/2;
  this.vis={susp:0,suspV:0,pitch:0,roll:0,rec:0,antX:0,antZ:0,antVX:0,antVZ:0,gunVis:0,lv:0,lw:0};this.ammo=this.T.mag;this.reload=0;this.charge=0;this.disp=this.T.disp*3;}
 spawn(x,z,yaw,W){this.p.set(x,W.terrain.height(x,z),z);this.yaw=yaw;this.v=0;this.w=0;this.slip.set(0,0,0);this.vel.set(0,0,0);this.tRel=0;this.gun=0;this.hp=this.max;this.alive=true;this.ammo=this.T.mag;this.reload=0;this.charge=0;
  this.buffs={dmg:0,speed:0,armor:0};this.crit={track:0,turret:0,engine:0};this.prot=2.5;this.lastHitBy=null;this.disp=this.T.disp*3;this.ctrl.aim.set(x+Math.sin(yaw)*50,this.p.y+2,z+Math.cos(yaw)*50);
  for(const[o,mt]of this.model.all)o.material=mt;this.model.tur.position.set(0,this.d.turY,this.d.turZ);this.model.tur.rotation.set(0,0,0);this.model.root.visible=true;this.settle(W,true);}
 fwd(o=new V3()){return o.set(Math.sin(this.yaw),0,Math.cos(this.yaw));}
 get turretYaw(){return wrapA(this.yaw+this.tRel);}
 // world-space elevation of the gun (hull tilt along the turret direction + relative elevation)
 get gunPitch(){return this.gun+this.pitch*Math.cos(this.tRel)+this.roll*Math.sin(this.tRel);}
 gunDir(o=new V3()){const y=this.turretYaw,p=this.gunPitch;return o.set(Math.sin(y)*Math.cos(p),Math.sin(p),Math.cos(y)*Math.cos(p));}
 // approximate muzzle world position (analytic; matches the model within a few cm on flat ground)
 muzzle(o=new V3()){const y=this.turretYaw,c=Math.cos(this.yaw),s=Math.sin(this.yaw),z=this.d.gunZ;o.set(this.p.x+s*z,this.p.y+this.d.gunY,this.p.z+c*z);return o.addScaledVector(this.gunDir(_a),this.d.tlen);}
 pivot(o=new V3()){const z=this.d.gunZ;return o.set(this.p.x+Math.sin(this.yaw)*z,this.p.y+this.d.gunY,this.p.z+Math.cos(this.yaw)*z);}
 settle(W,snap){const T=W.terrain,f=this.fwd(_f),lx=f.z,lz=-f.x,hl=this.d.L*.42,hw=this.d.W*.42;// left = (fz,-fx)
  const hF=T.height(this.p.x+f.x*hl,this.p.z+f.z*hl),hB=T.height(this.p.x-f.x*hl,this.p.z-f.z*hl),hL=T.height(this.p.x+lx*hw,this.p.z+lz*hw),hR=T.height(this.p.x-lx*hw,this.p.z-lz*hw),hc=T.height(this.p.x,this.p.z);
  const tp=Math.atan2(hF-hB,2*hl),tr=Math.atan2(hL-hR,2*hw),ty=Math.max(hc,(hF+hB+hL+hR)/4);
  if(snap){this.pitch=tp;this.roll=tr;this.p.y=ty;}else{const k=.25;this.pitch+=(tp-this.pitch)*k;this.roll+=(tr-this.roll)*k;this.p.y=Math.max(ty,this.p.y+(ty-this.p.y)*.5);}}
 /* physics step */
 step(dt,W,tanks,game){if(!this.alive)return;const H=this.H,Tt=this.T,c=this.ctrl;
  for(const k in this.buffs)if(this.buffs[k]>0)this.buffs[k]-=dt;if(game.time-this.hitT>9&&this.hp<this.max)this.hp=Math.min(this.max,this.hp+this.max*.025*dt);for(const k in this.crit)if(this.crit[k]>0)this.crit[k]-=dt;if(this.prot>0)this.prot-=dt;
  const ice=W.ice&&Math.hypot(this.p.x-W.ice.x,this.p.z-W.ice.z)<W.ice.r;
  let vmax=H.speed*(this.buffs.speed>0?1.4:1)*(this.crit.engine>0?.55:1)*(this.crit.track>0?0:1);
  const thr=c.thr;let tgt=thr>0?thr*vmax:thr*vmax*.55;const f=this.fwd(_f);
  const grade=(W.terrain.height(this.p.x+f.x*1.5,this.p.z+f.z*1.5)-W.terrain.height(this.p.x-f.x*1.5,this.p.z-f.z*1.5))/3;
  let acc=H.acc*(ice?.35:1);if(tgt===0||Math.sign(tgt)!==Math.sign(this.v))acc*=1.6;
  this.v+=cl(tgt-this.v,-acc*dt,acc*dt);this.v-=grade*9.8*dt*.55;if(Math.abs(this.v)>vmax*1.15)this.v*=.98;
  const tr=H.turn*(this.crit.track>0?.35:1)*(1-.22*Math.min(1,Math.abs(this.v)/H.speed));const tw=c.steer*tr*(this.human&&this.v<-.5?-1:1);this.w+=cl(tw-this.w,-dt*(ice?3:7),dt*(ice?3:7));
  const oy=this.yaw;this.yaw=wrapA(this.yaw+this.w*dt);
  // ice: keep part of the old momentum sideways
  this.slip.multiplyScalar(Math.exp(-dt*(ice?.8:9)));if(ice){const ofx=Math.sin(oy),ofz=Math.cos(oy);this.slip.x+=(ofx-Math.sin(this.yaw))*this.v*.9;this.slip.z+=(ofz-Math.cos(this.yaw))*this.v*.9;}
  this.fwd(f);this.vel.set(f.x*this.v+this.slip.x,0,f.z*this.v+this.slip.z);
  this.p.x+=this.vel.x*dt;this.p.z+=this.vel.z*dt;
  // obstacles
  const c0=Math.cos(this.yaw),s0=Math.sin(this.yaw);
  for(const o of W.obs){if(!o.alive)continue;const dx=o.x-this.p.x,dz=o.z-this.p.z;if(dx*dx+dz*dz>(o.r+this.hz+1)**2)continue;if(o.y0>this.p.y+2.2||o.y0+o.h<this.p.y+.3)continue;
   const pu=obbPush(this.p.x,this.p.z,this.hx,this.hz,c0,s0,o);if(!pu)continue;
   const sp=Math.abs(this.v)+this.slip.length(),ram=o.ram/Math.pow(H.mass,.8);
   if(o.kind!=='bound'&&sp>ram){game.knock(o,this,_v.set(f.x*Math.sign(this.v),0,f.z*Math.sign(this.v)));this.v*=o.kind==='wall'?.6:.88;continue;}
   this.p.x+=pu.x*pu.d;this.p.z+=pu.z*pu.d;const into=f.x*pu.x+f.z*pu.z;if(into*this.v<0)this.v*=1-Math.min(.9,Math.abs(into)*.9)*Math.min(1,dt*20);this.slip.multiplyScalar(.5);
   if(sp>6&&game.bump)game.bump(this,sp,o);}
  // tanks
  for(const t of tanks){if(t===this||!t.alive)continue;const dx=t.p.x-this.p.x,dz=t.p.z-this.p.z;if(dx*dx+dz*dz>(this.hz+t.hz+1)**2)continue;
   const box={x:t.p.x,z:t.p.z,hx:t.hx,hz:t.hz,c:Math.cos(t.yaw),s:Math.sin(t.yaw)};const pu=obbPush(this.p.x,this.p.z,this.hx,this.hz,c0,s0,box);if(!pu)continue;
   const mA=H.mass,mB=t.H.mass,kA=mB/(mA+mB);this.p.x+=pu.x*pu.d*kA;this.p.z+=pu.z*pu.d*kA;t.p.x-=pu.x*pu.d*(1-kA);t.p.z-=pu.z*pu.d*(1-kA);
   const rel=(this.vel.x-t.vel.x)*-pu.x+(this.vel.z-t.vel.z)*-pu.z;if(rel>7&&game.ram)game.ram(this,t,rel);const into=f.x*pu.x+f.z*pu.z;if(into*this.v<0)this.v*=.85;}
  this.p.x=cl(this.p.x,-B-2,B+2);this.p.z=cl(this.p.z,-B-2,B+2);
  this.settle(W,false);
  // turret traverse & gun elevation
  const piv=this.pivot(_a);const want=Math.atan2(c.aim.x-piv.x,c.aim.z-piv.z);const err=angDiff(this.yaw+this.tRel,want);const rate=Tt.trav*(this.crit.turret>0?.4:1);
  const dT=cl(err,-rate*dt,rate*dt);this.tRel=wrapA(this.tRel+dT);this.travV=dT/dt;
  const dx=c.aim.x-piv.x,dz=c.aim.z-piv.z,dh=Math.hypot(dx,dz),dy=c.aim.y-piv.y;let el;
  if(Tt.speed>0){const v2=Tt.speed*Tt.speed,disc=v2*v2-G*(G*dh*dh+2*dy*v2);el=disc>=0?Math.atan((v2-Math.sqrt(disc))/(G*Math.max(1,dh))):Math.PI/4;}else el=Math.atan2(dy,dh);
  const hullAlong=this.pitch*Math.cos(this.tRel)+this.roll*Math.sin(this.tRel);const wantRel=cl(el-hullAlong,-.15,.38);this.gun+=cl(wantRel-this.gun,-dt*.9,dt*.9);
  // dispersion
  const mv=Math.min(1,Math.abs(this.v)/H.speed);const tgtD=Tt.disp*(1+mv*2.6+Math.abs(this.w)*.8+Math.abs(this.travV)*.9);
  if(tgtD>this.disp)this.disp+=(tgtD-this.disp)*Math.min(1,dt*8);else this.disp+=(tgtD-this.disp)*Math.min(1,dt*1.6/Tt.aim);
  // weapon
  if(this.reload>0){this.reload-=dt;if(this.reload<=0){this.reload=0;if(this.ammo<=0)this.ammo=Tt.mag;}}
  if(Tt.charge){if(this.charge>0){this.charge+=dt;if(this.charge>=Tt.charge){this.charge=0;this.shoot(game);}}else if(c.fire&&this.reload<=0)this.charge=1e-4;}
  else if(c.fire&&this.reload<=0&&this.ammo>0)this.shoot(game);}
 shoot(game){const Tt=this.T;this.ammo--;this.reload=this.ammo>0?Tt.rof:Tt.reload;this.lastFire=game.time;this.prot=0;this.stats.shots++;this.vis.rec=1;this.v-=Tt.dmg*.004*(this.H.mass<1.5?1.4:.7)*Math.cos(this.tRel);game.fire(this);
  this.disp=Math.min(this.disp+Tt.bloom,.08);}
 // per-frame visuals
 sync(dt,time){const md=this.model,v=this.vis;if(!this.alive&&!this.wreck){md.root.visible=false;return;}md.root.visible=true;
  md.root.position.copy(this.p);_e.set(-this.pitch,this.yaw,this.roll,'YXZ');md.root.quaternion.setFromEuler(_e);
  if(this.alive){// suspension: react to acceleration
   const lv=this.v,acc=dt>0?(lv-v.lv)/dt:0;v.lv=lv;const lat=this.w*this.v;v.suspV+=(-v.susp*160-v.suspV*11+cl(acc,-30,30)*.9)*dt;v.susp=cl(v.susp+v.suspV*dt,-.12,.12);
   const rr=Math.min(1,dt*6);v.roll+=(cl(-lat*.006,-.05,.05)-v.roll)*rr;const bump=Math.sin(time*18+this.id)*.004*Math.min(1,Math.abs(this.v)/6);
   md.body.rotation.set(-v.susp*.35-v.rec*.04*Math.cos(this.tRel)+bump,0,v.roll+v.rec*.03*Math.sin(this.tRel));md.body.position.y=bump*3;
   // tracks: left/right belt speeds
   const half=this.d.tx;for(let i=0;i<2;i++){const sp=this.v+(i===0?1:-1)*this.w*half;this.trackD[i]+=sp*dt;md.tracks[i].map.offset.y=-this.trackD[i]*.92;md.caps[i].map.rotation=-this.trackD[i]/(this.d.R-.1);}
   md.tur.rotation.y=this.tRel;v.gunVis+=(this.gun-v.gunVis)*Math.min(1,dt*20);md.gun.rotation.x=-v.gunVis;v.rec=Math.max(0,v.rec-dt*3.2);md.barrel.position.z=-Math.pow(v.rec,2)*.55;
   // antenna spring
   v.antVX+=(-v.antX*70-v.antVX*3.5+cl(acc,-30,30)*.25)*dt;v.antVZ+=(-v.antZ*70-v.antVZ*3.5+cl(lat,-40,40)*.12+(this.travV||0)*.6)*dt;v.antX+=v.antVX*dt;v.antZ+=v.antVZ*dt;md.ant.rotation.set(cl(v.antX,-.6,.6),0,cl(v.antZ,-.6,.6));
   if(md.coilM)md.coilM.emissiveIntensity=.5+(this.charge>0?this.charge/this.T.charge*5:0)+(this.reload<=0?.6+Math.sin(time*4)*.2:0);
   md.teamM.emissiveIntensity=this.prot>0?2.5+Math.sin(time*20)*1.5:1.1;}}
 kill(){this.alive=false;this.wreck=true;for(const[o]of this.model.all)if(o.material!==this.model.teamM||true)o.material=wreckMat();}
}
export {PAINTS};
