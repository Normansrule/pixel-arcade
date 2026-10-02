// WILD QUEST — the four Lumen Shrine trials (interiors far off-map): weight, sparks, sphere, ascent.
import * as THREE from '../vendor/three.module.min.js';
import {Builder,mats} from './build.js';
import {U} from './world.js';
const V=THREE.Vector3,C=(r,g,b)=>new THREE.Color().setRGB(r,g,b);
export const ROOM_X=3000,ROOM_DX=220;
const glow=(c,i=2.4)=>new THREE.MeshStandardMaterial({color:0x111111,emissive:c,emissiveIntensity:i,roughness:.4,metalness:.3});
const TEAL=0x38e0e8,ORANGE=0xff6a1a;

function shell(B,ox,W,D,H,o={}){const S=C(.3,.31,.36),F=C(.9,.9,.95);
 if(!o.noFloor)B.box('tile',ox,-1,0,W,1,D,{col:F,climb:false});
 B.box('dark',ox,-14,-D/2-.5,W+2,H+14,1,{col:S,climb:false});B.box('dark',ox,-14,D/2+.5,W+2,H+14,1,{col:S,climb:false});
 B.box('dark',ox-W/2-.5,-14,0,1,H+14,D,{col:S,climb:!!o.climbL});B.box('dark',ox+W/2+.5,-14,0,1,H+14,D,{col:S,climb:false});
 B.box('dark',ox,H,0,W+2,1,D+2,{col:S,climb:false});
 // glowing rune strips
 for(let z=-D/2+3;z<D/2;z+=6)for(const sx of[-1,1])B.add('rune',new THREE.BoxGeometry(.1,.12,3.2),new THREE.Matrix4().makeTranslation(ox+sx*(W/2-.02),1.4,z));
 for(let x=-W/2+3;x<W/2;x+=6)B.add('rune',new THREE.BoxGeometry(3.2,.12,.1),new THREE.Matrix4().makeTranslation(ox+x,H-.05,-D/2+.02));
 B.add('rune',new THREE.TorusGeometry(1.4,.07,4,32),new THREE.Matrix4().makeTranslation(ox,4.5,D/2-.02));}

