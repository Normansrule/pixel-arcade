// FRONTLINE OPS — level geometry: collision boxes, hitscan raycasts, nav grid + A*, cover points, and scene construction.
import * as THREE from '../vendor/three.module.min.js';

export const STEP=.5,MANTLE=1.3,BR=.38;
const V=THREE.Vector3;
// prop footprints [w (x), h, d (z)] at rot 0; vehicles face +z
export const PROPS={crate:[1.2,1.2,1.2],crateS:[.8,.8,.8],crateL:[2.2,1.1,1.1],barrel:[.62,.92,.62],truck:[2.5,3.1,7.4],jeep:[2.1,1.9,4.6],car:[1.85,1.45,4.4],wreck:[1.85,1.3,4.4],tanker:[2.5,3,8],
 tree:[.5,7,.5],pine:[.5,8,.5],rock:[1.6,1.1,1.6],lamp:[.25,5.5,.25],bush:[0,0,0],stall:[2.6,.95,1.6],dumpster:[1.9,1.4,1.2],heli:[0,0,0],gen:[2.2,1.5,1.2],dish:[1.6,3,1.6]};

export class Level{
 constructor(o){Object.assign(this,{boxes:[],props:[],lamps:[],roads:[],pads:[],windows:[],spawns:{a:[],b:[]},pts:{},grass:[],noGrass:[],decor:[]},o);}
 // axis aligned box from corners; o: {y0, mat, solid, col, top(no top face)}
 box(x0,z0,x1,z1,h,o={}){if(x0>x1)[x0,x1]=[x1,x0];if(z0>z1)[z0,z1]=[z1,z0];const y0=o.y0||0;const b={x0,y0,z0,x1,y1:y0+h,z1,mat:o.mat||'concrete',solid:o.solid!==false,col:o.col||null,vis:o.vis!==false};this.boxes.push(b);return b;}
 boxC(cx,cz,w,d,h,o){return this.box(cx-w/2,cz-d/2,cx+w/2,cz+d/2,h,o);}
 // wall segment along x or z from (x0,z0) to (x1,z1) with thickness t
 wall(x0,z0,x1,z1,h,t=.3,o={}){if(Math.abs(z1-z0)<Math.abs(x1-x0))return this.box(x0,z0-t/2,x1,z0+t/2,h,o);return this.box(x0-t/2,z0,x0+t/2,z1,h,o);}
 // wall with door gaps: gaps = [[center offset along wall, width]]; adds lintel above gaps
 wallGaps(x0,z0,x1,z1,h,gaps=[],t=.3,o={},dh=2.3){const horiz=Math.abs(z1-z0)<Math.abs(x1-x0);const a=horiz?Math.min(x0,x1):Math.min(z0,z1),b=horiz?Math.max(x0,x1):Math.max(z0,z1);
  const gs=gaps.map(([c,w])=>[a+c-w/2,a+c+w/2]).sort((p,q)=>p[0]-q[0]);let cur=a;const seg=(s,e)=>{if(e-s<.05)return;horiz?this.wall(s,z0,e,z0,h,t,o):this.wall(x0,s,x0,e,h,t,o);};
  for(const[s,e]of gs){seg(cur,s);if(h>dh+.05)horiz?this.box(s,z0-t/2,e,z0+t/2,h-dh,{...o,y0:dh}):this.box(x0-t/2,s,x0+t/2,e,h-dh,{...o,y0:dh});cur=e;}seg(cur,b);}
 // building: walls with doors {n,s,e,w: [[offset,width],...]}, roof slab, lit windows
 building(x0,z0,x1,z1,h,o={}){const m=o.mat||'plaster',t=.3,d=o.doors||{},col=o.col||null,mo={mat:m,col};
  this.wallGaps(x0,z0,x1,z0,h,d.n||[],t,mo);this.wallGaps(x0,z1,x1,z1,h,d.s||[],t,mo);this.wallGaps(x0,z0,x0,z1,h,d.w||[],t,mo);this.wallGaps(x1,z0,x1,z1,h,d.e||[],t,mo);
  if(o.roof!==false){this.box(x0-.25,z0-.25,x1+.25,z1+.25,.35,{y0:h,mat:'roof'});if(o.parapet){const p=.55;this.box(x0-.25,z0-.25,x1+.25,z0+.05,p,{y0:h+.35,mat:m,col});this.box(x0-.25,z1-.05,x1+.25,z1+.25,p,{y0:h+.35,mat:m,col});this.box(x0-.25,z0,x0+.05,z1,p,{y0:h+.35,mat:m,col});this.box(x1-.05,z0,x1+.25,z1,p,{y0:h+.35,mat:m,col});}}
  this.box(x0+.15,z0+.15,x1-.15,z1-.15,.04,{mat:'tile',solid:false});
  // windows on long faces (visual)
  const lit=o.lit??.5,floors=Math.max(1,Math.floor(h/3));for(let f=0;f<floors;f++){const wy=1.25+f*3;if(wy+1.2>h)break;
   for(const[side,a0,a1]of[['n',x0,x1],['s',x0,x1],['w',z0,z1],['e',z0,z1]]){const len=a1-a0,n=Math.floor(len/3.2);for(let k=0;k<n;k++){const c=a0+(k+.5)*len/n;const gaps=d[side]||[];if(f===0&&gaps.some(([g,w])=>Math.abs(a0+g-c)<w/2+.9))continue;if(this.rnd()<.25)continue;
    this.windows.push({side,x:side==='w'?x0:side==='e'?x1:c,z:side==='n'?z0:side==='s'?z1:c,y:wy,lit:this.rnd()<lit});}}}
  if(o.light)this.lamps.push({x:(x0+x1)/2,y:h-.4,z:(z0+z1)/2,light:true,inside:true,col:o.lightCol||0xffc890});}
 prop(kind,x,z,rot=0,o={}){const q=Math.round(rot/(Math.PI/2))&3,f=PROPS[kind];let[w,h,d]=f;if(o.s){w*=o.s;h*=o.s;d*=o.s;}if(q&1)[w,d]=[d,w];const y0=o.y0||0;
  this.props.push({kind,x,z,y:y0,rot:q*Math.PI/2+(o.jit??0),col:o.col,s:o.s||1});if(w>0&&o.solid!==false)this.box(x-w/2,z-d/2,x+w/2,z+d/2,h,{y0,vis:false,mat:kind});}
 lamp(x,z,rot=0,light=true,col){this.lamps.push({x,z,rot,light,col});this.box(x-.12,z-.12,x+.12,z+.12,5.4,{vis:false,mat:'lamp'});}
 sandbags(x0,z0,x1,z1,h=1.05){return this.wall(x0,z0,x1,z1,h,.7,{mat:'sandbag'});}
 hesco(x0,z0,x1,z1,h=2.1){return this.wall(x0,z0,x1,z1,h,1.1,{mat:'hesco'});}
 container(cx,cz,rotZ,col,y0=0){const L=6.1,W=2.44,H=2.6;return rotZ?this.box(cx-W/2,cz-L/2,cx+W/2,cz+L/2,H,{y0,mat:'metal',col}):this.box(cx-L/2,cz-W/2,cx+L/2,cz+W/2,H,{y0,mat:'metal',col});}
 rnd(){this._s=((this._s||12345)*16807)%2147483647;return this._s/2147483647;}

