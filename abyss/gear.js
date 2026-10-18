// ABYSS DIVER — the lifepod, the MINNOW sub, the diver (hands, tools and full suit), the cockpit, the habitat and the rescue beacon.
import * as THREE from '../vendor/three.module.min.js';
import {merge,paint,xf,sm,cl,mulberry,canvasTex} from './util.js';
import {wmat} from './water.js';

const S=(o)=>new THREE.MeshStandardMaterial(o);
const V=THREE.Vector3;

/* ---------- shared painted-metal textures: panel seams, rivets, grime streaks, scuffed edges ---------- */
let PT=null;
export function panelTex(){if(PT)return PT;const N=512,R=mulberry(55);
 const draw=(x,w,h,rough)=>{x.fillStyle=rough?'#8a8a8a':'#f2f2f2';x.fillRect(0,0,w,h);
  // big soft mottling
  for(let i=0;i<180;i++){const px=R()*w,py=R()*h,r=8+R()*40;const g=x.createRadialGradient(px,py,0,px,py,r);const a=rough?.12:.05;g.addColorStop(0,R()<.5?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2);}
  // panel grid with offset rows
  x.strokeStyle=rough?'rgba(40,40,40,.9)':'rgba(40,44,50,.55)';x.lineWidth=2;for(let r=0;r<4;r++){const y=r*128;x.beginPath();x.moveTo(0,y+.5);x.lineTo(w,y+.5);x.stroke();const off=(r%2)*64;for(let c=0;c<5;c++){const xx=c*128+off;x.beginPath();x.moveTo(xx+.5,y);x.lineTo(xx+.5,y+128);x.stroke();}}
  // rivets along seams
  x.fillStyle=rough?'rgba(200,200,200,.9)':'rgba(70,74,80,.6)';for(let r=0;r<4;r++)for(let k=0;k<64;k++){x.beginPath();x.arc(k*8+4,r*128+6,1.3,0,6.3);x.fill();}
  // grime streaks running down from seams
  for(let i=0;i<70;i++){const px=R()*w,py=Math.floor(R()*4)*128+4,l=20+R()*90;const g=x.createLinearGradient(0,py,0,py+l);const a=rough?.35:.16;g.addColorStop(0,`rgba(60,48,30,${a})`);g.addColorStop(1,'rgba(60,48,30,0)');x.fillStyle=g;x.fillRect(px,py,1.5+R()*3,l);}
  // scuffs / chips
  for(let i=0;i<260;i++){x.fillStyle=rough?`rgba(255,255,255,${.2+R()*.3})`:`rgba(${R()<.5?'120,110,100':'255,255,255'},${.15+R()*.25})`;x.fillRect(R()*w,R()*h,1+R()*3,1+R()*2);}
  if(!rough){// stencil decals
   x.fillStyle='rgba(30,34,40,.75)';x.font='bold 18px "JetBrains Mono", monospace';x.fillText('HALCYON · LP-07',150,250);x.font='bold 12px "JetBrains Mono", monospace';x.fillText('O2 · DO NOT OBSTRUCT',300,380);x.fillText('MAX 500 M',40,120);
   for(let i=0;i<8;i++){x.fillStyle=i%2?'rgba(30,30,30,.8)':'rgba(240,170,40,.85)';x.beginPath();x.moveTo(40+i*14,440);x.lineTo(54+i*14,440);x.lineTo(44+i*14,468);x.lineTo(30+i*14,468);x.fill();}}};
 const map=canvasTex(N,N,(x,w,h)=>draw(x,w,h,false));const rough=canvasTex(N,N,(x,w,h)=>draw(x,w,h,true),{srgb:false});
 PT={map,rough};return PT;}
/* neoprene: fine knit + seam lines */
let NT=null;function neoTex(){if(NT)return NT;NT=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#d8d8d8';x.fillRect(0,0,w,h);const R=mulberry(8);for(let i=0;i<4000;i++){x.fillStyle=`rgba(${R()<.5?0:255},${R()<.5?0:255},${R()<.5?0:255},.05)`;x.fillRect(R()*w,R()*h,2,1);}
 x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;for(let i=0;i<4;i++){x.beginPath();x.moveTo(0,i*64+20);x.bezierCurveTo(80,i*64+5,170,i*64+40,256,i*64+20);x.stroke();}},{rep:1});return NT;}

const hullMat=(o={})=>{const t=panelTex();return wmat(S(Object.assign({vertexColors:true,map:t.map,roughnessMap:t.rough,roughness:.62,metalness:.35,envMapIntensity:1.2},o)),{caus:.8,key:'hullp'+(o.k||'')});};

