// KART GRAND PRIX — static game data: drivers, kart parts, items, cups and courses.
// Every name and design here is original to Pixel Arcade.

/* ---------- drivers: 8 characters in 3 weight classes ---------- */
export const CLASS={
 light:{n:'LIGHT',spd:2,acc:5,wgt:1,hdl:5,trc:4,mt:4.5},
 mid:{n:'MIDDLE',spd:3.5,acc:3.5,wgt:3,hdl:3.5,trc:3,mt:3},
 heavy:{n:'HEAVY',spd:5,acc:2,wgt:5,hdl:2,trc:2,mt:2}};
export const CHARS=[
 {id:'pip',n:'PIP',sp:'chick',cls:'light',col:0xffd23a,col2:0xff8a1e,kart:0xff5a36,blurb:'Pocket-sized chick. Rockets off the line.'},
 {id:'mochi',n:'MOCHI',sp:'bunny',cls:'light',col:0xfff4f6,col2:0xff9ec4,kart:0xff6fb5,blurb:'Floppy-eared bunny with a hair-trigger drift.'},
 {id:'bolt',n:'BOLT',sp:'bot',cls:'light',col:0x48e0d0,col2:0x1d2a3a,kart:0x2ad1ff,blurb:'Tiny tinkerer robot. All grip, no fear.'},
 {id:'juno',n:'JUNO',sp:'fox',cls:'mid',col:0xff7a2a,col2:0xfff1df,kart:0xffb21e,blurb:'Cool-headed fox. Balanced in every way.'},
 {id:'kiko',n:'KIKO',sp:'cat',cls:'mid',col:0x9c8cff,col2:0xf2ecff,kart:0x7a55ff,blurb:'Night-cruising cat. Lands on her wheels.'},
 {id:'tango',n:'TANGO',sp:'frog',cls:'mid',col:0x5fd85a,col2:0xf2ffc8,kart:0x1fbf6a,blurb:'Bouncy frog. Never met a ramp he disliked.'},
 {id:'bruno',n:'BRUNO',sp:'bear',cls:'heavy',col:0x8a5a34,col2:0xf0d2a8,kart:0xd8402a,blurb:'Big-hearted bear. Shoves first, waves later.'},
 {id:'titan',n:'TITAN',sp:'mech',cls:'heavy',col:0x5b6578,col2:0xff8c1a,kart:0x30384a,blurb:'Hulking mech. Top speed is a lifestyle.'}];

/* ---------- kart parts ---------- */
export const BODIES=[
 {id:'racer',n:'STANDARD',spd:0,acc:0,wgt:0,hdl:0,trc:0,mt:0},
 {id:'dart',n:'DART',spd:1,acc:-.5,wgt:-.5,hdl:.5,trc:-.5,mt:.5},
 {id:'rover',n:'ROVER',spd:-.5,acc:1,wgt:.5,hdl:-.5,trc:1.5,mt:0},
 {id:'brick',n:'BRICK',spd:.5,acc:-1,wgt:1.5,hdl:-1,trc:.5,mt:-.5}];
export const WHEELS=[
 {id:'std',n:'STANDARD',spd:0,acc:0,wgt:0,hdl:0,trc:0,mt:0},
 {id:'slick',n:'SLICK',spd:1,acc:-.5,wgt:0,hdl:.5,trc:-1.5,mt:0},
 {id:'monster',n:'MONSTER',spd:-.5,acc:-.5,wgt:1,hdl:-.5,trc:2,mt:-.5},
 {id:'cyber',n:'CYBER',spd:0,acc:1,wgt:-.5,hdl:0,trc:0,mt:1}];
export const GLIDERS=[
 {id:'wing',n:'DELTA WING',spd:0,acc:0,wgt:0,hdl:0,trc:0,mt:0,glide:1},
 {id:'para',n:'PARAFOIL',spd:-.25,acc:.5,wgt:0,hdl:0,trc:0,mt:0,glide:1.15},
 {id:'kite',n:'BOX KITE',spd:.25,acc:-.25,wgt:.25,hdl:.25,trc:0,mt:0,glide:.9}];
export const STATS=[['spd','SPEED'],['acc','ACCEL'],['wgt','WEIGHT'],['hdl','HANDLING'],['trc','TRACTION'],['mt','MINI-TURBO']];
export function statsOf(ch,b,w,g){const c=CLASS[ch.cls],o={};for(const[k]of STATS)o[k]=Math.max(0,Math.min(6,c[k]+BODIES[b][k]+WHEELS[w][k]+GLIDERS[g][k]));o.glide=GLIDERS[g].glide;return o;}

