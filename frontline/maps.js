// FRONTLINE OPS — the three battlegrounds. Original layouts built from boxes + props.
import {Level} from './world.js';

const PI=Math.PI,H=PI/2;
function tower(L,x,z,light=true){for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])L.box(x+dx*1.1-.12,z+dz*1.1-.12,x+dx*1.1+.12,z+dz*1.1+.12,6.6,{mat:'trim'});
 L.boxC(x,z,2.8,2.8,.25,{y0:4.2,mat:'wood'});for(const[a,b,c,d]of[[-1.4,-1.4,1.4,-1.3],[-1.4,1.3,1.4,1.4],[-1.4,-1.4,-1.3,1.4],[1.3,-1.4,1.4,1.7]])L.box(x+a,z+b,x+c,z+d,1.0,{y0:4.45,mat:'wood'});
 L.boxC(x,z,3.2,3.2,.2,{y0:6.6,mat:'roof'});for(let y=1;y<4;y+=1.4){L.box(x-1.1,z-1.15,x+1.1,z-1.05,.08,{y0:y,mat:'trim',solid:false});L.box(x-1.1,z+1.05,x+1.1,z+1.15,.08,{y0:y,mat:'trim',solid:false});}
 if(light)L.lamps.push({x,z,y:6.2,light:true,inside:true,col:0xd8e4ff});}
function scatter(L,kind,n,x0,z0,x1,z1,avoid=[],o={}){for(let i=0;i<n;i++){for(let k=0;k<8;k++){const x=x0+L.rnd()*(x1-x0),z=z0+L.rnd()*(z1-z0);if(avoid.some(r=>x>r[0]&&x<r[2]&&z>r[1]&&z<r[3]))continue;if(L.boxes.some(b=>b.solid&&x>b.x0-1.5&&x<b.x1+1.5&&z>b.z0-1.5&&z<b.z1+1.5))continue;L.prop(kind,x,z,L.rnd()*6.28,{jit:L.rnd()*.4,s:o.s?o.s[0]+L.rnd()*(o.s[1]-o.s[0]):1,solid:o.solid});break;}}}
function crates(L,x,z,n=3){const k=['crate','crate','crateS','crateL','barrel'];for(let i=0;i<n;i++){const t=k[(L.rnd()*k.length)|0];L.prop(t,x+(i%2)*1.35-(n>2?.6:0),z+((i/2)|0)*1.35,0,{jit:(L.rnd()-.5)*.25,col:t==='barrel'?[0x5a6a4a,0x8a2a22,0x2a4a7a][i%3]:undefined});}
 if(n>2&&L.rnd()<.6)L.prop('crateS',x,z,0,{y0:1.2,jit:.3});}
function ruin(L,x0,z0,x1,z1,col){const hs=[1.2,2.4,1.6,2.8,.9];let k=0;const seg=(a,b,c,d)=>L.wall(a,b,c,d,hs[k++%hs.length],.4,{mat:'plaster',col});
 const mx=(x0+x1)/2,mz=(z0+z1)/2;seg(x0,z0,mx-1.2,z0);seg(mx+1.2,z0,x1,z0);seg(x0,z1,mx-1,z1);seg(mx+1.6,z1,x1,z1);seg(x0,z0,x0,mz-1);seg(x0,mz+1.3,x0,z1);seg(x1,z0,x1,mz-1.4);seg(x1,mz+1,x1,z1);
 L.prop('crateS',mx+1,mz+.5,0,{jit:.6});}

