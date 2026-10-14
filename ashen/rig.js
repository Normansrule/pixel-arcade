// ASHEN VIGIL — procedural articulated rigs (the Unkindled hero, hollow knights, archers, hounds and the four great foes),
// weapons, and the pose animators (humanoid keyframed moves + quadruped gait). Adapted from WILD QUEST's rig.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,G=()=>new THREE.Group();
export const std=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:o.r??.75,metalness:o.m??0,emissive:o.e??0,emissiveIntensity:o.ei??1,flatShading:!!o.flat,map:o.map??null,bumpMap:o.bump??null,bumpScale:o.bs??1,side:o.side??THREE.FrontSide});
function mesh(geo,mat,parent,x=0,y=0,z=0,rx=0,ry=0,rz=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m;}
const cap=(r,l,s=8)=>new THREE.CapsuleGeometry(r,Math.max(.01,l),3,s);
const lathe=(pts,seg=14)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg);

/* procedural textures (canvas) */
function ctx(w,h,f,rep=1){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const rn=(()=>{let a=777;return()=>{a=(a*16807)%2147483647;return a/2147483647;};})();
let TX=null;export function tex(){if(TX)return TX;
 const weave=ctx(64,64,(x,w,h)=>{x.fillStyle='#d0d0d0';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=2){x.fillStyle=`rgba(255,255,255,${.1+rn()*.1})`;x.fillRect(i,0,1,h);x.fillStyle=`rgba(0,0,0,${.1+rn()*.1})`;x.fillRect(0,i,w,1);}
  for(let k=0;k<220;k++){x.fillStyle=`rgba(0,0,0,${rn()*.18})`;x.fillRect(rn()*w,rn()*h,1+rn()*4,1+rn()*2);}},4);
 const leather=ctx(128,128,(x,w,h)=>{x.fillStyle='#bcbcbc';x.fillRect(0,0,w,h);for(let k=0;k<1400;k++){const v=rn()*255|0;x.fillStyle=`rgba(${v},${v},${v},.1)`;x.beginPath();x.arc(rn()*w,rn()*h,.6+rn()*1.6,0,6.283);x.fill();}
  x.strokeStyle='rgba(40,30,20,.35)';for(let k=0;k<16;k++){x.lineWidth=.6+rn();x.beginPath();let px=rn()*w,py=rn()*h;x.moveTo(px,py);for(let i=0;i<4;i++){px+=(rn()-.5)*30;py+=(rn()-.5)*30;x.lineTo(px,py);}x.stroke();}},2);
 // battered steel: brushed streaks, dents, rust blooms
 const metal=ctx(256,256,(x,w,h)=>{x.fillStyle='#b8b8b8';x.fillRect(0,0,w,h);for(let k=0;k<900;k++){const v=150+rn()*105|0;x.strokeStyle=`rgba(${v},${v},${v},.14)`;x.lineWidth=.5+rn();const y=rn()*h;x.beginPath();x.moveTo(rn()*w,y);x.lineTo(rn()*w,y+(rn()-.5)*4);x.stroke();}
  for(let k=0;k<40;k++){const g=x.createRadialGradient(0,0,0,0,0,6+rn()*22);const px=rn()*w,py=rn()*h;g.addColorStop(0,`rgba(${90+rn()*40|0},${50+rn()*20|0},20,.45)`);g.addColorStop(1,'rgba(90,50,20,0)');x.save();x.translate(px,py);x.fillStyle=g;x.fillRect(-30,-30,60,60);x.restore();}
  for(let k=0;k<120;k++){x.strokeStyle=`rgba(0,0,0,${.15+rn()*.25})`;x.lineWidth=.6;x.beginPath();const px=rn()*w,py=rn()*h;x.moveTo(px,py);x.lineTo(px+(rn()-.5)*14,py+(rn()-.5)*14);x.stroke();}},1);
 const stone=ctx(128,128,(x,w,h)=>{x.fillStyle='#a8a49c';x.fillRect(0,0,w,h);for(let k=0;k<2400;k++){const v=120+rn()*110|0;x.fillStyle=`rgba(${v},${v-4},${v-10},.16)`;x.fillRect(rn()*w,rn()*h,1+rn()*3,1+rn()*3);}
  x.strokeStyle='rgba(30,28,26,.4)';for(let k=0;k<10;k++){x.lineWidth=.5+rn();x.beginPath();let px=rn()*w,py=rn()*h;x.moveTo(px,py);for(let i=0;i<5;i++){px+=(rn()-.5)*24;py+=(rn()-.5)*24;x.lineTo(px,py);}x.stroke();}},1);
 return TX={weave,leather,metal,stone};}
/* merge static dressing per (joint, material): far fewer draw calls than one mesh per piece */
function dresser(){const B=new Map();const add=(parent,mat,geo,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>{const m=new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
  const k=parent.uuid+mat.uuid;if(!B.has(k))B.set(k,{parent,mat,list:[]});B.get(k).list.push(geo.applyMatrix4(m));};
 add.flush=()=>{for(const{parent,mat,list}of B.values()){const m=new THREE.Mesh(mergeGeos(list),mat);m.castShadow=true;parent.add(m);}B.clear();};return add;}
export function mergeGeos(list){const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;gs.forEach(g=>n+=g.attributes.position.count);const P=new Float32Array(n*3),N=new Float32Array(n*3),UV=new Float32Array(n*2);let o=0;
 for(const g of gs){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)UV.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('uv',new THREE.BufferAttribute(UV,2));return g;}

/* ---------------- shared materials ---------------- */
let M=null;function mats(){if(M)return M;const T=tex();
 const steel=(c,o={})=>new THREE.MeshStandardMaterial({color:c,metalness:o.m??.85,roughness:o.r??.42,map:T.metal,bumpMap:T.metal,bumpScale:o.b??1.2});
 const cloth=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:o.r??.9,map:o.map??T.weave,bumpMap:o.map??T.weave,bumpScale:.6,side:o.side??THREE.FrontSide});
 return M={steel,cloth,
  blade:new THREE.MeshStandardMaterial({color:0xd8dce2,metalness:.95,roughness:.22,map:T.metal}),bladeDk:new THREE.MeshStandardMaterial({color:0x6a6c72,metalness:.9,roughness:.35,map:T.metal}),
  gold:std(0x9a7638,{m:.9,r:.35}),brass:std(0x7a5a2a,{m:.85,r:.45}),grip:new THREE.MeshStandardMaterial({color:0x3a2416,roughness:.85,map:T.leather,bumpMap:T.leather,bumpScale:2}),
  ember:std(0x000000,{e:0xff5a14,ei:3.2}),emberSoft:std(0x110400,{e:0xff7a2a,ei:1.6}),eye:std(0x000000,{e:0xffa040,ei:4}),dark:std(0x0c0c0e,{r:.6}),bone:std(0xcfc4a8,{r:.65}),
  wood:std(0x4a3420,{r:.8}),stone:new THREE.MeshStandardMaterial({color:0x8e8a82,roughness:.92,map:T.stone,bumpMap:T.stone,bumpScale:2})};}

/* ---------------- weapons ---------------- */
function bladeGeo(len,w,tip=.14){const sh=new THREE.Shape();sh.moveTo(-w,0);sh.lineTo(-w*.92,len-tip);sh.lineTo(0,len);sh.lineTo(w*.92,len-tip);sh.lineTo(w,0);sh.closePath();
 const g=new THREE.ExtrudeGeometry(sh,{depth:.004,bevelEnabled:true,bevelThickness:.008,bevelSize:Math.min(.014,w*.4),bevelSegments:1,curveSegments:2});g.translate(0,0,-.002);g.rotateX(Math.PI/2);return g;}// blade along +Z
export function makeLongsword(){const g=G(),add=dresser(),m=mats();add(g,m.blade,bladeGeo(.9,.032),0,0,.12);add(g,m.bladeDk,new THREE.BoxGeometry(.012,.014,.66),0,0,.44);
 add(g,m.gold,new THREE.BoxGeometry(.26,.035,.04),0,0,.11);for(const s of[-1,1])add(g,m.gold,new THREE.SphereGeometry(.024,8,6),s*.13,0,.11);
 add(g,m.grip,new THREE.CylinderGeometry(.019,.022,.2,8).rotateX(Math.PI/2),0,0,.0);add(g,m.gold,new THREE.SphereGeometry(.032,10,8),0,0,-.11);add.flush();g.userData.tip=new V(0,0,1.02);g.userData.base=new V(0,0,.2);return g;}
