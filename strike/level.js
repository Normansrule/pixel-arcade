// STRIKE ZONE — level runtime (no three.js, unit-testable in node): an axis-aligned box world with real interiors and storeys,
// grid-accelerated raycasts, character collision, a 0.5 m occupancy grid (light baking + cover), and a multi-level nav graph with A*.
export const STEP=.55,GS=4,NAV=1,VOX=.5;
const NOSTAND={wall:1,parapet:1};
const NONAV={bound:1,parapet:1,perimeter:1,rail:1,balrail:1,balustrade:1,post:1,trunk:1,tank:1,silo:1,column:1,lowwall:1,barrier:1,blockwall:1,wall:1,towerbody:0,machine:1,furnace:1,hvac:1,planter:1};

/* ===================================================================== authoring kit */
export class Kit{
 constructor(){this.boxes=[];this.pads=[];this.spawns=[];this.pickups=[];this.lights=[];this.decor=[];this.zones=[];}
 box(x0,y0,z0,x1,y1,z1,m='concrete',o={}){if(x1<x0)[x0,x1]=[x1,x0];if(y1<y0)[y0,y1]=[y1,y0];if(z1<z0)[z0,z1]=[z1,z0];if(x1-x0<.005||y1-y0<.005||z1-z0<.005)return null;
  const b={x0,y0,z0,x1,y1,z1,m,coll:o.coll!==false,ray:o.ray!==false,vis:o.vis!==false,kind:o.kind||'block',tint:o.tint||null,uvBox:!!o.uvBox,noTop:!!o.noTop,noBottom:!!o.noBottom,sc:o.sc||0,top:o.top||null};this.boxes.push(b);return b;}
 slab(x0,z0,x1,z1,y,th=.3,m='concrete',o={}){return this.box(x0,y-th,z0,x1,y,z1,m,{kind:'slab',...o});}
 // wall in plan from (x0,z0) to (x1,z1) — the longer side is the run, the shorter the thickness. gaps: [a,b,lo,hi] along the run (absolute coords), lo/hi above y0.
 wall(x0,z0,x1,z1,y0,y1,m='concrete',gaps=[],o={}){if(x1<x0)[x0,x1]=[x1,x0];if(z1<z0)[z0,z1]=[z1,z0];const ax=(x1-x0)>=(z1-z0);const a0=ax?x0:z0,a1=ax?x1:z1;
  const cuts=new Set([a0,a1]);for(const g of gaps){cuts.add(Math.max(a0,Math.min(a1,g[0])));cuts.add(Math.max(a0,Math.min(a1,g[1])));}const cs=[...cuts].sort((p,q)=>p-q);
  for(let k=0;k<cs.length-1;k++){const u=cs[k],v=cs[k+1];if(v-u<.01)continue;const holes=gaps.filter(g=>g[0]<=u+1e-6&&g[1]>=v-1e-6).map(g=>[y0+g[2],y0+g[3]]).sort((p,q)=>p[0]-q[0]);
   let y=y0;for(const[h0,h1]of holes){if(h0>y)this.box(ax?u:x0,y,ax?z0:u,ax?v:x1,Math.min(h0,y1),ax?z1:v,m,{kind:'wall',...o});y=Math.max(y,h1);}if(y<y1)this.box(ax?u:x0,y,ax?z0:u,ax?v:x1,y1,ax?z1:v,m,{kind:'wall',...o});}}
 // straight stairs inside a rectangle rising toward dir (+x -x +z -z) from y0 to y1; float = slab steps (walkable underneath)
 stairs(x0,z0,x1,z1,y0,y1,dir,m='concrete',o={}){const n=Math.max(2,Math.round((y1-y0)/(o.rise||.4))),r=(y1-y0)/n;const along=dir[1]==='x';const A0=along?x0:z0,A1=along?x1:z1,len=(A1-A0)/n;
  for(let k=1;k<=n;k++){const top=y0+r*k,base=o.float?top-.32:(o.base??y0);let a,b;if(dir[0]==='+'){a=A0+len*(k-1);b=a+len;}else{b=A1-len*(k-1);a=b-len;}if(k===n&&o.last!==false){if(dir[0]==='+')b=A1;else a=A0;}
   this.box(along?a:x0,base,along?z0:a,along?b:x1,top,along?z1:b,m,{kind:'step',...o});}
  this.decor.push({k:'stairs',x0,z0,x1,z1,y0,y1,dir,n});}
 rail(x0,z0,x1,z1,y,h=1.05,o={}){const b=this.box(x0,y,z0,x1,y+h,z1,o.m||'steel',{kind:'rail',ray:!!o.solid,vis:!!o.solid,...o});if(!o.solid)this.decor.push({k:'rail',x0,z0,x1,z1,y,h});return b;}
 crate(x,z,s=1.2,y=0,o={}){return this.box(x-s/2,y,z-s/2,x+s/2,y+s*(o.h||1),z+s/2,o.m||'crate',{kind:'crate',uvBox:true,...o});}
 barrel(x,z,y=0,col=0){this.box(x-.36,y,z-.36,x+.36,y+1.05,z+.36,'barrel',{kind:'barrel',vis:false});this.decor.push({k:'barrel',x,y,z,col});}
 container(x0,z0,x1,z1,y=0,col=0){return this.box(x0,y,z0,x1,y+2.6,z1,'container',{kind:'container',tint:col,uvBox:true});}
 pad(x,y,z,tx,ty,tz){this.pads.push({x,y,z,to:{x:tx,y:ty,z:tz}});}
 spawn(x,y,z,yaw,team=-1){this.spawns.push({x,y,z,yaw,team});}
 pickup(k,x,y,z){this.pickups.push({k,x,y,z});}
 light(x,y,z,col,int=8,dist=14,o={}){this.lights.push({x,y,z,col,int,dist,real:o.real!==false,bake:o.bake!==false,fixture:o.fixture||'lamp'});}
 zone(name,x0,z0,x1,z1,y0=-99,y1=99){this.zones.push({name,x0,z0,x1,z1,y0,y1});}
 dec(o){this.decor.push(o);}}

