// STARSHIP SUSPECTS — ship layout, walk / vision grids, line of sight, A* pathfinding, collision.
// Pure JS (no three.js) so the simulation can be unit-tested headlessly. 1 grid cell = 1 world unit; world x = grid x, world z = grid z.

/* ---------- seeded random (live binding: importers see re-seeds) ---------- */
export let rand=Math.random;
export function seed(s){if(s==null){rand=Math.random;return;}let a=s>>>0||1;rand=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const pick=a=>a[rand()*a.length|0];
export const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rand()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};

export const MW=64,MH=46;
// rooms: r=[x0,x1,z0,z1) in cells. light = lamp colour, floor = floor tint, pat = floor pattern, acc = accent (trim / signage)
export const ROOMS=[
 {id:'gal',n:'GALLEY',r:[25,41,16,30],light:0xffe3bf,floor:0xffffff,li:1.0,pat:'tile',acc:0xff8a3d},
 {id:'brg',n:'BRIDGE',r:[27,39,1,8],light:0xd6e6ff,floor:0xffffff,li:.95,pat:'deck',acc:0x4fa3ff},
 {id:'rad',n:'RADIO ROOM',r:[18,25,1,8],light:0xffe9c9,floor:0xffffff,li:.9,pat:'plank',acc:0xffc23d},
 {id:'obs',n:'OBSERVATORY',r:[51,61,2,13],light:0xe0d4ff,floor:0xffffff,li:.95,pat:'star',acc:0xa77bff},
 {id:'grn',n:'GREENHOUSE',r:[51,63,17,29],light:0xe4ffd6,floor:0xffffff,li:1.0,pat:'moss',acc:0x4fd16a},
 {id:'lab',n:'LAB',r:[51,61,33,43],light:0xd8fffa,floor:0xffffff,li:.95,pat:'hex',acc:0x2fd6c8},
 {id:'eng',n:'ENGINE ROOM',r:[25,41,38,45],light:0xffd6b0,floor:0xffffff,li:.95,pat:'grate',acc:0xff5a3d},
 {id:'crg',n:'CARGO BAY',r:[5,16,33,43],light:0xffe6b0,floor:0xffffff,li:.95,pat:'hazard',acc:0xffb020},
 {id:'pwr',n:'POWER ROOM',r:[4,15,18,28],light:0xfff4b8,floor:0xffffff,li:.9,pat:'grate2',acc:0xffe03d},
 {id:'bnk',n:'BUNKS',r:[5,16,2,12],light:0xffdcea,floor:0xffffff,li:.95,pat:'carpet',acc:0xff7ab8},
];
export const RI=Object.fromEntries(ROOMS.map((r,i)=>[r.id,i]));
// words the meeting chat understands for each room
export const ALIAS={gal:['galley','kitchen','mess','cafe'],brg:['bridge','helm','cockpit'],rad:['radio'],obs:['observatory','obs','telescope'],grn:['greenhouse','green','garden','plants'],
 lab:['lab','science'],eng:['engine','engines','eng'],crg:['cargo','storage'],pwr:['power','generator','elec'],bnk:['bunks','bunk','beds','quarters']};
// hallways [x0,x1,z0,z1): the ring around the galley, its spokes, the room halls and two service tunnels
export const HALLS=[[19,47,10,13],[19,47,33,36],[19,22,10,36],[44,47,10,36],
 [31,35,13,16],[31,35,30,33],[22,25,21,25],[41,44,21,25],
 [31,35,8,10],[20,23,8,10],[16,19,10,13],[47,51,10,13],[47,51,21,25],[47,51,33,36],[31,35,36,38],[16,19,33,36],[15,19,21,25],
 [16,25,39,41],[41,51,39,41],[55,58,13,17],[8,11,12,18]];
