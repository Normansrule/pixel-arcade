// BEACON RESCUE — the level: three connected rooms inside the lighthouse (data + collision + merged static geometry), and the
// exterior (tower, rock, stormy sea, sweeping beam, lifeboat) used by the menu and the finale.
import * as THREE from '../vendor/three.module.min.js';
import {plate,statusTex} from './tex.js';
const V=THREE.Vector3;
export const Z0=-5.5,Z1=5.5,WALLH=5.6,SH=3.3;
export const ROOMS=[
 {name:'THE BOATHOUSE',x0:-7,x1:7,entry:[-4.6,3.4],yaw:Math.PI,rule:'POWER TRAVELS',
  teach:'A battery carries power. A cable carries it on. A lit cable glows and pulses; a dead one stays dark.'},
 {name:'THE STOREROOM',x0:8,x1:22,entry:[9.6,1.5],yaw:-Math.PI/2,rule:'A WEIGHT HOLDS',
  teach:'A pan works only while something heavy stays on it. Leave the counterweight there and the gate stays up.'},
 {name:'THE LAMP STAIR',x0:23,x1:37,entry:[24.6,1.5],yaw:-Math.PI/2,rule:'POWER + HOLD',
  teach:'Open the stair shutter and get power up to the lamp. More than one way works.'}];
export const roomAt=x=>x<7.5?0:x<22.5?1:2;
// exits: door i joins room i and room i+1 (x0..x1 wall slab, doorway z 0.4..2.6)
export const DOORS=[{x0:7,x1:8,z0:.4,z1:2.6},{x0:22,x1:23,z0:.4,z1:2.6}];
export const SHUTTER={x0:26.9,x1:27.1,z0:-5.5,z1:-3.2};
const RAMP={x0:27,x1:33.5,z0:-5.5,z1:-3.2,h:3},GAL={x0:33.5,x1:37,h:3};
export const WATER={x0:-7,x1:-2.2,z0:-5.5,z1:-1.6};
// walkable height (objects use it too); water reads -1.2
export function groundAt(x,z,obj){if(obj&&x>WATER.x0&&x<WATER.x1&&z>WATER.z0&&z<WATER.z1)return -1.2;
 if(x>=GAL.x0&&x<=GAL.x1&&z>=Z0&&z<=Z1)return GAL.h;if(x>=RAMP.x0&&x<GAL.x0&&z>=RAMP.z0&&z<=RAMP.z1)return(x-RAMP.x0)/(RAMP.x1-RAMP.x0)*RAMP.h;return 0;}
// static obstacles: [x0,x1,z0,z1,ymin,ymax]
export const BOXES=[[-8,38,-6.4,Z0,-9,99],[-8,-7,-6,6.4,-9,99],[37,38,-6,6.4,-9,99],[-8,38,Z1,6.4,-9,99],
 [7,8,-6,.4,-9,99],[7,8,2.6,6,-9,99],[22,23,-6,.4,-9,99],[22,23,2.6,6,-9,99],
 // boathouse: water slip, generator, dock, cradle, workbench, crates, buoy rack
 [WATER.x0,WATER.x1,WATER.z0,WATER.z1,-9,99],[-7,-5.25,-.3,2.7,-9,99],[-5.0,-4.4,.9,1.5,-9,1],[2.2,2.8,-2.8,-2.2,-9,1],[.4,5.2,Z0,-4.5,-9,99],[4.6,7,3.7,Z1,-9,99],[-7,-5.6,3.7,Z1,-9,99],
 // storeroom: shelves, barrels, sacks
 [13.6,21.6,Z0,-4.6,-9,99],[19.4,22,3.4,Z1,-9,99],[8,10.2,3.9,Z1,-9,99],[15.2,16.8,2.9,4.4,-9,99],
 // lamp stair: generator, dock, ramp rail, shutter post, lamp, lamp cradle, keeper, crates, gallery rails
 [23,24.6,Z0,-3,-9,99],[23.4,24.1,-2.25,-1.55,-9,1],[27,33.5,-3.2,-3,-9,99],[26.5,27,-3.2,-2.7,-9,99],[31.4,33.5,3.9,Z1,-9,2],
 [34.55,36.35,-1.9,-.1,2.5,99],[34.7,35.3,1.1,1.7,2.5,99],[35.7,36.9,.9,2.4,2.5,99],[33.4,33.6,-3,.6,2.5,99]];

