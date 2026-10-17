// ZENITH PROTOCOL — two original objective maps described with a small builder DSL. Every solid is collision + visual; scene.js dresses
// them per theme. Coordinates: y up, metres, x runs along the payload route (attackers start at -x). Each map has a payload route with
// two checkpoints, staged spawns for attackers (A0..A2) and defenders (D0..D2), and a central control point used by CONTROL.
import {World} from './world.js';
import {V,rng} from './util.js';

export function buildMap(def){const W=new World();W.bounds=def.bounds;W.killY=-20;
 const D={def,W,solids:[],ramps:[],houses:[],props:[],lights:[],route:[],cps:[],spawns:{},point:null,gates:[],signs:[]};
 const B={
  box(cx,y0,cz,w,h,d,mat='stone',o={}){const s=W.box(cx-w/2,y0,cz-d/2,cx+w/2,y0+h,cz+d/2,o);s.mat=mat;s.col=o.col;D.solids.push(s);return s;},
  cyl(cx,y0,cz,r,h,mat='stone',o={}){const s=W.cyl(cx,y0,cz,r,y0+h,o);s.mat=mat;s.col=o.col;D.solids.push(s);return s;},
  ramp(x0,z0,x1,z1,axis,dir,y0,y1,mat='stone',o={}){const r=W.ramp(x0,z0,x1,z1,axis,dir,y0,y1);r.mat=mat;r.o=o;D.ramps.push(r);return r;},
  // building: solid block from y0 up h; visual style (roof, palette, windows, signs) handled by the scene dresser
  house(x0,z0,x1,z1,h,o={}){const y0=o.y0||0;const s=W.box(x0,y0,z0,x1,y0+h,z1,{nowalk:true});s.mat='house';s.house={x0,z0,x1,z1,y0,h,...o};D.solids.push(s);D.houses.push(s.house);return s;},
  wall(x0,z0,x1,z1,h,mat='stone',o={}){return B.box((x0+x1)/2,o.y0||0,(z0+z1)/2,Math.abs(x1-x0)||(mat==='rail'?.15:.6),h,Math.abs(z1-z0)||(mat==='rail'?.15:.6),mat,o);},
  inv(x0,z0,x1,z1){return W.box(x0,-5,z0,x1,30,z1,{nowalk:true});},
  route(pts,cps){D.route=pts.map(([x,z,y=0])=>new V(x,y,z));D.cps=cps;},
  spawn(key,x,y,z){(D.spawns[key]||(D.spawns[key]=[])).push(new V(x,y,z));},
  point(x,y,z,r=5.5){D.point={p:new V(x,y,z),r};},
  prop(type,x,y,z,o={}){const p={type,x,y,z,...o};D.props.push(p);
   if(type==='crate'){const s=o.s||1.3;for(let i=0;i<(o.n||1);i++){const k=i?.82:1;B.box(x+(i?.12:0),y+(i?s:0),z+(i?-.08:0),s*k,s*k,s*k,'crate');}}
   else if(type==='barrel')B.cyl(x,y,z,.42,1.1,'barrel',{col:o.col});
   else if(type==='stall')B.box(x,y,z,o.w||3,1.05,o.d||1.6,'wood');
   else if(type==='planter')B.box(x,y,z,o.w||2.4,.8,o.d||1.2,'stone');
   else if(type==='tree'||type==='palm')B.cyl(x,y,z,.28,3,'none',{novis:true});
   else if(type==='lamp')B.cyl(x,y,z,.14,3.5,'none',{novis:true});
   else if(type==='fountain')B.cyl(x,y,z,o.r||1.5,1,'stone');
   else if(type==='container')B.box(x,y,z,o.rot?2.5:6,2.6,o.rot?6:2.5,'container',{col:o.col});
   else if(type==='car')B.box(x,y,z,o.rot?1.9:4.2,1.4,o.rot?4.2:1.9,'none',{novis:true});
   else if(type==='bench')B.box(x,y,z,o.rot?.6:2,.5,o.rot?2:.6,'none',{novis:true});
   return p;},
  light(x,y,z,c,i=20,d=30){D.lights.push({p:new V(x,y,z),c,i,d});},
  gate(x,z,ang,w=9,o={}){D.gates.push({x,z,ang,w,...o});},
  sign(x,y,z,face,text,col,w=6){D.signs.push({x,y,z,face,text,col,w});}};
 def.build(B,rng(def.seed||7));
 // sanity: the payload route must stay clear of solids (logged for map authors)
 D.routeBlock=0;for(let i=0;i<D.route.length-1;i++){const a=D.route[i],b=D.route[i+1],L=a.distanceTo(b);for(let s=0;s<=L;s+=1){const p=a.clone().lerp(b,s/L);if(!W.free(p.x,p.y+.05,p.z,1.2,1.6))D.routeBlock++;}}
 W.buildNav();return D;}

