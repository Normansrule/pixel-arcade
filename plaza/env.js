// PENGUIN PLAZA — reusable environment pieces: sky dome with stars + aurora, sparkly snow material, pines, falling snow,
// footprint decals, water, batching, day/night palette.
import {THREE,V3,M,merge,cl,lerp,rnd,sstep} from './util.js';
const G=THREE;

export class Batch{constructor(){this.l=[];}add(g,m,c){this.l.push([g,m,c]);return this;}get n(){return this.l.length;}
 mesh(material,o={}){if(!this.l.length)return new G.Group();const m=new G.Mesh(merge(this.l),material);m.castShadow=o.cast??true;m.receiveShadow=o.recv??true;this.l=[];return m;}}

/* ---------- sky ---------- */
export function skyDome(r=700){const U={top:{value:new G.Color(0x5aa8ff)},hor:{value:new G.Color(0xd8ecff)},bot:{value:new G.Color(0xe8f0ff)},sunDir:{value:new V3(0,1,0)},sunCol:{value:new G.Color(1,.9,.7)},stars:{value:0},aurora:{value:0},time:{value:0},moonDir:{value:new V3(0,1,0)}};
 const m=new G.Mesh(new G.SphereGeometry(r,48,24),new G.ShaderMaterial({uniforms:U,side:G.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
  fragmentShader:`uniform vec3 top,hor,bot,sunCol,sunDir,moonDir;uniform float stars,aurora,time;varying vec3 vD;
  float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=fract(sin(dot(i,vec2(12.9,78.2)))*43758.5),b=fract(sin(dot(i+vec2(1,0),vec2(12.9,78.2)))*43758.5),c=fract(sin(dot(i+vec2(0,1),vec2(12.9,78.2)))*43758.5),d=fract(sin(dot(i+vec2(1,1),vec2(12.9,78.2)))*43758.5);return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
  void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=h>0.?mix(hor,top,pow(sstep(0.,1.,h),.55)):mix(hor,bot,sstep(0.,-.25,h));
   float sd=max(dot(d,normalize(sunDir)),0.);c+=sunCol*(pow(sd,900.)*6.+pow(sd,12.)*.35+pow(sd,3.)*.12)*sstep(-.15,.05,sunDir.y+.1);
   if(stars>0.&&h>0.){vec3 q=floor(d*260.);float s=h3(q);float tw=.6+.4*sin(time*2.+s*90.);c+=vec3(.9,.95,1.)*step(.9965,s)*tw*stars*sstep(0.,.25,h)*1.4;
    float md=max(dot(d,normalize(moonDir)),0.);c+=vec3(.9,.95,1.)*(sstep(.9993,.9996,md)*1.6+pow(md,80.)*.18)*stars;}
   if(aurora>0.&&h>0.){float a=0.;for(int i=0;i<3;i++){float fi=float(i);vec2 p=d.xz/(h+.25)*1.4;float band=sin(p.x*1.3+fi*1.7+time*.12+n2(p*1.2+time*.05)*3.)*.5+.5;float y=sstep(.08,.3,h)*sstep(.75,.35,h);
     a+=pow(band,6.)*y*(.6+.4*n2(vec2(p.x*6.+time*.4,fi)));}
    c+=mix(vec3(.15,1.,.6),vec3(.55,.3,1.),sstep(.2,.55,h))*a*aurora*.55;}
   gl_FragColor=vec4(c,1.);}`.replace(/sstep/g,'smoothstep')}));m.frustumCulled=false;m.renderOrder=-10;m.userData.U=U;return m;}

