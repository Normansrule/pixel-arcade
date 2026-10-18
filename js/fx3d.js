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

// Cheaper GTAO. The stock pass re-draws the scene with a normal material for its depth/normal G-buffer, and that
// renderer.render() call also re-rendered every shadow map (whenever shadowMap.autoUpdate is on) and re-walked the
// scene's world matrices, although the main pass did both moments earlier in the same frame. Here the G-buffer
// pass reuses this frame's shadow maps and matrices, and the AO is multiplied straight onto the frame instead of
// copying the frame to the other buffer first. Still a GTAOPass, so the games that hook overrideVisibility/render
// to keep things out of the G-buffer work as before. (Tried and dropped because the look changed: reusing the
// main pass's depth with normals rebuilt from it - banding far away, AO on glass and fog - and half-resolution AO,
// which leaves dark halos along thin geometry such as railings.)
class LiteAO extends GTAOPass{
 constructor(scene,camera,w,h){super(scene,camera,w,h);this.needsSwap=false;}
 render(renderer,writeBuffer,readBuffer){
  if(this.output!==GTAOPass.OUTPUT.Default||this.renderToScreen){this.needsSwap=true;return super.render(renderer,writeBuffer,readBuffer);}
  this.needsSwap=false;const c=this.camera,sm=renderer.shadowMap,au=sm.autoUpdate,nu=sm.needsUpdate,sc=this.scene,mu=sc.matrixWorldAutoUpdate;
  sm.autoUpdate=false;sm.needsUpdate=false;sc.matrixWorldAutoUpdate=false;
  try{this.overrideVisibility();this.renderOverride(renderer,this.normalMaterial,this.normalRenderTarget,0x7777ff,1);this.restoreVisibility();}
  finally{sm.autoUpdate=au;sm.needsUpdate=nu;sc.matrixWorldAutoUpdate=mu;}
  const g=this.gtaoMaterial.uniforms;g.cameraNear.value=c.near;g.cameraFar.value=c.far;g.cameraProjectionMatrix.value.copy(c.projectionMatrix);g.cameraProjectionMatrixInverse.value.copy(c.projectionMatrixInverse);g.cameraWorldMatrix.value.copy(c.matrixWorld);
  this.renderPass(renderer,this.gtaoMaterial,this.gtaoRenderTarget,0xffffff,1);
  this.pdMaterial.uniforms.cameraProjectionMatrixInverse.value.copy(c.projectionMatrixInverse);this.renderPass(renderer,this.pdMaterial,this.pdRenderTarget,0xffffff,1);
  this.blendMaterial.uniforms.intensity.value=this.blendIntensity;this.blendMaterial.uniforms.tDiffuse.value=this.pdRenderTarget.texture;this.renderPass(renderer,this.blendMaterial,readBuffer);}
}

// quality: 0 = off (plain render), 1 = bloom + AA + grade, 2 = + ambient occlusion
export function quality(){const q=+(localStorage.getItem('pxd_gfx')??(matchMedia('(pointer:coarse)').matches?1:2));return isNaN(q)?2:q;}
export function setQuality(q){try{localStorage.setItem('pxd_gfx',q);}catch(e){}}

const renderers=new Set();
export function cinematic(renderer,scene,camera,o={}){
 renderers.add(renderer);
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=o.exposure??1;renderer.outputColorSpace=THREE.SRGBColorSpace;
 const q=o.quality??quality();if(q===0){return{render:()=>renderer.render(scene,camera),setSize:()=>{},grade:null,q};}
 const size=renderer.getSize(new THREE.Vector2()),pr=renderer.getPixelRatio();
 const comp=new EffectComposer(renderer);comp.addPass(new RenderPass(scene,camera));
 let ao=null;if(q>=2&&o.ao!==false){ao=new LiteAO(scene,camera,size.x,size.y);ao.blendIntensity=o.aoStrength??1;comp.addPass(ao);}
 const bloom=new UnrealBloomPass(new THREE.Vector2(size.x,size.y),o.bloom??.55,o.bloomRadius??.5,o.bloomThreshold??.82);comp.addPass(bloom);
 comp.addPass(new OutputPass());const grade=new ShaderPass(Grade);if(o.vignette!==undefined)grade.uniforms.vig.value=o.vignette;if(o.saturation!==undefined)grade.uniforms.sat.value=o.saturation;if(o.tint)grade.uniforms.tint.value.set(o.tint);if(o.grain!==undefined)grade.uniforms.grain.value=o.grain;comp.addPass(grade);
 const smaa=new SMAAPass(size.x*pr,size.y*pr);comp.addPass(smaa);
 const t0=performance.now();
 return{q,bloom,ao,grade,composer:comp,render:()=>{grade.uniforms.time.value=(performance.now()-t0)/1000%100;comp.render();},setSize:(w,h)=>{comp.setSize(w,h);bloom.setSize(w,h);smaa.setSize(w*pr,h*pr);if(ao)ao.setSize(w,h);}};
}

