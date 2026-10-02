// WILD QUEST — island environment: terrain, sea + lake, painterly sky, instanced grass/flowers/trees/rocks with wind, rain, day/night lighting.
import * as THREE from '../vendor/three.module.min.js';
import {HALF,N,CELL,H,GRASS,FOREST,PATH,POI,SEA,heightAt,gradAt,clearing,inLake,roadDist,forestDensity,addShade,makeHeightTexture,GLSL_HMAP,noise2,mulberry,ss,lerp} from './terrain.js';
const V=THREE.Vector3,C=(r,g,b)=>new THREE.Color().setRGB(r,g,b);
export const U={uTime:{value:0},uSunDir:{value:new V(0,1,0)},uSunCol:{value:new THREE.Color()},uAmbTop:{value:new THREE.Color()},uAmbBot:{value:new THREE.Color()},uFogCol:{value:new THREE.Color()},uFogD:{value:.003},
 uSkyTop:{value:new THREE.Color()},uHorizon:{value:new THREE.Color()},uWind:{value:new THREE.Vector2(.6,.3)},uRain:{value:0},uNight:{value:0},uBlood:{value:0},uMoonDir:{value:new V(0,-1,0)},uHMap:{value:null},uPlayer:{value:new V()}};
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const rng=mulberry(1234),rnd=(a=1)=>rng()*a;

/* ---------- textures ---------- */
export const detailTex=ctex(256,256,(x,w,h)=>{const id=x.createImageData(w,h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(j*w+i)*4;const n=(noise2(i/16,j/16)*.5+noise2(i/5,j/5)*.3+noise2(i/2,j/2)*.2)*.5+.5;const m=noise2(i/64*Math.PI,j/64*Math.PI)*.5+.5;
 id.data[k]=n*255;id.data[k+1]=m*255;id.data[k+2]=(noise2(i/9+40,j/9)*.5+.5)*255;id.data[k+3]=255;}x.putImageData(id,0,0);},{srgb:false});
export const stoneTex=ctex(256,256,(x,w,h)=>{x.fillStyle='#8a8478';x.fillRect(0,0,w,h);const rows=8;for(let r=0;r<rows;r++){const y=r*h/rows,off=(r%2)*32;for(let c=-1;c<5;c++){const bx=c*64+off;const v=120+Math.random()*40|0;x.fillStyle=`rgb(${v},${v-4},${v-14})`;x.fillRect(bx+2,y+2,60,h/rows-4);
  for(let k=0;k<40;k++){const s=Math.random()*30|0;x.fillStyle=`rgba(${s},${s},${s},.15)`;x.fillRect(bx+2+Math.random()*58,y+2+Math.random()*(h/rows-6),2+Math.random()*4,2);}}}
 x.fillStyle='rgba(40,36,30,.5)';for(let r=0;r<=rows;r++)x.fillRect(0,r*h/rows-1,w,3);});

/* stone material: world-space triplanar stone with vertex colours (moss/ember tints) */
export function stoneMat(o={}){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:o.rough??.88,metalness:0,emissive:o.emissive??0x000000});const nat=!!o.natural;
 m.onBeforeCompile=sh=>{sh.uniforms.uStone={value:stoneTex};sh.uniforms.uDetail={value:detailTex};sh.uniforms.uRain=U.uRain;sh.uniforms.uScale={value:o.scale??.25};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP2;varying vec3 vWN2;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 wp2=modelMatrix*vec4(transformed,1.);\n#ifdef USE_INSTANCING\nwp2=modelMatrix*instanceMatrix*vec4(transformed,1.);\n#endif\nvWP2=wp2.xyz;vWN2=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP2;varying vec3 vWN2;uniform sampler2D uStone,uDetail;uniform float uRain,uScale;')
  .replace('#include <map_fragment>',`vec3 an=abs(normalize(vWN2));an=pow(an,vec3(4.));an/=an.x+an.y+an.z;vec2 sc=vec2(uScale,uScale*1.6);
   ${nat?'vec3 st=vec3(texture2D(uDetail,vWP2.zy*.35).r*an.x+texture2D(uDetail,vWP2.xz*.35).r*an.y+texture2D(uDetail,vWP2.xy*.35).r*an.z)*1.25+.12;st*=.8+.4*texture2D(uDetail,vWP2.xz*.05+vWP2.y*.03).g;':'vec3 st=texture2D(uStone,vWP2.zy*sc).rgb*an.x+(.38+.42*texture2D(uDetail,vWP2.xz*.2).rrr)*an.y+texture2D(uStone,vWP2.xy*sc).rgb*an.z;'}
   diffuseColor.rgb*=st*1.5*(1.-uRain*.22);`).replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.4,uRain*.7);');};
 m.customProgramCacheKey=()=>'stone'+(o.scale??.25)+nat+(o.crag?'c':'');return m;}

/* ---------- geometry merge helper ---------- */
export function merge(list){const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3).fill(1);let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.color)col.set(g.attributes.color.array,o*3);else if(g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('color',new THREE.BufferAttribute(col,3));r.computeBoundingSphere();return r;}
export const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
export function blob(r,detail,amp,seed){const g=new THREE.IcosahedronGeometry(r,detail);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=1+noise2(x*1.3+seed,z*1.3+y*.7)*amp;p.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;}