// palette keyframes by hour (7 → 23)
const KEYS=[
 {h:6.5,top:0x34407a,hor:0xf0a890,sun:0xffb080,si:.9,hs:0x8090c8,hg:0xc8b0b0,hi:.55,fog:0xd8b8b8,night:.35},
 {h:8,top:0x5a8ee0,hor:0xffd8b8,sun:0xffd8a8,si:1.7,hs:0xb0c8ff,hg:0xd8d0d0,hi:.58,fog:0xe8dcd8,night:0},
 {h:11,top:0x4a9cf6,hor:0xcfe6ff,sun:0xfff4e4,si:2.1,hs:0xb8d0ff,hg:0xdcdce4,hi:.62,fog:0xd8e8fa,night:0},
 {h:15,top:0x4f9af0,hor:0xd4e6ff,sun:0xfff0d8,si:2.0,hs:0xb8ccff,hg:0xdcdad6,hi:.6,fog:0xd8e6f6,night:0},
 {h:17.6,top:0x4a62b8,hor:0xffb07a,sun:0xffa060,si:2.1,hs:0x9090d0,hg:0xb89880,hi:.48,fog:0xf0c0a0,night:.05},
 {h:19,top:0x2a2e72,hor:0xd86a7a,sun:0xff7050,si:.6,hs:0x5a5aa0,hg:0x806078,hi:.4,fog:0x7a5a80,night:.5},
 {h:20.3,top:0x0c1440,hor:0x2a3a78,sun:0x8aa0ff,si:.36,hs:0x3a4a8a,hg:0x2a3050,hi:.34,fog:0x203060,night:.85},
 {h:23.5,top:0x040a22,hor:0x142456,sun:0x9ab0ff,si:.3,hs:0x34449a,hg:0x1c2244,hi:.3,fog:0x16244e,night:1},
];
const tc=new G.Color(),tc2=new G.Color();
export function palette(h){let a=KEYS[0],b=KEYS[KEYS.length-1];for(let i=0;i<KEYS.length-1;i++){if(h>=KEYS[i].h&&h<=KEYS[i+1].h){a=KEYS[i];b=KEYS[i+1];break;}}if(h<KEYS[0].h)b=a;if(h>b.h)a=b;
 const k=a===b?0:sstep(0,1,(h-a.h)/(b.h-a.h)),C=key=>new G.Color(a[key]).lerp(tc2.set(b[key]),k);
 // sun arc: rises east (+x), sets west (-x); moon opposite
 const f=cl((h-6)/(19.5-6),0,1),ang=f*Math.PI;const sunDir=new V3(Math.cos(ang),Math.sin(ang)*.9+.08,-.35).normalize();
 const night=lerp(a.night,b.night,k);const moonDir=new V3(-.4,.75,-.55).normalize();
 return{top:C('top'),hor:C('hor'),sun:C('sun'),si:lerp(a.si,b.si,k),hs:C('hs'),hg:C('hg'),hi:lerp(a.hi,b.hi,k),fog:C('fog'),night,sunDir,moonDir,lightDir:night>.6?moonDir:sunDir};}

