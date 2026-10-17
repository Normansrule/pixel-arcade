// HARDFALL — two original battlefields described with a small builder DSL. Every solid is collision + visual; scene.js dresses them.
// y up, metres. Team 0 = KESTREL (west, -x), team 1 = ASHEN (east, +x). Streets are wide enough for frames (mechs); alleys between
// buildings are pilot-only wall-run lanes. Roofs at <= 5.2 m are reachable by CPU pilots (double jump + mantle); taller ones by ramp.
import {World,PHY} from './world.js';
import {V,rng} from './util.js';

export const FR={r:1.5,h:6.4,step:1.15};// frame (mech) body
export function buildMap(def){const W=new World();W.bounds=def.bounds;W.killY=def.killY??-30;
 const D={def,W,solids:[],ramps:[],deco:[],spawns:[],fronts:[],lights:[],lamps:[],signs:[]};
 const B={
  box(cx,y0,cz,w,h,d,mat='wall',o={}){const s=W.box(cx-w/2,y0,cz-d/2,cx+w/2,y0+h,cz+d/2,o);s.mat=mat;D.solids.push(s);return s;},
  cyl(cx,y0,cz,r,h,mat='metal',o={}){const s=W.cyl(cx,y0,cz,r,y0+h,o);s.mat=mat;D.solids.push(s);return s;},
  ramp(x0,z0,x1,z1,axis,dir,y0,y1,mat='deck',o={}){const r=W.ramp(x0,z0,x1,z1,axis,dir,y0,y1);r.mat=mat;r.o=o;D.ramps.push(r);return r;},
  // building: facade sides + roof slab + parapet (scene.js), optional sign
  bldg(cx,cz,w,d,h,mat='facA',o={}){return B.box(cx,0,cz,w,h,d,mat,{roof:true,...o});},
  // ISO shipping container 6.1 x 2.6 x 2.44 (rot: 0 = long along x)
  cont(x,z,rot=0,y=0,c=0,n=1){const M=['contR','contB','contG','contY','contW'];for(let i=0;i<n;i++)B.box(x,y+i*2.6,z,rot?2.44:6.1,2.6,rot?6.1:2.44,M[(c+i*2)%M.length],{cont:true,rot});},
  barrier(x,z,rot=0){B.box(x,0,z,rot?.7:3.6,1.15,rot?3.6:.7,'barrier',{bar:true,rot});},
  car(x,z,rot=0,c=0){const s=B.box(x,0,z,rot?1.9:4.4,1.45,rot?4.4:1.9,'none',{car:true,rot,c});D.deco.push({type:'car',x,z,rot,c});return s;},
  lamp(x,z,h=7,dx=0,dz=1){D.lamps.push({x,z,h,dx,dz});B.cyl(x,0,z,.16,h,'metal',{lamp:true});},
  sign(x,y,z,face,text,col,w=8){D.signs.push({x,y,z,face,text,col,w});},
  spawn(x,y,z,team=-1,yaw){D.spawns.push({p:new V(x,y,z),team,yaw:yaw??Math.atan2(x,z)});},
  front(x,y,z){D.fronts.push(new V(x,y,z));},
  deco(type,o){D.deco.push({type,...o});},light(x,y,z,c,i=20,d=30){D.lights.push({p:new V(x,y,z),c,i,d});},
  sym(fn){fn(1);fn(-1);}};
 def.build(B,rng(def.seed||7));
 W.buildNav(2,{r:.32,h:1.7,climb:5.2,step:.6,drop:14});
 // frames walk a coarser graph on the ground only (roofs are pilot country)
 const WM=Object.create(W);WM.buildNav(3,{r:FR.r,h:FR.h-.2,climb:0,step:1.1,drop:2,maxY:1.6,noLinks:true});D.WM=WM;
 return D;}

