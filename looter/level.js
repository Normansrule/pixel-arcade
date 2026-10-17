// STARWARDEN — the strike: a ruined landing site (patrol zone + vault beacon), the Hall of Echoes (wave corridor) and a
// megalith ring (boss arena). One layout, three destinations with their own faction, sky, palette and set dressing.
import {World,PHY} from './world.js';
import {V,rng} from './util.js';

export const DEST=[
 {id:'moon',name:'THE SHATTERED MOON',sub:'HOLLOW · VOID',fac:'hollow',theme:'moon',seed:11,
  desc:'Bone-white ruins under a broken moon. The Hollow have woken something beneath the old vault — an Archon that drinks the light.',strike:'THE UNLIT VAULT'},
 {id:'wastes',name:'EMBER WASTES',sub:'CINDERKIN · SOLAR',fac:'cinder',theme:'wastes',seed:23,
  desc:'A scorched desert beneath a ringed giant. Cinderkin raiders have dug into a buried citadel, and their Warlord holds the forge.',strike:'THE FORGE OF KHAROSS'},
 {id:'reach',name:'VEILWOOD REACH',sub:'LATTICE · ARC',fac:'lattice',theme:'reach',seed:5,
  desc:'Glassy forests and drowned temples under an aurora sky. The Lattice are rewriting the ruins into a single thinking machine.',strike:'THE CONVERGENCE'}];
export const ARENA={x:0,z:-134,r:30};