 /* ---------- finalize: arrays for raycasts, nav grid, cover ---------- */
 finalize(){const S=this.boxes.filter(b=>b.solid);this.solid=S;const n=S.length,B=this.B=new Float32Array(n*6);S.forEach((b,i)=>B.set([b.x0,b.y0,b.z0,b.x1,b.y1,b.z1],i*6));
  const GS=this.GS=4,GN=this.GN=Math.ceil(this.half*2/GS);this.grid=Array.from({length:GN*GN},()=>[]);S.forEach((b,i)=>{const i0=Math.max(0,Math.floor((b.x0+this.half)/GS)),i1=Math.min(GN-1,Math.floor((b.x1+this.half)/GS)),j0=Math.max(0,Math.floor((b.z0+this.half)/GS)),j1=Math.min(GN-1,Math.floor((b.z1+this.half)/GS));for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++)this.grid[j*GN+k].push(i);});this.qs=new Uint32Array(n);this.qg=0;this.ql=[];
  const N=this.N=Math.ceil(this.half*2),off=this.half;this.blk=new Uint8Array(N*N);this.high=new Uint8Array(N*N);
  for(const b of S){if(b.y0>1.8||b.y1<.35)continue;const rx=Math.max(.31,(1.02-(b.x1-b.x0))/2),rz=Math.max(.31,(1.02-(b.z1-b.z0))/2);const i0=Math.max(0,Math.floor(b.x0-rx+off)),i1=Math.min(N-1,Math.floor(b.x1+rx+off)),j0=Math.max(0,Math.floor(b.z0-rz+off)),j1=Math.min(N-1,Math.floor(b.z1+rz+off));
   for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const cx=i-off+.5,cz=j-off+.5;if(cx>b.x0-rx&&cx<b.x1+rx&&cz>b.z0-rz&&cz<b.z1+rz){this.blk[j*N+i]=1;if(b.y1>1.0)this.high[j*N+i]=Math.max(this.high[j*N+i],b.y1>1.7?2:1);}}}
  for(let i=0;i<N;i++){this.blk[i]=this.blk[(N-1)*N+i]=this.blk[i*N]=this.blk[i*N+N-1]=1;}
  // cover points: free cells next to a tall obstacle
  this.cover=[];const D=[[1,0],[-1,0],[0,1],[0,-1]];for(let j=2;j<N-2;j+=1)for(let i=2;i<N-2;i+=1){if(this.blk[j*N+i])continue;for(const[di,dj]of D){const k=(j+dj)*N+i+di;if(this.blk[k]&&this.high[k]){this.cover.push({x:i-off+.5,z:j-off+.5,nx:di,nz:dj,tall:this.high[k]===2,owner:null});break;}}}
  this.g=new Float32Array(N*N);this.par=new Int32Array(N*N);this.stamp=new Uint32Array(N*N);this.cstamp=new Uint32Array(N*N);this.gen=1;this.heap=new Int32Array(N*N*2);this.hf=new Float32Array(N*N*2);}
 // unique solid-box indices whose cells overlap the square around (x,z)
 near(x,z,r){const GS=this.GS,GN=this.GN,h=this.half,out=this.ql;out.length=0;const g=++this.qg;const i0=Math.max(0,Math.floor((x-r+h)/GS)),i1=Math.min(GN-1,Math.floor((x+r+h)/GS)),j0=Math.max(0,Math.floor((z-r+h)/GS)),j1=Math.min(GN-1,Math.floor((z+r+h)/GS));
  for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++){const c=this.grid[j*GN+k];for(let m=0;m<c.length;m++){const i=c[m];if(this.qs[i]!==g){this.qs[i]=g;out.push(i);}}}return out;}
 cell(x,z){const N=this.N,i=Math.floor(x+this.half),j=Math.floor(z+this.half);return(i<0||j<0||i>=N||j>=N)?-1:j*N+i;}
 free(x,z){const c=this.cell(x,z);return c>=0&&!this.blk[c];}

 /* ---------- raycast (hitscan / LOS) ---------- */
 // returns t of first hit (or Infinity); fills out.n with the face normal
 ray(ox,oy,oz,dx,dy,dz,maxT,out){if(Math.abs(dx)<1e-7)dx=1e-7;if(Math.abs(dy)<1e-7)dy=1e-7;if(Math.abs(dz)<1e-7)dz=1e-7;const B=this.B,n=B.length/6;let best=maxT,ax=-1,sg=0,bi=-1;const ix=1/dx,iy=1/dy,iz=1/dz;
  if(dy<-1e-6){const t=-oy/dy;if(t<best){best=t;ax=1;sg=1;bi=-2;}}
  for(let i=0;i<n;i++){const k=i*6;let t1=(B[k]-ox)*ix,t2=(B[k+3]-ox)*ix,tmin,tmax,a=0,s;if(t1<t2){tmin=t1;tmax=t2;s=-1;}else{tmin=t2;tmax=t1;s=1;}
   t1=(B[k+1]-oy)*iy;t2=(B[k+4]-oy)*iy;if(t1>t2){const q=t1;t1=t2;t2=q;if(t1>tmin){tmin=t1;a=1;s=1;}}else if(t1>tmin){tmin=t1;a=1;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax)continue;
   t1=(B[k+2]-oz)*iz;t2=(B[k+5]-oz)*iz;if(t1>t2){const q=t1;t1=t2;t2=q;if(t1>tmin){tmin=t1;a=2;s=1;}}else if(t1>tmin){tmin=t1;a=2;s=-1;}if(t2<tmax)tmax=t2;if(tmin>tmax||tmax<0)continue;
   if(tmin<0)continue;if(tmin<best){best=tmin;ax=a;sg=s;bi=i;}}
  if(out){out.t=best;out.i=bi;out.n.set(ax===0?sg:0,ax===1?sg:0,ax===2?sg:0);}return best<maxT?best:Infinity;}
 los(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz);if(l<1e-4)return true;return this.ray(a.x,a.y,a.z,dx/l,dy/l,dz/l,l-.05)===Infinity;}

 /* ---------- character collision ---------- */
 ground(x,z,feet,r=.25){let g=0;const B=this.B,L=this.near(x,z,r+.1);for(let q=0;q<L.length;q++){const k=L[q]*6;if(B[k+4]>feet+STEP||B[k+4]<=g)continue;if(x+r<B[k]||x-r>B[k+3]||z+r<B[k+2]||z-r>B[k+5])continue;g=B[k+4];}return g;}
 // push circle out of boxes spanning [feet+STEP, feet+h]; returns true if touched a wall
 collide(p,r,h){const B=this.B,L=this.near(p.x,p.z,r+.6).slice();let hit=false;for(let pass=0;pass<2;pass++)for(let q=0;q<L.length;q++){const k=L[q]*6;if(B[k+4]<=p.y+STEP||B[k+1]>=p.y+h)continue;
   const cx=Math.max(B[k],Math.min(p.x,B[k+3])),cz=Math.max(B[k+2],Math.min(p.z,B[k+5]));let dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;if(d2>=r*r)continue;hit=true;
   if(d2>1e-8){const d=Math.sqrt(d2);p.x+=dx/d*(r-d);p.z+=dz/d*(r-d);}else{const l=p.x-B[k],rr=B[k+3]-p.x,u=p.z-B[k+2],dd=B[k+5]-p.z,m=Math.min(l,rr,u,dd);if(m===l)p.x=B[k]-r;else if(m===rr)p.x=B[k+3]+r;else if(m===u)p.z=B[k+2]-r;else p.z=B[k+5]+r;}}
  const H=this.half-1;p.x=Math.max(-H,Math.min(H,p.x));p.z=Math.max(-H,Math.min(H,p.z));return hit;}
 // ledge in front of the player that can be mantled: returns top height or -1
 ledge(p,fx,fz,r){const B=this.B;const x=p.x+fx*(r+.45),z=p.z+fz*(r+.45);let top=-1;const L=this.near(x,z,.2).slice();
  for(let q=0;q<L.length;q++){const k=L[q]*6;if(x<B[k]-.05||x>B[k+3]+.05||z<B[k+2]-.05||z>B[k+5]+.05)continue;if(B[k+1]>p.y+.3)continue;const t=B[k+4];if(t>p.y+STEP&&t<=p.y+MANTLE)top=Math.max(top,t);else if(t>p.y+MANTLE)return -1;}
  if(top<0)return -1;// headroom check above ledge
  for(let q=0;q<L.length;q++){const k=L[q]*6;if(x<B[k]||x>B[k+3]||z<B[k+2]||z>B[k+5])continue;if(B[k+1]>=top-.01&&B[k+1]<top+1.8)return -1;}return top;}
 inside(x,y,z){const B=this.B,L=this.near(x,z,.05);for(let q=0;q<L.length;q++){const i=L[q],k=i*6;if(x>B[k]&&x<B[k+3]&&y>B[k+1]&&y<B[k+4]&&z>B[k+2]&&z<B[k+5])return i;}return -1;}

 /* ---------- A* on the nav grid ---------- */
 nearestFree(x,z){const N=this.N,off=this.half;let i=Math.floor(x+off),j=Math.floor(z+off);for(let r=0;r<12;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const a=i+di,b=j+dj;if(a>0&&b>0&&a<N-1&&b<N-1&&!this.blk[b*N+a])return b*N+a;}return -1;}
 walkable(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),n=Math.ceil(l/.4);for(let k=1;k<=n;k++){const t=k/n,x=ax+dx*t,z=az+dz*t;if(!this.free(x,z))return false;}return true;}
 path(sx,sz,tx,tz,maxIter=6000){const N=this.N,off=this.half;let s=this.cell(sx,sz),t=this.cell(tx,tz);if(s<0||this.blk[s])s=this.nearestFree(sx,sz);if(t<0||this.blk[t])t=this.nearestFree(tx,tz);if(s<0||t<0)return null;
  const gen=++this.gen,g=this.g,par=this.par,st=this.stamp,cs=this.cstamp,H=this.heap,F=this.hf;let hn=0;const ti=t%N,tj=t/N|0;
  const h=c=>{const dx=Math.abs(c%N-ti),dz=Math.abs((c/N|0)-tj);return Math.max(dx,dz)+.414*Math.min(dx,dz);};
  const push=(c,f)=>{let k=hn++;while(k>0){const p=(k-1)>>1;if(F[p]<=f)break;H[k]=H[p];F[k]=F[p];k=p;}H[k]=c;F[k]=f;};
  const pop=()=>{const top=H[0],lc=H[--hn],lf=F[hn];let k=0;for(;;){let c=2*k+1;if(c>=hn)break;if(c+1<hn&&F[c+1]<F[c])c++;if(F[c]>=lf)break;H[k]=H[c];F[k]=F[c];k=c;}H[k]=lc;F[k]=lf;return top;};
  g[s]=0;st[s]=gen;par[s]=-1;push(s,h(s));let it=0,found=false;
  while(hn>0&&it++<maxIter){const c=pop();if(c===t){found=true;break;}if(cs[c]===gen)continue;cs[c]=gen;const ci=c%N,cj=c/N|0;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N||nj>=N)continue;const k=nj*N+ni;if(this.blk[k]||cs[k]===gen)continue;
    if(di&&dj&&(this.blk[cj*N+ni]||this.blk[nj*N+ci]))continue;const ng=g[c]+(di&&dj?1.414:1);if(st[k]!==gen||ng<g[k]){st[k]=gen;g[k]=ng;par[k]=c;push(k,ng+h(k));}}}
  if(!found)return null;const pts=[];for(let c=t;c>=0;c=par[c])pts.push([c%N-off+.5,(c/N|0)-off+.5]);pts.reverse();
  // string pulling
  const out=[[sx,sz]];let a=0;const P=pts;while(a<P.length-1){let b=P.length-1;const[ax,az]=out[out.length-1];while(b>a+1&&!this.walkable(ax,az,P[b][0],P[b][1]))b--;out.push(P[b]);a=b;}
  out.shift();if(out.length)out[out.length-1]=[P[P.length-1][0],P[P.length-1][1]];return out;}
}

