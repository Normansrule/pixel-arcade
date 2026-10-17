// ABYSS DIVER — the lifepod, the MINNOW sub, the diver's hands/tools, the cockpit and the rescue beacon.
import * as THREE from '../vendor/three.module.min.js';
import {merge,paint,xf,sm} from './util.js';
import {wmat} from './water.js';

const S=(o)=>new THREE.MeshStandardMaterial(o);
export function buildPod(){const g=new THREE.Group();
 const hull=wmat(S({vertexColors:true,roughness:.38,metalness:.45}),{caus:.8,key:'pod'});
 const body=new THREE.CylinderGeometry(2.4,2.8,4.4,32,8);body.translate(0,-1.2,0);paint(body,(c,x,y)=>{const band=Math.abs(Math.sin((y+1.2)*3.1))<.06;c.setRGB(.92,.93,.95);if(band)c.setRGB(.55,.58,.62);if(y<-2.9)c.setRGB(.3,.32,.36);});
 const dome=new THREE.SphereGeometry(2.4,32,12,0,Math.PI*2,0,Math.PI*.5);xf(dome,{p:[0,1,0],s:[1,.6,1]});paint(dome,(c,x,y)=>c.setRGB(.95,.95,.97).lerp(new THREE.Color(.75,.77,.8),Math.abs(Math.sin(Math.atan2(x,y)*6))<.05?1:0));
 const collar=new THREE.TorusGeometry(2.95,.48,12,40);collar.rotateX(Math.PI/2);collar.translate(0,-.15,0);paint(collar,0xe8641e);
 const stripe=new THREE.CylinderGeometry(2.62,2.62,.5,32,1,true);stripe.translate(0,-2,0);paint(stripe,0xe8641e);
 const ant=new THREE.CylinderGeometry(.05,.07,2.2,6);ant.translate(.9,2.6,.4);paint(ant,0x50545a);
 const panels=[-1,1].map(s=>{const p=new THREE.BoxGeometry(2.2,.06,1.2);xf(p,{p:[s*2.6,1.15,0],r:[0,0,s*.25]});paint(p,0x1a2a4a);return p;});
 const hatch=new THREE.CylinderGeometry(1.1,1.1,.2,24);hatch.translate(0,-3.45,0);paint(hatch,0x26282c);
 const ribs=[];for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const r=new THREE.BoxGeometry(.14,3.6,.22);xf(r,{p:[Math.cos(a)*2.62,-1.5,Math.sin(a)*2.62],r:[0,-a,.09*0]});paint(r,0x8a9098);ribs.push(r);}
 const noz=[];for(let i=0;i<3;i++){const a=i/3*Math.PI*2;const n=new THREE.CylinderGeometry(.28,.38,.6,12,1,true);n.translate(Math.cos(a)*1.7,-3.55,Math.sin(a)*1.7);paint(n,0x3a3e46);noz.push(n);}
 g.add(new THREE.Mesh(merge([body,dome,collar,stripe,ant,...panels,hatch,...ribs,...noz]),hull));
 const win=S({color:0xffe0a0,emissive:0xffc070,emissiveIntensity:2.2});for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.26;const w=new THREE.Mesh(new THREE.CircleGeometry(.26,14),win);w.position.set(Math.cos(a)*2.63,-1.15,Math.sin(a)*2.63);w.lookAt(Math.cos(a)*5,-1.15,Math.sin(a)*5);g.add(w);}
 const glowM=S({color:0x60f0ff,emissive:0x60f0ff,emissiveIntensity:3});const ring=new THREE.Mesh(new THREE.TorusGeometry(1.15,.06,8,32),glowM);ring.rotation.x=Math.PI/2;ring.position.y=-3.56;g.add(ring);
 const lamps=[];for(let i=0;i<4;i++){const l=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),S({color:0xffa040,emissive:0xff8020,emissiveIntensity:3}));const a=i*Math.PI/2+.4;l.position.set(Math.cos(a)*3.35,-.1,Math.sin(a)*3.35);g.add(l);lamps.push(l);}
 const beacon=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),S({color:0xff3020,emissive:0xff2010,emissiveIntensity:5}));beacon.position.set(.9,3.75,.4);g.add(beacon);
 const bl=new THREE.PointLight(0x9af4ff,14,22,1.6);bl.position.y=-4.5;g.add(bl);
 // dock frame for the sub, under the pod
 const dock=new THREE.Group();const fm=wmat(S({color:0x3a3e46,roughness:.5,metalness:.6}),{caus:.8,key:'dock'});for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,9),fm);r.position.set(s*2.6,0,0);dock.add(r);}
 for(const z of[-4,4]){const r=new THREE.Mesh(new THREE.BoxGeometry(5.5,.3,.3),fm);r.position.z=z;dock.add(r);const gl=new THREE.Mesh(new THREE.SphereGeometry(.12,6,4),glowM);gl.position.set(0,.25,z);dock.add(gl);}
 for(const s of[-1,1])for(const z of[-4,4]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,6),fm);c.position.set(s*2.6,3,z);dock.add(c);}
 dock.position.y=-10.2;g.add(dock);
 g.userData={lamps,beacon,ring,bl,dock};return g;}