export function makeGreatsword(){const g=G(),add=dresser(),m=mats();add(g,m.blade,bladeGeo(1.45,.062,.22),0,0,.2);add(g,m.bladeDk,new THREE.BoxGeometry(.02,.022,1.1),0,0,.72);
 add(g,m.steel(0x3a3a40),new THREE.BoxGeometry(.46,.06,.07),0,0,.18);for(const s of[-1,1])add(g,m.steel(0x3a3a40),new THREE.ConeGeometry(.035,.12,6).rotateZ(-s*Math.PI/2),s*.27,0,.18);
 add(g,m.grip,new THREE.CylinderGeometry(.022,.026,.42,8).rotateX(Math.PI/2),0,0,-.04);add(g,m.steel(0x3a3a40),new THREE.SphereGeometry(.045,10,8),0,0,-.27);add.flush();g.userData.tip=new V(0,0,1.65);g.userData.base=new V(0,0,.3);return g;}
export function makeDagger(){const g=G(),add=dresser(),m=mats();add(g,m.blade,bladeGeo(.4,.028,.1),0,0,.08);add(g,m.brass,new THREE.BoxGeometry(.12,.03,.03),0,0,.075);add(g,m.grip,new THREE.CylinderGeometry(.017,.019,.13,7).rotateX(Math.PI/2),0,0,0);
 add(g,m.brass,new THREE.SphereGeometry(.024,8,6),0,0,-.07);add.flush();g.userData.tip=new V(0,0,.5);g.userData.base=new V(0,0,.1);return g;}
export function makeKiteShield(col=0x6a1a14){const g=G(),add=dresser(),m=mats();const sh=new THREE.Shape();sh.moveTo(-.27,.3);sh.lineTo(.27,.3);sh.lineTo(.27,0);sh.quadraticCurveTo(.25,-.32,0,-.5);sh.quadraticCurveTo(-.25,-.32,-.27,0);sh.closePath();
 const geo=new THREE.ExtrudeGeometry(sh,{depth:.03,bevelEnabled:true,bevelThickness:.015,bevelSize:.02,bevelSegments:2,curveSegments:8});
 const face=new THREE.MeshStandardMaterial({color:col,roughness:.6,metalness:.35,map:tex().metal});add(g,face,geo,0,0,0);
 // iron rim + boss + an ember-sun emblem
 const rim=m.steel(0x4a4a50);const pts=sh.getPoints(16);for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];const L=Math.hypot(b.x-a.x,b.y-a.y);if(L<1e-3)continue;add(g,rim,new THREE.BoxGeometry(L+.02,.035,.06),(a.x+b.x)/2,(a.y+b.y)/2,.02,0,0,Math.atan2(b.y-a.y,b.x-a.x));}
 add(g,m.gold,new THREE.CylinderGeometry(.07,.08,.04,14).rotateX(Math.PI/2),0,.02,.06);for(let i=0;i<8;i++){const a=i/8*6.283;add(g,m.gold,new THREE.BoxGeometry(.025,.13,.012),Math.sin(a)*.14,.02+Math.cos(a)*.14,.05,0,0,-a);}
 add.flush();return g;}
export function makeTowerShield(){const g=G(),add=dresser(),m=mats();add(g,m.steel(0x55524c,{r:.6}),new THREE.BoxGeometry(.62,1.15,.06));const rim=m.steel(0x2e2c2a);
 for(const y of[-.56,.56])add(g,rim,new THREE.BoxGeometry(.66,.05,.09),0,y,0);for(const x of[-.31,.31])add(g,rim,new THREE.BoxGeometry(.05,1.15,.09),x,0,0);add(g,rim,new THREE.BoxGeometry(.05,1.1,.08),0,0,.02);add(g,rim,new THREE.BoxGeometry(.6,.05,.08),0,.1,.02);
 for(let i=0;i<12;i++)add(g,m.brass,new THREE.SphereGeometry(.018,6,4),(i%2?.27:-.27),-.5+(i>>1)*.2,.045);add.flush();return g;}
export function makeSpear(){const g=G(),m=mats();mesh(new THREE.CylinderGeometry(.022,.022,2.1,6).rotateX(Math.PI/2),m.wood,g,0,0,.55);mesh(bladeGeo(.34,.04,.18),m.bladeDk,g,0,0,1.58);
 g.userData.tip=new V(0,0,1.92);g.userData.base=new V(0,0,1.2);return g;}
export function makeBow(){const g=G(),m=mats();const pts=[];for(let i=0;i<=12;i++){const t=i/12-.5;pts.push(new V(0,t*1.15,-Math.cos(t*Math.PI)*.18+.18));}
 mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),16,.02,5),std(0x2a1c12,{r:.7}),g);const s=new THREE.BufferGeometry().setFromPoints([new V(0,.57,0),new V(0,-.57,0)]);g.add(new THREE.Line(s,new THREE.LineBasicMaterial({color:0xc8c0a8})));
 mesh(new THREE.CylinderGeometry(.03,.03,.16,6),m.grip,g,0,0,.02);return g;}
export function makeBellHammer(){const g=G(),add=dresser(),m=mats();add(g,m.wood,new THREE.CylinderGeometry(.045,.05,2.3,8).rotateX(Math.PI/2),0,0,.75);for(let i=0;i<5;i++)add(g,m.steel(0x3a3632),new THREE.TorusGeometry(.055,.014,5,10),0,0,-.2+i*.45);
 const bell=lathe([[0,.0],[.2,0],[.24,.05],[.26,.25],[.32,.48],[.42,.66],[.46,.7],[0,.7]],18);bell.rotateX(Math.PI/2);bell.rotateY(Math.PI/2);add(g,m.steel(0x6a5430,{m:.9,r:.38}),bell,-.35,0,1.95);
 add(g,m.steel(0x3a3632),new THREE.BoxGeometry(.75,.16,.16),0,0,1.95);add(g,m.steel(0x3a3632),new THREE.ConeGeometry(.1,.35,6).rotateZ(-Math.PI/2),.5,0,1.95);add.flush();
 g.userData.tip=new V(-.4,0,2.05);g.userData.base=new V(0,0,1.6);return g;}
export function makeKingBlade(){const g=G(),add=dresser(),m=mats();const dark=new THREE.MeshStandardMaterial({color:0x26221e,metalness:.85,roughness:.38,map:tex().metal,bumpMap:tex().metal,bumpScale:1.5});
 add(g,dark,bladeGeo(2.4,.13,.4),0,0,.3);const edge=std(0x000000,{e:0xff4a10,ei:2.6});g.userData.edgeMat=edge;
 for(const s of[-1,1])add(g,edge,new THREE.BoxGeometry(.025,.05,2.0),s*.105,0,1.2);add(g,edge,new THREE.BoxGeometry(.03,.06,1.7),0,0,1.1);
 add(g,m.gold,new THREE.BoxGeometry(.8,.12,.14),0,0,.27);for(const s of[-1,1])add(g,m.gold,new THREE.ConeGeometry(.07,.3,5).rotateZ(-s*1.9),s*.48,.06,.27);
 add(g,m.grip,new THREE.CylinderGeometry(.04,.045,.6,8).rotateX(Math.PI/2),0,0,-.05);add(g,m.gold,new THREE.OctahedronGeometry(.09),0,0,-.4);add.flush();g.userData.tip=new V(0,0,2.75);g.userData.base=new V(0,0,.5);return g;}
export function makeStaff(){const g=G(),add=dresser(),m=mats();add(g,m.steel(0x4a3c22,{m:.8}),new THREE.CylinderGeometry(.025,.03,2.2,8).rotateX(Math.PI/2),0,0,.6);
 add(g,m.gold,new THREE.TorusGeometry(.18,.02,6,20),0,0,1.82,0,Math.PI/2,0);add(g,m.ember,new THREE.OctahedronGeometry(.08),0,0,1.82);add.flush();g.userData.tip=new V(0,0,1.9);g.userData.base=new V(0,0,1.3);return g;}

/* ---------------- humanoid rig ---------------- */
const JOINTS=['hips','spine','chest','neck','head','shL','armL','foreL','handL','shR','armR','foreR','handR','legL','kneeL','footL','legR','kneeR','footR'];
const SIZES={hero:{hip:.94,sp:.25,ch:.3,shW:.21,ua:.3,fa:.27,hipW:.1,th:.45,sh:.43,head:.12},
 knight:{hip:.98,sp:.26,ch:.32,shW:.24,ua:.32,fa:.29,hipW:.11,th:.47,sh:.45,head:.13},
 archer:{hip:.9,sp:.25,ch:.28,shW:.2,ua:.31,fa:.29,hipW:.1,th:.44,sh:.42,head:.12}};
