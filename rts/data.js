// SHARDWAR — faction, unit, building and upgrade data. Two original factions:
// the FRONTIER COMPACT (a human frontier legion: workers stay to build, medics heal, siege walkers and gunships)
// and the LATTICE (a crystalline swarm: structures grow by themselves and regenerate, fast cheap units, a nova caster).
// Units: hp, ar armour, spd m/s, r radius, dmg/cd/rng attack, tg targets ('g' ground,'a' air), bon bonus damage by tag,
// spl splash radius, sup supply, cost [ore, aether], time seconds, tags, req building needed, hot hotkey on its producer.
export const CS=2; // grid cell size (m)
export const FACTIONS={
 compact:{id:'compact',name:'FRONTIER COMPACT',short:'COMPACT',worker:'rigger',hq:'hall',supply:'depot',ext:'refinery',tower:'tower',
  barracks:'barracks',tech:'academy',factory:'foundry',air:'airfield',glow:'#7fd4ff',
  blurb:'Disciplined frontier legion. Riggers stay on site to build. Medics keep infantry alive; Bombard walkers shell from range; Hawk gunships rule the skies.',
  mix:{trooper:4,warden:2,lancer:2,medic:1,bombard:1.5,hawk:1.5}},
 lattice:{id:'lattice',name:'THE LATTICE',short:'LATTICE',worker:'mote',hq:'heart',supply:'spire',ext:'siphon',tower:'spine',
  barracks:'brood',tech:'sanctum',factory:'forge',air:'aerie',glow:'#d07aff',
  blurb:'A crystalline swarm. Motes seed structures that grow on their own; everything slowly regenerates. Fast shardlings, Weavers that call down a shatter nova, Lobber artillery.',
  mix:{shardling:4,spiner:3,carapace:2,weaver:1,lobber:1.5,glider:1.5}}};
