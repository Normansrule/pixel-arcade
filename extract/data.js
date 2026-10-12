// EXFIL — game data: items, weapons, ammo, armour, loot tables, traders, quests, difficulty, raid conditions. Original content for Pixel Arcade.
export const RAR=[{n:'COMMON',c:'#9aa0a6'},{n:'UNCOMMON',c:'#5fd36a'},{n:'RARE',c:'#4aa3ff'},{n:'EPIC',c:'#b46bff'},{n:'LEGENDARY',c:'#ffc53d'}];
export const CUR='CR';
export const money=v=>Math.round(v).toLocaleString('en-US')+' '+CUR;

/* ================= weapons (gameplay stats) =================
 cal: ammo calibre · rpm · modes · mag · hip/ads spread (deg) · kick (vertical deg/shot) · hk (horizontal) · ergo (ADS time s) · loud (hearing radius m) */
export const WPN={
 p9:{n:'P-9 Warden',cls:'PISTOL',cal:'9',rpm:420,modes:['semi'],mag:15,hip:1.9,ads:.32,kick:.95,hk:.35,ergo:.15,loud:120,reload:1.5,slots:['muzzle','mag'],eyeZ:.4},
 vx9:{n:'Vex-9',cls:'SMG',cal:'9',rpm:880,modes:['auto','semi'],mag:30,hip:2.3,ads:.36,kick:.48,hk:.42,ergo:.2,loud:125,reload:2.1,slots:['optic','muzzle','grip','mag'],eyeZ:.42},
 ark:{n:'ARK-5 Talon',cls:'RIFLE',cal:'556',rpm:720,modes:['auto','semi'],mag:30,hip:2.7,ads:.2,kick:.7,hk:.5,ergo:.25,loud:160,reload:2.5,slots:['optic','muzzle','grip','mag'],eyeZ:.44},
 hrn:{n:'Heron DMR',cls:'MARKSMAN',cal:'762',rpm:290,modes:['semi'],mag:10,hip:3.3,ads:.05,kick:1.65,hk:.45,ergo:.32,loud:190,reload:2.7,slots:['optic','muzzle','grip','mag'],eyeZ:.48},
 stk:{n:'Stoker 12',cls:'SHOTGUN',cal:'12',rpm:68,modes:['pump'],mag:6,hip:3.4,ads:2.6,kick:3,hk:.7,ergo:.26,loud:170,reload:.55,slots:['optic','mag'],eyeZ:.42,tube:true},
};
// deterministic recoil patterns (horizontal drift per shot index, -1..1)
for(const id in WPN){let s=[...id].reduce((a,c)=>a*31+c.charCodeAt(0),7)>>>0;const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;const p=[];let x=0;for(let i=0;i<40;i++){x+=(r()-.5)*.9+(i<6?.12:i<14?-.08:0)*(id==='ark'?1:-.6);x*=.86;p.push(Math.max(-1,Math.min(1,x)));}WPN[id].pat=p;}

/* ================= ammo ================= */
export const AMMO={
 '9fmj':{cal:'9',dmg:52,pen:18},'9ap':{cal:'9',dmg:45,pen:33},
 '556f':{cal:'556',dmg:58,pen:28},'556ap':{cal:'556',dmg:48,pen:44},
 '762f':{cal:'762',dmg:84,pen:36},'762ap':{cal:'762',dmg:74,pen:53},
 '12b':{cal:'12',dmg:30,pen:5,pel:8},'12s':{cal:'12',dmg:150,pen:26},
};
export const CAL={'9':'9×19','556':'5.56','762':'7.62','12':'12 GA'};

/* ================= items =================
 id: n name · s short · c category · w h grid size · kg · v base value · r rarity */
