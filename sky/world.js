// SKY LANCERS — world: analytic sky + aerial haze, Gerstner ocean, procedural archipelago, forests, towns, clouds, carrier, ships, ground sites.
import * as THREE from '../vendor/three.module.min.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';
const V=THREE.Vector3,C=THREE.Color;
export const WORLD=11500;           // half extent of the combat area (m)
export const DECK_Y=19;             // carrier flight deck height
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R0=rng(7331),SN=new SimplexNoise({random:R0});
const n2=(x,z)=>SN.noise(x,z),sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
export function fbm(x,z,o=4){let a=0,f=1,s=.5,t=0;for(let i=0;i<o;i++){a+=n2(x*f,z*f)*s;t+=s;f*=2.03;s*=.5;}return a/t;}
function ridge(x,z,o=4){let a=0,f=1,s=.5,t=0;for(let i=0;i<o;i++){const v=1-Math.abs(n2(x*f+31,z*f-17));a+=v*v*s;t+=s;f*=2.1;s*=.5;}return a/t;}
const sRGB=(r,g,b)=>new C().setRGB(r,g,b,THREE.SRGBColorSpace);

/* ================= archipelago height field ================= */
export const ISLANDS=[
 {name:'HAVEN',x:-3300,z:3500,r:2700,h:560,rot:.5,sq:1.45},
 {name:'FANG',x:4900,z:-4300,r:2300,h:430,rot:-.4,sq:1.3},
 {name:'EMBER PEAK',x:-5500,z:-4000,r:2500,h:1350,rot:0,sq:1.08,volcano:1},
 {name:'CORAL KEYS',x:6400,z:4300,r:760,h:70,rot:1,sq:1.2},{x:7400,z:3400,r:540,h:55,rot:.3,sq:1.4},{x:5600,z:5400,r:500,h:60},{x:7100,z:5300,r:400,h:40},
 {name:'TWIN SPIRES',x:200,z:-1000,r:950,h:430,rot:.8,sq:1.6},
 {name:'WESTWATCH',x:-8600,z:600,r:1500,h:380,rot:1.1,sq:1.3},
 {name:'NORTH REACH',x:900,z:-8800,r:1800,h:660,rot:.2,sq:1.4},
 {x:8900,z:-800,r:1250,h:330,rot:-.7,sq:1.2},
 {x:-1700,z:-5000,r:650,h:170},{x:-7700,z:7600,r:1150,h:300},{x:3000,z:8800,r:950,h:240},{x:-10200,z:-7400,r:1200,h:420},{x:9600,z:8600,r:1000,h:260}];
for(const I of ISLANDS){I.c=Math.cos(I.rot||0);I.s=Math.sin(I.rot||0);I.sq=I.sq||1;I.seed=R0()*100;}
export function height(x,z){let best=-9,bi=null;const wx=n2(x*.00045,z*.00045);
 for(const I of ISLANDS){const dx=x-I.x,dz=z-I.z,lim=I.r*1.9;if(dx>lim||dx<-lim||dz>lim||dz<-lim)continue;
  const u=(dx*I.c-dz*I.s)/I.r,v=(dx*I.s+dz*I.c)/I.r*I.sq,d=Math.hypot(u,v)+wx*.2+fbm(x*.0013+I.seed,z*.0013,3)*.13,s=1-d;if(s>best){best=s;bi=I;}}
 if(best<=0)return -2-70*sm(0,.45,-best);
 const I=bi,m=Math.min(1,best/.85);let h=-2+11*sm(0,.09,best)+I.h*Math.pow(m,1.45)*(.45+.55*ridge(x*.0007,z*.0007))+32*fbm(x*.0025,z*.0025,4)*sm(.03,.22,best);
 if(I.volcano)h-=I.h*.3*sm(.82,.98,best);return h;}
// coarse cached grid (bullets, AI look-ahead, radar map, ocean depth)
const HN=384,HS=2*WORLD*1.2/HN,HO=-WORLD*1.2;export const HGRID=new Float32Array(HN*HN);
for(let j=0;j<HN;j++)for(let i=0;i<HN;i++)HGRID[j*HN+i]=height(HO+(i+.5)*HS,HO+(j+.5)*HS);
export function hAt(x,z){let fx=(x-HO)/HS-.5,fz=(z-HO)/HS-.5;if(fx<0||fz<0||fx>=HN-1||fz>=HN-1)return -70;const i=fx|0,j=fz|0,a=fx-i,b=fz-j,k=j*HN+i;
 return(HGRID[k]*(1-a)+HGRID[k+1]*a)*(1-b)+(HGRID[k+HN]*(1-a)+HGRID[k+HN+1]*a)*b;}
export function slope(x,z,e=12){const hx=height(x+e,z)-height(x-e,z),hz=height(x,z+e)-height(x,z-e);return Math.hypot(hx,hz)/(2*e);}
// find a flat dry spot near (x,z)
export function findFlat(x,z,rad,R=Math.random,minH=4,maxH=160,maxS=.16){for(let k=0;k<400;k++){const a=R()*6.283,d=Math.sqrt(R())*rad*(.3+k/400),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d,h=height(px,pz);if(h>minH&&h<maxH&&slope(px,pz)<maxS)return new V(px,h,pz);}return new V(x,Math.max(2,height(x,z)),z);}

/* ================= tileable noise (textures) ================= */
export function tileNoise(n,oct,seed=1,base=4){const R=rng(seed),out=new Float32Array(n*n);let amp=1,tot=0;
 for(let o=0;o<oct;o++){const g=base<<o,L=new Float32Array(g*g);for(let i=0;i<g*g;i++)L[i]=R();
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const fx=x/n*g,fy=y/n*g,i=fx|0,j=fy|0,a=fx-i,b=fy-j,sa=a*a*(3-2*a),sb=b*b*(3-2*b),i1=(i+1)%g,j1=(j+1)%g;
   out[y*n+x]+=amp*((L[j*g+i]*(1-sa)+L[j*g+i1]*sa)*(1-sb)+(L[j1*g+i]*(1-sa)+L[j1*g+i1]*sa)*sb);}tot+=amp;amp*=.5;}
 for(let i=0;i<n*n;i++)out[i]/=tot;return out;}
function dataTex(arr,n,fn,o={}){const d=new Uint8Array(n*n*4);for(let i=0;i<n*n;i++){const c=fn(arr,i);d[i*4]=c[0];d[i*4+1]=c[1];d[i*4+2]=c[2];d[i*4+3]=c[3]??255;}
 const t=new THREE.DataTexture(d,n,n,THREE.RGBAFormat);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;}