export const U={
 // ---- Frontier Compact ----
 rigger:{f:'compact',n:'Rigger',role:'WORKER',hp:45,ar:0,spd:5,r:.55,dmg:4,cd:1.2,rng:.4,tg:'g',sight:8,sup:1,cost:[50,0],time:12,tags:['light','bio'],worker:1,hot:'Q',proj:null,
  desc:'Mines ore and aether. Builds structures and stays on site until they are done.'},
 trooper:{f:'compact',n:'Trooper',role:'RIFLE INFANTRY',hp:55,ar:0,spd:4.4,r:.55,dmg:6,cd:.72,rng:6,tg:'ga',sight:9,sup:1,cost:[50,0],time:17,tags:['light','bio'],hot:'Q',proj:'bullet',
  desc:'Cheap all-round rifle infantry that can shoot down air.',strong:'Gliders, Spiners',weak:'Lobbers, Carapaces'},
 warden:{f:'compact',n:'Warden',role:'SHIELD MELEE',hp:160,ar:2,spd:4.2,r:.7,dmg:12,cd:1.1,rng:.6,tg:'g',bon:{light:8},sight:8,sup:2,cost:[100,25],time:22,tags:['armored','bio'],hot:'E',proj:null,
  desc:'Armoured shield-bearer that cleaves light units at close range.',strong:'Shardlings, Spiners',weak:'Lancers of any kind, Lobbers'},
 lancer:{f:'compact',n:'Lancer',role:'ANTI-ARMOUR',hp:85,ar:0,spd:4.2,r:.55,dmg:14,cd:1.35,rng:8,tg:'ga',bon:{armored:20},sight:10,sup:2,cost:[75,50],time:22,tags:['light','bio'],req:'academy',hot:'R',proj:'rail',
  desc:'Rail-rifle specialist. Huge bonus damage against armoured targets.',strong:'Carapaces, Lobbers, buildings',weak:'Shardlings'},
 medic:{f:'compact',n:'Field Medic',role:'SUPPORT',hp:65,ar:0,spd:4.4,r:.55,dmg:0,cd:1,rng:0,tg:'',heal:10,hrng:5,sight:9,sup:1,cost:[75,50],time:20,tags:['light','bio'],req:'academy',hot:'T',proj:null,
  desc:'Unarmed. Heals nearby wounded infantry and keeps pace with the army.',strong:'Long fights',weak:'Everything on its own'},
 bombard:{f:'compact',n:'Bombard Walker',role:'SIEGE',hp:180,ar:1,spd:3.2,r:1.05,dmg:30,cd:2.6,rng:13,minr:3,tg:'g',bon:{armored:10},spl:2.8,sight:11,sup:3,cost:[150,100],time:34,tags:['armored','mech'],hot:'Q',proj:'shell',
  desc:'Long-range artillery walker. Splash damage shreds clumped ground units.',strong:'Shardlings, Spiners, towers',weak:'Gliders, Shardlings up close'},
 hawk:{f:'compact',n:'Hawk Gunship',role:'AIR',hp:135,ar:0,spd:6.2,r:.95,dmg:8,cd:.9,rng:6,tg:'ga',bon:{light:6},sight:11,sup:2,cost:[125,75],time:30,tags:['armored','mech'],air:1,hot:'Q',proj:'bullet',
  desc:'Rotor gunship. Flies over cliffs and strafes light ground units.',strong:'Lobbers, Shardlings, workers',weak:'Gliders, Spiners'},
 // ---- Lattice ----
 mote:{f:'lattice',n:'Mote',role:'WORKER',hp:40,ar:0,spd:5.2,r:.55,dmg:4,cd:1.2,rng:.4,tg:'g',sight:8,sup:1,cost:[50,0],time:12,tags:['light','bio'],worker:1,hot:'Q',proj:null,
  desc:'Mines ore and aether. Seeds structures that then grow on their own.'},
 shardling:{f:'lattice',n:'Shardling',role:'SWARM MELEE',hp:42,ar:0,spd:6.2,r:.5,dmg:5,cd:.55,rng:.4,tg:'g',sight:8,sup:1,cost:[40,0],time:13,tags:['light','bio'],hot:'Q',proj:null,
  desc:'Fast, cheap crystal hounds that swarm anything slow.',strong:'Lancers, Bombards, Medics',weak:'Wardens, Bombards in range'},
 spiner:{f:'lattice',n:'Spiner',role:'RANGED',hp:72,ar:0,spd:4.4,r:.6,dmg:9,cd:1,rng:6,tg:'ga',bon:{air:8},sight:9,sup:1,cost:[60,15],time:18,tags:['light','bio'],hot:'E',proj:'spine',
  desc:'Launches crystal spines at ground and air.',strong:'Hawks, Troopers',weak:'Bombards, Wardens'},
 carapace:{f:'lattice',n:'Carapace',role:'HEAVY MELEE',hp:280,ar:2,spd:4,r:1.1,dmg:18,cd:1.4,rng:.8,tg:'g',spl:1.6,sight:8,sup:3,cost:[125,50],time:28,tags:['armored','bio'],req:'sanctum',hot:'R',proj:null,
  desc:'Massive crystal brute. Its slams splash around the target.',strong:'Troopers, Wardens',weak:'Lancers'},
 weaver:{f:'lattice',n:'Prism Weaver',role:'CASTER',hp:85,ar:0,spd:4.4,r:.6,dmg:7,cd:1.4,rng:6,tg:'ga',chain:3,sight:10,sup:2,cost:[75,75],time:26,tags:['light','bio'],req:'sanctum',hot:'T',proj:'arc',
  nova:{dmg:70,r:3.6,rng:9,cd:18,key:'N'},
  desc:'Arcing chain bolts. N: Shatter Nova blasts an area after a short delay.',strong:'Clumped infantry',weak:'Lancers, Hawks'},
 lobber:{f:'lattice',n:'Geode Lobber',role:'SIEGE',hp:165,ar:1,spd:3.4,r:1.05,dmg:28,cd:2.8,rng:12,minr:3,tg:'g',bon:{armored:8},spl:3,sight:11,sup:3,cost:[150,100],time:32,tags:['armored','bio'],hot:'Q',proj:'geode',
  desc:'Artillery beast that hurls exploding geodes.',strong:'Troopers, Wardens, towers',weak:'Hawks, Lancers'},
 glider:{f:'lattice',n:'Glass Glider',role:'AIR',hp:110,ar:0,spd:6.6,r:.9,dmg:8,cd:.8,rng:6,tg:'ga',bon:{air:10},sight:11,sup:2,cost:[100,75],time:28,tags:['light','bio'],air:1,hot:'Q',proj:'spine',
  desc:'Fast crystal flyer, deadly against other aircraft.',strong:'Hawks, Bombards',weak:'Troopers, Spiners'}};
