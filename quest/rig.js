// WILD QUEST — procedural articulated character rigs (hero, Mossback grunts/archers, Rune Colossus, Ashen Warden) and a pose animator.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,G=()=>new THREE.Group();
const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:o.r??.75,metalness:o.m??0,emissive:o.e??0,emissiveIntensity:o.ei??1,flatShading:!!o.flat});
function mesh(geo,mat,parent,x=0,y=0,z=0,rx=0,ry=0,rz=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m;}
const cap=(r,l,s=8)=>new THREE.CapsuleGeometry(r,l,3,s);
// limb hanging down from its joint: mesh centred at -len/2
function limb(parent,r0,len,mat,r1){const g=r1?new THREE.CylinderGeometry(r1,r0,len,9):cap(r0,Math.max(.01,len-r0*2));const m=mesh(g,mat,parent,0,-len/2,0);return m;}

/* ---------------- weapons & gear ---------------- */
export function makeSword(kind='traveler'){const g=G();const blade=kind==='rune'?std(0xcfe9ff,{m:.9,r:.25,e:0x2aa8b8,ei:.6}):std(0xd8dde2,{m:.95,r:.28});const gold=std(0xb08a3a,{m:.9,r:.35}),grip=std(0x3a2414,{r:.9});
 mesh(new THREE.BoxGeometry(.05,.012,.86),blade,g,0,0,.56);mesh(new THREE.ConeGeometry(.026,.1,4).rotateX(Math.PI/2),blade,g,0,0,1.03,0,0,Math.PI/4).scale.set(1,.45,1);
 mesh(new THREE.BoxGeometry(.2,.04,.04),gold,g,0,0,.12);mesh(new THREE.CylinderGeometry(.022,.022,.2,6).rotateX(Math.PI/2),grip,g,0,0,.01);mesh(new THREE.SphereGeometry(.032,8,6),gold,g,0,0,-.1);
 if(kind==='rune'){mesh(new THREE.BoxGeometry(.012,.016,.7),std(0x000000,{e:0x40f0ff,ei:3}),g,0,0,.56);}
 g.userData.tip=new V(0,0,1.05);g.userData.base=new V(0,0,.18);g.userData.kind=kind;return g;}
export function makeShield(){const g=G();const wood=std(0x6a4524,{r:.85}),rim=std(0x8b8f96,{m:.85,r:.35}),paint=std(0xb8431c,{r:.7});
 mesh(new THREE.CylinderGeometry(.3,.3,.05,20).rotateX(Math.PI/2),wood,g);mesh(new THREE.TorusGeometry(.3,.025,6,24),rim,g);
 mesh(new THREE.CylinderGeometry(.13,.13,.055,6).rotateX(Math.PI/2),paint,g,0,0,.005);mesh(new THREE.SphereGeometry(.05,8,6),rim,g,0,0,.03);return g;}
export function makeBow(col=0x5a3a1c){const g=G();const wood=std(col,{r:.7});const pts=[];for(let i=0;i<=12;i++){const t=i/12-.5;pts.push(new V(0,t*1.1,-Math.cos(t*Math.PI)*.16+.16));}
 const curve=new THREE.CatmullRomCurve3(pts);mesh(new THREE.TubeGeometry(curve,16,.02,5),wood,g);const s=new THREE.BufferGeometry().setFromPoints([new V(0,.55,.0),new V(0,-.55,0)]);
 const str=new THREE.Line(s,new THREE.LineBasicMaterial({color:0xe8e0c8}));g.add(str);g.userData.str=str;mesh(new THREE.CylinderGeometry(.03,.03,.16,6),std(0x2a1a10),g,0,0,.02);return g;}
export function makeClub(){const g=G();const w=std(0x5b3a1e,{r:.9}),st=std(0x7d776c,{r:.8,flat:true});mesh(new THREE.CylinderGeometry(.09,.04,.9,7).rotateX(Math.PI/2),w,g,0,0,.42);
 for(let i=0;i<5;i++){const a=i*1.26;mesh(new THREE.ConeGeometry(.04,.12,4),st,g,Math.cos(a)*.08,Math.sin(a)*.08,.68+(i%2)*.12,Math.PI/2*Math.sin(a),0,-Math.cos(a)*Math.PI/2);}
 g.userData.tip=new V(0,0,.9);g.userData.base=new V(0,0,.3);return g;}
