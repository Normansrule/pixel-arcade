// VOXEL FRONTIER — infinite chunked world: biomes, caves, ores, trees and plants; flood-fill sky + block light
// (smooth per-vertex lighting with ambient occlusion) and chunk meshing into a few draw calls per chunk.
import * as THREE from '../vendor/three.module.min.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';
import {B,OPQ,LIQ,EMIT,TRN,PLANT,tileUV,hash,mulberry,TILE} from './blocks.js';

export const CS=16,CH=96,SEA=34,PAD=8,W=CS+PAD*2;
export const BIO=['PLAINS','FOREST','BIRCH WOODS','DESERT','SAVANNA','SNOWY TAIGA','HIGH PEAKS','BEACH','OCEAN'];
let noise,seed=1;const hc=new Map();
export const chunks=new Map();export let edits=new Map();
export const ckey=(cx,cz)=>(cx+32768)*65536+(cz+32768);
export function init(s){seed=s;noise=new SimplexNoise({random:mulberry(s)});hc.clear();}
export function setEdits(m){edits=m;}
export function getSeed(){return seed;}
const sm=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t);};
const fbm=(x,z,o)=>{let s=0,a=1,f=1,n=0;for(let i=0;i<o;i++){s+=noise.noise(x*f,z*f)*a;n+=a;a*=.5;f*=2.03;}return s/n;};

/* ---------------- terrain columns ---------------- */
export function column(x,z){const k=(x+50000)*100003+(z+50000);let v=hc.get(k);if(v)return v;
 const c=fbm(x*.0021,z*.0021,3),hills=fbm(x*.011+50,z*.011-20,4),rid=1-Math.abs(noise.noise(x*.0062+11,z*.0062+77));
 const mm=sm(.0,.5,noise.noise(x*.0026-40,z*.0026+90)),temp=noise.noise(x*.0016+300,z*.0016-150)+noise.noise(x*.03,z*.03)*.04,hum=noise.noise(x*.0018-700,z*.0018+410);
 let base=SEA+3+c*17+hills*(4+5*sm(-.2,.5,c))+mm*Math.pow(rid,2.3)*44*sm(-.3,.2,c);
 if(base>74)base=74+(base-74)*.45;const h=Math.max(6,Math.min(CH-8,Math.floor(base)));
 let bio;if(h<SEA-2)bio=8;else if(h<=SEA+1)bio=temp<-.32?5:7;else if(h>SEA+30)bio=6;else if(temp>.32&&hum<.1)bio=3;else if(temp>.18&&hum<.3)bio=4;else if(temp<-.3)bio=5;else if(hum>.28)bio=temp>-.05&&temp<.18?2:1;else if(hum>.02)bio=1;else bio=0;
 v={h,bio,temp,hum};if(hc.size>250000)hc.clear();hc.set(k,v);return v;}
export const biomeAt=(x,z)=>BIO[column(Math.floor(x),Math.floor(z)).bio];

/* ---------------- chunk generation ---------------- */
const IDX=(x,y,z)=>(y*CS+z)*CS+x;
const slopeAt=(wx,wz,h)=>Math.max(Math.abs(h-column(wx+1,wz).h),Math.abs(h-column(wx,wz+1).h),Math.abs(h-column(wx-1,wz).h),Math.abs(h-column(wx,wz-1).h));
// [top, fill, fill depth] for a column
function surf(T,slope,wx,wz){const h=T.h,bio=T.bio;let top=1,fill=2,depth=3+(hash(wx,0,wz,seed)*2|0);
 if(bio===3){top=4;fill=4;depth=4;}else if(bio===7){top=4;fill=4;}else if(bio===8){const r=noise.noise(wx*.05,wz*.05);top=r>.3?28:r<-.4?2:4;fill=top;}
 else if(bio===5)top=10;else if(bio===4)top=29;else if(bio===6){top=h>SEA+37?32:slope>1?3:(T.temp<-.1?10:1);fill=slope>1||h>SEA+37?3:2;}
 if(slope>3&&bio!==8&&bio!==7&&bio!==3)top=fill=3;return[top,fill,depth];}
