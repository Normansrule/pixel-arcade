// HOLLOW MANOR — first-person survival horror. Find the three sigils in a dark manor and escape before dawn while the Mourner
// hunts you by sound and by light. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {makeTextures,labelTex,sigilTex,SIGILS,MONO,SERIF} from './tex.js';
import {House,LY,FH,W,H,ROOMS,NL} from './house.js';
import {Stalker,SKILL} from './stalker.js';
import {Sound} from './sound.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,$} from '../js/kit3d/ui.js';
const V=THREE.Vector3,R=Math.random,cl=(v,a,b)=>v<a?a:v>b?b:v,TAU=Math.PI*2,ID='hollowmanor';
const MV={walk:2.45,run:4.35,crouch:1.2,eye:1.62,ceye:1.08,r:.28};
const mmss=s=>{s=Math.max(0,Math.round(s));return(s/60|0)+':'+String(s%60).padStart(2,'0');};

/* ================= boot ================= */
try{await Promise.race([Promise.all([document.fonts.load('64px Anton'),document.fonts.load('20px "JetBrains Mono"')]),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
const canvas=$('c');const RR=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});RR.setPixelRatio(Math.min(devicePixelRatio,1.5));RR.shadowMap.enabled=true;RR.shadowMap.type=THREE.PCFSoftShadowMap;RR.shadowMap.autoUpdate=false;// redrawn once per frame in render(): not again for the AO normal pass, not while the torch is dark

const scene=new THREE.Scene();scene.background=new THREE.Color(0x010102);scene.fog=new THREE.FogExp2(0x030305,.07);
const cam=new THREE.PerspectiveCamera(75,1,.03,90);cam.rotation.order='YXZ';scene.add(cam);
const T=makeTextures();
const std=o=>new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.85,metalness:0},o)),obj=o=>new THREE.MeshStandardMaterial(Object.assign({roughness:.7,metalness:0},o));
const MOON=new THREE.Color(.42,.55,1);
const doorTex=T.panel.clone();doorTex.repeat.set(1,2.2);doorTex.needsUpdate=true;
const M={panel:std({map:T.panel,roughness:.6}),trim:std({map:T.trim,roughness:.55}),wood:std({map:T.wood,roughness:.6}),dark:std({map:T.dark,roughness:.72}),
 oak:std({map:T.oak,roughness:.42}),marble:std({map:T.marble,roughness:.16}),ktile:std({map:T.ktile,roughness:.3}),wtile:std({map:T.wtile,roughness:.28}),planks:std({map:T.planks,roughness:.85}),stone:std({map:T.stone,roughness:.9}),stonef:std({map:T.stonef,roughness:.8}),
 plaster:std({map:T.plaster}),ceil:std({map:T.ceil}),cloth:std({map:T.cloth,roughness:.95}),drape:std({map:T.cloth,roughness:.95,color:0x8a6a70}),sheet:std({map:T.sheet,roughness:.95}),rug:std({map:T.rug,roughness:.95}),
 metal:std({map:T.metal,roughness:.5,metalness:.6}),iron:std({color:0x2a2a2e,roughness:.45,metalness:.7}),iron2:std({color:0x18181c,roughness:.4,metalness:.8}),brass:std({color:0xb08840,roughness:.3,metalness:.9}),
 books:std({map:T.books,roughness:.8}),china:std({color:0xd8d4c8,roughness:.25}),jars:std({map:T.books,color:0x90a088,roughness:.25}),bottle:std({color:0x1c2a16,roughness:.12,metalness:.3}),
 wax:std({color:0xe8dcc0,emissive:0x2a1808,roughness:.6}),ember:new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,.75,.2)}),black:new THREE.MeshBasicMaterial({color:0x000000}),
 shade:std({color:0xd8c8a0,roughness:.9,side:THREE.DoubleSide,emissive:0x000000}),shadeG:std({color:0x2a6a3a,roughness:.5,side:THREE.DoubleSide}),crystal:std({color:0xffffff,roughness:.05,metalness:.2,emissive:0x202020}),ivory:std({color:0xd8d0c0,roughness:.45}),
 chalk:new THREE.MeshBasicMaterial({color:0x6a665e,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}),
 glass:new THREE.MeshBasicMaterial({map:T.night,color:MOON.clone().multiplyScalar(.75)}),
 shaft:new THREE.MeshBasicMaterial({map:T.shaft,color:MOON.clone().multiplyScalar(.07),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}),
 patch:new THREE.MeshBasicMaterial({map:T.patch,color:MOON.clone().multiplyScalar(.2),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),
 door:obj({map:doorTex,roughness:.55}),gilt:obj({color:0x8a6a2a,roughness:.32,metalness:.85}),panelM:obj({map:T.panel,roughness:.55}),velvet:obj({color:0x3a0a10,roughness:1}),brassO:obj({color:0xb08840,roughness:.3,metalness:.9}),ironO:obj({color:0x2a2a2e,roughness:.45,metalness:.7}),darkO:obj({map:T.dark,roughness:.55})};
for(const k of['wpG','wpR','wpD','wpP','wpN','wpB'])M[k]=std({map:T[k],roughness:.8});
const house=new House();house.build(scene,T,M);

/* ================= lights ================= */
const hemi=new THREE.HemisphereLight(0x4a5a88,0x0c0a08,.3);scene.add(hemi);
const flash=new THREE.SpotLight(0xfff0d8,0,28,.5,.6,1.35);flash.position.set(.2,-.19,-.5);flash.target.position.set(.05,-.45,-7);cam.add(flash,flash.target);flash.shadow.mapSize.set(1024,1024);flash.shadow.bias=-.0006;flash.shadow.normalBias=.02;flash.shadow.camera.near=.15;flash.shadow.camera.far=28;
const POOLN=8,pool=[];for(let i=0;i<POOLN;i++){const l=new THREE.PointLight(0xffa050,0,6,2);scene.add(l);pool.push(l);}
// the flashlight in hand
const torch=new THREE.Group();let lensM;{const mb=obj({color:0x1c1c1e,roughness:.35,metalness:.75});const b=new THREE.Mesh(new THREE.CylinderGeometry(.021,.023,.2,14),mb);b.rotation.x=Math.PI/2;torch.add(b);const hd=new THREE.Mesh(new THREE.CylinderGeometry(.035,.024,.06,16),mb);hd.rotation.x=Math.PI/2;hd.position.z=-.12;torch.add(hd);
 lensM=new THREE.MeshBasicMaterial({color:0xffffff});const ln=new THREE.Mesh(new THREE.CircleGeometry(.031,16),lensM);ln.position.z=-.1505;ln.rotation.y=Math.PI;torch.add(ln);const sk=obj({color:0x6a5048,roughness:.8});
 const gv=obj({color:0x2a211c,roughness:.85});const fist=new THREE.Mesh(new THREE.SphereGeometry(.05,14,10),gv);fist.scale.set(1,.85,1.5);fist.position.set(-.004,-.012,.02);torch.add(fist);const th=new THREE.Mesh(new THREE.CapsuleGeometry(.012,.04,4,8),gv);th.rotation.x=Math.PI/2;th.position.set(.012,.03,-.03);torch.add(th);const sl=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.3,12),obj({color:0x15120f,roughness:.95}));sl.rotation.x=Math.PI/2;sl.position.set(.012,-.03,.2);torch.add(sl);
 torch.position.set(.2,-.2,-.36);cam.add(torch);}

