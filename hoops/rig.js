// COURT KINGS — instanced articulated players (adapted from STRIKER 11's rig): one draw call per body part for everyone on
// the floor, tank-top jerseys with front/back numbers, baggy shorts, crew socks, high-top sneakers, arm sleeves and headbands.
// Poses come from procedural basketball animation: dribble, jumper, layup, dunk + rim hang, block, steal, screens, falls.
import * as THREE from '../vendor/three.module.min.js';
const O=()=>new THREE.Object3D();
export const X=0,Y=1,Z=2,YAW=3,PIT=4,ROL=5,HY=6,LEAN=7,TW=8,HD=9,LSX=10,LSZ=11,LEL=12,RSX=13,RSZ=14,REL=15,LHX=16,LHZ=17,LKN=18,RHX=19,RHZ=20,RKN=21,SC=22,VIS=23,LAN=24,RAN=25,NP=26;
const HIP=.95;
function numberAtlas(){const c=document.createElement('canvas');c.width=640;c.height=96;const t=new THREE.CanvasTexture(c);t.flipY=true;
 const draw=()=>{const x=c.getContext('2d');x.clearRect(0,0,640,96);x.fillStyle='#fff';x.font='400 92px Anton,Impact,sans-serif';x.textAlign='center';x.textBaseline='middle';for(let i=0;i<10;i++)x.fillText(String(i),i*64+32,50);t.needsUpdate=true;};
 draw();try{document.fonts.load('92px Anton').then(draw,()=>{});}catch(e){}return t;}
// mesh-knit jersey fabric baked to a normal map (procedural)
function fabricNormal(){const N=128,h=new Float32Array(N*N);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const hx=(x%4<2?1:0)*(y%4<2?1:0);h[y*N+x]=hx*.5+Math.sin((x*.3+y)/N*Math.PI*4)*1.1+(Math.random()-.5)*.1;}
 const c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),id=x.createImageData(N,N);
 for(let y=0;y<N;y++)for(let i=0;i<N;i++){const H=(a,b)=>h[((b+N)%N)*N+(a+N)%N],dx=(H(i+1,y)-H(i-1,y))*.9,dy=(H(i,y+1)-H(i,y-1))*.9,l=Math.hypot(dx,dy,1),k=(y*N+i)*4;
  id.data[k]=(-dx/l*.5+.5)*255;id.data[k+1]=(dy/l*.5+.5)*255;id.data[k+2]=(1/l*.5+.5)*255;id.data[k+3]=255;}
 x.putImageData(id,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,3);return t;}
let FABRIC=null;const fabric=()=>FABRIC||(FABRIC=fabricNormal());
// two-tone parts: instanceColor is the base, per-instance aC2 the second colour, masked in local space by `mode`
const TONE={arm:'m=step(-.135-aw*.4,vL.y);',farm:'m=step(-.235,vL.y)*aw;',
 thigh:'m=step(-.34,vL.y);sh=1.-.2*(1.-step(.012,abs(vL.y+.34)));',
 shin:'m=1.-step(-.29,vL.y);sh=1.-.12*step(abs(vL.y+.29),.01);',
 boot:'m=1.-step(-.06,vL.y);sh=1.;',
 shorts:'m=max(step(.0,vL.y),step(.17,abs(vL.x))*step(abs(vL.z),.11));sh=1.-.12*step(abs(vL.y-.0),.008);',
 head:`m=0.;vec3 q=vL;float fz=step(.07,q.z),ax=abs(q.x);
   float eye=1.-smoothstep(.009,.013,length(vec2(ax-.037,(q.y-.163)*1.25)));float wh=1.-smoothstep(.014,.018,length(vec2(ax-.037,(q.y-.163)*1.6)));
   float brow=step(abs(q.y-.186+ax*.08),.0055)*step(ax,.06)*step(.016,ax);float mouth=step(abs(q.y-.108-ax*ax*3.),.0035)*step(ax,.024);
   float band=aw*step(abs(q.y-.215),.022);
   m=max(brow*fz,band);sh=1.-mouth*fz*.45-.12*(1.-smoothstep(.05,.11,q.y));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.9,.86),wh*fz*.85*(1.-band));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.06,.05,.05),eye*fz);`};
