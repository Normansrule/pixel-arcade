// IRON VANGUARD — vehicles: BASTION main battle tank (hull/turret/track model adapted from IRONCLAD), RANGER jeep with a
// pintle MG, HORNET attack helicopter and SABRE strike jet (mouse-aim flight in the spirit of SKY LANCERS). Models + arcade physics.
import * as THREE from '../vendor/three.module.min.js';
import {V,PI,cl,lerp,ang,merge,M4,BX,CY,SP,prof} from './util.js';
import {WL,PLAY,EXT} from './terrain.js';
import {quality} from '../js/fx3d.js';
// LOW quality builds the round parts (wheels, barrels, rollers) with half the segments to stay inside the old triangle budget
const LQ=quality()===0,SEG=n=>LQ?Math.max(6,n>>1):n;

export const VSPEC={
 tank:{name:'BASTION MBT',cls:'MAIN BATTLE TANK',hp:1000,seats:['DRIVER · GUNNER'],speed:13,acc:7,turn:.9,circ:[[2.1,1.75],[0,1.85],[-2.1,1.75]],eye:[0,3.6,-1],respawn:40,armor:{bullet:0,blast:1}},
 jeep:{name:'RANGER LSV',cls:'LIGHT VEHICLE',hp:360,seats:['DRIVER','GUNNER'],speed:24,acc:11,turn:1.9,circ:[[1.3,1.15],[0,1.15],[-1.3,1.15]],eye:[0,2.4,0],respawn:22,armor:{bullet:.35,blast:1.3}},
 heli:{name:'HORNET AH-9',cls:'ATTACK HELICOPTER',hp:640,seats:['PILOT · GUNNER'],speed:44,circ:[[0,2.4]],respawn:50,armor:{bullet:.16,blast:1}},
 jet:{name:'SABRE F-12',cls:'STRIKE JET',hp:420,seats:['PILOT'],speed:135,circ:[[0,3]],respawn:50,armor:{bullet:.2,blast:1}}};
// mud + wear: world-space value noise, heavier near the ground (aMud = height above ground), edges get dusty
const NG='float h3(vec3 p){p=fract(p*.3183+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float vn3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}';
function dirty(m,k=1){m.onBeforeCompile=s=>{
 s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float aMud;varying float vMud;varying vec3 vOP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvMud=aMud;vOP=position;');
 s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying float vMud;varying vec3 vOP;'+NG)
 .replace('#include <map_fragment>',`#include <map_fragment>
  float nM=vn3(vOP*2.3)*.6+vn3(vOP*7.)*.4;float mud=smoothstep(.15,.85,(1.25-vMud)*1.1+nM*.75-.35)*${k.toFixed(2)};
  float dust=smoothstep(.55,.9,vn3(vOP*1.3+3.)*.7+nM*.3)*.2*${k.toFixed(2)};
  diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.72+vec3(.07,.06,.045),dust);
  diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.11,.085,.06)*(.7+.5*nM),mud);`)
 .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.95,max(mud,dust*.8));')
 .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor*=1.-mud*.85;');};
 m.customProgramCacheKey=()=>'dirty'+k;return m;}
const std=o=>new THREE.MeshStandardMaterial(o);
let MATS=null;function mats(TX){if(MATS)return MATS;const pn=()=>({normalMap:TX.vehN,normalScale:new THREE.Vector2(.55,.55),roughnessMap:TX.vehR});
 MATS={dark:dirty(std({color:0x2b2b2a,roughness:.6,metalness:.55,...pn()}),.8),steel:std({color:0x4a4b4a,roughness:.4,metalness:.75}),rubber:dirty(std({color:0x1d1c1b,roughness:.85,metalness:.1}),1),
 glass:std({color:0x16222c,roughness:.05,metalness:.9}),canopy:std({color:0x3a5468,roughness:.04,metalness:.55,transparent:true,opacity:.42,depthWrite:false}),wreck:std({color:0x1b1816,roughness:1,metalness:.25}),lamp:std({color:0xffffff,emissive:0xfff2d0,emissiveIntensity:1.4}),
 paint:[dirty(std({map:TX.camoA,color:new THREE.Color(1.3,1.3,1.25),roughness:1,metalness:.12,...pn()}),1),dirty(std({map:TX.camoB,color:new THREE.Color(1.3,1.3,1.25),roughness:1,metalness:.12,...pn()}),1)],team:[std({color:0x111111,emissive:new THREE.Color(.25,.55,1.6),emissiveIntensity:1,roughness:.4}),std({color:0x111111,emissive:new THREE.Color(1.7,.25,.18),emissiveIntensity:1,roughness:.4})],
 flame:new THREE.MeshBasicMaterial({color:new THREE.Color(5,2.2,.7),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}),disc:new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide})};return MATS;}