/* ---- level contents: snap targets (docks, cradles, ports, pans) and the movable objects ---- */
export function levelData(){
 const T=[ // kind: dock (charges a battery) · cradle (holds a battery, feeds port/lamp) · port (cable plug) · pan (holds a load)
  {id:'D0',kind:'dock',room:0,pos:[-4.7,.66,1.2],label:'CHARGER'},
  {id:'K0',kind:'cradle',room:0,pos:[2.5,.66,-2.5],label:'CELL CRADLE',feeds:'K0p'},
  {id:'G0p',kind:'port',room:0,pos:[-5.13,.95,2.05],n:[1,0,0],src:'gen',label:'GENERATOR'},
  {id:'K0p',kind:'port',room:0,pos:[2.82,.42,-2.5],n:[1,0,0],src:'K0',label:'CRADLE PORT'},
  {id:'D0s',kind:'port',room:0,pos:[6.93,1.15,-.55],n:[-1,0,0],sink:'door0',label:'DOOR SOCKET'},
  {id:'P1',kind:'pan',room:1,pos:[11.8,.08,-3.3],label:'GATE PAN'},
  {id:'D2',kind:'dock',room:2,pos:[23.75,.66,-1.9],label:'CHARGER'},
  {id:'G2p',kind:'port',room:2,pos:[24.63,.95,-3.75],n:[1,0,0],src:'gen',label:'GENERATOR'},
  {id:'S2s',kind:'port',room:2,pos:[26.75,1.05,-2.68],n:[0,0,1],sink:'shutter',label:'SHUTTER SOCKET'},
  {id:'P2',kind:'pan',room:2,pos:[29.9,.08,.4],label:'SHUTTER PAN'},
  {id:'L2s',kind:'port',room:2,pos:[34.6,3.4,-1.0],n:[-1,0,0],sink:'lamp',label:'LAMP SOCKET'},
  {id:'K2',kind:'cradle',room:2,pos:[35.0,3.66,1.4],label:'LAMP CRADLE',feeds:'lamp'}];
 const O=[
  {id:'B0',kind:'battery',room:0,spawn:[-1.2,0,3.9],name:'BATTERY'},
  {id:'W1',kind:'weight',room:1,spawn:[19.6,0,-3.7],name:'COUNTERWEIGHT'},
  {id:'B2',kind:'battery',room:2,spawn:[30.6,0,4.3],name:'BATTERY'},
  {id:'W2',kind:'weight',room:2,spawn:[25.2,0,4.4],name:'COUNTERWEIGHT'},
  {id:'C0a',kind:'plug',room:0,spawn:[4.1,0,.4],cable:'C0',end:0,name:'CABLE PLUG'},
  {id:'C0b',kind:'plug',room:0,spawn:[5.4,0,2.2],cable:'C0',end:1,name:'CABLE PLUG'},
  {id:'C2a',kind:'plug',room:2,spawn:[26.4,0,.9],cable:'C2',end:0,name:'CABLE PLUG'},
  {id:'C2b',kind:'plug',room:2,spawn:[27.8,0,2.4],cable:'C2',end:1,name:'CABLE PLUG'}];
 const C=[{id:'C0',room:0,len:6.5,ends:['C0a','C0b']},{id:'C2',room:2,len:11.5,ends:['C2a','C2b']}];
 return{T,O,C};}
// the solved layout of a room, used when a checkpoint resumes past it
export const SOLVED=[{B0:'K0',C0a:'K0p',C0b:'D0s',charge:{B0:1}},{W1:'P1'},null];

/* ---- merged static geometry ---- */
function boxGeo(w,h,d,tile=2){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*dims[f][0]/tile,uv.getY(i)*dims[f][1]/tile);}return g;}
class Batch{constructor(){this.b=new Map();}
 add(geo,mat,x=0,y=0,z=0,ry=0,rx=0,rz=0){const m=new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(1,1,1));
  let l=this.b.get(mat);if(!l)this.b.set(mat,l=[]);l.push([geo,m]);}
 flush(parent,shadow=true){for(const[mat,l]of this.b){let n=0;const parts=l.map(([g,m])=>{const q=g.index?g.toNonIndexed():g.clone();q.applyMatrix4(m);n+=q.attributes.position.count;return q;});
   const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;for(const q of parts){pos.set(q.attributes.position.array,o*3);nor.set(q.attributes.normal.array,o*3);if(q.attributes.uv)uv.set(q.attributes.uv.array,o*2);o+=q.attributes.position.count;q.dispose();}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));g.computeBoundingSphere();
   const me=new THREE.Mesh(g,mat);me.castShadow=shadow&&!mat.transparent;me.receiveShadow=true;parent.add(me);}this.b.clear();}}