const I=(n,s,c,w,h,kg,v,r,x={})=>({n,s,c,w,h,kg,v,r,...x});
export const ITEMS={
 // weapons
 p9:I('P-9 Warden pistol','P-9','weapon',2,1,.9,9000,0,{wid:'p9'}),
 vx9:I('Vex-9 SMG','VEX-9','weapon',3,2,2.6,28000,1,{wid:'vx9'}),
 ark:I('ARK-5 Talon rifle','ARK-5','weapon',4,2,3.4,52000,2,{wid:'ark'}),
 hrn:I('Heron DMR','HERON','weapon',5,2,4.4,78000,3,{wid:'hrn'}),
 stk:I('Stoker 12 pump shotgun','STOKER','weapon',5,1,3.5,24000,1,{wid:'stk'}),
 // ammo (v per round)
 '9fmj':I('9×19 FMJ rounds','9 FMJ','ammo',1,1,.008,45,0,{stack:60,ammo:'9fmj'}),
 '9ap':I('9×19 AP rounds','9 AP','ammo',1,1,.008,170,2,{stack:60,ammo:'9ap'}),
 '556f':I('5.56 FMJ rounds','5.56 FMJ','ammo',1,1,.012,110,0,{stack:60,ammo:'556f'}),
 '556ap':I('5.56 AP rounds','5.56 AP','ammo',1,1,.012,390,2,{stack:60,ammo:'556ap'}),
 '762f':I('7.62 FMJ rounds','7.62 FMJ','ammo',1,1,.024,220,1,{stack:40,ammo:'762f'}),
 '762ap':I('7.62 AP rounds','7.62 AP','ammo',1,1,.024,720,3,{stack:40,ammo:'762ap'}),
 '12b':I('12 GA buckshot','12 BUCK','ammo',1,1,.05,90,0,{stack:20,ammo:'12b'}),
 '12s':I('12 GA slugs','12 SLUG','ammo',1,1,.05,260,1,{stack:20,ammo:'12s'}),
 // armour
 vest2:I('Quilted soft vest','SOFT VEST','armor',3,3,3,12000,0,{cls:2,dur:40}),
 vest3:I('Patrol plate vest','PATROL','armor',3,3,6,32000,1,{cls:3,dur:50}),
 vest4:I('Breaker plate carrier','BREAKER','armor',3,3,9,72000,2,{cls:4,dur:60}),
 vest5:I('Bastion heavy rig','BASTION','armor',3,3,11,138000,3,{cls:5,dur:75}),
 vest6:I('Monolith assault armour','MONOLITH','armor',3,3,14,265000,4,{cls:6,dur:85}),
 hlm2:I('Shell bump helmet','SHELL','helmet',2,2,.8,9000,0,{cls:2,dur:25}),
 hlm3:I('Ranger helmet','RANGER','helmet',2,2,1.2,26000,1,{cls:3,dur:35}),
 hlm4:I('Sentinel helmet','SENTINEL','helmet',2,2,1.5,62000,2,{cls:4,dur:45}),
 hlm5:I('Visor assault helm','VISOR','helmet',2,2,2.4,140000,3,{cls:5,dur:50}),
 // bags (gw gh = inner grid)
 bag1:I('Sling bag','SLING','bag',3,3,.5,8000,0,{gw:4,gh:3}),
 bag2:I('Day pack','DAYPACK','bag',4,4,.9,22000,1,{gw:5,gh:4}),
 bag3:I('Trekker pack','TREKKER','bag',4,5,1.4,48000,2,{gw:6,gh:5}),
 bag4:I('Raid hauler','HAULER','bag',5,5,2,95000,3,{gw:6,gh:7}),
 // weapon mods
 dot:I('Halo red-dot sight','HALO','mod',1,1,.2,9000,1,{slot:'optic',fits:['vx9','ark','hrn','stk'],zoom:1.45}),
 x4:I('Lynx 4× scope','LYNX 4×','mod',2,1,.5,30000,2,{slot:'optic',fits:['ark','hrn'],zoom:4,scope:true,ergo:.05}),
 sup9:I('Hush-9 suppressor','HUSH-9','mod',2,1,.3,18000,2,{slot:'muzzle',fits:['p9','vx9'],sup:true,rec:-.06}),
 sup556:I('Hush-5 suppressor','HUSH-5','mod',2,1,.4,30000,2,{slot:'muzzle',fits:['ark'],sup:true,rec:-.08,ergo:.02}),
 sup762:I('Hush-7 suppressor','HUSH-7','mod',2,1,.5,42000,3,{slot:'muzzle',fits:['hrn'],sup:true,rec:-.1,ergo:.03}),
 comp:I('Brake compensator','BRAKE','mod',1,1,.15,8000,1,{slot:'muzzle',fits:['vx9','ark','hrn'],rec:-.18,loud:1.15}),
 grip:I('Vertical foregrip','GRIP','mod',1,1,.12,6000,0,{slot:'grip',fits:['vx9','ark','hrn','stk'],rec:-.13,ergo:-.02}),
 p9x:I('P-9 extended mag (21)','P9 21RD','mod',1,1,.1,4000,0,{slot:'mag',fits:['p9'],mag:21}),
 vx50:I('Vex-9 drum (50)','DRUM 50','mod',2,1,.6,15000,2,{slot:'mag',fits:['vx9'],mag:50,ergo:.04}),
 ark60:I('ARK quad mag (60)','QUAD 60','mod',1,2,.5,22000,2,{slot:'mag',fits:['ark'],mag:60,ergo:.04}),
 hrn20:I('Heron 20-rd mag','HRN 20','mod',1,1,.3,9000,1,{slot:'mag',fits:['hrn'],mag:20,ergo:.02}),
 stkx:I('Stoker tube extension (+2)','TUBE +2','mod',1,1,.2,6000,0,{slot:'mag',fits:['stk'],mag:8}),
 // meds (hp = heal pool, u = uses, t = use time s)
 band:I('Bandage','BANDAGE','med',1,1,.05,2500,0,{med:'band',u:2,t:2}),
 kit:I('Field kit','FIELD KIT','med',1,1,.25,9000,1,{med:'kit',hp:300,t:3}),
 trauma:I('Trauma kit','TRAUMA','med',2,1,.6,26000,2,{med:'kit',hp:1100,t:4}),
 splint:I('Splint','SPLINT','med',1,1,.1,3000,0,{med:'splint',u:1,t:3.5}),
 pills:I('Painkillers','PILLS','med',1,1,.05,4000,0,{med:'pills',u:4,t:2}),
 stim:I('Adrenal shot','ADRENAL','med',1,1,.05,20000,3,{med:'stim',u:1,t:1.5}),
 surg:I('Surgical set','SURGICAL','med',2,1,.5,30000,2,{med:'surg',u:2,t:9}),
 // valuables + barter
 bolts:I('Box of bolts','BOLTS','loot',1,1,.4,3500,0),
 tape:I('Duct tape','TAPE','loot',1,1,.2,3000,0),
 wire:I('Copper wire spool','WIRE','loot',1,1,.5,4800,0),
 battery:I('Battery cell','BATTERY','loot',1,1,.4,6000,1),
 lighter:I('Brass lighter','LIGHTER','loot',1,1,.05,5500,1),
 lens:I('Optic lens','LENS','loot',1,1,.1,9000,1),
 hdd:I('Hard drive','HDD','loot',1,1,.3,14000,1),
 board:I('Circuit board','BOARD','loot',1,1,.2,11000,1),
 coin:I('Old silver coin','COIN','loot',1,1,.02,16000,1),
 toolset:I('Toolset','TOOLS','loot',2,1,1.8,15000,1),
 fuel:I('Fuel canister','FUEL','loot',2,2,5,18000,1),
 radio:I('Field radio','RADIO','loot',1,2,1.2,21000,2),
 brandy:I('Old brandy','BRANDY','loot',1,2,1,22000,2),
 chain:I('Gold chain','CHAIN','loot',1,1,.05,28000,2),
 watch:I('Gold watch','WATCH','loot',1,1,.1,36000,2),
 docs:I('Sealed documents','DOCS','loot',1,1,.1,32000,2),
 owl:I('Brass owl figurine','OWL','loot',2,2,2.5,85000,3),
 gpu:I('Graphics card','GPU','loot',2,1,.9,120000,4),
 gem:I('Sea sapphire','SAPPHIRE','loot',1,1,.02,150000,4),
 // keys + special
 k_pharm:I('Pharmacy back-room key','PHARMACY','key',1,1,.02,18000,2,{door:'pharm'}),
 k_harbor:I('Harbor office records key','RECORDS','key',1,1,.02,22000,2,{door:'harbor'}),
 k_cage:I('Warehouse cage key','CAGE','key',1,1,.02,15000,2,{door:'cage'}),
 k_dir:I("Director's office key",'DIRECTOR','key',1,1,.02,40000,3,{door:'dir'}),
 card:I('Blue gate keycard','KEYCARD','card',1,1,.01,60000,3),
 flare:I('Green signal flare','FLARE','flare',1,1,.3,25000,2),
 cash:I('Credits','CREDITS','cash',1,1,0,1,0,{stack:100000}),
 manifest:I('Shipping manifest','MANIFEST','quest',1,1,.1,0,3,{quest:true}),
 codebook:I('Radio codebook','CODEBOOK','quest',1,1,.2,0,3,{quest:true}),
};
for(const id in ITEMS)ITEMS[id].id=id;

