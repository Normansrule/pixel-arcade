// IRON VANGUARD (adapted from FRONTLINE OPS) — weapon stats, recoil patterns, attachments and the first-person viewmodel
// (extruded-profile rifles with moving parts, gloved hands and sleeves, ejected brass).
import * as THREE from '../vendor/three.module.min.js';
import {merge,prof} from './util.js';
const V=THREE.Vector3,PI=Math.PI,cl=(v,a,b)=>v<a?a:v>b?b:v;
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));

// dmg [near, far] over range [start falloff, end falloff] (m); spread in degrees; recoil [vertical, horizontal] degrees per shot
export const WEAPONS={
 ar:{id:'ar',name:'HAVOC-4',cls:'ASSAULT RIFLE',dmg:[30,22],range:[40,95],rpm:740,auto:1,mag:30,res:150,reload:2.0,reloadE:2.6,ads:.22,adsZoom:1.45,hip:3.0,adsSpr:.06,move:2.6,recoil:[.62,.24],kick:1,speed:1,sway:.22,head:1.5,att:['reddot','grip','supp','ext'],snd:{f:1700,b:95,len:.16}},
 smg:{id:'smg',name:'WASP-9',cls:'PDW',dmg:[25,15],range:[16,45],rpm:900,auto:1,mag:32,res:192,reload:1.7,reloadE:2.15,ads:.17,adsZoom:1.3,hip:2.2,adsSpr:.14,move:1.4,recoil:[.44,.3],kick:.8,speed:1.08,sway:.18,head:1.4,att:['reddot','grip','supp','ext'],snd:{f:2300,b:120,len:.11}},
 lmg:{id:'lmg',name:'MAULER-60',cls:'LIGHT MACHINE GUN',dmg:[33,25],range:[35,75],rpm:640,auto:1,mag:60,res:180,reload:3.9,reloadE:4.5,ads:.32,adsZoom:1.4,hip:4.2,adsSpr:.1,move:3.2,recoil:[.55,.34],kick:1.15,speed:.9,sway:.32,head:1.4,att:['reddot','grip','supp','ext'],snd:{f:1300,b:80,len:.2}},
 sniper:{id:'sniper',name:'LONGBOW .338',cls:'SNIPER RIFLE',dmg:[105,92],range:[100,260],rpm:52,auto:0,bolt:1,mag:5,res:30,reload:2.7,reloadE:3.2,ads:.36,adsZoom:4.5,hip:7.5,adsSpr:0,move:6,recoil:[3.4,.7],kick:2.6,speed:.93,sway:1.1,head:3,scope:1,att:['grip','supp','ext'],snd:{f:900,b:60,len:.42}},
 shotgun:{id:'shotgun',name:'BREACHER-12',cls:'SHOTGUN',dmg:[17,4],range:[9,26],rpm:78,auto:0,pump:1,pellets:9,mag:7,res:35,reload:.5,shell:1,ads:.2,adsZoom:1.2,hip:4.6,adsSpr:3.4,move:1,recoil:[2.8,.9],kick:2.2,speed:.98,sway:.2,head:1.3,att:['reddot','grip','ext'],snd:{f:1100,b:70,len:.3}},
 rpg:{id:'rpg',name:'HAMMER RPG',cls:'ROCKET LAUNCHER',dmg:[0,0],range:[0,1],rpm:40,auto:0,proj:1,mag:1,res:4,reload:2.8,reloadE:2.8,ads:.32,adsZoom:1.5,hip:2.5,adsSpr:.3,move:2,recoil:[4,.6],kick:2.6,speed:.9,sway:.5,head:1,att:[],snd:{f:700,b:60,len:.5}},
 tool:{id:'tool',name:'REPAIR TORCH',cls:'REPAIR TOOL',dmg:[0,0],range:[0,1],rpm:600,auto:1,tool:1,mag:100,res:0,reload:1,reloadE:1,ads:.2,adsZoom:1,hip:1,adsSpr:1,move:1,recoil:[0,0],kick:0,speed:1,sway:.1,head:1,att:[],snd:{f:3000,b:200,len:.05}},
 pistol:{id:'pistol',name:'P-11',cls:'PISTOL',dmg:[34,21],range:[12,30],rpm:420,auto:0,mag:12,res:72,reload:1.45,reloadE:1.8,ads:.15,adsZoom:1.25,hip:2.2,adsSpr:.35,move:1.2,recoil:[1.3,.45],kick:1.4,speed:1.1,sway:.15,head:1.6,att:['supp'],snd:{f:2000,b:110,len:.13}}};