export function buildShrines(scene,phys){const M=mats();const rooms=[];
 const mk=(i,W,D,H,f,o)=>{const ox=ROOM_X+i*ROOM_DX;const g=new THREE.Group();scene.add(g);const B=new Builder(phys);shell(B,ox,W,D,H,o);const r={i,ox,W,D,H,g,B,spawn:new V(ox,0,D/2-3),solved:false,dyn:[],t:0,lights:[new V(ox,H-2,D/4),new V(ox,H-2,-D/4)]};f(r,B,ox);B.build(scene,M,g);g.visible=false;rooms.push(r);return r;};
 const orb=(r,x,y,z)=>{const g=new THREE.Group();const ped=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,1.1,8),new THREE.MeshStandardMaterial({color:0x55555c,roughness:.5,metalness:.4}));ped.position.y=.55;g.add(ped);
  const o=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,2),glow(TEAL,3));o.position.y=1.5;g.add(o);g.position.set(x,y,z);r.g.add(g);r.orb={g,o,x,y,z,taken:false,c:phys.cyl(x,z,.6,y-1,y+1.1,{climb:false})};return r.orb;};
 const crystal=(r,x,y,z)=>{const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x223344,emissive:ORANGE,emissiveIntensity:.6,roughness:.15,metalness:.2,transparent:true,opacity:.92});
  const c=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0),m);c.scale.y=1.6;c.position.y=1.4;g.add(c);const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,.5,6),new THREE.MeshStandardMaterial({color:0x55555c,roughness:.6}));b.position.y=.25;g.add(b);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.7,.8,32,1,0,Math.PI*2),new THREE.MeshBasicMaterial({color:0x40f0ff,side:THREE.DoubleSide,transparent:true}));ring.position.y=2.6;g.add(ring);
  g.position.set(x,y,z);r.g.add(g);const k={g,c,m,ring,x,y:y+1.4,z,on:0,timer:0};r.crystals=(r.crystals||[]);r.crystals.push(k);phys.cyl(x,z,.45,y,y+2.3,{climb:false});return k;};
 /* 0 · Trial of Weight — push the stone onto the plate to hold the gate open */
 mk(0,20,34,10,(r,B,ox)=>{r.title='TRIAL OF WEIGHT';r.hint='Something heavy could hold that plate down.';
  const door=new THREE.Mesh(new THREE.BoxGeometry(20,8,1),new THREE.MeshStandardMaterial({color:0x34343c,roughness:.5,metalness:.5}));door.position.set(ox,4,-6);r.g.add(door);const dl=new THREE.Mesh(new THREE.BoxGeometry(6,.2,.05),glow(ORANGE,2));dl.position.set(0,1,.52);door.add(dl);
  r.door={m:door,b:phys.cbox(ox,0,-6,20,8,1,{dyn:true,climb:false}),y:0,dl};
  const plate=new THREE.Mesh(new THREE.BoxGeometry(2.4,.2,2.4),new THREE.MeshStandardMaterial({color:0x55555c,emissive:ORANGE,emissiveIntensity:.3,roughness:.5}));plate.position.set(ox+5,.1,1);r.g.add(plate);r.plate={m:plate,x:ox+5,z:1,s:1.2};
  const cube=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.8,1.8),new THREE.MeshStandardMaterial({color:0x8a8478,roughness:.8}));const cg=new THREE.Mesh(new THREE.TorusGeometry(.5,.06,4,24),glow(TEAL,2));cg.position.z=.91;cube.add(cg);const cg2=cg.clone();cg2.position.z=-.91;cube.add(cg2);
  cube.position.set(ox-5,.9,9);cube.castShadow=true;r.g.add(cube);r.cube={m:cube,b:phys.cbox(ox-5,0,9,1.8,1.8,1.8,{dyn:true,climb:false,tag:'cube'}),x:ox-5,z:9,s:.9};
  orb(r,ox,0,-13);
  r.update=(dt,P)=>{const c=r.cube;const onPlate=(x,z,s)=>Math.abs(x-r.plate.x)<r.plate.s+s*.3&&Math.abs(z-r.plate.z)<r.plate.s+s*.3;
   const pressed=onPlate(c.x,c.z,c.s)||(P.p.y<.6&&onPlate(P.p.x,P.p.z,.3));r.plate.m.position.y=pressed?.03:.1;r.plate.m.material.emissive.setHex(pressed?TEAL:ORANGE);
   const ty=pressed?-8.2:0;const d=r.door;const ny=d.y+Math.sign(ty-d.y)*Math.min(Math.abs(ty-d.y),dt*5);phys.move(d.b,0,ny-d.y,0);d.y=ny;d.m.position.y=4+ny;d.dl.material.emissive.setHex(pressed?TEAL:ORANGE);if(pressed&&!r.solvedFx){r.solvedFx=1;r.sfx&&r.sfx('door');}if(!pressed)r.solvedFx=0;};
  // cube push (called by the player controller on contact)
  r.push=(o,dx,dz,dt)=>{if(o!==r.cube.b)return false;const c=r.cube;let mx=0,mz=0;if(Math.abs(dx)>Math.abs(dz))mx=Math.sign(dx);else mz=Math.sign(dz);const sp=2.2*dt;let nx=c.x+mx*sp,nz=c.z+mz*sp;
   const lim=r.W/2-c.s-.05;nx=Math.max(ox-lim,Math.min(ox+lim,nx));const zmin=r.door.y>-7&&c.z>-6?-5.5+c.s:-r.D/2+c.s+.05;nz=Math.min(r.D/2-c.s-.05,Math.max(zmin,nz));
   phys.move(c.b,nx-c.x,0,nz-c.z);c.x=nx;c.z=nz;c.m.position.set(nx,.9,nz);return true;};});
 /* 1 · Trial of Sparks — light all three crystals at once (two need arrows) */
 mk(1,24,40,14,(r,B,ox)=>{r.title='TRIAL OF SPARKS';r.hint='Light every crystal together. Some are out of reach of a blade.';
  const S=C(.9,.9,.95);B.box('tile',ox,-1,8,24,1,24,{col:S,climb:false});B.box('tile',ox,-1,-16,24,1,8,{col:S,climb:false});B.box('dark',ox,-14,-8,24,1,8,{col:C(.05,.05,.07),climb:false});
  B.box('dark',ox-10.5,0,-2,3,7,5,{col:C(.4,.4,.44),climb:false});
  r.noFloor=true;crystal(r,ox-5,0,5);crystal(r,ox-10.5,7,-2);crystal(r,ox+6,0,-16);
  const bridge=new THREE.Mesh(new THREE.BoxGeometry(3.2,.6,8.2),new THREE.MeshStandardMaterial({color:0x4a4a54,emissive:TEAL,emissiveIntensity:.15,roughness:.5}));bridge.position.set(ox,-12,-8);r.g.add(bridge);
  r.bridge={m:bridge,b:phys.cbox(ox,-12.6,-8,3.2,.6,8.2,{dyn:true,climb:false}),y:-12};r.arrows={x:ox+3,z:14};
  const q=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.9,8),new THREE.MeshStandardMaterial({color:0x7a5a30,roughness:.8}));q.position.set(ox+3,.45,14);r.g.add(q);r.quiver=q;
  orb(r,ox,0,-17);
  r.update=(dt)=>{let all=true;for(const k of r.crystals){if(k.on>0)k.on=Math.max(0,k.on-dt);const lit=k.on>0||r.solved;k.m.emissive.setHex(lit?TEAL:ORANGE);k.m.emissiveIntensity=lit?2.4:.6+Math.sin(r.t*3)*.2;k.c.rotation.y+=dt*(lit?2:.4);k.ring.visible=k.on>0&&!r.solved;k.ring.scale.setScalar(Math.max(.01,k.on/9));k.ring.lookAt(r.cam||new V());if(!lit)all=false;}
   if(all&&!r.bridgeUp){r.bridgeUp=true;r.sfx&&r.sfx('door');}const b=r.bridge,ty=r.bridgeUp?-.6:-12.6;const cy=b.b.y0;const ny=cy+Math.sign(ty-cy)*Math.min(Math.abs(ty-cy),dt*7);phys.move(b.b,0,ny-cy,0);b.m.position.y=ny+.3;};
  r.hit=(p,kind)=>{for(const k of r.crystals){if(Math.hypot(p.x-k.x,p.z-k.z)<(kind==='arrow'?1.1:2.6)&&Math.abs(p.y-k.y)<(kind==='arrow'?1.6:2.4)){k.on=9;r.sfx&&r.sfx('crystal');return true;}}return false;};},{noFloor:true});
 /* 2 · Trial of the Sphere — strike the sphere across the swinging bridge into the socket */
 mk(2,22,46,10,(r,B,ox)=>{r.title='TRIAL OF THE SPHERE';r.hint='Strike the sphere to send it rolling. Mind the sliders.';
  const S=C(.9,.9,.95);B.box('tile',ox,-1,15.5,22,1,15,{col:S,climb:false});B.box('tile',ox,-1,-.5,2.8,1,17,{col:C(1,1,1),climb:false});B.box('tile',ox,-1,-16,22,1,14,{col:S,climb:false});
  B.box('dark',ox,-14,0,22,1,46,{col:C(.04,.04,.06),climb:false});
  // dispenser
  B.box('dark',ox+6,0,19,2.4,3.4,2.4,{col:C(.35,.35,.4),climb:false});
  const sock=new THREE.Mesh(new THREE.TorusGeometry(.95,.18,8,32).rotateX(Math.PI/2),glow(ORANGE,2));sock.position.set(ox,.15,-15);r.g.add(sock);r.socket={m:sock,x:ox,z:-15};
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.7,28,20),new THREE.MeshStandardMaterial({color:0x9aa0a8,metalness:.9,roughness:.25,emissive:0x0b3a40,emissiveIntensity:.6}));ball.castShadow=true;r.g.add(ball);
  const lines=new THREE.Mesh(new THREE.TorusGeometry(.705,.035,4,40),glow(TEAL,2));ball.add(lines);const l2=lines.clone();l2.rotation.y=Math.PI/2;ball.add(l2);
  r.ball={m:ball,p:new V(ox+6,4,17.4),v:new V(),home:new V(ox+6,4,17.4),locked:false};
  r.sliders=[];for(const[z,ph]of[[3.5,0],[-4.5,2.2]]){const m=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.6,1),new THREE.MeshStandardMaterial({color:0x3a3a44,emissive:ORANGE,emissiveIntensity:.35,roughness:.5,metalness:.4}));m.position.set(ox,.8,z);m.castShadow=true;r.g.add(m);r.sliders.push({m,b:phys.cbox(ox,0,z,1.4,1.6,1,{dyn:true,climb:false}),z,ph,x:ox});}
  const ob=orb(r,ox,-3,-19.5);
  r.update=(dt,P)=>{for(const s of r.sliders){const nx=ox+Math.sin(r.t*1.1+s.ph)*3.6;phys.move(s.b,nx-s.x,0,0);s.x=nx;s.m.position.x=nx;}
   const b=r.ball;if(!b.locked){b.v.y-=22*dt;b.p.addScaledVector(b.v,dt);const g=phys.ground(b.p.x,b.p.y+.7,b.p.z,.1,.7);if(b.p.y<g.h){b.p.y=g.h;if(b.v.y<-3)r.sfx&&r.sfx('thud');b.v.y=Math.max(0,-b.v.y*.25);b.v.x*=Math.exp(-dt*.55);b.v.z*=Math.exp(-dt*.55);}
    const tmp={x:b.p.x,y:b.p.y+.05,z:b.p.z};const hit=phys.push(tmp,.7,1.2,.3);if(hit.o){const vn=b.v.x*hit.nx+b.v.z*hit.nz;if(vn<0){b.v.x-=(1.6)*vn*hit.nx;b.v.z-=(1.6)*vn*hit.nz;}if(hit.o.dyn&&r.sliders.some(s=>s.b===hit.o)){b.v.x+=hit.nx*3;b.v.z+=hit.nz*3;}b.p.x=tmp.x;b.p.z=tmp.z;}
    const hv=Math.hypot(b.v.x,b.v.z);if(hv>.01){b.m.rotateOnWorldAxis(new V(b.v.z/hv,0,-b.v.x/hv),hv*dt/.7);}
    if(Math.hypot(b.p.x-r.socket.x,b.p.z-r.socket.z)<.9&&b.p.y<.4&&hv<9){b.locked=true;b.p.set(r.socket.x,.25,r.socket.z);sock.material.emissive.setHex(TEAL);r.sfx&&r.sfx('door');}
    if(b.p.y<-8){b.p.copy(b.home);b.v.set(0,0,0);r.sfx&&r.sfx('pop');}
    b.m.position.set(b.p.x,b.p.y+.7,b.p.z);}
   if(b.locked&&ob.y<0){const ny=Math.min(0,ob.y+dt*2);phys.move(ob.c,0,ny-ob.y,0);ob.y=ny;ob.g.position.y=ny;}};
  r.hit=(p,kind,dir)=>{const b=r.ball;if(b.locked)return false;const c=new V(b.p.x,b.p.y+.7,b.p.z);if(p.distanceTo(c)<(kind==='arrow'?1.1:2.4)){const d=new V(dir.x,0,dir.z).normalize();b.v.addScaledVector(d,kind==='arrow'?3:7.5);b.v.y+=1.2;r.sfx&&r.sfx('clang');return true;}return false;};},{noFloor:true});
 /* 3 · Trial of Ascent — climb, wake the updraft, glide to the balcony */
 mk(3,26,36,28,(r,B,ox)=>{r.title='TRIAL OF ASCENT';r.hint='Climb the marked wall. Wind can carry a glider higher.';
  const S=C(.45,.45,.5);B.box('stone',ox-10.5,0,0,5,10,12,{col:C(.42,.4,.36),climb:true});B.box('tile',ox+10.5,14,-9,5,1,10,{col:C(.9,.9,.95),climb:false});
  for(let y=1;y<9.5;y+=1.6)B.add('rune',new THREE.BoxGeometry(.06,.08,10),new THREE.Matrix4().makeTranslation(ox-7.97,y,0));
  const fan=new THREE.Group();const fb=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.8,.4,24),new THREE.MeshStandardMaterial({color:0x3a3a44,metalness:.6,roughness:.4}));fb.position.y=.2;fan.add(fb);
  const blades=new THREE.Group();for(let k=0;k<4;k++){const bl=new THREE.Mesh(new THREE.BoxGeometry(2.2,.08,.6),new THREE.MeshStandardMaterial({color:0x8a8a94,metalness:.8,roughness:.3}));bl.position.x=1.1;bl.rotation.x=.4;const p=new THREE.Group();p.rotation.y=k*Math.PI/2;p.add(bl);blades.add(p);}blades.position.y=.5;fan.add(blades);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.6,.1,6,32).rotateX(Math.PI/2),glow(ORANGE,2));ring.position.y=.42;fan.add(ring);fan.position.set(ox,0,-3);r.g.add(fan);
  const gust=new THREE.Mesh(new THREE.CylinderGeometry(2.4,2.4,22,24,1,true),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uTime:U.uTime},
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uTime;varying vec2 vUv;void main(){float s=smoothstep(.85,1.,sin(vUv.y*30.-uTime*14.+vUv.x*20.)*.5+.5);gl_FragColor=vec4(vec3(.5,.9,1.)*s*.35*(1.-vUv.y),1.);}'}));gust.position.set(ox,11,-3);gust.visible=false;r.g.add(gust);
  r.fan={blades,ring,gust,on:false,x:ox,z:-3};phys.cyl(ox,-3,2.7,-1,.4,{climb:false});
  crystal(r,ox-11,10,3);orb(r,ox+11,15,-11);
  r.update=(dt,P)=>{const k=r.crystals[0];if(k.on>0&&!r.fan.on){r.fan.on=true;r.sfx&&r.sfx('door');}k.m.emissive.setHex(r.fan.on?TEAL:ORANGE);k.m.emissiveIntensity=r.fan.on?2.4:.6+Math.sin(r.t*3)*.2;k.c.rotation.y+=dt;k.ring.visible=false;
   r.fan.ring.material.emissive.setHex(r.fan.on?TEAL:ORANGE);r.fan.gust.visible=r.fan.on;if(r.fan.on)r.fan.blades.rotation.y+=dt*14;};
  r.hit=(p,kind)=>{const k=r.crystals[0];if(Math.hypot(p.x-k.x,p.z-k.z)<(kind==='arrow'?1.1:2.6)&&Math.abs(p.y-k.y)<2.4){k.on=1;r.sfx&&r.sfx('crystal');return true;}return false;};
  r.updraft=(p)=>r.fan.on&&Math.hypot(p.x-r.fan.x,p.z-r.fan.z)<3.2&&p.y<22;},{climbL:false});
 return rooms;}