function toneMat(r,mode,extra={}){const m=new THREE.MeshStandardMaterial({roughness:r,metalness:0,...extra});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 aC2;varying vec4 vC2;varying vec3 vL;').replace('#include <begin_vertex>','#include <begin_vertex>\nvC2=aC2;vL=position;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec4 vC2;varying vec3 vL;').replace('#include <color_fragment>',`#include <color_fragment>
  {float m=0.,sh=1.,aw=vC2.w;${TONE[mode]}diffuseColor.rgb=mix(diffuseColor.rgb,vC2.rgb,m)*sh;}`);};
 m.customProgramCacheKey=()=>'ck_tone_'+mode;return m;}
// jersey: base c1, trim c2 (neck + armholes), pattern, numbers front and back, skin at the open shoulders
function kitMaterial(numTex){const m=new THREE.MeshStandardMaterial({roughness:.62,metalness:0,normalMap:fabric(),normalScale:new THREE.Vector2(.35,.35),sheen:0});
 m.onBeforeCompile=sh=>{sh.uniforms.uNum={value:numTex};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 aK2;attribute vec3 aNum;attribute vec3 aSkin;varying vec4 vK2;varying vec3 vNum;varying vec3 vSkin;varying vec3 vL;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvK2=aK2;vNum=aNum;vSkin=aSkin;vL=position;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uNum;varying vec4 vK2;varying vec3 vNum;varying vec3 vSkin;varying vec3 vL;')
   .replace('#include <color_fragment>',`#include <color_fragment>
   {float m=0.;int pt=int(vK2.w+.5);vec3 base=diffuseColor.rgb;
    if(pt==1)m=step(.165,abs(vL.x))*step(vL.y,.48);else if(pt==2)m=step(.82,fract((vL.x+1.)*14.))*.85;else if(pt==3)m=smoothstep(.32,.04,vL.y)*.9;else if(pt==4)m=step(abs(vL.y-.3),.035);
    float ax=abs(vL.x),ah=length(vec2(ax-.26,(vL.y-.62)*1.1)),bare=1.-step(.12,ah),armTrim=step(.12,ah)*(1.-step(.145,ah));
    float fr=step(.0,vL.z),nc=ax*2.+(.6-vL.y)*(fr>.5?1.:2.6),neckBare=1.-step(fr>.5?.11:.05,nc),neckTrim=(1.-neckBare)*(1.-step(fr>.5?.135:.075,nc));
    diffuseColor.rgb=mix(base,vK2.rgb,m);diffuseColor.rgb=mix(diffuseColor.rgb,vK2.rgb,max(armTrim,neckTrim));diffuseColor.rgb=mix(diffuseColor.rgb,vSkin,max(bare,neckBare));
    float back=step(vL.z,-.04),front=step(.05,vL.z);float sc=back>.5?1.:.62,y0=back>.5?.14:.26,y1=y0+.27*sc,hw=.105*sc;
    if(vNum.x>-.5&&(back+front)>.5&&ax<hw&&vL.y>y0&&vL.y<y1){float n=vNum.x,u=(hw-vL.x*(back>.5?1.:-1.))/(2.*hw),v=(vL.y-y0)/(y1-y0),d=n,lu=u;
     if(n>=10.){if(u<.5){d=floor(n/10.);lu=u*2.;}else{d=mod(n,10.);lu=(u-.5)*2.;}lu=clamp(lu*1.15-.075,0.,1.);}
     vec2 q=vec2((d+lu)/10.,v);float a=texture2D(uNum,q).a,o=0.;for(int i=0;i<8;i++){float an=float(i)*.785;o=max(o,texture2D(uNum,q+vec2(cos(an)*.004,sin(an)*.035)).a);}
     diffuseColor.rgb=mix(diffuseColor.rgb,vK2.rgb,o);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(vNum.y),a);}}`);};
 m.customProgramCacheKey=()=>'ck_kit';return m;}
function limb(pr,zf,seg=10){const g=new THREE.LatheGeometry(pr.slice().reverse().map(([y,r])=>new THREE.Vector2(r,y)),seg);if(zf){const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)*zf(p.getZ(i),p.getY(i)));}g.computeVertexNormals();return g;}
const PARTS=['torso','shorts','head','hair','uarm','farm','thigh','shin','boot'];
export class Squad{
 constructor(scene,max=24){this.max=max;const numTex=numberAtlas();this.meshes=[];
  const std=(r=.75)=>new THREE.MeshStandardMaterial({roughness:r,metalness:0});
  const torsoG=new THREE.CylinderGeometry(.215,.165,.58,16,6);torsoG.scale(1,1,.6);torsoG.translate(0,.3,0);
  {const p=torsoG.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y>.5){const k=(y-.5)/.09;p.setX(i,p.getX(i)*(1-k*.2));p.setZ(i,p.getZ(i)*(1-k*.12));}
   const x=p.getX(i);if(y<.3)p.setX(i,x*(1+.05*Math.sin(y*9)));}torsoG.computeVertexNormals();}
  const shortsG=new THREE.CylinderGeometry(.185,.235,.48,16,3);shortsG.scale(1,1,.78);shortsG.translate(0,-.17,0);
  {const p=shortsG.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y<-.3){const z=p.getZ(i);if(Math.abs(p.getX(i))<.06&&z!==0)p.setZ(i,z*.55);}}shortsG.computeVertexNormals();}
  const headG=new THREE.SphereGeometry(.112,16,12);headG.scale(.95,1.12,1.04);headG.translate(0,.15,.005);
  {const p=headG.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),z=p.getZ(i);if(y<.12&&z>0)p.setX(i,p.getX(i)*(1-(.12-y)*1.6));}headG.computeVertexNormals();}
  const noseG=new THREE.ConeGeometry(.017,.042,6);noseG.rotateX(Math.PI*.6);noseG.translate(0,.142,.118);
  const earG=[-1,1].map(s=>{const e=new THREE.SphereGeometry(.026,8,6);e.scale(.45,1,.75);e.translate(s*.104,.152,0);return e;});
  const neck=new THREE.CylinderGeometry(.055,.064,.13,8);neck.translate(0,.02,0);
  const hairG=new THREE.SphereGeometry(.12,14,8,0,Math.PI*2,0,Math.PI*.5);hairG.scale(.97,1.02,1.06);hairG.translate(0,.17,-.01);
  const uarmG=limb([[.05,0],[.03,.06],[-.03,.068],[-.12,.06],[-.22,.05],[-.3,.045],[-.33,0]],z=>1-.12*(z>0)),farmG=limb([[.035,0],[.01,.048],[-.06,.053],[-.16,.043],[-.25,.035],[-.27,0]]);
  {const hand=new THREE.SphereGeometry(.055,8,6);hand.scale(.75,1.2,.6);hand.translate(0,-.31,.004);const th=new THREE.SphereGeometry(.022,6,4);th.scale(.8,1.4,.8);th.translate(.03,-.3,.02);farmG.copy(mergeGeo([farmG,hand,th]));}
  const thighG=limb([[.055,0],[.04,.072],[-.02,.094],[-.12,.088],[-.26,.076],[-.38,.062],[-.44,.057],[-.48,0]],(z,y)=>z>0&&y>-.36?1.08:1),shinG=limb([[.045,0],[.03,.057],[-.03,.062],[-.12,.068],[-.22,.056],[-.34,.045],[-.41,.044],[-.45,0]],(z,y)=>z<0&&y<-.02&&y>-.3?1+.3*Math.sin((y+.02)/-.28*Math.PI):1);
  const bootG=new THREE.CapsuleGeometry(.056,.17,3,10);bootG.rotateX(Math.PI/2);bootG.scale(1.05,.95,1);bootG.translate(0,-.04,.05);
  {const col=new THREE.CylinderGeometry(.062,.068,.11,10);col.translate(0,-.005,0);bootG.copy(mergeGeo([bootG,col]));}
  uarmG.scale(1,1.1,1);farmG.scale(1,1.1,1);const kit=kitMaterial(numTex);
  const mk=(g,m,k,tone)=>{if(tone)g.setAttribute('aC2',new THREE.InstancedBufferAttribute(new Float32Array(max*k*4),4));const im=new THREE.InstancedMesh(g,m,max*k);im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   for(let i=0;i<max*k;i++){im.setMatrixAt(i,new THREE.Matrix4().makeScale(0,0,0));im.setColorAt(i,new THREE.Color(1,1,1));}scene.add(im);this.meshes.push(im);return im;};
  torsoG.setAttribute('aK2',new THREE.InstancedBufferAttribute(new Float32Array(max*4),4));torsoG.setAttribute('aNum',new THREE.InstancedBufferAttribute(new Float32Array(max*3).fill(-1),3));torsoG.setAttribute('aSkin',new THREE.InstancedBufferAttribute(new Float32Array(max*3),3));
  const sm=toneMat(.7,'shorts');sm.normalMap=fabric();sm.normalScale=new THREE.Vector2(.3,.3);
  this.torso=mk(torsoG,kit,1);this.shorts=mk(shortsG,sm,1,true);this.head=mk(mergeGeo([headG,neck,noseG,...earG]),toneMat(.55,'head'),1,true);this.hair=mk(hairG,std(.95),1);
  this.uarm=mk(uarmG,toneMat(.55,'arm'),2,true);this.farm=mk(farmG,toneMat(.55,'farm'),2,true);this.thigh=mk(thighG,toneMat(.6,'thigh'),2,true);this.shin=mk(shinG,toneMat(.7,'shin'),2,true);this.boot=mk(bootG,toneMat(.4,'boot'),2,true);
  this.rigs=[];for(let i=0;i<max;i++)this.rigs.push(makeRig());this.hidden=new THREE.Matrix4().makeScale(0,0,0);}
 // look: {c1,c2,pat,sh,sh2,so,skin,hair,shoe,sole,num,sleeve,band,bald}
 setLook(i,L){const c=new THREE.Color(),g=this.torso.geometry.attributes;this.torso.setColorAt(i,c.set(L.c1));c.set(L.c2);g.aK2.setXYZW(i,c.r,c.g,c.b,L.pat||0);
  const nb=new THREE.Color(L.c1),lum=nb.r*.3+nb.g*.59+nb.b*.11;g.aNum.setXYZ(i,L.num==null?-1:L.num,lum>.55?.06:.97,0);c.set(L.skin);g.aSkin.setXYZ(i,c.r,c.g,c.b);
  const t2=(m,j,col,w=0)=>{c.set(col);m.geometry.attributes.aC2.setXYZW(j,c.r,c.g,c.b,w);};
  this.shorts.setColorAt(i,c.set(L.sh));t2(this.shorts,i,L.sh2||L.c2);this.head.setColorAt(i,c.set(L.skin));t2(this.head,i,L.band?L.band:L.hair,L.band?1:0);this.hair.setColorAt(i,c.set(L.hair));
  for(let s=0;s<2;s++){const j=i*2+s,sl=L.sleeve&&s===1;this.uarm.setColorAt(j,c.set(L.skin));t2(this.uarm,j,sl?L.sleeve:L.skin,sl?1:0);this.farm.setColorAt(j,c.set(L.skin));t2(this.farm,j,sl?L.sleeve:L.skin,sl?1:0);
   this.thigh.setColorAt(j,c.set(L.skin));t2(this.thigh,j,L.sh);this.shin.setColorAt(j,c.set(L.skin));t2(this.shin,j,L.so||'#f2f2f2');this.boot.setColorAt(j,c.set(L.shoe));t2(this.boot,j,L.sole||'#f4f4f0');}
  for(const m of[this.shorts,this.head,this.uarm,this.farm,this.thigh,this.shin,this.boot])m.geometry.attributes.aC2.needsUpdate=true;
  this.rigs[i].bald=!!L.bald;for(const m of this.meshes)m.instanceColor.needsUpdate=true;g.aK2.needsUpdate=g.aNum.needsUpdate=g.aSkin.needsUpdate=true;}
 pose(i,P){const r=this.rigs[i];if(!P[VIS]){for(const m of[this.torso,this.shorts,this.head,this.hair])m.setMatrixAt(i,this.hidden);for(const m of[this.uarm,this.farm,this.thigh,this.shin,this.boot]){m.setMatrixAt(i*2,this.hidden);m.setMatrixAt(i*2+1,this.hidden);}return;}
  const s=P[SC];r.root.position.set(P[X],P[Y]+(HIP+P[HY])*s,P[Z]);r.root.rotation.set(P[PIT],P[YAW],P[ROL],'YXZ');r.root.scale.setScalar(s);
  r.spine.rotation.set(P[LEAN],P[TW],0);r.neck.rotation.set(-P[LEAN]*.5,P[HD],0);
  r.sh[0].rotation.set(-P[LSX],0,P[LSZ]);r.el[0].rotation.x=-P[LEL];r.sh[1].rotation.set(-P[RSX],0,-P[RSZ]);r.el[1].rotation.x=-P[REL];
  r.hp[0].rotation.set(-P[LHX],0,P[LHZ]);r.kn[0].rotation.x=P[LKN];r.an[0].rotation.x=P[LAN];r.hp[1].rotation.set(-P[RHX],0,-P[RHZ]);r.kn[1].rotation.x=P[RKN];r.an[1].rotation.x=P[RAN];
  r.root.updateMatrixWorld(true);
  this.torso.setMatrixAt(i,r.spine.matrixWorld);this.shorts.setMatrixAt(i,r.root.matrixWorld);this.head.setMatrixAt(i,r.neck.matrixWorld);this.hair.setMatrixAt(i,r.bald?this.hidden:r.neck.matrixWorld);
  for(let k=0;k<2;k++){const j=i*2+k;this.uarm.setMatrixAt(j,r.sh[k].matrixWorld);this.farm.setMatrixAt(j,r.el[k].matrixWorld);this.thigh.setMatrixAt(j,r.hp[k].matrixWorld);this.shin.setMatrixAt(j,r.kn[k].matrixWorld);this.boot.setMatrixAt(j,r.an[k].matrixWorld);}}
 hand(i,k,out){return out.set(0,-.34,.01).applyMatrix4(this.rigs[i].el[k].matrixWorld);}
 headPos(i,out){return out.set(0,.16,0).applyMatrix4(this.rigs[i].neck.matrixWorld);}
 commit(){for(const m of this.meshes)m.instanceMatrix.needsUpdate=true;}
 // second set of instanced meshes sharing the same buffers, for the mirrored reflection under the glossy floor
 mirror(group){const out=[];for(const m of this.meshes){const im=new THREE.InstancedMesh(m.geometry,m.material,m.count);im.instanceMatrix=m.instanceMatrix;im.instanceColor=m.instanceColor;im.frustumCulled=false;im.castShadow=false;im.receiveShadow=false;im.userData.keep=true;group.add(im);out.push(im);}return out;}}
function makeRig(){const root=O(),spine=O(),neck=O();root.add(spine);spine.add(neck);neck.position.y=.6;
 const sh=[O(),O()],el=[O(),O()],hp=[O(),O()],kn=[O(),O()],an=[O(),O()];
 for(let k=0;k<2;k++){const s=k?-1:1;sh[k].position.set(s*.225,.52,0);spine.add(sh[k]);el[k].position.y=-.33;sh[k].add(el[k]);
  hp[k].position.set(s*.1,-.07,0);root.add(hp[k]);kn[k].position.y=-.43;hp[k].add(kn[k]);an[k].position.y=-.43;kn[k].add(an[k]);}
 return{root,spine,neck,sh,el,hp,kn,an,bald:false};}
function mergeGeo(list){const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;gs.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
 for(const g of gs){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));return r;}

/* ================= procedural animation ================= */
const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t),PI=Math.PI;
export function newAnim(){return{ph:Math.random()*6,act:'',t:0,dur:1,side:1,pow:1,v:0,h:0,turn:0,lastFace:0,rel:-1,dph:0};}
// e: {p,v,face,anim,pose,tp,h,visible,sprint, def, hands, drib (side or 0), hold, sit}
export function animate(e,dt){const a=e.anim,T=e.tp,Pz=e.pose;const sp=Math.hypot(e.v.x,e.v.z);
 a.ph+=dt*2*PI*(sp>.25?.8+sp*.17:0);const amp=cl(sp/6.4,0,1.15),walk=sp<2.2,air=(e.p.y||0)>.03;
 let df=e.face-a.lastFace;df=Math.atan2(Math.sin(df),Math.cos(df));a.lastFace=e.face;a.turn=lerp(a.turn,dt>0?df/dt:0,Math.min(1,dt*6));
 const s=Math.sin(a.ph),c=Math.cos(a.ph);
 T[X]=e.p.x;T[Y]=e.p.y||0;T[Z]=e.p.z;T[YAW]=e.face;T[PIT]=0;T[ROL]=cl(-a.turn*.045,-.3,.3)*Math.min(1,amp);T[SC]=e.h||1;T[VIS]=e.visible===false?0:1;T[TW]=-s*.12*amp;T[HD]=0;
 T[HY]=walk?-.01-.012*amp:-.035*amp+.05*amp*Math.abs(c);T[LEAN]=.05+amp*(e.sprint?.24:.15);
 const la=walk?.45:.8;T[LHX]=s*la*amp;T[RHX]=-s*la*amp;T[LHZ]=T[RHZ]=.04;
 T[LKN]=.12+amp*(walk?.25*Math.max(0,c):.15+1.2*Math.max(0,c));T[RKN]=.12+amp*(walk?.25*Math.max(0,-c):.15+1.2*Math.max(0,-c));T[LAN]=T[RAN]=-.05;
 T[LSX]=-s*.6*amp;T[RSX]=s*.6*amp;T[LSZ]=T[RSZ]=.12+.06*amp;T[LEL]=T[REL]=.25+(walk?.2:1)*amp;
 if(sp<.25){const b=Math.sin(performance.now()*.002+e.p.x)*.02;T[LSZ]=T[RSZ]=.13+b;T[LEL]=T[REL]=.22;T[LKN]=T[RKN]=.1;T[HY]=-.012;T[LEAN]=.04+b;}
 if(e.sit){T[HY]=-.5;T[LHX]=T[RHX]=1.5;T[LKN]=T[RKN]=1.5;T[LEAN]=.15+Math.sin(performance.now()*.0013+e.p.x)*.05;T[LSX]=T[RSX]=.5;T[LEL]=T[REL]=1.2;T[LSZ]=T[RSZ]=.1;T[LHZ]=T[RHZ]=.12;}
 // defensive stance: low, wide, arms out (or straight up to contest)
 if(e.def&&!a.act&&!air){T[HY]=-.1;T[LHX]+=.42;T[RHX]+=.42;T[LKN]=.95+T[LKN]*.4;T[RKN]=.95+T[RKN]*.4;T[LHZ]=T[RHZ]=.16;T[LEAN]=.3;T[TW]*=.3;
  if(e.hands){T[LSX]=T[RSX]=2.75;T[LSZ]=T[RSZ]=.3;T[LEL]=T[REL]=.25;}else{T[LSX]=T[RSX]=.6;T[LSZ]=T[RSZ]=.95+Math.sin(a.ph*.5)*.08;T[LEL]=T[REL]=.6;}}
 // dribble: the ball hand pumps with the bounce, the off arm guards
 if(e.drib&&!a.act){const R=e.drib>0,u=a.dph%1,sb=Math.abs(1-2*u),push=1-sb;
  const dsx=.55+amp*.25,dsz=.3,del=.45+push*.75;if(R){T[RSX]=dsx;T[RSZ]=dsz;T[REL]=del;T[LSX]=.95;T[LSZ]=.45;T[LEL]=1.1;}else{T[LSX]=dsx;T[LSZ]=dsz;T[LEL]=del;T[RSX]=.95;T[RSZ]=.45;T[REL]=1.1;}
  T[LEAN]+=.08;T[HY]-=.04;T[LKN]+=.15;T[RKN]+=.15;T[LHX]+=.08;T[RHX]+=.08;}
 if(e.hold&&!a.act){T[LSX]=T[RSX]=1.05;T[LEL]=T[REL]=1.5;T[LSZ]=T[RSZ]=-.32;T[LEAN]+=.08;if(!air&&sp<.5){T[HY]=-.06;T[LKN]=T[RKN]=.45;T[LHX]=T[RHX]=.25;}}
 if(air&&!a.act){T[LKN]=T[RKN]=.5;T[LHX]=T[RHX]=.2;T[LAN]=T[RAN]=.4;T[LSX]=T[RSX]=1.6;}
 if(a.act){a.t+=dt;const k=cl(a.t/a.dur,0,1),R=a.side>0;
  const arm=(sx,sz,el,right=true)=>{if(right===R){T[RSX]=sx;T[RSZ]=sz;T[REL]=el;}else{T[LSX]=sx;T[LSZ]=sz;T[LEL]=el;}};
  switch(a.act){
   case'shoot':{// jumper: gather at chest → set point above the forehead → release + follow-through
    const pre=sm(cl(a.t/.36,0,1)),rel=a.rel>=0;if(!rel){T[LSX]=T[RSX]=lerp(1.1,2.6,pre);T[LEL]=T[REL]=lerp(1.5,2.05,pre);T[LSZ]=T[RSZ]=lerp(-.3,-.12,pre);}
    else{const f=sm(cl((a.t-a.rel)/.12,0,1));T[RSX]=lerp(2.6,2.95,f);T[REL]=lerp(2.05,.12,f);T[RSZ]=-.1;T[LSX]=lerp(2.6,2.3,f);T[LEL]=lerp(2.05,.9,f);T[LSZ]=.1;}
    if(!air){const g=a.t<.2?sm(a.t/.2):1;T[HY]=-.13*g;T[LKN]=T[RKN]=1.05*g;T[LHX]=T[RHX]=.5*g;T[LEAN]=.12;T[LAN]=T[RAN]=-.1;}else{T[LKN]=T[RKN]=.25;T[LHX]=T[RHX]=.08;T[LAN]=T[RAN]=.55;T[LEAN]=-.04;T[HY]=0;}
    T[TW]=0;T[ROL]=0;break;}
   case'ft':{const pre=sm(cl(a.t/.5,0,1)),rel=a.rel>=0;T[HY]=-.08*(1-pre*.5);T[LKN]=T[RKN]=.6*(1-pre*.6);T[LHX]=T[RHX]=.3*(1-pre*.6);T[LEAN]=.08;
    if(!rel){T[LSX]=T[RSX]=lerp(1.05,2.5,pre);T[LEL]=T[REL]=lerp(1.5,2.05,pre);T[LSZ]=T[RSZ]=-.2;}else{const f=sm(cl((a.t-a.rel)/.14,0,1));T[RSX]=lerp(2.5,2.85,f);T[REL]=lerp(2.05,.12,f);T[LSX]=2.2;T[LEL]=.9;T[LSZ]=.1;T[RSZ]=-.1;}break;}
   case'layup':{// running one-hand finish: drive knee up, ball hand reaching for the glass
    const up=sm(cl(a.t/.28,0,1));arm(lerp(1.2,2.95,up),.05,lerp(1.3,.25,up),true);arm(lerp(1.1,1.5,up),.55,.9,false);
    if(R){T[LHX]=1.35*up;T[LKN]=1.6*up;T[RHX]=-.1;T[RKN]=.25;}else{T[RHX]=1.35*up;T[RKN]=1.6*up;T[LHX]=-.1;T[LKN]=.25;}T[LAN]=T[RAN]=.4;T[LEAN]=.05;T[TW]=(R?-1:1)*.15;break;}
   case'dunk':{// v 0 rising (ball cocked back), 1 slam, 2 hanging on the rim
    if(a.v===0){const up=sm(cl(a.t/.3,0,1));T[LSX]=T[RSX]=lerp(1.4,3.05,up);T[LEL]=T[REL]=lerp(1.4,1.25,up);T[LSZ]=T[RSZ]=.08;T[LKN]=T[RKN]=lerp(.5,1.25,up);T[LHX]=T[RHX]=lerp(.3,.9,up);T[LEAN]=-.18*up;T[LAN]=T[RAN]=.45;}
    else if(a.v===1){T[LSX]=T[RSX]=2.55;T[LEL]=T[REL]=.1;T[LSZ]=T[RSZ]=.1;T[LKN]=T[RKN]=1.3;T[LHX]=T[RHX]=.8;T[LEAN]=.3;}
    else{const sw=Math.sin(a.t*7)*.18;T[LSX]=T[RSX]=3.1;T[LEL]=T[REL]=.05;T[LSZ]=T[RSZ]=.12;T[LKN]=T[RKN]=1.25+sw;T[LHX]=T[RHX]=.55+sw;T[LEAN]=-.05;T[PIT]=sw*.4;T[LAN]=T[RAN]=.5;}
    T[TW]=0;T[ROL]=0;break;}
   case'block':{const up=sm(cl(a.t/.15,0,1));arm(lerp(1.2,3.1,up),.25,.08,true);arm(lerp(1.2,2.9,up),.35,.2,false);T[LKN]=T[RKN]=air?.35:.9;T[LHX]=T[RHX]=air?.1:.45;T[LAN]=T[RAN]=air?.5:0;T[LEAN]=.02;break;}
   case'reb':{const up=sm(cl(a.t/.18,0,1));T[LSX]=T[RSX]=lerp(1.3,2.9,up);T[LEL]=T[REL]=.35;T[LSZ]=T[RSZ]=.32;T[LKN]=T[RKN]=air?.45:.95;T[LHX]=T[RHX]=air?.2:.5;T[LAN]=T[RAN]=air?.45:0;break;}
   case'tip':{const up=sm(cl(a.t/.25,0,1));arm(lerp(1,3.12,up),.05,.05,true);arm(1,.5,.8,false);T[LKN]=air?.3:.9;T[RKN]=air?.6:.9;T[LHX]=T[RHX]=air?.1:.4;T[LAN]=T[RAN]=air?.5:0;break;}
   case'pass':{const f=sm(cl(k*2.2,0,1)),back=k>.6?sm((k-.6)/.4):0;T[LSX]=T[RSX]=lerp(1.0,1.5,f)*(1-back)+back*.3;T[LEL]=T[REL]=lerp(1.6,.1,f)*(1-back)+back*.3;T[LSZ]=T[RSZ]=-.25*(1-back);T[LEAN]+=.12*f*(1-back);break;}
   case'bpass':{const f=sm(cl(k*2.2,0,1)),back=k>.6?sm((k-.6)/.4):0;arm(lerp(.7,.85,f)*(1-back)+back*.3,-.05,lerp(1.2,.05,f)*(1-back),true);T[LEAN]+=.25*f*(1-back);T[HY]=-.08*f*(1-back);break;}
   case'lob':{const f=sm(cl(k*2.2,0,1)),back=k>.6?sm((k-.6)/.4):0;T[LSX]=T[RSX]=lerp(1.6,2.8,f)*(1-back)+back*.3;T[LEL]=T[REL]=lerp(1.4,.1,f)*(1-back);T[LSZ]=T[RSZ]=-.1;break;}
   case'cross':{const w=Math.sin(k*PI);T[HY]=-.12;T[LKN]+=.45;T[RKN]+=.45;T[LHX]+=.25;T[RHX]+=.25;T[LEAN]=.32;T[ROL]=a.side*.22*w;T[TW]=a.side*.32*w;T[LHZ]=T[RHZ]=.2;break;}
   case'spin':{T[YAW]=e.face-a.side*2*PI*sm(k);T[HY]=-.1;T[LKN]+=.4;T[RKN]+=.4;T[LSZ]=T[RSZ]=.6;T[LEL]=T[REL]=.9;T[LEAN]=.2;break;}
   case'step':{const w=Math.sin(k*PI);T[LEAN]=-.15*w+.1;T[HY]=-.08*w;T[LHX]=-.3*w;T[RHX]=.45*w;T[LKN]=.5;T[RKN]=.7*w;break;}
   case'steal':{const w=Math.sin(k*PI);arm(lerp(.5,1.35,w),-.15,.08,true);T[LEAN]=.25+.3*w;T[HY]=-.14*w;T[LKN]=.5+.4*w;T[RKN]=.8*w;T[LHX]=.4*w;T[RHX]=-.2*w;break;}
   case'screen':{T[HY]=-.07;T[LHX]=T[RHX]=.15;T[LKN]=T[RKN]=.35;T[LHZ]=T[RHZ]=.26;T[LSX]=T[RSX]=.85;T[LSZ]=T[RSZ]=-.5;T[LEL]=T[REL]=1.95;T[LEAN]=.08;T[TW]=0;T[ROL]=0;break;}
   case'fall':{const up=k>.72?sm((k-.72)/.28):0,d=1-up,i=sm(Math.min(1,k*4));T[PIT]=-1.35*i*d;T[HY]=-.82*i*d;T[LHX]=T[RHX]=1.1*i*d;T[LKN]=T[RKN]=.5*d;T[LSX]=T[RSX]=1.7*i*d;T[LSZ]=T[RSZ]=.5;T[LEL]=T[REL]=.4*d;T[LEAN]=.25*d;break;}
   case'stumble':{const w=Math.sin(k*PI);T[LEAN]=.5*w;T[HY]=-.14*w;T[LSZ]=T[RSZ]=.7*w;T[LSX]=T[RSX]=.6*w;break;}
   case'cele':{const t=a.t;if(a.v===0){T[LSZ]=T[RSZ]=1.55;T[LEL]=T[REL]=2.2;T[LSX]=T[RSX]=.2;T[LEAN]=-.08;T[HY]=-.05;}
    else if(a.v===1){T[RSX]=3.05;T[REL]=.05;T[LSX]=.4;T[LSZ]=.3;T[HD]=0;T[LEAN]=-.1;}
    else if(a.v===2){const j=Math.abs(Math.sin(t*6));T[LSX]=T[RSX]=1.35;T[LEL]=T[REL]=2.3;T[LSZ]=T[RSZ]=-.35;T[LEAN]=-.12-j*.06;T[Y]=(e.p.y||0)+j*.05;}
    else{T[LSZ]=T[RSZ]=.45;T[LSX]=T[RSX]=2.7;T[LEL]=T[REL]=.15;T[LEAN]=-.15;}break;}
   case'hifive':{T[RSX]=2.6;T[REL]=.2;T[RSZ]=.1;break;}
   case'dejected':{T[LSX]=T[RSX]=0;T[LSZ]=T[RSZ]=.08;T[LEAN]=.18;T[HD]=0;T[HY]=-.02;break;}
   case'hands':{T[LSX]=T[RSX]=.25;T[LSZ]=T[RSZ]=.7;T[LEL]=T[REL]=.3;T[LEAN]=.05;break;}// "who, me?" after a whistle
   case'whistle':{T[RSX]=2.7;T[REL]=.4;T[RSZ]=.1;T[LSX]=1.3;T[LEL]=1.4;break;}
   case'catch':{T[LSX]=T[RSX]=1.25;T[LEL]=T[REL]=.8;T[LSZ]=T[RSZ]=-.18;break;}}
  if(a.t>=a.dur&&a.dur<90){a.act='';a.rel=-1;}}
 const r=1-Math.exp(-dt*(a.act==='shoot'||a.act==='pass'||a.act==='block'||a.act==='steal'||a.act==='dunk'||a.act==='cross'?26:15));
 for(let i=0;i<NP;i++){if(i===X||i===Z||i===SC||i===VIS){Pz[i]=T[i];continue;}if(i===Y){Pz[i]=T[i];continue;}if(i===YAW){let d=T[i]-Pz[i];d=Math.atan2(Math.sin(d),Math.cos(d));Pz[i]+=d*Math.min(1,r*1.6);continue;}Pz[i]+=(T[i]-Pz[i])*r;}}
export function act(e,name,dur,o={}){const a=e.anim;a.act=name;a.t=0;a.dur=dur;a.side=o.side??1;a.pow=o.pow??1;a.h=o.h??1;a.v=o.v??0;a.rel=-1;}
