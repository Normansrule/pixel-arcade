// AEONFALL — the Sundered Vale: a three-lane map, mirrored across the river (x,z)->(z,x).
// Dawn (team 0) holds the south-west corner, Dusk (team 1) the north-east. The walkable area is the union of
// lanes, river, bases, boss pits, camp clearings and jungle corridors; everything else is cliff and forest.
import {cl,segDist,polyDist,polyLen,polyAt} from './util.js';

export const SIZE=200,HALF=100;
const M=([x,z])=>[z,x];
// lanes from Dawn's base to Dusk's base
export const LANES={
 top:[[-76,64],[-79,-48],[-70,-70],[-48,-79],[64,-76]],
 mid:[[-62,62],[62,-62]],
 bot:[[-64,76],[48,79],[70,70],[79,48],[76,-64]]};
export const LANE_IDS=['top','mid','bot'];
export const LEN={};for(const k of LANE_IDS)LEN[k]=polyLen(LANES[k]);
export const CORE=[[-84,84],[84,-84]],FOUNTAIN=[[-90,90],[90,-90]],BASE_R=28;
export const PITS={warden:[-36,-36],drake:[36,36]};
// Dawn-side jungle camps (Dusk's are mirrored)
const CAMPS0=[
 {id:'azure',x:-50,z:10,kind:'azure'},{id:'bog',x:-65,z:-4,kind:'bog'},{id:'wolves',x:-45,z:30,kind:'wolves'},
 {id:'crimson',x:-10,z:50,kind:'crimson'},{id:'stone',x:4,z:65,kind:'stone'},{id:'beaks',x:-30,z:45,kind:'beaks'}];
export const CAMPS=[...CAMPS0.map(c=>({...c,side:0})),...CAMPS0.map(c=>({...c,id:c.id+'2',x:c.z,z:c.x,side:1}))];
const COR0=[[[-73,40],[-50,10]],[[-50,10],[-65,-4]],[[-65,-4],[-77,-22]],[[-50,10],[-45,30]],[[-45,30],[-33,33]],[[-50,10],[-30,-8]],[[-30,-8],[-22,-22]],
 [[-65,-4],[-52,-28]],[[-52,-28],[-38,-38]],[[-62,42],[-45,30]],
 [[-40,73],[-10,50]],[[-10,50],[4,65]],[[4,65],[22,77]],[[-10,50],[-30,45]],[[-30,45],[-33,33]],[[-10,50],[8,30]],[[8,30],[22,22]],
 [[4,65],[28,52]],[[28,52],[38,38]],[[-42,62],[-30,45]]];
export const CORRIDORS=[...COR0,...COR0.map(([a,b])=>[M(a),M(b)])];
const RIVER=[[-92,-92],[92,92]];
// signed "openness": negative = walkable, positive = depth into the cliffs
export function field(x,z){
 let f=1e9;
 for(const k of LANE_IDS){const d=polyDist(x,z,LANES[k])-7.5;if(d<f)f=d;}
 {const d=segDist(x,z,RIVER[0][0],RIVER[0][1],RIVER[1][0],RIVER[1][1])-7.5;if(d<f)f=d;}
 for(const c of CORE){const d=Math.hypot(x-c[0],z-c[1])-BASE_R;if(d<f)f=d;}
 for(const k in PITS){const p=PITS[k];const d=Math.hypot(x-p[0],z-p[1])-10;if(d<f)f=d;}
 for(const c of CAMPS){const d=Math.hypot(x-c.x,z-c.z)-6.5;if(d<f)f=d;}
 for(const[a,b]of CORRIDORS){const d=segDist(x,z,a[0],a[1],b[0],b[1])-4.2;if(d<f)f=d;}
 const bd=Math.max(Math.abs(x),Math.abs(z))-95.5;return Math.max(f,bd);}
// how far a point is into the river (0 outside, 1 at the centre line)
export function riverK(x,z){const d=Math.abs(x-z)/Math.SQRT2;return cl(1-d/7.5,0,1)*(Math.max(Math.abs(x),Math.abs(z))<90?1:0);}
export function laneK(x,z){let m=1e9;for(const k of LANE_IDS){const d=polyDist(x,z,LANES[k]);if(d<m)m=d;}return cl(1-(m-3.5)/4,0,1);}
export function height(x,z){const f=field(x,z);let h=0;if(f>0)h=Math.min(1,f/3.2)**.8*3.2+Math.max(0,f-6)*.05;const r=riverK(x,z);h-=r*r*(3-2*r)*.9;return h;}

