// SILENT CONTRACT — Villa Serafina layout: floors, ramps, walls with doors and windows, props, zones, rooms, lamps, containers,
// interactables and NPC spots, rasterised into a 0.5 m grid (floor height, ceiling, sight-blocking height span, zone, room) that
// drives collision, line of sight, trespass checks and A* navigation. world.js turns the same records into geometry.
export const CELL=.5,X0=-80,Z0=-80,GW=320,GH=320;
// zones: who may be where
export const ZONES={open:0,public:1,staff:2,kitchen:3,secure:4,private:5,boat:6};
export const ZNAME=['GROUNDS','PUBLIC','STAFF ONLY','KITCHEN','SECURITY','PRIVATE','BOATHOUSE'];
export const ALLOW={suit:[0],guest:[0,1],waiter:[0,1,2,3,6],chef:[0,1,2,3],guard:[0,1,2,3,4,5,6],mech:[0,2,3,6]};
export const HOSTILE=[4,5];

export class Level{
 constructor(){const n=GW*GH;this.fh=new Float32Array(n).fill(NaN);this.ceil=new Float32Array(n).fill(Infinity);this.sy0=new Float32Array(n).fill(NaN);this.sy1=new Float32Array(n).fill(NaN);
  this.zone=new Uint8Array(n);this.room=new Uint8Array(n);this.block=new Uint8Array(n);this.dark=new Uint8Array(n);
  this.boxes=[];this.ramps=[];this.recs=[];this.lamps=[];this.rooms=[{name:'OUTSIDE',grp:-1}];this.containers=[];this.items=[];this.uses=[];this.spots={};this.hash=new Map();
  build(this);this.finish();}
 // ---- cells
 ci(x,z){const i=Math.floor((x-X0)/CELL),j=Math.floor((z-Z0)/CELL);return i<0||j<0||i>=GW||j>=GH?-1:j*GW+i;}
 cx(i){return X0+(i%GW+.5)*CELL;}cz(i){return Z0+((i/GW|0)+.5)*CELL;}
 eachCell(x0,z0,x1,z1,f){const i0=Math.max(0,Math.floor((Math.min(x0,x1)-X0)/CELL)),i1=Math.min(GW-1,Math.ceil((Math.max(x0,x1)-X0)/CELL)-1),j0=Math.max(0,Math.floor((Math.min(z0,z1)-Z0)/CELL)),j1=Math.min(GH-1,Math.ceil((Math.max(z0,z1)-Z0)/CELL)-1);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)f(j*GW+i,X0+(i+.5)*CELL,Z0+(j+.5)*CELL);}
 // ---- authoring
 floor(x0,z0,x1,z1,y,mat,o={}){this.eachCell(x0,z0,x1,z1,i=>{this.fh[i]=y;if(o.ceil)this.ceil[i]=y+o.ceil;else this.ceil[i]=Infinity;});this.recs.push({t:'floor',x0,z0,x1,z1,y,mat,col:o.col??0xffffff,s:o.s||2,ceil:o.ceil,cmat:o.cmat,ccol:o.ccol,cs:o.cs,skirt:o.skirt});}
 ramp(x0,z0,x1,z1,y0,y1,mat,o={}){this.ramps.push({x0,z0,x1,z1,y0,y1,ax:o.ax||'z'});this.eachCell(x0,z0,x1,z1,(i,x,z)=>{this.fh[i]=this.rampY(this.ramps[this.ramps.length-1],x,z);this.ceil[i]=o.ceil?this.fh[i]+o.ceil:Infinity;});
  this.recs.push({t:'ramp',x0,z0,x1,z1,y0,y1,ax:o.ax||'z',mat,col:o.col??0xffffff,steps:o.steps??true,ceil:o.ceil});}
 rampY(r,x,z){const t=r.ax==='z'?(z-r.z0)/(r.z1-r.z0):(x-r.x0)/(r.x1-r.x0);return r.y0+(r.y1-r.y0)*Math.max(0,Math.min(1,t));}
 zoneRect(x0,z0,x1,z1,z){this.eachCell(x0,z0,x1,z1,i=>this.zone[i]=z);}
 roomRect(x0,z0,x1,z1,name,o={}){let id=this.rooms.findIndex(r=>r.name===name);if(id<0){id=this.rooms.length;this.rooms.push({name,grp:o.grp??-1,x0,z0,x1,z1});}this.eachCell(x0,z0,x1,z1,i=>this.room[i]=id);return id;}
 // collision / sight box. o.move (default true), o.sight (default false), o.cam (camera blocker, default = sight)
 box(x0,y0,z0,x1,y1,z1,o={}){const b={x0:Math.min(x0,x1),x1:Math.max(x0,x1),y0,y1,z0:Math.min(z0,z1),z1:Math.max(z0,z1),move:o.move??true,sight:o.sight??false,cam:o.cam??(o.sight??false),tag:o.tag};this.boxes.push(b);
  if(b.sight)this.eachCell(b.x0+.01,b.z0+.01,b.x1-.01,b.z1-.01,i=>{this.sy0[i]=isNaN(this.sy0[i])?y0:Math.min(this.sy0[i],y0);this.sy1[i]=isNaN(this.sy1[i])?y1:Math.max(this.sy1[i],y1);});return b;}
 // wall along x (z fixed) or along z (x fixed) with doors [c,w,h] and windows [c,w,sill,top] measured along the wall
 wall(x0,z0,x1,z1,y,h,mat,o={}){const along=Math.abs(x1-x0)>Math.abs(z1-z0),a0=along?Math.min(x0,x1):Math.min(z0,z1),a1=along?Math.max(x0,x1):Math.max(z0,z1),c=along?z0:x0,t=(o.t||.3)/2;
  const holes=[...(o.doors||[]).map(d=>({a:d[0]-d[1]/2,b:d[0]+d[1]/2,lo:0,hi:d[2]||2.6,door:1})),...(o.wins||[]).map(w=>({a:w[0]-w[1]/2,b:w[0]+w[1]/2,lo:w[2]??1,hi:w[3]??2.6,win:1}))].sort((p,q)=>p.a-q.a);
  const seg=(s0,s1,ya,yb,sight=true,move=true)=>{if(s1-s0<.01||yb-ya<.01)return;if(along)this.box(s0,y+ya,c-t,s1,y+yb,c+t,{sight,move,cam:true});else this.box(c-t,y+ya,s0,c+t,y+yb,s1,{sight,move,cam:true});};
  let p=a0;for(const H of holes){seg(p,H.a,0,h);if(H.lo>0)seg(H.a,H.b,0,H.lo);seg(H.a,H.b,H.hi,h);if(H.win)seg(H.a,H.b,H.lo,H.hi,false,true);p=H.b;}seg(p,a1,0,h);
  this.recs.push({t:'wall',along,a0,a1,c,y,h,th:t*2,mat,col:o.col??0xffffff,colB:o.colB,matB:o.matB,holes,s:o.s||2,trim:o.trim,base:o.base,frame:o.frame??0xf2ead8});}
 solid(x0,y0,z0,x1,y1,z1,mat,col,o={}){this.box(x0,y0,z0,x1,y1,z1,o);this.recs.push({t:'box',x0,y0,z0,x1,y1,z1,mat,col,s:o.s||1,skip:o.skip});}
 vis(kind,o){this.recs.push({t:kind,...o});}
 lamp(x,y,z,col,I,R,o={}){this.lamps.push({x,y,z,col,I,R,grp:o.grp??-1,kind:o.kind||'bulb',vis:o.vis??true,room:this.room[this.ci(x,z)]});}
 spot(name,x,z,yaw=0){this.spots[name]={x,z,yaw};}
 finish(){// spatial hash of boxes (4 m buckets)
  for(const b of this.boxes){for(let i=Math.floor(b.x0/4);i<=Math.floor(b.x1/4);i++)for(let j=Math.floor(b.z0/4);j<=Math.floor(b.z1/4);j++){const k=i*1000+j;if(!this.hash.has(k))this.hash.set(k,[]);this.hash.get(k).push(b);}}
  // navigation: walkable cells (floor, not inside a movement box at body height)
  const n=GW*GH;this.walk=new Uint8Array(n);for(let i=0;i<n;i++){if(isNaN(this.fh[i]))continue;const x=this.cx(i),z=this.cz(i),y=this.fh[i];this.walk[i]=this.bodyFree(x,z,y,.26)?1:0;}}
 near(x,z){return this.hash.get(Math.floor(x/4)*1000+Math.floor(z/4))||[];}
 bodyFree(x,z,y,r){for(let i=Math.floor((x-r)/4);i<=Math.floor((x+r)/4);i++)for(let j=Math.floor((z-r)/4);j<=Math.floor((z+r)/4);j++){const L=this.hash.get(i*1000+j);if(!L)continue;
  for(const b of L){if(!b.move||b.y1<y+.32||b.y0>y+1.7)continue;if(x+r>b.x0&&x-r<b.x1&&z+r>b.z0&&z-r<b.z1)return false;}}return true;}
 // ---- queries
 h(x,z){for(const r of this.ramps)if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1)return this.rampY(r,x,z);const i=this.ci(x,z);return i<0?NaN:this.fh[i];}
 zoneAt(x,z){const i=this.ci(x,z);return i<0?0:this.zone[i];}
 roomAt(x,z){const i=this.ci(x,z);return i<0?0:this.room[i];}
 ceilAt(x,z){const i=this.ci(x,z);return i<0?Infinity:this.ceil[i];}
 indoor(x,z){return this.ceilAt(x,z)<1e3;}
 // line of sight between two eye points (height-aware against the sight span of each cell)
 los(ax,ay,az,bx,by,bz){const dx=bx-ax,dz=bz-az,d=Math.hypot(dx,dz),n=Math.ceil(d/.3);for(let k=1;k<n;k++){const t=k/n,i=this.ci(ax+dx*t,az+dz*t);if(i<0)continue;const s0=this.sy0[i];if(s0!==s0)continue;const y=ay+(by-ay)*t;if(y>=s0&&y<=this.sy1[i])return false;}return true;}
 // push a circle out of movement boxes; returns the resolved position
 collide(p,r,y){for(let it=0;it<2;it++){const L=this.near(p.x,p.z);for(const b of L){if(!b.move||b.y1<y+.35||b.y0>y+1.7)continue;const qx=Math.max(b.x0,Math.min(p.x,b.x1)),qz=Math.max(b.z0,Math.min(p.z,b.z1));let dx=p.x-qx,dz=p.z-qz;const d2=dx*dx+dz*dz;
    if(d2<r*r){if(d2<1e-8){const l=p.x-b.x0,rr=b.x1-p.x,t=p.z-b.z0,bb=b.z1-p.z,m=Math.min(l,rr,t,bb);if(m===l)p.x=b.x0-r;else if(m===rr)p.x=b.x1+r;else if(m===t)p.z=b.z0-r;else p.z=b.z1+r;}else{const d=Math.sqrt(d2);p.x=qx+dx/d*r;p.z=qz+dz/d*r;}}}}return p;}
 // camera / projectile segment test against camera boxes: returns t in 0..1 of first hit
 ray(ax,ay,az,bx,by,bz,camOnly=true){let best=1;const dx=bx-ax,dy=by-ay,dz=bz-az;const seen=new Set();const steps=Math.ceil(Math.hypot(dx,dz)/3)+1;
  for(let s=0;s<=steps;s++){const t=s/steps,x=ax+dx*t,z=az+dz*t;for(let oi=-1;oi<=1;oi++)for(let oj=-1;oj<=1;oj++){const L=this.hash.get((Math.floor(x/4)+oi)*1000+Math.floor(z/4)+oj);if(!L)continue;
    for(const b of L){if(seen.has(b))continue;seen.add(b);if(camOnly===2?!(b.cam||(b.sight||b.move)&&b.y1-b.y0>1.7):camOnly?!b.cam:!(b.sight||b.move))continue;let t0=0,t1=best;const sl=(a,d,lo,hi)=>{if(Math.abs(d)<1e-9)return a>=lo&&a<=hi;let u=(lo-a)/d,v=(hi-a)/d;if(u>v)[u,v]=[v,u];t0=Math.max(t0,u);t1=Math.min(t1,v);return t0<=t1;};
     if(sl(ax,dx,b.x0,b.x1)&&sl(ay,dy,b.y0,b.y1)&&sl(az,dz,b.z0,b.z1)&&t0<best)best=t0;}}}
  // floors and ceilings along the way
  const n=Math.ceil(Math.hypot(dx,dz,dy)/.25);for(let k=1;k<=n;k++){const t=k/n;if(t>=best)break;const x=ax+dx*t,y=ay+dy*t,z=az+dz*t,f=this.h(x,z),c=this.ceilAt(x,z);if((f===f&&y<f+.05&&ay>=f-.3)||y>c-.05){best=Math.max(0,t-1/n);break;}}return best;}
 // ---- A* on the walk grid (8-neighbour, step-height aware)
 path(ax,az,bx,bz){let s=this.ci(ax,az),g=this.ci(bx,bz);if(s<0||g<0)return null;if(!this.walk[s])s=this.nearestWalk(s);if(!this.walk[g])g=this.nearestWalk(g);if(s<0||g<0)return null;if(s===g)return[{x:bx,z:bz}];
  const n=GW*GH;if(!this._g){this._g=new Float64Array(n);this._p=new Int32Array(n);this._c=new Uint32Array(n);this._stamp=1;}const G=this._g,P=this._p,C=this._c,st=++this._stamp;
  const heap=[],push=(i,f)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p;}},
   pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=k*2+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m;}}return top;};
  const gx=g%GW,gy=g/GW|0,hh=i=>{const dx=Math.abs(i%GW-gx),dy=Math.abs((i/GW|0)-gy);return(Math.max(dx,dy)+.414*Math.min(dx,dy))*1.25;};
  G[s]=0;C[s]=st;P[s]=-1;push(s,hh(s));let it=0;const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  while(heap.length&&it++<250000){const[,i]=pop();if(i===g)break;const x=i%GW,y=i/GW|0,hi=this.fh[i];
   for(const[ox,oy,c]of D){const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const k=ny*GW+nx;if(!this.walk[k])continue;if(ox&&oy&&(!this.walk[y*GW+nx]||!this.walk[ny*GW+x]))continue;if(Math.abs(this.fh[k]-hi)>.45)continue;
    const ng=G[i]+c*(this.zone[k]===ZONES.open&&this.zone[i]!==ZONES.open?1.5:1);if(C[k]!==st||ng<G[k]){C[k]=st;G[k]=ng;P[k]=i;push(k,ng+hh(k));}}}
  if(C[g]!==st)return null;const out=[];for(let i=g;i!==-1&&i!==s;i=P[i])out.push(i);out.reverse();
  // string-pull: drop cells that are visible in a straight walkable line
  const pts=[];let a=s;for(let k=0;k<out.length;k++){const nx=out[k+1];if(nx===undefined||!this.walkLine(a,nx)){pts.push({x:this.cx(out[k]),z:this.cz(out[k])});a=out[k];}}
  if(pts.length)pts[pts.length-1]={x:bx,z:bz};if(!this.walk[this.ci(bx,bz)])pts[pts.length-1]={x:this.cx(g),z:this.cz(g)};return pts;}
 walkLine(a,b){const ax=this.cx(a),az=this.cz(a),bx=this.cx(b),bz=this.cz(b),d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.2);let ph=this.fh[a];
  for(let k=1;k<=n;k++){const t=k/n;for(const o of[-.18,.18]){const x=ax+(bx-ax)*t+(bz-az)/d*o,z=az+(bz-az)*t-(bx-ax)/d*o,i=this.ci(x,z);if(i<0||!this.walk[i])return false;}const i=this.ci(ax+(bx-ax)*t,az+(bz-az)*t);if(Math.abs(this.fh[i]-ph)>.45)return false;ph=this.fh[i];}return true;}
 nearestWalk(i){const x=i%GW,y=i/GW|0;for(let r=1;r<12;r++)for(let oy=-r;oy<=r;oy++)for(let ox=-r;ox<=r;ox++){if(Math.max(Math.abs(ox),Math.abs(oy))!==r)continue;const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const k=ny*GW+nx;if(this.walk[k])return k;}return -1;}
 walkable(x,z){const i=this.ci(x,z);return i>=0&&this.walk[i]===1;}
 randomWalk(x0,z0,x1,z1,rnd=Math.random){for(let k=0;k<40;k++){const x=x0+rnd()*(x1-x0),z=z0+rnd()*(z1-z0);if(this.walkable(x,z))return{x,z};}return{x:(x0+x1)/2,z:(z0+z1)/2};}
}

