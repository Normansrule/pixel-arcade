// BLOCK BEASTS — voxel island engine (adapted from the arcade's voxel/ engine):
// designed island with biomes, flattened village + tower sites, caves, chunked face-culled meshing with AO,
// biome-tinted grass, swaying plants and leaves, procedural texture atlas, water shader, sky, clouds, lanterns.
import * as THREE from '../vendor/three.module.min.js';
import {Sky} from '../vendor/jsm/objects/Sky.js';
import {SimplexNoise} from '../vendor/jsm/math/SimplexNoise.js';
import {TOWERS} from './data.js';

export const CS=16,CH=84,SEA=24;
export let RD=5;export function setRD(r){RD=r;}
export const hash=(x,y,z,s)=>{let h=(x*374761393+y*668265263+z*2147483647+s*1013904223)|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;};
export const mulberry=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const sstep=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t);};

/* ================= blocks ================= */
// t/s/b = top/side/bottom tile in the 8x8 atlas. mine = material dropped + seconds to break
export const B=[null,
 {n:'GRASS',t:0,s:1,b:2,tint:1},{n:'DIRT',t:2,s:2,b:2},{n:'STONE',t:3,s:3,b:3,mine:['stone',.9]},{n:'SAND',t:4,s:4,b:4},
 {n:'WATER',t:5,s:5,b:5,liquid:1},{n:'LOG',t:7,s:6,b:7,mine:['wood',.7]},{n:'LEAVES',t:8,s:8,b:8,trans:1,tint:2,sway:1},{n:'PLANKS',t:9,s:9,b:9},
 {n:'GLASS',t:10,s:10,b:10,trans:1},{n:'SNOW',t:11,s:12,b:2},{n:'CRYSTAL',t:13,s:13,b:13,glow:1,mine:['crystal',1.3]},{n:'COBBLE',t:14,s:14,b:14,mine:['stone',.8]},
 {n:'ROOF',t:15,s:15,b:15},{n:'LANTERN',t:16,s:16,b:16,glow:1,light:1},{n:'BEDROCK',t:17,s:17,b:17},{n:'SANDSTONE',t:19,s:18,b:19},
 {n:'ICE',t:20,s:20,b:20},{n:'CACTUS',t:22,s:21,b:22,trans:1},{n:'TALLGRASS',cross:23,tint:1},{n:'POPPY',cross:24},
 {n:'DAISY',cross:25},{n:'DEADBUSH',cross:26},{n:'PINE',t:27,s:27,b:27,trans:1,sway:.5},{n:'MOSS',t:28,s:28,b:28,mine:['stone',.9]},
 {n:'MAGMA',t:29,s:29,b:29,glow:1},{n:'SNOWBRICK',t:30,s:30,b:30},{n:'WORKBENCH',t:31,s:32,b:9,station:'bench'},{n:'TERMINAL',t:49,s:33,b:49,glow:1,station:'pc'},
 {n:'VINEBRICK',t:34,s:34,b:34},{n:'KILNBRICK',t:35,s:35,b:35},{n:'RIMEBRICK',t:36,s:36,b:36},{n:'GROVE BEACON',t:37,s:37,b:37,glow:1,light:1},
 {n:'KILN BEACON',t:38,s:38,b:38,glow:1,light:1},{n:'RIME BEACON',t:39,s:39,b:39,glow:1,light:1},{n:'PATH',t:40,s:2,b:2},{n:'TEAL WOOL',t:41,s:41,b:41},
 {n:'ORANGE WOOL',t:42,s:42,b:42},{n:'PLASTER',t:43,s:43,b:43},{n:'MEND CRYSTAL',t:44,s:44,b:44,glow:1,light:1,station:'mend'},{n:'GRAVEL',t:45,s:45,b:45},
 {n:'FERN',cross:46,tint:1},{n:'BLUEBELL',cross:47},{n:'MUSHROOM',cross:48},{n:'POLISHED',t:49,s:50,b:49},{n:'SNOWPINE',t:51,s:51,b:51,trans:1,sway:.4},
];
export const ID={};B.forEach((b,i)=>{if(b)ID[b.n.replace(/ /g,'_')]=i;});
export const solid=id=>id>0&&!B[id].liquid&&!B[id].cross;
export const opaque=id=>id>0&&!B[id].liquid&&!B[id].trans&&!B[id].cross;

