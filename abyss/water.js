// ABYSS DIVER — water rendering: depth fog, caustics, sky dome, surface, god rays, particulate, bubbles, lens pass.
import * as THREE from '../vendor/three.module.min.js';
import {mulberry,fbmField,normalTex,canvasTex} from './util.js';

/* caustic web: tileable, domain-warped Voronoi cell borders (F2-F1). Two scrolling copies are min-combined in the shader. */
function causticTex(){const N=256,R=mulberry(311),P=[];for(let i=0;i<26;i++)P.push([R(),R()]);
 return canvasTex(N,N,(x,w,h)=>{const im=x.createImageData(w,h);for(let j=0;j<h;j++)for(let i=0;i<w;i++){let u=i/w,v=j/h;
  u+=Math.sin(v*Math.PI*2*2+Math.cos(u*Math.PI*2))*.035;v+=Math.sin(u*Math.PI*2*3)*.03;
  let f1=9,f2=9;for(const[px,py]of P){let dx=Math.abs(u-px),dy=Math.abs(v-py);dx=Math.min(dx,1-dx);dy=Math.min(dy,1-dy);const d=Math.sqrt(dx*dx+dy*dy);if(d<f1){f2=f1;f1=d;}else if(d<f2)f2=d;}
  const e=f2-f1;const k=Math.pow(Math.max(0,1-e/.075),3)*.9+Math.pow(Math.max(0,1-e/.022),2)*.6;const o=(j*w+i)*4;im.data[o]=im.data[o+1]=im.data[o+2]=Math.min(255,k*200);im.data[o+3]=255;}
  x.putImageData(im,0,0);},{srgb:false});}
/* small ripple normal map for the sea surface */
function rippleTex(){const H=fbmField(128,128,4,57);return normalTex(128,128,H,6);}
export const TEX={caus:causticTex(),ripple:rippleTex()};

export const U={uTime:{value:0},uSun:{value:1},uCaus:{value:1},uCamY:{value:0},
 // per-channel extinction of downwelling light (1/m): red dies first, then green; blue survives deepest
 uKd:{value:new THREE.Vector3(.042,.018,.0115)},tCaus:{value:null},uAmb:{value:new THREE.Color(.004,.012,.022)},uBump:{value:1}};

/* ---------- underwater fog: colour depends on view direction and on fragment depth ----------
   scene.fog is a THREE.Fog whose `near` is the exp2 density and `far` is 1 underwater / 0 above. */
export const WATER_FN=`
vec3 uwCol(vec3 fc,float dy,float uw){float up=smoothstep(-.95,.9,dy);vec3 c=fc*mix(.22,1.28,up*up*(3.-2.*up));
 c+=fc*vec3(.85,1.,1.)*1.6*pow(max(dy,0.),4.)*uw;return mix(fc,c,uw);}`;
export function installWaterFog(){const C=THREE.ShaderChunk;
 C.fog_pars_vertex='#ifdef USE_FOG\n varying vec3 vFogView;\n#endif';
 C.fog_vertex='#ifdef USE_FOG\n vFogView=mvPosition.xyz;\n#endif';
 C.fog_pars_fragment='#ifdef USE_FOG\n uniform vec3 fogColor;uniform float fogNear;uniform float fogFar;varying vec3 vFogView;'+WATER_FN+'\n#endif';
 C.fog_fragment=`#ifdef USE_FOG
 vec3 fwd=(vec4(vFogView,0.)*viewMatrix).xyz;float fdl=length(fwd);vec3 fdir=fwd/max(fdl,1e-4);
 float fyw=cameraPosition.y+fwd.y;
 float absorb=mix(1.,clamp(exp((fyw-cameraPosition.y)*.0075),.42,1.22),fogFar);
 gl_FragColor.rgb*=absorb*mix(vec3(1.),exp(-vec3(.085,.03,.016)*fdl),fogFar);
 float fdd=fogNear*fdl;float fogFactor=1.-exp(-fdd*fdd);
 gl_FragColor.rgb=mix(gl_FragColor.rgb,uwCol(fogColor,fdir.y,fogFar),fogFactor);
#endif`;}