/* ================= terrain ================= */
function terrainMesh(){const pos=new Float32Array(N*N*3),col=new Float32Array(N*N*3),idx=[];const c=new THREE.Color(),t=new THREE.Color();
 const grassA=C(.075,.18,.025),grassB=C(.17,.29,.04),forest=C(.06,.11,.025),dirt=C(.28,.19,.09),sand=C(.56,.47,.28),rock=C(.21,.2,.18),rock2=C(.32,.29,.25),snow=C(.85,.88,.92),bed=C(.12,.14,.07);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i,x=-HALF+i*CELL,z=-HALF+j*CELL,h=H[k];pos[k*3]=x;pos[k*3+1]=h;pos[k*3+2]=z;
  const g=gradAt(x,z),sl=Math.hypot(g.x,g.z),m=noise2(x*.02,z*.02)*.5+.5;
  c.copy(grassA).lerp(grassB,m*.8+noise2(x*.08,z*.08)*.15);c.lerp(forest,FOREST[k]*.75);
  c.lerp(dirt,PATH[k]*.9);
  c.lerp(sand,ss(3.2,1.2,h)*(inLake(x,z)?0:1));
  if(inLake(x,z))c.lerp(bed,ss(POI.lake.level+.8,POI.lake.level-.5,h));
  t.copy(rock).lerp(rock2,noise2(x*.05,z*.05)*.5+.5);c.lerp(t,ss(.75,1.15,sl));
  c.lerp(snow,ss(70,80,h+noise2(x*.06,z*.06)*5)*ss(1.5,.9,sl));
  if(clearing(x,z,-6)&&!inLake(x,z))c.lerp(dirt,.25);
  c.lerp(C(.09,.09,.08),ss(-1,-8,h));
  col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
 for(let j=0;j<N-1;j++)for(let i=0;i<N-1;i++){const a=j*N+i,b=a+1,cc=a+N,d=cc+1;idx.push(a,cc,b,b,cc,d);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.setIndex(idx);geo.computeVertexNormals();
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});
 mat.onBeforeCompile=sh=>{sh.uniforms.uDetail={value:detailTex};sh.uniforms.uRain=U.uRain;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP2;varying vec3 vWN2;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP2=(modelMatrix*vec4(transformed,1.)).xyz;vWN2=normalize(objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP2;varying vec3 vWN2;uniform sampler2D uDetail;uniform float uRain;')
  .replace('#include <map_fragment>',`vec3 an=abs(vWN2);an=pow(an,vec3(3.));an/=an.x+an.y+an.z;
   float dx=texture2D(uDetail,vWP2.zy*.21).r,dy=texture2D(uDetail,vWP2.xz*.23).r,dz=texture2D(uDetail,vWP2.xy*.21).r,d=dx*an.x+dy*an.y+dz*an.z;
   float d2=texture2D(uDetail,vWP2.xz*.043).b;float mac=texture2D(uDetail,vWP2.xz*.006).g;
   float strata=sin(vWP2.y*2.3+d*3.)*.5+.5;float steep=1.-an.y;
   diffuseColor.rgb*=(.66+.62*d)*(.8+.4*d2)*(.86+.28*mac)*mix(1.,.9+.16*strata,steep);diffuseColor.rgb*=1.-uRain*.28;`)
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.35,uRain*an.y*.8);');};
 const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;return m;}

/* ================= water ================= */
function waterMat(level){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{uHMap:U.uHMap,uTime:U.uTime,uLevel:{value:level},uSunDir:U.uSunDir,uSunCol:U.uSunCol,uSkyTop:U.uSkyTop,uHorizon:U.uHorizon,uFogCol:U.uFogCol,uFogD:U.uFogD,uRain:U.uRain,uAmbTop:U.uAmbTop,uNight:U.uNight},
 vertexShader:`uniform float uTime;varying vec3 vWP;void main(){vec4 w=modelMatrix*vec4(position,1.);w.y+=sin(w.x*.08+uTime*.9)*.08+cos(w.z*.07+uTime*.7)*.08;vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`${GLSL_HMAP}
 uniform float uTime,uLevel,uFogD,uRain,uNight;uniform vec3 uSunDir,uSunCol,uSkyTop,uHorizon,uFogCol,uAmbTop;varying vec3 vWP;
 vec2 wv(vec2 p,vec2 d,float f,float s){float ph=dot(p,d)*f+uTime*s;return d*cos(ph)*f;}
 float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 p=vWP.xz;vec2 g=wv(p,vec2(.8,.6),.35,1.2)*.25+wv(p,vec2(-.5,.86),.6,1.7)*.16+wv(p,vec2(.2,-.98),1.3,2.3)*.07+wv(p,vec2(-.9,-.3),2.7,3.1)*.035+wv(p,vec2(.6,-.8),5.1,4.)*.018;
  float rr=0.;if(uRain>0.){vec2 c=floor(p*1.5);vec2 f=fract(p*1.5)-.5;float t=fract(uTime*.9+h21(c));float r=length(f+vec2(h21(c+3.),h21(c+7.))*.4-.2);rr=sin((r-t*.6)*40.)*smoothstep(.3,0.,abs(r-t*.5))*(1.-t)*uRain;g+=vec2(rr)*.15;}
  vec3 n=normalize(vec3(-g.x,1.,-g.y));vec3 V=normalize(cameraPosition-vWP);float dist=length(cameraPosition-vWP);n=normalize(mix(n,vec3(0,1,0),smoothstep(60.,400.,dist)*.7));
  float depth=uLevel-hmap(p).r;
  float fr=.02+.98*pow(1.-max(dot(n,V),0.),5.);vec3 r=reflect(-V,n);
  vec3 sky=mix(uHorizon,uSkyTop,pow(max(r.y,0.),.6));
  float sp=pow(max(dot(r,uSunDir),0.),520.)*(1.-uRain*.8);
  vec3 sh=vec3(.03,.32,.30),dp=vec3(.006,.05,.09);vec3 body=mix(sh,dp,smoothstep(.5,9.,depth))*(uAmbTop*1.4+uSunCol*.6*max(uSunDir.y,0.));
  vec3 col=mix(body,sky,fr*.8)+uSunCol*sp*3.;
  float fn=sin(depth*7.-uTime*1.6+sin(p.x*.4)*1.5)*.5+.5;float foam=(1.-smoothstep(0.,.55,depth))+(1.-smoothstep(.2,1.5,depth))*smoothstep(.75,1.,fn)*.8;foam=clamp(foam,0.,1.);
  col=mix(col,vec3(.85,.9,.9)*(uAmbTop*2.+uSunCol*.7),foam*.85);
  float a=clamp(mix(.45,.96,smoothstep(0.,3.5,depth))+fr*.3+foam,0.,1.);a*=smoothstep(-.15,.08,depth);
  float f=1.-exp(-uFogD*uFogD*dist*dist);col=mix(col,uFogCol,f);
  gl_FragColor=vec4(col,a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});}

