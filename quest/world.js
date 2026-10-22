// WILD QUEST — island environment: terrain, sea + lake, painterly sky, instanced grass/flowers/trees/rocks with wind, rain, day/night lighting.
import * as THREE from '../vendor/three.module.min.js';
import {HALF,N,CELL,H,GRASS,FOREST,PATH,RIVER,RIVERS,POOLS,POI,SEA,heightAt,gradAt,clearing,inLake,inRiver,roadDist,forestDensity,addShade,makeHeightTexture,GLSL_HMAP,noise2,mulberry,ss,lerp} from './terrain.js';
import {broadleaf,conifer,bush,outcrop,Scatter,mergeAll} from './trees.js';
import {terrainSet,leafAtlas,pineAtlas,barkTex as barkSet,waterStreak} from './tex.js';
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

/* foliage card atlas: top-left block is solid (volume uvs), the rest is a leaf cluster with alpha */
export const leafTex=ctex(256,256,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='#a8ae98';x.fillRect(0,0,26,26);const r=mulberry(77);
 for(let i=0;i<120;i++){const a=r()*6.283,d=Math.sqrt(r())*96,cx=140+Math.cos(a)*d,cy=140+Math.sin(a)*d,ang=a+(r()-.5)*1.4,L=13+r()*11,W=L*(.36+r()*.14),l=58+r()*40|0;
  x.save();x.translate(cx,cy);x.rotate(ang);x.fillStyle=`hsl(${78+r()*30|0},${28+r()*22|0}%,${l}%)`;x.beginPath();x.moveTo(-L,0);x.quadraticCurveTo(0,-W,L,0);x.quadraticCurveTo(0,W,-L,0);x.fill();
  x.strokeStyle=`rgba(40,50,20,.35)`;x.lineWidth=1;x.beginPath();x.moveTo(-L*.9,0);x.lineTo(L*.85,0);x.stroke();x.restore();}
 x.strokeStyle='rgba(60,45,30,.8)';x.lineWidth=2;for(let i=0;i<5;i++){const a=i*1.26+.3;x.beginPath();x.moveTo(140,140);x.lineTo(140+Math.cos(a)*70,140+Math.sin(a)*70);x.stroke();}});
leafTex.colorSpace=THREE.SRGBColorSpace;
/* bark: vertical fissures, ridges and lichen flecks (also used as the bump map) */
export const barkTex=ctex(128,256,(x,w,h)=>{const id=x.createImageData(w,h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(j*w+i)*4;const u=i/w*6.283;
 const rid=Math.abs(Math.sin(u*5+noise2(i/18,j/60)*2.4+Math.sin(j/37)*.6));const n=noise2(i/6,j/24)*.5+.5,f=noise2(i/3,j/3)*.5+.5;let v=(.35+.55*Math.pow(rid,.6))*(.75+.35*n)*(.88+.2*f);const li=noise2(i/14+9,j/14)>.55?1:0;
 id.data[k]=Math.min(255,v*235+li*40);id.data[k+1]=Math.min(255,v*215+li*70);id.data[k+2]=Math.min(255,v*190+li*20);id.data[k+3]=255;}x.putImageData(id,0,0);});
barkTex.repeat.set(2,2.5);
/* ground bump: pebbles, clods and fine grain for the terrain normal */
export const groundTex=ctex(256,256,(x,w,h)=>{const id=x.createImageData(w,h),T=(i,j,f)=>{let v=0,ww=0;for(const[a,b]of[[0,0],[w,0],[0,h],[w,h]]){const k=(1-Math.abs(a?i-w:i)/w)*(1-Math.abs(b?j-h:j)/h);v+=noise2((i-a)/f,(j-b)/f)*k;ww+=k;}return v/ww;};
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=(j*w+i)*4;const n=(T(i,j,22)*.45+T(i,j,7)*.35+T(i,j,2.5)*.2)*.5+.5;id.data[k]=id.data[k+1]=id.data[k+2]=n*170;id.data[k+3]=255;}x.putImageData(id,0,0);
 const r=mulberry(31);for(let i=0;i<340;i++){const px=r()*w,py=r()*h,rr=1.2+r()*3.6;for(const[dx,dy]of[[0,0],[w,0],[-w,0],[0,h],[0,-h]]){const g=x.createRadialGradient(px+dx-rr*.3,py+dy-rr*.3,0,px+dx,py+dy,rr);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(.7,'rgba(190,190,190,.5)');g.addColorStop(1,'rgba(40,40,40,0)');x.fillStyle=g;x.beginPath();x.arc(px+dx,py+dy,rr,0,6.283);x.fill();}}},{srgb:false});

/* stone material: world-space triplanar stone with vertex colours (moss/ember tints) */
export const GLSL_BUMP=`vec3 bumpN(vec3 n,vec3 vp,float h,float k){vec3 sx=dFdx(vp),sy=dFdy(vp);vec3 r1=cross(sy,n),r2=cross(n,sx);float det=dot(sx,r1);vec3 g=sign(det)*(dFdx(h)*r1+dFdy(h)*r2);return normalize(abs(det)*n-g*k);}`;
export function stoneMat(o={}){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:o.rough??.88,metalness:0,emissive:o.emissive??0x000000});const nat=!!o.natural,moss=o.moss??(nat?1:.7);
 m.onBeforeCompile=sh=>{sh.uniforms.uStone={value:stoneTex};sh.uniforms.uDetail={value:detailTex};sh.uniforms.uRain=U.uRain;sh.uniforms.uScale={value:o.scale??.25};sh.uniforms.uRockT={value:terrainSet().rock};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP2;varying vec3 vWN2;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 wp2=modelMatrix*vec4(transformed,1.);\n#ifdef USE_INSTANCING\nwp2=modelMatrix*instanceMatrix*vec4(transformed,1.);\n#endif\nvWP2=wp2.xyz;\n#ifdef USE_INSTANCING\nvWN2=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*objectNormal);\n#else\nvWN2=normalize(mat3(modelMatrix)*objectNormal);\n#endif');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP2;varying vec3 vWN2;uniform sampler2D uStone,uDetail,uRockT;uniform float uRain,uScale;\n'+GLSL_BUMP)
  .replace('#include <map_fragment>',`vec3 wn0=normalize(vWN2);vec3 an=abs(wn0);an=pow(an,vec3(4.));an/=an.x+an.y+an.z;vec2 sc=vec2(uScale,uScale*1.6);
   ${nat?'vec3 st=texture2D(uRockT,vWP2.zy*.11).rgb*an.x+texture2D(uRockT,vWP2.xz*.11).rgb*an.y+texture2D(uRockT,vWP2.xy*.11).rgb*an.z;st=st*4.6*(.8+.4*texture2D(uDetail,vWP2.xz*.05+vWP2.y*.03).g);':'vec3 st=texture2D(uStone,vWP2.zy*sc).rgb*an.x+(.38+.42*texture2D(uDetail,vWP2.xz*.2).rrr)*an.y+texture2D(uStone,vWP2.xy*sc).rgb*an.z;st*=1.5;'}
   float hgt=dot(st,vec3(.33));diffuseColor.rgb*=st*(1.-uRain*.22);`)
  .replace('#include <color_fragment>',`#include <color_fragment>
   float mn=texture2D(uDetail,vWP2.xz*.09+vWP2.y*.04).g,mf=texture2D(uDetail,vWP2.xz*.8+vWP2.y*.3).r;
   float moss=smoothstep(.3,.8,wn0.y+(mn-.5)*1.3)*${moss.toFixed(2)};float stain=smoothstep(.5,.85,texture2D(uDetail,vec2(vWP2.x*.5+vWP2.z*.5,vWP2.y*.025)).b)*(1.-abs(wn0.y));
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.5,.48,.42),stain*.55);diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.1,.17,.04)*(.6+.8*mf),moss*(.55+.45*mf));hgt+=moss*mf*.3;`)
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.97,moss);roughnessFactor=mix(roughnessFactor,.4,uRain*.7);')
  .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=bumpN(normal,-vViewPosition,hgt,'+(nat?'1.1':'.8')+');');};
 m.customProgramCacheKey=()=>'stone2'+(o.scale??.25)+nat+moss+(o.crag?'c':'');return m;}

