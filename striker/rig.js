// STRIKER 11 — instanced articulated footballers: one draw call per body part for all 25 people on the pitch.
// Each person has a small forward-kinematics skeleton fed by a pose vector; poses come from procedural animation.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,O=()=>new THREE.Object3D();
export const X=0,Y=1,Z=2,YAW=3,PIT=4,ROL=5,HY=6,LEAN=7,TW=8,HD=9,LSX=10,LSZ=11,LEL=12,RSX=13,RSZ=14,REL=15,LHX=16,LHZ=17,LKN=18,RHX=19,RHZ=20,RKN=21,SC=22,VIS=23,LAN=24,RAN=25,NP=26;
const HIP=.95;
function numberAtlas(){const c=document.createElement('canvas');c.width=640;c.height=96;const x=c.getContext('2d');x.clearRect(0,0,640,96);x.fillStyle='#fff';x.font='700 84px "JetBrains Mono",Impact,monospace';x.textAlign='center';x.textBaseline='middle';
 for(let i=0;i<10;i++)x.fillText(String(i),i*64+32,52);const t=new THREE.CanvasTexture(c);t.flipY=true;return t;}
function kitMaterial(numTex){const m=new THREE.MeshStandardMaterial({roughness:.72,metalness:0});
 m.onBeforeCompile=sh=>{sh.uniforms.uNum={value:numTex};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 aK2;attribute vec2 aNum;varying vec4 vK2;varying vec2 vNum;varying vec3 vL;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvK2=aK2;vNum=aNum;vL=position;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uNum;varying vec4 vK2;varying vec2 vNum;varying vec3 vL;')
   .replace('#include <color_fragment>',`#include <color_fragment>
   {float m=0.;int pt=int(vK2.w+.5);
    if(pt==1)m=step(.5,fract((vL.x+1.)*9.));else if(pt==2)m=step(.5,fract(vL.y*6.5+.2));else if(pt==3)m=step(0.,vL.x);
    else if(pt==4)m=1.-step(.06,abs(vL.x*.95+(vL.y-.3)));else if(pt==5)m=1.-step(.06,abs(vL.y-.36));else if(pt==6)m=step(.145,abs(vL.x));
    if(vL.y>.545)m=1.;diffuseColor.rgb=mix(diffuseColor.rgb,vK2.rgb,m);
    if(vNum.x>0.&&vL.z<-.05&&abs(vL.x)<.115&&vL.y>.16&&vL.y<.45){float n=vNum.x,u=(.115-vL.x)/.23,v=(vL.y-.16)/.29,d=n,lu=u;
     if(n>=10.){if(u<.5){d=floor(n/10.);lu=u*2.;}else{d=mod(n,10.);lu=(u-.5)*2.;}lu=clamp(lu*1.15-.075,0.,1.);}
     vec2 q=vec2((d+lu)/10.,v);float a=texture2D(uNum,q).a,o=0.;for(int i=0;i<8;i++){float an=float(i)*.785;o=max(o,texture2D(uNum,q+vec2(cos(an)*.0045,sin(an)*.04)).a);}
     diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.-vNum.y),o*.9);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(vNum.y),a);}}`);};
 m.customProgramCacheKey=()=>'kit';return m;}