/* ================= texture atlas (procedural 16x16 tiles, 8x8 grid) ================= */
export function atlas(){const N=8,c=document.createElement('canvas');c.width=c.height=N*16;const x=c.getContext('2d');const e=document.createElement('canvas');e.width=e.height=N*16;const ex=e.getContext('2d');ex.fillStyle='#000';ex.fillRect(0,0,128,128);
 const R=mulberry(7);const tile=(i,fn,glow)=>{const ox=(i%N)*16,oy=(i/N|0)*16;for(let py=0;py<16;py++)for(let px=0;px<16;px++){const col=fn(px,py,R());if(!col)continue;x.fillStyle=col;x.fillRect(ox+px,oy+py,1,1);if(glow){const g=glow===true?col:glow(px,py,col);if(g){ex.fillStyle=g;ex.fillRect(ox+px,oy+py,1,1);}}}};
 const v=(r,g,b,n,k)=>`rgb(${Math.max(0,Math.min(255,r+n*k))|0},${Math.max(0,Math.min(255,g+n*k))|0},${Math.max(0,Math.min(255,b+n*k))|0})`;
 const H=(px,py,i,s=1)=>hash(px>>s,py>>s,i,5);
 // grass is light so the per-biome vertex tint can colour it
 tile(0,(px,py,r)=>v(156,204,132,r-.5+(H(px,py,0,0)<.1?.6:0),44));
 tile(1,(px,py,r)=>py<3+((px*7)%3===0?1:0)?v(96,150,64,r-.5,36):v(128,92,62,r-.5,36));
 tile(2,(px,py,r)=>v(128,92,62,r-.5+(H(px,py,2)<.12?-.8:0),36));
 tile(3,(px,py,r)=>v(132,132,138,(H(px,py,3,2)-.5)*.8+r*.4-.2,34));
 tile(4,(px,py,r)=>v(230,212,158,r-.5,24));
 tile(5,(px,py,r)=>v(40,96,190,r-.5,20));
 tile(6,(px,py,r)=>v(108,80,50,((px%4===0)?-.6:0)+r*.4,46));
 tile(7,(px,py,r)=>{const d=Math.hypot(px-7.5,py-7.5);return d>7?v(108,80,50,r-.5,30):v(180,146,96,(Math.floor(d)%2?-.3:.2)+r*.3,40);});
 tile(8,(px,py,r)=>r<.1?null:v(150,200,110,r-.5+(H(px,py,8)<.2?-.5:0),60));
 tile(9,(px,py,r)=>v(184,142,88,(py%4===0?-.7:0)+((px+(py>>2)*5)%8===0?-.6:0)+r*.3,36));
 tile(10,(px,py,r)=>px===0||py===0||px===15||py===15?v(220,236,246,r*.2,20):(px===py&&px>3&&px<9)||(px===py+1&&px>4&&px<10)?'rgba(255,255,255,.9)':null);
 tile(11,(px,py,r)=>v(240,246,252,r-.5,14));
 tile(12,(px,py,r)=>py<4+((px*5)%3===0?1:0)?v(240,246,252,r-.5,14):v(128,92,62,r-.5,36));
 tile(13,(px,py,r)=>{const s=H(px,py,13)<.22;return s?v(140,240,255,r-.5,50):v(110,110,122,r-.5,30);},(px,py,c)=>H(px,py,13)<.22?c:null);
 tile(14,(px,py,r)=>{const c=hash(px>>2,py>>2,14,1);return v(122,122,128,(c-.5)*1.4+(px%4===0||py%4===0?-.7:0),36);});
 tile(15,(px,py,r)=>v(176,82,58,(py%4===0?-.8:0)+((px+((py>>2)%2)*4)%8===0?-.4:0)+r*.3,36));
 tile(16,(px,py,r)=>px===0||px===15||py===0||py===15||px===7||py===7?v(60,48,36,r*.3,20):v(255,214,140,r*.3,30),(px,py,c)=>px===0||px===15||py===0||py===15||px===7||py===7?null:c);
 tile(17,(px,py,r)=>v(56,56,60,r-.5,40));
 tile(18,(px,py,r)=>v(222,196,138,(py<3?.4:py>12?-.4:0)+(py%5===0?-.3:0)+r*.3,30));
 tile(19,(px,py,r)=>v(228,204,146,r-.5,20));
 tile(20,(px,py,r)=>v(170,214,250,(px+py)%11===0?.8:r*.3-.15,40));
 tile(21,(px,py,r)=>(px===0||px===15)?null:v(80,150,60,(px%4===1?.5:0)+r*.2-.2,46));
 tile(22,(px,py,r)=>(px===0||px===15||py===0||py===15)?v(60,120,44,0,0):v(110,176,74,r*.3,30));
 tile(23,(px,py,r)=>{const bl=[2,5,8,11,13];for(const b of bl){const hgt=8+((b*7)%6);if(Math.abs(px-b-(15-py)*.12*(b%2?1:-1))<1&&15-py<hgt)return v(160,210,110,r*.4,40);}return null;});
 const flower=(i,cr,cg,cb)=>tile(i,(px,py,r)=>{if(px>=7&&px<=8&&py>=7)return v(70,140,50,r*.3,30);if((px===5||px===10)&&py>=10&&py<=12)return v(80,160,60,0,0);const d=Math.hypot(px-7.5,py-4.5);if(d<1.3)return v(250,220,80,0,0);if(d<3.4)return v(cr,cg,cb,r*.3,30);return null;});
 flower(24,230,60,60);flower(25,248,246,236);
 tile(26,(px,py,r)=>{const br=[[7,15,7,6],[7,9,3,4],[8,10,12,5],[5,6,3,2],[11,6,13,3]];for(const[a,b,c,d]of br){const t=(py-b)/(d-b||1);if(t>=0&&t<=1&&Math.abs(px-(a+(c-a)*t))<.8)return v(140,104,62,r*.3,30);}return null;});
 tile(27,(px,py,r)=>r<.08?null:v(54,96,62,r-.5+((px+py*2)%5===0?-.5:0),40));
 tile(28,(px,py,r)=>H(px,py,28)<.45?v(90,140,70,r-.5,40):v(120,122,124,r-.5,30));
 tile(29,(px,py,r)=>{const c=H(px,py,29,1);return c<.35?v(255,120,30,r*.5,60):v(60,30,26,r-.5,30);},(px,py,c)=>H(px,py,29,1)<.35?c:null);
 tile(30,(px,py,r)=>(py%5===0||((px+((py/5|0)%2)*4)%8===0))?v(190,214,236,r*.2,20):v(236,244,252,r-.5,14));
 tile(31,(px,py,r)=>px<2||px>13||py<2||py>13?v(130,92,52,r*.3,30):(px===7||py===7)?v(90,64,38,0,0):v(190,150,96,r*.3,30));
 tile(32,(px,py,r)=>py<3?v(190,150,96,r*.3,30):(px>=3&&px<=5&&py>4&&py<12)?v(150,150,160,r*.2,20):(px>=9&&px<=12&&py>5&&py<9)?v(120,80,40,0,0):v(150,110,66,(py%4===0?-.5:0)+r*.3,30));
 tile(33,(px,py,r)=>px<2||px>13||py<2||py>11?v(70,74,84,r*.3,20):((py+px*0)%3===0?v(60,250,200,0,0):v(30,160,150,r*.3,30)),(px,py,c)=>px<2||px>13||py<2||py>11?null:c);
 const brick=(i,cr,cg,cb,mr,mg,mb)=>tile(i,(px,py,r)=>(py%4===0||((px+((py>>2)%2)*4)%8===0))?v(mr,mg,mb,r*.2,20):v(cr,cg,cb,r-.5+(H(px,py,i,2)<.15?-.5:0),30));
 brick(34,96,132,88,70,90,64);
 tile(34,(px,py,r)=>{const m=(py%4===0||((px+((py>>2)%2)*4)%8===0));const vine=Math.abs(px-(4+Math.sin(py*.6)*2))<1.2||Math.abs(px-(12+Math.cos(py*.5)*1.5))<1;return vine&&H(px,py,99,0)<.85?v(70,150,50,r*.4,40):m?v(80,86,74,r*.2,20):v(150,156,138,r-.5,24);});
 brick(35,170,72,48,90,40,30);brick(36,190,222,244,120,160,200);
 const beacon=(i,cr,cg,cb)=>tile(i,(px,py,r)=>{const d=Math.max(Math.abs(px-7.5),Math.abs(py-7.5));return d>6.5?v(60,60,66,0,0):v(cr,cg,cb,(7-d)*.08+r*.2,60);},(px,py,c)=>Math.max(Math.abs(px-7.5),Math.abs(py-7.5))>6.5?null:c);
 beacon(37,120,255,120);beacon(38,255,150,60);beacon(39,140,230,255);
 tile(40,(px,py,r)=>v(160,146,120,(H(px,py,40,1)-.5)*.9+r*.3,36));
 tile(41,(px,py,r)=>v(40,180,170,(py%2?-.1:.1)+r*.3,24));
 tile(42,(px,py,r)=>v(240,130,40,(py%2?-.1:.1)+r*.3,24));
 tile(43,(px,py,r)=>v(238,230,214,r-.5,14));
 tile(44,(px,py,r)=>{const d=Math.abs(px-7.5)+Math.abs(py-7.5)*.6;return d<7?v(255,140,200,(7-d)*.06+r*.2,50):v(80,70,90,r*.2,20);},(px,py,c)=>Math.abs(px-7.5)+Math.abs(py-7.5)*.6<7?c:null);
 tile(45,(px,py,r)=>v(140,136,130,(H(px,py,45,0)-.5)*1.2,40));
 tile(46,(px,py,r)=>{const t=15-py;for(const s of[-1,1]){const cx=7.5+s*t*.32;if(Math.abs(px-cx)<1.6-t*.06&&t<14&&(t%3!==0||Math.abs(px-cx)<.7))return v(120,180,90,r*.4,40);}return Math.abs(px-7.5)<.8&&t<12?v(100,160,80,0,0):null;});
 flower(47,90,120,240);
 tile(48,(px,py,r)=>{if(px>=6&&px<=9&&py>=9)return v(236,226,206,r*.2,20);const d=Math.hypot((px-7.5)/1.3,py-8);return d<5.2&&py<=9?(H(px,py,48,0)<.15?v(250,250,250,0,0):v(210,60,50,r*.3,30)):null;});
 tile(49,(px,py,r)=>v(170,170,178,(px===0||py===0?.4:px===15||py===15?-.5:0)+r*.15,30));
 tile(50,(px,py,r)=>v(160,160,168,(py<2?.4:py>13?-.5:0)+(px%8===0?-.3:0)+r*.15,30));
 tile(51,(px,py,r)=>r<.08?null:py<5+(H(px,0,51,0)*4|0)?v(240,246,252,r-.5,14):v(54,96,62,r-.5,40));
 const mk=cv=>{const t=new THREE.CanvasTexture(cv);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.colorSpace=THREE.SRGBColorSpace;return t;};
 return{map:mk(c),em:mk(e),canvas:c};}