/* ================= containers + loot tables ================= */
export const CONT={
 crate:{n:'Supply crate',g:[4,3],t:3,picks:[2,4]},
 weaponbox:{n:'Weapon case',g:[5,3],t:4.5,picks:[1,3]},
 cabinet:{n:'Filing cabinet',g:[3,3],t:3.5,picks:[1,3]},
 jacket:{n:'Jacket',g:[2,2],t:2,picks:[1,2]},
 safe:{n:'Safe',g:[3,3],t:7,picks:[2,3]},
 medcase:{n:'Med case',g:[3,3],t:3,picks:[2,3]},
 toolbox:{n:'Toolbox',g:[3,2],t:2.5,picks:[1,3]},
 pc:{n:'PC tower',g:[2,2],t:3.5,picks:[1,2]},
 duffel:{n:'Duffel bag',g:[4,2],t:2.5,picks:[1,3]},
 loose:{n:'Item',g:[1,1],t:0,picks:[1,1]},
};
export const LOOT={
 crate:[['9fmj',10,20,45],['556f',8,20,45],['762f',5,10,25],['12b',7,8,16],['12s',3,5,10],['9ap',3,15,30],['556ap',2,10,30],['762ap',1,8,16],['bolts',8],['tape',7],['wire',6],['grip',2],['comp',1.5],['dot',1.5],['p9x',2],['stkx',1.5],['hrn20',1],['battery',3],['toolset',2],['fuel',2]],
 weaponbox:[['p9',5],['vx9',4],['stk',4],['ark',2.2],['hrn',1],['dot',3],['x4',1],['sup9',2],['sup556',1],['sup762',.5],['grip',3],['comp',3],['ark60',1],['vx50',1],['556f',5,30,60],['762f',3,20,40],['9fmj',5,30,60],['hlm2',2],['hlm3',1.2],['vest2',2],['vest3',1.2]],
 cabinet:[['docs',3],['hdd',4],['board',3],['coin',3],['k_pharm',2],['k_harbor',2],['k_cage',2],['k_dir',.8],['cash',8,800,4000],['lighter',4],['tape',4],['battery',2],['card',.35]],
 jacket:[['cash',10,300,2500],['band',6],['pills',4],['lighter',4],['k_pharm',1.6],['k_harbor',1.6],['k_cage',1.6],['k_dir',.6],['9fmj',4,6,15],['coin',2],['chain',1],['watch',.7],['flare',.7]],
 safe:[['cash',10,5000,25000],['watch',4],['chain',5],['gem',1],['owl',1],['docs',4],['coin',4],['card',1.3],['gpu',.6],['k_dir',.8]],
 medcase:[['band',10],['kit',6],['splint',6],['pills',6],['trauma',2],['surg',1.5],['stim',1]],
 toolbox:[['bolts',10],['tape',8],['wire',8],['battery',4],['toolset',4],['fuel',1],['lens',2]],
 pc:[['hdd',8],['board',8],['battery',3],['gpu',1.3],['docs',2]],
 duffel:[['9fmj',4,15,40],['556f',3,15,40],['band',4],['kit',2],['brandy',2],['lighter',3],['cash',4,500,3000],['radio',1.5],['fuel',1.5],['flare',1],['coin',2],['hlm2',1],['bag1',1]],
 loose:[['bolts',6],['tape',6],['lighter',4],['coin',3],['band',5],['pills',4],['9fmj',4,10,25],['556f',3,10,25],['battery',4],['radio',2],['brandy',2],['watch',1],['chain',1.2],['gpu',.35],['flare',.8],['wire',5],['hdd',3],['owl',.4]],
};