/* ---------- sparkly snow ---------- */
export function snowMaterial(o={}){const m=new G.MeshStandardMaterial({color:o.color??0xffffff,vertexColors:o.vc??true,roughness:.82,metalness:0,envMapIntensity:.55});const U={uT:{value:0},uSpark:{value:o.spark??1}};m.userData.U=U;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWp=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;uniform float uT,uSpark;float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}')
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   {vec2 cell=floor(vWp.xz*14.);float g=hs(cell);vec3 vd=normalize(vViewPosition);float tw=sin(g*91.+dot(vd,vec3(17.,11.,23.))*9.+uT*1.5);
    float sp=step(.982,g)*pow(max(tw,0.),12.)*uSpark;vec2 f=fract(vWp.xz*14.)-.5;sp*=smoothstep(.35,0.,length(f));totalEmissiveRadiance+=vec3(1.,.98,.95)*sp*2.2*max(.0,normal.y*.5+.5);}`);};
 m.customProgramCacheKey=()=>'snowspark';return m;}

/* ---------- pines ---------- */
export function pineGeometry(snow=true){const L=[[new G.CylinderGeometry(.22,.32,1.4,7),M(0,.7,0),0x6a4a32]];
 for(let i=0;i<3;i++){const r=2.1-i*.55,h=2.2-i*.3,y=1.3+i*1.15;L.push([new G.ConeGeometry(r,h,9),M(0,y+h/2,0),i%2?0x2f6e48:0x2a6442]);if(snow)L.push([new G.ConeGeometry(r*.78,h*.5,9),M(0,y+h*.78,0),0xf4f8ff]);}
 return merge(L);}
export function instancedPines(scene,pts,o={}){const geo=pineGeometry(o.snow??true);const m=new G.InstancedMesh(geo,new G.MeshStandardMaterial({vertexColors:true,roughness:.85,envMapIntensity:.45}),pts.length);
 const m4=new G.Matrix4(),q=new G.Quaternion(),c=new G.Color();pts.forEach((p,i)=>{const s=p.s??(.7+rnd(.7));q.setFromAxisAngle(new V3(0,1,0),rnd(7));m4.compose(new V3(p.x,p.y,p.z),q,new V3(s,s*(.85+rnd(.3)),s));m.setMatrixAt(i,m4);c.setHSL(.36+rnd(.05),.25+rnd(.2),.75+rnd(.25));m.setColorAt(i,c);});
 m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}

/* ---------- falling snow around the camera ---------- */
export class Snowfall{constructor(scene,n=2600,box=60){this.n=n;this.box=box;const p=new Float32Array(n*3),s=new Float32Array(n);for(let i=0;i<n;i++){p[i*3]=rnd(-box,box);p[i*3+1]=rnd(0,box*.8);p[i*3+2]=rnd(-box,box);s[i]=rnd(.6,1.6);}
  const g=new G.BufferGeometry();g.setAttribute('position',new G.BufferAttribute(p,3));g.setAttribute('sz',new G.BufferAttribute(s,1));this.U={uT:{value:0},uC:{value:new V3()},uBox:{value:box},uScale:{value:400},uA:{value:.9},uWind:{value:new V3(1.2,0,.4)},uFall:{value:2.2},uCol:{value:new G.Color(1,1,1)}};
  this.pts=new G.Points(g,new G.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,fog:false,
   vertexShader:`attribute float sz;uniform float uT,uBox,uScale,uFall;uniform vec3 uC,uWind;varying float vA;
    void main(){vec3 p=position;float sp=uFall*(.6+sz*.4);p.y-=uT*sp;p.xz+=uWind.xz*uT*(.5+sz*.3)+vec2(sin(uT*.7+p.y*.3+sz*9.),cos(uT*.6+p.x*.2))*.8;
     vec3 r=mod(p-uC+vec3(uBox,0.,uBox),vec3(uBox*2.,uBox*.8,uBox*2.))-vec3(uBox,0.,uBox);r.y+=uC.y-uBox*.25;vec4 mv=modelViewMatrix*vec4(uC.x+r.x,r.y,uC.z+r.z,1.);
     vA=smoothstep(uBox*1.2,uBox*.4,-mv.z)*smoothstep(.5,3.,-mv.z);gl_PointSize=sz*.13*uScale/max(.5,-mv.z);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:'uniform float uA;uniform vec3 uCol;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.15,d)*vA*uA;if(a<.01)discard;gl_FragColor=vec4(uCol,a);}'}));
  this.pts.frustumCulled=false;this.pts.renderOrder=6;scene.add(this.pts);}
 update(dt,center,cam,h,pr){this.U.uT.value+=dt;this.U.uC.value.copy(center);this.U.uScale.value=h*pr/(2*Math.tan(cam.fov*Math.PI/360));}}