/* ---------- geometry merge helper ---------- */
export function merge(list){const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3).fill(1),uvs=gs.every(g=>g.attributes.uv)?new Float32Array(n*2):null;let o=0;
 for(const g of gs){const k=g.attributes.position.count;if(uvs)uvs.set(g.attributes.uv.array,o*2);pos.set(g.attributes.position.array,o*3);if(g.attributes.normal)nor.set(g.attributes.normal.array,o*3);if(g.attributes.color)col.set(g.attributes.color.array,o*3);else if(g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('color',new THREE.BufferAttribute(col,3));if(uvs)r.setAttribute('uv',new THREE.BufferAttribute(uvs,2));r.computeBoundingSphere();return r;}
export const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
export function blob(r,detail,amp,seed){const g=new THREE.IcosahedronGeometry(r,detail);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=1+noise2(x*1.3+seed,z*1.3+y*.7)*amp;p.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;}

/* ================= terrain ================= */
// splat weights per vertex (rock, dirt, sand, snow) + grass tint in the vertex colour + wetness; the fragment shader height-blends
// baked albedo/normal sets (rock is triplanar with strata that follow world height) and rebuilds the normal in world space.
function terrainMesh(){const pos=new Float32Array(N*N*3),col=new Float32Array(N*N*3),spl=new Float32Array(N*N*4),wet=new Float32Array(N*N),idx=[];const c=new THREE.Color();
 const grassA=C(1.05,1.0,.9),grassB=C(1.25,1.12,.62),forest=C(.62,.7,.62),dryG=C(1.45,1.15,.55);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i,x=-HALF+i*CELL,z=-HALF+j*CELL,h=H[k];pos[k*3]=x;pos[k*3+1]=h;pos[k*3+2]=z;
  const g=gradAt(x,z),sl=Math.hypot(g.x,g.z),m=noise2(x*.02,z*.02)*.5+.5;const lake=inLake(x,z);
  c.copy(grassA).lerp(grassB,m*.8+noise2(x*.08,z*.08)*.15);c.lerp(forest,FOREST[k]*.8);c.lerp(dryG,ss(.55,.85,noise2(x*.011+7,z*.011))*.6*(1-FOREST[k]));c.lerp(C(.8,.85,.75),ss(45,62,h)*.5);
  col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;
  const rock=ss(.92,1.25,sl+noise2(x*.09,z*.09)*.12);let dirt=Math.max(PATH[k]*.95,clearing(x,z,-6)&&!lake?.45:0,FOREST[k]*.35*ss(.4,.9,noise2(x*.05,z*.05)));
  let sand=ss(3.4,1.4,h)*(lake?0:1);if(lake)sand=Math.max(sand,ss(POI.lake.level+1.6,POI.lake.level+.2,h)*.8);sand=Math.max(sand,RIVER[k]*.55);
  const snow=ss(68,80,h+noise2(x*.06,z*.06)*6)*ss(1.6,.9,sl);
  spl[k*4]=rock;spl[k*4+1]=Math.min(1,dirt)*(1-rock);spl[k*4+2]=sand*(1-rock);spl[k*4+3]=snow;
  wet[k]=Math.max(RIVER[k],lake?ss(POI.lake.level+1.2,POI.lake.level-.3,h):0,ss(1.2,-.5,h));}
 for(let j=0;j<N-1;j++)for(let i=0;i<N-1;i++){const a=j*N+i,b=a+1,cc=a+N,d=cc+1;idx.push(a,cc,b,b,cc,d);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));geo.setAttribute('aSplat',new THREE.BufferAttribute(spl,4));geo.setAttribute('aWet',new THREE.BufferAttribute(wet,1));geo.setIndex(idx);geo.computeVertexNormals();
 const T=terrainSet();const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92});mat.userData.uQ={value:2};
 mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{uDetail:{value:detailTex},tG:{value:T.grass},tGN:{value:T.grassN},tD:{value:T.dirt},tDN:{value:T.dirtN},tR:{value:T.rock},tRN:{value:T.rockN},tS:{value:T.sand},tSN:{value:T.sandN},uRain:U.uRain,uQ:mat.userData.uQ,uLake:{value:new THREE.Vector4(POI.lake.x,POI.lake.z,POI.lake.r+6,POI.lake.level)}});
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 aSplat;attribute float aWet;varying vec4 vSpl;varying float vWet;varying vec3 vWP2;varying vec3 vWN2;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP2=(modelMatrix*vec4(transformed,1.)).xyz;vWN2=normalize(objectNormal);vSpl=aSplat;vWet=aWet;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
varying vec4 vSpl;varying float vWet;varying vec3 vWP2;varying vec3 vWN2;uniform sampler2D uDetail,tG,tGN,tD,tDN,tR,tRN,tS,tSN;uniform float uRain,uQ;uniform vec4 uLake;
vec3 TN(sampler2D t,vec2 uv){vec3 n=texture2D(t,uv).xyz*2.-1.;n.y=-n.y;return n;}
float gW,dW,sW,rW,nW;vec3 wN;`)
  .replace('#include <color_fragment>',`
 vec3 wn=normalize(vWN2);vec3 an=pow(abs(wn),vec3(4.));an/=an.x+an.y+an.z;vec2 tp=vWP2.xz;
 float mac=texture2D(uDetail,tp*.0061).g,m2=texture2D(uDetail,tp*.019+.3).b,m3=texture2D(uDetail,tp*.07).r;
 vec2 g1=tp*.21,g2=tp*.057+vec2(.37,.11);vec3 gA=texture2D(tG,g1).rgb,gB=texture2D(tG,g2).rgb;vec3 grass=mix(gA,gB,clamp(.25+.5*m2,0.,1.))*vColor*(.78+.44*mac);
 vec2 d1=tp*.24;vec3 dirt=texture2D(tD,d1).rgb*(.85+.3*m2);vec2 s1=tp*.17;vec3 sand=texture2D(tS,s1).rgb;
 vec2 rx=vec2(vWP2.z,vWP2.y)*.1,rz=vec2(vWP2.x,vWP2.y)*.1,ry=tp*.1;vec3 rk=texture2D(tR,rx).rgb*an.x+texture2D(tR,ry).rgb*an.y+texture2D(tR,rz).rgb*an.z;
 float sb=floor(vWP2.y*.42+m2*2.);float sh=fract(sin(sb*91.7)*437.5);rk*=mix(vec3(1.),vec3(1.1,.98,.86),sh)*(.85+.4*sh)*(.85+.3*mac)*1.7;
 rk=mix(rk,rk*vec3(.75,.95,.55),smoothstep(.55,.95,wn.y)*.5);
 float rh=dot(rk,vec3(.33)),dh=dot(dirt,vec3(.33)),shh=dot(sand,vec3(.33));
 rW=smoothstep(.46,.56,vSpl.x+(rh-.3)*.9+(m3-.5)*.15);dW=smoothstep(.3,.7,vSpl.y+(dh-.4)*.6+(m3-.5)*.25)*(1.-rW);sW=smoothstep(.3,.7,vSpl.z+(shh-.6)*.4)*(1.-rW)*(1.-dW);nW=smoothstep(.35,.6,vSpl.w+(m3-.5)*.3);
 gW=max(0.,1.-rW-dW-sW);
 vec3 alb=grass*gW+dirt*dW+sand*sW+rk*rW;alb=mix(alb,vec3(.86,.9,.97)*(.92+.08*m3),nW);
 float wetK=clamp(vWet+uRain*.6,0.,1.);alb*=1.-wetK*.35;
 float uw=smoothstep(.2,-2.5,vWP2.y);if(distance(tp,uLake.xy)<uLake.z)uw=max(uw,smoothstep(uLake.w+.2,uLake.w-2.5,vWP2.y));alb=mix(alb,alb*vec3(.35,.5,.45),uw);
 diffuseColor.rgb=alb;`)
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(mix(.95,.82,rW),.55,nW);roughnessFactor=mix(roughnessFactor,.28,clamp(vWet*.8+uRain*an.y*.75,0.,1.));')
  .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 if(uQ>.5){vec3 pt=vec3(0.);vec3 gn=TN(tGN,g1);pt+=vec3(gn.x,0.,gn.y)*gW*.7;vec3 dn=TN(tDN,d1);pt+=vec3(dn.x,0.,dn.y)*dW;vec3 sn=TN(tSN,s1);pt+=vec3(sn.x,0.,sn.y)*(sW*.6+nW*.3);
  vec3 nx=TN(tRN,rx),ny=TN(tRN,ry),nz=TN(tRN,rz);pt+=(vec3(0.,nx.y,nx.x)*an.x+vec3(ny.x,0.,ny.y)*an.y+vec3(nz.x,nz.y,0.)*an.z)*rW*1.25*(1.-nW*.7);
  vec3 wN2=normalize(wn+pt);normal=normalize((viewMatrix*vec4(wN2,0.)).xyz);}`);};
 mat.customProgramCacheKey=()=>'terrain2';
 const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;return m;}

