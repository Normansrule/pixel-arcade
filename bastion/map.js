// BASTION LINE — map runtime: smoothed enemy paths sampled every STEP units (with heights and bridges), the ground height
// field, river channels, city blocks and the build-placement test shared by the sim, the world builder and the cursor ghost.
import {MAPS} from './data.js';
import {cl,rng} from './util.js';

export const W=52,D=32,STEP=.5,PATH_W=1.7; // half extents of the diorama tile; path half width
const segD=(px,pz,ax,az,bx,bz)=>{const vx=bx-ax,vz=bz-az,l=vx*vx+vz*vz;let t=l?((px-ax)*vx+(pz-az)*vz)/l:0;t=t<0?0:t>1?1:t;return Math.hypot(px-ax-vx*t,pz-az-vz*t);};
function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
export function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,ux=fx*fx*(3-2*fx),uz=fz*fz*(3-2*fz);
 return(hash(ix,iz)*(1-ux)+hash(ix+1,iz)*ux)*(1-uz)+(hash(ix,iz+1)*(1-ux)+hash(ix+1,iz+1)*ux)*uz;}
const fbm=(x,z)=>noise(x,z)*.55+noise(x*2.1+7,z*2.1)*.3+noise(x*4.3+3,z*4.3)*.15;
// centripetal-ish Catmull-Rom through the control points, resampled at even spacing
function smooth(pts,step){const raw=[];const P=i=>pts[cl(i,0,pts.length-1)];
 for(let i=0;i<pts.length-1;i++){const p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);for(let k=0;k<16;k++){const t=k/16,t2=t*t,t3=t2*t;
  const f=(a,b,c,d)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);raw.push([f(p0[0],p1[0],p2[0],p3[0]),f(p0[1],p1[1],p2[1],p3[1])]);}}
 raw.push(pts[pts.length-1]);const out=[raw[0]];let acc=0;
 for(let i=1;i<raw.length;i++){let[ax,az]=out[out.length-1];const[bx,bz]=raw[i];let d=Math.hypot(bx-ax,bz-az)+acc;
  while(d>=step){const k=(step-acc)/Math.hypot(bx-ax,bz-az);ax+=(bx-ax)*k;az+=(bz-az)*k;out.push([ax,az]);d-=step;acc=0;}acc=d;}
 return out;}
