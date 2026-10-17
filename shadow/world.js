// SILENT CONTRACT — scene construction from the level records. Static geometry is merged per material and lit by BAKED lamp light
// (per vertex, line-of-sight tested through the level grid) plus a per-vertex sky factor that shuts the sunset sun and sky out of
// interiors; kitchen and boathouse lamps sit on switchable groups (fuse boxes). Sunset sky, sea, cliffs, gardens, villa dressing.
import * as THREE from '../vendor/three.module.min.js';
import {GW,GH,X0,Z0,CELL} from './level.js';
import {labelTex} from './tex.js';
const V=THREE.Vector3,PI=Math.PI;
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(a,b,h,s=12)=>new THREE.CylinderGeometry(a,b,h,s),SP=(r,a=12,b=8)=>new THREE.SphereGeometry(r,a,b);
const lath=(pts,s=12)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),s);
const lin=h=>{const c=new THREE.Color(h);return[c.r,c.g,c.b];};
const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
let seed=5;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;

export const U={bake:{value:1},grp:{value:[1,1,1,1]},time:{value:0}};
// static material: baked lamp light + sky factor (x: sky/sun visibility, y: switchable light group)
export function bakeMat(o){const m=new THREE.MeshStandardMaterial(o);m.onBeforeCompile=s=>{s.uniforms.uBake=U.bake;s.uniforms.uGrp=U.grp;
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 bake;attribute vec3 bakeS;attribute vec2 sky;varying vec3 vBake;varying float vSky;uniform float uGrp[4];')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nint gi=int(sky.y+.5);float gk=gi==0?uGrp[0]:gi==1?uGrp[1]:gi==2?uGrp[2]:1.;vBake=bake+bakeS*gk;vSky=sky.x;');
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vBake;varying float vSky;uniform float uBake;')
   .replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=smoothstep(.3,.9,vSky);'))
   .replace('#include <lights_fragment_maps>','#include <lights_fragment_maps>\n irradiance=irradiance*vSky+vBake*uBake;');};
 m.customProgramCacheKey=()=>'scbake';return m;}
// dynamic material (characters, props that move): per-object sun factor and local ambient, set from the light grid every frame
export function dynMat(o,key='dyn'){const m=new THREE.MeshStandardMaterial(o);m.userData.sun={value:1};m.userData.amb={value:new THREE.Color(0,0,0)};m.userData.sky={value:1};
 m.onBeforeCompile=s=>{s.uniforms.uSun=m.userData.sun;s.uniforms.uAmb=m.userData.amb;s.uniforms.uSkyK=m.userData.sky;
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform float uSun,uSkyK;uniform vec3 uAmb;')
   .replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=uSun;'))
   .replace('#include <lights_fragment_maps>','#include <lights_fragment_maps>\n irradiance=irradiance*uSkyK+uAmb*(.8+.2*normal.y);');};
 m.customProgramCacheKey=()=>key;return m;}

class GB{constructor(){this.p=[];this.n=[];this.uv=[];this.c=[];this.i=[];}
 v(x,y,z,nx,ny,nz,u,w,c){this.p.push(x,y,z);this.n.push(nx,ny,nz);this.uv.push(u,w);this.c.push(c[0],c[1],c[2]);}
 // quad P0..P3 (counter-clockwise seen from n), subdivided nu x nv
 quad(P,n,uvf,col,nu=1,nv=1){const[a,b,c,d]=P;const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[d[0]-a[0],d[1]-a[1],d[2]-a[2]];const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
  const flip=cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0;const k=this.p.length/3;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const s=i/nu,t=j/nv;const p=[0,1,2].map(q=>a[q]*(1-s)*(1-t)+b[q]*s*(1-t)+c[q]*s*t+d[q]*(1-s)*t);const w=uvf(p);this.v(p[0],p[1],p[2],n[0],n[1],n[2],w[0],w[1],typeof col==='function'?col(p):col);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const q0=k+j*(nu+1)+i,q1=q0+1,q2=q0+nu+2,q3=q0+nu+1;if(flip)this.i.push(q0,q2,q1,q0,q3,q2);else this.i.push(q0,q1,q2,q0,q2,q3);}}
 box(x0,y0,z0,x1,y1,z1,col,o={}){const s=o.s||1,sk=o.skip||'',sub=o.sub||0,su=v=>sub?Math.max(1,Math.round(v/sub)):1;const dx=x1-x0,dy=y1-y0,dz=z1-z0;
  const F=[['px',[1,0,0],[[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],p=>[p[2]/s,p[1]/s],su(dz),su(dy)],['nx',[-1,0,0],[[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1]],p=>[-p[2]/s,p[1]/s],su(dz),su(dy)],
   ['py',[0,1,0],[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],p=>[p[0]/s,p[2]/s],su(dx),su(dz)],['ny',[0,-1,0],[[x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0]],p=>[p[0]/s,p[2]/s],su(dx),su(dz)],
   ['pz',[0,0,1],[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],p=>[p[0]/s,p[1]/s],su(dx),su(dy)],['nz',[0,0,-1],[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],p=>[-p[0]/s,p[1]/s],su(dx),su(dy)]];
  for(const[k,n,P,uv,nu,nv]of F)if(!sk.includes(k))this.quad(P,n,uv,col,nu,nv);}
 add(g,m,col,uvs=1){const G=g.index?g.toNonIndexed():g;const P=G.attributes.position,N=G.attributes.normal,UV=G.attributes.uv;const v=new V(),n=new V(),nm=new THREE.Matrix3().getNormalMatrix(m);const k=this.p.length/3;
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(m);n.fromBufferAttribute(N,i).applyMatrix3(nm).normalize();this.v(v.x,v.y,v.z,n.x,n.y,n.z,UV?UV.getX(i)*uvs:0,UV?UV.getY(i)*uvs:0,typeof col==='function'?col([v.x,v.y,v.z]):col);this.i.push(k+i);}}
 geo(bake){const n=this.p.length/3,B=new Float32Array(n*3),BS=new Float32Array(n*3),SK=new Float32Array(n*2);
  for(let i=0;i<n;i++){const r=bake(this.p[i*3],this.p[i*3+1],this.p[i*3+2],this.n[i*3],this.n[i*3+1],this.n[i*3+2]);B[i*3]=r[0];B[i*3+1]=r[1];B[i*3+2]=r[2];BS[i*3]=r[3];BS[i*3+1]=r[4];BS[i*3+2]=r[5];SK[i*2]=r[6];SK[i*2+1]=r[7];}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(this.uv,2));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));g.setAttribute('bake',new THREE.BufferAttribute(B,3));g.setAttribute('bakeS',new THREE.BufferAttribute(BS,3));g.setAttribute('sky',new THREE.BufferAttribute(SK,2));
  g.setIndex(n>65535?new THREE.Uint32BufferAttribute(this.i,1):new THREE.Uint16BufferAttribute(this.i,1));g.computeBoundingSphere();return g;}
 get empty(){return!this.i.length;}}