/* ================= particles: flames, bulbs, dust in the beam, beam haze ================= */
function makePoints(list,tex){const n=list.length,g=new THREE.BufferGeometry(),pos=new Float32Array(n*3),col=new Float32Array(n*3),sz=new Float32Array(n);list.forEach((o,i)=>{pos.set([o.x,o.y,o.z],i*3);sz[i]=o.size;});
 g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('col',new THREE.BufferAttribute(col,3));g.setAttribute('size',new THREE.BufferAttribute(sz,1));
 const m=new THREE.ShaderMaterial({uniforms:{map:{value:tex},uScale:{value:500}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'attribute float size;attribute vec3 col;varying vec3 vC;uniform float uScale;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uScale/-mv.z;gl_Position=projectionMatrix*mv;vC=col;}',
  fragmentShader:'uniform sampler2D map;varying vec3 vC;void main(){vec4 t=texture2D(map,vec2(gl_PointCoord.x,1.-gl_PointCoord.y));gl_FragColor=vec4(vC*t.rgb*t.a,1.);}'});
 const p=new THREE.Points(g,m);p.frustumCulled=false;p.renderOrder=3;scene.add(p);p.userData.list=list;return p;}
const flames=makePoints(house.glows.filter(g=>g.flame),T.flame),bulbs=makePoints(house.glows.filter(g=>!g.flame),T.glow);
const dustU={uCam:{value:new V()},uO:{value:new V()},uD:{value:new V(0,0,-1)},uCos:{value:Math.cos(.5)},uK:{value:0},uT:{value:0},uScale:{value:500}};
let dust;function makeDust(n){if(dust){scene.remove(dust);dust.geometry.dispose();}const g=new THREE.BufferGeometry(),p=new Float32Array(n*3),r=new Float32Array(n);for(let i=0;i<n;i++){p[i*3]=R()*12;p[i*3+1]=R()*12;p[i*3+2]=R()*12;r[i]=R();}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aR',new THREE.BufferAttribute(r,1));
 dust=new THREE.Points(g,new THREE.ShaderMaterial({uniforms:dustU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:`uniform vec3 uCam,uO,uD;uniform float uCos,uK,uT,uScale;attribute float aR;varying float vA;
  void main(){vec3 p=position+vec3(sin(uT*.13+aR*30.)*.35,-uT*.02*(.4+aR),cos(uT*.11+aR*20.)*.35);vec3 w=uCam-6.+mod(p-uCam+6.,12.);vec3 v=w-uO;float al=dot(v,uD);float c=al/max(length(v),.001);
   vA=smoothstep(uCos,uCos+.06,c)*smoothstep(.1,.9,al)/(1.+al*al*.035)*uK*(.35+.65*abs(sin(uT*(.6+aR)+aR*40.)));vec4 mv=viewMatrix*vec4(w,1.);gl_PointSize=max(1.,(.004+aR*.006)*uScale/-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.9,.74)*smoothstep(.5,.05,d)*vA,1.);}'}));dust.frustumCulled=false;dust.renderOrder=4;scene.add(dust);}
const beamU={uCam:{value:new V()},uD:{value:new V(0,0,-1)},uCos:{value:Math.cos(.44)},uK:{value:0},uT:{value:0}};const beam=new THREE.Group();beam.position.copy(flash.position);beam.rotation.x=-.06;cam.add(beam);
{const mat=new THREE.ShaderMaterial({uniforms:beamU,side:THREE.BackSide,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform vec3 uCam,uD;uniform float uCos,uK,uT;varying vec3 vW;float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
  float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
  void main(){vec3 d=normalize(vW-uCam);float c=dot(d,uD);float a=smoothstep(uCos,1.,c);a*=a;float n=n3(vW*1.6+vec3(0.,uT*.07,uT*.05))*.65+n3(vW*4.1-uT*.09)*.35;gl_FragColor=vec4(vec3(1.,.9,.74)*a*uK*(.3+n),1.);}`});
 for(const len of[1.2,2.4,3.8,5.6,8]){const g=new THREE.ConeGeometry(Math.tan(.46)*len,len,28,1,true);g.translate(0,-len/2,0);g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,mat);m.frustumCulled=false;m.renderOrder=5;beam.add(m);}}
// the glimpse: a figure at the end of the landing that is gone when your light finds it
const phantom=new THREE.Group();{const b=new THREE.Mesh(new THREE.ConeGeometry(.42,2.3,10,1,true),new THREE.MeshBasicMaterial({color:0x020202,side:THREE.DoubleSide}));b.position.y=1.15;phantom.add(b);
 const f=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),obj({map:T.mask,color:0xbab0a4,emissive:0x0a0806}));f.scale.set(.9,1.3,.85);f.position.y=2.3;phantom.add(f);for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.012,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.4,2)}));e.position.set(s*.05,2.34,.11);phantom.add(e);}phantom.visible=false;scene.add(phantom);}

/* ================= props that move: items, safe door, fuse box, sigil sockets ================= */
const paperTex=labelTex(128,160,(x,w,h)=>{x.fillStyle='#d8c8a4';x.fillRect(0,0,w,h);x.strokeStyle='rgba(40,30,20,.55)';x.lineWidth=1.2;for(let y=24;y<h-14;y+=9){x.beginPath();x.moveTo(12,y);let xx=12;while(xx<w-14){xx+=4+R()*14;x.lineTo(xx,y+(R()-.5)*1.5);x.moveTo(xx+3,y);xx+=3;}x.stroke();}x.fillStyle='rgba(90,60,20,.25)';x.beginPath();x.arc(w*.7,h*.7,18,0,7);x.fill();});
const MI={paper:obj({map:paperTex,roughness:.9,side:THREE.DoubleSide}),brass:M.brassO,bat:obj({color:0x1a1a1a,roughness:.4,metalness:.4}),copper:obj({color:0xc87a3a,roughness:.3,metalness:.9}),glassI:obj({color:0xd0e0e8,roughness:.05,transparent:true,opacity:.55}),glint:new THREE.SpriteMaterial({map:T.glow,color:0xffe0b0,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})};
function itemMesh(kind,i){const g=new THREE.Group();
 if(kind==='key'){const r=new THREE.Mesh(new THREE.TorusGeometry(.022,.006,6,14),MI.brass);r.rotation.x=Math.PI/2;r.position.x=-.05;g.add(r);const s=new THREE.Mesh(new THREE.BoxGeometry(.09,.008,.01),MI.brass);s.position.x=.015;g.add(s);for(const x of[.04,.055]){const t=new THREE.Mesh(new THREE.BoxGeometry(.008,.008,.02),MI.brass);t.position.set(x,0,.012);g.add(t);}g.rotation.y=R()*3;}
 else if(kind==='note'){const p=new THREE.Mesh(new THREE.PlaneGeometry(.18,.23),MI.paper);p.rotation.x=-Math.PI/2;p.rotation.z=(R()-.5)*.8;p.position.y=.003;g.add(p);}
 else if(kind==='battery'){const b=new THREE.Mesh(new THREE.CylinderGeometry(.017,.017,.068,12),MI.bat);b.rotation.z=Math.PI/2;b.position.y=.017;g.add(b);const c=new THREE.Mesh(new THREE.CylinderGeometry(.0175,.0175,.02,12),MI.copper);c.rotation.z=Math.PI/2;c.position.set(.027,.017,0);g.add(c);g.rotation.y=R()*3;}
 else if(kind==='fuse'){const b=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.07,10),MI.glassI);b.rotation.z=Math.PI/2;b.position.y=.015;g.add(b);for(const s of[-1,1]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.018,10),MI.brass);c.rotation.z=Math.PI/2;c.position.set(s*.038,.015,0);g.add(c);}}
 else if(kind==='sigil'){const d=new THREE.Mesh(new THREE.CircleGeometry(.1,28),new THREE.MeshBasicMaterial({map:sigilTex(i),transparent:true,color:new THREE.Color(2.2,2.2,2.2),side:THREE.DoubleSide,depthWrite:false}));d.position.y=.12;g.add(d);
  const r=new THREE.Mesh(new THREE.TorusGeometry(.105,.01,8,28),MI.brass);r.position.y=.12;g.add(r);g.userData.spin=d;g.userData.ring=r;}
 const gl=new THREE.Sprite(MI.glint.clone());gl.scale.setScalar(kind==='sigil'?.7:.16);gl.position.y=kind==='sigil'?.12:.03;if(kind==='sigil')gl.material.color.set(SIGILS[i].hex);g.add(gl);g.userData.glint=gl;scene.add(g);return g;}
const SPOTS={battery:['bat_lib','bat_study','bat_gal','bat_din','bat_kit','bat_cel','bat_hall','bat_nur','bat_guest','bat_srv','bat_att']};
// safe door
const safeDoor=new THREE.Group();{safeDoor.position.set(2.31,0,20.13);const d=new THREE.Mesh(new THREE.BoxGeometry(.7,.82,.05),obj({color:0x1c1c20,roughness:.38,metalness:.8}));d.position.set(-.35,.5,0);safeDoor.add(d);
 const dial=new THREE.Mesh(new THREE.CylinderGeometry(.075,.08,.03,24),M.brassO);dial.rotation.x=Math.PI/2;dial.position.set(-.35,.55,-.035);safeDoor.add(dial);const h=new THREE.Mesh(new THREE.BoxGeometry(.03,.14,.03),M.brassO);h.position.set(-.6,.5,-.035);safeDoor.add(h);scene.add(safeDoor);safeDoor.userData.dial=dial;}
// fuse box lever, fuses, lamp
const fb=house.fusebox;const lever=new THREE.Group();{lever.position.set(20.82,fb.y,9.26);const a=new THREE.Mesh(new THREE.BoxGeometry(.035,.3,.035),M.ironO);a.position.y=.13;lever.add(a);const k=new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),obj({color:0x6a0a08,roughness:.4}));k.position.y=.28;lever.add(k);lever.rotation.x=.7;scene.add(lever);}
const fuseSlots=[0,1].map(i=>{const m=itemMesh('fuse');m.rotation.z=Math.PI/2;m.position.set(20.18+i*.2,fb.y-.05,9.25);m.userData.glint.visible=false;m.visible=false;return m;});
const fbLed=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(3,.2,.1)}));fbLed.position.set(20.15,fb.y+.38,9.24);scene.add(fbLed);

/* ================= systems ================= */
const snd=new Sound();const stalker=new Stalker(scene,T,house);
const G={app:'loading',opt:{diff:1,len:18,sens:1,vol:.8,fov:75},skill:SKILL[1],time:0,clock:0,len:0,player:null,items:[],stats:null,ui:null,power:false,fuses:0,fusesIn:0,keys:new Set(),sigils:new Set(),placed:0,notes:new Set(),code:[1,2,3],
 safeOpen:false,niche:false,clue:'',visited:new Set(),ev:{},scare:null,end:null,result:null,msgT:0,light:0,lightT:30,shake:0,god:false,safeSel:0,safeVal:[0,0,0],house,stalker,snd};
const saveOpt=stored('pxd_hollowmanor_opt',G.opt);
function newPlayer(){const s=house.start;return{pos:new V(s.x,0,s.z),y:LY[s.L],camY:LY[s.L]+MV.eye,L:s.L,yaw:s.yaw,pitch:-.04,vel:new V(),crouch:false,ck:0,sprint:false,stamina:1,exhaust:0,flash:true,battery:1,spare:G.opt.diff===0?2:1,hidden:null,holding:false,breath:1,gaspLock:0,
 wounds:0,invuln:0,stepAcc:0,lit:false,panic:false,flick:1,hy:0,hp:0,
 beamAt(t){if(!this.flash)return 0;const f=new V();cam.getWorldDirection(f);const d=new V(t.x-cam.position.x,(t.y??0)+1.6-cam.position.y,t.z-cam.position.z).normalize();return d.dot(f);}};}
G.player=newPlayer();const P=()=>G.player;
function newStats(){return{spotted:0,wounds:0,notes:0,time:0,doors:0,hides:0};}

