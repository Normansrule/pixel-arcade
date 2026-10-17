// RUNLINE — visuals: procedural textures, world-mapped PBR materials, district skies, level meshes, set dressing, hazards, particles.
import * as THREE from '../vendor/three.module.min.js';
import {Box,World} from './physics.js';
const V=THREE.Vector3,TAU=Math.PI*2;
let SEED=1;const rnd=()=>{SEED=(SEED*16807)%2147483647;return(SEED-1)/2147483646;};const rr=(a,b)=>a+(b-a)*rnd();

/* ======================= textures ======================= */
export function ctex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=o.clamp?THREE.ClampToEdgeWrapping:THREE.RepeatWrapping;
 if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;return t;}
const noise=(x,w,h,n,a,col='0,0,0')=>{for(let i=0;i<n;i++){x.fillStyle=`rgba(${col},${Math.random()*a})`;x.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}};
const DISP="Anton, Impact, 'Arial Black', sans-serif";
let TX=null;
function textures(){if(TX)return TX;TX={};
 TX.white=ctex(4,4,(x)=>{x.fillStyle='#fff';x.fillRect(0,0,4,4);});
 // day facade: 6 m tile, two floors, two windows each
 TX.facDay=ctex(512,512,(x,w,h)=>{x.fillStyle='#ebe8e2';x.fillRect(0,0,w,h);noise(x,w,h,6000,.05);
  for(let f=0;f<2;f++){const y0=f*256;x.fillStyle='#d6d2ca';x.fillRect(0,y0+236,w,20);
   for(let k=0;k<2;k++){const x0=k*256+34;const g=x.createLinearGradient(0,y0+40,0,y0+210);g.addColorStop(0,'#9db8d2');g.addColorStop(.45,'#4d6a88');g.addColorStop(1,'#2a3a50');x.fillStyle=g;x.fillRect(x0,y0+40,188,170);
    x.fillStyle='rgba(255,255,255,.18)';x.beginPath();x.moveTo(x0+20,y0+40);x.lineTo(x0+80,y0+40);x.lineTo(x0+20,y0+150);x.fill();
    x.fillStyle='#c9c4ba';x.fillRect(x0+92,y0+40,5,170);x.fillRect(x0,y0+120,188,4);x.fillStyle='#bdb7ab';x.fillRect(x0-6,y0+210,200,8);}}});
 TX.roofGravel=ctex(512,512,(x,w,h)=>{x.fillStyle='#cbc7be';x.fillRect(0,0,w,h);noise(x,w,h,26000,.16);noise(x,w,h,6000,.12,'255,255,255');
  x.strokeStyle='rgba(60,55,50,.35)';x.lineWidth=3;for(let i=0;i<=2;i++){x.beginPath();x.moveTo(i*256,0);x.lineTo(i*256,h);x.stroke();x.beginPath();x.moveTo(0,i*256);x.lineTo(w,i*256);x.stroke();}
  x.fillStyle='rgba(80,70,60,.12)';for(let i=0;i<6;i++){x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,40+Math.random()*60,20+Math.random()*40,Math.random()*3,0,7);x.fill();}});
 TX.conc=ctex(256,256,(x,w,h)=>{x.fillStyle='#e7e5e0';x.fillRect(0,0,w,h);noise(x,w,h,7000,.07);x.strokeStyle='rgba(0,0,0,.12)';x.lineWidth=2;x.strokeRect(0,0,w,h);});
 TX.metal=ctex(256,256,(x,w,h)=>{x.fillStyle='#8a9098';x.fillRect(0,0,w,h);for(let i=0;i<400;i++){x.fillStyle=`rgba(255,255,255,${Math.random()*.06})`;x.fillRect(0,Math.random()*h,w,1);}noise(x,w,h,3000,.08);
  x.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<4;i++)x.fillRect(0,i*64,w,2);});
 TX.ribs=ctex(256,256,(x,w,h)=>{for(let i=0;i<w;i++){const v=150+Math.sin(i/w*TAU*8)*55;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(i,0,1,h);}noise(x,w,h,3000,.1);x.fillStyle='rgba(0,0,0,.35)';x.fillRect(0,0,w,4);});
 TX.facNight=ctex(512,512,(x,w,h)=>{x.fillStyle='#2a2c35';x.fillRect(0,0,w,h);noise(x,w,h,8000,.15);
  for(let f=0;f<4;f++)for(let k=0;k<4;k++){x.fillStyle='#10131a';x.fillRect(k*128+18,f*128+22,92,80);}x.fillStyle='#1d1f27';for(let f=0;f<4;f++)x.fillRect(0,f*128+116,w,12);});
 TX.facNightE=ctex(512,512,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);const C=['#ffcf8a','#ffd9a0','#a8d8ff','#ff9be0','#fff1c8'];
  for(let f=0;f<4;f++)for(let k=0;k<4;k++){if(Math.random()<.42){const c=C[Math.random()*C.length|0];const g=x.createLinearGradient(0,f*128+22,0,f*128+102);g.addColorStop(0,c);g.addColorStop(1,'#40301a');x.fillStyle=g;x.globalAlpha=.5+Math.random()*.5;x.fillRect(k*128+18,f*128+22,92,80);x.globalAlpha=1;
   if(Math.random()<.5){x.fillStyle='rgba(0,0,0,.6)';x.fillRect(k*128+18+Math.random()*60,f*128+22,10+Math.random()*30,80);}}}});
 TX.roofMetal=ctex(512,512,(x,w,h)=>{x.fillStyle='#2c2f37';x.fillRect(0,0,w,h);noise(x,w,h,20000,.18);x.strokeStyle='rgba(0,0,0,.5)';x.lineWidth=3;for(let i=0;i<4;i++){x.beginPath();x.moveTo(i*128,0);x.lineTo(i*128,h);x.stroke();}
  x.fillStyle='rgba(120,140,190,.07)';for(let i=0;i<14;i++){x.beginPath();x.ellipse(Math.random()*w,Math.random()*h,30+Math.random()*70,12+Math.random()*30,0,0,7);x.fill();}});
 TX.facTower=ctex(512,512,(x,w,h)=>{x.fillStyle='#efebe4';x.fillRect(0,0,w,h);noise(x,w,h,5000,.05);
  for(let k=0;k<4;k++){const g=x.createLinearGradient(k*128,0,k*128+90,0);g.addColorStop(0,'#8fa9c4');g.addColorStop(.5,'#cfdceb');g.addColorStop(1,'#6f86a3');x.fillStyle=g;x.fillRect(k*128+20,0,88,h);x.fillStyle='#c9a35a';x.fillRect(k*128+18,0,3,h);x.fillRect(k*128+106,0,3,h);}
  x.fillStyle='#ddd6c9';for(let f=0;f<4;f++)x.fillRect(0,f*128,w,10);});
 TX.roofTile=ctex(512,512,(x,w,h)=>{for(let i=0;i<8;i++)for(let j=0;j<8;j++){const v=226+Math.random()*14;x.fillStyle=`rgb(${v},${v-4},${v-10})`;x.fillRect(i*64,j*64,64,64);}x.strokeStyle='rgba(120,110,95,.4)';x.lineWidth=2;
  for(let i=0;i<=8;i++){x.beginPath();x.moveTo(i*64,0);x.lineTo(i*64,h);x.stroke();x.beginPath();x.moveTo(0,i*64);x.lineTo(w,i*64);x.stroke();}x.fillStyle='rgba(200,160,80,.5)';x.fillRect(0,0,w,4);x.fillRect(0,0,4,h);});
 TX.grid=ctex(256,256,(x,w,h)=>{x.fillStyle='#000';x.fillRect(0,0,w,h);x.strokeStyle='#fff';x.lineWidth=3;x.strokeRect(1.5,1.5,w-3,h-3);x.globalAlpha=.35;x.lineWidth=1.5;x.beginPath();x.moveTo(w/2,0);x.lineTo(w/2,h);x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();});
 TX.panel=ctex(256,256,(x,w,h)=>{x.fillStyle='#d9dde3';x.fillRect(0,0,w,h);noise(x,w,h,3000,.06);x.fillStyle='rgba(0,0,0,.2)';x.fillRect(0,0,w,3);x.fillRect(0,0,3,h);x.fillStyle='#ff5a1f';x.fillRect(0,h*.46,w,h*.08);});
 TX.cracks=ctex(256,256,(x,w,h)=>{x.fillStyle='#d8d4cc';x.fillRect(0,0,w,h);noise(x,w,h,5000,.1);x.strokeStyle='rgba(40,30,25,.55)';x.lineWidth=1.6;
  for(let i=0;i<9;i++){let px=Math.random()*w,py=Math.random()*h;x.beginPath();x.moveTo(px,py);for(let k=0;k<7;k++){px+=(Math.random()-.5)*60;py+=(Math.random()-.5)*60;x.lineTo(px,py);}x.stroke();}
  x.fillStyle='#e8b400';for(let i=0;i<w;i+=32){x.save();x.translate(i,0);x.transform(1,0,.6,1,0,0);x.fillRect(0,0,14,10);x.fillRect(0,h-10,14,10);x.restore();}});
 TX.glass=ctex(256,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#cfe6f7');g.addColorStop(.5,'#8fb4d6');g.addColorStop(1,'#d9ecf8');x.fillStyle=g;x.fillRect(0,0,w,h);x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=4;x.strokeRect(2,2,w-4,h-4);});
 TX.hazard=ctex(128,128,(x,w,h)=>{x.fillStyle='#1b1b1b';x.fillRect(0,0,w,h);x.fillStyle='#f2b400';for(let i=-2;i<4;i++){x.beginPath();x.moveTo(i*48,0);x.lineTo(i*48+24,0);x.lineTo(i*48+24+h,h);x.lineTo(i*48+h,h);x.fill();}});
 return TX;}
