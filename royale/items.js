// STORM ROYALE — weapons, consumables, rarities, loot tables and the low-poly item models (held + floor loot + chests).
import * as THREE from '../vendor/three.module.min.js';
import {V,M,merge,wpick} from './util.js';

export const RAR=[{n:'COMMON',c:'#b9c2cc',h:0xb9c2cc},{n:'UNCOMMON',c:'#5ad86a',h:0x48d860},{n:'RARE',c:'#3ea8ff',h:0x2e98ff},{n:'EPIC',c:'#c266ff',h:0xb44cff},{n:'LEGENDARY',c:'#ffb12e',h:0xffa418}];
// dmg per rarity; rate shots/s; spread radians (hip, aimed); range m (falloff start, max)
export const GUNS={
 ar:{n:'ASSAULT RIFLE',s:'AR',dmg:[30,31,33,35,37],rate:5.5,mag:30,reload:2.2,ammo:'medium',spread:[.024,.007],move:.035,range:[60,220],auto:true,head:1.5,bdmg:1,rars:[0,1,2,3,4],zoom:1.35},
 smg:{n:'RAPID SMG',s:'SMG',dmg:[17,18,19,20,21],rate:11,mag:30,reload:2,ammo:'light',spread:[.05,.03],move:.03,range:[22,100],auto:true,head:1.75,bdmg:1,rars:[0,1,2,3],zoom:1.2},
 sg:{n:'PUMP SHOTGUN',s:'SG',dmg:[9,9.5,10,10.5,11],pellets:10,rate:1.05,mag:5,reload:3.8,ammo:'shells',spread:[.085,.07],move:.01,range:[10,40],auto:false,head:2,bdmg:.6,rars:[0,1,2,3,4],zoom:1.15},
 sn:{n:'BOLT SNIPER',s:'SNP',dmg:[95,100,105,112,120],rate:.45,mag:1,reload:2.4,ammo:'heavy',spread:[.06,.0015],move:.08,range:[300,600],auto:false,head:2.5,bdmg:1,rars:[2,3,4],zoom:4.5,scope:true},
 rl:{n:'ROCKET LAUNCHER',s:'RKT',dmg:[85,90,95,100,105],rate:.65,mag:1,reload:3,ammo:'rockets',spread:[.012,.004],move:.02,range:[400,400],auto:false,head:1,bdmg:4,rars:[2,3,4],proj:70,blast:5.5,zoom:1.3}};
export const HEALS={
 shield:{n:'SHIELD POTION',time:4.2,sh:50,cap:100,max:3,c:'#4aa8ff'},
 mini:{n:'MINI SHIELD',time:1.6,sh:25,cap:50,max:6,c:'#7cc8ff'},
 med:{n:'MEDKIT',time:7,hp:100,cap:100,max:3,c:'#ff5a5a'},
 band:{n:'BANDAGES',time:3.2,hp:15,cap:75,max:15,c:'#ffd0a0'}};
export const AMMO={light:{n:'LIGHT',give:30,max:500,c:'#e0d080'},medium:{n:'MEDIUM',give:30,max:500,c:'#80d0e0'},heavy:{n:'HEAVY',give:6,max:60,c:'#9090e0'},shells:{n:'SHELLS',give:8,max:60,c:'#e09060'},rockets:{n:'ROCKETS',give:2,max:12,c:'#e06060'}};
export const HEAL_RAR={band:0,mini:1,shield:2,med:1};

export function makeGun(t,r){return{kind:'gun',t,r,mag:GUNS[t].mag};}
export function makeHeal(t,n=1){return{kind:'heal',t,n};}
export function itemName(it){return it.kind==='gun'?RAR[it.r].n+' '+GUNS[it.t].n:it.kind==='heal'?HEALS[it.t].n+(it.n>1?' ×'+it.n:''):it.kind==='ammo'?AMMO[it.t].n+' AMMO ×'+it.n:it.kind==='mats'?['WOOD','STONE','METAL'][it.t]+' ×'+it.n:'';}
export function itemRar(it){return it.kind==='gun'?it.r:it.kind==='heal'?HEAL_RAR[it.t]:0;}
// value used by bots (and auto-swap) to rank guns
export function gunValue(it){if(!it||it.kind!=='gun')return 0;return{ar:10,sg:9,smg:8,sn:7,rl:6}[it.t]+it.r*2.2;}