/* ================= water ================= */
function waterMat(level){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{uHMap:U.uHMap,uTime:U.uTime,uLevel:{value:level},uSunDir:U.uSunDir,uSunCol:U.uSunCol,uSkyTop:U.uSkyTop,uHorizon:U.uHorizon,uFogCol:U.uFogCol,uFogD:U.uFogD,uRain:U.uRain,uAmbTop:U.uAmbTop,uNight:U.uNight,uDetail:{value:detailTex}},
 vertexShader:`uniform float uTime;varying vec3 vWP;void main(){vec4 w=modelMatrix*vec4(position,1.);w.y+=sin(w.x*.08+uTime*.9)*.08+cos(w.z*.07+uTime*.7)*.08;vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`${GLSL_HMAP}
 uniform float uTime,uLevel,uFogD,uRain,uNight;uniform sampler2D uDetail;uniform vec3 uSunDir,uSunCol,uSkyTop,uHorizon,uFogCol,uAmbTop;varying vec3 vWP;
 vec2 wv(vec2 p,vec2 d,float f,float s){float ph=dot(p,d)*f+uTime*s;return d*cos(ph)*f;}
 float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 p=vWP.xz;vec2 g=wv(p,vec2(.8,.6),.35,1.2)*.25+wv(p,vec2(-.5,.86),.6,1.7)*.16+wv(p,vec2(.2,-.98),1.3,2.3)*.07+wv(p,vec2(-.9,-.3),2.7,3.1)*.035+wv(p,vec2(.6,-.8),5.1,4.)*.018;
  float rr=0.;if(uRain>0.){vec2 c=floor(p*1.5);vec2 f=fract(p*1.5)-.5;float t=fract(uTime*.9+h21(c));float r=length(f+vec2(h21(c+3.),h21(c+7.))*.4-.2);rr=sin((r-t*.6)*40.)*smoothstep(.3,0.,abs(r-t*.5))*(1.-t)*uRain;g+=vec2(rr)*.15;}
  vec2 q1=p*.11+vec2(uTime*.021,uTime*.013),q2=p*.17-vec2(uTime*.017,-uTime*.024);float e=.012;
  vec2 mg=vec2(texture2D(uDetail,q1+vec2(e,0)).r-texture2D(uDetail,q1-vec2(e,0)).r,texture2D(uDetail,q1+vec2(0,e)).r-texture2D(uDetail,q1-vec2(0,e)).r)+vec2(texture2D(uDetail,q2+vec2(e,0)).r-texture2D(uDetail,q2-vec2(e,0)).r,texture2D(uDetail,q2+vec2(0,e)).r-texture2D(uDetail,q2-vec2(0,e)).r);
  vec3 V=normalize(cameraPosition-vWP);float dist=length(cameraPosition-vWP);g+=mg*.55*(1.-smoothstep(20.,140.,dist));
  vec3 n=normalize(vec3(-g.x,1.,-g.y));n=normalize(mix(n,vec3(0,1,0),smoothstep(60.,400.,dist)*.7));
  float depth=uLevel-hmap(p).r;
  float fr=.02+.98*pow(1.-max(dot(n,V),0.),5.);vec3 r=reflect(-V,n);
  vec3 sky=mix(uHorizon,uSkyTop,pow(max(r.y,0.),.6));vec2 cu=r.xz/(max(r.y,.02)+.18)*.09+vec2(uTime*.0012,uTime*.0004);float cl=smoothstep(.5,.78,texture2D(uDetail,cu).g*.7+texture2D(uDetail,cu*2.7).r*.4);
  sky=mix(sky,mix(uHorizon,vec3(1.),.55)*(.75+uSunCol*.2),cl*.55*(1.-uNight*.8)*smoothstep(-.05,.15,r.y));
  float sp=(pow(max(dot(r,uSunDir),0.),620.)*1.4+pow(max(dot(r,uSunDir),0.),70.)*.08)*(1.-uRain*.8);
  vec3 sh=vec3(.05,.3,.26),md=vec3(.012,.13,.15),dp=vec3(.004,.035,.07);vec3 body=mix(mix(sh,md,smoothstep(.3,2.5,depth)),dp,smoothstep(2.5,11.,depth))*(uAmbTop*1.3+uSunCol*.55*max(uSunDir.y,0.));
  float sss=pow(max(dot(-V,uSunDir)*.5+.5,0.),4.)*max(g.x+g.y,0.)*2.;body+=vec3(.05,.3,.22)*uSunCol*sss*.25;
  vec3 col=mix(body,sky,fr*.85)+uSunCol*sp*3.;
  float fn=sin(depth*7.-uTime*1.6+sin(p.x*.4)*1.5)*.5+.5;float foam=(1.-smoothstep(0.,.55,depth))+(1.-smoothstep(.2,1.5,depth))*smoothstep(.75,1.,fn)*.8;foam=clamp(foam,0.,1.);
  col=mix(col,vec3(.85,.9,.9)*(uAmbTop*2.+uSunCol*.7),foam*.85);
  float a=clamp(mix(.45,.96,smoothstep(0.,3.5,depth))+fr*.3+foam,0.,1.);a*=smoothstep(-.15,.08,depth);
  float f=1.-exp(-uFogD*uFogD*dist*dist);col=mix(col,uFogCol,f);
  gl_FragColor=vec4(col,a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});}