const NZ=tileNoise(256,6,11,4);
export const noiseTex=dataTex(NZ,256,(a,i)=>{const v=a[i]*255|0;return[v,v,v,255];});
const WN=tileNoise(256,5,23,8);
const waveNormals=dataTex(WN,256,(a,i)=>{const n=256,x=i%n,y=i/n|0,s=5.5,hx=(a[y*n+(x+1)%n]-a[y*n+(x+n-1)%n])*s,hy=(a[((y+1)%n)*n+x]-a[((y+n-1)%n)*n+x])*s,l=Math.hypot(hx,hy,1);return[(-hx/l*.5+.5)*255|0,(-hy/l*.5+.5)*255|0,(1/l*.5+.5)*255|0,255];});

/* ================= sky + haze (shared by every material) ================= */
export const SKYU={uSun:{value:new V(.3,.6,.4).normalize()},uZen:{value:new C()},uHor:{value:new C()},uSunCol:{value:new C()},uGround:{value:new C()},uFogD:{value:1/9000},uTime:{value:0},uNoise:{value:noiseTex},uCirrus:{value:.5}};
export const SKY_GLSL=`uniform vec3 uSun,uZen,uHor,uSunCol,uGround;uniform float uFogD;
vec3 skyCol(vec3 d){float h=d.y,t=pow(clamp(h,0.,1.),.42);vec3 c=mix(uHor,uZen,t);c=mix(c,uHor*.82+uGround*.18,smoothstep(0.,-.3,h));
 float sd=max(dot(d,uSun),0.);c+=uSunCol*(pow(sd,5.)*.16+pow(sd,40.)*.3)*(1.-t*.6);c+=uSunCol*pow(sd,3.)*pow(1.-abs(h),10.)*.22;return c;}
float fogAmt(vec3 cp,vec3 wp){float dist=length(wp-cp);float H=1700.,h0=max(cp.y,-20.),h1=max(wp.y,-20.),dh=h1-h0;
 float avg=abs(dh)<1.?exp(-h0/H):H*(exp(-h0/H)-exp(-h1/H))/dh;return 1.-exp(-dist*uFogD*avg);}
vec3 haze(vec3 col,vec3 wp){vec3 d=wp-cameraPosition;return mix(col,skyCol(normalize(d)),fogAmt(cameraPosition,wp));}`;
export const TOD={
 day:{sun:[.42,.62,-.66],zen:[.05,.17,.52],hor:[.44,.6,.82],sun_c:[1.25,1.12,.95],ground:[.18,.22,.26],li:3.3,hemi:[.6,.72,.9],hg:[.28,.3,.26],hi:1.0,fog:1/17000,cirrus:.55,exp:.98},
 morning:{sun:[.75,.26,.34],zen:[.08,.2,.5],hor:[.78,.7,.64],sun_c:[1.5,1.05,.7],ground:[.2,.2,.22],li:2.7,hemi:[.6,.66,.82],hg:[.3,.26,.22],hi:.95,fog:1/14000,cirrus:.7,exp:1.02},
 storm:{sun:[.2,.5,-.84],zen:[.3,.37,.46],hor:[.58,.62,.66],sun_c:[.55,.55,.55],ground:[.16,.18,.2],li:1.4,hemi:[.62,.66,.72],hg:[.24,.25,.26],hi:1.25,fog:1/6200,cirrus:.95,exp:1.08},
 sunset:{sun:[-.86,.09,-.5],zen:[.12,.18,.42],hor:[1.1,.6,.36],sun_c:[1.8,.82,.38],ground:[.16,.13,.14],li:2.3,hemi:[.5,.5,.68],hg:[.3,.2,.16],hi:.8,fog:1/12000,cirrus:.8,exp:1.05},
 dusk:{sun:[.3,.04,.95],zen:[.04,.07,.2],hor:[.5,.36,.42],sun_c:[1.2,.55,.4],ground:[.06,.06,.09],li:1.2,hemi:[.32,.36,.55],hg:[.12,.1,.12],hi:.8,fog:1/11000,cirrus:.6,exp:1.2}};
// patch a built-in material: aerial haze instead of three's fog (+ optional extra fragment code)
export function hazeMat(m,key='h',extra){m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,SKYU);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <fog_vertex>',`#include <fog_vertex>
  #ifdef USE_INSTANCING
  vWP=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
  #else
  vWP=(modelMatrix*vec4(transformed,1.)).xyz;
  #endif`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform sampler2D uNoise;\n'+SKY_GLSL).replace('#include <fog_fragment>','gl_FragColor.rgb=haze(gl_FragColor.rgb,vWP);');
  if(extra)extra(sh);};m.customProgramCacheKey=()=>'haze-'+key;return m;}

export function makeSky(scene){const g=new THREE.SphereGeometry(60000,48,24);
 const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:SKYU,
  vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`varying vec3 vD;uniform float uTime,uCirrus;uniform sampler2D uNoise;${SKY_GLSL}
  void main(){vec3 d=normalize(vD);vec3 c=skyCol(d);float sd=dot(d,uSun);c+=uSunCol*smoothstep(.99955,.9999,sd)*38.;
   if(d.y>.015){vec2 uv=d.xz/(d.y+.06)*.11+vec2(uTime*.0015,uTime*.0007);float n=texture2D(uNoise,uv*vec2(1.,3.2)).r*.65+texture2D(uNoise,uv*2.7+.3).r*.35;
    float k=smoothstep(.52,.78,n)*uCirrus*smoothstep(.015,.25,d.y);vec3 cc=mix(uHor*1.05,uSunCol*.9+uHor*.4,.35+.65*pow(max(sd,0.),3.));c=mix(c,cc,k*.7);}
   gl_FragColor=vec4(c,1.);}`});
 const s=new THREE.Mesh(g,m);s.frustumCulled=false;s.renderOrder=-10;scene.add(s);return s;}
