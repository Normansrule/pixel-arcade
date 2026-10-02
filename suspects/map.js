// STARSHIP SUSPECTS — ship layout, walk / vision grids, line of sight, A* pathfinding, collision.
// Pure JS (no three.js) so the simulation can be unit-tested headlessly. 1 grid cell = 1 world unit; world x = grid x, world z = grid z.

/* ---------- seeded random (live binding: importers see re-seeds) ---------- */
export let rand=Math.random;
export function seed(s){if(s==null){rand=Math.random;return;}let a=s>>>0||1;rand=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const pick=a=>a[rand()*a.length|0];
export const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rand()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};

export const MW=70,MH=41;
// rooms: r=[x0,x1,z0,z1) in cells. light = room light colour, floor = floor tint
export const ROOMS=[
 {id:'caf',n:'CAFETERIA',r:[24,42,2,16],light:0xffe2b8,floor:0x8a8f99,li:1.0},
 {id:'med',n:'MED BAY',r:[10,20,4,13],light:0xbff4ff,floor:0x9fb6bf,li:1.0},
 {id:'o2',n:'O2 GARDEN',r:[48,57,3,12],light:0xb9ffc8,floor:0x6f8a74,li:.9},
 {id:'nav',n:'NAVIGATION',r:[60,70,16,26],light:0x9cc4ff,floor:0x6c7a96,li:.95},
 {id:'shd',n:'SHIELDS',r:[50,59,30,39],light:0xc7b0ff,floor:0x7d7698,li:.9},
 {id:'com',n:'COMMS',r:[36,45,32,40],light:0x9ff0e4,floor:0x6a8a88,li:.9},
 {id:'sto',n:'STORAGE',r:[22,33,24,37],light:0xffc985,floor:0x8c8070,li:.95},
 {id:'ele',n:'ELECTRICAL',r:[12,20,24,32],light:0xfff09a,floor:0x77786a,li:.85},
 {id:'rea',n:'REACTOR',r:[0,8,15,26],light:0x8fd0ff,floor:0x5f6f80,li:.9},
 {id:'eng',n:'ENGINES',r:[2,11,32,41],light:0xffb27a,floor:0x806e64,li:.9},
];
export const RI=Object.fromEntries(ROOMS.map((r,i)=>[r.id,i]));
// hallways [x0,x1,z0,z1)
export const HALLS=[[20,24,7,10],[42,48,6,9],[31,34,16,19],[8,60,19,22],[26,29,22,24],[15,18,22,24],[13,16,13,19],[53,56,22,30],[33,36,33,36],[45,50,34,37],[52,55,12,19],[11,15,32,35],[3,6,26,32]];
// movement-blocking props (cells) — tables, beds, crates, machines. They do not block sight.
export const PROPS=[
 // cafeteria: 4 tables + emergency button pedestal
 {k:'table',r:[27,29,4,6]},{k:'table',r:[37,39,4,6]},{k:'table',r:[27,29,11,13]},{k:'table',r:[37,39,11,13]},{k:'button',r:[32,34,8,10]},
 // med bay beds
 {k:'bed',r:[11,13,4,6]},{k:'bed',r:[14,16,4,6]},
 // O2 planters
 {k:'planter',r:[50,55,5,6]},{k:'planter',r:[50,55,8,9]},
 // navigation helm (window wall)
 {k:'helm',r:[68,70,18,24]},
 // shields emitter
 {k:'emitter',r:[54,56,34,36]},
 // comms racks
 {k:'rack',r:[37,41,38,40]},
 // storage crates
 {k:'crate',r:[24,26,29,31]},{k:'crate',r:[28,31,31,33]},{k:'crate',r:[25,27,34,36]},{k:'crate',r:[30,32,27,28]},
 // electrical cabinets
 {k:'cabinet',r:[12,13,26,30]},
 // reactor core
 {k:'core',r:[2,5,19,22]},
 // engine block
 {k:'engine',r:[3,6,35,39]},
];
// task / fix stations: stand point (x,z) and direction to the console (dx,dz); dir 0,0 = floor pad
export const TASK_TYPES={wires:{n:'FIX WIRING',v:'fixing wiring',t:5},swipe:{n:'SWIPE CARD',v:'swiping my card',t:4},fuel:{n:'FUEL ENGINES',v:'fuelling the engines',t:6},shields:{n:'PRIME SHIELDS',v:'priming shields',t:5},asteroids:{n:'CLEAR ASTEROIDS',v:'shooting asteroids',t:8},download:{n:'DOWNLOAD DATA',v:'downloading data',t:8},align:{n:'ALIGN ENGINE',v:'aligning the engine',t:5},scan:{n:'SUBMIT SCAN',v:'doing my scan',t:8,visual:true}};
export const STATIONS=[
 {id:'w-ele',type:'wires',x:13.5,z:24.6,dx:0,dz:-1},
 {id:'w-caf',type:'wires',x:40.5,z:2.6,dx:0,dz:-1},
 {id:'w-nav',type:'wires',x:62.5,z:16.6,dx:0,dz:-1},
 {id:'w-sto',type:'wires',x:31.5,z:24.6,dx:0,dz:-1},
 {id:'s-com',type:'swipe',x:41.5,z:32.6,dx:0,dz:-1},
 {id:'s-caf',type:'swipe',x:25.5,z:2.6,dx:0,dz:-1},
 {id:'f-sto',type:'fuel',x:22.6,z:26.5,dx:-1,dz:0},
 {id:'f-eng',type:'fuel',x:6.6,z:37,dx:-1,dz:0},
 {id:'h-shd',type:'shields',x:56.6,z:35,dx:-1,dz:0},
 {id:'h-sh2',type:'shields',x:51.5,z:30.6,dx:0,dz:-1},
 {id:'a-nav',type:'asteroids',x:67.4,z:21,dx:1,dz:0},
 {id:'a-o2',type:'asteroids',x:56.4,z:10.5,dx:1,dz:0},
 {id:'d-com',type:'download',x:37.5,z:32.6,dx:0,dz:-1},
 {id:'d-o2',type:'download',x:49.5,z:3.6,dx:0,dz:-1},
 {id:'d-med',type:'download',x:19.4,z:11.5,dx:1,dz:0},
 {id:'d-nav',type:'download',x:61.5,z:25.4,dx:0,dz:1},
 {id:'l-eng',type:'align',x:8.5,z:32.6,dx:0,dz:-1},
 {id:'l-rea',type:'align',x:.6,z:17.5,dx:-1,dz:0},
 {id:'c-med',type:'scan',x:17.5,z:10.2,dx:0,dz:0},
];
export const FIX={lights:[{id:'x-ele',x:19.4,z:28,dx:1,dz:0}],reactor:[{id:'x-r1',x:.6,z:23.5,dx:-1,dz:0},{id:'x-r2',x:6.5,z:15.6,dx:0,dz:-1}],oxygen:[{id:'x-o1',x:56.4,z:6.5,dx:1,dz:0},{id:'x-o2',x:24.6,z:13.8,dx:-1,dz:0}]};
export const BUTTON={x:33,z:9,r:1.9};
export const VENTS=[
 {id:0,x:6.5,z:24.5,net:'A'},{id:1,x:9.5,z:39.5,net:'A'},{id:2,x:13.5,z:31,net:'A'},
 {id:3,x:11,z:11.5,net:'B'},{id:4,x:25.5,z:14.5,net:'B'},
 {id:5,x:49,z:10.5,net:'C'},{id:6,x:63.5,z:24.5,net:'C'},{id:7,x:51,z:37.5,net:'C'},
 {id:8,x:31.5,z:35.5,net:'D'},{id:9,x:43.5,z:38.5,net:'D'},
];
export const ventLinks=v=>VENTS.filter(o=>o.net===v.net&&o!==v);
export const SPAWN={x:33,z:12.4};

