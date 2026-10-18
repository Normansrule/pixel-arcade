// FAIRWAY LEGENDS — scenery for one hole. Procedural sky with drifting cloud deck (also baked into the IBL), field-shaded
// links turf (view-dependent mowing stripes on fairways and greens, collars, clumpy rough, golden dune fescue, raked and
// rippled sand, revetted pot bunkers, layered cliff strata, wet beach) with per-surface bump detail; an open sea with
// directional swell, shore-break foam lines and sun glitter; wind-bent pines built from branches and leaf cards, gorse,
// swaying marram and fescue, lichen rocks, gulls, rain. Every texture is drawn in code once and cached.
import * as THREE from '../vendor/three.module.min.js';
import {CS,WIND_DIR,rng} from './course.js';
const V=THREE.Vector3;
export const SUN=new V(.62,.36,-.62).normalize();
const TEXC=new Map();
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h,c);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const NOISE_GLSL=`float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){return vn(p)*.5+vn(p*2.07)*.25+vn(p*4.31)*.125+vn(p*8.73)*.0625;}`;
/* ---------- weather presets (sky, light, ground wetness) ---------- */
export const WEATHER={
 clear:{n:'CLEAR',cover:.18,wet:0,rain:0,sun:3.6,hemi:.8,fog:.00032,sea:.55},
 breezy:{n:'BRIGHT & BREEZY',cover:.38,wet:0,rain:0,sun:3.4,hemi:.85,fog:.0003,sea:.75},
 overcast:{n:'OVERCAST',cover:.78,wet:.15,rain:0,sun:1.25,hemi:1.25,fog:.00055,sea:.8},
 rain:{n:'RAIN',cover:.95,wet:1,rain:1,sun:.55,hemi:1.35,fog:.0011,sea:1}};
/* ---------- sky (shared by the dome and the environment bake) ---------- */
const SKY_FRAG=`uniform vec3 sunD;uniform float cover,time;varying vec3 vD;${NOISE_GLSL}
vec3 skyCol(vec3 d){float h=d.y,s=max(dot(d,sunD),0.);
 vec3 zen=mix(vec3(.06,.2,.55),vec3(.34,.38,.44),cover),mid=mix(vec3(.22,.46,.82),vec3(.5,.54,.6),cover),hor=mix(vec3(.74,.84,.93),vec3(.66,.69,.72),cover),gnd=mix(vec3(.42,.47,.44),vec3(.32,.34,.34),cover);
 vec3 c=h>0.?mix(hor,mid,smoothstep(0.,.25,h)):gnd;if(h>0.)c=mix(c,zen,smoothstep(.22,.95,h));c=mix(c,hor*1.04,exp(-abs(h)*30.)*.55);
 c+=vec3(1.,.86,.66)*(pow(s,5.)*.22+pow(s,48.)*.35)*(1.-cover*.75);
 c+=vec3(16.,14.,11.)*smoothstep(.99935,.9997,s)*(1.-smoothstep(.5,.9,cover));
 if(h>0.){vec2 uv=d.xz/(h+.1)*.9+vec2(time*.004,time*.0015);
  float n=fb(uv*1.1)*.75+fb(uv*3.3+3.1)*.35;float th=.66-cover*.4;float cc=smoothstep(th,th+.1+cover*.12,n)*smoothstep(0.,.14,h);
  float n2=fb(uv*1.1+sunD.xz*.07)*.75+fb(uv*3.3+3.1+sunD.xz*.07)*.35;float lit=clamp(.55+(n-n2)*5.,0.,1.);
  vec3 cl=mix(mix(vec3(.5,.55,.62),vec3(.36,.38,.42),cover),mix(vec3(1.05,1.,.95),vec3(.78,.8,.83),cover),lit);cl+=vec3(1.,.9,.75)*pow(s,10.)*.9*(1.-cover);
  cl=mix(cl,hor,smoothstep(.25,0.,h)*.6);c=mix(c,cl,cc*.95);}
 return c;}`;
function skyMat(U,dome){return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{sunD:{value:SUN.clone()},cover:U.cover,time:U.time},
 vertexShader:'varying vec3 vD;void main(){vD=normalize((modelMatrix*vec4(position,0.)).xyz);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);'+(dome?'gl_Position.z=gl_Position.w*.99999;':'')+'}',
 fragmentShader:SKY_FRAG+`void main(){gl_FragColor=vec4(skyCol(normalize(vD)),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`});}
let envRT=null;
export function makeEnv(R,cover=.18){const s=new THREE.Scene();const U={cover:{value:cover},time:{value:0}};const m=skyMat(U,false);
 s.add(new THREE.Mesh(new THREE.SphereGeometry(100,32,16),m));
 const g=new THREE.Mesh(new THREE.CircleGeometry(100,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:new THREE.Color(.16,.2,.1).multiplyScalar(1-cover*.4)}));g.position.y=-8;s.add(g);
 const pm=new THREE.PMREMGenerator(R);const rt=pm.fromScene(s,.015);pm.dispose();m.dispose();g.geometry.dispose();g.material.dispose();if(envRT)envRT.dispose();envRT=rt;return rt.texture;}
