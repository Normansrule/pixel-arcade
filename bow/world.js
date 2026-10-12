// LONGBOW KEEP — collision world (heightfield terrain + axis-aligned blocks + ramps + ladders + water) and the CPU navigation graph.
export const STEP=.55,PR=.36,PH=1.78,EYE=1.62,GRAV=21;
const VOID=-1e9;
let stamp=1;
export class World{
 constructor(b){this.b=b;this.blocks=[];this.cell=8;this.grid=new Map();this.ladders=[];this.waters=[];this.res=1;this.voidY=-40;this.ice=null;}
 /* ----- terrain ----- */
 setTerrain(fn){const{x0,x1,z0,z1}=this.b,r=this.res;this.tx0=x0-4;this.tz0=z0-4;this.nx=Math.ceil((x1-x0+8)/r)+1;this.nz=Math.ceil((z1-z0+8)/r)+1;this.H=new Float32Array(this.nx*this.nz);
  for(let j=0;j<this.nz;j++)for(let i=0;i<this.nx;i++){const v=fn(this.tx0+i*r,this.tz0+j*r);this.H[j*this.nx+i]=v===null||v===undefined||v<-500?NaN:v;}this.fn=fn;}
 terrain(x,z){const fx=(x-this.tx0)/this.res,fz=(z-this.tz0)/this.res;let i=Math.floor(fx),j=Math.floor(fz);if(i<0||j<0||i>=this.nx-1||j>=this.nz-1)return VOID;const u=fx-i,v=fz-j,k=j*this.nx+i,H=this.H;
  const a=H[k],b=H[k+1],c=H[k+this.nx],d=H[k+this.nx+1];if(a!==a||b!==b||c!==c||d!==d)return VOID;return(a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;}
 tnormal(x,z,o){const e=.5,hx=this.terrain(x+e,z)-this.terrain(x-e,z),hz=this.terrain(x,z+e)-this.terrain(x,z-e);const l=Math.hypot(hx,2*e,hz);o.x=-hx/l;o.y=2*e/l;o.z=-hz/l;return o;}
 /* ----- blocks ----- */
 key(i,j){return(i+512)*4096+(j+512);}
 addBlock(o){const b=Object.assign({kind:'stone',walk:true,nav:false,dyn:false,ramp:null,id:this.blocks.length,s:0},o);if(b.x0>b.x1)[b.x0,b.x1]=[b.x1,b.x0];if(b.z0>b.z1)[b.z0,b.z1]=[b.z1,b.z0];if(b.y0>b.y1)[b.y0,b.y1]=[b.y1,b.y0];
  this.blocks.push(b);this._index(b,true);return b;}
 removeBlock(b){if(b.dead)return;b.dead=true;this._index(b,false);const i=this.blocks.indexOf(b);if(i>=0)this.blocks.splice(i,1);}
 _index(b,add){const c=this.cell;for(let i=Math.floor(b.x0/c);i<=Math.floor(b.x1/c);i++)for(let j=Math.floor(b.z0/c);j<=Math.floor(b.z1/c);j++){const k=this.key(i,j);let l=this.grid.get(k);if(add){if(!l)this.grid.set(k,l=[]);l.push(b);}else if(l){const n=l.indexOf(b);if(n>=0)l.splice(n,1);}}}
 near(x0,z0,x1,z1,out=[]){out.length=0;const c=this.cell,s=++stamp;for(let i=Math.floor(x0/c);i<=Math.floor(x1/c);i++)for(let j=Math.floor(z0/c);j<=Math.floor(z1/c);j++){const l=this.grid.get(this.key(i,j));if(!l)continue;for(const b of l){if(b.s===s)continue;b.s=s;if(b.x1<x0||b.x0>x1||b.z1<z0||b.z0>z1)continue;out.push(b);}}return out;}
 top(b,x,z){if(!b.ramp)return b.y1;let t=b.ramp.axis==='x'?(x-b.x0)/(b.x1-b.x0):(z-b.z0)/(b.z1-b.z0);if(b.ramp.dir<0)t=1-t;t=t<0?0:t>1?1:t;const lo=b.ramp.lo??b.y0;return lo+(b.y1-lo)*t;}
 groundAt(x,z,y,r=0){let h=this.terrain(x,z);const L=this.near(x-r,z-r,x+r,z+r,_nb);for(const b of L){if(!b.walk)continue;const cx=x<b.x0?b.x0:x>b.x1?b.x1:x,cz=z<b.z0?b.z0:z>b.z1?b.z1:z;const t=this.top(b,cx,cz);if(t<=y+.01&&t>h)h=t;}return h;}
 solidAt(x,y,z){const L=this.near(x,z,x,z,_nb);for(const b of L){if(x<b.x0||x>b.x1||z<b.z0||z>b.z1)continue;if(y>=b.y0&&y<this.top(b,x,z))return b;}return y<this.terrain(x,z)?true:null;}
 bodyBlocked(x,y,z,r=.3){const L=this.near(x-r,z-r,x+r,z+r,_nb);for(const b of L){if(b.y0>=y+1.6)continue;const cx=x<b.x0?b.x0:x>b.x1?b.x1:x,cz=z<b.z0?b.z0:z>b.z1?b.z1:z;if((x-cx)**2+(z-cz)**2>r*r)continue;if(this.top(b,cx,cz)>y+STEP)return b;}return null;}
 waterAt(x,z){let w=VOID;for(const r of this.waters)if(x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1&&r.y>w)w=r.y;return w;}
 ladderAt(x,y,z){for(const l of this.ladders){const dx=x-l.x,dz=z-l.z;const along=dx*l.tx+dz*l.tz,out=dx*l.nx+dz*l.nz;if(Math.abs(along)<l.w*.5+.15&&out>-.2&&out<.95&&y>l.y0-.3&&y<l.y1+.1)return l;}return null;}
 /* ----- body movement (players + bots) ----- */
 move(e,dt){const p=e.pos,v=e.vel,r=PR;let nx=p.x+v.x*dt,nz=p.z+v.z*dt;
  // steep terrain: refuse uphill moves steeper than ~48 degrees (or terrain walls when standing on a deck)
  if(e.onGround&&!e.ladder){const t1=this.terrain(nx,nz);if(t1>p.y+.02){const t0=this.terrain(p.x,p.z),onT=t0>p.y-.2;
   const bad=(x,z)=>{const t=this.terrain(x,z),d=Math.hypot(x-p.x,z-p.z);if(t<=p.y+.02||d<1e-6)return false;return onT?t-t0>d*1.12:t>p.y+STEP;};
   if(bad(nx,nz)){if(!bad(nx,p.z))nz=p.z;else if(!bad(p.x,nz))nx=p.x;else{nx=p.x;nz=p.z;}}}}
  for(let it=0;it<2;it++){const L=this.near(nx-r-.1,nz-r-.1,nx+r+.1,nz+r+.1,_nb);for(const b of L){if(b.y0>=p.y+PH-.05)continue;const cx=nx<b.x0?b.x0:nx>b.x1?b.x1:nx,cz=nz<b.z0?b.z0:nz>b.z1?b.z1:nz;if(this.top(b,cx,cz)<=p.y+STEP)continue;
   let dx=nx-cx,dz=nz-cz,d2=dx*dx+dz*dz;if(d2>=r*r)continue;
   if(d2>1e-9){const d=Math.sqrt(d2),k=(r-d)/d;nx+=dx*k;nz+=dz*k;const nnx=dx/d,nnz=dz/d,vn=v.x*nnx+v.z*nnz;if(vn<0){v.x-=vn*nnx;v.z-=vn*nnz;}}
   else{const a=nx-b.x0+r,bb=b.x1-nx+r,c=nz-b.z0+r,dd=b.z1-nz+r,m=Math.min(a,bb,c,dd);if(m===a){nx=b.x0-r;v.x=Math.min(0,v.x);}else if(m===bb){nx=b.x1+r;v.x=Math.max(0,v.x);}else if(m===c){nz=b.z0-r;v.z=Math.min(0,v.z);}else{nz=b.z1+r;v.z=Math.max(0,v.z);}}}}
  const B=this.b;if(nx<B.x0+1){nx=B.x0+1;v.x=Math.max(0,v.x);}if(nx>B.x1-1){nx=B.x1-1;v.x=Math.min(0,v.x);}if(nz<B.z0+1){nz=B.z0+1;v.z=Math.max(0,v.z);}if(nz>B.z1-1){nz=B.z1-1;v.z=Math.min(0,v.z);}
  let ny;const res=_res;res.landed=false;res.impact=0;
  if(e.ladder){ny=p.y+v.y*dt;}else{v.y-=GRAV*dt;ny=p.y+v.y*dt;}
  const g=this.groundAt(nx,nz,Math.max(p.y,ny)+STEP,r*.55);
  if(v.y<=0&&ny<=g){res.impact=-v.y;ny=g;v.y=0;if(!e.onGround)res.landed=true;e.onGround=true;}
  else if(e.onGround&&v.y<=0&&ny-g<.5&&!e.ladder){ny=g;v.y=0;}
  else e.onGround=false;
  if(v.y>0){const L=this.near(nx-r*.6,nz-r*.6,nx+r*.6,nz+r*.6,_nb);for(const b of L){if(b.y0>=p.y+PH-.05&&b.y0<ny+PH){ny=b.y0-PH;v.y=0;}}}
  e.ground=g;p.set(nx,ny,nz);return res;}
 /* ----- rays (arrows, line of sight) ----- */
 ray(o,d,maxT,out=_ray,skipDyn=false){let best=maxT,hit=null,nx=0,ny=0,nz=0;
  const ex=o.x+d.x*maxT,ez=o.z+d.z*maxT;const L=this.near(Math.min(o.x,ex),Math.min(o.z,ez),Math.max(o.x,ex),Math.max(o.z,ez),_nr);
  for(const b of L){if(skipDyn&&b.dyn)continue;let t0=0,t1=best,ax=0,an=0;
   for(let a=0;a<3;a++){const oo=a===0?o.x:a===1?o.y:o.z,dd=a===0?d.x:a===1?d.y:d.z,lo=a===0?b.x0:a===1?b.y0:b.z0,hi=a===0?b.x1:a===1?b.y1:b.z1;
    if(Math.abs(dd)<1e-9){if(oo<lo||oo>hi){t0=2;t1=1;break;}continue;}let ta=(lo-oo)/dd,tb=(hi-oo)/dd,sg=-1;if(ta>tb){const t=ta;ta=tb;tb=t;sg=1;}if(ta>t0){t0=ta;ax=a;an=sg;}if(tb<t1)t1=tb;if(t0>t1)break;}
   if(t0>t1)continue;
   if(b.ramp){let t=t0,found=false;const st=.12;for(;t<=t1+1e-6;t+=st){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<=this.top(b,x,z)){found=true;break;}}if(!found||t>=best)continue;best=t;hit=b;
    const s=(b.y1-(b.ramp.lo??b.y0))/(b.ramp.axis==='x'?b.x1-b.x0:b.z1-b.z0)*b.ramp.dir;if(t<=t0+1e-6&&ax!==1){nx=ax===0?an:0;ny=0;nz=ax===2?an:0;}else{const l=Math.hypot(s,1);nx=b.ramp.axis==='x'?-s/l:0;nz=b.ramp.axis==='z'?-s/l:0;ny=1/l;}continue;}
   if(t0<best){best=t0;hit=b;nx=ax===0?an:0;ny=ax===1?an:0;nz=ax===2?an:0;}}
  // terrain march
  let tt=-1;const st=Math.max(.35,Math.min(1.2,best/24));let pt=0,py=o.y-this.terrain(o.x,o.z);
  if(py>0)for(let t=st;t<=best+st;t+=st){const tc=Math.min(t,best),x=o.x+d.x*tc,y=o.y+d.y*tc,z=o.z+d.z*tc;const h=y-this.terrain(x,z);if(h<0){let a=pt,bb=tc;for(let k=0;k<6;k++){const m=(a+bb)/2;if(o.y+d.y*m-this.terrain(o.x+d.x*m,o.z+d.z*m)<0)bb=m;else a=m;}tt=bb;break;}pt=tc;if(tc>=best)break;}
  if(tt>=0&&tt<best){best=tt;hit='terrain';this.tnormal(o.x+d.x*tt,o.z+d.z*tt,_tn);nx=_tn.x;ny=_tn.y;nz=_tn.z;}
  out.t=hit?best:Infinity;out.hit=hit;out.nx=nx;out.ny=ny;out.nz=nz;return out;}
 los(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz);if(l<.01)return true;_d.x=dx/l;_d.y=dy/l;_d.z=dz/l;return this.ray(a,_d,l-.05,_ray2).t===Infinity;}
}
const _nb=[],_nr=[],_ray={},_ray2={},_tn={},_d={},_res={};