/* ---------- caustics + vertex animation injected into standard materials ---------- */
const CAUS=`float caus(vec2 p,float t){vec2 i=p;float c=1.;float inten=.005;for(int n=0;n<4;n++){float tt=t*(1.-(3.5/float(n+1)));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));vec2 dv=vec2(sin(i.x+tt),cos(i.y+tt));dv=sign(dv)*max(abs(dv),vec2(1e-3));c+=1./max(length(vec2(p.x/(dv.x/inten),p.y/(dv.y/inten))),1e-3);}c/=4.;c=1.17-pow(max(c,0.),1.4);return clamp(pow(abs(c),8.),0.,2.5);}`;
/* bump from a scalar height field (same maths as three's perturbNormalArb, without needing a bumpMap) */
const BUMPF=`vec3 wBump(vec3 surf_pos,vec3 surf_norm,float h,float fd){vec3 dpx=dFdx(surf_pos),dpy=dFdy(surf_pos);float hx=dFdx(h),hy=dFdy(h);vec3 r1=cross(dpy,surf_norm),r2=cross(surf_norm,dpx);float det=dot(dpx,r1)*fd;vec3 grad=sign(det)*(hx*r1+hy*r2);return normalize(abs(det)*surf_norm-grad);}`;
const LIGHTS=THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );\n\t\tdirectLight.color*=wSunK;');
// o: {caus:strength, vert:'glsl after begin_vertex (has transformed, position, iph, uTime)', emis:'glsl after emissivemap (totalEmissiveRadiance)',
//     bump:'glsl that sets float bh (detail height, ~0..1) from vWP/vWN', bumpS:strength, uniforms:{}, noAbs:skip light absorption}
export function wmat(m,o={}){const cs=o.caus??1;m.userData.w=1;m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U,o.uniforms||{});
 let v=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;varying float vIph;uniform float uTime;'+(o.vpars||''))
  .replace('#include <begin_vertex>',`#include <begin_vertex>
  float iph=0.;
  #ifdef USE_INSTANCING
  iph=instanceMatrix[3].x*.37+instanceMatrix[3].z*.23+instanceMatrix[3].y*.11;
  #endif
  vIph=iph;
  ${o.vert||''}`)
  .replace('#include <project_vertex>',`#include <project_vertex>
  vec4 wq=vec4(transformed,1.);vec3 wn=objectNormal;
  #ifdef USE_INSTANCING
  wq=instanceMatrix*wq;wn=mat3(instanceMatrix)*wn;
  #endif
  vWP=(modelMatrix*wq).xyz;vWN=normalize(mat3(modelMatrix)*wn);`);
 sh.vertexShader=v;
 let f=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;varying float vIph;uniform float uTime,uSun,uCaus,uBump;uniform vec3 uKd,uAmb;uniform sampler2D tCaus;'+CAUS+BUMPF+(o.fpars||''));
 if(o.diffuse)f=f.replace('#include <color_fragment>','#include <color_fragment>\n'+o.diffuse);
 if(o.bump)f=f.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  {float bh=0.;${o.bump}
  float bfade=smoothstep(60.,8.,length(vViewPosition))*uBump;normal=wBump(-vViewPosition,normal,bh*${(o.bumpS??1).toFixed(3)}*bfade,faceDirection);}`);
 if(o.emis||o.rim)f=f.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n'+(o.emis||'')+(o.rim?`totalEmissiveRadiance+=diffuseColor.rgb*pow(1.-abs(dot(normal,normalize(vViewPosition))),2.2)*${o.rim.toFixed(2)}*(.35+.65*uSun);`:''));
 // sunlight: per-channel absorption by the fragment's own depth, focused into caustics, shadowed by the sun's shadow map
 const ab=o.noAbs?'vec3(1.)':'exp(-uKd*max(-vWP.y,0.))';
 f=f.replace('#include <lights_fragment_begin>',`vec3 wDown=${ab};
  float wcz=${cs>0?'min(texture2D(tCaus,vWP.xz*.16+vec2(vWP.y*.05)+vec2(uTime*.023,uTime*.011)).r,texture2D(tCaus,vec2(vWP.x*.6-vWP.z*.8,vWP.x*.8+vWP.z*.6)*.125-vec2(uTime*.017,-uTime*.02)).r)*3.2':'1.'};
  float wcf=${cs>0?`exp(min(vWP.y,0.)*.016)*smoothstep(70.,15.,length(vViewPosition))*uCaus*${cs.toFixed(2)}`:'0.'};
  vec3 wSunK=wDown*mix(1.,.3+min(wcz,2.6)*1.6,clamp(wcf,0.,1.));
  ${LIGHTS}`);
 f=f.replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
  {vec3 wa=${o.noAbs?'vec3(1.)':'wDown*wDown*.6+wDown*.4'};irradiance=irradiance*wa+uAmb;
  #if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
  radiance*=wa;
  #endif
  #if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
  iblIrradiance*=wa;
  #endif
  }`);
 sh.fragmentShader=f;};m.customProgramCacheKey=()=>'w2'+cs+(o.rim||0)+(o.key||'')+(o.vert||'').length+(o.emis||'').length+(o.diffuse||'').length+(o.bump||'').length+(o.noAbs?'n':'');
 m.userData.wvert=o.vert||'';m.userData.wvpars=o.vpars||'';m.userData.wuni=o.uniforms||{};return m;}