export function makeGreatsword(){const g=G();const b=std(0x2a2a30,{m:.9,r:.32}),edge=std(0x000000,{e:0xff5a14,ei:2.6}),gold=std(0x6a4a2a,{m:.8,r:.4});
 mesh(new THREE.BoxGeometry(.16,.04,2.3),b,g,0,0,1.45);mesh(new THREE.BoxGeometry(.03,.05,2.2),edge,g,.085,0,1.45);mesh(new THREE.BoxGeometry(.03,.05,2.2),edge,g,-.085,0,1.45);
 mesh(new THREE.BoxGeometry(.55,.1,.1),gold,g,0,0,.27);mesh(new THREE.CylinderGeometry(.04,.04,.45,6).rotateX(Math.PI/2),std(0x1a1210),g,0,0,.02);
 g.userData.tip=new V(0,0,2.6);g.userData.base=new V(0,0,.4);return g;}
// striped canopy paraglider
export function makeGlider(){const g=G();const c=document.createElement('canvas');c.width=256;c.height=32;const x=c.getContext('2d');const cols=['#ff6a1a','#f3e6c8','#1e6e68','#f3e6c8'];for(let i=0;i<16;i++){x.fillStyle=cols[i%4];x.fillRect(i*16,0,16,32);}x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,28,256,4);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const geo=new THREE.CylinderGeometry(1.5,1.5,.9,24,1,true,-1.1,2.2);geo.rotateZ(Math.PI/2);geo.rotateX(-Math.PI/2);
 const m=mesh(geo,new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:.8,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.18}),g,0,-.45,0);m.rotation.set(0,Math.PI/2,0);
 const lines=[];for(const sx of[-1,1])for(const[k,y]of[[.45,1.0],[1.15,.5]]){lines.push(new V(sx*.12,0,0),new V(sx*k,y,0));}g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines),new THREE.LineBasicMaterial({color:0x3a2a20})));
 mesh(new THREE.CylinderGeometry(.015,.015,.5,5).rotateZ(Math.PI/2),std(0x3a2a20),g,0,0,0);return g;}

/* ---------------- rig ---------------- */
const JOINTS=['hips','spine','chest','neck','head','shL','armL','foreL','handL','shR','armR','foreR','handR','legL','kneeL','footL','legR','kneeR','footR'];
export function makeRig(kind='hero'){
 const S={hero:{hip:.92,sp:.24,ch:.28,shW:.2,ua:.3,fa:.27,hipW:.1,th:.44,sh:.42,head:.125},
  grunt:{hip:.72,sp:.26,ch:.32,shW:.3,ua:.34,fa:.32,hipW:.15,th:.34,sh:.34,head:.2},
  archer:{hip:.86,sp:.24,ch:.28,shW:.22,ua:.33,fa:.3,hipW:.11,th:.42,sh:.4,head:.16},
  golem:{hip:1.6,sp:.6,ch:.9,shW:1.05,ua:.9,fa:.95,hipW:.4,th:.75,sh:.8,head:.32},
  boss:{hip:1.65,sp:.5,ch:.65,shW:.58,ua:.7,fa:.65,hipW:.25,th:.8,sh:.82,head:.26}}[kind];
 const r={kind,S,root:G(),j:{},rot:{},hy:S.hip,glow:[]};const j=r.j;for(const n of JOINTS){j[n]=G();r.rot[n]=new THREE.Euler();}
 r.root.add(j.hips);j.hips.position.y=S.hip;j.hips.add(j.spine);j.spine.add(j.chest);j.chest.position.y=S.sp;j.chest.add(j.neck);j.neck.position.y=S.ch;j.neck.add(j.head);j.head.position.y=.06;
 for(const[s,sx]of[['L',1],['R',-1]]){j.chest.add(j['sh'+s]);j['sh'+s].position.set(sx*S.shW,S.ch*.86,0);j['sh'+s].add(j['arm'+s]);j['arm'+s].add(j['fore'+s]);j['fore'+s].position.y=-S.ua;j['fore'+s].add(j['hand'+s]);j['hand'+s].position.y=-S.fa;
  j.hips.add(j['leg'+s]);j['leg'+s].position.set(sx*S.hipW,-.02,0);j['leg'+s].add(j['knee'+s]);j['knee'+s].position.y=-S.th;j['knee'+s].add(j['foot'+s]);j['foot'+s].position.y=-S.sh;}
 ({hero:dressHero,grunt:dressGrunt,archer:dressArcher,golem:dressGolem,boss:dressBoss})[kind](r);
 r.root.traverse(o=>{if(o.isMesh){o.castShadow=true;}});return r;}