/* ================= traders ================= */
export const TRADERS=[
 {id:'marta',n:'MARTA KELL',role:'Quartermaster',col:'#ff7a3d',blurb:'Ex-harbour security. Sells guns, rounds, plates. Buys gear.',
  buys:['weapon','ammo','armor','helmet','mod'],stock:[['p9',1],['9fmj',1],['vx9',1],['stk',1],['12b',1],['vest2',1],['hlm2',1],['grip',1],['ark',2],['556f',2],['vest3',2],['hlm3',2],['dot',2],['p9x',2],['stkx',2],['9ap',3],['comp',3],['12s',3],['sup9',3],['hrn',4],['762f',4],['vest4',4],['hlm4',4],['x4',4],['hrn20',4],['vx50',4],['556ap',5],['sup556',5],['ark60',5],['762ap',6],['sup762',6],['vest5',7],['hlm5',7],['vest6',9]]},
 {id:'doc',n:'DOC IVER',role:'Field Medic',col:'#5fe08a',blurb:'Patches people up behind the old cannery. Meds, bags, flares.',
  buys:['med','bag','flare'],stock:[['band',1],['splint',1],['pills',1],['kit',1],['bag1',1],['bag2',2],['flare',3],['trauma',3],['surg',4],['bag3',4],['stim',5],['bag4',6]]},
 {id:'pike',n:'PIKE',role:'The Fence',col:'#ffc53d',blurb:'Buys anything that glitters. Sells keys nobody should have.',
  buys:['*'],stock:[['k_pharm',2],['k_harbor',2],['k_cage',3],['k_dir',5],['card',6]]},
];
export const SELL={own:.62,pike:.5};