/* ================= notes ================= */
const NOTES={
 intro:{t:'A note pinned under a candlestick',b:()=>`<p>Whoever you are — the front door will not open for you. Three sigils bind it: <i>Ash, Bone</i> and <i>Salt</i>. Aldric hid them about the house the winter the Mourner first walked these halls.</p><p>Find them. Keep to the dark. It hears your feet and it sees your light long before you see it.</p><p>If it finds you, hide — a wardrobe, under a bed — and do not breathe. At dawn the house keeps whoever is left.</p><p>— E.</p>`},
 hint:{t:'Notes in the margin of a family history',b:()=>`<p>Father was particular about the gallery. Every Hollow hung <i>upright</i>, every face turned to the living — he would set them right himself each night.</p><p>When they hang as he liked them, the wall gives up what he hid there.</p><p>They are heavy. The whole house hears them turn.</p>`},
 n1:{t:"Cook's ledger, a torn page",b:()=>`<p>…the master has changed the study safe again and told me the <i>first</i> figure, as if I were a child: <b>${G.code[0]}</b>. One for every year of his marriage, he says, laughing.</p><p>He has not laughed since.</p>`},
 n2:{t:'A letter, never sent',b:()=>`<p>My dearest — the <i>second</i> figure is <b>${G.code[1]}</b>. Elspeth's age when the fever took her. He chose it so he would never forget, as though either of us could.</p><p>She sits at the end of the landing now. I hear her at night.</p>`},
 n3:{t:'Scratched into a wine label',b:()=>`<p><i>Third</i>: <b>${G.code[2]}</b>.</p><p>For the knocks on the cellar door the night she came back. Don't count them. Don't answer them.</p>`},
 n4:{t:'Aldric Hollow, his last page',b:()=>`<p>I could not let her go, so I bound her grief into the walls and the salt and the bones of this house, and now it walks without her.</p><p>Take the last sigil. Open the door. Forgive me.</p>`}};
const ITEMDEF=[['intro','note','NOTE','intro'],['hint','note','NOTE','hint'],['n1','note','NOTE','n1'],['n2','note','NOTE','n2'],['n3','note','NOTE','n3'],['n4','note','NOTE','n4'],['libkey','key','LIBRARY KEY','lib'],['studykey','key','STUDY KEY','study'],
 ['fuseA','fuse','FUSE'],['fuseB','fuse','FUSE'],['safe','sigil','SIGIL OF ASH',0],['bone','sigil','SIGIL OF BONE',1],['salt','sigil','SIGIL OF SALT',2]];
const itemMeshes={};
function setupItems(){for(const it of G.items){it.mesh.visible=false;}G.items=[];const add=(spot,kind,name,arg)=>{const s=house.spots[spot];const key=spot+':'+kind;const m=itemMeshes[key]||(itemMeshes[key]=itemMesh(kind,typeof arg==='number'?arg:0));
  m.position.set(s.x,s.y,s.z);m.visible=true;m.userData.glint.visible=true;const it={spot,kind,name,arg,mesh:m,taken:false,hidden:false,L:s.L,pos:new V(s.x,s.y,s.z)};G.items.push(it);return it;};
 for(const[spot,kind,name,arg]of ITEMDEF){const it=add(spot,kind,name,arg);if(spot==='safe'||spot==='bone')it.hidden=true;}
 const n=[7,5,4][G.opt.diff],bs=SPOTS.battery.slice().sort(()=>R()-.5).slice(0,n);for(const s of bs)add(s,'battery','BATTERY');
 for(const it of G.items)it.mesh.visible=!it.hidden;}

/* ================= interaction targets ================= */
const targets=[];
for(const d of house.doors){const cx=d.cells.reduce((a,c)=>a+c[0]+.5,0)/d.cells.length;targets.push({kind:'door',d,L:d.L,pos:new V(cx,LY[d.L]+1.25,d.z+.5),r:d.lock==='exit'?2.4:1.9,wide:1});}
for(const h of house.hides)targets.push({kind:'hide',h,L:h.L,pos:new V(h.type==='bed'?h.x:h.x,h.type==='bed'?LY[h.L]+.5:LY[h.L]+1.2,h.z),r:2,wide:1});
house.portraits.forEach((pt,i)=>targets.push({kind:'portrait',i,L:1,pos:new V(pt.x,LY[1]+2.05,pt.z),r:2.6}));
targets.push({kind:'safe',L:1,pos:new V(1.95,LY[1]+.55,20.15),r:1.9,wide:1});targets.push({kind:'fuse',L:0,pos:new V(20.5,fb.y,9.2),r:1.9,wide:1});
function label(t){const p=P();switch(t.kind){
 case 'item':return t.it.kind==='note'?'READ NOTE':'TAKE '+t.it.name;
 case 'door':{const d=t.d;if(d.lock==='exit')return G.sigils.size>G.placed?'SET THE SIGILS':G.placed>=3?'ESCAPE':'FRONT DOOR';if(d.locked)return(d.lock==='lib'&&G.keys.has('lib')||d.lock==='study'&&G.keys.has('study'))?'UNLOCK':'LOCKED';return d.open?'CLOSE':'OPEN';}
 case 'hide':return t.h.type==='bed'?'HIDE UNDER THE BED':'HIDE IN THE '+(t.h.type==='cupboard'?'CUPBOARD':'WARDROBE');
 case 'portrait':return G.niche?'':'TURN THE PORTRAIT';case 'safe':return G.safeOpen?'':'TRY THE SAFE';
 case 'fuse':return G.power?'':G.fuses>G.fusesIn?'FIT THE FUSES':G.fusesIn>=2?'THROW THE MAIN SWITCH':'FUSE BOX';}return '';}
let cur=null;
function findTarget(){const p=P();if(p.hidden||G.ui)return null;const eye=cam.position,f=new V();cam.getWorldDirection(f);let best=null,bs=-9;const consider=t=>{if(Math.abs(t.pos.y-eye.y)>2.4)return;const to=t.pos.clone().sub(eye),d=to.length();if(d>t.r)return;const dot=to.dot(f)/(d||1);
  if(dot<(t.wide?.72:.9-Math.min(.12,(t.r-d)*.06)))return;const s=dot-d*.05;if(s<=bs)return;if(t.kind!=='door'){const k=Math.max(0,1-.45/Math.max(.5,Math.hypot(to.x,to.z)));if(!house.los(p.L,p.pos.x,p.pos.z,p.pos.x+to.x*k,p.pos.z+to.z*k))return;}if(!label(t))return;bs=s;best=t;};
 for(const t of targets)if(t.L===p.L||Math.abs(t.pos.y-eye.y)<2)consider(t);for(const it of G.items)if(!it.taken&&!it.hidden){it.t=it.t||{kind:'item',it,L:it.L,pos:it.pos,r:2};consider(it.t);}return best;}
function useTarget(t){switch(t.kind){case 'item':take(t.it);break;case 'door':useDoor(t.d);break;case 'hide':hideIn(t.h);break;case 'portrait':turnPortrait(t.i);break;case 'safe':openSafeUI();break;case 'fuse':useFuse();break;}}
function noise(pos,r,L=P().L){stalker.hear(G,pos,L,r);}
function msg(t,s=3.2){$('msg').innerHTML=t;$('msg').style.opacity=1;G.msgT=s;}
function clue(t){G.clue=t;$('obj').textContent=t;}
function take(it){const p=P();it.taken=true;it.mesh.visible=false;const pos=it.pos;
 if(it.kind==='note'){G.notes.add(it.arg);G.stats.notes++;snd.pickup('note');openNote(it.arg);
  if(it.arg==='hint')clue('The gallery portraits must all hang upright.');else if(it.arg==='intro')clue('Find the sigils of Ash, Bone and Salt.');else if(/n[123]/.test(it.arg))clue(`The study safe: ${G.code.map((c,i)=>G.notes.has('n'+(i+1))?c:'?').join(' · ')}`);}
 else if(it.kind==='key'){G.keys.add(it.arg);snd.pickup('key');msg(`<b>${it.name}</b>`);}
 else if(it.kind==='battery'){p.spare++;snd.pickup('bat');msg('A battery. <b>[R]</b> to load it.',2.4);}
 else if(it.kind==='fuse'){G.fuses++;snd.pickup('key');msg(`A ceramic <b>fuse</b> (${G.fuses}/2).`);if(G.fuses===1)clue('There must be a fuse box somewhere below.');}
 else if(it.kind==='sigil'){G.sigils.add(it.arg);snd.sigil();msg(`<b style="color:${SIGILS[it.arg].col}">${SIGILS[it.arg].n}</b> · ${G.sigils.size}/3`,4);G.ev.sigil=(G.ev.sigil||0)+1;
  clue(G.sigils.size>=3?'All three sigils. Get to the front door.':`${3-G.sigils.size} sigil${G.sigils.size===2?'':'s'} left.`);if(G.sigils.size===1)G.after(4,slamEvent);}
 updateInv();}
