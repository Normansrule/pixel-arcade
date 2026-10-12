// CRITTER KART — data: drivers, worlds, tracks (island + hand-built circuits), cups, engine classes, items, bosses, saves.
// Every name and design here is original to Pixel Arcade.
export const ID='critterkart';

// stats 1..5: spd top speed, acc acceleration, han handling, wt weight
export const DRIVERS=[
 {id:'foxy',n:'FOXY',sp:'fox',c:0xff7a2a,c2:0xfff3e0,kc:0x2fd0c0,spd:3,acc:3,han:3,wt:3,d:'All-rounder with a lucky tail.'},
 {id:'croak',n:'CROAK',sp:'frog',c:0x48d86a,c2:0xf6f0a0,kc:0xff5a8a,spd:2,acc:5,han:3,wt:2,d:'Explosive starts, hops back fast.'},
 {id:'waddle',n:'WADDLE',sp:'penguin',c:0x22263a,c2:0xffffff,kc:0xffc23a,spd:4,acc:3,han:3,wt:2,d:'Slippery and quick on the straights.'},
 {id:'bamboo',n:'BAMBOO',sp:'panda',c:0xf4f4f4,c2:0x1a1a1a,kc:0x7ad84a,spd:3,acc:2,han:2,wt:5,d:'Heavyweight. Shoves everyone aside.'},
 {id:'thumper',n:'THUMPER',sp:'bunny',c:0xd9c8ff,c2:0xffb0d0,kc:0x4aa8ff,spd:2,acc:4,han:5,wt:1,d:'Featherweight, corners on a dime.'},
 {id:'snapper',n:'SNAPPER',sp:'croc',c:0x3a9a48,c2:0xd8e88a,kc:0xff8a2a,spd:5,acc:2,han:1,wt:4,d:'Top-speed monster, wide turns.'},
 {id:'hoot',n:'HOOT',sp:'owl',c:0x9a6a3a,c2:0xffe0b0,kc:0xb070ff,spd:3,acc:3,han:4,wt:2,d:'Smooth handling, great in the air.'},
 {id:'truffle',n:'TRUFFLE',sp:'pig',c:0xffaac4,c2:0xff7aa0,kc:0x3ad8ff,spd:4,acc:2,han:2,wt:4,d:'Sturdy cruiser with big lungs.'}];
export const statMul=d=>({top:1+(d.spd-3)*.035,acc:1+(d.acc-3)*.12,han:1+(d.han-3)*.11,wt:.6+d.wt*.2,mt:1+(d.han-3)*.05+(d.acc-3)*.03});

export const VEH={kart:{n:'KART'},hover:{n:'HOVERCRAFT'},plane:{n:'PLANE'}};

// themes: sky, light, water, ground palette, road style, props, hazard look
export const THEMES={
 hub:{coast:36,hills:6,sky:[0x3a7ad8,0xffc890],sun:[.55,.32,-.75],sunC:0xffd2a0,sunI:2.6,hemi:[0xbfd8ff,0x6a5a3a,.75],fog:0xf0c8a0,fogD:.0026,water:[0x0a4a8a,0x2ad0c8],ground:[0xf0d8a0,0x6ab04a,0x8a8070,0xffffff],road:'sand',props:['palm','rock','hut','flower'],exp:1.0},
 shores:{coast:24,hills:9,sky:[0x2a86e8,0xbfe8ff],sun:[.3,.62,-.72],sunC:0xfff0d0,sunI:3.0,hemi:[0xcfe8ff,0x7a6a4a,.8],fog:0xcfeaff,fogD:.0022,water:[0x0a5aa0,0x30e0d0],ground:[0xf4dca0,0x5ab84a,0x8a8070,0xffffff],road:'sand',props:['palm','rock','hut','flower'],exp:1.0,gapFill:'water'},
 frost:{coast:110,hills:26,sky:[0x4a5ab8,0xffb0b8],sun:[-.6,.18,-.78],sunC:0xffb090,sunI:2.4,hemi:[0xd0d8ff,0x6a6a8a,.85],fog:0xf0c8d0,fogD:.003,water:[0x1a3a6a,0x6ac8e8],ground:[0xe8f0ff,0xf4f8ff,0x7a7a90,0xffffff],road:'snow',props:['pine','ice','rock','igloo'],exp:.95,snow:true,gapFill:'ice'},
 jungle:{coast:80,hills:20,sky:[0x5a3a8a,0xff9a4a],sun:[.7,.14,-.7],sunC:0xff9a50,sunI:2.6,hemi:[0xffc8a0,0x2a3a1a,.7],fog:0xe8905a,fogD:.0032,water:[0x0a3a2a,0x3ab88a],ground:[0xc8a060,0x3a8a2a,0x6a5a48,0x8aa860],road:'stone',props:['jtree','fern','ruin','rock'],exp:1.0,gapFill:'lava'},
 star:{coast:50,hills:13,sky:[0x05061a,0x2a2a6a],sun:[-.4,.5,-.6],sunC:0xa8b8ff,sunI:1.2,hemi:[0x6a6aff,0x1a1030,.6],fog:0x1a1a48,fogD:.0035,water:[0x050a2a,0x2a4ac8],ground:[0x6a6aa0,0x2a5a6a,0x3a3a5a,0xa0a0ff],road:'crystal',props:['shroom','crystal','rock','lamp'],exp:1.3,night:true,gapFill:'void'}};