export const PRIMARIES=['ar','smg','lmg','sniper','shotgun'];
export const ATT={reddot:{name:'RED DOT',rank:1,desc:'Reflex optic. Clean sight picture, tighter ADS zoom.'},grip:{name:'VERTICAL GRIP',rank:2,desc:'Foregrip. 25% less recoil and sway.'},
 supp:{name:'SUPPRESSOR',rank:3,desc:'Stay off enemy radar, no muzzle flash. 15% less range.'},ext:{name:'EXTENDED MAG',rank:4,desc:'50% more rounds per magazine, slightly slower reload.'}};
export const RANKS=['RECRUIT','PRIVATE','PRIVATE 1ST CLASS','SPECIALIST','CORPORAL','SERGEANT','STAFF SERGEANT','SERGEANT 1ST CLASS','MASTER SERGEANT','2ND LIEUTENANT','1ST LIEUTENANT','CAPTAIN','MAJOR','LT. COLONEL','COLONEL','BRIGADIER','COMMANDER'];
export const rankXP=r=>r<=0?0:Math.round(400*r+180*r*r);
export function rankOf(xp){let r=0;while(r<RANKS.length-1&&xp>=rankXP(r+1))r++;return r;}
// deterministic, learnable recoil: [up, side] multipliers for shot i
export function pattern(id,i){if(id==='ar'||id==='lmg'){const H=[0,.3,.6,.8,.5,.1,-.4,-.9,-1.1,-.8,-.3,.3,.8,1.1,.9,.4,-.2,-.7,-1,-.6];return[1+(i<4?.25:0)-(i>14?.25:0),H[i%H.length]*(id==='lmg'?1.2:1)];}
 if(id==='smg')return[.9+Math.sin(i*.7)*.15,Math.sin(i*.55+.3)*1.1+Math.sin(i*1.9)*.35];return[1,Math.sin(i*2.3)*.6];}
export function dmgAt(w,d,o){const r0=w.range[0]*(o&&o.supp?.85:1),r1=w.range[1]*(o&&o.supp?.85:1);const k=d<=r0?0:d>=r1?1:(d-r0)/(r1-r0);return w.dmg[0]+(w.dmg[1]-w.dmg[0])*k;}

/* ================= viewmodel ================= */
// profile in (u = forward, v = up) → geometry pointing down -z
const P=(pts,w,b=.003)=>{const g=prof(pts,w,b,3);g.rotateY(PI);return g;};
const at=(u,v,x=0,rx=0,ry=0,rz=0)=>M4(x,v,-u,rx,ry,rz);
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),ZC=(r,len,s=14,r2)=>{const g=new THREE.CylinderGeometry(r,r2??r,len,s);g.rotateX(PI/2);return g;},CY=(a,b,h,s=10)=>new THREE.CylinderGeometry(a,b,h,s);
function rbox(w,h,d,r=.004,seg=2){r=Math.min(r,w/2-.0005,h/2-.0005,d/2-.0005);const g=new THREE.BoxGeometry(w,h,d,seg,seg,seg),p=g.attributes.position,n=g.attributes.normal,v=new V(),c=new V(),hw=w/2-r,hh=h/2-r,hd=d/2-r;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(cl(v.x,-hw,hw),cl(v.y,-hh,hh),cl(v.z,-hd,hd));v.sub(c);if(v.lengthSq()<1e-12)v.fromBufferAttribute(n,i);v.normalize();n.setXYZ(i,v.x,v.y,v.z);p.setXYZ(i,c.x+v.x*r,c.y+v.y*r,c.z+v.z*r);}return g;}
const TOR=(r,t)=>new THREE.TorusGeometry(r,t,8,20);
// rear aperture (ring + ears + base) centred on sight line v at u; front post with wings, top at v
const rearAp=(u,v,base)=>[{geo:TOR(.0058,.0017),m:at(u,v)},{geo:BX(.0034,v-base+.009,.007),m:at(u,(v+base)/2+.0045,.0098)},{geo:BX(.0034,v-base+.009,.007),m:at(u,(v+base)/2+.0045,-.0098)},{geo:BX(.024,.008,.012),m:at(u,base+.004)},{geo:BX(.016,v-.006-base,.006),m:at(u,(base+v-.006)/2)}];
const frontPost=(u,v,base)=>[{geo:BX(.0026,v-base,.004),m:at(u,(v+base)/2)},{geo:BX(.003,v-base+.005,.008),m:at(u,(v+base)/2+.0025,.0085)},{geo:BX(.003,v-base+.005,.008),m:at(u,(v+base)/2+.0025,-.0085)},{geo:BX(.022,.006,.012),m:at(u,base+.003)}];
const rail=(u0,u1,v,w=.022)=>{const L=[{geo:BX(w,.006,u1-u0),m:at((u0+u1)/2,v+.003)}];for(let u=u0+.006;u<u1-.004;u+=.0125)L.push({geo:BX(w+.003,.005,.006),m:at(u,v+.008)});return L;};