/* ================= rivers + waterfalls ================= */
// one ribbon per river at the water level; at each terraced drop extra rows bend the sheet over the lip into a falling curtain.
// aFoam marks white water (falls, rapids below them), aFall the near-vertical curtain where the streaks run fast.
function riverMesh(){const pos=[],uv=[],foam=[],fall=[],idx=[];
 for(const R of RIVERS){const S=R.s;const rows=[];let v=0;
  for(let i=0;i<S.length;i++){const a=S[Math.max(0,i-1)],b=S[Math.min(S.length-1,i+1)];let tx=b.x-a.x,tz=b.z-a.z;const tl=Math.hypot(tx,tz)||1;tx/=tl;tz/=tl;
   const p=S[i];const prev=S[i-1];
   if(prev&&prev.L-p.L>1.6){// waterfall: arc from the lip down to the pool
    const drop=prev.L-p.L;for(let k=1;k<=6;k++){const t=k/7;const x=prev.x+(p.x-prev.x)*(Math.sqrt(t)*.9),z=prev.z+(p.z-prev.z)*(Math.sqrt(t)*.9);const y=prev.L-drop*t*t;v+=drop/7;rows.push({x,z,y,tx,tz,w:p.w*.5+.4,v,f:1,fa:1});}}
   if(i>0)v+=Math.hypot(p.x-prev.x,p.z-prev.z);
   let since=1e9;for(let k=i;k>=0&&k>i-10;k--){if(k>0&&S[k-1].L-S[k].L>1.6){since=i-k;break;}}
   rows.push({x:p.x,z:p.z,y:p.L+.02,tx,tz,w:p.w*.5+.8,v,f:since<9?Math.max(0,1-since/8):0,fa:0});}
  const base=pos.length/3;rows.forEach((r,k)=>{const nx=-r.tz,nz=r.tx;for(const sd of[-1,0,1]){pos.push(r.x+nx*r.w*sd,r.y-(sd===0?0:.02),r.z+nz*r.w*sd);uv.push(sd*.5+.5,r.v);foam.push(r.f);fall.push(r.fa);}
   if(k){const o=base+(k-1)*3;for(let c=0;c<2;c++)idx.push(o+c,o+3+c,o+1+c,o+1+c,o+3+c,o+4+c);}});}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('aFoam',new THREE.Float32BufferAttribute(foam,1));g.setAttribute('aFall',new THREE.Float32BufferAttribute(fall,1));g.setIndex(idx);g.computeBoundingSphere();
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,uniforms:{uHMap:U.uHMap,uTime:U.uTime,uSunDir:U.uSunDir,uSunCol:U.uSunCol,uSkyTop:U.uSkyTop,uHorizon:U.uHorizon,uFogCol:U.uFogCol,uFogD:U.uFogD,uRain:U.uRain,uAmbTop:U.uAmbTop,uNight:U.uNight,uDetail:{value:detailTex},uStreak:{value:waterStreak()}},
  vertexShader:`attribute float aFoam,aFall;varying vec3 vWP;varying vec2 vUv;varying float vFoam,vFall;void main(){vUv=uv;vFoam=aFoam;vFall=aFall;vec4 w=modelMatrix*vec4(position,1.);vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`${GLSL_HMAP}
  uniform float uTime,uFogD,uRain,uNight;uniform sampler2D uDetail,uStreak;uniform vec3 uSunDir,uSunCol,uSkyTop,uHorizon,uFogCol,uAmbTop;varying vec3 vWP;varying vec2 vUv;varying float vFoam,vFall;
  void main(){float sp=mix(1.1,6.,vFall);vec2 fu=vec2(vUv.x*1.6,vUv.y*.16-uTime*sp*.16);vec2 fu2=vec2(vUv.x*2.3+.3,vUv.y*.26-uTime*sp*.27);
   vec3 s1=texture2D(uStreak,fu).rgb,s2=texture2D(uStreak,fu2).rgb;vec2 g=(vec2(s1.b,s2.b)-.5)*.9+(vec2(texture2D(uDetail,vWP.xz*.15+vec2(0.,-uTime*.12)).r,texture2D(uDetail,vWP.xz*.21-vec2(uTime*.05,uTime*.17)).r)-.5)*.6;
   vec3 n=normalize(vec3(-g.x,1.,-g.y));vec3 V=normalize(cameraPosition-vWP);float dist=length(cameraPosition-vWP);
   float depth=vWP.y-hmap(vWP.xz).r;float fr=.03+.97*pow(1.-max(dot(n,V),0.),5.);vec3 r=reflect(-V,n);vec3 sky=mix(uHorizon,uSkyTop,pow(max(r.y,0.),.6));
   float spec=pow(max(dot(r,uSunDir),0.),300.)*(1.-uRain*.8);vec3 body=mix(vec3(.06,.2,.17),vec3(.01,.06,.07),smoothstep(.1,1.6,depth))*(uAmbTop*1.4+uSunCol*.6*max(uSunDir.y,0.));
   vec3 col=mix(body,sky,fr*.8)+uSunCol*spec*2.5;
   float edge=1.-smoothstep(0.,.18,min(vUv.x,1.-vUv.x));float st=s1.r*.6+s2.r*.6;float bub=s1.g*s2.g;
   float foam=clamp(vFoam*(.35+st*.9)+vFall*(.2+st*1.1)+(1.-smoothstep(0.,.32,depth))*(.35+bub*1.5)*(1.-vFall)+edge*.25,0.,1.);
   vec3 fc=vec3(.8,.86,.88)*(uAmbTop*2.+uSunCol*.7*max(uSunDir.y,.1));col=mix(col,fc,foam);
   float a=clamp(mix(.55,.92,smoothstep(0.,.9,depth))+fr*.25+foam,0.,1.)*(1.-edge*.7);a=mix(a,clamp(.3+st*.75,0.,.9)*(1.-edge*.9),vFall);
   float f=1.-exp(-uFogD*uFogD*dist*dist);col=mix(col,uFogCol,f);gl_FragColor=vec4(col,a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const mesh=new THREE.Mesh(g,m);mesh.renderOrder=2;return mesh;}

/* ================= distant ranges: islands and peaks beyond the sea, blended into the sky by height-aware aerial perspective ================= */
function farRanges(){const L=[];const r=mulberry(404);
 const peak=(ang,dist,h,w,seed)=>{const g=new THREE.CylinderGeometry(0,w,h,40,14,true);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const t=(y+h/2)/h,a=Math.atan2(z,x);
   const rr=Math.hypot(x,z);const n=noise2(a*3+seed,t*3)*.25+noise2(a*9+seed,t*7)*.1;const ridge=1-Math.abs(noise2(a*2.2+seed*3,t*2));const k=(1+n)*(.85+ridge*.25);p.setXYZ(i,x*k,y+noise2(x*.02+seed,z*.02)*h*.08*t,z*k);}
  g.translate(Math.cos(ang)*dist,h/2-6,Math.sin(ang)*dist);g.computeVertexNormals();return g;};
 const spec=[[.2,1150,190,420],[.55,1300,260,520],[.75,1050,150,330],[1.35,1400,300,620],[1.7,1180,170,380],[2.4,1250,220,480],[2.75,1350,280,560],[3.3,1100,140,360],[3.9,1300,240,520],[4.3,1200,180,400],[4.9,1400,320,640],[5.4,1150,200,420],[5.85,1280,240,500]];
 spec.forEach(([a,d,h,w],i)=>{L.push(peak(a,d,h,w,i*7.3));if(r()<.7)L.push(peak(a+.12,d*1.08,h*.6,w*.8,i*3.1+2));});
 const g=mergeAll(L,false);
 const m=new THREE.ShaderMaterial({fog:false,uniforms:{uSunDir:U.uSunDir,uSunCol:U.uSunCol,uHorizon:U.uHorizon,uSkyTop:U.uSkyTop,uFogCol:U.uFogCol,uAmbTop:U.uAmbTop,uRain:U.uRain,uNight:U.uNight,uBlood:U.uBlood,uDetail:{value:detailTex}},
  vertexShader:'varying vec3 vWP,vN;void main(){vec4 w=modelMatrix*vec4(position,1.);vWP=w.xyz;vN=normal;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform vec3 uSunDir,uSunCol,uHorizon,uSkyTop,uFogCol,uAmbTop;uniform float uRain,uNight,uBlood;uniform sampler2D uDetail;varying vec3 vWP,vN;
  void main(){vec3 n=normalize(vN);float d=texture2D(uDetail,vWP.xz*.004+vWP.y*.003).r;float snow=smoothstep(110.,170.,vWP.y+d*50.)*smoothstep(.2,.6,n.y);
   vec3 alb=mix(mix(vec3(.16,.17,.15),vec3(.2,.22,.13),smoothstep(.6,.9,n.y)),vec3(.9,.92,.96),snow)*(.8+.4*d);
   vec3 col=alb*(uAmbTop*1.1+uSunCol*max(dot(n,uSunDir),0.)*1.2);
   vec3 V=normalize(vWP-cameraPosition);float hz=1.-smoothstep(0.,.35,V.y);float haze=clamp(.62+.3*hz-vWP.y*.0009,0.,.93);haze=mix(haze,.97,uRain);
   vec3 air=mix(uHorizon,uFogCol,.4)+uSunCol*pow(max(dot(V,uSunDir),0.),8.)*.25;col=mix(col,air,haze);gl_FragColor=vec4(col,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=-5;return mesh;}

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
  // clouds: a cumulus deck self-shadowed toward the sun (bright rims, dense grey cores) and a thin streaked cirrus layer above
  if(y>-.02){vec2 uv=d.xz/(y+.13)+vec2(uTime*.006,uTime*.0022);float cov=mix(.55,.16,uRain);
   float n=fbm(uv*1.1)*.72+fbm(uv*3.2+3.1)*.38;float c=smoothstep(cov,cov+.26,n);
   vec2 so=normalize(uSunDir.xz+vec2(1e-4))*.09;float ns=fbm((uv+so)*1.1)*.72+fbm((uv+so)*3.2+3.1)*.38;
   float shade=clamp(.62-(ns-n)*4.,0.,1.);float thick=smoothstep(cov+.05,cov+.55,n);
   vec3 lit=mix(uHorizon,vec3(1.),.68)*(.82+uSunCol*.4);vec3 dk=mix(uHorizon*.5+uSkyTop*.3,vec3(.3,.32,.38)*(uSkyTop+uHorizon)*1.6,.35);
   vec3 cc=mix(dk,lit,clamp(shade*(1.-thick*.45)+.12,0.,1.));cc+=uSunCol*pow(sd,10.)*(1.-thick)*2.2*(1.-uRain);
   cc=mix(cc,vec3(.24,.26,.3)*(uSkyTop+uHorizon)*1.2,uRain*.75);
   col=mix(col,cc,c*smoothstep(-.02,.1,y)*.95);
   vec2 cu=d.xz/(y+.35)*vec2(.45,1.6)+vec2(uTime*.003,0.);float ci=smoothstep(.5,.9,fbm(cu*1.3+7.))*smoothstep(.04,.3,y)*(1.-c)*(1.-uRain);
   col=mix(col,mix(uHorizon,vec3(1.),.8)*(.9+uSunCol*.3),ci*.35*(1.-uNight*.85));}
  col=mix(col,col*vec3(1.25,.45,.4),uBlood*.55);
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});const s=new THREE.Mesh(new THREE.SphereGeometry(1800,48,24),m);s.frustumCulled=false;s.renderOrder=-10;return s;}

/* ================= grass + flowers ================= */
function grassGeo(max){const pos=[],nor=[],uv=[],idx=[];const SEG=3;
 for(let b=0;b<3;b++){const a=b*2.094+.3,ca=Math.cos(a),sa=Math.sin(a),ox=Math.cos(a+1.3)*.09,oz=Math.sin(a+1.3)*.09,base=pos.length/3;
  for(let s=0;s<=SEG;s++){const t=s/SEG,w=.046*(1-t*.9),lean=t*t*.26;for(const side of[-1,1]){pos.push(ox+ca*w*side+sa*lean,t,oz+sa*w*side*-1*-1-ca*lean);nor.push(sa*.85+ca*side*.5,.15,-ca*.85+sa*side*.5);uv.push(side*.5+.5,t);}}
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
 varying vec3 vCol,vWP,vNrm;varying float vH,vShade,vGust;
 void main(){vec2 w=uCenter+mod(aOff-uCenter+uTile*.5,uTile)-uTile*.5;vec4 hm=hmap(w);float d=distance(w,cameraPosition.xz);
  float fade=1.-smoothstep(uTile*.28,uTile*.47,d);
  ${kind==='grass'?'float dens=hm.g;float hgt=(.28+aRnd.y*.5)*(.55+.45*dens)*step(aRnd.x,dens*1.1);':'float dens=hm.b;float hgt=(.45+aRnd.y*.35)*step(aRnd.x,dens*.9);'}
  hgt*=fade*uScale*smoothstep(.5,2.2,distance(vec3(w.x,hm.r,w.y),cameraPosition));float ang=aRnd.z*6.2832,cs=cos(ang),sn=sin(ang);vec3 p=position;p.xz=vec2(cs*p.x-sn*p.z,sn*p.x+cs*p.z);vec3 nn=vec3(cs*normal.x-sn*normal.z,normal.y,sn*normal.x+cs*normal.z);
  float t=uv.y;p*=hgt;${kind==='grass'?'p.xz*=1.+aRnd.w*.6;':''}
  float g1=sin(dot(w,vec2(.11,.07))-uTime*1.6+sin(w.x*.05+uTime*.25)*2.);float g2=sin(dot(w,vec2(-.31,.23))+uTime*3.3+aRnd.z*6.);
  vec2 sway=uWind*(.5+.5*g1)+vec2(g2,-g2)*.14*(.4+length(uWind));vGust=smoothstep(.2,1.,g1)*(.3+length(uWind));
  vec2 dp=w-uPlayer.xz;float pd=length(dp);float tr=(1.-smoothstep(.15,1.2,pd))*step(abs(uPlayer.y-hm.r),2.5);sway+=dp/max(pd,.001)*tr*1.8;
  float bend=t*t;p.xz+=sway*bend*hgt*.9;p.y-=dot(sway,sway)*bend*hgt*.16;
  vec3 wp=vec3(w.x,hm.r-.04,w.y)+p;vWP=wp;vH=t;vNrm=normalize(mix(vec3(0,1,0),nn,.3));vShade=hm.a;
  float mac=sin(w.x*.031+sin(w.y*.023)*2.)*.5+.5;
  ${kind==='grass'?`float dry=smoothstep(.5,.9,sin(w.x*.013+sin(w.y*.017)*2.3+1.)*.5+.5+sin(w.y*.041+w.x*.02)*.2);vec3 base=mix(vec3(.035,.08,.012),vec3(.06,.12,.018),mac);vec3 tip=mix(vec3(.16,.3,.045),vec3(.34,.4,.09),aRnd.w*mac);tip=mix(tip,vec3(.46,.4,.14),dry*.75*aRnd.x);vCol=mix(base,tip,t*t*.6+t*.4)*(.78+.4*aRnd.y);`
  :`vec3 pc=aRnd.w<.33?vec3(1.,.85,.25):aRnd.w<.66?vec3(.95,.95,1.):vec3(.55,.3,1.);if(aRnd.y>.85)pc=vec3(1.,.25,.12);vCol=uv.x>.5?pc:vec3(.08,.2,.03);`}
  gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
 fragmentShader:`uniform vec3 uSunDir,uSunCol,uAmbTop,uAmbBot,uFogCol;uniform float uFogD,uRain;varying vec3 vCol,vWP,vNrm;varying float vH,vShade,vGust;
 void main(){vec3 n=normalize(vNrm);float dif=max(dot(n,uSunDir),0.)*.5+.5*max(uSunDir.y,0.);vec3 V=normalize(cameraPosition-vWP);
  float trans=pow(max(dot(-V,uSunDir),0.),5.)*vH*1.4;float sh=mix(.3,1.,vShade);vec3 amb=mix(uAmbBot,uAmbTop,.35+.65*vH);
  vec3 col=vCol*(amb*(.4+.6*vH)+uSunCol*dif*sh+uSunCol*trans*sh*vec3(.9,1.,.45));col+=uSunCol*vCol*vGust*vH*sh*.9;col*=mix(.55,1.,vH);col*=1.-uRain*.2;
  float fd=length(vWP-cameraPosition);col=mix(col,uFogCol,1.-exp(-uFogD*uFogD*fd*fd));gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});}

/* ================= trees & rocks ================= */
function foliage(m,amt){return windify(m,amt,true);}
function windify(m,amt,leaf){m.onBeforeCompile=sh=>{sh.uniforms.uTime=U.uTime;sh.uniforms.uWind=U.uWind;sh.uniforms.uSunDir=U.uSunDir;sh.uniforms.uSunCol=U.uSunCol;
 if(leaf){sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>',THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;','')).replace('#include <common>','#include <common>\nuniform vec3 uSunDir,uSunCol;varying vec3 vLW;')
  .replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nvec3 lv=normalize(cameraPosition-vLW);float bl=pow(max(dot(-lv,uSunDir),0.),3.);reflectedLight.directDiffuse+=diffuseColor.rgb*uSunCol*(bl*1.4+.12)*vec3(.95,1.08,.45)*smoothstep(-.1,.2,uSunDir.y);');
  sh.vertexShader=sh.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 lw=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nlw=instanceMatrix*lw;\n#endif\nvLW=(modelMatrix*lw).xyz;').replace('#include <common>','#include <common>\nvarying vec3 vLW;');}
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;uniform vec2 uWind;').replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 vec3 ip=instanceMatrix[3].xyz;
 #else
 vec3 ip=vec3(0.);
 #endif
 float hh=max(0.,transformed.y-1.2);float sw=(sin(uTime*1.3+ip.x*.21+ip.z*.17)*.6+sin(uTime*2.1+ip.x*.5)*.3)*(.4+length(uWind));
 transformed.xz+=(uWind*.6+vec2(sw,sw*.6))*hh*${amt.toFixed(3)};transformed+=sin(uTime*5.+position*3.1)*.025*step(1.5,transformed.y);`);};m.customProgramCacheKey=()=>'wind'+amt+!!leaf;return m;}
function vcolGeo(g,f){const p=g.attributes.position,n=g.attributes.normal,c=new Float32Array(p.count*3);const col=new THREE.Color();for(let i=0;i<p.count;i++){f(col,p.getX(i),p.getY(i),p.getZ(i),n.getY(i));c[i*3]=col.r;c[i*3+1]=col.g;c[i*3+2]=col.b;}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;}
/* smooth normals for non-indexed geometry (average by welded position) */
function smoothN(g){const p=g.attributes.position,n=g.attributes.normal,m=new Map(),key=i=>(p.getX(i)*1e3|0)+','+(p.getY(i)*1e3|0)+','+(p.getZ(i)*1e3|0);
 for(let i=0;i<p.count;i++){const k=key(i),a=m.get(k)||[0,0,0];a[0]+=n.getX(i);a[1]+=n.getY(i);a[2]+=n.getZ(i);m.set(k,a);}
 for(let i=0;i<p.count;i++){const a=m.get(key(i)),l=Math.hypot(...a)||1;n.setXYZ(i,a[0]/l,a[1]/l,a[2]/l);}return g;}
const uvAt=(g,u,v)=>{const a=new Float32Array(g.attributes.position.count*2);for(let i=0;i<a.length;i+=2){a[i]=u;a[i+1]=v;}g.setAttribute('uv',new THREE.BufferAttribute(a,2));return g;};
/* leaf card: a quad on the canopy shell with normals bent outward from the crown centre (soft, rounded lighting) */
function leafCard(cx,cy,cz,ox,oy,oz,size,r,crown){const g=new THREE.PlaneGeometry(size,size);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,.12+uv.getX(i)*.88);
 const d=new V(ox,oy,oz).normalize(),q=new THREE.Quaternion().setFromUnitVectors(new V(0,0,1),d.clone().lerp(new V(r()-.5,r()-.5,r()-.5),.55).normalize());q.multiply(new THREE.Quaternion().setFromAxisAngle(new V(0,0,1),r()*6.28));
 g.applyQuaternion(q);g.translate(cx+ox,cy+oy,cz+oz);const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const v=new V(p.getX(i)-crown.x,(p.getY(i)-crown.y)*1.3,p.getZ(i)-crown.z).normalize();v.y+=.25;v.normalize();n.setXYZ(i,v.x,v.y,v.z);}return g;}