// movement-blocking props (cells). They do not block sight.
export const PROPS=[
 {k:'button',r:[32,34,22,24]},{k:'table',r:[27,29,18,20]},{k:'table',r:[37,39,18,20]},{k:'table',r:[27,29,26,28]},{k:'table',r:[37,39,26,28]},
 {k:'counter',r:[25,29,16,17]},{k:'counter',r:[37,41,16,17]},
 {k:'chair',r:[32,34,4,5]},
 {k:'rack',r:[18,19,3,7]},
 {k:'scope',r:[55,58,5,8]},{k:'globe',r:[59,60,10,12]},
 {k:'bed',r:[53,61,19,20]},{k:'bed',r:[53,61,26,27]},{k:'tree',r:[58,60,22,24]},
 {k:'tanks',r:[60,61,34,37]},{k:'bench',r:[54,57,37,39]},
 {k:'core',r:[31,35,41,44]},
 {k:'crate',r:[6,8,34,36]},{k:'crate',r:[10,13,36,38]},{k:'crate',r:[6,9,40,42]},{k:'crate',r:[12,14,41,43]},
 {k:'gen',r:[6,9,21,25]},{k:'cabinet',r:[4,5,19,27]},
 {k:'bunk',r:[6,9,3,5]},{k:'bunk',r:[11,14,3,5]},{k:'bunk',r:[6,9,7,9]},{k:'locker',r:[15,16,3,7]},
];
// task / fix stations: stand point (x,z) and direction to the console (dx,dz); dir 0,0 = floor pad
export const TASK_TYPES={
 cook:{n:'COOK RATIONS',v:'cooking rations',t:5},trash:{n:'TIDY UP',v:'tidying up',t:4},stars:{n:'CHART STARS',v:'charting stars',t:6},
 beacon:{n:'CALIBRATE BEACON',v:'calibrating the beacon',t:6},radio:{n:'TUNE RADIO',v:'tuning the radio',t:5},water:{n:'WATER SPROUTS',v:'watering the sprouts',t:5},
 mix:{n:'MIX SAMPLE',v:'mixing a sample',t:6},scan:{n:'GRAVITY TEST',v:'doing my gravity test',t:8,visual:true},pipes:{n:'ROUTE COOLANT',v:'routing coolant',t:6},
 crates:{n:'SORT CARGO',v:'sorting cargo',t:6}};
export const STATIONS=[
 {id:'k-gal',type:'cook',x:25.6,z:28.5,dx:-1,dz:0},
 {id:'t-gal',type:'trash',x:40.4,z:28.5,dx:1,dz:0},
 {id:'t-bnk',type:'trash',x:15.4,z:8.5,dx:1,dz:0},
 {id:'s-brg',type:'stars',x:29.5,z:1.6,dx:0,dz:-1},
 {id:'s-obs',type:'stars',x:60.4,z:4.5,dx:1,dz:0},
 {id:'b-brg',type:'beacon',x:36.5,z:1.6,dx:0,dz:-1},
 {id:'b-rad',type:'beacon',x:20.5,z:1.6,dx:0,dz:-1},
 {id:'r-rad',type:'radio',x:23.5,z:1.6,dx:0,dz:-1},
 {id:'r-obs',type:'radio',x:53.5,z:2.6,dx:0,dz:-1},
 {id:'w-gr1',type:'water',x:62.4,z:21,dx:1,dz:0},
 {id:'w-gr2',type:'water',x:51.6,z:28,dx:-1,dz:0},
 {id:'m-lab',type:'mix',x:55.5,z:33.6,dx:0,dz:-1},
 {id:'m-la2',type:'mix',x:60.4,z:41,dx:1,dz:0},
 {id:'g-lab',type:'scan',x:58.5,z:40.2,dx:0,dz:0},
 {id:'p-pwr',type:'pipes',x:14.4,z:19.2,dx:1,dz:0},
 {id:'p-eng',type:'pipes',x:39.5,z:38.6,dx:0,dz:-1},
 {id:'c-cr1',type:'crates',x:5.6,z:38,dx:-1,dz:0},
 {id:'c-cr2',type:'crates',x:15.4,z:37.5,dx:1,dz:0},
];
export const FIX={lights:[{id:'x-pwr',x:14.4,z:27,dx:1,dz:0}],reactor:[{id:'x-r1',x:25.6,z:43,dx:-1,dz:0},{id:'x-r2',x:40.4,z:43,dx:1,dz:0}],oxygen:[{id:'x-o1',x:62.4,z:26.5,dx:1,dz:0},{id:'x-o2',x:33,z:1.6,dx:0,dz:-1}]};
// what each sabotage is called on screen, and where it is fixed
export const SAB={lights:{n:'LIGHTS OUT',fix:'FLIP THE BREAKERS IN THE POWER ROOM',short:'BREAKERS · POWER ROOM'},reactor:{n:'CORE OVERLOAD',fix:'HOLD BOTH CORE PANELS IN THE ENGINE ROOM',short:'CORE · ENGINE ROOM ×2'},oxygen:{n:'AIR FAILING',fix:'RESET THE SCRUBBERS IN THE GREENHOUSE AND ON THE BRIDGE',short:'AIR · GREENHOUSE + BRIDGE'}};
export const BUTTON={x:33,z:23,r:1.9};
export const VENTS=[
 {id:0,x:12.5,z:10.5,net:'A'},{id:1,x:11.5,z:26.5,net:'A'},{id:2,x:9.5,z:38.5,net:'A'},
 {id:3,x:21.5,z:5.5,net:'B'},{id:4,x:29.5,z:6.5,net:'B'},
 {id:5,x:53.5,z:10.5,net:'C'},{id:6,x:55.5,z:23.5,net:'C'},{id:7,x:52.5,z:41.5,net:'C'},
 {id:8,x:30.5,z:28.5,net:'D'},{id:9,x:39.5,z:41.5,net:'D'},
];
export const ventLinks=v=>VENTS.filter(o=>o.net===v.net&&o!==v);
export const SPAWN={x:33,z:26.4};

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