function openNote(k){const n=NOTES[k];$('noteT').textContent=n.t;$('noteB').innerHTML=n.b();$('note').hidden=false;G.ui='note';}
function closeUI(){if(G.ui==='note')$('note').hidden=true;if(G.ui==='safe')$('safe').hidden=true;if(G.ui==='map')$('mapov').hidden=true;G.ui=null;}
/* ---------- doors ---------- */
function doorPos(d){return{x:d.cells.reduce((a,c)=>a+c[0]+.5,0)/d.cells.length,y:LY[d.L]+1.2,z:d.z+.5};}
function openDoor(d,who){if(d.open||d.locked)return;d.open=true;const c=doorPos(d);d.sign=(d.passZ?who.pos.z<c.z:who.pos.x<c.x)?-1:1;d.fast=who===stalker&&stalker.chasing;snd.door(c,d.fast?'slam':'creak');if(who!==stalker){noise(c,6.5,d.L);G.stats.doors++;}}
G.openDoor=openDoor;
function useDoor(d){const p=P(),c=doorPos(d);if(d.lock==='exit')return useExit(d);
 if(d.locked){const k=d.lock==='lib'?'lib':d.lock==='study'?'study':null;if(k&&G.keys.has(k)){d.locked=false;G.keys.delete(k);snd.locked(c);msg('The key turns.');updateInv();openDoor(d,p);return;}
  snd.locked(c);noise(c,4.5,d.L);msg(d.lock==='lib'?'Locked. The brass plate reads <b>LIBRARY</b>.':d.lock==='study'?'Locked. The brass plate reads <b>STUDY</b>.':'An iron gate on an <b>electric lock</b>. It is dead — no power.');if(d.lock==='power')clue('The servants’ stair gate needs power.');return;}
 if(d.open){const cx=Math.floor(p.pos.x),cz=Math.floor(p.pos.z);if(d.cells.some(([x,z])=>x===cx&&z===cz))return;if(Math.floor(stalker.pos.x)===d.x&&Math.floor(stalker.pos.z)===d.z)return;d.open=false;d.fast=false;snd.door(c,'creak');noise(c,4,d.L);}else openDoor(d,p);}
function useExit(d){const n=G.sigils.size;if(n>G.placed){for(let i=0;i<3;i++)if(G.sigils.has(i)){const s=d.sockets[i];s.material.color.set(SIGILS[i].hex);s.material.emissive.set(SIGILS[i].hex);s.material.emissiveIntensity=2.2;s.material.map=sigilTex(i);s.material.needsUpdate=true;}
  G.placed=n;snd.clunk(doorPos(d));snd.sigil();noise(doorPos(d),8,1);}
 if(G.placed>=3){escape(d);return;}msg(`Three sigil locks bind the door. <b>${G.placed}/3</b> set.`);}
/* ---------- hiding ---------- */
function hideIn(h){const p=P();if(stalker.state==='drag'&&stalker.sawHide===h)return;p.hidden=h;p.hy=0;p.hp=0;p.vel.set(0,0,0);G.stats.hides++;snd.door(h,'creak');noise(h,2.2,h.L);
 if(stalker.chasing&&stalker.seeing&&R()<G.skill.checkHide)stalker.sawHide=h;$('hideov').className=h.type;$('hideov').hidden=false;$('breath').hidden=false;}
function unhide(){const p=P(),h=p.hidden;if(!h)return;p.hidden=null;p.holding=false;p.pos.set(h.ex,0,h.ez);p.L=h.L;p.y=house.groundAt(p.L,p.pos.x,p.pos.z);p.camY=p.y+MV.eye;p.yaw=h.yaw+p.hy;p.pitch=0;$('hideov').hidden=true;$('breath').hidden=true;snd.door(h,'creak');noise(h,3,h.L);}
G.hideById=h=>h;
/* ---------- puzzles ---------- */
function turnPortrait(i){if(G.niche)return;const pt=house.portraits[i];pt.rot=(pt.rot+1)%4;snd.grind(pt.g.position);noise(pt.g.position,13,1);
 if(house.portraits.every(q=>q.rot===0)){G.niche=true;G.after(1.1,()=>{snd.clunk(house.niche.panel.position);snd.grind(house.niche.panel.position);snd.stinger('notice');msg('Something in the wall slides open.');const it=G.items.find(t=>t.spot==='bone');it.hidden=false;it.mesh.visible=true;noise(house.niche.panel.position,10,1);});}}
function openSafeUI(){if(G.safeOpen)return;G.ui='safe';$('safe').hidden=false;$('safe').classList.remove('bad');drawSafe();}
function drawSafe(){const ds=$('safe').querySelectorAll('.dial');ds.forEach((d,i)=>{d.classList.toggle('sel',i===G.safeSel);d.querySelector('b').textContent=G.safeVal[i];});}
function safeKey(k){if(k==='l')G.safeSel=(G.safeSel+2)%3;else if(k==='r')G.safeSel=(G.safeSel+1)%3;else if(k==='u'||k==='d'){G.safeVal[G.safeSel]=(G.safeVal[G.safeSel]+(k==='u'?1:9))%10;snd.safeTick();safeDoor.userData.dial.rotation.y+=.6;}
 else if(k==='ok'){const ok=G.safeVal.every((v,i)=>v===G.code[i]);snd.safeOpen(ok,{x:1.95,y:.5,z:20.1});if(ok){G.safeOpen=true;closeUI();msg('The safe swings open.');const it=G.items.find(t=>t.spot==='safe');it.hidden=false;it.mesh.visible=true;noise({x:1.95,y:.5,z:20},6,1);}
  else{const el=$('safe');el.classList.remove('bad');void el.offsetWidth;el.classList.add('bad');noise({x:1.95,y:.5,z:20},5,1);}}drawSafe();}
function useFuse(){if(G.power)return;if(G.fuses>G.fusesIn){G.fusesIn=G.fuses;snd.clunk(fb);fuseSlots.forEach((m,i)=>m.visible=i<G.fusesIn);msg(G.fusesIn>=2?'Both fuses fitted.':`Fuse fitted. <b>${G.fusesIn}/2</b>`);updateInv();if(G.fusesIn<2)clue('The fuse box needs one more fuse.');return;}
 if(G.fusesIn<2){msg('The fuse box. Two fuse sockets are <b>empty</b>.');clue('The fuse box needs two fuses.');return;}
 G.power=true;lever.userData.go=1;snd.clunk(fb);snd.power();noise(fb,26,0);G.shake=.25;fbLed.material.color.setRGB(.2,3,.4);for(const l of house.lamps)if(l.elec){l.on=true;l.boot=.3+R()*1.6;}
 for(const d of house.doors)if(d.lock==='power'){d.locked=false;d.led.material.color.setRGB(.2,3,.4);}msg('The house shudders awake. Somewhere upstairs a gate unlocks.',4);clue('The servants’ stair gate has power now.');updateInv();}
/* ---------- the creature's callbacks ---------- */
G.timers=[];G.after=(t,f)=>G.timers.push({t,f});
G.onSpotted=fromHide=>{G.stats.spotted++;snd.stinger('spot');snd.growl(stalker.pos);if(!fromHide)msg('<b>It has seen you.</b> Run. Break its line of sight.',2.5);};
G.onNotice=()=>{snd.stinger('notice');snd.breathe(stalker.pos,1.4);};
G.onLost=()=>{snd.stinger('lost');};
G.stalkerStep=st=>{const p=P();snd.stomp({x:st.pos.x,y:st.pos.y,z:st.pos.z},st.chasing,st.pos.y>p.y+2);if(R()<.12&&!st.chasing)snd.breathe(st.pos);const d=Math.hypot(st.pos.x-p.pos.x,st.pos.z-p.pos.z);if(st.pos.y>p.y+2&&d<4){G.shake=Math.max(G.shake,.05);dustFall();}};
G.roamTarget=st=>{const p=P(),S=G.skill,bias=[.12,.3,.5][G.opt.diff];if(R()<bias){const c=near(p.L,p.pos.x,p.pos.z,9);if(c)return c;}const L=R()<.55?st.L:(R()*NL)|0;const rs=roam[L];if(!rs.length)return null;const c=rs[(R()*rs.length)|0];return{L,x:c[0],z:c[1]};};
function near(L,x,z,r){const c=roam[L].filter(q=>Math.hypot(q[0]-x,q[1]-z)<r);if(!c.length)return null;const q=c[(R()*c.length)|0];return{L,x:q[0],z:q[1]};}
const roam=[0,1,2,3].map(L=>{const out=[];for(const k in ROOMS)out.push(...house.cellsOf(L,k));return out;});
G.respawnStalker=st=>{const p=P();let best=null;for(let i=0;i<40;i++){const L=(R()*NL)|0,rs=roam[L];if(!rs.length)continue;const c=rs[(R()*rs.length)|0];const d=Math.hypot(c[0]-p.pos.x,c[1]-p.pos.z)+Math.abs(L-p.L)*8;if(d<14)continue;if(!house.path(L,c[0],c[1],1,15,15)&&L!==1)continue;best={L,x:c[0],z:c[1]};break;}
 if(!best)best={L:p.L===2?0:2,x:p.L===2?20:15,z:p.L===2?18:4};st.reset(best.L,best.x,best.z);st.state='roam';st.cool=6;st.dormantT=99;};
G.caught=(st,fromHide)=>{const p=P();if(G.scare||G.god||p.invuln>0||G.app!=='play')return;if(p.hidden)unhide();closeUI();p.wounds++;G.stats.wounds++;G.scare={t:0,fatal:p.wounds>=G.skill.wounds};st.state='scare';st.path=null;
 snd.shriek();snd.stinger('scare');G.shake=.6;};