// environment map from the current sky (PBR reflections on paint and glass)
export function skyEnv(R){const s=new THREE.Scene();s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:SKYU,
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec3 vD;${SKY_GLSL}void main(){vec3 d=normalize(vD);vec3 c=d.y<0.?mix(uGround,uHor*.6,exp(d.y*6.)):skyCol(d);c+=uSunCol*pow(max(dot(d,uSun),0.),300.)*30.;gl_FragColor=vec4(c,1.);}`})));
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.03);pm.dispose();return rt;}
export function applyTOD(name,sun,hemi){const T=TOD[name]||TOD.day;SKYU.uSun.value.set(...T.sun).normalize();SKYU.uZen.value.setRGB(...T.zen);SKYU.uHor.value.setRGB(...T.hor);SKYU.uSunCol.value.setRGB(...T.sun_c);SKYU.uGround.value.setRGB(...T.ground);SKYU.uFogD.value=T.fog;SKYU.uCirrus.value=T.cirrus;
 sun.color.setRGB(...T.sun_c).multiplyScalar(1/Math.max(...T.sun_c));sun.intensity=T.li;hemi.color.setRGB(...T.hemi);hemi.groundColor.setRGB(...T.hg);hemi.intensity=T.hi;return T;}

/* ================= ocean ================= */
export function makeOcean(scene){
 // radial grid: dense near the camera, coarse towards the horizon
 const RINGS=110,SEG=160,pos=[],idx=[];pos.push(0,0,0);
 for(let r=1;r<=RINGS;r++){const rad=2*Math.pow(1.088,r)-1.6;for(let s=0;s<SEG;s++){const a=s/SEG*Math.PI*2;pos.push(Math.cos(a)*rad,0,Math.sin(a)*rad);}}
 for(let s=0;s<SEG;s++)idx.push(0,1+(s+1)%SEG,1+s);
 for(let r=1;r<RINGS;r++)for(let s=0;s<SEG;s++){const a=1+(r-1)*SEG+s,b=1+(r-1)*SEG+(s+1)%SEG,c=a+SEG,d=b+SEG;idx.push(a,b,c,b,d,c);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
 // water depth (R) from the height field
 const dn=HN,dep=new Uint8Array(dn*dn*4);for(let i=0;i<dn*dn;i++){const h=HGRID[i];dep[i*4]=Math.max(0,Math.min(255,-h/60*255));dep[i*4+1]=h>0?255:0;dep[i*4+3]=255;}
 const dt=new THREE.DataTexture(dep,dn,dn,THREE.RGBAFormat);dt.magFilter=dt.minFilter=THREE.LinearFilter;dt.needsUpdate=true;
 const U={...SKYU,uWN:{value:waveNormals},uDepth:{value:dt},uDO:{value:HO},uDS:{value:HS*HN},uCam:{value:new V()},uShips:{value:[new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4(),new THREE.Vector4()]},uShipL:{value:[0,0,0,0]},uDetail:{value:1}};
 const m=new THREE.ShaderMaterial({uniforms:U,vertexShader:`uniform vec3 uCam;uniform float uTime;varying vec3 vWP,vN;varying float vFoamW;
  vec3 W(vec2 p,vec2 d,float L,float A,float Q,inout vec3 n){float k=6.2832/L,c=sqrt(9.8/k),f=k*(dot(d,p)-c*uTime);float co=cos(f),si=sin(f);n.x-=d.x*k*A*co;n.z-=d.y*k*A*co;n.y-=Q*k*A*si;return vec3(Q*A*d.x*co,A*si,Q*A*d.y*co);}
  void main(){vec3 p=position+vec3(uCam.x,0.,uCam.z);float dist=length(p.xz-uCam.xz);float fade=1.-smoothstep(600.,2600.,dist+max(0.,uCam.y-200.)*1.5);vec3 n=vec3(0.,1.,0.),o=vec3(0.);
   o+=W(p.xz,normalize(vec2(1.,.35)),95.,.9*fade,.55,n);o+=W(p.xz,normalize(vec2(.6,-.8)),48.,.45*fade,.6,n);o+=W(p.xz,normalize(vec2(-.3,1.)),27.,.25*fade,.55,n);o+=W(p.xz,normalize(vec2(.95,.1)),14.,.12*fade,.5,n);
   p+=o;vFoamW=o.y;vN=normalize(n);vWP=p;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float uTime,uDO,uDS,uDetail;uniform sampler2D uWN,uDepth,uNoise;uniform vec4 uShips[4];uniform float uShipL[4];varying vec3 vWP,vN;varying float vFoamW;${SKY_GLSL}
  void main(){vec3 V=cameraPosition-vWP;float dist=length(V);V/=dist;
   vec2 uv=vWP.xz;vec3 n1=texture2D(uWN,uv/170.+vec2(uTime*.012,uTime*.006)).xzy*2.-1.,n2=texture2D(uWN,uv/53.-vec2(uTime*.018,-uTime*.011)).xzy*2.-1.,n3=texture2D(uWN,uv/1100.+uTime*.002).xzy*2.-1.;
   float df=1.-smoothstep(300.,9000.,dist);vec3 nm=n1*vec3(1.,0.,1.)*(.55+.25*df)+n2*vec3(1.,0.,1.)*.55*df*uDetail+n3*vec3(1.,0.,1.)*.6;
   vec3 n=normalize(vec3(vN.x+nm.x*.42,vN.y*1.,vN.z+nm.z*.42));
   vec2 duv=(vWP.xz-uDO)/uDS;vec4 dd=texture2D(uDepth,duv);float depth=dd.r*60.;
   float fr=.02+.98*pow(1.-max(dot(n,V),0.),5.);
   vec3 R=reflect(-V,n);R.y=abs(R.y);vec3 sky=skyCol(R);
   float sunUp=max(uSun.y,.06);
   vec3 deep=vec3(.004,.028,.07),shallow=vec3(.02,.34,.36),water=mix(shallow,deep,smoothstep(.5,32.,depth));
   water*=(uSunCol*sunUp*1.1+uZen*.6+uHor*.15);
   float sss=max(vFoamW,0.)*.22*max(dot(V,-uSun)+.4,0.);water+=vec3(.02,.15,.13)*sss*uSunCol;
   vec3 c=mix(water,sky,fr*.8);
   vec3 H=normalize(uSun+V);float nh=max(dot(n,H),0.);c+=uSunCol*(pow(nh,900.)*90.+pow(nh,90.)*.9)*smoothstep(-.05,.1,uSun.y);
   // shoreline + wake foam
   float fn=texture2D(uNoise,uv/22.+vec2(uTime*.02,0.)).r*.6+texture2D(uNoise,uv/9.-uTime*.03).r*.4;
   float shore=(1.-smoothstep(.0,2.6,depth+fn*1.2-.3))*smoothstep(.02,.35,depth+.2)*(1.-dd.g*.5);
   float wake=0.;for(int i=0;i<4;i++){if(uShipL[i]<=0.)continue;vec4 s=uShips[i];vec2 rel=vWP.xz-s.xy;vec2 dir=s.zw;float along=-dot(rel,dir),side=abs(dot(rel,vec2(-dir.y,dir.x)));float L=uShipL[i];
    float w=(L*.11+along*.07);float t=smoothstep(-L*.5,-L*.35,along)*(1.-smoothstep(L*4.,L*14.,along));wake+=t*smoothstep(w,w*.35,side)*(.55+.45*fn)*(along<0.?1.4:1.);
    float kel=smoothstep(w*1.6,w*1.2,side)*smoothstep(w*.7,w*1.05,side)*t*.7;wake+=kel*fn;}
   float foam=clamp(shore*smoothstep(.35,.6,fn+shore*.3)+wake*smoothstep(.2,.5,fn),0.,1.)+smoothstep(.9,1.6,vFoamW)*.25*smoothstep(.55,.75,fn);
   c=mix(c,(uSunCol*sunUp+uZen*.5+uHor*.4)*.9,clamp(foam,0.,1.)*(1.-smoothstep(2000.,7000.,dist)));
   float fa=max(fogAmt(cameraPosition,vWP),smoothstep(11000.,20000.,dist));gl_FragColor=vec4(mix(c,skyCol(-V),fa),1.);}`});
 const mesh=new THREE.Mesh(g,m);mesh.frustumCulled=false;mesh.renderOrder=-5;scene.add(mesh);
 return{mesh,U,update(cam){U.uCam.value.set(Math.round(cam.position.x/4)*4,cam.position.y,Math.round(cam.position.z/4)*4);}};}

/* ================= terrain tiles ================= */
const COL={wet:sRGB(.5,.45,.34),sand:sRGB(.86,.78,.58),grass:sRGB(.24,.42,.14),grass2:sRGB(.36,.46,.17),forest:sRGB(.1,.24,.08),dry:sRGB(.47,.43,.27),rock:sRGB(.4,.37,.34),rock2:sRGB(.28,.26,.25),basalt:sRGB(.13,.11,.11)};
export function terrainColor(x,y,z,ny,out){const n=fbm(x*.004,z*.004,3),n2_=fbm(x*.0009+9,z*.0009,2);const c=out;
 if(y<.6)c.copy(COL.wet).lerp(COL.sand,sm(-1.5,.6,y));
 else if(y<5.5+n*3)c.copy(COL.sand);
 else{c.copy(COL.grass).lerp(COL.grass2,sm(-.3,.6,n));c.lerp(COL.forest,sm(.0,.5,n2_)*sm(12,60,y)*(1-sm(500,700,y)));c.lerp(COL.sand,1-sm(5.5,11+n*4,y));c.lerp(COL.dry,sm(380,720,y+n*120));
  const steep=1-sm(.62,.86,ny);c.lerp(n>0?COL.rock:COL.rock2,steep);c.lerp(COL.basalt,sm(900,1150,y+n*80));}return c;}
export function makeTerrain(scene,detail=1){const TILE=1500,seg=[24,48,64][detail],grp=new THREE.Group();scene.add(grp);
 const mat=hazeMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:0,envMapIntensity:.35}),'terrain',sh=>{sh.uniforms.uNoise=SKYU.uNoise;
  sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   {float d1=texture2D(uNoise,vWP.xz/41.).r,d2=texture2D(uNoise,vWP.xz/317.).r,d3=texture2D(uNoise,vWP.xz/9.).r;float dl=length(vWP-cameraPosition);
    diffuseColor.rgb*=mix(.74,1.26,d1)*mix(.82,1.18,d2)*mix(mix(.86,1.14,d3),1.,smoothstep(150.,900.,dl));
    diffuseColor.rgb*=mix(.72,1.,smoothstep(-.5,1.2,vWP.y));}`);});
 const tmp=new C();let tris=0;
 for(let tz=-WORLD*1.15;tz<WORLD*1.15;tz+=TILE)for(let tx=-WORLD*1.15;tx<WORLD*1.15;tx+=TILE){
  let mx=-99;for(let j=0;j<=6;j++)for(let i=0;i<=6;i++)mx=Math.max(mx,hAt(tx+i*TILE/6,tz+j*TILE/6));if(mx<-4)continue;
  const n=seg+1,P=new Float32Array(n*n*3),N=new Float32Array(n*n*3),Cc=new Float32Array(n*n*3),H=new Float32Array((n+2)*(n+2)),st=TILE/seg;
  for(let j=-1;j<=n;j++)for(let i=-1;i<=n;i++)H[(j+1)*(n+2)+i+1]=height(tx+i*st,tz+j*st);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=j*n+i,h=H[(j+1)*(n+2)+i+1],hx=H[(j+1)*(n+2)+i+2]-H[(j+1)*(n+2)+i],hz=H[(j+2)*(n+2)+i+1]-H[j*(n+2)+i+1];
   const nx=-hx,ny=2*st,nz=-hz,l=Math.hypot(nx,ny,nz);const x=tx+i*st,z=tz+j*st;P[k*3]=x;P[k*3+1]=h;P[k*3+2]=z;N[k*3]=nx/l;N[k*3+1]=ny/l;N[k*3+2]=nz/l;
   terrainColor(x,h,z,ny/l,tmp);Cc[k*3]=tmp.r;Cc[k*3+1]=tmp.g;Cc[k*3+2]=tmp.b;}
  const I=[];for(let j=0;j<seg;j++)for(let i=0;i<seg;i++){const a=j*n+i,b=a+1,c=a+n,d=c+1;if(P[a*3+1]<-8&&P[b*3+1]<-8&&P[c*3+1]<-8&&P[d*3+1]<-8)continue;I.push(a,c,b,b,c,d);}
  if(!I.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setAttribute('normal',new THREE.BufferAttribute(N,3));g.setAttribute('color',new THREE.BufferAttribute(Cc,3));g.setIndex(I);g.computeBoundingSphere();g.computeBoundingBox();
  const m=new THREE.Mesh(g,mat);m.receiveShadow=true;grp.add(m);tris+=I.length/3;}
 grp.userData.tris=tris;return grp;}

