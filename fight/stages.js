// TEMPEST FIST — stages: a sunlit dojo, a rain-slick rooftop at night, a packed stadium and the boss's gilded sanctum.
// Everything is procedural: canvas textures, shader skies and window grids, instanced crowds. Each stage keeps its fight floor
// inside the 7 m wall ring the simulation uses.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a,TAU=Math.PI*2;
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const std=o=>new THREE.MeshStandardMaterial({roughness:.7,metalness:.05,...o});
const glow=(c,i=2.5)=>new THREE.MeshStandardMaterial({color:0x080808,emissive:c,emissiveIntensity:i,roughness:.5});
function M(g,m,x=0,y=0,z=0,sh=true,rcv=true){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=sh;o.receiveShadow=rcv;return o;}
export const STAGES=[
 {id:'dojo',name:'KAZEMON DOJO',sub:'Late sun through paper walls. Polished cedar, old drums, older rivalries.'},
 {id:'roof',name:'NEON HEIGHTS',sub:'A rain-slick rooftop forty floors above the night market.'},
 {id:'arena',name:'TITAN DOME',sub:'Main event. Twenty thousand voices and one lit octagon.'},
 {id:'throne',name:'GILDED SANCTUM',sub:'The Monarch receives challengers here. Few walk back out.'},
];

