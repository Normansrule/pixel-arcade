// DUSTWATER — procedural characters: an articulated frontier rig (hat, duster, vest, gunbelt, bandana) with walk / run / aim /
// lasso / ride / sit / surrender / hogtied / carried / draped / duel / death poses; the horse rig with blended four-beat walk,
// diagonal trot, three-beat canter and four-beat gallop; revolver, lever rifle and lasso models. Rig structure adapted from Storm Royale.
import * as THREE from '../vendor/three.module.min.js';
import {V,M,merge,cl,lerp,smooth,rng,rbox,cap,loft,ctex,normalFrom} from './util.js';
// shared procedural materials: fabric weave for people, short-hair coat for horses, blued steel + walnut for guns
let MATS=null;
export function makeMats(){if(MATS)return MATS;const r=rng(31);
 const fab=ctex(256,256,(x,w,h)=>{x.fillStyle='#e6e6e6';x.fillRect(0,0,w,h);for(let j=0;j<h;j+=2)for(let i=0;i<w;i+=2){const v=(i+j)%4?222:242;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(i,j,2,1);}
  for(let i=0;i<70;i++){const v=150+r()*80|0;x.fillStyle=`rgba(${v},${v-6},${v-14},.18)`;x.beginPath();x.ellipse(r()*w,r()*h,6+r()*26,4+r()*18,r()*3,0,7);x.fill();}
  for(let i=0;i<500;i++){x.fillStyle=`rgba(${r()<.5?60:255},${r()<.5?55:250},${r()<.5?50:240},.12)`;x.fillRect(r()*w,r()*h,1+r()*2,1);}});
 fab.repeat.set(4,4);const fabN=normalFrom(fab.image,1.4);fabN.repeat.set(4,4);
 const hair=ctex(256,256,(x,w,h)=>{x.fillStyle='#d8d8d8';x.fillRect(0,0,w,h);for(let i=0;i<5200;i++){const v=170+r()*85|0,X=r()*w,Y=r()*h,L=4+r()*14;x.strokeStyle=`rgba(${v},${v},${v},.5)`;x.lineWidth=.6+r()*.8;x.beginPath();x.moveTo(X,Y);x.lineTo(X+(r()-.5)*1.5,Y+L);x.stroke();}
  for(let i=0;i<40;i++){x.fillStyle=`rgba(255,255,255,${.04+r()*.05})`;x.beginPath();x.ellipse(r()*w,r()*h,8+r()*20,6+r()*14,0,0,7);x.fill();}});
 hair.repeat.set(3,2);const hairN=normalFrom(hair.image,1.6);hairN.repeat.set(3,2);
 const charMat=new THREE.MeshStandardMaterial({vertexColors:true,map:fab,normalMap:fabN,normalScale:new THREE.Vector2(.45,.45),roughness:.82,metalness:0});
 const horseMat=new THREE.MeshStandardMaterial({vertexColors:true,map:hair,normalMap:hairN,normalScale:new THREE.Vector2(.55,.55),roughness:.5,metalness:0,envMapIntensity:1.1});
 const gunMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.32,metalness:.65,envMapIntensity:1.4});
 return MATS={charMat,horseMat,gunMat};}

export const LOOKS={
 player:{skin:0xc99470,hat:0x4a3624,band:0x2a1a10,shirt:0xd4c8ae,vest:0x34343c,coat:0x6e5236,pants:0x4a4238,boot:0x2a1c14,kerch:0x8a2a22,belt:0x3a2414,hair:0x3a2618,coatLen:1,stache:1,mask:0},
 leader:[{skin:0xb98466,hat:0x18161a,band:0xb0b0b8,shirt:0x2a2a2e,vest:0x5a1a18,coat:0x1e1c20,pants:0x2e2a2a,boot:0x1a1412,kerch:0xa01a14,belt:0x2a1a10,hair:0x1a1410,coatLen:1.25,mask:0,stache:1},
  {skin:0xd8a888,hat:0x6a5a48,band:0x8a2a20,shirt:0x7a2a2a,vest:0x2a3a2a,coat:0x5a4a38,pants:0x3a3430,boot:0x2a1c14,kerch:0xe0d8c8,belt:0x3a2414,hair:0xb04a20,coatLen:1.15,mask:0,stache:0,long:1},
  {skin:0x9a6a4c,hat:0xc8b490,band:0x3a2414,shirt:0xe0d0b0,vest:0x6a3a1a,coat:0x8a6040,pants:0x4a3a2a,boot:0x3a2414,kerch:0x2a4a6a,belt:0x3a2414,hair:0x1a1410,coatLen:0,poncho:0xa0402a,mask:0,stache:1}],
 bandit:[{hat:0x2a2622,shirt:0x8a7a5a,vest:0x3a2a1e,pants:0x3a3632,kerch:0x8a1a14},{hat:0x5a4a3a,shirt:0x6a4a3a,vest:0x2a2a2a,pants:0x4a4038,kerch:0x1a1a1a},{hat:0x3a3a40,shirt:0xb0a080,vest:0x5a3a24,pants:0x2e3038,kerch:0x7a2a5a},
  {hat:0x6a5038,shirt:0x4a5a6a,vest:0x2a2420,pants:0x5a4a3a,kerch:0xa8401a},{hat:0x1a1a1e,shirt:0x9a3a2a,vest:0x3a3028,pants:0x3a342c,kerch:0x2a2a2a},{hat:0x8a7a60,shirt:0x5a5a4a,vest:0x6a4a2a,pants:0x2a2622,kerch:0x8a6a1a}],
 town:[{skin:0xe0b090,hat:0x7a6a50,shirt:0xa8b8c8,vest:0x4a4a52,pants:0x5a4a3a,kerch:0x2a2a4a},{skin:0xc08a68,hat:0,shirt:0xe8d8c0,vest:0x6a3a4a,pants:0x6a5a4a,kerch:0,dress:0x6a3a4a,hair:0x5a3a20},{skin:0xa87656,hat:0x3a3a3a,shirt:0xe0e0d8,vest:0x1e1e22,pants:0x2a2a2a,kerch:0x1a1a1a},
  {skin:0xd8a080,hat:0,shirt:0xc8c0a0,vest:0x3a5a4a,pants:0x4a4a40,kerch:0,dress:0x3a4a6a,hair:0x8a5a2a},{skin:0xe8c0a0,hat:0x9a8a6a,shirt:0x8a6a4a,vest:0x5a4a3a,pants:0x4a3a30,kerch:0x8a2a20}]};