/* ---------- engine classes ---------- */
export const CC=[{n:'50CC',v:25,acc:.85,ai:.92},{n:'100CC',v:30.5,acc:.95,ai:.97},{n:'150CC',v:36,acc:1.05,ai:1}];
export const DIFF=[{n:'EASY',line:.55,drift:.3,item:.35,rubber:.06,skill:.82,react:.5},{n:'NORMAL',line:.8,drift:.7,item:.7,rubber:.1,skill:.93,react:.3},{n:'HARD',line:1,drift:1,item:.9,rubber:.13,skill:.985,react:.15}];
export const POINTS=[15,12,10,9,8,7,6,5,4,3,2,1];

/* ---------- items ---------- */
// weights per position band: [front, upper-mid, lower-mid, back]
export const ITEMS={
 coin:{n:'COIN',w:[30,10,2,0]},
 peel:{n:'SLICK PEEL',w:[30,14,6,0]},
 orb:{n:'TRIPLE ORBS',w:[12,16,10,4]},
 seeker:{n:'SEEKER ORB',w:[6,18,16,10]},
 bomb:{n:'BOOM BOMB',w:[8,12,10,6]},
 pepper:{n:'TURBO PEPPER',w:[10,18,20,18]},
 pepper3:{n:'TRIPLE PEPPER',w:[0,6,14,22]},
 bolt:{n:'SHRINK BOLT',w:[0,1,6,12]},
 aura:{n:'PRISM AURA',w:[0,3,12,22]}};
export const ITEM_IDS=Object.keys(ITEMS);
export function rollItem(place,total,rng=Math.random,battle=false){
 const f=total>1?(place-1)/(total-1):0,band=battle?1:f<.12?0:f<.45?1:f<.75?2:3;
 const pool=ITEM_IDS.filter(k=>!(battle&&(k==='coin'||k==='bolt'||k==='pepper3')));
 let sum=0;for(const k of pool)sum+=ITEMS[k].w[band];let r=rng()*sum;for(const k of pool){r-=ITEMS[k].w[band];if(r<=0)return k;}return 'peel';}