/* ---------- grids ---------- */
export const floor=new Uint8Array(MW*MH),roomOf=new Int8Array(MW*MH).fill(-1),prop=new Uint8Array(MW*MH),door=new Int16Array(MW*MH).fill(-1);
const inR=(r,x,z)=>x>=r[0]&&x<r[1]&&z>=r[2]&&z<r[3];
ROOMS.forEach((rm,i)=>{const r=rm.r;for(let z=r[2];z<r[3];z++)for(let x=r[0];x<r[1];x++){floor[z*MW+x]=1;roomOf[z*MW+x]=i;}rm.cx=(r[0]+r[1])/2;rm.cz=(r[2]+r[3])/2;});
for(const r of HALLS)for(let z=r[2];z<r[3];z++)for(let x=r[0];x<r[1];x++)floor[z*MW+x]=1;
for(const p of PROPS){const r=p.r;for(let z=r[2];z<r[3];z++)for(let x=r[0];x<r[1];x++)prop[z*MW+x]=1;}
// doors: hallway cells directly adjacent to a room cell. One door group per room.
export const DOORS=ROOMS.map(()=>({cells:[],closed:0}));
for(let z=0;z<MH;z++)for(let x=0;x<MW;x++){const i=z*MW+x;if(!floor[i]||roomOf[i]>=0)continue;
 for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=MW||nz>=MH)continue;const r=roomOf[nz*MW+nx];if(r>=0){DOORS[r].cells.push(i);door[i]=r;}}}
