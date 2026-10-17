// SILENT CONTRACT — people: one skinned mesh per character built from rounded primitives (tailored suits with lapels and bow ties,
// gowns, waiter jackets, chef whites, security suits with earpieces, sentries, mechanics, underwear when stripped), hand props
// (flutes, trays, clipboards, cigarettes, violins, the silenced pistol) and a procedural pose layer: walk/run/sneak cycles, idle
// talk, drink, applaud, speech, lean on a rail, smoke, play, tray carry, cower, flee, aim, choke/strangle, drag, lying bodies, falls.
import * as THREE from '../vendor/three.module.min.js';
import {dynMat} from './world.js';
const V=THREE.Vector3,PI=Math.PI,cl=(v,a,b)=>v<a?a:v>b?b:v;
const UA=.28,LA=.26,TH=.45,SH=.45;
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
function rbox(w,h,d,r=.02,seg=2){r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);const g=new THREE.BoxGeometry(w,h,d,seg,seg,seg),p=g.attributes.position,n=g.attributes.normal,v=new V(),c=new V(),hw=w/2-r,hh=h/2-r,hd=d/2-r;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(cl(v.x,-hw,hw),cl(v.y,-hh,hh),cl(v.z,-hd,hd));v.sub(c);if(v.lengthSq()<1e-10)v.fromBufferAttribute(n,i);v.normalize();n.setXYZ(i,v.x,v.y,v.z);p.setXYZ(i,c.x+v.x*r,c.y+v.y*r,c.z+v.z*r);}return g;}
const cap=(r,len,rs=8)=>{const g=new THREE.CapsuleGeometry(r,Math.max(.001,len),3,rs);g.translate(0,-len/2,0);return g;};
const CY=(a,b,h,s=10)=>new THREE.CylinderGeometry(a,b,h,s),SP=(r,a=12,b=10,ps=0,pl=PI*2,ts=0,tl=PI)=>new THREE.SphereGeometry(r,a,b,ps,pl,ts,tl);
const lath=(pts,s=14)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),s);

const BONES=[['root',-1,0,0,0],['hips',0,0,.95,0],['spine',1,0,.08,0],['chest',2,0,.22,0],['neck',3,0,.28,0],['head',4,0,.07,0],
 ['armL',3,.19,.22,0],['foreL',6,0,-UA,0],['handL',7,0,-LA,0],['armR',3,-.19,.22,0],['foreR',9,0,-UA,0],['handR',10,0,-LA,0],
 ['thighL',1,.1,0,0],['shinL',12,0,-TH,0],['footL',13,0,-SH,0],['thighR',1,-.1,0,0],['shinR',15,0,-TH,0],['footR',16,0,-SH,0]];
const BI={};BONES.forEach((b,i)=>BI[b[0]]=i);
const BW=BONES.map(()=>new V());BONES.forEach((b,i)=>{BW[i].set(b[2],b[3],b[4]);if(b[1]>=0)BW[i].add(BW[b[1]]);});