/* ================================================================== sky + sea */
const SUN=new V(-.62,.1,.78).normalize();
function makeSky(){const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sunDir:{value:SUN.clone()},time:U.time},
 vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform vec3 sunDir;uniform float time;varying vec3 vD;
 float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
 void main(){vec3 d=normalize(vD);float h=d.y;float s=max(dot(d,sunDir),0.);float sd=max(dot(normalize(d.xz),normalize(sunDir.xz)),0.);
  vec3 top=vec3(.09,.13,.32),mid=mix(vec3(.46,.3,.46),vec3(.86,.44,.36),sd*sd),hor=mix(vec3(.92,.52,.4),vec3(1.,.6,.28),sd);
  vec3 c=mix(hor,mid,smoothstep(0.,.16,h));c=mix(c,top,smoothstep(.12,.6,h));c=mix(c,hor*.6,smoothstep(0.,-.08,h));
  c+=vec3(1.,.5,.2)*(pow(s,8.)*.45+pow(s,2.)*.05)*(1.-smoothstep(.0,.5,h));c+=vec3(1.,.85,.6)*pow(s,900.)*14.+vec3(1.,.7,.4)*pow(s,90.)*.9;
  if(h>-.02){vec2 p=d.xz/(max(h,.02)+.12)*.9+vec2(time*.004,0.);float n=fbm(p*1.4);float k=smoothstep(.48,.82,n)*smoothstep(-.02,.25,h)*(1.-smoothstep(.5,.9,h));
   vec3 cl=mix(vec3(.55,.32,.42),vec3(1.,.62,.38),pow(s,2.)*.9+sd*.3);cl=mix(cl,vec3(1.,.8,.55),pow(s,10.)*.8);c=mix(c,cl,k*.75);}
  gl_FragColor=vec4(c,1.);}`});const s=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),m);s.renderOrder=-10;s.frustumCulled=false;return s;}
function makeSea(){const m=new THREE.ShaderMaterial({fog:true,uniforms:{...THREE.UniformsLib.fog,sunDir:{value:SUN.clone()},time:U.time},
 vertexShader:'#include <fog_pars_vertex>\nvarying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
 fragmentShader:`#include <fog_pars_fragment>
 uniform vec3 sunDir;uniform float time;varying vec3 vW;
 float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
 void main(){vec2 p=vW.xz;float t=time;
  float dist=length(cameraPosition.xz-p);float at=1./(1.+dist*.012);
  vec2 g=vec2(0.);g+=vec2(cos(p.x*.21+t*.9),sin(p.y*.17-t*.7))*.05*at;g+=vec2(cos(p.x*.53-p.y*.31+t*1.6),sin(p.y*.61+p.x*.23+t*1.3))*.04*at;
  g+=(vec2(n2(p*.9+t*.4),n2(p*.9-t*.37+7.))-.5)*.12*at;g+=(vec2(n2(p*3.1+t),n2(p*2.9-t+3.))-.5)*.08*at;
  vec3 n=normalize(vec3(g.x,1.,g.y));vec3 v=normalize(cameraPosition-vW);float fr=pow(1.-max(dot(normalize(mix(n,vec3(0.,1.,0.),.65)),v),0.),5.);
  vec3 r=reflect(-v,n);float rh=max(r.y,0.);float sd=max(dot(normalize(r.xz),normalize(sunDir.xz)),0.);
  vec3 sky=mix(mix(vec3(.95,.55,.38),vec3(.5,.32,.44),smoothstep(0.,.2,rh)),vec3(.1,.14,.32),smoothstep(.2,.7,rh));sky+=vec3(1.,.5,.2)*pow(sd,10.)*.6*(1.-rh);
  vec3 deep=mix(vec3(.01,.05,.08),vec3(.015,.08,.1),at),c=mix(deep,sky,.04+fr*.8);
  float s=max(dot(r,sunDir),0.);float vs=max(dot(normalize(-v.xz),normalize(sunDir.xz)),0.);c+=vec3(1.,.7,.4)*pow(s,300.)*10.+vec3(1.,.5,.22)*pow(s,30.)*.6;
  c+=vec3(1.,.58,.28)*pow(vs,40.)*smoothstep(.55,.9,n2(p*vec2(.6,2.2)+t*.8))*.5*(1.-at*.6);
  float shore=smoothstep(2.4,0.,abs(vW.y+14.))*0.;c+=shore;
  gl_FragColor=vec4(c,1.);
  #include <fog_fragment>
 }`});const s=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400).rotateX(-PI/2),m);s.position.y=-14;return s;}

/* ================================================================== terrain (cliffs, hills) */
function tH(x,z){const n=(a,b)=>Math.sin(a*.13+b*.07)*Math.cos(b*.11-a*.05)+Math.sin(a*.37-b*.29)*.4+Math.sin(a*.9+b*.7)*.15;
 // plateau inside the grounds sits just under the built floors
 let base=z<8.5?-.12:-1.3;if(x<-64||x>64||z<-73){const d=Math.max(-64-x,x-64,-73-z,0);base=Math.min(14,d*.35)+n(x,z)*Math.min(3,d*.2);}
 // cliff: edge runs along z~31 (wobbly), out to sea; the quay cove on the east side
 const edge=31.2+Math.sin(x*.08)*1.6+Math.sin(x*.31)*.6+(x<-64?Math.max(0,-64-x)*.25:0)+(x>64?(x-64)*.6:0);
 if(z>edge){const k=ss(0,6,z-edge);base=base*(1-k)+(-19+n(x,z)*2)*k;const ledge=(z-edge)>3&&(z-edge)<9?-6+n(x*1.7,z)*3:base;base=Math.min(base,ledge);}
 if(x>27&&x<66&&z>edge-1&&z<56){const cove=ss(edge-1,46,z);const top=-1.3*(1-cove)+(-12.4)*cove;base=Math.max(Math.min(base,top+n(x*2,z*2)*.6),-19);if(z>45.5)base=-12.6+(z>53.6?-6*ss(53.6,56,z):0);}
 return base;}
function buildTerrain(G,M){const S=2,x0=-260,x1=260,z0=-200,z1=180,nx=(x1-x0)/S,nz=(z1-z0)/S;const pos=[],col=[],nor=[],uv=[],idx=[];
 const H=(x,z)=>tH(x,z);for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=x0+i*S,z=z0+j*S,y=H(x,z);pos.push(x,y,z);uv.push(x/6,z/6);
  const dx=H(x+1,z)-H(x-1,z),dz=H(x,z+1)-H(x,z-1),n=new V(-dx,2,-dz).normalize();nor.push(n.x,n.y,n.z);const steep=1-n.y,green=ss(.35,.12,steep)*(y>-8?1:0);
  const c=new THREE.Color(.62,.55,.46).lerp(new THREE.Color(.36,.42,.2),green*(1-ss(-1,-6,y)));if(y<-13)c.multiplyScalar(.7);col.push(c.r,c.g,c.b);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;idx.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);
 const n=pos.length/3;g.setAttribute('bake',new THREE.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('bakeS',new THREE.BufferAttribute(new Float32Array(n*3),3));const sk=new Float32Array(n*2);for(let i=0;i<n;i++){sk[i*2]=1;sk[i*2+1]=3;}g.setAttribute('sky',new THREE.BufferAttribute(sk,2));
 const m=new THREE.Mesh(g,M.rock);m.receiveShadow=true;G.add(m);
 // distant headlands across the bay with village lights
 const hm=new THREE.MeshBasicMaterial({vertexColors:true,fog:true});const HL=[[-460,330,340,46],[-160,520,300,30],[380,420,360,54],[700,200,320,70]];
 for(const[cx,cz,w,h]of HL){const N=48,geo=new THREE.PlaneGeometry(2,2,N,12).rotateX(-PI/2);const P2=geo.attributes.position,cl=[];
  for(let i=0;i<P2.count;i++){const u=P2.getX(i),v=P2.getZ(i);const r=Math.min(1,Math.hypot(u,v*1.15));const nn=Math.sin(u*9+cx)*.18+Math.sin(u*23+cz)*.07+Math.sin(u*47)*.03;
   const y=r>=1?-2:h*Math.pow(1-r*r,.7)*(.75+nn)*(1+.35*Math.sin(u*2.4+cx*.01));P2.setXYZ(i,cx+u*w,-14+y,cz+v*w*.35);const k=.55+.45*Math.min(1,y/h);cl.push(.24*k,.15*k,.2*k);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));G.add(new THREE.Mesh(geo,hm));}
 const lp=[];for(let i=0;i<70;i++){const k=rnd();const[cx,cz,w]=k<.5?[-460,330,340]:k<.8?[380,420,360]:[700,200,320];const u=(rnd()-.5)*1.5;lp.push(cx+u*w,-12+rnd()*5,cz-w*.33*Math.sqrt(Math.max(0,1-u*u)));}
 const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));G.add(new THREE.Points(lg,new THREE.PointsMaterial({color:new THREE.Color(3,2.2,1.2),size:2.2,sizeAttenuation:false,fog:false})));}

/* ================================================================== bake */
function makeBaker(L){const lamps=L.lamps.map(l=>({...l,c:lin(l.col)}));const bucket=new Map();for(const l of lamps){const k0=Math.floor((l.x-l.R)/8),k1=Math.floor((l.x+l.R)/8),j0=Math.floor((l.z-l.R)/8),j1=Math.floor((l.z+l.R)/8);
  for(let i=k0;i<=k1;i++)for(let j=j0;j<=j1;j++){const k=i*1000+j;if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(l);}}
 const fn=(x,y,z,nx,ny,nz,noN)=>{const sx=x+nx*.22,sz=z+nz*.22;const ins=L.indoor(sx,sz)&&y<L.ceilAt(sx,sz)+.3;const o=[0,0,0,0,0,0,ins?.16:1,3];let gbest=0;
  const amb=ins?[.035,.03,.026]:[0,0,0];o[0]+=amb[0];o[1]+=amb[1];o[2]+=amb[2];const myRoom=L.roomAt(sx,sz);
  for(const l of bucket.get(Math.floor(x/8)*1000+Math.floor(z/8))||[]){const dx=l.x-x,dy=l.y-y,dz=l.z-z,d2=dx*dx+dy*dy+dz*dz;if(d2>l.R*l.R)continue;const d=Math.sqrt(d2)+1e-4;
   const ndl=noN?.65:(dx*nx+dy*ny+dz*nz)/d;const fall=l.I/(1+d2*.45)*ss(l.R,l.R*.5,d);let k=0;
   if(l.room===myRoom&&ins){k+=fall*.2;}// bounce fill inside the same room
   if(ndl>0&&L.los(x+nx*.28,y+ny*.06,z+nz*.28,l.x,l.y,l.z))k+=fall*ndl;if(k<=0)continue;
   if(l.grp>=0){o[3]+=l.c[0]*k;o[4]+=l.c[1]*k;o[5]+=l.c[2]*k;if(k>gbest){gbest=k;o[7]=l.grp;}}else{o[0]+=l.c[0]*k;o[1]+=l.c[1]*k;o[2]+=l.c[2]*k;}}
  if(o[7]===3){o[3]=o[4]=o[5]=0;}return o;};
 return fn;}
// light grid for dynamic objects: 1 m cells at chest height
function lightGrid(L,bake){const n=160,g=new Float32Array(n*n*4);for(let j=0;j<n;j++)for(let i=0;i<n;i++){const x=-80+i+.5,z=-80+j+.5;let y=L.h(x,z);if(y!==y)y=0;const r=bake(x,y+1.2,z,0,0,0,true);const k=(j*n+i)*4;
  g[k]=r[0]+r[3];g[k+1]=r[1]+r[4];g[k+2]=r[2]+r[5];g[k+3]=r[6];}
 return(x,z)=>{const i=Math.max(0,Math.min(n-1,Math.floor(x+80))),j=Math.max(0,Math.min(n-1,Math.floor(z+80)));const k=(j*n+i)*4;return[g[k],g[k+1],g[k+2],g[k+3]];};}

/* ================================================================== build */
export function buildWorld(L,TX,q){const G=new THREE.Group();seed=5;
 const tm=(t,o={})=>bakeMat({map:t.map,normalMap:t.normalMap??null,roughnessMap:t.roughnessMap??null,vertexColors:true,roughness:o.r??.85,metalness:o.m??0,normalScale:new THREE.Vector2(o.ns??1,o.ns??1),side:o.side??THREE.FrontSide});
 const M={stucco:tm(TX.stucco,{r:.92}),marble:tm(TX.marble,{r:.35}),parquet:tm(TX.parquet,{r:.45}),terracotta:tm(TX.terracotta,{r:.8}),roof:tm(TX.roof,{r:.75}),travertine:tm(TX.travertine,{r:.8}),
  rock:tm(TX.rock,{r:.95,ns:1.4}),grass:tm(TX.grass,{r:.95}),gravel:tm(TX.gravel,{r:.95}),planks:tm(TX.planks,{r:.75}),kitchen:tm(TX.kitchen,{r:.3}),carpet:tm(TX.carpet,{r:1}),panel:tm(TX.panel,{r:.5}),
  brick:tm(TX.brick,{r:.9}),metal:tm(TX.metal,{r:.4,m:.2}),cloth:tm(TX.cloth,{r:.9}),coffer:tm(TX.coffer,{r:.7}),books:tm({map:TX.books},{r:.8}),screens:tm({map:TX.screens},{r:.4}),
  plain:bakeMat({vertexColors:true,roughness:.7}),gloss:bakeMat({vertexColors:true,roughness:.25,metalness:.1}),gold:bakeMat({vertexColors:true,roughness:.3,metalness:.9,color:0xffffff}),
  leaf:bakeMat({vertexColors:true,roughness:.9,map:TX.grass.map,side:THREE.DoubleSide}),chrome:bakeMat({vertexColors:true,roughness:.3,metalness:.45})};
 M.screens.emissive=new THREE.Color(1,1,1);M.screens.emissiveMap=TX.screens;M.screens.emissiveIntensity=.9;
 const B={};const gb=k=>B[k]||(B[k]=new GB());
 const emit=new THREE.MeshBasicMaterial({color:new THREE.Color(5,3.6,2.2)}),emitSoft=new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1.7,1.05)}),emitShade=new THREE.MeshBasicMaterial({color:new THREE.Color(1.9,1.25,.7)});
 const EM={},em=(k)=>EM[k]||(EM[k]=[]);
 const glassM=new THREE.MeshStandardMaterial({color:0x9ab4c0,roughness:.05,metalness:.6,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide});const glassG=[];
 const c=h=>lin(h);
 /* ---------- floors, ramps, walls, boxes */
 for(const r of L.recs){
  if(r.t==='floor'){const ins=!!r.ceil,sub=ins?1:2.5,nu=Math.max(1,Math.round((r.x1-r.x0)/sub)),nv=Math.max(1,Math.round((r.z1-r.z0)/sub));
   gb(r.mat).quad([[r.x0,r.y,r.z0],[r.x1,r.y,r.z0],[r.x1,r.y,r.z1],[r.x0,r.y,r.z1]],[0,1,0],p=>[p[0]/r.s,p[2]/r.s],c(r.col),nu,nv);
   if(r.ceil){const y=r.y+r.ceil,cs=r.cs||2;gb(r.cmat||'stucco').quad([[r.x0,y,r.z0],[r.x1,y,r.z0],[r.x1,y,r.z1],[r.x0,y,r.z1]],[0,-1,0],p=>[p[0]/cs,p[2]/cs],c(r.ccol??0xf4eee2),nu,nv);
    // crown moulding
    const cm=gb('plain'),k=c(0xf0e6d0);for(const[a0,b0,a1,b1]of[[r.x0,r.z0,r.x1,r.z0+.12],[r.x0,r.z1-.12,r.x1,r.z1],[r.x0,r.z0,r.x0+.12,r.z1],[r.x1-.12,r.z0,r.x1,r.z1]])cm.box(a0,y-.16,b0,a1,y,b1,k);}}
  else if(r.t==='ramp'){const rise=r.y1-r.y0,len=r.ax==='z'?r.z1-r.z0:r.x1-r.x0,n=Math.max(2,Math.round(Math.abs(rise)/.17));const b=gb(r.mat);
   for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,yTop=r.y0+rise*(rise<0?t1:t0)+(rise<0?0:rise/n);// stepped
    const ya=Math.min(r.y0+rise*t0,r.y0+rise*t1),yb=Math.max(r.y0+rise*t0,r.y0+rise*t1);const top=rise<0?r.y0+rise*t0:r.y0+rise*t1;void yTop;
    if(r.ax==='z')b.box(r.x0,ya-.6,r.z0+len*t0,r.x1,top,r.z0+len*t1,c(r.col),{s:2,skip:'ny'});else b.box(r.x0+len*t0,ya-.6,r.z0,r.x0+len*t1,top,r.z1,c(r.col),{s:2,skip:'ny'});void yb;}
   if(r.ceil){const cb=gb('stucco');const y0=r.y0+r.ceil,y1=r.y1+r.ceil;cb.quad([[r.x0,y0,r.z0],[r.x1,y0,r.z0],[r.x1,y1,r.z1],[r.x0,y1,r.z1]],[0,-1,0],p=>[p[0]/2,p[2]/2],c(0xe8e0d0),2,8);}}
  else if(r.t==='wall')buildWall(r,gb,c,glassG,em);
  else if(r.t==='box')gb(r.mat).box(r.x0,r.y0,r.z0,r.x1,r.y1,r.z1,c(r.col),{s:r.s,skip:r.skip||'ny',sub:(r.x1-r.x0)>3||(r.z1-r.z0)>3?1.5:0});
  else dress(r,gb,c,em,TX,L);}
 dressInteriors(gb,c,em,TX,L);
 /* ---------- lamp fixtures */
 for(const l of L.lamps){if(!l.vis)continue;const{x,y,z}=l;const P=gb('plain'),Gd=gb('gold'),gl=em('glow');
  if(l.kind==='chand'){/* dynamic, built in game.js */}
  else if(l.kind==='chandS'){for(let i=0;i<8;i++){const a=i/8*PI*2;Gd.add(CY(.012,.012,.5,4),M4(x+Math.cos(a)*.25,y+.1,z+Math.sin(a)*.25,0,0,PI/2.6*Math.cos(a)),c(0xd8b060));gl.push([x+Math.cos(a)*.5,y+.22,z+Math.sin(a)*.5,.06]);}
   Gd.add(CY(.02,.02,5-y+0,6),M4(x,(y+5)/2,z),c(0xb89050));Gd.add(SP(.12,10,8),M4(x,y,z),c(0xd8b060));}
  else if(l.kind==='sconce'){const s=x>0?-1:1;Gd.add(BX(.06,.3,.12),M4(x+s*.45,y-.1,z),c(0xc8a050));gl.push([x+s*.3,y,z,.07]);em('shade').push([x+s*.3,y+.05,z,.13,.16]);}
  else if(l.kind==='ceil'){P.add(CY(.28,.32,.08,14),M4(x,y+.18,z),c(0xf0f0ea));em('panel').push([x,y+.13,z,.24]);}
  else if(l.kind==='pendant'){Gd.add(CY(.01,.01,1.4,4),M4(x,y+.75,z),c(0x3a3020));em('shade').push([x,y,z,.3,.24]);gl.push([x,y-.05,z,.08]);}
  else if(l.kind==='desk'){Gd.add(CY(.02,.02,.4,6),M4(x,y-.25,z),c(0xb89050));em('shade').push([x,y,z,.16,.16]);}
  else if(l.kind==='fire'){P.box(x+.05,0,z-1.4,x+.9,1.6,z+1.4,c(0xd8ccb8));P.box(x-.1,1.5,z-1.6,x+.9,1.7,z+1.6,c(0xe8dcc8));gb('brick').box(x,0,z-.8,x+.1,1,z+.8,c(0x222018));em('fire').push([x-.05,.35,z,.7]);}
  else if(l.kind==='lantern'){Gd.add(CY(.01,.01,y>3?4.4-y:.6,4),M4(x,y>3?(4.4+y)/2:y+.4,z),c(0x2a2a2a));P.add(CY(.13,.1,.32,6),M4(x,y,z),c(0x1a1a1a));gl.push([x,y,z,.09]);}
  else if(l.kind==='pole'){gb('planks').add(CY(.06,.08,y+.2,6),M4(x,L.h(x,z)+y/2-.1+L.h(x,z)*0,z),c(0x6a5040));gl.push([x,L.h(x,z)+y+.05,z,.07]);}
  else if(l.kind==='gate'){P.box(x-.35,0,z-.35,x+.35,3,z+.35,c(0xd8ccb4));P.add(CY(.16,.12,.42,6),M4(x,3.25,z),c(0x1a1a1a));gl.push([x,3.3,z,.12]);}
  else if(l.kind==='post'){const fy=L.h(x,z);const b=fy===fy?fy:y-3.2;P.add(CY(.06,.1,y-b,8),M4(x,(y+b)/2,z),c(0x1a1c1e));P.add(CY(.18,.12,.4,6),M4(x,y+.1,z),c(0x1a1c1e));gl.push([x,y,z,.13]);}
  else if(l.kind==='flood'){P.box(x-.2,y-.1,z-.2,x+.2,y+.15,z+.2,c(0x2a2a2a));em('panel').push([x+(x<-35?.0:.22),y-.12,z,.14]);}
  else if(l.kind==='bulb'){Gd.add(CY(.006,.006,Math.max(.1,-.2-y),3),M4(x,(y-.2)/2,z),c(0x1a1a1a));gl.push([x,y,z,.07]);}}
 /* ---------- string lights between garden poles: catenary with bulbs */
 const bulbs=[];if(L.strings){const lineP=[];for(const[a,b]of L.strings){const A=L.poles[a],Bp=L.poles[b];const ya=L.h(A[0],A[1])+3.2,yb=L.h(Bp[0],Bp[1])+3.2;const d=Math.hypot(Bp[0]-A[0],Bp[1]-A[1]),n=Math.round(d/.9);
   let prev=null;for(let i=0;i<=n;i++){const t=i/n,x=A[0]+(Bp[0]-A[0])*t,z=A[1]+(Bp[1]-A[1])*t,y=ya+(yb-ya)*t-Math.sin(t*PI)*Math.min(1.4,d*.08);if(prev)lineP.push(...prev,x,y,z);prev=[x,y,z];if(i>0&&i<n)bulbs.push([x,y-.06,z]);}}
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lineP,3));G.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x221a14})));}
 const bm=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(5,3.4,1.8)}),bulbs.length);bulbs.forEach((p,i)=>bm.setMatrixAt(i,M4(p[0],p[1],p[2])));G.add(bm);
 /* ---------- emissive bits (merged per kind) */
 const emG=(list,f)=>{const gs=[];for(const a of list)gs.push(f(a));return gs;};
 const merge=(gs,mat)=>{if(!gs.length)return;const g=mergeN(gs);G.add(new THREE.Mesh(g,mat));};
 merge(emG(em('glow'),([x,y,z,r])=>SP(r,8,6).translate(x,y,z)),emit);
 merge(emG(em('shade'),([x,y,z,r,h])=>CY(r*.55,r,h,12,1,true).translate(x,y,z)),emitShade);
 merge(emG(em('panel'),([x,y,z,r])=>CY(r,r,.02,14).translate(x,y,z)),emitSoft);
 merge(emG(em('fire'),([x,y,z,w])=>BX(.05,.5,w).translate(x,y,z)),new THREE.MeshBasicMaterial({color:new THREE.Color(5,1.8,.4)}));
 merge(emG(em('win'),a=>a),new THREE.MeshBasicMaterial({color:new THREE.Color(1.5,.95,.5),transparent:true,opacity:.55,depthWrite:false}));
 merge(emG(em('water'),a=>a),new THREE.MeshStandardMaterial({color:0x2a6a7a,roughness:.05,metalness:.3,transparent:true,opacity:.8,emissive:0x0a3a4a,emissiveIntensity:1}));
 if(glassG.length)G.add(new THREE.Mesh(mergeN(glassG),glassM));
 /* ---------- bake + meshes */
 const bake=makeBaker(L);
 for(const k in B){if(B[k].empty)continue;const m=new THREE.Mesh(B[k].geo(bake),M[k]||M.plain);m.castShadow=k!=='grass'&&k!=='gravel';m.receiveShadow=true;G.add(m);}
 /* ---------- environment */
 G.add(makeSky());const sea=makeSea();G.add(sea);buildTerrain(G,M);
 const light=lightGrid(L,bake);
 return{group:G,M,light,sun:SUN,bake};}

function mergeN(list){const gs=list.map(g=>g.index?g.toNonIndexed():g);let n=0;for(const g of gs)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),UV=new Float32Array(n*2);let o=0;
 for(const g of gs){P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)UV.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;}const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(P,3));out.setAttribute('normal',new THREE.BufferAttribute(N,3));out.setAttribute('uv',new THREE.BufferAttribute(UV,2));out.computeBoundingSphere();return out;}

/* ---------- walls: segments around door/window holes, frames, shutters, trims */
function buildWall(r,gb,c,glassG,em){const b=gb(r.mat),bB=r.matB?gb(r.matB):b,t=r.th/2,y=r.y,h=r.h,col=c(r.col),colB=c(r.colB??r.col);const along=r.along;
 // face quads between a0..a1 at y range; side: +1 (pos side) / -1
 const P=(a,yy,s)=>along?[a,yy,r.c+s*t]:[r.c+s*t,yy,a];
 const face=(a0,a1,y0,y1,s)=>{if(a1-a0<.005||y1-y0<.005)return;const n=along?[0,0,s]:[s,0,0];const nu=Math.max(1,Math.round((a1-a0)/1)),nv=Math.max(1,Math.round((y1-y0)/1.3));
  (s>0?b:bB).quad([P(a0,y+y0,s),P(a1,y+y0,s),P(a1,y+y1,s),P(a0,y+y1,s)],n,p=>[(along?p[0]:p[2])/r.s,p[1]/r.s],s>0?col:colB,nu,nv);};
 const top=(a0,a1,yy)=>{b.quad([P(a0,y+yy,-1),P(a1,y+yy,-1),P(a1,y+yy,1),P(a0,y+yy,1)],[0,1,0],p=>[p[0]/r.s,p[2]/r.s],col);};
 const bot=(a0,a1,yy)=>{b.quad([P(a0,y+yy,-1),P(a1,y+yy,-1),P(a1,y+yy,1),P(a0,y+yy,1)],[0,-1,0],p=>[p[0]/r.s,p[2]/r.s],col);};
 const jamb=(a,y0,y1,dir)=>{const n=along?[dir,0,0]:[0,0,dir];b.quad([P(a,y+y0,-1),P(a,y+y0,1),P(a,y+y1,1),P(a,y+y1,-1)],n,p=>[(along?p[2]:p[0])/r.s,p[1]/r.s],col);};
 const segs=[];let p=r.a0;for(const H of r.holes){segs.push([p,H.a]);p=H.b;}segs.push([p,r.a1]);
 for(const[a0,a1]of segs){for(const s of[1,-1])face(a0,a1,0,h,s);top(a0,a1,h);}
 for(const H of r.holes){for(const s of[1,-1]){face(H.a,H.b,H.hi,h,s);if(H.lo>0)face(H.a,H.b,0,H.lo,s);}bot(H.a,H.b,H.hi);if(H.lo>0)top(H.a,H.b,H.lo);jamb(H.a,H.lo,H.hi,1);jamb(H.b,H.lo,H.hi,-1);
  // frames: stone surround on both faces; windows get glass, mullions, a warm inner glow and shutters outside
  const fc=c(r.frame),fb=gb('plain'),W=H.b-H.a,ext=r.base&&r.trim==='cornice';
  for(const s of[1,-1]){const o=s*(t+.03);const Bx=(a0,y0,a1,y1)=>along?fb.box(a0,y+y0,r.c+o-.035,a1,y+y1,r.c+o+.035,fc):fb.box(r.c+o-.035,y+y0,a0,r.c+o+.035,y+y1,a1,fc);
   Bx(H.a-.12,H.lo,H.a,H.hi+.12);Bx(H.b,H.lo,H.b+.12,H.hi+.12);Bx(H.a-.12,H.hi,H.b+.12,H.hi+.14);if(H.win)Bx(H.a-.16,H.lo-.08,H.b+.16,H.lo);}
  if(H.win){const g=along?BX(W,H.hi-H.lo,.02).translate((H.a+H.b)/2,y+(H.lo+H.hi)/2,r.c):BX(.02,H.hi-H.lo,W).translate(r.c,y+(H.lo+H.hi)/2,(H.a+H.b)/2);glassG.push(g);
   const mc=c(0x2a2a26);const nm=Math.max(1,Math.round(W/.8));for(let i=1;i<nm;i++){const a=H.a+W*i/nm;along?fb.box(a-.025,y+H.lo,r.c-.03,a+.025,y+H.hi,r.c+.03,mc):fb.box(r.c-.03,y+H.lo,a-.025,r.c+.03,y+H.hi,a+.025,mc);}
   const mid=H.lo+(H.hi-H.lo)*.62;along?fb.box(H.a,y+mid-.025,r.c-.03,H.b,y+mid+.025,r.c+.03,mc):fb.box(r.c-.03,y+mid-.025,H.a,r.c+.03,y+mid+.025,H.b,mc);
   if(ext){const sc=c(0x3a5a48);for(const s of[1])for(const[a0,a1]of[[H.a-W*.5-.14,H.a-.14],[H.b+.14,H.b+W*.5+.14]]){const o=-(t+.06)*1;void s;
     const sh=gb('planks');along?sh.box(a0,y+H.lo-.05,r.c+o-.03,a1,y+H.hi+.05,r.c+o+.02,sc,{s:.6}):sh.box(r.c+o-.03,y+H.lo-.05,a0,r.c+o+.02,y+H.hi+.05,a1,sc,{s:.6});}}}}
 // base skirting + top trims
 if(r.base){const kc=r.trim==='cornice'?c(0xcab89a):c(0x4a3a2a);for(const[a0,a1]of segs)for(const s of[1,-1]){const o=s*(t+.015);along?gb('plain').box(a0,y,r.c+o-.02,a1,y+.14,r.c+o+.02,kc):gb('plain').box(r.c+o-.02,y,a0,r.c+o+.02,y+.14,a1,kc);}}
 if(r.trim==='cornice'){const cc=c(0xf4e8d0);const o=-(t+.12);along?gb('plain').box(r.a0-.2,y+h-.32,r.c-t-.22,r.a1+.2,y+h-.08,r.c+t+.22,cc):gb('plain').box(r.c-t-.22,y+h-.32,r.a0-.2,r.c+t+.22,y+h-.08,r.a1+.2,cc);void o;}
 if(r.trim==='gold'){const gc=c(0xd0a858);for(const[a0,a1]of segs)for(const s of[1,-1]){const o=s*(t+.012);for(const yy of[1,4.6,6.6])along?gb('gold').box(a0,y+yy,r.c+o-.012,a1,y+yy+.05,r.c+o+.012,gc):gb('gold').box(r.c+o-.012,y+yy,a0,r.c+o+.012,y+yy+.05,a1,gc);}}
 if(r.trim==='cap'){const cc=c(0xe8dcc4);along?gb('travertine').box(r.a0,y+h,r.c-t-.08,r.a1,y+h+.18,r.c+t+.08,cc):gb('travertine').box(r.c-t-.08,y+h,r.a0,r.c+t+.08,y+h+.18,r.a1,cc);}}

/* ---------- dressing: vis records */
function dress(r,gb,c,em,TX,L){const P=gb('plain');
 if(r.t==='balus'||r.t==='tbalus'){const pts=[[.0,0],[.07,0],[.07,.06],[.045,.12],[.06,.32],[.085,.48],[.04,.68],[.06,.74],[.06,.8],[0,.8]];const lg=lath(pts,8);const T=gb('travertine'),k=c(0xece2cc);
  for(let x=r.x0;x<=r.x1;x+=.32)T.add(lg,M4(x,r.y+.12,r.z),k,.3);T.box(r.x0,r.y,r.z-.2,r.x1,r.y+.12,r.z+.2,k,{s:1});T.box(r.x0-.05,r.y+.92,r.z-.17,r.x1+.05,r.y+1.06,r.z+.17,k,{s:1});
  for(let x=r.x0;x<=r.x1;x+=6)T.box(x-.2,r.y,r.z-.2,x+.2,r.y+1.12,r.z+.2,k,{s:1});}
 else if(r.t==='rail'){const n=Math.round((r.z1-r.z0)/2);for(let i=0;i<=n;i++){const z=r.z0+(r.z1-r.z0)*i/n,y=r.y0+(r.y1-r.y0)*i/n;P.add(CY(.03,.03,1,6),M4(r.x,y+.5,z),c(0x2a2a2a));}
  const dz=r.z1-r.z0,dy=r.y1-r.y0,len=Math.hypot(dz,dy);P.add(CY(.035,.035,len,6),M4(r.x,(r.y0+r.y1)/2+1,(r.z0+r.z1)/2,PI/2-Math.atan2(dy,dz)),c(0x2a2a2a));}
 else if(r.t==='pierRail'){const k=c(0x6a5038),Pl=gb('planks');for(const x of[r.x0,r.x1])for(let z=r.z0;z<=r.z1;z+=2)Pl.box(x-.08,r.y-2.4,z-.08,x+.08,r.y+1,z+.08,k,{s:.5});
  for(const x of[r.x0,r.x1])Pl.box(x-.06,r.y+.9,r.z0,x+.06,r.y+1.02,r.z1,k,{s:1});for(let x=r.x0;x<=r.x1;x+=.5)Pl.box(x-.08,r.y-2.4,r.z0-.08,x+.08,r.y-.02,r.z0+.08,k,{s:.5});
  for(let z=r.z0;z<=r.z1;z+=2.5)for(let x=r.x0+.4;x<r.x1;x+=1.6)Pl.add(CY(.14,.16,2.6,8),M4(x,r.y-1.3,z),c(0x4a3a2a));}
 else if(r.t==='roof'){const{x0,z0,x1,z1,y,h}=r,R=gb('roof'),k=c(0xffffff),w=x1-x0,d=z1-z0;const sx=w>=d;const m=(sx?d:w)/2;
  // hip roof: ridge along the long axis
  if(sx){const ra=x0+m,rb=x1-m,zc=(z0+z1)/2,yt=y+h;const sl=Math.hypot(m,h);
   R.quad([[x0,y,z0],[x1,y,z0],[rb,yt,zc],[ra,yt,zc]],[0,m,-h].map(v=>v/sl),p=>[p[0]/2,Math.hypot(p[1]-y,p[2]-z0)/2],k);R.quad([[x1,y,z1],[x0,y,z1],[ra,yt,zc],[rb,yt,zc]],[0,m,h].map(v=>v/sl),p=>[-p[0]/2,Math.hypot(p[1]-y,p[2]-z1)/2],k);
   R.quad([[x0,y,z1],[x0,y,z0],[ra,yt,zc],[ra,yt,zc]],[-h,m,0].map(v=>v/sl),p=>[p[2]/2,Math.hypot(p[1]-y,p[0]-x0)/2],k);R.quad([[x1,y,z0],[x1,y,z1],[rb,yt,zc],[rb,yt,zc]],[h,m,0].map(v=>v/sl),p=>[-p[2]/2,Math.hypot(p[1]-y,p[0]-x1)/2],k);
   P.box(ra,yt-.06,zc-.1,rb,yt+.1,zc+.1,c(0x8a3a22));}
  else{const ra=z0+m,rb=z1-m,xc=(x0+x1)/2,yt=y+h;const sl=Math.hypot(m,h);
   R.quad([[x0,y,z1],[x0,y,z0],[xc,yt,ra],[xc,yt,rb]],[-h,m,0].map(v=>v/sl),p=>[p[2]/2,Math.hypot(p[1]-y,p[0]-x0)/2],k);R.quad([[x1,y,z0],[x1,y,z1],[xc,yt,rb],[xc,yt,ra]],[h,m,0].map(v=>v/sl),p=>[-p[2]/2,Math.hypot(p[1]-y,p[0]-x1)/2],k);
   R.quad([[x1,y,z0],[x0,y,z0],[xc,yt,ra],[xc,yt,ra]],[0,m,-h].map(v=>v/sl),p=>[p[0]/2,Math.hypot(p[1]-y,p[2]-z0)/2],k);R.quad([[x0,y,z1],[x1,y,z1],[xc,yt,rb],[xc,yt,rb]],[0,m,h].map(v=>v/sl),p=>[-p[0]/2,Math.hypot(p[1]-y,p[2]-z1)/2],k);
   P.box(xc-.1,yt-.06,ra,xc+.1,yt+.1,rb,c(0x8a3a22));}
  gb('stucco').quad([[x0,y-.02,z0],[x1,y-.02,z0],[x1,y-.02,z1],[x0,y-.02,z1]],[0,-1,0],p=>[p[0]/2,p[2]/2],c(0xe8dcc4));P.box(x0,y-.22,z0,x1,y,z0+.1,c(0xf0e4cc));P.box(x0,y-.22,z1-.1,x1,y,z1,c(0xf0e4cc));P.box(x0,y-.22,z0,x0+.1,y,z1,c(0xf0e4cc));P.box(x1-.1,y-.22,z0,x1,y,z1,c(0xf0e4cc));}
 else if(r.t==='loggia'){const T=gb('travertine'),k=c(0xf2e8d2);T.box(r.x0-.3,r.y,r.z0,r.x1+.3,r.y+.5,r.z1,k,{s:2});gb('roof').quad([[r.x0-.4,r.y+.5,r.z1+.3],[r.x1+.4,r.y+.5,r.z1+.3],[r.x1+.4,r.y+1.1,r.z0],[r.x0-.4,r.y+1.1,r.z0]],[0,.98,.2],p=>[p[0]/2,p[2]/2],c(0xffffff));
  // arcade: columns + arched frieze panel
  const colG=lath([[.32,0],[.3,.12],[.24,.2],[.22,.3],[.19,3.6],[.24,3.72],[.3,3.82],[.32,3.95],[0,3.95]],14);for(let x=r.x0;x<=r.x1+.01;x+=3.5)T.add(colG,M4(x,0,2.3),k,.5);
  const sh=new THREE.Shape();sh.moveTo(r.x0-.3,0);sh.lineTo(r.x1+.3,0);sh.lineTo(r.x1+.3,1.4);sh.lineTo(r.x0-.3,1.4);sh.closePath();
  for(let x=r.x0;x<r.x1-.1;x+=3.5){const hp=new THREE.Path();hp.moveTo(x+.25,0);hp.lineTo(x+3.25,0);hp.lineTo(x+3.25,.15);hp.absarc(x+1.75,.15,1.5,0,PI,false);hp.lineTo(x+.25,0);sh.holes.push(hp);}
  const fg=new THREE.ExtrudeGeometry(sh,{depth:.5,bevelEnabled:false,curveSegments:10});T.add(fg,M4(0,r.y-1.4+.02,2.05),k,.5);}
 else if(r.t==='table'){const y=r.y;if(r.bistro){P.add(CY(.45,.45,.04,16),M4(r.x,y+.74,r.z),c(0xe8e2d8));P.add(CY(.03,.05,.72,6),M4(r.x,y+.37,r.z),c(0x2a2a2a));P.add(CY(.22,.25,.03,10),M4(r.x,y+.015,r.z),c(0x2a2a2a));
   P.add(CY(.02,.02,2.2,5),M4(r.x,y+1.1,r.z),c(0xe8e0d0));gb('cloth').add(new THREE.ConeGeometry(1.4,.6,10,1,true),M4(r.x,y+2.4,r.z),c(0xf4ecd8));for(let i=0;i<2;i++){const a=i*PI+.6;chair(P,r.x+Math.cos(a)*.75,y,r.z+Math.sin(a)*.75,-a-PI/2,c(0x2a2a2a),c(0xe8e0d0));}}
  else if(r.high){gb('cloth').add(CY(.42,.36,1.12,14,1),M4(r.x,y+.56,r.z),c(0xffffff));P.add(CY(.44,.44,.03,16),M4(r.x,y+1.13,r.z),c(0xf8f4ec));em('glow').push([r.x,y+1.2,r.z,.035]);}
  else{gb('cloth').add(lath([[0,0],[r.r*.95,0],[r.r,.04],[r.r*1.02,.76],[r.r*.98,.78],[0,.79]],20),M4(r.x,y,r.z),c(0xfaf6ee));P.add(CY(.1,.12,.3,8),M4(r.x,y+.94,r.z),c(0xe8e4dc));
   for(let i=0;i<5;i++)P.add(SP(.06,6,4),M4(r.x+Math.cos(i*1.25)*.08,y+1.12,r.z+Math.sin(i*1.25)*.08),c([0xe86a6a,0xf4e4d0,0xe8a0b0][i%3]));em('glow').push([r.x+.25,y+.86,r.z,.02],[r.x-.25,y+.86,r.z,.02]);
   for(let i=0;i<6;i++){const a=i/6*PI*2+.3;chair(gb('gold'),r.x+Math.cos(a)*(r.r+.35),y,r.z+Math.sin(a)*(r.r+.35),-a-PI/2,c(0xc8a050),c(0xe8dcc8));}}}
 else if(r.t==='bottles'){const cols=[0x2a4a2a,0x5a1a1a,0x1a2a1a,0x6a4a1a,0xd8d0b0];const n=r.x0!==undefined?Math.round((r.x1-r.x0)/.13):Math.round(Math.abs(r.z1-r.z0)/.13);
  for(let row=0;row<3;row++)for(let i=0;i<n;i++){const t=i/n;const x=r.x0!==undefined?r.x0+(r.x1-r.x0)*t:r.x,z=r.x0!==undefined?r.z0:r.z0+(r.z1-r.z0)*t;if(rnd()<.15)continue;gb('gloss').add(CY(.035,.035,.26,6),M4(x,r.y+row*.45,z),c(cols[rnd()*cols.length|0]));}}
 else if(r.t==='fountain'){const T=gb('travertine'),k=c(0xece2cc);if(r.small){T.add(lath([[0,0],[2,0],[2,.55],[1.8,.6],[1.8,.2],[0,.2]],28),M4(r.x,r.y,r.z),k,.5);T.add(lath([[.3,0],[.25,1],[.8,1.1],[.8,1.2],[.2,1.25],[.15,1.8],[0,1.9]],16),M4(r.x,r.y,r.z),k,.5);em('water').push(CY(1.8,1.8,.02,28).translate(r.x,r.y+.45,r.z));}
  else{T.add(lath([[0,0],[3,0],[3,.6],[2.75,.66],[2.75,.2],[0,.2]],36),M4(r.x,r.y,r.z),k,.5);T.add(lath([[.5,0],[.4,1.4],[1.4,1.5],[1.4,1.65],[.35,1.7],[.25,2.6],[.7,2.7],[.7,2.8],[.2,2.85],[.12,3.4],[0,3.5]],18),M4(r.x,r.y,r.z),k,.5);
   em('water').push(CY(2.75,2.75,.02,36).translate(r.x,r.y+.5,r.z),CY(1.35,1.35,.02,18).translate(r.x,r.y+1.6,r.z),CY(.65,.65,.02,14).translate(r.x,r.y+2.76,r.z));}}
 else if(r.t==='hedge'){const H=gb('leaf');const k=c(0x5a7a3a);H.box(r.x0,r.y,r.z0,r.x1,r.y+r.h,r.z1,k,{s:.8,skip:'ny',sub:1});for(let x=r.x0+.4;x<r.x1;x+=1.1)H.add(SP(.32,6,4),M4(x,r.y+r.h,(r.z0+r.z1)/2,0,0,0,1.4,.7,1.6),c(0x4e6e32),.5);}
 else if(r.t==='gazebo'){const T=gb('travertine'),k=c(0xf0e6d2);T.add(CY(4.2,4.4,.3,6),M4(r.x,r.y+.15,r.z),k,.5);for(let i=0;i<6;i++){const a=i*PI/3;T.add(CY(.16,.2,3.1,10),M4(r.x+Math.cos(a)*3.6,r.y+1.85,r.z+Math.sin(a)*3.6),k,.5);}
  T.add(CY(4.3,4.3,.4,6),M4(r.x,r.y+3.55,r.z),k,.5);gb('roof').add(new THREE.ConeGeometry(4.6,2.2,6),M4(r.x,r.y+4.85,r.z),c(0x9a8a7a),.5);gb('gold').add(SP(.2,8,6),M4(r.x,r.y+6,r.z),c(0xc8a050));}
 else if(r.t==='car'){const{x,z,col}=r,k=c(col),y=0,ry=r.r;const cm=new THREE.Matrix4().makeRotationY(ry);const at=(g,m)=>gb('gloss').add(g,new THREE.Matrix4().makeTranslation(x,y,z).multiply(cm).multiply(m),k);
  at(BX(1.9,.62,4.5),M4(0,.6,0));at(BX(1.7,.5,2.3),M4(0,1.15,-.25));const gl=c(0x101418);gb('gloss').add(BX(1.72,.42,2.1),new THREE.Matrix4().makeTranslation(x,y,z).multiply(cm).multiply(M4(0,1.16,-.25)),gl);
  for(const sx of[-.85,.85])for(const sz of[-1.45,1.45])P.add(CY(.36,.36,.24,14),new THREE.Matrix4().makeTranslation(x,y,z).multiply(cm).multiply(M4(sx,.36,sz,0,0,PI/2)),c(0x111111));
  em('glow').push([x+.6,y+.68,z+2.26,.07],[x-.6,y+.68,z+2.26,.07]);}
 else if(r.t==='van'){const{x,z}=r;gb('gloss').box(x-1.15,.35,z-3.4,x+1.15,2.5,z+2.4,c(0xe8e8e4));gb('gloss').box(x-1.1,.35,z+2.4,x+1.1,1.6,z+3.4,c(0xe8e8e4));gb('gloss').box(x-1,1.3,z+2.3,x+1,2.1,z+2.6,c(0x101418));
  for(const sx of[-1,1])for(const sz of[-2.3,2.4])P.add(CY(.4,.4,.26,14),M4(x+sx*1.05,.4,z+sz,0,0,PI/2),c(0x111111));const t=labelTex('SERAFINA CATERING',{w:512,h:96,size:42,col:'#6a3a2a',font:'Georgia,serif'});void t;}
 else if(r.t==='tree'){const{x,z,y,k}=r;if(k==='cypress'){gb('planks').add(CY(.12,.18,1.2,6),M4(x,y+.6,z),c(0x4a3424));const L2=gb('leaf');const h=7+rnd()*3;
   for(let i=0;i<7;i++){const t=i/6;L2.add(SP(1,8,6),M4(x+(rnd()-.5)*.2,y+1+t*h*.85,z+(rnd()-.5)*.2,0,rnd()*3,0,(1-t*.75)*.95,1.6,(1-t*.75)*.95),c(0x2c4220),.4);}}
  else if(k==='olive'){const Tr=gb('planks');Tr.add(CY(.16,.26,2.2,7),M4(x,y+1.1,z,.12,0,.1),c(0x5a4a3a));for(let i=0;i<3;i++){const a=i*2.1;Tr.add(CY(.06,.1,1.6,5),M4(x+Math.cos(a)*.5,y+2.4,z+Math.sin(a)*.5,Math.sin(a)*.6,0,-Math.cos(a)*.6),c(0x5a4a3a));}
   const L2=gb('leaf');for(let i=0;i<9;i++){const a=rnd()*PI*2,rr=rnd()*1.4;L2.add(SP(.9+rnd()*.5,8,6),M4(x+Math.cos(a)*rr,y+2.9+rnd()*1.1,z+Math.sin(a)*rr,0,0,0,1.2,.7,1.2),c([0x6a7a52,0x5a6c48,0x76865c][i%3]),.4);}}
  else{const Tr=gb('planks');let px=x,pz=z,py=y;const lean=rnd()*PI*2;for(let i=0;i<8;i++){const nx=px+Math.cos(lean)*.12,nz=pz+Math.sin(lean)*.12;Tr.add(CY(.15-i*.008,.2-i*.008,1.12,7),M4((px+nx)/2,py+.5,(pz+nz)/2),c(i%2?0x7a6a52:0x6a5a44));px=nx;pz=nz;py+=1;}
   const L2=gb('leaf');for(let i=0;i<9;i++){const a=i/9*PI*2;const fr=new THREE.PlaneGeometry(.6,3.2,1,4);const p=fr.attributes.position;for(let k2=0;k2<p.count;k2++){const yy=p.getY(k2)+1.6;p.setZ(k2,-yy*yy*.06);p.setX(k2,p.getX(k2)*(1-yy/3.4));}fr.computeVertexNormals();
    L2.add(fr,M4(px,py+.1,pz,0,0,0).multiply(M4(0,0,0,0,-a,0)).multiply(M4(0,0,0,-1.1,0,0)).multiply(M4(0,1.6,0)),c(0x4a6a2a));L2.add(fr,M4(px,py+.1,pz,0,0,0).multiply(M4(0,0,0,0,-a,0)).multiply(M4(0,0,0,-1.1,0,0)).multiply(M4(0,1.6,-.01,0,PI,0)),c(0x3a5a22));}}}
 else if(r.t==='mound'){const k=c(0x6a5a3a),Gs=gb('grass');Gs.box(r.x0,r.y-1.5,r.z0,r.x1,r.y,r.z1,c(0x7a8a4a),{s:3,skip:'ny',sub:2.5});gb('travertine').box(r.x0,-.4,r.z1-.25,r.x1,r.y+.2,r.z1+.05,c(0xd8ccb4),{s:2});void k;
  const L2=gb('leaf');for(let i=0;i<34;i++){const x=r.x0+.8+rnd()*(r.x1-r.x0-1.6),z=r.z0+.8+rnd()*(r.z1-r.z0-1.6);L2.add(SP(.5+rnd()*.5,7,5),M4(x,r.y+.2,z,0,0,0,1,.6,1),c([0x6a7a42,0x8a6a9a,0x7a8a52,0xa87ab8][i%4]),.4);}}}
function chair(b,x,y,z,yaw,k,k2){const m=M4(x,y,z,0,yaw,0);const at=(g,mm)=>b.add(g,m.clone().multiply(mm),k);at(BX(.42,.05,.42),M4(0,.46,0));for(const sx of[-.18,.18])for(const sz of[-.18,.18])at(CY(.018,.018,.46,5),M4(sx,.23,sz));at(BX(.42,.5,.04),M4(0,.74,-.2));void k2;}

/* ---------- room interiors that are easier to describe as code than as records */
function dressInteriors(gb,c,em,TX,L){const P=gb('plain'),Gd=gb('gold'),Pn=gb('panel'),Mt=gb('metal'),Cl=gb('cloth'),Pl=gb('planks'),Mb=gb('marble');
 // ballroom: pilasters, paintings, rug, quartet chairs + stands, stage steps, podium mic
 for(const x of[-10.5,-7,-3.5,3.5,7,10.5])for(const z of[-21.76,-2.24]){if(Math.abs(x)<3.2&&z<-20)continue;gb('stucco').box(x-.32,0,z-.12,x+.32,7.6,z+.12,c(0xf6eedc),{s:2});Gd.box(x-.36,7.2,z-.15,x+.36,7.45,z+.15,c(0xd0a858));Gd.box(x-.36,0,z-.15,x+.36,.3,z+.15,c(0xd0a858));}
 for(const z of[-18.5,-15,-8.5,-5])for(const x of[-13.76,13.76]){gb('stucco').box(x-.12,0,z-.32,x+.12,7.6,z+.32,c(0xf6eedc),{s:2});Gd.box(x-.15,7.2,z-.36,x+.15,7.45,z+.36,c(0xd0a858));}
 const painting=(x,y,z,w,h,ry,k)=>{const m=M4(x,y,z,0,ry,0);Gd.add(BX(w+.2,h+.2,.06),m,c(0xc8a050));const pm=new THREE.MeshBasicMaterial({map:TX.paint[k]});void pm;gb('cloth').add(new THREE.PlaneGeometry(w,h),m.clone().multiply(M4(0,0,.035)),c([0x9a7a5a,0x7a5a4a,0x6a7a5a,0x8a4a3a][k]));};
 painting(-13.8,4,-12,2.2,2.8,PI/2,0);painting(13.8,4,-12,2.2,2.8,-PI/2,1);painting(5.9,2.6,-26.5,1,1.3,-PI/2,2);painting(-3.5,2.8,-30.8,1.2,1.5,0,3);painting(3.5,2.8,-30.8,1.2,1.5,0,1);painting(29.8,2.4,-8,1.2,1.5,-PI/2,0);
 Cl.box(-6,0,-16,6,.012,-7,c(0x8a2a2a),{s:2});Gd.box(-6.1,0,-16.1,6.1,.008,-6.9,c(0xc8a050));
 for(let i=0;i<3;i++){const x=-12.6+i*1.1,z=-19.4+(i%2)*.5;chair(Gd,x,.3,z,PI*.5-.3+i*.3,c(0xc8a050));P.add(CY(.01,.01,1.1,4),M4(x+.5,.85,z),c(0x1a1a1a));P.add(BX(.36,.26,.02),M4(x+.5,1.4,z,-.4,PI/2,0),c(0x1a1a1a));}
 Pl.box(9.5,0,-14,13.6,.22,-13.4,c(0x8a5a3a));P.add(CY(.012,.012,1.4,5),M4(0,1.6,-10),c(0x1a1a1a));P.add(SP(.04,6,4),M4(0,2.3,-10.05),c(0x2a2a2a));
 // foyer: grand staircase dressing (to an upper landing), plants, console
 Mb.box(-2,0,-30.6,2,.15,-29.6,c(0xe8dcc8));
 for(const[x,z]of[[-5.4,-22.8],[5.4,-22.8],[-5.4,-30.4],[5.4,-30.4],[-13.3,-2.7],[13.3,-2.7],[-13.3,-21.3],[13.3,-21.3]]){P.add(CY(.26,.2,.5,10),M4(x,.25,z),c(0x8a5a3a));gb('leaf').add(SP(.45,8,6),M4(x,.95,z,0,0,0,1,1.4,1),c(0x3a6a2a),.4);}
 // staff room: lockers detail, chairs
 for(let x=-13.6;x<-9.6;x+=.6)P.box(x+.02,.1,-30.33,x+.56,1.95,-30.29,c(0x5a6a78));chair(P,-9.4,0,-23.8,PI,c(0x6a5a4a));chair(P,-9.4,0,-26.8,0,c(0x6a5a4a));
 // kitchen: stoves, hood, pans, sinks, shelves
 for(const x of[-26,-24,-22])Mt.box(x,.95,-13.9,x+1.6,1.0,-12.7,c(0x2a2a2a));Mt.box(-27,2.7,-14.4,-21,3.3,-12.2,c(0xb8c0c8));for(let i=0;i<6;i++)Mt.add(CY(.18,.15,.18,10),M4(-26.5+i*1.05,1.1,-13.3),c(0x9aa0a8));
 for(let i=0;i<7;i++)Mt.add(CY(.16,.16,.04,12),M4(-26.4+i*.9,2.45,-7.9,PI/2,0,0),c(0x6a6a6a));Mt.box(-27,2.6,-8.1,-21,2.64,-7.7,c(0x4a4a4a));
 for(const z of[-20,-17,-15])Mt.box(-29.6,.95,z,-29.1,1,z+.8,c(0x5a6066));Pl.box(-24.5,1.5,-21.9,-21.1,1.54,-21.6,c(0x8a6a4a));for(let i=0;i<10;i++)P.add(CY(.06,.06,.18,6),M4(-24.2+i*.33,1.64,-21.75),c([0xd8c8a0,0xc84a2a,0x6a8a3a][i%3]));
 // pantry shelves with jars + rat poison box glow handled as item
 for(const y of[.5,1.1,1.7])Pl.box(-24.5,y,-30.9,-17.5,y+.04,-30.25,c(0x7a5a3a));for(let i=0;i<30;i++)P.add(CY(.06,.06,.2,6),M4(-24.2+(i%15)*.45,.62+(i/15|0)*.6,-30.55),c([0xc8a060,0xd8d0b0,0x8a3a2a,0x5a7a3a][i%4]));
 // cellar: barrels on cradles, bottle racks, hanging bulbs drawn as lamps
 for(let i=0;i<5;i++)Pl.add(lath([[.38,0],[.46,.25],[.5,.5],[.46,.75],[.38,1],[0,1]],14),M4(-32,-2.65,-42.45+i*2,0,0,PI/2),c(0x7a4a2a));
 for(let x=-31;x<-17;x+=4.5)for(let row=0;row<4;row++)for(let i=0;i<10;i++)gb('gloss').add(CY(.035,.035,.3,6),M4(x+.2+i*.32,-2.95+row*.45,-44.2,PI/2,0,0),c([0x1a2a1a,0x3a0e0e,0x2a3a1a][(i+row)%3]));
 for(const x of[-24,-20])for(let row=0;row<4;row++)for(let i=0;i<10;i++)gb('gloss').add(CY(.035,.035,.3,6),M4(x+.2+i*.32,-2.95+row*.45,-34.05,PI/2,0,0),c([0x1a2a1a,0x3a0e0e,0x2a3a1a][(i+row)%3]));
 for(let i=0;i<4;i++){gb('gloss').add(CY(.03,.03,.3,6),M4(-24.5+i*.5,-2.2,-40.4),c(0x3a0e0e));P.add(CY(.03,.01,.12,6),M4(-24.4+i*.5,-2.28,-40),c(0xf0f0f0));}
 // library: piano lid + shelves both walls, sofa, globe
 Pn.box(12,1,-27,13.6,1.05,-25,c(0x111111));P.box(11.7,.7,-26.8,12,.75,-25.2,c(0xf0f0f0));Cl.box(7,.38,-24.4,10,.95,-24.1,c(0x5a2a2a));gb('books').box(6.25,0,-29,6.6,3.4,-23.6,c(0xffffff),{skip:'ny'});
 // security: chairs, keyboards, gun rack
 for(const x of[20.5,23.5,26.5]){chair(P,x,0,-27.6,PI,c(0x2a2a2a));Mt.box(x-.3,.8,-29.3,x+.3,.83,-29.05,c(0x1a1a1a));}gb('screens').box(18.2,1,-30.42,29.3,2.5,-30.4,c(0xffffff));
 // guard quarters: bunks detail, table
 Cl.box(18,.6,-21.6,21.5,.75,-20.6,c(0xe8e8f0));Cl.box(18,.6,-16.6,21.5,.75,-15.6,c(0xe8e8f0));P.box(24,0,-19,26,.75,-17.6,c(0x6a5a4a));
 // study: desk detail, globe, chesterfield, rug, decanter cabinet glasses
 Cl.box(19.5,0,-11.5,27,.012,-6,c(0x6a2a24),{s:2});Pn.box(22.8,.75,-10.4,26.4,.8,-8.6,c(0x4a2a16));gb('gold').add(SP(.3,14,10),M4(20,1.1,-12.8),c(0x7a8a6a));P.add(CY(.03,.05,.8,6),M4(20,.45,-12.8),c(0x3a2a1a));
 chair(gb('panel'),24.6,0,-11,0,c(0x3a1a10));Cl.box(19,.35,-5.3,22,.75,-4.5,c(0x5a1a14));
 // terrace: parasols handled per table; linen hamper
 Pl.box(-26.5,0,5.6,-25.5,.8,6.4,c(0xa08060));
 // shed: shelves, mower; boathouse: life rings, ropes; helipad: marking + helicopter
 Pl.box(-57.8,1.6,-23.9,-50.2,1.64,-23.5,c(0x7a5a3a));P.box(-53,0,-17.4,-51.8,.6,-16.6,c(0xb83a2a));
 for(const x of[36,46])P.add(new THREE.TorusGeometry(.32,.07,6,14),M4(x,-9.5,46.2),c(0xe86a2a));
 gb('cloth').add(new THREE.RingGeometry(5.2,5.8,40),M4(49,.14,-30,-PI/2,0,0),c(0xf0f0e8));for(const[w,h,x,z]of[[.6,4,-1.2,0],[.6,4,1.2,0],[1.8,.6,0,0]])gb('cloth').add(new THREE.PlaneGeometry(w,h),M4(49+x,.141,-30+z,-PI/2,0,0),c(0xf0f0e8));
 const hx=49,hz=-30,hy=.12;gb('gloss').add(SP(1.4,16,12),M4(hx,hy+1.6,hz+.4,0,0,0,1,.9,1.5),c(0x1a2a3a));gb('gloss').add(BX(.5,.5,4.5),M4(hx,hy+1.9,hz-3.2),c(0x1a2a3a));gb('gloss').add(BX(.1,1.2,.8),M4(hx,hy+2.5,hz-5.3),c(0x1a2a3a));
 gb('gloss').add(SP(1.02,14,10,0,PI*2,0,PI/2),M4(hx,hy+1.7,hz+1.35,-1.2,0,0,1,.8,1),c(0x101418));for(const s of[-1,1])P.box(hx+s*1.1-.05,hy,hz-1.4,hx+s*1.1+.05,hy+.08,hz+2.2,c(0x2a2a2a));P.add(CY(.08,.08,.5,6),M4(hx,hy+3.1,hz+.4),c(0x2a2a2a));
 for(let i=0;i<4;i++)P.add(BX(.25,.04,9.2),M4(hx,hy+3.35,hz+.4,0,i*PI/4,0),c(0x1a1a1a));
 // boathouse cradle boat (static) + quay bollards
 gb('gloss').add(SP(1,16,10),M4(41,-10.3,49.3,0,0,0,1.25,.55,3),c(0xf4f2ee));gb('panel').box(40,-10.05,47.6,42,-9.95,51,c(0xffffff));
 for(let x=32;x<62;x+=5)P.add(CY(.16,.2,.5,8),M4(x,-11.75,52.7),c(0x2a2a2a));
 // drive: valet stand + entrance planters; front court planters
 Pn.box(-6.5,0,-49.6,-5.5,1.2,-49,c(0xffffff));for(const x of[-12,12,22]){gb('terracotta').add(CY(.6,.45,.8,10),M4(x,.4,-33),c(0xb86a48),.5);gb('leaf').add(SP(.7,8,6),M4(x,1.2,-33,0,0,0,1,.8,1),c(0x8a5aa8),.4);}}
