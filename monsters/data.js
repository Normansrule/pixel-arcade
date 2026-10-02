// BLOCK BEASTS — game data: types, type chart, moves, 24 original creatures, items, trainers.
export const TYPES=['EMBER','TIDE','LEAF','SPARK','STONE','FROST','WIND','SHADE'];
export const TCOL={EMBER:'#ff6a2a',TIDE:'#3d9bff',LEAF:'#58c94a',SPARK:'#ffd23a',STONE:'#c09060',FROST:'#8be6ff',WIND:'#d6e2f6',SHADE:'#a274ff',BASIC:'#cfc6b4'};
// attacker -> defenders it hits for x2 / x0.5
const STRONG={EMBER:['LEAF','FROST','SHADE'],TIDE:['EMBER','STONE'],LEAF:['TIDE','STONE'],SPARK:['TIDE','WIND'],STONE:['EMBER','SPARK','FROST'],FROST:['LEAF','WIND'],WIND:['LEAF','EMBER'],SHADE:['SPARK','WIND']};
const WEAK={EMBER:['TIDE','STONE','EMBER'],TIDE:['LEAF','TIDE'],LEAF:['EMBER','WIND','LEAF'],SPARK:['STONE','LEAF','SPARK'],STONE:['STONE','WIND'],FROST:['EMBER','TIDE','FROST'],WIND:['STONE','SPARK'],SHADE:['SHADE','EMBER']};
export function eff(att,def){if(STRONG[att]?.includes(def))return 2;if(WEAK[att]?.includes(def))return .5;return 1;}

// moves: type, power (0 = status), accuracy, category p(hysical)/s(pecial)/x(status), anim style, effect
// anim: lunge (contact), shot (projectile), beam, rain (falls from above), bolt (lightning), aura (self), cloud (status on target)
const mv=(n,type,pow,acc,cat,anim,fx={})=>({n,type,pow,acc,cat,anim,...fx});
export const MOVES={
 bonk:mv('BONK','BASIC',40,100,'p','lunge'),
 zip:mv('ZIP STRIKE','BASIC',40,100,'p','lunge',{prio:1}),
 slam:mv('BLOCK SLAM','BASIC',80,90,'p','lunge'),
 howl:mv('HOWL','BASIC',0,100,'x','aura',{self:{atk:1}}),
 hunker:mv('HUNKER','BASIC',0,100,'x','aura',{self:{def:1}}),
 glare:mv('GLARE','BASIC',0,100,'x','cloud',{foe:{spd:-1}}),
 cinder:mv('CINDER FLICK','EMBER',40,100,'s','shot',{st:'burn',ch:.1}),
 scorch:mv('SCORCH BITE','EMBER',65,100,'p','lunge',{st:'burn',ch:.1}),
 kiln:mv('KILN BLAST','EMBER',90,90,'s','beam',{st:'burn',ch:.2}),
 smolder:mv('SMOLDER','EMBER',0,85,'x','cloud',{st:'burn',ch:1}),
 drizzle:mv('DRIZZLE SHOT','TIDE',40,100,'s','shot'),
 riptide:mv('RIPTIDE','TIDE',70,100,'p','lunge'),
 torrent:mv('TORRENT CANNON','TIDE',95,85,'s','beam'),
 snare:mv('BUBBLE SNARE','TIDE',55,100,'s','shot',{foe:{spd:-1},ch:1}),
 mist:mv('MIST VEIL','TIDE',0,100,'x','aura',{self:{def:2}}),
 thorn:mv('THORN FLICK','LEAF',40,100,'s','shot'),
 bramble:mv('BRAMBLE LASH','LEAF',65,100,'p','lunge'),
 canopy:mv('CANOPY CRASH','LEAF',90,90,'s','rain'),
 spore:mv('SPORE PUFF','LEAF',0,75,'x','cloud',{st:'sleep',ch:1}),
 sap:mv('SAP DRAIN','LEAF',55,100,'s','shot',{drain:.5}),
 static:mv('STATIC NIP','SPARK',40,100,'p','lunge',{st:'para',ch:.1}),
 arc:mv('ARC BOLT','SPARK',70,100,'s','bolt',{st:'para',ch:.15}),
 storm:mv('STORM SURGE','SPARK',95,85,'s','bolt',{st:'para',ch:.2}),
 buzz:mv('BUZZ FIELD','SPARK',0,90,'x','cloud',{st:'para',ch:1}),
 pebble:mv('PEBBLE PELT','STONE',40,100,'s','shot'),
 crag:mv('CRAG SMASH','STONE',75,95,'p','lunge'),
 slide:mv('LANDSLIDE','STONE',95,85,'p','rain'),
 bedrock:mv('BEDROCK GUARD','STONE',0,100,'x','aura',{self:{def:2}}),
 chill:mv('CHILL NIP','FROST',40,100,'p','lunge',{st:'freeze',ch:.1}),
 icicle:mv('ICICLE VOLLEY','FROST',70,100,'s','shot',{st:'freeze',ch:.1}),
 whiteout:mv('WHITEOUT','FROST',95,85,'s','rain',{st:'freeze',ch:.15}),
 stare:mv('FROST STARE','FROST',0,60,'x','cloud',{st:'freeze',ch:1}),
 breeze:mv('BREEZE CUT','WIND',40,100,'s','shot'),
 cyclone:mv('CYCLONE KICK','WIND',70,100,'p','lunge'),
 tempest:mv('TEMPEST DIVE','WIND',95,90,'p','lunge'),
 tailwind:mv('TAILWIND','WIND',0,100,'x','aura',{self:{spd:2}}),
 shadow:mv('SHADOW NIP','SHADE',40,100,'p','lunge'),
 dusk:mv('DUSK CLAW','SHADE',70,100,'p','lunge',{crit:1}),
 void:mv('VOID PULSE','SHADE',95,85,'s','beam'),
 gloom:mv('GLOOM LULLABY','SHADE',0,70,'x','cloud',{st:'sleep',ch:1}),
};

