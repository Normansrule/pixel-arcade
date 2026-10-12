// ABYSS DIVER — water rendering: depth fog, caustics, sky dome, surface, god rays, particulate, bubbles, lens pass.
import * as THREE from '../vendor/three.module.min.js';

export const U={uTime:{value:0},uSun:{value:1},uCaus:{value:1},uCamY:{value:0}};

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
 gl_FragColor.rgb*=absorb;
 float fdd=fogNear*fdl;float fogFactor=1.-exp(-fdd*fdd);
 gl_FragColor.rgb=mix(gl_FragColor.rgb,uwCol(fogColor,fdir.y,fogFar),fogFactor);
#endif`;}

/* ---------- caustics + vertex animation injected into standard materials ---------- */
const CAUS=`float caus(vec2 p,float t){vec2 i=p;float c=1.;float inten=.005;for(int n=0;n<4;n++){float tt=t*(1.-(3.5/float(n+1)));i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));vec2 dv=vec2(sin(i.x+tt),cos(i.y+tt));dv=sign(dv)*max(abs(dv),vec2(1e-3));c+=1./max(length(vec2(p.x/(dv.x/inten),p.y/(dv.y/inten))),1e-3);}c/=4.;c=1.17-pow(max(c,0.),1.4);return clamp(pow(abs(c),8.),0.,2.5);}`;
// o: {caus:strength, vert:'glsl after begin_vertex (has transformed, position, iph, uTime)', emis:'glsl after emissivemap (totalEmissiveRadiance)', uniforms:{}}
export function wmat(m,o={}){const cs=o.caus??1;m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U,o.uniforms||{});
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
 let f=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;varying float vIph;uniform float uTime,uSun,uCaus;'+CAUS+(o.fpars||''));
 if(o.diffuse)f=f.replace('#include <color_fragment>','#include <color_fragment>\n'+o.diffuse);
 if(o.emis||o.rim)f=f.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n'+(o.emis||'')+(o.rim?`totalEmissiveRadiance+=diffuseColor.rgb*pow(1.-abs(dot(normal,normalize(vViewPosition))),2.2)*${o.rim.toFixed(2)}*(.35+.65*uSun);`:''));
 if(cs>0)f=f.replace('#include <opaque_fragment>',`float cz=caus(mod(vWP.xz*.13,6.2831),uTime*.5)*1.3;
  float cf=exp(min(vWP.y,0.)*.024)*uSun*uCaus*${cs.toFixed(2)}*smoothstep(-.2,.7,vWN.y);
  outgoingLight+=diffuseColor.rgb*vec3(.8,1.,.98)*min(cz,1.8)*.3*cf;
  #include <opaque_fragment>`);
 sh.fragmentShader=f;};m.customProgramCacheKey=()=>'w'+cs+(o.rim||0)+(o.key||'')+(o.vert||'').length+(o.emis||'').length+(o.diffuse||'').length;return m;}