/* ================= merge helper ================= */
export function merge(list){const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  if(!g.attributes.color){const k=g.attributes.position.count,a=new Float32Array(k*3),cc=c||new C(1,1,1);for(let i=0;i<k;i++){a[i*3]=cc.r;a[i*3+1]=cc.g;a[i*3+2]=cc.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));}return g;});
 let n=0;gs.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=new Float32Array(n*3);let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);if(!g.attributes.normal)g.computeVertexNormals();nor.set(g.attributes.normal.array,o*3);uv.set(g.attributes.uv.array,o*2);col.set(g.attributes.color.array,o*3);o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));r.setAttribute('color',new THREE.BufferAttribute(col,3));r.computeBoundingSphere();return r;}
export const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz,'YXZ')),new V(sx,sy,sz));

/* ================= vegetation + towns ================= */
const avoid=[];export function keepClear(x,z,r){avoid.push([x,z,r]);}
const clear=(x,z)=>!avoid.some(a=>(x-a[0])**2+(z-a[1])**2<a[2]*a[2]);
export function makeFlora(scene,count=5000){const R=rng(99);
 const leaf=sRGB(.16,.34,.1),leaf2=sRGB(.22,.4,.12),pine=sRGB(.09,.22,.1),bark=sRGB(.34,.25,.17),palmL=sRGB(.26,.46,.14);
 const broad=merge([[new THREE.CylinderGeometry(.25,.4,4,5),M4(0,2,0),bark],[new THREE.IcosahedronGeometry(2.6,0),M4(0,5.2,0,0,0,0,1.1,.85,1.1),leaf],[new THREE.IcosahedronGeometry(2,0),M4(1.2,6.4,.5,.4,.3,0),leaf2],[new THREE.IcosahedronGeometry(1.8,0),M4(-1.1,6,-.6,.2,1,0),leaf]]);
 const conifer=merge([[new THREE.CylinderGeometry(.2,.35,3,5),M4(0,1.5,0),bark],[new THREE.ConeGeometry(2.4,4.6,7),M4(0,4.4,0),pine],[new THREE.ConeGeometry(1.8,3.8,7),M4(0,6.8,0),pine],[new THREE.ConeGeometry(1.1,2.8,7),M4(0,8.8,0),pine]]);
 const pl=[[new THREE.CylinderGeometry(.16,.24,3.4,5),M4(0,1.7,0,0,0,.08),bark],[new THREE.CylinderGeometry(.13,.17,3.4,5),M4(.35,4.9,0,0,0,.16),bark]];
 for(let i=0;i<7;i++){const a=i/7*Math.PI*2;pl.push([new THREE.BoxGeometry(.9,.08,4.2),M4(.55+Math.cos(a)*1.7,6.2,Math.sin(a)*1.7,-.42,-a+Math.PI/2,0),palmL]);}
 const palm=merge(pl);
 const mat=hazeMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true,side:THREE.DoubleSide}),'flora');
 const kinds=[{g:broad,list:[]},{g:conifer,list:[]},{g:palm,list:[]}];let tries=0;
 while(kinds.reduce((a,k)=>a+k.list.length,0)<count&&tries++<count*30){const x=(R()*2-1)*WORLD*1.1,z=(R()*2-1)*WORLD*1.1,h=hAt(x,z);if(h<3)continue;const y=height(x,z);if(y<2.5||y>820)continue;if(!clear(x,z))continue;
  const s=slope(x,z,6);if(s>.7)continue;const dens=fbm(x*.0016+3,z*.0016,3);if(dens<-.15+(y<14?-.3:0))continue;
  const k=y<22&&R()<.85?2:y>380||(dens>.35&&R()<.5)?1:0;kinds[k].list.push([x,y-.3,z,.75+R()*.9,R()*6.28]);}
 const out=[];const dummy=new THREE.Object3D(),col=new C();
 for(const k of kinds){if(!k.list.length)continue;const im=new THREE.InstancedMesh(k.g,mat,k.list.length);k.list.forEach((t,i)=>{dummy.position.set(t[0],t[1],t[2]);dummy.rotation.set(0,t[4],0);dummy.scale.setScalar(t[3]*1.6);dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);col.setHSL(.25+R()*.08,.5,.45+R()*.25);im.setColorAt(i,col);});
  im.castShadow=true;im.receiveShadow=true;im.computeBoundingSphere();scene.add(im);out.push(im);}
 return out;}