export function buildPod(){const g=new THREE.Group();
 const hull=hullMat();
 const body=new THREE.CylinderGeometry(2.4,2.8,4.4,40,8);body.translate(0,-1.2,0);paint(body,(c,x,y)=>{const band=Math.abs(Math.sin((y+1.2)*3.1))<.06;c.setRGB(.92,.93,.95);if(band)c.setRGB(.55,.58,.62);if(y<-2.9)c.setRGB(.3,.32,.36);});
 const dome=new THREE.SphereGeometry(2.4,40,14,0,Math.PI*2,0,Math.PI*.5);xf(dome,{p:[0,1,0],s:[1,.6,1]});paint(dome,(c,x,y)=>c.setRGB(.95,.95,.97).lerp(new THREE.Color(.75,.77,.8),Math.abs(Math.sin(Math.atan2(x,y)*6))<.05?1:0));
 const collar=new THREE.TorusGeometry(2.95,.48,16,56);collar.rotateX(Math.PI/2);collar.translate(0,-.15,0);paint(collar,0xe8641e);
 const stripe=new THREE.CylinderGeometry(2.62,2.62,.5,40,1,true);stripe.translate(0,-2,0);paint(stripe,0xe8641e);
 const ant=new THREE.CylinderGeometry(.05,.07,2.2,6);ant.translate(.9,2.6,.4);paint(ant,0x50545a);
 const panels=[-1,1].map(s=>{const p=new THREE.BoxGeometry(2.2,.06,1.2);xf(p,{p:[s*2.6,1.15,0],r:[0,0,s*.25]});paint(p,0x1a2a4a);return p;});
 const hatch=new THREE.CylinderGeometry(1.1,1.1,.2,32);hatch.translate(0,-3.45,0);paint(hatch,0x26282c);
 const ribs=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const r=new THREE.BoxGeometry(.14,3.6,.22);xf(r,{p:[Math.cos(a)*2.62,-1.5,Math.sin(a)*2.62],r:[0,-a,0]});paint(r,0x8a9098);ribs.push(r);}
 const noz=[];for(let i=0;i<3;i++){const a=i/3*Math.PI*2;const n=new THREE.CylinderGeometry(.28,.38,.6,16,1,true);n.translate(Math.cos(a)*1.7,-3.55,Math.sin(a)*1.7);paint(n,0x3a3e46);noz.push(n);}
 // grab rails and a ladder down to the hatch
 const rails=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.5;const r=new THREE.TorusGeometry(.32,.035,6,12,Math.PI);xf(r,{r:[0,-a+Math.PI/2,Math.PI/2],p:[Math.cos(a)*2.72,-.9,Math.sin(a)*2.72]});paint(r,0xe8c020);rails.push(r);}
 g.add(new THREE.Mesh(merge([body,dome,collar,stripe,ant,...panels,hatch,...ribs,...noz,...rails]),hull));
 const win=S({color:0xffe0a0,emissive:0xffc070,emissiveIntensity:2.2});for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.26;const w=new THREE.Mesh(new THREE.CircleGeometry(.26,14),win);w.position.set(Math.cos(a)*2.63,-1.15,Math.sin(a)*2.63);w.lookAt(Math.cos(a)*5,-1.15,Math.sin(a)*5);g.add(w);}
 const glowM=S({color:0x60f0ff,emissive:0x60f0ff,emissiveIntensity:3});const ring=new THREE.Mesh(new THREE.TorusGeometry(1.15,.06,8,32),glowM);ring.rotation.x=Math.PI/2;ring.position.y=-3.56;g.add(ring);
 const lamps=[];for(let i=0;i<4;i++){const l=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),S({color:0xffa040,emissive:0xff8020,emissiveIntensity:3}));const a=i*Math.PI/2+.4;l.position.set(Math.cos(a)*3.35,-.1,Math.sin(a)*3.35);g.add(l);lamps.push(l);}
 const beacon=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),S({color:0xff3020,emissive:0xff2010,emissiveIntensity:5}));beacon.position.set(.9,3.75,.4);g.add(beacon);
 const bl=new THREE.PointLight(0x9af4ff,14,22,1.6);bl.position.y=-4.5;g.add(bl);
 // dock frame for the sub, under the pod
 const dock=new THREE.Group();const fm=wmat(S({color:0x3a3e46,roughness:.45,metalness:.7}),{caus:.8,key:'dock'});const dg=[];for(const s of[-1,1]){const r=new THREE.BoxGeometry(.3,.3,9);r.translate(s*2.6,0,0);dg.push(r);}
 for(const z of[-4,4]){const r=new THREE.BoxGeometry(5.5,.3,.3);r.translate(0,0,z);dg.push(r);}for(const s of[-1,1])for(const z of[-4,4]){const c=new THREE.CylinderGeometry(.08,.08,6,6);c.translate(s*2.6,3,z);dg.push(c);}
 dock.add(new THREE.Mesh(merge(dg),fm));for(const z of[-4,4]){const gl=new THREE.Mesh(new THREE.SphereGeometry(.12,6,4),glowM);gl.position.set(0,.25,z);dock.add(gl);}
 dock.position.y=-10.2;g.add(dock);g.traverse(o=>{if(o.isMesh&&!o.material.emissiveIntensity)o.castShadow=true;});
 g.userData={lamps,beacon,ring,bl,dock};return g;}

