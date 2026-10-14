// DROPZONE — world core: box collision world on a uniform grid (move / ground / raycast), 1 m ground navigation grid + A*, merged-geometry builder.
import * as THREE from '../vendor/three.module.min.js';

export const LAND=312,STEP=.45,WATER=-.7;
// collision grid covers the island plus the off-shore gulag arena (x 380..460)
const CS=4,GX0=-344,GZ0=-344,GW=206,GH=172;

/* ================= collision world =================
 flags: 1 = blocks movement, 2 = blocks bullets + sight */
export class World{
 constructor(){this.b=[];this.n=0;}
 add(x0,y0,z0,x1,y1,z1,flags=3,mat=0){if(x0>x1)[x0,x1]=[x1,x0];if(y0>y1)[y0,y1]=[y1,y0];if(z0>z1)[z0,z1]=[z1,z0];this.b.push([x0,y0,z0,x1,y1,z1,flags,mat]);return this.n++;}
 finalize(){const n=this.n;this.B=new Float32Array(n*6);this.F=new Uint8Array(n);this.M=new Uint8Array(n);this.on=new Uint8Array(n).fill(1);this.stamp=new Uint32Array(n);this.st=1;
  const cnt=new Int32Array(GW*GH+1);const span=(b)=>[Math.max(0,Math.floor((b[0]-GX0)/CS)),Math.min(GW-1,Math.floor((b[3]-GX0)/CS)),Math.max(0,Math.floor((b[2]-GZ0)/CS)),Math.min(GH-1,Math.floor((b[5]-GZ0)/CS))];
  this.b.forEach((b,i)=>{for(let k=0;k<6;k++)this.B[i*6+k]=b[k];this.F[i]=b[6];this.M[i]=b[7];const[x0,x1,z0,z1]=span(b);for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)cnt[z*GW+x]++;});
  this.cs=new Int32Array(GW*GH+1);let t=0;for(let i=0;i<GW*GH;i++){this.cs[i]=t;t+=cnt[i];}this.cs[GW*GH]=t;this.cl=new Int32Array(t);const fill=this.cs.slice();
  this.b.forEach((b,i)=>{const[x0,x1,z0,z1]=span(b);for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)this.cl[fill[z*GW+x]++]=i;});this.raw=this.b;this.b=null;}
 query(x0,z0,x1,z1,fn){const cx0=Math.max(0,Math.floor((x0-GX0)/CS)),cx1=Math.min(GW-1,Math.floor((x1-GX0)/CS)),cz0=Math.max(0,Math.floor((z0-GZ0)/CS)),cz1=Math.min(GH-1,Math.floor((z1-GZ0)/CS));const st=++this.st;
  for(let z=cz0;z<=cz1;z++)for(let x=cx0;x<=cx1;x++){const c=z*GW+x;for(let k=this.cs[c];k<this.cs[c+1];k++){const i=this.cl[k];if(this.stamp[i]===st)continue;this.stamp[i]=st;if(this.on[i])fn(i);}}}
 // highest walkable surface at or below ytop under a circle (ground plane y=0)
 groundAt(x,z,ytop,r=.25){let g=0;const B=this.B;this.query(x-r,z-r,x+r,z+r,i=>{if(!(this.F[i]&1))return;const o=i*6,top=B[o+4];if(top>ytop||top<=g)return;if(x+r<B[o]||x-r>B[o+3]||z+r<B[o+2]||z-r>B[o+5])return;g=top;});return g;}
 // under a roof? (any bullet-blocking box above y within r)
 roofed(x,z,y){let hit=false;const B=this.B;this.query(x-.1,z-.1,x+.1,z+.1,i=>{if(hit||!(this.F[i]&2))return;const o=i*6;if(B[o+1]>y+1.6&&x>=B[o]&&x<=B[o+3]&&z>=B[o+2]&&z<=B[o+5])hit=true;});return hit;}
 surfAt(x,z,y){let m=-1;const B=this.B;this.query(x-.1,z-.1,x+.1,z+.1,i=>{const o=i*6;if(Math.abs(B[o+4]-y)<.08&&x>=B[o]&&x<=B[o+3]&&z>=B[o+2]&&z<=B[o+5])m=this.M[i];});return m<0?3:m;}
 // capsule-ish move: p = feet, v velocity; returns {ground, wall, g}
 move(p,v,dt,r,h,onGround,bound=LAND){const ox=p.x,oz=p.z;p.x+=v.x*dt;p.z+=v.z*dt;const B=this.B;let wall=false;
  for(let it=0;it<3;it++){let pushed=false;this.query(p.x-r,p.z-r,p.x+r,p.z+r,i=>{if(!(this.F[i]&1))return;const o=i*6;if(B[o+4]<=p.y+STEP||B[o+1]>=p.y+h)return;
    const cx=p.x<B[o]?B[o]:p.x>B[o+3]?B[o+3]:p.x,cz=p.z<B[o+2]?B[o+2]:p.z>B[o+5]?B[o+5]:p.z;let dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;if(d2>=r*r)return;
    if(d2<1e-9){const px0=p.x-B[o],px1=B[o+3]-p.x,pz0=p.z-B[o+2],pz1=B[o+5]-p.z,m=Math.min(px0,px1,pz0,pz1);if(m===px0)p.x=B[o]-r;else if(m===px1)p.x=B[o+3]+r;else if(m===pz0)p.z=B[o+2]-r;else p.z=B[o+5]+r;}
    else{const d=Math.sqrt(d2),k=(r-d)/d;p.x+=dx*k;p.z+=dz*k;}pushed=true;wall=true;});if(!pushed)break;}
  if(bound){if(p.x<380){p.x=Math.max(-bound,Math.min(bound,p.x));}p.z=Math.max(-bound,Math.min(bound,p.z));}
  const g0=this.groundAt(p.x,p.z,p.y+STEP,r*.75);p.y+=v.y*dt;let ground=false;
  if(v.y>0){let ceil=false;this.query(p.x-r*.7,p.z-r*.7,p.x+r*.7,p.z+r*.7,i=>{if(!(this.F[i]&1))return;const o=i*6;if(B[o+1]>p.y+h-.25&&B[o+1]<p.y+h+.05&&p.x+r*.7>B[o]&&p.x-r*.7<B[o+3]&&p.z+r*.7>B[o+2]&&p.z-r*.7<B[o+5])ceil=true;});if(ceil)v.y=0;}
  if(p.y<=g0){p.y=g0;if(v.y<0)v.y=0;ground=true;}else if(onGround&&v.y<=0&&p.y-g0<STEP+.05){p.y=g0;v.y=0;ground=true;}
  return{ground,wall,g:g0};}
 // ray vs boxes (mask flags) + ground plane; returns t or Infinity; fills out {t,i,nx,ny,nz,mat}
 ray(ox,oy,oz,dx,dy,dz,maxT,mask=2,out){const B=this.B;let best=maxT,bi=-1,bn=0;
  let cx=Math.floor((ox-GX0)/CS),cz=Math.floor((oz-GZ0)/CS);const sx=dx>0?1:-1,sz=dz>0?1:-1;const idx=Math.abs(dx)>1e-9?1/dx:1e9,idz=Math.abs(dz)>1e-9?1/dz:1e9,iy=Math.abs(dy)>1e-9?1/dy:1e9;
  let tmx=Math.abs(dx)>1e-9?((GX0+(cx+(sx>0?1:0))*CS)-ox)*idx:1e9,tmz=Math.abs(dz)>1e-9?((GZ0+(cz+(sz>0?1:0))*CS)-oz)*idz:1e9;const tdx=Math.abs(CS*idx),tdz=Math.abs(CS*idz);const st=++this.st;
  for(let guard=0;guard<500;guard++){if(cx>=0&&cx<GW&&cz>=0&&cz<GH){const c=cz*GW+cx;for(let k=this.cs[c];k<this.cs[c+1];k++){const i=this.cl[k];if(this.stamp[i]===st)continue;this.stamp[i]=st;if(!this.on[i]||!(this.F[i]&mask))continue;const o=i*6;
     let tn=-1e9,tf=1e9,ax=0;let a=(B[o]-ox)*idx,b=(B[o+3]-ox)*idx;if(a>b){const q=a;a=b;b=q;}if(a>tn){tn=a;ax=0;}if(b<tf)tf=b;
     a=(B[o+1]-oy)*iy;b=(B[o+4]-oy)*iy;if(a>b){const q=a;a=b;b=q;}if(a>tn){tn=a;ax=1;}if(b<tf)tf=b;
     a=(B[o+2]-oz)*idz;b=(B[o+5]-oz)*idz;if(a>b){const q=a;a=b;b=q;}if(a>tn){tn=a;ax=2;}if(b<tf)tf=b;
     if(tn<=tf&&tf>0&&tn<best){best=Math.max(0,tn);bi=i;bn=ax;}}}
   const tn=Math.min(tmx,tmz);if(tn>=best||tn>maxT)break;if(tmx<tmz){tmx+=tdx;cx+=sx;}else{tmz+=tdz;cz+=sz;}if(cx<-1||cx>GW||cz<-1||cz>GH)break;}
  // ground plane
  if(dy<-1e-6&&oy>0){const tg=-oy*iy;if(tg<best&&tg<maxT){if(out){out.t=tg;out.i=-1;out.nx=0;out.ny=1;out.nz=0;out.mat=3;}return tg;}}
  if(bi<0){if(out){out.t=Infinity;out.i=-1;}return Infinity;}
  if(out){out.t=best;out.i=bi;out.nx=bn===0?-Math.sign(dx):0;out.ny=bn===1?-Math.sign(dy):0;out.nz=bn===2?-Math.sign(dz):0;out.mat=this.M[bi];}return best;}
 los(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az,d=Math.hypot(dx,dy,dz);if(d<.01)return true;return this.ray(ax,ay,az,dx/d,dy/d,dz/d,d-.05,2)===Infinity;}
}