/* ---------- looks */
const SKIN=[0xe8c0a0,0xc89070,0x8a5a3c,0xf0d0b8,0x6a4430,0xd8a888];const HAIR=[0x1a1410,0x3a2616,0x6a4a2a,0xb89058,0x8a8a8a,0x2a1a10,0xc0c0bc,0x5a2a14];
const TUX=[0x121216,0x1a1c26,0x0e1a14,0xe8e0d0,0x2a1a2a],GOWN=[0x8a1418,0x0e5a3a,0xc8a040,0x1a2a5a,0xb8b8c0,0x5a1a4a,0xd86a5a,0x101014,0xe0c8b0];
export function look(type,seed=1){let s=(seed*2654435761>>>0)%2147483646+1;const r=()=>(s=(s*16807)%2147483647)/2147483647;const pick=a=>a[r()*a.length|0];
 const base={type,skin:pick(SKIN),hair:pick(HAIR),hairS:pick(['short','short','slick','crop','bald','wavy']),female:false,face:r()};
 switch(type){
  case 'player':return{...base,skin:0xe0b494,hair:0x1a1410,hairS:'slick',jacket:0x1c1f26,shirt:0xf0f0ec,tie:0x7a1418,pants:0x1c1f26,shoes:0x0e0e10,stubble:1};
  case 'guest':{const f=r()<.5;if(f)return{...base,female:true,gown:pick(GOWN),hairS:pick(['bob','updo','long','updo']),hair:pick(HAIR),shoes:0x1a1a1a,neck:r()<.5?0xe8c060:0,prop:'glass'};
   const j=pick(TUX);return{...base,jacket:j,shirt:0xf6f4ee,bow:j===0xe8e0d0?0x101010:pick([0x101010,0x101010,0x6a0e14,0x0e2a5a]),pants:j===0xe8e0d0?0x111114:j,shoes:0x0c0c0e,prop:r()<.75?'glass':0,pocket:r()<.4?pick([0xc82a2a,0xe8d8b0,0x2a4a8a]):0};}
  case 'waiter':return{...base,jacket:0xf2efe8,shirt:0xf8f8f4,bow:0x101010,pants:0x141418,shoes:0x0c0c0e,prop:'tray'};
  case 'bartender':return{...base,jacket:0,vest:0x141418,shirt:0xf8f8f4,bow:0x6a1418,pants:0x141418,shoes:0x0c0c0e};
  case 'chef':return{...base,chefcoat:0xf6f6f2,pants:0x2a2a2a,check:1,shoes:0x1a1a1a,hat:'toque'};
  case 'guard':return{...base,jacket:0x2a2c30,shirt:0xe8e8ea,tie:0x101012,pants:0x2a2c30,shoes:0x0c0c0e,ear:1,hairS:pick(['crop','bald','short'])};
  case 'sentry':return{...base,polo:0x1c1e22,vestT:0x2c3036,pants:0x2a2c30,shoes:0x1a1a1a,hat:'cap',hatC:0x1c1e22,ear:1};
  case 'mech':return{...base,overall:0x2a4a6a,shirt:0xd8d0c0,shoes:0x3a2a1a,hat:'cap',hatC:0x8a3a2a};
  case 'gardener':return{...base,overall:0x4a5a3a,shirt:0xc8b898,shoes:0x3a2a1a,hat:'cap',hatC:0x6a5a3a};
  case 'somm':return{...base,jacket:0,vest:0x1a1012,shirt:0xf0ece4,tie:0x5a1018,pants:0x141418,shoes:0x0c0c0e,apronC:0x2a1a12};
  case 'pa':return{...base,female:true,suitF:0x16161a,shirt:0xf4f2ee,hairS:'updo',hair:0x2a1a10,shoes:0x101010,prop:'clip',glasses:1};
  case 'musician':return{...base,jacket:0x101014,shirt:0xf6f4ee,bow:0x101010,pants:0x101014,shoes:0x0c0c0e,prop:'violin'};
  case 'vane':return{...base,skin:0xd8a888,hair:0xb8b4ac,hairS:'wavy',jacket:0xf2ece0,shirt:0xf8f8f4,bow:0x101010,pants:0x121214,shoes:0x0c0c0e,pocket:0xc81e1e,beard:0xa8a49c,prop:'glass'};
  case 'corvo':return{...base,female:true,skin:0xe0b494,gown:0x0e5a46,hair:0x0e0c0c,hairS:'bob',neck:0xe8c060,shoes:0x101010,glasses:0,prop:'glass'};
  case 'under':return{...base,under:1,shoes:0x2a2a2a};}
 return base;}
// which disguise a look grants
export const DISGUISE={player:'suit',guest:'guest',vane:'guest',corvo:'guest',musician:'guest',pa:'guest',waiter:'waiter',bartender:'waiter',somm:'waiter',chef:'chef',guard:'guard',sentry:'guard',mech:'mech',gardener:'mech',under:null};
export const DNAME={suit:'YOUR SUIT',guest:'GALA GUEST',waiter:'CATERING STAFF',chef:'CHEF',guard:'SECURITY',mech:'GROUNDS CREW'};