export const WORLDS=[
 {id:'shores',n:'SUNNY SHORES',theme:'shores',col:'#2ad0c8',boss:{n:'SHELLBACK',sp:'tortoise',veh:'kart',d:'A giant tortoise who never, ever hurries… until now.',haz:'boulder',c:0x6a8a3a,c2:0xd8b070}},
 {id:'frost',n:'FROSTFANG PEAKS',theme:'frost',col:'#9ab8ff',boss:{n:'TUSKER',sp:'walrus',veh:'hover',d:'The walrus king of the glacier melt.',haz:'ice',c:0x8a6a5a,c2:0xfff8e0}},
 {id:'jungle',n:'EMBER JUNGLE',theme:'jungle',col:'#ff8a3a',boss:{n:'CINDERWING',sp:'moth',veh:'plane',d:'A smouldering moth the size of a barn.',haz:'fire',c:0xd84a1a,c2:0xffd04a}},
 {id:'star',n:'STARLIGHT ISLES',theme:'star',col:'#a08aff',boss:{n:'GRIMBEAK',sp:'stormowl',veh:'kart',d:'The storm owl who rules the night sky.',haz:'bolt',c:0x3a3a6a,c2:0xb8c8ff}}];

/* Track definitions.
   Island tracks: polar loop r(θ)=R(1+Σ a·sin(kθ+φ)), y(θ)=yb+Σ a·sin(kθ+φ).
   Circuits: pts [[x,z,y,w]] closed spline.
   Shared extras: ramps [f], boosts [f], pods [f], ice [[a,b]], gaps [[f,len]] (jump over water/lava/void),
   cuts [{a,b,bend,w,surf}] shortcuts (surf 'off' = grass, slow unless boosting; 'rough' = mild slowdown; 'ice'; 'road'), haz [{k,f,...}] animated hazards,
   marks [{k,f,u}] landmark scenery. */