/* ================= island terrain ================= */
const noise=new SimplexNoise({random:mulberry(90210)});
const fbm=(x,z,o)=>{let s=0,a=1,f=1,n=0;for(let i=0;i<o;i++){s+=noise.noise(x*f,z*f)*a;n+=a;a*=.5;f*=2;}return s/n;};
export const BIOMES=['meadow','forest','desert','snow','highlands'];
const CENTERS=[[0,0,0],[-22,44,0],[44,-24,0],[-104,-10,1],[-72,-74,1],[-62,40,1],[112,24,2],[84,84,2],[4,-134,3],[-62,-122,3],[62,-140,3],[104,-82,4],[138,-36,4]];
export const ZONES=[{x:0,z:0,r:34,f:12,h:SEA+5}];
for(const t of TOWERS)ZONES.push({x:t.cx,z:t.cz,r:22,f:10,h:null,tower:t});
function rawHeight(x,z){
 const qx=x+noise.noise(x*.009,z*.009)*24,qz=z+noise.noise(x*.009+50,z*.009-50)*24;
 const ds=CENTERS.map(c=>Math.hypot(qx-c[0],qz-c[1]));const dmin=Math.min(...ds);const w=[0,0,0,0,0];for(let i=0;i<ds.length;i++)w[CENTERS[i][2]]+=Math.exp(-(ds[i]-dmin)/11);const sw=w.reduce((a,b)=>a+b,0);for(let i=0;i<5;i++)w[i]/=sw;
 const hills=fbm(x*.022,z*.022,3),ridge=Math.pow(1-Math.abs(noise.noise(x*.013,z*.013)),2),mnt=Math.max(0,noise.noise(x*.011+7,z*.011-3)+.35);
 const hb=[SEA+5+hills*3,SEA+6+hills*5,SEA+5+(1-Math.abs(noise.noise(x*.035,z*.05)))*3.5+hills*1.5,SEA+10+hills*5+ridge*11,SEA+12+mnt*mnt*30+hills*4];
 let h=0;for(let i=0;i<5;i++)h+=w[i]*hb[i];
 // island coastline; the south bay comes close to the village
 const d=Math.hypot(x,z)||1,ang=Math.atan2(z,x);const coast=176+noise.noise(Math.cos(ang)*1.6,Math.sin(ang)*1.6)*20+fbm(x*.012,z*.012,2)*12-84*sstep(.3,1,z/d);
 const land=sstep(coast+8,coast-18,d);h=SEA-9+fbm(x*.03,z*.03,2)*3+(h-(SEA-9))*Math.pow(land,.7);
 let bi=0;for(let i=1;i<5;i++)if(w[i]>w[bi])bi=i;return{h,w,bi,land};}
for(const z of ZONES)if(z.h===null)z.h=Math.max(SEA+4,Math.round(rawHeight(z.x,z.z).h));
const hcache=new Map();
export function terrain(x,z){const k=x*100003+z;let v=hcache.get(k);if(v)return v;const r=rawHeight(x,z);let h=r.h,zone=null;
 for(const Z of ZONES){const d=Math.hypot(x-Z.x,z-Z.z);if(d<Z.r+Z.f){const k2=1-sstep(Z.r,Z.r+Z.f,d);h=h+(Z.h-h)*k2;if(d<Z.r+Z.f*.6)zone=Z;}}
 h=Math.max(3,Math.min(CH-8,Math.floor(h)));
 let biome=BIOMES[r.bi];if(h<=SEA+1&&biome!=='snow'||h<=SEA+3&&r.land<.97&&biome!=='snow'&&biome!=='highlands'&&!zone)biome='beach';
 v={h,biome,w:r.w,zone,snowy:biome==='snow'};if(hcache.size>250000)hcache.clear();hcache.set(k,v);return v;}
// grass/leaf tint per biome weights
const TINT={grass:[[.5,.74,.36],[.36,.6,.24],[.8,.74,.38],[.56,.7,.56],[.5,.64,.34]],leaf:[[.46,.74,.3],[.3,.56,.22],[.66,.66,.28],[.38,.56,.42],[.4,.58,.32]]};
function tintAt(x,z,kind){const T=terrain(x,z),t=TINT[kind];let r=0,g=0,b=0;for(let i=0;i<5;i++){r+=T.w[i]*t[i][0];g+=T.w[i]*t[i][1];b+=T.w[i]*t[i][2];}const n=noise.noise(x*.05,z*.05)*.06;return[r+n,g+n,b+n*.5];}

/* ================= structures (village, towers) ================= */
const SB=new Map();// chunkKey -> [[x,y,z,id],...]
export const STATIONS=[];// interactive blocks
export const LANTERNS=[];
export const SITES={};// named positions for NPCs
function put(x,y,z,id){const k=Math.floor(x/CS)+','+Math.floor(z/CS);let a=SB.get(k);if(!a)SB.set(k,a=[]);a.push([x,y,z,id]);if(id&&B[id].station)STATIONS.push({x,y,z,kind:B[id].station});}
function fill(x0,y0,z0,x1,y1,z1,id){for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)for(let z=Math.min(z0,z1);z<=Math.max(z0,z1);z++)put(x,y,z,id);}
function lantern(x,y,z){fill(x,y,z,x,y+2,z,ID.LOG);put(x,y+3,z,ID.LANTERN);LANTERNS.push(new THREE.Vector3(x+.5,y+3.5,z+.5));}
// house: footprint (x0,z0)-(x0+w-1,z0+d-1), door on face 'n'|'s'|'e'|'w'
function house(x0,z0,w,d,y,roof,wall,door,hgt=4){const x1=x0+w-1,z1=z0+d-1;
 fill(x0,y-1,z0,x1,y-1,z1,ID.COBBLE);fill(x0+1,y,z0+1,x1-1,y+hgt+6,z1-1,0);
 for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){const edge=x===x0||x===x1||z===z0||z===z1;if(!edge){put(x,y-1,z,ID.PLANKS);continue;}const corner=(x===x0||x===x1)&&(z===z0||z===z1);
  for(let yy=y;yy<y+hgt;yy++){let id=corner?ID.LOG:wall;const mid=(x===x0||x===x1)?(z-z0)%3===1&&z>z0+1&&z<z1-1:(x-x0)%3===1&&x>x0+1&&x<x1-1;if(!corner&&yy===y+1&&mid)id=ID.GLASS;put(x,yy,z,id);}}
 const dx=door==='e'?x1:door==='w'?x0:(x0+x1)>>1,dz=door==='s'?z1:door==='n'?z0:(z0+z1)>>1;put(dx,y,dz,0);put(dx,y+1,dz,0);
 // stepped roof
 for(let l=0;l<=Math.ceil(Math.min(w,d)/2);l++){const ax=x0-1+l,bx=x1+1-l,az=z0-1+l,bz=z1+1-l;if(ax>bx||az>bz)break;for(let x=ax;x<=bx;x++)for(let z=az;z<=bz;z++)if(x===ax||x===bx||z===az||z===bz||ax+1>=bx||az+1>=bz)put(x,y+hgt+l,z,roof);}
 return{dx,dz};}
