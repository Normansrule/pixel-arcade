// CRITTER KART — procedural models: 8 articulated critter drivers + 4 bosses (blinking eyes, spring ears and tails,
// squash & stretch, cheer / sulk / dizzy poses), detailed karts, hovercraft and planes, pickups and props.
import * as THREE from '../vendor/three.module.min.js';
import {merge,M4,ctex,cl,lerp} from './util.js';
const G={sph:new THREE.SphereGeometry(1,22,16),sphL:new THREE.SphereGeometry(1,12,9),cyl:new THREE.CylinderGeometry(1,1,1,18),cone:new THREE.ConeGeometry(1,1,16),box:new THREE.BoxGeometry(1,1,1),tor:new THREE.TorusGeometry(1,.35,12,28),cap:new THREE.CapsuleGeometry(.5,1,6,14),
 rbox:roundBox(1,1,1,.18),band:new THREE.TorusGeometry(1,.1,8,28),smile:new THREE.TorusGeometry(1,.22,6,14,Math.PI),half:new THREE.SphereGeometry(1,18,10,0,Math.PI*2,0,Math.PI/2)};
function roundBox(w,h,d,r){const g=new THREE.BoxGeometry(w,h,d,6,6,6),p=g.attributes.position,v=new THREE.Vector3();const hw=w/2-r,hh=h/2-r,hd=d/2-r;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const c=new THREE.Vector3(cl(v.x,-hw,hw),cl(v.y,-hh,hh),cl(v.z,-hd,hd));const n=v.clone().sub(c);if(n.lengthSq()>1e-9)n.normalize().multiplyScalar(r);p.setXYZ(i,c.x+n.x,c.y+n.y,c.z+n.z);}g.computeVertexNormals();return g;}
const MC=new Map();
export function mat(c,o={}){const k=c+JSON.stringify(o);if(MC.has(k))return MC.get(k);const m=new THREE.MeshStandardMaterial({color:c,roughness:o.r??.55,metalness:o.m??0,emissive:o.e??0,emissiveIntensity:o.ei??1,transparent:!!o.t,opacity:o.t??1,flatShading:!!o.flat,side:o.ds?THREE.DoubleSide:THREE.FrontSide,vertexColors:!!o.vc});MC.set(k,m);return m;}
function mesh(g,m,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(rx,ry,rz);o.castShadow=true;return o;}
const S=(m,x,y,z,sx,sy,sz)=>mesh(G.sph,m,x,y,z,sx,sy,sz);
// geometry list helper: p(L,geo,col,x,y,z,sx,sy,sz,rx,ry,rz)
function p(L,g,c,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0){L.push([g,M4(x,y,z,rx,ry,rz,sx,sy,sz),c]);}
const VC=(r=.55,o={})=>mat(0xffffff,{vc:true,r,...o});
const hex=c=>new THREE.Color(c).getHex();

/* =========================== critters =========================== */
const SPEC={// head radius, eye spacing/height/forward, eye size, mouth pos, body shape
 fox:{hr:.34,es:.13,ey:.07,ez:.27,er:.085,my:-.13,mz:.42},frog:{hr:.38,es:.19,ey:.25,ez:.1,er:.12,my:-.07,mz:.33},penguin:{hr:.33,es:.11,ey:.06,ez:.26,er:.075,my:-.13,mz:.31},
 panda:{hr:.36,es:.13,ey:.06,ez:.29,er:.06,my:-.15,mz:.33},bunny:{hr:.33,es:.13,ey:.07,ez:.26,er:.085,my:-.13,mz:.31},croc:{hr:.34,es:.14,ey:.2,ez:.12,er:.09,my:-.18,mz:.5},
 owl:{hr:.37,es:.13,ey:.06,ez:.3,er:.105,my:-.11,mz:.34},pig:{hr:.36,es:.13,ey:.1,ez:.28,er:.08,my:-.17,mz:.36},
 tortoise:{hr:.3,es:.14,ey:.1,ez:.25,er:.08,my:-.12,mz:.3},walrus:{hr:.36,es:.12,ey:.12,ez:.27,er:.06,my:-.2,mz:.36},moth:{hr:.32,es:.15,ey:.06,ez:.25,er:.1,my:-.12,mz:.29},stormowl:{hr:.37,es:.13,ey:.06,ez:.3,er:.105,my:-.11,mz:.34}};