// species: n name, t type, b base [hp,atk,def,spd], cr catch rate (0..1), xp base yield, evo [to,level], ls learnset [[lv,move]],
// home biomes, tmp temperament (calm|shy|bold), night (only spawns at night), size (model height), dex entry
const sp=(n,t,b,cr,xp,evo,ls,home,tmp,size,dex,extra={})=>({n,t,b,cr,xp,evo,ls,home,tmp,size,dex,...extra});
export const SPECIES=[null,
 sp('EMBRIK','EMBER',[44,54,40,62],.45,62,[2,12],[[1,'bonk'],[1,'cinder'],[6,'howl'],[9,'scorch'],[15,'slam'],[19,'smolder'],[24,'kiln']],['desert'],'bold',.7,'A brick-bodied pup whose tail tuft never goes out. It sleeps curled around warm stones.'),
 sp('SCORCHOUND','EMBER',[62,76,56,82],.25,142,[3,22],[[1,'bonk'],[1,'cinder'],[1,'scorch']],['desert'],'bold',1.25,'Its mane is a ring of living flame. It herds lost travellers back to the village at dusk.'),
 sp('PYRELORD','EMBER',[82,104,76,98],.12,236,null,[[1,'scorch'],[1,'kiln']],[],'bold',2,'Molten seams glow along its back. Old tales say its footsteps baked the first clay bricks.'),
 sp('PUDDLOP','TIDE',[52,46,52,44],.45,62,[5,12],[[1,'bonk'],[1,'drizzle'],[6,'hunker'],[9,'riptide'],[14,'snare'],[18,'mist'],[24,'torrent']],['beach','meadow'],'calm',.6,'A cube-shaped tadpole that never quite grew up. It hums to itself in rock pools.'),
 sp('BROOKETTE','TIDE',[68,64,68,64],.25,142,[6,22],[[1,'bonk'],[1,'drizzle'],[1,'riptide']],['beach'],'calm',1.2,'Fast and playful. It surfs river currents on its flat tail and splashes anyone who frowns.'),
 sp('TSUNAMAW','TIDE',[90,88,98,70],.12,236,null,[[1,'riptide'],[1,'torrent']],[],'bold',2,'Its shell is a reef of living coral. When it roars, the tide answers.'),
 sp('SPROUTLE','LEAF',[48,48,56,42],.45,62,[8,12],[[1,'bonk'],[1,'thorn'],[6,'hunker'],[9,'bramble'],[13,'sap'],[17,'spore'],[24,'canopy']],['forest','meadow'],'calm',.6,'A boxy tortoise with a seedling on its back. The sprout turns to follow the sun.'),
 sp('THICKETOISE','LEAF',[68,68,80,52],.25,142,[9,22],[[1,'bonk'],[1,'thorn'],[1,'bramble']],['forest'],'calm',1.2,'A whole hedge grows on its shell. Songbirds nest there and it is careful never to shake.'),
 sp('GROVEKEEP','LEAF',[92,90,104,60],.12,236,null,[[1,'bramble'],[1,'canopy']],[],'calm',2.1,'It carries an ancient tree. Forests are said to begin wherever a Grovekeep sleeps.'),
 sp('ZAPPIP','SPARK',[38,50,36,84],.6,56,[11,14],[[1,'bonk'],[1,'static'],[5,'zip'],[8,'buzz'],[11,'arc'],[18,'slam'],[25,'storm']],['meadow','highlands'],'shy',.55,'Its two antenna bulbs flicker when it is curious. Herds of them make meadows twinkle.'),
 sp('JOLTROT','SPARK',[58,74,52,104],.3,136,[12,26],[[1,'zip'],[1,'static'],[1,'arc']],['meadow'],'shy',1.1,'A crackling fox that runs faster than its own thunder. Its zig-zag tail stores a charge.'),
 sp('THUNDRAKE','SPARK',[78,98,70,110],.12,230,null,[[1,'arc'],[1,'storm']],[],'bold',1.9,'A lightning drake. The glowing plates along its spine hum before every storm.'),
 sp('PEBBLET','STONE',[50,58,72,24],.5,60,[14,14],[[1,'bonk'],[1,'pebble'],[5,'hunker'],[9,'crag'],[16,'bedrock'],[22,'slam'],[28,'slide']],['highlands'],'calm',.55,'A mossy stone that waddles. It is often mistaken for a rock until it yawns.'),
 sp('BOULDRUM','STONE',[72,84,98,32],.25,140,[15,26],[[1,'pebble'],[1,'crag'],[1,'hunker']],['highlands'],'bold',1.4,'It drums its rocky fists to call its friends. The echoes can be heard across the cliffs.'),
 sp('MONOLITH','STONE',[94,108,122,36],.1,240,null,[[1,'crag'],[1,'slide']],[],'calm',2.4,'A walking pillar with a crystal heart. It stands still for years at a time.'),
 sp('FROSTBUN','FROST',[52,48,52,66],.5,64,[17,16],[[1,'bonk'],[1,'chill'],[6,'glare'],[10,'icicle'],[16,'stare'],[21,'slam'],[27,'whiteout']],['snow'],'shy',.6,'A snow-white cube bunny. Its ears are made of clear ice and chime when it hops.'),
 sp('GLACIARA','FROST',[80,80,82,90],.2,180,null,[[1,'chill'],[1,'icicle'],[1,'glare']],['snow'],'shy',1.6,'A frost stag with crystal antlers. Snow falls a little softer wherever it walks.'),
 sp('GUSTLING','WIND',[40,48,38,68],.6,56,[19,13],[[1,'bonk'],[1,'breeze'],[5,'zip'],[9,'tailwind'],[12,'cyclone'],[20,'slam'],[26,'tempest']],['meadow','forest','snow'],'shy',.55,'A round little bird that rides the breeze rather than flap. It loves windy hilltops.'),
 sp('GALEON','WIND',[64,70,60,90],.3,138,[20,26],[[1,'breeze'],[1,'zip'],[1,'cyclone']],['forest','highlands'],'shy',1.1,'Its crest feathers point toward the next storm. Sailors watch for its silhouette.'),
 sp('CYCLONYX','WIND',[84,94,74,110],.12,232,null,[[1,'cyclone'],[1,'tempest']],[],'bold',2,'A great raptor whose wingbeat spins up whirlwinds. It nests above the clouds.'),
 sp('DUSKIT','SHADE',[46,60,42,74],.4,66,[22,18],[[1,'bonk'],[1,'shadow'],[6,'glare'],[10,'gloom'],[14,'dusk'],[22,'slam'],[28,'void']],['any'],'bold',.6,'Only seen after sunset. Its eyes glow like two tiny lanterns and it loves to follow footsteps.',{night:1}),
 sp('NOCTURROW','SHADE',[72,94,64,102],.15,190,null,[[1,'shadow'],[1,'dusk'],[1,'gloom']],['any'],'bold',1.3,'A panther of the night with violet runes in its fur. Moonlight makes it bolder.',{night:1}),
 sp('SUNSCUTTLE','EMBER',[62,76,84,48],.35,120,null,[[1,'bonk'],[1,'cinder'],[8,'hunker'],[12,'crag'],[16,'scorch'],[24,'kiln']],['desert','beach'],'bold',.8,'A crab with a sunstone shell. It basks all day and glows warm long after dark.'),
 sp('LUMOTH','SPARK',[60,70,58,94],.18,170,null,[[1,'static'],[1,'breeze'],[10,'buzz'],[14,'arc'],[24,'storm']],['any'],'shy',.9,'A rare moth with lantern wings. Spotting one at night is said to bring good luck.',{night:1,fly:1}),
];
// flying species hover above ground
for(const i of [18,19,20,24])SPECIES[i].fly=1;
SPECIES.forEach((s,i)=>{if(s){s.id=i;s.cr=s.cr;}});
// pre-evolution lookup
export const PREV={};SPECIES.forEach((s,i)=>{if(s&&s.evo)PREV[s.evo[0]]=i;});
export const HABITAT={meadow:'Meadow',forest:'Forest',beach:'Beach',desert:'Desert',snow:'Snowfield',highlands:'Highlands & caves',any:'Anywhere, at night'};
export const STARTERS=[1,4,7];