/* ================= navigation grid (1 m, ground level) =================
 thin walls (<.4 m) also block the cell their centre line runs through, so no wall can slip between two cell centres */
export const NH=320,NN=NH*2;
export class Nav{
 constructor(world,blockers=[]){const N=this.N=NN,off=NH;this.w=world;this.blk=new Uint8Array(N*N);const B=world.B;
  for(let i=0;i<world.n;i++){if(!(world.F[i]&1))continue;const o=i*6;if(B[o+1]>=1.75||B[o+4]<=STEP)continue;const r=.34,tx=B[o+3]-B[o]<.4?Math.floor((B[o]+B[o+3])/2+off):-1,tz=B[o+5]-B[o+2]<.4?Math.floor((B[o+2]+B[o+5])/2+off):-1;const i0=Math.max(0,Math.floor(B[o]-r+off)),i1=Math.min(N-1,Math.floor(B[o+3]+r+off)),j0=Math.max(0,Math.floor(B[o+2]-r+off)),j1=Math.min(N-1,Math.floor(B[o+5]+r+off));
   for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++){const cx=k-off+.5,cz=j-off+.5;if((k===tx||cx>B[o]-r&&cx<B[o+3]+r)&&(j===tz||cz>B[o+2]-r&&cz<B[o+5]+r))this.blk[j*N+k]=1;}}
  for(const b of blockers)for(let j=Math.max(0,Math.floor(b[1]+off));j<=Math.min(N-1,Math.floor(b[3]+off));j++)for(let k=Math.max(0,Math.floor(b[0]+off));k<=Math.min(N-1,Math.floor(b[2]+off));k++)this.blk[j*N+k]=1;
  const L=LAND-2;for(let j=0;j<N;j++)for(let k=0;k<N;k++){const x=k-off+.5,z=j-off+.5;if(Math.abs(x)>L||Math.abs(z)>L)this.blk[j*N+k]=1;}
  this.g=new Float32Array(N*N);this.par=new Int32Array(N*N);this.stamp=new Uint32Array(N*N);this.cstamp=new Uint32Array(N*N);this.gen=1;this.heap=new Int32Array(N*N);this.hf=new Float32Array(N*N);this.bridge();}
 // rooms the 1 m grid seals off (a door next to furniture can leave no 8-connected way in): unblock a short straight run of cells from each pocket to the
 // main area wherever a bot-width corridor is clear of movement boxes, so every reachable floor stays reachable on the grid
 bridge(){const N=this.N,blk=this.blk,W=this.w,lab=new Int32Array(N*N).fill(-1),q=new Int32Array(N*N),sz=[];
  const fill=(s0,id)=>{let h=0,t=0;q[t++]=s0;lab[s0]=id;while(h<t){const c=q[h++],ci=c%N,cj=c/N|0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N||nj>=N)continue;const k=nj*N+ni;if(blk[k]||lab[k]>=0)continue;if(di&&dj&&(blk[cj*N+ni]||blk[nj*N+ci]))continue;lab[k]=id;q[t++]=k;}}return t;};
  for(let c=0;c<N*N;c++)if(!blk[c]&&lab[c]<0)sz.push(fill(c,sz.length));if(sz.length<2)return;let main=0;sz.forEach((v,i)=>{if(v>sz[main])main=i;});
  const clear=(ax,az,bx,bz)=>{const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),ux=dx/l,uz=dz/l;for(const o of[-.3,0,.3])for(const y of[.6,1.3])if(W.ray(ax-uz*o,y,az+ux*o,ux,0,uz,l,1)!==Infinity)return false;return true;};
  const done=new Set([main]);for(let c=0;c<N*N;c++){const id=lab[c];if(id<0||done.has(id))continue;const ci=c%N,cj=c/N|0;
   for(let dj=-3;dj<=3&&!done.has(id);dj++)for(let di=-3;di<=3;di++){const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N||nj>=N)continue;const k=nj*N+ni;if(lab[k]!==main)continue;const[ax,az]=this.pt(c),[bx,bz]=this.pt(k);if(!clear(ax,az,bx,bz))continue;
    let pi=ci,pj=cj;const n=Math.max(Math.abs(di),Math.abs(dj))*4;for(let m=1;m<=n;m++){const i=Math.floor(ax+(bx-ax)*m/n+NH),j=Math.floor(az+(bz-az)*m/n+NH);if(i!==pi&&j!==pj)blk[j*N+pi]=0;blk[j*N+i]=0;pi=i;pj=j;}done.add(id);break;}}}
 cell(x,z){const N=this.N,i=Math.floor(x+NH),j=Math.floor(z+NH);return(i<0||j<0||i>=N||j>=N)?-1:j*N+i;}
 free(x,z){const c=this.cell(x,z);return c>=0&&!this.blk[c];}
 nearestFree(x,z,R=14){const N=this.N;let i=Math.floor(x+NH),j=Math.floor(z+NH);for(let r=0;r<R;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const a=i+di,b=j+dj;if(a>0&&b>0&&a<N-1&&b<N-1&&!this.blk[b*N+a])return b*N+a;}return -1;}
 pt(c){return[c%this.N-NH+.5,(c/this.N|0)-NH+.5];}
 walkable(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),n=Math.ceil(l/.4);for(let k=1;k<=n;k++){const t=k/n;if(!this.free(ax+dx*t,az+dz*t))return false;}return true;}
 // A* (octile) with string pulling -> [[x,z],...] or null
 path(sx,sz,tx,tz,maxIter=9000){const N=this.N;let s=this.cell(sx,sz),t=this.cell(tx,tz);if(s<0||this.blk[s])s=this.nearestFree(sx,sz);if(t<0||this.blk[t])t=this.nearestFree(tx,tz);if(s<0||t<0)return null;
  const gen=++this.gen,g=this.g,par=this.par,st=this.stamp,cs=this.cstamp,H=this.heap,F=this.hf;let hn=0;const ti=t%N,tj=t/N|0;
  const h=c=>{const dx=Math.abs(c%N-ti),dz=Math.abs((c/N|0)-tj);return(Math.max(dx,dz)+.414*Math.min(dx,dz))*1.08;};
  const push=(c,f)=>{if(hn>=H.length)return;let k=hn++;while(k>0){const p=(k-1)>>1;if(F[p]<=f)break;H[k]=H[p];F[k]=F[p];k=p;}H[k]=c;F[k]=f;};
  const pop=()=>{const top=H[0],lc=H[--hn],lf=F[hn];let k=0;for(;;){let c=2*k+1;if(c>=hn)break;if(c+1<hn&&F[c+1]<F[c])c++;if(F[c]>=lf)break;H[k]=H[c];F[k]=F[c];k=c;}H[k]=lc;F[k]=lf;return top;};
  g[s]=0;st[s]=gen;par[s]=-1;push(s,h(s));let it=0,found=false,best=s,bh=h(s);
  while(hn>0&&it++<maxIter){const c=pop();if(c===t){found=true;break;}if(cs[c]===gen)continue;cs[c]=gen;const hc=h(c);if(hc<bh){bh=hc;best=c;}const ci=c%N,cj=c/N|0;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N||nj>=N)continue;const k=nj*N+ni;if(this.blk[k]||cs[k]===gen)continue;
    if(di&&dj&&(this.blk[cj*N+ni]||this.blk[nj*N+ci]))continue;const ng=g[c]+(di&&dj?1.414:1);if(st[k]!==gen||ng<g[k]){st[k]=gen;g[k]=ng;par[k]=c;push(k,ng+h(k));}}}
  // partial path toward the closest node reached when the search budget runs out
  const end=found?t:best;if(end===s)return null;const pts=[];for(let c=end;c>=0;c=par[c])pts.push(this.pt(c));pts.reverse();
  const out=[];let a=0,cur=[sx,sz];while(a<pts.length-1){let b=pts.length-1;while(b>a+1&&!this.walkable(cur[0],cur[1],pts[b][0],pts[b][1]))b--;out.push(pts[b]);cur=pts[b];a=b;}
  if(!out.length)out.push(pts[pts.length-1]);out.partial=!found;return out;}
 randomNear(x,z,r,rnd=Math.random){for(let k=0;k<24;k++){const a=rnd()*Math.PI*2,d=rnd()*r;const px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;if(this.free(px,pz))return[px,pz];}const c=this.nearestFree(x,z,20);return c>=0?this.pt(c):null;}
}

