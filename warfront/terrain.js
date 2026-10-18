// IRON VANGUARD — the Ashvale valley: heightfield with a carved river, villages, hills, forests and two HQs.
// Owns all gameplay geometry: terrain + box colliders (buildings, bridge, trunks, destructibles), raycasts, ground / water
// queries, circle collision and a coarse 4 m navigation grid with weighted A*.
import {V,PI,cl,lerp,sstep,mulberry,fbm,rayAABB} from './util.js';

export const EXT=400,N=257,STEP=2*EXT/(N-1),PLAY=350,WL=-.6,DECK=2.7,RIVER_HW=12,STEPUP=.55;
export const riverZ=x=>16*Math.sin(x*.0105+.4)+9*Math.sin(x*.024+1.3)-4;
export const BRIDGE={x:0,z:riverZ(0),hw:4.6,hl:19};
export const FORD={x0:228,x1:292};
export const HQ=[{x:0,z:322,yaw:PI,name:'VANGUARD HQ'},{x:0,z:-322,yaw:0,name:'KORVAN HQ'}];
export const POINTS=[
 {id:'A',name:'MILLBROOK',x:-178,z:182,kind:'village',r:22},
 {id:'B',name:'HOLLOW FARM',x:186,z:168,kind:'farm',r:22},
 {id:'C',name:'KESTREL BRIDGE',x:0,z:BRIDGE.z,kind:'bridge',r:20},
 {id:'D',name:'RADAR HILL',x:-196,z:-166,kind:'hill',r:20},
 {id:'E',name:'VARNA CHAPEL',x:182,z:-180,kind:'chapel',r:22}];
const gauss=(dx,dz,s)=>Math.exp(-(dx*dx+dz*dz)/(2*s*s));
export function riverDist(x,z){const dz=z-riverZ(x),sl=(riverZ(x+1)-riverZ(x-1))/2;return Math.abs(dz)/Math.sqrt(1+sl*sl);}
const ROADS=[[[0,330],[0,250],[-60,190],[-178,182]],[[0,250],[90,200],[186,168]],[[0,250],[10,120],[4,BRIDGE.z+26],[0,BRIDGE.z],[-4,BRIDGE.z-26],[-12,-110],[0,-250],[0,-330]],
 [[0,-250],[-80,-200],[-196,-166]],[[0,-250],[90,-210],[182,-180]],[[-178,182],[-110,90],[-20,40],[4,BRIDGE.z+26]],[[182,-180],[150,-90],[30,-30],[-4,BRIDGE.z-26]],
 [[186,168],[240,80],[262,riverZ(262)],[250,-80],[182,-180]],[[-196,-166],[-230,-60],[-210,80],[-178,182]]];

