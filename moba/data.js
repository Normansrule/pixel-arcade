// AEONFALL — items, summoner spells, jungle monsters and the tuning that is not per champion.
// Item stats: ad ap hp mp ar mr as(fraction) ms(units/s) cdr ls pen mpen hpr mpr hp5. Flags add unique passives.
export const ITEMS={
 blade:{n:'Iron Blade',c:350,ad:10,g:'sword',col:'#d0d6e0',cat:'atk'},
 dagger:{n:'Quick Dagger',c:300,as:.15,g:'dagger',col:'#ffd23f',cat:'atk'},
 gem:{n:'Ember Gem',c:400,ap:20,g:'gem',col:'#c86bff',cat:'mag'},
 orb:{n:'Sage Orb',c:350,mp:250,mpr:.6,g:'orb',col:'#4aa8ff',cat:'mag'},
 crystal:{n:'Vigor Crystal',c:400,hp:150,g:'heart',col:'#ff5a6e',cat:'def'},
 chain:{n:'Chain Vest',c:400,ar:20,g:'shield',col:'#a8b0bd',cat:'def'},
 mantle:{n:'Null Mantle',c:400,mr:25,g:'cloak',col:'#7fe0c8',cat:'def'},
 boots:{n:'Swiftsteps',c:300,ms:.35,g:'boot',col:'#c9a36a',cat:'move'},
 greaves:{n:'Gale Greaves',c:1100,ms:.6,as:.3,from:['boots','dagger'],g:'boot',col:'#ffd23f',cat:'move'},
 slippers:{n:'Arcane Slippers',c:1100,ms:.6,ap:15,mpen:.1,from:['boots'],g:'boot',col:'#c86bff',cat:'move'},
 ironshod:{n:'Ironshod Boots',c:1100,ms:.6,ar:20,from:['boots','chain'],g:'boot',col:'#a8b0bd',cat:'move'},
 // damage
 fang:{n:'Crimson Fang',c:3100,ad:55,ls:.15,from:['blade','blade'],g:'fang',col:'#ff3b4e',cat:'atk',d:'+15% life steal'},
 tempest:{n:'Tempest Bow',c:2800,as:.4,ad:20,onhitM:25,from:['dagger','dagger','blade'],g:'bow',col:'#4ae0ff',cat:'atk',d:'Attacks deal +25 magic damage'},
 repeater:{n:'Gale Repeater',c:2900,as:.35,ad:30,ms:.25,from:['dagger','blade'],g:'bow',col:'#9cff6a',cat:'atk'},
 cleaver:{n:'Executioner Cleaver',c:3000,ad:40,hp:300,pen:.25,from:['blade','crystal'],g:'axe',col:'#ff8a3a',cat:'atk',d:'25% armour penetration'},
 phantom:{n:'Phantom Edge',c:2900,ad:50,cdr:.15,lethal:12,from:['blade','blade'],g:'dagger',col:'#c060ff',cat:'atk',d:'12 lethality, +ms after a takedown'},
 spellblade:{n:'Runeblade',c:3000,ad:35,hp:250,cdr:.2,spellblade:1,from:['blade','crystal'],g:'sword',col:'#4aa8ff',cat:'atk',d:'After an ability, next attack +100% base AD'},
 // magic
 voidcrown:{n:'Voidcrown Staff',c:3200,ap:100,mpen:.35,from:['gem','gem'],g:'staff',col:'#8a4aff',cat:'mag',d:'35% magic penetration'},
 codex:{n:'Astral Codex',c:2800,ap:70,mp:300,cdr:.2,from:['gem','orb'],g:'book',col:'#4aa8ff',cat:'mag'},
 frostheart:{n:'Frostheart Orb',c:2900,ap:80,hp:250,abSlow:1,from:['gem','crystal'],g:'snow',col:'#a8e8ff',cat:'mag',d:'Abilities slow by 20%'},
 censer:{n:'Grove Censer',c:2300,ap:45,hp:200,healPow:.2,mpr:.8,from:['gem','orb'],g:'leaf',col:'#7dff9a',cat:'mag',d:'+20% heal and shield power'},
 // defence
 aegis:{n:'Aegis of Dawn',c:2800,hp:400,ar:50,cdr:.1,from:['crystal','chain'],g:'shield',col:'#ffe08a',cat:'def'},
 bramble:{n:'Bramble Mail',c:2700,hp:250,ar:65,thorns:1,from:['chain','chain'],g:'thorn',col:'#7da04a',cat:'def',d:'Attackers take magic damage'},
 mist:{n:'Mistveil Mantle',c:2800,hp:400,mr:55,hp5:4,from:['crystal','mantle'],g:'cloak',col:'#7fe0c8',cat:'def',d:'+4 health regen per second'},
 titan:{n:'Titan Heart',c:3000,hp:800,hp5:3,from:['crystal','crystal'],g:'heart',col:'#ff5a6e',cat:'def'}};