export function makeCritter(d,o={}){const g=new THREE.Group(),sp=d.sp,P=SPEC[sp]||SPEC.fox,c=hex(d.c),c2=hex(d.c2),dark=0x1a1a1a,pink=0xff8aa8,white=0xffffff;
 const body=new THREE.Group();g.add(body);const head=new THREE.Group();head.position.set(0,.8,.03);body.add(head);
 const big=sp==='tortoise'||sp==='walrus'||sp==='moth'||sp==='stormowl';const U={body,head,arms:[],ears:[],tails:[],wings:[],lids:[],sp,big};
 /* ---- torso ---- */
 const T=[];const fur=sp==='panda'?white:c,belly=sp==='panda'?white:sp==='penguin'?white:c2;
 p(T,G.sph,sp==='panda'?dark:fur,0,.36,0,.34,.36,.3);p(T,G.sph,belly,0,.34,.13,.25,.28,.2);
 if(sp==='panda')p(T,G.sph,white,0,.5,0,.3,.18,.27);
 // legs / feet peeking out in the footwell
 for(const s of[-1,1]){p(T,G.cap,sp==='panda'?dark:fur,s*.15,.13,.22,.18,.22,.18,Math.PI/2.2);p(T,G.sph,sp==='penguin'?0xffa030:sp==='frog'||sp==='croc'?c:sp==='panda'?dark:c2,s*.15,.08,.4,.11,.08,.15);}
 // racing scarf in kart colour
 p(T,G.tor,hex(d.kc??0xff4d00),0,.66,.02,.23,.23,.3,Math.PI/2);p(T,G.box,hex(d.kc??0xff4d00),.12,.6,-.27,.08,.22,.03,.3,0,.4);
 if(sp==='tortoise'){p(T,G.half,0x6a4a2a,0,.32,-.06,.62,.62,.6);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;p(T,G.sph,0x8a6a3a,Math.cos(a)*.36,.56,-.06+Math.sin(a)*.36,.17,.08,.17);}p(T,G.sph,0x8a6a3a,0,.9,-.06,.22,.08,.22);p(T,G.tor,0xd8b070,0,.33,-.06,.62,.62,.25,Math.PI/2);}
 const torso=new THREE.Mesh(merge(T),VC(.6));torso.castShadow=true;body.add(torso);
 /* ---- head ---- */
 const H=[];const hr=P.hr;
 if(sp==='frog'){p(H,G.sph,c,0,0,0,.42,.27,.36);p(H,G.sph,c2,0,-.1,.12,.34,.14,.26);for(const s of[-1,1])p(H,G.sph,c,s*P.es,P.ey-.03,P.ez,.15,.14,.15);}
 else if(sp==='penguin'){p(H,G.sph,c,0,0,0,hr,hr*.95,hr*.95);p(H,G.sph,white,0,-.03,.12,hr*.78,hr*.72,hr*.68);p(H,G.cone,0xffa030,0,-.06,.36,.07,.2,.06,Math.PI/2);}
 else if(sp==='croc'){p(H,G.sph,c,0,0,0,hr,hr*.85,hr);p(H,G.rbox,c,0,-.1,.38,.38,.18,.55);p(H,G.rbox,c2,0,-.18,.36,.34,.06,.52);for(let i=0;i<5;i++)for(const s of[-1,1])p(H,G.cone,white,s*.16,-.21,.16+i*.09,.025,.06,.025,Math.PI);for(const s of[-1,1]){p(H,G.sph,c,s*.08,-.01,.63,.035);p(H,G.sph,c,s*P.es,P.ey-.04,P.ez,.13,.11,.13);}}
 else{p(H,G.sph,sp==='panda'?white:c,0,0,0,hr,hr*.94,hr*.95);}
 if(sp==='fox'){p(H,G.cone,c2,0,-.07,.34,.14,.3,.13,Math.PI/2);p(H,G.sph,dark,0,-.06,.5,.05);for(const s of[-1,1])p(H,G.sph,c2,s*.2,-.12,.16,.16,.12,.12);}
 if(sp==='panda'){for(const s of[-1,1])p(H,G.sph,dark,s*.13,.04,.27,.1,.12,.07,0,0,s*.4);p(H,G.sph,white,0,-.12,.28,.15,.1,.11);p(H,G.sph,dark,0,-.08,.37,.055,.04,.04);}
 if(sp==='bunny'){p(H,G.sph,pink,0,-.05,.33,.05,.04,.04);p(H,G.sph,c2,0,-.12,.27,.15,.1,.11);p(H,G.box,white,0,-.2,.33,.07,.07,.02);for(const s of[-1,1])p(H,G.sph,0xffc0d8,s*.2,-.06,.22,.07,.05,.04);}
 if(sp==='owl'||sp==='stormowl'){p(H,G.sph,c2,0,.01,.18,.3,.28,.18);p(H,G.cone,0xffb030,0,-.08,.36,.06,.15,.06,Math.PI/2+.3);for(const s of[-1,1])p(H,G.cone,c,s*.22,.32,-.02,.08,.22,.06,0,0,-s*.35);if(sp==='stormowl')p(H,G.cone,0xffe04a,0,.42,0,.08,.2,.08);}
 if(sp==='pig'){p(H,G.cyl,c2,0,-.06,.34,.14,.09,.12,Math.PI/2);for(const s of[-1,1])p(H,G.sph,0x8a3a50,s*.045,-.06,.4,.025);for(const s of[-1,1])p(H,G.sph,0xffd0e0,s*.22,-.08,.2,.07,.05,.04);}
 if(sp==='tortoise'){p(H,G.sph,c2,0,-.12,.2,.22,.1,.14);}
 if(sp==='walrus'){p(H,G.sph,c2,0,-.12,.24,.26,.16,.17);p(H,G.sph,dark,0,-.04,.38,.06,.045,.045);for(const s of[-1,1]){p(H,G.cone,0xfffff0,s*.1,-.36,.3,.045,.34,.045,Math.PI);for(let k=0;k<3;k++)p(H,G.cyl,0xddd0c0,s*.2,-.1+k*.04,.34,.008,.18,.008,0,0,Math.PI/2+s*.1);}}
 if(sp==='moth'){for(const s of[-1,1])p(H,G.cone,0x3a1a0a,s*.1,.38,.08,.03,.4,.03,.3,0,-s*.4);p(H,G.sph,0xffe0a0,0,-.02,.22,.28,.24,.17);}
 // racing goggles pushed up on the forehead (not on the frog, croc or bosses)
 if(!big&&sp!=='frog'&&sp!=='croc'){const gc=hex(d.kc??0xff4d00);p(H,G.band,0x2a2a30,0,hr*.5,-.02,hr*.93,hr*.93,hr*.93,Math.PI/2-.45);for(const s of[-1,1]){p(H,G.cyl,gc,s*.1,hr*.78,hr*.42,.085,.06,.085,Math.PI/2.8);p(H,G.cyl,0x9ad8ff,s*.1,hr*.8,hr*.47,.065,.02,.065,Math.PI/2.8);}}
 const headM=new THREE.Mesh(merge(H),VC(.5));headM.castShadow=true;head.add(headM);U.headMesh=headM;
 /* ---- eyes, lids, mouth ---- */
 const E=[],er=P.er,glow=sp==='stormowl';
 for(const s of[-1,1]){p(E,G.sph,0xffffff,s*P.es,P.ey,P.ez,er,er*1.12,er*.75);p(E,G.sph,glow?0x88ccff:0x161616,s*P.es,P.ey+.004,P.ez+er*.5,er*.62,er*.72,er*.42);p(E,G.sph,0xffffff,s*P.es+er*.22,P.ey+er*.35,P.ez+er*.8,er*.18);}
 const eyes=new THREE.Mesh(merge(E),VC(.12,glow?{e:0x2244aa,ei:.6}:{}));head.add(eyes);U.eyes=eyes;
 const lidC=sp==='panda'?dark:sp==='frog'||sp==='croc'?c:sp==='owl'||sp==='stormowl'?c2:c;
 for(const s of[-1,1]){const l=mesh(G.sph,mat(lidC,{r:.6}),s*P.es,P.ey+er*.92,P.ez+.01,er*1.12,er*.2,er*.85);head.add(l);l.userData.y0=P.ey;l.userData.er=er;U.lids.push(l);}
 const mouth=mesh(G.smile,mat(0x3a1418,{r:.5}),0,P.my,P.mz,.06,.06,.06,0,0,Math.PI);if(sp==='frog'){mouth.scale.set(.16,.1,.1);}if(sp==='croc'||sp==='walrus'||sp==='moth')mouth.visible=false;head.add(mouth);U.mouth=mouth;
 /* ---- ears ---- */
 const ear=(x,y,z,build,rz)=>{const e=new THREE.Group();e.position.set(x,y,z);e.rotation.z=rz||0;const L=[];build(L);const m=new THREE.Mesh(merge(L),VC(.6));m.castShadow=true;e.add(m);e.userData.rz=rz||0;head.add(e);U.ears.push(e);return e;};
 for(const s of[-1,1]){
  if(sp==='fox')ear(s*.19,.25,-.02,L=>{p(L,G.cone,c,0,.13,0,.12,.3,.08);p(L,G.cone,dark,0,.22,.01,.06,.12,.045);p(L,G.cone,c2,0,.1,.03,.07,.18,.03);},-s*.28);
  if(sp==='bunny')ear(s*.12,.26,-.03,L=>{p(L,G.sph,c,0,.3,0,.085,.32,.055);p(L,G.sph,pink,0,.29,.035,.055,.25,.02);},-s*.14);
  if(sp==='panda')ear(s*.25,.26,0,L=>{p(L,G.sph,dark,0,.02,0,.11,.11,.07);},-s*.2);
  if(sp==='pig')ear(s*.21,.24,.04,L=>{p(L,G.cone,c,0,.08,0,.11,.22,.06,-.5);p(L,G.cone,0xff7aa0,0,.07,.025,.07,.15,.02,-.5);},-s*.55);
  if(sp==='owl'||sp==='stormowl')ear(s*.2,.3,0,L=>{p(L,G.cone,c,0,.08,0,.07,.2,.05);},-s*.32);
  if(sp==='penguin')ear(s*.0001,.3,-.05,L=>{if(s>0)p(L,G.cone,c,0,.07,0,.06,.16,.06,-.4);},0);}
 /* ---- tail ---- */
 const tail=(x,y,z,segs)=>{let parent=body,first=null;segs.forEach((b,k)=>{const t=new THREE.Group();t.position.set(k?0:x,k?b.oy:y,k?b.oz:z);const L=[];b.f(L);const m=new THREE.Mesh(merge(L),VC(.7));m.castShadow=true;t.add(m);parent.add(t);parent=t;U.tails.push(t);if(!first)first=t;});return first;};
 if(sp==='fox')tail(0,.22,-.28,[{f:L=>{p(L,G.sph,c,0,.08,-.22,.15,.15,.3,-.4);}},{oy:.2,oz:-.42,f:L=>{p(L,G.sph,c,0,.02,-.12,.15,.15,.22);p(L,G.sph,c2,0,.03,-.3,.1,.1,.12);}}]);
 if(sp==='croc')tail(0,.18,-.28,[{f:L=>{p(L,G.cone,c,0,0,-.25,.16,.55,.12,-Math.PI/2);for(let k=0;k<3;k++)p(L,G.cone,c2,0,.1,-.08-k*.14,.03,.08,.03);}},{oy:0,oz:-.5,f:L=>{p(L,G.cone,c,0,0,-.18,.09,.4,.07,-Math.PI/2);}}]);
 if(sp==='bunny')tail(0,.22,-.3,[{f:L=>p(L,G.sph,white,0,0,-.03,.12)}]);
 if(sp==='pig')tail(0,.26,-.3,[{f:L=>p(L,G.tor,c,0,0,-.05,.07,.07,.07,0,Math.PI/2)}]);
 if(sp==='panda')tail(0,.2,-.3,[{f:L=>p(L,G.sph,white,0,0,-.02,.08)}]);
 if(sp==='penguin')tail(0,.12,-.28,[{f:L=>p(L,G.cone,c,0,0,-.06,.12,.16,.05,-Math.PI/2.4)}]);
 if(sp==='owl'||sp==='stormowl')tail(0,.18,-.28,[{f:L=>{for(const k of[-1,0,1])p(L,G.sph,c,k*.07,0,-.1,.06,.03,.16,0,k*.3);}}]);
 /* ---- arms reaching for the wheel ---- */
 const armC=sp==='panda'?dark:sp==='penguin'?c:c,pawC=sp==='frog'||sp==='croc'?c:sp==='panda'?dark:sp==='penguin'?c:c2;
 for(const s of[-1,1]){const a=new THREE.Group();a.position.set(s*.27,.5,.06);const L=[];
  if(sp==='penguin'||sp==='owl'||sp==='stormowl')p(L,G.sph,armC,0,-.02,.16,.07,.08,.26,.3);else{p(L,G.cap,armC,0,0,.15,.1,.3,.1,Math.PI/2.3);p(L,G.sph,pawC,0,-.08,.33,.08);}
  const m=new THREE.Mesh(merge(L),VC(.6));m.castShadow=true;a.add(m);body.add(a);a.rotation.y=-s*.25;U.arms.push(a);}
 /* ---- boss extras ---- */
 if(sp==='moth'||sp==='stormowl'){for(const s of[-1,1]){const w=new THREE.Group();w.position.set(s*.25,.48,-.12);const L=[];
   if(sp==='moth'){p(L,G.sph,0xff6a1a,s*.55,.15,0,.6,.42,.05,0,0,s*.3);p(L,G.sph,0xffd04a,s*.62,.18,.03,.18,.14,.03);p(L,G.sph,0xd83a1a,s*.4,-.25,0,.36,.26,.04,0,0,-s*.4);}
   else p(L,G.sph,c,s*.18,0,-.05,.25,.5,.1,0,0,s*.4);
   const m=new THREE.Mesh(merge(L),VC(.5,sp==='moth'?{e:0xff3a00,ei:.35}:{}));m.castShadow=true;w.add(m);body.add(w);U.wings.push(w);}}
 if(big){g.scale.setScalar(sp==='tortoise'?1.45:1.4);}
 U.state={blink:2+Math.random()*3,lid:0,ear:[0,0],earV:[0,0],tail:0,tailV:0,look:0,cheer:0,sad:0,dizzy:0,bob:0};
 g.userData=U;return g;}