function cap(r,len,seg=8){const g=new THREE.CapsuleGeometry(r,len,3,seg);g.translate(0,-(len/2+r)+r*.6,0);return g;}
export class Squad{
 constructor(scene,max=26){this.max=max;this.n=0;const numTex=numberAtlas();
  const std=(r=.75)=>new THREE.MeshStandardMaterial({roughness:r,metalness:0});
  const torsoG=new THREE.CylinderGeometry(.205,.16,.56,14,4);torsoG.scale(1,1,.62);torsoG.translate(0,.3,0);
  {const p=torsoG.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y>.5){const k=(y-.5)/.08;p.setX(i,p.getX(i)*(1-k*.18));p.setZ(i,p.getZ(i)*(1-k*.1));}}torsoG.computeVertexNormals();}
  const shortsG=new THREE.CylinderGeometry(.17,.205,.27,12,1);shortsG.scale(1,1,.74);shortsG.translate(0,-.07,0);
  const headG=new THREE.SphereGeometry(.112,14,10);headG.scale(.95,1.12,1.04);headG.translate(0,.15,.005);
  const neck=new THREE.CylinderGeometry(.052,.06,.12,8);neck.translate(0,.02,0);
  const hairG=new THREE.SphereGeometry(.12,14,8,0,Math.PI*2,0,Math.PI*.52);hairG.scale(.97,1.08,1.08);hairG.translate(0,.168,-.012);
  const uarmG=cap(.056,.19),farmG=cap(.046,.2);{const hand=new THREE.SphereGeometry(.052,8,6);hand.scale(.8,1.1,.7);hand.translate(0,-.29,0);farmG.copy(mergeGeo([farmG,hand]));}
  const thighG=cap(.078,.3),shinG=cap(.06,.31);const bootG=new THREE.CapsuleGeometry(.048,.15,3,8);bootG.rotateX(Math.PI/2);bootG.scale(1.05,.85,1);bootG.translate(0,-.035,.055);
  this.numTex=numTex;const kit=kitMaterial(numTex);
  const mk=(g,m,k)=>{const im=new THREE.InstancedMesh(g,m,max*k);im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);for(let i=0;i<max*k;i++){im.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));im.setColorAt(i,new THREE.Color(1,1,1));}scene.add(im);return im;};
  torsoG.setAttribute('aK2',new THREE.InstancedBufferAttribute(new Float32Array(max*4),4));torsoG.setAttribute('aNum',new THREE.InstancedBufferAttribute(new Float32Array(max*2),2));
  this.torso=mk(torsoG,kit,1);this.shorts=mk(shortsG,std(.8),1);this.head=mk(mergeGeo([headG,neck]),std(.6),1);this.hair=mk(hairG,std(.9),1);
  this.uarm=mk(uarmG,std(.75),2);this.farm=mk(farmG,std(.65),2);this.thigh=mk(thighG,std(.65),2);this.shin=mk(shinG,std(.8),2);this.boot=mk(bootG,std(.4),2);
  this.rigs=[];for(let i=0;i<max;i++)this.rigs.push(makeRig());this.hidden=new THREE.Matrix4().makeScale(0,0,0);}
 // look: {c1,c2,pat,sh,so,skin,hair,boot,num,sleeve,glove,bald}
 setLook(i,L){const c=new THREE.Color();this.torso.setColorAt(i,c.set(L.c1));const k2=c.set(L.c2);this.torso.geometry.attributes.aK2.setXYZW(i,k2.r,k2.g,k2.b,L.pat);
  const nb=new THREE.Color(L.c1),lum=nb.r*.3+nb.g*.59+nb.b*.11;this.torso.geometry.attributes.aNum.setXY(i,L.num||0,lum>.5?.05:.95);
  this.shorts.setColorAt(i,c.set(L.sh));this.head.setColorAt(i,c.set(L.skin));this.hair.setColorAt(i,c.set(L.hair));
  for(let s=0;s<2;s++){const j=i*2+s;this.uarm.setColorAt(j,c.set(L.pat===6?L.c2:L.c1));this.farm.setColorAt(j,c.set(L.glove||L.skin));this.thigh.setColorAt(j,c.set(L.skin));this.shin.setColorAt(j,c.set(L.so));this.boot.setColorAt(j,c.set(L.boot));}
  this.rigs[i].bald=!!L.bald;this.rigs[i].long=!!L.glove;
  for(const m of[this.torso,this.shorts,this.head,this.hair,this.uarm,this.farm,this.thigh,this.shin,this.boot])m.instanceColor.needsUpdate=true;
  this.torso.geometry.attributes.aK2.needsUpdate=this.torso.geometry.attributes.aNum.needsUpdate=true;}
 pose(i,P){const r=this.rigs[i];if(!P[VIS]){for(const m of[this.torso,this.shorts,this.head,this.hair])m.setMatrixAt(i,this.hidden);for(const m of[this.uarm,this.farm,this.thigh,this.shin,this.boot]){m.setMatrixAt(i*2,this.hidden);m.setMatrixAt(i*2+1,this.hidden);}return;}
  const s=P[SC];r.root.position.set(P[X],P[Y]+(HIP+P[HY])*s,P[Z]);r.root.rotation.set(P[PIT],P[YAW],P[ROL],'YXZ');r.root.scale.setScalar(s);
  r.spine.rotation.set(P[LEAN],P[TW],0);r.neck.rotation.set(-P[LEAN]*.5,P[HD],0);
  r.sh[0].rotation.set(-P[LSX],0,P[LSZ]);r.el[0].rotation.x=-P[LEL];r.sh[1].rotation.set(-P[RSX],0,-P[RSZ]);r.el[1].rotation.x=-P[REL];
  r.hp[0].rotation.set(-P[LHX],0,P[LHZ]);r.kn[0].rotation.x=P[LKN];r.an[0].rotation.x=P[LAN];r.hp[1].rotation.set(-P[RHX],0,-P[RHZ]);r.kn[1].rotation.x=P[RKN];r.an[1].rotation.x=P[RAN];
  r.root.updateMatrixWorld(true);
  this.torso.setMatrixAt(i,r.spine.matrixWorld);this.shorts.setMatrixAt(i,r.root.matrixWorld);this.head.setMatrixAt(i,r.neck.matrixWorld);this.hair.setMatrixAt(i,r.bald?this.hidden:r.neck.matrixWorld);
  for(let k=0;k<2;k++){const j=i*2+k;this.uarm.setMatrixAt(j,r.sh[k].matrixWorld);this.farm.setMatrixAt(j,r.el[k].matrixWorld);this.thigh.setMatrixAt(j,r.hp[k].matrixWorld);this.shin.setMatrixAt(j,r.kn[k].matrixWorld);this.boot.setMatrixAt(j,r.an[k].matrixWorld);}}
 hand(i,k,out){return out.set(0,-.29,0).applyMatrix4(this.rigs[i].el[k].matrixWorld);}
 foot(i,k,out){return out.set(0,-.03,.1).applyMatrix4(this.rigs[i].an[k].matrixWorld);}
 headPos(i,out){return out.set(0,.16,0).applyMatrix4(this.rigs[i].neck.matrixWorld);}
 commit(){for(const m of[this.torso,this.shorts,this.head,this.hair,this.uarm,this.farm,this.thigh,this.shin,this.boot])m.instanceMatrix.needsUpdate=true;}}
