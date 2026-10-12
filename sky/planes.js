// SKY LANCERS — aircraft: specs, procedural models, arcade flight model, mouse-aim instructor.
import * as THREE from '../vendor/three.module.min.js';
import {hazeMat,merge,M4} from './world.js';
const V=THREE.Vector3,Q=THREE.Quaternion,C=THREE.Color,cl=(v,a,b)=>v<a?a:v>b?b:v,PI=Math.PI;
export const GRAV=9.81;

/* ================= specs ================= */
// vmax: level speed at full military power (m/s); thrust: m/s² at full power; wep: afterburner/boost multiplier
export const AC={
 wren:{id:'wren',name:'WREN P-7',role:'NIMBLE PROP FIGHTER',kind:'prop',vmax:178,thrust:15.5,wep:1.25,stall:40,vne:250,pitch:1.3,roll:4.4,yaw:.6,gmax:11.5,hp:100,rad:7.5,
  gun:{n:'4 × 12.7 MM MG',rof:34,dmg:3.4,ammo:1800,spd:880,spread:.0045,heat:.0105,cool:.38,tr:[1.6,1.1,.35]},msl:2,flares:16,bombs:2,unlock:0,
  stats:{SPEED:.45,AGILITY:1,FIREPOWER:.4,ARMOR:.35},blurb:'Tight-turning prop fighter. Out-turns everything, loses every drag race.'},
 stiletto:{id:'stiletto',name:'STILETTO J-22',role:'MULTIROLE JET',kind:'jet',vmax:300,thrust:24,wep:1.6,stall:56,vne:430,pitch:1,roll:5,yaw:.45,gmax:13,hp:140,rad:9,
  gun:{n:'20 MM ROTARY',rof:24,dmg:8.5,ammo:650,spd:1050,spread:.0032,heat:.0125,cool:.42,tr:[1.8,.9,.25]},msl:6,flares:40,bombs:2,unlock:2,
  stats:{SPEED:.85,AGILITY:.75,FIREPOWER:.7,ARMOR:.55},blurb:'Fast, agile all-rounder. Six heat-seekers and an afterburner.'},
 anvil:{id:'anvil',name:'ANVIL S-9',role:'HEAVY STRIKE JET',kind:'jet2',vmax:285,thrust:21,wep:1.55,stall:60,vne:400,pitch:.78,roll:3.3,yaw:.38,gmax:11,hp:240,rad:11,
  gun:{n:'30 MM CANNON',rof:12,dmg:21,ammo:380,spd:1000,spread:.003,heat:.021,cool:.36,tr:[2,.7,.2]},msl:4,agm:true,flares:60,bombs:8,unlock:4,
  stats:{SPEED:.78,AGILITY:.45,FIREPOWER:1,ARMOR:1},blurb:'Armoured bruiser. Missiles lock ground targets, eight bombs, a 30 mm hammer.'},
 bomber:{id:'bomber',name:'GRIZZLY B-4',role:'HEAVY BOMBER',kind:'prop4',vmax:128,thrust:8.5,wep:1,stall:36,vne:210,pitch:.32,roll:1.1,yaw:.2,gmax:3.5,hp:420,rad:19,gun:null,msl:0,flares:0,bombs:0,turrets:true},
 transport:{id:'transport',name:'PELICAN C-3',role:'TRANSPORT',kind:'prop4',vmax:120,thrust:8,wep:1,stall:34,vne:200,pitch:.3,roll:1,yaw:.2,gmax:3,hp:380,rad:19,gun:null,msl:0,flares:6,bombs:0},
 fortress:{id:'fortress',name:'THUNDERHEAD',role:'SKY FORTRESS',kind:'wing',vmax:105,thrust:6,wep:1,stall:25,vne:200,pitch:.12,roll:.35,yaw:.1,gmax:2,hp:6000,rad:48,gun:null,msl:0,flares:0,bombs:0,turrets:true}};
export const PLAYABLE=['wren','stiletto','anvil'];

/* ================= liveries ================= */
const sRGB=h=>new C(h);
export const LIVERY={blue:{top:sRGB(0x2c4766),bot:sRGB(0x9eabb8),acc:sRGB(0xff4d00),nav:1},red:{top:sRGB(0x5b5446),bot:sRGB(0x8f8b80),acc:sRGB(0xb3201a)},ace:{top:sRGB(0x17181c),bot:sRGB(0x3a3c42),acc:sRGB(0xd9a21c)},
 grey:{top:sRGB(0x7b848d),bot:sRGB(0xb5bcc2),acc:sRGB(0xff4d00)},ffa:[sRGB(0x2f6a3a),sRGB(0x6a2f5e),sRGB(0x2f5d6a),sRGB(0x6a5a2f),sRGB(0x4a4a4a),sRGB(0x7a3d22),sRGB(0x2d3f7a),sRGB(0x5e6a2f)]};