export const TRACKS=[
 // ---- Sunny Shores
 {id:'driftwood',n:'DRIFTWOOD BAY',w:0,veh:'kart',laps:3,R:118,sx:1.25,sz:.9,h:[[2,.12,.4],[3,.14,1.3],[5,.05,2]],y:[5,[[1,2.5,0],[3,1.5,1]]],wd:8.5,ramps:[.44],boosts:[.15,.62,.86],pods:[.1,.38,.7],seed:11,
  cuts:[{a:.48,b:.77,bend:0,w:5,surf:'rough'}],haz:[{k:'crab',f:.24,n:3},{k:'crab',f:.78,n:2}],marks:[{k:'lighthouse',f:.3,u:-60},{k:'pier',f:.82,u:46}]},
 {id:'lagoon',n:'LAGOON RUN',w:0,veh:'hover',laps:3,R:130,sx:1.1,sz:1.05,h:[[2,.15,1.1],[3,.1,.2],[4,.07,2.4]],y:[2.2,[[2,1,0]]],water:[[.08,.32],[.5,.78]],wd:13,boosts:[.2,.64],pods:[.14,.45,.8],seed:12},
 {id:'gullpeak',n:'GULL PEAK',w:0,veh:'plane',laps:3,R:150,sx:1.15,sz:1,h:[[2,.1,.3],[3,.16,1.9]],y:[34,[[1,14,0],[2,8,1.5],[3,6,.4]]],wd:9,pods:[.12,.46,.78],peak:1,seed:13},
 {id:'shellboss',n:'SHELLBACK SHOAL',w:0,boss:1,veh:'kart',laps:3,R:112,sx:1.2,sz:1,h:[[2,.18,.9],[4,.07,.3]],y:[5,[[2,3,1]]],wd:9,ramps:[.3,.74],boosts:[.5],pods:[.2,.6],seed:14},
 // ---- Frostfang Peaks
 {id:'snowdrift',n:'SNOWDRIFT PASS',w:1,veh:'kart',laps:3,R:124,sx:1.2,sz:.95,h:[[2,.1,2],[3,.18,.5],[5,.05,1]],y:[15,[[1,9,0],[2,4,2]]],wd:8.5,ramps:[.27,.68],boosts:[.1,.5,.9],pods:[.06,.36,.74],ice:[[.55,.62]],seed:21,
  cuts:[{a:.29,b:.57,bend:0,w:5,surf:'rough'}],haz:[{k:'snowball',f:.42},{k:'snowball',f:.96}],marks:[{k:'chalet',f:.2,u:40},{k:'chalet',f:.6,u:-44}]},
 {id:'glacier',n:'GLACIER MELT',w:1,veh:'hover',laps:3,R:136,sx:1.2,sz:.95,h:[[2,.12,0],[3,.16,2.2]],y:[3.5,[[1,2,1]]],water:[[.0,.18],[.36,.62],[.8,.94]],wd:13,boosts:[.3,.7],pods:[.1,.42,.75],seed:22},
 {id:'aurora',n:'AURORA LOOP',w:1,veh:'plane',laps:3,R:156,sx:1.1,sz:1.1,h:[[3,.16,.6],[2,.08,2]],y:[40,[[1,10,1],[3,10,0],[4,4,1]]],wd:9,pods:[.1,.42,.76],peak:1,seed:23},
 {id:'tuskboss',n:'TUSKER\'S FLOE',w:1,boss:1,veh:'hover',laps:3,R:126,sx:1.1,sz:1,h:[[2,.12,1.5],[3,.12,.4]],y:[2.6,[[2,1,0]]],water:[[.1,.42],[.58,.9]],wd:14,boosts:[.5],pods:[.25,.75],seed:24},
 // ---- Ember Jungle
 {id:'vinetemple',n:'VINE TEMPLE',w:2,veh:'kart',laps:3,R:120,sx:1.15,sz:1,h:[[3,.16,.2],[4,.08,1.6],[2,.06,.5]],y:[8,[[2,4,0],[3,3,1.3]]],wd:8,ramps:[.2,.58],boosts:[.38,.8],pods:[.08,.46,.7],seed:31,
  cuts:[{a:.59,b:.88,bend:0,w:5,surf:'rough'}],haz:[{k:'pendulum',f:.32},{k:'geyser',f:.66,n:2},{k:'pendulum',f:.74}],marks:[{k:'pyramid',f:.5,u:70}]},
 {id:'croccreek',n:'CROC CREEK',w:2,veh:'hover',laps:3,R:132,sx:1.25,sz:.9,h:[[2,.14,.7],[3,.12,2.6],[5,.04,1]],y:[2.6,[[1,1,0]]],water:[[.05,.4],[.55,.86]],wd:12,boosts:[.22,.7],pods:[.15,.5,.82],seed:32},
 {id:'canopy',n:'CANOPY SKYWAY',w:2,veh:'plane',laps:3,R:150,sx:1.2,sz:1,h:[[2,.12,1],[3,.12,.1],[5,.05,2]],y:[30,[[2,10,0],[3,8,2]]],wd:9,pods:[.15,.5,.8],peak:0,seed:33},
 {id:'cinderboss',n:'CINDER CALDERA',w:2,boss:1,veh:'plane',laps:3,R:140,sx:1.1,sz:1.05,h:[[2,.14,.2],[3,.1,1.1]],y:[36,[[1,12,0],[2,6,1]]],wd:10,pods:[.3,.7],peak:1,seed:34},
 // ---- Starlight Isles
 {id:'moonbeam',n:'MOONBEAM SPEEDWAY',w:3,veh:'kart',laps:3,R:130,sx:1.3,sz:.88,h:[[2,.1,.6],[3,.16,1.9],[4,.08,.8]],y:[11,[[1,6,0],[3,4,.6]]],wd:8.5,ramps:[.33,.62,.9],boosts:[.12,.48,.76],pods:[.06,.4,.7],seed:41,
  cuts:[{a:.44,b:.73,bend:0,w:5,surf:'rough'}],haz:[{k:'bumper',f:.54,n:3},{k:'meteor',f:.7},{k:'meteor',f:.04}],marks:[{k:'ferris',f:.45,u:-70}]},
 {id:'glowtide',n:'GLOWTIDE LAGOON',w:3,veh:'hover',laps:3,R:138,sx:1.15,sz:1,h:[[3,.15,1.2],[2,.1,.1],[4,.06,2.2]],y:[2.6,[[2,1,1]]],water:[[.12,.4],[.6,.92]],wd:13,boosts:[.06,.5],pods:[.2,.55,.85],seed:42},
 {id:'cometclouds',n:'COMET CLOUDS',w:3,veh:'plane',laps:3,R:160,sx:1.15,sz:1.05,h:[[2,.14,.5],[3,.1,2.2],[4,.06,.3]],y:[44,[[1,16,0],[2,8,1],[3,6,2]]],wd:9,pods:[.1,.44,.76],peak:1,seed:43},
 {id:'grimboss',n:'GRIMBEAK SPIRE',w:3,boss:1,veh:'kart',laps:3,R:122,sx:1.15,sz:1,h:[[3,.18,.7],[2,.08,1.5]],y:[13,[[1,7,0],[2,4,1]]],wd:8.5,ramps:[.4,.8],boosts:[.15,.6],pods:[.25,.7],seed:44},
 // ---- Circuits (Grand Prix / VS / Time Trial only)
 {id:'coconut',n:'COCONUT COVE',w:0,circuit:1,veh:'kart',laps:3,wd:9.5,sc:0.9,seed:51,
  pts:[[0,-150,3],[90,-156,3],[165,-138,4],[214,-92,6],[226,-28,9],[204,34,13,8.5],[160,74,16,8.5],[104,86,18,8.5],[62,58,17,8.5],[74,16,14],[44,-20,10],[-8,-14,7],[-58,26,5],[-118,40,4],[-176,4,4],[-186,-70,3],[-136,-126,3],[-70,-148,3]],
  ramps:[.627],gaps:[[.643,16]],boosts:[.07,.47,.88],pods:[.13,.4,.58,.8],ice:[],
  cuts:[{a:.26,b:.497,bend:-12,w:5.5,surf:'off'}],haz:[{k:'crab',f:.1,n:3},{k:'crab',f:.9,n:2},{k:'pendulum',f:.73,look:'palm'}],
  marks:[{k:'lighthouse',f:.32,u:-26},{k:'pier',f:.06,u:-44},{k:'boat',f:.0,u:-90},{k:'boat',f:.8,u:-70},{k:'hut',f:.72,u:24},{k:'hut',f:.76,u:-22}]},
 {id:'avalanche',n:'AVALANCHE RIDGE',w:1,circuit:1,veh:'kart',laps:3,wd:9.5,sc:0.84,seed:52,
  pts:[[0,-160,6],[100,-160,6],[170,-130,9],[190,-70,14],[150,-30,19,8.5],[90,-40,22,8.5],[60,0,26,8.5],[110,40,30,8.5],[170,70,32,8.5],[150,130,30],[80,150,26],[0,130,20],[-50,90,16],[-100,110,13],[-170,90,10],[-200,20,8],[-170,-60,7],[-110,-130,6],[-50,-158,6]],
  ramps:[.585],gaps:[[.6,15]],boosts:[.04,.5,.9],pods:[.12,.42,.66,.84],ice:[[.7,.8]],
  cuts:[{a:.17,b:.36,bend:16,w:5.5,surf:'ice'}],haz:[{k:'snowball',f:.27},{k:'snowball',f:.33},{k:'snowball',f:.93},{k:'pendulum',f:.47,look:'icicle'}],
  marks:[{k:'chalet',f:.95,u:30},{k:'chalet',f:.02,u:-34},{k:'skilift',f:.3,u:60},{k:'chalet',f:.65,u:36}]},
 {id:'magma',n:'MAGMA RUINS',w:2,circuit:1,veh:'kart',laps:3,wd:9,sc:0.76,seed:53,
  pts:[[0,-150,8],[80,-150,8],[150,-120,9],[180,-60,12],[160,0,16],[110,30,18],[50,10,18],[0,40,17],[20,100,15],[90,130,13],[160,110,12],[200,150,12],[150,200,11],[50,190,9],[-60,170,8],[-140,120,8],[-180,40,8],[-170,-50,8],[-110,-120,8],[-50,-148,8]],
  ramps:[.405],gaps:[[.42,16]],boosts:[.05,.32,.62,.92],pods:[.1,.37,.55,.78],
  cuts:[{a:.19,b:.354,bend:22,w:5,surf:'rough'}],haz:[{k:'geyser',f:.14,n:2},{k:'pendulum',f:.24},{k:'pendulum',f:.27},{k:'geyser',f:.52,n:3},{k:'pendulum',f:.96}],
  marks:[{k:'pyramid',f:.2,u:-70},{k:'volcano',f:.6,u:-150},{k:'idol',f:.06,u:22},{k:'idol',f:.06,u:-22}]},
 {id:'comet',n:'COMET CARNIVAL',w:3,circuit:1,veh:'kart',laps:3,wd:10,sc:0.76,seed:54,
  pts:[[0,-150,10],[90,-150,10],[160,-110,11],[170,-40,12],[120,0,13],[60,-20,13],[20,20,14],[60,80,16],[140,90,17],[190,140,17],[140,190,16],[40,180,14],[-40,140,13],[-110,160,12],[-180,110,11],[-170,30,10],[-120,-20,10],[-160,-90,10],[-90,-140,10]],
  ramps:[.785],gaps:[[.8,15]],boosts:[.09,.3,.57,.95],pods:[.14,.41,.63,.88],
  cuts:[{a:.25,b:.37,bend:10,w:6,surf:'road',bumpers:1}],haz:[{k:'bumper',f:.47,n:3},{k:'meteor',f:.6},{k:'meteor',f:.66},{k:'bumper',f:.7,n:2},{k:'meteor',f:.15}],
  marks:[{k:'ferris',f:.5,u:-60},{k:'tent',f:.0,u:30},{k:'tent',f:.85,u:-30},{k:'carousel',f:.31,u:0,cut:1}]}];
