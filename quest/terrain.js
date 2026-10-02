// WILD QUEST — island heightfield, biome masks and the map layout (points of interest).
import * as THREE from '../vendor/three.module.min.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';

export const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const NZ=new SimplexNoise({random:mulberry(7)});
export const noise2=(x,z)=>NZ.noise(x,z);
export const HALF=320,N=257,CELL=HALF*2/(N-1),SEA=0;
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const lerp=(a,b,t)=>a+(b-a)*t;
const fbm=(x,z,o=4)=>{let s=0,a=1,f=1,n=0;for(let i=0;i<o;i++){s+=NZ.noise(x*f,z*f)*a;n+=a;a*=.5;f*=2.03;}return s/n;};

/* ---------------- layout ---------------- */
export const POI={
 start:{x:0,z:186,h:24},
 lake:{x:138,z:58,r:46,level:9},
 mountain:{x:-112,z:-138},
 ruins:{x:86,z:-28,r:30,h:15},
 castle:{x:22,z:-212,r:46,h:36},
 shrines:[
  {x:38,z:148,name:'Dawnrise Shrine',trial:'weight'},
  {x:-168,z:38,name:'Whisperwood Shrine',trial:'sparks'},
  {x:146,z:66,name:'Mirrormere Shrine',trial:'sphere'},
  {x:-84,z:-110,name:'Frostcrown Shrine',trial:'ascent'}],
 camps:[
  {x:-66,z:112,grunts:2,archers:0,towers:0},
  {x:44,z:44,grunts:3,archers:1,towers:1},
  {x:200,z:-28,grunts:2,archers:1,towers:1},
  {x:14,z:-136,grunts:3,archers:2,towers:2}],
 regions:[
  {x:0,z:170,r:70,name:'Dawnrise Meadow'},{x:-150,z:50,r:85,name:'Whisperwood'},{x:138,z:58,r:62,name:'Mirrormere'},
  {x:-112,z:-138,r:70,name:'Frostcrown Peak'},{x:86,z:-28,r:42,name:'Ruins of Ostvale'},{x:22,z:-205,r:60,name:'Thornhold Keep'},
  {x:-20,z:30,r:90,name:'Heartland Vale'},{x:180,z:-120,r:90,name:'Saltwind Cliffs'}],
};
// road polylines (dirt paths) between landmarks
export const ROADS=[
 [[0,186],[10,160],[38,148],[40,110],[44,60],[60,10],[86,-28]],
 [[44,60],[20,10],[18,-60],[16,-120],[20,-150],[22,-168]],
 [[10,160],[-30,130],[-66,112],[-110,80],[-168,38]],
 [[60,10],[110,20],[138,8],[200,-28]],
 [[-30,130],[-60,40],[-74,-40],[-84,-100]],
];
function segDist(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz;let t=((x-a[0])*dx+(z-a[1])*dz)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);}
export function roadDist(x,z){let d=1e9;for(const r of ROADS)for(let i=0;i<r.length-1;i++)d=Math.min(d,segDist(x,z,r[i],r[i+1]));return d;}