function panelTex(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,256,256);
 for(let i=0;i<1400;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.05})`;x.fillRect(Math.random()*256,Math.random()*256,2+Math.random()*6,1+Math.random()*3);}
 x.strokeStyle='rgba(0,0,0,.22)';x.lineWidth=1;for(let i=0;i<8;i++){x.beginPath();x.moveTo(0,i*32+.5);x.lineTo(256,i*32+.5);x.stroke();}for(let i=0;i<14;i++){const y=(i*37)%256,xx=(i*71)%256;x.beginPath();x.moveTo(xx+.5,y);x.lineTo(xx+.5,y+32);x.stroke();}
 x.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<220;i++)x.fillRect((i*53)%256,(i*29)%256,1.5,1.5);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
let PANEL=null;const matCache={};
function mats(){if(matCache.glass)return matCache;PANEL=panelTex();
 Object.assign(matCache,{glass:new THREE.MeshPhysicalMaterial({color:0x1d2a36,roughness:.04,metalness:.1,transmission:0,transparent:true,opacity:.62,envMapIntensity:2.2,clearcoat:1}),
  dark:hazeMat(new THREE.MeshStandardMaterial({color:0x22252a,roughness:.45,metalness:.7}),'pd'),steel:hazeMat(new THREE.MeshStandardMaterial({color:0x8a8e94,roughness:.3,metalness:.9}),'ps'),
  tire:new THREE.MeshStandardMaterial({color:0x111111,roughness:.9}),blade:hazeMat(new THREE.MeshStandardMaterial({color:0x15161a,roughness:.5,metalness:.3}),'bl'),
  mslw:hazeMat(new THREE.MeshStandardMaterial({color:0xe6e6e0,roughness:.45,metalness:.2}),'mw'),bomb:hazeMat(new THREE.MeshStandardMaterial({color:0x4b5233,roughness:.6,metalness:.2}),'bo'),
  navR:new THREE.MeshBasicMaterial({color:new C(4,.2,.1)}),navG:new THREE.MeshBasicMaterial({color:new C(.2,4,.6)}),navW:new THREE.MeshBasicMaterial({color:new C(3,3,3)}),
  disc:new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.09,depthWrite:false,side:THREE.DoubleSide})});return matCache;}
function paintMat(){return hazeMat(new THREE.MeshStandardMaterial({vertexColors:true,map:PANEL,roughness:.42,metalness:.38,envMapIntensity:1.1}),'paint');}
// vertex-colour a geometry: counter-shading (dark top, light belly)
function shade(g,liv,acc){const p=g.attributes.position,n=g.attributes.normal,a=new Float32Array(p.count*3),c=new C();
 for(let i=0;i<p.count;i++){if(acc)c.copy(liv.acc);else{const t=cl(n.getY(i)*.9+.5,0,1);c.copy(liv.bot).lerp(liv.top,t*t*(3-2*t));}a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;}
function prep(g){g=g.index?g.toNonIndexed():g;g.computeVertexNormals();return g;}
// fuselage from a [z(+nose), radius] profile; forward is -Z
function fuse(prof,sx=1,sy=1,seg=16){const pts=prof.map(([z,r])=>new THREE.Vector2(Math.max(.001,r),z));const g=new THREE.LatheGeometry(pts,seg);g.rotateX(-PI/2);g.scale(sx,sy,1);return g;}
// wing planform: list of [span, zLE, zTE] stations (z: + is aft); returns right-hand wing (x>0) or mirrored
function wing(st,thick,side=1,dihedral=0){const s=new THREE.Shape();s.moveTo(side*st[0][0],st[0][1]);for(let i=1;i<st.length;i++)s.lineTo(side*st[i][0],st[i][1]);for(let i=st.length-1;i>=0;i--)s.lineTo(side*st[i][0],st[i][2]);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:thick*.5,bevelEnabled:true,bevelThickness:thick*.25,bevelSize:Math.min(.18,thick*.5),bevelSegments:2,curveSegments:4});g.rotateX(PI/2);g.translate(0,thick*.25+thick*.25,0);
 if(dihedral)g.rotateZ(side*dihedral);return g;}
function fin(st,thick){const s=new THREE.Shape();s.moveTo(st[0][1],st[0][0]);for(let i=1;i<st.length;i++)s.lineTo(st[i][1],st[i][0]);for(let i=st.length-1;i>=0;i--)s.lineTo(st[i][2],st[i][0]);s.closePath();
 const g=new THREE.ExtrudeGeometry(s,{depth:thick,bevelEnabled:true,bevelThickness:thick*.3,bevelSize:.1,bevelSegments:2});g.rotateY(-PI/2);g.translate(thick/2,0,0);return g;}
const flameMat=()=>new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uT:{value:0},uP:{value:1},uAB:{value:0}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uT,uP,uAB;varying vec2 vUv;void main(){float z=vUv.y;float core=pow(1.-abs(vUv.x-.5)*2.,1.5);float diam=.5+.5*sin(z*38.-uT*40.);
  vec3 c=mix(vec3(1.,.45,.12),vec3(.5,.7,1.6),smoothstep(.55,1.,z))*(1.+diam*uAB*.8);float a=core*smoothstep(0.,.65,z)*(.35+uAB*.9)*uP;gl_FragColor=vec4(c*a*2.2,1.);}`});
function addFlame(g,ud,x,y,z,r,len){const m=flameMat();const cone=new THREE.Mesh(new THREE.ConeGeometry(r,len,12,1,true).rotateX(PI/2).translate(0,0,len/2),m);cone.position.set(x,y,z);cone.renderOrder=8;g.add(cone);ud.flames.push(cone);
 const glow=new THREE.Mesh(new THREE.CircleGeometry(r*.92,16),new THREE.MeshBasicMaterial({color:new C(1.6,.7,.3),transparent:true,opacity:.0,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.set(x,y,z-.01);g.add(glow);ud.glows.push(glow);}
function addProp(g,ud,x,y,z,r,blades=3,liv){const M=mats(),hub=new THREE.Group();hub.position.set(x,y,z);
 const sp=new THREE.Mesh(new THREE.ConeGeometry(r*.2,r*.55,14).rotateX(-PI/2).translate(0,0,-r*.27),hazeMat(new THREE.MeshStandardMaterial({color:liv.acc,roughness:.35,metalness:.4}),'spin'));hub.add(sp);
 const bl=new THREE.Group();for(let i=0;i<blades;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(r*.13,r,.06).translate(0,r*.5,0),M.blade);b.rotation.z=i/blades*PI*2;b.rotation.y=.25;bl.add(b);}hub.add(bl);
 const disc=new THREE.Mesh(new THREE.CircleGeometry(r,32),M.disc);disc.visible=false;hub.add(disc);g.add(hub);ud.props.push({hub,bl,disc});}
function missileMesh(){const M=mats();const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,2.9,8).rotateX(PI/2),M.mslw));
 const tip=new THREE.Mesh(new THREE.ConeGeometry(.09,.3,8).rotateX(-PI/2),M.dark);tip.position.z=-1.6;g.add(tip);
 for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(.02,.32,.36),M.dark);f.position.set(Math.cos(i*PI/2)*.18,Math.sin(i*PI/2)*.18,1.2);f.rotation.z=i*PI/2;g.add(f);
  const f2=new THREE.Mesh(new THREE.BoxGeometry(.02,.22,.2),M.dark);f2.position.set(Math.cos(i*PI/2)*.14,Math.sin(i*PI/2)*.14,-.9);f2.rotation.z=i*PI/2;g.add(f2);}return g;}