function dressHero(r){const{j,S}=r;const skin=std(0xd9a27a,{r:.6}),tunic=std(0x1d6460,{r:.8}),tunic2=std(0x154844,{r:.85}),pants=std(0xb59a72,{r:.9}),boot=std(0x4a3020,{r:.8}),belt=std(0x5a3a22,{r:.7}),hair=std(0x2a1a12,{r:.7}),scarf=std(0xff5a12,{r:.8}),dark=std(0x111111,{r:.4});
 mesh(new THREE.CylinderGeometry(.15,.17,S.sp+.04,10),tunic,j.spine,0,S.sp/2,0).scale.set(1,1,.78);
 mesh(new THREE.CylinderGeometry(.2,.16,S.ch,10),tunic,j.chest,0,S.ch/2,0).scale.set(1,1,.72);
 mesh(new THREE.CylinderGeometry(.17,.24,.3,12,1,true),tunic2,j.hips,0,-.08,0).scale.set(1,1,.82);
 mesh(new THREE.CylinderGeometry(.175,.175,.06,12),belt,j.spine,0,.02,0).scale.set(1,1,.8);mesh(new THREE.BoxGeometry(.06,.06,.03),std(0xb08a3a,{m:.8,r:.3}),j.spine,0,.02,.14);
 mesh(new THREE.TorusGeometry(.1,.045,6,14).rotateX(Math.PI/2),scarf,j.neck,0,.0,0);r.scarf=G();j.neck.add(r.scarf);r.scarf.position.set(.04,0,-.1);const sc=mesh(new THREE.BoxGeometry(.09,.36,.02),scarf,r.scarf,0,-.18,0);sc.castShadow=true;
 mesh(cap(.055,.04),skin,j.neck,0,.03,0);
 const hd=j.head;mesh(new THREE.SphereGeometry(S.head,16,12),skin,hd,0,.1,0).scale.set(.92,1.05,1);
 mesh(new THREE.SphereGeometry(S.head*1.08,16,12,0,Math.PI*2,0,Math.PI*.55),hair,hd,0,.115,-.012).rotation.x=-.25;
 mesh(new THREE.ConeGeometry(.05,.16,6),hair,hd,0,.09,-.13,-2.4);for(const sx of[-1,1])mesh(new THREE.SphereGeometry(.016,6,5),dark,hd,sx*.045,.115,.11);
 mesh(new THREE.BoxGeometry(.12,.018,.02),hair,hd,0,.16,.11).rotation.z=.05;
 for(const[s,sx]of[['L',1],['R',-1]]){mesh(new THREE.SphereGeometry(.075,8,6),tunic,j['sh'+s]);limb(j['arm'+s],.058,S.ua,tunic);limb(j['fore'+s],.048,S.fa,skin);mesh(new THREE.CylinderGeometry(.056,.05,.12,8),belt,j['fore'+s],0,-S.fa*.62,0);mesh(new THREE.SphereGeometry(.048,8,6),skin,j['hand'+s],0,-.03,0);
  limb(j['leg'+s],.075,S.th,pants);limb(j['knee'+s],.062,S.sh,boot);mesh(new THREE.BoxGeometry(.1,.07,.22),boot,j['foot'+s],0,-.02,.05);}
 // gear
 r.sword=makeSword();r.shield=makeShield();r.bow=makeBow();r.glider=makeGlider();r.glider.visible=false;r.root.add(r.glider);r.glider.position.y=2.02;
 r.slots={handR:j.handR,handL:j.foreL,back:j.chest,bowHand:j.handL};r.gear={sword:'back',shield:'back',bow:'back'};placeGear(r);}
export function placeGear(r){const{j}=r;const g=r.gear;
 if(g.sword==='hand'){j.handR.add(r.sword);r.sword.position.set(0,-.05,0);r.sword.rotation.set(0,0,0);}else{j.chest.add(r.sword);r.sword.position.set(.06,.12,-.17);r.sword.rotation.set(-2.5,0,.6);}
 if(g.shield==='hand'){j.foreL.add(r.shield);r.shield.position.set(.07,-r.S.fa*.5,0);r.shield.rotation.set(0,Math.PI/2,0);}else{j.chest.add(r.shield);r.shield.position.set(.02,.02,-.19);r.shield.rotation.set(0,Math.PI,.2);r.shield.scale.setScalar(.85);}if(g.shield==='hand')r.shield.scale.setScalar(1);
 if(g.bow==='hand'){j.handL.add(r.bow);r.bow.position.set(0,-.04,.03);r.bow.rotation.set(-Math.PI/2,0,0);}else{j.chest.add(r.bow);r.bow.position.set(-.1,.08,-.25);r.bow.rotation.set(0,0,-.7);}}
