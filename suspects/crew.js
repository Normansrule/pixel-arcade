// STARSHIP SUSPECTS — the crew rig: a squishy round spacer with a cartoon face, stubby arms, boots, a utility belt
// and a hat. Procedural animation: squash-and-stretch walk, blinking, moods (happy / scared), working, ghost float, knocked out.
import * as THREE from '../vendor/three.module.min.js';
import {fogify} from './world.js';
const S=(r,a=20,b=14)=>new THREE.SphereGeometry(r,a,b);
const G={body:S(.42,36,24),belly:S(.3,24,16),eye:S(.072,18,12),hi:S(.026,8,6),cheek:S(.06,12,8),mouth:new THREE.TorusGeometry(.07,.019,6,18,Math.PI),mouthO:S(.05,12,8),
 arm:S(.11,14,10),foot:S(.13,16,10),belt:new THREE.TorusGeometry(.392,.034,8,40),buckle:new THREE.BoxGeometry(.13,.09,.05),xbar:new THREE.BoxGeometry(.13,.028,.03),
 shadow:new THREE.CircleGeometry(.44,24),star:new THREE.OctahedronGeometry(.06,0),splat:new THREE.CircleGeometry(.7,28)};
G.belt.rotateX(Math.PI/2);G.mouth.rotateZ(Math.PI);
const fm=(m,push=.12)=>fogify(m,{push});
const EYE=fm(new THREE.MeshStandardMaterial({color:0x15161c,roughness:.15,metalness:.1}));
const WHITE=fm(new THREE.MeshBasicMaterial({color:0xffffff}));
const CHEEK=fm(new THREE.MeshBasicMaterial({color:0xff8fb0}));
const DARK=fm(new THREE.MeshStandardMaterial({color:0x2d3140,roughness:.5,metalness:.3}));
const BLOB=new THREE.MeshBasicMaterial({color:0x101020,transparent:true,opacity:.28,depthWrite:false});

/* ---------- hats (cosmetics) ---------- */
export const HATS=[{id:'sprout',n:'SPROUT'},{id:'cap',n:'CAP'},{id:'beanie',n:'BEANIE'},{id:'crown',n:'CROWN'},{id:'chef',n:'CHEF'},{id:'prop',n:'PROPELLER'},{id:'phones',n:'HEADPHONES'},{id:'bow',n:'BOW'},{id:'top',n:'TOP HAT'},{id:'flower',n:'FLOWER'}];
const HM={gold:fm(new THREE.MeshStandardMaterial({color:0xffc83d,roughness:.25,metalness:.8,emissive:0x402800})),white:fm(new THREE.MeshStandardMaterial({color:0xfafafa,roughness:.7})),black:fm(new THREE.MeshStandardMaterial({color:0x1d1f27,roughness:.5})),
 red:fm(new THREE.MeshStandardMaterial({color:0xff4d5e,roughness:.5})),pink:fm(new THREE.MeshStandardMaterial({color:0xff7ab8,roughness:.5})),yellow:fm(new THREE.MeshStandardMaterial({color:0xffd23a,roughness:.5})),blue:fm(new THREE.MeshStandardMaterial({color:0x4fa3ff,roughness:.5})),green:fm(new THREE.MeshStandardMaterial({color:0x4fd16a,roughness:.5}))};
