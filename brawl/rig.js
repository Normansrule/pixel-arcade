// PLATFORM BRAWL — procedural fighter rigs: articulated limbs, pose library, run cycles, flips, squash & stretch.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
const lerp=(a,b,k)=>a+(b-a)*k;

/* ---------- pose library (radians). sh = shoulder swing fwd, ab = arm out, el = elbow, hp = hip swing fwd, kn = knee, lean, twist, head, y = hip drop ---------- */
const P0={y:0,lean:0,twist:0,head:0,shL:0,shR:0,abL:.12,abR:.12,elL:.25,elR:.25,hpL:0,hpR:0,knL:.08,knR:.08,yaw:0};
const mk=o=>({...P0,...o});
export const POSES={
 idle:mk({y:-.06,lean:.12,shL:.35,shR:-.05,abL:.18,abR:.22,elL:1.3,elR:1.0,hpL:.28,hpR:-.22,knL:.42,knR:.3,twist:-.18}),
 crouch:mk({y:-.5,lean:.45,shL:.7,shR:.5,elL:1.4,elR:1.3,hpL:1.35,knL:2.2,hpR:.9,knR:2.0,abL:.25,abR:.25}),
 jumpUp:mk({lean:.05,hpL:1.0,knL:1.5,hpR:-.15,knR:.5,shL:-.35,shR:-.35,abL:.7,abR:.7,elL:.5,elR:.5,head:-.15}),
 fall:mk({lean:-.05,hpL:.45,knL:.75,hpR:.15,knR:.6,abL:1.0,abR:1.0,shL:.5,shR:.3,elL:.4,elR:.4}),
 shield:mk({y:-.2,lean:.2,shL:1.0,shR:.9,elL:1.8,elR:1.8,abL:.05,abR:.05,hpL:.45,knL:.7,hpR:-.25,knR:.45}),
 hurt:mk({lean:-.45,head:-.45,shL:-.7,shR:-.9,abL:1.25,abR:1.15,elL:.25,elR:.3,hpL:.55,knL:.7,hpR:-.35,knR:.25}),
 tumble:mk({lean:.3,abL:1.5,abR:1.4,shL:1.4,shR:-.6,elL:.3,elR:.2,hpL:1.1,knL:.6,hpR:-.6,knR:.9,head:.3}),
 down:mk({lean:-.2,abL:1.2,abR:1.0,shL:.2,shR:.4,elL:.4,elR:.3,hpL:.2,knL:.5,hpR:.05,knR:.2}),
 ledge:mk({lean:.15,shL:2.95,shR:2.95,abL:-.05,abR:-.05,elL:.15,elR:.15,hpL:.35,knL:.55,hpR:-.05,knR:.45,head:-.3}),
 climb:mk({y:-.3,lean:.7,hpL:1.5,knL:2.0,hpR:.4,knR:1.0,shL:1.2,shR:1.2,elL:.4,elR:.4}),
 dizzy:mk({lean:-.1,head:.35,shL:2.4,shR:2.4,abL:.6,abR:.6,elL:2.3,elR:2.3,hpL:.1,knL:.3,hpR:-.1,knR:.25}),
 hold:mk({lean:.25,shL:1.35,shR:1.35,elL:.7,elR:.7,abL:-.12,abR:-.12,hpL:.4,knL:.4,hpR:-.2,knR:.2}),
 helpless:mk({lean:.1,head:.2,abL:1.3,abR:1.3,shL:.9,shR:.9,elL:.6,elR:.6,hpL:.6,knL:1.1,hpR:.3,knR:1.0}),
 win:mk({lean:-.15,head:-.25,shL:3.0,shR:.4,abL:.35,abR:.4,elL:.1,elR:1.6,hpL:.1,knL:.1,hpR:-.15,knR:.15}),
 win2:mk({y:-.12,lean:.2,shL:1.6,shR:1.6,abL:.7,abR:.7,elL:1.9,elR:1.9,hpL:.6,knL:.7,hpR:-.4,knR:.5}),
 lose:mk({lean:.35,head:.5,shL:.1,shR:.1,abL:.1,abR:.1,elL:.1,elR:.1,hpL:.05,knL:.1,hpR:-.05,knR:.1}),
 jabW:mk({twist:-.4,shR:.3,elR:1.9,shL:.6,elL:1.4,hpL:.3,knL:.4,hpR:-.25,knR:.3}),
 jab:mk({twist:.35,lean:.2,shR:1.55,elR:.05,shL:.2,elL:1.6,hpL:.45,knL:.4,hpR:-.35,knR:.25}),
 punchW:mk({twist:-.65,lean:.05,shR:-.4,elR:2.1,shL:.8,elL:1.2,hpL:.35,knL:.35,hpR:-.35,knR:.25}),
 punch:mk({twist:.55,lean:.3,shL:1.55,elL:0,shR:-.4,elR:1.4,hpL:.7,knL:.45,hpR:-.5,knR:.1}),
 dashHit:mk({twist:.4,lean:.65,shR:1.6,elR:0,shL:-.8,elL:.6,hpL:1.0,knL:.7,hpR:-.8,knR:.3,y:-.15}),
 shoulder:mk({twist:-.8,lean:.6,shL:.2,shR:-.3,elL:2.0,elR:2.0,abL:.3,hpL:.9,knL:.7,hpR:-.7,knR:.2,y:-.2}),
 slash:mk({twist:.9,lean:.5,shR:2.0,abR:.7,elR:.1,shL:-.6,hpL:.9,knL:.8,hpR:-.6,knR:.3,y:-.25}),
 kickW:mk({lean:-.1,hpR:1.0,knR:2.1,shL:.6,shR:-.4,abL:.6,abR:.6,elL:.8,elR:.8,knL:.3}),
 kick:mk({lean:-.4,hpR:1.65,knR:0,shL:-.5,shR:.7,abL:.8,abR:.8,elL:.6,elR:.6,hpL:-.1,knL:.25}),
 dropkick:mk({lean:-.9,hpR:1.6,knR:0,hpL:1.5,knL:.1,shL:-.6,shR:-.6,abL:.9,abR:.9}),
 uppW:mk({y:-.3,lean:.4,shR:-.6,elR:1.9,knL:1.0,knR:1.0,hpL:.7,hpR:.5,shL:.5,elL:1.3}),
 upp:mk({y:.08,lean:-.25,shR:2.95,elR:.25,abR:.15,shL:-.5,elL:1,hpL:.15,knL:.2,hpR:-.35,knR:.15,head:-.35}),
 sweepLow:mk({y:-.55,lean:.5,hpR:1.55,knR:0,hpL:1.4,knL:2.2,shL:.9,shR:.3,abL:.4,abR:.9,elL:1,elR:.5}),
 dtiltPose:mk({y:-.5,lean:.55,shR:1.2,elR:.2,shL:.7,elL:1.2,hpL:1.4,knL:2.2,hpR:.9,knR:1.9}),
 smashW:mk({twist:-1.0,lean:-.2,shR:-1.0,elR:1.3,shL:.5,abR:.5,elL:1,hpL:.6,knL:.7,hpR:-.45,knR:.35,y:-.12}),
 smash:mk({twist:.75,lean:.5,shR:1.65,elR:.05,shL:1.45,elL:.15,hpL:1.0,knL:.55,hpR:-.75,knR:.12,y:-.18}),
 slam:mk({twist:.2,lean:.75,shR:1.0,elR:0,shL:1.0,elL:0,hpL:.9,knL:.8,hpR:-.5,knR:.3,y:-.3}),
 usmW:mk({y:-.45,lean:.5,shL:.3,shR:.3,elL:1.9,elR:1.9,knL:1.7,knR:1.7,hpL:1.05,hpR:1.05}),
 usm:mk({y:.15,lean:-.3,shL:3.05,shR:3.05,abL:.22,abR:.22,elL:.1,elR:.1,head:-.45,hpL:.1,hpR:-.15}),
 dsmW:mk({y:-.3,shL:.4,shR:.4,abL:1.4,abR:1.4,elL:.7,elR:.7,knL:1.2,knR:1.2,hpL:.8,hpR:.8}),
 dsm:mk({y:-.6,lean:.3,abL:1.6,abR:1.6,shL:.15,shR:.15,elL:0,elR:0,hpL:1.5,knL:2.2,hpR:-.7,knR:.1}),
 nairW:mk({hpL:.9,knL:1.6,hpR:.9,knR:1.6,shL:.5,shR:.5,elL:1.5,elR:1.5}),
 nair:mk({abL:1.35,abR:1.35,elL:.15,elR:.15,shL:.2,shR:.2,hpL:1.1,knL:.15,hpR:-.85,knR:.2}),
 fairW:mk({lean:-.25,shL:2.9,shR:2.9,elL:.5,elR:.5,hpL:.4,knL:1.2,hpR:.2,knR:1}),
 fair:mk({lean:.45,shL:1.0,shR:1.0,elL:.1,elR:.1,hpL:.8,knL:1.1,hpR:-.2,knR:.6}),
 bairW:mk({lean:.2,hpL:.6,knL:1.8,hpR:.5,knR:1.4,shL:.6,shR:.6,twist:-.3}),
 bair:mk({lean:.55,hpL:-1.45,knL:.05,hpR:.6,knR:1.4,shL:.6,shR:.5,twist:.45,head:-.2}),
 uairW:mk({hpL:.5,knL:1.4,hpR:.6,knR:1.6,shL:-.2,shR:-.2,abL:.6,abR:.6}),
 uair:mk({lean:-.6,hpR:2.7,knR:.1,hpL:.3,knL:1.3,shL:-.7,shR:-.7,abL:.9,abR:.9,elL:.3,elR:.3}),
 dairW:mk({hpL:1.2,knL:2.2,hpR:1.2,knR:2.2,shL:2.4,shR:2.4,elL:.3,elR:.3}),
 dair:mk({lean:.1,hpL:-.1,knL:0,hpR:.15,knR:0,shL:2.7,shR:2.7,abL:.4,abR:.4,elL:.1,elR:.1}),
 grabW:mk({lean:.1,shL:.5,shR:.5,elL:1.6,elR:1.6,hpL:.3,knL:.4}),
 grab:mk({lean:.35,shL:1.55,shR:1.55,elL:.15,elR:.15,abL:-.15,abR:-.15,hpL:.6,knL:.5,hpR:-.3,knR:.2}),
 throwF:mk({twist:.9,lean:.45,shL:1.9,shR:1.9,elL:.1,elR:.1,hpL:.7,knL:.4,hpR:-.4}),
 throwB:mk({twist:-1.2,lean:-.4,shL:2.5,shR:2.5,elL:.2,elR:.2,hpL:.2,hpR:-.5,knR:.4}),
 throwU:mk({lean:-.25,shL:3.05,shR:3.05,abL:.2,abR:.2,elL:.1,elR:.1,head:-.4,hpL:.2,knL:.3}),
 throwD:mk({y:-.35,lean:.7,shL:.5,shR:.5,elL:.2,elR:.2,hpL:1.1,knL:1.4,hpR:-.3,knR:.6}),
 castW:mk({twist:-.5,shR:-.2,elR:1.9,shL:-.2,elL:1.9,lean:-.1,hpL:.3,knL:.4,hpR:-.2}),
 cast:mk({twist:.15,shR:1.55,elR:.1,shL:1.4,elL:.25,abL:-.1,abR:-.1,lean:.2,hpL:.45,knL:.4,hpR:-.35,knR:.2}),
 throwStar:mk({twist:.7,lean:.3,shR:1.4,abR:.9,elR:.1,shL:-.3,elL:1.2,hpL:.5,knL:.4,hpR:-.4}),
 breath:mk({lean:.35,head:-.2,shL:1.2,shR:1.2,abL:.5,abR:.5,elL:1.4,elR:1.4,hpL:.6,knL:.6,hpR:-.4,knR:.3}),
 riseW:mk({y:-.4,knL:1.4,knR:1.4,hpL:.85,hpR:.85,shR:.3,shL:.3,elL:1.2,elR:1.2,lean:.3}),
 rise:mk({shR:3.0,elR:.1,shL:-.4,elL:.6,hpL:.7,knL:1.3,hpR:-.25,knR:.3,lean:-.15,head:-.3}),
 float:mk({shR:2.4,shL:2.4,abL:.6,abR:.6,elL:.2,elR:.2,hpL:.3,knL:.6,hpR:.1,knR:.5,lean:-.1}),
 jet:mk({lean:.1,shL:.5,shR:.5,abL:.9,abR:.9,elL:.4,elR:.4,hpL:.2,knL:.5,hpR:0,knR:.4}),
 spinW:mk({twist:-.6,abL:1.2,abR:1.2,shL:.3,shR:.3,elL:.4,elR:.4,hpL:.4,knL:.5}),
 spin:mk({abL:1.55,abR:1.55,shL:.25,shR:.25,elL:0,elR:0,hpL:.25,knL:.3,hpR:-.15,knR:.2,lean:.1}),
 lariat:mk({abL:1.5,abR:1.5,shL:.0,shR:.0,elL:0,elR:0,hpL:.45,knL:.6,hpR:-.3,knR:.3,lean:.2,y:-.1}),
 pound:mk({y:0,lean:.3,hpL:1.4,knL:2.3,hpR:1.4,knR:2.3,shL:2.6,shR:2.6,abL:.3,abR:.3,elL:.4,elR:.4}),
 counterW:mk({twist:-.3,shL:.9,shR:.5,elL:1.7,elR:2.0,lean:-.15,hpL:.4,knL:.5}),
 counter:mk({twist:-.5,shL:1.6,shR:.2,abL:.3,elL:.2,elR:1.8,lean:-.2,hpL:.5,knL:.5,hpR:-.3,knR:.3}),
 reflect:mk({abL:1.5,abR:1.5,shL:1.0,shR:1.0,elL:.2,elR:.2,lean:.05,hpL:.3,knL:.4}),
};