/* ================= quests ================= */
// type: hand (FIR items) · kill (faction, n, opt cls/head) · extract (via id) · streak (n raids) · carry (extract with item)
export const QUESTS=[
 {id:'q1',tr:'doc',n:'First Aid',d:'Hand over 2 bandages found in raid.',type:'hand',item:'band',n_:2,rw:{cr:8000,xp:500,items:[['kit',1]]}},
 {id:'q2',tr:'marta',n:'Clean Sweep',d:'Neutralise 5 Drifters in Saltcrest.',type:'kill',fac:'drifter',n_:5,rw:{cr:15000,xp:800,items:[['556f',60]]}},
 {id:'q3',tr:'pike',n:'Paper Trail',d:'Find the shipping manifest in the locked records room of the Harbor Office and hand it over.',type:'hand',item:'manifest',n_:1,rw:{cr:30000,xp:1200,items:[['k_cage',1]]}},
 {id:'q4',tr:'doc',n:'Signal Fire',d:'Extract through the Tower Flare pickup.',type:'extract',ex:'flare',n_:1,req:'q1',rw:{cr:25000,xp:1000,items:[['flare',1]]}},
 {id:'q5',tr:'marta',n:'Patrol Problem',d:'Neutralise 4 Halyard patrol operators.',type:'kill',fac:'patrol',n_:4,req:'q2',rw:{cr:40000,xp:1500,items:[['vest4',1]]}},
 {id:'q6',tr:'pike',n:'Shiny Things',d:'Hand over a gold watch and a gold chain found in raid.',type:'hand',item:'watch',item2:'chain',n_:1,req:'q3',rw:{cr:60000,xp:1500,items:[['coin',2]]}},
 {id:'q7',tr:'marta',n:'Long Glass',d:'Neutralise 3 hostiles with a marksman rifle.',type:'kill',fac:'*',cls:'MARKSMAN',n_:3,req:'q5',rw:{cr:30000,xp:1200,items:[['x4',1]]}},
 {id:'q8',tr:'doc',n:'Long Haul',d:'Survive 3 raids in a row.',type:'streak',n_:3,req:'q1',rw:{cr:20000,xp:2000,items:[['trauma',1],['stim',1]]}},
 {id:'q9',tr:'pike',n:'Through the Gate',d:'Extract through the Gatehouse.',type:'extract',ex:'gate',n_:1,req:'q6',rw:{cr:50000,xp:1500,items:[['gem',1]]}},
 {id:'q10',tr:'marta',n:'Headhunter',d:'Score 5 headshot kills.',type:'kill',fac:'*',head:true,n_:5,req:'q2',rw:{cr:25000,xp:1400,items:[['sup556',1]]}},
 {id:'q11',tr:'doc',n:'Dead Air',d:'Find the radio codebook in the tower shack and extract with it.',type:'carry',item:'codebook',n_:1,req:'q4',rw:{cr:45000,xp:1800,items:[['bag3',1]]}},
];