/* ================= scene construction ================= */
const MAT_UV={concrete:4,plaster:3.2,brick:2.6,metal:2.6,sandbag:1.4,hesco:2.2,roof:3,tile:2.4,wood:1.2,trim:1};
function boxGeoAppend(A,b,uvs){const{x0,y0,z0,x1,y1,z1}=b,c=b.col?new THREE.Color(b.col):new THREE.Color(1,1,1);const faces=[
  [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],'zy'],[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],'zy'],
  [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],'xz'],[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0],'xz'],
  [[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],'xy'],[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],'xy']];
 for(const f of faces){if(f[4][1]<0&&y0<=.01)continue;const base=A.p.length/3;for(let k=0;k<4;k++){const v=f[k];A.p.push(v[0],v[1],v[2]);A.n.push(...f[4]);const u=f[5]==='zy'?[v[2],v[1]]:f[5]==='xz'?[v[0],v[2]]:[v[0],v[1]];A.u.push(u[0]/uvs,u[1]/uvs);
  // fake AO: darken bottoms of walls
  const ao=f[4][1]===0?Math.min(1,.62+.38*Math.min(1,(v[1])/1.4)):1;A.c.push(c.r*ao,c.g*ao,c.b*ao);}A.i.push(base,base+1,base+2,base,base+2,base+3);}}
