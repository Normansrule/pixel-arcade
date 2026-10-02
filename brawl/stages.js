// PLATFORM BRAWL — stage visuals: sky domes, scenery, main slabs, moving platforms, hazard effects.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,rnd=(a=1)=>Math.random()*a,TAU=Math.PI*2;
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
const std=(o)=>new THREE.MeshStandardMaterial({roughness:.7,metalness:.05,...o});
const glow=(c,i=2.5)=>new THREE.MeshStandardMaterial({color:0x080808,emissive:c,emissiveIntensity:i,roughness:.5});
function M(g,m,x=0,y=0,z=0,sh=true){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=sh;o.receiveShadow=true;return o;}
const DEPTH=6;

/* ---------- sky dome ---------- */
function sky(o){return new THREE.Mesh(new THREE.SphereGeometry(900,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
 uniforms:{uTop:{value:new THREE.Color(o.top)},uHor:{value:new THREE.Color(o.hor)},uBot:{value:new THREE.Color(o.bot)},uSun:{value:new V(...(o.sun||[0,.2,-1])).normalize()},uSunC:{value:new THREE.Color(o.sunC||0)},uStars:{value:o.stars||0},uNeb:{value:o.neb||0},uT:{value:0}},
 vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform vec3 uTop,uHor,uBot,uSun,uSunC;uniform float uStars,uNeb,uT;varying vec3 vP;
 float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
 float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){vec3 d=normalize(vP);float y=d.y;vec3 c=y>0.?mix(uHor,uTop,pow(smoothstep(0.,.65,y),.8)):mix(uHor,uBot,smoothstep(0.,-.35,y));
  float s=max(0.,dot(d,uSun));c+=uSunC*(pow(s,600.)*8.+pow(s,24.)*.5+pow(s,4.)*.12);
  if(uStars>0.){vec3 q=floor(d*420.);float st=step(.9965,h(q))*smoothstep(-.05,.3,y);c+=vec3(st)*uStars*(.5+.5*sin(uT*2.+h(q)*40.));}
  if(uNeb>0.){float n=n3(d*3.)*.55+n3(d*7.)*.3+n3(d*15.)*.15;float band=exp(-pow(d.y*2.2-d.x*.8,2.)*3.);c+=mix(vec3(.25,.05,.35),vec3(.05,.25,.45),n)*pow(n,2.)*band*uNeb*1.6;}
  gl_FragColor=vec4(c,1.);}`}));}
export function makeEnv(R,top,hor,bot,lights=[]){const s=new THREE.Scene();s.add(sky({top,hor,bot}));for(const[c,x,y,z,w,h]of lights){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);s.add(m);}
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.03);pm.dispose();return rt.texture;}

/* ---------- textures ---------- */
const T={};
function grassTex(){return T.grass||(T.grass=ctex(256,256,(x,w,h)=>{x.fillStyle='#4f9a3a';x.fillRect(0,0,w,h);for(let i=0;i<5000;i++){const v=rnd();x.fillStyle=v<.5?`rgba(30,80,20,${rnd(.4)})`:`rgba(170,230,110,${rnd(.25)})`;x.fillRect(rnd(w),rnd(h),1.5,2+rnd(4));}}));}
function rockTex(base='#7a6a5a'){return ctex(256,256,(x,w,h)=>{x.fillStyle=base;x.fillRect(0,0,w,h);for(let i=0;i<3000;i++){x.fillStyle=`rgba(${rnd()<.5?'0,0,0':'255,240,220'},${rnd(.12)})`;const s=1+rnd(6);x.fillRect(rnd(w),rnd(h),s,s);}
 x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=2;for(let i=0;i<14;i++){x.beginPath();let px=rnd(w),py=rnd(h);x.moveTo(px,py);for(let j=0;j<5;j++){px+=rnd(40)-20;py+=rnd(30);x.lineTo(px,py);}x.stroke();}});}
function plateTex(){return T.plate||(T.plate=ctex(256,256,(x,w,h)=>{x.fillStyle='#5a5f66';x.fillRect(0,0,w,h);for(let i=0;i<2500;i++){x.fillStyle=`rgba(0,0,0,${rnd(.1)})`;x.fillRect(rnd(w),rnd(h),2,2);}
 x.strokeStyle='rgba(20,20,24,.8)';x.lineWidth=3;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,h);x.stroke();}x.beginPath();x.moveTo(0,128);x.lineTo(w,128);x.stroke();
 x.fillStyle='rgba(200,200,210,.5)';for(let i=0;i<4;i++)for(let j=0;j<2;j++){for(const[a,b]of[[8,8],[56,8],[8,120],[56,120]]){x.beginPath();x.arc(i*64+a,j*128+b,3,0,7);x.fill();}}}));}
function woodTex(){return T.wood||(T.wood=ctex(256,256,(x,w,h)=>{for(let i=0;i<8;i++){const c=110+rnd(40)|0;x.fillStyle=`rgb(${c},${c*.68|0},${c*.42|0})`;x.fillRect(0,i*32,w,32);for(let k=0;k<60;k++){x.strokeStyle=`rgba(40,20,5,${rnd(.25)})`;x.beginPath();const yy=i*32+rnd(32);x.moveTo(0,yy);x.bezierCurveTo(w*.3,yy+rnd(4)-2,w*.6,yy+rnd(4)-2,w,yy);x.stroke();}x.fillStyle='rgba(20,10,0,.6)';x.fillRect(0,i*32,w,2);x.fillStyle='rgba(30,30,30,.8)';x.fillRect(20,i*32+12,4,4);x.fillRect(230,i*32+12,4,4);}}));}
function concreteTex(){return T.conc||(T.conc=ctex(256,256,(x,w,h)=>{x.fillStyle='#4a4c55';x.fillRect(0,0,w,h);for(let i=0;i<4000;i++){x.fillStyle=`rgba(${rnd()<.5?'0,0,0':'255,255,255'},${rnd(.07)})`;x.fillRect(rnd(w),rnd(h),2,2);}x.strokeStyle='rgba(0,0,0,.3)';x.lineWidth=2;x.strokeRect(0,0,w,h);}));}
function crystalTex(){return T.cry||(T.cry=ctex(256,256,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=2;for(let i=0;i<=8;i++){x.globalAlpha=i%4?.25:.8;x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32,h);x.stroke();x.beginPath();x.moveTo(0,i*32);x.lineTo(w,i*32);x.stroke();}},{srgb:false}));}
function hazardTex(){return T.haz||(T.haz=ctex(256,32,(x,w,h)=>{x.fillStyle='#111';x.fillRect(0,0,w,h);x.fillStyle='#f2b90c';for(let i=-2;i<12;i++){x.beginPath();x.moveTo(i*32,h);x.lineTo(i*32+16,0);x.lineTo(i*32+32,0);x.lineTo(i*32+16,h);x.fill();}}));}
function windowsTex(){return T.win||(T.win=ctex(128,256,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);for(let i=0;i<8;i++)for(let j=0;j<32;j++){if(rnd()<.45){const c=rnd();x.fillStyle=c<.6?'#ffcf7a':c<.85?'#7ad8ff':'#ff6ad5';x.globalAlpha=.4+rnd(.6);x.fillRect(4+i*15,3+j*8,9,4);}}x.globalAlpha=1;},{srgb:true}));}

/* ---------- main slab + soft platforms ---------- */
function islandShape(s,depthY,jag){const sh=new THREE.Shape();const w=s.x1-s.x0;sh.moveTo(s.x0,s.y);sh.lineTo(s.x1,s.y);
 const n=10;for(let i=0;i<=n;i++){const k=i/n,x=s.x1-k*w,edge=Math.sin(k*Math.PI);const y=s.y-1.1-edge*(depthY-1.1)-(jag?(rnd()*1.2*edge):0);sh.lineTo(x+(i===0?-.25:i===n?.25:0),y);}sh.lineTo(s.x0,s.y);return sh;}
function slab(s,mats,o={}){const g=new THREE.Group();const top=o.top??.45;
 const body=new THREE.ExtrudeGeometry(o.island?islandShape(s,o.depth||9,true):(()=>{const sh=new THREE.Shape();const c=o.chamfer??.5;sh.moveTo(s.x0,s.y);sh.lineTo(s.x1,s.y);sh.lineTo(s.x1,s.yb+c);sh.lineTo(s.x1-c,s.yb);sh.lineTo(s.x0+c,s.yb);sh.lineTo(s.x0,s.yb+c);sh.lineTo(s.x0,s.y);return sh;})(),{depth:DEPTH,bevelEnabled:true,bevelSize:.18,bevelThickness:.18,bevelSegments:2,curveSegments:4});
 body.translate(0,-.26,-DEPTH/2);const uv=body.attributes.uv;for(let i=0;i<uv.count;i++){uv.setXY(i,uv.getX(i)*.12,uv.getY(i)*.12);}
 g.add(M(body,mats.side));
 const tg=new THREE.BoxGeometry(s.x1-s.x0+.5,top,DEPTH+.5);const tuv=tg.attributes.uv;for(let i=0;i<tuv.count;i++)tuv.setXY(i,tuv.getX(i)*(s.x1-s.x0)/6,tuv.getY(i)*DEPTH/6);
 g.add(M(tg,mats.top,(s.x0+s.x1)/2,s.y-top/2+.02,0));
 if(mats.edge){const e=M(new THREE.BoxGeometry(s.x1-s.x0+.5,.07,.07),mats.edge,(s.x0+s.x1)/2,s.y-.04,DEPTH/2+.27,false);g.add(e);for(const x of[s.x0-.25,s.x1+.25])g.add(M(new THREE.BoxGeometry(.09,.09,DEPTH+.5),mats.edge,x,s.y-.04,0,false));}
 return g;}
function softPlat(p,mats,o={}){const g=new THREE.Group();const w=p.x1-p.x0,d=o.depth??3.2;const tg=new THREE.BoxGeometry(w,.28,d);const tuv=tg.attributes.uv;for(let i=0;i<tuv.count;i++)tuv.setXY(i,tuv.getX(i)*w/5,tuv.getY(i));
 g.add(M(tg,mats.top,0,-.14,0));if(mats.under)g.add(M(new THREE.BoxGeometry(w*.86,.3,d*.8),mats.under,0,-.42,0));
 if(mats.edge)g.add(M(new THREE.BoxGeometry(w,.06,.06),mats.edge,0,-.06,d/2+.02,false));
 g.userData.p=p;return g;}

/* ---------- builders ---------- */
export function buildStage(scene,R,S,quality){const id=S.id,grp=new THREE.Group();scene.add(grp);const out={grp,plats:[],upd:[],haz:null,amb:null,water:null};
 const add=o=>{grp.add(o);return o;};
 if(id==='garden')garden(R,S,grp,out,add);else if(id==='foundry')foundry(R,S,grp,out,add);else if(id==='bay')bay(R,S,grp,out,add);else if(id==='spire')spire(R,S,grp,out,add);else zenith(R,S,grp,out,add);
 out.update=(t,dt,w,cam)=>{for(const m of out.plats){const p=m.userData.p;m.position.set((p.x0+p.x1)/2,p.y,0);}for(const f of out.upd)f(t,dt,w,cam);};
 out.dispose=()=>{scene.remove(grp);grp.traverse(o=>{if(o.geometry)o.geometry.dispose();});};
 return out;}

function garden(R,S,grp,out,add){const s=S.solids[0];
 out.env=makeEnv(R,0x2a4a98,0xd8885a,0x4a3a5a,[[0xffd8a0,-120,40,-200,90,40],[0x6a8ad8,100,80,100,80,60]]);out.fog={c:0xb87a6a,near:70,far:460};out.bg=0xb87a6a;
 out.light={hemi:[0x9ab4ff,0x5a3a3a,.7],key:[0xffe6c8,2.9,[-14,30,22]],rim:[0xff8a4a,2.6,[18,10,-30]]};out.post={exposure:.86,bloom:.42,bloomThreshold:.94,saturation:1.18,tint:0xfff2e6,vignette:.42};
 const sk=add(sky({top:0x1c3a8a,hor:0xe8925a,bot:0x6a3a6a,sun:[-.35,.06,-1],sunC:0xffa060}));out.upd.push(t=>{sk.material.uniforms.uT.value=t;});
 // cloud sea
 const cm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:0}},vertexShader:'varying vec2 vU;varying vec3 vW;void main(){vU=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float uT;varying vec2 vU;varying vec3 vW;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}float fb(vec2 p){float a=0.,s=.5;for(int i=0;i<5;i++){a+=n(p)*s;p*=2.03;s*=.5;}return a;}void main(){vec2 p=vW.xz*.02+vec2(uT*.01,0.);float c=fb(p);float d=length(vW.xz)/600.;vec3 col=mix(vec3(.72,.42,.42),vec3(.95,.74,.62),smoothstep(.35,.75,c));col=mix(col,vec3(.75,.45,.5),d);gl_FragColor=vec4(col,smoothstep(.25,.6,c)*(1.-smoothstep(.6,1.,d)));}'});
 const clouds=add(new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),cm));clouds.rotation.x=-Math.PI/2;clouds.position.y=-26;out.upd.push(t=>{cm.uniforms.uT.value=t;});
 // distant floating islands
 const rk=std({color:0x8a7060,map:rockTex('#8a7464'),roughness:.9}),gr=std({color:0x6ab04a,map:grassTex(),roughness:.95});
 for(let i=0;i<9;i++){const sc=3+rnd(7),x=(rnd()-.5)*260,z=-70-rnd(170),y=-6+rnd(36);const g=new THREE.Group();const c=M(new THREE.ConeGeometry(sc,sc*2.2,7),rk,0,-sc*1.1,0,false);c.rotation.x=Math.PI;c.rotation.y=rnd(3);g.add(c);g.add(M(new THREE.CylinderGeometry(sc*1.02,sc*.98,sc*.3,7),gr,0,0,0,false));
  for(let k=0;k<3;k++){const tr=M(new THREE.ConeGeometry(sc*.2,sc*.6,6),std({color:0x3f7a3a,roughness:.9}),(rnd()-.5)*sc,sc*.4,(rnd()-.5)*sc,false);g.add(tr);}g.position.set(x,y,z);add(g);const ph=rnd(6);out.upd.push(t=>{g.position.y=y+Math.sin(t*.3+ph)*.8;});}
 // main island
 const side=std({map:rockTex('#8a7464'),color:0xb09a88,roughness:.92}),top=std({map:grassTex(),color:0xbfe8a0,roughness:.9});
 add(slab(s,{side,top,edge:std({color:0xf2e6c8,roughness:.6})},{island:true,depth:11,top:.55}));
 // hanging rocks + trees + crystals
 for(let i=0;i<14;i++){const r=M(new THREE.DodecahedronGeometry(.4+rnd(1.2),0),side,s.x0+rnd(s.x1-s.x0),s.y-2-rnd(6),(rnd()-.5)*5);r.rotation.set(rnd(3),rnd(3),0);add(r);}
 const trunk=std({color:0x5a3a24,roughness:.9}),leaf=std({color:0x4f9a44,roughness:.8,emissive:0x0a2008,emissiveIntensity:.3}),leaf2=std({color:0xe08ab0,roughness:.8});
 for(const[x,z,pink]of[[-9.2,-2.6,0],[-5.4,-2.9,1],[6.4,-2.8,0],[9.4,-2.5,1]]){const g=new THREE.Group();g.add(M(new THREE.CylinderGeometry(.12,.2,1.6,7),trunk,0,.8,0));for(let k=0;k<3;k++)g.add(M(new THREE.IcosahedronGeometry(.8-k*.15,0),pink?leaf2:leaf,(rnd()-.5)*.6,1.8+k*.5,(rnd()-.5)*.5));g.position.set(x,s.y,z);g.scale.setScalar(.9+rnd(.3));add(g);}
 const cry=new THREE.MeshStandardMaterial({color:0x3a8aa8,emissive:0x2ab8ff,emissiveIntensity:.7,roughness:.15,metalness:.3});for(let i=0;i<7;i++){const c=M(new THREE.OctahedronGeometry(.2+rnd(.25),0),cry,s.x0+1+rnd(s.x1-s.x0-2),s.y+.2,-2.2-rnd(.8),false);c.scale.y=2;c.rotation.z=(rnd()-.5)*.6;add(c);}
 // platforms: carved stone with glowing runes
 const pt=std({map:rockTex('#a49686'),color:0xd8ccc0,roughness:.8}),pe=glow(0x7ae8ff,2.2);
 for(const p of S.plats){const m=softPlat(p,{top:pt,under:side,edge:pe});add(m);out.plats.push(m);}
 // drifting petals
 out.amb={n:50,col:[new THREE.Color(1.2,.7,.9),new THREE.Color(1.3,1.1,.8)],area:[-30,30,-2,22],vy:-.6,vx:.8,size:.18};}

function foundry(R,S,grp,out,add){const s=S.solids[0];
 out.env=makeEnv(R,0x1a1410,0x6a2a10,0x2a0800,[[0xff7a20,0,-30,-60,120,30],[0xffd8a0,40,60,40,40,40]]);out.fog={c:0x1c0d08,near:40,far:200};out.bg=0x120806;
 out.light={hemi:[0x8a7a70,0x401000,.6],key:[0xffe0c0,2.0,[10,30,24]],rim:[0xff5a10,3.2,[-10,-14,-20]]};out.post={exposure:1.05,bloom:.75,bloomThreshold:.82,saturation:1.12,tint:0xfff0e4};
 add(sky({top:0x0c0806,hor:0x3a1206,bot:0x5a1804}));
 // molten pool
 const lm=new THREE.ShaderMaterial({uniforms:{uT:{value:0}},fog:false,vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform float uT;varying vec3 vW;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){vec2 p=vW.xz*.12;float c=n(p+uT*.15)*.6+n(p*2.3-uT*.2)*.3+n(p*5.+uT*.4)*.1;float cr=smoothstep(.45,.62,c);vec3 col=mix(vec3(2.6,.55,.06),vec3(.25,.04,.01),cr);col+=vec3(3.,1.6,.4)*pow(1.-abs(c-.5)*2.,12.)*.6;float d=length(vW.xz)/160.;gl_FragColor=vec4(col*(1.-smoothstep(.4,1.,d)),1.);}'});
 const lava=add(new THREE.Mesh(new THREE.PlaneGeometry(500,300),lm));lava.rotation.x=-Math.PI/2;lava.position.set(0,-13,-40);out.upd.push(t=>{lm.uniforms.uT.value=t;});
 // back wall, vats, pipes, girders
 const steel=std({map:plateTex(),color:0x8a8f96,roughness:.45,metalness:.75}),dark=std({color:0x2a2a2e,roughness:.6,metalness:.6}),rust=std({color:0x6a3a24,roughness:.8,metalness:.4});
 add(M(new THREE.PlaneGeometry(400,120),std({map:plateTex(),color:0x3a3634,roughness:.7,metalness:.5}),0,30,-70,false));
 for(const[x,z,r]of[[-34,-40,7],[30,-46,9],[-6,-58,6],[54,-30,5],[-56,-28,6]]){const v=new THREE.Group();v.add(M(new THREE.CylinderGeometry(r,r*.9,r*2.2,24,1,true),rust,0,0,0,false));v.add(M(new THREE.TorusGeometry(r,.4,8,32).rotateX(Math.PI/2),dark,0,r*1.1,0,false));
  const mo=M(new THREE.CircleGeometry(r*.95,24).rotateX(-Math.PI/2),glow(0xff5a10,2.4),0,r*1.05,0,false);v.add(mo);v.position.set(x,-6,z);add(v);
  const pl=new THREE.PointLight(0xff6a20,60,40,1.6);pl.position.set(x,r*1.2-4,z+r);add(pl);}
 const gi=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),dark,60);let k=0;const mm=new THREE.Matrix4();
 for(let i=-6;i<=6;i++){mm.compose(new V(i*14,14,-24),new THREE.Quaternion(),new V(.8,60,.8));gi.setMatrixAt(k++,mm);}for(const y of[6,26,40]){mm.compose(new V(0,y,-24),new THREE.Quaternion(),new V(200,.9,.9));gi.setMatrixAt(k++,mm);}
 for(let i=-6;i<6;i++){mm.compose(new V(i*14+7,20,-24),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,i%2?.95:-.95)),new V(.5,22,.5));gi.setMatrixAt(k++,mm);}gi.count=k;add(gi);
 for(let i=0;i<6;i++){const p=M(new THREE.CylinderGeometry(.5,.5,120,10),i%2?rust:steel,-60+i*24,8+rnd(20),-30-rnd(10),false);p.rotation.z=Math.PI/2*(i%3===0?1:0);add(p);}
 // chains
 for(const x of[-15,15])for(let j=0;j<10;j++){const c=M(new THREE.TorusGeometry(.18,.05,6,10),dark,x,22-j*.32,-6,false);c.rotation.y=j%2?Math.PI/2:0;add(c);}
 // deck
 const side=std({map:plateTex(),color:0x7a7f86,roughness:.4,metalness:.8}),top=std({map:plateTex(),color:0xa0a6ae,roughness:.38,metalness:.75});
 add(slab(s,{side,top,edge:std({map:hazardTex(),roughness:.5})},{chamfer:.6,top:.4}));
 for(const x of[s.x0+.6,s.x1-.6]){add(M(new THREE.CylinderGeometry(.5,.7,20,12),dark,x,s.yb-10,0));}
 const strip=M(new THREE.BoxGeometry(s.x1-s.x0,.5,.06),std({map:hazardTex(),roughness:.5}),0,s.y-.6,DEPTH/2+.28,false);strip.material.map.repeat.set(10,1);add(strip);
 // platforms
 const gt=std({map:plateTex(),color:0xc0c6ce,roughness:.35,metalness:.8}),ge=glow(0xff8a2a,2.2);
 for(const p of S.plats){const m=softPlat(p,{top:gt,under:dark,edge:ge});add(m);out.plats.push(m);if(p.path){const rail=M(new THREE.BoxGeometry(p.path.ax*2+(p.x1-p.x0)+2,.25,.25),dark,0,p.y+.9,-1.6,false);add(rail);const hook=M(new THREE.BoxGeometry(.12,1,.12),dark,0,.5,-1.6,false);m.add(hook);}}
 // geyser hazard visuals
 const colM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uA:{value:0}},vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uT,uA;varying vec2 vU;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}void main(){float c=n(vec2(vU.x*8.,vU.y*6.-uT*6.))*.7+n(vec2(vU.x*20.,vU.y*14.-uT*10.))*.3;float e=sin(vU.x*3.14159);vec3 col=mix(vec3(2.4,.4,.05),vec3(3.,1.8,.5),c);gl_FragColor=vec4(col*e*(.6+c)*uA*smoothstep(1.,.7,vU.y),1.);}'});
 const column=add(new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.6,22,20,1,true),colM));column.visible=false;
 const warn=add(new THREE.Mesh(new THREE.RingGeometry(.9,1.4,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:new THREE.Color(3,.8,.1),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})));warn.visible=false;
 const gl=new THREE.PointLight(0xff6a10,0,30,1.5);add(gl);
 out.haz={warn(z){warn.visible=true;warn.position.set(z.x,s.y+.06,0);gl.position.set(z.x,s.y+1,1);},on(z){warn.visible=false;column.visible=true;column.position.set(z.x,s.y-6+11*0,0);colM.uniforms.uA.value=1;},off(){column.visible=false;warn.visible=false;gl.intensity=0;},
  tick(t,z){if(warn.visible){const k=.5+.5*Math.sin(t*20);warn.material.opacity=k;warn.scale.setScalar(1+((t*2)%1)*.4);gl.intensity=20+k*30;}if(column.visible){colM.uniforms.uT.value=t;gl.intensity=160;column.scale.x=column.scale.z=1+Math.sin(t*30)*.06;}}};
 out.amb={n:80,col:[new THREE.Color(3,1.2,.2),new THREE.Color(2.4,.6,.08)],area:[-30,30,-12,20],vy:2.2,vx:.2,size:.12};}

function bay(R,S,grp,out,add){const s=S.solids[0];
 out.env=makeEnv(R,0x4a86d8,0xbfe0ff,0x1a4a6a,[[0xfff4e0,60,90,-120,60,40]]);out.fog={c:0x9cc0e2,near:110,far:640};out.bg=0x9cc0e2;
 out.light={hemi:[0xcfe6ff,0x3a5a6a,.9],key:[0xfff2dc,2.8,[20,40,26]],rim:[0x9ad0ff,1.2,[-20,12,-30]]};out.post={exposure:.9,bloom:.35,bloomThreshold:.95,saturation:1.18,tint:0xf6fbff,vignette:.38};
 const sk=add(sky({top:0x2a64c0,hor:0xcfe6f6,bot:0x2a5a7a,sun:[.4,.45,-1],sunC:0xfff0d0}));
 // ocean
 const wm=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uSun:{value:new V(.4,.45,-1).normalize()}},vertexShader:'uniform float uT;varying vec3 vW;varying vec3 vN;void main(){vec3 p=position;vec4 w=modelMatrix*vec4(p,1.);float a=sin(w.x*.18+uT*1.3)*.35+sin(w.z*.23-uT*1.1)*.25+sin((w.x+w.z)*.5+uT*2.)*.08;w.y+=a;vW=w.xyz;float dx=cos(w.x*.18+uT*1.3)*.063+cos((w.x+w.z)*.5+uT*2.)*.04,dz=cos(w.z*.23-uT*1.1)*.058+cos((w.x+w.z)*.5+uT*2.)*.04;vN=normalize(vec3(-dx,1.,-dz));gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:'uniform vec3 uSun;uniform float uT;varying vec3 vW;varying vec3 vN;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}void main(){vec3 v=normalize(cameraPosition-vW);float fr=pow(1.-max(0.,dot(v,vN)),4.);vec3 deep=vec3(.01,.1,.18),sh=vec3(.03,.3,.4),skyc=vec3(.42,.62,.85);vec3 c=mix(deep,sh,.35+.4*vN.y-.4);c=mix(c,skyc,fr*.85);vec3 r=reflect(-v,vN);float sp=pow(max(0.,dot(r,uSun)),180.);c+=vec3(2.4,2.2,1.9)*sp;float sparkle=step(.985,h(floor(vW.xz*4.)+floor(uT*6.)))*fr*2.;c+=sparkle;float d=length(vW.xz-cameraPosition.xz)/500.;c=mix(c,vec3(.6,.74,.88),smoothstep(.3,1.,d));gl_FragColor=vec4(c,1.);}'});
 const sea=add(new THREE.Mesh(new THREE.PlaneGeometry(1200,800,160,100),wm));sea.rotation.x=-Math.PI/2;sea.position.y=-1.6;sea.receiveShadow=false;out.water=-1.6;out.upd.push(t=>{wm.uniforms.uT.value=t;sk.material.uniforms.uT.value=t;});
 // headland, lighthouse, distant boats
 const hill=std({color:0x5a7a4a,roughness:.95}),cliff=std({map:rockTex('#8a8070'),roughness:.95});
 for(const[x,z,r,h]of[[-140,-260,70,40],[-60,-300,60,30],[170,-280,90,48],[90,-330,70,26]]){const c=M(new THREE.ConeGeometry(r,h,9,1),cliff,x,h/2-3,z,false);c.scale.z=.5;add(c);const t=M(new THREE.SphereGeometry(r*.7,12,8,0,TAU,0,Math.PI/2),hill,x,h*.55,z,false);t.scale.set(1,.25,.4);add(t);}
 const lh=new THREE.Group();const lw=std({color:0xf2f2ee,roughness:.6}),lr=std({color:0xc8302a,roughness:.6});for(let i=0;i<6;i++)lh.add(M(new THREE.CylinderGeometry(3.6-i*.3,3.9-i*.3,5,16),i%2?lr:lw,0,2.5+i*5,0,false));
 const lamp=M(new THREE.CylinderGeometry(2.2,2.2,3,12),glow(0xfff2b0,4),0,32.5,0,false);lh.add(lamp);lh.add(M(new THREE.ConeGeometry(2.8,2.4,12),lr,0,35.2,0,false));lh.position.set(150,18,-250);add(lh);
 const beam=M(new THREE.ConeGeometry(10,120,16,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(.5,.45,.3),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}),0,0,0,false);beam.geometry.translate(0,-60,0);beam.geometry.rotateZ(Math.PI/2);const bp=new THREE.Group();bp.position.set(150,50.5,-250);bp.add(beam);add(bp);out.upd.push(t=>{bp.rotation.y=t*.6;});
 const sail=std({color:0xf4f0e6,roughness:.8,side:THREE.DoubleSide}),hull=std({color:0x7a4a2a,roughness:.8});
 for(let i=0;i<5;i++){const b=new THREE.Group();b.add(M(new THREE.BoxGeometry(5,1.2,1.6),hull,0,0,0,false));const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([0,.6,0,0,8,0,3,.8,0],3));sg.computeVertexNormals();b.add(M(sg,sail,0,0,0,false));const x0=-200+rnd(400),z=-120-rnd(160);b.position.set(x0,-1.2,z);add(b);const sp=.6+rnd(1);out.upd.push(t=>{b.position.x=((x0+t*sp+250)%500)-250;b.rotation.z=Math.sin(t*1.2+x0)*.05;});}
 // dock
 const wood=std({map:woodTex(),color:0xd8b896,roughness:.85});const side=std({map:woodTex(),color:0x9a7a5a,roughness:.9});
 add(slab(s,{side,top:wood,edge:std({color:0x3a2a1a,roughness:.8})},{chamfer:.3,top:.42}));
 const post=std({color:0x5a3e28,roughness:.9});for(let x=s.x0+.4;x<=s.x1;x+=3.2)for(const z of[-2.6,2.6])add(M(new THREE.CylinderGeometry(.32,.36,8,10),post,x,s.y-4,z));
 const rope=std({color:0xc8b48a,roughness:.9});for(const x of[s.x0+1.2,s.x1-1.2]){add(M(new THREE.CylinderGeometry(.28,.34,.7,10),std({color:0x2a2a2e,metalness:.7,roughness:.4}),x,s.y+.35,2.3));add(M(new THREE.TorusGeometry(.38,.08,6,14).rotateX(Math.PI/2),rope,x,s.y+.2,2.3));}
 for(const[x,z]of[[-7.6,-2.2],[-6.6,-2.3],[7.4,-2.1]]){const br=M(new THREE.CylinderGeometry(.42,.42,1.1,12),std({color:0x7a5030,roughness:.8}),x,s.y+.55,z);add(br);add(M(new THREE.TorusGeometry(.43,.04,6,16).rotateX(Math.PI/2),std({color:0x333,metalness:.8}),x,s.y+.3,z));}
 // rafts + crane pallet
 const rt=std({map:woodTex(),color:0xc8a07a,roughness:.85});
 for(const p of S.plats){let m;if(p.path&&p.path.ax){m=softPlat(p,{top:rt,under:std({color:0x4a3220,roughness:.9}),edge:glow(0xffd27a,1.6)},{depth:2.6});const cable=M(new THREE.CylinderGeometry(.04,.04,30,6),std({color:0x222,metalness:.8,roughness:.4}),0,15,0,false);m.add(cable);const hook=M(new THREE.TorusGeometry(.3,.07,6,12),std({color:0xc8a020,metalness:.8,roughness:.35}),0,.6,0,false);m.add(hook);}
  else{m=softPlat(p,{top:rt,under:std({color:0x4a3220,roughness:.9})},{depth:3.6});for(const z of[-1.2,1.2])m.add(M(new THREE.CylinderGeometry(.42,.42,(p.x1-p.x0),10).rotateZ(Math.PI/2),std({color:0x2a2a30,metalness:.4,roughness:.5}),0,-.5,z,false));}
  add(m);out.plats.push(m);}
 const crane=new THREE.Group();const yel=std({color:0xf2b90c,roughness:.5,metalness:.4});crane.add(M(new THREE.BoxGeometry(1.2,40,1.2),yel,-34,10,-12,false));crane.add(M(new THREE.BoxGeometry(64,1,1),yel,-4,29.5,-12,false));add(crane);
 out.amb={n:30,col:[new THREE.Color(1.2,1.25,1.3)],area:[-40,40,-1.5,14],vy:.2,vx:1.2,size:.08};}

function spire(R,S,grp,out,add){const s=S.solids[0];
 out.env=makeEnv(R,0x0a0a24,0x3a1a5a,0x0a0814,[[0xff3ad0,-60,10,-60,40,8],[0x3ad8ff,60,14,-50,40,8],[0xffffff,0,80,40,40,30]]);out.fog={c:0x140c2a,near:60,far:380};out.bg=0x0c0818;
 out.light={hemi:[0x6a6aff,0x1a0a2a,.55],key:[0xd8e4ff,2.0,[14,28,26]],rim:[0xff3ad0,1.9,[-16,8,-24]],rim2:[0x3ad8ff,2.2,[18,4,-20]]};out.post={exposure:1.1,bloom:.85,bloomThreshold:.78,saturation:1.15,tint:0xf4f0ff};
 const sk=add(sky({top:0x05051a,hor:0x3a1450,bot:0x0a0414,stars:.9,sun:[-.5,.4,-1],sunC:0x8a8ab0}));out.upd.push(t=>{sk.material.uniforms.uT.value=t;});
 const moon=add(M(new THREE.SphereGeometry(18,32,16),new THREE.MeshBasicMaterial({color:new THREE.Color(1.4,1.35,1.5),fog:false}),-220,170,-600,false));
 // skyline
 const wt=windowsTex();const bmat=new THREE.MeshStandardMaterial({color:0x14141e,roughness:.6,metalness:.4,emissive:0xffffff,emissiveMap:wt,emissiveIntensity:1.3});
 const bg=new THREE.BoxGeometry(1,1,1);const uv=bg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2,uv.getY(i)*3);
 const N=150,im=new THREE.InstancedMesh(bg,bmat,N),m4=new THREE.Matrix4();for(let i=0;i<N;i++){const z=-40-rnd(260),x=(rnd()-.5)*(260+(-z)*1.4),w=6+rnd(14),h=20+rnd(90)+(-z)*.15;m4.compose(new V(x,h/2-50,z),new THREE.Quaternion(),new V(w,h,w*(.6+rnd(.8))));im.setMatrixAt(i,m4);}add(im);
 // the tower under the roof
 const tw=std({map:concreteTex(),color:0x6a6a78,roughness:.75});add(M(new THREE.BoxGeometry(s.x1-s.x0+.6,80,DEPTH+.6),bmat,0,s.yb-40,0,false));
 // neon signs
 const sign=(txt,col,w,h,x,y,z,ry=0)=>{const t=ctex(512,128,(c,W,H)=>{c.fillStyle='#000';c.fillRect(0,0,W,H);c.font='bold 92px Anton, Impact, sans-serif';c.textAlign='center';c.textBaseline='middle';c.shadowColor=col;c.shadowBlur=24;c.fillStyle=col;c.fillText(txt,W/2,H/2+4);c.shadowBlur=0;c.fillStyle='#fff';c.globalAlpha=.6;c.fillText(txt,W/2,H/2+4);},{clamp:true});
  const m=M(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false,color:new THREE.Color(2,2,2)}),x,y,z,false);m.rotation.y=ry;add(m);return m;};
 const s1=sign('NOODLE 24','#ff3ad0',22,5.5,-46,10,-60,.25),s2=sign('VOLTAGE','#3ad8ff',20,5,52,22,-80,-.3),s3=sign('ARCADE','#ffd23a',16,4,-34,-12,-58,.2);sign('HOTEL MIRA','#8aff6a',22,5,-20,38,-130);
 out.upd.push(t=>{s1.material.opacity=.8+.2*Math.sin(t*9)*(Math.sin(t*1.7)>.9?1:0)+.2;s3.material.opacity=Math.sin(t*3)>-.9?1:.2;});
 // roof
 const side=std({map:concreteTex(),color:0x8a8a98,roughness:.75}),top=std({map:concreteTex(),color:0x9a9aa8,roughness:.7});
 add(slab(s,{side,top,edge:glow(0x3ad8ff,1.1)},{chamfer:.2,top:.35}));
 const helip=ctex(256,256,(c,W,H)=>{c.clearRect(0,0,W,H);c.strokeStyle='rgba(255,230,90,.9)';c.lineWidth=10;c.beginPath();c.arc(128,128,100,0,7);c.stroke();c.font='bold 150px Anton, Impact, sans-serif';c.fillStyle='rgba(255,230,90,.9)';c.textAlign='center';c.textBaseline='middle';c.fillText('H',128,136);},{clamp:true});
 const hp=M(new THREE.PlaneGeometry(5,5),new THREE.MeshStandardMaterial({map:helip,transparent:true,roughness:.6,depthWrite:false}),0,s.y+.02,0,false);hp.rotation.x=-Math.PI/2;add(hp);
 const ac=std({color:0x8a8e96,roughness:.4,metalness:.7});for(const[x,z]of[[-8,-2.3],[-6.4,-2.3],[7.6,-2.2]]){add(M(new THREE.BoxGeometry(1.4,1.2,1.2),ac,x,s.y+.6,z));add(M(new THREE.CylinderGeometry(.45,.45,.1,16),std({color:0x222}),x,s.y+1.22,z));}
 const mast=M(new THREE.CylinderGeometry(.08,.12,9,6),ac,9.6,s.y+4.5,-2.6);add(mast);const blink=M(new THREE.SphereGeometry(.18,8,6),glow(0xff2020,4),9.6,s.y+9.1,-2.6,false);add(blink);out.upd.push(t=>{blink.material.emissiveIntensity=Math.sin(t*4)>.6?6:.2;});
 // platforms: lift + billboard top
 const lt=std({map:plateTex(),color:0xb0b4c0,roughness:.35,metalness:.8});
 for(const p of S.plats){const m=softPlat(p,{top:lt,under:std({color:0x222230,metalness:.6,roughness:.4}),edge:glow(p.path?0xffd23a:0x3ad8ff,2.6)});add(m);out.plats.push(m);
  if(p.path){for(const x of[-1.6,1.6])add(M(new THREE.BoxGeometry(.18,14,.18),std({color:0x333344,metalness:.7,roughness:.4}),(p.x0+p.x1)/2+x*1.2,p.by+1,-1.7,false));}
  else{const bt=ctex(512,256,(c,W,H)=>{const g=c.createLinearGradient(0,0,W,H);g.addColorStop(0,'#2a0a4a');g.addColorStop(1,'#0a2a4a');c.fillStyle=g;c.fillRect(0,0,W,H);c.font='bold 120px Anton, Impact, sans-serif';c.fillStyle='#fff';c.textAlign='center';c.fillText('BRAWL',W/2,150);c.font='36px monospace';c.fillStyle='#3ad8ff';c.fillText('TONIGHT ON CH.9',W/2,210);});
   const bb=M(new THREE.PlaneGeometry(p.x1-p.x0,2.6),new THREE.MeshStandardMaterial({map:bt,emissive:0xffffff,emissiveMap:bt,emissiveIntensity:.9,roughness:.5}),0,-1.5,-1.3,false);m.add(bb);for(const x of[-1,1])m.add(M(new THREE.BoxGeometry(.15,4.4,.15),std({color:0x333344,metalness:.7}),x*(p.x1-p.x0)*.4,-2.4,-1.4,false));}}
 // drone + laser hazard
 const drone=new THREE.Group();const dm=std({color:0x2a2a34,metalness:.8,roughness:.3});drone.add(M(new THREE.SphereGeometry(.6,16,12).scale(1.4,.7,1),dm));const eye=M(new THREE.SphereGeometry(.26,12,8),glow(0xff2a2a,4),0,-.1,.62,false);drone.add(eye);
 for(const[x,z]of[[-1,-.6],[1,-.6],[-1,.6],[1,.6]]){drone.add(M(new THREE.CylinderGeometry(.05,.05,.3,6),dm,x,.3,z));const r=M(new THREE.CylinderGeometry(.5,.5,.03,16),new THREE.MeshBasicMaterial({color:0x8899aa,transparent:true,opacity:.35}),x,.45,z,false);drone.add(r);}
 drone.position.set(-30,12,0);add(drone);const beamM=new THREE.MeshBasicMaterial({color:new THREE.Color(5,.25,.1),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
 const beamL=add(M(new THREE.BoxGeometry(1,.42,.42),beamM,0,0,0,false));beamL.visible=false;beamL.add(M(new THREE.BoxGeometry(1,.3,.3),new THREE.MeshBasicMaterial({color:new THREE.Color(3,3,2.6)}),0,0,0,false));const tele=add(M(new THREE.BoxGeometry(1,.03,.03),new THREE.MeshBasicMaterial({color:new THREE.Color(2,.2,.25),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),0,0,0,false));tele.visible=false;
 const dl=new THREE.PointLight(0xff2a3a,0,24,1.6);add(dl);const B=S.blast;let mode=0,hz=null,dpos=new V(-30,14,0);
 out.haz={warn(z){mode=1;hz=z;tele.visible=true;tele.scale.x=B.r-B.l;tele.position.set((B.l+B.r)/2,z.y,0);},on(z){mode=2;hz=z;tele.visible=false;beamL.visible=true;},off(){mode=0;beamL.visible=false;tele.visible=false;dl.intensity=0;},
  tick(t,z,w){const H=S.hazard;let tx=-26,ty=13+Math.sin(t*.8)*1.5;if(mode===1){tx=z.dir>0?s.x0-4:s.x1+4;ty=z.y;tele.material.opacity=.4+.4*Math.sin(t*25);}
   if(mode===2){const k=z.t/H.dur*1.6;const bx=z.dir>0?B.l+(B.r-B.l)*k:B.r-(B.r-B.l)*k;const x0=z.dir>0?B.l:bx,x1=z.dir>0?bx:B.r;beamL.scale.x=Math.max(.01,x1-x0);beamL.position.set((x0+x1)/2,z.y,0);beamL.scale.y=beamL.scale.z=1+Math.sin(t*60)*.3;tx=z.dir>0?s.x0-4:s.x1+4;ty=z.y;dl.position.set(cl(bx,s.x0,s.x1),z.y,1.5);dl.intensity=80;}
   if(mode===0){tx=-26+Math.sin(t*.3)*8;}dpos.x+=(tx-dpos.x)*.05;dpos.y+=(ty-dpos.y)*.08;drone.position.copy(dpos);drone.position.y+=Math.sin(t*3)*.15;drone.rotation.y=mode?(z.dir>0?Math.PI/2:-Math.PI/2):Math.sin(t*.5);eye.material.emissiveIntensity=mode?8:3;}};
 out.amb={n:40,col:[new THREE.Color(.6,.7,1.4)],area:[-40,40,-8,30],vy:-6,vx:-1,size:.05,rain:1};}
const cl=(v,a,b)=>v<a?a:v>b?b:v;

function zenith(R,S,grp,out,add){const s=S.solids[0];
 out.env=makeEnv(R,0x050818,0x1a1040,0x02030a,[[0x8a5aff,-80,20,-80,60,30],[0x4ae8ff,80,-10,-60,60,20]]);out.fog={c:0x05060f,near:200,far:900};out.bg=0x03040a;
 out.light={hemi:[0x6a7aff,0x10061a,.45],key:[0xe8eeff,2.2,[-10,30,24]],rim:[0xb04dff,3.0,[18,6,-20]],rim2:[0x2ae8ff,2.0,[-20,-4,-18]]};out.post={exposure:1.05,bloom:.8,bloomThreshold:.8,saturation:1.15,tint:0xf2f4ff};
 const sk=add(sky({top:0x02030c,hor:0x0a0820,bot:0x010108,stars:1.4,neb:1}));out.upd.push(t=>{sk.material.uniforms.uT.value=t;});
 // planet with atmosphere
 const pt=ctex(512,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#3a5ab0');g.addColorStop(.5,'#6a8ad8');g.addColorStop(1,'#2a3a80');x.fillStyle=g;x.fillRect(0,0,w,h);for(let i=0;i<40;i++){x.fillStyle=`rgba(255,255,255,${rnd(.25)})`;x.fillRect(0,rnd(h),w,1+rnd(6));}for(let i=0;i<14;i++){x.fillStyle=`rgba(40,90,60,${.5+rnd(.4)})`;x.beginPath();x.ellipse(rnd(w),h*.25+rnd(h*.5),20+rnd(60),10+rnd(30),rnd(3),0,7);x.fill();}});
 const planet=add(M(new THREE.SphereGeometry(140,64,32),std({map:pt,roughness:.8,emissive:0x0a1430,emissiveIntensity:.4}),60,-170,-420,false));
 const atm=add(M(new THREE.SphereGeometry(146,64,32),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide,vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),1.4);gl_FragColor=vec4(vec3(.3,.6,1.6)*f*1.2,1.);}'}),60,-170,-420,false));
 out.upd.push(t=>{planet.rotation.y=t*.01;});
 // orbiting shards
 const sm=new THREE.MeshStandardMaterial({color:0x1a1030,roughness:.15,metalness:.6,emissive:0x5a2aff,emissiveIntensity:.4}),shards=[];
 for(let i=0;i<26;i++){const o=M(new THREE.OctahedronGeometry(.4+rnd(1.4),0),sm,0,0,0,false);o.scale.y=1.8;const r=30+rnd(60),a=rnd(TAU),y=-16+rnd(40),z=-45-rnd(80),sp=(rnd()-.5)*.06;add(o);shards.push({o,r,a,y,z,sp});}
 out.upd.push(t=>{for(const q of shards){const a=q.a+t*q.sp;q.o.position.set(Math.cos(a)*q.r,q.y+Math.sin(t*.4+q.a)*1.5,q.z+Math.sin(a)*8);q.o.rotation.y=t*.3+q.a;}});
 // slab: dark glass with glowing grid
 const ct=crystalTex();const top=new THREE.MeshStandardMaterial({color:0x0c0c1a,roughness:.12,metalness:.5,emissive:0x6a4aff,emissiveMap:ct,emissiveIntensity:1.1});
 const side=new THREE.MeshStandardMaterial({color:0x101028,roughness:.2,metalness:.6,emissive:0x2a1a60,emissiveIntensity:.35});
 add(slab(s,{side,top,edge:glow(0x4ae8ff,3)},{chamfer:1.2,top:.35}));
 const under=add(M(new THREE.ConeGeometry(4,10,6),side,0,s.yb-5,0));under.rotation.x=Math.PI;
 const ring=add(M(new THREE.TorusGeometry(15,.08,8,96),glow(0xb04dff,2.5),0,s.y-1.6,0,false));ring.rotation.x=Math.PI/2;ring.scale.z=.3;out.upd.push(t=>{ring.rotation.z=t*.1;});
 out.amb={n:40,col:[new THREE.Color(.8,.6,2),new THREE.Color(.4,1.4,2)],area:[-30,30,-6,20],vy:.3,vx:0,size:.1};}