export function makeTown(scene,cx,cz,rad,n,seed=5){const R=rng(seed),houses=[];
 for(let k=0;k<n*12&&houses.length<n;k++){const a=R()*6.283,d=Math.sqrt(R())*rad,x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d,y=height(x,z);if(y<3||y>70||slope(x,z,8)>.2)continue;
  const w=7+R()*8,dp=7+R()*6,h=4.5+R()*5*(d<rad*.4?2.2:1);if(houses.some(o=>Math.abs(o[0]-x)<(o[3]+w)*.6&&Math.abs(o[2]-z)<(o[4]+dp)*.6))continue;houses.push([x,y,z,w,dp,h,R()*6.28,R()]);}
 const walls=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1).translate(0,.5,0),hazeMat(new THREE.MeshStandardMaterial({roughness:.8}),'town'),houses.length);
 const roofG=new THREE.ConeGeometry(.75,1,4,1).rotateY(Math.PI/4).translate(0,.5,0);roofG.scale(1.32,1,1.32);
 const roofs=new THREE.InstancedMesh(roofG,hazeMat(new THREE.MeshStandardMaterial({roughness:.7,flatShading:true}),'roof'),houses.length);
 const dm=new THREE.Object3D(),wc=[sRGB(.95,.93,.88),sRGB(.92,.86,.74),sRGB(.86,.9,.95),sRGB(.98,.88,.8),sRGB(.85,.82,.8)],rc=[sRGB(.72,.3,.18),sRGB(.62,.24,.16),sRGB(.25,.38,.55),sRGB(.5,.5,.52)];
 houses.forEach((o,i)=>{dm.position.set(o[0],o[1]-1.5,o[2]);dm.rotation.set(0,o[6],0);dm.scale.set(o[3],o[5]+1.5,o[4]);dm.updateMatrix();walls.setMatrixAt(i,dm.matrix);walls.setColorAt(i,wc[o[7]*wc.length|0]);
  dm.position.y=o[1]+o[5];dm.scale.set(o[3],o[5]>9?.4:2.6+o[3]*.15,o[4]);dm.updateMatrix();roofs.setMatrixAt(i,dm.matrix);roofs.setColorAt(i,rc[(o[7]*7|0)%rc.length]);});
 for(const m of[walls,roofs]){m.castShadow=m.receiveShadow=true;m.computeBoundingSphere();scene.add(m);}keepClear(cx,cz,rad);return{houses,walls,roofs};}

