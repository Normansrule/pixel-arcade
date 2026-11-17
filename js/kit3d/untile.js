// untile(material, opts) — breaks up visible texture repetition on large surfaces (roads, grass, sand, terrain).
// Technique: a low-frequency value noise picks one of 8 pseudo-random UV offsets per region and the shader blends
// two neighbouring offset samples (after Inigo Quilez, "texture repetition", technique 3). Applied to the colour
// map and the normal map so lighting detail breaks up too. A second, very low-frequency noise adds broad
// tone drift (sun-bleached / damp patches). Gradients are passed explicitly so mip selection stays seamless.
import * as THREE from '../../vendor/three.module.min.js';
const GLSL=`
float utH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float utN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(utH(i),utH(i+vec2(1.,0.)),f.x),mix(utH(i+vec2(0.,1.)),utH(i+vec2(1.,1.)),f.x),f.y);}
vec4 utTex(sampler2D s,vec2 uv){
 float k=utN(uv*UT_FREQ)*8.;float i=floor(k),f=fract(k);
 vec2 oa=sin(vec2(3.,7.)*i),ob=sin(vec2(3.,7.)*(i+1.));
 vec2 dx=dFdx(uv),dy=dFdy(uv);
 vec4 a=textureGrad(s,uv+oa,dx,dy),b=textureGrad(s,uv+ob,dx,dy);
 return mix(a,b,smoothstep(.2,.8,f-.1*dot(a-b,vec4(1.))));}
`;
export function untile(m,o={}){if(!m||m.userData.untiled)return m;m.userData.untiled=true;
 const freq=(o.freq||.37).toFixed(3),drift=(o.drift==null?.18:o.drift).toFixed(3),dfreq=(o.dfreq||.045).toFixed(3);
 const prev=m.onBeforeCompile;
 m.onBeforeCompile=(sh,r)=>{if(prev)prev(sh,r);
  const C=THREE.ShaderChunk;
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\n#define UT_FREQ '+freq+'\n'+GLSL)
   .replace('#include <map_fragment>',C.map_fragment.replace('vec4 sampledDiffuseColor = texture2D( map, vMapUv );','vec4 sampledDiffuseColor = utTex( map, vMapUv );\n\tsampledDiffuseColor.rgb *= 1. + '+drift+' * ( utN( vMapUv * '+dfreq+' + 17.3 ) - .5 ) * 2.;'))
   .replace('#include <normal_fragment_maps>',C.normal_fragment_maps.split('texture2D( normalMap, vNormalMapUv )').join('utTex( normalMap, vNormalMapUv )'))
   .replace('#include <bumpmap_pars_fragment>',C.bumpmap_pars_fragment.split('texture2D( bumpMap,').join('utTex( bumpMap,'));};
 const key=m.customProgramCacheKey?m.customProgramCacheKey.bind(m):null;
 m.customProgramCacheKey=()=>(key?key():'')+'|ut'+freq+drift+dfreq;
 m.needsUpdate=true;return m;}