/* depth material for shadow casting that repeats a wmat vertex animation (kelp sway, fins) */
export function depthFor(m){const d=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:m.map||null,alphaTest:m.alphaTest||0});const vv=m.userData.wvert||'';
 if(vv){d.onBeforeCompile=sh=>{sh.uniforms.uTime=U.uTime;Object.assign(sh.uniforms,m.userData.wuni||{});sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;'+(m.userData.wvpars||'')).replace('#include <begin_vertex>',`#include <begin_vertex>
  float iph=0.;
  #ifdef USE_INSTANCING
  iph=instanceMatrix[3].x*.37+instanceMatrix[3].z*.23+instanceMatrix[3].y*.11;
  #endif
  ${vv}`);};d.customProgramCacheKey=()=>'wd'+vv.length+vv.slice(0,40);}
 return d;}
export function caster(mesh,on=true){mesh.castShadow=on;if(on&&mesh.material&&mesh.material.userData&&mesh.material.userData.wvert&&!mesh.customDepthMaterial)mesh.customDepthMaterial=depthFor(mesh.material);return mesh;}

/* ---------- background dome (matches the fog colour per view direction) ---------- */
export function makeDome(){const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{fc:{value:new THREE.Color()},uw:{value:1},uTime:U.uTime,sunDir:{value:new THREE.Vector3(.48,1,.3).normalize()}},
 vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform vec3 fc,sunDir;uniform float uw,uTime;varying vec3 vD;${WATER_FN}
 void main(){vec3 d=normalize(vD);vec3 c=uwCol(fc,d.y,uw);float sd=max(dot(d,sunDir),0.);float s=(pow(sd,18.)*1.4+pow(sd,90.)*1.6)*uw;c+=fc*vec3(.9,1.,1.)*s;gl_FragColor=vec4(c,1.);}`});
 const d=new THREE.Mesh(new THREE.SphereGeometry(300,32,16),m);d.frustumCulled=false;d.renderOrder=-10;return d;}