function hat(id,suit,glow){const g=new THREE.Group();const m=(geo,mat,p,r,s)=>{const o=new THREE.Mesh(geo,mat);if(p)o.position.set(...p);if(r)o.rotation.set(...r);if(s)o.scale.set(...s);o.castShadow=true;g.add(o);return o;};
 const half=(r)=>new THREE.SphereGeometry(r,24,12,0,Math.PI*2,0,Math.PI/2);
 switch(id){
  case'sprout':{m(new THREE.CylinderGeometry(.016,.022,.26,6),DARK,[0,.96,0],[0,0,.18]);const b=m(S(.075,14,10),glow,[-.04,1.09,0]);g.userData.bulb=b;break;}
  case'cap':{m(half(.31),HM.red,[0,.74,0],null,[1,.75,1]);m(new THREE.CylinderGeometry(.24,.24,.025,24,1,false,-Math.PI/2,Math.PI),HM.red,[0,.75,.18]);m(S(.04),HM.white,[0,.97,0]);break;}
  case'beanie':{m(half(.33),HM.blue,[0,.72,0],null,[1,.85,1]);m(new THREE.TorusGeometry(.32,.05,8,30),HM.white,[0,.74,0],[Math.PI/2,0,0]);m(S(.08,12,8),HM.white,[0,1.02,0]);break;}
  case'crown':{m(new THREE.CylinderGeometry(.2,.2,.13,16,1,true),HM.gold,[0,.9,0]);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;m(new THREE.ConeGeometry(.05,.13,6),HM.gold,[Math.sin(a)*.19,1.02,Math.cos(a)*.19]);m(S(.026,8,6),HM.red,[Math.sin(a)*.2,.92,Math.cos(a)*.2]);}break;}
  case'chef':{m(new THREE.CylinderGeometry(.2,.22,.2,18),HM.white,[0,.91,0]);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;m(S(.13,12,8),HM.white,[Math.sin(a)*.1,1.08,Math.cos(a)*.1]);}m(S(.14,12,8),HM.white,[0,1.13,0]);break;}
  case'prop':{m(half(.25),HM.yellow,[0,.78,0],null,[1,.7,1]);m(new THREE.CylinderGeometry(.015,.015,.14,6),DARK,[0,.99,0]);const p=new THREE.Group();p.position.y=1.06;g.add(p);for(const s of[-1,1]){const b=new THREE.Mesh(new THREE.BoxGeometry(.3,.012,.07),s>0?HM.red:HM.blue);b.position.x=s*.16;p.add(b);}g.userData.spin=p;break;}
  case'phones':{m(new THREE.TorusGeometry(.37,.035,8,30,Math.PI),HM.black,[0,.5,0],[0,0,0]);for(const s of[-1,1]){m(new THREE.CylinderGeometry(.11,.11,.09,16),HM.pink,[s*.39,.56,0],[0,0,Math.PI/2]);}break;}
  case'bow':{for(const s of[-1,1])m(new THREE.ConeGeometry(.11,.2,10),HM.pink,[.12+s*.11,.92,.05],[0,0,s*Math.PI/2],[1,1,.6]);m(S(.055,10,8),HM.pink,[.12,.92,.05]);break;}
  case'top':{m(new THREE.CylinderGeometry(.27,.27,.025,24),HM.black,[0,.84,0]);m(new THREE.CylinderGeometry(.17,.18,.32,20),HM.black,[0,1.01,0]);m(new THREE.CylinderGeometry(.182,.182,.06,20),HM.red,[0,.89,0]);break;}
  case'flower':{const c=[.15,.86,.12];for(let i=0;i<6;i++){const a=i/6*Math.PI*2;m(S(.06,10,8),HM.white,[c[0]+Math.cos(a)*.08,c[1]+Math.sin(a)*.08,c[2]],null,[1,1,.5]);}m(S(.05,10,8),HM.yellow,[c[0],c[1],c[2]+.02]);break;}}
 return g;}

