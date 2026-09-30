// Shared cinematic post-processing for the full-3D cabinets.
// Filmic tone mapping + ambient occlusion (GTAO) + bloom + SMAA anti-aliasing + vignette/grade.
import * as THREE from '../vendor/three.module.min.js';
import {EffectComposer} from '../vendor/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from '../vendor/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from '../vendor/jsm/postprocessing/OutputPass.js';
import {SMAAPass} from '../vendor/jsm/postprocessing/SMAAPass.js';
import {ShaderPass} from '../vendor/jsm/postprocessing/ShaderPass.js';
import {GTAOPass} from '../vendor/jsm/postprocessing/GTAOPass.js';

const Grade={uniforms:{tDiffuse:{value:null},vig:{value:.35},sat:{value:1.12},tint:{value:new THREE.Color(1,1,1)},grain:{value:.03},time:{value:0},ca:{value:.0012}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float vig,sat,grain,time,ca;uniform vec3 tint;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+time)*43758.5453);}
 void main(){vec2 d=vUv-.5;float r=dot(d,d);vec3 c;c.r=texture2D(tDiffuse,vUv+d*ca).r;c.g=texture2D(tDiffuse,vUv).g;c.b=texture2D(tDiffuse,vUv-d*ca).b;
  float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,sat)*tint;c*=1.-vig*smoothstep(.1,.7,r*1.6);c+=(h(vUv*999.)-.5)*grain;gl_FragColor=vec4(c,1.);}`};

// quality: 0 = off (plain render), 1 = bloom + AA + grade, 2 = + ambient occlusion
export function quality(){const q=+(localStorage.getItem('pxd_gfx')??(matchMedia('(pointer:coarse)').matches?1:2));return isNaN(q)?2:q;}
export function setQuality(q){try{localStorage.setItem('pxd_gfx',q);}catch(e){}}

export function cinematic(renderer,scene,camera,o={}){
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=o.exposure??1;renderer.outputColorSpace=THREE.SRGBColorSpace;
 const q=o.quality??quality();if(q===0){return{render:()=>renderer.render(scene,camera),setSize:()=>{},grade:null,q};}
 const size=renderer.getSize(new THREE.Vector2()),pr=renderer.getPixelRatio();
 const comp=new EffectComposer(renderer);comp.addPass(new RenderPass(scene,camera));
 let ao=null;if(q>=2&&o.ao!==false){ao=new GTAOPass(scene,camera,size.x,size.y);ao.blendIntensity=o.aoStrength??1;comp.addPass(ao);}
 const bloom=new UnrealBloomPass(new THREE.Vector2(size.x,size.y),o.bloom??.55,o.bloomRadius??.5,o.bloomThreshold??.82);comp.addPass(bloom);
 comp.addPass(new OutputPass());const grade=new ShaderPass(Grade);if(o.vignette!==undefined)grade.uniforms.vig.value=o.vignette;if(o.saturation!==undefined)grade.uniforms.sat.value=o.saturation;if(o.tint)grade.uniforms.tint.value.set(o.tint);if(o.grain!==undefined)grade.uniforms.grain.value=o.grain;comp.addPass(grade);
 const smaa=new SMAAPass(size.x*pr,size.y*pr);comp.addPass(smaa);
 const t0=performance.now();
 return{q,bloom,ao,grade,composer:comp,render:()=>{grade.uniforms.time.value=(performance.now()-t0)/1000%100;comp.render();},setSize:(w,h)=>{comp.setSize(w,h);bloom.setSize(w,h);smaa.setSize(w*pr,h*pr);if(ao)ao.setSize(w,h);}};
}

// G cycles graphics quality (ultra -> medium -> low); rebuild(q) recreates the post stack.
export function bindQualityKey(getQ,rebuild){
 let tip=null,tm=0;
 addEventListener('keydown',e=>{if(e.code!=='KeyG'||e.repeat||e.target.tagName==='INPUT')return;const q=(getQ()+2)%3;setQuality(q);rebuild(q);
  if(!tip){tip=document.createElement('div');tip.style.cssText='position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:99;padding:8px 14px;border-radius:999px;background:rgba(8,10,16,.72);color:#fff;font:600 12px/1 ui-monospace,monospace;letter-spacing:.12em;pointer-events:none;transition:opacity .3s';document.body.appendChild(tip);}
  tip.textContent='GRAPHICS · '+['LOW','MEDIUM','ULTRA'][q];tip.style.opacity=1;clearTimeout(tm);tm=setTimeout(()=>tip.style.opacity=0,1400);});
}