export function buildWorld(scene,T){
 const std=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.8,metalness:0},o));
 const M={planks:std({map:T.planks,roughness:.7}),hex:std({map:T.hex,roughness:.55}),stone:std({map:T.stone,roughness:.9,color:0xb8c4d8}),stoneW:std({map:T.stone,roughness:.9,color:0xd8d0c4}),
  iron:std({map:T.iron,color:0x7ab4b4,roughness:.5,metalness:.25}),ironD:std({map:T.iron,color:0x4a5866,roughness:.45,metalness:.35}),brass:std({color:0xd8a44a,roughness:.3,metalness:.7}),
  crate:std({map:T.crate}),haz:std({map:T.haz,roughness:.6}),red:std({color:0xd8462e,roughness:.5}),white:std({color:0xece4d4,roughness:.6}),rope:std({color:0xb89868,roughness:.95}),
  beam:std({color:0x5a3a24,roughness:.75,map:T.planks}),dark:std({color:0x15181e,roughness:.6}),teal:std({color:0x2f6f74,roughness:.5,metalness:.2}),
  water:new THREE.ShaderMaterial({uniforms:{uT:{value:0},uF:{value:0}},vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'uniform float uT,uF;varying vec2 vU;void main(){vec2 p=vU*vec2(9.,7.);float w=sin(p.x*2.1+uT*1.7+sin(p.y*1.3+uT))*.5+sin(p.y*2.7-uT*1.3+p.x*.7)*.5;float hi=smoothstep(.55,.95,w);vec3 c=mix(vec3(.02,.12,.17),vec3(.06,.26,.32),w*.5+.5)+vec3(.5,.7,.8)*hi*.35+vec3(.6,.7,.9)*uF*.4;float e=min(min(vU.x,1.-vU.x),min(vU.y,1.-vU.y));c+=vec3(.5,.6,.6)*smoothstep(.05,0.,e)*(.5+.5*sin(uT*3.+p.x));gl_FragColor=vec4(c,1.);}'}),
  glassW:new THREE.MeshBasicMaterial({map:T.storm,color:0x8aa0c8}),lantern:new THREE.MeshBasicMaterial({color:new THREE.Color(3,1.9,.8)}),
  rubber:std({color:0x24201c,roughness:.7}),sack:std({color:0xb8a070,roughness:1}),jar:std({color:0x6a9a7a,roughness:.15,metalness:.1})};
 const W=new THREE.Group();scene.add(W);const B=new Batch(),add=(g,m,...a)=>B.add(g,m,...a);
 // floors
 add(boxGeo(14,.2,11,5),M.planks,0,-.1,0);add(boxGeo(14,.2,11,3.2),M.hex,15,-.1,0);add(boxGeo(10.5,.2,11,3.2),M.hex,28.25,-.1,0);
 add(boxGeo(1,.2,2.2),M.ironD,7.5,-.1,1.5);add(boxGeo(1,.2,2.2),M.ironD,22.5,-.1,1.5);
 // walls: north (tall, windows), west/east, south (low cutaway lip with posts), dividers
 for(const[x0,x1,m]of[[-8,7,M.stone],[7,23,M.stoneW],[23,38,M.stone]])add(boxGeo(x1-x0,WALLH,.9),m,(x0+x1)/2,WALLH/2,-5.95);
 add(boxGeo(1,SH,12.8),M.stone,-7.5,SH/2,0);add(boxGeo(1.1,.2,12.9),M.beam,-7.5,SH+.1,0);add(boxGeo(1,WALLH,12.8),M.stone,37.5,WALLH/2,0);
 add(boxGeo(46,.3,.9),M.stoneW,15,.15,5.95);add(boxGeo(46,.08,1),M.beam,15,.32,5.95);
 add(boxGeo(48,.3,9,3),M.stone,15,-.35,10.9);add(boxGeo(6,.3,22,3),M.stone,-11,-.35,2);
 // ceiling beams (hint of the roof without covering the view)
 for(let x=-6;x<37;x+=3)add(boxGeo(.35,.4,1.6),M.beam,x,WALLH-.2,-5);
 const dividers=[];for(const dx of[7.5,22.5]){const g=new THREE.Group();W.add(g);const db=new Batch();db.add(boxGeo(1,SH,6.4),M.stone,dx,SH/2,-2.8);db.add(boxGeo(1,SH,3.4),M.stone,dx,SH/2,4.3);db.add(boxGeo(1,SH-2.6,2.2),M.stone,dx,2.6+(SH-2.6)/2,1.5);
  db.add(boxGeo(1.1,.25,2.6),M.ironD,dx,2.65,1.5);for(const z of[.35,2.65])db.add(boxGeo(1.1,2.6,.2),M.ironD,dx,1.3,z);const mats=[];db.b.forEach((l,m)=>mats.push(m));
  // own material copies so the divider can fade when the camera swings past it
  const fade=new Map();for(const m of mats){const c=m.clone();c.transparent=true;c.opacity=1;fade.set(m,c);}const nb=new Batch();db.b.forEach((l,m)=>l.forEach(([geo,mx])=>{nb.b.has(fade.get(m))||nb.b.set(fade.get(m),[]);nb.b.get(fade.get(m)).push([geo,mx]);}));
  nb.flush(g);g.userData.mats=[...fade.values()];g.userData.x=dx;dividers.push(g);}
 // north windows: storm outside (lightning brightens them)
 const winMat=M.glassW;for(const x of[-.5,4,11,18,26,31])add(new THREE.PlaneGeometry(1.6,2.4),winMat,x,2.9,-5.49);
 for(const x of[-.5,4,11,18,26,31]){add(boxGeo(1.9,.18,.3),M.beam,x,1.62,-5.4);add(boxGeo(1.9,.18,.3),M.beam,x,4.18,-5.4);add(boxGeo(.12,2.5,.2),M.beam,x,2.9,-5.42);add(boxGeo(1.6,.1,.2),M.beam,x,2.9,-5.42);}
 // ===== room 0: boathouse =====
 const water=new THREE.Mesh(new THREE.PlaneGeometry(WATER.x1-WATER.x0,WATER.z1-WATER.z0,24,16),M.water);water.rotation.x=-Math.PI/2;water.position.set((WATER.x0+WATER.x1)/2,-.55,(WATER.z0+WATER.z1)/2);W.add(water);
 add(boxGeo(.25,.32,4.0),M.beam,WATER.x1+.12,.06,(WATER.z0+WATER.z1)/2-.05);add(boxGeo(4.8,.32,.25),M.beam,(WATER.x0+WATER.x1)/2,.06,WATER.z1+.12);add(boxGeo(4.8,.9,.2),M.stone,(WATER.x0+WATER.x1)/2,-.5,WATER.z1-.1);
 // boat doors over the slip, a rowboat
 add(boxGeo(4.4,3.6,.15),M.beam,-4.6,1.8,-5.45);add(new THREE.PlaneGeometry(4,.5),winMat,-4.6,3.85,-5.36);
 {const hull=new THREE.SphereGeometry(1,16,8,0,Math.PI*2,Math.PI/2,Math.PI/2);hull.scale(.75,.5,1.7);add(hull,M.red,-4.4,-.25,-3.6);add(boxGeo(1.3,.08,.25),M.beam,-4.4,-.28,-3.3);add(boxGeo(.06,.06,2.4),M.beam,-3.8,-.3,-3.8,0,0,.4);}
 // generator (big, teal, flywheel) + charger dock
 add(boxGeo(1.75,2.2,3.0),M.iron,-6.12,1.1,1.2);add(boxGeo(1.9,.25,3.2),M.ironD,-6.12,2.3,1.2);add(new THREE.CylinderGeometry(.95,.95,.2,28),M.ironD,-6.1,1.4,-.05,0,Math.PI/2);add(new THREE.CylinderGeometry(.25,.25,.4,12),M.brass,-6.1,1.4,-.05,0,Math.PI/2);
 add(new THREE.CylinderGeometry(.14,.14,1.8,10),M.ironD,-6.6,3.2,2.2);add(boxGeo(.9,.5,.9),M.haz,-6.1,.25,2.35);
 // workbench + tools, crates, buoys, anchor
 add(boxGeo(4.6,.15,1),M.beam,2.8,1.0,-5);for(const x of[.7,4.9])add(boxGeo(.15,1,.9),M.beam,x,.5,-5);add(boxGeo(.8,.4,.5),M.iron,1.6,1.28,-5.1);add(new THREE.CylinderGeometry(.15,.15,.5,10),M.red,3.6,1.33,-5.1);
 add(new THREE.TorusGeometry(.45,.12,8,20),M.red,2,2.4,-5.45);add(new THREE.TorusGeometry(.45,.12,8,20),M.white,3.6,2.4,-5.45);
 for(const[x,y,z,s]of[[5.6,.6,4.6,1.2],[6.1,1.8,4.7,1.1],[5.5,1.65,4.0,.5]])add(boxGeo(s,s,s,s),M.crate,x,y,z,.2);
 for(const[x,z]of[[-6.3,4.2],[-6.4,5.0],[-5.9,4.6]])add(new THREE.SphereGeometry(.38,14,10),(x+z)%1>.4?M.red:M.white,x,.38,z);
 add(new THREE.TorusGeometry(.6,.13,8,16,Math.PI),M.ironD,-1.5,.6,-5.2,0,0,Math.PI);add(boxGeo(.18,1.6,.18),M.ironD,-1.5,.8,-5.2);
 for(let i=0;i<4;i++)add(new THREE.TorusGeometry(.4-i*.05,.06,6,18),M.rope,4.7+i*.02,.06+i*.08,-1.8,0,Math.PI/2);
 // ===== room 1: storeroom =====
 for(let s=0;s<3;s++){add(boxGeo(7.8,.1,.8),M.beam,17.6,.7+s*1.2,-5.05);}for(const x of[13.8,17.6,21.4])add(boxGeo(.12,3.6,.8),M.beam,x,1.8,-5.05);
 for(let i=0;i<14;i++){const x=14.2+(i%7)*1.05,y=(i<7?.95:2.15);add(new THREE.CylinderGeometry(.18,.2,.42,10),M.jar,x,y,-5.05);}
 for(let i=0;i<5;i++)add(boxGeo(.7,.5,.6,.7),M.crate,14.5+i*1.5,3.25+.3,-5.05);
 for(const[x,z]of[[20.1,4.0],[21.2,4.1],[20.6,5.0],[21.4,5.0]]){add(new THREE.CylinderGeometry(.45,.42,1.1,14),M.beam,x,.55,z);add(new THREE.TorusGeometry(.45,.04,6,16),M.ironD,x,.85,z,0,Math.PI/2);add(new THREE.TorusGeometry(.45,.04,6,16),M.ironD,x,.25,z,0,Math.PI/2);}
 for(const[x,z,r]of[[8.8,4.4,.3],[9.6,4.9,-.2],[8.7,5.1,.1]])add(new THREE.SphereGeometry(.5,10,8),M.sack,x,.35,z,r);
 add(boxGeo(1.4,1.4,1.4,1.4),M.crate,16,.7,3.6,.15);add(boxGeo(.9,.9,.9,.9),M.crate,16.1,1.85,3.6,-.2);
 // the gate pan's exposed linkage: rod up the wall, a pulley, chain along the wall to the gate head (I Am Future-style visible workings)
 add(new THREE.CylinderGeometry(.05,.05,4.4,6),M.ironD,11.8,2.3,-5.3);add(new THREE.CylinderGeometry(.35,.35,.15,16),M.brass,11.8,4.6,-5.25,0,Math.PI/2);add(boxGeo(10.4,.06,.06),M.ironD,17,4.6,-5.2);
 add(new THREE.CylinderGeometry(.35,.35,.15,16),M.brass,22.2,4.6,-5.25,0,Math.PI/2);add(new THREE.CylinderGeometry(.05,.05,1.6,6),M.ironD,21.95,3.8,-4.6,0,0,0);add(boxGeo(.06,.06,5.6),M.ironD,21.95,4.6,-2.5);
 // ===== room 2: lamp stair =====
 add(boxGeo(1.6,2.2,2.5),M.iron,23.8,1.1,-4.25);add(boxGeo(1.75,.25,2.7),M.ironD,23.8,2.3,-4.25);add(new THREE.CylinderGeometry(.8,.8,.2,24),M.ironD,23.8,1.3,-2.95,0,Math.PI/2);add(boxGeo(.8,.5,.8),M.haz,24.2,.25,-2.6);
 // ramp (sloped slab) + rail, gallery block + rails, stone steps texture
 {const len=Math.hypot(RAMP.x1-RAMP.x0,RAMP.h),ang=Math.atan2(RAMP.h,RAMP.x1-RAMP.x0);const g=boxGeo(len,.3,RAMP.z1-RAMP.z0,1.5);add(g,M.planks,(RAMP.x0+RAMP.x1)/2,RAMP.h/2-.12,(RAMP.z0+RAMP.z1)/2,0,0,ang);
  for(let i=0;i<10;i++){const x=RAMP.x0+.3+i*.62,h=(x-RAMP.x0)/(RAMP.x1-RAMP.x0)*RAMP.h;add(boxGeo(.08,.05,2.3),M.ironD,x,h+.04,(RAMP.z0+RAMP.z1)/2);}
  add(boxGeo(6.5,.12,.12),M.brass,30.25,1.5+.9,-3.1,0,0,ang);for(let i=0;i<5;i++){const x=27.6+i*1.4,h=(x-RAMP.x0)/(RAMP.x1-RAMP.x0)*RAMP.h;add(boxGeo(.1,1+h*.0,.1),M.ironD,x,h+.5,-3.1);}
  add(boxGeo(6.5,1,.22),M.stone,30.25,.0,-3.1);// skirting under the rail so the ramp reads as solid
  const gw=GAL.x1-GAL.x0;add(boxGeo(gw,GAL.h,11,2),M.stone,GAL.x0+gw/2,GAL.h/2,0);add(boxGeo(gw+.3,.2,11.2,2),M.planks,GAL.x0+gw/2,GAL.h-.1,0);
  add(boxGeo(.12,.9,3.8),M.brass,33.5,3.55,-1.2);for(const z of[-3,-1.2,.6])add(boxGeo(.12,.9,.12),M.ironD,33.5,3.45,z);
  add(boxGeo(.3,.06,4.6),M.haz,33.65,3.03,3.1);}
 // lamp pedestal + big lens (the lens itself is a separate mesh so it can light up)
 add(new THREE.CylinderGeometry(.75,.9,1.1,16),M.ironD,35.45,3.55,-1.0);add(new THREE.CylinderGeometry(.85,.85,.12,16),M.brass,35.45,4.12,-1.0);
 // shutter frame + crates
 add(boxGeo(.3,2.6,.3),M.ironD,27,1.3,-3.05);add(boxGeo(.3,.3,2.5),M.ironD,27,2.55,-4.35);
 for(const[x,y,z,s]of[[32.2,.6,4.6,1.2],[33.0,.45,4.0,.9]])add(boxGeo(s,s,s,s),M.crate,x,y,z,.3);
 for(let i=0;i<3;i++)add(new THREE.TorusGeometry(.4-i*.05,.06,6,18),M.rope,29.5,.06+i*.08,4.6,0,Math.PI/2);
 B.flush(W);
 // ===== lights: warm lantern pools, cool storm fill =====
 const hemi=new THREE.HemisphereLight(0x6a80b8,0x2a1a10,.9);scene.add(hemi);
 const moon=new THREE.DirectionalLight(0x8aa8ff,.5);moon.position.set(20,24,-30);moon.target.position.set(15,0,0);scene.add(moon,moon.target);
 moon.shadow.camera.left=-26;moon.shadow.camera.right=26;moon.shadow.camera.top=12;moon.shadow.camera.bottom=-12;moon.shadow.camera.far=80;moon.shadow.bias=-.0008;moon.shadow.normalBias=.03;
 const lamps=[],lmat=M.lantern;const LP=[[-4.7,3.3,1.2,7],[3,3.6,-1.5,7],[13,3.6,-1.5,7],[19,3.6,1.5,6],[26,3.6,-.8,7],[35.4,5.2,1.2,7]];
 for(const[x,y,z,r]of LP){const l=new THREE.PointLight(0xffa858,22,r*1.9,1.5);l.position.set(x,y,z);scene.add(l);lamps.push(l);
  const c=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),lmat);c.position.set(x,y,z);W.add(c);const cap=new THREE.Mesh(new THREE.ConeGeometry(.28,.22,10,1,true),M.ironD);cap.position.set(x,y+.2,z);W.add(cap);
  const ch=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,WALLH-y,4),M.ironD);ch.position.set(x,y+(WALLH-y)/2+.2,z);W.add(ch);}
 // ===== doors (move) =====
 const doors=[];{const g=new THREE.Group();const p=new THREE.Mesh(boxGeo(.25,2.6,2.2,1.3),M.iron);p.position.y=1.3;g.add(p);const s=new THREE.Mesh(boxGeo(.3,.3,2.25),M.haz);s.position.y=.15;g.add(s);
  g.position.set(7.5,0,1.5);W.add(g);doors.push(g);}
 {const g=new THREE.Group();for(let i=0;i<6;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.6,6),M.ironD);b.position.set(0,1.3,-.9+i*.36);g.add(b);}
  for(let j=0;j<4;j++){const b=new THREE.Mesh(boxGeo(.1,.1,2.2),M.ironD);b.position.y=.3+j*.7;g.add(b);}for(let i=0;i<6;i++){const t=new THREE.Mesh(new THREE.ConeGeometry(.07,.2,6),M.ironD);t.rotation.x=Math.PI;t.position.set(0,-.08,-.9+i*.36);g.add(t);}
  g.position.set(22.5,0,1.5);W.add(g);doors.push(g);}
 {const g=new THREE.Group();for(let i=0;i<9;i++){const s=new THREE.Mesh(boxGeo(.12,.24,2.3),i%2?M.iron:M.ironD);s.position.y=.12+i*.25;g.add(s);}const h=new THREE.Mesh(boxGeo(.2,.18,2.3),M.haz);h.position.y=.05;g.add(h);
  g.position.set(27,0,-4.35);W.add(g);doors.push(g);}
 // ===== sign plates =====
 const sign=(text,icon,x,y,z,ry,w=.9)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/2),new THREE.MeshBasicMaterial({map:plate(text,icon),color:0xb0a898}));m.position.set(x,y,z);m.rotation.y=ry;W.add(m);return m;};
 sign('CHARGER','⚡',-5.21,1.7,1.2,Math.PI/2);sign('GENERATOR','⚡',-5.21,1.35,2.2,Math.PI/2,.8);sign('DOOR','▶',6.94,1.9,-.55,-Math.PI/2,.8);
 sign('GATE PAN','▼',11.8,1.2,-5.44,0);sign('GATE','▲',21.94,3.0,1.5,-Math.PI/2);sign('GENERATOR','⚡',24.62,1.6,-3.75,Math.PI/2,.8);sign('SHUTTER','▲',26.75,1.75,-2.68,0,.8);sign('SHUTTER PAN','▼',29.9,1.1,-2.99,0,.9);
 sign('LAMP','✦',34.6,3.88,-1.0,-Math.PI/2,.8);
 // ===== status discs over each mechanism (shape + colour): ✕ shut · ⚡ powered · ▲ held =====
 const ST={on:statusTex('on'),off:statusTex('off'),hold:statusTex('hold')},status=[];
 for(const[x,y,z]of[[7.5,3.15,1.5],[22.5,3.15,1.5],[27,3.0,-3.0],[35.45,6.15,-1.0]]){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:ST.off,depthWrite:false}));s.scale.setScalar(.5);s.position.set(x,y,z);W.add(s);status.push(s);}
 const lens=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,1.0,24,1,true),new THREE.MeshStandardMaterial({color:0xcfe8f0,roughness:.05,metalness:.1,transparent:true,opacity:.32,emissive:0x000000,side:THREE.DoubleSide,depthWrite:false}));lens.position.set(35.45,4.72,-1.0);W.add(lens);
 for(const y of[-.5,-.25,0,.25,.5]){const rg=new THREE.Mesh(new THREE.TorusGeometry(.51,.018,5,28),M.brass);rg.rotation.x=Math.PI/2;rg.position.set(35.45,4.72+y,-1.0);W.add(rg);}for(let i=0;i<6;i++){const a=i/6*Math.PI*2,b=new THREE.Mesh(new THREE.BoxGeometry(.04,1.02,.04),M.brass);b.position.set(35.45+Math.cos(a)*.51,4.72,-1+Math.sin(a)*.51);W.add(b);}
 {const cp=new THREE.Mesh(new THREE.SphereGeometry(.56,20,10,0,Math.PI*2,0,Math.PI/2),M.teal);cp.position.set(35.45,5.22,-1.0);W.add(cp);const kn=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),M.brass);kn.position.set(35.45,5.82,-1);W.add(kn);}
 const core=new THREE.Mesh(new THREE.SphereGeometry(.25,14,10),new THREE.MeshBasicMaterial({color:0x2a2a2a}));core.position.copy(lens.position);W.add(core);
 const lampLight=new THREE.PointLight(0xfff0c0,0,18,1.3);lampLight.position.copy(lens.position);scene.add(lampLight);
 return{W,M,dividers,doors,lamps,moon,hemi,status,ST,lens,core,lampLight,water,winMat};}