/* ================= clouds (lit billboard puffs, sorted, fly-through) ================= */
function puffAtlas(){const s=128,c=document.createElement('canvas');c.width=c.height=s*2;const x=c.getContext('2d'),R=rng(4);
 for(let v=0;v<4;v++){const ox=(v%2)*s,oy=(v>>1)*s;for(let i=0;i<34;i++){const r=s*(.1+R()*.2),a=R()*6.28,d=R()*s*.24,px=ox+s/2+Math.cos(a)*d,py=oy+s/2+Math.sin(a)*d*.8;const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(px,py,r,0,7);x.fill();}}
 const t=new THREE.CanvasTexture(c);t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;return t;}
export class Clouds{constructor(scene,o={}){const R=rng(o.seed||3),n=o.count||60,list=this.list=[],puffs=[];
  for(let i=0;i<n;i++){let x,z;do{x=(R()*2-1)*WORLD*1.5;z=(R()*2-1)*WORLD*1.5;}while(Math.abs(x)<1800&&Math.abs(z-2000)<1800&&R()<.7);
   const base=(o.base||1500)+R()*(o.spread||900),w=350+R()*R()*900*(o.size||1),hgt=w*(.45+R()*.3),cl={x,y:base+hgt*.3,z,rx:w,ry:hgt*.62,rz:w*(.7+R()*.5)};list.push(cl);
   const np=Math.round(10+w/38);for(let k=0;k<np;k++){const a=R()*6.283,d=Math.sqrt(R()),px=x+Math.cos(a)*d*w*.85,pz=z+Math.sin(a)*d*cl.rz*.85,top=1-d;const py=base+R()*hgt*(.25+top*.85);
    const size=(w*.38+R()*w*.35)*(.55+top*.6);puffs.push([px,py,pz,size,R()*4|0,Math.min(1,(py-base)/hgt),0]);}}
  this.n=puffs.length;this.puffs=puffs;const g=new THREE.InstancedBufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));g.setIndex([0,1,2,0,2,3]);
  this.aP=new THREE.InstancedBufferAttribute(new Float32Array(this.n*4),4).setUsage(THREE.DynamicDrawUsage);this.aD=new THREE.InstancedBufferAttribute(new Float32Array(this.n*4),4).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iP',this.aP);g.setAttribute('iD',this.aD);g.instanceCount=this.n;
  this.mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{...SKYU,uTex:{value:puffAtlas()},uDark:{value:o.dark||0}},
   vertexShader:`attribute vec4 iP,iD;varying vec2 vUv;varying vec4 vD;varying vec3 vWP;varying float vFade;
    void main(){vec3 r=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]),u=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);float ang=iD.x*1.7;vec2 q=vec2(cos(ang)*position.x-sin(ang)*position.y,sin(ang)*position.x+cos(ang)*position.y);
     vec3 wp=iP.xyz+(r*q.x+u*q.y)*iP.w;vWP=wp;float d=length(iP.xyz-cameraPosition);vFade=smoothstep(iP.w*.35,iP.w*1.1,d);
     vUv=(position.xy*.5+.5)*.5+vec2(mod(iD.x,2.),floor(iD.x/2.))*.5;vD=iD;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}`,
   fragmentShader:`uniform sampler2D uTex;uniform float uDark;varying vec2 vUv;varying vec4 vD;varying vec3 vWP;varying float vFade;${SKY_GLSL}
    void main(){float a=texture2D(uTex,vUv).a;a=smoothstep(.02,.75,a);if(a<.01)discard;vec3 V=normalize(vWP-cameraPosition);
     float lit=clamp(vD.y*.75+vD.z*.35+.12,0.,1.);float fw=pow(max(dot(V,uSun),0.),6.)*(1.-a)*1.6;
     vec3 amb=uZen*.45+uHor*.55,sh=mix(amb*.85,uHor*.6+uGround*.3,.3)*(1.-uDark*.45),li=uSunCol*(1.15-uDark*.5)+amb*.45;
     vec3 c=mix(sh,li,lit*lit)+uSunCol*fw;gl_FragColor=vec4(haze(c,vWP),a*vFade*.92);}`});
  this.mesh=new THREE.Mesh(g,this.mat);this.mesh.frustumCulled=false;this.mesh.renderOrder=6;scene.add(this.mesh);this.order=[...Array(this.n).keys()];this.dep=new Float32Array(this.n);this.fr=0;this.sunFacing();this.fill();}
 sunFacing(){const s=SKYU.uSun.value;for(const p of this.puffs){const cl=this.list.find(c=>Math.abs(c.x-p[0])<c.rx*1.1&&Math.abs(c.z-p[2])<c.rz*1.1)||{x:p[0],y:p[1],z:p[2],rx:1};const dx=(p[0]-cl.x)/cl.rx,dy=(p[1]-cl.y)/(cl.ry||1),dz=(p[2]-cl.z)/(cl.rz||1);p[6]=Math.max(0,(dx*s.x+dy*s.y+dz*s.z)*.8);}}
 fill(){const P=this.aP.array,D=this.aD.array;this.order.forEach((k,i)=>{const p=this.puffs[k];P[i*4]=p[0];P[i*4+1]=p[1];P[i*4+2]=p[2];P[i*4+3]=p[3];D[i*4]=p[4];D[i*4+1]=p[5];D[i*4+2]=p[6];});this.aP.needsUpdate=this.aD.needsUpdate=true;}
 update(cam){if(this.fr++%3)return;const c=cam.position,dep=this.dep;for(let i=0;i<this.n;i++){const p=this.puffs[i];dep[i]=(p[0]-c.x)**2+(p[1]-c.y)**2+(p[2]-c.z)**2;}this.order.sort((a,b)=>dep[b]-dep[a]);this.fill();}
 density(p){let m=0;for(const c of this.list){const dx=(p.x-c.x)/c.rx,dy=(p.y-c.y)/c.ry,dz=(p.z-c.z)/c.rz,d=dx*dx+dy*dy+dz*dz;if(d<1)m=Math.max(m,1-d);}return m;}
 dispose(scene){scene.remove(this.mesh);this.mesh.geometry.dispose();this.mat.dispose();}}