/* ================= navigation graph + A* ================= */
export class Nav{
 constructor(W){this.W=W;this.nodes=[];this.cell=4;this.grid=new Map();}
 add(x,y,z,tag){const n={x,y,z,e:[],i:this.nodes.length,tag:tag||''};this.nodes.push(n);const k=this.k(x,z);let l=this.grid.get(k);if(!l)this.grid.set(k,l=[]);l.push(n);return n;}
 k(x,z){return(Math.floor(x/this.cell)+512)*4096+Math.floor(z/this.cell)+512;}
 link(a,b,type,oneway){const d=Math.hypot(a.x-b.x,(a.y-b.y)*1.5,a.z-b.z);const w=this.W.waterAt((a.x+b.x)/2,(a.z+b.z)/2)>(a.y+b.y)/2?2.2:1;const c=d*w*(type==='ladder'?1.6:1);
  if(!a.e.some(e=>e[0]===b))a.e.push([b,c,type||'']);if(!oneway&&!b.e.some(e=>e[0]===a))b.e.push([a,c,type||'']);}
 walkClear(a,b){const W=this.W,d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(2,Math.ceil(d/.6));let prev=a.y;
  for(let k=1;k<=n;k++){const t=k/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=a.y+(b.y-a.y)*t;const g=W.groundAt(x,z,Math.max(y,prev)+STEP+.1,.1);
   if(g<y-1.25||g>y+1||Math.abs(g-prev)>.75)return false;if(W.bodyBlocked(x,g,z,.3))return false;if(W.terrain(x,z)<W.voidY)return g>W.voidY;prev=g;}return true;}
 dropClear(a,b){const W=this.W,d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(2,Math.ceil(d/.5));for(let k=1;k<n;k++){const t=k/n,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;if(W.bodyBlocked(x,a.y,z,.25))return false;}return Math.abs(W.groundAt(b.x,b.z,b.y+.5,.1)-b.y)<.5;}
 build(extra){const W=this.W,B=W.b,S=3,cols=[];this.S=S;
  const nxs=Math.floor((B.x1-B.x0-2)/S),nzs=Math.floor((B.z1-B.z0-2)/S);const cells=new Array((nxs+1)*(nzs+1));
  const navB=W.blocks.filter(b=>b.nav);
  for(let j=0;j<=nzs;j++)for(let i=0;i<=nxs;i++){const x=B.x0+1+i*S+S/2,z=B.z0+1+j*S+S/2;const L=[];const t=W.terrain(x,z);
   if(t>W.voidY&&!W.solidAt(x,t+.9,z)&&!W.bodyBlocked(x,t,z,.35)&&W.waterAt(x,z)-t<1.5)L.push(this.add(x,t,z,'g'));
   for(const b of navB){if(x<b.x0+.2||x>b.x1-.2||z<b.z0+.2||z>b.z1-.2)continue;const tp=W.top(b,x,z);if(L.some(n=>Math.abs(n.y-tp)<.6))continue;if(W.solidAt(x,tp+.9,z)||W.bodyBlocked(x,tp,z,.3))continue;L.push(this.add(x,tp,z,'g'));}
   cells[j*(nxs+1)+i]=L;}
  const D=[[1,0],[0,1],[1,1],[1,-1]];
  for(let j=0;j<=nzs;j++)for(let i=0;i<=nxs;i++){const A=cells[j*(nxs+1)+i];if(!A.length)continue;for(const[di,dj]of D){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>nxs||jj>nzs)continue;const Bn=cells[jj*(nxs+1)+ii];for(const a of A)for(const b of Bn){if(Math.abs(a.y-b.y)>1.6)continue;if(this.walkClear(a,b)&&this.walkClear(b,a))this.link(a,b);}}}
  // explicit elevated paths (wall walks, tower tops) and ladders
  const ex=[];
  for(const path of extra.paths||[]){let prev=null;for(let k=0;k<path.length;k++){const p=path[k];if(prev){const d=Math.hypot(p[0]-prev[0],p[2]-prev[2]),n=Math.max(1,Math.round(d/2.5));let last=ex[ex.length-1];for(let s=1;s<=n;s++){const t=s/n;const nd=this.add(prev[0]+(p[0]-prev[0])*t,prev[1]+(p[1]-prev[1])*t,prev[2]+(p[2]-prev[2])*t,'e');this.link(last,nd);ex.push(nd);last=nd;}}else ex.push(this.add(p[0],p[1],p[2],'e'));prev=p;}}
  for(const a of ex){for(const b of this.around(a.x,a.z,4)){if(a===b||a.e.some(e=>e[0]===b))continue;const dy=b.y-a.y,dh=Math.hypot(a.x-b.x,a.z-b.z);
    if(Math.abs(dy)<.9&&dh<3.6){if(this.walkClear(a,b)&&this.walkClear(b,a))this.link(a,b);}
    else if(dy<-1.2&&dy>-9&&dh<4.2&&dh>.8&&b.tag==='g'&&this.dropClear(a,b))this.link(a,b,'drop',true);}}
  for(const l of extra.ladders||[]){const bot=this.nearest(l.bx,l.by,l.bz,6),top=this.nearest(l.tx,l.ty,l.tz,4);if(!bot||!top)continue;const nb=this.add(l.bx,l.by,l.bz,'lb'),nt=this.add(l.tx,l.ty,l.tz,'lt');this.link(bot,nb);this.link(nt,top);this.link(nb,nt,'ladder',true);this.link(nt,nb,'drop',true);nb.ladder=l.ref;}
  this.comps();}
 around(x,z,r){const out=[];const c=this.cell;for(let i=Math.floor((x-r)/c);i<=Math.floor((x+r)/c);i++)for(let j=Math.floor((z-r)/c);j<=Math.floor((z+r)/c);j++){const l=this.grid.get((i+512)*4096+j+512);if(l)for(const n of l)if(Math.hypot(n.x-x,n.z-z)<=r)out.push(n);}return out;}
 nearest(x,y,z,r=6,reach){let best=null,bd=1e9;for(const n of this.around(x,z,r)){if(!n.e.length)continue;const d=Math.hypot(n.x-x,(n.y-y)*2.5,n.z-z);if(d<bd){bd=d;best=n;}}if(!best&&r<20)return this.nearest(x,y,z,r*2);return best;}
 comps(){let c=0;for(const n of this.nodes)n.c=-1;for(const n of this.nodes){if(n.c>=0)continue;const st=[n];n.c=c;while(st.length){const a=st.pop();for(const[b]of a.e)if(b.c<0){b.c=c;st.push(b);}}c++;}}
 path(from,to){if(!from||!to)return null;if(from===to)return[to];const N=this.nodes.length;if(!this.g||this.g.length!==N){this.g=new Float32Array(N);this.f=new Float32Array(N);this.par=new Int32Array(N);this.seen=new Int32Array(N);this.run=0;}
  const run=++this.run,g=this.g,par=this.par,seen=this.seen;const h=n=>Math.hypot(n.x-to.x,n.y-to.y,n.z-to.z);
  const heap=[];const push=n=>{heap.push(n);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(this.f[heap[p].i]<=this.f[n.i])break;heap[i]=heap[p];i=p;}heap[i]=n;};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let i=0;const n=heap.length;for(;;){let l=i*2+1,r=l+1,m=i;if(l<n&&this.f[heap[l].i]<this.f[last.i])m=l;if(r<n&&this.f[heap[r].i]<this.f[m===i?last.i:heap[m].i])m=r;if(m===i)break;heap[i]=heap[m];i=m;}heap[i]=last;}return top;};
  seen[from.i]=run;g[from.i]=0;par[from.i]=-1;this.f[from.i]=h(from);push(from);let it=0;
  while(heap.length&&it++<6000){const a=pop();if(a===to){const out=[];let n=a.i;while(n>=0){out.push(this.nodes[n]);n=par[n];}return out.reverse();}
   for(const[b,c]of a.e){const ng=g[a.i]+c;if(seen[b.i]===run&&ng>=g[b.i])continue;seen[b.i]=run;g[b.i]=ng;par[b.i]=a.i;this.f[b.i]=ng+h(b);push(b);}}
  return null;}
 edge(a,b){for(const e of a.e)if(e[0]===b)return e;return null;}}
