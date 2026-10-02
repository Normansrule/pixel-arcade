// SKATE CITY — the skater: articulated procedural rig (2-bone IK legs/arms placed on the board), board model,
// trick poses (flips, grabs, grinds, manuals, lips, pushing) and a verlet ragdoll for bails.
import * as THREE from '../vendor/three.module.min.js';
import {ctex} from './tex.js';
const V=THREE.Vector3,Q=THREE.Quaternion,M4=THREE.Matrix4,cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k;
export const J={pel:0,chest:1,head:2,lsh:3,lel:4,lha:5,rsh:6,rel:7,rha:8,lhi:9,lkn:10,lft:11,rhi:12,rkn:13,rft:14};
const NJ=15,THIGH=.45,SHIN=.44,UARM=.29,FARM=.27,DECK=.105;
const BONES=[[J.lsh,J.lel,UARM,.052,'shirt'],[J.lel,J.lha,FARM,.043,'skin'],[J.rsh,J.rel,UARM,.052,'shirt'],[J.rel,J.rha,FARM,.043,'skin'],[J.lhi,J.lkn,THIGH,.072,'pants'],[J.lkn,J.lft,SHIN,.058,'pants'],[J.rhi,J.rkn,THIGH,.072,'pants'],[J.rkn,J.rft,SHIN,.058,'pants']];
export const DECKS=['flame','stripes','check','wave','star','dots'];
export const COLORS={shirt:['#e23b2e','#2e6fe2','#f2f2f2','#1d1d22','#ffb000','#2fbf71','#8a4bd8','#ff6aa2'],pants:['#2a3550','#1d1d22','#7b6a4e','#4a5a3a','#9aa3ad','#3a2a22'],shoes:['#f2f2f2','#1d1d22','#d23b2e','#2e6fe2','#ffb000'],cap:['#1d1d22','#e23b2e','#2e6fe2','#ffb000','#f2f2f2','none'],skin:['#f1c7a5','#d9a27a','#a96f4a','#7a4a2e','#4e2f1d']};

function deckGraphic(kind,c1,c2){return ctex(128,512,(x,w,h)=>{x.fillStyle=c1;x.fillRect(0,0,w,h);x.fillStyle=c2;
 if(kind==='flame'){for(let i=0;i<7;i++){x.beginPath();x.moveTo(0,h);for(let y=h;y>h*.25;y-=20)x.lineTo(w/2+Math.sin(y*.05+i)*w*.45,y-i*30);x.lineTo(w,h);x.fill();}}
 else if(kind==='stripes'){for(let i=0;i<10;i++)x.fillRect(0,i*52,w,22);}
 else if(kind==='check'){for(let r=0;r<16;r++)for(let c=0;c<4;c++)if((r+c)%2)x.fillRect(c*32,r*32,32,32);}
 else if(kind==='wave'){x.lineWidth=12;x.strokeStyle=c2;for(let i=0;i<8;i++){x.beginPath();for(let y=0;y<=h;y+=8)x.lineTo(w/2+Math.sin(y*.04+i)*40,y);x.stroke();x.translate(0,0);}}
 else if(kind==='star'){x.translate(w/2,h/2);for(let k=0;k<2;k++){x.beginPath();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=i%2?22:56;x.lineTo(Math.sin(a)*r,Math.cos(a)*r);}x.fill();x.translate(0,0);}x.setTransform(1,0,0,1,0,0);}
 else{for(let i=0;i<60;i++){x.beginPath();x.arc(Math.random()*w,Math.random()*h,4+Math.random()*10,0,7);x.fill();}}
 x.fillStyle='rgba(255,255,255,.85)';x.font='bold 30px Anton, Impact, sans-serif';x.save();x.translate(w/2+10,h/2);x.rotate(-Math.PI/2);x.textAlign='center';x.fillText('SKATE CITY',0,0);x.restore();},{clamp:true});}
const GRIP=ctex(64,256,(x,w,h)=>{x.fillStyle='#1b1b1e';x.fillRect(0,0,w,h);for(let i=0;i<2400;i++){x.fillStyle=`rgba(255,255,255,${Math.random()*.12})`;x.fillRect(Math.random()*w,Math.random()*h,1,1);}});

