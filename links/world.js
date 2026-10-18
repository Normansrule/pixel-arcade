// FAIRWAY LEGENDS — scenery for one hole: sky, sun, field-shaded links turf (fairway stripes, chequered greens, revetted
// pot bunkers, golden dune fescue, cliff rock), sea and ponds with shore foam, wind-bent trees, swaying marram grass,
// flagstick, tee markers, lighthouse / clubhouse landmarks, rocks, sailboats and clouds. All textures are drawn in code.
import * as THREE from '../vendor/three.module.min.js';
import {CS,WIND_DIR,rng} from './course.js';
const V=THREE.Vector3;
export const SUN=new V(.55,.62,-.56).normalize();
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
export function makeEnv(R){const s=new THREE.Scene();
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;vec3 c=mix(vec3(.32,.36,.2),vec3(.62,.76,.98),smoothstep(-.15,.35,h));c=mix(c,vec3(.36,.55,.92),smoothstep(.35,1.,h));gl_FragColor=vec4(c,1.);}'})));
 const sm=new THREE.Mesh(new THREE.SphereGeometry(6,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(30,28,24)}));sm.position.copy(SUN).multiplyScalar(80);s.add(sm);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.02);pm.dispose();return rt.texture;}
const NOISE_GLSL=`float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){return vn(p)*.5+vn(p*2.07)*.25+vn(p*4.31)*.125+vn(p*8.73)*.0625;}`;
function dataTex(arr,nx,nz){const t=new THREE.DataTexture(arr,nx,nz,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.LinearFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.needsUpdate=true;return t;}
/* ---------- ground material: everything painted from the margin fields ---------- */
function groundMat(T,U){const m=new THREE.MeshStandardMaterial({roughness:.92,metalness:0,envMapIntensity:.55});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vW;varying vec3 vWN;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D fT;uniform vec4 fB;uniform vec2 hD;varying vec3 vW;varying vec3 vWN;float gRough;${NOISE_GLSL}`).replace('#include <map_fragment>',`
 vec2 fuv=(vW.xz-fB.xy)*fB.zw+fB.zw*${(CS*.5).toFixed(2)};vec4 f=(texture2D(fT,fuv)*255.-128.)/8.;
 float aa=clamp(length(fwidth(vW.xz))*.7,.06,3.);
 float n1=fb(vW.xz*.045),n2=fb(vW.xz*.31),n3=vn(vW.xz*2.3),n4=vn(vW.xz*9.);
 vec3 deep=mix(vec3(.58,.53,.3),vec3(.36,.43,.19),smoothstep(.3,.7,n1));deep*=.78+.36*n2;deep=mix(deep,vec3(.5,.42,.26),n4*.25);
 vec3 rough=mix(vec3(.26,.37,.15),vec3(.34,.42,.18),n1)*(.84+.24*n2)*(.9+.12*n4);
 float lat=dot(vW.xz,vec2(hD.y,-hD.x)),alo=dot(vW.xz,hD);
 float st=smoothstep(.45,.55,abs(fract(lat/10.)-.5)*2.);
 vec3 fair=mix(vec3(.36,.55,.2),vec3(.42,.61,.23),st)*(.93+.12*n2)*(.97+.05*n4);
 float ck=mod(floor(lat/3.6)+floor(alo/3.6),2.);
 vec3 grn=mix(vec3(.35,.61,.23),vec3(.38,.645,.25),ck)*(.96+.06*n3);
 vec3 fri=vec3(.31,.52,.19)*(.95+.08*n2);
 vec3 sand=mix(vec3(.9,.82,.64),vec3(.8,.7,.52),n2)*(.95+.05*sin(dot(vW.xz,vec2(.8,2.1))*5.+n3*3.));
 vec3 c=deep;
 c=mix(c,rough,smoothstep(-.9,.9,f.w+(n2-.5)*4.));
 c=mix(c,fair,smoothstep(-aa,aa,f.x));
 c=mix(c,fri,smoothstep(-1.6-aa,-1.6+aa,f.y));
 c=mix(c,grn,smoothstep(-aa,aa,f.y));
 float sd=smoothstep(-aa,aa,f.z);c=mix(c,sand,sd);
 c*=1.-.25*smoothstep(-.6,-.05,f.z)*(1.-sd);// revetted bunker faces read darker
 float beach=smoothstep(1.7,.9,vW.y)*(1.-smoothstep(-aa,aa,f.y));c=mix(c,sand*mix(vec3(1.),vec3(.78,.72,.62),smoothstep(.7,.1,vW.y)),beach);
 float rk=smoothstep(.72,.52,vWN.y)*(1.-sd);vec3 rock=mix(vec3(.4,.37,.33),vec3(.6,.57,.5),vn(vec2(vW.y*1.3+n2*2.,(vW.x+vW.z)*.05)))*(.75+.35*n2);c=mix(c,rock,rk);
 gRough=mix(.93,.72,smoothstep(-aa,aa,f.y));
 diffuseColor.rgb=pow(c,vec3(2.1));`).replace('#include <roughnessmap_fragment>','float roughnessFactor=gRough;');};
 return m;}
/* ---------- water ---------- */
function waterMat(U,o){const u=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{t:{value:0},sunD:{value:SUN.clone()},deepC:{value:new THREE.Color(o.deep)},shalC:{value:new THREE.Color(o.shal)},skyH:{value:new THREE.Color(.62,.78,.95)},skyZ:{value:new THREE.Color(.2,.45,.85)},amp:{value:o.amp},scale:{value:o.scale}}]);
 u.aT=U.aT;u.fB=U.fB;u.t=U.time;
 return new THREE.ShaderMaterial({uniforms:u,transparent:true,fog:true,depthWrite:true,
  vertexShader:`varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}`,
  fragmentShader:`uniform float t,amp,scale;uniform vec3 sunD,deepC,shalC,skyH,skyZ;uniform sampler2D aT;uniform vec4 fB;varying vec3 vW;\n#include <fog_pars_fragment>\n${NOISE_GLSL}
 float wh(vec2 p){return sin(dot(p,vec2(.12,.05))*scale+t*1.1)*.5+sin(dot(p,vec2(-.07,.13))*scale+t*1.4)*.35+sin(dot(p,vec2(.21,-.17))*scale+t*2.)*.18+(fb(p*.25+t*.06)-.5)*.9+(vn(p*1.7-t*.5)-.5)*.25;}
 void main(){vec2 p=vW.xz;float e=.25;float hx=wh(p+vec2(e,0))-wh(p-vec2(e,0)),hz=wh(p+vec2(0,e))-wh(p-vec2(0,e));vec3 n=normalize(vec3(-hx*amp/e,1.,-hz*amp/e));
  vec3 V=normalize(cameraPosition-vW);float dist=length(cameraPosition-vW);n=normalize(mix(n,vec3(0,1,0),smoothstep(30.,600.,dist)*.9));vec3 R=reflect(-V,n);
  float d=texture2D(aT,(vW.xz-fB.xy)*fB.zw+fB.zw).b*255./40.;
  vec3 sky=mix(skyH,skyZ,pow(clamp(R.y,0.,1.),.55));float fr=.03+.97*pow(1.-max(dot(n,V),0.),5.);
  vec3 wc=mix(shalC,deepC,smoothstep(.2,4.5,d));wc*=.85+.3*max(dot(n,sunD),0.);
  vec3 c=mix(wc,sky,fr*.85);c+=vec3(1.,.95,.85)*pow(max(dot(R,sunD),0.),260.)*5.+vec3(1.,.95,.85)*pow(max(dot(R,sunD),0.),24.)*.12;
  float fo=smoothstep(.45,.02,d)*(.55+.45*sin(d*24.-t*2.2+fb(p*.4)*6.));fo+=smoothstep(.12,0.,d);c=mix(c,vec3(.95,.97,1.),clamp(fo,0.,1.)*.85);
  gl_FragColor=vec4(c,mix(.62,.97,smoothstep(0.,1.8,d)));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <fog_fragment>\n}`});}
/* ---------- geometry helpers ---------- */
function gridGeo(nx,nz,x0,z0,cs,hf,skip){const pos=new Float32Array(nx*nz*3);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=(j*nx+i)*3,x=x0+i*cs,z=z0+j*cs;pos[k]=x;pos[k+1]=hf(x,z,i,j);pos[k+2]=z;}
 const idx=[];for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){if(skip&&skip(x0+i*cs,z0+j*cs))continue;const a=j*nx+i,b=a+nx;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function merge(list){let n=0,ix=0;const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;n+=g.attributes.position.count;return g;});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);for(const g of gs){pos.set(g.attributes.position.array,ix*3);nor.set(g.attributes.normal.array,ix*3);const c=g.userData.c||new THREE.Color(1,1,1),ca=g.attributes.color;
  for(let i=0;i<g.attributes.position.count;i++){if(ca){col[(ix+i)*3]=ca.getX(i);col[(ix+i)*3+1]=ca.getY(i);col[(ix+i)*3+2]=ca.getZ(i);}else{col[(ix+i)*3]=c.r;col[(ix+i)*3+1]=c.g;col[(ix+i)*3+2]=c.b;}}ix+=g.attributes.position.count;}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('color',new THREE.BufferAttribute(col,3));return r;}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
function lumpy(geo,amt,seed,smooth){const p=geo.attributes.position,R=rng(seed);const o=[R()*9,R()*9,R()*9];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(Math.sin(x*3.1+o[0])*Math.sin(y*2.7+o[1])*Math.sin(z*3.3+o[2]))*amt;p.setXYZ(i,x*k,y*k,z*k);}
 geo.computeVertexNormals();if(smooth){const n=geo.attributes.normal;for(let i=0;i<p.count;i++){const l=Math.hypot(p.getX(i),p.getY(i),p.getZ(i))||1;n.setXYZ(i,p.getX(i)/l,p.getY(i)/l*1.3,p.getZ(i)/l);}}return geo;}
/* ---------- shared assets (built once) ---------- */
let A=null;function assets(){if(A)return A;A={};
 // windswept pine: bent trunk + layered flat crowns streaming downwind (+z)
 const trunk=new THREE.CylinderGeometry(.13,.3,7,7,10,true);trunk.translate(0,3.5,0);{const p=trunk.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/7;p.setZ(i,p.getZ(i)+Math.pow(y,1.7)*2.6);}trunk.computeVertexNormals();}
 const br=[];for(let k=0;k<4;k++){const y=3.4+k*1.05,z=Math.pow(y/7,1.7)*2.6;const b=new THREE.CylinderGeometry(.05,.09,2.4-k*.3,5);b.rotateX(1.25);b.translate(0,y,z+1);br.push([b,null,new THREE.Color(.33,.25,.19)]);}
 A.trunk=merge([[trunk,null,new THREE.Color(.36,.27,.2)],...br]);
 const cr=[];const R=rng(5);for(let k=0;k<6;k++){const t=k/5,y=4.6+t*1.9+R()*.4,z=Math.pow(y/7,1.7)*2.6+.6+t*1.8+R()*.8,s=2.1-t*.5+R()*.4;const g=lumpy(new THREE.IcosahedronGeometry(1,3),.2,k+1,true);g.scale(s*1.2,s*.62,s*1.15);g.normalizeNormals();
  const c=new THREE.Color().setHSL(.25+R()*.05,.36,.2+t*.06);cr.push([g,M4((R()-.5)*1.6,y,z,0,R()*3,0),c]);}
 A.crown=merge(cr);
 // marram tuft card texture + crossed quads
 A.tuftT=ctex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);const R=rng(9);for(let i=0;i<46;i++){const bx=w*.5+(R()-.5)*w*.5,lean=(R()-.35)*w*.55,top=h*(.05+R()*.4);const g=x.createLinearGradient(0,h,0,top);
   const c1=R()<.5?[150,150,70]:[96,120,52];g.addColorStop(0,`rgb(${c1[0]*.55|0},${c1[1]*.55|0},${c1[2]*.5|0})`);g.addColorStop(1,`rgb(${c1[0]+60},${c1[1]+50},${c1[2]+30})`);x.strokeStyle=g;x.lineWidth=1.4+R()*1.6;x.beginPath();x.moveTo(bx,h);x.quadraticCurveTo(bx+lean*.3,h*.55,bx+lean,top);x.stroke();}},{clamp:true});
 const q1=new THREE.PlaneGeometry(1.3,1.1,1,2);q1.translate(0,.55,0);const qs=[];for(let k=0;k<3;k++){const q=q1.clone();q.rotateY(k*Math.PI/3);qs.push(q);}
 A.tuft=new THREE.BufferGeometry();{const pos=[],uv=[],nor=[];qs.forEach(q=>{const g=q.toNonIndexed();pos.push(...g.attributes.position.array);uv.push(...g.attributes.uv.array);for(let i=0;i<g.attributes.position.count;i++)nor.push(0,1,0);});
  A.tuft.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));A.tuft.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));A.tuft.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));}
 A.rock=lumpy(new THREE.DodecahedronGeometry(1,1),.22,3);
 A.cloudT=ctex(256,128,(x,w,h)=>{x.clearRect(0,0,w,h);const R=rng(21);for(let i=0;i<34;i++){const cx=w*(.15+R()*.7),cy=h*(.45+R()*.3)-Math.sin((cx/w)*Math.PI)*h*.18,r=12+R()*26;const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();}},{clamp:true});
 return A;}
/* ---------- build ---------- */
export function buildHole(scene,T,o){assets();const G=new THREE.Group();scene.add(G);const q=o.q;const out={group:G,time:{value:0},update:null,flag:null,disposables:[]};
 const fT=dataTex(T.F,T.nx,T.nz),aT=dataTex(T.A,T.nx,T.nz);out.disposables.push(fT,aT);
 const U={fT:{value:fT},aT:{value:aT},fB:{value:new THREE.Vector4(T.x0,T.z0,1/(CS*T.nx),1/(CS*T.nz))},hD:{value:new THREE.Vector2(T.hd.x,T.hd.z)},time:out.time};
 // sky + light
 const sky=new THREE.Mesh(new THREE.SphereGeometry(8000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sunD:{value:SUN.clone()}},
  vertexShader:'varying vec3 vD;void main(){vD=normalize((modelMatrix*vec4(position,0.)).xyz);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w*.99999;}',
  fragmentShader:`uniform vec3 sunD;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=d.y;
   vec3 zen=vec3(.07,.24,.62),mid=vec3(.25,.52,.88),hor=vec3(.72,.84,.95),gnd=vec3(.55,.62,.6);
   vec3 c=h>0.?mix(hor,mid,smoothstep(0.,.22,h)):gnd;c=h>0.?mix(c,zen,smoothstep(.2,.9,h)):c;c=mix(c,hor,exp(-abs(h)*28.)*.6);
   float s=max(dot(d,sunD),0.);c+=vec3(1.,.9,.7)*(pow(s,8.)*.18+pow(s,90.)*.5)+vec3(14.,12.,9.)*smoothstep(.9994,.9997,s);
   gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}));sky.renderOrder=-1;G.add(sky);out.sky=sky;
 const hemi=new THREE.HemisphereLight(0xcfe3ff,0x5a6a38,.85);G.add(hemi);
 const key=new THREE.DirectionalLight(0xfff1dc,3.2);key.castShadow=true;const ext=95;Object.assign(key.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:520});key.shadow.bias=-.0003;key.shadow.normalBias=.04;
 const s=q===2?4096:q===1?2048:1024;key.shadow.mapSize.set(s,s);G.add(key,key.target);out.key=key;
 out.focus=p=>{key.target.position.set(p.x,p.y,p.z);key.position.set(p.x+SUN.x*250,p.y+SUN.y*250,p.z+SUN.z*250);};
 // terrain
 const gm=groundMat(T,U);out.disposables.push(gm);
 const ground=new THREE.Mesh(gridGeo(T.nx,T.nz,T.x0,T.z0,CS,(x,z,i,j)=>T.hf[j*T.nx+i]),gm);ground.receiveShadow=true;G.add(ground);
 const cx=Math.round((T.x0+T.x1)/40)*20,cz=Math.round((T.z0+T.z1)/40)*20,FR=1800,fc=20,fn=FR*2/fc+1;
 const farG=gridGeo(fn,fn,cx-FR,cz-FR,fc,(x,z)=>{let y=T.far(x,z);const inx=x>T.x0&&x<T.x1&&z>T.z0&&z<T.z1;return inx?y-4:y;},(x,z)=>x>=T.x0&&x+fc<=T.x1&&z>=T.z0&&z+fc<=T.z1);
 const farM=new THREE.Mesh(farG,gm);farM.receiveShadow=true;G.add(farM);
 // sea + ponds + burn
 const sea=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000,1,1).rotateX(-Math.PI/2),waterMat(U,{deep:0x0c4a6a,shal:0x2fa7a6,amp:.55,scale:1}));sea.position.set(cx,0,cz);sea.renderOrder=1;G.add(sea);
 const pondM=waterMat(U,{deep:0x163f4a,shal:0x3b7f6a,amp:.22,scale:2.2});
 for(const w of T.water){let m;if(w.burn!=null){const p=T.ptAt(w.burn,0),p2=T.ptAt(w.burn+2,0),a=Math.atan2(p2.x-p.x,p2.z-p.z);m=new THREE.Mesh(new THREE.PlaneGeometry(420,w.w*2+12).rotateX(-Math.PI/2),pondM);m.rotation.y=a+Math.PI/2;m.position.set(p.x,w.lvl,p.z);
   // footbridge over the burn on the line of play
   const wood=new THREE.MeshStandardMaterial({color:0x7a5a3c,roughness:.85});const bg=new THREE.Group();const deck=new THREE.Mesh(new THREE.BoxGeometry(2.2,.18,w.w*2+5),wood);deck.position.y=.75;bg.add(deck);
   for(const sx of[-1,1]){const rail=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,w.w*2+5),wood);rail.position.set(sx*1.05,1.6,0);bg.add(rail);for(let k=-2;k<=2;k++){const post=new THREE.Mesh(new THREE.BoxGeometry(.1,.9,.1),wood);post.position.set(sx*1.05,1.2,k*(w.w*2+4)/4);bg.add(post);}}
   bg.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});const pp=T.ptAt(w.burn,7);bg.position.set(pp.x,w.lvl+.5,pp.z);bg.rotation.y=a;G.add(bg);}
  else{m=new THREE.Mesh(new THREE.CircleGeometry(Math.max(w.a,w.b)*1.75,48).rotateX(-Math.PI/2),pondM);m.position.set(w.x,w.lvl,w.z);}
  m.renderOrder=1;G.add(m);}
 // trees
 const R=rng(T.def.seed*31+7);
 if(T.trees.length){const tm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}),cm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,envMapIntensity:.4});out.disposables.push(tm,cm);
  const ti=new THREE.InstancedMesh(A.trunk,tm,T.trees.length),ci=new THREE.InstancedMesh(A.crown,cm,T.trees.length);const mm=new THREE.Matrix4(),col=new THREE.Color();
  T.trees.forEach((t,k)=>{mm.copy(M4(t.x,t.y-.2,t.z,0,WIND_DIR+(R()-.5)*.25,0,t.s,t.s*(.9+R()*.25),t.s));ti.setMatrixAt(k,mm);ci.setMatrixAt(k,mm);col.setHSL(.24+R()*.08,.3+R()*.15,.8+R()*.35);ci.setColorAt(k,col);});
  ti.castShadow=ci.castShadow=true;ti.receiveShadow=ci.receiveShadow=true;G.add(ti,ci);}
 // marram / fescue tufts in the deep grass
 const nT=[900,2600,5200][q];const tufts=[];for(let k=0;k<nT*6&&tufts.length<nT;k++){const x=T.x0+12+R()*(T.x1-T.x0-24),z=T.z0+12+R()*(T.z1-T.z0-24);if(T.field(x,z,3)>-1||T.field(x,z,2)>-1.5||T.field(x,z,1)>-6)continue;const y=T.h(x,z);if(y<1.2)continue;tufts.push([x,y,z]);}
 if(tufts.length){const m=new THREE.MeshStandardMaterial({map:A.tuftT,alphaTest:.45,side:THREE.DoubleSide,roughness:1,color:0xe8e2c0});out.disposables.push(m);
  m.onBeforeCompile=sh=>{sh.uniforms.time=out.time;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float time;').replace('#include <begin_vertex>',`#include <begin_vertex>
   vec4 ip=instanceMatrix*vec4(0.,0.,0.,1.);float sw=uv.y*uv.y;transformed.x+=sw*(.16+.1*sin(time*2.1+ip.x*.4+ip.z*.3));transformed.z+=sw*(.22+.12*sin(time*1.7+ip.z*.5));`);};
  const im=new THREE.InstancedMesh(A.tuft,m,tufts.length);const mm=new THREE.Matrix4(),col=new THREE.Color();tufts.forEach((p,k)=>{const s=.7+R()*.9;im.setMatrixAt(k,M4(p[0],p[1]-.05,p[2],0,R()*6.3,0,s,s*(.8+R()*.6),s));col.setHSL(.12+R()*.08,.35,.75+R()*.35);im.setColorAt(k,col);});im.receiveShadow=true;G.add(im);}
 // rocks along the shoreline
 if(T.sea){const rk=[];for(let k=0;k<4000&&rk.length<(T.sea.cliff?140:50);k++){const x=T.x0+R()*(T.x1-T.x0),z=T.z0+R()*(T.z1-T.z0),c=T.coast(x,z);if(c<(T.sea.cliff?-2:4)||c>(T.sea.cliff?16:20))continue;rk.push([x,T.h(x,z),z]);}
  const m=new THREE.MeshStandardMaterial({color:0x8a8478,roughness:.95,flatShading:true});out.disposables.push(m);const im=new THREE.InstancedMesh(A.rock,m,Math.max(1,rk.length));
  rk.forEach((p,k)=>{const s=.8+R()*R()*(T.sea.cliff?4.5:2.2);im.setMatrixAt(k,M4(p[0],p[1]-s*.3,p[2],R()*3,R()*3,R()*3,s,s*(.5+R()*.5),s*(.7+R()*.5)));});im.count=rk.length;im.castShadow=im.receiveShadow=true;G.add(im);}
 // tee markers
 const tmk=new THREE.MeshStandardMaterial({color:0x2a68ff,roughness:.4,metalness:.1});const td=T.tdir;for(const sx of[-1,1]){const m=new THREE.Mesh(new THREE.SphereGeometry(.09,16,10),tmk);const x=T.tee.x+Math.cos(td)*sx*3+Math.sin(td)*1.5,z=T.tee.z-Math.sin(td)*sx*3+Math.cos(td)*1.5;m.position.set(x,T.h(x,z)+.12,z);m.castShadow=true;G.add(m);}
 // flagstick + flag + cup
 const pin=T.pin,py=T.h(pin.x,pin.z);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,2.3,8),new THREE.MeshStandardMaterial({color:0xf4f4f0,roughness:.3}));pole.position.set(pin.x,py+1.15,pin.z);pole.castShadow=true;G.add(pole);
 const ft=ctex(128,96,(x,w,h)=>{x.fillStyle='#ffd21f';x.fillRect(0,0,w,h);x.fillStyle='#d01f1f';x.fillRect(0,h*.78,w,h*.22);x.fillStyle='#14161c';x.font='bold 54px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(T.i+1),w*.5,h*.42);},{clamp:true});
 const fg=new THREE.PlaneGeometry(.62,.42,10,4);fg.translate(.31,0,0);const fm=new THREE.MeshStandardMaterial({map:ft,side:THREE.DoubleSide,roughness:.8});out.disposables.push(fm,ft);
 fm.onBeforeCompile=sh=>{sh.uniforms.time=out.time;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float time;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat w=position.x/.62;transformed.z+=sin(position.x*9.-time*9.)*.07*w+sin(position.x*5.-time*5.3)*.04*w;transformed.y-=w*w*.03;');};
 const flag=new THREE.Mesh(fg,fm);flag.position.set(pin.x,py+2.06,pin.z);flag.castShadow=true;G.add(flag);out.flag=flag;out.pole=pole;
 const cup=new THREE.Mesh(new THREE.CircleGeometry(.056,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x07090a,polygonOffset:true,polygonOffsetFactor:-4}));cup.position.set(pin.x,py+.012,pin.z);G.add(cup);
 const lin=new THREE.Mesh(new THREE.RingGeometry(.056,.064,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,polygonOffset:true,polygonOffsetFactor:-4}));lin.position.copy(cup.position);G.add(lin);
 // landmarks
 if(T.def.lh){const lg=new THREE.Group();const bt=ctex(64,256,(x,w,h)=>{for(let i=0;i<6;i++){x.fillStyle=i%2?'#c8231f':'#f6f4ee';x.fillRect(0,i*h/6,w,h/6+1);}});
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(2.2,3.3,26,24,1),new THREE.MeshStandardMaterial({map:bt,roughness:.6}));tower.position.y=13;lg.add(tower);
  const gal=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.1,.5,24),new THREE.MeshStandardMaterial({color:0x22262c,roughness:.5}));gal.position.y=26.2;lg.add(gal);
  const lan=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,3,16),new THREE.MeshStandardMaterial({color:0xfff2c0,emissive:0xffe9a0,emissiveIntensity:1.6,roughness:.1}));lan.position.y=28;lg.add(lan);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(2.2,2.4,16),new THREE.MeshStandardMaterial({color:0xb21d1a,roughness:.5}));cap.position.y=30.7;lg.add(cap);
  const hut=new THREE.Mesh(new THREE.BoxGeometry(7,4,5),new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.8}));hut.position.set(5,2,3);lg.add(hut);const rf=new THREE.Mesh(new THREE.CylinderGeometry(.01,4.6,2.4,4,1),new THREE.MeshStandardMaterial({color:0x3a3f48,roughness:.7}));rf.rotation.y=Math.PI/4;rf.scale.set(1.1,1,.8);rf.position.set(5,5.2,3);lg.add(rf);
  // a spot on the cliff top, beyond and to the sea side of the green
  let best=null;for(let k=0;k<600;k++){const d=40+R()*90,l=(R()-.3)*80;const x=T.gc.x+T.hd.x*d+T.left.x*T.sea.side*l,z=T.gc.z+T.hd.z*d+T.left.z*T.sea.side*l;const c=T.coast(x,z);if(c>-16&&c<-7&&T.h(x,z)>4){best={x,z};break;}}
  if(best){lg.position.set(best.x,T.h(best.x,best.z)-.5,best.z);lg.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});G.add(lg);out.lighthouse=lg;}}
 if(T.def.club){const cg=new THREE.Group();const wall=new THREE.MeshStandardMaterial({color:0xf3eee2,roughness:.85}),roof=new THREE.MeshStandardMaterial({color:0x3b4250,roughness:.6}),win=new THREE.MeshStandardMaterial({color:0x223040,roughness:.15,metalness:.3,emissive:0x101820});
  const body=new THREE.Mesh(new THREE.BoxGeometry(34,7,12),wall);body.position.y=3.5;cg.add(body);const rs=new THREE.Shape();rs.moveTo(-6.6,0);rs.lineTo(0,4.4);rs.lineTo(6.6,0);const rg=new THREE.ExtrudeGeometry(rs,{depth:35,bevelEnabled:false});rg.translate(0,0,-17.5);rg.rotateY(Math.PI/2);
  const r=new THREE.Mesh(rg,roof);r.position.y=7;cg.add(r);for(let k=-6;k<=6;k++){const w=new THREE.Mesh(new THREE.BoxGeometry(1.6,2.2,.2),win);w.position.set(k*2.5,3.6,-6.05);cg.add(w);}
  const tw=new THREE.Mesh(new THREE.BoxGeometry(5,13,5),wall);tw.position.set(-12,6.5,0);cg.add(tw);const tr=new THREE.Mesh(new THREE.ConeGeometry(4.2,4,4),roof);tr.rotation.y=Math.PI/4;tr.position.set(-12,15,0);cg.add(tr);
  const fp=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,9,6),new THREE.MeshStandardMaterial({color:0xffffff}));fp.position.set(14,11.5,-3);cg.add(fp);
  const p={x:T.gc.x+T.hd.x*62,z:T.gc.z+T.hd.z*62};cg.position.set(p.x,T.h(p.x,p.z)-.3,p.z);cg.rotation.y=Math.atan2(T.hd.x,T.hd.z);cg.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});G.add(cg);}
 // sailboats offshore
 if(T.sea){const sail=new THREE.MeshStandardMaterial({color:0xfbfaf4,side:THREE.DoubleSide,roughness:.7}),hull=new THREE.MeshStandardMaterial({color:0x1d2d4a,roughness:.5});
  for(let k=0;k<3;k++){const b=new THREE.Group();const h=new THREE.Mesh(new THREE.BoxGeometry(1.6,.8,6),hull);h.position.y=.3;b.add(h);const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([0,1,-2,0,8.5,-.4,0,1,2.2],3));sg.computeVertexNormals();b.add(new THREE.Mesh(sg,sail));
   const d=T.sea.d+220+R()*700,al=R()*T.S*1.5-100;b.position.set(T.tee.x+T.hd.x*al+T.left.x*T.sea.side*d,0,T.tee.z+T.hd.z*al+T.left.z*T.sea.side*d);b.rotation.y=R()*6;b.scale.setScalar(1.6);G.add(b);}}
 // clouds
 const cm=new THREE.SpriteMaterial({map:A.cloudT,transparent:true,depthWrite:false,fog:false,opacity:.95,color:new THREE.Color(1.6,1.6,1.65)});for(let k=0;k<14;k++){const sp=new THREE.Sprite(cm);const a=R()*6.283,d=1400+R()*1800;sp.position.set(cx+Math.cos(a)*d,260+R()*380,cz+Math.sin(a)*d);sp.scale.set(700+R()*600,250+R()*160,1);G.add(sp);}
 out.update=(dt,camPos)=>{out.time.value+=dt;sky.position.copy(camPos);};
 out.dispose=()=>{scene.remove(G);G.traverse(c=>{if(c.geometry&&c.geometry!==A.trunk&&c.geometry!==A.crown&&c.geometry!==A.tuft&&c.geometry!==A.rock)c.geometry.dispose();});out.disposables.forEach(d=>d.dispose&&d.dispose());};
 return out;}