export function makeMissileMesh(){return missileMesh();}
function bombMesh(){const M=mats(),g=new THREE.Group();g.add(new THREE.Mesh(new THREE.CapsuleGeometry(.2,1.3,4,10).rotateX(PI/2),M.bomb));for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(.02,.3,.3),M.dark);f.position.set(Math.cos(i*PI/2+PI/4)*.2,Math.sin(i*PI/2+PI/4)*.2,.85);f.rotation.z=i*PI/2+PI/4;g.add(f);}return g;}
export function makeBombMesh(){return bombMesh();}
function gear(g,ud,pts,h){const M=mats(),grp=new THREE.Group();for(const [x,z] of pts){const s=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,h,5),M.steel);s.position.set(x,-h/2,z);grp.add(s);
  const w=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.22,12).rotateZ(PI/2),M.tire);w.position.set(x,-h,z);grp.add(w);}grp.visible=false;g.add(grp);ud.gear=grp;ud.gearH=h+.32;}
function nav(g,ud,x,y,z){const M=mats();for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.SphereGeometry(.09,6,4),s<0?M.navR:M.navG);l.position.set(s*x,y,z);g.add(l);}}

/* ================= models ================= */
export function buildModel(type,liv){const M=mats(),paint=paintMat(),g=new THREE.Group(),ud=g.userData;Object.assign(ud,{props:[],flames:[],glows:[],msl:[],bombs:[],parts:{},surf:{},tips:[],turrets:[],engines:[],hit:[]});
 const part=(name,geos,mat=paint)=>{const geo=merge(geos);const m=new THREE.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;g.add(m);ud.parts[name]=m;return m;};
 const S=(geo,acc)=>[shade(prep(geo),liv,acc),null];
 if(type==='wren'){
  part('body',[S(fuse([[-4.9,.06],[-4.4,.24],[-2.6,.52],[-.6,.7],[1.4,.76],[3,.74],[3.9,.68],[4.4,.6],[4.75,.45]],.94,1.06)),S(new THREE.CylinderGeometry(.62,.66,.5,16).rotateX(PI/2).translate(0,0,-4.55),true),
   S(new THREE.BoxGeometry(.5,.35,1.5).translate(0,-.75,.4)),S(new THREE.BoxGeometry(.28,.5,.5).translate(0,.62,.9))]);
  part('wingR',[S(wing([[.4,-1,1.35],[2,-1,1.3],[3.7,-.75,1.05],[5,-.35,.6],[5.55,.05,.3]],.2,1,.09)),S(wing([[.4,-1,1.35],[1,-1,1.3]],.25,1).translate(0,-.05,0))]).position.y=-.38;
  part('wingL',[S(wing([[.4,-1,1.35],[2,-1,1.3],[3.7,-.75,1.05],[5,-.35,.6],[5.55,.05,.3]],.2,-1,.09)),S(wing([[.4,-1,1.35],[1,-1,1.3]],.25,-1).translate(0,-.05,0))]).position.y=-.38;
  part('tail',[S(wing([[.1,3.7,4.65],[1.1,3.8,4.6],[1.9,4.05,4.4]],.12,1)),S(wing([[.1,3.7,4.65],[1.1,3.8,4.6],[1.9,4.05,4.4]],.12,-1)),S(fin([[.3,3.4,4.85],[1.2,3.7,4.85],[1.75,4.1,4.7]],.1)),S(fin([[1.45,3.95,4.75],[1.78,4.12,4.66]],.11).translate(0,0,0),true)]).position.y=.05;
  const can=new THREE.Mesh(new THREE.SphereGeometry(.5,16,10,0,PI*2,0,PI/2).scale(.82,.95,2.1),M.glass);can.position.set(0,.55,.2);g.add(can);ud.canopy=can;
  addProp(g,ud,0,0,-4.85,1.65,3,liv);nav(g,ud,5.45,-.3,.2);for(const s of[-1,1])for(let i=0;i<3;i++){const e=new THREE.Mesh(new THREE.BoxGeometry(.1,.12,.22),M.dark);e.position.set(s*.62,.15-i*.22,-3.3+i*.3);g.add(e);}
  for(const s of[-1,1]){const gb=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.7,5).rotateX(PI/2),M.dark);gb.position.set(s*1.9,-.32,-1.3);g.add(gb);}
  for(const s of[-1,1]){const m=missileMesh();m.scale.setScalar(.8);m.position.set(s*3,-.65,.1);g.add(m);ud.msl.push(m);}
  for(const s of[-1,1]){const b=bombMesh();b.position.set(s*1.4,-.75,.2);g.add(b);ud.bombs.push(b);}
  gear(g,ud,[[-1.5,-.6],[1.5,-.6],[0,4.2]],1.1);ud.tips=[new V(-5.5,-.25,.25),new V(5.5,-.25,.25)];ud.engines=[new V(0,0,-3.6)];ud.gun=[new V(-1.9,-.3,-1.7),new V(1.9,-.3,-1.7)];ud.eye=new V(0,.75,.5);
  ud.hit=[[0,0,-3.2,1.1,'engine'],[0,0,-.8,1.1,'body'],[0,.1,1.8,.9,'body'],[0,.4,4.2,1.1,'tail'],[-2.3,-.35,.2,1.35,'wingL'],[2.3,-.35,.2,1.35,'wingR'],[-4.4,-.2,.3,1.05,'wingL'],[4.4,-.2,.3,1.05,'wingR']];}
 else if(type==='stiletto'){
  part('body',[S(fuse([[-7.6,.52],[-6.8,.6],[-5,.82],[-2,.92],[1,.9],[3,.78],[4.8,.56],[6.4,.3],[7.5,.03]],1.18,.9)),S(new THREE.BoxGeometry(.7,1,3.8).translate(-1.05,-.15,-.6)),S(new THREE.BoxGeometry(.7,1,3.8).translate(1.05,-.15,-.6)),
   S(new THREE.BoxGeometry(.75,1.05,.2).translate(-1.05,-.15,-2.5),true),S(new THREE.BoxGeometry(.75,1.05,.2).translate(1.05,-.15,-2.5),true),S(fuse([[4.2,.75],[5,.85],[5.8,.8]],1,1).translate(0,.05,0))]);
  part('wingR',[S(wing([[.6,-4.6,2],[1.4,-1.6,3.7],[4.8,1.9,3.8],[5,2.1,3.75]],.2,1)),S(wing([[.6,-1,3],[1.2,-1,3]],.22,1))]);
  part('wingL',[S(wing([[.6,-4.6,2],[1.4,-1.6,3.7],[4.8,1.9,3.8],[5,2.1,3.75]],.2,-1)),S(wing([[.6,-1,3],[1.2,-1,3]],.22,-1))]);
  const fR=fin([[.3,4.1,6.9],[2.5,6.3,7.3]],.12).rotateZ(-.26).translate(1,.4,0),fL=fin([[.3,4.1,6.9],[2.5,6.3,7.3]],.12).rotateZ(.26).translate(-1,.4,0);
  part('tail',[S(wing([[.8,5.4,7.4],[2.7,6.7,7.6]],.12,1)),S(wing([[.8,5.4,7.4],[2.7,6.7,7.6]],.12,-1)),S(fR),S(fL),S(fin([[2.2,6.1,7.3],[2.5,6.3,7.3]],.13).rotateZ(-.26).translate(1,.4,0),true),S(fin([[2.2,6.1,7.3],[2.5,6.3,7.3]],.13).rotateZ(.26).translate(-1,.4,0),true)]);
  const noz=new THREE.Mesh(new THREE.CylinderGeometry(.5,.58,1.2,16,1,true).rotateX(PI/2),M.steel);noz.position.set(0,.05,7.5);g.add(noz);
  const can=new THREE.Mesh(new THREE.SphereGeometry(.55,16,10,0,PI*2,0,PI/2).scale(.85,.95,2.6),M.glass);can.position.set(0,.6,-3.6);g.add(can);ud.canopy=can;
  addFlame(g,ud,0,.05,8.05,.48,5);nav(g,ud,5,.12,2.4);
  for(const [x,y,z] of[[-5.05,.1,2.6],[5.05,.1,2.6],[-3.4,-.35,2.2],[3.4,-.35,2.2],[-2.4,-.35,1.2],[2.4,-.35,1.2]]){const m=missileMesh();m.position.set(x,y,z);g.add(m);ud.msl.push(m);}
  for(const s of[-1,1]){const b=bombMesh();b.position.set(s*.6,-.95,.3);g.add(b);ud.bombs.push(b);}
  gear(g,ud,[[-1.5,1.5],[1.5,1.5],[0,-4.5]],1.35);ud.tips=[new V(-5,.15,3.6),new V(5,.15,3.6)];ud.engines=[new V(0,.05,8.2)];ud.gun=[new V(-.7,.35,-4.2)];ud.eye=new V(0,.95,-3.9);
  ud.hit=[[0,0,4.4,1.3,'engine'],[0,0,.4,1.4,'body'],[0,.1,-3.6,1.1,'body'],[0,1.2,6.2,1.5,'tail'],[-2.2,0,1.6,1.6,'wingL'],[2.2,0,1.6,1.6,'wingR'],[-4,0,2.7,1.2,'wingL'],[4,0,2.7,1.2,'wingR']];}
 else if(type==='anvil'){
  part('body',[S(fuse([[-9.6,.9],[-8,1.1],[-4,1.3],[0,1.35],[4,1.2],[6.6,.85],[8.4,.45],[9.5,.04]],1.3,.82)),S(fuse([[-9.9,.7],[-9,.78],[-4,.82],[1,.82],[2.5,.6]],1,1).translate(-.95,-.15,0)),S(fuse([[-9.9,.7],[-9,.78],[-4,.82],[1,.82],[2.5,.6]],1,1).translate(.95,-.15,0)),
   S(new THREE.BoxGeometry(1.1,.9,.25).translate(-1.4,-.2,-1.2),true),S(new THREE.BoxGeometry(1.1,.9,.25).translate(1.4,-.2,-1.2),true)]);
  part('wingR',[S(wing([[.9,-3,3.4],[6.8,1.2,3.9],[7,1.5,3.8]],.26,1,-.03)),S(wing([[.9,-5.5,0],[1.3,-3,1]],.2,1))]).position.y=.45;
  part('wingL',[S(wing([[.9,-3,3.4],[6.8,1.2,3.9],[7,1.5,3.8]],.26,-1,-.03)),S(wing([[.9,-5.5,0],[1.3,-3,1]],.2,-1))]).position.y=.45;
  const fR=fin([[.5,5.4,8.6],[3.1,7.6,9.2]],.16).rotateZ(-.14).translate(1.6,.6,0),fL=fin([[.5,5.4,8.6],[3.1,7.6,9.2]],.16).rotateZ(.14).translate(-1.6,.6,0);
  part('tail',[S(wing([[1.3,6.8,9.6],[3.6,8.2,9.8]],.15,1)),S(wing([[1.3,6.8,9.6],[3.6,8.2,9.8]],.15,-1)),S(fR),S(fL),S(fin([[2.7,7.3,9.1],[3.1,7.6,9.2]],.17).rotateZ(-.14).translate(1.6,.6,0),true),S(fin([[2.7,7.3,9.1],[3.1,7.6,9.2]],.17).rotateZ(.14).translate(-1.6,.6,0),true)]);
  for(const s of[-1,1]){const noz=new THREE.Mesh(new THREE.CylinderGeometry(.6,.68,1.1,16,1,true).rotateX(PI/2),M.steel);noz.position.set(s*.95,-.15,9.9);g.add(noz);addFlame(g,ud,s*.95,-.15,10.4,.56,5.5);}
  const can=new THREE.Mesh(new THREE.SphereGeometry(.6,16,10,0,PI*2,0,PI/2).scale(.85,.9,3.4),M.glass);can.position.set(0,.85,-5.2);g.add(can);ud.canopy=can;nav(g,ud,7,.55,3.2);
  for(const [x,y,z] of[[-4.2,-.05,1.8],[4.2,-.05,1.8],[-5.5,.05,2.6],[5.5,.05,2.6]]){const m=missileMesh();m.position.set(x,y,z);g.add(m);ud.msl.push(m);}
  for(let i=0;i<8;i++){const b=bombMesh();b.position.set((i%2?1:-1)*(.45+(i>>2)*1.9)*(i>=4?1.3:1),-1.05-(i>=4?0:.05),-2.5+((i>>1)%2)*2.4);g.add(b);ud.bombs.push(b);}
  gear(g,ud,[[-2,1],[2,1],[0,-6]],1.6);ud.tips=[new V(-7,.45,3.6),new V(7,.45,3.6)];ud.engines=[new V(-.95,-.15,10.2),new V(.95,-.15,10.2)];ud.gun=[new V(0,-.5,-7)];ud.eye=new V(0,1.2,-6.2);
  ud.hit=[[0,0,6,1.6,'engine'],[0,0,1,1.6,'body'],[0,.2,-4.5,1.4,'body'],[0,1.5,8,1.9,'tail'],[-2.6,.45,.6,1.9,'wingL'],[2.6,.45,.6,1.9,'wingR'],[-5.2,.45,2.4,1.4,'wingL'],[5.2,.45,2.4,1.4,'wingR']];}
 else if(type==='bomber'||type==='transport'){const T=type==='transport',fat=T?1.25:1;
  part('body',[S(fuse([[-11,.35],[-9.4,.9],[-6,1.55*fat],[-1,1.75*fat],[4,1.7*fat],[8,1.4*fat],[10,1],[11.2,.55]],1,1)),S(new THREE.CylinderGeometry(.62,.62,.2,14).rotateX(PI/2).translate(0,0,-11.2),true)]);
  const W=[[1,-2.2,2.6],[9,-1.9,1.9],[15.5,-1.4,.7],[16,-1.1,.5]];part('wingR',[S(wing(W,.42,1,.035))]).position.y=T?1.2:.6;part('wingL',[S(wing(W,.42,-1,.035))]).position.y=T?1.2:.6;
  const tl=[S(wing([[.4,8.6,10.6],[5,9.4,10.6]],.18,1)),S(wing([[.4,8.6,10.6],[5,9.4,10.6]],.18,-1))];
  if(T)tl.push(S(fin([[.6,7.6,11],[4.2,9.5,11]],.2)));else for(const s of[-1,1])tl.push(S(fin([[-1.2,9,10.4],[2.4,9.4,10.4]],.18).translate(s*5,.2,0)));
  part('tail',tl).position.y=.4;
  const nac=[];for(const x of[-8.6,-4.4,4.4,8.6]){nac.push(S(fuse([[-2.4,.3],[-1.8,.7],[0,.72],[2,.5],[3.2,.2]],1,1).translate(x,(T?1.2:.6)-.05,-2.6)));}part('engines',nac);
  for(const x of[-8.6,-4.4,4.4,8.6])addProp(g,ud,x,(T?1.2:.6)-.05,-5,1.9,4,liv);
  const can=new THREE.Mesh(new THREE.SphereGeometry(.9,14,8,0,PI*2,0,PI/2).scale(.95,.7,1.6),M.glass);can.position.set(0,.9*fat+.2,-8.6);g.add(can);
  if(!T){for(const [y,z] of[[1.55,-3],[0,11.2]]){const t=new THREE.Group();t.position.set(0,y,z);const b=new THREE.Mesh(new THREE.SphereGeometry(.7,12,8),M.glass);t.add(b);for(const s of[-.15,.15]){const br=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.6,5).rotateX(PI/2),M.dark);br.position.set(s,0,-.8);t.add(br);}g.add(t);ud.turrets.push(t);}}
  nav(g,ud,16,(T?1.2:.6)+.4,-.6);ud.tips=[new V(-16,.9,-.8),new V(16,.9,-.8)];ud.engines=[new V(-8.6,.6,-1),new V(-4.4,.6,-1),new V(4.4,.6,-1),new V(8.6,.6,-1)];ud.eye=new V(0,1.6,-8.6);
  const wy=T?1.2:.6;ud.hit=[[0,0,-6,1.9,'body'],[0,0,0,2,'body'],[0,0,6,1.8,'body'],[0,1.2,10,2.6,'tail'],[-8.6,wy,-2.4,1.5,'eng0'],[-4.4,wy,-2.4,1.5,'eng1'],[4.4,wy,-2.4,1.5,'eng2'],[8.6,wy,-2.4,1.5,'eng3'],[-6.5,wy,0,2.3,'wingL'],[6.5,wy,0,2.3,'wingR'],[-13,wy,-.2,1.9,'wingL'],[13,wy,-.2,1.9,'wingR']];
  gear(g,ud,[[-4.4,-1],[4.4,-1],[0,10]],2);}
 else if(type==='fortress'){const s=new THREE.Shape();s.moveTo(0,-20);s.lineTo(46,13);s.lineTo(44,19);s.lineTo(30,13);s.lineTo(22,19);s.lineTo(12,14);s.lineTo(0,22);s.lineTo(-12,14);s.lineTo(-22,19);s.lineTo(-30,13);s.lineTo(-44,19);s.lineTo(-46,13);s.closePath();
  const wg=new THREE.ExtrudeGeometry(s,{depth:2.4,bevelEnabled:true,bevelThickness:1.4,bevelSize:1.4,bevelSegments:3}).rotateX(PI/2).translate(0,2.6,0);
  part('body',[S(wg),S(new THREE.SphereGeometry(8,24,14).scale(1.2,.55,2.6).translate(0,1.6,-2)),S(new THREE.SphereGeometry(2.6,16,8,0,PI*2,0,PI/2).scale(1.2,.7,2).translate(0,5.4,-16))]);
  ud.pods=[];for(const x of[-28,-18,-8,8,18,28]){const pod=new THREE.Group();pod.position.set(x,3.6,8+Math.abs(x)*.28);const m=new THREE.Mesh(shade(prep(fuse([[-4,.4],[-3.4,1.6],[2,1.7],[4,1.3]],1,1)),liv),paint);m.castShadow=true;pod.add(m);
   const glow=new THREE.Mesh(new THREE.CircleGeometry(1.25,16),new THREE.MeshBasicMaterial({color:new C(3,1.2,.4)}));glow.position.z=4.05;pod.add(glow);addFlame(pod,ud,0,0,4.1,1.2,9);g.add(pod);ud.pods.push(pod);}
  for(const [x,y,z] of[[-14,4.6,-2],[14,4.6,-2],[0,6.4,6],[-24,-1,6],[24,-1,6],[0,-2.4,0]]){const t=new THREE.Group();t.position.set(x,y,z);t.add(new THREE.Mesh(new THREE.SphereGeometry(1.2,12,8),M.glass));for(const o of[-.3,.3]){const br=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3,5).rotateX(PI/2),M.dark);br.position.set(o,0,-1.6);t.add(br);}g.add(t);ud.turrets.push(t);}
  for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.SphereGeometry(.4,6,4),s<0?M.navR:M.navG);l.position.set(s*45,3,15);g.add(l);}
  ud.tips=[new V(-45,3,16),new V(45,3,16)];ud.engines=ud.pods.map(p=>p.position.clone().add(new V(0,0,4)));ud.eye=new V(0,6,-16);
  ud.hit=[[0,2,-6,9,'body'],[0,2,8,9,'body'],[-16,2.6,6,6,'body'],[16,2.6,6,6,'body'],[-32,2.6,13,5,'body'],[32,2.6,13,5,'body'],...ud.pods.map((p,i)=>[p.position.x,p.position.y,p.position.z,3.6,'eng'+i])];}
 // shared detail: navigation strobe on the spine
 if(type!=='fortress'){const st=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),M.navW);st.position.set(0,.9,1);g.add(st);ud.strobe=st;}
 if(ud.parts.tail&&type!=='bomber'&&type!=='transport'){ud.surf.rud=ud.parts.tail;}
 return g;}
