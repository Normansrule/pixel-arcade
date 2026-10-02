// PLATFORM BRAWL — roster data: physics stats, normals, specials, throws, looks. All characters are originals.
// Units: world units (a fighter is ~2 tall), time in 60 Hz frames, velocities in units/frame.
// Hitbox: s,e (frames) x,y (offset from feet, x forward) r (radius) d (damage %) a (angle deg, 361 = auto) b (base kb) g (kb growth)
export const H=(s,e,x,y,r,d,a,b,g,o)=>({s,e,x,y,r,d,a,b,g,...o});

// Shared normal set, shaped per fighter by power P, reach R and speed SP (frame multiplier).
function base(P,R,SP){const F=n=>Math.max(1,Math.round(n*SP)),D=d=>Math.round(d*P*10)/10,rr=r=>r*(R>1?1+(R-1)*.6:R);
 const h=(s,e,x,y,r,d,a,b,g,o)=>H(F(s),F(e),x*R,y,rr(r),D(d),a,b,g,o);
 return{
  jab:{f:F(18),h:[h(3,5,.8,1.2,.48,3,361,12,38)],p:['jabW','jab'],lb:'hR',jab:1},
  jab2:{f:F(22),h:[h(3,5,.9,1.15,.52,4,361,22,60)],p:['punchW','punch'],lb:'hL'},
  ftilt:{f:F(27),h:[h(6,9,1.1,1.05,.55,9,361,14,96),h(6,9,.5,1.05,.5,8,361,12,92)],p:['kickW','kick'],lb:'fR'},
  utilt:{f:F(28),h:[h(6,11,.25,2.15,.64,7,88,28,112)],p:['uppW','upp'],lb:'hR'},
  dtilt:{f:F(20),h:[h(5,7,1.1,.25,.52,6,76,34,52)],p:['crouch','sweepLow'],lb:'fR',low:1},
  dash:{f:F(34),h:[h(6,12,.9,.95,.64,9,48,38,80)],p:['punchW','dashHit'],lb:'hR',m:[[1,.3]]},
  fsmash:{f:F(52),charge:F(7),h:[h(14,17,1.35,1.05,.74,16,361,34,104),h(14,17,.6,1.05,.56,14,361,30,100)],p:['smashW','smash'],lb:'hR',m:[[F(13),.1]]},
  usmash:{f:F(46),charge:F(5),h:[h(11,16,.1,2.4,.84,15,88,36,104)],p:['usmW','usm'],lb:'hR'},
  dsmash:{f:F(48),charge:F(5),h:[h(10,13,1.15,.3,.64,13,30,32,100),h(16,19,-1.15,.3,.64,13,150,32,100,{k:1})],p:['dsmW','dsm'],lb:'fR'},
  nair:{f:F(36),ll:F(8),h:[h(5,9,0,1.0,.92,9,361,16,100),h(10,20,0,1.0,.8,6,361,10,90)],p:['nairW','nair'],lb:'fR',air:1},
  fair:{f:F(38),ll:F(12),h:[h(9,13,1.0,1.05,.7,12,361,28,100)],p:['fairW','fair'],lb:'hR',air:1},
  bair:{f:F(32),ll:F(10),h:[h(7,11,-1.05,1.0,.68,13,145,26,102)],p:['bairW','bair'],lb:'fL',air:1},
  uair:{f:F(30),ll:F(8),h:[h(5,9,.15,2.25,.7,9,85,28,104)],p:['uairW','uair'],lb:'fR',air:1,spin:{s:F(2),e:F(13),n:-1}},
  dair:{f:F(44),ll:F(18),h:[h(14,18,.1,-.05,.64,13,270,22,90)],p:['dairW','dair'],lb:'fR',air:1},
  grab:{f:F(30),h:[h(6,8,.85,1.0,.58,0,0,0,0,{grab:1})],p:['grabW','grab'],lb:'hR'},
  ledgeAtk:{f:32,h:[H(14,18,.95,.5,.75,8,361,45,30)],p:['crouch','sweepLow'],lb:'fR'},
  getupAtk:{f:32,h:[H(10,14,1,.4,.65,7,361,48,40),H(10,14,-1,.4,.65,7,150,48,40)],p:['crouch','dsm'],lb:'fR'},
  throws:{f:{d:D(8),a:45,b:62,g:64,f:24,rel:12,p:'throwF'},b:{d:D(10),a:135,b:62,g:70,f:30,rel:16,p:'throwB',turn:1},u:{d:D(7),a:90,b:72,g:62,f:28,rel:14,p:'throwU'},d:{d:D(6),a:78,b:72,g:34,f:30,rel:16,p:'throwD'}},
 };}

