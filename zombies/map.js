// NIGHTFALL — "Bramblewood Field Station": tile layout, collision, ray casts, flow-field pathfinding and all static world geometry.
import * as THREE from '../vendor/three.module.min.js';
import {labelTex,DISP,MONO} from './tex.js';
const V=THREE.Vector3,TAU=Math.PI*2;
export const W=58,H=50;
let sd=99;const rr=()=>{sd=(sd*16807)%2147483647;return(sd-1)/2147483646;};

/* ================= layout ================= */
export const AREAS=[
 {key:'yard',name:'THE YARD',seed:[36,33],roof:0},
 {key:'house',name:'FARMHOUSE',seed:[12,38],roof:3.5},
 {key:'barn',name:'THE BARN',seed:[12,12],roof:4.4},
 {key:'garden',name:'OLD ORCHARD',seed:[30,12],roof:0},
 {key:'lab',name:'FIELD LAB',seed:[42,14],roof:3.9}];
export const DOORS={1:{cost:750},2:{cost:1000},3:{cost:1000},4:{cost:1250},5:{cost:1500}};
const WINDOWS=[[50,26],[50,36],[30,42],[42,42],[7,23],[7,31],[7,38],[13,42],[12,7],[19,7],[7,13],[27,7],[32,7],[41,7],[47,7],[50,13]];
const WALLH={X:3.2,'#':3.5,P:4.4,M:3.9};
const PROPH={w:.95,t:1.9,i:1.05,c:1.3,b:1.1,T:7,e:.8,k:.95,s:1.2,A:2.3,B:2.3,C:2.3,D:2.3,Q:.95,U:1.5,Y:9};
export const PERKS={A:{id:'hide',name:'IRONHIDE TONIC',cost:2500,col:0xc0281c,css:'#ff4a3a',desc:'MAX HEALTH 250'},
 B:{id:'hand',name:'QUICKHAND COLA',cost:3000,col:0x5aa620,css:'#9be24a',desc:'RELOAD TWICE AS FAST'},
 C:{id:'wind',name:'SECOND WIND SODA',cost:1500,soloCost:500,col:0x2a7ad0,css:'#5ab8ff',desc:'REVIVE FASTER · SOLO SELF-REVIVE'},
 D:{id:'fang',name:'TWIN FANG BREW',cost:2000,col:0xd07a10,css:'#ffb340',desc:'FIRE FASTER · DOUBLE DAMAGE'}};
const WALLBUY=[{x:35,z:42,w:'hornet'},{x:14,z:27,w:'warden',face:[0,-1]},{x:10,z:34,w:'mule',face:[0,1]},{x:16,z:7,w:'thresher'},{x:30,z:7,w:'ranger'}];

function layout(){const g=[];for(let z=0;z<H;z++)g.push(Array(W).fill(','));
 const R=(x0,z0,x1,z1,c)=>{for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)g[z][x]=c;};
 const F=(x0,z0,x1,z1,w,f)=>{R(x0,z0,x1,z1,w);R(x0+1,z0+1,x1-1,z1-1,f);};
 F(7,7,50,42,'X','.');R(25,8,34,19,'g');F(7,7,24,20,'P','h');F(35,7,50,20,'M','l');R(25,20,34,20,'X');F(7,27,20,42,'#','f');R(8,34,19,34,'#');g[34][13]=g[34][14]='f';
 const D=(id,c)=>c.forEach(([x,z])=>g[z][x]=String(id));
 D(1,[[20,31],[20,32],[20,33]]);D(2,[[28,20],[29,20],[30,20]]);D(3,[[13,20],[14,20],[15,20]]);D(4,[[24,12],[24,13],[24,14]]);D(5,[[35,12],[35,13],[35,14]]);
 for(const[x,z]of WINDOWS)g[z][x]='O';
 const P=(c,l)=>l.forEach(([x,z])=>g[z][x]=c);
 P('w',[[30,30],[31,30],[30,31],[31,31]]);R(41,24,45,25,'t');P('i',[[27,24],[46,39]]);P('c',[[22,40],[23,40],[22,39],[22,18],[23,18]]);P('b',[[48,22],[49,22],[49,23],[38,40]]);P('T',[[26,35],[27,11],[32,14],[28,17]]);
 P('C',[[49,31]]);P('Q',[[20,21],[21,21],[8,16],[8,17],[44,8],[45,8]]);
 R(10,30,11,31,'e');R(8,28,11,28,'k');P('A',[[19,40]]);R(16,41,17,41,'k');
 P('B',[[23,9]]);R(15,10,17,11,'s');R(19,16,20,17,'s');
 P('D',[[36,18]]);P('U',[[42,19],[43,19]]);R(37,9,39,9,'k');R(46,15,48,15,'k');
 // outside pines (keep the band hugging the walls clear for the shamblers)
 for(let z=0;z<H;z++)for(let x=0;x<W;x++){if(g[z][x]!==',')continue;let near=99;for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){const c=g[z+dz]&&g[z+dz][x+dx];if(c&&c!==','&&c!=='Y')near=Math.min(near,Math.max(Math.abs(dx),Math.abs(dz)));}
  if(near>2&&rr()<.11)g[z][x]='Y';}
 return g;}

/* ================= geometry builder (world-space UVs, merged per material) ================= */
class GB{constructor(){this.d={};}
 a(k){return this.d[k]||(this.d[k]={p:[],n:[],u:[]});}
 tri(k,A,B,C,n,s=2){const l=Math.hypot(...n);n=n.map(v=>v/l);const ab=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],ac=[C[0]-A[0],C[1]-A[1],C[2]-A[2]];const cr=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  const pts=cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0?[A,C,B]:[A,B,C];const T=this.a(k);for(const v of pts){T.p.push(v[0],v[1],v[2]);T.n.push(n[0],n[1],n[2]);T.u.push((Math.abs(n[0])>Math.abs(n[2])?v[2]:v[0])/s,v[1]/s);}}
 quad(k,A,B,C,D,n,s=2){{const l=Math.hypot(n[0],n[1],n[2]);n=[n[0]/l,n[1]/l,n[2]/l];}const ab=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],ac=[C[0]-A[0],C[1]-A[1],C[2]-A[2]];const cr=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
  let pts=cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0?[A,D,C,B]:[A,B,C,D];const T=this.a(k);const ax=Math.abs(n[0]),ay=Math.abs(n[1]),az=Math.abs(n[2]);
  for(const i of[0,1,2,0,2,3]){const v=pts[i];T.p.push(v[0],v[1],v[2]);T.n.push(n[0],n[1],n[2]);let u,w;if(ay>ax&&ay>az){u=v[0];w=v[2];}else if(ax>az){u=v[2]*(n[0]>0?-1:1);w=v[1];}else{u=v[0]*(n[2]>0?1:-1);w=v[1];}T.u.push(u/s,w/s);}}
 box(k,x0,y0,z0,x1,y1,z1,m=63,s=2){if(m&1)this.quad(k,[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],[1,0,0],s);if(m&2)this.quad(k,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],s);
  if(m&4)this.quad(k,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[0,1,0],s);if(m&8)this.quad(k,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0],s);
  if(m&16)this.quad(k,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],s);if(m&32)this.quad(k,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1],s);}
 geo(k,g,mat,us=1){const T=this.a(k);const G=g.index?g.toNonIndexed():g;G.applyMatrix4(mat);const nm=new THREE.Matrix3().getNormalMatrix(mat);const P=G.attributes.position,N=G.attributes.normal,U=G.attributes.uv;const n=new V();
  for(let i=0;i<P.count;i++){T.p.push(P.getX(i),P.getY(i),P.getZ(i));n.set(N.getX(i),N.getY(i),N.getZ(i)).applyMatrix3(nm).normalize();T.n.push(n.x,n.y,n.z);T.u.push(U?U.getX(i)*us:0,U?U.getY(i)*us:0);}}
 build(mats,group,shadow=true){for(const k in this.d){const T=this.d[k];if(!T.p.length)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(T.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(T.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(T.u,2));g.computeBoundingSphere();
  const m=new THREE.Mesh(g,mats[k]||mats.wood);m.castShadow=shadow&&k!=='gravel'&&k!=='grass'&&k!=='ceil'&&!k.startsWith('floor');m.receiveShadow=true;m.name=k;group.add(m);}}}