/* Pose a critter. s: {t, dt, steer, v, top, drift(dir), air, spin, boost, mood:'race'|'cheer'|'sad', look, squash, trick, accel} */
export function poseCritter(cr,s){const U=cr.userData,S=U.state,dt=s.dt,t=s.t;if(!S)return;
 // blink
 S.blink-=dt;if(S.blink<0){S.lid=1;if(S.blink<-.13){S.blink=2+Math.random()*3.5;}}else S.lid=Math.max(0,S.lid-dt*12);
 const close=s.spin>0?.0:s.mood==='cheer'?.55*Math.max(0,Math.sin(t*3)):s.mood==='sad'?.45:S.lid;
 for(const l of U.lids){const e=l.userData.er,k=close;l.scale.y=e*lerp(.2,1.12,k);l.position.y=l.userData.y0+e*lerp(.92,0,k);}
 if(U.eyes)U.eyes.scale.setScalar(s.spin>0?1+.15*Math.sin(t*30):s.boost?1.12:1);
 // mouth: grin when boosting / cheering, frown when sad or hit
 if(U.mouth){const happy=s.mood==='cheer'||s.boost||s.trick;const sad=s.mood==='sad'||s.spin>0;U.mouth.rotation.z=sad?0:Math.PI;U.mouth.position.y=SPEC[U.sp].my+(sad?-.02:0);const k=happy?1.5:sad?.9:1;U.mouth.scale.x=lerp(U.mouth.scale.x,(U.sp==='frog'?.16:.06)*k,Math.min(1,dt*10));}
 // springs: ears flap back with speed and bounce with acceleration / landings; tail wags
 const spd=cl(s.v/30,0,1.4),acc=cl((s.accel||0)/20,-1,1),air=s.air?1:0;
 for(let k=0;k<U.ears.length;k++){const tgt=-.25-spd*.75-(s.mood==='sad'?-.9:0)+air*.5+(s.squash||0)*.9;S.earV[k]+=((tgt-S.ear[k])*90-S.earV[k]*9+acc*-20*(k?1.1:.9))*dt;S.ear[k]+=S.earV[k]*dt;
  const e=U.ears[k];e.rotation.x=S.ear[k]*(U.sp==='bunny'?1:.45);e.rotation.z=e.userData.rz+(s.mood==='sad'?(k?.5:-.5)*(U.sp==='bunny'?1:.4):0)+Math.sin(t*9+k)*.04*spd;}
 const wag=s.mood==='cheer'?Math.sin(t*14)*.9:Math.sin(t*(4+spd*6))*(.25+.2*spd)-s.steer*.35+(s.drift||0)*-.5;S.tailV+=((wag-S.tail)*80-S.tailV*8)*dt;S.tail+=S.tailV*dt;
 U.tails.forEach((tl,k)=>{tl.rotation.y=S.tail*(k?.8:1);tl.rotation.x=(k?-.2:-.1)+spd*.2-(s.mood==='sad'?-.5:0);});
 // head: look into turns, back over the shoulder, dizzy wobble, droop when sad
 S.look=lerp(S.look,s.look||0,Math.min(1,dt*5));const dizzy=s.spin>0?Math.sin(t*16)*.45:0;
 U.head.rotation.y=lerp(U.head.rotation.y,s.steer*.4+(s.drift||0)*.25+S.look*2.2+dizzy,Math.min(1,dt*8));
 U.head.rotation.x=lerp(U.head.rotation.x,s.mood==='sad'?.45:s.mood==='cheer'?-.25:-(s.boost?.12:0),Math.min(1,dt*6));U.head.rotation.z=dizzy*.6+(s.mood==='cheer'?Math.sin(t*6)*.2:0);
 // body: squash & stretch, lean in drifts, bounce when cheering
 S.bob=s.mood==='cheer'?Math.abs(Math.sin(t*7))*.22:Math.sin(t*10)*.012*spd;const sq=(s.squash||0),st=s.boost?.07:0;
 U.body.scale.set(1+sq*.28-st*.5,1-sq*.32+st,1+sq*.28-st*.5);U.body.position.y=S.bob-sq*.08;U.body.rotation.z=lerp(U.body.rotation.z,-(s.drift||0)*.18-s.steer*.06,Math.min(1,dt*6));U.body.rotation.x=lerp(U.body.rotation.x,s.boost?-.16:s.mood==='sad'?.18:0,Math.min(1,dt*6));
 // arms: on the wheel, both up and waving when cheering, out wide during tricks, flopped when sad
 U.arms.forEach((a,k)=>{const sd=k?1:-1;let rx=0,rz=s.steer*.35*-sd,ry=-sd*.25;
  if(s.mood==='cheer'){rx=-2.1+Math.sin(t*9+k*2)*.35;rz=0;ry=sd*.55;}else if(s.trick){rx=-1.0;rz=0;ry=sd*1.2;}else if(s.mood==='sad'){rx=.5;rz=sd*.2;}else if(s.spin>0){rx=-1.6+Math.sin(t*20+k)*.6;}
  a.rotation.x=lerp(a.rotation.x,rx,Math.min(1,dt*10));a.rotation.z=lerp(a.rotation.z,rz,Math.min(1,dt*10));a.rotation.y=lerp(a.rotation.y,ry,Math.min(1,dt*10));});
 U.wings.forEach((w,k)=>w.rotation.z=Math.sin(t*(U.big?9:3))*.5*(k?1:-1));}

