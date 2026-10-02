// PET BRAWL — data: 66 original pets over 6 tiers, 19 foods, summons, ghost archetypes.
// Abilities get an api object `x` (see sim.js): x.me, x.L (level), x.buff(t,a,h), x.dmg(t,n), x.summon(spec,idx), x.friends(), x.foes(), ...
export const ID='petbrawl';
const P=(id,n,t,a,h,trig,tx,fn,m,tags='')=>({id,n,t,a,h,trig,tx,fn,m,tags});
export const PETS=[
 // ---------------- tier 1
 P('mouse','Sprout Mouse',1,2,2,'buy','Buy: give a random friend +{1} attack.',x=>{const f=x.rand(x.friends(),1)[0];if(f)x.buff(f,x.L,0);},{b:'quad',c:'#c8b8a8',c2:'#ffd0d8',e:'round',t:'long',s:.7,sn:.5},'buff'),
 P('crab','Pebble Crab',1,1,3,'hurt','Hurt: gain +{1} attack.',x=>x.buff(x.me,x.L,0),{b:'crab',c:'#ff6a4a',c2:'#ffd0b0',s:.75},'hurt tank'),
 P('bee','Bumblebee',1,2,1,'faint','Faint: deal {1} damage to a random enemy.',x=>{const f=x.rand(x.foes(),1)[0];if(f)x.dmg(f,x.L);},{b:'bug',c:'#ffcf2a',c2:'#2a2a2a',wings:1,stripes:1,s:.6},'faint snipe'),
 P('frog','Pond Frog',1,2,3,'endTurn','End turn: give the friend ahead +{1} health.',x=>{const f=x.ahead(1)[0];if(f)x.buff(f,0,x.L);},{b:'frog',c:'#5ad04a',c2:'#f0f0a0',s:.75},'buff'),
 P('bunny','Dust Bunny',1,1,2,'sell','Sell: give all friends +{1} health.',x=>x.friends().forEach(f=>x.buff(f,0,x.L)),{b:'quad',c:'#e8e0f0',c2:'#ffb0c8',e:'long',t:'stub',s:.7,sn:.3},'buff'),
 P('cricket','Field Cricket',1,1,2,'faint','Faint: summon a {1}/{1} Chirpling.',x=>x.summon({id:'chirp',a:x.L,h:x.L},x.idx),{b:'bug',c:'#7aa83a',c2:'#3a5a1a',s:.65,legs2:1},'faint summon'),
 P('snail','Moss Snail',1,1,4,'start','Start of battle: gain +{1} health for each friend.',x=>x.buff(x.me,0,x.L*x.friends().length),{b:'snail',c:'#c8b080',c2:'#7ab84a',s:.7},'tank'),
 P('piglet','Piglet',1,3,1,'sell','Sell: gain {1} extra gold.',x=>x.gold(x.L),{b:'quad',c:'#ffb0c0',c2:'#ff8aa8',e:'flop',t:'curl',s:.7,sn:.4,snout:1},'eco'),
 P('duckling','Duckling',1,2,2,'sell','Sell: give shop pets +{1} health.',x=>x.shopPets().forEach(f=>x.buff(f,0,x.L)),{b:'bird',c:'#ffe04a',c2:'#ff9a2a',s:.65},'eco'),
 P('firefly','Firefly',1,1,1,'start','Start of battle: deal {1} damage to the weakest enemy.',x=>{const f=x.foes().sort((a,b)=>a.h-b.h)[0];if(f)x.dmg(f,x.L);},{b:'bug',c:'#3a3a2a',c2:'#d8ff4a',glow:'#d8ff4a',wings:1,s:.55},'start snipe'),
 P('kitten','Kitten',1,2,2,'summoned','Friend summoned: give it +{1} attack.',(x,o)=>x.buff(o,x.L,0),{b:'quad',c:'#ffa04a',c2:'#fff0e0',e:'point',t:'long',s:.7,sn:.3,stripes:1},'summon'),
 // ---------------- tier 2
 P('otter','River Otter',2,2,3,'buy','Buy: give two random friends +{1} attack.',x=>x.rand(x.friends(),2).forEach(f=>x.buff(f,x.L,0)),{b:'quad',c:'#8a5a3a',c2:'#e8c8a0',e:'round',t:'flat',s:.8,sn:.4,long:1},'buff'),
 P('hedgehog','Hedgehog',2,3,2,'faint','Faint: deal {2} damage to ALL pets.',x=>x.all().forEach(f=>x.dmg(f,2*x.L)),{b:'quad',c:'#8a6a4a',c2:'#e8d0b0',e:'round',t:'none',s:.7,sn:.5,quills:1},'faint'),
 P('ram','Ram',2,2,4,'hurt','Hurt: give the friend behind +{2} attack.',x=>{const f=x.behind(1)[0];if(f)x.buff(f,2*x.L,0);},{b:'quad',c:'#f0ead8',c2:'#8a7a60',e:'horn',t:'stub',s:.85,sn:.3,wool:1},'hurt'),
 P('heron','Heron',2,3,2,'start','Start of battle: deal {2} damage to the last enemy.',x=>{const f=x.foes().slice(-1)[0];if(f)x.dmg(f,2*x.L);},{b:'bird',c:'#a8b8c8',c2:'#ffd04a',neck:1,legs:1,s:.85},'start snipe'),
 P('owlet','Owlet',2,2,3,'sell','Sell: give two random friends +{1}/+{1}.',x=>x.rand(x.friends(),2).forEach(f=>x.buff(f,x.L,x.L)),{b:'bird',c:'#b8946a',c2:'#f0e0c0',owl:1,s:.7},'buff'),
 P('bat','Fruit Bat',2,2,2,'faint','Faint: give the front enemy -{2} attack.',x=>{const f=x.foes()[0];if(f)x.buff(f,-Math.min(f.a-1,2*x.L),0);},{b:'quad',c:'#5a4a6a',c2:'#c8a0d8',e:'point',t:'none',s:.65,sn:.3,batwings:1},'faint'),
 P('squirrel','Squirrel',2,2,3,'endTurn','End turn: if you saved 2+ gold, gain +{1}/+{1}.',x=>{if(x.goldLeft()>=2)x.buff(x.me,x.L,x.L);},{b:'quad',c:'#c8743a',c2:'#ffe0c0',e:'tuft',t:'fluffy',s:.7,sn:.3},'eco tank'),
 P('tortoise','Tortoise',2,1,5,'faint','Faint: give the {1} friend(s) behind Iron Acorn armour.',x=>x.behind(x.L).forEach(f=>x.perk(f,'armor')),{b:'turtle',c:'#7a9a4a',c2:'#8a6a3a',s:.8},'faint tank'),
 P('raccoon','Raccoon',2,3,3,'eat','Eats food: gain an extra +{1}/+{1}.',x=>x.buff(x.me,x.L,x.L),{b:'quad',c:'#8a8a90',c2:'#2a2a30',e:'round',t:'fluffy',s:.75,sn:.4,mask:1,stripes:1},'buff'),
 P('gecko','Gecko',2,3,1,'start','Start of battle: gain +{1}/+{1} for each empty slot.',x=>{const e=5-x.friends().length-1;x.buff(x.me,x.L*e,x.L*e);},{b:'quad',c:'#4ad8a0',c2:'#ffe04a',e:'none',t:'long',s:.6,sn:.4,flat:1,spots:1},'start'),
 P('lamb','Lamb',2,2,3,'friendAheadFaint','Friend ahead faints: gain +{2} health.',x=>x.buff(x.me,0,2*x.L),{b:'quad',c:'#fffaf0',c2:'#2a2a2a',e:'flop',t:'stub',s:.65,sn:.25,wool:1},'tank'),
 // ---------------- tier 3
 P('fox','Red Fox',3,4,3,'before','Before attack: steal {1} attack from the front enemy.',x=>{const f=x.foes()[0];if(f&&f.a>1){const s=Math.min(f.a-1,x.L);x.buff(f,-s,0);x.buff(x.me,s,0);}},{b:'quad',c:'#ff7a2a',c2:'#fff0e0',e:'point',t:'fluffy',s:.85,sn:.6},'attack'),
 P('beaver','Beaver',3,2,4,'endTurn','End turn: give the friend behind +{1}/+{1}.',x=>{const f=x.behind(1)[0];if(f)x.buff(f,x.L,x.L);},{b:'quad',c:'#8a5a2a',c2:'#ffe0a0',e:'round',t:'flat',s:.8,sn:.35,teeth:1},'buff'),
 P('badger','Honey Badger',3,4,3,'hurt','Hurt: deal {2} damage to the front enemy.',x=>{const f=x.foes()[0];if(f)x.dmg(f,2*x.L);},{b:'quad',c:'#2a2a2e',c2:'#e8e8e8',e:'round',t:'stub',s:.8,sn:.45,stripeTop:1},'hurt'),
 P('snowowl','Snow Owl',3,3,4,'start','Start of battle: give all friends +{1} attack.',x=>x.friends().forEach(f=>x.buff(f,x.L,0)),{b:'bird',c:'#f4f8ff',c2:'#3a3a3a',owl:1,s:.8,spots:1},'start buff'),
 P('sheepdog','Sheepdog',3,3,3,'summoned','Friend summoned: gain +{1}/+{1}.',x=>x.buff(x.me,x.L,x.L),{b:'quad',c:'#2a2a2a',c2:'#ffffff',e:'flop',t:'fluffy',s:.85,sn:.5,patch:1},'summon'),
 P('sheep','Woolly Sheep',3,2,2,'faint','Faint: summon two {2}/{2} Lambkins.',x=>{x.summon({id:'lambkin',a:2*x.L,h:2*x.L},x.idx);x.summon({id:'lambkin',a:2*x.L,h:2*x.L},x.idx);},{b:'quad',c:'#fffaf0',c2:'#4a4a4a',e:'flop',t:'stub',s:.85,sn:.25,wool:1},'faint summon'),
 P('parrot','Parrot',3,3,3,'endTurn','End turn: give a random friend +{1}/+{1}.',x=>{const f=x.rand(x.friends(),1)[0];if(f)x.buff(f,x.L,x.L);},{b:'bird',c:'#2ad84a',c2:'#ff3a3a',crest:1,s:.75},'buff'),
 P('camel','Camel',3,2,5,'hurt','Hurt: give the friend behind +{1}/+{2}.',x=>{const f=x.behind(1)[0];if(f)x.buff(f,x.L,2*x.L);},{b:'quad',c:'#d8a860',c2:'#a87840',e:'round',t:'stub',s:1,sn:.5,hump:1,long:1},'hurt tank'),
 P('toucan','Toucan',3,3,2,'start','Start of battle: deal {2} damage to the strongest enemy.',x=>{const f=x.foes().sort((a,b)=>b.a-a.a)[0];if(f)x.dmg(f,2*x.L);},{b:'bird',c:'#1a1a1a',c2:'#ff9a1a',bigbeak:1,s:.75},'start snipe'),
 P('skunk','Skunk',3,3,5,'start','Start of battle: strip the perks of the {1} strongest enemies.',x=>x.foes().sort((a,b)=>b.a-a.a).slice(0,x.L).forEach(f=>x.perk(f,null)),{b:'quad',c:'#1a1a22',c2:'#ffffff',e:'round',t:'fluffy',s:.8,sn:.4,stripeTop:1},'start'),
 P('meerkat','Meerkat',3,2,4,'startTurn','Start of turn: give the front friend +{1}/+{1}.',x=>{const f=x.friends(true)[0];if(f)x.buff(f,x.L,x.L);},{b:'quad',c:'#d8b080',c2:'#5a4030',e:'round',t:'long',s:.7,sn:.4,upright:1},'buff'),
 // ---------------- tier 4
 P('hippo','Hippo',4,4,6,'ko','Knock out: gain +{2}/+{2}.',x=>x.buff(x.me,2*x.L,2*x.L),{b:'quad',c:'#9a8aa8',c2:'#ffb0c0',e:'round',t:'stub',s:1.15,sn:.6,wide:1},'attack'),
 P('bison','Bison',4,5,5,'endTurn','End turn: gain +{1}/+{1} for each tier-1 friend.',x=>{const n=x.friends().filter(f=>x.tierOf(f)===1).length;if(n)x.buff(x.me,n*x.L,n*x.L);},{b:'quad',c:'#5a3a22',c2:'#2a1a10',e:'horn',t:'stub',s:1.1,sn:.4,hump:1,mane:1},'tank'),
 P('puffer','Pufferfish',4,3,6,'hurt','Hurt: deal {2} damage to a random enemy.',x=>{const f=x.rand(x.foes(),1)[0];if(f)x.dmg(f,2*x.L);},{b:'fish',c:'#f0d070',c2:'#ffffff',spikes:1,round:1,s:.85},'hurt'),
 P('penguin','Emperor Penguin',4,3,5,'endTurn','End turn: give level 2+ friends +{1}/+{1}.',x=>x.friends().filter(f=>f.lv>=2).forEach(f=>x.buff(f,x.L,x.L)),{b:'bird',c:'#22263a',c2:'#ffffff',upright:1,s:.85},'buff'),
 P('llama','Llama',4,3,6,'endTurn','End turn: with 4 or fewer pets, gain +{1}/+{2}.',x=>{if(x.friends().length<=3)x.buff(x.me,x.L,2*x.L);},{b:'quad',c:'#f0e0c8',c2:'#c89a6a',e:'long',t:'stub',s:1,sn:.4,neck:1,wool:1},'tank'),
 P('wolf','Pack Wolf',4,5,4,'friendFaint','Friend faints: gain +{1} attack.',x=>x.buff(x.me,x.L,0),{b:'quad',c:'#7a8090',c2:'#e0e4ea',e:'point',t:'fluffy',s:1,sn:.6},'attack'),
 P('armadillo','Armadillo',4,2,7,'start','Start of battle: give the two friends behind +{2} health.',x=>x.behind(2).forEach(f=>x.buff(f,0,2*x.L)),{b:'quad',c:'#b89a7a',c2:'#8a6a50',e:'point',t:'long',s:.85,sn:.5,plates:1},'start tank'),
 P('moose','Moose',4,4,5,'faint','Faint: give a random friend +{2}/+{2}.',x=>{const f=x.rand(x.friends(),1)[0];if(f)x.buff(f,2*x.L,2*x.L);},{b:'quad',c:'#6a4a2a',c2:'#d8c0a0',e:'antler',t:'stub',s:1.15,sn:.6},'faint buff'),
 P('seal','Harbor Seal',4,3,5,'eat','Eats food: give two random friends +{1}/+{1}.',x=>x.rand(x.friends(),2).forEach(f=>x.buff(f,x.L,x.L)),{b:'fish',c:'#8a9aa8',c2:'#c8d0d8',seal:1,s:.9},'buff'),
 P('croc','Crocodile',4,4,4,'start','Start of battle: deal {3} damage to the last enemy.',x=>{const f=x.foes().slice(-1)[0];if(f)x.dmg(f,3*x.L);},{b:'quad',c:'#3a8a3a',c2:'#c8d880',e:'none',t:'long',s:1,sn:.9,flat:1,teethRow:1},'start snipe'),
 P('stag','Stag Beetle',4,5,3,'before','Before attack: gain +{1} attack.',x=>x.buff(x.me,x.L,0),{b:'bug',c:'#3a2a5a',c2:'#8a6aff',mandibles:1,s:.85},'attack'),
 // ---------------- tier 5
 P('shark','Reef Shark',5,4,5,'friendFaint','Friend faints: gain +{2}/+{1}.',x=>x.buff(x.me,2*x.L,x.L),{b:'fish',c:'#6a8aa8',c2:'#f0f4f8',fin:1,s:1.1},'attack'),
 P('gobbler','Gobbler',5,3,4,'summoned','Friend summoned: give it +{2}/+{2}.',(x,o)=>x.buff(o,2*x.L,2*x.L),{b:'bird',c:'#7a4a2a',c2:'#ff3a3a',fan:1,s:.95},'summon'),
 P('rhino','Rhino',5,6,7,'ko','Knock out: deal {4} damage to the new front enemy.',x=>{const f=x.foes()[0];if(f)x.dmg(f,4*x.L);},{b:'quad',c:'#8a8a90',c2:'#c8c8c8',e:'round',t:'stub',s:1.2,sn:.6,horn1:1,wide:1},'attack'),
 P('leopard','Snow Leopard',5,8,4,'start','Start of battle: deal a third of its attack to {1}+1 random enemies.',x=>x.rand(x.foes(),x.L+1).forEach(f=>x.dmg(f,Math.ceil(x.me.a/3))),{b:'quad',c:'#e8e8f0',c2:'#5a5a6a',e:'round',t:'fluffy',s:1,sn:.4,spots:1},'start snipe'),
 P('gorilla','Gorilla',5,6,8,'hurt','Hurt: gain a Bubble ({1} time(s) per battle).',x=>{if((x.me.uses||0)<x.L){x.me.uses=(x.me.uses||0)+1;x.perk(x.me,'bubble');}},{b:'ape',c:'#3a3a40',c2:'#8a8a90',s:1.15},'tank'),
 P('scorpion','Scorpion',5,1,1,'passive','Its attacks knock out anything they damage. Level scales stats.',null,{b:'scorpion',c:'#c8743a',c2:'#4a2a1a',s:.8},'attack'),
 P('eagle','Golden Eagle',5,5,5,'faint','Faint: summon a {3}/{3} Eaglet.',x=>x.summon({id:'eaglet',a:3*x.L,h:3*x.L},x.idx),{b:'bird',c:'#6a4a2a',c2:'#ffe0a0',hook:1,s:1},'faint summon'),
 P('cow','Meadow Cow',5,4,6,'buy','Buy: give all friends +{1}/+{1}.',x=>x.friends().forEach(f=>x.buff(f,x.L,x.L)),{b:'quad',c:'#ffffff',c2:'#2a2a2a',e:'horn',t:'long',s:1.1,sn:.5,spots:1},'buff'),
 P('monkey','Monkey',5,3,5,'endTurn','End turn: give the front friend +{2}/+{3}.',x=>{const f=x.friends(true)[0];if(f)x.buff(f,2*x.L,3*x.L);},{b:'ape',c:'#a86a3a',c2:'#f0d0a8',s:.8,tail:1},'buff'),
 P('polarbear','Polar Bear',5,5,6,'start','Start of battle: gain +{1} attack per enemy.',x=>x.buff(x.me,x.L*x.foes().length,0),{b:'quad',c:'#f8f8f4',c2:'#2a2a2a',e:'round',t:'stub',s:1.2,sn:.5},'start'),
 P('chameleon','Chameleon',5,4,4,'start','Start of battle: gain +{1}/+{1} per different tier among friends.',x=>{const n=new Set(x.friends().map(f=>x.tierOf(f))).size;x.buff(x.me,n*x.L,n*x.L);},{b:'quad',c:'#4ac85a',c2:'#ff6aa0',e:'none',t:'curl',s:.8,sn:.4,crest:1,flat:1},'start'),
 // ---------------- tier 6
 P('whale','Whale',6,3,8,'faint','Faint: summon a {5}/{5} Calf.',x=>x.summon({id:'calf',a:5*x.L,h:5*x.L},x.idx),{b:'fish',c:'#3a5a9a',c2:'#d8e4f0',whale:1,s:1.35},'faint summon tank'),
 P('dragon','Ember Dragon',6,6,8,'endTurn','End turn: give all friends +{1} attack.',x=>x.friends().forEach(f=>x.buff(f,x.L,0)),{b:'quad',c:'#d83a2a',c2:'#ffc04a',e:'horn',t:'long',s:1.2,sn:.6,dragonwings:1,spikes:1},'buff'),
 P('tiger','Tiger',6,6,4,'before','Before attack: deal {2} damage to the second enemy.',x=>{const f=x.foes()[1];if(f)x.dmg(f,2*x.L);},{b:'quad',c:'#ff8a2a',c2:'#1a1a1a',e:'round',t:'long',s:1.1,sn:.45,stripes:1},'attack'),
 P('mammoth','Woolly Mammoth',6,4,10,'faint','Faint: give all friends +{2}/+{2}.',x=>x.friends().forEach(f=>x.buff(f,2*x.L,2*x.L)),{b:'quad',c:'#7a5a3a',c2:'#fff8e8',e:'flop',t:'stub',s:1.35,sn:.6,trunk:1,tusks:1,wool:1},'faint tank'),
 P('lion','Lion',6,7,7,'endTurn','End turn: gain +{2}/+{2} if it is your strongest pet.',x=>{if(x.friends().every(f=>f.a+f.h<=x.me.a+x.me.h))x.buff(x.me,2*x.L,2*x.L);},{b:'quad',c:'#e8a84a',c2:'#8a4a1a',e:'round',t:'long',s:1.2,sn:.45,mane:1},'tank'),
 P('python','Python',6,6,6,'before','Before attack: deal {3} damage to a random enemy.',x=>{const f=x.rand(x.foes(),1)[0];if(f)x.dmg(f,3*x.L);},{b:'snake',c:'#6a8a2a',c2:'#e8d84a',s:1.1},'attack'),
 P('phoenix','Phoenix',6,5,5,'faint','Faint: return reborn with {3} health (once).',x=>{if(!x.me.reborn)x.summon({id:'phoenix',a:x.me.a,h:3*x.L,reborn:1,lv:x.L},x.idx);},{b:'bird',c:'#ff5a1a',c2:'#ffe04a',glow:'#ff8a2a',crest:1,fan:1,s:1},'faint'),
 P('kraken','Kraken',6,6,9,'start','Start of battle: deal {2} damage to all enemies.',x=>x.foes().forEach(f=>x.dmg(f,2*x.L)),{b:'octo',c:'#a83a8a',c2:'#ffb0e0',s:1.2},'start'),
 P('unicorn','Unicorn',6,4,6,'friendFaint','Friend faints: give all friends +{1} health.',x=>x.friends().forEach(f=>x.buff(f,0,x.L)),{b:'quad',c:'#ffffff',c2:'#ff9ae8',e:'point',t:'fluffy',s:1.05,sn:.5,horn1:1,mane:1},'tank'),
 P('panda','Giant Panda',6,5,7,'start','Start of battle: give the {1} friend(s) ahead a Bubble.',x=>x.ahead(x.L).forEach(f=>x.perk(f,'bubble')),{b:'quad',c:'#f4f4f4',c2:'#1a1a1a',e:'round',t:'stub',s:1.15,sn:.35,patch:1,eyepatch:1},'start'),
 P('yak','Yak',6,5,9,'endTurn','End turn: gain +{2} health.',x=>x.buff(x.me,0,2*x.L),{b:'quad',c:'#4a3a2a',c2:'#d8c8b0',e:'horn',t:'fluffy',s:1.2,sn:.45,wool:1,mane:1},'tank')];