export function buildSub(){const g=new THREE.Group();
 const hm=wmat(S({vertexColors:true,roughness:.32,metalness:.4}),{caus:.8,key:'sub'});
 const body=new THREE.SphereGeometry(1,28,18);xf(body,{s:[1.35,1.15,2.5]});paint(body,(c,x,y,z)=>{c.setRGB(.93,.94,.96);if(Math.abs(y+.15)<.12)c.setRGB(.9,.42,.12);if(y<-.85)c.setRGB(.35,.37,.42);});
 const pods=[-1,1].map(s=>{const p=new THREE.CylinderGeometry(.42,.48,3.2,16);xf(p,{r:[Math.PI/2,0,0],p:[s*1.55,-.35,-.6]});paint(p,(c,x,y,z)=>c.setRGB(.82,.84,.88).lerp(new THREE.Color(.9,.42,.12),z<-1.9?1:0));return p;});
 const fins=[];for(const s of[-1,1]){const f=new THREE.BoxGeometry(.08,1.1,.9);xf(f,{p:[s*.5,.95,-2.2],r:[-.4,0,s*.35]});paint(f,0xe8641e);fins.push(f);}const tf=new THREE.BoxGeometry(2.6,.08,.7);tf.translate(0,0,-2.5);paint(tf,0xd8dadf);fins.push(tf);
 const skid=[-1,1].map(s=>{const k=new THREE.BoxGeometry(.12,.12,3.2);k.translate(s*.8,-1.25,0);paint(k,0x3a3e46);return k;});
 g.add(new THREE.Mesh(merge([body,...pods,...fins,...skid]),hm));
 const glass=new THREE.Mesh(new THREE.SphereGeometry(1.06,24,16,0,Math.PI*2,0,Math.PI*.62),S({color:0x9fd8ff,transparent:true,opacity:.32,roughness:.05,metalness:.6,emissive:0x0a2a3a,side:THREE.DoubleSide,depthWrite:false}));glass.rotation.x=Math.PI/2;glass.position.set(0,.18,1.55);glass.scale.set(1.05,1,1.05);g.add(glass);
 const gl=S({color:0x60f0ff,emissive:0x60f0ff,emissiveIntensity:3});const rings=[];for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.TorusGeometry(.4,.06,6,20),gl);r.position.set(s*1.55,-.35,-2.22);g.add(r);rings.push(r);}
 const hl=S({color:0xffffff,emissive:0xeaf6ff,emissiveIntensity:4});for(const s of[-1,1]){const l=new THREE.Mesh(new THREE.CircleGeometry(.16,12),hl);l.position.set(s*1.55,-.35,1.02);g.add(l);}
 g.userData={rings,glass};return g;}

/* first-person cockpit frame (attached to the camera while piloting) */
export function buildCockpit(){const g=new THREE.Group();const fm=S({color:0x22262c,roughness:.5,metalness:.5,fog:false});
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1.25,.09,8,48),fm);rim.position.z=-.9;rim.scale.set(1.25,.8,1);g.add(rim);
 for(const a of[-.75,.75,Math.PI-.75,Math.PI+.75]){const s=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,1.2),fm);s.position.set(Math.cos(a)*1.4,Math.sin(a)*.9,-.6);s.lookAt(0,0,-2);g.add(s);}
 const dash=new THREE.Mesh(new THREE.BoxGeometry(1.6,.36,.5),S({color:0x2a2e36,roughness:.6,metalness:.4,fog:false}));dash.position.set(0,-.78,-.7);dash.rotation.x=-.5;g.add(dash);
 const scr=S({color:0x05181c,emissive:0x1a8a98,emissiveIntensity:.5,fog:false});for(const x of[-.42,.42]){const s=new THREE.Mesh(new THREE.PlaneGeometry(.3,.14),scr);s.position.set(x,-.6,-.86);s.rotation.x=-.5;g.add(s);}
 g.visible=false;return g;}