const BASE={skin:0xc8946c,hat:0x3a2a1e,band:0x1a1210,shirt:0xc8bca0,vest:0x3a3a40,coat:0,pants:0x4a4238,boot:0x2a1c14,kerch:0x7a2018,belt:0x3a2414,hair:0x2a1c12,coatLen:0,mask:1,stache:0};
export function look(o){return{...BASE,...o};}

const RB=(w,h,d,x,y,z,c,r=.04,rx=0,ry=0,rz=0)=>[rbox(w,h,d,r,2),M(x,y,z,rx,ry,rz),c];
const CP=(r,len,x,y,z,c,rx=0,rz=0)=>[cap(r,len,10),M(x,y,z,rx,0,rz),c];
const SS=(r,x,y,z,c,sx=1,sy=1,sz=1,ws=14,hs=10)=>[new THREE.SphereGeometry(r,ws,hs),M(x,y,z,0,0,0,sx,sy,sz),c];
const CY=(r0,r1,h,x,y,z,c,seg=10,rx=0,ry=0,rz=0)=>[new THREE.CylinderGeometry(r0,r1,h,seg),M(x,y,z,rx,ry,rz),c];
const piv=(parent,x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};
const mesh=(parent,parts,mat)=>{const m=new THREE.Mesh(merge(parts),mat);m.castShadow=true;parent.add(m);return m;};
const dk=(c,k=.6)=>new THREE.Color(c).multiplyScalar(k).getHex();

export function hatParts(o,y=0){if(!o.hat)return[];const brim=new THREE.CylinderGeometry(.27,.27,.02,24);const p=brim.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=Math.hypot(x,z);if(d>.14){const k=(d-.14)/.13;p.setY(i,p.getY(i)+Math.abs(x)/.27*k*.07-(z>0?k*.02:0));}}brim.computeVertexNormals();
 const crown=new THREE.CylinderGeometry(.13,.155,.17,18,2);const cp=crown.attributes.position;for(let i=0;i<cp.count;i++){if(cp.getY(i)>.05){const x=cp.getX(i);cp.setY(i,cp.getY(i)-(Math.abs(x)<.05?.035:0));cp.setZ(i,cp.getZ(i)*.92);}}crown.computeVertexNormals();
 return[[brim,M(0,y,0,-.06),o.hat],[crown,M(0,y+.09,0,-.06),o.hat],[new THREE.CylinderGeometry(.158,.158,.035,18),M(0,y+.025,0,-.06),o.band]];}

