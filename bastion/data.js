// BASTION LINE — game data: towers with two upgrade paths each, enemy types, heroes, difficulty settings and the three maps.
// Damage kinds: phys (armour reduces it), pierce (ignores armour), magic (ignores armour, double against shields), fire (burn).
export const KIND_N={phys:'PHYSICAL',pierce:'PIERCING',magic:'ARCANE',fire:'FIRE'};
// tower: base stats + paths [A,B] of three tiers: {n,c (cost),d (desc),f(s) mutates the stat block}
export const T={
 archer:{n:'BOWYER POST',k:'1',c:170,col:'#c8a060',role:'Fast arrows · hits flying',desc:'Cheap, quick and hits flyers. Armour shrugs off its arrows until it gets bodkin points.',
  s:{dmg:9,kind:'phys',rate:1.6,range:9,air:1,proj:'arrow',shots:1},
  p:[[{n:'Double Nock',c:140,d:'Fires a second arrow at another target.',f:s=>{s.shots=2;}},{n:'Arrowstorm',c:360,d:'Three arrows per volley, 30% faster.',f:s=>{s.shots=3;s.rate*=1.3;}},{n:'Thousand Quills',c:1500,d:'Five-arrow volleys, much faster, sharper.',f:s=>{s.shots=5;s.rate*=1.6;s.dmg+=5;}}],
     [{n:'Bodkin Points',c:180,d:'Arrows pierce armour. +4 damage.',f:s=>{s.kind='pierce';s.dmg+=4;}},{n:'Eagle Eye',c:420,d:'+3 range, +10 damage.',f:s=>{s.range+=3;s.dmg+=10;}},{n:"Marksman's Oath",c:1700,d:'Triple damage; double again against bosses.',f:s=>{s.dmg*=3;s.boss=2;}}]]},
 cannon:{n:'BOMBARD',k:'2',c:300,col:'#8a8a90',role:'Splash · ground only',desc:'Iron balls that burst on landing. Shreds crowds; cannot hit flyers.',
  s:{dmg:20,kind:'phys',rate:.75,range:8.5,air:0,proj:'ball',splash:2.3},
  p:[[{n:'Wide Bore',c:200,d:'+1 blast radius.',f:s=>{s.splash+=1;}},{n:'Cluster Charge',c:500,d:'Shells scatter four bomblets.',f:s=>{s.cluster=4;}},{n:'Firestorm Battery',c:1800,d:'Fires twice as fast and sets the ground ablaze.',f:s=>{s.rate*=2;s.burn=14;s.splash+=.5;}}],
     [{n:'Iron Shot',c:250,d:'+20 damage. Hits sunder armour.',f:s=>{s.dmg+=20;s.sunder=1;}},{n:'Concussion',c:550,d:'Hits stun for 0.6 s.',f:s=>{s.stun=.6;}},{n:'Wallbreaker',c:2000,d:'Triple damage; double against bosses.',f:s=>{s.dmg*=3;s.boss=2;}}]]},
 frost:{n:'RIME SPIRE',k:'3',c:260,col:'#7ad8ff',role:'Slowing pulse · area',desc:'Pulses frost around it, slowing everything nearby. Pairs with any damage tower.',
  s:{dmg:3,kind:'magic',rate:.72,range:6,air:0,proj:'pulse',slow:.4,slowT:1.6},
  p:[[{n:'Bitter Cold',c:180,d:'Slows by 55%.',f:s=>{s.slow=.55;}},{n:'Flash Freeze',c:450,d:'Every third pulse freezes enemies solid.',f:s=>{s.freeze=1;}},{n:'Absolute Zero',c:1500,d:'Frozen enemies turn brittle and take 35% more damage.',f:s=>{s.freeze=1.8;s.brittle=1;s.slow=.65;}}],
     [{n:'Squall',c:200,d:'+2 radius and the pulse reaches flyers.',f:s=>{s.range+=2;s.air=1;}},{n:'Hailstorm',c:400,d:'Pulse deals 14 damage.',f:s=>{s.dmg=14;}},{n:'Whiteout',c:1600,d:'+3 radius, 40 damage, faster pulses.',f:s=>{s.range+=3;s.dmg=40;s.rate*=1.5;}}]]},
 tesla:{n:'ARC COIL',k:'4',c:380,col:'#b08aff',role:'Chain lightning · breaks shields',desc:'Lightning that jumps between enemies. Arcane damage ignores armour and cracks shields twice as fast.',
  s:{dmg:18,kind:'magic',rate:.9,range:7.5,air:1,proj:'arc',chain:3},
  p:[[{n:'Forked Arc',c:250,d:'Jumps to five targets.',f:s=>{s.chain=5;}},{n:'Thunderhead',c:600,d:'Jumps to eight targets, 40% faster.',f:s=>{s.chain=8;s.rate*=1.4;}},{n:'Ion Tempest',c:2100,d:'Jumps to fourteen targets, double damage.',f:s=>{s.chain=14;s.dmg*=2;}}],
     [{n:'Capacitor',c:220,d:'+16 damage.',f:s=>{s.dmg+=16;}},{n:'Paralysis',c:520,d:'Arcs stun for 0.4 s.',f:s=>{s.stun=.4;}},{n:'Singularity Coil',c:2200,d:'120 damage per jump.',f:s=>{s.dmg=120;}}]]},
 mortar:{n:'SIEGE MORTAR',k:'5',c:420,col:'#a07850',role:'Huge range · big splash',desc:'Lobs heavy shells across half the map. Slow, with a short dead zone; ground only.',
  s:{dmg:38,kind:'phys',rate:.38,range:22,min:4,air:0,proj:'shell',splash:3},
  p:[[{n:'Pitch Shells',c:220,d:'Shells set enemies burning.',f:s=>{s.burn=8;}},{n:'Wildfire',c:550,d:'Leaves a burning patch on the ground.',f:s=>{s.patch=1;s.burn=12;}},{n:"Dragon's Breath",c:1900,d:'Searing burn and a wider blast.',f:s=>{s.burn=36;s.splash+=1.5;s.patch=1;}}],
     [{n:'Great Bore',c:300,d:'+40 damage.',f:s=>{s.dmg+=40;}},{n:'Rapid Reload',c:600,d:'Fires 80% faster.',f:s=>{s.rate*=1.8;}},{n:'Earthshaker',c:2400,d:'300 damage and a 1 s stun.',f:s=>{s.dmg=300;s.stun=1;}}]]},
 sniper:{n:'LONGWATCH',k:'6',c:330,col:'#6a9a6a',role:'Map-wide · armour piercing',desc:'A long rifle that reaches almost anywhere and punches through armour. Slow to reload.',
  s:{dmg:55,kind:'pierce',rate:.45,range:30,air:1,proj:'rifle'},
  p:[[{n:'Full Metal',c:250,d:'+45 damage.',f:s=>{s.dmg+=45;}},{n:'Deadeye',c:600,d:'25% chance of a triple-damage critical.',f:s=>{s.crit=.25;}},{n:'Titan Breaker',c:2200,d:'300 damage, four times against bosses.',f:s=>{s.dmg=300;s.boss=4;}}],
     [{n:'Bolt Action',c:220,d:'Fires 60% faster.',f:s=>{s.rate*=1.6;}},{n:'Suppressor',c:550,d:'Shots stun briefly and strip shields.',f:s=>{s.stun=.3;s.strip=1;}},{n:'Elite Ranger',c:1900,d:'Fires three times as fast.',f:s=>{s.rate*=3;}}]]},
 mint:{n:'GILDED MINT',k:'7',c:500,col:'#f0c040',role:'Gold each wave',desc:'Stamps coin at the end of every wave. Pays for itself in a few waves.',
  s:{gold:80,range:0,eco:1},
  p:[[{n:'Fine Dies',c:300,d:'120 gold per wave.',f:s=>{s.gold=120;}},{n:'Twin Presses',c:700,d:'220 gold per wave.',f:s=>{s.gold=220;}},{n:'Crown Foundry',c:2000,d:'450 gold per wave.',f:s=>{s.gold=450;}}],
     [{n:'Strongroom',c:400,d:'Interest cap +100.',f:s=>{s.cap=100;}},{n:'Almshouse',c:800,d:'+2 lives each wave.',f:s=>{s.cap=100;s.lives=2;}},{n:'Royal Treasury',c:2200,d:'Interest rate +3% and cap +250.',f:s=>{s.cap=250;s.lives=2;s.irate=.03;}}]]}};
