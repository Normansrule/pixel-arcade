// PENGUIN PLAZA — the procedural penguin: one-mesh body with painted belly/face mask, articulated flippers + feet,
// blink, waddle walk cycle, emotes (wave, dance, sit, throw, cheer), belly slide, squash-and-stretch, clothing slots.
import {THREE,V3,M,merge,cl,rnd,damp} from './util.js';
import {wearModel,ALL,SLOT_POS} from './items.js';
const G=THREE;

/* ---------- shared geometry ---------- */
function bodyGeometry(){
 const prof=[[0,0],[.3,.02],[.5,.1],[.61,.24],[.65,.42],[.63,.6],[.57,.77],[.51,.9],[.49,1.0],[.5,1.1],[.5,1.22],[.46,1.36],[.37,1.47],[.22,1.55],[0,1.58]].map(([r,y])=>new G.Vector2(r,y));
 const g=new G.LatheGeometry(prof,36);const p=g.attributes.position,mk=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const a=Math.atan2(x,z),ca=Math.abs(a);
  // belly bulge
  const fr=Math.max(0,Math.cos(a));z+=fr*fr*.07*Math.max(0,Math.sin(Math.PI*cl(y/1.0,0,1)));p.setXYZ(i,x,y,z);
  const bw=.95+.12*Math.sin(cl(y,0,1)*Math.PI);let belly=1-cl((ca-(bw-.14))/.14,0,1);belly*=cl((1.0-y)/.08,0,1)*cl((y-.05)/.06,0,1);
  // heart-shaped face mask around the eyes
  const lobe=s=>{const dx=(a-s*.36)/.33,dy=(y-1.24)/.2;return 1-cl((Math.hypot(dx,dy)-.8)/.25,0,1);};
  const low=(1-cl((ca-.5)/.12,0,1))*cl((1.16-y)/.06,0,1)*cl((y-.92)/.05,0,1);
  const face=Math.max(lobe(1),lobe(-1),low);
  const cheek=s=>1-cl((Math.hypot((a-s*.66)/.13,(y-1.1)/.07)-.75)/.3,0,1);
  mk[i*2]=Math.max(belly,face);mk[i*2+1]=Math.max(cheek(1),cheek(-1));}
 g.setAttribute('mk',new G.BufferAttribute(mk,2));g.computeVertexNormals();return g;}
const zeroMk=g=>{g.setAttribute('mk',new G.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;};
let GEO=null;
function geos(){if(GEO)return GEO;const S=(r,a=16,b=12)=>new G.SphereGeometry(r,a,b);
 const eye=(s)=>{const a=s*.36,r=.485,x=Math.sin(a)*r,z=Math.cos(a)*r;return[[S(.085,16,12),M(x,0,z,0,a,0,1,1.15,.55),0x0d0d12],[S(.026,8,6),M(x+.028,.035,z+.04),0xffffff],[S(.012,6,4),M(x-.02,-.03,z+.042),0xffffff]];};
 const flip=new G.SphereGeometry(.2,14,10);flip.scale(.42,1.6,1);flip.translate(0,-.26,0);zeroMk(flip);
 const foot=merge([[S(.11,10,8),M(0,0,.04,0,0,0,1.15,.42,1.5),0xf29a2a],[S(.06,8,6),M(.07,0,.17,0,0,0,1,.5,1.3),0xf29a2a],[S(.06,8,6),M(-.07,0,.17,0,0,0,1,.5,1.3),0xf29a2a],[S(.06,8,6),M(0,0,.2,0,0,0,1,.5,1.3),0xf29a2a]]);
 const beak=merge([[new G.ConeGeometry(.085,.2,12),M(0,1.135,.53,Math.PI/2,0,0,1,1,.75),0xf6a028],[new G.ConeGeometry(.06,.12,10),M(0,1.085,.51,Math.PI/2+.12,0,0,1,1,.6),0xe0841a]]);
 const tuft=merge([[new G.ConeGeometry(.045,.22,6),M(0,1.62,.02,.2,0,0)],[new G.ConeGeometry(.04,.18,6),M(.05,1.6,-.02,0,0,-.5)],[new G.ConeGeometry(.04,.18,6),M(-.05,1.6,-.02,0,0,.5)]]);zeroMk(tuft);
 const eyes=merge([...eye(1),...eye(-1)]);eyes.translate(0,0,0);
 const shadow=new G.CircleGeometry(.62,24);shadow.rotateX(-Math.PI/2);shadow.translate(0,.02,0);
 GEO={body:bodyGeometry(),flip,foot,beak,tuft,eyes,shadow};for(const k in GEO)GEO[k].userData.keep=true;return GEO;}
const SH={beak:null,eye:null,blob:null};
function shared(){if(SH.beak)return SH;SH.beak=new G.MeshStandardMaterial({vertexColors:true,roughness:.45,envMapIntensity:.6});SH.eye=new G.MeshStandardMaterial({vertexColors:true,roughness:.06,metalness:0,envMapIntensity:1.6});
 const tx=new G.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return c;})());
 SH.blob=new G.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});for(const k in SH)SH[k].userData.keep=true;return SH;}