/* ---------- MINNOW: two-seat mini-sub. Front faces +Z. ---------- */
export function buildSub(){const g=new THREE.Group();const hm=hullMat({k:'s'});
 // teardrop hull from a lathe profile, revolved about Z
 const prof=[];for(let i=0;i<=24;i++){const t=i/24;const z=-2.9+t*4.7;const r=Math.pow(Math.sin(Math.PI*Math.min(1,t*.92+.04)),.62)*1.18*(1-.35*sm(.0,.35,1-t)*0)+.04;prof.push(new THREE.Vector2(Math.max(.05,r),z));}
 const body=new THREE.LatheGeometry(prof,40);body.rotateX(Math.PI/2);xf(body,{s:[1.12,1,1]});paint(body,(c,x,y,z)=>{c.setRGB(.93,.94,.96);if(Math.abs(y+.1)<.1)c.setRGB(.92,.42,.1);if(y<-.82)c.setRGB(.32,.34,.38);if(y>.95&&Math.abs(x)<.3)c.setRGB(.8,.82,.86);});
 const parts=[body];
 // thruster pods with open ducts
 for(const s of[-1,1]){const p=new THREE.CylinderGeometry(.36,.42,2.6,24);xf(p,{r:[Math.PI/2,0,0],p:[s*1.55,-.3,-.9]});paint(p,(c,x,y,z)=>c.setRGB(.84,.86,.9).lerp(new THREE.Color(.92,.42,.12),z>.2?1:0));parts.push(p);
  const nose=new THREE.SphereGeometry(.36,20,10,0,Math.PI*2,0,Math.PI/2);xf(nose,{r:[Math.PI/2,0,0],p:[s*1.55,-.3,.4]});paint(nose,0xe8641e);parts.push(nose);
  const duct=new THREE.CylinderGeometry(.52,.48,.7,28,1,true);xf(duct,{r:[Math.PI/2,0,0],p:[s*1.55,-.3,-2.45]});paint(duct,0x3a3e46);parts.push(duct);
  const lip=new THREE.TorusGeometry(.5,.05,8,28);xf(lip,{p:[s*1.55,-.3,-2.1]});paint(lip,0xd8dadf);parts.push(lip);
  const pylon=new THREE.BoxGeometry(.9,.12,.9);xf(pylon,{p:[s*1.05,-.25,-.7]});paint(pylon,0xb8bcc4);parts.push(pylon);}
 // stabilisers (bevelled extrusions)
 const finShape=new THREE.Shape();finShape.moveTo(0,0);finShape.lineTo(1.1,.05);finShape.lineTo(1.3,.75);finShape.lineTo(.55,.7);finShape.closePath();
 const fin=(rot,pos,col)=>{const f=new THREE.ExtrudeGeometry(finShape,{depth:.05,bevelEnabled:true,bevelThickness:.03,bevelSize:.03,bevelSegments:1});f.translate(0,0,-.025);f.rotateY(Math.PI/2);xf(f,{r:rot,p:pos});paint(f,col);parts.push(f);};
 fin([0,0,0],[0,.75,-1.55],0xe8641e);fin([0,0,Math.PI/2],[.35,0,-1.7],0xd8dadf);fin([0,0,-Math.PI/2],[-.35,0,-1.7],0xd8dadf);
 // skids with struts
 for(const s of[-1,1]){const k=new THREE.CapsuleGeometry(.07,3.2,3,8);xf(k,{r:[Math.PI/2,0,0],p:[s*.8,-1.35,0]});paint(k,0x2a2e36);parts.push(k);for(const z of[-.9,.9]){const st=new THREE.CylinderGeometry(.05,.05,.45,6);xf(st,{p:[s*.72,-1.12,z],r:[0,0,s*.25]});paint(st,0x2a2e36);parts.push(st);}}
 // top hatch, rails, antenna, side lights housings
 const hatch=new THREE.CylinderGeometry(.42,.46,.14,24);hatch.translate(0,1.12,-.4);paint(hatch,0xb8bcc4);parts.push(hatch);
 for(const s of[-1,1]){const r=new THREE.TorusGeometry(.6,.03,6,14,Math.PI);xf(r,{r:[0,Math.PI/2,0],p:[s*.55,.98,-.4]});xf(r,{s:[1,.5,1]});paint(r,0xe8c020);parts.push(r);}
 const ant=new THREE.CylinderGeometry(.02,.03,.9,5);ant.translate(.25,1.5,-1.1);paint(ant,0x40444c);parts.push(ant);
 for(const s of[-1,1]){const hh=new THREE.CylinderGeometry(.2,.24,.3,16);xf(hh,{r:[Math.PI/2,0,0],p:[s*1.55,-.3,.72]});paint(hh,0x2a2e36);parts.push(hh);}
 // folded manipulator arm under the nose
 const arm1=new THREE.CylinderGeometry(.07,.07,.9,8);xf(arm1,{r:[Math.PI/2-.3,0,0],p:[.45,-1.0,1.1]});paint(arm1,0x8a9098);parts.push(arm1);const cl1=new THREE.BoxGeometry(.16,.1,.3);xf(cl1,{p:[.45,-1.15,1.55]});paint(cl1,0x40444c);parts.push(cl1);
 const hullMesh=new THREE.Mesh(merge(parts),hm);hullMesh.castShadow=true;g.add(hullMesh);
 // acrylic bubble canopy + dark frame
 const glass=new THREE.Mesh(new THREE.SphereGeometry(1.02,32,20,0,Math.PI*2,0,Math.PI*.55),new THREE.MeshPhysicalMaterial({color:0xbfe8ff,transparent:true,opacity:.22,roughness:.04,metalness:0,envMapIntensity:2.2,side:THREE.DoubleSide,depthWrite:false,clearcoat:1}));
 glass.rotation.x=Math.PI/2;glass.position.set(0,.12,1.3);glass.scale.set(1.08,1,1.1);g.add(glass);
 const frame=new THREE.Mesh(new THREE.TorusGeometry(1.06,.07,10,40),wmat(S({color:0x2a2e36,roughness:.35,metalness:.8}),{caus:.6,key:'subf'}));frame.position.set(0,.12,1.3);frame.scale.set(1.08,1,1);g.add(frame);
 const seat=new THREE.Mesh(new THREE.BoxGeometry(.9,.5,.6),S({color:0x30343a,roughness:.8}));seat.position.set(0,-.15,1.2);g.add(seat);
 const gl=S({color:0x60f0ff,emissive:0x60f0ff,emissiveIntensity:3});const rings=[];const props=[];
 for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.TorusGeometry(.4,.04,6,24),gl);r.position.set(s*1.55,-.3,-2.75);g.add(r);rings.push(r);
  const pr=new THREE.Group();const bm=wmat(S({color:0x30343a,roughness:.4,metalness:.7}),{caus:0,key:'prop'});const bg=[];for(let i=0;i<4;i++){const b=new THREE.BoxGeometry(.08,.42,.03);b.translate(0,.23,0);b.rotateY(.5);b.rotateZ(i*Math.PI/2);bg.push(b);}const hub=new THREE.SphereGeometry(.1,10,6);bg.push(hub);
  pr.add(new THREE.Mesh(merge(bg),bm));pr.position.set(s*1.55,-.3,-2.4);g.add(pr);props.push(pr);}
 const hl=S({color:0xffffff,emissive:0xeaf6ff,emissiveIntensity:4});for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.CircleGeometry(.16,16),hl);l.position.set(s*1.55,-.3,.88);g.add(l);}
 g.userData={rings,glass,props};return g;}

