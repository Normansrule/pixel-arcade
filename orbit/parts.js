// ORBIT LAB — part catalogue + stack analysis (Tsiolkovsky per stage, TWR, burn time, CoM/CoP). Pure JS.
import {G0,VERDA,LUNE} from './physics.js';

// d = diameter (m), h = height (m), mass/fuel in tonnes, thrust in kN (vacuum), isp in s. size 'S' 1.25 m, 'L' 2.5 m, 'any' adapts.
export const PARTS={
 chute:{cat:'util',name:'CANOPY CHUTE',size:'S',h:.38,dt:.45,db:.62,mass:.1,cost:400,chute:true,desc:'Parachute. Press P (or stage with nothing left) to open. Opens safely below ~260 m/s.'},
 pod:{cat:'command',name:'HALO CAPSULE',size:'S',h:1.55,dt:.62,db:1.25,mass:.84,cost:600,pod:true,ec:220,torque:14,crash:10,desc:'Crew capsule with reaction wheels, battery and a heat shield. Must sit at the top.'},
 probe:{cat:'command',name:'PIP PROBE CORE',size:'S',h:.5,dt:1.25,db:1.25,mass:.12,cost:450,pod:true,ec:120,torque:4,crash:5,probe:true,desc:'Light robotic core. Weak wheels, no heat shield. Great for cheap tests.'},
 tankS1:{cat:'tank',name:'TANK S·100',size:'S',h:1,d:1.25,mass:.0625,fuel:.5,cost:150,desc:'Short 1.25 m tank. Wet:dry mass ratio 9:1.'},
 tankS2:{cat:'tank',name:'TANK S·200',size:'S',h:1.9,d:1.25,mass:.125,fuel:1,cost:280,desc:'Medium 1.25 m tank.'},
 tankS4:{cat:'tank',name:'TANK S·400',size:'S',h:3.75,d:1.25,mass:.25,fuel:2,cost:500,desc:'Long 1.25 m tank.'},
 tankS8:{cat:'tank',name:'TANK S·800',size:'S',h:7.5,d:1.25,mass:.5,fuel:4,cost:900,desc:'Jumbo 1.25 m tank.'},
 tankL4:{cat:'tank',name:'TANK L·400',size:'L',h:1.9,d:2.5,mass:.5,fuel:4,cost:1500,desc:'2.5 m tank — four times the fuel per metre.'},
 tankL8:{cat:'tank',name:'TANK L·800',size:'L',h:3.75,d:2.5,mass:1,fuel:8,cost:2600,desc:'Long 2.5 m tank.'},
 tankL16:{cat:'tank',name:'TANK L·1600',size:'L',h:7.5,d:2.5,mass:2,fuel:16,cost:4600,desc:'Jumbo 2.5 m tank.'},
 hawk:{cat:'engine',name:'HAWK BOOSTER',size:'S',h:1.35,d:1.25,mass:1.25,thrust:250,isl:270,ivac:300,gimbal:.012,cost:1100,col:0xff9d3d,desc:'Sea-level booster. Big thrust, poor vacuum Isp.'},
 kestrel:{cat:'engine',name:'KESTREL',size:'S',h:1.45,d:1.25,mass:1.5,thrust:215,isl:250,ivac:320,gimbal:.05,cost:1200,col:0xffa94d,desc:'All-rounder with strong gimbal steering.'},
 wren:{cat:'engine',name:'WREN VACUUM',size:'S',h:1.2,d:1.25,mass:.5,thrust:60,isl:85,ivac:345,gimbal:.07,cost:400,col:0x9fc4ff,desc:'Upper-stage vacuum engine: Isp 345 s in space, useless at sea level.'},
 moth:{cat:'engine',name:'MOTH LANDER',size:'S',h:.55,d:1.25,mass:.2,thrust:24,isl:260,ivac:315,gimbal:.08,cost:300,col:0xb6e3ff,lander:true,desc:'Compact lander engine — fine throttle control for touchdowns.'},
 condor:{cat:'engine',name:'CONDOR HEAVY',size:'L',h:2.2,d:2.5,mass:6,thrust:1050,isl:285,ivac:310,gimbal:.03,cost:4200,col:0xffb35c,desc:'2.5 m heavy-lift engine.'},
 decS:{cat:'struct',name:'DECOUPLER S',size:'S',h:.2,d:1.25,mass:.05,cost:150,dec:true,desc:'Splits the stack into stages. Everything below is dropped on staging.'},
 decL:{cat:'struct',name:'DECOUPLER L',size:'L',h:.3,d:2.5,mass:.15,cost:400,dec:true,desc:'2.5 m decoupler.'},
 adapt:{cat:'struct',name:'ADAPTER S→L',size:'SL',h:.9,dt:1.25,db:2.5,mass:.15,cost:300,desc:'Joins a 1.25 m part above to a 2.5 m part below.'},
 fins:{cat:'aero',name:'FIN RING',size:'any',h:.45,mass:.12,cost:200,fins:4.2,desc:'Four fins. Pull the centre of pressure down → aerodynamically stable.'},
 legs:{cat:'util',name:'LANDING LEGS',size:'any',h:.4,mass:.2,cost:450,legs:true,desc:'Four legs (L to toggle). Raise crash tolerance to 8 m/s.'},
 solar:{cat:'util',name:'SOLAR RING',size:'any',h:.3,mass:.08,cost:600,solar:2.4,desc:'Unfolding panels: +2.4 EC/s in sunlight. Keeps SAS alive on long trips.'},
};
export const CATS=[['command','COMMAND'],['tank','FUEL TANKS'],['engine','ENGINES'],['struct','STRUCTURE'],['aero','AERO'],['util','UTILITY']];
export const UNLOCK=[['pod','probe','chute','tankS1','tankS2','hawk','decS','fins'],['tankS4','kestrel'],['wren','solar'],['tankS8','adapt','tankL4','tankL8','decL','condor'],['legs','moth'],['tankL16'],[],[]];
export const unlockedAt=id=>UNLOCK.findIndex(l=>l.includes(id));