export const trackById=id=>TRACKS.find(t=>t.id===id);
export const worldTracks=w=>TRACKS.filter(t=>t.w===w&&!t.boss&&!t.circuit);
export const bossTrack=w=>TRACKS.find(t=>t.w===w&&t.boss);
export const islandTracks=()=>TRACKS.filter(t=>!t.circuit);
// balloons needed to open each door
export const DOOR_REQ={driftwood:0,lagoon:1,gullpeak:2,shellboss:3,snowdrift:4,glacier:5,aurora:6,tuskboss:7,vinetemple:8,croccreek:9,canopy:10,cinderboss:11,moonbeam:12,glowtide:13,cometclouds:14,grimboss:15};

/* ---------- Grand Prix ---------- */
export const CUPS=[
 {id:'acorn',n:'ACORN CUP',col:'#ffb040',tracks:['coconut','avalanche','magma','comet'],d:'Four brand-new circuits with shortcuts, jumps and live hazards.'},
 {id:'petal',n:'PETAL CUP',col:'#ff6aa0',tracks:['driftwood','snowdrift','vinetemple','moonbeam'],d:'The island classics, now with traps and secret cuts.'},
 {id:'splash',n:'SPLASH CUP',col:'#3ac8ff',tracks:['lagoon','glacier','croccreek','glowtide'],d:'Hovercraft only. Skim the water, hop the shallows.'},
 {id:'sky',n:'SKY CUP',col:'#b08aff',tracks:['gullpeak','aurora','canopy','cometclouds'],d:'Planes only. Thread the rings, roll the hornets.'}];
