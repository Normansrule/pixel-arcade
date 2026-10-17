// ABYSS DIVER — items, recipes, species, difficulty.
export const ITEMS={
 titanium:{n:'TITANIUM',c:'#c8d4e2',ic:'▰'},copper:{n:'COPPER',c:'#4fd8a8',ic:'▰'},quartz:{n:'QUARTZ',c:'#eaf6ff',ic:'◆'},fiber:{n:'KELP FIBER',c:'#d8c050',ic:'≋'},
 lithium:{n:'LITHIUM',c:'#8aff7a',ic:'◆'},gel:{n:'LUMEN GEL',c:'#56f0ff',ic:'●'},ember:{n:'EMBERSTONE',c:'#ff6a3a',ic:'◆'},
 rawfish:{n:'RAW FISH',c:'#ffb48a',ic:'◗',food:16,water:4},cookedfish:{n:'COOKED FISH',c:'#ffd27a',ic:'◗',food:38,water:-2},
 bulb:{n:'BRINE BULB',c:'#9ae8ff',ic:'●',water:24,food:2},flask:{n:'FRESH WATER',c:'#7ad0ff',ic:'▮',water:45},
 medkit:{n:'MEDKIT',c:'#ff6a6a',ic:'✚',heal:55},flare:{n:'FLARE',c:'#ffb050',ic:'✦'},
};
export const CARRY=24;   // cargo slots (tools and suit upgrades do not count)
// tool / upgrade recipes print once; consumables can be printed again
export const RECIPES=[
 {id:'knife',n:'SURVIVAL KNIFE',d:'Swipe with LMB. Cuts kelp fiber and drives off reef predators.',cost:{titanium:2},tier:0},
 {id:'tank',n:'O2 TANK',d:'Doubles your air: 45 s → 90 s.',cost:{titanium:2,quartz:1},tier:0},
 {id:'fins',n:'SWIM FINS',d:'Swim 25% faster and use less air when you sprint.',cost:{fiber:2,titanium:1},tier:0},
 {id:'jet',n:'HYDROJET',d:'Hold SHIFT to tow yourself at speed. Recharges at the lifepod.',cost:{titanium:2,copper:1,quartz:1},tier:1},
 {id:'suit',n:'PRESSURE SUIT',d:'Raises your crush depth from 100 m to 250 m.',cost:{titanium:2,fiber:2,lithium:1},tier:1},
 {id:'tank2',n:'DEEP TANK',d:'150 s of air. Needs the O2 TANK.',cost:{titanium:1,lithium:1,quartz:1},tier:1,needs:'tank'},
 {id:'sub',n:'MINNOW SUB',d:'Two-seat mini-sub, rated to 500 m. Lights, sonar and a shock pulse (F).',cost:{titanium:4,copper:2,lithium:1,gel:2},tier:2},
 {id:'beacon',n:'DISTRESS BEACON',d:'A deep-space distress rocket. Print it to call for rescue and WIN.',cost:{ember:2,copper:2,quartz:1},tier:3},
 {id:'medkit',n:'MEDKIT',d:'Restores 55 health. Press 3.',cost:{fiber:2,quartz:1},tier:0,repeat:1},
 {id:'flare',n:'FLARES ×3',d:'Light up the deep and scare predators. Press F.',cost:{copper:1,fiber:1},tier:0,repeat:1,qty:3},
];
export const SPECIES={
 glowfin:{n:'GLOWFIN',info:'Small schooling fish. Its fins store sunlight and glow faintly after dark. Edible.',pts:100,edible:1},
 sandskip:{n:'SANDSKIPPER',info:'Banded reef grazer. Whole schools scatter from anything bigger than they are. Edible.',pts:100,edible:1},
 bulbeye:{n:'BULBEYE',info:'Slow, round and curious, with one huge eye. The best eating on the reef.',pts:120,edible:1},
 needle:{n:'NEEDLEFISH',info:'Long silver hunter of the kelp cathedral, darting between the stalks.',pts:120,edible:1},
 duskwing:{n:'DUSKWING',info:'Tall-finned plateau fish that glides in loose flocks over the red grass.',pts:140,edible:1},
 gloomlure:{n:'GLOOMLURE',info:'Deep-water ambusher dangling a living light. Lives where the sun never reaches.',pts:200,edible:1},
 veilray:{n:'VEILRAY',info:'Gentle giant with a twelve-metre span and trailing veils. Filter-feeds on drifting plankton.',pts:300},
 razorjaw:{n:'RAZORJAW',info:'Territorial reef predator. Bites hard, then circles. Flares and a knife drive it off.',pts:300,danger:1},
 jelly:{n:'LANTERN JELLY',info:'Drifting jelly that pulses with blue light. Its trailing threads sting on contact.',pts:200,danger:1},
 crab:{n:'QUARTZBACK CRAB',info:'Abyssal crustacean wearing a shell of living crystal. Pinches if crowded.',pts:250},
 maw:{n:'HOLLOWMAW',info:'Leviathan-class serpent of the Drop. Hunts by sound, opens a four-petal jaw. Avoid. Flares and shock pulses repel it.',pts:800,danger:1},
};
export const DIFFS=[
 {n:'CALM',drain:.55,dmg:.6,notice:.75,speed:.85,o2:1.25,hint:'Gentle survival meters, slower predators.'},
 {n:'SURVIVAL',drain:1,dmg:1,notice:1,speed:1,o2:1,hint:'The intended dive: hunger, thirst and hunters.'},
 {n:'HARDCORE',drain:1.35,dmg:1.4,notice:1.3,speed:1.15,o2:.85,hint:'Hungrier, faster leviathan, harder bites.'},
];
export const DIVE=900;  // session length in seconds (time limit)
