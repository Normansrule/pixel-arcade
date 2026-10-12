// LONG SHOT — missions 1-3: harbor villa party, mountain dam, desert convoy checkpoint.
import * as THREE from '../vendor/three.module.min.js';
import {fbm,noise,lerp,clamp,smooth,rng} from './world.js';
import {rail,stairs,parasol,lounger,table,hipRoof,gableRoof,building,lamp,crate,lighthouse,waterTower,chapel,mast,hut,scatter,M} from './props.js';
const V=THREE.Vector3;
const SUIT=(top,o={})=>({topT:'suit',top,shirt:0xf2f2f2,pants:o.pants??0x18181a,shoes:0x101010,...o});
const GUARD=o=>({topT:'suit',top:0x141416,shirt:0x202024,pants:0x141416,glasses:'sun',hs:'short',hat:'none',...o});
const pick=(a,r)=>a[Math.floor(r()*a.length)];
const DRESS=[0xc02a40,0x2a4a9a,0xe0b030,0x1a1a1a,0xf0e8e0,0x2a8a7a,0x8a3a9a,0xe07a90];
const SUITC=[0x1c2a4a,0x2a2c30,0x6a6a70,0xc0a070,0x3a2a1a,0x8a8c90];

// ================================================================ 1. HARBOR VILLA
const villa={id:'villa',n:'BAYFRONT SOIRÉE',loc:'HARBOR VILLA · COSTA SERENA',time:300,depart:85,
 brief:'A charity gala on a cliff-top terrace is cover for an auction of stolen guidance chips. The host never shows his face — but the man running the sale does. Find him among the guests, and stop the courier bringing the chips in by boat.',
 targets:[{id:'tgt',code:'THE AUCTIONEER',clues:['WHITE JACKET','RED TIE','SUNGLASSES','HOLDING A DRINK'],note:'Works the room in a loop: bar, poolside, a phone call under the loggia, the dance floor, then a look at the sea.'}],
 sec:[{id:'courier',type:'courier',person:'cour',n:'INTERCEPT THE COURIER',d:'He arrives by speedboat with a silver briefcase. Drop him before he reaches the Auctioneer.'},
  {id:'acc',type:'accident',n:'MAKE IT AN ACCIDENT',d:'The propane tank by the bar grill. Wait for the target to get close.'}],
 wind:{a:Math.PI*1.05,base:4.2,gust:2.2},
 env:{sky:{top:0x24447a,hor:0xf2a878,bot:0x8a6a5a,sunDir:new V(-.35,.16,-.92),sunCol:0xffb070,cloud:.35,sunSize:.0012},fog:{color:0xd2a486,density:.0011},
  light:{skyC:0x9ab0d0,gndC:0x6a4a32,hemi:.75,sunC:0xffc890,sunI:2.6},exposure:1.0,bloomThreshold:.9,water:true,center:new V(0,8,0)},
 H(x,z){const az=Math.abs(z);let h=x<36?7.8:x<43?lerp(7.8,1.6,smooth(36,43,x)):x<80?lerp(1.6,-1.5,(x-43)/37):lerp(-1.5,-9,clamp((x-80)/80,0,1));
  if(x>0&&x<18&&az<5)h=6.4;
  const m=smooth(-80,-58,x)*(1-smooth(52,72,az));const hill=Math.max(0,-60-x)*.25+smooth(55,150,az)*30*(1-smooth(60,210,x))+(fbm(x*.008,z*.008)*14+6)*(1-smooth(80,200,x)*(1-smooth(100,220,az)));
  h+=hill*(1-m)*(x<36||az>50?1:smooth(50,90,az));
  const hd=Math.exp(-((x-330)**2+(z-170)**2)/(2*58*58));h=Math.max(h,lerp(-9,30,hd)+fbm(x*.03,z*.03)*6*hd);return h;},
 tcol(x,z,y,sl,c){const sand=new THREE.Color(0xd8c49a),grass=new THREE.Color(0x6a7a3a),dry=new THREE.Color(0x9a8a5a),rock=new THREE.Color(0x8a7a6a);
  if(y<2.2)c.copy(sand);else c.copy(grass).lerp(dry,clamp(fbm(x*.02,z*.02)+.5,0,1)*.7);if(sl>.55)c.lerp(rock,smooth(.55,.9,sl));c.multiplyScalar(.82+noise(x*.3,z*.3)*.2);},
 build(W,L){const r=rng(3);
  // terrace slabs around the pool + retaining wall + stairs + balustrade
  for(const[x0,x1,z0,z1]of[[-16,34,5,30],[-16,34,-30,-5],[-16,0,-5,5],[18,34,-5,5]])W.box((x0+x1)/2,7.6,(z0+z1)/2,x1-x0,.4,z1-z0,{side:'paving',top:'paving'});
  W.box(-30,7.6,-37,60,.4,14,{side:'paving',top:'paving'});
  for(const[x0,x1,z0,z1]of[[-.4,18.4,-5.4,-5],[-.4,18.4,5,5.4],[-.4,0,-5,5],[18,18.4,-5,5]])W.box((x0+x1)/2,7.6,(z0+z1)/2,x1-x0,.48,z1-z0,'white');
  W.pool(9,7.82,0,18,10);
  W.box(35.5,0,-10-25,3,8,50,{side:'concrete',top:'paving'},{matK:'stone'});W.box(35.5,0,35,3,8,50,{side:'concrete',top:'paving'});W.box(35.5,0,0,3,8,20,{side:'concrete',top:'paving'});
  stairs(W,37,47,-2.4,2.4,7.95,1.9,'x','paving');for(const s of[-1,1])rail(W,37,s*2.6,47,s*2.6,1.9,.9,'white',{t:.14});
  rail(W,34.4,-30,34.4,-3,8,1.05,'white',{t:.25,posts:1.6});rail(W,34.4,3,34.4,30,8,1.05,'white',{t:.25,posts:1.6});rail(W,-16,30,34.4,30,8,1.05,'white',{t:.25});rail(W,-16,-30,34.4,-30,8,1.05,'white',{t:.25});
  // the villa: ground floor, upper floor, hip roof, loggia
  W.box(-30,7.9,0,28,4.6,32,{side:'facade:stucco',top:'paving'});W.box(-31,12.5,0,22,4,28,{side:'facade:stucco',top:'stucco'});hipRoof(W,-31,16.5,0,23.4,29.4,3.2);
  W.box(-12,12.1,0,8,.4,24,{side:'stucco',top:'paving'});for(const z of[-11.5,-6,0,6,11.5])W.cyl(-8.4,8,z,.28,.3,4.1,'white',{seg:12,collide:true,walk:false});rail(W,-8.2,-12,-8.2,12,12.5,1,'white',{t:.2,posts:1.2});
  W.box(-30,7.9,-23,10,3.6,12,{side:'facade:stucco',top:'paving'});W.box(-30,11.5,-23,10.4,.3,12.4,'terracotta',{walk:false});
  // bar, grill, DJ, dance floor, loungers, parasols, tables
  W.box(23,8,-17,6.4,1.1,1.1,{side:'wood',top:'white'},{matK:'wood'});W.box(20.3,8,-19.2,1.1,1.1,3.4,{side:'wood',top:'white'});W.box(23,8,-21.4,7,2.4,.5,'wood',{matK:'wood'});
  for(let i=0;i<6;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.3,6),new THREE.MeshStandardMaterial({color:[0x3a8a3a,0x8a2a1a,0xd8b040][i%3],roughness:.1,metalness:.3,transparent:true,opacity:.8}));b.position.set(20.8+i*.9,10.6,-21.2);W.add(b);}
  W.box(29.4,8,-19.6,1.6,.95,.9,'darksteel',{matK:'metal'});W.box(29.4,8.95,-19.6,1.5,.08,.8,'black',{collide:false});
  parasol(W,23.5,8,-19.6,0xf2ece0,1.8);for(const[x,z]of[[14,-20],[9,-24],[3,-21],[-4,-25],[26,-26]]){table(W,x,8,z,{r:.5,chair:'white',n:3,a:x});parasol(W,x,8,z,pick([0xf2ece0,0x2a5a8a,0xe8d8b0],r));}
  W.box(18,8,18,10,.06,9,'black',{walk:true,collide:false});W.box(26,8,23,3.2,1.2,1.4,'black',{matK:'metal'});for(const s of[-1,1])W.box(26+s*2.4,8,23.4,.9,1.8,.9,'black',{matK:'wood'});
  for(const x of[1,4,7,10,13,16])lounger(W,x,8,8.3,0,pick([0x2a5a8a,0xf2ece0,0x1a8a8a],r));for(const x of[2,6,10,14])lounger(W,x,8,-8.3,Math.PI,0x2a5a8a);
  for(const[x,z]of[[-4,18],[2,24],[8,26],[-10,24]])table(W,x,8,z,{r:.5,chair:'white',n:4});
  // string lights over the terrace
  const P=[[-14,28],[32,28],[32,-28],[-14,-28],[9,28],[9,-28]];for(const[x,z]of P)W.cyl(x,8,z,.06,.08,5,'darksteel',{seg:6,collide:false});
  const ls=[[0,1],[1,2],[2,3],[3,0],[4,5],[0,2],[1,3]];for(const[a,b]of ls)W.lightString(new V(P[a][0],12.9,P[a][1]),new V(P[b][0],12.9,P[b][1]),22,.9,0xffd8a0);
  W.pointLight(9,12,0,0xffc890,40,40);W.pointLight(23,11.5,-17,0xffc080,25,18);
  // beach, boathouse, pier
  W.box(56,0,-24,8,4,6,{side:'wood',top:'wood'},{matK:'wood'});gableRoof(W,56,4,-24,8.6,6.6,1.8,'darksteel');
  W.box(79.5,1.5,0,65,.4,3.2,'wood',{matK:'wood'});for(let x=50;x<=112;x+=4)for(const s of[-1,1])W.cyl(x,-4,s*1.5,.14,.16,5.5,'wood',{seg:6,collide:false});rail(W,50,1.6,112,1.6,1.9,.8,'wood',{t:.08,posts:4});
  for(const x of[64,80,96])W.cyl(x,1.9,-1.5,.12,.14,.5,'darksteel',{seg:6});
  // flags (wind)
  W.flag(56,6,-21,{pole:7,color:'#1a4a8a',text:'✦'});W.flag(111,1.9,1.2,{pole:6,color:'#c02a20',text:''});W.flag(-31,19.7,0,{pole:5,color:'#f0f0f0',text:'',w:1.4,h:.9});W.flag(33.8,8,-29,{pole:6.5,color:'#d8a020',text:''});
  // vegetation
  W.trees('palm',[[-14,8,-29],[33,8,29],[-14,8,29],[33,8,-12],[33,8,12],[46,null,-14],[48,null,16],[52,null,34],[44,null,-36],[60,null,-8],[-18,8,-34],[22,8,29]],{scale:1.05});
  W.trees('cypress',[[-46,8,-20],[-46,8,-8],[-46,8,8],[-46,8,20],[-18,8,-31],[-40,8,-31]]);
  const olive=scatter(60,4,r=>{const x=-60-r()*240,z=(r()-.5)*600;return[x,null,z];}).concat(scatter(70,5,r=>{const x=-40+r()*160,z=(r()<.5?-1:1)*(70+r()*160);return W.H(x,z)>3?[x,null,z]:null;}));W.trees('olive',olive,{seed:2});
  W.trees('bush',scatter(40,8,r=>{const x=-50+r()*80,z=(r()-.5)*58;return(x<-16||x>34||Math.abs(z)>28)&&Math.abs(x)<60?[x,null,z]:null;}).concat([[-15,8,-14],[-15,8,14],[30,8,25],[30,8,-25]]),{collide:false});
  W.rocks(scatter(50,6,r=>{const x=37+r()*30,z=(r()-.5)*140;return Math.abs(z)>6?[x,null,z,.8+r()*1.8]:null;}).concat(scatter(30,7,r=>{const a=r()*6.28,d=40+r()*30;return[330+Math.cos(a)*d,null,170+Math.sin(a)*d,2+r()*3];})));
  // distant hillside houses
  for(let i=0;i<10;i++){const x=-120-r()*160,z=(r()-.5)*420;const y=W.H(x,z);W.box(x,y-1,z,8+r()*6,5+r()*3,7+r()*5,{side:'facade:stucco',top:'stucco'},{ry:r()*3});}
  // perches
  const lh=lighthouse(W,330,170,12);const ch=chapel(W,-172,212,-.7);const wt=waterTower(W,-34,-268,10);
  const dir=(x,z)=>{const l=Math.hypot(x,z);return[-x/l,-z/l];};const[a,b]=dir(330,170);
  return{perches:[{n:'LIGHTHOUSE',p:new V(330+a*3.1,lh+1.55,170+b*3.1)},{n:'CHAPEL BELFRY',p:new V(ch.x,ch.y+1.5,ch.z)},{n:'WATER TOWER',p:new V(-34+.6,wt+1.55,-268+2.8)}]};},
 cast(L){const r=L.rand;
  // nodes
  L.node('tBar',26.4,8,-15.6);L.node('tPool',-3,8,-7.6);L.node('tLog',-11,8,4);L.node('tDance',13,8,13.5);L.node('tRail',33.3,8,-14);
  L.node('stairTop',35.5,8,0);L.node('stairBot',47.5,1.9,0);L.node('pierS',49,1.9,0);L.node('pierN',95,1.9,1.1);L.node('yBoard',104,1.9,-1.2);L.node('terr',29,8,0);
  L.zone('terrace',[[-6,-20],[4,-24],[12,-12],[-8,18],[2,22],[-10,0],[28,8],[28,-8],[22,26],[-4,12],[30,20],[-2,-14],[25,-24]],{y:8,acts:['talk','drink','idle','talk','drink','phone','smoke']});
  L.zone('pool',[[-4,-7],[-4,7],[6,-7.5],[12,7.4],[20,-7],[20,7]],{y:8,acts:['talk','drink','idle'],jit:1});
  L.zone('dance',[[14,15],[18,19],[20,15],[16,21],[22,18],[12,19]],{y:8,acts:['dance','dance','dance','talk'],jit:1.5});
  L.zone('beach',[[48,-20],[52,-34],[50,22],[55,30],[49,10],[58,-12]],{acts:['idle','talk','phone']});
  for(const[x,z]of[[-16.5,-6],[-16.5,6],[-25,-17],[-16.5,0]])L.exit(x,8,z,true);L.exit(56,null,-20.5,true);
  // target + decoys
  L.person({id:'tgt',role:'target',name:'THE AUCTIONEER',at:[22,8,-15.6],look:SUIT(0xf2f0ea,{tie:0xb81e1e,glasses:'sun',drink:true,hs:'short',hair:0x1a1410,skin:0xd9a47c}),
   routine:[{to:'tBar',act:'drink',wait:16,face:[25,8,-18]},{to:'tPool',act:'talk',wait:16,face:[-3,8,-10]},{to:'tLog',act:'phone',wait:12,face:[-20,8,4]},{to:'tDance',act:'talk',wait:12,face:[16,8,16]},{to:'tRail',act:'lean',wait:14,face:[40,8,-14]}],wait:6});
  const decoys=[SUIT(0xf2f0ea,{tie:0x161616,glasses:'sun',drink:true}),SUIT(0x161616,{tie:0xb81e1e,glasses:'sun',drink:true}),SUIT(0xf2f0ea,{tie:0xb81e1e,drink:true}),SUIT(0xe2d4b0,{tie:0xb81e1e,glasses:'sun',drink:true}),SUIT(0xf2f0ea,{tie:0xb81e1e,glasses:'sun'})];
  decoys.forEach((lk,i)=>L.person({role:'civ',at:[[4,8,-22],[18,8,16],[-6,8,20],[26,8,8],[-2,8,-14]][i],look:lk,wander:i<2?'terrace':i===2?'dance':'terrace'}));
  L.person({role:'civ',at:[-4,8,-9.6],look:{topT:'dress',top:0xc02a40,female:true,hs:'long',drink:true},act:'talk',face:[-3,8,-7.6],wait:1e9});
  L.person({role:'civ',at:[-1.6,8,-9.4],look:SUIT(0x1c2a4a,{tie:0x3a6ab0}),act:'talk',face:[-3,8,-7.6],wait:1e9});
  // guests
  for(let i=0;i<20;i++){const f=r()<.5;const z=['terrace','terrace','pool','dance','dance','terrace','beach'][i%7];const sp=L.zones[z].spots[i%L.zones[z].spots.length];
   const lk=f?{topT:'dress',top:pick(DRESS,r),female:true,hs:pick(['long','bun','pony','long'],r),drink:r()<.4,glasses:r()<.3?'sun':undefined,hat:r()<.15?'wide':'none',hatC:0xf0e8d0}:
    {topT:pick(['suit','suit','shirt','vest'],r),top:pick(SUITC,r),shirt:pick([0xf2f2f2,0x9ac0e0,0x161616],r),tie:r()<.4?pick([0x1c2a4a,0x6a1a1e,0x2a5a2a],r):undefined,pants:pick([0x18181a,0x2a2c30,0xd8d0c0],r),glasses:r()<.3?'sun':undefined,drink:r()<.4,hat:r()<.12?'fedora':'none',hatC:0xd8c8a0};
   L.person({role:'civ',at:[sp[0],z==='beach'?null:8,sp[1]],look:lk,wander:z});}
  for(const[x,z]of[[3,8.3],[9,8.3],[15,8.3]])L.person({role:'civ',at:[x,8,z],look:{topT:'dress',top:pick(DRESS,r),female:true,hs:'long',glasses:'sun'},act:'lounge',wait:1e9,yaw:Math.PI});
  // staff
  L.person({role:'staff',at:[22,8,-18.6],look:{topT:'vest',top:0x161616,shirt:0xf2f2f2,tie:0x161616,pants:0x161616},act:'idle',yaw:0,routine:[{to:[20.8,8,-18.6],act:'talk',wait:8,face:[21,8,-15]},{to:[23.2,8,-18.6],act:'idle',wait:7,face:[23,8,-15]}]});
  L.person({role:'staff',at:[23.4,8,-18.6],look:{topT:'vest',top:0x161616,shirt:0xf2f2f2,tie:0x161616,pants:0x161616,female:true,hs:'bun'},routine:[{to:[23.4,8,-18.6],act:'idle',wait:9,face:[23.5,8,-15]},{to:[21.6,8,-18.6],act:'talk',wait:6,face:[22,8,-15]}]});
  L.person({role:'staff',at:[26,8,24],look:{topT:'tee',top:0x161616,pants:0x2a2c30,hat:'cap',hatC:0xff4d00},act:'dance',yaw:Math.PI,wait:1e9});
  L.person({role:'staff',at:[10,8,-12],look:{topT:'vest',top:0x161616,shirt:0xf2f2f2,pants:0x161616,drink:true},routine:[{to:[10,8,-12],act:'idle',wait:3},{to:[-6,8,12],act:'idle',wait:3},{to:[10,8,24],act:'idle',wait:3},{to:[28,8,4],act:'idle',wait:3},{to:[20,8,-14],act:'idle',wait:4}]});
  // security
  L.person({role:'guard',at:[33,8,4.5],look:GUARD(),act:'guard',yaw:-Math.PI/2,wait:1e9});
  L.person({role:'guard',at:[-17.2,8,-9],look:GUARD(),act:'arms',yaw:Math.PI/2,wait:1e9});
  L.person({role:'guard',at:[-10,12.5,6],look:GUARD({rifle:true}),act:'guard',yaw:Math.PI/2,wait:1e9});
  L.person({role:'guard',at:[51,1.9,1],look:GUARD(),act:'guard',yaw:-Math.PI/2,wait:1e9});
  L.person({role:'guard',at:[-12,8,-26],look:GUARD(),routine:[{to:[-12,8,-26],act:'look',wait:4},{to:[31,8,-26],act:'look',wait:5},{to:[31,8,27],act:'look',wait:5},{to:[-12,8,27],act:'look',wait:4}]});
  L.person({role:'guard',at:[50,null,-30],look:GUARD({rifle:true}),routine:[{to:[50,null,-30],act:'guard',wait:6},{to:[52,null,30],act:'guard',wait:6}]});
  // courier arrives by speedboat
  const sb=L.vehicle({id:'sboat',type:'speedboat',color:0xc02a20,path:[[460,null,210],[260,null,90],[150,null,24],[97,null,5.2]],speed:13,state:'park'});
  const yacht=L.vehicle({id:'yacht',type:'yacht',color:0x1c2a4a,at:[104,null,-9],yaw:Math.PI/2,leave:[[150,null,-30],[320,null,-90],[800,null,-220]],speed:7});
  for(const v of[sb,yacht])v.placeAt&&v.path.length&&v.placeAt(0);
  const drv=L.person({role:'hostile',at:[460,1,210],look:GUARD({topT:'tee',top:0x161616,glasses:'sun'})});sb.board(drv);
  const c=L.person({id:'cour',role:'courier',name:'COURIER',at:[460,1,210],look:SUIT(0x1c2a4a,{briefcase:'silver',glasses:'sun',hat:'fedora',hatC:0x2a2c30,tie:0x161616}),meet:'tgt',
   routine:[{to:'pierS',act:'idle',wait:0},{to:'stairBot',act:'idle',wait:0},{to:'stairTop',act:'idle',wait:0},{to:'terr',act:'idle',wait:0}],after:[{to:'stairTop'},{to:'pierN',act:'idle',wait:1e9}]});
  c.s.loop=false;sb.board(c);c.state='ride';
  L.person({role:'hostile',at:[104,1.9,-8],look:GUARD({topT:'tee',top:0xf2f2f2,hat:'cap',hatC:0xf2f2f2,pants:0xf2f2f2,glasses:'sun'}),act:'idle',wait:1e9});
  const capt=L.people[L.people.length-1];yacht.board(capt);
  // accident hazard
  L.hazard({id:'gas',kind:'gas',at:[29.9,8,-17.4],r:5.2});},
 escape:{vehicle:'yacht',via:['stairTop','stairBot','pierS'],board:'yBoard'},depart:{vehicle:'yacht',via:['stairTop','stairBot','pierS'],board:'yBoard'},
 script(G,L,dt,t){const sb=L.byId('sboat'),c=L.byId('cour');
  if(!this._go&&t>14){this._go=1;sb.go();}
  if(this._go===1&&sb.state==='park'&&sb.dist>0){this._go=2;sb.unload();for(const q of[c,...sb.occ])if(q.alive&&!q.vehicle){q.pos.copy(L.nodes.pierN);q.prevPos.copy(q.pos);}if(c.alive){c.state='routine';c.ri=-1;c.wait=0;c.next();}const d=sb.occ.find(p=>p.alive);}
 },
 reset(){this._go=0;}};