export const TEMPLATES={
 hopper:{name:'HOPPER',stack:['chute','pod','tankS2','tankS2','fins','hawk']},
 orbiter:{name:'ORBITER',stack:['chute','pod','solar','tankS4','wren','decS','tankS4','tankS4','tankS2','fins','hawk']},
 lander:{name:'LUNE LANDER',stack:['chute','pod','solar','tankS2','tankS1','legs','moth','decS','tankS8','tankS2','kestrel','adapt','decL','tankL16','tankL4','fins','condor']},
};

const dia=(p,which)=>p.d??(which==='t'?p.dt:p.db);
// resolve 'any'-size parts to their neighbour's diameter and lay the stack out from the bottom (y up)
export function layout(ids){const ps=ids.map(id=>({id,def:PARTS[id]}));let y=0;
 for(let i=ps.length-1;i>=0;i--){const p=ps[i];let d=p.def.d??p.def.db??1.25;if(p.def.size==='any'){const up=ps.slice(0,i).reverse().find(q=>q.def.size!=='any'),dn=ps.slice(i+1).find(q=>q.def.size!=='any');d=up?dia(up.def,'b'):dn?dia(dn.def,'t'):1.25;}
  p.dt=p.def.size==='any'?d:dia(p.def,'t');p.db=p.def.size==='any'?d:dia(p.def,'b');p.y0=y;p.y1=y+p.def.h;y=p.y1;}
 return ps;}
// segments bottom→top; a decoupler belongs to the segment below it (it is dropped with it)
export function segments(ps){const segs=[];let cur=[];for(let i=ps.length-1;i>=0;i--){cur.push(ps[i]);if(ps[i].def.dec){segs.push(cur);cur=[];}}if(cur.length)segs.push(cur);return segs;}
export const partMass=p=>p.def.mass+(p.fuel??p.def.fuel??0);
export function engineStats(list,pr=0){let F=0,md=0;for(const p of list){const d=p.def;if(!d.thrust)continue;const mdot=d.thrust*1000/(d.ivac*G0);const isp=d.ivac+(d.isl-d.ivac)*pr;F+=mdot*isp*G0;md+=mdot;}return{F,mdot:md,isp:md?F/(md*G0):0};}