/* ================= ships ================= */
function hullShape(L,B,bow=.28,stern=.06){const s=new THREE.Shape();s.moveTo(-B/2,L/2);s.lineTo(-B/2,-L/2+L*bow);s.quadraticCurveTo(-B*.42,-L/2+L*.04,0,-L/2);s.quadraticCurveTo(B*.42,-L/2+L*.04,B/2,-L/2+L*bow);s.lineTo(B/2,L/2-L*stern);s.lineTo(B*.4,L/2);s.closePath();return s;}
const greyM=()=>hazeMat(new THREE.MeshStandardMaterial({color:0x7d858c,roughness:.6,metalness:.35}),'ship');
function deckTex(){const c=document.createElement('canvas');c.width=256;c.height=1024;const x=c.getContext('2d');x.fillStyle='#3a3d40';x.fillRect(0,0,256,1024);
 for(let i=0;i<5000;i++){x.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},.035)`;x.fillRect(Math.random()*256,Math.random()*1024,3,2);}
 for(let i=0;i<60;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.15})`;x.fillRect(80+Math.random()*90,Math.random()*1024,2+Math.random()*4,30+Math.random()*80);}
 x.save();x.translate(150,1000);x.rotate(-.16);x.strokeStyle='#e8e4d0';x.lineWidth=3;x.strokeRect(-46,-760,92,760);x.setLineDash([22,18]);x.beginPath();x.moveTo(0,-760);x.lineTo(0,0);x.stroke();x.setLineDash([]);
 x.strokeStyle='#e0b020';x.lineWidth=4;for(let i=0;i<4;i++){x.beginPath();x.moveTo(-42,-120-i*26);x.lineTo(42,-120-i*26);x.stroke();}x.fillStyle='#e8e4d0';x.font='bold 80px sans-serif';x.textAlign='center';x.fillText('07',0,-20);x.restore();
 x.strokeStyle='#e0b020';x.lineWidth=3;x.beginPath();x.moveTo(190,0);x.lineTo(190,330);x.moveTo(150,0);x.lineTo(150,300);x.stroke();
 x.strokeStyle='#dcdcd0';x.setLineDash([12,10]);x.strokeRect(196,520,50,70);x.strokeRect(196,640,50,70);x.setLineDash([]);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
export function makeCarrier(){const g=new THREE.Group(),L=300,B=44;const hull=new THREE.ExtrudeGeometry(hullShape(L,B*.78,.3,.02),{depth:19,bevelEnabled:false});hull.rotateX(Math.PI/2);hull.translate(0,DECK_Y-1.2,0);
 const hm=new THREE.Mesh(hull,hazeMat(new THREE.MeshStandardMaterial({color:0x5f676e,roughness:.6,metalness:.3}),'hull'));hm.castShadow=hm.receiveShadow=true;g.add(hm);
 const boot=new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape(L*.97,B*.76,.3,.02),{depth:3,bevelEnabled:false}).rotateX(Math.PI/2).translate(0,1.2,0),hazeMat(new THREE.MeshStandardMaterial({color:0x5a2222,roughness:.8}),'boot'));g.add(boot);
 // flight deck (slab wider than the hull, overhanging to port for the angled deck)
 const ds=new THREE.Shape();ds.moveTo(-B*.42,150);ds.lineTo(-B*.5,40);ds.lineTo(-B*.7,-20);ds.lineTo(-B*.52,-90);ds.lineTo(-B*.3,-150);ds.lineTo(B*.3,-150);ds.lineTo(B*.42,-60);ds.lineTo(B*.42,150);ds.closePath();
 const dg=new THREE.ExtrudeGeometry(ds,{depth:1.2,bevelEnabled:false});dg.rotateX(Math.PI/2);dg.translate(0,DECK_Y,0);
 {const p=dg.attributes.position,uv=dg.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+B*.75)/(B*1.25),1-(p.getZ(i)+150)/300);}
 const deck=new THREE.Mesh(dg,hazeMat(new THREE.MeshStandardMaterial({map:deckTex(),roughness:.85,metalness:.1}),'deck'));deck.receiveShadow=true;deck.castShadow=true;g.add(deck);
 const gm=greyM(),dark=hazeMat(new THREE.MeshStandardMaterial({color:0x2a2e33,roughness:.5,metalness:.4}),'dk'),win=new THREE.MeshStandardMaterial({color:0x10161c,emissive:0x2a3a44,roughness:.1,metalness:.8});
 const isl=new THREE.Group();isl.position.set(B*.36,DECK_Y,25);g.add(isl);
 [[0,7,0,9,14,34],[0,17,-2,8,8,22],[0,24,-4,6.5,6,12]].forEach(([x,y,z,w,h,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),gm);m.position.set(x,y,z);m.castShadow=true;isl.add(m);});
 const wb=new THREE.Mesh(new THREE.BoxGeometry(8.2,1.6,22.2),win);wb.position.set(0,18.5,-2);isl.add(wb);
 const mast=new THREE.Mesh(new THREE.CylinderGeometry(.5,.8,22,6),dark);mast.position.set(0,38,-4);isl.add(mast);
 const radar=new THREE.Mesh(new THREE.BoxGeometry(9,2.5,.5),dark);radar.position.set(0,44,-4);isl.add(radar);g.userData.radar=radar;
 const dish=new THREE.Mesh(new THREE.SphereGeometry(2.2,12,8,0,Math.PI*2,0,Math.PI/2),gm);dish.position.set(0,31,-12);isl.add(dish);
 // CIWS mounts
 const ciws=[];for(const [x,z] of[[-B*.46,-120],[B*.4,-125],[-B*.55,100],[B*.42,120]]){const t=new THREE.Group();t.position.set(x,DECK_Y-2,z);const b=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.8,2.5,10),gm);const d=new THREE.Mesh(new THREE.SphereGeometry(1.4,12,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xe8e8e8,roughness:.6}));d.position.y=1.2;const br=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,3,6).rotateX(Math.PI/2),dark);br.position.set(0,1.6,-1.6);t.add(b,d,br);g.add(t);ciws.push(t);}
 g.userData.ciws=ciws;
 // parked aircraft silhouettes near the bow
 const pm=hazeMat(new THREE.MeshStandardMaterial({color:0x56606c,roughness:.5,metalness:.4}),'parked');
 for(let i=0;i<5;i++){const pg=merge([[new THREE.CylinderGeometry(.6,.9,13,8).rotateX(Math.PI/2),null],[new THREE.BoxGeometry(5,.3,4),M4(0,0,1.5)],[new THREE.BoxGeometry(3,.25,2),M4(0,0,5.6)],[new THREE.BoxGeometry(.2,2.4,2.4),M4(0,1.2,5.4)]]);
  const p=new THREE.Mesh(pg,pm);p.position.set(B*.25-i*.6,DECK_Y+1.6,-128+i*15);p.rotation.y=-2.2;p.castShadow=true;g.add(p);}
 // landing light strip
 const lights=new THREE.Mesh(new THREE.BoxGeometry(.6,.3,120),new THREE.MeshBasicMaterial({color:new C(2,1.6,.6)}));lights.position.set(-6,DECK_Y+.65,70);lights.rotation.y=.16;g.add(lights);
 g.userData.L=L;g.userData.B=B;return g;}
