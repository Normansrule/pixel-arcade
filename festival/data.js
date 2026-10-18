// LANTERN STREET — authored data: difficulty table, the three residents and their phase-based dialogue, costume parts, battle numbers.
// Everything here is original writing for this game.

// clock: seconds until the parade · hp/dmg: enemy multipliers · great/good: timing half-windows (s) · knot: seconds of steady beam
// marker: 2 = objective marker always, 1 = only for places a neighbour told you about, 0 = none (sparkles only up close)
export const DIFF=[
 {n:'EASY',clock:540,hp:.75,dmg:.7,great:.10,good:.22,knot:1.4,marker:2,pts:1,heroHp:48},
 {n:'NORMAL',clock:390,hp:1,dmg:1,great:.07,good:.16,knot:2,marker:1,pts:1.3,heroHp:42},
 {n:'HARD',clock:270,hp:1.3,dmg:1.35,great:.045,good:.11,knot:2.6,marker:0,pts:1.7,heroHp:38},
];

// the three cardboard parts; pos = where it lies on the street (y from the ground function)
export const PARTS={
 helm:{n:'BOX HELM',d:'a sturdy shoebox with a jam-jar lamp',pos:[-8.1,19.4],icon:'▣'},
 body:{n:'TOWER TUBE',d:'a carpet tube wide enough to wear',pos:[-12.4,4.4],icon:'▮'},
 shield:{n:'LID SHIELD',d:'a round cake-tin lid',pos:[-11.2,-18.6],icon:'●'},
};
export const PART_ORDER=['helm','body','shield'];

// phases used to pick dialogue: 0 = before the costume, 1 = costume built, 2 = street repaired
// each resident: a first-meeting script (once), then per-phase lines that advance one per talk and stop on the last one.
// effects: hint:<part> marks a part as "told about" (shows its marker on NORMAL), blueprint gives the costume plan
export const RES={
 fern:{n:'GRANNY FERN',role:'dumpling stall',col:'#c86a9a',
  meet:[
   ['Oh! Wren, dear. Look at my street. Not one lantern burning, and the parade starts on the bell!'],
   ['Those Puffkins drifted down the chimneys and huffed out every flame. Now they sit giggling on the loft roof.'],
   ['Teodor in the workshop always has a plan. Go and see him, and keep your little lantern close.'],
  ],
  lines:[
   [['I put the recycling out behind my stall this morning. Plenty of good boxes back there.','hint:helm'],['The dumplings will go cold before anybody can see them in the dark.'],['Mind the puddles by the canal steps, dear. Slippery.']],
   [['My word, a lighthouse! Go on then, shine for us.'],['The gloom knot is on the loft stairs, past Juno. You can\'t miss it. Well, you can, it\'s dark.']],
   [['Listen to that! The whole street humming again. Dumpling? Fresh and hot!'],['You chased them off all by yourself. Ring the bell in the plaza when you\'re ready. The parade waits for you.'],['Look at Teodor on the loft, playing his squeezebox. He hasn\'t done that in years.']],
  ]},
 teo:{n:'TEODOR',role:'lantern maker',col:'#5aa06a',
  meet:[
   ['Wren! Mind the glue, it is still wet. You want to go up on the loft roof? Not in the dark, you don\'t.'],
   ['There is a knot of gloom sitting on the loft stairs. Only a proper beam of light will untie it.'],
   ['So. A lighthouse costume. A box helm with a lamp, a tower body, a round shield. Find the three parts and use my workbench.','blueprint'],
  ],
  lines:[
   [['That carpet tube in the courtyard by the well would make a fine tower.','hint:body'],['Three parts, then the workbench. The tape is already out.'],['A lighthouse does not fight the dark. It just refuses to go out.']],
   [['Hold the beam steady on the knot. Q on a keyboard, the lamp button on a screen.'],['Up there, keep your eyes on the ring. Press when it closes on you.']],
   [['I have never seen the loft so bright. That is a street ready for a parade.'],['I am off to play on the loft. The bell is in the plaza, the parade needs a ringer.']],
  ]},
 juno:{n:'JUNO',role:'neighbour, age seven',col:'#e8b830',
  meet:[
   ['Shh. I\'m being sad. My fish lantern won\'t glow and the Puffkins laughed at it.'],
   ['I saw a round lid down on the canal steps. Shields are round. Just saying.','hint:shield'],
  ],
  lines:[
   [['When you fight them, wait for the ring to get small, then press. My brother taught me.'],['Granny Fern has boxes behind her stall. Boxes are basically helmets.','hint:helm'],['I\'m still sad. But less.']],
   [['Woah. You look like a real lighthouse. Can I be your boat?'],['The knot is on the loft stairs. It hums. I don\'t like it.']],
   [['MY FISH IS GLOWING! LOOK AT IT GO!'],['Ring the bell, ring the bell, ring the bell!']],
  ]},
};
export const RES_ORDER=['fern','teo','juno'];

// battle: the hero's moves (cost in GLOW), timing applies to every move
export const MOVES=[
 {k:'bash',n:'LAMP BASH',d:'Strike one Puffkin with the lamp.',cost:0,pow:10,tgt:'one'},
 {k:'sweep',n:'BEACON SWEEP',d:'Sweep the beam across every foe.',cost:3,pow:7,tgt:'all'},
 {k:'wall',n:'KEEPER\'S WALL',d:'Brace behind the shield: foes hit far softer this round, +2 glow.',cost:0,tgt:'self'},
 {k:'relight',n:'RELIGHT',d:'Rekindle your lamp: heal 14 HP.',cost:2,heal:14,tgt:'self'},
];
export const FOES={
 puff:{n:'PUFFKIN',hp:18,atk:5,moves:['SNUFF','PUFF-PUFF']},
 bellows:{n:'OLD BELLOWS',hp:40,atk:7,moves:['GUST','BIG HUFF']},
};
export const HERO_GLOW=[2,6]; // start, max