/* ============ BLACKSITE — walled compound in pine woods (night raid, TDM) ============ */
function blacksite(){const L=new Level({id:'blacksite',name:'BLACKSITE',half:60,sky:'night',leafCol:0x9aa890,grassCol:0x8a9a7a});L._s=771;
 const W={mat:'concrete'},dh=99;
 L.wallGaps(-32,30,32,30,3.2,[[32,6],[52,2.4]],.5,W,dh);L.wallGaps(-32,-30,32,-30,3.2,[[45,6],[10,2.4]],.5,W,dh);L.wallGaps(-32,-30,-32,30,3.2,[[32,3]],.5,W,dh);L.wallGaps(32,-30,32,30,3.2,[[22,3],[48,3]],.5,W,dh);
 for(const[x,z]of[[-29.5,-27.5],[29.5,-27.5],[-29.5,27.5],[29.5,27.5]])tower(L,x,z);
 // HQ
 L.building(-14,-24,6,-12,3.8,{mat:'concrete',col:0xb8b4a8,doors:{s:[[6,1.8],[15,1.8]],e:[[6,1.8]],n:[[10,1.8]]},parapet:true,light:true,lit:.7});
 L.wallGaps(-4,-24,-4,-12,3.8,[[6,1.7]],.25,{mat:'concrete',col:0xa8a49c});L.wallGaps(-14,-18,-4,-18,3.8,[[3,1.7]],.25,{mat:'concrete',col:0xa8a49c});
 L.lamps.push({x:-9,y:3.3,z:-21,light:true,inside:true,col:0xbfe0ff});
 L.boxC(-9,-14.5,2.4,1,.85,{mat:'wood'});L.boxC(1,-21,1,2.6,.85,{mat:'wood'});crates(L,-12,-22,2);crates(L,3,-15,3);
 // comms array
 L.boxC(20,-18,9,9,.22,{mat:'concrete',col:0x9a9890});for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])L.box(20+dx*.9-.09,-18+dz*.9-.09,20+dx*.9+.09,-18+dz*.9+.09,18,{y0:.22,mat:'trim'});
 for(let y=2;y<18;y+=2.2){L.box(19.1,-18.95,20.9,-18.85,.07,{y0:y,mat:'trim',solid:false});L.box(19.1,-17.15,20.9,-17.05,.07,{y0:y,mat:'trim',solid:false});L.box(19.05,-18.9,19.15,-17.1,.07,{y0:y+1.1,mat:'trim',solid:false});L.box(20.85,-18.9,20.95,-17.1,.07,{y0:y+1.1,mat:'trim',solid:false});}
 L.prop('dish',16.5,-21.5,0);L.prop('dish',23.5,-21.8,0);L.prop('gen',23.6,-14.6,0);L.prop('gen',16.4,-14.6,0);L.sandbags(14,-11.5,18,-11.5);L.sandbags(22,-11.5,26,-11.5);
 L.pts.array={x:20,z:-16.2};
 // barracks
 L.building(-28,-8,-18,6,3.2,{mat:'plaster',col:0x9a9a84,doors:{e:[[4,1.8],[10,1.8]]},light:true,lit:.6});L.boxC(-25,-5,1.8,.9,.6,{mat:'wood'});L.boxC(-25,3,1.8,.9,.6,{mat:'wood'});
 L.building(-28,12,-20,24,3.2,{mat:'plaster',col:0x8e9078,doors:{e:[[6,1.8]],n:[[4,1.8]]},lit:.4});
 // motor pool shed
 L.box(13,16,29,16.4,4.2,{mat:'metal',col:0x6a7060});for(const x of[13,21,29])L.box(x-.15,5.8,x+.15,6.1,4.2,{mat:'trim'});L.box(12.6,5.6,29.4,16.6,.2,{y0:4.2,mat:'metal',col:0x585e54});L.wall(29,6,29,16,4.2,.3,{mat:'metal',col:0x6a7060});
 L.prop('truck',17.5,11,0);L.prop('jeep',24.5,11,PI);crates(L,14.5,7.2,3);L.prop('barrel',27.5,7.5);L.prop('barrel',27.5,8.4,0,{col:0x8a2a22});
 // container yard
 L.container(-5,8,false,0x8a3a2a);L.container(-5,8,false,0x2a4a6a,2.6);L.container(4,15,true,0x3a5a3a);L.container(8,3,false,0xa86a2a);L.container(-12,15,true,0x4a4a52);
 L.prop('tanker',-15,-1,H);L.prop('truck',6,-5,H);L.prop('jeep',-6,20,0.15);
 // sandbag nests at south gate and in yard
 L.sandbags(-9,25,-4.5,25);L.sandbags(-9,25,-9,22.5);L.sandbags(4.5,25,9,25);L.sandbags(9,25,9,22.5);L.sandbags(10,-2,14,-2);L.sandbags(-2,-6.5,2,-6.5);L.sandbags(-22,10,-18,10);
 crates(L,10,22,3);crates(L,-16,25,3);crates(L,24,-4,3);crates(L,-26,-26,3);crates(L,24,-27,2);crates(L,-2,-9,2);crates(L,-22,8,2);
 for(const[x,z]of[[25,0],[26,1],[-30,-12],[2,26],[-12,4],[12,20]])L.prop('barrel',x,z,0,{col:[0x5a6a4a,0x8a2a22,0x2a4a7a][(x*7+z)&1?1:0]});
 for(const[x,z,r]of[[-16,0,0],[12,0,PI],[0,21,H],[24,-6,PI],[-20,-14,0],[-8,-28,-H]])L.lamp(x,z,r);
 // outside: road, forest, helipad, rocks
 L.roads.push({x:0,z:45,w:7,len:30,kind:'asphalt'});L.roads.push({x:0,z:2,w:6,len:56,kind:'asphalt'});
 L.pads.push({x:40,z:-44,r:6});L.boxC(40,-44,12,12,.12,{mat:'concrete',col:0x7a7a74});L.pts.lz={x:40,z:-44};
 L.lamp(33,-38,PI);L.lamp(47,-50,0);
 const avoid=[[-34,-32,34,32],[-4.5,30,4.5,60],[32,-52,48,-36],[-12,-60,30,-32]];
 scatter(L,'pine',70,-58,-58,58,58,avoid,{s:[.8,1.35]});scatter(L,'rock',26,-58,-58,58,58,avoid,{s:[.7,1.6]});scatter(L,'bush',90,-58,-58,58,58,[[-33,-31,33,31],[-4,30,4,60]],{s:[.6,1.4],solid:false});
 L.grass.push([-60,31,60,60],[-60,-60,60,-31],[-60,-31,-33,31],[33,-31,60,31]);L.noGrass.push([-4,30,4,60],[33,-51,47,-37]);
 // logs + rock walls for cover outside the gate
 L.wall(-14,40,-8,40,.9,.6,{mat:'wood'});L.wall(10,44,16,44,.9,.6,{mat:'wood'});L.wall(-22,36,-22,42,1.1,.8,{mat:'sandbag'});L.wall(20,37,24,37,1.1,.8,{mat:'sandbag'});
 L.spawns.a=[[0,52],[-6,50],[6,50],[-12,46],[12,46],[-18,50],[18,50],[-3,56],[3,56],[-24,44]];
 L.spawns.b=[[13,-40],[7,-42],[19,-42],[0,-46],[26,-46],[-6,-40],[-14,-44],[13,-50],[-20,-38],[22,-36]];
 L.pts.start={x:0,z:53,yaw:PI};L.pts.gate={x:0,z:30};L.pts.hq={x:-4,z:-18};L.pts.northGate={x:13,z:-30};
 L.patrol=[[-10,0],[10,0],[10,18],[-10,18]];L.hot=[[0,0],[-4,24],[20,-16],[-4,-18],[-22,0],[18,10],[13,-34],[0,40],[-22,20],[24,-26]];
 L.finalize();return L;}