/* ---------- materials & helpers ---------- */
const cap=(r,l,s=10)=>new THREE.CapsuleGeometry(r,Math.max(.001,l),4,s);
function std(c,o={}){return new THREE.MeshStandardMaterial({color:c,roughness:o.r??.5,metalness:o.m??.08,envMapIntensity:o.env??.9,...(o.e?{emissive:o.e,emissiveIntensity:o.ei??1}:{})});}
function glowM(c,i=2.2){return new THREE.MeshStandardMaterial({color:0x111111,emissive:c,emissiveIntensity:i,roughness:.4,metalness:0});}
function mesh(g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o;}

/* ---------- rig ---------- */
export function makeRig(def,alt=0){const L=def.look,C=alt?{...L,...L.alt}:L,H=def.Hh,build=L.build;
 const heavy=build==='heavy',slim=build==='slim',robot=build==='robot',robe=build==='robe';
 const mats={suit:std(C.suit,{r:robot?.32:.55,m:robot?.75:.12}),trim:std(C.trim,{r:.6,m:.2}),skin:std(C.skin,{r:robot?.35:.62,m:robot?.7:0}),glow:glowM(C.glow,2.4),eye:glowM(0xffffff,1.6),hair:std(C.hairC??C.suit,{r:.5})};
 if(L.hair==='flame')mats.hair=glowM(C.glow,3);if(L.hair==='spikes')mats.hair=std(C.hairC,{r:.35,m:.1,e:C.hairC,ei:.35});
 const root=new THREE.Group(),yawG=new THREE.Group(),body=new THREE.Group(),pitchG=new THREE.Group(),inner=new THREE.Group();root.add(yawG);yawG.add(body);body.add(pitchG);pitchG.add(inner);
 const cy=H*.5;pitchG.position.y=cy;inner.position.y=-cy;
 const leg=H*.46,thigh=leg*.5,shin=leg*.5,torsoL=H*.28,headR=H*(robot?.105:.1),upA=H*.18,foA=H*.17;
 const lr=H*(heavy?.07:slim?.042:.053),ar=H*(heavy?.062:slim?.036:.045),tw=H*(heavy?.2:slim?.12:.15),hipW=tw*.55;
 const hips=new THREE.Group();hips.position.y=leg;inner.add(hips);
 hips.add(mesh(new THREE.SphereGeometry(tw*.85,14,10).scale(1,.6,.8),mats.trim,0,0,0));
 const torso=new THREE.Group();hips.add(torso);
 // chest
 let chest;if(robot){chest=mesh(new THREE.BoxGeometry(tw*2.1,torsoL*1.05,tw*1.4,1,1,1),mats.suit,0,torsoL*.55,0);const pl=mesh(new THREE.BoxGeometry(tw*1.2,torsoL*.35,.05),mats.glow,0,torsoL*.62,tw*.71);torso.add(pl);}
 else{chest=mesh(cap(tw,torsoL*.55,14).scale(1,1,heavy?.85:.72),mats.suit,0,torsoL*.55,0);}torso.add(chest);
 torso.add(mesh(new THREE.TorusGeometry(tw*.92,H*.012,6,24).rotateX(Math.PI/2).scale(1,1,heavy?.85:.75),mats.glow,0,torsoL*.08,0));
 if(L.belt)torso.add(mesh(new THREE.TorusGeometry(tw*1.0,H*.03,8,24).rotateX(Math.PI/2).scale(1,1,.85),std(0xc89a2a,{r:.3,m:.8}),0,torsoL*.12,0));
 const neck=new THREE.Group();neck.position.y=torsoL*1.05;torso.add(neck);
 const head=new THREE.Group();head.position.y=headR*.9;neck.add(head);
 if(robot){head.add(mesh(new THREE.BoxGeometry(headR*2,headR*1.8,headR*1.9),mats.suit,0,0,0));head.add(mesh(new THREE.BoxGeometry(headR*1.6,headR*.45,.06),mats.glow,0,headR*.1,headR*.96));}
 else{head.add(mesh(new THREE.SphereGeometry(headR,18,14),L.hair==='mask'?mats.suit:mats.skin,0,0,0));
  for(const s of[-1,1])head.add(mesh(new THREE.SphereGeometry(headR*.16,8,6),L.hair==='mask'?mats.glow:mats.eye,s*headR*.36,headR*.12,headR*.86));}
 // signature details
 const fx={flames:[],orb:null,scarfAnchor:null,tipObj:null,nozzles:[]};
 if(L.visor)head.add(mesh(new THREE.BoxGeometry(headR*1.9,headR*.36,headR*.5),mats.glow,0,headR*.15,headR*.72));
 if(L.hair==='spikes'){for(let i=0;i<7;i++){const a=(i/6-.5)*2.4;const c=mesh(new THREE.ConeGeometry(headR*.32,headR*1.3,6),mats.hair,Math.sin(a)*headR*.6,headR*.7+Math.cos(a)*headR*.2,-headR*.2-Math.abs(a)*.03);c.rotation.set(-.8,0,-a*.6);head.add(c);}}
 if(L.hair==='rocks'){for(let i=0;i<5;i++){const r=mesh(new THREE.DodecahedronGeometry(headR*(.4+Math.random()*.3),0),mats.hair,(Math.random()-.5)*headR*1.2,headR*.8,(Math.random()-.5)*headR);r.rotation.set(Math.random()*3,Math.random()*3,0);head.add(r);}
  for(const s of[-1,1]){const sh=mesh(new THREE.DodecahedronGeometry(tw*.55,0),mats.hair,s*tw*1.05,torsoL*.95,-tw*.1);torso.add(sh);}
  for(let i=0;i<4;i++)torso.add(mesh(new THREE.BoxGeometry(H*.018,torsoL*(.2+Math.random()*.25),.03),mats.glow,(Math.random()-.5)*tw*1.1,torsoL*(.35+Math.random()*.4),tw*.82).rotateZ((Math.random()-.5)*1.2));}
 if(L.hair==='mask'){fx.scarfAnchor=new THREE.Object3D();fx.scarfAnchor.position.set(0,-headR*.6,-headR*.6);head.add(fx.scarfAnchor);head.add(mesh(new THREE.TorusGeometry(headR*.95,headR*.25,8,16).rotateX(Math.PI/2),mats.glow,0,-headR*.75,0));}
 if(L.hair==='hat'){const brim=mesh(new THREE.CylinderGeometry(headR*2.1,headR*2.1,headR*.12,24),mats.hair,0,headR*.55,0);const cone=mesh(new THREE.ConeGeometry(headR*1.05,headR*3,16),mats.hair,0,headR*2.0,-headR*.3);cone.rotation.x=-.35;head.add(brim,cone);
  const band=mesh(new THREE.TorusGeometry(headR*1.0,headR*.1,6,20).rotateX(Math.PI/2),mats.glow,0,headR*.7,0);head.add(band);
  fx.orb=mesh(new THREE.SphereGeometry(H*.07,16,12),glowM(C.glow,3.2));fx.orb.castShadow=false;root.add(fx.orb);}
 if(L.hair==='fin'){const fin=mesh(new THREE.ConeGeometry(headR*.6,headR*2.2,4).scale(.25,1,1.6),mats.glow,0,headR*.85,-headR*.2);fin.rotation.x=-.9;head.add(fin);for(const s of[-1,1]){const g=mesh(new THREE.ConeGeometry(headR*.3,headR*1.1,4).scale(.3,1,1),mats.hair,s*headR*.95,0,-headR*.1);g.rotation.set(-1.2,0,s*.6);head.add(g);}}
 if(L.hair==='flame'){for(let i=0;i<6;i++){const a=(i/5-.5)*2;const c=mesh(new THREE.ConeGeometry(headR*.42,headR*1.7,6),mats.hair,Math.sin(a)*headR*.55,headR*.75,-headR*.25);c.rotation.set(-.6,0,-a*.5);c.castShadow=false;head.add(c);fx.flames.push(c);}}
 if(L.hair==='ears'){for(const s of[-1,1])head.add(mesh(new THREE.SphereGeometry(headR*.38,10,8).scale(1,1,.5),mats.hair,s*headR*.75,headR*.75,0));head.add(mesh(new THREE.SphereGeometry(headR*.48,12,10).scale(1,.8,1),mats.trim,0,-headR*.25,headR*.7));head.add(mesh(new THREE.SphereGeometry(headR*.14,8,6),std(0x111111,{r:.3}),0,-headR*.12,headR*1.13));}
 if(L.hair==='antenna'){const an=mesh(new THREE.CylinderGeometry(H*.008,H*.008,headR*1.6,6),mats.trim,headR*.5,headR*1.5,0);head.add(an);const tip=mesh(new THREE.SphereGeometry(H*.022,10,8),mats.glow,headR*.5,headR*2.35,0);head.add(tip);fx.tipObj=tip;}
 if(L.jetpack){const jp=mesh(new THREE.BoxGeometry(tw*1.6,torsoL*.8,tw*.8),mats.trim,0,torsoL*.55,-tw*1.0);torso.add(jp);for(const s of[-1,1]){const nz=mesh(new THREE.CylinderGeometry(tw*.22,tw*.3,torsoL*.3,10),mats.suit,s*tw*.45,torsoL*.05,-tw*1.05);torso.add(nz);const o=new THREE.Object3D();o.position.set(s*tw*.45,-torsoL*.15,-tw*1.05);torso.add(o);fx.nozzles.push(o);}}
 if(robe){const sk=mesh(new THREE.ConeGeometry(tw*1.5,leg*.85,18,1,true),mats.suit,0,-leg*.3,0);sk.material=mats.suit.clone();sk.material.side=THREE.DoubleSide;hips.add(sk);const hem=mesh(new THREE.TorusGeometry(tw*1.48,H*.012,6,28).rotateX(Math.PI/2),mats.glow,0,-leg*.72,0);hips.add(hem);fx.skirt=sk;fx.hem=hem;}
 // arms
 const arm=s=>{const sh=new THREE.Group();sh.position.set(s*(tw+ar*.6),torsoL*.92,0);torso.add(sh);sh.add(mesh(new THREE.SphereGeometry(ar*(heavy?1.6:1.35),10,8),mats.trim,0,0,0));
  sh.add(mesh(cap(ar,upA-ar*2),mats.suit,0,-upA/2,0));const el=new THREE.Group();el.position.y=-upA;sh.add(el);el.add(mesh(cap(ar*.9,foA-ar*2),robot?mats.suit:mats.skin,0,-foA/2,0));
  const hand=mesh(new THREE.SphereGeometry(ar*(heavy?1.55:1.3),10,8),L.build==='robot'?mats.trim:mats.trim,0,-foA,0);el.add(hand);
  const gl=mesh(new THREE.TorusGeometry(ar*1.05,ar*.25,6,12).rotateX(Math.PI/2),mats.glow,0,-foA*.72,0);el.add(gl);
  const tip=new THREE.Object3D();tip.position.y=-foA-ar;el.add(tip);return{sh,el,hand,tip};};
 const aL=arm(1),aR=arm(-1);
 if(L.trident){const tr=new THREE.Group();const pole=mesh(new THREE.CylinderGeometry(H*.014,H*.014,H*1.25,8),std(0xd9c27a,{r:.3,m:.85}),0,0,0);tr.add(pole);
  for(const x of[-1,0,1]){const p=mesh(new THREE.ConeGeometry(H*.025,H*.16,6),mats.glow,x*H*.05,H*.68,0);tr.add(p);}tr.add(mesh(new THREE.BoxGeometry(H*.13,H*.02,H*.02),std(0xd9c27a,{r:.3,m:.85}),0,H*.6,0));
  tr.position.set(0,-foA,0);tr.rotation.x=Math.PI/2;aR.el.add(tr);fx.trident=tr;}
 // legs
 const legF=s=>{const hp=new THREE.Group();hp.position.set(s*hipW,0,0);hips.add(hp);hp.add(mesh(cap(lr,thigh-lr*1.5),robe?mats.trim:mats.suit,0,-thigh/2,0));const kn=new THREE.Group();kn.position.y=-thigh;hp.add(kn);
  kn.add(mesh(cap(lr*.9,shin-lr*1.5),mats.trim,0,-shin/2,0));const ft=mesh(new THREE.BoxGeometry(lr*2.1,lr*1.3,lr*3.6),robot?mats.suit:mats.trim,0,-shin+lr*.15,lr*.8);kn.add(ft);
  kn.add(mesh(new THREE.TorusGeometry(lr*1.02,lr*.22,6,12).rotateX(Math.PI/2),mats.glow,0,-shin*.62,0));const tip=new THREE.Object3D();tip.position.set(0,-shin,lr*1.6);kn.add(tip);return{hp,kn,tip};};
 const lL=legF(1),lR=legF(-1);
 // shield bubble
 const shieldM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color(C.glow)},uA:{value:1}},
  vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.);gl_FragColor=vec4(uC*(.12+f*1.3)*uA,1.);}'});
 const shield=new THREE.Mesh(new THREE.SphereGeometry(H*.62,28,18),shieldM);shield.position.y=H*.5;shield.visible=false;root.add(shield);
 const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});
 // fresnel rim light on every surface so fighters read against busy backdrops; uFl drives hit flashes
 const rimU={uRimC:{value:new THREE.Color(C.glow).lerp(new THREE.Color(1,1,1),.45)},uRimS:{value:.55},uFl:{value:0},uFlC:{value:new THREE.Color(1,1,1)}};
 for(const m of new Set(all.map(o=>o.material))){if(!m.isMeshStandardMaterial)continue;m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,rimU);
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uRimC,uFlC;uniform float uRimS,uFl;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float fr=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.6);totalEmissiveRadiance+=uRimC*fr*uRimS+uFlC*uFl*(.35+fr);}');};m.customProgramCacheKey=()=>'rim';}
 const allMats=[...new Set(all.map(o=>o.material))];
 const st={pose:{...POSES.idle},phase:0,yaw:0,flip:0,yspin:0,squash:0,squashV:0,fade:1,lastSt:'',djT:0,rollT:0};
 const rig={root,mats,allMats,fx,shield,H,def,rimU,joints:{aL,aR,lL,lR,torso,head,neck,hips},state:st,
  limb(n){return n==='hR'?aR.tip:n==='hL'?aL.tip:n==='fL'?lL.tip:lR.tip;},
  setPose(p,k){const P=st.pose;for(const key in p)P[key]=lerp(P[key],p[key],k);},
  apply(){const p=st.pose;inner.position.y=-cy+p.y*H*.45;torso.rotation.set(p.lean,p.twist,0);head.rotation.x=p.head;
   aL.sh.rotation.set(-p.shL,0,p.abL);aR.sh.rotation.set(-p.shR,0,-p.abR);aL.el.rotation.x=-p.elL;aR.el.rotation.x=-p.elR;
   lL.hp.rotation.set(-p.hpL,0,.04);lR.hp.rotation.set(-p.hpR,0,-.04);lL.kn.rotation.x=p.knL;lR.kn.rotation.x=p.knR;},
  squash(a){st.squashV-=a;},
  setFade(a){if(Math.abs(a-st.fade)<.01)return;st.fade=a;for(const m of allMats){m.transparent=a<.99;m.opacity=a;m.depthWrite=a>.99;}},
 };
 return rig;}