/* ---------- sky dome (gradient + sun + stars + nebula) ---------- */
function sky(o){return new THREE.Mesh(new THREE.SphereGeometry(600,40,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{uTop:{value:new THREE.Color(o.top)},uHor:{value:new THREE.Color(o.hor)},uBot:{value:new THREE.Color(o.bot)},uSun:{value:new V(...(o.sun||[0,.2,-1])).normalize()},uSunC:{value:new THREE.Color(o.sunC||0)},uStars:{value:o.stars||0},uNeb:{value:o.neb||0},uT:{value:0},uDisc:{value:o.disc||0}},
 vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform vec3 uTop,uHor,uBot,uSun,uSunC;uniform float uStars,uNeb,uT,uDisc;varying vec3 vP;
 float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
 float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){vec3 d=normalize(vP);float y=d.y;vec3 c=y>0.?mix(uHor,uTop,pow(smoothstep(0.,.6,y),.75)):mix(uHor,uBot,smoothstep(0.,-.3,y));
  float s=max(0.,dot(d,uSun));if(uDisc>0.){c=mix(c,uSunC*1.4,smoothstep(.9975,.9985,s));c+=uSunC*pow(s,60.)*.6;}else c+=uSunC*(pow(s,500.)*6.+pow(s,20.)*.45+pow(s,3.)*.12);
  if(uStars>0.){vec3 q=floor(d*380.);float st=step(.9968,h(q))*smoothstep(-.02,.25,y);c+=vec3(st)*uStars*(.55+.45*sin(uT*2.+h(q)*40.));}
  if(uNeb>0.){float n=n3(d*3.)*.55+n3(d*7.)*.3+n3(d*15.)*.15;c+=mix(vec3(.35,.05,.12),vec3(.4,.15,.02),n)*pow(n,2.)*uNeb*smoothstep(-.1,.4,y);}
  gl_FragColor=vec4(c,1.);}`}));}
function makeEnv(R,top,hor,bot,lights=[]){const s=new THREE.Scene();s.add(sky({top,hor,bot}));for(const[c,x,y,z,w,h]of lights){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);s.add(m);}
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.03);pm.dispose();return rt.texture;}
// additive light-shaft / glow card
function shaftMat(c,a=.25){const t=ctex(64,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.25,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);
 const g2=x.createLinearGradient(0,0,w,0);g2.addColorStop(0,'rgba(0,0,0,1)');g2.addColorStop(.5,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,1)');x.globalCompositeOperation='destination-out';x.fillStyle=g2;x.fillRect(0,0,w,h);},{clamp:true});
 return new THREE.MeshBasicMaterial({map:t,color:c,transparent:true,opacity:a,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});}
function radial(c,a=1){const t=ctex(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true});
 return new THREE.MeshBasicMaterial({map:t,color:c,transparent:true,opacity:a,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});}

export function buildStage(scene,R,idx,q){const grp=new THREE.Group();scene.add(grp);const out={grp,upd:[],amb:null,lamps:[]};const add=o=>{grp.add(o);return o;};
 [dojo,roof,arena,throne][idx](R,grp,out,add,q);
 out.update=(t,dt,cam,hype)=>{for(const f of out.upd)f(t,dt,cam,hype);};
 out.dispose=()=>{scene.remove(grp);grp.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(m.map)m.map.dispose();m.dispose();}}});if(out.env)out.env.dispose();};
 return out;}

/* ================= DOJO ================= */
function dojo(R,grp,out,add,q){
 out.env=makeEnv(R,0x8aa4c8,0xffd8a8,0x6a4a30,[[0xffe0b0,-30,20,-30,40,20],[0xffc890,30,10,20,30,15]]);out.fog={c:0x3a2618,near:30,far:90};out.bg=0x2a1a10;
 out.light={hemi:[0xffe6c8,0x5a3a22,.9],key:[0xffd9a8,2.7,[-6,12,5]],rim:[0x9ac8ff,1.2,[8,6,-8]],rim2:[0xffa860,1.4,[6,4,8]]};out.post={exposure:.95,bloom:.28,bloomThreshold:.9,saturation:1.08,vignette:.4,tint:0xfff6ec};
 const wood=ctex(512,512,(x,w,h)=>{for(let i=0;i<8;i++){const c=150+rnd(40)|0;x.fillStyle=`rgb(${c},${c*.66|0},${c*.4|0})`;x.fillRect(0,i*64,w,64);for(let k=0;k<90;k++){x.strokeStyle=`rgba(60,30,10,${rnd(.18)})`;x.lineWidth=1+rnd(1.5);x.beginPath();const yy=i*64+rnd(64);x.moveTo(0,yy);x.bezierCurveTo(w*.3,yy+rnd(6)-3,w*.6,yy+rnd(6)-3,w,yy+rnd(4)-2);x.stroke();}
  x.fillStyle='rgba(30,14,4,.7)';x.fillRect(0,i*64,w,2);const off=rnd(w);x.fillRect(off,i*64,2,64);}});wood.repeat.set(5,5);
 const floor=add(M(new THREE.CircleGeometry(16,64).rotateX(-Math.PI/2),std({map:wood,roughness:.32,metalness:.05,envMapIntensity:.7}),0,0,0,false));
 // painted emblem: crescent + ring, in faded vermilion
 const emb=ctex(512,512,(x,w,h)=>{x.translate(256,256);x.strokeStyle='rgba(190,40,30,.85)';x.lineWidth=18;x.beginPath();x.arc(0,0,220,0,TAU);x.stroke();x.lineWidth=6;x.beginPath();x.arc(0,0,190,0,TAU);x.stroke();
  x.fillStyle='rgba(190,40,30,.8)';x.beginPath();x.arc(0,0,120,.4,TAU-.4);x.arc(40,0,95,TAU-.6,.6,true);x.fill();for(let i=0;i<8;i++){x.rotate(TAU/8);x.fillRect(150,-6,30,12);}},{clamp:true});
 add(M(new THREE.CircleGeometry(4.6,64).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:emb,transparent:true,roughness:.4,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),0,.005,0,false));
 // octagonal hall: dark cedar pillars, backlit shoji panels, beams
 const shoji=ctex(256,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#fff2d8');g.addColorStop(1,'#ffd8a0');x.fillStyle=g;x.fillRect(0,0,w,h);for(let i=0;i<600;i++){x.fillStyle=`rgba(200,150,90,${rnd(.08)})`;x.fillRect(rnd(w),rnd(h),2,2);}
  x.fillStyle='#3a2414';for(let i=0;i<=4;i++)x.fillRect(i*64-3,0,6,h);for(let j=0;j<=6;j++)x.fillRect(0,j*h/6-3,w,6);});
 const shM=new THREE.MeshStandardMaterial({map:shoji,emissiveMap:shoji,emissive:0xffc890,emissiveIntensity:.55,roughness:.9});
 const darkW=std({color:0x3a2416,roughness:.55}),beamM=std({color:0x2a1a10,roughness:.6});
 const RW=9.2,N=8;for(let i=0;i<N;i++){const a=i/N*TAU,a2=(i+.5)/N*TAU,seg=2*RW*Math.tan(Math.PI/N);
  const px=Math.sin(a)*RW/Math.cos(Math.PI/N),pz=Math.cos(a)*RW/Math.cos(Math.PI/N);add(M(new THREE.BoxGeometry(.5,6.5,.5),darkW,px,3.25,pz));
  const cx=Math.sin(a2)*RW,cz=Math.cos(a2)*RW;const pan=add(M(new THREE.PlaneGeometry(seg-.5,4.2),shM,cx,2.6,cz,false,false));pan.lookAt(0,2.6,0);
  const sill=add(M(new THREE.BoxGeometry(seg,.5,.3),darkW,cx,.25,cz));sill.lookAt(0,.25,0);const top=add(M(new THREE.BoxGeometry(seg,.35,.35),beamM,cx*1.01,4.85,cz*1.01));top.lookAt(0,4.85,0);
  const wall=add(M(new THREE.BoxGeometry(seg,1.6,.25),std({color:0xe8dcc4,roughness:.9}),cx*1.02,5.8,cz*1.02,false));wall.lookAt(0,5.8,0);}
 add(M(new THREE.CylinderGeometry(RW*1.12,RW*1.12,.4,8,1),beamM,0,6.8,0,false)).rotation.y=Math.PI/8;
 for(let i=-2;i<=2;i++){add(M(new THREE.BoxGeometry(.32,.4,RW*2),beamM,i*3.4,6.4,0,false));}
 // hanging lanterns + drums + weapon rack + scroll banners
 const lanM=new THREE.MeshStandardMaterial({color:0xffb060,emissive:0xff8a30,emissiveIntensity:1.6,roughness:.8});
 for(let i=0;i<6;i++){const a=i/6*TAU+.3,r=6.6;const l=add(M(new THREE.SphereGeometry(.32,16,12).scale(1,1.3,1),lanM,Math.sin(a)*r,4.6,Math.cos(a)*r,false,false));add(M(new THREE.CylinderGeometry(.01,.01,1.6,4),beamM,l.position.x,5.7,l.position.z,false));
  add(M(new THREE.CylinderGeometry(.18,.18,.08,12),beamM,l.position.x,5.05,l.position.z,false));out.lamps.push(l);}
 const drumM=std({color:0x7a2a1a,roughness:.5}),skinM=std({color:0xe8d8b8,roughness:.8});
 for(const[a,r]of[[1.2,8.1],[1.55,8.1],[4.1,8.0]]){const g=new THREE.Group();g.position.set(Math.sin(a)*r,.7,Math.cos(a)*r);g.add(M(new THREE.CylinderGeometry(.62,.62,1.0,24),drumM));g.add(M(new THREE.CylinderGeometry(.6,.6,.03,24),skinM,0,.52,0));g.add(M(new THREE.CylinderGeometry(.6,.6,.03,24),skinM,0,-.52,0));
  g.add(M(new THREE.BoxGeometry(.9,.18,.9),darkW,0,-.6,0));g.rotation.z=Math.PI/2;g.lookAt(0,.7,0);add(g);}
 const scroll=ctex(128,512,(x,w,h)=>{x.fillStyle='#efe6d0';x.fillRect(0,0,w,h);x.fillStyle='#16110c';for(let i=0;i<4;i++){const y=60+i*110;x.save();x.translate(64,y);for(let k=0;k<5;k++){x.lineWidth=6+rnd(8);x.strokeStyle='#16110c';x.beginPath();x.moveTo(rnd(60)-30,rnd(60)-30);x.quadraticCurveTo(rnd(80)-40,rnd(80)-40,rnd(60)-30,rnd(60)-30);x.stroke();}x.restore();}
  x.fillStyle='#b8261a';x.fillRect(40,460,48,30);},{clamp:true});
 for(const a of[2.75,5.5]){const s=add(M(new THREE.PlaneGeometry(1,3.6),std({map:scroll,roughness:.9,side:THREE.DoubleSide}),Math.sin(a)*8.9,3.3,Math.cos(a)*8.9,false));s.lookAt(0,3.3,0);}
 // late-sun light shafts through the shoji
 const sm=shaftMat(0xffc888,.07);for(let i=0;i<5;i++){const s=add(new THREE.Mesh(new THREE.PlaneGeometry(1.6,12),sm));s.position.set(-5+i*1.2,4,-3+i*.6);s.rotation.set(0,.5,.62);s.renderOrder=2;}
 out.amb={n:14,r:7,y0:.3,y1:5,v:[.05,.02,0],col:[new THREE.Color(1.2,.9,.6)],size:.035,life:6};
 out.upd.push((t)=>{for(const l of out.lamps)l.rotation.z=Math.sin(t*.8+l.position.x)*.05;});}

/* ================= ROOFTOP ================= */
function cityMat(seed,hor){return new THREE.ShaderMaterial({fog:false,uniforms:{uHor:{value:new THREE.Color(hor)},uT:{value:0}},
 vertexShader:'varying vec3 vW,vN;void main(){vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix*instanceMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',
 fragmentShader:`uniform vec3 uHor;uniform float uT;varying vec3 vW,vN;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
 void main(){float u=abs(vN.x)>.5?vW.z:vW.x;vec2 cell=vec2(floor(u/2.2),floor(vW.y/3.));vec2 f=vec2(fract(u/2.2),fract(vW.y/3.));float win=step(.22,f.x)*step(f.x,.8)*step(.25,f.y)*step(f.y,.75);
  float on=step(.58,h(cell+floor(vW.xz/40.)*7.+${seed}.));vec3 wc=mix(vec3(1.,.72,.38),vec3(.5,.8,1.2),step(.7,h(cell*1.3)))*(.6+.6*h(cell*3.1));
  vec3 c=vec3(.025,.03,.05)+wc*win*on*1.3;if(vN.y>.5)c=vec3(.02,.02,.035);float d=length(vW.xz);c=mix(c,uHor,smoothstep(60.,260.,d)*.85);
  gl_FragColor=vec4(c,1.);}`});}
function roof(R,grp,out,add,q){
 out.env=makeEnv(R,0x0a0c1e,0x3a2a5a,0x05050a,[[0xff3aa0,-30,8,-20,30,6],[0x3ad8ff,30,6,10,30,6],[0xc8d8ff,0,40,-40,20,20]]);out.fog={c:0x140e26,near:20,far:160};out.bg=0x0a0a18;
 out.light={hemi:[0x8a9ad8,0x1a1022,.55],key:[0xaac0ff,2.0,[5,14,-6]],rim:[0xff3aa0,3.0,[-9,4,-6]],rim2:[0x3ad8ff,3.0,[9,3,6]]};out.post={exposure:1,bloom:.5,bloomThreshold:.8,saturation:1.2,vignette:.42,tint:0xeef0ff};
 const S=sky({top:0x05061a,hor:0x3a2050,bot:0x050508,sun:[.3,.35,-.9],sunC:0xd8e0ff,stars:1.1,disc:1});out.sky=S;add(S);
 // concrete roof, damp: low roughness patches read as puddles
 const conc=ctex(512,512,(x,w,h)=>{x.fillStyle='#3a3c44';x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){x.fillStyle=`rgba(${rnd()<.5?'0,0,0':'255,255,255'},${rnd(.06)})`;x.fillRect(rnd(w),rnd(h),2,2);}x.strokeStyle='rgba(0,0,0,.45)';x.lineWidth=3;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(i*128,0);x.lineTo(i*128,h);x.stroke();x.beginPath();x.moveTo(0,i*128);x.lineTo(w,i*128);x.stroke();}});conc.repeat.set(4,4);
 const rough=ctex(256,256,(x,w,h)=>{x.fillStyle='#b0b0b0';x.fillRect(0,0,w,h);for(let i=0;i<26;i++){const g=x.createRadialGradient(0,0,0,0,0,20+rnd(40));const px=rnd(w),py=rnd(h);g.addColorStop(0,'#101010');g.addColorStop(1,'rgba(16,16,16,0)');x.save();x.translate(px,py);x.scale(1+rnd(1.5),1);x.fillStyle=g;x.fillRect(-90,-90,180,180);x.restore();}},{srgb:false});rough.repeat.set(3,3);
 add(M(new THREE.BoxGeometry(22,.4,22),std({map:conc,roughnessMap:rough,roughness:1,metalness:.15,envMapIntensity:1.4}),0,-.2,0,false));
 // pad marking: ring + cross, worn yellow
 const mk=ctex(512,512,(x,w,h)=>{x.translate(256,256);x.strokeStyle='rgba(240,200,40,.8)';x.lineWidth=14;x.beginPath();x.arc(0,0,230,0,TAU);x.stroke();x.setLineDash([30,22]);x.lineWidth=6;x.beginPath();x.arc(0,0,200,0,TAU);x.stroke();x.setLineDash([]);
  x.fillStyle='rgba(240,240,240,.75)';x.fillRect(-12,-110,24,220);x.fillRect(-110,-12,220,24);for(let i=0;i<300;i++){x.clearRect(rnd(512)-256,rnd(512)-256,rnd(6),rnd(6));}},{clamp:true});
 add(M(new THREE.CircleGeometry(5,64).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:mk,transparent:true,roughness:.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),0,.005,0,false));
 // parapet + chain-link fence around the fight ring
 const fence=ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.strokeStyle='rgba(190,200,215,1)';x.lineWidth=3;for(let i=-4;i<8;i++){x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32+128,128);x.stroke();x.beginPath();x.moveTo(i*32+128,0);x.lineTo(i*32,128);x.stroke();}});fence.repeat.set(24,2);
 add(M(new THREE.CylinderGeometry(7.75,7.75,2.4,48,1,true),new THREE.MeshStandardMaterial({map:fence,transparent:true,alphaTest:.4,side:THREE.DoubleSide,metalness:.7,roughness:.4}),0,1.2,0,false,false));
 const postM=std({color:0x5a5e68,metalness:.7,roughness:.35});for(let i=0;i<16;i++){const a=i/16*TAU;add(M(new THREE.CylinderGeometry(.05,.05,2.5,8),postM,Math.sin(a)*7.75,1.25,Math.cos(a)*7.75));}
 add(M(new THREE.TorusGeometry(7.75,.04,6,64).rotateX(Math.PI/2),postM,0,2.42,0,false));
 add(M(new THREE.CylinderGeometry(11,11,.9,48,1,true),std({color:0x2a2c34,side:THREE.DoubleSide}),0,.45,0,false));
 // props: AC units, water tower, antenna with beacon
 const acM=std({color:0x8a8e98,metalness:.5,roughness:.45}),dk=std({color:0x22242a,metalness:.4,roughness:.5});
 for(const[a,r]of[[.8,9.4],[1.2,9.6],[3.6,9.4],[5.2,9.5]]){const g=new THREE.Group();g.position.set(Math.sin(a)*r,0,Math.cos(a)*r);g.add(M(new THREE.BoxGeometry(1.6,1.2,1.2),acM,0,.6,0));g.add(M(new THREE.CylinderGeometry(.45,.45,.06,20),dk,0,1.23,0));add(g);}
 const wt=new THREE.Group();wt.position.set(-8.5,0,-9.5);wt.add(M(new THREE.CylinderGeometry(1.6,1.6,2.6,20),std({color:0x6a4a34,roughness:.8}),0,5.2,0));wt.add(M(new THREE.ConeGeometry(1.75,1,20),dk,0,7,0));for(const[x,z]of[[1,1],[-1,1],[1,-1],[-1,-1]])wt.add(M(new THREE.CylinderGeometry(.07,.07,4,6),dk,x*1.1,2,z*1.1));add(wt);
 const ant=add(M(new THREE.CylinderGeometry(.05,.1,9,6),dk,9,4.5,-7));const beacon=add(M(new THREE.SphereGeometry(.14,10,8),glow(0xff2020,4),9,9.1,-7,false));
 // neon billboard (original glyph sign) on a steel frame
 const neon=ctex(1024,256,(x,w,h)=>{x.fillStyle='#08060c';x.fillRect(0,0,w,h);x.shadowBlur=24;x.lineCap='round';x.lineJoin='round';
  const tube=(c,f)=>{x.strokeStyle=c;x.shadowColor=c;x.lineWidth=14;f();x.lineWidth=5;x.strokeStyle='#fff';f();};
  tube('#ff3aa0',()=>{x.beginPath();x.arc(140,128,80,0,TAU);x.stroke();x.beginPath();x.moveTo(100,128);x.lineTo(180,128);x.moveTo(140,88);x.lineTo(140,168);x.stroke();});
  tube('#3ad8ff',()=>{x.font='bold 150px Impact, sans-serif';x.strokeText('KUMOYA',260,185);});
  tube('#ffd040',()=>{x.beginPath();x.moveTo(260,220);x.lineTo(980,220);x.stroke();});},{clamp:true});
 const bb=new THREE.Group();bb.position.set(4,6.5,-12.5);bb.lookAt(0,4,0);const bm=new THREE.MeshBasicMaterial({map:neon,toneMapped:false});bm.color.setScalar(1.6);bb.add(new THREE.Mesh(new THREE.PlaneGeometry(10,2.5),bm));
 for(const x of[-4,4])bb.add(M(new THREE.CylinderGeometry(.08,.08,7,6),dk,x,-3.5,-.2));add(bb);
 const bglow=add(new THREE.Mesh(new THREE.PlaneGeometry(14,6),radial(0xff60c0,.35)));bglow.position.copy(bb.position);bglow.quaternion.copy(bb.quaternion);bglow.translateZ(.1);
 // skyline: two rings of instanced towers with a procedural window grid
 const bg=new THREE.BoxGeometry(1,1,1).translate(0,.5,0);const cm=cityMat(3,0x3a2050);const n=q>=1?260:140;const city=new THREE.InstancedMesh(bg,cm,n);const m4=new THREE.Matrix4();
 for(let i=0;i<n;i++){const a=rnd(TAU),r=30+rnd(160),w=8+rnd(16),h=(i%7===0?120:30)+rnd(90)*(1-r/260);m4.compose(new V(Math.sin(a)*r,-50,Math.cos(a)*r),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,rnd(1),0)),new V(w,h+40,w*(.7+rnd(.6))));city.setMatrixAt(i,m4);}
 city.frustumCulled=false;add(city);
 // rain streaks
 out.amb={n:q>=1?160:60,r:9,y0:6,y1:9,v:[-.8,-14,0],col:[new THREE.Color(.5,.55,.7)],size:.03,life:.7,rain:1};
 out.upd.push((t)=>{beacon.material.emissiveIntensity=Math.sin(t*3)>.6?6:.3;S.material.uniforms.uT.value=t;bm.color.setScalar(1.4+Math.sin(t*23)*Math.sin(t*7)*.15+(Math.sin(t*1.3)>.97?-.8:0));});}

/* ================= STADIUM ================= */
function arena(R,grp,out,add,q){
 out.env=makeEnv(R,0x10141c,0x2a3040,0x0a0a10,[[0xffffff,0,30,0,30,30],[0x40a0ff,-30,10,0,20,8],[0xff4060,30,10,0,20,8]]);out.fog={c:0x0a0c14,near:30,far:120};out.bg=0x06070c;
 out.light={hemi:[0xc8d4ff,0x1a1a24,.55],key:[0xffffff,3.4,[2,16,3]],rim:[0x3a8aff,3.0,[-9,5,-7]],rim2:[0xff3a5a,3.0,[9,5,7]]};out.post={exposure:.95,bloom:.5,bloomThreshold:.85,saturation:1.12,vignette:.48,tint:0xf4f6ff};
 // octagon platform with printed canvas mat
 const mat=ctex(1024,1024,(x,w,h)=>{x.fillStyle='#16181f';x.fillRect(0,0,w,h);x.translate(512,512);for(let i=0;i<4000;i++){x.fillStyle=`rgba(255,255,255,${rnd(.025)})`;x.fillRect(rnd(1024)-512,rnd(1024)-512,2,2);}
  x.strokeStyle='#e8b830';x.lineWidth=10;x.beginPath();for(let i=0;i<=8;i++){const a=i/8*TAU+Math.PI/8;x.lineTo(Math.cos(a)*470,Math.sin(a)*470);}x.stroke();
  const g=x.createRadialGradient(0,0,40,0,0,260);g.addColorStop(0,'rgba(220,40,60,.55)');g.addColorStop(1,'rgba(220,40,60,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,260,0,TAU);x.fill();
  x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=8;x.beginPath();x.arc(0,0,150,0,TAU);x.stroke();x.fillStyle='rgba(255,255,255,.4)';x.beginPath();x.moveTo(0,-110);x.lineTo(70,40);x.lineTo(10,20);x.lineTo(0,110);x.lineTo(-70,-40);x.lineTo(-10,-20);x.closePath();x.fill();
  x.fillStyle='rgba(58,138,255,.55)';x.fillRect(-470,-12,140,24);x.fillStyle='rgba(255,58,90,.55)';x.fillRect(330,-12,140,24);},{clamp:true});
 const plat=new THREE.CylinderGeometry(8.2,8.6,.8,8,1);plat.rotateY(Math.PI/8);const top=add(M(plat,[std({color:0x1a1c24,metalness:.5,roughness:.4}),std({map:mat,roughness:.55}),std({color:0x101014})],0,-.4,0,false));
 top.geometry.groups.forEach((g,i)=>g.materialIndex=i);
 add(M(new THREE.CircleGeometry(60,32).rotateX(-Math.PI/2),std({color:0x0a0b10,roughness:.9}),0,-.8,0,false));
 // LED barrier ring with scrolling chase lights
 const led=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uH:{value:0}},transparent:true,side:THREE.DoubleSide,vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uT,uH;varying vec2 vU;void main(){float s=fract(vU.x*24.-uT*.6);vec3 a=mix(vec3(.2,.55,1.6),vec3(1.6,.25,.4),step(.5,fract(vU.x*4.+uT*.05)));float band=smoothstep(.0,.15,vU.y)*smoothstep(1.,.75,vU.y);vec3 c=a*(.35+.9*smoothstep(.6,1.,s)+uH)*band;gl_FragColor=vec4(c,band*.9);}'});
 const ring=add(M(new THREE.CylinderGeometry(9.2,9.2,1.1,64,1,true),led,0,-.2,0,false,false));
 // tiered stands + instanced crowd that bobs harder when the hype rises
 const standM=std({color:0x1a1c24,roughness:.8});for(let i=0;i<7;i++){add(M(new THREE.CylinderGeometry(12+i*2.4,12+i*2.4,.5+i*1.3,48,1,true),standM,0,(.5+i*1.3)/2-.6,0,false,false));add(M(new THREE.RingGeometry(12+i*2.4,14.4+i*2.4,48).rotateX(-Math.PI/2),standM,0,.5+i*1.3-.6,0,false));}
 const n=q>=1?2600:1200,cg=new THREE.CapsuleGeometry(.2,.5,2,6).translate(0,.45,0);
 const cmat=new THREE.MeshStandardMaterial({roughness:.8});cmat.onBeforeCompile=sh=>{sh.uniforms.uT=out.crowdT={value:0};sh.uniforms.uH=out.crowdH={value:.3};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT,uH;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat id=float(gl_InstanceID);transformed.y+=max(0.,sin(uT*(6.+mod(id,5.))+id*1.7))*(.08+uH*.35)*(position.y>.5?1.:.3);');};
 const crowd=new THREE.InstancedMesh(cg,cmat,n),m4=new THREE.Matrix4(),cc=new THREE.Color();
 for(let i=0;i<n;i++){const tier=rnd(7)|0,a=rnd(TAU),r=12.8+tier*2.4+rnd(1.2);m4.compose(new V(Math.sin(a)*r,.5+tier*1.3-.6,Math.cos(a)*r),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,a+Math.PI,0)),new V(1,.85+rnd(.3),1));crowd.setMatrixAt(i,m4);
  cc.setHSL(rnd(),.25+rnd(.3),.08+rnd(.16));if(rnd()<.18)cc.set(rnd()<.5?0x2a4ac8:0xc82a40).multiplyScalar(.7);crowd.setColorAt(i,cc);}
 add(crowd);
 // overhead truss, spot cones and a four-sided jumbotron
 const trM=std({color:0x22242c,metalness:.7,roughness:.35});add(M(new THREE.TorusGeometry(10,.25,6,40).rotateX(Math.PI/2),trM,0,14,0,false));
 const spot=shaftMat(0xffffff,.06);for(let i=0;i<8;i++){const a=i/8*TAU,b=new THREE.Mesh(new THREE.ConeGeometry(2.6,15,24,1,true).translate(0,-7.5,0),spot);b.position.set(Math.sin(a)*10,14,Math.cos(a)*10);b.lookAt(Math.sin(a)*2,0,Math.cos(a)*2);b.rotateX(-Math.PI/2);b.renderOrder=2;add(b);
  add(M(new THREE.CylinderGeometry(.35,.25,.6,12),glow(0xffffff,3),b.position.x,14,b.position.z,false));}
 const scr=ctex(512,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'#1a3aff');g.addColorStop(.5,'#0a0a18');g.addColorStop(1,'#ff2a4a');x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='#fff';x.font='bold 120px Impact, sans-serif';x.textAlign='center';x.fillText('VS',256,170);
  x.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<h;i+=4)x.fillRect(0,i,w,1);},{clamp:true});
 const jb=new THREE.Group();jb.position.y=11;const sm=new THREE.MeshBasicMaterial({map:scr,toneMapped:false});sm.color.setScalar(1.3);for(let i=0;i<4;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(5,2.5),sm);p.position.set(Math.sin(i*Math.PI/2)*2.55,0,Math.cos(i*Math.PI/2)*2.55);p.rotation.y=i*Math.PI/2;jb.add(p);}
 jb.add(M(new THREE.BoxGeometry(5.2,2.7,5.2),trM,0,0,0,false));jb.children[4].scale.set(.97,1,.97);add(jb);
 out.amb={n:q>=1?10:4,r:22,y0:1,y1:8,v:[0,0,0],col:[new THREE.Color(3,3,3)],size:.25,life:.12,flash:1};
 out.upd.push((t,dt,cam,h)=>{led.uniforms.uT.value=t;led.uniforms.uH.value=(h||0)*.6;if(out.crowdT){out.crowdT.value=t;out.crowdH.value=.25+(h||0);}jb.rotation.y=t*.12;});}

/* ================= THRONE ================= */
function throne(R,grp,out,add,q){
 // gilded marble: white stone and gold under a cool dusk sky; warm key, cool fill and shadows so whites, golds and blues all read
 out.env=makeEnv(R,0x1a2244,0x8a90b0,0x14141c,[[0x9a8a68,0,10,-30,30,8],[0x6a8aff,-30,20,10,20,10],[0xffffff,20,26,12,14,8]]);out.fog={c:0x232a42,near:28,far:120};out.bg=0x10142a;
 out.light={hemi:[0xd8e0ff,0x2a2440,.55],key:[0xfff0dc,2.6,[-4,13,6]],rim:[0xffc860,1.4,[0,10,-10]],rim2:[0x6a90ff,2.0,[9,6,6]]};out.post={exposure:.9,bloom:.3,bloomThreshold:.92,saturation:1.08,vignette:.5,tint:0xf4f4ff};
 const S=sky({top:0x080c22,hor:0x5a4a6a,bot:0x0a0a14,sun:[0,.22,-1],sunC:0xffd890,neb:.8,disc:1});out.sky=S;add(S);
 // white marble floor with grey-blue veins and gold inlay
 const ob=ctex(512,512,(x,w,h)=>{x.fillStyle='#e8e4dc';x.fillRect(0,0,w,h);for(let i=0;i<60;i++){x.fillStyle=`rgba(${200+rnd(40)|0},${196+rnd(40)|0},${190+rnd(40)|0},.25)`;x.beginPath();x.arc(rnd(w),rnd(h),10+rnd(50),0,TAU);x.fill();}
  for(let i=0;i<34;i++){x.strokeStyle=`rgba(${70+rnd(30)|0},${80+rnd(30)|0},${110+rnd(30)|0},${.15+rnd(.35)})`;x.lineWidth=.5+rnd(2);x.beginPath();let px=rnd(w),py=rnd(h);x.moveTo(px,py);for(let j=0;j<7;j++){px+=rnd(90)-45;py+=rnd(90)-45;x.lineTo(px,py);}x.stroke();}
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)&1){x.fillStyle='rgba(52,60,84,.78)';x.fillRect(i*w/4,j*h/4,w/4,h/4);}x.strokeStyle='rgba(40,44,60,.5)';x.lineWidth=2;for(let i=0;i<=4;i++){x.strokeRect(i*w/4-1,-2,0,h+4);x.strokeRect(-2,i*h/4-1,w+4,0);}});ob.repeat.set(5,5);
 add(M(new THREE.CircleGeometry(30,64).rotateX(-Math.PI/2),std({map:ob,color:0xc4c2c2,roughness:.42,metalness:.0,envMapIntensity:.7}),0,0,0,false));
 const gold=new THREE.MeshStandardMaterial({color:0xe8bc50,metalness:.95,roughness:.24,emissive:0x2a1a04,emissiveIntensity:.4});
 for(const r of[2.2,4.6,7.0])add(M(new THREE.TorusGeometry(r,.045,6,96).rotateX(Math.PI/2),gold,0,.01,0,false));
 for(let i=0;i<12;i++){const a=i/12*TAU;const b=add(M(new THREE.BoxGeometry(.06,.02,4.6),gold,Math.sin(a)*4.6,.01,Math.cos(a)*4.6,false));b.rotation.y=a;}
 // channel of liquid gold just outside the wall ring (pale gold, not a lava wash)
 const lava=new THREE.ShaderMaterial({uniforms:{uT:{value:0}},vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float uT;varying vec3 vW;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){float a=atan(vW.z,vW.x)*8.;vec2 p=vec2(a+uT*.3,length(vW.xz)*2.);float v=n(p*1.5)*.6+n(p*4.+uT)*.4;vec3 c=mix(vec3(.42,.28,.08),vec3(1.5,1.18,.6),pow(v,2.5));gl_FragColor=vec4(c,1.);}'});
 add(M(new THREE.RingGeometry(7.5,8.4,96).rotateX(-Math.PI/2),lava,0,-.05,0,false,false));
 add(M(new THREE.TorusGeometry(7.45,.12,8,96).rotateX(Math.PI/2),gold,0,.05,0,false));add(M(new THREE.TorusGeometry(8.45,.12,8,96).rotateX(Math.PI/2),gold,0,.05,0,false));
 const lg=add(new THREE.PointLight(0xffd080,3,12,1.8));lg.position.set(0,.3,-8);
 // colonnade
 const veinT=ctex(256,512,(x,w,h)=>{x.fillStyle='#f0ece4';x.fillRect(0,0,w,h);for(let i=0;i<14;i++){x.strokeStyle=`rgba(90,100,130,${.15+rnd(.3)})`;x.lineWidth=.5+rnd(1.5);x.beginPath();let px=rnd(w),py=0;x.moveTo(px,py);while(py<h){px+=rnd(40)-20;py+=20+rnd(40);x.lineTo(px,py);}x.stroke();}});
 const stone=std({map:veinT,color:0xe6e2dc,roughness:.35,metalness:0});
 for(let i=0;i<10;i++){const a=i/10*TAU+.31;if(Math.abs(((a%TAU)+TAU)%TAU-Math.PI)<.35)continue;const x=Math.sin(a)*11.5,z=Math.cos(a)*11.5;add(M(new THREE.CylinderGeometry(.62,.72,11,16),stone,x,5.5,z));add(M(new THREE.CylinderGeometry(.95,.8,.6,16),gold,x,11.2,z));add(M(new THREE.CylinderGeometry(.9,.9,.5,16),gold,x,.25,z));
  const ban=add(M(new THREE.PlaneGeometry(1.4,5.5),std({color:i%2?0x1a2a6a:0x8a1424,roughness:.8,side:THREE.DoubleSide,emissive:i%2?0x020414:0x140002}),x*.92,7,z*.92,false));ban.lookAt(0,7,0);}
 // the throne behind the ring
 const th=new THREE.Group();th.position.set(0,0,-14.5);th.add(M(new THREE.BoxGeometry(8,1.2,5),stone,0,.6,0));th.add(M(new THREE.BoxGeometry(6,.6,4),stone,0,1.5,0));th.add(M(new THREE.BoxGeometry(3,1.2,2.4),gold,0,2.4,.2));
 th.add(M(new THREE.BoxGeometry(3.2,7,.6),gold,0,6,-1));for(let i=0;i<7;i++){const s=M(new THREE.ConeGeometry(.3,2+(3-Math.abs(i-3))*.9,4),gold,(i-3)*.5,9.4+(3-Math.abs(i-3))*.45,-1);th.add(s);}
 for(const x of[-1.7,1.7])th.add(M(new THREE.BoxGeometry(.5,1.2,2.4),gold,x,3.2,.2));th.add(M(new THREE.SphereGeometry(.4,16,12),glow(0x9ab8ff,3),0,8.2,-.6,false));add(th);
 out.amb={n:q>=1?40:16,r:8.5,y0:0,y1:1,v:[0,1.2,0],col:[new THREE.Color(2.2,1.8,.9),new THREE.Color(1.4,1.5,2)],size:.045,life:3,ember:1};
 out.upd.push((t)=>{lava.uniforms.uT.value=t;S.material.uniforms.uT.value=t;lg.intensity=3+Math.sin(t*3)*.6+Math.sin(t*7.3)*.3;});}
