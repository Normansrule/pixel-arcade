// NIGHT DRIVE — procedural city: districts, road graph (A*), elevated ring highway + ramps, river + bridges, hill tunnel, park,
// harbour, stunt kickers, repair garages; plus collision (spatial hash of solids) and drivable surface heights.
export const N=10,SP=64,ROAD=14,HALF=ROAD/2,WALK=3.5,HY=10,WORLD=N*SP;
const cl=(v,a,b)=>v<a?a:v>b?b:v;
// seeded RNG so the city is the same every shift
export function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}

export function district(i,j){
 if(i===6)return'river';
 if(i<=1&&j<=1)return'hill';
 if((i===7||i===8)&&j>=6&&j<=8)return'park';
 if(i>=7&&j<=4)return'harbor';
 if(i>=3&&i<=5&&j>=3&&j<=6)return'downtown';
 if(j>=7&&i<=5)return'strip';
 if(i<=2&&j>=2&&j<=6)return'suburb';
 if(i===9&&j>=5||j===9&&i>=7)return'suburb';
 return'midtown';}
export const DNAME={downtown:'DOWNTOWN',strip:'NEON STRIP',harbor:'HARBOUR',park:'LANTERN PARK',suburb:'MAPLE HEIGHTS',midtown:'MIDTOWN',river:'RIVERSIDE',hill:'CRESTVIEW TUNNEL'};