function buildBody(lk){const parts=[];const add=(bone,geo,m,col)=>parts.push({b:BI[bone],geo,m:m||new THREE.Matrix4(),col:new THREE.Color(col)});
 const F=lk.female,sk=lk.skin,shW=F?.88:1;
 const top=lk.jacket||lk.chefcoat||lk.polo||lk.overall||lk.suitF||lk.shirt||(lk.under?0xf0f0ec:0x888888);
 // ---- torso
 if(lk.gown){add('chest',rbox(.31,.36,.2,.07),M4(0,.12,0),lk.gown);add('chest',rbox(.3,.12,.18,.06),M4(0,.3,0),sk);add('spine',rbox(.26,.2,.18,.07),M4(0,.05,0),lk.gown);
  add('hips',lath([[.15,.08],[.2,0],[.26,-.25],[.33,-.6],[.38,-.88],[.39,-.9],[0,-.9]],16),M4(0,0,0),lk.gown);
  if(lk.neck)add('chest',new THREE.TorusGeometry(.085,.012,6,16),M4(0,.33,.05,PI/2-.3,0,0),lk.neck);}
 else if(lk.under){add('chest',rbox(.34*shW,.4,.2,.07),M4(0,.12,0),0xf4f4f0);add('chest',rbox(.2,.1,.15,.04),M4(0,.32,.0),sk);add('spine',rbox(.3,.2,.19,.07),M4(0,.05,0),0xf4f4f0);add('hips',rbox(.33,.22,.21,.07),M4(0,-.02,0),0xd8dce8);}
 else{add('chest',rbox(.36*shW,.42,.22,.07),M4(0,.13,0),top);add('spine',rbox(.32*shW,.2,.2,.07),M4(0,.05,0),top);add('hips',rbox(.33,.21,.21,.07),M4(0,-.01,0),lk.overall||lk.pants||0x222222);
  if(lk.jacket||lk.suitF){const j=lk.jacket||lk.suitF;// lapels, shirt V, bow tie or tie, buttons, tails
   add('chest',rbox(.12,.26,.02,.008),M4(0,.18,.112),lk.shirt);for(const s of[-1,1])add('chest',rbox(.07,.28,.022,.008),M4(s*.075,.17,.115,0,0,s*.32),j===0xf2ece0||j===0xf2efe8||j===0xe8e0d0?0xe4dccc:new THREE.Color(j).multiplyScalar(.75).getHex());
   if(lk.bow){add('chest',rbox(.11,.045,.03,.012),M4(0,.31,.12),lk.bow);add('chest',rbox(.03,.035,.035,.01),M4(0,.31,.125),lk.bow);}
   if(lk.tie)add('chest',rbox(.045,.26,.015,.006),M4(0,.18,.124),lk.tie);for(let i=0;i<2;i++)add('chest',SP(.011,5,4),M4(.0,-.0-i*.07,.118),0x0a0a0a);
   add('hips',rbox(.35,.18,.22,.06),M4(0,.0,0),j);if(lk.pocket)add('chest',rbox(.05,.03,.01,.004),M4(.11,.24,.116),lk.pocket);}
  if(lk.vest){add('chest',rbox(.37*shW,.36,.23,.07),M4(0,.1,0),lk.vest);add('chest',rbox(.1,.14,.02,.008),M4(0,.28,.115),lk.shirt);if(lk.bow)add('chest',rbox(.1,.04,.03,.01),M4(0,.32,.12),lk.bow);if(lk.tie)add('chest',rbox(.04,.18,.015,.006),M4(0,.22,.126),lk.tie);}
  if(lk.chefcoat){for(let i=0;i<3;i++)for(const s of[-1,1])add('chest',SP(.012,5,4),M4(s*.06,.24-i*.09,.112),0xd8d8d0);add('chest',CY(.075,.08,.06,10),M4(0,.32,0),0xf6f6f2);add('hips',rbox(.36,.24,.23,.06),M4(0,-.04,0),0xf2f2ee);}
  if(lk.polo){add('chest',rbox(.39,.3,.26,.06),M4(0,.12,0),lk.vestT);for(let i=-1;i<=1;i++)add('chest',rbox(.08,.1,.04,.01),M4(i*.1,.04,.14),lk.vestT);add('chest',rbox(.05,.04,.02,.008),M4(-.1,.24,.135),0xd8b040);}
  if(lk.overall){add('chest',rbox(.26,.24,.02,.008),M4(0,.1,.112),lk.overall);for(const s of[-1,1])add('chest',rbox(.04,.3,.24,.01),M4(s*.11,.2,0),lk.overall);add('chest',rbox(.3*shW,.14,.2,.05),M4(0,.3,0),lk.shirt);}
  if(lk.apronC)add('hips',rbox(.34,.56,.02,.01),M4(0,-.28,.115),lk.apronC);if(lk.check)for(let i=0;i<0;i++);}
 // ---- arms
 const sleeve=lk.gown?sk:lk.under?sk:(lk.jacket||lk.chefcoat||lk.suitF||(lk.polo?lk.polo:lk.overall?lk.shirt:lk.shirt)||top);const fsleeve=lk.gown||lk.under?sk:(lk.polo?sk:sleeve);
 for(const s of['L','R']){add('arm'+s,cap(F?.045:.054,UA-.06),M4(0,-.03,0),sleeve);if(!lk.gown&&!lk.under)add('arm'+s,SP(F?.075:.085,10,8),M4(0,0,0),sleeve);
  add('fore'+s,cap(F?.038:.046,LA-.06),M4(0,-.03,0),fsleeve);if(!lk.gown&&!lk.under&&!lk.polo)add('fore'+s,CY(.048,.048,.035,10),M4(0,-LA+.02,0),lk.shirt||0xf0f0f0);
  add('hand'+s,rbox(F?.055:.065,.09,.035,.015),M4(0,-.05,0),sk);add('hand'+s,rbox(.022,.05,.022,.008),M4(s==='L'?.03:-.03,-.03,.022,.4,0,0),sk);
  // legs
  if(!lk.gown){const leg=lk.under?sk:(lk.overall||lk.pants||0x222222);add('thigh'+s,cap(.074,TH-.08),M4(0,-.04,0),lk.under?0xd8dce8:leg);if(lk.under)add('thigh'+s,cap(.066,TH-.24),M4(0,-.2,0),sk);add('shin'+s,cap(.058,SH-.06),M4(0,-.03,0),leg);if(lk.check)add('shin'+s,cap(.0585,SH-.2),M4(0,-.12,0),0x3a3a3a);}
  add('foot'+s,rbox(F?.075:.095,.075,F?.2:.25,.03),M4(0,-.035,.04),lk.shoes||0x111111);if(F&&!lk.gown)add('shin'+s,cap(.05,SH-.06),M4(0,-.03,0),sk);}
 // ---- head
 add('neck',CY(.045,.05,.11,8),M4(0,.02,0),sk);add('head',SP(.1,14,12),M4(0,.1,.012,0,0,0,F?.94:1,1.1,1.04),sk);add('head',rbox(.026,.045,.03,.01),M4(0,.085,.112),sk);// nose
 for(const s of[-1,1]){add('head',SP(.016,6,5),M4(s*.038,.115,.093),0xf4f0ea);add('head',SP(.009,6,5),M4(s*.038,.115,.104),0x1a1410);add('head',rbox(.04,.009,.012,.003),M4(s*.04,.142,.1,0,0,-s*.12),lk.hair===0xc0c0bc?0x9a9a98:new THREE.Color(lk.hair).multiplyScalar(.8).getHex());add('head',SP(.02,6,5),M4(s*.098,.1,.01,0,0,0,.6,1,1),sk);}
 add('head',rbox(.042,.01,.01,.004),M4(0,.048,.103),F?0x9a3a3a:0x8a5a4a);
 const hc=lk.hair,HS=lk.hairS;
 if(HS==='short'||HS==='crop'){add('head',SP(.106,14,8,0,PI*2,0,PI*.48),M4(0,.12,-.005,0,0,0,1,HS==='crop'?.82:.95,1.05),hc);}
 else if(HS==='slick'){add('head',SP(.107,14,8,0,PI*2,0,PI*.5),M4(0,.12,-.01,-.15,0,0,1,1,1.06),hc);add('head',SP(.05,8,6),M4(0,.19,.03,0,0,0,1.4,.5,1.2),hc);}
 else if(HS==='wavy'){add('head',SP(.112,14,8,0,PI*2,0,PI*.52),M4(0,.12,-.005,0,0,0,1.02,1,1.06),hc);for(const s of[-1,1])add('head',SP(.04,6,5),M4(s*.07,.18,.04),hc);}
 else if(HS==='bald'){add('head',SP(.104,14,8,0,PI*2,PI*.25,PI*.25),M4(0,.12,-.005,0,0,0,1,1,1.06),hc);}
 else if(HS==='bob'){add('head',SP(.118,14,10,0,PI*2,0,PI*.62),M4(0,.11,-.01,0,0,0,1.02,1.05,1.05),hc);add('head',rbox(.2,.06,.04,.015),M4(0,.18,.085,-.3,0,0),hc);}
 else if(HS==='updo'){add('head',SP(.11,14,8,0,PI*2,0,PI*.52),M4(0,.12,-.008,0,0,0,1,1,1.06),hc);add('head',SP(.055,10,8),M4(0,.21,-.07),hc);}
 else if(HS==='long'){add('head',SP(.114,14,10,0,PI*2,0,PI*.6),M4(0,.11,-.01,0,0,0,1.02,1.05,1.07),hc);add('head',rbox(.2,.32,.07,.03),M4(0,-.02,-.08),hc);}
 if(lk.beard)add('head',SP(.096,12,8,0,PI*2,PI*.58,PI*.34),M4(0,.1,.02,0,0,0,1,1.08,1.05),lk.beard);
 if(lk.stubble)add('head',SP(.1005,12,8,PI*.15,PI*.7,PI*.6,PI*.3),M4(0,.1,.012,0,0,0,1,1.1,1.04),0x8a6a5a);
 if(lk.hat==='toque'){add('head',CY(.105,.1,.08,14),M4(0,.19,0),0xf8f8f4);add('head',SP(.13,12,8),M4(0,.27,0,0,0,0,1,.8,1),0xf8f8f4);}
 if(lk.hat==='cap'){add('head',SP(.113,14,8,0,PI*2,0,PI*.5),M4(0,.13,0),lk.hatC);add('head',rbox(.13,.012,.09,.005),M4(0,.135,.11,.15,0,0),lk.hatC);}
 if(lk.ear){add('head',SP(.014,6,5),M4(-.1,.1,.02),0x111111);add('head',CY(.003,.003,.12,3),M4(-.095,.03,.0,.3,0,0),0x2a2a2a);}
 if(lk.glasses){for(const s of[-1,1])add('head',new THREE.TorusGeometry(.024,.004,4,10),M4(s*.04,.115,.108),0x1a1a1a);add('head',rbox(.03,.004,.004,.001),M4(0,.118,.11),0x1a1a1a);}
 return parts;}
