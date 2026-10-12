// RUNLINE — procedural runner rigs: full-body hologram figures (rival + personal-best ghost) and the first-person arms/legs viewmodel.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,TAU=Math.PI*2,cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k;

/* ---------- hologram material ---------- */
export function holoMat(col){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,
 uniforms:{uC:{value:new THREE.Color(col)},uT:{value:0},uA:{value:1}},
 vertexShader:'varying vec3 vN;varying vec3 vV;varying float vY;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;vN=normalMatrix*normal;vY=(modelMatrix*vec4(position,1.)).y;gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 uC;uniform float uT,uA;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),1.6);float s=.72+.28*sin(vY*42.-uT*9.);float d=smoothstep(80.,3.,length(vV))*.5+.5;gl_FragColor=vec4(uC*(.8+f*1.8)*s,(.22+f*.78)*uA*d);}'});}

/* ---------- limb helper: pivot -> upper bone (points -Y) -> joint pivot -> lower bone -> end ---------- */
function bone(len,r0,r1,mat){const g=new THREE.CapsuleGeometry((r0+r1)/2,len-(r0+r1),4,10);g.translate(0,-len/2,0);const m=new THREE.Mesh(g,mat);return m;}
function limb(l1,l2,r,mat,endMesh){const root=new THREE.Group(),up=bone(l1,r,r*.85,mat),j=new THREE.Group(),lo=bone(l2,r*.85,r*.7,mat),end=new THREE.Group();
 root.add(up);j.position.y=-l1;root.add(j);j.add(lo);end.position.y=-l2;j.add(end);if(endMesh)end.add(endMesh);return{root,j,end,up,lo};}

