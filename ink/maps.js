// GLOSS RIOT — two original arenas described with a tiny builder DSL. Every solid is collision + paintable surface;
// paint.js turns their faces into an ink atlas, scene.js dresses the surroundings. y up, metres.
// Team 0 spawns at -z, team 1 at +z; every layout is point-symmetric (x,z) -> (-x,-z) so both sides are fair.
import {World} from './world.js';
import {V,rng} from './util.js';

export function buildMap(def){const W=new World();W.bounds=def.bounds;W.killY=def.killY??-30;
 const D={def,W,solids:[],ramps:[],spawns:[[],[]],zones:[],props:[],water:def.water??null};
 const B={
  box(cx,y0,cz,w,h,d,mat='floor',o={}){const s=W.box(cx-w/2,y0,cz-d/2,cx+w/2,y0+h,cz+d/2,o);s.mat=mat;D.solids.push(s);return s;},
  ramp(x0,z0,x1,z1,axis,dir,y0,y1,mat='ramp',o={}){const r=W.ramp(x0,z0,x1,z1,axis,dir,y0,y1);r.mat=mat;r.o=o;D.ramps.push(r);return r;},
  // mirrored helpers: s=+1 as written, s=-1 rotated 180 degrees about the centre
  mbox(s,cx,y0,cz,w,h,d,mat,o){return B.box(s*cx,y0,s*cz,w,h,d,mat,o);},
  mramp(s,x0,z0,x1,z1,axis,dir,y0,y1,mat,o){return s>0?B.ramp(x0,z0,x1,z1,axis,dir,y0,y1,mat,o):B.ramp(-x1,-z1,-x0,-z0,axis,-dir,y0,y1,mat,o);},
  spawn(t,x,y,z){D.spawns[t].push(new V(x,y,z));},
  zone(x0,z0,x1,z1,y){D.zones.push({x0,z0,x1,z1,y});},
  prop(type,o){D.props.push({type,...o});},
  crate(x,y,z,s=1.3,mat='crate'){return B.box(x,y,z,s,s,s,mat);},
  sym(fn){fn(1);fn(-1);}};
 def.build(B,rng(def.seed||7));W.buildNav();return D;}

