// BREACH POINT — weapons, learnable recoil patterns, armour model and economy.
// Angles in degrees for recoil; spreads in radians. Speeds in m/s.

// deterministic spray patterns: [yaw, pitch] kick added after shot i (positive yaw = right)
function pattern(n,fn){const o=[];for(let i=0;i<n;i++)o.push(fn(i));return o;}
const PAT={
 vanta:pattern(30,i=>i<9?[i%2?.14:-.1,1.2-i*.05]:i<16?[-.78,.3]:i<23?[.95,.12]:[-.62,.06]),
 sentry:pattern(30,i=>i<10?[Math.sin(i*.9)*.08,.92-i*.035]:i<18?[.58,.2]:[-.62,.1]),
 lynx:pattern(25,i=>i<8?[.04,.98-i*.03]:(((i-8)/5|0)%2?[.55,.14]:[-.5,.18])),
 mako:pattern(30,i=>i<6?[0,.62]:[Math.sin(i*.75)*.42,.28]),
 wasp:pattern(18,i=>[Math.sin(i*1.25)*.45,i<5?.85:.4]),
 kestrel:pattern(13,i=>[i%2?.22:-.18,1.75]),
 hawk:pattern(7,i=>[i%2?.4:-.35,4.6]),
 bulwark:pattern(7,()=>[0,5.2]),
 longbow:pattern(5,()=>[0,6.5])};

const SP=(st,cr,mv,air,spr,max)=>({st,cr,mv,air,spr,max});
export const WPN={
 knife:{id:'knife',name:'TALON KNIFE',slot:3,cls:'knife',price:0,kill:1500,dmg:40,heavy:65,rate:.42,mag:0,res:0,speed:5.6,ap:.85,pen:0,range:1.9},
 kestrel:{id:'kestrel',name:'KESTREL-9',slot:2,cls:'pistol',price:200,kill:300,dmg:30,rate:.15,semi:true,mag:13,res:52,rel:2.1,speed:5.4,ap:.5,rm:.91,pen:.35,sp:SP(.005,.004,.055,.16,.014,.06),pat:PAT.kestrel,snd:'pistol'},
 wasp:{id:'wasp',name:'WASP-18',slot:2,cls:'pistol',price:500,kill:300,dmg:24,rate:.085,mag:18,res:90,rel:2.3,speed:5.35,ap:.55,rm:.88,pen:.3,sp:SP(.009,.007,.05,.16,.008,.07),pat:PAT.wasp,snd:'smg'},
 hawk:{id:'hawk',name:'HAWK .50',slot:2,cls:'pistol',price:700,kill:300,dmg:58,rate:.32,semi:true,mag:7,res:35,rel:2.3,speed:5.1,ap:.9,rm:.93,pen:.8,sp:SP(.006,.004,.09,.2,.03,.09),pat:PAT.hawk,snd:'heavy',heavyP:true},
 mako:{id:'mako',name:'MAKO-45',slot:1,cls:'smg',price:1250,kill:600,dmg:27,rate:.08,mag:30,res:120,rel:2.6,speed:5.2,ap:.6,rm:.86,pen:.35,sp:SP(.008,.006,.035,.14,.0045,.05),pat:PAT.mako,snd:'smg'},
 bulwark:{id:'bulwark',name:'BULWARK-12',slot:1,cls:'shotgun',price:1100,kill:900,dmg:21,pellets:8,rate:.85,semi:true,mag:7,res:32,rel:.5,shell:true,speed:4.9,ap:.5,rm:.55,pen:.12,sp:SP(.05,.048,.04,.12,0,.06),pat:PAT.bulwark,snd:'shotgun'},
 lynx:{id:'lynx',name:'LYNX-C',slot:1,cls:'rifle',price:2050,kill:300,dmg:30,rate:.09,mag:25,res:75,rel:2.4,speed:5.0,ap:.7,rm:.96,pen:.75,sp:SP(.0045,.003,.09,.2,.004,.045),pat:PAT.lynx,snd:'rifle'},
 vanta:{id:'vanta',name:'VANTA-7',slot:1,cls:'rifle',price:2700,kill:300,dmg:36,rate:.1,mag:30,res:90,rel:2.5,speed:4.8,ap:.77,rm:.98,pen:.95,sp:SP(.005,.0035,.1,.22,.005,.05),pat:PAT.vanta,snd:'rifle2',side:'atk'},
 sentry:{id:'sentry',name:'SENTRY-4',slot:1,cls:'rifle',price:3100,kill:300,dmg:33,rate:.09,mag:30,res:90,rel:3.0,speed:4.9,ap:.7,rm:.97,pen:.9,sp:SP(.004,.003,.09,.2,.004,.045),pat:PAT.sentry,snd:'rifle',side:'def'},
 longbow:{id:'longbow',name:'LONGBOW .338',slot:1,cls:'sniper',price:4750,kill:100,dmg:115,rate:1.45,semi:true,mag:5,res:30,rel:3.6,speed:4.3,ap:.97,rm:.99,pen:1.7,sp:SP(.075,.07,.14,.3,0,.1),scopeSp:.0012,scope:[38,14],pat:PAT.longbow,snd:'sniper'}};
export const NADE={frag:{id:'frag',name:'FRAG',price:300,max:1,kill:300},smoke:{id:'smoke',name:'SMOKE',price:300,max:1},flash:{id:'flash',name:'FLASHBANG',price:200,max:2},inc:{id:'inc',name:'INCENDIARY',price:500,max:1,kill:300}};
export const NADE_ORDER=['frag','smoke','flash','inc'],NADE_MAX=4;
export const GEAR={vest:{id:'vest',name:'KEVLAR VEST',price:650},helm:{id:'helm',name:'VEST + HELMET',price:1000},kit:{id:'kit',name:'DEFUSE KIT',price:400,side:'def'}};
export const SHOP=[
 {cat:'PISTOLS',items:['kestrel','wasp','hawk']},
 {cat:'SMG · HEAVY',items:['mako','bulwark']},
 {cat:'RIFLES',items:['lynx','vanta','sentry','longbow']},
 {cat:'GEAR',items:['vest','helm','kit']},
 {cat:'GRENADES',items:['frag','smoke','flash','inc']}];
export const HIT={head:4,chest:1,stomach:1.25,legs:.75};
export const ECON={start:800,max:16000,winElim:3250,winBomb:3500,winDefuse:3500,winTime:3250,loss:[1400,1900,2400,2900,3400],plantBonus:800,plant:300,defuse:300};

export function newGun(id){const d=WPN[id];return{id,def:d,mag:d.mag,res:d.res};}
// damage after armour: returns [hpLoss, armourLoss]
export function armorDamage(dmg,ap,part,armor,helmet){const covered=armor>0&&(part!=='legs')&&(part!=='head'||helmet);if(!covered)return[dmg,0];
 let hp=dmg*ap,ar=(dmg-hp)*.5;if(ar>armor){hp+=(ar-armor)*2;ar=armor;}return[Math.round(hp),Math.round(ar)];}
// crude value used by bots to rank guns
export function gunValue(id){return{knife:0,kestrel:1,wasp:2,hawk:3,bulwark:3.5,mako:4,lynx:6,vanta:8,sentry:8,longbow:7.5}[id]||0;}