export const TOKENS={
 chirp:{id:'chirp',n:'Chirpling',t:1,a:1,h:1,tx:'A tiny cricket ghost.',m:{b:'bug',c:'#bfe0a0',c2:'#7aa83a',s:.5},token:1},
 lambkin:{id:'lambkin',n:'Lambkin',t:1,a:2,h:2,tx:'Summoned by the Woolly Sheep.',m:{b:'quad',c:'#ffffff',c2:'#5a5a5a',e:'flop',t:'stub',s:.55,sn:.25,wool:1},token:1},
 eaglet:{id:'eaglet',n:'Eaglet',t:1,a:3,h:3,tx:'Summoned by the Golden Eagle.',m:{b:'bird',c:'#a87a4a',c2:'#ffe0a0',hook:1,s:.6},token:1},
 calf:{id:'calf',n:'Whale Calf',t:1,a:5,h:5,tx:'Summoned by the Whale.',m:{b:'fish',c:'#5a7ac8',c2:'#e0ecf8',whale:1,s:.8},token:1},
 bumble:{id:'bumble',n:'Bumble',t:1,a:1,h:1,tx:'Summoned by Honeycomb.',m:{b:'bug',c:'#ffcf2a',c2:'#2a2a2a',wings:1,stripes:1,s:.45},token:1}};