// Full VAB analysis. Every number shown in the stats panel comes from here.
export function analyze(ids,o={}){const ps=layout(ids);const segs=segments(ps);const g=VERDA.g;
 const st=[];let above=0;const masses=segs.map(s=>s.reduce((m,p)=>m+partMass(p),0));
 for(let i=segs.length-1;i>=0;i--){above+=masses[i];const s=segs[i];const fuel=s.reduce((m,p)=>m+(p.def.fuel||0),0);const eng=s.filter(p=>p.def.thrust);
  const m0=above*1000,mf=(above-fuel)*1000;const E0=engineStats(eng,i===0&&!o.vac?1:0),EV=engineStats(eng,0),ES=engineStats(eng,1);
  const hasF=fuel>0&&eng.length>0;const isp=E0.isp;const dv=hasF?isp*G0*Math.log(m0/mf):0;
  st[i]={i,parts:s,eng,fuel:fuel*1000,m0,mf,F:E0.F,Fsl:ES.F,Fvac:EV.F,isp,ispVac:EV.isp,ispSl:ES.isp,dv,dvVac:hasF?EV.isp*G0*Math.log(m0/mf):0,
   twr:E0.F/(m0*g),twrLune:EV.F/(m0*LUNE.g),burn:hasF?fuel*1000*isp*G0/E0.F:0,atm:i===0&&!o.vac};}
 const total=masses.reduce((a,b)=>a+b,0)*1000;const dv=st.reduce((a,s)=>a+s.dv,0);const cost=ids.reduce((c,id)=>c+PARTS[id].cost,0);
 // centre of mass and centre of pressure (lateral area; fins weigh heavily) — margin > 0 = stable
 let mm=0,my=0,aa=0,ay=0;for(const p of ps){const m=partMass(p),yc=(p.y0+p.y1)/2;mm+=m;my+=m*yc;const la=p.def.h*Math.max(p.dt,p.db)*(p.def.pod?.6:1)+(p.def.fins||0)*(p.dt/1.25)**2;aa+=la;ay+=la*(p.def.fins?p.y0+.1:yc);}
 const com=mm?my/mm:0,cop=aa?ay/aa:0,height=ps.length?ps[0].y1:0;
 const warn=[];const pods=ps.filter(p=>p.def.pod);
 if(!ps.length)warn.push(['bad','Empty stack — pick a command part to start.']);
 else{if(!pods.length)warn.push(['bad','No command part — add a capsule or probe core.']);
  else{const top=ps.findIndex(p=>!p.def.chute);if(!ps[top]?.def.pod)warn.push(['warn','The command part should sit at the top (only a parachute above it).']);}
  if(!st[0]||!st[0].eng.length)warn.push(['bad','Bottom stage has no engine.']);
  else if(st[0].twr<1)warn.push(['bad',`TWR ${st[0].twr.toFixed(2)} < 1 — thrust can't beat weight, you won't lift off.`]);
  else if(st[0].twr<1.25)warn.push(['warn',`TWR ${st[0].twr.toFixed(2)} — sluggish climb, big gravity losses. Aim for 1.4–2.0.`]);
  for(let i=0;i<ps.length-1;i++){const a=ps[i],b=ps[i+1];if(Math.abs(a.db-b.dt)>.3&&!a.def.chute)warn.push(['warn',`${a.def.name} (${a.db} m) sits on ${b.def.name} (${b.dt} m) — use an adapter.`]);}
  st.forEach((s,i)=>{if(s.fuel>0&&!s.eng.length)warn.push(['warn',`Stage ${i+1} carries fuel but no engine.`]);if(s.eng.length&&!s.fuel&&i>0)warn.push(['warn',`Stage ${i+1} has an engine but no fuel.`]);});
  if(com-cop<.15&&ps.length>2)warn.push(['warn','Aerodynamically unstable (centre of pressure above centre of mass) — add a fin ring near the bottom.']);
  if(!ps.some(p=>p.def.chute))warn.push(['info','No parachute — fine for tests, but you can\'t land back home.']);
  if(dv<2700&&st[0]?.twr>=1)warn.push(['info',`Δv ${Math.round(dv)} m/s: orbit around VERDA needs about 2,700 m/s.`]);}
 return{ps,segs,st,total,dv,cost,com,cop,height,warn,stable:com-cop>=.15,dmax:Math.max(1.25,...ps.map(p=>Math.max(p.dt,p.db)))};}