const mk=(g,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{if(!g.attributes.aMud)mudA(g,y);const o=new THREE.Mesh(g,mat);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;return o;};
const sym=a=>[...a,...a.slice().reverse().map(([x,z])=>[-x,z])];
function extrudeSide(pts,depth,bevel=.05){const sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],pts[i][1]);const g=new THREE.ExtrudeGeometry(sh,{depth:depth-bevel*2,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1});g.translate(0,0,-(depth-bevel*2)/2);g.rotateY(-PI/2);sUV(g,.22);return g;}
function extrudeTop(pts,h,bevel=.06){const sh=new THREE.Shape();sh.moveTo(pts[0][0],-pts[0][1]);for(let i=1;i<pts.length;i++)sh.lineTo(pts[i][0],-pts[i][1]);const g=new THREE.ExtrudeGeometry(sh,{depth:h-bevel*2,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2});g.translate(0,0,bevel);g.rotateX(-PI/2);sUV(g,.22);return g;}
function sUV(g,k){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*k,uv.getY(i)*k);}
function beltGeo(a,R,tw,thk){const pts=[];const add=(z,y,nz,ny)=>pts.push([z,y,nz,ny]);for(let i=0;i<10;i++)add(-a+2*a*i/10,0,0,-1);for(let i=0;i<14;i++){const q=-PI/2+i/14*PI;add(a+Math.cos(q)*R,R+Math.sin(q)*R,Math.cos(q),Math.sin(q));}
 for(let i=0;i<10;i++)add(a-2*a*i/10,2*R,0,1);for(let i=0;i<14;i++){const q=PI/2+i/14*PI;add(-a+Math.cos(q)*R,R+Math.sin(q)*R,Math.cos(q),Math.sin(q));}pts.push(pts[0]);let s=0;const S=[0];for(let i=1;i<pts.length;i++){s+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);S.push(s);}
 const pos=[],nor=[],uv=[],idx=[],n=pts.length;for(let i=0;i<n;i++){const[z,y,nz,ny]=pts[i];for(const x of[-tw/2,tw/2]){pos.push(x,y,z);nor.push(0,ny,nz);uv.push(x>0?1:0,S[i]);}}for(let i=0;i<n-1;i++){const a0=i*2,b0=a0+2;idx.push(a0,b0,a0+1,a0+1,b0,b0+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;}

/* ================= models (all face +z) ================= */
// object-space box mapping so camo keeps one scale across merged parts; aMud = height above the ground for the mud shader
function boxUV(g,sc){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));let a,b;if(ax>=ay&&ax>=az){a=p.getZ(i);b=p.getY(i);}else if(ay>=az){a=p.getX(i);b=p.getZ(i);}else{a=p.getX(i);b=p.getY(i);}u.setXY(i,a/sc,b/sc);}u.needsUpdate=true;return g;}
function mudA(g,yOff=0){const p=g.attributes.position,a=new Float32Array(p.count);for(let i=0;i<p.count;i++)a[i]=p.getY(i)+yOff;g.setAttribute('aMud',new THREE.BufferAttribute(a,1));return g;}
// merged mesh: parts -> one draw, box-mapped, mud attribute (yOff = height of this mesh's frame above the ground)
const PM=(parts,mat,yOff=0,sc=4.2)=>{const g=merge(parts);if(sc)boxUV(g,sc);mudA(g,yOff);const o=new THREE.Mesh(g,mat);o.castShadow=true;o.receiveShadow=true;return o;};
const cbox=(w,h,d,b=.03)=>{const s=new THREE.Shape();s.moveTo(-w/2+b,-h/2+b);s.lineTo(w/2-b,-h/2+b);s.lineTo(w/2-b,h/2-b);s.lineTo(-w/2+b,h/2-b);s.closePath();const g=new THREE.ExtrudeGeometry(s,{depth:d-b*2,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:1});g.translate(0,0,-(d-b*2)/2);return g;};
const ZC=(r1,r2,len,seg=14)=>new THREE.CylinderGeometry(r1,r2,len,SEG(seg)).rotateX(PI/2);// along z
const XC=(r1,r2,len,seg=14)=>new THREE.CylinderGeometry(r1,r2,len,SEG(seg)).rotateZ(PI/2);// along x
function tankModel(TX,team){const m=mats(TX),paint=m.paint[team],root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const L=6.4,W=3.4,R=.52,tw=W*.25,a=L*.47-R,tx=W/2-tw/2,y0=2*R*.92,y1=y0+1.05,P=[],D=[],S2=[];
 // hull: upper hull with glacis + engine deck, lower hull, side skirts in six panels, fenders, storage bins, mud flaps
 P.push({geo:extrudeSide([[-L/2,y0-.02],[-L/2,y1-.28],[-L/2+.3,y1],[L/2-1.35,y1],[L/2,y0+.3],[L/2-.18,y0-.02]],W,.06)},{geo:BX(W-2*tw-.04,y0-.3,L*.86),m:M4(0,(y0+.3)/2,0)},
  {geo:extrudeSide([[L*.43,.32],[L/2-.12,y0-.04],[L*.43,y0-.04]],W-2*tw-.06,.02)});
 for(const s of[-1,1]){const n=6,z0=-L*.44,len=L*.88/n;for(let i=0;i<n;i++)P.push({geo:cbox(.07,.6,len-.05,.02),m:M4(s*(W/2+.035),y0-.27,z0+(i+.5)*len,0,0,s*.05)});
  P.push({geo:cbox(.62,.36,L*.2,.03),m:M4(s*(W/2-.36),y1+.17,-L*.17)},{geo:cbox(.55,.3,L*.12,.03),m:M4(s*(W/2-.33),y1+.14,L*.06)},{geo:BX(.5,.42,.05),m:M4(s*(W/2-.3),y0-.12,-L/2-.02)});
  // headlight guards + tow hooks + rear jerry cans
  P.push({geo:BX(.36,.06,.24),m:M4(s*1.2,y0+.5,L/2-.32)},{geo:BX(.06,.26,.24),m:M4(s*1.36,y0+.38,L/2-.32)},{geo:cbox(.2,.36,.3,.02),m:M4(s*.95,y0+.5,-L/2-.17)});
  D.push({geo:BX(.14,.2,.22),m:M4(s*.6,y0+.02,L/2+.06)},{geo:ZC(.1,.12,.5,8),m:M4(s*.95,y0+.12,-L/2-.18)});S2.push({geo:ZC(.08,.08,.06,10),m:M4(s*1.2,y0+.38,L/2-.2)});}
 // engine deck grilles, driver hatch + periscopes, turret ring, spare track links on the glacis
 for(const s of[-1,1])D.push({geo:BX(1.05,.04,1.25),m:M4(s*.62,y1+.02,-L*.32)});
 D.push({geo:CY(1.22,1.28,.12,24),m:M4(0,y1+.06,-.25)},{geo:BX(1.7,.3,.06),m:M4(0,y0+.35,-L/2-.03)});
 P.push({geo:CY(.3,.32,.07,14),m:M4(0,y1+.04,L/2-1.62)});for(const xx of[-.22,0,.22])S2.push({geo:BX(.13,.07,.07),m:M4(xx,y1+.08,L/2-1.36)});
 for(let i=0;i<5;i++)D.push({geo:BX(.62,.05,.2),m:M4(-.6+(i%2)*1.2,y0+.42+i*.09,L/2-.48-i*.22,-.6,0,0)});
 body.add(PM(P,paint,0),PM(D,m.dark,0,0));if(S2.length){const g=merge(S2);mudA(g,0);const o=new THREE.Mesh(g,m.lamp);body.add(o);}
 // running gear: belts (scrolling link texture), road wheels with hubs + bolt rings, toothed drive sprocket, idler, return rollers
 const tracks=[],rub=[],stl=[];for(const s of[-1,1]){const tm=std({map:TX.tread.clone(),normalMap:TX.treadN.clone(),normalScale:new THREE.Vector2(1.2,1.2),roughness:.75,metalness:.55,color:0xb8b4ac});tm.map.needsUpdate=tm.normalMap.needsUpdate=true;dirty(tm,.85);
  const belt=new THREE.Mesh(mudA(beltGeo(a,R,tw,.1),0),tm);belt.castShadow=true;belt.position.x=s*tx;root.add(belt);tracks.push(tm);
  const rw=R-.1;for(let i=0;i<6;i++){const z=-a+.15+(2*a-.3)*i/5;rub.push({geo:XC(rw,rw,tw*.78,18),m:M4(s*tx,rw+.06,z)});stl.push({geo:XC(rw*.62,rw*.62,tw*.8,14),m:M4(s*tx,rw+.06,z)},{geo:XC(rw*.2,rw*.26,tw*.88,8),m:M4(s*tx,rw+.06,z)});}
  for(const[z,teeth]of[[-a,1],[a,0]]){stl.push({geo:XC(R*.8,R*.8,tw*.62,16),m:M4(s*tx,R,z)},{geo:XC(R*.3,R*.34,tw*.75,8),m:M4(s*tx,R,z)});if(teeth)for(let k=0;k<10;k++){const q=k/10*PI*2;stl.push({geo:BX(tw*.4,.12,.1),m:M4(s*tx,R+Math.sin(q)*R*.86,z+Math.cos(q)*R*.86,-q,0,0)});}}
  for(const z of[-a*.5,0,a*.5])stl.push({geo:XC(.1,.1,tw*.5,8),m:M4(s*tx,2*R-.06,z)});
  }root.add(PM(rub,m.rubber,0,0),PM(stl,m.dark,0,0));// both sides' wheels in one draw each
 // turret: cast shell, mantlet, applique blocks on the cheeks, stowage bins, bustle rack with bags + jerry can, cupola with periscopes + hatch + roof MG,
 // gunner's sight, smoke dischargers, loader hatch, antennas
 const tur=new THREE.Group();tur.position.set(0,y1,-.25);body.add(tur);const T=[],TD=[],TG=[];
 T.push({geo:extrudeTop(sym([[.7,1.45],[1.25,.6],[1.32,-.75],[1.05,-1.95]]),.86,.1)},{geo:extrudeTop(sym([[.55,1.2],[1.0,.55],[1.05,-.7],[.85,-1.75]]),.14,.05),m:M4(0,.84,0)});
 for(const s of[-1,1]){const p1=[.7*s,1.45],p2=[1.25*s,.6],dx=p2[0]-p1[0],dz=p2[1]-p1[1],l=Math.hypot(dx,dz),nx=dz/l*-s*-1,nz=-dx/l*-s*-1;const ry=Math.atan2(s*Math.abs(dz)/l,Math.abs(dx)/l*1)*0+Math.atan2(nx,nz);
  for(let r=0;r<2;r++)for(let c=0;c<3;c++){const t=(c+.5)/3;T.push({geo:cbox(l/3-.05,.3,.13,.025),m:M4(p1[0]+dx*t+nx*.07,.28+r*.32,p1[1]+dz*t+nz*.07,0,ry+PI/2,0)});}
  T.push({geo:cbox(.26,.42,1.25,.03),m:M4(s*1.42,.36,-.75,0,s*-.03,0)});
  for(let k=0;k<4;k++)TD.push({geo:ZC(.055,.055,.3,8),m:M4(s*(1.02+(k%2)*.13),.66+(k>>1)*.13,.62,-.35,s*.5,0)});}
 TD.push({geo:BX(2.3,.05,.05),m:M4(0,.82,-2.55)},{geo:BX(2.3,.05,.05),m:M4(0,.5,-2.55)},{geo:BX(.05,.4,.7),m:M4(1.13,.66,-2.22)},{geo:BX(.05,.4,.7),m:M4(-1.13,.66,-2.22)});
 T.push({geo:cbox(.62,.34,.4,.06),m:M4(-.55,.6,-2.25),c:0x8a8664},{geo:cbox(.7,.3,.42,.06),m:M4(.2,.6,-2.25),c:0x7a7a5a},{geo:cbox(.2,.42,.3,.02),m:M4(.8,.64,-2.25)});
 T.push({geo:CY(.38,.43,.3,16),m:M4(-.5,.98,-.5)},{geo:CY(.36,.36,.05,16),m:M4(-.5,1.2,-.82,-1.2,0,0)},{geo:cbox(.34,.3,.42,.04),m:M4(.62,.98,.62)},{geo:CY(.3,.3,.05,14),m:M4(.45,.9,-.62)});
 for(let k=0;k<6;k++){const q=k/6*PI*2;TD.push({geo:BX(.1,.08,.07),m:M4(-.5+Math.sin(q)*.4,1.08,-.5+Math.cos(q)*.4,0,q,0)});}
 TD.push({geo:BX(.06,.42,.06),m:M4(-.5,1.3,-.12)},{geo:BX(.12,.14,.55),m:M4(-.5,1.52,.02)},{geo:ZC(.022,.022,.7,6),m:M4(-.5,1.54,.6)},{geo:BX(.12,.14,.07),m:M4(.62,.98,.85)});TG.push({geo:BX(.26,.18,.02),m:M4(.62,1.0,.84)});
 tur.add(PM(T,paint,y1),PM(TD,m.dark,y1,0));if(TG.length)tur.add(PM(TG,m.glass,y1+5,0));
 // gun: mantlet, barrel with thermal sleeves + bore evacuator + muzzle reference
 const gun=new THREE.Group();gun.position.set(0,.45,1.38);tur.add(gun);gun.add(PM([{geo:cbox(1.15,.66,.5,.08),m:M4(0,0,.12)},{geo:cbox(.5,.4,.3,.05),m:M4(0,0,.42)}],paint,y1+.45));
 const barrel=new THREE.Group();gun.add(barrel);barrel.add(PM([{geo:ZC(.12,.15,4.5,16),m:M4(0,0,2.45)},{geo:ZC(.15,.15,.32,16),m:M4(0,0,4.62)},{geo:BX(.12,.08,.14),m:M4(0,.18,4.62)},{geo:ZC(.06,.06,.4,6),m:M4(.32,-.02,.6)}],m.steel,y1+.45,0),
  PM([{geo:ZC(.175,.17,1.7,16),m:M4(0,0,1.35)},{geo:ZC(.2,.2,.5,16),m:M4(0,0,2.45)},{geo:ZC(.17,.2,.1,16),m:M4(0,0,2.15)},{geo:ZC(.2,.17,.1,16),m:M4(0,0,2.75)},{geo:ZC(.162,.158,1.5,16),m:M4(0,0,3.55)},{geo:ZC(.22,.22,.45,16),m:M4(0,0,.6)}],paint,y1+.45));
 const band=mk(BX(2.68,.08,.9),m.team[team],0,.62,-.3);mudA(band.geometry,5);tur.add(band);const ant=new THREE.Group();ant.position.set(.6,.86,-1.1);const aw=mk(CY(.012,.02,2.6,4),m.dark,0,1.3,0);mudA(aw.geometry,5);ant.add(aw);tur.add(ant);
 const muzzle=new THREE.Object3D();muzzle.position.set(0,0,4.9);barrel.add(muzzle);
 return{root,body,tur,gun,barrel,muzzle,tracks,ant,dims:{y1,tz:-.25,gy:.45,gz:1.38,len:4.9,tx}};}
