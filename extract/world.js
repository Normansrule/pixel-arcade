// EXFIL — world core: terrain height field, box collision world (move / ground / raycast), navigation grid + A*, merged-geometry builder.
import * as THREE from '../vendor/three.module.min.js';

export const WATER=-.35,STEP=.42,MINX=-128,MAXX=132,MINZ=-110,MAXZ=100;
const sst=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export const shoreX=z=>80+4*Math.sin(z*.04)+2.5*Math.sin(z*.11+1);
// terrain height (flat town, rising hills at the north/west/south edges, a hill under the radio tower, beach + sea bed in the east)
export function H(x,z){let h=0;
 const s=x-shoreX(z);if(s>-10)h=-3.6*sst(-10,18,s);
 let dN=-90-z,dS=z-88,dW=-114-x;dN*=sst(3,11,Math.abs(x-35))*(z>-100.5?sst(3.5,9,Math.abs(x+106)):1);dS*=sst(4,12,Math.abs(x-10));
 const pier=Math.abs(z-10)<8&&x>60?0:1;
 const rise=Math.max(0,dN,dS,dW)*pier;if(rise>0)h+=16*sst(0,22,rise)+Math.sin(x*.13)*Math.cos(z*.11)*1.5*sst(0,8,rise);
 const dx=x+46,dz=z+80,d=Math.sqrt(dx*dx+dz*dz);if(d<40)h+=9.5*sst(40,9,d);
 return h;}
export function waterDepth(x,z,y){return WATER-y;}

