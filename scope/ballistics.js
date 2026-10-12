// LONG SHOT — rifles, scopes and the external-ballistics model.
// Point-mass model: a = g + k·|v−w|·(w−v)  (quadratic drag relative to the moving air mass).
// Bullet drop and wind drift both emerge from it; the zero is solved numerically per range.
export const G=9.81;
export const RIFLES=[
 {id:'wren',n:'WREN M2',cls:'BOLT · 7.62',d:'Reliable bolt-action all-rounder. Good velocity, average steadiness.',v0:800,k:.00075,stab:.6,power:2,noise:1,cycle:1.15,mag:5,reload:2.6,unlock:0,body:0x2c2f33,stock:0x5a3f28,len:1.12,can:false},
 {id:'kestrel',n:'KESTREL SD',cls:'BOLT · SUPPRESSED',d:'Integrally suppressed — guests barely hear it. Slow, heavy rounds drop hard.',v0:560,k:.0010,stab:.68,power:2,noise:.22,cycle:1.05,mag:6,reload:2.4,unlock:3,body:0x3b4034,stock:0x3b4034,len:1.05,can:true},
 {id:'longbow',n:'LONGBOW .338',cls:'BOLT · MAGNUM',d:'Flat-shooting magnum with a heavy barrel. The steadiest rifle in the case.',v0:910,k:.0005,stab:.82,power:3,noise:1.3,cycle:1.45,mag:5,reload:3,unlock:6,body:0x1d1f22,stock:0x6b6458,len:1.25,can:false},
 {id:'whisper',n:'WHISPER DMR',cls:'SEMI-AUTO · CAN',d:'Semi-automatic with a can. Fast follow-ups on moving targets, more sway.',v0:740,k:.0009,stab:.5,power:2,noise:.45,cycle:.33,mag:10,reload:2.8,unlock:9,body:0x24262a,stock:0x8a7a5a,len:1.08,can:true},
 {id:'halberd',n:'HALBERD .50',cls:'ANTI-MATERIEL',d:'Kills an engine in one hit, punches through glass and thin cover. Loud.',v0:860,k:.00042,stab:.55,power:4,noise:1.7,cycle:1.8,mag:5,reload:3.4,unlock:13,body:0x30302c,stock:0x30302c,len:1.42,can:false}];
export const SCOPES=[
 {id:'field',n:'FIELD 10',d:'3–10× duplex mil-dot. Wide and bright.',min:3,max:10,bdc:0,unlock:0},
 {id:'tac',n:'TACTICAL 16',d:'4–16× with a finer mil-dot grid.',min:4,max:16,bdc:0,unlock:4},
 {id:'bal',n:'BALLISTIC 25',d:'5–25× with a bullet-drop chevron for the ranged distance.',min:5,max:25,bdc:1,unlock:8},
 {id:'obs',n:'OBSIDIAN 36',d:'6–36× with drop chevron and live wind hold.',min:6,max:36,bdc:2,unlock:15}];
export const BASE_FOV=60;

// integrate one step (semi-implicit Euler); p,v are {x,y,z}
export function stepBullet(p,v,k,w,dt){const rx=v.x-w.x,ry=v.y-w.y,rz=v.z-w.z,s=Math.hypot(rx,ry,rz),d=k*s;
 v.x-=d*rx*dt;v.y-=(d*ry+G)*dt;v.z-=d*rz*dt;p.x+=v.x*dt;p.y+=v.y*dt;p.z+=v.z*dt;}

// height (m) of a no-wind trajectory relative to a level line of sight, at horizontal distance x, for launch elevation a
function heightAt(r,a,x){const p={x:0,y:0,z:0},v={x:Math.cos(a)*r.v0,y:Math.sin(a)*r.v0,z:0},w={x:0,y:0,z:0};const dt=1/600;let px=0,py=0;
 for(let i=0;i<20000;i++){px=p.x;py=p.y;stepBullet(p,v,r.k,w,dt);if(p.x>=x){const f=(x-px)/(p.x-px);return py+(p.y-py)*f;}}return -999;}
const ZC={};
// barrel elevation (rad) above the sight line that makes the bullet cross it again at `range`
export function zeroAngle(r,range){const key=r.id+'|'+range;if(ZC[key]!==undefined)return ZC[key];let lo=0,hi=.06;for(let i=0;i<34;i++){const m=(lo+hi)/2;if(heightAt(r,m,range)>0)hi=m;else lo=m;}return ZC[key]=(lo+hi)/2;}
// drop below the line of sight at distance d (m) with the given zero, in mils (positive = bullet low)
export function dropMils(r,zero,d){if(d<5)return 0;const h=heightAt(r,zeroAngle(r,zero),d);return -h/d*1000;}
// time of flight to horizontal distance d
export function tof(r,d){const p={x:0,y:0,z:0},v={x:r.v0,y:0,z:0},w={x:0,y:0,z:0};const dt=1/600;let t=0;for(let i=0;i<20000&&p.x<d;i++){stepBullet(p,v,r.k,w,dt);t+=dt;}return t;}
// lateral drift (m) for a full-value crosswind ws at distance d (lag-time result of the drag model)
export function driftAt(r,d,ws){const p={x:0,y:0,z:0},v={x:r.v0,y:0,z:0},w={x:0,y:0,z:ws};const dt=1/600;for(let i=0;i<20000&&p.x<d;i++)stepBullet(p,v,r.k,w,dt);return p.z;}
export const clampZero=z=>Math.max(100,Math.min(1000,Math.round(z/25)*25));
