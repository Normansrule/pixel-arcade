// VOIDWING — starfighter classes + procedural models (two original factions), cockpit, capital ships (frigate, flagship) with subsystems.
import * as THREE from '../vendor/three.module.min.js';
import {V,C,M4,merge,boxUV,ctex,rng,TAU} from './util.js';

export const TEAMS=[{name:'AURORA COMPACT',short:'AURORA',col:'#4db8ff',bolt:[.5,1.9,3.4],paint:0xd9dde2,dark:0x30363f,acc:0x2f86d6,glow:new C(.6,1.6,4)},
 {name:'VESPER HOLLOW',short:'VESPER',col:'#ff4a3d',bolt:[3.6,.7,.35],paint:0x5b5f69,dark:0x24262c,acc:0x9a2416,glow:new C(4,1.1,.5)}];
// class stats (shared by both factions; names/models differ)
export const CLASSES={
 interceptor:{role:'INTERCEPTOR',names:['KESTREL','SHRIKE'],spd:165,boost:290,acc:70,rate:[1.85,1.55,3.2],hull:85,shield:45,rad:5.5,
  laser:{rof:9,dmg:6.5,heat:.052,spd:950,spread:.006,cool:.55},sec:{kind:'seeker',name:'SEEKER PODS',n:6,lock:.7,dmg:42,spd:420,turn:3.4},cm:3,boostCap:4.5,
  blurb:'Fastest and most agile. Light shields, rapid lasers, quick-locking seeker pods. Hunts bombers.',stats:{SPEED:1,AGILITY:1,ARMOR:.3,FIREPOWER:.55}},
 fighter:{role:'FIGHTER',names:['HALBERD','TALON'],spd:140,boost:250,acc:55,rate:[1.45,1.2,2.6],hull:130,shield:85,rad:6.5,
  laser:{rof:7,dmg:8.5,heat:.045,spd:900,spread:.006,cool:.5},sec:{kind:'lance',name:'LANCE MISSILES',n:4,lock:1.3,dmg:85,spd:360,turn:2.4},cm:3,boostCap:4,
  blurb:'Balanced dogfighter. Solid shields, heavy lasers and hard-hitting lance missiles.',stats:{SPEED:.7,AGILITY:.7,ARMOR:.6,FIREPOWER:.75}},
 bomber:{role:'BOMBER',names:['BULWARK','MAUL'],spd:112,boost:200,acc:40,rate:[1.05,.9,1.9],hull:210,shield:140,rad:8.5,
  laser:{rof:5,dmg:10,heat:.05,spd:850,spread:.007,cool:.45},sec:{kind:'torpedo',name:'BREACHER TORPEDOES',n:6,lock:1.9,dmg:340,spd:260,turn:1.4,capOnly:true},cm:4,boostCap:3.5,
  blurb:'Slow and tough. Breacher torpedoes gut capital-ship subsystems. The fleet-battle closer.',stats:{SPEED:.35,AGILITY:.35,ARMOR:1,FIREPOWER:1}},
};
export const CLASS_IDS=['interceptor','fighter','bomber'];