/* ======================================================================= the villa */
const STUCCO=0xfff4e2,CREAM=0xf6ead4,PAINT=0xd8d2c4,GOLD=0xc8a050;
function build(L){
 const F=(...a)=>L.floor(...a),W=(...a)=>L.wall(...a),Z=(...a)=>L.zoneRect(...a),RM=(...a)=>L.roomRect(...a);
 // ---------- zones (later rects override)
 Z(-80,-80,80,80,ZONES.open);
 Z(-14,-46,34,-31,ZONES.public);Z(30,-46,62,8,ZONES.public);Z(36,-42,60,-18,ZONES.secure);
 Z(-62,-46,-30,8,ZONES.staff);Z(-30,-31,30,-2,ZONES.public);Z(-30,-22,-17,-2,ZONES.kitchen);Z(-25,-31,-17,-22,ZONES.kitchen);Z(-30,-31,-25,-22,ZONES.staff);Z(-34,-46,-14,-31,ZONES.staff);
 Z(-17,-31,-14,-2,ZONES.staff);Z(-14,-31,-6,-22,ZONES.staff);Z(14,-31,17,-2,ZONES.staff);Z(17,-31,30,-15,ZONES.secure);Z(17,-15,30,-2,ZONES.private);
 Z(-60,-2,62,8,ZONES.public);Z(-62,-2,-30,8,ZONES.staff);Z(-62,8,62,31,ZONES.public);Z(49.5,29,54,80,ZONES.boat);Z(28,44,64,80,ZONES.boat);
 // ---------- rooms (lighting / darkness groups)
 RM(-6,-31,6,-22,'FOYER');RM(-14,-22,14,-2,'BALLROOM');RM(-14,-31,-6,-22,'STAFF ROOM');RM(-17,-31,-14,-2,'SERVICE CORRIDOR');RM(-30,-22,-17,-2,'KITCHEN',{grp:0});RM(-25,-31,-17,-22,'PANTRY',{grp:0});
 RM(-30,-31,-25,-22,'CELLAR STAIRS');RM(-34,-46,-14,-31,'WINE CELLAR');RM(6,-31,14,-22,'LIBRARY');RM(14,-31,17,-2,'EAST HALL');RM(17,-31,30,-22,'SECURITY ROOM');RM(17,-22,30,-15,'GUARD QUARTERS');RM(17,-15,30,-2,'STUDY');
 RM(-30,-2,30,8,'TERRACE');RM(-62,8,62,31,'GARDEN');RM(-62,-46,-30,8,'SERVICE YARD');RM(-58,-24,-50,-16,'SHED');RM(-14,-46,34,-31,'FRONT COURT');RM(30,-46,62,8,'EAST LAWN');
 RM(-80,-80,80,-46,'DRIVE');RM(48,30,56,46,'CLIFF STAIRS');RM(28,44,64,80,'BOATHOUSE',{grp:1});RM(34,46,48,53,'BOATHOUSE',{grp:1});
 // ---------- ground floors
 F(-62,-72,62,-46,0,'gravel',{s:3});                        // arrival drive
 F(-14,-46,34,-31,0,'travertine',{s:2});                    // front court
 F(30,-31,62,8,0,'grass',{s:3});F(34,-46,62,-31,0,'grass',{s:3});F(40,-40,58,-20,.12,'travertine',{s:2,col:0xc8c4bc}); // east lawn + helipad
 F(-62,-46,-34,-31,0,'gravel',{s:3});F(-62,-31,-30,8,0,'gravel',{s:3});F(-46,-24,-34,-6,.03,'terracotta',{s:2,col:0xd8c8b8}); // service yard
 F(-30,-2,30,8,0,'terracotta',{s:2});                       // terrace
 F(-60,10.4,60,30.5,-1.2,'grass',{s:3});                    // garden lawn
 F(-4,8,4,10.4,0,'travertine');L.ramp(-4,8,4,10.4,0,-1.2,'travertine');F(-46,8,-42,10.4,0,'gravel');L.ramp(-46,8,-42,10.4,0,-1.2,'gravel');F(42,8,46,10.4,0,'grass');L.ramp(42,8,46,10.4,0,-1.2,'travertine');
 F(-60,8,-46,10.4,-1.2,'grass',{s:3});F(-42,8,-4,10.4,-1.2,'grass',{s:3});F(4,8,42,10.4,-1.2,'grass',{s:3});F(46,8,60,10.4,-1.2,'grass',{s:3});
 // villa interiors
 F(-6,-31,6,-22,0,'marble',{ceil:5,cmat:'coffer',cs:3});
 F(-14,-22,14,-2,0,'parquet',{ceil:8,cmat:'coffer',cs:3.5});
 F(-14,-31,-6,-22,0,'kitchen',{ceil:3.6,cmat:'stucco',ccol:0xe8e4dc,col:0xc8c4bc,s:1});
 F(-17,-31,-14,-2,0,'kitchen',{ceil:3.6,cmat:'stucco',ccol:0xe8e4dc,col:0xd8d0c0,s:1});
 F(-30,-22,-17,-2,0,'kitchen',{ceil:4.2,cmat:'stucco',ccol:0xf0ece4,s:1});
 F(-25,-31,-17,-22,0,'kitchen',{ceil:3.6,cmat:'stucco',ccol:0xe8e4dc,col:0xd0c8b8,s:1});
 F(-30,-23,-25,-22,0,'terracotta',{ceil:4.2,cmat:'stucco'});L.ramp(-29.6,-31,-25.4,-23,-3.2,0,'travertine',{ceil:3.4});F(-29.6,-33,-25.4,-31,-3.2,'travertine',{ceil:2.9,cmat:'brick',cs:3});
 F(-33,-45,-15,-33,-3.2,'terracotta',{ceil:3,cmat:'brick',cs:3,col:0xb89a88});
 F(6,-31,14,-22,0,'parquet',{ceil:4.6,cmat:'coffer',cs:2.5});
 F(14,-31,17,-2,0,'marble',{ceil:3.8,cmat:'stucco',col:0xe0dcd4});
 F(17,-31,30,-22,0,'kitchen',{ceil:3.4,cmat:'stucco',ccol:0xd8dce0,col:0x9aa0a8,s:1});
 F(17,-22,30,-15,0,'kitchen',{ceil:3.4,cmat:'stucco',ccol:0xd8dce0,col:0xb0b4b8,s:1});
 F(17,-15,30,-2,0,'carpet',{ceil:4.2,cmat:'panel',cs:3,col:0x8a90a8});
 // cliff stairs, quay, boathouse, pier
 L.ramp(50,30.5,53,46,-1.2,-12,'travertine');F(50,29,53,30.5,-1.2,'travertine');
 F(30,46,62,53,-12,'travertine',{s:2,col:0xb8b0a0});F(34,46,48,53,-11.98,'planks',{ceil:4.5,cmat:'planks',ccol:0x8a7060});
 F(53,53,57,67,-12,'planks',{s:2});
 // ---------- perimeter walls (stone, 3.2 m)
 const PW=(x0,z0,x1,z1,o)=>W(x0,z0,x1,z1,0,3.2,'travertine',{t:.6,col:0xd8ccb4,s:2,trim:'cap',...o});
 PW(-62,-46,62,-46,{doors:[[0,6,3.2],[-53,5,3.2]]});PW(-62,-46,-62,10.4);PW(62,-46,62,10.4);
 L.box(-63,-1,-73,63,4,-72,{sight:false});L.box(-64,-1,-73,-62.2,4,-46,{});L.box(62.2,-1,-73,64,4,-46,{}); // drive edges (hedges)
 // retaining wall: terrace/yard/east lawn (y 0) above the garden (y -1.2)
 for(const[a,b]of[[-62,-46],[-42,-4],[4,42],[46,62]])L.solid(a,-1.2,7.85,b,.45,8.15,'travertine',0xe0d4bc,{s:1});
 // cliff balustrade along the garden edge + stair rails
 L.box(-62,-1.2,30.4,50,0,30.9,{});L.box(53,-1.2,30.4,62,0,30.9,{});L.vis('balus',{x0:-60,x1:50,z:30.65,y:-1.2});L.vis('balus',{x0:53,x1:60,z:30.65,y:-1.2});
 L.box(-60.6,-1.2,10.4,-60,0,30.5,{});L.box(60,-1.2,10.4,60.6,0,30.5,{});
 L.box(49.6,-14,29,50,1,46,{sight:true,cam:true});L.box(53,-14,30.5,53.4,-.2,46,{});L.vis('rail',{x:53.2,z0:30.5,z1:46,y0:-1.2,y1:-12});
 L.box(28,-14,45.6,50,-1,46,{sight:true,cam:true});L.box(53,-14,45.6,64,-1,46,{sight:true,cam:true});// cliff face behind the quay
 L.box(29.6,-14,46,30,-10,53,{});L.box(62,-14,46,62.4,-10,53,{});L.box(30,-14,53,53,-11.2,53.4,{});L.box(57,-14,53,62,-11.2,53.4,{});
 L.box(52.6,-14,53,53,-11.1,67,{});L.box(57,-14,53,57.4,-11.1,67,{});L.vis('pierRail',{x0:53,x1:57,z0:53,z1:67,y:-12});
 L.railing=L.box(53,-14,66.6,57,-10.9,67.1,{tag:'railing'});
 // ---------- villa shell
 const H=5.2,EXT={col:STUCCO,colB:CREAM,trim:'cornice',base:1};
 W(-30,-31,30,-31,0,H,'stucco',{...EXT,doors:[[0,3,3.4]],wins:[[-20,1.6,1.2,3.4],[-10,1.6,1.2,3.4],[-3.6,1.2,1,3.4],[3.6,1.2,1,3.4],[10,1.6,1.2,3.4],[21,1.6,1.4,3],[27,1.6,1.4,3]]});
 W(-30,-31,-30,-2,0,H,'stucco',{...EXT,doors:[[-10,2,2.8]],wins:[[-26.5,1.2,1.6,3],[-19,1.6,1.4,3.2],[-5,1.6,1.4,3.2]]});
 W(30,-31,30,-2,0,H,'stucco',{...EXT,wins:[[-27,1.4,1.4,3],[-19,1.4,1.4,3],[-11,1.8,1,3.4],[-6,1.8,1,3.4]]});
 W(-30,-2,-17,-2,0,H,'stucco',{...EXT,wins:[[-26,2,1.1,3.2],[-21,2,1.1,3.2]]});
 W(-17,-2,-14,-2,0,H,'stucco',{...EXT,doors:[[-15.5,1.6,2.6]]});
 W(-14,-2,14,-2,0,8,'stucco',{...EXT,doors:[[-9,2.4,3.6],[0,2.6,3.8],[9,2.4,3.6]],wins:[[-12,1.6,.4,4.2],[-4.5,2.6,.4,4.6],[4.5,2.6,.4,4.6],[12,1.6,.4,4.2]]});
 W(14,-2,17,-2,0,H,'stucco',{...EXT,doors:[[15.5,1.6,2.6]]});
 W(17,-2,30,-2,0,H,'stucco',{...EXT,wins:[[20.5,2.2,.8,3.4],[26.5,2.2,.8,3.4]]});
 // the cellar passage leaves the villa under its north wall
 // ---------- interior walls
 const IW=(x0,z0,x1,z1,o={})=>W(x0,z0,x1,z1,0,o.h||H,o.mat||'stucco',{col:o.col??CREAM,colB:o.colB??CREAM,t:.24,base:1,...o});
 IW(-17,-22,-17,-2,{doors:[[-12,1.6]],col:0xf4f2ec,colB:0xe8e4da});IW(-17,-31,-17,-22,{col:0xf4f2ec,colB:0xe8e4da});
 IW(-14,-31,-14,-2,{h:8,doors:[[-27,1.4],[-8,1.8,3]],col:0xe8e4da,colB:CREAM,trim:'gold'});
 IW(-30,-22,-17,-22,{doors:[[-27.5,4.2,3.2],[-20,1.4]],col:0xf4f2ec,colB:0xf4f2ec});IW(-25,-31,-25,-22,{col:0xf0ece2});
 IW(-14,-22,14,-22,{h:8,doors:[[0,5,3.8]],col:CREAM,colB:CREAM,trim:'gold'});IW(-6,-31,-6,-22,{doors:[[-27,1.4]],colB:0xe8e4da});IW(6,-31,6,-22,{doors:[[-26.5,2.2,3]]});
 IW(14,-31,14,-2,{h:8,doors:[[-24.5,1.4],[-6,1.8,3]],col:CREAM,colB:0xeae6de,trim:'gold'});
 IW(17,-31,17,-2,{doors:[[-27,1.4],[-18.5,1.4],[-8.5,1.4]],col:0xeae6de,colB:0xd8dce0});
 IW(17,-22,30,-22,{doors:[[26,1.4]],col:0xd8dce0,colB:0xd8dce0});IW(17,-15,30,-15,{col:0xd8dce0,colB:0x5a3a24,matB:'panel'});
 // cellar shell (below the embankment)
 const CW=(x0,z0,x1,z1,o={})=>W(x0,z0,x1,z1,-3.2,3.2,'brick',{col:0xc8a890,colB:0xc8a890,t:.5,...o});
 CW(-33,-45,-15,-45);CW(-33,-45,-33,-33);CW(-15,-45,-15,-33);CW(-33,-33,-15,-33,{doors:[[-27.5,4.2,2.9]]});W(-29.6,-33,-29.6,-31,-3.2,3.2,'brick',{t:.4,col:0xc8a890});W(-25.4,-33,-25.4,-31,-3.2,3.2,'brick',{t:.4,col:0xc8a890});
 W(-30,-31,-30,-22,-3.4,3.4,'brick',{t:.6,col:0xc8a890});W(-25,-31,-25,-22,-3.4,3.4,'brick',{t:.4,col:0xc8a890});
 // the embankment above the cellar: raised planted bed, unwalkable, sight-blocking
 L.box(-34,-.4,-46,-14,1.1,-31.2,{sight:true,cam:true});L.vis('mound',{x0:-34,z0:-46,x1:-14,z1:-31.2,y:1.1});
 // shed
 W(-58,-24,-50,-24,0,3,'planks',{t:.2,col:0x9a7a5a,colB:0x9a7a5a,s:1.5});W(-58,-16,-50,-16,0,3,'planks',{t:.2,col:0x9a7a5a,colB:0x9a7a5a,s:1.5});W(-58,-24,-58,-16,0,3,'planks',{t:.2,col:0x9a7a5a,s:1.5});
 W(-50,-24,-50,-16,0,3,'planks',{t:.2,col:0x9a7a5a,colB:0x9a7a5a,doors:[[-20,1.6,2.3]],wins:[[-17.5,1,1.2,2]],s:1.5});F(-58,-24,-50,-16,.02,'planks',{ceil:2.9,cmat:'planks',ccol:0x7a6048});
 // boathouse shell
 W(34,46,34,53,-12,4.5,'planks',{t:.3,col:0xa88a6a,colB:0x8a7058,s:2});W(48,46,48,53,-12,4.5,'planks',{t:.3,col:0xa88a6a,colB:0x8a7058,doors:[[49.5,1.8,2.6]],s:2});
 W(34,53,48,53,-12,4.5,'planks',{t:.3,col:0xa88a6a,colB:0x8a7058,doors:[[37,1.8,2.6],[43,4,3.4]],s:2});
 // ---------- roofs, loggia, chimneys (visual + camera blockers)
 L.vis('roof',{x0:-30.6,z0:-31.6,x1:-14,z1:-1.4,y:H,h:2.6});L.vis('roof',{x0:-14,z0:-31.6,x1:14,z1:-22,y:H,h:2.2});L.vis('roof',{x0:-14.4,z0:-22.4,x1:14.4,z1:-1.6,y:8,h:3.2});
 L.vis('roof',{x0:14,z0:-31.6,x1:30.6,z1:-1.4,y:H,h:2.6});L.vis('roof',{x0:-58.4,z0:-24.4,x1:-49.6,z1:-15.6,y:3,h:1.2});L.vis('roof',{x0:33.6,z0:45.6,x1:48.6,z1:53.6,y:-7.5,h:1.6});
 L.vis('loggia',{x0:-14,x1:14,z0:-2,z1:2.6,y:4.4});for(let x=-14;x<=14.01;x+=3.5)L.box(x-.25,0,2.05,x+.25,4.4,2.55,{sight:false,cam:false});
 // ---------- furniture (solid boxes + visual dressing)
 const S=(x0,z0,x1,z1,y0,y1,mat,col,o)=>L.solid(x0,y0,z0,x1,y1,z1,mat,col,o);
 // ballroom: stage, quartet dais, podium, tables, bar
 S(9.5,-21.5,13.6,-14,0,.45,'parquet',0x8a5a3a);S(-13.6,-21.5,-9.5,-17,0,.3,'parquet',0x8a5a3a);
 S(-.45,-10.35,.45,-9.65,0,1.15,'panel',0xffffff);L.spot('podium',0,-10.9,Math.PI);
 for(const[x,z]of[[-9,-12],[-9,-6],[7,-6],[-4,-17],[4,-17],[10,-9.5],[-5,-5],[4.5,-5]])L.vis('table',{x,z,r:.75,y:0}),L.box(x-.6,0,z-.6,x+.6,.8,z+.6,{});
 S(-12.6,-15,-11.6,-6.5,0,1.1,'panel',0xffffff);L.vis('bottles',{x:-13.6,z0:-14.5,z1:-7,y:1.4,face:1});
 // foyer: reception desk, cloak closet, staircase dressing
 S(-4.5,-26.2,-1.8,-25.4,0,1.05,'marble',0xd8c8b0);S(-5.9,-30.9,-4.4,-29.4,0,2.4,'panel',0xffffff);
 // staff room: lockers, table
 S(-13.8,-30.9,-9.5,-30.3,0,2,'metal',0x6a7a88);S(-10.5,-26,-8.3,-24.5,0,.8,'planks',0xa08060);
 // kitchen: islands, stoves, counters, freezer, pantry shelves
 S(-27,-14,-21,-12.6,0,.95,'metal',0xe8eef0);S(-27,-8.6,-21,-7.2,0,.95,'metal',0xe8eef0);S(-29.7,-21.7,-29,-14,0,.95,'metal',0xd0d6da);S(-24.6,-21.7,-21,-21,0,.95,'metal',0xd0d6da);
 S(-29.8,-5.6,-28,-2.3,0,2.3,'metal',0xc8d0d8);S(-21,-5.8,-17.4,-4.6,0,.95,'metal',0xd0d6da);
 S(-24.6,-30.9,-17.4,-30.2,0,2.2,'planks',0x8a6a4a);S(-24.6,-27,-23.6,-23,0,2.2,'planks',0x8a6a4a);
 // cellar: racks, barrels, tasting table
 for(let x=-31;x<-17;x+=4.5)S(x,-44.6,x+3.4,-43.7,-3.2,-1.2,'planks',0x5a3a24);for(const x of[-24,-20])S(x,-34.5,x+3.4,-33.6,-3.2,-1.2,'planks',0x5a3a24);
 for(let i=0;i<5;i++)S(-32.6,-43+i*2,-31.4,-41.9+i*2,-3.2,-2.1,'planks',0x6a4428);
 S(-25,-41,-22,-39.8,-3.2,-2.35,'planks',0x5a3a24);L.spot('tasting',-23.5,-38.8,Math.PI);
 S(-17.8,-44.6,-15.6,-42.8,-3.2,-2.1,'planks',0x7a5a38);
 // library: shelves, piano, sofas
 S(6.3,-30.8,13.7,-30.2,0,3.6,'books',0xffffff);S(12,-27,13.6,-25,0,1,'panel',0x221816);S(7,-25,10,-24.2,0,.75,'cloth',0x5a2a2a);
 // security room: desks + monitor wall, lockers in quarters, bunks
 S(18,-30.9,29.5,-30.4,0,2.6,'screens',0xffffff);S(19,-29.6,28,-28.4,0,.8,'metal',0x4a5058);S(20,-25,23,-24,0,.8,'metal',0x4a5058);
 S(29.3,-21.6,29.8,-16,0,2,'metal',0x5a6470);S(18,-21.6,21.5,-20.6,0,.6,'cloth',0x4a5468);S(18,-16.6,21.5,-15.6,0,.6,'cloth',0x4a5468);
 // study: desk, shelves, sofa, drinks cabinet, closet, fireplace
 S(23,-10.2,26.2,-8.8,0,.8,'panel',0xffffff);S(17.4,-14.8,19,-13.8,0,2.3,'panel',0xffffff);S(21,-14.8,28,-14.4,0,3.2,'books',0xffffff);
 S(28.2,-12.5,29.7,-10.5,0,1.05,'panel',0xffffff);S(29.2,-8.2,29.8,-5.2,0,1.4,'stucco',0xd8d0c0);S(19,-5.4,22,-4.4,0,.7,'cloth',0x6a2a24);
 // terrace: bar, tables, planters
 S(19,4.4,25,5.3,0,1.1,'panel',0xffffff);S(18.6,1.2,25.4,1.7,0,2.2,'panel',0xc0a080);L.vis('bottles',{x:22,z0:1.75,z1:1.75,x0:19,x1:25,y:1.3,face:2});
 for(const[x,z]of[[-22,4],[-17,6],[-9,5.4],[9,5.4],[14,4.6],[-26,1],[27,6]])L.vis('table',{x,z,r:.5,y:0,bistro:1}),L.box(x-.45,0,z-.45,x+.45,.8,z+.45,{});
 for(const x of[-28,-6,6,28])S(x-.5,7,x+.5,7.8,0,.7,'terracotta',0xb86a48);
 // garden: fountain, hedges, gazebo, tables, lookout, string lights
 L.solid(-3,-1.2,15,3,-.6,21,'travertine',0xe0d4bc);L.vis('fountain',{x:0,z:18,y:-1.2});
 for(const[x0,z0,x1,z1]of[[-40,12,-12,13],[12,12,40,13],[-40,25,-30,26],[-20,25,-8,26],[8,25,20,26],[30,25,40,26],[-52,14,-51,28],[51,14,52,26]])L.solid(x0,-1.2,z0,x1,.3,z1,'grass',0x3a5a24,{sight:false}),L.vis('hedge',{x0,z0,x1,z1,y:-1.2,h:1.5});
 L.vis('gazebo',{x:-30,z:20,y:-1.2});for(const a of[0,1,2,3,4,5])L.box(-30+Math.cos(a*1.047)*3.6-.15,-1.2,20+Math.sin(a*1.047)*3.6-.15,-30+Math.cos(a*1.047)*3.6+.15,2,20+Math.sin(a*1.047)*3.6+.15,{});
 S(-31.2,19.4,-28.8,20.6,-1.2,-.2,'cloth',0xffffff);
 for(const[x,z]of[[-20,17],[-14,21],[-6,23.5],[8,22.5],[16,17],[22,21],[30,18],[-42,20],[-22,28.5],[34,28.5]])L.vis('table',{x,z,r:.45,y:-1.2,high:1}),L.box(x-.35,-1.2,z-.35,x+.35,0,z+.35,{});
 S(-44,16,-38,17,-1.2,-.1,'panel',0xffffff); // garden bar
 // forecourt: cars, valet stand, fountain
 for(const[x,z,r,c]of[[-34,-60,0,0x1a1c22],[-26,-60,0,0x7a1a1a],[-14,-63,0,0xd8d4cc],[14,-64,0,0x1a2a3a],[22,-60,0,0x2a2a2a],[30,-64,0,0x5a5a60],[8,-60,0,0x0e0e12]])L.vis('car',{x,z,r,col:c}),L.box(x-1,0,z-2.3,x+1,1.4,z+2.3,{});
 L.vis('van',{x:-53,z:-53}),L.box(-54.2,0,-56.5,-51.8,2.6,-49.5,{sight:true,cam:true});
 S(-46.5,-53,-44.5,-51.5,0,1.4,'metal',0x2a5a3a);// dumpster outside
 S(-37,-39,-35,-37.4,0,1.4,'metal',0x2a4a6a);S(-37,-36.4,-35,-34.8,0,1.4,'metal',0x2a4a6a);// yard dumpsters
 for(let i=0;i<3;i++)S(-45+i*1.3,-30,-44+i*1.3,-29,0,.9+(i%2)*.5,'planks',0xa07a50);
 L.solid(6,-.1,-41.5,10,.6,-36.5,'travertine',0xe0d4bc);L.vis('fountain',{x:8,z:-39,y:0,small:1});
 // helipad + crates, east lawn tool box
 S(52,-25,54,-23,0,1.3,'planks',0x5a6a4a);S(39.6,9.2,41,10.2,-1.2,-.4,'planks',0x6a5a3a);
 // shed interior
 S(-57.8,-23.8,-55.6,-22.6,0,.95,'planks',0x7a5a3a);S(-57.8,-18,-56.4,-16.4,0,.8,'metal',0x8a3a2a);
 // boathouse: boat cradle, crates, workbench
 S(38,47,44,51.6,-12,-10.6,'planks',0x6a4a30);S(35,51,37,52.6,-12,-10.8,'planks',0x8a6a44);S(46,46.4,47.6,47.6,-12,-9.8,'metal',0x506070);S(44.5,46.4,46,47.2,-12,-11.1,'planks',0x7a5a3a);
 // planters / cypress / olive trees (visual + trunk collision)
 const TREE=(x,z,y,k)=>{L.vis('tree',{x,z,y,k});L.box(x-.3,y,z-.3,x+.3,y+2.5,z+.3,{});};
 for(const[x,z]of[[-58,-42],[-58,-34],[-50,-6],[-58,4],[36,-44],[60,-44],[60,-12],[34,4],[-56,12],[-56,28],[56,12],[46,28],[-36,28],[26,28.5],[-8,-44],[-12,-36],[30,-44],[30,-34]])TREE(x,z,L.h(x,z)||0,'cypress');
 for(const[x,z]of[[-44,24],[-24,14],[24,14.2],[44,20],[-10,28],[0,28],[38,-6],[48,0],[-38,-24],[-50,-30],[60,-30]])TREE(x,z,L.h(x,z)||0,'olive');
 for(const[x,z]of[[-30,-50],[-40,-64],[-6,-56],[6,-56],[40,-52],[50,-66],[-50,-66]])TREE(x,z,0,'palm');
 // ---------- string lights + lamps
 const WARM=0xffc890,BULB=0xffd8a0;
 // ballroom chandelier (also the opportunity) and sconces
 L.lamp(0,6,-12,0xffe0b0,46,22,{kind:'chand',grp:2});for(const x of[-11,11])L.lamp(x,5.6,-12,0xffd8a8,10,10,{vis:false});
 for(const z of[-19,-12,-5]){L.lamp(-13.5,3.4,z,WARM,4,7,{kind:'sconce'});L.lamp(13.5,3.4,z,WARM,4,7,{kind:'sconce'});}
 L.lamp(0,4.2,-26.5,0xffe0b8,16,11,{kind:'chandS'});L.lamp(10,3.8,-26.5,WARM,9,8,{kind:'pendant'});
 for(const z of[-28,-20,-12,-5])L.lamp(-15.5,3.3,z,0xfff0dc,4.5,6,{kind:'ceil'});for(const z of[-28,-20,-12,-5])L.lamp(15.5,3.5,z,0xfff0dc,4.5,6,{kind:'ceil'});
 L.lamp(-10,3.3,-26.5,0xf4f6ff,7,8,{kind:'ceil'});
 for(const[x,z]of[[-27,-17],[-21,-17],[-27,-7],[-21,-7]])L.lamp(x,3.9,z,0xf8fbff,7,9,{kind:'ceil',grp:0});L.lamp(-21,3.3,-26.5,0xfff0d0,5,7,{kind:'ceil',grp:0});
 L.lamp(-27.5,3,-26,0xffd8a0,4,6,{kind:'ceil'});for(const[x,z]of[[-29,-39],[-24,-36],[-20,-41],[-24,-43]])L.lamp(x,-.6,z,0xffb868,5.5,7.5,{kind:'bulb'});
 L.lamp(23,3.1,-26.5,0xd8e4ff,6,9,{kind:'ceil'});L.lamp(23.5,1.5,-30.2,0x8ad8ff,3,6,{vis:false});L.lamp(23,3.1,-18.5,0xeef2ff,5,8,{kind:'ceil'});
 L.lamp(24.6,1.3,-9.5,0xffc880,4,6,{kind:'desk'});L.lamp(29,.8,-6.7,0xff8a40,6,6,{kind:'fire'});L.lamp(23,3.8,-8,0xffd8a8,5,8,{kind:'pendant'});
 for(let x=-12;x<=12;x+=6)L.lamp(x,3.9,.2,0xffc070,4.5,7,{kind:'lantern'});
 for(const[x,z]of[[-24,3],[24,3],[-28,7],[28,7]])L.lamp(x,2.6,z,WARM,3,6,{kind:'lantern'});
 L.lamp(22,2.4,3,0xffb870,4,6,{vis:false});
 // garden string-light poles: bulbs strung between, lamps for the bake at the poles
 const poles=[[-40,11],[-26,11],[-12,11],[12,11],[26,11],[40,11],[-46,19],[-36,28.6],[-18,28.6],[0,29],[18,28.6],[36,28.6],[46,19],[-16,20],[16,20]];L.poles=poles;
 for(const[x,z]of poles)L.lamp(x,3.2,z,0xffc888,5,9,{kind:'pole'});
 L.strings=[[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[0,6],[5,12],[2,13],[3,14],[13,9],[14,9],[13,8],[14,10]];
 for(const[x,z]of[[0,14.6],[0,21.4],[-3.4,18],[3.4,18]])L.lamp(x,-.6,z,0x9ad8ff,1.8,4,{vis:false});
 for(const x of[-5,5])L.lamp(x,3.6,-46.8,WARM,6,9,{kind:'gate'});for(const x of[-55.8,-50.2])L.lamp(x,3.6,-46.8,WARM,4,8,{kind:'gate'});
 for(const[x,z]of[[-24,-58],[0,-66],[24,-58],[-46,-58]])L.lamp(x,4.2,z,0xffd0a0,6,12,{kind:'post'});
 for(const[x,z]of[[-12,-34],[26,-34],[44,-42],[54,-18]])L.lamp(x,3.2,z,0xffd0a0,4,9,{kind:'post'});
 L.lamp(-31,4.2,-12,0xfff0d0,8,12,{kind:'flood'});L.lamp(-40,4,-38,0xfff0d0,6,11,{kind:'flood'});L.lamp(-54,2.6,-20,0xffe0b0,3,6,{kind:'ceil'});
 for(const[x,z]of[[37,49.5],[44,49.5]])L.lamp(x,-8.4,z,0xffd8a0,6,8,{kind:'ceil',grp:1});for(const z of[56,62,66.5])L.lamp(55,-9.6,z,0xffc890,4,8,{kind:'post'});L.lamp(51.5,-4,38,0xffc890,3,7,{kind:'post'});
 // ---------- containers (hide bodies; closets also hide the player)
 const CT=(x,z,name,o={})=>L.containers.push({x,z,name,closet:!!o.closet,y:o.y??L.h(x,z)??0,body:null,yaw:o.yaw||0});
 CT(-34,-57.6,'CAR TRUNK');CT(-45.5,-50.9,'DUMPSTER');CT(-36,-33.9,'DUMPSTER');CT(-55.9,-22,'TOOL CHEST');CT(-11,-29.7,'LOCKER',{closet:1});CT(-28.9,-6,'WALK-IN FREEZER',{closet:1});
 CT(-21,-29.6,'PANTRY CUPBOARD',{closet:1});CT(-16.7,-42,'WINE CRATE');CT(-5.2,-28.8,'CLOAK CLOSET',{closet:1});CT(18.2,-13.2,'STUDY CLOSET',{closet:1});CT(28.7,-19,'GEAR LOCKER',{closet:1});
 CT(-30,21.4,'GAZEBO CHEST');CT(40.3,10.8,'GARDEN BOX');CT(36,50.3,'CRATE');CT(47.2,48.4,'BOAT LOCKER',{closet:1});CT(53,-22.2,'CARGO CRATE');CT(-26,6,'LINEN HAMPER');
 // ---------- items and interactables
 L.items.push({id:'poison',name:'RAT POISON',x:-19,z:-29.9,y:1.2},{id:'wrench',name:'WRENCH',x:-56.7,z:-23.2,y:.98},{id:'coins',name:'COINS',x:1.6,z:15.6,y:-.55,n:3},{id:'coins',name:'COINS',x:-8.5,z:-25,y:.82,n:2});
 const U=(id,x,z,y,o)=>L.uses.push({id,x,z,y,...o});
 U('fuse',-30.35,-16.5,1.4,{name:'FUSE BOX',grp:0,room:'KITCHEN'});U('fuse',34.35,49.5,-10.6,{name:'FUSE BOX',grp:1,room:'BOATHOUSE'});
 U('radio',-8.6,-24.9,.85,{name:'RADIO'});U('radio',-56.4,-17,.85,{name:'RADIO'});U('radio',45.3,46.9,-10.85,{name:'RADIO'});U('radio',20.5,-24.6,.85,{name:'RADIO'});
 U('winch',-14.35,-15,1.3,{name:'CHANDELIER WINCH'});U('decanter',28.9,-11.5,1.12,{name:'WHISKEY DECANTER'});U('railing',55,66.2,-11,{name:'PIER RAILING'});
 U('exit',8,-61.8,.6,{name:'YOUR CAR',exit:'car'});U('exit',58.8,58,-11.6,{name:'SPEEDBOAT',exit:'boat'});
 L.chand={x:0,z:-12,y:6.4,r:2.8};
 // ---------- NPC anchor spots
 const P=(n,x,z,yaw=0)=>L.spot(n,x,z,yaw);
 P('start_drive',2,-66,Math.PI);P('start_service',-60,-66,Math.PI);P('drink_vane',27.5,-11.5,Math.PI/2);P('rail_corvo',55,65.6,0);P('bar_corvo',22,6.2,Math.PI);
}
