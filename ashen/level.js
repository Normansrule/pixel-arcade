// ASHEN VIGIL — the Cathedral-Keep of Ordhal: procedural textures, merged gothic architecture (walls, clustered piers, pointed ribs,
// stained glass, broken roofs), god-ray shafts, ground fog, sky, shrines, gates, levers, fog walls, and the spawn plan.
import * as THREE from '../vendor/three.module.min.js';
import {makeRig,animate,bakeRig,mergeGeos,makeLongsword,makeGreatsword,std,tex as rigTex} from './rig.js';
const V=THREE.Vector3;
const R=(()=>{let a=1234567;return()=>{a=(a*16807)%2147483647;return a/2147483647;};})();
const rr=(a,b)=>a+R()*(b-a);
export const MOON=new V(-.45,.62,.64).normalize();// towards the moon (north-west, high)

/* ================= procedural textures ================= */
function canvasTex(w,h,f,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');f(x,w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(!o.linear)t.colorSpace=THREE.SRGBColorSpace;return t;}
function noiseDots(x,w,h,n,a,col){for(let k=0;k<n;k++){const v=R();x.fillStyle=col?col(v):`rgba(${v*255|0},${v*255|0},${v*255|0},${a})`;x.fillRect(R()*w,R()*h,1+R()*2.5,1+R()*2.5);}}
function cracks(x,w,h,n,a){x.strokeStyle=`rgba(10,8,6,${a})`;for(let k=0;k<n;k++){x.lineWidth=.6+R()*1.2;x.beginPath();let px=R()*w,py=R()*h;x.moveTo(px,py);for(let i=0;i<5;i++){px+=(R()-.5)*40;py+=(R()-.5)*40;x.lineTo(px,py);}x.stroke();}}
let TX=null;export function tex(){if(TX)return TX;
 // ashlar blocks with mortar, soot and damp
 const wall=canvasTex(512,512,(x,w,h)=>{x.fillStyle='#3a3734';x.fillRect(0,0,w,h);const rowH=64;for(let y=0;y<h;y+=rowH){let px=-R()*80;while(px<w){const bw=90+R()*90;const v=96+R()*44|0,wv=R()*10-5;x.fillStyle=`rgb(${v+wv+6},${v+2},${v-6-wv})`;x.fillRect(px+3,y+3,bw-6,rowH-6);
    const g=x.createLinearGradient(0,y,0,y+rowH);g.addColorStop(0,'rgba(255,255,255,.07)');g.addColorStop(1,'rgba(0,0,0,.2)');x.fillStyle=g;x.fillRect(px+3,y+3,bw-6,rowH-6);
    for(let k=0;k<26;k++){x.fillStyle=`rgba(0,0,0,${R()*.18})`;x.beginPath();x.arc(px+R()*bw,y+R()*rowH,R()*6,0,6.3);x.fill();}if(px+bw>w){x.fillStyle=`rgb(${v+wv+6},${v+2},${v-6-wv})`;x.fillRect(px+3-w,y+3,bw-6,rowH-6);}px+=bw;}}
  noiseDots(x,w,h,9000,.07);cracks(x,w,h,14,.35);
  const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(0,0,0,.22)');g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(20,24,10,.18)');x.fillStyle=g;x.fillRect(0,0,w,h);});
 const floor=canvasTex(512,512,(x,w,h)=>{x.fillStyle='#262422';x.fillRect(0,0,w,h);const n=4,s=w/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const split=R()<.4;const cells=split?[[0,0,1,.5],[0,.5,1,.5]]:[[0,0,1,1]];
   for(const c of cells){const v=78+R()*36|0;x.fillStyle=`rgb(${v+4},${v},${v-6})`;const px=i*s+c[0]*s+3,py=j*s+c[1]*s+3,cw=c[2]*s-6,ch=c[3]*s-6;x.fillRect(px,py,cw,ch);for(let k=0;k<40;k++){x.fillStyle=`rgba(0,0,0,${R()*.15})`;x.beginPath();x.arc(px+R()*cw,py+R()*ch,R()*9,0,6.3);x.fill();}
    const g=x.createRadialGradient(px+cw/2,py+ch/2,0,px+cw/2,py+ch/2,cw*.7);g.addColorStop(0,'rgba(255,255,255,.05)');g.addColorStop(1,'rgba(0,0,0,.2)');x.fillStyle=g;x.fillRect(px,py,cw,ch);}}
  noiseDots(x,w,h,8000,.06);cracks(x,w,h,20,.45);});
 const dirt=canvasTex(512,512,(x,w,h)=>{x.fillStyle='#2a2620';x.fillRect(0,0,w,h);for(let k=0;k<5000;k++){const v=R();x.fillStyle=v<.3?`rgba(52,58,34,${.2+R()*.3})`:v<.6?`rgba(70,62,50,${.15+R()*.25})`:`rgba(18,16,14,${.2+R()*.3})`;x.beginPath();x.arc(R()*w,R()*h,1+R()*5,0,6.3);x.fill();}
  // sunken flagstones in the mud
  for(let k=0;k<14;k++){const px=R()*w,py=R()*h,sw=40+R()*60,sh=30+R()*50;x.fillStyle=`rgba(${80+R()*30|0},${78+R()*26|0},${72+R()*20|0},.75)`;x.save();x.translate(px,py);x.rotate(R()*.4-.2);x.fillRect(-sw/2,-sh/2,sw,sh);x.restore();}noiseDots(x,w,h,6000,.08);});
 const wood=canvasTex(256,256,(x,w,h)=>{for(let i=0;i<4;i++){const v=58+R()*22|0;x.fillStyle=`rgb(${v+14},${v},${v-12})`;x.fillRect(i*w/4,0,w/4,h);for(let k=0;k<40;k++){x.strokeStyle=`rgba(10,6,2,${.1+R()*.2})`;x.beginPath();const gx=i*w/4+R()*w/4;x.moveTo(gx,0);x.bezierCurveTo(gx+R()*8-4,h*.3,gx+R()*8-4,h*.7,gx,h);x.stroke();}x.fillStyle='rgba(0,0,0,.6)';x.fillRect(i*w/4,0,2,h);}});
 // leaded stained glass: an ember rose over tall lancets
 const glass=canvasTex(256,512,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);const pal=['#7a1410','#a83a10','#c87a18','#1a3a6a','#2a5a8a','#3a1a5a','#5a7a2a','#d8a840'];
  for(let k=0;k<150;k++){const cx=R()*w,cy=R()*h;x.fillStyle=pal[R()*pal.length|0];x.beginPath();const n=5+R()*3|0,r0=12+R()*16;for(let i=0;i<n;i++){const a=i/n*6.283;x.lineTo(cx+Math.cos(a)*r0*(.7+R()*.5),cy+Math.sin(a)*r0*(.7+R()*.5));}x.closePath();x.fill();}
  x.save();x.translate(w/2,h*.3);for(let i=0;i<12;i++){x.rotate(Math.PI/6);x.fillStyle=i%2?'#e8b040':'#b02a10';x.beginPath();x.moveTo(0,0);x.lineTo(-14,60);x.lineTo(14,60);x.closePath();x.fill();}x.fillStyle='#f8e0a0';x.beginPath();x.arc(0,0,20,0,6.3);x.fill();x.restore();
  x.strokeStyle='#050403';x.lineWidth=3;for(let k=0;k<70;k++){x.beginPath();let px=R()*w,py=R()*h;x.moveTo(px,py);x.lineTo(px+(R()-.5)*70,py+(R()-.5)*70);x.stroke();}x.lineWidth=6;x.strokeRect(0,0,w,h);for(const y of[h*.55,h*.78]){x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke();}x.beginPath();x.moveTo(w/2,h*.55);x.lineTo(w/2,h);x.stroke();
  x.globalCompositeOperation='multiply';const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#fff');g.addColorStop(1,'#999');x.fillStyle=g;x.fillRect(0,0,w,h);});
 const banner=canvasTex(128,256,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#4a0e0a';x.beginPath();x.moveTo(0,0);x.lineTo(w,0);x.lineTo(w,h*.8);for(let i=8;i>=0;i--)x.lineTo(i*w/8,h*.8+(i%2?h*.18:R()*h*.12));x.closePath();x.fill();
  for(let k=0;k<900;k++){x.fillStyle=`rgba(0,0,0,${R()*.25})`;x.fillRect(R()*w,R()*h*.95,2,2);}x.strokeStyle='#a87a30';x.lineWidth=4;x.strokeRect(8,8,w-16,h*.7);
  x.save();x.translate(w/2,h*.36);x.fillStyle='#c89a40';for(let i=0;i<10;i++){x.rotate(Math.PI/5);x.beginPath();x.moveTo(0,8);x.lineTo(-5,34);x.lineTo(5,34);x.closePath();x.fill();}x.beginPath();x.arc(0,0,14,0,6.3);x.fill();x.fillStyle='#2a0604';x.beginPath();x.arc(0,0,7,0,6.3);x.fill();x.restore();
  for(let k=0;k<6;k++){x.globalCompositeOperation='destination-out';x.beginPath();x.arc(R()*w,R()*h*.8,3+R()*7,0,6.3);x.fill();}x.globalCompositeOperation='source-over';});
 const iron=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#4a4846';x.fillRect(0,0,w,h);noiseDots(x,w,h,3000,.12);for(let k=0;k<30;k++){x.fillStyle=`rgba(${90+R()*40|0},${40+R()*20|0},10,${.2+R()*.3})`;x.beginPath();x.arc(R()*w,R()*h,2+R()*8,0,6.3);x.fill();}});
 return TX={wall,floor,dirt,wood,glass,banner,iron};}