function scareUpdate(dt){const s=G.scare,p=P();s.t+=dt;const f=new V(Math.sin(p.yaw)*-1,0,-Math.cos(p.yaw));// it lunges into your face
 const k=Math.min(1,s.t/.18);stalker.pos.set(p.pos.x+f.x*(1.7-k*.7),p.y,p.pos.z+f.z*(1.7-k*.7));stalker.yaw=Math.atan2(-f.x,-f.z);stalker.anim.reach=1.2;stalker.root.visible=true;stalker._animate(dt,G);stalker.head.rotation.z=Math.sin(s.t*40)*.15;
 const hd=new V();stalker.head.getWorldPosition(hd);const look=hd.clone().sub(cam.position);p.yaw+=(Math.atan2(-look.x,-look.z)-p.yaw)*Math.min(1,dt*14);p.pitch+=(Math.atan2(look.y,Math.hypot(look.x,look.z))-p.pitch)*Math.min(1,dt*14);
 $('scareov').style.opacity=s.t<.5?(.9-s.t)*(.6+R()*.4):Math.max(0,.4-(s.t-.5));$('fade').style.opacity=s.t>1.1?Math.min(1,(s.t-1.1)/.5):0;
 if(s.t>1.8){G.scare=null;stalker.anim.reach=0;$('scareov').style.opacity=0;if(s.fatal){endGame('taken');return;}stalker.state='retreat';stalker.waitT=G.skill.cool;stalker.root.visible=false;stalker.alert=0;p.invuln=5;p.stamina=1;
  G.after(.1,()=>{$('fade').style.transition='opacity 1.2s';$('fade').style.opacity=0;setTimeout(()=>$('fade').style.transition='',1300);});msg(G.skill.wounds-p.wounds===1?'You tear free. <b>It will not let go again.</b>':'You tear free and it is gone — for now.',4);}}
/* ---------- events ---------- */
function slamEvent(){const far=house.doors.filter(d=>d.open&&!d.locked&&Math.hypot(doorPos(d).x-P().pos.x,doorPos(d).z-P().pos.z)>7);const d=far[(R()*far.length)|0];if(d){d.open=false;d.fast=true;snd.door(doorPos(d),'slam');}else snd.door({x:15,y:4,z:4},'slam');snd.whisper();}
let dustBurst=0;function dustFall(){dustBurst=1;}
function events(dt){const p=P(),rk=house.roomKey(p.L,p.pos.x,p.pos.z);if(rk&&!G.visited.has(p.L+rk)){G.visited.add(p.L+rk);if(!p.hidden){$('room').textContent=ROOMS[rk].n;$('room').style.opacity=1;G.roomT=3.5;}
  if(rk==='n'&&p.L===2&&!G.ev.music){G.ev.music=1;G.after(1.2,()=>snd.musicBox(house.musicBox));}
  if(rk==='h'&&p.L===2&&!G.ev.glimpse&&stalker.dist>9){G.ev.glimpse=1;phantom.position.set(house.glimpse.x,LY[2],house.glimpse.z);phantom.lookAt(p.pos.x,LY[2],p.pos.z);phantom.visible=true;G.ev.gT=0;}
  if(rk==='c'&&!G.ev.cellar){G.ev.cellar=1;G.after(2,()=>snd.knock({x:25,y:-1,z:19}));}}
 if(G.roomT>0){G.roomT-=dt;if(G.roomT<=0)$('room').style.opacity=0;}
 if(phantom.visible){G.ev.gT+=dt;const b=p.beamAt({x:phantom.position.x,y:LY[2],z:phantom.position.z});if(G.ev.gT>.35&&b>.95||G.ev.gT>3){phantom.visible=false;snd.whisper();snd.stinger('notice');}}
 // the clock strikes; dawn approaches
 const hr=Math.floor(3+(1-G.clock/G.len)*3);if(hr>(G.ev.hour||3)&&hr<6){G.ev.hour=hr;snd.chime(hr);msg(`The clock in the foyer strikes <b>${hr}</b>.`,3);}
 if(G.clock<90&&!G.ev.dawn){G.ev.dawn=1;msg('The windows are paling. <b>Dawn is coming.</b>',4);}
 G.lightT-=dt;if(G.lightT<=0){G.lightT=30+R()*55;G.light=1;G.ev.thunder=1+R()*2;}if(G.ev.thunder>0){G.ev.thunder-=dt;if(G.ev.thunder<=0)snd.knock({x:p.pos.x+20,y:p.pos.y+6,z:p.pos.z})}}
/* ---------- ending ---------- */
function escape(d){if(G.end)return;G.end={t:0,reason:'escape'};snd.stinger('notice');snd.door(doorPos(d),'creak');d.open=true;d.fast=false;}
let lastAward=null;
function endGame(reason){if(G.app!=='play')return;G.app='over';unlock();closeUI();document.body.classList.remove('playing');$('hud').hidden=true;$('hideov').hidden=true;$('nearov').style.opacity=0;$('hurtov').style.opacity=0;snd.ambience(false);snd.mood(0,false,0);
 const S=G.stats,p=P(),won=reason==='escape',mult=[.8,1,1.35][G.opt.diff];const found=G.items.filter(t=>t.taken).length,total=G.items.length;
 let score=won?3000+Math.round(G.clock)*3+found*60-S.spotted*100-S.wounds*250:G.sigils.size*400+found*40;score=Math.max(0,Math.round(score*mult));
 const grade=won?(S.wounds===0&&S.spotted<=1&&found>=total*.75?'S':S.wounds<=1&&S.spotted<=3?'A':S.wounds<G.skill.wounds-1||S.spotted<=6?'B':'C'):G.sigils.size>=2?'D':'F';
 G.result={reason,won,score,grade,found,total};
 $('oeye').textContent=`HOLLOW MANOR · ${G.skill.n} · ${G.opt.len}-MINUTE NIGHT`;$('ograde').textContent=grade;$('ograde').style.color=won?'#ffcf6a':'#c8322a';
 $('ores').textContent=won?'ESCAPED':reason==='dawn'?'DAWN':'TAKEN';$('ores').style.color=won?'#e8f0ff':'#c8322a';
 $('osub').textContent=won?'The door gives. Cold air, grey light, and the long drive down to the road. Behind you the house is silent.':reason==='dawn'?'The sun rises on Hollow Manor and the doors stay shut. The house keeps you.':'Porcelain fingers close around you. The Mourner has one more for the walls.';
 $('ofs').textContent=score.toLocaleString()+' PTS';
 const rows=[['TIME IN THE HOUSE',mmss(S.time)],['SIGILS',`${G.sigils.size} / 3`],['ITEMS FOUND',`${found} / ${total}`],['NOTES READ',`${S.notes} / 6`],['TIMES SPOTTED',S.spotted],['WOUNDS',`${S.wounds} / ${G.skill.wounds}`],['TIMES HIDDEN',S.hides],...(won?[['TIME TO SPARE',mmss(G.clock)]]:[])];
 $('stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');const tok=5+Math.min(55,score/120|0);lastAward={score,won,grade,diff:G.skill.n,len:G.opt.len,found,total,spotted:S.spotted,time:S.time};addRound(tok,won);saveBest(ID,score);
 $('otok').textContent=`+${tok} TOKENS · BEST ${bestScore(ID).toLocaleString()} PTS`;$('over').hidden=false;$('fade').style.opacity=0;attractPose(won?'out':'stairs');}