export function buildLevel(dest){const W=new World();W.bounds=[-48,48,-170,78];W.killY=-30;const R=rng(dest.seed);
 const D={dest,W,solids:[],ramps:[],deco:[],lights:[],doors:{},patrol:[],beacon:new V(0,0,-2),zone2:{alcoves:[-34,-60,-84]},pylons:[],cover:[],
  start:[new V(0,0,64),new V(-3,0,66.5),new V(3,0,66.5)],check:[[new V(0,0,64),new V(-3,0,66),new V(3,0,66)],[new V(0,0,2),new V(-3,0,4),new V(3,0,4)],[new V(0,0,-96),new V(-3,0,-94),new V(3,0,-94)],[new V(0,0,-110),new V(-4,0,-109),new V(4,0,-109)]]};
 const B={
  box(cx,y0,cz,w,h,d,mat='stone',o={}){const s=W.box(cx-w/2,y0,cz-d/2,cx+w/2,y0+h,cz+d/2,o);s.mat=mat;D.solids.push(s);return s;},
  cyl(cx,y0,cz,r,h,mat='stone',o={}){const s=W.cyl(cx,y0,cz,r,y0+h,o);s.mat=mat;D.solids.push(s);return s;},
  ramp(x0,z0,x1,z1,axis,dir,y0,y1,mat='stone',o={}){const r=W.ramp(x0,z0,x1,z1,axis,dir,y0,y1);r.mat=mat;r.o=o;D.ramps.push(r);return r;},
  deco(type,o){D.deco.push({type,...o});},light(x,y,z,c,i=20,d=30){D.lights.push({p:new V(x,y,z),c,i,d});}};
 /* ---------------- zone 1: landing site ---------------- */
 B.box(0,-4,33,96,4,86,'ground');B.box(-49,-4,33,6,26,90,'cliff');B.box(49,-4,33,6,26,90,'cliff');B.box(0,-4,78,104,26,6,'cliff');
 for(let i=0;i<14;i++){const s=i%2?1:-1,z=-6+(i>>1)*11+R()*4,d=2+R()*3.5,h=6+R()*12;B.box(s*(46-d/2),0,z,d,h,4+R()*5,'cliff');}
 for(let i=0;i<6;i++){const x=-40+i*16+R()*6,d=2+R()*3,h=6+R()*10;B.box(x,0,75-d/2,5+R()*6,h,d,'cliff');}
 // north wall + vault gate
 B.box(-27,0,-11.5,42,14,3,'wall',{trim:'g'});B.box(27,0,-11.5,42,14,3,'wall',{trim:'g'});B.box(0,9,-11.5,12,5,3,'wall',{trim:'g'});
 D.doors.gate=B.box(0,0,-11.5,12,9,2,'door',{door:1});B.deco('gateframe',{x:0,z:-9.9,w:12,h:9});
 for(const s of[-1,1])B.box(s*8.5,0,-9,3,16,3,'wall',{trim:'g'});
 // temple platform with ramps north and south
 B.box(0,0,26,22,2.4,16,'plat',{trim:'g'});B.ramp(-4,34,4,40,'z',-1,0,2.4,'plat',{trim:'g'});B.ramp(-4,12,4,18,'z',1,0,2.4,'plat',{trim:'g'});
 for(const[x,z,h]of[[-9.5,19.5,6.5],[9.5,19.5,3.2],[-9.5,32.5,2.4],[9.5,32.5,7]])B.cyl(x,2.4,z,.75,h,'column');
 B.box(0,2.4,26,3.2,1.1,1.8,'plat',{trim:'g'});B.deco('altar',{x:0,y:3.5,z:26});
 B.box(-6,2.4,22,3,1.2,1,'stone');B.box(6,2.4,30,3,1.2,1,'stone');
 // plateaus east + west
 for(const s of[-1,1]){B.box(s*32,0,46,20,4,18,'rock');B.ramp(s>0?15:-22,40,s>0?22:-15,46,'x',s,0,4,'plat',{trim:'g'});
  B.box(s*32,4,37.4,20,1.1,.8,'stone');B.cyl(s*38,4,50,.8,5,'column');B.cyl(s*26,4,52,.8,2.6,'column');B.box(s*30,4,48,2,1.4,2,'stone');}
 // crashed ship (west) + wreck debris
 B.box(-24,0,6,7,3.6,17,'hull',{trim:'s'});B.box(-24,3.6,9,4.2,1.8,8,'hull');B.box(-17.5,0,10,6,1.2,4,'hull');B.deco('ship',{x:-24,z:6});
 // arches, monoliths and cover rocks
 B.deco('arch',{x:16,z:12,ax:'x',w:7,h:7});B.deco('arch',{x:-10,z:50,ax:'z',w:6,h:6.5});B.deco('arch',{x:20,z:56,ax:'x',w:7,h:7.5});
 for(const s of[-1,1]){B.box(16+s*3.6,0,12,1.2,7,1.4,'column');B.box(-10,0,50+s*3.1,1.4,6.5,1.2,'column');B.box(20+s*3.6,0,56,1.2,7.5,1.4,'column');}
 const mono=(x,z,h)=>{B.box(x,0,z,1.4,h,1.4,'mono',{trim:'m'});B.deco('glyph',{x,z,h});};
 mono(-30,26,8);mono(-34,22,5.5);mono(30,22,9);mono(34,26,6);mono(12,46,6.5);mono(-14,30,5);mono(26,0,7);mono(-6,8,5.5);
 const rocks=[[-18,40,2.2],[-8,58,1.6],[10,60,2.4],[24,30,2],[-26,34,1.8],[14,22,1.5],[-14,20,1.6],[6,4,1.8],[-10,-2,1.4],[18,-2,2],[-36,0,2.4],[36,10,2.2],[-2,46,1.3],[28,62,2.2],[-30,62,2.6]];
 for(const[x,z,s]of rocks){B.box(x,0,z,s*1.4,s*.85,s*1.1,'rock');if(R()<.6)B.box(x+s*.5,0,z+s*.6,s*.7,s*1.25,s*.7,'rock');}
 B.box(-3,0,-3.2,1,1.2,1,'stone');B.box(3,0,-3.2,1,1.2,1,'stone');B.cyl(0,0,-2,1.1,.9,'plat',{trim:'g'});B.deco('beacon',{x:0,y:.9,z:-2});
 for(const s of[-1,1]){B.box(s*14,0,-5,6,1.15,1,'stone',{trim:'g'});B.box(s*22,0,6,1,1.15,5,'stone');}
 // patrol groups (zone 1): [x,y,z,[types]]
 D.patrol=[[-14,0,44,['grunt','grunt','grunt','rusher']],[30,4,46,['grunt','grunt','major']],[0,2.4,26,['grunt','grunt','rusher','rusher','major']],[-17,0,16,['grunt','grunt','grunt']],[16,0,4,['rusher','rusher','grunt']]];
 D.beaconSpawns=[new V(-22,0,0),new V(22,0,0),new V(0,0,14),new V(-14,0,24),new V(14,0,24)];
 /* ---------------- zone 2: the Hall of Echoes ---------------- */
 B.box(0,-4,-57,20,4,92,'floor');const gaps=D.zone2.alcoves;
 for(const s of[-1,1]){let z0=-11;for(const g of[...gaps,-101.5]){const z1=g===-101.5?g:g+3;if(z0>z1)B.box(s*11,0,(z0+z1)/2,2,16,z0-z1,'wall',{trim:'h'});z0=g-3;}
  for(const g of gaps){B.box(s*13.5,-4,g,7,4,6,'floor');B.box(s*17.5,0,g,1,10,8,'wall');B.box(s*13.5,0,g+3.5,7,10,1,'wall');B.box(s*13.5,0,g-3.5,7,10,1,'wall');B.box(s*13.5,8,g,7,2,6,'wall');B.light(s*14.5,4,g,0,14,10);}}
 for(const[x,z,w]of[[-4,-24,5],[4,-41,5],[-3,-50,4],[3,-67,5],[-4,-77,4.5],[4,-91,5]])B.box(x,0,z,w,1.2,1,'stone',{trim:'h'});
 for(const z of[-30,-64,-88])for(const s of[-1,1])B.cyl(s*6,0,z,.9,16,'column');
 for(let z=-18;z>-100;z-=13)B.deco('span',{z,w:22,y:14});
 for(const s of[-1,1]){B.box(s*11,0,-101.5,12,16,3,'wall',{trim:'h'});}B.box(0,9,-101.5,10,7,3,'wall',{trim:'h'});
 D.doors.hall=B.box(0,0,-101.5,10,9,2,'door',{door:1});B.deco('gateframe',{x:0,z:-99.9,w:10,h:9});
 D.waves=[{trig:-16,spawns:[[-13.5,-34,'grunt'],[-13.5,-34,'grunt'],[13.5,-34,'grunt'],[13.5,-34,'grunt'],[13.5,-34,'rusher'],[0,-46,'major']]},
  {spawns:[[-13.5,-60,'grunt'],[-13.5,-60,'grunt'],[13.5,-60,'grunt'],[13.5,-60,'grunt'],[0,-22,'rusher'],[0,-22,'rusher'],[0,-70,'major']]},
  {spawns:[[0,-90,'heavy'],[-13.5,-84,'grunt'],[-13.5,-84,'grunt'],[13.5,-84,'grunt'],[13.5,-84,'rusher'],[0,-80,'major']]}];
 /* ---------------- zone 3: the megalith ring ---------------- */
 const ax=ARENA.x,az=ARENA.z;B.box(0,-4,-104,12,4,6,'floor');B.cyl(ax,-4,az,32.5,4,'ground2');
 for(let i=0;i<44;i++){const a=i/44*Math.PI*2,x=ax+Math.cos(a)*34.5,z=az+Math.sin(a)*34.5;if(Math.abs(x)<17&&z>az+28)continue;B.cyl(x,0,z,2.7,14+R()*9,'megalith');}
 B.cyl(ax,0,az,7,.6,'plat',{trim:'g'});B.cyl(ax,.6,az,4.6,.6,'plat',{trim:'g'});B.deco('dais',{x:ax,z:az});
 for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,x=ax+Math.cos(a)*15,z=az+Math.sin(a)*15;B.cyl(x,0,z,1.3,3+R()*4,'column');B.box(x+Math.cos(a)*2.2,0,z+Math.sin(a)*2.2,1.4,1.1,1.4,'stone');}
 for(const a of[Math.PI/6,Math.PI*5/6,Math.PI*7/6,Math.PI*11/6]){const x=ax+Math.cos(a)*23,z=az+Math.sin(a)*23;B.box(x,0,z,Math.abs(Math.cos(a))>.5?1:4.5,1.2,Math.abs(Math.cos(a))>.5?4.5:1,'stone',{trim:'g'});}
 for(const a of[Math.PI*.5+.6,Math.PI*.5-.6,-Math.PI*.5,Math.PI*1.08,-.08])D.pylons.push(new V(ax+Math.cos(a)*21,0,az+Math.sin(a)*21));
 D.addSpawns=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2;D.addSpawns.push(new V(ax+Math.cos(a)*26,0,az+Math.sin(a)*26));}
 B.light(ax,8,az,0,40,40);
 W.buildNav(2);return D;}