// cockpit interior overlay (player only, cockpit camera)
export function buildCockpit(){const g=new THREE.Group(),M=mats();const frame=hazeMat(new THREE.MeshStandardMaterial({color:0x1d2126,roughness:.6,metalness:.4}),'ck');
 const c=document.createElement('canvas');c.width=512;c.height=160;const x=c.getContext('2d');x.fillStyle='#14171b';x.fillRect(0,0,512,160);
 for(let i=0;i<6;i++){const cx=50+i*82,cy=80;x.fillStyle='#050608';x.beginPath();x.arc(cx,cy,32,0,7);x.fill();x.strokeStyle='#3a3f46';x.lineWidth=3;x.stroke();x.strokeStyle='#cfd6dc';x.lineWidth=1.5;for(let k=0;k<12;k++){const a=k/12*6.28;x.beginPath();x.moveTo(cx+Math.cos(a)*24,cy+Math.sin(a)*24);x.lineTo(cx+Math.cos(a)*29,cy+Math.sin(a)*29);x.stroke();}
  x.strokeStyle='#ff6a20';x.lineWidth=2.5;x.beginPath();x.moveTo(cx,cy);const a=-1+i*.7;x.lineTo(cx+Math.cos(a)*22,cy+Math.sin(a)*22);x.stroke();}
 const pt=new THREE.CanvasTexture(c);pt.colorSpace=THREE.SRGBColorSpace;
 const panel=new THREE.Mesh(new THREE.BoxGeometry(1.1,.36,.1),[frame,frame,frame,frame,new THREE.MeshStandardMaterial({map:pt,roughness:.6,emissive:0xffffff,emissiveMap:pt,emissiveIntensity:.15}),frame]);panel.position.set(0,-.42,-.95);panel.rotation.x=-.25;g.add(panel);
 const glare=new THREE.Mesh(new THREE.BoxGeometry(1.15,.06,.35),frame);glare.position.set(0,-.24,-.98);g.add(glare);
 for(const s of[-1,1]){const bar=new THREE.Mesh(new THREE.BoxGeometry(.022,.6,.022),frame);bar.position.set(s*.42,-.02,-.98);bar.rotation.z=s*.42;bar.rotation.x=-.35;g.add(bar);
  const rail=new THREE.Mesh(new THREE.BoxGeometry(.06,.18,1.4),frame);rail.position.set(s*.62,-.32,-.2);g.add(rail);}
 const arch=new THREE.Mesh(new THREE.TorusGeometry(.62,.025,6,20,PI),frame);arch.position.set(0,-.3,.35);g.add(arch);
 g.traverse(o=>{o.castShadow=false;});return g;}

