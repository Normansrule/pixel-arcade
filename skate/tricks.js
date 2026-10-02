// SKATE CITY — trick tables and the combo scorer (base x spin x multiplier).
// Directions: N (neutral) U D L R UL UR DL DR — the stick/arrow held when the trick button is pressed.
export const DIRS=['N','U','D','L','R','UL','UR','DL','DR'];
export function dirOf(x,y){const ax=Math.abs(x)>.4?Math.sign(x):0,ay=Math.abs(y)>.4?Math.sign(y):0;if(!ax&&!ay)return'N';return(ay>0?'U':ay<0?'D':'')+(ax<0?'L':ax>0?'R':'');}

// flip tricks: board rotation per completion — roll (around the deck's long axis), yaw (shove), pitch (end over end)
export const FLIPS={
 N:{name:'Kickflip',base:100,roll:1,yaw:0,pitch:0},
 L:{name:'Heelflip',base:100,roll:-1,yaw:0,pitch:0},
 R:{name:'Pop Shove-It',base:100,roll:0,yaw:.5,pitch:0},
 D:{name:'360 Shove-It',base:200,roll:0,yaw:1,pitch:0},
 U:{name:'Impossible',base:200,roll:0,yaw:0,pitch:1},
 UL:{name:'Varial Heelflip',base:300,roll:-1,yaw:-.5,pitch:0},
 UR:{name:'Varial Kickflip',base:300,roll:1,yaw:.5,pitch:0},
 DL:{name:'Hardflip',base:300,roll:1,yaw:0,pitch:.5},
 DR:{name:'360 Flip',base:400,roll:1,yaw:1,pitch:0},
 SP:{name:'Harbor Hurricane',base:1400,roll:3,yaw:2,pitch:0,special:true,dur:1.6},
};
// grabs: which hand reaches where on the board, plus a board tweak (roll / pitch / yaw in radians)
export const GRABS={
 N:{name:'Method',base:250,hand:'F',at:'heel',roll:.75,pitch:-.15,yaw:.2},
 U:{name:'Nosegrab',base:200,hand:'F',at:'nose',roll:0,pitch:-.35,yaw:0},
 D:{name:'Tailgrab',base:200,hand:'B',at:'tail',roll:0,pitch:.35,yaw:0},
 L:{name:'Melon',base:250,hand:'F',at:'heel',roll:.35,pitch:0,yaw:0},
 R:{name:'Indy',base:250,hand:'B',at:'toe',roll:-.3,pitch:0,yaw:0},
 UL:{name:'Mute',base:300,hand:'F',at:'toe',roll:-.4,pitch:-.2,yaw:0},
 UR:{name:'Stalefish',base:300,hand:'B',at:'heel',roll:.45,pitch:.15,yaw:-.2},
 DL:{name:'Crossbone',base:350,hand:'F',at:'toe',roll:-.3,pitch:.55,yaw:.3},
 DR:{name:'Rocket Air',base:400,hand:'2',at:'nose',roll:0,pitch:-1.2,yaw:0},
 SP:{name:'Skyhook Air',base:1500,hand:'2',at:'over',roll:3.14,pitch:0,yaw:0,special:true},
};
// grinds: rail along the board (trucks) or across it (slides); yaw/pitch/roll pose the board; off = deck offset along its length
export const GRINDS={
 N:{name:'50-50',base:100},
 U:{name:'Nosegrind',base:150,pitch:-.2,off:-.24},
 D:{name:'5-0 Grind',base:150,pitch:.2,off:.24},
 L:{name:'Smith Grind',base:200,pitch:.12,roll:.3,off:.22},
 R:{name:'Feeble Grind',base:200,pitch:.1,roll:-.3,off:.22},
 UL:{name:'Crooked Grind',base:250,pitch:-.15,yaw:.3,off:-.24},
 UR:{name:'Overcrook',base:300,pitch:-.15,yaw:-.3,off:-.24},
 DL:{name:'Salad Grind',base:250,pitch:.15,yaw:-.25,off:.22},
 DR:{name:'Suski Grind',base:250,pitch:.15,yaw:.25,off:.22},
 SP:{name:'Sparkchain Slide',base:1000,slide:true,roll:3.14,rate:220,special:true},
};
export const SLIDES={
 N:{name:'Boardslide',base:150},
 U:{name:'Noseslide',base:200,off:-.3},
 D:{name:'Tailslide',base:200,off:.3},
 L:{name:'Lipslide',base:250,flipYaw:true},
 R:{name:'Lipslide',base:250,flipYaw:true},
 UL:{name:'Nosebluntslide',base:350,off:-.32,pitch:-.35},
 UR:{name:'Nosebluntslide',base:350,off:-.32,pitch:-.35},
 DL:{name:'Bluntslide',base:300,off:.32,pitch:.35},
 DR:{name:'Bluntslide',base:300,off:.32,pitch:.35},
};
export const LIPS={
 N:{name:'Rock to Fakie',base:150,pitch:-.45,off:-.05},
 U:{name:'Nose Stall',base:200,pitch:-.7,off:-.3},
 D:{name:'Axle Stall',base:150,pitch:0,off:0},
 L:{name:'Disaster',base:250,pitch:.25,off:.05,yaw:.4},
 R:{name:'Blunt to Fakie',base:300,pitch:.7,off:.3},
 UL:{name:'Nose Pick',base:250,pitch:-.6,off:-.3,yaw:.3},UR:{name:'Nose Pick',base:250,pitch:-.6,off:-.3,yaw:-.3},
 DL:{name:'Tail Stall',base:200,pitch:.6,off:.3},DR:{name:'Tail Stall',base:200,pitch:.6,off:.3},
};
export const MANUALS={man:{name:'Manual',base:100,pitch:.26,rate:60},nose:{name:'Nose Manual',base:150,pitch:-.24,rate:60},SP:{name:'Kickstand Cruise',base:800,pitch:.5,rate:160,special:true}};

