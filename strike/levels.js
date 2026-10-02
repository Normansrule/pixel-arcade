// STRIKE ZONE — arenas: 2.5D heightfield grids (2 m cells) authored with rect/circle helpers, plus collision, grid raycast and monster flow fields.
export const CS=2,STEP=.56;
// cell chars: '.' floor · '1'-'9' raised (0.5 m each) · '#' wall · 'H' pillar · 'W' rune wall (secret, shootable) · 'Q' perch 6 m · 'L' lava · 'v' void · 'x' crate · 'C' reactor core
const HT={'.':0,'#':8,'H':11,'W':8,'Q':6,'L':-.5,'v':-60,'x':1.5,'C':14};
export const hOf=c=>c in HT?HT[c]:(c>='1'&&c<='9')?(+c)*.5:0;
const SOLIDWALL={'#':1,'W':1,'H':1,'C':1};

function grid(w,h,c){const g=[];for(let z=0;z<h;z++)g.push(Array(w).fill(c));return g;}
function rect(g,x0,z0,x1,z1,c){for(let z=Math.min(z0,z1);z<=Math.max(z0,z1);z++)for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)if(g[z]&&g[z][x]!==undefined)g[z][x]=c;}
function circ(g,cx,cz,r,c){for(let z=Math.floor(cz-r);z<=Math.ceil(cz+r);z++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){if(!g[z]||g[z][x]===undefined)continue;if(Math.hypot(x-cx,z-cz)<=r+.25)g[z][x]=c;}}
// 4-way mirror for square arenas
function sym4(g,x0,z0,x1,z1,c){const W=g[0].length,H=g.length;rect(g,x0,z0,x1,z1,c);rect(g,W-1-x1,z0,W-1-x0,z1,c);rect(g,x0,H-1-z1,x1,H-1-z0,c);rect(g,W-1-x1,H-1-z1,W-1-x0,H-1-z0,c);}
const mir4=(W,H,p)=>[[p[0],p[1]],[W-p[0],p[1]],[p[0],H-p[1]],[W-p[0],H-p[1]]];

/* ================= arena authoring ================= */
function foundry(){const W=34,H=34,g=grid(W,H,'.');
 rect(g,0,0,33,1,'#');rect(g,0,32,33,33,'#');rect(g,0,0,1,33,'#');rect(g,32,0,33,33,'#');
 sym4(g,3,3,6,6,'9');                                   // corner furnace towers 4.5 m
 rect(g,10,10,23,11,'L');rect(g,10,22,23,23,'L');rect(g,10,10,11,23,'L');rect(g,22,10,23,23,'L'); // lava ring
 for(const[a,b]of[[16,10],[16,22]]){rect(g,a,b,a+1,b+1,'1');rect(g,b,a,b+1,a+1,'1');}            // bridges
 rect(g,13,13,20,20,'2');rect(g,15,15,18,18,'4');                                               // dais
 rect(g,16,12,17,12,'1');rect(g,16,21,17,21,'1');rect(g,12,16,12,17,'1');rect(g,21,16,21,17,'1');
 rect(g,16,14,17,14,'3');rect(g,16,19,17,19,'3');rect(g,14,16,14,17,'3');rect(g,19,16,19,17,'3');
 sym4(g,8,12,8,12,'H');sym4(g,12,8,12,8,'H');                                                    // pillars
 sym4(g,4,14,5,15,'x');sym4(g,14,4,15,5,'x');sym4(g,26,9,26,9,'x');                             // crates
 rect(g,15,1,18,1,'W');rect(g,15,0,18,0,'.');                                                   // rune wall secret
 rect(g,29,8,30,9,'Q');                                                                         // perch secret
 return{id:'foundry',name:'FOUNDRY OF ASH',sub:'CAST IRON · MOLTEN CHANNELS',W,H,g,mood:'ash',
  start:[17,28.5],yaw:0,
  pads:[...mir4(W,H,[8.5,8.5]).map(p=>({at:p,to:[p[0]<17?4.9:29.1,p[1]<17?4.9:29.1]})),{at:[28.5,12.5],to:[30,9],hidden:true}],
  tele:[],
  secrets:[{cells:[15,0,18,0],rune:{cells:[15,1,18,1]},reward:[{k:'mega',c:[17,.9]}]},{cells:[29,8,30,9],reward:[{k:'quad',c:[30,9]}]}],
  spawns:[[4.5,10],[4.5,24],[29.5,10],[29.5,24],[10,4.5],[24,4.5],[10,29.5],[24,29.5],[4.9,4.9],[29.1,29.1],[4.9,29.1],[29.1,4.9],[8,17],[26,17]],
  air:[[11,11],[23,11],[11,23],[23,23],[17,6],[17,28]],
  items:[{k:'hp',c:[3,17]},{k:'hp',c:[31,17]},{k:'armor',c:[17,17]},{k:'shells',c:[9,4]},{k:'shells',c:[25,30]},{k:'bullets',c:[25,4]},{k:'bullets',c:[9,30]},{k:'cells',c:[4.9,4.9]},{k:'rockets',c:[29.1,29.1]},{k:'slugs',c:[29.1,4.9]},{k:'shard',c:[16.5,11]},{k:'shard',c:[16.5,23]},{k:'shard',c:[11,16.5]},{k:'shard',c:[23,16.5]},{k:'hp',c:[4.9,29.1]}],
  wspots:[{w:'ssg',c:[17,17],camp:1},{w:'cg',c:[17,6],camp:1},{w:'rl',c:[6,17]},{w:'pg',c:[28,17]},{w:'rg',c:[17,28]}],
  lights:[[17,17,3,0xff5a1a,40,26],[6,6,6,0xff7a30,26,18],[28,6,6,0xff7a30,26,18],[6,28,6,0xff7a30,26,18],[28,28,6,0xff7a30,26,18],[17,2,4,0x8aff6a,10,10]]};}