const RW={floor:[46,30,16,6,2],chest:[16,34,30,15,5]};
export function rollGun(src,r=Math.random){for(let n=0;n<20;n++){const t=wpick(src==='chest'?{ar:30,sg:28,smg:22,sn:12,rl:8}:{ar:34,sg:28,smg:28,sn:7,rl:3},r);let rar=+wpick(Object.assign({},RW[src]),r);const rs=GUNS[t].rars;if(!rs.includes(rar))rar=rar<rs[0]?rs[0]:rs[rs.length-1];return makeGun(t,rar);}}
export function rollHeal(r=Math.random){const t=wpick({band:28,mini:30,shield:22,med:20},r);return makeHeal(t,t==='band'?5:t==='mini'?3:1);}
export function rollAmmo(r=Math.random,t){t=t||wpick({light:26,medium:30,shells:24,heavy:12,rockets:8},r);return{kind:'ammo',t,n:AMMO[t].give};}
export function ammoFor(it){return it&&it.kind==='gun'?{kind:'ammo',t:GUNS[it.t].ammo,n:AMMO[GUNS[it.t].ammo].give}:null;}

/* ---------------- models ---------------- */
const B=(w,h,d,x,y,z,c,rx=0,ry=0,rz=0)=>[new THREE.BoxGeometry(w,h,d),M(x,y,z,rx,ry,rz),c];
const C=(r0,r1,h,x,y,z,c,rx=Math.PI/2,seg=8)=>[new THREE.CylinderGeometry(r0,r1,h,seg),M(x,y,z,rx,0,0),c];
const gunGeo={};
// guns point along +z, grip at origin
function gunParts(t,acc){const k=0x2a2d33,g=0x3c4048,w=0x7a5232;
 switch(t){
  case'ar':return[B(.09,.13,.62,0,.05,.12,k),C(.022,.022,.36,0,.07,.6,g),B(.07,.16,.08,0,-.07,.02,g,.2),B(.06,.18,.09,0,-.06,.24,acc,-.25),B(.08,.12,.26,0,.02,-.28,k),B(.05,.05,.16,0,.15,.1,g),B(.092,.03,.3,0,.09,.2,acc),B(.03,.06,.03,0,.14,.48,g)];
  case'smg':return[B(.085,.12,.42,0,.05,.08,k),C(.02,.02,.16,0,.07,.36,g),B(.06,.15,.07,0,-.07,.0,g,.15),B(.05,.24,.06,0,-.12,.18,acc),B(.03,.06,.22,0,.03,-.22,g),B(.087,.025,.2,0,.12,.1,acc)];
  case'sg':return[B(.09,.12,.5,0,.05,.06,k),C(.032,.032,.5,0,.09,.52,g),C(.03,.03,.36,0,.02,.44,w),B(.07,.15,.08,0,-.07,.0,w,.25),B(.09,.11,.3,0,.0,-.3,w,.1),B(.092,.03,.18,0,.11,.1,acc)];
  case'sn':return[B(.08,.11,.62,0,.05,.08,w),C(.022,.022,.6,0,.08,.66,k),C(.045,.045,.34,0,.19,.12,k),C(.055,.04,.06,0,.19,.32,acc),B(.06,.14,.07,0,-.06,.0,k,.2),B(.09,.14,.34,0,0,-.36,w),B(.09,.03,.2,0,.12,.2,acc)];
  case'rl':return[C(.11,.11,1.1,0,.13,.15,0x4a5a3a,Math.PI/2,10),C(.13,.11,.16,0,.13,.72,acc,Math.PI/2,10),C(.12,.14,.14,0,.13,-.42,k,Math.PI/2,10),B(.06,.16,.08,0,-.03,.05,k,.2),B(.05,.08,.18,0,.28,.15,k),B(.12,.03,.3,0,.25,.0,acc)];}}