/* ===================================================================== runtime */
export class Level{
 constructor(def){this.def=def;const K=new Kit();def.build(K);Object.assign(this,{boxes:K.boxes,pads:K.pads,spawns:K.spawns,pickups:K.pickups,lights:K.lights,decor:K.decor,zones:K.zones});
  this.ground=def.ground!==false;this.gy=0;this.killY=def.killY??-25;[this.X0,this.Z0,this.X1,this.Z1]=def.bounds;
  // invisible containment (tall, not rendered, does not stop bullets)
  const{X0,Z0,X1,Z1}=this,t=1;for(const b of[[X0-t,Z0-t,X1+t,Z0],[X0-t,Z1,X1+t,Z1+t],[X0-t,Z0,X0,Z1],[X1,Z0,X1+t,Z1]])this.boxes.push({x0:b[0],y0:-60,z0:b[1],x1:b[2],y1:60,z1:b[3],m:'none',coll:true,ray:false,vis:false,kind:'bound'});
  this.finalize();this.buildVox();this.buildNav();}
 finalize(){const S=this.boxes,n=S.length,B=this.B=new Float64Array(n*6);S.forEach((b,i)=>B.set([b.x0,b.y0,b.z0,b.x1,b.y1,b.z1],i*6));
  this.collOK=new Uint8Array(n);this.rayOK=new Uint8Array(n);S.forEach((b,i)=>{this.collOK[i]=b.coll?1:0;this.rayOK[i]=b.ray?1:0;});
  // thin walls/parapets are never floors for CPU fighters: no standing on the top, and they block up to cap (top+1.5, or the underside of whatever sits above) so a jump cannot carry a bot onto or over them
  this.ns=new Uint8Array(n);this.cap=new Float64Array(n);S.forEach((b,i)=>{if(!b.coll||!NOSTAND[b.kind]||Math.min(b.x1-b.x0,b.z1-b.z0)>.6||b.y1-b.y0<=STEP)return;let c=b.y1+1.5;for(const o of S)if(o!==b&&o.coll&&o.kind!=='bound'&&o.y0>=b.y1-.01&&o.y0<c&&o.x0<b.x1&&o.x1>b.x0&&o.z0<b.z1&&o.z1>b.z0)c=o.y0;this.ns[i]=1;this.cap[i]=c>b.y1+.05?c:b.y1-.02;});
  const GX=this.GX=Math.ceil((this.X1-this.X0)/GS)+2,GZ=this.GZ=Math.ceil((this.Z1-this.Z0)/GS)+2;this.gx0=this.X0-GS;this.gz0=this.Z0-GS;this.cells=Array.from({length:GX*GZ},()=>[]);
  S.forEach((b,i)=>{const i0=Math.max(0,Math.floor((b.x0-this.gx0)/GS)),i1=Math.min(GX-1,Math.floor((b.x1-this.gx0)/GS)),j0=Math.max(0,Math.floor((b.z0-this.gz0)/GS)),j1=Math.min(GZ-1,Math.floor((b.z1-this.gz0)/GS));for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++)this.cells[j*GX+k].push(i);});
  this.mk=new Uint32Array(n);this.st=0;this.nl=[];this.ymax=Math.max(8,...S.filter(b=>b.vis).map(b=>b.y1))+1;this.ymin=this.ground?-1:Math.min(-2,...S.filter(b=>b.vis).map(b=>b.y0));}
 near(x,z,r){const GX=this.GX,GZ=this.GZ,out=this.nl;out.length=0;const s=++this.st;const i0=Math.max(0,Math.floor((x-r-this.gx0)/GS)),i1=Math.min(GX-1,Math.floor((x+r-this.gx0)/GS)),j0=Math.max(0,Math.floor((z-r-this.gz0)/GS)),j1=Math.min(GZ-1,Math.floor((z+r-this.gz0)/GS));
  for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++){const c=this.cells[j*GX+k];for(let m=0;m<c.length;m++){const i=c[m];if(this.mk[i]!==s){this.mk[i]=s;out.push(i);}}}return out;}

 /* ---------- rays (first solid hit). out: {t, i (box, -2 floor, -1 none), nx,ny,nz} ---------- */
 ray(ox,oy,oz,dx,dy,dz,maxT,out){const B=this.B,ix=1/(Math.abs(dx)<1e-9?1e-9:dx),iy=1/(Math.abs(dy)<1e-9?1e-9:dy),iz=1/(Math.abs(dz)<1e-9?1e-9:dz);let best=maxT,bi=-1,ax=-1,sg=0;
  if(this.ground&&dy<0){const t=(this.gy-oy)/dy;if(t>=0&&t<best){best=t;bi=-2;ax=1;sg=1;}}
  const s=++this.st,GX=this.GX,GZ=this.GZ;let gx=Math.floor((ox-this.gx0)/GS),gz=Math.floor((oz-this.gz0)/GS);const sx=dx>0?1:-1,sz=dz>0?1:-1;const tdx=Math.abs(GS*ix),tdz=Math.abs(GS*iz);
  let tmx=Math.abs(dx)<1e-9?Infinity:((this.gx0+(gx+(dx>0?1:0))*GS)-ox)*ix,tmz=Math.abs(dz)<1e-9?Infinity:((this.gz0+(gz+(dz>0?1:0))*GS)-oz)*iz;
  for(let n=0;n<400;n++){if(gx>=0&&gz>=0&&gx<GX&&gz<GZ){const c=this.cells[gz*GX+gx];for(let m=0;m<c.length;m++){const i=c[m];if(this.mk[i]===s)continue;this.mk[i]=s;if(!this.rayOK[i])continue;const k=i*6;
     let t1=(B[k]-ox)*ix,t2=(B[k+3]-ox)*ix,tmin,tmax,a=0,g;if(t1<t2){tmin=t1;tmax=t2;g=-1;}else{tmin=t2;tmax=t1;g=1;}
     t1=(B[k+1]-oy)*iy;t2=(B[k+4]-oy)*iy;if(t1<t2){if(t1>tmin){tmin=t1;a=1;g=-1;}if(t2<tmax)tmax=t2;}else{if(t2>tmin){tmin=t2;a=1;g=1;}if(t1<tmax)tmax=t1;}if(tmin>tmax)continue;
     t1=(B[k+2]-oz)*iz;t2=(B[k+5]-oz)*iz;if(t1<t2){if(t1>tmin){tmin=t1;a=2;g=-1;}if(t2<tmax)tmax=t2;}else{if(t2>tmin){tmin=t2;a=2;g=1;}if(t1<tmax)tmax=t1;}if(tmin>tmax||tmin<0)continue;
     if(tmin<best){best=tmin;bi=i;ax=a;sg=g;}}}
   const tn=Math.min(tmx,tmz);if(best<=tn||tn>=maxT)break;if(tmx<tmz){tmx+=tdx;gx+=sx;}else{tmz+=tdz;gz+=sz;}
   if((gx<0&&sx<0)||(gx>=GX&&sx>0)||(gz<0&&sz<0)||(gz>=GZ&&sz>0))break;}
  if(out){out.t=best;out.i=bi;out.nx=ax===0?sg:0;out.ny=ax===1?sg:0;out.nz=ax===2?sg:0;}return bi===-1?Infinity:best;}
 los(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az,l=Math.hypot(dx,dy,dz);if(l<1e-4)return true;return this.ray(ax,ay,az,dx/l,dy/l,dz/l,l-.05)===Infinity;}

 /* ---------- character collision (feet at p.y, cylinder radius r, height h) ---------- */
 groundAt(x,z,feet,r=.3,ns=0){let g=this.ground?this.gy:-1e9;const B=this.B,L=this.near(x,z,r+.05);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i]||ns&&this.ns[i])continue;const top=B[k+4];if(top>feet+STEP||top<=g||B[k+1]>feet+STEP)continue;
   if(x+r<=B[k]||x-r>=B[k+3]||z+r<=B[k+2]||z-r>=B[k+5])continue;g=top;}return g;}
 ceil(x,z,feet,r=.3){let c=Infinity;const B=this.B,L=this.near(x,z,r+.05);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i])continue;const y0=B[k+1];if(y0<feet+1.0||y0>=c)continue;if(x+r*.8<=B[k]||x-r*.8>=B[k+3]||z+r*.8<=B[k+2]||z-r*.8>=B[k+5])continue;c=y0;}return c;}
 collide(p,r,h,step=STEP,ns=0){const B=this.B,L=this.near(p.x,p.z,r+.6).slice();let hit=false;
  for(let pass=0;pass<3;pass++){let moved=false;for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i])continue;if((ns&&this.ns[i]?p.y>=this.cap[i]:B[k+4]<=p.y+step)||B[k+1]>=p.y+h)continue;
    const cx=Math.max(B[k],Math.min(p.x,B[k+3])),cz=Math.max(B[k+2],Math.min(p.z,B[k+5]));let dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;if(d2>=r*r)continue;hit=moved=true;
    if(d2>1e-10){const d=Math.sqrt(d2);p.x+=dx/d*(r-d+1e-4);p.z+=dz/d*(r-d+1e-4);}else{const l=p.x-B[k],rr=B[k+3]-p.x,u=p.z-B[k+2],dd=B[k+5]-p.z,m=Math.min(l,rr,u,dd);if(m===l)p.x=B[k]-r;else if(m===rr)p.x=B[k+3]+r;else if(m===u)p.z=B[k+2]-r;else p.z=B[k+5]+r;}}if(!moved)break;}
  return hit;}
 blocked(x,z,ya,yb,r){const B=this.B,L=this.near(x,z,r+.05);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.collOK[i])continue;if(B[k+1]>=yb||B[k+4]<=ya)continue;if(x+r<=B[k]||x-r>=B[k+3]||z+r<=B[k+2]||z-r>=B[k+5])continue;return true;}return false;}
 inside(x,y,z){const B=this.B,L=this.near(x,z,.02);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(!this.rayOK[i])continue;if(x>B[k]&&x<B[k+3]&&y>B[k+1]&&y<B[k+4]&&z>B[k+2]&&z<B[k+5])return i;}if(this.ground&&y<this.gy)return -2;return -1;}

 /* ---------- occupancy voxels (0.5 m): baking + quick tests ---------- */
 buildVox(){const VX=this.VX=Math.ceil((this.X1-this.X0)/VOX),VZ=this.VZ=Math.ceil((this.Z1-this.Z0)/VOX),VY=this.VY=Math.ceil((this.ymax-this.ymin)/VOX)+1;const occ=this.occ=new Uint8Array(VX*VY*VZ);
  for(const b of this.boxes){if(!b.vis&&b.kind!=='barrel'||b.kind==='rail'&&!b.ray)continue;const i0=Math.max(0,Math.round((b.x0-this.X0)/VOX)),i1=Math.min(VX,Math.round((b.x1-this.X0)/VOX)),k0=Math.max(0,Math.round((b.z0-this.Z0)/VOX)),k1=Math.min(VZ,Math.round((b.z1-this.Z0)/VOX)),j0=Math.max(0,Math.round((b.y0-this.ymin)/VOX)),j1=Math.min(VY,Math.round((b.y1-this.ymin)/VOX));
   for(let j=j0;j<j1;j++)for(let k=k0;k<k1;k++)for(let i=i0;i<i1;i++)occ[(j*VZ+k)*VX+i]=1;}}
 occAt(x,y,z){const i=Math.floor((x-this.X0)/VOX),k=Math.floor((z-this.Z0)/VOX),j=Math.floor((y-this.ymin)/VOX);if(j<0)return this.ground?1:0;if(i<0||k<0||i>=this.VX||k>=this.VZ||j>=this.VY)return 0;return this.occ[(j*this.VZ+k)*this.VX+i];}
 // fraction of a few sky directions that escape (0 = deep interior, 1 = open sky)
 skyVis(x,y,z,nx=0,ny=1,nz=0){const D=[[0,1,0],[.6,.8,0],[-.6,.8,0],[0,.8,.6],[0,.8,-.6],[.45,.6,.45],[-.45,.6,-.45]];let v=0,w=0;
  for(const d of D){const dot=d[0]*nx+d[1]*ny+d[2]*nz;if(dot<-.2)continue;const wt=.4+Math.max(0,dot);w+=wt;let px=x+nx*.3,py=y+ny*.3,pz=z+nz*.3,ok=1;for(let s=0;s<60;s++){px+=d[0]*VOX;py+=d[1]*VOX;pz+=d[2]*VOX;if(py>this.ymax)break;if(this.occAt(px,py,pz)){ok=0;break;}}v+=ok*wt;}return w?v/w:1;}
 occlusion(x,y,z,nx,ny,nz){let o=0,n=0;const tx=Math.abs(ny)>.9?1:0,tz=Math.abs(ny)>.9?0:1;const bx=ny*tz-nz*0,by=nz*tx-nx*tz,bz=nx*0-ny*tx;
  for(const r of[.3,.75])for(const[a,b]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const k=r*.8;const px=x+nx*r+(tx*a+bx*b)*k,py=y+ny*r+(by*b)*k,pz=z+nz*r+(tz*a+bz*b)*k;o+=this.occAt(px,py,pz)*(r<.5?1:.7);n+=r<.5?1:.7;}return 1-o/n;}
 lineFree(ax,ay,az,bx,by,bz){const d=Math.hypot(bx-ax,by-ay,bz-az),n=Math.ceil(d/(VOX*.8));for(let i=1;i<n;i++){const t=i/n;if(this.occAt(ax+(bx-ax)*t,ay+(by-ay)*t,az+(bz-az)*t))return false;}return true;}

 /* ---------- nav graph: 1 m cells, one node per standable storey ---------- */
 trav(ax,ay,az,bx,by,bz){const dy=by-ay,r=.29;
  if(Math.abs(dy)<=1.3){let y=ay,ok=true;for(let s=1;s<=5;s++){const t=s/5,x=ax+(bx-ax)*t,z=az+(bz-az)*t;const g=this.groundAt(x,z,y,r);if(g<y-STEP-.05){ok=false;break;}y=g;if(this.blocked(x,z,y+.3,y+1.65,r)){ok=false;break;}}if(ok&&Math.abs(y-by)<.13)return 1;}
  if(dy>STEP&&dy<=1.15){const top=ay+1.25;if(this.blocked(ax,az,ay+.3,top+1.7,r)||this.blocked((ax+bx)/2,(az+bz)/2,by+.05,top+1.7,r)||this.blocked(bx,bz,by+.3,by+1.7,r))return 0;return 2;}
  if(dy<-STEP&&dy>=-6.5){if(this.groundAt(bx,bz,ay,r)>=ay-STEP)return 0;if(this.blocked((ax+bx)/2,(az+bz)/2,ay+.3,ay+1.65,r)||this.blocked(bx,bz,by+.3,ay+1.65,r))return 0;return 3;}
  return 0;}
 buildNav(){const NX=this.NX=Math.ceil((this.X1-this.X0)/NAV),NZ=this.NZ=Math.ceil((this.Z1-this.Z0)/NAV);const X=[],Y=[],Z=[];const cn=this.cellNodes=Array.from({length:NX*NZ},()=>[]);
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const x=this.X0+(i+.5)*NAV,z=this.Z0+(j+.5)*NAV;const hs=[];if(this.ground)hs.push(this.gy);const L=this.near(x,z,.3);const B=this.B;
   for(const q of L){const k=q*6;if(!this.collOK[q]||NONAV[this.boxes[q].kind])continue;if(x+.22>B[k]&&x-.22<B[k+3]&&z+.22>B[k+2]&&z-.22<B[k+5])hs.push(B[k+4]);}
   const uh=[...new Set(hs.map(h=>Math.round(h*100)/100))].sort((a,b)=>a-b);
   const got=[];for(const h0 of uh){let h=h0;for(let it=0;it<8;it++){const g=this.groundAt(x,z,h+.01,.29);if(g<=h+.02)break;h=g;}if(got.some(v=>Math.abs(v-h)<.05))continue;got.push(h);if(this.blocked(x,z,h+.02,h+1.75,.29))continue;cn[j*NX+i].push(X.length);X.push(x);Y.push(h);Z.push(z);}}
  const N=this.NN=X.length;this.nx=Float32Array.from(X);this.ny=Float32Array.from(Y);this.nz=Float32Array.from(Z);
  const adj=Array.from({length:N},()=>[]);
  for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++)for(const a of cn[j*NX+i]){for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=NX||nj>=NZ)continue;
    for(const b of cn[nj*NX+ni]){const t=this.trav(X[a],Y[a],Z[a],X[b],Y[b],Z[b]);if(!t)continue;if(t===3&&cn[nj*NX+ni].some(c=>Math.abs(Y[c]-Y[a])<=STEP+.12))continue;const d=Math.hypot(di,dj,Y[b]-Y[a]);adj[a].push([b,t,d+(t===2?1.2:t===3?.6:0)]);}}}
  // jump pads
  for(const p of this.pads){const to=this.nearestNode(p.to.x,p.to.y+.5,p.to.z);if(to<0)continue;for(let a=0;a<N;a++){if(Math.hypot(X[a]-p.x,Z[a]-p.z)<1.3&&Math.abs(Y[a]-p.y)<.6)adj[a].push([to,4,4]);}}
  let m=0;for(const l of adj)m+=l.length;const as=this.as=new Int32Array(N+1),at=this.at=new Int32Array(m),aty=this.aty=new Uint8Array(m),ac=this.ac=new Float32Array(m);let o=0;
  for(let a=0;a<N;a++){as[a]=o;for(const[b,t,c]of adj[a]){at[o]=b;aty[o]=t;ac[o]=c;o++;}}as[N]=o;
  // wall proximity cost + cover mask
  this.wallC=new Float32Array(N);this.cover=new Uint8Array(N);const D8=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  for(let a=0;a<N;a++){let w=0,cv=0;D8.forEach(([dx,dz],k)=>{const l=Math.hypot(dx,dz);const x=X[a]+dx/l*.85,z=Z[a]+dz/l*.85;if(this.blocked(x,z,Y[a]+.3,Y[a]+1.5,.12)){w++;if(this.blocked(x,z,Y[a]+1.0,Y[a]+1.45,.12))cv|=1<<k;}});this.wallC[a]=w*.08;this.cover[a]=cv;}
  // reachability from spawns
  this.reach=new Uint8Array(N);const q=[];for(const s of this.spawns){const n=this.nearestNode(s.x,s.y+.5,s.z);if(n>=0&&!this.reach[n]){this.reach[n]=1;q.push(n);}}
  while(q.length){const a=q.pop();for(let e=as[a];e<as[a+1];e++){const b=at[e];if(!this.reach[b]){this.reach[b]=1;q.push(b);}}}
  this.reachList=[];this.coverList=[];for(let a=0;a<N;a++)if(this.reach[a]){this.reachList.push(a);if(this.cover[a])this.coverList.push(a);}
  this.ntype=new Uint8Array(N);this.ng=new Float32Array(N);this.npar=new Int32Array(N);this.nst=new Uint32Array(N);this.ncl=new Uint32Array(N);this.ngen=0;this.heap=new Int32Array(N*8+16);this.hf=new Float32Array(N*8+16);}
 nearestNode(x,y,z,reachOnly=false){const NX=this.NX,NZ=this.NZ;const ci=Math.floor((x-this.X0)/NAV),cj=Math.floor((z-this.Z0)/NAV);let best=-1,bd=1e9;
  for(let r=0;r<6;r++){for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=ci+di,j=cj+dj;if(i<0||j<0||i>=NX||j>=NZ)continue;
     for(const n of this.cellNodes[j*NX+i]){if(reachOnly&&this.reach&&!this.reach[n])continue;const dy=this.ny[n]-y;const d=Math.hypot(this.nx[n]-x,this.nz[n]-z)+(dy>.7?dy*3+4:Math.abs(dy)*1.2);if(d<bd){bd=d;best=n;}}}if(best>=0&&r>=1)break;}return best;}
 node(n){return{x:this.nx[n],y:this.ny[n],z:this.nz[n]};}
 // A* over the nav graph; returns [{x,y,z,t}] (t = how to enter this point: 1 walk 2 jump 3 drop 4 pad)
 path(sx,sy,sz,tx,ty,tz,maxIter=this.NN*4){const s=this.nearestNode(sx,sy+.3,sz,true),t=this.nearestNode(tx,ty+.3,tz,true);if(s<0||t<0)return null;return this.pathN(s,t,maxIter);}
 pathN(s,t,maxIter=this.NN*4){const g=this.ng,par=this.npar,st=this.nst,cl=this.ncl,H=this.heap,F=this.hf,X=this.nx,Y=this.ny,Z=this.nz;const gen=++this.ngen;let hn=0;
  const h=c=>Math.hypot(X[c]-X[t],(Y[c]-Y[t])*1.5,Z[c]-Z[t]);
  const push=(c,f)=>{if(hn>=H.length)return;let k=hn++;while(k>0){const p=(k-1)>>1;if(F[p]<=f)break;H[k]=H[p];F[k]=F[p];k=p;}H[k]=c;F[k]=f;};
  const pop=()=>{const top=H[0],lc=H[--hn],lf=F[hn];let k=0;for(;;){let c=2*k+1;if(c>=hn)break;if(c+1<hn&&F[c+1]<F[c])c++;if(F[c]>=lf)break;H[k]=H[c];F[k]=F[c];k=c;}H[k]=lc;F[k]=lf;return top;};
  g[s]=0;st[s]=gen;par[s]=-1;push(s,h(s));let it=0,found=false;
  while(hn>0&&it++<maxIter){const c=pop();if(c===t){found=true;break;}if(cl[c]===gen)continue;cl[c]=gen;for(let e=this.as[c];e<this.as[c+1];e++){const k=this.at[e];if(cl[k]===gen)continue;const ng=g[c]+this.ac[e]+this.wallC[k];if(st[k]!==gen||ng<g[k]){st[k]=gen;g[k]=ng;par[k]=c;this.ntype[k]=this.aty[e];push(k,ng+h(k));}}}
  if(!found)return null;const out=[];for(let c=t;c>=0;c=par[c])out.push({x:X[c],y:Y[c],z:Z[c],t:c===s?1:this.ntype[c],n:c});out.reverse();return out;}
 // straight walk check on one storey (used for path smoothing)
 walkLine(ax,ay,az,bx,by,bz){const d=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(d/.45));let y=ay;for(let s=1;s<=n;s++){const t=s/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;const g=this.groundAt(x,z,y,.3);if(g<y-STEP-.05||g>y+STEP)return false;y=g;if(this.blocked(x,z,y+.3,y+1.65,.34))return false;}return Math.abs(y-by)<.3;}
 zoneAt(x,y,z){for(const q of this.zones)if(x>=q.x0&&x<=q.x1&&z>=q.z0&&z<=q.z1&&y>=q.y0&&y<=q.y1)return q.name;return '';}
}
