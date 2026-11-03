// Live reflections for the player's car: a small cube camera at the car renders the real surroundings (trees, walls,
// containers, other cars, the sky) a few times a second, and the paint, glass and chrome reflect that instead of a
// fixed sky-only map. This is what makes a car look like it sits in the world rather than on top of it.
// three.js turns the cube into a roughness-filtered (PMREM) map by itself, so glossy clearcoat stays sharp and
// satin parts stay blurred. ULTRA: 128 px faces every 2nd frame. MEDIUM: 64 px every 4th frame. LOW: off (the
// game's own static map is kept). Shadow maps and world matrices from the main frame are reused for the capture.
import * as THREE from '../../vendor/three.module.min.js';
export class LiveReflections{
 constructor(renderer,scene,o={}){this.R=renderer;this.scene=scene;this.mats=new Set();this.n=0;this.q=-1;this.o=o;this.hide=[];this.near=o.near??.3;this.far=o.far??600;this.rt=null;this.cam=null;}
 setQuality(q){if(q===this.q)return;this.q=q;if(this.rt){this.rt.dispose();this.rt=null;}
  if(q>0){const s=q>=2?128:64;this.rt=new THREE.WebGLCubeRenderTarget(s,{type:THREE.HalfFloatType,generateMipmaps:false});this.cam=new THREE.CubeCamera(this.near,this.far,this.rt);this.every=q>=2?2:4;this.n=0;}
  for(const m of this.mats)this._apply(m);}
 // materials that should reflect the surroundings (their original envMap is kept for LOW)
 attach(...ms){for(const m of ms.flat()){if(!m||this.mats.has(m))continue;if(m.userData.envOrig===undefined)m.userData.envOrig=m.envMap||null;this.mats.add(m);this._apply(m);}}
 detach(...ms){for(const m of ms.flat()){if(!this.mats.has(m))continue;this.mats.delete(m);m.envMap=m.userData.envOrig;m.needsUpdate=true;}}
 _apply(m){const want=this.rt?this.rt.texture:m.userData.envOrig;if(m.envMap!==want){m.envMap=want;m.needsUpdate=true;}}
 // pos: world point at the car's roof line; hide: objects left out of the capture (the car itself)
 update(pos,hide){if(!this.rt||!this.mats.size)return;if((this.n++%this.every)!==0)return;
  this.cam.position.copy(pos);this.cam.updateMatrixWorld();
  const R=this.R,sm=R.shadowMap,au=sm.autoUpdate,nu=sm.needsUpdate,sc=this.scene,mu=sc.matrixWorldAutoUpdate,vis=[];
  for(const h of hide||[])if(h&&h.visible){vis.push(h);h.visible=false;}
  const rt=R.getRenderTarget(),vp=R.getViewport(new THREE.Vector4()),st=R.getScissorTest();
  sm.autoUpdate=false;sm.needsUpdate=false;sc.matrixWorldAutoUpdate=false;
  try{R.setScissorTest(false);this.cam.update(R,sc);}
  finally{sm.autoUpdate=au;sm.needsUpdate=nu;sc.matrixWorldAutoUpdate=mu;for(const h of vis)h.visible=true;R.setRenderTarget(rt);R.setViewport(vp);R.setScissorTest(st);}}
 dispose(){if(this.rt)this.rt.dispose();this.rt=null;for(const m of this.mats){m.envMap=m.userData.envOrig;m.needsUpdate=true;}this.mats.clear();}
}