/* =========================== vehicles =========================== */
const PLATE=new Map();function plateTex(d){const k=d.n;if(PLATE.has(k))return PLATE.get(k);const t=ctex(128,64,(x,w,h)=>{x.fillStyle='#fff';x.fillRect(0,0,w,h);x.fillStyle='#'+new THREE.Color(d.kc).getHexString();x.fillRect(0,0,w,10);x.fillRect(0,h-10,w,10);x.fillStyle='#111';x.font='bold 40px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText((d.n||'?').slice(0,3),w/2,h/2+2);},{clamp:true});PLATE.set(k,t);return t;}
function wheel(r,w,col,sd=1){const g=new THREE.Group();const L=[];p(L,G.cyl,0x1c1c22,0,0,0,r,w,r,0,0,Math.PI/2);p(L,G.tor,0x24242a,-w/2,0,0,r*.84,r*.84,r*.5,0,Math.PI/2);p(L,G.tor,0x24242a,w/2,0,0,r*.84,r*.84,r*.5,0,Math.PI/2);
 for(let k=0;k<10;k++){const a=k/10*Math.PI*2;p(L,G.box,0x2e2e36,0,Math.cos(a)*r*.98,Math.sin(a)*r*.98,w*.9,r*.12,r*.2,a);}
 const tire=new THREE.Mesh(merge(L),VC(.85));tire.castShadow=true;g.add(tire);const R=[];p(R,G.cyl,0xe8e8f0,0,0,0,r*.6,w*1.04,r*.6,0,0,Math.PI/2);for(let k=0;k<5;k++){const a=k/5*Math.PI*2;p(R,G.box,0xc8c8d0,sd*w*.5,Math.cos(a)*r*.32,Math.sin(a)*r*.32,.03,r*.42,.07,a);}p(R,G.cyl,hex(col),0,0,0,r*.22,w*1.1,r*.22,0,0,Math.PI/2);
 const rim=new THREE.Mesh(merge(R),VC(.25,{m:.7}));g.add(rim);return g;}
function flames(g,pts){const fl=[];const m=new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});for(const[x,y,z]of pts){const f=new THREE.Mesh(G.cone,m.clone());f.scale.set(.12,.6,.12);f.rotation.x=-Math.PI/2;f.position.set(x,y,z-.3);f.visible=false;g.add(f);fl.push(f);}return fl;}
export function makeVehicle(type,d,o={}){const g=new THREE.Group(),root=new THREE.Group();g.add(root);const kc=hex(o.color??d.kc),trim=0x24242c,chrome=0xe0e0e8;
 const U={root,wheels:[],type,susp:0};const paint=mat(0xffffff,{vc:true,r:.32,m:.35});
 if(type==='kart'){const L=[],M=[];
  // floor pan + bumpers
  p(L,G.rbox,0x2a2a32,0,.28,.05,1.3,.14,2.5);p(L,G.rbox,trim,0,.34,1.38,1.5,.22,.26);p(L,G.rbox,trim,0,.4,-1.22,1.55,.24,.24);
  // nose cone, side pods, engine cover
  p(L,G.rbox,kc,0,.46,.95,.86,.3,.8);p(L,G.sph,kc,0,.44,1.28,.42,.17,.24);p(L,G.rbox,0xffffff,0,.62,.95,.22,.02,.78);
  for(const s of[-1,1]){p(L,G.cap,kc,s*.52,.44,-.02,.34,.55,.34,Math.PI/2);p(L,G.box,0xffffff,s*.69,.47,-.02,.02,.08,.6);p(L,G.rbox,trim,s*.52,.24,-.02,.3,.06,.9);}
  p(L,G.rbox,kc,0,.62,-.85,1.0,.34,.5);
  // seat + headrest
  p(L,G.rbox,0x1a1a22,0,.58,-.3,.66,.14,.58);p(L,G.rbox,0x1a1a22,0,.88,-.6,.62,.52,.12,-.12);p(L,G.rbox,kc,0,1.18,-.63,.4,.14,.14);
  // engine block, exhausts
  p(M,G.rbox,0x8a8a96,0,.72,-1.02,.6,.3,.4);for(const s of[-1,1]){p(M,G.cyl,chrome,s*.32,.62,-1.18,.07,.38,.07,Math.PI/2);p(M,G.cyl,0x3a3a40,s*.32,.62,-1.38,.085,.05,.085,Math.PI/2);}
  // spoiler on struts
  for(const s of[-1,1])p(L,G.box,trim,s*.42,.98,-1.15,.06,.42,.12);p(L,G.rbox,kc,0,1.2,-1.2,1.36,.07,.36);p(L,G.box,0xffffff,0,1.24,-1.2,1.37,.02,.1);for(const s of[-1,1])p(L,G.box,kc,s*.69,1.12,-1.2,.04,.26,.4);
  // axles
  p(M,G.cyl,0x55555e,0,.28,.85,.05,1.5,.05,0,0,Math.PI/2);p(M,G.cyl,0x55555e,0,.36,-.75,.06,1.6,.06,0,0,Math.PI/2);
  const shell=new THREE.Mesh(merge(L),paint);shell.castShadow=true;shell.receiveShadow=true;root.add(shell);const metal=new THREE.Mesh(merge(M),VC(.3,{m:.8}));metal.castShadow=true;root.add(metal);
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(.42,.21),new THREE.MeshStandardMaterial({map:plateTex(d),roughness:.5}));plate.position.set(0,.46,1.52);root.add(plate);
  const sw=new THREE.Group();sw.position.set(0,.86,.36);sw.rotation.x=-.9;sw.add(mesh(G.tor,mat(trim,{r:.4}),0,0,0,.17,.17,.17));sw.add(mesh(G.cyl,mat(trim),0,0,-.13,.03,.26,.03,Math.PI/2));sw.add(mesh(G.cyl,mat(kc,{r:.3}),0,0,.02,.05,.03,.05,Math.PI/2));root.add(sw);U.sw=sw;
  for(const[x,z,r]of[[-.72,.85,.3],[.72,.85,.3],[-.78,-.75,.38],[.78,-.75,.38]]){const w=wheel(r,r*.85,kc,Math.sign(x));w.position.set(x,r,z);root.add(w);U.wheels.push(w);}
  U.fl=flames(root,[[-.32,.62,-1.38],[.32,.62,-1.38]]);U.seat=[0,.55,-.3];}
 if(type==='hover'){const skirt=new THREE.Mesh(new THREE.TorusGeometry(1,.2,10,30),mat(0x3a4250,{r:.7}));skirt.rotation.x=Math.PI/2;skirt.scale.set(.98,1.42,1);skirt.position.y=.26;skirt.castShadow=true;root.add(skirt);
  const L=[];p(L,G.sph,kc,0,.5,0,1.0,.32,1.45);p(L,G.sph,0xffffff,0,.62,.9,.55,.16,.45);p(L,G.box,trim,0,.42,0,2.02,.1,.3);for(const s of[-1,1])p(L,G.box,kc,s*.5,1.2,-1.2,.06,.7,.4);p(L,G.box,0x1a1a22,0,.8,-.25,.7,.14,.6);p(L,G.tor,kc,0,1.2,-1.05,.6,.6,.45);
  const hull=new THREE.Mesh(merge(L),paint);hull.castShadow=true;root.add(hull);
  const cage=new THREE.Group();cage.position.set(0,1.2,-1.05);const fan=new THREE.Group();for(let k=0;k<4;k++)fan.add(mesh(G.box,mat(0xd8d8e0,{m:.5,r:.3}),0,0,0,.1,1.05,.03,0,0,k*Math.PI/4));cage.add(fan);cage.add(S(mat(chrome,{m:.8,r:.2}),0,0,.02,.1));root.add(cage);U.fan=fan;
  const sw=new THREE.Group();sw.position.set(0,.98,.35);sw.rotation.x=-.9;sw.add(mesh(G.tor,mat(trim),0,0,0,.16,.16,.16));root.add(sw);U.sw=sw;U.fl=flames(root,[[-.3,.8,-1.3],[.3,.8,-1.3]]);U.seat=[0,.7,-.3];}
 if(type==='plane'){const L=[];p(L,G.cap,kc,0,.75,0,.9,1.9,.9,Math.PI/2);p(L,G.cone,kc,0,.75,1.6,.42,.6,.42,Math.PI/2);const wc=hex(o.color2??0xffffff);p(L,G.box,wc,0,.62,.25,4.2,.1,.9);for(const s of[-1,1])p(L,G.box,kc,s*2.05,.7,.25,.12,.24,.92);
  p(L,G.box,wc,0,.95,-1.45,1.7,.08,.5);p(L,G.box,kc,0,1.3,-1.5,.08,.75,.55);p(L,G.box,0x1a1a22,0,1.05,-.2,.6,.12,.6);for(const s of[-1,1])p(L,G.box,trim,s*.6,.4,.6,.04,.4,.04);
  const body=new THREE.Mesh(merge(L),paint);body.castShadow=true;root.add(body);
  const prop=new THREE.Group();prop.position.set(0,.75,1.95);for(let k=0;k<3;k++)prop.add(mesh(G.box,mat(0x3a3a40,{r:.5}),0,0,0,.12,1.3,.04,0,0,k*Math.PI*2/3));prop.add(mesh(G.cone,mat(0xff4d00),0,0,.08,.13,.25,.13,Math.PI/2));root.add(prop);U.prop=prop;
  const disc=new THREE.Mesh(new THREE.CircleGeometry(.7,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));disc.position.set(0,.75,1.98);root.add(disc);
  for(const s of[-1,1]){const w=wheel(.18,.14,kc);w.position.set(s*.6,.18,.6);root.add(w);U.wheels.push(w);}
  const sw=new THREE.Group();sw.position.set(0,1.15,.35);sw.rotation.x=-.9;sw.add(mesh(G.tor,mat(trim),0,0,0,.14,.14,.14));root.add(sw);U.sw=sw;U.fl=flames(root,[[0,.75,-1.9]]);U.seat=[0,1.0,-.25];}
 // driver
 const crit=makeCritter(d);crit.position.set(...U.seat);root.add(crit);U.crit=crit;
 // bubble shield + frenzy aura
 const bub=new THREE.Mesh(G.sphL,new THREE.MeshStandardMaterial({color:0x9af0ff,emissive:0x3ab8ff,emissiveIntensity:.6,transparent:true,opacity:.28,roughness:.1,depthWrite:false}));bub.scale.setScalar(type==='plane'?2.6:1.9);bub.position.y=.8;bub.visible=false;root.add(bub);U.bubble=bub;
 const aura=new THREE.Mesh(G.sphL,new THREE.MeshBasicMaterial({color:0xffd03a,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false}));aura.scale.set(1.5,1.2,2);aura.position.y=.7;aura.visible=false;root.add(aura);U.aura=aura;
 g.traverse(m=>{if(m.isMesh&&m!==bub&&m!==aura&&!m.material.transparent)m.castShadow=true;});g.userData=U;return g;}