// billboard / sign artwork — original fictional brands
const ADS=[
 {bg:['#ff5a1f','#ffb03a'],t:'VOLTA',s:'SPARKLING CITRUS · ICE COLD',fg:'#fff',mark:'circle'},
 {bg:['#1b3cff','#14c8ff'],t:'SKYWARD',s:'FLY THE CITY · NO STOPS',fg:'#fff',mark:'wing'},
 {bg:['#f4f1ea','#e2ddd2'],t:'HALCYON',s:'HOMES ABOVE THE NOISE',fg:'#111',mark:'sun'},
 {bg:['#111318','#2c2f3a'],t:'KINETIC',s:'SHOES THAT FORGET GRAVITY',fg:'#ff4d00',mark:'bolt'},
 {bg:['#ffcf2e','#ff8a1e'],t:'NOODLE ORBIT',s:'HOT BOWLS · 24/7',fg:'#1a1206',mark:'circle'},
 {bg:['#2a0b44','#ff2fb4'],t:'NEONHAUS',s:'OPEN ALL NIGHT',fg:'#fff',mark:'bolt'}];
const adCache={};
export function adTex(i){i=((i%ADS.length)+ADS.length)%ADS.length;if(adCache[i])return adCache[i];const a=ADS[i];
 return adCache[i]=ctex(1024,512,(x,w,h)=>{const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,a.bg[0]);g.addColorStop(1,a.bg[1]);x.fillStyle=g;x.fillRect(0,0,w,h);
  x.globalAlpha=.16;x.fillStyle='#fff';for(let k=0;k<8;k++){x.beginPath();x.arc(w*.8+Math.cos(k)*80,h*.5,260-k*30,0,TAU);x.fill();}x.globalAlpha=1;
  x.fillStyle=a.fg;x.font=`400 ${a.t.length>8?150:190}px ${DISP}`;x.textBaseline='middle';x.fillText(a.t,60,h*.44);x.font=`700 34px 'JetBrains Mono', monospace`;x.globalAlpha=.85;x.fillText(a.s,66,h*.78);x.globalAlpha=1;
  x.strokeStyle=a.fg;x.lineWidth=14;x.beginPath();if(a.mark==='circle')x.arc(w-170,h*.42,90,0,TAU);else if(a.mark==='sun'){x.arc(w-170,h*.46,70,0,TAU);for(let k=0;k<12;k++){const r=k/12*TAU;x.moveTo(w-170+Math.cos(r)*95,h*.46+Math.sin(r)*95);x.lineTo(w-170+Math.cos(r)*125,h*.46+Math.sin(r)*125);}}
  else if(a.mark==='wing'){x.moveTo(w-300,h*.55);x.quadraticCurveTo(w-170,h*.2,w-60,h*.3);x.moveTo(w-300,h*.6);x.quadraticCurveTo(w-160,h*.35,w-80,h*.45);}else{x.moveTo(w-150,h*.15);x.lineTo(w-230,h*.5);x.lineTo(w-150,h*.5);x.lineTo(w-210,h*.85);}x.stroke();
  x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=10;x.strokeRect(5,5,w-10,h-10);},{clamp:true});}