/* ---------- courses ----------
 pts: [x,z,y,halfWidth] closed loop (scaled by sc). cuts: shortcuts from fraction a to b through pts.
 feats (s = fraction of the main loop): ramp, boost, jump, glide (launch pad) + gap, water, patch (mud/ice/sand/oil), boxes, coins, haz.
*/
export const THEMES={
 seaside:{sky:[0x2f7fe0,0xbfe6ff],sun:[.55,.62,.35],sunC:0xfff2d8,sunI:3.1,hemi:[0xcfe8ff,0xd8c49a,.9],fog:[0xbfe2f5,.0016],exp:1.0,ground:0xe6d3a0,ground2:0x6aa84f,road:'asphalt',curb:[0xff4060,0xffffff],wall:'rope',seaY:0,sea:0x1f9ec8,props:['palm','umbrella','rock','hut','lighthouse','boat'],music:{bpm:132,root:62,mode:'maj'}},
 jungle:{sky:[0x3b8fd0,0xd6f2d0],sun:[.3,.7,.5],sunC:0xfff0c8,sunI:2.6,hemi:[0xd8ffd0,0x2d4a20,.95],fog:[0xa9d8b0,.0024],exp:1.0,ground:0x3f7a2c,ground2:0x2a5a22,road:'stone',curb:[0xd8b24a,0x6a5a3a],wall:'stone',seaY:-14,sea:0x2a8a7a,props:['jtree','fern','pillar','idol','rock','vine'],music:{bpm:118,root:57,mode:'dor'}},
 snow:{sky:[0x4a86d8,0xeaf4ff],sun:[.4,.55,-.6],sunC:0xfff8f0,sunI:2.8,hemi:[0xe8f2ff,0x9ab0c8,1.0],fog:[0xdfeaf8,.0022],exp:.92,ground:0xf4f8ff,ground2:0xc8d8ea,road:'packed',curb:[0x2a7aff,0xffffff],wall:'snowbank',props:['pine','snowman','crystal','rock','cabin','flagpole'],music:{bpm:126,root:64,mode:'maj'}},
 desert:{sky:[0x3a78c8,0xffd9a0],sun:[-.6,.45,.4],sunC:0xffe0b0,sunI:3.2,hemi:[0xffe8c8,0xb06a3a,.85],fog:[0xf2c896,.0018],exp:1.0,ground:0xe0a060,ground2:0xc07040,road:'clay',curb:[0xffffff,0xd84a2a],wall:'rock',props:['cactus','mesa','rock','skull','bones','tent'],music:{bpm:124,root:55,mode:'phr'}},
 city:{sky:[0x05061a,0x2a1450],sun:[.3,.8,.2],sunC:0x9ab0ff,sunI:.9,hemi:[0x5a6aff,0x1a0a2a,.55],fog:[0x1a1238,.0028],exp:1.15,night:true,ground:0x15151f,ground2:0x22202e,road:'neon',curb:[0xff2a8a,0x2ae0ff],wall:'neon',props:['tower','lamp','sign','billboard','tower2','tree'],music:{bpm:140,root:52,mode:'min'}},
 volcano:{sky:[0x1a0a0a,0x8a2a12],sun:[.2,.5,.6],sunC:0xffb080,sunI:1.6,hemi:[0xff9a6a,0x2a0a05,.6],fog:[0x4a1a0e,.0042],exp:1.05,night:true,ground:0x2a2224,ground2:0x3a2a28,road:'basalt',curb:[0xff5a1a,0x2a2a2a],wall:'basalt',lavaY:-10,props:['vrock','spire','ember','skull','vent','cone'],music:{bpm:146,root:50,mode:'phr'}},
 haunted:{sky:[0x0a0a20,0x3a2a5a],sun:[-.4,.6,-.5],sunC:0xb8c8ff,sunI:1.1,hemi:[0x8a8aff,0x1a1a2a,.6],fog:[0x2a2440,.0045],exp:1.1,night:true,ground:0x2a3a2a,ground2:0x1e2a22,road:'cobble',curb:[0x7a4aff,0x2a2a3a],wall:'fence',props:['deadtree','tomb','lantern','pumpkin','manor','crypt'],music:{bpm:112,root:53,mode:'min'}},
 sky:{sky:[0x2a3a8a,0xffb07a],sun:[-.7,.25,.5],sunC:0xffc890,sunI:2.6,hemi:[0xffd8c0,0x6a5aa0,.9],fog:[0xf0b0a0,.0012],exp:.95,ground:0xffffff,ground2:0xf0e0ff,road:'glass',curb:[0xffd040,0xffffff],wall:'none',fall:true,props:['cloud','island','balloon','pylon','ring','windmill'],music:{bpm:128,root:60,mode:'lyd'}},
 arena:{sky:[0x2a4a9a,0xffb07a],sun:[.5,.55,-.6],sunC:0xffe0c0,sunI:3.2,hemi:[0xffe0d0,0x6a4a4a,1.1],fog:[0xe0a080,.0022],exp:1.05,ground:0xb07850,ground2:0x8a5a40,road:'clay',curb:[0xffd040,0xff4d00],wall:'rock',props:['mesa','rock','cactus','tent'],music:{bpm:150,root:57,mode:'min'}}};