function assemble(parts){const P=[],N=[],U=[],C=[],SI=[],SW=[];const nm=new THREE.Matrix3(),v=new V(),bind=new THREE.Matrix4();
 for(const pt of parts){const g=pt.geo.index?pt.geo.toNonIndexed():pt.geo,p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;bind.makeTranslation(BW[pt.b].x,BW[pt.b].y,BW[pt.b].z).multiply(pt.m);nm.getNormalMatrix(bind);
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(bind);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);U.push(u?u.getX(i)*2:0,u?u.getY(i)*2:0);C.push(pt.col.r,pt.col.g,pt.col.b);SI.push(pt.b,0,0,0);SW.push(1,0,0,0);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
 g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));return g;}
const GEO=new Map();function bodyGeo(lk){const k=JSON.stringify(lk);if(!GEO.has(k))GEO.set(k,assemble(buildBody(lk)));return GEO.get(k);}

/* ---------- props (plain meshes parented to bones) */
let PM=null;function propMats(){if(PM)return PM;PM={glass:new THREE.MeshStandardMaterial({color:0xe8f0f0,roughness:.05,metalness:.3,transparent:true,opacity:.55}),fizz:new THREE.MeshStandardMaterial({color:0xf0d890,roughness:.2,emissive:0x302010}),
 dark:new THREE.MeshStandardMaterial({color:0x1a1a1c,roughness:.4,metalness:.6}),silver:new THREE.MeshStandardMaterial({color:0xd8dce0,roughness:.2,metalness:.9}),paper:new THREE.MeshStandardMaterial({color:0xf0ece0,roughness:.9}),
 wood:new THREE.MeshStandardMaterial({color:0x8a3a14,roughness:.4}),ember:new THREE.MeshBasicMaterial({color:new THREE.Color(4,1.2,.3)}),white:new THREE.MeshStandardMaterial({color:0xf4f4f0,roughness:.8}),
 amber:new THREE.MeshStandardMaterial({color:0xc87a20,roughness:.1,transparent:true,opacity:.85})};return PM;}
