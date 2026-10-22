// KART GRAND PRIX — material helpers: anti-tiling detail sampling, world-space macro variation and slope-blended rock,
// injected into the stock MeshStandardMaterial so lights, shadows, fog and IBL keep working.
import * as THREE from '../vendor/three.module.min.js';

const NOISE=`
float gpH(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float gpN(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gpH(i),gpH(i+vec2(1,0)),f.x),mix(gpH(i+vec2(0,1)),gpH(i+vec2(1,1)),f.x),f.y);}`;

// o: {macro:amount, macroScale, antiTile:bool, rock:{map}, rockA, rockB, tint2: second colour blended by macro noise}
export function enhance(mat,o={}){const U={uMacroA:{value:o.macro??.25},uMacroS:{value:o.macroScale??.035},uRockA:{value:o.rockA??.28},uRockB:{value:o.rockB??.5}};
 if(o.rock)U.tRock={value:o.rock};if(o.tint2)U.uTint2={value:new THREE.Color(o.tint2)};
 mat.userData.gpU=U;
 mat.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGpWP;varying vec3 vGpWN;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\n{vec4 gw=modelMatrix*vec4(transformed,1.);\n#ifdef USE_INSTANCING\ngw=modelMatrix*instanceMatrix*vec4(transformed,1.);\n#endif\nvGpWP=gw.xyz;vGpWN=normalize(mat3(modelMatrix)*objectNormal);}');
  let pre='varying vec3 vGpWP;varying vec3 vGpWN;uniform float uMacroA,uMacroS,uRockA,uRockB;'+NOISE+(o.rock?'uniform sampler2D tRock;':'')+(o.tint2?'uniform vec3 uTint2;':'');
  let mapCode=`#ifdef USE_MAP
   vec4 sampledDiffuseColor=${o.antiTile!==false?'texture2D(map,vMapUv)*.62+texture2D(map,vMapUv*.213+vec2(.31,.17))*.38':'texture2D(map,vMapUv)'};
   ${o.rock?'float rk=smoothstep(uRockA,uRockB,1.-vGpWN.y);sampledDiffuseColor=mix(sampledDiffuseColor,texture2D(tRock,vMapUv*.61)*.6+texture2D(tRock,vMapUv*.153+.2)*.4,rk);':''}
   diffuseColor*=sampledDiffuseColor;
  #endif
  {float mv=gpN(vGpWP.xz*uMacroS)*.6+gpN(vGpWP.xz*uMacroS*3.7+9.)*.4;
   ${o.tint2?'diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*uTint2,smoothstep(.45,.75,gpN(vGpWP.xz*uMacroS*.5+3.)));':''}
   diffuseColor.rgb*=1.+(mv-.5)*uMacroA;}`;
  s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\n'+pre).replace('#include <map_fragment>',mapCode);};
 mat.customProgramCacheKey=()=>'gpE'+(o.rock?1:0)+(o.tint2?1:0)+(o.antiTile!==false?1:0);
 return mat;}

// a detail-textured ground material (detail maps are normalised to 0.5 mean, so colour is doubled)
export function groundMat(det,color,o={}){const c=new THREE.Color(color).multiplyScalar(2);
 const m=new THREE.MeshStandardMaterial({color:c,map:det.map,normalMap:det.normalMap,roughnessMap:det.roughnessMap,roughness:o.rough??1,metalness:0,vertexColors:!!o.vertexColors,envMapIntensity:o.env??.5,normalScale:new THREE.Vector2(o.ns??1,o.ns??1),...(o.extra||{})});
 if(o.vertexColors)m.color.setRGB(2,2,2);
 return enhance(m,o);}