function genChunk(cx,cz){const d=new Uint8Array(CS*CS*CH);const bx=cx*CS,bz=cz*CS;
 // coarse cave fields (4x4x4 grid, trilinear)
 const GX=CS/4+1,GY=CH/4+1,fa=new Float32Array(GX*GX*GY),fb=new Float32Array(GX*GX*GY),fc=new Float32Array(GX*GX*GY);
 for(let gy=0;gy<GY;gy++)for(let gz=0;gz<GX;gz++)for(let gx=0;gx<GX;gx++){const x=bx+gx*4,y=gy*4,z=bz+gz*4,i=(gy*GX+gz)*GX+gx;
  fa[i]=noise.noise3d(x*.028,y*.042,z*.028);fb[i]=noise.noise3d(x*.028+97,y*.042-31,z*.028+53);fc[i]=noise.noise3d(x*.016-200,y*.03,z*.016+120)+noise.noise3d(x*.05,y*.06,z*.05)*.25;}
 const tri=(f,x,y,z)=>{const gx=x>>2,gy=y>>2,gz=z>>2,tx=(x&3)/4,ty=(y&3)/4,tz=(z&3)/4;const i=(gy*GX+gz)*GX+gx,j=i+GX*GX;
  const a=f[i]+(f[i+1]-f[i])*tx,b=f[i+GX]+(f[i+GX+1]-f[i+GX])*tx,c=f[j]+(f[j+1]-f[j])*tx,e=f[j+GX]+(f[j+GX+1]-f[j+GX])*tx;const ab=a+(b-a)*tz,ce=c+(e-c)*tz;return ab+(ce-ab)*ty;};
 for(let z=0;z<CS;z++)for(let x=0;x<CS;x++){const wx=bx+x,wz=bz+z,T=column(wx,wz),h=T.h,bio=T.bio;
  const slope=slopeAt(wx,wz,h);
  const st=surf(T,slope,wx,wz),top=st[0],fill=st[1],depth=st[2];
  const entr=h>SEA+2&&noise.noise(wx*.018+5,wz*.018-9)>.62;
  for(let y=0;y<=Math.max(h,SEA);y++){let id;
   if(y===0||(y<3&&hash(wx,y,wz,seed+3)<.5))id=16;else if(y<h-depth)id=3;else if(y<h)id=fill===4&&bio===3&&y<h-2?27:fill;else if(y===h)id=top;else id=(bio===5&&y===SEA)?33:5;
   if(id===3||(y<=h&&y>2&&id!==5&&id!==16&&id!==33)){ // caves
    if(y>3&&(y<h-4||(entr&&y<=h))&&!(h<SEA+1&&y>h-6)){const a=tri(fa,x,y,z),b=tri(fb,x,y,z),c=tri(fc,x,y,z);if(a*a+b*b<.0105||c>.6){id=y<=8?20:0;}}}
   if(id===3){const r=hash(wx,y,wz,seed),q=hash(wx>>1,y>>1,wz>>1,seed+11);
    if(q<.028&&r<.6&&y<72)id=11;else if(q>.978&&r<.55&&y<52)id=12;else if(q>.895&&q<.903&&y<30&&r<.6)id=17;else if(q>.5&&q<.506&&y<18)id=18;}
   d[IDX(x,y,z)]=id;}
  if(h<SEA&&top===4&&bio===8&&hash(wx,2,wz,seed)<.04)d[IDX(x,h,z)]=28;}
 // crystals, diamonds and glowcaps on cave walls/floors
 for(let y=2;y<CH-1;y++)for(let z=0;z<CS;z++)for(let x=0;x<CS;x++){const i=IDX(x,y,z);if(d[i]!==3)continue;
  const air=(x>0&&d[i-1]===0)||(x<CS-1&&d[i+1]===0)||(z>0&&d[i-CS]===0)||(z<CS-1&&d[i+CS]===0)||d[i+CS*CS]===0||d[i-CS*CS]===0;if(!air)continue;const wx=bx+x,wz=bz+z,r=hash(wx,y,wz,seed+21);
  if(y<26&&r<.022)d[i]=41;else if(y<18&&r>.988)d[i]=18;else if(y<40&&r>.976)d[i]=12;
  else if(d[i+CS*CS]===0&&y<column(wx,wz).h-5&&r>.5&&r<.53&&y+1<CH)d[i+CS*CS]=40;}
 // trees, cacti and plants (columns spill over chunk borders)
 const put=(x,y,z,id,soft)=>{if(x<0||z<0||x>=CS||z>=CS||y<1||y>=CH)return;const i=IDX(x,y,z);if(soft&&d[i]&&!PLANT[d[i]])return;d[i]=id;};
 for(let z=-3;z<CS+3;z++)for(let x=-3;x<CS+3;x++){const wx=bx+x,wz=bz+z,T=column(wx,wz),h=T.h,bio=T.bio;if(h<=SEA||bio===8||bio===7)continue;
  const r=hash(wx,7,wz,seed),r2=hash(wx,9,wz,seed),inC=x>=0&&z>=0&&x<CS&&z<CS;
  const sl=slopeAt(wx,wz,h),tp=surf(T,sl,wx,wz)[0];if(tp!==1&&tp!==10&&tp!==29&&tp!==4)continue;
  const dens=[.004,.045,.035,.0,.006,.03,.006,0,0][bio];
  if(bio===3){if(r<.007){const hh=1+(r2*3|0);for(let k=1;k<=hh;k++)put(x,h+k,z,19);}else if(r>.985)put(x,h+1,z,39,true);continue;}
  if(r<dens){const kind=bio===2?(r2<.8?'birch':'oak'):bio===5||bio===6?'spruce':bio===4?'acacia':(r2<.12?'birch':'oak');
   if(kind==='oak'||kind==='birch'){const L=kind==='oak'?6:23,LV=kind==='oak'?7:24,th=4+(r2*3|0)+(kind==='birch'?1:0);for(let k=1;k<=th;k++)put(x,h+k,z,L);
    for(let dy=th-2;dy<=th+1;dy++){const rad=dy>=th?1:2;for(let dx=-rad;dx<=rad;dx++)for(let dz=-rad;dz<=rad;dz++){if(Math.abs(dx)===rad&&Math.abs(dz)===rad&&(dy===th+1||hash(wx+dx,dy,wz+dz,seed)<.5))continue;if(dy===th+1&&(dx||dz)&&Math.abs(dx)+Math.abs(dz)>1)continue;put(x+dx,h+dy,z+dz,LV,true);}}}
   else if(kind==='spruce'){const th=6+(r2*4|0);for(let k=1;k<=th;k++)put(x,h+k,z,25);put(x,h+th+1,z,26,true);
    const cone=[1,1,2,1,2,3,2,3,2,3,2];for(let dy=2;dy<=th;dy++){const rad=cone[Math.min(10,th-dy)];for(let dx=-rad;dx<=rad;dx++)for(let dz=-rad;dz<=rad;dz++){if(Math.abs(dx)+Math.abs(dz)>rad+1||(rad>1&&Math.abs(dx)===rad&&Math.abs(dz)===rad))continue;put(x+dx,h+dy,z+dz,26,true);}}}
   else{const th=4+(r2*2|0),ox=r2<.5?1:-1,oz=r2>.25&&r2<.75?1:-1;let px=x,pz=z;for(let k=1;k<=th;k++){if(k>=th-1){px=x+ox*(k-th+2);pz=z+oz*(k-th+2);}put(px,h+k,pz,30);}
    for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){if(Math.abs(dx)+Math.abs(dz)>4)continue;put(px+dx,h+th+1,pz+dz,31,true);if(Math.abs(dx)+Math.abs(dz)<=2)put(px+dx,h+th+2,pz+dz,31,true);}}
   continue;}
  if(!inC)continue;
  const g=[.24,.08,.1,0,.14,0,.02,0,0][bio],fl=[.03,.012,.02,0,0,0,.005,0,0][bio];const rr=hash(wx,11,wz,seed);
  if(rr<fl)put(x,h+1,z,r2<.5?37:38);else if(rr<fl+g)put(x,h+1,z,36);}
 const e=edits.get(ckey(cx,cz));if(e)for(const k in e)d[+k]=e[k];
 return{cx,cz,d,mesh:null,wmesh:null,dirty:true,light:null,meshed:false};}