// bag items
export const ITEMS={
 cube:{n:'CAPTURE CUBE',d:'Catches a weakened beast.',price:40,ball:1,col:'#2fd6c8'},
 great:{n:'GREAT CUBE',d:'Better odds than a Capture Cube.',price:120,ball:1.6,col:'#b07aff'},
 potion:{n:'POTION',d:'Restores 30 HP.',price:50,heal:30},
 super:{n:'SUPER POTION',d:'Restores 80 HP.',price:140,heal:80},
 remedy:{n:'REMEDY',d:'Cures burn, freeze, sleep and paralysis.',price:70,cure:1},
 revive:{n:'REVIVE',d:'Revives a fainted beast to half HP.',price:300,revive:1},
};
export const MATS={wood:'WOOD',stone:'STONE',crystal:'CRYSTAL'};
export const RECIPES=[{out:'cube',n:3,in:{wood:2,stone:1}},{out:'great',n:1,in:{crystal:1,stone:2}},{out:'remedy',n:1,in:{wood:1,crystal:1}},{out:'potion',n:2,in:{wood:3}}];

// stats & experience
export const statOf=(base,lv)=>Math.floor(base*2*lv/100)+5;
export const hpOf=(base,lv)=>Math.floor(base*2*lv/100)+lv+10;
export const xpFor=lv=>Math.floor(.8*lv*lv*lv);