function rep(t,u,v){const c=t.clone();c.repeat.set(u,v);c.needsUpdate=true;return c;}

/* ================= merged static builder ================= */
class Builder{constructor(scene){this.scene=scene;this.B=new Map();this.meshes=[];}
 add(mat,geo,shadow=true,recv=true){if(!this.B.has(mat))this.B.set(mat,{list:[],shadow,recv});const b=this.B.get(mat);if(!geo.attributes.uv){geo.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));}b.list.push(geo);return geo;}
 flush(){for(const[mat,{list,shadow,recv}]of this.B){const g=mergeGeos(list);g.computeBoundingSphere();const m=new THREE.Mesh(g,mat);m.castShadow=shadow;m.receiveShadow=recv;m.matrixAutoUpdate=false;m.updateMatrix();this.scene.add(m);this.meshes.push(m);}this.B.clear();}}
// box with world-scaled UVs (one texture tile per `ts` metres)
function wbox(x0,y0,z0,x1,y1,z1,ts=4){const w=x1-x0,h=y1-y0,d=z1-z0;const g=new THREE.BoxGeometry(w,h,d);const uv=g.attributes.uv;
 const dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*dims[f][0]/ts+(f<2?z0:x0)/ts,uv.getY(k)*dims[f][1]/ts+(f===2||f===3?z0:y0)/ts);}
 g.translate((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);return g;}
function scaleUV(g,s){const uv=g.attributes.uv;if(!uv)return g;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*s,uv.getY(i)*s);return g;}
const xf=(g,x,y,z,rx=0,ry=0,rz=0,s=1)=>{g.applyMatrix4(new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),typeof s==='number'?new V(s,s,s):s));return g;};
// pointed (gothic) arch outline from springing line y0, half-span a, apex height y0+rise
function pointedPts(a,y0,rise,n=10){if(rise<a*1.05){const E=[];for(let i=0;i<=n*2;i++){const t=Math.PI*i/(n*2);E.push(new THREE.Vector2(-a*Math.cos(t),y0+rise*Math.sin(t)));}return E;}const xc=(rise*rise-a*a)/(2*a),R0=xc+a,t1=Math.atan2(rise,-xc);const Lp=[];
 for(let i=0;i<=n;i++){const t=Math.PI+(t1-Math.PI)*i/n;Lp.push(new THREE.Vector2(xc+R0*Math.cos(t),y0+R0*Math.sin(t)));}
 const Rp=[];for(let i=n-1;i>=0;i--)Rp.push(new THREE.Vector2(-Lp[i].x,Lp[i].y));return Lp.concat(Rp);}
// a wall panel (w×h, centred on x=0, base y=0) pierced by a pointed opening
function archPanel(w,h,ow,oh,depth,rise){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();
 const hole=new THREE.Path();const pts=pointedPts(ow/2,oh-rise,rise);hole.moveTo(-ow/2,0);hole.lineTo(-ow/2,oh-rise);for(const p of pts)hole.lineTo(p.x,p.y);hole.lineTo(ow/2,0);hole.closePath();s.holes.push(hole);
 const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:4});g.translate(0,0,-depth/2);return scaleUV(g,.25);}
// pointed rib (tube) between two points at springing height, apex lifted by rise
function rib(x0,z0,x1,z1,y,rise,r=.16){const a=Math.hypot(x1-x0,z1-z0)/2;const pts=pointedPts(a,0,rise,8);const dx=(x1-x0)/(2*a),dz=(z1-z0)/(2*a),cx=(x0+x1)/2,cz=(z0+z1)/2;
 const v3=pts.map(p=>new V(cx+dx*p.x,y+p.y,cz+dz*p.x));return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v3),24,r,5);}

/* ================= shaders: god-ray shafts, ground fog, fog walls, sky ================= */
const SHAFT_VS='varying vec2 vUv;varying vec3 vW;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}';
const SHAFT_FS=`uniform float uT,uA;uniform vec3 uCol;varying vec2 vUv;varying vec3 vW;
 float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){float e=1.-abs(vUv.x*2.-1.);e=smoothstep(0.,.8,e);float l=pow(1.-vUv.y,1.4)*smoothstep(0.,.08,vUv.y)*smoothstep(1.,.85,vUv.y);float d=.65+.35*n(vec2(vW.x*.6+uT*.15,vW.y*.4-uT*.1))*n(vec2(vW.z*.5,vW.y*.3+uT*.08));
  gl_FragColor=vec4(uCol*e*l*d*uA,1.);}`;
export const U={uT:{value:0}};
function shaftMat(col,a){return new THREE.ShaderMaterial({uniforms:{uT:U.uT,uA:{value:a},uCol:{value:new THREE.Color(col)}},vertexShader:SHAFT_VS,fragmentShader:SHAFT_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false});}
const FOG_FS=`uniform float uT,uA;uniform vec3 uCol;varying vec2 vUv;varying vec3 vW;
 float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fb(vec2 p){return n(p)*.5+n(p*2.1)*.27+n(p*4.3)*.14;}
 void main(){vec2 p=vW.xz*.11;float f=fb(p+vec2(uT*.03,uT*.017))*fb(p*1.7-vec2(uT*.02,0.));float e=smoothstep(0.,.12,vUv.x)*smoothstep(1.,.88,vUv.x)*smoothstep(0.,.12,vUv.y)*smoothstep(1.,.88,vUv.y);
  gl_FragColor=vec4(uCol,clamp(f*1.9-.12,0.,1.)*uA*e);}`;
function fogMat(a,col=0x8a94a8){return new THREE.ShaderMaterial({uniforms:{uT:U.uT,uA:{value:a},uCol:{value:new THREE.Color(col)}},vertexShader:SHAFT_VS,fragmentShader:FOG_FS,transparent:true,depthWrite:false,fog:false});}
const WALL_FS=`uniform float uT,uA;varying vec2 vUv;varying vec3 vW;
 float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){vec2 p=vUv*vec2(3.,5.);float a=n(p+vec2(sin(uT*.7+p.y)*.6,-uT*.5))*.6+n(p*2.3+vec2(uT*.3,-uT*.9))*.4;float e=smoothstep(0.,.15,vUv.x)*smoothstep(1.,.85,vUv.x)*smoothstep(1.,.75,vUv.y);
  vec3 c=mix(vec3(.4,.37,.32),vec3(1.1,.98,.72),a);float cd=smoothstep(1.2,7.,distance(cameraPosition,vW));gl_FragColor=vec4(c*(.18+a*.45)*e*uA*cd,1.);}`;
const SKY_VS='varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*viewMatrix*vec4((modelMatrix*vec4(position,1.)).xyz,1.);gl_Position=p.xyww;}';
const SKY_FS=`uniform vec3 uMoon;uniform float uT,uRed;varying vec3 vD;
 float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=n(p)*a;p*=2.03;a*=.5;}return s;}
 void main(){vec3 d=normalize(vD);float y=max(d.y,-.1);vec3 top=mix(vec3(.012,.016,.03),vec3(.05,.012,.01),uRed),hor=mix(vec3(.09,.1,.13),vec3(.3,.08,.03),uRed);vec3 c=mix(hor,top,pow(clamp(y,0.,1.),.55));
  float m=max(dot(d,uMoon),0.);c+=vec3(.55,.6,.75)*pow(m,180.)*mix(1.,.0,uRed)*3.+vec3(.25,.3,.42)*pow(m,9.)*.35*(1.-uRed)+vec3(1.,.3,.08)*pow(m,9.)*.5*uRed;float disc=smoothstep(.9993,.9996,m);c=mix(c,mix(vec3(1.6,1.65,1.8),vec3(2.4,.6,.15),uRed),disc);
  vec2 q=d.xz/(d.y+.25)*1.4;float cl=fb(q+vec2(uT*.01,uT*.004));cl=smoothstep(.42,.85,cl);c=mix(c,mix(vec3(.03,.035,.05),vec3(.08,.03,.02),uRed)+vec3(.2,.22,.28)*pow(m,6.)*.4,cl*smoothstep(-.05,.25,d.y)*.9);
  gl_FragColor=vec4(c,1.);}`;