function jeepModel(TX,team){const m=mats(TX),paint=m.paint[team],root=new THREE.Group(),body=new THREE.Group();root.add(body);const P=[],D=[],G2=[];
 // light strike vehicle: tub body with flared wheel arches, louvred hood, bumper + winch, roll cage, seats, spare wheel, jerry cans, gun ring
 P.push({geo:prof([[-2.25,.6],[2.12,.6],[2.3,.86],[2.25,1.18],[.95,1.3],[.6,1.34],[-2.25,1.34]],1.86,.07)});
 for(const s of[-1,1])for(const z of[1.45,-1.45])P.push({geo:new THREE.CylinderGeometry(.62,.62,.34,14,1,true,-PI/2-.95,1.9+PI*.0).rotateZ(PI/2),m:M4(s*.98,.5,z)},{geo:BX(.36,.05,1.26),m:M4(s*.98,1.12,z)});
 P.push({geo:BX(1.5,.06,1.1),m:M4(0,1.36,1.6,-.04)},{geo:cbox(.95,.5,.5,.06),m:M4(-.5,1.55,.05),c:0x5a5444},{geo:cbox(.95,.5,.5,.06),m:M4(.5,1.55,.05),c:0x5a5444},{geo:cbox(.18,.36,.3,.02),m:M4(.95,1.3,-2.1)},{geo:cbox(.18,.36,.3,.02),m:M4(.7,1.3,-2.1)});
 for(let i=0;i<5;i++)D.push({geo:BX(1.2,.02,.06),m:M4(0,1.4,1.25+i*.14,-.04)});
 D.push({geo:BX(2.0,.2,.22),m:M4(0,.72,2.3)},{geo:XC(.12,.12,.7,10),m:M4(0,.78,2.38)},{geo:BX(1.7,.08,.08),m:M4(0,1.62,.62,-.4)});
 const bar=(a,b,r=.045)=>{const d=new V().subVectors(b,a),l=d.length(),g=new THREE.CylinderGeometry(r,r,l,6);const q=new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),d.normalize());D.push({geo:g,m:new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(.5),q,new V(1,1,1))});};
 for(const s of[-1,1]){bar(new V(s*.9,1.34,.75),new V(s*.82,2.35,.2));bar(new V(s*.82,2.35,.2),new V(s*.82,2.35,-1.0));bar(new V(s*.82,2.35,-1.0),new V(s*.9,1.34,-1.6));bar(new V(s*.9,1.34,-.3),new V(s*.82,2.35,-.3));}
 bar(new V(-.82,2.35,.2),new V(.82,2.35,.2));bar(new V(-.82,2.35,-1.0),new V(.82,2.35,-1.0));
 D.push({geo:XC(.42,.42,.24,14),m:M4(0,1.28,-2.38,0,PI/2,0)},{geo:BX(.06,.5,.06),m:M4(0,1.6,-1.2)});G2.push({geo:BX(1.55,.5,.03),m:M4(0,1.66,.6,-.4)});
 for(const s of[-1,1])G2.push({geo:BX(.2,.12,.03),m:M4(s*.72,.98,2.36)});
 body.add(PM(P,paint,0),PM(D,m.dark,0,0),PM(G2,m.glass,4,0));
 const wheels=[];for(const z of[1.45,-1.45])for(const x of[-.98,.98]){const w=new THREE.Group();w.position.set(x,.46,z);const t=new THREE.Mesh(mudA(merge([{geo:XC(.46,.46,.34,20)},{geo:XC(.4,.4,.36,20)}]),.46),m.rubber);t.castShadow=true;w.add(t);
  const hub=new THREE.Mesh(mudA(merge([{geo:XC(.25,.25,.37,10)},{geo:XC(.1,.12,.42,6)}]),.46),m.dark);w.add(hub);root.add(w);wheels.push(w);}
 const tur=new THREE.Group();tur.position.set(0,2.0,-1.2);body.add(tur);tur.add(PM([{geo:CY(.12,.15,.5,8),m:M4(0,-.25,0)}],m.dark,2,0));const gun=new THREE.Group();gun.position.y=.1;tur.add(gun);
 gun.add(PM([{geo:cbox(.16,.22,.7,.02),m:M4(0,0,.2)},{geo:ZC(.035,.035,1.1,8),m:M4(0,.03,.95)},{geo:ZC(.05,.05,.16,8),m:M4(0,.03,1.45)},{geo:BX(.12,.16,.22),m:M4(-.14,-.06,.1)},{geo:cbox(.7,.5,.04,.01),m:M4(0,.15,.3)}],m.dark,2.1,0));
 const muzzle=new THREE.Object3D();muzzle.position.set(0,.03,1.5);gun.add(muzzle);
 const band=mk(BX(1.4,.06,.5),m.team[team],0,1.40,-.3);mudA(band.geometry,5);body.add(band);
 return{root,body,tur,gun,muzzle,wheels};}