function makeRig(){const root=O(),spine=O(),neck=O();root.add(spine);spine.add(neck);neck.position.y=.585;
 const sh=[O(),O()],el=[O(),O()],hp=[O(),O()],kn=[O(),O()],an=[O(),O()];
 for(let k=0;k<2;k++){const s=k?-1:1;sh[k].position.set(s*.215,.5,0);spine.add(sh[k]);el[k].position.y=-.29;sh[k].add(el[k]);
  hp[k].position.set(s*.1,-.07,0);root.add(hp[k]);kn[k].position.y=-.43;hp[k].add(kn[k]);an[k].position.y=-.43;kn[k].add(an[k]);}
 return{root,spine,neck,sh,el,hp,kn,an,bald:false};}
function mergeGeo(list){const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;gs.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3);let o=0;
 for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));return r;}

/* ================= procedural animation ================= */
const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t),PI=Math.PI;
export function newAnim(){return{ph:Math.random()*6,act:'',t:0,dur:1,side:1,pow:1,v:0,h:0,turn:0,lastFace:0,set:false,cele:0};}
// e: {p,v,face,anim,pose(Float32Array NP),tp(Float32Array NP),h(scale),gk,visible,sprint}
export function animate(e,dt){const a=e.anim,T=e.tp,Pz=e.pose;const sp=Math.hypot(e.v.x,e.v.z);
 a.ph+=dt*2*PI*(sp>.25?.75+sp*.2:0);const amp=cl(sp/6.6,0,1.15),walk=sp<2.4;
 let df=e.face-a.lastFace;df=Math.atan2(Math.sin(df),Math.cos(df));a.lastFace=e.face;a.turn=lerp(a.turn,dt>0?df/dt:0,Math.min(1,dt*6));
 const s=Math.sin(a.ph),c=Math.cos(a.ph);
 T[X]=e.p.x;T[Y]=e.p.y||0;T[Z]=e.p.z;T[YAW]=e.face;T[PIT]=0;T[ROL]=cl(-a.turn*.045,-.32,.32)*Math.min(1,amp);T[SC]=e.h||1;T[VIS]=e.visible===false?0:1;T[TW]=-s*.12*amp;T[HD]=0;
 T[HY]=walk?-.01-.012*amp:-.035*amp+.05*amp*Math.abs(c);T[LEAN]=.04+amp*(e.sprint?.26:.17);
 const la=walk?.45:.82;T[LHX]=s*la*amp;T[RHX]=-s*la*amp;T[LHZ]=T[RHZ]=.03;
 T[LKN]=.1+amp*(walk?.25*Math.max(0,c):.15+1.25*Math.max(0,c));T[RKN]=.1+amp*(walk?.25*Math.max(0,-c):.15+1.25*Math.max(0,-c));T[LAN]=T[RAN]=-.05;
 T[LSX]=-s*.62*amp;T[RSX]=s*.62*amp;T[LSZ]=T[RSZ]=.1+.06*amp;T[LEL]=T[REL]=.25+(walk?.2:1.05)*amp;
 if(sp<.25){const b=Math.sin(performance.now()*.002+e.p.x)*.02;T[LSZ]=T[RSZ]=.12+b;T[LEL]=T[REL]=.22;T[LKN]=T[RKN]=.08;T[HY]=-.01;T[LEAN]=.03+b;
  if(a.set){T[LKN]=T[RKN]=.55;T[LHX]=T[RHX]=.35;T[HY]=-.11;T[LEAN]=.32;T[LSX]=T[RSX]=.55;T[LSZ]=T[RSZ]=.45;T[LEL]=T[REL]=.9;T[LHZ]=T[RHZ]=.12;}}
 if(!a.act&&e.charging>0){const p=e.charging;T[RHX]=-.95*p;T[RKN]=1.35*p;T[RHZ]=-.06;T[LEAN]+=.08*p;T[RSZ]=.45+.3*p;T[LSX]=.45*p;T[LSZ]=.55;}
 if(a.act){a.t+=dt;const k=cl(a.t/a.dur,0,1),R=a.side>0;// R: right foot / right side
  const leg=(hx,kn,hz=0)=>{if(R){T[RHX]=hx;T[RKN]=kn;T[RHZ]=hz;}else{T[LHX]=hx;T[LKN]=kn;T[LHZ]=hz;}},plant=(hx,kn)=>{if(R){T[LHX]=hx;T[LKN]=kn;}else{T[RHX]=hx;T[RKN]=kn;}};
  switch(a.act){
   case'kick':{const p=a.pow;const sw=k<.25?-.95*sm(k/.25):k<.5?lerp(-.95,.7+.9*p,sm((k-.25)/.25)):lerp(.7+.9*p,0,sm((k-.5)/.5));const kn=k<.25?1.5*sm(k/.25):k<.45?lerp(1.5,.08,(k-.25)/.2):lerp(.08,.2,(k-.45)/.55);
    leg(sw,kn,-.08);plant(.12,.38);T[HY]=-.06;T[LEAN]=.12-Math.max(0,k-.35)*.45*a.h;
    if(R){T[LSX]=.55;T[LSZ]=.75;T[RSX]=-.35;T[RSZ]=.5;}else{T[RSX]=.55;T[RSZ]=.75;T[LSX]=-.35;T[LSZ]=.5;}T[LEL]=T[REL]=.4;T[TW]=(R?-1:1)*(k<.3?.25:-.2);break;}
   case'charge':{const p=a.pow;leg(-.95*p,1.4*p,-.06);T[LEAN]+=.08*p;if(R){T[RSZ]=.4+.3*p;T[LSX]=.4*p;T[LSZ]=.5;}else{T[LSZ]=.4+.3*p;T[RSX]=.4*p;T[RSZ]=.5;}break;}
   case'tackle':{const e2=k<.25?sm(k/.25):k>.7?1-sm((k-.7)/.3):1;leg(1.3*e2,.1,-.2*e2);plant(-.15*e2,.85*e2);T[HY]=-.2*e2;T[LEAN]=.45*e2;T[LSZ]=T[RSZ]=.7*e2;T[LEL]=T[REL]=.5;break;}
   case'slide':{const up=k>.72?sm((k-.72)/.28):0,d=1-up,i=sm(Math.min(1,k*5));T[PIT]=-1.12*i*d;T[HY]=-.74*i*d;leg(1.3*i*d,.05,0);plant(.45*i*d,1.55*i*d);
    T[LSX]=T[RSX]=-.55*i*d;T[LSZ]=T[RSZ]=.55*i*d;T[LEL]=T[REL]=.3;T[LEAN]=.25*i*d;break;}
   case'fall':{const up=k>.7?sm((k-.7)/.3):0,d=1-up,i=sm(Math.min(1,k*4));T[PIT]=1.42*i*d;T[HY]=-.8*i*d;T[LHX]=T[RHX]=-.1*d;T[LKN]=T[RKN]=.25*d;T[LSX]=T[RSX]=2.4*i*d;T[LSZ]=T[RSZ]=.35;T[LEL]=T[REL]=.4*d;T[LEAN]=-.1*d;break;}
   case'dive':{const sd=a.side,fl=k<.55?sm(Math.min(1,k/.18)):1,land=k>.5?sm(Math.min(1,(k-.5)/.12)):0,up=k>.78?sm((k-.78)/.22):0,d=1-up;
    T[ROL]=-sd*1.42*fl*d;T[Y]=(a.h*Math.sin(Math.min(1,k/.55)*PI)*(1-land))*d;T[HY]=lerp(-.08,-.78,land)*fl*d;
    T[LSZ]=T[RSZ]=2.75*fl*d+.1;T[LSX]=T[RSX]=.25;T[LEL]=T[REL]=.15;T[LHX]=T[RHX]=.1;T[LKN]=.2;T[RKN]=.45;T[LHZ]=T[RHZ]=.1;T[LEAN]=.05;T[TW]=0;break;}
   case'header':{const j=Math.sin(k*PI);T[Y]=.42*j*a.h;T[LEAN]=k<.45?-.3:.5*(1-k);T[LSZ]=T[RSZ]=.85;T[LEL]=T[REL]=1.1;T[LKN]=T[RKN]=.55*j;T[LHX]=T[RHX]=.15;break;}
   case'catch':{T[LSX]=T[RSX]=1.05;T[LEL]=T[REL]=1.75;T[LSZ]=T[RSZ]=.12;T[LEAN]=.15;break;}
   case'throwHold':{T[LSX]=T[RSX]=2.95;T[LEL]=T[REL]=1.55;T[LSZ]=T[RSZ]=.12;T[LEAN]=-.12;T[LHX]=.2;T[RHX]=-.2;break;}
   case'throw':{const t2=sm(k);T[LSX]=T[RSX]=lerp(2.95,1.2,t2);T[LEL]=T[REL]=lerp(1.55,.1,t2);T[LSZ]=T[RSZ]=.12;T[LEAN]=lerp(-.25,.35,t2);T[LHX]=.2;T[RHX]=-.25;break;}
   case'gkthrow':{const t2=sm(k);T[RSX]=lerp(-1.1,2.3,t2);T[REL]=.15;T[LSX]=.6;T[LSZ]=.5;T[LEAN]=.2;T[LHX]=.4;T[LKN]=.5;T[RHX]=-.3;break;}
   case'skill':{T[YAW]=e.face+a.side*2*PI*sm(k);T[HY]=-.08;T[LKN]=T[RKN]=.5;T[LSZ]=T[RSZ]=.6;break;}
   case'cele':{const t=a.t;if(a.v===0){T[LSZ]=T[RSZ]=1.5;T[LEL]=T[REL]=.05;T[LSX]=T[RSX]=0;T[ROL]=Math.sin(t*2.2)*.35;T[LEAN]=.2;}
    else if(a.v===1){if(sp<1.5){T[HY]=-.5;T[LHX]=T[RHX]=0;T[LKN]=T[RKN]=1.65;T[LAN]=T[RAN]=.6;T[LEAN]=-.42;T[LSZ]=T[RSZ]=2.4;T[LEL]=T[REL]=.2;T[LSX]=T[RSX]=.4;}}
    else if(a.v===2){const j=Math.abs(Math.sin(t*4.5));T[Y]=j*.4;T[RSX]=2.95;T[REL]=.4;T[LSZ]=.35;T[LKN]=T[RKN]=.4*(1-j);T[LEAN]=.05;}
    else{T[LSX]=T[RSX]=2.75;T[LEL]=T[REL]=.15;T[LSZ]=T[RSZ]=.25;T[LEAN]=-.15;}break;}
   case'hug':{T[LSX]=T[RSX]=1.4;T[LSZ]=T[RSZ]=.5;T[LEL]=T[REL]=1.2;T[Y]=Math.abs(Math.sin(a.t*5))*.15;break;}
   case'dejected':{T[LSX]=T[RSX]=2.45;T[LSZ]=T[RSZ]=.75;T[LEL]=T[REL]=2.35;T[LEAN]=.12;T[HD]=0;break;}
   case'card':{T[RSX]=3.05;T[REL]=0;T[RSZ]=.05;break;}
   case'flag':{T[RSX]=2.95;T[REL]=0;T[RSZ]=.25;break;}
   case'stumble':{T[LEAN]=.55*(1-k);T[HY]=-.12*(1-k);T[LSZ]=T[RSZ]=.6;break;}}
  if(a.t>=a.dur&&a.dur<90)a.act='';}
 const r=1-Math.exp(-dt*(a.act==='kick'||a.act==='header'?28:15));
 for(let i=0;i<NP;i++){if(i===X||i===Z||i===SC||i===VIS){Pz[i]=T[i];continue;}if(i===YAW){let d=T[i]-Pz[i];d=Math.atan2(Math.sin(d),Math.cos(d));Pz[i]+=d*Math.min(1,r*1.6);continue;}Pz[i]+=(T[i]-Pz[i])*r;}}
export function act(e,name,dur,o={}){const a=e.anim;a.act=name;a.t=0;a.dur=dur;a.side=o.side??1;a.pow=o.pow??1;a.h=o.h??1;a.v=o.v??0;}