// lofted section helpers: Y = sections along +y (front +z), D = sections along -y (front +z)
const LY=(arr,c,seg=12,o={})=>[loft(arr.map(([y,rx,rz,dn,oz,ox])=>({c:[ox||0,y,oz||0],rx,ry:rz,dn,sq:o.sq})),seg,{...o,up:[0,1,0]}),null,c];
const LD=(arr,c,seg=10,o={})=>[loft(arr.map(([y,rx,rz,dn,oz,ox])=>({c:[ox||0,y,oz||0],rx,ry:rz,dn,sq:o.sq})),seg,{...o,up:[0,1,0]}),null,c];
// open shell (vest, coat) with the gap centred on the front (+z): gap = half-angle
const SH=(arr,c,gap,seg=14,o={})=>{const a=Math.PI/2;return LY(arr,c,seg,{...o,arc:[a+gap,a+Math.PI*2-gap]});};
export function makeRig(o,mat){const root=new THREE.Group(),body=piv(root,0,0,0),hips=piv(body,0,.95,0);const r={root,body,hips,o,mat};const pc=o.pants,sk=o.skin;
 // pelvis + gunbelt (cartridge loops, buckle) + holster
 const hp=[LY([[-.13,.17,.115],[-.06,.185,.125],[.04,.18,.12],[.12,.172,.112]],pc,14,{sq:2.3}),LY([[.0,.196,.132],[.075,.198,.134]],o.belt,16,{open:true}),
  RB(.075,.06,.02,0,.04,.134,0xb89a50,.008)];
 for(let i=0;i<9;i++){const a=Math.PI*.55+i*.16;hp.push(RB(.022,.04,.016,Math.cos(a)*.2,.035,-Math.sin(a)*.136*-1*-1,0x9a8a5a,.005,0,-a+Math.PI/2,0));}
 hp.push(LD([[.0,.05,.03],[-.12,.048,.034],[-.22,.034,.028]],o.belt,8,{}));hp[hp.length-1][1]=M(-.205,.0,.02,0,0,.12);
 if(o.dress)hp.push([loft([{c:[0,.05,0],rx:.2,ry:.14},{c:[0,-.3,0],rx:.29,ry:.24},{c:[0,-.72,0],rx:.36,ry:.32}],16,{open:true}),null,o.dress]);
 mesh(hips,hp,mat);
 for(const s of[-1,1]){const th=piv(hips,s*.1,-.06,0);mesh(th,[LD([[.08,.088,.098],[-.02,.094,.1],[-.18,.084,.09],[-.36,.068,.074],[-.45,.064,.07]],pc,10)],mat);const kn=piv(th,0,-.44,0);
  const boot=[LD([[.0,.064,.07],[-.12,.06,.066],[-.2,.068,.072],[-.36,.062,.066],[-.43,.06,.07]],pc,10),LD([[-.17,.071,.075],[-.3,.066,.07],[-.4,.06,.066]],o.boot,10,{open:true}),
   [loft([{c:[0,-.452,-.085],rx:.05,ry:.036},{c:[0,-.452,-.02],rx:.056,ry:.042},{c:[0,-.455,.07],rx:.05,ry:.034},{c:[0,-.462,.16],rx:.026,ry:.018}],10,{up:[0,1,0]}),null,o.boot],
   RB(.075,.05,.075,0,-.47,-.07,dk(o.boot,.55),.012),RB(.105,.012,.25,0,-.494,.04,dk(o.boot,.45),.004),[new THREE.TorusGeometry(.03,.006,4,10),M(0,-.455,-.115,0,Math.PI/2),0xb0a890]];
  mesh(kn,boot,mat);r[s<0?'thR':'thL']=th;r[s<0?'knR':'knL']=kn;}
 const sp=piv(hips,0,.08,0);r.spine=sp;
 // torso: shirt with placket + collar, vest shell, bandana
 const tor=[LY([[-.06,.172,.112],[.06,.176,.116],[.2,.195,.13],[.32,.214,.128],[.4,.214,.118],[.45,.17,.1],[.5,.09,.075],[.54,.062,.062]],o.shirt,16,{sq:2.4}),
  RB(.035,.38,.012,0,.2,.13,dk(o.shirt,.85),.005),LY([[.48,.072,.07],[.53,.074,.072]],o.shirt,12,{open:true,arc:[Math.PI/2+.5,Math.PI/2+Math.PI*2-.5]})];
 for(let i=0;i<4;i++)tor.push(SS(.007,0,.06+i*.09,.138,0xe8e0d0,1,1,.5,5,4));
 tor.push(SH([[-.03,.182,.122],[.1,.186,.126],[.22,.204,.138],[.33,.222,.134],[.41,.21,.12]],o.vest,.36,16,{sq:2.4}));
 if(o.kerch)tor.push([new THREE.ConeGeometry(.1,.16,4),M(0,.43,.115,Math.PI,Math.PI/4,0,1,1,.4),o.kerch],LY([[.47,.078,.074],[.51,.075,.072]],o.kerch,12,{open:true}));
 mesh(sp,tor,mat);
 // duster coat: shoulders + skirt from the hips that sways
 if(o.coatLen){mesh(sp,[SH([[-.02,.19,.128],[.12,.194,.132],[.24,.212,.144],[.35,.232,.14],[.43,.222,.128],[.48,.14,.1]],o.coat,.5,18,{sq:2.4}),
   RB(.07,.22,.02,-.1,.3,.15,dk(o.coat,.85),.01,.0,0,.12),RB(.07,.22,.02,.1,.3,.15,dk(o.coat,.85),.01,.0,0,-.12)],mat);
  const tail=piv(hips,0,.05,0);const L=.62*o.coatLen;mesh(tail,[SH([[0,.205,.14],[-L*.35,.24,.17],[-L*.7,.28,.2],[-L,.31,.22]].map(s=>s),o.coat,.42,18)],mat);r.tail=tail;}
 if(o.poncho){mesh(sp,[[loft([{c:[0,.5,0],rx:.1,ry:.09},{c:[0,.42,0],rx:.3,ry:.24},{c:[0,.2,0],rx:.44,ry:.34},{c:[0,.02,0],rx:.48,ry:.36}],16,{open:true,up:[0,1,0]}),null,o.poncho],
   [loft([{c:[0,.06,0],rx:.468,ry:.354},{c:[0,.1,0],rx:.462,ry:.35}],16,{open:true}),null,0xe0c890],[loft([{c:[0,.26,0],rx:.405,ry:.312},{c:[0,.29,0],rx:.39,ry:.3}],16,{open:true}),null,0x2a3a5a]],mat);}
 // head: lofted skull, jaw, nose, brow, eyes, ears, hair, moustache
 const nk=piv(sp,0,.53,0);r.neck=nk;const skd=dk(sk,.82);
 const hd=[LY([[-.02,.052,.056],[.08,.056,.06]],sk,10),LY([[.055,.04,.045,1,.035],[.075,.058,.065,1.05,.025],[.11,.074,.085,1.1,.012],[.15,.084,.094,1.12,0],[.19,.09,.096,1.16,-.006],[.235,.092,.094,1.18,-.012],[.27,.084,.084,1.18,-.016],[.3,.06,.062,1.1,-.018],[.315,.02,.02,1,-.018]],sk,14),
  [new THREE.ConeGeometry(.022,.06,4),M(0,.155,.094,-.25,Math.PI/4,0,1,1,.8),sk],RB(.15,.022,.03,0,.193,.083,skd,.01,-.15),
  SS(.012,-.034,.172,.083,0xf0ece0,1,.7,.5,6,5),SS(.012,.034,.172,.083,0xf0ece0,1,.7,.5,6,5),SS(.007,-.034,.172,.09,0x2a1c12,1,1,.6,6,5),SS(.007,.034,.172,.09,0x2a1c12,1,1,.6,6,5),
  SS(.024,-.093,.165,-.005,sk,.45,1,.85,7,6),SS(.024,.093,.165,-.005,sk,.45,1,.85,7,6),RB(.045,.006,.01,0,.11,.088,0x6a3a30,.003)];
 hd.push(SH([[.17,.094,.097,1.2,-.012],[.23,.097,.096,1.22,-.016],[.28,.088,.088,1.2,-.02],[.31,.06,.064,1.1,-.02]],o.hair,1.15,14));
 if(o.stache)hd.push(RB(.075,.016,.02,0,.128,.094,o.hair,.007),RB(.02,.03,.015,-.035,.115,.09,o.hair,.006,0,0,.3),RB(.02,.03,.015,.035,.115,.09,o.hair,.006,0,0,-.3));
 if(o.long)hd.push(SH([[.0,.12,.1,1,-.02],[.12,.11,.1,1,-.02],[.24,.1,.1,1.2,-.016]],o.hair,1.4,14));
 if(o.mask&&o.kerch)hd.push(LY([[.04,.05,.07,1.05,.03],[.1,.08,.1,1.1,.014],[.15,.091,.106,1.12,.004]],o.kerch,14,{arc:[Math.PI/2-1.25,Math.PI/2+1.25]}),[new THREE.ConeGeometry(.1,.12,3),M(0,.03,.09,Math.PI,0,0,1.1,1,.35),o.kerch]);
 hd.push(...hatParts(o,.262));mesh(nk,hd,mat);
 // arms: deltoid, biceps, forearm, cuff, hands with fingers and thumb
 for(const s of[-1,1]){const sh=piv(sp,s*.235,.43,0);const sc=o.coatLen?o.coat:o.shirt;
  mesh(sh,[LD([[.05,.07,.072],[-.03,.078,.08],[-.12,.066,.07],[-.24,.056,.06],[-.31,.054,.058]],sc,10)],mat);const el=piv(sh,0,-.3,0);
  mesh(el,[LD([[.02,.054,.058],[-.07,.058,.06],[-.18,.047,.05],[-.24,.044,.047]],o.coatLen?o.coat:o.shirt,10),LD([[-.2,.05,.053],[-.255,.048,.051]],o.coatLen?dk(o.coat,.8):o.shirt,10,{open:true}),
   LD([[-.24,.032,.036],[-.26,.036,.04]],sk,8),RB(.07,.08,.032,0,-.3,.004,sk,.014),RB(.066,.055,.034,0,-.355,.012,sk,.012,.5),CP(.013,.035,s*-.04,-.275,.02,sk,.4,s*.5)],mat);r[s<0?'shR':'shL']=sh;r[s<0?'elR':'elL']=el;}
 r.handR=piv(r.elR,0,-.31,.0);r.handL=piv(r.elL,0,-.31,0);r.holster=piv(hips,-.21,-.06,.06);
 r.aim=piv(sp,-.16,.37,.1);r.aim.rotation.order='YXZ';r.held={};r.heldKey='';
 r.ph=0;r.die=0;r.tw=0;r.lean=0;r.hit=0;return r;}