/* first-person cockpit frame (attached to the camera while piloting) */
export function buildCockpit(){const g=new THREE.Group();const fm=S({color:0x22262c,roughness:.5,metalness:.5,fog:false});
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.25,.09,8,48),fm);rim.position.z=-.9;rim.scale.set(1.25,.8,1);g.add(rim);
 for(const a of[-.75,.75,Math.PI-.75,Math.PI+.75]){const s=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,1.2),fm);s.position.set(Math.cos(a)*1.4,Math.sin(a)*.9,-.6);s.lookAt(0,0,-2);g.add(s);}
 const dash=new THREE.Mesh(new THREE.BoxGeometry(1.6,.36,.5),S({color:0x2a2e36,roughness:.6,metalness:.4,fog:false}));dash.position.set(0,-.78,-.7);dash.rotation.x=-.5;g.add(dash);
 const scr=S({color:0x05181c,emissive:0x1a8a98,emissiveIntensity:.5,fog:false});for(const x of[-.42,.42]){const s=new THREE.Mesh(new THREE.PlaneGeometry(.3,.14),scr);s.position.set(x,-.6,-.86);s.rotation.x=-.5;g.add(s);}
 g.visible=false;return g;}

/* ---------- gloved hand: palm, jointed fingers, thumb, cuff seal and a ribbed sleeve ---------- */
function handGeo(side){const parts=[];const glove=new THREE.Color(.16,.17,.19),pad=new THREE.Color(.1,.1,.11),cuffC=new THREE.Color(.91,.39,.12),sleeve=new THREE.Color(.22,.24,.27);
 const palm=new THREE.CapsuleGeometry(.038,.05,4,10);xf(palm,{r:[Math.PI/2,0,0],s:[1.25,.62,1]});paint(palm,glove);parts.push(palm);
 for(let i=0;i<4;i++){const x=-.033+i*.022;const l=[.034,.04,.037,.03][i];const f1=new THREE.CapsuleGeometry(.0105,l,3,6);xf(f1,{r:[Math.PI/2+.25,0,0],p:[x,-.004,-.075-l*.3]});paint(f1,glove);parts.push(f1);
  const f2=new THREE.CapsuleGeometry(.0095,l*.8,3,6);xf(f2,{r:[Math.PI/2+.9,0,0],p:[x,-.02,-.11-l*.5]});paint(f2,pad);parts.push(f2);}
 const th=new THREE.CapsuleGeometry(.012,.04,3,6);xf(th,{r:[Math.PI/2,0,side*.9],p:[side*-.05,-.01,-.035]});paint(th,glove);parts.push(th);
 const cuff=new THREE.TorusGeometry(.05,.014,8,18);xf(cuff,{p:[0,0,.06]});paint(cuff,cuffC);parts.push(cuff);
 const arm=new THREE.CylinderGeometry(.056,.07,.46,16,6);xf(arm,{r:[Math.PI/2,0,0],p:[0,0,.3]});paint(arm,(c,x,y,z)=>{c.copy(sleeve);if(Math.abs(Math.sin(z*70))<.18)c.multiplyScalar(.6);});parts.push(arm);
 return merge(parts);}