/* ================= progression ================= */
export const LVXP=n=>Math.round(900*Math.pow(Math.max(0,n-1),1.65));
export function levelOf(xp){let l=1;while(l<30&&xp>=LVXP(l+1))l++;return l;}

/* ================= difficulty + raid conditions ================= */
export const DIFF=[
 {n:'RECRUIT',acc:.5,react:1.05,aim:1.25,view:55,hear:.75,drift:7,squads:1,ss:2,gear:0,dmg:.75,head:.04,flank:.2},
 {n:'REGULAR',acc:.7,react:.72,aim:.95,view:72,hear:1,drift:9,squads:2,ss:3,gear:1,dmg:.9,head:.08,flank:.45},
 {n:'VETERAN',acc:.84,react:.5,aim:.7,view:88,hear:1.2,drift:10,squads:2,ss:3,gear:2,dmg:1,head:.12,flank:.65},
 {n:'HARDENED',acc:.95,react:.36,aim:.5,view:105,hear:1.4,drift:11,squads:3,ss:3,gear:3,dmg:1.1,head:.18,flank:.85},
];
export const VARIANTS=[
 {id:'fog',n:'FOG MORNING',clock:'06:40',sun:[-.5,.32,.8],sunC:0xffd9b0,sunI:1.1,sky:0x9aa6ae,gnd:0x4a4640,hemiI:1.05,fog:0xa3abb0,fogD:.021,top:0x7b8a96,hor:0xb4babd,exp:.95,rain:0,cloud:.85},
 {id:'overcast',n:'OVERCAST',clock:'12:10',sun:[.3,.85,.4],sunC:0xf2f0ea,sunI:1.35,sky:0xa8b4c0,gnd:0x4c4840,hemiI:1.1,fog:0x8f9aa4,fogD:.0115,top:0x5d6c7c,hor:0x9ea9b2,exp:1,rain:0,cloud:1},
 {id:'golden',n:'GOLDEN HOUR',clock:'17:55',sun:[.75,.2,-.35],sunC:0xffb06a,sunI:2.4,sky:0x8ca0bd,gnd:0x5a4636,hemiI:.8,fog:0xbca08a,fogD:.0085,top:0x41608a,hor:0xe8a878,exp:1,rain:0,cloud:.45},
 {id:'drizzle',n:'DRIZZLE',clock:'15:20',sun:[-.2,.9,.3],sunC:0xd8dde2,sunI:.8,sky:0x8b959e,gnd:0x3c3a36,hemiI:1.05,fog:0x737d86,fogD:.017,top:0x4a545e,hor:0x7d878f,exp:1,rain:1,cloud:1},
];
export const RAID_MIN=[10,15,20];

/* ================= bot gear ================= */
export const NAMES={drifter:['Rook','Gristle','Skiff','Mudlark','Tallow','Barnacle','Crane','Fennel','Wick','Ratchet','Peat','Brine','Sorrel','Grub','Kettle','Tinker','Slate','Moss','Flint','Hook'],
 patrol:['Venn','Okafor','Lisle','Marek','Daw','Ilsa','Corran','Brask','Teague','Holm','Varga','Quill','Strand','Ryker']};