/* ================= aircraft state + flight model ================= */
const _f=new V(),_u=new V(),_r=new V(),_a=new V(),_t=new V(),_q=new Q(),_iq=new Q();
export const FWD=new V(0,0,-1),UP=new V(0,1,0),RIGHT=new V(1,0,0);
let uid=1;
export class Plane{constructor(type,team,o={}){this.id=uid++;this.type=type;this.s=AC[type];this.team=team;this.name=o.name||this.s.name;this.human=!!o.human;this.p=new V();this.v=new V();this.q=new Q();this.w=new V();
  this.sp=0;this.thr=.8;this.ab=false;this.g=1;this.gs=1;this.aoa=0;this.ctrl={pitch:0,roll:0,yaw:0,thr:.8,ab:false,fire:false};this.reset();}
 reset(){const s=this.s;this.hp=s.hp;this.parts={body:{hp:s.hp*.9},engine:{hp:s.hp*.55},wingL:{hp:s.hp*.5},wingR:{hp:s.hp*.5},tail:{hp:s.hp*.45}};
  if(s.kind==='prop4'||s.kind==='wing'){const n=s.kind==='wing'?6:4;for(let i=0;i<n;i++)this.parts['eng'+i]={hp:s.kind==='wing'?520:s.hp*.3};}
  this.alive=true;this.doomed=0;this.fire=0;this.smoke=0;this.lost={};this.ammo=s.gun?s.gun.ammo:0;this.heat=0;this.over=0;this.msl=s.msl;this.flares=s.flares;this.bombs=s.bombs;this.gunT=0;this.mslT=0;this.flareT=0;this.bombT=0;
  this.lastHit=null;this.lastHitT=-99;this.dmgBy=new Map();this.stall=0;this.landed=null;this.gear=false;this.engOut=0;this.spin=0;this.wingRoll=0;this.blackout=0;}
 place(p,dir,speed){this.p.copy(p);const d=dir.clone().normalize();this.q.setFromUnitVectors(FWD,d);// keep wings level
  const r=new V(1,0,0).applyQuaternion(this.q);const ang=Math.atan2(r.y,new V(0,1,0).applyQuaternion(this.q).y);_q.setFromAxisAngle(d,ang);this.q.premultiply(_q);
  this.sp=speed;this.v.copy(d).multiplyScalar(speed);this.w.set(0,0,0);this.thr=this.ctrl.thr=.85;}
 fwd(o=new V()){return o.copy(FWD).applyQuaternion(this.q);}up(o=new V()){return o.copy(UP).applyQuaternion(this.q);}right(o=new V()){return o.copy(RIGHT).applyQuaternion(this.q);}
 engineFactor(){const s=this.s;if(s.kind==='prop4'||s.kind==='wing'){const n=s.kind==='wing'?6:4;let k=0;for(let i=0;i<n;i++)if(!this.lost['eng'+i])k++;return k/n;}return this.lost.engine?0:this.parts.engine.hp<this.s.hp*.2?.6:1;}}