function canopyGeo(){const L=[];const r=mulberry(9),crown=new V(0,4.7,0);for(let i=0;i<7;i++){const a=r()*6.28,d=i?.9+r()*.9:0,s=i?1.05+r()*.6:1.65,cx=Math.cos(a)*d,cy=4.4+(i?r()*1.6-.5:.4),cz=Math.sin(a)*d;
  L.push([uvAt(smoothN(blob(.84,1,.2,i*3.1)),.045,.955),M4(cx,cy,cz,0,0,0,s)]);
  for(let k=0;k<12;k++){const u=r()*2-1,ph=r()*6.283,rr=Math.sqrt(1-u*u),dir=new V(rr*Math.cos(ph),Math.abs(u)*.8+u*.2+.15,rr*Math.sin(ph)).normalize().multiplyScalar(s*.82);L.push([leafCard(cx,cy,cz,dir.x,dir.y,dir.z,s*1.25,r,crown),null]);}}
 return vcolGeo(merge(L),(c,x,y,z,ny)=>{const t=ss(3,6.6,y);c.setRGB(.05+t*.1,.11+t*.17,.025+t*.025).multiplyScalar(.62+.5*(ny*.5+.5));});}
function trunkGeo(){const tw=g=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)+Math.sin(y*1.3)*.06);p.setZ(i,p.getZ(i)+Math.cos(y*.9)*.05);}g.computeVertexNormals();return g;};
 const L=[[tw(new THREE.CylinderGeometry(.19,.34,4.2,9,6)),M4(0,2.1,0)],[new THREE.CylinderGeometry(.06,.13,1.8,6),M4(.5,3.2,0,0,0,-.8)],[new THREE.CylinderGeometry(.06,.12,1.6,6),M4(-.35,3.5,.3,.6,0,.7)],[new THREE.CylinderGeometry(.05,.1,1.4,6),M4(.1,3.9,-.45,-.7,0,.1)]];
 for(let i=0;i<4;i++){const a=i*1.57+.4;L.push([new THREE.CylinderGeometry(.05,.16,.9,5),M4(Math.cos(a)*.3,.18,Math.sin(a)*.3,Math.sin(a)*1.1,0,-Math.cos(a)*1.1)]);}
 return vcolGeo(merge(L),(c,x,y)=>c.setRGB(.32,.25,.19).multiplyScalar(.7+.45*ss(0,3,y)));}