export const POINTS=[15,12,10,8,6,4,2,1];
// engine classes scale everyone's speed; CPUs follow the same physics
export const CC=[{n:'50CC',top:.88,acc:.92},{n:'100CC',top:1,acc:1},{n:'150CC',top:1.13,acc:1.08}];

/* ---------- items ---------- */
export const ITEMS={
 zip:{n:'ZIP',c:'#3ac8ff',d:'Instant speed burst'},
 zip3:{n:'TRIPLE ZIP',c:'#3ac8ff',d:'Three speed bursts'},
 hornet:{n:'HORNET',c:'#ff4a3a',d:'Homing rocket at the racer ahead'},
 darts:{n:'TRIPLE DART',c:'#ffb02a',d:'Three straight shots'},
 bubble:{n:'BUBBLE',c:'#8af0ff',d:'Shield that blocks one hit'},
 goo:{n:'GOO MINE',c:'#7aff4a',d:'Sticky trap dropped behind'},
 magnet:{n:'MAGNET',c:'#c06aff',d:'Reel in the racer ahead'},
 frenzy:{n:'WILD FRENZY',c:'#ffd03a',d:'Invincible, faster, flattens anyone you touch'},
 storm:{n:'THUNDER DRUM',c:'#b8c8ff',d:'Zaps every racer ahead of you'}};