/* ================= textures + materials ================= */
let TX=null;
function textures(){if(TX)return TX;const r=rng(9);
 const panel=ctex(512,512,(x,w,h)=>{x.fillStyle='#c8c8c8';x.fillRect(0,0,w,h);
  for(let i=0;i<90;i++){const pw=32*(1+(r()*4|0)),ph=32*(1+(r()*3|0)),px=(r()*16|0)*32,py=(r()*16|0)*32;const v=180+r()*60|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(px,py,pw,ph);}
  x.strokeStyle='rgba(40,40,40,.55)';x.lineWidth=2;for(let i=0;i<=16;i++){if(r()<.55){x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32,h);x.stroke();}if(r()<.55){x.beginPath();x.moveTo(0,i*32);x.lineTo(w,i*32);x.stroke();}}
  x.strokeStyle='rgba(30,30,30,.4)';x.lineWidth=1;for(let i=0;i<60;i++){const px=(r()*16|0)*32,py=(r()*16|0)*32;x.strokeRect(px+.5,py+.5,32*(1+(r()*2|0)),32*(1+(r()*2|0)));}
  x.fillStyle='rgba(30,30,30,.5)';for(let i=0;i<500;i++){x.fillRect((r()*64|0)*8+2,(r()*64|0)*8+2,1.5,1.5);}
  for(let i=0;i<14;i++){x.fillStyle=`rgba(255,255,255,${.12+r()*.1})`;x.fillRect((r()*16|0)*32,(r()*16|0)*32,32,8);}
  for(let i=0;i<300;i++){x.fillStyle=`rgba(0,0,0,${r()*.06})`;const s=4+r()*30;x.fillRect(r()*w,r()*h,s,s*r());}});
 // capital-ship window lights (emissive)
 const win=ctex(512,512,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);for(let row=0;row<40;row++){if(r()<.55)continue;const y=row*12.8+4;let px=r()*40;while(px<w){const run=10+r()*90;if(r()<.6){for(let k=px;k<px+run&&k<w;k+=5){const b=r();if(b<.85){x.fillStyle=b<.1?'#9fd4ff':'#ffd9a0';x.globalAlpha=.5+r()*.5;x.fillRect(k,y,2.5,2);}}}px+=run+r()*60;}}x.globalAlpha=1;});
 const rough=ctex(256,256,(x,w,h)=>{x.fillStyle='#8a8a8a';x.fillRect(0,0,w,h);for(let i=0;i<900;i++){const v=100+r()*120|0;x.fillStyle=`rgba(${v},${v},${v},.35)`;x.fillRect(r()*w,r()*h,2+r()*20,1+r()*6);}},{srgb:false});
 return TX={panel,win,rough};}
const MATS={};
export function mats(team){if(MATS[team])return MATS[team];const T=textures(),t=TEAMS[team];
 const hull=new THREE.MeshStandardMaterial({map:T.panel,roughnessMap:T.rough,vertexColors:true,metalness:team?.65:.45,roughness:team?.5:.42,envMapIntensity:1.2});
 const glow=new THREE.MeshBasicMaterial({color:t.glow,toneMapped:false});
 const glass=new THREE.MeshStandardMaterial({color:team?0x2a0a08:0x0a1a2c,metalness:.95,roughness:.06,envMapIntensity:2.2,emissive:team?0x260404:0x041226});
 const pit=new THREE.MeshStandardMaterial({map:T.panel,vertexColors:true,color:0x6a6a6a,metalness:.3,roughness:.7,envMapIntensity:.25});
 const capHull=new THREE.MeshStandardMaterial({map:T.panel,roughnessMap:T.rough,vertexColors:true,metalness:.3,roughness:.62,emissiveMap:T.win,emissive:new C(1.6,1.3,1),envMapIntensity:1});
 return MATS[team]={hull,glow,glass,capHull,pit};}

/* ================= geometry helpers ================= */
// box whose front (-z) face is scaled by fx/fy and back (+z) face by bx/by — wedges, noses, tapered hulls
function taper(w,h,l,fx=1,fy=1,bx=1,by=1,dy=0){const g=new THREE.BoxGeometry(w,h,l,1,1,1);const p=g.attributes.position;for(let i=0;i<p.count;i++){const z=p.getZ(i),f=z<0;p.setX(i,p.getX(i)*(f?fx:bx));p.setY(i,p.getY(i)*(f?fy:by)+(f?dy:0));}g.computeVertexNormals();return g;}
const cyl=(r1,r2,h,s=12)=>new THREE.CylinderGeometry(r1,r2,h,s,1);
const RX=Math.PI/2;
class Kit{constructor(team){this.t=TEAMS[team];this.h=[];this.g=[];this.gl=[];}
 hull(g,m,c='p'){this.h.push([g,m,c==='p'?this.t.paint:c==='d'?this.t.dark:c==='a'?this.t.acc:c]);return this;}
 glow(g,m){this.gl.push([g,m]);return this;}
 glass(g,m){this.g.push([g,m]);return this;}
 build(team,uvScale=.5){const M=mats(team),grp=new THREE.Group();const hg=merge(this.h);boxUV(hg,uvScale);const hm=new THREE.Mesh(hg,M.hull);hm.castShadow=true;hm.receiveShadow=true;grp.add(hm);
  if(this.g.length){const gm=new THREE.Mesh(merge(this.g),M.glass);grp.add(gm);grp.userData.glass=gm;}
  if(this.gl.length){const lm=new THREE.Mesh(merge(this.gl),M.glow);grp.add(lm);grp.userData.glowMesh=lm;}grp.userData.hull=hm;return grp;}}