// translucent copy for time-trial ghosts
export function ghostify(g){const gm=new THREE.MeshStandardMaterial({color:0x4aa8ff,emissive:0x2a6aff,emissiveIntensity:.5,roughness:.3,transparent:true,opacity:.38,depthWrite:false});
 g.traverse(o=>{if(o.isMesh){o.material=gm;o.castShadow=false;}});return g;}

export function makeBossRig(b){const d={sp:b.sp,c:b.c,c2:b.c2,kc:0x3a2a1a,n:b.n};let g;
 if(b.veh==='plane'){g=new THREE.Group();const root=new THREE.Group();g.add(root);const cr=makeCritter(d);cr.scale.setScalar(2.6);cr.position.y=-.4;root.add(cr);g.userData={root,wheels:[],crit:cr,type:'boss',fl:[],bubble:new THREE.Object3D(),aura:new THREE.Object3D()};return g;}
 g=makeVehicle(b.veh,{...d,kc:b.veh==='hover'?0x5a6a8a:0x3a3a4a});g.scale.setScalar(1.55);return g;}

/* ---------- pickups ---------- */
export function podMesh(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xff4dc8,emissiveIntensity:.55,roughness:.15,metalness:.1,transparent:true,opacity:.82});
 const o=new THREE.Mesh(new THREE.OctahedronGeometry(1.05,0),m);o.castShadow=true;g.add(o);const q=new THREE.Mesh(new THREE.OctahedronGeometry(.45,0),new THREE.MeshBasicMaterial({color:0xfff2a0}));g.add(q);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.35,.06,6,32),new THREE.MeshBasicMaterial({color:0xffe9ff,transparent:true,opacity:.7}));ring.rotation.x=Math.PI/2;g.add(ring);g.userData={o,m,ring};return g;}