// ================================================================ 2. MOUNTAIN DAM
const DAMY=60;
const dam={id:'dam',n:'SPILLWAY',loc:'KESTREL GORGE DAM · NORTHERN RANGE',time:330,depart:70,
 brief:'A private contractor is selling the dam\'s control codes to whoever floods the valley first. He is touring the crest this morning with his engineers. Expect strong crosswinds funnelling down the gorge.',
 targets:[{id:'tgt',code:'THE CONTRACTOR',clues:['WHITE HARD HAT','NAVY JACKET','CLIPBOARD'],note:'Inspects the gantry crane, checks the spillway, then calls in from the car park.'}],
 sec:[{id:'acc',type:'accident',n:'DROP THE LOAD',d:'A pallet hangs from the gantry crane. Shoot the hook while he inspects the crane below it.'},
  {id:'comms',type:'destroy',objs:['relay1','relay2'],n:'CUT THE COMMS',d:'Two relay boxes on the control tower roof. Kill them before he can call for backup.'}],
 wind:{a:0,base:7.5,gust:3},
 env:{sky:{top:0x5a6a80,hor:0xb8c0c8,bot:0x7a8088,sunDir:new V(.35,.45,-.82),sunCol:0xd8dce0,cloud:.85,sunSize:.0006,cloudDark:.35},fog:{color:0xa8b0b8,density:.0016},
  light:{skyC:0xb0bcc8,gndC:0x4a4a44,hemi:.95,sunC:0xe8eef4,sunI:1.5},exposure:1.08,bloomThreshold:.95,water:true,center:new V(0,DAMY,0),weather:null},
 H(x,z){const ax=Math.abs(x);const floor=z>0?0:lerp(0,40,smooth(0,-400,z));const wall=smooth(40,110,ax)*(110+fbm(x*.01,z*.01)*40)+smooth(100,400,ax)*80;let h=floor+wall+fbm(x*.02+5,z*.02)*6*smooth(30,60,ax);
  // dam abutments + car park plateau
  if(ax<95&&z>-30&&z<50)h=Math.max(h,0);if(x>80&&x<140&&Math.abs(z)<16)h=DAMY-.2;if(x>130&&x<600&&Math.abs(z-(x-130)*.12)<8)h=Math.min(Math.max(h,DAMY-.2),DAMY-.2+(x-130)*.08);
  if(x<-80&&x>-130&&Math.abs(z)<12)h=DAMY-.2;return h;},
 tcol(x,z,y,sl,c){const rock=new THREE.Color(0x7a7670),pine=new THREE.Color(0x3a4a32),gravel=new THREE.Color(0x8a8678);c.copy(pine).lerp(rock,smooth(.35,.75,sl));if(y<4)c.copy(gravel);c.multiplyScalar(.8+noise(x*.2,z*.2)*.3);},
 build(W,L){const r=rng(11);
  // dam: crest, parapets, stepped downstream face, spillway
  W.box(0,DAMY-1,0,190,1,9,{side:'concrete',top:'concrete'});for(const s of[-1,1])rail(W,-95,s*4.6,95,s*4.6,DAMY,1.1,'concrete',{t:.4});
  for(let k=0;k<12;k++){const y=k*5,dz=4.5+(12-k)*3.6;W.box(0,y-1,dz/2-4.5,190-k*2,5.2,dz,{side:'concreteD',top:'concreteD'},{walk:false});}
  W.box(0,0,-10,190,DAMY-1,11,{side:'concrete',top:'concrete'},{walk:false});
  W.box(0,DAMY-1.4,48,24,1,20,'concreteD',{collide:false});const fall=new THREE.Mesh(new THREE.PlaneGeometry(18,62,1,8),new THREE.MeshStandardMaterial({color:0xe8f0f4,roughness:.2,transparent:true,opacity:.85,map:W.S.water,emissive:0x3a4a50}));
  fall.position.set(0,30,24);fall.rotation.x=-1.07;W.add(fall);W.updaters.push((dt,t)=>{fall.material.map.offset.y=-t*.6;});
  // turbine house at the base
  W.box(0,-.5,62,70,15,22,{side:'facade:concrete',top:'concreteD'});for(const s of[-1,1])W.box(s*18,14.5,62,6,3,6,'darksteel',{matK:'metal'});
  // control tower on the crest (west)
  W.box(-48,DAMY,-1,12,16,12,{side:'facade:concrete',top:'concreteD'});rail(W,-54,-7,-42,-7,DAMY+16,1,'concreteD',{t:.2});rail(W,-54,5,-42,5,DAMY+16,1,'concreteD',{t:.2});rail(W,-54,-7,-54,5,DAMY+16,1,'concreteD',{t:.2});rail(W,-42,-7,-42,5,DAMY+16,1,'concreteD',{t:.2});
  W.cyl(-50,DAMY+16,-4,.1,.12,9,'steel',{seg:6});
  // gantry crane over the crest
  for(const s of[-1,1]){W.box(26+s*0,DAMY,s*5.6,1,13,1,'yellow',{matK:'metal',walk:false});W.box(16,DAMY,s*5.6,1,13,1,'yellow',{matK:'metal',walk:false});W.box(21,DAMY+12.4,s*5.6,12,.9,.9,'yellow',{matK:'metal',walk:false});}
  W.box(24,DAMY+12.4,0,1.4,1,12,'yellow',{matK:'metal',walk:false});W.box(24,DAMY+11.6,0,2,.8,2,'darksteel',{matK:'metal',walk:false});
  // car park + barrier, west access road
  W.box(110,DAMY-.3,0,60,.4,30,'asphalt',{walk:true});for(let i=0;i<6;i++)W.box(95+i*6,DAMY+.11,-9,.15,.02,5,'white',{collide:false});lamp(W,92,DAMY,12);lamp(W,128,DAMY,12);
  W.box(-105,DAMY-.3,0,50,.4,22,'asphalt');hut(W,-112,9,0,{mat:'concrete',y:DAMY});
  // flags + windsock
  W.flag(-44,DAMY+16,4,{pole:6,color:'#d8a020',text:''});W.flag(90,DAMY,-12,{pole:8,color:'#2a5a9a',text:''});W.flag(0,DAMY,-4.2,{pole:5,color:'#c02a20',text:'',w:1.4,h:.9});
  // reservoir + downstream river
  // forest on the slopes
  const pines=scatter(520,13,r=>{const x=(r()-.5)*1100,z=-500+r()*1100;const h=W.H(x,z),e=3;const sl=Math.hypot(W.H(x+e,z)-W.H(x-e,z),W.H(x,z+e)-W.H(x,z-e))/(2*e);
   if(sl>.75||Math.abs(x)<60&&z>-40&&z<80||(z<-12&&h<DAMY+1&&Math.abs(x)<200))return null;return[x,null,z,.8+r()*.6];});W.trees('pine',pines,{collide:false});
  W.rocks(scatter(70,12,r=>{const x=(r()-.5)*400,z=r()*300;return Math.abs(x)>30?[x,null,z,1+r()*3]:null;}));
  // perches
  const ridge=W.groundAt(-110,230);W.box(-110,ridge-.4,230,5,1.2,4,'rock',{matK:'stone'});
  // gorge bridge downstream: deck + arch piers, perch at mid-span
  const BY=82;W.box(0,BY,262,300,.9,9,{side:'concrete',top:'asphalt'});for(const s of[-1,1])rail(W,-150,262+s*4.4,150,262+s*4.4,BY+.9,1,'concreteD',{t:.3});
  for(const x of[-105,-60,-20,20,60,105]){const g=W.H(x,262)-1;W.box(x,g,262,4,BY-g,7,'concreteD',{walk:false});}
  const mt=mast(W,-118,-372,18);
  return{perches:[{n:'RIDGE PINES',p:new V(-110,ridge+1.2+1.0,230)},{n:'GORGE BRIDGE',p:new V(4,BY+.9+1.6,258.2)},{n:'RADIO MAST',p:new V(-118,mt+1.55,-372)}]};},
 water(W){W.water({y:DAMY-4,bounds:[-700,-1400,700,-5.5],cx:0,cz:-300,deep:0x0c2a34,shallow:0x2a6a6a,depthScale:20});W.water({y:.6,bounds:[-60,72,60,1400],cx:0,cz:400,deep:0x1a3a3a,shallow:0x5a8a80,depthScale:3,foam:1});},
 cast(L){const r=L.rand,Y=DAMY;
  L.node('cCrane',23.5,Y,.4);L.node('cTower',-41,Y,1);L.node('cSpill',2,Y,3.6);L.node('cPark',96,Y,4);L.node('suvBoard',104,Y,6);
  L.zone('crest',[[-70,-2],[-30,2],[-10,-2],[10,2],[40,-2],[60,2],[80,0]],{y:Y,acts:['talk','clip','phone','idle','inspect']});
  L.zone('park',[[95,-6],[110,6],[120,-4],[100,10]],{y:Y,acts:['talk','smoke','phone','idle']});
  L.zone('roof',[[-20,58],[0,66],[20,58],[10,68],[-12,66]],{y:14.5,acts:['inspect','talk','idle']});
  L.exit(-41.8,Y,1,true);L.exit(-112,Y,6.5,true);
  const ENG=(o={})=>({topT:'hivis',top:0x3a4a6a,vestC:0xf07a20,pants:0x2a3448,hat:'hardhat',hatC:0xe8c020,...o});
  L.person({id:'tgt',role:'target',name:'THE CONTRACTOR',at:[-41,Y,1],look:{topT:'suit',top:0x1c2a4a,shirt:0xf2f2f2,pants:0x1c2a4a,hat:'hardhat',hatC:0xf4f4f4,clipboard:true,skin:0xf1c9a5},
   routine:[{to:'cTower',act:'talk',wait:10,face:[-30,Y,1]},{to:'cCrane',act:'inspect',wait:16,face:[24,Y,6]},{to:'cSpill',act:'lean',wait:12,face:[2,Y,12]},{to:'cPark',act:'phone',wait:12,face:[110,Y,4]},{to:'cSpill',act:'clip',wait:6}]});
  L.person({id:'bg',role:'guard',at:[-39,Y,-1],look:GUARD({topT:'parka',top:0x2a2c30,pants:0x1a1a1a,rifle:true,hat:'beanie',hatC:0x1a1a1a}),follow:'tgt',state:'follow'}).state='follow';
  // decoys
  L.person({role:'staff',at:[30,Y,-2],look:ENG({hatC:0xf4f4f4,clipboard:true}),wander:'crest'});
  L.person({role:'staff',at:[-20,Y,2],look:{topT:'suit',top:0x1c2a4a,shirt:0xf2f2f2,pants:0x1c2a4a,hat:'hardhat',hatC:0xe8c020,clipboard:true},wander:'crest'});
  L.person({role:'staff',at:[60,Y,-1],look:{topT:'suit',top:0x1c2a4a,shirt:0xf2f2f2,pants:0x1c2a4a,hat:'hardhat',hatC:0xf4f4f4},wander:'crest',acts:['phone','idle','talk']});
  for(let i=0;i<8;i++){const sp=L.zones.crest.spots[i%7];L.person({role:'staff',at:[sp[0],Y,sp[1]],look:ENG({clipboard:r()<.3,hatC:r()<.15?0xf07a20:0xe8c020}),wander:'crest'});}
  for(let i=0;i<4;i++){const sp=L.zones.roof.spots[i];L.person({role:'staff',at:[sp[0],14.5,sp[1]],look:ENG(),wander:'roof'});}
  for(let i=0;i<3;i++)L.person({role:'staff',at:[100+i*6,Y,8],look:ENG({hatC:0xf4f4f4*0+0xe8c020}),wander:'park'});
  const G2=o=>GUARD({topT:'parka',top:0x2a2c30,pants:0x1a1a1a,rifle:true,hat:'beanie',hatC:0x1a1a1a,glasses:undefined,...o});
  L.person({role:'guard',at:[-88,Y,2],look:G2(),act:'guard',yaw:Math.PI/2,wait:1e9});L.person({role:'guard',at:[86,Y,-2],look:G2(),act:'guard',yaw:-Math.PI/2,wait:1e9});
  L.person({role:'guard',at:[-46,Y+16,-1],look:G2(),act:'guard',yaw:Math.PI,wait:1e9});
  L.person({role:'guard',at:[-60,Y,-2.5],look:G2(),routine:[{to:[-60,Y,-2.5],act:'look',wait:5},{to:[70,Y,-2.5],act:'look',wait:5}]});
  L.person({role:'guard',at:[112,Y,-8],look:G2(),act:'smoke',wait:1e9,yaw:2});
  L.vehicle({id:'suv',type:'suv',color:0x101214,at:[104,Y,9],yaw:Math.PI/2,leave:[[140,null,9],[200,null,8.4],[300,null,20],[600,null,56]],speed:14});
  L.vehicle({type:'pickup',color:0xe8e8e8,at:[116,Y,-9],yaw:-Math.PI/2});L.vehicle({type:'sedan',color:0x6a1a1e,at:[122,Y,-9],yaw:-Math.PI/2});
  L.hazard({id:'load',kind:'load',at:[24,Y+4.2,.4],top:Y+11.6,r:3.4});
  L.obj({id:'relay1',kind:'relay',at:[-51.5,Y+16,2.5]});L.obj({id:'relay2',kind:'relay',at:[-44.5,Y+16,2.5]});},
 escape:{vehicle:'suv',via:['cPark'],board:'suvBoard'},depart:{vehicle:'suv',via:['cPark'],board:'suvBoard'}};