/* ================= starfighters ================= */
export function buildFighter(cls,team){const k=new Kit(team),ud={guns:[],eng:[],eye:new V(0,.6,-1),msl:[]};
 const engine=(x,y,z,r,l)=>{k.hull(cyl(r*1.05,r*.8,l,14),M4(x,y,z,RX),'d').hull(cyl(r*1.15,r*1.15,l*.25,14),M4(x,y,z+l*.42,RX),'a');k.glow(new THREE.CircleGeometry(r*.85,16),M4(x,y,z+l*.5+.02));ud.eng.push(new V(x,y,z+l*.5+.3));};
 const gun=(x,y,z,l=2.6)=>{k.hull(cyl(.12,.16,l,6),M4(x,y,z,RX),'d').hull(cyl(.26,.26,.6,8),M4(x,y,z+l*.4,RX),'d');ud.guns.push(new V(x,y,z-l*.5-.2));};
 if(team===0){
  if(cls==='interceptor'){// KESTREL: needle fuselage, forward-swept split wings, twin engines
   k.hull(taper(1.5,1.2,6,.35,.4,1,1),M4(0,0,-1.2)).hull(new THREE.ConeGeometry(.55,2.6,4),M4(0,0,-5.4,-RX,0,Math.PI/4,1,1,1),'p').hull(taper(2.4,.9,3,.9,.8,1,1),M4(0,0,2.8),'d');
   for(const s of[-1,1]){k.hull(taper(3.6,.18,1.8,1,1,1,1),M4(s*2.6,0,1.2,0,s*.42,0),'p').hull(taper(.2,.2,2.2,.6,.6,1,1),M4(s*4.3,0,.3),'a');gun(s*4.35,0,-1.1,2.4);
    k.hull(taper(.12,1.6,1.4,1,.5,1,1),M4(s*1,.9,3,0,0,s*.25),'a');engine(s*.85,0,3.6,.5,2.2);}
   k.glass(new THREE.SphereGeometry(.62,14,10,0,TAU,0,Math.PI/2),M4(0,.48,-2.1,0,0,0,1,1,2.2));ud.eye.set(0,.9,-1.9);ud.msl.push(new V(-.9,-.6,0),new V(.9,-.6,0));}
  else if(cls==='fighter'){// HALBERD: tri-wing Y frame, three cannon pods
   k.hull(taper(1.9,1.6,8,.5,.45,.9,.9),M4(0,0,-.6)).hull(taper(1.2,1,2,.3,.3,1,1),M4(0,-.1,-5.4),'p').hull(taper(2.4,1.9,2.4,1,1,.85,.85),M4(0,0,3.6),'d');
   for(const a of[0,TAU/3,-TAU/3]){const ca=Math.cos(a),sa=Math.sin(a),L=4.2;const m=new THREE.Matrix4().makeRotationZ(a);const wg=taper(.24,L,2.6,1,1,1,1);wg.translate(0,L/2+.6,1.2);wg.applyMatrix4(m);k.hull(wg,null,'p');
    const st=taper(.3,L*.6,.5,1,1,1,1);st.translate(0,L*.55+.6,2.6);st.applyMatrix4(m);k.hull(st,null,'a');
    const tip=new V(-sa*(L+.6),ca*(L+.6),0);k.hull(cyl(.3,.3,3.4,8),M4(tip.x,tip.y,.6,RX),'d');gun(tip.x,tip.y,-1.6,2.6);
    k.glow(new THREE.CircleGeometry(.24,10),M4(tip.x,tip.y,2.31));}
   engine(-.7,-.1,4.9,.55,1.6);engine(.7,-.1,4.9,.55,1.6);
   k.glass(new THREE.SphereGeometry(.75,14,10,0,TAU,0,Math.PI/2),M4(0,.7,-2.6,0,0,0,1,1,2.1));ud.eye.set(0,1.15,-2.4);ud.msl.push(new V(-.9,-.9,-1),new V(.9,-.9,-1));}
  else{// BULWARK: broad lifting body, twin nacelles, chin cockpit
   k.hull(taper(5,1.6,11,.55,.6,1,1),M4(0,0,0)).hull(taper(2.4,1.6,3.2,.5,.6,1,1),M4(0,.3,-6.6),'p').hull(taper(4.2,.6,9,.6,1,1,1),M4(0,1,.6),'a').hull(taper(3,1.2,5,1,1,1,1),M4(0,-1.2,.5),'d');
   for(const s of[-1,1]){k.hull(cyl(1.15,1.05,9,14),M4(s*3.7,-.1,.8,RX),'p').hull(taper(1.8,.35,6,.6,1,1,1),M4(s*2.6,0,.4),'d');engine(s*3.7,-.1,5.9,.95,1.6);gun(s*3.7,-.1,-4.6,2.4);
    k.hull(taper(.2,2.2,3,.4,.6,1,1),M4(s*3.7,1.3,3.6,0,0,0),'a');}
   k.hull(new THREE.SphereGeometry(.8,12,8,0,TAU,0,Math.PI/2),M4(0,1.3,2.2),'d');k.hull(cyl(.1,.1,1.8,6),M4(0,1.75,1.4,RX),'d');
   k.glass(new THREE.SphereGeometry(.85,14,10,0,TAU,0,Math.PI/2),M4(0,.85,-6.2,0,0,0,1.1,1,2));ud.eye.set(0,1.35,-6.3);ud.msl.push(new V(0,-1.9,-1),new V(0,-1.9,1));}}
 else{
  if(cls==='interceptor'){// SHRIKE: armoured pod inside a ring wing
   k.hull(new THREE.SphereGeometry(1.2,16,12),M4(0,0,-.4,0,0,0,1,.9,1.7),'p').hull(new THREE.TorusGeometry(3.3,.32,8,28),M4(0,0,.6,0,0,0,1,1,1),'p');
   for(const a of[Math.PI/4,3*Math.PI/4,5*Math.PI/4,7*Math.PI/4]){const m=new THREE.Matrix4().makeRotationZ(a);const sp=taper(.3,2.3,.9,1,1,1,1);sp.translate(0,2.1,.6);sp.applyMatrix4(m);k.hull(sp,null,'d');}
   for(const a of[0,Math.PI/2,Math.PI,-Math.PI/2]){const x=Math.cos(a)*3.3,y=Math.sin(a)*3.3;k.hull(taper(.6,.6,1.6,.7,.7,1,1),M4(x,y,.6),'a');}
   gun(-3.3,0,-.9,2);gun(3.3,0,-.9,2);k.hull(taper(1.2,1,2.4,1,1,.8,.8),M4(0,0,2.2),'d');engine(0,0,3.4,.62,1);
   k.glass(new THREE.SphereGeometry(.7,14,10),M4(0,.15,-1.75,0,0,0,1,.7,.6));ud.eye.set(0,.35,-1.3);ud.msl.push(new V(0,-1.2,0),new V(0,1.2,0));}
  else if(cls==='fighter'){// TALON: wedge body with two forward-curving claw wings
   k.hull(taper(2.2,1.3,8,.35,.5,1,1),M4(0,0,0)).hull(taper(3,1.5,2.4,1,1,.85,.85),M4(0,0,4.6),'d');
   for(const s of[-1,1]){for(let i=0;i<5;i++){const a=i/4;const x=s*(1.6+Math.sin(a*1.4)*3.4),z=2.2-a*6.2;k.hull(taper(.5,.32,1.8,.85,.85,1,1),M4(x,0,z,0,s*(.55-a*1.25),0),i===2?'a':'p');}
    gun(s*4.6,0,-5.2,2.2);k.hull(taper(.15,1.5,1.8,1,.4,1,1),M4(s*1.2,.8,3.6,0,0,s*.3),'a');engine(s*.85,0,6,.55,1.4);}
   k.glass(taper(1,.6,2,.4,.4,1,1),M4(0,.75,-1.8));ud.eye.set(0,1.05,-1.6);ud.msl.push(new V(-1.2,-.7,0),new V(1.2,-.7,0));}
  else{// MAUL: heavy armoured wedge, twin engine blocks, ventral torpedo rack
   k.hull(taper(4.6,2.4,13,.35,.4,1,1),M4(0,0,0)).hull(taper(5.4,1,6,.8,1,1,1),M4(0,1.4,2.4),'d').hull(taper(2,1,8,.6,1,1,1),M4(0,-1.6,0),'a');
   for(const s of[-1,1]){k.hull(taper(2,2,6,1,1,1,1),M4(s*3.3,0,3.4),'p').hull(taper(.2,3.2,4,.4,.5,1,1),M4(s*3.3,1.9,4.8),'a');engine(s*3.3,0,6.6,.85,1.6);gun(s*2,-.4,-6,2.6);}
   k.glass(taper(1.6,.7,2.4,.5,.5,1,1),M4(0,1.25,-3.6));ud.eye.set(0,1.75,-3.4);ud.msl.push(new V(-.8,-2.1,0),new V(.8,-2.1,0));}}
 const g=k.build(team,.14);Object.assign(g.userData,ud);
 // engine light cones (additive) for the glow halo
 g.userData.flames=ud.eng.map(e=>{const f=new THREE.Mesh(FLAME_GEO,flameMat(team));f.position.copy(e);f.scale.setScalar(cls==='bomber'?1.6:1.1);g.add(f);return f;});
 return g;}