export function berryGeo(){return merge([[new THREE.SphereGeometry(.42,12,10),M4(0,0,0),0xff3a6a],[new THREE.SphereGeometry(.3,10,8),M4(.32,.12,.1),0xff5a8a],[new THREE.ConeGeometry(.12,.35,6),M4(.1,.45,0,0,0,.4),0x3ac84a],[new THREE.SphereGeometry(.12,6,5),M4(-.14,.16,.33),0xffd0e0]]);}
export function coinGeo(){return merge([[new THREE.CylinderGeometry(.85,.85,.16,24),M4(0,0,0,Math.PI/2),0xdfe6f0],[new THREE.CylinderGeometry(.6,.6,.2,6),M4(0,0,0,Math.PI/2),0xffffff]]);}
export function ringMesh(gold,r){const m=new THREE.MeshStandardMaterial({color:gold?0xffc83a:0xff4d8a,emissive:gold?0xb06a00:0xc01a4a,emissiveIntensity:.45,roughness:.3,metalness:.4});const t=new THREE.Mesh(new THREE.TorusGeometry(r,.38,10,40),m);
 const g=new THREE.Group();g.add(t);for(let k=0;k<8;k++){const b=new THREE.Mesh(G.sphL,new THREE.MeshBasicMaterial({color:0xffffff}));b.scale.setScalar(.32);b.position.set(Math.cos(k/8*Math.PI*2)*r,Math.sin(k/8*Math.PI*2)*r,0);g.add(b);}g.userData={m};return g;}
