// FORTRESS BREACH — operators, weapons, throwables and gadget rules. All names/designs original.
// weapon: dmg per bullet (head = instant kill), rate s/shot, mag, res reserve, rel reload s, pen power, fall [start,end,minK],
// sp spread rad {hip, ads, mv (moving), air}, rec recoil deg/shot {v, h}, spd move mult, cls (viewmodel / anim family)
export const WPN={
 rk12:{n:'RK-12',d:'assault rifle',cls:'rifle',dmg:36,rate:.09,mag:30,res:150,rel:2.5,pen:1,fall:[24,48,.65],sp:{hip:.045,ads:.0035,mv:.04,air:.12},rec:{v:.62,h:.32},spd:.96,snd:'rifle',auto:true},
 vx4:{n:'VX-4',d:'compact smg',cls:'smg',dmg:28,rate:.072,mag:32,res:160,rel:2.2,pen:.7,fall:[14,32,.55],sp:{hip:.05,ads:.006,mv:.03,air:.1},rec:{v:.5,h:.36},spd:1.04,snd:'smg',auto:true},
 hornet:{n:'HORNET',d:'high-rate smg',cls:'smg',dmg:24,rate:.063,mag:35,res:175,rel:2.1,pen:.65,fall:[12,30,.55],sp:{hip:.052,ads:.0065,mv:.03,air:.1},rec:{v:.46,h:.42},spd:1.04,snd:'smg',auto:true},
 kite:{n:'KITE',d:'defender smg',cls:'smg',dmg:30,rate:.08,mag:30,res:150,rel:2.3,pen:.75,fall:[16,34,.6],sp:{hip:.048,ads:.0055,mv:.03,air:.1},rec:{v:.55,h:.3},spd:1.02,snd:'smg',auto:true},
 longhand:{n:'LONGHAND',d:'marksman rifle',cls:'dmr',dmg:66,rate:.22,mag:15,res:75,rel:2.8,pen:1.5,fall:[40,80,.75],sp:{hip:.05,ads:.0012,mv:.05,air:.14},rec:{v:1.9,h:.3},spd:.92,snd:'dmr',semi:true,scope:1.9},
 hv8:{n:'HV-8',d:'pump breaching shotgun',cls:'shotgun',dmg:17,pellets:8,rate:.85,mag:7,res:35,rel:.48,shell:true,pen:.4,fall:[6,16,.25],sp:{hip:.075,ads:.06,mv:.02,air:.05},rec:{v:4.2,h:.8},spd:.95,snd:'shotgun',brk:1},
 bk12:{n:'BK-12',d:'semi-auto shotgun',cls:'shotgun',dmg:14,pellets:8,rate:.3,mag:8,res:40,rel:.44,shell:true,pen:.38,fall:[5,14,.25],sp:{hip:.08,ads:.065,mv:.02,air:.05},rec:{v:3.4,h:.9},spd:.95,snd:'shotgun',brk:1,semi:true},
 p10:{n:'P-10',d:'service pistol',cls:'pistol',dmg:34,rate:.14,mag:15,res:60,rel:1.8,pen:.55,fall:[12,26,.6],sp:{hip:.03,ads:.006,mv:.02,air:.08},rec:{v:1.3,h:.3},spd:1.06,snd:'pistol',semi:true},
 mule:{n:'MULE .44',d:'hand cannon',cls:'pistol',dmg:62,rate:.36,mag:6,res:30,rel:2.4,pen:.9,fall:[14,30,.65],sp:{hip:.04,ads:.004,mv:.025,air:.09},rec:{v:3.6,h:.5},spd:1.04,snd:'heavy',semi:true},
 stinger:{n:'STINGER',d:'machine pistol',cls:'pistol',dmg:21,rate:.058,mag:22,res:110,rel:1.9,pen:.45,fall:[10,22,.5],sp:{hip:.045,ads:.012,mv:.02,air:.08},rec:{v:.7,h:.55},spd:1.06,snd:'smg',auto:true}};
// throwables
export const THR={
 frag:{n:'FRAG',fuse:1.9,col:0x4b5530},smoke:{n:'SMOKE',fuse:1.4,col:0x7a7d80},flash:{n:'STUN',fuse:1.2,col:0xc8cac4},
 impact:{n:'IMPACT',fuse:9,impact:true,col:0x30343a},emp:{n:'EMP',fuse:1.3,col:0x2a5a8a}};