const REP=[1,.75,.5,.3,.15];
// A combo: a list of tricks; score = (sum of each trick's base) x (number of tricks).
export class Combo{
 constructor(){this.list=[];this.recent=[];this.air=0;this.best=0;}
 get active(){return this.list.length>0;}
 get mult(){return this.list.length;}
 get base(){let s=0;for(const e of this.list)s+=e.base;return Math.round(s);}
 get total(){return this.base*this.mult;}
 add(name,base,o={}){let n=0;if(!o.gap){for(const e of this.list)if(e.key===(o.key||name))n++;for(const k of this.recent)if(k===(o.key||name))n+=.5;}
  const f=o.gap?1:REP[Math.min(REP.length-1,Math.floor(n))];
  const e={name,key:o.key||name,base:base*f,raw:base,f,air:o.air??-1,gap:!!o.gap,kind:o.kind||'',t:0};this.list.push(e);return e;}
 tick(e,pts){if(e)e.base+=pts*e.f;}
 // apply a spin to every trick done in this air; with no air tricks the spin itself scores
 spin(air,half,label){if(half<1)return;const fac=1+.5*half,es=this.list.filter(e=>e.air===air&&!e.gap);
  if(es.length){es.forEach(e=>e.base*=fac);es[0].name=label+' '+es[0].name;}else this.add(label,60*half*fac,{key:label,kind:'spin'});}
 bank(){const t=this.total;for(const e of this.list){this.recent.push(e.key);}while(this.recent.length>10)this.recent.shift();this.best=Math.max(this.best,t);this.list=[];return t;}
 fail(){const t=this.total;this.list=[];return t;}
 text(max=6){const l=this.list,s=l.slice(-max).map(e=>e.name);return(l.length>max?'… + ':'')+s.join(' + ');}
}