/* ---------- sea surface: wave normals, Snell's window + total internal reflection from below, Fresnel sky from above ---------- */
export const SUN_DIR=new THREE.Vector3(.48,1,.3).normalize();
export function makeSurface(){const m=new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:false,fog:false,uniforms:{tRip:{value:TEX.ripple},uTime:U.uTime,fc:{value:new THREE.Color()},dens:{value:.02},sky:{value:new THREE.Color(0x9fd4f0)},sunDir:{value:SUN_DIR},uQ:{value:1}},
 vertexShader:`varying vec3 vW;uniform float uTime;void main(){vec3 p=position;vec4 w=modelMatrix*vec4(p,1.);
  w.y+=sin(w.x*.16+uTime*.9)*.22+cos(w.z*.21+uTime*1.15)*.18+sin((w.x+w.z)*.09+uTime*.6)*.25;vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`varying vec3 vW;uniform float uTime,dens,uQ;uniform vec3 fc,sky,sunDir;uniform sampler2D tRip;${WATER_FN}
 // analytic slope of a sum of directional waves -> surface normal
 vec3 wn(vec2 p){vec2 g=vec2(0.);float t=uTime;
  vec2 d1=normalize(vec2(1.,.3)),d2=normalize(vec2(-.4,1.)),d3=normalize(vec2(.7,-.8)),d4=normalize(vec2(-1.,-.2));
  g+=d1*cos(dot(p,d1)*.16+t*.9)*.16*.22; g+=d2*cos(dot(p,d2)*.43+t*1.4)*.43*.09;
  g+=d3*cos(dot(p,d3)*1.1+t*2.1)*1.1*.035; g+=d4*cos(dot(p,d4)*2.3+t*2.9)*2.3*.016;
  vec3 r1=texture2D(tRip,p*.045+vec2(t*.012,t*.008)).xyz*2.-1.,r2=texture2D(tRip,p*.083-vec2(t*.01,-t*.014)).xyz*2.-1.;g+=(r1.xy+r2.xy)*.15;
  return normalize(vec3(-g.x*1.2,1.,-g.y*1.2));}
 void main(){vec3 v=vW-cameraPosition;float dl=length(v);vec3 dir=v/dl;float fadeN=smoothstep(140.,10.,dl);
  vec3 N=normalize(mix(vec3(0.,1.,0.),wn(vW.xz),fadeN));
  if(cameraPosition.y<vW.y){
   vec3 Nd=-N;vec3 rf=refract(dir,Nd,1.333);
   vec3 rl=reflect(dir,Nd);vec3 deep=uwCol(fc,rl.y,1.)*.75;
   vec3 c;
   if(dot(rf,rf)<.01){ // total internal reflection: a mirror of the dark water below, streaked by the waves
    float gl=clamp(1.-abs(N.x*5.+N.z*4.),0.,1.);c=mix(deep*.9,fc*1.6+vec3(.02,.05,.06),.35+.25*gl);}
   else{float cosT=max(dot(-Nd,dir),0.);float F=.02+.98*pow(1.-cosT,5.);F=clamp(F,0.,1.);
    float up=clamp(rf.y,0.,1.);vec3 skyc=mix(vec3(.5,.72,.82),vec3(.16,.4,.68),pow(up,1.4))*(.78+.5*clamp((N.x*1.3+N.z)*6.,-.5,.6));
    float sd=max(dot(rf,sunDir),0.);skyc+=vec3(1.,.95,.82)*(pow(sd,600.)*6.+pow(sd,40.)*.6+pow(sd,6.)*.12);
    // window rim brightens where the window meets the mirror
    float rim=smoothstep(.2,.0,length(rf.xz)-.85)*smoothstep(.85,1.05,length(rf.xz)+.2);
    c=mix(skyc*.8,deep,F)+fc*rim*.5;}
   float fd=dens*dl;float ff=1.-exp(-fd*fd*.35);c=mix(c,uwCol(fc,dir.y,1.),ff);gl_FragColor=vec4(c,1.);}
  else{vec3 r=reflect(dir,N);float fr=.02+.98*pow(1.-max(-dir.y*N.y,0.),5.);vec3 deepc=vec3(.01,.12,.17)+fc*.12;
   vec3 rs=mix(sky,vec3(.25,.48,.78),clamp(r.y,0.,1.));float sp=pow(max(dot(r,sunDir),0.),220.)*6.;
   vec3 c=mix(deepc,rs,clamp(fr,0.,1.))+vec3(1.,.95,.85)*sp;float ff=1.-exp(-dl*.004);c=mix(c,sky,ff);gl_FragColor=vec4(c,.97);}}`});
 const s=new THREE.Mesh(new THREE.PlaneGeometry(700,700,96,96).rotateX(-Math.PI/2),m);s.frustumCulled=false;return s;}

/* ---------- god rays: billboarded shafts that wrap around the camera ---------- */
export function makeRays(n=56){const g=new THREE.PlaneGeometry(1,1,1,8);g.translate(0,-.5,0);
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,side:THREE.DoubleSide,uniforms:{uTime:U.uTime,uI:{value:1},uCam:{value:new THREE.Vector3()},col:{value:new THREE.Color(.6,.92,1)}},
  vertexShader:`uniform vec3 uCam;uniform float uTime;varying vec2 vUv;varying float vF;varying float vS;
  void main(){vUv=uv;vec3 c=instanceMatrix[3].xyz;float w=length(instanceMatrix[0].xyz),h=length(instanceMatrix[1].xyz);vS=instanceMatrix[2].x;
   vec3 to=uCam-c;to.y=0.;vec3 rt=normalize(vec3(to.z,0.,-to.x)+1e-4);vec3 p=c+rt*position.x*w+vec3(.48,1.,.3)*position.y*h;
   float d=length(uCam.xz-p.xz);vF=smoothstep(4.,16.,d)*smoothstep(150.,70.,d);
   gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
  fragmentShader:`uniform float uTime,uI;uniform vec3 col;varying vec2 vUv;varying float vF;varying float vS;
  void main(){float x=vUv.x;float e=smoothstep(0.,.35,x)*smoothstep(1.,.65,x);float st=.55+.45*sin(x*14.+vS*7.+uTime*.6)*sin(x*5.-uTime*.3+vS);
   float fl=.7+.3*sin(uTime*(.6+fract(vS)*.8)+vS*9.);float a=pow(vUv.y,1.4)*e*st*fl*vF*uI*.15;gl_FragColor=vec4(col*a,1.);}`});
 const im=new THREE.InstancedMesh(g,m,n);im.frustumCulled=false;const o=new THREE.Object3D();const data=[];
 for(let i=0;i<n;i++){data.push({ox:Math.random()*160,oz:Math.random()*160,w:3+Math.random()*9,h:60+Math.random()*50,s:Math.random()*10});}
 im.userData.update=(cam)=>{m.uniforms.uCam.value.copy(cam.position);for(let i=0;i<n;i++){const d=data[i];const gx=Math.round((cam.position.x-d.ox)/160)*160+d.ox,gz=Math.round((cam.position.z-d.oz)/160)*160+d.oz;
  o.position.set(gx,-.5,gz);o.rotation.set(0,0,0);o.scale.set(d.w,d.h,1);o.updateMatrix();o.matrix.elements[8]=d.s;im.setMatrixAt(i,o.matrix);}im.instanceMatrix.needsUpdate=true;};
 im.userData.mat=m;return im;}