function buildVillage(){const y=SEA+6;// standing level (ground block at y-1)
 // roads + plaza
 for(let i=-44;i<=44;i++)for(let j=-1;j<=1;j++){if(Math.abs(i)<=7)continue;const far=Math.abs(i)>30;put(i,far?terrain(i,j).h:y-1,j,ID.PATH);put(j,far?terrain(j,i).h:y-1,i,ID.PATH);}
 for(let x=-7;x<=7;x++)for(let z=-7;z<=7;z++)if(x*x+z*z<=50)put(x,y-1,z,ID.PATH);
 // fountain
 for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){const e=Math.abs(x)===2||Math.abs(z)===2;put(x,y,z,e?ID.POLISHED:ID.WATER);put(x,y-1,z,ID.POLISHED);}put(0,y,0,ID.POLISHED);put(0,y+1,0,ID.CRYSTAL);LANTERNS.push(new THREE.Vector3(.5,y+1.5,.5));
 for(const[a,b]of[[-6,-6],[6,-6],[-6,6],[6,6]])lantern(a,y,b);
 for(let i=10;i<=37;i+=9){const L=(a,b)=>lantern(a,Math.abs(a)>30||Math.abs(b)>30?terrain(a,b).h+1:y,b);L(i,-3);L(-i,3);L(3,i);L(-3,-i);}
 // professor's lab (north-west), healer (north-east), shop (south-east), workbench (south-west)
 house(-19,-19,11,9,y,ID.ROOF,ID.PLASTER,'s',5);SITES.prof={x:-13.5,z:-8.2};for(let i=0;i<3;i++){fill(-17+i*3,y,-7,-17+i*3,y,-7,ID.POLISHED);}SITES.ped=[[-16.5,-6.5],[-13.5,-6.5],[-10.5,-6.5]].map(([x,z])=>({x,z,y:y+1}));
 house(9,-18,9,8,y,ID.TEAL_WOOL,ID.PLANKS,'s');SITES.healer={x:13.5,z:-8.5};put(16,y,-10,ID.TERMINAL);put(16,y+1,-10,0);put(10,y,-10,ID.MEND_CRYSTAL);
 // shop stall
 for(const[a,b]of[[9,9],[17,9],[9,14],[17,14]])fill(a,y,b,a,y+3,b,ID.LOG);for(let x=8;x<=18;x++)for(let z=8;z<=15;z++)put(x,y+4,z,(x+z)%2?ID.ORANGE_WOOL:ID.PLASTER);fill(10,y,10,16,y,10,ID.PLANKS);SITES.shop={x:13.5,z:12};SITES.shopFront={x:13.5,z:7.5};
 for(const x of[11,15])put(x,y,13,ID.PLANKS);
 // workbench pergola
 for(const[a,b]of[[-17,9],[-10,9],[-17,14],[-10,14]])fill(a,y,b,a,y+3,b,ID.LOG);for(let x=-17;x<=-10;x++)for(const z of[9,11.5|0,14])put(x,y+4,z,ID.LOG);put(-14,y,11,ID.WORKBENCH);put(-13,y,11,ID.WORKBENCH);SITES.bench={x:-13,z:10};
 // homes
 house(-31,-4,7,7,y,ID.ROOF,ID.PLANKS,'e');house(24,-4,7,7,y,ID.TEAL_WOOL,ID.PLASTER,'w');house(-4,-32,7,7,y,ID.ROOF,ID.PLASTER,'s');house(-25,18,7,6,y,ID.ORANGE_WOOL,ID.PLANKS,'n');house(20,20,8,7,y,ID.ROOF,ID.PLANKS,'n');
 // flower beds
 const fl=[ID.POPPY,ID.DAISY,ID.BLUEBELL];for(let i=0;i<60;i++){const a=hash(i,1,2,3)*6.283,r=9+hash(i,2,3,4)*20;const x=Math.round(Math.cos(a)*r),z=Math.round(Math.sin(a)*r);if(Math.abs(x)<=2||Math.abs(z)<=2)continue;put(x,y,z,fl[i%3]);}
 SITES.spawn={x:-6.5,z:-.5,y};SITES.villageY=y;}
function buildTower(t){const Z=ZONES.find(z=>z.tower===t);const cx=t.cx,cz=t.cz,Y0=Z.h;// plaza top block at Y0
 const brick={leaf:ID.VINEBRICK,ember:ID.KILNBRICK,frost:ID.RIMEBRICK}[t.theme],trim={leaf:ID.MOSS,ember:ID.SANDSTONE,frost:ID.SNOWBRICK}[t.theme],bea={leaf:ID.GROVE_BEACON,ember:ID.KILN_BEACON,frost:ID.RIME_BEACON}[t.theme];
 const PH=15,T1=10,T2=6;
 for(let x=-PH;x<=PH;x++)for(let z=-PH;z<=PH;z++){const e=Math.max(Math.abs(x),Math.abs(z));put(cx+x,Y0,cz+z,e===PH?trim:(x+z)%2?brick:trim);fill(cx+x,Y0+1,cz+z,cx+x,Y0+18,cz+z,0);}
 // tier 1 (top Y0+4) and tier 2 (top Y0+8) with trim edges
 fill(cx-T1,Y0+1,cz-T1,cx+T1,Y0+4,cz+T1,brick);for(let i=-T1;i<=T1;i++){put(cx+i,Y0+4,cz-T1,trim);put(cx+i,Y0+4,cz+T1,trim);put(cx-T1,Y0+4,cz+i,trim);put(cx+T1,Y0+4,cz+i,trim);}
 fill(cx-T2,Y0+5,cz-T2,cx+T2,Y0+8,cz+T2,brick);for(let i=-T2;i<=T2;i++){put(cx+i,Y0+8,cz-T2,trim);put(cx+i,Y0+8,cz+T2,trim);put(cx-T2,Y0+8,cz+i,trim);put(cx+T2,Y0+8,cz+i,trim);}
 for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)put(cx+x,Y0+8,cz+z,Math.max(Math.abs(x),Math.abs(z))===2?bea:trim);
 // stairs: south face to tier 1, east face to tier 2
 for(let s=0;s<3;s++)for(let w=-1;w<=1;w++)fill(cx+w,Y0+1,cz+T1+1+s,cx+w,Y0+3-s,cz+T1+1+s,trim);
 for(let s=0;s<3;s++)for(let w=-1;w<=1;w++)fill(cx+T2+1+s,Y0+5,cz+w,cx+T2+1+s,Y0+7-s,cz+w,trim);
 // beacons on corners
 for(const[a,b]of[[-T2,-T2],[T2,-T2],[-T2,T2],[T2,T2]]){put(cx+a,Y0+8,cz+b,bea);LANTERNS.push(new THREE.Vector3(cx+a+.5,Y0+9.2,cz+b+.5));}
 for(const[a,b]of[[-T1,-T1],[T1,-T1],[-T1,T1],[T1,T1]]){put(cx+a,Y0+5,cz+b,trim);put(cx+a,Y0+6,cz+b,bea);}
 for(const[a,b]of[[-PH,-PH],[PH,-PH],[-PH,PH],[PH,PH]]){fill(cx+a,Y0+1,cz+b,cx+a,Y0+3,cz+b,brick);put(cx+a,Y0+4,cz+b,bea);LANTERNS.push(new THREE.Vector3(cx+a+.5,Y0+4.5,cz+b+.5));}
 put(cx-12,Y0+1,cz+12,ID.MEND_CRYSTAL);put(cx+12,Y0+1,cz+12,ID.WORKBENCH);
 t.Y0=Y0;t.spots=[{x:cx+5.5,z:cz+13.5,y:Y0+1},{x:cx+9.5,z:cz+4.5,y:Y0+5},{x:cx+.5,z:cz+.5,y:Y0+9}];}