export const TOWER_LIST=Object.keys(T);
export const SELL=.7;
export function tstats(type,a,b){const s={...T[type].s};for(let i=0;i<a;i++)T[type].p[0][i].f(s);for(let i=0;i<b;i++)T[type].p[1][i].f(s);return s;}
// enemies: hp at wave 1, speed (units/s), armour (fraction of physical damage removed), shield, gold, leak (lives)
export const E={
 raider:{n:'Raider',hp:42,spd:4,gold:5,leak:1,r:.45,d:'Basic footsoldier.'},
 runner:{n:'Skirmisher',hp:26,spd:7,gold:4,leak:1,r:.4,d:'Very fast. Slow it down.'},
 brute:{n:'Ironhide',hp:100,spd:2.8,armor:.55,gold:12,leak:2,r:.6,d:'Armoured: arrows and shot glance off. Use arcane, piercing or heavy shot.'},
 harpy:{n:'Gale Harpy',hp:48,spd:4.6,fly:1,gold:8,leak:1,r:.5,d:'Flies: bombards and mortars cannot hit it.'},
 aegis:{n:'Aegis Warden',hp:80,shield:130,spd:3.2,gold:14,leak:2,r:.55,d:'Shield soaks damage. Arcane breaks it twice as fast.'},
 brood:{n:'Brood Sack',hp:110,spd:3,gold:9,leak:2,r:.6,split:'broodling',d:'Bursts into three broodlings.'},
 broodling:{n:'Broodling',hp:28,spd:5,gold:2,leak:1,r:.35,d:'Hatched from a Brood Sack.'},
 mender:{n:'Mender',hp:72,spd:3.4,gold:13,leak:1,r:.45,heal:1,d:'Heals nearby enemies. Kill it first.'},
 jugg:{n:'Juggernaut',hp:1700,spd:1.8,armor:.5,gold:160,leak:20,r:1.1,boss:1,d:'Armoured siege beast. Shrugs off stuns.'},
 colossus:{n:'The Iron Colossus',hp:7000,spd:1.25,armor:.4,gold:0,leak:60,r:1.6,boss:2,d:'Final boss. Shields itself, summons broods and stuns towers.'}};
