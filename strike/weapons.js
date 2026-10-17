// STRIKE ZONE — arsenal: nine original weapons, five classes, the gun-ladder order, damage falloff and hit zones.
// Spreads are radians (cone half-angle), recoil in degrees per shot, rates in seconds between shots.
export const WPN={
 ar:{id:'ar',name:'VX-7 RIFLE',cls:'rifle',auto:true,dmg:25,head:1.9,rate:.094,mag:30,res:120,reload:1.95,reloadE:2.35,fall:[28,64,.72],
  sp:{hip:.026,ads:.0022,move:.03,air:.06,bloom:.0045,max:.045},rc:{v:.62,h:.24,ads:.65},ads:{t:.2,zoom:1.45},speed:1,kick:1,snd:'rifle'},
 smg:{id:'smg',name:'MAMBA SMG',cls:'smg',auto:true,dmg:19,head:1.6,rate:.066,mag:32,res:160,reload:1.6,reloadE:1.95,fall:[12,32,.6],
  sp:{hip:.032,ads:.008,move:.012,air:.03,bloom:.004,max:.05},rc:{v:.42,h:.3,ads:.7},ads:{t:.15,zoom:1.25},speed:1.07,kick:.7,snd:'smg'},
 shotgun:{id:'shotgun',name:'MAULER-12',cls:'shotgun',pump:true,pellets:9,dmg:13,head:1.35,rate:.78,mag:6,res:30,shell:.46,fall:[8,24,.2],
  sp:{hip:.085,ads:.056,move:.01,air:.02,bloom:0,max:0},rc:{v:4.2,h:.8,ads:.85},ads:{t:.2,zoom:1.18},speed:1.02,kick:2.4,snd:'shotgun'},
 sniper:{id:'sniper',name:'LONGSHOT .50',cls:'sniper',bolt:true,dmg:96,head:2.6,leg:.8,rate:1.3,mag:5,res:20,reload:2.6,reloadE:3,fall:[80,160,.9],
  sp:{hip:.1,ads:.0005,move:.06,air:.15,bloom:0,max:0},rc:{v:5,h:.6,ads:.7},ads:{t:.28,zoom:4.6,scope:true},speed:.94,kick:2.6,snd:'sniper'},
 lmg:{id:'lmg',name:'ANVIL LMG',cls:'lmg',auto:true,dmg:23,head:1.7,rate:.083,mag:75,res:150,reload:3.3,reloadE:3.6,fall:[30,70,.75],
  sp:{hip:.04,ads:.006,move:.04,air:.08,bloom:.0032,max:.06},rc:{v:.48,h:.32,ads:.6},ads:{t:.28,zoom:1.4},speed:.9,kick:1.1,snd:'lmg'},
 pistol:{id:'pistol',name:'VIPER P9',cls:'pistol',semi:true,dmg:27,head:1.8,rate:.115,mag:12,res:72,reload:1.3,reloadE:1.55,fall:[15,40,.6],
  sp:{hip:.014,ads:.004,move:.008,air:.03,bloom:.006,max:.03},rc:{v:1.3,h:.35,ads:.7},ads:{t:.13,zoom:1.2},speed:1.1,kick:1.1,snd:'pistol'},
 revolver:{id:'revolver',name:'HAMMER .44',cls:'revolver',semi:true,dmg:56,head:1.85,rate:.4,mag:6,res:30,reload:2.15,reloadE:2.15,fall:[20,50,.7],
  sp:{hip:.02,ads:.003,move:.02,air:.05,bloom:0,max:0},rc:{v:3.4,h:.6,ads:.75},ads:{t:.16,zoom:1.3},speed:1.06,kick:2,snd:'revolver'},
 rl:{id:'rl',name:'COMET RL',cls:'rl',proj:'rocket',dmg:120,splash:4.6,sdmg:105,pspeed:36,rate:.95,mag:1,res:3,reload:1.7,reloadE:1.7,
  sp:{hip:.004,ads:.001,move:.006,air:.01,bloom:0,max:0},rc:{v:3.2,h:.4,ads:.8},ads:{t:.25,zoom:1.3},speed:.9,kick:2.2,snd:'rl',power:true},
 knife:{id:'knife',name:'EDGE KNIFE',cls:'knife',melee:true,dmg:55,back:110,rate:.5,range:2.3,mag:0,res:0,sp:{hip:0,ads:0,move:0,air:0,bloom:0,max:0},rc:{v:0,h:0,ads:1},ads:{t:.1,zoom:1},speed:1.14,kick:0,snd:'knife'}};
export const FRAG={dmg:115,radius:6.2,fuse:1.7,per:2};
export const CLASSES=[
 {id:'rifleman',name:'RIFLEMAN',p:'ar',s:'pistol',desc:'All-round VX-7 rifle. Accurate bursts at any range.'},
 {id:'rusher',name:'RUSHER',p:'smg',s:'pistol',desc:'MAMBA SMG + speed. Slide in, shred close range.'},
 {id:'brawler',name:'BRAWLER',p:'shotgun',s:'revolver',desc:'MAULER-12 pump + HAMMER .44. One-shot the corners.'},
 {id:'marksman',name:'MARKSMAN',p:'sniper',s:'pistol',desc:'LONGSHOT .50 bolt sniper. Headshots kill in one.'},
 {id:'gunner',name:'GUNNER',p:'lmg',s:'revolver',desc:'ANVIL LMG, 75 rounds. Hold lanes, suppress.'}];
export const LADDER=['ar','smg','lmg','shotgun','revolver','sniper','pistol','rl','knife'];
export const HP=100,REGEN_DELAY=4.5,REGEN_RATE=24;
export function falloff(w,d){const f=w.fall;if(!f||d<=f[0])return 1;if(d>=f[1])return f[2];return 1-(1-f[2])*(d-f[0])/(f[1]-f[0]);}
export function zoneMult(w,part){return part==='head'?w.head||1.5:part==='legs'?(w.leg||.8):1;}
export function newGun(id){const w=WPN[id];return{id,w,mag:w.mag,res:w.res};}