/* ======================= full-body figure ======================= */
export class Figure{
 constructor(col,label){const mat=this.mat=holoMat(col);this.g=new THREE.Group();const g=this.g;
  this.pelvis=new THREE.Group();this.pelvis.position.y=.95;g.add(this.pelvis);
  const hip=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.14,4,10),mat);hip.rotation.z=Math.PI/2;this.pelvis.add(hip);
  this.spine=new THREE.Group();this.spine.position.y=.08;this.pelvis.add(this.spine);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.32,4,12),mat);torso.position.y=.28;torso.scale.set(1.12,1,.7);this.spine.add(torso);
  this.neck=new THREE.Group();this.neck.position.y=.55;this.spine.add(this.neck);const head=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),mat);head.position.y=.13;head.scale.set(.92,1.08,1);this.neck.add(head);
  const visor=new THREE.Mesh(new THREE.BoxGeometry(.18,.045,.06),mat);visor.position.set(0,.15,-.1);this.neck.add(visor);
  this.arm=[-1,1].map(s=>{const hand=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),mat);const L=limb(.29,.27,.04,mat,hand);L.root.position.set(s*.2,.49,0);this.spine.add(L.root);return L;});
  this.leg=[-1,1].map(s=>{const foot=new THREE.Mesh(new THREE.BoxGeometry(.1,.08,.24),mat);foot.position.set(0,-.02,-.06);const L=limb(.44,.44,.058,mat,foot);L.root.position.set(s*.09,-.02,0);this.pelvis.add(L.root);return L;});
  this.col=col;if(label){const c=document.createElement('canvas');this.lc=c;c.width=256;c.height=64;const x=c.getContext('2d');x.font="700 30px 'JetBrains Mono', monospace";x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(8,10,16,.6)';x.beginPath();x.roundRect(8,8,240,48,24);x.fill();x.fillStyle='#'+new THREE.Color(col).getHexString();x.fillText(label,128,33);
   const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;this.tag=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,depthTest:false,fog:false}));this.tag.scale.set(1.1,.275,1);this.tag.position.y=2.25;this.setLabel(label);this.tag.renderOrder=5;g.add(this.tag);}
  this.ph=0;this.lean=0;this.roll=0;this.g.frustumCulled=false;}
 setLabel(s){if(!this.lc||this.lab===s)return;this.lab=s;const x=this.lc.getContext('2d');x.clearRect(0,0,256,64);x.font="700 28px 'JetBrains Mono', monospace";x.textAlign='center';x.textBaseline='middle';x.fillStyle='rgba(8,10,16,.66)';x.beginPath();x.roundRect(8,8,240,48,24);x.fill();x.fillStyle='#'+new THREE.Color(this.col).getHexString();x.fillText(s,128,33);this.tag.material.map.needsUpdate=true;}
 // pose: state r/j/w/s/u/g/m/v/f/idle, speed m/s, vy, side (wall side)
 pose(st,sp,vy,side,dt,t){const P=this;P.mat.uniforms.uT.value=t;const k=Math.min(1,dt*12);const run=st==='r'||st==='w'||st==='v'||st==='idle'&&sp>1;
  P.ph+=dt*(st==='w'?13:Math.max(5,sp*1.08));const s=Math.sin(P.ph),c=Math.cos(P.ph);
  let hip=[0,0],knee=[0,0],sh=[0,0],el=[0,0],shz=[0,0],lean=0,roll=0,py=.95,spX=0;
  if(st==='idle'&&sp<1){hip=[0,0];knee=[-.05,-.05];sh=[.08,.08];el=[.25,.25];shz=[.08,-.08];py=.95+Math.sin(t*2)*.01;}
  else if(run){const a=Math.min(1,sp/9);hip=[.85*s*a+.1,-.85*s*a+.1];knee=[-(.35+1.25*Math.max(0,-c))*a-.1,-(.35+1.25*Math.max(0,c))*a-.1];sh=[-.75*s*a,.75*s*a];el=[1.4,1.4];lean=-.22*a;py=.93+Math.abs(c)*.06*a;
   if(st==='w'){roll=-side*.45;shz[side>0?1:0]=-side*1.3;sh[side>0?1:0]=.6;el[side>0?1:0]=.2;}}
  else if(st==='s'){hip=[1.45,.95];knee=[-.08,-1.7];sh=[.5,-.4];el=[.4,.9];shz=[.5,-.3];py=.42;spX=.55;}
  else if(st==='u'){hip=[.7,.3];knee=[-1.1,-.6];sh=[.9,-.2];el=[.4,.5];shz=[side*.9,side*.9];py=.78;roll=side*.35;lean=-.15;}
  else if(st==='g'){hip=[.35,-.2];knee=[-.6,-.3];sh=[2.7,.2];el=[.05,.6];shz=[0,-.2];lean=-.1;py=.95;}
  else if(st==='m'){hip=[1.3,.5];knee=[-1.8,-1.2];sh=[2.6,2.6];el=[.5,.5];py=.85;lean=-.4;}
  else{/* air */const up=cl(vy/8,-1,1);hip=[.95,.25];knee=[-1.5,-.7];sh=[1.2-up*.6,.6+up*.4];el=[.7,.9];shz=[.5,-.5];lean=-.12;}
  P.pelvis.position.y=lerp(P.pelvis.position.y,py,k);P.lean=lerp(P.lean,lean,k);P.roll=lerp(P.roll,roll,k);P.spine.rotation.x=lerp(P.spine.rotation.x,P.lean+spX,k);P.g.rotation.z=P.roll;
  for(let i=0;i<2;i++){const L=P.leg[i],A=P.arm[i],sg=i?1:-1;L.root.rotation.x=lerp(L.root.rotation.x,hip[i],k);L.j.rotation.x=lerp(L.j.rotation.x,knee[i],k);
   A.root.rotation.x=lerp(A.root.rotation.x,sh[i],k);A.root.rotation.z=lerp(A.root.rotation.z,sg*.12+shz[i],k);A.j.rotation.x=lerp(A.j.rotation.x,el[i],k);}
  P.neck.rotation.x=-P.spine.rotation.x*.6;}
}