export function chunk(cx,cz){const k=ckey(cx,cz);let c=chunks.get(k);if(!c){c=genChunk(cx,cz);chunks.set(k,c);}return c;}
let lastC=null;
export function get(x,y,z){if(y<0||y>=CH)return 0;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);let c=lastC;if(!c||c.cx!==cx||c.cz!==cz){c=chunk(cx,cz);lastC=c;}return c.d[(y*CS+(z-cz*CS))*CS+(x-cx*CS)];}
export function peek(x,y,z){if(y<0||y>=CH)return 0;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);const c=chunks.get(ckey(cx,cz));return c?c.d[(y*CS+(z-cz*CS))*CS+(x-cx*CS)]:0;}
export function set(x,y,z,id){if(y<1||y>=CH)return false;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);const c=chunk(cx,cz);const lx=x-cx*CS,lz=z-cz*CS,i=(y*CS+lz)*CS+lx;if(c.d[i]===id)return false;c.d[i]=id;c.dirty=true;c.urgent=true;
 const k=ckey(cx,cz);let e=edits.get(k);if(!e){e={};edits.set(k,e);}e[i]=id;
 const m=(a,b)=>{const n=chunks.get(ckey(a,b));if(n)n.dirty=true;};if(lx<PAD)m(cx-1,cz);else m(cx+1,cz);if(lz<PAD)m(cx,cz-1);else m(cx,cz+1);if(lx<PAD&&lz<PAD)m(cx-1,cz-1);if(lx>=PAD&&lz<PAD)m(cx+1,cz-1);if(lx<PAD&&lz>=PAD)m(cx-1,cz+1);if(lx>=PAD&&lz>=PAD)m(cx+1,cz+1);return true;}