export const B={
 // ---- Frontier Compact ----
 hall:{f:'compact',n:'Command Hall',size:4,hp:1500,ar:1,cost:[400,0],time:60,sup:15,drop:1,hq:1,trains:['rigger'],res:[],sight:12,hot:'Q',desc:'Trains Riggers. Ore and aether are delivered here.'},
 depot:{f:'compact',n:'Supply Depot',size:2,hp:400,ar:1,cost:[100,0],time:18,sup:10,sight:7,hot:'E',desc:'+10 supply.'},
 refinery:{f:'compact',n:'Aether Refinery',size:2,hp:450,ar:1,cost:[75,0],time:18,ext:1,sight:7,hot:'R',desc:'Build on an aether vent. Up to 3 Riggers harvest it.'},
 barracks:{f:'compact',n:'Barracks',size:3,hp:1000,ar:1,cost:[150,0],time:36,req:['hall'],trains:['trooper','warden','lancer','medic'],sight:9,hot:'T',desc:'Trains infantry.'},
 academy:{f:'compact',n:'War Academy',size:3,hp:800,ar:1,cost:[150,50],time:36,req:['barracks'],res:['c_wpn1','c_wpn2','c_arm1','c_arm2','c_drill'],sight:8,hot:'Z',desc:'Unlocks Lancers and Medics. Researches upgrades.'},
 foundry:{f:'compact',n:'Foundry',size:3,hp:1100,ar:1,cost:[150,100],time:40,req:['barracks'],trains:['bombard'],res:['c_shell'],sight:8,hot:'C',desc:'Builds Bombard walkers.'},
 airfield:{f:'compact',n:'Airfield',size:3,hp:1000,ar:1,cost:[150,100],time:40,req:['foundry'],trains:['hawk'],sight:9,hot:'V',desc:'Builds Hawk gunships.'},
 tower:{f:'compact',n:'Watch Tower',size:2,hp:500,ar:2,cost:[100,0],time:24,req:['barracks'],atk:{dmg:12,cd:.95,rng:8,tg:'ga',proj:'bullet'},sight:10,hot:'B',desc:'Defensive gun tower. Hits ground and air.'},
 // ---- Lattice ----
 heart:{f:'lattice',n:'Heart Crystal',size:4,hp:1400,ar:1,cost:[375,0],time:55,sup:15,drop:1,hq:1,trains:['mote'],res:[],sight:12,hot:'Q',desc:'Grows Motes. Ore and aether are delivered here.'},
 spire:{f:'lattice',n:'Resonance Spire',size:2,hp:350,ar:1,cost:[100,0],time:16,sup:10,sight:7,hot:'E',desc:'+10 supply.'},
 siphon:{f:'lattice',n:'Aether Siphon',size:2,hp:420,ar:1,cost:[75,0],time:16,ext:1,sight:7,hot:'R',desc:'Grow on an aether vent. Up to 3 Motes harvest it.'},
 brood:{f:'lattice',n:'Brood Geode',size:3,hp:950,ar:1,cost:[150,0],time:34,req:['heart'],trains:['shardling','spiner','carapace','weaver'],sight:9,hot:'T',desc:'Grows ground strains.'},
 sanctum:{f:'lattice',n:'Prism Sanctum',size:3,hp:750,ar:1,cost:[150,50],time:34,req:['brood'],res:['l_wpn1','l_wpn2','l_arm1','l_arm2','l_quick'],sight:8,hot:'Z',desc:'Unlocks Carapaces and Weavers. Researches upgrades.'},
 forge:{f:'lattice',n:'Geode Forge',size:3,hp:1000,ar:1,cost:[150,100],time:38,req:['brood'],trains:['lobber'],res:['l_hard'],sight:8,hot:'C',desc:'Grows Geode Lobbers.'},
 aerie:{f:'lattice',n:'Glass Aerie',size:3,hp:900,ar:1,cost:[150,100],time:38,req:['forge'],trains:['glider'],sight:9,hot:'V',desc:'Grows Glass Gliders.'},
 spine:{f:'lattice',n:'Spine Bastion',size:2,hp:460,ar:2,cost:[100,0],time:22,req:['brood'],atk:{dmg:14,cd:1.1,rng:7.5,tg:'ga',proj:'spine'},sight:10,hot:'B',desc:'Defensive spine launcher. Hits ground and air.'}};