const FLAME_GEO=(()=>{const g=new THREE.ConeGeometry(.5,3,12,1,true);g.rotateX(-RX);g.translate(0,0,1.5);return g;})();
const FM={};function flameMat(team){return FM[team]||(FM[team]=new THREE.ShaderMaterial({uniforms:{uC:{value:TEAMS[team].glow.clone().multiplyScalar(.8)},uK:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
 vertexShader:'varying vec3 vN,vV;varying float vZ;void main(){vZ=position.z/3.;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 uC;uniform float uK;varying vec3 vN,vV;varying float vZ;void main(){float f=pow(abs(dot(vN,vV)),1.5);float a=(1.-vZ)*(1.-vZ)*f*uK;gl_FragColor=vec4(uC*a,1.);}'}));}

/* ================= cockpit (seen from inside) ================= */
export function buildCockpit(team,cls){const k=new Kit(team),g0=new THREE.Group();
 const W=cls==='bomber'?1.2:1,Z=-1.05;
 // dashboard slab low in view + side consoles
 k.hull(taper(1.7*W,.34,.55,1,1,1,1),M4(0,-.78,Z+.2,-.25),'d').hull(taper(1.74*W,.04,.6,1,1,1,1),M4(0,-.6,Z+.22,-.25),'d').hull(taper(1.6*W,.012,.02,1,1,1,1),M4(0,-.575,Z-.07,-.25),'a');
 for(const s of[-1,1])k.hull(taper(.4,.5,1.4,1,1,1,1),M4(s*1.02*W,-.72,Z+.65,0,0,s*.2),'d');
 // canopy frame: sill, two front pillars, top arch, roof spars
 const strut=(a,b,r=.022)=>{const d=new V().subVectors(b,a),L=d.length();const g=cyl(r,r*1.15,L,6);const m=new THREE.Matrix4().lookAt(new V(),d,Math.abs(d.y)>.9*L?new V(1,0,0):new V(0,1,0)).multiply(new THREE.Matrix4().makeRotationX(RX));m.setPosition(new V().addVectors(a,b).multiplyScalar(.5));k.hull(g,m,'d');};
 const sill=[new V(-1.05*W,-.55,Z+.15),new V(1.05*W,-.55,Z+.15)];strut(sill[0],sill[1],.03);
 const L1=new V(-.98*W,-.55,Z+.1),L2=new V(-.7*W,.45,Z-.05),T=new V(0,.62,Z-.1),R2=new V(.7*W,.45,Z-.05),R1=new V(.98*W,-.55,Z+.1);
 strut(L1,L2,.03);strut(L2,T);strut(T,R2);strut(R2,R1,.03);strut(L2,new V(-.85*W,.62,Z+1.4),.026);strut(R2,new V(.85*W,.62,Z+1.4),.026);strut(T,new V(0,.85,Z+1.4),.02);
 // screens + buttons (screen gets a live canvas texture)
 const scr=document.createElement('canvas');scr.width=512;scr.height=192;const tex=new THREE.CanvasTexture(scr);tex.colorSpace=THREE.SRGBColorSpace;
 const sm=new THREE.Mesh(new THREE.PlaneGeometry(.5,.19),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));sm.position.set(0,-.585,Z+.18);sm.rotation.x=-1.0;g0.add(sm);
 const g=k.build(team,2);g.userData.hull.material=mats(team).pit;g.add(g0);g.userData.screen={c:scr,x:scr.getContext('2d'),tex,t:0};
 const bm=new THREE.MeshBasicMaterial({color:new C(.9,.5,.15),toneMapped:false}),bg=new THREE.BoxGeometry(.024,.008,.024);for(let i=0;i<12;i++){const s=i<6?-1:1;const b=new THREE.Mesh(bg,i%3?bm:new THREE.MeshBasicMaterial({color:TEAMS[team].glow.clone().multiplyScalar(.25),toneMapped:false}));b.position.set(s*(.36+(i%6)*.05)*W,-.585,Z+.14+(i%2)*.05);b.rotation.x=-.25;g0.add(b);}
 const lev=new THREE.Mesh(cyl(.016,.016,.2,6),mats(team).hull);lev.position.set(-.78*W,-.62,Z+.55);g.add(lev);g.userData.lever=lev;
 g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});return g;}