// trigger names shown in callouts
export const TRIG={buy:'BUY',sell:'SELL',endTurn:'END TURN',startTurn:'START OF TURN',eat:'EAT',start:'START',before:'BEFORE ATTACK',hurt:'HURT',faint:'FAINT',friendAheadFaint:'FRIEND AHEAD FAINTS',friendFaint:'FRIEND FAINTS',summoned:'FRIEND SUMMONED',ko:'KNOCK OUT',passive:'VENOM'};

const F=(id,n,t,tx,k,o={})=>({id,n,t,tx,k,...o});// k: how the food applies
export const FOODS=[
 F('clover','Clover',1,'Give a pet +1/+1.','stat',{a:1,h:1,col:'#5ad04a'}),
 F('honey','Honeycomb',1,'Perk — Faint: summon a 1/1 Bumble.','perk',{perk:'honey',col:'#ffb02a'}),
 F('seeds','Sunflower Seeds',2,'Give a pet +2 attack.','stat',{a:2,h:0,col:'#e8c84a'}),
 F('carrot','Carrot Bundle',2,'Give two random pets +1/+1.','multi',{a:1,h:1,cnt:2,col:'#ff8a2a'}),
 F('cookie','Cookie',2,'Give a pet +3/+3 until the end of the next battle.','temp',{a:3,h:3,col:'#c88a4a'}),
 F('tea','Tea Leaf',3,'Give a pet +1 experience.','xp',{cnt:1,col:'#6ab04a'}),
 F('acorn','Iron Acorn',3,'Perk — take 2 less damage from every hit.','perk',{perk:'armor',col:'#8a8a9a'}),
 F('rice','Rice Ball',3,'Give a pet +3 health.','stat',{a:0,h:3,col:'#f4f4f4'}),
 F('chili','Chili Pepper',4,'Perk — attacks also deal 4 damage to the enemy behind.','perk',{perk:'chili',col:'#ff3a2a'}),
 F('shroom','Glow Mushroom',4,'Perk — faint: come back as a 1/1.','perk',{perk:'revive',col:'#8a6aff'}),
 F('platter','Feast Platter',4,'Give ALL pets +1/+1.','all',{a:1,h:1,col:'#ffd04a'}),
 F('bun','Spice Bun',4,'Perk — +8 attack on the first attack of each battle.','perk',{perk:'meat',col:'#d86a3a'}),
 F('jar','Pantry Jar',4,'All shop pets get +1/+1 for the rest of the run.','shop',{a:1,h:1,col:'#a8c8e8'}),
 F('starfruit','Star Fruit',5,'Give a pet +3/+3.','stat',{a:3,h:3,col:'#ffe04a'}),
 F('melon','Moon Melon',5,'Perk — Bubble: blocks the first 15 damage.','perk',{perk:'bubble',col:'#7aff9a'}),
 F('goldclover','Golden Clover',5,'Give a pet +2 experience and +1/+1.','xp',{cnt:2,a:1,h:1,col:'#ffd700'}),
 F('truffle','Golden Truffle',6,'Give ALL pets +2/+2.','all',{a:2,h:2,col:'#c8a040'}),
 F('cake','Thunder Cake',6,'Perk — start of battle: deal 6 damage to a random enemy.','perk',{perk:'thunder',col:'#7ac8ff'}),
 F('dragonfruit','Dragonfruit',6,'Give a pet +4/+4.','stat',{a:4,h:4,col:'#ff4a9a'})];