/* hands + tools viewmodel */
export function buildViewmodel(){const g=new THREE.Group();const glove=S({color:0x2c3036,roughness:.7,metalness:.1});const cuff=S({color:0xe8641e,roughness:.6});
 const hand=(s)=>{const h=new THREE.Group();const palm=new THREE.Mesh(new THREE.BoxGeometry(.09,.06,.12),glove);h.add(palm);const c=new THREE.Mesh(new THREE.CylinderGeometry(.055,.06,.07,10),cuff);c.rotation.x=Math.PI/2;c.position.z=.09;h.add(c);
  const arm=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,.4,10),S({color:0x3a4048,roughness:.6}));arm.rotation.x=Math.PI/2;arm.position.z=.3;h.add(arm);for(let i=0;i<4;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(.018,.022,.06),glove);f.position.set(-.03+i*.02,0,-.08);f.rotation.x=.6;h.add(f);}return h;};
 // right: scanner
 const R=hand(1);R.position.set(.26,-.24,-.48);g.add(R);const sc=new THREE.Group();const sb=new THREE.Mesh(new THREE.BoxGeometry(.07,.08,.22),S({color:0xd8dce2,roughness:.4,metalness:.3}));sc.add(sb);
 const scr=new THREE.Mesh(new THREE.PlaneGeometry(.055,.05),S({color:0x0a3038,emissive:0x40e8ff,emissiveIntensity:1.6}));scr.position.set(0,.041,.02);scr.rotation.x=-Math.PI/2;sc.add(scr);
 const tip=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,.05,10),S({color:0x40e8ff,emissive:0x40e8ff,emissiveIntensity:3}));tip.rotation.x=Math.PI/2;tip.position.z=-.13;sc.add(tip);sc.position.set(0,.06,-.06);R.add(sc);
 const beam=new THREE.Mesh(new THREE.ConeGeometry(.5,6,24,1,true),new THREE.MeshBasicMaterial({color:0x40e8ff,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));beam.rotation.x=-Math.PI/2;beam.position.z=-3.15;beam.visible=false;sc.add(beam);
 // left: knife (appears on swipe)
 const L=hand(-1);L.position.set(-.3,-.28,-.5);g.add(L);const knife=new THREE.Group();const blade=new THREE.Mesh(new THREE.BoxGeometry(.012,.04,.26),S({color:0xe8eef4,roughness:.15,metalness:.95}));blade.position.z=-.17;knife.add(blade);
 const hilt=new THREE.Mesh(new THREE.BoxGeometry(.03,.04,.1),S({color:0x1a1a1a}));knife.add(hilt);knife.position.set(0,.03,-.06);L.add(knife);
 // hydrojet (two-handed, centre)
 const jet=new THREE.Group();const jb=new THREE.Mesh(new THREE.CylinderGeometry(.12,.1,.42,16),S({color:0xe8641e,roughness:.4,metalness:.3}));jb.rotation.x=Math.PI/2;jet.add(jb);
 const jr=new THREE.Mesh(new THREE.TorusGeometry(.13,.02,6,20),S({color:0x40e8ff,emissive:0x40e8ff,emissiveIntensity:3}));jr.position.z=.2;jet.add(jr);const prop=new THREE.Mesh(new THREE.BoxGeometry(.2,.02,.01),S({color:0x30343a}));prop.position.z=.22;jet.add(prop);
 jet.position.set(0,-.27,-.62);jet.visible=false;g.add(jet);
 g.userData={R,L,sc,beam,knife,jet,prop,scr,swing:0};return g;}

/* the distress rocket for the win cinematic */
export function buildRocket(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.4,3,16),S({color:0xeeeeee,roughness:.3,metalness:.4}));g.add(b);const n=new THREE.Mesh(new THREE.ConeGeometry(.35,1,16),S({color:0xe8641e}));n.position.y=2;g.add(n);
 const f=new THREE.Mesh(new THREE.ConeGeometry(.32,2.4,12,1,true),new THREE.MeshBasicMaterial({color:0xffb050,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,fog:false}));f.rotation.x=Math.PI;f.position.y=-2.6;g.add(f);
 const l=new THREE.PointLight(0xff9040,0,60,1.5);l.position.y=-2;g.add(l);g.userData={flame:f,light:l};g.visible=false;return g;}