export function makeRig(kind='hero',o={}){
 const base=kind==='bell'||kind==='king'?'knight':kind==='cantor'?'archer':kind;const S=SIZES[base];
 const r={kind,S,root:G(),body:G(),j:{},hy:S.hip,glow:[],scale:{bell:1.6,king:2.15,cantor:1.5}[kind]||1,cloth:null,capeAt:null};const j=r.j;for(const n of JOINTS)j[n]=G();
 r.root.add(r.body);r.body.scale.setScalar(r.scale);r.body.add(j.hips);j.hips.position.y=S.hip;j.hips.add(j.spine);j.spine.add(j.chest);j.chest.position.y=S.sp;j.chest.add(j.neck);j.neck.position.y=S.ch;j.neck.add(j.head);j.head.position.y=.06;
 for(const[s,sx]of[['L',1],['R',-1]]){j.chest.add(j['sh'+s]);j['sh'+s].position.set(sx*S.shW,S.ch*.86,0);j['sh'+s].add(j['arm'+s]);j['arm'+s].add(j['fore'+s]);j['fore'+s].position.y=-S.ua;j['fore'+s].add(j['hand'+s]);j['hand'+s].position.y=-S.fa;
  j.hips.add(j['leg'+s]);j['leg'+s].position.set(sx*S.hipW,-.02,0);j['leg'+s].add(j['knee'+s]);j['knee'+s].position.y=-S.th;j['knee'+s].add(j['foot'+s]);j['foot'+s].position.y=-S.sh;}
 ({hero:dressHero,knight:dressKnight,archer:dressArcher,bell:dressBell,king:dressKing,cantor:dressCantor})[kind](r,o);
 r.root.traverse(m=>{if(m.isMesh)m.castShadow=true;});return r;}

function armorLimbs(r,add,plate,under,o={}){const{j,S}=r;
 for(const[s,sx]of[['L',1],['R',-1]]){add(j['sh'+s],plate,new THREE.SphereGeometry(.12*(o.pad||1),12,8,0,Math.PI*2,0,Math.PI*.55),sx*.02,.02,0,0,0,sx*.35,1.05,.85,1);
  add(j['sh'+s],plate,new THREE.SphereGeometry(.105*(o.pad||1),12,6,0,Math.PI*2,0,Math.PI*.4),sx*.04,-.04,0,0,0,sx*.55,1,.8,1);
  add(j['arm'+s],under,cap(.06,S.ua-.12,8),0,-S.ua/2,0);add(j['arm'+s],plate,new THREE.CylinderGeometry(.07,.065,S.ua*.55,10),0,-S.ua*.55,0);
  add(j['fore'+s],plate,new THREE.SphereGeometry(.07,10,8),0,0,0);add(j['fore'+s],plate,new THREE.CylinderGeometry(.068,.056,S.fa*.85,10),0,-S.fa*.45,0);add(j['fore'+s],plate,new THREE.CylinderGeometry(.075,.068,.07,10),0,-S.fa*.82,0);
  add(j['hand'+s],plate,new THREE.BoxGeometry(.085,.1,.07),0,-.04,.01);
  add(j['leg'+s],under,cap(.08,S.th-.16,8),0,-S.th/2,0);add(j['leg'+s],plate,new THREE.CylinderGeometry(.09,.075,S.th*.7,10),0,-S.th*.45,.01,0,0,0,1,1,1.05);
  add(j['knee'+s],plate,new THREE.SphereGeometry(.07,10,8),0,0,.04);add(j['knee'+s],plate,new THREE.ConeGeometry(.05,.1,6),0,.02,.09,1.4,0,0);
  add(j['knee'+s],plate,new THREE.CylinderGeometry(.075,.062,S.sh,10),0,-S.sh/2,0);add(j['foot'+s],plate,new THREE.BoxGeometry(.11,.08,.24),0,-.02,.05);add(j['foot'+s],plate,new THREE.SphereGeometry(.06,10,6,0,Math.PI*2,0,Math.PI/2),0,-.03,.15,0,0,0,1,.8,1.3);}}
function dressHero(r){const{j,S}=r;const m=mats(),add=dresser();const plate=m.steel(0x6a6c72),plate2=m.steel(0x4a4c52,{r:.5}),mail=new THREE.MeshStandardMaterial({color:0x5a5c60,metalness:.8,roughness:.55,map:tex().weave,bumpMap:tex().weave,bumpScale:2});
 const tabard=m.cloth(0x5a1610,{side:THREE.DoubleSide}),under=m.cloth(0x2a2420),belt=new THREE.MeshStandardMaterial({color:0x2a1c12,roughness:.7,map:tex().leather,bumpMap:tex().leather,bumpScale:2});
 add(j.spine,mail,lathe([[0,-.04],[.16,-.04],[.155,.1],[.165,S.sp+.03],[0,S.sp+.03]],16),0,0,0,0,0,0,1,1,.78);
 add(j.chest,plate,lathe([[0,-.01],[.17,-.01],[.2,.09],[.215,.18],[.2,.25],[.14,.3],[.07,.32],[0,.32]],16),0,0,0,0,0,0,1,1,.74);
 add(j.chest,plate2,new THREE.BoxGeometry(.03,.26,.05),0,.15,.15);
 add(j.hips,mail,lathe([[.17,.04],[.19,-.06],[.21,-.18],[.23,-.28]],16),0,0,0,0,0,0,1,1,.8);
 add(j.hips,tabard,new THREE.PlaneGeometry(.26,.5,1,3),0,-.22,.175,-.08);add(j.hips,tabard,new THREE.PlaneGeometry(.26,.5,1,3),0,-.22,-.17,.08);
 add(j.chest,tabard,new THREE.PlaneGeometry(.24,.3),0,.1,.16,-.12);add(j.chest,m.gold,new THREE.TorusGeometry(.045,.008,4,14),0,.14,.168);
 add(j.spine,belt,new THREE.CylinderGeometry(.175,.175,.06,16),0,.0,0,0,0,0,1,1,.8);add(j.spine,m.brass,new THREE.BoxGeometry(.05,.05,.02),0,0,.142);
 add(j.chest,plate2,new THREE.TorusGeometry(.11,.04,6,16).rotateX(Math.PI/2),0,.3,0,0,0,0,1,1,.9);
 // great helm with a cross visor and a cracked crest
 const hd=j.head;add(hd,plate,lathe([[0,-.02],[.11,-.02],[.13,.06],[.135,.16],[.12,.24],[.07,.29],[0,.3]],16),0,0,0);add(hd,m.dark,new THREE.BoxGeometry(.2,.022,.03),0,.13,.125);add(hd,m.dark,new THREE.BoxGeometry(.025,.12,.03),0,.08,.128);
 add(hd,plate2,new THREE.BoxGeometry(.02,.1,.2),0,.31,-.01);for(const sx of[-1,1])add(hd,plate2,new THREE.TorusGeometry(.03,.008,4,8),sx*.13,.1,0,0,Math.PI/2,0);
 add(j.neck,under,cap(.06,.04),0,.03,0);
 armorLimbs(r,add,plate,under);add.flush();
 r.capeAt={j:j.chest,pts:[[-.2,.29,-.12],[-.07,.31,-.15],[.07,.31,-.15],[.2,.29,-.12]],w:.62,h:1.12,col:0x4a1210};
 r.weapons={};r.slots={R:j.handR,L:j.handL,shield:j.foreL};}
export function arm(r,style){// equip the hero for a weapon style: 'ss' sword+shield, 'gs' greatsword, 'dg' twin daggers
 for(const k in r.weapons){const w=r.weapons[k];if(w.parent)w.parent.remove(w);}r.weapons={};r.style=style;const j=r.j;
 const put=(w,parent,x,y,z,rx,ry,rz)=>{parent.add(w);w.position.set(x,y,z);w.rotation.set(rx,ry,rz);return w;};
 if(style==='ss'){r.weapons.main=put(makeLongsword(),j.handR,0,-.06,0,0,0,0);r.weapons.shield=put(makeKiteShield(),j.foreL,.08,-r.S.fa*.5,0,0,Math.PI/2,0);}
 else if(style==='gs'){r.weapons.main=put(makeGreatsword(),j.handR,0,-.06,0,0,0,0);}
 else{r.weapons.main=put(makeDagger(),j.handR,0,-.05,0,0,0,0);r.weapons.off=put(makeDagger(),j.handL,0,-.05,0,0,0,0);}}
