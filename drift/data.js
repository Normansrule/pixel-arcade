// SIDEWAYS — cars, upgrades, tuning ranges, colours, medals, save game.
export const CARS=[
 {id:'sparrow',name:'SPARROW',tag:'LIGHTWEIGHT HATCH-COUPE',price:0,blurb:'Featherweight eighties coupe. Not much power, all the balance in the world. Learn to carry speed.',
  mass:1060,wb:2.40,fr:.53,tw:1.42,h:.47,torque:205,peak:5200,red:7700,boost:0,gears:[3.59,2.06,1.38,1.0,.85],final:4.3,mu:1.0,shape:'sparrow',cyl:4,paint:'#ff4d00',tier:0},
 {id:'kestrel',name:'KESTREL S',tag:'TURBO FASTBACK',price:14000,blurb:'Nineties turbo coupe with a long nose and a lazy rear. Spools hard, slides easy.',
  mass:1230,wb:2.52,fr:.55,tw:1.48,h:.48,torque:270,peak:4400,red:7400,boost:.38,gears:[3.32,1.9,1.31,1.0,.8],final:4.1,mu:1.02,shape:'kestrel',cyl:4,paint:'#c21a2a',tier:1},
 {id:'bruiser',name:'BRUISER V8',tag:'BIG-BLOCK SEDAN',price:30000,blurb:'Four doors, eight cylinders, zero manners. Torque everywhere, the tail is always negotiable.',
  mass:1480,wb:2.78,fr:.54,tw:1.56,h:.52,torque:470,peak:4000,red:6800,boost:0,gears:[2.97,2.07,1.43,1.0,.84,.56],final:3.7,mu:1.03,shape:'bruiser',cyl:8,paint:'#1d2a24',tier:2},
 {id:'tempest',name:'TEMPEST R',tag:'WIDEBODY TWIN-TURBO',price:52000,blurb:'Box flares, a swan-neck wing and a six-speed. Built for judges and long-angle bowls.',
  mass:1350,wb:2.58,fr:.53,tw:1.58,h:.46,torque:390,peak:5000,red:8200,boost:.55,gears:[3.25,2.13,1.54,1.18,.97,.82],final:4.0,mu:1.09,shape:'tempest',cyl:6,paint:'#2a6dff',tier:3},
 {id:'wraith',name:'WRAITH X',tag:'MID-ENGINE PRO BUILD',price:90000,blurb:'A competition chassis with a screaming flat-plane motor. Terrifying, then addictive.',
  mass:1290,wb:2.62,fr:.47,tw:1.62,h:.44,torque:500,peak:6200,red:9000,boost:.6,gears:[3.1,2.2,1.65,1.3,1.06,.88],final:4.1,mu:1.13,shape:'wraith',cyl:8,paint:'#111114',tier:4}];

// purchasable upgrades (levels); price grows with level and car tier
export const UPS=[
 {k:'engine',n:'ENGINE',max:4,d:'+13% torque per stage',base:2200},
 {k:'turbo',n:'TURBO',max:3,d:'+0.16 bar boost, more flutter',base:2600},
 {k:'angle',n:'ANGLE KIT',max:3,d:'Unlocks more steering lock',base:1800},
 {k:'susp',n:'COILOVERS',max:3,d:'Stiffer, faster weight transfer',base:1500},
 {k:'tires',n:'TYRES',max:3,d:'+5% grip compound per stage',base:1200},
 {k:'weight',n:'WEIGHT',max:3,d:'-45 kg per stage',base:1600}];
export const upPrice=(car,u,lvl)=>Math.round(u.base*(1+car.tier*.55)*(1+lvl*.85)/100)*100;
export const ANGLE_MAX=[45,52,58,66];

// free tuning sliders (range limited by upgrades)
export const TUNE=[
 {k:'steer',n:'STEERING ANGLE',u:'°',min:30,max:c=>ANGLE_MAX[c.up.angle],step:1},
 {k:'camF',n:'FRONT CAMBER',u:'° NEG',min:0,max:()=>8,step:.5},
 {k:'camR',n:'REAR CAMBER',u:'° NEG',min:0,max:()=>5,step:.5},
 {k:'psiF',n:'FRONT PRESSURE',u:' PSI',min:22,max:()=>40,step:1},
 {k:'psiR',n:'REAR PRESSURE',u:' PSI',min:22,max:()=>44,step:1},
 {k:'stiff',n:'SUSPENSION',u:'',min:0,max:()=>1,step:.05,fmt:v=>v<.34?'SOFT':v<.67?'MEDIUM':'STIFF'},
 {k:'final',n:'FINAL DRIVE',u:'',min:c=>+(c.spec.final*.78).toFixed(2),max:c=>+(c.spec.final*1.22).toFixed(2),step:.05,fmt:v=>v.toFixed(2)}];

export const PAINTS=['#e8e2d0','#f4f4f4','#111114','#c21a2a','#ff4d00','#ffb400','#d8ff3a','#1db954','#16b8c8','#2a6dff','#5a2dff','#c02ad0','#ff5fa2','#8a8f98','#3a2a1a','#1d2a24'];
export const RIMS=['#c9ccd2','#1a1a1c','#d4a63a','#ff4d00','#ffffff','#2a6dff','#c21a2a','#6a6e76'];
export const RIM_STYLES=['MESH','SIX-SPOKE','DISH','TURBINE'];
export const LIVERIES=['CLEAN','TWIN STRIPE','SIDE SLASH','TWO-TONE','NUMBER','HAZARD'];

export const MEDALS=[{n:'BRONZE',c:'#d08a4a',ppm:12000},{n:'SILVER',c:'#cfd6e0',ppm:30000},{n:'GOLD',c:'#ffcf3f',ppm:60000},{n:'PLATINUM',c:'#9ef0ff',ppm:100000}];
export function medalFor(pts,mins){let m=-1;MEDALS.forEach((x,i)=>{if(pts>=x.ppm*mins)m=i;});return m;}
export const DIFFS=[{n:'EASY',pace:.8,angle:.8,gap:16},{n:'NORMAL',pace:.93,angle:1,gap:11},{n:'HARD',pace:1.04,angle:1.15,gap:8}];

export function defaultOwn(spec){return{up:{engine:0,turbo:0,angle:0,susp:0,tires:0,weight:0},
 tune:{steer:42,camF:3,camR:.5,psiF:30,psiR:32,stiff:.55,final:spec.final},look:{paint:spec.paint,rims:'#c9ccd2',rim:0,livery:0,liv:'#111114'}};}

const KEY='pxd_sideways_save';
export function loadSave(){let s=null;try{s=JSON.parse(localStorage.getItem(KEY));}catch(e){}
 if(!s||!s.owned)s={money:2500,owned:{},sel:'sparrow',best:{},runs:0};
 if(!s.owned.sparrow)s.owned.sparrow=defaultOwn(CARS[0]);
 for(const id in s.owned){const sp=CARS.find(c=>c.id===id);if(!sp){delete s.owned[id];continue;}const d=defaultOwn(sp),o=s.owned[id];o.up={...d.up,...o.up};o.tune={...d.tune,...o.tune};o.look={...d.look,...o.look};}
 if(!s.owned[s.sel])s.sel='sparrow';s.best=s.best||{};return s;}
export function writeSave(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}