/* ================= sky ================= */
function skyMesh(){const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uTime:U.uTime,uSunDir:U.uSunDir,uMoonDir:U.uMoonDir,uSkyTop:U.uSkyTop,uHorizon:U.uHorizon,uSunCol:U.uSunCol,uNight:U.uNight,uRain:U.uRain,uBlood:U.uBlood,uFogCol:U.uFogCol},
 vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform float uTime,uNight,uRain,uBlood;uniform vec3 uSunDir,uMoonDir,uSkyTop,uHorizon,uSunCol,uFogCol;varying vec3 vD;
 float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+1.),f.x),f.y);}
 float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=vn(p)*a;p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
 void main(){vec3 d=normalize(vD);float y=d.y;
  vec3 col=mix(uHorizon,uSkyTop,pow(max(y,0.),.55));col=mix(col,uFogCol*.9,smoothstep(.02,-.12,y));
  float sd=max(dot(d,uSunDir),0.);col+=uSunCol*(pow(sd,6.)*.18+pow(sd,60.)*.35)*(1.-uRain*.7);
  col+=uSunCol*smoothstep(.9994,.9998,sd)*28.*(1.-uRain*.9)*step(-.05,uSunDir.y);
  // stars
  if(uNight>0.){vec3 sp=d*230.;vec3 ci=floor(sp);float h=hash(ci);float st=step(.985,h)*smoothstep(.5,.0,length(fract(sp)-.5))*(h-.985)*70.;col+=vec3(.8,.85,1.)*st*uNight*smoothstep(0.,.25,y)*(1.-uRain);
   col+=vec3(.05,.06,.12)*uNight*fbm(d.xz*3.+d.y)*smoothstep(0.,.6,y)*.6;}
  // moon (crimson as the deadline nears)
  float md=max(dot(d,uMoonDir),0.);float ms=.99965-uBlood*.0012;vec3 mc=mix(vec3(.9,.92,1.),vec3(1.4,.12,.06),uBlood);
  float disc=smoothstep(ms,ms+.00012,md);vec2 mp=vec2(dot(d,normalize(cross(uMoonDir,vec3(0,1,0)))),d.y-uMoonDir.y);col=mix(col,mc*(1.1+fbm(mp*400.)*.4)*(1.+uBlood*2.),disc*(1.-uRain*.8));
  col+=mc*pow(md,90.-uBlood*60.)*(.25+uBlood*1.4)*(1.-uRain*.6);
  // painterly clouds
  if(y>-.02){vec2 uv=d.xz/(y+.18)*1.15+vec2(uTime*.006,uTime*.002);float cov=mix(.6,.15,uRain);float n=fbm(uv*1.3);float n2=fbm(uv*3.1+n);
   float c=smoothstep(cov,cov+.32,n*.75+n2*.35);float lit=clamp(.55+dot(normalize(vec3(uSunDir.x,.2,uSunDir.z)),normalize(vec3(d.x,0.,d.z)))*.25+(n2-.5)*.6,0.,1.);
   vec3 cc=mix(uHorizon*.65+uSkyTop*.2,mix(uHorizon,vec3(1.),.6)*1.05+uSunCol*.25,lit);cc=mix(cc,vec3(.25,.27,.3)*(uSkyTop+uHorizon),uRain*.7);
   col=mix(col,cc,c*smoothstep(-.02,.12,y)*.92);}
  col=mix(col,col*vec3(1.25,.45,.4),uBlood*.55);
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});const s=new THREE.Mesh(new THREE.SphereGeometry(1800,48,24),m);s.frustumCulled=false;s.renderOrder=-10;return s;}