/* ---------------- weapons ---------------- */
export function revolverMesh(mat){const p=[[new THREE.CylinderGeometry(.016,.016,.2,8),M(0,.035,.14,Math.PI/2),0x3a3a40],[new THREE.CylinderGeometry(.034,.034,.065,10),M(0,.03,.01,Math.PI/2),0x5a5a62],RB(.04,.05,.09,0,.025,.045,0x2a2a30,.01),RB(.036,.11,.05,0,-.04,-.04,0x5a3218,.015,-.35),
 RB(.012,.03,.012,0,.06,.23,0x2a2a2a,.004),[new THREE.TorusGeometry(.022,.005,4,10,Math.PI),M(0,-.01,.02,0,Math.PI/2),0x2a2a30],RB(.012,.03,.03,0,.065,-.035,0x2a2a30,.005,.5)];const m=new THREE.Mesh(merge(p),mat);m.castShadow=true;m.userData.muzzle=new V(0,.035,.25);return m;}
export function rifleMesh(mat){const p=[[new THREE.CylinderGeometry(.014,.014,.62,8),M(0,.03,.38,Math.PI/2),0x2e2e34],[new THREE.CylinderGeometry(.016,.016,.5,8),M(0,.0,.33,Math.PI/2),0x3a3a40],RB(.045,.07,.18,0,.01,.0,0x4a4a52,.012),RB(.05,.05,.3,0,-.01,.28,0x6a3a1a,.015),
 RB(.045,.09,.32,0,-.04,-.24,0x5a2e14,.02,.12),RB(.05,.12,.06,0,-.06,-.4,0x4a2410,.02,.12),[new THREE.TorusGeometry(.04,.007,4,10),M(0,-.07,.02,0,Math.PI/2,0,1,1.3,1),0x3a3a40],RB(.01,.025,.01,0,.06,.66,0x2a2a2a,.003)];const m=new THREE.Mesh(merge(p),mat);m.castShadow=true;m.userData.muzzle=new V(0,.03,.7);return m;}
export function lassoMesh(mat){const p=[[new THREE.TorusGeometry(.13,.018,5,18),M(0,0,0,0,Math.PI/2),0xc8a870],[new THREE.TorusGeometry(.11,.018,5,18),M(.01,.01,0,0,Math.PI/2+.2),0xb89a60],[new THREE.TorusGeometry(.12,.016,5,18),M(-.01,-.01,0,.2,Math.PI/2),0xc0a068]];const m=new THREE.Mesh(merge(p),mat);m.castShadow=true;return m;}
// what the rig carries: holstered revolver always; in hand: 'revolver' | 'rifle' | 'lasso' | ''
export function hold(r,kind){if(r.heldKey===kind)return;r.heldKey=kind;const H=r.held;
 if(!H.rev){const gm=(MATS||makeMats()).gunMat;H.rev=revolverMesh(gm);H.rifle=rifleMesh(gm);H.lasso=lassoMesh(r.mat);H.coil=lassoMesh(r.mat);H.coil.scale.setScalar(.9);r.hips.add(H.coil);H.coil.position.set(.2,.0,.06);H.coil.rotation.set(0,0,1.4);}
 const rev=H.rev;if(kind==='revolver'){r.handR.add(rev);rev.position.set(0,-.02,.03);rev.rotation.set(-Math.PI/2,0,0);}else{r.holster.add(rev);rev.position.set(0,-.08,0);rev.rotation.set(Math.PI*.92,0,0);}
 if(kind==='rifle'){r.aim.add(H.rifle);H.rifle.position.set(0,0,.05);}else if(H.rifle.parent)H.rifle.parent.remove(H.rifle);
 if(kind==='lasso'){r.handR.add(H.lasso);H.lasso.position.set(0,-.05,.05);}else if(H.lasso.parent)H.lasso.parent.remove(H.lasso);
 H.coil.visible=kind!=='lasso'&&r.lasso!==false;}
export function muzzleWorld(r,out){const g=r.heldKey==='rifle'?r.held.rifle:r.heldKey==='revolver'?r.held.rev:null;if(g){g.updateWorldMatrix(true,false);return out.copy(g.userData.muzzle).applyMatrix4(g.matrixWorld);}return r.handR.getWorldPosition(out);}