function toGeo(A){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(A.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(A.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(A.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(A.c,3));g.setIndex(A.i);g.computeBoundingSphere();return g;}
export function merge(list){// list of {geo, m:Matrix4}; returns non-indexed merged geometry with position/normal/uv
 const P=[],N=[],U=[];const nm=new THREE.Matrix3(),v=new V();for(const{geo,m}of list){const g=geo.index?geo.toNonIndexed():geo;const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;nm.getNormalMatrix(m);
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);U.push(u?u.getX(i):0,u?u.getY(i):0);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.computeBoundingSphere();return g;}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(rt,rb,h,s=12)=>new THREE.CylinderGeometry(rt,rb,h,s);
// vehicle templates: parts per material key
function vehicleParts(kind){const P={paint:[],dark:[],glass:[],lamp:[],canvas:[]};const wheel=(x,y,z,r=.45,w=.35)=>P.dark.push({geo:CY(r,r,w,14),m:M4(x,y,z,0,0,Math.PI/2)});
 if(kind==='truck'||kind==='tanker'){P.paint.push({geo:BX(2.4,1.5,2.3),m:M4(0,1.55,2.4)},{geo:BX(2.4,.5,1.2),m:M4(0,1.05,3.85)},{geo:BX(2.5,.35,7.2),m:M4(0,.85,0)});P.glass.push({geo:BX(2.2,.7,.05),m:M4(0,2.05,3.56,-.12)},{geo:BX(.05,.6,1.2),m:M4(1.21,2.0,2.6)},{geo:BX(.05,.6,1.2),m:M4(-1.21,2.0,2.6)});
  P.dark.push({geo:BX(2.3,.3,7),m:M4(0,.55,0)},{geo:BX(2.5,.25,.3),m:M4(0,.75,4.45)});P.lamp.push({geo:BX(.3,.2,.05),m:M4(.85,1.1,4.47)},{geo:BX(.3,.2,.05),m:M4(-.85,1.1,4.47)});
  if(kind==='truck'){P.paint.push({geo:BX(2.5,.6,4.6),m:M4(0,1.3,-1.2)});P.canvas.push({geo:BX(2.45,1.7,4.5),m:M4(0,2.4,-1.2)},{geo:CY(1.22,1.22,4.5,12,1),m:M4(0,3.1,-1.2,Math.PI/2,0,0,1,1,.35)});}
  else{P.paint.push({geo:CY(1.15,1.15,4.8,18),m:M4(0,2.1,-1.3,Math.PI/2)});P.dark.push({geo:CY(.3,.3,.4,10),m:M4(0,3.3,-1.3)});}
  for(const z of[3,-1.2,-2.6])for(const x of[-1.05,1.05])wheel(x,.5,z,.5,.4);}
 else if(kind==='jeep'){P.paint.push({geo:BX(2,.75,4.4),m:M4(0,.95,0)},{geo:BX(1.9,.25,1.5),m:M4(0,1.38,1.4,-.06)},{geo:BX(2,.45,1.6),m:M4(0,1.55,-.9)});P.dark.push({geo:BX(.08,.8,.08),m:M4(.9,1.85,.4)},{geo:BX(.08,.8,.08),m:M4(-.9,1.85,.4)},{geo:BX(1.9,.08,.08),m:M4(0,2.25,.4)},{geo:BX(2.05,.2,.2),m:M4(0,.75,2.25)},{geo:CY(.38,.38,.25,14),m:M4(0,1.2,-2.32,Math.PI/2)});
  P.glass.push({geo:BX(1.8,.5,.05),m:M4(0,1.75,.55,-.25)});P.lamp.push({geo:BX(.25,.18,.05),m:M4(.7,1.1,2.21)},{geo:BX(.25,.18,.05),m:M4(-.7,1.1,2.21)});for(const z of[1.45,-1.45])for(const x of[-.95,.95])wheel(x,.45,z,.45,.32);}
 else{// sedan / wreck
  P.paint.push({geo:BX(1.82,.62,4.3),m:M4(0,.68,0)},{geo:BX(1.6,.12,1.2),m:M4(0,1.0,1.45)},{geo:BX(1.6,.1,.9),m:M4(0,1.0,-1.6)},{geo:BX(1.55,.08,1.8),m:M4(0,1.42,-.25)});
  P.glass.push({geo:BX(1.5,.42,1.9),m:M4(0,1.2,-.25)},{geo:BX(1.45,.45,.05),m:M4(0,1.18,.75,-.6)},{geo:BX(1.45,.42,.05),m:M4(0,1.18,-1.25,.6)});P.dark.push({geo:BX(1.86,.18,4.36),m:M4(0,.42,0)});
  P.lamp.push({geo:BX(.3,.12,.05),m:M4(.6,.82,2.16)},{geo:BX(.3,.12,.05),m:M4(-.6,.82,2.16)});for(const z of[1.35,-1.35])for(const x of[-.85,.85])wheel(x,.36,z,.36,.24);}
 const out={};for(const k in P)if(P[k].length)out[k]=merge(P[k]);return out;}

export function buildScene(L,TX,q){L.timeU=L.timeU||{value:0};const G=new THREE.Group();const isN=L.sky==='night';
 const std=(o)=>new THREE.MeshStandardMaterial(o);
 const mats={concrete:std({...TX.concrete,roughness:.92,metalness:0,vertexColors:true}),plaster:std({...TX.plaster,roughness:.95,vertexColors:true}),brick:std({...TX.brick,roughness:.9,vertexColors:true}),
  metal:std({...TX.metal,roughness:.55,metalness:.45,vertexColors:true}),sandbag:std({...TX.sandbag,roughness:1,vertexColors:true}),hesco:std({...TX.hesco,roughness:1,vertexColors:true}),roof:std({...TX.roof,roughness:.9,vertexColors:true}),tile:std({...TX.tile,roughness:.7,vertexColors:true}),
  trim:std({color:0x2a2a2e,roughness:.6,metalness:.4,vertexColors:true}),wood:std({...TX.wood,roughness:.85,vertexColors:true})};
 for(const k in mats){const s=mats[k].normalMap;if(s)mats[k].normalScale=new THREE.Vector2(.9,.9);}
 // merged static boxes
 const acc={};for(const b of L.boxes){if(!b.vis)continue;const m=mats[b.mat]?b.mat:'concrete';(acc[m]=acc[m]||{p:[],n:[],u:[],c:[],i:[]});boxGeoAppend(acc[m],b,MAT_UV[m]||3);}
 for(const k in acc){const me=new THREE.Mesh(toGeo(acc[k]),mats[k]);me.castShadow=k!=='tile';me.receiveShadow=true;G.add(me);}
 // ground + roads + pads
 const ext=L.half*2+260;const gm=std({...TX.dirt,roughness:1,color:L.groundCol||0xffffff});gm.map=gm.map.clone();gm.normalMap=gm.normalMap.clone();gm.map.needsUpdate=gm.normalMap.needsUpdate=true;gm.map.repeat.set(ext/7,ext/7);gm.normalMap.repeat.set(ext/7,ext/7);
 const gr=new THREE.Mesh(new THREE.PlaneGeometry(ext,ext),gm);gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;G.add(gr);
 for(const r of L.roads){const len=r.len,w=r.w,t=(r.kind==='asphalt'?TX.asphalt:TX.road);const m=std({map:t.map.clone(),normalMap:t.normalMap.clone(),roughness:.85,polygonOffset:true,polygonOffsetFactor:-2});m.map.needsUpdate=m.normalMap.needsUpdate=true;
  if(r.kind==='asphalt'){m.map.repeat.set(w/6,len/6);m.normalMap.repeat.set(w/6,len/6);}else{m.map.repeat.set(1,len/w);m.normalMap.repeat.set(1,len/w);}
  const me=new THREE.Mesh(new THREE.PlaneGeometry(w,len),m);me.rotation.set(-Math.PI/2,0,r.rot||0);me.position.set(r.x,.02,r.z);me.receiveShadow=true;G.add(me);}
 for(const p of L.pads){const m=std({map:TX.pad,roughness:.8,polygonOffset:true,polygonOffsetFactor:-3});const me=new THREE.Mesh(new THREE.PlaneGeometry(p.r*2,p.r*2),m);me.rotation.x=-Math.PI/2;me.position.set(p.x,(p.y||0)+.03,p.z);me.receiveShadow=true;G.add(me);}
 // windows (lit + dark) as instanced quads
 {const lit=L.windows.filter(w=>w.lit),dark=L.windows.filter(w=>!w.lit);const geo=new THREE.PlaneGeometry(1.1,1.2);
  const mk=(list,mat)=>{if(!list.length)return;const im=new THREE.InstancedMesh(geo,mat,list.length);const m=new THREE.Matrix4(),qq=new THREE.Quaternion(),e=new THREE.Euler();list.forEach((w,i)=>{const r={n:Math.PI,s:0,w:-Math.PI/2,e:Math.PI/2}[w.side],o=.17;
   const x=w.x+(w.side==='w'?-o:w.side==='e'?o:0),z=w.z+(w.side==='n'?-o:w.side==='s'?o:0);m.compose(new V(x,w.y+.6,z),qq.setFromEuler(e.set(0,r,0)),new V(1,1,1));im.setMatrixAt(i,m);});G.add(im);};
  mk(lit,new THREE.MeshStandardMaterial({map:TX.win,color:0x111111,emissive:isN?0xffb060:0xffa050,emissiveMap:TX.win,emissiveIntensity:isN?1.6:.9,roughness:.3}));
  mk(dark,new THREE.MeshStandardMaterial({map:TX.win,color:0x2a3138,roughness:.15,metalness:.6}));}
 // instanced props
 const groups={};for(const p of L.props)(groups[p.kind]=groups[p.kind]||[]).push(p);
 const inst=(geo,mat,list,ymul=1,cast=true,fn)=>{const im=new THREE.InstancedMesh(geo,mat,list.length);const m=new THREE.Matrix4(),qq=new THREE.Quaternion(),e=new THREE.Euler(),c=new THREE.Color();
  list.forEach((p,i)=>{const s=p.s||1;if(fn)fn(p,m,i);else m.compose(new V(p.x,p.y,p.z),qq.setFromEuler(e.set(0,p.rot,0)),new V(s,s*ymul,s));im.setMatrixAt(i,m);if(p.col!=null){c.set(p.col);im.setColorAt(i,c);}});
  if(list.some(p=>p.col!=null)&&!im.instanceColor){}im.castShadow=cast;im.receiveShadow=true;G.add(im);return im;};
 const crateM=std({map:TX.wood.map,normalMap:TX.wood.normalMap,roughness:.85});
 for(const[k,s]of[['crate',1.2],['crateS',.8]])if(groups[k]){const g=BX(s,s,s);g.translate(0,s/2,0);inst(g,crateM,groups[k]);}
 if(groups.crateL){const g=BX(2.2,1.1,1.1);g.translate(0,.55,0);inst(g,std({map:TX.wood.map,color:0x7a8a5a,roughness:.8}),groups.crateL);}
 if(groups.barrel){const g=CY(.31,.31,.92,16);g.translate(0,.46,0);const bm=std({map:TX.barrel,roughness:.5,metalness:.5});inst(g,bm,groups.barrel.map(p=>({...p,col:p.col??0x5a6a4a})));}
 if(groups.dumpster){const g=BX(1.9,1.3,1.2);g.translate(0,.65,0);inst(g,std({map:TX.metal.map,color:0x2d5a3a,roughness:.6,metalness:.4}),groups.dumpster);}
 if(groups.gen){const g=merge([{geo:BX(2.2,1.2,1.2),m:M4(0,.6,0)},{geo:CY(.12,.12,1.2,8),m:M4(.7,1.6,0)},{geo:BX(.6,.4,.8),m:M4(-.6,1.4,0)}]);inst(g,std({color:0x6b6a3a,roughness:.6,metalness:.4}),groups.gen);}
 if(groups.stall){const tab=merge([{geo:BX(2.6,.08,1.6),m:M4(0,.9,0)},{geo:BX(.08,.9,.08),m:M4(1.2,.45,.7)},{geo:BX(.08,.9,.08),m:M4(-1.2,.45,.7)},{geo:BX(.08,.9,.08),m:M4(1.2,.45,-.7)},{geo:BX(.08,.9,.08),m:M4(-1.2,.45,-.7)},{geo:BX(.08,2.4,.08),m:M4(1.25,1.2,-.75)},{geo:BX(.08,2.4,.08),m:M4(-1.25,1.2,-.75)},{geo:BX(.08,2.1,.08),m:M4(1.25,1.05,.75)},{geo:BX(.08,2.1,.08),m:M4(-1.25,1.05,.75)}]);
  inst(tab,std({map:TX.wood.map,color:0x9a8060,roughness:.9}),groups.stall);const can=merge([{geo:BX(2.9,.05,2.1),m:M4(0,2.3,0,.25,0,0)}]);inst(can,std({color:0xffffff,roughness:.9,side:THREE.DoubleSide}),groups.stall.map((p,i)=>({...p,col:[0xb83a2a,0x2a6ab8,0xd8a030,0x3a8a4a,0xe8e0d0][i%5]})));
  const goods=merge([{geo:BX(.5,.3,.4),m:M4(-.7,1.09,0)},{geo:BX(.4,.25,.4),m:M4(.2,1.07,.2)},{geo:new THREE.SphereGeometry(.18,8,6),m:M4(.8,1.1,-.1)},{geo:new THREE.SphereGeometry(.15,8,6),m:M4(.55,1.08,.3)}]);inst(goods,std({color:0xffffff,roughness:.8}),groups.stall.map((p,i)=>({...p,col:[0xd8742a,0x8ab83a,0xc8302a,0xe8c040][i%4]})));}
 // vehicles
 const vm={paint:k=>std({color:0xffffff,roughness:k==='wreck'?.95:.45,metalness:k==='wreck'?.2:.5,map:k==='wreck'?TX.metal.map:null}),dark:()=>std({color:0x151618,roughness:.8}),glass:()=>std({color:0x0b1016,roughness:.08,metalness:.9}),lamp:()=>std({color:0x222222,emissive:isN?0xfff0c0:0x886644,emissiveIntensity:isN?2.5:1}),canvas:()=>std({color:0xffffff,map:TX.hesco.map,roughness:1})};
 for(const k of['truck','tanker','jeep','car','wreck'])if(groups[k]){const parts=vehicleParts(k);for(const pk in parts){if(k==='wreck'&&pk==='lamp')continue;const list=groups[k].map(p=>({...p,col:pk==='paint'||pk==='canvas'?(p.col??(k==='wreck'?0x3a2a22:k==='car'?0x8a8a90:0x4d5a3a)):null}));
  if(k==='wreck'&&pk==='glass')continue;inst(parts[pk],vm[pk](k),list.map(p=>pk==='canvas'?{...p,col:0x6a6a4a}:p));}}
 // trees, bushes, rocks
 if(groups.tree||groups.pine){const bark=std({map:TX.bark,roughness:1}),leaf=std({map:TX.leaf,roughness:.95,color:L.leafCol||0xffffff});
  if(groups.tree){const tr=merge([{geo:CY(.12,.22,4,7),m:M4(0,2,0)},{geo:CY(.05,.08,1.6,5),m:M4(.4,3.4,0,0,0,-.7)}]);inst(tr,bark,groups.tree);const cn=[];const ico=new THREE.IcosahedronGeometry(1,1);
   for(const[x,y,z,s]of[[0,4.6,0,1.9],[.9,4.1,.4,1.3],[-.8,4.3,-.3,1.4],[.2,5.6,-.2,1.2],[-.2,3.8,.8,1.1]])cn.push({geo:ico,m:M4(x,y,z,0,0,0,s,s*.85,s)});inst(merge(cn),leaf,groups.tree);}
  if(groups.pine){const tr=CY(.1,.2,3,6);tr.translate(0,1.5,0);inst(tr,bark,groups.pine);const cn=[];for(const[y,r,h]of[[2.4,1.7,2.6],[3.8,1.35,2.3],[5.1,1,2],[6.3,.6,1.6]])cn.push({geo:new THREE.ConeGeometry(r,h,9),m:M4(0,y,0)});inst(merge(cn),std({map:TX.leaf,color:0x8aa070,roughness:.95}),groups.pine);}}
 if(groups.bush){const g=new THREE.IcosahedronGeometry(1,1);const p=g.attributes.position;for(let i=0;i<p.count;i++){const s=.8+Math.sin(i*12.9)*.2;p.setXYZ(i,p.getX(i)*s,Math.max(-.3,p.getY(i))*s*.7,p.getZ(i)*s);}g.computeVertexNormals();g.translate(0,.35,0);inst(g,std({map:TX.leaf,roughness:.95,color:0xc0d0a0}),groups.bush,1,false);}
 if(groups.rock){const g=new THREE.IcosahedronGeometry(.9,1);const p=g.attributes.position;for(let i=0;i<p.count;i++){const s=.75+((Math.sin(i*7.1)+1)*.5)*.4;p.setXYZ(i,p.getX(i)*s,p.getY(i)*s*.7,p.getZ(i)*s);}g.computeVertexNormals();g.translate(0,.35,0);inst(g,std({...TX.concrete,color:0x8a8478,roughness:.95}),groups.rock);}
 if(groups.dish){const g=merge([{geo:CY(.12,.12,2,8),m:M4(0,1,0)},{geo:new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,.9),m:M4(0,2.3,0,-1,0,0,1,.45,1)}]);inst(g,std({color:0xcfd2d4,roughness:.4,metalness:.6,side:THREE.DoubleSide}),groups.dish);}
 // helicopter (static decor, used for exfil)
 if(groups.heli){const heli=makeHeli();for(const p of groups.heli){const h=heli.clone();h.position.set(p.x,p.y,p.z);h.rotation.y=p.rot;G.add(h);(L.helis=L.helis||[]).push(h);}}
 // lamps
 const lampList=L.lamps.filter(l=>!l.inside);if(lampList.length){const pole=merge([{geo:CY(.07,.1,5.4,8),m:M4(0,2.7,0)},{geo:BX(1.2,.08,.08),m:M4(.55,5.35,0)},{geo:BX(.45,.15,.3),m:M4(1.1,5.28,0)}]);
  inst(pole,std({color:0x2a2c30,roughness:.5,metalness:.7}),lampList.map(l=>({x:l.x,y:0,z:l.z,rot:l.rot||0})));
  const bulb=BX(.38,.04,.24);bulb.translate(1.1,5.2,0);inst(bulb,new THREE.MeshBasicMaterial({color:new THREE.Color(isN?6:3,isN?4.4:2.2,isN?2.2:1)}),lampList.map(l=>({x:l.x,y:0,z:l.z,rot:l.rot||0})),1,false);}
 // fake volumetric light cones under street lamps (additive, view-angle faded)
 if(lampList.length&&L.sky!=='dusk'){const cone=new THREE.CylinderGeometry(.12,1.7,5.1,20,1,true);cone.translate(0,-2.55,0);
  const cm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uC:{value:new THREE.Color(isN?0xffb070:0xffc890).multiplyScalar(isN?.16:.1)}},
   vertexShader:'varying float vY;varying vec3 vN,vV;void main(){vY=position.y;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
   fragmentShader:'uniform vec3 uC;varying float vY;varying vec3 vN,vV;void main(){float f=pow(abs(dot(vN,vV)),1.5);float h=smoothstep(-5.1,0.,vY);gl_FragColor=vec4(uC*f*h*h,1.);}'});
  inst(cone,cm,lampList.map(l=>{const a=l.rot||0;return{x:l.x+Math.cos(a)*1.1,y:5.2,z:l.z-Math.sin(a)*1.1,rot:0};}),1,false);}
 const lights=[];let nl=0;const maxL=q>=2?10:q===1?6:3;for(const l of L.lamps){if(!l.light||nl>=maxL)continue;nl++;const pl=new THREE.PointLight(l.col||0xffb36a,l.inside?14:isN?40:14,l.inside?12:22,1.7);
  const a=l.rot||0;pl.position.set(l.x+(l.inside?0:Math.cos(a)*1.1),l.inside?l.y:5,l.z-(l.inside?0:Math.sin(a)*1.1));G.add(pl);lights.push(pl);}
 // grass tufts
 if(q>0&&L.grass.length){const tufts=[];const geo=new THREE.PlaneGeometry(.6,.42);geo.translate(0,.21,0);const g2=geo.clone().rotateY(Math.PI/2);const cross=merge([{geo,m:new THREE.Matrix4()},{geo:g2,m:new THREE.Matrix4()}]);{const n=cross.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,0,1,0);}
  const nTot=q>=2?9000:4000;const area=L.grass.reduce((a,z)=>a+(z[2]-z[0])*(z[3]-z[1]),0);
  for(const z of L.grass){const n=Math.round(nTot*(z[2]-z[0])*(z[3]-z[1])/area);for(let i=0;i<n;i++){const x=z[0]+L.rnd()*(z[2]-z[0]),zz=z[1]+L.rnd()*(z[3]-z[1]);if(L.noGrass.some(r=>x>r[0]&&x<r[2]&&zz>r[1]&&zz<r[3]))continue;if(L.boxes.some(b=>b.solid&&x>b.x0-.3&&x<b.x1+.3&&zz>b.z0-.3&&zz<b.z1+.3))continue;tufts.push({x,y:0,z:zz,rot:L.rnd()*3,s:.6+L.rnd()*.8});}}
  const gmat=new THREE.MeshStandardMaterial({map:TX.grass,alphaTest:.45,side:THREE.DoubleSide,roughness:1,color:new THREE.Color(L.grassCol||0xb8c0a0).multiplyScalar(1.5)});
  gmat.onBeforeCompile=s=>{s.uniforms.uT=L.timeU;s.vertexShader='uniform float uT;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 wp0=instanceMatrix*vec4(0.,0.,0.,1.);transformed.x+=sin(uT*1.7+wp0.x*.4+wp0.z*.3)*.08*position.y;');};
  inst(cross,gmat,tufts,1,false);}
 // distant hills ring
 {const geo=new THREE.CylinderGeometry(L.half*2.6,L.half*2.6,1,64,1,true);const p=geo.attributes.position;for(let i=0;i<p.count;i++){if(p.getY(i)>0){const a=Math.atan2(p.getZ(i),p.getX(i));p.setY(i,14+Math.sin(a*5)*6+Math.sin(a*13+1)*3+Math.sin(a*29)*1.5);}else p.setY(i,-2);}geo.computeVertexNormals();
  const hm=new THREE.MeshBasicMaterial({color:isN?0x05070c:0x1c1520,side:THREE.BackSide,fog:false});G.add(new THREE.Mesh(geo,hm));}
 L.timeU=L.timeU||{value:0};
 return{group:G,lights};}