function dressKnight(r,o){const{j,S}=r;const m=mats(),add=dresser();const plate=m.steel(o.col??0x5a5248,{r:.55,b:2}),plate2=m.steel(0x3a3630,{r:.6}),rag=m.cloth(o.cloth??0x3a3a2a,{side:THREE.DoubleSide}),under=m.cloth(0x2a2622);
 add(j.spine,plate2,lathe([[0,-.04],[.17,-.04],[.165,.12],[.18,S.sp+.03],[0,S.sp+.03]],12),0,0,0,0,0,0,1,1,.8);
 add(j.chest,plate,lathe([[0,-.01],[.19,-.01],[.23,.1],[.24,.2],[.22,.27],[.15,.32],[0,.34]],12),0,0,0,0,0,0,1,1,.76);
 for(let i=0;i<3;i++)add(j.hips,plate2,new THREE.CylinderGeometry(.2+i*.02,.21+i*.025,.08,12,1,true),0,-.05-i*.07,0,0,0,0,1,1,.8);
 add(j.hips,rag,new THREE.PlaneGeometry(.3,.62,2,3),0,-.3,.17,-.06);add(j.hips,rag,new THREE.PlaneGeometry(.34,.7,2,3),0,-.3,-.17,.06);
 add(j.chest,rag,new THREE.PlaneGeometry(.5,.9,2,4),0,-.08,-.2,.12);
 const hd=j.head;add(hd,plate,lathe([[0,-.03],[.12,-.03],[.14,.08],[.14,.18],[.11,.26],[0,.3]],12),0,0,0);add(hd,plate2,new THREE.BoxGeometry(.27,.03,.27),0,.06,0);
 add(hd,m.dark,new THREE.BoxGeometry(.2,.03,.03),0,.15,.13);for(const sx of[-1,1])add(hd,m.eye,new THREE.SphereGeometry(.017,6,5),sx*.045,.15,.135);
 add(j.chest,plate2,new THREE.TorusGeometry(.12,.045,6,14).rotateX(Math.PI/2),0,.31,0,0,0,0,1,1,.9);
 armorLimbs(r,add,plate,under,{pad:1.15});add.flush();r.eyes=m.eye;
 r.weapons={main:makeLongsword()};j.handR.add(r.weapons.main);r.weapons.main.position.set(0,-.06,0);
 r.weapons.shield=makeTowerShield();j.foreL.add(r.weapons.shield);r.weapons.shield.position.set(.1,-S.fa*.45,.06);r.weapons.shield.rotation.set(0,Math.PI/2,0);}
function dressArcher(r){const{j,S}=r;const m=mats(),add=dresser();const hood=m.cloth(0x2a2a26,{side:THREE.DoubleSide}),robe=m.cloth(0x3a3228),lea=new THREE.MeshStandardMaterial({color:0x3a2a1a,roughness:.75,map:tex().leather,bumpMap:tex().leather,bumpScale:2}),skin=std(0x8a8270,{r:.8});
 add(j.spine,robe,new THREE.CylinderGeometry(.15,.17,S.sp+.05,10),0,S.sp/2,0);add(j.chest,lea,lathe([[0,0],[.17,0],[.19,.12],[.17,.24],[.1,.3],[0,.3]],12),0,0,0,0,0,0,1,1,.75);
 add(j.chest,hood,new THREE.ConeGeometry(.28,.36,12,1,true),0,S.ch*.82,-.02);add(j.hips,robe,new THREE.CylinderGeometry(.18,.27,.55,12,1,true),0,-.25,0);
 const hd=j.head;add(hd,skin,new THREE.SphereGeometry(S.head,12,10),0,.1,0);add(hd,hood,new THREE.ConeGeometry(S.head*1.45,.42,12),0,.2,-.05,-.25);add(hd,m.bone,new THREE.SphereGeometry(S.head*.95,12,8,0,Math.PI*2,0,Math.PI*.55),0,.1,.05,Math.PI/2);
 for(const sx of[-1,1])add(hd,m.eye,new THREE.SphereGeometry(.016,6,5),sx*.045,.12,.155);
 add(j.chest,lea,new THREE.CylinderGeometry(.07,.06,.55,8),.1,.05,-.18,.3,0,.4);
 for(const[s]of[['L'],['R']]){add(j['arm'+s],robe,cap(.055,S.ua-.11),0,-S.ua/2,0);add(j['fore'+s],lea,new THREE.CylinderGeometry(.055,.045,S.fa,8),0,-S.fa/2,0);add(j['hand'+s],skin,new THREE.SphereGeometry(.045,8,6),0,-.03,0);
  add(j['leg'+s],robe,cap(.07,S.th-.14),0,-S.th/2,0);add(j['knee'+s],lea,new THREE.CylinderGeometry(.065,.055,S.sh,8),0,-S.sh/2,0);add(j['foot'+s],lea,new THREE.BoxGeometry(.1,.07,.2),0,-.02,.05);}
 add.flush();r.eyes=m.eye;r.weapons={bow:makeBow()};j.handL.add(r.weapons.bow);r.weapons.bow.position.set(0,-.04,.03);r.weapons.bow.rotation.set(-Math.PI/2,0,0);}
function dressBell(r){const{j,S}=r;const m=mats(),add=dresser();const plate=m.steel(0x4e4a42,{r:.5,b:2}),bronze=m.steel(0x6a5430,{m:.9,r:.38}),rag=m.cloth(0x2a201a,{side:THREE.DoubleSide}),under=m.cloth(0x221e1a),chain=m.steel(0x3a3632);
 add(j.spine,plate,lathe([[0,-.04],[.2,-.04],[.21,.14],[.23,S.sp+.03],[0,S.sp+.03]],14),0,0,0,0,0,0,1,1,.85);
 add(j.chest,plate,lathe([[0,-.01],[.23,-.01],[.27,.1],[.28,.2],[.25,.28],[.16,.34],[0,.36]],14),0,0,0,0,0,0,1.05,1,.8);
 for(let i=0;i<5;i++){const a=-1.2+i*.6;add(j.chest,chain,new THREE.TorusGeometry(.03,.009,4,8),Math.sin(a)*.22,.08+Math.abs(Math.cos(a))*.1,Math.cos(a)*.2,0,a,0);}
 add(j.hips,rag,lathe([[.2,.04],[.24,-.1],[.3,-.35],[.38,-.62]],14),0,0,0);add(j.hips,bronze,new THREE.TorusGeometry(.21,.02,4,16).rotateX(Math.PI/2),0,0,0);
 // bell helm: a small bronze bell for a head, with an ember slit
 const hd=j.head;add(hd,bronze,lathe([[0,-.04],[.18,-.04],[.17,.0],[.13,.12],[.12,.24],[.1,.3],[.04,.33],[0,.34]],16),0,0,0);add(hd,m.ember,new THREE.BoxGeometry(.18,.025,.03),0,.1,.15);
 add(hd,bronze,new THREE.TorusGeometry(.035,.012,5,10),0,.37,0);
 add(j.chest,rag,new THREE.PlaneGeometry(.7,1.2,2,4),0,-.18,-.24,.1);
 armorLimbs(r,add,plate,under,{pad:1.35});add.flush();r.glow.push(m.ember);
 r.weapons={main:makeBellHammer()};j.handR.add(r.weapons.main);r.weapons.main.position.set(0,-.06,-.25);}
function dressKing(r){const{j,S}=r;const m=mats(),add=dresser();const plate=new THREE.MeshStandardMaterial({color:0x2a2622,metalness:.85,roughness:.4,map:tex().metal,bumpMap:tex().metal,bumpScale:1.5}),gold=m.gold,under=m.cloth(0x1a1412),crack=std(0x000000,{e:0xff5010,ei:2.2});
 add(j.spine,plate,lathe([[0,-.04],[.18,-.04],[.17,.12],[.19,S.sp+.03],[0,S.sp+.03]],14),0,0,0,0,0,0,1,1,.82);
 add(j.chest,plate,lathe([[0,-.01],[.21,-.01],[.25,.1],[.26,.2],[.24,.28],[.15,.33],[0,.35]],14),0,0,0,0,0,0,1.05,1,.78);
 add(j.chest,crack,new THREE.BoxGeometry(.02,.22,.02),.04,.14,.2,0,0,.3);add(j.chest,crack,new THREE.BoxGeometry(.02,.14,.02),-.06,.1,.2,0,0,-.5);add(j.chest,gold,new THREE.TorusGeometry(.07,.012,5,16),0,.16,.2);
 for(let i=0;i<4;i++)add(j.hips,plate,new THREE.CylinderGeometry(.21+i*.025,.23+i*.03,.1,14,1,true),0,-.04-i*.09,0,0,0,0,1,1,.82);add(j.hips,m.cloth(0x3a0c08,{side:THREE.DoubleSide}),new THREE.PlaneGeometry(.3,.75,1,3),0,-.36,.19,-.05);
 const hd=j.head;add(hd,plate,lathe([[0,-.03],[.12,-.03],[.14,.08],[.14,.18],[.12,.24],[0,.26]],14),0,0,0);add(hd,crack,new THREE.BoxGeometry(.19,.02,.03),0,.13,.13);
 for(let i=0;i<9;i++){const a=i/9*6.283;add(hd,gold,new THREE.ConeGeometry(.025,.16+(i%2)*.1,5),Math.sin(a)*.13,.3+(i%2)*.05,Math.cos(a)*.13,Math.cos(a)*.25,0,-Math.sin(a)*.25);}add(hd,gold,new THREE.TorusGeometry(.135,.018,5,18).rotateX(Math.PI/2),0,.25,0);
 add(j.chest,plate,new THREE.TorusGeometry(.13,.05,6,14).rotateX(Math.PI/2),0,.32,0,0,0,0,1,1,.9);
 armorLimbs(r,add,plate,under,{pad:1.4});for(const s of['L','R'])add(j['sh'+s],gold,new THREE.ConeGeometry(.04,.22,5),0,.12,0);add.flush();r.glow.push(crack);
 r.capeAt={j:j.chest,pts:[[-.26,.31,-.15],[-.09,.33,-.18],[.09,.33,-.18],[.26,.31,-.15]],w:.8,h:1.45,col:0x3a0a08};
 r.weapons={main:makeKingBlade()};j.handR.add(r.weapons.main);r.weapons.main.position.set(0,-.06,0);r.edge=r.weapons.main.userData.edgeMat;r.glow.push(r.edge);}