// G cycles graphics quality (ultra -> medium -> low); rebuild(q) recreates the post stack.
// Also: F3 shows a performance overlay (FPS, quality, draw calls, triangles), and if the frame rate
// stays under AUTO_FPS for a few seconds the quality steps down by itself (once per few seconds,
// remembered like a manual choice). Pressing G turns the automatic drop off for the session;
// localStorage pxd_gfx_auto = '0' turns it off for good.
const AUTO_FPS=45,AUTO_SECS=4,WARMUP_MS=6000;
export function bindQualityKey(getQ,rebuild){
 let tip=null,tm=0,manual=false;
 const say=t=>{if(!tip){tip=document.createElement('div');tip.style.cssText='position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:99;padding:8px 14px;border-radius:999px;background:rgba(8,10,16,.72);color:#fff;font:600 12px/1 ui-monospace,monospace;letter-spacing:.12em;pointer-events:none;transition:opacity .3s';document.body.appendChild(tip);}
  tip.textContent=t;tip.style.opacity=1;clearTimeout(tm);tm=setTimeout(()=>tip.style.opacity=0,1800);};
 const NAMES=['LOW','MEDIUM','ULTRA'];
 const set=(q,why)=>{setQuality(q);rebuild(q);say('GRAPHICS · '+NAMES[q]+(why?' · '+why:''));};
 addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;
  if(e.code==='KeyG'&&!e.repeat){manual=true;set((getQ()+2)%3);}
  else if(e.code==='F3'){e.preventDefault();if(!e.repeat)toggleStats();}});
 // frame counter: a rAF loop of its own, so it measures what the player sees whatever the game does
 let frames=0,last=performance.now(),slow=0,hold=performance.now()+WARMUP_MS,fps=0,stats=null;
 let autoOn=true;try{autoOn=localStorage.getItem('pxd_gfx_auto')!=='0';}catch(e){}
 if(navigator.webdriver)autoOn=false; // automated tests drive frames by hand
 function toggleStats(){if(stats){stats.remove();stats=null;renderers.forEach(r=>{r.info.autoReset=true;});return;}
  stats=document.createElement('div');stats.style.cssText='position:fixed;right:12px;top:12px;z-index:99;padding:8px 10px;border-radius:8px;background:rgba(8,10,16,.78);color:#fff;font:600 11px/1.5 ui-monospace,monospace;letter-spacing:.06em;pointer-events:none;white-space:pre';
  document.body.appendChild(stats);renderers.forEach(r=>{r.info.autoReset=false;r.info.reset();});}
 let drawn=0,tris=0;
 function tick(now){frames++;
  if(stats){let c=0,t=0;renderers.forEach(r=>{c+=r.info.render.calls;t+=r.info.render.triangles;r.info.reset();});if(c){drawn=c;tris=t;}}
  if(now-last>=1000){const gap=now-last;fps=Math.round(frames*1000/gap);frames=0;last=now;
   if(stats)stats.textContent='FPS '+fps+'\nGFX '+NAMES[getQ()]+(autoOn&&!manual?' · AUTO':'')+'\nCALLS '+drawn+'\nTRIS '+(tris>=1e6?(tris/1e6).toFixed(2)+'M':Math.round(tris/1e3)+'K');
   if(autoOn&&!manual&&!document.hidden&&now>hold&&gap<5000){slow=fps<AUTO_FPS?slow+1:0;
    if(slow>=AUTO_SECS){slow=0;hold=now+WARMUP_MS;const q=getQ();if(q>0)set(q-1,'AUTO ('+fps+' FPS)');}}}
  requestAnimationFrame(tick);}
 document.addEventListener('visibilitychange',()=>{slow=0;hold=performance.now()+2000;});
 requestAnimationFrame(tick);
}