function pineGeo(){const L=[[new THREE.CylinderGeometry(.1,.26,3.4,7),M4(0,1.7,0)]];const T=6;for(let i=0;i<T;i++){const s=1-i*.14,r=2.3*s,h=2.2*s,g=new THREE.ConeGeometry(r,h,18,2),p=g.attributes.position;
  for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k),rr=Math.hypot(x,z)/r;if(rr<.01)continue;const a=Math.atan2(z,x),j=1+.22*Math.sin(a*9+i*2.1)+.1*Math.sin(a*4+i);p.setXYZ(k,x*(1+(j-1)*rr),y-rr*rr*.35*h,z*(1+(j-1)*rr));}
  g.computeVertexNormals();L.push([g,M4(0,2.4+i*1.25+h/2,0,0,i*.7,0)]);}
 return vcolGeo(merge(L),(c,x,y,z,ny)=>{const rr=Math.hypot(x,z);if(y<2.3&&rr<.3)c.setRGB(.09,.06,.04);else{const tip=ss(.35,1.1,rr/(1.2-.11*(y-2.4)+.6));c.setRGB(.022+tip*.03,.06+ny*.025+tip*.05,.035+tip*.012).multiplyScalar((.62+.55*ss(2,9,y))*(ny<0?.6:1));}});}