function dressGrunt(r){const{j,S}=r;const skin=std(0x4f6a2c,{r:.75}),belly=std(0x8a9a52,{r:.8}),cloth=std(0x5a3a22,{r:.95}),mask=std(0xc9b48a,{r:.6}),paint=std(0xa8301c,{r:.7}),horn=std(0xe6dcc2,{r:.5}),eye=std(0x000000,{e:0xffc040,ei:2.5});
 mesh(new THREE.SphereGeometry(.3,12,10),skin,j.spine,0,.16,.02).scale.set(1,1,.9);mesh(new THREE.SphereGeometry(.22,10,8),belly,j.spine,0,.12,.1).scale.set(1,1,.8);
 mesh(new THREE.SphereGeometry(.34,12,10),skin,j.chest,0,.18,0).scale.set(1.15,.85,.9);mesh(new THREE.CylinderGeometry(.24,.3,.22,10,1,true),cloth,j.hips,0,-.06,0);
 const hd=j.head;mesh(new THREE.SphereGeometry(S.head,14,10),skin,hd,0,.12,0).scale.set(1.1,1,1.05);
 mesh(new THREE.CylinderGeometry(S.head*.95,S.head*.8,S.head*1.3,8,1,false),mask,hd,0,.12,.07).scale.set(1,1,.45);mesh(new THREE.BoxGeometry(.24,.03,.02),paint,hd,0,.17,.17);mesh(new THREE.BoxGeometry(.03,.14,.02),paint,hd,0,.08,.17);
 for(const sx of[-1,1]){mesh(new THREE.SphereGeometry(.028,6,5),eye,hd,sx*.07,.15,.165);mesh(new THREE.ConeGeometry(.04,.22,6),horn,hd,sx*.13,.3,-.02,0,0,-sx*.5);}
 for(const[s,sx]of[['L',1],['R',-1]]){limb(j['arm'+s],.09,S.ua,skin);limb(j['fore'+s],.08,S.fa,skin);mesh(new THREE.SphereGeometry(.085,8,6),skin,j['hand'+s],0,-.04,0);limb(j['leg'+s],.1,S.th,skin);limb(j['knee'+s],.085,S.sh,skin);mesh(new THREE.BoxGeometry(.15,.08,.24),skin,j['foot'+s],0,-.02,.06);}
 r.weapon=makeClub();j.handR.add(r.weapon);r.weapon.position.set(0,-.06,0);r.eyes=eye;}
function dressArcher(r){const{j,S}=r;const skin=std(0x7a3d26,{r:.75}),hood=std(0x2f3a2a,{r:.95}),cloth=std(0x3e2a1a,{r:.95}),mask=std(0xd6c49a,{r:.6}),eye=std(0x000000,{e:0xff7040,ei:2.5});
 mesh(new THREE.CylinderGeometry(.16,.19,S.sp+.04,10),cloth,j.spine,0,S.sp/2,0);mesh(new THREE.CylinderGeometry(.22,.17,S.ch,10),skin,j.chest,0,S.ch/2,0).scale.set(1,1,.75);
 mesh(new THREE.ConeGeometry(.26,.42,10,1,true),hood,j.chest,0,S.ch*.75,-.04);mesh(new THREE.CylinderGeometry(.2,.26,.28,10,1,true),cloth,j.hips,0,-.08,0);
 const hd=j.head;mesh(new THREE.SphereGeometry(S.head,14,10),skin,hd,0,.11,0);mesh(new THREE.ConeGeometry(S.head*1.35,.4,10),hood,hd,0,.24,-.04).rotation.x=-.2;
 mesh(new THREE.SphereGeometry(S.head*.9,10,8,0,Math.PI*2,0,Math.PI*.5),mask,hd,0,.1,.06).rotation.x=Math.PI/2;for(const sx of[-1,1])mesh(new THREE.SphereGeometry(.022,6,5),eye,hd,sx*.055,.13,.15);
 for(const[s,sx]of[['L',1],['R',-1]]){limb(j['arm'+s],.06,S.ua,skin);limb(j['fore'+s],.055,S.fa,skin);mesh(new THREE.SphereGeometry(.06,8,6),skin,j['hand'+s],0,-.03,0);limb(j['leg'+s],.075,S.th,cloth);limb(j['knee'+s],.06,S.sh,skin);mesh(new THREE.BoxGeometry(.11,.07,.2),skin,j['foot'+s],0,-.02,.05);}
 r.weapon=makeBow(0x3a2414);j.handL.add(r.weapon);r.weapon.position.set(0,-.04,.03);r.weapon.rotation.set(-Math.PI/2,0,0);r.eyes=eye;}