/* ---------- background dome (matches the fog colour per view direction) ---------- */
export function makeDome(){const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{fc:{value:new THREE.Color()},uw:{value:1},uTime:U.uTime,sunDir:{value:new THREE.Vector3(.25,1,.15).normalize()}},
 vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform vec3 fc,sunDir;uniform float uw,uTime;varying vec3 vD;${WATER_FN}
 void main(){vec3 d=normalize(vD);vec3 c=uwCol(fc,d.y,uw);float s=pow(max(dot(d,sunDir),0.),18.)*uw;c+=fc*vec3(.9,1.,1.)*s*1.4;gl_FragColor=vec4(c,1.);}`});
 const d=new THREE.Mesh(new THREE.SphereGeometry(300,32,16),m);d.frustumCulled=false;d.renderOrder=-10;return d;}

/* ---------- sea surface (Snell's window from below, glassy swell from above) ---------- */
export function makeSurface(){const m=new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:false,fog:false,uniforms:{uTime:U.uTime,fc:{value:new THREE.Color()},dens:{value:.02},sky:{value:new THREE.Color(0x9fd4f0)}},
 vertexShader:`varying vec3 vW;uniform float uTime;void main(){vec3 p=position;vec4 w=modelMatrix*vec4(p,1.);w.y+=sin(w.x*.16+uTime*.9)*.22+cos(w.z*.21+uTime*1.15)*.18;vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
 fragmentShader:`varying vec3 vW;uniform float uTime,dens;uniform vec3 fc,sky;${WATER_FN}
 float n(vec2 p){return sin(p.x)*sin(p.y);}
 void main(){vec2 q=vW.xz*.22;float r=n(q+uTime*.35)*.5+n(q*2.3-uTime*.45)*.3+n(q*5.3+uTime*.8)*.2;vec3 v=vW-cameraPosition;float dl=length(v);vec3 dir=v/dl;
  if(cameraPosition.y<vW.y){float ang=dir.y+r*.06;float win=smoothstep(.62,.8,ang);vec3 tir=uwCol(fc,-.2,1.)*.9;vec3 lit=mix(fc*2.2,vec3(.85,.97,1.),.55)+r*.08;
   vec3 c=mix(tir,lit,win);c+=vec3(1.)*pow(max(r,0.),3.)*.35*win;c+=fc*smoothstep(.55,.62,ang)*smoothstep(.8,.62,ang)*1.4;float fd=dens*dl;float ff=1.-exp(-fd*fd*.35);c=mix(c,uwCol(fc,dir.y,1.),ff);gl_FragColor=vec4(c,1.);}
  else{float fr=pow(1.-max(-dir.y,0.),5.);vec3 deep=vec3(.02,.16,.24);vec3 c=mix(deep+r*.03,sky,fr*.85)+max(0.,r)*.08;float ff=1.-exp(-dl*.004);c=mix(c,sky,ff);gl_FragColor=vec4(c,.97);}}`});
 const s=new THREE.Mesh(new THREE.PlaneGeometry(700,700,96,96).rotateX(-Math.PI/2),m);s.frustumCulled=false;return s;}

/* ---------- god rays: billboarded shafts that wrap around the camera ---------- */
export function makeRays(n=56){const g=new THREE.PlaneGeometry(1,1,1,8);g.translate(0,-.5,0);
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,side:THREE.DoubleSide,uniforms:{uTime:U.uTime,uI:{value:1},uCam:{value:new THREE.Vector3()},col:{value:new THREE.Color(.6,.92,1)}},
  vertexShader:`uniform vec3 uCam;uniform float uTime;varying vec2 vUv;varying float vF;varying float vS;
  void main(){vUv=uv;vec3 c=instanceMatrix[3].xyz;float w=length(instanceMatrix[0].xyz),h=length(instanceMatrix[1].xyz);vS=instanceMatrix[2].x;
   vec3 to=uCam-c;to.y=0.;vec3 rt=normalize(vec3(to.z,0.,-to.x)+1e-4);vec3 p=c+rt*position.x*w+vec3(.22,1.,.12)*position.y*h;
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
 const api={pts,mat:m,emit(x,y,z,k=1,spread=.15,size=1){for(let i=0;i<k;i++){const b=B[head],o=head*3;head=(head+1)%n;pos[o]=x+(Math.random()-.5)*spread;pos[o+1]=y+(Math.random()-.5)*spread*.5;pos[o+2]=z+(Math.random()-.5)*spread;sz[head===0?n-1:head-1]=size*(.6+Math.random()*.8);b.t=6+Math.random()*4;b.vx=(Math.random()-.5)*.3;b.vz=(Math.random()-.5)*.3;b.v=.8+Math.random()*.8;}},
  step(dt){for(let i=0;i<n;i++){const b=B[i],o=i*3;if(b.t<=0)continue;b.t-=dt;b.ph+=dt*7;pos[o]+=(b.vx+Math.sin(b.ph)*.12)*dt;pos[o+1]+=b.v*dt;pos[o+2]+=(b.vz+Math.cos(b.ph*1.3)*.12)*dt;b.v=Math.min(2.6,b.v+dt*.3);if(b.t<=0||pos[o+1]>-.05){b.t=0;pos[o+1]=1e5;}}g.attributes.position.needsUpdate=true;g.attributes.sz.needsUpdate=true;}};
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