/* ================= collision world ================= */
// flags: 1 = blocks movement, 2 = blocks bullets + sight, 4 = door (dynamic), 8 = ladder-free walkable top
const CS=4,GX0=-140,GZ0=-120,GW=72,GH=62;
export class World{
 constructor(){this.b=[];this.n=0;this.doors=[];this.sw=[];}
 add(x0,y0,z0,x1,y1,z1,flags=3,mat=0){if(x0>x1)[x0,x1]=[x1,x0];if(y0>y1)[y0,y1]=[y1,y0];if(z0>z1)[z0,z1]=[z1,z0];this.b.push([x0,y0,z0,x1,y1,z1,flags,mat]);return this.n++;}
 finalize(){const n=this.n;this.B=new Float32Array(n*6);this.F=new Uint8Array(n);this.M=new Uint8Array(n);this.on=new Uint8Array(n).fill(1);this.stamp=new Uint32Array(n);this.st=1;
  const cells=Array.from({length:GW*GH},()=>[]);
  this.b.forEach((b,i)=>{for(let k=0;k<6;k++)this.B[i*6+k]=b[k];this.F[i]=b[6];this.M[i]=b[7];
   const cx0=Math.max(0,Math.floor((b[0]-GX0)/CS)),cx1=Math.min(GW-1,Math.floor((b[3]-GX0)/CS)),cz0=Math.max(0,Math.floor((b[2]-GZ0)/CS)),cz1=Math.min(GH-1,Math.floor((b[5]-GZ0)/CS));
   for(let z=cz0;z<=cz1;z++)for(let x=cx0;x<=cx1;x++)cells[z*GW+x].push(i);});
  this.cs=new Int32Array(GW*GH+1);let t=0;cells.forEach((c,i)=>{this.cs[i]=t;t+=c.length;});this.cs[GW*GH]=t;this.cl=new Int32Array(t);t=0;for(const c of cells)for(const i of c)this.cl[t++]=i;this.b=null;}
 // iterate boxes in cells overlapping [x0,x1]x[z0,z1]
 query(x0,z0,x1,z1,fn){const cx0=Math.max(0,Math.floor((x0-GX0)/CS)),cx1=Math.min(GW-1,Math.floor((x1-GX0)/CS)),cz0=Math.max(0,Math.floor((z0-GZ0)/CS)),cz1=Math.min(GH-1,Math.floor((z1-GZ0)/CS));const st=++this.st;
  for(let z=cz0;z<=cz1;z++)for(let x=cx0;x<=cx1;x++){const c=z*GW+x;for(let k=this.cs[c];k<this.cs[c+1];k++){const i=this.cl[k];if(this.stamp[i]===st)continue;this.stamp[i]=st;if(this.on[i])fn(i);}}}
 // highest walkable surface at or below ytop under a circle
 groundAt(x,z,ytop,r=.25){let g=H(x,z);const B=this.B;this.query(x-r,z-r,x+r,z+r,i=>{if(!(this.F[i]&1))return;const o=i*6,top=B[o+4];if(top>ytop||top<=g)return;if(x+r<B[o]||x-r>B[o+3]||z+r<B[o+2]||z-r>B[o+5])return;g=top;});return g;}
 surfAt(x,z,y){let m=-1;const B=this.B;this.query(x-.1,z-.1,x+.1,z+.1,i=>{const o=i*6;if(Math.abs(B[o+4]-y)<.08&&x>=B[o]&&x<=B[o+3]&&z>=B[o+2]&&z<=B[o+5])m=this.M[i];});if(m<0)m=y<WATER+.05?4:H(x,z)>.6||Math.abs(x-shoreX(z))<9?3:0;return m;}
 // capsule-ish move: p = feet position, v velocity; returns state
 move(p,v,dt,r,h,onGround,iters=3){const ox=p.x,oz=p.z;p.x+=v.x*dt;p.z+=v.z*dt;const B=this.B;let wall=false;
  for(let it=0;it<iters;it++){let pushed=false;this.query(p.x-r,p.z-r,p.x+r,p.z+r,i=>{if(!(this.F[i]&1))return;const o=i*6;if(B[o+4]<=p.y+STEP||B[o+1]>=p.y+h)return;
    const cx=p.x<B[o]?B[o]:p.x>B[o+3]?B[o+3]:p.x,cz=p.z<B[o+2]?B[o+2]:p.z>B[o+5]?B[o+5]:p.z;let dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;if(d2>=r*r)return;
    if(d2<1e-9){// centre inside box: push out on the shortest axis
     const px0=p.x-B[o],px1=B[o+3]-p.x,pz0=p.z-B[o+2],pz1=B[o+5]-p.z,m=Math.min(px0,px1,pz0,pz1);if(m===px0)p.x=B[o]-r;else if(m===px1)p.x=B[o+3]+r;else if(m===pz0)p.z=B[o+2]-r;else p.z=B[o+5]+r;}
    else{const d=Math.sqrt(d2),k=(r-d)/d;p.x+=dx*k;p.z+=dz*k;}pushed=true;wall=true;});if(!pushed)break;}
  // terrain cliffs + map bounds + deep water
  const th=H(p.x,p.z);if(th>p.y+STEP+.1&&onGround){const tx=H(p.x,oz),tz=H(ox,p.z);if(tx<=p.y+STEP)p.z=oz;else if(tz<=p.y+STEP)p.x=ox;else{p.x=ox;p.z=oz;}}
  p.x=Math.max(MINX,Math.min(MAXX,p.x));p.z=Math.max(MINZ,Math.min(MAXZ,p.z));
  if(H(p.x,p.z)<WATER-1.2&&p.y<WATER+.3){p.x=ox;p.z=oz;}
  // vertical
  const g0=this.groundAt(p.x,p.z,p.y+STEP,r*.75);p.y+=v.y*dt;let ground=false;
  if(v.y>0){let ceil=false;this.query(p.x-r*.7,p.z-r*.7,p.x+r*.7,p.z+r*.7,i=>{if(!(this.F[i]&1))return;const o=i*6;if(B[o+1]>p.y+h-.25&&B[o+1]<p.y+h+.05&&p.x+r*.7>B[o]&&p.x-r*.7<B[o+3]&&p.z+r*.7>B[o+2]&&p.z-r*.7<B[o+5])ceil=true;});if(ceil)v.y=0;}
  if(p.y<=g0){p.y=g0;if(v.y<0)v.y=0;ground=true;}else if(onGround&&v.y<=0&&p.y-g0<STEP+.05){p.y=g0;v.y=0;ground=true;}
  return{ground,wall,g:g0};}
 // ray vs boxes (mask flags) + terrain; returns t or Infinity, fills out
 ray(ox,oy,oz,dx,dy,dz,maxT,mask=2,out){const B=this.B;let best=maxT,bi=-1,bn=0;
  // DDA over the xz grid
  let cx=Math.floor((ox-GX0)/CS),cz=Math.floor((oz-GZ0)/CS);const sx=dx>0?1:-1,sz=dz>0?1:-1;const idx=Math.abs(dx)>1e-9?1/dx:1e9,idz=Math.abs(dz)>1e-9?1/dz:1e9;
  let tmx=Math.abs(dx)>1e-9?((GX0+(cx+(sx>0?1:0))*CS)-ox)*idx:1e9,tmz=Math.abs(dz)>1e-9?((GZ0+(cz+(sz>0?1:0))*CS)-oz)*idz:1e9;const tdx=Math.abs(CS*idx),tdz=Math.abs(CS*idz);const st=++this.st;let t0=0;
  for(let guard=0;guard<200;guard++){if(cx>=0&&cx<GW&&cz>=0&&cz<GH){const c=cz*GW+cx;for(let k=this.cs[c];k<this.cs[c+1];k++){const i=this.cl[k];if(this.stamp[i]===st)continue;this.stamp[i]=st;if(!this.on[i]||!(this.F[i]&mask))continue;const o=i*6;
     let tn=-1e9,tf=1e9,ax=0;const ix=idx,iy=Math.abs(dy)>1e-9?1/dy:1e9,iz=idz;
     let a=(B[o]-ox)*ix,b=(B[o+3]-ox)*ix;if(a>b){const q=a;a=b;b=q;}if(a>tn){tn=a;ax=0;}if(b<tf)tf=b;
     a=(B[o+1]-oy)*iy;b=(B[o+4]-oy)*iy;if(a>b){const q=a;a=b;b=q;}if(a>tn){tn=a;ax=1;}if(b<tf)tf=b;
     a=(B[o+2]-oz)*iz;b=(B[o+5]-oz)*iz;if(a>b){const q=a;a=b;b=q;}if(a>tn){tn=a;ax=2;}if(b<tf)tf=b;
     if(tn<=tf&&tf>0&&tn<best){const t=Math.max(0,tn);best=t;bi=i;bn=ax;}}}
   const tn=Math.min(tmx,tmz);if(tn>=best||tn>maxT)break;t0=tn;if(tmx<tmz){tmx+=tdx;cx+=sx;}else{tmz+=tdz;cz+=sz;}if((cx<-1||cx>GW||cz<-1||cz>GH))break;}
  // terrain march
  let tt=Infinity;const lim=Math.min(best,maxT);if(oy<26||oy+dy*lim<26){let prev=0;for(let t=.5;t<=lim+1;t+=1.4){const tc=Math.min(t,lim),y=oy+dy*tc,x=ox+dx*tc,z=oz+dz*tc;if(y<H(x,z)){let a=prev,b=tc;for(let k=0;k<8;k++){const m=(a+b)/2;if(oy+dy*m<H(ox+dx*m,oz+dz*m))b=m;else a=m;}tt=a;break;}prev=tc;if(tc>=lim)break;}}
  if(tt<best){if(out){out.t=tt;out.i=-1;const x=ox+dx*tt,z=oz+dz*tt,e=.5,hx=H(x+e,z)-H(x-e,z),hz=H(x,z+e)-H(x,z-e);const L=Math.hypot(hx,2*e,hz);out.nx=-hx/L;out.ny=2*e/L;out.nz=-hz/L;out.mat=3;}return tt;}
  if(bi<0){if(out){out.t=Infinity;out.i=-1;}return Infinity;}
  if(out){out.t=best;out.i=bi;out.nx=bn===0?-Math.sign(dx):0;out.ny=bn===1?-Math.sign(dy):0;out.nz=bn===2?-Math.sign(dz):0;out.mat=this.M[bi];}return best;}
 locked(i){const d=this.doorOf&&this.doorOf.get(i);return d?!!(d.lock&&!d.unlocked):false;}
 los(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az,d=Math.hypot(dx,dy,dz);if(d<.01)return true;return this.ray(ax,ay,az,dx/d,dy/d,dz/d,d-.05,2)===Infinity;}
}