/* ================= capital ships ================= */
// returns {group, subs:[{id,kind,label,lp,r,mesh}], hullS:[[x,y,z,r]], turrets:[lp], shield:{r:V}, eng:[lp], L}
export function buildCapital(kind,team){const k=new Kit(team),big=kind==='flagship',L=big?760:340,W=big?96:44,H=big?70:34,r=rng(team*7+(big?3:1));
 const subs=[],hullS=[],turrets=[],eng=[],lights=[];const gx=[];
 // main hull
 if(team===1){// VESPER: arrowhead dagger with a dorsal spine, keel and swept rear fins
  k.hull(taper(W,H,L*.68,.12,.45,1,1),M4(0,0,-L*.16)).hull(taper(W*1.08,H*1.05,L*.34,1,1,.92,.9),M4(0,0,L*.33),'p')
   .hull(taper(W*.38,H*.55,L*.78,.06,.3,1,1),M4(0,H*.62,-L*.06),'d').hull(taper(W*.16,H*.75,L*.6,.15,.35,1,1),M4(0,-H*.72,-L*.02),'d');
  for(const s of[-1,1]){k.hull(taper(W*1.1,H*.1,L*.26,.25,1,1,1),M4(s*W*.95,-H*.1,L*.3,0,s*-.35,s*-.05),'p').hull(taper(W*.1,H*.5,L*.2,.4,.6,1,1),M4(s*W*1.4,H*.05,L*.38,0,s*-.35,0),'a');
   k.hull(taper(W*.06,H*.12,L*.6,.3,1,1,1),M4(s*W*.46,H*.1,-L*.1,0,s*.03,0),'a');for(let i=0;i<6;i++)k.hull(new THREE.BoxGeometry(W*.05,H*.5,L*.025),M4(s*W*.5,-H*.05,L*(-.05+i*.07)),'d');}}
 else{// AURORA: rounded cruiser with a habitat ring and twin outrigger pods
  k.hull(cyl(H*.55,H*.62,L*.62,20),M4(0,0,-L*.08,RX)).hull(new THREE.ConeGeometry(H*.55,L*.22,20),M4(0,0,-L*.5,-RX)).hull(cyl(H*.66,H*.6,L*.34,20),M4(0,0,L*.34,RX),'p')
   .hull(taper(W*.5,H*.35,L*.6,.3,1,1,1),M4(0,H*.6,0),'p').hull(new THREE.TorusGeometry(W*.62,H*.13,10,40),M4(0,0,-L*.12),'d');
  for(const s of[-1,1]){k.hull(cyl(H*.3,H*.28,L*.55,16),M4(s*W*.62,-H*.1,L*.12,RX),'p').hull(new THREE.ConeGeometry(H*.3,L*.12,16),M4(s*W*.62,-H*.1,-L*.215,-RX),'p').hull(taper(W*.22,H*.08,L*.4,1,1,1,1),M4(s*W*.32,-H*.1,L*.12),'d');
   for(let i=0;i<4;i++)k.hull(taper(W*.06,H*.32,H*.08,1,1,1,1),M4(s*W*.62*Math.cos(i*.8+.4),W*.62*Math.sin(i*.8+.4)*(i%2?1:-1)*0,-L*.12),'a');}
  for(let i=0;i<6;i++){const a=i/6*TAU;k.hull(new THREE.BoxGeometry(H*.08,W*.5,H*.08),M4(Math.cos(a)*W*.36,Math.sin(a)*W*.36,-L*.12,0,0,a+Math.PI/2),'d');}
  k.glow(new THREE.BoxGeometry(W*.3,H*.05,L*.1),M4(0,-H*.58,L*.05));}
 // accent stripes
 if(team===0)for(const s of[-1,1])k.hull(taper(.5,H*.08,L*.45,1,1,1,1),M4(s*(H*.6+.2),H*.1,-L*.08),'a');
 // engine block
 const ne=big?5:3;for(let i=0;i<ne;i++){const a=ne===3?[-1,0,1][i]:[-1.5,-.75,0,.75,1.5][i];const x=a*W*.3,y=(i%2?-.12:.08)*H,R=H*(big?.2:.28);k.hull(cyl(R*1.1,R*.95,L*.08,16),M4(x,y,L*.52,RX),'d');k.glow(new THREE.CircleGeometry(R*.85,20),M4(x,y,L*.56+.3));eng.push(new V(x,y,L*.56+2));}
 subs.push({id:'engines',kind:'engines',label:'ENGINES',lp:new V(0,0,L*.52),r:H*.6,hp:big?1100:650});
 // bridge tower
 const bz=L*(team?.3:.22),bh=H*(big?1.2:1.1);k.hull(taper(W*.22,bh,L*.08,.8,1,1,1),M4(0,H*.5+bh*.5,bz),'p').hull(taper(W*.5,H*.22,L*.07,.85,1,1,1),M4(0,H*.5+bh,bz-L*.01),'d');
 k.glow(new THREE.BoxGeometry(W*.42,H*.03,.3),M4(0,H*.5+bh+H*.02,bz-L*.045));
 subs.push({id:'bridge',kind:'bridge',label:'BRIDGE',lp:new V(0,H*.5+bh,bz),r:W*.24,hp:big?900:520});
 // greebles: hull blocks, vents, antenna masts
 for(let i=0;i<(big?150:80);i++){const z=(r()-.5)*L*.85,side=r();const s=(2+r()*7)*(big?1.6:1);let x,y;if(side<.5){x=(r()-.5)*W*.6;y=H*.5;}else{x=(r()<.5?-1:1)*W*.48;y=(r()-.5)*H*.6;}
  k.hull(new THREE.BoxGeometry(side<.5?s:s*.6,side<.5?s*.5:s,s*(1+r()*2)),M4(x,y,z),r()<.15?'a':'d');}
 for(let i=0;i<(big?6:3);i++){const z=(r()-.5)*L*.5;k.hull(cyl(.5,.8,H*.9,6),M4((r()-.5)*W*.3,H*.9,z),'d');lights.push(new V(0,H*1.35,z));}
 // running lights at the extremities
 lights.push(new V(-W*.55,0,0),new V(W*.55,0,0),new V(0,0,-L*.5));
 // shield generators: domes on pylons (separate meshes so they can be destroyed)
 const gens=[];for(const s of[-1,1]){const lp=new V(s*W*.36,H*.5+H*.35,team?-L*.06:L*.04);k.hull(cyl(W*.05,W*.08,H*.35,10),M4(lp.x,H*.5+H*.17,lp.z),'d');gens.push(lp);
  subs.push({id:'gen'+(s<0?'L':'R'),kind:'shield',label:'SHIELD GENERATOR',lp,r:W*.13,hp:big?520:360});}
 if(big){subs.push({id:'reactor',kind:'reactor',label:'REACTOR CORE',lp:new V(0,-H*.62,L*.05),r:H*.32,hp:1300});}
 // turrets (rendered as instances by the fleet)
 const nt=big?8:4;for(let i=0;i<nt;i++){const top=i%2===0;const z=(-.33+.66*((i/2|0)/Math.max(1,(nt/2-1))))*L*.75;const lp=new V(top?(i%4===0?-1:1)*W*.2:(i%4===1?-1:1)*W*.52,top?H*.5+1.5:-H*.2,z);turrets.push({lp,up:top?new V(0,1,0):new V(Math.sign(lp.x),0,0)});
  subs.push({id:'t'+i,kind:'turret',label:'TURRET',lp:lp.clone().add(top?new V(0,3,0):new V(Math.sign(lp.x)*3,0,0)),r:big?9:7,hp:big?240:170,turret:i});}
 const g=k.build(team,big?.004:.007);g.userData.hull.material=mats(team).capHull;
 // shield generator domes + reactor glow
 const M=mats(team);const domeMat=new THREE.MeshStandardMaterial({color:0x9ab8d0,metalness:.6,roughness:.25,emissive:team?0x551008:0x0a3a66,emissiveIntensity:1.4});
 for(const s of subs){if(s.kind==='shield'){const d=new THREE.Mesh(new THREE.SphereGeometry(s.r,20,14),domeMat);d.position.copy(s.lp);g.add(d);s.mesh=d;}
  if(s.kind==='reactor'){const d=new THREE.Mesh(new THREE.SphereGeometry(s.r,24,16),new THREE.MeshBasicMaterial({color:team?new C(4,1.4,.4):new C(.6,2,4),toneMapped:false}));d.position.copy(s.lp);g.add(d);s.mesh=d;
   const cage=new THREE.Mesh(new THREE.TorusGeometry(s.r*1.15,s.r*.12,8,24),M.hull);cage.position.copy(s.lp);g.add(cage);const c2=cage.clone();c2.rotation.y=RX;g.add(c2);}}
 // hull collision spheres along the spine
 const n=Math.ceil(L/(W*.55));for(let i=0;i<=n;i++){const z=-L*.48+i*L*.96/n;const taperK=z<0?.45+.55*(1+z/(L*.5)):1;hullS.push([0,0,z,W*.5*Math.max(.35,taperK)]);}
 hullS.push([0,H*.5+bh*.5,bz,W*.22]);if(team===0){for(const s of[-1,1])for(let i=0;i<4;i++)hullS.push([s*W*.62,-H*.1,L*(-.22+i*.18),H*.34]);for(let i=0;i<10;i++){const a=i/10*TAU;hullS.push([Math.cos(a)*W*.62,Math.sin(a)*W*.62,-L*.12,H*.2]);}}
 else for(const s of[-1,1])for(let i=0;i<3;i++)hullS.push([s*W*(.6+i*.3),-H*.1,L*(.3+i*.05),W*.22]);
 // running lights
 const lg=new THREE.Group();for(const p of lights){const m=new THREE.Mesh(LIGHT_GEO,new THREE.MeshBasicMaterial({color:p.x<-1?new C(4,.3,.2):p.x>1?new C(.3,4,.6):new C(4,4,4),toneMapped:false}));m.position.copy(p);m.scale.setScalar(big?3:2);lg.add(m);}g.add(lg);g.userData.blink=lg;
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return{group:g,subs,hullS,turrets,eng,L,W,H,shieldR:new V(W*.95+30,H*1.6+30,L*.62)};}
const LIGHT_GEO=new THREE.SphereGeometry(1,8,6);

/* ================= missiles ================= */
export function makeMissileMesh(kind){const g=new THREE.Group();const big=kind==='torpedo';const m=new THREE.MeshStandardMaterial({color:big?0x9a9da3:0xd8d8d8,metalness:.6,roughness:.4});
 const b=new THREE.Mesh(cyl(big?.35:.17,big?.35:.17,big?2.6:1.8,8),m);b.rotation.x=RX;g.add(b);const n=new THREE.Mesh(new THREE.ConeGeometry(big?.35:.17,big?.7:.5,8),m);n.rotation.x=-RX;n.position.z=big?-1.65:-1.15;g.add(n);
 const gl=new THREE.Mesh(new THREE.SphereGeometry(big?.5:.3,8,6),new THREE.MeshBasicMaterial({color:big?new C(4,2.2,1):new C(4,3,2),toneMapped:false}));gl.position.z=big?1.4:1;g.add(gl);return g;}