function nave(){const W=44,H=26,g=grid(W,H,'.');
 rect(g,0,0,43,1,'#');rect(g,0,24,43,25,'#');rect(g,0,0,1,25,'#');rect(g,42,0,43,25,'#');
 rect(g,2,2,41,5,'2');rect(g,2,20,41,23,'2');                    // raised side aisles
 rect(g,2,6,41,6,'1');rect(g,2,19,41,19,'1');                    // aisle steps
 for(let x=6;x<=38;x+=4){rect(g,x,6,x,6,'H');rect(g,x,19,x,19,'H');}
 rect(g,2,2,7,5,'8');rect(g,2,20,7,23,'8');                      // west balconies 4 m
 rect(g,31,8,40,17,'L');rect(g,34,10,38,15,'4');                  // lava moat + altar
 rect(g,31,12,31,13,'1');rect(g,32,12,32,13,'2');rect(g,33,12,33,13,'3');
 rect(g,12,9,13,10,'x');rect(g,12,15,13,16,'x');rect(g,20,12,21,13,'x');rect(g,26,9,26,9,'x');rect(g,26,16,26,16,'x');
 rect(g,17,10,17,10,'3');rect(g,17,15,17,15,'3');
 rect(g,20,24,23,24,'W');rect(g,20,25,23,25,'.');                 // rune wall secret (south)
 rect(g,39,2,41,3,'Q');                                         // perch secret (NE)
 return{id:'nave',name:'OBSIDIAN NAVE',sub:'BLACK GLASS · VIOLET FIRE',W,H,g,mood:'nave',
  start:[5,13],yaw:-Math.PI/2,
  pads:[{at:[30,9],to:[35,11]},{at:[30,17],to:[35,15]},{at:[36.5,4.5],to:[40.5,3],hidden:true}],
  tele:[{at:[28.5,22],to:[4.5,21.5],yaw:-Math.PI/2},{at:[28.5,4],to:[4.5,4.5],yaw:-Math.PI/2},{at:[8.5,3.8],to:[24,12.5],yaw:-Math.PI/2}],
  secrets:[{cells:[20,25,23,25],rune:{cells:[20,24,23,24]},reward:[{k:'megaarmor',c:[22,25.1]}]},{cells:[39,2,41,3],reward:[{k:'quad',c:[40.5,3]}]}],
  spawns:[[10,4],[18,4],[26,4],[34,4],[10,22],[18,22],[26,22],[34,22],[24,8],[24,17],[36,12.5],[4.5,4],[4.5,22]],
  air:[[16,12.5],[26,12.5],[36,12.5],[10,12.5]],
  items:[{k:'hp',c:[14,4]},{k:'hp',c:[14,22]},{k:'armor',c:[36,12.5]},{k:'shells',c:[22,4]},{k:'bullets',c:[22,22]},{k:'rockets',c:[30,4]},{k:'cells',c:[30,22]},{k:'slugs',c:[4.5,4.5]},{k:'shard',c:[18,12.5]},{k:'shard',c:[9,12.5]},{k:'hp',c:[4.5,21.5]},{k:'shells',c:[9,9]},{k:'bullets',c:[9,17]}],
  wspots:[{w:'rl',c:[36,12.5],camp:1},{w:'pg',c:[24,12.5],camp:1},{w:'ssg',c:[4.5,4.5]},{w:'cg',c:[4.5,21.5]},{w:'rg',c:[16,12.5]}],
  lights:[[36,12.5,4,0xb040ff,46,24],[20,12.5,5,0x40e0ff,24,22],[5,4,6,0xb050ff,18,14],[5,22,6,0xb050ff,18,14],[30,4,4,0xff60c0,14,14],[30,22,4,0xff60c0,14,14]]};}