/* ================= input ================= */
const I=controls(canvas,{canLock:()=>G.app==='play',overlay:$('lockov'),onLock:(on,was)=>{if(!on&&was&&G.app==='play')pause(true);},
 onKey:(e,first)=>{if(G.app!=='play')return;if(['Space','Tab','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();if(!first)return;
  if(G.ui==='safe'){const m={KeyA:'l',ArrowLeft:'l',KeyD:'r',ArrowRight:'r',KeyW:'u',ArrowUp:'u',KeyS:'d',ArrowDown:'d',KeyE:'ok',Enter:'ok'}[e.code];if(m)safeKey(m);if(e.code==='KeyQ'||e.code==='Backspace')closeUI();}
  else if(G.ui==='note'){if(e.code==='KeyE'||e.code==='Enter'||e.code==='KeyQ')closeUI();}else if(G.ui==='map'){if(e.code==='KeyM'||e.code==='Tab'||e.code==='KeyQ')closeUI();}}});
const keys=I.keys,mouse=I.mouse;
function lock(){I.lock();}function unlock(){I.unlock();}
function pause(on){if(on){if(G.app!=='play')return;G.app='paused';$('pause').hidden=false;$('hud').hidden=true;snd.ambience(false);}else{if(G.app!=='paused')return;G.app='play';$('pause').hidden=true;$('hud').hidden=false;snd.ambience(true);lock();}}
let padPrev=[];
function readInput(dt){const p=P();const pad=gamepad();const btn=i=>pad&&pad.buttons[i]&&pad.buttons[i].pressed,edgeB=i=>btn(i)&&!padPrev[i];
 const s=G.opt.sens*.0021;let dx=mouse.dx,dy=mouse.dy;mouse.dx=mouse.dy=0;if(pad){dx+=deadzone(pad.axes[2]||0,.15,true)*dt*900;dy+=deadzone(pad.axes[3]||0,.15,true)*dt*700;}
 const use=I.edge.KeyE||edgeB(0),wheel=mouse.wheel;mouse.wheel=0;
 if(G.ui==='safe'){if(wheel)safeKey(wheel<0?'u':'d');if(edgeB(0))safeKey('ok');if(edgeB(1))closeUI();}
 else if(G.ui==='note'){if(edgeB(0)||edgeB(1))closeUI();}
 else if(G.ui==='map'){if(edgeB(3)||edgeB(1))closeUI();}
 else if(!G.scare&&!G.end){
  if(p.hidden){p.hy=cl(p.hy-dx*s,-.75,.75);p.hp=cl(p.hp-dy*s,-.35,.3);if(use)unhide();}
  else{p.yaw-=dx*s;p.pitch=cl(p.pitch-dy*s,-1.35,1.35);
   if(use){cur=findTarget();if(cur)useTarget(cur);}
   if((I.edge.KeyF||edgeB(2))){if(p.battery>0){p.flash=!p.flash;snd.click();}else{snd.click();msg('The flashlight is dead. <b>[R]</b> a fresh battery.',2);}}
   if(I.edge.KeyR||edgeB(13)){if(p.spare>0&&p.battery<.97){p.spare--;p.battery=1;p.flash=true;snd.battery();noise(p.pos,1.6);msg('Fresh battery.',1.6);}else if(!p.spare)msg('No spare batteries.',1.6);}
   if(I.edge.KeyC||I.edge.ControlLeft||edgeB(1))p.crouch=!p.crouch;}
  if(I.edge.KeyM||I.edge.Tab||edgeB(3)){G.ui='map';$('mapov').hidden=false;drawMap();}}
 if(edgeB(9))pause(true);
 let mx=(keys.KeyD?1:0)-(keys.KeyA?1:0),mz=(keys.KeyW?1:0)-(keys.KeyS?1:0);if(pad){mx+=deadzone(pad.axes[0]||0);mz-=deadzone(pad.axes[1]||0);}
 const run=(keys.ShiftLeft||keys.ShiftRight||btn(4)||btn(10));padPrev=pad?pad.buttons.map(b=>b.pressed):[];I.flush();
 if(G.ui||p.hidden||G.scare||G.end)return{mx:0,mz:0,run:false,hold:p.hidden&&(keys.Space||btn(5)||btn(7))};return{mx,mz,run,hold:false};}

/* ================= player ================= */
function updatePlayer(dt,inp){const p=P(),S=G.skill;p.invuln=Math.max(0,p.invuln-dt);
 // breath while hidden
 if(p.hidden){const want=inp.hold&&p.gaspLock<=0;if(want&&!p.holding)snd.breath(true);if(!want&&p.holding)snd.breath(false);p.holding=want&&p.breath>0;
  if(p.holding){p.breath-=dt/(G.opt.diff===2?5:6.5);if(p.breath<=0){p.breath=0;p.holding=false;p.gaspLock=2.5;snd.gasp();noise(p.hidden,7,p.hidden.L);msg('You gasp for air.',1.6);}}else p.breath=Math.min(1,p.breath+dt/8);p.gaspLock=Math.max(0,p.gaspLock-dt);
  p.panic=stalker.dist<4;return;}
 p.breath=Math.min(1,p.breath+dt/4);
 // movement
 const l=Math.hypot(inp.mx,inp.mz);let mx=inp.mx,mz=inp.mz;if(l>1){mx/=l;mz/=l;}const moving=l>.1;
 if(p.exhaust>0)p.exhaust-=dt;p.sprint=inp.run&&moving&&p.stamina>0&&p.exhaust<=0&&mz>-.2;if(p.sprint){p.crouch=false;p.stamina-=dt/7;if(p.stamina<=0){p.stamina=0;p.exhaust=2.2;snd.pant(1.5);}}else p.stamina=Math.min(1,p.stamina+dt/(moving?11:7));
 const spd=p.sprint?MV.run:p.crouch?MV.crouch:MV.walk,fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw),rx=Math.cos(p.yaw),rz=-Math.sin(p.yaw);
 const tvx=(fx*mz+rx*mx)*spd,tvz=(fz*mz+rz*mx)*spd,k=Math.min(1,dt*(moving?9:12));p.vel.x+=(tvx-p.vel.x)*k;p.vel.z+=(tvz-p.vel.z)*k;
 p.pos.x+=p.vel.x*dt;p.pos.z+=p.vel.z*dt;house.collide(p.pos,MV.r,p.L);p.y=house.groundAt(p.L,p.pos.x,p.pos.z);p.L=house.levelAt(p.L,p.pos.x,p.y,p.pos.z);
 p.ck+=((p.crouch?1:0)-p.ck)*Math.min(1,dt*8);const eye=p.y+MV.eye-(MV.eye-MV.ceye)*p.ck;p.camY+=(eye-p.camY)*Math.min(1,dt*14);
 // footsteps → noise
 const sp=Math.hypot(p.vel.x,p.vel.z);p.stepAcc+=sp*dt;const stride=p.sprint?1.0:p.crouch?.62:.78;if(p.stepAcc>stride&&sp>.4){p.stepAcc=0;const rk=house.roomKey(p.L,p.pos.x,p.pos.z),surf=rk?ROOMS[rk].floor:'oak';snd.step(surf,p.crouch?.35:1,p.sprint);
  noise({x:p.pos.x,y:p.y,z:p.pos.z},p.sprint?11.5:p.crouch?1.3:4.2);if(p.sprint&&R()<.35)snd.pant(.8);}
 p.panic=false;
 // flashlight battery
 if(p.flash){p.battery-=dt/[300,240,185][G.opt.diff];if(p.battery<=0){p.battery=0;p.flash=false;snd.click();msg(p.spare?'The flashlight dies. <b>[R]</b> load a battery.':'The flashlight dies.',2.5);}}
 // lit by a lamp or a window?
 p.lit=false;for(const lm of house.lamps)if(lm.cur>.3&&lm.levels.includes(p.L)&&Math.hypot(lm.x-p.pos.x,lm.z-p.pos.z)<lm.range*.42){p.lit=true;break;}
 if(!p.lit)for(const w of house.windows)if(w.L===p.L&&Math.hypot(w.x-p.pos.x,w.z-p.pos.z)<1.8){p.lit=true;break;}}

/* ================= lamps, doors, props ================= */
const tmpV=new V();let lampN=6;
function updateWorld(dt){const p=P(),t=G.time;
 for(const l of house.lamps){let f=1;if(l.kind==='candle')f=.82+.1*Math.sin(t*9.1+l.ph)+.08*Math.sin(t*23.7+l.ph*2);else if(l.kind==='fire')f=.75+.15*Math.sin(t*5.3+l.ph)+.1*Math.sin(t*13.1+l.ph);else if(l.kind==='chand')f=.96+.04*Math.sin(t*31+l.ph);
  if(l.elec){if(l.boot>0){l.boot-=dt;f*=R()<.5?0:.4+R()*.6;if(l.boot<=0&&R()<.4)snd.buzz(l);}else if(l.broken&&R()<dt*1.4){l.out=.05+R()*.25;if(Math.hypot(l.x-p.pos.x,l.z-p.pos.z)<8)snd.buzz(l);}if(l.out>0){l.out-=dt;f*=.08;}}
  if(stalker.dist<7&&stalker.root.visible&&Math.hypot(l.x-stalker.pos.x,l.z-stalker.pos.z)<6&&R()<dt*6)f*=.2;
  const target=l.on?f:0;l.cur+=(target-l.cur)*Math.min(1,dt*(l.elec?30:8));}
 // assign the nearest lit lamps on your floor to the point-light pool
 const cand=[];for(const l of house.lamps)if(l.cur>.02&&(l.levels.includes(p.L)||G.app!=='play')){const d2=(l.x-cam.position.x)**2+(l.z-cam.position.z)**2+((l.y-cam.position.y)*2)**2;cand.push([l.pow*l.cur/(1+d2*.12),l]);}cand.sort((a,b)=>b[0]-a[0]);
 for(let i=0;i<POOLN;i++){const pl=pool[i],c=i<lampN?cand[i]:null;if(!c){pl.intensity=0;continue;}const l=c[1];pl.position.set(l.x,l.y+(l.kind==='candle'?.38:l.kind==='fire'?.25:0),l.z);pl.color.copy(l.col);pl.intensity=l.pow*l.cur*LAMPK;pl.distance=l.range;}
 for(const P2 of[flames,bulbs]){const a=P2.geometry.attributes.col,list=P2.userData.list;for(let i=0;i<list.length;i++){const g=list[i],l=g.lamp,k=l.cur*(g.flame?.55:1.1);a.setXYZ(i,l.col.r*k,l.col.g*k,l.col.b*k);}a.needsUpdate=true;}
 for(const d of house.doors){const tg=d.open?1:0;if(Math.abs(d.t-tg)>.001)house.setDoor(d,d.t+(tg-d.t)*Math.min(1,dt*(d.fast?7:2.6)));}
 for(const pt of house.portraits){const tgt=-pt.rot*Math.PI/2;let cur2=pt.ang;const d=((tgt-cur2)%TAU+TAU*1.5)%TAU-TAU/2;pt.ang+=cl(d,-dt*2.2,dt*2.2);pt.g.rotation.z=pt.ang;}
 if(G.niche){const n=house.niche;n.t=Math.min(1,n.t+dt*.5);n.panel.position.y=n.y0+n.t*1.15;}
 safeDoor.rotation.y+=((G.safeOpen?-1.9:0)-safeDoor.rotation.y)*Math.min(1,dt*2.5);lever.rotation.x+=((G.power?-.7:.7)-lever.rotation.x)*Math.min(1,dt*6);
 for(const it of G.items)if(!it.taken&&it.mesh.visible){const gl=it.mesh.userData.glint;const d=Math.hypot(it.pos.x-cam.position.x,it.pos.z-cam.position.z);gl.material.opacity=it.kind==='sigil'?.85+.15*Math.sin(t*3):cl(1.4-d/5,0,1)*(.25+.25*Math.sin(t*2.5+it.pos.x));if(it.mesh.userData.spin)it.mesh.rotation.y+=dt*.8;}
 // lightning flickers the windows; moon shafts breathe
 G.light=Math.max(0,G.light-dt*2.2);const lf=G.light>0?(G.light>.7||G.light<.35&&G.light>.2?1:.2):0;M.glass.color.copy(MOON).multiplyScalar(.75+lf*3.5);M.shaft.color.copy(MOON).multiplyScalar((.07+lf*.25)*(.85+.15*Math.sin(t*.3)));M.patch.color.copy(MOON).multiplyScalar(.2+lf*.6);hemi.intensity=HEMI*(G.app==='play'&&p.hidden?5:1)+(p.L>0?lf*.35:0);}
let LAMPK=4.5,HEMI=.3;

/* ================= camera + flashlight ================= */
function updateCamera(dt){const p=P();let x=p.pos.x,y=p.camY,z=p.pos.z,yaw=p.yaw,pitch=p.pitch,roll=0;
 if(p.hidden){const h=p.hidden;x=h.x;z=h.z;y=h.y;yaw=h.yaw+p.hy;pitch=p.hp+(h.type==='bed'?.02:0);const br=p.holding?0:Math.sin(G.time*(p.panic?5:2.2))*.006;y+=br;}
 else{const sp=Math.hypot(p.vel.x,p.vel.z);p.bob=(p.bob||0)+dt*sp*(p.sprint?2.6:2.9);y+=Math.sin(p.bob*2)*.03*Math.min(1,sp/2.5);x+=Math.cos(p.yaw)*Math.sin(p.bob)*.02*Math.min(1,sp/2.5);roll=Math.sin(p.bob)*.006*sp;}
 const s=G.shake*G.shake*.15;G.shake=Math.max(0,G.shake-dt*1.2);cam.position.set(x+(R()-.5)*s,y+(R()-.5)*s,z+(R()-.5)*s);cam.rotation.set(pitch+(R()-.5)*s*.4,yaw+(R()-.5)*s*.4,roll);
 const fov=G.scare?50:p.hidden?(p.hidden.type==='bed'?70:58):G.opt.fov+(p.sprint?4:0);fovFor(fov);snd.listener(cam.position.x,cam.position.y,cam.position.z,yaw);
 // flashlight power, flicker (low battery, the creature close), sway in the hand
 let pw=p.flash?(p.battery<.2?.35+p.battery*3.2:1):0;if(p.flash&&p.battery<.2&&R()<dt*3)p.flick=.1;if(p.flash&&stalker.dist<9&&stalker.root.visible&&R()<dt*(9-stalker.dist)*.6)p.flick=R()*.3;p.flick+=(1-p.flick)*Math.min(1,dt*6);pw*=p.flick;
 if(p.hidden)pw*=.0;flash.intensity=pw*FLASHK;lensM.color.setScalar(.3+pw*2.5);torch.visible=!p.hidden&&!G.scare&&G.app==='play';
 const sway=p.hidden?0:1;torch.position.set(.2+Math.sin(p.bob||0)*.008*sway,-.2+Math.abs(Math.cos(p.bob||0))*.008*sway,-.36);flash.target.position.set(.05+(mouse.dx||0)*.0,-.45,-7);
 beamU.uK.value=pw*BEAMK;dustU.uK.value=pw;}
let FLASHK=24,BEAMK=.05;
function fovFor(h){const a=innerWidth/innerHeight;cam.fov=cl(h/Math.max(1,a/1.78)**.25,40,100);cam.updateProjectionMatrix();}

/* ================= HUD ================= */
function updateInv(){const p=P();const t=[];if(G.keys.has('lib'))t.push('LIBRARY KEY');if(G.keys.has('study'))t.push('STUDY KEY');if(G.fuses>G.fusesIn)t.push(`FUSE ×${G.fuses-G.fusesIn}`);if(G.notes.size)t.push(`NOTES ${G.notes.size}`);$('inv').innerHTML=t.map(s=>`<span>${s}</span>`).join('');
 $('sig').querySelectorAll('span').forEach((s,i)=>{const on=G.sigils.has(i);s.classList.toggle('on',on);s.style.setProperty('--c',SIGILS[i].col);s.style.backgroundImage=on?`url(${sigImg[i]})`:'none';});
 $('wounds').innerHTML=Array.from({length:G.skill.wounds},(_,i)=>`<i class="${i<G.skill.wounds-p.wounds?'':'lost'}"></i>`).join('');}
const sigImg=[0,1,2].map(i=>sigilTex(i).image.toDataURL());
let hudT=0;
function updateHUD(dt){const p=P();hudT-=dt;
 if(G.msgT>0){G.msgT-=dt;if(G.msgT<=0)$('msg').style.opacity=0;}
 cur=findTarget();$('prompt').innerHTML=cur?`<kbd>E</kbd>${label(cur)}`:'';$('dot').className=cur?'on':'';
 const st=stalker,eye=$('eye');const a=st.chasing?1:Math.min(1,st.alert);eye.style.opacity=(st.chasing||a>.08)&&!G.scare?1:0;eye.className=st.chasing?'chase':'';$('eyePupil').setAttribute('r',2+a*6);$('eyeLid').setAttribute('d',`M2 16 Q32 ${16-a*24} 62 16 Q32 ${16+a*24} 2 16Z`);$('eyeT').textContent=st.chasing?'HUNTED':a>.35?'IT SENSES YOU':'';
 if(hudT<=0){hudT=.15;const frac=G.clock/G.len,mins=Math.floor((1-frac)*180),hh=3+Math.floor(mins/60),mm=mins%60;$('clock').textContent=`${hh}:${String(mm).padStart(2,'0')}`;$('clock').className=frac<.15?'low':'';$('dawnBar').style.width=(1-frac)*100+'%';
  if(G.ui==='map')drawMap();const n=Math.ceil(p.battery*5);$('bat').querySelectorAll('.cells i').forEach((c,i)=>c.className=i<n?'':'off');$('bat').className=p.battery<.2?'low':'';$('spare').textContent=p.spare?`+${p.spare} SPARE`:'NO SPARES';$('flashK').style.opacity=p.flash?.5:1;
  $('stam').style.opacity=p.stamina<.98?1:0;$('stam').className=p.exhaust>0?'ex':'';}
 $('stam').firstElementChild.style.width=p.stamina*100+'%';$('breath').querySelector('em').style.width=p.breath*100+'%';$('breath').querySelector('em').style.background=p.gaspLock>0?'#c8322a':p.holding?'#9ac0e0':'#d8ccb8';
 const near=st.root.visible&&st.state!=='retreat'?cl(1-st.dist/13,0,1):0;$('nearov').style.opacity=Math.max(near*.75,st.chasing?.45+.15*Math.sin(G.time*6):0);$('hurtov').style.opacity=p.wounds>=G.skill.wounds-1&&p.wounds>0?.55+.15*Math.sin(G.time*2.2):0;
 if(fxStack&&fxStack.grade){fxStack.grade.uniforms.ca.value=.0012+near*.006;fxStack.grade.uniforms.sat.value=.78-near*.35;}
 snd.mood(cl(.2+(1-G.clock/G.len)*.3+near*.5+(st.chasing?.3:0),0,1),st.chasing,Math.max(near,st.chasing?.6:0,p.hidden&&st.dist<6?.7:0));}
function drawMap(){const c=$('mapc'),x=c.getContext('2d'),p=P(),L=p.L,s=19,ox=(c.width-W*s)/2,oy=(c.height-H*s)/2;x.fillStyle='#0a0908';x.fillRect(0,0,c.width,c.height);$('mapT').textContent=['CELLAR','GROUND FLOOR','UPPER FLOOR','ATTIC'][L];
 for(let z=0;z<H;z++)for(let xx=0;xx<W;xx++){const k=house.roomKey(L,xx+.5,z+.5),ch=house.ch(L,xx,z);if(!k||'#=~'.includes(ch)&&ch!=='~')continue;if(!G.visited.has(L+k)&&ch!=='~')continue;
  x.fillStyle=ch==='~'?'rgba(80,70,60,.2)':ch==='^'?'#4a4238':'DLKPE'.includes(ch)?(house.door(L,xx,z).locked?'#8a2a22':'#8a7a5a'):'#2c2824';x.fillRect(ox+xx*s+1,oy+z*s+1,s-1,s-1);}
 x.font=`10px ${MONO}`;x.fillStyle='rgba(220,200,170,.65)';x.textAlign='center';const seen={};for(let z=0;z<H;z++)for(let xx=0;xx<W;xx++){const ch=house.ch(L,xx,z);if(!ROOMS[ch]||seen[ch]||!G.visited.has(L+ch))continue;const cs=house.cellsOf(L,ch);if(!cs.length)continue;seen[ch]=1;const mx=cs.reduce((a,q)=>a+q[0],0)/cs.length,mz=cs.reduce((a,q)=>a+q[1],0)/cs.length;x.fillText(ROOMS[ch].n,ox+mx*s,oy+mz*s);}
 const px=ox+p.pos.x*s,pz=oy+p.pos.z*s;x.save();x.translate(px,pz);x.rotate(-p.yaw);x.fillStyle='#ffcf6a';x.beginPath();x.moveTo(0,-8);x.lineTo(5,6);x.lineTo(-5,6);x.closePath();x.fill();x.restore();}

/* ================= flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);
 G.skill=SKILL[G.opt.diff];G.app='play';G.len=G.clock=G.opt.len*60;G.time=0;G.timers.length=0;G.stats=newStats();G.player=newPlayer();G.keys=new Set();G.sigils=new Set();G.notes=new Set();G.placed=0;G.fuses=G.fusesIn=0;G.power=false;G.safeOpen=false;G.niche=false;G.visited=new Set();G.ev={};G.scare=null;G.end=null;G.result=null;G.ui=null;G.safeSel=0;G.safeVal=[0,0,0];G.light=0;G.lightT=25+R()*20;
 G.code=[1+(R()*9|0),1+(R()*9|0),1+(R()*9|0)];resetWorld();setupItems();stalker.reset(2,5,6.5);stalker.state='dormant';
 ['menu','keys','over','pause'].forEach(id=>$(id).hidden=true);$('hud').hidden=false;$('hideov').hidden=true;$('breath').hidden=true;$('note').hidden=true;$('safe').hidden=true;$('mapov').hidden=true;document.body.classList.add('playing');$('fade').style.opacity=1;$('fade').style.transition='opacity 2.5s';setTimeout(()=>{$('fade').style.opacity=0;},50);setTimeout(()=>$('fade').style.transition='',2700);
 clue('Find a way out.');updateInv();lock();setTimeout(()=>{if(G.app==='play'&&!I.locked&&!navigator.webdriver)$('lockov').hidden=false;},700);snd.ambience(true);snd.clock=house.clockPos;msg('<b>3:00 AM.</b> The front door has locked behind you.',4);}
function resetWorld(){for(const d of house.doors){d.open=false;d.fast=false;d.locked=d.ch!=='D';house.setDoor(d,0);if(d.sockets)for(const s of d.sockets){s.material.color.set(0x111111);s.material.emissive.set(0);s.material.map=null;s.material.needsUpdate=true;}if(d.led)d.led.material.color.setRGB(3,.2,.1);}
 house.doors.filter(d=>d.ch==='D'&&R()<.35).forEach(d=>{d.open=true;d.sign=R()<.5?1:-1;house.setDoor(d,.8);d.t=1;});
 const rots=[0,1,2,3].map(()=>1+(R()*3|0));if(R()<.5)rots[(R()*4)|0]=0;house.portraits.forEach((pt,i)=>{pt.rot=rots[i];pt.ang=-pt.rot*Math.PI/2;pt.g.rotation.z=pt.ang;});house.niche.t=0;house.niche.panel.position.y=house.niche.y0;
 for(const l of house.lamps){l.on=!l.elec;l.boot=0;l.out=0;}fuseSlots.forEach(m=>m.visible=false);fbLed.material.color.setRGB(3,.2,.1);lever.rotation.x=.7;safeDoor.rotation.y=0;phantom.visible=false;}
function toMenu(){unlock();G.app='menu';['menu','keys'].forEach(id=>$(id).hidden=false);['over','pause'].forEach(id=>$(id).hidden=true);$('hud').hidden=true;document.body.classList.remove('playing');snd.ambience(false);attract();}
let attractMode='stairs';
function attract(){G.app='menu';resetWorld();for(const l of house.lamps)l.on=true;setupItems();attractPose('stairs');updateBest();G.len=G.clock=G.opt.len*60;}
function attractPose(m){attractMode=m;if(m==='stairs'){stalker.reset(1,15.2,10.4);stalker.state='scare';stalker.yaw=-.15;stalker.root.visible=true;}else{stalker.root.visible=false;}}
let menuA=0;
function attractUpdate(dt){menuA+=dt;const a=menuA*.05;const p=P();p.flash=true;p.battery=1;p.hidden=null;
 if(attractMode==='stairs'){cam.position.set(14.6+Math.sin(a)*.5,1.62+Math.sin(menuA*.7)*.02,17-Math.sin(a*.5)*.4);cam.rotation.set(.27+Math.sin(menuA*.31)*.02,-.08+Math.sin(a*1.3)*.05,0);stalker.anim.reach=0;stalker.speed=0;stalker._animate(dt,G);}
 else{cam.position.set(14.6+Math.sin(a)*.5,1.62,17-Math.sin(a*.5)*.4);cam.rotation.set(.27,-.08+Math.sin(a*1.3)*.05,0);}
 fovFor(62);flash.intensity=FLASHK*3;beamU.uK.value=BEAMK;dustU.uK.value=1;torch.visible=false;$('nearov').style.opacity=0;}
function updateBest(){const b=bestScore(ID);$('best').textContent=b?'BEST · '+b.toLocaleString()+' PTS':'';}

/* ================= the frame ================= */
function step(dt){dt=Math.min(dt,.1);G.time+=dt;
 if(G.app==='play'){const p=P();G.stats.time+=dt;for(let i=G.timers.length-1;i>=0;i--){const t=G.timers[i];t.t-=dt;if(t.t<=0){G.timers.splice(i,1);t.f();}}
  const inp=readInput(dt);if(G.scare)scareUpdate(dt);else if(!G.end){updatePlayer(dt,inp);G.clock-=dt;if(G.clock<=0){G.clock=0;endGame('dawn');return;}}
  if(G.app!=='play')return;if(!G.scare&&!G.end){if(stalker._frozen)stalker._animate(dt,G);else stalker.update(dt,G);}events(dt);
  if(G.end){G.end.t+=dt;$('fade').style.background='#dfe6f0';$('fade').style.opacity=Math.min(1,G.end.t/2.2);if(G.end.t>2.6){$('fade').style.background='#000';endGame('escape');return;}}
  updateWorld(dt);if(G.app==='play'){updateCamera(dt);updateHUD(dt);}}
 else{if(G.app==='paused')return;updateWorld(dt);attractUpdate(dt);}
 const lp=new V();flash.getWorldPosition(lp);const fd=new V();flash.target.getWorldPosition(fd);fd.sub(lp).normalize();dustU.uO.value.copy(lp);dustU.uD.value.copy(fd);dustU.uCam.value.copy(cam.position);dustU.uT.value=G.time;beamU.uCam.value.copy(cam.position);beamU.uD.value.copy(fd);beamU.uT.value=G.time;
 if(dustBurst>0)dustBurst-=dt;}

/* ================= rendering ================= */
let gfx=quality(),fxStack=null,fxSize='';
function applyQuality(q){gfx=q;RR.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.75));fxStack=null;fxSize='';lampN=q>=2?7:q===1?5:3;flash.castShadow=q>=1;flash.shadow.mapSize.set(q>=2?1024:512,q>=2?1024:512);if(flash.shadow.map){flash.shadow.map.dispose();flash.shadow.map=null;}
 for(let i=0;i<POOLN;i++)pool[i].visible=i<lampN;makeDust(q>=2?2200:q===1?1400:600);beam.visible=q>=1;scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.needsUpdate!==undefined)o.material.needsUpdate=true;});}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(RR.domElement.width!==Math.floor(w*RR.getPixelRatio())||RR.domElement.height!==Math.floor(h*RR.getPixelRatio()))RR.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();const sc=h*RR.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));flames.material.uniforms.uScale.value=bulbs.material.uniforms.uScale.value=dustU.uScale.value=sc;
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(RR,scene,cam,{exposure:1.15,bloom:.7,bloomThreshold:.55,bloomRadius:.6,saturation:.8,tint:0xf0eef4,vignette:.62,grain:.07,aoStrength:1.1,quality:gfx});fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}RR.shadowMap.needsUpdate=flash.castShadow&&flash.intensity>0;fxStack.render();}

