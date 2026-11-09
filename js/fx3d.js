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

// Grade: the "showroom photo" finish. Besides saturation, contrast and vignette it adds
//  - vibrance: lifts dull colours more than ones that are already vivid, so paint and foliage pop without neon skin
//  - split toning: cool teal in the shadows and warm gold in the highlights, the colour separation of modern racing games
//  - clarity: a gentle S-curve on luminance only, so midtones get punch while hue stays put
// All three are on by default at a light setting; cinematic({look:0}) turns them off for a world that wants it flat.
const Grade={uniforms:{tDiffuse:{value:null},vig:{value:.35},sat:{value:1.12},tint:{value:new THREE.Color(1,1,1)},grain:{value:.03},time:{value:0},ca:{value:.0012},con:{value:1},warm:{value:0},
 vib:{value:.38},split:{value:.7},clar:{value:.3},shTint:{value:new THREE.Color(.10,.42,.55)},hiTint:{value:new THREE.Color(1.,.72,.42)}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float vig,sat,grain,time,ca,con,warm,vib,split,clar;uniform vec3 tint,shTint,hiTint;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+time)*43758.5453);}
 void main(){vec2 d=vUv-.5;float r=dot(d,d);vec3 c;c.r=texture2D(tDiffuse,vUv+d*ca).r;c.g=texture2D(tDiffuse,vUv).g;c.b=texture2D(tDiffuse,vUv-d*ca).b;
  float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,sat)*tint;
  float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b));c=mix(vec3(l),c,1.+vib*(1.-smoothstep(0.,.6,mx-mn)));
  float L2=clamp(l,0.,1.),sc=L2*L2*(3.-2.*L2);c*=mix(1.,(mix(L2,sc,clar)+.001)/(L2+.001),step(.002,L2));
  float wS=(1.-L2)*(1.-L2)*.11*split,wH=L2*L2*.09*split;c=c*(1.-wS-wH)+shTint*wS*(l+.18)*2.2+c*hiTint*wH*1.6;c=clamp((c-.5)*con+.5,0.,1.);c*=vec3(1.+warm,1.+warm*.35,1.-warm*.6);c*=1.-vig*smoothstep(.1,.7,r*1.6);c+=(h(vUv*999.)-.5)*grain;gl_FragColor=vec4(c,1.);}`};

// Lens: what a real camera adds at speed and into the sun (all in HDR, before tone mapping).
//  - speed blur: radial streaks toward the edges, from a vanishing point, scaled by setLens({speed:0..1})
//  - sun glare, anamorphic streak, starburst and ghost chain. The sun's screen position comes from setLens({sun:dir});
//    whether it is hidden is read from the frame itself (a few taps of brightness at the sun), so trees, bridges and
//    cars cut the flare off without a depth test.
const Lens={uniforms:{tDiffuse:{value:null},uSpeed:{value:0},uC:{value:new THREE.Vector2(.5,.55)},uSun:{value:new THREE.Vector2(-9,-9)},uSunOn:{value:0},uSunC:{value:new THREE.Color(1,.92,.8)},uFlare:{value:1},uAsp:{value:1.78},uOccT:{value:1.6},uTaps:{value:8}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uSpeed,uSunOn,uFlare,uAsp,uOccT,uTaps;uniform vec2 uC,uSun;uniform vec3 uSunC;varying vec2 vUv;
 float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
 float disc(vec2 p,float r,float soft){return smoothstep(r,r*soft,length(p));}
 void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
  if(uSpeed>.002){vec2 d=vUv-uC;float m=smoothstep(.06,.62,length(d*vec2(uAsp,1.)));float s=uSpeed*m*.085;
   if(s>.0005){vec3 a=c;float w=1.;for(int i=1;i<12;i++){if(float(i)>=uTaps)break;float t=float(i)/uTaps;float k=1.-t*.55;a+=texture2D(tDiffuse,vUv-d*s*t).rgb*k;w+=k;}c=a/w;}}
  if(uSunOn>.001){
   float o=0.;for(int i=0;i<6;i++){float a=float(i)*1.0472;vec2 q=uSun+vec2(cos(a),sin(a))*vec2(1./uAsp,1.)*.006*(i<3?1.:2.);
    o+=smoothstep(uOccT*.5,uOccT,lum(texture2D(tDiffuse,clamp(q,.001,.999)).rgb));}
   float vis=uSunOn*o/6.*uFlare;
   if(vis>.001){vec2 dv=(vUv-uSun)*vec2(uAsp,1.);float r=length(dv);
    vec3 f=uSunC*(exp(-r*9.)*.55+exp(-r*2.4)*.09);
    f+=uSunC*vec3(.75,.85,1.)*exp(-abs(dv.y)*160.)*exp(-abs(dv.x)*2.2)*.22;
    float an=atan(dv.y,dv.x);f+=uSunC*pow(abs(cos(an*7.+.4)),28.)*exp(-r*5.)*.18;
    vec2 ax=vec2(.5)-uSun;
    for(int i=0;i<5;i++){float t=i==0?-.35:i==1?.45:i==2?.8:i==3?1.25:1.7;float sz=i==0?.03:i==1?.06:i==2?.025:i==3?.09:.045;
     vec3 tint=i==0?vec3(.4,.8,1.):i==1?vec3(1.,.55,.25):i==2?vec3(.5,1.,.6):i==3?vec3(.35,.45,1.):vec3(1.,.4,.7);
     vec2 gp=(vUv-(uSun+ax*2.*t))*vec2(uAsp,1.);f+=tint*disc(gp,sz,.35)*.045*(1.-float(i)*.08);}
    vec2 hp=(vUv-vec2(.5))*vec2(uAsp,1.);float hr=length(hp);vec2 sd=normalize((uSun-.5)*vec2(uAsp,1.)+1e-4);
    f+=vec3(.9,.7,1.)*smoothstep(.06,0.,abs(hr-.55))*smoothstep(.2,1.,dot(normalize(hp+1e-4),sd))*.035;
    c+=f*vis;}}
  gl_FragColor=vec4(c,1.);}`};