function reactor(){const W=38,H=38,g=grid(W,H,'v');
 circ(g,19,19,8.2,'.');
 for(const[cx,cz]of[[19,5],[19,33],[5,19],[33,19]])circ(g,cx,cz,4,'2');
 rect(g,18,10,20,10,'1');rect(g,18,28,20,28,'1');rect(g,10,18,10,20,'1');rect(g,28,18,28,20,'1');
 circ(g,19,19,1.6,'C');
 for(const[cx,cz]of[[13,13],[25,13],[13,25],[25,25]])rect(g,cx,cz,cx,cz,'x');
 rect(g,24,1,25,2,'7');                                         // perch secret (needs a double jump)
 circ(g,33,33,2,'6');                                           // far isle secret (hidden pad)
 for(const[cx,cz]of[[8,8],[30,8],[8,30]])circ(g,cx,cz,1.6,'6');  // sniper isles
 return{id:'reactor',name:'THE MAW REACTOR',sub:'VOID SPAN · GREEN CORE',W,H,g,mood:'void',
  start:[19.5,26],yaw:0,
  pads:[{at:[16,16],to:[8.5,8.5]},{at:[23,16],to:[30.5,8.5]},{at:[16,23],to:[8.5,30.5]},{at:[34.5,22.5],to:[33.5,33.5],hidden:true},
   {at:[8.5,8.5],to:[13,15.5]},{at:[30.5,8.5],to:[25,15.5]},{at:[8.5,30.5],to:[13,23.5]},{at:[33.5,33.5],to:[25.5,25.5]}],
  tele:[{at:[19.5,2.2],to:[19.5,36],yaw:Math.PI,both:false},{at:[19.5,36.6],to:[19.5,3],yaw:0}],
  secrets:[{cells:[24,1,25,2],reward:[{k:'quad',c:[25,2]}]},{cells:[32,32,35,35],reward:[{k:'megaarmor',c:[33.5,33.5]}]}],
  spawns:[[19.5,5],[19.5,33],[5,19.5],[33,19.5],[13,19.5],[26,19.5],[19.5,13],[19.5,26],[8.5,8.5],[30.5,8.5],[8.5,30.5]],
  air:[[12,12],[27,12],[12,27],[27,27],[19.5,10],[19.5,29]],
  items:[{k:'hp',c:[19.5,4]},{k:'hp',c:[19.5,34]},{k:'armor',c:[4,19.5]},{k:'armor',c:[34,19.5]},{k:'shells',c:[13,19.5]},{k:'bullets',c:[26,19.5]},{k:'cells',c:[19.5,13]},{k:'rockets',c:[19.5,26]},{k:'slugs',c:[8.5,8.5]},{k:'shard',c:[16,22]},{k:'shard',c:[23,22]},{k:'hp',c:[30.5,8.5]},{k:'rockets',c:[8.5,30.5]}],
  wspots:[{w:'rg',c:[19.5,5],camp:1},{w:'ssg',c:[5,19.5]},{w:'cg',c:[33,19.5]},{w:'rl',c:[19.5,33]},{w:'pg',c:[26,24]}],
  lights:[[19.5,19.5,6,0x40ff90,60,30],[19.5,5,4,0x30d0ff,18,16],[19.5,33,4,0x30d0ff,18,16],[5,19.5,4,0x30d0ff,18,16],[33,19.5,4,0x30d0ff,18,16]],
  bossAt:[19.5,13]};}