export function buildViewmodel(TX){const std=o=>new THREE.MeshStandardMaterial(o);
 const M={blk:std({color:0x62666e,roughness:.45,metalness:.3,side:THREE.DoubleSide}),poly:std({color:0x54585e,roughness:.58,metalness:.05}),fde:std({color:0x9c8a66,roughness:.66,metalness:.04}),od:std({color:0x56603e,roughness:.6,metalness:.06}),
  steel:std({color:0x8a8e94,roughness:.26,metalness:1}),dark:std({color:0x121315,roughness:.5,metalness:.4}),wood:std({map:TX.wood.map,color:0xb07848,roughness:.5}),brass:std({color:0xd8a848,roughness:.3,metalness:1}),
  glove:std({color:0x4a4234,roughness:.85}),knuck:std({color:0x2c2a26,roughness:.7}),sleeve:std({map:TX.kitA,roughness:.95}),cuff:std({color:0x3e4430,roughness:.9}),watch:std({color:0x1a1a1a,roughness:.4,metalness:.4}),
  lens:std({color:0x2a5068,roughness:.05,metalness:.9,transparent:true,opacity:.35,depthWrite:false}),dot:new THREE.MeshBasicMaterial({color:new THREE.Color(10,.4,.3)}),
  flash:new THREE.MeshBasicMaterial({map:TX.flash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(2.4,1.9,1.3),side:THREE.DoubleSide}),
  flashS:new THREE.MeshBasicMaterial({map:TX.flashSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(2.2,1.7,1.1),side:THREE.DoubleSide})};
 const root=new THREE.Group();
 const add=(p,geo,m,mat)=>{const o=new THREE.Mesh(geo,m);if(mat)o.applyMatrix4(mat);p.add(o);return o;};
 const parts=(p,list)=>{for(const[m,geos]of list)if(geos.length)add(p,merge(geos),m);};
 const guns={};
 const mkGun=(id,fn)=>{const g=new THREE.Group();g.visible=false;root.add(g);const u={slots:{}};fn(g,u);
  const fl=new THREE.Group();u.muzzle.add(fl);add(fl,new THREE.PlaneGeometry(.2,.2),M.flash);for(const r of[0,PI/2]){const s=add(fl,new THREE.PlaneGeometry(.26,.1),M.flashS);s.geometry.translate(-.13,0,0);s.rotation.set(0,PI/2,r);}
  fl.visible=false;u.flash=fl;u.flash2=fl;g.userData=u;guns[id]=g;};
 const redDot=(p,u0,v)=>{const r=new THREE.Group();r.position.set(0,v,-u0);p.add(r);parts(r,[[M.blk,[{geo:rbox(.026,.014,.05,.003),m:at(0,.007)},{geo:(()=>{const g=new THREE.CylinderGeometry(.019,.019,.055,20,1,true);g.rotateX(PI/2);return g;})(),m:at(0,.031)},{geo:new THREE.TorusGeometry(.0195,.0028,6,20),m:at(.026,.031)},{geo:new THREE.TorusGeometry(.0195,.0028,6,20),m:at(-.026,.031)},{geo:rbox(.012,.012,.016,.003),m:at(0,.055)},{geo:rbox(.01,.012,.012,.003),m:at(0,.031,.022)}]]]);
  add(r,new THREE.CircleGeometry(.016,18),M.lens,at(.024,.031));add(r,new THREE.SphereGeometry(.0011,6,4),M.dot,at(.03,.031));r.userData.h=v+.031;return r;};
 const supp=(p,u0,v,r=.019,len=.17)=>{const s=new THREE.Group();s.position.set(0,v,-u0);p.add(s);parts(s,[[M.blk,[{geo:ZC(r,len,18),m:at(len/2,0)},{geo:ZC(r*1.08,.012,18),m:at(.006,0)},{geo:ZC(r*1.04,.008,18),m:at(len-.004,0)}]]]);return s;};
 const vgrip=(p,u0,v)=>{const s=new THREE.Group();s.position.set(0,v,-u0);p.add(s);parts(s,[[M.poly,[{geo:CY(.013,.015,.085,12),m:M4(0,-.045,0,.12)},{geo:rbox(.024,.012,.04,.004),m:at(0,-.004)}]]]);return s;};
 const grip=(u0,v0,w=.03,c=M.poly)=>[c,[{geo:P([[u0-.032,v0],[u0+.02,v0],[u0+.004,v0-.098],[u0-.05,v0-.104],[u0-.053,v0-.09]],w,.004)}]];

 // ---- HAVOC-4 assault rifle
 mkGun('ar',(g,u)=>{parts(g,[[M.blk,[{geo:P([[-.05,0],[.165,0],[.165,.034],[.12,.04],[-.05,.04]],.03)},{geo:P([[.068,.0],[.135,.0],[.13,-.045],[.072,-.045]],.034)},{geo:P([[-.062,.04],[.2,.04],[.2,.078],[-.04,.08],[-.062,.07]],.032)},
    ...rail(-.05,.2,.078),{geo:ZC(.0085,.17),m:at(.555,.058)},{geo:rbox(.026,.02,.03,.003),m:at(.5,.07)},{geo:rbox(.012,.012,.03,.002),m:at(-.075,.07)},{geo:rbox(.05,.008,.012,.002),m:at(-.075,.072)},
    {geo:BX(.005,.03,.006),m:at(.038,-.016)},{geo:BX(.004,.004,.064),m:at(.03,-.034)},{geo:ZC(.009,.02,10),m:at(.02,.055,.017,0,PI/2,0)}]],
   [M.dark,[{geo:BX(.002,.016,.06),m:at(.075,.06,.0165)},...[.25,.29,.33,.37,.41].flatMap(q=>[{geo:BX(.003,.012,.026),m:at(q,.056,.027)},{geo:BX(.003,.012,.026),m:at(q,.056,-.027)}])]],
   [M.poly,[{geo:P([[.2,.026],[.47,.026],[.48,.036],[.48,.082],[.2,.086]],.052,.006)},...rail(.2,.47,.086),{geo:ZC(.016,.2,12),m:at(-.165,.056)},{geo:P([[-.12,.028],[-.305,.016],[-.322,.024],[-.326,.092],[-.31,.1],[-.16,.088],[-.12,.078]],.04,.006)}]],
   grip(0,.004),[M.steel,[{geo:ZC(.012,.05,12),m:at(.64,.058)},{geo:ZC(.0135,.012,12),m:at(.612,.058)}]]]);
  u.mag=add(g,merge([{geo:P([[-.031,0],[.028,0],[.05,-.17],[-.006,-.18]],.03,.004)},{geo:rbox(.034,.014,.064,.004),m:at(.025,-.176,0,-.12)}]),M.poly,at(.1,-.03));u.magY=-.03;u.magZ=-.1;
  u.ext=add(u.mag,rbox(.032,.06,.062,.005),M.poly,at(.03,-.2,0,-.12));
  u.slots.iron=new THREE.Group();g.add(u.slots.iron);parts(u.slots.iron,[[M.blk,[...rearAp(-.02,.113,.086),...frontPost(.455,.113,.094)]]]);
  u.slots.reddot=redDot(g,.04,.086);u.slots.supp=supp(g,.64,.058);u.slots.fh=new THREE.Group();g.add(u.slots.fh);u.slots.grip=vgrip(g,.36,.026);
  u.sight={iron:.113,reddot:.117};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.058,-.67);g.add(u.muzzle);u.hand=[new V(0,-.06,.035),new V(0,-.012,-.3)];
  u.bolt=add(g,rbox(.012,.012,.03,.003),M.steel,at(-.075,.07,0));u.eject=new V(.02,.06,-.07);});
 // ---- WASP-9 SMG
 mkGun('smg',(g,u)=>{parts(g,[[M.poly,[{geo:P([[-.07,-.004],[.2,-.004],[.21,.02],[.21,.075],[-.06,.078],[-.07,.06]],.046,.006)},{geo:P([[.09,-.004],[.2,-.004],[.2,-.03],[.1,-.03]],.044,.004)},...rail(-.05,.17,.078,.02)]],
   grip(0,-.002),[M.blk,[{geo:ZC(.017,.07,14),m:at(.245,.04)},{geo:ZC(.009,.05),m:at(.3,.04)},{geo:ZC(.006,.24,8),m:at(-.17,.064,.016)},{geo:ZC(.006,.24,8),m:at(-.17,.064,-.016)},{geo:rbox(.04,.08,.012,.003),m:at(-.29,.04)},{geo:rbox(.012,.014,.04,.003),m:at(-.03,.068,.026)}]],
   [M.dark,[{geo:BX(.002,.018,.05),m:at(.06,.05,.0235)}]]]);
  u.mag=add(g,merge([{geo:P([[-.022,0],[.02,0],[.03,-.18],[-.012,-.185]],.026,.004)}]),M.blk,at(.07,-.02));u.magY=-.02;u.magZ=-.07;u.ext=add(u.mag,rbox(.026,.07,.04,.004),M.blk,at(.012,-.21));
  u.slots.iron=new THREE.Group();g.add(u.slots.iron);parts(u.slots.iron,[[M.blk,[...rearAp(-.03,.094,.078),...frontPost(.172,.094,.078)]]]);
  u.slots.reddot=redDot(g,-.0,.078);u.slots.supp=supp(g,.32,.04,.018,.15);u.slots.fh=new THREE.Group();g.add(u.slots.fh);u.slots.grip=vgrip(g,.16,-.03);
  u.sight={iron:.094,reddot:.109};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.04,-.33);g.add(u.muzzle);u.hand=[new V(0,-.065,.035),new V(0,-.03,-.16)];u.eject=new V(.025,.05,-.06);});
 // ---- MAULER-60 LMG
 mkGun('lmg',(g,u)=>{parts(g,[[M.blk,[{geo:P([[-.1,-.004],[.26,-.004],[.27,.03],[.26,.092],[-.08,.1],[-.1,.08]],.062,.006)},{geo:P([[-.05,.092],[.22,.092],[.21,.112],[-.04,.118]],.058,.004)},...rail(-.04,.2,.118,.024),
    {geo:ZC(.0125,.36),m:at(.47,.05)},{geo:ZC(.017,.05,12),m:at(.66,.05)},{geo:CY(.004,.004,.2,6),m:at(.42,.022,.012,PI/2-.1)},{geo:CY(.004,.004,.2,6),m:at(.42,.022,-.012,PI/2-.1)},
    {geo:P([[.05,.118],[.07,.16],[.2,.16],[.22,.118],[.2,.118],[.19,.145],[.08,.145],[.07,.118]],.014,.003)}]],
   [M.od,[{geo:P([[.27,.02],[.45,.026],[.45,.08],[.27,.09]],.056,.006)},{geo:P([[-.1,.02],[-.36,.0],[-.37,.1],[-.12,.096]],.05,.008)},{geo:rbox(.1,.13,.13,.012),m:at(.11,-.07,-.03)}]],
   [M.dark,[...[.3,.34,.38,.42].flatMap(q=>[{geo:BX(.003,.014,.024),m:at(q,.054,.029)},{geo:BX(.003,.014,.024),m:at(q,.054,-.029)}])]],grip(0,-.002)]);
  u.mag=add(g,merge([{geo:rbox(.012,.03,.1,.003),m:at(0,.0,0)},{geo:rbox(.016,.008,.1,.002),m:at(0,.018,0)}]),M.brass,at(.11,.06,-.04));u.magY=.06;u.magZ=-.11;u.ext=add(u.mag,BX(.001,.001,.001),M.brass);u.belt=u.mag;
  u.slots.iron=new THREE.Group();g.add(u.slots.iron);parts(u.slots.iron,[[M.blk,[...rearAp(-.01,.135,.118),{geo:BX(.01,.072,.012),m:at(.59,.098)},...frontPost(.59,.135,.122)]]]);
  u.slots.reddot=redDot(g,.03,.118);u.slots.supp=supp(g,.66,.05,.022,.18);u.slots.fh=new THREE.Group();g.add(u.slots.fh);u.slots.grip=vgrip(g,.36,.02);
  u.sight={iron:.135,reddot:.149};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.05,-.69);g.add(u.muzzle);u.hand=[new V(0,-.065,.035),new V(0,-.006,-.33)];u.eject=new V(.03,.06,-.04);
  u.cover=g.children[0];});
 // ---- LONGBOW sniper
 mkGun('sniper',(g,u)=>{parts(g,[[M.od,[{geo:P([[-.08,-.012],[.43,-.012],[.44,.012],[.43,.05],[-.06,.052]],.054,.008)},{geo:P([[-.08,.0],[-.42,-.022],[-.44,.095],[-.4,.1],[-.24,.098],[-.2,.11],[-.12,.11],[-.1,.06]],.042,.008)}]],grip(0,-.006,.032,M.od),
   [M.blk,[{geo:ZC(.022,.22,16),m:at(.05,.066)},{geo:ZC(.0125,.52),m:at(.69,.06)},{geo:ZC(.019,.07,12),m:at(.97,.06)},{geo:rbox(.034,.05,.08,.006),m:at(.07,-.03)},
    {geo:ZC(.018,.3,18),m:at(.06,.13)},{geo:ZC(.029,.07,18,.018),m:at(.24,.13)},{geo:ZC(.023,.08,18),m:at(-.12,.13)},{geo:CY(.012,.012,.03,12),m:at(.07,.153)},{geo:CY(.012,.012,.03,12),m:at(.07,.13,.025,0,0,PI/2)},
    {geo:rbox(.03,.03,.016,.004),m:at(-.01,.105)},{geo:rbox(.03,.03,.016,.004),m:at(.15,.105)},...rail(-.05,.22,.086,.022),{geo:CY(.005,.005,.24,6),m:at(.33,-.01,.014,PI/2+.08)},{geo:CY(.005,.005,.24,6),m:at(.33,-.01,-.014,PI/2+.08)}]]]);
  add(g,new THREE.CircleGeometry(.024,18),M.lens,at(.275,.13));add(g,new THREE.CircleGeometry(.02,18),M.lens,at(-.161,.13,0,0,PI,0));
  u.mag=add(g,rbox(.03,.03,.07,.004),M.blk,at(.07,-.06));u.magY=-.06;u.magZ=-.07;u.ext=add(u.mag,rbox(.03,.03,.07,.004),M.blk,at(0,-.025));
  u.bolt=add(g,merge([{geo:CY(.005,.005,.05,8),m:M4(.03,.07,.0,0,0,PI/2)},{geo:new THREE.SphereGeometry(.011,10,8),m:M4(.056,.07,0)}]),M.steel);
  u.slots.supp=supp(g,1.0,.06,.024,.2);u.slots.grip=vgrip(g,.34,-.012);u.sight={scope:.13};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.06,-1.01);g.add(u.muzzle);u.hand=[new V(0,-.07,.035),new V(0,-.04,-.32)];u.eject=new V(.03,.07,-.05);});
 // ---- BREACHER-12 pump shotgun
 mkGun('shotgun',(g,u)=>{parts(g,[[M.blk,[{geo:P([[-.05,0],[.17,0],[.175,.03],[.17,.07],[-.04,.072],[-.05,.06]],.046,.006)},{geo:ZC(.0145,.5,14),m:at(.42,.055)},{geo:ZC(.0135,.4,14),m:at(.37,.022)},{geo:rbox(.03,.02,.02,.004),m:at(.62,.04)},{geo:new THREE.SphereGeometry(.0035,8,6),m:at(.66,.072)}]],
   [M.poly,[{geo:P([[-.05,.01],[-.37,-.035],[-.38,.062],[-.36,.068],[-.05,.07]],.042,.008)}]],grip(0,.004)]);
  u.pump=add(g,merge([{geo:rbox(.05,.046,.17,.012),m:at(0,0)},...[-.06,-.03,0,.03,.06].map(q=>({geo:BX(.052,.004,.008),m:at(q,-.022)}))]),M.poly,at(.3,.02));u.pumpZ=-.3;u.mag=null;
  u.slots.iron=new THREE.Group();g.add(u.slots.iron);parts(u.slots.iron,[[M.blk,[...rearAp(.08,.082,.07),{geo:BX(.006,.012,.008),m:at(.645,.074)}]],[M.steel,[{geo:new THREE.SphereGeometry(.0032,8,6),m:at(.645,.0815)}]]]);
  u.slots.reddot=redDot(g,.03,.072);u.slots.grip=vgrip(g,.3,-.01);u.slots.extTube=add(g,ZC(.0135,.12,14),M.blk,at(.63,.022));
  u.sight={iron:.082,reddot:.103};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.055,-.67);g.add(u.muzzle);u.hand=[new V(0,-.065,.035),new V(0,-.0,-.3)];u.eject=new V(.03,.05,-.05);});
 // ---- P-11 pistol
 mkGun('pistol',(g,u)=>{u.slide=add(g,merge([{geo:P([[-.03,.034],[.15,.034],[.152,.06],[.145,.066],[-.022,.068],[-.03,.06]],.028,.004)},{geo:BX(.0035,.013,.005),m:at(.14,.0725)},{geo:BX(.006,.013,.007),m:at(-.016,.0725,.0065)},{geo:BX(.006,.013,.007),m:at(-.016,.0725,-.0065)},...[0,.008,.016,.024].map(q=>({geo:BX(.029,.02,.003),m:at(-.02+q,.05)}))]),M.blk);
  parts(g,[[M.poly,[{geo:P([[-.025,0],[.15,0],[.15,.034],[-.025,.034]],.026,.004)},{geo:P([[-.036,.004],[.018,.004],[.002,-.096],[-.055,-.094],[-.056,-.08]],.03,.005)},{geo:P([[.0,0],[.07,0],[.07,-.006],[.05,-.03],[.0,-.03]],.024,.002)}]],[M.dark,[{geo:ZC(.0055,.004,10),m:at(.152,.05)}]]]);
  u.mag=add(g,rbox(.024,.02,.04,.004),M.blk,at(-.02,-.1,0,.25));u.magY=-.1;u.magZ=.02;
  u.slots.supp=supp(g,.15,.05,.016,.12);u.sight={iron:.0785};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.05,-.16);g.add(u.muzzle);u.hand=[new V(0,-.06,.03),new V(-.012,-.075,.035)];u.eject=new V(.02,.06,-.03);});
 // ---- HAMMER RPG
 mkGun('rpg',(g,u)=>{parts(g,[[M.od,[{geo:ZC(.056,.95,18),m:at(.12,.075)},{geo:ZC(.09,.17,18),m:at(.68,.075)}]],[M.blk,[{geo:ZC(.064,.07,18),m:at(-.36,.075)},{geo:ZC(.062,.05,18),m:at(.56,.075)},{geo:rbox(.03,.07,.05,.006),m:at(.12,.16,-.035)},{geo:rbox(.012,.03,.012,.003),m:at(.12,.205,-.035)}]],
   [M.fde,[{geo:ZC(.09,.24,18,.018),m:at(.88,.075)}]],grip(0,.02),[M.poly,[{geo:CY(.016,.018,.08,10),m:at(.3,-.02)}]]]);
  u.sight={iron:.21};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.075,-1.0);g.add(u.muzzle);u.hand=[new V(0,-.04,.04),new V(0,-.05,-.3)];u.mag=null;u.warhead=g.children[g.children.length-1];});
 // ---- repair torch
 mkGun('tool',(g,u)=>{parts(g,[[M.blk,[{geo:rbox(.07,.1,.22,.012),m:at(0,.03)},{geo:ZC(.014,.2,10),m:at(.2,.05)},{geo:ZC(.022,.03,10),m:at(.3,.05)}]],[M.fde,[{geo:CY(.03,.03,.16,12),m:M4(0,.11,.0)}]],grip(0,-.02)]);
  u.sight={iron:.08};u.muzzle=new THREE.Object3D();u.muzzle.position.set(0,.05,-.33);g.add(u.muzzle);u.hand=[new V(0,-.06,.035),new V(0,.0,-.16)];u.mag=null;});
 // ---- knife + grenade
 const knife=new THREE.Group();knife.visible=false;root.add(knife);parts(knife,[[M.steel,[{geo:P([[0,-.01],[.17,-.004],[.19,.006],[.16,.014],[0,.014]],.004,.0008)}]],[M.poly,[{geo:rbox(.024,.03,.11,.008),m:at(-.055,.002)},{geo:rbox(.034,.04,.008,.003),m:at(-.003,.002)}]]]);
 const nade=new THREE.Group();nade.visible=false;root.add(nade);parts(nade,[[M.od,[{geo:new THREE.SphereGeometry(.032,14,12),m:M4(0,0,0,0,0,0,1,1.15,1)}]],[M.blk,[{geo:CY(.012,.014,.025,10),m:M4(0,.042,0)},{geo:BX(.012,.05,.008),m:M4(.028,.02,0,0,0,-.25)},{geo:new THREE.TorusGeometry(.011,.002,6,14),m:M4(-.006,.058,0,0,PI/2,0)}]]]);
 // ---- arms: sleeve + cuff + gloved hand, re-oriented between joints every frame
 const unitCyl=(r0,r1)=>{const g=CY(r1,r0,1,12);g.translate(0,.5,0);return g;};
 const handGeo=(right)=>{const s=right?1:-1;return merge([{geo:rbox(.058,.03,.07,.012),m:M4(0,0,-.012)},{geo:rbox(.06,.034,.05,.014),m:M4(0,-.022,-.058,.9)},{geo:rbox(.02,.024,.05,.009),m:M4(-s*.032,.004,-.03,.2,s*.5,0)}]);};
 const mkArm=(right)=>{const a=new THREE.Group();root.add(a);const fore=add(a,unitCyl(.036,.03),M.sleeve),upper=add(a,unitCyl(.048,.04),M.sleeve),cuff=add(a,unitCyl(.034,.033),M.cuff),hand=add(a,handGeo(right),M.glove),watch=right?null:add(a,rbox(.044,.016,.034,.004),M.watch);return{a,fore,upper,hand,watch,cuff};};
 const arms=[mkArm(true),mkArm(false)];
 const q=new THREE.Quaternion(),up=new V(0,1,0),d=new V(),w=new V();
 const seg=(m,a,b)=>{d.subVectors(b,a);const l=d.length();m.position.copy(a);m.quaternion.setFromUnitVectors(up,d.multiplyScalar(1/l));m.scale.set(1,l,1);};
 const pose=(arm,hand,elbow,shoulder,handRot)=>{w.lerpVectors(hand,elbow,.16);seg(arm.cuff,hand,w);seg(arm.fore,w,elbow);seg(arm.upper,elbow,shoulder);arm.hand.position.copy(hand);arm.hand.quaternion.copy(handRot||q.identity());
  if(arm.watch){arm.watch.position.lerpVectors(hand,elbow,.2);arm.watch.quaternion.copy(arm.fore.quaternion);}};
 for(const k in guns){const u=guns[k].userData;for(const s in u.slots)u.slots[s].visible=false;}
 // ---- ejected brass (camera space)
 const brassGeo=ZC(.0045,.022,8);const casings=new THREE.InstancedMesh(brassGeo,M.brass,16);casings.count=0;casings.frustumCulled=false;root.add(casings);const cs={list:[],mesh:casings};
 cs.add=(p,v)=>{if(cs.list.length>=16)cs.list.shift();cs.list.push({p:p.clone(),v:v.clone(),r:new THREE.Euler(Math.random()*3,Math.random()*3,0),w:new V(rnd(15),rnd(15),rnd(15)),t:0});};
 const rnd=k=>(Math.random()-.5)*k*2,mm=new THREE.Matrix4(),qq=new THREE.Quaternion(),one=new V(1,1,1);
 cs.update=(dt)=>{let n=0;for(let i=cs.list.length-1;i>=0;i--){const c=cs.list[i];c.t+=dt;if(c.t>.7){cs.list.splice(i,1);continue;}}for(const c of cs.list){c.v.y-=6*dt;c.p.addScaledVector(c.v,dt);c.r.x+=c.w.x*dt;c.r.y+=c.w.y*dt;c.r.z+=c.w.z*dt;mm.compose(c.p,qq.setFromEuler(c.r),one);casings.setMatrixAt(n++,mm);}casings.count=n;casings.instanceMatrix.needsUpdate=true;};
 return{root,guns,knife,nade,arms,pose,M,casings:cs};}

// toggle attachment meshes for a weapon + loadout attachments
export function applyAttachments(g,id,att){const u=g.userData,s=u.slots;for(const k in s)s[k].visible=false;
 if(s.iron)s.iron.visible=!att.reddot;if(s.reddot)s.reddot.visible=!!att.reddot;if(s.supp)s.supp.visible=!!att.supp;if(s.fh)s.fh.visible=!att.supp;if(s.grip)s.grip.visible=!!att.grip;if(s.extTube)s.extTube.visible=!!att.ext;if(u.ext)u.ext.visible=!!att.ext;
 u.sightY=u.sight.scope??(att.reddot&&u.sight.reddot?u.sight.reddot:u.sight.iron);u.muzzle.position.z=u.muzzle.userData.z0??(u.muzzle.userData.z0=u.muzzle.position.z);if(att.supp&&s.supp)u.muzzle.position.z-=.16;}
