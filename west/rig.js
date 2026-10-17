// DUSTWATER — procedural characters: an articulated frontier rig (hat, duster, vest, gunbelt, bandana) with walk / run / aim /
// lasso / ride / sit / surrender / hogtied / carried / draped / duel / death poses; the horse rig with blended four-beat walk,
// diagonal trot, three-beat canter and four-beat gallop; revolver, lever rifle and lasso models. Rig structure adapted from Storm Royale.
import * as THREE from '../vendor/three.module.min.js';
import {V,M,merge,cl,lerp,rbox,cap} from './util.js';

export const LOOKS={
 player:{skin:0xc99470,hat:0x4a3624,band:0x2a1a10,shirt:0xd4c8ae,vest:0x34343c,coat:0x6e5236,pants:0x4a4238,boot:0x2a1c14,kerch:0x8a2a22,belt:0x3a2414,hair:0x3a2618,coatLen:1,stache:1},
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

export function makeRig(o,mat){const root=new THREE.Group(),body=piv(root,0,0,0),hips=piv(body,0,.95,0);const r={root,body,hips,o,mat};
 // hips: trousers, gunbelt + holster
 mesh(hips,[RB(.36,.2,.24,0,0,0,o.pants,.07),RB(.39,.07,.27,0,.07,0,o.belt,.03),RB(.07,.06,.03,0,.07,.14,0xb89a50,.01),RB(.08,.2,.1,-.21,-.1,.02,o.belt,.03,0,0,.1)].concat(o.dress?[[new THREE.CylinderGeometry(.21,.36,.7,14,1,true),M(0,-.3,0),o.dress]]:[]),mat);
 for(const s of[-1,1]){const th=piv(hips,s*.105,-.06,0);mesh(th,[CP(.085,.3,0,0,0,o.pants)],mat);const kn=piv(th,0,-.44,0);
  mesh(kn,[CP(.07,.22,0,.02,0,o.pants),CY(.075,.065,.3,0,-.27,0,o.boot,10),RB(.12,.08,.26,0,-.44,.05,o.boot,.035),RB(.11,.04,.06,0,-.47,-.08,dk(o.boot,.5),.01),[new THREE.TorusGeometry(.035,.008,4,8),M(0,-.44,-.11,0,Math.PI/2),0xb0a890]],mat);r[s<0?'thR':'thL']=th;r[s<0?'knR':'knL']=kn;}
 if(o.dress){r.thL.visible=r.thL.visible;}
 const sp=piv(hips,0,.08,0);r.spine=sp;
 const tor=[RB(.38,.44,.23,0,.26,0,o.shirt,.09),RB(.42,.12,.25,0,.45,0,o.shirt,.05),RB(.4,.34,.245,0,.22,0,o.vest,.07),RB(.06,.36,.02,-.07,.24,.122,o.shirt,.01),RB(.06,.36,.02,.07,.24,.122,o.shirt,.01),[new THREE.TorusGeometry(.085,.03,6,12),M(0,.52,0,Math.PI/2),o.shirt]];
 if(o.kerch)tor.push([new THREE.ConeGeometry(.1,.14,4),M(0,.44,.12,Math.PI,0,0,1,1,.5),o.kerch],[new THREE.TorusGeometry(.08,.025,5,10),M(0,.5,.01,Math.PI/2+.2),o.kerch]);
 mesh(sp,tor,mat);
 // duster coat: shoulders/back on the spine + a tail hanging from the hips that sways with them
 if(o.coatLen){mesh(sp,[RB(.43,.46,.26,0,.25,-.005,o.coat,.09),RB(.47,.12,.27,0,.46,0,o.coat,.05),RB(.13,.12,.06,-.14,.42,.12,dk(o.coat,.8),.03,.3,0,.3),RB(.13,.12,.06,.14,.42,.12,dk(o.coat,.8),.03,.3,0,-.3)],mat);
  const tail=piv(hips,0,.05,0);const g=new THREE.CylinderGeometry(.24,.34,.6*o.coatLen,14,2,true,Math.PI*.18,Math.PI*1.64);g.translate(0,-.3*o.coatLen,0);mesh(tail,[[g,M(0,0,-.01,0,Math.PI,0,1,1,.82),o.coat]],mat).material=mat;r.tail=tail;}
 if(o.poncho){mesh(sp,[[new THREE.ConeGeometry(.5,.55,8,1,true),M(0,.3,0,0,Math.PI/8),o.poncho],[new THREE.ConeGeometry(.48,.06,8,1,true),M(0,.04,0,0,Math.PI/8),0xe0c890]],mat);}
 const nk=piv(sp,0,.53,0);r.neck=nk;const hp=[CY(.06,.07,.1,0,.04,0,o.skin),SS(.115,0,.19,.0,o.skin,.95,1.15,1.04),RB(.15,.09,.12,0,.115,.03,o.skin,.05),SS(.025,0,.18,.115,o.skin,1,1.2,1.3,8,6),
  SS(.015,-.042,.205,.1,0x1a1410,1,.7,.5,6,5),SS(.015,.042,.205,.1,0x1a1410,1,.7,.5,6,5),RB(.045,.012,.015,-.043,.228,.1,o.hair,.004,0,0,.12),RB(.045,.012,.015,.043,.228,.1,o.hair,.004,0,0,-.12),SS(.025,-.112,.19,0,o.skin,.5,1,1,6,5),SS(.025,.112,.19,0,o.skin,.5,1,1,6,5),
  SS(.12,0,.22,-.025,o.hair,1,1,1.04)];
 if(o.stache)hp.push(RB(.08,.018,.02,0,.145,.112,o.hair,.008));if(o.long)hp.push(RB(.22,.22,.08,0,.13,-.08,o.hair,.04));
 if(o.mask&&o.kerch)hp.push([new THREE.CylinderGeometry(.125,.13,.11,14,1,true,-Math.PI*.55,Math.PI*1.1),M(0,.13,.0),o.kerch],[new THREE.ConeGeometry(.1,.12,3),M(0,.07,.1,Math.PI,0,0,1.2,1,.4),o.kerch]);
 hp.push(...hatParts(o,.285));mesh(nk,hp,mat);
 for(const s of[-1,1]){const sh=piv(sp,s*.245,.44,0);const sc=o.coatLen?o.coat:o.shirt;mesh(sh,[SS(.085,0,0,0,sc,1,1,1,10,8),CP(.068,.2,0,-.02,0,sc)],mat);const el=piv(sh,0,-.3,0);
  mesh(el,[CP(.058,.17,0,0,0,o.coatLen?o.coat:o.shirt),CY(.048,.045,.06,0,-.25,0,o.shirt),RB(.08,.1,.05,0,-.31,.0,o.skin,.025),RB(.03,.06,.03,s*-.035,-.29,.03,o.skin,.012)],mat);r[s<0?'shR':'shL']=sh;r[s<0?'elR':'elL']=el;}
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
 if(!H.rev){H.rev=revolverMesh(r.mat);H.rifle=rifleMesh(r.mat);H.lasso=lassoMesh(r.mat);H.coil=lassoMesh(r.mat);H.coil.scale.setScalar(.9);r.hips.add(H.coil);H.coil.position.set(.2,.0,.06);H.coil.rotation.set(0,0,1.4);}
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
export const COATS=[{c:0x6a3a1e,m:0x1a1210,l:0x1e1612,n:'BAY'},{c:0x8e4a22,m:0x6a3a1a,l:0x7a4020,n:'CHESTNUT'},{c:0x2a2420,m:0x141210,l:0x1a1614,n:'BLACK'},{c:0xc8c0b4,m:0xe8e4dc,l:0x8a8680,n:'GREY'},{c:0xc8a060,m:0xf0e6c8,l:0xa88050,n:'PALOMINO'},{c:0x5a4a3e,m:0x2a2018,l:0x2a2018,n:'DUN'}];
export function makeHorse(coat,mat){const root=new THREE.Group(),trunk=piv(root,0,1.42,0);const h={root,trunk,coat,legs:[],ph:0,bob:0};const c=coat.c,cd=dk(c,.82);
 mesh(trunk,[SS(.5,0,0,0,c,.74,.84,1.95,18,12),SS(.47,0,.05,.74,c,.8,.98,.92,14,10),SS(.5,0,.07,-.72,c,.82,.9,.98,14,10),SS(.32,0,-.2,0,cd,.95,.55,2.2,12,8),
  SS(.14,-.22,.1,-.9,c,.6,1.5,1.2,8,6),SS(.14,.22,.1,-.9,c,.6,1.5,1.2,8,6),SS(.13,-.24,.05,.7,c,.6,1.4,1.2,8,6),SS(.13,.24,.05,.7,c,.6,1.4,1.2,8,6)],mat);
 // tack: blanket, saddle, horn, stirrups, saddlebags, bedroll
 const tk=[RB(.78,.05,.95,0,.56,.1,0x7a2a1e,.02),RB(.74,.02,.9,0,.585,.1,0xd8b060,.01),RB(.46,.14,.62,0,.66,.1,0x5a3418,.06),RB(.4,.12,.16,0,.74,-.17,0x4a2a14,.05),RB(.12,.12,.14,0,.75,.38,0x4a2a14,.04),CY(.03,.035,.12,0,.82,.44,0x3a2010,8),
  RB(.04,.5,.06,-.37,.33,.12,0x3a2010,.01),RB(.04,.5,.06,.37,.33,.12,0x3a2010,.01),RB(.08,.05,.12,-.39,.07,.12,0x4a4a50,.015),RB(.08,.05,.12,.39,.07,.12,0x4a4a50,.015),
  RB(.12,.3,.32,-.38,.42,-.5,0x6a4020,.04),RB(.12,.3,.32,.38,.42,-.5,0x6a4020,.04),[new THREE.CylinderGeometry(.11,.11,.7,10),M(0,.7,-.45,0,0,Math.PI/2),0x5a6a4a],RB(.1,.04,.7,0,-.29,.1,0x3a2010,.01)];
 const tkp=piv(trunk,0,-.13,0);h.tack=mesh(tkp,tk,mat);h.seat=piv(trunk,0,.55,.1);h.back=piv(trunk,0,.5,-.6);
 // neck + head
 const nk=piv(trunk,0,.28,.92);nk.rotation.x=.7;h.neck=nk;const ng=new THREE.CylinderGeometry(.2,.32,1.05,12);ng.translate(0,.48,0);
 const mane=[];for(let i=0;i<10;i++)mane.push(RB(.07,.2,.14,0,.12+i*.095,-.22+i*.008,coat.m,.03,.25));mesh(nk,[[ng,M(0,0,0,0,0,0,.9,1,1),c],...mane],mat);
 const hd=piv(nk,0,1.0,0);hd.rotation.x=1.5;h.head=hd;
 mesh(hd,[RB(.24,.6,.3,0,.26,0,c,.1),RB(.21,.24,.26,0,.56,.03,cd,.1),SS(.03,-.12,.12,.08,0x0a0808,1,1,1,6,5),SS(.03,.12,.12,.08,0x0a0808,1,1,1,6,5),[new THREE.ConeGeometry(.045,.16,5),M(-.08,-.05,-.08,-.3,0,.3),c],[new THREE.ConeGeometry(.045,.16,5),M(.08,-.05,-.08,-.3,0,-.3),c],
  RB(.14,.12,.1,0,-.02,.1,coat.m,.04),RB(.26,.03,.32,0,.45,0,0x2a1a10,.01),RB(.26,.03,.32,0,.2,0,0x2a1a10,.01),SS(.022,-.06,.68,.1,0x0a0808,1,1,1,6,5),SS(.022,.06,.68,.1,0x0a0808,1,1,1,6,5)],mat);
 // tail
 const tl=piv(trunk,0,.28,-1.04);h.tail=tl;const tg=new THREE.ConeGeometry(.2,1.1,9,4);tg.scale(.7,1,1);tg.translate(0,-.52,0);const tp=tg.attributes.position;for(let i=0;i<tp.count;i++){const y=tp.getY(i);tp.setZ(i,tp.getZ(i)-y*y*.12);}tg.computeVertexNormals();mesh(tl,[[tg,M(0,0,0,.35),coat.m],SS(.08,0,0,0,coat.m)],mat);
 // legs: [x, z, front]; upper (forearm / gaskin) + lower (cannon) + hoof
 for(const[x,z,f]of[[-.24,.78,1],[.24,.78,1],[-.25,-.78,0],[.25,-.78,0]]){const up=piv(trunk,x,-.15,z*.92);const ul=.62;
  mesh(up,f?[CY(.1,.075,ul,0,-ul/2,0,c,10),SS(.12,0,0,0,c,1,1.3,1.2,8,6)]:[CY(.13,.08,ul,0,-ul/2,-.04,c,10,-.15),SS(.15,0,0,-.03,c,1,1.4,1.4,8,6)],mat);
  const lo=piv(up,0,-ul,f?0:-.08);mesh(lo,[SS(.075,0,0,0,coat.l),CY(.055,.05,.48,0,-.24,0,coat.l,8),SS(.064,0,-.49,.01,coat.l,1,1,1.1,8,6),CY(.07,.085,.09,0,-.56,.03,0x222018,10)],mat);
  h.legs.push({up,lo,f,side:x<0?'L':'R'});}
 root.scale.setScalar(.9);root.traverse(o=>{if(o.isMesh)o.castShadow=true;});return h;}

// gait blend: walk (4-beat lateral) -> trot (diagonal) -> canter (3-beat) -> gallop (4-beat). offsets [LF,RF,LH,RH]
const GAITS=[{v:0,off:[.25,.75,0,.5],A:.32,K:.7,stride:1.7,bob:.02},{v:2.6,off:[.25,.75,0,.5],A:.36,K:.75,stride:1.8,bob:.025},{v:5,off:[0,.5,.5,0],A:.5,K:1,stride:2.6,bob:.06},{v:8.5,off:[.36,.7,0,.36],A:.68,K:1.15,stride:3.6,bob:.07},{v:14,off:[.5,.62,0,.12],A:.92,K:1.3,stride:5.4,bob:.09}];
export function gaitOf(v){if(v<1)return'IDLE';if(v<3.6)return'WALK';if(v<6.6)return'TROT';if(v<11)return'CANTER';return'GALLOP';}
// st: {speed, turn, dead, rear, eat, drink}
export function animHorse(h,st,dt,time){const v=Math.max(0,st.speed),sm=1-Math.exp(-dt*12);let i=0;while(i<GAITS.length-2&&v>GAITS[i+1].v)i++;const a=GAITS[i],b=GAITS[i+1],t=cl((v-a.v)/(b.v-a.v),0,1),L=(x,y)=>x+(y-x)*t;
 const moving=cl(v/1.2,0,1),stride=L(a.stride,b.stride),A=L(a.A,b.A)*moving,K=L(a.K,b.K)*moving,bob=L(a.bob,b.bob)*moving;h.ph=(h.ph+dt*v/stride)%1;
 const gal=cl((v-8)/5,0,1),trot=cl(1-Math.abs(v-5)/2.2,0,1);
 if(st.dead){h.die=Math.min(1,(h.die||0)+dt*1.4);const d=h.die;h.trunk.rotation.z=k(h.trunk.rotation.z,1.45*d*d,sm);h.trunk.position.y=k(h.trunk.position.y,1.42-.85*d,sm);for(const g of h.legs){g.up.rotation.x=k(g.up.rotation.x,(g.f?-.4:.4)*d,sm);g.lo.rotation.x=k(g.lo.rotation.x,.3*d,sm);}h.neck.rotation.x=k(h.neck.rotation.x,1.2,sm);return;}
 h.die=0;h.trunk.rotation.z=k(h.trunk.rotation.z,cl(-st.turn*v*.012,-.14,.14),sm);
 for(let j=0;j<4;j++){const g=h.legs[j],off=L(a.off[j],b.off[j]),th=(h.ph+off)*Math.PI*2,sw=Math.sin(th),lf=Math.max(0,Math.cos(th));
  let up=-sw*A,lo=lf*K*(g.f?1:-.8);if(!g.f){up+=.12;lo+=-.1;}if(st.rear&&g.f){up=-1.1;lo=1.6;}g.up.rotation.x=k(g.up.rotation.x,up,sm*1.6);g.lo.rotation.x=k(g.lo.rotation.x,lo,sm*1.6);}
 const ph2=h.ph*Math.PI*2;const yb=-Math.abs(Math.sin(ph2*(1+trot)))*bob*(1+trot)+Math.sin(ph2)*gal*.06;h.trunk.position.y=k(h.trunk.position.y,1.42+yb+(st.rear?.5:0),sm*1.6);h.bounce=yb;
 h.trunk.rotation.x=k(h.trunk.rotation.x,Math.sin(ph2)*gal*.09+(st.rear?-.75:0)+(st.slope||0),sm);
 const nod=Math.sin(ph2*2)*.06*moving*(1-trot*.7)+Math.sin(ph2)*gal*.12;const down=st.eat?1.2:0;h.neck.rotation.x=k(h.neck.rotation.x,.7+gal*.3+nod+down+(st.rear?-.45:0),sm);
 h.head.rotation.x=k(h.head.rotation.x,1.55-gal*.2+Math.sin(time*.6)*.04*(1-moving)-down*.3,sm);h.neck.rotation.y=k(h.neck.rotation.y,cl(st.turn*.4,-.4,.4)+Math.sin(time*.37)*.12*(1-moving),sm);
 h.tail.rotation.x=k(h.tail.rotation.x,.2+gal*.45+v*.015+Math.sin(time*1.7+h.ph*12.6*moving)*(.06+gal*.1),sm);h.tail.rotation.z=Math.sin(time*2.1+h.ph*6)*.12*(1-gal*.5);}