// gadgets: k = key the gadget code uses
export const GAD={
 cutter:{n:'ARC LANCE',d:'Thermal cutter. Burns open REINFORCED walls and hatches (4 s). Jammers stall it.',elec:true},
 charge:{n:'BREACH CHARGE',d:'Plant on soft walls, hatches or barricades. Press X to blow a walk-through hole.',elec:true},
 emp:{n:'EMP GRENADE',d:'Throw to fry jammers + shock traps and blind cameras in 5 m.',throw:true},
 scan:{n:'PULSE SCANNER',d:'Hold LMB with the scanner out: heartbeats within 15 m show through walls and get pinged for your team.'},
 shield:{n:'DEPLOYABLE SHIELD',d:'Bulletproof waist-high barrier with a viewport. Explosives destroy it.'},
 wire:{n:'BARBED WIRE',d:'Coil that slows anyone crossing it to a crawl and rattles loudly.'},
 trap:{n:'SHOCK TRAP',d:'Floor plate: zaps the first attacker to step on it (45 dmg + stun). EMP / bullets destroy it.',elec:true},
 jammer:{n:'SIGNAL JAMMER',d:'5 m bubble that kills drones and stops charges / cutters from firing. Shoot or EMP it.',elec:true}};
// armour: 1 light (fast), 2 medium, 3 heavy (slow)
export const ARM={1:{hp:100,spd:1.08},2:{hp:110,spd:1},3:{hp:125,spd:.92}};
export const OPS={
 volt:{n:'VOLT',side:'atk',role:'HARD BREACHER',arm:2,gad:'cutter',gn:1,util:'smoke',un:2,pri:'rk12',sec:'p10',col:0xff7a1a,head:'mask',bio:'Former foundry welder. Her lance is the only answer to steel.'},
 forge:{n:'FORGE',side:'atk',role:'DEMOLITIONS',arm:2,gad:'charge',gn:3,util:'frag',un:2,pri:'hv8',sec:'p10',col:0xffc23a,head:'helmet',bio:'Quarry blaster. Makes doors where there were none.'},
 static:{n:'STATIC',side:'atk',role:'ANTI-GADGET',arm:1,gad:'emp',gn:2,util:'flash',un:2,pri:'vx4',sec:'p10',col:0x58d0ff,head:'cap',bio:'Signals officer. Turns a defender\'s toys into scrap.'},
 lark:{n:'LARK',side:'atk',role:'INTEL',arm:1,gad:'scan',gn:0,util:'smoke',un:1,pri:'longhand',sec:'mule',col:0x9cff6a,head:'hood',bio:'Search-and-rescue medic. Hears hearts through brick.'},
 bastion:{n:'BASTION',side:'def',role:'ANCHOR',arm:3,gad:'shield',gn:2,util:'impact',un:2,pri:'bk12',sec:'p10',col:0x4f8dff,head:'helmet',bio:'Riot-line veteran. Plants cover where the fight will be.'},
 thorn:{n:'THORN',side:'def',role:'AREA DENIAL',arm:2,gad:'wire',gn:3,util:'impact',un:2,pri:'hornet',sec:'p10',col:0xd04a4a,head:'cap',bio:'Border patrol. Slows every push to a crawl.'},
 spark:{n:'SPARK',side:'def',role:'TRAPPER',arm:2,gad:'trap',gn:3,util:'impact',un:1,pri:'kite',sec:'stinger',col:0xffe14a,head:'mask',bio:'Electrician. Every doorway is a circuit.'},
 hush:{n:'HUSH',side:'def',role:'ANTI-INTEL',arm:1,gad:'jammer',gn:2,util:'impact',un:2,pri:'hv8',sec:'stinger',col:0xb07aff,head:'hood',bio:'Spectrum analyst. Silence is her weapon.'},
 recruitA:{n:'RECRUIT',side:'atk',role:'FLEX',arm:2,gad:'charge',gn:1,util:'frag',un:1,pri:'rk12',sec:'p10',col:0x9a9a9a,head:'helmet',bio:'Standard issue: one breach charge.'},
 recruitD:{n:'RECRUIT',side:'def',role:'FLEX',arm:2,gad:'wire',gn:1,util:'impact',un:1,pri:'kite',sec:'p10',col:0x9a9a9a,head:'helmet',bio:'Standard issue: one barbed wire.'}};
export const ATK_OPS=['volt','forge','static','lark'],DEF_OPS=['bastion','thorn','spark','hush'];
export const DIFF=[{n:'EASY',react:.62,aim:.07,head:.08,turn:4,wallbang:0,util:.4,acc:1.8},{n:'NORMAL',react:.36,aim:.035,head:.22,turn:7,wallbang:.35,util:.8,acc:1},{n:'HARD',react:.2,aim:.016,head:.42,turn:11,wallbang:.8,util:1,acc:.6}];