/* ---------------- navigation grid (1 unit cells) ---------------- */
export const N=200;
export const grid=new Uint8Array(N*N); // 1 = blocked
for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=i-HALF+.5,z=j-HALF+.5;grid[j*N+i]=field(x,z)>-.6?1:0;}
export const cell=(x,z)=>{const i=Math.floor(x+HALF),j=Math.floor(z+HALF);return i<0||j<0||i>=N||j>=N?-1:j*N+i;};
export function walk(x,z){const c=cell(x,z);return c>=0&&!grid[c];}
// nearest walkable point (spiral search)
export function nearestOpen(x,z){if(walk(x,z))return[x,z];for(let r=1;r<30;r++)for(let a=0;a<16;a++){const t=a/16*Math.PI*2,px=x+Math.cos(t)*r*.7,pz=z+Math.sin(t)*r*.7;if(walk(px,pz))return[px,pz];}return[x,z];}
// straight walkable line?
export function los(ax,az,bx,bz){const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.45);for(let k=1;k<=n;k++){const t=k/n;if(!walk(ax+(bx-ax)*t,az+(bz-az)*t))return false;}return true;}
// last walkable point along a straight line (for dashes and blinks: land on the far side of thin walls if open)
export function dashEnd(ax,az,bx,bz,overWalls){if(overWalls){if(walk(bx,bz))return[bx,bz];const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.4);for(let k=n;k>=0;k--){const t=k/n,px=ax+(bx-ax)*t,pz=az+(bz-az)*t;if(walk(px,pz))return[px,pz];}return[ax,az];}
 const d=Math.hypot(bx-ax,bz-az),n=Math.ceil(d/.4);let lx=ax,lz=az;for(let k=1;k<=n;k++){const t=k/n,px=ax+(bx-ax)*t,pz=az+(bz-az)*t;if(!walk(px,pz))break;lx=px;lz=pz;}return[lx,lz];}
// A* on the grid (8-neighbour, octile), then string-pulled with line of sight
const G=new Float32Array(N*N),F=new Float32Array(N*N),P=new Int32Array(N*N),S=new Uint32Array(N*N);let stamp=1;
const heap=[];
function hpush(i){heap.push(i);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(F[heap[p]]<=F[heap[k]])break;[heap[p],heap[k]]=[heap[k],heap[p]];k=p;}}
function hpop(){const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=k*2+1,r=l+1;let m=k;if(l<heap.length&&F[heap[l]]<F[heap[m]])m=l;if(r<heap.length&&F[heap[r]]<F[heap[m]])m=r;if(m===k)break;[heap[m],heap[k]]=[heap[k],heap[m]];k=m;}}return top;}
export function path(ax,az,bx,bz){
 if(!walk(bx,bz))[bx,bz]=nearestOpen(bx,bz);
 if(los(ax,az,bx,bz))return[[bx,bz]];
 let s=cell(ax,az);if(s<0||grid[s]){const o=nearestOpen(ax,az);s=cell(o[0],o[1]);}const e=cell(bx,bz);if(s<0||e<0)return[[bx,bz]];
 stamp++;heap.length=0;const ei=e%N,ej=(e/N)|0;const h=c=>{const dx=Math.abs(c%N-ei),dz=Math.abs(((c/N)|0)-ej);return Math.max(dx,dz)+.414*Math.min(dx,dz);};
 G[s]=0;F[s]=h(s);P[s]=-1;S[s]=stamp*2;hpush(s);let found=false,it=0;
 while(heap.length&&it++<30000){const c=hpop();if(c===e){found=true;break;}if(S[c]===stamp*2+1)continue;S[c]=stamp*2+1;const ci=c%N,cj=(c/N)|0;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N||nj>=N)continue;const nc=nj*N+ni;if(grid[nc])continue;
   if(di&&dj&&(grid[cj*N+ni]||grid[nj*N+ci]))continue;const g=G[c]+(di&&dj?1.414:1);
   if(S[nc]!==stamp*2&&S[nc]!==stamp*2+1||g<G[nc]){if(S[nc]===stamp*2+1&&g>=G[nc])continue;G[nc]=g;F[nc]=g+h(nc);P[nc]=c;S[nc]=stamp*2;hpush(nc);}}}
 if(!found)return[[bx,bz]];
 const pts=[];for(let c=e;c!==-1;c=P[c])pts.push([c%N-HALF+.5,((c/N)|0)-HALF+.5]);pts.reverse();pts[pts.length-1]=[bx,bz];
 // string pull
 const out=[];let cx=ax,cz=az,i=0;while(i<pts.length-1){let j=pts.length-1;while(j>i+1&&!los(cx,cz,pts[j][0],pts[j][1]))j--;out.push(pts[j]);cx=pts[j][0];cz=pts[j][1];i=j;}
 if(!out.length)out.push([bx,bz]);return out;}

/* ---------------- structures ---------------- */
// tower slots along each lane, by arc length from the owner's base end
const SLOTS={top:[100,52,13],mid:[57,35,13],bot:[100,52,13]};
export function structures(){const out=[];
 for(const team of[0,1])for(const k of LANE_IDS){const pts=team?[...LANES[k]].reverse():LANES[k];const L=LEN[k];
  SLOTS[k].forEach((s,i)=>{const p=polyAt(pts,s);out.push({kind:'tower',team,lane:k,tier:3-i,x:p.x,z:p.z});});
  const p=polyAt(pts,4.5);out.push({kind:'inhib',team,lane:k,tier:0,x:p.x,z:p.z});}
 for(const team of[0,1]){const[cx,cz]=CORE[team],s=team?-1:1;out.push({kind:'tower',team,lane:'core',tier:0,x:cx+7*s,z:cz-3*s},{kind:'tower',team,lane:'core',tier:0,x:cx+3*s,z:cz-7*s});out.push({kind:'core',team,x:cx,z:cz});}
 return out;}
export function laneFor(team,k){return team?[...LANES[k]].reverse():LANES[k];}
