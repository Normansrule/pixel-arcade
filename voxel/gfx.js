// VOXEL FRONTIER — look: chunk materials that honour baked sky/torch light, a gradient sky dome with sun, moon and stars,
// drifting blocky clouds, and the day/night lighting rig (sun + moon shadows, hemisphere fill, fog).
import * as THREE from '../vendor/three.module.min.js';
import {AT,hash,mulberry} from './blocks.js';

export const U={uTime:{value:0},uDay:{value:1},uTorch:{value:2.4},uTorchCol:{value:new THREE.Color(1,.62,.3)},uSkyCol:{value:new THREE.Color(.4,.6,.9)},uAmb:{value:.05}};
// shared shader patch: lt = (sky, block) light, sway = wind weight
function lightPatch(sh,water){Object.assign(sh.uniforms,{uTime:U.uTime,uDay:U.uDay,uTorch:U.uTorch,uTorchCol:U.uTorchCol,uSkyCol:U.uSkyCol,uAmb:U.uAmb});
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 lt;attribute float sway;uniform float uTime;varying vec2 vLt;varying vec3 vWP;varying float vUp;')
  .replace('#include <begin_vertex>',`#include <begin_vertex>
vLt=lt;vUp=normal.y;
if(sway>0.){float ph=position.x*.7+position.z*.45;transformed.x+=sway*(sin(uTime*1.6+ph)*.05+sin(uTime*4.3+ph*3.)*.012);transformed.z+=sway*cos(uTime*1.3+ph*1.3)*.04;}
${water?'float wv=step(.5,normal.y)*((sin(position.x*1.3+uTime*1.8)+cos(position.z*1.1+uTime*1.4))*.03-.02);transformed.y+=wv;':''}
vWP=(modelMatrix*vec4(transformed,1.)).xyz;`);
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTime,uDay,uTorch,uAmb;uniform vec3 uTorchCol,uSkyCol;varying vec2 vLt;varying vec3 vWP;varying float vUp;')
  .replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
 float skyL=vLt.x;reflectedLight.directDiffuse*=smoothstep(.12,.75,skyL);reflectedLight.indirectDiffuse*=skyL;
 ${water?'reflectedLight.directSpecular*=smoothstep(.3,.9,skyL);':''}
 reflectedLight.indirectDiffuse+=diffuseColor.rgb*uAmb;
 float tl=vLt.y*vLt.y;totalEmissiveRadiance+=diffuseColor.rgb*uTorchCol*tl*uTorch*(1.-.35*uDay*skyL);`);
 if(water)sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 if(vUp>.5){vec3 p=vWP;float dx=cos(p.x*1.3+uTime*1.8)*.05+cos(p.x*3.1+p.z*2.3+uTime*2.6)*.08+cos(p.x*7.3-p.z*5.1+uTime*3.7)*.03,dz=-sin(p.z*1.1+uTime*1.4)*.05+sin(p.z*2.7-p.x*1.9+uTime*2.2)*.08+sin(p.z*6.9+p.x*4.7-uTime*3.1)*.03;normal=normalize((viewMatrix*vec4(normalize(vec3(-dx*2.,1.,-dz*2.)),0.)).xyz);}`)
  .replace('#include <opaque_fragment>',`float fr=pow(1.-abs(dot(normalize(vViewPosition),normal)),4.);outgoingLight=mix(outgoingLight,uSkyCol*vLt.x*.8,fr*.5);diffuseColor.a=mix(diffuseColor.a,.96,fr);
#include <opaque_fragment>`);}
export function makeMaterials(){
 const solid=new THREE.MeshLambertMaterial({map:AT.map,emissiveMap:AT.em,emissive:0xffffff,emissiveIntensity:2.2,vertexColors:true});
 solid.onBeforeCompile=sh=>lightPatch(sh,false);solid.customProgramCacheKey=()=>'vxsolid';
 const cut=new THREE.MeshLambertMaterial({map:AT.map,emissiveMap:AT.em,emissive:0xffffff,emissiveIntensity:2.2,vertexColors:true,alphaTest:.5});
 cut.onBeforeCompile=sh=>lightPatch(sh,false);cut.customProgramCacheKey=()=>'vxcut';
 const water=new THREE.MeshPhongMaterial({color:0x1d6fb8,specular:0xffffff,shininess:90,transparent:true,opacity:.74,depthWrite:false,vertexColors:false});
 water.onBeforeCompile=sh=>lightPatch(sh,true);water.customProgramCacheKey=()=>'vxwater';
 const leafDepth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});
 return{solid,cut,water,leafDepth};}