export function balloonMesh(col=0xff3a6a){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:col,roughness:.25,metalness:.05,emissive:col,emissiveIntensity:.15});const b=new THREE.Mesh(G.sph,m);b.scale.set(1,1.18,1);b.castShadow=true;g.add(b);
 g.add(mesh(G.cone,m,0,-1.2,0,.18,.25,.18,Math.PI));const s=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,2.2,4),mat(0xffffff));s.position.y=-2.4;g.add(s);return g;}
function eyes(g,y,z,sep,r=.085){const W=mat(0xffffff,{r:.2}),K=mat(0x111111,{r:.15});for(const s of[-1,1]){g.add(S(W,s*sep,y,z,r,r*1.1,r*.7));g.add(S(K,s*sep,y+.005,z+r*.55,r*.6,r*.7,r*.35));}}
export function missileMesh(){const g=new THREE.Group();g.add(mesh(G.cap,mat(0xff3a2a,{r:.3,m:.3}),0,0,0,.35,.7,.35,Math.PI/2));g.add(mesh(G.cone,mat(0xffe04a),0,0,.65,.2,.35,.2,Math.PI/2));for(let k=0;k<4;k++)g.add(mesh(G.box,mat(0x2a2a2a),Math.cos(k*Math.PI/2)*.25,Math.sin(k*Math.PI/2)*.25,-.4,.04,.3,.3,0,0,k*Math.PI/2));
 eyes(g,.12,.22,.12,.07);return g;}
export function gooMesh(){const g=new THREE.Group();g.add(S(mat(0x6aff3a,{r:.15,e:0x2a8a10,ei:.5}),0,.25,0,.9,.35,.9));for(let k=0;k<6;k++){const a=k/6*Math.PI*2;g.add(S(mat(0x6aff3a,{r:.15}),Math.cos(a)*.75,.1,Math.sin(a)*.75,.3,.15,.3));}eyes(g,.48,.4,.2,.1);return g;}