const k=(a,b,t)=>a+(b-a)*t;
// st: {pose,speed,lvx,lvz,pitch,hold,fire,aim,dead,vy,ground}
// pose: '' (on foot) | 'ride' | 'sit' | 'hands' | 'tied' | 'carried' | 'draped' | 'duel' | 'roped'
export function animRig(r,st,dt,time){const sm=1-Math.exp(-dt*14),sm2=1-Math.exp(-dt*7);const run=cl(st.speed/5.5,0,1.5);
 let thL=0,thR=0,knL=0,knR=0,thLz=0,thRz=0,shLx=0,shLz=.1,shRx=0,shRz=-.1,shRy=0,elL=-.12,elR=-.12,spX=0,spY=0,spZ=0,nkX=0,nkY=0,bodyX=0,bodyY=0,bodyZ=0,lift=0,tailX=0;const p=st.pitch||0,P=st.pose||'';
 if(st.dead){r.die=Math.min(1,r.die+dt*2.4);const d=r.die;bodyX=-1.5*d*d;thL=thR=-.35*d;knL=knR=.5*d;shLx=shRx=-2.4*d;shLz=.6*d;shRz=-.6*d;elL=elR=-.3;lift=-.05*d;}
 else if(P==='ride'){thL=thR=1.25;thLz=.38;thRz=-.38;knL=knR=1.45;lift=0;const b=st.bounce||0;spX=.12+b*.06;shLx=-.55;shLz=.15;elL=-1.1;shRx=-.5;elR=-1;}
 else if(P==='sit'){thL=thR=1.45;knL=knR=1.55;thLz=.12;thRz=-.12;lift=-.48;spX=.18;shLx=shRx=-.5;elL=elR=-1.1;shLz=.2;shRz=-.2;nkX=.15+Math.sin(time*.7)*.08;}
 else if(P==='hands'){shLx=shRx=-2.9;shLz=.35;shRz=-.35;elL=elR=-.9;nkX=-.1;spX=-.05;knL=knR=.05;}
 else if(P==='tied'||P==='roped'){bodyZ=1.5;lift=.12;thL=thR=.2;knL=knR=-2.2;shLx=shRx=.6;shLz=-.3;shRz=.3;elL=elR=-1.2;nkX=-.3;if(P==='roped'){const w=Math.sin(time*12)*.15;thL+=w;thR-=w;bodyX=w*.3;}}
 else if(P==='carried'){bodyX=1.5;thL=thR=-.1;knL=knR=-1.6;shLx=shRx=.3;elL=elR=-1.8;nkX=.4;}
 else if(P==='draped'){bodyX=1.57;thL=thR=-1.3;knL=knR=0;shLx=shRx=-.1;elL=elR=-.1;nkX=.6;}
 else{if(st.ground!==false)r.ph+=dt*(3.6+st.speed*1.75);
  const fwdv=st.lvz,side=st.lvx;let hy=0;if(st.speed>.5){hy=cl(Math.atan2(side,Math.abs(fwdv)+.01),-1.1,1.1)*(fwdv<-.3?-1:1);}
  const dirS=fwdv<-.3?-1:1,s=Math.sin(r.ph)*dirS,c=Math.cos(r.ph);
  if(st.ground!==false){thL=s*.7*run;thR=-s*.7*run;knL=Math.max(0,-c)*1.15*run+.06;knR=Math.max(0,c)*1.15*run+.06;lift=Math.abs(Math.sin(r.ph))*.05*run;spX=.1*run;}
  else{thL=-.55;thR=.3;knL=.9;knR=.35;}
  shLx=-s*.55*run;shRx=s*.55*run;elL=elR=-.25-.45*run;tailX=-run*.35;
  const h=st.hold;
  if(h==='revolver'&&st.aim){shRx=-1.5-p;shRz=.05;elR=-.05;shLx=-.4;elL=-.6;spY=-.35;spX=-p*.15;}
  else if(h==='revolver'){shRx=-.25+s*.2*run;elR=-.5;}
  else if(h==='rifle'){const a=st.aim?1:.45;shRx=k(-.6,-1.35-p,a);shRz=.12;elR=k(-.9,-.8,a);shLx=k(-.7,-1.45-p,a);shLz=-.6*a;elL=k(-.9,-.45,a);spY=-.3*a;spX=-p*.25*a;}
  else if(h==='lasso'){if(st.aim){const t=time*14;shRx=-2.6+Math.sin(t)*.25;shRz=-.4+Math.cos(t)*.25;elR=-.8;shRy=Math.sin(t)*.3;}else{shRx=-.8;elR=-1.2;}shLx=-.6;elL=-.8;spY=-.15;}
  else if(h==='carry'){shRx=-2.6;elR=-2;shRz=.2;spX=.12;}
  if(P==='duel'){shRx=.05;shRz=-.32;elR=-.35;shLx=-.15;shLz=.3;knL=knR=.18;thL=thR=-.08;spX=.06;lift=-.03;nkX=-.06;}
  if(st.fire>0){shRx-=st.fire*.35;elR-=st.fire*.25;spX-=st.fire*.06;}
  r.tw+=(hy-r.tw)*sm2;}
 r.hit=Math.max(0,r.hit-dt*5);spX-=r.hit*.25;nkX-=r.hit*.3;
 const R=r;R.thL.rotation.x=k(R.thL.rotation.x,-thL,sm);R.thR.rotation.x=k(R.thR.rotation.x,-thR,sm);R.thL.rotation.z=k(R.thL.rotation.z,thLz,sm);R.thR.rotation.z=k(R.thR.rotation.z,thRz,sm);R.knL.rotation.x=k(R.knL.rotation.x,knL,sm);R.knR.rotation.x=k(R.knR.rotation.x,knR,sm);
 R.shL.rotation.x=k(R.shL.rotation.x,shLx,sm);R.shR.rotation.x=k(R.shR.rotation.x,shRx,sm);R.shL.rotation.z=k(R.shL.rotation.z,shLz,sm);R.shR.rotation.z=k(R.shR.rotation.z,shRz,sm);R.shR.rotation.y=k(R.shR.rotation.y,shRy,sm);
 R.elL.rotation.x=k(R.elL.rotation.x,elL,sm);R.elR.rotation.x=k(R.elR.rotation.x,elR,sm);R.spine.rotation.x=k(R.spine.rotation.x,spX,sm);R.spine.rotation.z=k(R.spine.rotation.z,spZ,sm);R.spine.rotation.y=k(R.spine.rotation.y,spY-R.tw*.55+(st.twist||0),sm);
 R.neck.rotation.x=k(R.neck.rotation.x,nkX-(st.aim?p*.45:0),sm);R.hips.rotation.y=R.tw*.85;{const cy=-(R.hips.rotation.y+R.spine.rotation.y)+(st.twist||0);R.aim.rotation.y=cy;R.neck.rotation.y=k(R.neck.rotation.y,cy*.8+nkY,sm);}
 R.aim.rotation.x=k(R.aim.rotation.x,-p-R.spine.rotation.x+(st.fire||0)*-.2,sm);
 if(R.tail)R.tail.rotation.x=k(R.tail.rotation.x,tailX+Math.sin(time*2.3)*.03,sm2);
 R.body.rotation.x=k(R.body.rotation.x,bodyX,st.dead||P==='carried'||P==='draped'?Math.min(1,sm*1.5):sm2);R.body.rotation.z=k(R.body.rotation.z,bodyZ,sm2);R.body.position.y=k(R.body.position.y,lift,sm);}