export const ITEM_IDS=Object.keys(ITEMS);
export const BOOTS=['boots','greaves','slippers','ironshod'];
// total cost to buy an item given an inventory (components owned are consumed)
export function priceOf(id,inv){const it=ITEMS[id];let c=it.c;const used=[];if(it.from){const pool=inv.slice();for(const f of it.from){const k=pool.indexOf(f);if(k>=0){c-=ITEMS[f].c;pool[k]=null;used.push(k);}}}return{c:Math.max(0,c),used};}
// list cost of the whole recipe (component costs included in c already, LoL style: c is the full price)

export const SPELLS={
 blink:{n:'Blink',cd:240,d:'Teleport a short distance, over walls.',g:'blink',col:'#ffe08a'},
 mend:{n:'Mend',cd:200,d:'Heal yourself and the nearest ally, short burst of speed.',g:'heal',col:'#7dff9a'},
 scorch:{n:'Scorch',cd:160,d:'Burn an enemy champion for true damage and cut their healing.',g:'flame',col:'#ff7a2a'},
 haste:{n:'Haste',cd:180,d:'+40% movement speed for 8 seconds.',g:'boot',col:'#7ad7ff'},
 barrier:{n:'Barrier',cd:160,d:'Shield yourself for 2.5 seconds.',g:'shield',col:'#e8e0ff'},
 strike:{n:"Hunter's Strike",cd:12,d:'True damage to a monster or minion (2 charges). Jungle role.',g:'claw',col:'#ffb21e'}};

// neutral monsters: hp, ad, armour/mr, attack speed, range, radius, gold, xp, model
export const MON={
 azure:{n:'Azure Sentinel',hp:1500,ad:46,ar:20,mr:20,as:.7,rng:2.4,r:1.4,gold:90,xp:150,m:'sentinel',buff:'azure'},
 crimson:{n:'Crimson Brute',hp:1500,ad:58,ar:20,mr:20,as:.7,rng:2.4,r:1.4,gold:90,xp:150,m:'brute',buff:'crimson'},
 wolf:{n:'Duskfang Alpha',hp:850,ad:30,ar:10,mr:0,as:.75,rng:1.9,r:1,gold:55,xp:80,m:'wolf'},
 pup:{n:'Duskfang',hp:300,ad:14,ar:5,mr:0,as:.8,rng:1.6,r:.7,gold:15,xp:25,m:'pup'},
 beak:{n:'Razorbeak Matron',hp:650,ad:22,ar:15,mr:10,as:.8,rng:1.8,r:.9,gold:40,xp:60,m:'beak'},
 chick:{n:'Razorbeak',hp:200,ad:10,ar:5,mr:5,as:.9,rng:1.6,r:.55,gold:10,xp:16,m:'chick'},
 krug:{n:'Stoneback Elder',hp:1100,ad:38,ar:30,mr:0,as:.55,rng:2,r:1.2,gold:65,xp:90,m:'krug'},
 krugling:{n:'Stoneback',hp:450,ad:20,ar:20,mr:0,as:.6,rng:1.7,r:.8,gold:22,xp:35,m:'krugling'},
 bog:{n:'Bogmaw',hp:1300,ad:38,ar:12,mr:12,as:.55,rng:6,r:1.3,gold:85,xp:130,m:'bog',ranged:1},
 drake:{n:'Ember Drake',hp:4200,ad:62,ar:30,mr:30,as:.5,rng:5,r:2.4,gold:0,xp:300,m:'drake',boss:'drake',ranged:1},
 warden:{n:'Aeon Warden',hp:9000,ad:105,ar:70,mr:60,as:.6,rng:4,r:3.2,gold:0,xp:600,m:'warden',boss:'warden'}};
export const CAMP_MON={azure:['azure'],crimson:['crimson'],wolves:['wolf','pup','pup'],beaks:['beak','chick','chick','chick'],stone:['krug','krugling'],bog:['bog']};
export const CAMP_NAME={azure:'Azure Sentinel',crimson:'Crimson Brute',wolves:'Duskfang Pack',beaks:'Razorbeaks',stone:'Stonebacks',bog:'Bogmaw'};

export const MINION={
 melee:{hp:470,ad:12,ar:0,mr:0,as:1.25,rng:1.6,r:.6,ms:4.2,gold:21,xp:58,hpG:22,adG:.6},
 caster:{hp:290,ad:23,ar:0,mr:0,as:.67,rng:7,r:.55,ms:4.2,gold:14,xp:29,hpG:9,adG:1.5,ranged:1},
 siege:{hp:900,ad:40,ar:30,mr:0,as:1,rng:8.5,r:.95,ms:4.2,gold:60,xp:92,hpG:40,adG:2,ranged:1},
 super:{hp:1600,ad:110,ar:30,mr:-30,as:.85,rng:2.2,r:1.1,ms:4.6,gold:60,xp:97,hpG:100,adG:5}};
export const TOWER={hp:[2800,3200,3500,2700],ad:155,adG:6,ar:30,mr:30,rng:10.5,as:.83};
export const XPNEED=l=>160+90*l; // xp from level l to l+1
export const ROLES=['top','jungle','mid','bot','sup'];
export const ROLE_N={top:'TOP',jungle:'JUNGLE',mid:'MID',bot:'BOT',sup:'SUPPORT'};
