// NOVA ARENA — three original arenas described with a tiny builder DSL. Every solid is collision + visual;
// the scene builder (scene.js) dresses them per theme. Coordinates: y up, metres. Team 0 = AZURE (west/-x), team 1 = EMBER (east/+x).
import {World,PHY} from './world.js';
import {V,rng} from './util.js';

export function buildMap(def){const W=new World();W.bounds=def.bounds;W.killY=def.killY??-60;
 const D={def,W,solids:[],ramps:[],deco:[],pads:[],teles:[],low:[],spawns:[],racks:[],powers:[],health:[],nades:[],hills:[],lights:[]};
 const B={
  box(cx,y0,cz,w,h,d,mat='wall',o={}){const s=W.box(cx-w/2,y0,cz-d/2,cx+w/2,y0+h,cz+d/2,o);s.mat=mat;D.solids.push(s);return s;},
  cyl(cx,y0,cz,r,h,mat='metal',o={}){const s=W.cyl(cx,y0,cz,r,y0+h,o);s.mat=mat;D.solids.push(s);return s;},
  ramp(x0,z0,x1,z1,axis,dir,y0,y1,mat='deck',o={}){const r=W.ramp(x0,z0,x1,z1,axis,dir,y0,y1);r.mat=mat;r.o=o;D.ramps.push(r);return r;},
  pad(x,y,z,tx,ty,tz,apex=2.5){const top=Math.max(y,ty)+apex,g=PHY.g,vy=Math.sqrt(2*g*(top-y)),T=vy/g+Math.sqrt(2*(top-ty)/g);const p={x,y,z,vx:(tx-x)/T,vy,vz:(tz-z)/T,tx,ty,tz};W.pads.push(p);D.pads.push(p);return p;},
  tele(x,y,z,tx,ty,tz,yaw,col='c'){const t={x,y,z,tx,ty,tz,yaw,col};W.teles.push(t);D.teles.push(t);return t;},
  low(ax,ay,az,bx,by,bz,k=.3){const z={a:[ax,ay,az],b:[bx,by,bz],k};W.low.push(z);D.low.push(z);},
  spawn(x,y,z,team=-1,yaw){D.spawns.push({p:new V(x,y,z),team,yaw:yaw??Math.atan2(x-(def.look?.[0]??0),z-(def.look?.[1]??0))});},
  rack(x,y,z,w,t){D.racks.push({p:new V(x,y,z),w,t:t??null});},
  power(x,y,z,type){D.powers.push({p:new V(x,y,z),type});},
  health(x,y,z){D.health.push({p:new V(x,y,z)});},nade(x,y,z){D.nades.push({p:new V(x,y,z)});},
  hill(x,y,z,r=4.2){D.hills.push({p:new V(x,y,z),r});},
  link(ax,ay,az,bx,by,bz){W.links.push([new V(ax,ay,az),new V(bx,by,bz)]);},
  deco(type,o){D.deco.push({type,...o});},light(x,y,z,c,i=20,d=30){D.lights.push({p:new V(x,y,z),c,i,d});},
  crate(x,y,z,s=1.4,n=1,rot=0){for(let i=0;i<n;i++){const k=i?.86:1;B.box(x+(i?(rot?.2:-.15):0),y+(i?s:0),z+(i?.1:0),s*k,s*k,s*k,'crate',{trim:i?null:'k'});}},
  // point-symmetric helper for two-team maps: fn(s) with s=+1 then -1 (x,z both mirrored)
  sym(fn){fn(1);fn(-1);}};
 def.build(B,rng(def.seed||7));W.buildNav();return D;}