/* =============================================================== */
export const MAPS=[
{id:'pier',name:'SPRINKLE PIER',sub:'HARBOUR BOARDWALK · CANAL CROSSINGS · CENTRE TOWER',theme:'pier',seed:11,bounds:[-26,26,-46,46],killY:-4,water:-1.1,
 desc:'A candy-coloured boardwalk on a turquoise harbour. Three crossings span the canals, the centre tower overlooks everything — and the water is no place to swim.',
 build(B){
  // centre slab + tower
  B.box(0,-3,0,44,3,16,'floor');
  B.box(0,0,0,8,2.2,8,'tower');B.box(0,2.2,0,8.4,.25,8.4,'trim',{nopaint:false});
  B.sym(s=>{
   // half slabs, canal crossings
   B.mbox(s,0,-3,-22,44,3,20,'floor');
   for(const x of[-18,0,18])B.mbox(s,x,-3,-10,x?8:8,3,4.2,'deck');
   // tower ramp (rises toward the tower)
   B.mramp(s,-4,-11,0,-4,'z',1,0,2.2,'ramp');
   // base deck with two ramps and a rail
   B.mbox(s,0,-3,-38.5,18,5,13,'base');
   B.mramp(s,-8.5,-32,-4,-27,'z',-1,0,2,'ramp');B.mramp(s,4,-32,8.5,-27,'z',-1,0,2,'ramp');
   B.mbox(s,0,2,-44.6,18,.9,.6,'rail',{nopaint:true});B.mbox(s,-8.7,2,-38.5,.6,.9,12,'rail',{nopaint:true});B.mbox(s,8.7,2,-38.5,.6,.9,12,'rail',{nopaint:true});
   // flank ledges (jumpable 1.1) with a ramp
   B.mbox(s,-18.5,0,-22,7,1.1,10,'ledge');B.mramp(s,-22,-17,-15,-13.5,'z',-1,0,1.1,'ramp');
   B.mbox(s,18.5,0,-24.5,7,1.1,5,'ledge');
   // cover
   B.mbox(s,-8,0,-20,2.4,1.25,1.2,'block');B.mbox(s,8,0,-18,1.2,1.25,3,'block');B.mbox(s,0,0,-17,4,1.25,1.2,'block');
   B.mbox(s,-13,0,-27,1.4,2.6,1.4,'pillar');B.mbox(s,13,0,-28,1.4,2.6,1.4,'pillar');
   B.crate(s*4,0,s*-23.5,1.3);B.crate(s*12.5,0,s*-14.5,1.5);B.crate(s*-4.5,0,s*-14,1.2,'crate2');
   B.mbox(s,-9,0,-4,1.2,1.25,5,'block');B.mbox(s,9,0,4.5,3,3,1.2,'wall');B.mbox(s,15,0,-3,4,1.25,1.2,'block');
   B.crate(s*-16,0,s*-5,1.4,'crate2');B.crate(s*-5.6,0,s*6.2,1.2);
   B.mbox(s,-19,0,-38,2,1.4,2,'block');B.mbox(s,19,0,-38,2,1.4,2,'block');
   // side wings at base level (low)
   B.mbox(s,-17,-3,-37,8,3,12,'floor');B.mbox(s,17,-3,-37,8,3,12,'floor');
   // spawns on the base deck
   const t=s>0?0:1;for(const x of[-4.5,-1.5,1.5,4.5])B.spawn(t,s*x,2,s*-40.5);
   // decor
   B.prop('lamp',{x:s*-21.5,z:s*-12});B.prop('lamp',{x:s*21.5,z:s*-30});B.prop('buoy',{x:s*-9,z:s*-10,y:-1});B.prop('buoy',{x:s*9,z:s*-10,y:-1});
   B.prop('spawnpad',{x:0,y:2,z:s*-40.5,team:t});});
  B.zone(-4,-4,4,4,2.45);}},

{id:'park',name:'GUMDROP SKATEPARK',sub:'SUNKEN BOWL · FLANK DECKS · FUNBOXES',theme:'park',seed:23,bounds:[-30,30,-41,41],killY:-12,water:null,
 desc:'A walled skatepark at golden hour. Drop into the sunken bowl, ride the quarter-ramps onto the flank decks and paint every funbox you can find.',
 build(B){
  // ground ring around the bowl (hole x,z in [-8,8])
  B.sym(s=>{B.mbox(s,0,-2,-19,58,2,22,'floor');B.mbox(s,-18.5,-2,0,21,2,16,'floor');});
  B.box(0,-4,0,16,2.4,16,'bowl');
  B.sym(s=>{
   B.mramp(s,-4,-8,4,-4,'z',-1,-1.6,0,'ramp');B.mramp(s,-8,-4,-4,4,'x',-1,-1.6,0,'ramp');
   // pit corners as little steps
   B.mbox(s,-6,-1.6,-6,4,1.6,4,'block');B.mbox(s,6,-1.6,-6,4,.8,4,'block');
   // base pad (raised) + ramps down
   B.mbox(s,0,0,-35,20,1.2,10,'base');B.mramp(s,-10,-30,-5,-26,'z',-1,0,1.2,'ramp');B.mramp(s,5,-30,10,-26,'z',-1,0,1.2,'ramp');
   B.mbox(s,0,-2,-35,20,2,10,'floor');B.mbox(s,-19.5,-2,-35,19,2,10,'floor');B.mbox(s,19.5,-2,-35,19,2,10,'floor');
   // flank deck (2.4 high) with a long ramp and a quarter ramp from the inside
   B.mbox(s,22.5,0,0,9,2.4,24,'deck');B.mramp(s,20,-20,25,-12,'z',1,0,2.4,'ramp');B.mramp(s,14,-4,18,4,'x',1,0,2.4,'ramp');
   B.mbox(s,-22.5,0,-30,6,1,6,'ledge');
   // funboxes (1.0 high, ramps both sides)
   B.mbox(s,-13,0,-18,4,1,4,'fun');B.mramp(s,-17.5,-20,-15,-16,'x',1,0,1,'ramp');B.mramp(s,-11,-20,-8.5,-16,'x',-1,0,1,'ramp');
   B.mbox(s,10,0,-20,6,1,3,'fun');
   // cover + rails
   B.mbox(s,0,0,-16,6,1.25,1.2,'block');B.mbox(s,-24,0,-17,1.2,1.25,5,'block');B.mbox(s,4,0,-24,1.4,2.8,1.4,'pillar');B.mbox(s,-4,0,-24,1.4,2.8,1.4,'pillar');
   B.crate(s*13,0,s*-9,1.4);B.crate(s*-11,0,s*7.5,1.3,'crate2');B.crate(s*16,0,s*-27,1.4,'crate2');B.mbox(s,10.5,0,10,1.2,1.25,4,'block');
   B.mbox(s,22,0,-26,6,2.6,1.2,'wall');
   // outer walls (paintable)
   B.mbox(s,0,-2,-40.6,64,7,1.2,'outer');B.mbox(s,29.6,-2,0,1.2,7,82.4,'outer');
   const t=s>0?0:1;for(const x of[-4.5,-1.5,1.5,4.5])B.spawn(t,s*x,1.2,s*-36.5);
   B.prop('lamp',{x:s*-29,z:s*-20});B.prop('lamp',{x:s*29,z:s*14});B.prop('spawnpad',{x:0,y:1.2,z:s*-36.5,team:t});});
  B.zone(-4,-4,4,4,-1.6);}}
];