export const UP={
 c_wpn1:{f:'compact',n:'Infantry Weapons I',cost:[100,100],time:55,hot:'Z',desc:'+12% damage for all units.',kind:'wpn',lv:1},
 c_wpn2:{f:'compact',n:'Infantry Weapons II',cost:[175,175],time:75,hot:'Z',prev:'c_wpn1',req:['foundry'],desc:'+12% more damage. Needs a Foundry.',kind:'wpn',lv:2},
 c_arm1:{f:'compact',n:'Plating I',cost:[100,100],time:55,hot:'C',desc:'+1 armour for all units.',kind:'arm',lv:1},
 c_arm2:{f:'compact',n:'Plating II',cost:[175,175],time:75,hot:'C',prev:'c_arm1',req:['foundry'],desc:'+1 more armour. Needs a Foundry.',kind:'arm',lv:2},
 c_drill:{f:'compact',n:'Combat Drills',cost:[100,100],time:50,hot:'V',desc:'Infantry attack 25% faster.',kind:'drill',lv:1},
 c_shell:{f:'compact',n:'Long Barrels',cost:[125,125],time:55,hot:'Z',desc:'Bombards +2 range; Hawks +1 range.',kind:'shell',lv:1},
 l_wpn1:{f:'lattice',n:'Keen Shards I',cost:[100,100],time:55,hot:'Z',desc:'+12% damage for all strains.',kind:'wpn',lv:1},
 l_wpn2:{f:'lattice',n:'Keen Shards II',cost:[175,175],time:75,hot:'Z',prev:'l_wpn1',req:['forge'],desc:'+12% more damage. Needs a Geode Forge.',kind:'wpn',lv:2},
 l_arm1:{f:'lattice',n:'Dense Lattice I',cost:[100,100],time:55,hot:'C',desc:'+1 armour for all strains.',kind:'arm',lv:1},
 l_arm2:{f:'lattice',n:'Dense Lattice II',cost:[175,175],time:75,hot:'C',prev:'l_arm1',req:['forge'],desc:'+1 more armour. Needs a Geode Forge.',kind:'arm',lv:2},
 l_quick:{f:'lattice',n:'Quickening',cost:[100,100],time:50,hot:'V',desc:'Ground strains move 18% faster.',kind:'quick',lv:1},
 l_hard:{f:'lattice',n:'Hardened Geodes',cost:[125,125],time:55,hot:'Z',desc:'Carapaces and Lobbers +60 health; regeneration tripled.',kind:'hard',lv:1}};
// build menu order for workers (hotkeys come from B[].hot)
export const BUILD_LIST={compact:['hall','depot','refinery','barracks','academy','foundry','airfield','tower'],lattice:['heart','spire','siphon','brood','sanctum','forge','aerie','spine']};
export const DIFF=[{n:'EASY',dec:2.2,gather:.85,workers:16,first:420,waveSup:8,waveAdd:4,waveGap:170,expand:600,scout:150,micro:0,adapt:0,towers:0,prod:.4,armyCap:28,extraRax:0},
 {n:'NORMAL',dec:1,gather:1,workers:34,first:300,waveSup:14,waveAdd:6,waveGap:130,expand:330,scout:70,micro:1,adapt:1,towers:1,prod:.8,armyCap:120,extraRax:1},
 {n:'HARD',dec:.45,gather:1.12,workers:46,first:225,waveSup:16,waveAdd:8,waveGap:95,expand:230,scout:45,micro:2,adapt:2,towers:2,prod:1,armyCap:200,extraRax:1}];
export const PCOL=['#3f8cff','#ff4545','#46d46a','#ffb02e','#b46cff','#3fe0e0'];
export const ORE_TRIP=5,AE_TRIP=4,ORE_T=2.2,AE_T=1.5,ORE_NODE=1500,VENT=2600,MAX_SUP=150;
export const value=t=>{const d=U[t]||B[t];return d?d.cost[0]+d.cost[1]*1.5:0;};
