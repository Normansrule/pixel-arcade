// LONG SHOT — missions 4-6: rain-soaked city rooftops, ski resort, island compound.
import * as THREE from '../vendor/three.module.min.js';
import {fbm,noise,lerp,clamp,smooth,rng} from './world.js';
import {rail,stairs,parasol,lounger,table,hipRoof,gableRoof,building,lamp,crate,waterTower,mast,hut,craneTower,billboard,lighthouse,scatter,M} from './props.js';
import {SUIT,GUARD,DRESS,SUITC,pick} from './missions-a.js';
const V=THREE.Vector3;

// ================================================================ 4. RAIN CITY
const RY=42,HY=46,PITCH=54;
const CITY_PERCH=[new V(-206,0,226),new V(162,0,162),new V(54,0,378)];
const city={id:'city',n:'NEON DOWNPOUR',loc:'HOTEL ORCHID ROOFTOP · PORT HALCYON',time:300,depart:60,
 brief:'Rain, neon and a rooftop party twelve storeys up. The Architect designs bank vaults and sells the blueprints twice. Tonight he meets a buyer\'s courier, then leaves by helicopter. The rain swallows most of the noise.',
 targets:[{id:'tgt',code:'THE ARCHITECT',clues:['GREY TRENCH COAT','RED SCARF','SMOKING','NO UMBRELLA'],note:'Chain-smokes at the railing, never carries an umbrella, hates the bar.'}],
 sec:[{id:'courier',type:'courier',person:'cour',n:'INTERCEPT THE COURIER',d:'Leaves the helipad tower with a black briefcase and crosses the skybridge.'},
  {id:'heli',type:'disable',vehicle:'heli',n:'GROUND THE HELICOPTER',d:'Hit the helicopter\'s engine (behind the rotor mast) until it smokes. Three hits, two with the .50.'}],
 wind:{a:Math.PI*.3,base:5,gust:2.5},noise:.5,
 env:{sky:{top:0x05070e,hor:0x1a2236,bot:0x0a0c12,sunDir:new V(-.3,.55,-.78),sunCol:0x6a7a9a,cloud:.9,night:1,sunSize:.0004,cloudDark:.8},fog:{color:0x1a2030,density:.0024},
  light:{skyC:0x3a4a6a,gndC:0x1a1a22,hemi:.55,sunC:0x8a9ab8,sunI:.55},exposure:1.25,bloomThreshold:.7,bloom:.7,night:1,center:new V(0,RY,0),weather:'rain',shadowR:70},
 H(){return 0;},
 tcol(x,z,y,sl,c){c.setHex(0x26282c);},
 build(W,L){const r=rng(41);const T=new V(0,RY+2,0);
  // street grid + sidewalks
  W.box(0,-.3,0,1600,.3,1600,'asphalt',{collide:false});
  for(let i=-7;i<=7;i++)for(let j=-7;j<=7;j++){const cx=i*PITCH,cz=j*PITCH;W.box(cx,-.05,cz,44,.2,44,'wetconcrete',{walk:true});}
  // buildings: heights clipped so every perch keeps a sightline to the hotel roof
  const SIGN=['NOODLE 24','KARAOKE','PHARMACY','CAFÉ LUNA','LOTUS BAR','RAMEN','MOTEL','ARCADE','JADE TOWER','24 HR','CINEMA','PACHINKO'];const SC=['#ff3a8a','#3af0ff','#ffd040','#7aff5a','#ff6a20','#c07aff'];
  const persp=[[CITY_PERCH[0],88],[CITY_PERCH[1],56],[CITY_PERCH[2],62]];
  for(let i=-7;i<=7;i++)for(let j=-7;j<=7;j++){if(i===0&&j===0||i===1&&j===0)continue;const cx=i*PITCH,cz=j*PITCH,d=Math.hypot(cx,cz);let h=14+r()*(d<250?60:40)+(d>300?r()*40:0);
   for(const[P,py]of persp){const dx=T.x-P.x,dz=T.z-P.z,L2=dx*dx+dz*dz;for(const[ox,oz]of[[0,0],[-18,-18],[18,18],[-18,18],[18,-18]]){const t=((cx+ox-P.x)*dx+(cz+oz-P.z)*dz)/L2;if(t>-.02&&t<1.05){const lat=Math.abs((cx+ox-P.x)*dz-(cz+oz-P.z)*dx)/Math.sqrt(L2);if(lat<34)h=Math.min(h,lerp(py,T.y,clamp(t,0,1))-7);}}}
   if(Math.hypot(cx-CITY_PERCH[0].x,cz-CITY_PERCH[0].z)<30){W.box(cx,-.1,cz,40,.3,40,'concreteD');continue;}
   h=Math.max(8,h);const st=pick(['office','brick','concrete','hotel','office'],r);const sub=r()<.5;
   if(sub){building(W,cx-10,cz,20,38,h,st,{y:0,parapet:1});building(W,cx+10,cz+4,18,30,h*(.6+r()*.5),pick(['brick','concrete','office'],r),{y:0,parapet:1});}else building(W,cx,cz,38,38,h,st,{y:0,parapet:1});
   if(d<330&&r()<.75){const face=pick([[0,19.2,0],[0,-19.2,Math.PI],[19.2,0,Math.PI/2],[-19.2,0,-Math.PI/2]],r);const y=5+r()*Math.min(18,h-8);W.sign(cx+face[0],y,cz+face[1],7,1.8,pick(SIGN,r),{ry:face[2],fg:pick(SC,r),size:80});}}
  // the hotel (target) + the helipad tower + skybridge
  building(W,0,0,40,40,RY,'hotel',{y:0,roof:'wetconcrete'});W.sign(0,RY-4,20.3,16,3.2,'HOTEL ORCHID',{fg:'#ff5ab0',size:96});W.sign(20.3,RY-4,0,14,2.8,'ORCHID',{ry:Math.PI/2,fg:'#ff5ab0',size:96});
  for(const[a,b,c,d]of[[-20,-20,20,-20],[20,-20,20,-3],[20,3,20,20],[20,20,-20,20],[-20,20,-20,-20]])rail(W,a,b,c,d,RY,1.1,'glass',{t:.06,matK:'glass'});
  building(W,PITCH,0,40,40,HY,'office',{y:0,roof:'wetconcrete',parapet:1.1});W.sign(PITCH-20.3,HY-6,0,10,2.4,'HALCYON',{ry:-Math.PI/2,fg:'#3af0ff',size:96});
  stairs(W,20,34,-2,2,RY,HY,'x','wetconcrete',10);for(const s of[-1,1])rail(W,20,s*2.1,34,s*2.1,RY+.3,1.1,'glass',{t:.05,matK:'glass'});
  
  W.cyl(PITCH,HY,0,9,9,.06,'white',{seg:32,collide:false});W.cyl(PITCH,HY+.02,0,7.6,7.6,.06,'wetconcrete',{seg:32,collide:false});W.box(PITCH,HY+.08,0,1,.02,5,'white',{collide:false});W.box(PITCH-2,HY+.08,0,.8,.02,5,'white',{collide:false});W.box(PITCH+2,HY+.08,0,.8,.02,5,'white',{collide:false});W.box(PITCH,HY+.08,0,4.8,.02,.8,'white',{collide:false});
  W.box(PITCH+12,HY,12,6,3.4,6,{side:'concrete',top:'concreteD'});W.box(12,RY,-11,6,3.4,6,{side:'concrete',top:'concreteD'});
  for(let i=0;i<5;i++)W.box(PITCH+14,HY,-14+i*3,2,1.4,2,'steel',{matK:'metal'});
  // roof terrace dressing
  W.box(-12,RY,-14,8,1.1,1,{side:'wood',top:'black'},{matK:'wood'});W.box(-12,RY,-17,9,2.4,.6,'black');W.pointLight(-12,RY+3,-12,0xffb070,30,16);
  const gl=new THREE.MeshStandardMaterial({color:0x9ab0c0,roughness:.05,metalness:.2,transparent:true,opacity:.22,depthWrite:false});const pg=new THREE.Mesh(new THREE.BoxGeometry(16,.08,12),gl);pg.position.set(-10,RY+3.6,-11);W.add(pg);W.collider(-10,RY+3.6,-11,8,.05,6,0,false,'glass');
  for(const[x,z]of[[-18,-17],[-2,-17],[-18,-5],[-2,-5]])W.cyl(x,RY,z,.08,.08,3.6,'darksteel',{seg:6});
  for(const[x,z]of[[-14,-5.5],[-6,-5.5]])W.lightString(new V(x-4,RY+3.4,z),new V(x+4,RY+3.4,z),10,.3,0xffc080);
  for(const[x,z]of[[-6,4],[-14,10],[4,-8],[8,14]]){W.cyl(x,RY,z,.12,.2,2.3,'darksteel',{seg:8});const h=new THREE.Mesh(new THREE.ConeGeometry(.45,.35,10),new THREE.MeshBasicMaterial({color:0xff7a30}));h.position.set(x,RY+2.45,z);W.add(h);}
  for(const[x,z,a]of[[-10,6,0],[-4,12,Math.PI],[-16,14,Math.PI/2]])W.box(x,RY,z,3,.75,1,'vcol',{col:0x3a3040,ry:a});table(W,-8,RY,9,{r:.55,chairs:false,top:'black'});table(W,4,RY,-14,{chair:'darksteel'});table(W,10,RY,-6,{chair:'darksteel'});
  W.pointLight(-6,RY+4,8,0xff9a50,26,18);W.pointLight(10,RY+4,-8,0xffc890,20,16);
  // street lamps + traffic loop
  for(const[x,z]of[[-24,-24],[24,-24],[-24,24],[24,24],[78,-24],[78,24],[-24,78],[24,-78]])lamp(W,x,0,z,{h:6});W.pointLight(0,6,24,0xffd6a0,40,30);W.pointLight(27,6,-24,0xffd6a0,30,26);
  // perches: crane on a construction lot, water tower roof, billboard roof
  const ct=craneTower(W,CITY_PERCH[0].x,CITY_PERCH[0].z,82,-.75);const wb=building(W,162,162,30,30,44,'brick',{y:0,parapet:1});const wt=waterTower(W,160,166,8,{y:wb});
  const bb=building(W,54,378,36,36,40,'concrete',{y:0,parapet:1});const bl=billboard(W,54,bb,370,Math.PI,'DRINK ORBITA',"#ffd040");
  W.flag(-19,RY+1.1,19,{pole:4,color:'#ff3a8a',text:'',w:1.3,h:.8});W.flag(PITCH+19,HY+1.1,-19,{pole:5,color:'#3af0ff',text:'',w:1.4,h:.8});W.flag(162-14,wb,162-14,{pole:4,color:'#ffd040',text:'',w:1.2,h:.7});
  const d0=new V(-CITY_PERCH[0].x,0,-CITY_PERCH[0].z).normalize();
  return{perches:[{n:'CRANE CAB',p:new V(CITY_PERCH[0].x+d0.x*1.4,ct+1.55,CITY_PERCH[0].z+d0.z*1.4)},{n:'WATER TOWER',p:new V(160-2.2,wt+1.55,166-2.6)},{n:'BILLBOARD',p:new V(54,bl+1.55,370-1.2)}]};},
 cast(L){const r=L.rand,Y=RY;
  L.node('tRail',17,Y,-17);L.node('tBar',-12,Y,-11.8);L.node('tLounge',-8,Y,7.4);L.node('tEast',17.5,Y,6);L.node('bridgeL',19,Y,0);L.node('bridgeH',35,HY,0);L.node('hBoard',PITCH-3,HY,2.5);L.node('hDoor',PITCH+12,HY,8.4);
  L.zone('roof',[[-14,-8],[-4,-10],[6,-14],[10,-4],[-6,2],[-12,4],[2,10],[12,14],[-16,16],[-2,16]],{y:Y,acts:['talk','drink','phone','idle','smoke','talk']});
  L.zone('street',[[-21,-21],[0,-21.5],[21,-21],[21.5,0],[21,21],[0,21.5],[-21,21],[-21.5,0],[33,-21],[33,21],[-33,8],[0,33]],{y:.15,acts:['idle','phone','talk'],jit:1.5});
  L.exit(12,Y,-7.6,true);L.exit(PITCH+12,HY,8.6,true);for(const[x,z]of[[-20.4,0],[0,20.4],[20.4,8],[0,-20.4]])L.exit(x,.15,z,true);
  const COAT=(c,o={})=>({topT:'coat',top:c,shirt:0xf0f0f0,pants:0x1a1a1c,...o});
  L.person({id:'tgt',role:'target',name:'THE ARCHITECT',at:[17,Y,-17],look:COAT(0x8a8c90,{scarf:0xc02a24,hs:'short',hair:0x8a8a88,skin:0xf1c9a5}),
   routine:[{to:'tRail',act:'smoke',wait:15,face:[24,Y,-24]},{to:'tEast',act:'phone',wait:10,face:[26,Y,6]},{to:'tLounge',act:'smoke',wait:13,face:[-8,Y,9]},{to:'tBar',act:'talk',wait:8,face:[-12,Y,-14]},{to:[6,Y,-18],act:'smoke',wait:12,face:[6,Y,-24]}]});
  L.person({role:'civ',at:[-6,Y,4],look:COAT(0x8a8c90,{scarf:0xc02a24,umbrella:true}),wander:'roof',acts:['talk','idle','phone']});
  L.person({role:'civ',at:[8,Y,12],look:COAT(0x1a1a1c,{scarf:0xc02a24}),wander:'roof',acts:['smoke','talk','idle']});
  L.person({role:'civ',at:[-14,Y,14],look:COAT(0x8a8c90,{scarf:0x6a1a1e}),wander:'roof',acts:['smoke','talk','idle']});
  L.person({role:'civ',at:[2,Y,-6],look:COAT(0x8a8c90,{hat:'fedora',hatC:0x2a2a2a}),wander:'roof',acts:['smoke','phone','idle']});
  for(let i=0;i<9;i++){const f=r()<.5,sp=L.zones.roof.spots[i];L.person({role:'civ',at:[sp[0],Y,sp[1]],look:f?{topT:'dress',top:pick(DRESS,r),female:true,hs:pick(['long','bun'],r),drink:r()<.5,umbrella:r()<.3,umbrellaC:r()<.5}:{topT:pick(['suit','coat','suit'],r),top:pick(SUITC,r),shirt:0xf2f2f2,tie:r()<.4?0x161616:undefined,drink:r()<.4,umbrella:r()<.25},wander:'roof'});}
  L.person({role:'civ',at:[-9,Y,7.6],look:{topT:'dress',top:0x2a8a7a,female:true,hs:'bun',drink:true},act:'talk',face:[-8,Y,7.4],wait:1e9});
  L.person({role:'staff',at:[-12,Y,-15.2],look:{topT:'vest',top:0x161616,shirt:0xf2f2f2,pants:0x161616,tie:0x161616},routine:[{to:[-14,Y,-15.2],act:'idle',wait:6,face:[-14,Y,-12]},{to:[-10,Y,-15.2],act:'talk',wait:7,face:[-10,Y,-12]}]});
  for(let i=0;i<16;i++){const sp=L.zones.street.spots[i%12];L.person({role:'civ',at:[sp[0],.15,sp[1]],look:{topT:pick(['coat','parka','shirt','suit'],r),top:pick([0x2a2c30,0x1c2a4a,0x6a1a1e,0x8a8c90,0xc0a070],r),pants:0x1a1a1c,umbrella:r()<.75,umbrellaC:r()<.4,hat:r()<.2?'beanie':'none',hatC:0x8a2a20},wander:'street',acts:['idle','phone','talk']});}
  L.person({role:'guard',at:[18.6,Y,1.8],look:GUARD({topT:'coat',top:0x141416}),act:'arms',yaw:Math.PI/2,wait:1e9});
  L.person({role:'guard',at:[12,Y,-7.2],look:GUARD({topT:'coat',top:0x141416}),act:'arms',yaw:0,wait:1e9});
  L.person({role:'guard',at:[-18,Y,-18],look:GUARD({topT:'coat',top:0x141416}),routine:[{to:[-18,Y,-18],act:'look',wait:6},{to:[-18,Y,18],act:'look',wait:6},{to:[16,Y,18],act:'look',wait:6}]});
  L.person({role:'guard',at:[PITCH-6,HY,-6],look:GUARD({topT:'coat',top:0x141416,rifle:true}),act:'guard',yaw:-Math.PI/2,wait:1e9});
  L.person({role:'hostile',at:[PITCH+5,HY,4],look:{topT:'suit',top:0x2a2c30,shirt:0xf0f0f0,pants:0x2a2c30,hat:'cap',hatC:0x161616},act:'smoke',wait:1e9,yaw:Math.PI});
  const c=L.person({id:'cour',role:'courier',name:'COURIER',at:'hDoor',look:COAT(0x1a1a1c,{briefcase:'black',hat:'fedora',hatC:0x1a1a1c,glasses:'sun'}),meet:'tgt',hiddenUntil:45,
   routine:[{to:[PITCH+2,HY,8],act:'idle',wait:0},{to:'bridgeH',act:'idle',wait:0},{to:'bridgeL',act:'idle',wait:0},{to:[14,Y,0],act:'idle',wait:0}],after:[{to:'bridgeL'},{to:'bridgeH'},{to:'hDoor',act:'idle',wait:1e9}]});c.s.loop=false;
  L.vehicle({id:'heli',type:'heli',color:0x161a22,at:[PITCH,HY,0],yaw:-Math.PI/2,leave:[[PITCH,HY+18,0],[200,120,-300],[700,260,-1200]],speed:14,fly:true,engineHP:3});
  for(let i=0;i<4;i++){const loop=[[-27,0,-27],[27,0,-27],[27,0,27],[-27,0,27]];const v=L.vehicle({type:pick(['sedan','suv','sedan'],r),color:pick([0xe8e8e8,0x6a1a1e,0x1c2a4a,0xd8b030,0x161616],r),path:loop.map(p=>[p[0]+(p[0]>0?-2:2),0,p[2]]),loop:true,speed:8+r()*3,startDist:i*54,state:'drive'});}},
 escape:{vehicle:'heli',via:['bridgeL','bridgeH'],board:'hBoard'},depart:{vehicle:'heli',via:['bridgeL','bridgeH'],board:'hBoard'},
 script(G,L,dt,t){const c=L.byId('cour');if(c.hidden&&t>c.s.hiddenUntil){c.hidden=false;c.rig.root.visible=true;c.state='routine';c.ri=-1;c.wait=0;}
  const h=L.byId('heli');if(!this._sp&&G.clock<G.M.depart+20){this._sp=1;h.spin=true;}},
 reset(){this._sp=0;}};

