// BEACON RESCUE — the cast and the props you handle: WICK the repair robot, the stranded keeper, batteries, counterweights,
// cable plugs, charger docks, cell cradles and load pans. All built from primitives; nothing here is from another game.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
const std=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.55,metalness:0},o));
export const MAT={cream:std({color:0xf0e2c4,roughness:.45}),teal:std({color:0x2c8a8c,roughness:.4,metalness:.15}),dark:std({color:0x262a34,roughness:.35,metalness:.2}),
 orange:std({color:0xf07a2a,roughness:.5}),brass:std({color:0xe0aa48,roughness:.3,metalness:.7}),iron:std({color:0x4a5260,roughness:.4,metalness:.4}),rubber:std({color:0x24201c,roughness:.75}),
 eye:new THREE.MeshBasicMaterial({color:new THREE.Color(.6,2.4,2.6)}),screen:std({color:0x0c1820,roughness:.15,metalness:.2}),
 skin:std({color:0xe8b48c,roughness:.7}),oil:std({color:0xf2c22a,roughness:.45}),wool:std({color:0x3a4a6a,roughness:.95}),hair:std({color:0xd8d4cc,roughness:.9}),boot:std({color:0x2a2320,roughness:.7})};

/* ---------- WICK: round-bellied, one-wheeled lamp-repair robot ---------- */
export function makeRobot(){const R=new THREE.Group(),body=new THREE.Group();R.add(body);
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.16,.07,8,18),MAT.rubber);wheel.rotation.y=Math.PI/2;wheel.position.y=.2;R.add(wheel);
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.16,12),MAT.brass);hub.rotation.z=Math.PI/2;hub.position.y=.2;R.add(hub);
 const fork=new THREE.Mesh(new THREE.BoxGeometry(.28,.18,.12),MAT.dark);fork.position.y=.34;body.add(fork);
 const belly=new THREE.Mesh(new THREE.SphereGeometry(.34,20,14),MAT.cream);belly.scale.set(1,.9,.95);belly.position.y=.62;body.add(belly);
 const panel=new THREE.Mesh(new THREE.SphereGeometry(.345,20,14,-.6,1.2,1.2,.9),MAT.teal);panel.scale.copy(belly.scale);panel.position.copy(belly.position);panel.rotation.y=Math.PI;body.add(panel);
 const gauge=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.03,14),MAT.brass);gauge.rotation.x=Math.PI/2;gauge.position.set(0,.6,-.33);body.add(gauge);
 const gaugeLed=new THREE.Mesh(new THREE.CircleGeometry(.04,12),new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1.4,.3)}));gaugeLed.position.set(0,.6,-.347);gaugeLed.rotation.y=Math.PI;body.add(gaugeLed);
 const head=new THREE.Group();head.position.y=1.0;body.add(head);
 const skull=new THREE.Mesh(new THREE.SphereGeometry(.27,20,14),MAT.cream);skull.scale.set(1.15,.85,1);head.add(skull);
 const visor=new THREE.Mesh(new THREE.SphereGeometry(.24,20,14,-1.0,2.0,1.0,1.1),MAT.screen);visor.scale.set(1.15,.85,1.02);visor.rotation.y=Math.PI;head.add(visor);
 const eyes=[];for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.05,4,8),MAT.eye);e.position.set(s*.09,.01,-.24);head.add(e);eyes.push(e);}
 const ear=[];for(const s of[-1,1]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.06,12),MAT.orange);c.rotation.z=Math.PI/2;c.position.set(s*.31,0,0);head.add(c);ear.push(c);}
 const ant=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.22,5),MAT.dark);ant.position.set(.06,.3,0);head.add(ant);
 const bulbM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,1.6,.4)});const bulb=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),bulbM);bulb.position.set(.06,.42,0);head.add(bulb);
 const arms=[];for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.33,.72,0);body.add(sh);const up=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.22,4,8),MAT.dark);up.position.y=-.14;sh.add(up);
  const cl=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),MAT.orange);cl.position.y=-.3;sh.add(cl);arms.push(sh);}
 // backpack cell with its own three-bar gauge, so WICK reads as a robot from behind too
 const pack=new THREE.Mesh(new THREE.BoxGeometry(.36,.38,.16),MAT.teal);pack.position.set(0,.68,.3);body.add(pack);const cap=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.1,8),MAT.brass);cap.position.set(0,.9,.3);body.add(cap);
 for(let i=0;i<3;i++){const l=new THREE.Mesh(new THREE.BoxGeometry(.08,.05,.02),MAT.eye);l.position.set(-.1+i*.1,.66,.385);body.add(l);}
 const glow=new THREE.PointLight(0x9ff0ff,.0,3.2,2);glow.position.set(0,1,-.4);body.add(glow);
 R.userData={body,head,wheel,hub,arms,eyes,bulbM,glow,blink:0,t:0,squash:0};return R;}