export function buildViewmodel(){const g=new THREE.Group();const nt=neoTex();const glove=S({vertexColors:true,roughness:.78,metalness:.05,map:nt});
 const hand=(s)=>{const h=new THREE.Group();h.add(new THREE.Mesh(handGeo(s),glove));return h;};
 // right: scanner
 const R=hand(1);R.position.set(.26,-.24,-.48);g.add(R);const sc=new THREE.Group();
 const sbg=[];const sb=new THREE.BoxGeometry(.07,.075,.2);paint(sb,0xd8dce2);sbg.push(sb);const grip=new THREE.CylinderGeometry(.018,.02,.08,8);xf(grip,{p:[0,-.06,.05],r:[.3,0,0]});paint(grip,0x2a2e36);sbg.push(grip);
 const fin1=new THREE.BoxGeometry(.075,.012,.12);xf(fin1,{p:[0,.044,-.03]});paint(fin1,0xe8641e);sbg.push(fin1);
 sc.add(new THREE.Mesh(merge(sbg),S({vertexColors:true,roughness:.35,metalness:.4})));
 const scr=new THREE.Mesh(new THREE.PlaneGeometry(.052,.048),S({color:0x0a3038,emissive:0x40e8ff,emissiveIntensity:1.6}));scr.position.set(0,.039,.035);scr.rotation.x=-Math.PI/2;sc.add(scr);
 const tip=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.05,12),S({color:0x40e8ff,emissive:0x40e8ff,emissiveIntensity:3}));tip.rotation.x=Math.PI/2;tip.position.z=-.12;sc.add(tip);sc.position.set(0,.06,-.06);R.add(sc);
 const beam=new THREE.Mesh(new THREE.ConeGeometry(.5,6,24,1,true),new THREE.MeshBasicMaterial({color:0x40e8ff,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));beam.rotation.x=-Math.PI/2;beam.position.z=-3.15;beam.visible=false;sc.add(beam);
 // left: knife (appears on swipe) + wrist computer
 const L=hand(-1);L.position.set(-.3,-.28,-.5);g.add(L);const knife=new THREE.Group();
 const bl=new THREE.Shape();bl.moveTo(0,0);bl.lineTo(.26,0);bl.quadraticCurveTo(.3,.01,.27,.03);bl.lineTo(0,.035);bl.closePath();const blade=new THREE.Mesh(new THREE.ExtrudeGeometry(bl,{depth:.004,bevelEnabled:true,bevelThickness:.002,bevelSize:.003,bevelSegments:1}),S({color:0xe8eef4,roughness:.12,metalness:1}));
 blade.rotation.y=Math.PI/2;blade.position.set(0,0,-.07);knife.add(blade);
 const hilt=new THREE.Mesh(new THREE.CylinderGeometry(.016,.018,.1,10),S({color:0x1a1a1a,roughness:.6}));hilt.rotation.x=Math.PI/2;knife.add(hilt);const guard=new THREE.Mesh(new THREE.BoxGeometry(.05,.012,.012),S({color:0xe8641e}));guard.position.z=-.05;knife.add(guard);
 knife.position.set(0,.03,-.06);L.add(knife);
 const wc=new THREE.Mesh(new THREE.BoxGeometry(.07,.02,.06),S({color:0x22262c,roughness:.4,metalness:.5}));wc.position.set(0,.06,.14);L.add(wc);const wcs=new THREE.Mesh(new THREE.PlaneGeometry(.055,.045),S({color:0x041418,emissive:0x50ffb0,emissiveIntensity:1.2}));wcs.rotation.x=-Math.PI/2;wcs.position.set(0,.071,.14);L.add(wcs);
 // hydrojet (two-handed, centre)
 const jet=new THREE.Group();const jb=new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,.42,20),S({color:0xe8641e,roughness:.4,metalness:.3}));jb.rotation.x=Math.PI/2;jet.add(jb);
 const jr=new THREE.Mesh(new THREE.TorusGeometry(.13,.02,6,20),S({color:0x40e8ff,emissive:0x40e8ff,emissiveIntensity:3}));jr.position.z=.2;jet.add(jr);const prop=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,.01),S({color:0x30343a}));prop.position.z=.22;jet.add(prop);
 const hd=new THREE.Mesh(new THREE.TorusGeometry(.09,.015,6,14,Math.PI),S({color:0x2a2e36}));hd.position.set(0,.12,0);hd.rotation.y=Math.PI/2;jet.add(hd);
 jet.position.set(0,-.27,-.62);jet.visible=false;g.add(jet);
 g.userData={R,L,sc,beam,knife,jet,prop,scr,swing:0};return g;}