export function makeCrew(css,hatId='sprout'){const c=new THREE.Color(css);const root=new THREE.Group();
 const suit=fm(new THREE.MeshStandardMaterial({color:c.clone(),roughness:.42,metalness:.02,envMapIntensity:.7}));
 const belly=fm(new THREE.MeshStandardMaterial({color:c.clone().lerp(new THREE.Color(1,1,1),.55),roughness:.5}));
 const boot=fm(new THREE.MeshStandardMaterial({color:c.clone().multiplyScalar(.55),roughness:.55}));
 const glow=new THREE.MeshBasicMaterial({color:c.clone().lerp(new THREE.Color(1,1,1),.4).multiplyScalar(2.2)});
 const mesh=(g,m,p,parent,s)=>{const o=new THREE.Mesh(g,m);if(p)o.position.set(...p);if(s)o.scale.set(...s);o.castShadow=true;parent.add(o);return o;};
 const hips=new THREE.Group();root.add(hips);root.scale.setScalar(1.22);
 const body=new THREE.Group();hips.add(body);
 mesh(G.body,suit,[0,.46,0],body,[1,.92,.96]);mesh(G.belly,belly,[0,.38,.17],body,[1,.95,.62]);
 mesh(G.belt,DARK,[0,.3,0],body);mesh(G.buckle,glow,[0,.3,.39],body);
 const face=new THREE.Group();body.add(face);
 const eyes=[],his=[],xs=[];for(const s of[-1,1]){const e=mesh(G.eye,EYE,[s*.135,.63,.33],face,[.9,1.2,.55]);e.rotation.x=-.35;eyes.push(e);his.push(mesh(G.hi,WHITE,[s*.135+.028,.68,.35],face));mesh(G.cheek,CHEEK,[s*.24,.53,.318],face,[1,.6,.4]);
  const xg=new THREE.Group();xg.position.set(s*.135,.63,.35);for(const r of[.8,-.8]){const b=new THREE.Mesh(G.xbar,EYE);b.rotation.z=r;xg.add(b);}xg.visible=false;face.add(xg);xs.push(xg);}
 const mouth=mesh(G.mouth,EYE,[0,.53,.388],face);mouth.rotation.x=-.25;const mouthO=mesh(G.mouthO,EYE,[0,.51,.37],face,[1,1.2,.4]);mouthO.visible=false;
 const arms=[];for(const s of[-1,1]){const p=new THREE.Group();p.position.set(s*.38,.52,0);body.add(p);mesh(G.arm,suit,[s*.04,-.1,0],p,[.85,1.15,.85]);arms.push(p);}
 const feet=[];for(const s of[-1,1]){const p=new THREE.Group();p.position.set(s*.16,.13,0);hips.add(p);mesh(G.foot,boot,[0,-.06,.05],p,[.9,.55,1.25]);feet.push(p);}
 const h=hat(hatId,suit,glow);body.add(h);
 // occlusion silhouette: only drawn where something stands between the camera and this crewmate
 const xr=new THREE.Mesh(G.body,new THREE.MeshBasicMaterial({color:c.clone().lerp(new THREE.Color(1,1,1),.35),transparent:true,opacity:.55,depthWrite:false,depthFunc:THREE.GreaterDepth}));
 xr.position.set(0,.46,0);xr.scale.set(1.04,.97,1);xr.renderOrder=6;xr.userData.xray=true;body.add(xr);
 const sh=new THREE.Mesh(G.shadow,BLOB);sh.rotation.x=-Math.PI/2;sh.position.y=.012;root.add(sh);
 root.userData={xray:xr,hips,body,face,eyes,his,xs,mouth,mouthO,arms,feet,hat:h,suit,glow,shadow:sh,phase:Math.random()*6,spd:0,ghost:false,color:c,css,t:Math.random()*9,blink:1+Math.random()*3,mood:0,moodT:0,hop:0};
 return root;}