export function makeBoard(look){const g=new THREE.Group();
 const geo=new THREE.BoxGeometry(.21,.013,.8,4,1,28),p=geo.attributes.position;
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const az=Math.abs(z);if(az>.27)y+=(az-.27)*.42;const t=cl((az-.29)/.11,0,1);x*=Math.sqrt(1-t*t*.82);p.setXYZ(i,x,y+.092,z);}geo.computeVertexNormals();
 const ply=new THREE.MeshStandardMaterial({color:0xc9a27a,roughness:.7});
 const deck=new THREE.Mesh(geo,[ply,ply,new THREE.MeshStandardMaterial({map:GRIP,roughness:.95}),new THREE.MeshStandardMaterial({map:deckGraphic(DECKS[look.deck%DECKS.length],look.deckA||'#141418',look.deckB||'#ff4d00'),roughness:.55}),ply,ply]);
 deck.castShadow=true;g.add(deck);
 const metal=new THREE.MeshStandardMaterial({color:0xb7bcc4,metalness:1,roughness:.32});const parts=[];
 for(const z of[-.25,.25]){const a=new THREE.BoxGeometry(.06,.014,.085);a.translate(0,.079,z);parts.push(a);const b=new THREE.BoxGeometry(.18,.024,.034);b.translate(0,.054,z+(z>0?-.012:.012));parts.push(b);const k=new THREE.CylinderGeometry(.012,.012,.03,6);k.translate(0,.068,z);parts.push(k);}
 const trucks=new THREE.Mesh(mergeSimple(parts),metal);trucks.castShadow=true;g.add(trucks);
 const wg=[];for(const z of[-.25,.25])for(const x of[-.098,.098]){const w=new THREE.CylinderGeometry(.027,.027,.03,14);w.rotateZ(Math.PI/2);w.translate(x,.027,z);wg.push(w);}
 const wheels=new THREE.Mesh(mergeSimple(wg),new THREE.MeshStandardMaterial({color:look.wheel||0xf0ead8,roughness:.5}));wheels.castShadow=true;g.add(wheels);
 g.userData.wheels=wheels;return g;}
export function mergeSimple(list){let n=0;const gs=list.map(g=>g.index?g.toNonIndexed():g);gs.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
 for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));return r;}

// 2-bone IK: joint position for root a, target t, bone lengths l1/l2, bend toward pole direction
const _d=new V(),_p=new V();
function ik(a,t,l1,l2,pole,out){_d.subVectors(t,a);let d=_d.length();const mx=l1+l2-.001;if(d>mx){_d.multiplyScalar(mx/d);t.copy(a).add(_d);d=mx;}d=Math.max(d,Math.abs(l1-l2)+.01);_d.normalize();
 const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));_p.copy(pole).addScaledVector(_d,-pole.dot(_d)).normalize();return out.copy(a).addScaledVector(_d,x).addScaledVector(_p,h);}