/* =============================================================== */
export const MAPS=[
{id:'station',name:'MERIDIAN STATION',sub:'ORBITAL RING · LOW-G REACTOR SHAFT',theme:'space',seed:11,bounds:[-37,37,-27,27],killY:-30,mirrorY:0,look:[0,0],
 desc:'An observation deck on a spinning orbital ring. Float up the low-gravity reactor shaft to the rail lance, hold the catwalks, own the wings.',
 build(B){
  // deck slabs around the reactor shaft (x,z in [-8,8])
  B.box(0,-8,18,74,8,20,'floor');B.box(0,-8,-18,74,8,20,'floor');B.box(22.5,-8,0,29,8,16,'floor');B.box(-22.5,-8,0,29,8,16,'floor');
  B.box(0,-9,0,16,2,16,'reactor');B.low(-4.4,-7.5,-8,4.4,22,8,.26);
  B.ramp(4.4,-6,8,8,'z',1,-7,0,'deck',{trim:'c'});B.ramp(-8,-8,-4.4,6,'z',-1,-7,0,'deck',{trim:'c'});
  B.cyl(0,7.3,0,2.9,.7,'plat',{trim:'c'});B.deco('shaft',{x:0,z:0,y0:-7,y1:0,w:16});
  // hull: windows to space on the long sides, bulkheads at the ends, a force-field ceiling
  for(const s of[-1,1]){B.box(0,0,s*27.5,78,15,1,'glass',{glass:true});B.box(s*38,0,0,2,15,56,'hull');
   B.deco('window',{z:s*27,x0:-37,x1:37,y0:0,y1:15});}
  B.box(0,15,0,78,1,56,'none',{novis:true,nowalk:true});
  B.sym(s=>{// wings (raised platforms on pillars) with a ramp up from the deck
   B.box(s*31.5,3.4,0,11,.6,41,'deck',{trim:'o'});for(const z of[-16,-8,8,16])B.cyl(s*27.3,0,z,.55,3.4,'metal');
   B.ramp(s>0?18:-26,-2.6,s>0?26:-18,2.6,'x',s,0,4,'deck',{trim:'o'});
   B.box(s*36.4,4,0,1,1.1,41,'barrier');
   // catwalks joining the wings, railings with gaps
   B.box(0,3.4,s*19,52,.6,3,'deck',{trim:'c'});for(const x of[-21,-9,9,21])B.cyl(x,0,s*19,.45,3.4,'metal');
   for(const[x0,x1]of[[-25,-6],[6,25]])B.box((x0+x1)/2,4,s*17.6,x1-x0,1,.18,'rail');
   B.pad(s*12,0,s*12.5,s*12,4,s*19,2.2);
   // cover on the deck
   B.crate(s*14,0,s*3.5,1.5,2);B.crate(s*15.8,0,s*5.2,1.2,1);B.crate(s*-17,0,s*-10.5,1.5,2,1);B.crate(s*-15.4,0,s*-12.4,1.1,1);
   B.box(s*13,0,s*-4,1,1.15,5,'barrier',{trim:'o'});B.box(s*20,0,s*12,6,1.15,1,'barrier',{trim:'c'});B.box(s*-20,0,s*12,1,1.15,5,'barrier',{trim:'o'});
   B.crate(s*-24,0,s*23,1.6,2);B.crate(s*7,0,s*23,1.4,1);B.crate(s*-3,0,s*-23,1.4,2,1);
   B.cyl(s*9.5,0,s*9.5,.8,15,'metal',{trim:'c'});B.cyl(s*-9.5,0,s*9.5,.8,15,'metal',{trim:'c'});
   B.box(s*22,0,s*-9.5,4,2.4,1,'wall',{trim:'o'});
   // spawns
   B.spawn(s*33,4,s*14,s>0?1:0);B.spawn(s*33,4,s*-14,s>0?1:0);B.spawn(s*31,0,s*-4,s>0?1:0);B.spawn(s*29,0,s*24,s>0?1:0);B.spawn(s*27.5,0,s*-23.5,s>0?1:0);
   B.spawn(s*16,0,s*22,-1);B.spawn(s*18,4,s*-19,-1);B.spawn(s*4,0,s*-21,-1);B.spawn(s*16,0,s*0,-1);
   // items
   B.rack(s*14,0,s*-20,'pulse');B.rack(s*31,4,s*6,'carbine');B.rack(s*-17,0,s*7,'carbine');B.health(s*-16,0,s*15);B.health(s*31.5,4,s*-17);B.nade(s*12,0,s*0);
   B.light(s*20,6,s*0,s>0?0xff6a20:0x2f8cff,24,26);});
  B.rack(0,8,0,'rail');B.rack(0,-7,5.5,'scatter');B.rack(0,4,19,'plasma');B.rack(0,4,-19,'blade');
  B.power(0,-7,-4.5,'over');B.power(-31,0,0,'camo');B.power(31,0,0,'speed');
  B.hill(0,-7,0,4.6);B.hill(31.5,4,0);B.hill(-31.5,4,0);B.hill(0,0,23);B.hill(0,0,-23);
  for(const[x,z]of[[0,9.2],[0,-9.2],[9.2,0],[-9.2,0]])B.link(x,0,z,x*.15,8,z*.15);
  B.deco('holo',{x:0,y:-3.5,z:0,col:0x6fd8ff});B.light(0,-4,0,0x55c8ff,40,22);}},

{id:'canyon',name:'SCARLET RIFT',sub:'NEON CANYON · TWIN BASES · JUMP PADS',theme:'canyon',seed:23,bounds:[-47,47,-19,19],killY:-30,mirrorY:0,look:[0,0],
 desc:'Two fortified bases face off across a neon-lit desert canyon. Jump pads throw you onto the ridges, a sniper bridge spans the dry riverbed.',
 build(B,R){
  // ground slabs either side of the riverbed trench (trench floor y=-3, banks sloped)
  for(const s of[-1,1]){B.box(s*28,-6,0,40,6,38,'floor');B.ramp(s>0?4:-8,-19,s>0?8:-4,19,'x',s,-3,0,'rock');}
  B.box(0,-7,0,8,4,38,'riverbed');
  // canyon walls with jagged buttresses
  for(const s of[-1,1]){B.box(0,-6,s*20.5,96,32,3,'rock');B.box(s*48,-6,0,2,32,44,'rock');}
  for(let i=0;i<22;i++){const s=i%2?1:-1,x=-44+i*4+R()*2,d=1+R()*2.6,h=1.5+R()*6;if(Math.abs(x)<9||Math.abs(x)>30||s>0&&x>-32&&x<-10||s<0&&x>10&&x<32)continue;B.box(x,-1,s*(19-d/2),2.5+R()*3,h+1,d,'rock');}
  B.box(0,26,0,96,1,44,'none',{novis:true,nowalk:true});
  // sniper bridge across the trench + ramps up to it
  B.box(0,4.4,0,24,.6,4,'deck',{trim:'m'});for(const x of[-4.5,4.5])B.cyl(x,-3,0,.6,7.4,'metal');
  B.sym(s=>{B.ramp(s>0?12:-20,-2,s>0?20:-12,2,'x',-s,0,5,'deck',{trim:'m'});B.box(s*7,5,s*1.9,10,1,.15,'rail');});
  B.sym(s=>{const t=s>0?1:0;
   // base: ground room + roof deck
   const bx=s*39;B.box(bx,4.5,0,14,.6,24,'deck',{trim:t?'o':'b'});
   B.box(s*46,0,0,2,4.5,24,'base');B.box(bx,0,s*-11.5,14,4.5,1,'base');B.box(bx,0,s*11.5,14,4.5,1,'base');
   B.box(s*32.5,0,0,1,4.5,6,'base',{trim:t?'o':'b'});B.box(s*32.5,0,s*-9.5,1,4.5,3,'base');B.box(s*32.5,0,s*9.5,1,4.5,3,'base');B.box(s*32.5,2.9,s*-5.5,1,1.6,5,'base');B.box(s*32.5,2.9,s*5.5,1,1.6,5,'base');
   B.box(s*32.6,5.1,0,1,1,24,'barrier');B.box(bx,5.1,s*11.6,14,1,.8,'barrier');B.box(s*45.6,5.1,0,.8,1,24,'barrier');
   B.box(s*40,0,s*4,1.4,2.2,1.4,'crate',{trim:'k'});B.box(s*42.5,0,s*-6,3,1.15,1,'barrier');
   B.ramp(s>0?32:-44,s>0?-17.6:13,s>0?44:-32,s>0?-13:17.6,'x',s,0,5.1,'deck',{trim:t?'o':'b'});B.box(bx,4.5,s*-12.5,14,.6,1,'deck');
   B.pad(s*26,0,0,s*38,5.1,0,4);
   // ridge ledge reached by a pad
   B.box(s*-21,6.4,s*16.5,20,.6,5,'deck',{trim:'m'});B.box(s*-21,0,s*18.5,20,6.4,1,'rock');B.box(s*-27.5,7,s*14.1,7,.9,.2,'rail');B.box(s*-14.5,7,s*14.1,7,.9,.2,'rail');
   B.pad(s*-21,0,s*9,s*-21,7,s*16.5,1.8);
   // cover mid-field
   B.crate(s*22,0,s*-4,1.6,2);B.crate(s*20,0,s*-6.2,1.2,1);B.box(s*15,0,s*8,1,1.2,5,'barrier',{trim:'m'});B.box(s*25,0,s*10,5,1.2,1,'barrier',{trim:'m'});
   B.box(s*13.5,0,s*-10,3,3,3,'rock');B.box(s*27,0,s*-14,4,2.2,3,'rock');B.crate(s*29,0,s*6,1.4,1);B.crate(s*-2.5,-3,s*7,1.4,2);B.crate(s*2.5,-3,s*-12,1.3,1);
   // spawns + items
   for(const[x,y,z]of[[38,0,6.5],[38,0,-6],[38,5.1,8],[38,5.1,-8],[44,5.1,0],[30.5,0,-16]])B.spawn(s*x,y,s*z,t);
   for(const[x,y,z]of[[18,0,-12],[24,0,13],[-21,7,16.5],[10,0,4]])B.spawn(s*x,y,s*z,-1);
   B.rack(s*43,0,s*-8,'pulse');B.rack(s*38,5.1,s*-3,'carbine');B.rack(s*-21,7,s*16.5,'scatter');B.rack(s*17,0,s*14,'carbine');
   B.health(s*43,0,s*8);B.health(s*-12,0,s*16);B.nade(s*30,0,s*-10);B.nade(s*-2,-3,s*-2);
   B.deco('sign',{x:s*32,y:6.8,z:0,face:s,text:t?'EMBER':'AZURE',col:t?0xff5a1a:0x2f8cff});
   B.light(s*36,3,s*0,t?0xff5a1a:0x2f8cff,26,20);});
  B.rack(0,5,0,'rail');B.rack(0,-3,13,'plasma');B.rack(0,-3,-13,'blade');B.power(0,-3,0,'over');B.power(-24,0,12,'camo');B.power(24,0,-12,'speed');
  B.hill(0,5,0,3.6);B.hill(0,-3,-6);B.hill(-21,7,16.5,3.6);B.hill(21,7,-16.5,3.6);B.hill(-21,0,2);B.hill(21,0,-2);
  B.deco('mesas',{});B.light(0,-1,0,0xff2aa0,30,22);}},

{id:'citadel',name:'AETHER CITADEL',sub:'SKY FORTRESS · GLASS DOME · TELEPORTERS',theme:'sky',seed:5,bounds:[-40,40,-40,40],killY:-26,mirrorY:0,look:[0,0],
 desc:'A glass-domed citadel above the clouds. Teleporters cross the gulf between floating pods; fall and you are gone.',
 build(B){
  // core platform under the dome + raised dais
  B.cyl(0,-3,0,14,3,'floor',{trim:'c'});B.cyl(0,0,0,6.2,.6,'deck',{trim:'c'});B.cyl(0,.6,0,4.6,.6,'plat',{trim:'c'});
  B.cyl(0,8.6,0,3.4,.6,'plat',{trim:'c'});B.pad(0,.6,5.8,0,9.2,1.2,3);
  B.deco('dome',{r:16,y:3.4});
  // dome glass: ring of collision posts, doorways at the four bridges (lintels above)
  for(let i=0;i<48;i++){const a=i/48*Math.PI*2,x=Math.cos(a)*15.6,z=Math.sin(a)*15.6;const door=[0,12,24,36].some(k=>Math.abs(i-k)<=1||Math.abs(i-k-48)<=1);
   B.box(x,door?4.2:0,z,2.2,door?6:10,2.2,'none',{novis:true,nowalk:true});}
  B.box(0,13,0,24,1,24,'none',{novis:true,nowalk:true});
  for(const[a,b]of[[1,0],[0,1],[-1,0],[0,-1]]){// bridges + satellites
   const bx=a*21,bz=b*21;B.box(bx,-1,bz,a?14:4.4,1,b?14:4.4,'deck',{trim:'c'});B.cyl(a*31,-3,b*31,7.5,3,'floor',{trim:'o'});
   B.box(a*29.6,0,b*29.6,a?1:4,1.15,b?1:4,'barrier',{trim:'o'});B.crate(a*31+b*3.5,0,b*31-a*3.5,1.4,2);B.crate(a*33-b*4,0,b*33+a*4,1.2,1);
   B.pad(a*35.5,0,b*35.5,a*27-b*27,2.4,b*27+a*27,5);B.deco('gate',{x:a*15.6,z:b*15.6,ax:a?'z':'x'});}
  // floating pods (diagonals) linked by teleporters, a ramp from each pod down to its counter-clockwise satellite
  const pods=[[1,1],[-1,1],[-1,-1],[1,-1]];
  for(const[a,b]of pods){B.cyl(a*27,1.2,b*27,5,1.2,'plat',{trim:'m'});B.cyl(a*27,-1.3,b*27,3,2.5,'rockF');B.box(a*29.6,2.4,b*29.6,1.6,1.15,1.6,'barrier',{trim:'m'});}
  B.ramp(5,24,24,28.4,'x',1,0,2.4,'deck',{trim:'m'});B.ramp(-28.4,5,-24,24,'z',1,0,2.4,'deck',{trim:'m'});B.ramp(-24,-28.4,-5,-24,'x',-1,0,2.4,'deck',{trim:'m'});B.ramp(24,-24,28.4,-5,'z',-1,0,2.4,'deck',{trim:'m'});
  B.tele(29,2.4,29,-25.5,2.4,-25.5,Math.PI*.25+Math.PI,'m');B.tele(-29,2.4,-29,25.5,2.4,25.5,Math.PI*.25,'m');
  B.tele(-29,2.4,29,25.5,2.4,-25.5,Math.PI*.75,'c');B.tele(29,2.4,-29,-25.5,2.4,25.5,-Math.PI*.25,'c');
  // inside the dome: cover ring
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8,x=Math.cos(a)*10,z=Math.sin(a)*10;if(i%2)B.cyl(x,0,z,.7,10,'metal',{trim:'c'});else B.box(x,0,z,2.4,1.15,2.4,'barrier',{trim:'c'});}
  // spawns: team 0 holds west + north, team 1 east + south
  for(const[a,b,t]of[[-1,0,0],[0,-1,0],[1,0,1],[0,1,1]]){B.spawn(a*33+b*3,0,b*33-a*3,t);B.spawn(a*29-b*3,0,b*29+a*3,t);}
  for(const[a,b]of pods)B.spawn(a*26,2.4,b*26,-1);B.spawn(8,0,8,-1);B.spawn(-8,0,-8,-1);
  B.rack(0,9.2,0,'rail');B.rack(0,0,-34,'blade');B.rack(0,0,34,'plasma');B.rack(-8,0,0,'scatter');B.rack(8,0,0,'scatter',90);
  B.rack(-34,0,0,'pulse');B.rack(34,0,0,'pulse');for(const[a,b]of pods)B.rack(a*25.5,2.4,b*28.5,'carbine');
  B.power(0,1.2,0,'over');B.power(-27,2.4,27,'camo');B.power(27,2.4,-27,'speed');
  for(const[a,b]of[[1,0],[0,1],[-1,0],[0,-1]])B.health(a*28+b*4,0,b*28-a*4);B.nade(27,2.4,27);B.nade(-27,2.4,-27);B.nade(0,0,11);B.nade(0,0,-11);
  B.hill(0,1.2,0,4.4);B.hill(31,0,0);B.hill(-31,0,0);B.hill(0,0,31);B.hill(0,0,-31);B.hill(0,9.2,0,3.2);
  B.light(0,6,0,0xbfe8ff,30,26);}}
];