buildVillage();for(const t of TOWERS)buildTower(t);

/* ================= chunks ================= */
export let chunks=new Map();export let edits={};
export function setEdits(e){edits=e||{};if(sceneRef)for(const c of chunks.values())dropAll(c);chunks=new Map();}
function genChunk(cx,cz){const d=new Uint8Array(CS*CS*CH);const I=(x,y,z)=>(y*CS+z)*CS+x;const tops=new Int16Array(CS*CS);
 for(let x=0;x<CS;x++)for(let z=0;z<CS;z++){const wx=cx*CS+x,wz=cz*CS+z,T=terrain(wx,wz),h=T.h,bm=T.biome;const hl=T.w[4];
  const top=bm==='desert'||bm==='beach'?ID.SAND:bm==='snow'?ID.SNOW:bm==='highlands'&&h>SEA+21?(hash(wx,0,wz,4)<.3?ID.MOSS:hash(wx,1,wz,4)<.12?ID.GRAVEL:ID.STONE):ID.GRASS;
  const sub=bm==='desert'||bm==='beach'?ID.SAND:top===ID.STONE||top===ID.MOSS||top===ID.GRAVEL?ID.STONE:ID.DIRT;
  for(let y=0;y<=Math.max(h,SEA);y++){let id=0;if(y===0)id=ID.BEDROCK;else if(y<h-3)id=bm==='desert'&&y>h-7?ID.SANDSTONE:ID.STONE;else if(y<h)id=sub;else if(y===h)id=h<=SEA?(hash(wx,y,wz,2)<.3?ID.GRAVEL:ID.SAND):top;else if(y<=SEA)id=y===SEA&&bm==='snow'?ID.ICE:ID.WATER;
   if(id===ID.STONE){const r=hash(wx,y,wz,11);if(r<(hl>.5?.03:.008)&&y<h-2)id=ID.CRYSTAL;}
   // caves in the highlands (with the odd surface opening)
   if(hl>.45&&y>3&&y<=h-(y>h-3?0:0)&&id!==ID.WATER&&h>SEA+6){const c=noise.noise3d(wx*.055,y*.08,wz*.055)+noise.noise3d(wx*.12,y*.12,wz*.12)*.35;if(c>(y>h-3?.78:.6))id=0;}
   d[I(x,y,z)]=id;}
  tops[z*CS+x]=h;}
 // vegetation (overlapping neighbours so trees cross chunk borders)
 for(let x=-3;x<CS+3;x++)for(let z=-3;z<CS+3;z++){const wx=cx*CS+x,wz=cz*CS+z,T=terrain(wx,wz);if(T.h<=SEA||T.zone)continue;const r=hash(wx,1,wz,9),bm=T.biome;
  const putb=(px,py,pz,id,soft)=>{if(px<0||pz<0||px>=CS||pz>=CS||py<0||py>=CH)return;const i=I(px,py,pz);if(soft&&d[i])return;d[i]=id;};
  const inside=x>=0&&z>=0&&x<CS&&z<CS;const ground=inside?d[I(x,T.h,z)]:0;
  if(inside&&ground===0)continue;
  const oak=()=>{const th=4+Math.floor(hash(wx,2,wz,9)*3);for(let k=1;k<=th;k++)putb(x,T.h+k,z,ID.LOG);for(let dy=th-2;dy<=th+1;dy++){const rad=dy>th-1?1:2;for(let dx=-rad;dx<=rad;dx++)for(let dz=-rad;dz<=rad;dz++){if(Math.abs(dx)===rad&&Math.abs(dz)===rad&&hash(wx+dx,dy,wz+dz,9)<.5)continue;putb(x+dx,T.h+dy,z+dz,ID.LEAVES,true);}}};
  const pine=(lv)=>{const th=6+Math.floor(hash(wx,2,wz,9)*4);for(let k=1;k<=th;k++)putb(x,T.h+k,z,ID.LOG);for(let dy=3;dy<=th+1;dy++){const rad=dy>=th?(dy>th?0:1):((th-dy)%3===0?1:2)-(dy<5?0:0);for(let dx=-rad;dx<=rad;dx++)for(let dz=-rad;dz<=rad;dz++){if(rad>1&&Math.abs(dx)===rad&&Math.abs(dz)===rad)continue;putb(x+dx,T.h+dy,z+dz,lv,true);}}putb(x,T.h+th+2,z,lv,true);};
  if(bm==='desert'){if(r<.006){const hh=2+Math.floor(r*400)%2;for(let k=1;k<=hh;k++)putb(x,T.h+k,z,ID.CACTUS);}else if(r<.014&&inside)putb(x,T.h+1,z,ID.DEADBUSH,true);continue;}
  if(bm==='beach'){continue;}
  if(bm==='snow'){if(r<.022)pine(ID.SNOWPINE);continue;}
  if(bm==='highlands'){if(ground===ID.GRASS){if(r<.008)pine(ID.PINE);else if(r<.08&&inside)putb(x,T.h+1,z,ID.TALLGRASS,true);}continue;}
  if(bm==='forest'){const patch=noise.noise(wx*.04,wz*.04);if(r<.03)(patch>.1?pine(ID.PINE):oak());else if(inside&&ground===ID.GRASS){if(r<.2)putb(x,T.h+1,z,ID.FERN,true);else if(r<.212)putb(x,T.h+1,z,ID.MUSHROOM,true);else if(r<.3)putb(x,T.h+1,z,ID.TALLGRASS,true);}continue;}
  // meadow
  if(r<.005)oak();else if(inside&&ground===ID.GRASS){const fp=noise.noise(wx*.07,wz*.07);if(r<.13)putb(x,T.h+1,z,ID.TALLGRASS,true);else if(fp>.3&&r<.22)putb(x,T.h+1,z,[ID.POPPY,ID.DAISY,ID.BLUEBELL][(hash(wx>>3,0,wz>>3,1)*3)|0],true);}}
 const sl=SB.get(cx+','+cz);if(sl)for(const[a,b,c,id]of sl)d[I(a-cx*CS,b,c-cz*CS)]=id;
 for(const k in edits){const[a,b,c]=k.split(',').map(Number);if(Math.floor(a/CS)===cx&&Math.floor(c/CS)===cz)d[I(a-cx*CS,b,c-cz*CS)]=edits[k];}
 return{cx,cz,d,mesh:null,wmesh:null,dirty:true};}