// light at a world cell: {sky 0..15, blk 0..15}
export function lightAt(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(y>=CH)return 0xF0;if(y<0)return 0;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);const c=chunks.get(ckey(cx,cz));if(!c||!c.light)return 0xF0;return c.light[(y*CS+(z-cz*CS))*CS+(x-cx*CS)];}
export function topY(x,z){for(let y=CH-1;y>0;y--){const id=get(x,y,z);if(id&&!PLANT[id]&&!B[id].leaf)return y;}return 0;}

/* ---------------- lighting + meshing ---------------- */
const vol=new Uint8Array(W*W*CH),lv=new Uint8Array(W*W*CH),tops=new Int16Array(W*W);const Q=new Int32Array(1<<19);const QM=(1<<19)-1;
const VI=(x,y,z)=>(y*W+z)*W+x;
export const LC=new Float32Array(16);for(let l=0;l<16;l++)LC[l]=l===0?0:Math.pow(.8,15-l);
function buildVol(c){for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const n=chunk(c.cx+dx,c.cz+dz),d=n.d;
  for(let lz=0;lz<CS;lz++){const vz=PAD+dz*CS+lz;if(vz<0||vz>=W)continue;for(let lx=0;lx<CS;lx++){const vx=PAD+dx*CS+lx;if(vx<0||vx>=W)continue;let si=lz*CS+lx,di=vz*W+vx;for(let y=0;y<CH;y++){vol[di]=d[si];si+=CS*CS;di+=W*W;}}}}}
function computeLight(){lv.fill(0);let qh=0,qt=0;const WW=W*W;
 for(let z=0;z<W;z++)for(let x=0;x<W;x++){let y=CH-1;for(;y>=0;y--){const id=vol[VI(x,y,z)];if(id&&!PLANT[id])break;}tops[z*W+x]=y;for(let yy=y+1;yy<CH;yy++)lv[VI(x,yy,z)]=0xF0;}
 for(let z=0;z<W;z++)for(let x=0;x<W;x++){const t=tops[z*W+x];let m=t+1;if(x>0)m=Math.max(m,tops[z*W+x-1]);if(x<W-1)m=Math.max(m,tops[z*W+x+1]);if(z>0)m=Math.max(m,tops[(z-1)*W+x]);if(z<W-1)m=Math.max(m,tops[(z+1)*W+x]);
  for(let y=t+1;y<=Math.min(CH-1,m);y++){Q[qt]=VI(x,y,z);qt=(qt+1)&QM;}}
 const step=(sh)=>{while(qh!==qt){const i=Q[qh];qh=(qh+1)&QM;const L=(lv[i]>>sh)&15;if(L<=1)continue;const x=i%W,z=((i/W)|0)%W,y=(i/WW)|0;
  for(let f=0;f<6;f++){let n;if(f===0){if(x===0)continue;n=i-1;}else if(f===1){if(x===W-1)continue;n=i+1;}else if(f===2){if(z===0)continue;n=i-W;}else if(f===3){if(z===W-1)continue;n=i+W;}else if(f===4){if(y===0)continue;n=i-WW;}else{if(y===CH-1)continue;n=i+WW;}
   const id=vol[n];if(OPQ[id])continue;const nl=L-((LIQ[id]||TRN[id])?2:1);const cur=(lv[n]>>sh)&15;if(nl>cur){lv[n]=(lv[n]&(sh?0x0F:0xF0))|(nl<<sh);Q[qt]=n;qt=(qt+1)&QM;}}}};
 step(4);
 for(let i=0;i<W*W*CH;i++){const e=EMIT[vol[i]];if(e){lv[i]=(lv[i]&0xF0)|e;Q[qt]=i;qt=(qt+1)&QM;}}
 step(0);}