function dressCantor(r){const{j,S}=r;const m=mats(),add=dresser();const robe=m.cloth(0x1c1a22,{side:THREE.DoubleSide}),robe2=m.cloth(0x6a5a3a),gold=m.gold,mask=std(0xe8e0d0,{r:.35});
 add(j.spine,robe2,new THREE.CylinderGeometry(.14,.16,S.sp+.05,12),0,S.sp/2,0);add(j.chest,robe2,lathe([[0,0],[.16,0],[.19,.12],[.18,.24],[.1,.3],[0,.3]],12),0,0,0,0,0,0,1,1,.8);
 add(j.hips,robe,lathe([[.16,.06],[.22,-.2],[.32,-.6],[.42,-.95],[.48,-1.05]],16),0,0,0);add(j.hips,gold,new THREE.TorusGeometry(.17,.015,4,16).rotateX(Math.PI/2),0,.02,0);
 add(j.chest,robe,lathe([[.08,.32],[.3,.2],[.34,0],[.3,-.2]],14),0,0,0,0,0,0,1,1,.8);
 const hd=j.head;add(hd,robe,new THREE.ConeGeometry(.17,.42,14,1,true),0,.2,-.03,-.15);add(hd,mask,lathe([[0,-.02],[.09,0],[.105,.1],[.095,.2],[0,.24]],14),0,.0,.02,0,0,0,1,1,.8);
 add(hd,m.dark,new THREE.BoxGeometry(.03,.012,.02),-.04,.12,.09);add(hd,m.dark,new THREE.BoxGeometry(.03,.012,.02),.04,.12,.09);add(hd,gold,new THREE.BoxGeometry(.008,.18,.01),0,.11,.1);
 for(const s of['L','R']){add(j['arm'+s],robe,new THREE.CylinderGeometry(.06,.09,S.ua,10,1,true),0,-S.ua/2,0);add(j['fore'+s],robe,new THREE.CylinderGeometry(.09,.13,S.fa,10,1,true),0,-S.fa/2,0);add(j['hand'+s],mask,new THREE.SphereGeometry(.04,8,6),0,-.03,0,0,0,0,.8,1.2,.6);}
 add.flush();
 // halo of blades, rotated each frame
 r.halo=G();j.head.add(r.halo);r.halo.position.set(0,.16,-.2);const hb=dresser();hb(r.halo,gold,new THREE.TorusGeometry(.32,.012,5,40));for(let i=0;i<8;i++){const a=i/8*6.283;hb(r.halo,m.blade,new THREE.ConeGeometry(.025,.24,4),Math.sin(a)*.42,Math.cos(a)*.42,0,0,0,-a);}hb.flush();
 r.haloGlow=std(0x000000,{e:0xffc070,ei:2});mesh(new THREE.TorusGeometry(.32,.006,4,40),r.haloGlow,r.halo);r.glow.push(r.haloGlow);
 r.weapons={main:makeStaff()};j.handR.add(r.weapons.main);r.weapons.main.position.set(0,-.05,0);}

/* bake a posed rig into one merged geometry (stone statues) */
export function bakeRig(r){r.root.updateMatrixWorld(true);const list=[];r.root.traverse(o=>{if(o.isMesh&&o.geometry){const g=o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!g.attributes.uv){const n=g.attributes.position.count;g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n*2),2));}list.push(g);}});return mergeGeos(list.map(g=>{for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);return g;}));}

/* ---------------- quadruped (hounds, the Mother of Hounds) ---------------- */
const QJ=['body','chest','neck','head','jaw','tail1','tail2','tail3','flU','flL','frU','frL','blU','blL','brU','brL'];
export function makeHound(kind='hound'){const r={kind,root:G(),body:G(),j:{},glow:[],scale:kind==='mother'?2.5:1,ph:Math.random()*6};const j=r.j;for(const n of QJ)j[n]=G();
 r.root.add(r.body);r.body.scale.setScalar(r.scale);r.body.add(j.body);j.body.position.set(0,.72,0);j.body.add(j.chest);j.chest.position.set(0,.04,.38);j.chest.add(j.neck);j.neck.position.set(0,.1,.2);j.neck.add(j.head);j.head.position.set(0,.18,.16);j.head.add(j.jaw);j.jaw.position.set(0,-.06,.04);
 j.body.add(j.tail1);j.tail1.position.set(0,.06,-.48);j.tail1.add(j.tail2);j.tail2.position.set(0,0,-.22);j.tail2.add(j.tail3);j.tail3.position.set(0,0,-.2);
 const leg=(u,l,x,z,par)=>{par.add(j[u]);j[u].position.set(x,-.02,z);j[u].add(j[l]);j[l].position.set(0,-.34,0);};leg('flU','flL',.13,.06,j.chest);leg('frU','frL',-.13,.06,j.chest);leg('blU','blL',.13,-.4,j.body);leg('brU','brL',-.13,-.4,j.body);
 const m=mats(),add=dresser();const hide=new THREE.MeshStandardMaterial({color:kind==='mother'?0x2e2622:0x3a302a,roughness:.85,map:tex().leather,bumpMap:tex().leather,bumpScale:3}),bone=m.bone,ember=kind==='mother'?std(0x000000,{e:0xff5a14,ei:2.6}):m.ember;
 add(j.body,hide,cap(.17,.5,10).rotateX(Math.PI/2),0,0,-.12,0,0,0,1,1.05,1);add(j.chest,hide,new THREE.SphereGeometry(.24,12,10),0,0,0,0,0,0,.95,1.15,1.1);
 for(let i=0;i<5;i++)add(j.body,bone,new THREE.TorusGeometry(.17,.016,4,12,Math.PI*1.2),0,-.01,.1-i*.1,0,Math.PI/2,Math.PI*.4);
 for(let i=0;i<7;i++)add(i<3?j.chest:j.body,i<3?bone:bone,new THREE.ConeGeometry(.03+(kind==='mother'?.015:0),.14+(i%2)*.06,5),0,.2,i<3?.05-i*.1:.1-(i-3)*.15,-.4);
 add(j.neck,hide,cap(.11,.16,8).rotateX(1.1),0,.04,.04);
 add(j.head,hide,new THREE.SphereGeometry(.13,12,10),0,0,0,0,0,0,1,.9,1.1);add(j.head,hide,new THREE.CylinderGeometry(.06,.085,.22,8).rotateX(Math.PI/2),0,-.02,.17);add(j.head,bone,new THREE.ConeGeometry(.04,.06,4).rotateX(Math.PI/2),0,0,.29);
 for(const sx of[-1,1]){add(j.head,ember,new THREE.SphereGeometry(.022,6,5),sx*.06,.04,.12);add(j.head,hide,new THREE.ConeGeometry(.04,.12,4),sx*.07,.12,-.04,-.4,0,sx*.3);
  for(let i=0;i<3;i++)add(j.head,bone,new THREE.ConeGeometry(.008,.04,3).rotateX(Math.PI),sx*.04,-.06,.12+i*.05);}
 add(j.jaw,hide,new THREE.BoxGeometry(.09,.035,.22),0,0,.12);for(const sx of[-1,1])for(let i=0;i<3;i++)add(j.jaw,bone,new THREE.ConeGeometry(.008,.04,3),sx*.035,.03,.06+i*.05);
 add(j.tail1,hide,cap(.045,.16,6).rotateX(Math.PI/2),0,0,-.1);add(j.tail2,hide,cap(.035,.14,6).rotateX(Math.PI/2),0,0,-.1);add(j.tail3,bone,new THREE.ConeGeometry(.03,.2,5).rotateX(-Math.PI/2),0,0,-.1);
 for(const[u,l]of[['flU','flL'],['frU','frL'],['blU','blL'],['brU','brL']]){add(j[u],hide,cap(.06,.24,6),0,-.17,0);add(j[l],hide,cap(.04,.26,6),0,-.17,0);add(j[l],bone,new THREE.BoxGeometry(.07,.04,.11),0,-.36,.03);}
 if(kind==='mother'){for(let i=0;i<12;i++){const a=(i/11-.5)*2.4;add(j.neck,ember,new THREE.ConeGeometry(.018,.22,4),Math.sin(a)*.12,.1,Math.cos(a)*.05-.04,-.9+Math.cos(a)*.3,0,-Math.sin(a)*.8);}
  add(j.body,ember,new THREE.BoxGeometry(.015,.015,.5),.1,.12,-.1,0,0,.4);add(j.body,ember,new THREE.BoxGeometry(.015,.015,.4),-.09,.1,-.2,0,0,-.4);}
 add.flush();r.glow.push(ember);r.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});return r;}