/* ---------- full diver: wetsuit, helmet with visor and lamp, tank, fins. Faces -Z (camera forward). ---------- */
export function buildDiver(){const g=new THREE.Group();const nt=neoTex();
 const suit=wmat(S({vertexColors:true,map:nt,roughness:.72,metalness:.04}),{caus:.8,key:'suit',rim:.25});
 const metal=wmat(S({vertexColors:true,roughness:.28,metalness:.85}),{caus:.8,key:'suitm'});
 const C=(h)=>new THREE.Color(h);const dark=C(0x22252b),orange=C(0xe8641e),grey=C(0x5a606a);
 const cap=(r,l,col,o)=>{const k=new THREE.CapsuleGeometry(r,l,4,12);xf(k,o||{});paint(k,col);return k;};
 // torso (with chest rig) + hips
 const torso=[cap(.2,.42,(c,x,y,z)=>{c.copy(dark);if(Math.abs(x)>.19&&y>.12)c.copy(orange);if(Math.abs(Math.abs(x)-.12)<.025&&z<0)c.copy(orange);},{s:[1.1,1,.8]})];
 const bcd=new THREE.BoxGeometry(.36,.3,.12);xf(bcd,{p:[0,.02,-.17]});paint(bcd,0x30343a);torso.push(bcd);
 const belt=new THREE.TorusGeometry(.215,.03,6,20);xf(belt,{r:[Math.PI/2,0,0],p:[0,-.25,0],s:[1.1,.85,1]});paint(belt,0x1a1a1a);torso.push(belt);
 const buckle=new THREE.BoxGeometry(.08,.06,.03);xf(buckle,{p:[0,-.25,-.19]});paint(buckle,0xc8ccd2);torso.push(buckle);
 // tank on the back
 const tank=cap(.1,.44,(c,x,y)=>{c.setRGB(.95,.72,.12);if(y>.32)c.setRGB(.8,.8,.82);},{p:[0,.05,.24]});torso.push(tank);
 const valve=new THREE.CylinderGeometry(.03,.03,.1,8);xf(valve,{p:[0,.42,.24]});paint(valve,0xc8ccd2);torso.push(valve);
 const hose=new THREE.TorusGeometry(.18,.016,6,16,Math.PI*1.2);xf(hose,{r:[0,Math.PI/2,0],p:[.12,.42,.07]});paint(hose,0x1a1a1a);torso.push(hose);
 const body=new THREE.Mesh(merge(torso),suit);body.position.y=0;g.add(body);
 // helmet: shell + visor + lamp
 const head=new THREE.Group();head.position.set(0,.5,-.04);g.add(head);
 const shell=new THREE.SphereGeometry(.17,24,16);xf(shell,{s:[1,1.05,1.08]});paint(shell,(c,x,y,z)=>{c.setRGB(.93,.94,.95);if(Math.abs(x)<.03&&y>0)c.copy(orange);if(y<-.1)c.copy(dark);});
 const neck=new THREE.TorusGeometry(.13,.035,8,20);xf(neck,{r:[Math.PI/2,0,0],p:[0,-.15,0]});paint(neck,0x8a9098);
 const lampH=new THREE.CylinderGeometry(.035,.04,.09,12);xf(lampH,{r:[Math.PI/2,0,0],p:[.11,.1,-.12]});paint(lampH,0x2a2e36);
 head.add(new THREE.Mesh(merge([shell,neck,lampH]),metal));
 const visor=new THREE.Mesh(new THREE.SphereGeometry(.172,24,12,-Math.PI*.78,Math.PI*.56,Math.PI*.3,Math.PI*.42),new THREE.MeshPhysicalMaterial({color:0x101820,roughness:.05,metalness:.6,envMapIntensity:2.5,clearcoat:1,emissive:0x0a3a40,emissiveIntensity:.4}));
 visor.scale.set(1.04,1.06,1.12);visor.rotation.y=Math.PI;head.add(visor);
 const lampG=new THREE.Mesh(new THREE.CircleGeometry(.03,12),S({color:0xffffff,emissive:0xeaf6ff,emissiveIntensity:5}));lampG.position.set(.11,.1,-.168);lampG.rotation.y=Math.PI;head.add(lampG);
 // limbs as pivoted groups
 const limb=(len,r,col,parent,px,py,pz)=>{const piv=new THREE.Group();piv.position.set(px,py,pz);parent.add(piv);const m=new THREE.Mesh(cap(r,len,col,{p:[0,-len/2-r*.5,0]}),suit);piv.add(m);return piv;};
 const arms=[],legs=[];
 for(const s of[-1,1]){const sh=limb(.24,.065,(c,x,y)=>{c.copy(dark);if(y>-.08)c.copy(orange);},g,s*.27,.3,0);const el=limb(.22,.058,(c,x,y)=>{c.copy(dark);if(y<-.22)c.setRGB(.12,.12,.13);},sh,0,-.32,0);
  const gl=new THREE.Mesh(cap(.045,.06,0x16171a,{p:[0,-.32,0]}),suit);el.add(gl);arms.push({sh,el});
  const hip=limb(.32,.085,dark,g,s*.11,-.32,0);const kn=limb(.3,.07,(c,x,y)=>{c.copy(dark);if(y>-.06)c.copy(grey);},hip,0,-.42,0);
  // fin: bevelled blade with ribs
  const fs=new THREE.Shape();fs.moveTo(-.07,0);fs.lineTo(.07,0);fs.lineTo(.13,.42);fs.quadraticCurveTo(0,.38,-.13,.42);fs.closePath();const fg=new THREE.ExtrudeGeometry(fs,{depth:.012,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:1});
  fg.rotateX(Math.PI/2);fg.translate(0,0,0);paint(fg,(c,x,y,z)=>{c.setRGB(.1,.1,.12);if(Math.abs(x)>.09)c.setRGB(.91,.39,.12);});const fin=new THREE.Mesh(fg,suit);fin.position.set(0,-.4,-.04);fin.rotation.x=-1.2;kn.add(fin);
  const boot=new THREE.Mesh(cap(.06,.1,0x16171a,{r:[1.2,0,0],p:[0,-.4,-.05]}),suit);kn.add(boot);
  legs.push({hip,kn,fin});}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 g.userData={arms,legs,head,lampG,t:0};
 g.userData.animate=(dt,speed,mode=0)=>{const u=g.userData;u.t+=dt*(2+speed*1.4);const t=u.t;const k=cl(.35+speed*.25,0,1.2);
  legs.forEach((l,i)=>{const ph=i?Math.PI:0;l.hip.rotation.x=Math.sin(t*3+ph)*.38*k-.12;l.kn.rotation.x=.25+Math.sin(t*3+ph-.9)*.32*k;l.fin.rotation.x=-1.25+Math.sin(t*3+ph-1.6)*.35*k;});
  arms.forEach((a,i)=>{const s=i?1:-1;if(mode===1){a.sh.rotation.set(-2.6,0,s*.15);a.el.rotation.set(-.2,0,0);}else{a.sh.rotation.set(.35+Math.sin(t*.8+i)*.08,0,s*(.22+Math.sin(t*.6)*.04));a.el.rotation.set(-.5+Math.sin(t*.7+i*2)*.1,0,0);}});
  u.head.rotation.x=-.25+Math.sin(t*.5)*.04;};
 return g;}