function makeProp(kind){const m=propMats(),g=new THREE.Group();const add=(geo,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o);return o;};
 if(kind==='glass'){add(CY(.022,.012,.12,8),m.glass,0,.1,0);add(CY(.019,.012,.08,8),m.fizz,0,.09,0);add(CY(.003,.003,.08,4),m.glass,0,.0,0);add(CY(.025,.025,.004,8),m.glass,0,-.04,0);g.position.set(0,-.08,.04);}
 else if(kind==='whisky'){add(CY(.03,.028,.07,8),m.glass,0,0,0);add(CY(.026,.024,.03,8),m.amber,0,-.015,0);g.position.set(0,-.08,.04);}
 else if(kind==='tray'){add(CY(.2,.2,.012,18),m.silver,0,0,0);for(let i=0;i<4;i++){add(CY(.02,.012,.12,8),m.glass,Math.cos(i*1.6)*.11,.08,Math.sin(i*1.6)*.11);add(CY(.017,.012,.07,8),m.fizz,Math.cos(i*1.6)*.11,.065,Math.sin(i*1.6)*.11);}g.position.set(0,-.07,.02);}
 else if(kind==='clip'){add(new THREE.BoxGeometry(.2,.28,.012),m.wood,0,0,0);add(new THREE.BoxGeometry(.18,.24,.004),m.paper,0,-.01,.008);g.position.set(0,-.1,.03);g.rotation.set(-.3,0,.2);}
 else if(kind==='cig'){add(CY(.004,.004,.07,4),m.white,0,0,0,0,0,PI/2);add(SP(.005,4,3),m.ember,-.036,0,0);g.position.set(0,-.08,.03);}
 else if(kind==='violin'){add(new THREE.SphereGeometry(.12,10,8),m.wood,0,0,0).scale.set(.75,1.4,.32);add(new THREE.BoxGeometry(.03,.28,.02),m.dark,0,.26,0);g.position.set(.08,.1,.12);g.rotation.set(-1.2,.2,1.3);}
 else if(kind==='pistol'){add(new THREE.BoxGeometry(.035,.05,.2),m.dark,0,0,.05);add(new THREE.BoxGeometry(.03,.1,.04),m.dark,0,-.06,-.02,-.25,0,0);add(CY(.016,.016,.16,8),m.dark,0,.005,.23,PI/2,0,0);g.position.set(0,-.08,.02);g.rotation.set(-PI/2,0,0);}
 else if(kind==='wire'){add(new THREE.TorusGeometry(.04,.004,4,10),m.silver,0,0,0);g.position.set(0,-.08,.03);}
 else if(kind==='coin'){add(CY(.012,.012,.003,10),new THREE.MeshStandardMaterial({color:0xd8b048,metalness:.9,roughness:.25}),0,0,0,PI/2,0,0);g.position.set(0,-.08,.03);}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}