/* ================= the level ================= */
export function buildLevel(scene,phys){const T=tex(),B=new Builder(scene);
 const mWall=new THREE.MeshStandardMaterial({color:0xb4aea4,roughness:.92,map:T.wall,bumpMap:T.wall,bumpScale:2.5});
 const mWall2=new THREE.MeshStandardMaterial({color:0x8a8680,roughness:.95,map:T.wall,bumpMap:T.wall,bumpScale:2.5});
 const mFloor=new THREE.MeshStandardMaterial({color:0xa8a49c,roughness:.85,map:T.floor,bumpMap:T.floor,bumpScale:2});
 const mDirt=new THREE.MeshStandardMaterial({color:0xa09888,roughness:.95,map:T.dirt,bumpMap:T.dirt,bumpScale:3});
 const mTrim=new THREE.MeshStandardMaterial({color:0x9a958c,roughness:.8,map:T.wall,bumpMap:T.wall,bumpScale:1.5});
 const mWood=new THREE.MeshStandardMaterial({color:0x8a7a68,roughness:.85,map:T.wood,bumpMap:T.wood,bumpScale:2});
 const mIron=new THREE.MeshStandardMaterial({color:0x6a6662,metalness:.75,roughness:.55,map:T.iron});
 const mGlass=new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:T.glass,emissiveIntensity:1.5,roughness:.4,map:T.glass});
 const mBanner=new THREE.MeshStandardMaterial({color:0xffffff,map:T.banner,alphaTest:.5,side:THREE.DoubleSide,roughness:.9});
 const mStatue=new THREE.MeshStandardMaterial({color:0x8a8780,roughness:.9,map:rigTex().stone,bumpMap:rigTex().stone,bumpScale:2});
 const mBone=std(0xb8ae94,{r:.7}),mEmber=std(0x000000,{e:0xff6a1a,ei:2.6}),mCandle=std(0xd8ccb0,{r:.6}),mFlame=std(0x000000,{e:0xffb050,ei:5}),mDark=std(0x0a0a0c,{r:1}),mLava=std(0x000000,{e:0xff4a0a,ei:2.2});
 const L={phys,shrines:[],gates:[],levers:[],fogs:[],torches:[],braziers:[],candles:[],shafts:[],fogPlanes:[],banners:[],items:[],spawns:[],bosses:[],zones:[],B,mats:{mGlass,mLava,mEmber}};
 const wall=(x0,z0,x1,z1,y0,y1,mat=mWall,col=true)=>{B.add(mat,wbox(x0,y0,z0,x1,y1,z1));if(col)phys.box(x0,y0,z0,x1,y1,z1,{tag:'wall'});};
 // straight wall with door gaps: along X at fixed z (axis 'x') or along Z at fixed x; gaps [[a,b,doorH]]; adds arch frames over gaps
 const run=(axis,c,a0,a1,y0,h,th,gaps=[],mat=mWall,o={})=>{let s=a0;const segs=[];for(const g of gaps.slice().sort((p,q)=>p[0]-q[0])){segs.push([s,g[0]]);s=g[1];}segs.push([s,a1]);
  for(const[a,b]of segs)if(b-a>.01){axis==='x'?wall(a,c-th/2,b,c+th/2,y0,y0+h,mat):wall(c-th/2,a,c+th/2,b,y0,y0+h,mat);}
  for(const g of gaps){const dh=g[2]||5,w=g[1]-g[0],m=(g[0]+g[1])/2;// lintel + arch panel + jamb trims
   const pane=archPanel(w+1.6,Math.min(h,dh+2.2)-0+0,w,dh,th+.3,w*.55);xf(pane,axis==='x'?m:c,y0,axis==='x'?c:m,0,axis==='x'?0:Math.PI/2,0);B.add(mTrim,pane);
   if(h>dh+2.2)axis==='x'?wall(g[0],c-th/2,g[1],c+th/2,y0+dh+2.2,y0+h,mat,false):wall(c-th/2,g[0],c+th/2,g[1],y0+dh+2.2,y0+h,mat,false);
   if(axis==='x')phys.box(g[0],y0+dh,c-th/2,g[1],y0+h,c+th/2,{tag:'lintel'});else phys.box(c-th/2,y0+dh,g[0],c+th/2,y0+h,g[1],{tag:'lintel'});}
  // cornice band + buttresses
  if(!o.noTrim){axis==='x'?B.add(mTrim,wbox(a0,y0+h-.35,c-th/2-.18,a1,y0+h,c+th/2+.18)):B.add(mTrim,wbox(c-th/2-.18,y0+h-.35,a0,c+th/2+.18,y0+h,a1));
   axis==='x'?B.add(mTrim,wbox(a0,y0,c-th/2-.12,a1,y0+.5,c+th/2+.12)):B.add(mTrim,wbox(c-th/2-.12,y0,a0,c+th/2+.12,y0+.5,a1));}
  if(o.crenel){for(let p=a0+.5;p<a1-.5;p+=1.6){if(gaps.some(g=>p>g[0]-1&&p<g[1]+1))continue;axis==='x'?B.add(mTrim,wbox(p,y0+h,c-th/2,p+.8,y0+h+.7,c+th/2)):B.add(mTrim,wbox(c-th/2,y0+h,p,c+th/2,y0+h+.7,p+.8));}}
  if(o.broken){for(let p=a0;p<a1;p+=rr(1.2,2.6)){const bh=rr(-2.5,.4);if(bh>0)axis==='x'?B.add(mWall,wbox(p,y0+h,c-th/2,p+rr(.6,1.4),y0+h+bh,c+th/2)):B.add(mWall,wbox(c-th/2,y0+h,p,c+th/2,y0+h+bh,p+rr(.6,1.4)));}}};
 const floorRect=(x0,z0,x1,z1,y=0,mat=mFloor,ts=4)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0).rotateX(-Math.PI/2);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)*(x1-x0)+x0)/ts,(uv.getY(i)*(z1-z0)-z1)/ts);g.translate((x0+x1)/2,y,(z0+z1)/2);B.add(mat,g,false,true);};
 const ceil=(x0,z0,x1,z1,y,holes=[])=>{// wooden-beamed roof slab with broken holes
  const cells=[];for(let z=z0;z<z1;z+=4)for(let x=x0;x<x1;x+=4){const cx=x+2,cz=z+2;if(holes.some(h=>cx>h[0]&&cx<h[2]&&cz>h[1]&&cz<h[3]))continue;cells.push([x,z]);}
  for(const[x,z]of cells)B.add(mWall2,wbox(x,y,z,Math.min(x1,x+4),y+.6,Math.min(z1,z+4)));
  for(let z=z0+2;z<z1;z+=4){B.add(mWood,wbox(x0,y-.5,z-.2,x1,y,z+.2),true);}};
 // clustered gothic pier: core + 4 shafts, plinth, capital
 const pier=(x,z,h,r=.55,y0=0,broken=0)=>{const H=broken?h*broken:h;B.add(mTrim,xf(new THREE.CylinderGeometry(r*1.45,r*1.6,.7,12),x,y0+.35,z));B.add(mTrim,xf(new THREE.BoxGeometry(r*3.1,.3,r*3.1),x,y0+.15,z));
  B.add(mWall,scaleUV(xf(new THREE.CylinderGeometry(r,r,H,14),x,y0+H/2+.5,z),.5));for(let i=0;i<4;i++){const a=i/4*6.283+.785;B.add(mTrim,scaleUV(xf(new THREE.CylinderGeometry(r*.34,r*.34,H,8),x+Math.cos(a)*r*.95,y0+H/2+.5,z+Math.sin(a)*r*.95),.5));}
  if(!broken){B.add(mTrim,xf(new THREE.CylinderGeometry(r*1.5,r*1.05,.7,12),x,y0+H+.6,z));B.add(mTrim,xf(new THREE.BoxGeometry(r*3.2,.3,r*3.2),x,y0+H+1.05,z));}
  else{B.add(mWall,xf(new THREE.ConeGeometry(r*1.1,.9,7),x,y0+H+.9,z,0,R()*3,.3));}
  phys.cyl(x,z,r*1.25,y0,y0+H+1,{tag:'pier'});};
 const rubble=(x,z,n,s=1,y=0)=>{for(let i=0;i<n;i++){const g=new THREE.DodecahedronGeometry(rr(.15,.55)*s,0);xf(g,x+rr(-1.4,1.4)*s,y+rr(0,.25)*s,z+rr(-1.4,1.4)*s,R()*3,R()*3,R()*3,new V(1,rr(.5,.9),rr(.7,1.1)));B.add(mWall2,scaleUV(g,.4));}};
 const fallen=(x,z,len,yaw,r=.5)=>{B.add(mWall,scaleUV(xf(new THREE.CylinderGeometry(r,r,len,12),x,r,z,0,yaw,Math.PI/2),.4));phys.cbox(x,0,z,Math.abs(Math.cos(yaw))*len+r,r*1.6,Math.abs(Math.sin(yaw))*len+r,{tag:'deb'});};
 const torch=(x,y,z,yaw)=>{// iron sconce on a wall, flame comes from particles + pooled lights
  B.add(mIron,xf(new THREE.BoxGeometry(.08,.08,.45),x-Math.sin(yaw)*.2,y-.15,z-Math.cos(yaw)*.2,-.5,yaw,0));B.add(mIron,xf(new THREE.CylinderGeometry(.13,.06,.22,8),x,y,z));B.add(mEmber,xf(new THREE.SphereGeometry(.09,8,6),x,y+.1,z),false);L.torches.push({x,y:y+.25,z,s:1});};
 const brazier=(x,z,y=0,s=1)=>{B.add(mIron,xf(new THREE.CylinderGeometry(.08*s,.14*s,1.1*s,8),x,y+.55*s,z));for(let i=0;i<3;i++){const a=i/3*6.283;B.add(mIron,xf(new THREE.BoxGeometry(.06*s,.06*s,.7*s),x+Math.cos(a)*.25*s,y+.25*s,z+Math.sin(a)*.25*s,.7,-a+Math.PI/2,0));}
  B.add(mIron,xf(new THREE.CylinderGeometry(.55*s,.3*s,.4*s,12,1,true),x,y+1.25*s,z));B.add(mEmber,xf(new THREE.CylinderGeometry(.5*s,.5*s,.08*s,12),x,y+1.35*s,z),false);L.torches.push({x,y:y+1.6*s,z,s:1.6*s,brazier:true});phys.cyl(x,z,.45*s,y,y+1.4*s,{tag:'brazier'});};
 const candles=(x,z,y,n,spread=.5)=>{for(let i=0;i<n;i++){const h=rr(.08,.35),cx=x+rr(-spread,spread),cz=z+rr(-spread,spread);B.add(mCandle,xf(new THREE.CylinderGeometry(.035,.04,h,6),cx,y+h/2,cz));B.add(mFlame,xf(new THREE.ConeGeometry(.025,.07,5),cx,y+h+.04,cz),false);if(i%4===0)L.candles.push({x:cx,y:y+h+.06,z:cz});}};
 const window_=(x,z,y,w,h,face)=>{// stained lancet set into a wall, face = yaw the glass looks towards
  const g=new THREE.PlaneGeometry(w,h);const pos=g.attributes.position;// pointed top
  const fr=archPanel(w+.8,h+.6,w,h,.35,w*.6);xf(fr,x,y-.3,z,0,face,0);B.add(mTrim,fr);
  const s=new THREE.Shape();const pts=pointedPts(w/2,h-w*.6,w*.6);s.moveTo(-w/2,0);s.lineTo(-w/2,h-w*.6);for(const p of pts)s.lineTo(p.x,p.y);s.lineTo(w/2,0);s.closePath();const sg=new THREE.ShapeGeometry(s,6);const uv=sg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/w+.5,uv.getY(i)/h);
  xf(sg,x+Math.sin(face)*.02,y-.3,z+Math.cos(face)*.02,0,face,0);B.add(mGlass,sg,false,false);};
 const shaft=(x,y,z,dir,len,w,col=0xb8c8ff,a=.22)=>{// volumetric light shaft from (x,y,z) along dir
  const g=new THREE.PlaneGeometry(w,len,1,1);g.translate(0,-len/2,0);const g2=g.clone().rotateY(Math.PI/2);const m=new THREE.Mesh(mergeGeos([g,g2]),shaftMat(col,a));const q=new THREE.Quaternion().setFromUnitVectors(new V(0,-1,0),dir.clone().normalize());m.quaternion.copy(q);m.position.set(x,y,z);m.renderOrder=7;scene.add(m);L.shafts.push(m);};
 const fogPlane=(x0,z0,x1,z1,y,a=.45)=>{const g=new THREE.PlaneGeometry(x1-x0,z1-z0).rotateX(-Math.PI/2);const m=new THREE.Mesh(g,fogMat(a));m.position.set((x0+x1)/2,y,(z0+z1)/2);m.renderOrder=6;scene.add(m);L.fogPlanes.push(m);};
 const banner=(x,y,z,yaw,w=1.2,h=3)=>{const g=new THREE.PlaneGeometry(w,h,1,4);g.translate(0,-h/2,0);const m=new THREE.Mesh(g,mBanner);m.position.set(x,y,z);m.rotation.y=yaw;m.castShadow=true;scene.add(m);L.banners.push({m,ph:R()*6});
  B.add(mIron,xf(new THREE.CylinderGeometry(.03,.03,w+.3,6),x,y,z,0,yaw,Math.PI/2));};
 const statue=(x,z,yaw,y=0,pose='kneel',s=1.25)=>{const r=makeRig('knight');const st={mode:pose==='kneel'?'kneel':'idle',t:0,speed:0,atk:pose==='point'?{name:'point',p:1}:pose==='raise'?{name:'cast',p:.5}:null};for(let i=0;i<40;i++)animate(r,st,.1);
  if(pose==='kneel'){const sw=makeGreatsword();r.j.handR.add(sw);sw.position.set(0,-.05,0);sw.rotation.set(1.6,0,0);}
  r.root.scale.setScalar(s);const g=bakeRig(r);xf(g,x,y,z,0,yaw,0);B.add(mStatue,scaleUV(g,2));B.add(mTrim,wbox(x-.9*s,y-.01,z-.9*s,x+.9*s,y+.4,z+.9*s));phys.cyl(x,z,.8*s,y,y+2.4*s,{tag:'statue'});};
 const grave=(x,z,yaw)=>{const t=R();if(t<.5){B.add(mWall2,scaleUV(xf(new THREE.BoxGeometry(.7,1.1,.18),x,.5,z,rr(-.15,.15),yaw,rr(-.12,.12)),.3));B.add(mWall2,xf(new THREE.CylinderGeometry(.35,.35,.18,10,1,false,0,Math.PI),x,1.05,z,Math.PI/2,yaw,Math.PI/2));}
  else{B.add(mWall2,xf(new THREE.BoxGeometry(.14,1.4,.14),x,.7,z,rr(-.2,.2),yaw,rr(-.2,.2)));B.add(mWall2,xf(new THREE.BoxGeometry(.7,.14,.14),x,1.05,z,0,yaw,rr(-.1,.1)));}B.add(mDirt,xf(new THREE.BoxGeometry(.8,.12,1.6),x,.05,z+.0,0,yaw,0));};
 const tree=(x,z,s=1)=>{const parts=[];const br=(p,d,len,r,depth)=>{const e=p.clone().addScaledVector(d,len);const g=new THREE.CylinderGeometry(r*.65,r,len,6);g.translate(0,len/2,0);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),d));g.translate(p.x,p.y,p.z);parts.push(g);
   if(depth>0)for(let i=0;i<(depth>2?2:3);i++){const nd=d.clone().add(new V(rr(-.9,.9),rr(-.1,.6),rr(-.9,.9))).normalize();br(e,nd,len*rr(.55,.75),r*.62,depth-1);}};br(new V(x,0,z),new V(rr(-.1,.1),1,rr(-.1,.1)).normalize(),2.6*s,.32*s,4);for(const g of parts)B.add(mWood,g);phys.cyl(x,z,.4*s,0,4,{tag:'tree'});};
 const chain=(x,y,z,len)=>{for(let i=0;i<len/.16;i++)B.add(mIron,xf(new THREE.TorusGeometry(.06,.016,4,8),x,y-i*.16,z,0,i%2?Math.PI/2:0,0));};
 const pew=(x,z,yaw,broken)=>{B.add(mWood,xf(wbox(-1.6,.4,-.25,1.6,.5,.25,2),x,0,z,0,yaw,broken?.15:0));B.add(mWood,xf(wbox(-1.6,.5,.18,1.6,1.1,.26,2),x,0,z,0,yaw,0));for(const s of[-1.5,1.5])B.add(mWood,xf(wbox(s-.06,0,-.25,s+.06,.5,.25,2),x,0,z,0,yaw,0));phys.cbox(x,0,z,Math.abs(Math.cos(yaw))*3.2+.5,1,Math.abs(Math.sin(yaw))*3.2+.5,{tag:'pew'});};
 const steps=(x0,x1,z0,z1,y0,y1,n)=>{const dz=(z1-z0)/n,dy=(y1-y0)/n;for(let i=0;i<n;i++){const top=y0+dy*(i+1);B.add(mTrim,wbox(x0,y0-.1,z0+dz*i,x1,top,z0+dz*(i+1),2));phys.box(x0,y0-1,z0+dz*i,x1,top,z0+dz*(i+1),{tag:'step'});}};
 const platform=(x0,z0,x1,z1,y,mat=mFloor)=>{B.add(mWall2,wbox(x0,-1,z0,x1,y-.02,z1));floorRect(x0,z0,x1,z1,y,mat);phys.box(x0,-1,z0,x1,y,z1,{tag:'plat'});};

 /* ---------- interactables ---------- */
 const shrine=(x,z,y,name,lit)=>{const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);const sb=[];
  const mound=new THREE.ConeGeometry(.9,.45,14,2);const p=mound.attributes.position;for(let i=0;i<p.count;i++){if(p.getY(i)<.2)p.setXYZ(i,p.getX(i)*(1+R()*.25),p.getY(i),p.getZ(i)*(1+R()*.25));}mound.computeVertexNormals();
  const ash=new THREE.Mesh(mound,std(0x3a3632,{r:1}));ash.position.y=.2;ash.receiveShadow=true;g.add(ash);
  for(let i=0;i<9;i++){const a=i/9*6.283;const st=new THREE.Mesh(new THREE.BoxGeometry(.32,rr(.5,1.1),.22),mTrim);st.position.set(Math.cos(a)*1.65,.3,Math.sin(a)*1.65);st.rotation.set(rr(-.15,.15),-a,rr(-.15,.15));st.castShadow=true;g.add(st);}
  for(let i=0;i<7;i++){const b=new THREE.Mesh(new THREE.CapsuleGeometry(.04,.3,2,5),mBone);b.position.set(rr(-.6,.6),.12,rr(-.6,.6));b.rotation.set(Math.PI/2,R()*3,0);g.add(b);}
  const sk=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),mBone);sk.position.set(.45,.15,.3);g.add(sk);
  const sw=makeLongsword();sw.scale.setScalar(1.5);sw.position.set(0,1.62,0);sw.rotation.set(Math.PI/2+.12,0,.08);g.add(sw);
  const coreMat=std(0x000000,{e:0xff7a2a,ei:lit?3:0});const core=new THREE.Mesh(new THREE.SphereGeometry(.28,10,8),coreMat);core.position.y=.42;core.scale.y=.6;g.add(core);
  const s={x,y,z,name,lit,g,coreMat,id:L.shrines.length,usable:lit};L.shrines.push(s);phys.cyl(x,z,.85,y,y+.6,{tag:'shrine'});return s;};
 const gate=(x,z,y,w,h,axis,name)=>{// iron portcullis: slides up when opened
  const g=new THREE.Group();g.position.set(x,y,z);if(axis==='z')g.rotation.y=Math.PI/2;scene.add(g);const parts=[];for(let i=0;i<=Math.round(w/.4);i++){const bx=-w/2+i*w/Math.round(w/.4);parts.push(xf(new THREE.BoxGeometry(.07,h,.07),bx,h/2,0));parts.push(xf(new THREE.ConeGeometry(.06,.25,4),bx,-.1,0,Math.PI,0,0));}
  for(let j=1;j<5;j++)parts.push(xf(new THREE.BoxGeometry(w,.09,.09),0,j*h/5,0));const m=new THREE.Mesh(mergeGeos(parts),mIron);m.castShadow=true;g.add(m);
  const col=axis==='z'?phys.box(x-.25,y,z-w/2,x+.25,y+h,z+w/2,{tag:'gate',dyn:true}):phys.box(x-w/2,y,z-.25,x+w/2,y+h,z+.25,{tag:'gate',dyn:true});
  const G={x,y,z,w,h,axis,g,col,open:false,k:0,name};L.gates.push(G);return G;};
 const lever=(x,z,y,yaw,gateRef,label)=>{const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=yaw;scene.add(g);const base=new THREE.Mesh(new THREE.BoxGeometry(.5,1,.4),mTrim);base.position.y=.5;base.castShadow=true;g.add(base);
  const arm=new THREE.Group();arm.position.set(0,.95,0);g.add(arm);const st=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.9,6),mIron);st.position.y=.45;arm.add(st);const kn=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),mIron);kn.position.y=.9;arm.add(kn);arm.rotation.x=-.7;
  const Lv={x,y,z,yaw,g,arm,gate:gateRef,pulled:false,label};L.levers.push(Lv);phys.cbox(x,y,z,.5,1,.5,{tag:'lever'});return Lv;};
 const fogWall=(x,z,y,w,h,axis,name)=>{const g=new THREE.PlaneGeometry(w,h);g.translate(0,h/2,0);const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:{uT:U.uT,uA:{value:1}},vertexShader:SHAFT_VS,fragmentShader:WALL_FS,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,toneMapped:false}));
  m.position.set(x,y,z);if(axis==='z')m.rotation.y=Math.PI/2;m.renderOrder=8;scene.add(m);const col=axis==='z'?phys.box(x-.3,y,z-w/2,x+.3,y+h,z+w/2,{tag:'fog',dyn:true}):phys.box(x-w/2,y,z-.3,x+w/2,y+h,z+.3,{tag:'fog',dyn:true});
  const F={x,y,z,w,h,axis,m,col,name,state:'open'};L.fogs.push(F);return F;};// state: open (passable by E) | sealed (boss active) | gone
 const item=(x,z,y,kind,label)=>{L.items.push({x,y,z,kind,label,taken:false});};

 /* ================= A · ASHEN YARD (start) ================= */
 L.zones.push({name:'Ashen Yard',x0:-14,z0:-8,x1:14,z1:26,out:true});
 floorRect(-14,-8,14,26,0,mDirt,6);
 run('x',-8,-15,15,0,8,1,[],mWall,{crenel:true});run('z',14,-8,26,0,7,1,[],mWall,{broken:true});run('z',-14,-8,8,0,7,1,[],mWall,{broken:true});run('z',-14,8,26,0,7,1,[[13,19,4.5]],mWall,{broken:true});
 run('x',26,-14,14,0,12,1.2,[[-2.6,2.6,6]]);
 for(const[x,z,y]of[[-10,-3,0],[-8,4,1],[-11,10,2],[9,-2,3],[11,6,4],[8,13,5],[10,20,6],[-9,21,0],[6,-5,1],[-5,-6,2]])grave(x,z,y*.3+rr(-.2,.2));
 tree(-9,15,1.1);tree(10.5,1,1);rubble(-12,0,10);rubble(12,15,12);rubble(-12.5,24,8);fallen(6,9,4.5,.6,.45);pier(-10,24,6,.5,0,.5);pier(10,24,6,.5,0,.7);
 statue(-6,22,Math.PI-.3,0,'kneel');statue(6,22,Math.PI+.3,0,'kneel');brazier(-3.8,23.4);brazier(3.8,23.4);
 const S1=shrine(0,4,0,'Ashen Yard',true);
 const G1=gate(0,26,0,5.2,6,'x','yard gate');torch(-13.3,3.2,4,Math.PI/2);torch(13.3,3.2,10,-Math.PI/2);
 fogPlane(-14,-8,14,26,.35,.5);fogPlane(-14,-8,14,26,.9,.28);
 item(11,21,0,'shard','Ember Shard');

 /* ================= B · WEST CLOISTER ================= */
 L.zones.push({name:'West Cloister',x0:-26,z0:8,x1:-14,z1:66});
 floorRect(-26,8,-14,66,0,mFloor);run('z',-26,8,66,0,7,1);run('x',8,-26,-14,0,7,1);run('x',66,-26,-12,0,7,1);
 wall(-14.5,26,-11.5,58,0,13);wall(-14.5,63,-11.5,66,0,13);B.add(mTrim,wbox(-14.5,0,58,-11.5,.5,63));phys.box(-14.5,5,58,-11.5,13,63,{tag:'lintel'});
 B.add(mWall,wbox(-14.5,5,58,-11.5,13,63));
 for(let z=12;z<=62;z+=6.5){pier(-24.2,z,5,.38);pier(-15.8,z,5,.38);}
 for(let z=12;z<62;z+=6.5){B.add(mTrim,rib(-24.2,z,-24.2,z+6.5,5.9,1.4,.14));B.add(mTrim,rib(-15.8,z,-15.8,z+6.5,5.9,1.4,.14));B.add(mTrim,rib(-24.2,z,-15.8,z,5.9,1.8,.14));}
 ceil(-26,8,-14,66,7.2,[[-26,26,-14,34],[-26,46,-14,50]]);
 shaft(-20,7.2,30,MOON.clone().negate(),9,3.4,0xa8b8e8,.26);shaft(-20,7.2,48,MOON.clone().negate(),9,2.6,0xa8b8e8,.22);
 for(const z of[16,29,42,55])torch(-25.4,3,z,Math.PI/2);rubble(-24,40,10);rubble(-17,58,8);fallen(-20,44,3.5,1.2,.35);
 for(let z=14;z<60;z+=11)banner(-14.6,6.4,z,-Math.PI/2,1,2.6);
 fogPlane(-26,8,-14,66,.3,.4);statue(-23.5,63.5,Math.PI*.75,0,'raise',1.1);

 /* ================= C · NAVE OF EMBERS ================= */
 L.zones.push({name:'Nave of Embers',x0:-12,z0:26,x1:12,z1:88});
 floorRect(-11.5,26,12,74,0,mFloor);run('z',12,26,88,0,15,1);run('x',88,-12,12,0,15,1.2,[[-3,3,6.5]]);
 for(let z=33;z<=81;z+=8){window_(11.4,z+4,4.5,1.8,6.5,-Math.PI/2);shaft(11.3,9,z+4,new V(-.62,-.62,.2+(z%16?.08:-.08)),15,2.2,0xffb27a,.13);}
 for(let z=33;z<=81;z+=8)window_(-11.4,z+4,8.2,1.4,4.2,Math.PI/2);
 for(let z=32;z<=80;z+=8){pier(-6.5,z,10,.62);pier(6.5,z,10,.62,0,z===56?.45:0);}
 for(let z=32;z<80;z+=8){B.add(mTrim,rib(-6.5,z,-6.5,z+8,11.2,2.6,.2));B.add(mTrim,rib(6.5,z,6.5,z+8,11.2,2.6,.2));B.add(mTrim,rib(-6.5,z,6.5,z,11.2,3.4,.2));B.add(mTrim,rib(-6.5,z,6.5,z+8,11.2,3.6,.13));B.add(mTrim,rib(6.5,z,-6.5,z+8,11.2,3.6,.13));}
 ceil(-12,26,12,88,15,[[-6,38,6,48],[-8,58,8,66],[-4,26,4,30]]);
 for(const[z,w]of[[43,9],[62,10]])shaft(0,15,z,MOON.clone().negate().add(new V(0,0,0)),17,w*.6,0xb0c4ff,.3);
 shaft(-3,15,43,MOON.clone().negate(),17,1.6,0xc8d8ff,.25);shaft(4,15,62,MOON.clone().negate(),17,1.8,0xc8d8ff,.25);
 rubble(1,45,16,1.2);rubble(-3,62,14,1.1);fallen(4,62,6,.35,.55);
 for(let z=36;z<70;z+=4.5){const br=R()<.35;pew(-3.1,z,0,br);if(!(z>58&&z<66))pew(3.1,z,0,R()<.3);}
 platform(-12,76,12,88,1.2);steps(-12,12,73.6,76,0,1.2,3);
 B.add(mTrim,wbox(-2.2,1.2,80,2.2,2.25,82.2));B.add(mDark,wbox(-2.3,2.25,79.9,2.3,2.3,82.3));phys.box(-2.2,1.2,80,2.2,2.25,82.2,{tag:'altar'});candles(0,81.1,2.3,22,1.8);candles(-9,86,1.2,12,1);candles(9,86,1.2,12,1);
 for(const x of[-8,8])brazier(x,77.5,1.2);for(let z=34;z<=82;z+=16){torch(-11.4,3.2,z-4,Math.PI/2);torch(11.4,3.2,z,-Math.PI/2);}
 for(const z of[40,56,72])banner(-6.5,9,z,0,1.6,4.2);for(const z of[40,56,72])banner(6.5,9,z,Math.PI,1.6,4.2);
 for(let i=0;i<5;i++)chain(rr(-5,5),15,rr(30,84),rr(3,8));
 fogPlane(-12,26,12,88,.3,.42);fogPlane(-12,26,12,88,1.0,.22);
 const L1=lever(4.6,27.6,0,Math.PI,G1,'PULL THE LEVER');statue(-10,27.8,0,0,'point',1.15);
 item(-9,74.5,0,'shard','Ember Shard');
 const F1=fogWall(0,88,1.2,6,6,'x','Bell Chapter');

 /* ================= D · BELL CHAPTER (boss 1) ================= */
 L.zones.push({name:'Bell Chapter',x0:-15,z0:88,x1:15,z1:118,arena:true});
 platform(-15,88.6,15,118,1.2);run('z',-15,88,118,1.2,15,1);run('z',15,88,118,1.2,15,1);run('x',118,-15,15,1.2,15,1.2,[[-3,3,6]]);
 for(const[x,z]of[[-12,91.5],[12,91.5],[-12,114.5],[12,114.5]])pier(x,z,11,.7,1.2);
 for(const[x,z]of[[-14.4,97],[-14.4,109]])window_(x,z,7,1.6,5.5,Math.PI/2);for(const[x,z]of[[14.4,97],[14.4,109]])window_(x,z,7,1.6,5.5,-Math.PI/2);
 B.add(mTrim,rib(-12,91.5,12,114.5,12.4,4,.24));B.add(mTrim,rib(12,91.5,-12,114.5,12.4,4,.24));B.add(mTrim,rib(-12,91.5,12,91.5,12.4,3,.2));B.add(mTrim,rib(-12,114.5,12,114.5,12.4,3,.2));B.add(mTrim,rib(-12,91.5,-12,114.5,12.4,3,.2));B.add(mTrim,rib(12,91.5,12,114.5,12.4,3,.2));
 ceil(-15,88,15,118,16.2,[[-6,96,6,110]]);
 {const bell=new THREE.LatheGeometry([[0,0],[1.4,0],[1.5,.2],[1.45,.6],[1.2,1.6],[1.0,2.6],[.95,3.0],[0,3.1]].map(([r,y])=>new THREE.Vector2(r,y)),24);bell.translate(0,-3.1,0);const bm=new THREE.Mesh(bell,new THREE.MeshStandardMaterial({color:0x6a5028,metalness:.9,roughness:.4,map:rigTex().metal,side:THREE.DoubleSide}));bm.position.set(0,15.6,103);bm.castShadow=true;scene.add(bm);L.bell=bm;chain(0,16.2,103,1.2);}
 shaft(0,16.2,103,MOON.clone().negate(),16,5,0xb8c8ff,.3);brazier(-8,93,1.2,1.2);brazier(8,93,1.2,1.2);brazier(-8,113,1.2,1.2);brazier(8,113,1.2,1.2);
 rubble(-10,104,10,1,1.2);rubble(11,98,8,1,1.2);fogPlane(-15,88,15,118,1.5,.4);
 const G2=gate(0,118,1.2,6,6,'x','chapter door');const S2=shrine(0,113,1.2,'Bell Chapter',false);
 L.bosses.push({kind:'bell',x:0,z:106,y:1.2,yaw:Math.PI,arena:{x0:-14,z0:89.5,x1:14,z1:117,y:1.2},fog:F1,exit:G2,shrine:S2,name:'VARGUL, THE BELLWARDEN',title:'Warden of the Bell Chapter'});

 /* ================= E · CINDER BRIDGE ================= */
 L.zones.push({name:'Cinder Bridge',x0:-3.5,z0:118,x1:3.5,z1:160,out:true});
 B.add(mWall2,wbox(-3.5,-3,118.6,3.5,1.18,160));floorRect(-3.5,118.6,3.5,160,1.2,mFloor);phys.box(-3.5,-3,118.6,3.5,1.2,160,{tag:'bridge'});
 phys.voids.push([-60,118.6,-3.5,160],[3.5,118.6,60,160]);
 for(const s of[-1,1]){const x=s*3.5;B.add(mTrim,wbox(x-.25,1.2,118.6,x+.25,2.2,160));phys.box(x-.3,1.2,118.6,x+.3,3.2,160,{tag:'parapet'});for(let z=119;z<160;z+=1.6)B.add(mTrim,wbox(x-.25,2.2,z,x+.25,2.7,z+.8));}
 for(let z=124;z<160;z+=12){B.add(mWall2,wbox(-3.2,-40,z-1.2,3.2,-3,z+1.2));B.add(mWall2,xf(archPanel(10,8,7,6,2,3),0,-11,z+6,0,0,0));}
 for(const[x,z,h,w]of[[-22,130,38,5],[24,142,44,6],[-30,154,30,7],[40,124,52,8],[-42,146,46,9]]){B.add(mWall2,wbox(x-w/2,-40,z-w/2,x+w/2,h-40,z+w/2));B.add(mWall2,xf(new THREE.ConeGeometry(w*.75,w*1.6,4),x,h-40+w*.8,z,0,.785,0));}
 for(const z of[126,140,154])for(const s of[-1,1])torch(s*3.4,2.8,z,s>0?-Math.PI/2:Math.PI/2);
 shaft(0,26,140,new V(.35,-1,-.1),30,6,0x9aaee0,.12);
 fogPlane(-60,118,60,160,-6,.6);fogPlane(-60,118,60,160,-14,.7);fogPlane(-3.5,118.6,3.5,160,1.6,.3);

 /* ================= F · GATE COURT, OSSUARY, ANTECHAMBER ================= */
 L.zones.push({name:'Gate Court',x0:-8,z0:160,x1:8,z1:170},{name:'Ossuary',x0:8,z0:160,x1:22,z1:196},{name:'Antechamber',x0:-8,z0:170,x1:8,z1:196});
 platform(-8,160,22,196,1.2);run('x',160,-8,-3.5,1.2,10,1);run('x',160,3.5,22,1.2,10,1);run('z',-8,160,196,1.2,10,1);run('z',22,160,196,1.2,10,1);run('x',196,8,22,1.2,10,1);
 run('z',8,160,196,1.2,10,1,[[162.8,168,4.6],[187.6,193,4.6]]);run('x',170,-8,8,1.2,10,1,[[-2.4,2.4,5]]);run('x',196,-8,8,1.2,12,1.2,[[-3,3,6.5]]);
 const G3=gate(0,170,1.2,4.8,5,'x','court gate');const L3=lever(-3.2,171.6,1.2,0,G3,'PULL THE LEVER');
 ceil(8,160,22,196,11.2,[[12,172,18,180]]);ceil(-8,170,8,196,11.2,[[-4,180,4,186]]);
 shaft(15,11.2,176,MOON.clone().negate(),11,3,0xa8b8f0,.28);shaft(0,11.2,183,MOON.clone().negate(),11,3,0xa8b8f0,.26);
 for(let i=0;i<6;i++){const x=rr(10,20),z=rr(164,194);for(let k=0;k<14;k++){const g=new THREE.CapsuleGeometry(.05,rr(.2,.4),2,5);xf(g,x+rr(-.7,.7),1.25+rr(0,.3),z+rr(-.7,.7),R()*3,R()*3,0);B.add(mBone,g);}for(let k=0;k<3;k++)B.add(mBone,xf(new THREE.SphereGeometry(.12,8,6),x+rr(-.5,.5),1.35+rr(0,.3),z+rr(-.5,.5)));}
 for(const[x,z]of[[13,186],[17,186],[13,168],[17,168]]){B.add(mTrim,wbox(x-.7,1.2,z-1.4,x+.7,2.1,z+1.4));B.add(mWall2,wbox(x-.8,2.1,z-1.5,x+.8,2.3,z+1.5));phys.box(x-.7,1.2,z-1.4,x+.7,2.3,z+1.4,{tag:'tomb'});}
 platform(18,176,21.5,184,3.2);steps(18,21.5,172,176,1.2,3.2,5);
 for(const z of[166,178,190])torch(21.4,4,z,-Math.PI/2);torch(-7.4,4,176,Math.PI/2);torch(-7.4,4,190,Math.PI/2);brazier(-5,193,1.2);brazier(5,193,1.2);candles(15,170,1.2,14,1.5);candles(-6.5,174,1.2,10,.6);
 statue(-6,186,Math.PI/2,1.2,'kneel',1.1);statue(6,186,-Math.PI/2,1.2,'kneel',1.1);for(const z of[176,186])banner(-7.4,8.5,z,Math.PI/2,1.1,3);
 fogPlane(-8,160,22,196,1.55,.42);item(20.5,180,3.2,'shard','Ember Shard');
 const F2=fogWall(0,196,1.2,6,6.5,'x','Hound Garden');

 /* ================= G · HOUND GARDEN (boss 2) ================= */
 L.zones.push({name:'Hound Garden',x0:-18,z0:196,x1:18,z1:232,out:true,arena:true});
 platform(-18,196.6,18,232,1.2,mDirt);run('z',-18,196,232,1.2,9,1,[],mWall,{broken:true});run('z',18,196,232,1.2,9,1,[],mWall,{broken:true});run('x',232,-18,18,1.2,10,1.2,[[-3,3,6]],mWall,{crenel:true});
 for(const[x,z]of[[-12,202],[12,202],[-12,226],[12,226],[-15,214],[15,214]])pier(x,z,7,.5,1.2,R()<.5?rr(.4,.8):0);
 tree(13.5,229,1.4);tree(-14.5,200,1.2);for(let i=0;i<8;i++)grave(rr(-16,-11),rr(205,228),rr(-.5,.5));
 {const fb=new THREE.CylinderGeometry(2.4,2.6,.7,20);B.add(mTrim,xf(fb,0,1.55,214));B.add(std(0x0a1418,{r:.1,m:.6}),xf(new THREE.CylinderGeometry(2.1,2.1,.1,20),0,1.82,214),false);B.add(mTrim,xf(new THREE.CylinderGeometry(.3,.4,1.6,10),0,2.4,214));phys.cyl(0,214,2.5,1.2,1.9,{tag:'fountain'});}
 brazier(-6,199,1.2,1.2);brazier(6,199,1.2,1.2);rubble(10,208,10,1,1.2);rubble(-9,222,10,1,1.2);fogPlane(-18,196,18,232,1.55,.5);fogPlane(-18,196,18,232,2.2,.25);
 const G4=gate(0,232,1.2,6,6,'x','garden gate');const S3=shrine(-11,229,1.2,'Hound Garden',false);
 L.bosses.push({kind:'mother',x:0,z:224,y:1.2,yaw:Math.PI,arena:{x0:-17,z0:197.5,x1:17,z1:231,y:1.2},fog:F2,exit:G4,shrine:S3,name:'GRISKA, MOTHER OF HOUNDS',title:'She who keeps the garden'});

 /* ================= H · CHOIR STAIR ================= */
 L.zones.push({name:'Choir Stair',x0:-4,z0:232,x1:4,z1:252});
 platform(-4.5,232,4.5,234,1.2);steps(-4.5,4.5,234,246,1.2,5.2,10);platform(-4.5,246,4.5,252.6,5.2);run('z',-4.5,232,252,1.2,14,1);run('z',4.5,232,252,1.2,14,1);
 for(let z=236;z<250;z+=4){torch(-4,3.2+(z-234)*.33,z,Math.PI/2);window_(4,z,8.5+(z-234)*.25,1,3,-Math.PI/2);}ceil(-4.5,232,4.5,252,15.2,[[-4,240,4,244]]);shaft(0,15.2,242,MOON.clone().negate(),11,2.6,0xb8c8ff,.3);
 run('x',252.6,-16,16,5.2,12,1.2,[[-3,3,6]]);const F3=fogWall(0,252.6,5.2,6,6,'x','Sanctum');

 /* ================= I · SANCTUM OF THE CANTOR (boss 3) ================= */
 L.zones.push({name:'Sanctum',x0:-16,z0:252,x1:16,z1:284,arena:true});
 platform(-16,253.2,16,284,5.2);run('z',-16,252,284,5.2,16,1);run('z',16,252,284,5.2,16,1);run('x',284,-16,16,5.2,16,1.2,[[-3,3,6]]);
 for(let z=258;z<=278;z+=10){pier(-11,z,12,.6,5.2);pier(11,z,12,.6,5.2);window_(-15.4,z+5,13,1.8,6,Math.PI/2);window_(15.4,z+5,13,1.8,6,-Math.PI/2);}
 window_(0,283.3,13,4,8,Math.PI);shaft(0,15,283,new V(0,-.55,-1),20,4,0xffa860,.16);
 for(let z=258;z<278;z+=10){B.add(mTrim,rib(-11,z,11,z+10,17.4,4,.2));B.add(mTrim,rib(11,z,-11,z+10,17.4,4,.2));B.add(mTrim,rib(-11,z,11,z,17.4,3.5,.2));}
 ceil(-16,252,16,284,21.2,[[-5,262,5,274]]);shaft(0,21.2,268,MOON.clone().negate(),18,5,0xc0d0ff,.32);
 {const r=new THREE.RingGeometry(3,3.3,48).rotateX(-Math.PI/2);B.add(mEmber,xf(r,0,5.23,268),false);const r2=new THREE.RingGeometry(6.8,7,64).rotateX(-Math.PI/2);B.add(mEmber,xf(r2,0,5.23,268),false);}
 for(const x of[-13,13])for(const z of[256,280])brazier(x,z,5.2,1.1);candles(-13,268,5.2,16,1.4);candles(13,268,5.2,16,1.4);
 fogPlane(-16,252,16,284,5.5,.42);
 const G5=gate(0,284,5.2,6,6,'x','sanctum door');const S4=shrine(-11,281,5.2,'Sanctum',false);
 L.bosses.push({kind:'cantor',x:0,z:274,y:5.2,yaw:Math.PI,arena:{x0:-15,z0:254,x1:15,z1:283,y:5.2},fog:F3,exit:G5,shrine:S4,name:'SERAPHEL, THE CINDER CANTOR',title:'Voice of the burning choir'});

 /* ================= J · THRONE OF ASH (final) ================= */
 L.zones.push({name:'Throne Walk',x0:-4,z0:284,x1:4,z1:294},{name:'Throne of Ash',x0:-22,z0:294,x1:22,z1:340,out:true,arena:true});
 platform(-4.5,284,4.5,294.6,5.2);run('z',-4.5,284,294,5.2,10,1);run('z',4.5,284,294,5.2,10,1);run('x',294.6,-22,22,5.2,10,1.2,[[-3,3,6]],mWall,{broken:true});const F4=fogWall(0,294.6,5.2,6,6,'x','Throne of Ash');
 platform(-22,295.2,22,340,5.2);run('z',-22,294,340,5.2,7,1.2,[],mWall,{broken:true,crenel:false});run('z',22,294,340,5.2,7,1.2,[],mWall,{broken:true});run('x',340,-22,22,5.2,9,1.2,[],mWall,{broken:true});
 for(let i=0;i<12;i++){const a=i/12*6.283;const x=Math.cos(a)*17,z=318+Math.sin(a)*17;const br=[2,5,7,10].includes(i)?rr(.25,.5):0;pier(x,z,13,.75,5.2,br);if(!br)B.add(mTrim,rib(x,z,x*.2,318+(z-318)*.2,19.3,6+R()*2,.28));}
 for(let i=0;i<5;i++){const a=rr(0,6.28),d=rr(6,14);fallen(Math.cos(a)*d,318+Math.sin(a)*d,rr(3,6),R()*3,.6);}
 // throne
 B.add(mTrim,wbox(-5,5.2,330,5,6.4,338));steps(-5,5,327.6,330,5.2,6.4,3);B.add(mWall2,wbox(-2.4,6.4,334,2.4,7.6,337));B.add(mWall2,wbox(-2.6,6.4,336.4,2.6,15,337.6));
 for(const s of[-1,1]){B.add(mWall2,wbox(s*2.4-.5,6.4,333,s*2.4+.5,9,337.4));B.add(mTrim,xf(new THREE.ConeGeometry(.5,3,4),s*2.6,16.5,337,0,.785,0));}
 B.add(mTrim,xf(new THREE.ConeGeometry(1.2,4,4),0,17,337,0,.785,0));phys.box(-5,5.2,330,5,6.4,338,{tag:'dais'});phys.box(-3,5.2,333,3,15,338,{tag:'throne'});
 for(let i=0;i<14;i++){const a=rr(0,6.28),d=rr(4,16);const x=Math.cos(a)*d,z=318+Math.sin(a)*d,len=rr(2,5),yaw=R()*3;B.add(mLava,xf(new THREE.BoxGeometry(len,.03,.09),x,5.22,z,0,yaw,0),false);}
 for(const[x,z]of[[-8,326],[8,326],[-15,306],[15,306],[-15,330],[15,330]])brazier(x,z,5.2,1.3);
 for(const x of[-12,12])banner(x,11,339.3,Math.PI,2,6);
 fogPlane(-22,294,22,340,5.5,.48);fogPlane(-22,294,22,340,6.2,.22);
 L.bosses.push({kind:'king',x:0,z:325,y:5.2,yaw:Math.PI,arena:{x0:-21,z0:296,x1:21,z1:338,y:5.2},fog:F4,exit:null,shrine:null,name:'ORDHAL, THE ASHEN KING',title:'Last lord of the Cathedral-Keep'});
 // distant silhouettes all around (seen through the fog from outdoor zones)
 for(let i=0;i<22;i++){const a=rr(0,6.28),d=rr(110,180);const x=Math.cos(a)*d,z=170+Math.sin(a)*d*1.3,h=rr(30,80),w=rr(6,16);B.add(mWall2,wbox(x-w/2,-40,z-w/2,x+w/2,h,z+w/2),false,false);B.add(mWall2,xf(new THREE.ConeGeometry(w*.8,h*.5,4),x,h+h*.25,z,0,.785,0),false,false);}

 /* ---------- spawns (regular foes) ---------- */
 const sp=(kind,x,z,y=0,yaw=Math.PI,o={})=>L.spawns.push({kind,x,z,y,yaw,...o});
 sp('hound',-20,30,0,Math.PI);sp('hound',-18.5,33,0,Math.PI);sp('knight',-20,50,0,Math.PI);sp('archer',-24,60,0,Math.PI*.9);
 sp('knight',-2.5,44,0,Math.PI);sp('knight',3.5,57,0,Math.PI);sp('hound',0,66,0,Math.PI);sp('archer',-8.5,82,1.2,Math.PI,{perch:true});sp('archer',8.5,82,1.2,Math.PI,{perch:true});
 sp('knight',0,131,1.2,Math.PI);sp('hound',-1.2,139,1.2,Math.PI);sp('hound',1.4,141,1.2,Math.PI);sp('knight',.5,151,1.2,Math.PI);
 sp('knight',15,170,1.2,-Math.PI/2);sp('hound',12,180,1.2,Math.PI);sp('hound',16,190,1.2,Math.PI);sp('archer',20,180,3.2,-Math.PI/2,{perch:true});sp('knight',0,184,1.2,Math.PI);
 sp('knight',-1.5,249,5.2,Math.PI);sp('archer',-3,251,5.2,Math.PI,{perch:true});sp('archer',3,251,5.2,Math.PI,{perch:true});
 L.start={x:0,y:0,z:-2,yaw:0};
 L.fogList=[F1,F2,F3,F4];L.levers.forEach(l=>l.done=false);
 B.flush();
 /* ---------- sky ---------- */
 const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),new THREE.ShaderMaterial({uniforms:{uMoon:{value:MOON},uT:U.uT,uRed:{value:0}},vertexShader:SKY_VS,fragmentShader:SKY_FS,side:THREE.BackSide,depthWrite:false,fog:false}));sky.frustumCulled=false;sky.renderOrder=-1;scene.add(sky);L.sky=sky;
 return L;}