function dressGolem(r){const{j,S}=r;const st=std(0x6c6a62,{r:.92,flat:true}),moss=std(0x3c5a22,{r:.95,flat:true}),glow=std(0x000000,{e:0x30e8ff,ei:3});
 const rock=(p,w,h,d,y,x=0,z=0)=>{const m=mesh(new THREE.DodecahedronGeometry(1,0),st,p,x,y,z);m.scale.set(w,h,d);return m;};
 rock(j.spine,.75,.55,.6,.3);rock(j.chest,1.15,.75,.85,.55);mesh(new THREE.DodecahedronGeometry(1,0),moss,j.chest,0,1.05,-.1).scale.set(.9,.25,.6);
 mesh(new THREE.TorusGeometry(.35,.05,6,18),glow,j.chest,0,.6,.72);r.core=mesh(new THREE.SphereGeometry(.22,12,10),glow,j.chest,0,.6,.75);
 const hd=j.head;rock(hd,.42,.36,.4,.25);r.eye=mesh(new THREE.SphereGeometry(.11,12,10),glow,hd,0,.28,.33);
 for(const[s,sx]of[['L',1],['R',-1]]){rock(j['sh'+s],.5,.45,.5,0);rock(j['arm'+s],.38,.55,.38,-S.ua*.5);rock(j['fore'+s],.42,.6,.42,-S.fa*.5);rock(j['hand'+s],.52,.42,.5,-.2);
  rock(j['leg'+s],.4,.5,.4,-S.th*.5);rock(j['knee'+s],.38,.55,.4,-S.sh*.5);rock(j['foot'+s],.45,.22,.6,-.1,0,.12);mesh(new THREE.BoxGeometry(.06,.5,.06),glow,j['fore'+s],sx*.3,-S.fa*.5,.3);}
 r.glow.push(glow);}
function dressBoss(r){const{j,S}=r;const iron=std(0x24242a,{m:.85,r:.38}),iron2=std(0x3a3a44,{m:.8,r:.45}),ember=std(0x000000,{e:0xff4a10,ei:3.2}),cape=std(0x3a0d0a,{r:.95}),horn=std(0x1a1614,{r:.6});
 mesh(new THREE.CylinderGeometry(.42,.38,S.sp+.1,10),iron2,j.spine,0,S.sp/2,0).scale.set(1,1,.8);mesh(new THREE.CylinderGeometry(.62,.45,S.ch,10),iron,j.chest,0,S.ch/2,0).scale.set(1,1,.72);
 mesh(new THREE.BoxGeometry(.08,.5,.05),ember,j.chest,0,S.ch*.45,.38);mesh(new THREE.CylinderGeometry(.42,.6,.65,12,1,true),iron2,j.hips,0,-.25,0);
 r.cape=G();j.chest.add(r.cape);r.cape.position.set(0,S.ch*.9,-.36);mesh(new THREE.BoxGeometry(1.15,2.2,.04),cape,r.cape,0,-1.1,0);
 const hd=j.head;mesh(new THREE.CylinderGeometry(.24,.27,.42,10),iron,hd,0,.2,0);mesh(new THREE.BoxGeometry(.32,.05,.05),ember,hd,0,.24,.24);mesh(new THREE.ConeGeometry(.28,.3,10),iron,hd,0,.55,0);
 for(const sx of[-1,1]){const h=mesh(new THREE.ConeGeometry(.06,.6,7),horn,hd,sx*.3,.5,.02,0,0,-sx*1.0);h.rotation.x=-.3;}
 for(const[s,sx]of[['L',1],['R',-1]]){const p=mesh(new THREE.SphereGeometry(.32,12,8,0,Math.PI*2,0,Math.PI*.6),iron,j['sh'+s],0,.06,0);p.scale.set(1.1,.9,1.1);mesh(new THREE.ConeGeometry(.07,.3,6),horn,j['sh'+s],sx*.12,.3,0,0,0,-sx*.4);
  limb(j['arm'+s],.15,S.ua,iron2);limb(j['fore'+s],.14,S.fa,iron);mesh(new THREE.BoxGeometry(.2,.2,.2),iron2,j['hand'+s],0,-.08,0);limb(j['leg'+s],.18,S.th,iron2);limb(j['knee'+s],.16,S.sh,iron);mesh(new THREE.BoxGeometry(.26,.14,.4),iron,j['foot'+s],0,-.04,.08);}
 r.weapon=makeGreatsword();j.handR.add(r.weapon);r.weapon.position.set(0,-.08,0);r.glow.push(ember);}