/* ===================== exterior: the lighthouse on its rock in the storm ===================== */
export function buildExterior(scene,T,lowSea){const X=new THREE.Group();X.visible=false;scene.add(X);
 const std=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.8},o));
 const stripe=(()=>{const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d');for(let i=0;i<4;i++){x.fillStyle=i%2?'#c43a2a':'#efe6d6';x.fillRect(0,i*64,64,64);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
 const B=new Batch(),rock=std({color:0x2c2a2a,roughness:.95,flatShading:true}),white=std({color:0xe8e0d0}),iron=std({color:0x22262c,roughness:.5,metalness:.5}),roof=std({color:0x8a2a20,roughness:.6});
 for(const[x,z,s,h]of[[0,0,7,2.2],[5,3,5,1.6],[-4,4,4.2,1.2],[3,-5,4.6,1.4],[-6,-2,3.6,1.2],[9,-1,3,1]]){const g=new THREE.DodecahedronGeometry(1,0);g.scale(s,h,s*.9);B.add(g,rock,x,0,z,x*.3);}
 B.add(new THREE.CylinderGeometry(3.5,3.5,.6,24),white,0,1.5,0);
 const tw=new THREE.CylinderGeometry(2.3,3.1,18,28,1,true);const tm=std({map:stripe,roughness:.7});B.add(tw,tm,0,10.8,0);
 B.add(new THREE.CylinderGeometry(3.0,3.0,.35,28),iron,0,19.9,0);B.add(new THREE.TorusGeometry(2.95,.05,6,40),iron,0,20.9,0,0,Math.PI/2);
 for(let i=0;i<16;i++){const a=i/16*Math.PI*2;B.add(new THREE.CylinderGeometry(.04,.04,1,4),iron,Math.cos(a)*2.95,20.45,Math.sin(a)*2.95);}
 B.add(new THREE.ConeGeometry(2.1,1.6,20),roof,0,24.3,0);B.add(new THREE.SphereGeometry(.25,10,8),iron,0,25.2,0);B.add(new THREE.CylinderGeometry(1.95,1.95,.3,24),iron,0,23.45,0);
 // keeper's cottage + boathouse annex with warm windows
 B.add(boxGeo(7,3.4,5,2),white,6.2,2.9,3.2);{const r=new THREE.CylinderGeometry(.1,3.8,2,4,1);r.scale(1.3,1,.9);B.add(r,roof,6.2,5.6,3.2,Math.PI/4);}
 B.flush(X);
 const winM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,1.3,.5)});for(const[x,z]of[[4.2,5.75],[6.2,5.75],[8.2,5.75]]){const w=new THREE.Mesh(new THREE.PlaneGeometry(.8,1.1),winM);w.position.set(x,2.8,z);X.add(w);}
 // lantern room glass + lamp core
 const glass=new THREE.Mesh(new THREE.CylinderGeometry(1.9,1.9,3.1,24,1,true),new THREE.MeshStandardMaterial({color:0x8aa4b8,roughness:.1,metalness:.4,transparent:true,opacity:.45,side:THREE.DoubleSide,emissive:0x000000}));glass.position.y=21.85;X.add(glass);
 const coreM=new THREE.MeshBasicMaterial({color:0x303030});const core=new THREE.Mesh(new THREE.SphereGeometry(.7,16,12),coreM);core.position.y=21.8;X.add(core);
 for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const m=new THREE.Mesh(new THREE.BoxGeometry(.08,3.1,.08),iron);m.position.set(Math.cos(a)*1.92,21.85,Math.sin(a)*1.92);X.add(m);}
 // beams: two additive cones, rotating
 const beam=new THREE.Group();beam.position.y=21.8;X.add(beam);const bm=new THREE.ShaderMaterial({uniforms:{uO:{value:0}},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false,
  vertexShader:'varying vec3 vN,vV;varying float vL;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vL=1.-uv.y;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uO;varying vec3 vN,vV;varying float vL;void main(){float f=abs(dot(normalize(vN),normalize(vV)));float a=pow(f,3.)*pow(1.-vL,2.2)*smoothstep(0.,.04,vL)*uO;gl_FragColor=vec4(vec3(1.,.9,.68)*a,1.);}'});
 for(const s of[1,-1]){const g=new THREE.ConeGeometry(10,140,24,1,true);g.translate(0,-70,0);g.rotateZ(s*Math.PI/2);const m=new THREE.Mesh(g,bm);m.rotation.z=s*-.06;beam.add(m);}
 const lampL=new THREE.PointLight(0xffe8b0,0,90,1.2);lampL.position.y=21.8;X.add(lampL);
 // sea: displaced plane, shader lights it where the beam sweeps
 const seaU={uT:{value:0},uBeam:{value:new THREE.Vector2(1,0)},uLit:{value:0},uFlash:{value:0},uCam:{value:new V()}};
 const segs=lowSea?70:150,sg=new THREE.PlaneGeometry(700,700,segs,segs);sg.rotateX(-Math.PI/2);
 const sea=new THREE.Mesh(sg,new THREE.ShaderMaterial({uniforms:seaU,fog:false,
  vertexShader:`uniform float uT;varying vec3 vW;varying float vH;
  float wv(vec2 p){return sin(p.x*.09+uT*1.1)*.9+sin(p.y*.13-uT*1.4+p.x*.05)*.7+sin((p.x+p.y)*.31+uT*2.3)*.25+sin((p.x-p.y)*.57-uT*3.)*.12;}
  void main(){vec3 p=position;float d=length(p.xz);float k=smoothstep(8.,30.,d);p.y=wv(p.xz)*k-.6;vH=p.y;vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform vec2 uBeam;uniform float uLit,uFlash,uT;uniform vec3 uCam;varying vec3 vW;varying float vH;
  void main(){vec3 c=mix(vec3(.01,.03,.06),vec3(.04,.1,.16),clamp(vH*.5+.5,0.,1.));float foam=smoothstep(.95,1.6,vH);c+=vec3(.25,.32,.36)*foam;
   vec2 d=vW.xz;float r=length(d);vec2 n=d/max(r,.001);float a=max(dot(n,uBeam),dot(n,-uBeam));float b=smoothstep(.975,.999,a)*(1.-smoothstep(40.,260.,r));
   float glow=exp(-r*.08);float sp=pow(max(0.,sin(vW.x*3.1+uT*2.3+sin(vW.z*2.)*2.)*sin(vW.z*2.7-uT*1.9+sin(vW.x*1.7)*2.)),8.);c+=vec3(1.,.9,.66)*uLit*(b*(.04+foam*.9+max(vH,0.)*.12+sp*.9)+glow*.1);c+=vec3(.3,.38,.55)*uFlash*(.3+foam);
   float f=1.-exp(-length(vW-uCam)*.006);gl_FragColor=vec4(mix(c,vec3(.03,.045,.08)+uFlash*vec3(.12,.14,.2),f),1.);}`}));X.add(sea);
 // sky dome
 const skyU={uFlash:{value:0},uT:{value:0}};const sky=new THREE.Mesh(new THREE.SphereGeometry(450,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform float uFlash,uT;varying vec3 vP;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  void main(){float y=vP.y;vec3 c=mix(vec3(.035,.05,.085),vec3(.012,.018,.035),smoothstep(0.,.6,y));vec2 q=vP.xz/(y+.25)*2.+vec2(uT*.03,0.);float cl=n(q)*.6+n(q*2.3)*.3+n(q*5.)*.1;
   c+=vec3(.06,.07,.1)*smoothstep(.45,.8,cl)*smoothstep(-.05,.3,y);c+=vec3(.5,.55,.75)*uFlash*(.25+cl*.8)*smoothstep(-.1,.4,y);gl_FragColor=vec4(c,1.);}`}));X.add(sky);
 // lifeboat: hull, cabin, a warm masthead light
 const boat=new THREE.Group();{const h=new THREE.Mesh(new THREE.BoxGeometry(1.6,.8,4.2),std({color:0xd85a2a}));h.position.y=.2;boat.add(h);const c=new THREE.Mesh(new THREE.BoxGeometry(1.3,.9,1.6),white);c.position.set(0,1,-.3);boat.add(c);
  const l=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.4,1.2)}));l.position.set(0,2.1,-.3);boat.add(l);const m=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.3,4),iron);m.position.set(0,1.6,-.3);boat.add(m);}
 boat.visible=false;X.add(boat);
 return{X,sea,seaU,skyU,beam,bm,lampL,glass,coreM,boat};}