// face table: dir, 4 corners [x,y,z,u,v], tile key
const FACES=[
 {d:[-1,0,0],c:[[0,1,0,0,1],[0,0,0,0,0],[0,1,1,1,1],[0,0,1,1,0]],k:'s',sh:.8},
 {d:[1,0,0],c:[[1,1,1,0,1],[1,0,1,0,0],[1,1,0,1,1],[1,0,0,1,0]],k:'s',sh:.8},
 {d:[0,-1,0],c:[[1,0,1,1,0],[0,0,1,0,0],[1,0,0,1,1],[0,0,0,0,1]],k:'b',sh:.58},
 {d:[0,1,0],c:[[0,1,1,1,1],[1,1,1,0,1],[0,1,0,1,0],[1,1,0,0,0]],k:'t',sh:1},
 {d:[0,0,-1],c:[[1,0,0,0,0],[0,0,0,1,0],[1,1,0,0,1],[0,1,0,1,1]],k:'s',sh:.9},
 {d:[0,0,1],c:[[0,0,1,0,0],[1,0,1,1,0],[0,1,1,0,1],[1,1,1,1,1]],k:'f',sh:.9}];
const AOL=[.46,.64,.82,1];
const FT=FACES.map(F=>{const ax=F.d[0]!==0?[1,2]:F.d[1]!==0?[0,2]:[0,1];const o=v=>v[0]+v[2]*W+v[1]*W*W;
 return{dn:o(F.d),dy:F.d[1],sh:F.sh,k:F.k,nx:F.d[0],ny:F.d[1],nz:F.d[2],cs:F.c.map(q=>{const s1=[0,0,0],s2=[0,0,0];s1[ax[0]]=q[ax[0]]?1:-1;s2[ax[1]]=q[ax[1]]?1:-1;return{qx:q[0],qy:q[1],qz:q[2],u:q[3],v:q[4],o1:o(s1),y1:s1[1],o2:o(s2),y2:s2[1],o3:o(s1)+o(s2),y3:s1[1]+s2[1]};})};});