/* ============ OUTPOST — road checkpoint at dusk (defend, survival) ============ */
function outpost(){const L=new Level({id:'outpost',name:'OUTPOST',half:60,sky:'dusk',groundCol:0xd8c8b0,leafCol:0xb0b880,grassCol:0xc8b888});L._s=4242;
 L.roads.push({x:0,z:0,w:8,len:120,kind:'road'});
 // checkpoint line
 L.building(-10,-3,-5,3,3,{mat:'concrete',col:0xc8c0b0,doors:{e:[[3,1.7]],s:[[2.5,1.3]]},light:true,lit:1});
 L.hesco(-26,-7,-12,-7);L.hesco(-9,-7,-5.5,-7);L.hesco(5.5,-7,10,-7);L.hesco(13,-7,26,-7);
 L.box(-4.5,-5.2,-4.2,-4.8,1.2,{mat:'trim'});L.box(-4.2,-5.08,4.2,-4.92,.12,{y0:1.05,mat:'trim',solid:false,col:0xd84020});
 L.hesco(-4,-15,.8,-15);L.hesco(-.8,-21,4,-21);L.sandbags(-3,-3,-.5,-3);L.sandbags(1.2,1,3.6,1);
 L.sandbags(12,-3,17,-3);L.sandbags(12,-3,12,0);L.sandbags(17,-3,17,0);L.sandbags(-20,-3,-15,-3);L.sandbags(-20,-3,-20,0);
 tower(L,9,4);tower(L,-23,6,false);
 L.container(19,10,true,0x6a5a3a);L.container(-20,13,true,0x4a5a4a);L.container(11,16,false,0x7a3a2a);
 L.prop('jeep',4.5,12,0);L.prop('truck',-6,20,0);L.prop('jeep',-13,10,H);crates(L,6,-1.5,3);crates(L,-13,4,3);crates(L,16,4,2);crates(L,-3,9,2);crates(L,24,0,3);
 L.prop('gen',-9,7,0);for(const[x,z]of[[7,9],[7.8,9.6],[-16,16],[20,-3]])L.prop('barrel',x,z,0,{col:0x3a5a7a});
 L.pts.zone={x:0,z:2,r:10};
 // rear base
 L.building(14,24,28,34,4,{mat:'concrete',col:0xbcae98,doors:{w:[[5,1.8]],n:[[7,1.8]]},light:true,parapet:true});L.building(-28,26,-14,36,3.5,{mat:'plaster',col:0xcab89a,doors:{e:[[5,1.8]],n:[[4,1.8]]}});
 L.hesco(-30,44,-6,44);L.hesco(6,44,30,44);L.prop('truck',9,30,0);L.container(-8,32,true,0x5a6a4a);crates(L,-4,38,3);
 // north: fields, ruins, wrecks
 const mud=0xb89a78;ruin(L,-24,-32,-13,-23,mud);ruin(L,12,-42,23,-32,mud);ruin(L,-18,-52,-7,-45,mud);ruin(L,26,-20,36,-12,mud);ruin(L,-38,-16,-28,-8,mud);
 L.building(30,-52,42,-42,4,{mat:'plaster',col:0xc8a882,doors:{s:[[6,1.8]],w:[[5,1.8]]},lit:.2});L.building(-48,-40,-36,-30,3.6,{mat:'plaster',col:0xbca080,doors:{e:[[5,1.8]],s:[[4,1.8]]},lit:.2});
 L.prop('wreck',2.2,-29,.3);L.prop('wreck',-2,-42,PI);L.prop('wreck',-1.5,-52,H);
 for(const x of[-10,10]){L.wall(x,-52,x,-40,1.2,.5,{mat:'plaster',col:mud});L.wall(x,-37,x,-26,1.2,.5,{mat:'plaster',col:mud});}
 L.wall(-36,-24,-18,-24,1.1,.5,{mat:'plaster',col:mud});L.wall(16,-26,34,-26,1.1,.5,{mat:'plaster',col:mud});L.wall(-50,-6,-34,-6,1.2,.5,{mat:'plaster',col:mud});L.wall(36,-4,52,-4,1.2,.5,{mat:'plaster',col:mud});
 crates(L,-30,-40,2);crates(L,26,-34,2);crates(L,40,-26,2);crates(L,-44,-20,2);
 for(const[x,z,r]of[[6,-9,0],[-6,-9,PI],[6,8,0],[-6,24,PI],[6,40,0],[-6,-26,PI]])L.lamp(x,z,r);
 const avoid=[[-6,-60,6,60],[-30,-10,30,46]];scatter(L,'tree',36,-58,-58,58,58,avoid,{s:[.8,1.3]});scatter(L,'rock',30,-58,-58,58,58,avoid,{s:[.7,1.5]});scatter(L,'bush',70,-58,-58,58,58,[[-5,-60,5,60]],{s:[.6,1.3],solid:false});
 L.grass.push([-60,-60,-5,60],[5,-60,60,60]);L.noGrass.push([-30,-8,30,46]);
 L.spawns.a=[[0,8],[-3,6],[3,6],[-2,12],[2,12],[-8,10],[8,6],[0,16]];L.spawns.b=[[-16,-56],[-6,-57],[6,-57],[16,-56],[-26,-54],[26,-54],[0,-50],[-36,-46],[36,-46]];
 L.spawns.flank=[[-56,-20],[-56,-8],[56,-20],[56,-8],[-54,8],[54,8],[-50,-34],[50,-34]];
 L.pts.start={x:0,z:9,yaw:PI};L.hot=[[0,0],[0,-20],[-18,-28],[18,-37],[-12,-48],[30,-16],[-34,-12],[14,0],[-15,0]];
 L.finalize();return L;}

