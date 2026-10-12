// FORTRESS BREACH — gadgets + throwables + drones + security cameras + explosions + wall-breaking helpers.
// Everything here talks to the game through the context C = {G,L,fx,snd,scene,world,damage,spatial,shakeAt,hud,cam}.
import * as THREE from '../vendor/three.module.min.js';
import {FH,CELL,CAMS} from './level.js';
import {THR} from './ops.js';
const V=THREE.Vector3,R=Math.random;
const std=o=>new THREE.MeshStandardMaterial(o);
const COLS={soft:[.86,.84,.8],ext:[.55,.3,.22],bar:[.6,.42,.26],rein:[.45,.47,.5],hatch:[.6,.42,.26]};

export function initGadgets(C){const{G,L,fx,snd,scene}=C;
 const M={putty:std({color:0xc8b890,roughness:.8}),black:std({color:0x15161a,roughness:.5,metalness:.4}),red:std({color:0xff2a10,emissive:0xff2000,emissiveIntensity:3}),green:std({color:0x30ff60,emissive:0x20ff40,emissiveIntensity:3}),
  blue:std({color:0x40a0ff,emissive:0x2080ff,emissiveIntensity:3}),steel:std({color:0x8a8e94,roughness:.35,metalness:.85}),olive:std({color:0x3e4630,roughness:.7}),orange:std({color:0xff6a1a,roughness:.5}),
  shield:std({color:0x23272d,roughness:.4,metalness:.7}),glass:std({color:0x203040,roughness:.05,metalness:.9,transparent:true,opacity:.6}),wire:new THREE.MeshStandardMaterial({color:0x9a9ea4,roughness:.4,metalness:.9,wireframe:true}),
  camBody:std({color:0xd8d8d8,roughness:.4}),drone:std({color:0x2b2f36,roughness:.5,metalness:.5}),tire:std({color:0x111111,roughness:.9}),yellow:std({color:0xd8b020,roughness:.5})};
 const GX={list:[],nades:[],drones:[],cams:[],M};
 const add=(o)=>{GX.list.push(o);if(o.mesh)scene.add(o.mesh);return o;};
 const kill=(o,quiet)=>{if(!o.alive)return;o.alive=false;if(o.mesh)scene.remove(o.mesh);if(o.box){L.dyn.splice(L.dyn.indexOf(o.box),1);L.reNavBox(o.box);}if(!quiet){fx.sparks.burst(o.pos,20,4,[new THREE.Color(2.4,1.6,.6)],.06,.4,{grav:8,floor:o.pos.y-1});}};
 GX.kill=kill;
 /* ---------------- meshes ---------------- */
 const mk={
  charge(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.5,.34,.05),M.putty);g.add(b);const s=new THREE.Mesh(new THREE.BoxGeometry(.52,.04,.06),M.black);s.position.y=.1;g.add(s);const led=new THREE.Mesh(new THREE.SphereGeometry(.025,8,6),M.red);led.position.set(.18,-.08,.04);g.add(led);g.userData.led=led;return g;},
  cutter(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.4,.12),M.steel);g.add(b);const r=new THREE.Mesh(new THREE.TorusGeometry(.17,.03,8,20),M.orange);r.position.z=.06;g.add(r);const led=new THREE.Mesh(new THREE.SphereGeometry(.03,8,6),M.red);led.position.set(0,.16,.07);g.add(led);g.userData.led=led;return g;},
  shield(){const g=new THREE.Group();const p=new THREE.Mesh(new THREE.BoxGeometry(1.1,.98,.08),M.shield);p.position.y=.49;g.add(p);const w=new THREE.Mesh(new THREE.BoxGeometry(.5,.1,.085),M.glass);w.position.y=.82;g.add(w);
   for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,.5),M.black);l.position.set(s*.45,.03,-.2);g.add(l);}g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;},
  wire(){const g=new THREE.Group();for(let i=0;i<3;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(.5,.16,5,20),M.wire);t.rotation.x=Math.PI/2;t.position.set((i-1)*.45,.16,0);t.scale.set(1,.7,1);g.add(t);}return g;},
  trap(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,.04,14),M.black);b.position.y=.02;g.add(b);const led=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),M.blue);led.position.y=.05;g.add(led);g.userData.led=led;return g;},
  jammer(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.16,.22),M.olive);b.position.y=.08;g.add(b);for(const s of[-1,1]){const a=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.42,6),M.black);a.position.set(s*.1,.36,0);a.rotation.z=s*.25;g.add(a);}
   const led=new THREE.Mesh(new THREE.SphereGeometry(.022,8,6),M.red);led.position.set(0,.17,.11);g.add(led);g.userData.led=led;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;},
  drone(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.16,.08,.22),M.drone);b.position.y=.1;g.add(b);const w=[];for(const sx of[-1,1]){const t=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.05,14),M.tire);t.rotation.z=Math.PI/2;t.position.set(sx*.11,.08,0);g.add(t);w.push(t);}
   const eye=new THREE.Mesh(new THREE.SphereGeometry(.025,10,8),M.green);eye.position.set(0,.12,-.11);g.add(eye);g.userData={w,eye};g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;},
  cam(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.12,14,10,0,Math.PI*2,0,Math.PI*.6),M.camBody);b.rotation.x=Math.PI;g.add(b);const l=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.06,10),M.black);l.rotation.x=Math.PI/2;l.position.set(0,-.05,-.08);g.add(l);
   const led=new THREE.Mesh(new THREE.SphereGeometry(.015,6,5),M.red);led.position.set(.05,-.02,-.08);g.add(led);g.userData.led=led;return g;},
  nade(k){const m=new THREE.Mesh(k==='frag'?new THREE.SphereGeometry(.05,10,8):new THREE.CylinderGeometry(.035,.035,.12,10),std({color:THR[k].col,roughness:.5,metalness:.4}));m.castShadow=true;return m;}};
 GX.mk=mk;
 /* ---------------- aiming helpers ---------------- */
 // what surface is the agent looking at within reach: {kind:'panel'|'hatch'|'floor', pn,u,y,side,p,n}
 GX.aimSurface=(a,reach=2.2)=>{const e=C.eyePos(a),d=C.viewDir(a);const h=L.ray(e.x,e.y,e.z,d.x,d.y,d.z,reach);if(!h)return null;const p=new V(e.x+d.x*h.t,e.y+d.y*h.t,e.z+d.z*h.t);
  if(h.type==='panel'){const pn=h.obj;const ax=pn.axis==='x';const side=ax?Math.sign(e.z-pn.c):Math.sign(e.x-pn.c);return{kind:'panel',pn,u:ax?p.x:p.z,y:p.y,side,p,n:new V(h.nx,h.ny,h.nz),t:h.t};}
  if(h.type==='hatch')return{kind:'hatch',h:h.obj,p,n:new V(0,1,0),t:h.t};if(h.type==='slab'||h.type==='ground'||(h.type==='box'&&h.ny>.5))return{kind:'floor',p,n:new V(0,1,0),t:h.t};return{kind:'other',p,t:h.t};};
 GX.hatchUnder=(a)=>{for(const h of L.hatches){if(h.state==='open')continue;if(Math.abs(a.pos.y-FH)<.3&&Math.abs(a.pos.x-(h.x+.5))<.95&&Math.abs(a.pos.z-(h.z+.5))<.95)return h;}return null;};
 const placeOnFloor=(a,dist)=>{const f=C.fwd(a);const p=new V(a.pos.x+f.x*dist,a.pos.y+.5,a.pos.z+f.z*dist);if(!L.los(a.pos.x,a.pos.y+.5,a.pos.z,p.x,p.y,p.z))return null;p.y=L.groundAt(p.x,p.z,a.pos.y+.4);if(Math.abs(p.y-a.pos.y)>.6)return null;return p;};
 const jammedAt=(p)=>GX.list.some(o=>o.alive&&o.type==='jammer'&&o.pos.distanceTo(p)<5);
 GX.jammedAt=jammedAt;
 /* ---------------- deploy ---------------- */
 GX.deploy=(a,o={})=>{const g=a.op.gad;if(a.gn<=0&&g!=='scan')return false;const side=C.side(a);
  if(g==='charge'||g==='cutter'){let s=o.surf||GX.aimSurface(a,2.3);if(!s)s=null;let tgt=null;
   if(s&&s.kind==='panel'&&s.pn.active){if(g==='charge'&&s.pn.rein)return C.toast(a,'REINFORCED · NEEDS A THERMAL CUTTER'),false;
    const pn=s.pn;const u=Math.max(pn.u0+.35,Math.min(pn.u1-.35,s.u));const y=pn.kind==='bar'?(pn.y0+pn.top)/2:pn.y0+1.05;tgt={type:'panel',pn,u,y,side:s.side};}
   else{const h=s&&s.kind==='hatch'?s.h:GX.hatchUnder(a);if(h&&h.state!=='open'){if(g==='charge'&&h.rein)return C.toast(a,'REINFORCED HATCH · NEEDS A THERMAL CUTTER'),false;tgt={type:'hatch',h};}}
   if(!tgt)return C.toast(a,'AIM AT A WALL, BARRICADE OR HATCH'),false;
   const mesh=mk[g]();let pos;if(tgt.type==='panel'){const pn=tgt.pn,ax=pn.axis==='x';pos=new V(ax?tgt.u:pn.c+tgt.side*(pn.th/2+.03),tgt.y,ax?pn.c+tgt.side*(pn.th/2+.03):tgt.u);mesh.position.copy(pos);mesh.rotation.y=ax?(tgt.side>0?0:Math.PI):(tgt.side>0?Math.PI/2:-Math.PI/2);}
   else{pos=new V(tgt.h.x+.5,FH+.05,tgt.h.z+.5);mesh.position.copy(pos);mesh.rotation.x=-Math.PI/2;}
   a.gn--;add({type:g,owner:a,side,pos,mesh,alive:true,tgt,t:0,armed:false,dur:4});snd.plantCharge();if(a===G.player&&C.VM)C.VM.deploy();G.events.push({t:G.time,x:pos.x,y:pos.y,z:pos.z,kind:'gadget',side});
   if(g==='cutter')G.events.push({t:G.time,x:pos.x,y:pos.y,z:pos.z,kind:'cutter',side});return true;}
  if(g==='shield'||g==='wire'||g==='trap'||g==='jammer'){const p=o.pos?new V(o.pos.x,L.groundAt(o.pos.x,o.pos.z,a.pos.y+.4),o.pos.z):placeOnFloor(a,g==='shield'?1:g==='wire'?1.3:.9);if(!p)return C.toast(a,'NO ROOM HERE'),false;const mesh=mk[g]();mesh.position.copy(p);const yaw=o.yaw??a.yaw;mesh.rotation.y=yaw;
   const obj={type:g,owner:a,side,pos:p,mesh,alive:true,hp:g==='shield'?3:g==='jammer'?2:1,t:0,yaw};
   if(g==='shield'){const fx_=Math.abs(Math.sin(yaw))>Math.abs(Math.cos(yaw));const w=.55,d=.07;obj.box=fx_?{x0:p.x-d,x1:p.x+d,z0:p.z-w,z1:p.z+w,y0:p.y,y1:p.y+.98,mat:'shield',coll:true,ray:true,dyn:true,obj}:{x0:p.x-w,x1:p.x+w,z0:p.z-d,z1:p.z+d,y0:p.y,y1:p.y+.98,mat:'shield',coll:true,ray:true,dyn:true,obj};
    mesh.rotation.y=fx_?Math.PI/2:0;L.dyn.push(obj.box);L.reNavBox(obj.box);}
   a.gn--;add(obj);snd.hammer();if(a===G.player&&C.VM)C.VM.deploy();return true;}
  if(g==='emp'){GX.throwNade(a,'emp',o.target);a.gn--;return true;}
  return false;};
 // detonate all of the agent's charges (X)
 GX.detonate=(a)=>{let n=0;for(const o of GX.list){if(!o.alive||o.type!=='charge'||o.owner!==a||!o.armed)continue;if(jammedAt(o.pos)){if(a===G.player)C.toast(a,'CHARGE JAMMED');o.jamFlash=1;continue;}chargeBlast(o);n++;}return n;};
 function chargeBlast(o){kill(o,true);const t=o.tgt;if(t.type==='hatch'){breakHatch(t.h,{});explode(o.pos.clone().add(new V(0,.2,0)),{R:3,dmg:70,wallR:.5,owner:o.owner,kind:'charge'});return;}
  const pn=t.pn;let cells;if(pn.kind==='bar')cells=L.carve(pn,(pn.u0+pn.u1)/2,(pn.y0+pn.top)/2,1.4,{});else cells=L.carve(pn,t.u,t.y,.68,{ry:1.08,sq:1,jag:.22});
  wallFx(pn,cells,2.2);explode(o.pos,{R:3.2,dmg:80,wallR:.55,owner:o.owner,kind:'charge',skipPanel:pn});G.stats&&G.stats.breaches++;o.owner.stats.breach=(o.owner.stats.breach||0)+1;o.owner.stats.score+=40;}
 /* ---------------- destruction helpers ---------------- */
 function wallFx(pn,cells,force=1){if(!cells.length)return;const ax=pn.axis==='x';const W=cells.map(c=>pn.world(c.u,c.y,0));const n=ax?new V(0,0,1):new V(1,0,0);const kind=pn.rein?'rein':pn.kind;
  fx.wallBurst(W,COLS[kind]||COLS.soft,n,force,kind==='soft'?new THREE.Color(.72,.7,.66):kind==='ext'?new THREE.Color(.5,.44,.38):new THREE.Color(.5,.4,.3));
  const p=W[(W.length/2)|0];const[d,pan]=C.spatial(p);snd.wall(kind==='bar'?'wood':kind==='rein'?'metal':'plaster',d,pan,Math.min(1.5,.4+cells.length/40));
  fx.holes.cull(o=>{if(o.o!==pn)return true;return pn.solidAt(ax?o.x:o.z,o.y);});
  G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'breach',side:'?'});}
 GX.wallFx=wallFx;
 GX.breakPanel=(pn,u,y,rad,o={})=>{const cells=L.carve(pn,u,y,rad,o);wallFx(pn,cells,o.force||1);return cells.length;};
 function breakHatch(h,o){if(!L.breakHatch(h,o))return false;const p=new V(h.x+.5,FH-.05,h.z+.5);const cells=[];for(let i=0;i<16;i++)cells.push({x:h.x+.15+R()*.7,y:FH-.05,z:h.z+.15+R()*.7});fx.wallBurst(cells,o.thermal?COLS.rein:COLS.hatch,new V(0,1,0),.6);
  const[d,pan]=C.spatial(p);snd.wall('wood',d,pan,1);for(const g of GX.list)if(g.alive&&g.tgt&&g.tgt.type==='hatch'&&g.tgt.h===h)kill(g,true);return true;}
 GX.breakHatch=breakHatch;
 /* ---------------- explosions ---------------- */
 function explode(p,o){const{R:Rr=4,dmg=100,wallR=.6,owner=null,kind='frag'}=o;fx.explosion(p,Rr>4?1.2:.9);const[d,pan]=C.spatial(p);snd.boom(d,pan,Rr>4?1:.75);C.shakeAt(p,Rr*3,.7);
  const fl=L.groundAt(p.x,p.z,p.y+.2);if(p.y-fl<.6)fx.scorch.add(new V(p.x,fl+.01,p.z),new V(0,1,0),.8+Rr*.15);
  G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'boom',side:owner?C.side(owner):'?'});
  for(const e of G.agents){if(!e.alive)continue;const c=new V(e.pos.x,e.pos.y+(e.proneV>.5?.3:1),e.pos.z);const dd=c.distanceTo(p);if(dd>Rr)continue;let k=Math.pow(1-dd/Rr,1.25);
   if(!L.los(p.x,p.y+.1,p.z,c.x,c.y,c.z)){const h=L.ray(p.x,p.y+.1,p.z,(c.x-p.x)/dd,(c.y-p.y-.1)/dd,(c.z-p.z)/dd,dd);k*=h&&(h.mat==='soft'||h.mat==='bar'||h.mat==='ext'||h.mat==='wood'||h.mat==='hatch')?.55:0;}
   const friendly=owner&&C.side(e)===C.side(owner)&&e!==owner;if(friendly)k*=.25;if(k*dmg>1)C.damage(e,owner,k*dmg,'chest',{id:kind,from:p});}
  // walls
  if(wallR>0)for(const pn of L.panels){if(!pn.active||pn.rein||pn===o.skipPanel)continue;const ax=pn.axis==='x';const pv=ax?p.z:p.x,pu=ax?p.x:p.z;const dist=Math.abs(pv-pn.c);if(dist>wallR)continue;if(pu<pn.u0-wallR||pu>pn.u1+wallR||p.y<pn.y0-wallR||p.y>pn.top+wallR)continue;
   const r=Math.sqrt(wallR*wallR-dist*dist)*(pn.kind==='bar'?1.6:1);const cells=L.carve(pn,pu,p.y,r+.1,{jag:.45});wallFx(pn,cells,1.4);}
  for(const h of L.hatches)if(h.state!=='open'&&!h.rein&&Math.abs(p.y-FH)<1&&Math.hypot(p.x-h.x-.5,p.z-h.z-.5)<Math.max(.9,wallR+.6))breakHatch(h,{});
  // gadgets, drones, cams, glass
  for(const g of GX.list){if(!g.alive||g.pos.distanceTo(p)>2.6)continue;if(g.type==='shield'){g.hp-=2;if(g.hp>0)continue;}if(g===o.self)continue;kill(g);}
  for(const dr of GX.drones)if(dr.alive&&dr.pos.distanceTo(p)<3)killDrone(dr);for(const c of GX.cams)if(c.alive&&c.pos.distanceTo(p)<3)killCam(c);
  for(const g of C.world.glass)if(!g.broken&&g.mesh.position.distanceTo(p)<4)C.breakGlass(g.op,g.mesh.position);}
 GX.explode=explode;
 /* ---------------- throwables ---------------- */
 GX.throwNade=(a,kind,target,under)=>{const e=C.eyePos(a);e.y-=.05;let vel;
  if(target){const T=Math.max(.5,Math.min(1.5,Math.hypot(target.x-e.x,target.z-e.z)/11));vel=new V((target.x-e.x)/T,(target.y+.2-e.y)/T+.5*12.5*T,(target.z-e.z)/T);if(vel.length()>18)vel.setLength(18);}
  else{vel=C.viewDir(a).multiplyScalar(under?7:15);vel.y+=under?1:2.4;vel.add(a.vel.clone().multiplyScalar(.6));}
  const m=mk.nade(kind);m.position.copy(e);scene.add(m);GX.nades.push({kind,owner:a,pos:e.clone().addScaledVector(vel.clone().normalize(),.3),vel,t:0,mesh:m,fuse:THR[kind].fuse,still:0});
  a.rig.throwT=1;if(a===G.player){C.VM&&C.VM.throwIt();snd.throwIt();}G.events.push({t:G.time,x:a.pos.x,y:a.pos.y,z:a.pos.z,kind:'nade',side:C.side(a)});};
 function stepNades(dt){const g=12.5;for(let i=GX.nades.length-1;i>=0;i--){const n=GX.nades[i];n.t+=dt;let hit=false;
   for(let s=0;s<3;s++){const h=dt/3;n.vel.y-=g*h;const sp=n.vel.length();if(sp<1e-4)continue;const dx=n.vel.x/sp,dy=n.vel.y/sp,dz=n.vel.z/sp;const r=L.ray(n.pos.x,n.pos.y,n.pos.z,dx,dy,dz,sp*h+.06);
    if(r){hit=true;n.pos.addScaledVector(n.vel,Math.max(0,r.t-.06)/sp);let nx=r.nx,ny=r.ny,nz=r.nz;const vn=n.vel.x*nx+n.vel.y*ny+n.vel.z*nz;n.vel.x-=1.5*vn*nx;n.vel.y-=1.5*vn*ny;n.vel.z-=1.5*vn*nz;n.vel.multiplyScalar(ny>.7?.5:.65);
     if(Math.abs(vn)>2){const[d2,p2]=C.spatial(n.pos);snd.bounce(d2,p2);}n.hitPanel=r.type==='panel'?r.obj:null;if(THR[n.kind].impact){n.t=n.fuse;break;}}
    else n.pos.addScaledVector(n.vel,h);}
   // glass
   for(const gl of C.world.glass)if(!gl.broken&&gl.mesh.position.distanceTo(n.pos)<.8)C.breakGlass(gl.op,n.pos);
   n.mesh.position.copy(n.pos);n.mesh.rotation.x+=dt*n.vel.length()*2;if(n.vel.length()<.4)n.still+=dt;
   if(n.t>=n.fuse){scene.remove(n.mesh);GX.nades.splice(i,1);detonate(n);}}}
 function detonate(n){const p=n.pos.clone(),a=n.owner;const[d,pan]=C.spatial(p);
  if(n.kind==='frag')explode(p,{R:5,dmg:125,wallR:.55,owner:a,kind:'frag'});
  else if(n.kind==='impact')explode(p,{R:2.6,dmg:65,wallR:.82,owner:a,kind:'impact'});
  else if(n.kind==='smoke'){fx.smokeCloud(p);snd.smoke(d,pan);}
  else if(n.kind==='flash'){fx.sparks.burst(p,40,10,[new THREE.Color(4,4,4)],.25,.2);fx.flash(p,0xffffff,200,26);snd.bang(d,pan);
   for(const e of G.agents){if(!e.alive)continue;const eye=C.eyePos(e);const dd=eye.distanceTo(p);if(dd>14)continue;if(!L.los(p.x,p.y+.1,p.z,eye.x,eye.y,eye.z))continue;const to=new V().subVectors(p,eye).normalize();const f=C.viewDir(e).dot(to);
    let k=(f>.5?1:f>0?.6:.3)*Math.pow(1-dd/14,.5);if(e===a)k*=.4;else if(C.side(e)===C.side(a))k*=.6;e.blind=Math.max(e.blind,3.6*k);if(e===G.player){snd.tinnitus(k);}if(e.brain&&k>.4)e.brain.tgt=null;}}
  else if(n.kind==='emp'){fx.emp(p);snd.emp(d,pan);for(const g of GX.list){if(!g.alive||g.pos.distanceTo(p)>5)continue;if(g.type==='jammer'||g.type==='trap'){kill(g);G.empKills=(G.empKills||0)+1;if(a)a.stats.score+=20;}}
   for(const c of GX.cams)if(c.alive&&c.pos.distanceTo(p)<6)c.dis=12;G.events.push({t:G.time,x:p.x,y:p.y,z:p.z,kind:'emp',side:'atk'});}}
 /* ---------------- drones ---------------- */
 GX.spawnDrone=(a)=>{const f=C.fwd(a);const pos=new V(a.pos.x+f.x*.8,0,a.pos.z+f.z*.8);pos.y=L.groundAt(pos.x,pos.z,a.pos.y+.3);const mesh=mk.drone();scene.add(mesh);const d={owner:a,pos,vel:new V(),yaw:a.yaw,pitch:-.05,alive:true,jammed:false,mesh,onGround:true,ctl:{mx:0,mz:0,jump:false},spin:0};GX.drones.push(d);a.drone=d;return d;};
 function killDrone(d){if(!d.alive)return;d.alive=false;scene.remove(d.mesh);fx.sparks.burst(d.pos.clone().add(new V(0,.1,0)),24,4,[new THREE.Color(2.4,1.6,.6)],.05,.4,{grav:8,floor:d.pos.y});const[dd,pan]=C.spatial(d.pos);snd.bounce(dd,pan);if(G.player&&d.owner===G.player&&G.view==='drone')C.exitView();}
 GX.killDrone=killDrone;
 function stepDrone(d,dt){if(!d.alive)return;d.jammed=jammedAt(d.pos);const c=d.ctl;const sp=d.jammed?0:4.4;const s=Math.sin(d.yaw),co=Math.cos(d.yaw);let tx=0,tz=0;
  if(!d.jammed){tx=(-s*c.mz+co*c.mx)*sp;tz=(-co*c.mz-s*c.mx)*sp;if(c.world){tx=c.wx*sp;tz=c.wz*sp;}}
  const k=Math.min(1,dt*(d.onGround?8:1.5));d.vel.x+=(tx-d.vel.x)*k;d.vel.z+=(tz-d.vel.z)*k;if(c.jump&&d.onGround&&!d.jammed){d.vel.y=3.4;d.onGround=false;}
  d.vel.y-=13*dt;const p=d.pos;const ox=p.x,oz=p.z;p.x+=d.vel.x*dt;p.z+=d.vel.z*dt;
  // step guard
  const gNew=L.groundAt(p.x,p.z,p.y+.12);if(gNew>p.y+.16){p.x=ox;p.z=oz;}
  L.collide(p,.13,.2,{band:.05});p.y+=d.vel.y*dt;const g=L.groundAt(p.x,p.z,p.y+.15);if(p.y<=g){p.y=g;d.vel.y=0;d.onGround=true;}else if(d.onGround&&p.y-g<.2&&d.vel.y<=0){p.y=g;d.vel.y=0;}else d.onGround=false;
  const ce=L.ceilAt(p.x,p.z,p.y);if(p.y+.2>ce){p.y=ce-.2;d.vel.y=Math.min(0,d.vel.y);}
  d.mesh.position.copy(p);d.mesh.rotation.y=d.yaw;const v=Math.hypot(d.vel.x,d.vel.z);d.spin+=v*dt*9;for(const w of d.mesh.userData.w)w.rotation.x=d.spin;d.mesh.userData.eye.material=d.jammed?M.red:M.green;d.speed=v;}
 GX.droneEye=(d)=>new V(d.pos.x,d.pos.y+.14,d.pos.z);
 /* ---------------- security cameras ---------------- */
 GX.initCams=()=>{for(const c of GX.cams)scene.remove(c.mesh);GX.cams=CAMS.map((c,i)=>{const mesh=mk.cam();mesh.position.set(...c.p);const pos=new V(...c.p);const dx=c.look[0]-c.p[0],dy=c.look[1]-c.p[1],dz=c.look[2]-c.p[2];const yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(dy,Math.hypot(dx,dz));
   mesh.rotation.y=yaw;scene.add(mesh);return{i,n:c.n,pos,yaw0:yaw,pitch0:pitch,yaw,pitch,alive:true,dis:0,mesh};});};
 function killCam(c){if(!c.alive)return;c.alive=false;c.mesh.visible=false;fx.sparks.burst(c.pos,26,4,[new THREE.Color(2.4,1.6,.6),new THREE.Color(.6,1.2,3)],.05,.5,{grav:8,floor:c.pos.y-3});const[d,pan]=C.spatial(c.pos);snd.glass(d,pan);
  if(G.view==='cam'&&G.camI===c.i)C.camNext&&C.camNext(1);}
 GX.killCam=killCam;
 /* ---------------- bullet targets (spheres) ---------------- */
 GX.targets=(shooterSide)=>{const T=[];for(const d of GX.drones)if(d.alive&&C.side(d.owner)!==shooterSide)T.push({p:new V(d.pos.x,d.pos.y+.1,d.pos.z),r:.16,kind:'drone',o:d});
  for(const c of GX.cams)if(c.alive&&shooterSide==='atk')T.push({p:c.pos,r:.15,kind:'cam',o:c});
  for(const g of GX.list)if(g.alive&&g.side!==shooterSide&&(g.type==='trap'||g.type==='jammer'||g.type==='charge'||g.type==='cutter'))T.push({p:new V(g.pos.x,g.pos.y+(g.type==='jammer'?.1:g.type==='trap'?.03:0),g.pos.z),r:g.type==='trap'?.2:.2,kind:'gadget',o:g});return T;};
 GX.hitTarget=(t,a)=>{if(t.kind==='drone')killDrone(t.o);else if(t.kind==='cam'){killCam(t.o);if(a)a.stats.score+=10;}else{const g=t.o;g.hp=(g.hp||1)-1;if(g.hp<=0){kill(g);if(a)a.stats.score+=15;}}};
 /* ---------------- per-frame ---------------- */
 GX.update=(dt)=>{stepNades(dt);for(const d of GX.drones)stepDrone(d,dt);
  for(const o of GX.list){if(!o.alive)continue;o.t+=dt;
   if(o.type==='charge'){o.armed=o.t>.6;const L2=o.mesh.userData.led;L2.material=(o.jamFlash>0||jammedAt(o.pos))&&(G.time*6%1<.5)?M.green:M.red;L2.visible=(G.time*2%1)<.5||!o.armed;o.jamFlash=Math.max(0,(o.jamFlash||0)-dt);}
   else if(o.type==='cutter'){const jam=jammedAt(o.pos);o.jam=jam;o.mesh.userData.led.visible=jam?(G.time*6%1<.5):true;if(jam){o.t-=dt;continue;}
    o.prog=(o.prog||0)+dt;const t=o.tgt;const k=o.prog/o.dur;// sparks along an oval outline
    if(t.type==='panel'){const pn=t.pn,ax=pn.axis==='x';const ang=k*Math.PI*2*1.0;const u=t.u+Math.sin(ang)*.62,y=pn.y0+1.05+Math.cos(ang)*1.02;const p=pn.world(u,y,t.side*1.15);fx.cut(p,ax?new V(0,0,t.side):new V(t.side,0,0));}else fx.cut(o.pos,new V(0,1,0));
    fx.flash(o.pos.clone().add(new V(0,.2,0)),0xffa040,8+R()*6,6);if((o.st=(o.st||0)-dt)<=0){o.st=.22;const[d,pan]=C.spatial(o.pos);snd.cutter(d,pan);}
    if(o.prog>=o.dur){kill(o,true);if(t.type==='panel'){const cells=L.carve(t.pn,t.u,t.pn.y0+1.05,.66,{ry:1.05,sq:1,jag:.12,thermal:true});wallFx(t.pn,cells,.5);}else breakHatch(t.h,{thermal:true});o.owner.stats.score+=50;o.owner.stats.breach=(o.owner.stats.breach||0)+1;}}
   else if(o.type==='trap'){o.mesh.userData.led.visible=(G.time*1.5%1)<.15;if(o.t<1.2)continue;for(const e of G.agents){if(!e.alive||C.side(e)===o.side)continue;if(Math.hypot(e.pos.x-o.pos.x,e.pos.z-o.pos.z)<.55&&Math.abs(e.pos.y-o.pos.y)<.8){
     kill(o,true);fx.zap(o.pos);const[d,pan]=C.spatial(o.pos);snd.zap(d,pan);e.stunT=2;C.damage(e,o.owner,45,'legs',{id:'trap',from:o.pos});o.owner.stats.score+=30;C.spot(e,o.side,4);break;}}}
   else if(o.type==='wire'){for(const e of G.agents){if(!e.alive)continue;if(Math.hypot(e.pos.x-o.pos.x,e.pos.z-o.pos.z)<.95&&Math.abs(e.pos.y-o.pos.y)<.8){e.wireT=.2;if(C.side(e)!==o.side&&Math.hypot(e.vel.x,e.vel.z)>.4&&(o.rt=(o.rt||0)-dt)<=0){o.rt=.45;const[d,pan]=C.spatial(o.pos);snd.wire(d,pan);G.events.push({t:G.time,x:e.pos.x,y:e.pos.y,z:e.pos.z,kind:'wire',side:C.side(e)});}}}}
   else if(o.type==='jammer'){o.mesh.userData.led.visible=(G.time*3%1)<.5;}}
  for(const c of GX.cams){if(!c.alive)continue;c.dis=Math.max(0,c.dis-dt);c.mesh.userData.led.visible=c.dis<=0&&(G.time%1)<.5;c.mesh.rotation.y=c.yaw;}};
 GX.clear=()=>{for(const o of GX.list)if(o.alive)kill(o,true);GX.list.length=0;for(const n of GX.nades)scene.remove(n.mesh);GX.nades.length=0;for(const d of GX.drones)scene.remove(d.mesh);GX.drones.length=0;for(const a of G.agents)a.drone=null;};
 return GX;}