/* ---------------- the horse ---------------- */
export const COATS=[{c:0x6a3a1e,m:0x1a1210,l:0x1e1612,n:'BAY',blaze:1},{c:0x8e4a22,m:0x6a3a1a,l:0x7a4020,n:'CHESTNUT',blaze:1,sock:1},{c:0x2a2420,m:0x141210,l:0x1a1614,n:'BLACK'},{c:0xc8c0b4,m:0xe8e4dc,l:0x8a8680,n:'GREY',dapple:1},{c:0xc8a060,m:0xf0e6c8,l:0xa88050,n:'PALOMINO',blaze:1},{c:0x5a4a3e,m:0x2a2018,l:0x2a2018,n:'DUN'}];
// horse sections along z (trunk space): [z, half-width, top, bottom, centre y]
const BODY=[[-1.08,.08,.09,.09,.24],[-1.02,.22,.22,.22,.16],[-.93,.32,.33,.35,.08],[-.76,.385,.39,.43,.04],[-.52,.4,.39,.45,.03],[-.26,.395,.37,.5,.02],[.04,.415,.37,.56,.0],[.34,.41,.41,.58,.0],[.58,.37,.48,.52,.0],[.78,.32,.44,.46,.0],[.93,.26,.36,.38,.03],[1.02,.17,.25,.24,.06],[1.07,.06,.1,.1,.08]];
export function makeHorse(coat,mat){const root=new THREE.Group(),trunk=piv(root,0,1.42,0);const h={root,trunk,coat,legs:[],lod:[],ph:0,bob:0};const c=coat.c,cd=dk(c,.8),cl2=new THREE.Color(c).lerp(new THREE.Color(0xf0e0c0),.25).getHex();
 const body=loft(BODY.map(([z,w,t,b,y])=>({c:[0,y,z*.9],rx:w*.92,ry:t,dn:b*.9/t,sq:2.1})),24,{up:[0,1,0]});
 // belly shading: darker underneath, lighter flank highlight via vertex colour
 { const g=mesh(trunk,[[body,null,c]],mat).geometry,p=g.attributes.position,cc=g.attributes.color;for(let i=0;i<p.count;i++){const y=p.getY(i),k=.7+.38*smooth(-.55,.35,y);cc.setXYZ(i,cc.getX(i)*k,cc.getY(i)*k,cc.getZ(i)*k);}}
 // tack: draped blanket, saddle (seat, cantle, pommel, horn, skirts, fenders, stirrups), cinch, breast collar, saddlebags, bedroll
 const W=0x5a3418,Wd=0x3a2010,shell=(z0,z1,r,arc,col,dy=0)=>[loft([z0,(z0+z1)/2,z1].map((z,i)=>({c:[0,dy,z],rx:.415+r,ry:.375+r+(i==1?.015:0)})),18,{open:true,arc,up:[0,1,0]}),null,col];
 const tk=[shell(-.28,.42,.02,[.35,Math.PI-.35],0x7a2a1e),shell(-.25,.39,.03,[.3,Math.PI-.3],0xc8a050),shell(-.2,.34,.05,[.55,Math.PI-.55],W),
  [loft([{c:[0,.47,-.22],rx:.17,ry:.05},{c:[0,.44,-.05],rx:.19,ry:.04},{c:[0,.45,.16],rx:.16,ry:.04},{c:[0,.5,.3],rx:.1,ry:.05}],12),null,W],
  RB(.36,.14,.07,0,.55,-.24,Wd,.035,-.3),RB(.22,.12,.1,0,.54,.3,Wd,.04,.25),CY(.028,.032,.14,0,.64,.36,Wd,8,.25),CY(.05,.05,.025,0,.715,.38,Wd,10,.25),
  RB(.03,.42,.2,-.44,.22,.06,W,.015,0,0,-.06),RB(.03,.42,.2,.44,.22,.06,W,.015,0,0,.06),RB(.1,.04,.12,-.46,-.01,.06,0x4a4a50,.015),RB(.1,.04,.12,.46,-.01,.06,0x4a4a50,.015),
  RB(.13,.28,.3,-.43,.25,-.52,0x6a4020,.045),RB(.13,.28,.3,.43,.25,-.52,0x6a4020,.045),[new THREE.CylinderGeometry(.11,.11,.72,12),M(0,.5,-.5,0,0,Math.PI/2),0x5a6a4a],
  [loft([{c:[0,.1,.4],rx:.432,ry:.4,dn:1.47},{c:[0,.1,.46],rx:.432,ry:.4,dn:1.47}],18,{open:true,arc:[Math.PI*1.12,Math.PI*1.88],up:[0,1,0]}),null,Wd]];
 const tkp=piv(trunk,0,-.0,0);tkp.scale.set(.96,1,.9);h.tack=mesh(tkp,tk,mat);h.seat=piv(trunk,0,.53,.08);h.back=piv(trunk,0,.5,-.56);
 // neck: crest on local -z, throat on +z; mane falls to the left
 const nk=piv(trunk,0,.3,.78);nk.rotation.x=.7;h.neck=nk;
 const neck=loft([[-.16,.24,.38,.98,.0],[.1,.19,.3,1.05,.0],[.38,.142,.21,1.12,-.01],[.65,.118,.16,1.18,-.02],[.86,.108,.14,1.05,.0],[.96,.1,.12,1,.01]].map(([y,rx,ry,dn,oz])=>({c:[0,y,oz],rx,ry,dn})),18,{up:[0,1,0]});
 const NK=[[-.16,.38*.98],[.1,.3*1.05],[.38,.2*1.12],[.65,.155*1.18],[.86,.14*1.05],[.96,.12]],crest=y=>{for(let i=0;i<NK.length-1;i++)if(y<=NK[i+1][0]){const t=(y-NK[i][0])/(NK[i+1][0]-NK[i][0]);return lerp(NK[i][1],NK[i+1][1],t);}return .12;};
 const mane=[];const mr=rng(coat.c);for(let i=0;i<17;i++){const y=-.02+i*.057,cz=-crest(y)+.01;mane.push(RB(.03,.2+mr()*.06,.06,-.05,y,cz-.01,coat.m,.012,.15,0,.55+mr()*.2));mane.push(RB(.025,.12,.05,.02,y+.03,cz-.02,coat.m,.01,.1,0,-.2));}
 mesh(nk,[[neck,null,c],...mane],mat);
 // head: poll -> jowl -> nasal bone -> muzzle; ears, eyes, nostrils, forelock, bridle
 const hd=piv(nk,0,.9,0);hd.rotation.x=1.5;h.head=hd;
 const head=loft([[-.08,.09,.1,1,.0],[.02,.112,.17,.88,.05],[.13,.122,.195,.82,.07],[.26,.105,.13,.9,.02],[.4,.084,.1,.95,.005],[.54,.08,.096,.95,.012],[.63,.086,.098,.95,.02],[.69,.072,.08,1,.024],[.725,.04,.045,1,.024]].map(([y,rx,ry,dn,oz])=>({c:[0,y,oz],rx,ry,dn})),14,{up:[0,1,0]});
 const hp=[[head,null,c],[new THREE.ConeGeometry(.042,.17,6),M(-.06,-.05,-.095,-Math.PI/2-.35,0,.28,1,1,.65),c],[new THREE.ConeGeometry(.042,.17,6),M(.06,-.05,-.095,-Math.PI/2-.35,0,-.28,1,1,.65),c],
  SS(.03,-.112,.15,-.045,0x0a0806,.7,1,1,8,6),SS(.03,.112,.15,-.045,0x0a0806,.7,1,1,8,6),SS(.017,-.045,.705,-.03,0x0a0806,1,1.3,.8,6,5),SS(.017,.045,.705,-.03,0x0a0806,1,1.3,.8,6,5),
  RB(.1,.012,.06,0,.7,.07,0x1a1410,.005),RB(.07,.14,.04,0,-.02,-.11,coat.m,.015,.6),RB(.05,.1,.03,.02,.02,-.115,coat.m,.012,.5,0,.3),
  [new THREE.TorusGeometry(.105,.012,5,16),M(0,.5,.01,Math.PI/2,0,0,1,1.05,1),0x2a1a10],RB(.012,.5,.03,-.122,.25,.0,0x2a1a10,.005),RB(.012,.5,.03,.122,.25,.0,0x2a1a10,.005),[new THREE.TorusGeometry(.115,.012,5,16),M(0,.0,-.0,Math.PI/2,0,0,1,1.25,1),0x2a1a10],
  [new THREE.TorusGeometry(.03,.006,5,10),M(-.08,.6,.04,0,Math.PI/2),0x8a8a90],[new THREE.TorusGeometry(.03,.006,5,10),M(.08,.6,.04,0,Math.PI/2),0x8a8a90]];
 if(coat.blaze)hp.push(RB(.05,.42,.02,0,.38,-.1,0xf0ece4,.01,-.05));
 mesh(hd,hp,mat);
 // tail: dock + flowing hair strands
 const tl=piv(trunk,0,.24,-.96);h.tail=tl;const tp=[[loft([{c:[0,.05,0],rx:.07,ry:.07},{c:[0,-.12,-.03],rx:.06,ry:.06},{c:[0,-.25,-.04],rx:.045,ry:.045}],8),null,coat.m]];
 const tr=rng(7);for(let i=0;i<10;i++){const a=i/10*6.28,len=.75+tr()*.35,g=new THREE.ConeGeometry(.035+tr()*.02,len,5,3);g.translate(0,-len/2,0);const p=g.attributes.position;for(let k=0;k<p.count;k++){const y=p.getY(k);p.setZ(k,p.getZ(k)-y*y*.12);}g.computeVertexNormals();tp.push([g,M(Math.cos(a)*.03,-.08,Math.sin(a)*.03,.06*Math.sin(a),0,.08*Math.cos(a)),dk(coat.m,.85+tr()*.3)]);}
 mesh(tl,tp,mat);
 // legs: [x, z, front]; upper (forearm / gaskin) -> knee/hock -> cannon -> fetlock -> pastern + hoof
 const ld=(arr,col,seg=12)=>loft(arr.map(([y,rx,ry,dn,oz])=>({c:[0,y,oz||0],rx,ry,dn})),seg,{up:[0,1,0]});
 for(const[x,z,f]of[[-.2,.68,1],[.2,.68,1],[-.215,-.63,0],[.215,-.63,0]]){const up=piv(trunk,x,-.15,z);
  const U=f?ld([[.24,.14,.2],[.02,.125,.155],[-.22,.098,.11,1,.01],[-.44,.07,.074],[-.54,.074,.08],[-.6,.066,.072]],c):ld([[.3,.17,.24,1,.02],[.02,.145,.2,1,-.02],[-.2,.1,.13,1,-.04],[-.42,.068,.088,1,-.06],[-.52,.064,.1,1.15,-.075],[-.6,.06,.075,1,-.06]],c);
  mesh(up,[[U,null,c]],mat);const lo=piv(up,0,-.58,f?0:-.06);
  const sock=coat.sock&&!f?0xf0ece4:coat.l,LP=[[ld([[.02,.066,.074],[-.1,.054,.058,1.25],[-.32,.05,.056,1.3],[-.39,.064,.07],[-.43,.058,.064]],sock,10),null,sock]];const loM=mesh(lo,LP,mat);
  const pa=piv(lo,0,-.44,0),PP=[[ld([[.0,.054,.058],[-.1,.048,.05,1,.03],[-.14,.05,.052,1,.04]],sock,8),null,sock],[new THREE.CylinderGeometry(.056,.074,.1,12),M(0,-.19,.045,-.12),0x2a2620],RB(.15,.012,.15,0,-.24,.04,0x1a1612,.01)];const paM=mesh(pa,PP,mat);
  // LOW quality stand-in: cannon + pastern + hoof as one mesh (one draw call instead of two)
  const T=new THREE.Matrix4().makeTranslation(0,-.44,0),lowM=mesh(lo,[...LP,...PP.map(([g,m,c])=>[g,m?T.clone().multiply(m):T,c])],mat);lowM.visible=false;h.lod.push({full:[loM,paM],low:lowM});
  h.legs.push({up,lo,pa,f,side:x<0?'L':'R'});}
 root.scale.setScalar(.88);root.traverse(o=>{if(o.isMesh)o.castShadow=true;});return h;}