export function makeMap(idx){const Dm=MAPS[idx],M={idx,id:Dm.id,n:Dm.n,D:Dm,blocks:[],bridges:[]};const r=rng(17+idx*31);
 // rivers (delta): smoothed polylines; distance gives the channel
 const rivers=(Dm.rivers||[]).map(p=>smooth(p,1));
 const riverD=(x,z)=>{let b=99;for(const rv of rivers)for(let i=0;i<rv.length-1;i++){const a=rv[i],c=rv[i+1];if(Math.abs(a[0]-x)>8&&Math.abs(a[1]-z)>8)continue;b=Math.min(b,segD(x,z,a[0],a[1],c[0],c[1]));}return b;};
 // paths: clip to the tile so enemies enter at the edge
 const paths=Dm.paths.map(p=>smooth(p,STEP).filter(([x,z])=>Math.abs(x)<=W-.5&&Math.abs(z)<=D-.5));
 // distance-to-path grid (0.5 cells) for placement and ground shaping
 const GS=.5,GX=Math.ceil(W*2/GS)+1,GZ=Math.ceil(D*2/GS)+1,pd=new Float32Array(GX*GZ).fill(99);
 for(const p of paths)for(const[x,z]of p){const ci=Math.round((x+W)/GS),cj=Math.round((z+D)/GS);for(let j=-14;j<=14;j++)for(let i=-14;i<=14;i++){const a=ci+i,b=cj+j;if(a<0||b<0||a>=GX||b>=GZ)continue;
  const d=Math.hypot(a*GS-W-x,b*GS-D-z);if(d<pd[b*GX+a])pd[b*GX+a]=d;}}
 M.pathD=(x,z)=>{const a=Math.round((x+W)/GS),b=Math.round((z+D)/GS);return a<0||b<0||a>=GX||b>=GZ?99:pd[b*GX+a];};
 // rocks / spires and city blocks
 const rocks=(Dm.rocks||[]).filter(([x,z,rr])=>M.pathD(x,z)>rr+2);M.rocks=rocks;
 if(Dm.city){for(let gz=-28;gz<=28;gz+=7)for(let gx=-48;gx<=48;gx+=7){const x=gx+(r()-.5)*2,z=gz+(r()-.5)*2,w=3+r()*2.5,d=3+r()*2.5;
   if(M.pathD(x,z)<Math.max(w,d)*.75+2.4||Math.hypot(x-4,z-4)<5||r()<.22)continue;M.blocks.push({x,z,w,d,h:1.5+r()*4.5,rot:(r()-.5)*.2,ruin:r()});}}
 const inBlock=(x,z,pad=0)=>M.blocks.some(b=>Math.abs(x-b.x)<b.w/2+pad&&Math.abs(z-b.z)<b.d/2+pad);
 const base=(x,z)=>{let h=(fbm(x*.08,z*.08)-.5)*.9;
  if(Dm.snow){const e=Math.max(0,-z-20)/12;h+=e*e*9*(.7+fbm(x*.12,3)*.6);for(const[rx,rz,rr]of rocks){const d=Math.hypot(x-rx,z-rz)/rr;if(d<1.4)h+=Math.max(0,1-d)**1.5*rr*1.6*(.8+fbm(x*.4,z*.4)*.5);}}
  if(rivers.length){const rd=riverD(x,z);if(rd<4.5)h=Math.min(h,-1.5+Math.max(0,rd-2)*.5);h+=Math.max(0,1-rd/12)*-.2;}
  return h;};
 M.height=(x,z)=>{let h=base(x,z);const pdd=M.pathD(x,z);if(pdd<3.4){const k=cl((3.4-pdd)/1.4,0,1);h+=(pathLevel(x,z)-h)*k;}return h;};
 const pathLevel=(x,z)=>{const h=(fbm(x*.08,z*.08)-.5)*.5;return rivers.length?Math.max(h,riverD(x,z)<4.5?-1.6:-.1):h;};
 M.riverD=riverD;M.water=rivers.length?-.5:null;M.inBlock=inBlock;
 M.paths=paths.map(p=>{const n=p.length,X=new Float32Array(n),Z=new Float32Array(n),Y=new Float32Array(n);
  p.forEach(([x,z],i)=>{X[i]=x;Z[i]=z;Y[i]=Math.max(M.height(x,z),M.water!=null?.22:-9);});return{X,Z,Y,n,len:(n-1)*STEP};});
 // bridges: path spans that cross a river channel
 if(M.water!=null)M.paths.forEach((P,pi)=>{let s=-1;for(let i=0;i<P.n;i++){const wet=riverD(P.X[i],P.Z[i])<4.2;if(wet&&s<0)s=i;if((!wet||i===P.n-1)&&s>=0){const a=Math.max(0,s-3),b=Math.min(P.n-1,i+2);
   const dup=M.bridges.some(br=>Math.hypot(br.ax-P.X[a],br.az-P.Z[a])<2&&Math.hypot(br.bx-P.X[b],br.bz-P.Z[b])<2);if(!dup)M.bridges.push({ax:P.X[a],az:P.Z[a],bx:P.X[b],bz:P.Z[b],pi,a,b});s=-1;}}});
 // position on a path at distance d with lateral offset off
 M.pos=(pi,d,off,o)=>{const P=M.paths[pi];const f=cl(d/STEP,0,P.n-1.001),i=f|0,k=f-i;const x0=P.X[i],z0=P.Z[i],x1=P.X[i+1],z1=P.Z[i+1];const tx=x1-x0,tz=z1-z0,l=Math.hypot(tx,tz)||1;
  o.x=x0+tx*k+(-tz/l)*off;o.z=z0+tz*k+(tx/l)*off;o.y=P.Y[i]+(P.Y[i+1]-P.Y[i])*k;o.yaw=Math.atan2(tx,tz);return o;};
 M.end=M.paths.map(P=>[P.X[P.n-1],P.Z[P.n-1]]);M.start=M.paths.map(P=>[P.X[0],P.Z[0]]);
 // build placement: 0 ok, or a reason string
 M.canBuild=(x,z,towers,hero)=>{if(Math.abs(x)>W-2||Math.abs(z)>D-2)return'Out of bounds';if(M.pathD(x,z)<PATH_W+1.15)return'Too close to the road';
  if(M.water!=null&&riverD(x,z)<4.4)return'Cannot build on water';if(inBlock(x,z,.9))return'Blocked by ruins';
  const h=M.height(x,z);if(h>1.6)return'Too steep';if(Math.abs(M.height(x+1,z)-M.height(x-1,z))+Math.abs(M.height(x,z+1)-M.height(x,z-1))>1.3)return'Too steep';
  for(const t of towers)if(Math.hypot(t.x-x,t.z-z)<2.5)return'Too close to another tower';if(hero&&Math.hypot(hero.x-x,hero.z-z)<1.8)return'Hero is standing there';return 0;};
 return M;}