/* ================= grass + flowers ================= */
function grassGeo(max){const pos=[],nor=[],uv=[],idx=[];const SEG=3;
 for(let b=0;b<3;b++){const a=b*2.094+.3,ca=Math.cos(a),sa=Math.sin(a),ox=Math.cos(a+1.3)*.09,oz=Math.sin(a+1.3)*.09,base=pos.length/3;
  for(let s=0;s<=SEG;s++){const t=s/SEG,w=.055*(1-t*.92),lean=t*t*.22;for(const side of[-1,1]){pos.push(ox+ca*w*side+sa*lean,t,oz+sa*w*side*-1*-1-ca*lean);nor.push(sa,0,-ca);uv.push(side*.5+.5,t);}}
  for(let s=0;s<SEG;s++){const k=base+s*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
 const off=new Float32Array(max*2),rn=new Float32Array(max*4);for(let i=0;i<max;i++){off[i*2]=Math.random()*1e4;off[i*2+1]=Math.random()*1e4;for(let k=0;k<4;k++)rn[i*4+k]=Math.random();}
 g.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,2));g.setAttribute('aRnd',new THREE.InstancedBufferAttribute(rn,4));g.instanceCount=max;g.boundingSphere=new THREE.Sphere(new V(),1e5);return g;}
function flowerGeo(max){const pos=[],nor=[],uv=[],idx=[];
 // stem
 const st=[[-.012,0],[.012,0],[-.008,1],[.008,1]];for(const[x,y]of st){pos.push(x,y*.85,0);nor.push(0,0,1);uv.push(0,y*.6);}idx.push(0,1,2,1,3,2);
 // 5-petal head as a little disc fan
 const c0=pos.length/3;pos.push(0,.86,0);nor.push(0,1,0);uv.push(.5,1);for(let i=0;i<=10;i++){const a=i/10*6.283,r=i%2?.05:.1;pos.push(Math.cos(a)*r,.86+(i%2?.01:-.01),Math.sin(a)*r);nor.push(0,1,0);uv.push(1,1);}for(let i=0;i<10;i++)idx.push(c0,c0+i+2,c0+i+1);
 const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
 const off=new Float32Array(max*2),rn=new Float32Array(max*4);for(let i=0;i<max;i++){off[i*2]=Math.random()*1e4;off[i*2+1]=Math.random()*1e4;for(let k=0;k<4;k++)rn[i*4+k]=Math.random();}
 g.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,2));g.setAttribute('aRnd',new THREE.InstancedBufferAttribute(rn,4));g.instanceCount=max;g.boundingSphere=new THREE.Sphere(new V(),1e5);return g;}