// gait blend: walk (4-beat lateral) -> trot (diagonal) -> canter (3-beat) -> gallop (4-beat). offsets [LF,RF,LH,RH]
const GAITS=[{v:0,off:[.25,.75,0,.5],A:.32,K:.7,stride:1.7,bob:.02},{v:2.6,off:[.25,.75,0,.5],A:.36,K:.75,stride:1.8,bob:.025},{v:5,off:[0,.5,.5,0],A:.5,K:1,stride:2.6,bob:.06},{v:8.5,off:[.36,.7,0,.36],A:.68,K:1.15,stride:3.6,bob:.07},{v:14,off:[.5,.62,0,.12],A:.92,K:1.3,stride:5.4,bob:.09}];
export function gaitOf(v){if(v<1)return'IDLE';if(v<3.6)return'WALK';if(v<6.6)return'TROT';if(v<11)return'CANTER';return'GALLOP';}
// st: {speed, turn, dead, rear, eat, drink}
export function horseLOD(h,low){for(const L of h.lod){L.low.visible=low;for(const m of L.full)m.visible=!low;}}
export function animHorse(h,st,dt,time){const v=Math.max(0,st.speed),sm=1-Math.exp(-dt*12);let i=0;while(i<GAITS.length-2&&v>GAITS[i+1].v)i++;const a=GAITS[i],b=GAITS[i+1],t=cl((v-a.v)/(b.v-a.v),0,1),L=(x,y)=>x+(y-x)*t;
 const moving=cl(v/1.2,0,1),stride=L(a.stride,b.stride),A=L(a.A,b.A)*moving,K=L(a.K,b.K)*moving,bob=L(a.bob,b.bob)*moving;h.ph=(h.ph+dt*v/stride)%1;
 const gal=cl((v-8)/5,0,1),trot=cl(1-Math.abs(v-5)/2.2,0,1);
 if(st.dead){h.die=Math.min(1,(h.die||0)+dt*1.4);const d=h.die;h.trunk.rotation.z=k(h.trunk.rotation.z,1.45*d*d,sm);h.trunk.position.y=k(h.trunk.position.y,1.42-.85*d,sm);for(const g of h.legs){g.up.rotation.x=k(g.up.rotation.x,(g.f?-.4:.4)*d,sm);g.lo.rotation.x=k(g.lo.rotation.x,.3*d,sm);g.pa.rotation.x=k(g.pa.rotation.x,.5*d,sm);}h.neck.rotation.x=k(h.neck.rotation.x,1.2,sm);return;}
 h.die=0;h.trunk.rotation.z=k(h.trunk.rotation.z,cl(-st.turn*v*.012,-.14,.14),sm);
 for(let j=0;j<4;j++){const g=h.legs[j],off=L(a.off[j],b.off[j]),th=(h.ph+off)*Math.PI*2,sw=Math.sin(th),lf=Math.max(0,Math.cos(th));
  let up=-sw*A,lo=lf*K*(g.f?1:-.8),pa=lf*K*.85-(1-lf)*.14*moving;if(!g.f){up+=.06;lo+=-.04;}if(st.rear&&g.f){up=-1.1;lo=1.6;pa=.9;}g.up.rotation.x=k(g.up.rotation.x,up,sm*1.6);g.lo.rotation.x=k(g.lo.rotation.x,lo,sm*1.6);g.pa.rotation.x=k(g.pa.rotation.x,pa,sm*1.6);}
 const ph2=h.ph*Math.PI*2;const yb=-Math.abs(Math.sin(ph2*(1+trot)))*bob*(1+trot)+Math.sin(ph2)*gal*.06;h.trunk.position.y=k(h.trunk.position.y,1.42+yb+(st.rear?.5:0),sm*1.6);h.bounce=yb;
 h.trunk.rotation.x=k(h.trunk.rotation.x,Math.sin(ph2)*gal*.09+(st.rear?-.75:0)+(st.slope||0),sm);
 const nod=Math.sin(ph2*2)*.06*moving*(1-trot*.7)+Math.sin(ph2)*gal*.12;const down=st.eat?1.2:0;h.neck.rotation.x=k(h.neck.rotation.x,.7+gal*.3+nod+down+(st.rear?-.45:0),sm);
 h.head.rotation.x=k(h.head.rotation.x,1.55-gal*.2+Math.sin(time*.6)*.04*(1-moving)-down*.3,sm);h.neck.rotation.y=k(h.neck.rotation.y,cl(st.turn*.4,-.4,.4)+Math.sin(time*.37)*.12*(1-moving),sm);
 h.tail.rotation.x=k(h.tail.rotation.x,.2+gal*.45+v*.015+Math.sin(time*1.7+h.ph*12.6*moving)*(.06+gal*.1),sm);h.tail.rotation.z=Math.sin(time*2.1+h.ph*6)*.12*(1-gal*.5);}