export const PERKS={honey:{n:'Honeycomb',ic:'🍯',d:'Faint: summon a 1/1 Bumble.'},armor:{n:'Iron Acorn',ic:'🛡',d:'Takes 2 less damage per hit (min 1).'},chili:{n:'Chili',ic:'🌶',d:'Attacks splash 4 to the enemy behind.'},revive:{n:'Glow Mushroom',ic:'🍄',d:'Faint: come back as 1/1.'},meat:{n:'Spice Bun',ic:'🥐',d:'+8 attack on its first attack.'},bubble:{n:'Bubble',ic:'🫧',d:'Blocks the first 15 damage.'},thunder:{n:'Thunder Cake',ic:'⚡',d:'Start of battle: 6 damage to a random enemy.'}};

// ghost archetypes: preferred tags + a flavour name
export const ARCH=[{k:'summon',n:'Summoners',tags:['summon','faint']},{k:'snipe',n:'Snipers',tags:['snipe','start']},{k:'tank',n:'Bulwark',tags:['tank','hurt']},{k:'buff',n:'Feeders',tags:['buff','eco']},{k:'attack',n:'Bruisers',tags:['attack','hurt']},{k:'faint',n:'Last Words',tags:['faint']}];
export const ADJ=['Mossy','Thunder','Velvet','Crimson','Sleepy','Rowdy','Frosty','Golden','Muddy','Sneaky','Lucky','Grumpy','Sunny','Midnight','Bramble','Pebble','Turbo','Fuzzy','Salty','Wild'];
export const NOUN=['Paws','Hooligans','Burrowers','Stampede','Snouts','Whiskers','Brigade','Tails','Rascals','Nibblers','Howlers','Crew','Herd','Flock','Pack','Squad','Rumblers','Gang','Club','Choir'];
export const petById=id=>PETS.find(p=>p.id===id)||TOKENS[id];
export const foodById=id=>FOODS.find(f=>f.id===id);
export const tierFor=turn=>Math.min(6,1+Math.floor((turn-1)/2));
export const fmtTx=(tx,L)=>tx.replace(/\{(\d)\}/g,(_,n)=>String(+n*L));