/* ================= navigation grid (1 m, up to NL stacked floors per cell + stair links) ================= */
export const NX0=-128,NZ0=-110,NW=260,NH=210,NL=4,NN=NW*NH;
export class Nav{
 constructor(world){this.w=world;this.lg=new Float32Array(NN*NL);this.lb=new Uint8Array(NN*NL).fill(1);this.ew=new Uint8Array(NN*NL);this.nl=new Uint8Array(NN).fill(1);this.g=this.lg.subarray(0,NN);this.bl=this.lb.subarray(0,NN);for(let z=0;z<NH;z++)for(let x=0;x<NW;x++)this.cell(x,z);
  this.open=new Int32Array(NN);this.came=new Int32Array(NN*NL);this.gs=new Float32Array(NN*NL);this.seen=new Uint32Array(NN*NL);this.mark=1;this.heap=[];this.links();}
 cell(x,z){const w=this.w,B=w.B,i=z*NW+x,cx=NX0+x+.5,cz=NZ0+z+.5;const th=H(cx,cz);let under=th<WATER-.55;for(let l=1;l<NL;l++)this.lb[l*NN+i]=1;this.nl[i]=1;
  // walkable box tops with clearance: layer 0 = lowest (terrain, piers, ground floors), layers 1.. = upper floors, mezzanines, decks
  let cand=[];w.query(cx-.1,cz-.1,cx+.1,cz+.1,k=>{if(!(w.F[k]&1)||(w.F[k]&4))return;const o=k*6;if(cx<B[o]||cx>B[o+3]||cz<B[o+2]||cz>B[o+5])return;cand.push(B[o+4]);});
  cand.sort((a,b)=>a-b);let base=under?null:th,k=0;for(;k<cand.length;k++){const top=cand[k];if(top<th-.05)continue;if(base!==null&&top>base+STEP)break;if(base===null||top>base)base=top;}
  if(base===null){this.bl[i]=1;this.g[i]=th;return;}this.g[i]=base;
  let blk=this.blk(cx,cz,base);if(H(cx+.6,cz)-H(cx-.6,cz)>1||H(cx,cz+.6)-H(cx,cz-.6)>1)blk=1;this.bl[i]=blk;this.ew[i]=blk?0:this.edges(cx,cz,base);
  for(let l=1;l<NL&&k<cand.length;l++){let y=cand[k++];while(k<cand.length&&cand[k]<=y+STEP)y=Math.max(y,cand[k++]);const j=l*NN+i;this.nl[i]=l+1;this.lg[j]=y;this.lb[j]=this.blk(cx,cz,y);this.ew[j]=this.lb[j]?0:this.edges(cx,cz,y);}}
 // thin walls between two cell centres (bit 1: +x edge, bit 2: +z edge)
 edges(cx,cz,g){const w=this.w,B=w.B;let e=0;w.query(cx,cz,cx+1,cz+1,k=>{if(e===3||!(w.F[k]&1))return;if((w.F[k]&4)&&!w.locked(k))return;const o=k*6;if(B[o+4]<=g+.5||B[o+1]>=g+1.75)return;if(B[o]<=cx+1&&B[o+3]>=cx&&B[o+2]<=cz&&B[o+5]>=cz)e|=1;if(B[o+2]<=cz+1&&B[o+5]>=cz&&B[o]<=cx&&B[o+3]>=cx)e|=2;});return e;}
 blk(cx,cz,g,r=.32){const w=this.w,B=w.B;let blk=0;w.query(cx-.5-r,cz-.5-r,cx+.5+r,cz+.5+r,k=>{if(blk||!(w.F[k]&1))return;if((w.F[k]&4)&&!w.locked(k))return;const o=k*6;if(B[o+4]<=g+.5||B[o+1]>=g+1.75)return;if(cx+r<B[o]||cx-r>B[o+3]||cz+r<B[o+2]||cz-r>B[o+5])return;blk=1;});return blk;}
 // stairways (W.sw) become graph edges: foot (axial or side entry, whichever is clear) -> first step -> landing past the top
 links(){this.lk=new Map();this.sl=[];const add=(a,b,c,p)=>{let L=this.lk.get(a);if(!L)this.lk.set(a,L=[]);L.push({to:b,c,p});};
  for(const s of this.w.sw||[]){const hw=s.w/2,P=(u,v)=>s.ax==='x'?[s.x+u*s.dir,s.z+hw+v]:[s.x+hw+v,s.z+u*s.dir];const top=P(s.L+.55,0),s1=P(.2,0);
   // nodes on the flight itself are too steep to link cell to cell: drop them, the stair link covers the flight
   const[a0,b0]=P(0,-hw),[a1,b1]=P(s.L,hw);for(let z=Math.max(0,Math.floor(Math.min(b0,b1)-NZ0));z<=Math.min(NH-1,Math.floor(Math.max(b0,b1)-NZ0));z++)for(let x=Math.max(0,Math.floor(Math.min(a0,a1)-NX0));x<=Math.min(NW-1,Math.floor(Math.max(a0,a1)-NX0));x++)for(let l=0;l<NL;l++){const j=l*NN+z*NW+x;if(this.lg[j]>s.y0+.3&&this.lg[j]<s.y1-.3)this.lb[j]=1;}
   if(!this.clear(top[0],top[1],s.y1))continue;const tN=this.near(top[0],top[1],s.y1,2,.6);if(tN<0)continue;
   for(const[u,v]of[[-.5,0],[.25,-hw-.45],[.25,hw+.45]]){const e=P(u,v);if(!this.clear(e[0],e[1],s.y0))continue;const bN=this.near(e[0],e[1],s.y0,2,.6);if(bN<0)continue;
    const up=[[e[0],s.y0,e[1]],[s1[0],s.y0+s.rise,s1[1]],[top[0],s.y1,top[1]]],c=Math.hypot(top[0]-e[0],top[1]-e[1])*1.1+1.5;add(bN,tN,c,up);add(tN,bN,c,up.slice().reverse());this.sl.push({s,bN,tN,up});break;}}}
 clear(x,z,y){return Math.abs(this.w.groundAt(x,z,y+STEP,.2)-y)<.2&&!this.blk(x,z,y,.3);}
 refresh(x0,z0,x1,z1){for(let z=Math.max(0,Math.floor(z0-NZ0)-1);z<=Math.min(NH-1,Math.floor(z1-NZ0)+1);z++)for(let x=Math.max(0,Math.floor(x0-NX0)-1);x<=Math.min(NW-1,Math.floor(x1-NX0)+1);x++)this.cell(x,z);this.links();}
 idx(x,z){const ix=Math.floor(x-NX0),iz=Math.floor(z-NZ0);if(ix<0||iz<0||ix>=NW||iz>=NH)return -1;return iz*NW+ix;}
 free(i){return i>=0&&!this.bl[i];}
 pt(i){const c=i%NN;return[NX0+c%NW+.5,this.lg[i],NZ0+((c/NW)|0)+.5];}
 nearestFree(x,z,R=6){let i=this.idx(x,z);if(this.free(i))return i;const ix=Math.floor(x-NX0),iz=Math.floor(z-NZ0);for(let r=1;r<=R;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const a=ix+dx,b=iz+dz;if(a<0||b<0||a>=NW||b>=NH)continue;const j=b*NW+a;if(!this.bl[j])return j;}return -1;}
 // nearest free node on the floor closest to height y (any layer; height error weighs 3x distance)
 near(x,z,y,R=6,tol=1.2){if(y===undefined)return this.nearestFree(x,z,R);const ix=Math.floor(x-NX0),iz=Math.floor(z-NZ0);let best=-1,bs=1e9;for(let r=0;r<=R&&r<bs;r++){for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dz))!==r)continue;const a=ix+dx,b=iz+dz;if(a<0||b<0||a>=NW||b>=NH)continue;
   for(let l=0;l<NL;l++){const j=l*NN+b*NW+a;if(this.lb[j])continue;const d=Math.abs(this.lg[j]-y);if(d<tol&&d*3+r<bs){bs=d*3+r;best=j;}}}}return best;}
 pass(a,b){return !this.lb[b]&&Math.abs(this.lg[a]-this.lg[b])<.6;}
 // node of cell c reachable from node a (closest height), or -1
 to(a,c){let best=-1,bd=.6;for(let l=0,m=this.nl[c];l<m;l++){const j=l*NN+c;if(this.lb[j])continue;const d=Math.abs(this.lg[a]-this.lg[j]);if(d<bd){bd=d;best=j;}}return best;}
 // orthogonal or diagonal step from node a at cell (x,z), honouring thin-wall edges
 st(a,x,z,dx,dz){const ew=this.ew;if(dx&&dz){const s1=this.st(a,x,z,dx,0);if(s1<0)return -1;const s2=this.st(a,x,z,0,dz);if(s2<0)return -1;const j=this.to(a,(z+dz)*NW+x+dx);if(j<0||(dz>0?ew[s1]&2:ew[j]&2)||(dx>0?ew[s2]&1:ew[j]&1))return -1;return j;}
  const j=this.to(a,(z+dz)*NW+x+dx);if(j<0)return -1;if(dx>0?ew[a]&1:dx<0?ew[j]&1:dz>0?ew[a]&2:ew[j]&2)return -1;return j;}
 // A* -> array of [x,y,z] waypoints (smoothed) or null; sy/ty pick the floor at each end
 path(sx,sz,tx,tz,sy,ty,maxN=24000){const on=(x,z,y)=>{if(y===undefined)return null;for(const q of this.sl){const s=q.s,u=(s.ax==='x'?x-s.x:z-s.z)*s.dir,v=s.ax==='x'?z-s.z:x-s.x;if(u>-.1&&u<s.L+.1&&v>-.2&&v<s.w+.2&&y>s.y0+.15&&y<s.y1+.3)return{q,u};}return null;};
  // on a flight: start/end at the landing that leads the right way, plus the flight's own waypoints
  const so=on(sx,sz,sy),te=on(tx,tz,ty);let pre=[],post=[],s,t;
  if(so){const up=ty!==undefined&&ty>(so.q.s.y0+so.q.s.y1)/2;s=up?so.q.tN:so.q.bN;pre=up?[so.q.up[2]]:[so.q.up[1],so.q.up[0]];}else s=this.near(sx,sz,sy,6);
  if(te){const up=te.u>te.q.s.L/2;t=up?te.q.tN:te.q.bN;post=up?[te.q.up[2],[tx,ty,tz]]:[te.q.up[0],te.q.up[1],[tx,ty,tz]];}else t=this.near(tx,tz,ty,8);
  if(s<0)s=this.nearestFree(sx,sz);if(t<0)t=this.nearestFree(tx,tz,8);if(s<0||t<0)return null;if(s===t)return[...pre,...(post.length?post:[[tx,this.lg[t],tz]])];
  const mk=++this.mark,gs=this.gs,came=this.came,seen=this.seen,heap=this.heap;heap.length=0;const tc=t%NN,tX=tc%NW,tZ=(tc/NW)|0;
  const hfn=i=>{const c=i%NN,dx=Math.abs(c%NW-tX),dz=Math.abs(((c/NW)|0)-tZ);return Math.max(dx,dz)+.414*Math.min(dx,dz);};
  const push=(i,f)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m;}}return top;};
  seen[s]=mk;gs[s]=0;came[s]=-1;push(s,hfn(s));let n=0,found=false;const D=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
  const rl=(i,j,c)=>{const ng=gs[i]+c;if(seen[j]!==mk||ng<gs[j]){seen[j]=mk;gs[j]=ng;came[j]=i;push(j,ng+hfn(j));}};
  while(heap.length&&n++<maxN){const[f,i]=pop();if(i===t){found=true;break;}const ci=i%NN,x=ci%NW,z=(ci/NW)|0;if(f-hfn(i)>gs[i]+1e-4)continue;
   for(const[dx,dz,c]of D){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=NW||nz>=NH)continue;const j=this.st(i,x,z,dx,dz);if(j<0)continue;rl(i,j,c);}
   const L=this.lk.get(i);if(L)for(const k of L)rl(i,k.to,k.c);}
  if(!found)return null;const cells=[];for(let i=t;i!==-1;i=came[i])cells.push(i);cells.reverse();
  // stair links between consecutive nodes stay as fixed waypoints; string pulling within each floor run
  const lk=cells.map((a,k)=>k<cells.length-1&&(this.lk.get(a)||[]).find(q=>q.to===cells[k+1])||null);
  const out=[];let a=0;while(a<cells.length-1){if(lk[a]){for(const p of lk[a].p)out.push(p);a++;out.push(this.pt(cells[a]));continue;}
   let e=a+1;while(e<cells.length-1&&!lk[e])e++;let b=e;while(b>a+1&&!this.walk(cells[a],cells[b]))b--;out.push(this.pt(cells[b]));a=b;}
  return[...pre,...out,...post];}
 walk(a,b){const ca=a%NN,cb=b%NN;let x0=ca%NW,z0=(ca/NW)|0;const x1=cb%NW,z1=(cb/NW)|0;const dx=Math.abs(x1-x0),dz=Math.abs(z1-z0),sx=x0<x1?1:-1,sz=z0<z1?1:-1;let err=dx-dz,prev=a;
  for(let g=0;g<400;g++){if(x0===x1&&z0===z1)return prev===b;const e2=2*err;const mx=e2>-dz?sx:0,mz=e2<dx?sz:0;// diagonal steps require both sides
   if(mx)err-=dz;if(mz)err+=dx;const c=this.st(prev,x0,z0,mx,mz);if(c<0)return false;x0+=mx;z0+=mz;prev=c;}return false;}
 randomNear(x,z,r,rnd=Math.random,y){for(let k=0;k<20;k++){const a=rnd()*Math.PI*2,d=rnd()*r;const i=this.idx(x+Math.cos(a)*d,z+Math.sin(a)*d);if(i<0)continue;
   if(y===undefined){if(this.free(i))return this.pt(i);continue;}let j=-1,bd=1.2;for(let l=0;l<NL;l++){const n=l*NN+i;if(!this.lb[n]&&Math.abs(this.lg[n]-y)<bd){bd=Math.abs(this.lg[n]-y);j=n;}}if(j>=0)return this.pt(j);}return null;}
}