/* ---------------- humanoid animator ---------------- */
const T={};for(const n of JOINTS)T[n]=[0,0,0];
function zero(){for(const n of JOINTS){const t=T[n];t[0]=t[1]=t[2]=0;}}
const lerpK=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t),cl01=v=>v<0?0:v>1?1:v;
// keyframes: [p, chestY, chestX, armRx, armRz, foreRx, armLx, armLz, foreLx, handRx, (optional) spineX, legLx, legRx, kneeL, kneeR, hipDrop]
const MOVES={
 slash1:[[0,-.75,-.05,-2.3,-.7,-1.3,-.4,.3,-.6,0],[.42,.55,.12,-1.25,.65,-.2,-.2,.4,-.3,1.15],[1,.75,.1,-.7,.85,-.5,-.1,.3,-.4,.9]],
 slash2:[[0,.8,-.05,-1.35,1.,-.7,-.3,.3,-.5,.6],[.42,-.6,.12,-1.45,-.95,-.15,-.5,.2,-.4,1.2],[1,-.85,.08,-1.,-1.25,-.5,-.3,.2,-.5,.9]],
 thrust:[[0,-.45,-.12,-1.,-.5,-1.9,-.3,.3,-.6,1.4,0,.3,-.2,.2,.3,0],[.4,.22,.28,-1.6,.1,0,-.3,.3,-.6,1.5,.15,-.55,.35,.5,.2,.08],[1,.15,.22,-1.5,.05,-.1,-.3,.3,-.6,1.5,.1,-.5,.3,.45,.2,.06]],
 chop:[[0,0,-.32,-3.0,-.15,-1.3,-2.6,.2,-1.0,-.3],[.45,0,.42,-1.0,.05,-.1,-1.,.1,-.3,.55,.2,-.4,.3,.5,.2,.1],[1,0,.35,-.55,.05,-.3,-.5,.1,-.4,.6,.15,-.35,.25,.45,.2,.08]],
 // two-handed (greatsword / hammer / king blade): left hand rides near the right
 gsweepR:[[0,-1.1,.05,-1.25,-1.25,-.35,-1.15,-.25,-.7,1.0,0,.2,-.3,.3,.4,.04],[.45,.85,.18,-1.4,.95,-.1,-1.25,1.05,-.2,1.15,.1,-.3,.4,.4,.2,.1],[1,1.15,.12,-1.15,1.15,-.3,-1.0,1.1,-.4,1.0,.05,-.3,.35,.35,.2,.08]],
 gsweepL:[[0,1.1,.05,-1.3,.95,-.3,-1.2,1.05,-.3,1.0,0,-.3,.2,.4,.3,.04],[.45,-.9,.18,-1.35,-1.2,-.15,-1.25,-.35,-.6,1.15,.1,.35,-.35,.2,.45,.1],[1,-1.15,.12,-1.1,-1.3,-.35,-1.,-.4,-.7,1.0,.05,.3,-.3,.2,.4,.08]],
 slam2:[[0,0,-.38,-2.95,-.3,-.55,-2.95,.3,-.55,0,-.1,.1,-.1,.1,.1,0],[.45,0,.62,-.45,-.2,0,-.45,.2,0,.4,.3,-.6,.4,.7,.3,.22],[1,0,.55,-.35,-.2,-.1,-.35,.2,-.1,.4,.25,-.55,.35,.65,.3,.2]],
 spin:[[0,-.6,.05,-1.55,-.35,-.1,-1.2,.6,-.3,1.3],[.5,0,.08,-1.55,-.4,-.05,-1.2,.6,-.3,1.3],[1,.3,.05,-1.4,-.3,-.2,-1.,.5,-.4,1.2]],
 // twin daggers: right and left alternate
 dagR:[[0,-.7,-.05,-2.0,-.8,-1.6,-.9,.4,-1.2,0],[.4,.5,.15,-1.3,.6,-.2,-1.0,.5,-1.3,1.1],[1,.6,.12,-.9,.7,-.4,-.9,.4,-1.2,.9]],
 dagL:[[0,.7,-.05,-.9,-.4,-1.2,-2.0,.8,-1.6,0],[.4,-.5,.15,-1.0,-.5,-1.3,-1.3,-.6,-.2,0],[1,-.6,.12,-.9,-.4,-1.2,-.9,-.7,-.4,0]],
 dagX:[[0,0,-.3,-2.6,-.6,-1.4,-2.6,.6,-1.4,.5],[.42,0,.35,-.9,.75,-.2,-.9,-.75,-.2,1.1,.15,-.4,.3,.5,.2,.1],[1,0,.3,-.7,.8,-.4,-.7,-.8,-.4,1.0,.1,-.35,.25,.45,.2,.08]],
 // shield
 bash:[[0,-.4,-.05,-.6,-.3,-1.0,-1.1,-.1,-1.4,0],[.4,.45,.2,-.5,-.2,-.9,-1.55,-.55,-.15,0,.1,-.4,.3,.4,.2,.04],[1,.4,.15,-.5,-.2,-.9,-1.45,-.5,-.25,0]],
 parry:[[0,-.3,-.05,-.6,-.3,-1.0,-1.0,.2,-1.6,0],[.35,.55,.08,-.5,-.25,-.9,-1.6,-.85,-.1,0],[1,.35,.05,-.5,-.25,-.9,-1.3,-.4,-.6,0]],
 parryW:[[0,.2,-.05,-1.3,.4,-.9,-1.0,.6,-1.0,1.6],[.35,-.6,0,-2.2,-.6,-.6,-1.0,.5,-1.0,1.8],[1,-.3,0,-1.6,-.2,-.8,-.9,.4,-1.0,1.6]],
 drink:[[0,0,0,-1.,.3,-1.4,0,.1,-.2,0],[.35,.1,-.25,-2.3,.55,-2.3,0,.15,-.2,0],[1,.1,-.25,-2.4,.6,-2.3,0,.15,-.2,0]],
 roar:[[0,0,.25,-.6,-.4,-1.2,-.6,.4,-1.2,0],[.3,0,-.45,-.5,-1.35,-.5,-.5,1.35,-.5,0,-.2],[1,0,-.4,-.6,-1.3,-.6,-.6,1.3,-.6,0,-.2]],
 cast:[[0,-.2,-.15,-1.0,-.3,-1.0,-1.0,.3,-1.0,0],[.5,.0,-.3,-2.9,-.25,-.2,-2.7,.3,-.3,0,-.15],[1,0,.3,-1.4,-.1,-.2,-1.4,.1,-.2,0,.1]],
 point:[[0,-.3,0,-1.0,-.3,-1.0,-.3,.2,-.4,0],[.4,.2,.1,-1.65,-.05,-.05,-.3,.2,-.4,1.5],[1,.2,.1,-1.6,-.05,-.05,-.3,.2,-.4,1.5]],
 stomp:[[0,0,-.1,-.9,-.9,-.6,-.9,.9,-.6,0,-.1,-1.3,.1,1.6,.1,-.05],[.45,0,.35,-.6,-1.1,-.4,-.6,1.1,-.4,0,.25,.2,-.1,.1,.3,.25],[1,0,.3,-.6,-1.1,-.4,-.6,1.1,-.4,0,.2,.15,-.1,.2,.3,.2]],
 bow:[[0,-.3,0,-1.5,.3,-1.9,-1.57,-.05,0,0],[.5,-.3,0,-1.5,.45,-2.15,-1.57,-.05,0,0],[1,-.3,0,-1.3,.2,-.6,-1.57,-.05,0,0]],
 kneelStab:[[0,0,.2,-2.6,-.1,-1.0,-2.6,.1,-1.0,.0,.2,-1.5,.3,2.0,.9,.35],[.45,0,.55,-.7,0,-.1,-.7,0,-.1,.5,.4,-1.5,.3,2.0,1.0,.45],[1,0,.5,-.6,0,-.1,-.6,0,-.1,.5,.4,-1.5,.3,2.0,1.0,.45]]};