/* ---------------- sky dome ---------------- */
const SU={uSun:{value:new THREE.Vector3(0,1,0)},uZen:{value:new THREE.Color()},uHor:{value:new THREE.Color()},uSunC:{value:new THREE.Color()},uGlow:{value:new THREE.Color()},uNight:{value:0},uTime:U.uTime};
export const skyU=SU;
export const sky=new THREE.Mesh(new THREE.SphereGeometry(400,32,16),new THREE.ShaderMaterial({uniforms:SU,side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
 fragmentShader:`uniform vec3 uSun,uZen,uHor,uSunC,uGlow;uniform float uNight,uTime;varying vec3 vD;
 float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 void main(){vec3 d=normalize(vD);float y=d.y;vec3 c=mix(uHor,uZen,pow(clamp(y,0.,1.),.55));if(y<0.)c=mix(uHor,uHor*.55,clamp(-y*3.,0.,1.));
  float mu=dot(d,uSun);float az=max(mu,0.);
  c+=uGlow*pow(az,5.)*.55*exp(-max(y,0.)*2.2);c+=uSunC*pow(az,180.)*.9;
  float disc=smoothstep(.9990,.9994,mu);c=mix(c,uSunC*14.,disc*step(-.05,uSun.y+.02));
  // moon (opposite the sun), soft craters
  float mm=dot(d,-uSun);float md=smoothstep(.99955,.99968,mm);vec3 mc=vec3(.9,.92,1.)*(1.1-.35*h3(floor(d*900.)));c=mix(c,mc*2.2,md*uNight);c+=vec3(.25,.3,.45)*pow(max(mm,0.),300.)*uNight*.6;
  // stars
  vec3 sd=d*260.;vec3 cell=floor(sd);float s=h3(cell);if(s>.9965&&y>-.02){vec3 f=fract(sd)-.5;float st=smoothstep(.22,0.,length(f))*(.6+.4*sin(uTime*2.+s*60.));c+=vec3(.9,.95,1.)*st*uNight*2.2;}
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`}));
sky.renderOrder=-10;sky.frustumCulled=false;

/* ---------------- blocky clouds ---------------- */
export const CLOUD_Y=128;
export const clouds=(()=>{const N=40,S=12,R=mulberry(4);const g=[];for(let i=0;i<N*N;i++)g.push(0);
 // periodic blob field
 const blobs=[];for(let i=0;i<46;i++)blobs.push([R()*N,R()*N,1.4+R()*3]);
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){let v=0;for(const b of blobs){let dx=Math.abs(x-b[0]),dz=Math.abs(z-b[1]);dx=Math.min(dx,N-dx);dz=Math.min(dz,N-dz);v=Math.max(v,1-Math.hypot(dx,dz*1.4)/b[2]);}g[z*N+x]=v>.12?1:0;}
 const at=(x,z)=>g[(((z%N)+N)%N)*N+(((x%N)+N)%N)];const P=[],C=[],I=[];const H=4;
 const q=(v,col)=>{const b=P.length/3;for(const p of v)P.push(...p);for(let i=0;i<4;i++)C.push(col,col,col);I.push(b,b+1,b+2,b,b+2,b+3);};
 for(let z=0;z<N;z++)for(let x=0;x<N;x++){if(!at(x,z))continue;const X=x*S,Z=z*S;
  q([[X,H,Z+S],[X+S,H,Z+S],[X+S,H,Z],[X,H,Z]],1);q([[X,0,Z],[X+S,0,Z],[X+S,0,Z+S],[X,0,Z+S]],.8);
  if(!at(x-1,z))q([[X,0,Z],[X,0,Z+S],[X,H,Z+S],[X,H,Z]],.84);if(!at(x+1,z))q([[X+S,0,Z+S],[X+S,0,Z],[X+S,H,Z],[X+S,H,Z+S]],.84);
  if(!at(x,z-1))q([[X+S,0,Z],[X,0,Z],[X,H,Z],[X+S,H,Z]],.9);if(!at(x,z+1))q([[X,0,Z+S],[X+S,0,Z+S],[X+S,H,Z+S],[X,H,Z+S]],.9);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));geo.setIndex(I);
 const mat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.8,fog:false,depthWrite:false});const cu={uCam:{value:new THREE.Vector3()},uTint:{value:new THREE.Color(1,1,1)}};
 mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,cu);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCW;').replace('#include <project_vertex>','#include <project_vertex>\nvCW=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uCam,uTint;varying vec3 vCW;').replace('#include <opaque_fragment>','outgoingLight*=uTint;float dd=length(vCW.xz-uCam.xz);diffuseColor.a*=1.-smoothstep(170.,300.,dd);\n#include <opaque_fragment>');};
 const m=new THREE.InstancedMesh(geo,mat,9);m.frustumCulled=false;m.renderOrder=-5;m.userData={N,S,cu};return m;})();