/* ================= menus ================= */
const seg=pickers(G.opt,saveOpt);seg('o-diff','diff');seg('o-len','len');seg('o-sens','sens');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-fov','fov');
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{G.app='menu';toMenu();};
postButton($('post'),ID,()=>{const a=lastAward||{};return[a.score||0,`Game: Hollow Manor\nScore: ${a.score||0}\nGrade: ${a.grade||'-'} · ${a.won?'escaped':'did not escape'}\nItems: ${a.found||0}/${a.total||0} · spotted ${a.spotted||0}×\nNight: ${a.len||0} min · ${a.diff||''}`];});

/* ================= loop ================= */
attract();$('loading').classList.add('done');
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.HOLLOWMANOR={get state(){return G.app;},get score(){return G.result?G.result.score:0;},get result(){return G.result;},get player(){return G.player;},get stalker(){return stalker;},get items(){return G.items;},get stats(){return G.stats;},get clock(){return G.clock;},
 G,house,scene,cam,R:RR,snd,step,render,start,toMenu,pause,endGame,setQuality:applyQuality,get gfx(){return gfx;},
 setClock(s){G.clock=s;},god(v=true){G.god=v;},teleport(x,z,L=P().L,yaw){const p=P();if(p.hidden)unhide();p.pos.set(x,0,z);p.L=L;p.y=house.groundAt(L,x,z);p.camY=p.y+MV.eye;p.vel.set(0,0,0);if(yaw!==undefined)p.yaw=yaw;},look(yaw,pitch=0){P().yaw=yaw;P().pitch=pitch;},
 lookAt(x,y,z){const p=P();const dx=x-p.pos.x,dz=z-p.pos.z;p.yaw=Math.atan2(-dx,-dz);p.pitch=Math.atan2(y-p.camY,Math.hypot(dx,dz));},
 use(){cur=findTarget();if(cur){useTarget(cur);return label(cur)||cur.kind;}return null;},target(){const t=findTarget();return t?label(t):null;},
 take(spot){const it=G.items.find(t=>t.spot===spot&&!t.taken);if(it&&!it.hidden){take(it);if(G.ui==='note')closeUI();return true;}return false;},
 door(i){return house.doors[i];},useDoor(i){useDoor(house.doors[i]);},openAll(){for(const d of house.doors){d.locked=d.lock==='exit';if(d.lock!=='exit')d.open=true;}},
 portrait(i){turnPortrait(i);},solvePortraits(){for(let i=0;i<4;i++)while(house.portraits[i].rot!==0)turnPortrait(i);},safe(code){G.safeVal=(code||G.code).slice();G.ui='safe';safeKey('ok');closeUI();return G.safeOpen;},fuse(){useFuse();},exit(){useExit(house.doors.find(d=>d.lock==='exit'));},
 hide(i){hideIn(house.hides[i]);},unhide,noise(x,z,L,r){stalker.hear(G,{x,y:LY[L],z},L,r);},closeUI,keys,mouse,flashOn(v){P().flash=v;},
 spawnStalker(x,z,L,state='roam'){stalker.reset(L,x,z);stalker.state=state;stalker.dormantT=99;},freeze(v=true){stalker._frozen=v;}};