/* gate / lever / fog animation */
export function updateLevel(L,dt,t){U.uT.value=t;
 for(const g of L.gates){const want=g.open?1:0;if(g.k!==want){g.k+=Math.sign(want-g.k)*Math.min(Math.abs(want-g.k),dt*.45);g.g.position.y=g.y+g.k*(g.h-.4);g.col.on=g.k<.55;}}
 for(const l of L.levers){const tgt=l.pulled?.7:-.7;l.arm.rotation.x+=(tgt-l.arm.rotation.x)*Math.min(1,dt*6);}
 for(const f of L.fogs){const u=f.m.material.uniforms.uA;const want=f.state==='gone'?0:f.state==='sealed'?1.25:1;u.value+=(want-u.value)*Math.min(1,dt*2);f.m.visible=u.value>.01;f.col.on=f.state!=='gone';}
 for(const b of L.banners){b.m.rotation.x=Math.sin(t*.9+b.ph)*.05;b.m.rotation.z=Math.sin(t*.7+b.ph*1.3)*.02;}
 if(L.bell)L.bell.rotation.z=Math.sin(t*.4)*.03+(L.bellRing||0)*Math.sin(t*9)*.12;if(L.bellRing)L.bellRing=Math.max(0,L.bellRing-dt*.5);
 for(const s of L.shrines){s.coreMat.emissiveIntensity+=((s.lit?2.6+Math.sin(t*7+s.id)*.4:0.0)-s.coreMat.emissiveIntensity)*Math.min(1,dt*3);}}