/* =============================================================== */
export const MAPS=[
{id:'kiln',name:'KILN YARD',sub:'FRONTIER DEPOT · GOLDEN HOUR',theme:'dusk',seed:11,bounds:[-74,74,-48,48],look:[0,0],
 desc:'A sun-baked freight depot on the frontier. Container stacks, a gantry crane over the haul road and warehouse roofs linked by wall-run alleys.',
 build(B,R){
  // ground: haul road along x, sand lots either side; cliffs around
  B.box(0,-2,0,148,2,14,'asphalt');B.sym(s=>{B.box(0,-2,s*27.5,148,2,41,'sand');});
  B.sym(s=>{B.box(s*76,-2,0,4,26,100,'cliff',{nowalk:true});B.box(0,-2,s*50,156,26,4,'cliff',{nowalk:true});});
  B.box(0,40,0,160,1,104,'none',{novis:true,nowalk:true});
  // central gantry crane spanning the road
  B.sym(s=>{B.box(0,0,s*11,2.2,10,2.2,'steel');B.box(0,7.6,s*11,6,.5,1,'steel');});B.box(0,10,0,3.2,.8,26,'steel',{trim:'o'});B.box(0,10.8,0,1.2,1.2,8,'hazard');
  B.sym(s=>{const t=s>0?1:0;
   // warehouse with an exterior ramp to the roof
   B.bldg(s*44,s*-26,22,14,8,'facC');B.ramp(s>0?33:-51,s>0?-19:16.5,s>0?51:-33,s>0?-16.5:19,'x',s,0,8,'deck',{trim:'o'});
   B.bldg(s*30.5,s*-41,10,10,5,'facB');
   // office block + annex with a 3 m wall-run alley between them
   B.bldg(s*52,s*24,12,14,10.5,'facA');B.bldg(s*38,s*26,10,10,5,'facB');B.bldg(s*38,s*38.5,10,9,7,'facD');
   // small shacks near the middle
   B.bldg(s*22,s*-24,10,8,5,'facD');B.bldg(s*22,s*24,8,8,4,'facB');B.bldg(s*8,s*-34,10,8,6.5,'facA');B.ramp(s>0?3:-13,s>0?-30:27.6,s>0?13:-3,s>0?-27.6:30,'x',-s,0,6.5,'deck',{trim:'c'});
   // containers
   B.cont(s*12,s*-14,0,0,0,2);B.cont(s*12,s*-11.4,0,0,1,1);B.cont(s*30,s*13.5,1,0,2,1);B.cont(s*32.6,s*13.5,1,0,3,2);B.cont(s*-6,s*20,0,0,4,1);
   B.cont(s*18,s*40,0,0,1,2);B.cont(s*-16,s*40,1,0,0,1);B.cont(s*58,s*-12,1,0,2,1);B.cont(s*28,s*-10.5,0,0,3,1);B.cont(s*-24,s*16,1,0,1,1);
   // fuel tanks behind spawn
   B.cyl(s*66,0,s*-36,3.2,7,'tank',{trim:'o'});B.cyl(s*66,0,s*-27,3.2,7,'tank',{trim:'o'});B.cyl(s*62,0,s*38,2.4,5,'tank',{trim:'c'});
   // road cover
   B.barrier(s*18,s*3.5);B.barrier(s*34,s*-3.5);B.barrier(s*-8,s*4.2,0);B.barrier(s*50,s*2,1);B.car(s*26,s*-4.6,0,t);B.car(s*-30,s*4.8,0,2);
   for(const x of[16,40,62])B.lamp(s*x,s*-7.6,7,0,s);
   B.sign(s*55,7.6,s*31.1,s>0?0:Math.PI,t?'ASHEN':'KESTREL',t?0xff6a2a:0x3d9bff,8);B.sign(s*32.9,5,s*-26,-s*Math.PI/2,'KILN · 07',0xffb040,6);
   // spawns (team side) + neutral
   for(const z of[-12,-4,4,12])B.spawn(s*66,0,s*z,t,s>0?Math.PI/2:-Math.PI/2);B.spawn(s*58,0,s*-20,t,s>0?Math.PI/2:-Math.PI/2);B.spawn(s*60,0,s*16,t,s>0?Math.PI/2:-Math.PI/2);
   for(const[x,z]of[[30,30],[36,-8],[14,-26]])B.spawn(s*x,0,s*z,-1);
   B.front(s*18,0,s*-2);B.front(s*24,0,s*30);
   B.light(s*44,6,s*-14,0xffa050,18,22);});
  B.front(0,0,0);B.front(0,0,-30);B.front(0,0,30);
  B.deco('mesas',{});}},

{id:'halcyon',name:'HALCYON HEIGHTS',sub:'COLONY CITY · BLUE HOUR',theme:'neon',seed:23,bounds:[-66,66,-52,52],look:[0,0],
 desc:'A colony city at blue hour, wet streets and neon. Run the elevated tramline, chain wall-runs down the alleys, brawl frames on the boulevard.',
 build(B,R){
  B.box(0,-2,0,132,2,104,'asphalt');B.sym(s=>{for(const zs of[1,-1]){B.box(s*13,0,zs*31,14,.15,42,'conc',{curb:true});B.box(s*49,0,zs*31,34,.15,42,'conc',{curb:true});}});
  B.sym(s=>{B.box(s*68,-2,0,4,30,108,'wallBig',{nowalk:true});B.box(0,-2,s*54,140,30,4,'wallBig',{nowalk:true});});
  B.box(0,42,0,140,1,110,'none',{novis:true,nowalk:true});
  // elevated tramline north-south over the plaza
  B.box(0,8.4,0,3.4,.7,100,'deck',{trim:'c'});for(const z of[-40,-22,22,40])B.cyl(0,0,z,.8,8.4,'conc2');B.box(0,9.1,0,.3,.6,100,'steel');
  B.sym(s=>{B.ramp(1.7,s>0?24:-44,4.9,s>0?44:-24,'z',-s,0,8.4,'deck',{trim:'c'});});
  // plaza monument
  B.cyl(0,0,0,2.4,1.2,'conc2',{trim:'c'});B.cyl(0,1.2,0,.9,7,'steel',{trim:'m'});
  B.sym(s=>{const t=s>0?1:0;
   // outer blocks
   B.bldg(s*44,s*18,14,12,10,'facA');B.bldg(s*44,s*35.5,14,13,5,'facB');B.bldg(s*45,s*-20,15,14,14,'facG');B.bldg(s*45,s*-38.5,15,13,5,'facD');
   B.ramp(s>0?37:-53,s>0?-31.8:29.4,s>0?53:-37,s>0?-29.4:31.8,'x',s,0,5,'deck',{trim:'m'});
   // inner blocks (alleys 3.5 m)
   B.bldg(s*13,s*20,10,12,6.5,'facD');B.bldg(s*13,s*37.5,10,13,12,'facA');B.bldg(s*13,s*-21,10,14,5,'facB');B.bldg(s*13,s*-38.5,10,10,7.5,'facG');
   B.ramp(s>0?7.5:-18.5,s>0?11.6:-14,s>0?18.5:-7.5,s>0?14:-11.6,'x',-s,0,6.5,'deck',{trim:'c'});
   // street furniture
   B.car(s*20,s*-5.5,0,t);B.car(s*36,s*6,0,2);B.car(s*26,s*24,1,1-t);B.car(s*-26,s*-30,1,3);B.barrier(s*8,s*-4,0);B.barrier(s*30,s*-2,1);B.barrier(s*52,s*5,0);
   B.cont(s*56,s*-17,1,0,1,1);B.cont(s*56,s*44,0,0,3,1);
   for(const x of[10,30,50])B.lamp(s*x,s*8.6,7.5,0,-s);for(const z of[-14,14,-40])B.lamp(s*20.5,s*z,7.5,s,0);
   B.sign(s*36.9,6.5,s*18,-s*Math.PI/2,t?'NOVA TEA':'SKYLINE',t?0xff3d9a:0x45d8ff,7);B.sign(s*37.4,9,s*-20,-s*Math.PI/2,t?'ASHEN':'KESTREL',t?0xff6a2a:0x3d9bff,8);B.sign(s*7.9,5.6,s*37.5,-s*Math.PI/2,'HOTEL',0xffc040,6);B.sign(s*18.1,4,s*20,s*Math.PI/2,'24 · 7',0x60ff9a,5);
   for(const z of[-12,-4,4,12])B.spawn(s*60,0,s*z,t,s>0?Math.PI/2:-Math.PI/2);B.spawn(s*56,0,s*-36,t,s>0?Math.PI/2:-Math.PI/2);B.spawn(s*58,0,s*28,t,s>0?Math.PI/2:-Math.PI/2);
   for(const[x,z]of[[26,40],[30,-12],[8,-46]])B.spawn(s*x,0,s*z,-1);
   B.front(s*26,0,s*0);B.front(s*26,0,s*-30);
   B.light(s*26,5,s*0,t?0xff3d9a:0x45d8ff,26,26);});
  B.front(0,0,0);B.front(0,8.4,-10);B.deco('skyline',{});}}
];