/* ============ OLD QUARTER — dense town at dusk (escort, TDM) ============ */
function oldquarter(){const L=new Level({id:'oldquarter',name:'OLD QUARTER',half:60,sky:'dusk2',groundCol:0xb0a090,leafCol:0xa0b080,grassCol:0xa8b088});L._s=9001;
 L.roads.push({x:0,z:0,w:10,len:120,kind:'asphalt'});L.roads.push({x:0,z:-25,w:8,len:120,rot:H,kind:'asphalt'});L.roads.push({x:0,z:25,w:8,len:120,rot:H,kind:'asphalt'});
 L.box(-12,-10,12,10,.03,{mat:'tile',solid:false});
 const C=[0xe8d8c0,0xd8b890,0xc8a080,0xb0b8a0,0xe0c8b0,0xa8b0b8,0xd0a890,0xc0c0a8];let ci=0;const b=(x0,z0,x1,z1,h,doors,o={})=>L.building(x0,z0,x1,z1,h,{mat:o.mat||(ci%5===3?'brick':'plaster'),col:o.col||C[ci++%C.length],doors,parapet:h>4.6,lit:.55,light:o.light,...o});
 // west
 b(-56,-56,-40,-44,7,{s:[[8,1.8]]});b(-37,-56,-24,-46,5,{s:[[6,1.8]],e:[[4,1.7]]});b(-21,-56,-6,-43,8,{e:[[6,1.8]],s:[[7,1.8]]},{light:true});
 b(-56,-40,-44,-30,4.5,{e:[[5,1.8]]});b(-40,-41,-26,-30,6,{s:[[7,1.8]],n:[[3,1.7]]});b(-22,-39,-6,-30,5,{e:[[4.5,1.8]],s:[[8,1.8]]},{light:true});
 b(-56,-20,-42,-6,6,{e:[[7,1.8]],n:[[5,1.8]]});b(-38,-20,-26,-8,4.5,{s:[[6,1.8]],n:[[6,1.8]]});b(-22,-20,-14,-12,5,{e:[[4,1.8]]});
 b(-56,6,-44,20,5,{e:[[7,1.8]]});b(-40,4,-28,16,7,{n:[[6,1.8]],s:[[6,1.8]]},{light:true});b(-24,6,-14,18,5,{e:[[6,1.8]],n:[[5,1.8]]});
 b(-56,30,-44,42,5,{e:[[6,1.8]]},{light:true,lit:.9});b(-40,30,-26,40,6,{n:[[7,1.8]]});b(-22,30,-6,44,7,{e:[[7,1.8]],n:[[8,1.8]]});b(-56,46,-40,56,4.5,{n:[[8,1.8]]});b(-36,44,-20,56,5,{n:[[8,1.8]]});
 // east
 b(6,-56,20,-44,6,{s:[[7,1.8]],w:[[6,1.8]]});b(24,-56,36,-46,5,{s:[[6,1.8]]});b(40,-56,56,-50,4,{s:[[8,1.8]]});b(6,-40,18,-30,5,{w:[[5,1.8]],n:[[6,1.8]]},{light:true});b(22,-40,32,-30,7,{n:[[5,1.8]],e:[[5,1.8]]});
 b(14,-20,22,-12,5,{w:[[4,1.8]]});b(26,-20,38,-6,6,{n:[[6,1.8]],w:[[7,1.8]]},{light:true});b(42,-20,56,-8,5,{n:[[7,1.8]]});
 b(14,12,22,20,4.5,{w:[[4,1.8]]});b(26,6,40,18,6,{s:[[7,1.8]],w:[[6,1.8]]});b(44,4,56,20,7,{w:[[8,1.8]]});
 b(6,30,20,42,5,{w:[[6,1.8]],n:[[7,1.8]]},{light:true});b(24,30,36,44,6,{n:[[6,1.8]]});b(40,30,56,40,5,{n:[[8,1.8]]});b(8,46,26,56,4.5,{n:[[9,1.8]]});b(32,48,48,56,5,{n:[[8,1.8]]});
 // plaza market
 L.boxC(0,0,4,4,.7,{mat:'concrete',col:0xd8d0c0});L.boxC(0,0,1,1,2.2,{mat:'concrete',col:0xc8c0b0});
 for(const z of[-6.5,6.5])for(const x of[-9,-5,5,9])L.prop('stall',x,z,0);
 crates(L,-10.5,-2,2);crates(L,9.5,1,2);L.prop('barrel',-3,8.6);L.prop('barrel',3.4,-8.8,0,{col:0x8a2a22});
 // street clutter
 const cc=[0x8a2a22,0x2a4a7a,0xd8d0c0,0x3a3a40,0xc89a3a,0x5a7a5a,0x9aa0a8];let k=0;
 for(const[x,z,r]of[[-3.6,-42,0],[3.6,-20,PI],[-3.6,17,0],[3.6,34,PI],[-3.6,49,0],[3.6,-50,PI],[-30,-26.6,H],[28,-23.4,-H],[-16,23.4,-H],[40,26.6,H],[-46,23.4,H],[12,-26.6,H]])L.prop('car',x,z,r,{col:cc[k++%cc.length]});
 L.prop('wreck',22,25,H+.2);L.prop('jeep',-24,-25,H);
 for(const[x,z]of[[-42,-43],[21,-43],[-23,-4],[23,4],[41,-10],[-41,22],[38,46],[-25,57]])L.prop('dumpster',x,z,(x+z)&1?0:H);
 crates(L,-42,-27,2);crates(L,44,-27,3);crates(L,-12,27,2);crates(L,20,22,2);crates(L,-50,-3,2);crates(L,50,1,2);crates(L,-38,42,2);crates(L,31,-43,2);
 for(let z=-52;z<=52;z+=16)L.lamp(z%32===0?-5.6:5.6,z,z%32===0?0:PI);for(const x of[-40,-20,20,40]){L.lamp(x,-29.5,-H,true);L.lamp(x,29.5,H,true);}
 // extraction lot
 L.pts.lz={x:47,z:-37};L.pads.push({x:47,z:-37,r:5});L.container(54,-28,true,0x3a4a5a);L.container(40,-45,false,0x7a5a2a);crates(L,40,-31,3);L.prop('truck',53,-42,0);
 for(const[x,z]of[[-30,-48],[30,-12],[48,52],[-50,50],[-10,-50],[12,52]])L.prop('tree',x,z,0,{s:.9});
 L.spawns.a=[[-50,25],[-40,25],[-30,25],[-20,25],[0,50],[0,40],[-10,25],[-57,25],[0,30]];L.spawns.b=[[50,-25],[40,-25],[30,-25],[20,-25],[0,-50],[0,-40],[10,-25],[52,-32],[0,-30]];
 L.pts.start={x:-30,z:25,yaw:-H};L.pts.vip={x:-50,z:36};L.pts.safedoor={x:-43,z:36};L.pts.plaza={x:0,z:2};L.pts.ave={x:0,z:-25};
 L.hot=[[0,0],[0,-25],[0,25],[-30,-25],[30,25],[-30,25],[30,-25],[-45,0],[45,0],[0,-45],[0,45],[47,-37]];
 L.finalize();return L;}

export const MAPS={blacksite,outpost,oldquarter};