function moveAt(name,p){const k=MOVES[name]||MOVES.slash1;let i=0;while(i<k.length-2&&p>k[i+1][0])i++;const a=k[i],b=k[i+1],f=sm(cl01((p-a[0])/(b[0]-a[0])));const out=[];const n=Math.max(a.length,b.length);for(let q=0;q<n;q++)out.push(a[q]===undefined||b[q]===undefined?undefined:lerpK(a[q],b[q],f));return out;}
// guard (idle combat stance) per weapon style
const GUARD={ss:{armR:[-.55,-.15],foreR:-1.05,handR:.6,armL:[-.6,.1],foreL:-1.5},gs:{armR:[-.75,.35],foreR:-1.0,handR:.9,armL:[-.95,-.2],foreL:-1.15},dg:{armR:[-.6,-.25],foreR:-1.3,handR:1.1,armL:[-.6,.25],foreL:-1.3},
 hammer:{armR:[-.35,-.2],foreR:-.6,handR:.2,armL:[-.8,-.3],foreL:-1.0},king:{armR:[-.5,-.15],foreR:-.7,handR:.7,armL:[-.2,.15],foreL:-.4},knight:{armR:[-.45,-.15],foreR:-.9,handR:.6,armL:[-.75,.15],foreL:-1.45},
 staff:{armR:[-.35,-.1],foreR:-.9,handR:1.4,armL:[-.3,.2],foreL:-.9},bow:{armR:[-.1,-.1],foreR:-.3,handR:0,armL:[-.25,.1],foreL:-.3}};
/* st: {mode:'idle'|'move'|'strafe'|'roll'|'dead'|'stagger'|'kneel'|'float'|'air', speed, t, sx/sz (strafe dir), atk:{name,p,w}, block, guard, hurt, roll:{p}, dp} */
export function animate(r,st,dt){zero();const t=st.t,S=r.S;let hipY=S.hip,direct=null;r.ph=r.ph||0;const mode=st.mode,sp=st.speed||0;
 if(mode==='move'||mode==='idle'||mode==='strafe'||mode==='float'){const run=cl01((sp-2.6)/4.5),stride=lerpK(1.45,2.5,run)*S.hip/.94;r.ph+=sp*dt/stride*Math.PI;const s=Math.sin(r.ph),c=Math.cos(r.ph);
  const w=Math.min(1,sp/1.2);const A=lerpK(.42,.95,run)*w,K=lerpK(.7,1.6,run)*w,AA=lerpK(.35,.85,run)*w;
  if(mode==='strafe'){const fx=st.fwd??0,sx=st.side??0;T.legL[0]=-s*A*fx;T.legR[0]=s*A*fx;T.legL[2]=Math.max(0,s)*.35*sx*w;T.legR[2]=Math.max(0,-s)*.35*sx*w;T.kneeL[0]=.15+K*.5*Math.max(0,c);T.kneeR[0]=.15+K*.5*Math.max(0,-c);T.hips[1]=sx*.25*w;T.chest[1]=-sx*.2*w;hipY-=.05+Math.abs(s)*.03*w;}
  else{T.legL[0]=-s*A;T.legR[0]=s*A;T.kneeL[0]=.08+K*Math.max(0,c);T.kneeR[0]=.08+K*Math.max(0,-c);T.footL[0]=-T.legL[0]*.3-.1*w;T.footR[0]=-T.legR[0]*.3-.1*w;}
  T.armL[0]=s*AA;T.armR[0]=-s*AA;T.foreL[0]=-.25-run*.9*w;T.foreR[0]=-.25-run*.9*w;T.armL[2]=.12;T.armR[2]=-.12;
  T.spine[0]=lerpK(.05,.28,run)*w;T.hips[1]+=s*.1*w;T.chest[1]+=-s*.15*w;T.head[0]=-T.spine[0]*.6;hipY-=Math.abs(Math.sin(r.ph))*.05*w*(1+run);
  const br=Math.sin(t*1.6)*(1-w);T.chest[0]+=br*.03;T.armL[2]+=.05*(1-w);T.armR[2]-=.05*(1-w);T.head[1]=Math.sin(t*.45)*.2*(1-w)*(st.idleLook??1);
  if(st.guard&&GUARD[st.guard]){const g=GUARD[st.guard],gw=st.gw??1;T.armR[0]=lerpK(T.armR[0],g.armR[0]+(-s*AA*.25),gw);T.armR[2]=lerpK(T.armR[2],g.armR[1],gw);T.foreR[0]=lerpK(T.foreR[0],g.foreR,gw);T.handR[0]=g.handR*gw;
   if(!st.oneHand||st.guard!=='bow'){T.armL[0]=lerpK(T.armL[0],g.armL[0]+(s*AA*.25),gw);T.armL[2]=lerpK(T.armL[2],g.armL[1],gw);T.foreL[0]=lerpK(T.foreL[0],g.foreL,gw);}
   if(!sp||mode!=='move'){T.legL[0]-=.18*gw;T.legR[0]+=.22*gw;T.kneeL[0]+=.25*gw;T.kneeR[0]+=.3*gw;hipY-=.05*gw;T.hips[1]+=-.25*gw;T.chest[1]+=.2*gw;}}
  if(mode==='float'){hipY+=.35+Math.sin(t*1.8)*.12;T.legL[0]=-.15;T.legR[0]=.1;T.kneeL[0]=T.kneeR[0]=.4;T.footL[0]=T.footR[0]=.6;}}
 else if(mode==='air'){T.legL[0]=-.8;T.kneeL[0]=1.2;T.legR[0]=.1;T.kneeR[0]=.6;T.armL[0]=-.6;T.armR[0]=-.5;T.armL[2]=.6;T.armR[2]=-.6;T.spine[0]=.15;}
 else if(mode==='dead'){const p=Math.min(1,st.dp||1);hipY=lerpK(S.hip,S.hip*.22,p);direct={x:-1.45*sm(p)};T.armL[2]=1.1*p;T.armR[2]=-1.1*p;T.legL[2]=.2;T.legR[2]=-.2;T.kneeL[0]=.3;}
 else if(mode==='kneel'){hipY=S.hip*.55;T.legL[0]=-1.5;T.kneeL[0]=1.55;T.legR[0]=.2;T.kneeR[0]=1.9;T.footR[0]=.8;T.spine[0]=.55;T.head[0]=.3;T.armR[0]=-.3;T.foreR[0]=-.4;T.armL[0]=-.5;T.armL[2]=.3;T.foreL[0]=-.6;}
 else if(mode==='rest'){hipY=S.hip*.48;T.legL[0]=T.legR[0]=-1.45;T.kneeL[0]=T.kneeR[0]=2.1;T.legL[2]=.35;T.legR[2]=-.35;T.spine[0]=.3;T.head[0]=.15;T.armL[0]=T.armR[0]=-.7;T.foreL[0]=T.foreR[0]=-.9;T.chest[0]=Math.sin(t*1.2)*.03;}
 else if(mode==='stagger'){const p=st.sp??0.5,k=Math.sin(Math.min(1,p)*Math.PI);T.spine[0]=-.45*k;T.chest[0]=-.3*k;T.head[0]=-.4*k;T.armR[0]=-.6*k;T.armR[2]=-.9*k;T.armL[0]=-.6*k;T.armL[2]=.9*k;T.legL[0]=-.4*k;T.legR[0]=.35*k;T.kneeL[0]=.5*k;T.kneeR[0]=.2*k;hipY-=.08*k;}
 else if(mode==='roll'){const p=st.roll.p;direct={x:sm(cl01(p*1.15))*Math.PI*2};hipY=lerpK(S.hip,S.hip*.5,Math.sin(p*Math.PI));const k=Math.sin(p*Math.PI);
  T.legL[0]=T.legR[0]=-1.5*k;T.kneeL[0]=T.kneeR[0]=2.1*k;T.armL[0]=T.armR[0]=-1.1*k;T.foreL[0]=T.foreR[0]=-1.5*k;T.spine[0]=.7*k;T.head[0]=.5*k;}
 else if(mode==='backstep'){const k=Math.sin(st.roll.p*Math.PI);T.spine[0]=-.15*k;T.legL[0]=.5*k;T.legR[0]=-.3*k;T.kneeL[0]=.4*k;T.kneeR[0]=.6*k;hipY-=.1*k;}
 // attack / action overlay (w blends it in during a windup)
 if(st.atk){const m=moveAt(st.atk.name,st.atk.p),w=st.atk.w??1;const L=(a,b)=>lerpK(a,b,w);
  T.chest[1]=L(T.chest[1],m[1]);T.chest[0]=L(T.chest[0],m[2]);T.armR[0]=L(T.armR[0],m[3]);T.armR[2]=L(T.armR[2],m[4]);T.foreR[0]=L(T.foreR[0],m[5]);
  if(!st.atk.keepL){T.armL[0]=L(T.armL[0],m[6]);T.armL[2]=L(T.armL[2],m[7]);T.foreL[0]=L(T.foreL[0],m[8]);}T.handR[0]=L(T.handR[0],m[9]);T.spine[1]=L(T.spine[1],m[1]*.3);
  if(m[10]!==undefined){T.spine[0]=L(T.spine[0],m[10]);T.legL[0]=L(T.legL[0],m[11]);T.legR[0]=L(T.legR[0],m[12]);T.kneeL[0]=L(T.kneeL[0],m[13]);T.kneeR[0]=L(T.kneeR[0],m[14]);hipY-=(m[15]||0)*w;}}
 if(st.block){const sh=st.guard==='ss'||st.guard==='knight';if(sh){T.armL[0]=-1.4;T.armL[2]=-.4;T.foreL[0]=-1.35;T.armL[1]=.4;T.chest[1]+=.12;}else{T.armR[0]=-1.3;T.armR[2]=.5;T.foreR[0]=-1.1;T.handR[0]=1.6;T.armL[0]=-1.2;T.armL[2]=-.3;T.foreL[0]=-1.3;}
  if(mode!=='move'||sp<.5){T.legL[0]=-.35;T.kneeL[0]=.5;T.legR[0]=.3;T.kneeR[0]=.35;hipY-=.07;}}
 if(st.hurt>0){T.spine[0]-=.35*st.hurt;T.head[0]-=.3*st.hurt;}
 const k=1-Math.exp(-dt*(st.snap?40:st.slow?7:16));for(const n of JOINTS){const e=r.j[n].rotation,tt=T[n];e.x+=(tt[0]-e.x)*k;e.y+=(tt[1]-e.y)*k;e.z+=(tt[2]-e.z)*k;if(e.x!==e.x||e.y!==e.y||e.z!==e.z)e.set(0,0,0);}
 if(direct){if(direct.x!==undefined)r.j.hips.rotation.x=direct.x;}
 r.hy+=(hipY-r.hy)*Math.min(1,dt*(direct?40:14));r.j.hips.position.y=r.hy;
 if(r.halo){r.halo.rotation.z+=dt*(st.haloSpin??.6);}}