// door spans (for rendering): group adjacent cells
export function doorSpans(r){const cs=DOORS[r].cells.map(i=>({x:i%MW,z:i/MW|0}));const spans=[];const used=new Set();
 for(const c of cs){const k=c.x+','+c.z;if(used.has(k))continue;const grp=[c];used.add(k);let grow=true;while(grow){grow=false;for(const d of cs){const kk=d.x+','+d.z;if(used.has(kk))continue;if(grp.some(g=>Math.abs(g.x-d.x)+Math.abs(g.z-d.z)===1)){grp.push(d);used.add(kk);grow=true;}}}
  const xs=grp.map(g=>g.x),zs=grp.map(g=>g.z);spans.push({x0:Math.min(...xs),x1:Math.max(...xs)+1,z0:Math.min(...zs),z1:Math.max(...zs)+1,vertical:Math.max(...xs)===Math.min(...xs)&&grp.length>1});}
 return spans;}
export const isDoorClosed=i=>door[i]>=0&&DOORS[door[i]].closed>0;
export const walkable=(x,z)=>{x=Math.floor(x);z=Math.floor(z);if(x<0||z<0||x>=MW||z>=MH)return false;const i=z*MW+x;return floor[i]===1&&!prop[i]&&!isDoorClosed(i);};
export const opaque=(x,z)=>{if(x<0||z<0||x>=MW||z>=MH)return true;const i=z*MW+x;return !floor[i]||isDoorClosed(i);};
export function roomAt(x,z){x=Math.floor(x);z=Math.floor(z);if(x<0||z<0||x>=MW||z>=MH)return -1;return roomOf[z*MW+x];}
export function nearestRoom(x,z){let b=0,bd=1e9;ROOMS.forEach((r,i)=>{const cx=Math.max(r.r[0],Math.min(r.r[1],x)),cz=Math.max(r.r[2],Math.min(r.r[3],z));const d=(cx-x)**2+(cz-z)**2;if(d<bd){bd=d;b=i;}});return b;}
// a human label for a spot: room name, or "the hall by X"
export function placeName(x,z){const r=roomAt(x,z);return r>=0?ROOMS[r].n:'THE HALL BY '+ROOMS[nearestRoom(x,z)].n;}
export function placeKey(x,z){const r=roomAt(x,z);return r>=0?r:100+nearestRoom(x,z);}
export const keyName=k=>k<100?ROOMS[k].n:'THE HALL BY '+ROOMS[k-100].n;
const tc=s=>s.toLowerCase().replace(/\b(\w)/g,m=>m.toUpperCase()).replace('O2','O2');
export const prettyPlace=k=>k<100?tc(ROOMS[k].n):'the hall by '+tc(ROOMS[k-100].n);
export const compatible=(a,b)=>a===b||a%100===b%100;

/* ---------- line of sight (exact grid DDA) ---------- */
// distance from (x0,z0) along (dx,dz) unit dir until an opaque cell, capped at max
export function castRay(x0,z0,dx,dz,max){let cx=Math.floor(x0),cz=Math.floor(z0);if(opaque(cx,cz))return 0;
 const sx=dx>0?1:-1,sz=dz>0?1:-1,tdx=dx!==0?Math.abs(1/dx):1e9,tdz=dz!==0?Math.abs(1/dz):1e9;
 let tx=dx!==0?((dx>0?cx+1-x0:x0-cx)*tdx):1e9,tz=dz!==0?((dz>0?cz+1-z0:z0-cz)*tdz):1e9,t=0;
 for(let n=0;n<200;n++){if(tx<tz){t=tx;tx+=tdx;cx+=sx;}else{t=tz;tz+=tdz;cz+=sz;}if(t>=max)return max;if(opaque(cx,cz))return t;}return max;}
export function los(x0,z0,x1,z1){const dx=x1-x0,dz=z1-z0,d=Math.hypot(dx,dz);if(d<1e-4)return true;return castRay(x0,z0,dx/d,dz/d,d)>=d-1e-3;}
// can an observer at (ox,oz) see a point within radius r?
export const canSee=(ox,oz,x,z,r)=>((x-ox)**2+(z-oz)**2<=r*r)&&los(ox,oz,x,z);