export function makeHeli(){const g=new THREE.Group();const body=new THREE.MeshStandardMaterial({color:0x3a4234,roughness:.55,metalness:.4}),dark=new THREE.MeshStandardMaterial({color:0x111214,roughness:.4,metalness:.6}),glass=new THREE.MeshStandardMaterial({color:0x0a1218,roughness:.05,metalness:.9});
 const add=(geo,m,x,y,z,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;g.add(o);return o;};
 add(new THREE.CapsuleGeometry(1.1,3,6,12),body,0,1.9,0,Math.PI/2);add(new THREE.SphereGeometry(1.0,14,10,0,Math.PI*2,0,1.3),glass,0,2.1,2.0,1.2);add(CY(.35,.18,5.5,8),body,0,2.3,-4.4,Math.PI/2);add(BX(.1,1.5,.9),body,0,3.0,-7);
 add(BX(.12,.12,3.6),dark,.9,.35,0);add(BX(.12,.12,3.6),dark,-.9,.35,0);add(BX(.08,.6,.08),dark,.9,.7,1);add(BX(.08,.6,.08),dark,-.9,.7,1);add(BX(.08,.6,.08),dark,.9,.7,-1);add(BX(.08,.6,.08),dark,-.9,.7,-1);
 add(CY(.12,.12,.5,8),dark,0,3.25,0);const rotor=new THREE.Group();rotor.position.set(0,3.5,0);g.add(rotor);for(let i=0;i<4;i++){const b=new THREE.Mesh(BX(.35,.05,6.5),dark);b.position.z=3.25;const piv=new THREE.Group();piv.rotation.y=i*Math.PI/2;piv.add(b);b.position.set(0,0,3.2);rotor.add(piv);}
 const tr=new THREE.Group();tr.position.set(.15,3.1,-7);g.add(tr);for(let i=0;i<2;i++){const b=new THREE.Mesh(BX(.04,1.6,.18),dark);b.rotation.x=i*Math.PI/2;tr.add(b);}
 const beacon=new THREE.Mesh(new THREE.SphereGeometry(.08,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(6,.4,.3)}));beacon.position.set(0,1.0,0);g.add(beacon);
 g.userData={rotor,tr,beacon};return g;}