export function animRobot(R,dt,st){const u=R.userData;u.t+=dt;const sp=st.speed||0,car=st.carry,cheer=st.cheer||0;
 u.wheel.rotation.x-=sp*dt/.2;u.hub.rotation.x=u.wheel.rotation.x;const bob=Math.sin(u.t*14)*.02*Math.min(1,sp/2)+Math.sin(u.t*2.2)*.012;
 u.squash=Math.max(0,u.squash-dt*4);const sq=Math.sin(u.squash*Math.PI)*.12;u.body.position.y=bob-sq*.5;u.body.scale.set(1+sq*.6,1-sq,1+sq*.6);
 u.body.rotation.x=-Math.min(.25,sp*.06)*(car==='weight'?.4:1);u.head.rotation.z=Math.sin(u.t*1.3)*.05+(st.look||0);u.head.position.y=1.0+(car?-.04:0);
 const up=car?(car==='weight'?2.6:2.9):cheer?2.6+Math.sin(u.t*14)*.4:Math.sin(u.t*8)*.25*Math.min(1,sp/2);u.arms[0].rotation.x+=((car||cheer?-up:up)-u.arms[0].rotation.x)*Math.min(1,dt*10);u.arms[1].rotation.x+=((car||cheer?-up:-up)-u.arms[1].rotation.x)*Math.min(1,dt*10);
 for(const a of u.arms)a.rotation.z=car?(a.position.x<0?-.25:.25):0;
 u.blink-=dt;const b=u.blink<.12?Math.max(.15,Math.abs(u.blink-.06)/.06):1;if(u.blink<0)u.blink=2+Math.random()*3;for(const e of u.eyes)e.scale.y=cheer?.5:b;
 u.bulbM.color.setRGB(...(st.lit?[.6,2.6,2.8]:[2.6,1.6,.4]));u.glow.intensity=st.lit?1.2:0;}

/* ---------- the keeper: oilskin coat, sou'wester, sitting with a dead lantern ---------- */
export function makeKeeper(){const K=new THREE.Group(),body=new THREE.Group();K.add(body);
 const coat=new THREE.Mesh(new THREE.CylinderGeometry(.24,.38,.75,14),MAT.oil);coat.position.y=.55;body.add(coat);
 for(const s of[-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.08,.35,4,8),MAT.wool);leg.rotation.x=Math.PI/2;leg.position.set(s*.12,.22,-.25);body.add(leg);const bt=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.22),MAT.boot);bt.position.set(s*.12,.1,-.5);body.add(bt);}
 const head=new THREE.Group();head.position.y=1.08;body.add(head);const face=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),MAT.skin);head.add(face);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),MAT.hair);hair.position.set(0,-.02,.13);head.add(hair);
 const hat=new THREE.Mesh(new THREE.CylinderGeometry(.13,.3,.16,16),MAT.oil);hat.position.y=.13;hat.rotation.x=-.12;head.add(hat);
 for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.022,6,5),MAT.dark);e.position.set(s*.06,.02,-.155);head.add(e);}
 const nose=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),MAT.skin);nose.position.set(0,-.02,-.17);head.add(nose);
 const arms=[];for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.27,.85,0);body.add(sh);const a=new THREE.Mesh(new THREE.CapsuleGeometry(.07,.3,4,8),MAT.oil);a.position.y=-.2;sh.add(a);const h=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),MAT.skin);h.position.y=-.4;sh.add(h);sh.rotation.x=-.6;arms.push(sh);}
 const lan=new THREE.Group();const lb=new THREE.Mesh(new THREE.CylinderGeometry(.09,.1,.22,10),MAT.iron);lan.add(lb);const lg=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:0x332a20}));lg.position.y=.02;lan.add(lg);lan.position.set(.38,.12,-.15);K.add(lan);
 K.userData={body,head,arms,t:0,lg};return K;}
export function animKeeper(K,dt,mode){const u=K.userData;u.t+=dt;if(mode==='wave'){u.arms[1].rotation.x=-2.7;u.arms[1].rotation.z=Math.sin(u.t*9)*.45-.2;u.arms[0].rotation.x=-.6;u.head.rotation.x=-.25;u.lg.material.color.setRGB(2.6,1.8,.6);}
 else{u.arms[1].rotation.z=0;u.arms[1].rotation.x=-.6+Math.sin(u.t*.8)*.05;u.head.rotation.y=Math.sin(u.t*.4)*.35;u.head.rotation.x=.1;}}

/* ---------- handled objects ---------- */
export function makeBattery(){const g=new THREE.Group();const c=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.46,16),MAT.cream);c.position.y=.23;g.add(c);
 for(const y of[.04,.42]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.215,.215,.05,16),MAT.teal);r.position.y=y;g.add(r);}
 const t=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.08,10),MAT.brass);t.position.y=.5;g.add(t);
 const h=new THREE.Mesh(new THREE.TorusGeometry(.11,.025,6,14,Math.PI),MAT.dark);h.position.y=.47;g.add(h);
 const bars=[];for(let i=0;i<3;i++){const m=new THREE.MeshBasicMaterial({color:0x1a2228});const b=new THREE.Mesh(new THREE.BoxGeometry(.13,.07,.05),m);b.position.set(0,.12+i*.1,-.19);g.add(b);bars.push(m);}
 g.userData={bars};return g;}