function heliModel(TX,team){const m=mats(TX),paint=m.paint[team],root=new THREE.Group(),body=new THREE.Group();root.add(body);const P=[],D=[];
 // tandem-seat gunship: faceted fuselage, tapering boom, engine nacelles + exhausts, stub wings with pylons, fin + stabiliser, wheeled gear
 P.push({geo:prof([[-2.6,.72],[1.6,.6],[3.1,.86],[3.75,1.35],[3.3,1.52],[.2,1.62],[-.4,2.5],[-1.5,2.62],[-2.6,2.2]],1.45,.2,6)},{geo:prof([[-8.8,1.95],[-2.4,1.35],[-2.4,2.45],[-8.8,2.3]],.48,.1)},
  {geo:prof([[-8.3,2.0],[-7.6,2.1],[-8.1,3.9],[-8.6,4.0]],.14,.04)},{geo:cbox(2.6,.07,.65,.02),m:M4(0,2.1,-7.4)});
 for(const s of[-1,1])P.push({geo:prof([[-1.9,2.3],[.6,2.25],[.9,2.55],[.5,2.85],[-1.9,2.8]],.62,.12),m:M4(s*.55,0,0)},{geo:cbox(1.5,.12,.95,.03),m:M4(s*1.2,1.45,-.4,0,0,s*-.08)});
 D.push({geo:ZC(.2,.24,.5,10),m:M4(.55,2.55,-2.1)},{geo:ZC(.2,.24,.5,10),m:M4(-.55,2.55,-2.1)},{geo:CY(.42,.42,.24,12),m:M4(0,2.92,-.4)});
 for(const s of[-1,1]){D.push({geo:BX(.08,.36,.4),m:M4(s*1.85,1.25,-.35)},{geo:BX(.08,.36,.4),m:M4(s*1.35,1.25,-.35)});
  D.push({geo:CY(.05,.05,.8,6),m:M4(s*.75,.55,1.4)},{geo:XC(.22,.22,.16,12),m:M4(s*.75,.22,1.4)},{geo:CY(.05,.05,.7,6),m:M4(s*.75,.6,-1.2)},{geo:XC(.22,.22,.16,12),m:M4(s*.75,.22,-1.2)});}
 D.push({geo:XC(.12,.12,.1,8),m:M4(0,1.82,-8.5)});
 body.add(PM(P,paint,5),PM(D,m.dark,5,0));
 body.add(PM([{geo:prof([[-.1,1.6],[3.1,1.47],[2.7,2.12],[1.6,2.4],[1.1,2.3],[.4,2.62],[-.3,2.66]],1.2,.06)}],m.canopy,5,0));
 const fr=[];for(const z of[2.1,1.15,.15])fr.push({geo:BX(1.24,.06,.06),m:M4(0,z>2?2.2:z>1?2.42:2.63,z)});body.add(PM(fr,m.dark,5,0));
 const pods=[];for(const s of[-1,1]){const pd=new THREE.Mesh(mudA(merge([{geo:ZC(.26,.26,1.6,12)},{geo:ZC(.27,.2,.12,12),m:M4(0,0,.84)},{geo:ZC(.27,.2,.12,12),m:M4(0,0,-.84)}]),5),m.dark);pd.position.set(s*1.75,1.05,-.3);pd.castShadow=true;body.add(pd);pods.push(pd);}
 const chin=new THREE.Group();chin.position.set(0,.55,3.0);body.add(chin);chin.add(PM([{geo:SP(.28,12,8)}],m.dark,5,0));const cgun=new THREE.Group();chin.add(cgun);cgun.add(PM([{geo:ZC(.05,.05,1.3,8),m:M4(0,-.05,.6)},{geo:ZC(.08,.08,.3,8),m:M4(0,-.05,.15)}],m.steel,5,0));const muzzle=new THREE.Object3D();muzzle.position.set(0,-.05,1.3);cgun.add(muzzle);
 const rotor=new THREE.Group();rotor.position.set(0,3.08,-.4);body.add(rotor);rotor.add(PM([{geo:CY(.16,.2,.42,10)},{geo:CY(.34,.34,.12,10),m:M4(0,.16,0)}],m.dark,5,0));const blades=new THREE.Group();rotor.add(blades);
 const bg=mudA(merge([{geo:BX(.36,.045,5.9),m:M4(0,.18,3.15)},{geo:BX(.4,.05,.3),m:M4(0,.18,6.05)}]),5);for(let i=0;i<4;i++){const piv=new THREE.Group();piv.rotation.y=i*PI/2;const b=new THREE.Mesh(bg,m.dark);b.castShadow=true;b.rotation.x=.035;piv.add(b);blades.add(piv);}
 const disc=new THREE.Mesh(new THREE.CircleGeometry(6.3,40),m.disc);disc.rotation.x=-PI/2;disc.position.y=.18;rotor.add(disc);
 const tr=new THREE.Group();tr.position.set(.32,2.75,-8.4);body.add(tr);const tb=mudA(BX(.05,1.5,.16),5);for(let i=0;i<2;i++){const b=new THREE.Mesh(tb,m.dark);b.rotation.x=i*PI/2;tr.add(b);}
 const band=mk(BX(.2,.06,1.4),m.team[team],0,2.62,-4.5);mudA(band.geometry,5);body.add(band);
 return{root,body,rotor:blades,disc,tr,chin,cgun,muzzle,pods};}