// positional table: f = 0 leader .. 1 last; far = metres behind the leader
export function rollItem(pos,n,r=Math.random,far=0,storms=0){const f=n>1?(pos-1)/(n-1):0;
 let table;
 if(n<=1)table=[['zip',1]];
 else if(f<.15)table=[['goo',5],['darts',3],['bubble',3],['zip',1]];
 else if(f<.45)table=[['zip',3],['hornet',3],['darts',3],['bubble',2],['goo',2],['magnet',1]];
 else if(f<.75)table=[['zip',3],['zip3',2],['hornet',4],['magnet',2],['darts',1],['frenzy',1]];
 else table=[['zip3',4],['hornet',3],['magnet',3],['frenzy',3],['storm',storms>0?0:2],['zip',2]];
 if(far>260&&f>=.45)table.push(['frenzy',2],['zip3',2]);
 let tot=0;table.forEach(t=>tot+=t[1]);let x=r()*tot;for(const[t,w]of table){x-=w;if(x<=0)return t;}return table[0][0];}

// CPU difficulty. up/down: max catch-up / hold-back speed factor (fair rubber band, capped and faded on the final lap)
export const DIFF=[
 {n:'EASY',base:.93,skill:.55,item:.35,up:.07,down:.1,drift:.25,cut:0,mistake:.3},
 {n:'NORMAL',base:.975,skill:.8,item:.7,up:.065,down:.05,drift:.7,cut:.35,mistake:.12},
 {n:'HARD',base:1,skill:1,item:1,up:.055,down:.02,drift:1,cut:.85,mistake:0}];

/* ---------- adventure save ---------- */
const SK='pxd_critterkart_save';
export function loadSave(){let s=null;try{s=JSON.parse(localStorage.getItem(SK));}catch(e){}s=s||{};s.won=s.won||{};s.coins=s.coins||{};s.boss=s.boss||{};s.best=s.best||{};s.cups=s.cups||{};s.driver=s.driver??0;s.diff=s.diff??1;return s;}
export function writeSave(s){try{localStorage.setItem(SK,JSON.stringify(s));}catch(e){}}
export function balloons(s){return Object.keys(s.won).length+Object.keys(s.coins).length+Object.keys(s.boss).length;}