export const GEAR={
 drifter:[{w:[['p9',4],['stk',3],['vx9',3],['ark',.6]],a:[[null,6],['vest2',3],['vest3',.6]],h:[[null,6],['hlm2',3]],b:[[null,4],['bag1',5],['bag2',1]],ap:0},
  {w:[['p9',3],['stk',3],['vx9',3],['ark',1.4]],a:[[null,5],['vest2',3],['vest3',1.2]],h:[[null,5],['hlm2',3],['hlm3',.8]],b:[[null,3],['bag1',5],['bag2',2]],ap:.1},
  {w:[['p9',2],['stk',3],['vx9',3],['ark',2],['hrn',.4]],a:[[null,4],['vest2',3],['vest3',2]],h:[[null,4],['hlm2',3],['hlm3',1.5]],b:[[null,2],['bag1',5],['bag2',3]],ap:.2},
  {w:[['stk',3],['vx9',3],['ark',3],['hrn',.8]],a:[[null,3],['vest2',2],['vest3',3],['vest4',.6]],h:[[null,3],['hlm2',2],['hlm3',2.5]],b:[[null,2],['bag1',4],['bag2',3]],ap:.3}],
 patrol:[{w:[['vx9',4],['ark',4],['stk',2]],a:[['vest3',6],['vest4',1]],h:[['hlm2',3],['hlm3',4]],b:[['bag1',3],['bag2',4]],ap:.15,mods:.35},
  {w:[['vx9',3],['ark',5],['hrn',1.5],['stk',1]],a:[['vest3',5],['vest4',3]],h:[['hlm3',5],['hlm4',2]],b:[['bag2',5],['bag3',2]],ap:.3,mods:.5},
  {w:[['vx9',2],['ark',5],['hrn',2.5]],a:[['vest3',2],['vest4',5],['vest5',1]],h:[['hlm3',3],['hlm4',4]],b:[['bag2',4],['bag3',3]],ap:.5,mods:.65},
  {w:[['ark',5],['hrn',3],['vx9',1]],a:[['vest4',5],['vest5',3],['vest6',.4]],h:[['hlm4',5],['hlm5',1.5]],b:[['bag3',4],['bag4',1]],ap:.7,mods:.8}],
};
export const AMMO_OF={'9':['9fmj','9ap'],'556':['556f','556ap'],'762':['762f','762ap'],'12':['12b','12s']};

/* ================= helpers ================= */
export function pick(list,rnd=Math.random){let t=0;for(const e of list)t+=e[1];let r=rnd()*t;for(const e of list){r-=e[1];if(r<=0)return e;}return list[list.length-1];}
let UID=1;export function setUid(n){UID=Math.max(UID,n);}
export function mkItem(id,o={}){const d=ITEMS[id];if(!d)throw new Error('item '+id);const it={u:UID++,id,...o};
 if(d.stack&&it.n===undefined)it.n=d.stack;if(d.c==='armor'||d.c==='helmet'){if(it.dur===undefined)it.dur=d.dur;}
 if(d.c==='med'){if(d.u&&it.uses===undefined)it.uses=d.u;if(d.hp&&it.hp===undefined)it.hp=d.hp;}
 if(d.c==='bag'&&!it.g)it.g={w:d.gw,h:d.gh,items:[]};
 if(d.c==='weapon'){it.mods=it.mods||{};if(it.ammo===undefined){it.ammo=0;it.at=AMMO_OF[WPN[d.wid].cal][0];}}
 return it;}
export function itemValue(it){const d=ITEMS[it.id];let v=d.v;if(d.stack)v=d.v*(it.n||1);if(d.c==='armor'||d.c==='helmet')v*=.35+.65*(it.dur/d.dur);if(d.c==='med'){if(d.hp)v*=.3+.7*(it.hp/d.hp);else if(d.u)v*=(it.uses/d.u);}
 if(it.mods)for(const k in it.mods)if(it.mods[k])v+=itemValue(it.mods[k]);if(it.g)for(const e of it.g.items)v+=itemValue(e.it);if(d.c==='weapon'&&it.ammo)v+=ITEMS[it.at].v*it.ammo;return Math.round(v);}
export function itemKg(it){const d=ITEMS[it.id];let k=d.stack?d.kg*(it.n||1):d.kg;if(it.mods)for(const m in it.mods)if(it.mods[m])k+=itemKg(it.mods[m]);if(it.g)for(const e of it.g.items)k+=itemKg(e.it);if(d.c==='weapon'&&it.ammo)k+=ITEMS[it.at].kg*it.ammo;return k;}
// effective weapon stats with mods
export function wstats(it){const d=WPN[ITEMS[it.id].wid];const s={...d,rec:1,ergo:d.ergo,zoom:1.25,scope:false,sup:false,loud:d.loud,mag:d.mag,optic:null};
 for(const k in it.mods||{}){const m=it.mods[k];if(!m)continue;const md=ITEMS[m.id];if(md.rec)s.rec+=md.rec;if(md.ergo)s.ergo+=md.ergo;if(md.zoom){s.zoom=md.zoom;s.optic=m.id;}if(md.scope)s.scope=true;if(md.sup){s.sup=true;s.loud=d.loud*.35;}if(md.loud)s.loud*=md.loud;if(md.mag)s.mag=md.mag;}
 s.rec=Math.max(.45,s.rec);return s;}