function rockGeo(seed,det=2){const r=mulberry(seed*13+det);const g0=new THREE.IcosahedronGeometry(1,det+1);const p=g0.attributes.position;const planes=[];for(let k=0;k<7;k++){const n=new V(r()*2-1,r()*1.6-.4,r()*2-1).normalize();planes.push([n,.55+r()*.3]);}
 for(let i=0;i<p.count;i++){const v=new V(p.getX(i),p.getY(i),p.getZ(i));const k=1+noise2(v.x*1.6+seed,v.z*1.6+v.y)*.22+noise2(v.x*4+seed,v.y*4)*.05;v.multiplyScalar(k);for(const[n,d]of planes){const t=v.dot(n);if(t>d)v.addScaledVector(n,-(t-d)*.9);}v.y=Math.max(v.y,-.45);p.setXYZ(i,v.x,v.y,v.z);}
 const g=g0.toNonIndexed();g.computeVertexNormals();return vcolGeo(g,(c,x,y,z,ny)=>{c.setRGB(.42,.4,.37).multiplyScalar(.8+.25*noise2(x*2+seed,z*2));});}

export class World{
 constructor(scene,phys){this.scene=scene;this.phys=phys;this.trees=[];this.rocks=[];this.apples=[];
  /* placement first (trees shade the grass) */
  const P=[],Pi=[],R=[];for(let x=-HALF+4;x<HALF-4;x+=5.2)for(let z=-HALF+4;z<HALF-4;z+=5.2){const px=x+rnd(4.2),pz=z+rnd(4.2),h=heightAt(px,pz);if(h<2.4)continue;const g=gradAt(px,pz),sl=Math.hypot(g.x,g.z);
   if(clearing(px,pz,3)||roadDist(px,pz)<4.5||inLake(px,pz)||inRiver(px,pz,2.5))continue;const fd=forestDensity(px,pz);
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
  this.river=riverMesh();scene.add(this.river);this.ranges=farRanges();scene.add(this.ranges);
  // grass + flowers
  this.grassMax=72000;this.grass=new THREE.Mesh(grassGeo(this.grassMax),fieldMat('grass',64));this.grass.frustumCulled=false;scene.add(this.grass);
  this.flowerMax=9000;this.flowers=new THREE.Mesh(flowerGeo(this.flowerMax),fieldMat('flower',56));this.flowers.frustumCulled=false;scene.add(this.flowers);
  // trees: three broadleaf variants + a conifer, culled per instance with near/far LODs (see trees.js Scatter)
  const leafT=leafAtlas(),pineT=pineAtlas(),BKs=barkSet();
  const leafM=foliage(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,map:leafT,alphaTest:.45,side:THREE.DoubleSide}),.05),pineM=foliage(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,map:pineT,alphaTest:.42,side:THREE.DoubleSide}),.03);
  const barkM=windify(new THREE.MeshStandardMaterial({color:new THREE.Color(4.6,4.2,3.8),vertexColors:true,roughness:.93,map:BKs.map,normalMap:BKs.normal,normalScale:new THREE.Vector2(1.6,1.6)}),.05),farLeafM=windify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,map:leafT}),.03),farPineM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,map:pineT});
  this.leafM=leafM;this.scatters=[];
  const kinds=[broadleaf(11,0),broadleaf(23,1),broadleaf(37,0),conifer(5),conifer(17)];
  const lists=kinds.map(()=>[]);
  P.forEach((t,i)=>{const v=t[3]>2?0:(rng()<.45?0:rng()<.55?1:2);lists[v].push(t);});Pi.forEach(t=>lists[rng()<.5?3:4].push(t));
  const tintB=i=>{},tc=new THREE.Color();
  lists.forEach((L,k)=>{const K=kinds[k],pine=k>=3;const items=L.map(t=>[t[0],t[1]-.15,t[2],t[3]*(pine?.92:1),t[4]]);const tints=L.map(()=>{const r=rng();if(pine)return[.85+rng()*.25,.9+rng()*.2,.85+rng()*.2];if(r<.06)return[2.2,1.45,.4];if(r<.13)return[1.45,1.3,.6];return[.85+rng()*.3,.9+rng()*.25,.8+rng()*.2];});
   const sc=new Scatter(scene,[{geo:K.wood,mat:barkM,shadow:true},{geo:K.leaves,mat:pine?pineM:leafM,shadow:true}],{geo:K.far,mat:pine?farPineM:farLeafM},items,{radius:K.radius,nearD:[55,85,120],farD:[330,430,520],shadowD:42,tint:(i,c)=>c.setRGB(...tints[i])});this.scatters.push(sc);});
  for(const t of P){phys.cyl(t[0],t[2],.38*t[3],t[1]-1,t[1]+3.6*t[3],{climb:true,tag:'tree'});this.trees.push(t);}
  for(const t of Pi){phys.cyl(t[0],t[2],.3*t[3],t[1]-1,t[1]+2*t[3],{tag:'tree'});this.trees.push(t);}
  // apples under some broadleaf trees
  P.forEach(t=>{if(rng()<.35){const a=rng()*6.28,d=1.5+rng()*2;this.apples.push({x:t[0]+Math.cos(a)*d,z:t[2]+Math.sin(a)*d});}});
  // rocks (instanced, culled) — moss on their tops comes from the stone shader
  const rkGeo=rockGeo(3),rkFar=rockGeo(3,1);const rockM=stoneMat({rough:.9,scale:.35,natural:true,moss:1});const RI=R.map(r=>{phys.cyl(r[0],r[2],r[3]*.95,r[1]-2,r[1]+r[3]*1.05,{tag:'rock',climb:true});this.rocks.push(r);return[r[0],r[1]+r[3]*.25,r[2],r[3],r[4],0,0,.72];});
  this.scatters.push(new Scatter(scene,[{geo:rkGeo,mat:rockM,shadow:true}],{geo:rkFar,mat:rockM},RI,{radius:1.6,nearD:[60,90,120],farD:[300,380,460],shadowD:40}));
  // cliff outcrops: stepped strata slabs bedded into steep faces
  const OC=[];const og=[outcrop(3),outcrop(8),outcrop(14)];const ol=[[],[],[]];for(let x=-HALF+6;x<HALF-6;x+=4.6)for(let z=-HALF+6;z<HALF-6;z+=4.6){const px=x+rnd(3.6),pz=z+rnd(3.6),h=heightAt(px,pz);if(h<1)continue;const g=gradAt(px,pz),sl=Math.hypot(g.x,g.z);if(sl<1.3||rng()>.6)continue;if(clearing(px,pz,2)||roadDist(px,pz)<4||inRiver(px,pz,2))continue;
   const yaw=Math.atan2(-g.x,-g.z);ol[OC.length%3].push([px,h-1.3,pz,.8+rng()*.8,yaw,-.1+rng()*.2,0,1]);OC.push(1);}
  ol.forEach((L,i)=>this.scatters.push(new Scatter(scene,[{geo:og[i],mat:stoneMat({natural:true,rough:.95,scale:.3,moss:1}),shadow:true}],{geo:og[i],mat:stoneMat({natural:true,rough:.95,scale:.3,moss:1})},L,{radius:3,nearD:[70,100,130],farD:[320,420,520],shadowD:35})));
  // bushes (no collision)
  const B=[];for(let i=0;i<1300;i++){const x=(rng()*2-1)*HALF*.85,z=(rng()*2-1)*HALF*.85,h=heightAt(x,z);if(h<2.5||h>60||clearing(x,z,1)||roadDist(x,z)<3||inLake(x,z)||inRiver(x,z,1))continue;const g=gradAt(x,z);if(Math.hypot(g.x,g.z)>.8)continue;if(rng()>forestDensity(x,z)*.8+.15)continue;B.push([x,h-.1,z,(.35+rng()*.4)*1.6,rng()*6]);}
  this.scatters.push(new Scatter(scene,[{geo:bush(21),mat:leafM,shadow:true}],null,B,{radius:1.8,nearD:[45,70,95],farD:[45,70,95],shadowD:25,tint:(i,c)=>c.setRGB(.8+rng()*.4,.85+rng()*.3,.75+rng()*.3)}));
  // ferns + river reeds near water and in deep forest (cheap crossed cards from the conifer atlas)
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
 setQuality(q){this.q=q;const g=[20000,42000,72000][q],f=[2500,5500,8000][q];this.grass.geometry.instanceCount=g;this.flowers.geometry.instanceCount=f;this.grass.material.uniforms.uTile.value=[46,58,66][q];this.flowers.material.uniforms.uTile.value=[40,50,56][q];this.grass.material.uniforms.uScale.value=[1.15,1.05,1][q];for(const sc of this.scatters)sc.setQuality(q);this.terrain.material.userData.uQ.value=q;}
 update(dt,cam,inside,focus){for(const sc of this.scatters){sc.visible=!inside;if(!inside)sc.update(cam,dt,false,focus);}const fw=new V();cam.getWorldDirection(fw);fw.y=0;fw.normalize();
  for(const m of[this.grass,this.flowers]){const t=m.material.uniforms.uTile.value;m.material.uniforms.uCenter.value.set(cam.position.x+fw.x*t*.28,cam.position.z+fw.z*t*.28);}
  this.sky.position.copy(cam.position);this.rain.material.uniforms.uCam.value.copy(cam.position);this.rain.visible=U.uRain.value>.02&&!inside;
  const day=Math.max(0,U.uSunDir.value.y)*(1-U.uNight.value);this.shaftM.uniforms.uA.value=ss(.05,.4,day)*(1-U.uRain.value);
  for(const o of[this.grass,this.flowers,this.sky,this.sea,this.lake,this.shafts,this.terrain,this.river,this.ranges])o.visible=!inside;this.ranges.position.set(cam.position.x*.85,0,cam.position.z*.85);}
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