/* ================= merged geometry builder (chunked by material) ================= */
const CH=80;
export class Geo{
 constructor(){this.k={};this.uvs={};}
 bucket(mat,cx,cz){const key=mat+'|'+Math.floor((cx+400)/CH)+','+Math.floor((cz+400)/CH);return this.k[key]||(this.k[key]={mat,p:[],n:[],u:[],c:[]});}
 quad(B,a,b,c,d,n,ua,ub,uc,ud,col){const P=B.p,N=B.n,U=B.u,C=B.c;for(const[v,uv,cc]of[[a,ua,col[0]],[b,ub,col[1]],[c,uc,col[2]],[a,ua,col[0]],[c,uc,col[2]],[d,ud,col[3]]]){P.push(v[0],v[1],v[2]);N.push(n[0],n[1],n[2]);U.push(uv[0],uv[1]);C.push(cc[0],cc[1],cc[2]);}}
 // box; o: {rot:[rx,ry,rz] | m: Matrix4, s: uv metres per tile, su/sv: separate uv scales, ind: tint multiplier, ao: bottom darkening, skip:{px,nx,py,ny,pz,nz}, v0: v offset}
 box(x0,y0,z0,x1,y1,z1,mat,tint=0xffffff,o={}){if(x0>x1)[x0,x1]=[x1,x0];if(y0>y1)[y0,y1]=[y1,y0];if(z0>z1)[z0,z1]=[z1,z0];
  const cx=(x0+x1)/2,cy=(y0+y1)/2,cz=(z0+z1)/2,hx=(x1-x0)/2,hy=(y1-y0)/2,hz=(z1-z0)/2;const B=this.bucket(mat,cx,cz);const s=o.s||this.uvs[mat]||2,su=o.su||s,sv=o.sv||s;
  const col=new THREE.Color(tint);const ind=o.ind??1;const ao=o.ao??.72;
  let m=o.m||null;if(o.rot){m=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(o.rot[0],o.rot[1],o.rot[2],'YXZ'));}
  const V=(sx,sy,sz)=>{let x=sx*hx,y=sy*hy,z=sz*hz;if(m){const v=new THREE.Vector3(x,y,z).applyMatrix4(m);x=v.x;y=v.y;z=v.z;}return[cx+x,cy+y,cz+z];};
  const N=(nx,ny,nz)=>{if(!m)return[nx,ny,nz];const v=new THREE.Vector3(nx,ny,nz).transformDirection(m);return[v.x,v.y,v.z];};
  const cc=f=>[col.r*ind*f,col.g*ind*f,col.b*ind*f];const lo=cc(ao),hi=cc(1),bot=cc(.5);const sk=o.skip||{};const v0=o.v0||0;
  const X0=cx-hx,X1=cx+hx,Y0=cy-hy+v0,Y1=cy+hy+v0,Z0=cz-hz,Z1=cz+hz;
  if(!sk.px)this.quad(B,V(1,-1,1),V(1,-1,-1),V(1,1,-1),V(1,1,1),N(1,0,0),[-Z1/su,Y0/sv],[-Z0/su,Y0/sv],[-Z0/su,Y1/sv],[-Z1/su,Y1/sv],[lo,lo,hi,hi]);
  if(!sk.nx)this.quad(B,V(-1,-1,-1),V(-1,-1,1),V(-1,1,1),V(-1,1,-1),N(-1,0,0),[Z0/su,Y0/sv],[Z1/su,Y0/sv],[Z1/su,Y1/sv],[Z0/su,Y1/sv],[lo,lo,hi,hi]);
  if(!sk.pz)this.quad(B,V(-1,-1,1),V(1,-1,1),V(1,1,1),V(-1,1,1),N(0,0,1),[X0/su,Y0/sv],[X1/su,Y0/sv],[X1/su,Y1/sv],[X0/su,Y1/sv],[lo,lo,hi,hi]);
  if(!sk.nz)this.quad(B,V(1,-1,-1),V(-1,-1,-1),V(-1,1,-1),V(1,1,-1),N(0,0,-1),[-X1/su,Y0/sv],[-X0/su,Y0/sv],[-X0/su,Y1/sv],[-X1/su,Y1/sv],[lo,lo,hi,hi]);
  if(!sk.py)this.quad(B,V(-1,1,1),V(1,1,1),V(1,1,-1),V(-1,1,-1),N(0,1,0),[X0/s,-Z1/s],[X1/s,-Z1/s],[X1/s,-Z0/s],[X0/s,-Z0/s],[hi,hi,hi,hi]);
  if(!sk.ny)this.quad(B,V(-1,-1,-1),V(1,-1,-1),V(1,-1,1),V(-1,-1,1),N(0,-1,0),[X0/s,Z0/s],[X1/s,Z0/s],[X1/s,Z1/s],[X0/s,Z1/s],[bot,bot,bot,bot]);}
 cyl(x,y,z,r,h,mat,tint=0xffffff,seg=12,axis='y',o={}){const B=this.bucket(mat,x,z);const s=o.s||this.uvs[mat]||2;const col=new THREE.Color(tint),ind=o.ind??1,r2=o.r2??r;
  const P=(a,t,rr)=>{const c=Math.cos(a)*rr,d=Math.sin(a)*rr;if(axis==='y')return[x+c,y+t,z+d];if(axis==='x')return[x+t,y+c,z+d];return[x+c,y+d,z+t];};
  const Nn=a=>{const c=Math.cos(a),d=Math.sin(a);if(axis==='y')return[c,0,d];if(axis==='x')return[0,c,d];return[c,d,0];};
  const lo=[col.r*ind*.75,col.g*ind*.75,col.b*ind*.75],hi=[col.r*ind,col.g*ind,col.b*ind];const circ=2*Math.PI*r;
  for(let i=0;i<seg;i++){const a0=i/seg*Math.PI*2,a1=(i+1)/seg*Math.PI*2;const n=Nn((a0+a1)/2);this.quad(B,P(a0,0,r),P(a1,0,r),P(a1,h,r2),P(a0,h,r2),n,[i/seg*circ/s,0],[(i+1)/seg*circ/s,0],[(i+1)/seg*circ/s,h/s],[i/seg*circ/s,h/s],[lo,lo,hi,hi]);
   if(!o.open){const c0=P(0,h,0),c1=P(0,0,0);const up=axis==='y'?[0,1,0]:axis==='x'?[1,0,0]:[0,0,1];this.quad(B,c0,P(a0,h,r2),P(a1,h,r2),c0,up,[.5,.5],[.5+Math.cos(a0)*.5,.5+Math.sin(a0)*.5],[.5+Math.cos(a1)*.5,.5+Math.sin(a1)*.5],[.5,.5],[hi,hi,hi,hi]);
    this.quad(B,c1,P(a1,0,r),P(a0,0,r),c1,up.map(v=>-v),[.5,.5],[.5,.5],[.5,.5],[.5,.5],[lo,lo,lo,lo]);}}}
 beam(ax,ay,az,bx,by,bz,t,mat,tint,o={}){const d=new THREE.Vector3(bx-ax,by-ay,bz-az),L=d.length();d.normalize();const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d);const m=new THREE.Matrix4().makeRotationFromQuaternion(q);const cx=(ax+bx)/2,cy=(ay+by)/2,cz=(az+bz)/2;this.box(cx-t/2,cy-L/2,cz-(o.t2??t)/2,cx+t/2,cy+L/2,cz+(o.t2??t)/2,mat,tint,{...o,m});}
 build(mats,group,shadow=true){const out=[];for(const key in this.k){const b=this.k[key];if(!b.p.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.computeBoundingSphere();
  const m=new THREE.Mesh(g,mats[b.mat]);m.castShadow=shadow&&!mats[b.mat].userData.noShadow;m.receiveShadow=true;m.matrixAutoUpdate=false;m.updateMatrix();group.add(m);out.push(m);}this.k={};return out;}
}