/* ---------------- quadruped animator ---------------- */
const Q={};for(const n of QJ)Q[n]=[0,0,0];
// keyframes [p, bodyX(pitch), bodyY(drop), neckX, headX, jaw, flU, frU, blU, brU, tailX, bodyRoll]
const QM={pounce:[[0,.25,-.18,.2,-.3,.2,.6,.6,.7,.7,.4,0],[.4,-.45,.25,-.5,.3,.7,-1.3,-1.3,1.0,1.0,-.3,0],[1,0,0,.1,0,.1,-.2,-.2,.2,.2,0,0]],
 bite:[[0,.12,-.1,.5,-.4,.0,.25,.2,.3,.3,.3,0],[.35,-.15,.05,-.45,.35,.9,-.6,-.4,.1,.1,0,0],[1,0,0,-.2,.15,.1,-.2,-.1,.1,.1,0,0]],
 howl:[[0,.2,-.05,.3,0,.1,.1,.1,.5,.5,.5,0],[.4,-.55,.0,-1.2,-.7,.7,-.25,-.25,.6,.6,.7,0],[1,-.5,0,-1.1,-.7,.6,-.2,-.2,.6,.6,.7,0]],
 breath:[[0,.25,-.12,.6,-.2,.1,.3,.3,.3,.3,.3,0],[.3,-.1,-.05,-.1,.25,.85,-.1,-.1,.2,.2,0,0],[1,-.1,-.05,-.1,.25,.85,-.1,-.1,.2,.2,0,0]],
 sweep:[[0,0,-.1,.2,0,.2,.3,.3,.3,.3,.8,-.2],[.5,0,-.05,.2,0,.3,-.3,.3,.4,-.3,-.8,.3],[1,0,0,0,0,.1,0,0,0,0,0,0]]};
function qmAt(name,p){const k=QM[name];let i=0;while(i<k.length-2&&p>k[i+1][0])i++;const a=k[i],b=k[i+1],f=sm(cl01((p-a[0])/(b[0]-a[0])));return a.map((v,n)=>lerpK(v,b[n],f));}
export function animateHound(r,st,dt){for(const n of QJ){const q=Q[n];q[0]=q[1]=q[2]=0;}const j=r.j,sp=st.speed||0,t=st.t;let by=.72,bx=0,roll=0;
 if(st.mode==='dead'){const p=Math.min(1,st.dp||1);by=lerpK(.72,.2,p);roll=1.4*sm(p);Q.flU[0]=Q.frU[0]=.6*p;Q.blU[0]=Q.brU[0]=-.6*p;Q.jaw[0]=.4;}
 else if(st.mode==='stagger'){const k=Math.sin(Math.min(1,st.sp??.5)*Math.PI);bx=-.25*k;Q.neck[0]=-.4*k;Q.jaw[0]=.6*k;by-=.08*k;Q.flU[0]=-.4*k;Q.frU[0]=-.3*k;}
 else if(st.mode==='kneel'){by=.42;bx=.25;Q.flU[0]=Q.frU[0]=-.9;Q.flL[0]=Q.frL[0]=1.5;Q.blU[0]=Q.brU[0]=.8;Q.blL[0]=Q.brL[0]=-1.2;Q.neck[0]=.6;Q.jaw[0]=.3+Math.sin(t*6)*.1;}
 else{const gal=cl01((sp-3)/5);r.ph+=sp*dt*(gal>.5?1.5:2.2)/r.scale;const s=Math.sin(r.ph),c=Math.cos(r.ph);const w=Math.min(1,sp/1.5),A=lerpK(.5,.9,gal)*w;
  if(gal>.5){Q.flU[0]=s*A;Q.frU[0]=Math.sin(r.ph+.4)*A;Q.blU[0]=-s*A;Q.brU[0]=-Math.sin(r.ph+.4)*A;bx=c*.12*w;by+=Math.abs(s)*.06*w;}
  else{Q.flU[0]=s*A;Q.brU[0]=s*A;Q.frU[0]=-s*A;Q.blU[0]=-s*A;by+=Math.abs(c)*.03*w;}
  Q.flL[0]=Math.max(0,-s)*.8*w;Q.frL[0]=Math.max(0,s)*.8*w;Q.blL[0]=-Math.max(0,s)*.6*w;Q.brL[0]=-Math.max(0,-s)*.6*w;
  Q.neck[0]=.15+Math.sin(t*1.3)*.05*(1-w);Q.head[0]=-.1;Q.jaw[0]=.08+Math.max(0,Math.sin(t*3))*.12*(1-w)+w*.2;Q.tail1[0]=.3-w*.2;Q.tail1[1]=Math.sin(t*(2+sp))*.3;Q.tail2[1]=Math.sin(t*(2+sp)-.6)*.3;
  if(st.prowl){by-=.12;bx+=.08;Q.neck[0]+=.35;Q.head[0]-=.3;Q.jaw[0]=.25+Math.sin(t*8)*.05;}}
 if(st.atk){const m=qmAt(st.atk.name,st.atk.p),w=st.atk.w??1;const L=(a,b)=>lerpK(a,b,w);bx=L(bx,m[1]);by+=m[2]*w;Q.neck[0]=L(Q.neck[0],m[3]);Q.head[0]=L(Q.head[0],m[4]);Q.jaw[0]=L(Q.jaw[0],m[5]);Q.flU[0]=L(Q.flU[0],m[6]);Q.frU[0]=L(Q.frU[0],m[7]);Q.blU[0]=L(Q.blU[0],m[8]);Q.brU[0]=L(Q.brU[0],m[9]);Q.tail1[0]=L(Q.tail1[0],m[10]);roll=L(roll,m[11]);}
 const k=1-Math.exp(-dt*(st.snap?36:14));for(const n of QJ){if(n==='body')continue;const e=j[n].rotation,q=Q[n];e.x+=(q[0]-e.x)*k;e.y+=(q[1]-e.y)*k;e.z+=(q[2]-e.z)*k;}
 j.body.rotation.x+=(bx-j.body.rotation.x)*k;j.body.rotation.z+=(roll-j.body.rotation.z)*k;j.body.position.y+=(by-j.body.position.y)*k;}

// world positions of a weapon's tip/base (for trails and hit sparks)
export function gearPoints(obj,a,b){obj.updateWorldMatrix(true,false);a.copy(obj.userData.base).applyMatrix4(obj.matrixWorld);b.copy(obj.userData.tip).applyMatrix4(obj.matrixWorld);}