const M4=new THREE.Matrix4(),Q4=new THREE.Quaternion(),S4=new V(),E4=new THREE.Euler();
const mtx=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>M4.compose(S4.set(x,y,z),Q4.setFromEuler(E4.set(rx,ry,rz)),new V(sx,sy,sz)).clone();

/* ================= the map ================= */
export class GameMap{
 constructor(){sd=99;const g=this.g=layout();const N=W*H;this.solid=new Uint8Array(N);this.hgt=new Float32Array(N);this.oLo=new Float32Array(N);this.oHi=new Float32Array(N);this.area=new Int8Array(N).fill(-1);this.roof=new Float32Array(N);this.door=new Int8Array(N);this.climb=new Uint8Array(N);
  for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=g[z][x],i=z*W+x;
   if(WALLH[c]){this.solid[i]=1;this.hgt[i]=WALLH[c];}
   else if(c==='O'||/[1-5]/.test(c)){this.solid[i]=1;this.hgt[i]=this.nbWallH(x,z);if(c==='O'){this.oLo[i]=.9;this.oHi[i]=2.15;}else this.door[i]=+c;}
   else if(PROPH[c]){this.solid[i]=1;this.hgt[i]=PROPH[c];if('cbiekst'.includes(c))this.climb[i]=1;}}
  // areas by flood fill
  const isOpen=(x,z)=>{const c=g[z][x];return!(WALLH[c]||c==='O'||/[1-5]/.test(c));};
  this.areas=AREAS.map((a,id)=>({...a,id,open:id===0,cells:[]}));
  for(const a of this.areas){const st=[a.seed];while(st.length){const[x,z]=st.pop();if(x<0||z<0||x>=W||z>=H)continue;const i=z*W+x;if(this.area[i]>=0||!isOpen(x,z))continue;this.area[i]=a.id;a.cells.push(i);if(a.roof)this.roof[i]=a.roof;st.push([x+1,z],[x-1,z],[x,z+1],[x,z-1]);}}
  // doors
  this.doors=[];for(const id in DOORS){const cells=[];for(let i=0;i<N;i++)if(this.door[i]==id)cells.push(i);const xs=cells.map(i=>i%W),zs=cells.map(i=>i/W|0);const alongX=new Set(zs).size===1;
   const cx=(Math.min(...xs)+Math.max(...xs)+1)/2,cz=(Math.min(...zs)+Math.max(...zs)+1)/2;const i0=cells[1]||cells[0];const ax=i0%W,az=i0/W|0;
   const sides=alongX?[this.area[(az-1)*W+ax],this.area[(az+1)*W+ax]]:[this.area[az*W+ax-1],this.area[az*W+ax+1]];
   this.doors.push({id:+id,cells,cost:DOORS[id].cost,alongX,pos:new V(cx,0,cz),areas:sides,open:false,mesh:null});}
  // windows
  this.windows=WINDOWS.map(([x,z],k)=>{let nx=0,nz=0;for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const c=g[z+dz]&&g[z+dz][x+dx];if(c&&c!==','&&c!=='Y'&&!WALLH[c]&&isOpen(x+dx,z+dz)){nx=dx;nz=dz;}}
   const ix=x+nx,iz=z+nz,ox=x-nx,oz=z-nz;return{k,x,z,ix,iz,ox,oz,nx,nz,area:this.area[iz*W+ix],boards:6,slots:[1,1,1,1,1,1],pos:new V(x+.5,0,z+.5),inPos:new V(ix+.5,0,iz+.5),outPos:new V(ox+.5,0,oz+.5),field:null,spawns:[],busy:null,repairT:0};});
  for(const w of this.windows){w.field=this.bfs(w.ox,w.oz,true);for(let i=0;i<N;i++){const d=w.field[i];if(d>=12&&d<=20&&g[i/W|0][i%W]===',')w.spawns.push(i);}}
  // interactables
  this.items=[];const fl=(x,z)=>{const c=g[z]&&g[z][x];return c&&isOpen(x,z)&&!PROPH[c]&&c!==','&&c!=='Y';};const wl=(x,z)=>{const c=g[z]&&g[z][x];return!!WALLH[c]||c==='O';};
  const face=(x,z,ch)=>{const D4=[[0,1],[0,-1],[1,0],[-1,0]];for(const[dx,dz]of D4)if(fl(x+dx,z+dz)&&wl(x-dx,z-dz)&&(!ch||g[z-dz][x-dx]!==ch))return[dx,dz];for(const[dx,dz]of D4)if(fl(x+dx,z+dz))return[dx,dz];return[0,1];};
  for(const wb of WALLBUY){const[fx,fz]=wb.face||face(wb.x,wb.z);this.items.push({type:'wall',w:wb.w,x:wb.x,z:wb.z,fx,fz,pos:new V(wb.x+.5+fx*.5,1.45,wb.z+.5+fz*.5),area:this.area[(wb.z+fz)*W+wb.x+fx]});}
  for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=g[z][x];if(PERKS[c]){const[fx,fz]=face(x,z);this.items.push({type:'perk',key:c,...PERKS[c],x,z,fx,fz,pos:new V(x+.5,0,z+.5),area:this.area[z*W+x]});}}
  const pairs=(ch)=>{const out=[],seen=new Set();for(let z=0;z<H;z++)for(let x=0;x<W;x++){if(g[z][x]!==ch||seen.has(z*W+x))continue;const hz=g[z][x+1]===ch;const x2=hz?x+1:x,z2=hz?z:z+1;seen.add(z*W+x);seen.add(z2*W+x2);
   const[fx,fz]=face(x,z,ch);
   out.push({x,z,x2,z2,hz,fx,fz,pos:new V((x+x2+1)/2,0,(z+z2+1)/2),area:this.area[z*W+x]});}return out;};
  this.crateSpots=pairs('Q');this.forge={type:'forge',...pairs('U')[0]};this.items.push(this.forge);
  for(const s of this.crateSpots)this.items.push({type:'crate',spot:s,pos:s.pos,area:s.area});
  this.power={type:'power',x:50,z:17,fx:-1,fz:0,pos:new V(50,1.3,17.5),area:4,on:false};this.items.push(this.power);
  this.start=new V(36.5,0,33.5);this.allyStart=new V(34.5,0,34.5);this.yaw0=0;
 }
 nbWallH(x,z){let h=0;for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const c=this.g[z+dz]&&this.g[z+dz][x+dx];if(WALLH[c])h=Math.max(h,WALLH[c]);}return h||3.2;}
 nbWallCh(x,z){const n={};for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const c=this.g[z+dz]&&this.g[z+dz][x+dx];if(WALLH[c])n[c]=(n[c]||0)+1;}let b='X',bn=0;for(const k in n)if(n[k]>bn){bn=n[k];b=k;}return b;}
 idx(x,z){const cx=Math.floor(x),cz=Math.floor(z);return cx<0||cz<0||cx>=W||cz>=H?-1:cz*W+cx;}
 areaAt(x,z){const i=this.idx(x,z);return i<0?-1:this.area[i];}
 openDoor(d){d.open=true;for(const i of d.cells){this.solid[i]=0;this.oLo[i]=0;this.oHi[i]=2.6;}for(const a of d.areas)if(a>=0)this.areas[a].open=true;}
 // fy (optional) = highest top a body can step/climb onto from where its feet are: low props under it stop blocking
 blocked(cx,cz,fy){if(cx<0||cz<0||cx>=W||cz>=H)return true;const i=cz*W+cx;if(this.solid[i]!==1)return false;if(fy===undefined)return true;const t=this.top(i);return!(t&&t<=fy);}
 // stand-on height of a cell (0 = floor or not climbable); props too tall for the ceiling above them stay walls
 top(i){return i>=0&&this.climb[i]&&this.solid[i]&&(!this.roof[i]||this.hgt[i]+1.85<=this.roof[i])?this.hgt[i]:0;}
 // ground height under a circle (feet support), ignoring tops above max
 floorAt(x,z,r,max=99){let g=0;const x0=Math.floor(x-r),x1=Math.floor(x+r),z0=Math.floor(z-r),z1=Math.floor(z+r);for(let cz=z0;cz<=z1;cz++)for(let cx=x0;cx<=x1;cx++){if(cx<0||cz<0||cx>=W||cz>=H)continue;const t=this.top(cz*W+cx);if(t<=g||t>max)continue;const dx=x-Math.max(cx,Math.min(x,cx+1)),dz=z-Math.max(cz,Math.min(z,cz+1));if(dx*dx+dz*dz<r*r)g=t;}return g;}
 // circle vs blocking cells; returns true if pushed
 collide(p,r,fy){let hit=false;for(let it=0;it<2;it++){const x0=Math.floor(p.x-r),x1=Math.floor(p.x+r),z0=Math.floor(p.z-r),z1=Math.floor(p.z+r);
  for(let cz=z0;cz<=z1;cz++)for(let cx=x0;cx<=x1;cx++){if(!this.blocked(cx,cz,fy))continue;const nx=Math.max(cx,Math.min(p.x,cx+1)),nz=Math.max(cz,Math.min(p.z,cz+1));let dx=p.x-nx,dz=p.z-nz;const d2=dx*dx+dz*dz;
   if(d2<r*r){if(d2<1e-8){const ex=[p.x-cx,cx+1-p.x,p.z-cz,cz+1-p.z];const m=Math.min(...ex);if(m===ex[0])p.x=cx-r;else if(m===ex[1])p.x=cx+1+r;else if(m===ex[2])p.z=cz-r;else p.z=cz+1+r;}else{const d=Math.sqrt(d2);p.x+=dx/d*(r-d);p.z+=dz/d*(r-d);}hit=true;}}}return hit;}
 // 3D ray vs tiles + ground + ceilings. out:{t,nx,ny,nz,i,kind}
 ray(ox,oy,oz,dx,dy,dz,maxT,out={}){out.t=maxT;out.i=-1;out.kind='';
  if(dy<-1e-6){const tg=-oy/dy;if(tg<out.t){out.t=tg;out.nx=0;out.ny=1;out.nz=0;out.kind='ground';}}
  let cx=Math.floor(ox),cz=Math.floor(oz);const sx=dx>0?1:-1,sz=dz>0?1:-1;const tdx=Math.abs(1/(dx||1e-9)),tdz=Math.abs(1/(dz||1e-9));
  let tmx=dx>0?(cx+1-ox)*tdx:(ox-cx)*tdx,tmz=dz>0?(cz+1-oz)*tdz:(oz-cz)*tdz;let t=0,nx=0,nz=0;
  for(let k=0;k<200&&t<out.t;k++){if(cx<0||cz<0||cx>=W||cz>=H)break;const i=cz*W+cx;const tn=Math.min(tmx,tmz,out.t);
   const rf=this.roof[i];if(rf&&dy>0){const tc=(rf-oy)/dy;if(tc>=t&&tc<tn){out.t=tc;out.nx=0;out.ny=-1;out.nz=0;out.kind='ceil';out.i=i;return out;}}
   const h=this.hgt[i];if(h>0){const y0=oy+dy*t,y1=oy+dy*tn;const lo=Math.min(y0,y1),hi=Math.max(y0,y1);const ol=this.oLo[i],oh=this.oHi[i];
    if(lo<h&&!(oh>0&&lo>ol&&hi<oh)){// find entry height within block
     let te=t;if(lo<h&&y0>=h&&dy<0)te=(h-oy)/dy;if(te>t+1e-4&&te<tn){out.t=te;out.nx=0;out.ny=1;out.nz=0;}else{out.t=t;out.nx=nx;out.ny=0;out.nz=nz;}out.kind=this.g[cz][cx];out.i=i;return out;}}
   if(tmx<tmz){t=tmx;tmx+=tdx;cx+=sx;nx=-sx;nz=0;}else{t=tmz;tmz+=tdz;cz+=sz;nz=-sz;nx=0;}}
  return out;}
 los(ax,ay,az,bx,by,bz){const dx=bx-ax,dy=by-ay,dz=bz-az,l=Math.hypot(dx,dy,dz);if(l<.01)return true;const o=this.ray(ax,ay,az,dx/l,dy/l,dz/l,l,this._lo||(this._lo={}));return o.t>=l-.05;}
 // Dial's algorithm on 8-neighbour grid (straight 2, diagonal 3). outside=true walks only outside tiles.
 bfs(sx,sz,outside=false,out){const N=W*H;const d=out||new Int16Array(N);d.fill(-1);if(sx<0||sz<0||sx>=W||sz>=H)return d;
  const ok=i=>outside?(this.g[i/W|0][i%W]===','):this.solid[i]===0&&(this.area[i]>=0||this.door[i]>0);const B=[[],[],[],[]];let cur=0,rem=1;const s=sz*W+sx;d[s]=0;B[0].push(s);let level=0;
  while(rem>0){const bk=B[level&3];while(bk.length){const i=bk.pop();rem--;const dv=d[i];if(dv!==level)continue;const x=i%W,z=i/W|0;
    for(let k=0;k<8;k++){const dx=DX[k],dz=DZ[k];const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=W||nz>=H)continue;const j=nz*W+nx;if(!ok(j))continue;if(dx&&dz&&(!ok(z*W+nx)||!ok(nz*W+x)))continue;const c=dv+(dx&&dz?3:2);if(d[j]<0||c<d[j]){d[j]=c;B[c&3].push(j);rem++;}}}
   level++;if(level>30000)break;}
  return d;}
 // steer direction from a distance field (towards decreasing distance); returns false if no field
 descend(field,x,z,out){const cx=Math.floor(x),cz=Math.floor(z);if(cx<0||cz<0||cx>=W||cz>=H)return false;const i=cz*W+cx;const d0=field[i];if(d0<0)return false;
  let best=d0,bx=0,bz=0;for(let k=0;k<8;k++){const nx=cx+DX[k],nz=cz+DZ[k];if(nx<0||nz<0||nx>=W||nz>=H)continue;const dv=field[nz*W+nx];if(dv<0||dv>=best)continue;if(DX[k]&&DZ[k]&&(field[cz*W+nx]<0||field[nz*W+cx]<0))continue;best=dv;bx=DX[k];bz=DZ[k];}
  if(!bx&&!bz){out.x=0;out.z=0;return d0===0;}const tx=cx+bx+.5-x,tz=cz+bz+.5-z,l=Math.hypot(tx,tz)||1;out.x=tx/l;out.z=tz/l;return true;}
 randomFloor(areaIds,avoid,minD=0){const pool=[];for(const a of this.areas){if(!areaIds.includes(a.id))continue;for(const i of a.cells)if(!this.solid[i])pool.push(i);}
  for(let k=0;k<60;k++){const i=pool[(Math.random()*pool.length)|0];const x=i%W+.5,z=(i/W|0)+.5;if(!avoid||Math.hypot(x-avoid.x,z-avoid.z)>=minD)return new V(x,0,z);}const i=pool[0];return new V(i%W+.5,0,(i/W|0)+.5);}

 /* ================= visuals ================= */
 build(scene,T,gunModel,renderer){const G=new THREE.Group();scene.add(G);this.group=G;const std=o=>{const m=new THREE.MeshStandardMaterial(o);m.envMapIntensity=.35;return m;};
  const rep=(t,n=1)=>{const c=t.clone();c.needsUpdate=true;c.repeat.set(n,n);return c;};
  const mats=this.mats={concrete:std({map:T.concrete,bumpMap:T.concrete,bumpScale:1.5,roughness:.92,color:0x9a9aa0}),stone:std({map:T.stone,bumpMap:T.stone,bumpScale:3,roughness:.9,color:0xb0a898}),planks:std({map:T.planks,bumpMap:T.planks,bumpScale:2,roughness:.85,color:0xc8b0a0}),
   metal:std({map:T.metal,bumpMap:T.metal,bumpScale:2,roughness:.55,metalness:.55,color:0x9aa2a8}),gravel:std({map:T.gravel,bumpMap:T.gravel,bumpScale:2,roughness:.95,color:0xa09a90}),grass:std({map:T.grass,roughness:.95,color:0xa0a890}),
   floor:std({map:T.floor,bumpMap:T.floor,bumpScale:1,roughness:.75,color:0xb8a090}),floorbarn:std({map:T.floor,roughness:.85,color:0x8a7a60}),floorlab:std({map:T.tile,roughness:.45,metalness:.05,color:0xb0b8b4}),
   ceil:std({map:T.floor,roughness:.9,color:0x5a4a40,side:THREE.FrontSide}),shingle:std({map:T.shingle,bumpMap:T.shingle,bumpScale:2,roughness:.85,color:0x8a8078}),roofmetal:std({map:T.metal,roughness:.5,metalness:.6,color:0x6a7276}),
   wood:std({map:T.boards,roughness:.8,color:0xa08060}),dark:std({color:0x2a2622,roughness:.7,metalness:.2}),rust:std({map:T.rust,roughness:.7,metalness:.5,color:0xb0a090}),hay:std({map:T.hay,bumpMap:T.hay,bumpScale:2,roughness:1,color:0xd0b880}),
   bark:std({map:T.bark,roughness:.95,color:0x9a8a80}),steel:std({color:0x8a9096,roughness:.35,metalness:.85}),paint:std({color:0x3a4a3a,roughness:.6,metalness:.4}),cloth:std({color:0x3a3a30,roughness:1})};
  const gb=new GB();const g=this.g;
  // ground
  const gt=rep(T.ground,60);const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240),std({map:gt,bumpMap:gt,bumpScale:2,roughness:1,color:0x8a8478}));ground.rotation.x=-Math.PI/2;ground.position.set(W/2,0,H/2);ground.receiveShadow=true;G.add(ground);
  const fk={'.':'gravel',g:'grass',f:'floor',h:'floorbarn',l:'floorlab'};
  for(let z=0;z<H;z++)for(let x=0;x<W;x++){const i=z*W+x;const c=g[z][x];let k=fk[c];if(!k&&this.area[i]>=0){k=fk[g[z][x-1]]||fk[g[z][x+1]]||fk[g[z-1][x]]||fk[g[z+1][x]]||'gravel';}
   if((k&&this.area[i]>=0)||this.door[i]){const a=this.area[i]>=0?this.areas[this.area[i]]:null;const kk=k||'gravel';gb.quad(kk,[x,.004,z],[x+1,.004,z],[x+1,.004,z+1],[x,.004,z+1],[0,1,0],kk==='gravel'?3:kk==='grass'?3:3);
    if(a&&a.roof)gb.quad('ceil',[x,a.roof,z],[x+1,a.roof,z],[x+1,a.roof,z+1],[x,a.roof,z+1],[0,-1,0],3);}}
  // walls with hidden-face culling
  const WK={X:'concrete','#':'stone',P:'planks',M:'metal'};
  const hAt=(x,z)=>{if(x<0||z<0||x>=W||z>=H)return 0;const c=g[z][x];return WALLH[c]?WALLH[c]:0;};
  const isOpening=(x,z)=>{const c=g[z]&&g[z][x];return c==='O'||/[1-5]/.test(c);};
  for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=g[z][x];
   if(WALLH[c]){const h=WALLH[c],k=WK[c];gb.box(k,x,0,z,x+1,h,z+1,4,2);
    const sides=[[1,0,1],[-1,0,2],[0,1,16],[0,-1,32]];for(const[dx,dz,bit]of sides){const nh=hAt(x+dx,z+dz);if(isOpening(x+dx,z+dz)){gb.box(k,x,0,z,x+1,h,z+1,bit,2);continue;}if(nh>=h)continue;
     const y0=nh;// emit partial face
     const X0=dx>0?x+1:x,Z0=dz>0?z+1:z;if(dx)gb.quad(k,[X0,y0,z],[X0,y0,z+1],[X0,h,z+1],[X0,h,z],[dx,0,0],2);else gb.quad(k,[x,y0,Z0],[x+1,y0,Z0],[x+1,h,Z0],[x,h,Z0],[0,0,dz],2);}}
   else if(c==='O'){const k=WK[this.nbWallCh(x,z)],h=this.hgt[z*W+x];const w=this.windows.find(w=>w.x===x&&w.z===z);const m=w.nx?(1|2):(16|32);
    gb.box(k,x,0,z,x+1,.9,z+1,m|4,2);gb.box(k,x,2.15,z,x+1,h,z+1,m|4|8,2);
    // frame + sill
    const ax=w.nx!==0;const fr=(x0,y0,z0,x1,y1,z1)=>gb.box('wood',x0,y0,z0,x1,y1,z1,63,1);
    if(ax){for(const s of[0,1]){fr(x-.04,.9,z+s*.9,x+1.04,2.15,z+s*.9+.1);}fr(x-.06,.86,z-.02,x+1.06,.94,z+1.02);fr(x-.04,2.1,z,x+1.04,2.2,z+1);}
    else{for(const s of[0,1]){fr(x+s*.9,.9,z-.04,x+s*.9+.1,2.15,z+1.04);}fr(x-.02,.86,z-.06,x+1.02,.94,z+1.06);fr(x,2.1,z-.04,x+1,2.2,z+1.04);}}
   else if(/[1-5]/.test(c)){const k=WK[this.nbWallCh(x,z)],h=this.hgt[z*W+x];const d=this.doors.find(d=>d.cells.includes(z*W+x));const m=d.alongX?(16|32):(1|2);gb.box(k,x,2.6,z,x+1,h,z+1,m|4|8,2);}}
  // props
  const P=(x,z)=>[x,z];this.buildProps(gb,mats,T);
  // gable roofs
  const gable=(x0,z0,x1,z1,h,rise,alongX,k,end)=>{const o=.45;x0-=o;z0-=o;x1+=o;z1+=o;
   if(alongX){const zm=(z0+z1)/2;gb.quad(k,[x0,h,z0],[x1,h,z0],[x1,h+rise,zm],[x0,h+rise,zm],[0,(z1-z0)/2,-rise],3);gb.quad(k,[x0,h,z1],[x1,h,z1],[x1,h+rise,zm],[x0,h+rise,zm],[0,(z1-z0)/2,rise],3);
    for(const[xx,s]of[[x0+o,-1],[x1-o,1]])gb.tri(end,[xx,h,z0+o],[xx,h,z1-o],[xx,h+rise,zm],[s,0,0]);}
   else{const xm=(x0+x1)/2;gb.quad(k,[x0,h,z0],[x0,h,z1],[xm,h+rise,z1],[xm,h+rise,z0],[-rise,(x1-x0)/2,0],3);gb.quad(k,[x1,h,z0],[x1,h,z1],[xm,h+rise,z1],[xm,h+rise,z0],[rise,(x1-x0)/2,0],3);
    for(const[zz,s]of[[z0+o,-1],[z1-o,1]])gb.tri(end,[x0+o,h,zz],[x1-o,h,zz],[xm,h+rise,zz],[0,0,s]);}};
  gable(7,7,25,21,4.4,2.8,true,'shingle','planks');gable(7,27,21,43,3.5,2.3,false,'shingle','stone');
  {const x0=34.6,x1=51.4,z0=6.6,z1=21.4,h=3.9;gb.quad('roofmetal',[x0,h+.9,z0],[x1,h+.9,z0],[x1,h,z1],[x0,h,z1],[0,1,.06],3);gb.box('metal',35,h,7,51,h+.9,7.2,63,2);gb.box('metal',35,h,7,35.2,h+.9,21,63,2);gb.box('metal',50.8,h,7,51,h+.9,21,63,2);}
  // mats tweaks
  gb.build(mats,G);
  this.buildBoards(G,T);this.buildDoors(G,mats,T);this.buildItems(G,mats,T,gunModel);this.buildForest(G,T);this.buildLights(G,mats);
  return G;}
 buildProps(gb,mats,T){const g=this.g;const done=new Set();
  for(let z=0;z<H;z++)for(let x=0;x<W;x++){const c=g[z][x],i=z*W+x;if(done.has(i))continue;
   if(c==='c'){const h=rr()<.4?2:1;for(let k=0;k<h;k++){const s=.92-k*.08,o=(1-s)/2,j=(rr()-.5)*.08;gb.box('wood',x+o+j,k*1,z+o-j,x+1-o+j,k+.98*s+.02,z+1-o-j,63,1);}this.hgt[i]=h>1?1.84:.92;}
   else if(c==='b'){const cy=new THREE.CylinderGeometry(.34,.34,1.05,14,1);gb.geo('rust',cy,mtx(x+.5,.525,z+.5),1);const r=new THREE.TorusGeometry(.345,.025,6,16);gb.geo('rust',r.clone(),mtx(x+.5,.35,z+.5,Math.PI/2));gb.geo('rust',r,mtx(x+.5,.72,z+.5,Math.PI/2));}
   else if(c==='e'){// table / sofa block spans area: emit once for each cell (tables are 2x2)
    gb.box('wood',x+.05,.72,z+.05,x+.95,.8,z+.95,63,1);gb.box('dark',x+.1,0,z+.1,x+.2,.72,z+.2,63,1);gb.box('dark',x+.8,0,z+.8,x+.9,.72,z+.9,63,1);}
   else if(c==='k'){gb.box('wood',x,.86,z+.02,x+1,.95,z+.98,63,1);gb.box('dark',x+.04,0,z+.06,x+.96,.86,z+.94,63,1.5);}
   else if(c==='s'){gb.box('hay',x+.04,0,z+.04,x+.96,1.15,z+.96,63,1.5);}
   else if(c==='T'){const h=7;gb.geo('bark',new THREE.CylinderGeometry(.18,.34,h,9,4),mtx(x+.5,h/2,z+.5),2);
    for(let k=0;k<7;k++){const a=rr()*TAU,y=2.4+rr()*4,l=1.2+rr()*1.8,tilt=.6+rr()*.6;gb.geo('bark',new THREE.CylinderGeometry(.03,.09,l,6),mtx(x+.5+Math.cos(a)*l*.35*Math.sin(tilt),y+l*.45*Math.cos(tilt),z+.5+Math.sin(a)*l*.35*Math.sin(tilt),Math.sin(a)*tilt,0,-Math.cos(a)*tilt),1);}}
   else if(c==='w'&&!done.has(i)){[i,i+1,i+W,i+W+1].forEach(j=>done.add(j));const cx=x+1,cz=z+1;gb.geo('stone',new THREE.CylinderGeometry(.95,1,.95,18,1,true),mtx(cx,.475,cz),1);gb.geo('stone',new THREE.CylinderGeometry(.75,.75,.95,18,1,true),mtx(cx,.475,cz,0,0,0,1,1,1),1);
    gb.geo('stone',new THREE.RingGeometry(.75,.98,18),mtx(cx,.95,cz,-Math.PI/2),1);gb.geo('dark',new THREE.CircleGeometry(.76,18),mtx(cx,.3,cz,-Math.PI/2),1);
    for(const s of[-1,1])gb.box('wood',cx+s*.85-.06,.9,cz-.06,cx+s*.85+.06,2.5,cz+.06,63,1);gb.box('wood',cx-1.05,2.4,cz-.06,cx+1.05,2.52,cz+.06,63,1);
    gb.quad('shingle',[cx-1.1,2.4,cz-.8],[cx+1.1,2.4,cz-.8],[cx+1.1,2.95,cz],[cx-1.1,2.95,cz],[0,.8,-.55],2);gb.quad('shingle',[cx-1.1,2.4,cz+.8],[cx+1.1,2.4,cz+.8],[cx+1.1,2.95,cz],[cx-1.1,2.95,cz],[0,.8,.55],2);
    gb.geo('wood',new THREE.CylinderGeometry(.08,.08,1.5,8),mtx(cx,2.05,cz,0,0,Math.PI/2),1);}
   else if(c==='t'&&!done.has(i)){// rusted pickup spanning 5x2 tiles
    for(let zz=z;zz<z+2;zz++)for(let xx=x;xx<x+5;xx++)done.add(zz*W+xx);const x0=x+.15,x1=x+4.85,z0=z+.2,z1=z+1.8;
    gb.box('paint',x0,.55,z0,x1,1.05,z1,63,2);gb.box('paint',x+2.7,1.05,z0+.05,x+4.1,1.85,z1-.05,63,2);gb.box('dark',x+2.75,1.15,z0,x+4.05,1.75,z0+.02,63,1);gb.box('dark',x+2.75,1.15,z1-.02,x+4.05,1.75,z1,63,1);gb.box('dark',x+4.08,1.12,z0+.15,x+4.12,1.75,z1-.15,63,1);
    gb.box('paint',x+4.1,.55,z0,x1,1.15,z1,63,2);gb.box('paint',x0,1.05,z0,x+2.65,1.35,z0+.08,63,2);gb.box('paint',x0,1.05,z1-.08,x+2.65,1.35,z1,63,2);gb.box('paint',x0,1.05,z0,x0+.08,1.35,z1,63,2);
    gb.box('steel',x1-.02,.6,z0+.1,x1+.08,.8,z1-.1,63,1);for(const[wx,wz]of[[x+1,z0],[x+1,z1],[x+3.9,z0],[x+3.9,z1]])gb.geo('dark',new THREE.CylinderGeometry(.38,.38,.28,14),mtx(wx,.38,wz,Math.PI/2),1);
    gb.geo('rust',new THREE.BoxGeometry(.5,.25,.5),mtx(x+1.2,1.15,z+.9,.2,.4,0),1);for(let zz=z;zz<z+2;zz++)for(let k=0;k<5;k++)this.hgt[zz*W+x+k]=k<3?1.1:k<4?1.85:1.2;}
   else if(c==='i'){gb.geo('rust',new THREE.CylinderGeometry(.36,.32,1.0,14,1,true),mtx(x+.5,.5,z+.5),1);gb.geo('dark',new THREE.CircleGeometry(.34,14),mtx(x+.5,.85,z+.5,-Math.PI/2),1);
    for(let k=0;k<5;k++){const a=k/5*TAU;gb.geo('dark',new THREE.BoxGeometry(.12,.12,.4),mtx(x+.5+Math.cos(a)*.12,.92,z+.5+Math.sin(a)*.12,0,a,.4),1);}}}
  // compound wall coping + lamp poles etc. are cheap extras
  for(let x=7;x<=50;x++)for(const z of[7,42]){if(this.g[z][x]==='X')gb.box('steel',x,3.2,z+.42,x+1,3.26,z+.58,63,1);}
 }
 buildBoards(G,T){const geo=new THREE.BoxGeometry(1.12,.17,.05);const mat=new THREE.MeshStandardMaterial({map:T.boards,roughness:.8,color:0xb09070});mat.envMapIntensity=.3;
  const n=this.windows.length*6;const im=this.boardMesh=new THREE.InstancedMesh(geo,mat,n);im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;G.add(im);
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler();for(const w of this.windows){w.slotM=[];for(let s=0;s<6;s++){const y=1.0+s*.2+(rr()-.5)*.03;const rot=(rr()-.5)*.38;const along=w.nx!==0;// boards span along the wall
    const p=new V(w.x+.5+w.nx*.32,y,w.z+.5+w.nz*.32);e.set(0,along?Math.PI/2:0,rot);q.setFromEuler(e);m.compose(p,q,new V(1,1,1));w.slotM.push({p,q:q.clone(),m:m.clone()});im.setMatrixAt(w.k*6+s,m);}w.anim=[0,0,0,0,0,0];}
  im.instanceMatrix.needsUpdate=true;}
 // per-frame board animation; slot state 1=on, 0=off; anim>0 = flying in/out
 updateBoards(dt){const im=this.boardMesh;const m=new THREE.Matrix4(),p=new V(),q=new THREE.Quaternion(),s=new V(1,1,1),e=new THREE.Euler();let dirty=false;
  for(const w of this.windows)for(let k=0;k<6;k++){const a=w.anim[k];const sl=w.slotM[k];if(a===0&&w.slots[k]===1&&!sl.dirty)continue;if(a===0&&w.slots[k]===0&&sl.hidden)continue;dirty=true;sl.dirty=false;
   if(w.slots[k]===1){const t=Math.max(0,a);w.anim[k]=Math.max(0,a-dt*3.2);if(a>0&&w.anim[k]===0)sl.dirty=true;const f=t*t;p.copy(sl.p);p.x+=w.nx*f*1.1;p.z+=w.nz*f*1.1;p.y-=f*1.0;e.set(f*1.2,0,f*.6);q.setFromEuler(e).premultiply(sl.q);m.compose(p,sl.q.clone().multiply(q),s);sl.hidden=false;}
   else{const t=Math.max(0,a);w.anim[k]=Math.max(0,a-dt*1.6);if(t<=0){m.makeScale(0,0,0);sl.hidden=true;}else{const f=1-t;p.copy(sl.p);p.x-=w.nx*f*1.6;p.z-=w.nz*f*1.6;p.y+=Math.sin(f*Math.PI)*.5-f*f*1.1;e.set(f*4,f*2,f*3);q.setFromEuler(e);m.compose(p,sl.q.clone().multiply(q),s);}}
   im.setMatrixAt(w.k*6+k,m);}
  if(dirty)im.instanceMatrix.needsUpdate=true;}
 tearBoard(w){for(let k=5;k>=0;k--)if(w.slots[k]){w.slots[k]=0;w.anim[k]=1;w.boards--;return k;}return-1;}
 addBoard(w){for(let k=0;k<6;k++)if(!w.slots[k]){w.slots[k]=1;w.anim[k]=1;w.boards++;return k;}return-1;}
 resetBoards(){for(const w of this.windows){w.slots.fill(1);w.boards=6;w.anim.fill(0);w.slotM.forEach(s=>{s.dirty=true;s.hidden=false;});}}
 buildDoors(G,mats,T){for(const d of this.doors){const grp=new THREE.Group();grp.position.set(d.pos.x,0,d.pos.z);if(!d.alongX)grp.rotation.y=Math.PI/2;const len=d.cells.length;
   const wood=mats.wood;const planks=[];for(let k=0;k<6;k++){const pl=new THREE.Mesh(new THREE.BoxGeometry(len+.1,.24,.07),wood);pl.position.set((rr()-.5)*.1,.3+k*.4,(k%2?.06:-.06));pl.rotation.z=(rr()-.5)*.25;pl.castShadow=true;pl.receiveShadow=true;grp.add(pl);planks.push(pl);}
   for(const s of[-1,1]){const post=new THREE.Mesh(new THREE.BoxGeometry(.14,2.6,.14),mats.dark);post.position.set(s*(len/2-.08),1.3,0);grp.add(post);planks.push(post);}
   const diag=new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(len,2.2),.2,.06),wood);diag.rotation.z=Math.atan2(2.2,len);diag.position.set(0,1.3,.12);diag.castShadow=true;grp.add(diag);planks.push(diag);
   const sign=labelTex(256,128,(x,w,h)=>{x.fillStyle='#e8d8b0';x.fillRect(0,0,w,h);x.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<40;i++)x.fillRect(Math.random()*w,Math.random()*h,8,2);x.strokeStyle='#5a1a10';x.lineWidth=8;x.strokeRect(6,6,w-12,h-12);
    x.fillStyle='#7a1408';x.font=`64px ${DISP}`;x.textAlign='center';x.textBaseline='middle';x.fillText(d.cost.toLocaleString(),w/2,h/2+4);});
   for(const s of[-1,1]){const sm=new THREE.Mesh(new THREE.PlaneGeometry(.7,.35),new THREE.MeshStandardMaterial({map:sign,roughness:.8,emissive:0x2a1a0a,emissiveIntensity:.5}));sm.position.set(0,1.55,s*.17);if(s<0)sm.rotation.y=Math.PI;grp.add(sm);planks.push(sm);}
   G.add(grp);d.mesh=grp;d.parts=planks;}}
 buildItems(G,mats,T,gunModel){const std=o=>{const m=new THREE.MeshStandardMaterial(o);m.envMapIntensity=.5;return m;};
  for(const it of this.items){const yaw=Math.atan2(it.fx||0,it.fz||1);
   if(it.type==='wall'){const grp=new THREE.Group();grp.position.copy(it.pos);grp.rotation.y=yaw;
    const plaque=new THREE.Mesh(new THREE.BoxGeometry(1.1,.62,.05),mats.wood);plaque.position.z=.03;grp.add(plaque);
    const chalk=labelTex(256,64,(x,w,h)=>{x.fillStyle='#14100c';x.fillRect(0,0,w,h);x.fillStyle='#f0e6d0';x.font=`40px ${DISP}`;x.textAlign='center';x.textBaseline='middle';x.fillText(it.w.toUpperCase(),w/2,h/2+2);});
    const lab=new THREE.Mesh(new THREE.PlaneGeometry(.7,.17),new THREE.MeshStandardMaterial({map:chalk,emissive:0xffffff,emissiveMap:chalk,emissiveIntensity:.25}));lab.position.set(0,-.42,.03);grp.add(lab);
    const gm=gunModel(it.w,false,true);gm.scale.setScalar(1.25);gm.rotation.y=Math.PI/2;gm.position.set(0,.02,.12);grp.add(gm);it.gunMesh=gm;G.add(grp);it.mesh=grp;}
   else if(it.type==='perk'){const grp=new THREE.Group();grp.position.set(it.x+.5,0,it.z+.5);grp.rotation.y=yaw;const col=new THREE.Color(it.col);
    const body=new THREE.Mesh(new THREE.BoxGeometry(.9,2.05,.78),std({color:col,roughness:.35,metalness:.4}));body.position.y=1.03;body.castShadow=true;body.receiveShadow=true;grp.add(body);
    const trim=std({color:0x1a1a1c,roughness:.3,metalness:.8});const base=new THREE.Mesh(new THREE.BoxGeometry(.96,.12,.84),trim);base.position.y=.06;grp.add(base);const top=new THREE.Mesh(new THREE.BoxGeometry(.96,.1,.84),trim);top.position.y=2.07;grp.add(top);
    const face=labelTex(256,512,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#'+col.clone().multiplyScalar(.5).getHexString());g.addColorStop(1,'#111');x.fillStyle=g;x.fillRect(0,0,w,h);
     x.fillStyle='rgba(255,255,255,.9)';x.font=`52px ${DISP}`;x.textAlign='center';const words=it.name.split(' ');words.forEach((wd,k)=>x.fillText(wd,w/2,110+k*58));
     x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=6;x.beginPath();x.arc(w/2,340,62,0,TAU);x.stroke();perkIcon(x,it.id,w/2,340,48);x.font=`22px ${MONO}`;x.fillStyle='rgba(255,255,255,.7)';x.fillText(it.cost+' PTS',w/2,460);});
    const fm=new THREE.MeshStandardMaterial({map:face,emissive:0xffffff,emissiveMap:face,emissiveIntensity:.05,roughness:.25});const fp=new THREE.Mesh(new THREE.PlaneGeometry(.74,1.48),fm);fp.position.set(0,1.18,.395);grp.add(fp);
    const signM=new THREE.MeshBasicMaterial({color:col.clone().multiplyScalar(.15)});const sign=new THREE.Mesh(new THREE.BoxGeometry(.92,.26,.12),signM);sign.position.set(0,2.3,.3);grp.add(sign);
    const slot=new THREE.Mesh(new THREE.BoxGeometry(.5,.14,.06),std({color:0x080808,roughness:.4}));slot.position.set(0,.3,.38);grp.add(slot);
    it.fm=fm;it.signM=signM;it.colv=col;G.add(grp);it.mesh=grp;}
   else if(it.type==='forge'){const grp=new THREE.Group();grp.position.copy(it.pos);grp.rotation.y=Math.atan2(it.fx,it.fz);
    const brick=std({map:T.stone,color:0x8a5040,roughness:.9});const fur=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.3,.8),brick);fur.position.y=.65;fur.castShadow=true;grp.add(fur);
    const glowM=new THREE.MeshBasicMaterial({color:new THREE.Color(.25,.06,.02)});const mouth=new THREE.Mesh(new THREE.PlaneGeometry(.9,.42),glowM);mouth.position.set(0,.62,.405);grp.add(mouth);
    const chim=new THREE.Mesh(new THREE.BoxGeometry(.5,1.6,.5),brick);chim.position.set(-.55,2.0,-.1);grp.add(chim);
    const anvil=new THREE.Group();const aM=std({color:0x2a2a2e,metalness:.9,roughness:.35});const a1=new THREE.Mesh(new THREE.BoxGeometry(.5,.18,.22),aM);a1.position.y=.3;const a2=new THREE.Mesh(new THREE.BoxGeometry(.22,.3,.16),aM);a2.position.y=.12;const a3=new THREE.Mesh(new THREE.ConeGeometry(.09,.25,8),aM);a3.rotation.z=-Math.PI/2;a3.position.set(.36,.3,0);anvil.add(a1,a2,a3);anvil.position.set(.45,1.3,0);grp.add(anvil);
    it.glowM=glowM;G.add(grp);it.mesh=grp;it.pos=new V(it.pos.x+it.fx*.5,1.2,it.pos.z+it.fz*.5);}
   else if(it.type==='crate'){const s=it.spot;const grp=new THREE.Group();grp.position.copy(s.pos);grp.rotation.y=s.hz?0:Math.PI/2;
    const tarp=new THREE.Mesh(new THREE.SphereGeometry(.8,10,6,0,TAU,0,Math.PI/2),mats.cloth);tarp.scale.set(1.15,.55,.6);tarp.castShadow=true;grp.add(tarp);it.tarp=tarp;G.add(grp);it.mesh=grp;}
   else if(it.type==='power'){const grp=new THREE.Group();grp.position.set(it.x,0,it.z+.5);grp.rotation.y=-Math.PI/2;
    const box=new THREE.Mesh(new THREE.BoxGeometry(.8,1.1,.25),std({color:0x5a6066,roughness:.5,metalness:.7}));box.position.set(0,1.45,.13);box.castShadow=true;grp.add(box);
    const plate=labelTex(256,128,(x,w,h)=>{x.fillStyle='#d8b020';x.fillRect(0,0,w,h);x.fillStyle='#111';for(let i=-4;i<12;i++){x.beginPath();x.moveTo(i*32,0);x.lineTo(i*32+16,0);x.lineTo(i*32-16+16,h);x.lineTo(i*32-32+16,h);x.fill();}x.fillStyle='#111';x.fillRect(16,30,w-32,h-60);x.fillStyle='#ffd040';x.font=`40px ${DISP}`;x.textAlign='center';x.textBaseline='middle';x.fillText('MAIN POWER',w/2,h/2+2);});
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(.7,.35),new THREE.MeshStandardMaterial({map:plate,roughness:.6}));pl.position.set(0,2.2,.02);grp.add(pl);
    const lever=new THREE.Group();lever.position.set(0,1.45,.28);const arm=new THREE.Mesh(new THREE.BoxGeometry(.06,.5,.06),std({color:0x222222,metalness:.8,roughness:.3}));arm.position.y=.22;const knob=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),std({color:0xc02010,roughness:.4}));knob.position.y=.48;lever.add(arm,knob);lever.rotation.x=.9;grp.add(lever);
    const lampM=new THREE.MeshBasicMaterial({color:0x3a0800});const lamp=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),lampM);lamp.position.set(.28,1.85,.27);grp.add(lamp);it.lever=lever;it.lampM=lampM;G.add(grp);it.mesh=grp;it.pos=new V(it.x-.4,1.3,it.z+.5);}}}
 buildForest(G,T){// instanced pines: outside 'Y' tiles + a ring out into the fog
  const parts=[];const trunk=new THREE.CylinderGeometry(.12,.22,3,6).translate(0,1.5,0);parts.push([trunk,new THREE.Color(.16,.12,.1)]);
  for(let k=0;k<4;k++){const c=new THREE.ConeGeometry(1.9-k*.38,2.6,8).translate(0,2.6+k*1.45,0);parts.push([c,new THREE.Color(.06+k*.008,.1+k*.01,.08)]);}
  let n=0;for(const[gg]of parts)n+=(gg.index?gg.toNonIndexed():gg).attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
  for(const[gg,col]of parts){const g2=gg.index?gg.toNonIndexed():gg;g2.computeVertexNormals();const pp=g2.attributes.position,nn=g2.attributes.normal;for(let i=0;i<pp.count;i++){P.set([pp.getX(i),pp.getY(i),pp.getZ(i)],o*3);N.set([nn.getX(i),nn.getY(i),nn.getZ(i)],o*3);const v=.8+Math.random()*.25;C.set([col.r*v,col.g*v,col.b*v],o*3);o++;}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('color',new THREE.BufferAttribute(C,3));
  const spots=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(this.g[z][x]==='Y')spots.push([x+.5,z+.5]);
  for(let k=0;k<420;k++){const a=rr()*TAU,r=38+rr()*70;const x=W/2+Math.cos(a)*r,z=H/2+Math.sin(a)*r;if(x>-2&&x<W+2&&z>-2&&z<H+2)continue;spots.push([x,z]);}
  const im=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:true}),spots.length);const m=new THREE.Matrix4();
  spots.forEach(([x,z],i)=>{const s=1.1+rr()*1.1;m.compose(new V(x,0,z),new THREE.Quaternion().setFromAxisAngle(new V(0,1,0),rr()*TAU),new V(s,s*(.9+rr()*.4),s));im.setMatrixAt(i,m);});
  im.castShadow=true;im.receiveShadow=true;G.add(im);
  // mountain silhouettes against the horizon (unfogged)
  const pos=[];const seg=96;for(let k=0;k<seg;k++){const a0=k/seg*TAU,a1=(k+1)/seg*TAU,r=230;const h0=18+Math.sin(a0*3)*9+Math.sin(a0*7+1)*5+Math.sin(a0*13)*2,h1=18+Math.sin(a1*3)*9+Math.sin(a1*7+1)*5+Math.sin(a1*13)*2;
   const p0=[W/2+Math.cos(a0)*r,-5,H/2+Math.sin(a0)*r],p1=[W/2+Math.cos(a1)*r,-5,H/2+Math.sin(a1)*r];pos.push(...p0,...p1,p1[0],h1,p1[2],...p0,p1[0],h1,p1[2],p0[0],h0,p0[2]);}
  const mg=new THREE.BufferGeometry();mg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const mm=new THREE.Mesh(mg,new THREE.MeshBasicMaterial({color:0x06080e,fog:false,side:THREE.DoubleSide}));this.hills=mm;G.add(mm);}
 buildLights(G,mats){// area lights switch on with the power; braziers burn all night
  const L=this.lights=[];const fix=(x,y,z,col,int,dist,area,kind)=>{const l=new THREE.PointLight(col,0,dist,1.6);l.position.set(x,y,z);G.add(l);
   const bulbM=new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(.08)});let bulb;
   if(kind==='flood'){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,y,8),mats.steel);pole.position.set(x,y/2,z);G.add(pole);bulb=new THREE.Mesh(new THREE.BoxGeometry(.6,.3,.2),bulbM);bulb.position.set(x,y+.1,z);const hd=new THREE.Mesh(new THREE.BoxGeometry(.7,.36,.24),mats.dark);hd.position.set(x,y+.1,z-.08);G.add(hd);}
   else if(kind==='tube'){bulb=new THREE.Mesh(new THREE.BoxGeometry(1.4,.06,.12),bulbM);bulb.position.set(x,y+.15,z);}
   else{bulb=new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),bulbM);bulb.position.set(x,y+.12,z);const cord=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,.5),mats.dark);cord.position.set(x,y+.45,z);G.add(cord);}
   G.add(bulb);const o={l,int,bulbM,col:new THREE.Color(col),area,kind,flick:0,on:kind==='fire'};L.push(o);return o;};
  fix(36,6.2,27.6,0xcfe0ff,90,40,0,'flood');fix(13.5,3.1,34.5,0xffd6a0,30,20,1,'bulb');fix(15.5,4.0,14,0xffd0a0,42,22,2,'bulb');fix(42.5,3.6,14,0xe8f4ff,46,22,4,'tube');
  this.fires=[];for(let z=0;z<H;z++)for(let x=0;x<W;x++)if(this.g[z][x]==='i'){const l=new THREE.PointLight(0xff7a30,14,16,1.7);l.position.set(x+.5,1.5,z+.5);G.add(l);this.fires.push({l,x:x+.5,z:z+.5,base:14});}}
 setPower(on){for(const o of this.lights){o.on=on;o.flick=on?.6+Math.random()*.8:0;}}
 updateLights(dt,t){for(const o of this.lights){let k=o.on?1:0;if(o.flick>0){o.flick-=dt;k=Math.random()<.5?0:1;if(o.flick<=0)k=1;}o.l.intensity=o.int*k;o.bulbM.color.copy(o.col).multiplyScalar(k?(o.kind==='tube'?3:4):.06);}
  for(const f of this.fires){f.l.intensity=f.base*(.75+Math.sin(t*13+f.x)*.08+Math.sin(t*23.7+f.z)*.07+Math.random()*.12);}}
}
const DX=[1,-1,0,0,1,1,-1,-1],DZ=[0,0,1,-1,1,-1,1,-1];