export const COURSES=[
 {id:'coast',n:'CORAL COAST',theme:'seaside',sc:1.3,w:12,
  pts:[[0,-110,2],[0,-20,2],[8,60,3],[45,118,6],[105,140,9],[165,120,7],[195,70,2.5],[200,15,-5.5],[192,-45,-6],[170,-100,1.5],[120,-130,3],[80,-110,4],[55,-150,5],[30,-200,4],[-5,-190,2.5]],
  cuts:[{a:.27,b:.41,w:6,surf:'sand',bend:-8}],
  feats:[{t:'boxes',s:.07},{t:'coins',s:.03,u:0,n:6},{t:'ramp',s:.14,len:14,h:3.2},{t:'haz',k:'crab',s:.2,n:2},{t:'boost',s:.245,u:-5},{t:'boost',s:.245,u:5},{t:'boost',s:.35,u:0,cut:0},{t:'boxes',s:.44},{t:'coins',s:.53,u:3,n:7},{t:'patch',surf:'sand',s:.58,u:-8,len:24,hw:4},{t:'jump',s:.66,u:0,hw:5},{t:'boxes',s:.71},{t:'ramp',s:.78,len:12,h:2.6},{t:'haz',k:'crab',s:.85,n:3},{t:'boxes',s:.92},{t:'coins',s:.88,u:-4,n:5}]},
 {id:'temple',n:'JADE TEMPLE',theme:'jungle',sc:.9,w:11,
  pts:[[0,-90,0],[0,10,0],[15,80,2],[70,115,6],[130,95,10],[150,40,12],[130,-10,12],[150,-60,12],[200,-80,12],[230,-30,4],[245,40,0],[230,120,0],[170,175,0],[90,190,1],[10,175,2],[-60,170,3],[-100,120,2],[-110,40,1],[-80,-30,0],[-60,-110,0],[-25,-150,0]],
  cuts:[{a:.20,b:.32,w:6,surf:'mud'}],
  feats:[{t:'boxes',s:.06},{t:'coins',s:.02,u:0,n:6},{t:'patch',surf:'mud',s:.11,u:-6,len:22,hw:4},{t:'ramp',s:.16,len:14,h:3},{t:'boost',s:.4,u:0,cut:0},{t:'haz',k:'boulder',s:.3,n:1},{t:'glide',s:.35,len:12},{t:'gap',s:.37,len:40},{t:'boxes',s:.46},{t:'jump',s:.55,u:4,hw:4},{t:'haz',k:'boulder',s:.62,n:1},{t:'patch',surf:'mud',s:.7,u:5,len:20,hw:4},{t:'boxes',s:.76},{t:'boost',s:.84,u:-4},{t:'coins',s:.9,u:3,n:6}]},
 {id:'summit',n:'FROSTBITE SUMMIT',theme:'snow',sc:1.3,w:12,
  pts:[[0,-100,0],[0,0,0],[15,70,3],[70,115,7],[140,110,12],[185,60,17],[195,-10,22],[170,-70,26],[140,-120,30],[90,-150,30],[40,-200,14],[-30,-200,5],[-40,-140,0]],
  cuts:[{a:.36,b:.47,w:6,surf:'off'}],
  feats:[{t:'boxes',s:.07},{t:'coins',s:.03,u:0,n:6},{t:'patch',surf:'ice',s:.16,u:0,len:30,hw:8},{t:'haz',k:'snowball',s:.27,n:2},{t:'boost',s:.4,u:0,cut:0},{t:'boxes',s:.33},{t:'ramp',s:.5,len:14,h:3},{t:'coins',s:.55,u:-3,n:6},{t:'patch',surf:'ice',s:.6,u:4,len:24,hw:6},{t:'boxes',s:.65},{t:'glide',s:.71,len:12},{t:'gap',s:.73,len:46},{t:'haz',k:'snowball',s:.86,n:2},{t:'boxes',s:.88},{t:'boost',s:.95,u:4}]},
 {id:'canyon',n:'DUNE CANYON',theme:'desert',sc:1.0,w:12,
  pts:[[0,-100,0],[0,10,0],[20,60,1],[80,70,2],[100,20,3],[140,-10,4],[190,20,5],[200,80,6],[240,120,6],[300,110,6],[320,50,5],[300,-30,4],[320,-100,3],[280,-160,2],[200,-170,1],[120,-150,0],[60,-180,0],[10,-160,0]],
  cuts:[{a:.3,b:.45,w:6,surf:'sand'}],
  feats:[{t:'boxes',s:.07},{t:'coins',s:.03,u:0,n:6},{t:'ramp',s:.13,len:16,h:3.4},{t:'haz',k:'tumble',s:.2,n:3},{t:'boost',s:.4,u:0,cut:0},{t:'boxes',s:.29},{t:'patch',surf:'sand',s:.36,u:0,len:26,hw:5},{t:'boost',s:.47,u:-4},{t:'jump',s:.53,u:4,hw:4},{t:'boxes',s:.58},{t:'coins',s:.64,u:0,n:7},{t:'haz',k:'tumble',s:.72,n:2},{t:'ramp',s:.8,len:12,h:2.6},{t:'boxes',s:.86},{t:'boost',s:.93,u:0}]},
 {id:'neon',n:'NEON BOULEVARD',theme:'city',sc:1.0,w:12,
  pts:[[0,-120,0],[0,30,0],[12,62,0],[45,75,0],[130,75,0],[160,90,0],[170,130,3],[175,190,6],[200,215,6],[255,212,6],[275,185,6],[275,60,3],[270,-40,0],[245,-75,0],[180,-80,0],[150,-100,0],[140,-170,0],[110,-200,0],[30,-200,0],[5,-180,0]],
  cuts:[{a:.3,b:.5,w:6,surf:null}],
  feats:[{t:'boxes',s:.07},{t:'boost',s:.12,u:-6},{t:'boost',s:.12,u:6},{t:'haz',k:'traffic',s:.18,n:3},{t:'patch',surf:'oil',s:.24,u:-4,len:10,hw:3},{t:'boxes',s:.28},{t:'ramp',s:.33,len:14,h:3},{t:'boost',s:.45,u:0,cut:0},{t:'coins',s:.52,u:-4,n:6},{t:'jump',s:.6,u:0,hw:5},{t:'boxes',s:.66},{t:'patch',surf:'oil',s:.74,u:5,len:10,hw:3},{t:'boxes',s:.86},{t:'boost',s:.92,u:0},{t:'coins',s:.96,u:4,n:5}]},
 {id:'caldera',n:'MAGMA CALDERA',theme:'volcano',sc:1.0,w:11,shoulder:3,
  pts:[[0,-100,0],[0,0,0],[10,70,3],[60,120,8],[140,140,12],[220,120,14],[260,60,14],[230,0,14],[180,-10,12],[170,-60,10],[230,-90,8],[250,-150,6],[200,-200,4],[120,-210,2],[50,-180,1],[10,-150,0]],
  cuts:[{a:.38,b:.5,w:6,surf:null}],
  feats:[{t:'boxes',s:.07},{t:'coins',s:.03,u:0,n:6},{t:'haz',k:'geyser',s:.13,n:2},{t:'ramp',s:.2,len:14,h:3},{t:'noWall',s:.24,len:300},{t:'boxes',s:.3},{t:'jump',s:.45,u:0,hw:3,cut:0},{t:'glide',s:.51,len:12},{t:'gap',s:.53,len:40},{t:'boxes',s:.62},{t:'haz',k:'geyser',s:.68,n:2},{t:'boost',s:.75,u:-4},{t:'coins',s:.8,u:0,n:6},{t:'boxes',s:.86},{t:'haz',k:'geyser',s:.92,n:1}]},
 {id:'manor',n:'GLOOM MANOR',theme:'haunted',sc:1.0,w:11,
  pts:[[0,-100,0],[0,10,0],[20,70,2],[80,95,4],[140,80,4],[180,40,2],[220,40,0],[240,90,0],[220,160,3],[150,190,6],[80,200,6],[10,190,4],[-50,150,2],[-60,90,0],[-110,60,0],[-130,0,0],[-100,-70,0],[-70,-130,0],[-30,-160,0]],
  cuts:[{a:.48,b:.66,w:6,surf:null}],
  feats:[{t:'boxes',s:.07},{t:'coins',s:.03,u:0,n:6},{t:'haz',k:'ghost',s:.15,n:2},{t:'patch',surf:'oil',s:.22,u:0,len:14,hw:4},{t:'ramp',s:.29,len:14,h:3},{t:'boxes',s:.36},{t:'haz',k:'ghost',s:.42,n:2},{t:'boost',s:.3,u:0,cut:0},{t:'boost',s:.7,u:0,cut:0},{t:'boxes',s:.56},{t:'jump',s:.7,u:0,hw:4},{t:'coins',s:.76,u:-3,n:6},{t:'haz',k:'ghost',s:.82,n:2},{t:'boxes',s:.88},{t:'boost',s:.95,u:4}]},
 {id:'cloud',n:'CLOUDTOP CAUSEWAY',theme:'sky',sc:1.0,w:11,shoulder:1.6,
  pts:[[0,-100,60],[0,20,60],[40,80,62],[110,70,66],[150,10,70],[210,0,74],[260,50,78],[330,40,80],[360,-20,78],[340,-90,74],[270,-120,70],[200,-100,66],[140,-140,62],[60,-170,60],[10,-150,60]],
  cuts:[{a:.25,b:.38,w:6,surf:null}],
  feats:[{t:'boxes',s:.07},{t:'boost',s:.13,u:0},{t:'ramp',s:.19,len:14,h:3},{t:'boost',s:.45,u:0,cut:0},{t:'boxes',s:.3},{t:'rail',s:.17,len:90},{t:'rail',s:0,len:400,cut:0},{t:'rail',s:.4,len:80},{t:'rail',s:.64,len:90},{t:'glide',s:.468,len:12},{t:'gap',s:.49,len:50},{t:'coins',s:.57,u:0,n:6},{t:'boxes',s:.62},{t:'jump',s:.68,u:0,hw:4},{t:'glide',s:.758,len:12},{t:'gap',s:.78,len:36},{t:'boxes',s:.86},{t:'boost',s:.93,u:0}]}];
export const CUPS=[{n:'SUNRISE CUP',ic:'☀',c:'#ffb21e',tracks:[0,1,2,3]},{n:'MOONLIGHT CUP',ic:'☾',c:'#9c8cff',tracks:[4,5,6,7]}];
export const ARENA={id:'crater',n:'CRATER BOWL',theme:'arena',r:78};