export const ARENAS=[foundry(),nave(),reactor()];

/* ================= runtime level ================= */
export class Level{
 constructor(def){this.def=def;this.W=def.W;this.H=def.H;const n=this.W*this.H;this.ch=new Array(n);this.top=new Float32Array(n);this.ctop=new Float32Array(n);this.flags=new Uint8Array(n);
  for(let z=0;z<this.H;z++)for(let x=0;x<this.W;x++){const i=z*this.W+x,c=def.g[z][x];this.ch[i]=c;this.top[i]=hOf(c);this.ctop[i]=SOLIDWALL[c]?120:hOf(c);this.flags[i]=c==='L'?1:c==='v'?2:0;}
  this.runes=(def.secrets||[]).filter(s=>s.rune).map((s,k)=>({id:k,cells:s.rune.cells,open:0,opening:false,secret:s}));
  this.dist=new Int16Array(n);this.flyDist=new Int16Array(n);this.flowT=-1;}
 idx(x,z){const i=Math.floor(x/CS),j=Math.floor(z/CS);if(i<0||j<0||i>=this.W||j>=this.H)return-1;return j*this.W+i;}
 P(c,y){return{x:c[0]*CS,y:y??this.groundAt(c[0]*CS,c[1]*CS),z:c[1]*CS};}
 cellTop(x,z){const i=this.idx(x,z);return i<0?(this.def.mood==='void'?-60:120):this.ctop[i];}
 visTop(x,z){const i=this.idx(x,z);return i<0?-60:this.top[i];}
 isLava(x,z){const i=this.idx(x,z);return i>=0&&this.flags[i]===1;}
 isVoid(x,z){const i=this.idx(x,z);return i<0?this.def.mood==='void':this.flags[i]===2;}
 // highest walkable top under a footprint (only tops at or below y+step count as ground)
 groundAt(x,z,y=999,r=0){let g=-60;const pts=r?[[x-r,z-r],[x+r,z-r],[x-r,z+r],[x+r,z+r],[x,z]]:[[x,z]];for(const p of pts){const t=this.cellTop(p[0],p[1]);if(t<=y+STEP&&t>g)g=t;}return g;}
 maxTop(x0,z0,x1,z1){let m=-60;const i0=Math.floor(x0/CS),i1=Math.floor(x1/CS),j0=Math.floor(z0/CS),j1=Math.floor(z1/CS);for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){let t;if(i<0||j<0||i>=this.W||j>=this.H)t=this.def.mood==='void'?-60:120;else t=this.ctop[j*this.W+i];if(t>m)m=t;}return m;}
 // axis-separated mover for a cylinder of radius r standing at p (feet); returns {hitX,hitZ,landed,ceil}
 move(p,v,dt,r,onGround,stepH=STEP){const out={hitX:false,hitZ:false,landed:false,stepped:0};
  const nx=p.x+v.x*dt;if(v.x!==0){const m=this.maxTop(nx-r,p.z-r+.01,nx+r,p.z+r-.01);if(m>p.y+(onGround?stepH:.32)){out.hitX=true;const lead=v.x>0?Math.floor((nx+r)/CS)*CS-r-.002:Math.floor((nx-r)/CS+1)*CS+r+.002;p.x=v.x>0?Math.min(p.x,lead):Math.max(p.x,lead);v.x=0;}else{p.x=nx;if(m>p.y){out.stepped=m-p.y;p.y=m;}}}
  const nz=p.z+v.z*dt;if(v.z!==0){const m=this.maxTop(p.x-r+.01,nz-r,p.x+r-.01,nz+r);if(m>p.y+(onGround?stepH:.32)){out.hitZ=true;const lead=v.z>0?Math.floor((nz+r)/CS)*CS-r-.002:Math.floor((nz-r)/CS+1)*CS+r+.002;p.z=v.z>0?Math.min(p.z,lead):Math.max(p.z,lead);v.z=0;}else{p.z=nz;if(m>p.y){out.stepped=Math.max(out.stepped,m-p.y);p.y=m;}}}
  p.y+=v.y*dt;const gnd=this.maxTop(p.x-r+.01,p.z-r+.01,p.x+r-.01,p.z+r-.01);if(p.y<=gnd&&v.y<=0&&gnd>p.y-1.5){p.y=gnd;if(v.y<0)out.impact=-v.y;v.y=0;out.landed=true;}
  out.ground=gnd;return out;}
 // grid DDA raycast against cell columns; returns t (Infinity on miss) and writes normal + cell index into o
 ray(ox,oy,oz,dx,dy,dz,maxT,o){o=o||{};o.t=Infinity;o.nx=0;o.ny=0;o.nz=0;o.i=-1;
  let i=Math.floor(ox/CS),j=Math.floor(oz/CS);const sx=dx>0?1:-1,sz=dz>0?1:-1;const tdx=dx!==0?Math.abs(CS/dx):Infinity,tdz=dz!==0?Math.abs(CS/dz):Infinity;
  let tmx=dx!==0?((dx>0?(i+1)*CS-ox:ox-i*CS)/Math.abs(dx)):Infinity,tmz=dz!==0?((dz>0?(j+1)*CS-oz:oz-j*CS)/Math.abs(dz)):Infinity;let t0=0,side=-1;
  for(let n=0;n<160;n++){const top=(i<0||j<0||i>=this.W||j>=this.H)?(this.def.mood==='void'?-60:120):this.ctop[j*this.W+i];const t1=Math.min(tmx,tmz,maxT);
   const y0=oy+dy*t0,y1=oy+dy*t1;
   if(y0<=top){if(n===0&&dy<0&&y0<=top+.001){o.t=0;o.ny=1;o.i=j*this.W+i;return o;}o.t=t0;if(side===0)o.nx=-sx;else if(side===1)o.nz=-sz;else o.ny=1;o.i=(i<0||j<0||i>=this.W||j>=this.H)?-2:j*this.W+i;return o;}
   if(y1<=top&&dy<0){const th=(top-oy)/dy;if(th<=maxT){o.t=th;o.ny=1;o.i=j*this.W+i;return o;}}
   if(t1>=maxT)break;if(tmx<tmz){t0=tmx;tmx+=tdx;i+=sx;side=0;}else{t0=tmz;tmz+=tdz;j+=sz;side=1;}
   if(oy+dy*t0<-40&&dy<0)break;}
  // floor plane fallback for void arenas (abyss) — nothing to hit
  return o;}
 los(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az,L=Math.hypot(dx,dy,dz)||1;const o=this.ray(ax,ay,az,dx/L,dy/L,dz/L,L,this._lo||(this._lo={}));return o.t>=L-.05;}
 // rune walls sink into the floor when shot
 runeAt(i){for(const r of this.runes){const[x0,z0,x1,z1]=r.cells;const x=i%this.W,z=(i/this.W)|0;if(x>=x0&&x<=x1&&z>=z0&&z<=z1)return r;}return null;}
 openRune(r,amt){const[x0,z0,x1,z1]=r.cells;const h=8*(1-amt);for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){const i=z*this.W+x;this.top[i]=h;this.ctop[i]=amt>=1?0:120;}}
 inCells(x,z,c){const i=x/CS,j=z/CS;return i>=c[0]&&i<c[2]+1&&j>=c[1]&&j<c[3]+1;}
 // BFS flow field from a target cell for ground monsters (climb = max step up between neighbours)
 flow(tx,tz,climb){const W=this.W,H=this.H,d=climb>1?this.dist:this.flyDist;d.fill(-1);const s=this.idx(tx,tz);if(s<0)return d;const q=new Int32Array(W*H);let qh=0,qt=0;q[qt++]=s;d[s]=0;
  while(qh<qt){const c=q[qh++],ci=c%W,cj=(c/W)|0,ct=this.ctop[c];for(let k=0;k<8;k++){const di=[1,-1,0,0,1,1,-1,-1][k],dj=[0,0,1,-1,1,-1,1,-1][k];const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=W||nj>=H)continue;const n=nj*W+ni;if(d[n]>=0)continue;
    const nt=this.ctop[n];if(nt>60||this.flags[n])continue;// wall / lava / void are not walkable
    if(k>=4){const a=cj*W+ni,b=nj*W+ci;if(this.ctop[a]>Math.max(ct,nt)+STEP||this.ctop[b]>Math.max(ct,nt)+STEP||this.flags[a]||this.flags[b])continue;}
    // reverse search: monster at n walks to c; it climbs ct-nt
    if(ct-nt>climb)continue;d[n]=d[c]+(k>=4?3:2);q[qt++]=n;}}
  return d;}
}