// Sharpen: a light unsharp mask after anti-aliasing, so textures and edges read crisp instead of soft.
const Sharp={uniforms:{tDiffuse:{value:null},uAmt:{value:.18},uPx:{value:new THREE.Vector2(1/1280,1/720)}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;uniform float uAmt;uniform vec2 uPx;varying vec2 vUv;
 void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;vec3 b=(texture2D(tDiffuse,vUv+vec2(uPx.x,0.)).rgb+texture2D(tDiffuse,vUv-vec2(uPx.x,0.)).rgb+texture2D(tDiffuse,vUv+vec2(0.,uPx.y)).rgb+texture2D(tDiffuse,vUv-vec2(0.,uPx.y)).rgb)*.25;
  gl_FragColor=vec4(clamp(c+(c-b)*uAmt,0.,1.),1.);}`};
const _sv=new THREE.Vector3();

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
 const q=o.quality??quality();if(q===0){return{render:()=>renderer.render(scene,camera),setSize:()=>{},setLens:()=>{},grade:null,q};}
 const size=renderer.getSize(new THREE.Vector2()),pr=renderer.getPixelRatio();
 const comp=new EffectComposer(renderer);comp.addPass(new RenderPass(scene,camera));
 let ao=null;if(q>=2&&o.ao!==false){ao=new LiteAO(scene,camera,size.x,size.y);ao.blendIntensity=o.aoStrength??1;comp.addPass(ao);}
 const bloom=new UnrealBloomPass(new THREE.Vector2(size.x,size.y),o.bloom??.55,o.bloomRadius??.5,o.bloomThreshold??.82);comp.addPass(bloom);
 let lens=null;if(o.lens){lens=new ShaderPass(Lens);const L=o.lens;if(L.flare!==undefined)lens.uniforms.uFlare.value=L.flare;if(L.occ!==undefined)lens.uniforms.uOccT.value=L.occ;if(L.sunColor)lens.uniforms.uSunC.value.set(L.sunColor);lens.uniforms.uTaps.value=q>=2?10:6;comp.addPass(lens);}
 comp.addPass(new OutputPass());const grade=new ShaderPass(Grade);if(o.vignette!==undefined)grade.uniforms.vig.value=o.vignette;if(o.saturation!==undefined)grade.uniforms.sat.value=o.saturation;if(o.tint)grade.uniforms.tint.value.set(o.tint);if(o.grain!==undefined)grade.uniforms.grain.value=o.grain;if(o.contrast!==undefined)grade.uniforms.con.value=o.contrast;if(o.warm!==undefined)grade.uniforms.warm.value=o.warm;
 if(o.look===0){grade.uniforms.vib.value=0;grade.uniforms.split.value=0;grade.uniforms.clar.value=0;}else if(o.look&&typeof o.look==='object'){for(const k of['vib','split','clar'])if(o.look[k]!==undefined)grade.uniforms[k].value=o.look[k];}
 comp.addPass(grade);
 const smaa=new SMAAPass(size.x*pr,size.y*pr);comp.addPass(smaa);
 const shAmt=o.sharpen??.16;let sharp=null;if(shAmt>0){sharp=new ShaderPass(Sharp);sharp.uniforms.uAmt.value=shAmt;sharp.uniforms.uPx.value.set(1/(size.x*pr),1/(size.y*pr));comp.addPass(sharp);}
 const t0=performance.now();
 // setLens({speed:0..1, sun:THREE.Vector3 direction towards the sun (world), center:[x,y] vanishing point in 0..1})
 const setLens=(p={})=>{if(!lens)return;const U=lens.uniforms;if(p.speed!==undefined)U.uSpeed.value=Math.max(0,Math.min(1,p.speed));if(p.center)U.uC.value.set(p.center[0],p.center[1]);
  if(p.sun){camera.updateMatrixWorld();_sv.copy(p.sun).normalize().multiplyScalar(1000).add(camera.position).project(camera);
   const on=_sv.z<1&&Math.abs(_sv.x)<1.25&&Math.abs(_sv.y)<1.25;U.uSun.value.set(_sv.x*.5+.5,_sv.y*.5+.5);
   U.uSunOn.value=on?Math.min(1,(1.25-Math.max(Math.abs(_sv.x),Math.abs(_sv.y)))*2.5)*(p.sunPower??1):0;}
  else if(p.sun===null)U.uSunOn.value=0;};
 return{q,bloom,ao,grade,lens,sharp,setLens,composer:comp,render:()=>{grade.uniforms.time.value=(performance.now()-t0)/1000%100;comp.render();},setSize:(w,h)=>{comp.setSize(w,h);bloom.setSize(w,h);smaa.setSize(w*pr,h*pr);if(ao)ao.setSize(w,h);if(lens)lens.uniforms.uAsp.value=w/Math.max(1,h);if(sharp)sharp.uniforms.uPx.value.set(1/(w*pr),1/(h*pr));}};
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