// ================================================================ 3. DESERT CONVOY
const desert={id:'desert',n:'DUST LINE',loc:'CHECKPOINT 9 · SALT FLATS',time:270,depart:70,
 brief:'An arms broker is crossing the flats in a three-car convoy. It will stop at a fuel checkpoint for a meeting, then keep going. Hit him on the move or at the stop — but do it before the convoy leaves the map.',
 targets:[{id:'tgt',code:'THE BROKER',clues:['TAN JACKET','CREAM WIDE-BRIM HAT','SUNGLASSES'],note:'Rides in the middle SUV. A bodyguard never leaves his side.'}],
 sec:[{id:'dis',type:'disable',vehicle:'suv2',n:'NO WAY OUT',d:'Wreck the engine of the middle SUV (two hits, one from the .50) so the convoy cannot leave with him.'},
  {id:'acc',type:'accident',n:'FUEL ACCIDENT',d:'The fuel tanker at the depot goes up with one hit to the tank. Time it.'}],
 wind:{a:Math.PI*.55,base:5,gust:4},
 env:{sky:{top:0x3a74c0,hor:0xe8d6b8,bot:0xc8b090,sunDir:new V(.3,.82,.25),sunCol:0xfff2d8,cloud:.12,sunSize:.0009},fog:{color:0xe0cdb0,density:.0009},
  light:{skyC:0xc8d8f0,gndC:0xa08060,hemi:.85,sunC:0xfff0d8,sunI:3},exposure:.92,bloomThreshold:.95,center:new V(0,0,-6),weather:'dust'},
 H(x,z){const az=Math.abs(z);let h=fbm(x*.004,z*.004)*14+fbm(x*.02,z*.02)*2;const dunes=Math.abs(noise(x*.012+z*.004,z*.01))*10;h+=dunes*smooth(60,200,Math.hypot(x,z));
  h*=smooth(12,40,az)*(Math.hypot(x,z)<70?smooth(40,70,Math.hypot(x,z)):1)+0;
  const mesa=(cx,cz,r,ht)=>{const d=Math.hypot(x-cx,z-cz);return smooth(r+30,r,d)*ht+(d<r+30?fbm(x*.05,z*.05)*4*smooth(r+30,r,d):0);};
  h=Math.max(h,mesa(-190,500,55,44),mesa(-420,380,80,60),mesa(560,-180,60,52),mesa(300,600,90,36),mesa(-700,-300,120,70));return h;},
 tcol(x,z,y,sl,c){const sand=new THREE.Color(0xd8b888),red=new THREE.Color(0xb87a50),pale=new THREE.Color(0xe8d4b0);c.copy(sand).lerp(pale,clamp(fbm(x*.01,z*.01)+.5,0,1)*.6);if(y>10||sl>.4)c.lerp(red,smooth(.3,.8,sl)*.9+smooth(10,40,y)*.3);c.multiplyScalar(.85+noise(x*.4,z*.4)*.18);},
 build(W,L){const r=rng(21);
  // road
  W.box(0,-.25,0,3000,.3,9,'asphalt',{matK:'stone'});for(let x=-1480;x<1500;x+=12)W.box(x,.06,0,5,.01,.18,'yellow',{collide:false,cast:false});
  // checkpoint: booth, barrier, canopy, office, garage, watchtower, depot tanks
  W.box(6,0,7.5,3,2.6,3,{side:'facade:cinder',top:'concreteD'});W.box(0,0,7,.3,1.1,.3,'red',{walk:false});W.box(0,1,2.4,.2,.2,9,'red',{collide:false});
  W.box(-24,0,-30,16,4.2,10,{side:'facade:cinder',top:'concreteD'});rail(W,-32,-35,-16,-35,4.2,.8,'concreteD',{t:.25});rail(W,-32,-25,-16,-25,4.2,.8,'concreteD',{t:.25});rail(W,-32,-35,-32,-25,4.2,.8,'concreteD',{t:.25});rail(W,-16,-35,-16,-25,4.2,.8,'concreteD',{t:.25});
  
  W.box(-30,0,24,14,5,10,{side:'rust',top:'rust'},{matK:'metal'});gableRoof(W,-30,5,24,14.4,10.4,1.4,'rust');
  for(const[x,z]of[[24,-36],[36,-36]])W.cyl(x,0,z,4,4,8,'white',{seg:20,collide:true,walk:true,matK:'metal'});
  W.box(10,0,-20,16,.4,8,'concreteD',{walk:true});W.box(10,5,-20,17,.3,9,'white',{walk:false});for(const x of[3,17])for(const z of[-23.5,-16.5])W.cyl(x,0,z,.15,.15,5,'white',{seg:6});
  for(const x of[6,14])W.box(x,0,-20,.9,1.8,.6,'red',{matK:'metal'});
  const wt=W.groundAt(40,18);for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.box(40+a*1.6,wt,18+b*1.6,.25,7,.25,'wood',{collide:false});W.box(40,wt+7,18,4.4,.3,4.4,'wood',{matK:'wood'});W.collider(40,wt+3.5,18,1.8,3.5,1.8,0,false,'wood');
  rail(W,38,16,42,16,wt+7.3,1,'wood',{t:.1});rail(W,38,20,42,20,wt+7.3,1,'wood',{t:.1});gableRoof(W,40,wt+9.3,18,4.6,4.6,1,'rust');for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.box(40+a*2,wt+7.3,18+b*2,.15,2,.15,'wood',{collide:false});
  for(let i=0;i<14;i++)crate(W,-12+r()*8,0,-40-r()*6,1+r()*.4,r()<.5?'wood':'rust',r());
  for(const[x,z]of[[-40,-10],[-48,-10],[44,-8]])W.box(x,0,z,1.2,1,1.2,'concreteD');
  // fence
  for(const s of[-1,1])rail(W,-50,s*48,50,s*48,0,2.2,'darksteel',{t:.05,matK:'fabric'});rail(W,-50,-48,-50,-6,0,2.2,'darksteel',{t:.05,matK:'fabric'});rail(W,50,-48,50,-6,0,2.2,'darksteel',{t:.05,matK:'fabric'});rail(W,-50,48,-50,6,0,2.2,'darksteel',{t:.05,matK:'fabric'});rail(W,50,48,50,6,0,2.2,'darksteel',{t:.05,matK:'fabric'});
  W.cyl(-40,0,30,.12,.14,14,'steel',{seg:6});W.flag(-40,0,30,{pole:14,color:'#e8e0d0',text:'',w:2,h:1.2});W.flag(6,2.6,7.5,{pole:3,color:'#c02a20',text:'',w:1.2,h:.7});W.flag(-24,4.2,-34,{pole:4,color:'#2a5a9a',text:'',w:1.4,h:.8});
  for(const x of[-200,-350,180,320,520])W.flag(x,0,7,{pole:5,color:'#d86020',text:'',w:1,h:.6});
  W.trees('cactus',scatter(60,22,r=>{const x=(r()-.5)*1400,z=(r()-.5)*1400;return Math.abs(z)>20&&Math.hypot(x,z)>70?[x,null,z,.8+r()*.5]:null;}),{collide:false});
  W.trees('shrub',scatter(240,23,r=>{const x=(r()-.5)*1000,z=(r()-.5)*1000;return Math.abs(z)>8&&Math.hypot(x,z)>45?[x,null,z,.8+r()]:null;}),{collide:false});
  W.rocks(scatter(120,24,r=>{const x=(r()-.5)*1400,z=(r()-.5)*1400;return Math.abs(z)>14&&Math.hypot(x,z)>60?[x,null,z,.8+r()*3]:null;}));
  W.cyl(-36,0,-44,.08,.1,22,'steel',{seg:5});
  // perches
  const mr=W.groundAt(-190,500);W.box(-190,mr-.5,500,4,1.3,3,'rock');const t2=waterTower(W,150,232,16);const rr=W.groundAt(560,-180);W.box(560,rr-.4,-180,4,1.2,3,'rock');
  return{perches:[{n:'MESA RIM',p:new V(-190,mr+.8+1.1,500)},{n:'WATER TOWER',p:new V(150-1.5,t2+1.55,232-2.6)},{n:'RADIO RIDGE',p:new V(560,rr+.8+1.1,-180)}]};},
 cast(L){const r=L.rand;
  L.node('office',-20,0,-21.2);L.node('tanks',20,0,-25);L.node('pump',10,0,-14.6);L.node('stop2',-34,0,-2.8);
  L.zone('depot',[[-10,-12],[4,-26],[16,-12],[-30,-16],[-8,-38],[30,-20],[-36,14],[20,14]],{acts:['talk','smoke','idle','phone','arms']});
  L.exit(-24,0,-24.4,true);L.exit(-30,0,18.8,true);
  const WK=(o={})=>({topT:pick(['tee','shirt'],r),top:pick([0xc0a070,0x6a6a3a,0xe8e0d0,0x8a5a3a],r),pants:pick([0x6a5a40,0x2a2c30],r),hat:pick(['cap','none','wide'],r),hatC:pick([0xe8e0d0,0x6a5a3a],r),...o});
  for(let i=0;i<8;i++){const sp=L.zones.depot.spots[i];L.person({role:'civ',at:[sp[0],null,sp[1]],look:WK(),wander:'depot'});}
  L.person({id:'contact',role:'hostile',at:[-20,0,-23.4],look:{topT:'shirt',top:0xf0f0f0,pants:0xc0a070,hat:'wide',hatC:0xe8dcc0,glasses:'sun',briefcase:'black'},act:'phone',wait:1e9,yaw:0});
  L.person({role:'civ',at:[-14,0,-27],look:{topT:'suit',top:0xc0a070,shirt:0xf0f0f0,pants:0x6a5a40,hat:'wide',hatC:0xe8dcc0},wander:'depot'});
  const G3=o=>({topT:'shirt',top:0x6a6a3a,pants:0x4a4a30,hat:'cap',hatC:0x4a4a30,rifle:true,glasses:'sun',...o});
  L.person({role:'guard',at:[40,7.3,18],look:G3(),act:'guard',yaw:Math.PI,wait:1e9});L.person({role:'guard',at:[3,0,8],look:G3(),act:'guard',yaw:-Math.PI/2,wait:1e9});
  L.person({role:'guard',at:[-24,4.3,-29],look:G3(),act:'guard',yaw:0,wait:1e9});L.person({role:'guard',at:[-40,0,-40],look:G3(),routine:[{to:[-40,0,-40],act:'look',wait:6},{to:[40,0,-42],act:'look',wait:6},{to:[44,0,-10],act:'look',wait:5}]});
  // convoy (three SUVs), stopping at the checkpoint
  const path=[[-760,0,-2.2],[-30,0,-2.2],[900,0,-2.2]];const stopD=[730+12,730,730-12];
  const ids=['suv1','suv2','suv3'];for(let i=0;i<3;i++){L.vehicle({id:ids[i],type:'suv',color:0x0e1012,path,speed:17,startDist:(2-i)*12,stops:{[stopD[i]-(2-i)*0]:1e9},state:'park'});}
  const v=ids.map(i=>L.byId(i));const BG=o=>GUARD({topT:'suit',top:0x161616,...o});
  const tg=L.person({id:'tgt',role:'target',name:'THE BROKER',at:[-700,0,0],look:{topT:'suit',top:0xc0a070,shirt:0xf0f0f0,pants:0x6a5a40,hat:'wide',hatC:0xe8dcc0,glasses:'sun',skin:0xd9a47c},routine:[{to:'office',act:'talk',wait:22,face:[-20,0,-24]},{to:'tanks',act:'inspect',wait:14,face:[16,0,-30]},{to:'pump',act:'phone',wait:16,face:[10,0,-20]},{to:'office',act:'talk',wait:18,face:[-20,0,-24]}]});
  const bg=L.person({id:'bg',role:'guard',at:[-700,0,0],look:BG({rifle:true}),follow:'tgt'});
  v[1].board(L.person({role:'guard',at:[-700,0,0],look:BG()}));v[1].board(bg);v[1].board(tg);
  v[0].board(L.person({role:'guard',at:[-700,0,0],look:BG()}));v[0].board(L.person({role:'guard',at:[-700,0,0],look:BG({rifle:true})}));
  v[2].board(L.person({role:'guard',at:[-700,0,0],look:BG()}));v[2].board(L.person({id:'aide',role:'civ',at:[-700,0,0],look:{topT:'suit',top:0xc0a070,shirt:0xf0f0f0,pants:0x2a2c30,hat:'none',glasses:'sun'}}));
  tg.state='ride';bg.state='ride';
  L.vehicle({id:'tanker',type:'truck',color:0xe8e8e0,at:[12,0,-30.5],yaw:Math.PI/2});L.vehicle({type:'pickup',color:0xb0a080,at:[-38,0,-12],yaw:.2});L.vehicle({type:'pickup',color:0x8a2a20,at:[30,0,10],yaw:2.9});
  L.hazard({id:'tankA',kind:'tank',at:[34,0,-25.5],r:12,ry:0});},
 escape:{vehicle:'suv2',via:[],board:'stop2'},depart:{vehicle:'suv2',via:[],board:'stop2'},
 script(G,L,dt,t){const v=['suv1','suv2','suv3'].map(i=>L.byId(i));
  if(!this._go&&t>3){this._go=1;v.forEach(x=>x.go());}
  if(this._go===1&&v[1].state==='wait'){this._go=2;for(const x of v){x.unload();}const tg=L.byId('tgt'),bg=L.byId('bg');if(tg.alive&&tg.state==='ride'){tg.state='routine';tg.ri=-1;tg.wait=2;}if(bg.alive){bg.state='follow';}
   for(const p of L.people)if(p.role==='guard'&&!p.vehicle&&p.state==='ride'){p.state='idle';p.act='guard';p.wait=1e9;}const ai=L.byId('aide');if(ai&&ai.alive){ai.state='wander';ai.zone=L.zones.depot;ai.home='wander';}
   const n2=L.nodes.stop2;n2.copy(v[1].local(v[1].dims.W/2+.8,0,-.5));n2.y=0;}
  // when the broker boards, the whole convoy leaves
  if(this._go===2){const tg=L.byId('tgt');if(tg.vehicle&&tg.alive){this._go=3;for(const x of v){if(x.disabled)continue;for(const p of L.people)if(p.alive&&!p.vehicle&&p.role==='guard'&&p.pos.distanceTo(x.pos)<12&&x.occ.length<4)x.board(p);x.hold=false;x.stops={};x.state='leave';x.departing=true;}}}},
 reset(){this._go=0;}};
export const MISSIONS_A=[villa,dam,desert];
export {SUIT,GUARD,DRESS,SUITC,pick};