function fieldMat(kind,tile){return new THREE.ShaderMaterial({side:THREE.DoubleSide,fog:false,uniforms:{uHMap:U.uHMap,uTime:U.uTime,uTile:{value:tile},uCenter:{value:new THREE.Vector2()},uPlayer:U.uPlayer,uWind:U.uWind,uSunDir:U.uSunDir,uSunCol:U.uSunCol,uAmbTop:U.uAmbTop,uAmbBot:U.uAmbBot,uFogCol:U.uFogCol,uFogD:U.uFogD,uRain:U.uRain,uScale:{value:1}},
 vertexShader:`${GLSL_HMAP}
 uniform float uTime,uTile,uScale;uniform vec2 uCenter,uWind;uniform vec3 uPlayer;attribute vec2 aOff;attribute vec4 aRnd;
 varying vec3 vCol,vWP,vNrm;varying float vH,vShade;
 void main(){vec2 w=uCenter+mod(aOff-uCenter+uTile*.5,uTile)-uTile*.5;vec4 hm=hmap(w);float d=distance(w,cameraPosition.xz);
  float fade=1.-smoothstep(uTile*.28,uTile*.47,d);
  ${kind==='grass'?'float dens=hm.g;float hgt=(.28+aRnd.y*.5)*(.55+.45*dens)*step(aRnd.x,dens*1.1);':'float dens=hm.b;float hgt=(.45+aRnd.y*.35)*step(aRnd.x,dens*.9);'}
  hgt*=fade*uScale*smoothstep(.5,2.2,distance(vec3(w.x,hm.r,w.y),cameraPosition));float ang=aRnd.z*6.2832,cs=cos(ang),sn=sin(ang);vec3 p=position;p.xz=vec2(cs*p.x-sn*p.z,sn*p.x+cs*p.z);vec3 nn=vec3(cs*normal.x-sn*normal.z,normal.y,sn*normal.x+cs*normal.z);
  float t=uv.y;p*=hgt;${kind==='grass'?'p.xz*=1.+aRnd.w*.6;':''}
  float g1=sin(dot(w,vec2(.11,.07))-uTime*1.6+sin(w.x*.05+uTime*.25)*2.);float g2=sin(dot(w,vec2(-.31,.23))+uTime*3.3+aRnd.z*6.);
  vec2 sway=uWind*(.5+.5*g1)+vec2(g2,-g2)*.14*(.4+length(uWind));
  vec2 dp=w-uPlayer.xz;float pd=length(dp);float tr=(1.-smoothstep(.15,1.2,pd))*step(abs(uPlayer.y-hm.r),2.5);sway+=dp/max(pd,.001)*tr*1.8;
  float bend=t*t;p.xz+=sway*bend*hgt*.9;p.y-=dot(sway,sway)*bend*hgt*.16;
  vec3 wp=vec3(w.x,hm.r-.04,w.y)+p;vWP=wp;vH=t;vNrm=normalize(mix(vec3(0,1,0),nn,.3));vShade=hm.a;
  float mac=sin(w.x*.031+sin(w.y*.023)*2.)*.5+.5;
  ${kind==='grass'?`vec3 base=mix(vec3(.05,.13,.015),vec3(.10,.2,.02),mac);vec3 tip=mix(vec3(.2,.42,.05),vec3(.42,.52,.1),aRnd.w*mac);vCol=mix(base,tip,t*t*.6+t*.4)*(.8+.35*aRnd.y);`
  :`vec3 pc=aRnd.w<.33?vec3(1.,.85,.25):aRnd.w<.66?vec3(.95,.95,1.):vec3(.55,.3,1.);if(aRnd.y>.85)pc=vec3(1.,.25,.12);vCol=uv.x>.5?pc:vec3(.08,.2,.03);`}
  gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
 fragmentShader:`uniform vec3 uSunDir,uSunCol,uAmbTop,uAmbBot,uFogCol;uniform float uFogD,uRain;varying vec3 vCol,vWP,vNrm;varying float vH,vShade;
 void main(){vec3 n=normalize(vNrm);float dif=max(dot(n,uSunDir),0.)*.5+.5*max(uSunDir.y,0.);vec3 V=normalize(cameraPosition-vWP);
  float trans=pow(max(dot(-V,uSunDir),0.),5.)*vH*1.4;float sh=mix(.3,1.,vShade);vec3 amb=mix(uAmbBot,uAmbTop,.35+.65*vH);
  vec3 col=vCol*(amb*(.5+.5*vH)+uSunCol*dif*sh+uSunCol*trans*sh*vec3(.9,1.,.45));col*=1.-uRain*.2;
  float fd=length(vWP-cameraPosition);col=mix(col,uFogCol,1.-exp(-uFogD*uFogD*fd*fd));gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});}

/* ================= trees & rocks ================= */
function windify(m,amt){m.onBeforeCompile=sh=>{sh.uniforms.uTime=U.uTime;sh.uniforms.uWind=U.uWind;
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;uniform vec2 uWind;').replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 vec3 ip=instanceMatrix[3].xyz;
 #else
 vec3 ip=vec3(0.);
 #endif
 float hh=max(0.,transformed.y-1.2);float sw=(sin(uTime*1.3+ip.x*.21+ip.z*.17)*.6+sin(uTime*2.1+ip.x*.5)*.3)*(.4+length(uWind));
 transformed.xz+=(uWind*.6+vec2(sw,sw*.6))*hh*${amt.toFixed(3)};transformed+=sin(uTime*5.+position*3.1)*.025*step(1.5,transformed.y);`);};m.customProgramCacheKey=()=>'wind'+amt;return m;}
function vcolGeo(g,f){const p=g.attributes.position,n=g.attributes.normal,c=new Float32Array(p.count*3);const col=new THREE.Color();for(let i=0;i<p.count;i++){f(col,p.getX(i),p.getY(i),p.getZ(i),n.getY(i));c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b;}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;}
function canopyGeo(){const L=[];const r=mulberry(9);for(let i=0;i<6;i++){const a=r()*6.28,d=i?.9+r()*.9:0,s=i?1.1+r()*.6:1.7;L.push([blob(1,1,.22,i*3.1),M4(Math.cos(a)*d,4.4+(i?r()*1.6-.5:0.4),Math.sin(a)*d,0,0,0,s)]);}
 return vcolGeo(merge(L),(c,x,y,z,ny)=>{const t=ss(3,6.6,y);c.setRGB(.035+t*.09,.09+t*.16,.02+t*.02).multiplyScalar(.7+.45*(ny*.5+.5));});}
function trunkGeo(){const L=[[new THREE.CylinderGeometry(.2,.36,4.2,7),M4(0,2.1,0)],[new THREE.CylinderGeometry(.06,.13,1.8,5),M4(.5,3.2,0,0,0,-.8)],[new THREE.CylinderGeometry(.06,.12,1.6,5),M4(-.35,3.5,.3,.6,0,.7)]];
 return vcolGeo(merge(L),(c,x,y)=>c.setRGB(.09,.055,.03).multiplyScalar(.8+.4*ss(0,3,y)));}
function pineGeo(){const L=[[new THREE.CylinderGeometry(.12,.25,2.2,6),M4(0,1.1,0),C(.08,.05,.03)]];for(let i=0;i<4;i++){const s=1-i*.2;L.push([new THREE.ConeGeometry(2.2*s,3*s,8),M4(0,2.6+i*1.55,0,0,i*.7,0),C(.02,.07+i*.012,.04)]);}
 return vcolGeo(merge(L),(c,x,y,z,ny)=>{if(y<2)c.setRGB(.08,.05,.03);else c.setRGB(.02,.065+ny*.03,.035).multiplyScalar(.75+.5*ss(2,8,y));});}
function rockGeo(seed){return vcolGeo(blob(1,1,.35,seed),(c,x,y,z,ny)=>{c.setRGB(.22,.21,.19).lerp(C(.09,.16,.03),ss(.45,.85,ny)*.8);});}

export class World{
 constructor(scene,phys){this.scene=scene;this.phys=phys;this.trees=[];this.rocks=[];this.apples=[];
  /* placement first (trees shade the grass) */
  const P=[],Pi=[],R=[];for(let x=-HALF+4;x<HALF-4;x+=5.2)for(let z=-HALF+4;z<HALF-4;z+=5.2){const px=x+rnd(4.2),pz=z+rnd(4.2),h=heightAt(px,pz);if(h<2.4)continue;const g=gradAt(px,pz),sl=Math.hypot(g.x,g.z);
   if(clearing(px,pz,3)||roadDist(px,pz)<4.5||inLake(px,pz))continue;const fd=forestDensity(px,pz);
   if(sl<.85&&rng()<fd*.55+.012){const pine=h>34||rng()<.18;(pine?Pi:P).push([px,h,pz,.8+rng()*.55,rng()*6.28]);}
   else if(rng()<.025+ss(.7,1.2,sl)*.06)R.push([px,h,pz,.5+rng()*1.8,rng()*6.28]);}
  // the great tree of Whisperwood
  P.push([-128,heightAt(-128,70),70,2.6,0]);
  for(const t of P)addShade(t[0],t[2],5*t[3],.45);for(const t of Pi)addShade(t[0],t[2],3.5*t[3],.4);
  U.uHMap.value=this.hmap=makeHeightTexture();
  scene.add(this.terrain=terrainMesh());
  this.sky=skyMesh();scene.add(this.sky);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(4000,4000).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x061820}));floor.position.y=-24.5;scene.add(floor);
  this.sea=new THREE.Mesh(new THREE.PlaneGeometry(3400,3400,1,1).rotateX(-Math.PI/2),waterMat(SEA));this.sea.renderOrder=2;scene.add(this.sea);
  this.lake=new THREE.Mesh(new THREE.CircleGeometry(POI.lake.r+14,64).rotateX(-Math.PI/2),waterMat(POI.lake.level));this.lake.position.set(POI.lake.x,POI.lake.level,POI.lake.z);this.lake.renderOrder=2;scene.add(this.lake);
  // grass + flowers
  this.grassMax=72000;this.grass=new THREE.Mesh(grassGeo(this.grassMax),fieldMat('grass',64));this.grass.frustumCulled=false;scene.add(this.grass);
  this.flowerMax=9000;this.flowers=new THREE.Mesh(flowerGeo(this.flowerMax),fieldMat('flower',56));this.flowers.frustumCulled=false;scene.add(this.flowers);
  // trees
  const inst=(geo,mat,list,shadow,sc=1)=>{const m=new THREE.InstancedMesh(geo,mat,list.length);const q=new THREE.Quaternion(),e=new THREE.Euler();list.forEach((t,i)=>{m.setMatrixAt(i,new THREE.Matrix4().compose(new V(t[0],t[1]-.15,t[2]),q.setFromEuler(e.set(0,t[4],0)),new V(t[3]*sc,t[3]*sc,t[3]*sc)));});m.castShadow=shadow;m.receiveShadow=true;m.computeBoundingSphere();scene.add(m);return m;};
  const leafM=windify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85}),.05),barkM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}),pineM=windify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9}),.03);
  this.canopy=inst(canopyGeo(),leafM,P,true);inst(trunkGeo(),barkM,P,true);this.pines=inst(pineGeo(),pineM,Pi,true);
  const tint=new THREE.Color();P.forEach((t,i)=>{const r=rng();tint.setRGB(1,1,1);if(r<.07)tint.setRGB(2.4,1.5,.35);else if(r<.14)tint.setRGB(1.5,1.35,.55);else tint.setRGB(.85+rng()*.3,.9+rng()*.25,.8+rng()*.2);this.canopy.setColorAt(i,tint);});this.canopy.instanceColor.needsUpdate=true;
  for(const t of P){phys.cyl(t[0],t[2],.38*t[3],t[1]-1,t[1]+3.6*t[3],{climb:true,tag:'tree'});this.trees.push(t);}
  for(const t of Pi){phys.cyl(t[0],t[2],.3*t[3],t[1]-1,t[1]+2*t[3],{tag:'tree'});this.trees.push(t);}
  // apples under some broadleaf trees
  P.forEach(t=>{if(rng()<.35){const a=rng()*6.28,d=1.5+rng()*2;this.apples.push({x:t[0]+Math.cos(a)*d,z:t[2]+Math.sin(a)*d});}});
  // rocks
  const rkGeo=rockGeo(3);const rm=new THREE.InstancedMesh(rkGeo,stoneMat({rough:.9,scale:.35}),R.length);R.forEach((r,i)=>{rm.setMatrixAt(i,M4(r[0],r[1]+r[3]*.25,r[2],0,r[4],0,r[3]*1.2,r[3]*.85,r[3]));phys.cyl(r[0],r[2],r[3]*.95,r[1]-2,r[1]+r[3]*1.05,{tag:'rock',climb:true});this.rocks.push(r);});rm.castShadow=rm.receiveShadow=true;rm.computeBoundingSphere();scene.add(rm);
  // bushes (no collision)
  const B=[];for(let i=0;i<900;i++){const x=(rng()*2-1)*HALF*.85,z=(rng()*2-1)*HALF*.85,h=heightAt(x,z);if(h<2.5||h>60||clearing(x,z,1)||roadDist(x,z)<3||inLake(x,z))continue;const g=gradAt(x,z);if(Math.hypot(g.x,g.z)>.8)continue;if(rng()>forestDensity(x,z)*.8+.15)continue;B.push([x,h,z,.35+rng()*.4,rng()*6]);}
  const bushG=vcolGeo(merge([[blob(1,1,.3,2),M4(0,.5,0,0,0,0,1.2,.8,1.2)],[blob(.8,1,.3,5),M4(.7,.4,.3)],[blob(.7,1,.3,8),M4(-.6,.35,-.2)]]),(c,x,y,z,ny)=>c.setRGB(.04,.1+ny*.04,.02).multiplyScalar(.7+.6*ss(0,1.2,y)));
  const bm=new THREE.InstancedMesh(bushG,windify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85}),.0),B.length);B.forEach((b,i)=>bm.setMatrixAt(i,M4(b[0],b[1]-.1,b[2],0,b[4],0,b[3]*1.6)));bm.receiveShadow=true;bm.castShadow=true;bm.computeBoundingSphere();scene.add(bm);
  // light shafts in Whisperwood
  this.shafts=new THREE.Group();const shaftM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uA:{value:1},uTime:U.uTime},
   vertexShader:'varying vec2 vUv;varying float vD;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vD=-mv.z;gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform float uA,uTime;varying vec2 vUv;varying float vD;void main(){float e=smoothstep(0.,.35,vUv.x)*smoothstep(1.,.65,vUv.x);float v=smoothstep(0.,.25,vUv.y)*smoothstep(1.,.5,vUv.y);float s=.75+.25*sin(vUv.x*12.+uTime*.6);gl_FragColor=vec4(vec3(1.,.9,.6)*e*v*s*uA*.10*smoothstep(4.,18.,vD),1.);}'});
  this.shaftM=shaftM;const sg=new THREE.PlaneGeometry(2.2,16);sg.translate(0,8,0);for(let i=0;i<34;i++){const a=rng()*6.28,d=rng()*75,x=-150+Math.cos(a)*d,z=48+Math.sin(a)*d,h=heightAt(x,z);if(h<3)continue;for(let k=0;k<2;k++){const m=new THREE.Mesh(sg,shaftM);m.position.set(x,h-1,z);m.rotation.set(0,k*1.57+rng(),.32);this.shafts.add(m);}}scene.add(this.shafts);
  // rain streaks
  const rg=new THREE.InstancedBufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute([-.012,0,0,.012,0,0,-.012,.75,0,.012,.75,0],3));rg.setIndex([0,1,2,1,3,2]);const RN=5000,ro=new Float32Array(RN*3);for(let i=0;i<RN*3;i++)ro[i]=Math.random()*40;rg.setAttribute('aOff',new THREE.InstancedBufferAttribute(ro,3));rg.instanceCount=RN;
  this.rain=new THREE.Mesh(rg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:U.uTime,uRain:U.uRain,uCam:{value:new V()}},
   vertexShader:'attribute vec3 aOff;uniform float uTime,uRain;uniform vec3 uCam;varying float vA;void main(){vec3 o=aOff;o.y-=uTime*22.;vec3 w=uCam+mod(o-uCam+20.,40.)-20.;vec3 r=normalize(vec3(cameraPosition.x-w.x,0.,cameraPosition.z-w.z));vec3 s=vec3(r.z,0.,-r.x);vec3 p=w+s*position.x+vec3(.12,1.,.05)*position.y;vA=uRain*step(fract(aOff.x*7.13),uRain);gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',
   fragmentShader:'varying float vA;void main(){gl_FragColor=vec4(vec3(.5,.55,.62)*vA*.55,1.);}'}));this.rain.frustumCulled=false;this.rain.visible=false;scene.add(this.rain);
  this.setQuality(2);}
 setQuality(q){this.q=q;const g=[20000,42000,72000][q],f=[2500,5500,8000][q];this.grass.geometry.instanceCount=g;this.flowers.geometry.instanceCount=f;this.grass.material.uniforms.uTile.value=[46,58,66][q];this.flowers.material.uniforms.uTile.value=[40,50,56][q];this.grass.material.uniforms.uScale.value=[1.15,1.05,1][q];}
 update(dt,cam,inside){const fw=new V();cam.getWorldDirection(fw);fw.y=0;fw.normalize();
  for(const m of[this.grass,this.flowers]){const t=m.material.uniforms.uTile.value;m.material.uniforms.uCenter.value.set(cam.position.x+fw.x*t*.28,cam.position.z+fw.z*t*.28);}
  this.sky.position.copy(cam.position);this.rain.material.uniforms.uCam.value.copy(cam.position);this.rain.visible=U.uRain.value>.02&&!inside;
  const day=Math.max(0,U.uSunDir.value.y)*(1-U.uNight.value);this.shaftM.uniforms.uA.value=ss(.05,.4,day)*(1-U.uRain.value);
  for(const o of[this.grass,this.flowers,this.sky,this.sea,this.lake,this.shafts,this.terrain])o.visible=!inside;}
}

/* ================= day / night keyframes ================= */
// tod: 0 midnight, .25 sunrise, .5 noon, .75 sunset
const KF=[[0,{top:[.004,.008,.03],hor:[.02,.03,.07],sun:[.35,.45,.8],si:.35,amb:[.05,.07,.14],gnd:[.02,.02,.03],fog:[.02,.03,.06]}],
 [.21,{top:[.01,.02,.06],hor:[.06,.05,.1],sun:[.4,.45,.75],si:.25,amb:[.06,.07,.13],gnd:[.02,.02,.03],fog:[.05,.05,.09]}],
 [.26,{top:[.08,.16,.38],hor:[.95,.48,.22],sun:[1.,.55,.28],si:1.6,amb:[.25,.24,.3],gnd:[.1,.07,.05],fog:[.6,.4,.3]}],
 [.34,{top:[.03,.13,.52],hor:[.34,.5,.76],sun:[1.,.86,.66],si:2.9,amb:[.36,.44,.62],gnd:[.16,.14,.08],fog:[.42,.55,.74]}],
 [.5,{top:[.025,.12,.55],hor:[.32,.52,.8],sun:[1.,.95,.86],si:3.2,amb:[.4,.48,.66],gnd:[.17,.16,.09],fog:[.44,.6,.8]}],
 [.66,{top:[.03,.12,.46],hor:[.45,.52,.7],sun:[1.,.86,.64],si:2.8,amb:[.38,.43,.56],gnd:[.16,.13,.08],fog:[.5,.56,.7]}],
 [.74,{top:[.1,.12,.32],hor:[1.,.42,.16],sun:[1.,.5,.22],si:1.6,amb:[.26,.22,.28],gnd:[.1,.06,.04],fog:[.62,.36,.26]}],
 [.79,{top:[.01,.02,.07],hor:[.1,.06,.12],sun:[.4,.45,.75],si:.25,amb:[.06,.07,.13],gnd:[.02,.02,.03],fog:[.06,.05,.1]}],
 [1,{top:[.004,.008,.03],hor:[.02,.03,.07],sun:[.35,.45,.8],si:.35,amb:[.05,.07,.14],gnd:[.02,.02,.03],fog:[.02,.03,.06]}]];
const tmp={};function mixKF(t){let i=0;while(i<KF.length-2&&t>KF[i+1][0])i++;const[a,A]=KF[i],[b,B]=KF[i+1],f=ss(0,1,(t-a)/(b-a));for(const k in A)tmp[k]=Array.isArray(A[k])?A[k].map((v,j)=>lerp(v,B[k][j],f)):lerp(A[k],B[k],f);return tmp;}
export function lighting(tod,rain,blood,sun,hemi,fog){const k=mixKF(((tod%1)+1)%1);const a=(tod-.25)*Math.PI*2;
 const sd=new V(Math.cos(a)*.85,Math.sin(a),.42).normalize();U.uSunDir.value.copy(sd);U.uMoonDir.value.set(-sd.x*.8,Math.max(.18,-sd.y)*1+.08,-.55).normalize();
 const night=ss(.05,-.12,sd.y);U.uNight.value=night;const dark=1-rain*.55;
 const lightDir=night>.5?U.uMoonDir.value:sd;sun.position.copy(lightDir).multiplyScalar(160);
 const fade=night>.5?ss(.5,1,night):ss(.5,0,night)*ss(-.06,.06,sd.y);sun.intensity=k.si*fade*(1-rain*.65)*(1-blood*.2);sun.color.setRGB(...k.sun);if(blood>0)sun.color.lerp(new THREE.Color(1,.3,.25),blood*.6);
 hemi.color.setRGB(k.amb[0]*dark,k.amb[1]*dark,k.amb[2]*dark);hemi.groundColor.setRGB(...k.gnd);hemi.intensity=2.2;
 const grey=(c,amt)=>{const l=(c[0]+c[1]+c[2])/3;return c.map(v=>lerp(v,l*.75,amt));};
 const top=grey(k.top,rain*.75),hor=grey(k.hor,rain*.7),fc=grey(k.fog,rain*.7);
 U.uSkyTop.value.setRGB(...top);U.uHorizon.value.setRGB(...hor);fog.color.setRGB(...fc);
 if(blood>0){U.uSkyTop.value.lerp(new THREE.Color(.2,.01,.01),blood*.55);U.uHorizon.value.lerp(new THREE.Color(.6,.06,.03),blood*.6);fog.color.lerp(new THREE.Color(.35,.04,.03),blood*.55);}
 U.uFogCol.value.copy(fog.color);U.uFogD.value=fog.density=.0031+rain*.0045+blood*.002;
 U.uSunCol.value.copy(sun.color).multiplyScalar(sun.intensity/Math.PI);U.uAmbTop.value.copy(hemi.color).multiplyScalar(hemi.intensity/Math.PI);U.uAmbBot.value.copy(hemi.groundColor).multiplyScalar(hemi.intensity/Math.PI);
 return{night,sunUp:sd.y};}