export function bodyMaterial(color){const m=new G.MeshStandardMaterial({color,roughness:.5,envMapIntensity:.55});m.userData.white=new G.Color(.97,.96,.94);
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 mk;varying vec2 vMk;').replace('#include <begin_vertex>','#include <begin_vertex>\nvMk=mk;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vMk;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.97,.96,.94),smoothstep(.35,.65,vMk.x));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.,.5,.58),smoothstep(.2,.8,vMk.y)*.75);')
  .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat rimF=pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);totalEmissiveRadiance+=vec3(.55,.65,.85)*rimF*.12;');};
 m.customProgramCacheKey=()=>'pengbody';return m;}

/* ---------- the penguin ---------- */
export class Penguin{
 constructor(o={}){const g=geos(),s=shared();this.group=new G.Group();this.bob=new G.Group();this.group.add(this.bob);
  this.mat=bodyMaterial(o.color??0x3f86e0);
  this.body=new G.Mesh(g.body,this.mat);this.body.castShadow=true;this.body.receiveShadow=true;this.bob.add(this.body);
  this.eyes=new G.Mesh(g.eyes,s.eye);this.eyes.position.y=1.25;this.eyes.geometry=g.eyes;this.bob.add(this.eyes);
  this.beak=new G.Mesh(g.beak,s.beak);this.bob.add(this.beak);this.tuft=new G.Mesh(g.tuft,this.mat);this.bob.add(this.tuft);
  this.fl=[];for(const sd of[1,-1]){const pv=new G.Group();pv.position.set(sd*.56,.98,-.02);const f=new G.Mesh(g.flip,this.mat);f.rotation.z=sd*.22;pv.add(f);this.bob.add(pv);this.fl.push(pv);}
  this.ft=[];for(const sd of[1,-1]){const f=new G.Mesh(g.foot,s.beak);f.position.set(sd*.22,.04,.14);f.rotation.y=sd*.18;this.group.add(f);this.ft.push(f);}
  this.blob=new G.Mesh(g.shadow,s.blob);this.blob.renderOrder=1;this.group.add(this.blob);
  this.slots={hat:null,neck:null,face:null};this.anchors={};for(const k in SLOT_POS){const a=new G.Group();a.position.set(...SLOT_POS[k]);this.bob.add(a);this.anchors[k]=a;}
  this.speed=0;this.phase=0;this.t=rnd(10);this.blinkT=rnd(3);this.act=null;this.actT=0;this.actDur=0;this.pose='stand';this.sq=0;this.sqV=0;this.look=0;this.lookT=0;this.danceStyle=0;this.onStep=null;this.lastS=0;this.hop=0;this.slideAmt=0;this.lean=0;
  if(o.wear)this.setWear(o.wear);if(o.scale)this.group.scale.setScalar(o.scale);}
 setColor(c){this.mat.color.set(c);}
 setWear(w={}){for(const k of['hat','neck','face']){const id=w[k]||null;const cur=this.slots[k];if(cur&&cur.userData.id===id)continue;if(cur){this.anchors[k].remove(cur);cur.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material&&!n.material.userData.keep){if(n.material.map)n.material.map.dispose();n.material.dispose();}});}
  this.slots[k]=null;if(id&&ALL[id]){const m=wearModel(ALL[id]);m.userData.id=id;m.traverse(n=>{if(n.isMesh)n.castShadow=false;});this.anchors[k].add(m);this.slots[k]=m;}}}
 // one-shot actions: wave, throw, cheer, hop, nod, laugh, spin
 play(a,dur){this.act=a;this.actT=0;this.actDur=dur??({wave:1.6,throw:.55,cheer:1.2,hop:.6,laugh:1.2,spin:.9,nod:.6,sad:1.4,hit:.5}[a]||1);if(a==='hop'||a==='cheer'){this.sqV=-4;}}
 // pose: stand | sit | dance | slide | sled | crouch | swim
 update(dt,speed=0){const t=this.t+=dt,b=this.bob,F=this.fl,T=this.ft;this.speed=damp(this.speed,speed,10,dt);const sp=this.speed;
  // squash & stretch spring
  this.sqV+=(-this.sq*120-this.sqV*11)*dt;this.sq+=this.sqV*dt;const sq=cl(this.sq,-.3,.3);
  let by=0,rz=0,rx=0,ry=0,fL=[0,0,0],fR=[0,0,0],footZ=[0,0],footY=[0,0],footRx=[0,0];
  const walking=sp>.15&&this.pose==='stand';
  if(walking){const k=Math.min(1.6,sp/3.2);this.phase+=dt*(6+sp*1.6);const s=Math.sin(this.phase);by=Math.abs(Math.cos(this.phase))*.06*k;rz=s*.13*Math.min(1,k+.3);rx=.08*k;
   footZ=[s*.16*k,-s*.16*k];footY=[Math.max(0,-Math.cos(this.phase))*.1*k,Math.max(0,Math.cos(this.phase))*.1*k];
   fL=[0,0,.35+s*.15];fR=[0,0,-.35+s*.15];if(this.onStep&&Math.sign(s)!==Math.sign(this.lastS))this.onStep(s>0?0:1);this.lastS=s;}
  else{const br=Math.sin(t*2.1)*.012;by=br*.5;fL=[0,0,.1+Math.sin(t*2.1)*.04];fR=[0,0,-.1-Math.sin(t*2.1)*.04];
   this.lookT-=dt;if(this.lookT<0){this.lookT=1.5+rnd(3);this.look=rnd(-.5,.5);}ry=this.look*.5;}
  // poses
  let sit=0,slide=0;
  if(this.pose==='sit'||this.pose==='sled'){sit=1;by=-.3;rx=-.18;footZ=[.32,.32];footY=[.18,.18];footRx=[-.9,-.9];fL=[this.pose==='sled'?-.9:0,0,.6];fR=[this.pose==='sled'?-.9:0,0,-.6];}
  else if(this.pose==='crouch'){by=-.22;rx=.15;fL=[0,0,.7];fR=[0,0,-.7];}
  else if(this.pose==='slide'){slide=1;}
  else if(this.pose==='dance'){const bt=t*(this.danceRate||2.1)*Math.PI,st=this.danceStyle%4;by=Math.abs(Math.sin(bt))*.16;
   if(st===0){rz=Math.sin(bt)*.18;fL=[0,0,1.6+Math.sin(bt*2)*.6];fR=[0,0,-1.6+Math.sin(bt*2)*.6];footY=[Math.max(0,Math.sin(bt))*.12,Math.max(0,-Math.sin(bt))*.12];}
   else if(st===1){ry=Math.sin(bt*.5)*.7;fL=[Math.sin(bt)*.8,0,2.5];fR=[-Math.sin(bt)*.8,0,-2.5];}
   else if(st===2){rz=Math.sin(bt*.5)*.25;rx=Math.sin(bt)*.12;fL=[-1.5,0,.6+Math.sin(bt)*.5];fR=[-1.5,0,-.6-Math.sin(bt)*.5];footZ=[Math.sin(bt)*.15,-Math.sin(bt)*.15];}
   else{ry=t*4;fL=[0,0,1.2];fR=[0,0,-1.2];by=.08+Math.abs(Math.sin(bt))*.1;}}
  this.slideAmt=damp(this.slideAmt,slide,8,dt);
  // one-shot actions layered on top
  if(this.act){this.actT+=dt;const k=this.actT/this.actDur;if(k>=1)this.act=null;else switch(this.act){
   case'wave':fR=[0,0,-2.6+Math.sin(this.actT*14)*.35];rz+=-.06;break;
   case'throw':{const w=k<.45?k/.45:1-(k-.45)/.55;fR=k<.45?[w*1.6,0,-.5-w*.6]:[-2.4*w,0,-.6];rx+=k<.45?-.1*w:.2*w;break;}
   case'cheer':fL=[0,0,2.7];fR=[0,0,-2.7];by+=Math.sin(k*Math.PI)*.45;break;
   case'hop':by+=Math.sin(k*Math.PI)*.4;break;
   case'laugh':rx+=-.15+Math.sin(this.actT*24)*.05;fL=[0,0,.6];fR=[0,0,-.6];break;
   case'spin':ry+=k*Math.PI*2;fL=[0,0,1.3];fR=[0,0,-1.3];break;
   case'nod':rx+=Math.sin(k*Math.PI*2)*.15;break;
   case'sad':rx+=.2;fL=[0,0,0];fR=[0,0,0];break;
   case'hit':rx+=-.3*Math.sin(k*Math.PI);rz+=.2*Math.sin(k*Math.PI*3);fL=[0,0,1];fR=[0,0,-1];break;}}
  // apply
  const sl=this.slideAmt;b.position.y=by*(1-sl)+sl*.62;b.rotation.set(rx*(1-sl)+sl*1.42,ry,rz*(1-sl));
  const sy=1+sq,sxz=1/Math.sqrt(Math.max(.5,sy));b.scale.set(sxz,sy,sxz);
  const fa=(f,v,sd)=>{f.rotation.x=damp(f.rotation.x,v[0]-sl*1.8,14,dt);f.rotation.y=v[1];f.rotation.z=damp(f.rotation.z,v[2]*(1-sl)+sd*sl*.2,14,dt);};fa(F[0],fL,1);fa(F[1],fR,-1);
  for(let i=0;i<2;i++){const f=T[i];f.position.z=damp(f.position.z,.14+footZ[i]-sl*.95,16,dt);f.position.y=damp(f.position.y,.04+footY[i]+sl*.25+(sit?.02:0),16,dt);f.rotation.x=damp(f.rotation.x,footRx[i]+sl*1.3,12,dt);}
  this.blob.scale.setScalar(1-Math.min(.5,by*1.5));
  // blink
  this.blinkT-=dt;this.eyes.scale.y=this.blinkT<.11?.12:1;if(this.blinkT<0)this.blinkT=1.8+rnd(3.5);
  // clothing life
  const h=this.slots.hat;if(h)h.traverse(n=>{if(n.userData.spin)n.rotation.y+=dt*n.userData.spin*(.3+sp*.5);});
  const nk=this.slots.neck;if(nk&&nk.userData.tail)nk.userData.tail.rotation.x=.15+sp*.12+Math.sin(t*3)*.05;}}

// a tiny sled, used by the sled race + idle props
export function makeSled(color=0xd8383e){const P=(g,m,c)=>[g,m,c];const g=merge([P(new G.BoxGeometry(1.2,.12,1.9),M(0,.18,0),color),P(new G.BoxGeometry(.08,.08,2.1),M(.5,.04,0),0x8a8f9a),P(new G.BoxGeometry(.08,.08,2.1),M(-.5,.04,0),0x8a8f9a),P(new G.TorusGeometry(.12,.04,6,12,Math.PI),M(.5,.12,1.05,0,Math.PI/2,0),0x8a8f9a),P(new G.TorusGeometry(.12,.04,6,12,Math.PI),M(-.5,.12,1.05,0,Math.PI/2,0),0x8a8f9a),P(new G.BoxGeometry(1.2,.3,.1),M(0,.32,-.9),color)]);
 const m=new G.Mesh(g,new G.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.2}));m.castShadow=true;return m;}