const pr=(o)=>Object.assign({grav:.012,life:60,r:.35,d:6,a:361,b:10,g:40,spd:.3,fx:'elec'},o);

export const ROSTER=[
 {id:'bolt',name:'BOLT',type:'ALL-ROUNDER',desc:'Quick hands, a spark shot and a counter for anyone who swings carelessly.',
  w:98,walk:.15,run:.27,air:.15,airAcc:.01,grav:.0133,fall:.245,jump:.38,hop:.25,djump:.38,jumps:1,W:.9,Hh:1.95,P:1,R:1,SP:1,fx:'elec',
  look:{build:'mid',suit:0x1d4fe0,trim:0x0d1a40,skin:0xe8b48e,glow:0xffd21a,hair:'spikes',hairC:0xffd21a,visor:true,alt:{suit:0xe01d3a,trim:0x3a0812,glow:0x7ef6ff,hairC:0xffffff}},
  stats:[3,3,3,3],
  sp:{
   nspec:{f:34,sp:{kind:'shoot',at:12,proj:pr({t:'bolt',spd:.36,grav:0,life:48,r:.38,d:6,a:30,b:14,g:35,fx:'elec',max:2})},p:['castW','cast'],lb:'hR'},
   sspec:{f:42,sp:{kind:'dash',a:8,b:20,spd:.44},h:[H(8,20,.7,1.05,.68,10,40,42,78,{fx:'elec'})],p:['punchW','dashHit'],lb:'hR'},
   uspec:{f:44,sp:{kind:'rise',at:6,vy:.42,vx:.07,dur:16},h:[H(6,9,.4,1.4,.75,3,80,0,0,{lk:1,fx:'elec'}),H(10,13,.3,1.8,.75,2,80,0,0,{lk:1,k:1,fx:'elec'}),H(14,17,.3,2.0,.75,2,80,0,0,{lk:1,k:2,fx:'elec'}),H(18,22,.3,2.3,.85,5,80,56,92,{k:3,fx:'elec'})],helpless:1,p:['riseW','rise'],lb:'hR',spin:{s:6,e:22,n:1,y:1}},
   dspec:{f:44,sp:{kind:'counter',a:5,b:26,mult:1.3,min:9},p:['counterW','counter'],lb:'hR'},
  },
  mods(m){m.jab.p=['jabW','jab'];m.fair.h=[H(8,12,1.0,1.1,.72,12,361,30,100,{fx:'elec'})];m.dair.h=[H(13,17,.1,-.05,.66,12,270,24,88,{fx:'elec'})];}},

 {id:'granite',name:'GRANITE',type:'HEAVYWEIGHT',desc:'A walking quarry. Slow, armoured and devastating once a fist lands.',
  w:128,walk:.12,run:.225,air:.13,airAcc:.008,grav:.0152,fall:.27,jump:.37,hop:.24,djump:.35,jumps:1,W:1.35,Hh:2.4,P:1.22,R:1.18,SP:1.0,fx:'rock',
  look:{build:'heavy',suit:0x5d5953,trim:0x2a2724,skin:0x8a837a,glow:0xff6a1a,hair:'rocks',hairC:0x6e6a64,alt:{suit:0x3f5f6e,trim:0x1a2a32,glow:0x56d8ff,skin:0x7a8c94}},
  stats:[5,1,2,4],
  sp:{
   nspec:{f:56,sp:{kind:'cpunch',at:10,max:90,cm:1.8},h:[H(15,19,1.4,1.1,.9,11,361,40,96,{fx:'rock'})],m:[[14,.22]],p:['smashW','smash'],lb:'hR'},
   sspec:{f:46,sp:{kind:'dash',a:8,b:24,spd:.32,armor:[6,24,13]},h:[H(8,24,.8,1.2,.85,13,38,50,80,{fx:'rock'})],p:['punchW','shoulder'],lb:'hR'},
   uspec:{f:48,sp:{kind:'rise',at:8,vy:.4,vx:.05,dur:12},h:[H(8,16,.4,2.2,.9,14,80,50,80,{fx:'rock'})],helpless:1,p:['riseW','rise'],lb:'hR'},
   dspec:{f:200,sp:{kind:'pound',hop:.3,stall:14,spd:.62},h:[H(16,200,0,.3,.9,13,285,30,70,{fx:'rock'})],land:{f:34,h:[H(1,4,1.4,.4,1,10,60,52,70,{fx:'rock'}),H(1,4,-1.4,.4,1,10,120,52,70,{fx:'rock'})],p:['dsm','dsm']},p:['pound','pound'],lb:'fR'},
  },
  mods(m){m.fsmash.h=[H(20,24,1.5,1.0,.95,20,361,30,100,{fx:'rock'})];m.fsmash.f=66;m.jab.h[0].d=5;m.dtilt.h[0].d=9;}},

 {id:'vex',name:'VEX',type:'SPEEDSTER',desc:'A shadow with three jumps. Blinks through attacks and never stands still.',
  w:78,walk:.19,run:.34,air:.175,airAcc:.013,grav:.0142,fall:.27,jump:.39,hop:.27,djump:.36,jumps:2,W:.8,Hh:1.75,P:.78,R:.92,SP:.82,fx:'dark',
  look:{build:'slim',suit:0x1b1a2e,trim:0x0a0912,skin:0xd9a07a,glow:0xb04dff,hair:'mask',hairC:0x1b1a2e,scarf:true,alt:{suit:0xe8e8ee,trim:0x6a6a78,glow:0xff2f6a}},
  stats:[1,5,4,2],
  sp:{
   nspec:{f:22,sp:{kind:'shoot',at:7,proj:pr({t:'star4',spd:.5,grav:0,life:40,r:.3,d:3.5,a:361,b:6,g:22,fx:'dark',max:3})},p:['castW','throwStar'],lb:'hR'},
   sspec:{f:38,sp:{kind:'dash',a:6,b:14,spd:.6,inv:1},h:[H(6,14,.3,1.0,.85,9,45,46,72,{fx:'dark'})],p:['punchW','slash'],lb:'hR'},
   uspec:{f:42,sp:{kind:'tele',a:8,b:18,dist:7},helpless:1,p:['riseW','rise']},
   dspec:{f:32,sp:{kind:'reflect',a:4,b:22},h:[H(4,6,0,1,.95,4,361,32,30,{fx:'dark'})],p:['counterW','reflect']},
  },
  mods(m){m.jab.h=[H(2,3,.75,1.2,.48,2,361,8,20),H(5,6,.75,1.1,.48,2,361,8,20,{k:1}),H(8,10,.8,1.15,.5,3,361,22,50,{k:2})];m.jab.f=16;m.fair.h=[H(5,7,.9,1.1,.65,4,60,0,0,{lk:1}),H(9,12,.9,1.05,.7,6,361,30,95,{k:1})];}},

 {id:'nova',name:'NOVA',type:'ZONER',desc:'Floats above the fight, charging starlight orbs and bending shots back at you.',
  w:88,walk:.14,run:.24,air:.165,airAcc:.009,grav:.0098,fall:.2,jump:.35,hop:.22,djump:.37,jumps:2,W:.85,Hh:1.85,P:1.03,R:1.08,SP:.96,fx:'arcane',
  look:{build:'robe',suit:0x2a2f78,trim:0x101436,skin:0xf1cfb3,glow:0x4ef0ff,hair:'hat',hairC:0x2a2f78,alt:{suit:0x6a1d5c,trim:0x2a0a24,glow:0xffb84e}},
  stats:[2,2,5,3],
  sp:{
   nspec:{f:30,sp:{kind:'cshot',at:8,max:80,proj:pr({t:'orb',spd:.3,grav:0,life:70,r:.3,d:5,a:361,b:18,g:55,fx:'arcane'}),big:{r:.8,d:22,b:40,g:82,spd:.36}},p:['castW','cast'],lb:'hR'},
   sspec:{f:36,sp:{kind:'shoot',at:12,proj:pr({t:'star',spd:.2,grav:0,life:120,r:.38,d:8,a:50,b:30,g:55,homing:.035,fx:'arcane',max:1})},p:['castW','cast'],lb:'hR'},
   uspec:{f:54,sp:{kind:'rise',at:6,vy:.36,vx:.1,dur:30},h:[H(6,30,0,1,1,1.5,90,0,0,{lk:1,rh:6,fx:'arcane'}),H(31,35,0,1.6,1.1,5,80,50,85,{k:1,fx:'arcane'})],helpless:1,p:['riseW','float'],lb:'hR'},
   dspec:{f:34,sp:{kind:'reflect',a:4,b:24},h:[H(4,6,0,1,1,3,361,32,30,{fx:'arcane'})],p:['counterW','reflect']},
  },
  mods(m){m.uair.h=[H(4,6,.1,2.2,.75,3,90,0,0,{lk:1}),H(8,10,.1,2.2,.75,3,90,0,0,{lk:1,k:1}),H(12,15,.1,2.3,.8,6,85,34,100,{k:2})];m.nair.h=[H(5,24,0,1,1,1.5,361,0,0,{lk:1,rh:5,fx:'arcane'}),H(25,28,0,1,1.05,5,361,32,96,{k:1,fx:'arcane'})];m.nair.f=40;}},

 {id:'riptide',name:'RIPTIDE',type:'SPACER',desc:'Trident reach and tidal waves. Keeps you exactly where she wants you.',
  w:96,walk:.14,run:.24,air:.14,airAcc:.009,grav:.0128,fall:.24,jump:.37,hop:.24,djump:.35,jumps:1,W:.95,Hh:2.0,P:1,R:1.35,SP:1.1,fx:'water',
  look:{build:'mid',suit:0x0f7f86,trim:0x063034,skin:0x9fd6d0,glow:0x37fff0,hair:'fin',hairC:0x0f7f86,trident:true,alt:{suit:0x8a5a12,trim:0x2a1a04,glow:0xfff07a,skin:0xe8c79a}},
  stats:[3,3,4,3],
  sp:{
   nspec:{f:36,sp:{kind:'shoot',at:12,proj:pr({t:'wave',spd:.26,grav:0,life:64,r:.55,d:8,a:70,b:36,g:58,ground:1,fx:'water',max:1})},p:['smashW','slam'],lb:'hR'},
   sspec:{f:46,sp:{kind:'spin',a:6,b:30,spd:.18},h:[H(6,29,.7,1.1,.9,2,361,0,0,{lk:1,rh:6,fx:'water'}),H(30,33,.8,1.1,1,6,40,50,80,{k:1,fx:'water'})],p:['spinW','spin'],lb:'hR',ys:{s:6,e:33,n:3}},
   uspec:{f:46,sp:{kind:'rise',at:6,vy:.46,vx:.07,dur:18},h:[H(6,20,0,.5,.85,1.5,90,0,0,{lk:1,rh:5,fx:'water'}),H(21,24,0,2.2,.9,5,85,52,86,{k:1,fx:'water'})],helpless:1,p:['riseW','rise'],lb:'hR'},
   dspec:{f:44,sp:{kind:'shoot',at:14,proj:pr({t:'pillar',spd:0,grav:0,life:20,r:.9,d:13,a:88,b:50,g:84,pillar:{off:2.6,h:4},fx:'water',max:1})},p:['smashW','slam'],lb:'hR'},
  },
  mods(m){}},

 {id:'ember',name:'EMBER',type:'RUSHDOWN',desc:'Hair of fire, feet of fire. Breathes a flame stream and leaves traps behind.',
  w:88,walk:.16,run:.29,air:.16,airAcc:.011,grav:.0145,fall:.265,jump:.38,hop:.255,djump:.37,jumps:1,W:.88,Hh:1.9,P:.92,R:.95,SP:.94,fx:'fire',
  look:{build:'mid',suit:0x2a1410,trim:0x120806,skin:0xd88a5e,glow:0xff4a12,hair:'flame',hairC:0xff4a12,alt:{suit:0x14222a,trim:0x060c10,glow:0x4aa8ff}},
  stats:[3,4,2,4],
  sp:{
   nspec:{f:110,sp:{kind:'breath',a:8,max:80,end:14},h:[H(8,88,1.55,1.15,.78,1.2,40,14,8,{rh:6,fx:'fire'})],p:['castW','breath'],lb:'hR'},
   sspec:{f:44,sp:{kind:'dash',a:8,b:22,spd:.42,vy:.16},h:[H(8,22,.7,.7,.72,11,40,42,80,{fx:'fire'})],p:['kickW','dropkick'],lb:'fR'},
   uspec:{f:46,sp:{kind:'rise',at:6,vy:.44,vx:.08,dur:18},h:[H(6,22,0,1,.95,1.5,90,0,0,{lk:1,rh:5,fx:'fire'}),H(23,26,0,1.6,1.05,5,80,54,88,{k:1,fx:'fire'})],helpless:1,p:['riseW','spin'],lb:'hR',ys:{s:6,e:26,n:4}},
   dspec:{f:30,sp:{kind:'shoot',at:12,proj:pr({t:'mine',spd:0,grav:.012,life:600,r:.55,d:12,a:75,b:46,g:78,mine:1,arm:30,explode:1.6,fx:'fire',max:1})},p:['crouch','dtiltPose'],lb:'hR'},
  },
  mods(m){m.fair.h=[H(6,8,.9,1,.66,3,60,0,0,{lk:1,fx:'fire'}),H(10,12,.9,1,.66,3,60,0,0,{lk:1,k:1,fx:'fire'}),H(14,16,1,1.05,.72,6,361,30,95,{k:2,fx:'fire'})];m.dash.h[0].d=11;}},

 {id:'kodiak',name:'KODIAK',type:'GRAPPLER',desc:'Bear-hugs through shields, lariats through crowds, belly-flops from orbit.',
  w:118,walk:.13,run:.245,air:.135,airAcc:.009,grav:.0145,fall:.26,jump:.37,hop:.24,djump:.35,jumps:1,W:1.25,Hh:2.25,P:1.15,R:1.08,SP:1.04,fx:'impact',
  look:{build:'heavy',suit:0x6b3f1e,trim:0x2a170a,skin:0x8a5a32,glow:0xffb020,hair:'ears',hairC:0x5a3418,belt:true,alt:{suit:0xd8d8d0,trim:0x5a5a52,glow:0x9cff3a,skin:0xc8c8be,hairC:0xb0b0a6}},
  stats:[4,2,2,5],
  sp:{
   nspec:{f:46,h:[H(8,14,1.0,1.0,.75,0,0,0,0,{grab:1,cmd:1})],sp:{kind:'cmd'},thr:{d:18,a:70,b:74,g:72,f:46,rel:34,p:'slam'},p:['grabW','grab'],lb:'hR',m:[[7,.2]]},
   sspec:{f:50,sp:{kind:'spin',a:8,b:36,spd:.17},h:[H(8,35,.6,1.3,1.05,3,361,0,0,{lk:1,rh:8,fx:'impact'}),H(36,40,.8,1.3,1.1,8,40,50,82,{k:1,fx:'impact'})],p:['spinW','lariat'],lb:'hR',ys:{s:8,e:40,n:3}},
   uspec:{f:46,sp:{kind:'rise',at:7,vy:.45,vx:.06,dur:14},h:[H(7,14,.5,2,.9,11,80,48,82,{fx:'impact'})],helpless:1,p:['riseW','rise'],lb:'hR'},
   dspec:{f:200,sp:{kind:'pound',hop:.34,stall:16,spd:.58},h:[H(18,200,0,.6,1,12,285,30,70,{fx:'impact'})],land:{f:32,h:[H(1,4,1.3,.4,1.1,10,62,50,70,{fx:'impact'}),H(1,4,-1.3,.4,1.1,10,118,50,70,{fx:'impact'})],p:['dsm','dsm']},p:['pound','pound'],lb:'fR'},
  },
  mods(m){for(const k in m.throws){m.throws[k].d+=2;m.throws[k].g+=6;}m.grab.h[0].r=.75;m.grab.h[0].x=1.0;}},

 {id:'cog',name:'COG',type:'GADGETEER',desc:'A tin trickster: bouncing bombs, homing rockets, drill mines and a jetpack.',
  w:104,walk:.14,run:.25,air:.14,airAcc:.009,grav:.0133,fall:.24,jump:.36,hop:.235,djump:.35,jumps:1,W:1.0,Hh:1.95,P:1,R:1,SP:1.05,fx:'tech',
  look:{build:'robot',suit:0x9aa4ae,trim:0x2c333a,skin:0x9aa4ae,glow:0x5dff6a,hair:'antenna',hairC:0x2c333a,jetpack:true,alt:{suit:0xc8a63a,trim:0x3a2c08,skin:0xc8a63a,glow:0xff4ad8}},
  stats:[3,3,5,2],
  sp:{
   nspec:{f:36,sp:{kind:'shoot',at:12,proj:pr({t:'bomb',spd:.27,ang:32,grav:.011,life:100,r:.36,d:11,a:60,b:42,g:74,bounce:2,explode:1.5,fx:'tech',max:2})},p:['castW','throwStar'],lb:'hR'},
   sspec:{f:40,sp:{kind:'shoot',at:14,proj:pr({t:'missile',spd:.12,accel:.012,vmax:.52,grav:0,life:90,r:.38,d:9,a:40,b:34,g:70,explode:1.1,fx:'tech',max:1})},p:['castW','cast'],lb:'hR'},
   uspec:{f:999,sp:{kind:'jet',fuel:84,acc:.03,max:.3,drift:.12},h:[H(1,999,0,-.4,.5,1.5,270,10,10,{rh:8,fx:'tech'})],helpless:1,p:['riseW','jet']},
   dspec:{f:32,sp:{kind:'shoot',at:14,proj:pr({t:'mine',spd:0,grav:.012,life:720,r:.6,d:10,a:80,b:50,g:70,mine:1,arm:40,explode:1.5,fx:'tech',max:1})},p:['crouch','dtiltPose'],lb:'hR'},
  },
  mods(m){m.dair.h=[H(10,24,.1,-.05,.6,1.5,270,0,0,{lk:1,rh:4,fx:'tech'}),H(25,28,.1,0,.7,5,280,30,70,{k:1,fx:'tech'})];}},
];