export function gunMesh(t,r,mat){const key=t+r;if(!gunGeo[key])gunGeo[key]=merge(gunParts(t,RAR[r].h));const m=new THREE.Mesh(gunGeo[key],mat);m.castShadow=true;return m;}
export const MUZZLE={ar:.8,smg:.48,sg:.78,sn:.98,rl:.8};
let pickGeo=null;
export function pickaxeMesh(mat){if(!pickGeo)pickGeo=merge([[new THREE.CylinderGeometry(.03,.035,.95,6),M(0,.35,0),0x7a5232],B(.06,.08,.62,0,.8,0,0x9aa6b4,0,0,0),B(.07,.1,.1,0,.8,.33,0xffb12e),B(.07,.1,.1,0,.8,-.33,0xffb12e),B(.08,.12,.12,0,-.1,0,0x333333)]);const m=new THREE.Mesh(pickGeo,mat);m.castShadow=true;return m;}
let healGeo={};
export function healMesh(t,mat){if(!healGeo[t]){const c=new THREE.Color(HEALS[t].c).getHex();healGeo[t]=t==='med'?merge([B(.42,.3,.2,0,.15,0,0xf2f2f2),B(.14,.04,.21,0,.18,0,c),B(.04,.14,.21,0,.18,0,c),B(.12,.04,.04,0,.32,0,0x666666)]):
  t==='band'?merge([C(.1,.1,.18,0,.1,0,0xfff0e0,0,10),C(.04,.04,.19,0,.1,0,c,0,8)]):merge([C(t==='mini'?.07:.11,t==='mini'?.07:.11,t==='mini'?.16:.22,0,t==='mini'?.08:.11,0,c,0,10),C(.03,.04,.1,0,t==='mini'?.2:.27,0,0xe8f4ff,0,8)]);}return new THREE.Mesh(healGeo[t],mat);}
let ammoGeo=null;export function ammoMesh(t,mat){if(!ammoGeo)ammoGeo=merge([B(.42,.24,.28,0,.12,0,0x5a7040),B(.44,.04,.3,0,.25,0,0x3a4a2a),B(.12,.06,.02,0,.14,.15,0xe0d080)]);return new THREE.Mesh(ammoGeo,mat);}
let matGeo=null;export function matsMesh(t,mat){if(!matGeo)matGeo=[merge([B(.5,.12,.2,0,.06,0,0xb27a44),B(.5,.12,.2,0,.18,.0,0xa06a38,0,.4)]),merge([[new THREE.IcosahedronGeometry(.22,0),M(0,.18,0),0x9a9ea6]]),merge([B(.4,.08,.4,0,.04,0,0x9aa6b4),B(.4,.08,.4,0,.13,0,0x8a96a4,0,.3)])];return new THREE.Mesh(matGeo[t],mat);}
let chestGeo=null,lidGeo=null;
export function chestMesh(mat){if(!chestGeo){chestGeo=merge([B(1.1,.55,.7,0,.28,0,0x8a5a2e),B(1.14,.08,.74,0,.06,0,0xffc040),B(1.14,.08,.74,0,.5,0,0xffc040),B(.08,.56,.74,-.53,.28,0,0xffc040),B(.08,.56,.74,.53,.28,0,0xffc040)]);
  lidGeo=merge([B(1.1,.26,.7,0,.13,-.35,0x9a6a36),B(1.14,.06,.74,0,.24,-.35,0xffc040),B(.16,.18,.06,0,.06,.02,0xfff0a0)]);}
 const g=new THREE.Group();const b=new THREE.Mesh(chestGeo,mat),l=new THREE.Mesh(lidGeo,mat);l.position.set(0,.55,.35);b.castShadow=l.castShadow=true;g.add(b,l);g.userData.lid=l;return g;}
export function itemMesh(it,mat){if(it.kind==='gun'){const m=gunMesh(it.t,it.r,mat);m.scale.setScalar(1.25);return m;}if(it.kind==='heal')return healMesh(it.t,mat);if(it.kind==='ammo')return ammoMesh(it.t,mat);if(it.kind==='mats')return matsMesh(it.t,mat);}