/* ======================= first-person viewmodel ======================= */
function sleeveTex(){const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d');x.fillStyle='#ecebe7';x.fillRect(0,0,64,256);x.fillStyle='#ff4d00';x.fillRect(0,150,64,26);x.fillStyle='#1d1f24';x.fillRect(0,176,64,8);
 for(let i=0;i<500;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.05})`;x.fillRect(Math.random()*64,Math.random()*256,2,2);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export class Viewmodel{
 constructor(vmCam,vmScene){this.cam=vmCam;this.scene=vmScene;
  const sleeve=new THREE.MeshStandardMaterial({map:sleeveTex(),roughness:.7}),glove=new THREE.MeshStandardMaterial({color:0x1b1d22,roughness:.55,metalness:.1}),tape=new THREE.MeshStandardMaterial({color:0xff4d00,roughness:.5,emissive:0x401000}),
   pants=new THREE.MeshStandardMaterial({color:0x2c3039,roughness:.85}),shoe=new THREE.MeshStandardMaterial({color:0xf2f2f0,roughness:.5}),sole=new THREE.MeshStandardMaterial({color:0xff4d00,roughness:.6}),dev=new THREE.MeshStandardMaterial({color:0x22252c,metalness:.7,roughness:.3}),
   led=new THREE.MeshStandardMaterial({color:0x111111,emissive:0xff6a1a,emissiveIntensity:3});this.led=led;
  this.arms=[-1,1].map(s=>{const hand=new THREE.Group();const palm=new THREE.Mesh(new THREE.BoxGeometry(.07,.085,.032),glove);palm.position.y=-.045;hand.add(palm);
   const fing=new THREE.Mesh(new THREE.BoxGeometry(.066,.075,.022),glove);fing.position.set(0,-.12,-.006);fing.rotation.x=.28;hand.add(fing);
   for(let f=0;f<3;f++){const ln=new THREE.Mesh(new THREE.BoxGeometry(.002,.07,.024),tape);ln.position.set(-.016+f*.016,-.12,-.006);ln.rotation.x=.28;hand.add(ln);}
   const th=new THREE.Mesh(new THREE.CapsuleGeometry(.012,.04,3,6),glove);th.position.set(s*-.04,-.07,-.02);th.rotation.z=s*.5;th.rotation.x=.4;hand.add(th);
   const kn=new THREE.Mesh(new THREE.BoxGeometry(.072,.018,.036),tape);kn.position.y=-.088;hand.add(kn);const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.043,.045,.04,10),glove);cuff.position.y=.0;hand.add(cuff);
   const L=limb(.3,.27,.04,sleeve,hand);L.lo.material=sleeve;L.root.position.set(s*.21,-.3,.14);this.cam.add(L.root);
   if(s<0){const box=new THREE.Mesh(new THREE.BoxGeometry(.07,.12,.06),dev);box.position.set(.0,-.14,-.035);L.j.add(box);const l=new THREE.Mesh(new THREE.BoxGeometry(.012,.09,.01),led);l.position.set(0,-.14,-.068);L.j.add(l);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.08,8),dev);barrel.position.set(0,-.22,-.04);L.j.add(barrel);L.hook=barrel;}
   L.root.traverse(o=>{if(o.isMesh){o.frustumCulled=false;}});return L;});
  this.legsG=new THREE.Group();vmScene.add(this.legsG);
  const hip=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.14,4,10),pants);hip.rotation.z=Math.PI/2;hip.scale.z=.8;this.legsG.add(hip);
  this.legs=[-1,1].map(s=>{const foot=new THREE.Group();const sh=new THREE.Mesh(new THREE.BoxGeometry(.11,.09,.28),shoe);sh.position.set(0,-.03,-.07);const so=new THREE.Mesh(new THREE.BoxGeometry(.115,.025,.29),sole);so.position.set(0,-.08,-.07);foot.add(sh,so);
   const L=limb(.45,.45,.058,pants,foot);L.root.position.set(s*.11,0,0);this.legsG.add(L.root);L.root.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});return L;});
  this.ph=0;this.t=0;this.sw=new V();this.kick=0;this.land=0;this.dash=0;this.grapT=0;this.vis=true;}
 // st: runner snapshot
 update(dt,R,o){this.t+=dt;const k=Math.min(1,dt*14),kf=Math.min(1,dt*20);const sp=R.hs,st=R.state,g=R.ground;
  this.ph+=dt*(st==='wall'?13.5:g?Math.max(4,sp*1.05):0);const s=Math.sin(this.ph),c=Math.cos(this.ph);const a=g||st==='wall'?Math.min(1,sp/10):0;
  this.dash=Math.max(0,this.dash-dt*4);this.land=Math.max(0,this.land-dt*3);
  // arm targets [shoulder pitch, shoulder roll, elbow] for left/right
  let A=[[.15,.05,.35],[.15,-.05,.35]];
  if(st==='mantle'){const m=R.mantle,kk=m?Math.min(1,m.t/m.dur):1;const pr=kk<.45?1.25:lerp(1.25,.35,(kk-.45)/.55);A=[[pr,.25,.25+kk*.5],[pr,-.25,.25+kk*.5]];}
  else if(st==='grap'){A=[[1.62,.05,.04],[.7+s*.1,-.1,1.2]];}
  else if(st==='slide'){A=[[.95,.35,.25],[.25,-.2,.6]];}
  else if(st==='roll'){A=[[1.1,.5,1.6],[1.1,-.5,1.6]];}
  else if(st==='wall'){const w=R.wallSide>0?1:0,f=1-w;A[w]=[1.2,(w?-1:1)*-.62,.18];A[f]=[.55+.7*s,(f?-1:1)*.08,1.45];}
  else if(g&&sp>1.2){A=[[.42+.82*s*a,.12,1.55+.15*s],[.42-.82*s*a,-.12,1.55-.15*s]];}
  else if(!g){const up=cl(R.vel.y/8,-1,1);A=[[1.05-up*.25,.2,.75],[.95-up*.3,-.2,.85]];if(R.vel.y<-9){A[0][0]=1.6+Math.sin(this.t*9)*.15;A[1][0]=1.5+Math.cos(this.t*8)*.15;}}
  if(this.dash>0){A[0][0]-=this.dash*.9;A[1][0]-=this.dash*.9;}
  for(let i=0;i<2;i++){const L=this.arms[i],t=A[i];L.root.rotation.x+=(t[0]-L.root.rotation.x)*(st==='grap'&&i===0?kf:k);L.root.rotation.z+=(t[1]-L.root.rotation.z)*k;L.j.rotation.x+=(t[2]-L.j.rotation.x)*k;L.root.rotation.y=(i?-1:1)*.12;}
  this.led.emissiveIntensity=R.grapTarget||st==='grap'?6:2.2;
  // legs: hips under the eye, swing by phase
  const eye=R.eyeH,slide=st==='slide';this.legsG.position.set(0,-eye+(slide?.38:st==='roll'?.5:.93),slide?.22:.16);this.legsG.visible=st!=='roll'&&st!=='mantle';
  let Lg=[[0,-.05],[0,-.05]];
  if(slide)Lg=[[1.3,-.1],[.7,-1.5]];
  else if(st==='wall')Lg=[[.9*s+.2,-(.5+1.1*Math.max(0,-c))],[-.9*s+.2,-(.5+1.1*Math.max(0,c))]];
  else if(g&&sp>.8)Lg=[[.8*s*a+.1,-(.3+1.2*Math.max(0,-c))*a-.08],[-.8*s*a+.1,-(.3+1.2*Math.max(0,c))*a-.08]];
  else if(!g)Lg=[[.95,-1.4],[.35,-.75]];
  for(let i=0;i<2;i++){const L=this.legs[i];L.root.rotation.x+=(Lg[i][0]-L.root.rotation.x)*k;L.j.rotation.x+=(Lg[i][1]-L.j.rotation.x)*k;}
  // legs follow travel direction a little
  let rel=0;if(sp>1.5){rel=Math.atan2(R.vel.x,R.vel.z)-(R.yaw+Math.PI);rel=Math.atan2(Math.sin(rel),Math.cos(rel));rel=cl(rel,-.9,.9);}this.legsG.rotation.y+=(rel-this.legsG.rotation.y)*k*.6;
  // camera-space sway
  this.cam.position.set(0,0,0);const bob=g&&!slide?Math.abs(Math.sin(this.ph))*.012*a:0;this.arms.forEach(L=>{L.root.position.y=-.3-bob-this.land*.05;});}
}