// perk icons drawn with canvas paths (original glyphs)
export function perkIcon(x,id,cx,cy,r){x.save();x.translate(cx,cy);x.fillStyle='#fff';x.strokeStyle='#fff';x.lineWidth=r*.16;x.lineCap='round';x.lineJoin='round';
 if(id==='hide'){x.beginPath();x.moveTo(0,-r*.8);x.lineTo(r*.7,-r*.45);x.lineTo(r*.6,r*.25);x.quadraticCurveTo(r*.3,r*.7,0,r*.85);x.quadraticCurveTo(-r*.3,r*.7,-r*.6,r*.25);x.lineTo(-r*.7,-r*.45);x.closePath();x.fill();x.fillStyle='rgba(0,0,0,.55)';x.fillRect(-r*.1,-r*.45,r*.2,r*.9);x.fillRect(-r*.4,-r*.1,r*.8,r*.2);}
 else if(id==='hand'){x.beginPath();x.moveTo(r*.15,-r*.85);x.lineTo(-r*.45,r*.1);x.lineTo(-r*.02,r*.1);x.lineTo(-r*.2,r*.85);x.lineTo(r*.48,-r*.15);x.lineTo(r*.05,-r*.15);x.closePath();x.fill();}
 else if(id==='wind'){for(let k=0;k<3;k++){x.beginPath();x.arc(-r*.1,-r*.4+k*r*.4,r*(.45-k*.08),Math.PI*.9,Math.PI*2.25);x.stroke();}x.beginPath();x.moveTo(-r*.8,-r*.4);x.lineTo(r*.2,-r*.4);x.moveTo(-r*.8,0);x.lineTo(r*.35,0);x.moveTo(-r*.8,r*.4);x.lineTo(r*.15,r*.4);x.stroke();}
 else if(id==='fang'){for(const s of[-1,1]){x.beginPath();x.moveTo(s*r*.55,-r*.7);x.quadraticCurveTo(s*r*.6,r*.2,s*r*.12,r*.85);x.quadraticCurveTo(s*r*.2,r*.1,s*r*.05,-r*.7);x.closePath();x.fill();}}
 x.restore();}