/* =============================================================== */
const ROUTE_CLEAR=1;
export const MAPS=[
{id:'celeste',name:'PORTO CELESTE',sub:'SUNLIT HARBOUR TOWN · MARKET SQUARE · SEA TERRACE',theme:'coast',seed:11,bounds:[-78,78,-31,33],
 desc:'Escort the cargo core from the harbour gate, across the market square and up to the lighthouse docks. Balconies and the café terrace overlook every bend.',
 build(B){
  B.box(0,-1,1,160,1,66,'paving');
  // boundaries: seawall + promenade to the south, invisible walls around
  B.box(0,0,-30.5,156,1.1,1,'stone');B.inv(-90,-40,90,-31.2);B.inv(-90,33.2,90,45);B.inv(-90,-40,-77.6,45);B.inv(77.6,-40,90,45);
  B.route([[-66,0],[-34,0],[-24,-10],[-4,-10],[6,0],[30,0],[40,10],[68,10]],[60,104.4]);
  // ---- attacker yard (west) ----
  B.wall(-78,-14,-66,-14,5,'stone');B.wall(-78,14,-66,14,5,'stone');B.wall(-77.5,-14,-77.5,14,6,'stone');B.gate(-66,0,0,26,{tall:7});
  for(const z of[-8,-4,0,4,8])B.spawn('A0',-72,0,z);
  // ---- section A: harbour street ----
  B.house(-62,7,-48,20,9,{col:'#f1e3c8',roof:'gable',shut:'#3c8a6a',awn:'s'});
  B.box(-55,4,6,14,.4,2.2,'wood');B.wall(-62,4.95,-50,4.95,1,'rail',{y0:4.4});B.ramp(-48,4.9,-41,7.1,'x',-1,0,4.4,'wood');
  B.house(-40,8,-30,22,6,{col:'#e9a58a',roof:'flat',shut:'#2f5f8a'});
  B.house(-64,-26,-40,-6,8,{col:'#f4d79a',roof:'gable',shut:'#2f6f9a',awn:'n'});
  B.house(-78,22,-56,33,11,{col:'#e7cfb0',roof:'gable',shut:'#7a4a8a'});B.house(-54,24,-34,33,9,{col:'#cfe0d8',roof:'gable',shut:'#c25a3a'});
  B.house(-78,-30,-68,-16,7,{col:'#e0c9a8',roof:'flat',shut:'#3c8a6a'});
  B.prop('crate',-56,0,-3.4,{n:2});B.prop('crate',-46,0,3.6,{s:1.1});B.prop('barrel',-60,0,3.3);B.prop('barrel',-59.2,0,4,{col:'#2f6f9a'});B.prop('stall',-50,0,-3.6,{c1:'#d84a3a',c2:'#f4efe4'});
  B.prop('planter',-38,0,-4.2,{w:2.6});B.prop('crate',-30,0,4.2,{n:2,s:1.2});
  for(const x of[-60,-48,-36])B.prop('lamp',x,0,-4.8);for(const x of[-56,-44])B.prop('lamp',x,0,4.8);
  for(const x of[-58,-48,-26,-14])B.prop('palm',x,0,-28);for(const x of[-52,-40,-32])B.prop('bench',x,0,-28.6);
  // ---- section B: market square, café terrace (south), clock tower (north-west) ----
  B.cyl(-2,0,8,5.5,.45,'stone',{trim:1});B.prop('fountain',-2,.45,8,{r:1.5});B.point(-2,.45,8,5.5);
  B.box(1,0,-24.5,26,4,11,'stone');B.wall(-12,-19.1,14,-19.1,1,'rail',{y0:4});
  B.house(-6,-29,8,-24.5,4.6,{y0:4,col:'#f7f1e6',roof:'flat',shut:'#c25a3a',awn:'n'});
  B.ramp(-19,-28,-12,-22,'x',1,0,4,'stone');B.ramp(14,-28,21,-22,'x',-1,0,4,'stone');
  B.house(-26,14,-12,24,9,{col:'#f0c8a0',roof:'gable',shut:'#2f5f8a',tower:1});B.cyl(-12,0,14,2.2,16,'stone',{tower:1});
  B.house(8,14,24,24,8,{col:'#d8e6f0',roof:'gable',shut:'#c27a2a',awn:'s'});B.house(-30,24,-12,33,10,{col:'#efe0c0',roof:'gable',shut:'#3c8a6a'});B.house(8,24,32,33,11,{col:'#f2d0c8',roof:'gable',shut:'#2f6f9a'});
  B.wall(-10,18.2,-6,18.2,3.5,'stone');B.wall(2,18.2,6,18.2,3.5,'stone');B.gate(-2,18.2,Math.PI/2,8);
  for(const[x,z]of[[-6,26],[-2,28],[2,26],[-4,22],[0,22]])B.spawn('D0',x,0,z);for(const[x,z]of[[-6,26],[-2,28],[2,26],[-4,22],[0,22]])B.spawn('A2',x,0,z);
  B.house(22,-26,34,-7,7,{col:'#e8b8a0',roof:'gable',shut:'#3c6a8a',awn:'n'});
  B.prop('stall',-14,0,-2,{c1:'#2f8ac2',c2:'#f4efe4'});B.prop('stall',12,0,6,{c1:'#e0a020',c2:'#f4efe4'});B.prop('stall',14,0,-6,{c1:'#3aa060',c2:'#f4efe4'});
  B.prop('crate',-9,0,-3,{n:1});B.prop('crate',4,0,-15,{n:2});B.prop('planter',-15,0,-15.4,{w:3});B.prop('barrel',18,0,-12);B.prop('barrel',18.8,0,-12.6,{col:'#c25a3a'});B.prop('crate',20,0,4,{n:2,s:1.2});
  B.prop('tree',-16,0,8);B.prop('tree',12,0,12);B.prop('tree',-8,4,-21);B.prop('tree',10,4,-21);
  for(const[x,z]of[[-34,-22],[-30,-25],[-26,-22],[-34,-26],[-28,-19]])B.spawn('A1',x,0,z);
  // ---- section C: lighthouse docks ----
  B.house(34,18,54,33,10,{col:'#f4e8d0',roof:'gable',shut:'#2f6f9a'});B.box(44,4,16.6,20,.4,2.8,'wood');B.wall(36,15.3,54,15.3,1,'rail',{y0:4.4});B.ramp(26,15.2,34,18,'x',1,0,4.4,'wood');
  B.house(44,-26,62,-4,9,{col:'#cfd8e8',roof:'gable',shut:'#c25a3a',awn:'n'});B.house(62,-30,78,-16,9,{col:'#efd8b8',roof:'flat',shut:'#3c8a6a'});
  B.house(60,16,78,33,11,{col:'#f6e6c0',roof:'gable',shut:'#7a4a8a',light:1});B.house(56,22,60,33,7,{col:'#d8c0a0',roof:'flat'});
  B.wall(36,-30,36,-14,4.5,'stone');B.wall(44,-30,44,-26,4.5,'stone');for(const[x,z]of[[40,-24],[40,-20],[38,-27],[42,-27],[38,-18]])B.spawn('D1',x,0,z);
  B.wall(70,-14,78,-14,5,'stone');B.wall(70,-14,70,-1,5,'stone');B.gate(74,4,Math.PI/2,8);for(const[x,z]of[[74,-8],[74,-4],[74,0],[72,-11],[76,-2]])B.spawn('D2',x,0,z);
  B.prop('crate',48,0,5.6,{n:2});B.prop('barrel',56,0,14.4);B.prop('barrel',55.2,0,15,{col:'#2f6f9a'});B.prop('crate',36,0,-6,{n:1,s:1.4});B.prop('planter',62,0,4.6,{w:3});B.prop('crate',26,0,-4.2,{n:2,s:1.1});
  for(const x of[36,48,60])B.prop('lamp',x,0,5.2);for(const x of[44,56])B.prop('lamp',x,0,14.8);B.prop('palm',30,0,-28);B.prop('palm',52,0,-28);B.prop('palm',66,0,6);
  B.gate(-10,-10,0,10,{cp:1});B.gate(30,0,0,10,{cp:1});B.gate(68,10,0,10,{cp:2});
  for(const[x,z]of[[-72,-8],[-72,-4],[-72,0],[-72,4],[-72,8]])B.spawn('C0',x,0,z);for(const[x,z]of[[74,-8],[74,-4],[74,0],[72,-11],[76,-2]])B.spawn('C1',x,0,z);
  B.light(-2,4,8,0xffd8a0,14,18);}},

{id:'verge',name:'NEON VERGE',sub:'NIGHT DISTRICT · RAIL YARD · NEON PLAZA',theme:'neon',seed:23,bounds:[-72,72,-36,36],
 desc:'A rain-slick night district. Push the cargo core out of the rail yard, around the neon plaza and down the market canyon. Catwalks and a plaza terrace give the high ground.',
 build(B){
  B.box(0,-1,0,150,1,76,'asphalt');B.inv(-90,-50,90,-35.6);B.inv(-90,35.6,90,50);B.inv(-90,-50,-71.6,50);B.inv(71.6,-50,90,50);
  B.route([[-58,-16],[-30,-16],[-20,-6],[-20,8],[-8,18],[14,18],[24,8],[24,-6],[34,-16],[58,-16]],[71.7,121.8]);
  // attacker bay
  B.wall(-72,-26,-62,-26,5,'concrete');B.wall(-72,-6,-62,-6,5,'concrete');B.gate(-62,-16,0,20,{tall:6});for(const z of[-22,-19,-16,-13,-10])B.spawn('A0',-67,0,z);for(const z of[-22,-19,-16,-13,-10])B.spawn('C0',-67,0,z);
  // section A: rail yard
  B.house(-56,-4,-29,14,9,{col:'#6a7480',mat:'metal',roof:'flat',neon:'#ff3d9a',sign:'YARD 9'});
  B.house(-56,-36,-28,-24,11,{col:'#8a8a90',mat:'concrete',roof:'flat',neon:'#3dd8ff'});B.box(-42,3.6,-22.6,16,.4,2.8,'grate');B.wall(-50,-21.3,-34,-21.3,1,'rail',{y0:4});B.ramp(-34,-24,-27,-21.2,'x',-1,0,4,'grate');
  B.house(-50,20,-34,36,10,{col:'#7a6a80',mat:'brick',roof:'flat',neon:'#b05aff',sign:'LUMEN'});B.house(-72,-36,-56,-28,9,{col:'#707880',mat:'concrete',roof:'flat'});B.house(-72,0,-60,14,8,{col:'#5a6470',mat:'metal',roof:'flat'});
  for(const[x,z]of[[-62,26],[-58,30],[-66,30],[-62,22],[-56,24]])B.spawn('A1',x,0,z);
  B.prop('container',-46,0,-9.4,{col:'#c23a2a'});B.prop('container',-46,2.6,-9.4,{col:'#2a6ac2'});B.prop('container',-36,0,-22,{col:'#d8a020'});B.prop('crate',-38,0,-11,{n:2});B.prop('barrel',-52,0,-20.4);B.prop('barrel',-51.2,0,-19.8,{col:'#d8a020'});
  B.prop('crate',-26,0,-11,{n:1,s:1.2});
  for(const x of[-54,-42,-30])B.prop('lamp',x,0,-11.4);
  // defenders' first yard + north block
  for(const[x,z]of[[-22,30],[-26,28],[-18,30],[-22,26],[-28,32]])B.spawn('D0',x,0,z);
  B.house(-12,25,20,36,12,{col:'#5c5a70',mat:'brick',roof:'flat',neon:'#ff6a2a',sign:'NOODLE'});B.box(4,4,24,28,.4,2.4,'grate');B.wall(-10,22.9,18,22.9,1,'rail',{y0:4.4});B.ramp(-16,22.8,-10,25.2,'x',1,0,4.4,'grate');
  B.house(-34,26,-28,36,7,{col:'#6a6e78',mat:'concrete',roof:'flat'});
  // centre: neon plaza + control point, terrace on the south block
  B.cyl(2,0,3,5.5,.45,'stone',{trim:1});B.cyl(2,.45,3,1.1,2.6,'stone');B.point(2,.45,3,5.5);
  B.house(-12,-36,22,-12,9,{col:'#6e6a78',mat:'concrete',roof:'flat',neon:'#3dd8ff',sign:'ARCADIA'});B.box(5,0,-10.5,26,4,3,'concrete');B.wall(-8,-9.1,18,-9.1,1,'rail',{y0:4});B.ramp(-14,-12,-8,-9,'x',1,0,4,'concrete');
  for(const[x,z]of[[-20,-28],[-24,-31],[-16,-31],[-20,-33],[-24,-27]])B.spawn('A2',x,0,z);
  B.prop('planter',-8,0,8,{w:2.6});B.prop('planter',12,0,-2,{w:2.6,rot:1});B.prop('crate',10,0,10,{n:2});B.prop('crate',-6,0,-3,{n:1,s:1.2});B.prop('planter',8,0,13,{w:3});B.prop('barrel',-10,0,13);
  B.prop('lamp',-4,0,-6);B.prop('lamp',8,0,-6);B.prop('lamp',-11,0,4);B.prop('lamp',16,0,6);
  // section C: market canyon
  B.house(30,-4,50,22,10,{col:'#7a5a5a',mat:'brick',roof:'flat',neon:'#3dff9a',sign:'KAIZEN'});B.house(54,12,72,36,9,{col:'#5a6a7a',mat:'metal',roof:'flat',neon:'#ff3d9a'});
  B.house(34,-36,72,-24,10,{col:'#6a6a74',mat:'concrete',roof:'flat',neon:'#ffd23d',sign:'VOLTA'});B.box(50,3.6,-22.6,24,.4,2.8,'grate');B.wall(38,-21.3,62,-21.3,1,'rail',{y0:4});B.ramp(32,-24,38,-21.2,'x',1,0,4,'grate');
  B.house(22,26,30,36,8,{col:'#606878',mat:'concrete',roof:'flat'});
  for(const[x,z]of[[42,30],[38,28],[46,28],[42,33],[48,32]])B.spawn('D1',x,0,z);
  B.wall(60,10,72,10,4.5,'concrete');B.wall(60,-12,72,-12,4.5,'concrete');B.gate(60,-1,0,20,{tall:6});for(const[x,z]of[[66,-4],[66,0],[68,4],[64,-8],[68,-8]])B.spawn('D2',x,0,z);for(const[x,z]of[[66,-4],[66,0],[68,4],[64,-8],[68,-8]])B.spawn('C1',x,0,z);
  B.prop('crate',40,0,-11,{n:2});B.prop('container',48,0,-9.6,{col:'#7a3ac2'});B.prop('barrel',28,0,1.5);B.prop('barrel',27.6,0,2.4,{col:'#c23a2a'});B.prop('crate',28,0,14,{n:1,s:1.2});B.prop('crate',54,0,-20,{n:1,s:1.1});
  for(const x of[38,50])B.prop('lamp',x,0,-10.6);
  B.gate(-8,18,0,8,{cp:1});B.gate(24,-6,Math.PI/2,10,{cp:1});B.gate(58,-16,0,9,{cp:2});
  B.light(2,4,3,0xff3dbe,16,18);B.light(-42,6,-14,0x3dd8ff,12,22);B.light(46,6,-16,0xffd23d,12,22);}}
];
void ROUTE_CLEAR;