export function onDeck(lx,lz){if(lz<-150||lz>150)return false;const w=lz>-20&&lz<40?30:lz<-90?13:22;return lx>-w&&lx<18;}
export function makeDestroyer(enemy=true){const g=new THREE.Group(),L=120,B=14;const hull=new THREE.ExtrudeGeometry(hullShape(L,B,.34,.04),{depth:9,bevelEnabled:false}).rotateX(Math.PI/2).translate(0,7,0);
 const col=enemy?0x5c5a52:0x6d757c;const hm=new THREE.Mesh(hull,hazeMat(new THREE.MeshStandardMaterial({color:col,roughness:.6,metalness:.3}),'dd'));hm.castShadow=true;g.add(hm);
 const gm=hazeMat(new THREE.MeshStandardMaterial({color:enemy?0x6b6960:0x7e868e,roughness:.55,metalness:.3}),'dd2');
 [[0,10,8,9,6,26],[0,15,4,7,5,12],[0,12,-24,6,4,10]].forEach(([x,y,z,w,h,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),gm);m.position.set(x,y,z);m.castShadow=true;g.add(m);});
 const fun=new THREE.Mesh(new THREE.CylinderGeometry(2,2.4,8,10),gm);fun.position.set(0,17,-6);g.add(fun);
 const mast=new THREE.Mesh(new THREE.CylinderGeometry(.3,.4,14,5),gm);mast.position.set(0,24,6);g.add(mast);
 const tur=[];for(const z of[-40,34]){const t=new THREE.Group();t.position.set(0,9,z);const b=new THREE.Mesh(new THREE.CylinderGeometry(2.6,3,2.2,10),gm);const br=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,7,6).rotateX(Math.PI/2),gm);br.position.set(0,.6,-4);t.add(b,br);g.add(t);tur.push(t);}
 g.userData.turrets=tur;g.userData.L=L;return g;}

/* ================= ground sites ================= */
const siteM={olive:hazeMat(new THREE.MeshStandardMaterial({color:0x4d5236,roughness:.8,metalness:.15}),'site'),conc:hazeMat(new THREE.MeshStandardMaterial({color:0x8a877e,roughness:.9}),'conc'),
 metal:hazeMat(new THREE.MeshStandardMaterial({color:0x5c6064,roughness:.45,metalness:.6}),'metal'),tank:hazeMat(new THREE.MeshStandardMaterial({color:0xb8b2a2,roughness:.5,metalness:.4}),'tank'),
 red:new THREE.MeshStandardMaterial({color:0x8a1a10,emissive:0x400000,roughness:.5})};
export function makeSite(kind){const g=new THREE.Group();const add=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
 add(new THREE.CylinderGeometry(kind==='fuel'?16:11,kind==='fuel'?17:12,1.2,16),siteM.conc,0,.3,0);
 if(kind==='aa'){for(let i=0;i<8;i++){const a=i/8*6.28;add(new THREE.BoxGeometry(3,1.6,1.4),siteM.olive,Math.cos(a)*8.5,.9,Math.sin(a)*8.5).rotation.y=-a;}
  const t=new THREE.Group();t.position.y=1.6;g.add(t);const b=new THREE.Mesh(new THREE.CylinderGeometry(2.2,2.6,1.6,10),siteM.olive);b.castShadow=true;t.add(b);
  const p=new THREE.Group();p.position.y=1.2;t.add(p);for(const s of[-.6,.6]){const br=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,6,6).rotateX(Math.PI/2),siteM.metal);br.position.set(s,0,-3);p.add(br);}
  const sh=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.4,2.4),siteM.olive);p.add(sh);g.userData.turret=t;g.userData.pitch=p;}
 else if(kind==='sam'){const t=new THREE.Group();t.position.y=1;g.add(t);add(new THREE.BoxGeometry(5,1.6,8),siteM.olive,0,1.6,0);t.add(new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.6,1.4,8),siteM.olive));const p=new THREE.Group();p.position.y=2.2;t.add(p);
  for(const s of[-1,1])for(const u of[0,1]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,7,8).rotateX(Math.PI/2),siteM.tank);m.position.set(s*1.1,u*1,-1);p.add(m);const tip=new THREE.Mesh(new THREE.ConeGeometry(.42,1.2,8).rotateX(-Math.PI/2),siteM.red);tip.position.set(s*1.1,u*1,-5.1);p.add(tip);}
  p.rotation.x=.5;g.userData.turret=t;g.userData.pitch=p;}
 else if(kind==='radar'){add(new THREE.BoxGeometry(6,4,6),siteM.conc,0,2.5,0);add(new THREE.CylinderGeometry(.5,.7,8,6),siteM.metal,0,8,0);const d=new THREE.Group();d.position.y=12;g.add(d);
  const dish=new THREE.Mesh(new THREE.SphereGeometry(5,16,8,0,Math.PI,0,Math.PI/2).rotateX(-Math.PI/2).scale(1,.55,.4),new THREE.MeshStandardMaterial({color:0xd8d8d0,roughness:.5,metalness:.3,side:THREE.DoubleSide}));d.add(dish);g.userData.spin=d;}
 else if(kind==='fuel'){for(const [x,z] of[[-6,-5],[6,-5],[0,6]]){add(new THREE.CylinderGeometry(4.6,4.6,7,18),siteM.tank,x,4.2,z);add(new THREE.CylinderGeometry(4.6,4.6,.6,18),siteM.metal,x,7.9,z);}}
 else if(kind==='hangar'){const h=new THREE.CylinderGeometry(10,10,26,14,1,false,0,Math.PI).rotateZ(Math.PI/2).rotateY(Math.PI/2);add(h,siteM.metal,0,.6,0).scale.set(1,.85,1);add(new THREE.BoxGeometry(16,8,.5),siteM.olive,0,4,-13);}
 else if(kind==='bunker'){add(new THREE.BoxGeometry(14,5,10),siteM.conc,0,2.5,0);add(new THREE.BoxGeometry(6,1.2,.3),new THREE.MeshBasicMaterial({color:0x050505}),0,3,-5.1);}
 return g;}