export const UNLOCK={raider:1,runner:2,harpy:4,brute:5,aegis:7,mender:8,brood:9};
export const BASEW={raider:5,runner:3,brute:2.4,harpy:2,aegis:2,mender:1,brood:1.5};
export const HEROES={
 wren:{n:'WREN',t:'The Lancer',col:'#4a8aff',d:'Close-range lance that cleaves through crowds. Warcry speeds up nearby towers; Skyfall drops a lance from the sky.',
  s:{dmg:30,kind:'phys',rate:1.1,range:4.2,air:0,cleave:3},ab:[{n:'WARCRY',lv:3,cd:45,d:'Towers within 12 fire 50% faster for 8 s.'},{n:'SKYFALL',lv:6,cd:70,d:'Lance strike on the strongest enemy: huge damage and a stun.'}]},
 isolde:{n:'ISOLDE',t:'The Stormcaller',col:'#c070ff',d:'Ranged storm bolts that reach flyers. Frost Nova freezes everything near her; Tempest calls lightning across the field.',
  s:{dmg:15,kind:'magic',rate:1.4,range:10,air:1},ab:[{n:'FROST NOVA',lv:3,cd:35,d:'Freezes every enemy within 9 for 2 s.'},{n:'TEMPEST',lv:6,cd:60,d:'Fourteen lightning strikes on the strongest enemies.'}]}};
export const HERO_XP=[0,90,220,400,640,940,1300,1750,2300,3000];
export const DIFF=[{n:'EASY',lives:150,gold:800,hp:.75,spd:1,adapt:0,gap:24,first:40,spawn:1.15,pts:.7},
 {n:'NORMAL',lives:100,gold:650,hp:1,spd:1,adapt:.55,gap:18,first:30,spawn:1,pts:1},
 {n:'HARD',lives:50,gold:600,hp:1.22,spd:1.08,adapt:1,gap:13,first:25,spawn:.85,pts:1.5}];
export const WAVES=[15,25,35];
// Maps: world spans roughly x -48..48, z -30..30. paths are control polylines (smoothed into curves); h(x,z) shapes the ground.
export const MAPS=[
 {id:'pass',n:'HIGHCRAG PASS',d:'A single switchback road down a mountain pass. Long and winding: one lane to hold.',tint:'#6a8a4a',sky:['#9ec6e8','#e8d6c0'],snow:1,
  paths:[[[-56,-21],[-38,-21],[-29,-13],[-34,0],[-30,14],[-18,20],[-9,12],[-11,0],[-3,-14],[11,-17],[19,-7],[11,5],[15,18],[29,21],[38,9],[56,5]]],
  rocks:[[-18,-2,5],[2,-6,4],[26,4,4.5],[-20,10,3],[-44,-8,4],[44,18,5],[0,24,4],[30,-22,5],[-40,26,4]]},
 {id:'delta',n:'SALTREED DELTA',d:'Two columns march in from the marsh and cross the river channels on timber bridges before they merge.',tint:'#5a8a48',sky:['#a8d0e8','#f0e0c8'],water:1,
  paths:[[[-56,-18],[-40,-18],[-30,-10],[-20,-12],[-10,-20],[2,-16],[6,-6],[0,4],[10,10],[22,6],[30,-4],[42,-2],[56,2]],
   [[-56,16],[-42,18],[-32,10],[-22,14],[-12,22],[-2,18],[0,4],[10,10],[22,6],[30,-4],[42,-2],[56,2]]],
  rivers:[[[-16,-36],[-14,-20],[-18,-6],[-12,6],[-16,20],[-12,36]],[[-15,0],[-4,-2],[8,0],[18,-4],[26,-14],[30,-36]],[[18,-4],[26,4],[36,8],[40,18],[44,36]]],rocks:[[34,-20,3],[-36,-28,3],[40,24,3]]},
 {id:'ruins',n:'ASHFALL WARD',d:'The burned city: two avenues through ruined blocks meet at the old plaza before the citadel gate.',tint:'#7a7a5a',sky:['#c8a890','#5a5068'],city:1,
  paths:[[[-56,-12],[-36,-12],[-30,-20],[-16,-20],[-12,-8],[-20,0],[-12,8],[0,6],[6,-4],[16,-4],[22,6],[20,16],[30,20],[40,12],[56,12]],
   [[-6,-36],[-4,-24],[6,-24],[10,-14],[6,-4],[16,-4],[22,6],[20,16],[30,20],[40,12],[56,12]]],rocks:[]}];