// st: {speed 0..1, busy, ghost, mood: 0 calm / 1 happy / 2 scared}
export function animate(r,dt,st){const u=r.userData;u.t+=dt;const t=u.t;u.spd+=((st.speed||0)-u.spd)*Math.min(1,dt*10);const s=u.spd;
 u.phase+=dt*(5+s*8)*(s>.05?1:0);const ph=u.phase,sw=Math.sin(ph);
 // blink
 u.blink-=dt;const bl=u.blink<0?Math.max(.08,Math.abs(u.blink+.07)/.07):1;if(u.blink<-.14)u.blink=2+Math.random()*3.5;
 const mood=st.mood||0;const scared=mood===2,happy=mood===1;
 for(const e of u.eyes){const k=scared?1.3:1;e.scale.set(.85*k,1.15*k*(happy?.55:1)*bl,.5);}for(const h of u.his)h.visible=bl>.5;
 u.mouth.visible=!scared;u.mouthO.visible=scared;u.mouth.scale.setScalar(happy?1.35:1);
 if(u.hat.userData.spin)u.hat.userData.spin.rotation.y+=dt*(4+s*18);
 if(u.hat.userData.bulb)u.hat.userData.bulb.scale.setScalar(1+.15*Math.sin(t*3));
 if(st.ghost){u.hips.position.y=.3+Math.sin(t*2.2)*.09;u.body.rotation.z=Math.sin(t*1.3)*.08;u.body.rotation.x=.15*s;for(const f of u.feet)f.visible=false;u.arms[0].rotation.z=-.5+Math.sin(t*2)*.25;u.arms[1].rotation.z=.5-Math.sin(t*2)*.25;u.body.scale.set(1,1,1);return;}
 for(const f of u.feet)f.visible=true;
 // squash and stretch walk: a little hop per step
 const hop=Math.abs(Math.sin(ph))*.09*s;u.hips.position.y=hop+(scared?Math.sin(t*40)*.006:0);
 const sq=1-.07*s*Math.abs(Math.cos(ph))+Math.sin(t*2.4)*.012*(1-s);u.body.scale.set(1+(1-sq)*.6,sq,1+(1-sq)*.6);
 u.feet[0].position.z=sw*.13*s;u.feet[1].position.z=-sw*.13*s;u.feet[0].position.y=.13+Math.max(0,sw)*.06*s;u.feet[1].position.y=.13+Math.max(0,-sw)*.06*s;
 u.body.rotation.x=.12*s;u.body.rotation.z=Math.sin(ph)*.06*s;
 if(st.busy){u.arms[0].rotation.set(-1.3+Math.sin(t*13)*.18,0,-.2);u.arms[1].rotation.set(-1.3+Math.cos(t*11)*.18,0,.2);u.body.rotation.x=.18;}
 else if(happy){u.arms[0].rotation.set(0,0,-2.3+Math.sin(t*10)*.3);u.arms[1].rotation.set(0,0,2.3-Math.sin(t*10)*.3);u.hips.position.y+=Math.abs(Math.sin(t*7))*.12;}
 else{u.arms[0].rotation.set(-sw*.7*s,0,-.15-.1*s);u.arms[1].rotation.set(sw*.7*s,0,.15+.1*s);}
 u.face.position.y=Math.sin(t*2.4)*.004;}

// ghost look: translucent glowing suit, no shadows
export function setGhost(r,on){const u=r.userData;if(u.ghost===on)return;u.ghost=on;u.xray.visible=!on;r.traverse(o=>{if(!o.isMesh||o===u.shadow||o.userData.xray)return;if(on){o.userData.mat=o.material;o.material=ghostMat(u.color);o.castShadow=false;}else if(o.userData.mat){o.material=o.userData.mat;o.castShadow=true;}});u.shadow.visible=!on;}
const gm=new Map();function ghostMat(c){const k=c.getHexString();if(!gm.has(k))gm.set(k,new THREE.MeshBasicMaterial({color:c.clone().lerp(new THREE.Color(1,1,1),.55).multiplyScalar(.8),transparent:true,opacity:.34,depthWrite:false,blending:THREE.AdditiveBlending}));return gm.get(k);}

