// STARFALL VANGUARD — the three missions on the ring-world Halcyon Verge: terrain, structures, squads, Kyrr forces,
// interactive objectives and the scripted story beats (radio lines, objectives, checkpoints). Builder DSL like Nova Arena's maps.
import {World} from './world.js';
import {V,rng,cl} from './util.js';

/* ---------- value noise ---------- */
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
export function noise2(x,z){const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,s=t=>t*t*(3-2*t);const a=hash(i,j),b=hash(i+1,j),c=hash(i,j+1),d=hash(i+1,j+1);const u=s(fx),v=s(fz);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
export function fbm2(x,z,o=4){let s=0,a=.5,t=0;for(let k=0;k<o;k++){s+=noise2(x,z)*a;t+=a;x*=2.03;z*=2.03;a*=.5;}return s/t;}
const sstep=(a,b,x)=>{const t=cl((x-a)/(b-a),0,1);return t*t*(3-2*t);};

export const SPEAK={OKOYE:'SGT. OKOYE',KESS:'CPL. KESSLER',ROURKE:'PVT. ROURKE',AMADI:'PVT. AMADI',HALE:'CMDR. HALE',VASH:'OVERSEER VASH',AI:'LYRA (SHIP AI)'};
export const SQUAD=[{n:'OKOYE',w:'br',lead:1},{n:'KESSLER',w:'ar'},{n:'ROURKE',w:'shotgun'},{n:'AMADI',w:'ar'}];

/* ================= builder ================= */
export function buildMission(def){const W=new World();W.bounds=def.bounds;W.killY=-200;
 const[b0,b1,b2,b3]=def.bounds,cs=def.cell||2,nx=Math.ceil((b1-b0)/cs)+1,nz=Math.ceil((b3-b2)/cs)+1;W.setTerrain(b0,b2,cs,nx,nz,def.terrain);
 const D={def,W,solids:[],deco:[],rocks:[],groups:{},objs:[],racks:[],trees:[],vehicles:[],lights:[],squad:[],start:null};
 const T=(x,z)=>W.H(x,z);
 const B={T,
  box(cx,y0,cz,w,h,d,mat='hum',o={}){const s=W.box(cx-w/2,y0,cz-d/2,cx+w/2,y0+h,cz+d/2,o);s.mat=mat;D.solids.push(s);return s;},
  boxT(cx,cz,w,h,d,mat='hum',o={},sink=.4){const y=Math.min(T(cx-w/2,cz-d/2),T(cx+w/2,cz-d/2),T(cx-w/2,cz+d/2),T(cx+w/2,cz+d/2),T(cx,cz))-sink;return B.box(cx,y,cz,w,h+sink,d,mat,o);},
  cyl(cx,y0,cz,r,h,mat='alien',o={}){const s=W.cyl(cx,y0,cz,r,y0+h,o);s.mat=mat;D.solids.push(s);return s;},
  rock(x,z,r,h,o={}){const y=T(x,z)-1;const s=W.cyl(x,y,z,r*.82,y+h,o);s.mat='rockC';D.rocks.push({x,y,z,r,h,s});return s;},
  crate(x,z,s=1.3,n=1,rot=0){const y=T(x,z);for(let i=0;i<n;i++){const k=i?.86:1;B.box(x+(i?.15:0),y+(i?s:0)-(i?0:.1),z+(i?.1:0),s*k,s*k+(i?0:.1),s*k,'crate');}},
  deco(type,o){const d={type,...o};D.deco.push(d);return d;},light(x,y,z,c,i=20,d=30){D.lights.push({p:new V(x,y,z),c,i,d});},
  group(id,x,z,units,o={}){D.groups[id]={id,x,z,units,r:o.r??10,...o};},
  obj(id,type,x,z,o={}){const ob={id,type,p:new V(x,o.y??T(x,z),z),...o};D.objs.push(ob);return ob;},
  rack(x,z,w,o={}){D.racks.push({p:new V(x,(o.y??T(x,z))+.05,z),w,ammo:!!o.ammo});},
  vehicle(kind,x,z,yaw){D.vehicles.push({kind,x,z,yaw});},
  squad(x,z){D.squad.push({x,z});},tree(x,z,s=1){const y=T(x,z);W.cyl(x,y-1,z,.42*s,y+9*s,{});D.trees.push({x,y,z,s});},start(x,z,yaw){D.start={x,z,yaw};}};
 def.build(B,rng(def.seed||7));const doors=D.solids.filter(s=>s.o.door);doors.forEach(b=>W.remove(b));W.buildNav(def.navCell||2,D.start);doors.forEach(b=>{b.dead=false;W._ins(b);});return D;}

/* =============================================================== */
// mission 1 — LANDFALL: crash in the Ember Gorge, regroup, take the buggy north, hold the relay while it uplinks
const cx1=z=>26*Math.sin(z/70)+9*Math.sin(z/27+1);
const half1=z=>36+10*Math.sin(z/50)+(z<-120?sstep(-120,-160,z)*38:0)+(z>170?sstep(170,200,z)*14:0);
function terr1(x,z){const c=cx1(z),d=Math.abs(x-c),hw=half1(z);const floor=z*.035+2.2*fbm2(x/26,z/26)-1+2.5*sstep(20,5,Math.hypot(x-cx1(-172),z+172));
 const wall=sstep(hw,hw+20,d)*(40+16*fbm2(x/38+9,z/38))+Math.max(0,d-hw-20)*.5;const ends=sstep(-195,-215,z)*60+sstep(205,215,z)*60;return floor+wall+ends;}

// mission 2 — THE SPIRE: an alien interior
function terr2(x,z){return z>72?(fbm2(x/18,z/18)-.5)*1.4*sstep(72,80,z):z>66?0:-.3;}

// mission 3 — HAMMERFALL: open ring plains
const base3=(x,z)=>fbm2(x/120+3,z/120+7,3)*26-11+fbm2(x/40,z/40)*6;
function terr3(x,z){const nz=fbm2(x/45+3,z/45-7),edge=Math.max(0,Math.max(Math.abs(x),Math.abs(z))-160-nz*40);let h=base3(x,z)+edge*edge*(.02+nz*.05)+edge*(.25+nz*.5);
 for(const[px,pz]of[[-140,30],[135,0],[-10,-60],[5,198]]){const k=sstep(24,10,Math.hypot(x-px,z-pz));h=h*(1-k)+base3(px,pz)*k;}
 const k=sstep(50,30,Math.hypot(x,z+170));return h*(1-k)+4*k;}

export const MISSIONS=[
{id:'landfall',n:1,name:'LANDFALL',sub:'EMBER GORGE · HALCYON VERGE',time:720,theme:'gorge',bounds:[-150,150,-215,215],seed:11,terrain:terr1,
 brief:'Your drop pod is down in a canyon on the ring-world. Regroup with Sergeant Okoye\'s squad, commandeer the Jackrabbit and race the Kyrr to the comms relay. Hold it until the uplink is complete.',
 build(B,R){const T=B.T;
  B.start(cx1(196)-4,196,0);B.deco('pod',{x:cx1(198)+3,z:198});
  for(const[o,z]of[[-6,152],[-2,149],[4,151],[8,148]])B.squad(cx1(z)+o,z);
  // canyon cover: boulders, slabs, ruins of an older human outpost
  for(let i=0;i<70;i++){const z=-200+R()*400,side=R()<.5?-1:1,off=side*(8+R()*(half1(z)-6));const x=cx1(z)+off;if(Math.abs(z-80)<10&&off>0)continue;if(Math.abs(off)<11&&R()<.6)continue;B.rock(x,z,1.2+R()*2.6,2+R()*4.5);}
  for(let i=0;i<26;i++){const z=-200+R()*400;const side=R()<.5?-1:1;const x=cx1(z)+side*(half1(z)+6+R()*10);B.rock(x,z,4+R()*6,10+R()*16,{noray:false});}
  // supply drop + jackrabbit
  const sx=cx1(84)+12;B.deco('supply',{x:sx,z:84});B.rack(sx-2,82,'br');B.rack(sx+2,82,'shotgun');B.rack(sx,86.5,'ar',{ammo:true});B.crate(sx+5,88,1.3,2);B.crate(sx-5,87,1.2,1);
  B.vehicle('buggy',cx1(78)-2,78,0);
  // human outpost ruin mid-canyon
  {const z=30,x=cx1(z)-14;B.boxT(x,z,10,3,1,'hum');B.boxT(x-5,z+4,1,3,8,'hum');B.boxT(x+6,z-6,6,1.2,1,'barrier');B.crate(x+2,z+3,1.3,2);B.rack(x,z+2,'sniper');}
  // natural arch across the gorge
  {const z=-12,c=cx1(z),y=T(c,z);B.rock(c-26,z,6,30);B.rock(c+24,z,6,30);B.box(c,y+21,z,58,6,9,'rockB',{});}
  B.group('g0',cx1(132)+6,132,[['skitter',4]],{r:8});
  B.group('g1',cx1(108),108,[['skitter',5],['warden',1]],{r:12});
  B.group('g2',cx1(24),24,[['skitter',4],['warden',2],['turret',1]],{r:14});
  B.group('g3',cx1(-62),-62,[['skitter',3],['wardenR',1],['warden',1],['turret',1]],{r:14});
  B.group('g3b',cx1(-110),-110,[['skitter',4],['warden',1]],{r:12});
  const rx=cx1(-172),rz=-172;B.obj('relay','relay',rx,rz,{});B.boxT(rx-7,rz+6,5,1.3,1,'barrier');B.boxT(rx+8,rz+5,1,1.3,5,'barrier');B.boxT(rx+1,rz+10,6,1.3,1,'barrier');B.crate(rx-9,rz-4,1.3,2);B.crate(rx+9,rz-6,1.3,1);B.rack(rx+4,rz-4,'rocket');B.rack(rx-4,rz-4,'br',{ammo:true});
  B.group('L1',rx-6,rz-40,[['skitter',4],['warden',1]],{r:8});B.group('L2',rx+26,rz-22,[['warden',2],['skitter',3]],{r:8});B.group('L3',rx-24,rz-24,[['ravager',1],['skitter',4]],{r:8});B.group('L4',rx+10,rz-36,[['wardenR',1],['skitter',3]],{r:8});
  B.light(rx,T(rx,rz)+6,rz,0xffb060,30,30);},
 P:{relay:[cx1(-172),-172]},
 steps:[
  {obj:'REGROUP WITH SGT. OKOYE',mark:M=>M.squadPos(),enter(M){M.say('AI','Pod integrity zero. You\'re alive, Vanguard. Barely. Kyrr landers are all over this gorge.');M.say('OKOYE','Vanguard! On me, we\'ve got Skitters on the ridge line!');M.spawn('g0');},
   tick(M){return M.nearSquad(14)||M.t>45;}},
  {obj:'CLEAR THE LANDING ZONE',mark:M=>M.groupPos('g1'),enter(M){M.say('OKOYE','Glad you dropped in. Squad, push up — clear that LZ!');M.spawn('g1');M.squadTo(M.groupPos('g1'),18);},tick(M){return M.alive('g0')+M.alive('g1')===0;}},
  {obj:'SECURE THE JACKRABBIT',mark:M=>M.vehiclePos('buggy'),cp:1,enter(M){M.say('KESS','LZ clear! Supply drop is just north, and look — a Jackrabbit, still in one piece.');M.say('OKOYE','Grab what you need. You drive, Kessler takes the gun.');M.squadTo(M.vehiclePos('buggy'),8);},
   tick(M){return M.inVehicle('buggy');}},
  {obj:'DRIVE TO THE COMMS RELAY',mark:M=>M.P('relay'),enter(M){M.say('KESS','Gun\'s hot! Floor it, Vanguard!');M.say('AI','Relay beacon is 380 metres north. Multiple Kyrr contacts along the gorge.');M.spawn('g2');M.spawn('g3');M.spawn('g3b');},
   tick(M){if(!M.f.mid&&M.playerZ()<0){M.f.mid=1;M.say('ROURKE','Is that... the whole ring? Up there? It just keeps going.');M.say('OKOYE','Eyes on the road, Rourke.');}return M.nearP(M.P('relay'),26);}},
  {obj:'HOLD THE RELAY · UPLINK',mark:M=>M.P('relay'),cp:1,hold:75,enter(M){M.say('AI','Uplink started. I need seventy-five seconds of uninterrupted signal.');M.say('OKOYE','Dig in! Landers inbound, north side!');M.squadTo(M.P('relay'),8);M.f.w=0;},
   tick(M){const t=M.t;if(t>3&&M.f.w<1){M.f.w=1;M.lander('L1');}if(t>20&&M.f.w<2){M.f.w=2;M.lander('L2');}if(t>38&&M.f.w<3){M.f.w=3;M.lander('L3');M.say('KESS','Ravager! Big one, coming off that lander!');}if(t>55&&M.f.w<4&&M.diff>=1){M.f.w=4;M.lander('L4');}
    M.progress=Math.min(1,t/75);return t>=75&&M.aliveAll()<=2;}},
  {obj:'UPLINK COMPLETE',done:1,enter(M){M.say('HALE','Vanguard, this is the Resolute. We read you. Outstanding work — hold position for orders.');M.complete();}}]},

{id:'spire',n:2,name:'THE SPIRE',sub:'KYRR SPIRE · INTERIOR',time:600,theme:'spire',bounds:[-60,60,-110,115],seed:5,terrain:terr2,navCell:1.5,cell:2,
 brief:'The relay traced the Kyrr signal to a spire on the ring. Breach it, fight to the central chamber and cut the three power conduits that feed their shield network.',
 build(B,R){
  B.start(0,104,0);for(const[x,z]of[[-4,98],[4,98],[-7,101],[7,101]])B.squad(x,z);
  // outer spire wall with the breach, plaza dressing
  B.box(-37,0,70,62,60,6,'alienW');B.box(37,0,70,62,60,6,'alienW');B.box(0,11,70,12,49,6,'alienW');B.deco('spireTop',{z:70});
  for(const x of[-22,22])B.cyl(x,0,90,1.6,9,'alien',{});B.crate(-12,94,1.3,2);B.crate(14,88,1.3,1);B.rock(-30,100,3,4);B.rock(28,104,3.5,5);B.rock(-40,80,4,6);B.rock(44,90,4,8);B.box(0,-1,112,120,30,6,'rockB',{});B.box(-62,-1,92,6,30,46,'rockB');B.box(62,-1,92,6,30,46,'rockB');
  // entrance hall z 67..38 (+ interior floor plates)
  for(const[x,z,w,d]of[[0,52,30,30],[0,20,8,36],[0,-30,60,62],[0,-80,40,38]])B.box(x,-.5,z,w,.5,d,'alienF',{floor:1});
  const wallH=14;B.box(-16,0,52,2,wallH,30,'alienW');B.box(16,0,52,2,wallH,30,'alienW');B.box(0,wallH,52,34,2,30,'ceil');
  B.box(-10,0,38,12,wallH,2,'alienW');B.box(10,0,38,12,wallH,2,'alienW');
  for(const z of[60,48])for(const x of[-9,9])B.cyl(x,0,z,1.1,wallH,'alien',{trim:'p'});B.box(0,0,55,6,1.2,1.2,'alienC');B.box(-5,0,44,1.2,1.2,5,'alienC');B.box(6,0,46,1.2,1.2,4,'alienC');
  B.rack(-12,62,'ion');B.rack(12,62,'spark',{ammo:true});
  // corridor z 38..2 with side alcoves
  B.box(-5,0,20,2,10,36,'alienW');B.box(5,0,20,2,10,36,'alienW');B.box(0,10,20,12,2,36,'ceil');
B.box(0,0,20,1.2,1.1,3,'alienC');
  // central chamber z 0..-60
  B.box(-31,0,-30,2,22,62,'alienW');B.box(31,0,-30,2,22,62,'alienW');B.box(-18,0,1,24,22,2,'alienW');B.box(18,0,1,24,22,2,'alienW');B.box(-18,0,-61,24,22,2,'alienW');B.box(18,0,-61,24,22,2,'alienW');B.box(0,10,1,12,12,2,'alienW');B.box(0,22,-30,64,2,64,'ceil');
  for(const[x,z]of[[-14,-12],[14,-12],[-14,-46],[14,-46],[0,-30]])B.cyl(x,0,z,1.6,22,'alien',{trim:'p'});
  for(const[x,z,w,d]of[[-6,-18,4,1.2],[7,-22,1.2,4],[-22,-22,4,1.2],[22,-36,4,1.2],[-8,-40,1.2,4],[9,-42,4,1.2],[-22,-50,1.2,3],[22,-14,1.2,3]])B.box(x,0,z,w,1.2,d,'alienC');
  B.obj('c1','conduit',-24,-30,{});B.obj('c2','conduit',24,-30,{});B.obj('c3','conduit',0,-55,{});
  B.rack(-26,-6,'rocket');B.rack(26,-6,'br',{ammo:true});
  // core room z -62..-100
  B.box(-21,0,-80,2,16,38,'alienW');B.box(21,0,-80,2,16,38,'alienW');B.box(0,0,-99,44,16,2,'alienW');B.box(0,16,-80,44,2,38,'ceil');B.box(0,0,-62,12,4.5,1,'door',{door:1});
  for(const[x,z]of[[-12,-72],[12,-72],[-12,-88],[12,-88]])B.cyl(x,0,z,1.4,16,'alien',{trim:'p'});B.box(-6,0,-78,3,1.2,1.2,'alienC');B.box(7,0,-82,1.2,1.2,3,'alienC');
  B.obj('lift','lift',0,-92,{});B.rack(-16,-66,'shotgun',{ammo:true});
  for(const[x,z,c]of[[0,60,0x9a5aff],[0,20,0x5ad8ff],[-20,-20,0xb060ff],[20,-40,0xb060ff],[0,-30,0x60e0ff],[0,-85,0xff50b0],[0,90,0xffc080]])B.light(x,8,z,c,40,36);
  B.group('e0',0,82,[['skitter',3]],{r:8});B.group('e1',0,52,[['skitter',4],['warden',1]],{r:7});B.group('e2',0,16,[['warden',2],['skitter',2]],{r:5});
  B.group('e3',0,-30,[['skitter',5],['warden',2]],{r:14});B.group('w1',-18,-40,[['skitter',3],['warden',1]],{r:5,rift:1});B.group('w2',18,-20,[['wardenR',1],['skitter',3]],{r:5,rift:1});B.group('w3',0,-48,[['warden',2],['skitter',2]],{r:5,rift:1});
  B.group('e4',0,-82,[['ravager',2],['skitter',4]],{r:8});B.group('e4b',0,-80,[['wardenR',1]],{r:6});},
 P:{hall:[0,52],chamber:[0,-20],core:[0,-80],lift:[0,-92]},
 steps:[
  {obj:'BREACH THE SPIRE',mark:M=>M.P('hall'),enter(M){M.say('HALE','Vanguard, that spire is the hub of their shield grid. Get inside and shut it down.');M.say('OKOYE','You heard the Commander. Stack up on the breach!');M.spawn('e0');M.spawn('e1');},
   tick(M){return M.playerZ()<56&&M.alive('e0')+M.alive('e1')<=1;}},
  {obj:'PUSH THROUGH TO THE CHAMBER',mark:M=>M.P('chamber'),cp:1,enter(M){M.say('AMADI','Lights are... breathing. I hate this place.');M.spawn('e2');M.squadTo(M.P('hall'),6);},tick(M){if(M.t>2)M.squadFollow();return M.playerZ()<-2;}},
  {obj:'CUT THE POWER CONDUITS (0/3)',mark:M=>M.nextObj('conduit'),cp:1,enter(M){M.say('AI','Three conduits. Hold your interface to them — I\'ll do the rest.');M.spawn('e3');M.f.c=0;},
   tick(M){const n=M.objDone('conduit');if(n!==M.f.c){M.f.c=n;M.setObj(`CUT THE POWER CONDUITS (${n}/3)`);M.checkpoint();if(n===1){M.rift('w1');M.say('KESS','They\'re phasing in! Contacts, left side!');}if(n===2){M.rift('w2');M.say('OKOYE','One more, Vanguard!');}if(n===3)M.rift('w3');}return n>=3&&M.alive('e3')+M.alive('w1')+M.alive('w2')+M.alive('w3')<=1;}},
  {obj:'DEFEAT THE CORE GUARDIANS',mark:M=>M.P('core'),cp:1,enter(M){M.openDoor();M.say('AI','Core door is open. Two Ravager signatures. Big ones.');M.spawn('e4');if(M.diff>=2)M.spawn('e4b');},tick(M){return M.alive('e4')+M.alive('e4b')===0;}},
  {obj:'REACH THE EXTRACTION LIFT',mark:M=>M.P('lift'),enter(M){M.say('OKOYE','Shield grid\'s down across the sector. Get to that lift!');M.squadTo(M.P('lift'),5);},tick(M){return M.nearP(M.P('lift'),4);}},
  {obj:'SPIRE DOWN',done:1,enter(M){M.say('HALE','Grid\'s collapsing ring-wide. Last stop: the control station. Bring it home, Vanguard.');M.complete();}}]},

{id:'hammerfall',n:3,name:'HAMMERFALL',sub:'VERDANT REACH · CONTROL STATION',time:720,theme:'plains',bounds:[-230,230,-230,230],seed:23,terrain:terr3,cell:3,navCell:3,
 brief:'Take the Bastion hover tank across the open plains, destroy the three shield pylons guarding the Kyrr control station, then end Overseer Vash.',
 build(B,R){const T=B.T;
  B.start(-6,206,0);B.vehicle('tank',8,196,0);for(const[x,z]of[[-12,200],[-8,212],[14,210],[18,203]])B.squad(x,z);B.deco('lz',{x:0,z:205});
  for(let i=0;i<90;i++){const x=-200+R()*400,z=-200+R()*400;if(Math.hypot(x,z+170)<50||Math.hypot(x-5,z-200)<26)continue;let ok=true;for(const[px,pz]of[[-140,30],[135,0],[-10,-60]])if(Math.hypot(x-px,z-pz)<24)ok=false;if(!ok)continue;B.rock(x,z,1.5+R()*3.5,2+R()*6);}
  for(let i=0;i<260;i++){const x=-205+R()*410,z=-205+R()*410;if(Math.hypot(x,z+170)<55||Math.hypot(x-5,z-200)<30)continue;let ok=true;for(const[px,pz]of[[-140,30],[135,0],[-10,-60]])if(Math.hypot(x-px,z-pz)<28)ok=false;if(ok)B.tree(x,z,.8+R()*.7);}B.deco('grass',{n:9000});
  for(const[i,[px,pz]]of[[-140,30],[135,0],[-10,-60]].entries()){B.obj('p'+(i+1),'pylon',px,pz,{hp:1400});const y=T(px,pz);for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.3;B.boxT(px+Math.cos(a)*13,pz+Math.sin(a)*13,3.5,1.4,1.2,'alienC');}}
  const sy=T(0,-170);B.obj('station','station',0,-170,{y:sy});B.box(0,sy-2,-170,26,2.6,26,'alienF',{floor:1});B.box(0,sy-2,-170,40,1,40,'alienF',{floor:1});
  for(const[x,z]of[[-11,-181],[11,-181],[-11,-159],[11,-159]])B.cyl(x,sy+.6,z,1.3,10,'alien',{trim:'p'});B.box(0,sy+.6,-184,10,4,1.2,'alienC');B.box(-14,sy-1,-150,4,1.3,1.2,'alienC');B.box(15,sy-1,-155,1.2,1.3,4,'alienC');
  B.obj('barrier','barrier',0,-170,{r:36,y:sy-6});B.rack(-24,186,'rocket');B.rack(-28,188,'br',{ammo:true});B.rack(30,-138,'rocket');B.rack(-30,-140,'sniper',{ammo:true});
  B.group('a1',-140,44,[['skitter',4],['warden',2],['turret',2]],{r:16});B.group('a2',135,14,[['ravager',1],['skitter',4],['warden',1],['turret',1]],{r:16});B.group('a3',-10,-44,[['warden',3],['skitter',3],['turret',2]],{r:16});
  B.group('pat1',60,110,[['skitter',3],['warden',1]],{r:8});B.group('pat2',-70,90,[['skitter',3],['wardenR',1]],{r:8});
  B.group('boss',0,-176,[['overseer',1]],{r:2});B.group('bg',0,-165,[['ravager',1],['warden',2]],{r:10});B.group('b1',20,-150,[['skitter',4],['warden',1]],{r:6});B.group('b2',-20,-152,[['wardenR',1],['skitter',3]],{r:6});B.group('b3',0,-140,[['ravager',1],['skitter',2]],{r:6});
  B.group('sq',0,-130,[],{r:6});},
 P:{tank:[8,196],station:[0,-170]},
 steps:[
  {obj:'BOARD THE BASTION',mark:M=>M.vehiclePos('tank'),enter(M){M.say('HALE','Vanguard, the Bastion is fuelled and hot. Three pylons power the barrier around their control station.');M.say('OKOYE','We\'ll hold the LZ. Go make some noise.');M.spawn('pat1');M.spawn('pat2');},tick(M){return M.inVehicle('tank')||M.t>40;}},
  {obj:'DESTROY THE SHIELD PYLONS (0/3)',mark:M=>M.nextObj('pylon'),cp:1,enter(M){M.say('AI','Pylons marked. Their armour is thick — use the main gun.');M.spawn('a1');M.spawn('a2');M.spawn('a3');M.f.p=0;},
   tick(M){const n=M.objDone('pylon');if(n!==M.f.p){M.f.p=n;M.setObj(`DESTROY THE SHIELD PYLONS (${n}/3)`);M.checkpoint();M.say(n===1?'AI':n===2?'KESS':'AI',n===1?'Pylon down. Barrier output at sixty-six percent.':n===2?'Two down! That barrier\'s flickering!':'Barrier is collapsing!');}return n>=3;}},
  {obj:'ASSAULT THE CONTROL STATION',mark:M=>M.P('station'),cp:1,enter(M){M.dropBarrier();M.say('VASH','Little machine. You have broken my shields. Come, and I will break you.');M.say('OKOYE','Squad\'s inbound on the dropship. We\'re with you, Vanguard!');M.squadDrop('sq');M.spawn('bg');},
   tick(M){return M.nearP(M.P('station'),40);}},
  {obj:'KILL OVERSEER VASH',mark:M=>M.bossPos(),cp:1,boss:1,enter(M){M.spawn('boss');M.say('VASH','KNEEL!');M.f.w=0;},
   tick(M){const t=M.t;if(t>18&&M.f.w<1){M.f.w=1;M.lander('b1');}if(t>42&&M.f.w<2){M.f.w=2;M.lander('b2');M.say('AMADI','More landers! Keep hitting the big one!');}if(t>70&&M.f.w<3){M.f.w=3;M.lander('b3');}return M.alive('boss')===0;}},
  {obj:'THE RING IS OURS',done:1,enter(M){M.say('HALE','Station is ours. Every Kyrr ship over the Verge just went dark. Welcome home, Vanguard.');M.say('OKOYE','Drinks are on Kessler.');M.complete();}}]}
];