const TUV=new Float32Array(64*4);for(let t=0;t<64;t++){const r=tileUV(t);TUV.set(r,t*4);}
class Buf{constructor(){this.p=[];this.n=[];this.u=[];this.c=[];this.l=[];this.s=[];this.i=[];}}
export function meshChunk(c,mats,scene){buildVol(c);computeLight();
 const Op=new Buf(),Cu=new Buf(),Pl=new Buf(),Wt=new Buf();const bx=c.cx*CS-PAD,bz=c.cz*CS-PAD;const WW=W*W;
 // keep this chunk's light for entity shading
 const L=c.light||(c.light=new Uint8Array(CS*CS*CH));for(let y=0;y<CH;y++)for(let z=0;z<CS;z++){let di=(y*CS+z)*CS,si=VI(PAD,y,PAD+z);for(let x=0;x<CS;x++)L[di++]=lv[si++];}
 const lightS=(i)=>lv[i];
 for(let y=0;y<CH;y++)for(let z=PAD;z<PAD+CS;z++)for(let x=PAD;x<PAD+CS;x++){const i=VI(x,y,z),id=vol[i];if(!id)continue;const bd=B[id],wx=bx+x,wz=bz+z;
  if(PLANT[id]){const O=Pl;const lt=lv[i],sk=LC[lt>>4],bl=LC[lt&15];
   if(bd.torch){const[u0,v0,u1,v1]=tileUV(TILE.torch);const du=(u1-u0)/16,dv=(v1-v0)/16;const x0=wx+7/16,x1=wx+9/16,z0=wz+7/16,z1=wz+9/16,y1=y+11/16;
    const box=[[[-1,0,0],[[x0,y,z0],[x0,y,z1],[x0,y1,z0],[x0,y1,z1]]],[[1,0,0],[[x1,y,z1],[x1,y,z0],[x1,y1,z1],[x1,y1,z0]]],[[0,0,-1],[[x1,y,z0],[x0,y,z0],[x1,y1,z0],[x0,y1,z0]]],[[0,0,1],[[x0,y,z1],[x1,y,z1],[x0,y1,z1],[x1,y1,z1]]],[[0,1,0],[[x0,y1,z1],[x1,y1,z1],[x0,y1,z0],[x1,y1,z0]]]];
    for(const[n,v]of box){const b=O.p.length/3;const top=n[1]===1;const U0=u0+du*7,U1=u0+du*9,V0=top?v0+dv*10:v0,V1=top?v0+dv*12:v0+dv*13;const uv=[[U0,V0],[U1,V0],[U0,V1],[U1,V1]];
     for(let k=0;k<4;k++){O.p.push(...v[k]);O.n.push(...n);O.u.push(...uv[k]);O.c.push(1,1,1);O.l.push(sk,1);O.s.push(0);}O.i.push(b,b+1,b+2,b+2,b+1,b+3);}continue;}
   const[u0,v0,u1,v1]=tileUV(bd.t);const e=.15,sw=id===36||id===37||id===38?1:0;
   for(const q of[[[wx+e,wz+e],[wx+1-e,wz+1-e]],[[wx+1-e,wz+e],[wx+e,wz+1-e]]]){for(const flip of[0,1]){const b=O.p.length/3;const A=flip?q[1]:q[0],Bq=flip?q[0]:q[1];
     O.p.push(A[0],y,A[1],Bq[0],y,Bq[1],A[0],y+.9,A[1],Bq[0],y+.9,Bq[1]);for(let k=0;k<4;k++){O.n.push(0,1,0);O.c.push(.92,.92,.92);O.l.push(sk,bl);}
     O.u.push(flip?u1:u0,v0,flip?u0:u1,v0,flip?u1:u0,v1-(v1-v0)*.1,flip?u0:u1,v1-(v1-v0)*.1);O.s.push(0,0,sw*.9,sw*.9);O.i.push(b,b+1,b+2,b+2,b+1,b+3);}}continue;}
  const water=id===5,lava=id===20;
  for(let f=0;f<6;f++){const T=FT[f],ny=y+T.dy;if(ny<0)continue;const n=i+T.dn,nIn=ny<CH,nb=nIn?vol[n]:0;
   if(water){if(nb===5||OPQ[nb])continue;}else if(lava){if(nb===20||OPQ[nb])continue;}else{if(OPQ[nb])continue;if(nb===id&&TRN[id])continue;}
   const buf=water?Wt:TRN[id]?Cu:Op;const tile=T.k==='f'?(bd.f??bd.s):bd[T.k],t4=tile*4,u0=TUV[t4],v0=TUV[t4+1],u1=TUV[t4+2],v1=TUV[t4+3];const base=buf.p.length/3;
   const liquidTop=(water||lava)&&vol[i+WW]!==id;let a0=3,a1=3,a2=3,a3=3;const sway=bd.leaf?1:0;
   for(let k=0;k<4;k++){const C=T.cs[k];const y1=ny+C.y1,y2=ny+C.y2,y3=ny+C.y3;const k1=nIn&&y1>=0&&y1<CH,k2=nIn&&y2>=0&&y2<CH,k3=nIn&&y3>=0&&y3<CH;
    const o1=k1&&OPQ[vol[n+C.o1]]?1:0,o2=k2&&OPQ[vol[n+C.o2]]?1:0,o3=k3&&OPQ[vol[n+C.o3]]?1:0;const a=o1&&o2?0:3-(o1+o2+o3);
    let sk=15,bl=0,cnt=1;if(nIn){const v=lv[n];sk=v>>4;bl=v&15;}
    if(!o1){if(k1){const v=lv[n+C.o1];sk+=v>>4;bl+=v&15;}else sk+=15;cnt++;}
    if(!o2){if(k2){const v=lv[n+C.o2];sk+=v>>4;bl+=v&15;}else sk+=15;cnt++;}
    if(!o3&&!(o1&&o2)){if(k3){const v=lv[n+C.o3];sk+=v>>4;bl+=v&15;}else sk+=15;cnt++;}
    sk/=cnt;bl/=cnt;const sf=sk|0,bf=bl|0;const skv=LC[sf]+(LC[sf<15?sf+1:15]-LC[sf])*(sk-sf),blv=LC[bf]+(LC[bf<15?bf+1:15]-LC[bf])*(bl-bf);
    const sh=(water?1:AOL[a])*T.sh;let py=y+C.qy;if(liquidTop&&C.qy)py-=water?.12:.1;
    buf.p.push(wx+C.qx,py,wz+C.qz);buf.n.push(T.nx,T.ny,T.nz);buf.u.push(C.u?u1:u0,C.v?v1:v0);buf.c.push(sh,sh,sh);buf.l.push(skv,blv);buf.s.push(sway?.5+.5*C.qy:0);
    if(k===0)a0=a;else if(k===1)a1=a;else if(k===2)a2=a;else a3=a;}
   if(a0+a3>a1+a2)buf.i.push(base,base+1,base+3,base,base+3,base+2);else buf.i.push(base,base+1,base+2,base+2,base+1,base+3);}}
 const mk=(b,m,shadow)=>{if(!b.i.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.setAttribute('lt',new THREE.Float32BufferAttribute(b.l,2));g.setAttribute('sway',new THREE.Float32BufferAttribute(b.s,1));
  g.setIndex(b.p.length/3>65535?new THREE.Uint32BufferAttribute(b.i,1):new THREE.Uint16BufferAttribute(b.i,1));g.computeBoundingSphere();const me=new THREE.Mesh(g,m);me.castShadow=shadow;me.receiveShadow=true;me.matrixAutoUpdate=false;return me;};
 dropMeshes(c,scene);c.mesh=mk(Op,mats.solid,true);c.cmesh=mk(Cu,mats.cut,true);if(c.cmesh)c.cmesh.customDepthMaterial=mats.leafDepth;c.pmesh=mk(Pl,mats.cut,false);c.wmesh=mk(Wt,mats.water,false);for(const k of['mesh','cmesh','pmesh'])if(c[k])scene.add(c[k]);if(c.wmesh){c.wmesh.renderOrder=2;scene.add(c.wmesh);}
 c.dirty=false;c.urgent=false;c.meshed=true;}
export function dropMeshes(c,scene){for(const k of['mesh','cmesh','pmesh','wmesh']){if(c[k]){scene.remove(c[k]);c[k].geometry.dispose();c[k]=null;}}}
export function clearAll(scene){for(const c of chunks.values())dropMeshes(c,scene);chunks.clear();lastC=null;}
// stream: mesh dirty chunks nearest-first within radius, time-budgeted; unload far chunks
export let shadowR=3;export function setShadowR(r){shadowR=r;}
export function stream(px,pz,rd,mats,scene,budgetMs,maxN=99){const pcx=Math.floor(px/CS),pcz=Math.floor(pz/CS);const todo=[];
 for(let dx=-rd;dx<=rd;dx++)for(let dz=-rd;dz<=rd;dz++){if(dx*dx+dz*dz>rd*rd+1)continue;const c=chunk(pcx+dx,pcz+dz);if(c.dirty)todo.push([c.urgent?-1:dx*dx+dz*dz,c]);}
 todo.sort((a,b)=>a[0]-b[0]);const t0=performance.now();let n=0;for(const[,c]of todo){if(n>=maxN||(n>0&&performance.now()-t0>budgetMs))break;meshChunk(c,mats,scene);n++;}
 for(const[k,c]of chunks){if(Math.abs(c.cx-pcx)>rd+3||Math.abs(c.cz-pcz)>rd+3){dropMeshes(c,scene);chunks.delete(k);if(lastC===c)lastC=null;}else{const v=!(Math.abs(c.cx-pcx)>rd+1||Math.abs(c.cz-pcz)>rd+1);for(const k of['mesh','cmesh','pmesh','wmesh'])if(c[k])c[k].visible=v;const sh=Math.max(Math.abs(c.cx-pcx),Math.abs(c.cz-pcz))<=shadowR;if(c.mesh)c.mesh.castShadow=sh;if(c.cmesh)c.cmesh.castShadow=sh;}}
 return todo.length-n;}