/* ---------- marine snow (soft drifting particulate) ---------- */
export function makeSnow(n=2600){const p=new Float32Array(n*3),s=new Float32Array(n);for(let i=0;i<n;i++){p[i*3]=Math.random()*44;p[i*3+1]=Math.random()*44;p[i*3+2]=Math.random()*44;s[i]=Math.random();}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('sd',new THREE.BufferAttribute(s,1));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{uTime:U.uTime,uCam:{value:new THREE.Vector3()},uCol:{value:new THREE.Color()},uLamp:{value:0},uA:{value:1},uScale:{value:500}},
  vertexShader:`attribute float sd;uniform float uTime,uLamp,uScale;uniform vec3 uCam;varying float vA;varying float vL;
  void main(){vec3 p=position+vec3(sin(uTime*.21+sd*30.)*.6,-uTime*(.15+sd*.2),cos(uTime*.17+sd*20.)*.6);p=uCam+mod(p-uCam+22.,44.)-22.;
   vec4 mv=modelViewMatrix*vec4(p,1.);float d=-mv.z;vA=smoothstep(.4,1.4,d)*smoothstep(22.,8.,d);vL=uLamp*smoothstep(14.,2.,d)*smoothstep(.0,.6,-mv.z/max(length(mv.xyz),.01));
   gl_PointSize=clamp(uScale*(.03+sd*.035)/d,1.,7.);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform vec3 uCol;uniform float uA;varying float vA;varying float vL;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;float a=smoothstep(.5,.1,r)*vA*uA;gl_FragColor=vec4((uCol*1.6+vec3(.9,.95,1.)*vL)*a,a*.6);}`});
 const pts=new THREE.Points(g,m);pts.frustumCulled=false;return pts;}