// ================================================================ 5. SKI RESORT
const SKI_RUN=[[-28,null,-292],[-50,null,-250],[-18,null,-212],[-55,null,-176],[-22,null,-140],[-48,null,-104],[-14,null,-70],[-30,null,-36],[-6,null,-6],[-10,null,10]];
const LIFT_X=30,LIFT_B=22,LIFT_T=-300;
const skiH=(x,z)=>{let h=z<15?(15-z)*.43:0;h+=smooth(100,220,Math.abs(x))*(60+fbm(x*.01,z*.01)*30)*(z<120?1:smooth(260,120,z));h+=fbm(x*.012+3,z*.012)*7*smooth(10,-30,z)*smooth(30,80,Math.abs(x+20));
 h+=Math.max(0,z-160)*.3;if(z>12&&z<90&&Math.abs(x+4)<70)h=lerp(h,0,smooth(70,40,Math.abs(x+4))*smooth(12,26,z));return h;};
const ski={id:'ski',n:'WHITE LINE',loc:'ALTA BRUMA SKI RESORT · HIGH PASS',time:300,depart:45,
 brief:'A disgraced pharmaceutical magnate is hiding in plain sight at a ski resort, skiing the black run every few minutes with his bodyguards watching from the lodge. He is fast on the slope and exposed on the lift.',
 targets:[{id:'tgt',code:'THE MAGNATE',clues:['RED SKI SUIT','WHITE SKI HELMET','GOLD GOGGLES'],note:'Rides the chairlift, skis the black run, then warms up with a drink on the lodge deck.'}],
 sec:[{id:'acc',type:'accident',n:'AVALANCHE CONTROL',d:'The red charge box at the top of the black run sets off a slide. Trigger it while he is skiing the steep section — or use the propane by the deck.'},
  {id:'lift',type:'destroy',objs:['motor'],n:'STOP THE LIFT',d:'Shoot the blue lift motor at the bottom station twice. Anyone on a chair is stuck.'}],
 wind:{a:Math.PI*.15,base:3.5,gust:2.5},
 env:{sky:{top:0x2a5aa8,hor:0xc8dcf0,bot:0xe8eef4,sunDir:new V(.55,.42,.72),sunCol:0xfff4e0,cloud:.25,sunSize:.001},fog:{color:0xd0dcea,density:.0011},
  light:{skyC:0xc8d8f0,gndC:0xa8b0c0,hemi:.8,sunC:0xfff4e0,sunI:2.2},exposure:.78,bloomThreshold:1,center:new V(-10,62,-120),weather:'snow',shadowR:160},
 H:skiH,
 tcol(x,z,y,sl,c){c.setHex(0xf4f8fc);c.lerp(new THREE.Color(0x6a6a70),smooth(.6,.95,sl));c.multiplyScalar(.9+noise(x*.1,z*.1)*.08);},
 build(W,L){const r=rng(51);
  // lodge + deck
  W.box(-8,-.5,42,32,7.5,16,{side:'facade:hotel',top:'snow'});gableRoof(W,-8,7,42,33,17,5,'snow');W.box(-8,7,34,33,.3,.6,'wood',{walk:false});
  W.box(-8,-.5,26,36,3,16,{side:'wood',top:'wood'},{matK:'wood'});stairs(W,18,13.6,-12,-4,2.5,0,'z','wood');for(const[a,b,c,d]of[[-26,18,-12,18],[-4,18,10,18],[-26,18,-26,34],[10,18,10,34]])rail(W,a,b,c,d,2.5,1,'wood',{t:.1,posts:1.5});
  for(const[x,z]of[[-20,22],[-14,28],[-4,22],[4,28],[-20,30]])table(W,x,2.5,z,{r:.5,chair:'wood',top:'wood',n:4});for(const[x,z]of[[-16,24],[0,25],[6,22]]){W.cyl(x,2.5,z,.1,.18,2.2,'darksteel',{seg:8});const h=new THREE.Mesh(new THREE.ConeGeometry(.4,.3,10),new THREE.MeshBasicMaterial({color:0xff8a40}));h.position.set(x,4.8,z);W.add(h);}
  W.sign(-8,9.5,33.3,12,2.2,'ALTA BRUMA',{fg:'#ffffff',bg:'#7a2a1a',size:90,lit:false});
  // chairlift: stations, towers, cables
  W.box(LIFT_X,0,LIFT_B+2,8,.3,8,'concreteD');W.box(LIFT_X,4.5,LIFT_B+1,9,.3,9,'red',{walk:false});for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.cyl(LIFT_X+a*4,0,LIFT_B+1+b*4,.15,.15,4.6,'darksteel',{seg:6});
  const yT=W.H(LIFT_X,LIFT_T);W.box(LIFT_X,yT-.2,LIFT_T-2,8,.4,8,'concreteD');W.box(LIFT_X,yT+4.5,LIFT_T-1,9,.3,9,'red',{walk:false});for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.cyl(LIFT_X+a*4,yT,LIFT_T-1+b*4,.15,.15,4.6,'darksteel',{seg:6});
  W.box(LIFT_X+7,yT-.3,LIFT_T+2,5,3,4,{side:'wood',top:'snow'},{matK:'wood'});
  const tz=[LIFT_B,-40,-105,-170,-235,LIFT_T];const cab=z=>z===LIFT_B||z===LIFT_T?W.H(LIFT_X,z)+3.4:W.H(LIFT_X,z)+10;
  for(const z of tz.slice(1,-1)){const y=W.H(LIFT_X,z)-.5;W.cyl(LIFT_X,y,z,.35,.45,cab(z)-y+.3,'steel',{seg:8,collide:true,walk:false});W.box(LIFT_X,cab(z)+.2,z,4.2,.4,.5,'steel',{walk:false});}
  for(const sx of[-1,1]){const pts=tz.map(z=>new V(LIFT_X+sx,cab(z)+.25,z));const g=new THREE.BufferGeometry().setFromPoints(pts);W.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0x222222})));}
  W.flag(LIFT_X+4,yT+4.8,LIFT_T+2,{pole:4,color:'#c02a20',text:'',w:1.4,h:.8});W.flag(LIFT_X-4,4.8,LIFT_B+5,{pole:4,color:'#2a5a9a',text:'',w:1.4,h:.8});W.flag(-24,2.5,18,{pole:5,color:'#d8a020',text:'',w:1.4,h:.8});
  // run markers + mid-run flags
  for(let i=0;i<SKI_RUN.length-1;i++){const[a,,b]=SKI_RUN[i];for(const s of[-1,1]){const x=a+s*9,z=b;W.cyl(x,W.H(x,z)-.2,z,.04,.04,1.8,'black',{seg:4});}if(i%2===0)W.flag(a+11,W.H(a+11,b),b,{pole:3,color:'#161616',text:'◆',w:.9,h:.6});}
  // forest
  const pines=scatter(700,53,r=>{const x=(r()-.5)*900,z=-520+r()*820;if(Math.abs(x-LIFT_X)<8||z>8&&z<70&&Math.abs(x+4)<45||x>-75&&x<20&&z<20&&z>-300)return null;const h=W.H(x,z),e=3,sl=Math.hypot(W.H(x+e,z)-W.H(x-e,z),W.H(x,z+e)-W.H(x,z-e))/(2*e);if(sl>.85)return null;return[x,null,z,.7+r()*.6];});
  W.trees('snowpine',pines,{collide:false});W.rocks(scatter(40,54,r=>{const x=(r()-.5)*600,z=-400+r()*500;return Math.abs(x+20)>60?[x,null,z,1+r()*3]:null;}),'rock');
  // distant chalets
  for(let i=0;i<8;i++){const x=60+r()*120,z=60+r()*120;const y=W.H(x,z);W.box(x,y-.5,z,8,5,7,{side:'wood',top:'snow'},{ry:r()*3,matK:'wood'});}
  // perches
  const m=mast(W,-250,40,14);const hu=hut(W,212,150,-.9,{mat:'wood',roof:'snow'});const sh=hut(W,110,-330,.6,{mat:'wood',roof:'snow'});
  return{perches:[{n:'RADIO MAST',p:new V(-250,m+1.55,40)},{n:'CABIN ROOF',p:new V(212,hu+1.0+1.55,150)},{n:'SUMMIT HUT',p:new V(110,sh+1.0+1.55,-330)}]};},
 cast(L){const r=L.rand;
  L.node('liftQ',LIFT_X-1,0,LIFT_B+3.5);L.node('top',LIFT_X-1,W0(L,LIFT_X-1,LIFT_T-4.5),LIFT_T-4.5);L.node('deck',-20,2.5,21.5);L.node('deckStair',-8,0,13.5);L.node('snowmo',14,0,30);
  L.zone('deck',[[-22,24],[-12,22],[-2,24],[6,26],[-18,30],[2,31]],{y:2.5,acts:['drink','talk','sit','idle','phone']});L.zone('base',[[0,4],[16,8],[-20,6],[24,14],[-30,12]],{acts:['idle','talk','phone']});
  L.exit(-8,2.5,33.6,true);L.exit(-20,2.5,33.6,true);
  const SK=(top,helm,gog,o={})=>({topT:'ski',top,pants:top,hat:'skihelm',hatC:helm,glasses:'goggles',goggleC:gog,gloves:0x161616,boots:0x2a2c30,skis:true,stripe:0xf0f0f0,...o});
  const run=SKI_RUN.map(p=>L.pt(p));L.run=run;
  const sk=[{id:'tgt',role:'target',name:'THE MAGNATE',look:SK(0xc02a24,0xf4f4f4,0xd8b040,{skin:0xf1c9a5})},{role:'civ',look:SK(0xc02a24,0x161616,0xd8b040)},{role:'civ',look:SK(0x2a5ab0,0xf4f4f4,0xd8b040)},{role:'civ',look:SK(0xc02a24,0xf4f4f4,0xc0c4c8)},
   {role:'civ',look:SK(0x2e7a3a,0xf4f4f4,0x3a6ab0)},{role:'civ',look:SK(0xe8c020,0x161616,0xd8b040)},{role:'civ',look:SK(0xf0f0f0,0xc02a24,0xd8b040)},{role:'civ',look:SK(0x161616,0xf4f4f4,0xc0c4c8)},{role:'civ',look:SK(0xc02a24,0x2a5ab0,0xd8b040)}];
  sk.forEach((s,i)=>{const p=L.person({...s,at:i===0?'liftQ':i<4?[LIFT_X-1+(r()-.5)*4,null,LIFT_B+5+i*1.2]:[LIFT_X-3-(i-4)*2.5,null,LIFT_T-6]});p.state='script';p.cyc=i===0?'queue':i<4?'toQueue':'ski0';p.skiSpd=9+r()*3;p.s.skier=true;p.delay=i*9;});
  for(let i=0;i<10;i++){const sp=L.zones.deck.spots[i%6];const f=r()<.5;L.person({role:'civ',at:[sp[0]+(r()-.5)*2,2.5,sp[1]],look:{topT:pick(['parka','parka','ski'],r),top:pick([0x2a5ab0,0xc02a24,0xf0f0f0,0x2e7a3a,0xe8c020,0x161616],r),pants:pick([0x161616,0x2a2c30,0x1c2a4a],r),hat:pick(['beanie','none','beanie'],r),hatC:pick([0xc02a24,0xf0f0f0,0x2a5ab0],r),glasses:r()<.5?'sun':undefined,female:f,hs:f?'long':'short',drink:r()<.5},wander:'deck'});}
  for(let i=0;i<4;i++){const sp=L.zones.base.spots[i];L.person({role:'civ',at:[sp[0],null,sp[1]],look:{topT:'parka',top:pick([0x2a5ab0,0xe8c020,0x6a1a1e],r),pants:0x161616,hat:'beanie',hatC:0xf0f0f0},wander:'base'});}
  L.person({role:'staff',at:[LIFT_X+3,0,LIFT_B+1],look:{topT:'parka',top:0xc02a24,vest:true,vestC:0xe8c020,pants:0x161616,hat:'beanie',hatC:0x161616},act:'idle',wait:1e9,yaw:-Math.PI/2});
  const BGd=o=>({topT:'parka',top:0x161616,pants:0x161616,hat:'beanie',hatC:0x161616,glasses:'sun',rifle:true,...o});
  L.person({role:'guard',at:[-14,2.5,32.4],look:BGd(),act:'guard',yaw:Math.PI,wait:1e9});L.person({role:'guard',at:[18,0,26],look:BGd(),act:'guard',yaw:Math.PI,wait:1e9});
  L.person({role:'guard',at:[LIFT_X+5,null,LIFT_T+5],look:BGd(),act:'guard',yaw:Math.PI,wait:1e9});L.person({role:'guard',at:[0,null,0],look:BGd(),routine:[{to:[-30,null,4],act:'look',wait:6},{to:[24,null,8],act:'look',wait:6}]});
  // lift chairs
  const up=[LIFT_B,-40,-105,-170,-235,LIFT_T].map(z=>[LIFT_X-1,(z===LIFT_B||z===LIFT_T?L.world.H(LIFT_X,z)+3.4:L.world.H(LIFT_X,z)+10)-2.35,z]);const loop=[...up,...up.slice().reverse().map(p=>[LIFT_X+1,p[1],p[2]])];
  L.chairs=[];for(let i=0;i<16;i++){const v=L.vehicle({type:'chair',path:loop,loop:true,speed:3.6,startDist:i*0,state:'drive',yaw:Math.PI});L.chairs.push(v);}
  const tot=L.chairs[0].total;L.chairs.forEach((v,i)=>{v.dist=i*tot/16;v.placeAt(v.dist);v.upLen=L.chairs[0].segs.slice(0,5).reduce((a,s)=>a+s.l,0);});
  L.obj({id:'motor',kind:'motor',at:[LIFT_X+4.5,0,LIFT_B+5],size:[1.4,1.1,1],hp:2});
  L.vehicle({id:'snowmo',type:'snowmobile',color:0xc02a24,at:[16,0,30],yaw:Math.PI/2,leave:[[40,null,34],[120,null,60],[300,null,120],[700,null,180]],speed:13});
  L.hazard({id:'charge',kind:'charge',at:[-62,null,-214],r:3});L.hazard({id:'gas',kind:'gas',at:[-24.6,2.5,19.2],r:5});},
 avalanche:{x0:-80,x1:12,z0:-200,z1:-96},
 escape:{vehicle:'snowmo',via:['deckStair'],board:'snowmo'},depart:{vehicle:'snowmo',via:[],board:'snowmo'},
 script(G,L,dt,t){const lift=L.chairs,motor=L.byId('motor');if(!motor.alive&&!this._stop){this._stop=1;for(const c of lift){c.state='park';c.spd=0;}}
  const near=(c,d)=>{const x=((c.dist%c.total)+c.total)%c.total;return Math.abs(x-d)<.9||Math.abs(x-d-c.total)<.9;};
  for(const p of L.people){if(!p.s.skier||!p.alive||p.gone)continue;if(p.state!=='script'){continue;}if(p.isTarget&&G.alarm&&!p.vehicle){L.flee(p);continue;}if(p.delay>0){p.delay-=dt;continue;}
   switch(p.cyc){
    case'toQueue':if(!p.path.length){if(p.pos.distanceTo(L.nodes.liftQ)<1.2){p.cyc='queue';p.act='idle';}else p.goTo('liftQ');}break;
    case'queue':if(this._stop)break;for(const c of lift){if(!c.occ.length&&near(c,0)){c.board(p);p.state='script';p.cyc='lift';break;}}break;
    case'lift':if(near(p.vehicle,p.vehicle.upLen)){const c=p.vehicle;c.occ=c.occ.filter(x=>x!==p);p.vehicle=null;p.pos.copy(L.nodes.top);p.prevPos.copy(p.pos);p.rig.root.rotation.z=0;p.cyc='ski0';}break;
    case'ski0':{p.ski=true;const o=(L.rand()-.5)*5;p.setPath(L.run.map(q=>q.clone().add(new V(o,0,0))));p.cyc='ski';break;}
    case'ski':if(!p.path.length){p.ski=false;if(p.isTarget&&G.clock<=G.M.depart){L.depart(p);break;}p.cyc=p.isTarget?'deck':'toQueue';if(p.isTarget)p.goTo('deck',['deckStair']);}break;
    case'deck':if(!p.path.length){p.act='drink';p.faceP=new V(-20,2.5,25);p.wait2=(p.wait2??22)-dt;if(p.wait2<=0){p.wait2=22;p.cyc='toQueue';p.goTo('liftQ',['deckStair']);}}break;}
   if(p.isTarget&&G.clock<=G.M.depart&&!p.vehicle&&(p.cyc==='toQueue'||p.cyc==='queue'||p.cyc==='deck')){L.depart(p);}}},
 reset(){this._stop=0;}};