// Build the full move table for a roster entry.
export function moveSet(def){const m=base(def.P,def.R,def.SP);Object.assign(m,JSON.parse(JSON.stringify(def.sp)));if(def.mods)def.mods(m);
 for(const k of Object.keys(m))if(m[k].land)m[k+'Land']=m[k].land;
 for(const k in m){if(k==='throws')continue;const mv=m[k];mv.name=k;mv.h=mv.h||[];mv.fx=mv.fx||def.fx;for(const hb of mv.h){hb.fx=hb.fx||def.fx;if(hb.away===undefined)hb.away=Math.abs(hb.x)<.35&&!hb.grab;}
  // CPU metadata: where and when this move connects (in facing space)
  let x0=99,x1=-99,y0=99,y1=-99,st=999,dm=0,kb=0;for(const hb of mv.h){x0=Math.min(x0,hb.x-hb.r);x1=Math.max(x1,hb.x+hb.r);y0=Math.min(y0,hb.y-hb.r);y1=Math.max(y1,hb.y+hb.r);st=Math.min(st,hb.s);dm+=hb.d;kb=Math.max(kb,hb.b+hb.g);}
  mv.ai={x0,x1,y0,y1,st:st===999?10:st,d:dm,kb};}
 m.isSpecial=k=>/spec$/.test(k);return m;}
export const STAT_NAMES=['POWER','SPEED','RANGE','WEIGHT'];