const key=(cx,cz)=>cx+','+cz;
export function chunk(cx,cz){let c=chunks.get(key(cx,cz));if(!c){c=genChunk(cx,cz);chunks.set(key(cx,cz),c);}return c;}
export function get(x,y,z){if(y<0||y>=CH)return 0;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);const c=chunk(cx,cz);return c.d[(y*CS+(z-cz*CS))*CS+(x-cx*CS)];}
export function set(x,y,z,id){if(y<1||y>=CH)return;const cx=Math.floor(x/CS),cz=Math.floor(z/CS);const c=chunk(cx,cz);c.d[(y*CS+(z-cz*CS))*CS+(x-cx*CS)]=id;c.dirty=true;edits[x+','+y+','+z]=id;
 const lx=x-cx*CS,lz=z-cz*CS;if(lx===0)mark(cx-1,cz);if(lx===CS-1)mark(cx+1,cz);if(lz===0)mark(cx,cz-1);if(lz===CS-1)mark(cx,cz+1);}
const mark=(cx,cz)=>{const c=chunks.get(key(cx,cz));if(c)c.dirty=true;};
// highest standable surface at or below y (feet position)
const FOLIAGE=new Set();
export function ground(x,z,fromY=CH-2){const ix=Math.floor(x),iz=Math.floor(z);for(let y=Math.min(CH-2,Math.floor(fromY));y>0;y--){const id=get(ix,y,iz);if(solid(id)&&!FOLIAGE.has(id))return y+1;if(B[id]?.liquid)return y+1-.15;}return SEA+1;}
[7,23,45].forEach(i=>FOLIAGE.add(i));
export function waterAt(x,y,z){return!!B[get(Math.floor(x),Math.floor(y),Math.floor(z))]?.liquid;}

/* ================= rendering setup ================= */
export const AT=atlas();
export const WU={uTime:{value:0},uClear:{value:new THREE.Vector4(0,0,0,0)}};
export const mat=new THREE.MeshStandardMaterial({map:AT.map,emissiveMap:AT.em,emissive:0xffffff,emissiveIntensity:1.5,vertexColors:true,alphaTest:.5,roughness:.9,metalness:0});
mat.onBeforeCompile=sh=>{sh.uniforms.uTime=WU.uTime;sh.uniforms.uClear=WU.uClear;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vPl;varying vec3 vWq;uniform vec4 uClear;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfloat fd=length(vViewPosition);float ign=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));if(vPl>.5&&fd<2.8){if(ign>(fd-1.)/1.8)discard;}if(vPl>.5&&vPl<1.5&&uClear.w>0.){float cd=distance(vWq.xz,uClear.xz);if(abs(vWq.y-uClear.y)<5.&&ign>(cd-uClear.w)/1.5)discard;}');sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float sway;attribute float pl;varying float vPl;varying vec3 vWq;uniform float uTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPl=pl;vWq=(modelMatrix*vec4(position,1.)).xyz;if(sway>0.){float ph=position.x*.7+position.z*.45;transformed.x+=sway*(sin(uTime*1.6+ph)*.06+sin(uTime*4.3+ph*3.)*.014);transformed.z+=sway*cos(uTime*1.3+ph*1.3)*.05;transformed.y+=sway*sin(uTime*2.1+ph)*.015;}');};
export const wmat=new THREE.MeshStandardMaterial({color:0x1b62a8,transparent:true,opacity:.72,roughness:.08,metalness:.05,envMapIntensity:.5,depthWrite:false});
wmat.onBeforeCompile=sh=>{sh.uniforms.uTime=WU.uTime;
 sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;varying vec3 vWP;varying float vTop;').replace('#include <begin_vertex>','#include <begin_vertex>\nvec4 w0=modelMatrix*vec4(transformed,1.);vTop=step(.5,normal.y);transformed.y+=vTop*((sin(w0.x*1.3+uTime*1.8)+cos(w0.z*1.1+uTime*1.4))*.035-.03);vWP=(modelMatrix*vec4(transformed,1.)).xyz;');
 sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uTime;varying vec3 vWP;varying float vTop;')
  .replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nif(vTop>.5){float dx=cos(vWP.x*1.3+uTime*1.8)*.045+cos(vWP.x*3.1+vWP.z*2.3+uTime*2.6)*.09+cos(vWP.x*7.3-vWP.z*5.1+uTime*3.7)*.035,dz=-sin(vWP.z*1.1+uTime*1.4)*.04+sin(vWP.z*2.7-vWP.x*1.9+uTime*2.2)*.09+sin(vWP.z*6.9+vWP.x*4.7-uTime*3.1)*.035;normal=normalize((viewMatrix*vec4(normalize(vec3(-dx*2.2,1.,-dz*2.2)),0.)).xyz);}')
  .replace('#include <opaque_fragment>','diffuseColor.a=mix(diffuseColor.a,.92,pow(1.-abs(dot(normalize(vViewPosition),normal)),5.));\n#include <opaque_fragment>');};

/* ================= meshing with per-vertex ambient occlusion ================= */
const FACES=[
 {d:[-1,0,0],c:[[0,1,0,0,1],[0,0,0,0,0],[0,1,1,1,1],[0,0,1,1,0]],k:'s'},
 {d:[1,0,0],c:[[1,1,1,0,1],[1,0,1,0,0],[1,1,0,1,1],[1,0,0,1,0]],k:'s'},
 {d:[0,-1,0],c:[[1,0,1,1,0],[0,0,1,0,0],[1,0,0,1,1],[0,0,0,0,1]],k:'b'},
 {d:[0,1,0],c:[[0,1,1,1,1],[1,1,1,0,1],[0,1,0,1,0],[1,1,0,0,0]],k:'t'},
 {d:[0,0,-1],c:[[1,0,0,0,0],[0,0,0,1,0],[1,1,0,0,1],[0,1,0,1,1]],k:'s'},
 {d:[0,0,1],c:[[0,0,1,0,0],[1,0,1,1,0],[0,1,1,0,1],[1,1,1,1,1]],k:'s'}];