/* ======================= materials ======================= */
export const HINT={value:1};
// world-space projected textures (side/top), optional emissive windows on sides, optional runner-vision tint
let ENVI=1;
function wmat(o){const m=new THREE.MeshStandardMaterial({envMapIntensity:o.envI??ENVI,color:o.color??0xffffff,roughness:o.rough??.8,metalness:o.metal??0,map:o.side||TX.white,vertexColors:!!o.vc,transparent:!!o.transparent,opacity:o.opacity??1});
 if(o.emis){m.emissiveMap=o.emis;m.emissive=new THREE.Color(o.emisCol??0xffffff);m.emissiveIntensity=o.emisI??1;}
 if(o.flatEmis){m.emissive=new THREE.Color(o.flatEmis);m.emissiveIntensity=o.emisI??1;}
 const hint=!!o.hint,emTop=!!o.emisTop;
 m.onBeforeCompile=sh=>{sh.uniforms.tTop={value:o.top||o.side||TX.white};sh.uniforms.uS={value:new THREE.Vector2(o.ss??.25,o.ts??.25)};sh.uniforms.uHint=HINT;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;varying vec3 vWn;').replace('#include <begin_vertex>',`#include <begin_vertex>
  vec4 wp_=vec4(transformed,1.);vec3 wn_=objectNormal;
  #ifdef USE_INSTANCING
   wp_=instanceMatrix*wp_;wn_=mat3(instanceMatrix)*wn_;
  #endif
  vWp=(modelMatrix*wp_).xyz;vWn=normalize(mat3(modelMatrix)*wn_);`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWp;varying vec3 vWn;uniform sampler2D tTop;uniform vec2 uS;uniform float uHint;')
   .replace('#include <map_fragment>',`vec3 an_=abs(vWn);bool top_=an_.y>max(an_.x,an_.z)*1.15;
    vec2 wuv_=top_?vWp.xz*uS.y:(an_.x>an_.z?vec2(vWp.z*sign(vWn.x),vWp.y):vec2(-vWp.x*sign(vWn.z),vWp.y))*uS.x;
    vec4 sampledDiffuseColor=top_?texture2D(tTop,wuv_):texture2D(map,wuv_);diffuseColor*=sampledDiffuseColor;
    ${hint?'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.82,.035,.02)*(.55+.45*dot(sampledDiffuseColor.rgb,vec3(.33))),uHint*.9);':''}`)
   .replace('#include <emissivemap_fragment>',`${o.emis?`totalEmissiveRadiance*=texture2D(emissiveMap,wuv_).rgb;${emTop?'':'if(top_)totalEmissiveRadiance*=0.;'}`:''}
    ${hint?'totalEmissiveRadiance+=vec3(.42,.02,.01)*uHint;':''}`);};
 m.customProgramCacheKey=()=>'rl'+(o.emis?1:0)+(hint?1:0)+(emTop?1:0)+(o.vc?1:0);return m;}
// plain textured material with optional hint (used for ad faces etc.)
function hmat(map,o={}){const m=new THREE.MeshStandardMaterial({map,roughness:o.rough??.5,metalness:0,emissive:new THREE.Color(o.em??0x000000),emissiveMap:o.em?map:null,emissiveIntensity:o.emI??1});
 if(o.hint){m.onBeforeCompile=sh=>{sh.uniforms.uHint=HINT;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uHint;').replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.8,.04,.02)*(.4+.6*dot(diffuseColor.rgb,vec3(.33))),uHint*.75);')
  .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance=mix(totalEmissiveRadiance,vec3(.35,.02,.01),uHint);');};m.customProgramCacheKey=()=>'adh';}return m;}

/* ======================= districts ======================= */
export const DPOST=[
 {exposure:.8,bloom:.22,bloomThreshold:3.2,bloomRadius:.4,saturation:1.14,tint:0xfff6ee,vignette:.3},
 {exposure:1,bloom:.7,bloomThreshold:1.15,bloomRadius:.55,saturation:1.15,tint:0xf2ecff,vignette:.42},
 {exposure:.8,bloom:.3,bloomThreshold:3,bloomRadius:.45,saturation:1.1,tint:0xfffaf6,vignette:.32}];
function matsFor(d){textures();ENVI=[.5,1,.55][d];const M={};
 if(d===0){M.bld=o=>wmat({side:TX.facDay,top:TX.roofGravel,ss:1/6,ts:1/8,rough:.85,...o});M.par=o=>wmat({side:TX.conc,rough:.8,...o});M.wall=o=>wmat({side:TX.metal,color:0xe8e8ea,metal:.4,rough:.5,...o});
  M.beam=o=>wmat({side:TX.metal,color:0xf2b51a,metal:.5,rough:.45,...o});M.ramp=o=>wmat({side:TX.ribs,top:TX.ribs,color:0xdfe3e8,metal:.6,rough:.35,ss:.6,ts:.6,...o});M.surf=o=>wmat({side:TX.panel,top:TX.panel,ss:.2,ts:.2,rough:.5,...o});
  M.acc=o=>wmat({side:TX.conc,color:0xff5a1f,rough:.6,...o});M.pipe=o=>wmat({side:TX.metal,color:0xd9dde3,metal:.7,rough:.35,...o});M.plat=o=>wmat({side:TX.cracks,top:TX.cracks,ss:.3,ts:.3,...o});}
 if(d===1){M.bld=o=>wmat({side:TX.facNight,top:TX.roofMetal,ss:1/8,ts:1/8,rough:.42,metal:.25,emis:TX.facNightE,emisI:2.2,...o});M.par=o=>wmat({side:TX.metal,color:0x3b3f4a,metal:.6,rough:.4,...o});
  M.wall=o=>wmat({side:TX.ribs,ss:1/2.6,color:0xffffff,metal:.5,rough:.45,vc:true,...o});M.beam=o=>wmat({side:TX.metal,color:0x5a6070,metal:.7,rough:.35,...o});
  M.ramp=o=>wmat({side:TX.metal,top:TX.grid,ss:.5,ts:.5,color:0x23262e,metal:.6,rough:.3,emis:TX.grid,emisCol:0x19e3ff,emisI:1.4,emisTop:true,...o});
  M.surf=o=>wmat({side:TX.grid,top:TX.grid,ss:.4,ts:.4,color:0x1d2029,metal:.5,rough:.3,emis:TX.grid,emisCol:0xff2fb4,emisI:1.6,emisTop:true,...o});
  M.acc=o=>wmat({side:TX.hazard,top:TX.hazard,ss:1,ts:1,rough:.6,...o});M.pipe=o=>wmat({side:TX.metal,color:0x9aa3b0,metal:.8,rough:.3,...o});M.plat=o=>wmat({side:TX.grid,top:TX.grid,ss:.8,ts:.8,color:0x8a8f99,metal:.8,rough:.35,...o});}
 if(d===2){M.bld=o=>wmat({side:TX.facTower,top:TX.roofTile,ss:1/8,ts:1/6,rough:.3,metal:.15,...o});M.par=o=>wmat({side:TX.conc,color:0xf0e2c4,metal:.35,rough:.35,...o});
  M.wall=o=>wmat({side:TX.glass,ss:.12,color:0xbcd8f2,metal:.6,rough:.12,...o});M.beam=o=>wmat({side:TX.glass,top:TX.roofTile,ss:.3,ts:.5,color:0xffffff,metal:.3,rough:.2,...o});
  M.ramp=o=>wmat({side:TX.conc,top:TX.panel,ss:.3,ts:.25,color:0xffffff,rough:.25,metal:.2,...o});M.surf=o=>wmat({side:TX.panel,top:TX.panel,ss:.2,ts:.2,rough:.3,...o});
  M.acc=o=>wmat({side:TX.conc,color:0xd8a24a,metal:.8,rough:.3,...o});M.pipe=o=>wmat({side:TX.metal,color:0xe8e2d8,metal:.8,rough:.25,...o});M.plat=o=>wmat({side:TX.glass,top:TX.glass,ss:.25,ts:.25,color:0xe0f0ff,metal:.4,rough:.08,...o});}
 M.conc=o=>wmat({side:TX.conc,rough:.8,...o});M.metal=o=>wmat({side:TX.metal,color:d===1?0x4a505c:d===2?0xb8b2a8:0x6a707a,metal:.7,rough:.4,...o});
 M.neon=o=>wmat({side:TX.white,color:0x000000,flatEmis:d===1?0x19e3ff:d===2?0xffc46a:0xff6a1a,emisI:d===1?4:2.5,...o});
 M.crane=o=>wmat({side:TX.metal,color:0xf2b51a,metal:.55,rough:.45,...o});M.glass=o=>wmat({side:TX.glass,color:0xcfe3f5,metal:.7,rough:.1,...o});
 M.dark=o=>wmat({side:TX.metal,color:0x30343c,metal:.6,rough:.5,...o});M.white=o=>wmat({side:TX.conc,color:0xf6f6f4,rough:.55,...o});M.cont=o=>wmat({side:TX.ribs,ss:1/2.6,vc:true,metal:.5,rough:.5,...o});
 M.lamp=o=>wmat({side:TX.white,color:0x000000,flatEmis:d===1?0xff2fb4:0xfff2d0,emisI:3,...o});M.green=o=>wmat({side:TX.conc,color:0x5f8f4a,rough:.9,...o});
 return M;}

export function setupDistrict(d,R,scene){const S={d,objs:[]};const add=o=>{scene.add(o);S.objs.push(o);return o;};
 const sunDir=d===0?new V(.55,.62,.3).normalize():d===1?new V(-.4,.55,-.5).normalize():new V(-.6,.42,-.62).normalize();S.sunDir=sunDir;
 const fogC=d===0?0xb4cbe2:d===1?0x150f26:0xe9c4b4;scene.fog=new THREE.FogExp2(fogC,d===0?.0015:d===1?.0048:.0009);scene.background=new THREE.Color(fogC);
 let skyMesh;
 if(d===1){skyMesh=new THREE.Mesh(new THREE.SphereGeometry(3000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uMoon:{value:sunDir}},
   vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
   fragmentShader:`uniform vec3 uMoon;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=d.y;vec3 c=mix(vec3(.07,.03,.12),vec3(.004,.008,.03),smoothstep(-.02,.45,h));
    c+=vec3(.55,.12,.4)*pow(1.-clamp(abs(h),0.,1.),9.)*.55+vec3(.1,.25,.5)*pow(1.-clamp(abs(h-.04),0.,1.),20.)*.4;
    vec3 q=floor(d*360.);float s=fract(sin(dot(q,vec3(12.9898,78.233,37.719)))*43758.5453);c+=step(.9984,s)*smoothstep(.02,.3,h)*vec3(.9,.95,1.)*(.5+.5*fract(s*91.));
    float m=dot(d,normalize(uMoon));c+=vec3(1.,.98,.92)*smoothstep(.99955,.9998,m)*3.+vec3(.25,.3,.6)*pow(max(m,0.),300.)*.6;gl_FragColor=vec4(c,1.);}`}));skyMesh.frustumCulled=false;}
 else{const P=d===0?{z:[.035,.16,.62],h:[.5,.66,.86],g:[.42,.5,.6],sc:[1.6,1.4,1.1],ss:6}:{z:[.035,.11,.5],h:[1.0,.72,.58],g:[.75,.66,.72],sc:[1.6,1.05,.6],ss:8};
  skyMesh=new THREE.Mesh(new THREE.SphereGeometry(3000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:{uZ:{value:new V(...P.z)},uH:{value:new V(...P.h)},uG:{value:new V(...P.g)},uS:{value:sunDir},uSC:{value:new V(...P.sc)},uSS:{value:P.ss}},
   vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
   fragmentShader:`uniform vec3 uZ,uH,uG,uS,uSC;uniform float uSS;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=d.y;
    vec3 c=mix(uH,uZ,pow(smoothstep(0.,1.,max(h,0.)),.38));c=mix(c,uG,smoothstep(0.,-.25,h));
    float s=max(dot(d,normalize(uS)),0.);c+=uSC*(pow(s,6.)*.18+pow(s,60.)*.5)+uSC*smoothstep(.9993,.9997,s)*uSS;
    float hz=1.-abs(h);c+=uH*pow(hz,24.)*.15;gl_FragColor=vec4(c,1.);}`}));skyMesh.frustumCulled=false;}
 add(skyMesh);S.sky=skyMesh;
 // environment map from the sky
 const pm=new THREE.PMREMGenerator(R);const es=new THREE.Scene();const sk=skyMesh.clone();es.add(sk);
 if(d===1){const glow=new THREE.Mesh(new THREE.SphereGeometry(50,16,8),new THREE.MeshBasicMaterial({color:0xff2fb4,side:THREE.BackSide}));glow.scale.y=.08;glow.position.y=-6;es.add(glow);}
 S.env=pm.fromScene(es,.03,.1,6000).texture;scene.environment=S.env;pm.dispose();
 const hemi=add(new THREE.HemisphereLight(d===0?0xc8dcff:d===1?0x3c3a78:0xc8d6ff,d===0?0x7a7264:d===1?0x180c1e:0x8a7a9a,d===0?.6:d===1?.55:.65));
 const sun=add(new THREE.DirectionalLight(d===0?0xfff0da:d===1?0x9fb0ff:0xffdcb8,d===0?2.7:d===1?.75:2.7));sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:260});sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;add(sun.target);S.sun=sun;S.hemi=hemi;
 if(d===2){// cloud sea
  const cm=new THREE.ShaderMaterial({fog:false,uniforms:{uT:{value:0},uCam:{value:new V()},uFog:{value:new THREE.Color(fogC)},uSun:{value:sunDir}},
   vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
   fragmentShader:`uniform float uT;uniform vec3 uCam,uFog,uSun;varying vec3 vW;
    float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
    float H(vec2 p){return fbm(p)*.72+fbm(p*2.9+3.1)*.38;}
    void main(){vec2 p=vW.xz*.0055+vec2(uT*.005,uT*.002);float f=H(p);const float e=.015;float fx=H(p+vec2(e,0.))-f,fz=H(p+vec2(0.,e))-f;
     vec3 n=normalize(vec3(-fx*22.,1.,-fz*22.));float lit=clamp(dot(n,normalize(uSun))*.9+.4,0.,1.);float h=smoothstep(.4,.8,f);
     vec3 L=vec3(1.4,1.18,1.02),S=vec3(.62,.6,.8),D=vec3(.36,.36,.55);vec3 c=mix(D,mix(S,L,lit),smoothstep(.0,.55,h));
     vec3 vd=normalize(vW-uCam);c+=vec3(1.2,.6,.3)*pow(max(0.,dot(normalize(vec3(vd.x,0.,vd.z)),normalize(vec3(uSun.x,0.,uSun.z)))),6.)*h*.35;
     float d=length(vW.xz-uCam.xz);c=mix(c,uFog,smoothstep(300.,2800.,d));gl_FragColor=vec4(c,1.);}`});
  const cs=add(new THREE.Mesh(new THREE.PlaneGeometry(9000,9000),cm));cs.rotation.x=-Math.PI/2;S.clouds=cs;}
 S.update=(t,cam,focus)=>{if(S.clouds){S.clouds.material.uniforms.uT.value=t;S.clouds.material.uniforms.uCam.value.copy(cam.position);S.clouds.position.x=cam.position.x;S.clouds.position.z=cam.position.z;}
  if(focus){sun.position.copy(focus).addScaledVector(sunDir,120);sun.target.position.copy(focus);}
  S.sky.position.copy(cam.position);};
 S.dispose=()=>{for(const o of S.objs)scene.remove(o);S.env.dispose();};
 return S;}

/* ======================= geometry helpers ======================= */
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_v=new V(),_s=new V(1,1,1);
function mtx(p,r,s){_e.set(r?r[0]:0,r?r[1]:0,r?r[2]:0,'YXZ');_q.setFromEuler(_e);return new THREE.Matrix4().compose(new V(p[0],p[1],p[2]),_q,s?new V(s[0],s[1],s[2]):_s);}
export function merge(list){const withCol=list.some(e=>e.c);const gs=list.map(e=>{let g=e.g.index?e.g.toNonIndexed():e.g.clone();g.applyMatrix4(e.m);g.userData.c=e.c;return g;});let n=0;gs.forEach(g=>n+=g.attributes.position.count);
 const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=withCol?new Float32Array(n*3).fill(1):null;let o=0;
 for(const g of gs){const k=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);
  if(col&&g.userData.c){const c=g.userData.c;for(let i=0;i<k;i++){col[(o+i)*3]=c.r;col[(o+i)*3+1]=c.g;col[(o+i)*3+2]=c.b;}}o+=k;g.dispose();}
 const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));r.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(col)r.setAttribute('color',new THREE.BufferAttribute(col,3));r.computeBoundingSphere();return r;}
const BOX=new THREE.BoxGeometry(1,1,1),CYL=new THREE.CylinderGeometry(1,1,1,14),CYL6=new THREE.CylinderGeometry(1,1,1,6);

/* ======================= level construction ======================= */
const CONT=[0x2f7d8c,0xb5532c,0x24365e,0x8c2f6e,0x9aa0a8,0x3f7a4a,0xc9a13a];
export function buildLevel(L,R,scene,d){SEED=L.id.length*977+L.district*31+7;textures();const M=matsFor(d);
 const G=new THREE.Group();scene.add(G);const W=new World();const groups={};const out={G,W,crumbles:[],lasers:[],drones:[],orbs:[],cps:[],graps:[],boards:[],anim:[]};
 const put=(mat,hint,g,m,c,shadow=true)=>{const k=mat+(hint?'#h':'')+(shadow?'':'#ns');(groups[k]||(groups[k]={mat,hint,shadow,list:[]})).list.push({g,m,c});};
 const solid=(p,s,r,o)=>W.add(new Box(p,s,r,o||{}));
 /* ---- course boxes ---- */
 for(const b of L.boxes){if(b.crumble)continue;let mat=b.m;const col=b.nc?null:solid(b.p,b.s,b.r,{surf:b.surf,run:b.run,lip:b.lip});
  if(mat==='wall'&&d===1){// container stack
   const n=Math.ceil(b.s[1]/2.6);for(let i=0;i<n;i++){const h=Math.min(2.6,b.s[1]-i*2.6);const c=new THREE.Color(CONT[(rnd()*CONT.length)|0]);
    const yy=b.p[1]-b.s[1]/2+i*2.6+h/2;put('wall',b.hint,BOX,mtx([b.p[0],yy,b.p[2]],b.r,[b.s[0]+(i%2)*.06,h-.08,b.s[2]-(i%2)*.4]),c);}continue;}
  if(mat==='wall'&&d===0){// billboard: frame + ad faces both sides + lights
   put('wall',b.hint,BOX,mtx(b.p,b.r,b.s));const ad=b.ad??((rnd()*6)|0);const am=hmat(adTex(ad),{hint:true,em:0x222222,emI:.5});
   for(const s of[-1,1]){const pl=new THREE.Mesh(new THREE.PlaneGeometry(b.s[2]-.5,Math.min(5.2,b.s[1]-1)),am);_e.set(0,b.r[1]+s*Math.PI/2,0,'YXZ');pl.quaternion.setFromEuler(_e);
    const ax=new V(1,0,0).applyEuler(new THREE.Euler(0,b.r[1],0));pl.position.set(b.p[0]+ax.x*s*(b.s[0]/2+.02),b.p[1]+b.s[1]/2-3.3,b.p[2]+ax.z*s*(b.s[0]/2+.02));pl.receiveShadow=true;G.add(pl);}
   continue;}
  if(mat==='wall'&&d===2){put('wall',b.hint,BOX,mtx(b.p,b.r,b.s));put('acc',false,BOX,mtx([b.p[0],b.p[1]+b.s[1]/2+.1,b.p[2]],b.r,[b.s[0]+.1,.2,b.s[2]+.1]));continue;}
  if(mat==='beam'&&d!==2){// lattice girder: deck plate + side trusses
   put('beam',b.hint,BOX,mtx(b.p,b.r,b.s));const ax=new V(0,0,1).applyEuler(new THREE.Euler(0,b.r[1],0)),rx=new V(1,0,0).applyEuler(new THREE.Euler(0,b.r[1],0));const len=b.s[2],n=Math.floor(len/1.6);
   for(const s of[-1,1]){const cx=b.p[0]+rx.x*s*b.s[0]/2,cz=b.p[2]+rx.z*s*b.s[0]/2;put('beam',b.hint,BOX,mtx([cx,b.p[1]-1.1,cz],b.r,[.12,.12,len]));
    for(let i=0;i<n;i++){const f=-len/2+.8+i*1.6;put('beam',b.hint,BOX,mtx([cx+ax.x*f,b.p[1]-.6,cz+ax.z*f],[(i%2?.6:-.6),b.r[1],0],[.08,1.25,.08]));}}
   continue;}
  if(mat==='bld'){put('bld',false,BOX,mtx(b.p,b.r,b.s));// roof edge coping
   if(!b.dk)put('par',false,BOX,mtx([b.p[0],b.p[1]+b.s[1]/2-.12,b.p[2]],b.r,[b.s[0]+.16,.26,b.s[2]+.16]));continue;}
  put(mat,b.hint,BOX,mtx(b.p,b.r,b.s),b.tint?new THREE.Color(b.tint):null);}
 /* ---- crumbling slabs ---- */
 for(const b of L.crumbles){const bx=solid(b.p,b.s,b.r,{crumble:true});const mesh=new THREE.Mesh(BOX,M.plat({}));mesh.scale.set(...b.s);mesh.position.set(...b.p);mesh.quaternion.copy(bx.q);mesh.castShadow=mesh.receiveShadow=true;G.add(mesh);
  out.crumbles.push({box:bx,mesh,p0:mesh.position.clone(),q0:mesh.quaternion.clone(),t:-1,fall:0,vy:0,spin:new V(rr(-1,1),0,rr(-1,1))});}
 /* ---- deco on roofs ---- */
 for(const o of L.deco){const k=o.k,p=o.p,y=o.yaw,X=(u,f)=>[p[0]+Math.cos(y)*u-Math.sin(y)*f,p[2]-Math.sin(y)*u-Math.cos(y)*f];
  if(d===0){if(k==='r0'||k==='r3'&&rnd()<.5){const[x,z]=X(0,0);solid([x,p[1]+.55,z],[1.5,1.1,1.9],[0,y,0]);put('white',false,BOX,mtx([x,p[1]+.55,z],[0,y,0],[1.5,1.1,1.9]));put('dark',false,CYL,mtx([x,p[1]+1.12,z],[0,0,0],[.5,.06,.5]));}
   else if(k==='r1'){const[x,z]=X(0,0);put('metal',false,CYL,mtx([x,p[1]+.7,z],null,[.28,1.4,.28]));put('metal',false,CYL,mtx([x,p[1]+1.45,z],null,[.45,.12,.45]));}
   else if(k==='r2'){const[x,z]=X(0,0);for(const a of[0,1,2,3]){const[lx,lz]=X(Math.cos(a*1.57+.78)*.9,Math.sin(a*1.57+.78)*.9);put('metal',false,BOX,mtx([lx,p[1]+1,lz],null,[.14,2,.14]));}
    put('white',false,CYL,mtx([x,p[1]+3.1,z],null,[1.25,2.2,1.25]));put('dark',false,CYL,mtx([x,p[1]+4.35,z],null,[1.3,.3,1.3]));solid([x,p[1]+3.1,z],[2.4,2.2,2.4],[0,y,0]);}
   else{const[x,z]=X(0,0);put('glass',false,BOX,mtx([x,p[1]+.3,z],[0,y,0],[1.6,.6,2.6]));solid([x,p[1]+.3,z],[1.6,.6,2.6],[0,y,0]);}}
  else if(d===1){const[x,z]=X(0,0);if(k==='r0'||k==='r2'){solid([x,p[1]+.6,z],[1.6,1.2,2],[0,y,0]);put('dark',false,BOX,mtx([x,p[1]+.6,z],[0,y,0],[1.6,1.2,2]));put('lamp',false,BOX,mtx([x,p[1]+1.22,z],[0,y,0],[1.2,.04,.1]));}
   else if(k==='r1'){put('metal',false,CYL,mtx([x,p[1]+1.6,z],null,[.35,3.2,.35]));put('dark',false,CYL,mtx([x,p[1]+3.25,z],null,[.42,.1,.42]));out.anim.push({k:'steam',p:new V(x,p[1]+3.3,z)});}
   else{const c=new THREE.Color(CONT[(rnd()*CONT.length)|0]);solid([x,p[1]+1.3,z],[2.4,2.6,2.6],[0,y,0]);put('cont',false,BOX,mtx([x,p[1]+1.3,z],[0,y,0],[2.4,2.6,2.6]),c);}}
  else{const[x,z]=X(0,0);if(k==='r0'||k==='r3'){put('dark',false,CYL,mtx([x,p[1]+1.6,z],null,[.06,3.2,.06]));put('lamp',false,BOX,mtx([x,p[1]+3.2,z],[0,y,0],[.5,.12,.2]));}
   else if(k==='r1'){solid([x,p[1]+.45,z],[1.2,.9,2.6],[0,y,0]);put('white',false,BOX,mtx([x,p[1]+.45,z],[0,y,0],[1.2,.9,2.6]));put('green',false,BOX,mtx([x,p[1]+1.05,z],[0,y,0],[1,.4,2.4]));}
   else{put('metal',false,CYL6,mtx([x,p[1]+2.5,z],null,[.08,5,.08]));put('lamp',false,BOX,mtx([x,p[1]+5,z],null,[.16,.16,.16]));}}}
 /* ---- billboards on poles ---- */
 for(const bd of L.boards){const ax=new V(1,0,0).applyEuler(new THREE.Euler(0,bd.yaw,0));const top=bd.p[1]+bd.h+3;
  for(const s of[-1,1])put('metal',false,BOX,mtx([bd.p[0]+ax.x*s*bd.w*.3,bd.p[1]+(bd.h+3)/2,bd.p[2]+ax.z*s*bd.w*.3],[0,bd.yaw,0],[.25,bd.h+3,.25]));
  const c=[bd.p[0],top-bd.h/2,bd.p[2]];solid(c,[bd.w,bd.h,.4],[0,bd.yaw,0]);put('wall',false,BOX,mtx(c,[0,bd.yaw,0],[bd.w+.2,bd.h+.2,.35]));
  const am=hmat(adTex(bd.ad<0?(rnd()*6|0):bd.ad),{em:0x333333,emI:.6});for(const s of[0,1]){const pl=new THREE.Mesh(new THREE.PlaneGeometry(bd.w-.3,bd.h-.3),am);pl.rotation.y=bd.yaw+s*Math.PI;const n=new V(0,0,1).applyEuler(pl.rotation);pl.position.set(c[0]+n.x*.2,c[1],c[2]+n.z*.2);G.add(pl);}}
 /* ---- cranes ---- */
 for(const c of L.cranes)crane(put,solid,c,d);
 /* ---- merge static groups ---- */
 for(const k in groups){const gr=groups[k];const mat=M[gr.mat]({hint:gr.hint,vc:gr.list.some(e=>e.c)||undefined});const mesh=new THREE.Mesh(merge(gr.list),mat);mesh.castShadow=gr.shadow;mesh.receiveShadow=true;G.add(mesh);}
 /* ---- backdrop city ---- */
 backdrop(G,L,d,M);
 /* ---- grapple nodes ---- */
 const nodeM=new THREE.MeshStandardMaterial({color:0x111111,emissive:d===1?0x19e3ff:0xff7a1a,emissiveIntensity:3.2,metalness:.5,roughness:.3});const coreM=new THREE.MeshStandardMaterial({color:0x22252b,metalness:.8,roughness:.3});
 const beamM=new THREE.MeshBasicMaterial({color:d===1?0x19e3ff:0xff8a3a,transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
 for(const p of L.graps){const g=new THREE.Group();g.position.set(...p);const ring=new THREE.Mesh(new THREE.TorusGeometry(.9,.09,8,36),nodeM);const core=new THREE.Mesh(new THREE.OctahedronGeometry(.42),coreM);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(.55,.05,6,28),nodeM);ring2.rotation.y=Math.PI/2;const col=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,60,6,1,true),beamM);col.position.y=30.9;
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.2,6),coreM);mast.position.y=.9;g.add(ring,ring2,core,col,mast);G.add(g);out.graps.push({p:new V(...p),g,ring,ring2,cd:0,hot:0});}
 /* ---- orbs ---- */
 const orbM=new THREE.MeshBasicMaterial({color:d===1?new THREE.Color(5,.6,3.2):new THREE.Color(5,3.4,.8),toneMapped:false});const orbG=new THREE.OctahedronGeometry(.2,0);
 const halo=haloTex(d===1?'255,47,180':'255,190,60');
 for(const p of L.orbs){const m=new THREE.Mesh(orbG,orbM);m.position.set(...p);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:halo,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:.8}));sp.scale.setScalar(2.4);m.add(sp);const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.025,6,28),orbM);m.add(ring);G.add(m);out.orbs.push({p:new V(...p),m,got:false});}
 /* ---- checkpoints & finish ---- */
 const postM=M.white({}),cpCol=d===1?0x19e3ff:0xff6a1a;
 L.cps.forEach((c,i)=>{const g=gate(c,postM,cpCol,5.4,3.4,'CHECKPOINT '+(i+1));G.add(g.g);out.cps.push({p:new V(...c.p),yaw:c.yaw,g,got:false});});
 {const f=L.finish;const g=gate(f,postM,0xffffff,7.5,5,'FINISH',true);G.add(g.g);out.finish={p:new V(...f.p),yaw:f.yaw,g};}
 {const s=L.start;const pad=new THREE.Mesh(new THREE.CircleGeometry(1.3,40),new THREE.MeshBasicMaterial({color:cpCol,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));pad.rotation.x=-Math.PI/2;pad.position.set(s.p[0],s.p[1]+.04,s.p[2]);G.add(pad);}
 /* ---- lasers ---- */
 const lcore=new THREE.MeshBasicMaterial({color:new THREE.Color(6,.35,.2),toneMapped:false}),lglow=new THREE.MeshBasicMaterial({color:new THREE.Color(1,.08,.04),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false});
 for(const l of L.lasers){const a=new V(...l.a),b=new V(...l.b),len=a.distanceTo(b);const g=new THREE.Group();const core=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,len,6,1,true),lcore),glow=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,len,10,1,true),lglow);
  g.add(core,glow);g.position.copy(a).add(b).multiplyScalar(.5);g.quaternion.setFromUnitVectors(new V(0,1,0),b.clone().sub(a).normalize());G.add(g);out.lasers.push({...l,A:a,B:b,g,on:true,y0:g.position.y,warn:0});}
 /* ---- drones ---- */
 for(const dr of L.drones){const g=drone(d);G.add(g);out.drones.push({...dr,C:new V(...dr.c),AX:new V(...dr.ax),g,p:new V(...dr.c),cd:0});}
 /* ---- per-frame animation ---- */
 out.update=(t,dt)=>{for(const g of out.graps){g.ring.rotation.z=t*1.6;g.ring2.rotation.x=t*2.2;const s=1+g.hot*.35+Math.sin(t*4)*.04;g.ring.scale.setScalar(s);g.cd=Math.max(0,g.cd-dt);}
  for(const o of out.orbs){if(o.got){o.m.visible=false;continue;}o.m.visible=true;o.m.rotation.y=t*2;o.m.rotation.x=t*1.3;o.m.position.y=o.p.y+Math.sin(t*2.4+o.p.x)*.12;}
  for(const c of out.cps){c.g.holo.material.opacity=(c.got?.12:.3)+Math.sin(t*3)*.05;c.g.holo.material.color.setHex(c.got?0x38ff9a:cpCol);}
  out.finish.g.holo.material.opacity=.32+Math.sin(t*2.5)*.08;
  for(const l of out.lasers){let on=true;if(l.mode==='blink'){const ph=((t/l.period+l.ph)%1+1)%1;on=ph<l.duty;l.warn=!on&&ph>.88;}if(l.mode==='sweep'){l.g.position.y=l.y0+Math.sin(t*l.speed+l.ph)*l.amp;}l.on=on;
   l.g.visible=on||l.warn&&Math.sin(t*60)>0;l.g.children[1].scale.set(1+Math.sin(t*30)*.15,1,1+Math.sin(t*30)*.15);}
  for(const dr of out.drones){const k=Math.sin(t*dr.speed+dr.ph);dr.p.copy(dr.C).addScaledVector(dr.AX,k*dr.range);dr.p.y+=Math.sin(t*3.1+dr.ph)*.18;dr.g.position.copy(dr.p);dr.g.rotation.y=t*.6+dr.ph;dr.g.rotation.z=Math.cos(t*dr.speed+dr.ph)*.18;
   for(const r of dr.g.userData.rotors)r.rotation.y+=dt*60;dr.cd=Math.max(0,dr.cd-dt);}
  for(const c of out.crumbles){if(c.t<0)continue;c.t+=dt;if(c.t<.55){c.mesh.position.copy(c.p0);c.mesh.position.x+=Math.sin(c.t*90)*.04;c.mesh.position.y+=Math.sin(c.t*70)*.03;}
   else{if(c.box.on){c.box.on=false;c.vy=0;}c.vy-=22*dt;c.mesh.position.y+=c.vy*dt;c.mesh.rotation.x+=c.spin.x*dt;c.mesh.rotation.z+=c.spin.z*dt;if(c.t>4)c.mesh.visible=false;}}};
 out.resetCrumbles=()=>{for(const c of out.crumbles){c.t=-1;c.box.on=true;c.mesh.visible=true;c.mesh.position.copy(c.p0);c.mesh.quaternion.copy(c.q0);}};
 out.dispose=()=>{scene.remove(G);G.traverse(o=>{if(o.geometry&&o.geometry!==BOX&&o.geometry!==CYL&&o.geometry!==CYL6)o.geometry.dispose();if(o.material&&o.material.dispose)o.material.dispose();});};
 return out;}

function haloTex(rgb){return ctex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,`rgba(${rgb},.9)`);g.addColorStop(.35,`rgba(${rgb},.28)`);g.addColorStop(1,`rgba(${rgb},0)`);x.fillStyle=g;x.fillRect(0,0,w,h);},{clamp:true});}
function gate(c,postM,col,w,h,label,fin){const g=new THREE.Group();g.position.set(...c.p);g.rotation.y=c.yaw;
 for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.3,h,.3),postM);p.position.set(s*w/2,h/2,0);p.castShadow=true;g.add(p);const cap=new THREE.Mesh(new THREE.BoxGeometry(.36,.3,.36),new THREE.MeshStandardMaterial({color:0x111111,emissive:col,emissiveIntensity:2.5}));cap.position.set(s*w/2,h+.15,0);g.add(cap);}
 const bar=new THREE.Mesh(new THREE.BoxGeometry(w+.3,fin?1.1:.35,.3),postM);bar.position.y=h+(fin?.55:.17);bar.castShadow=true;g.add(bar);
 const t=ctex(512,64,(x,W,H)=>{x.fillStyle=fin?'#111':'#ff4d00';x.fillRect(0,0,W,H);if(fin){for(let i=0;i<W/32;i++)for(let j=0;j<2;j++){if((i+j)%2){x.fillStyle='#fff';x.fillRect(i*32,j*32,32,32);}}x.fillStyle='rgba(0,0,0,.65)';x.fillRect(110,0,292,64);}
  x.fillStyle='#fff';x.font=`400 ${fin?50:40}px ${DISP}`;x.textAlign='center';x.textBaseline='middle';x.fillText(label,W/2,H/2+2);},{clamp:true});
 for(const s of[0,1]){const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,fin?1:.32),new THREE.MeshBasicMaterial({map:t,toneMapped:true}));pl.position.set(0,h+(fin?.55:.17),s?-.16:.16);pl.rotation.y=s?Math.PI:0;g.add(pl);}
 const holo=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.3,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,map:stripeTex()}));holo.position.y=h/2;g.add(holo);g.holo=holo;return{g,holo};}
let _stripe=null;function stripeTex(){if(_stripe)return _stripe;_stripe=ctex(64,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.2,'rgba(255,255,255,.15)');g.addColorStop(.85,'rgba(255,255,255,.05)');g.addColorStop(1,'rgba(255,255,255,.6)');x.fillStyle=g;x.fillRect(0,0,w,h);
 x.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<h;i+=8)x.fillRect(0,i,w,2);},{srgb:true});return _stripe;}
function drone(d){const g=new THREE.Group();const dark=new THREE.MeshStandardMaterial({color:0x22252c,metalness:.7,roughness:.35}),eye=new THREE.MeshStandardMaterial({color:0x111111,emissive:0xff2a1a,emissiveIntensity:5});
 const body=new THREE.Mesh(new THREE.BoxGeometry(.7,.22,.7),dark);g.add(body);const dome=new THREE.Mesh(new THREE.SphereGeometry(.22,16,8,0,TAU,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0xdde2ea,metalness:.4,roughness:.2}));dome.position.y=.1;g.add(dome);
 const e=new THREE.Mesh(new THREE.SphereGeometry(.09,12,8),eye);e.position.set(0,-.05,-.36);g.add(e);const ring=new THREE.Mesh(new THREE.TorusGeometry(.3,.025,6,24),eye);ring.rotation.x=Math.PI/2;ring.position.y=-.14;g.add(ring);
 const rot=[];const rm=new THREE.MeshBasicMaterial({color:0xcfd6e0,transparent:true,opacity:.35,depthWrite:false});
 for(const[x,z]of[[1,1],[-1,1],[1,-1],[-1,-1]]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.08,.06,.6),dark);arm.position.set(x*.38,0,z*.38);arm.rotation.y=Math.atan2(x,z);g.add(arm);
  const r=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.02,20),rm);r.position.set(x*.6,.1,z*.6);g.add(r);rot.push(r);}
 g.userData.rotors=rot;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.scale.setScalar(1.4);return g;}
function crane(put,solid,c,d){const yaw=c.yaw,X=(u,f)=>[c.p[0]+Math.cos(yaw)*u-Math.sin(yaw)*f,c.p[2]-Math.sin(yaw)*u-Math.cos(yaw)*f];
 const base=c.side?c.p[1]-60:c.p[1],top=c.side?c.p[1]+9:c.p[1]+(c.mast||60),m='crane';const S=1.1;
 // mast lattice (4 posts + braces)
 for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const[x,z]=X(a*S,b*S);put(m,false,BOX,mtx([x,(base+top)/2,z],[0,yaw,0],[.16,top-base,.16]));}
 for(let y=base+1.5;y<top-1;y+=2.2){for(const s of[-1,1]){const[x,z]=X(s*S,0);put(m,false,BOX,mtx([x,y,z],[(y|0)%2?.78:-.78,yaw,0],[.08,.08,S*2.9]));const[x2,z2]=X(0,s*S);put(m,false,BOX,mtx([x2,y,z2],[0,yaw,(y|0)%2?.78:-.78],[S*2.9,.08,.08]));}}
 // slewing unit + cab
 const[cx,cz]=X(0,0);put(m,false,BOX,mtx([cx,top+.6,cz],[0,yaw,0],[2.8,1.2,2.8]));const[kx,kz]=X(1.6,-.6);put('white',false,BOX,mtx([kx,top+1.4,kz],[0,yaw,0],[1.4,1.6,1.6]));put('glass',false,BOX,mtx([kx+0,top+1.6,kz],[0,yaw,0],[1.45,.8,1.2]));
 // jib (along the path direction if side-mounted, else along yaw)
 const jl=c.jib||34,jdir=c.side?-c.side:1;const JX=(u)=>X(u*jdir,0);
 for(const yy of[top+1.4,top+3.2]){const[a,b]=JX(jl/2-2);put(m,false,BOX,mtx([a,yy,b],[0,yaw,0],[jl,.14,.14]));}
 for(let i=0;i<jl/2.2;i++){const u=-3+i*2.2;const[a,b]=JX(u);put(m,false,BOX,mtx([a,top+2.3,b],[0,yaw,i%2?.72:-.72],[.08,2.3,.08]));}
 // counter-jib + weights
 const[wa,wb]=JX(-7);put('conc',false,BOX,mtx([wa,top+1.2,wb],[0,yaw,0],[2.2,2,2.2]));const[ca,cb]=JX(-4);put(m,false,BOX,mtx([ca,top+1.4,cb],[0,yaw,0],[8,.3,1.2]));
 // apex + tie bars
 put(m,false,BOX,mtx([cx,top+5,cz],[0,yaw,0],[.3,8,.3]));
 // hook cable + block
 if(!c.side){const[ha,hb]=JX(jl*.62);put('dark',false,BOX,mtx([ha,top-6,hb],[0,yaw,0],[.04,14,.04]));put('crane',false,BOX,mtx([ha,top-13.4,hb],[0,yaw,0],[.6,.8,.4]));}
 else{// cables down to the girder the player walks
  for(const f of[-.3,.3])for(const e of[-.8,.8]){const[ha,hb]=X(c.side*-7+e,(c.jib||18)*f);const hy=c.p[1];put('dark',false,BOX,mtx([ha,(hy+top+1.4)/2,hb],[0,yaw,0],[.04,top+1.4-hy,.04]));}}
}
function backdrop(G,L,d,M){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,ym=0;for(const r of L.route){x0=Math.min(x0,r.p[0]);x1=Math.max(x1,r.p[0]);z0=Math.min(z0,r.p[2]);z1=Math.max(z1,r.p[2]);ym+=r.p[1];}ym/=L.route.length;
 const near=(x,z,rad)=>{for(const r of L.route){if(Math.abs(r.p[0]-x)<rad&&Math.abs(r.p[2]-z)<rad)return true;}for(const b of L.boxes){if(b.m!=='bld')continue;const hw=Math.max(b.s[0],b.s[2])/2+4;if(Math.abs(b.p[0]-x)<hw+rad*.5&&Math.abs(b.p[2]-z)<hw+rad*.5)return true;}return false;};
 const cx=(x0+x1)/2,cz=(z0+z1)/2,R0=Math.max(x1-x0,z1-z0)/2+40;const mats=[];const N=d===2?150:340;const list=[];
 for(let i=0;i<N*3&&list.length<N;i++){const a=rnd()*TAU,r=R0*.2+Math.pow(rnd(),.7)*(d===2?900:700);const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;const w=rr(12,30),dd=rr(12,30);if(near(x,z,Math.max(w,dd)*.5+12))continue;
  let top=ym+(d===2?rr(-26,14):rr(-30,8));if(rnd()<.12)top+=rr(25,90);if(r>500)top+=rr(0,40);list.push([x,z,w,dd,top]);}
 const geo=BOX,mat=M.bld({});const im=new THREE.InstancedMesh(geo,mat,list.length);const m4=new THREE.Matrix4();
 list.forEach((b,i)=>{const h=b[4]+90;m4.compose(new V(b[0],b[4]-h/2,b[1]),new THREE.Quaternion(),new V(b[2],h,b[3]));im.setMatrixAt(i,m4);});im.receiveShadow=false;im.castShadow=false;G.add(im);
 // roof caps / chimneys / antennas on backdrop
 const caps=new THREE.InstancedMesh(BOX,d===1?M.lamp({}):M.white({}),list.length);list.forEach((b,i)=>{const tall=d===1?.4:2+rnd()*4;m4.compose(new V(b[0]+rr(-3,3),b[4]+tall/2,b[1]+rr(-3,3)),new THREE.Quaternion(),new V(d===1?b[2]*.9:rr(2,5),tall,d===1?.4:rr(2,5)));caps.setMatrixAt(i,m4);});G.add(caps);
 if(d===1){// smokestacks with beacons
  const st=[];for(let i=0;i<14;i++){const a=rnd()*TAU,r=R0+rr(40,400);const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(near(x,z,20))continue;st.push([x,z,ym+rr(10,60)]);}
  const sm=new THREE.InstancedMesh(CYL,M.dark({}),st.length),bm=new THREE.InstancedMesh(new THREE.SphereGeometry(.8,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(5,.3,.2),toneMapped:false}),st.length);
  st.forEach((s,i)=>{m4.compose(new V(s[0],s[2]-60,s[1]),new THREE.Quaternion(),new V(3,120,3));sm.setMatrixAt(i,m4);m4.compose(new V(s[0],s[2]+.8,s[1]),new THREE.Quaternion(),new V(1,1,1));bm.setMatrixAt(i,m4);});G.add(sm,bm);G.userData.beacons=bm;}
 if(d===0){// distant cranes as simple silhouettes
  for(let i=0;i<5;i++){const a=rnd()*TAU,r=R0+rr(60,300);const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;const h=ym+rr(10,40);const g=new THREE.Group();
   const mast=new THREE.Mesh(BOX,M.crane({}));mast.scale.set(1.8,h+90,1.8);mast.position.set(0,(h-90)/2,0);const jib=new THREE.Mesh(BOX,M.crane({}));jib.scale.set(40,1.4,1.4);jib.position.set(12,h+1,0);g.add(mast,jib);g.position.set(x,0,z);g.rotation.y=rnd()*TAU;G.add(g);}}}

/* ======================= particles ======================= */
export class Particles{constructor(scene,n=2400){this.n=n;this.p=new Float32Array(n*3);this.v=new Float32Array(n*3);this.c=new Float32Array(n*3);this.oc=new Float32Array(n*3);this.s=new Float32Array(n);this.os=new Float32Array(n);this.life=new Float32Array(n);this.max=new Float32Array(n);this.g=new Float32Array(n);this.dr=new Float32Array(n);this.i=0;
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.p,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('color',new THREE.BufferAttribute(this.c,3).setUsage(THREE.DynamicDrawUsage));geo.setAttribute('size',new THREE.BufferAttribute(this.s,1).setUsage(THREE.DynamicDrawUsage));
  this.U={uScale:{value:500}};this.pts=new THREE.Points(geo,new THREE.ShaderMaterial({uniforms:this.U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
   vertexShader:'attribute float size;uniform float uScale;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vC=color*smoothstep(.3,2.5,-mv.z);gl_PointSize=size*uScale/max(.1,-mv.z);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vC*a,1.);}'}));this.pts.frustumCulled=false;scene.add(this.pts);this.geo=geo;}
 emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,drag=0){const i=this.i;this.i=(i+1)%this.n;this.p[i*3]=x;this.p[i*3+1]=y;this.p[i*3+2]=z;this.v[i*3]=vx;this.v[i*3+1]=vy;this.v[i*3+2]=vz;this.oc[i*3]=r;this.oc[i*3+1]=g;this.oc[i*3+2]=b;this.os[i]=size;this.life[i]=this.max[i]=life;this.g[i]=grav;this.dr[i]=drag;}
 burst(p,n,speed,col,size,life,o={}){for(let k=0;k<n;k++){let dx=Math.random()*2-1,dy=Math.random()*2-1,dz=Math.random()*2-1;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;if(o.up)dy=Math.abs(dy)*(o.upK??1);if(o.flat)dy*=.25;const s=speed*(.3+Math.random()*.7);
  const c=Array.isArray(col)?col[Math.random()*col.length|0]:col;this.emit(p.x,p.y,p.z,dx*s+(o.vx||0),dy*s+(o.vy||0),dz*s+(o.vz||0),c.r,c.g,c.b,size*(.5+Math.random()*.8),life*(.5+Math.random()*.6),o.grav??0,o.drag??1.5);}}
 clear(){this.life.fill(0);this.s.fill(0);this.geo.attributes.size.needsUpdate=true;}
 update(dt){const{p,v,c,oc,s,os,life,max,g,dr}=this;for(let i=0;i<this.n;i++){if(life[i]<=0){if(s[i]!==0)s[i]=0;continue;}life[i]-=dt;const k=Math.max(0,life[i]/max[i]),d=Math.exp(-dr[i]*dt);
   v[i*3]*=d;v[i*3+1]=v[i*3+1]*d-g[i]*dt;v[i*3+2]*=d;p[i*3]+=v[i*3]*dt;p[i*3+1]+=v[i*3+1]*dt;p[i*3+2]+=v[i*3+2]*dt;const f=Math.min(1,k*1.6);c[i*3]=oc[i*3]*f;c[i*3+1]=oc[i*3+1]*f;c[i*3+2]=oc[i*3+2]*f;s[i]=os[i]*(.5+.5*k);}
  this.geo.attributes.position.needsUpdate=this.geo.attributes.color.needsUpdate=this.geo.attributes.size.needsUpdate=true;}}