export class City{
 constructor(seed=7){const R=this.R=rng(seed);this.blocks=[];this.solids=[];this.surfaces=[];this.kickers=[];this.shops=[];this.nodes=[];this.edges=[];this.lots=[];this.trees=[];this.lamps=[];this.pondC={x:8*SP,z:7.5*SP,r:30};
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){const x0=i*SP+HALF,z0=j*SP+HALF,x1=(i+1)*SP-HALF,z1=(j+1)*SP-HALF;this.blocks.push({i,j,x0,z0,x1,z1,d:district(i,j)});}
  this.buildGraph();this.buildSolids();this.buildHighway();this.buildKickers();this.buildShops();this.hash();}
 block(i,j){return this.blocks[i*N+j];}
 /* ---------- road graph ---------- */
 buildGraph(){const id=(i,j)=>i*(N+1)+j;for(let i=0;i<=N;i++)for(let j=0;j<=N;j++)this.nodes.push({id:id(i,j),i,j,x:i*SP,z:j*SP,nb:[],alive:true});
  const kill=new Set();// segments buried by the hill, or interior park paths
  const cut=(a,b)=>kill.add(Math.min(a,b)+'_'+Math.max(a,b));cut(id(1,0),id(1,1));cut(id(1,1),id(1,2));
  for(let j=7;j<=8;j++){cut(id(7,j),id(8,j));cut(id(8,j),id(9,j));}cut(id(8,6),id(8,7));cut(id(8,7),id(8,8));cut(id(8,8),id(8,9));
  this.nodes[id(8,7)].alive=false;this.nodes[id(8,8)].alive=false;
  for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){const a=id(i,j);for(const[di,dj]of[[1,0],[0,1]]){const ni=i+di,nj=j+dj;if(ni>N||nj>N)continue;const b=id(ni,nj);const k=Math.min(a,b)+'_'+Math.max(a,b);if(kill.has(k))continue;
    const e={a,b,ax:di?'x':'z',tunnel:dj===0&&j===1&&i<=1,bridge:di===1&&i===6};this.edges.push(e);this.nodes[a].nb.push(b);this.nodes[b].nb.push(a);}}
  this.edgeMap=new Map();for(const e of this.edges)this.edgeMap.set(Math.min(e.a,e.b)+'_'+Math.max(e.a,e.b),e);}
 edge(a,b){return this.edgeMap.get(Math.min(a,b)+'_'+Math.max(a,b));}
 nearestNode(x,z){let best=null,bd=1e9;for(const n of this.nodes){if(!n.alive||!n.nb.length)continue;const d=(n.x-x)**2+(n.z-z)**2;if(d<bd){bd=d;best=n;}}return best;}
 // nearest node that is reachable along the road the point sits on (prefers the node ahead in heading direction)
 roadNodes(x,z){const i=x/SP,j=z/SP;const onX=Math.abs(z-Math.round(j)*SP)<HALF+4,onZ=Math.abs(x-Math.round(i)*SP)<HALF+4;const out=[];
  if(onX){const jj=Math.round(j);for(const ii of[Math.floor(i),Math.ceil(i)]){if(ii<0||ii>N)continue;const n=this.nodes[ii*(N+1)+jj];if(n&&n.alive&&n.nb.length)out.push(n);}}
  if(onZ){const ii=Math.round(i);for(const jj of[Math.floor(j),Math.ceil(j)]){if(jj<0||jj>N)continue;const n=this.nodes[ii*(N+1)+jj];if(n&&n.alive&&n.nb.length)out.push(n);}}
  if(!out.length)out.push(this.nearestNode(x,z));return out;}
 astar(from,to){if(from===to)return[from];const open=new Map([[from.id,0]]),g=new Map([[from.id,0]]),came=new Map();const h=n=>Math.abs(n.x-to.x)+Math.abs(n.z-to.z);const f=new Map([[from.id,h(from)]]);
  let guard=0;while(open.size&&guard++<2000){let cur=null,cf=1e18;for(const[k]of open){const v=f.get(k);if(v<cf){cf=v;cur=k;}}if(cur===to.id){const path=[to];let c=cur;while(came.has(c)){c=came.get(c);path.unshift(this.nodes[c]);}return path;}
   open.delete(cur);const cn=this.nodes[cur];for(const nb of cn.nb){const n=this.nodes[nb];const ng=g.get(cur)+Math.abs(n.x-cn.x)+Math.abs(n.z-cn.z);if(ng<(g.get(nb)??1e18)){came.set(nb,cur);g.set(nb,ng);f.set(nb,ng+h(n));open.set(nb,1);}}}
  return null;}
 // full route from a world position to a world position, as a polyline of points
 route(px,pz,tx,tz){const As=this.roadNodes(px,pz),Bs=this.roadNodes(tx,tz);let best=null,bl=1e18;
  for(const a of As)for(const b of Bs){const p=this.astar(a,b);if(!p)continue;let L=Math.hypot(a.x-px,a.z-pz)+Math.hypot(b.x-tx,b.z-tz);for(let k=1;k<p.length;k++)L+=Math.abs(p[k].x-p[k-1].x)+Math.abs(p[k].z-p[k-1].z);if(L<bl){bl=L;best=p;}}
  if(!best)return{pts:[[px,pz],[tx,tz]],len:Math.hypot(tx-px,tz-pz)};
  const pts=[[px,pz],...best.map(n=>[n.x,n.z]),[tx,tz]];
  // drop nodes that lie behind us (or beyond the target) on the same road line
  const same=(p,q)=>Math.abs(p[0]-q[0])<HALF+4||Math.abs(p[1]-q[1])<HALF+4;const d=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
  while(pts.length>2&&same(pts[0],pts[2])&&d(pts[0],pts[2])<=d(pts[1],pts[2])+2)pts.splice(1,1);
  while(pts.length>2){const L=pts.length;if(same(pts[L-1],pts[L-3])&&d(pts[L-1],pts[L-3])<=d(pts[L-2],pts[L-3])+2)pts.splice(L-2,1);else break;}
  return{pts,len:bl};}
 /* ---------- solids ---------- */
 addSolid(x0,z0,x1,z1,o={}){const s={x0:Math.min(x0,x1),z0:Math.min(z0,z1),x1:Math.max(x0,x1),z1:Math.max(z0,z1),y0:o.y0??-10,y1:o.y1??999,kind:o.kind||'bld',circle:o.r?{x:o.cx,z:o.cz,r:o.r}:null};this.solids.push(s);return s;}
 buildSolids(){const R=this.R;
  for(const b of this.blocks){const bx0=b.x0+WALK,bz0=b.z0+WALK,bx1=b.x1-WALK,bz1=b.z1-WALK;
   if(b.d==='river'||b.d==='park')continue;
   if(b.d==='hill')continue;// hill solids added below as one mass with the tunnel corridor carved out
   if(b.d==='suburb'){// 4 houses per block
    for(let a=0;a<2;a++)for(let c=0;c<2;c++){const w=12+R()*6,d=10+R()*5;const cx=bx0+(bx1-bx0)*(.25+a*.5),cz=bz0+(bz1-bz0)*(.25+c*.5);const lot={x0:cx-w/2,z0:cz-d/2,x1:cx+w/2,z1:cz+d/2,h:6+R()*3,kind:'house',d:b.d,roof:R()<.5?0:1,col:(R()*6)|0};this.lots.push(lot);this.addSolid(lot.x0,lot.z0,lot.x1,lot.z1);
     for(let t=0;t<2;t++){const tx=cx+(R()-.5)*(bx1-bx0)*.4,tz=cz+(c?1:-1)*(d/2+3+R()*3);this.trees.push({x:tx,z:tz,s:.8+R()*.5,k:0});this.addSolid(tx-.5,tz-.5,tx+.5,tz+.5,{kind:'tree'});}}continue;}
   if(b.d==='harbor'){const wh={x0:bx0+2,z0:bz0+2,x1:bx1-2,z1:bz0+(bz1-bz0)*.55,h:10+R()*5,kind:'warehouse',d:b.d,col:(R()*4)|0};this.lots.push(wh);this.addSolid(wh.x0,wh.z0,wh.x1,wh.z1);
    for(let s=0;s<3;s++){const cx=bx0+6+s*13+R()*2,cz=wh.z1+8+R()*(bz1-wh.z1-14);const st=1+((R()*3)|0);const L={x0:cx-6,z0:cz-1.3,x1:cx+6,z1:cz+1.3,h:2.6*st,kind:'containers',d:b.d,stack:st,col:(R()*5)|0};this.lots.push(L);this.addSolid(L.x0,L.z0,L.x1,L.z1);}continue;}
   const tall=b.d==='downtown',strip=b.d==='strip';const split=tall?(R()<.5?1:2):strip?2:(R()<.3?1:2);const lw=(bx1-bx0)/split,ld=(bz1-bz0)/split;
   for(let a=0;a<split;a++)for(let c=0;c<split;c++){const ins=split===1?2:1.2;const lot={x0:bx0+a*lw+ins,z0:bz0+c*ld+ins,x1:bx0+(a+1)*lw-ins,z1:bz0+(c+1)*ld-ins,d:b.d,kind:'tower',col:(R()*4)|0};
    lot.h=tall?(split===1?110+R()*70:60+R()*80):strip?12+R()*22:18+R()*40;lot.setback=tall&&R()<.7;this.lots.push(lot);this.addSolid(lot.x0,lot.z0,lot.x1,lot.z1);}}
  // hill (NW) — solid mass around the tunnel along z = SP
  const hx0=HALF,hx1=2*SP-HALF,hz0=HALF,hz1=2*SP-HALF;this.hill={x0:hx0,z0:hz0,x1:hx1,z1:hz1,tz:SP};this.addSolid(hx0,hz0,hx1,SP-HALF-.5,{kind:'hill'});this.addSolid(hx0,SP+HALF+.5,hx1,hz1,{kind:'hill'});
  // the inner north-south road under the hill is gone: block it at the hill edges so nobody drives into the rock
  this.addSolid(SP-HALF,hz0,SP+HALF,SP-HALF-.5,{kind:'hill'});this.addSolid(SP-HALF,SP+HALF+.5,SP+HALF,hz1,{kind:'hill'});
  // park: trees + pond (pond is water, not solid)
  const px0=7*SP+HALF,px1=9*SP-HALF,pz0=6*SP+HALF,pz1=9*SP-HALF;this.park={x0:px0,z0:pz0,x1:px1,z1:pz1};
  for(let t=0;t<70;t++){const x=px0+4+R()*(px1-px0-8),z=pz0+4+R()*(pz1-pz0-8);if(Math.hypot(x-this.pondC.x,z-this.pondC.z)<this.pondC.r+4)continue;if(Math.abs(z-(pz0+pz1)/2)<6||Math.abs(x-(px0+px1)/2+20)<5)continue;this.trees.push({x,z,s:.9+R()*.7,k:1});this.addSolid(x-.6,z-.6,x+.6,z+.6,{kind:'tree'});}
  // world edge: sea to the east beyond the harbour docks, walls elsewhere
  const E=WORLD+70;this.addSolid(-200,-200,-70,E+200,{kind:'edge'});this.addSolid(-200,-200,E+200,-70,{kind:'edge'});this.addSolid(-200,E,E+200,E+200,{kind:'edge'});this.addSolid(E,-200,E+200,E+200,{kind:'edge'});
  // street lamps along roads (also small solids)
  for(const e of this.edges){const A=this.nodes[e.a],B=this.nodes[e.b];if(e.tunnel)continue;const L=Math.abs(B.x-A.x)+Math.abs(B.z-A.z);for(let s=16;s<L-10;s+=24){for(const side of[-1,1]){if((s/24|0)%2===(side>0?0:1))continue;
    const x=e.ax==='x'?A.x+s:A.x+side*(HALF+.8),z=e.ax==='x'?A.z+side*(HALF+.8):A.z+s;if(e.bridge&&e.ax==='x'){}this.lamps.push({x,z,side,ax:e.ax,bridge:e.bridge});this.addSolid(x-.25,z-.25,x+.25,z+.25,{kind:'lamp'});}}}}
 /* ---------- highway + ramps + bridges ---------- */
 buildHighway(){const W=WORLD,D=8;const S=this.surfaces;const flat=(x0,z0,x1,z1,h,o={})=>{const s={x0,z0,x1,z1,h:()=>h,top:h,walled:o.walled??true,kind:o.kind||'deck'};S.push(s);return s;};
  this.hwy=[flat(-D,-D,W+D,D,HY),flat(-D,W-D,W+D,W+D,HY),flat(-D,-D,D,W+D,HY),flat(W-D,-D,W+D,W+D,HY)];
  // ramps: south (rises toward +x), north (rises toward -x)
  const r1x=2*SP,r1z0=W+11,r1z1=W+25;S.push({x0:r1x,z0:r1z0,x1:r1x+120,z1:r1z1,h:(x)=>cl((x-r1x)/120,0,1)*HY,top:HY,walled:true,kind:'ramp'});flat(r1x+120,W-D,r1x+150,r1z1,HY,{kind:'deck'});
  const r2x=7*SP,r2z0=-25,r2z1=-11;S.push({x0:r2x-120,z0:r2z0,x1:r2x,z1:r2z1,h:(x)=>cl((r2x-x)/120,0,1)*HY,top:HY,walled:true,kind:'ramp'});flat(r2x-150,r2z0,r2x-120,D,HY,{kind:'deck'});
  this.ramps=[{x0:r1x,z0:r1z0,x1:r1x+120,z1:r1z1,dir:1},{x0:r2x-120,z0:r2z0,x1:r2x,z1:r2z1,dir:-1}];
  // highway pillars (outside the road edges)
  this.pillars=[];const add=(x,z)=>{this.pillars.push({x,z});this.addSolid(x-.8,z-.8,x+.8,z+.8,{kind:'pillar',y1:HY-.6});};
  for(let s=16;s<W;s+=32){add(s,-D-1.5);add(s,D+1.6);add(s,W-D-1.6);add(s,W+D+1.5);add(-D-1.5,s);add(D+1.6,s);add(W-D-1.6,s);add(W+D+1.5,s);}
  // bridges: walled ground-level decks across the river
  for(let j=0;j<=N;j++)S.push({x0:6*SP+HALF-2,z0:j*SP-HALF,x1:7*SP-HALF+2,z1:j*SP+HALF,h:()=>0,top:0,walled:true,kind:'bridge'});}
 buildKickers(){const K=[[7.5*SP-14,6*SP+HALF+18,0],[8.6*SP,8.4*SP,Math.PI/2],[3*SP+20,8*SP,Math.PI/2],[5*SP,4.5*SP,0],[9*SP,2.5*SP,0],[2*SP+20,4*SP,-Math.PI/2],[0,6.5*SP,Math.PI]];
  for(const[x,z,a]of K){// a = heading the car should drive (0 = +z)
   const k={x,z,a,len:9,w:6,hmax:2.3,idx:this.kickers.length};const fx=Math.sin(a),fz=Math.cos(a);k.fx=fx;k.fz=fz;
   const cx=x,cz=z;const hx=Math.abs(fx)*k.len/2+Math.abs(fz)*k.w/2,hz=Math.abs(fz)*k.len/2+Math.abs(fx)*k.w/2;
   this.surfaces.push({x0:cx-hx,z0:cz-hz,x1:cx+hx,z1:cz+hz,h:(px,pz)=>{const t=((px-cx)*fx+(pz-cz)*fz)/k.len+.5;return t<0||t>1?-1:t*k.hmax;},top:k.hmax,walled:false,kind:'kicker',k});this.kickers.push(k);}}
 buildShops(){this.shops=[{x:3*SP+HALF+WALK+6,z:2*SP-HALF-1.5,name:'PATCH & PAINT',a:0},{x:7*SP+HALF+12,z:5*SP-HALF-1.5,name:'PATCH & PAINT',a:0},{x:2*SP-HALF-1.5,z:7*SP+HALF+12,name:'PATCH & PAINT',a:Math.PI/2}];}
 /* ---------- queries ---------- */
 hash(){this.H=new Map();const C=32;for(const s of this.solids){if(s.kind==='edge')continue;for(let i=Math.floor(s.x0/C);i<=Math.floor(s.x1/C);i++)for(let j=Math.floor(s.z0/C);j<=Math.floor(s.z1/C);j++){const k=i+','+j;if(!this.H.has(k))this.H.set(k,[]);this.H.get(k).push(s);}}}
 near(x,z){const C=32,out=this._near||(this._near=[]);out.length=0;const i=Math.floor(x/C),j=Math.floor(z/C);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const l=this.H.get((i+a)+','+(j+b));if(l)for(const s of l)if(!out.includes(s))out.push(s);}
  for(const s of this.solids)if(s.kind==='edge')out.push(s);return out;}
 baseGround(x,z){// terrain without decks: river / sea / pond are low, everything else 0
  if(x>6*SP+HALF&&x<7*SP-HALF&&z>-60&&z<WORLD+60)return-4;
  if(x>WORLD+38)return-4;
  const p=this.pondC;if(Math.hypot(x-p.x,z-p.z)<p.r)return-1.2;
  return 0;}
 // highest drivable height at (x,z) not above y+tol
 heightAt(x,z,y=999,tol=1.4){let g=this.baseGround(x,z);let sf=null;for(const s of this.surfaces){if(x<s.x0||x>s.x1||z<s.z0||z>s.z1)continue;const h=s.h(x,z);if(h<0&&s.kind==='kicker')continue;if(h<=y+tol&&h>=g){g=h;sf=s;}}this._sf=sf;return g;}
 surfaceAt(x,z,y){this.heightAt(x,z,y);return this._sf;}
 districtAt(x,z){if(x<0||z<0||x>WORLD||z>WORLD)return'OUTSKIRTS';const i=cl(Math.floor(x/SP),0,N-1),j=cl(Math.floor(z/SP),0,N-1);return DNAME[district(i,j)];}
 onRoad(x,z){const fx=x/SP-Math.round(x/SP),fz=z/SP-Math.round(z/SP);return Math.abs(fx*SP)<HALF||Math.abs(fz*SP)<HALF;}
 // random curb spot on a road (for passengers / drops), away from a point
 curbSpot(R,ax,az,minD=0,maxD=1e9){for(let t=0;t<300;t++){const e=this.edges[(R()*this.edges.length)|0];if(e.tunnel||e.bridge)continue;const A=this.nodes[e.a],B=this.nodes[e.b];if(A.x<0||B.x>WORLD)continue;const s=.2+R()*.6;const side=R()<.5?-1:1;
   const x=e.ax==='x'?A.x+(B.x-A.x)*s:A.x+side*(HALF-1.6),z=e.ax==='x'?A.z+side*(HALF-1.6):A.z+(B.z-A.z)*s;const d=Math.hypot(x-ax,z-az);if(d<minD||d>maxD)continue;const bi=Math.floor(x/SP),bj=Math.floor(z/SP);return{x,z,ax:e.ax,side,edge:e};}
  return{x:SP,z:SP+HALF-1.6,ax:'x',side:1};}}