// a knocked-out crewmate: flat on its back, X eyes, little stars circling, a splat of suit-coloured goo
export function makeBody(css,fx,fz,hatId){const r=makeCrew(css,hatId);const u=r.userData;
 u.hips.position.set(0,.1,-.2);u.body.rotation.x=-Math.PI/2+.12;u.body.scale.set(1.08,.86,1.08);
 for(const e of u.eyes)e.visible=false;for(const h of u.his)h.visible=false;for(const x of u.xs)x.visible=true;u.mouth.visible=false;u.mouthO.visible=true;
 u.arms[0].rotation.set(0,0,-1.4);u.arms[1].rotation.set(0,0,1.2);u.feet[0].rotation.x=-1.2;u.feet[1].rotation.x=-1;u.feet[0].position.set(-.18,.3,.5);u.feet[1].position.set(.2,.25,.46);u.shadow.visible=false;u.xray.visible=false;
 const sp=new THREE.Mesh(G.splat,fogify(new THREE.MeshStandardMaterial({color:u.color.clone().multiplyScalar(.75),roughness:.1,metalness:.1,transparent:true,opacity:.9}),{push:0}));sp.rotation.x=-Math.PI/2;sp.position.set(0,.015,0);sp.scale.setScalar(.01);r.add(sp);
 const ring=new THREE.Group();ring.position.set(0,.75,-.1);const sm=new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,2,.4)});for(let i=0;i<4;i++){const st=new THREE.Mesh(G.star,sm);const a=i/4*Math.PI*2;st.position.set(Math.cos(a)*.35,0,Math.sin(a)*.35);ring.add(st);}r.add(ring);
 r.rotation.y=Math.atan2(fx,fz)+Math.PI;u.splat=sp;u.ring=ring;u.bodyT=0;return r;}
export function animateBody(r,dt){const u=r.userData;u.bodyT+=dt;const k=Math.min(1,u.bodyT/1.2);u.splat.scale.setScalar(.2+.85*(1-(1-k)**3));u.ring.rotation.y+=dt*2.5;u.ring.position.y=.75+Math.sin(u.bodyT*3)*.05;
 const b=Math.min(1,u.bodyT*4);u.body.scale.set(1.08+(1-b)*.3*Math.sin(u.bodyT*30),.86,1.08);}