/* ---------------- animator ---------------- */
const T={};for(const n of JOINTS)T[n]=[0,0,0];
function zero(){for(const n of JOINTS){const t=T[n];t[0]=t[1]=t[2]=0;}}
const lerpK=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
// keyframed arm moves: [p, chestY, chestX, armRx, armRz, foreRx, armLx, armLz, foreLx]
const MOVES={
 slash1:[[0,-.7,-.05,-2.3,-.7,-1.3,-.4,.3,-.6,0],[.42,.55,.12,-1.25,.65,-.2,-.2,.4,-.3,1.15],[1,.75,.1,-.7,.85,-.5,-.1,.3,-.4,0.9]],
 slash2:[[0,.8,-.05,-1.35,1.,-.7,-.3,.3,-.5,0.6],[.42,-.6,.12,-1.45,-.95,-.15,-.5,.2,-.4,1.2],[1,-.85,.08,-1.0,-1.25,-.5,-.3,.2,-.5,0.9]],
 chop:[[0,0,-.3,-3.0,-.15,-1.3,-2.6,.2,-1.0,-0.3],[.45,0,.42,-1.0,.05,-.1,-1.,.1,-.3,0.55],[1,0,.35,-.55,.05,-.3,-.5,.1,-.4,0.6]],
 spin:[[0,-.5,.05,-1.55,-.35,-.1,-1.2,.6,-.3,1.3],[.5,0,.08,-1.55,-.4,-.05,-1.2,.6,-.3,1.3],[1,.3,.05,-1.4,-.3,-.2,-1.,.5,-.4,1.2]],
 smash:[[0,0,-.35,-2.9,-.1,-.8,-.6,.4,-.4,0],[.5,0,.5,-.6,0,-.1,-.4,.3,-.3,0.35],[1,0,.45,-.45,0,-.2,-.3,.3,-.3,0.4]],
 sweep:[[0,-1.,.05,-1.4,-1.2,-.3,-1.2,.2,-.6,1.0],[.5,.8,.15,-1.45,.9,-.1,-1.,-.2,-.6,1.15],[1,1.1,.1,-1.2,1.1,-.3,-.8,-.2,-.6,1.0]],
 slam2:[[0,0,-.35,-2.9,-.3,-.6,-2.9,.3,-.6,0],[.5,0,.6,-.4,-.2,0,-.4,.2,0,0.4],[1,0,.55,-.3,-.2,-.1,-.3,.2,-.1,0.4]],
 thrust:[[0,-.4,-.1,-1.,-.5,-1.8,-.3,.3,-.6,1.4],[.4,.2,.25,-1.6,.1,0,-.3,.3,-.6,1.5],[1,.15,.2,-1.5,.05,-.1,-.3,.3,-.6,1.5]]};