// one fixed step of the arcade flight model
export function fly(pl,dt){const s=pl.s,c=pl.ctrl;let sp=pl.sp;const fw=pl.fwd(_f),up=pl.up(_u),rt=pl.right(_r);
 // throttle + afterburner
 pl.thr+=(cl(c.thr,0,1)-pl.thr)*Math.min(1,dt*(c.thr>pl.thr?.9:1.6));pl.ab=!!c.ab&&pl.thr>.6&&s.wep>1;
 // control authority: mushy when slow, stiff when overspeed
 const lowA=cl((sp-s.stall*.5)/(s.stall*.85),.14,1),hiA=sp>s.vne?cl(1-(sp-s.vne)/(s.vne*.3),.3,1):1,auth=lowA*hiA,G=GRAV;
 const pmax=Math.min(s.pitch,s.gmax*G/Math.max(sp,20))*auth*(1-pl.blackout*.35);
 let tp=cl(c.pitch,-.55,1)*pmax,ty=-cl(c.yaw,-1,1)*s.yaw*auth,tr=-cl(c.roll,-1,1)*s.roll*Math.min(1,auth*1.25);
 if(pl.lost.tail){tp=tp*.15+Math.sin(pl.doomed*3.1)*.5;ty=Math.sin(pl.doomed*2.3)*.5;}
 if(pl.lost.wingL)tr+=s.roll*1.1;if(pl.lost.wingR)tr-=s.roll*1.1;
 const k=1-Math.exp(-dt*(s.kind==='prop4'||s.kind==='wing'?2.5:7));pl.w.x+=(tp-pl.w.x)*k;pl.w.y+=(ty-pl.w.y)*k;pl.w.z+=(tr-pl.w.z)*k;
 // stall: the nose falls through towards the ground
 const vd=_t.copy(pl.v).divideScalar(Math.max(sp,.01));
 pl.stall=cl((s.stall*1.05-sp)/(s.stall*.35),0,1);
 if(pl.stall>0){_a.crossVectors(fw,new V(0,-1,0));_iq.copy(pl.q).invert();_a.applyQuaternion(_iq);pl.w.addScaledVector(_a,pl.stall*1.6*dt*4);}
 // weathervane: nose drifts back to the flight path (sideslip only)
 {_iq.copy(pl.q).invert();const lv=vd.clone().applyQuaternion(_iq);pl.w.y+=-lv.x*1.6*dt*4*Math.min(1,sp/s.stall);}
 const ang=pl.w.length()*dt;if(ang>1e-7){_a.copy(pl.w).normalize();_q.setFromAxisAngle(_a,ang);pl.q.multiply(_q).normalize();}
 // thrust / drag / induced drag / gravity along the path
 const alt=pl.p.y,ceil=cl(1-(alt-8500)/3000,0,1);const T=s.thrust*pl.thr*(pl.ab?s.wep:1)*pl.engineFactor()*ceil;const kd=s.thrust/(s.vmax*s.vmax);
 const dInd=.55*Math.pow(Math.max(0,pl.g-1),1.55)*(s.kind==='prop'?.85:1)+(c.brake?18:0)+(pl.gear?3:0);
 sp+=(T-kd*sp*sp*(sp>s.vne?1.6:1)-dInd-G*vd.y)*dt;if(sp<0){sp=-sp;vd.multiplyScalar(-1);}sp=Math.max(1.5,sp);
 // the flight path follows the nose (lift); gravity bends it down when lift runs out
 fw.copy(FWD).applyQuaternion(pl.q);const cosA=cl(vd.dot(fw),-1,1),aoa=Math.acos(cosA);pl.aoa=aoa;
 const lift=Math.min(1,(sp/s.stall)**2),kA=4.2*Math.min(1.5,sp/(s.stall*2.2))*lift*(pl.lost.wingL||pl.lost.wingR?.4:1);
 const prev=vd.clone();
 if(aoa>1e-5){_a.crossVectors(vd,fw);const l=_a.length();if(l>1e-6){_a.divideScalar(l);_q.setFromAxisAngle(_a,Math.min(aoa,aoa*kA*dt));vd.applyQuaternion(_q);}}
 // lift deficit (slow, or banked/inverted a little)
 const cosG=Math.sqrt(Math.max(0,1-vd.y*vd.y)),deficit=cl(1-lift*1.05,0,1)+(1-cl(up.y,0,1))*.22*Math.min(1,s.stall*2/sp)+(pl.lost.wingL||pl.lost.wingR?.6:0);
 if(deficit>0&&cosG>.01){_a.set(0,-1,0).addScaledVector(vd,vd.y).normalize();vd.addScaledVector(_a,G*cosG*deficit/Math.max(sp,9)*dt).normalize();}
 // G load from the path's turn rate + gravity
 _a.subVectors(vd,prev).divideScalar(dt).multiplyScalar(sp);const gl=_a.dot(up)/G+up.y;pl.g+=(gl-pl.g)*Math.min(1,dt*8);pl.gs+=(pl.g-pl.gs)*Math.min(1,dt*2);
 pl.sp=sp;pl.v.copy(vd).multiplyScalar(sp);pl.p.addScaledVector(pl.v,dt);
 // pilot G tolerance (blackout / redout)
 const gx=pl.gs>9?(pl.gs-9)*.13:pl.gs<-2.5?(-2.5-pl.gs)*.3:-.45;pl.blackout=cl(pl.blackout+gx*dt,0,1);
 pl.over=sp>s.vne?1:0;}