// sky dome: gradient + stars + moon/sun glow
export function makeSky(kind){const g=new THREE.Group();const night=kind==='night';
 const U={uTop:{value:new THREE.Color(night?0x02040a:0x1a1f3a)},uMid:{value:new THREE.Color(night?0x0a1220:0x6a4560)},uHor:{value:new THREE.Color(night?0x141c2a:0xf08850)},uSun:{value:new V(night?-.4:.7,night?.55:.08,night?-.6:-.7).normalize()},uSunC:{value:new THREE.Color(night?0x8090b0:0xffb070)},uSunS:{value:night?.0:1.0}};
 g.add(new THREE.Mesh(new THREE.SphereGeometry(900,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:U,
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 uTop,uMid,uHor,uSun,uSunC;uniform float uSunS;varying vec3 vP;void main(){vec3 d=normalize(vP);float h=d.y;vec3 c=mix(uHor,uMid,smoothstep(-.02,.18,h));c=mix(c,uTop,smoothstep(.15,.7,h));float s=max(0.,dot(d,uSun));c+=uSunC*(pow(s,8.)*.35+pow(s,64.)*.6)*uSunS;c+=uSunC*pow(s,2000.)*4.*uSunS;if(h<0.)c=mix(c,uHor*.5,smoothstep(0.,-.1,h));gl_FragColor=vec4(c,1.);}'})));
 if(night){const p=[],c=[];for(let i=0;i<2200;i++){const a=Math.random()*6.283,e=Math.asin(.05+Math.random()*.95),r=880;p.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r);const b=.4+Math.random()*.6;c.push(b,b,b*1.1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.add(new THREE.Points(geo,new THREE.PointsMaterial({size:1.5,sizeAttenuation:false,vertexColors:true,fog:false,transparent:true,opacity:.85,depthWrite:false})));
  const moon=new THREE.Mesh(new THREE.CircleGeometry(22,32),new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,2.3,2.6),fog:false,depthWrite:false}));moon.position.copy(U.uSun.value).multiplyScalar(850);moon.lookAt(0,0,0);g.add(moon);
  const halo=new THREE.Mesh(new THREE.CircleGeometry(90,32),new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vU;void main(){float d=length(vU-.5)*2.;gl_FragColor=vec4(vec3(.25,.3,.42)*pow(max(0.,1.-d),3.),1.);}'}));halo.position.copy(U.uSun.value).multiplyScalar(860);halo.lookAt(0,0,0);g.add(halo);}
 g.userData.U=U;return g;}