/* ---------- the rig */
const tE=new THREE.Euler(),tq=new THREE.Quaternion();
export class Rig{
 constructor(lk,cloth){this.root=new THREE.Group();this.cloth=cloth;this.mat=dynMat({vertexColors:true,roughness:.62,metalness:.02,map:cloth||null},'scchar');
  const bones=BONES.map(b=>{const o=new THREE.Bone();o.name=b[0];o.position.set(b[2],b[3],b[4]);return o;});BONES.forEach((b,i)=>{if(b[1]>=0)bones[b[1]].add(bones[i]);});this.bones=bones;this.b={};for(const o of bones)this.b[o.name]=o;
  this.mesh=new THREE.SkinnedMesh(bodyGeo(lk),this.mat);this.mesh.add(bones[0]);this.mesh.castShadow=true;this.mesh.receiveShadow=true;this.root.add(this.mesh);this.mesh.updateMatrixWorld(true);this.mesh.bind(new THREE.Skeleton(bones));
  this.mesh.frustumCulled=false;this.lk=lk;this.props={};this.phase=Math.random()*6;this.t=Math.random()*20;this.hy=.95;this.cur={};this.lie=0;this.fallV=0;this.ghost=null;this.scale=lk.female?.95:1;this.root.scale.setScalar(this.scale);
  this.setProp(lk.prop||null);}
 setLook(lk){this.lk=lk;this.mesh.geometry=bodyGeo(lk);this.scale=lk.female?.95:1;this.root.scale.setScalar(this.scale);this.setProp(lk.prop||null);if(this.ghost)this.ghost.geometry=this.mesh.geometry;}
 setProp(kind,hand='R'){for(const k in this.props){this.props[k].parent?.remove(this.props[k]);}this.props={};if(!kind)return;const p=makeProp(kind);this.b[kind==='tray'||kind==='clip'||kind==='violin'?'handL':'hand'+hand].add(p);this.props[kind]=p;this.propKind=kind;}
 // x-ray silhouette for instinct vision (shares the skeleton)
 makeGhost(mat){if(this.ghost){this.ghost.material=mat;return this.ghost;}const g=new THREE.SkinnedMesh(this.mesh.geometry,mat);g.bind(this.mesh.skeleton,this.mesh.bindMatrix);g.frustumCulled=false;g.renderOrder=20;this.mesh.add(g);this.ghost=g;return g;}
 light(sun,amb,sky){this.mat.userData.sun.value=sun;this.mat.userData.amb.value.setRGB(amb[0],amb[1],amb[2]);this.mat.userData.sky.value=sky;}
 // st: {spd, mode, act, aim(0..1), pitch, crouch, t (act time), lie(0..1), lieFace(1 back/-1 front)}
 pose(dt,st){const B=this.b,k=Math.min(1,dt*10);this.t+=dt;const t=this.t;const spd=st.spd||0,moving=spd>.2,run=spd>3.4,cr=st.crouch?1:0,act=st.act||'idle';
  const R=(n,x,y=0,z=0,kk=k)=>{const c=this.cur[n]||(this.cur[n]=[0,0,0]);c[0]+=(x-c[0])*kk;c[1]+=(y-c[1])*kk;c[2]+=(z-c[2])*kk;B[n].rotation.set(c[0],c[1],c[2]);};
  // ---- lying (KO / dead / dragged): body pivots onto the floor
  const lieT=st.lie?1:0;this.lie+=(lieT-this.lie)*Math.min(1,dt*(st.lie?5:3));const L=this.lie;
  if(L>.02){const face=st.lieFace||1;this.mesh.rotation.x=-PI/2*L*face;this.mesh.position.set(0,.16*L,0);
   const drag=act==='dragged';B.hips.position.y=.95;R('hips',0,0,0);R('spine',0,0,0);R('chest',0,0,0);R('neck',drag?.3:-.1*face,drag?0:.6,0);R('head',0,0,0);
   if(drag){R('armL',PI*.92,0,-.15);R('armR',PI*.92,0,.15);R('foreL',-.1,0,0);R('foreR',-.1,0,0);}else{R('armL',.2,0,.5+Math.sin(this.phase)*.2);R('armR',-.1,0,-.7);R('foreL',-.5,0,0);R('foreR',-.2,0,0);}
   R('thighL',.1,0,.12);R('thighR',-.2,0,-.08);R('shinL',.15,0,0);R('shinR',.5,0,0);R('footL',-.4,0,0);R('footR',-.3,0,0);R('handL',0,0,0);R('handR',0,0,0);return;}
  this.mesh.rotation.x=0;this.mesh.position.set(0,0,0);
  // ---- locomotion
  const rate=run?PI*spd/1.9:PI*spd/(cr?1.1:1.35);if(moving)this.phase+=dt*rate;const ph=this.phase,amp=moving?Math.min(1,spd/(run?5:2.4))*(run?1:.75):0;
  let hy=.95-cr*.3-(moving?Math.abs(Math.sin(ph))*.035*amp:Math.sin(t*1.7)*.003);if(act==='cower')hy=.5;if(act==='lean')hy=.93;this.hy+=(hy-this.hy)*k;B.hips.position.y=this.hy;
  R('hips',0,Math.sin(ph)*.1*amp,Math.sin(ph)*.035*amp);
  const lean=(run?.22:moving?.04:0)+cr*.35+(act==='lean'?.75:0)+(act==='cower'?.6:0)+(act==='fix'?.12:0);
  R('spine',lean*.6,-Math.sin(ph)*.08*amp,0);R('chest',lean*.4-(st.pitch||0)*.3*(st.aim||0),-Math.sin(ph)*.05*amp+(st.aim?.25:0),0);
  // legs
  for(const[s,o]of[['L',0],['R',PI]]){const p=ph+o;let th=-Math.sin(p)*amp*(run?.9:.6),kn=Math.max(0,Math.sin(p+1.3))*amp*(run?1.6:1.1)+.04,ft=moving?Math.min(0,Math.sin(p+.4))*.3*amp:0;
   if(!moving){th=s==='L'?-.04:.06;kn=.05;}if(cr){th-=.75;kn+=1.25;ft-=.4;}
   if(act==='cower'){th=-1.5;kn=2.4;ft=-.7;}if(act==='lean'){th=-.4;kn=.12;}if(act==='kneel'){th=s==='L'?-1.4:-.1;kn=s==='L'?1.4:1.9;ft=s==='L'?0:-.3;}
   R('thigh'+s,th,0,s==='L'?.03:-.03);R('shin'+s,kn,0,0);R('foot'+s,ft,0,0);}
  // arms: default swing, then act overrides
  let aL=[Math.sin(ph)*.45*amp+.05,0,.08],aR=[-Math.sin(ph)*.45*amp+.05,0,-.08],fL=[-.15-.4*amp*(run?1.4:1),0,0],fR=[-.15-.4*amp*(run?1.4:1),0,0],hd=[0,Math.sin(t*.4)*.18,0],hL=[0,0,0],hR=[0,0,0];
  const gest=(s,f)=>Math.sin(t*f+s)*.5+.5;
  switch(act){
   case 'talk':aR=[-.35-gest(0,1.7)*.5,.2,-.15];fR=[-.9-gest(1,2.3)*.6,0,0];aL=[.05,0,.1];hd=[Math.sin(t*1.3)*.08,Math.sin(t*.7)*.3,0];break;
   case 'drink':{const sip=Math.max(0,Math.sin(t*.5))**6;aR=[-.5-sip*.6,.15,-.15];fR=[-1.7-sip*.4,0,0];hR=[-.2+sip*.4,0,0];hd=[-sip*.3,Math.sin(t*.6)*.25,0];break;}
   case 'tray':aL=[-.35,0,.12];fL=[-1.45,0,0];hL=[0,0,PI/2*0];break;
   case 'clip':aL=[-.4,0,.15];fL=[-1.3,.3,0];aR=[-.2,0,-.1];fR=[-.9,0,0];hd=[.25,0,0];break;
   case 'applaud':{const c=Math.sin(t*14);aL=[-.7,-.35,.15];aR=[-.7,.35,-.15];fL=[-1.3,0,-.4+c*.15];fR=[-1.3,0,.4-c*.15];break;}
   case 'speech':aR=[-1.6-gest(0,1.1)*.4,.2,-.25];fR=[-.5,0,0];aL=[-.4-gest(2,.9)*.6,-.2,.2];fL=[-1-gest(3,1.4)*.4,0,0];hd=[-.1,Math.sin(t*.5)*.4,0];break;
   case 'lean':aL=[-1.25,0,.25];aR=[-1.25,0,-.25];fL=[-.6,0,0];fR=[-.6,0,0];hd=[-.3,Math.sin(t*.3)*.3,0];break;
   case 'smoke':{const p=Math.max(0,Math.sin(t*.45))**4;aR=[-.4-p*.5,.2,-.2];fR=[-1.2-p*1,0,0];aL=[-.2,.3,.25];fL=[-1.5,0,0];hd=[p*-.1,.3,0];break;}
   case 'play':{const bow=Math.sin(t*3.2);aL=[-1.1,-.6,.35];fL=[-1.4,0,0];aR=[-.6+bow*.25,.6,-.5];fR=[-1.3+bow*.4,0,0];hd=[.15,.35,-.25];break;}
   case 'cower':aL=[-2.4,0,.4];aR=[-2.4,0,-.4];fL=[-2,0,0];fR=[-2,0,0];hd=[.5,0,0];break;
   case 'flee':aL=[-1.9+Math.sin(ph)*.3,0,.4];aR=[-1.9-Math.sin(ph)*.3,0,-.4];fL=[-1.6,0,0];fR=[-1.6,0,0];break;
   case 'fix':aL=[-1.5,0,.15];aR=[-1.7+Math.sin(t*5)*.15,0,-.15];fL=[-.6,0,0];fR=[-.5+Math.sin(t*6)*.2,0,0];hd=[0,0,0];break;
   case 'use':aL=[-1.2,0,.15];aR=[-1.3,0,-.15];fL=[-.6,0,0];fR=[-.6,0,0];hd=[.25,0,0];break;
   case 'look':hd=[0,Math.sin(t*1.2)*.9,0];aR=[-.2,0,-.1];break;
   case 'choke':aL=[-1.3,-.6,.3];aR=[-1.5,.5,-.3];fL=[-1.8,0,0];fR=[-1.5,0,0];hd=[.2,0,0];break;
   case 'victim':aL=[-1.6,.3,.5];aR=[-1.6,-.3,-.5];fL=[-1.6,0,0];fR=[-1.6,0,0];hd=[-.5,Math.sin(t*20)*.1,0];break;
   case 'clutch':aL=[-.9,-.4,.3];aR=[-.9,.4,-.3];fL=[-2.1,0,0];fR=[-2.1,0,0];hd=[-.35,Math.sin(t*9)*.15,0];break;
   case 'flail':{const f=t*14;aL=[-2.5+Math.sin(f)*.6,0,.8];aR=[-2.5+Math.cos(f)*.6,0,-.8];fL=[-.5,0,0];fR=[-.5,0,0];break;}
   case 'drag':aL=[-.9,0,.2];aR=[-.9,0,-.2];fL=[-.3,0,0];fR=[-.3,0,0];break;
   case 'throw':{const p=cl(st.t*3,0,1);aR=[-2.6+p*2.2,.2,-.2];fR=[-.6+p*.4,0,0];break;}
   case 'search':aR=[-.6,.1,-.1];fR=[-.6,0,0];hd=[0,Math.sin(t*1.4)*.9,0];break;
   case 'kneel':aL=[-.6,0,.2];aR=[-.7,0,-.2];fL=[-.8,0,0];fR=[-.8,0,0];hd=[.5,0,0];break;}
  if(st.aim>.05){const a=st.aim,p=st.pitch||0;aR=[-PI/2-p+.05,.25,-.05].map((v,i)=>v*a+aR[i]*(1-a));fR=[-.05,0,0].map((v,i)=>v*a+fR[i]*(1-a));aL=[-PI/2-p+.2,-.5,.2].map((v,i)=>v*a+aL[i]*(1-a));fL=[-.6,0,0].map((v,i)=>v*a+fL[i]*(1-a));hd=[p*.6,0,0];}
  R('armL',...aL);R('armR',...aR);R('foreL',...fL);R('foreR',...fR);R('handL',...hL);R('handR',...hR);R('neck',hd[0]*.4,hd[1]*.5,hd[2]);R('head',hd[0]*.6,hd[1]*.5,hd[2]);}
}
export {makeProp};
