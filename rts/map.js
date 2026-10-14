// SHARDWAR — skirmish maps. Gameplay is 2D on a grid of CS-metre cells; the 3D terrain is raised into cliffs wherever a
// ridge or rock shape blocks the ground. Map 0 "Ashen Steppe" (1v1, point-mirrored) and map 1 "Twin Fords" (2v2,
// mirrored across a river with three fords). Each base lists its ore nodes and aether vents.
import {CS,ORE_NODE,VENT} from './data.js';
import {cl,rng} from './util.js';

const segD=(px,pz,ax,az,bx,bz)=>{const vx=bx-ax,vz=bz-az,l=vx*vx+vz*vz;let t=l?((px-ax)*vx+(pz-az)*vz)/l:0;t=t<0?0:t>1?1:t;return Math.hypot(px-ax-vx*t,pz-az-vz*t);};
const MAPS=[
 {id:'steppe',name:'ASHEN STEPPE',mode:'1V1',size:176,players:2,sym:'point',tint:'#a89a74',
  desc:'Two walled plateaus at opposite corners, open steppe between. Natural expansions just below each ramp.',
  mains:[[-62,60,-1,1],[62,-60,1,-1]],
  expos:[[-70,6,-1,0],[70,-6,1,0],[-10,70,0,1],[10,-70,0,-1],[-30,-30,-1,-1],[30,30,1,1]],
  shapes:[
   {t:'seg',a:[-90,30],b:[-46,30],w:5},{t:'seg',a:[-34,42],b:[-34,90],w:5},
   {t:'circ',x:0,z:0,r:7},{t:'circ',x:-6,z:6,r:4},{t:'circ',x:6,z:-6,r:4},
   {t:'circ',x:-22,z:14,r:4.5},{t:'circ',x:-48,z:-14,r:5,k:'trees'},{t:'circ',x:-64,z:-36,r:7,k:'trees'},{t:'circ',x:-26,z:46,r:4,k:'trees'},
   {t:'circ',x:-80,z:-70,r:12,k:'trees'},{t:'circ',x:-50,z:-60,r:6},{t:'seg',a:[-20,-50],b:[-8,-36],w:4}]},
 {id:'fords',name:'TWIN FORDS',mode:'2V2',size:224,players:4,sym:'mirror',tint:'#8aa070',
  desc:'Two allied plateaus per side, split by a river you can only cross at three fords. Expansions along every bank.',
  mains:[[-84,70,-1,1],[-84,-70,-1,-1],[84,-70,1,-1],[84,70,1,1]],
  expos:[[-90,0,-1,0],[90,0,1,0],[-34,-92,0,-1],[34,-92,0,-1],[-34,92,0,1],[34,92,0,1],[-30,0,-1,0],[30,0,1,0]],
  shapes:[
   {t:'seg',a:[-114,42],b:[-70,42],w:5},{t:'seg',a:[-58,54],b:[-58,114],w:5},{t:'seg',a:[-114,-42],b:[-70,-42],w:5},{t:'seg',a:[-58,-54],b:[-58,-114],w:5},
   {t:'circ',x:-46,z:-30,r:5},{t:'circ',x:-46,z:30,r:5},{t:'circ',x:-60,z:0,r:4,k:'trees'},{t:'circ',x:-20,z:-46,r:5,k:'trees'},{t:'circ',x:-20,z:46,r:5,k:'trees'},
   {t:'circ',x:-16,z:-112,r:9,k:'trees'},{t:'circ',x:-16,z:112,r:9,k:'trees'}],
  river:{w:11,fords:[[-70,9],[0,10],[70,9]]}}];
export const MAP_LIST=MAPS.map(m=>({id:m.id,name:m.name,mode:m.mode,desc:m.desc,players:m.players}));