/* ---------- glowing plankton that stirs when you move (deep water) ---------- */
export function makePlankton(n=900){const p=new Float32Array(n*3),ph=new Float32Array(n);for(let i=0;i<n;i++){p[i*3]=Math.random()*24;p[i*3+1]=Math.random()*24;p[i*3+2]=Math.random()*24;ph[i]=Math.random()*100;}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('ph',new THREE.BufferAttribute(ph,1));
 const u={uTime:U.uTime,uCam:{value:new THREE.Vector3()},uStir:{value:0},uDeep:{value:0}};
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,uniforms:u,
  vertexShader:`attribute float ph;uniform float uTime,uStir,uDeep;uniform vec3 uCam;varying float vA;varying float vH;
  void main(){vec3 p=position+vec3(sin(uTime*.3+ph)*.4,sin(uTime*.2+ph*1.7)*.3,cos(uTime*.25+ph)*.4);p=uCam+mod(p-uCam+12.,24.)-12.;float d=distance(p,uCam);vH=fract(ph*.37);
   float tw=.35+.65*pow(.5+.5*sin(uTime*(1.5+fract(ph)*3.)+ph),6.);float stir=uStir*smoothstep(7.,1.5,d);vA=uDeep*(tw*.55+stir*1.6)*smoothstep(12.,6.,d)*smoothstep(1.,2.2,d);
   vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((1.+stir*1.5)*(16./-mv.z),1.,4.5);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:'varying float vA;varying float vH;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;vec3 c=mix(vec3(.25,1.,.85),vec3(.5,.6,1.),vH);gl_FragColor=vec4(c*vA*smoothstep(.5,0.,r),1.);}'});
 const pts=new THREE.Points(g,m);pts.frustumCulled=false;pts.userData.u=u;return pts;}

/* ---------- bubbles (breath, hydrojet, vents) ---------- */
export function makeBubbles(n=420){const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');const gr=x.createRadialGradient(16,16,4,16,16,15);gr.addColorStop(0,'rgba(255,255,255,0.05)');gr.addColorStop(.7,'rgba(220,250,255,0.35)');gr.addColorStop(.88,'rgba(255,255,255,0.95)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,32,32);x.fillStyle='rgba(255,255,255,.9)';x.beginPath();x.arc(11,11,2.5,0,6.3);x.fill();
 const tex=new THREE.CanvasTexture(c);const pos=new Float32Array(n*3).fill(1e5),sz=new Float32Array(n).fill(1);const B=[];for(let i=0;i<n;i++)B.push({t:0,vx:0,vz:0,v:1,ph:Math.random()*6});
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('sz',new THREE.BufferAttribute(sz,1));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,uniforms:{map:{value:tex},uScale:{value:500}},
  vertexShader:'attribute float sz;uniform float uScale;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(uScale*.11*sz/-mv.z,1.,40.);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform sampler2D map;void main(){vec4 c=texture2D(map,gl_PointCoord);gl_FragColor=vec4(c.rgb*.9,c.a*.85);}'});
 const pts=new THREE.Points(g,m);pts.frustumCulled=false;let head=0;
 const api={pts,mat:m,emit(x,y,z,k=1,spread=.15,size=1){pts.visible=true;this.wasAlive=true;g.attributes.position.needsUpdate=true;g.attributes.sz.needsUpdate=true;for(let i=0;i<k;i++){const b=B[head],o=head*3;head=(head+1)%n;pos[o]=x+(Math.random()-.5)*spread;pos[o+1]=y+(Math.random()-.5)*spread*.5;pos[o+2]=z+(Math.random()-.5)*spread;sz[head===0?n-1:head-1]=size*(.6+Math.random()*.8);b.t=6+Math.random()*4;b.vx=(Math.random()-.5)*.3;b.vz=(Math.random()-.5)*.3;b.v=.8+Math.random()*.8;}},
  step(dt){let alive=0;for(let i=0;i<n;i++){const b=B[i],o=i*3;if(b.t<=0)continue;alive++;b.t-=dt;b.ph+=dt*7;pos[o]+=(b.vx+Math.sin(b.ph)*.12)*dt;pos[o+1]+=b.v*dt;pos[o+2]+=(b.vz+Math.cos(b.ph*1.3)*.12)*dt;b.v=Math.min(2.6,b.v+dt*.3);if(b.t<=0||pos[o+1]>-.05){b.t=0;pos[o+1]=1e5;}}pts.visible=alive>0;if(alive||this.wasAlive){g.attributes.position.needsUpdate=true;g.attributes.sz.needsUpdate=true;}this.wasAlive=alive>0;}};
 return api;}

/* ---------- lens pass: gentle refraction wobble, edge chroma, visor vignette ---------- */
export const LensShader={uniforms:{tDiffuse:{value:null},uTime:{value:0},uAmt:{value:1},uHurt:{value:0},uVisor:{value:1}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uTime,uAmt,uHurt,uVisor;varying vec2 vUv;
 void main(){vec2 uv=vUv;vec2 d=uv-.5;float r=length(d*vec2(1.6,1.));
  uv+=uAmt*vec2(sin(uv.y*22.+uTime*1.3),cos(uv.x*18.+uTime*1.1))*.0016;
  float ca=uAmt*.004*smoothstep(.25,.9,r);vec3 c;c.r=texture2D(tDiffuse,uv+d*ca).r;c.g=texture2D(tDiffuse,uv).g;c.b=texture2D(tDiffuse,uv-d*ca).b;
  float vis=smoothstep(.98,.72,r);c*=mix(1.,.55+.45*vis,uVisor*uAmt);
  c=mix(c,c*vec3(1.25,.55,.5),uHurt*smoothstep(.2,.9,r));gl_FragColor=vec4(c,1.);}`};