/* ---------------- analytic height ---------------- */
function rawH(x,z){
 const a=Math.atan2(z,x),r=Math.hypot(x,z);
 const R=242+NZ.noise(Math.cos(a)*1.3,Math.sin(a)*1.3)*26+NZ.noise(Math.cos(a)*3.2+5,Math.sin(a)*3.2)*9;
 const land=ss(R+30,R-40,r);
 let h=-24+land*32;
 h+=land*(fbm(x*.0055,z*.0055)*15+NZ.noise(x*.028,z*.028)*2.6+NZ.noise(x*.09,z*.09)*.5);
 // Frostcrown peak with ridges
 const mx=x-POI.mountain.x,mz=z-POI.mountain.z,dm=Math.hypot(mx,mz);
 const ridge=1-Math.abs(NZ.noise(x*.02,z*.02));h+=land*(74*Math.exp(-dm*dm/(2*44*44))*(.82+ridge*.3)+24*Math.exp(-dm*dm/(2*90*90)));
 // eastern cliffs
 h+=land*18*ss(140,230,x-z*.3)*ss(-40,-140,z);
 // south coastal cliff under the start plateau
 const ds=Math.hypot(x-POI.start.x,z-POI.start.z);h=lerp(h,POI.start.h+NZ.noise(x*.05,z*.05)*.6,ss(46,20,ds));
 // castle plateau with cliffs, road ramp from the south
 const c=POI.castle,dc=Math.hypot(x-c.x,z-c.z);{const hill=lerp(h,Math.max(h,c.h-15),ss(c.r+36,c.r+10,dc)),cliff=lerp(hill,c.h,ss(c.r+8,c.r+1,dc)),gentle=lerp(h,c.h,ss(c.r+44,c.r,dc)),ramp=ss(10,5,Math.abs(x-c.x))*ss(c.z+24,c.z+44,z);h=lerp(cliff,gentle,ramp);}
 // ruins dell
 const ru=POI.ruins,dr=Math.hypot(x-ru.x,z-ru.z);h=lerp(h,ru.h+NZ.noise(x*.08,z*.08)*.4,ss(ru.r+16,ru.r-6,dr));
 // camps flatten
 for(const cp of POI.camps){const d=Math.hypot(x-cp.x,z-cp.z);if(d<26){const hc=campH(cp);h=lerp(h,hc,ss(22,12,d));}}
 // lake: raised rim then basin
 const L=POI.lake,dl=Math.hypot(x-L.x,z-L.z);h=Math.max(h,lerp(h,L.level+2.2,ss(L.r+30,L.r+8,dl)));h=lerp(h,L.level-5-NZ.noise(x*.05,z*.05)*1.5,ss(L.r+4,L.r-14,dl));
 // shrine pads (the lake shrine sits on an islet)
 for(const s of POI.shrines){const d=Math.hypot(x-s.x,z-s.z);const hs=s.h??(s.h=shrineH(s));h=lerp(h,hs,ss(14,7,d));}
 // roads: soften
 return h;}
const campCache=new Map();function campH(cp){if(!campCache.has(cp)){let s=0;for(let i=0;i<8;i++){const a=i/8*6.283;s+=rawNoCamp(cp.x+Math.cos(a)*6,cp.z+Math.sin(a)*6);}campCache.set(cp,Math.max(3,s/8));}return campCache.get(cp);}
function rawNoCamp(x,z){const save=POI.camps;POI.camps=[];const h=rawH(x,z);POI.camps=save;return h;}
function shrineH(s){if(s.trial==='sphere')return POI.lake.level+1.6;const save=POI.shrines;POI.shrines=[];let t=0;for(let i=0;i<6;i++){const a=i/6*6.283;t+=rawH(s.x+Math.cos(a)*4,s.z+Math.sin(a)*4);}POI.shrines=save;return t/6+.3;}

/* ---------------- grid ---------------- */
export const H=new Float32Array(N*N),GRASS=new Float32Array(N*N),FLOWER=new Float32Array(N*N),FOREST=new Float32Array(N*N),PATH=new Float32Array(N*N),SHADE=new Float32Array(N*N);
for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-HALF+i*CELL,z=-HALF+j*CELL;H[j*N+i]=rawH(x,z);}
// road carve/flatten pass
for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-HALF+i*CELL,z=-HALF+j*CELL,d=roadDist(x,z);PATH[j*N+i]=ss(3.4,1.6,d+NZ.noise(x*.2,z*.2)*.7);}
export function heightAt(x,z){const gx=(x+HALF)/CELL,gz=(z+HALF)/CELL;if(gx<0||gz<0||gx>=N-1||gz>=N-1)return -24;const i=gx|0,j=gz|0,fx=gx-i,fz=gz-j,k=j*N+i;
 return(H[k]*(1-fx)+H[k+1]*fx)*(1-fz)+(H[k+N]*(1-fx)+H[k+N+1]*fx)*fz;}
export function sampleGrid(A,x,z){const gx=(x+HALF)/CELL,gz=(z+HALF)/CELL;if(gx<0||gz<0||gx>=N-1||gz>=N-1)return 0;const i=gx|0,j=gz|0,fx=gx-i,fz=gz-j,k=j*N+i;return(A[k]*(1-fx)+A[k+1]*fx)*(1-fz)+(A[k+N]*(1-fx)+A[k+N+1]*fx)*fz;}
export function gradAt(x,z,out={x:0,z:0}){const e=.6;out.x=(heightAt(x+e,z)-heightAt(x-e,z))/(2*e);out.z=(heightAt(x,z+e)-heightAt(x,z-e))/(2*e);return out;}
export function normalAt(x,z,v=new THREE.Vector3()){const g=gradAt(x,z);return v.set(-g.x,1,-g.z).normalize();}
export function inLake(x,z){return Math.hypot(x-POI.lake.x,z-POI.lake.z)<POI.lake.r+6;}
export function waterAt(x,z){return inLake(x,z)?POI.lake.level:SEA;}
// clearings where nothing grows (structures)
export function clearing(x,z,pad=0){
 if(Math.hypot(x-POI.start.x,z-POI.start.z)<10+pad)return true;
 if(Math.hypot(x-POI.castle.x,z-POI.castle.z)<POI.castle.r+8+pad)return true;
 if(Math.hypot(x-POI.ruins.x,z-POI.ruins.z)<POI.ruins.r+4+pad)return true;
 for(const s of POI.shrines)if(Math.hypot(x-s.x,z-s.z)<10+pad)return true;
 for(const c of POI.camps)if(Math.hypot(x-c.x,z-c.z)<15+pad)return true;
 return false;}