/* ================= instructor: turn an aim direction into stick inputs ================= */
const _lt=new V(),_ri=new V(),_up2=new V();
export function instruct(pl,aim,out,o={}){_iq.copy(pl.q).invert();_lt.copy(aim).normalize().applyQuaternion(_iq);const s=pl.s;
 const off=Math.acos(cl(-_lt.z,-1,1));pl.right(_ri);pl.up(_up2);
 const lvl=Math.atan2(_ri.y,_up2.y),aggr=Math.atan2(_lt.x,_lt.y);
 const inf=cl((off-.035)/.22,0,1);let rollErr=lvl*(1-inf)+aggr*inf;if(off<.4&&_lt.y<0&&Math.abs(aggr)>2.2)rollErr=lvl*(1-inf*.3);
 const rollRate=-pl.w.z;out.roll=cl(rollErr*2.6/Math.max(.6,s.roll*.5)-rollRate*.2,-1,1);
 const pmax=Math.max(.1,Math.min(s.pitch,s.gmax*GRAV/Math.max(pl.sp,20)));
 if(off>.6)out.pitch=cl(Math.cos(aggr)*1.4+.15,-.3,1);else out.pitch=cl(_lt.y*5.5/pmax-pl.w.x*.35/pmax*0,-1,1);
 out.yaw=off<.35?cl(_lt.x*7,-1,1):0;
 if(o.gentle){out.pitch*=o.gentle;out.roll*=Math.min(1,o.gentle*1.4);}return off;}
