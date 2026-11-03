// Metallic flake for car paint (MeshPhysicalMaterial with clearcoat).
// The base layer's normal is jittered per tiny cell in object space, so the metal under the lacquer glitters as the
// car turns, while the clearcoat keeps the smooth geometric normal and stays a clean mirror on top - the two-layer
// look of real automotive paint. Chains any onBeforeCompile the material already has.
export function addFlakes(m,{scale=140,amount=.22}={}){
 const prev=m.onBeforeCompile,key=(m.customProgramCacheKey&&m.customProgramCacheKey())||'';
 m.onBeforeCompile=(sh,r)=>{prev&&prev.call(m,sh,r);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vFlakeP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvFlakeP=position;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vFlakeP;\nfloat flakeH(vec3 p){return fract(sin(dot(floor(p),vec3(12.9898,78.233,37.719)))*43758.5453);}')
   .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n{vec3 fp=vFlakeP*'+scale.toFixed(1)+';vec3 fn=vec3(flakeH(fp),flakeH(fp+17.1),flakeH(fp+31.7))-.5;normal=normalize(normal+fn*'+amount.toFixed(3)+');}');};
 m.customProgramCacheKey=()=>key+'|flake'+scale+'_'+amount;m.needsUpdate=true;return m;}