export class World{
 constructor(seed=7){this.seed=seed;const r=this.r=mulberry(seed);this.flats=[];this.boxes=[];this.dest=[];this.trees=[];this.bushes=[];this.rocks=[];this.houses=[];this.props=[];this.decor=[];this.roads=ROADS;
  this.layout();this.genHeights();this.buildStructures();this.scatter();this.finalize();}
 /* ---------------- terrain ---------------- */
 rawH(x,z){let h=3+fbm(x*.0055,z*.0055,4,3)*10+fbm(x*.021,z*.021,3,9)*2.4;
  h+=27*gauss(x+196,z+166,52)+12*gauss(x-118,z-40,55)+11*gauss(x+92,z-108,46)+9*gauss(x-70,z+118,40)+16*gauss(x-268,z+10,62)+13*gauss(x+282,z-30,60)+8*gauss(x+40,z+300,50)+8*gauss(x-60,z-290,50);
  const e=Math.max(Math.abs(x),Math.abs(z))-PLAY+30;if(e>0){const n=fbm(x*.013,z*.013,4,1)*.5+.5,rg=1-Math.abs(fbm(x*.028,z*.028,3,5));h+=Math.pow(e/60,1.5)*(14+46*n*n)+e*rg*.3*Math.min(1,e/40);}
  const d=riverDist(x,z),ford=x>FORD.x0&&x<FORD.x1?sstep(FORD.x0,FORD.x0+20,x)*sstep(FORD.x1,FORD.x1-20,x):0,bed=WL-2.1+ford*1.55;
  const bank=Math.max(h,WL+1.1+sstep(RIVER_HW+30,RIVER_HW+60,d)*3);const t=sstep(RIVER_HW-5,RIVER_HW+14,d);return lerp(bed,bank,t);}
 genHeights(){const H=this.H=new Float32Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=-EXT+i*STEP,z=-EXT+j*STEP;let y=this.rawH(x,z);
   for(const f of this.flats){const dx=Math.max(f.x0-x,0,x-f.x1),dz=Math.max(f.z0-z,0,z-f.z1),dr=Math.hypot(dx,dz);if(dr>=f.blend)continue;const w=1-sstep(0,f.blend,dr);y=lerp(y,f.y,w);}
   H[j*N+i]=y;}
  this.makeCraters();}
 // shell craters across the open fields (own RNG so the rest of the layout is unchanged): bowl + raised rim baked into the heightfield
 roadDist(x,z){let b=1e9;for(const rd of ROADS)for(let i=1;i<rd.length;i++){const[ax,az]=rd[i-1],[bx,bz]=rd[i],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz,t=cl(((x-ax)*dx+(z-az)*dz)/l2,0,1);b=Math.min(b,Math.hypot(x-ax-dx*t,z-az-dz*t));}return b;}
 makeCraters(){const r=mulberry(this.seed*31+5),H=this.H;this.craters=[];let tries=0;
  while(this.craters.length<46&&tries++<4000){const band=r()<.6,x=(r()*2-1)*(PLAY-30),z=band?(r()*2-1)*170:(r()*2-1)*(PLAY-40);
   if(riverDist(x,z)<RIVER_HW+12||this.roadDist(x,z)<9||this.forestK(x,z)>.32)continue;if(this.flats.some(f=>x>f.x0-f.blend*.6&&x<f.x1+f.blend*.6&&z>f.z0-f.blend*.6&&z<f.z1+f.blend*.6))continue;
   if(Math.abs(z-HQ[0].z)<60||Math.abs(z-HQ[1].z)<60)continue;if(this.craters.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+9))continue;
   const big=r()<.3,R=big?5+r()*2:3+r()*1.6,D=big?1.5+r()*.6:.8+r()*.5;this.craters.push({x,z,r:R,d:D});
   const i0=Math.max(0,Math.floor((x-R*1.8+EXT)/STEP)),i1=Math.min(N-1,Math.ceil((x+R*1.8+EXT)/STEP)),j0=Math.max(0,Math.floor((z-R*1.8+EXT)/STEP)),j1=Math.min(N-1,Math.ceil((z+R*1.8+EXT)/STEP));
   for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.hypot(-EXT+i*STEP-x,-EXT+j*STEP-z)/R;if(d>1.8)continue;H[j*N+i]+=-D*Math.max(0,1-d*d)*1.15+D*.38*Math.exp(-Math.pow((d-1.05)/.32,2));}}}
 height(x,z){const gx=(x+EXT)/STEP,gz=(z+EXT)/STEP;if(gx<0||gz<0||gx>=N-1||gz>=N-1)return 60;const i=gx|0,j=gz|0,fx=gx-i,fz=gz-j,h=this.H,a=h[j*N+i],b=h[j*N+i+1],c=h[(j+1)*N+i],d=h[(j+1)*N+i+1];
  return a+(b-a)*fx+(c-a)*fz+(a-b-c+d)*fx*fz;}
 normal(x,z,out=new V()){const e=1.6;return out.set(this.height(x-e,z)-this.height(x+e,z),2*e,this.height(x,z-e)-this.height(x,z+e)).normalize();}
 // water depth at (x,z) (0 on land)
 depth(x,z){const h=this.height(x,z);return h<WL?WL-h:0;}
 inWater(x,z){return this.height(x,z)<WL-.05&&!this.onBridge(x,z);}
 onBridge(x,z){return Math.abs(x-BRIDGE.x)<BRIDGE.hw&&Math.abs(z-BRIDGE.z)<BRIDGE.hl+2;}
 /* ---------------- layout: flats for every built site ---------------- */
 flat(x,z,w,d,blend=14,y){this.flats.push({x0:x-w/2,z0:z-d/2,x1:x+w/2,z1:z+d/2,y:y??this.rawH(x,z),blend});}
 layout(){const r=this.r;
  for(const h of HQ){h.y=Math.max(4,this.rawH(h.x,h.z));this.flat(h.x,h.z,70,46,26,h.y);}
  // bridge approaches at deck height
  const bz=BRIDGE.z;this.flats.push({x0:-7,z0:bz+BRIDGE.hl-3,x1:7,z1:bz+BRIDGE.hl+14,y:DECK,blend:22},{x0:-7,z0:bz-BRIDGE.hl-14,x1:7,z1:bz-BRIDGE.hl+3,y:DECK,blend:22});
  for(const p of POINTS){if(p.kind==='bridge'){p.y=DECK;continue;}const y=this.rawH(p.x,p.z);p.y=y;this.flat(p.x,p.z,26,26,22,y);
   // houses around the square
   const n=p.kind==='village'?7:p.kind==='chapel'?5:p.kind==='farm'?2:0;let made=0,tries=0;p.sites=[];
   while(made<n&&tries++<300){const a=r()*PI*2,d=24+r()*30,x=Math.round((p.x+Math.cos(a)*d)*2)/2,z=Math.round((p.z+Math.sin(a)*d)*2)/2;const w=7+(r()*4|0),dd=6+(r()*3|0);
    if(p.sites.some(s=>Math.abs(s.x-x)<(s.w+w)/2+5&&Math.abs(s.z-z)<(s.d+dd)/2+5))continue;if(riverDist(x,z)<RIVER_HW+14)continue;
    const hy=this.rawH(x,z),py=lerp(hy,y,.5);p.sites.push({x,z,w,d:dd,y:py});this.flat(x,z,w+3,dd+3,9,py);made++;}}
  this.flat(POINTS[1].x+16,POINTS[1].z-14,18,12,10,POINTS[1].y);// barn pad
  this.flat(POINTS[4].x-2,POINTS[4].z+15,14,10,10,POINTS[4].y);// chapel pad
 }
 /* ---------------- structures ---------------- */
 box(x0,y0,z0,x1,y1,z1,o={}){if(x0>x1)[x0,x1]=[x1,x0];if(z0>z1)[z0,z1]=[z1,z0];const b={x0,y0,z0,x1,y1,z1,mat:o.mat||'concrete',dead:false,dest:o.dest??-1,tree:o.tree??-1,pass:!!o.pass,vis:o.vis!==false&&o.dest==null&&o.tree==null};this.boxes.push(b);return b;}
 boxC(cx,cz,w,d,y0,h,o){return this.box(cx-w/2,y0,cz-d/2,cx+w/2,y0+h,cz+d/2,o);}
 house(x,z,w,d,y,o={}){const wh=o.h||(this.r()<.35?6.4:3.6),rot=w>=d?0:1;const H={x,z,w,d,y,h:wh,col:o.col,roof:o.roof,kind:o.kind||'house',rot};this.houses.push(H);
  H.box=this.boxC(x,z,w,d,y-1.5,wh+1.5+(o.kind==='barn'?2.2:1.2),{mat:o.mat||'plaster',vis:false});return H;}
 // destructible: kind -> footprint + hp; rot 0 or 1 (90°)
 destr(kind,x,z,rot=0,y){const S={shed:[3.6,2.9,3.4,420,'wood'],wall:[4.2,1.35,.62,260,'stone'],sand:[3.2,1.1,.85,320,'sandbag'],fence:[4,1.05,.14,60,'wood'],crates:[2.4,1.6,1.3,160,'wood'],hay:[1.8,1.3,1.8,90,'wood'],tent:[5,2.6,4.2,140,'cloth']}[kind];
  let[w,h,d,hp,mat]=S;if(rot)[w,d]=[d,w];y=y??this.height(x,z)-.1;const D={kind,x,z,y,rot,hp,max:hp,alive:true,boxes:[],i:this.dest.length};const b=this.boxC(x,z,w,d,y-.4,h+.4,{mat,dest:D.i});D.boxes.push(b);this.dest.push(D);return D;}
 buildStructures(){const r=this.r;
  for(const p of POINTS){const y=p.y;
   if(p.kind==='village'||p.kind==='chapel'){for(const s of p.sites)this.house(s.x,s.z,s.w,s.d,s.y,{col:[0xe8dcc4,0xd8c8a8,0xc8b8a0,0xe0d0b8,0xb8a890,0xd4c4b0][r()*6|0],roof:[0x8a3a24,0x6a3024,0x5a4a44,0x7a4430][r()*4|0],mat:r()<.3?'stone':'plaster'});
    for(let i=0;i<4;i++){const a=r()*PI*2,d=10+r()*12;this.destr(i%2?'shed':'crates',p.x+Math.cos(a)*d,p.z+Math.sin(a)*d,r()<.5?1:0);}
    for(let i=0;i<5;i++){const a=i/5*PI*2+r(),d=17+r()*6;this.destr(r()<.5?'wall':'fence',p.x+Math.cos(a)*d,p.z+Math.sin(a)*d,Math.abs(Math.cos(a))>.7?1:0);}
    this.props.push({kind:'well',x:p.x+4,z:p.z-3,y});this.box(p.x+3.2,y-1,p.z-3.8,p.x+4.8,y+.9,p.z-2.2,{mat:'stone',vis:false});}
   if(p.kind==='chapel'){const cx=p.x-2,cz=p.z+15;this.house(cx,cz,9,13,y,{kind:'chapel',h:7.5,col:0xe4dccc,roof:0x4a4c50,mat:'stone'});this.boxC(cx,cz-7.6,4,4,y,17,{mat:'stone',vis:false});
    for(let i=0;i<8;i++)this.props.push({kind:'grave',x:cx+8+(i%4)*1.8,z:cz-4+(i>>2)*2.4,y:this.height(cx+8+(i%4)*1.8,cz-4+(i>>2)*2.4)});}
   if(p.kind==='farm'){for(const s of p.sites)this.house(s.x,s.z,s.w,s.d,s.y,{col:0xe6dcc8,roof:0x6a2e20});const bx=p.x+16,bz=p.z-14;this.house(bx,bz,14,9,y,{kind:'barn',h:5.2,col:0xa8402c,roof:0x3a3634,mat:'wood'});
    this.props.push({kind:'silo',x:bx+10,z:bz-2,y});this.boxC(bx+10,bz-2,5.4,5.4,y-1,13,{mat:'metal',vis:false});
    for(let i=0;i<9;i++){const a=r()*PI*2,d=8+r()*14;this.destr('hay',p.x+Math.cos(a)*d,p.z+Math.sin(a)*d,0);}
    for(let i=0;i<6;i++)this.destr('fence',p.x-26+i*4.2,p.z+20,0);for(let i=0;i<5;i++)this.destr('fence',p.x-28,p.z-2+i*4.2,1);this.destr('shed',p.x-12,p.z-12,0);this.destr('shed',p.x+2,p.z+12,1);}
   if(p.kind==='hill'){this.props.push({kind:'radome',x:p.x-8,z:p.z-6,y});this.boxC(p.x-8,p.z-6,11,11,y-1,9.5,{mat:'concrete',vis:false});this.props.push({kind:'mast',x:p.x+9,z:p.z+7,y});this.boxC(p.x+9,p.z+7,1.6,1.6,y,24,{mat:'metal',pass:true,vis:false});
    // bunker with slit windows (3 wall boxes + roof)
    const bx=p.x+6,bz=p.z-9;this.box(bx-4,y-1,bz-3,bx+4,y+2.6,bz-2.4);this.box(bx-4,y-1,bz-2.4,bx-3.4,y+2.6,bz+3);this.box(bx+3.4,y-1,bz-2.4,bx+4,y+2.6,bz+3);this.box(bx-4,y+1.9,bz+2.4,bx+4,y+2.6,bz+3);this.box(bx-4,y-1,bz+2.4,bx-1,y+1.2,bz+3);this.box(bx+1,y-1,bz+2.4,bx+4,y+1.2,bz+3);this.box(bx-4.2,y+2.6,bz-3.2,bx+4.2,y+3.1,bz+3.2);
    this.props.push({kind:'bunker',x:bx,z:bz,y});for(let i=0;i<6;i++){const a=i/6*PI*2+.3;this.destr('sand',p.x+Math.cos(a)*13,p.z+Math.sin(a)*13,Math.abs(Math.cos(a))>.7?1:0);}
    this.props.push({kind:'container',x:p.x-14,z:p.z+10,y,rot:0,col:0x3a5a7a});this.boxC(p.x-14,p.z+10,6.1,2.5,y-.5,3.1,{mat:'metal',vis:false});this.props.push({kind:'container',x:p.x-13,z:p.z+14,y,rot:0,col:0x8a4a2a});this.boxC(p.x-13,p.z+14,6.1,2.5,y-.5,3.1,{mat:'metal',vis:false});}
   if(p.kind==='bridge'){for(const s of[-1,1]){const zz=BRIDGE.z+s*(BRIDGE.hl+8);this.destr('sand',-6,zz,0,DECK-.1);this.destr('sand',6.5,zz+s*3,0,DECK-.1);this.destr('sand',-9,zz+s*6,1);
     this.props.push({kind:'wreck',x:s*-3,z:zz+s*10,y:this.height(s*-3,zz+s*10),rot:s*.4});this.boxC(s*-3,zz+s*10,2.2,4.6,this.height(s*-3,zz+s*10),1.4,{mat:'metal',vis:false});}}}
  // bridge: deck, piers, rails
  const B=BRIDGE;this.box(B.x-B.hw,DECK-.7,B.z-B.hl,B.x+B.hw,DECK,B.z+B.hl,{mat:'concrete'});for(const s of[-1,1]){this.box(B.x-B.hw,DECK,B.z-B.hl,B.x-B.hw+.35,DECK+1.1,B.z+B.hl,{mat:'metal'});this.box(B.x+B.hw-.35,DECK,B.z-B.hl,B.x+B.hw,DECK+1.1,B.z+B.hl,{mat:'metal'});
   this.box(B.x-B.hw+.4,WL-3,B.z+s*7-1,B.x+B.hw-.4,DECK-.7,B.z+s*7+1,{mat:'concrete'});}
  // HQs: tents, sandbag ring, pads
  for(let t=0;t<2;t++){const h=HQ[t],s=t?1:-1;// s: direction toward the front
   for(let i=-2;i<=2;i++)this.destr('sand',h.x+i*9,h.z+s*21,0,h.y-.1);for(const k of[-1,1])for(let i=0;i<3;i++)this.destr('sand',h.x+k*33,h.z+s*(12-i*9),1,h.y-.1);
   for(let i=0;i<3;i++)this.destr('tent',h.x-22+i*7,h.z-s*14,0,h.y);this.props.push({kind:'pad',x:h.x+18,z:h.z-s*6,y:h.y,r:7});
   this.props.push({kind:'flagpole',x:h.x,z:h.z,y:h.y});}
 }
 /* ---------------- vegetation ---------------- */
 clearOf(x,z,pad){if(Math.max(Math.abs(x),Math.abs(z))>EXT-12)return false;if(riverDist(x,z)<RIVER_HW+3+pad*.3)return false;
  for(const f of this.flats)if(x>f.x0-pad&&x<f.x1+pad&&z>f.z0-pad&&z<f.z1+pad)return false;
  for(let i=0;i<this.nStruct;i++){const b=this.boxes[i];if(x>b.x0-pad&&x<b.x1+pad&&z>b.z0-pad&&z<b.z1+pad)return false;}
  return!this.nearRoad(x,z,4+pad*.5);}
 nearRoad(x,z,w){for(const rd of ROADS)for(let i=0;i<rd.length-1;i++){const[a,b]=[rd[i],rd[i+1]],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz,t=cl(((x-a[0])*dx+(z-a[1])*dz)/l2,0,1),px=a[0]+dx*t-x,pz=a[1]+dz*t-z;if(px*px+pz*pz<w*w)return true;}return false;}
 forestK(x,z){let k=fbm(x*.0085+40,z*.0085,3,4)*1.6;k+=gauss(x+272,z-10,70)*1.1+gauss(x-260,z+30,60)*1.2+gauss(x-80,z+60,45)*.9+gauss(x+70,z-60,45)*.9+gauss(x+120,z+260,50)*.8+gauss(x-130,z-260,55)*.8+gauss(x-280,z+220,60)*.7+gauss(x+290,z-230,60)*.7;
  const e=Math.max(Math.abs(x),Math.abs(z));if(e>PLAY-10)k+=.6;return k;}
 scatter(){const r=this.r;let tries=0;this.nStruct=this.boxes.length;
  while(this.trees.length<2100&&tries++<26000){const x=(r()*2-1)*(EXT-14),z=(r()*2-1)*(EXT-14),k=this.forestK(x,z);if(r()>k-.18)continue;if(!this.clearOf(x,z,3))continue;
   const y=this.height(x,z);if(y<WL+.6)continue;const pine=r()<.62||y>20,s=.8+r()*.55;const t={x,z,y,s,kind:pine?0:1,rot:r()*PI*2,alive:true,i:this.trees.length};this.trees.push(t);
   if(Math.max(Math.abs(x),Math.abs(z))<PLAY+20)this.box(x-.32*s,y-1,z-.32*s,x+.32*s,y+(pine?8.5:6)*s,z+.32*s,{mat:'wood',tree:t.i});}
  // lone trees in fields
  for(let i=0;i<90;i++){const x=(r()*2-1)*PLAY,z=(r()*2-1)*PLAY;if(!this.clearOf(x,z,5))continue;const y=this.height(x,z);const t={x,z,y,s:1+r()*.5,kind:1,rot:r()*6,alive:true,i:this.trees.length};this.trees.push(t);this.box(x-.35*t.s,y-1,z-.35*t.s,x+.35*t.s,y+6*t.s,z+.35*t.s,{mat:'wood',tree:t.i});}
  tries=0;while(this.bushes.length<1700&&tries++<20000){const x=(r()*2-1)*(EXT-10),z=(r()*2-1)*(EXT-10);const k=this.forestK(x,z);if(r()>k+.25)continue;if(!this.clearOf(x,z,1))continue;const y=this.height(x,z);if(y<WL+.3)continue;this.bushes.push({x,z,y,s:.6+r()*.9,rot:r()*6});}
  tries=0;while(this.rocks.length<180&&tries++<6000){const x=(r()*2-1)*(EXT-10),z=(r()*2-1)*(EXT-10);if(!this.clearOf(x,z,2))continue;const n=this.normal(x,z);if(n.y>.93&&r()<.85)continue;const y=this.height(x,z),s=.8+r()*2.2;this.rocks.push({x,z,y,s,rot:r()*6});
   if(s>1.3)this.box(x-.8*s,y-1,z-.8*s,x+.8*s,y+.55*s,z+.8*s,{mat:'stone',vis:false});}
  // reeds along the river banks
  for(let i=0;i<500;i++){const x=(r()*2-1)*(EXT-20);const side=r()<.5?-1:1,d=RIVER_HW-1+r()*7,z=riverZ(x)+side*d;if(Math.abs(x)<12)continue;const y=this.height(x,z);if(y<WL-.4||y>WL+1.6)continue;this.decor.push({kind:'reed',x,z,y,s:.7+r()*.6,rot:r()*6});}}
 /* ---------------- finalize: box grid + nav grid ---------------- */
 finalize(){const GS=this.GS=16,GN=this.GN=Math.ceil(EXT*2/GS);this.grid=Array.from({length:GN*GN},()=>[]);
  this.boxes.forEach((b,i)=>{const i0=cl(Math.floor((b.x0+EXT)/GS),0,GN-1),i1=cl(Math.floor((b.x1+EXT)/GS),0,GN-1),j0=cl(Math.floor((b.z0+EXT)/GS),0,GN-1),j1=cl(Math.floor((b.z1+EXT)/GS),0,GN-1);for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++)this.grid[j*GN+k].push(i);});
  this.stamp=new Uint32Array(this.boxes.length);this.sg=1;this.ql=[];
  // nav grid
  const C=this.NC=4,NN=this.NN=Math.ceil(EXT*2/C);this.blk=new Uint8Array(NN*NN);this.cost=new Float32Array(NN*NN).fill(1);
  for(let j=0;j<NN;j++)for(let i=0;i<NN;i++){const x=-EXT+(i+.5)*C,z=-EXT+(j+.5)*C,k=j*NN+i;if(Math.max(Math.abs(x),Math.abs(z))>PLAY+4){this.blk[k]=1;continue;}
   const n=this.normal(x,z);if(n.y<.72&&!this.onBridge(x,z)){this.blk[k]=1;continue;}if(this.inWater(x,z))this.cost[k]=this.height(x,z)<WL-1.2?4:2.2;else if(n.y<.88)this.cost[k]=1.5;}
  for(const b of this.boxes){if(b.pass||b.y1-b.y0<1.2&&b.tree<0)continue;if(b.x0<=BRIDGE.x-BRIDGE.hw+.1&&b.x1>=BRIDGE.x+BRIDGE.hw-.1)continue;// bridge deck
   const m=b.tree>=0?.1:.6,i0=Math.max(0,Math.floor((b.x0-m+EXT)/C)),i1=Math.min(NN-1,Math.floor((b.x1+m+EXT)/C)),j0=Math.max(0,Math.floor((b.z0-m+EXT)/C)),j1=Math.min(NN-1,Math.floor((b.z1+m+EXT)/C));
   for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const cx=-EXT+(i+.5)*C,cz=-EXT+(j+.5)*C;if(b.tree>=0){this.cost[j*NN+i]=Math.max(this.cost[j*NN+i],1.6);continue;}if(cx>b.x0-m-1.2&&cx<b.x1+m+1.2&&cz>b.z0-m-1.2&&cz<b.z1+m+1.2)this.blk[j*NN+i]=2;}}
  // bridge cells are always open
  for(let z=BRIDGE.z-BRIDGE.hl-4;z<=BRIDGE.z+BRIDGE.hl+4;z+=2)for(let x=-2;x<=2;x+=2){const k=this.cellN(x,z);if(k>=0){this.blk[k]=0;this.cost[k]=.8;}}
  this.g=new Float32Array(NN*NN);this.par=new Int32Array(NN*NN);this.st=new Uint32Array(NN*NN);this.cs=new Uint32Array(NN*NN);this.gen=1;this.heap=new Int32Array(NN*NN*2);this.hf=new Float32Array(NN*NN*2);}
 cellN(x,z){const i=Math.floor((x+EXT)/this.NC),j=Math.floor((z+EXT)/this.NC);return i<0||j<0||i>=this.NN||j>=this.NN?-1:j*this.NN+i;}
 /* ---------------- queries ---------------- */
 near(x,z,r){const GS=this.GS,GN=this.GN,out=this.ql;out.length=0;const g=++this.sg;const i0=Math.max(0,Math.floor((x-r+EXT)/GS)),i1=Math.min(GN-1,Math.floor((x+r+EXT)/GS)),j0=Math.max(0,Math.floor((z-r+EXT)/GS)),j1=Math.min(GN-1,Math.floor((z+r+EXT)/GS));
  for(let j=j0;j<=j1;j++)for(let k=i0;k<=i1;k++){const c=this.grid[j*GN+k];for(let m=0;m<c.length;m++){const i=c[m];if(this.stamp[i]!==g){this.stamp[i]=g;out.push(i);}}}return out;}
 // walkable surface under a point: terrain or a box top within step reach
 ground(x,z,feet,r=.25){let g=this.height(x,z);const L=this.near(x,z,r+.1),B=this.boxes;for(let q=0;q<L.length;q++){const b=B[L[q]];if(b.dead||b.pass||b.y1>feet+STEPUP||b.y1<=g)continue;if(x+r<b.x0||x-r>b.x1||z+r<b.z0||z-r>b.z1)continue;g=b.y1;}return g;}
 // push a vertical cylinder out of boxes; returns hit box or null
 collide(p,r,h){const L=this.near(p.x,p.z,r+.6).slice(),B=this.boxes;let hit=null;
  for(let q=0;q<L.length;q++){const b=B[L[q]];if(b.dead||b.y1<=p.y+STEPUP||b.y0>=p.y+h)continue;const cx=cl(p.x,b.x0,b.x1),cz=cl(p.z,b.z0,b.z1);let dx=p.x-cx,dz=p.z-cz;const d2=dx*dx+dz*dz;if(d2>=r*r)continue;hit=b;
   if(d2>1e-8){const d=Math.sqrt(d2);p.x+=dx/d*(r-d);p.z+=dz/d*(r-d);}else{const l=p.x-b.x0,rr=b.x1-p.x,u=p.z-b.z0,dd=b.z1-p.z,m=Math.min(l,rr,u,dd);if(m===l)p.x=b.x0-r;else if(m===rr)p.x=b.x1+r;else if(m===u)p.z=b.z0-r;else p.z=b.z1+r;}}
  const H=PLAY+40;p.x=cl(p.x,-H,H);p.z=cl(p.z,-H,H);return hit;}
 // first hit along a ray: terrain, water surface or a box. out: {t, i (box idx | -2 terrain | -3 water), n}
 ray(ox,oy,oz,dx,dy,dz,maxT,out,noWater){let best=maxT,bi=-1;const n=out?out.n:null;
  // terrain march
  if(!(dy>0&&oy>95)){let t=0,py=oy-this.height(ox,oz);if(py<0){if(out){out.t=0;out.i=-2;n&&n.set(0,1,0);}return 0;}const st0=1.2;let step=st0,prev=0;
   while(t<best){const nt=Math.min(t+step,best),y=oy+dy*nt,h=this.height(ox+dx*nt,oz+dz*nt);if(y<h){let a=prev,b=nt;for(let k=0;k<6;k++){const m=(a+b)/2;if(oy+dy*m<this.height(ox+dx*m,oz+dz*m))b=m;else a=m;}best=b;bi=-2;break;}
    prev=nt;t=nt;step=Math.min(6,st0+t*.035+Math.max(0,(y-h)*.4));if(dy>0&&y>95)break;}}
  if(!noWater&&dy<-1e-4){const tw=(WL-oy)/dy;if(tw>0&&tw<best){const wx=ox+dx*tw,wz=oz+dz*tw;if(this.height(wx,wz)<WL&&!this.onBridge(wx,wz)){best=tw;bi=-3;}}}
  if(bi===-2&&n)this.normal(ox+dx*best,oz+dz*best,n);else if(bi===-3&&n)n.set(0,1,0);
  // boxes: DDA over the 16 m grid
  const GS=this.GS,GN=this.GN,g=++this.sg,B=this.boxes;const ix=1/(Math.abs(dx)<1e-7?1e-7:dx),iy=1/(Math.abs(dy)<1e-7?1e-7:dy),iz=1/(Math.abs(dz)<1e-7?1e-7:dz);
  let cx=Math.floor((ox+EXT)/GS),cz=Math.floor((oz+EXT)/GS);const sx=dx>0?1:-1,sz=dz>0?1:-1;
  let tMaxX=dx===0?Infinity:((cx+(dx>0?1:0))*GS-EXT-ox)/dx,tMaxZ=dz===0?Infinity:((cz+(dz>0?1:0))*GS-EXT-oz)/dz;const tdx=Math.abs(GS/(dx||1e-9)),tdz=Math.abs(GS/(dz||1e-9));let tc=0;const tn=_n;
  while(tc<=best){if(cx>=0&&cz>=0&&cx<GN&&cz<GN){const c=this.grid[cz*GN+cx];for(let m=0;m<c.length;m++){const i=c[m];if(this.stamp[i]===g)continue;this.stamp[i]=g;const b=B[i];if(b.dead||b.pass)continue;const t=rayAABB(ox,oy,oz,ix,iy,iz,b.x0,b.y0,b.z0,b.x1,b.y1,b.z1,best,tn);if(t<best){best=t;bi=i;if(n)n.copy(tn);}}}
   else if((cx<0&&sx<0)||(cz<0&&sz<0)||(cx>=GN&&sx>0)||(cz>=GN&&sz>0))break;
   if(tMaxX<tMaxZ){tc=tMaxX;tMaxX+=tdx;cx+=sx;}else{tc=tMaxZ;tMaxZ+=tdz;cz+=sz;}}
  if(out){out.t=best;out.i=bi;}return best<maxT?best:Infinity;}
 los(a,b){const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,l=Math.hypot(dx,dy,dz);if(l<1e-3)return true;return this.ray(a.x,a.y,a.z,dx/l,dy/l,dz/l,l-.1,null,true)===Infinity;}
 matOf(i){if(i===-2)return'ground';if(i===-3)return'water';const b=this.boxes[i];return b?b.mat:'concrete';}
 /* ---------------- navigation ---------------- */
 free(x,z){const k=this.cellN(x,z);return k>=0&&!this.blk[k];}
 nearestFree(k){const NN=this.NN,i=k%NN,j=k/NN|0;for(let r=1;r<10;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const a=i+di,b=j+dj;if(a>0&&b>0&&a<NN-1&&b<NN-1&&!this.blk[b*NN+a])return b*NN+a;}return -1;}
 walkable(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),n=Math.ceil(l/2);for(let k=1;k<=n;k++){const t=k/n;if(!this.free(ax+dx*t,az+dz*t))return false;}return true;}
 path(sx,sz,tx,tz,maxIter=9000){const NN=this.NN,C=this.NC;let s=this.cellN(sx,sz),t=this.cellN(tx,tz);if(s<0||t<0)return null;if(this.blk[s])s=this.nearestFree(s);if(this.blk[t])t=this.nearestFree(t);if(s<0||t<0)return null;
  if(this.walkable(sx,sz,tx,tz)&&Math.hypot(tx-sx,tz-sz)<60)return[[tx,tz]];
  const gen=++this.gen,g=this.g,par=this.par,st=this.st,cs=this.cs,Hh=this.heap,F=this.hf;let hn=0;const ti=t%NN,tj=t/NN|0;
  const h=c=>{const dx=Math.abs(c%NN-ti),dz=Math.abs((c/NN|0)-tj);return(Math.max(dx,dz)+.414*Math.min(dx,dz))*1.4;};
  const push=(c,f)=>{let k=hn++;while(k>0){const p=(k-1)>>1;if(F[p]<=f)break;Hh[k]=Hh[p];F[k]=F[p];k=p;}Hh[k]=c;F[k]=f;};
  const pop=()=>{const top=Hh[0],lc=Hh[--hn],lf=F[hn];let k=0;for(;;){let c=2*k+1;if(c>=hn)break;if(c+1<hn&&F[c+1]<F[c])c++;if(F[c]>=lf)break;Hh[k]=Hh[c];F[k]=F[c];k=c;}Hh[k]=lc;F[k]=lf;return top;};
  g[s]=0;st[s]=gen;par[s]=-1;push(s,h(s));let it=0,found=false,bestC=s,bestH=1e9;
  while(hn>0&&it++<maxIter){const c=pop();if(c===t){found=true;break;}if(cs[c]===gen)continue;cs[c]=gen;const hc=h(c);if(hc<bestH){bestH=hc;bestC=c;}const ci=c%NN,cj=c/NN|0;
   for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=NN||nj>=NN)continue;const k=nj*NN+ni;if(this.blk[k]||cs[k]===gen)continue;
    if(di&&dj&&(this.blk[cj*NN+ni]||this.blk[nj*NN+ci]))continue;const ng=g[c]+(di&&dj?1.414:1)*this.cost[k];if(st[k]!==gen||ng<g[k]){st[k]=gen;g[k]=ng;par[k]=c;push(k,ng+h(k));}}}
  const end=found?t:bestC;if(end===s)return null;const pts=[];for(let c=end;c>=0;c=par[c])pts.push([-EXT+(c%NN+.5)*C,-EXT+((c/NN|0)+.5)*C]);pts.reverse();
  const out=[];let a=0,ax=sx,az=sz;while(a<pts.length-1){let b=Math.min(pts.length-1,a+14);while(b>a+1&&!this.walkable(ax,az,pts[b][0],pts[b][1]))b--;out.push(pts[b]);ax=pts[b][0];az=pts[b][1];a=b;}
  if(found)out.push([tx,tz]);return out;}
}
const _n=new V();