/* ---------- underwater image-based lighting: a procedural light field baked once through PMREM ---------- */
export function makeEnv(renderer){const sc=new THREE.Scene();const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{sunDir:{value:SUN_DIR}},
 vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform vec3 sunDir;varying vec3 vD;void main(){vec3 d=normalize(vD);float up=d.y*.5+.5;
  vec3 c=mix(vec3(.004,.03,.05),vec3(.05,.3,.38),smoothstep(.1,.75,up));c=mix(c,vec3(.55,.85,.95),smoothstep(.78,1.,up));
  float sd=max(dot(d,sunDir),0.);c+=vec3(1.,.97,.9)*(pow(sd,60.)*6.+pow(sd,8.)*.5);
  // bright mottled "window" overhead, like light breaking through waves
  float w=sin(d.x*23.)*sin(d.z*19.)*.5+.5;c+=vec3(.4,.7,.75)*w*smoothstep(.82,.97,up)*.6;gl_FragColor=vec4(c*.42,1.);}`});
 sc.add(new THREE.Mesh(new THREE.SphereGeometry(10,48,24),m));const pm=new THREE.PMREMGenerator(renderer);const rt=pm.fromScene(sc,0,.1,20);pm.dispose();m.dispose();return rt.texture;}

U.tCaus.value=TEX.caus;