function dataTex(arr,nx,nz){const t=new THREE.DataTexture(arr,nx,nz,THREE.RGBAFormat);t.magFilter=t.minFilter=THREE.LinearFilter;t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;t.needsUpdate=true;return t;}
const BUMP_GLSL=`vec3 bumpN(vec3 sp,vec3 sn,float h){vec3 dx=dFdx(sp),dy=dFdy(sp);vec3 r1=cross(dy,sn),r2=cross(sn,dx);float det=dot(dx,r1);vec3 g=sign(det)*(dFdx(h)*r1+dFdy(h)*r2);return normalize(abs(det)*sn-g);}`;
/* ---------- ground material: everything painted from the margin fields ---------- */
function groundMat(U,q){const m=new THREE.MeshStandardMaterial({roughness:.92,metalness:0,envMapIntensity:.6});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vW;varying vec3 vWN;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvW=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D fT;uniform vec4 fB;uniform vec2 hD,teeP;uniform float wet;varying vec3 vW;varying vec3 vWN;float gRough,gBump;${NOISE_GLSL}${BUMP_GLSL}
float sq(float x,float k){return clamp((abs(fract(x)-.5)*4.-1.)*k,-1.,1.);}`).replace('#include <map_fragment>',`
 vec2 fuv=(vW.xz-fB.xy)*fB.zw+fB.zw*${(CS*.5).toFixed(2)};vec4 f=(texture2D(fT,fuv)*255.-128.)/8.;
 float aa=clamp(length(fwidth(vW.xz))*.7,.06,3.);float dist=length(cameraPosition-vW);float det=1.-smoothstep(18.,70.,dist);float det2=1.-smoothstep(6.,26.,dist);
 vec3 Vd=normalize(cameraPosition-vW);vec2 vxz=normalize(Vd.xz+vec2(1e-4));vec2 pd=vec2(hD.y,-hD.x);
 float n1=fb(vW.xz*.045),n2=fb(vW.xz*.31),n3=vn(vW.xz*2.3),n4=vn(vW.xz*9.),n5=vn(vW.xz*37.)*det2;
 float lat=dot(vW.xz,pd)+sin(dot(vW.xz,hD)*.045)*.7,alo=dot(vW.xz,hD);
 // dune fescue: golden, clumpy, wind-combed
 float clump=smoothstep(.35,.75,fb(vW.xz*.9+n1));
 vec3 deep=mix(vec3(.6,.53,.31),vec3(.34,.41,.18),smoothstep(.25,.7,n1));deep=mix(deep,vec3(.3,.37,.16),smoothstep(.45,.8,fb(vW.xz*.12+4.))*.6);deep*=.7+.42*n2;deep=mix(deep,vec3(.5,.4,.25),n4*.3);deep*=.82+.3*clump*det+.12*n5;
 // rough: darker, patchy with clover and longer blades
 vec3 rough=mix(vec3(.2,.31,.11),vec3(.31,.4,.16),n1)*(.82+.26*n2)*(.88+.16*n4);rough=mix(rough,vec3(.27,.4,.15),smoothstep(.6,.8,n3)*.5);rough*=.9+.18*n5;
 // fairway: wide mower stripes whose shade flips with the view direction
 float fwl=fwidth(lat)*16.+.01;float sF=sq(lat/18.,clamp(18./fwl,1.,10.));float sheF=sF*dot(vxz,hD);
 vec3 fair=vec3(.36,.5,.19)*(1.+.1*sheF)*(.94+.1*n2)*(.97+.05*n4)*(.95+.1*n5);fair=mix(fair,fair*vec3(1.08,1.02,.85),smoothstep(.62,.85,n1)*.6);
 // green: tight stripes one way, a fainter cross-cut the other
 float sG=sq(lat/4.6,clamp(4.6/fwl,0.,5.)),sG2=sq(alo/4.6,clamp(4.6/fwl,0.,5.));vec3 grn=vec3(.27,.5,.19)*(1.+.09*sG*dot(vxz,hD)+.045*sG2*dot(vxz,pd))*(.97+.05*n3)*(.97+.06*n5);
 // collar / fringe: concentric-feeling mid cut
 vec3 fri=vec3(.27,.49,.17)*(1.+.08*sq(alo/2.,3.)*dot(vxz,hD))*(.94+.1*n2);
 // tee: chequered
 float sT=sq(lat/3.,3.)*sq(alo/3.,3.);vec3 teeC=vec3(.31,.54,.2)*(1.+.08*sT);
 // sand: raked furrows + grain
 float rk=sin(dot(vW.xz,vec2(.6,.8))*16.+n3*5.+n2*3.);vec3 sand=mix(vec3(.88,.8,.62),vec3(.78,.68,.5),n2)*(.95+.05*rk*det2)*(.96+.06*n5);
 vec3 c=deep;
 float rM=smoothstep(-.9,.9,f.w+(n2-.5)*4.);c=mix(c,rough,rM);
 float fM=smoothstep(-aa,aa,f.x);c=mix(c,fair,fM);
 c=mix(c,teeC,fM*(1.-smoothstep(7.,9.5,length(vW.xz-teeP))));
 float frM=smoothstep(-1.6-aa,-1.6+aa,f.y);c=mix(c,fri,frM);
 float gM=smoothstep(-aa,aa,f.y);c=mix(c,grn,gM);
 float sd=smoothstep(-aa,aa,f.z);c=mix(c,sand,sd);
 // revetted pot-bunker faces: stacked sod layers
 float rev=smoothstep(-.7,-.05,f.z)*(1.-sd);c*=1.-rev*(.22+.25*step(.72,fract(vW.y*6.5+n3*.3)));
 // beach: wind ripples, darker wet band and wrack line
 float beach=smoothstep(1.7,.9,vW.y)*(1.-gM);float wetB=smoothstep(.75,.2,vW.y);
 float rip=sin(dot(vW.xz,vec2(.83,.55))*5.5+n2*7.+n3*2.);vec3 bs=sand*(.95+.06*rip*det)*mix(vec3(1.),vec3(.62,.58,.5),wetB);bs=mix(bs,vec3(.25,.22,.16),smoothstep(.83,.9,vn(vW.xz*.7))*smoothstep(.9,.6,vW.y)*smoothstep(.45,.6,vW.y));
 c=mix(c,bs,beach);
 // cliff rock: warped sedimentary strata
 float rkM=smoothstep(.74,.5,vWN.y)*(1.-sd);float sy=vW.y*.55+fb(vW.xz*.04)*2.5+fb(vec2(vW.y*.15,(vW.x+vW.z)*.02))*1.2;float band=fract(sy);float bi=floor(sy);float hb=h21(vec2(bi,3.));
 vec3 rock=mix(vec3(.34,.3,.26),vec3(.6,.55,.46),hb)*mix(.8,1.04,smoothstep(0.,.12+.25*hb,band))*(.62+.55*fb(vec2((vW.x+vW.z)*.08,vW.y*.12)))*(.85+.25*fb(vec2(sy*2.3,(vW.x-vW.z)*.22)));
 float crack=smoothstep(.62,.9,vn(vec2((vW.x+vW.z)*1.6,vW.y*.07)))*smoothstep(.3,.7,vn(vec2((vW.x-vW.z)*.3,vW.y*.5)));rock*=1.-crack*.55;rock=mix(rock,vec3(.24,.22,.2),smoothstep(.6,.85,vn(vec2((vW.x+vW.z)*.5,vW.y*.12)))*.45);
 rock=mix(rock,vec3(.66,.6,.4),smoothstep(.7,.9,fb(vec2(vW.x+vW.z,vW.y)*.35))*.35);rock=mix(rock,rock*vec3(.8,.85,.75),smoothstep(3.,.5,vW.y));
 c=mix(c,rock,rkM);
 // bump: grain on turf, furrows in sand, ledges in rock
 float turfB=(n5-.5)*.005+(n4-.5)*.014*(1.-fM)*(1.-gM)+clump*.03*(1.-rM)*(1.-fM);
 gBump=mix(turfB*det,(rk*.004+(n5-.5)*.003)*det2,sd);gBump=mix(gBump,rip*.006*det,beach*(1.-wetB));gBump=mix(gBump,(smoothstep(0.,.12+.25*hb,band)*.3+n4*.05-crack*.12),rkM);
 gRough=mix(.95,.84,fM);gRough=mix(gRough,.7,gM);gRough=mix(gRough,.97,sd);gRough=mix(gRough,.32,beach*wetB);gRough=mix(gRough,.86,rkM);
 c*=1.-wet*.2*(1.-sd*.4);gRough=mix(gRough,max(.42,gRough*.68),wet);gBump*=1.-wet*.6;
 diffuseColor.rgb=pow(c,vec3(2.1));`).replace('#include <roughnessmap_fragment>','float roughnessFactor=gRough;').replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=bumpN(-vViewPosition,normal,gBump);');
  };
 m.customProgramCacheKey=()=>'fl-ground'+q;return m;}
/* ---------- water ---------- */
function waterMat(U,o){const u=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{sunD:{value:SUN.clone()},deepC:{value:new THREE.Color(o.deep)},shalC:{value:new THREE.Color(o.shal)},amp:{value:o.amp},scale:{value:o.scale},hiQ:{value:o.q}}]);
 u.aT=U.aT;u.fB=U.fB;u.t=U.time;u.cover=U.cover;u.wdir=U.wdir;u.seaS=U.seaS;u.rain=U.rain;
 return new THREE.ShaderMaterial({uniforms:u,transparent:true,fog:true,depthWrite:true,
  vertexShader:`varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}`,
  fragmentShader:`uniform float t,amp,scale,cover,seaS,rain,hiQ;uniform vec3 sunD,deepC,shalC;uniform vec2 wdir;uniform sampler2D aT;uniform vec4 fB;varying vec3 vW;\n#include <fog_pars_fragment>\n${NOISE_GLSL}
 vec2 rot(vec2 v,float a){float c=cos(a),s=sin(a);return vec2(c*v.x-s*v.y,s*v.x+c*v.y);}
 void main(){vec2 p=vW.xz;float dist=length(cameraPosition-vW);vec2 g=vec2(0.);float crest=0.;
  for(int i=0;i<6;i++){float fi=float(i);float lam=30./pow(1.62,fi)/scale;float k=6.2832/lam;vec2 d=rot(wdir,sin(fi*2.17+.4)*1.05);float A=lam*(i<2?.011:.018)*amp*seaS*(1.-smoothstep(lam*6.,lam*24.,dist));
   float ph=dot(p,d)*k-t*sqrt(9.81*k)+fi*1.7+fb(p*.012+fi*3.7)*7.;g+=d*k*A*cos(ph);crest+=A*sin(ph)/(lam*.018+1e-3);}
  float e=.35;float r0=fb(p*.9-t*.25*wdir);vec2 rg=vec2(fb((p+vec2(e,0.))*.9-t*.25*wdir)-r0,fb((p+vec2(0.,e))*.9-t*.25*wdir)-r0)/e;g+=rg*.16*amp*(1.-smoothstep(20.,120.,dist));
  if(rain>0.){float rr=vn(p*9.+t*3.);g+=vec2(sin(rr*40.+t*20.),cos(rr*37.-t*18.))*.05*rain*(1.-smoothstep(5.,40.,dist));}
  vec3 n=normalize(vec3(-g.x,1.,-g.y));vec3 V=normalize(cameraPosition-vW);vec3 R=reflect(-V,n);if(R.y<0.)R.y=-R.y*.3;
  float d=texture2D(aT,(vW.xz-fB.xy)*fB.zw+fB.zw).b*255./40.;
  vec3 hor=mix(vec3(.62,.74,.86),vec3(.6,.63,.66),cover),zen=mix(vec3(.08,.24,.55),vec3(.38,.42,.48),cover);vec3 sky=mix(hor,zen,pow(clamp(R.y,0.,1.),.35));
  sky=mix(sky,mix(vec3(.95,.95,.96),vec3(.6,.62,.66),cover),smoothstep(.5,.75,fb(R.xz/(R.y+.1)*.9))*smoothstep(.02,.2,R.y)*(.35+cover*.5));
  float fr=.02+.98*pow(1.-max(dot(n,V),0.),5.);fr=min(fr,.75);
  vec3 wc=mix(shalC,deepC,smoothstep(.15,5.,d));float sss=clamp(crest*.5+.5,0.,1.);wc+=shalC*.35*sss*pow(max(dot(-V,sunD)*.5+.5,0.),2.)*(1.-cover*.6);wc*=.75+.35*max(dot(n,sunD),0.);wc*=1.-cover*.35;
  vec3 c=mix(wc,sky,fr*.9);float sp=max(dot(R,sunD),0.);float sunV=1.-smoothstep(.55,.95,cover);
  c+=vec3(1.,.93,.8)*(pow(sp,700.)*18.+pow(sp,60.)*.35)*sunV;
  float gl=step(.86,vn(p*7.+t*1.3))*step(.6,vn(p*2.3-t*.7))*pow(sp,14.)*5.*sunV*hiQ;c+=vec3(1.,.95,.85)*gl*(1.-smoothstep(60.,400.,dist));
  // surf: lines of foam running in to the shore, a white shore-break and wind-blown whitecaps
  float bw=fb(p*.12+t*.02);float band=fract(d*.9-t*.22+bw*1.2);float lineF=smoothstep(0.,.05,band)*smoothstep(.2,.05,band)*smoothstep(3.2,.25,d);
  float tex=smoothstep(.38,.62,fb(p*1.4+vec2(t*.15,0.)));float fo=lineF*tex*1.3+smoothstep(.3,.04,d)*(.6+.4*tex);
  fo+=smoothstep(.72,1.,crest*.5+.5)*smoothstep(.55,.75,fb(p*.6-t*.1))*seaS*.55*smoothstep(1.5,4.,d);
  c=mix(c,vec3(.93,.95,.97)*(1.-cover*.25),clamp(fo,0.,1.)*.9);
  gl_FragColor=vec4(c,mix(.55,.98,smoothstep(0.,1.6,d))+clamp(fo,0.,1.)*.3);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <fog_fragment>\n}`});}
/* ---------- geometry helpers ---------- */
function gridGeo(nx,nz,x0,z0,cs,hf,skip){const pos=new Float32Array(nx*nz*3);for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=(j*nx+i)*3,x=x0+i*cs,z=z0+j*cs;pos[k]=x;pos[k+1]=hf(x,z,i,j);pos[k+2]=z;}
 const idx=[];for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){if(skip&&skip(x0+i*cs,z0+j*cs))continue;const a=j*nx+i,b=a+nx;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
/** merge [geometry, matrix?, color?] into one non-indexed geometry with position, normal, color and uv */
export function merge(list){let n=0,ix=0;const gs=list.map(([g,m,c])=>{g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);g.userData.c=c;n+=g.attributes.position.count;return g;});
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3),uv=new Float32Array(n*2);for(const g of gs){pos.set(g.attributes.position.array,ix*3);nor.set(g.attributes.normal.array,ix*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,ix*2);const c=g.userData.c||new THREE.Color(1,1,1),ca=g.attributes.color;
  for(let i=0;i<g.attributes.position.count;i++){if(ca){col[(ix+i)*3]=ca.getX(i);col[(ix+i)*3+1]=ca.getY(i);col[(ix+i)*3+2]=ca.getZ(i);}else{col[(ix+i)*3]=c.r;col[(ix+i)*3+1]=c.g;col[(ix+i)*3+2]=c.b;}}ix+=g.attributes.position.count;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('color',new THREE.BufferAttribute(col,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));return r;}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
function lumpy(geo,amt,seed){const p=geo.attributes.position,R=rng(seed);const o=[R()*9,R()*9,R()*9];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=1+(Math.sin(x*3.1+o[0])*Math.sin(y*2.7+o[1])*Math.sin(z*3.3+o[2]))*amt+Math.sin(x*7.3+y*5.1+o[2])*amt*.3;p.setXYZ(i,x*k,y*k,z*k);}geo.computeVertexNormals();return geo;}
/** tube through pts with radii, `rad` sides; uv.v runs along the length */
function tube(pts,radii,rad){const pos=[],nor=[],uv=[],idx=[];let len=0;const up=new V(0,1,0),T=new V(),N=new V(),B=new V(),q=new V();
 for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];T.subVectors(b,a).normalize();N.crossVectors(T,Math.abs(T.y)>.95?new V(1,0,0):up).normalize();B.crossVectors(T,N);if(i)len+=pts[i].distanceTo(pts[i-1]);
  for(let j=0;j<=rad;j++){const an=j/rad*Math.PI*2,c=Math.cos(an),s=Math.sin(an);q.copy(N).multiplyScalar(c).addScaledVector(B,s);pos.push(pts[i].x+q.x*radii[i],pts[i].y+q.y*radii[i],pts[i].z+q.z*radii[i]);nor.push(q.x,q.y,q.z);uv.push(j/rad,len*.5);}}
 for(let i=0;i<pts.length-1;i++)for(let j=0;j<rad;j++){const a=i*(rad+1)+j,b=a+rad+1;idx.push(a,b,a+1,a+1,b,b+1);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);return g;}
/** quad card centred at c, size w×h, oriented by euler; normals bent away from `ctr` for soft, volumetric foliage light */
function card(list,c,w,h,rx,ry,rz,ctr,ao){const g=new THREE.PlaneGeometry(w,h);g.applyMatrix4(M4(c.x,c.y,c.z,rx,ry,rz));const p=g.attributes.position,n=g.attributes.normal,col=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){const v=new V(p.getX(i),p.getY(i),p.getZ(i)),d=v.clone().sub(ctr);d.y*=1.5;d.y+=.9;d.normalize();n.setXYZ(i,d.x,d.y,d.z);const a=ao(v);col[i*3]=col[i*3+1]=col[i*3+2]=a;}
 g.setAttribute('color',new THREE.BufferAttribute(col,3));list.push([g,null,null]);}
/* ---------- shared assets (built once) ---------- */
let A=null;function assets(){if(A)return A;A={};const t0=performance.now();
 // ---- textures ----
 A.leafT=ctex(512,512,(x,w,h)=>{x.clearRect(0,0,w,h);const R=rng(77);
  for(let i=0;i<150;i++){const a=R()*6.283,r=Math.pow(R(),.7)*w*.38,cx=w/2+Math.cos(a)*r,cy=h/2+Math.sin(a)*r*.8;const da=Math.atan2(cy-h/2,cx-w/2);const L=14+R()*20;
   for(let k=0;k<14;k++){const b=da+(R()-.5)*2.4,l=L*(.6+R()*.6);const li=14+R()*22+(r/(w*.38))*-6+((cy<h/2)?6:0);x.strokeStyle=`hsl(${92+R()*26},${32+R()*18}%,${li}%)`;x.lineWidth=1.6+R()*1.6;x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(b)*l,cy+Math.sin(b)*l);x.stroke();}}
  for(let i=0;i<40;i++){x.fillStyle=`hsla(${80+R()*30},40%,${8+R()*8}%,.9)`;const a=R()*6.283,r=R()*w*.2;x.beginPath();x.arc(w/2+Math.cos(a)*r,h/2+Math.sin(a)*r*.8,4+R()*8,0,7);x.fill();}});
 A.gorseT=ctex(256,256,(x,w,h)=>{x.clearRect(0,0,w,h);const R=rng(31);for(let i=0;i<70;i++){const cx=w*(.12+R()*.76),cy=h*(.15+R()*.8);for(let k=0;k<12;k++){const b=-Math.PI/2+(R()-.5)*3,l=8+R()*14;x.strokeStyle=`hsl(${95+R()*25},${30+R()*15}%,${9+R()*14}%)`;x.lineWidth=1.3+R();x.beginPath();x.moveTo(cx,cy);x.lineTo(cx+Math.cos(b)*l,cy+Math.sin(b)*l);x.stroke();}}
  for(let i=0;i<120;i++){const cx=w*(.15+R()*.7),cy=h*(.12+R()*.6);x.fillStyle=`hsl(${44+R()*10},95%,${48+R()*16}%)`;x.beginPath();x.ellipse(cx,cy,2.4+R()*2,1.8+R()*1.5,R()*3,0,7);x.fill();}});
 // grass atlas: left half marram (tall, blue-green to straw), right half fescue wisps with seed heads
 A.grassT=ctex(512,512,(x,w,h)=>{x.clearRect(0,0,w,h);const R=rng(9);
  for(let i=0;i<70;i++){const bx=w*.25+(R()-.5)*w*.3,lean=(R()-.3)*w*.22,top=h*(.04+R()*.35);const g=x.createLinearGradient(0,h,0,top);const dry=R();
   g.addColorStop(0,`hsl(${80+dry*10},30%,14%)`);g.addColorStop(.5,dry<.5?`hsl(${85},26%,${34+R()*10}%)`:`hsl(48,40%,${46+R()*10}%)`);g.addColorStop(1,`hsl(${46+dry*8},${38+R()*15}%,${62+R()*16}%)`);x.strokeStyle=g;x.lineWidth=1.4+R()*2.2;x.beginPath();x.moveTo(bx,h);x.quadraticCurveTo(bx+lean*.25,h*.55,bx+lean,top);x.stroke();}
  for(let i=0;i<60;i++){const bx=w*.75+(R()-.5)*w*.36,lean=(R()-.4)*w*.25,top=h*(.08+R()*.45);x.strokeStyle=`hsl(${40+R()*25},${30+R()*20}%,${40+R()*30}%)`;x.lineWidth=.9+R()*1.2;x.beginPath();x.moveTo(bx,h);x.quadraticCurveTo(bx+lean*.3,h*.6,bx+lean,top);x.stroke();
   if(R()<.45){x.fillStyle=`hsl(${18+R()*20},${40+R()*25}%,${45+R()*20}%)`;x.beginPath();x.ellipse(bx+lean,top+6,2.2,8,lean/w,0,7);x.fill();}}},{clamp:true});
 A.barkT=ctex(128,256,(x,w,h)=>{x.fillStyle='#4a3b2e';x.fillRect(0,0,w,h);const R=rng(3);for(let i=0;i<500;i++){x.fillStyle=`rgba(${R()<.5?20:120},${R()<.5?14:100},${R()<.5?10:80},${.12+R()*.2})`;x.fillRect(R()*w,R()*h,2+R()*5,4+R()*20);}
  for(let i=0;i<22;i++){let xx=R()*w;x.strokeStyle='rgba(18,12,8,.75)';x.lineWidth=1.5+R()*2.5;x.beginPath();x.moveTo(xx,0);for(let y=0;y<=h;y+=16){xx+=(R()-.5)*6;x.lineTo(xx,y);}x.stroke();}});
 A.rockT=ctex(256,256,(x,w,h)=>{x.fillStyle='#7d776c';x.fillRect(0,0,w,h);const R=rng(4);for(let i=0;i<1400;i++){const v=90+R()*80|0;x.fillStyle=`rgba(${v},${v-6},${v-14},.25)`;x.fillRect(R()*w,R()*h,1+R()*6,1+R()*3);}
  for(let i=0;i<14;i++){x.strokeStyle=`rgba(40,36,30,${.3+R()*.3})`;x.lineWidth=1+R()*2;const y=R()*h;x.beginPath();x.moveTo(0,y);for(let xx=0;xx<=w;xx+=16)x.lineTo(xx,y+Math.sin(xx*.05+i)*5+(R()-.5)*4);x.stroke();}
  for(let i=0;i<40;i++){x.fillStyle=R()<.6?`rgba(200,160,70,${.25+R()*.3})`:`rgba(170,180,150,${.25+R()*.3})`;x.beginPath();x.arc(R()*w,R()*h,2+R()*7,0,7);x.fill();}});
 // ---- pine variants: bent trunk, branches streaming downwind (+z), flat pads of leaf cards ----
 A.trees=[0,1].map(v=>{const R=rng(101+v*57),H=6.1+R()*1.2,lean=2.3+R()*1.2,kink=R()*3;const bark=[],leaf=[];
  const tp=t=>new V(Math.sin(t*3+kink)*.28*t,H*t*(1-.1*t),Math.pow(t,1.7)*lean);
  const tps=[],tr=[];for(let i=0;i<=10;i++){const t=i/10;tps.push(tp(t));tr.push(.27*(1-t*.78)+.14*Math.max(0,1-t*7));}bark.push([tube(tps,tr,8),null,null]);
  const pads=[];const nb=8+v*2;for(let k=0;k<nb;k++){const t0=.4+.56*(k/(nb-1))+(R()-.5)*.04,b0=tp(t0),side=(k%2?1:-1)*(.45+R()*.7);
   const dir=new V(side,.18+R()*.3+t0*.15,.5+R()*.8).normalize(),L=(2.9-t0*1.4)*(.8+R()*.45);const bp=[],br=[];
   for(let s=0;s<=4;s++){const u=s/4;bp.push(b0.clone().addScaledVector(dir,L*u).add(new V(0,.3*L*u*u,.3*L*u*u)));br.push(.1*(1-t0*.55)*(1-u*.8));}bark.push([tube(bp,br,5),null,null]);
   for(const u of[.55,.82,1]){const i=u*4,a=bp[Math.floor(i)],b=bp[Math.min(4,Math.ceil(i))];pads.push({c:a.clone().lerp(b,i%1),s:(1.6+R()*.9)*(1.2-t0*.3)});}}
  pads.push({c:tp(1).add(new V(0,.25,.4)),s:2.2},{c:tp(.92).add(new V(.9,0,.8)),s:2},{c:tp(.86).add(new V(-.9,.1,.6)),s:1.9},{c:tp(.95).add(new V(0,.1,1.6)),s:2.1});
  const ctr=new V();pads.forEach(p=>ctr.add(p.c));ctr.multiplyScalar(1/pads.length);let y0=1e9,y1=-1e9;pads.forEach(p=>{y0=Math.min(y0,p.c.y);y1=Math.max(y1,p.c.y);});
  const ao=p=>.62+.38*Math.min(1,Math.max(0,(p.y-y0+.6)/(y1-y0+1.2)))*(.7+.3*Math.min(1,p.distanceTo(ctr)/3));
  for(const p of pads){const s=p.s;card(leaf,p.c.clone().add(new V(0,.12,0)),s*1.9,s*1.5,-Math.PI/2+(R()-.5)*.5,R()*6,0,ctr,ao);card(leaf,p.c,s*1.6,s*1.0,(R()-.5)*.3,R()*3,0,ctr,ao);card(leaf,p.c,s*1.6,s*1.0,(R()-.5)*.3,R()*3+1.57,0,ctr,ao);
   card(leaf,p.c.clone().add(new V(0,-.15,0)),s*1.5,s*1.2,-Math.PI/2+(R()-.5)*.6,R()*6,0,ctr,ao);}
  return{bark:merge(bark),leaf:merge(leaf)};});
 // gorse bush: dome of cards
 {const l=[],ctr=new V(0,.3,0);const R=rng(55);for(let k=0;k<12;k++){const a=k/12*6.283+R()*.3,r=.35+R()*.3,c=new V(Math.cos(a)*r,.35+R()*.35,Math.sin(a)*r);card(l,c,1.1+R()*.4,.85+R()*.3,(R()-.5)*.6,-a+1.57,0,ctr,p=>.55+.45*Math.min(1,p.y/1.1));}
  card(l,new V(0,.85,0),1.3,1.3,-Math.PI/2,R()*3,0,ctr,()=>1);A.gorse=merge(l);}
 // grass tufts: 3 crossed bendable cards, uv.x into one atlas half
 const tuftGeo=(u0)=>{const qs=[];for(let k=0;k<3;k++){const q=new THREE.PlaneGeometry(1.3,1.15,1,3);q.translate(0,.575,0);q.rotateY(k*Math.PI/3+.3);const uv=q.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,u0+uv.getX(i)*.5);qs.push([q,null,null]);}
  const g=merge(qs);const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);return g;};
 A.marram=tuftGeo(0);A.fescue=tuftGeo(.5);
 A.rock=lumpy(new THREE.DodecahedronGeometry(1,2),.2,3);
 // gull: body + two wings (wing tips flap in the shader)
 {const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,.3,-1,.05,-.1,0,0,-.2, 0,0,.3,0,0,-.2,1,.05,-.1, 0,0,.35,0,-.06,-.4,0,.04,-.4],3));g.computeVertexNormals();A.gull=g;}
 A.ms=performance.now()-t0;return A;}
/* ---------- wind-swayed instanced foliage ---------- */
function swayMat(m,U,amt,kind){m.onBeforeCompile=sh=>{sh.uniforms.time=U.time;sh.uniforms.wdir=U.wdir;sh.uniforms.wstr=U.wstr;
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float time,wstr;uniform vec2 wdir;').replace('#include <begin_vertex>',`#include <begin_vertex>
 vec4 ip=instanceMatrix*vec4(0.,0.,0.,1.);float gust=.55+.45*sin(dot(ip.xz,wdir)*.07-time*1.9)*sin(dot(ip.xz,wdir.yx)*.031+time*.7);
 ${kind===0?'float sw=uv.y*uv.y;':'float sw=max(position.y,0.)*.12;sw*=sw;'}
 vec2 push=wdir*wstr*${amt.toFixed(3)}*(.5+gust)+vec2(sin(time*2.3+ip.x*.4+position.x),cos(time*1.9+ip.z*.5+position.z))*${(amt*.25).toFixed(3)}*(.4+wstr);
 transformed.xz+=(inverse(mat3(instanceMatrix))*vec3(push.x,0.,push.y)).xz*sw;`);};
 m.customProgramCacheKey=()=>'sway'+kind+amt;return m;}
/* ---------- build ---------- */
export function buildHole(scene,T,o){assets();const G=new THREE.Group();scene.add(G);const q=o.q,wx=o.weather||WEATHER.clear;const out={group:G,time:{value:0},update:null,flag:null,disposables:[],foliage:[]};
 const fT=dataTex(T.F,T.nx,T.nz),aT=dataTex(T.A,T.nx,T.nz);out.disposables.push(fT,aT);
 const U={fT:{value:fT},aT:{value:aT},fB:{value:new THREE.Vector4(T.x0,T.z0,1/(CS*T.nx),1/(CS*T.nz))},hD:{value:new THREE.Vector2(T.hd.x,T.hd.z)},teeP:{value:new THREE.Vector2(T.tee.x,T.tee.z)},time:out.time,cover:{value:wx.cover},wet:{value:wx.wet},rain:{value:wx.rain},
  wdir:{value:new THREE.Vector2(Math.sin(WIND_DIR),Math.cos(WIND_DIR))},wstr:{value:.6},seaS:{value:wx.sea}};out.U=U;
 // sky + light
 const sky=new THREE.Mesh(new THREE.SphereGeometry(8000,32,16),skyMat(U,true));sky.renderOrder=-1;G.add(sky);out.sky=sky;out.disposables.push(sky.material);
 const hemi=new THREE.HemisphereLight(new THREE.Color(.78,.87,1).lerp(new THREE.Color(.8,.82,.85),wx.cover),0x5a6034,wx.hemi);G.add(hemi);
 const key=new THREE.DirectionalLight(new THREE.Color(1,.88,.72).lerp(new THREE.Color(.9,.92,.95),wx.cover),wx.sun);key.castShadow=true;const ext=95;Object.assign(key.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:520});key.shadow.bias=-.0003;key.shadow.normalBias=.04;
 const s=q===2?4096:q===1?2048:1024;key.shadow.mapSize.set(s,s);G.add(key,key.target);out.key=key;
 if(q>0){const fill=new THREE.DirectionalLight(0xbcd2ff,.35+wx.cover*.2);fill.position.set(-SUN.x,.4,-SUN.z);G.add(fill);}
 out.focus=p=>{key.target.position.set(p.x,p.y,p.z);key.position.set(p.x+SUN.x*250,p.y+SUN.y*250,p.z+SUN.z*250);};
 // terrain
 const gm=groundMat(U,q);out.disposables.push(gm);
 const ground=new THREE.Mesh(gridGeo(T.nx,T.nz,T.x0,T.z0,CS,(x,z,i,j)=>T.hf[j*T.nx+i]),gm);ground.receiveShadow=true;G.add(ground);
 const fc=q===0?30:20,cx=Math.round((T.x0+T.x1)/40)*20,cz=Math.round((T.z0+T.z1)/40)*20,FR=q===0?1800:1800,fn=Math.round(FR*2/fc)+1;
 const farG=gridGeo(fn,fn,cx-FR,cz-FR,fc,(x,z)=>{let y=T.far(x,z);const inx=x>T.x0&&x<T.x1&&z>T.z0&&z<T.z1;return inx?y-4:y;},(x,z)=>x>=T.x0&&x+fc<=T.x1&&z>=T.z0&&z+fc<=T.z1);
 const farM=new THREE.Mesh(farG,gm);farM.receiveShadow=true;G.add(farM);
 // sea + ponds + burn
 const sea=new THREE.Mesh(new THREE.PlaneGeometry(9000,9000,1,1).rotateX(-Math.PI/2),waterMat(U,{deep:0x0a3d5c,shal:0x2a9c9a,amp:1,scale:1,q:q?1:0}));sea.position.set(cx,0,cz);sea.renderOrder=1;G.add(sea);out.disposables.push(sea.material);
 const pondM=waterMat(U,{deep:0x14394a,shal:0x3d7a68,amp:.35,scale:3.2,q:q?1:0});out.disposables.push(pondM);
 const wood=new THREE.MeshStandardMaterial({map:A.barkT,color:0xb08a66,roughness:.85});out.disposables.push(wood);
 for(const w of T.water){let m;if(w.burn!=null){const p=T.ptAt(w.burn,0),p2=T.ptAt(w.burn+2,0),a=Math.atan2(p2.x-p.x,p2.z-p.z);m=new THREE.Mesh(new THREE.PlaneGeometry(420,w.w*2+12).rotateX(-Math.PI/2),pondM);m.rotation.y=a+Math.PI/2;m.position.set(p.x,w.lvl,p.z);
   const parts=[],L=w.w*2+5;parts.push([new THREE.BoxGeometry(2.2,.16,L),M4(0,.75,0)]);for(let k=-6;k<=6;k++)parts.push([new THREE.BoxGeometry(2.3,.05,.16),M4(0,.85,k*L/13)]);
   for(const sx of[-1,1]){parts.push([new THREE.CylinderGeometry(.045,.045,L,6).rotateX(Math.PI/2),M4(sx*1.05,1.6,0)]);for(let k=-2;k<=2;k++)parts.push([new THREE.BoxGeometry(.11,1.1,.11),M4(sx*1.05,1.1,k*(L-1)/4)]);}
   const bg=new THREE.Mesh(merge(parts),wood);bg.castShadow=bg.receiveShadow=true;const pp=T.ptAt(w.burn,7);bg.position.set(pp.x,w.lvl+.5,pp.z);bg.rotation.y=a;G.add(bg);out.disposables.push(bg.geometry);}
  else{m=new THREE.Mesh(new THREE.CircleGeometry(Math.max(w.a,w.b)*1.75,48).rotateX(-Math.PI/2),pondM);m.position.set(w.x,w.lvl,w.z);}
  m.renderOrder=1;G.add(m);}
 const R=rng(T.def.seed*31+7);
 // trees: bark + leaf-card crowns, two variants
 if(T.trees.length){const bm=new THREE.MeshStandardMaterial({map:A.barkT,bumpMap:A.barkT,bumpScale:2,roughness:.95,color:0x9a8a7a}),lm=swayMat(new THREE.MeshStandardMaterial({map:A.leafT,alphaTest:.36,side:THREE.DoubleSide,vertexColors:true,roughness:.85,envMapIntensity:.5,color:0xd8e4c0}),U,.25,1);out.disposables.push(bm,lm);
  const mm=new THREE.Matrix4(),col=new THREE.Color();
  for(let v=0;v<2;v++){const list=T.trees.filter((_,k)=>k%2===v);if(!list.length)continue;const bi=new THREE.InstancedMesh(A.trees[v].bark,bm,list.length),li=new THREE.InstancedMesh(A.trees[v].leaf,lm,list.length);
   list.forEach((t,k)=>{mm.copy(M4(t.x,t.y-.25,t.z,0,WIND_DIR+(R()-.5)*.35,0,t.s,t.s*(.9+R()*.2),t.s));bi.setMatrixAt(k,mm);li.setMatrixAt(k,mm);col.setHSL(.2+R()*.07,.3+R()*.2,.62+R()*.25);li.setColorAt(k,col);});
   bi.castShadow=li.castShadow=true;bi.receiveShadow=li.receiveShadow=true;li.userData.noAO=true;G.add(bi,li);out.foliage.push(li);}}
 // gorse, marram and fescue out of play
 const spots=(n,test,bias)=>{const r=[];for(let k=0;k<n*10&&r.length<n;k++){const x=T.x0+12+R()*(T.x1-T.x0-24),z=T.z0+12+R()*(T.z1-T.z0-24);if(!test(x,z))continue;if(bias&&R()>Math.max(.18,1-(-T.field(x,z,3))/45))continue;const y=T.h(x,z);if(y<1.2)continue;r.push([x,y,z]);}return r;};
 const inDeep=(x,z)=>!(T.field(x,z,3)>-1||T.field(x,z,2)>-1.5||T.field(x,z,1)>-6);
 const gorse=spots([30,110,200][q],(x,z)=>inDeep(x,z)&&T.field(x,z,3)<-6&&(!T.sea||T.coast(x,z)<-10));
 if(gorse.length){const m=swayMat(new THREE.MeshStandardMaterial({map:A.gorseT,alphaTest:.45,side:THREE.DoubleSide,vertexColors:true,roughness:.9,envMapIntensity:.4}),U,.05,1);out.disposables.push(m);const im=new THREE.InstancedMesh(A.gorse,m,gorse.length);const col=new THREE.Color();
  gorse.forEach((p,k)=>{const s=.9+R()*1.1;im.setMatrixAt(k,M4(p[0],p[1]-.1,p[2],0,R()*6.3,0,s*1.3,s*(.8+R()*.4),s*1.2));col.setHSL(.2+R()*.06,.3,.75+R()*.3);im.setColorAt(k,col);});im.castShadow=q>0;im.receiveShadow=true;im.userData.noAO=true;G.add(im);out.foliage.push(im);}
 const tm=swayMat(new THREE.MeshStandardMaterial({map:A.grassT,alphaTest:.45,side:THREE.DoubleSide,roughness:1,color:0xeae4c6}),U,.28,0);out.disposables.push(tm);
 const tufts=spots([700,4200,8000][q],inDeep,true);
 if(tufts.length){const im=new THREE.InstancedMesh(A.marram,tm,tufts.length),col=new THREE.Color();tufts.forEach((p,k)=>{const s=.7+R()*.9;im.setMatrixAt(k,M4(p[0],p[1]-.05,p[2],0,R()*6.3,0,s,s*(.8+R()*.6),s));col.setHSL(.12+R()*.08,.3,.72+R()*.35);im.setColorAt(k,col);});im.receiveShadow=true;im.userData.noAO=true;G.add(im);out.foliage.push(im);}
 if(q>0){const fes=spots([0,1600,3400][q],(x,z)=>T.field(x,z,3)<.5&&T.field(x,z,3)>-8&&T.field(x,z,0)<-2&&T.field(x,z,1)<-5&&T.field(x,z,2)<-1.5);
  if(fes.length){const im=new THREE.InstancedMesh(A.fescue,tm,fes.length),col=new THREE.Color();fes.forEach((p,k)=>{const s=.45+R()*.45;im.setMatrixAt(k,M4(p[0],p[1]-.04,p[2],0,R()*6.3,0,s,s*(.7+R()*.5),s));col.setHSL(.1+R()*.06,.35,.8+R()*.3);im.setColorAt(k,col);});im.receiveShadow=true;im.userData.noAO=true;G.add(im);out.foliage.push(im);}}
 // rocks along the shoreline and cliff foot
 if(T.sea){const rk=[];for(let k=0;k<4000&&rk.length<(T.sea.cliff?150:60);k++){const x=T.x0+R()*(T.x1-T.x0),z=T.z0+R()*(T.z1-T.z0),c=T.coast(x,z);if(c<(T.sea.cliff?-2:4)||c>(T.sea.cliff?16:20))continue;rk.push([x,T.h(x,z),z]);}
  const m=new THREE.MeshStandardMaterial({map:A.rockT,bumpMap:A.rockT,bumpScale:.8,roughness:.9,color:0x8e877c});out.disposables.push(m);const im=new THREE.InstancedMesh(A.rock,m,Math.max(1,rk.length));
  rk.forEach((p,k)=>{const s=.6+R()*R()*(T.sea.cliff?3:1.6);im.setMatrixAt(k,M4(p[0],p[1]-s*.35,p[2],R()*.4,R()*3,R()*.4,s,s*(.4+R()*.35),s*(.7+R()*.5)));});im.count=rk.length;im.castShadow=im.receiveShadow=true;G.add(im);}
 // tee blocks
 const td=T.tdir,tmk=new THREE.MeshStandardMaterial({color:0x1d4fd8,roughness:.45,metalness:.05});out.disposables.push(tmk);const tg=new THREE.CylinderGeometry(.075,.09,.13,10);
 for(const sx of[-1,1]){const m=new THREE.Mesh(tg,tmk);const x=T.tee.x+Math.cos(td)*sx*3+Math.sin(td)*1.5,z=T.tee.z-Math.sin(td)*sx*3+Math.cos(td)*1.5;m.position.set(x,T.h(x,z)+.06,z);m.castShadow=true;G.add(m);}
 // flagstick + flag + cup
 const pin=T.pin,py=T.h(pin.x,pin.z);const pm=new THREE.MeshStandardMaterial({color:0xf4f4f0,roughness:.3});out.disposables.push(pm);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,2.3,8),pm);pole.position.set(pin.x,py+1.15,pin.z);pole.castShadow=true;G.add(pole);
 const ft=ctex(128,96,(x,w,h)=>{x.fillStyle='#ffd21f';x.fillRect(0,0,w,h);x.fillStyle='#d01f1f';x.fillRect(0,h*.78,w,h*.22);x.fillStyle='#14161c';x.font='bold 54px Anton, Impact, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(String(T.i+1),w*.5,h*.42);},{clamp:true});
 const fg=new THREE.PlaneGeometry(.62,.42,10,4);fg.translate(.31,0,0);const fm=new THREE.MeshStandardMaterial({map:ft,side:THREE.DoubleSide,roughness:.8});out.disposables.push(fm,ft);
 fm.onBeforeCompile=sh=>{sh.uniforms.time=out.time;sh.uniforms.wstr=U.wstr;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float time,wstr;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat w=position.x/.62;float k=.5+wstr*1.2;transformed.z+=(sin(position.x*9.-time*9.*k)*.07*w+sin(position.x*5.-time*5.3*k)*.04*w)*min(1.4,k);transformed.y-=w*w*.03;');};
 const flag=new THREE.Mesh(fg,fm);flag.position.set(pin.x,py+2.06,pin.z);flag.castShadow=true;G.add(flag);out.flag=flag;out.pole=pole;
 const cup=new THREE.Mesh(new THREE.CircleGeometry(.056,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x050607,polygonOffset:true,polygonOffsetFactor:-4}));cup.position.set(pin.x,py+.012,pin.z);G.add(cup);
 const lin=new THREE.Mesh(new THREE.RingGeometry(.05,.064,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2f2f2,polygonOffset:true,polygonOffsetFactor:-4}));lin.position.copy(cup.position);G.add(lin);out.disposables.push(cup.material,lin.material);
 // landmarks
 if(T.def.lh){const lg=new THREE.Group();const bt=ctex(64,256,(x,w,h)=>{for(let i=0;i<6;i++){x.fillStyle=i%2?'#c8231f':'#f6f4ee';x.fillRect(0,i*h/6,w,h/6+1);}x.fillStyle='rgba(60,40,30,.12)';for(let i=0;i<300;i++)x.fillRect(Math.random()*w,Math.random()*h,1,3+Math.random()*8);});
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(2.2,3.3,26,24,1),new THREE.MeshStandardMaterial({map:bt,roughness:.6}));tower.position.y=13;lg.add(tower);
  const gal=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.1,.5,24),new THREE.MeshStandardMaterial({color:0x22262c,roughness:.5}));gal.position.y=26.2;lg.add(gal);
  const rail=new THREE.Mesh(new THREE.CylinderGeometry(3.05,3.05,1,24,1,true),new THREE.MeshStandardMaterial({color:0x22262c,roughness:.5,wireframe:true}));rail.position.y=26.9;lg.add(rail);
  const lan=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,3,16),new THREE.MeshStandardMaterial({color:0xfff2c0,emissive:0xffe9a0,emissiveIntensity:1.6,roughness:.1}));lan.position.y=28;lg.add(lan);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(2.2,2.4,16),new THREE.MeshStandardMaterial({color:0xb21d1a,roughness:.5}));cap.position.y=30.7;lg.add(cap);
  const hut=new THREE.Mesh(new THREE.BoxGeometry(7,4,5),new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.8}));hut.position.set(5,2,3);lg.add(hut);const rf=new THREE.Mesh(new THREE.CylinderGeometry(.01,4.6,2.4,4,1),new THREE.MeshStandardMaterial({color:0x3a3f48,roughness:.7}));rf.rotation.y=Math.PI/4;rf.scale.set(1.1,1,.8);rf.position.set(5,5.2,3);lg.add(rf);
  let best=null;for(let k=0;k<600;k++){const d=40+R()*90,l=(R()-.3)*80;const x=T.gc.x+T.hd.x*d+T.left.x*T.sea.side*l,z=T.gc.z+T.hd.z*d+T.left.z*T.sea.side*l;const c=T.coast(x,z);if(c>-16&&c<-7&&T.h(x,z)>4){best={x,z};break;}}
  if(best){lg.position.set(best.x,T.h(best.x,best.z)-.5,best.z);lg.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});G.add(lg);out.lighthouse=lg;}}
 if(T.def.club){const cg=new THREE.Group();const stuc=ctex(256,256,(x,w,h)=>{x.fillStyle='#efe9dc';x.fillRect(0,0,w,h);for(let i=0;i<2000;i++){const v=200+Math.random()*50|0;x.fillStyle=`rgba(${v},${v-4},${v-14},.3)`;x.fillRect(Math.random()*w,Math.random()*h,2,2);}});
  const slate=ctex(128,128,(x,w,h)=>{x.fillStyle='#3a414c';x.fillRect(0,0,w,h);for(let r=0;r<16;r++)for(let c=0;c<8;c++){const v=50+Math.random()*25|0;x.fillStyle=`rgb(${v},${v+5},${v+14})`;x.fillRect(c*16+(r%2)*8,r*8,15,7);}});stuc.repeat.set(4,1);slate.repeat.set(6,2);
  const wall=new THREE.MeshStandardMaterial({map:stuc,roughness:.85}),roof=new THREE.MeshStandardMaterial({map:slate,roughness:.6}),win=new THREE.MeshStandardMaterial({color:0x223040,roughness:.08,metalness:.4,emissive:0x101820});
  const body=new THREE.Mesh(new THREE.BoxGeometry(34,7,12),wall);body.position.y=3.5;cg.add(body);const rs=new THREE.Shape();rs.moveTo(-6.6,0);rs.lineTo(0,4.4);rs.lineTo(6.6,0);const rg=new THREE.ExtrudeGeometry(rs,{depth:35,bevelEnabled:false});rg.translate(0,0,-17.5);rg.rotateY(Math.PI/2);
  const r=new THREE.Mesh(rg,roof);r.position.y=7;cg.add(r);const wins=[];for(let k=-6;k<=6;k++)wins.push([new THREE.BoxGeometry(1.6,2.2,.2),M4(k*2.5,3.6,-6.05)]);cg.add(new THREE.Mesh(merge(wins),win));
  const tw=new THREE.Mesh(new THREE.BoxGeometry(5,13,5),wall);tw.position.set(-12,6.5,0);cg.add(tw);const tr=new THREE.Mesh(new THREE.ConeGeometry(4.2,4,4),roof);tr.rotation.y=Math.PI/4;tr.position.set(-12,15,0);cg.add(tr);
  const fp=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,9,6),new THREE.MeshStandardMaterial({color:0xffffff}));fp.position.set(14,11.5,-3);cg.add(fp);
  const p={x:T.gc.x+T.hd.x*62,z:T.gc.z+T.hd.z*62};cg.position.set(p.x,T.h(p.x,p.z)-.3,p.z);cg.rotation.y=Math.atan2(T.hd.x,T.hd.z);cg.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true;}});G.add(cg);}
 // sailboats offshore (merged hull + sail)
 if(T.sea){const boat=new THREE.Mesh(merge([[new THREE.BoxGeometry(1.6,.8,6),M4(0,.3,0),new THREE.Color(.11,.17,.3)],[new THREE.CylinderGeometry(.05,.05,8,5),M4(0,4.6,.2),new THREE.Color(.8,.8,.8)],[(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,1,-2,0,8.5,-.1,0,1,2.2],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,1,1,0],2));g.computeVertexNormals();return g;})(),null,new THREE.Color(1.6,1.6,1.55)]]),new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.6}));
  const bi=new THREE.InstancedMesh(boat.geometry,boat.material,3);out.disposables.push(boat.geometry,boat.material);for(let k=0;k<3;k++){const d=T.sea.d+220+R()*700,al=R()*T.S*1.5-100;bi.setMatrixAt(k,M4(T.tee.x+T.hd.x*al+T.left.x*T.sea.side*d,0,T.tee.z+T.hd.z*al+T.left.z*T.sea.side*d,0,R()*6,0,1.6));}G.add(bi);}
 // gulls wheeling over the links
 let gulls=null;if(q>0){const gm2=new THREE.MeshStandardMaterial({color:0xf2f2f0,roughness:.7,side:THREE.DoubleSide});gm2.onBeforeCompile=sh=>{sh.uniforms.time=out.time;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float time;').replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 ip=instanceMatrix*vec4(0.,0.,0.,1.);transformed.y+=abs(position.x)*sin(time*7.+ip.x*.3)*.55;');};
  gulls=new THREE.InstancedMesh(A.gull,gm2,7);gulls.frustumCulled=false;out.disposables.push(gm2);G.add(gulls);gulls.userData.c=[];for(let k=0;k<7;k++)gulls.userData.c.push({x:T.gc.x+(R()-.5)*160,z:T.gc.z-T.hd.z*R()*200+(R()-.5)*80,y:T.h(T.gc.x,T.gc.z)+22+R()*25,r:20+R()*40,s:(.15+R()*.2)*(R()<.5?-1:1),p:R()*6});}
 // rain streaks around the camera
 let rain=null;if(wx.rain>0){const N=[900,2200,3600][q],pos=new Float32Array(N*6),R2=rng(5);for(let i=0;i<N;i++){const x=(R2()-.5)*70,y=R2()*36,z=(R2()-.5)*70;pos.set([x,y,z,x,y,z],i*6);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));const m=new THREE.ShaderMaterial({uniforms:{time:out.time,camP:{value:new V()},wv:{value:new V()}},transparent:true,depthWrite:false,
   vertexShader:'uniform float time;uniform vec3 camP,wv;varying float vA;void main(){vec3 p=position;float top=mod(float(gl_VertexID/2)*.618,1.)*36.;float fall=time*16.;vec3 b=vec3(p.x,mod(p.y-fall,36.),p.z);if(gl_VertexID%2==1){b.y+=.42;b.xz-=wv.xz*.03;}b.xz=mod(b.xz-camP.xz-wv.xz*time+35.,70.)-35.;vec3 w=camP+b+vec3(0.,-12.,0.);vA=(.16+.12*mod(float(gl_VertexID/2)*.37,1.))*(1.-smoothstep(8.,34.,length(b.xz)));gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);}',
   fragmentShader:'varying float vA;void main(){gl_FragColor=vec4(vec3(.78,.82,.88),vA);}'});rain=new THREE.LineSegments(g,m);rain.frustumCulled=false;rain.renderOrder=6;G.add(rain);out.disposables.push(m,g);}
 out.setWind=(w)=>{const m=Math.hypot(w.x,w.z)||1e-3;U.wdir.value.set(w.x/m,w.z/m);U.wstr.value=Math.min(1.6,w.mph/14);};
 const qq=new THREE.Quaternion(),mm=new THREE.Matrix4(),e=new THREE.Euler();
 out.update=(dt,camPos)=>{out.time.value+=dt;sky.position.copy(camPos);
  if(gulls){const t=out.time.value;gulls.userData.c.forEach((g,k)=>{const a=g.p+t*g.s,x=g.x+Math.cos(a)*g.r,z=g.z+Math.sin(a)*g.r;e.set(Math.sin(t*.7+k)*.15,-a+(g.s>0?0:Math.PI),Math.sin(t+k)*.3*Math.sign(g.s));qq.setFromEuler(e);mm.compose(new V(x,g.y+Math.sin(t*.5+k)*2,z),qq,new V(.6,.6,.6));gulls.setMatrixAt(k,mm);});gulls.instanceMatrix.needsUpdate=true;}
  if(rain){rain.material.uniforms.camP.value.copy(camPos);rain.material.uniforms.wv.value.set(U.wdir.value.x*U.wstr.value*4,0,U.wdir.value.y*U.wstr.value*4);}};
 const shared=new Set([A.marram,A.fescue,A.rock,A.gorse,A.gull,...A.trees.flatMap(t=>[t.bark,t.leaf])]);
 out.dispose=()=>{scene.remove(G);G.traverse(c=>{if(c.geometry&&!shared.has(c.geometry))c.geometry.dispose();});out.disposables.forEach(d=>d.dispose&&d.dispose());};
 out.assetMs=A.ms;return out;}
