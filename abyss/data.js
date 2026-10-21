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
 {id:'rebreather',n:'REBREATHER',d:'Scrubs your exhaled air: oxygen lasts 35% longer.',cost:{fiber:1,copper:1,quartz:1},tier:1,needs:'tank'},
 {id:'sub',n:'MINNOW SUB',d:'Two-seat mini-sub, rated to 500 m. Lights, sonar and a shock pulse (F).',cost:{titanium:4,copper:2,lithium:1,gel:2},tier:2,log:1},
 {id:'abyss',n:'ABYSS SUIT',d:'Hardened shell suit: crush depth 450 m, so you can walk the floor of the Drop.',cost:{titanium:2,lithium:2,gel:1},tier:2,needs:'suit',log:3},
 {id:'halo',n:'HALO LAMP',d:'Wide, warm floodlight that reaches twice as far in the dark.',cost:{gel:1,quartz:1,copper:1},tier:2,log:4},
 {id:'habitat',n:'HABITAT CORE',d:'A seabed outpost. Deploy it with H anywhere down to 220 m: air, the printer and your locker, far from the pod.',cost:{titanium:3,copper:1,quartz:1},tier:1},
 {id:'scanner',n:'SCANNER ARRAY',d:'Habitat module. Pings every deposit within 140 m of the outpost every 25 s.',cost:{copper:2,quartz:1},tier:2,needs:'habitat'},
 {id:'grow',n:'GROW BED',d:'Habitat module. Grows food and fresh water into your locker.',cost:{fiber:2,titanium:1},tier:2,needs:'habitat',log:2},
 {id:'power',n:'POWER CELL',d:'Habitat module. Recharges the hydrojet and the MINNOW near the outpost.',cost:{lithium:1,copper:1,titanium:1},tier:2,needs:'habitat'},
 {id:'beacon',n:'DISTRESS BEACON',d:'A deep-space distress rocket. Print it to call for rescue and WIN.',cost:{ember:2,copper:2,quartz:1},tier:3,log:5},
 {id:'medkit',n:'MEDKIT',d:'Restores 55 health. Press 3.',cost:{fiber:2,quartz:1},tier:0,repeat:1},
 {id:'flare',n:'FLARES ×3',d:'Light up the deep and scare predators. Press F.',cost:{copper:1,fiber:1},tier:0,repeat:1,qty:3},
];
/* the storyline: five ECHO data pods from the HALCYON's crew; each unlocks a blueprint */
export const LOGS=[
 {id:1,n:'FLIGHT RECORDER',where:'HALCYON WRECK',reward:{flare:2,medkit:1},unlock:'MINNOW SUB',
  t:'CAPT. ADEYEMI · LOG 1',x:'"Hull breach in three decks. I am sending the crew to the pods. The MINNOW plans are on this recorder; whoever finds it, build her. She is rated for the deep. The science team went east, toward the bones."'},
 {id:2,n:'GARDEN LOG',where:'KELP CATHEDRAL',reward:{fiber:2,bulb:2},unlock:'GROW BED',
  t:'DR. LIN · LOG 2',x:'"The kelp here grows a metre a day. We clipped cuttings for a grow bed before the storm; if you build an outpost, the bed will feed you. Mind the needlefish; they bite the hands that tend them."'},
 {id:3,n:'SURVEY BEACON',where:'RED SPIRE PLATEAU',reward:{lithium:1,titanium:2},unlock:'ABYSS SUIT',
  t:'ENG. KOVAC · LOG 3',x:'"Lithium in the spires, enough to harden a suit shell to four hundred and fifty metres. I left the pattern in the printer cache. I am going down after the others. Do not follow me without a light."'},
 {id:4,n:'LUMEN SAMPLE',where:'LUMEN HOLLOW',reward:{gel:1,quartz:1},unlock:'HALO LAMP',
  t:'DR. LIN · LOG 4',x:'"The gel in the hollow is a living lamp. Refined, it throws light twice as far as our headlamps. Something enormous passed above the pit tonight. It did not see us. I think it hears us."'},
 {id:5,n:'SCIENCE LOG',where:'THE DROP · BONE FIELD',reward:{ember:1},unlock:'DISTRESS BEACON',
  t:'ENG. KOVAC · LOG 5',x:'"Emberstone burns hot enough to launch a beacon through the storm. Codes attached. If you are hearing this, print the rocket at the pod and go home. The hollowmaw nests below the bones. Light a flare when it sings."'},
];
export const SPECIES={
 glowfin:{n:'GLOWFIN',info:'Small schooling fish. Its fins store sunlight and glow faintly after dark. Edible.',pts:100,edible:1},
 sandskip:{n:'SANDSKIPPER',info:'Banded reef grazer. Whole schools scatter from anything bigger than they are. Edible.',pts:100,edible:1},
 bulbeye:{n:'BULBEYE',info:'Slow, round and curious, with one huge eye. The best eating on the reef.',pts:120,edible:1},
 needle:{n:'NEEDLEFISH',info:'Long silver hunter of the kelp cathedral, darting between the stalks.',pts:120,edible:1},
 duskwing:{n:'DUSKWING',info:'Tall-finned plateau fish that glides in loose flocks over the red grass.',pts:140,edible:1},
 gloomlure:{n:'GLOOMLURE',info:'Deep-water ambusher dangling a living light. Lives where the sun never reaches.',pts:200,edible:1},
 shellback:{n:'SHELLBACK',info:'Curious reef turtle with a plated shell. Swims over to inspect divers, then loses interest. Harmless.',pts:220},
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