export function forestDensity(x,z){
 const w=ss(105,40,Math.hypot(x+150,z-48))*.95;
 const patches=ss(.4,.7,NZ.noise(x*.012+40,z*.012));
 const hgt=heightAt(x,z);const pine=ss(28,40,hgt)*ss(78,64,hgt)*ss(150,60,Math.hypot(x-POI.mountain.x,z-POI.mountain.z));
 return Math.min(1,Math.max(w,patches*.55,pine*.8));}
// biome masks
for(let j=0;j<N;j++)for(let i=0;i<N;i++){const k=j*N+i,x=-HALF+i*CELL,z=-HALF+j*CELL,h=H[k];
 const gx=(H[j*N+Math.min(N-1,i+1)]-H[j*N+Math.max(0,i-1)])/(2*CELL),gz=(H[Math.min(N-1,j+1)*N+i]-H[Math.max(0,j-1)*N+i])/(2*CELL),sl=Math.hypot(gx,gz);
 const lakeBed=inLake(x,z)&&h<POI.lake.level+.3;
 let g=ss(1.6,3.2,h)*ss(.95,.55,sl)*ss(80,66,h)*(1-PATH[k])*(lakeBed?0:1);
 if(clearing(x,z,-4))g*=POI.camps.some(c=>Math.hypot(x-c.x,z-c.z)<19)?.35:0;
 const fo=forestDensity(x,z);FOREST[k]=fo;
 g*=.55+.45*ss(-.3,.4,NZ.noise(x*.035,z*.035));GRASS[k]=g;
 FLOWER[k]=g*ss(.35,.75,NZ.noise(x*.02-9,z*.02+3))*(1-fo*.8);}

/* GPU copy for grass / water shaders: R height, G grass, B flowers, A light (1 = open sky) */
export function makeHeightTexture(){const d=new Float32Array(N*N*4);for(let k=0;k<N*N;k++){d[k*4]=H[k];d[k*4+1]=GRASS[k];d[k*4+2]=FLOWER[k];d[k*4+3]=1-SHADE[k];}
 const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat,THREE.FloatType);t.minFilter=t.magFilter=THREE.NearestFilter;t.needsUpdate=true;return t;}
export function addShade(x,z,r,amt){const i0=Math.max(0,Math.floor((x-r+HALF)/CELL)),i1=Math.min(N-1,Math.ceil((x+r+HALF)/CELL)),j0=Math.max(0,Math.floor((z-r+HALF)/CELL)),j1=Math.min(N-1,Math.ceil((z+r+HALF)/CELL));
 for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const dx=-HALF+i*CELL-x,dz=-HALF+j*CELL-z,d=Math.hypot(dx,dz);if(d<r){const k=j*N+i;SHADE[k]=Math.min(.8,SHADE[k]+amt*(1-d/r));}}}
export const GLSL_HMAP=`uniform sampler2D uHMap;
vec4 hmap(vec2 xz){vec2 g=(xz+${HALF}.)/${(CELL).toFixed(6)};g=clamp(g,vec2(0.),vec2(${N-1}.001));vec2 i=floor(g),f=g-i;ivec2 a=ivec2(i);ivec2 b=min(a+1,ivec2(${N-1}));
 vec4 h00=texelFetch(uHMap,a,0),h10=texelFetch(uHMap,ivec2(b.x,a.y),0),h01=texelFetch(uHMap,ivec2(a.x,b.y),0),h11=texelFetch(uHMap,b,0);return mix(mix(h00,h10,f.x),mix(h01,h11,f.x),f.y);}`;
export {ss,lerp,fbm};