const _m4=new THREE.Matrix4();
export function placeClouds(px,pz,t){const{N,S,cu}=clouds.userData;const T=N*S,ox=(t*1.2)%T;const bx=Math.floor((px-ox)/T)*T+ox,bz=Math.floor(pz/T)*T;let k=0;
 for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){_m4.makeTranslation(bx+a*T,CLOUD_Y,bz+b*T);clouds.setMatrixAt(k++,_m4);}clouds.instanceMatrix.needsUpdate=true;cu.uCam.value.set(px,0,pz);}

/* ---------------- lighting rig ---------------- */
const C=(r,g,b)=>new THREE.Color(r,g,b);
const PAL={day:{zen:C(.03,.13,.52),hor:C(.27,.45,.78),fog:C(.3,.48,.78)},set:{zen:C(.09,.11,.32),hor:C(1.1,.42,.16),fog:C(.7,.42,.32)},night:{zen:C(.004,.007,.022),hor:C(.02,.034,.075),fog:C(.022,.032,.07)}};
const tmp=new THREE.Color(),tmp2=new THREE.Color();
export function sunDirAt(dayT,out){const a=dayT*Math.PI*2;return out.set(Math.cos(a)*.86,Math.sin(a),.32).normalize();}
// returns light-state info; mutates lights/fog/sky
export function applyLighting(o){const{dayT,sun,hemi,fog,R,center,shadowSize}=o;const sd=sunDirAt(dayT,o.sunDir);const el=sd.y;
 const day=THREE.MathUtils.smoothstep(el,-.1,.22),warm=1-THREE.MathUtils.smoothstep(el,.04,.4),night=1-THREE.MathUtils.smoothstep(el,-.22,.02);
 const blend=(k)=>{tmp.copy(PAL.night[k]).lerp(PAL.set[k],THREE.MathUtils.smoothstep(el,-.22,.02));tmp2.copy(tmp).lerp(PAL.day[k],THREE.MathUtils.smoothstep(el,.04,.4));return tmp2.clone();};
 const zen=blend('zen'),hor=blend('hor'),fc=blend('fog');
 SU.uSun.value.copy(sd);SU.uZen.value.copy(zen);SU.uHor.value.copy(hor);SU.uNight.value=night;SU.uSunC.value.setRGB(1,.86-warm*.25,.66-warm*.4).multiplyScalar(.6+.6*day);SU.uGlow.value.setRGB(1,.5,.22).multiplyScalar(warm*day*1.4+.05);
 const moonUp=el<-.02;const ld=moonUp?sd.clone().negate():sd;
 sun.intensity=moonUp?.42*night:3.1*day;if(moonUp)sun.color.setRGB(.55,.66,1);else sun.color.setRGB(1,.93-warm*.28,.84-warm*.46);
 // snap shadow camera to texel grid
 const tx=shadowSize*2/sun.shadow.mapSize.x;const cx=Math.round(center.x/tx)*tx,cy=Math.round(center.y/tx)*tx,cz=Math.round(center.z/tx)*tx;sun.position.set(cx+ld.x*100,cy+ld.y*100,cz+ld.z*100);sun.target.position.set(cx,cy,cz);sun.target.updateMatrixWorld();
 hemi.intensity=.35+1.05*day;hemi.color.setRGB(.5+.25*day,.6+.22*day,.95);hemi.groundColor.setRGB(.36,.3,.24).multiplyScalar(.4+.6*day);
 fog.color.copy(fc);U.uSkyCol.value.copy(hor).lerp(zen,.4).multiplyScalar(1.2);U.uDay.value=day;U.uAmb.value=.035+.03*day;
 clouds.userData.cu.uTint.value.setRGB(.1+.95*day+.25*warm*day,.11+.92*day+.02*warm*day,.16+.9*day-.18*warm*day);
 return{day,night,warm,el,fog:fc};}
