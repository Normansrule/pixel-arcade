// GLOSS RIOT — weapon, bomb and special tuning.
// splatter: rapid ink blobs (straight flight, then gravity) that drip paint along their arc.
// charger: hold to charge, release for an instant line of ink; full charge splats in one hit.
// roller: tap to flick a fan of blobs, keep holding to roll a wide lane and crush anyone in the way.
export const WPN={
 splatter:{name:'GLOOP BLASTER',short:'BLASTER',kind:'auto',rate:.115,cost:.92,speed:36,straight:.13,grav:32,dmg:35,spread:.05,airSpread:.13,splat:.9,drip:.55,dripEvery:1.5,move:.72,glyph:'●',
  desc:'Rapid ink blobs. 3 hits splat. Drips paint along every arc.'},
 charger:{name:'LONGSHOT',short:'LONGSHOT',kind:'charge',charge:.95,cost:[2,15],dmg:[38,160],range:[15,36],splat:1.2,move:.42,glyph:'━',
  desc:'Hold to charge, release to fire a line of ink. Full charge splats in one hit.'},
 roller:{name:'SLAB ROLLER',short:'ROLLER',kind:'roller',flickCost:9,flickN:7,flickSpeed:21,straight:.06,grav:30,flickDmg:44,rollCost:.34,crush:140,splat:.85,roll:5.6,glyph:'▬',
  desc:'Tap to flick a wide fan of ink. Hold to roll a lane and crush foes.'}};
export const BOMB={cost:62,fuse:.85,r:3.1,dmg:180,speed:16,grav:24};
export const SPECIAL={name:'INKQUAKE',r:6.6,kill:3.5,outer:5.6,outerDmg:70,rate:.42};
