// SWELL GUARD — renderer, golden-hour light rig, sky + image-based lighting, fog, ocean view and the beach.
import * as THREE from '../vendor/three.module.min.js';
import {makeSky,OceanView} from './ocean.js';
import {buildWorld} from './world.js';
import {makeTextures} from './tex.js';
export const SUN=new THREE.Vector3(.3,.235,1).normalize();
export const SUNC=new THREE.Vector3(2.7,2.05,1.45);
export function makeScene(canvas,q){
 const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance',antialias:false});R.setPixelRatio(Math.min(devicePixelRatio,1.5));
 R.shadowMap.enabled=q>0;R.shadowMap.type=THREE.PCFSoftShadowMap;
 const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(62,1,.15,4000);
 const T=makeTextures(q);
 const sky=makeSky(T,SUN,SUNC);scene.add(sky);
 // IBL: the same sky shader rendered into a PMREM cube, so boards, skin and wet sand reflect the real sky
 const pm=new THREE.PMREMGenerator(R);const es=new THREE.Scene();const s2=makeSky(T,SUN,SUNC);s2.scale.setScalar(100);s2.material.depthTest=false;es.add(s2);
 const env=pm.fromScene(es,0,.1,1000).texture;pm.dispose();scene.environment=env;
 scene.fog=new THREE.FogExp2(0xffffff,.0026);scene.fog.color.setRGB(.42,.53,.74);
 const hemi=new THREE.HemisphereLight(0xa8c4ff,0xd2a878,.55);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffd3a0,3.4);sun.castShadow=q>0;sun.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);
 Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:220});sun.shadow.bias=-.0003;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
 const ocean=new OceanView(scene,T,SUN,SUNC);ocean.setQuality(q);
 const world=buildWorld(scene,T,q);
 return{R,scene,cam,T,sky,ocean,world,sun,hemi,env};}