/* ---------- A* on the walk grid (8-connected, no corner cutting) ---------- */
const N=MW*MH,gS=new Float32Array(N),fS=new Float32Array(N),from=new Int32Array(N),stamp=new Uint32Array(N),closed=new Uint32Array(N);let gen=0;
const SQ2=Math.SQRT2;
function nearestWalk(x,z){x=Math.floor(x);z=Math.floor(z);if(walkable(x+.5,z+.5))return[x,z];for(let r=1;r<6;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;if(walkable(x+dx+.5,z+dz+.5))return[x+dx,z+dz];}return[x,z];}
export function findPath(x0,z0,x1,z1){const[sx,sz]=nearestWalk(x0,z0),[ex,ez]=nearestWalk(x1,z1);const s=sz*MW+sx,e=ez*MW+ex;if(s===e)return[{x:x1,z:z1}];
 gen++;const open=[s];stamp[s]=gen;gS[s]=0;fS[s]=Math.hypot(ex-sx,ez-sz);from[s]=-1;
 const h=(i)=>{const dx=Math.abs(i%MW-ex),dz=Math.abs((i/MW|0)-ez);return dx+dz+(SQ2-2)*Math.min(dx,dz);};
 let found=false,it=0;
 while(open.length&&it++<6000){let bi=0;for(let k=1;k<open.length;k++)if(fS[open[k]]<fS[open[bi]])bi=k;const c=open[bi];open[bi]=open[open.length-1];open.pop();if(c===e){found=true;break;}closed[c]=gen;
  const cx=c%MW,cz=c/MW|0;
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=cx+dx,nz=cz+dz;if(!walkable(nx+.5,nz+.5))continue;if(dx&&dz&&(!walkable(cx+dx+.5,cz+.5)||!walkable(cx+.5,cz+dz+.5)))continue;
   const n=nz*MW+nx;if(closed[n]===gen)continue;const g=gS[c]+(dx&&dz?SQ2:1);if(stamp[n]!==gen||g<gS[n]){const isNew=stamp[n]!==gen;stamp[n]=gen;gS[n]=g;fS[n]=g+h(n);from[n]=c;if(isNew)open.push(n);}}}
 if(!found)return null;const cells=[];for(let c=e;c!==-1;c=from[c])cells.push(c);cells.reverse();
 const pts=cells.map(c=>({x:c%MW+.5,z:(c/MW|0)+.5}));pts[pts.length-1]={x:x1,z:z1};if(!walkable(x1,z1))pts[pts.length-1]={x:ex+.5,z:ez+.5};
 // string pulling with a fat line test
 const out=[{x:x0,z:z0}];let a=0;while(a<pts.length-1){let b=pts.length-1;for(;b>a+1;b--)if(clearLine(a===0?x0:pts[a].x,a===0?z0:pts[a].z,pts[b].x,pts[b].z))break;out.push(pts[b]);a=b;}
 return out.slice(1);}
export function clearLine(x0,z0,x1,z1,r=.34){const d=Math.hypot(x1-x0,z1-z0),n=Math.ceil(d/.2);for(let i=0;i<=n;i++){const t=n?i/n:0,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;if(!walkable(x-r,z-r)||!walkable(x+r,z-r)||!walkable(x-r,z+r)||!walkable(x+r,z+r))return false;}return true;}

/* ---------- circle vs grid collision ---------- */
export function collide(p,r=.32){for(let k=0;k<2;k++){const cx=Math.floor(p.x),cz=Math.floor(p.z);
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const gx=cx+dx,gz=cz+dz;if(walkable(gx+.5,gz+.5))continue;
  const nx=Math.max(gx,Math.min(gx+1,p.x)),nz=Math.max(gz,Math.min(gz+1,p.z));let ex=p.x-nx,ez=p.z-nz;const d2=ex*ex+ez*ez;
  if(d2<r*r){if(d2>1e-8){const d=Math.sqrt(d2);p.x+=ex/d*(r-d);p.z+=ez/d*(r-d);}else{// centre inside the cell: push out along the shallow axis
   const l=p.x-gx,rr=gx+1-p.x,t=p.z-gz,b=gz+1-p.z,m=Math.min(l,rr,t,b);if(m===l)p.x=gx-r;else if(m===rr)p.x=gx+1+r;else if(m===t)p.z=gz-r;else p.z=gz+1+r;}}}}}

/* ---------- visibility polygon (for the fog-of-war mask) ---------- */
export function visPoly(x,z,rad,n=360,out=[]){out.length=0;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,dx=Math.cos(a),dz=Math.sin(a);const d=castRay(x,z,dx,dz,rad);out.push(x+dx*d,z+dz*d);}return out;}
