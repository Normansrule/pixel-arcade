// PENGUIN PLAZA — shared minigame helpers.
import {THREE,V3,makeEnv,Particles,ctex,textSprite} from '../util.js';
import {skyDome,palette,snowMaterial} from '../env.js';
export {THREE,V3,Particles,ctex,textSprite,snowMaterial};
let ENV=null;
export function baseScene(R,o={}){const scene=new THREE.Scene();if(!ENV)ENV=makeEnv(R);scene.environment=ENV;
 const pal=palette(o.hour??12);let sky=null;
 if(o.sky!==false){sky=skyDome(600);const U=sky.userData.U;U.top.value.copy(pal.top);U.hor.value.copy(pal.hor);U.bot.value.copy(pal.hor);U.sunDir.value.copy(pal.sunDir);U.sunCol.value.copy(pal.sun);U.stars.value=pal.night;U.aurora.value=Math.max(0,pal.night-.4);scene.add(sky);sky.onBeforeRender=(r,sc,c)=>{sky.matrixWorld.setPosition(c.position);};}
 else scene.background=new THREE.Color(o.bg??0x101018);
 scene.fog=new THREE.FogExp2(o.fog??pal.fog,o.fogD??.008);
 const hemi=new THREE.HemisphereLight(o.hs??pal.hs,o.hg??pal.hg,o.hi??pal.hi);scene.add(hemi);
 const sun=new THREE.DirectionalLight(o.sunCol??pal.sun,o.si??pal.si);sun.position.copy(o.sunDir??pal.sunDir).multiplyScalar(60);sun.castShadow=o.shadow!==false;sun.shadow.mapSize.set(2048,2048);const s=o.shadowSize??30;Object.assign(sun.shadow.camera,{left:-s,right:s,top:s,bottom:-s,near:1,far:200});sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
 const cam=new THREE.PerspectiveCamera(o.fov??55,16/9,.1,1500);return{scene,sun,hemi,cam,sky,pal};}
// keep a directional light's shadow box centred on a point
export function follow(sun,p,dir){sun.target.position.copy(p);sun.position.copy(p).addScaledVector(dir,60);sun.target.updateMatrixWorld();}
export const medalOf=(s,t)=>s>=t[2]?3:s>=t[1]?2:s>=t[0]?1:0;
export const coinsFor=(s,t,mul=1)=>{const m=medalOf(s,t);return Math.round((5+s*mul)*(1+m*.25));};
// screen-space helper for HUD labels
export function toScreen(v,cam,w,h){cam.updateMatrixWorld();const p=v.clone().project(cam);return{x:(p.x*.5+.5)*w,y:(-p.y*.5+.5)*h,vis:p.z<1};}