/* ================= merged geometry builder ================= */
const CH=48;
export class Geo{
 constructor(){this.k={};this.uvs={};}
 bucket(mat,cx,cz){const key=mat+'|'+Math.floor((cx+150)/CH)+','+Math.floor((cz+130)/CH);return this.k[key]||(this.k[key]={mat,p:[],n:[],u:[],c:[]});}
 quad(B,a,b,c,d,n,ua,ub,uc,ud,col){// two tris a b c, a c d
  const P=B.p,N=B.n,U=B.u,C=B.c;for(const[v,uv,cc]of[[a,ua,col[0]],[b,ub,col[1]],[c,uc,col[2]],[a,ua,col[0]],[c,uc,col[2]],[d,ud,col[3]]]){P.push(v[0],v[1],v[2]);N.push(n[0],n[1],n[2]);U.push(uv[0],uv[1]);C.push(cc[0],cc[1],cc[2]);}}
 // axis-aligned or rotated box; o: {rot:[rx,ry,rz], s: uv scale, ind: tint multiplier, ao: bottom darkening, skip:{top,bottom,...}}
 box(x0,y0,z0,x1,y1,z1,mat,tint=0xffffff,o={}){if(x0>x1)[x0,x1]=[x1,x0];if(y0>y1)[y0,y1]=[y1,y0];if(z0>z1)[z0,z1]=[z1,z0];
  const cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2,hx=(x1-x0)/2,hy=(y1-y0)/2,hz=(z1-z0)/2;const B=this.bucket(mat,cx,cz);const s=o.s||this.uvs[mat]||2;
  const col=new THREE.Color(tint);const ind=o.ind??1;const ao=o.ao??.72;
  let m=o.m||null;if(o.rot){m=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(o.rot[0],o.rot[1],o.rot[2],'YXZ'));}
  const V=(sx,sy,sz)=>{let x=sx*hx,y=sy*hy,z=sz*hz;if(m){const v=new THREE.Vector3(x,y,z).applyMatrix4(m);x=v.x;y=v.y;z=v.z;}return[cx+x,cy+y,cz+z];};
  const N=(nx,ny,nz)=>{if(!m)return[nx,ny,nz];const v=new THREE.Vector3(nx,ny,nz).transformDirection(m);return[v.x,v.y,v.z];};
  const cc=f=>[col.r*ind*f,col.g*ind*f,col.b*ind*f];const lo=cc(ao),hi=cc(1),bot=cc(.5);
  const sk=o.skip||{};const ux=(o.uo||0);
  // world-ish uv: use local extents offset by centre for continuity
  const X0=cx-hx,X1=cx+hx,Y0=cy-hy,Y1=cy+hy,Z0=cz-hz,Z1=cz+hz;
  if(!sk.px)this.quad(B,V(1,-1,1),V(1,-1,-1),V(1,1,-1),V(1,1,1),N(1,0,0),[-Z1/s,Y0/s],[-Z0/s,Y0/s],[-Z0/s,Y1/s],[-Z1/s,Y1/s],[lo,lo,hi,hi]);
  if(!sk.nx)this.quad(B,V(-1,-1,-1),V(-1,-1,1),V(-1,1,1),V(-1,1,-1),N(-1,0,0),[Z0/s,Y0/s],[Z1/s,Y0/s],[Z1/s,Y1/s],[Z0/s,Y1/s],[lo,lo,hi,hi]);
  if(!sk.pz)this.quad(B,V(-1,-1,1),V(1,-1,1),V(1,1,1),V(-1,1,1),N(0,0,1),[X0/s+ux,Y0/s],[X1/s+ux,Y0/s],[X1/s+ux,Y1/s],[X0/s+ux,Y1/s],[lo,lo,hi,hi]);
  if(!sk.nz)this.quad(B,V(1,-1,-1),V(-1,-1,-1),V(-1,1,-1),V(1,1,-1),N(0,0,-1),[-X1/s,Y0/s],[-X0/s,Y0/s],[-X0/s,Y1/s],[-X1/s,Y1/s],[lo,lo,hi,hi]);
  if(!sk.py)this.quad(B,V(-1,1,1),V(1,1,1),V(1,1,-1),V(-1,1,-1),N(0,1,0),[X0/s,-Z1/s],[X1/s,-Z1/s],[X1/s,-Z0/s],[X0/s,-Z0/s],[hi,hi,hi,hi]);
  if(!sk.ny)this.quad(B,V(-1,-1,-1),V(1,-1,-1),V(1,-1,1),V(-1,-1,1),N(0,-1,0),[X0/s,Z0/s],[X1/s,Z0/s],[X1/s,Z1/s],[X0/s,Z1/s],[bot,bot,bot,bot]);}
 // vertical cylinder (or along axis 'x'/'z')
 cyl(x,y,z,r,h,mat,tint=0xffffff,seg=12,axis='y',o={}){const B=this.bucket(mat,x,z);const s=o.s||this.uvs[mat]||2;const col=new THREE.Color(tint),ind=o.ind??1,r2=o.r2??r;
  const P=(a,t,rr)=>{const c=Math.cos(a)*rr,d=Math.sin(a)*rr;if(axis==='y')return[x+c,y+t,z+d];if(axis==='x')return[x+t,y+c,z+d];return[x+c,y+d,z+t];};
  const Nn=a=>{const c=Math.cos(a),d=Math.sin(a);if(axis==='y')return[c,0,d];if(axis==='x')return[0,c,d];return[c,d,0];};
  const lo=[col.r*ind*.75,col.g*ind*.75,col.b*ind*.75],hi=[col.r*ind,col.g*ind,col.b*ind];const circ=2*Math.PI*r;
  for(let i=0;i<seg;i++){const a0=i/seg*Math.PI*2,a1=(i+1)/seg*Math.PI*2;const n=Nn((a0+a1)/2);this.quad(B,P(a0,0,r),P(a1,0,r),P(a1,h,r2),P(a0,h,r2),n,[i/seg*circ/s,0],[(i+1)/seg*circ/s,0],[(i+1)/seg*circ/s,h/s],[i/seg*circ/s,h/s],[lo,lo,hi,hi]);
   if(!o.open){const c0=P(0,h,0),c1=P(0,0,0);const up=axis==='y'?[0,1,0]:axis==='x'?[1,0,0]:[0,0,1];this.quad(B,c0,P(a0,h,r2),P(a1,h,r2),c0,up,[.5,.5],[.5+Math.cos(a0)*.5,.5+Math.sin(a0)*.5],[.5+Math.cos(a1)*.5,.5+Math.sin(a1)*.5],[.5,.5],[hi,hi,hi,hi]);
    this.quad(B,c1,P(a1,0,r),P(a0,0,r),c1,up.map(v=>-v),[.5,.5],[.5,.5],[.5,.5],[.5,.5],[lo,lo,lo,lo]);}}}
 // box between two points (any orientation), square section t
 beam(ax,ay,az,bx,by,bz,t,mat,tint,o={}){const d=new THREE.Vector3(bx-ax,by-ay,bz-az),L=d.length();d.normalize();const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d);const m=new THREE.Matrix4().makeRotationFromQuaternion(q);const cx=(ax+bx)/2,cy=(ay+by)/2,cz=(az+bz)/2;this.box(cx-t/2,cy-L/2,cz-(o.t2??t)/2,cx+t/2,cy+L/2,cz+(o.t2??t)/2,mat,tint,{...o,m});}
 build(mats,group,shadow=true){const out=[];for(const key in this.k){const b=this.k[key];if(!b.p.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.computeBoundingSphere();
  const m=new THREE.Mesh(g,mats[b.mat]);m.castShadow=shadow&&!mats[b.mat].userData.noShadow;m.receiveShadow=true;m.matrixAutoUpdate=false;m.updateMatrix();group.add(m);out.push(m);}this.k={};return out;}
}