const AOL=[.42,.62,.8,1];const SHADE=[.8,.8,.62,1,.88,.88];
let sceneRef=null;export function attach(scene){sceneRef=scene;}
function dropMesh(c,k){if(!c[k])return;sceneRef.remove(c[k]);c[k].geometry.dispose();c[k]=null;}
function dropAll(c){for(const k of['mesh','wmesh'])dropMesh(c,k);}
const TS=8,E=.0008;
function uvOf(tile,q3,q4){const tu=tile%TS,tv=tile/TS|0;return[(tu+(q3?1-E*16:E*16))/TS,1-(tv+1-(q4?1-E*16:E*16))/TS];}
export function meshChunk(c){const P=[],N=[],U=[],C=[],I=[],WP=[],WN=[],WI=[],SW=[],PL=[];const bx=c.cx*CS,bz=c.cz*CS;
 for(let y=0;y<CH;y++)for(let z=0;z<CS;z++)for(let x=0;x<CS;x++){const id=c.d[(y*CS+z)*CS+x];if(!id)continue;const wx=bx+x,wz=bz+z,bd=B[id];
  if(bd.cross){// two crossed quads (both windings), swaying at the top
   const base0=P.length/3,tint=bd.tint?tintAt(wx,wz,'grass'):[1,1,1];const j=(hash(wx,y,wz,3)-.5)*.3;
   const quads=[[[.15+j,0,.15],[.85+j,0,.85]],[[.85+j,0,.15],[.15+j,0,.85]]];
   for(const[a,b]of quads){for(const flip of[0,1]){const base=P.length/3;const pts=[[a[0],0,a[2],0,0],[b[0],0,b[2],1,0],[a[0],1,a[2],0,1],[b[0],1,b[2],1,1]];
     for(const p of pts){P.push(wx+p[0],y+p[1]*.95,wz+p[2]);N.push(0,1,0);const uv=uvOf(bd.cross,p[3],p[4]);U.push(uv[0],uv[1]);const l=p[1]?1:.7;C.push(l*tint[0],l*tint[1],l*tint[2]);SW.push(p[1]?1:0);PL.push(1);}
     if(flip)I.push(base,base+2,base+1,base+1,base+2,base+3);else I.push(base,base+1,base+2,base+2,base+1,base+3);}}
   continue;}
  const tint=bd.tint===1?tintAt(wx,wz,'grass'):bd.tint===2?tintAt(wx,wz,'leaf'):null;
  for(let f=0;f<6;f++){const F=FACES[f],nx=wx+F.d[0],ny=y+F.d[1],nz=wz+F.d[2],nb=get(nx,ny,nz);
   if(id===ID.WATER){if(nb&&(B[nb].liquid||opaque(nb)||nb===ID.ICE))continue;const base=WP.length/3,top=f===3?-.12:0;for(const q of F.c){WP.push(wx+q[0],y+q[1]+(q[1]?top:0),wz+q[2]);WN.push(...F.d);}WI.push(base,base+1,base+2,base+2,base+1,base+3);continue;}
   if(opaque(nb)||(nb===id&&bd.trans))continue;
   const tile=bd[F.k],base=P.length/3,ao=[];const ax=F.d[0]!==0?[1,2]:F.d[1]!==0?[0,2]:[0,1];
   const tf=tint&&(bd.tint===2||f===3)?tint:null;
   for(const q of F.c){const s1=[0,0,0],s2=[0,0,0];s1[ax[0]]=q[ax[0]]?1:-1;s2[ax[1]]=q[ax[1]]?1:-1;
    const o1=opaque(get(nx+s1[0],ny+s1[1],nz+s1[2]))?1:0,o2=opaque(get(nx+s2[0],ny+s2[1],nz+s2[2]))?1:0,oc=opaque(get(nx+s1[0]+s2[0],ny+s1[1]+s2[1],nz+s1[2]+s2[2]))?1:0;
    const a=o1&&o2?0:3-(o1+o2+oc);ao.push(a);const l=AOL[a]*SHADE[f];
    P.push(wx+q[0],y+q[1],wz+q[2]);SW.push(bd.sway?bd.sway*(.55+.45*q[1]):0);PL.push(bd.sway?2:0);N.push(...F.d);const uv=uvOf(tile,q[3],q[4]);U.push(uv[0],uv[1]);if(tf)C.push(l*tf[0],l*tf[1],l*tf[2]);else C.push(l,l,l);}
   if(ao[0]+ao[3]>ao[1]+ao[2])I.push(base,base+1,base+3,base,base+3,base+2);else I.push(base,base+1,base+2,base+2,base+1,base+3);}}
 const mk=(p,n,idx,u,col,m,shadow)=>{if(!idx.length)return null;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));if(u)g.setAttribute('uv',new THREE.Float32BufferAttribute(u,2));if(col)g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeBoundingSphere();const me=new THREE.Mesh(g,m);me.castShadow=shadow;me.receiveShadow=true;return me;};
 dropAll(c);
 c.mesh=mk(P,N,I,U,C,mat,true);if(c.mesh){c.mesh.geometry.setAttribute('sway',new THREE.Float32BufferAttribute(SW,1));c.mesh.geometry.setAttribute('pl',new THREE.Float32BufferAttribute(PL,1));sceneRef.add(c.mesh);}
 c.wmesh=mk(WP,WN,WI,null,null,wmat,false);if(c.wmesh){c.wmesh.renderOrder=2;sceneRef.add(c.wmesh);}
 c.dirty=false;}
export function stream(px,pz,budget){const pcx=Math.floor(px/CS),pcz=Math.floor(pz/CS),todo=[];for(let dx=-RD;dx<=RD;dx++)for(let dz=-RD;dz<=RD;dz++){if(dx*dx+dz*dz>RD*RD+1)continue;const c=chunk(pcx+dx,pcz+dz);if(c.dirty)todo.push([dx*dx+dz*dz,c]);}
 todo.sort((a,b)=>a[0]-b[0]);for(let i=0;i<Math.min(budget,todo.length);i++)meshChunk(todo[i][1]);
 for(const[k,c]of chunks){if(Math.abs(c.cx-pcx)>RD+3||Math.abs(c.cz-pcz)>RD+3){dropAll(c);chunks.delete(k);}}return todo.length;}
export function resetChunks(){for(const c of chunks.values())dropAll(c);chunks=new Map();}

/* ================= voxel ray cast (DDA) ================= */
export function raycast(o,d,maxD,hitWater=false,skipFol=false){let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);const sx=Math.sign(d.x),sy=Math.sign(d.y),sz=Math.sign(d.z);
 const tdx=Math.abs(1/d.x),tdy=Math.abs(1/d.y),tdz=Math.abs(1/d.z);let tx=((sx>0?x+1-o.x:o.x-x))*tdx,ty=((sy>0?y+1-o.y:o.y-y))*tdy,tz=((sz>0?z+1-o.z:o.z-z))*tdz;let px=x,py=y,pz=z,t=0;
 let fol=0;while(t<maxD){const id=get(x,y,z);if(id&&skipFol&&B[id].sway){fol++;}else if(id&&(hitWater||!B[id].liquid)&&!B[id].cross)return{x,y,z,px,py,pz,id,t,fol};px=x;py=y;pz=z;if(tx<ty&&tx<tz){x+=sx;t=tx;tx+=tdx;}else if(ty<tz){y+=sy;t=ty;ty+=tdy;}else{z+=sz;t=tz;tz+=tdz;}}return skipFol&&fol?{miss:1,fol,t:maxD}:null;}