/* ---------- footprints (multiply-blended instanced decals) ---------- */
export class Footprints{constructor(scene,n=500){this.n=n;this.i=0;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,64,64);
  // webbed three-toed print
  x.fillStyle='#000';x.beginPath();x.ellipse(32,40,10,13,0,0,7);x.fill();for(const a of[-.55,0,.55]){x.save();x.translate(32,34);x.rotate(a);x.beginPath();x.ellipse(0,-14,4,11,0,0,7);x.fill();x.restore();}
  const t=new G.CanvasTexture(c);const g=new G.PlaneGeometry(.42,.42);g.rotateX(-Math.PI/2);this.life=new Float32Array(n);
  const ib=new G.InstancedBufferAttribute(this.life,1);ib.setUsage(G.DynamicDrawUsage);g.setAttribute('life',ib);this.attr=ib;
  this.mesh=new G.InstancedMesh(g,new G.ShaderMaterial({uniforms:{map:{value:t},tint:{value:new G.Color(.72,.78,.9)}},transparent:true,depthWrite:false,blending:G.CustomBlending,blendSrc:G.DstColorFactor,blendDst:G.ZeroFactor,side:G.DoubleSide,
   polygonOffset:true,polygonOffsetFactor:-4,
   vertexShader:'attribute float life;varying float vL;varying vec2 vUv;void main(){vL=life;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
   fragmentShader:'uniform sampler2D map;uniform vec3 tint;varying float vL;varying vec2 vUv;void main(){float k=(1.-texture2D(map,vUv).r)*clamp(vL,0.,1.);gl_FragColor=vec4(mix(vec3(1.),tint,k),1.);}'}),n);
  this.mesh.frustumCulled=false;this.mesh.renderOrder=1;const m4=new G.Matrix4().makeScale(0,0,0);for(let i=0;i<n;i++)this.mesh.setMatrixAt(i,m4);scene.add(this.mesh);this.m4=new G.Matrix4();this.q=new G.Quaternion();this.up=new V3(0,1,0);}
 add(x,y,z,ry,side){const i=this.i;this.i=(i+1)%this.n;this.q.setFromAxisAngle(this.up,ry);this.m4.compose(new V3(x,y+.03,z),this.q,new V3(side?1:-1,1,1));this.mesh.setMatrixAt(i,this.m4);this.life[i]=1;this.mesh.instanceMatrix.needsUpdate=true;}
 update(dt){const L=this.life;let ch=false;for(let i=0;i<this.n;i++)if(L[i]>0){L[i]-=dt/22;ch=true;}if(ch)this.attr.needsUpdate=true;}
 clear(){this.life.fill(0);this.attr.needsUpdate=true;}}

/* ---------- water ---------- */
export function waterMaterial(col=0x2a7ea0){const m=new G.MeshStandardMaterial({color:col,roughness:.12,metalness:.1,envMapIntensity:1.1,transparent:true,opacity:.92});const U={uT:{value:0}};m.userData.U=U;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uT;varying vec3 vWp;').replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 wp0=(modelMatrix*vec4(transformed,1.)).xyz;transformed.z+=sin(wp0.x*.15+uT*1.1)*.12+cos(wp0.z*.12+uT*.9)*.12;')
  .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWp=(modelMatrix*vec4(transformed,1.)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uT;varying vec3 vWp;').replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   {vec2 p=vWp.xz;float dx=cos(p.x*.9+uT*1.7)*.09+cos(p.x*2.3-p.y*1.1+uT*2.6)*.05+cos((p.x+p.y)*4.1+uT*3.)*.025;float dz=cos(p.y*.8-uT*1.4)*.09+cos(p.y*2.1+p.x*1.3+uT*2.2)*.05+cos((p.y-p.x)*3.7-uT*2.7)*.025;
    normal=normalize(normal+(viewMatrix*vec4(dx,0.,dz,0.)).xyz);}`)
  .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat fres=pow(1.-max(dot(normalize(vViewPosition),normal),0.),4.);totalEmissiveRadiance+=vec3(.5,.7,.85)*fres*.25;');};
 m.customProgramCacheKey=()=>'water';return m;}