/* ---------- seabed habitat modules: core + up to three add-ons around it ---------- */
export function buildHabitat(){const g=new THREE.Group();const hm=hullMat({k:'h'});const glowM=S({color:0x60f0ff,emissive:0x60f0ff,emissiveIntensity:3});const winM=S({color:0xffe0a0,emissive:0xffc070,emissiveIntensity:2});
 const mods={};
 // core: a squat pressure sphere on legs with a moonpool collar and a big viewport
 {const m=new THREE.Group();const p=[];const s=new THREE.SphereGeometry(2.2,36,20);xf(s,{s:[1,.82,1],p:[0,2.2,0]});paint(s,(c,x,y)=>{c.setRGB(.92,.93,.95);if(Math.abs(y-2.2)<.12)c.setRGB(.91,.39,.12);});p.push(s);
  for(let i=0;i<4;i++){const a=i*Math.PI/2+.78;const l=new THREE.CylinderGeometry(.14,.2,2.2,10);xf(l,{p:[Math.cos(a)*1.9,.7,Math.sin(a)*1.9],r:[Math.sin(a)*.35,0,-Math.cos(a)*.35]});paint(l,0x3a3e46);p.push(l);const f=new THREE.CylinderGeometry(.4,.45,.15,12);f.translate(Math.cos(a)*2.3,-.35,Math.sin(a)*2.3);paint(f,0x3a3e46);p.push(f);}
  const col=new THREE.TorusGeometry(1.2,.22,10,28);col.rotateX(Math.PI/2);col.translate(0,.62,0);paint(col,0xe8641e);p.push(col);
  m.add(new THREE.Mesh(merge(p),hm));const w=new THREE.Mesh(new THREE.CircleGeometry(.75,24),winM);w.position.set(0,2.5,2.0);w.rotation.x=-.25;m.add(w);
  const r=new THREE.Mesh(new THREE.TorusGeometry(1.1,.05,6,28),glowM);r.rotation.x=Math.PI/2;r.position.y=.5;m.add(r);mods.core=m;}
 // grow bed: glass dome greenhouse with glowing plants
 {const m=new THREE.Group();const p=[];const base=new THREE.CylinderGeometry(1.6,1.8,.5,28);base.translate(0,.25,0);paint(base,0xb8bcc4);p.push(base);m.add(new THREE.Mesh(merge(p),hm));
  const d=new THREE.Mesh(new THREE.SphereGeometry(1.55,28,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshPhysicalMaterial({color:0xcff0ff,transparent:true,opacity:.25,roughness:.05,envMapIntensity:2,depthWrite:false,side:THREE.DoubleSide}));d.position.y=.5;m.add(d);
  const pl=S({color:0x60ff90,emissive:0x40ff80,emissiveIntensity:1.6});for(let i=0;i<7;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.18+(i%3)*.06,10,8),pl);const a=i*.9;b.position.set(Math.cos(a)*.8,.75+(i%2)*.2,Math.sin(a)*.8);m.add(b);}
  m.position.set(4.6,0,.6);mods.grow=m;}
 // scanner array: mast with a rotating dish
 {const m=new THREE.Group();const p=[];const mast=new THREE.CylinderGeometry(.18,.3,4.4,12);mast.translate(0,2.2,0);paint(mast,0x8a9098);p.push(mast);const base=new THREE.CylinderGeometry(.9,1,.4,20);base.translate(0,.2,0);paint(base,0xb8bcc4);p.push(base);m.add(new THREE.Mesh(merge(p),hm));
  const dish=new THREE.Group();const dm=new THREE.Mesh(new THREE.SphereGeometry(1.1,24,10,0,Math.PI*2,0,Math.PI*.32),wmat(S({color:0xe8eaee,roughness:.3,metalness:.6,side:THREE.DoubleSide}),{caus:.6,key:'dish'}));dm.rotation.x=-Math.PI/2-.5;dish.add(dm);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),glowM);tip.position.set(0,.4,.6);dish.add(tip);dish.position.y=4.4;m.add(dish);m.position.set(-4.4,0,.8);m.userData.dish=dish;mods.scan=m;}
 // power cell: thermal battery stack with glowing coils
 {const m=new THREE.Group();const p=[];for(let i=0;i<3;i++){const c=new THREE.CylinderGeometry(.42,.42,1.6,16);c.translate((i-1)*.95,.8,0);paint(c,0xd8dadf);p.push(c);const cap=new THREE.CylinderGeometry(.46,.46,.12,16);cap.translate((i-1)*.95,1.64,0);paint(cap,0xe8641e);p.push(cap);}m.add(new THREE.Mesh(merge(p),hm));
  const coilM=S({color:0xffd060,emissive:0xffb030,emissiveIntensity:2.2});for(let i=0;i<3;i++){const c=new THREE.Mesh(new THREE.TorusGeometry(.44,.03,6,20),coilM);c.rotation.x=Math.PI/2;c.position.set((i-1)*.95,.9,0);m.add(c);}m.position.set(.4,0,-4.4);mods.power=m;}
 for(const k in mods){mods[k].visible=false;mods[k].traverse(o=>{if(o.isMesh&&!o.material.transparent)o.castShadow=true;});g.add(mods[k]);}
 const light=new THREE.PointLight(0xffd0a0,0,26,1.5);light.position.y=3;g.add(light);
 g.userData={mods,light};g.visible=false;return g;}

/* the distress rocket for the win cinematic */
export function buildRocket(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.4,3,16),S({color:0xeeeeee,roughness:.3,metalness:.4}));g.add(b);const n=new THREE.Mesh(new THREE.ConeGeometry(.35,1,16),S({color:0xe8641e}));n.position.y=2;g.add(n);
 const f=new THREE.Mesh(new THREE.ConeGeometry(.32,2.4,12,1,true),new THREE.MeshBasicMaterial({color:0xffb050,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,fog:false}));f.rotation.x=Math.PI;f.position.y=-2.6;g.add(f);
 const l=new THREE.PointLight(0xff9040,0,60,1.5);l.position.y=-2;g.add(l);g.userData={flame:f,light:l};g.visible=false;return g;}