export function makeMap(idx){const D=MAPS[idx],size=D.size,half=size/2,N=size/CS;
 // mirror helper: steppe is point-symmetric, fords mirrors x -> -x
 const shapes=[];for(const s of D.shapes){shapes.push(s);const m=D.sym==='point'?([x,z])=>[-x,-z]:([x,z])=>[-x,z];
  shapes.push(s.t==='seg'?{...s,a:m(s.a),b:m(s.b)}:{...s,x:m([s.x,s.z])[0],z:m([s.x,s.z])[1]});}
 const riv=D.river;
 // signed distance to the nearest obstacle (negative inside), separate for rocks/cliffs and trees
 function field(x,z){let f=1e9,ft=1e9;for(const s of shapes){const d=s.t==='seg'?segD(x,z,s.a[0],s.a[1],s.b[0],s.b[1])-s.w/2:Math.hypot(x-s.x,z-s.z)-s.r;if(s.k==='trees')ft=Math.min(ft,d);else f=Math.min(f,d);}
  const e=half-Math.max(Math.abs(x),Math.abs(z))-3;f=Math.min(f,e);return[f,ft];}
 function riverK(x,z){if(!riv)return 0;const w=riv.w/2+Math.sin(z*.07)*1.2;const d=Math.abs(x-Math.sin(z*.05)*2)-w;return d<0?1:Math.max(0,1-d/3);}
 function fordK(z){if(!riv)return 0;let k=0;for(const[fz,fw]of riv.fords)k=Math.max(k,cl((fw-Math.abs(z-fz))/3,0,1));return k;}
 const R=rng(idx*77+5),NV=new Float32Array(64*64).map(()=>R());
 const noise=(x,z)=>{x=x/11+500;z=z/11+500;const i=Math.floor(x),j=Math.floor(z),fx=x-i,fz=z-j,s=t=>t*t*(3-2*t);const g=(a,b)=>NV[(b&63)*64+(a&63)];const a=g(i,j),b=g(i+1,j),c=g(i,j+1),d=g(i+1,j+1);return a+(b-a)*s(fx)+(c-a)*s(fz)+(a-b-c+d)*s(fx)*s(fz);};
 function height(x,z){const[f]=field(x,z);let h=(noise(x,z)-.5)*.6;if(f<1.5)h+=cl((1.5-f)/3.2,0,1)**.8*5.5;const rk=riverK(x,z);if(rk>0)h-=rk*(1-fordK(z))*1.6+rk*fordK(z)*.25;return h;}
 // gameplay grid
 const blk=new Uint8Array(N*N);
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-half+(i+.5)*CS,z=-half+(j+.5)*CS;const[f,ft]=field(x,z);let b=f<.3||ft<.2;if(riv&&riverK(x,z)>=.99&&fordK(z)<.5)b=true;if(b)blk[j*N+i]=1;}
 // bases: main / expansion, each with ore nodes (1 cell) in an arc at the back and two aether vents (2x2 cells)
 const snapOdd=v=>(Math.floor(v/CS)+.5)*CS,snapEven=v=>Math.round(v/CS)*CS;
 const bases=[];const mk=([x,z,bx,bz],main)=>{const l=Math.hypot(bx,bz),ux=bx/l,uz=bz/l,b={x:snapEven(x),z:snapEven(z),main,ore:[],vents:[],back:[ux,uz]};
  const used=new Set();const a0=Math.atan2(ux,uz);for(let k=0;k<8;k++){const a=a0+(k-3.5)*.27,rr=10.5+(k%2)*1.6;let ox=snapOdd(b.x+Math.sin(a)*rr),oz=snapOdd(b.z+Math.cos(a)*rr);const key=ox+','+oz;if(used.has(key))continue;used.add(key);b.ore.push([ox,oz,ORE_NODE*(k%2?.8:1)|0]);}
  for(const s of[-1,1]){const a=a0+s*1.75;b.vents.push([snapEven(b.x+Math.sin(a)*11.5),snapEven(b.z+Math.cos(a)*11.5),VENT]);}bases.push(b);};
 D.mains.forEach(m=>mk(m,true));D.expos.forEach(m=>mk(m,false));
 return{idx,id:D.id,name:D.name,mode:D.mode,size,half,N,blk,bases,mains:bases.filter(b=>b.main),shapes,height,field,riverK,fordK,noise,river:!!riv,tint:D.tint,players:D.players};}