export function setCharge(g,c,t){g.userData.bars.forEach((m,i)=>{const f=c>=(i+1)/3-.001?1:c>i/3?.35+.3*Math.sin(t*10):0;f?m.color.setRGB(.4*f,2.4*f,1.6*f):m.color.setHex(0x1a2228);});}
export function makeWeight(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.28,.36,.44,8),MAT.iron);b.position.y=.22;g.add(b);
 const top=new THREE.Mesh(new THREE.CylinderGeometry(.2,.28,.08,8),MAT.iron);top.position.y=.48;g.add(top);const r=new THREE.Mesh(new THREE.TorusGeometry(.12,.035,6,14),MAT.brass);r.position.y=.6;g.add(r);
 const band=new THREE.Mesh(new THREE.CylinderGeometry(.33,.35,.08,8),MAT.orange);band.position.y=.2;g.add(band);return g;}
export function makePlug(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.26),MAT.rubber);b.position.y=.1;g.add(b);
 const col=new THREE.Mesh(new THREE.BoxGeometry(.22,.22,.06),MAT.orange);col.position.set(0,.1,.1);g.add(col);
 for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.03,.05,.12),MAT.brass);p.position.set(s*.05,.1,-.18);g.add(p);}
 const tip=new THREE.MeshBasicMaterial({color:0x2a2a2a});const t=new THREE.Mesh(new THREE.BoxGeometry(.08,.04,.02),tip);t.position.set(0,.21,.02);g.add(t);g.userData={tip};return g;}

/* ---------- devices ---------- */
export function makeDock(){const g=new THREE.Group();const p=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.62,14),MAT.iron);p.position.y=.31;g.add(p);
 const ringM=new THREE.MeshBasicMaterial({color:new THREE.Color(.4,2,2.2)});const r=new THREE.Mesh(new THREE.TorusGeometry(.24,.03,6,20),ringM);r.rotation.x=Math.PI/2;r.position.y=.64;g.add(r);
 const band=new THREE.Mesh(new THREE.CylinderGeometry(.345,.345,.1,14),MAT.orange);band.position.y=.1;g.add(band);g.userData={ringM};return g;}
export function makeCradle(){const g=new THREE.Group();const p=new THREE.Mesh(new THREE.BoxGeometry(.6,.62,.6),MAT.iron);p.position.y=.31;g.add(p);
 const cup=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.06,14,1,true),MAT.brass);cup.position.y=.64;g.add(cup);
 const ledM=new THREE.MeshBasicMaterial({color:0x2a1a14});const l=new THREE.Mesh(new THREE.BoxGeometry(.4,.06,.02),ledM);l.position.set(0,.52,.305);g.add(l);g.userData={ledM};return g;}
export function makePan(){const g=new THREE.Group();const base=new THREE.Mesh(new THREE.CylinderGeometry(.8,.85,.08,24),MAT.iron);base.position.y=.04;g.add(base);
 const dish=new THREE.Mesh(new THREE.CylinderGeometry(.66,.6,.06,24),MAT.brass);dish.position.y=.1;g.add(dish);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.72,.03,6,28),MAT.orange);ring.rotation.x=Math.PI/2;ring.position.y=.09;g.add(ring);
 const post=new THREE.Mesh(new THREE.BoxGeometry(.1,.7,.1),MAT.iron);post.position.set(0,.35,-.95);g.add(post);const dial=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.04,16),MAT.cream);dial.rotation.x=Math.PI/2;dial.position.set(0,.72,-.92);g.add(dial);
 const needle=new THREE.Mesh(new THREE.BoxGeometry(.02,.13,.02),MAT.dark);needle.geometry.translate(0,.06,0);needle.position.set(0,.72,-.89);g.add(needle);g.userData={dish,needle};return g;}
export function makePortRing(n){const g=new THREE.Group();const r=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.06,16),MAT.iron);r.rotation.x=Math.PI/2;g.add(r);
 const ledM=new THREE.MeshBasicMaterial({color:0x2a1a14});const l=new THREE.Mesh(new THREE.TorusGeometry(.15,.025,6,16),ledM);l.position.z=.035;g.add(l);
 g.userData={ledM};return g;}

// cartoon outline: an inverted, slightly larger dark hull behind each part (keeps small things readable on dark floors)
const OUT=new THREE.MeshBasicMaterial({color:0x07080c,side:THREE.BackSide});
export function outline(root,k=1.07){const list=[];root.traverse(o=>{if(o.isMesh&&!o.userData.noOutline&&o.material!==OUT)list.push(o);});
 for(const o of list){const h=new THREE.Mesh(o.geometry,OUT);h.userData.noOutline=true;h.scale.setScalar(k);h.castShadow=false;o.add(h);}return root;}