// towers (gyms) and trainers
export const TOWERS=[
 {id:'verdant',n:'VERDANT SPIRE',type:'LEAF',badge:'GROVE BADGE',theme:'leaf',cx:-104,cz:-14,leader:{n:'WARDEN IVY',team:[[7,9],[18,9],[8,11]]},trainers:[{n:'RANGER TOM',team:[[18,6],[7,7]]},{n:'HIKER JUNE',team:[[4,7],[7,8],[10,8]]}],col:'#58c94a'},
 {id:'kiln',n:'KILN SPIRE',type:'EMBER',badge:'KILN BADGE',theme:'ember',cx:108,cz:26,leader:{n:'MARSHAL KOR',team:[[23,15],[2,16],[13,15],[2,17]]},trainers:[{n:'SCOUT DEV',team:[[1,13],[23,13]]},{n:'MINER RAE',team:[[13,13],[1,14],[10,14]]}],col:'#ff6a2a'},
 {id:'rime',n:'RIME SPIRE',type:'FROST',badge:'RIME BADGE',theme:'frost',cx:6,cz:-128,leader:{n:'ELDER RIME',team:[[16,20],[19,21],[17,22],[17,23]]},trainers:[{n:'SKIER LUX',team:[[16,18],[19,19]]},{n:'CLIMBER OAN',team:[[13,19],[17,19],[16,20]]}],col:'#8be6ff'},
];
export const ROAMERS=[
 {id:'r1',n:'BUG FAN PIP',x:32,z:26,team:[[10,4],[18,4]]},
 {id:'r2',n:'CAMPER NOOR',x:-58,z:-34,team:[[7,6],[18,6]]},
 {id:'r3',n:'SWIMMER KAI',x:-22,z:62,team:[[4,6],[4,7]]},
 {id:'r4',n:'DRIFTER ASH',x:70,z:46,team:[[23,10],[1,10]]},
 {id:'r5',n:'MINER JO',x:78,z:-64,team:[[13,11],[13,12],[10,12]]},
 {id:'r6',n:'SNOW SCOUT ELL',x:-36,z:-96,team:[[16,14],[18,14]]},
 {id:'r7',n:'NIGHT OWL VEX',x:-8,z:-40,team:[[21,12],[24,13]]},
];