function jetModel(TX,team){const m=mats(TX),paint=m.paint[team],root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const fu=new THREE.LatheGeometry([[0,-7.4],[.35,-6.4],[.75,-4.6],[.95,-2],[1.0,1.5],[.95,4.2],[.8,5.6],[.62,6.6],[.3,7.6],[.02,8.2]].map(([r,z])=>new THREE.Vector2(Math.max(.01,r),z)),16);fu.rotateX(-PI/2);fu.scale(1,.85,1);
 const flat=(pts,th)=>{const sh=new THREE.Shape();pts.forEach(([x,z],i)=>i?sh.lineTo(x,z):sh.moveTo(x,z));sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth:th,bevelEnabled:true,bevelThickness:.03,bevelSize:.04,bevelSegments:1});g.rotateX(PI/2);g.translate(0,th/2,0);return g;};
 const wing=s=>flat([[0,-2.4],[s*5.6,2.6],[s*5.6,3.4],[0,4.6]],.12),tail=s=>flat([[0,-5.2],[s*2.6,-6.8],[s*2.6,-7.4],[0,-7.2]],.08);
 const fin=s=>{const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(2.2,2.6);sh.lineTo(3.2,2.6);sh.lineTo(2.6,0);sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:false});g.rotateY(-PI/2);g.rotateZ(s*.35);g.translate(s*.55,.4,-6.4);return g;};
 const P=[{geo:fu},{geo:wing(1)},{geo:wing(-1)},{geo:fin(1)},{geo:fin(-1)},{geo:tail(1)},{geo:tail(-1)}];
 for(const s of[-1,1])P.push({geo:prof([[-2.8,-.45],[1.6,-.4],[1.9,.35],[-2.8,.35]],.9,.1),m:M4(s*1.05,-.15,-.2)});
 body.add(PM(P,paint,5));
 const can=new THREE.Mesh(mudA(SP(.62,16,10).scale(1,.95,2.6),5),m.canopy);can.position.set(0,.8,3.1);body.add(can);
 const D=[{geo:ZC(.6,.55,.8,16),m:M4(0,0,-7.5)},{geo:ZC(.52,.6,.5,16,true),m:M4(0,0,-8.1)},{geo:ZC(.1,.1,2.4,8),m:M4(3.6,-.3,.2)},{geo:ZC(.1,.1,2.4,8),m:M4(-3.6,-.3,.2)},{geo:ZC(.08,.08,2.6,8),m:M4(5.65,.0,2.6)},{geo:ZC(.08,.08,2.6,8),m:M4(-5.65,0,2.6)}];
 for(const s of[-1,1])D.push({geo:BX(.75,.5,.06),m:M4(s*1.05,-.12,1.62)});D.push({geo:BX(.06,.5,1.6),m:M4(0,.85,1.4)});
 body.add(PM(D,m.dark,5,0));
 const flame=new THREE.Mesh(new THREE.ConeGeometry(.5,3.4,12,1,true),m.flame);flame.rotation.x=-PI/2;flame.position.set(0,0,-9.4);body.add(flame);
 const gear=new THREE.Group();for(const[x,z]of[[0,4],[1.6,-1.2],[-1.6,-1.2]]){gear.add(PM([{geo:CY(.06,.06,1.1,6),m:M4(x,-1.1,z)},{geo:XC(.3,.3,.2,12),m:M4(x,-1.6,z)}],m.rubber,5,0));}body.add(gear);
 const band=mk(BX(.2,.04,1.6),m.team[team],0,.86,-1);mudA(band.geometry,5);body.add(band);
 const muzzle=new THREE.Object3D();muzzle.position.set(.6,.1,6);body.add(muzzle);return{root,body,flame,gear,muzzle};}