function W0(L,x,z){return L.world.H(x,z);}

// ================================================================ 6. ISLAND COMPOUND
const IY=8;
const islH=(x,z)=>{const r=Math.hypot(x,z),th=Math.atan2(z,x);const Rc=340-175*smooth(.55,0,Math.abs(th))+noise(th*3,1.7)*40;
 const hills=48*Math.exp(-((x+205)**2+(z-125)**2)/(2*95*95))+30*Math.exp(-((x-30)**2+(z+300)**2)/(2*60*60))+fbm(x*.01,z*.01)*10;const pm=smooth(75,58,Math.max(Math.abs(x),Math.abs(z)));
 let land=IY-6.5*smooth(Rc-110,Rc-40,r)+(hills*(1-pm))*smooth(Rc-15,Rc-70,r);let h=lerp(land,-12,smooth(Rc-40,Rc+30,r));
 const st=Math.exp(-((x-320)**2+(z-205)**2)/(2*16*16));h=Math.max(h,lerp(-12,26,st)+fbm(x*.08,z*.08)*5*st);return h;};
const island={id:'island',n:'CORAL FORTRESS',loc:'ISLA MERIDA · OUTER REEF',time:360,depart:60,
 brief:'A private island compound run like a navy base. Two men keep it running: the Admiral who commands it and the Quartermaster who arms it. Both leave by speedboat at sundown. Two watchtowers carry marksmen who will spot you first.',
 targets:[{id:'tgt',code:'THE ADMIRAL',clues:['WHITE UNIFORM','WHITE PEAKED CAP','MEDALS'],note:'Inspects the watchtowers, takes calls on the helipad, rests on the villa veranda.'},
  {id:'tgt2',code:'THE QUARTERMASTER',clues:['OLIVE UNIFORM','RED BERET','CLIPBOARD'],note:'Counts crates between the barracks, the fuel depot and the gate.'}],
 sec:[{id:'tw',type:'kill',ids:['ts1','ts2'],n:'TOWER WATCH',d:'Eliminate both watchtower marksmen. While they live, the alarm rises faster.'},
  {id:'acc',type:'accident',n:'FUEL DEPOT',d:'Detonate the fuel depot behind the barracks while a target is close.'}],
 wind:{a:Math.PI*.85,base:5.5,gust:2.5},
 env:{sky:{top:0x2a5aa0,hor:0xf8c890,bot:0x6a8aa0,sunDir:new V(.62,.24,.75),sunCol:0xffc888,cloud:.3,sunSize:.0011},fog:{color:0xe8c8a8,density:.001},
  light:{skyC:0xa8c8e8,gndC:0x6a5a3a,hemi:.8,sunC:0xffd8a8,sunI:2.6},exposure:.95,bloomThreshold:.92,water:true,waterC:{deep:0x0a3a5a,shallow:0x3ac8c0},center:new V(0,IY,0),shadowR:90},
 H:islH,
 tcol(x,z,y,sl,c){if(y<2.6)c.setHex(0xe8dcb8);else{c.setHex(0x4a7a2a);c.lerp(new THREE.Color(0x7a8a3a),clamp(fbm(x*.02,z*.02)+.5,0,1)*.6);}if(sl>.5)c.lerp(new THREE.Color(0x7a6a5a),smooth(.5,.9,sl));if(Math.max(Math.abs(x),Math.abs(z))<54&&y>7)c.setHex(0xb8a888);c.multiplyScalar(.85+noise(x*.3,z*.3)*.18);},
 build(W,L){const r=rng(61);
  W.box(0,IY-.3,0,104,.35,104,{side:'concreteD',top:'paving'});
  // perimeter wall with gate on the east side
  for(const[a,b,c,d]of[[-50,-50,50,-50],[50,-50,50,-5],[50,5,50,50],[50,50,-50,50],[-50,50,-50,-50]])rail(W,a,b,c,d,IY,3.4,'concrete',{t:.6});
  for(const s of[-1,1])W.box(50,IY,s*6,1.2,4.4,2,'concreteD');
  // watchtowers
  for(const[x,z]of[[50,-50],[-50,50],[50,50],[-50,-50]]){for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.box(x+a*1.8,IY,z+b*1.8,.3,8,.3,'darksteel',{collide:false});W.collider(x,IY+4,z,2,4,2,0,false,'metal');
   W.box(x,IY+8,z,5,.3,5,'wood',{matK:'wood'});for(const[a,b,c,d]of[[-2.5,-2.5,2.5,-2.5],[2.5,-2.5,2.5,2.5],[2.5,2.5,-2.5,2.5],[-2.5,2.5,-2.5,-2.5]])rail(W,x+a,z+b,x+c,z+d,IY+8.3,1,'darksteel',{t:.08});
   for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])W.box(x+a*2.3,IY+8.3,z+b*2.3,.12,2.2,.12,'darksteel',{collide:false});W.box(x,IY+10.5,z,5.6,.2,5.6,'rust',{walk:false});}
  // main villa
  W.box(-18,IY,-16,26,4.4,16,{side:'facade:stucco',top:'paving'});W.box(-20,IY+4.4,-18,18,3.6,12,{side:'facade:office',top:'paving'});for(const[a,b,c,d]of[[-29,-24,-11,-24],[-11,-24,-11,-12],[-11,-12,-29,-12]])rail(W,a,b,c,d,IY+8,1,'glass',{t:.05,matK:'glass'});
  W.box(-18,IY+4.4,-6.4,26,.25,3.2,'white',{walk:false});for(const x of[-30,-22,-14,-6])W.cyl(x,IY,-5,.15,.15,4.4,'white',{seg:8});W.box(-18,IY,-6,26,.25,4,'wood',{collide:false});
  for(const x of[-24,-18,-12])lounger(W,x,IY,-5.8,0,0xf0e8d8);table(W,-21,IY,-4,{chairs:false});
  // helipad, barracks, depot, generator, crates, radio mast
  W.cyl(24,IY,-26,8,8,.12,'concreteD',{seg:28,collide:false});W.box(24,IY+.13,-26,1,.02,6,'yellow',{collide:false});W.box(22,IY+.13,-26,.8,.02,6,'yellow',{collide:false});W.box(26,IY+.13,-26,.8,.02,6,'yellow',{collide:false});W.box(24,IY+.13,-26,4.8,.02,.8,'yellow',{collide:false});
  W.box(18,IY,26,22,3.6,9,{side:'facade:cinder',top:'rust'});gableRoof(W,18,IY+3.6,26,22.4,9.4,1.2,'rust');
  for(let i=0;i<10;i++)crate(W,-30+r()*14,IY,24+r()*16,1.1+r()*.4,r()<.5?'wood':'green',r()*.4);
  W.cyl(-40,IY,36,.1,.12,20,'steel',{seg:5});
  // road to the jetty + jetty
  for(let x=52;x<122;x+=4){const y=W.H(x,0);W.box(x,y-.25,0,4.2,.32,6,'asphalt',{collide:false});}
  W.box(167,1.2,0,94,.4,3.2,'wood',{matK:'wood'});for(let x=122;x<=214;x+=4)for(const s of[-1,1])W.cyl(x,-5,s*1.5,.14,.16,6.5,'wood',{seg:6,collide:false});rail(W,124,-1.6,214,-1.6,1.6,.8,'wood',{t:.08,posts:4});
  W.box(126,W.H(126,-12)-.3,-12,6,3.2,5,{side:'wood',top:'rust'},{matK:'wood'});
  // flags
  W.flag(-40,IY,-40,{pole:12,color:'#f0f0f0',text:'⚓',w:2,h:1.2});W.flag(212,1.6,1.3,{pole:5,color:'#c02a20',text:'',w:1.2,h:.7});W.flag(24,IY,-35,{pole:6,color:'#d8a020',text:'',w:1.4,h:.8});W.flag(50,IY+10.7,-50,{pole:3,color:'#2a5a9a',text:'',w:1.2,h:.7});
  // vegetation
  const clr=(x,z)=>[[320,205],[-200,120],[30,-300]].every(([px,pz])=>{const dx=-px,dz=-pz,L2=dx*dx+dz*dz,t=((x-px)*dx+(z-pz)*dz)/L2;if(t<0||t>1)return Math.hypot(x-px,z-pz)>8;return Math.abs((x-px)*dz-(z-pz)*dx)/Math.sqrt(L2)>22;});
  const palms=scatter(260,63,r=>{const a=r()*6.283,d=60+r()*300;const x=Math.cos(a)*d,z=Math.sin(a)*d;const h=W.H(x,z);if(h<1.6||!clr(x,z)||Math.abs(z)<8&&x>40&&x<220||Math.max(Math.abs(x),Math.abs(z))<62)return null;return[x,null,z,.8+r()*.5];});
  W.trees('palm',palms.concat([[-44,IY,-44],[44,IY,-30],[-44,IY,20],[-6,IY,40],[40,IY,40]]),{collide:false});
  W.trees('broad',scatter(200,64,r=>{const x=-380+r()*360,z=-120+r()*400;const h=W.H(x,z);return h>9&&clr(x,z)&&Math.max(Math.abs(x),Math.abs(z))>70?[x,null,z,.9+r()*.6]:null;}),{collide:false});
  W.trees('bush',scatter(120,65,r=>{const x=(r()-.5)*600,z=(r()-.5)*600;const h=W.H(x,z);return h>2&&Math.max(Math.abs(x),Math.abs(z))>56?[x,null,z]:null;}),{collide:false});
  W.rocks(scatter(70,66,r=>{const a=r()*6.283,d=150+r()*220;const x=Math.cos(a)*d,z=Math.sin(a)*d;const h=W.H(x,z);return h>-3&&h<3?[x,null,z,1+r()*2.5]:null;}).concat([[320,null,205,7],[312,null,195,4]]));
  // perches
  const ss=W.H(320,205);W.box(320,ss-.6,205,4,1.4,3,'rock');const jr=W.H(-200,120);W.box(-200,jr-.6,120,4,1.4,3,'rock');
  const ru=W.H(30,-300);for(let i=0;i<6;i++){const a=i/6*6.283;W.box(30+Math.cos(a)*2.6,ru-.5,-300+Math.sin(a)*2.6,1.6,i===2?3:4+r()*2.6,1.6,'stucco',{ry:a});}W.box(30,ru+6.2,-300,6,.3,6,'stucco');
  return{perches:[{n:'SEA STACK',p:new V(320,ss+.8+1.1,205)},{n:'JUNGLE RIDGE',p:new V(-200,jr+.8+1.1,120)},{n:'LIGHTHOUSE RUIN',p:new V(30,ru+6.5+1.55,-300)}]};},
 cast(L){const r=L.rand,Y=IY;
  L.node('veranda',-18,Y,-3.6);L.node('twNE',45.5,Y,-45.5);L.node('heli',24,Y,-21);L.node('twSW',-45.5,Y,45.5);L.node('gate',44,Y,0);L.node('barr',18,Y,20.6);L.node('depot',33,Y,32);L.node('gateO',56,null,0);L.node('jetty',124,null,0);L.node('jEnd',202,1.6,-1.2);
  L.zone('yard',[[-30,6],[-10,10],[6,4],[30,-6],[0,-30],[-36,-34],[34,10],[-20,30],[10,40]],{y:Y,acts:['idle','talk','smoke','arms']});
  L.exit(-18,Y,-8.2,true);L.exit(10,Y,21.4,true);L.exit(126,null,-9.4,true);
  const SOL=(o={})=>({topT:'uniform',top:0x6a6a3a,shirt:0x6a6a3a,pants:0x4a4a30,hat:'beret',hatC:0x161616,rifle:true,boots:0x2a2018,...o});
  L.person({id:'tgt',role:'target',name:'THE ADMIRAL',at:'veranda',look:{topT:'uniform',top:0xf0f0f0,shirt:0xf0f0f0,pants:0xf0f0f0,hat:'peaked',hatC:0xf4f4f4,medals:true,skin:0xd9a47c,hs:'short',hair:0x8a8a88},
   routine:[{to:'veranda',act:'sit',wait:18,face:[-18,Y,4]},{to:'twNE',act:'talk',wait:8,face:[50,Y,-50]},{to:'heli',act:'phone',wait:12,face:[24,Y,-30]},{to:'twSW',act:'talk',wait:8,face:[-50,Y,50]},{to:'gate',act:'look',wait:9,face:[60,Y,0]}]});
  L.person({id:'tgt2',role:'target',name:'THE QUARTERMASTER',at:'barr',look:{topT:'uniform',top:0x6a6a3a,shirt:0x6a6a3a,pants:0x4a4a30,hat:'beret',hatC:0xc02a24,clipboard:true,boots:0x2a2018},
   routine:[{to:'barr',act:'clip',wait:12,face:[18,Y,26]},{to:'depot',act:'inspect',wait:14,face:[38,Y,34]},{to:'gate',act:'clip',wait:10,face:[50,Y,0]},{to:[-4,Y,-2],act:'talk',wait:10,face:[-4,Y,-6]}]});
  L.person({role:'hostile',at:[-30,Y,-2],look:{topT:'uniform',top:0xf0f0f0,shirt:0xf0f0f0,pants:0xf0f0f0,hat:'peaked',hatC:0xf4f4f4},wander:'yard',acts:['talk','phone','idle']});
  L.person({role:'hostile',at:[10,Y,-10],look:{topT:'uniform',top:0x1c2a4a,shirt:0xf0f0f0,pants:0x1c2a4a,hat:'peaked',hatC:0xf4f4f4,medals:true},wander:'yard',acts:['talk','idle','arms']});
  L.person({role:'guard',at:[0,Y,30],look:SOL({hatC:0xc02a24,rifle:false,clipboard:false}),wander:'yard'});L.person({role:'guard',at:[-24,Y,30],look:SOL({clipboard:true,rifle:false}),wander:'yard'});
  L.person({id:'ts1',role:'guard',at:[50,Y+8.3,-50],look:SOL({hat:'cap',hatC:0x4a4a30,glasses:'sun'}),act:'guard',yaw:-Math.PI*.75,wait:1e9,spotter:true});
  L.person({id:'ts2',role:'guard',at:[-50,Y+8.3,50],look:SOL({hat:'cap',hatC:0x4a4a30,glasses:'sun'}),act:'guard',yaw:Math.PI*.25,wait:1e9,spotter:true});
  L.person({role:'guard',at:[50,Y+8.3,50],look:SOL(),act:'guard',yaw:Math.PI*.75,wait:1e9});L.person({role:'guard',at:[-50,Y+8.3,-50],look:SOL(),act:'guard',yaw:-Math.PI*.25,wait:1e9});
  for(const[x,z]of[[47,-7],[47,7]])L.person({role:'guard',at:[x,Y,z],look:SOL(),act:'guard',yaw:-Math.PI/2,wait:1e9});
  L.person({role:'guard',at:[-40,Y,-46],look:SOL(),routine:[{to:[-46,Y,-46],act:'look',wait:4},{to:[44,Y,-46],act:'look',wait:4},{to:[44,Y,44],act:'look',wait:4},{to:[-46,Y,44],act:'look',wait:4}]});
  L.person({role:'guard',at:[0,Y,0],look:SOL(),wander:'yard',acts:['guard','smoke','talk']});
  for(const x of[140,190])L.person({role:'guard',at:[x,1.6,.6],look:SOL({hat:'cap',hatC:0x4a4a30}),act:'guard',yaw:Math.PI/2,wait:1e9});
  for(let i=0;i<5;i++){const sp=L.zones.yard.spots[i];L.person({role:'staff',at:[sp[0],Y,sp[1]],look:{topT:'shirt',top:0xf0f0f0,pants:0xe8dcc0,hat:r()<.4?'cap':'none',hatC:0xe8dcc0},wander:'yard'});}
  L.vehicle({id:'boat',type:'speedboat',color:0x1c2a4a,at:[202,null,-4.6],yaw:Math.PI/2,leave:[[260,null,-30],[420,null,-140],[900,null,-500]],speed:14});
  for(let k=0;k<2;k++){const pts=[];for(let i=0;i<16;i++){const a=i/16*6.283+k*Math.PI;pts.push([Math.cos(a)*(455+k*35),null,Math.sin(a)*(455+k*35)]);}const v=L.vehicle({type:'speedboat',color:0x3a3a30,path:pts,loop:true,speed:9,state:'drive'});v.board(L.person({role:'guard',at:[0,0,0],look:SOL({rifle:false})}));v.board(L.person({role:'guard',at:[0,0,0],look:SOL()}));}
  L.vehicle({type:'pickup',color:0x6a6a3a,at:[36,Y,-6],yaw:Math.PI/2});
  L.hazard({id:'depot',kind:'barrels',at:[38,Y,36],r:10});L.hazard({id:'tank',kind:'tank',at:[40,Y,22],r:12,ry:Math.PI/2});
  L.hazard({id:'gen',kind:'gen',at:[-36,Y,40],r:4});},
 waitAll:true,escape:{vehicle:'boat',via:['gate','gateO','jetty'],board:'jEnd'},depart:{vehicle:'boat',via:['gate','gateO','jetty'],board:'jEnd'},
 script(G,L,dt,t){const b=L.byId('boat');if(b.state==='leave')return;const t1=L.byId('tgt'),t2=L.byId('tgt2');
  // the boat waits until every living target is aboard
  const aboard=[t1,t2].filter(p=>p.alive);if(aboard.length&&aboard.every(p=>p.vehicle===b))b.depart();else if(b.state!=='park'&&b.state!=='leave'){b.state='park';}
  if(b.departing===undefined){}},
 reset(){}};
export const MISSIONS_B=[city,ski,island];