/* ---------- per-frame animation from simulation state ---------- */
const tmp=new V();
export function animate(rig,f,dt,time){const st=rig.state,H=rig.H,P=POSES;let tgt=P.idle,k=Math.min(1,dt*16),flipT=null,yspinT=0,lie=0;
 const sp=Math.abs(f.vx);if(f.st!==st.lastSt){if(f.st==='air'&&st.lastSt==='jsq')rig.squash(-.22);st.lastSt=f.st;}
 switch(f.st){
  case 'idle':case 'land':case 'sdrop':case 'revive':tgt=P.idle;if(f.st==='land'&&f.lag>6)tgt=P.crouch;break;
  case 'walk':case 'run':{const run=f.st==='run';st.phase+=dt*(run?13:9)*Math.min(1.2,.4+sp/(run?f.def.run:f.def.walk)*.7);const s=Math.sin(st.phase),c=Math.cos(st.phase),A=run?1.0:.6;
   tgt={...P0,y:-.08+Math.abs(c)*.06*(run?1.4:1),lean:run?.42:.15,head:run?-.2:0,hpL:s*A+.15,hpR:-s*A+.15,knL:(c>0?c*1.4:.15)*A+.2,knR:(c<0?-c*1.4:.15)*A+.2,shL:-s*A*.9+.2,shR:s*A*.9+.2,elL:run?1.5:.6,elR:run?1.5:.6,abL:.12,abR:.12,twist:s*.15};k=Math.min(1,dt*22);break;}
  case 'crouch':case 'jsq':tgt=P.crouch;k=Math.min(1,dt*30);break;
  case 'air':tgt=f.vy+f.ky>0?P.jumpUp:P.fall;if(st.djT>0)flipT=(1-st.djT/.45)*Math.PI*2;break;
  case 'helpless':tgt=P.helpless;break;
  case 'shield':case 'sstun':tgt=P.shield;k=Math.min(1,dt*30);break;
  case 'stun':tgt=P.hurt;k=Math.min(1,dt*40);break;
  case 'tumble':tgt=P.tumble;flipT=st.flip+dt*Math.min(16,4+Math.hypot(f.kx,f.ky)*25)*(f.kx*f.face>0?-1:1);break;
  case 'down':tgt=P.down;lie=1;break;
  case 'getup':case 'tech':tgt=f.dodgeDir?P.pound:P.crouch;if(f.dodgeDir)flipT=(f.t/30)*Math.PI*2*(f.dodgeDir*f.face>0?1:-1);break;
  case 'dodge':tgt=P.crouch;break;
  case 'roll':tgt=P.pound;flipT=Math.min(1,f.t/24)*Math.PI*2*(f.dodgeDir*f.face>0?1:-1);break;
  case 'adodge':tgt=P.nairW;break;
  case 'ledge':tgt=P.ledge;break;
  case 'lget':tgt=f.sub==='roll'?P.pound:P.climb;k=Math.min(1,dt*24);break;
  case 'hold':tgt=P.hold;if(f.pumT>8)tgt=P.slam;break;
  case 'held':tgt=P.hurt;break;
  case 'throw':{const T=f.thr;tgt=P[T&&T.p]||P.throwF;if(f.thrK==='b')yspinT=Math.min(1,f.t/(T?T.rel:12))*Math.PI;k=Math.min(1,dt*20);if(f.thrK==='u'&&f.t<(T?T.rel:12))flipT=0;break;}
  case 'dizzy':tgt=P.dizzy;break;
  case 'win':tgt=f.winPose===1?P.win2:P.win;k=Math.min(1,dt*6);break;
  case 'lose':tgt=P.lose;k=Math.min(1,dt*4);break;
  case 'atk':{const m=f.move;if(!m)break;const p=m.p||['punchW','punch'];const first=m.h.length?Math.min(...m.h.map(h=>h.s)):(m.sp&&(m.sp.at||m.sp.a))||6;
   const last=m.h.length?Math.max(...m.h.map(h=>Math.min(h.e,m.f))):first+6;
   if(f.mt<first)tgt=P[p[0]]||P.idle;else if(f.mt<=last+Math.max(4,(m.f-last)*.4))tgt=P[p[1]]||P.punch;else tgt=f.ground?P.idle:P.fall;
   k=Math.min(1,dt*(f.mt<first?24:46));
   if(m.spin&&f.mt>=m.spin.s&&f.mt<=m.spin.e+2){const q=Math.min(1,(f.mt-m.spin.s)/(m.spin.e-m.spin.s));if(m.spin.y)yspinT=q*Math.PI*2*m.spin.n;else flipT=q*Math.PI*2*m.spin.n;}
   if(m.ys&&f.mt>=m.ys.s&&f.mt<=m.ys.e)yspinT=(f.mt-m.ys.s)/(m.ys.e-m.ys.s)*Math.PI*2*m.ys.n;
   if(m.name==='nair'&&f.mt>4&&f.mt<20)flipT=(f.mt-4)/16*Math.PI*2*(f.def.id==='vex'?1:0);
   if(f.charging){tgt={...tgt};tgt.y=(tgt.y||0)-.08+Math.sin(time*40)*.02;}
   if(m.sp&&m.sp.kind==='pound'&&f.mt>=m.sp.stall)tgt=P.pound;
   break;}
  case 'dead':case 'out':break;
 }
 if(f.st==='idle'||f.st==='revive'){const b=Math.sin(time*2.4+f.slot)*.02;tgt={...tgt,y:tgt.y+b,shL:tgt.shL+b,shR:tgt.shR-b};}
 rig.setPose(tgt,k);rig.apply();
 // facing / spins
 const faceYaw=f.face>0?Math.PI/2-.42:-Math.PI/2+.42;let dy=faceYaw-st.yaw;st.yaw+=dy*Math.min(1,dt*(f.st==='atk'||f.st==='throw'?30:18));
 st.yspin=yspinT?yspinT:st.yspin*(1-Math.min(1,dt*20));
 rig.root.children[0].rotation.y=st.yaw+st.yspin*(f.face);
 if(flipT!==null)st.flip=flipT;else{st.flip=st.flip%(Math.PI*2);if(st.flip>Math.PI)st.flip-=Math.PI*2;if(st.flip<-Math.PI)st.flip+=Math.PI*2;st.flip*=1-Math.min(1,dt*14);}
 const pitch=rig.root.children[0].children[0].children[0];pitch.rotation.x=st.flip+(lie?-1.45:0);
 const bodyG=rig.root.children[0].children[0];bodyG.position.y=lie?-H*.38:0;
 // squash & stretch spring
 st.squashV+=(-st.squash*260-st.squashV*16)*dt;st.squash+=st.squashV*dt;st.squash=Math.max(-.35,Math.min(.35,st.squash));
 bodyG.scale.set(1-st.squash*.5,1+st.squash,1-st.squash*.5);
 if(st.djT>0)st.djT-=dt;
 // signature fx
 const fx=rig.fx;if(fx.flames.length)fx.flames.forEach((c,i)=>{c.scale.y=1+Math.sin(time*18+i*2.1)*.25;c.scale.x=c.scale.z=1+Math.sin(time*13+i)*.12;});
 if(fx.orb){const hp=rig.limb('hR');hp.getWorldPosition(tmp);rig.root.worldToLocal(tmp);const tx=tmp.x+Math.sin(time*2)*.1,ty=tmp.y+.25+Math.sin(time*3)*.08;fx.orb.position.x+=(tx-fx.orb.position.x)*Math.min(1,dt*10);fx.orb.position.y+=(ty-fx.orb.position.y)*Math.min(1,dt*10);fx.orb.position.z=tmp.z+.1;
  const s=f.charging&&f.mname==='nspec'?1+f.chg*2.2:1;fx.orb.scale.setScalar(s);}
 if(fx.tipObj)fx.tipObj.material.emissiveIntensity=1.5+Math.sin(time*6)*1.2;
}