/* ================= entity ================= */
let VID=1;const _a=new V(),_b=new V(),_c=new V(),_e=new THREE.Euler(0,0,0,'YXZ');
export class Vehicle{
 constructor(kind,team,TX,home){this.id=VID++;this.kind=kind;this.team=team;this.S=VSPEC[kind];this.home=home;this.p=new V();this.vel=new V();this.yaw=0;this.pitch=0;this.roll=0;this.v=0;this.w=0;this.vy=0;this.seats=this.S.seats.map(()=>null);
  this.ctrl={thr:0,steer:0,aim:new V(),fire:false,fire2:false,lift:0,side:0,yawT:0};this.model=kind==='tank'?tankModel(TX,team):kind==='jeep'?jeepModel(TX,team):kind==='heli'?heliModel(TX,team):jetModel(TX,team);
  this.all=[];this.model.root.traverse(o=>{if(o.isMesh)this.all.push([o,o.material]);});this.vis={susp:0,suspV:0,lv:0,rec:0,rot:0,trk:[0,0],wheel:0,gunY:0,gunP:0};this.reset();}
 reset(){const h=this.home;this.p.set(h.x,h.y+(this.kind==='jet'?1.75:this.kind==='heli'?.2:0),h.z);this.yaw=h.yaw;this.pitch=this.roll=0;this.v=this.w=this.vy=0;this.vel.set(0,0,0);this.hp=this.S.hp;this.sys={mob:1,eng:1,tur:1};this.alive=true;this.wreckT=0;this.respawnT=0;
  this.reload=0;this.reload2=0;this.ammo2=this.kind==='heli'?14:this.kind==='jet'?2:0;this.heat=0;this.fireT=0;this.tYaw=0;this.gEl=0;this.rotor=0;this.state=this.kind==='jet'?'parked':this.kind==='heli'?'landed':'ground';this.speed=0;this.lastHitBy=null;this.lastHitT=-99;this.burn=0;
  this.lock=null;this.lockT=0;this.seats.fill(null);for(const[o,mt]of this.all)o.material=mt;this.model.root.visible=true;this.ctrl.aim.set(this.p.x+Math.sin(this.yaw)*80,this.p.y+2,this.p.z+Math.cos(this.yaw)*80);if(this.model.gear)this.model.gear.visible=true;}
 get driver(){return this.seats[0];}
 fwd(o=new V()){return o.set(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch));}
 occupied(){return this.seats.some(Boolean);}
 freeSeat(){return this.seats.findIndex(s=>!s);}
 // occupant camera anchor
 eye(o=new V()){const k=this.kind;if(k==='tank')return o.set(this.p.x,this.p.y+3.4,this.p.z);if(k==='jeep')return o.set(this.p.x,this.p.y+2.2,this.p.z);return o.copy(this.p).add(_a.set(0,1.6,0));}
 exitPos(o=new V()){const s=this.kind==='tank'?3.2:2.4;return o.set(this.p.x+Math.cos(this.yaw)*s,this.p.y,this.p.z-Math.sin(this.yaw)*s);}
 muzzle(o=new V()){this.model.muzzle.getWorldPosition(o);return o;}
 /* ---------------- physics ---------------- */
 step(dt,G){if(!this.alive){this.wreckT+=dt;this.respawnT-=dt;if(this.kind==='heli'||this.kind==='jet'){if(this.p.y>G.W.height(this.p.x,this.p.z)+.5){this.vy-=14*dt;this.p.addScaledVector(this.vel,dt);this.p.y+=this.vy*dt;this.vel.multiplyScalar(.99);}}return;}
  this.fireT-=dt;this.reload-=dt;this.reload2-=dt;this.heat=Math.max(0,this.heat-dt*.35);if(this.burn>0&&G.time-this.lastHitT>6&&this.hp<this.S.hp*.35)this.hp-=dt*4;
  const k=this.kind;if(k==='tank'||k==='jeep')this.drive(dt,G);else if(k==='heli')this.flyHeli(dt,G);else this.flyJet(dt,G);
  const H=PLAY+60;if(k==='tank'||k==='jeep'){this.p.x=cl(this.p.x,-H,H);this.p.z=cl(this.p.z,-H,H);}}
 drive(dt,G){const W=G.W,S=this.S,c=this.driver?this.ctrl:{thr:0,steer:0,aim:this.ctrl.aim};const tank=this.kind==='tank';
  const depth=W.depth(this.p.x,this.p.z)*(W.onBridge(this.p.x,this.p.z)?0:1);const wet=depth>.25?cl(1-(depth-.25)*.45,.22,1):1;
  const sy=this.sys||{mob:1,eng:1,tur:1};let vmax=S.speed*wet*(.28+.72*sy.mob)*(.55+.45*sy.eng);const f=this.fwd(_a);f.y=0;f.normalize();const grade=(W.height(this.p.x+f.x*1.5,this.p.z+f.z*1.5)-W.height(this.p.x-f.x*1.5,this.p.z-f.z*1.5))/3;
  const tgt=c.thr>0?c.thr*vmax:c.thr*vmax*.5;let acc=S.acc;if(tgt===0||Math.sign(tgt)!==Math.sign(this.v))acc*=1.7;const air=this.vy>1||this.p.y>W.ground(this.p.x,this.p.z,this.p.y+.4,.5)+.4;
  if(!air){this.v+=cl(tgt-this.v,-acc*dt,acc*dt);this.v-=grade*9.8*dt*.5;}
  const tr=S.turn*(.4+.6*sy.mob)*(tank?1:cl(Math.abs(this.v)/6,0,1))*(tank?1-.25*Math.min(1,Math.abs(this.v)/S.speed):1);const tw=c.steer*tr*(this.v<-.5&&!tank?-1:1);this.w+=cl(tw-this.w,-dt*6,dt*6);if(air)this.w*=.95;
  this.yaw+=this.w*dt;f.set(Math.sin(this.yaw),0,Math.cos(this.yaw));
  // lateral grip (jeep slides a little when fast)
  const lat=_b.set(this.vel.x,0,this.vel.z).sub(_c.copy(f).multiplyScalar(this.vel.x*f.x+this.vel.z*f.z));const grip=tank?14:air?.2:6;lat.multiplyScalar(Math.exp(-grip*dt));
  this.vel.set(f.x*this.v+lat.x,0,f.z*this.v+lat.z);this.p.x+=this.vel.x*dt;this.p.z+=this.vel.z*dt;this.speed=Math.hypot(this.vel.x,this.vel.z);
  G.vehCollide(this,dt);
  // ground follow (+ small jumps for the jeep)
  const gy=W.ground(this.p.x,this.p.z,this.p.y+.6,.6);if(!tank){this.vy-=18*dt;this.p.y+=this.vy*dt;if(this.p.y<=gy){if(this.vy<-8&&G.bump)G.bump(this,-this.vy);this.p.y=gy;const fy=W.ground(this.p.x+f.x*1.6,this.p.z+f.z*1.6,gy+1,.3),slope=(fy-gy)/1.6;this.vy=Math.max(0,this.v*slope*.6)*(slope>0?0:1);}}else this.p.y+=(gy-this.p.y)*Math.min(1,dt*12);
  const lx=f.z,lz=-f.x,hl=tank?2.7:1.6,hw=tank?1.4:.9,hF=W.ground(this.p.x+f.x*hl,this.p.z+f.z*hl,this.p.y+1.4,.3),hB=W.ground(this.p.x-f.x*hl,this.p.z-f.z*hl,this.p.y+1.4,.3),hL=W.ground(this.p.x+lx*hw,this.p.z+lz*hw,this.p.y+1.4,.3),hR=W.ground(this.p.x-lx*hw,this.p.z-lz*hw,this.p.y+1.4,.3);
  if(!air){this.pitch+=(Math.atan2(hF-hB,2*hl)-this.pitch)*Math.min(1,dt*8);this.roll+=(Math.atan2(hL-hR,2*hw)-this.roll)*Math.min(1,dt*8);if(tank)this.p.y=Math.max(this.p.y,(hF+hB+hL+hR)/4);}
  // weapons: turret traverse toward the aim point
  if(this.seats[tank?0:1]||!tank){const piv=_b.set(this.p.x,this.p.y+(tank?2.5:2.1),this.p.z),want=Math.atan2(c.aim.x-piv.x,c.aim.z-piv.z),rate=(tank?.85:3.5)*(.3+.7*(this.sys?this.sys.tur:1));const err=ang(want-(this.yaw+this.tYaw));this.tYaw=ang(this.tYaw+cl(err,-rate*dt,rate*dt));
   const dx=c.aim.x-piv.x,dz=c.aim.z-piv.z,dh=Math.hypot(dx,dz),dy=c.aim.y-piv.y;let el;if(tank){const sp=170,g=9.8,v2=sp*sp,disc=v2*v2-g*(g*dh*dh+2*dy*v2);el=disc>=0?Math.atan((v2-Math.sqrt(disc))/(g*Math.max(1,dh))):PI/5;}else el=Math.atan2(dy,dh);
   const hullAlong=this.pitch*Math.cos(this.tYaw)-this.roll*Math.sin(this.tYaw)*0;this.gEl+=cl(cl(el-hullAlong,-.15,tank?.35:.7)-this.gEl,-dt*(tank?.8:3),dt*(tank?.8:3));}}
 flyHeli(dt,G){const W=G.W,c=this.ctrl,pil=!!this.driver;const gy=W.ground(this.p.x,this.p.z,this.p.y+.5,1.5);this.rotor+=((pil?1:0)-this.rotor)*Math.min(1,dt*(pil?.6:.3));const sp=this.rotor;
  const fx=Math.sin(this.yaw),fz=Math.cos(this.yaw);const wantF=pil?cl(c.thr,-1,1):0,wantS=pil?cl(c.side,-1,1):0;
  const ax=(fx*wantF+fz*wantS)*15*sp,az=(fz*wantF-fx*wantS)*15*sp;this.vel.x+=ax*dt;this.vel.z+=az*dt;const drag=Math.exp(-dt*.42);this.vel.x*=drag;this.vel.z*=drag;const hs=Math.hypot(this.vel.x,this.vel.z);if(hs>this.S.speed){this.vel.x*=this.S.speed/hs;this.vel.z*=this.S.speed/hs;}
  const lift=pil?cl(c.lift,-1,1):-.6;const vyT=sp>.85?lift*11:-(1-sp)*9-1;this.vy+=(vyT-this.vy)*Math.min(1,dt*2.2);if(this.p.y>160&&this.vy>0)this.vy*=.9;
  // yaw toward the requested heading
  if(pil){const e=ang(c.yawT-this.yaw);this.w+=(cl(e*3,-1.6,1.6)-this.w)*Math.min(1,dt*5);}else this.w*=.9;this.yaw=ang(this.yaw+this.w*dt);
  this.p.x+=this.vel.x*dt;this.p.z+=this.vel.z*dt;this.p.y+=this.vy*dt;G.vehCollide(this,dt);
  if(this.p.y<gy+.15){if(this.vy<-9&&G.bump)G.bump(this,-this.vy);this.p.y=gy+.15;this.vy=Math.max(0,this.vy);this.vel.multiplyScalar(Math.exp(-dt*4));this.state='landed';}else if(this.p.y>gy+1.5)this.state='air';
  // visual attitude follows acceleration
  const lf=(this.vel.x*fx+this.vel.z*fz),ls=(this.vel.x*fz-this.vel.z*fx);this.pitch+=(-cl(wantF*.28+lf*.004,-.4,.4)*sp-this.pitch)*Math.min(1,dt*3);this.roll+=(cl(-wantS*.3-this.w*.15,-.5,.5)*sp-this.roll)*Math.min(1,dt*3);void ls;
  this.speed=Math.hypot(this.vel.x,this.vel.z,this.vy);
  // chin gun tracks the aim point
  const m=this.model;_b.copy(c.aim).sub(this.p);const want=Math.atan2(_b.x,_b.z);this.tYaw=cl(ang(want-this.yaw),-1.6,1.6);this.gEl=cl(Math.atan2(_b.y,Math.hypot(_b.x,_b.z))-this.pitch,-1.1,.35);void m;}
 flyJet(dt,G){const W=G.W,c=this.ctrl,pil=!!this.driver;
  if(this.state==='parked'){if(pil){this.state='air';this.speed=62;this.pitch=.16;this.p.y+=1.5;this.climbT=2.2;if(this.model.gear)this.model.gear.visible=false;}else{this.p.y=this.home.y+1.75;return;}}
  // target direction: the aim point (player camera or AI)
  _b.copy(c.aim).sub(this.p);const dh=Math.hypot(_b.x,_b.z);let ty=Math.atan2(_b.x,_b.z),tp=Math.atan2(_b.y,dh);if(this.climbT>0){this.climbT-=dt;tp=Math.max(tp,.22);}
  const gy=W.height(this.p.x,this.p.z),agl=this.p.y-gy;if(agl<35){tp=Math.max(tp,cl((35-agl)/40,0,.6));}
  const out=Math.max(Math.abs(this.p.x),Math.abs(this.p.z))>PLAY+140;if(out){ty=Math.atan2(-this.p.x,-this.p.z);}if(this.p.y>260)tp=Math.min(tp,-.1);
  const thr=pil?cl(c.thr,-1,1):0;const vT=lerp(cl(95+thr*40,70,140),this.speed,0);this.speed+=(vT-this.speed)*Math.min(1,dt*.6)-Math.sin(this.pitch)*9.8*dt*.6;this.speed=cl(this.speed,48,150);
  const rate=cl(this.speed/95,.5,1.15)*1.05;const ey=ang(ty-this.yaw),ep=cl(tp,-1.2,1.2)-this.pitch;const wy=cl(ey*2.2,-rate,rate),wp=cl(ep*2.5,-rate*.9,rate*.9);
  this.w+=(wy-this.w)*Math.min(1,dt*3.5);this.yaw=ang(this.yaw+this.w*dt);this.pitch=cl(this.pitch+wp*dt,-1.3,1.3);this.roll+=(cl(-this.w*1.15,-1.3,1.3)-this.roll)*Math.min(1,dt*4);
  this.fwd(this.vel).multiplyScalar(this.speed);this.p.addScaledVector(this.vel,dt);
  if(this.p.y<W.ground(this.p.x,this.p.z,this.p.y+3,3)+1.2&&G.crash)G.crash(this);
  this.model.flame.scale.set(1,.6+thr*.6+Math.random()*.2,1);}
 /* ---------------- visuals ---------------- */
 sync(dt,t){const m=this.model,v=this.vis;if(!this.alive&&this.wreckT>14){m.root.visible=false;return;}m.root.visible=true;m.root.position.copy(this.p);_e.set(-this.pitch,this.yaw,this.roll,'YXZ');m.root.quaternion.setFromEuler(_e);if(!this.alive)return;
  if(this.kind==='tank'){const acc=dt>0?(this.v-v.lv)/dt:0;v.lv=this.v;v.suspV+=(-v.susp*160-v.suspV*11+cl(acc,-30,30)*.9)*dt;v.susp=cl(v.susp+v.suspV*dt,-.12,.12);m.body.rotation.x=-v.susp*.35-v.rec*.05*Math.cos(this.tYaw);
   for(let i=0;i<2;i++){const sp=this.v+(i===0?1:-1)*this.w*m.dims.tx;v.trk[i]+=sp*dt;m.tracks[i].map.offset.y=m.tracks[i].normalMap.offset.y=-v.trk[i]*.92;}m.tur.rotation.y=this.tYaw;m.gun.rotation.x=-this.gEl;v.rec=Math.max(0,v.rec-dt*3);m.barrel.position.z=-v.rec*v.rec*.6;m.ant.rotation.x=cl(-acc*.02,-.4,.4);}
  else if(this.kind==='jeep'){v.wheel+=this.v*dt/.46;for(let i=0;i<4;i++){const w=m.wheels[i];w.children[0].rotation.x=w.children[1].rotation.x=v.wheel;if(i<2)w.rotation.y=this.ctrl.steer*.4*(this.driver?1:0);}m.tur.rotation.y=this.tYaw;m.gun.rotation.x=-this.gEl;m.body.rotation.z=cl(-this.w*this.v*.004,-.06,.06);}
  else if(this.kind==='heli'){v.rot+=dt*this.rotor*32;m.rotor.rotation.y=v.rot;m.tr.rotation.x=v.rot*1.7;m.disc.visible=this.rotor>.5;m.chin.rotation.y=this.tYaw;m.cgun.rotation.x=-this.gEl;}}
 wreck(){this.alive=false;this.wreckT=0;this.respawnT=this.S.respawn;for(const[o]of this.all)if(o.material!==MATS.flame&&o.material!==MATS.disc)o.material=MATS.wreck;else o.visible=false;if(this.model.flame)this.model.flame.visible=false;}
 restore(){for(const[o]of this.all)o.visible=true;this.reset();}
}
// ray vs vehicle bounding volume (capsule of circles) -> t or Infinity
export function hitVehicle(v,o,d,maxT){if(!v.alive&&v.wreckT>14)return Infinity;let best=Infinity;const f=_c.set(Math.sin(v.yaw),0,Math.cos(v.yaw)),hh=v.kind==='tank'?2.6:v.kind==='jeep'?1.7:v.kind==='heli'?2.6:1.4,oy=v.kind==='heli'||v.kind==='jet'?1.3:hh/2;
 for(const[off,r]of v.S.circ){const cx=v.p.x+f.x*off,cz=v.p.z+f.z*off,cy=v.p.y+oy+(v.kind==='jet'?Math.sin(v.pitch)*off:0);const rx=o.x-cx,ry=o.y-cy,rz=o.z-cz,R=v.kind==='jet'?r:r*1.05,b=rx*d.x+ry*d.y+rz*d.z;
  // sphere test, stretched vertically for ground vehicles
  const sy=v.kind==='tank'||v.kind==='jeep'?R/(hh*.55):1,ry2=ry*sy,dy2=d.y*sy,A=d.x*d.x+dy2*dy2+d.z*d.z,B=rx*d.x+ry2*dy2+rz*d.z,C=rx*rx+ry2*ry2+rz*rz-R*R,D=B*B-A*C;void b;if(D<0)continue;const t=(-B-Math.sqrt(D))/A;if(t>0&&t<maxT&&t<best)best=t;}
 return best;}