export class Rig{
 constructor(scene,look){this.scene=scene;this.look=look;this.root=new THREE.Group();scene.add(this.root);
  const C=k=>new THREE.MeshStandardMaterial({color:look[k]==='none'?look.shirt:look[k],roughness:k==='skin'?.6:.85});
  this.mat={shirt:C('shirt'),pants:C('pants'),skin:C('skin'),shoes:C('shoes'),cap:C('cap'),sole:new THREE.MeshStandardMaterial({color:0xeeeeee,roughness:.8}),dark:new THREE.MeshStandardMaterial({color:0x151515,roughness:.5})};
  const mk=(geo,m)=>{const o=new THREE.Mesh(geo,m);o.castShadow=true;this.root.add(o);return o;};
  this.limbs=BONES.map(([a,b,len,r,m])=>({a,b,m:mk(new THREE.CapsuleGeometry(r,len,4,10),this.mat[m])}));
  this.torso=mk(new THREE.SphereGeometry(1,20,14),this.mat.shirt);this.belly=mk(new THREE.SphereGeometry(1,18,12),this.mat.shirt);this.hips=mk(new THREE.SphereGeometry(1,18,12),this.mat.pants);
  this.neck=mk(new THREE.CylinderGeometry(.045,.05,.12,8),this.mat.skin);
  const head=new THREE.Group();this.root.add(head);this.head=head;const hs=new THREE.Mesh(new THREE.SphereGeometry(.115,18,14),this.mat.skin);hs.castShadow=true;hs.scale.set(.95,1.05,1);head.add(hs);
  for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.016,8,6),this.mat.dark);e.position.set(s*.04,.015,.104);head.add(e);}const nose=new THREE.Mesh(new THREE.SphereGeometry(.018,8,6),this.mat.skin);nose.position.set(0,-.02,.115);head.add(nose);
  if(look.cap!=='none'){const cap=new THREE.Mesh(new THREE.SphereGeometry(.123,18,10,0,Math.PI*2,0,Math.PI/2),this.mat.cap);cap.position.y=.012;cap.castShadow=true;head.add(cap);
   const brim=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.012,16,1,false,-Math.PI/2,Math.PI),this.mat.cap);brim.position.set(0,.03,.09);brim.scale.set(1,1,.9);head.add(brim);}
  else{const hair=new THREE.Mesh(new THREE.SphereGeometry(.122,16,10,0,Math.PI*2,0,Math.PI*.55),this.mat.dark);hair.position.set(0,.01,-.008);head.add(hair);}
  this.hands=[mk(new THREE.SphereGeometry(.046,10,8),this.mat.skin),mk(new THREE.SphereGeometry(.046,10,8),this.mat.skin)];
  this.shoes=[0,1].map(()=>{const g=new THREE.Group();this.root.add(g);const u=new THREE.Mesh(new THREE.BoxGeometry(.105,.08,.27),this.mat.shoes);u.position.set(0,.0,.045);u.castShadow=true;const s=new THREE.Mesh(new THREE.BoxGeometry(.11,.025,.285),this.mat.sole);s.position.set(0,-.045,.045);g.add(u,s);return g;});
  this.board=makeBoard(look);this.root.add(this.board);
  this.J=[...Array(NJ)].map(()=>new V());this.L=[...Array(NJ)].map(()=>new V());this.shoeQ=[new Q(),new Q()];
  // smoothed pose parameters
  this.s={c:.15,lean:0,side:0,tw:0,by:0,bz:0,roll:0,pitch:0,yaw:0,tuck:0,armUp:0,grab:0,push:0};this.pushPh=0;this.rag=null;this.bd=null;this.vis=true;
  this.rootM=new M4();this.bM=new M4();this.t=0;}
 dispose(){this.scene.remove(this.root);this.root.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
 // compute the animated pose from the skater's state, then place every mesh
 update(sk,dt){this.t+=dt;if(sk.mode==='bail'&&this.rag){this.stepRag(sk,dt);this.draw();return;}
  if(this.rag){this.rag=null;this.bd=null;}
  const s=this.s,k=1-Math.exp(-dt*14),kf=1-Math.exp(-dt*24),tr=sk.trick,man=sk.man,g=sk.grind,lip=sk.lip;
  // targets
  let c=.18,lean=0,side=0,tw=.15,by=0,bz=0,roll=0,pitch=0,yaw=0,tuck=0,armUp=0,grab=0,push=0;
  if(sk.mode==='ground'){c=.42+sk.crouch*.5+Math.min(.12,sk.speed*.008);if(sk.pushing){push=1;tw=.75;c=.3;}if(sk.revT>0)yaw=Math.PI*(sk.revT/.25)*sk.revDir;}
  if(sk.mode==='air'){c=.42+sk.crouch*.3;armUp=.7;tw=.25+Math.sin(this.t*2)*.05;}
  if(man){const d=man.def;pitch=d.pitch;c=.35;lean=d.pitch>0?-.18:.18;side=man.bal*.25;if(d.special){pitch=1.2;lean=-.2;}}
  if(g){const d=g.def;yaw=d.yaw||0;pitch=d.pitch||0;roll=d.roll||0;bz=d.off||0;by=g.slide?-.088:-.05;c=.45;side=g.bal*.32;tw=g.slide?.05:.3;armUp=.35;}
  if(lip){const d=lip.def;pitch=d.pitch||0;bz=d.off||0;yaw=d.yaw||0;by=-.06;c=.5;lean=-.15;side=lip.bal*.25;armUp=.4;}
  if(tr&&sk.mode==='air'){const d=tr.def,kk=cl(tr.t/tr.dur,0,1);
   if(tr.kind==='flip'){const n=tr.n||1,e=kk<.5?2*kk*kk:1-Math.pow(-2*kk+2,2)/2;roll=d.roll*Math.PI*2*n*e;yaw=d.yaw*Math.PI*2*n*e;pitch=d.pitch*Math.PI*2*n*e;by=Math.sin(kk*Math.PI)*.32;tuck=Math.sin(kk*Math.PI);c=.55;}
   if(tr.kind==='grab'){grab=tr.held?Math.min(1,tr.t/.14):Math.max(0,1-tr.rel/.15);roll=d.roll*grab;pitch=d.pitch*grab;yaw=d.yaw*grab;by=.33*grab;c=.5+.35*grab;if(d.at==='over'){by=1.05*grab;tuck=grab;roll=d.roll*grab;}}}
  // flips and grab tweaks need snappy tracking; the rest eases
  const snap=tr&&sk.mode==='air'&&tr.kind==='flip';
  for(const[n,v]of Object.entries({c,lean,side,tw,armUp,push}))s[n]+=(v-s[n])*k;
  for(const[n,v]of Object.entries({by,bz,roll,pitch,yaw,tuck,grab}))s[n]=snap||n==='grab'?v:s[n]+(v-s[n])*kf;
  if(!tr||sk.mode!=='air'){if(Math.abs(s.roll)>1)s.roll=0;if(Math.abs(s.yaw)>2&&!(sk.revT>0))s.yaw=0;if(Math.abs(s.pitch)>1.4&&!man)s.pitch=0;}
  this.pose(sk,dt);
  // root transform
  this.rootM.compose(sk.p,sk.visQ||sk.q,new V(1,1,1));
  for(let i=0;i<NJ;i++)this.J[i].copy(this.L[i]).applyMatrix4(this.rootM);
  this.board.matrixAutoUpdate=false;this.board.matrix.multiplyMatrices(this.rootM,this.bM);this.board.matrixWorldNeedsUpdate=true;
  this.shoeW=[0,1].map(i=>new Q().setFromRotationMatrix(this.rootM).multiply(this.shoeQ[i]));
  this.draw();}
 pose(sk,dt){const s=this.s,L=this.L;const fakie=sk.fakie?-1:1;
  // board in root space (pivot at deck centre)
  const e=new THREE.Euler(s.pitch,s.yaw,s.roll,'YXZ');this.bM.makeRotationFromEuler(e);const piv=new V(0,.09,0),pp=piv.clone().applyMatrix4(this.bM);
  this.bM.setPosition(-pp.x,.09+s.by-pp.y,s.bz-pp.z+0);
  const bUp=new V(0,1,0).applyEuler(e);
  const footOn=(lz,lx)=>new V(lx,DECK+.06,lz).applyMatrix4(this.bM);
  let FL=footOn(.2,-.005),FR=footOn(-.25,.005);
  if(s.tuck>.01){const base=s.by+.2;FL.lerp(new V(0,base+.16,.2),s.tuck);FR.lerp(new V(0,base+.12,-.24),s.tuck);}
  // pushing: the back foot drops to the road and kicks back
  if(s.push>.02){this.pushPh=(this.pushPh+dt*1.5)%1;const ph=this.pushPh;const g=new V(-.17,.07,0);if(ph<.55){const q=ph/.55;g.z=lerp(.12,-.55,q);}else{const q=(ph-.55)/.45;g.z=lerp(-.55,.12,q);g.y=.07+Math.sin(q*Math.PI)*.16;}
   FR.lerp(g,s.push);FL.lerp(new V(-.01,DECK+.075,.1),s.push*.6);}
  // pelvis and spine
  const hipY=DECK+.075+(THIGH+SHIN)*(.98-.36*s.c)+s.by*.25*(1-s.tuck)+s.by*.15*s.tuck;
  const P=L[J.pel].set(.03+s.side*.3,hipY,-.02+s.lean*.25+(s.push>.02?-.05:0));
  const fa=.12+.5*s.c+(s.push*.15),tw=s.tw,S=new V(Math.sin(tw),0,Math.cos(tw)),face=new V().crossVectors(S,new V(0,1,0));
  const spine=new V(0,1,0).applyAxisAngle(S,fa).applyAxisAngle(new V(1,0,0),-s.lean*.6).applyAxisAngle(new V(0,0,1),s.side*.5).normalize();
  L[J.chest].copy(P).addScaledVector(spine,.46);
  L[J.lsh].copy(L[J.chest]).addScaledVector(S,.175).addScaledVector(spine,-.05);L[J.rsh].copy(L[J.chest]).addScaledVector(S,-.175).addScaledVector(spine,-.05);
  const look=face.clone().multiplyScalar(.4).add(new V(0,0,.9*fakie)).normalize();this.lookDir=look;this.spineV=spine;this.faceV=face;
  L[J.head].copy(L[J.chest]).addScaledVector(spine,.25).addScaledVector(look,.03);
  const S0=new V(Math.sin(tw*.35),0,Math.cos(tw*.35));L[J.lhi].copy(P).addScaledVector(S0,.1).addScaledVector(spine,-.06);L[J.rhi].copy(P).addScaledVector(S0,-.1).addScaledVector(spine,-.06);
  L[J.lft].copy(FL);L[J.rft].copy(FR);
  const pole=face.clone().add(new V(0,.15,0));ik(L[J.lhi],L[J.lft],THIGH,SHIN,pole.clone().addScaledVector(S0,.25),L[J.lkn]);ik(L[J.rhi],L[J.rft],THIGH,SHIN,pole.clone().addScaledVector(S0,-.25),L[J.rkn]);
  // hands
  const sway=Math.sin(this.t*2.3)*.04,au=s.armUp;
  const hl=L[J.lsh].clone().addScaledVector(S,.22+au*.2).add(new V(0,-.4+au*.36+sway,0)).addScaledVector(face,.1),hr=L[J.rsh].clone().addScaledVector(S,-.22-au*.2).add(new V(0,-.42+au*.34-sway,0)).addScaledVector(face,-.08);
  if(s.side){hl.y+=s.side*.25;hr.y-=s.side*.25;}
  const tr=sk.trick;if(tr&&tr.kind==='grab'&&s.grab>.01){const d=tr.def;const pt=a=>{const z=a==='nose'?.36:a==='tail'?-.36:d.hand==='F'?.06:-.08,x=a==='toe'?-.11:a==='heel'?.11:0;return new V(x,DECK,z).applyMatrix4(this.bM);};
   if(d.at==='over'){hl.lerp(new V(0,.09,.22).applyMatrix4(this.bM),s.grab);hr.lerp(new V(0,.09,-.22).applyMatrix4(this.bM),s.grab);}
   else if(d.hand==='2'){hl.lerp(pt('nose'),s.grab);hr.lerp(pt('nose').add(new V(.04,0,-.06)),s.grab);}else if(d.hand==='F')hl.lerp(pt(d.at),s.grab);else hr.lerp(pt(d.at),s.grab);}
  L[J.lha].copy(hl);L[J.rha].copy(hr);
  const ep=new V(0,-.7,0).addScaledVector(face,-.5);ik(L[J.lsh],L[J.lha],UARM,FARM,ep.clone().addScaledVector(S,.3),L[J.lel]);ik(L[J.rsh],L[J.rha],UARM,FARM,ep.clone().addScaledVector(S,-.3),L[J.rel]);
  // shoes: on the board they sit across it, toes toward the rider's front
  const bq=new Q().setFromRotationMatrix(this.bM);for(let i=0;i<2;i++){const on=i===0?1-s.tuck:1-Math.max(s.tuck,s.push);const qa=new Q().setFromAxisAngle(new V(0,1,0),-Math.PI/2+(i?.15:-.35));
   const qb=new Q().setFromUnitVectors(new V(0,0,1),face.clone().add(new V(0,0,i?-.2:.5)).normalize());this.shoeQ[i].copy(bq).multiply(qa).slerp(qb,1-on);}}
 // place limb meshes between joint positions (used for both the animated pose and the ragdoll)
 draw(){const Jw=this.J;const up=new V(0,1,0),t=new V(),q=new Q();
  for(const l of this.limbs){const a=Jw[l.a],b=Jw[l.b];t.subVectors(b,a);const len=t.length();l.m.position.addVectors(a,b).multiplyScalar(.5);l.m.quaternion.setFromUnitVectors(up,t.divideScalar(len||1));}
  const P=Jw[J.pel],C=Jw[J.chest],ls=Jw[J.lsh],rs=Jw[J.rsh];const y=new V().subVectors(C,P),len=y.length();y.normalize();const x=new V().subVectors(ls,rs);x.addScaledVector(y,-x.dot(y)).normalize();const z=new V().crossVectors(x,y);
  const m=new M4().makeBasis(x,y,z);q.setFromRotationMatrix(m);
  this.torso.quaternion.copy(q);this.torso.position.copy(P).addScaledVector(y,len*.72);this.torso.scale.set(.185,len*.36,.125);
  this.belly.quaternion.copy(q);this.belly.position.copy(P).addScaledVector(y,len*.36);this.belly.scale.set(.155,len*.3,.115);
  this.hips.quaternion.copy(q);this.hips.position.copy(P).addScaledVector(y,.03);this.hips.scale.set(.165,.13,.12);
  const H=Jw[J.head];this.neck.position.copy(C).addScaledVector(y,.13);this.neck.quaternion.copy(q);
  this.head.position.copy(H);
  if(this.rag){this.head.quaternion.copy(q).multiply(new Q().setFromAxisAngle(new V(0,1,0),Math.PI));}
  else{const lw=this.lookDir.clone().transformDirection(this.rootM);const hy=y.clone();const hx=new V().crossVectors(hy,lw).normalize();const hz=new V().crossVectors(hx,hy);this.head.quaternion.setFromRotationMatrix(new M4().makeBasis(hx,hy,hz));}
  this.hands[0].position.copy(Jw[J.lha]);this.hands[1].position.copy(Jw[J.rha]);
  for(let i=0;i<2;i++){const f=Jw[i?J.rft:J.lft];this.shoes[i].position.copy(f);if(this.rag){const kn=Jw[i?J.rkn:J.lkn];const sh=new V().subVectors(f,kn).normalize();const toe=z.clone().addScaledVector(sh,-z.dot(sh)).normalize();this.shoes[i].quaternion.setFromRotationMatrix(new M4().makeBasis(new V().crossVectors(sh.clone().negate(),toe).normalize(),sh.clone().negate(),toe));}
   else this.shoes[i].quaternion.copy(this.shoeW[i]);this.shoes[i].position.y+=0;}
 }
 setVisible(v){this.root.visible=v;}
 // ---------- ragdoll ----------
 startRag(vel,boardVel){const n=NJ;this.rag={p:this.J.map(v=>v.clone()),o:this.J.map(v=>v.clone().addScaledVector(vel,-1/60)),t:0};
  const r=this.rag;r.o.forEach((o,i)=>{o.x+=(Math.random()-.5)*.02;o.z+=(Math.random()-.5)*.02;});
  const c=[];const add=(a,b)=>c.push([a,b,r.p[a].distanceTo(r.p[b])]);
  [[J.pel,J.chest],[J.chest,J.head],[J.lsh,J.rsh],[J.lsh,J.chest],[J.rsh,J.chest],[J.lhi,J.rhi],[J.lhi,J.pel],[J.rhi,J.pel],[J.lsh,J.lhi],[J.rsh,J.rhi],[J.lsh,J.rhi],[J.rsh,J.lhi],[J.head,J.lsh],[J.head,J.rsh],
   [J.lsh,J.lel],[J.lel,J.lha],[J.rsh,J.rel],[J.rel,J.rha],[J.lhi,J.lkn],[J.lkn,J.lft],[J.rhi,J.rkn],[J.rkn,J.rft],[J.lft,J.lhi],[J.rft,J.rhi]].forEach(([a,b])=>add(a,b));
  // limit knees/elbows folding fully
  r.c=c;r.min=[[J.lhi,J.lft,.35],[J.rhi,J.rft,.35],[J.lsh,J.lha,.2],[J.rsh,J.rha,.2]];
  const bp=new V().setFromMatrixPosition(this.board.matrix);this.bd={p:bp,v:boardVel.clone(),q:new Q().setFromRotationMatrix(this.board.matrix),w:new V((Math.random()-.5)*14,(Math.random()-.5)*10,(Math.random()-.5)*14)};}
 stepRag(sk,dt){const r=this.rag,W=sk.world,G=21;r.t+=dt;const n=Math.max(1,Math.ceil(dt/(1/120))),h=dt/n;
  for(let s=0;s<n;s++){for(let i=0;i<NJ;i++){const p=r.p[i],o=r.o[i];const vx=(p.x-o.x)*.995,vy=(p.y-o.y)*.995,vz=(p.z-o.z)*.995;o.copy(p);p.x+=vx;p.y+=vy-G*h*h;p.z+=vz;}
   for(let it=0;it<5;it++){for(const[a,b,l]of r.c){const A=r.p[a],B=r.p[b];const dx=B.x-A.x,dy=B.y-A.y,dz=B.z-A.z,d=Math.hypot(dx,dy,dz)||1e-6,f=(d-l)/d*.5;A.x+=dx*f;A.y+=dy*f;A.z+=dz*f;B.x-=dx*f;B.y-=dy*f;B.z-=dz*f;}
    for(const[a,b,l]of r.min){const A=r.p[a],B=r.p[b];const dx=B.x-A.x,dy=B.y-A.y,dz=B.z-A.z,d=Math.hypot(dx,dy,dz)||1e-6;if(d<l){const f=(d-l)/d*.5;A.x+=dx*f;A.y+=dy*f;A.z+=dz*f;B.x-=dx*f;B.y-=dy*f;B.z-=dz*f;}}
    for(let i=0;i<NJ;i++){const p=r.p[i],o=r.o[i],rad=i===J.head?.11:.07;const g=W.H(p.x,p.z);if(g-p.y>.6){p.x=o.x;p.z=o.z;}const gh=W.H(p.x,p.z);if(p.y<gh+rad){p.y=gh+rad;o.x=p.x-(p.x-o.x)*.55;o.z=p.z-(p.z-o.z)*.55;if(o.y<p.y)o.y=p.y-(o.y-p.y)*-.2;}}}}
  for(let i=0;i<NJ;i++)this.J[i].copy(r.p[i]);
  // the board tumbles away on its own
  const b=this.bd;if(b){b.v.y-=G*dt;b.p.addScaledVector(b.v,dt);const gh=W.H(b.p.x,b.p.z);if(gh-b.p.y>.8){b.p.addScaledVector(b.v,-dt);b.v.x*=-.4;b.v.z*=-.4;}
   if(b.p.y<gh+.03){b.p.y=gh+.03;if(b.v.y<0)b.v.y*=-.35;b.v.x*=.86;b.v.z*=.86;b.w.multiplyScalar(.8);}
   const wl=b.w.length();if(wl>1e-3)b.q.premultiply(new Q().setFromAxisAngle(b.w.clone().divideScalar(wl),wl*dt));
   this.board.matrix.compose(b.p,b.q,new V(1,1,1));this.board.matrixWorldNeedsUpdate=true;}}
 ragCenter(){return this.rag?this.rag.p[J.pel]:this.J[J.pel];}
}
// floating name tag (for the rival)
export function nameTag(text,color){const t=ctex(256,64,(x,w,h)=>{x.fillStyle='rgba(8,10,16,.75)';x.beginPath();x.roundRect(4,8,w-8,h-16,24);x.fill();x.fillStyle=color;x.font='bold 30px JetBrains Mono, monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(text,w/2,h/2+1);},{clamp:true});
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true}));s.scale.set(1.1,.275,1);s.renderOrder=10;return s;}