/* ================= sky, sun, clouds ================= */
export function makeSky(scene,R){
 const skyGain={value:.5};const gainSky=m=>{m.onBeforeCompile=sh=>{sh.uniforms.skyGain=skyGain;sh.fragmentShader='uniform float skyGain;\n'+sh.fragmentShader.replace('gl_FragColor = vec4( retColor, 1.0 );','gl_FragColor = vec4( pow(retColor*skyGain,vec3(1.08)), 1.0 );');};};
 const mkSky=()=>{const s=new Sky();s.scale.setScalar(900);gainSky(s.material);const U=s.material.uniforms;U.turbidity.value=2.6;U.rayleigh.value=2.2;U.mieCoefficient.value=.004;U.mieDirectionalG.value=.86;return s;};
 const sky=mkSky();scene.add(sky);const skyScene=new THREE.Scene();const sky2=mkSky();skyScene.add(sky2);
 const sun=new THREE.DirectionalLight(0xfff0dd,2.4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-44,right:44,top:44,bottom:-44,near:1,far:240});sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
 const hemi=new THREE.HemisphereLight(0xbcd8ff,0x5a4a3a,.7);scene.add(hemi);
 scene.fog=new THREE.Fog(0xbcd8ff,40,RD*CS);
 const stars=(()=>{const g=new THREE.BufferGeometry(),p=[];for(let i=0;i<1500;i++){const a=Math.random()*6.283,e=Math.random()*1.5,r=380;p.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r);}g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.4,sizeAttenuation:false,transparent:true,fog:false,depthWrite:false}));})();scene.add(stars);
 const moon=new THREE.Mesh(new THREE.CircleGeometry(12,24),new THREE.MeshBasicMaterial({color:0xf2eedc,fog:false}));scene.add(moon);
 const cloudU={uTime:WU.uTime,uDay:{value:1},uSun:{value:new THREE.Color(1,1,1)}};
 const clouds=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),new THREE.ShaderMaterial({transparent:true,depthWrite:false,fog:false,side:THREE.DoubleSide,uniforms:cloudU,
  vertexShader:'varying vec2 vW;varying vec2 vL;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xz;vL=position.xy/500.;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uTime,uDay;uniform vec3 uSun;varying vec2 vW;varying vec2 vL;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
  void main(){vec2 p=vW/140.+vec2(uTime*.006,uTime*.002);float c=fbm(p),d=fbm(p*2.3+4.);float cov=smoothstep(.55,.8,c);float fade=1.-smoothstep(.55,1.,length(vL));
   vec3 lit=mix(vec3(.74,.78,.86),vec3(1.06),smoothstep(.5,.9,c+d*.25));vec3 col=lit*mix(vec3(.05,.06,.1),uSun,uDay);gl_FragColor=vec4(col,cov*fade*.88);}`}));
 clouds.rotation.x=-Math.PI/2;clouds.renderOrder=-1;scene.add(clouds);
 const pmrem=new THREE.PMREMGenerator(R);let envRT=null,envT=0;const sunDir=new THREE.Vector3();const fc=new THREE.Color();
 const SU=sky.material.uniforms;
 // dayT: 0..1 (0.25 = noon-ish rise). returns {day,night,warm}
 function update(dt,dayT,P,underwater){const a=dayT*Math.PI*2,el=Math.sin(a);sunDir.set(Math.cos(a)*.8,el,.4).normalize();SU.sunPosition.value.copy(sunDir);
  const day=sstep(-.12,.18,el);const moonUp=el<0;const ld=moonUp?sunDir.clone().negate():sunDir;sun.intensity=moonUp?.7*(1-day):2.7*day;
  sun.position.set(P.x+ld.x*100,P.y+ld.y*100,P.z+ld.z*100);sun.target.position.set(P.x,P.y,P.z);const warm=1-sstep(.02,.4,el);if(moonUp)sun.color.setRGB(.6,.72,1);else sun.color.setRGB(1,.93-warm*.3,.84-warm*.5);
  hemi.intensity=.36+.48*day;hemi.color.setRGB(.5+.25*day,.58+.24*day,.82+.1*day);hemi.groundColor.setRGB(.32*day+.08,.27*day+.07,.2*day+.1);
  fc.setRGB(.05+.5*day+.32*warm*day,.07+.66*day+.04*warm*day,.16+.78*day-.28*warm*day,THREE.SRGBColorSpace);scene.fog.color.copy(fc);R.setClearColor(fc);
  stars.material.opacity=1-sstep(-.2,.05,el);stars.position.set(P.x,P.y,P.z);clouds.position.set(Math.round(P.x/50)*50,CH+40,Math.round(P.z/50)*50);cloudU.uDay.value=day;cloudU.uSun.value.setRGB(1,.94-warm*.28,.9-warm*.45);
  moon.position.set(P.x-sunDir.x*300,P.y-sunDir.y*300,P.z-sunDir.z*300);moon.lookAt(P.x,P.y,P.z);sky.position.set(P.x,0,P.z);
  if(underwater){scene.fog.near=1;scene.fog.far=18;scene.fog.color.setRGB(.05,.2*day+.04,.35*day+.08);}else{scene.fog.near=RD*CS*.68;scene.fog.far=RD*CS+6;}
  if((envT-=dt)<=0){envT=8;sky2.material.uniforms.sunPosition.value.copy(sunDir);if(envRT)envRT.dispose();envRT=pmrem.fromScene(skyScene);scene.environment=envRT.texture;mat.envMapIntensity=.3*day+.05;}
  return{day,night:el<-.05,warm,el};}
 return{sky,sun,hemi,stars,moon,clouds,update,sunDir};}

/* ================= island map (for the minimap) ================= */
export function islandMap(size=150,span=440){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');const img=x.createImageData(size,size);
 const col={meadow:[118,170,80],forest:[66,120,58],desert:[220,196,128],snow:[236,242,250],highlands:[132,130,126],beach:[226,210,160]};
 for(let j=0;j<size;j++)for(let i=0;i<size;i++){const wx=Math.round((i/size-.5)*span),wz=Math.round((j/size-.5)*span);const T=terrain(wx,wz);let c3;
  if(T.h<=SEA){const dd=Math.max(0,Math.min(1,(SEA-T.h)/8));c3=[40-dd*14,110-dd*40,180-dd*50];}else{c3=col[T.biome]||[120,160,80];const sh=1+(T.h-SEA-6)*.012;c3=c3.map(v=>v*sh);if(T.zone&&Math.hypot(wx-T.zone.x,wz-T.zone.z)<T.zone.r-5)c3=[190,170,140];}
  const o=(j*size+i)*4;img.data[o]=c3[0];img.data[o+1]=c3[1];img.data[o+2]=c3[2];img.data[o+3]=255;}
 x.putImageData(img,0,0);return{canvas:c,size,span};}