function moveAt(name,p){const k=MOVES[name];let i=0;while(i<k.length-2&&p>k[i+1][0])i++;const a=k[i],b=k[i+1],f=sm(Math.min(1,Math.max(0,(p-a[0])/(b[0]-a[0]))));return a.map((v,n)=>lerpK(v,b[n],f));}
/* st: {mode, speed, run, t, atk:{name,p}, block, aim (0..1), pitch, hurt, roll:{p,dir}, look} */
export function animate(r,st,dt){zero();const t=st.t,S=r.S;let hipY=S.hip,direct=null;r.ph=r.ph||0;
 const mode=st.mode;const sp=st.speed||0;
 if(mode==='move'||mode==='idle'){const run=Math.min(1,Math.max(0,(sp-2.5)/5)),stride=lerpK(1.5,2.6,run)*S.hip/.92;r.ph+=sp*dt/stride*Math.PI;const s=Math.sin(r.ph),c=Math.cos(r.ph);
  const w=Math.min(1,sp/1.2);const A=lerpK(.45,.95,run)*w,K=lerpK(.75,1.7,run)*w,AA=lerpK(.45,.9,run)*w;
  T.legL[0]=-s*A;T.legR[0]=s*A;T.kneeL[0]=.08+K*Math.max(0,c);T.kneeR[0]=.08+K*Math.max(0,-c);T.footL[0]=-T.legL[0]*.3-.1*w;T.footR[0]=-T.legR[0]*.3-.1*w;
  T.armL[0]=s*AA;T.armR[0]=-s*AA;T.foreL[0]=-.25-run*.9*w;T.foreR[0]=-.25-run*.9*w;T.armL[2]=.12;T.armR[2]=-.12;
  T.spine[0]=lerpK(.04,.26,run)*w+(st.sprint?.12:0);T.hips[1]=s*.12*w;T.chest[1]=-s*.18*w;T.head[0]=-T.spine[0]*.6;
  hipY-=Math.abs(Math.sin(r.ph))*.05*w*(1+run)-(1-w)*0;
  const br=Math.sin(t*1.7)*(1-w);T.chest[0]+=br*.025;T.armL[2]+=.04*(1-w)+br*.02;T.armR[2]-=.04*(1-w)+br*.02;T.head[1]=Math.sin(t*.4)*.25*(1-w)*(st.idleLook??1);
  if(st.crouch){hipY-=.25;T.spine[0]+=.35;T.legL[0]-=.55;T.legR[0]-=.55;T.kneeL[0]+=.9;T.kneeR[0]+=.9;T.footL[0]-=.35;T.footR[0]-=.35;}}
 else if(mode==='air'){const up=st.vy>0?1:0;T.legL[0]=-.7;T.kneeL[0]=1.1;T.legR[0]=.15+up*-.3;T.kneeR[0]=.5;T.armL[0]=-.4;T.armR[0]=-.2;T.armL[2]=.8;T.armR[2]=-.8;T.foreL[0]=T.foreR[0]=-.4;T.spine[0]=.1;
  const f=Math.sin(t*9)*.08*(1-up);T.armL[2]+=f;T.armR[2]-=f;}
 else if(mode==='glide'){T.armL[0]=T.armR[0]=-2.85;T.armL[2]=.22;T.armR[2]=-.22;T.foreL[0]=T.foreR[0]=-.15;const sw=Math.sin(t*2.2);T.legL[0]=.1+sw*.15;T.legR[0]=.1-sw*.15;T.kneeL[0]=.5+sw*.2;T.kneeR[0]=.5-sw*.2;T.spine[0]=-.08;T.hips[2]=st.bank||0;}
 else if(mode==='climb'){r.ph+=(st.cmove||0)*dt*3.2;const s=Math.sin(r.ph);T.armL[0]=-2.55+s*.45;T.armR[0]=-2.55-s*.45;T.armL[2]=.35;T.armR[2]=-.35;T.foreL[0]=-.55-Math.max(0,-s)*.6;T.foreR[0]=-.55-Math.max(0,s)*.6;
  T.legL[0]=-.75-s*.45;T.legR[0]=-.75+s*.45;T.kneeL[0]=1.3+s*.3;T.kneeR[0]=1.3-s*.3;T.legL[2]=.25;T.legR[2]=-.25;T.spine[0]=-.12;T.head[0]=-.35;hipY-=.15;}
 else if(mode==='swim'){r.ph+=(.8+sp*.7)*dt*2.4;const s=Math.sin(r.ph),u=s*.5+.5;T.hips[0]=1.25*Math.min(1,.3+sp*.4);T.head[0]=-1.0*Math.min(1,.3+sp*.4);T.armL[0]=-2.5+u*1.1;T.armR[0]=-2.5+u*1.1;T.armL[2]=.2+u*1.1;T.armR[2]=-.2-u*1.1;T.foreL[0]=T.foreR[0]=-.4-u*.5;
  T.legL[0]=Math.sin(r.ph*2)*.3;T.legR[0]=-Math.sin(r.ph*2)*.3;T.kneeL[0]=T.kneeR[0]=.35;hipY=S.hip*.45;}
 else if(mode==='sit'){hipY=S.hip*.5;T.legL[0]=T.legR[0]=-1.45;T.kneeL[0]=T.kneeR[0]=1.5;T.legL[2]=.3;T.legR[2]=-.3;T.spine[0]=.25;T.armL[0]=T.armR[0]=-.6;T.foreL[0]=T.foreR[0]=-.8;T.chest[0]=Math.sin(t*1.3)*.03;}
 else if(mode==='sleep'){hipY=S.hip*.35;direct={z:1.45};T.legL[0]=-.9;T.kneeL[0]=1.3;T.legR[0]=-.5;T.kneeR[0]=.9;T.armL[0]=-.6;T.armR[0]=-1.2;T.foreR[0]=-1.2;T.chest[0]=Math.sin(t*1.1)*.05+.2;}
 else if(mode==='dead'){const p=Math.min(1,st.dp||1);hipY=lerpK(S.hip,S.hip*.3,p);direct={x:-1.45*sm(p)};T.armL[2]=1.2;T.armR[2]=-1.2;T.legL[2]=.2;T.legR[2]=-.2;T.kneeL[0]=.3;}
 else if(mode==='roll'){const p=st.roll.p;const d=st.roll.dir;if(d==='back'){direct={x:-sm(p)*Math.PI*2};hipY+=Math.sin(p*Math.PI)*.7;}else if(d==='left'||d==='right'){direct={z:(d==='left'?-1:1)*Math.sin(p*Math.PI)*.35};hipY+=Math.sin(p*Math.PI)*.4;}else{direct={x:sm(p)*Math.PI*2};hipY=lerpK(S.hip,S.hip*.55,Math.sin(p*Math.PI));}
  T.legL[0]=T.legR[0]=-1.3*Math.sin(p*Math.PI);T.kneeL[0]=T.kneeR[0]=2*Math.sin(p*Math.PI);T.armL[0]=T.armR[0]=-1.*Math.sin(p*Math.PI);T.foreL[0]=T.foreR[0]=-1.5*Math.sin(p*Math.PI);T.spine[0]=.6*Math.sin(p*Math.PI);}
 // overlays
 if(st.atk){const m=moveAt(st.atk.name,st.atk.p);T.chest[1]=m[1];T.chest[0]+=m[2];T.armR[0]=m[3];T.armR[2]=m[4];T.foreR[0]=m[5];if(!st.block&&!st.oneHand){T.armL[0]=m[6];T.armL[2]=m[7];T.foreL[0]=m[8];}T.spine[1]=m[1]*.3;T.handR[0]=m[9];
  if(st.atk.name==='spin'||st.atk.name==='sweep'){T.legL[0]=-.3;T.legR[0]=.35;T.kneeL[0]=.5;T.kneeR[0]=.3;}}
 if(st.block){T.armL[0]=-1.35;T.armL[2]=-.35;T.foreL[0]=-1.35;T.armL[1]=.4;T.chest[1]+=.15;if(mode!=='move'||sp<.5){T.legL[0]=-.35;T.kneeL[0]=.5;T.legR[0]=.3;T.kneeR[0]=.3;hipY-=.06;}}
 if(st.aim>0){const a=st.aim,p=st.pitch||0;T.chest[1]=-.25;T.armL[0]=-1.57-p;T.armL[2]=-.05;T.foreL[0]=0;T.armL[1]=.3;T.armR[0]=-1.5-p;T.armR[2]=lerpK(.1,.45,a);T.foreR[0]=lerpK(-.6,-2.1,a);T.armR[1]=-.4;T.head[0]=-p*.6;T.head[1]=.2;}
 if(st.hurt>0){T.spine[0]-=.35*st.hurt;T.head[0]-=.3*st.hurt;}
 if(st.look!==undefined&&!st.aim)T.head[0]+=st.look*.4;
 // apply with smoothing
 const k=1-Math.exp(-dt*(st.snap?60:18));for(const n of JOINTS){const e=r.j[n].rotation,t=T[n];e.x+=(t[0]-e.x)*k;e.y+=(t[1]-e.y)*k;e.z+=(t[2]-e.z)*k;if(e.x!==e.x||e.y!==e.y||e.z!==e.z)e.set(0,0,0);}
 if(direct){if(direct.x!==undefined)r.j.hips.rotation.x=direct.x;if(direct.z!==undefined)r.j.hips.rotation.z=direct.z;}
 r.hy+=(hipY-r.hy)*Math.min(1,dt*(direct?40:14));r.j.hips.position.y=r.hy;
 // secondary motion: scarf/cape
 if(r.scarf){r.sv=r.sv||0;const target=-.5-Math.min(1.3,sp*.13)-(mode==='glide'?1.:0)-(mode==='air'&&st.vy<0?.8:0);r.scarf.rotation.x+=(target+Math.sin(t*9)*.08*(.3+sp*.1)-r.scarf.rotation.x)*Math.min(1,dt*8);r.scarf.rotation.z=Math.sin(t*6.3)*.15;}
 if(r.cape){r.cape.rotation.x+=(-.12-Math.min(.6,sp*.08)+Math.sin(t*2)*.05-r.cape.rotation.x)*Math.min(1,dt*5);}}
// world positions of a gear tip/base (for hit trails)
export function gearPoints(obj,a,b){obj.updateWorldMatrix(true,false);a.copy(obj.userData.base).applyMatrix4(obj.matrixWorld);b.copy(obj.userData.tip).applyMatrix4(obj.matrixWorld);}