/* ---------- 2D portrait for meeting tiles / menus (cached data URLs) ---------- */
const pc=new Map();
export function portrait(css,hatId='sprout',dead=false,size=96){const key=css+hatId+dead+size;if(pc.has(key))return pc.get(key);const cv=document.createElement('canvas');cv.width=cv.height=size;const g=cv.getContext('2d');const s=size/96;g.scale(s,s);
 const c=new THREE.Color(css),lt='#'+c.clone().lerp(new THREE.Color(1,1,1),.55).getHexString(),dk='#'+c.clone().multiplyScalar(.6).getHexString();
 g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(48,88,28,5,0,0,7);g.fill();
 g.fillStyle=dk;g.beginPath();g.ellipse(36,84,10,6,0,0,7);g.ellipse(60,84,10,6,0,0,7);g.fill();
 const gr=g.createRadialGradient(38,40,6,48,52,40);gr.addColorStop(0,'#'+c.clone().lerp(new THREE.Color(1,1,1),.25).getHexString());gr.addColorStop(1,css);g.fillStyle=gr;g.beginPath();g.ellipse(48,54,34,31,0,0,7);g.fill();
 g.fillStyle=lt;g.beginPath();g.ellipse(48,66,22,15,0,0,7);g.fill();g.fillStyle='#2d3140';g.fillRect(16,70,64,5);
 g.fillStyle=css;g.beginPath();g.ellipse(14,58,7,10,.3,0,7);g.ellipse(82,58,7,10,-.3,0,7);g.fill();
 if(dead){g.strokeStyle='#15161c';g.lineWidth=4;for(const x of[37,59]){g.beginPath();g.moveTo(x-6,38);g.lineTo(x+6,50);g.moveTo(x+6,38);g.lineTo(x-6,50);g.stroke();}g.fillStyle='#15161c';g.beginPath();g.arc(48,58,4,0,7);g.fill();}
 else{g.fillStyle='#15161c';for(const x of[37,59]){g.beginPath();g.ellipse(x,44,6,8,0,0,7);g.fill();}g.fillStyle='#fff';for(const x of[39,61]){g.beginPath();g.arc(x,40,2.4,0,7);g.fill();}
  g.strokeStyle='#15161c';g.lineWidth=3;g.lineCap='round';g.beginPath();g.arc(48,55,6,.3,Math.PI-.3);g.stroke();}
 g.fillStyle='rgba(255,140,175,.8)';g.beginPath();g.ellipse(27,54,5,3,0,0,7);g.ellipse(69,54,5,3,0,0,7);g.fill();
 const H={red:'#ff4d5e',blue:'#4fa3ff',white:'#fafafa',gold:'#ffc83d',black:'#1d1f27',pink:'#ff7ab8',yellow:'#ffd23a'};
 switch(hatId){
  case'sprout':g.strokeStyle='#2d3140';g.lineWidth=3;g.beginPath();g.moveTo(48,24);g.lineTo(44,10);g.stroke();g.fillStyle='#'+c.clone().lerp(new THREE.Color(1,1,1),.5).getHexString();g.beginPath();g.arc(43,9,6,0,7);g.fill();break;
  case'cap':g.fillStyle=H.red;g.beginPath();g.ellipse(48,28,26,14,0,Math.PI,0);g.fill();g.fillRect(48,24,32,6);break;
  case'beanie':g.fillStyle=H.blue;g.beginPath();g.ellipse(48,30,30,18,0,Math.PI,0);g.fill();g.fillStyle=H.white;g.fillRect(18,26,60,7);g.beginPath();g.arc(48,10,7,0,7);g.fill();break;
  case'crown':g.fillStyle=H.gold;g.beginPath();g.moveTo(30,28);g.lineTo(30,14);g.lineTo(38,22);g.lineTo(48,10);g.lineTo(58,22);g.lineTo(66,14);g.lineTo(66,28);g.closePath();g.fill();break;
  case'chef':g.fillStyle=H.white;g.fillRect(34,14,28,14);for(const[x,y]of[[36,10],[48,6],[60,10]]){g.beginPath();g.arc(x,y,9,0,7);g.fill();}break;
  case'prop':g.fillStyle=H.yellow;g.beginPath();g.ellipse(48,28,20,11,0,Math.PI,0);g.fill();g.fillStyle=H.red;g.fillRect(30,10,18,4);g.fillStyle=H.blue;g.fillRect(48,10,18,4);g.fillStyle='#2d3140';g.fillRect(47,12,2,8);break;
  case'phones':g.strokeStyle=H.black;g.lineWidth=5;g.beginPath();g.arc(48,50,34,Math.PI*1.1,Math.PI*1.9);g.stroke();g.fillStyle=H.pink;g.fillRect(10,40,10,16);g.fillRect(76,40,10,16);break;
  case'bow':g.fillStyle=H.pink;g.beginPath();g.moveTo(62,22);g.lineTo(50,14);g.lineTo(50,30);g.closePath();g.moveTo(62,22);g.lineTo(74,14);g.lineTo(74,30);g.closePath();g.fill();g.beginPath();g.arc(62,22,4,0,7);g.fill();break;
  case'top':g.fillStyle=H.black;g.fillRect(24,26,48,4);g.fillRect(34,4,28,24);g.fillStyle=H.red;g.fillRect(34,22,28,4);break;
  case'flower':g.fillStyle=H.white;for(let i=0;i<6;i++){const a=i/6*Math.PI*2;g.beginPath();g.arc(64+Math.cos(a)*6,24+Math.sin(a)*6,5,0,7);g.fill();}g.fillStyle=H.yellow;g.beginPath();g.arc(64,24,4,0,7);g.fill();break;}
 const url=cv.toDataURL();pc.set(key,url);return url;}
